;(function () {
  "use strict"

  const root = document.querySelector("[data-command-bank]")
  if (!root) return

  const bankId = root.dataset.commandBank
  const bank = window.linuxCommandBanks && window.linuxCommandBanks[bankId]
  if (!bank || !Array.isArray(bank.commands)) {
    root.innerHTML =
      '<p class="command-error">Les fiches de commandes ne peuvent pas être chargées.</p>'
    return
  }

  const elements = {
    kicker: document.getElementById("command-kicker"),
    title: document.getElementById("command-title"),
    intro: document.getElementById("command-intro"),
    back: document.getElementById("chapter-link"),
    search: document.getElementById("command-search"),
    filters: document.getElementById("command-filters"),
    count: document.getElementById("command-count"),
    list: document.getElementById("command-list"),
    empty: document.getElementById("command-empty"),
    detail: document.getElementById("command-detail"),
  }

  let activeCategory = "Toutes"
  let activeCommand = null
  let filteredCommands = bank.commands.slice()

  document.title = bank.title + " — Commandes Linux TSSR"
  elements.kicker.textContent = bank.chapter
  elements.title.textContent = bank.title
  elements.intro.textContent = bank.intro
  elements.back.href = bank.chapterLink || "./"

  function normalize(value) {
    return String(value || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
  }

  function searchable(command) {
    return normalize(
      [
        command.name,
        command.category,
        command.summary,
        command.why,
        command.syntax,
        command.proof,
        command.caution,
        ...(command.options || []).flat(),
        ...(command.examples || []).flat(),
      ].join(" "),
    )
  }

  function slug(value) {
    return normalize(value)
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")
  }

  function copyText(value, button) {
    navigator.clipboard
      .writeText(value)
      .then(function () {
        const previous = button.textContent
        button.textContent = "Copié ✓"
        button.classList.add("copied")
        window.setTimeout(function () {
          button.textContent = previous
          button.classList.remove("copied")
        }, 1400)
      })
      .catch(function () {
        button.textContent = "Copie impossible"
      })
  }

  function makeCopyButton(value, label) {
    const button = document.createElement("button")
    button.type = "button"
    button.className = "copy-button"
    button.textContent = label || "Copier"
    button.addEventListener("click", function () {
      copyText(value, button)
    })
    return button
  }

  function renderFilters() {
    const categories = ["Toutes"].concat(
      Array.from(
        new Set(
          bank.commands.map(function (command) {
            return command.category
          }),
        ),
      ),
    )
    elements.filters.replaceChildren()
    categories.forEach(function (category) {
      const button = document.createElement("button")
      button.type = "button"
      button.className = "filter-button"
      button.textContent = category
      button.setAttribute("aria-pressed", String(category === activeCategory))
      button.addEventListener("click", function () {
        activeCategory = category
        renderFilters()
        applyFilters()
      })
      elements.filters.appendChild(button)
    })
  }

  function applyFilters() {
    const query = normalize(elements.search.value.trim())
    filteredCommands = bank.commands.filter(function (command) {
      const categoryMatches = activeCategory === "Toutes" || command.category === activeCategory
      const searchMatches = !query || searchable(command).includes(query)
      return categoryMatches && searchMatches
    })
    renderList()
  }

  function renderList() {
    elements.list.replaceChildren()
    elements.count.textContent =
      filteredCommands.length + (filteredCommands.length > 1 ? " commandes" : " commande")
    elements.empty.hidden = filteredCommands.length !== 0

    filteredCommands.forEach(function (command) {
      const button = document.createElement("button")
      button.type = "button"
      button.className = "command-card"
      button.dataset.command = command.name
      button.setAttribute(
        "aria-current",
        String(activeCommand && activeCommand.name === command.name),
      )

      const heading = document.createElement("span")
      heading.className = "command-card__heading"
      const code = document.createElement("code")
      code.textContent = command.name
      const category = document.createElement("small")
      category.textContent = command.category
      heading.append(code, category)

      const summary = document.createElement("span")
      summary.className = "command-card__summary"
      summary.textContent = command.summary
      button.append(heading, summary)
      button.addEventListener("click", function () {
        selectCommand(command, true)
      })
      elements.list.appendChild(button)
    })

    if (!activeCommand || !filteredCommands.includes(activeCommand)) {
      if (filteredCommands.length) selectCommand(filteredCommands[0], false)
      else renderEmptyDetail()
    }
  }

  function detailSection(title) {
    const section = document.createElement("section")
    section.className = "detail-section"
    const heading = document.createElement("h3")
    heading.textContent = title
    section.appendChild(heading)
    return section
  }

  function renderEmptyDetail() {
    elements.detail.replaceChildren()
    const message = document.createElement("div")
    message.className = "detail-placeholder"
    message.textContent =
      "Aucune commande ne correspond à cette recherche. Essayez un nom, une option ou un objectif différent."
    elements.detail.appendChild(message)
  }

  function selectCommand(command, updateHash) {
    activeCommand = command
    elements.list.querySelectorAll(".command-card").forEach(function (card) {
      card.setAttribute("aria-current", String(card.dataset.command === command.name))
    })
    renderDetail(command)
    if (updateHash) history.replaceState(null, "", "#" + slug(command.name))
    if (window.matchMedia("(max-width: 820px)").matches && updateHash) {
      elements.detail.scrollIntoView({ behavior: "smooth", block: "start" })
    }
  }

  function renderDetail(command) {
    elements.detail.replaceChildren()

    const header = document.createElement("header")
    header.className = "detail-header"
    const label = document.createElement("span")
    label.className = "detail-category"
    label.textContent = command.category
    const title = document.createElement("h2")
    title.textContent = command.name
    const summary = document.createElement("p")
    summary.textContent = command.summary
    header.append(label, title, summary)
    elements.detail.appendChild(header)

    const purpose = detailSection("Ce que fait la commande")
    const purposeText = document.createElement("p")
    purposeText.textContent = command.why
    purpose.appendChild(purposeText)
    elements.detail.appendChild(purpose)

    const syntaxSection = detailSection("Syntaxe à lire")
    const syntaxBox = document.createElement("div")
    syntaxBox.className = "code-row"
    const syntax = document.createElement("code")
    syntax.textContent = command.syntax
    syntaxBox.append(syntax, makeCopyButton(command.syntax))
    syntaxSection.appendChild(syntaxBox)
    elements.detail.appendChild(syntaxSection)

    if (command.options && command.options.length) {
      const optionSection = detailSection("Options importantes — cliquez pour composer")
      const optionGrid = document.createElement("div")
      optionGrid.className = "option-grid"
      const selected = new Set()
      const previewCode = document.createElement("code")
      const updatePreview = function () {
        previewCode.textContent = [command.name].concat(Array.from(selected)).join(" ")
      }

      command.options.forEach(function (option) {
        const button = document.createElement("button")
        button.type = "button"
        button.className = "option-button"
        button.setAttribute("aria-pressed", "false")
        const flag = document.createElement("code")
        flag.textContent = option[0]
        const description = document.createElement("span")
        description.textContent = option[1]
        button.append(flag, description)
        button.addEventListener("click", function () {
          if (selected.has(option[0])) selected.delete(option[0])
          else selected.add(option[0])
          button.setAttribute("aria-pressed", String(selected.has(option[0])))
          updatePreview()
        })
        optionGrid.appendChild(button)
      })
      const preview = document.createElement("div")
      preview.className = "option-preview code-row"
      updatePreview()
      const previewCopy = document.createElement("button")
      previewCopy.type = "button"
      previewCopy.className = "copy-button"
      previewCopy.textContent = "Copier la composition"
      previewCopy.addEventListener("click", function () {
        copyText(previewCode.textContent, previewCopy)
      })
      preview.append(previewCode, previewCopy)
      optionSection.append(optionGrid, preview)
      elements.detail.appendChild(optionSection)
    }

    if (command.examples && command.examples.length) {
      const exampleSection = detailSection("Exemples commentés")
      const examples = document.createElement("div")
      examples.className = "example-list"
      command.examples.forEach(function (example) {
        const item = document.createElement("div")
        item.className = "example-item"
        const row = document.createElement("div")
        row.className = "code-row"
        const code = document.createElement("code")
        code.textContent = example[0]
        row.append(code, makeCopyButton(example[0]))
        const explanation = document.createElement("p")
        explanation.textContent = example[1]
        item.append(row, explanation)
        examples.appendChild(item)
      })
      exampleSection.appendChild(examples)
      elements.detail.appendChild(exampleSection)
    }

    if (command.proof) {
      const proof = document.createElement("div")
      proof.className = "detail-note detail-note--proof"
      const strong = document.createElement("strong")
      strong.textContent = "Preuve à rechercher"
      const text = document.createElement("span")
      text.textContent = command.proof
      proof.append(strong, text)
      elements.detail.appendChild(proof)
    }

    if (command.caution) {
      const caution = document.createElement("div")
      caution.className = "detail-note detail-note--warning"
      const strong = document.createElement("strong")
      strong.textContent = "Point de vigilance"
      const text = document.createElement("span")
      text.textContent = command.caution
      caution.append(strong, text)
      elements.detail.appendChild(caution)
    }
  }

  elements.search.addEventListener("input", applyFilters)
  document.addEventListener("keydown", function (event) {
    if (event.key === "/" && document.activeElement !== elements.search) {
      event.preventDefault()
      elements.search.focus()
    }
    if (event.key === "Escape" && document.activeElement === elements.search) {
      elements.search.value = ""
      elements.search.blur()
      applyFilters()
    }
  })

  renderFilters()
  applyFilters()
  const requested = window.location.hash.slice(1)
  const fromHash = bank.commands.find(function (command) {
    return slug(command.name) === requested
  })
  if (fromHash) selectCommand(fromHash, false)
})()
