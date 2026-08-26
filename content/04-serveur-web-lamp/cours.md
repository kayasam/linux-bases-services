# 4. Service Web : pile LAMP (Apache + MariaDB + PHP)

**Objectifs** : installer Apache, MariaDB et PHP, créer un virtual host dédié, faire dialoguer une page PHP avec une base de données, puis publier le site en HTTPS avec un certificat auto-signé.

> [!INFO] Versions de référence
> Ce chapitre est écrit pour **Debian 13 (trixie)** : Apache 2.4, **PHP 8.4**, MariaDB 11.8, OpenSSL 3.5. Les numéros de version apparaissent dans deux chemins qu'il faudra adapter sur une autre distribution : le nom du module Apache (`php8.4`) et le répertoire de configuration PHP (`/etc/php/8.4/`).

![Trajet d'une requête dans une pile LAMP](Ressources/images/pile-lamp.svg)

> [!TIP] Lecture du schéma
> Tester une couche à la fois : résolution du nom, connexion au port 80, sélection du virtual host, exécution PHP, puis requête SQL. Un échec PHP ne doit pas être diagnostiqué en modifiant le DNS.

---

### Principe d'une pile LAMP

**L**inux + **A**pache + **M**ariaDB + **P**HP : un serveur web capable de servir des pages dynamiques, générées à la volée à partir d'une base de données.

Ce chapitre s'appuie sur la zone `fournil.lab` publiée au chapitre 3 : le nom `www.fournil.lab` doit déjà résoudre vers `192.168.56.200` avant de commencer.

---

### Installation

```bash
sudo apt install -y apache2 mariadb-server php libapache2-mod-php php-mysql
```

Vérifier que tout tourne :

```bash
systemctl status apache2
systemctl status mariadb
```

> [!NOTE] `mysql_secure_installation` : que fait-il réellement sur Debian ?
> Sur Debian, le compte `root` de MariaDB n'a **pas de mot de passe** : il s'authentifie par le plugin `unix_socket`, c'est-à-dire par l'identité Unix de celui qui lance la commande. Seul un utilisateur capable de faire `sudo` peut donc devenir `root` SQL. C'est déjà une bonne configuration.
>
> `sudo mariadb-secure-installation` reste utile pour le reste : supprimer les comptes anonymes, la base `test`, et interdire la connexion de `root` à distance. Répondre **non** à la question sur le changement de mot de passe root, pour conserver l'authentification par socket.

---

### Où vit chaque fichier

Une pile LAMP éparpille ses fichiers dans quatre arborescences. Ce n'est pas du désordre : le **FHS** (_Filesystem Hierarchy Standard_) attribue à chaque répertoire une responsabilité, et savoir laquelle permet de deviner où chercher sans documentation.

![Les fichiers d'une pile LAMP rangés selon le FHS](Ressources/images/fichiers-lamp-fhs.svg)

> [!TIP] Lecture du schéma
> Trois questions suffisent à situer n'importe quel fichier :
>
> 1. **Est-ce que je l'écris, ou est-ce qu'un programme l'écrit ?** Ce que j'administre va dans `/etc/` — et c'est ce qu'il faut sauvegarder. Ce qu'un programme produit va dans `/var/`.
> 2. **Est-ce que ça survit à un redémarrage ?** Si non, c'est `/run/` : le PID d'Apache, le socket de MariaDB. Inutile d'y toucher, tout y est recréé au démarrage.
> 3. **Est-ce que ça vient du paquet ?** Alors c'est `/usr/` — les modules compilés, les binaires. Toute modification y sera écrasée à la prochaine mise à jour `apt`.
>
> Corollaire pratique pour une sauvegarde : `/etc/` (la configuration), `/var/www/` (le contenu) et un export SQL suffisent à reconstruire le serveur. `/usr/` se réinstalle avec `apt`, `/run/` se recrée seul, et `/var/log/` ne se restaure pas.

> [!IMPORTANT] Le piège de « localhost » en PHP
> Dans `new mysqli("localhost", …)`, le mot `localhost` **n'est pas** une adresse : PHP le traduit par une connexion au socket Unix `/run/mysqld/mysqld.sock`. Écrire `127.0.0.1` à la place force une connexion **TCP**, qui échouera si MariaDB n'écoute pas sur le réseau — ce qui est précisément la configuration par défaut de Debian (`bind-address = 127.0.0.1`, et souvent aucune écoute du tout).
>
> Deux écritures qu'on croit équivalentes, deux chemins techniques différents. C'est une cause classique de « ça marche chez moi ».

---

### Créer un virtual host

Un _virtual host_ (hôte virtuel) est un bloc de configuration qui décrit **un site**. Plusieurs sites peuvent ainsi cohabiter sur la même machine, la même adresse IP et le même port.

Créer `/etc/apache2/sites-available/fournil-web.conf` :

```apacheconf
# Ce bloc ne traite que les requêtes arrivant sur le port 80 (HTTP).
# L'étoile signifie « quelle que soit l'adresse IP locale d'arrivée ».
<VirtualHost *:80>

        # Nom que le client doit demander pour que CE bloc soit choisi.
        # Apache le compare à l'en-tête HTTP "Host" envoyé par le navigateur.
        ServerName www.fournil.lab

        # Nom supplémentaire accepté pour le même site (facultatif) :
        # ici le domaine sans le préfixe "www.".
        ServerAlias fournil.lab

        # Racine des fichiers servis pour ce site.
        # L'URL "/" correspond à ce répertoire,
        # l'URL "/info.php" au fichier /var/www/fournil-web/info.php.
        DocumentRoot /var/www/fournil-web

        # Journal des ERREURS propre à ce site.
        # C'est ici que PHP écrit quand une page renvoie 500 ou reste blanche.
        # ${APACHE_LOG_DIR} vaut /var/log/apache2 (défini dans /etc/apache2/envvars).
        ErrorLog ${APACHE_LOG_DIR}/fournil-error.log

        # Journal des ACCÈS : une ligne par requête reçue.
        # Le format "combined" ajoute la page d'origine et le navigateur client.
        CustomLog ${APACHE_LOG_DIR}/fournil-access.log combined

</VirtualHost>
```

Créer l'arborescence et activer le site :

```bash
sudo mkdir -p /var/www/fournil-web

sudo a2ensite fournil-web.conf
sudo apache2ctl configtest      # Valider AVANT de recharger
sudo systemctl reload apache2
```

> [!NOTE] `sites-available` et `sites-enabled`
> `a2ensite` / `a2dissite` créent ou suppriment un lien symbolique entre `sites-available/` (les sites **écrits**) et `sites-enabled/` (les sites **réellement chargés**) — même logique que `systemctl enable`/`disable` pour les services. Écrire un fichier de vhost ne suffit donc jamais : tant qu'il n'est pas activé, Apache l'ignore.
>
> La même mécanique existe pour les modules (`a2enmod` → `mods-enabled/`) et pour les fragments de configuration globale (`a2enconf` → `conf-enabled/`).

> [!IMPORTANT] Le port d'écoute n'est pas dans le vhost
> `<VirtualHost *:80>` ne fait **pas** écouter Apache sur le port 80 : il indique seulement à quel port ce bloc s'applique. L'écoute réelle est déclarée dans `/etc/apache2/ports.conf`, par une directive `Listen`. C'est une confusion fréquente : ajouter un `<VirtualHost *:8080>` sans `Listen 8080` produit un site qui ne répondra jamais.

---

### Comprendre la sélection d'un virtual host

Plusieurs sites partagent la même IP et le même port. Apache utilise l'en-tête HTTP `Host` envoyé par le client pour choisir le bloc dont le `ServerName` ou un `ServerAlias` correspond.

```bash
apache2ctl -S                                              # liste les vhosts et leur ordre
curl -v http://192.168.56.200/ -H 'Host: www.fournil.lab'  # forcer l'en-tête Host
```

> [!IMPORTANT] Pourquoi tester par l'adresse IP affiche « It works! »
> Une requête adressée directement à `192.168.56.200` porte un en-tête `Host: 192.168.56.200`, qui ne correspond à aucun `ServerName`. Apache applique alors sa règle de repli : il sert le **premier vhost chargé**, dans l'ordre alphabétique des fichiers de `sites-enabled/`.
>
> C'est exactement pour cela que Debian nomme son site par défaut `000-default.conf` : les zéros le placent en tête, il devient le site de repli. La sortie de `apache2ctl -S` l'indique explicitement par la mention `default server`.
>
> Conséquence pratique : ne **pas** désactiver `000-default.conf` pendant ce chapitre. Le garder actif permet d'observer la différence entre un test par IP (site par défaut) et un test par nom (votre site) — c'est la démonstration du mécanisme. Un test par IP qui affiche « It works! » ne prouve donc rien contre votre vhost.

---

### Tester PHP et la base de données

Créer `/var/www/fournil-web/info.php` :

```php
<?php
phpinfo();
```

> [!WARNING] Une page blanche n'est pas une page vide
> Le `php.ini` livré par Debian est un profil de **production** : `display_errors` vaut `Off`. Une erreur PHP ne produit donc **aucun message à l'écran** — juste une page blanche, ou un HTTP 500. Le message existe, mais il est dans le journal d'erreurs du site.
>
> Réflexe à prendre dès maintenant : garder un second terminal ouvert sur
>
> ```bash
> sudo tail -f /var/log/apache2/fournil-error.log
> ```
>
> pendant toute la durée du TP. Sans cela, le diagnostic PHP se fait à l'aveugle.

Se connecter à MariaDB et créer une base :

```bash
sudo mariadb
```

Aucun `-u root -p` : l'authentification se fait par socket Unix, donc par le `sudo`. Demander un mot de passe qui n'existe pas est la première source de blocage sur ce TP.

```sql
CREATE DATABASE fournil_web;
CREATE USER 'fournil_user'@'localhost' IDENTIFIED BY 'MotDePasseSolide!';
GRANT ALL PRIVILEGES ON fournil_web.* TO 'fournil_user'@'localhost';
FLUSH PRIVILEGES;
```

L'utilisateur applicatif n'a de droits que sur **sa** base (`fournil_web.*`), et seulement depuis `localhost`. Si ses identifiants fuitent, le reste du serveur SQL n'est pas exposé.

Page PHP de test `/var/www/fournil-web/index.php` :

```php
<?php
// Laboratoire uniquement : afficher les erreurs à l'écran.
// En production, display_errors reste à Off et on lit l'error log.
ini_set('display_errors', '1');
error_reporting(E_ALL);

try {
    $mysqli = new mysqli("localhost", "fournil_user", "MotDePasseSolide!", "fournil_web");
    $mysqli->set_charset("utf8mb4");
} catch (mysqli_sql_exception $e) {
    http_response_code(500);
    error_log("Connexion MariaDB impossible : " . $e->getMessage());
    exit("Connexion a la base impossible - voir l'error log Apache.");
}

echo "Connexion a la base fournil_web reussie !";
```

> [!IMPORTANT] Pourquoi `try` / `catch` et non `if ($mysqli->connect_error)`
> Depuis **PHP 8.1**, `mysqli` signale ses erreurs en levant une exception (`mysqli_sql_exception`) au lieu de renseigner silencieusement `connect_error`. Le test `if ($mysqli->connect_error)` que l'on trouve dans la quasi-totalité des tutoriels antérieurs n'est donc **jamais atteint** : l'exception interrompt le script avant.
>
> Sur Debian 13 (PHP 8.4), un mot de passe SQL erroné avec l'ancienne écriture ne produit pas le message d'erreur attendu, mais une page blanche et un HTTP 500. Avec `try`/`catch`, l'erreur est capturée, journalisée proprement et le visiteur reçoit un message maîtrisé.

Depuis le navigateur de l'hôte : `http://www.fournil.lab/info.php` puis `http://www.fournil.lab/index.php`.

> [!WARNING] Retirer les pages de test
> `phpinfo()` divulgue la version de PHP, les modules chargés, les chemins et une partie de la configuration : autant d'informations utiles à un attaquant pour cibler une faille connue. Supprimer `info.php` dès la validation terminée.

---

### Permissions et moindre privilège

Avec `libapache2-mod-php`, le code PHP est exécuté **par Apache lui-même**, donc sous l'identité `www-data`. Tout ce que `www-data` peut écrire, une faille de l'application peut le réécrire.

La règle est donc : Apache doit **lire** le code, pas le modifier.

```bash
sudo chown -R root:www-data /var/www/fournil-web
sudo find /var/www/fournil-web -type d -exec chmod 0750 {} \;
sudo find /var/www/fournil-web -type f -exec chmod 0640 {} \;
```

- propriétaire `root` : seul l'administrateur modifie le code ;
- groupe `www-data` : Apache appartient au groupe, il obtient la lecture ;
- `0750` sur les répertoires : le groupe peut traverser et lister, pas créer ;
- `0640` sur les fichiers : le groupe lit, n'écrit pas ; les autres utilisateurs du serveur n'ont **aucun** accès.

L'écriture n'est réactivée que sur les répertoires qui reçoivent réellement des fichiers (uploads, cache, sessions), et uniquement sur ceux-là.

> [!WARNING] Le mot de passe SQL est en clair dans `index.php`
> Tant que PHP fonctionne, le fichier est interprété et le mot de passe n'apparaît jamais dans le navigateur. Mais si le module PHP est désactivé ou tombe en panne, Apache ne sait plus qu'en faire : il sert le `.php` comme un simple fichier texte, et **le mot de passe s'affiche dans le navigateur**.
>
> La démonstration tient en deux commandes — à faire une fois en salle, elle marque durablement :
>
> ```bash
> ls /etc/apache2/mods-enabled/php*                        # relever le numéro de version
> sudo a2dismod php8.4 && sudo systemctl restart apache2   # puis recharger la page
> sudo a2enmod php8.4  && sudo systemctl restart apache2   # rétablir
> ```
>
> Adapter `php8.4` à la version réellement installée — `ls /etc/apache2/mods-enabled/php*` la donne sans avoir à la deviner.
> C'est l'argument décisif pour placer les identifiants dans un fichier de configuration situé **hors du `DocumentRoot`**, inclus par le code.

---

### Passer le site en HTTPS

Jusqu'ici tout circule en clair : n'importe qui sur le réseau peut lire les pages et les mots de passe transmis. HTTPS ajoute trois garanties :

| Garantie             | Ce qu'elle empêche                    |
| -------------------- | ------------------------------------- |
| **Confidentialité**  | lire le contenu échangé (chiffrement) |
| **Intégrité**        | modifier la réponse au passage        |
| **Authentification** | se faire passer pour le serveur       |

Les deux premières sont assurées par le chiffrement seul. La troisième repose sur une **autorité de certification** (AC) en qui le navigateur a confiance, et qui atteste que la clé appartient bien à ce nom de domaine.

Dans un laboratoire isolé avec un domaine `.lab`, aucune AC publique ne peut délivrer de certificat. On en fabrique donc un **auto-signé** : le serveur signe lui-même son propre certificat.

> [!IMPORTANT] Auto-signé ne veut pas dire « pas chiffré »
> Un certificat auto-signé chiffre **exactement aussi bien** qu'un certificat payant : les algorithmes sont les mêmes. Ce qui lui manque, c'est uniquement la **preuve d'identité** par un tiers de confiance.
>
> D'où l'avertissement du navigateur : il ne dit pas « cette connexion n'est pas chiffrée », il dit « je ne peux pas vérifier à qui je parle ». En laboratoire, où l'on sait exactement à qui l'on parle, c'est acceptable. Sur Internet, cliquer sur « Continuer malgré tout » revient à ignorer la seule protection contre l'usurpation de serveur.

#### 1. Générer la clé privée et le certificat

```bash
sudo openssl req -x509 -nodes \
  -newkey rsa:2048 \
  -keyout /etc/ssl/private/fournil.lab.key \
  -out    /etc/ssl/certs/fournil.lab.crt \
  -days 365 \
  -subj "/C=FR/ST=Bretagne/L=Vannes/O=Dawan/CN=www.fournil.lab" \
  -addext "subjectAltName = DNS:www.fournil.lab,DNS:fournil.lab"
```

| Option                      | Rôle                                                                                                                    |
| --------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `req`                       | outil de gestion des demandes de certificat                                                                             |
| `-x509`                     | produire directement un **certificat** au lieu d'une demande (CSR) à envoyer à une AC : c'est ce qui le rend auto-signé |
| `-nodes`                    | ne **pas** chiffrer la clé privée par une phrase de passe                                                               |
| `-newkey rsa:2048`          | générer en même temps une clé privée RSA de 2048 bits                                                                   |
| `-keyout` / `-out`          | où écrire la clé privée / le certificat public                                                                          |
| `-days 365`                 | durée de validité                                                                                                       |
| `-subj`                     | remplir l'identité sans le questionnaire interactif                                                                     |
| `-addext "subjectAltName…"` | déclarer les noms de domaine couverts par le certificat                                                                 |

> [!WARNING] Deux options que l'on croit accessoires et qui décident du résultat
> **`-nodes`** : sans lui, la clé privée est protégée par une phrase de passe, qu'Apache réclame **à chaque démarrage** — sur une console à laquelle personne n'assiste au reboot. Le serveur ne redémarre alors jamais tout seul. En production on protège la clé par les droits Unix, pas par une phrase de passe.
>
> **`-addext "subjectAltName…"`** : depuis 2017, les navigateurs **ignorent totalement le champ `CN`** et ne lisent que le `subjectAltName` (SAN). Un certificat sans SAN est rejeté avec `ERR_CERT_COMMON_NAME_INVALID`, même si le `CN` est parfaitement correct. C'est l'erreur la plus fréquente sur les certificats auto-signés, et la plus déroutante — tout semble juste.

#### 2. Protéger la clé privée

Le certificat (`.crt`) est **public** : il est envoyé à tous les visiteurs. La clé privée (`.key`) est le secret qui prouve l'identité du serveur ; quiconque l'obtient peut se faire passer pour lui.

```bash
sudo chown root:ssl-cert /etc/ssl/private/fournil.lab.key
sudo chmod 0640          /etc/ssl/private/fournil.lab.key
ls -ld /etc/ssl/private
```

Le répertoire `/etc/ssl/private` est en `0710 root:ssl-cert` : il n'est même pas listable par les utilisateurs ordinaires.

> [!NOTE] Pourquoi `www-data` n'a pas besoin de lire la clé
> Apache démarre en tant que `root`, lit la clé privée, ouvre le port 443 — puis abandonne ses privilèges et passe en `www-data` pour traiter les requêtes. La clé est donc chargée en mémoire **avant** la bascule. Donner l'accès à `www-data` serait inutile et dangereux : une faille de l'application donnerait accès à la clé du serveur.

#### 3. Activer le module SSL et le vhost HTTPS

```bash
sudo a2enmod ssl
sudo systemctl restart apache2      # activer un module exige un redémarrage
```

Créer `/etc/apache2/sites-available/fournil-web-ssl.conf` :

```apache
# Bloc distinct pour le port 443 : un vhost = un couple adresse/port.
<VirtualHost *:443>

        ServerName www.fournil.lab
        ServerAlias fournil.lab
        DocumentRoot /var/www/fournil-web

        # Active le chiffrement TLS pour ce site.
        SSLEngine on

        # Certificat public, envoyé à chaque visiteur.
        SSLCertificateFile      /etc/ssl/certs/fournil.lab.crt

        # Clé privée correspondante, qui ne quitte JAMAIS le serveur.
        SSLCertificateKeyFile   /etc/ssl/private/fournil.lab.key

        # Journaux séparés de ceux du site en clair : indispensable
        # pour savoir si un problème vient du HTTP ou du HTTPS.
        ErrorLog  ${APACHE_LOG_DIR}/fournil-ssl-error.log
        CustomLog ${APACHE_LOG_DIR}/fournil-ssl-access.log combined

</VirtualHost>
```

```bash
sudo a2ensite fournil-web-ssl.conf
sudo apache2ctl configtest
sudo systemctl reload apache2
```

L'écoute du port 443 est déjà déclarée par Debian dans `/etc/apache2/ports.conf`, à l'intérieur d'un `<IfModule ssl_module>` : elle ne devient active qu'une fois le module SSL chargé. C'est pourquoi l'ordre compte — `a2enmod ssl` d'abord.

#### 4. Vérifier le certificat en ligne de commande

Avant même d'ouvrir un navigateur :

```bash
# Ce que le serveur présente réellement
openssl s_client -connect www.fournil.lab:443 -servername www.fournil.lab </dev/null 2>/dev/null \
  | openssl x509 -noout -subject -issuer -dates -ext subjectAltName
```

Trois choses à lire dans la sortie :

- **`subject` et `issuer` sont identiques** : c'est la définition même d'un certificat auto-signé — l'émetteur et le sujet sont la même entité ;
- **`notAfter`** : la date d'expiration, cause n°1 des pannes HTTPS en production ;
- **`X509v3 Subject Alternative Name`** : les noms réellement couverts. S'il est absent, le navigateur refusera le certificat.

Puis la démonstration en deux temps :

```bash
curl -v https://www.fournil.lab/                                  # échoue : identité invérifiable
curl -v -k https://www.fournil.lab/                               # -k : ignorer la vérification
curl -v --cacert /etc/ssl/certs/fournil.lab.crt https://www.fournil.lab/   # réussit
```

La première commande échoue, la deuxième fonctionne en désactivant le contrôle, la troisième fonctionne **en le respectant** — parce qu'on a explicitement déclaré faire confiance à ce certificat. C'est la preuve que le chiffrement n'a jamais été en cause : seule la confiance manquait. Installer le `.crt` dans le magasin de certificats des postes clients produit le même effet dans le navigateur, sans avertissement.

#### 5. Rediriger le HTTP vers le HTTPS

Une fois HTTPS validé, le site en clair ne doit plus servir de contenu. Remplacer le corps du vhost `*:80` par une redirection :

```apache
<VirtualHost *:80>
        ServerName www.fournil.lab
        ServerAlias fournil.lab

        # Toute requête en clair est renvoyée vers son équivalent chiffré.
        # "permanent" = code HTTP 301, mémorisé par le navigateur.
        Redirect permanent / https://www.fournil.lab/

        ErrorLog  ${APACHE_LOG_DIR}/fournil-error.log
        CustomLog ${APACHE_LOG_DIR}/fournil-access.log combined
</VirtualHost>
```

```bash
sudo apache2ctl configtest && sudo systemctl reload apache2
curl -I http://www.fournil.lab/        # doit renvoyer 301 et un en-tête Location:
```

Ne plus s'étonner ensuite qu'un test en `http://` ne renvoie plus la page : c'est le comportement voulu, et `curl -I` le prouve en une ligne.

---

### Diagnostic couche par couche

```bash
getent hosts www.fournil.lab                       # 1. le nom résout-il ?
ss -lntp | grep -E ':80|:443'                      # 2. Apache écoute-t-il ?
sudo apache2ctl configtest                         # 3. la configuration est-elle valide ?
apache2ctl -S                                      # 4. quel vhost sera choisi ?
curl -v http://www.fournil.lab/                    # 5. que répond le serveur ?
sudo tail -f /var/log/apache2/fournil-error.log    # 6. que dit PHP ?
php -m | grep -i mysqli                            # 7. le module SQL est-il chargé ?
sudo mariadb -e "SHOW DATABASES;"                  # 8. la base existe-t-elle ?
```

| Code HTTP                 | Piste principale                                                         |
| ------------------------- | ------------------------------------------------------------------------ |
| `200`                     | requête servie ; vérifier encore le contenu attendu                      |
| `301`                     | redirection : normale si HTTP→HTTPS a été mis en place                   |
| `403`                     | droits Unix ou directive Apache                                          |
| `404`                     | mauvais vhost, `DocumentRoot` ou chemin                                  |
| `500`                     | erreur PHP/application ; **consulter l'error log**, l'écran ne dira rien |
| page blanche, code `200`  | PHP s'est arrêté sans message : `display_errors` est à `Off`             |
| code PHP affiché en clair | le module PHP n'est pas chargé : Apache sert le fichier tel quel         |
| connexion refusée         | Apache absent ou aucun socket en écoute                                  |
| timeout                   | routage ou pare-feu avant l'application                                  |

Erreurs propres à TLS :

| Message                        | Cause probable                                                  |
| ------------------------------ | --------------------------------------------------------------- |
| `ERR_CERT_AUTHORITY_INVALID`   | certificat auto-signé, non reconnu — attendu en laboratoire     |
| `ERR_CERT_COMMON_NAME_INVALID` | `subjectAltName` absent ou ne contenant pas le nom demandé      |
| `ERR_CERT_DATE_INVALID`        | certificat expiré (`-days` dépassé) ou horloge du poste erronée |
| `SSL_ERROR_RX_RECORD_TOO_LONG` | on parle HTTPS à un port qui répond en HTTP clair               |

> [!NOTE]
> **À retenir**
>
> - Un virtual host Apache = un couple `ServerName` + `DocumentRoot` : plusieurs sites cohabitent sur la même IP, départagés par l'en-tête `Host`. Sans correspondance, Apache sert le premier vhost chargé.
> - Écrire un fichier dans `sites-available/` ne suffit pas : rien n'est actif tant que `a2ensite` n'a pas créé le lien dans `sites-enabled/`.
> - PHP ne se connecte jamais directement au navigateur : il génère du HTML côté serveur. Avec `mod_php`, c'est Apache lui-même qui l'exécute, donc sous l'identité `www-data` ; avec PHP-FPM, c'est un démon séparé qui peut avoir sa propre identité (voir le bonus en fin de chapitre).
> - Une page blanche est un message d'erreur qu'on ne voit pas : `display_errors` est à `Off`, la réponse est dans l'error log du site.
> - Un utilisateur MariaDB dédié, limité à sa base et à `localhost`, contient les dégâts si les identifiants de l'appli fuitent.
> - Un certificat auto-signé chiffre aussi bien qu'un certificat commercial : ce qui lui manque est la preuve d'identité, pas la protection des données.

---

### Bonus — passer de mod_php à PHP-FPM

Jusqu'ici, PHP est un **module d'Apache** : l'interpréteur vit à l'intérieur du processus web, et le code s'exécute donc en `www-data`. C'est simple, et c'est ce qui rend concrète toute la section sur les permissions. Mais c'est aussi la limite du modèle.

**PHP-FPM** (_FastCGI Process Manager_) déplace PHP dans un **démon séparé**. Apache ne l'exécute plus : il lui transmet les requêtes `.php` par un socket et récupère le HTML produit.

|                       | mod_php                      | PHP-FPM                               |
| --------------------- | ---------------------------- | ------------------------------------- |
| Où s'exécute PHP      | dans le processus Apache     | dans un démon indépendant             |
| MPM Apache imposé     | `prefork` (le plus gourmand) | `event` (le moderne)                  |
| Identité d'exécution  | toujours `www-data`          | **un utilisateur par site**           |
| Limites de ressources | globales                     | par pool (`pm.max_children`, mémoire) |
| Autre serveur web     | Apache uniquement            | identique derrière nginx              |

Le gain décisif est le deuxième : avec `mod_php`, **tous** les sites de la machine s'exécutent sous la même identité. Une faille sur le site A permet de lire le `index.php` du site B, donc son mot de passe MariaDB. Avec un pool FPM par site, la faille reste enfermée dans son périmètre.

#### 1. Basculer le serveur

```bash
sudo apt install -y php-fpm

sudo a2dismod php8.4 mpm_prefork      # retirer mod_php ET le MPM qu'il imposait
sudo a2enmod mpm_event proxy_fcgi setenvif
sudo a2enconf php8.4-fpm              # branche Apache sur le socket FPM

sudo systemctl enable --now php8.4-fpm
sudo systemctl restart apache2
```

L'ordre compte : `mod_php` est incompatible avec `mpm_event`, il faut donc le désactiver **avant** de changer de MPM. Vérifier ensuite que la bascule a bien eu lieu :

```bash
apache2ctl -M | grep -E 'mpm|proxy_fcgi'    # attendu : mpm_event, proxy_fcgi
systemctl status php8.4-fpm
ss -lx | grep php                            # le socket doit exister
```

#### 2. Créer un pool dédié au site

Un _pool_ est un groupe de processus PHP avec sa propre identité et ses propres limites. Créer d'abord l'utilisateur système du site :

```bash
sudo adduser --system --group --no-create-home --shell /usr/sbin/nologin fournil-web
```

Puis `/etc/php/8.4/fpm/pool.d/fournil.conf` :

```ini
[fournil]
; Identité sous laquelle le code PHP de CE site s'exécutera.
user = fournil-web
group = fournil-web

; Socket propre au site : un pool = un socket.
listen = /run/php/php8.4-fpm-fournil.sock
listen.owner = www-data      ; Apache doit pouvoir écrire dans le socket
listen.group = www-data
listen.mode = 0660

; Nombre de processus PHP, ajusté à la mémoire disponible.
pm = dynamic
pm.max_children = 10
pm.start_servers = 2
pm.min_spare_servers = 1
pm.max_spare_servers = 3

; Réglages PHP propres à ce site, impossibles avec mod_php.
php_admin_value[memory_limit] = 256M
php_admin_flag[display_errors] = off
```

Puis indiquer au vhost d'utiliser **ce** socket plutôt que le socket global, en ajoutant dans `/etc/apache2/sites-available/fournil-web-ssl.conf` (et dans le vhost `:80` s'il sert encore du contenu) :

```apache
        # Toutes les requêtes .php de ce site partent vers le pool "fournil".
        <FilesMatch \.php$>
            SetHandler "proxy:unix:/run/php/php8.4-fpm-fournil.sock|fcgi://localhost"
        </FilesMatch>
```

```bash
sudo systemctl restart php8.4-fpm
sudo apache2ctl configtest && sudo systemctl reload apache2
```

#### 3. Réajuster les permissions

Le code n'est plus lu par `www-data` seul : **deux** identités y accèdent désormais. Apache (`www-data`) sert les fichiers statiques, PHP (`fournil-web`) exécute les `.php`.

```bash
sudo chown -R root:fournil-web /var/www/fournil-web
sudo find /var/www/fournil-web -type d -exec chmod 0750 {} \;
sudo find /var/www/fournil-web -type f -exec chmod 0640 {} \;
sudo adduser www-data fournil-web        # Apache rejoint le groupe du site
sudo systemctl restart apache2
```

`root` reste propriétaire — ni Apache ni PHP ne peuvent réécrire le code. Le groupe `fournil-web` donne la lecture au pool PHP ; `www-data`, membre secondaire de ce groupe, peut servir les fichiers statiques. Un second site aura son propre groupe : son pool ne pourra rien lire chez le premier, ce qui est précisément l'isolation recherchée.

#### 4. Le prouver

Créer `/var/www/fournil-web/qui.php` :

```php
<?php
echo "PHP s'exécute en tant que : " . trim(shell_exec('id -un'));
```

Avant la bascule la page affiche `www-data` ; après, elle affiche `fournil-web`. C'est la démonstration la plus directe de ce qui vient de changer.

```bash
sudo rm /var/www/fournil-web/qui.php    # à retirer comme info.php
```

> [!WARNING] Deux pièges classiques de la migration
> **Le `php.ini` n'est plus le même fichier.** `mod_php` lit `/etc/php/8.4/apache2/php.ini`, FPM lit `/etc/php/8.4/fpm/php.ini`. Modifier l'ancien après la bascule ne produit plus aucun effet — et rien ne le signale. `phpinfo()` affiche le chemin réellement chargé (_Loaded Configuration File_) : c'est la seule preuve fiable.
>
> **Les directives `php_value` / `php_admin_value` placées dans un vhost Apache cessent de fonctionner.** Elles n'ont de sens que pour `mod_php`. Avec FPM, elles se déclarent dans le pool, entre crochets : `php_admin_value[memory_limit] = 256M`.

> [!NOTE] Que retenir du choix
> `mod_php` reste parfaitement valable pour un serveur qui n'héberge qu'un seul site et qu'on veut monter vite. Dès qu'il y a **plusieurs sites**, ou une exigence d'isolation, PHP-FPM est le standard : c'est le modèle utilisé par tous les hébergeurs, et le seul qui fonctionne aussi derrière nginx.
>
> Un `502 Bad Gateway` après la bascule signifie qu'Apache n'a pas pu joindre le socket FPM : vérifier que `php8.4-fpm` tourne, que le chemin du `SetHandler` correspond exactement au `listen` du pool, et que `listen.owner` vaut bien `www-data`.

---

### Pour aller plus loin

- **Aller plus loin sur PHP-FPM** : le bonus de ce chapitre couvre la bascule et le pool par site. La [page PHP du wiki Debian](https://wiki.debian.org/PHP) détaille les variantes de configuration, et la [documentation officielle des pools FPM](https://www.php.net/manual/fr/install.fpm.configuration.php) donne toutes les directives `pm.*` pour dimensionner le nombre de processus selon la mémoire disponible.
- **Certificats reconnus** : hors laboratoire, [Let's Encrypt](https://letsencrypt.org/fr/) délivre gratuitement des certificats reconnus par tous les navigateurs, renouvelés automatiquement par `certbot`. La condition est de posséder un domaine public réellement accessible — ce qui exclut `fournil.lab`.
- **Durcir la configuration TLS** : le [générateur de configuration Mozilla SSL](https://ssl-config.mozilla.org/) produit les directives `SSLProtocol` / `SSLCipherSuite` à jour pour Apache, selon le niveau de compatibilité souhaité.
- [Documentation Apache — Virtual Hosts](https://httpd.apache.org/docs/2.4/fr/vhosts/) : la référence officielle, en français.
