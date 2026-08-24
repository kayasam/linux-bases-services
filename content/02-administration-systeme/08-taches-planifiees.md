# 2.8 Tâches planifiées

> [!TIP] Commandes interactives
> <a href="https://kayasam.github.io/linux-bases-services/02-administration-systeme/commandes.html" target="_blank">Explorer les commandes cron, at et timers systemd</a>

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

```bash
sudo systemd-analyze calendar '*-*-* 02:00:00'
sudo systemctl daemon-reload
sudo systemctl enable --now sauvegarde.timer
systemctl list-timers sauvegarde.timer
sudo systemctl start sauvegarde.service       # test immédiat
sudo journalctl -u sauvegarde.service
```

`Persistent=true` rattrape au prochain démarrage une échéance manquée lorsque la machine était éteinte. `RandomizedDelaySec` évite que toutes les machines d'un parc lancent la même tâche exactement au même instant.

> [!NOTE]
> **À retenir**
>
> - cron : tâche **récurrente** définie par 5 champs (minute, heure, jour du mois, mois, jour de semaine).
> - at : exécution **unique**, différée, sans répétition.
> - Les timers systemd sont l'équivalent moderne de cron, avec les avantages de systemd (logs via `journalctl -u`, dépendances entre unités).
