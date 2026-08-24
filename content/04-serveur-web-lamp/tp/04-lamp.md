# TP 4 — Serveur Web LAMP

> [!TIP] Ressource du TP
>
> - <a href="https://kayasam.github.io/linux-bases-services/telechargements/04-serveur-web-lamp/tp/04-lamp.md" download>Télécharger ce TP en Markdown</a>

> Chapitre associé : [serveur Web LAMP](04-serveur-web-lamp/cours)
>
> Durée estimée : 2 heures — dépend du DNS du chapitre 3

> [!SUCCESS] Procédure vérifiée
> Le virtual host, l'exécution PHP, la lecture MariaDB et les deux pannes demandées ont été reproduits sur Apache 2.4, PHP 8.4 et MariaDB 11.8.

_**Consigne**_ :

1. Installer la pile : `sudo apt install -y apache2 mariadb-server php libapache2-mod-php php-mysql`
2. Créer un virtual host pour votre domaine `.test`, avec un `ServerName`, un `DocumentRoot` dédié, un `ErrorLog` et un `CustomLog`
3. Activer le site, exécuter `apache2ctl configtest`, puis recharger Apache uniquement si le résultat est `Syntax OK`
4. Créer une page `info.php` affichant les informations PHP et la tester ; vérifier aussi le vhost sans dépendre du DNS avec `curl -H 'Host: www.prenom-s35.test' http://IP_SERVEUR/info.php`
5. Créer une base de données et un utilisateur MariaDB dédié à cette base, sans lui accorder de privilèges globaux
    <details>
    <summary>Clique ici pour un indice</summary>
    3 commandes SQL suffisent : une pour créer la base, une pour créer l'utilisateur, une pour lui donner les droits.
    </details>
6. Créer une table simple (ex : `contacts` avec `id`, `nom`, `email`) et y insérer 2-3 lignes
7. Créer une page PHP qui se connecte avec ce compte dédié et affiche le contenu de la table en échappant les valeurs avec `htmlspecialchars`
8. Consulter les logs d'accès et d'erreurs Apache de votre virtual host
9. Supprimer `info.php` après validation et expliquer les informations sensibles qu'il exposait

Preuves minimales avant le défi :

```bash
getent hosts www.prenom-s35.test
ss -lntp | grep ':80'
apache2ctl -S
curl -v -H 'Host: www.prenom-s35.test' http://IP_SERVEUR/
php -m | grep -i mysqli
sudo mariadb -e 'SELECT COUNT(*) FROM NOM_BASE.contacts;'
```

> [!NOTE] Correction formateur
> La correction détaillée est conservée dans le coffre pédagogique.

### Défi de diagnostic

Créer successivement deux pannes, puis les résoudre sans modifier une autre couche :

- un `DocumentRoot` erroné dans le vhost ;
- un mot de passe MariaDB erroné dans la page PHP.

Pour chacune : relever le code/résultat HTTP avec `curl -v`, identifier le journal probant, corriger, valider la configuration avant rechargement et rejouer le test.

> [!NOTE] Limite de `configtest`
> Un `DocumentRoot` inexistant peut produire un avertissement tout en conservant `Syntax OK`. `configtest` valide surtout la syntaxe ; le code HTTP et le journal du vhost prouvent ensuite la validité fonctionnelle. Un mauvais mot de passe SQL doit être recherché dans l'ErrorLog, sans l'afficher dans le livrable.

Critères de réussite : le nom résout correctement, Apache écoute sur 80, le bon vhost est sélectionné, la page affiche les lignes SQL et `info.php` n'existe plus.
