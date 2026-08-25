---
title: Linux - Bases & Services
description: Formation pratique d'administration Linux et de mise en œuvre de services pour TSSR.
---

# Linux - Bases & Services

<section class="network-hero">
  <div class="network-hero__copy">
    <span class="network-kicker">Formation TSSR · laboratoire fil rouge</span>
    <h2>Linux - Bases &amp; Services</h2>
    <p>Du stockage aux services réseau : cours détaillés, schémas SVG, travaux pratiques et pannes guidées pour apprendre à observer, expliquer et rétablir.</p>
    <div class="network-hero__actions">
      <a class="network-button network-button--primary" href="./00-mise-en-place/">Commencer le parcours <span aria-hidden="true">→</span></a>
      <a class="network-button network-button--ghost" href="./Ressources/fiche-diagnostic-tssr">Ouvrir la méthode TSSR <span aria-hidden="true">↗</span></a>
    </div>
    <div class="network-stats" aria-label="Contenu de la formation">
      <span><strong>15</strong> cours</span>
      <span><strong>10</strong> TP</span>
      <span><strong>16</strong> schémas SVG</span>
    </div>
  </div>
  <div class="network-hero__visual">
    <details class="tux-console">
      <summary aria-label="Interagir avec Tux">
        <svg class="tux-mascot" viewBox="0 0 520 430" role="img" aria-labelledby="tux-title tux-desc">
          <title id="tux-title">Tux, mascotte Linux interactive</title>
          <desc id="tux-desc">Un manchot souriant devant un terminal. Il salue lorsque le pointeur le survole.</desc>
          <defs>
            <linearGradient id="tux-shell" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stop-color="#172033"/>
              <stop offset="1" stop-color="#05070d"/>
            </linearGradient>
            <linearGradient id="tux-belly" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stop-color="#ffffff"/>
              <stop offset="1" stop-color="#dbe7f3"/>
            </linearGradient>
            <linearGradient id="tux-beak" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stop-color="#ffd95a"/>
              <stop offset="1" stop-color="#f59e0b"/>
            </linearGradient>
            <filter id="tux-shadow" x="-30%" y="-30%" width="160%" height="180%">
              <feDropShadow dx="0" dy="14" stdDeviation="14" flood-color="#071d36" flood-opacity=".24"/>
            </filter>
          </defs>
          <g class="tux-orbit" aria-hidden="true">
            <circle cx="66" cy="94" r="7" fill="#84cc16"/>
            <path d="M454 82h30M469 67v30" stroke="#168aad" stroke-width="7" stroke-linecap="round"/>
            <path d="M64 310l14 14m0-14-14 14" stroke="#7c3aed" stroke-width="7" stroke-linecap="round"/>
          </g>
          <g class="tux-character" filter="url(#tux-shadow)">
            <ellipse cx="258" cy="380" rx="153" ry="24" fill="#0f2740" opacity=".18"/>
            <path class="tux-wing tux-wing--left" d="M151 211c-55 19-83 75-67 120 12 35 45 15 71-23 20-30 29-69 19-87-5-9-13-13-23-10Z" fill="#111827"/>
            <path class="tux-wing tux-wing--right" d="M363 203c58 3 98 49 95 97-2 38-39 27-74-1-28-23-49-57-45-77 2-11 11-18 24-19Z" fill="#111827"/>
            <path d="M154 166c0-98 57-143 109-143 61 0 114 50 114 151 0 43-4 72-17 102 22 36 27 74 11 101-24 39-193 40-223 3-23-28-13-72 8-109-2-30-2-68-2-105Z" fill="url(#tux-shell)"/>
            <ellipse cx="260" cy="259" rx="94" ry="119" fill="url(#tux-belly)"/>
            <ellipse cx="218" cy="132" rx="42" ry="49" fill="#f8fafc"/>
            <ellipse cx="303" cy="132" rx="42" ry="49" fill="#f8fafc"/>
            <g class="tux-eyes">
              <circle class="tux-pupil tux-pupil--left" cx="229" cy="139" r="12" fill="#111827"/>
              <circle class="tux-pupil tux-pupil--right" cx="292" cy="139" r="12" fill="#111827"/>
              <circle cx="233" cy="134" r="3.5" fill="#fff"/>
              <circle cx="296" cy="134" r="3.5" fill="#fff"/>
            </g>
            <path d="M216 169c23-20 65-20 90 0l-44 47Z" fill="url(#tux-beak)" stroke="#d97706" stroke-width="3" stroke-linejoin="round"/>
            <path d="M216 169h90l-44 17Z" fill="#ffe88c"/>
            <path d="M177 357c-42 0-76 18-83 43 38 13 91 8 126-12-3-20-18-31-43-31Z" fill="url(#tux-beak)" stroke="#d97706" stroke-width="3"/>
            <path d="M340 357c43 0 77 18 84 43-39 13-92 8-127-12 4-20 18-31 43-31Z" fill="url(#tux-beak)" stroke="#d97706" stroke-width="3"/>
          </g>
          <g class="tux-terminal" filter="url(#tux-shadow)">
            <rect x="303" y="264" width="170" height="103" rx="15" fill="#071d36" stroke="#168aad" stroke-width="4"/>
            <circle cx="324" cy="284" r="5" fill="#fb7185"/>
            <circle cx="341" cy="284" r="5" fill="#facc15"/>
            <circle cx="358" cy="284" r="5" fill="#84cc16"/>
            <text x="322" y="320" fill="#84cc16" font-family="ui-monospace, monospace" font-size="13" font-weight="700">$ systemctl status</text>
            <text x="322" y="346" fill="#e0f2fe" font-family="ui-monospace, monospace" font-size="12">● active (running)</text>
          </g>
        </svg>
        <span class="tux-console__hint"><b>Salut, je suis Tux.</b><small>Clique pour afficher mon conseil</small></span>
      </summary>
      <div class="tux-console__message"><code>$ observer → expliquer → vérifier</code><span>Un bon administrateur ne devine pas : il produit une preuve.</span></div>
    </details>
    <span class="network-status"><i aria-hidden="true"></i> Tux est prêt</span>
  </div>
</section>

## Explorer la formation

<div class="learning-path">
  <a class="learning-card learning-card--blue" href="./00-mise-en-place/">
    <span class="learning-card__number">00</span><span class="learning-card__meta">Préparation</span>
    <strong>Mise en place</strong><span>Infrastructure, réseau privé et objectifs du laboratoire.</span>
  </a>
  <a class="learning-card learning-card--orange" href="./01-stockage/">
    <span class="learning-card__number">01</span><span class="learning-card__meta">Données</span>
    <strong>Gestion du stockage</strong><span>Partitions, LVM, systèmes de fichiers et montages persistants.</span>
  </a>
  <a class="learning-card learning-card--cyan" href="./02-administration-systeme/">
    <span class="learning-card__number">02</span><span class="learning-card__meta">Système</span>
    <strong>Administration Linux</strong><span>Démarrage, matériel, processus, systemd, logs et performances.</span>
  </a>
  <a class="learning-card learning-card--violet" href="./03-dns-bind9/">
    <span class="learning-card__number">03</span><span class="learning-card__meta">Résolution</span>
    <strong>DNS avec BIND9</strong><span>Zone autoritaire, transfert, enregistrements et diagnostic avec dig.</span>
  </a>
  <a class="learning-card learning-card--green" href="./04-serveur-web-lamp/">
    <span class="learning-card__number">04</span><span class="learning-card__meta">Application</span>
    <strong>Serveur Web LAMP</strong><span>Apache, virtual hosts, PHP, MariaDB et tests par couche.</span>
  </a>
  <a class="learning-card learning-card--red" href="./05-pare-feu-nftables/">
    <span class="learning-card__number">05</span><span class="learning-card__meta">Protection</span>
    <strong>Pare-feu nftables</strong><span>Chaînes, état de connexion, règles persistantes et compteurs.</span>
  </a>
  <a class="learning-card learning-card--rose" href="./06-messagerie/">
    <span class="learning-card__number">06</span><span class="learning-card__meta">Service complet</span>
    <strong>Messagerie</strong><span>Postfix, Maildir, Dovecot, IMAP et suivi d'un message.</span>
  </a>
</div>

## Apprendre en manipulant

<div class="experience-grid">
  <a class="experience-card experience-card--game" href="./Ressources/fiche-diagnostic-tssr">
    <span class="experience-card__icon" aria-hidden="true">⌕</span><span class="experience-card__eyebrow">Méthode terrain</span>
    <strong>Diagnostiquer sans deviner</strong><span>Partir du symptôme, vérifier chaque couche et produire une preuve.</span><b>Ouvrir la fiche →</b>
  </a>
  <a class="experience-card experience-card--revision" href="./01-stockage/tp/01-stockage">
    <span class="experience-card__icon" aria-hidden="true">>_</span><span class="experience-card__eyebrow">Premier laboratoire</span>
    <strong>Manipuler LVM</strong><span>Étendre la capacité, rendre le montage persistant et diagnostiquer fstab.</span><b>Commencer le TP →</b>
  </a>
</div>

## Emporter la formation

<div class="obsidian-download">
  <div class="obsidian-download__icon" aria-hidden="true">⬇</div>
  <div class="obsidian-download__content"><strong>Emporter le support publié</strong><span>Cours Markdown, TP et illustrations SVG, sans les fichiers techniques de Quartz.</span></div>
  <a class="obsidian-download__button" href="./linux-bases-services-obsidian.zip" download>Télécharger le ZIP</a>
</div>

<div class="home-links">
  <a href="./Ressources/">Toutes les ressources <span aria-hidden="true">→</span></a>
  <a href="https://github.com/kayasam/linux-bases-services">Dépôt GitHub <span aria-hidden="true">↗</span></a>
</div>
