# 2.1 Démarrage du système : du boot à la connexion

> [!TIP] Auto-évaluation
> [Mini-quiz interactif — 10 questions](https://kayasam.github.io/linux-bases-services/02-administration-systeme/mini-quiz?quiz=02-01-demarrage)

**Objectifs** : situer les grandes étapes entre l'allumage de la machine et l'invite de connexion, et comprendre le rôle de l'initramfs.

![Séquence de démarrage Linux](Ressources/images/sequence-demarrage.svg)

> [!TIP] Lecture du schéma
> Une étape ne « démarre pas Linux toute seule » : elle remet à la suivante juste assez d'informations et de capacités. Identifier le dernier écran ou message réussi permet donc de réduire fortement le périmètre de recherche.

- **BIOS/UEFI** : initialise le strict minimum du matériel (indépendamment de tout OS) puis cherche un périphérique amorçable.
- **GRUB2** : le gestionnaire d'amorce. Il affiche éventuellement un menu (plusieurs noyaux, plusieurs OS), puis charge le noyau choisi avec ses options de démarrage.
- **Noyau + initramfs** : le noyau démarre, mais il ne sait pas encore parler à tout le matériel (disques, contrôleurs RAID, chiffrement...). Il charge donc d'abord un mini-système temporaire en RAM, l'**initramfs** (_initial RAM filesystem_), qui embarque juste assez de pilotes/modules pour pouvoir monter la vraie racine (`/`). Une fois `/` accessible, le noyau bascule dessus et l'initramfs est libéré.
- **init/systemd (PID 1)** : le tout premier processus, père de tous les autres. Il termine l'initialisation (heure, unités de stockage, montages, swap, consoles), active les services, puis rend possible la connexion (console ou interface graphique).

---

### Observer le démarrage et localiser une panne

```bash
cat /proc/cmdline                         # paramètres reçus par le noyau
uname -r                                  # noyau réellement démarré
systemd-analyze                           # durée globale firmware/loader/kernel/userspace
systemd-analyze blame                     # unités les plus longues (indication, pas preuve de cause)
systemd-analyze critical-chain            # chemin critique de dépendances
systemctl --failed                        # unités en échec
sudo journalctl -b -p warning             # avertissements du boot courant
sudo journalctl -b -1                     # journal du boot précédent
```

| Symptôme observable                    | Étape probablement concernée | Premier contrôle                         |
| -------------------------------------- | ---------------------------- | ---------------------------------------- |
| Aucun écran firmware                   | alimentation, VM ou firmware | console/hyperviseur                      |
| Menu GRUB absent ou erreur de chargeur | amorçage/partition EFI       | ordre de boot, partition EFI             |
| `Kernel panic` ou racine introuvable   | noyau, initramfs, stockage   | message exact, noyau précédent dans GRUB |
| Mode d'urgence après montage           | `/etc/fstab` ou FS           | `journalctl -xb`, `findmnt --verify`     |
| Invite disponible mais service absent  | unité systemd                | `systemctl --failed`, `journalctl -u`    |

> [!NOTE] Stratégie de récupération
> Ne pas modifier plusieurs couches à la fois. Photographier le message exact, tenter si possible le noyau précédent dans GRUB, démarrer en mode secours, puis corriger la cause démontrée. Régénérer l'initramfs (`update-initramfs -u`) ou GRUB (`update-grub`) uniquement si leur contenu est réellement en cause.

> [!NOTE]
> Moyen mnémotechnique : l'initramfs est une **échelle jetable** — elle sert juste à atteindre le vrai système de fichiers racine, puis elle est écartée. C'est pour ça qu'on la régénère (`update-initramfs`) après un changement de pilote de disque ou de configuration RAID/LVM/chiffrement : sans les bons modules dedans, le noyau ne peut plus monter `/` du tout.

> [!NOTE]
> **À retenir**
>
> - BIOS/UEFI -> GRUB2 -> noyau -> initramfs (pilotes minimaux) -> bascule sur la vraie racine -> PID 1 (systemd) -> services -> connexion.
> - L'initramfs existe parce que le noyau, seul, ne sait pas encore parler au disque qui contient le vrai système.
