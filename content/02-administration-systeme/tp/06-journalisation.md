# TP 2.6 — Logs et diagnostic

> [!TIP] Ressource du TP
>
> - <a href="https://kayasam.github.io/linux-bases-services/telechargements/02-administration-systeme/tp/06-journalisation.md" download>Télécharger ce TP en Markdown</a>

> Chapitre associé : `Cours.md`
>
> Durée estimée : 45 minutes

_**Consigne**_ :

1. Afficher tous les journaux système avec `journalctl`
2. Afficher uniquement les journaux du démarrage courant
3. Consulter les logs du service SSH, puis les suivre en temps réel
4. Filtrer les journaux système pour n'afficher que les erreurs (et plus grave)
5. Afficher les messages noyau avec `dmesg`, avec un horodatage lisible
    <details>
    <summary>Clique ici pour un indice</summary>
    Une option de `dmesg` remplace le "temps depuis le boot" par une heure humainement lisible.
    </details>
6. Faire la même chose (messages noyau) mais via `journalctl`
7. Consulter `/var/log/auth.log` et repérer une tentative de connexion (SSH ou `sudo`)
8. Rechercher le mot `error` dans `/var/log/syslog`
9. Choisir un fichier de log qui se met à jour fréquemment et l'observer en direct avec `tail -f`

### Défi : corréler un événement

1. Noter l'heure avec `date --iso-8601=seconds`.
2. Dans un terminal, suivre le journal SSH en direct.
3. Depuis un autre terminal, provoquer une authentification SSH échouée, puis une réussie.
4. Extraire uniquement la fenêtre de cinq minutes, sans pagination, avec un horodatage ISO.
5. Identifier l'unité, le PID et le message correspondant, sans publier de mot de passe ni de journal complet.

Livrable : deux à cinq lignes de journal pertinentes, anonymisées si nécessaire, suivies d'une phrase distinguant le symptôme, la preuve et la cause.
