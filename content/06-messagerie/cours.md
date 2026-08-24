# 6. Service mail : Postfix (SMTP) + Dovecot (IMAP)

> [!TIP] Commandes interactives
> <a href="https://kayasam.github.io/linux-bases-services/06-messagerie/commandes.html" target="_blank">Explorer les commandes Postfix et Dovecot</a>

**Objectifs** : mettre en place un serveur mail local complet — envoi avec Postfix et consultation avec Dovecot — pour des boîtes mail d'utilisateurs Linux locaux. Un client graphique maintenu peut être ajouté en extension.

![Chaîne de traitement d'un courrier](Ressources/images/chaine-mail.svg)

> [!TIP] Lecture du schéma
> SMTP sert à transporter ou soumettre un message ; IMAP sert à consulter une boîte. Le webmail ne stocke pas magiquement le courrier : c'est un client des deux protocoles.

---

### Principe d'une chaîne mail complète

- **Postfix** (MTA) : reçoit et envoie les mails (protocole SMTP)
- **Dovecot** (MDA/serveur IMAP) : donne accès aux boîtes mail stockées localement
- **Client mail** : interface graphique ou Web qui parle IMAP/SMTP, sans participer lui-même au transport ni au stockage

> [!WARNING] RainLoop est désormais un composant historique
> Le dépôt officiel RainLoop a été archivé en novembre 2024. Son installation a donc été retirée du parcours vérifié. Le cœur pédagogique reste Postfix + Dovecot, indépendant de l'interface utilisée.

Moyen mnémotechnique : Postfix **poste** le courrier, Dovecot ouvre le **pigeonnier** (boîte mail), et le client est **le guichet** utilisé pour le consulter.

---

### Installation de Postfix

```bash
sudo apt install -y postfix
```

Lors de l'installation, choisir **Internet Site**, et renseigner le nom de domaine (ex : `dawan-s35.local`).
Pour reconfigurer après coup :

```bash
sudo dpkg-reconfigure postfix
```

Extrait important de `/etc/postfix/main.cf` :

```text
myhostname = mail.dawan-s35.local
mydomain = dawan-s35.local
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

> [!IMPORTANT] Compatibilité Dovecot 2.4 — Debian 13
> `mail_location` et `disable_plaintext_auth` correspondent à Dovecot 2.3, fourni notamment par Debian 12. Avec Dovecot 2.4, utiliser plutôt :
>
> ```text
> mail_driver = maildir
> mail_path = ~/Maildir
> mail_inbox_path = ~/Maildir
> auth_allow_cleartext = yes
> ```
>
> Vérifier la version avec `dovecot --version` et la configuration calculée avec `doveconf -n`. L'authentification en clair reste strictement réservée au laboratoire privé.

```bash
sudo systemctl restart dovecot
sudo systemctl enable dovecot
```

---

### Tester en ligne de commande

```bash
sudo apt install -y mailutils
echo "Ceci est un test" | mail -s "Sujet du test" bob@dawan-s35.local

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
MAIL FROM:<alice@dawan-s35.local>
RCPT TO:<bob@dawan-s35.local>
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

### Ajouter éventuellement un client mail

RainLoop n'est plus installé dans le parcours : son dépôt officiel est archivé et l'ancienne archive de téléchargement ne constitue plus une base fiable. Pour une démonstration graphique, utiliser Thunderbird ou un webmail actuellement maintenu dans le réseau privé.

Paramètres du laboratoire :

- IMAP : serveur `mail.dawan-s35.local`, port 143, sans TLS uniquement dans le réseau isolé ;
- SMTP : serveur `mail.dawan-s35.local`, port 25 pour le test local ;
- utilisateur : compte Linux local, par exemple `alice` ou `bob`.

Avant le client graphique, prouver le fonctionnement côté serveur :

```bash
sudo postfix check
sudo doveconf -n
sudo doveadm search -u bob mailbox INBOX ALL
ss -lntp | grep -E ':(25|143)\b'
```

> [!NOTE]
> **À retenir**
>
> - Postfix (SMTP) envoie/reçoit, Dovecot (IMAP) donne accès à la boîte déjà reçue ; le client n'est qu'une interface par-dessus les deux.
> - `home_mailbox = Maildir/` est ce qui relie Postfix et Dovecot : les deux doivent s'accorder sur le même format de stockage.
> - En labo, l'authentification en clair est acceptable ; en production, elle imposerait TLS (port 587/993) — hors périmètre de ce chapitre.
