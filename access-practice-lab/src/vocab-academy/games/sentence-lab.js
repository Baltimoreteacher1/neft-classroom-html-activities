// Sentence Lab — write a sentence with a target word, check it against rules that are shown in plain words,
// then revise it. The checks are rule-based and list exactly what they look for: they do not grade ideas, and
// they never claim to know whether the meaning is right. Finished sentences are handed to onWork() so a teacher
// can read them. Typing is never lost: the draft is kept while you switch screens.
import { clueStems } from "./context-detective.js";
import { esc, fbHTML, html, icon, mountGame, raw } from "./kit.js";
import { clean, findForm, isContent, maskForm, norm, tokenize, wordsIn } from "./text.js";

export const TITLE = ["Sentence Lab", "Laboratorio de oraciones"];
const COUNT = { early: 3, "upper-elem": 4, middle: 5, high: 5 };
const MIN_WORDS = { early: 3, "upper-elem": 5, middle: 7, high: 7 };
const CONNECTORS =
  /\b(because|when|while|after|before|so|since|although|though|if|but|until|unless|which|who|that)\b/i;

/** The rules. required ones must pass to finish; extra ones are suggestions for the revision step. */
export function checkSentence(text, word, { band = "middle" } = {}) {
  const t = clean(text);
  const min = MIN_WORDS[band] || 7;
  const models = [
    word.ex,
    word.ex2,
    word.cloze && word.cloze.s?.replace("___", word.cloze.f),
    word.cloze2 && word.cloze2.s?.replace("___", word.cloze2.f),
    word.frame && word.frame.replace("___", ""),
  ]
    .filter(Boolean)
    .map((x) =>
      norm(x)
        .replace(/[^a-z0-9 ]/g, "")
        .trim(),
    );
  const flat = norm(t)
    .replace(/[^a-z0-9 ]/g, "")
    .trim();
  const stems = clueStems(word);
  const own = norm(word.hw).slice(0, 5);
  const clueWord = tokenize(t).some(
    (k) =>
      k.w && isContent(k.t) && norm(k.t).slice(0, 5) !== own && stems.has(norm(k.t).slice(0, 5)),
  );
  const checks = [
    {
      id: "word",
      required: true,
      ok: Boolean(findForm(t, word)),
      en: `Uses the word “${word.hw}”`,
      es: `Usa la palabra “${word.hw}”`,
    },
    {
      id: "form",
      required: true,
      ok: /^["“']?[A-ZÁÉÍÓÚÑ]/.test(t) && /[.!?]["”']?$/.test(t),
      en: "Starts with a capital letter and ends with . ! or ?",
      es: "Empieza con mayúscula y termina con . ! o ?",
    },
    {
      id: "length",
      required: true,
      ok: wordsIn(t) >= min,
      en: `Has at least ${min} words`,
      es: `Tiene al menos ${min} palabras`,
    },
    {
      id: "own",
      required: true,
      ok: flat.length > 0 && !models.includes(flat),
      en: "Is your own sentence, not a copy of an example",
      es: "Es tu propia oración, no una copia de un ejemplo",
    },
    {
      id: "clue",
      required: false,
      ok: clueWord,
      en: "Has a clue word that shows what the word means",
      es: "Tiene una palabra pista que muestra el significado",
    },
    {
      id: "detail",
      required: false,
      ok: CONNECTORS.test(t) || wordsIn(t) >= min + 4,
      en: "Adds a reason or detail (because, when, so, or a longer sentence)",
      es: "Agrega una razón o detalle (porque, cuando, así que, o una oración más larga)",
    },
  ];
  return {
    checks,
    passed: checks.filter((c) => c.required).every((c) => c.ok),
    extras: checks.filter((c) => !c.required && c.ok).length,
  };
}

/** The prompt for a word: the unit's own produce.sentences line that names it, else a plain one. */
export function promptFor(pool, word) {
  for (const p of pool.unit?.produce?.sentences || []) if (findForm(p, word)) return clean(p);
  return `Write a sentence that uses the word “${word.hw}”. Make the meaning clear.`;
}

/** Pure engine: words for this run, each with its prompt. */
export function buildLab(pool, rng, { count } = {}) {
  const words = rng.shuffle(pool.words).slice(0, count || COUNT[pool.band] || 4);
  return words.map((w) => ({
    wordId: w.id,
    prompt: promptFor(pool, w),
    frame: w.frame || "",
    phase: "write",
    text: "",
    first: "",
    tries: 0,
    revised: false,
    shownModel: false,
    last: null,
  }));
}

/** The sentence split around the target word, for the workbench read-back. Pure: { before, form, after } (form is "" when absent). */
export function readbackParts(text, word) {
  const t = String(text ?? "");
  const hit = findForm(t, word);
  if (!hit) return { before: t, form: "", after: "" };
  return {
    before: t.slice(0, hit.index),
    form: t.slice(hit.index, hit.index + hit.length),
    after: t.slice(hit.index + hit.length),
  };
}
/** The read-back line as markup: the sentence with the target word marked. Plain words stay plain; the mark is also a bold. */
export function readbackHTML(text, word) {
  const p = readbackParts(text, word);
  if (!p.form) return esc(p.before);
  return `${esc(p.before)}<mark class="va-hit">${esc(p.form)}</mark>${esc(p.after)}`;
}
const canSpeak = () => typeof globalThis.speechSynthesis !== "undefined";

const startOfFrame = (frame) =>
  clean(String(frame).split("___")[0]) + (String(frame).startsWith("___") ? "" : " ");

function listView(item, word, env) {
  const I = env.I;
  const res = item.last;
  const rows = (res?.checks || checkSentence("", word, { band: env.band }).checks).map((c) => {
    const state = res ? (c.ok ? "ok" : c.required ? "no" : "extra") : "idle";
    const mark =
      state === "ok"
        ? icon("check")
        : state === "no"
          ? icon("x")
          : state === "extra"
            ? icon("star")
            : icon("pin");
    const label =
      state === "ok"
        ? I.S("Done", "Hecho")
        : state === "no"
          ? I.S("Not yet", "Todavía no")
          : state === "extra"
            ? I.S("Try this to make it stronger", "Prueba esto para mejorarla")
            : I.S("Looks for", "Busca");
    return html`<li class="vag-rule" data-state="${state}">
      ${mark}<span
        ><span class="vag-sr">${label}: </span
        >${I.T(c.en, c.es)}${c.required ? "" : html` <em class="vag-fine">(${I.T("extra", "extra")})</em>`}</span
      >
    </li>`;
  });
  return html`<ul
    class="vag-rules"
    aria-label="${I.S("What the check looks for", "Qué revisa la comprobación")}"
  >
    ${rows}
  </ul>`;
}

const spec = {
  id: "sentence-lab",
  title: TITLE,
  persist: true,
  howTo: [
    [
      "Read the prompt. Write one sentence that uses the word and shows what it means.",
      "Lee la indicación. Escribe una oración que use la palabra y muestre su significado.",
    ],
    [
      "Choose Check my sentence. The list shows each rule and whether your sentence meets it. The rules are simple. They do not judge your ideas.",
      "Elige Revisar mi oración. La lista muestra cada regla y si tu oración la cumple. Las reglas son simples. No juzgan tus ideas.",
    ],
    [
      "When it passes, revise it to make it stronger, or keep it as it is.",
      "Cuando pase, revísala para mejorarla o déjala como está.",
    ],
    [
      "Stuck? Use the starter, the word bank, or Show a model. Using them never counts against you. Finished sentences are saved so your teacher can read them.",
      "¿Atascado? Usa el inicio, el banco de palabras o Mostrar un modelo. Usarlos nunca cuenta en tu contra. Las oraciones terminadas se guardan para que tu docente las lea.",
    ],
  ],
  keys: [
    ["Ctrl + Enter", ["check your sentence", "revisar tu oración"]],
    ["Tab", ["move between the box and the buttons", "moverse entre el cuadro y los botones"]],
  ],
  numberKeys: false,

  build: (env) => ({ items: buildLab(env.pool, env.rng), i: 0 }),
  valid: (s) => Array.isArray(s?.items) && s.items.length > 0,
  unplayable: (s) => !s.items.length,
  isDone: (s) => s.i >= s.items.length,
  progress: (s) => ({ done: Math.min(s.i, s.items.length), total: s.items.length }),

  view(s, env) {
    const I = env.I;
    const item = s.items[s.i];
    const word = env.pool.byId.get(item.wordId);
    const bank = env.sup.wordBank ? (env.pool.unit?.wida?.bank || []).slice(0, 8) : [];
    const res = item.last;
    const model = item.shownModel ? maskForm(word.ex || "", word) : null;
    const passed = item.phase === "revise";
    const used = Boolean(findForm(item.text, word));
    const rules = res?.checks.filter((c) => c.required) || [];
    const met = rules.filter((c) => c.ok).length;
    const state = !res ? "idle" : res.passed ? "pass" : "work";
    const snap = env.snapTile || "";
    env.snapTile = "";
    return html`<div class="vag-qcard vag-lab va-bench" data-state="${state}">
      <p class="vag-qtype">
        <strong>${I.T("Word", "Palabra")} ${s.i + 1} ${I.T("of", "de")} ${s.items.length}</strong> ·
        ${passed ? I.T("Revise", "Revisa") : I.T("Write", "Escribe")}
        <span class="vag-badge">${word.hw}</span>
      </p>
      <p class="vag-q">${item.prompt}</p>
      ${env.speakBtn(item.prompt, "")}
      <div class="va-bench-top">
        <p class="va-slot" data-slot data-word="${word.hw}" data-used="${used}">
          <span class="va-slot-l">${I.T("Today's word", "La palabra de hoy")}</span>
          <strong class="va-slot-w" lang="en">${word.hw}</strong>
          <span class="va-slot-s"><span class="va-slot-on">${icon("check")}${I.T("It is in your sentence", "Está en tu oración")}</span><span class="va-slot-off">${icon("pin")}${I.T("Waiting for your sentence", "Esperando tu oración")}</span></span>
        </p>
        ${
          rules.length
            ? html`<p class="va-gauge" role="img" aria-label="${I.S(`${met} of ${rules.length} rules met`, `${met} de ${rules.length} reglas cumplidas`)}">
                ${rules.map((c) => html`<i class="va-gauge-seg" data-ok="${c.ok}"></i>`)}<span class="va-gauge-t">${met}/${rules.length}</span>
              </p>`
            : ""
        }
      </div>
      ${env.sup.rehearsal || env.band === "early" ? html`<p class="vag-fine">${icon("speaking")}${I.T("Say your sentence out loud first, then write it.", "Di tu oración en voz alta primero y luego escríbela.")}</p>` : ""}
      ${env.sup.glossaryEs && word.es?.gloss ? html`<p class="vag-fine" lang="es">${word.hw}: ${word.es.gloss}</p>` : ""}
      <p class="vag-fine">${I.T("Meaning", "Significado")}: ${word.def}</p>
      <label class="vag-label" for="${env.uid}-text"
        >${passed ? I.T("Make your sentence stronger. Change it, then check again.", "Mejora tu oración. Cámbiala y revisa otra vez.") : I.T("Your sentence", "Tu oración")}</label
      >
      <textarea
        id="${env.uid}-text"
        class="vag-text"
        rows="${env.band === "early" ? 3 : 4}"
        data-text
        data-fk="text"
        autocomplete="off"
        spellcheck="true"
      >
${item.text}</textarea>
      <div class="va-readback-wrap">
        <p class="va-readback-l">${icon("speaking")}${I.T("Your sentence, read back", "Tu oración, leída de nuevo")}</p>
        <p class="va-readback" data-readback data-snap="${snap ? "1" : ""}">${raw(readbackHTML(item.text, word))}</p>
        ${canSpeak() ? html`<button type="button" class="vag-listen va-readaloud" data-speak="${clean(item.text)}" data-readaloud aria-label="${I.S("Read my sentence aloud", "Leer mi oración en voz alta")}">${icon("volume")}<span>${I.T("Read it aloud", "Leer en voz alta")}</span></button>` : ""}
      </div>
      <div class="vag-actions">
        <button type="button" class="btn btn-primary" data-check data-fk="check">
          ${icon("check")}${passed ? I.T("Check my revision", "Revisar mi revisión") : I.T("Check my sentence", "Revisar mi oración")}
        </button>
        ${item.frame && (env.sup.frames || env.sup.starters) ? html`<button type="button" class="btn small" data-starter data-fk="starter">${icon("writing")}${I.T("Use the starter", "Usar el inicio")}</button>` : ""}
        ${item.shownModel ? "" : html`<button type="button" class="btn small" data-model data-fk="model">${icon("bulb")}${I.T("Show a model", "Mostrar un modelo")}</button>`}
        ${passed ? html`<button type="button" class="btn" data-keep data-fk="keep">${icon("save")}${I.T("Keep it and finish this word", "Dejarla y terminar esta palabra")}</button>` : ""}
      </div>
      ${item.frame && (env.sup.frames || env.sup.starters) ? html`<p class="vag-fine">${I.T("Starter", "Inicio")}: <em>${item.frame}</em></p>` : ""}
      ${
        bank.length
          ? html`<p class="va-tray-l">${icon("pin")}${I.T("Word tiles: tap one and it snaps onto the end of your sentence.", "Fichas de palabras: toca una y se pega al final de tu oración.")}</p><ul class="vag-bank va-tray" aria-label="${I.S("Word bank", "Banco de palabras")}">
              ${bank.map((b, n) => html`<li><button type="button" class="vag-chip va-tile" data-bank="${b}" data-fk="bank-${n}">${b}</button></li>`)}
            </ul>`
          : ""
      }
      ${model?.found ? html`<blockquote class="vag-sentence">${I.T("A model sentence with the word blanked out:", "Una oración modelo con la palabra tapada:")} ${model.text}</blockquote>` : ""}
      ${listView(item, word, env)}
      ${res ? (res.passed ? fbHTML("ok", passed ? I.T("Your sentence meets every rule. Revise it to make it stronger, or keep it.", "Tu oración cumple todas las reglas. Mejórala o déjala como está.") : I.T("Your sentence meets every rule.", "Tu oración cumple todas las reglas."), I) : fbHTML("retry", I.T("Not every rule is met yet. Fix the ones marked Not yet, then check again. You can retry as often as you like.", "Aún no se cumplen todas las reglas. Arregla las marcadas con Todavía no y revisa otra vez. Puedes intentar las veces que quieras."), I)) : ""}
    </div>`;
  },

  input(el, s, env) {
    if (!el.matches?.("[data-text]")) return false;
    s.items[s.i].text = el.value;
    env.save();
    return false;
  },
  key(ev, s, env) {
    if (ev.key === "Enter" && (ev.ctrlKey || ev.metaKey) && ev.target.matches?.("[data-text]"))
      return doCheck(s, env);
    return false;
  },
  click(el, s, env) {
    const item = s.items[s.i];
    const word = env.pool.byId.get(item.wordId);
    if (el.closest("[data-check]")) return doCheck(s, env);
    if (el.closest("[data-model]")) {
      item.shownModel = true;
      env.use("model");
      return true;
    }
    if (el.closest("[data-starter]")) {
      item.text = `${startOfFrame(item.frame)}${item.text.replace(/^\s+/, "")}`.replace(
        /\s+$/,
        " ",
      );
      env.use("frames");
      return true;
    }
    const bank = el.closest("[data-bank]");
    if (bank) {
      item.text = `${clean(item.text)}${item.text ? " " : ""}${bank.dataset.bank} `;
      env.use("wordBank");
      env.snapTile = bank.dataset.bank;
      return true;
    }
    if (el.closest("[data-keep]")) return finishWord(s, env, word, item);
    return false;
  },
  /** Live workbench: as the learner types, the read-back, the word slot and the read-aloud text follow the box. Display only. */
  after(body, s, env) {
    const box = body.querySelector("[data-text]");
    if (!box || box.dataset.vaLive) return;
    box.dataset.vaLive = "1";
    const word = env.pool.byId.get(s.items[s.i]?.wordId);
    if (!word) return;
    box.addEventListener("input", () => {
      const back = body.querySelector("[data-readback]");
      if (back) {
        back.innerHTML = readbackHTML(box.value, word);
        back.dataset.snap = "";
      }
      const read = body.querySelector("[data-readaloud]");
      if (read) read.dataset.speak = clean(box.value);
      const slot = body.querySelector("[data-slot]");
      if (slot) {
        const used = Boolean(findForm(box.value, word));
        slot.dataset.used = String(used);
      }
    });
  },
  extra: (s) => ({
    sentences: s.items
      .filter((x) => x.phase === "saved")
      .map((x) => ({ wordId: x.wordId, text: clean(x.text), revised: x.revised })),
  }),
  finishExtra(s, env) {
    const I = env.I;
    const saved = s.items.filter((x) => x.phase === "saved");
    return html`<section class="vag-fin-col">
      <h3>${icon("writing")}${I.T("Your sentences", "Tus oraciones")}</h3>
      <ul class="vag-mine">
        ${saved.map((x) => html`<li><strong>${env.pool.byId.get(x.wordId)?.hw}:</strong> ${x.text}</li>`)}
      </ul>
      <p class="vag-fine">
        ${I.T("These are saved on this device for your teacher to read.", "Estas se guardan en este dispositivo para que tu docente las lea.")}
      </p>
    </section>`;
  },
};

function doCheck(s, env) {
  const item = s.items[s.i];
  const word = env.pool.byId.get(item.wordId);
  const text = clean(item.text);
  if (!text) {
    env.say(env.I.S("Write your sentence first.", "Escribe tu oración primero."));
    return false;
  }
  const res = checkSentence(text, word, { band: env.band });
  const firstCheck = item.tries === 0;
  item.tries += 1;
  item.last = res;
  if (res.passed && item.phase === "write") {
    item.phase = "revise";
    item.first = text;
    env.report({
      wordId: item.wordId,
      dim: "prod",
      ok: true,
      firstTry: firstCheck,
      kind: "sentence",
    });
    env.say(
      env.I.S(
        "Your sentence meets every rule. You can revise it.",
        "Tu oración cumple todas las reglas. Puedes revisarla.",
      ),
    );
  } else if (res.passed && item.phase === "revise") {
    item.revised = text !== item.first;
    env.say(
      item.revised
        ? env.I.S("Revision checked.", "Revisión revisada.")
        : env.I.S("No change yet.", "Aún sin cambios."),
    );
  } else env.say(env.I.S("Some rules are not met yet.", "Aún no se cumplen algunas reglas."));
  return true;
}

function finishWord(s, env, word, item) {
  const text = clean(item.text);
  const res = checkSentence(text, word, { band: env.band });
  if (!res.passed) return doCheck(s, env);
  item.revised = text !== item.first;
  item.phase = "saved";
  item.text = text;
  try {
    env.opts.onWork?.({
      kind: "sentence",
      gameId: "sentence-lab",
      wordId: item.wordId,
      text,
      first: item.first,
      revised: item.revised,
      extras: res.extras,
      at: new Date().toISOString(),
    });
  } catch (error) {
    console.error("onWork failed", error);
  }
  s.i += 1;
  return true;
}

export default {
  id: "sentence-lab",
  title: TITLE[0],
  titleEs: TITLE[1],
  blurb: "Write a sentence with a target word, see exactly what the rules check, then revise it.",
  blurbEs: "Escribe una oración con la palabra, mira qué revisan las reglas y mejórala.",
  purpose: "Use new words in your own sentences, and make them stronger.",
  minGrade: "1",
  maxGrade: "12",
  dims: ["prod"],
  mount: (root, opts) => mountGame(root, opts, spec),
  engine: { build: buildLab, check: checkSentence, prompt: promptFor },
};
