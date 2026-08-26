# Fiche méthode — Diagnostiquer un service Linux

> [!NOTE] Objectif
> Passer d'un symptôme utilisateur à une cause démontrée, puis vérifier le rétablissement du service.

![Entonnoir de diagnostic TSSR](Ressources/images/diagnostic-tssr.svg)

## 1. Reformuler le symptôme

Écrire une phrase testable : « depuis le client `192.168.56.10`, le nom `www.fournil.lab` se résout mais la connexion TCP au port 80 échoue ». Éviter « Internet ne marche pas », trop vague pour orienter une recherche.

## 2. Vérifier du bas vers le haut

| Couche      | Question                                 | Exemples de preuves                       |
| ----------- | ---------------------------------------- | ----------------------------------------- |
| Hôte        | La machine fonctionne-t-elle ?           | `uptime`, console de la VM                |
| Interface   | Le lien et l'adresse sont-ils corrects ? | `ip -br link`, `ip -br address`           |
| Routage     | Existe-t-il un chemin vers la cible ?    | `ip route`, `ip route get IP`             |
| Résolution  | Le nom fournit-il la bonne adresse ?     | `dig`, `getent hosts NOM`                 |
| Transport   | Le port est-il en écoute et joignable ?  | `ss -lntup`, `nc -vz HOTE PORT`           |
| Service     | L'unité et le processus sont-ils sains ? | `systemctl status`, `ps`, `journalctl -u` |
| Application | La requête fonctionnelle aboutit-elle ?  | `curl -v`, `dig`, client IMAP/SMTP        |

## 3. Contrôler la configuration avant le redémarrage

Utiliser l'outil de validation propre au service lorsqu'il existe :

```bash
named-checkconf
apache2ctl configtest
sudo nft --check --file /etc/nftables.conf
postfix check
doveconf -n
```

Un `restart` n'est pas un outil de diagnostic. Il peut masquer temporairement une panne et interrompre les utilisateurs.

## 4. Corréler les preuves

Noter l'heure du test puis limiter les journaux à cette fenêtre :

```bash
date --iso-8601=seconds
sudo journalctl -u NOM.service --since "5 minutes ago" --no-pager
```

Une ligne de journal devient une preuve seulement si son heure, le service et le test correspondent.

## 5. Rétablir et rendre compte

Le compte rendu minimal contient :

```text
Symptôme :
Périmètre et impact :
Cause démontrée :
Correction appliquée :
Preuve de rétablissement :
Prévention proposée :
```

> [!TIP] Règle d'or
> Après chaque changement, rejouer exactement le test qui échouait. Un service « active (running) » n'est pas une preuve suffisante que l'application répond correctement.
