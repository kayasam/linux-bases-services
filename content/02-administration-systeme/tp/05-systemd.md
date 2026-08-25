# TP 2.5 — Gestion des services

> [!TIP] Ressource du TP
>
> - <a href="https://kayasam.github.io/linux-bases-services/telechargements/02-administration-systeme/tp/05-systemd.md" download>Télécharger ce TP en Markdown</a>

> Chapitre associé : `Cours.md`
>
> Durée estimée : 55 minutes — console locale requise

> [!WARNING] Accès distant
> Ne pas arrêter SSH depuis l'unique session SSH. Utiliser la console de la VM ou conserver une seconde voie d'accès.

_**Consigne**_ :

1. Lister tous les services actifs sur le système
2. Vérifier l'état du service SSH
3. Arrêter le service SSH, vérifier qu'il n'est plus actif
4. Redémarrer le service SSH, vérifier qu'il fonctionne à nouveau
5. Vérifier si SSH est activé au démarrage
6. Désactiver puis réactiver l'activation au démarrage de SSH
    <details>
    <summary>Clique ici pour un indice</summary>
    Deux commandes symétriques, à ne pas confondre avec `start`/`stop`.
    </details>
7. Lister les éventuels services en échec sur le système
8. Consulter les journaux du service SSH, puis les suivre en temps réel

### Défi : créer et dépanner une unité

Créer `/etc/systemd/system/horloge-tssr.service` :

```ini
[Unit]
Description=Écrit une date de validation TSSR

[Service]
Type=oneshot
ExecStart=/bin/sh -c 'date --iso-8601=seconds >> /var/tmp/horloge-tssr.log'
```

1. Faire relire les unités, lancer le service et prouver son code retour.
2. Modifier volontairement `ExecStart` avec un chemin inexistant.
3. Recharger, reproduire la panne et retrouver la cause dans le statut puis le journal.
4. Corriger et prouver le rétablissement par une nouvelle ligne horodatée.

Livrable : `systemctl status`, les lignes de journal de la tentative en échec et la preuve finale dans le fichier.
