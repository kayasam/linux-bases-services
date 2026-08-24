# 2.5 Gestion des services (systemd)

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
> ```=
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
