# TP 1 — Gestion du stockage

> [!TIP] Ressource du TP
>
> - <a href="https://kayasam.github.io/linux-bases-services/telechargements/01-stockage/tp/01-stockage.md" download>Télécharger ce TP en Markdown</a>

> Chapitres associés : `1.1 Partitionnement natif et LVM/Cours.md` et `1.2 Systemes de fichiers/Cours.md`
>
> Durée estimée : 1 h 45 — travail individuel, VM avec instantané et disque supplémentaire

> [!WARNING] Avant de commencer
> Identifier formellement le disque ajouté avec `lsblk`. Une commande LVM ou `mkfs` appliquée au mauvais périphérique détruit ses données.

---

### Micro-TP 1.a — LVM

_**Consigne**_ : comprendre le résultat désiré de la commande ci-dessous, puis résoudre le problème d'espace qui empêche la commande de réussir.

    lvextend -L 12G /dev/rootvg/testlv

<details>
<summary>Clique ici pour un indice sur le résultat désiré</summary>
Étant donné les commandes lvcreate, lvdisplay et leurs effets, le nom de la commande lvextend devrait vous donner une idée de ses effets. Sinon, lire man lvextend.
</details>
<br />

<details>
<summary>Clique ici pour un indice sur la résolution du problème d'espace</summary>
Dans VirtualBox, ajouter un disque dur de 10Gio (par exemple) à votre VM et l'intégrer au volume group rootvg (avec notamment les commandes pvcreate et vgextend).
</details>
<br />

**Consignes bonus** (pour les personnes qui ont fini en avance) :

1. Cherchez quelle commande permet de formater une partition ou un LV en ext4.
2. Renseignez-vous sur le rôle du fichier `/etc/fstab`.

---

### Micro-TP 1.b — Redimensionnement de LV et de FS

1. Agrandir le FS `testlv` de 1Gio
    <details>
    <summary>Clique ici pour un indice</summary>
    Il faut augmenter de 1Gio la taille du LV et du FS. lvextend -L peut prendre des valeurs relatives comme -1G ou +2G. Sans autre argument que le chemin d'une unité de stockage, resize2fs redimensionnera automatiquement le FS pour prendre tout l'espace disponible.
    </details>
2. Réduire ce même FS à sa taille minimale (= taille suffisante pour contenir les données déjà présentes)
   - Créer d'abord un fichier arbitraire de 2Gio pour rendre l'exemple parlant : `fallocate -l 2G /mnt/flexible_storage/dummy_file`
    <details>
    <summary>Clique ici pour un indice</summary>
    Il faut démonter le LV, vérifier le système de données avec e2fsck, et redimensionner le FS (voir l'option -M dans le man de resize2fs).
    </details>
3. Re-agrandir le FS pour qu'il utilise tout l'espace de `testlv`
    <details>
    <summary>Clique ici pour un indice</summary>
    Utiliser resize2fs en spécifiant explicitement une taille correspondant à l'espace disponible sur testlv, en 2e argument.
    </details>

> [!NOTE] Correction formateur`n> La correction détaillée est conservée dans le coffre pédagogique.

---

### Défi de diagnostic et validation

Après avoir rendu le montage persistant, provoquer volontairement **une seule** faute dans la ligne correspondante de `/etc/fstab` (UUID, type ou point de montage). Sans redémarrer :

1. détecter l'erreur avec un outil de validation ;
2. relever le message exact ;
3. corriger puis appliquer les montages ;
4. prouver la taille du LV, le type du FS et le point réellement monté.

Livrable : un court compte rendu contenant les sorties utiles de `pvs`, `vgs`, `lvs`, `findmnt` et `df -hT`, puis une phrase expliquant pourquoi ces commandes ne mesurent pas toutes la même couche.

Critères de réussite : le montage survit à un redémarrage, aucune erreur n'apparaît dans `findmnt --verify`, et un fichier témoin reste accessible après le reboot.
