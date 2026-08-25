# 6. Service mail : Postfix (SMTP) + Dovecot (IMAP) + Rainloop (webmail)

**Objectifs** : mettre en place un serveur mail local complet — envoi (Postfix), consultation (Dovecot), interface web (Rainloop) — pour des boîtes mail d'utilisateurs Linux locaux.

![Chaîne de traitement d'un courrier](Ressources/images/chaine-mail.svg)

> [!TIP] Lecture du schéma
> SMTP sert à transporter ou soumettre un message ; IMAP sert à consulter une boîte. Le webmail ne stocke pas magiquement le courrier : c'est un client des deux protocoles.

---

### Principe d'une chaîne mail complète

- **Postfix** (MTA) : reçoit et envoie les mails (protocole SMTP)
- **Dovecot** (MDA/serveur IMAP) : donne accès aux boîtes mail stockées localement
- **Rainloop** (webmail) : interface web qui parle IMAP/SMTP en coulisses, comme n'importe quel client mail

> [!WARNING] RainLoop est désormais un composant historique
> Le dépôt officiel RainLoop a été archivé en novembre 2024 et sa dernière version publiée date de 2022. On peut le conserver pour reproduire ce laboratoire isolé, mais pas le recommander pour une nouvelle mise en production. Préférer un webmail maintenu ; SnappyMail est notamment issu de RainLoop. Le cœur pédagogique de ce chapitre reste Postfix + Dovecot, indépendant de l'interface web.

Moyen mnémotechnique : Postfix **poste** le courrier, Dovecot le **range dans le pigeonnier** (boîte mail), Rainloop est **le guichet** par lequel on vient le consulter.

---

### Installation de Postfix

```bash
sudo apt install -y postfix
```

Lors de l'installation, choisir **Internet Site**, et renseigner le nom de domaine interne `founil.lab`.
Pour reconfigurer après coup :

```bash
sudo dpkg-reconfigure postfix
```

Extrait important de `/etc/postfix/main.cf` :

```text
myhostname = mail.founil.lab
mydomain = founil.lab
mydestination = $myhostname, $mydomain, localhost
home_mailbox = Maildir/
```

`home_mailbox = Maildir/` fait écrire les mails au format **Maildir** (un fichier par mail) dans le répertoire personnel de chaque utilisateur — format attendu par Dovecot.

```bash
sudo systemctl restart postfix
sudo systemctl enable postfix
```

`mydestination` définit les domaines considérés comme **locaux**. Il ne faut pas transformer le serveur en relais ouvert : un serveur exposé ne doit accepter le relais vers des domaines externes que pour des clients authentifiés ou des réseaux explicitement autorisés.

---

### Créer des utilisateurs locaux (= boîtes mail)

Sans annuaire externe, chaque **utilisateur Linux local** possède potentiellement une boîte mail :

```bash
sudo adduser alice
sudo adduser bob
```

---

### Installation de Dovecot (IMAP)

```bash
sudo apt install -y dovecot-imapd
```

Dans `/etc/dovecot/conf.d/10-mail.conf` :

```text
mail_location = maildir:~/Maildir
```

Dans `/etc/dovecot/conf.d/10-auth.conf` (⚠️ authentification en clair, acceptable uniquement en labo isolé) :

```text
disable_plaintext_auth = no
```

```bash
sudo systemctl restart dovecot
sudo systemctl enable dovecot
```

---

### Tester en ligne de commande

```bash
sudo apt install -y mailutils
echo "Ceci est un test" | mail -s "Sujet du test" bob@founil.lab

sudo ls /home/bob/Maildir/new/           # Le mail doit apparaitre ici

journalctl -u postfix                    # Journaux d'envoi
journalctl -u dovecot                    # Journaux de connexion IMAP
sudo tail -f /var/log/mail.log
```

Vérifier également les sockets et la configuration effectivement chargée :

```bash
sudo postfix check
postconf -n
sudo doveconf -n
ss -lntp | grep -E ':(25|143|587|993)\b'
```

Pour observer un dialogue SMTP local sans dépendre du webmail :

```bash
nc localhost 25
```

Puis saisir, ligne par ligne :

```text
EHLO client-labo
MAIL FROM:<alice@founil.lab>
RCPT TO:<bob@founil.lab>
DATA
Subject: test SMTP

Message de test
.
QUIT
```

Les codes SMTP commencent par `2` en cas de succès temporaire/final, `4` pour une erreur temporaire et `5` pour un refus permanent. Conserver l'identifiant de file affiché par Postfix permet de suivre le même message dans les journaux.

### Suivre un message de bout en bout

```bash
mailq                                      # file d'attente Postfix
sudo postqueue -p
sudo find /home/bob/Maildir -type f
sudo journalctl -u postfix -u dovecot --since "5 minutes ago"
```

| Symptôme                                    | Couche à vérifier en premier             |
| ------------------------------------------- | ---------------------------------------- |
| refus SMTP immédiat                         | Postfix, destinataire, règles de relais  |
| message bloqué dans `mailq`                 | résolution DNS, transport ou destination |
| fichier présent dans Maildir mais invisible | configuration/authentification Dovecot   |
| IMAP fonctionne mais webmail échoue         | PHP, configuration ou logs du webmail    |

> [!NOTE] Ports à connaître
> `25/tcp` : transport SMTP entre serveurs ; `587/tcp` : soumission authentifiée ; `143/tcp` : IMAP, éventuellement mis à niveau avec STARTTLS ; `993/tcp` : IMAP sur TLS implicite. Le laboratoire en clair ne doit rester accessible que sur le réseau privé.

---

### Installer Rainloop (webmail)

Rainloop nécessite un serveur web + PHP (chapitre 4) :

```bash
cd /var/www/html
sudo mkdir rainloop && cd rainloop
sudo apt install -y unzip
sudo curl -sL https://www.rainloop.net/repository/webmail/rainloop-latest.zip -o rainloop.zip
sudo unzip rainloop.zip -d .
sudo rm rainloop.zip
sudo chown -R www-data:www-data /var/www/html/rainloop
```

Cette procédure est conservée uniquement pour compatibilité avec le TP historique. Vérifier l'archive téléchargée et ne jamais exposer cette installation à Internet. Protéger impérativement le répertoire `data` contre tout accès HTTP et changer les identifiants administrateur dès la première connexion.

Accéder à l'interface :

- Admin : `http://192.168.56.200/rainloop/?admin` (identifiants par défaut `admin` / `12345`, à changer immédiatement)
- Dans l'admin, section **Domaines** : créer le domaine `founil.lab` avec IMAP = `localhost:143` (sans SSL) et SMTP = `localhost:25`
- Webmail utilisateur : `http://192.168.56.200/rainloop/` — se connecter avec `alice`/mot de passe Linux d'alice

> [!NOTE]
> Comme la connexion se fait en clair (labo pédagogique), pensez bien à `disable_plaintext_auth = no` côté Dovecot, sinon Rainloop ne pourra pas s'authentifier en IMAP.

> [!NOTE]
> **À retenir**
>
> - Postfix (SMTP) envoie/reçoit, Dovecot (IMAP) donne accès à la boîte déjà reçue, Rainloop n'est qu'une interface par-dessus les deux.
> - `home_mailbox = Maildir/` est ce qui relie Postfix et Dovecot : les deux doivent s'accorder sur le même format de stockage.
> - En labo, l'authentification en clair est acceptable ; en production, elle imposerait TLS (port 587/993) — hors périmètre de ce chapitre.
