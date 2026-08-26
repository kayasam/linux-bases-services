# 3. Service DNS (BIND9)

**Objectifs** : installer un serveur DNS BIND9, comprendre le rôle d'un forwarder et d'une zone, créer/modifier des enregistrements, et diagnostiquer une résolution qui échoue.

![Résolution DNS locale et transfert](Ressources/images/resolution-dns.svg)

> [!TIP] Lecture du schéma
> Toujours identifier le serveur réellement interrogé. `dig @192.168.56.200 NOM` teste directement BIND ; `dig NOM` teste la configuration DNS du poste client, ce qui ajoute une couche de panne possible.

---

### Rôle d'un serveur DNS

Le DNS (_Domain Name System_) traduit un nom de domaine en adresse IP (et inversement). Un serveur DNS peut :

- répondre directement pour les domaines dont il est **autoritaire** (zones qu'il héberge)
- **relayer** (forwarder) les autres requêtes vers un DNS externe (ex : celui du FAI ou 9.9.9.9)

Un **serveur autoritaire** possède la source de vérité d'une zone. Un **résolveur récursif** cherche une réponse pour le client et la met en cache pendant le TTL. BIND peut assurer les deux rôles en laboratoire, mais ils sont souvent séparés en production pour réduire l'exposition et clarifier les responsabilités.

---

### Installation et fichiers de configuration

```bash
sudo apt install -y bind9 bind9-dnsutils
```

| Fichier                        | Rôle                                                                                        |
| ------------------------------ | ------------------------------------------------------------------------------------------- |
| `/etc/bind/named.conf`         | Point d'entrée, inclut les fichiers ci-dessous                                              |
| `/etc/bind/named.conf.options` | Options globales (forwarders, écoute réseau, ...)                                           |
| `/etc/bind/named.conf.local`   | Déclaration des zones hébergées localement                                                  |
| `/etc/bind/db.NOM_DE_ZONE`     | Zone primaire statique administrée manuellement                                             |
| `/var/cache/bind/`             | Répertoire de travail et données transitoires, notamment les zones secondaires téléchargées |
| `/var/lib/bind/`               | Zones que BIND doit modifier durablement, par exemple avec DDNS ou `nsupdate`               |

![Les fichiers de configuration de BIND9 et leur rôle](Ressources/images/fichiers-bind9.svg)

> [!TIP] Lecture du schéma
> Trois questions suffisent à retrouver le bon fichier, dans cet ordre :
>
> 1. **Est-ce que je décris le comportement du serveur, ou le contenu d'un domaine ?** Le comportement (forwarders, écoute, DNSSEC) vit dans `named.conf.options` ; le contenu (les machines) vit dans un fichier `db.*`.
> 2. **Est-ce que je déclare une zone, ou est-ce que je la remplis ?** `named.conf.local` déclare (son nom, son type, où trouver son fichier) et ne contient jamais d'enregistrement. Le fichier `db.*` contient les enregistrements et ignore tout de la déclaration.
> 3. **Qui écrit ce fichier : moi ou `named` ?** Ce que j'écris va dans `/etc/bind/`, ce que `named` télécharge va dans `/var/cache/bind/`, ce que `named` met à jour va dans `/var/lib/bind/`.
>
> Chaque étage a son validateur : `named-checkconf` pour les `named.conf*`, `named-checkzone` pour un fichier `db.*`. Une erreur dans une zone n'est donc **jamais** détectée par `named-checkconf` seul.

> [!IMPORTANT] Choisir le répertoire selon la responsabilité du fichier
> Sur Debian, une **zone primaire statique** fait partie de la configuration administrée : son fichier est placé dans `/etc/bind/` et référencé avec un chemin absolu. `/var/cache/bind/` est le répertoire de travail de `named` ; il convient notamment aux copies de zones secondaires, que le démon peut recréer. Une zone primaire mise à jour dynamiquement doit être placée dans `/var/lib/bind/`, où BIND peut conserver la zone et son journal `.jnl`.
>
> La directive `directory "/var/cache/bind";` ne signifie donc pas que toutes les zones doivent y être enregistrées. Elle sert de base aux chemins relatifs et aux fichiers de travail. Un chemin absolu tel que `/etc/bind/db.fournil.lab` n'en dépend pas.
>
> Source officielle : [README.Debian du paquet BIND9 — organisation des fichiers de zones](https://sources.debian.org/src/bind9/1%3A9.20.4-4/debian/README.Debian/).

---

### Configurer les forwarders et restreindre l'accès

Dans `/etc/bind/named.conf.options` :

```text
options {
        directory "/var/cache/bind";

        forwarders {
                9.9.9.9;
                1.1.1.1;
        };

        // Qui a le droit d'interroger ce serveur
        allow-query     { localhost; 192.168.56.0/24; };
        allow-recursion { localhost; 192.168.56.0/24; };

        dnssec-validation auto;
        listen-on { any; };
};
```

> [!WARNING] Ne jamais laisser un résolveur ouvert
> `listen-on { any; }` combiné à des `forwarders` **sans restriction** produit un _open resolver_ : n'importe qui sur le réseau peut faire résoudre n'importe quoi par votre serveur. C'est le principal vecteur d'attaque par **amplification DNS** (une requête de 60 octets peut déclencher une réponse de plusieurs kilo-octets, envoyée à une victime dont l'adresse a été usurpée).
>
> `allow-query` définit qui peut interroger le serveur, `allow-recursion` qui peut lui demander d'aller chercher une réponse ailleurs. Un serveur **autoritaire public** doit accepter les requêtes du monde entier mais refuser toute récursion ; un **résolveur interne** comme celui du laboratoire n'accepte que son propre réseau. Le réflexe se prend dès le TP, pas en production.

---

### Déclarer une zone

Dans `/etc/bind/named.conf.local` :

```text
zone "fournil.lab" {
        type primary;
        file "/etc/bind/db.fournil.lab";
};
```

> [!NOTE] `primary` / `secondary` ou `master` / `slave` ?
> Ce cours emploie `primary`, la terminologie retenue par la documentation officielle de BIND depuis la version **9.16** (Debian 11 et suivantes). `master` et `slave` restent acceptés et sont strictement équivalents : c'est ce que vous rencontrerez dans la quasi-totalité des configurations existantes et des tutoriels en ligne. Savoir lire les deux est indispensable.
>
> Attention en revanche sur un système plus ancien (Debian 10, CentOS 7, BIND 9.11) : `primary` y est une **erreur de syntaxe**, seul `master` fonctionne. Le cas se présente encore sur des serveurs en production non migrés — `named-checkconf` vous le signalera immédiatement.

Créer la zone primaire statique à partir du modèle fourni par Debian, puis l'éditer :

```bash
sudo cp /etc/bind/db.local /etc/bind/db.fournil.lab
sudoedit /etc/bind/db.fournil.lab
```

Le fichier `/etc/bind/db.local` sert uniquement de modèle de syntaxe : toutes les valeurs relatives à `localhost` doivent être remplacées par celles de `fournil.lab`.

Contenu attendu dans `/etc/bind/db.fournil.lab` :

```text
$TTL    604800
@       IN      SOA     ns.fournil.lab. admin.fournil.lab. (
                              2       ; Serial (a incrementer a chaque modification)
                         604800       ; Refresh
                          86400       ; Retry
                        2419200       ; Expire
                         604800 )     ; Negative Cache TTL

@       IN      NS      ns.fournil.lab.
ns      IN      A       192.168.56.200
www     IN      A       192.168.56.200
mail    IN      A       192.168.56.200
ftp     IN      CNAME   www
```

> [!WARNING]
> Le champ **Serial** doit être incrémenté à chaque modification afin que d'éventuels serveurs secondaires détectent une nouvelle version de la zone. Le cache des clients dépend, lui, des valeurs TTL. Une réponse ancienne peut donc persister jusqu'à expiration du TTL même si le serial a été augmenté.

> [!WARNING] `.local` est réservé à mDNS
> Les noms terminés par `.local` sont résolus par **mDNS** sur le lien local, notamment par Avahi, Bonjour et de nombreux postes clients. Les utiliser dans une zone BIND classique peut provoquer des réponses incohérentes ou empêcher la requête d'atteindre le serveur DNS configuré. Cette formation utilise donc la zone interne `fournil.lab`. Elle est réservée au réseau isolé du laboratoire et ne doit pas être publiée comme un domaine Internet.

### Lire les principaux enregistrements

| Type         | Rôle                                    | Exemple                        |
| ------------ | --------------------------------------- | ------------------------------ |
| `A` / `AAAA` | nom vers IPv4 / IPv6                    | `www IN A 192.168.56.200`      |
| `CNAME`      | alias vers un autre nom                 | `ftp IN CNAME www`             |
| `MX`         | serveur recevant le courrier            | `@ IN MX 10 mail.fournil.lab.` |
| `NS`         | serveur autoritaire de la zone          | `@ IN NS ns.fournil.lab.`      |
| `PTR`        | adresse vers nom, dans une zone inverse | `200 IN PTR mail.fournil.lab.` |
| `TXT`        | texte de politique ou validation        | SPF, validation de domaine     |

Le point final d'un nom complet est essentiel dans un fichier de zone. Sans lui, BIND ajoute le nom de la zone : `mail.fournil.lab` sans point deviendrait `mail.fournil.lab.fournil.lab`.

---

### Déclarer la zone inverse

La zone directe traduit un nom en adresse. La **zone inverse** fait le trajet opposé : de l'adresse vers le nom. C'est une zone **distincte**, avec son propre fichier — ajouter un enregistrement `A` ne crée jamais le `PTR` correspondant.

Elle n'est pas un luxe : les journaux système, les serveurs de messagerie (un `PTR` absent ou incohérent fait classer le courrier en spam), `ssh` et de nombreux outils de supervision affichent des noms obtenus par résolution inverse.

Son nom est construit à partir du réseau, **écrit à l'envers**, suivi de `in-addr.arpa`. Pour le réseau `192.168.56.0/24` :

```text
192.168.56  →  56.168.192.in-addr.arpa
```

Dans `/etc/bind/named.conf.local`, à la suite de la zone directe :

```text
zone "56.168.192.in-addr.arpa" {
        type primary;
        file "/etc/bind/db.192.168.56";
};
```

Créer le fichier à partir du modèle inverse fourni par Debian :

```bash
sudo cp /etc/bind/db.127 /etc/bind/db.192.168.56
sudoedit /etc/bind/db.192.168.56
```

Contenu attendu dans `/etc/bind/db.192.168.56` :

```text
$TTL    604800
@       IN      SOA     ns.fournil.lab. admin.fournil.lab. (
                              1       ; Serial
                         604800       ; Refresh
                          86400       ; Retry
                        2419200       ; Expire
                         604800 )     ; Negative Cache TTL

@       IN      NS      ns.fournil.lab.
200     IN      PTR     ns.fournil.lab.
210     IN      PTR     client1.fournil.lab.
```

À gauche, `200` est le **dernier octet** de l'adresse : la zone fournit déjà les trois premiers. À droite, le nom est complet et **se termine impérativement par un point** — c'est l'erreur la plus fréquente dans une zone inverse, et elle produit un `PTR` du type `ns.fournil.lab.56.168.192.in-addr.arpa`.

> [!IMPORTANT] La relation n'est pas symétrique
> Plusieurs noms peuvent pointer vers une même adresse : dans la zone directe, `ns`, `www` et `mail` valent tous `192.168.56.200`. Dans l'autre sens, on ne déclare **qu'un seul `PTR` par adresse**, celui du nom canonique de la machine — ici `ns.fournil.lab.`. Plusieurs `PTR` pour une même adresse sont techniquement acceptés mais déconseillés : les vérifications inverses des serveurs de messagerie et des outils de sécurité attendent une réponse unique et deviennent imprévisibles sinon.

Valider la zone dès maintenant :

```bash
named-checkzone 56.168.192.in-addr.arpa /etc/bind/db.192.168.56
```

Puis, une fois le service démarré (section suivante), tester la résolution inverse :

```bash
dig @192.168.56.200 -x 192.168.56.200 +noall +answer
```

`dig -x` construit le nom `in-addr.arpa` à votre place : c'est la commande à retenir pour tester une zone inverse.

> [!TIP] Une machine, deux enregistrements
> Ajouter un serveur, c'est **deux** modifications et **deux** Serial à incrémenter : le `A` dans `db.fournil.lab` et le `PTR` dans `db.192.168.56`. Un `A` sans `PTR` est une incohérence classique, invisible tant qu'on ne teste qu'avec `dig nom`.

---

### Vérifier, appliquer, tester

```bash
# 1. Valider AVANT de toucher au service
named-checkconf                                    # syntaxe des fichiers named.conf*
named-checkzone fournil.lab /etc/bind/db.fournil.lab
named-checkzone 56.168.192.in-addr.arpa /etc/bind/db.192.168.56

# 2. Premier démarrage + activation au boot
sudo systemctl enable --now named

# 3. Ensuite seulement, pour chaque modification suivante : recharger sans coupure
sudo rndc reload

# 4. Tester
dig @192.168.56.200 www.fournil.lab A
dig @192.168.56.200 ftp.fournil.lab CNAME
dig @192.168.56.200 fournil.lab SOA
dig @192.168.56.200 -x 192.168.56.200
host mail.fournil.lab 192.168.56.200
```

L'ordre compte : `rndc reload` s'adresse à un service **déjà démarré**. Au premier déploiement on démarre donc le service, et c'est seulement lors des modifications ultérieures que `rndc reload` remplace avantageusement un `restart` — il recharge les zones sans interrompre les réponses en cours.

> [!NOTE] `named` ou `bind9` ?
> Sur Debian 12 et suivantes, l'unité systemd réelle s'appelle **`named.service`** ; `bind9.service` n'en est qu'un alias conservé pour compatibilité. Les deux fonctionnent avec `systemctl`, mais `journalctl -u named` est plus fiable : selon les versions, `journalctl -u bind9` peut ne rien retourner alors que le service tourne.

### Interpréter `dig` et diagnostiquer

```bash
dig @192.168.56.200 www.fournil.lab +noall +answer   # la réponse, sans le bruit
dig @192.168.56.200 www.fournil.lab +comments       # les drapeaux et le code retour
systemctl status named                             # le service tourne-t-il ?
ss -lunpt | grep ':53'                             # écoute-t-il vraiment sur 53 ?
sudo journalctl -u named --since "5 minutes ago"   # qu'a-t-il refusé, et pourquoi ?
```

| Résultat               | Signification probable                                                               |
| ---------------------- | ------------------------------------------------------------------------------------ |
| `NOERROR` avec réponse | nom trouvé                                                                           |
| `NOERROR` sans réponse | nom/zone existe, mais pas le type demandé                                            |
| `NXDOMAIN`             | nom déclaré inexistant par le DNS                                                    |
| `SERVFAIL`             | serveur incapable de produire la réponse : zone invalide, DNSSEC, forwarder…         |
| `REFUSED`              | le serveur répond mais refuse : `allow-query` / `allow-recursion` excluent le client |
| délai puis timeout     | serveur/port inaccessible, pare-feu ou service absent                                |

Le drapeau `aa` indique une réponse autoritaire ; `ra` indique que la récursion est disponible. Tester aussi depuis une machine cliente : un succès local ne valide ni le pare-feu ni la configuration DNS distribuée aux postes.

> [!NOTE]
> **À retenir**
>
> - Un serveur DNS est soit **autoritaire** (il héberge la zone), soit **relais** (il forwarde vers un autre DNS) — souvent les deux à la fois selon le domaine demandé.
> - `named-checkconf`/`named-checkzone` avant de redémarrer : une zone invalide empêche BIND9 de démarrer, mais silencieusement si on ne vérifie pas. `named-checkconf` ne lit pas les fichiers de zone : les deux commandes sont complémentaires.
> - Le Serial doit être incrémenté à **chaque** modification de zone, sinon la mise à jour n'est jamais prise en compte par les clients (cache DNS).
> - La **zone inverse** est une zone à part entière : un `A` ne crée pas le `PTR`. Une machine = deux enregistrements, dans deux fichiers, avec deux Serial.
> - `allow-query` / `allow-recursion` limitent le serveur à son réseau. Sans elles, un résolveur ouvert devient un relais d'attaque par amplification.

---

### Pour aller plus loin

- [DNS avec BIND 9 — IT-Connect](https://www.it-connect.fr/dns-avec-bind-9/) : la même démarche sur Debian, présentée différemment — utile pour confronter deux façons de faire. Les tests y sont menés avec `nslookup` plutôt que `dig`, et la zone inverse y est nommée `db.reverse.<zone>` : la convention de nommage du fichier est libre, seul le nom déclaré dans `named.conf.local` compte. Trois réserves : l'article utilise une zone en `.local` (voir l'avertissement mDNS plus haut), ne restreint pas `allow-query`, et écrit `type master` — l'occasion de vérifier que vous savez lire les deux terminologies.
- [README.Debian du paquet BIND9](https://sources.debian.org/src/bind9/1%3A9.20.4-4/debian/README.Debian/) : l'organisation officielle des fichiers de zone entre `/etc/bind/`, `/var/cache/bind/` et `/var/lib/bind/`.
- [BIND 9 Administrator Reference Manual](https://bind9.readthedocs.io/en/latest/chapter3.html) : la référence complète des directives de `named.conf`.
