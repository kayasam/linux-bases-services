# 2.6 Journalisation et logs (dont logs noyau)

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
sudo journalctl --facility auth                  # Facility auth uniquement
sudo journalctl --facility auth,authpriv         # Plusieurs facilities
sudo journalctl --facility kern -p warning       # Noyau + warning ou plus grave
sudo journalctl --facility cron --since today    # Tâches planifiées depuis aujourd'hui
journalctl --facility help                       # Valeurs reconnues par cette version
```

> [!NOTE] Deux écritures valides
> Les options longues acceptent ici les deux formes : `--facility auth` et `--facility=auth`. Le cours utilise la forme avec une espace pour améliorer la lisibilité des exemples.

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
| 12   | —          | Valeur réservée                                                |
| 13   | —          | Valeur réservée                                                |
| 14   | —          | Valeur réservée                                                |
| 15   | —          | Valeur réservée                                                |
| 16   | `local0`   | Usage local défini par l'administrateur ou l'application       |
| 17   | `local1`   | Usage local défini par l'administrateur ou l'application       |
| 18   | `local2`   | Usage local défini par l'administrateur ou l'application       |
| 19   | `local3`   | Usage local défini par l'administrateur ou l'application       |
| 20   | `local4`   | Usage local défini par l'administrateur ou l'application       |
| 21   | `local5`   | Usage local défini par l'administrateur ou l'application       |
| 22   | `local6`   | Usage local défini par l'administrateur ou l'application       |
| 23   | `local7`   | Usage local défini par l'administrateur ou l'application       |

Les facilities `local0` à `local7` n'ont pas de sens imposé. Une entreprise peut, par exemple, réserver `local0` à une application métier et l'acheminer vers un fichier ou un collecteur distant dédié avec rsyslog.

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

### Configuration et données : comprendre les chemins avec le FHS

Le **Filesystem Hierarchy Standard (FHS)** sépare la configuration statique propre à la machine, les données temporaires du démarrage courant et les données variables conservées. Cette logique explique les chemins utilisés par journald.

![Journald dans le FHS : fichiers de configuration, stockage volatil et stockage persistant](Ressources/images/journald-fhs.svg)

> [!TIP] Lecture du schéma
> Lire de haut en bas : les fichiers de configuration sont fusionnés selon leur priorité, `systemd-journald` applique le résultat, puis `Storage=` oriente les entrées vers `/run/log/journal` ou `/var/log/journal`. `journalctl` consulte ces fichiers binaires ; les fichiers texte `/var/log/*.log` constituent une sortie distincte.

| Chemin                                          | Rôle FHS                                                | Contenu lié aux journaux                                               | Persistance                               |
| ----------------------------------------------- | ------------------------------------------------------- | ---------------------------------------------------------------------- | ----------------------------------------- |
| `/etc/systemd/journald.conf`                    | `/etc` : configuration locale propre à l'hôte           | Fichier principal de configuration de `systemd-journald`               | Oui                                       |
| `/etc/systemd/journald.conf.d/*.conf`           | `/etc` : surcharges de l'administrateur                 | Fragments locaux recommandés                                           | Oui                                       |
| `/usr/lib/systemd/journald.conf.d/*.conf`       | `/usr` : fichiers statiques fournis par la distribution | Paramètres installés par les paquets ; ne pas les modifier directement | Oui, mais remplacés lors des mises à jour |
| `/usr/local/lib/systemd/journald.conf.d/*.conf` | `/usr/local` : installation locale de logiciels         | Paramètres fournis par un logiciel installé localement                 | Oui                                       |
| `/run/systemd/journald.conf.d/*.conf`           | `/run` : état et configuration d'exécution              | Surcharges temporaires valables jusqu'au redémarrage                   | Non                                       |
| `/run/log/journal/<machine-id>/`                | `/run` : données du démarrage courant                   | Journal binaire **volatile**                                           | Non                                       |
| `/var/log/journal/<machine-id>/`                | `/var/log` : journaux variables                         | Journal binaire **persistant**                                         | Oui                                       |
| `/var/log/*.log` et sous-répertoires            | `/var/log` : journaux texte                             | Fichiers produits directement ou exportés par rsyslog                  | Oui                                       |

`<machine-id>` correspond généralement au contenu de `/etc/machine-id`. Dans le répertoire, on rencontre notamment :

- `system.journal` : journal système actif ;
- `user-UID.journal` : journal d'un utilisateur lorsque la séparation par UID est active ;
- `system@….journal` : fichier archivé après rotation ;
- `*.journal~` : fichier non terminé ou considéré hors ligne après un arrêt incorrect.

> [!WARNING] Les fichiers `.journal` sont binaires
> Ne pas les ouvrir ou les modifier avec un éditeur de texte. Utiliser `journalctl`, `journalctl --file`, `journalctl --directory` ou `journalctl --verify`. Les fichiers texte de `/var/log/` relèvent souvent de rsyslog ou directement de l'application : ils complètent le journal binaire, mais ne sont pas le même stockage.

Commandes pour identifier le mode réellement utilisé :

```bash
cat /etc/machine-id
sudo ls -lah /run/log/journal /var/log/journal 2>/dev/null
journalctl --header | head -n 20
journalctl --disk-usage
```

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

---

### Configurer systemd-journald dans `/etc`

`journalctl` est la **commande de consultation**. Le composant qui collecte et stocke les messages est le démon **`systemd-journald`**. C'est donc sa configuration que l'administrateur modifie dans `/etc`.

Le fichier principal est `/etc/systemd/journald.conf`, mais un **drop-in** local est préférable : il isole les choix de l'administrateur, facilite l'audit et évite de recopier tout le fichier principal.

#### Ordre de priorité des fichiers

1. les valeurs intégrées à systemd constituent les valeurs par défaut ;
2. le fichier principal `/etc/systemd/journald.conf` peut les remplacer ;
3. les fragments `journald.conf.d/*.conf` sont ensuite fusionnés par ordre lexicographique ;
4. à nom identique, l'ordre de priorité est `/etc` > `/run` > `/usr/local/lib` > `/usr/lib`.

Les paquets utilisent `/usr/lib/systemd/journald.conf.d/`. L'administrateur utilise `/etc/systemd/journald.conf.d/`. Un fichier local nommé par exemple `60-tssr.conf` est plus lisible qu'une modification cachée dans un fichier fourni par la distribution.

#### Paramètres importants

Toutes les directives se placent dans la section `[Journal]`.

| Paramètre               | Valeurs ou exemple                       | Effet                                                       |
| ----------------------- | ---------------------------------------- | ----------------------------------------------------------- |
| `Storage=`              | `auto`, `persistent`, `volatile`, `none` | Choisit le stockage persistant, volatil ou désactivé        |
| `Compress=`             | `yes` ou `no`                            | Compresse les objets suffisamment grands                    |
| `SystemMaxUse=`         | `500M`, `2G`                             | Limite globale sous `/var/log/journal`                      |
| `SystemKeepFree=`       | `1G`                                     | Espace disque que journald doit laisser libre               |
| `SystemMaxFileSize=`    | `128M`                                   | Taille maximale d'un fichier persistant avant rotation      |
| `RuntimeMaxUse=`        | `200M`                                   | Limite globale sous `/run/log/journal`                      |
| `MaxRetentionSec=`      | `30day`                                  | Durée maximale de conservation ; `0` désactive cette limite |
| `MaxFileSec=`           | `1month`                                 | Durée maximale couverte par un seul fichier avant rotation  |
| `RateLimitIntervalSec=` | `30s`                                    | Fenêtre temporelle de limitation des messages               |
| `RateLimitBurst=`       | `10000`                                  | Nombre de messages autorisés par service dans cette fenêtre |
| `ForwardToSyslog=`      | `yes` ou `no`                            | Transmet aussi les messages à un démon syslog compatible    |
| `ForwardToKMsg=`        | `yes` ou `no`                            | Transmet vers le tampon de messages du noyau                |
| `ForwardToConsole=`     | `yes` ou `no`                            | Transmet vers la console système ; très bavard              |
| `SplitMode=`            | `uid` ou `none`                          | Sépare ou non les journaux persistants des utilisateurs     |

> [!NOTE] `System*` ou `Runtime*` ?
> Les paramètres `System…` concernent `/var/log/journal`, donc le stockage persistant. Les paramètres `Runtime…` concernent `/run/log/journal`, donc le stockage volatil. `SystemMaxUse=` limite l'espace que journald peut encore consommer ; il ne garantit pas que l'occupation redescende instantanément sous cette valeur, notamment parce que le fichier actif n'est pas supprimé.

#### Exemple sûr avec un drop-in

```bash
# 1. Créer le répertoire réservé aux réglages locaux
sudo install -d -m 0755 /etc/systemd/journald.conf.d

# 2. Éditer un fichier local clairement identifié
sudoedit /etc/systemd/journald.conf.d/60-tssr.conf
```

Contenu proposé pour un serveur de laboratoire :

```ini
[Journal]
Storage=persistent
Compress=yes
SystemMaxUse=500M
SystemKeepFree=1G
MaxRetentionSec=30day
RateLimitIntervalSec=30s
RateLimitBurst=10000
```

#### Vérifier puis appliquer

```bash
# Afficher la configuration fusionnée et sa provenance
systemd-analyze cat-config systemd/journald.conf

# Relancer le démon pour relire la configuration
sudo systemctl restart systemd-journald
sudo systemctl status systemd-journald --no-pager
sudo journalctl -u systemd-journald -b -p warning --no-pager

# Basculer les événements du début de boot vers le stockage persistant
sudo journalctl --flush

# Contrôler le stockage et l'intégrité des fichiers
journalctl --disk-usage
sudo journalctl --verify
sudo ls -lah /var/log/journal/"$(cat /etc/machine-id)"/
```

La commande `systemctl daemon-reload` n'est pas nécessaire ici : elle sert à faire relire les **unités systemd**, pas les fichiers de configuration propres au service. C'est le redémarrage de `systemd-journald` qui lui fait relire `journald.conf`.

> [!WARNING] Effet de `Storage=none`
> Cette valeur supprime le stockage des messages reçus. Les éventuels transferts vers la console, le noyau ou syslog peuvent continuer selon les autres options, mais `journalctl` ne disposera plus de ces entrées. Ne pas l'utiliser comme simple moyen de gagner de l'espace.

#### Rotation et nettoyage ponctuel

```bash
sudo journalctl --rotate                 # Ferme le fichier actif et en crée un nouveau
sudo journalctl --vacuum-size=500M       # Supprime des archives jusqu'à la taille visée
sudo journalctl --vacuum-time=30d        # Supprime les archives plus anciennes
journalctl --disk-usage                  # Mesure après nettoyage
```

`--vacuum-*` agit sur les fichiers **archivés**, pas sur le fichier actuellement actif. Enchaîner `--rotate` puis `--vacuum-*` rend donc le nettoyage plus efficace et plus prévisible.

---

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

### Contrôler la persistance et l'occupation disque

Selon la distribution, le journal peut être volatil (`/run/log/journal`, perdu au reboot) ou persistant (`/var/log/journal`).

```bash
journalctl --list-boots
journalctl --disk-usage
systemd-analyze cat-config systemd/journald.conf
sudo journalctl --verify
```

> [!WARNING] Données sensibles
> Les journaux peuvent contenir des noms d'utilisateurs, adresses IP, chemins et parfois des secrets mal journalisés par une application. Ne pas copier un journal complet dans un ticket public ; extraire la fenêtre et les champs nécessaires, puis anonymiser ce qui doit l'être.

> [!NOTE]
> **À retenir**
>
> - `journalctl` centralise noyau + services + authentification ; `dmesg`/`journalctl -k` isole le noyau.
> - Priorités : plus le chiffre est bas, plus c'est grave (0 = système inutilisable, 7 = debug).
> - Facilities : elles classent l'origine fonctionnelle (`auth`, `mail`, `cron`, `daemon`...), indépendamment de la gravité.
> - `/etc` configure, `/run/log/journal` stocke temporairement et `/var/log/journal` conserve entre les redémarrages.
> - Préférer un drop-in `/etc/systemd/journald.conf.d/*.conf`, puis vérifier la configuration fusionnée avant et après redémarrage du service.
> - `/var/log/` reste incontournable pour les programmes non intégrés à systemd — les deux sources se complètent, elles ne se remplacent pas totalement.

---

### Références officielles

- [journald.conf — configuration, précédence et paramètres](https://www.freedesktop.org/software/systemd/man/latest/journald.conf.html)
- [journalctl — lecture, filtres et vérification](https://www.freedesktop.org/software/systemd/man/latest/journalctl.html)
- [Filesystem Hierarchy Standard 3.0](https://refspecs.linuxfoundation.org/FHS_3.0/fhs-3.0.html)
