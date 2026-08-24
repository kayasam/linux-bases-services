# Mode d'emploi — publication Linux Bases & Services

## Principe

Le coffre Obsidian reste la source principale :

`C:\Users\kayaw\Nextcloud\Obsidian\CoffreSam\Formations\linux-bases-services`

Le dépôt Quartz est généré ici :

`D:\Projet-git\linux-bases-services`

## Prévisualiser sans publier

```powershell
cd D:\Projet-git\linux-bases-services
.\publier-les-cours.ps1 -PrepareOnly
npx quartz build --serve
```

## Publier sur GitHub Pages

Double-cliquer sur `Publier les cours.cmd`, ou exécuter :

```powershell
.\publier-les-cours.ps1 -Message "Mise à jour des cours Linux"
```

Le script affiche les fichiers modifiés et demande une confirmation avant le commit et le push.

Site : <https://kayasam.github.io/linux-bases-services/>
