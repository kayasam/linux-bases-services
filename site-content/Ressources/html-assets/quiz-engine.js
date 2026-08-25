;(function () {
  "use strict"

  const letters = ["A", "B", "C", "D"]
  const root = document.querySelector("[data-quiz]")
  if (!root) return

  const quizId = root.dataset.quiz || new URLSearchParams(window.location.search).get("quiz")
  const data = window.linuxQuizBanks && window.linuxQuizBanks[quizId]
  if (!data) {
    root.innerHTML = '<p class="quiz-error">Le quiz demandé ne peut pas être chargé.</p>'
    return
  }

  if (!Array.isArray(data.questions) || data.questions.length === 0) {
    root.innerHTML = '<p class="quiz-error">Ce quiz ne contient aucune question exploitable.</p>'
    return
  }

  const total = data.questions.length
  const objective = Math.ceil(total * 0.8)

  document.title = data.title + " — Quiz Linux TSSR"
  document.getElementById("quiz-kicker").textContent = data.chapter
  document.getElementById("quiz-title").textContent = data.title
  document.getElementById("quiz-intro").textContent = data.intro
  document.getElementById("chapter-link").href = data.chapterLink
  document.querySelector(".quiz-meta span:first-child").textContent = total + " questions"
  document.querySelector(".quiz-status > span:last-child").textContent =
    "Objectif : " + objective + "/" + total
  document.getElementById("best-score").nextElementSibling.textContent = "meilleur score /" + total

  const panel = document.getElementById("question-panel")
  const result = document.getElementById("result-panel")
  const currentEl = document.getElementById("current-question")
  const progress = document.getElementById("progress-bar")
  const theme = document.getElementById("question-theme")
  const title = document.getElementById("question-title")
  const answers = document.getElementById("answers")
  const feedback = document.getElementById("feedback")
  const next = document.getElementById("next-question")

  let order = []
  let index = 0
  let score = 0
  let answered = false

  function shuffle(values) {
    const copy = values.slice()
    for (let i = copy.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[copy[i], copy[j]] = [copy[j], copy[i]]
    }
    return copy
  }

  function renderQuestion() {
    answered = false
    next.disabled = true
    feedback.className = "feedback"
    feedback.replaceChildren()

    const question = data.questions[order[index]]
    currentEl.textContent = "Question " + (index + 1) + " sur " + total
    progress.style.width = ((index + 1) / total) * 100 + "%"
    theme.textContent = question.theme
    title.textContent = question.question
    answers.replaceChildren()

    question.choices.forEach(function (choice, choiceIndex) {
      const button = document.createElement("button")
      button.type = "button"
      button.className = "answer"
      button.dataset.index = String(choiceIndex)
      button.innerHTML = '<span class="answer-key">' + letters[choiceIndex] + "</span><span></span>"
      button.lastElementChild.textContent = choice
      button.addEventListener("click", function () {
        selectAnswer(choiceIndex)
      })
      answers.appendChild(button)
    })
  }

  function selectAnswer(choiceIndex) {
    if (answered) return
    answered = true
    const question = data.questions[order[index]]
    const isCorrect = choiceIndex === question.answer
    if (isCorrect) score += 1

    answers.querySelectorAll(".answer").forEach(function (button) {
      const buttonIndex = Number(button.dataset.index)
      button.disabled = true
      if (buttonIndex === question.answer) button.classList.add("correct")
      if (buttonIndex === choiceIndex && !isCorrect) button.classList.add("wrong")
    })

    const status = document.createElement("strong")
    status.textContent = isCorrect ? "Bonne réponse" : "Réponse incorrecte"
    const explanation = document.createElement("span")
    explanation.textContent = question.explanation
    feedback.append(status, explanation)
    feedback.className = "feedback visible " + (isCorrect ? "correct" : "wrong")
    next.disabled = false
    next.focus()
  }

  function showResult() {
    panel.classList.add("hidden")
    result.classList.add("visible")
    const percent = Math.round((score / total) * 100)
    const wrong = total - score
    let heading
    let message
    if (percent >= 85) {
      heading = "Compétences maîtrisées"
      message =
        "Très bon résultat : les notions et la méthode de diagnostic sont solides. Passez au TP et justifiez vos vérifications par des preuves."
    } else if (percent >= 65) {
      heading = "Acquis à consolider"
      message =
        "Le socle est présent. Relisez les explications des réponses manquées, puis refaites le quiz avant de passer au dépannage en autonomie."
    } else {
      heading = "Révision recommandée"
      message =
        "Reprenez le cours et les commandes de vérification du chapitre. Cherchez à comprendre la couche observée plutôt qu'à mémoriser uniquement les commandes."
    }

    document.getElementById("result-score").textContent = score + "/" + total
    document.getElementById("result-percent").textContent = percent + " %"
    document.getElementById("result-title").textContent = heading
    document.getElementById("result-message").textContent = message
    document.getElementById("correct-count").textContent = String(score)
    document.getElementById("wrong-count").textContent = String(wrong)
    document.getElementById("best-score").textContent = String(saveBest(score))
    result.scrollIntoView({ behavior: "smooth", block: "start" })
  }

  function saveBest(value) {
    const key = "linux-tssr-quiz-" + data.id
    try {
      const previous = Number(localStorage.getItem(key) || 0)
      const best = Math.max(previous, value)
      localStorage.setItem(key, String(best))
      return best
    } catch (_) {
      return value
    }
  }

  function start() {
    order = shuffle(
      data.questions.map(function (_, questionIndex) {
        return questionIndex
      }),
    )
    index = 0
    score = 0
    panel.classList.remove("hidden")
    result.classList.remove("visible")
    renderQuestion()
    panel.scrollIntoView({ behavior: "smooth", block: "start" })
  }

  next.addEventListener("click", function () {
    if (!answered) return
    if (index === total - 1) showResult()
    else {
      index += 1
      renderQuestion()
    }
  })
  document.getElementById("restart-quiz").addEventListener("click", start)
  document.getElementById("result-course-link").href = data.chapterLink
  start()
})()
