# Linux Administration : Bases + Services - s35 2026

> [name=Samuel GUILLARD <sguillard@dawan.fr>] basé sur les formations de Hughes BIGO, Bruno GUÉRIN, Bastien TRAVERSE, Antoine RAULT
> [time=24 aout 2026]

> [!NOTE] Fil conducteur pédagogique
> Utiliser la [fiche de diagnostic TSSR](Ressources/fiche-diagnostic-tssr). Toute la semaine, le même laboratoire est enrichi puis dépanné couche par couche.

![Architecture du laboratoire](Ressources/images/architecture-laboratoire.svg)

## Liens/informations pratiques

Lien visio : https://teams.microsoft.com/meet/323025873044546?p=3Ydx9Q2n73utCVw7ez

OVA Debian 12 : https://fromsmash.com/deby-12_s35-2026.ova (~500 Mio)

---

## Administratif

À remplir sur [moncompte.dawan.fr](https://moncompte.dawan.fr) :

- Besoin/Attentes
- Niveau d'entrée
- Émargement chaque demi-journée
  - :warning: Par ex : le matin, signer uniquement pour la matinée et attendre le retour de pause déjeuner pour signer pour l'après-midi
- Évaluation
- Niveau de sortie

Horaires de la formation :

- Lundi : 9h30-12h30, 13h30-17h30
- Mardi à vendredi : 9h00-12h30, 13h30-17h00
- 1 pause de 15 min le matin et 1 pause de 15 min l'après-midi

**Règles de vie pendant la formation**

- Aucun jugement. On est là pour apprendre.
- La seule mauvaise question est celle qui n'est pas posée :-)
- N'hésitez pas à m'interrompre si je vais trop vite
- Activez votre webcam, sauf si problèmes de bande-passante
- Faites attention aux bruits parasites. Si nécessaire, coupez votre micro quand vous n'avez pas besoin de parler.
- Conseil : téléphone en silencieux et rangé, sauf impératifs pro/perso
- Si vous devez vous absenter pendant la formation, dites-le moi dès que vous le savez
  - Si c'est une courte absence, écrivez juste "afk" dans le tchat de la visio, puis "re" à votre retour

---

## Objectifs de la formation

- Connaître les bases de l'administration Linux : stockage, gestion des processus/services, journaux/logs, observation des performances, tâches planifiées
- Connaître la configuration de base des services suivants :
  - serveur DNS (BIND9)
  - serveur web/pile LAMP (Apache + MariaDB + PHP)
  - pare-feu (nftables)
  - serveur mail local (Postfix + Dovecot + Rainloop)

Services choisis :

- DNS :white_check_mark:
- Web :white_check_mark:
- Mail :white_check_mark:
- Pare-feu :white_check_mark:

---

## Mise en place de l'infrastructure

1. VirtualBox >= 7.2.x

2. Configurer le réseau de VirtualBox
   Dans le Network Manager de VirtualBox (Outils > Réseau), onglet Host-only Networks, sélectionner l'adapter :
   - **vboxnet0** (si hôte sous Linux)
   - **"VirtualBox Host-Only Ethernet Adapter"** (si hôte sous Windows)
   * Onglet Adapter
     - Cocher Configurer la carte manuellement
     - Adresse IPv4 : 192.168.56.1
     - Masque réseau IPv4 : 255.255.255.0
   * Onglet Serveur DHCP
     - Cocher Activer le serveur
     - Adresse du serveur : 192.168.56.254
     - Masque serveur : 255.255.255.0
     - Limite inférieure des adresses : 192.168.56.100
     - Limite supérieure des adresses : 192.168.56.199

3. Créer une VM, à partir de l'OVA (Fichier > Importer un appareil virtuel)
   Modifier/vérifier ces paramètres :
   - Nom : deby-s35-2026
   - CPU : 1
   - RAM : 512 Mo

4. Changer la configuration de la 2e carte réseau de la VM
   Bouton Configuration > (si besoin, passer en mode Expert la boîte de dialogue de configuration) > section Réseau, onglet Adapter 2 :
   - Cocher Activer l'interface réseau
   - Mode d'accès réseau : Réseau privé hôte
   - Name : vboxnet0 (ou "VirtualBox Host-Only Ethernet Adapter")
     - Important : même si le bon adapter semble déjà sélectionné, il faut ouvrir le menu déroulant et (re-)sélectionner le bon adapter, pour qu'il soit réellement pris en compte

5. Démarrer la VM en mode détachable (via le menu déroulant du bouton Démarrer)

6. Se connecter en tant que root
   Identifiants :
   - root/azerty (ne peut pas se connecter en SSH avec mot de passe)
   - stagiaire/azerty

```bash
# Afficher les cartes réseau et leur adresses IP (affichage en couleur et format bref)
ip -c -br address
# Formes abbréviées équivalentes :
ip -c -br addr
ip -c -br a
```

7. Activer l'interface réseau `enp0s8` (carte réseau Adapter 2 dans VBox) avec l'adresse 192.168.56.200

> [!NOTE]
> Le service `networking` est capricieux. Il faut systématiquement faire les actions dans cet ordre :
>
> 1. `ifdown IDENTIFIANT_DE_CARTE_RÉSEAU`
> 2. modifier le fichier `/etc/network/interfaces`
> 3. `ifup IDENTIFIANT_DE_CARTE_RÉSEAU`
>
> Si vous ne le faites pas dans cet ordre, le service `networking` risque de faire des messages d'erreur intempestifs (alors qu'il fonctionne correctement en réalité).

```bash
# Déconfigurer l'interface enp0s8
ifdown enp0s8

# Passer l'interface enp0s8 en adresse IP statique
tee -a /etc/network/interfaces << 'EOF'
auto enp0s8
iface enp0s8 inet static
        address 192.168.56.200/24
EOF

# Réactiver l'interface enp0s8 avec la nouvelle configuration
ifup enp0s8

# Vérification de la config de enp0s8
ip -c -br a
# résultat attendu : enp0s8           UP             192.168.56.200/24 ...
```

8. Vérifier que vous pouvez vous connecter en SSH à la VM, depuis votre machine hôte

```bash
ssh stagiaire@192.168.56.200
```

> [!NOTE]
> **Terminal et commandes `ssh` sous Windows**
>
> - Utiliser un terminal moderne : [Windows Terminal](https://apps.microsoft.com/detail/9n0dx20hk701), [MobaXterm](https://mobaxterm.mobatek.net/), le terminal PowerShell
>   - Éviter le _Command Prompt_ (obsolète) ou PuTTY
> - Client OpenSSH inclus et activé par défaut dans Windows : [https://learn.microsoft.com/fr-fr/windows/terminal/tutorials/ssh](https://learn.microsoft.com/fr-fr/windows/terminal/tutorials/ssh)

9. Fermer la fenêtre de la VM > dans la boîte de dialogue, sélectionner Continuer l'exécution en tâche de fond > OK

**Remarque** : conserver le fichier OVA, on créera d'autres VMs à partir de la même OVA plus tard.
