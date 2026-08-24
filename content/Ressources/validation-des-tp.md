---
title: Validation technique des TP
description: Environnement, scénarios exécutés et écarts corrigés dans les travaux pratiques Linux.
---

# Validation technique des TP

> [!SUCCESS] Résultat
> Les dix TP ont été exécutés le 24 août 2026 dans une copie jetable de Debian 13 sous WSL2 avec systemd. Les commandes, résultats attendus, pannes guidées et nettoyages ont été contrôlés. Le support reste utilisable avec la VM Debian 12 du cours ; les différences de version sont signalées dans les TP.

## Environnement utilisé

| Élément      | Valeur de validation                                 |
| ------------ | ---------------------------------------------------- |
| Distribution | Debian GNU/Linux 13 (trixie)                         |
| Noyau        | Linux WSL2 6.18                                      |
| Init         | systemd 257                                          |
| DNS          | BIND 9.20                                            |
| Web          | Apache 2.4, PHP 8.4, MariaDB 11.8                    |
| Pare-feu     | nftables 1.1                                         |
| Messagerie   | Postfix 3.10, Dovecot 2.4                            |
| Stockage     | Deux périphériques loop de 4 et 10 Gio, LVM2 et ext4 |

La distribution `TSSR-TP-Validation` a été importée à partir d'une Debian propre afin de ne pas modifier l'environnement quotidien. Les services ont été installés et activés comme ils le seraient dans la VM de formation.

Après arrêt complet puis redémarrage de la distribution, SSH, cron, rsyslog, BIND, Apache, MariaDB, nftables, Postfix, Dovecot et le timer systemd étaient actifs. Une requête DNS, une requête HTTP et l'ouverture d'une session IMAP ont ensuite été rejouées avec succès.

## Matrice d'exécution

| TP             | Scénarios réellement exécutés                                                                                                                                      | Résultat |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------- |
| Stockage       | Échec par manque de `VFree`, ajout d'un PV, `vgextend`, extension 3 → 12 → 13 Gio, ext4 en ligne, réduction `resize2fs -M`, ré-agrandissement, `fstab`, `mount -a` | Validé   |
| Processus      | Jobs, `STOP`/`CONT`/`TERM`, niceness 15, arbre parent avec deux enfants et nettoyage par PID                                                                       | Validé   |
| systemd        | Arrêt/redémarrage SSH, activation au boot, unité oneshot, panne volontaire `203/EXEC`, rétablissement                                                              | Validé   |
| Journalisation | Boot courant, unité SSH, noyau, priorités, `rsyslog`, `auth.log` et `syslog`                                                                                       | Validé   |
| Performances   | Référence `vmstat`, charge d'un cœur avec `yes`, identification du PID, arrêt et retour à la normale                                                               | Validé   |
| Planification  | Exécution cron à la minute suivante, création/suppression `at`, service et timer systemd                                                                           | Validé   |
| DNS            | Zone `.test`, A, CNAME, serial, `rndc reload`, erreur de zone, sockets TCP/UDP 53                                                                                  | Validé   |
| LAMP           | Vhost, PHP, compte SQL dédié, table, affichage, mauvais DocumentRoot, mauvais mot de passe et journaux                                                             | Validé   |
| nftables       | Client dans un namespace séparé, SSH/DNS/HTTP autorisés, service 8080 filtré, handles, compteurs et persistance                                                    | Validé   |
| Messagerie     | Remise Postfix dans Maildir, suivi de l'ID de file, recherche Dovecot, session IMAP, mauvais chemin puis rétablissement                                            | Validé   |

## Corrections issues des essais

1. `Ctrl+Z` ne peut suspendre qu'un job au premier plan : le TP processus demande maintenant `fg` avant la suspension.
2. Un `SIGSTOP` envoyé au parent ne se propage pas automatiquement à ses enfants.
3. Sur un systemd récent, exécuter `daemon-reload` après modification de `fstab` évite l'avertissement de cache avant `findmnt --verify`.
4. `/var/log/auth.log` et `/var/log/syslog` dépendent de `rsyslog` sur une installation minimale.
5. Un port fermé sans service en écoute ne prouve pas le filtrage : le TP nftables démarre désormais un service 8080 témoin.
6. Une autorisation nftables ajoutée après un `drop` terminal est inatteignable ; elle doit être insérée avant ce verdict.
7. `.local` peut entrer en conflit avec mDNS ; les nouveaux exercices utilisent le domaine réservé `.test`.
8. Dovecot 2.4 remplace la syntaxe `mail_location` de Dovecot 2.3 par `mail_driver`, `mail_path` et `mail_inbox_path`.
9. RainLoop a été retiré du parcours obligatoire : son [dépôt officiel est archivé](https://github.com/RainLoop/rainloop-webmail).

## Limite de la validation WSL

Le montage défini dans `fstab` a été validé avec `findmnt --verify`, `daemon-reload`, `mount -a`, `findmnt` et un fichier témoin. Le redémarrage avec un disque LVM matériel doit encore être démontré par le stagiaire dans sa VM, car les périphériques loop WSL ne sont pas recréés automatiquement après l'arrêt de la distribution. Cette limite concerne le banc de test, pas les commandes du TP sur un disque virtuel attaché à VirtualBox.

## Règle de recette pour le formateur

Un TP n'est considéré comme terminé que si le stagiaire fournit les quatre éléments suivants :

1. l'état initial observé ;
2. la modification réalisée ;
3. une preuve fonctionnelle positive ;
4. une preuve de nettoyage ou de persistance selon le scénario.

Une simple absence de message d'erreur ne constitue pas une validation.
