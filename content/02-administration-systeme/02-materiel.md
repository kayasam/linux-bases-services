# 2.2 Information sur le matériel

**Objectifs** : savoir identifier rapidement le matériel d'une machine Linux (CPU, PCI, USB, RAM, distribution) sans avoir à ouvrir le boîtier.

> [!NOTE] Compétence TSSR
> Un inventaire utile ne consiste pas à coller toute la sortie de `lshw`. Il doit répondre à une question : quel matériel est présent, quel pilote le prend en charge et quelle anomalie est visible ?

### Commandes incluses par défaut

```bash
lscpu                 # infos sur le processeur, notamment les vulnérabilités
lspci                  # liste des périphériques PCI (audio, réseau, stockage, ...)
lsusb                  # liste des périphériques USB
lsmem                  # liste les plages de RAM disponibles
lsb_release -a         # infos standardisées sur la distribution Linux
cat /etc/os-release    # infos standardisées sur la distribution Linux
```

Moyen mnémotechnique : la famille `ls*` (`lscpu`, `lspci`, `lsusb`, `lsmem`, `lsblk`...) liste toujours un type de ressource — seul le suffixe change selon ce qu'on veut inspecter.

`lsb_release` est issu du projet [Linux Standard Base](https://en.wikipedia.org/wiki/Linux_Standard_Base), abandonné depuis 2015 : `/etc/os-release`, maintenu par systemd, est aujourd'hui la source la plus fiable pour identifier une distribution dans un script.

### Aller plus loin : outils à installer

```bash
sudo apt install -y lshw hwloc
sudo lshw            # Inventaire matériel détaillé (arborescence complète)
lstopo --of ascii     # Topologie CPU/mémoire (utile en NUMA)

sudo apt install --no-install-recommends -y inxi
sudo inxi -b          # Résumé matériel condensé, lisible d'un coup d'œil
```

Pour aller plus loin sur `inxi` : [linuxtricks.fr](https://www.linuxtricks.fr/wiki/inxi-un-script-complet-d-informations-systeme)

```bash
# Disponible dans les dépôts seulement à partir de Debian 13
sudo apt install -y fastfetch
fastfetch
```

### Relier périphérique, pilote et interface

L'identification devient réellement utile lorsqu'on relie le composant physique au pilote chargé :

```bash
lspci -nnk                         # identifiants PCI + pilote utilisé/candidats
lsusb -t                           # arbre USB + driver associé
sudo lshw -class network           # cartes réseau, état et nom logique
ip -br link                        # interfaces créées dans le système
sudo ethtool -i enp0s8             # pilote et firmware d'une interface
dmesg --level=err,warn | tail -n 50
```

Exemple de raisonnement : la carte apparaît dans `lspci`, mais aucune interface correspondante n'existe dans `ip link`. Vérifier `lspci -nnk` : si la ligne `Kernel driver in use` manque, rechercher le module attendu, puis les erreurs de chargement dans `dmesg`.

### Distinguer matériel réel et ressources virtualisées

Dans une VM, les composants présentés à Linux sont souvent des périphériques virtuels (VirtIO, contrôleur Intel émulé, disque VDI), pas le matériel physique de l'hôte. Ces commandes aident à préciser le contexte :

```bash
systemd-detect-virt
hostnamectl
lsblk -o NAME,MODEL,SERIAL,SIZE,TYPE
```

> [!TIP] Trace d'intervention
> Conserver l'identifiant matériel (`lspci -nn` ou `lsusb`), le pilote (`lspci -k`) et l'erreur horodatée (`journalctl -k`). Ce triplet est bien plus exploitable qu'une capture d'écran de `fastfetch`.

Pour aller plus loin sur `fastfetch` : [github.com/fastfetch-cli/fastfetch](https://github.com/fastfetch-cli/fastfetch)

> [!NOTE]
> **À retenir** : pour un diagnostic rapide, `lscpu`/`lspci`/`lsusb` suffisent en dépannage express ; `lshw` et `inxi -b` donnent une vue d'ensemble utile en prise de poste sur une machine inconnue.
