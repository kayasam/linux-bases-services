# TP 2.4 — Processus, signaux et priorités

> [!TIP] Ressource du TP
>
> - <a href="https://kayasam.github.io/linux-bases-services/telechargements/02-administration-systeme/tp/04-processus.md" download>Télécharger ce TP en Markdown</a>

> Chapitre associé : [gestion des processus](02-administration-systeme/04-processus)
>
> Durée estimée : 50 minutes

> [!SUCCESS] Procédure vérifiée
> Les créations de jobs, changements d'état, priorités et nettoyages par PID ont été rejoués sur Debian. Un `SIGSTOP` envoyé au parent ne suspend pas automatiquement ses enfants : c'est précisément l'observation attendue dans le défi.

_**Consigne**_ : sur votre VM Debian, trouvez la commande qui répond à chaque question.

1. Afficher tous les processus de l'OS avec les informations "full details"
2. Même chose mais uniquement pour les processus de l'utilisateur `stagiaire`
3. Afficher tous les processus de l'OS sous forme d'arborescence
4. Afficher les processus `sshd` avec PID et PPID, puis les replacer dans leur arbre (`pgrep -a sshd`, `ps --forest` ou `pstree -p`)
5. Afficher tous les processus de l'OS sous forme d'arborescence, avec les informations suivantes : l'utilisateur, le process ID, le pourcentage d'utilisation du processeur, le pourcentage d'utilisation de la RAM, et la commande complète utilisée pour lancer le processus
6. Lancer la commande `sleep 300` en arrière-plan, puis vérifier qu'elle apparaît bien dans la liste des jobs du shell
    <details>
    <summary>Clique ici pour un indice</summary>
    Pensez au `&` en fin de commande, et à la commande qui liste les jobs du shell courant.
    </details>
7. Ramener ce job au premier plan avec `fg`, le suspendre avec `Ctrl+Z`, vérifier l'état `T`, puis le reprendre en arrière-plan
    <details>
    <summary>Clique ici pour un indice</summary>
    `Ctrl+Z` ne suspend que le job au **premier plan**. Utiliser ensuite `jobs -l`, `ps -o pid,stat,cmd -p PID`, puis la commande `bg`.
    </details>
8. Arrêter proprement ce processus `sleep` avec un signal, sans utiliser `SIGKILL`
    <details>
    <summary>Clique ici pour un indice</summary>
    C'est le signal envoyé par défaut par la commande `kill`.
    </details>
9. Relancer `sleep 300 &`, puis le tuer cette fois avec `SIGKILL`, en ciblant le processus par son nom plutôt que son PID
    <details>
    <summary>Clique ici pour un indice</summary>
    Vérifier d'abord `pgrep -a -x sleep`, puis utiliser `pkill -KILL -x sleep`. Cette commande vise **tous** les processus nommés `sleep` : elle n'est acceptable ici que dans une VM individuelle sans autre tâche `sleep` utile.
    </details>
10. Relancer `sleep 300 &`, puis lancer `nice -n 15 sleep 300 &` et comparer la colonne `NI` avec `ps -o pid,ni,stat,cmd -p PID1,PID2`

> [!NOTE] Correction formateur
> La correction détaillée est conservée dans le coffre pédagogique.

### Défi de diagnostic

Lancer un processus avec plusieurs enfants :

```bash
bash -c 'sleep 600 & sleep 601 & wait' &
```

1. Reconstituer l'arbre parent/enfants avec PID et PPID.
2. Relever l'état (`STAT`) et le temps écoulé (`ETIME`).
3. Envoyer `SIGSTOP` au parent et observer si les enfants changent d'état.
4. Reprendre puis terminer proprement toute la branche, sans `pkill sleep` afin de ne pas toucher d'autres stagiaires/processus.

> [!TIP] Nettoyage ciblé
> Conserver les trois PID dans des variables. Après `SIGCONT` sur le parent, envoyer `SIGTERM` aux deux enfants puis au parent, utiliser `wait` si le shell le permet et confirmer leur absence avec `ps -p PID_PARENT,PID_ENFANT1,PID_ENFANT2`.

Livrable : commandes utilisées, observation sur la propagation des signaux et preuve qu'aucun des trois PID ne subsiste.
