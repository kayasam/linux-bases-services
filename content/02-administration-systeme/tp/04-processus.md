# TP 2.4 — Processus, signaux et priorités

> [!TIP] Ressource du TP
>
> - <a href="https://kayasam.github.io/linux-bases-services/telechargements/02-administration-systeme/tp/04-processus.md" download>Télécharger ce TP en Markdown</a>

> Chapitre associé : `Cours.md`
>
> Durée estimée : 50 minutes

_**Consigne**_ : sur votre VM Debian, trouvez la commande qui répond à chaque question.

1. Afficher tous les processus de l'OS avec les informations "full details"
2. Même chose mais uniquement pour les processus de l'utilisateur `stagiaire`
3. Afficher tous les processus de l'OS sous forme d'arborescence
4. Même chose, mais uniquement pour les processus `sshd`
5. Afficher tous les processus de l'OS sous forme d'arborescence, avec les informations suivantes : l'utilisateur, le process ID, le pourcentage d'utilisation du processeur, le pourcentage d'utilisation de la RAM, et la commande complète utilisée pour lancer le processus
6. Lancer la commande `sleep 300` en arrière-plan, puis vérifier qu'elle apparaît bien dans la liste des jobs du shell
    <details>
    <summary>Clique ici pour un indice</summary>
    Pensez au `&` en fin de commande, et à la commande qui liste les jobs du shell courant.
    </details>
7. Mettre en pause ce processus `sleep`, vérifier son nouvel état, puis le reprendre en arrière-plan
    <details>
    <summary>Clique ici pour un indice</summary>
    `Ctrl+Z` met en pause le job au premier plan. Une commande à 2 lettres permet de le reprendre en arrière-plan.
    </details>
8. Arrêter proprement ce processus `sleep` avec un signal, sans utiliser `SIGKILL`
    <details>
    <summary>Clique ici pour un indice</summary>
    C'est le signal envoyé par défaut par la commande `kill`.
    </details>
9. Relancer `sleep 300 &`, puis le tuer cette fois avec `SIGKILL`, en ciblant le processus par son nom plutôt que son PID
    <details>
    <summary>Clique ici pour un indice</summary>
    Une commande cible tous les processus portant un nom donné, sans chercher le PID au préalable.
    </details>
10. Relancer `sleep 300 &`, puis le relancer une seconde fois avec une priorité (niceness) de 15, et vérifier la colonne NI dans `ps -l` ou `top` pour les deux processus

### Défi de diagnostic

Lancer un processus avec plusieurs enfants :

```bash
bash -c 'sleep 600 & sleep 601 & wait' &
```

1. Reconstituer l'arbre parent/enfants avec PID et PPID.
2. Relever l'état (`STAT`) et le temps écoulé (`ETIME`).
3. Envoyer `SIGSTOP` au parent et observer si les enfants changent d'état.
4. Reprendre puis terminer proprement toute la branche, sans `pkill sleep` afin de ne pas toucher d'autres stagiaires/processus.

Livrable : commandes utilisées, observation sur la propagation des signaux et preuve qu'aucun des trois PID ne subsiste.
