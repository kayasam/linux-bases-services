# TP 6 — Serveur mail complet

> [!TIP] Ressource du TP
>
> - <a href="https://kayasam.github.io/linux-bases-services/telechargements/06-messagerie/tp/06-messagerie.md" download>Télécharger ce TP en Markdown</a>

> Chapitre associé : `Cours.md`
>
> Durée estimée : 2 heures — laboratoire privé uniquement

> [!WARNING] Choix du webmail
> RainLoop n'est plus maintenu. Les étapes 6 à 8 servent uniquement à reproduire le laboratoire historique sans exposition Internet. Selon la consigne donnée, un client IMAP maintenu peut le remplacer ; les preuves Postfix/Dovecot restent identiques.

_**Consigne**_ :

1. Installer Postfix (mode "Internet Site") avec votre propre nom de domaine
2. Configurer `home_mailbox = Maildir/` dans `main.cf`, redémarrer Postfix
3. Créer 2 utilisateurs Linux locaux (2 boîtes mail)
4. Installer Dovecot IMAP, configurer le `mail_location` en Maildir
5. Envoyer un mail en ligne de commande d'un utilisateur vers l'autre, et vérifier son arrivée dans le `Maildir`
    <details>
    <summary>Clique ici pour un indice</summary>
    La commande `mail -s "sujet" destinataire` (paquet `mailutils` si absent) permet d'envoyer un mail simple depuis le terminal.
    </details>
6. Installer Rainloop dans le webroot Apache installé au chapitre 4
7. Configurer un domaine dans l'admin Rainloop (IMAP `localhost:143`, SMTP `localhost:25`)
8. Se connecter en webmail avec un des deux utilisateurs, et envoyer un mail à l'autre via l'interface web
9. Vérifier dans `journalctl -u postfix` et `journalctl -u dovecot` que les deux échanges (CLI et webmail) apparaissent bien

### Défi : suivre un message de bout en bout

Envoyer un message avec un sujet unique contenant l'heure. Relever l'identifiant de file Postfix et l'utiliser pour suivre le message dans les journaux jusqu'au fichier Maildir, puis jusqu'à sa consultation IMAP.

Introduire ensuite un mauvais `mail_location` côté Dovecot :

1. montrer que l'envoi SMTP réussit toujours ;
2. montrer que le fichier est bien livré dans le Maildir attendu par Postfix ;
3. expliquer pourquoi le client IMAP ne le voit plus ;
4. corriger, valider avec `doveconf -n`, recharger et prouver la consultation.

Livrable : schéma annoté avec protocole/port, identifiant de file, extraits de journaux corrélés et preuve finale. Ne joindre aucun mot de passe.
