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

> [!IMPORTANT] Choisir le répertoire selon la responsabilité du fichier
> Sur Debian, une **zone primaire statique** fait partie de la configuration administrée : son fichier est placé dans `/etc/bind/` et référencé avec un chemin absolu. `/var/cache/bind/` est le répertoire de travail de `named` ; il convient notamment aux copies de zones secondaires, que le démon peut recréer. Une zone primaire mise à jour dynamiquement doit être placée dans `/var/lib/bind/`, où BIND peut conserver la zone et son journal `.jnl`.
>
> La directive `directory "/var/cache/bind";` ne signifie donc pas que toutes les zones doivent y être enregistrées. Elle sert de base aux chemins relatifs et aux fichiers de travail. Un chemin absolu tel que `/etc/bind/db.founil.lab` n'en dépend pas.
>
> Source officielle : [README.Debian du paquet BIND9 — organisation des fichiers de zones](https://sources.debian.org/src/bind9/1%3A9.20.4-4/debian/README.Debian/).

---

### Configurer les forwarders

Dans `/etc/bind/named.conf.options` :

```text
options {
        directory "/var/cache/bind";

        forwarders {
                9.9.9.9;
                1.1.1.1;
        };

        dnssec-validation auto;
        listen-on { any; };
};
```

---

### Déclarer une zone

Dans `/etc/bind/named.conf.local` :

```text
zone "founil.lab" {
        type master;
        file "/etc/bind/db.founil.lab";
};
```

Créer la zone primaire statique à partir du modèle fourni par Debian, puis l'éditer :

```bash
sudo cp /etc/bind/db.local /etc/bind/db.founil.lab
sudoedit /etc/bind/db.founil.lab
```

Le fichier `/etc/bind/db.local` sert uniquement de modèle de syntaxe : toutes les valeurs relatives à `localhost` doivent être remplacées par celles de `founil.lab`.

Contenu attendu dans `/etc/bind/db.founil.lab` :

```text
$TTL    604800
@       IN      SOA     ns.founil.lab. admin.founil.lab. (
                              2       ; Serial (a incrementer a chaque modification)
                         604800       ; Refresh
                          86400       ; Retry
                        2419200       ; Expire
                         604800 )     ; Negative Cache TTL

@       IN      NS      ns.founil.lab.
ns      IN      A       192.168.56.200
www     IN      A       192.168.56.200
mail    IN      A       192.168.56.200
ftp     IN      CNAME   www
```

> [!WARNING]
> Le champ **Serial** doit être incrémenté à chaque modification afin que d'éventuels serveurs secondaires détectent une nouvelle version de la zone. Le cache des clients dépend, lui, des valeurs TTL. Une réponse ancienne peut donc persister jusqu'à expiration du TTL même si le serial a été augmenté.

> [!WARNING] `.local` est réservé à mDNS
> Les noms terminés par `.local` sont résolus par **mDNS** sur le lien local, notamment par Avahi, Bonjour et de nombreux postes clients. Les utiliser dans une zone BIND classique peut provoquer des réponses incohérentes ou empêcher la requête d'atteindre le serveur DNS configuré. Cette formation utilise donc la zone interne `founil.lab`. Elle est réservée au réseau isolé du laboratoire et ne doit pas être publiée comme un domaine Internet.

### Lire les principaux enregistrements

| Type         | Rôle                                    | Exemple                       |
| ------------ | --------------------------------------- | ----------------------------- |
| `A` / `AAAA` | nom vers IPv4 / IPv6                    | `www IN A 192.168.56.200`     |
| `CNAME`      | alias vers un autre nom                 | `ftp IN CNAME www`            |
| `MX`         | serveur recevant le courrier            | `@ IN MX 10 mail.founil.lab.` |
| `NS`         | serveur autoritaire de la zone          | `@ IN NS ns.founil.lab.`      |
| `PTR`        | adresse vers nom, dans une zone inverse | `200 IN PTR mail.founil.lab.` |
| `TXT`        | texte de politique ou validation        | SPF, validation de domaine    |

Le point final d'un nom complet est essentiel dans un fichier de zone. Sans lui, BIND ajoute le nom de la zone : `mail.founil.lab` sans point deviendrait `mail.founil.lab.founil.lab`.

---

### Vérifier, appliquer, tester

```bash
named-checkconf                                    # Vérifie la syntaxe globale
named-checkzone founil.lab /etc/bind/db.founil.lab

sudo rndc reload
sudo systemctl enable --now bind9

dig @192.168.56.200 www.founil.lab A
dig @192.168.56.200 ftp.founil.lab CNAME
dig @192.168.56.200 founil.lab SOA
host mail.founil.lab 192.168.56.200
```

`rndc reload` recharge les zones sans interrompre le service. Une fois la syntaxe validée, c'est préférable à un redémarrage complet.

### Interpréter `dig` et diagnostiquer

```bash
dig @192.168.56.200 www.founil.lab +noall +answer
dig @192.168.56.200 www.founil.lab +comments
ss -lunpt | grep ':53'
sudo journalctl -u bind9 --since "5 minutes ago"
```

| Résultat               | Signification probable                                                       |
| ---------------------- | ---------------------------------------------------------------------------- |
| `NOERROR` avec réponse | nom trouvé                                                                   |
| `NOERROR` sans réponse | nom/zone existe, mais pas le type demandé                                    |
| `NXDOMAIN`             | nom déclaré inexistant par le DNS                                            |
| `SERVFAIL`             | serveur incapable de produire la réponse : zone invalide, DNSSEC, forwarder… |
| délai puis timeout     | serveur/port inaccessible, pare-feu ou service absent                        |

Le drapeau `aa` indique une réponse autoritaire ; `ra` indique que la récursion est disponible. Tester aussi depuis une machine cliente : un succès local ne valide ni le pare-feu ni la configuration DNS distribuée aux postes.

Diagnostiquer :

```bash
systemctl status bind9
journalctl -u bind9
```

> [!NOTE]
> **À retenir**
>
> - Un serveur DNS est soit **autoritaire** (il héberge la zone), soit **relais** (il forwarde vers un autre DNS) — souvent les deux à la fois selon le domaine demandé.
> - `named-checkconf`/`named-checkzone` avant de redémarrer : une zone invalide empêche BIND9 de démarrer, mais silencieusement si on ne vérifie pas.
> - Le Serial doit être incrémenté à **chaque** modification de zone, sinon la mise à jour n'est jamais prise en compte par les clients (cache DNS).
