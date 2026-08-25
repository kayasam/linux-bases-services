# 2.5 Gestion des services (systemd)

> [!TIP] Auto-évaluation
> [Mini-quiz interactif — 10 questions](https://kayasam.github.io/linux-bases-services/02-administration-systeme/mini-quiz.html?quiz=02-05-systemd)

**Objectifs** : comprendre ce qu'est une unité systemd, savoir démarrer/activer/diagnostiquer un service, et situer les services dans le processus de démarrage vu en 2.1.

![Relation entre unité systemd et processus](Ressources/images/processus-systemd.svg)

> [!TIP] Lecture du schéma
> `systemctl status` résume l'unité et son processus principal ; `journalctl -u` restitue la chronologie ; `systemctl show` expose les propriétés complètes. Les trois vues se complètent.

---

### D'un processus à un service

Un processus quelconque (2.4) vit le temps d'une commande. Un **service** (ou _daemon_) est un processus pensé pour durer : il tourne en continu en arrière-plan pour rendre une fonction disponible en permanence — écoute SSH, serveur web, résolution DNS, planification cron, ...

Sous Debian, c'est **systemd** qui a remplacé l'ancien système `init.d`/SysVinit : au lieu de scripts shell séquentiels, chaque service est décrit par une **unit** (unité), un fichier texte déclaratif, chargé depuis :

- `/lib/systemd/system/` : unités fournies par les paquets installés (ex : `bind9.service` arrivera avec `apt install bind9`)
- `/etc/systemd/system/` : unités locales ou personnalisées, prioritaires sur les précédentes

systemd ne gère pas que des `.service` :

| Extension  | Rôle                                                                                                |
| ---------- | --------------------------------------------------------------------------------------------------- |
| `.service` | Un service/démon (ex : `ssh.service`, `bind9.service`)                                              |
| `.socket`  | Un point d'écoute réseau/IPC, capable de démarrer un service à la demande (à la première connexion) |
| `.timer`   | Un déclenchement planifié, équivalent moderne de cron (voir 2.8)                                    |
| `.target`  | Un groupe/point de synchronisation de services, équivalent des anciens runlevels                    |

![Dépendances et activation systemd](Ressources/images/dependances-systemd.svg)

> [!TIP] Lecture du schéma
> Une dépendance répond à « quelles unités faut-il démarrer ? » ; une relation d'ordre répond à « dans quelle séquence ? ». `enable` reste indépendant de `start`.

Rappel de 2.1 : c'est justement l'étape "Activation des différents services" qui active tout ce que `multi-user.target` (ou `graphical.target` sur un poste de travail) requiert.

---

### Cycle de vie d'un service

![Cycle de vie d'un service systemd](Ressources/images/cycle-vie-systemd.svg)

> [!TIP] Lecture du schéma
> La moitié supérieure représente l'état actuel ; la moitié inférieure représente le prochain démarrage. Cette séparation évite la confusion classique entre `start` et `enable`.

| Action                             | Commande                              | Effet                                      |
| ---------------------------------- | ------------------------------------- | ------------------------------------------ |
| Démarrer                           | `sudo systemctl start ssh`            | Maintenant, jusqu'au prochain stop/reboot  |
| Arrêter                            | `sudo systemctl stop ssh`             | Maintenant                                 |
| Redémarrer                         | `sudo systemctl restart ssh`          | Coupure puis relance                       |
| Recharger la config sans coupure   | `sudo systemctl reload ssh`           | Si le service le supporte                  |
| Voir l'état                        | `systemctl status ssh`                | État courant + dernières lignes de journal |
| Activer au démarrage               | `sudo systemctl enable ssh`           | Au prochain boot                           |
| Désactiver au démarrage            | `sudo systemctl disable ssh`          | Au prochain boot                           |
| Activer + démarrer d'un coup       | `sudo systemctl enable --now ssh`     | Les deux en une commande                   |
| Vérifier l'activation au démarrage | `systemctl is-enabled ssh`            | —                                          |
| Lister tous les services actifs    | `systemctl list-units --type=service` | —                                          |
| Lister les services en échec       | `systemctl --failed`                  | —                                          |

> [!WARNING]
> `start`/`stop` (maintenant) et `enable`/`disable` (au prochain boot) sont **deux réglages indépendants**. Un service peut très bien être démarré sans être activé au boot (il faudra le relancer manuellement après un redémarrage), ou l'inverse (activé mais pas encore démarré).

---

### Diagnostiquer un service en échec

```bash
systemctl status ssh        # Etat courant + dernières lignes de journal
journalctl -u ssh           # Historique complet des journaux du service (detaillé au 2.6)
journalctl -u ssh -f        # Suivi en direct (Ctrl+C pour quitter)
systemctl --failed          # Tous les services actuellement en échec
```

Ce sont exactement les réflexes qu'on réutilisera aux chapitres 3 à 6 : après chaque `apt install` d'un service (bind9, apache2, postfix, ...), le premier réflexe est `systemctl status NOM_DU_SERVICE`, puis `journalctl -u NOM_DU_SERVICE` s'il refuse de démarrer.

> [!NOTE]
> **Structure simplifiée d'un fichier `.service`**
>
> ```ini
> [Unit]
> Description=Mon service personnalisé
> Wants=network-online.target
> After=network-online.target
>
> [Service]
> ExecStart=/usr/local/bin/mon-script.sh
> Restart=on-failure
>
> [Install]
> WantedBy=multi-user.target
> ```
>
> - `[Unit]` : description et dépendances — `Wants=` attire la cible dans la transaction et `After=` impose l'ordre. `network-online.target` signifie que le gestionnaire réseau considère la connectivité configurée ; ce n'est pas une garantie permanente d'accès à Internet.
> - `[Service]` : la commande à exécuter, et le comportement en cas de crash (`Restart=on-failure` relance automatiquement)
> - `[Install]` : dans quelle target le service doit être activé quand on fait `enable`

#### Paramètres importants de `[Unit]`

La section `[Unit]` décrit l'unité et ses relations avec les autres unités. Une **dépendance** (`Wants=`, `Requires=`) et un **ordre** (`After=`, `Before=`) sont deux notions différentes : demander le démarrage d'une unité ne précise pas automatiquement laquelle doit démarrer en premier.

| Directive                | Rôle                                                                               | Exemple et point d'attention                                                                                 |
| ------------------------ | ---------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `Description=`           | Texte court affiché par `systemctl status`                                         | `Description=Collecteur de métriques local`                                                                  |
| `Documentation=`         | Référence vers une page de manuel ou une URL                                       | `Documentation=man:mon-agent(8)`                                                                             |
| `Wants=`                 | Dépendance souple : systemd essaie aussi de démarrer l'unité indiquée              | `Wants=network-online.target` ; son échec ne fait pas forcément échouer notre unité                          |
| `Requires=`              | Dépendance forte : l'unité requise doit être activée avec celle-ci                 | `Requires=postgresql.service` ; ajouter souvent `After=` pour imposer l'ordre                                |
| `Requisite=`             | Exige que l'autre unité soit déjà active sans essayer de la démarrer               | Utile pour refuser immédiatement un démarrage hors contexte                                                  |
| `After=`                 | Place l'unité **après** une autre dans l'ordre de démarrage                        | `After=network-online.target` ; ne crée aucune dépendance à lui seul                                         |
| `Before=`                | Place l'unité **avant** une autre                                                  | `Before=multi-user.target`                                                                                   |
| `Conflicts=`             | Empêche deux unités d'être actives simultanément                                   | `Conflicts=ancien-agent.service`                                                                             |
| `BindsTo=`               | Lie fortement les cycles de vie : si l'autre unité disparaît, celle-ci est arrêtée | Plus fort que `Requires=` ; à employer seulement si les destins sont réellement liés                         |
| `PartOf=`                | Propage les opérations `stop` et `restart` depuis l'unité indiquée                 | `PartOf=application.target`                                                                                  |
| `ConditionPathExists=`   | Exécute l'unité seulement si un chemin existe                                      | `ConditionPathExists=/etc/mon-agent.conf` ; condition non satisfaite = unité ignorée, pas forcément en échec |
| `ConditionFileNotEmpty=` | Vérifie qu'un fichier existe et n'est pas vide                                     | `ConditionFileNotEmpty=/etc/mon-agent/token`                                                                 |
| `AssertPathExists=`      | Comme une condition, mais l'échec de l'assertion fait échouer le démarrage         | À réserver aux prérequis réellement obligatoires                                                             |
| `StartLimitIntervalSec=` | Fenêtre utilisée pour limiter les tentatives de démarrage                          | Exemple : `StartLimitIntervalSec=60s`                                                                        |
| `StartLimitBurst=`       | Nombre de démarrages autorisés dans cette fenêtre                                  | Exemple : `StartLimitBurst=5`                                                                                |

> [!TIP] Dépendance ≠ ordre
> `Requires=postgresql.service` demande PostgreSQL, mais ne garantit pas qu'il soit démarré avant l'application. Pour exprimer les deux intentions, utiliser `Requires=postgresql.service` **et** `After=postgresql.service`.

#### Paramètres importants de `[Service]`

| Directive              | Rôle                                                                       | Exemple et point d'attention                                                                                    |
| ---------------------- | -------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| `Type=`                | Indique à systemd comment déterminer que le démarrage est terminé          | `simple`, `exec`, `forking`, `oneshot`, `notify`, `dbus` ou `idle` ; voir le tableau suivant                    |
| `ExecStartPre=`        | Commande exécutée avant le programme principal                             | Peut être répétée ; une erreur arrête normalement le démarrage                                                  |
| `ExecCondition=`       | Test préalable dont certains codes peuvent ignorer proprement l'unité      | Pratique pour une condition nécessitant une commande plutôt qu'un simple chemin                                 |
| `ExecStart=`           | Commande principale du service                                             | Utiliser un chemin absolu ; plusieurs lignes ne sont permises que dans des cas précis, notamment `Type=oneshot` |
| `ExecStartPost=`       | Commande lancée après le démarrage réussi                                  | Convient à une vérification ou une initialisation complémentaire courte                                         |
| `ExecReload=`          | Commande utilisée par `systemctl reload`                                   | À définir seulement si le programme sait réellement relire sa configuration                                     |
| `ExecStop=`            | Arrêt propre explicite                                                     | Sans cette directive, systemd envoie les signaux prévus au processus selon `KillMode=`                          |
| `ExecStopPost=`        | Action exécutée après l'arrêt, y compris après certains échecs             | Utile pour nettoyer un état temporaire ou écrire une preuve                                                     |
| `Restart=`             | Politique de relance automatique                                           | `no`, `on-success`, `on-failure`, `on-abnormal`, `on-abort`, `on-watchdog` ou `always`                          |
| `RestartSec=`          | Délai avant une relance                                                    | `RestartSec=5s` évite une boucle instantanée                                                                    |
| `User=` / `Group=`     | Identité Unix du processus                                                 | Préférer un compte de service dédié plutôt que `root` lorsque c'est possible                                    |
| `SupplementaryGroups=` | Groupes supplémentaires accordés au processus                              | Exemple : `SupplementaryGroups=adm` pour un besoin de lecture contrôlé                                          |
| `WorkingDirectory=`    | Répertoire courant du processus                                            | `WorkingDirectory=/srv/mon-application`                                                                         |
| `Environment=`         | Définit une variable directement dans l'unité                              | `Environment="MODE=production"` ; ne pas y placer de secret                                                     |
| `EnvironmentFile=`     | Charge des variables depuis un fichier                                     | `EnvironmentFile=-/etc/default/mon-agent` ; le préfixe `-` rend le fichier facultatif                           |
| `RuntimeDirectory=`    | Crée un dossier sous `/run` avec les bons droits pendant la vie du service | `RuntimeDirectory=mon-agent` crée `/run/mon-agent`                                                              |
| `StateDirectory=`      | Crée un répertoire d'état persistant sous `/var/lib`                       | `StateDirectory=mon-agent` crée `/var/lib/mon-agent`                                                            |
| `TimeoutStartSec=`     | Temps maximal accordé au démarrage                                         | `TimeoutStartSec=30s`                                                                                           |
| `TimeoutStopSec=`      | Temps maximal accordé à l'arrêt propre                                     | Après expiration, systemd peut forcer l'arrêt                                                                   |
| `SuccessExitStatus=`   | Codes ou signaux considérés comme un succès en plus de `0`                 | Exemple : `SuccessExitStatus=0 2 SIGTERM`                                                                       |
| `RemainAfterExit=`     | Maintient l'unité `active` après la fin du processus                       | Souvent associé à `Type=oneshot` pour représenter une action appliquée                                          |
| `StandardOutput=`      | Destination de la sortie standard                                          | `journal`, `null`, `tty` ou une destination fichier prise en charge par la version de systemd                   |
| `StandardError=`       | Destination de la sortie d'erreur                                          | `journal` permet une lecture avec `journalctl -u`                                                               |
| `SyslogIdentifier=`    | Nom affiché dans le journal pour les messages du service                   | `SyslogIdentifier=mon-agent`                                                                                    |
| `KillSignal=`          | Signal envoyé lors de l'arrêt                                              | `SIGTERM` par défaut ; le programme doit avoir le temps de se fermer proprement                                 |
| `KillMode=`            | Définit quels processus du groupe de contrôle sont arrêtés                 | `control-group` est le comportement sûr habituel ; éviter de laisser des processus enfants orphelins            |

#### Choisir la bonne valeur de `Type=`

| Valeur    | Quand l'utiliser                                                                             | Quand systemd considère le service démarré                                                   |
| --------- | -------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| `simple`  | Programme long qui reste au premier plan                                                     | Dès que le processus est lancé ; une erreur très précoce peut être moins clairement détectée |
| `exec`    | Programme long classique, choix pertinent pour une unité personnalisée                       | Après la réussite de l'appel système qui exécute réellement le binaire                       |
| `forking` | Ancien démon qui se détache en créant un processus enfant                                    | Après la sortie du processus parent ; utiliser si possible `PIDFile=`                        |
| `oneshot` | Script ou commande courte qui effectue une action puis se termine                            | Lorsque toutes les commandes `ExecStart=` sont terminées avec succès                         |
| `notify`  | Programme compatible avec `sd_notify()`                                                      | Quand le programme envoie explicitement `READY=1`                                            |
| `dbus`    | Service considéré prêt après l'acquisition d'un nom D-Bus                                    | Quand le nom défini par `BusName=` est acquis                                                |
| `idle`    | Comme `simple`, mais l'exécution est brièvement retardée pour rendre la console plus lisible | Après le lancement ; ce type n'est pas un mécanisme d'ordre ou de dépendance                 |

> [!NOTE] Valeur conseillée en pratique
> Pour un démon moderne qui reste au premier plan, préférer `Type=exec` si la version de systemd le prend en charge. Pour un script ponctuel déclenché par un timer, utiliser généralement `Type=oneshot`.

#### Sécuriser un service personnalisé

| Directive                | Protection apportée                                                      | Exemple                                                                                 |
| ------------------------ | ------------------------------------------------------------------------ | --------------------------------------------------------------------------------------- |
| `NoNewPrivileges=yes`    | Interdit au processus et à ses enfants d'acquérir de nouveaux privilèges | Bon réglage par défaut pour beaucoup d'agents                                           |
| `PrivateTmp=yes`         | Donne au service ses propres espaces `/tmp` et `/var/tmp`                | Évite certains échanges involontaires avec les autres services                          |
| `ProtectSystem=`         | Rend tout ou partie du système de fichiers en lecture seule              | `ProtectSystem=strict` demande ensuite d'autoriser explicitement les chemins d'écriture |
| `ProtectHome=`           | Masque ou protège `/home`, `/root` et `/run/user`                        | `ProtectHome=read-only` ou `yes` selon le besoin                                        |
| `ReadWritePaths=`        | Réautorise précisément certains chemins en écriture                      | `ReadWritePaths=/var/lib/mon-agent`                                                     |
| `CapabilityBoundingSet=` | Limite les capacités Linux disponibles                                   | N'accorder que les capacités réellement nécessaires                                     |

Tester les protections disponibles pour une unité avec :

```bash
systemd-analyze security mon-service.service
```

#### Paramètres importants de `[Install]`

Cette section est surtout utilisée par `systemctl enable` et `disable`. Elle ne démarre pas le service immédiatement.

| Directive          | Effet lors de `systemctl enable`                                            | Exemple                                                           |
| ------------------ | --------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| `WantedBy=`        | Crée un lien dans le répertoire `.wants/` de la cible                       | `WantedBy=multi-user.target` pour un service système habituel     |
| `RequiredBy=`      | Crée une dépendance forte depuis la cible                                   | À utiliser seulement si l'échec du service doit affecter la cible |
| `Alias=`           | Crée un autre nom permettant de référencer l'unité                          | `Alias=collecteur.service`                                        |
| `Also=`            | Active ou désactive d'autres unités en même temps                           | Utile pour un couple d'unités administré ensemble                 |
| `DefaultInstance=` | Définit l'instance utilisée lors de l'activation d'un modèle `nom@.service` | Exemple : `DefaultInstance=principal`                             |

> [!WARNING] `[Install]` n'est pas lu comme `[Unit]`
> `WantedBy=` n'agit qu'au moment de `systemctl enable`. Après avoir ajouté ou modifié une unité : `systemctl daemon-reload`, puis `systemctl enable --now NOM.service` si elle doit être activée au démarrage **et** lancée immédiatement.

### Comprendre les états et les dépendances

Un service possède plusieurs dimensions indépendantes :

- `loaded` : le fichier d'unité a été lu ;
- `active`/`inactive`/`failed` : état d'exécution courant ;
- `enabled`/`disabled`/`static` : participation au prochain démarrage ;
- `masked` : tout démarrage est interdit par un lien vers `/dev/null`.

```bash
systemctl is-active ssh
systemctl is-enabled ssh
systemctl show ssh -p MainPID,ExecMainStatus,Restart,FragmentPath
systemctl list-dependencies ssh
systemctl cat ssh
```

> [!WARNING] Ne pas modifier `/usr/lib/systemd/system/`
> Une mise à jour de paquet peut écraser ces fichiers. Utiliser `sudo systemctl edit NOM.service` pour créer une surcharge dans `/etc/systemd/system/NOM.service.d/override.conf`, puis `sudo systemctl daemon-reload`.

### Procédure de changement et de diagnostic

```bash
sudo systemd-analyze verify /etc/systemd/system/mon-service.service
sudo systemctl daemon-reload
sudo systemctl restart mon-service
systemctl status mon-service --no-pager -l
sudo journalctl -u mon-service --since "5 minutes ago" --no-pager
systemctl show mon-service -p Result,ExecMainStatus
```

`reload` demande au programme de relire sa configuration sans couper le service, s'il sait le faire. `daemon-reload` demande à **systemd** de relire les fichiers d'unités. Ce sont deux actions différentes.

> [!NOTE]
> **À retenir**
>
> - Un service = une unité systemd persistante (`.service`), potentiellement liée à un `.socket` ou un `.timer`.
> - `enable`/`disable` ≠ `start`/`stop` : au boot vs maintenant.
> - Réflexe diagnostic : `systemctl status` puis `journalctl -u` puis `systemctl --failed`.
