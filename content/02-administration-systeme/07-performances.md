# 2.7 Observation des performances

> [!TIP] Auto-évaluation
> [Mini-quiz interactif — 10 questions](https://kayasam.github.io/linux-bases-services/02-administration-systeme/mini-quiz.html?quiz=02-07-performances)

**Objectifs** : savoir répondre à "pourquoi la machine est lente ?" en regardant CPU, mémoire et disque, avant de soupçonner le réseau ou l'application.

![Méthode de diagnostic TSSR](Ressources/images/diagnostic-tssr.svg)

> [!NOTE] Principe
> Une valeur isolée est rarement concluante. Mesurer plusieurs fois, comparer à une période normale et corréler CPU, mémoire, E/S et processus. Le but est d'identifier la ressource qui fait attendre le travail.

---

### Charge et mémoire

```bash
uptime      # Load average sur 1, 5 et 15 minutes + temps depuis le boot
free -h     # RAM et swap utilisés/disponibles, format lisible (Go/Mo)
```

> [!NOTE]
> Sous Linux, le **load average** compte les tâches exécutables ou en attente de CPU (`R`), mais aussi celles bloquées en sommeil non interruptible (`D`), souvent à cause d'E/S. Il se lit sur 1, 5 et 15 minutes. Le comparer au nombre de CPU logiques (`nproc`) donne un indice, pas un verdict :
>
> - charge durablement supérieure au nombre de CPU + CPU proche de 100 % → contention CPU probable ;
> - charge élevée + CPU peu occupé + nombreux processus en `D` → stockage ou E/S probablement bloquants.

---

### Processus en temps réel : top / htop

```bash
top     # Vue dynamique des processus, triée par défaut par %CPU
```

Raccourcis utiles dans `top` : `P` (trier par CPU), `M` (trier par mémoire), `k` (envoyer un signal à un PID), `q` (quitter).

```bash
sudo apt install -y htop
htop    # Version améliorée et colorée de top (barres de charge, souris, ...)
```

---

### Disque et E/S

```bash
df -h                          # Espace disque par système de fichiers monté
du -sh /chemin/                # Taille d'un répertoire

sudo apt install -y sysstat
vmstat 2 5                     # Statistiques CPU/mémoire/E-S, 5 mesures espacées de 2s
iostat -x 2                    # Détail des E/S disque par périphérique
```

Dans `vmstat`, ignorer la première ligne moyenne depuis le démarrage et observer notamment : `r` (tâches exécutables), `si/so` (swap entrant/sortant), `wa` (temps CPU en attente d'E/S) et `us/sy/id` (CPU utilisateur/système/inactif).

Dans `iostat -x`, une latence (`await`) qui augmente et un périphérique durablement très occupé (`%util`) orientent vers le stockage. Les seuils dépendent fortement du matériel : comparer avec la situation normale de cette machine.

### Mémoire : « used » n'est pas forcément un problème

Linux utilise la RAM libre comme cache disque et la libère à la demande. La colonne importante de `free -h` est donc surtout `available`, estimation de la mémoire mobilisable sans swap important.

```bash
free -h
vmstat 1 10
ps -eo pid,comm,%mem,rss --sort=-rss | head
sudo journalctl -k -g 'oom|Out of memory|Killed process'
```

Une utilisation du swap n'indique pas à elle seule une saturation actuelle : des pages anciennes peuvent y rester. Des valeurs `si`/`so` continuellement actives dans `vmstat`, associées à une faible mémoire disponible et des ralentissements, sont plus significatives.

### Espace plein ou inodes épuisés

```bash
df -hT          # capacité en octets
df -i           # quantité d'inodes
sudo du -xhd1 /var | sort -h
```

Un FS peut refuser de nouveaux fichiers avec de l'espace apparent si tous ses inodes sont consommés par une multitude de petits fichiers. `df -h` et `df -i` répondent donc à deux questions différentes.

> [!NOTE]
> **À retenir** — l'ordre du diagnostic express :
>
> 1. `uptime` (load average) : y a-t-il seulement un problème de charge ?
> 2. `free -h` : est-ce la RAM qui sature (et le swap qui compense) ?
> 3. `top`/`htop` : quel processus précis en est responsable ?
> 4. `df -h`/`iostat` : le disque est-il plein ou saturé en E/S ?
