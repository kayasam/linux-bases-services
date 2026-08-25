# 4. Service Web : pile LAMP (Apache + MariaDB + PHP)

**Objectifs** : installer Apache, MariaDB et PHP, créer un virtual host dédié, et faire dialoguer une page PHP avec une base de données.

![Trajet d'une requête dans une pile LAMP](Ressources/images/pile-lamp.svg)

> [!TIP] Lecture du schéma
> Tester une couche à la fois : résolution du nom, connexion au port 80, sélection du virtual host, exécution PHP, puis requête SQL. Un échec PHP ne doit pas être diagnostiqué en modifiant le DNS.

---

### Principe d'une pile LAMP

**L**inux + **A**pache + **M**ariaDB + **P**HP : un serveur web capable de servir des pages dynamiques, générées à la volée à partir d'une base de données.

---

### Installation

```bash
sudo apt install -y apache2 mariadb-server php libapache2-mod-php php-mysql
sudo mysql_secure_installation
```

Vérifier que tout tourne :

```bash
systemctl status apache2
systemctl status mariadb
```

---

### Créer un virtual host

Créer `/etc/apache2/sites-available/dawan-s35.conf` :

```text
<VirtualHost *:80>
        ServerName www.founil.lab
        DocumentRoot /var/www/dawan-s35

        ErrorLog ${APACHE_LOG_DIR}/dawan-s35-error.log
        CustomLog ${APACHE_LOG_DIR}/dawan-s35-access.log combined
</VirtualHost>
```

```bash
sudo mkdir /var/www/dawan-s35
sudo chown -R www-data:www-data /var/www/dawan-s35

sudo a2ensite dawan-s35.conf
sudo a2dissite 000-default.conf     # Desactive le site par defaut (optionnel)
sudo apache2ctl configtest
sudo systemctl reload apache2
```

> [!NOTE]
> `a2ensite`/`a2dissite` créent/suppriment un lien symbolique entre `sites-available/` (fichiers disponibles) et `sites-enabled/` (fichiers réellement chargés par Apache) — même logique que `systemctl enable`/`disable` pour les services.

---

### Tester PHP et la base de données

Créer `/var/www/dawan-s35/info.php` :

```php
<?php
phpinfo();
```

Se connecter à MariaDB et créer une base :

```bash
sudo mysql -u root -p
```

```sql
CREATE DATABASE dawan_s35;
CREATE USER 'dawan_user'@'localhost' IDENTIFIED BY 'MotDePasseSolide!';
GRANT ALL PRIVILEGES ON dawan_s35.* TO 'dawan_user'@'localhost';
FLUSH PRIVILEGES;
```

Page PHP de test `/var/www/dawan-s35/index.php` :

```php
<?php
$mysqli = new mysqli("localhost", "dawan_user", "MotDePasseSolide!", "dawan_s35");
if ($mysqli->connect_error) {
    die("Connexion echouee : " . $mysqli->connect_error);
}
echo "Connexion a la base dawan_s35 reussie !";
```

Depuis le navigateur de l'hôte : `http://192.168.56.200/info.php` et `http://192.168.56.200/index.php` (en ayant préalablement pointé `www.founil.lab` vers cette IP, via le DNS du chapitre 3 ou le fichier `hosts` local).

> [!WARNING] Retirer les pages de test
> `phpinfo()` divulgue la version de PHP, les modules, chemins et une partie de la configuration. Supprimer `info.php` dès la validation terminée. Les identifiants SQL ne doivent pas rester en clair dans un fichier distribué ou versionné ; l'exemple sert uniquement au laboratoire isolé.

### Comprendre la sélection d'un virtual host

Plusieurs sites partagent la même IP et le même port. Apache utilise l'en-tête HTTP `Host` pour choisir le bloc dont le `ServerName` ou un `ServerAlias` correspond.

```bash
apache2ctl -S
curl -v http://192.168.56.200/ -H 'Host: www.founil.lab'
```

Tester uniquement l'adresse IP peut donc afficher le site par défaut alors que le vhost fonctionne correctement avec son nom.

### Permissions et moindre privilège

Le processus Apache s'exécute généralement sous l'identité `www-data`. Il lui faut la lecture du code, mais pas nécessairement le droit de le modifier. Réserver l'écriture aux seuls répertoires qui reçoivent réellement des fichiers (uploads, cache, sessions).

```bash
sudo chown -R root:www-data /var/www/dawan-s35
sudo find /var/www/dawan-s35 -type d -exec chmod 0750 {} \;
sudo find /var/www/dawan-s35 -type f -exec chmod 0640 {} \;
```

### Diagnostic couche par couche

```bash
getent hosts www.founil.lab
ss -lntp | grep ':80'
curl -v http://www.founil.lab/
sudo apache2ctl configtest
sudo tail -f /var/log/apache2/dawan-s35-error.log
php -m | grep -i mysqli
sudo mariadb -e "SHOW DATABASES;"
```

| Code HTTP         | Piste principale                                    |
| ----------------- | --------------------------------------------------- |
| `200`             | requête servie ; vérifier encore le contenu attendu |
| `403`             | droits Unix ou directive Apache                     |
| `404`             | mauvais vhost, `DocumentRoot` ou chemin             |
| `500`             | erreur PHP/application ; consulter l'error log      |
| connexion refusée | Apache absent ou aucun socket en écoute             |
| timeout           | routage ou pare-feu avant l'application             |

> [!NOTE]
> **À retenir**
>
> - Un virtual host Apache = un couple `ServerName` + `DocumentRoot` : plusieurs sites peuvent cohabiter sur la même IP/port 80.
> - PHP ne se connecte jamais directement au navigateur : il génère du HTML côté serveur, exécuté par Apache via `mod_php`.
> - Un utilisateur MariaDB dédié (plutôt que `root`) limite les dégâts si les identifiants de l'appli fuitent.
