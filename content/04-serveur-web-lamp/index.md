---
title: Serveur Web LAMP
description: Publier une application PHP reliée à MariaDB derrière Apache.
---

# 04 — Serveur Web LAMP

![Trajet d'une requête LAMP](Ressources/images/pile-lamp.svg)

> [!TIP] Ressources du chapitre
>
> - [Ouvrir le cours](04-serveur-web-lamp/cours)
> - [Réaliser le TP LAMP](04-serveur-web-lamp/tp/04-lamp)
> - <a href="https://kayasam.github.io/linux-bases-services/04-serveur-web-lamp/commandes.html" target="_blank">Explorer les commandes et leurs options</a>
> - <a href="https://kayasam.github.io/linux-bases-services/04-serveur-web-lamp/quiz.html" target="_blank">Faire le quiz — 20 questions</a>
> - [Ouvrir la fiche de diagnostic](Ressources/fiche-diagnostic-tssr)

Les tests séparent volontairement DNS, socket HTTP, virtual host, exécution PHP et accès SQL afin d'éviter les corrections au hasard.
