/**
 * Signature Innovation B: Math Mystery Network (Server-side markup + lesson-specific config builder)
 *
 * Builds an interactive, mathematics-dependent mystery for every lesson:
 *   - Lesson 6-5 (and 6-5-part2) mounts the flagship "The Missing Concert Budget" mystery
 *     (3 illustrated clues: Venue Contract, Ticket Booth Ledger, Treasurer's Draft with 62t error).
 *   - All other lessons derive an authentic mystery from their own `v3` (hook, glitch, transfer)
 *     and lesson title so no lesson ever has generic or mismatched math.
 */
const esc = (s) =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const bi = (en, es) =>
  `<span class="lang-en">${esc(en)}</span><span class="lang-es" lang="es">${esc(es ?? en)}</span>`;

function buildConcertBudgetMystery() {
  return {
    id: "missing-concert-budget",
    titleEn: "The Missing Concert Budget",
    titleEs: "El presupuesto perdido del concierto",
    storyEn:
      "The school concert is tonight, but the treasurer's budget sheet has an error! Inspect all three clues to find the true cost model and check the total for 4 tickets.",
    storyEs:
      "El concierto escolar es esta noche, ¡pero la hoja de presupuesto tiene un error! Revisa las tres pistas para hallar el modelo correcto y verificar el total para 4 boletos.",
    clues: [
      {
        id: "venue-contract",
        icon: "🏛️",
        labelEn: "Clue 1: Venue Contract",
        labelEs: "Pista 1: Contrato del lugar",
        textEn:
          "One-time hall setup & sound fee: $50 (paid once for the whole concert, no matter how many tickets sell).",
        textEs:
          "Tarifa única de salón y sonido: $50 (se paga una sola vez por todo el concierto, sin importar cuántos boletos se vendan).",
      },
      {
        id: "ticket-ledger",
        icon: "🎟️",
        labelEn: "Clue 2: Ticket Booth Sign",
        labelEs: "Pista 2: Letrero de taquilla",
        textEn: "Admission price: $12 for each ticket (let t = number of tickets).",
        textEs: "Precio de entrada: $12 por cada boleto (sea t = número de boletos).",
      },
      {
        id: "treasurer-draft",
        icon: "🧾",
        labelEn: "Clue 3: Treasurer's Draft",
        labelEs: "Pista 3: Borrador del tesorero",
        textEn:
          "The draft says: 'Total cost = 62t.' Wait — at t = 4 tickets, the draft predicts $248! Something is wrong.",
        textEs:
          "El borrador dice: «Costo total = 62t». Espera: con t = 4 boletos, ¡predice $248! Algo anda mal.",
      },
    ],
    step1: {
      promptEn: "Which algebraic expression models the true concert cost?",
      promptEs: "¿Qué expresión algebraica modela el costo real del concierto?",
      options: [
        {
          id: "12t+50",
          label: "12t + 50",
          correct: true,
          fbEn: "Exact! $12 multiplies each ticket t, and the $50 venue fee is added once.",
          fbEs: "¡Exacto! $12 multiplica cada boleto t, y la tarifa de $50 se suma una sola vez.",
        },
        {
          id: "62t",
          label: "62t",
          correct: false,
          fbEn: "Careful! 62t adds 12 + 50 and multiplies the $50 venue fee by EVERY ticket.",
          fbEs: "¡Cuidado! 62t suma 12 + 50 y multiplica la tarifa de $50 por CADA boleto.",
        },
        {
          id: "12+50t",
          label: "12 + 50t",
          correct: false,
          fbEn: "Check the roles: $50 is the one-time fee (constant), and $12 is per ticket (multiplies t).",
          fbEs: "Revisa los roles: $50 es la tarifa única (constante) y $12 es por boleto (multiplica a t).",
        },
      ],
    },
    step2: {
      promptEn:
        "Now unlock the safe! Using 12t + 50, what is the true total cost for t = 4 tickets (in dollars)?",
      promptEs:
        "¡Ahora abre la caja fuerte! Usando 12t + 50, ¿cuál es el costo total real para t = 4 boletos (en dólares)?",
      answer: 98,
      unit: "$",
      hintEn: "Substitute t = 4 into 12t + 50: first 12 × 4 = 48, then add 50.",
      hintEs: "Sustituye t = 4 en 12t + 50: primero 12 × 4 = 48, luego suma 50.",
      resolveEn:
        "Mystery solved! 12(4) + 50 = 48 + 50 = $98 — saving $150 from the treasurer's $248 mistake!",
      resolveEs:
        "¡Misterio resuelto! 12(4) + 50 = 48 + 50 = $98, ¡corrigiendo el error de $248 del tesorero!",
    },
  };
}

function buildLessonDerivedMystery(config, lessonId) {
  const notes = config?.familyNotes || {};
  const v3 = notes.v3 || {};
  const glitch = v3.glitch || null;
  const transfer = v3.transfer || null;
  const baseId = String(lessonId || "").replace(/-part[23]$/, "");
  if (baseId === "6-5") {
    return buildConcertBudgetMystery();
  }

  const titleEn = config?.title ? `Mystery: ${config.title}` : "Tonight's Math Mystery";
  const titleEs = config?.titleEs ? `Misterio: ${config.titleEs}` : "El misterio matemático de hoy";
  const storyEn =
    v3.hook?.story?.en ||
    notes.learningTonight?.en ||
    "Inspect the clues below to spot the math mistake and verify the true solution.";
  const storyEs =
    v3.hook?.story?.es ||
    notes.learningTonight?.es ||
    "Revisa las pistas para encontrar el error matemático y comprobar la solución correcta.";

  const clues = [
    {
      id: "clue-goal",
      icon: "🔍",
      labelEn: "Clue 1: The Situation",
      labelEs: "Pista 1: La situación",
      textEn: v3.hook?.guess?.en || notes.bigIdea?.en || storyEn,
      textEs: v3.hook?.guess?.es || notes.bigIdea?.es || storyEs,
    },
    {
      id: "clue-claim",
      icon: "📋",
      labelEn: "Clue 2: The Suspect Claim",
      labelEs: "Pista 2: La afirmación sospechosa",
      textEn:
        glitch?.claim?.en ||
        v3.worked?.steps?.[0]?.en ||
        "Check every number and unit carefully before deciding what operation fits.",
      textEs:
        glitch?.claim?.es ||
        v3.worked?.steps?.[0]?.es ||
        "Revisa cada número y unidad con cuidado antes de decidir qué operación usar.",
    },
  ];

  const sourceQ = glitch?.choices?.length ? glitch : transfer;
  if (!sourceQ || !Array.isArray(sourceQ.choices) || !sourceQ.choices.length) {
    return null;
  }

  const options = sourceQ.choices.slice(0, 4).map((ch, i) => ({
    id: `opt_${i}`,
    label: String(ch.en ?? ch.label ?? ""),
    labelEs: String(ch.es ?? ch.en ?? ch.label ?? ""),
    correct: Boolean(ch.correct),
    fbEn:
      ch.why?.en ||
      (ch.correct
        ? "Spot on! You used the mathematical relationship."
        : "Check the relationship in Clue 1 and try again."),
    fbEs:
      ch.why?.es ||
      (ch.correct
        ? "¡Exacto! Usaste la relación matemática."
        : "Revisa la relación en la Pista 1 e inténtalo de nuevo."),
  }));

  return {
    id: `mystery-${lessonId}`,
    titleEn,
    titleEs,
    storyEn: storyEn.slice(0, 120),
    storyEs: storyEs.slice(0, 120),
    clues: clues.map((c) => ({
      ...c,
      textEn: c.textEn.slice(0, 120),
      textEs: c.textEs.slice(0, 120),
    })),
    step1: {
      promptEn: sourceQ.prompt?.en || "Which solves the mystery?",
      promptEs: sourceQ.prompt?.es || "¿Qué resuelve el misterio?",
      options: options.slice(0, 3).map((o) => ({
        ...o,
        fbEn: o.fbEn.slice(0, 80),
        fbEs: o.fbEs.slice(0, 80),
      })),
    },
    step2: null,
  };
}

export function renderMathMysterySection(config, lessonId) {
  const baseId = String(lessonId || "").replace(/-part[23]$/, "");
  if (baseId !== "6-5") {
    return `<section class="mm-mystery" id="hw_math_mystery_studio" data-mm-lesson="${esc(lessonId)}" aria-label="Math Mystery Network"></section>`;
  }
  const mystery = buildLessonDerivedMystery(config, lessonId);
  if (!mystery) return "";
  const jsonText = JSON.stringify(mystery).replace(/</g, "\\u003c");

  return `
    <section class="mm-mystery" id="hw_math_mystery_studio" aria-labelledby="mm_title">
      <script type="application/json" id="hw_mystery_data">${jsonText}</script>
      <div class="mm-head">
        <span class="mm-badge" aria-hidden="true">🕵️</span>
        <div>
          <p class="mm-eyebrow">${bi("Math Mystery Network", "Red de Misterios Matemáticos")}</p>
          <h3 class="mm-title" id="mm_title">${bi(mystery.titleEn, mystery.titleEs)}</h3>
        </div>
      </div>
      <p class="mm-story">${bi(mystery.storyEn, mystery.storyEs)}</p>
      <div class="mm-clues" role="list" aria-label="${esc("Mystery clues")}">
        ${mystery.clues
          .map(
            (c, i) => `
          <button type="button" class="mm-clue-card" data-mm-clue="${i}" aria-expanded="false">
            <span class="mm-clue-top"><span aria-hidden="true">${esc(c.icon)}</span> <strong>${bi(c.labelEn, c.labelEs)}</strong></span>
            <span class="mm-clue-body" hidden>${bi(c.textEn, c.textEs)}</span>
          </button>`,
          )
          .join("")}
      </div>
      <div class="mm-stage" data-mm-stage="1">
        <p class="mm-prompt">${bi(mystery.step1.promptEn, mystery.step1.promptEs)}</p>
        <div class="mm-options" role="group">
          ${mystery.step1.options
            .map(
              (o) => `
            <button type="button" class="mm-opt-btn" data-mm-opt="${esc(o.id)}">
              ${o.labelEs ? bi(o.label, o.labelEs) : esc(o.label)}
            </button>`,
            )
            .join("")}
        </div>
        <p class="mm-feedback" data-mm-fb="1" role="status" aria-live="polite" hidden></p>
      </div>
      ${
        mystery.step2
          ? `<div class="mm-stage" data-mm-stage="2" hidden>
              <p class="mm-prompt">${bi(mystery.step2.promptEn, mystery.step2.promptEs)}</p>
              <div class="mm-input-row">
                <span class="mm-unit" aria-hidden="true">${esc(mystery.step2.unit || "")}</span>
                <input type="number" class="mm-num-input" data-mm-answer aria-label="${esc(mystery.step2.promptEn)}" />
                <button type="button" class="mm-check-btn" data-mm-check>${bi("Unlock", "Desbloquear")}</button>
              </div>
              <p class="mm-feedback" data-mm-fb="2" role="status" aria-live="polite" hidden></p>
            </div>`
          : ""
      }
      <div class="mm-resolved" data-mm-resolved hidden role="status" aria-live="polite"></div>
    </section>`;
}
