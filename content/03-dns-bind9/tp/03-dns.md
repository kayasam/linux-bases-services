# TP 3 — Serveur DNS

> [!TIP] Ressource du TP
>
> - <a href="https://kayasam.github.io/linux-bases-services/telechargements/03-dns-bind9/tp/03-dns.md" download>Télécharger ce TP en Markdown</a>

> Chapitre associé : [service DNS avec BIND9](03-dns-bind9/cours)
>
> Durée estimée : 1 h 30 — tests à réaliser depuis le serveur **et** un poste client

> [!SUCCESS] Procédure vérifiée
> Une zone autoritaire `.test`, son CNAME, son rechargement après changement de serial et une zone volontairement invalide ont été testés avec BIND 9.20.

_**Consigne**_ :

1. Installer `bind9` et `bind9-dnsutils`
2. Configurer un forwarder vers un DNS public de votre choix (ex : 9.9.9.9)
3. Créer une zone pour votre propre domaine, par exemple `prenom-s35.test`
4. Ajouter au moins : un enregistrement NS, un A pour `www`, un CNAME pour `ftp`
5. Vérifier la configuration globale avec `named-checkconf`, puis la zone avec `named-checkzone NOM_ZONE FICHIER_ZONE`
    <details>
    <summary>Clique ici pour un indice</summary>
    Une commande `named-check...` est spécifique à la vérification d'un fichier de zone (à distinguer de la vérification de la configuration globale).
    </details>
6. Redémarrer `bind9` et l'activer au démarrage ; sur Debian 13, l'unité canonique peut apparaître sous le nom `named.service`
7. Tester directement le serveur avec `dig @IP_DU_SERVEUR www.prenom-s35.test A` et `dig @IP_DU_SERVEUR ftp.prenom-s35.test CNAME`, puis refaire le test sans `@` depuis le client
8. Modifier l'IP de `www`, ré-incrémenter le Serial, recharger et re-tester
    <details>
    <summary>Clique ici pour un indice</summary>
    Valider d'abord la zone, augmenter le serial puis utiliser `rndc reload NOM_ZONE`. Le serial signale surtout la nouvelle version aux serveurs secondaires ; le TTL gouverne le cache des clients.
    </details>

> [!NOTE] Correction formateur
> La correction détaillée est conservée dans le coffre pédagogique.

> [!WARNING] Pourquoi éviter `.local` ?
> `.local` est réservé à mDNS et peut être intercepté par Avahi, systemd-resolved ou Bonjour. Le domaine `.test` est réservé aux essais et évite cette ambiguïté. Si l'ancien laboratoire impose `.local`, annoncer explicitement ce compromis.

### Défi de diagnostic

Le formateur introduit une panne parmi : point final oublié dans le SOA/NS, accolade manquante, mauvais chemin de zone, type demandé absent ou port 53 filtré.

Sans consulter la correction :

1. formuler le symptôme avec le serveur et le type d'enregistrement testés ;
2. valider configuration et zone ;
3. vérifier les sockets UDP **et** TCP 53 avec `ss -lunpt` ;
4. interpréter le statut de `dig` (`NOERROR`, `NXDOMAIN`, `SERVFAIL` ou timeout) ;
5. corriger, recharger sans coupure et prouver depuis le client.

Livrable : commande en échec, message déterminant, cause, correction et réponse `dig +noall +answer` finale.
