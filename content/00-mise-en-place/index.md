---
title: Mise en place du laboratoire
description: Préparer l'infrastructure Linux et comprendre le fil rouge de la formation.
---

# 00 — Mise en place du laboratoire

> [!NOTE] Objectif
> Préparer une VM Debian accessible sur un réseau privé et disposer d'une base stable pour tous les services de la semaine.

![Architecture du laboratoire](Ressources/images/architecture-laboratoire.svg)

> [!TIP] Ressources du chapitre
>
> - [Ouvrir le cours](00-mise-en-place/cours)
> - <a href="https://kayasam.github.io/linux-bases-services/00-mise-en-place/commandes.html" target="_blank">Explorer les commandes et leurs options</a>
> - <a href="https://kayasam.github.io/linux-bases-services/00-mise-en-place/quiz.html" target="_blank">Faire le quiz — 20 questions</a>
> - [Consulter le guide formateur](Ressources/guide-formateur)
> - [Utiliser la fiche de diagnostic](Ressources/fiche-diagnostic-tssr)

Le serveur de laboratoire est progressivement équipé de stockage LVM, de DNS, d'une pile Web, d'un pare-feu et d'une chaîne de messagerie. La même méthode de vérification est utilisée à chaque étape.
