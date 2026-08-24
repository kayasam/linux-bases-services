# Guide formateur — Linux : bases d'administration et services

> [!NOTE] Public visé
> Techniciens supérieurs systèmes et réseaux (TSSR) ayant déjà pratiqué la ligne de commande Linux. La formation vise le passage de « je connais une commande » à « je sais expliquer, vérifier et dépanner un service ».

## Fil conducteur

Le serveur de laboratoire porte l'adresse `192.168.56.200/24`. Les chapitres construisent progressivement une petite infrastructure cohérente :

1. préparer le stockage et les systèmes de fichiers ;
2. observer le démarrage, le matériel, les processus, les services et les journaux ;
3. publier une zone DNS ;
4. exposer une application web LAMP ;
5. limiter les flux avec nftables ;
6. acheminer et consulter du courrier local.

![Vue d'ensemble du laboratoire](Ressources/images/architecture-laboratoire.svg)

> [!TIP] Question à poser régulièrement
> « À quelle couche se situe le problème, quelle preuve permet de le confirmer, et quelle commande fournit cette preuve ? » Cette formulation évite le dépannage au hasard.

---

## Compétences attendues en fin de formation

Le stagiaire doit être capable de :

- décrire une chaîne technique de bout en bout, du stockage physique jusqu'au service réseau ;
- effectuer une modification persistante sans confondre l'état courant et l'état au prochain démarrage ;
- valider une configuration avant de recharger un service ;
- localiser une panne grâce à une démarche reproductible ;
- justifier l'ouverture d'un port et vérifier quel processus l'écoute ;
- distinguer symptôme, cause, preuve et correction ;
- restituer un changement dans un mini compte rendu d'intervention.

---

## Rituel pédagogique conseillé

Pour chaque notion, utiliser le cycle suivant :

1. **Prédire** : demander ce qui devrait se passer avant d'exécuter la commande.
2. **Observer** : relever la sortie utile, sans se contenter de « ça marche ».
3. **Expliquer** : relier la sortie au mécanisme présenté dans le schéma.
4. **Provoquer une panne** : faute de syntaxe, mauvais port, droit insuffisant ou service arrêté.
5. **Diagnostiquer** : appliquer la fiche `Ressources/fiche-diagnostic-tssr.md`.
6. **Rétablir et prouver** : corriger, retester, puis indiquer la preuve du retour au service.

> [!WARNING] Sécurité du laboratoire
> Les exemples utilisent un réseau privé isolé. Les mots de passe simples, l'IMAP sans TLS et les services de démonstration ne doivent jamais être transposés tels quels en production.

---

## Évaluation formative

À la fin de chaque chapitre, demander une restitution en quatre phrases :

- **Service rendu** : à quoi sert le composant ?
- **État attendu** : processus, socket, montage ou fichier qui doit exister.
- **Commande de preuve** : quelle commande vérifie cet état ?
- **Premier journal** : où chercher si la preuve n'est pas obtenue ?

La réponse est satisfaisante lorsqu'elle s'appuie sur une observation mesurable et non sur une supposition.
