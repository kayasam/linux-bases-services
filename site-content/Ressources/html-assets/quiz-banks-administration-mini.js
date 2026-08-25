;(function () {
  "use strict"

  const miniQuizBanks = {
    "02-01-demarrage": {
      id: "02-01-demarrage",
      chapter: "Sous-chapitre 2.1 · Démarrage",
      title: "Mini-quiz — Démarrage du système",
      intro: "Vérifiez votre compréhension de la chaîne de boot et des commandes de diagnostic.",
      chapterLink: "./01-demarrage",
      questions: [
        {
          theme: "Chaîne de boot",
          question: "Quel ordre décrit correctement un démarrage Linux classique ?",
          choices: [
            "systemd → noyau → GRUB → firmware",
            "firmware → chargeur d'amorçage → noyau/initramfs → systemd",
            "noyau → firmware → systemd → initramfs",
            "GRUB → systemd → firmware → noyau",
          ],
          answer: 1,
          explanation:
            "Le firmware initialise la machine, le chargeur lance le noyau et son initramfs, puis le noyau démarre systemd en espace utilisateur.",
        },
        {
          theme: "Noyau",
          question: "Quelle commande affiche les paramètres transmis au noyau pendant ce boot ?",
          choices: ["uname -r", "cat /proc/cmdline", "systemctl show", "lsmod"],
          answer: 1,
          explanation: "/proc/cmdline expose exactement la ligne de commande reçue par le noyau.",
        },
        {
          theme: "Mesure",
          question: "Que fournit principalement systemd-analyze blame ?",
          choices: [
            "La cause certaine de chaque lenteur",
            "Le temps d'initialisation des unités, à interpréter avec prudence",
            "Les erreurs du noyau uniquement",
            "La liste des paquets à supprimer",
          ],
          answer: 1,
          explanation:
            "blame classe les durées observées, mais une unité longue peut attendre une dépendance et ne pas être la cause racine.",
        },
        {
          theme: "Dépendances",
          question: "Quelle commande montre le chemin critique qui conditionne la durée du boot ?",
          choices: [
            "systemd-analyze critical-chain",
            "systemctl list-timers",
            "journalctl -f",
            "ps --forest",
          ],
          answer: 0,
          explanation:
            "critical-chain combine les durées et les relations d'ordre pour faire apparaître le chemin critique.",
        },
        {
          theme: "Journaux",
          question: "Comment consulter le journal du démarrage précédent ?",
          choices: ["journalctl -b", "journalctl -b -1", "journalctl -r -1", "dmesg -1"],
          answer: 1,
          explanation:
            "-b -1 sélectionne le boot immédiatement antérieur ; -b seul vise le boot courant.",
        },
        {
          theme: "Échecs",
          question: "Quelle commande liste directement les unités systemd actuellement en échec ?",
          choices: [
            "systemctl --failed",
            "systemctl status all",
            "journalctl --failed",
            "ps -failed",
          ],
          answer: 0,
          explanation:
            "systemctl --failed constitue un point d'entrée rapide après un démarrage incomplet.",
        },
        {
          theme: "Initramfs",
          question: "Quel est le rôle principal de l'initramfs ?",
          choices: [
            "Afficher le menu GRUB",
            "Fournir un environnement initial permettant notamment d'accéder au vrai système racine",
            "Remplacer définitivement le système de fichiers racine",
            "Démarrer les applications graphiques",
          ],
          answer: 1,
          explanation:
            "L'initramfs apporte très tôt pilotes et outils nécessaires pour trouver et monter le système racine réel.",
        },
        {
          theme: "Chargeur",
          question:
            "Quelle couche sélectionne généralement le noyau et lui transmet ses paramètres ?",
          choices: ["GRUB", "journald", "udev", "cron"],
          answer: 0,
          explanation:
            "GRUB est le chargeur d'amorçage courant sur Debian et choisit l'entrée noyau/initramfs.",
        },
        {
          theme: "Targets",
          question:
            "Quelle cible correspond habituellement à un système multi-utilisateur non graphique ?",
          choices: ["rescue.target", "multi-user.target", "poweroff.target", "timers.target"],
          answer: 1,
          explanation:
            "multi-user.target regroupe les services attendus pour un serveur multi-utilisateur classique.",
        },
        {
          theme: "Méthode",
          question:
            "Face à un boot en échec, quelle démarche produit le diagnostic le plus fiable ?",
          choices: [
            "Régénérer GRUB et l'initramfs immédiatement",
            "Modifier plusieurs couches puis redémarrer",
            "Localiser l'étape fautive, relever une preuve, corriger une cause puis retester",
            "Supprimer les unités les plus lentes",
          ],
          answer: 2,
          explanation:
            "Une modification à la fois conserve le lien entre symptôme, preuve, correction et rétablissement.",
        },
      ],
    },

    "02-02-materiel": {
      id: "02-02-materiel",
      chapter: "Sous-chapitre 2.2 · Matériel",
      title: "Mini-quiz — Informations matérielles",
      intro: "Associez chaque commande à la couche matérielle ou système réellement observée.",
      chapterLink: "./02-materiel",
      questions: [
        {
          theme: "Processeur",
          question: "Quelle commande décrit l'architecture et les caractéristiques du processeur ?",
          choices: ["lscpu", "lsusb", "lsblk", "lsmem"],
          answer: 0,
          explanation: "lscpu synthétise architecture, cœurs, threads, caches et informations CPU.",
        },
        {
          theme: "Bus PCI",
          question:
            "Quelle commande inventorie notamment les contrôleurs réseau, graphiques et de stockage PCI ?",
          choices: ["lspci", "lsusb", "lstopo", "free -h"],
          answer: 0,
          explanation: "lspci interroge les périphériques attachés au bus PCI et PCI Express.",
        },
        {
          theme: "Pilotes",
          question:
            "Quelle option permet d'afficher avec lspci le pilote noyau utilisé et les modules candidats ?",
          choices: ["-br", "-nnk", "-xh", "--driver-only"],
          answer: 1,
          explanation:
            "lspci -nnk ajoute les identifiants numériques et les informations de pilote noyau.",
        },
        {
          theme: "USB",
          question: "Quelle commande montre l'arbre USB et les pilotes associés ?",
          choices: ["lsusb -t", "lspci -t", "lsblk -t", "ip -br link"],
          answer: 0,
          explanation:
            "lsusb -t présente la topologie USB, la vitesse et le driver de chaque branche.",
        },
        {
          theme: "Réseau",
          question:
            "Quelle commande relie une interface comme enp0s8 à son pilote et à son firmware ?",
          choices: ["ethtool -i enp0s8", "ip route enp0s8", "lscpu -i", "lsmem enp0s8"],
          answer: 0,
          explanation:
            "ethtool -i affiche driver, version et firmware de l'interface réseau ciblée.",
        },
        {
          theme: "Distribution",
          question:
            "Quel fichier fournit les informations standardisées sur la distribution installée ?",
          choices: ["/proc/cpuinfo", "/etc/os-release", "/etc/fstab", "/var/log/syslog"],
          answer: 1,
          explanation: "/etc/os-release expose notamment NAME, VERSION et ID de la distribution.",
        },
        {
          theme: "Stockage",
          question:
            "Quelle commande permet de voir modèle, numéro de série, taille et type des disques ?",
          choices: [
            "lsblk -o NAME,MODEL,SERIAL,SIZE,TYPE",
            "df -h /dev",
            "du -sh /dev",
            "lspci --filesystem",
          ],
          answer: 0,
          explanation:
            "lsblk interroge les périphériques bloc ; les colonnes choisies rendent l'inventaire explicite.",
        },
        {
          theme: "Inventaire",
          question: "Quel outil produit un inventaire matériel détaillé en arborescence ?",
          choices: ["lshw", "journalctl", "renice", "crontab"],
          answer: 0,
          explanation:
            "lshw agrège de nombreuses sources système ; les droits root donnent un résultat plus complet.",
        },
        {
          theme: "Topologie",
          question:
            "Quel outil est particulièrement utile pour visualiser la topologie CPU, caches et NUMA ?",
          choices: ["lstopo", "lsb_release", "lsusb", "hostnamectl"],
          answer: 0,
          explanation:
            "lstopo, fourni par hwloc, représente la proximité entre CPU, caches et nœuds mémoire.",
        },
        {
          theme: "Méthode",
          question: "Pourquoi croiser lspci -nnk, lshw -class network et ip -br link ?",
          choices: [
            "Pour mesurer trois fois la même information",
            "Pour relier matériel détecté, pilote chargé et interface créée",
            "Pour modifier automatiquement le pilote",
            "Pour tester le DNS",
          ],
          answer: 1,
          explanation:
            "Ces commandes observent trois étages différents : périphérique, association au pilote et objet réseau utilisable.",
        },
      ],
    },

    "02-03-modules": {
      id: "02-03-modules",
      chapter: "Sous-chapitre 2.3 · Noyau",
      title: "Mini-quiz — Modules noyau et pilotes",
      intro: "Révisez le chargement, les dépendances, les paramètres et le diagnostic des modules.",
      chapterLink: "./03-modules-noyau",
      questions: [
        {
          theme: "Concept",
          question: "Qu'est-ce qu'un module noyau Linux ?",
          choices: [
            "Un paquet utilisateur sans lien avec le noyau",
            "Du code chargeable dans le noyau, souvent pour un pilote ou une fonctionnalité",
            "Une unité systemd obligatoire",
            "Un fichier de configuration de GRUB",
          ],
          answer: 1,
          explanation:
            "Un module étend le noyau en cours d'exécution sans reconstruire tout le noyau.",
        },
        {
          theme: "Inventaire",
          question: "Quelle commande liste les modules actuellement chargés ?",
          choices: ["lsmod", "modinfo", "lspci", "depmod -n"],
          answer: 0,
          explanation:
            "lsmod présente les modules en mémoire, leur taille et leur compteur d'utilisation.",
        },
        {
          theme: "Informations",
          question:
            "Quelle commande affiche le fichier, la licence, les dépendances et paramètres d'un module ?",
          choices: ["modinfo NOM", "lsmod NOM", "rmmod -i NOM", "systemctl cat NOM"],
          answer: 0,
          explanation: "modinfo lit les métadonnées du module disponible pour le noyau.",
        },
        {
          theme: "Chargement",
          question: "Pourquoi préférer modprobe à insmod pour un usage courant ?",
          choices: [
            "modprobe résout les dépendances et connaît l'arborescence du noyau",
            "modprobe ne nécessite jamais les droits root",
            "insmod ne charge que des services systemd",
            "modprobe compile le noyau",
          ],
          answer: 0,
          explanation:
            "modprobe s'appuie sur les métadonnées de dépendances, contrairement au chargement brut d'un fichier.",
        },
        {
          theme: "Déchargement",
          question: "Quelle commande décharge un module en tenant compte de ses dépendances ?",
          choices: ["modprobe -r NOM", "modinfo -r NOM", "lsmod -r NOM", "systemctl stop NOM.ko"],
          answer: 0,
          explanation:
            "modprobe -r traite le module et les dépendances devenues inutiles ; rmmod est plus direct.",
        },
        {
          theme: "Paramètres",
          question: "Que fait sudo modprobe bonding miimon=100 ?",
          choices: [
            "Charge bonding avec le paramètre miimon fixé à 100 pour cette activation",
            "Rend ce paramètre automatiquement persistant",
            "Supprime le module bonding",
            "Crée une unité systemd",
          ],
          answer: 0,
          explanation:
            "Le paramètre passé en ligne de commande agit au chargement courant ; la persistance se configure séparément.",
        },
        {
          theme: "Persistance",
          question: "Où déclarer un module qui doit être chargé automatiquement au démarrage ?",
          choices: ["/etc/modules-load.d/*.conf", "/etc/fstab", "/var/log/modules", "/etc/cron.d"],
          answer: 0,
          explanation:
            "Les fichiers de modules-load.d contiennent les noms des modules à charger au boot.",
        },
        {
          theme: "Blocage",
          question:
            "Où placer une règle blacklist pour empêcher le chargement normal d'un pilote indésirable ?",
          choices: [
            "/etc/modprobe.d/*.conf",
            "/etc/modules-load.d/*.conf",
            "/proc/modules",
            "/boot/grub.cfg",
          ],
          answer: 0,
          explanation:
            "modprobe.d porte les options, alias et règles blacklist appliquées par modprobe.",
        },
        {
          theme: "Version",
          question: "Pourquoi chercher un module sous /lib/modules/$(uname -r) ?",
          choices: [
            "Les modules sont organisés par version du noyau en cours",
            "uname -r renvoie le nom du module",
            "Tous les modules sont identiques entre noyaux",
            "Ce chemin contient les journaux noyau",
          ],
          answer: 0,
          explanation:
            "Un module doit correspondre à l'ABI du noyau ; uname -r désigne précisément le noyau actif.",
        },
        {
          theme: "Diagnostic",
          question:
            "Quelle commande montre les messages noyau récents liés au chargement d'un pilote ?",
          choices: [
            "journalctl -k --since '5 min ago'",
            "journalctl -u cron",
            "crontab -l",
            "systemd-analyze blame",
          ],
          answer: 0,
          explanation:
            "-k filtre le journal sur les messages du noyau, là où apparaissent les erreurs de pilote.",
        },
      ],
    },

    "02-04-processus": {
      id: "02-04-processus",
      chapter: "Sous-chapitre 2.4 · Processus",
      title: "Mini-quiz — Gestion des processus",
      intro: "Testez vos réflexes sur les PID, états, signaux, priorités et jobs du shell.",
      chapterLink: "./04-processus",
      questions: [
        {
          theme: "Concept",
          question: "Quelle différence décrit correctement un exécutable et un processus ?",
          choices: [
            "Un exécutable est un fichier ; un processus est une instance en cours d'exécution",
            "Un processus est toujours stocké dans /usr/bin",
            "Un exécutable possède toujours un PID",
            "Il n'existe aucune différence",
          ],
          answer: 0,
          explanation:
            "Le programme est stocké sur disque ; chaque exécution crée un processus avec un contexte et un PID.",
        },
        {
          theme: "Arbre",
          question: "Que représente le PPID d'un processus ?",
          choices: [
            "Son port réseau",
            "Le PID de son processus parent",
            "Sa priorité",
            "Son utilisateur réel",
          ],
          answer: 1,
          explanation:
            "Le PPID relie le processus à son parent et permet de reconstruire l'arbre des processus.",
        },
        {
          theme: "Observation",
          question:
            "Quelle commande produit une vue détaillée triée par consommation CPU décroissante ?",
          choices: [
            "ps -eo user,pid,ppid,stat,%cpu,%mem,etime,cmd --sort=-%cpu",
            "jobs --sort=cpu",
            "kill -l",
            "free -h --process",
          ],
          answer: 0,
          explanation:
            "ps permet de choisir les colonnes et --sort=-%cpu place les plus consommateurs en tête.",
        },
        {
          theme: "Signaux",
          question: "Quel signal faut-il essayer avant SIGKILL pour demander un arrêt propre ?",
          choices: ["SIGTERM", "SIGSTOP", "SIGCONT", "SIGCHLD"],
          answer: 0,
          explanation:
            "SIGTERM peut être intercepté pour nettoyer les ressources ; SIGKILL coupe sans laisser cette possibilité.",
        },
        {
          theme: "Services",
          question: "Pour arrêter un processus géré par systemd, quelle action est préférable ?",
          choices: [
            "kill -9 PID immédiatement",
            "systemctl stop NOM.service",
            "Supprimer son exécutable",
            "renice -20 PID",
          ],
          answer: 1,
          explanation:
            "systemctl applique la politique d'arrêt de l'unité et maîtrise aussi ses processus enfants.",
        },
        {
          theme: "États",
          question: "Que signifie généralement l'état Z dans la colonne STAT ?",
          choices: [
            "Processus zombie terminé dont le parent n'a pas encore récupéré le statut",
            "Processus utilisant 100 % du CPU",
            "Processus suspendu par SIGSTOP",
            "Processus sans parent",
          ],
          answer: 0,
          explanation:
            "Un zombie ne s'exécute plus ; il conserve une entrée minimale jusqu'à la prise en compte par son parent.",
        },
        {
          theme: "Priorité",
          question: "Quel est l'effet de nice -n 10 commande ?",
          choices: [
            "La commande reçoit une priorité CPU plus faible",
            "La commande reçoit automatiquement une priorité temps réel",
            "La commande est limitée à 10 secondes",
            "La commande est exécutée dix fois",
          ],
          answer: 0,
          explanation:
            "Une valeur nice plus élevée rend le processus plus conciliant et donc moins prioritaire.",
        },
        {
          theme: "Priorité",
          question: "Quelle commande change la valeur nice d'un processus déjà lancé ?",
          choices: ["renice -n 5 -p PID", "nice -p PID", "kill -NICE PID", "ps --nice PID"],
          answer: 0,
          explanation:
            "renice agit sur un PID existant, alors que nice accompagne le lancement d'une nouvelle commande.",
        },
        {
          theme: "Jobs",
          question: "Que liste la commande jobs ?",
          choices: [
            "Tous les processus de la machine",
            "Les travaux associés au shell courant",
            "Toutes les unités systemd",
            "Les tâches cron de tous les utilisateurs",
          ],
          answer: 1,
          explanation: "Les numéros %1, %2 sont locaux à la table de jobs du shell courant.",
        },
        {
          theme: "Premier plan",
          question: "Quelle commande replace le job numéro 1 au premier plan ?",
          choices: ["fg %1", "bg %1", "jobs %1", "ps %1"],
          answer: 0,
          explanation:
            "fg rattache le job au terminal au premier plan ; bg reprend un job suspendu en arrière-plan.",
        },
      ],
    },

    "02-05-systemd": {
      id: "02-05-systemd",
      chapter: "Sous-chapitre 2.5 · systemd",
      title: "Mini-quiz — Services systemd",
      intro: "Validez les notions d'état, d'activation, de dépendance et de fichier d'unité.",
      chapterLink: "./05-systemd",
      questions: [
        {
          theme: "Cycle de vie",
          question: "Quelle différence existe entre systemctl start et systemctl enable ?",
          choices: [
            "start agit maintenant ; enable prépare le démarrage automatique futur",
            "enable démarre toujours immédiatement le service",
            "start modifie uniquement les liens de boot",
            "Les deux commandes sont synonymes",
          ],
          answer: 0,
          explanation: "L'état courant et l'activation au boot sont deux dimensions indépendantes.",
        },
        {
          theme: "Rechargement",
          question:
            "Après modification d'un fichier .service, quelle commande fait relire les unités à systemd ?",
          choices: [
            "systemctl daemon-reload",
            "systemctl reload ssh",
            "journalctl --reload",
            "systemctl enable",
          ],
          answer: 0,
          explanation:
            "daemon-reload recharge la configuration du gestionnaire systemd ; reload vise le programme d'un service.",
        },
        {
          theme: "Diagnostic",
          question: "Quel enchaînement constitue un bon premier diagnostic de service ?",
          choices: [
            "status puis journalctl -u",
            "enable puis disable",
            "kill -9 puis reboot",
            "rm du fichier d'unité puis daemon-reload",
          ],
          answer: 0,
          explanation:
            "status donne l'état synthétique ; journalctl -u restitue la chronologie détaillée.",
        },
        {
          theme: "Dépendances",
          question: "Quelle différence essentielle sépare Wants= et Requires= ?",
          choices: [
            "Wants est souple, Requires exprime une dépendance forte",
            "Wants impose l'ordre, Requires ne fait qu'afficher un texte",
            "Requires ne peut cibler qu'un timer",
            "Aucune, les deux sont des alias",
          ],
          answer: 0,
          explanation:
            "Wants tente d'ajouter l'unité sans lier fortement le succès ; Requires exprime un besoin plus strict.",
        },
        {
          theme: "Ordre",
          question: "Que garantit After=postgresql.service à lui seul ?",
          choices: [
            "Un ordre si les deux unités sont démarrées, mais pas le démarrage de PostgreSQL",
            "Le démarrage obligatoire de PostgreSQL",
            "La relance automatique des deux services",
            "L'activation au boot",
          ],
          answer: 0,
          explanation:
            "After= exprime uniquement l'ordre ; il faut Wants= ou Requires= pour créer une dépendance.",
        },
        {
          theme: "Type",
          question:
            "Quel Type= convient généralement à une commande courte déclenchée par un timer ?",
          choices: ["oneshot", "forking", "dbus", "idle uniquement"],
          answer: 0,
          explanation:
            "Type=oneshot attend la fin de la commande et conserve un résultat exploitable par systemd.",
        },
        {
          theme: "Exécution",
          question: "Quelle directive porte la commande principale d'un service ?",
          choices: ["ExecStart=", "Command=", "Run=", "Process="],
          answer: 0,
          explanation:
            "ExecStart= définit le programme principal ; un chemin explicite facilite le diagnostic.",
        },
        {
          theme: "Résilience",
          question: "Que demande Restart=on-failure ?",
          choices: [
            "Relancer après un échec, mais pas après un arrêt propre normal",
            "Relancer uniquement après systemctl stop",
            "Ne jamais relancer",
            "Redémarrer toute la machine",
          ],
          answer: 0,
          explanation:
            "on-failure couvre les sorties non nulles, signaux anormaux et délais selon le contexte.",
        },
        {
          theme: "Activation",
          question: "Quel rôle joue WantedBy=multi-user.target dans [Install] ?",
          choices: [
            "Il indique où systemctl enable crée le lien d'activation",
            "Il démarre immédiatement le service à la lecture du fichier",
            "Il remplace ExecStart=",
            "Il filtre les journaux",
          ],
          answer: 0,
          explanation:
            "[Install] est interprété par enable/disable ; --now est nécessaire pour agir aussi immédiatement.",
        },
        {
          theme: "Validation",
          question:
            "Quelle commande vérifie la syntaxe et certaines relations d'une unité locale avant son démarrage ?",
          choices: [
            "systemd-analyze verify /etc/systemd/system/mon.service",
            "journalctl --verify-unit mon.service",
            "systemctl syntax mon.service",
            "ps --verify mon.service",
          ],
          answer: 0,
          explanation:
            "systemd-analyze verify détecte de nombreuses erreurs avant de perturber le service en production.",
        },
      ],
    },

    "02-06-journalisation": {
      id: "02-06-journalisation",
      chapter: "Sous-chapitre 2.6 · Journaux",
      title: "Mini-quiz — Journalisation et logs",
      intro:
        "Contrôlez votre maîtrise des boots, priorités, facilities, stockage et champs structurés.",
      chapterLink: "./06-journalisation",
      questions: [
        {
          theme: "Boot",
          question: "Quelle commande limite journalctl au démarrage courant ?",
          choices: ["journalctl -b", "journalctl -f", "journalctl -r", "journalctl -k -1"],
          answer: 0,
          explanation: "-b sélectionne le boot courant ; -b -1 sélectionne le précédent.",
        },
        {
          theme: "Unité",
          question: "Comment afficher uniquement les événements liés au service ssh ?",
          choices: [
            "journalctl -u ssh",
            "journalctl -p ssh",
            "journalctl --facility ssh",
            "dmesg ssh",
          ],
          answer: 0,
          explanation: "-u filtre sur une unité systemd et peut être répété pour plusieurs unités.",
        },
        {
          theme: "Priorité",
          question: "Que sélectionne journalctl -p err ?",
          choices: [
            "err et les niveaux plus graves",
            "Uniquement les messages dont le texte contient err",
            "Tous les avertissements moins graves",
            "Seulement stderr des shells",
          ],
          answer: 0,
          explanation:
            "Le filtre de priorité inclut err, crit, alert et emerg lorsque seule la borne err est donnée.",
        },
        {
          theme: "Facility",
          question: "Quel filtre vise les messages d'authentification issus de la facility auth ?",
          choices: [
            "journalctl --facility auth",
            "journalctl -u auth.service",
            "journalctl -p auth",
            "journalctl _PID=auth",
          ],
          answer: 0,
          explanation: "--facility filtre SYSLOG_FACILITY ; ce n'est ni une unité ni une priorité.",
        },
        {
          theme: "Configuration",
          question: "Où placer de préférence une surcharge locale persistante de journald ?",
          choices: [
            "/etc/systemd/journald.conf.d/60-local.conf",
            "/usr/lib/systemd/journald.conf.d/60-local.conf",
            "/run/log/journal/config",
            "/var/log/journal.conf",
          ],
          answer: 0,
          explanation:
            "/etc porte les choix de l'administrateur et résiste aux mises à jour de paquets.",
        },
        {
          theme: "Stockage",
          question: "Quel emplacement contient le journal volatil perdu au redémarrage ?",
          choices: ["/run/log/journal", "/var/log/journal", "/etc/log/journal", "/usr/lib/journal"],
          answer: 0,
          explanation:
            "/run est temporaire ; /var/log/journal permet une conservation entre les boots.",
        },
        {
          theme: "Persistance",
          question: "Quelle valeur de Storage= demande explicitement un journal persistant ?",
          choices: ["persistent", "volatile", "none", "runtime"],
          answer: 0,
          explanation:
            "Storage=persistent écrit sous /var/log/journal et crée le stockage si nécessaire.",
        },
        {
          theme: "Occupation",
          question: "Quelle commande mesure l'espace actuellement utilisé par le journal ?",
          choices: [
            "journalctl --disk-usage",
            "df --journal",
            "du --journald",
            "systemctl show disk",
          ],
          answer: 0,
          explanation:
            "--disk-usage additionne la place occupée par les fichiers journal actifs et archivés.",
        },
        {
          theme: "Champs",
          question: "Quel filtre utilise un champ structuré pour cibler le PID 1234 ?",
          choices: [
            "journalctl _PID=1234",
            "journalctl -p 1234",
            "journalctl --facility 1234",
            "dmesg _PID=1234",
          ],
          answer: 0,
          explanation:
            "Les champs comme _PID, _COMM et _SYSTEMD_UNIT permettent des recherches structurées précises.",
        },
        {
          theme: "Formats",
          question: "Quelle différence sépare le journal et les fichiers /var/log/*.log ?",
          choices: [
            "Le journal est structuré et binaire ; les fichiers .log sont souvent du texte produit notamment par rsyslog ou l'application",
            "Les deux sont toujours le même fichier",
            "journalctl ne lit que les fichiers texte",
            "/var/log ne peut jamais contenir de journaux système",
          ],
          answer: 0,
          explanation:
            "journald conserve des champs indexés ; rsyslog peut parallèlement produire des fichiers texte classiques.",
        },
      ],
    },

    "02-07-performances": {
      id: "02-07-performances",
      chapter: "Sous-chapitre 2.7 · Performances",
      title: "Mini-quiz — Observation des performances",
      intro: "Identifiez la bonne preuve pour le CPU, la mémoire, le stockage et les processus.",
      chapterLink: "./07-performances",
      questions: [
        {
          theme: "Charge",
          question:
            "Quelles périodes représentent les trois valeurs de load average affichées par uptime ?",
          choices: [
            "1, 5 et 15 minutes",
            "1, 10 et 60 secondes",
            "5, 15 et 60 minutes",
            "CPU, RAM et disque",
          ],
          answer: 0,
          explanation:
            "Le load average présente des moyennes sur 1, 5 et 15 minutes, à rapporter notamment au nombre de CPU.",
        },
        {
          theme: "Mémoire",
          question:
            "Dans free -h, quelle valeur aide le mieux à estimer la mémoire encore mobilisable ?",
          choices: ["available", "used uniquement", "total uniquement", "swap total"],
          answer: 0,
          explanation:
            "available tient compte de la mémoire récupérable, notamment certains caches.",
        },
        {
          theme: "Temps réel",
          question:
            "Quel outil standard affiche dynamiquement les processus et leur consommation CPU/mémoire ?",
          choices: ["top", "df", "lsblk", "atq"],
          answer: 0,
          explanation: "top met à jour périodiquement une vue système et une liste de processus.",
        },
        {
          theme: "Capacité",
          question: "Quelle commande mesure l'espace libre des systèmes de fichiers montés ?",
          choices: ["df -h", "du -sh /", "iostat -x", "free -h"],
          answer: 0,
          explanation:
            "df interroge la capacité du système de fichiers ; du additionne les fichiers visibles d'un chemin.",
        },
        {
          theme: "Inodes",
          question:
            "Quelle commande révèle un épuisement des inodes malgré des gigaoctets encore libres ?",
          choices: ["df -i", "df -hT", "free -i", "lsblk -i"],
          answer: 0,
          explanation:
            "df -i affiche le nombre d'inodes utilisés et disponibles par système de fichiers.",
        },
        {
          theme: "Échantillonnage",
          question: "Que demande vmstat 2 5 ?",
          choices: [
            "Cinq mesures espacées de deux secondes",
            "Deux mesures espacées de cinq minutes",
            "La liste des cinq plus gros fichiers",
            "Un suivi de deux processus",
          ],
          answer: 0,
          explanation:
            "Le premier nombre est l'intervalle en secondes et le second le nombre de rapports.",
        },
        {
          theme: "Entrées-sorties",
          question: "Quel outil détaille l'activité et la saturation des périphériques disque ?",
          choices: ["iostat -x 2", "uptime", "lscpu", "journalctl -b"],
          answer: 0,
          explanation:
            "iostat -x ajoute les statistiques étendues par périphérique et les répète à l'intervalle choisi.",
        },
        {
          theme: "Processus",
          question: "Quelle commande classe les processus selon leur mémoire résidente ?",
          choices: [
            "ps -eo pid,comm,%mem,rss --sort=-rss",
            "df -h --sort=rss",
            "free -p",
            "lsmem --process",
          ],
          answer: 0,
          explanation:
            "RSS représente les pages actuellement résidentes en RAM et --sort=-rss classe par ordre décroissant.",
        },
        {
          theme: "OOM",
          question: "Où rechercher la preuve qu'un processus a été tué par l'OOM killer ?",
          choices: [
            "journalctl -k avec un filtre OOM",
            "crontab -l",
            "systemctl list-timers",
            "named-checkconf",
          ],
          answer: 0,
          explanation:
            "La décision de l'OOM killer est un événement noyau et apparaît dans le journal kernel.",
        },
        {
          theme: "Méthode",
          question:
            "Avant de provoquer une charge pour comparer les mesures, que faut-il relever ?",
          choices: [
            "Un état de référence au repos",
            "Uniquement le nom de la machine",
            "Le mot de passe root",
            "Une capture après la charge seulement",
          ],
          answer: 0,
          explanation:
            "Sans baseline, il est difficile d'attribuer une variation à l'expérience et de prouver le retour à la normale.",
        },
      ],
    },

    "02-08-planification": {
      id: "02-08-planification",
      chapter: "Sous-chapitre 2.8 · Planification",
      title: "Mini-quiz — Tâches planifiées",
      intro: "Choisissez entre cron, at et timers systemd et vérifiez les paramètres essentiels.",
      chapterLink: "./08-taches-planifiees",
      questions: [
        {
          theme: "Cron",
          question: "Quel est l'ordre des cinq champs temporels d'une crontab utilisateur ?",
          choices: [
            "minute, heure, jour du mois, mois, jour de semaine",
            "seconde, minute, heure, jour, mois",
            "heure, minute, mois, jour, année",
            "jour, mois, année, heure, minute",
          ],
          answer: 0,
          explanation:
            "Cron commence par la minute puis l'heure, le jour du mois, le mois et le jour de semaine.",
        },
        {
          theme: "Cron système",
          question: "Quelle différence existe dans /etc/cron.d/* par rapport à crontab -e ?",
          choices: [
            "Un champ utilisateur supplémentaire précède la commande",
            "Il faut ajouter un champ année",
            "Les minutes ne sont pas acceptées",
            "Les commandes ne peuvent pas contenir de chemin absolu",
          ],
          answer: 0,
          explanation:
            "Les crontabs système précisent explicitement sous quel utilisateur exécuter la commande.",
        },
        {
          theme: "Environnement",
          question: "Pourquoi utiliser des chemins absolus dans une tâche cron ?",
          choices: [
            "Cron dispose souvent d'un environnement et d'un PATH plus limités que le shell interactif",
            "Cron interdit les noms de commandes",
            "Les chemins absolus rendent la tâche root",
            "Cron ne connaît pas le système de fichiers",
          ],
          answer: 0,
          explanation:
            "Une commande trouvée dans votre terminal peut être introuvable dans l'environnement minimal de cron.",
        },
        {
          theme: "At",
          question: "Quel mécanisme convient à une exécution unique dans dix minutes ?",
          choices: ["at", "cron quotidien", "un timer permanent obligatoire", "logrotate"],
          answer: 0,
          explanation:
            "at place un travail ponctuel dans une file pour une date ou un délai donné.",
        },
        {
          theme: "File at",
          question: "Quelles commandes listent puis suppriment un travail at en attente ?",
          choices: [
            "atq puis atrm NUMERO",
            "jobs puis kill %1",
            "crontab -l puis crontab -r",
            "at --list puis rm",
          ],
          answer: 0,
          explanation: "atq fournit le numéro du travail ; atrm supprime précisément ce numéro.",
        },
        {
          theme: "Timers",
          question: "Par défaut, quelle unité est déclenchée par sauvegarde.timer ?",
          choices: ["sauvegarde.service", "timers.target", "cron.service", "sauvegarde.socket"],
          answer: 0,
          explanation:
            "Un timer cible automatiquement le service de même nom, sauf directive Unit= différente.",
        },
        {
          theme: "Calendrier",
          question: "Quelle directive planifie une exécution tous les jours à 02:00 ?",
          choices: ["OnCalendar=*-*-* 02:00:00", "OnBootSec=02:00", "At=02:00", "Cron=0 2"],
          answer: 0,
          explanation:
            "OnCalendar utilise les expressions calendaires systemd, vérifiables avec systemd-analyze calendar.",
        },
        {
          theme: "Rattrapage",
          question: "Quel est l'effet de Persistent=true avec OnCalendar= ?",
          choices: [
            "Rattraper au prochain démarrage une échéance manquée pendant l'arrêt",
            "Garder le processus en mémoire en permanence",
            "Écrire obligatoirement dans /var/log",
            "Relancer le service après chaque échec",
          ],
          answer: 0,
          explanation:
            "systemd mémorise la dernière échéance et peut déclencher au retour si elle a été manquée.",
        },
        {
          theme: "Parc",
          question: "Pourquoi définir RandomizedDelaySec=15m sur plusieurs serveurs ?",
          choices: [
            "Pour répartir les démarrages dans une fenêtre et éviter un pic simultané",
            "Pour garantir une exécution à la seconde exacte",
            "Pour désactiver le timer pendant quinze minutes",
            "Pour remplacer Persistent=true",
          ],
          answer: 0,
          explanation:
            "Le délai aléatoire étale la charge réseau, disque ou sauvegarde sur le parc.",
        },
        {
          theme: "Activation",
          question:
            "Quelle unité faut-il activer pour une tâche qui doit être lancée uniquement selon son calendrier ?",
          choices: [
            "Le .timer avec systemctl enable --now",
            "Le .service uniquement avec enable --now",
            "timers.target avec restart",
            "cron.service et le .service simultanément",
          ],
          answer: 0,
          explanation:
            "Le timer porte la planification ; le service reste testable manuellement sans être activé séparément au boot.",
        },
      ],
    },
  }

  window.linuxQuizBanks = Object.assign(window.linuxQuizBanks || {}, miniQuizBanks)
})()
