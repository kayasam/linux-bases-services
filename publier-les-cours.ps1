param(
  [string]$Message,
  [switch]$PrepareOnly
)

$ErrorActionPreference = "Stop"

$sourceRoot = "C:\Users\kayaw\Nextcloud\Obsidian\CoffreSam\Formations\linux-bases-services"
$projectRoot = "D:\Projet-git\linux-bases-services"
$staticRoot = Join-Path $projectRoot "site-content"
$stageRoot = Join-Path $projectRoot ".publication-stage"
$destinationContent = Join-Path $projectRoot "content"
$stageImages = Join-Path $stageRoot "Ressources\images"
$utf8WithoutBom = [Text.UTF8Encoding]::new($false)

function Assert-Directory {
  param([string]$Path, [string]$Description)
  if (-not (Test-Path -LiteralPath $Path -PathType Container)) {
    throw "$Description introuvable : $Path"
  }
}

function Assert-File {
  param([string]$Path, [string]$Description)
  if (-not (Test-Path -LiteralPath $Path -PathType Leaf)) {
    throw "$Description introuvable : $Path"
  }
}

function Assert-InProject {
  param([string]$Path)
  $fullPath = [IO.Path]::GetFullPath($Path)
  $fullProject = [IO.Path]::GetFullPath($projectRoot)
  if (-not $fullPath.StartsWith($fullProject + [IO.Path]::DirectorySeparatorChar, [StringComparison]::OrdinalIgnoreCase)) {
    throw "Chemin hors du projet refusé : $fullPath"
  }
}

function Copy-MirroredDirectory {
  param([string]$Source, [string]$Destination)
  Assert-InProject -Path $Destination
  New-Item -ItemType Directory -Path $Destination -Force | Out-Null
  & robocopy $Source $Destination /MIR /R:2 /W:1 /NFL /NDL /NJH /NJS /NP
  if ($LASTEXITCODE -ge 8) {
    throw "La copie de $Source a échoué avec le code Robocopy $LASTEXITCODE."
  }
}

function Copy-PublishedFile {
  param([string]$SourceRelative, [string]$DestinationRelative)
  $source = Join-Path $sourceRoot $SourceRelative
  $destination = Join-Path $stageRoot $DestinationRelative
  Assert-File -Path $source -Description "Fichier pédagogique"
  Assert-InProject -Path $destination
  New-Item -ItemType Directory -Path (Split-Path -Parent $destination) -Force | Out-Null
  Copy-Item -LiteralPath $source -Destination $destination -Force
}

Write-Host ""
Write-Host "Publication de Linux — Bases & Services" -ForegroundColor Cyan
Write-Host "=======================================" -ForegroundColor Cyan

Assert-Directory -Path $sourceRoot -Description "La formation source"
Assert-Directory -Path (Join-Path $sourceRoot "assets") -Description "Le dossier des schémas SVG"
Assert-Directory -Path $staticRoot -Description "Les pages statiques du site"
Assert-Directory -Path (Join-Path $projectRoot ".git") -Description "Le dépôt Git"

if (Test-Path -LiteralPath $stageRoot) {
  Assert-InProject -Path $stageRoot
  Remove-Item -LiteralPath $stageRoot -Recurse -Force
}

Write-Host "1/5 - Préparation de la structure du site..."
Copy-MirroredDirectory -Source $staticRoot -Destination $stageRoot

$courseMappings = @(
  @{ Source = "0 - Administratif et mise en place\Cours.md"; Destination = "00-mise-en-place\cours.md" },
  @{ Source = "1 - Gestion du stockage\1.1 Partitionnement natif et LVM\Cours.md"; Destination = "01-stockage\01-partitionnement-lvm.md" },
  @{ Source = "1 - Gestion du stockage\1.2 Systemes de fichiers\Cours.md"; Destination = "01-stockage\02-systemes-de-fichiers.md" },
  @{ Source = "1 - Gestion du stockage\TP.md"; Destination = "01-stockage\tp\01-stockage.md" },
  @{ Source = "2 - Administration systeme - l'interieur du systeme\2.1 Demarrage du systeme\Cours.md"; Destination = "02-administration-systeme\01-demarrage.md" },
  @{ Source = "2 - Administration systeme - l'interieur du systeme\2.2 Information sur le materiel\Cours.md"; Destination = "02-administration-systeme\02-materiel.md" },
  @{ Source = "2 - Administration systeme - l'interieur du systeme\2.3 Modules noyau et pilotes\Cours.md"; Destination = "02-administration-systeme\03-modules-noyau.md" },
  @{ Source = "2 - Administration systeme - l'interieur du systeme\2.4 Gestion des processus\Cours.md"; Destination = "02-administration-systeme\04-processus.md" },
  @{ Source = "2 - Administration systeme - l'interieur du systeme\2.4 Gestion des processus\TP.md"; Destination = "02-administration-systeme\tp\04-processus.md" },
  @{ Source = "2 - Administration systeme - l'interieur du systeme\2.5 Gestion des services (systemd)\Cours.md"; Destination = "02-administration-systeme\05-systemd.md" },
  @{ Source = "2 - Administration systeme - l'interieur du systeme\2.5 Gestion des services (systemd)\TP.md"; Destination = "02-administration-systeme\tp\05-systemd.md" },
  @{ Source = "2 - Administration systeme - l'interieur du systeme\2.6 Journalisation et logs\Cours.md"; Destination = "02-administration-systeme\06-journalisation.md" },
  @{ Source = "2 - Administration systeme - l'interieur du systeme\2.6 Journalisation et logs\TP.md"; Destination = "02-administration-systeme\tp\06-journalisation.md" },
  @{ Source = "2 - Administration systeme - l'interieur du systeme\2.7 Observation des performances\Cours.md"; Destination = "02-administration-systeme\07-performances.md" },
  @{ Source = "2 - Administration systeme - l'interieur du systeme\2.7 Observation des performances\TP.md"; Destination = "02-administration-systeme\tp\07-performances.md" },
  @{ Source = "2 - Administration systeme - l'interieur du systeme\2.8 Taches planifiees\Cours.md"; Destination = "02-administration-systeme\08-taches-planifiees.md" },
  @{ Source = "2 - Administration systeme - l'interieur du systeme\2.8 Taches planifiees\TP.md"; Destination = "02-administration-systeme\tp\08-taches-planifiees.md" },
  @{ Source = "3 - Service DNS (BIND9)\Cours.md"; Destination = "03-dns-bind9\cours.md" },
  @{ Source = "3 - Service DNS (BIND9)\TP.md"; Destination = "03-dns-bind9\tp\03-dns.md" },
  @{ Source = "4 - Service Web - pile LAMP\Cours.md"; Destination = "04-serveur-web-lamp\cours.md" },
  @{ Source = "4 - Service Web - pile LAMP\TP.md"; Destination = "04-serveur-web-lamp\tp\04-lamp.md" },
  @{ Source = "5 - Pare-feu nftables\Cours.md"; Destination = "05-pare-feu-nftables\cours.md" },
  @{ Source = "5 - Pare-feu nftables\TP.md"; Destination = "05-pare-feu-nftables\tp\05-nftables.md" },
  @{ Source = "6 - Service mail - Postfix Dovecot Rainloop\Cours.md"; Destination = "06-messagerie\cours.md" },
  @{ Source = "6 - Service mail - Postfix Dovecot Rainloop\TP.md"; Destination = "06-messagerie\tp\06-messagerie.md" },
  @{ Source = "guide-formateur.md"; Destination = "Ressources\guide-formateur.md" },
  @{ Source = "Ressources\fiche-diagnostic-tssr.md"; Destination = "Ressources\fiche-diagnostic-tssr.md" }
)

Write-Host "2/5 - Copie des cours, TP et ressources publiques..."
foreach ($mapping in $courseMappings) {
  Copy-PublishedFile -SourceRelative $mapping.Source -DestinationRelative $mapping.Destination
}
Copy-MirroredDirectory -Source (Join-Path $sourceRoot "assets") -Destination $stageImages

Write-Host "3/5 - Adaptation des liens et ajout des téléchargements..."
Get-ChildItem -LiteralPath $stageRoot -Recurse -File -Filter "*.md" | ForEach-Object {
  $markdownFile = $_
  $original = [IO.File]::ReadAllText($markdownFile.FullName)
  $updated = $original

  $updated = [regex]::Replace(
    $updated,
    '(?<=\]\()(?:(?:\.\./)+)?assets/',
    'Ressources/images/'
  )

  $updated = $updated.Replace('../guide-formateur.md', 'Ressources/guide-formateur')
  $updated = $updated.Replace('../Ressources/fiche-diagnostic-tssr.md', 'Ressources/fiche-diagnostic-tssr')

  $updated = [regex]::Replace(
    $updated,
    '(?m)^\*\*Correction\*\*\s*:\s*voir\s+`Correction\.md`.*$',
    '> [!NOTE] Correction formateur`n> La correction détaillée est conservée dans le coffre pédagogique.'
  )

  $relativeMarkdownPath = [IO.Path]::GetRelativePath($stageRoot, $markdownFile.FullName).Replace("\", "/")
  if ($relativeMarkdownPath -match '/tp/.+\.md$') {
    $downloadUrl = "https://kayasam.github.io/linux-bases-services/telechargements/$relativeMarkdownPath"
    $downloadBlock = "`n`n> [!TIP] Ressource du TP`n> - <a href=`"$downloadUrl`" download>Télécharger ce TP en Markdown</a>`n"
    $h1Pattern = [regex]::new('(?m)^(#\s+.+)\r?$')
    $updated = $h1Pattern.Replace($updated, { param($match) $match.Value + $downloadBlock }, 1)
  }

  if ($updated -ne $original) {
    [IO.File]::WriteAllText($markdownFile.FullName, $updated, $utf8WithoutBom)
  }
}

Write-Host "4/5 - Synchronisation du contenu Quartz..."
Copy-MirroredDirectory -Source $stageRoot -Destination $destinationContent
Remove-Item -LiteralPath $stageRoot -Recurse -Force

Push-Location $projectRoot
try {
  Write-Host "5/5 - Formatage et vérification du build Quartz..."
  & npx prettier content site-content quartz/styles/custom.scss --write
  if ($LASTEXITCODE -ne 0) {
    throw "Le formatage du contenu a échoué."
  }
  & npx quartz build
  if ($LASTEXITCODE -ne 0) {
    throw "Le build Quartz a échoué. Aucun commit n'a été créé."
  }

  if ($PrepareOnly) {
    Write-Host ""
    Write-Host "Préparation et build terminés sans commit ni envoi Git." -ForegroundColor Green
    exit 0
  }

  $changes = @(& git status --porcelain)
  if ($changes.Count -eq 0) {
    Write-Host "Aucune modification à publier." -ForegroundColor Yellow
    exit 0
  }

  Write-Host ""
  Write-Host "Modifications détectées :" -ForegroundColor Cyan
  & git status --short

  if ([string]::IsNullOrWhiteSpace($Message)) {
    $Message = Read-Host "Message de publication (Entrée pour le message proposé)"
  }
  if ([string]::IsNullOrWhiteSpace($Message)) {
    $Message = "Mise à jour des cours Linux - $(Get-Date -Format 'yyyy-MM-dd HH:mm')"
  }

  $confirmation = Read-Host "Publier maintenant sur GitHub ? [o/N]"
  if ($confirmation -notmatch '^(o|oui|y|yes)$') {
    Write-Host "Publication annulée. Les fichiers préparés restent disponibles localement." -ForegroundColor Yellow
    exit 0
  }

  & git add -A
  if ($LASTEXITCODE -ne 0) { throw "Impossible de préparer les fichiers Git." }
  & git commit -m $Message
  if ($LASTEXITCODE -ne 0) { throw "La création du commit a échoué." }
  & git push -u origin v5
  if ($LASTEXITCODE -ne 0) { throw "L'envoi vers GitHub a échoué." }

  Write-Host "Publication envoyée. GitHub Pages sera actualisé dans quelques minutes." -ForegroundColor Green
  Write-Host "https://kayasam.github.io/linux-bases-services/"
}
finally {
  Pop-Location
  if (Test-Path -LiteralPath $stageRoot) {
    Remove-Item -LiteralPath $stageRoot -Recurse -Force
  }
}
