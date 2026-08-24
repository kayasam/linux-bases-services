# TP 1 — Gestion du stockage

> [!TIP] Ressource du TP
>
> - <a href="https://kayasam.github.io/linux-bases-services/telechargements/01-stockage/tp/01-stockage.md" download>Télécharger ce TP en Markdown</a>

> Chapitres associés : [partitionnement et LVM](01-stockage/01-partitionnement-lvm) et [systèmes de fichiers](01-stockage/02-systemes-de-fichiers)
>
> Durée estimée : 1 h 45 — travail individuel, VM avec instantané et disque supplémentaire

> [!WARNING] Avant de commencer
> Identifier formellement le disque ajouté avec `lsblk`. Une commande LVM ou `mkfs` appliquée au mauvais périphérique détruit ses données.

> [!SUCCESS] Procédure vérifiée
> Le scénario a été rejoué avec deux disques de laboratoire, un LV ext4, une extension en ligne, une réduction hors ligne et un remontage via `fstab`. La réduction décrite ci-dessous concerne **ext4 uniquement** ; XFS ne sait pas rétrécir.

### État initial à relever

Avant toute modification, produire cette photographie et faire valider le périphérique qui sera utilisé :

```bash
lsblk -f
sudo pvs
sudo vgs
sudo lvs -o +devices
findmnt /mnt/flexible_storage
df -hT /mnt/flexible_storage
```

Le laboratoire doit déjà contenir `/dev/rootvg/testlv`, formaté en ext4 et monté sur `/mnt/flexible_storage`. Adapter les noms si votre VM utilise un autre VG ou LV ; ne jamais recopier un chemin sans le vérifier.

---

### Micro-TP 1.a — LVM

_**Consigne**_ : comprendre le résultat désiré de la commande ci-dessous, puis résoudre le problème d'espace qui empêche la commande de réussir.

    lvextend -L 12G /dev/rootvg/testlv

<details>
<summary>Clique ici pour un indice sur le résultat désiré</summary>
Étant donné les commandes lvcreate, lvdisplay et leurs effets, le nom de la commande lvextend devrait vous donner une idée de ses effets. Sinon, lire man lvextend.

`-L 12G` fixe une **taille finale absolue** de 12 Gio. `-L +12G` ajouterait 12 Gio à la taille actuelle : ce n'est pas la même opération.
</details>
<br />

<details>
<summary>Clique ici pour un indice sur la résolution du problème d'espace</summary>
Dans VirtualBox, ajouter un disque dur de 10 Gio à la VM. Après avoir confirmé son nom avec `lsblk`, l'initialiser avec `pvcreate`, l'ajouter à `rootvg` avec `vgextend`, puis vérifier `VFree` avec `vgs` avant de relancer l'extension.
</details>
<br />

**Consignes bonus** (pour les personnes qui ont fini en avance) :

1. Cherchez quelle commande permet de formater une partition ou un LV en ext4.
2. Renseignez-vous sur le rôle du fichier `/etc/fstab`.

---

### Micro-TP 1.b — Redimensionnement de LV et de FS

1. Agrandir le LV `testlv` de 1 Gio, puis agrandir son FS ext4 pour utiliser ce nouvel espace.
    <details>
    <summary>Clique ici pour un indice</summary>
    Utiliser une valeur relative positive, par exemple `lvextend -L +1G /dev/rootvg/testlv`, puis `resize2fs /dev/rootvg/testlv`. L'option plus sûre `lvextend -r -L +1G ...` réalise les deux opérations si le FS est pris en charge.
    </details>
2. Réduire ce même FS à sa taille minimale (= taille suffisante pour contenir les données déjà présentes)
   - Créer d'abord un fichier arbitraire de 2Gio pour rendre l'exemple parlant : `fallocate -l 2G /mnt/flexible_storage/dummy_file`
    <details>
    <summary>Clique ici pour un indice</summary>
    Sauvegarder les données, démonter le FS, exécuter `e2fsck -f`, puis utiliser `resize2fs -M`. Cette étape réduit le **FS**, pas encore le LV qui le contient. Ne jamais appliquer cette procédure à XFS.
    </details>
3. Re-agrandir le FS pour qu'il utilise tout l'espace de `testlv`
    <details>
    <summary>Clique ici pour un indice</summary>
    Exécuter `resize2fs /dev/rootvg/testlv` sans taille : ext4 reprend alors automatiquement toute la capacité disponible dans le LV.
    </details>

> [!NOTE] Correction formateur
> La correction détaillée est conservée dans le coffre pédagogique.

---

### Défi de diagnostic et validation

Après avoir rendu le montage persistant, provoquer volontairement **une seule** faute dans la ligne correspondante de `/etc/fstab` (UUID, type ou point de montage). Sans redémarrer :

1. détecter l'erreur avec un outil de validation ;
2. relever le message exact ;
3. corriger puis appliquer les montages ;
4. prouver la taille du LV, le type du FS et le point réellement monté.

Avant la faute, sauvegarder le fichier et vérifier qu'une console de secours est disponible :

```bash
sudo cp -a /etc/fstab /etc/fstab.avant-tp
sudo systemctl daemon-reload
sudo findmnt --verify
sudo mount -a
findmnt /mnt/flexible_storage
```

Sur les versions récentes de systemd, `findmnt --verify` peut signaler que `fstab` a changé si `daemon-reload` n'a pas encore été exécuté. Ce message n'est pas une erreur de syntaxe, mais il doit disparaître après le rechargement.

Livrable : un court compte rendu contenant les sorties utiles de `pvs`, `vgs`, `lvs`, `findmnt` et `df -hT`, puis une phrase expliquant pourquoi ces commandes ne mesurent pas toutes la même couche.

Critères de réussite : le montage survit à un redémarrage, aucune erreur n'apparaît dans `findmnt --verify`, et un fichier témoin reste accessible après le reboot.
