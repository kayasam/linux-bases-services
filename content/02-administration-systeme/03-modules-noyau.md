# 2.3 Modules noyau et pilotes

> [!TIP] Auto-évaluation
> [Mini-quiz interactif — 10 questions](https://kayasam.github.io/linux-bases-services/02-administration-systeme/mini-quiz?quiz=02-03-modules)

**Objectifs** : comprendre pourquoi le noyau Linux est modulaire, et savoir charger/décharger/paramétrer un module sans redémarrer.

> [!NOTE] Vocabulaire
> Le noyau Linux reste de conception monolithique, mais il accepte des **modules chargeables**. Certains pilotes sont compilés directement dans le noyau ; ils n'apparaissent donc pas nécessairement dans `lsmod` et ne peuvent pas être retirés à chaud.

### Le noyau Linux et ses modules

Historiquement, le noyau était un seul fichier binaire monolithique : ajouter un pilote nécessitait de le recompiler entièrement, puis de redémarrer.

Aujourd'hui le noyau est modulaire, pour deux raisons concrètes :

- on ne peut pas embarquer tous les pilotes possibles dans un seul fichier (ce serait énorme, et non bootable sur du matériel limité) ;
- un module peut être chargé/déchargé **à chaud**, sans redémarrage.

**Qu'est-ce qu'un module ?** Un fichier binaire (extension `.ko`, _kernel object_) contenant le code d'une fonctionnalité ou d'un pilote.

![Du module au périphérique utilisable](Ressources/images/modules-noyau.svg)

> [!TIP] Lecture du schéma
> `modprobe` ne charge pas un fichier au hasard : il tient compte de la version du noyau, des dépendances et des options persistantes avant que le pilote puisse prendre en charge le périphérique.

- Noyau : `/boot/vmlinuz-X.Y.Z-P...`
- Version du noyau courant : `uname -r`
- Modules disponibles : `/lib/modules/$(uname -r)`

### Commandes de gestion des modules

```bash
lsmod                          # Modules actuellement chargés en mémoire
sudo modinfo nom_du_module      # Informations sur un module (dont ses paramètres)

sudo rmmod nom_du_module        # Décharger (sans résolution des dépendances)
sudo modprobe -r nom_du_module  # Décharger le module + ses dépendances

sudo modprobe nom_du_module     # Charger un module
```

Exemple :

```bash
$ sudo modinfo e1000
filename:       /lib/modules/6.1.0-40-amd64/kernel/drivers/net/ethernet/intel/e1000/e1000.ko
license:        GPL v2
description:    Intel(R) PRO/1000 Network Driver
depends:
parm:           TxDescriptors:Number of transmit descriptors (array of int)
parm:           Speed:Speed setting (array of int)
```

> [!NOTE]
> Moyen mnémotechnique : `rmmod` = _remove module_ mais **ignore** les dépendances (risque d'erreur si un autre module en dépend) ; `modprobe -r` = même chose mais démonte proprement toute la chaîne de dépendances, comme un `apt remove` intelligent.

### Paramètres d'un module

`modinfo` donne la liste des éventuels paramètres. Initialisation ponctuelle, en ligne de commande :

```bash
sudo modprobe bonding miimon=100
```

_(Dans cet exemple, le pilote d'agrégation de liens réseau (channel bonding) est configuré pour vérifier que les liens sont actifs, via monitoring MII, toutes les 100 ms.)_

Initialisation automatique, à chaque chargement par le noyau (y compris au prochain boot) : un fichier dans `/etc/modprobe.d/`, par exemple `/etc/modprobe.d/bonding.conf` :

```text
options bonding miimon=100
```

Remarque : le nom du fichier importe peu, seule l'extension `.conf` compte.

---

### Chargement automatique, dépendances et blocage

`modprobe` s'appuie sur une base de dépendances générée par `depmod`. Il recherche dans le répertoire correspondant **exactement** au noyau courant :

```bash
uname -r
find /lib/modules/$(uname -r) -type f -name 'bonding.ko*'
modprobe --show-depends bonding
cat /proc/modules | head
```

Pour demander le chargement au démarrage, inscrire le nom du module dans un fichier de `/etc/modules-load.d/`. Pour empêcher le chargement automatique d'un pilote problématique, utiliser une règle `blacklist` dans `/etc/modprobe.d/` :

```text
# /etc/modules-load.d/bonding.conf
bonding

# /etc/modprobe.d/pilote-indesirable.conf
blacklist nom_du_module
```

> [!WARNING] Initramfs et modules précoces
> Un pilote nécessaire avant le montage de `/` peut être embarqué dans l'initramfs. Modifier `/etc/modprobe.d/` ne suffit alors pas toujours : il faut régénérer l'image avec `sudo update-initramfs -u`, puis tester prudemment au redémarrage.

### Diagnostic guidé

```bash
sudo modprobe -v nom_du_module       # affiche les actions réalisées
sudo journalctl -k --since "5 min ago"
sudo dmesg --level=err,warn
```

`FATAL: Module ... not found` indique souvent une incompatibilité entre la version du noyau démarré (`uname -r`) et les modules installés. `Module ... is in use` signifie qu'un périphérique ou un autre module dépend encore de lui : rechercher les dépendances avant toute tentative forcée.

> [!NOTE]
> **À retenir**
>
> - Un module (`.ko`) permet de charger/décharger un pilote sans redémarrer.
> - `modprobe` gère les dépendances, `rmmod`/`insmod` non.
> - Un paramètre passé en ligne de commande (`modprobe module param=valeur`) ne survit pas au reboot ; pour le rendre permanent, il faut un fichier `.conf` dans `/etc/modprobe.d/`.
