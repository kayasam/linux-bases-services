# Linux — Bases & Services

Site Quartz v5 du support de formation Linux destiné aux TSSR.

- Site publié : <https://kayasam.github.io/linux-bases-services/>
- Source pédagogique : `C:\Users\kayaw\Nextcloud\Obsidian\CoffreSam\Formations\linux-bases-services`
- Dépôt local : `D:\Projet-git\linux-bases-services`

## Préparer le contenu

```powershell
.\publier-les-cours.ps1 -PrepareOnly
```

## Tester localement

```powershell
npm ci
npm run install-plugins
npx quartz build --serve
```

## Publier

Lancer `Publier les cours.cmd`, ou :

```powershell
.\publier-les-cours.ps1 -Message "Mise à jour de la formation Linux"
```

Le script synchronise le coffre, vérifie le build, crée un commit après confirmation et pousse la branche `v5`.
