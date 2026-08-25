# 1.2 Systèmes de fichiers

**Objectifs** : choisir un système de fichiers adapté à un usage, savoir le créer, le monter (temporairement et de façon persistante), et le redimensionner.

![Montage temporaire et persistant](Ressources/images/montage-fstab.svg)

> [!TIP] Lecture du schéma
> Le point de montage n'est pas le disque : c'est un dossier de l'arborescence qui devient une porte d'entrée vers le FS. Si ce dossier contenait déjà des fichiers, ils sont masqués pendant le montage, pas supprimés.

---

### Rôle d'un système de fichiers

Un système de fichiers (File System, FS) est la couche qui organise réellement les données sur l'espace de stockage : où commence/finit chaque fichier, ses méta-données (propriétaire, droits, dates), la gestion de la fragmentation, et la journalisation (pour limiter la casse en cas de coupure électrique).

Un LV (ou une partition) sans FS n'est qu'un espace brut inutilisable : c'est `mkfs` qui y écrit cette structure.

| FS         | Type               | Taille FS max | Taille fichier max | Usage typique                              |
| ---------- | ------------------ | ------------- | ------------------ | ------------------------------------------ |
| ext4       | natif              | 1 Eo          | 16 To              | Cas général, le plus répandu               |
| xfs        | natif              | 18 Eo         | 9 Eo               | Gros serveurs de stockage, défaut sur RHEL |
| btrfs      | natif              | —             | —                  | Snapshots et autres fonctions avancées     |
| zfs        | natif (hors noyau) | —             | —                  | RAID-Z, très utilisé sous Proxmox          |
| ntfs       | non-natif          | —             | —                  | Windows (lecture/écriture si arrêt propre) |
| vfat/fat32 | non-natif          | 16 To         | 4 Go               | Windows, clés USB anciennes                |
| exfat      | non-natif          | 64 Zo         | 16 Eo              | Successeur du fat32                        |

Rappel des multiples d'octets : ko, Mo, Go, To, Po (péta), Eo (exa), Zo (zetta).

---

### Créer un FS

```bash
# ext4 sur un LV
mkfs -t ext4 /dev/rootvg/testlv

# xfs (paquet xfsprogs pas toujours installé par défaut)
apt install -y xfsprogs
lvcreate -n test2lv -L 5G rootvg
mkfs -t xfs /dev/rootvg/test2lv
```

---

### Monter un FS : de la commande au fichier `/etc/fstab`

Le montage est l'opération qui relie un FS existant à un point de l'arborescence (un dossier), pour pouvoir y accéder :

```bash
mkdir /mnt/flexible_storage
mount [options] /dev/rootvg/testlv /mnt/flexible_storage/
```

`mount` sans argument liste les montages courants.

> [!WARNING]
> Un montage fait à la main avec `mount` **ne survit pas à un redémarrage**. Pour qu'il soit rechargé automatiquement au boot, il faut le déclarer dans `/etc/fstab` — c'est ce fichier que systemd lit pour générer les montages au démarrage.

Exemple de `/etc/fstab` :

```bash
# /etc/fstab: static file system information.
#
# Use 'blkid' to print the universally unique identifier for a
# device; this may be used with UUID= as a more robust way to name devices
# that works even if disks are added and removed. See fstab(5).
#
# <file system> <mount point>   <type>  <options>       <dump>  <pass>
UUID=f0b37be0-5edd-462c-85fc-c8bdb438fbe4 /               ext4    errors=remount-ro 0       1
UUID=30323cde-3f49-447a-8497-90b7f287cb43 none            swap    sw              0       0
/dev/sr0        /media/cdrom0   udf,iso9660 user,noauto     0       0
/dev/rootvg/testlv /mnt/flexible_storage auto defaults
```

**Pourquoi des UUID et pas `/dev/sdX` ?** Les noms `/dev/sd[a-z]+` sont attribués selon l'ordre de détection au boot (branchement, port SATA, ...) : ils peuvent changer d'un démarrage à l'autre. L'UUID, lui, est attaché au système de fichiers lui-même (obtenu par `blkid`) et reste stable — sauf si on recrée un FS sur le même périphérique, auquel cas il faut adapter `/etc/fstab` en conséquence.

Avec LVM, ce problème ne se pose pas : le chemin `/dev/VG/LV` ne dépend d'aucun ordre d'initialisation, donc pas besoin d'UUID.

Appliquer un montage tout juste ajouté à `/etc/fstab` :

```bash
sudo findmnt --verify             # vérifie la syntaxe et les références
sudo systemctl daemon-reload     # fait relire les unités générées depuis fstab
sudo mount -a                    # tente les montages non encore actifs
findmnt /mnt/flexible_storage    # prouve le résultat
```

> [!WARNING] Éviter un démarrage bloqué
> Tester `fstab` avant de redémarrer. Une faute de chemin, de type ou d'UUID peut placer la machine en mode d'urgence. Pour un volume non indispensable au boot, l'option `nofail` permet de poursuivre le démarrage si le périphérique manque ; `x-systemd.device-timeout=5s` limite l'attente.

Exemple robuste pour un disque de données non critique :

```text
UUID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx /srv/data ext4 defaults,nofail,x-systemd.device-timeout=5s 0 2
```

---

### Redimensionner un FS

La commande dépend du FS :

| FS    | Commande                  | Remarque                       |
| ----- | ------------------------- | ------------------------------ |
| ext4  | `resize2fs`               | Peut agrandir et réduire       |
| xfs   | `xfs_growfs`              | ⚠️ Ne peut **pas** être réduit |
| btrfs | `btrfs filesystem resize` | Peut agrandir et réduire       |

**Bonus** : gérer le pourcentage de blocs réservés à root (ext4) :

```bash
sudo tune2fs -m 2 /dev/rootvg/testlv    # 5% (défaut) -> 2%
```

---

### Contrôler et dépanner un montage

```bash
blkid                              # UUID et type détectés
findmnt --target /srv/data         # source réellement montée ici
findmnt --source /dev/rootvg/testlv
df -hT /srv/data                   # occupation du FS monté
sudo lsof +f -- /srv/data          # processus empêchant un démontage
sudo journalctl -b -u local-fs.target
```

`umount: target is busy` signifie qu'un processus utilise encore un fichier ou possède son répertoire courant dans le montage. Il faut identifier ce processus, terminer proprement son activité, puis recommencer ; `umount -f` n'est pas le premier réflexe.

> [!NOTE] Les six champs de `fstab`
> `source`, `point de montage`, `type`, `options`, `dump`, `pass`. Pour ext4, `pass=1` est réservé à la racine et `pass=2` aux autres FS contrôlés au démarrage. `0` désactive ce contrôle automatique.

> [!NOTE]
> **À retenir**
>
> - Un FS organise réellement les données ; `mkfs` l'écrit sur un LV ou une partition vide.
> - `mount` est temporaire, `/etc/fstab` est permanent (relu au boot).
> - Préférer les UUID aux noms `/dev/sdX` dans `/etc/fstab`, sauf avec LVM où le chemin `/dev/VG/LV` est déjà stable.
> - `resize2fs`/`xfs_growfs`/`btrfs filesystem resize` : la commande de redimensionnement dépend du FS, pas seulement de LVM.
