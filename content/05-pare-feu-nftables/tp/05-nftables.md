# TP 5 — Pare-feu nftables

> [!TIP] Ressource du TP
>
> - <a href="https://kayasam.github.io/linux-bases-services/telechargements/05-pare-feu-nftables/tp/05-nftables.md" download>Télécharger ce TP en Markdown</a>

> Chapitre associé : [pare-feu nftables](05-pare-feu-nftables/cours)
>
> Durée estimée : 1 h 30 — console locale et seconde session SSH obligatoires

> [!SUCCESS] Procédure vérifiée
> Le filtrage a été testé depuis un client placé sur un réseau distinct : SSH, DNS et HTTP passent, un service temporaire sur 8080 est bloqué, et les compteurs des règles correspondantes évoluent.

_**Consigne**_ :

1. Installer `nftables` et l'activer au démarrage
2. Sauvegarder l'état actif avec `sudo nft list ruleset > /tmp/ruleset-avant.nft`, puis écrire dans `/etc/nftables.conf` une table `inet` dont la chaîne `input` possède une politique `drop`
3. Avant le refus final, autoriser explicitement : `ct state established,related`, la boucle locale, ICMP/ICMPv6, SSH, DNS en UDP **et TCP**, puis HTTP ; ajouter des compteurs et commentaires
4. Valider sans appliquer avec `sudo nft --check --file /etc/nftables.conf`, conserver une console de secours, charger avec `sudo nft -f /etc/nftables.conf`, puis vérifier avec `sudo nft -a list ruleset`
5. Depuis l'hôte, vérifier que SSH, DNS et HTTP fonctionnent toujours. Pour prouver le filtrage de 8080, démarrer d'abord un service temporaire sur ce port et confirmer qu'il répond localement, puis que le client distant est bloqué
    <details>
    <summary>Clique ici pour un indice</summary>
    Un échec sur un port où aucun programme n'écoute ne prouve pas l'action du pare-feu. Utiliser temporairement `python3 -m http.server 8080 --bind 0.0.0.0`, tester localement, puis `nc -zvw2 IP 8080` depuis le client. Conserver le PID du serveur et l'arrêter après le test.
    </details>
6. Ajouter à chaud une règle autorisant le port 443, sans recharger tout le fichier. Si une règle terminale `drop` existe, insérer l'autorisation **avant** celle-ci (`insert rule` ou `add rule ... position HANDLE`) plutôt que de l'ajouter après
7. Lister les règles avec leur "handle", puis supprimer la règle ajoutée à l'étape 6 via son handle
8. Relancer le service `nftables` et vérifier que la configuration présente dans `/etc/nftables.conf` est bien rechargée automatiquement

> [!WARNING] Ordre des règles
> Une autorisation placée après un verdict terminal `drop` est inatteignable. Après chaque ajout, afficher la chaîne avec ses handles, déclencher un flux réel et vérifier que le compteur de la nouvelle règle augmente.

> [!NOTE] Correction formateur
> La correction détaillée est conservée dans le coffre pédagogique.

### Défi de diagnostic

Le service Apache fonctionne localement (`curl http://localhost`) mais pas depuis le poste client.

1. Prouver qu'Apache écoute sur la bonne adresse et le bon port.
2. Lancer un test client et observer quel compteur nftables évolue — ou n'évolue pas.
3. Vérifier famille d'adresse, interface, chaîne, ordre et port de la règle attendue.
4. Corriger à chaud, retester, puis reporter proprement la modification dans le fichier persistant.
5. Redémarrer le service nftables et prouver que l'accès fonctionne toujours.

Livrable : extrait du ruleset avec handles/compteurs avant et après, commande de test et justification de chaque port ouvert.
