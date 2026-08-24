# 1.1 Partitionnement natif et LVM

> [!TIP] Commandes interactives
> <a href="https://kayasam.github.io/linux-bases-services/01-stockage/commandes.html" target="_blank">Explorer les commandes de partitionnement et LVM</a>

**Objectifs** : savoir identifier les unités de stockage d'une machine, comprendre les limites du partitionnement classique, et découvrir LVM comme réponse à ces limites.

![Chaîne de stockage LVM](Ressources/images/chaine-stockage-lvm.svg)

> [!TIP] Lecture du schéma
> Chaque couche répond à une question différente : **où se trouve la capacité ?** (disque/PV), **dans quelle réserve est-elle réunie ?** (VG), **quelle part est fournie au serveur ?** (LV), **comment les fichiers sont-ils organisés ?** (FS), puis **où les utilisateurs y accèdent-ils ?** (point de montage). Un incident se diagnostique couche par couche.

---

### Nomenclature des unités de stockage

Sur Linux, tout est fichier — y compris le matériel, dont les unités de stockage (disque dur, SSD, ...). Les périphériques matériels (_devices_) apparaissent dans `/dev/`, avec un nom qui dépend de la connectique :

| Connectique           | Nom du device                 |
| --------------------- | ----------------------------- |
| IDE/PATA (historique) | `/dev/hd[a-z]+[1-9]+`         |
| SATA/SCSI/SAS         | `/dev/sd[a-z]+[1-9]+`         |
| NVMe                  | `/dev/nvme[0-9]+n[1-9]p[1-9]` |

```bash
$ lsblk
NAME   MAJ:MIN RM  SIZE RO TYPE MOUNTPOINTS
sda      8:0    0   30G  0 disk
├─sda1   8:1    0   29G  0 part /
├─sda2   8:2    0    1K  0 part
└─sda5   8:5    0  975M  0 part [SWAP]
sr0     11:0    1 1024M  0 rom

lsblk -f    # Ajoute l'info du système de fichiers
lsblk -p    # Ajoute le chemin absolu des unités
lsblk -s    # Inverse le sens de l'arborescence (part -> disk)
```

Moyen mnémotechnique : `lsblk` = _list block devices_ ; un "block device" est justement le nom technique d'une unité de stockage.

Pour aller plus loin : [What is a block device?](https://unix.stackexchange.com/questions/259193/what-is-a-block-device/259200#259200)

---

### Le partitionnement natif et ses limites

Découper un disque en partitions apporte plusieurs bénéfices : contrôler la saturation de l'espace disque, isoler les risques d'incohérence d'un système de fichiers à une seule partition, faire cohabiter plusieurs FS, et gérer des droits d'accès différents selon la zone du disque.

Deux façons de décrire ce découpage :

|                            | MBR (historique)                                          | GPT (moderne)                         |
| -------------------------- | --------------------------------------------------------- | ------------------------------------- |
| Emplacement                | 512 premiers octets du disque                             | Table dédiée, dupliquée               |
| Partitions primaires       | 4 maximum                                                 | Pas de vraie limite (128 en pratique) |
| Astuce si plus de 4        | Partition _étendue_ + logiques (numérotées à partir de 5) | Non nécessaire                        |
| Taille max d'une partition | 2 To                                                      | 9 Zo                                  |
| Boot associé               | BIOS                                                      | UEFI                                  |

Outils : `fdisk`, `cfdisk`, `parted`, `gparted`, ...

> [!WARNING]
> Le point faible du partitionnement classique n'est pas dans le tableau ci-dessus : une fois créée, **une partition a une taille figée**. Si `/var` se remplit alors qu'il reste 200 Go de libre sur `/home`, il n'y a pas de solution simple sans tout redimensionner "à la main" (et parfois sans coupure de service).

C'est exactement le problème que LVM a été conçu pour résoudre.

---

### LVM : ajouter un étage d'abstraction

**LVM** (_Logical Volume Manager_) insère une couche logique entre le disque physique et le système de fichiers, pour pouvoir réorganiser l'espace **sans redémarrer et sans tout recréer** :

- **Physical Volume (PV)** : un disque (ou une partition) mis à disposition de LVM
- **Volume Group (VG)** : le "pot commun" d'espace, alimenté par un ou plusieurs PV — on peut en ajouter/retirer à chaud
- **Logical Volume (LV)** : la brique qu'on utilise réellement, l'équivalent d'une partition, mais taillée dans le VG

Moyen mnémotechnique : le VG est la **réserve**, le LV est la **part qu'on en découpe**. Agrandir un LV ne fait que puiser un peu plus dans la réserve du VG.

---

### Mettre en place LVM

```bash
sudo apt update
sudo apt install -y lvm2
```

**Ajouter une unité de stockage à la VM** (VirtualBox) : Configuration > Stockage > contrôleur SATA > icône "disque dur avec un plus" > Créer (VDI, ~10 Go, décocher Pre-allocate Full Size) > attacher > démarrer la VM.

```bash
lsblk
# sdb apparaît, sans point de montage
```

> [!NOTE]
> Toutes les commandes LVM nécessitent les droits root :
>
> ```bash
> sudo -i
> # ou
> sudo --login
> ```

| Étage           | Commande de création              | Commandes de listing    |
| --------------- | --------------------------------- | ----------------------- |
| Physical Volume | `pvcreate /dev/sdb`               | `pvs`, `pvdisplay`      |
| Volume Group    | `vgcreate rootvg /dev/sdb`        | `vgs`, `vgdisplay`      |
| Logical Volume  | `lvcreate -n testlv -L 2G rootvg` | `lvs`, `lvdisplay [-m]` |

---

### Faire vivre un LV dans le temps

C'est là que LVM prend tout son sens : agrandir un VG (en lui donnant un nouveau disque), puis agrandir un LV dedans, se fait **à chaud**, sans démonter le disque d'origine.

`lvextend -r` va même plus loin : il redimensionne le LV **et** son système de fichiers en une seule commande (non pris en charge pour btrfs) :

```bash
lvextend -r -L 14G /dev/rootvg/testlv
```

Une réduction est beaucoup plus risquée qu'un agrandissement. Elle n'est possible que si le système de fichiers sait lui-même rétrécir ; **XFS ne le permet pas**. Il faut sauvegarder, vérifier le FS, connaître sa taille minimale et généralement le démonter avant d'agir. Exemple pédagogique avec ext4 seulement :

```bash
sudo umount /mnt/flexible_storage
sudo e2fsck -f /dev/rootvg/testlv
sudo lvreduce --resizefs --size -1G /dev/rootvg/testlv
sudo mount /mnt/flexible_storage
```

> [!WARNING] Risque de perte de données
> Ne jamais réduire « pour essayer ». Une taille cible inférieure aux données réellement occupées détruit le système de fichiers. En production, la stratégie la plus sûre reste souvent : nouveau LV plus petit, copie contrôlée, bascule du montage, puis suppression de l'ancien LV après validation.

---

### Méthode d'extension complète

Un LV plein n'indique pas forcément qu'il faut ajouter un disque. Observer d'abord chaque étage :

```bash
lsblk -f                         # périphériques, FS et montages
sudo pvs                        # capacité fournie par chaque PV
sudo vgs                        # espace libre dans le VG (VFree)
sudo lvs -o +devices            # LV et emplacement physique
df -hT /mnt/flexible_storage    # taille vue par le FS
```

Cas 1 — le VG possède encore de l'espace libre :

```bash
sudo lvextend --resizefs --size +2G /dev/rootvg/testlv
```

Cas 2 — le VG est plein : ajouter d'abord un PV, étendre le VG, puis le LV et son FS :

```bash
sudo pvcreate /dev/sdc
sudo vgextend rootvg /dev/sdc
sudo lvextend --resizefs --size +2G /dev/rootvg/testlv
```

> [!NOTE] Point TSSR
> `df` mesure l'espace du système de fichiers ; `du` additionne les fichiers visibles ; `vgs` mesure la réserve LVM. Ces trois valeurs peuvent légitimement différer. Il faut annoncer la couche observée avant d'interpréter un chiffre.

> [!NOTE]
> **À retenir**
>
> - Une partition classique a une taille figée à la création ; LVM ajoute un étage (PV -> VG -> LV) pour redimensionner à chaud.
> - Le VG est le pot commun, le LV est la part qu'on en découpe pour un usage donné.
> - `lvextend -r` / `lvreduce -r` redimensionnent le LV et son FS en une seule commande.

---

### Bonus : attributs LVM

Pour aller plus loin :

- ["Exploring LVM: Learn About Common PV, LV, and VG Attributes" sur Kifarunix.com](https://kifarunix.com/learn-about-common-pv-lv-and-vg-attributes-lvm-attributes/)
- [man page `pvs`, section NOTES](https://manpages.debian.org/bookworm/lvm2/pvs.8.en.html#NOTES)
- [man page `vgs`, section NOTES](https://manpages.debian.org/bookworm/lvm2/vgs.8.en.html#NOTES)
- [man page `lvs`, section NOTES](https://manpages.debian.org/bookworm/lvm2/lvs.8.en.html#NOTES)
