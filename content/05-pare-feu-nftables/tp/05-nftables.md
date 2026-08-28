# TP 5 — Pare-feu nftables

> [!TIP] Ressource du TP
>
> - <a href="https://kayasam.github.io/linux-bases-services/telechargements/05-pare-feu-nftables/tp/05-nftables.md" download>Télécharger ce TP en Markdown</a>

> Chapitre associé : `Cours.md`
>
> Durée estimée : 1 h 30 — console locale et seconde session SSH obligatoires

> [!WARNING] À faire **avant** l'étape 4
> Avant de charger un jeu de règles en `policy drop`, armez votre filet de sécurité :
>
> ```bash
> sudo systemd-run --on-active=300 /usr/sbin/nft flush ruleset
> ```
>
> Notez le nom d'unité affiché (`run-rXXXX.timer`). Si vous vous coupez l'accès, la machine videra ses règles toute seule au bout de 5 minutes. Une fois l'accès vérifié par une **nouvelle** connexion SSH, désarmez avec `sudo systemctl stop run-rXXXX.timer`.
>
> Rappel : `nft` exige `sudo`, **y compris pour lire** le jeu de règles.

_**Consigne**_ :

1. Installer `nftables` et l'activer au démarrage
2. Écrire un jeu de règles dans `/etc/nftables.conf` qui, par défaut, bloque tout le trafic entrant
3. Autoriser explicitement : le trafic déjà établi, la boucle locale (lo), ICMP/ICMPv6, le SSH, le DNS et le HTTP ; ajouter des compteurs et commentaires aux règles de service
4. Charger ce jeu de règles et vérifier qu'il est bien actif
5. Depuis votre hôte, vérifier que le SSH fonctionne toujours, mais qu'un port non autorisé (ex : 8080) est bien bloqué
    <details>
    <summary>Clique ici pour un indice</summary>
    `nc -zv IP PORT` ou `telnet IP PORT` depuis l'hôte permet de tester si un port répond.
    </details>
6. Ajouter une règle autorisant le port 443 (HTTPS), sans recharger tout le fichier
7. Lister les règles avec leur "handle", puis supprimer la règle ajoutée à l'étape 6 via son handle
8. Relancer le service `nftables` et vérifier que la configuration présente dans `/etc/nftables.conf` est bien rechargée automatiquement

### Défi de diagnostic

Le service Apache fonctionne localement (`curl http://localhost`) mais pas depuis le poste client.

1. Prouver qu'Apache écoute sur la bonne adresse et le bon port.
2. Lancer un test client et observer quel compteur nftables évolue — ou n'évolue pas.
3. Vérifier famille d'adresse, interface, chaîne, ordre et port de la règle attendue.
4. Corriger à chaud, retester, puis reporter proprement la modification dans le fichier persistant.
5. Redémarrer le service nftables et prouver que l'accès fonctionne toujours.

Livrable : extrait du ruleset avec handles/compteurs avant et après, commande de test et justification de chaque port ouvert.
