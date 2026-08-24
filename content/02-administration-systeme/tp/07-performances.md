# TP 2.7 — Observation des performances

> [!TIP] Ressource du TP
>
> - <a href="https://kayasam.github.io/linux-bases-services/telechargements/02-administration-systeme/tp/07-performances.md" download>Télécharger ce TP en Markdown</a>

> Chapitre associé : [observation des performances](02-administration-systeme/07-performances)
>
> Durée estimée : 55 minutes

> [!SUCCESS] Procédure vérifiée
> La charge contrôlée atteint bien un cœur, apparaît dans `ps`/`top`, puis disparaît après l'arrêt du PID exact. Le load average reste une moyenne glissante : sa baisse est progressive.

_**Consigne**_ :

1. Afficher le load average et le temps depuis le dernier démarrage
2. Afficher l'utilisation de la RAM et du swap en format lisible (Go/Mo)
3. Installer `htop` et `sysstat`, puis utiliser `htop` pour trouver le processus consommant le plus de CPU
4. Comparer le load average affiché avec le nombre de cœurs CPU de la VM
    <details>
    <summary>Clique ici pour un indice</summary>
    Une commande (`lscpu` ou `nproc`) donne le nombre de cœurs.
    </details>
5. Afficher l'espace disque disponible sur tous les systèmes de fichiers montés
6. Afficher 5 mesures de `vmstat`, espacées de 2 secondes (`vmstat 2 5`) ; expliquer pourquoi la première ligne est une moyenne depuis le démarrage

> [!NOTE] Correction formateur
> La correction détaillée est conservée dans le coffre pédagogique.

### Défi : établir une preuve de contention CPU

1. Relever une situation de référence avec `uptime`, `nproc`, `free -h` et `vmstat 1 5`.
2. Lancer une charge contrôlée et mémoriser immédiatement son PID : `yes > /dev/null & PID=$!`.
3. Observer pendant au moins une minute le CPU, le load average et le processus responsable.
4. Terminer **ce PID précis**, puis vérifier le retour progressif à la normale.
5. Expliquer pourquoi le load average sur 15 minutes ne redescend pas immédiatement.

> [!WARNING] Nettoyage
> Ne pas quitter le TP avant d'avoir exécuté `kill "$PID"` avec le PID réellement relevé et vérifié sa disparition avec `ps -p PID`.

Pour rendre le nettoyage automatique même en cas d'interruption du shell, ajouter juste après l'affectation :

```bash
trap 'kill "$PID" 2>/dev/null || true' EXIT INT TERM
```

Livrable : tableau « avant / pendant / après » avec charge, CPU disponible, mémoire disponible et processus principal.
