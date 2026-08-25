# 2.4 Gestion des processus

> [!TIP] Auto-évaluation
> [Mini-quiz interactif — 10 questions](https://kayasam.github.io/linux-bases-services/02-administration-systeme/mini-quiz.html?quiz=02-04-processus)

**Objectifs** : lister, filtrer et lire l'état des processus, leur envoyer des signaux, ajuster leur priorité, et gérer leur exécution en premier/arrière-plan.

![Relation entre unité systemd et processus](Ressources/images/processus-systemd.svg)

> [!TIP] Lecture du schéma
> Un service systemd peut gérer plusieurs processus dans un même cgroup. Tuer un PID au hasard peut déclencher sa relance automatique ; il faut d'abord savoir si le processus appartient à une unité et agir au bon niveau.

---

### Processus et exécutables

**Binaire/exécutable** : fichier permettant de lancer un processus (contient le code) -> objet statique.

**Processus** : une instance d'un programme/exécutable -> objet dynamique -> consommation de ressources (CPU, RAM, disque, réseau, affichage, ...).

Un processus est toujours le fils d'un autre (appels système `fork()` et `exec*()`). Le processus `init` (PID 1, fait partie de systemd) est le père de tous les autres.

![Arbre de parenté des processus](Ressources/images/arbre-processus.svg)

> [!TIP] Lecture du schéma
> Le PID identifie le processus ; le PPID identifie son parent. La forme de l'arbre aide à choisir le bon périmètre avant d'envoyer un signal.

Chaque flèche est un `fork()` (duplication du processus parent) suivi d'un `exec()` (remplacement par le nouveau programme) : c'est pour ça qu'un processus tué n'entraîne pas forcément la mort de ses enfants, mais que la mort du parent peut couper la branche entière (sauf cas de `disown`/`nohup`, voir plus bas).

---

### Lister les processus : `ps`

`ps` affiche un instantané des processus en cours d'exécution (mnémotechnique : _process status_).

```bash
$ ps
    PID TTY          TIME CMD
   1991 pts/0    00:00:00 bash
  52797 pts/0    00:00:00 ps
```

_Sélection des processus affichés (quelles lignes) :_

- `-e`/`-A` : tous les processus
- `-u USERNAME/UID` : processus d'un utilisateur donné
- `-C EXECUTABLE_NAME` : instances d'un exécutable donné
- `-p PID1,PID2,...` : processus spécifiés par une liste de PIDs
- `-L` : threads en plus des processus

_Sélection des informations affichées (quelles colonnes) :_

- `-f` : plus d'informations (User ID, Parent PID, Start Time, arguments)
- `-o INDICATEUR1,INDICATEUR2,...` : colonnes personnalisées
- `--forest` : arborescence des liens de parenté

Man page : [ps(1) sur manpages.debian.org](https://manpages.debian.org/bookworm/procps/ps.1.fr.html)

> [!WARNING]
> Les options avec (UNIX-style) ou sans (BSD-style) le tiret n'ont pas la même signification : `ps u` et `ps -u` ne font pas la même chose.

> [!NOTE]
> **Processus mono ou multithreadé**
>
> Tout processus fonctionne en environnement mémoire protégé (il ne peut accéder qu'à la mémoire qui lui est affectée). Un processus mono-threadé ne contient qu'une entité d'exécution, un processus multi-threadé en contient plusieurs.
>
> À retenir en très simplifié : un thread est un processus léger (en termes de consommation de RAM, etc).

---

### Signaux et arrêt d'un processus

**Qu'est-ce qu'un signal ?** Un message envoyé à un processus pour lui demander de réagir (s'arrêter, se relancer, ignorer une info, ...).

```bash
kill -l    # Liste des signaux disponibles
```

| Signal  | Numéro | Effet                                                                   |
| ------- | ------ | ----------------------------------------------------------------------- |
| SIGHUP  | 1      | Redémarrage/relecture de la config (historiquement : perte du terminal) |
| SIGINT  | 2      | Interruption (équivalent Ctrl+C)                                        |
| SIGKILL | 9      | Arrêt forcé et immédiat, non-interceptable                              |
| SIGTERM | 15     | Demande d'arrêt propre (signal par défaut de `kill`)                    |
| SIGSTOP | 19     | Mise en pause forcée, non-interceptable                                 |
| SIGCONT | 18     | Reprise après une pause                                                 |

Moyen mnémotechnique : SIGTERM (par défaut) demande gentiment, SIGKILL (-9) ne demande pas la permission.

```bash
kill PID              # Envoie SIGTERM (15) au PID
kill -9 PID            # Envoie SIGKILL (arrêt forcé)
kill -SIGHUP PID       # Envoie SIGHUP (souvent utilisé pour recharger une config)

killall nom_processus  # Cible par nom d'exécutable, tous les PIDs concernés
pkill -f motif         # Cible par motif (recherche dans la commande complète)
```

> [!WARNING]
> `kill -9` ne laisse pas au processus la possibilité de fermer proprement ses fichiers/connexions. À utiliser en dernier recours (processus figé qui n'écoute plus SIGTERM).

Procédure d'arrêt raisonnée :

```bash
ps -o pid,ppid,stat,etime,cmd -p PID
systemctl status PID                 # retrouve l'unité propriétaire si elle existe
sudo systemctl stop NOM.service      # préférable pour un service
kill -TERM PID                       # sinon demande d'arrêt propre
sleep 3
ps -p PID                            # vérifier, puis seulement envisager SIGKILL
```

### Comprendre les états d'un processus

La colonne `STAT` aide à distinguer un processus actif d'un processus bloqué :

| Code | État                      | Interprétation utile                                      |
| ---- | ------------------------- | --------------------------------------------------------- |
| `R`  | running/runnable          | s'exécute ou attend un cœur CPU                           |
| `S`  | sommeil interruptible     | attend un événement normal                                |
| `D`  | sommeil non interruptible | souvent bloqué sur une E/S ; contribue au load average    |
| `T`  | arrêté                    | suspendu par un signal ou un débogueur                    |
| `Z`  | zombie                    | terminé, mais le parent n'a pas encore lu son code retour |

Un zombie ne consomme presque pas de ressources et ne peut pas être « tué » : il est déjà mort. Il faut diagnostiquer son parent (`PPID`), qui devrait appeler `wait()`.

```bash
ps -eo user,pid,ppid,stat,%cpu,%mem,etime,cmd --sort=-%cpu | head
pstree -ap
cat /proc/PID/status
sudo lsof -p PID | head
```

---

### Priorité des processus (nice / renice)

Chaque processus a une priorité d'ordonnancement, la **niceness**, de **-20** (priorité la plus haute) à **19** (priorité la plus basse). Valeur par défaut : **0**.

Moyen mnémotechnique : plus un processus est "nice" (gentil), moins il monopolise le CPU, donc plus le chiffre est haut, moins il est prioritaire.

```bash
nice -n 10 nom_commande      # Lance avec une priorité plus basse
nice -n -5 nom_commande      # Lance avec une priorité plus haute (root requis)

renice -n 5 -p PID           # Change la priorité d'un processus déjà lancé
```

La colonne **NI** dans `ps -l` ou `top` affiche la niceness courante.

---

### Premier plan / arrière-plan et gestion des jobs

Un processus lancé dans un terminal peut tourner :

- **au premier plan** (_foreground_) : bloque le terminal jusqu'à la fin
- **en arrière-plan** (_background_) : rend la main immédiatement

```bash
nom_commande &          # Lance en arrière-plan
jobs                     # Liste les jobs du shell courant
fg %1                    # Repasse le job 1 au premier plan
bg %1                    # Relance le job 1 (en pause) en arrière-plan
```

- `Ctrl+Z` : envoie SIGTSTP, met le job au premier plan en pause (visible avec `jobs`, état _Stopped_)
- `bg %N` : reprend son exécution en arrière-plan

> [!NOTE]
> Un processus lancé avec `&` reste attaché au terminal : si celui-ci se ferme, le processus reçoit un SIGHUP et s'arrête généralement.
>
> ```bash
> nohup nom_commande &     # Ignore le SIGHUP
> disown %1                # Détache un job déjà lancé
> ```

> [!NOTE] Job ≠ processus
> `%1` est un identifiant de job propre au shell courant ; `PID` est un identifiant système. Après déconnexion, `jobs` d'une nouvelle session ne connaît pas les anciens jobs, même si certains processus continuent grâce à `nohup`, `disown`, systemd ou un multiplexeur comme `tmux`.

> [!NOTE]
> **À retenir**
>
> - Un processus est toujours créé par `fork()`+`exec()` d'un parent ; PID 1 (systemd) est l'ancêtre de tous.
> - `kill` envoie SIGTERM (demande polie) par défaut ; `kill -9` (SIGKILL) ne se discute pas.
> - La niceness (`-20` à `19`) influence l'ordonnancement CPU, pas la mémoire ni les priorités disque.
> - `&`, `jobs`, `fg`/`bg`, `nohup`/`disown` gèrent le cycle de vie d'un processus lancé depuis un terminal interactif.
