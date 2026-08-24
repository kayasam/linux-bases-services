import { readFile, writeFile } from "node:fs/promises"
import { resolve } from "node:path"

const graphFiles = [
  "node_modules/@quartz-community/graph/dist/index.js",
  "node_modules/@quartz-community/graph/dist/components/index.js",
]

const currentNormalization = 'function Fu(u){let e=_t(ft(u,"index"),!0);'
const correctedNormalization = 'function Fu(u){let e=_t(ft(u,"index"),!1);'

for (const relativePath of graphFiles) {
  const absolutePath = resolve(relativePath)
  const source = await readFile(absolutePath, "utf8")

  if (source.includes(correctedNormalization)) {
    console.log(`Graphe Quartz déjà corrigé : ${relativePath}`)
    continue
  }

  const occurrences = source.split(currentNormalization).length - 1
  if (occurrences !== 1) {
    throw new Error(
      `Correction du graphe impossible dans ${relativePath} : motif attendu ${occurrences} fois.`,
    )
  }

  await writeFile(
    absolutePath,
    source.replace(currentNormalization, correctedNormalization),
    "utf8",
  )
  console.log(`Normalisation des pages de dossier corrigée : ${relativePath}`)
}
