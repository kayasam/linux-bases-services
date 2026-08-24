import { readFile } from "node:fs/promises"
import { dirname, join } from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"

const root = join(dirname(fileURLToPath(import.meta.url)), "..")
const assets = join(root, "content", "Ressources", "html-assets")
const expectedBanks = [
  "00-mise-en-place",
  "01-stockage",
  "02-administration-systeme",
  "03-dns-bind9",
  "04-serveur-web-lamp",
  "05-pare-feu-nftables",
  "06-messagerie",
]
const requiredIds = [
  "chapter-link",
  "command-kicker",
  "command-title",
  "command-intro",
  "command-search",
  "command-filters",
  "command-count",
  "command-list",
  "command-empty",
  "command-detail",
]
const courseFiles = {
  "00-mise-en-place": ["cours.md"],
  "01-stockage": ["01-partitionnement-lvm.md", "02-systemes-de-fichiers.md"],
  "02-administration-systeme": [
    "01-demarrage.md",
    "02-materiel.md",
    "03-modules-noyau.md",
    "04-processus.md",
    "05-systemd.md",
    "06-journalisation.md",
    "07-performances.md",
    "08-taches-planifiees.md",
  ],
  "03-dns-bind9": ["cours.md"],
  "04-serveur-web-lamp": ["cours.md"],
  "05-pare-feu-nftables": ["cours.md"],
  "06-messagerie": ["cours.md"],
}

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

globalThis.window = {}
await import(pathToFileURL(join(assets, "commands-banks.js")))
const banks = globalThis.window.linuxCommandBanks
assert(banks && typeof banks === "object", "La banque globale est absente.")
assert(
  JSON.stringify(Object.keys(banks)) === JSON.stringify(expectedBanks),
  "La liste des banques ne correspond pas aux sept chapitres.",
)

let total = 0
for (const id of expectedBanks) {
  const bank = banks[id]
  assert(bank.title && bank.chapter && bank.intro, `${id}: métadonnées incomplètes.`)
  assert(Array.isArray(bank.commands) && bank.commands.length > 0, `${id}: aucune commande.`)
  total += bank.commands.length

  const names = new Set()
  for (const item of bank.commands) {
    assert(item.name && item.category && item.summary, `${id}: identité de commande incomplète.`)
    assert(
      item.syntax && item.why && item.proof && item.caution,
      `${id}/${item.name}: explication incomplète.`,
    )
    assert(Array.isArray(item.options), `${id}/${item.name}: options absentes.`)
    assert(
      Array.isArray(item.examples) && item.examples.length > 0,
      `${id}/${item.name}: exemple absent.`,
    )
    assert(!names.has(item.name), `${id}: commande dupliquée ${item.name}.`)
    names.add(item.name)
    for (const option of item.options)
      assert(option.length === 2 && option.every(Boolean), `${id}/${item.name}: option invalide.`)
    for (const example of item.examples)
      assert(
        example.length === 2 && example.every(Boolean),
        `${id}/${item.name}: exemple invalide.`,
      )
  }

  const html = await readFile(join(root, "content", id, "commandes.html"), "utf8")
  assert(html.includes(`data-command-bank="${id}"`), `${id}: identifiant HTML incorrect.`)
  assert(
    html.includes("commands.css") &&
      html.includes("commands-banks.js") &&
      html.includes("commands-engine.js"),
    `${id}: asset interactif manquant.`,
  )
  const ids = Array.from(html.matchAll(/\bid="([^"]+)"/g), (match) => match[1])
  for (const required of requiredIds) assert(ids.includes(required), `${id}: #${required} absent.`)
  assert(new Set(ids).size === ids.length, `${id}: un id HTML est dupliqué.`)

  const index = await readFile(join(root, "content", id, "index.md"), "utf8")
  assert(index.includes(`${id}/commandes.html`), `${id}: lien absent de l'index.`)
  for (const courseFile of courseFiles[id]) {
    const course = await readFile(join(root, "content", id, courseFile), "utf8")
    assert(course.includes(`${id}/commandes.html`), `${id}/${courseFile}: lien absent du cours.`)
  }
}

const adminCategories = new Set(
  banks["02-administration-systeme"].commands.map((item) => item.category),
)
assert(
  adminCategories.size === 8,
  "Les huit sous-chapitres d'administration ne sont pas tous représentés.",
)
assert(total >= 100, `Couverture insuffisante : ${total} commandes.`)

const coveredCourses = Object.values(courseFiles).flat().length
console.log(
  `Explorateurs validés : ${expectedBanks.length} chapitres, ${coveredCourses} cours, ${adminCategories.size} sous-thèmes d'administration, ${total} commandes.`,
)
