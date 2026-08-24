# TP 6 — Serveur mail complet

> [!TIP] Ressource du TP
>
> - <a href="https://kayasam.github.io/linux-bases-services/telechargements/06-messagerie/tp/06-messagerie.md" download>Télécharger ce TP en Markdown</a>

> Chapitre associé : [service de messagerie](06-messagerie/cours)
>
> Durée estimée : 2 heures — laboratoire privé uniquement

> [!WARNING] Choix du webmail
> RainLoop n'est plus maintenu et son dépôt officiel est archivé. Il est retiré du parcours obligatoire. Utiliser un client IMAP maintenu si une interface graphique est souhaitée ; les preuves Postfix/Dovecot restent identiques.

> [!SUCCESS] Procédure vérifiée
> La soumission locale, la remise Maildir, l'identifiant de file Postfix, la consultation IMAP et la panne volontaire de chemin ont été testés sur Postfix 3.10 et Dovecot 2.4.

_**Consigne**_ :

1. Installer Postfix (mode "Internet Site") avec votre propre nom de domaine
2. Configurer `myhostname`, `mydomain`, `mydestination` et `home_mailbox = Maildir/` dans `main.cf`, valider avec `postfix check`, puis redémarrer Postfix
3. Créer 2 utilisateurs Linux locaux (2 boîtes mail)
4. Installer Dovecot IMAP et configurer l'accès au même `~/Maildir` que Postfix, en tenant compte de la version ci-dessous
5. Envoyer un mail en ligne de commande d'un utilisateur vers l'autre, et vérifier son arrivée dans le `Maildir`
    <details>
    <summary>Clique ici pour un indice</summary>
    La commande `mail -s "sujet" destinataire` (paquet `mailutils` si absent) permet d'envoyer un mail simple depuis le terminal.
    </details>
6. Vérifier que Postfix écoute sur TCP 25 et Dovecot sur TCP 143 avec `ss -lntp`
7. Valider la configuration avec `postfix check`, `postconf -n` et `doveconf -n`
8. Prouver que Dovecot voit le message avec `doveadm search -u DESTINATAIRE mailbox INBOX ALL`, puis réaliser une connexion IMAP depuis un client du laboratoire
9. Corréler l'échange dans `journalctl` ou `/var/log/mail.log`, sans publier de mot de passe

> [!IMPORTANT] Dovecot 2.3 et 2.4
> Vérifier d'abord `dovecot --version`. Sur Debian 12 avec Dovecot 2.3, utiliser `mail_location = maildir:~/Maildir`. Sur Debian 13 avec Dovecot 2.4, la configuration équivalente est :
>
> ```text
> mail_driver = maildir
> mail_path = ~/Maildir
> mail_inbox_path = ~/Maildir
> ```
>
> Pour un test IMAP sans TLS, l'option est `disable_plaintext_auth = no` en 2.3 et `auth_allow_cleartext = yes` en 2.4. Cette exception est réservée au réseau privé de laboratoire ; en production, configurer TLS avant toute authentification.

> [!NOTE] Correction formateur
> La correction détaillée est conservée dans le coffre pédagogique.

### Défi : suivre un message de bout en bout

Envoyer un message avec un sujet unique contenant l'heure. Relever l'identifiant de file Postfix et l'utiliser pour suivre le message dans les journaux jusqu'au fichier Maildir, puis jusqu'à sa consultation IMAP.

Selon l'image Debian, les événements de transport apparaissent dans `journalctl -u postfix`, `/var/log/mail.log`, ou les deux si `rsyslog` est installé. L'identifiant ressemble à `28EA48401` et doit être réutilisé tel quel dans la recherche.

Introduire ensuite un mauvais chemin de boîte côté Dovecot (`mail_location` en 2.3 ou `mail_path` en 2.4) :

1. montrer que l'envoi SMTP réussit toujours ;
2. montrer que le fichier est bien livré dans le Maildir attendu par Postfix ;
3. expliquer pourquoi le client IMAP ne le voit plus ;
4. corriger, valider avec `doveconf -n`, recharger et prouver la consultation.

Livrable : schéma annoté avec protocole/port, identifiant de file, extraits de journaux corrélés et preuve finale. Ne joindre aucun mot de passe.

### Extension facultative : client graphique

Configurer Thunderbird ou un webmail actuellement maintenu avec IMAP 143 et SMTP 25 sur le réseau privé. Ne pas installer RainLoop depuis l'ancienne archive et ne jamais exposer une authentification en clair à Internet.
