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
3. Créer une zone pour votre propre domaine (préférer `xxx-s35.test` ; utiliser `.local` uniquement si le laboratoire existant l'impose)
4. Ajouter au moins : un enregistrement NS, un A pour `www`, un CNAME pour `ftp`
5. Vérifier la syntaxe de la zone avant de redémarrer le service
    <details>
    <summary>Clique ici pour un indice</summary>
    Une commande `named-check...` est spécifique à la vérification d'un fichier de zone (à distinguer de la vérification de la configuration globale).
    </details>
6. Redémarrer `bind9` et l'activer au démarrage
7. Tester la résolution de `www.xxx-s35.local` et `ftp.xxx-s35.local` avec `dig`
8. Modifier l'IP de `www`, ré-incrémenter le Serial, recharger et re-tester
    <details>
    <summary>Clique ici pour un indice</summary>
    Valider d'abord la zone, augmenter le Serial puis utiliser `rndc reload`. Le Serial signale surtout la nouvelle version aux serveurs secondaires ; le TTL gouverne le cache des clients.
    </details>

### Défi de diagnostic

Une panne est introduite parmi : point final oublié dans le SOA/NS, accolade manquante, mauvais chemin de zone, type demandé absent ou port 53 filtré.

Sans consulter la correction :

1. formuler le symptôme avec le serveur et le type d'enregistrement testés ;
2. valider configuration et zone ;
3. vérifier le socket UDP/TCP 53 ;
4. interpréter le code retour de `dig` ;
5. corriger, recharger sans coupure et prouver depuis le client.

Livrable : commande en échec, message déterminant, cause, correction et réponse `dig +noall +answer` finale.
