# 2.6 Journalisation et logs (dont logs noyau)

> [!TIP] Commandes interactives
> <a href="https://kayasam.github.io/linux-bases-services/02-administration-systeme/commandes.html" target="_blank">Explorer les commandes de journalisation et leurs filtres</a>

**Objectifs** : savoir où chercher quand quelque chose ne va pas — journal centralisé systemd, messages noyau, fichiers texte classiques — et filtrer efficacement chaque source.

![Méthode de diagnostic TSSR](Ressources/images/diagnostic-tssr.svg)

> [!TIP] Lecture du schéma
> Un journal est plus utile lorsqu'il est corrélé à un test précis. Noter l'heure, reproduire le défaut, puis filtrer le bon service sur cette fenêtre réduit fortement le bruit.

---

### Une seule question, plusieurs sources

"Pourquoi ce service ne démarre pas ?", "Qui s'est connecté en SSH cette nuit ?", "Le disque a-t-il remonté une erreur matérielle ?" : à chaque fois, la réponse est dans un journal, mais pas toujours le même.

![Sources et consultation des journaux Linux](Ressources/images/sources-journalisation.svg)

> [!TIP] Lecture du schéma
> Plusieurs sources peuvent décrire le même incident. L'heure du test et l'unité concernée servent de points de corrélation pour extraire une preuve utile.

Depuis systemd, **journald** centralise la quasi-totalité de ces sources (noyau, services, authentification) dans un journal structuré, interrogeable avec `journalctl`. Certains programmes plus anciens (ou volontairement non intégrés à systemd) continuent en parallèle d'écrire dans des fichiers texte classiques sous `/var/log/`.

---

### journalctl : la commande à connaître par cœur

```bash
sudo journalctl           # Tous les journaux disponibles
sudo journalctl -r        # Du plus récent au plus ancien
sudo journalctl -b        # Uniquement le démarrage courant
sudo journalctl -b -1     # Le démarrage précédent
sudo journalctl -f        # Suivi en temps réel
sudo journalctl -u ssh    # Uniquement le service ssh (voir 2.5)
```

**Filtrer par date**

```bash
sudo journalctl --since "2026-08-24"
sudo journalctl --since "1 hour ago" --until "10 minutes ago"
```

**Filtrer par gravité (priorité)**

```bash
sudo journalctl -p err          # err et plus grave (crit, alert, emerg)
sudo journalctl -p err..alert   # Intervalle de priorités
```

| Code | Nom     | Signification            |
| ---- | ------- | ------------------------ |
| 0    | emerg   | Système inutilisable     |
| 1    | alert   | Action immédiate requise |
| 2    | crit    | Erreur critique          |
| 3    | err     | Erreur                   |
| 4    | warning | Avertissement            |
| 5    | notice  | Information notable      |
| 6    | info    | Information              |
| 7    | debug   | Débogage                 |

Moyen mnémotechnique : plus le code est **bas**, plus c'est **grave** (0 = urgence absolue, 7 = bavardage de debug) — l'inverse d'une note scolaire.

**Filtrer par origine fonctionnelle (facility)**

La **priority** répond à « quelle est la gravité du message ? ». La **facility** répond à « de quelle famille fonctionnelle provient-il ? ». Cette classification vient de syslog et reste enregistrée dans le champ structuré `SYSLOG_FACILITY` lorsqu'un programme la fournit.

```bash
sudo journalctl --facility=auth                  # Facility auth uniquement
sudo journalctl --facility=auth,authpriv         # Plusieurs facilities
sudo journalctl --facility=kern -p warning       # Noyau + warning ou plus grave
sudo journalctl --facility=cron --since today    # Tâches planifiées depuis aujourd'hui
journalctl --facility=help                       # Valeurs reconnues par cette version
```

| Code | Facility   | Origine ou usage habituel                                      |
| ---- | ---------- | -------------------------------------------------------------- |
| 0    | `kern`     | Messages du noyau                                              |
| 1    | `user`     | Programmes utilisateur ; facility générique par défaut         |
| 2    | `mail`     | Système de messagerie : MTA, remise et consultation            |
| 3    | `daemon`   | Démons système sans facility spécialisée                       |
| 4    | `auth`     | Authentification et sécurité                                   |
| 5    | `syslog`   | Messages internes du service syslog                            |
| 6    | `lpr`      | Impression                                                     |
| 7    | `news`     | Services Usenet/news                                           |
| 8    | `uucp`     | Services UUCP historiques                                      |
| 9    | `cron`     | Ordonnanceurs cron et at                                       |
| 10   | `authpriv` | Authentification contenant potentiellement des données privées |
| 11   | `ftp`      | Service FTP                                                    |
| 12   | —          | Réservé                                                        |
| 13   | —          | Réservé                                                        |
| 14   | —          | Réservé                                                        |
| 15   | —          | Réservé                                                        |
| 16   | `local0`   | Usage local défini par l'administrateur ou l'application       |
| 17   | `local1`   | Usage local défini par l'administrateur ou l'application       |
| 18   | `local2`   | Usage local défini par l'administrateur ou l'application       |
| 19   | `local3`   | Usage local défini par l'administrateur ou l'application       |
| 20   | `local4`   | Usage local défini par l'administrateur ou l'application       |
| 21   | `local5`   | Usage local défini par l'administrateur ou l'application       |
| 22   | `local6`   | Usage local défini par l'administrateur ou l'application       |
| 23   | `local7`   | Usage local défini par l'administrateur ou l'application       |

Les facilities `local0` à `local7` n'ont pas de sens imposé : une entreprise peut, par exemple, réserver `local0` à une application métier et configurer rsyslog pour l'envoyer dans un fichier ou vers un collecteur distant dédié.

> [!IMPORTANT] Limite du filtre
> Une facility n'est ni une unité systemd ni le nom d'un programme. Certains messages écrits directement dans journald ne possèdent pas le champ `SYSLOG_FACILITY` ; ils ne ressortiront donc pas avec `--facility`. Pour cibler précisément un service, utiliser plutôt `-u`, `_COMM=`, `_EXE=` ou `SYSLOG_IDENTIFIER=` selon le contexte.

---

### Logs noyau : dmesg et journalctl -k

Le noyau produit ses propres messages (matériel détecté, modules chargés/déchargés, erreurs bas-niveau, ...), historiquement stockés dans un tampon circulaire (_ring buffer_) consultable au boot ou après coup :

```bash
dmesg                     # Affiche le tampon de messages noyau
dmesg -T                  # Avec horodatage lisible (au lieu du temps depuis le boot)
dmesg --level=err,warn    # Filtré par niveau de gravité
dmesg -w                  # Suivi en temps réel (équivalent -f pour le noyau)

# Équivalent via journalctl, puisque journald absorbe aussi les messages noyau :
sudo journalctl -k
sudo journalctl -k -b
```

Moyen mnémotechnique : `dmesg` = **d**iagnostic **mesg**ages (du noyau) ; `-k` de journalctl = **k**ernel.

---

### Les fichiers classiques de `/var/log/`

| Fichier             | Contenu                                                   |
| ------------------- | --------------------------------------------------------- |
| `/var/log/syslog`   | Messages généraux du système                              |
| `/var/log/auth.log` | Authentification (`sudo`, SSH, ...)                       |
| `/var/log/kern.log` | Messages noyau (miroir de `dmesg`)                        |
| `/var/log/dpkg.log` | Actions sur les paquets Debian                            |
| `/var/log/apache2/` | Logs Apache (`access.log`, `error.log` — voir chapitre 4) |
| `/var/log/mail.log` | Logs Postfix/Dovecot (voir chapitre 6)                    |

```bash
sudo tail -n 30 /var/log/syslog     # Dernières lignes
sudo tail -f /var/log/syslog        # Suivi en temps réel
sudo grep "error" /var/log/syslog   # Recherche d'un mot-clé
```

> [!NOTE]
> Ces fichiers grossiraient indéfiniment sans **logrotate** (`/etc/logrotate.conf` et `/etc/logrotate.d/`), qui les compresse puis les supprime après un délai configuré. Journald a son propre mécanisme équivalent (quotas de taille dans `/etc/systemd/journald.conf`).

### Exploiter les champs structurés de journald

Contrairement à un simple fichier texte, une entrée journald possède des champs : unité, PID, UID, exécutable, priorité, boot, etc.

```bash
sudo journalctl -u apache2 -o short-iso
sudo journalctl _PID=1234
sudo journalctl _COMM=sshd
sudo journalctl -u ssh -p warning --since "today"
sudo journalctl -o json-pretty -n 1
```

`journalctl -g 'motif'` filtre le message par expression régulière sur les versions récentes de systemd. Pour exporter sans pagination ni couleurs dans un ticket :

```bash
sudo journalctl -u bind9 --since "10 minutes ago" --no-pager -o short-iso
```

### Persistance et occupation disque

Selon la distribution, le journal peut être volatil (`/run/log/journal`, perdu au reboot) ou persistant (`/var/log/journal`).

```bash
journalctl --list-boots
journalctl --disk-usage
sudo journalctl --vacuum-time=30d       # politique ponctuelle, à employer consciemment
```

> [!WARNING] Données sensibles
> Les journaux peuvent contenir des noms d'utilisateurs, adresses IP, chemins et parfois des secrets mal journalisés par une application. Ne pas copier un journal complet dans un ticket public ; extraire la fenêtre et les champs nécessaires, puis anonymiser ce qui doit l'être.

> [!NOTE]
> **À retenir**
>
> - `journalctl` centralise noyau + services + authentification ; `dmesg`/`journalctl -k` isole le noyau.
> - Priorités : plus le chiffre est bas, plus c'est grave (0 = système inutilisable, 7 = debug).
> - Facilities : elles classent l'origine fonctionnelle (`auth`, `mail`, `cron`, `daemon`...), indépendamment de la gravité.
> - `/var/log/` reste incontournable pour les programmes non intégrés à systemd — les deux sources se complètent, elles ne se remplacent pas totalement.
