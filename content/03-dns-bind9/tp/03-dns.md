# TP 3 — Serveur DNS

> [!TIP] Ressource du TP
>
> - <a href="https://kayasam.github.io/linux-bases-services/telechargements/03-dns-bind9/tp/03-dns.md" download>Télécharger ce TP en Markdown</a>

> Chapitre associé : `Cours.md`
>
> Durée estimée : 1 h 30 — tests à réaliser depuis le serveur **et** un poste client

_**Consigne**_ :

1. Installer `bind9` et `bind9-dnsutils`
2. Configurer un forwarder vers un DNS public de votre choix (ex : 9.9.9.9)
3. Restreindre l'usage du serveur au seul réseau du laboratoire, afin de ne pas laisser un résolveur ouvert
    <details>
    <summary>Clique ici pour un indice</summary>
    Deux directives d'`options` : l'une contrôle qui peut interroger le serveur, l'autre qui peut lui demander d'aller chercher la réponse ailleurs. Toutes deux acceptent une liste d'adresses ou de réseaux.
    </details>
4. Créer la zone primaire statique `fournil.lab` dans `/etc/bind/db.fournil.lab`, à partir du modèle `/etc/bind/db.local` (`.local` est réservé à mDNS et ne doit pas être utilisé pour cette zone BIND)
5. Ajouter au moins : un enregistrement NS, un A pour `www`, un CNAME pour `ftp`
6. Créer la **zone inverse** du réseau `192.168.56.0/24`, avec un `PTR` pour le serveur (`192.168.56.200`) et un pour une machine `client1` en `192.168.56.210`
    <details>
    <summary>Réfléchir avant de coder</summary>
    `ns`, `www` et `mail` désignent tous <code>192.168.56.200</code>. Combien de <code>PTR</code> faut-il déclarer pour cette adresse, et lequel ?
    </details>
    <details>
    <summary>Clique ici pour un indice</summary>
    Le nom de la zone s'écrit à partir du réseau inversé, suivi de `in-addr.arpa`. Le modèle Debian correspondant est `/etc/bind/db.127`. À gauche de `PTR`, seul le dernier octet ; à droite, un nom complet terminé par un point.
    </details>
7. Vérifier la syntaxe des **deux** zones avant de démarrer le service
    <details>
    <summary>Clique ici pour un indice</summary>
    Une commande `named-check...` est spécifique à la vérification d'un fichier de zone (à distinguer de la vérification de la configuration globale). Elle se lance une fois par zone.
    </details>
8. Démarrer `named` et l'activer au démarrage
9. Tester la résolution de `www.fournil.lab` et `ftp.fournil.lab` avec `dig`, puis la résolution **inverse** de `192.168.56.200`
    <details>
    <summary>Clique ici pour un indice</summary>
    Une option de `dig` construit toute seule le nom en `in-addr.arpa` à partir d'une adresse IP.
    </details>
10. Déplacer `www` sur sa propre adresse `192.168.56.211`, lui ajouter le `PTR` correspondant, incrémenter les Serial, recharger et re-tester dans les deux sens
    <details>
    <summary>Clique ici pour un indice</summary>
    Valider d'abord la zone, augmenter le Serial puis utiliser `rndc reload`. Le Serial signale surtout la nouvelle version aux serveurs secondaires ; le TTL gouverne le cache des clients. Deux fichiers modifiés = deux Serial à incrémenter.
    </details>

### Défi de diagnostic

Une panne est introduite parmi : point final oublié dans le SOA/NS ou dans un `PTR`, accolade manquante, mauvais chemin de zone, type demandé absent, client exclu de `allow-query` ou port 53 filtré.

Sans consulter la correction :

1. formuler le symptôme avec le serveur et le type d'enregistrement testés ;
2. valider configuration et zone ;
3. vérifier le socket UDP/TCP 53 ;
4. interpréter le code retour de `dig` ;
5. corriger, recharger sans coupure et prouver depuis le client.

Livrable : commande en échec, message déterminant, cause, correction et réponse `dig +noall +answer` finale.
