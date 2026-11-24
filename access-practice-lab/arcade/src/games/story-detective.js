// Story Detective — a two-decision case: pin the evidence, then name the
// inference. Rebuilt from the lab's clue hunt so the reasoning step is visible
// and scored separately from the answer.
import { esc } from "../core/dom.js";
import { sound } from "../core/audio.js";
import { fx } from "../core/fx.js";
import { L } from "../core/i18n.js";

const CASES = {
  "3-5": [
    {
      id: "lunchbox",
      title: "The Empty Lunchbox",
      question: "Why did Diego share his lunch?",
      passage: [
        "At noon, Diego opened his lunchbox and saw only a napkin.",
        "He looked across the cafeteria at the table where Noor sat alone.",
        "Noor's tray was empty, and she kept her hands in her lap.",
        "Diego walked over and put half of his sandwich on her tray.",
        "Neither of them said much, but Noor smiled for the rest of lunch.",
      ],
      clues: [1, 2],
      evidenceWhy:
        "Sentences 2 and 3 show Diego noticing that Noor had no food. That noticing is the reason for what he does next.",
      options: [
        { text: "Because Diego did not like his sandwich.", correct: false },
        { text: "Because he noticed Noor had nothing to eat.", correct: true },
        { text: "Because the teacher told him to share.", correct: false },
        { text: "Because Noor asked him for food.", correct: false },
      ],
      inferenceWhy:
        "Diego acts on what he sees: an empty tray and a friend sitting alone. The story never says anyone asked him to share.",
      reveal:
        "Diego shares because he notices. The napkin in his own lunchbox is a detail, but it does not explain his choice.",
    },
    {
      id: "late-bell",
      title: "The Late Bell",
      question: "What most likely happened to Priya this morning?",
      passage: [
        "The bell rang, and Priya's seat was still empty.",
        "At 8:12, Priya slipped in with wet hair and a folded note in her hand.",
        "She handed the note to the teacher and sat down quietly.",
        "During reading, Priya kept checking the clock.",
        "After school, she ran to the bus loop faster than anyone.",
      ],
      clues: [1, 2],
      evidenceWhy:
        "Wet hair and a note are clues about what happened before she arrived. Sentence 3 shows she had a reason to give the teacher.",
      options: [
        { text: "Her ride was delayed by rain, so she arrived late with a note.", correct: true },
        { text: "She was late because she wanted to miss reading.", correct: false },
        { text: "She forgot her lunch at home.", correct: false },
        { text: "She was sent home early.", correct: false },
      ],
      inferenceWhy:
        "Rain explains the wet hair, and the note explains the late arrival. Nothing in the story says she wanted to miss class.",
      reveal:
        "The strongest explanation fits every clue: rain, a late arrival, and a note to the teacher.",
    },
  ],
  "6-8": [
    {
      id: "ridge",
      title: "The Signal from the Ridge",
      question: "Why did the grandfather plant trees on the ridge?",
      passage: [
        "Every spring, my grandfather climbed the ridge with a sack of saplings.",
        "He never explained why he chose that bare, wind-scoured slope.",
        "The village cut firewood from the lower forest, where the trees grew fast.",
        "Ten years later, the lower forest was thin, but the ridge held a new stand of pines.",
        "When the rains came hard that year, the ridge soil stayed in place.",
        "Now I carry the sack up the same path.",
      ],
      clues: [2, 4],
      evidenceWhy:
        "Sentence 3 gives the problem — the village was cutting the lower forest. Sentence 5 gives the result — the ridge soil held. Together they explain the planting.",
      options: [
        { text: "He wanted a quiet place to work alone.", correct: false },
        {
          text: "He was replacing the trees the village used and holding the soil in place.",
          correct: true,
        },
        { text: "He was following orders from the village council.", correct: false },
        { text: "He preferred pines to the trees in the lower forest.", correct: false },
      ],
      inferenceWhy:
        "The planting answers two problems at once: wood is being cut below, and bare slopes lose soil in heavy rain.",
      reveal:
        "The grandfather plants where the damage will happen next. The narrator inherits the work, which suggests the reason still matters.",
    },
    {
      id: "exhibit",
      title: "The Quiet Exhibit",
      question: "Why did the gallery fill during the week?",
      passage: [
        "The museum's new exhibit opened on a Tuesday, and the gallery was nearly empty.",
        "By Friday, the same room was full of students holding sketchbooks.",
        "The museum had sent a free workshop invitation to every school in the district.",
        "The exhibit's labels were printed in three languages.",
        "On Saturday, the director ordered twice as many stools for the drawing corner.",
      ],
      clues: [1, 2],
      evidenceWhy:
        "The invitation in sentence 3 is the cause. The students with sketchbooks in sentence 2 are the effect.",
      options: [
        { text: "The exhibit became famous after a news report.", correct: false },
        { text: "A free workshop invitation brought school groups in.", correct: true },
        { text: "The museum lowered its ticket price.", correct: false },
        { text: "The multilingual labels attracted tourists.", correct: false },
      ],
      inferenceWhy:
        "Cause and effect are linked by sequence: the invitation went out, then the room filled with students.",
      reveal:
        "The labels and the stools are supporting details, not reasons. The invitation explains the change.",
    },
  ],
};

const TAGS = {
  evidence: "Choosing evidence",
  inference: "Inference from evidence",
};

export default {
  id: "story-detective",
  skill: "Reading",
  missedLabels: TAGS,

  rounds(band) {
    const cases = CASES[band] || CASES["3-5"];
    const out = [];
    cases.forEach((item, caseIndex) => {
      const picks = new Set();
      out.push({
        id: `${item.id}-evidence`,
        phase: "evidence",
        case: item,
        caseIndex,
        caseTotal: cases.length,
        picks,
        prompt: item.question,
      });
      out.push({
        id: `${item.id}-inference`,
        phase: "inference",
        case: item,
        caseIndex,
        caseTotal: cases.length,
        picks,
        prompt: item.question,
      });
    });
    return out;
  },

  render(stage, round, shell) {
    if (round.phase === "evidence") return renderEvidence(stage, round, shell);
    return renderInference(stage, round, shell);
  },
};

function caseHead(round, task) {
  const item = round.case;
  return `
    <div class="case-head">
      <p class="case-stamp">${L("Case file", "Expediente")} · ${round.caseIndex + 1} / ${
    round.caseTotal
  } · ${esc(item.title)}</p>
      <h2 class="case-question" data-focus tabindex="-1">${esc(item.question)}</h2>
      <p class="case-task">${task}</p>
    </div>`;
}

function passageHTML(item, { interactive = false, picked = new Set(), revealed = false } = {}) {
  return `
    <div class="passage">
      <p class="passage-label">${L("The report", "El informe")}</p>
      ${item.passage
        .map((line, i) => {
          if (!interactive && !revealed) {
            return `<p class="passage-line"><span class="line-no">${i + 1}</span>${esc(line)}</p>`;
          }
          if (revealed) {
            const isClue = item.clues.includes(i);
            return `<p class="passage-line ${isClue ? "is-clue" : ""}"><span class="line-no">${
              i + 1
            }</span>${esc(line)}${isClue ? '<span class="clue-flag">clue</span>' : ""}</p>`;
          }
          return `<button class="clue" type="button" data-clue="${i}" aria-pressed="${
            picked.has(i) ? "true" : "false"
          }">
            <span class="line-no">${i + 1}</span>
            <span class="clue-text">${esc(line)}</span>
            <span class="pin-mark" aria-hidden="true">⌖</span>
          </button>`;
        })
        .join("")}
    </div>`;
}

function renderEvidence(stage, round, shell) {
  const item = round.case;
  const picks = round.picks;

  stage.innerHTML = `
    <div class="case">
      ${caseHead(round, L("Pin the two sentences that best prove your answer.", "Marca las dos oraciones que mejor prueban tu respuesta."))}
      <div class="case-grid">
        ${passageHTML(item, { interactive: true, picked: picks })}
        <aside class="board">
          <h3>${L("Evidence board", "Tablero de evidencia")} <span data-count>0 / 2</span></h3>
          <div class="pins" data-pins><p class="pins-empty">${L(
            "Nothing pinned yet.",
            "Todavía no hay nada fijado."
          )}</p></div>
          <button class="btn btn-primary" type="button" data-submit disabled>${L(
            "Pin evidence",
            "Fijar evidencia"
          )}</button>
          <p class="board-note">${L("Strong evidence comes straight from the text.", "La buena evidencia sale del texto.")}</p>
        </aside>
      </div>
    </div>`;

  const pins = stage.querySelector("[data-pins]");
  const count = stage.querySelector("[data-count]");
  const submit = stage.querySelector("[data-submit]");
  const clues = [...stage.querySelectorAll("[data-clue]")];

  const repaint = () => {
    count.textContent = `${picks.size} / 2`;
    submit.disabled = picks.size !== 2;
    clues.forEach((btn) => {
      const on = picks.has(Number(btn.dataset.clue));
      btn.setAttribute("aria-pressed", String(on));
      btn.classList.toggle("is-picked", on);
    });
    pins.innerHTML = picks.size
      ? [...picks]
          .sort((a, b) => a - b)
          .map(
            (i) =>
              `<blockquote class="pin"><span>${i + 1}</span>${esc(
                item.passage[i]
              )}</blockquote>`
          )
          .join("")
      : `<p class="pins-empty">${L("Nothing pinned yet.", "Todavía no hay nada fijado.")}</p>`;
  };

  clues.forEach((btn) => {
    btn.addEventListener("click", () => {
      if (submit.disabled === false) return;
      const i = Number(btn.dataset.clue);
      if (picks.has(i)) {
        picks.delete(i);
        sound.click();
      } else if (picks.size >= 2) {
        sound.hint();
        fx.shake(btn);
      } else {
        picks.add(i);
        sound.click();
        fx.burst(window.innerWidth * 0.35, btn.getBoundingClientRect().top + 18, {
          count: 6,
          power: 3,
          colors: ["#2e4a94", "#e2b14a"],
        });
      }
      repaint();
    });
  });

  submit.addEventListener("click", () => {
    if (picks.size !== 2) return;
    submit.disabled = true;
    clues.forEach((b) => (b.disabled = true));
    const chosen = [...picks];
    const hits = chosen.filter((i) => item.clues.includes(i));
    const exact = hits.length === 2;

    clues.forEach((btn) => {
      const i = Number(btn.dataset.clue);
      const isClue = item.clues.includes(i);
      btn.classList.remove("is-picked");
      if (isClue) btn.classList.add("is-proof");
      if (chosen.includes(i) && !isClue) btn.classList.add("is-miss");
      if (!chosen.includes(i) && isClue) btn.classList.add("is-missing");
    });

    shell.answer(exact, {
      tone: exact ? "good" : hits.length === 1 ? "partial" : "bad",
      points: exact ? 100 : hits.length === 1 ? 55 : 0,
      tag: "evidence",
      title: exact
        ? L("That is evidence", "Eso es evidencia")
        : hits.length === 1
          ? L("One strong clue found", "Una pista fuerte encontrada")
          : L("Let’s look again", "Miremos otra vez"),
      body:
        exact
          ? L(
              "Both sentences come straight from the text and explain the choice.",
              "Las dos oraciones salen del texto y explican la decisión."
            )
          : L(
              `You pinned ${hits.length} of the 2 strongest clues. The proof is highlighted in the report.`,
              `Marcaste ${hits.length} de las 2 pistas más fuertes. La prueba está resaltada en el informe.`
            ),
      why: item.evidenceWhy,
    });
  });
}

function renderInference(stage, round, shell) {
  const item = round.case;

  stage.innerHTML = `
    <div class="case">
      ${caseHead(round, L("Now name the conclusion the evidence supports.", "Ahora nombra la conclusión que apoya la evidencia."))}
      <div class="case-grid">
        ${passageHTML(item, { revealed: true })}
        <aside class="board board-static">
          <h3>${L("Pinned evidence", "Evidencia fijada")}</h3>
          <div class="pins">
            ${item.clues
              .map(
                (i) => `<blockquote class="pin"><span>${i + 1}</span>${esc(item.passage[i])}</blockquote>`
              )
              .join("")}
          </div>
        </aside>
      </div>

      <p class="verdict-label">${L("Which conclusion fits the evidence?", "¿Qué conclusión encaja con la evidencia?")}</p>
      <div class="verdicts">
        ${item.options
          .map(
            (option, i) => `
          <button class="verdict" type="button" data-choice data-ok="${option.correct}" data-key="${i + 1}">
            <span class="key" aria-hidden="true">${i + 1}</span>
            <span>${esc(option.text)}</span>
          </button>`
          )
          .join("")}
      </div>
    </div>`;

  stage.querySelectorAll("[data-ok]").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (shell.locked) return;
      const correct = btn.dataset.ok === "true";
      stage.querySelectorAll("[data-ok]").forEach((b) => {
        b.disabled = true;
        if (b.dataset.ok === "true") b.classList.add("is-correct");
      });
      if (!correct) btn.classList.add("is-wrong");
      shell.answer(correct, {
        tag: "inference",
        title: correct
          ? L("Case closed", "Caso cerrado")
          : L("The evidence points elsewhere", "La evidencia apunta a otra parte"),
        body: item.reveal,
        why: item.inferenceWhy,
      });
    });
  });
}
