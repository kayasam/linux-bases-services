# TP 2.8 — Tâches planifiées

> [!TIP] Ressource du TP
>
> - <a href="https://kayasam.github.io/linux-bases-services/telechargements/02-administration-systeme/tp/08-taches-planifiees.md" download>Télécharger ce TP en Markdown</a>

> Chapitre associé : `Cours.md`
>
> Durée estimée : 1 heure

_**Consigne**_ :

1. Ajouter une ligne dans votre crontab qui écrit la date dans un fichier `/tmp/cron-test.log` toutes les minutes
2. Attendre 2-3 minutes, puis vérifier que le fichier se remplit bien
3. Lister le contenu de votre crontab
4. Installer `at` et planifier une commande à exécuter dans 2 minutes
5. Vérifier que la tâche `at` apparaît bien dans la file d'attente, puis la supprimer avant son exécution
    <details>
    <summary>Clique ici pour un indice</summary>
    Une commande liste les tâches `at` en attente avec leur numéro, une autre les supprime par ce numéro.
    </details>
6. Supprimer la ligne ajoutée à l'étape 1 de votre crontab
7. Lister les timers systemd actifs sur le système

> [!NOTE] Correction formateur`n> La correction détaillée est conservée dans le coffre pédagogique.

### Défi : convertir cron en timer systemd

Créer un service `horodatage.service` de type `oneshot` qui ajoute une date à `/var/tmp/horodatage.log`, puis un `horodatage.timer` qui le déclenche toutes les deux minutes.

1. Valider l'expression avec `systemd-analyze calendar`.
2. Activer le timer immédiatement.
3. Déclencher aussi le service manuellement pour éviter d'attendre pendant le test.
4. Vérifier la prochaine échéance, le code retour du service et son journal.
5. Expliquer l'intérêt de `Persistent=true` pour un poste parfois éteint.

Critères de réussite : timer `active (waiting)`, au moins deux lignes dans le fichier, aucune erreur dans le journal, fichiers d'unités syntaxiquement valides.
