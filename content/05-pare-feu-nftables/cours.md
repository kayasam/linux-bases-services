# 5. Pare-feu : nftables

**Objectifs** : comprendre le flux input/output/forward, écrire un jeu de règles nftables restrictif par défaut, et ne pas se couper l'accès SSH en le faisant.

Le serveur `www.fournil.lab` construit aux chapitres 3 et 4 est aujourd'hui **grand ouvert** : tout port sur lequel un service écoute est joignable par n'importe qui. Ce chapitre consiste à décider, port par port, qui a le droit d'entrer — et à le faire sans perdre la main sur la machine.

![Parcours d'un paquet dans nftables](Ressources/images/parcours-nftables.svg)

> [!TIP] Lecture du schéma
> Pour un serveur non routeur, les connexions reçues traversent surtout `input` et les connexions initiées localement `output`. `forward` ne concerne que le trafic routé à travers la machine.

---

### Principe d'un pare-feu à chaînes

Un pare-feu filtre les paquets réseau selon des règles, organisées en **chaînes**, elles-mêmes regroupées en **tables**. `nftables` est le remplaçant moderne d'`iptables` sous Linux, installé par défaut sur Debian 12 et 13.

Le modèle mental utile est celui d'un **videur à l'entrée d'un établissement**, avec une liste à la main :

- il lit sa liste **de haut en bas** ;
- il s'arrête **à la première ligne qui correspond** à la personne devant lui, et applique la décision de cette ligne ;
- si aucune ligne ne correspond, il applique la **consigne par défaut** qu'on lui a donnée en arrivant.

Ces trois phrases décrivent exactement le fonctionnement de nftables. Tout le reste n'est que vocabulaire.

Moyen mnémotechnique pour les trois chaînes :

- **input** = paquets _à destination de_ cette machine
- **output** = paquets _émis par_ cette machine
- **forward** = paquets qui _traversent_ cette machine (routeur)

---

### Le vocabulaire, en une ligne

Toute la structure de nftables tient dans la première ligne d'une chaîne. Elle paraît obscure, mais chaque mot répond à une question simple :

```text
table inet filter {
        chain input {
                type filter hook input priority 0; policy drop;
```

| Mot                     | Question                                                               | Réponse ici                                                                              |
| ----------------------- | ---------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| `table`                 | Dans quel **classeur** range-t-on les règles ?                         | —                                                                                        |
| `inet`                  | Quelle **famille d'adresses** ?                                        | `inet` = IPv4 **et** IPv6 dans la même table. C'est ce qu'on veut presque toujours.      |
| `filter` (après `inet`) | Quel **nom** donne-t-on à cette table ?                                | Un nom libre. Par convention, `filter`.                                                  |
| `chain input`           | Quel **intercalaire** dans le classeur ?                               | Un nom libre là aussi, mais on le nomme comme son hook pour rester lisible.              |
| `type filter`           | Pour **quoi faire** ?                                                  | Filtrer — par opposition à `nat` (traduction d'adresses) ou `route`.                     |
| `hook input`            | **À quel moment** du trajet du paquet cette chaîne est-elle appelée ?  | À l'entrée, pour les paquets destinés à cette machine. C'est le mot qui compte vraiment. |
| `priority 0`            | Si plusieurs chaînes s'accrochent au même hook, **laquelle d'abord** ? | `0` est la priorité standard du filtrage. Le plus petit nombre passe en premier.         |
| `policy drop`           | Que faire si **aucune règle** n'a tranché ?                            | Jeter le paquet.                                                                         |

> [!IMPORTANT] La distinction qui débloque tout le reste
> Une **règle** est lue dans l'ordre et peut rendre un verdict. La **politique** (`policy`) n'est _pas_ une règle : c'est ce qui s'applique lorsqu'on est arrivé au bout de la chaîne sans qu'aucune règle n'ait tranché. Autrement dit : les règles sont la liste du videur, la politique est sa consigne par défaut.

---

### Installation et commandes de base

```bash
sudo apt install -y nftables
sudo systemctl enable --now nftables
```

```bash
sudo nft list ruleset          # Afficher les règles actuellement chargées
sudo nft flush ruleset         # Vider toutes les règles (attention en SSH à distance !)
```

> [!WARNING] `nft` exige les droits root, même pour lire
> Lire le jeu de règles demande la capacité `CAP_NET_ADMIN` : `nft list ruleset` sans `sudo` échoue avec `Operation not permitted`. Sur Debian 12, le binaire vit dans `/usr/sbin`, absent du `PATH` d'un utilisateur normal : l'erreur sera même `command not found`. **Avec nftables, on préfixe systématiquement par `sudo`.**

---

### Écrire un jeu de règles

Fichier `/etc/nftables.conf` :

```bash
#!/usr/sbin/nft -f

flush ruleset

table inet filter {
        chain input {
                type filter hook input priority 0; policy drop;

                ct state established,related counter accept comment "Retour de mes connexions"
                ct state invalid counter drop comment "Paquets incoherents"
                iif lo counter accept comment "Boucle locale"

                ip protocol icmp counter accept comment "ICMPv4"
                ip6 nexthdr ipv6-icmp counter accept comment "ICMPv6"

                tcp dport 22 counter accept comment "Administration SSH"
                tcp dport 53 counter accept comment "DNS TCP"
                udp dport 53 counter accept comment "DNS UDP"
                tcp dport 80 counter accept comment "Site du fournil"
        }

        chain forward {
                type filter hook forward priority 0; policy drop;
        }

        chain output {
                type filter hook output priority 0; policy accept;
        }
}
```

```bash
sudo nft --check --file /etc/nftables.conf   # Vérifie la syntaxe sans rien appliquer
sudo nft -f /etc/nftables.conf               # Charge le fichier
sudo nft list ruleset                        # Affiche ce qui est réellement dans le noyau
```

> [!TIP] `nft -f` est atomique
> Le fichier passe **en entier ou pas du tout**. Une erreur à la ligne 12 laisse le jeu de règles précédent intact — nftables ne charge jamais « la moitié » d'une configuration. C'est un progrès majeur par rapport à `iptables`, qui appliquait les règles une par une et pouvait laisser la machine dans un état intermédiaire.

Quelques lignes méritent un commentaire :

- **`iif lo accept`** autorise la boucle locale. Beaucoup de services se parlent à eux-mêmes par `127.0.0.1` (sondes de supervision, scripts, agents). Oublier cette ligne provoque des pannes locales très déroutantes, alors que le service répond parfaitement depuis l'extérieur.
- **ICMP et ICMPv6** ne servent pas seulement à `ping` : ces protocoles transportent aussi les erreurs réseau et, en IPv6, des fonctions indispensables comme la découverte des voisins. Les bloquer aveuglément provoque des pannes difficiles à expliquer.
- **`ct state invalid drop`** écarte tôt les paquets que le noyau n'arrive à rattacher à aucune connexion cohérente.
- Les ports du **chapitre 6** (messagerie : 25, 143…) sont volontairement absents. Ils seront ajoutés quand le service existera — on n'ouvre pas une porte « au cas où ».

> [!WARNING]
> `policy drop` sur `input` bloque **tout** par défaut, y compris le SSH si la règle correspondante n'est pas (encore) chargée. Gardez toujours une session VirtualBox ouverte en local (pas seulement en SSH) en cas d'erreur de règle.

> [!WARNING] `flush ruleset` est global
> Il supprime aussi les tables éventuellement gérées par un hyperviseur, un conteneur, un VPN ou un autre outil. Sur une machine réelle partagée, inventorier le ruleset et ses propriétaires avant d'utiliser cette instruction.

---

### Le suivi de connexion : la ligne qu'on ne comprend pas et qui fait tout

`ct state established,related accept` est la règle la plus importante du fichier, et la plus mal comprise. Le scénario suivant l'explique.

La chaîne `output` est en `policy accept` : le serveur a donc le droit d'émettre ce qu'il veut. Il lance `apt update`, qui ouvre une connexion vers le port 80 d'un dépôt Debian. La requête part sans difficulté.

Mais **la réponse doit revenir**, et une réponse qui revient est un paquet **entrant** — donc soumis à la chaîne `input`. Or elle n'arrive pas sur le port 80 : elle arrive sur le **port source aléatoire** que le noyau avait choisi pour émettre, par exemple 51324. Aucune règle n'autorise le port 51324. Sans `ct state established,related`, cette réponse est jetée, et `apt update` échoue — alors que la sortie était pourtant autorisée.

Un pare-feu incapable de suivre les connexions obligerait à ouvrir en entrée **tous les ports hauts**, c'est-à-dire à ne plus filtrer grand-chose. C'est pour cela que `ct state` existe.

| État          | Signification                                                                           |
| ------------- | --------------------------------------------------------------------------------------- |
| `new`         | premier paquet d'une connexion : c'est lui que filtrent les règles `tcp dport …`        |
| `established` | paquet appartenant à une connexion déjà acceptée                                        |
| `related`     | paquet lié à une connexion existante (erreur ICMP la concernant, canal de données FTP…) |
| `invalid`     | paquet que le noyau ne rattache à aucune connexion cohérente                            |

> [!TIP] Conséquence pratique à retenir
> Seul le **premier** paquet d'une connexion est réellement filtré par les règles de port. Tous les suivants sont reconnus par `ct state`. C'est pourquoi cette règle est placée **en tête de chaîne** : c'est de très loin la plus empruntée, et la mettre en premier évite de parcourir toute la liste à chaque paquet.
>
> C'est aussi pourquoi supprimer la règle `tcp dport 22 accept` **ne coupe pas** une session SSH déjà ouverte : elle est `established`. Seule une _nouvelle_ connexion échouera.

---

### `drop` ou `reject` : le silence ou la porte claquée

Deux façons de refuser un paquet, très différentes vues du client :

| Verdict  | Ce que le client perçoit                                     | Quand l'utiliser                                                                |
| -------- | ------------------------------------------------------------ | ------------------------------------------------------------------------------- |
| `drop`   | rien du tout, puis un délai dépassé après plusieurs secondes | face à Internet : ne renseigne pas un scanner et ralentit les balayages         |
| `reject` | « connexion refusée », immédiatement                         | en réseau interne : évite de faire attendre 30 s une application mal configurée |

```bash
sudo nft add rule inet filter input tcp dport 8080 counter reject
```

> [!NOTE] Ne pas confondre « fermé » et « filtré »
> Un port sur lequel **aucun service n'écoute** répond déjà « connexion refusée », sans aucun pare-feu : c'est le noyau qui renvoie un RST. Un port **filtré par `drop`**, lui, ne répond rien. Distinguer les deux est exactement ce que cherche à faire un scanner de ports — et ce qu'un administrateur doit savoir lire.

---

### L'ordre des règles

nftables évalue les règles **dans l'ordre** ; le premier verdict terminal (`accept`, `drop`, `reject`) décide, et la lecture s'arrête là. Une règle placée après un verdict qui a déjà tranché ne sera **jamais atteinte**.

C'est la cause la plus fréquente de « ma règle est pourtant bien dans le fichier, et ça ne marche pas ». Les compteurs permettent de le prouver plutôt que de le supposer : si le compteur d'une règle reste figé pendant un test, cette règle n'est pas sur le chemin du paquet.

```bash
sudo nft insert rule inet filter input tcp dport 80 counter drop   # insert = en TÊTE de chaîne
sudo nft add rule inet filter input tcp dport 80 counter drop      # add    = en FIN de chaîne
```

---

### Ajouter / retirer une règle ponctuellement

```bash
sudo nft add rule inet filter input tcp dport 443 counter accept

sudo nft list ruleset -a                     # Afficher les règles avec leur "handle" (identifiant)
sudo nft delete rule inet filter input handle NUMERO
```

> [!WARNING] Les handles changent
> Ils sont réattribués à chaque rechargement du ruleset. Toujours relancer `nft -a list chain …` **juste avant** un `delete`, jamais réutiliser un numéro relevé cinq minutes plus tôt.

---

### Persistance : deux états à ne pas confondre

Une règle ajoutée avec `nft add rule` vit **uniquement en mémoire**. Le service `nftables` se contente de recharger `/etc/nftables.conf` au démarrage : tout ce qui ne figure pas dans ce fichier disparaît au premier `systemctl restart nftables` ou au premier redémarrage.

```bash
systemctl cat nftables      # Montre que l'unité ne fait que « nft -f /etc/nftables.conf »
```

Comme pour le réseau ou les montages, il y a **l'état courant** (dans le noyau) et **l'état au prochain démarrage** (dans le fichier). Une intervention n'est terminée que lorsque les deux coïncident.

> [!WARNING] Le raccourci qui casse tout
> On lit souvent le conseil `nft list ruleset > /etc/nftables.conf`. La sortie de `list` ne contient **ni la ligne `#!/usr/sbin/nft -f`, ni `flush ruleset`** : au rechargement suivant, les règles s'**ajoutent** aux existantes au lieu de les remplacer, et le fichier se remplit de doublons. Les valeurs de compteurs y sont en plus figées en dur. Si l'on tient à cette méthode, utiliser `nft -s list ruleset` (_stateless_) et **réécrire l'en-tête à la main**.

---

### Modifier sans se couper l'accès

Avant de charger un fichier complet :

```bash
sudo nft --check --file /etc/nftables.conf   # syntaxe uniquement
sudo nft list ruleset > /tmp/ruleset-avant.nft
sudo nft -f /etc/nftables.conf
sudo nft list ruleset
```

Conserver une console locale/hyperviseur **et** une seconde session SSH. Surtout, avant d'appliquer une politique restrictive à distance, **programmer son annulation automatique** :

```bash
sudo systemd-run --on-active=300 /usr/sbin/nft flush ruleset
```

La commande crée un minuteur systemd jetable et affiche son nom (`Running timer as unit: run-rXXXX.timer`). Si la nouvelle configuration coupe l'accès, la machine vide ses règles toute seule au bout de cinq minutes et rend la main. Si tout fonctionne, désarmer :

```bash
sudo systemctl stop run-rXXXX.timer
```

> [!TIP] Règle de métier
> Avant toute politique restrictive appliquée à distance : d'abord le filet, ensuite la modification, puis la **preuve** que l'accès fonctionne (une **nouvelle** connexion, pas la session en cours), et seulement alors le désarmement.

---

### Prouver qu'une règle est utilisée

Les compteurs transforment une supposition en observation :

```text
tcp dport 22 counter accept comment "Administration SSH"
tcp dport 80 counter accept comment "Site HTTP du laboratoire"
```

```bash
sudo nft -a list chain inet filter input
sudo ss -lntup
nc -vz 192.168.56.200 22
curl -v http://192.168.56.200/
```

Si le compteur de la règle n'augmente pas pendant le test, le paquet n'a pas suivi ce chemin : vérifier famille IPv4/IPv6, interface, adresse cible, chaîne et **position dans la chaîne**. S'il augmente mais que le service échoue, poursuivre au niveau du socket et de l'application.

---

> [!NOTE]
> **À retenir**
>
> - `policy drop` sur `input` = tout est bloqué sauf ce qui est explicitement autorisé — la seule approche sûre pour un pare-feu exposé.
> - `policy` n'est pas une règle : c'est ce qui s'applique quand **aucune** règle n'a tranché.
> - Les règles sont lues **de haut en bas**, et la lecture s'arrête au **premier verdict terminal**.
> - `ct state established,related accept` est indispensable : sans elle, même les réponses à vos propres requêtes sortantes seraient bloquées.
> - `drop` ne répond rien, `reject` répond « non ». Ce n'est pas la même information donnée au client.
> - Un **compteur** figé pendant un test prouve que la règle n'est pas sur le chemin du paquet.
> - Une règle ajoutée à chaud (`nft add rule`) ne survit pas au redémarrage tant qu'elle n'est pas aussi écrite dans `/etc/nftables.conf`.
> - Avant une politique restrictive à distance : `systemd-run --on-active=300 … nft flush ruleset`.
