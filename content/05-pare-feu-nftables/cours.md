# 5. Pare-feu : nftables

**Objectifs** : comprendre le flux input/output/forward, écrire un jeu de règles nftables restrictif par défaut, et ne pas se couper l'accès SSH en le faisant.

![Parcours d'un paquet dans nftables](Ressources/images/parcours-nftables.svg)

> [!TIP] Lecture du schéma
> Pour un serveur non routeur, les connexions reçues traversent surtout `input` et les connexions initiées localement `output`. `forward` ne concerne que le trafic routé à travers la machine.

---

### Principe d'un pare-feu à chaînes

Un pare-feu filtre les paquets réseau selon des règles, organisées en **chaînes**, elles-mêmes regroupées en **tables**. `nftables` est le remplaçant moderne d'`iptables` sous Linux (dont Debian 12 par défaut).

Moyen mnémotechnique :

- **input** = paquets _à destination de_ cette machine
- **output** = paquets _émis par_ cette machine
- **forward** = paquets qui _traversent_ cette machine (routeur)

---

### Installation et commandes de base

```bash
sudo apt install -y nftables
sudo systemctl enable --now nftables
```

```bash
nft list ruleset              # Afficher les règles actuellement chargées
sudo nft flush ruleset        # Vider toutes les règles (attention en SSH à distance !)
```

---

### Écrire un jeu de règles

Fichier `/etc/nftables.conf` :

```text
#!/usr/sbin/nft -f

flush ruleset

table inet filter {
        chain input {
                type filter hook input priority 0; policy drop;

                ct state established,related accept
                iif lo accept

                tcp dport 22 accept    # SSH
                tcp dport 53 accept    # DNS (TCP)
                udp dport 53 accept    # DNS (UDP)
                tcp dport 80 accept    # HTTP

                ip protocol icmp accept
                ip6 nexthdr ipv6-icmp accept
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
sudo nft -f /etc/nftables.conf
nft list ruleset
```

Autoriser ICMP et ICMPv6 ne signifie pas seulement autoriser `ping` : ces protocoles transportent aussi des erreurs réseau et, en IPv6, des fonctions indispensables comme la découverte des voisins. Les bloquer aveuglément provoque des pannes difficiles à expliquer.

> [!WARNING]
> `policy drop` sur `input` bloque **tout** par défaut, y compris le SSH si la règle correspondante n'est pas (encore) chargée. Gardez toujours une session VirtualBox ouverte en local (pas seulement en SSH) en cas d'erreur de règle.

---

### Ajouter / retirer une règle ponctuellement

```bash
sudo nft add rule inet filter input tcp dport 443 accept

nft list ruleset -a                          # Afficher les regles avec leur "handle" (identifiant)
sudo nft delete rule inet filter input handle NUMERO
```

Rendre les changements persistants au redémarrage : sauvegarder l'état courant dans `/etc/nftables.conf`, chargé automatiquement par le service `nftables` au boot.

### Modifier sans se couper l'accès

Avant de charger un fichier complet :

```bash
sudo nft --check --file /etc/nftables.conf   # syntaxe uniquement
sudo nft list ruleset > /tmp/ruleset-avant.nft
sudo nft -f /etc/nftables.conf
sudo nft list ruleset
```

Conserver une console locale/hyperviseur et une seconde session SSH. En intervention distante, préparer également un mécanisme de retour arrière temporisé adapté à l'environnement avant d'appliquer la politique restrictive.

> [!WARNING] `flush ruleset` est global
> Il supprime aussi les tables éventuellement gérées par un hyperviseur, un conteneur, un VPN ou un autre outil. Sur une machine réelle partagée, inventorier le ruleset et ses propriétaires avant d'utiliser cette instruction.

### Prouver qu'une règle est utilisée

Les compteurs transforment une supposition en observation :

```text
tcp dport 22 counter accept comment "Administration SSH"
tcp dport 80 counter accept comment "Site HTTP du laboratoire"
```

```bash
sudo nft -a list chain inet filter input
ss -lntup
nc -vz 192.168.56.200 22
curl -v http://192.168.56.200/
```

Si le compteur de la règle n'augmente pas pendant le test, le paquet n'a pas suivi ce chemin : vérifier famille IPv4/IPv6, interface, adresse cible et chaîne. S'il augmente mais que le service échoue, poursuivre au niveau du socket et de l'application.

### Ordre et état de connexion

nftables évalue les règles dans l'ordre ; le premier verdict terminal (`accept`, `drop`, `reject`) décide. `ct state established,related accept` laisse revenir les paquets appartenant aux connexions déjà autorisées. `ct state invalid drop` peut être placé avant les autorisations pour écarter les paquets non rattachables à une connexion cohérente.

> [!NOTE]
> **À retenir**
>
> - `policy drop` sur `input` = tout est bloqué sauf ce qui est explicitement autorisé — la seule approche sûre pour un pare-feu exposé.
> - `ct state established,related accept` est indispensable : sans elle, même les réponses à vos propres requêtes sortantes seraient bloquées.
> - Une règle ajoutée à chaud (`nft add rule`) ne survit pas au redémarrage tant qu'elle n'est pas aussi écrite dans `/etc/nftables.conf`.
