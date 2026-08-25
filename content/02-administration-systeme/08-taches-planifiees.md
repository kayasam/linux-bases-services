# 2.8 Tâches planifiées

**Objectifs** : choisir entre cron (récurrent), at (une seule fois) et les timers systemd, et savoir écrire une expression cron sans erreur.

> [!NOTE] Compétence TSSR
> Une tâche planifiée n'est terminée que si son exécution, son code retour et ses journaux sont vérifiables. Tester le script manuellement avec le même utilisateur avant de planifier.

![Choisir un mécanisme de planification](Ressources/images/choix-planification.svg)

> [!TIP] Lecture du schéma
> `at` répond au besoin ponctuel ; `cron` à la récurrence simple ; un timer systemd apporte journal, dépendances, code retour et rattrapage des échéances.

---

### cron

`cron` exécute des commandes à intervalles réguliers, définis dans une **crontab**.

```bash
crontab -e     # Éditer sa propre crontab (utilisateur courant)
crontab -l     # Lister sa crontab
crontab -r     # Supprimer sa crontab
```

**Syntaxe d'une ligne de crontab**

```text
*  *  *  *  *  commande_a_executer
│  │  │  │  │
│  │  │  │  └── jour de la semaine (0-7, 0 et 7 = dimanche)
│  │  │  └───── mois (1-12)
│  │  └──────── jour du mois (1-31)
│  └─────────── heure (0-23)
└────────────── minute (0-59)
```

Exemples :

```bash
0 2 * * *       /usr/local/bin/sauvegarde.sh     # Tous les jours a 2h00
*/15 * * * *    /usr/local/bin/verif.sh          # Toutes les 15 minutes
0 9 * * 1-5     /usr/local/bin/rapport.sh        # 9h00, du lundi au vendredi
```

Moyen mnémotechnique : ordre des champs = du plus petit (minute) au plus grand (jour de semaine), comme on lirait une date à l'envers.

> [!NOTE]
> Pour une tâche planifiée à l'échelle du système (indépendante d'un utilisateur), on peut aussi déposer un fichier dans `/etc/cron.d/`, ou un script dans `/etc/cron.{hourly,daily,weekly,monthly}/`.

> [!WARNING] Environnement minimal de cron
> Cron n'ouvre pas votre shell interactif : `PATH`, répertoire courant et variables peuvent différer. Utiliser des chemins absolus, rediriger stdout/stderr et éviter de dépendre d'un alias.

```text
SHELL=/bin/bash
PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin
0 2 * * * /usr/local/sbin/sauvegarde.sh >>/var/log/sauvegarde.log 2>&1
```

Dans `/etc/crontab` et `/etc/cron.d/*`, un champ **utilisateur** supplémentaire se place entre les cinq champs de date et la commande. Il n'existe pas dans `crontab -e` d'un utilisateur.

---

### at : exécution différée (une seule fois)

```bash
sudo apt install -y at

echo "commande" | at 16:00        # Exécute une seule fois, aujourd'hui à 16h00
at now + 10 minutes                # Puis taper la/les commande(s), Ctrl+D pour valider

atq                                 # Lister les tâches at en attente
atrm NUMERO                        # Supprimer une tâche at par son numéro
```

---

### Alternative moderne : les timers systemd

systemd propose un équivalent des `.timer`, à associer à un `.service` du même nom.

```bash
systemctl list-timers              # Lister les timers actifs et leur prochaine exécution
```

Exemple `/etc/systemd/system/sauvegarde.service` :

```ini
[Unit]
Description=Sauvegarde quotidienne

[Service]
Type=oneshot
ExecStart=/usr/local/sbin/sauvegarde.sh
```

Exemple `/etc/systemd/system/sauvegarde.timer` :

```ini
[Unit]
Description=Planification de la sauvegarde quotidienne

[Timer]
OnCalendar=*-*-* 02:00:00
Persistent=true
RandomizedDelaySec=5m

[Install]
WantedBy=timers.target
```

#### Paramètres d'un fichier `.timer`

Un timer ne contient pas la commande métier : il décide **quand** déclencher une autre unité. Par défaut, `sauvegarde.timer` déclenche `sauvegarde.service`. Cette séparation permet de tester le service manuellement sans attendre l'échéance.

##### Section `[Unit]`

Les directives générales sont les mêmes que pour un service :

| Directive              | Rôle dans un timer                                   | Exemple                                                  |
| ---------------------- | ---------------------------------------------------- | -------------------------------------------------------- |
| `Description=`         | Nom lisible dans `systemctl status` et `list-timers` | `Description=Planification de la sauvegarde quotidienne` |
| `Documentation=`       | Lien vers une documentation ou une page de manuel    | `Documentation=man:sauvegarde(8)`                        |
| `Wants=` / `Requires=` | Ajoute une dépendance souple ou forte                | Rarement nécessaire pour un timer simple                 |
| `After=` / `Before=`   | Impose un ordre sans créer de dépendance             | Ne pas utiliser pour exprimer l'heure de déclenchement   |
| `ConditionPathExists=` | Charge le timer seulement si un prérequis existe     | `ConditionPathExists=/etc/sauvegarde.conf`               |

##### Section `[Timer]`

| Directive             | Déclenchement ou comportement                                         | Exemple et point d'attention                                                                                                 |
| --------------------- | --------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `OnCalendar=`         | Échéance calendaire : date, jour et heure                             | `OnCalendar=Mon..Fri 09:00` ; valider avec `systemd-analyze calendar`                                                        |
| `OnActiveSec=`        | Délai après l'activation du timer                                     | `OnActiveSec=2min`                                                                                                           |
| `OnBootSec=`          | Délai après le démarrage du système                                   | `OnBootSec=10min` ; si le timer est activé tardivement et que l'échéance est déjà passée, il peut partir immédiatement       |
| `OnStartupSec=`       | Délai après le démarrage du gestionnaire systemd                      | Surtout utile avec les services utilisateur `systemd --user`                                                                 |
| `OnUnitActiveSec=`    | Délai après la dernière activation de l'unité déclenchée              | `OnUnitActiveSec=15min` pour une répétition relative                                                                         |
| `OnUnitInactiveSec=`  | Délai après le moment où l'unité déclenchée est redevenue inactive    | Utile pour attendre après la **fin** d'un traitement                                                                         |
| `Unit=`               | Unité à déclencher                                                    | `Unit=export-base.service` ; sans cette ligne, même nom que le timer avec suffixe `.service`                                 |
| `Persistent=`         | Rattrape une échéance `OnCalendar=` manquée pendant l'arrêt           | `Persistent=true` ; ne transforme pas les déclencheurs monotones `OnBootSec=` ou `OnUnitActiveSec=` en historique persistant |
| `AccuracySec=`        | Fenêtre dans laquelle systemd peut regrouper les réveils              | `AccuracySec=1min` économise des réveils ; utiliser une valeur courte seulement si la précision est nécessaire               |
| `RandomizedDelaySec=` | Ajoute un délai aléatoire entre `0` et la valeur indiquée             | `RandomizedDelaySec=5m` évite que tout un parc travaille simultanément                                                       |
| `FixedRandomDelay=`   | Rend le délai aléatoire stable pour une même machine et un même timer | `FixedRandomDelay=true` facilite une répartition durable dans un parc                                                        |
| `WakeSystem=`         | Autorise le timer à réveiller une machine suspendue                   | `WakeSystem=true` nécessite une plateforme et des droits compatibles                                                         |
| `RemainAfterElapse=`  | Garde le timer chargé après son déclenchement                         | Généralement laisser la valeur par défaut ; `false` convient à certains timers transitoires                                  |
| `OnClockChange=`      | Déclenche si l'horloge temps réel fait un saut important              | `OnClockChange=true`                                                                                                         |
| `OnTimezoneChange=`   | Déclenche lors d'un changement de fuseau horaire                      | `OnTimezoneChange=true`                                                                                                      |

> [!NOTE] Plusieurs déclencheurs se cumulent
> Plusieurs lignes `OnCalendar=` ou plusieurs directives `On…Sec=` sont possibles. Le timer se déclenche lorsqu'**une** des échéances est atteinte. Une valeur vide, par exemple `OnCalendar=`, réinitialise les valeurs précédemment héritées dans une surcharge.

##### Quel déclencheur choisir ?

| Besoin                                                      | Directive adaptée        | Exemple                                  |
| ----------------------------------------------------------- | ------------------------ | ---------------------------------------- |
| Tous les jours à une heure civile précise                   | `OnCalendar=`            | `OnCalendar=*-*-* 02:00:00`              |
| Quelques minutes après chaque boot                          | `OnBootSec=`             | `OnBootSec=5min`                         |
| Répéter à intervalle régulier depuis la dernière activation | `OnUnitActiveSec=`       | `OnUnitActiveSec=30min`                  |
| Attendre un délai après la fin réelle du traitement         | `OnUnitInactiveSec=`     | `OnUnitInactiveSec=10min`                |
| Lancer une première fois puis répéter                       | Combiner deux directives | `OnBootSec=2min` et `OnUnitActiveSec=1h` |
| Répartir la charge sur plusieurs serveurs                   | `RandomizedDelaySec=`    | `RandomizedDelaySec=15min`               |

##### Section `[Install]`

| Directive     | Rôle                                      | Valeur habituelle                                      |
| ------------- | ----------------------------------------- | ------------------------------------------------------ |
| `WantedBy=`   | Rend le timer activable au démarrage      | `WantedBy=timers.target`                               |
| `RequiredBy=` | Crée une dépendance forte depuis la cible | Rare pour un timer ; préférer généralement `WantedBy=` |
| `Also=`       | Active une autre unité en même temps      | Peut servir pour un ensemble d'unités liées            |

> [!WARNING] Activer le timer, pas forcément le service
> Pour une tâche uniquement planifiée, exécuter `systemctl enable --now sauvegarde.timer`. Le `.service` reste déclenché par le timer et peut être testé avec `systemctl start sauvegarde.service`. Activer aussi le service au boot provoquerait une exécution supplémentaire indépendante du calendrier.

#### Commandes de validation et d'observation

```bash
sudo systemd-analyze calendar '*-*-* 02:00:00'
sudo systemd-analyze verify /etc/systemd/system/sauvegarde.service /etc/systemd/system/sauvegarde.timer
sudo systemctl daemon-reload
sudo systemctl enable --now sauvegarde.timer
systemctl list-timers sauvegarde.timer --all
systemctl status sauvegarde.timer --no-pager
sudo systemctl start sauvegarde.service       # test immédiat
systemctl show sauvegarde.service -p Result -p ExecMainStatus
sudo journalctl -u sauvegarde.service --since "10 minutes ago" --no-pager
```

`systemd-analyze calendar` traduit une expression `OnCalendar=` et affiche ses prochaines occurrences. `systemd-analyze verify` contrôle la syntaxe et certaines relations entre unités. `list-timers` prouve la dernière et la prochaine échéance ; `show` et `journalctl` prouvent le résultat du service déclenché.

> [!NOTE]
> **À retenir**
>
> - cron : tâche **récurrente** définie par 5 champs (minute, heure, jour du mois, mois, jour de semaine).
> - at : exécution **unique**, différée, sans répétition.
> - Les timers systemd sont l'équivalent moderne de cron, avec les avantages de systemd (logs via `journalctl -u`, dépendances entre unités).
