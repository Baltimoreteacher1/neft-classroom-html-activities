// Practice modes for a vocabulary set: flashcards, match, sentence completion, quiz, and a class presentation.
// One run at a time (module state). Nothing is timed and nothing is scored: a miss gets a calm hint, and after two
// misses the answer is shown, the way the rest of the lab works. Learners only read and answer; they cannot edit.
import { announce, html } from "../util.js";
import { clozeRounds, matchRound, quizRounds, sameAnswer, shuffle } from "./model.js";

/** Leaving a run (the set home page) forgets it, so coming back starts fresh. */
export const resetRun = () => {
  run.key = "";
};

export const MODES = ["cards", "match", "cloze", "quiz", "present"];

export const MODE_INFO = {
  cards: {
    en: "Flashcards",
    es: "Tarjetas",
    textEn: "Flip a card, then say if you knew it.",
    textEs: "Da vuelta a la tarjeta y di si la sabías.",
  },
  match: {
    en: "Match",
    es: "Relacionar",
    textEn: "Match each word to its meaning.",
    textEs: "Relaciona cada palabra con su significado.",
  },
  cloze: {
    en: "Finish the sentence",
    es: "Completa la oración",
    textEn: "Type the missing word.",
    textEs: "Escribe la palabra que falta.",
  },
  quiz: {
    en: "Which word?",
    es: "¿Qué palabra?",
    textEn: "Read a meaning, pick the word.",
    textEs: "Lee un significado y elige la palabra.",
  },
  present: {
    en: "Present to the class",
    es: "Presentar a la clase",
    textEn: "Big cards for the whole room.",
    textEs: "Tarjetas grandes para todo el salón.",
  },
};

export const run = {
  key: "",
  i: 0,
  flipped: false,
  showTranslation: true,
  order: [],
  known: new Set(),
  missed: [],
  rounds: [],
  skipped: 0,
  tries: 0,
  tried: [],
  firstTry: 0,
  solved: false,
  msg: "",
  bank: false,
  meaning: false,
  remaining: [],
  round: null,
  matched: new Set(),
  sel: null,
  done: false,
};

/** Reset the run when the set, mode or shuffle changes. `items` are the set's items. */
export function startRun(setKey, mode, items, { only = null, force = false } = {}) {
  // A redraw must not restart the run, so the identity is the set and the mode; "only" and "force" are explicit restarts.
  const key = `${setKey}:${mode}`;
  if (run.key === key && !force) return;
  const pool = only ? items.filter((i) => only.includes(i.id)) : items;
  Object.assign(run, {
    key,
    i: 0,
    flipped: false,
    order: pool,
    known: new Set(),
    missed: [],
    rounds: [],
    skipped: 0,
    tries: 0,
    tried: [],
    firstTry: 0,
    solved: false,
    msg: "",
    bank: false,
    meaning: false,
    remaining: [],
    round: null,
    matched: new Set(),
    sel: null,
    done: false,
  });
  if (mode === "cloze") Object.assign(run, clozeRounds(pool));
  if (mode === "quiz") run.rounds = quizRounds(pool);
  if (mode === "match") {
    run.remaining = pool.filter((i) => i.definition);
    run.round = matchRound(run.remaining);
  }
}

const doneCard = (I, mode, total, extra = "") =>
  html`<div class="vs-done" role="status" tabindex="-1" id="vsFocus">
    <h2>${I.S("All done", "Terminaste")}</h2>
    ${extra}
    <div class="vs-row">
      <button type="button" class="btn" data-vs="restart">
        ${I.S("Start over", "Empezar de nuevo")}
      </button>
    </div>
  </div>`;

function cardsHTML(I, mode) {
  const big = mode === "present";
  if (run.done) {
    const miss = run.missed.length;
    return doneCard(
      I,
      mode,
      run.order.length,
      html`<p>
          ${I.S(`You knew ${run.known.size} of ${run.order.length} words.`, `Sabías ${run.known.size} de ${run.order.length} palabras.`)}
        </p>
        ${miss ? html`<div class="vs-row"><button type="button" class="btn ghost" data-vs="again-missed">${I.S("Practice the ones I missed", "Practicar las que fallé")}</button></div>` : ""}`,
    );
  }
  const item = run.order[run.i];
  if (!item) return "";
  const back = html`<p class="vs-def">${item.definition}</p>
    ${item.example ? html`<p class="vs-ex">${item.example}</p>` : ""}
    ${run.showTranslation && item.translation ? html`<p class="vs-tr" lang="und">${item.translation}</p>` : ""}`;
  return html`<div class="vs-stage${big ? " vs-big" : ""}">
    <p class="vs-count" id="vsFocus" tabindex="-1">
      ${I.S(`Card ${run.i + 1} of ${run.order.length}`, `Tarjeta ${run.i + 1} de ${run.order.length}`)}
    </p>
    <button
      type="button"
      class="vs-card"
      data-vs="flip"
      aria-pressed="${run.flipped}"
      aria-label="${I.S("Flip card", "Dar vuelta a la tarjeta")}"
    >
      <span class="vs-term">${item.term}</span>
      ${run.flipped ? back : html`<span class="vs-hint">${I.S("Tap to see the meaning", "Toca para ver el significado")}</span>`}
    </button>
    <div class="vs-row vs-controls">
      <button type="button" class="btn ghost" data-vs="prev" ${run.i === 0 ? "disabled" : ""}>
        ${I.S("Previous", "Anterior")}
      </button>
      ${big ? "" : html`<button type="button" class="btn ghost" data-vs="again">${I.S("Again", "Otra vez")}</button><button type="button" class="btn" data-vs="got">${I.S("Got it", "Ya la sé")}</button>`}
      <button type="button" class="btn${big ? "" : " ghost"}" data-vs="next">
        ${I.S("Next", "Siguiente")}
      </button>
    </div>
    <div class="vs-row vs-tools">
      <label class="vs-check"
        ><input
          type="checkbox"
          data-vs-toggle="showTranslation"
          ${run.showTranslation ? "checked" : ""}
        />
        ${I.S("Show translation", "Mostrar traducción")}</label
      >
      <button type="button" class="ghost small" data-vs="shuffle">
        ${I.S("Shuffle", "Mezclar")}
      </button>
      ${big ? html`<button type="button" class="ghost small" data-vs="fullscreen">${I.S("Full screen", "Pantalla completa")}</button>` : ""}
    </div>
  </div>`;
}

function matchHTML(I) {
  if (run.done)
    return doneCard(
      I,
      "match",
      run.order.length,
      html`<p>${I.S("You matched every word.", "Relacionaste todas las palabras.")}</p>`,
    );
  const { terms, definitions } = run.round;
  const col = (list, side) =>
    list.map((x) => {
      const on = run.matched.has(x.id);
      const sel = run.sel && run.sel.side === side && run.sel.id === x.id;
      return html`<li>
        <button
          type="button"
          class="vs-pick"
          data-vs="pick"
          data-side="${side}"
          data-id="${x.id}"
          aria-pressed="${sel}"
          ${on ? "disabled" : ""}
        >
          ${x.text}${on ? html` <span aria-hidden="true">✓</span><span class="sr-only">${I.S("matched", "relacionada")}</span>` : ""}
        </button>
      </li>`;
    });
  return html`<div class="vs-stage">
    <p class="vs-count" id="vsFocus" tabindex="-1">
      ${I.S("Pick a word, then pick its meaning.", "Elige una palabra y luego su significado.")}
    </p>
    <div class="vs-cols">
      <ul class="vs-list" aria-label="${I.S("Words", "Palabras")}">
        ${col(terms, "term")}
      </ul>
      <ul class="vs-list" aria-label="${I.S("Meanings", "Significados")}">
        ${col(definitions, "def")}
      </ul>
    </div>
    <p class="vs-msg" role="status">${run.msg}</p>
  </div>`;
}

function roundShell(I, label, body, isLast) {
  return html`<div class="vs-stage">
    <p class="vs-count" id="vsFocus" tabindex="-1">${label}</p>
    ${body}
    <p class="vs-msg" role="status">${run.msg}</p>
    ${run.solved ? html`<div class="vs-row"><button type="button" class="btn" data-vs="next-round">${isLast ? I.S("Finish", "Terminar") : I.S("Next", "Siguiente")}</button></div>` : ""}
  </div>`;
}

function clozeHTML(I, set) {
  if (run.done)
    return doneCard(
      I,
      "cloze",
      run.rounds.length,
      html`<p>
        ${I.S(`Finished ${run.rounds.length} sentences.`, `Terminaste ${run.rounds.length} oraciones.`)}
      </p>`,
    );
  if (!run.rounds.length)
    return html`<p class="vs-msg">
      ${I.S("Add an example sentence that uses each word to practice sentences.", "Agrega una oración de ejemplo con cada palabra para practicar oraciones.")}
    </p>`;
  const r = run.rounds[run.i];
  const bank = shuffle([...new Set(run.rounds.map((x) => x.term))].sort());
  const body = html`<p class="vs-sentence">${r.prompt}</p>
    ${run.meaning ? html`<p class="vs-ex">${I.S("Meaning:", "Significado:")} ${r.hint}</p>` : ""}
    ${run.bank ? html`<p class="vs-bank" aria-label="${I.S("Word bank", "Banco de palabras")}">${bank.map((w) => html`<span>${w}</span>`)}</p>` : ""}
    <label class="vs-field"
      ><span>${I.S("Missing word", "Palabra que falta")}</span
      ><input
        type="text"
        id="vsAnswer"
        data-vs-answer
        autocomplete="off"
        autocapitalize="off"
        spellcheck="false"
        ${run.solved ? "disabled" : ""}
    /></label>
    <div class="vs-row">
      <button type="button" class="btn" data-vs="check" ${run.solved ? "disabled" : ""}>
        ${I.S("Check", "Comprobar")}
      </button>
      <label class="vs-check"
        ><input type="checkbox" data-vs-toggle="bank" ${run.bank ? "checked" : ""} />
        ${I.S("Word bank", "Banco de palabras")}</label
      >
      <label class="vs-check"
        ><input type="checkbox" data-vs-toggle="meaning" ${run.meaning ? "checked" : ""} />
        ${I.S("Show meaning", "Mostrar significado")}</label
      >
    </div>
    ${run.skipped ? html`<p class="fine">${I.S(`${run.skipped} word(s) have no example sentence that uses them, so they are not here.`, `${run.skipped} palabra(s) no tienen una oración de ejemplo que las use, por eso no aparecen.`)}</p>` : ""}`;
  return roundShell(
    I,
    I.S(
      `Sentence ${run.i + 1} of ${run.rounds.length}`,
      `Oración ${run.i + 1} de ${run.rounds.length}`,
    ),
    body,
    run.i === run.rounds.length - 1,
  );
}

function quizHTML(I) {
  if (run.done)
    return doneCard(
      I,
      "quiz",
      run.rounds.length,
      html`<p>
        ${I.S(`${run.firstTry} of ${run.rounds.length} right on the first try.`, `${run.firstTry} de ${run.rounds.length} bien al primer intento.`)}
      </p>`,
    );
  if (!run.rounds.length)
    return html`<p class="vs-msg">
      ${I.S("Add a meaning for each word to use this quiz.", "Agrega un significado a cada palabra para usar este cuestionario.")}
    </p>`;
  const r = run.rounds[run.i];
  const body = html`<p class="vs-sentence">${r.prompt}</p>
    <ul class="vs-list">
      ${r.options.map((o) => html`<li><button type="button" class="vs-pick" data-vs="option" data-value="${o}" ${run.solved || (run.tried || []).includes(o) ? "disabled" : ""}>${o}</button></li>`)}
    </ul>`;
  return roundShell(
    I,
    I.S(
      `Question ${run.i + 1} of ${run.rounds.length}`,
      `Pregunta ${run.i + 1} de ${run.rounds.length}`,
    ),
    body,
    run.i === run.rounds.length - 1,
  );
}

export function practiceHTML(I, set, mode) {
  startRun(set.id, mode, set.items);
  if (mode === "match") return matchHTML(I);
  if (mode === "cloze") return clozeHTML(I, set);
  if (mode === "quiz") return quizHTML(I);
  return cardsHTML(I, mode);
}

const advance = () => {
  run.tried = [];
  run.tries = 0;
  run.solved = false;
  run.msg = "";
  const total = run.rounds.length;
  if (run.i + 1 >= total) run.done = true;
  else run.i += 1;
};

/** Handle one click inside a practice run. Returns true when the page should redraw. */
export function practiceClick(e, I, set, mode) {
  const toggle = e.target.closest("[data-vs-toggle]");
  if (toggle) {
    run[toggle.dataset.vsToggle] = toggle.checked;
    return true;
  }
  const t = e.target.closest("[data-vs]");
  if (!t || t.disabled) return false;
  const act = t.dataset.vs;
  if (act === "restart") {
    startRun(set.id, mode, set.items, { force: true });
    return true;
  }
  if (act === "again-missed") {
    const ids = run.missed.map((m) => m.id);
    startRun(set.id, mode, set.items, { only: ids, force: true });
    return true;
  }
  if (act === "shuffle") {
    run.order = shuffle(run.order);
    run.i = 0;
    run.flipped = false;
    return true;
  }
  if (act === "fullscreen") {
    document.documentElement.requestFullscreen?.().catch(() => {});
    return false;
  }
  if (mode === "cards" || mode === "present") return cardsClick(act);
  if (mode === "match") return matchClick(t, I, act);
  if (mode === "cloze" && act === "check") return clozeCheck(I);
  if (mode === "quiz" && act === "option") return quizPick(t, I);
  if (act === "next-round") {
    advance();
    return true;
  }
  return false;
}

function cardsClick(act) {
  const last = run.i >= run.order.length - 1;
  if (act === "flip") run.flipped = !run.flipped;
  else if (act === "prev") ((run.i = Math.max(0, run.i - 1)), (run.flipped = false));
  else if (act === "next" || act === "got" || act === "again") {
    const item = run.order[run.i];
    if (act === "got") run.known.add(item.id);
    if (act === "again" && !run.missed.some((m) => m.id === item.id)) run.missed.push(item);
    run.flipped = false;
    if (last) run.done = true;
    else run.i += 1;
  } else return false;
  return true;
}

function matchClick(t, I, act) {
  if (act !== "pick") return false;
  const pick = { side: t.dataset.side, id: t.dataset.id };
  if (!run.sel || run.sel.side === pick.side) {
    run.sel = run.sel && run.sel.side === pick.side && run.sel.id === pick.id ? null : pick;
    run.msg = "";
    return true;
  }
  if (run.sel.id === pick.id) {
    run.matched.add(pick.id);
    run.msg = I.S("Matched.", "Relacionadas.");
    announce(run.msg, { toast: false });
    run.sel = null;
    if (run.round.terms.every((x) => run.matched.has(x.id))) {
      run.remaining = run.remaining.filter((i) => !run.matched.has(i.id));
      if (run.remaining.length) {
        run.round = matchRound(run.remaining);
        run.matched = new Set();
        run.msg = I.S(
          "Round done. Here are more words.",
          "Ronda terminada. Aquí hay más palabras.",
        );
      } else run.done = true;
    }
  } else {
    run.msg = I.S(
      "Those two do not go together. Try another.",
      "Esas dos no van juntas. Prueba otra.",
    );
    announce(run.msg, { toast: false });
    run.sel = null;
  }
  return true;
}

function miss(I, answer, hintText) {
  run.tries += 1;
  if (run.tries >= 2) {
    run.solved = true;
    run.msg = I.S(`The answer is "${answer}".`, `La respuesta es "${answer}".`);
  } else run.msg = hintText;
  announce(run.msg, { toast: false });
}

function clozeCheck(I) {
  const r = run.rounds[run.i];
  const typed = document.getElementById("vsAnswer")?.value || "";
  if (sameAnswer(typed, r.answer)) {
    run.solved = true;
    if (run.tries === 0) run.firstTry += 1;
    run.msg = I.S("Yes.", "Sí.");
    announce(run.msg, { toast: false });
  } else {
    miss(
      I,
      r.answer,
      I.S(
        "Not yet. Check the spelling and the ending of the word.",
        "Todavía no. Revisa la ortografía y la terminación de la palabra.",
      ),
    );
  }
  return true;
}

function quizPick(t, I) {
  const r = run.rounds[run.i];
  const value = t.dataset.value;
  if (sameAnswer(value, r.answer)) {
    run.solved = true;
    if (run.tries === 0) run.firstTry += 1;
    run.msg = I.S("Yes.", "Sí.");
    announce(run.msg, { toast: false });
  } else {
    run.tried = [...(run.tried || []), value];
    miss(
      I,
      r.answer,
      I.S("Not that one. Read the meaning again.", "Esa no. Lee otra vez el significado."),
    );
  }
  return true;
}

/** Keyboard: arrows move through cards, Space or Enter flips. Returns true when handled. */
export function practiceKey(e, mode) {
  if (mode !== "cards" && mode !== "present") return false;
  if (e.target.closest("input, textarea, select")) return false;
  if (e.key === "ArrowRight") return cardsClick("next");
  if (e.key === "ArrowLeft") return cardsClick("prev");
  return false;
}

export { cardsClick };
