# TP 4 — Serveur Web LAMP

> [!TIP] Ressource du TP
>
> - <a href="https://kayasam.github.io/linux-bases-services/telechargements/04-serveur-web-lamp/tp/04-lamp.md" download>Télécharger ce TP en Markdown</a>

> Chapitre associé : `Cours.md`
>
> Durée estimée : 2 heures — dépend du DNS du chapitre 3

_**Consigne**_ :

1. Installer la pile LAMP (Apache, MariaDB, PHP)
2. Créer un virtual host pour `www.founil.lab`, avec un `DocumentRoot` dédié
3. Activer ce site et recharger Apache
4. Créer une page `info.php` affichant les informations PHP, et la tester depuis un navigateur
5. Créer une base de données et un utilisateur MariaDB dédié à cette base
    <details>
    <summary>Clique ici pour un indice</summary>
    3 commandes SQL suffisent : une pour créer la base, une pour créer l'utilisateur, une pour lui donner les droits.
    </details>
6. Créer une table simple (ex : `contacts` avec `id`, `nom`, `email`) et y insérer 2-3 lignes
7. Créer une page PHP qui se connecte à cette base et affiche le contenu de la table
8. Consulter les logs d'accès et d'erreurs Apache de votre virtual host
9. Supprimer `info.php` après validation et expliquer les informations sensibles qu'il exposait

### Défi de diagnostic

Créer successivement deux pannes, puis les résoudre sans modifier une autre couche :

- un `DocumentRoot` erroné dans le vhost ;
- un mot de passe MariaDB erroné dans la page PHP.

Pour chacune : relever le code/résultat HTTP avec `curl -v`, identifier le journal probant, corriger, valider la configuration avant rechargement et rejouer le test.

Critères de réussite : le nom résout correctement, Apache écoute sur 80, le bon vhost est sélectionné, la page affiche les lignes SQL et `info.php` n'existe plus.
