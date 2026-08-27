# TP 4 bis — Installer un serveur GLPI en autonomie

> [!TIP] Ressource du TP
>
> - <a href="https://kayasam.github.io/linux-bases-services/telechargements/04-serveur-web-lamp/tp/04-glpi.md" download>Télécharger ce TP en Markdown</a>

> Durée estimée : 2 h
>
> Prérequis : la pile LAMP du TP 4 fonctionne, et le serveur DNS du chapitre 3 est opérationnel.

## Mise en situation

L'entreprise **Fournil** ne dispose d'aucun inventaire de son parc informatique : les machines, les licences et les demandes des utilisateurs sont suivies dans un tableur. La direction demande la mise en place de **GLPI**, la solution libre de gestion de parc et de helpdesk.

Vous êtes l'administrateur système. Le serveur web est déjà en place — c'est celui que vous avez monté au TP 4. À vous d'y installer GLPI.

> [!IMPORTANT] Ce TP ne contient aucune commande, et c'est volontaire
> Vous disposez d'**une seule ressource** : la documentation officielle. Aucun tutoriel, aucun blog, aucune IA.
>
> Ce n'est pas une brimade. En entreprise, personne ne vous fournira de marche à suivre : on vous donnera un logiciel à installer et une documentation éditeur. **Savoir lire une documentation officielle et en extraire un plan d'action est la compétence évaluée ici** — pas votre capacité à recopier des commandes.
>
> Bonne nouvelle : l'assistant d'installation de GLPI vérifie lui-même l'environnement et vous dit précisément ce qui manque. Apprenez à vous en servir, c'est votre meilleur outil de diagnostic.

## La ressource

**Documentation officielle d'installation de GLPI** → <https://glpi-install.readthedocs.io/>

Deux pages vous suffiront : les **prérequis** et l'**installation**. Lisez-les _entièrement_ avant de taper la première commande — plusieurs contraintes de ce TP y sont expliquées, et les découvrir en cours de route vous fera tout recommencer.

## Cahier des charges

Le travail est terminé quand les huit points suivants sont satisfaits.

1. GLPI est accessible depuis le navigateur du poste hôte à l'adresse **`https://glpi.fournil.lab`**
2. Le nom `glpi.fournil.lab` est résolu par **votre serveur DNS** du chapitre 3 — pas par le fichier `hosts` du poste
3. GLPI dispose de son **propre virtual host**, avec ses propres journaux d'accès et d'erreurs. Le site `fournil-web` du TP 4 continue de fonctionner sans modification
4. GLPI dispose de sa **propre base de données** et de son **propre utilisateur MariaDB**, distincts de ceux du TP 4, et dont les droits ne portent que sur cette base
5. (bonus) La connexion est chiffrée, avec un certificat **couvrant le nom `glpi.fournil.lab`**
6. (bonus) La page de vérification de l'assistant d'installation ne présente **aucun point rouge**
7. (bonus) Les mesures de sécurité **recommandées par la documentation** après l'installation ont été appliquées
8. (bonus) Les tâches automatiques de GLPI sont déclenchées par le système, et non par les visites des utilisateurs

## Livrables

À rendre en fin de séance, dans une note :

- **Votre fiche d'installation** : la suite des commandes et des fichiers modifiés, dans l'ordre, telle qu'un collègue pourrait la rejouer. C'est le vrai livrable professionnel — écrivez-la au fur et à mesure, pas à la fin de mémoire.
- **Une capture** de la page de vérification de l'assistant, tout au vert.
- **Le contenu de votre virtual host** GLPI.
- **La preuve du chiffrement** : la commande qui montre le certificat réellement présenté et les noms qu'il couvre.
- **Votre journal de bord des difficultés** : pour chaque blocage — le symptôme observé, la commande qui vous a mis sur la piste, la cause, la correction. Ce point compte autant que le reste.

## Si vous êtes bloqué

On ne vous donnera pas la réponse, mais la méthode du chapitre reste valable. Dans l'ordre :

1. **Quelle couche est en cause ?** Le nom résout-il ? Le port répond-il ? Le bon virtual host est-il sélectionné ? PHP s'exécute-t-il ? La base répond-elle ? Ne changez jamais deux couches à la fois.
2. **Qu'est-ce qui est écrit, exactement ?** Le code HTTP obtenu avec `curl -v`, et le journal d'erreurs **de votre vhost**. Une page blanche n'est pas une absence de message : c'est un message que vous n'avez pas encore lu.
3. **Le logiciel vous parle-t-il ?** L'assistant GLPI liste ce qui manque. Lisez la ligne rouge en entier avant d'agir.
4. **Qu'est-ce que la documentation dit à ce sujet ?** Presque tous les blocages de ce TP sont traités explicitement dans les deux pages indiquées.

> [!TIP] Le réflexe qui fait gagner le plus de temps
> Gardez en permanence un second terminal ouvert sur le journal d'erreurs de votre virtual host GLPI. La quasi-totalité des échecs de ce TP y sont expliqués en une ligne.
