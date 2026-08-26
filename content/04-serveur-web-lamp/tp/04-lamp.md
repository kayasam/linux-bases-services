# TP 4 — Serveur Web LAMP

> [!TIP] Ressource du TP
>
> - <a href="https://kayasam.github.io/linux-bases-services/telechargements/04-serveur-web-lamp/tp/04-lamp.md" download>Télécharger ce TP en Markdown</a>

> Chapitre associé : `Cours.md`
>
> Durée estimée : 2 heures pour la partie HTTP, + 45 min pour la partie HTTPS — dépend du DNS du chapitre 3

_**Consigne**_ :

### Partie 1 — Le site en HTTP

1. Installer la pile LAMP (Apache, MariaDB, PHP)
2. Créer un virtual host pour `www.fournil.lab`, avec un `DocumentRoot` **et des journaux dédiés**
3. Activer ce site, valider la configuration, puis recharger Apache
    <details>
    <summary>Clique ici pour un indice</summary>
    Écrire le fichier dans `sites-available/` ne l'active pas. Une commande `a2...` crée le lien vers `sites-enabled/`, et une commande `apache2ctl ...` valide la syntaxe avant tout rechargement.
    </details>
4. Créer une page `info.php` affichant les informations PHP, et la tester depuis un navigateur
5. Comparer ce que renvoie `http://192.168.56.200/` et `http://www.fournil.lab/`, puis **expliquer la différence**
    <details>
    <summary>Réfléchir avant de coder</summary>
    Sur quoi Apache s'appuie-t-il pour choisir un vhost ? Que vaut cet élément quand on tape une adresse IP ? Que répond <code>apache2ctl -S</code> à ce sujet ?
    </details>
6. Créer une base de données et un utilisateur MariaDB dédié à cette base
    <details>
    <summary>Clique ici pour un indice</summary>
    On ouvre la console avec `sudo mariadb`, sans `-u` ni `-p` : le compte root SQL s'authentifie par socket Unix, il n'a pas de mot de passe. Ensuite 3 commandes SQL suffisent : créer la base, créer l'utilisateur, lui donner les droits sur cette base uniquement.
    </details>
7. Créer une table simple (ex : `contacts` avec `id`, `nom`, `email`) et y insérer 2-3 lignes
8. Créer une page PHP qui se connecte à cette base et affiche le contenu de la table
    <details>
    <summary>Clique ici pour un indice</summary>
    Depuis PHP 8.1, une erreur `mysqli` lève une **exception** : un `if ($mysqli->connect_error)` ne sera jamais exécuté. Encadrer la connexion par `try` / `catch (mysqli_sql_exception $e)`.
    </details>
9. Appliquer le principe de moindre privilège sur `/var/www/fournil-web`, puis vérifier que le site fonctionne toujours
    <details>
    <summary>Réfléchir avant de coder</summary>
    Apache a-t-il besoin d'écrire dans le répertoire du code, ou seulement de le lire ? Qui doit en être propriétaire pour que vous restiez le seul à pouvoir le modifier ?
    </details>
10. Consulter les journaux d'accès et d'erreurs Apache **de votre virtual host**
11. Supprimer `info.php` après validation et expliquer les informations sensibles qu'il exposait

### Partie 2 — Le site en HTTPS

12. Générer un certificat auto-signé valable 1 an pour `www.fournil.lab`, avec sa clé privée
    <details>
    <summary>Clique ici pour un indice</summary>
    `openssl req` avec `-x509` produit directement un certificat au lieu d'une demande. Deux options sont décisives : l'une évite que la clé soit protégée par une phrase de passe (sinon Apache ne redémarrera pas seul), l'autre déclare les noms de domaine couverts — sans elle, aucun navigateur récent n'acceptera le certificat.
    </details>
13. Placer la clé privée et le certificat aux emplacements prévus par Debian, avec les droits appropriés
    <details>
    <summary>Réfléchir avant de coder</summary>
    Lequel des deux fichiers est envoyé à tous les visiteurs ? Lequel ne doit jamais quitter le serveur ? L'utilisateur <code>www-data</code> a-t-il besoin de lire la clé privée, sachant qu'Apache démarre en root ?
    </details>
14. Activer le module SSL et créer un second virtual host pour le port 443
15. Vérifier **en ligne de commande** le certificat réellement présenté par le serveur, et relever trois éléments : l'émetteur, la date d'expiration et les noms couverts
    <details>
    <summary>Clique ici pour un indice</summary>
    `openssl s_client -connect ...` récupère le certificat présenté ; le passer à `openssl x509 -noout -subject -issuer -dates -ext subjectAltName` le rend lisible.
    </details>
16. Faire aboutir `curl` **sans** désactiver la vérification du certificat, et expliquer pourquoi cela fonctionne
17. Rediriger tout le trafic HTTP vers HTTPS, et prouver la redirection par le code HTTP retourné

### Défi de diagnostic

Créer successivement trois pannes, puis les résoudre sans modifier une autre couche :

- un `DocumentRoot` erroné dans le vhost ;
- un mot de passe MariaDB erroné dans la page PHP ;
- un certificat régénéré **sans** `subjectAltName`.

Pour chacune : relever le code/résultat HTTP avec `curl -v`, identifier le journal probant, corriger, valider la configuration avant rechargement et rejouer le test.

Critères de réussite : le nom résout correctement, Apache écoute sur 80 et 443, le bon vhost est sélectionné, la page affiche les lignes SQL, `http://` redirige en 301, `curl --cacert` aboutit sans `-k`, et `info.php` n'existe plus.
