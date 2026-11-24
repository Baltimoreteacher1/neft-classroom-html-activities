/**
 * Language Bridge: two supports for families who read English, Spanish or both.
 *
 *   decorateThreeReads()  a "Read it 3 ways" button on every word problem. It opens the routine
 *                         teachers use with multilingual learners: (1) the story with the numbers
 *                         hidden, (2) tap each number and say what it counts, (3) the question.
 *                         Built only from the problem's own words; it never computes or shows an
 *                         answer.
 *   mountWordBridge()     a card on the Discover stop: which of tonight's math words are Spanish
 *                         "word twins" (equivalent / equivalente), the shared letters lit up, both
 *                         words read aloud, and a tap-to-match game. No score, no timer.
 *
 * Text logic lives in language-logic.mjs (node-tested on every page). Strings are bilingual and follow
 * the page's language switch; read-aloud uses the page's voice engine (window.hwVoice) and hides
 * itself when the device cannot speak. Nothing is stored or sent.
 */
import { bi, el, esc, reducedMotion } from "./kit.mjs";
import { cognate, sharedLetters, threeReads } from "./language-logic.mjs";

const voice = () => {
  const v = window.hwVoice;
  return v && typeof v.supported === "function" && v.supported() ? v : null;
};

/** A Listen button that reads `items` ([{text, lang}]) in order. Hidden when the device cannot speak. */
function sayButton(items, label = ["Listen", "Escuchar"], cls = "lb-say") {
  const b = el("button", cls, `<span aria-hidden="true">🔊</span> ${bi(label[0], label[1])}`);
  b.type = "button";
  b.setAttribute("aria-pressed", "false");
  const v = voice();
  if (!v) {
    b.hidden = true;
    return b;
  }
  b.addEventListener("click", () => {
    const list = typeof items === "function" ? items() : items;
    if (b.getAttribute("aria-pressed") === "true") v.stop();
    else v.run(list, b);
  });
  return b;
}

/** The family's reading mode right now: "en", "es" or "bilingual". */
function mode() {
  const c = document.body.classList;
  if (c.contains("lang-mode-es")) return "es";
  if (c.contains("lang-mode-bilingual")) return "bilingual";
  return "en";
}

/* ── Three Reads ───────────────────────────────────────────────────── */

const STEPS = [
  { icon: "📖", en: "The story", es: "La historia" },
  { icon: "🔢", en: "The numbers", es: "Los números" },
  { icon: "❓", en: "The question", es: "La pregunta" },
];

const T = {
  open: ["Read it 3 ways", "Léelo de 3 maneras"],
  r1: [
    "No numbers yet. What is happening in this story? Tell each other in your own words.",
    "Todavía sin números. ¿Qué pasa en esta historia? Cuéntenlo con sus propias palabras.",
  ],
  f1: ["This story is about ___.", "Esta historia trata de ___."],
  r2: [
    "Tap each number. Say what it counts or measures.",
    "Toca cada número. Di qué cuenta o qué mide.",
  ],
  f2: ["The number ___ tells us ___.", "El número ___ nos dice ___."],
  r3: [
    "This is what the problem wants. Say it before you solve.",
    "Esto es lo que pide el problema. Dilo antes de resolver.",
  ],
  f3: ["We need to find ___.", "Necesitamos hallar ___."],
  blank: ["a number", "un número"],
  back: ["Back", "Atrás"],
  next: ["Next read", "Siguiente lectura"],
  solve: ["Start solving", "Empezar a resolver"],
  close: ["Close", "Cerrar"],
  say: ["Say it like this:", "Díganlo así:"],
};

const plainStory = (r, blankWord) =>
  r.story
    .map((s) => (s.blank ? ` ${blankWord} ` : s.text))
    .join("")
    .replace(/\s+/g, " ")
    .trim();

/** One read's text for one language, as HTML. */
function readHtml(r, step, lang) {
  if (!r) return "";
  if (step === 0) {
    return r.story
      .map((s) =>
        s.blank
          ? `<span class="lb-blank" role="img" aria-label="${esc(T.blank[lang === "es" ? 1 : 0])}">?</span>`
          : esc(s.text),
      )
      .join("");
  }
  if (step === 1) {
    let n = 0;
    return r.numbers
      .map((s) => {
        if (!s.num) return esc(s.text);
        const i = n++;
        /* Tapped, a number shows the word the story puts after it ("crayons"); with none, just a check. */
        const what = s.unit ? esc(s.unit) : "";
        return `<button type="button" class="lb-num" data-lb-num="${i}" aria-pressed="false"><span class="lb-num__v">${esc(s.num)}</span><span class="lb-num__what"></span><template>${what}</template></button>`;
      })
      .join("");
  }
  return `<mark class="lb-question">${esc(r.question || r.story.at(-1)?.text || "")}</mark>`;
}

function frame(en, es) {
  return `<p class="lb-frame"><span class="lb-frame__k">${bi(T.say[0], T.say[1])}</span> <span class="lb-frame__t">${bi(en, es)}</span></p>`;
}

function buildReads(section, rEn, rEs) {
  const panel = el("div", "lb-reads");
  panel.setAttribute("role", "group");
  panel.setAttribute("aria-label", mode() === "es" ? T.open[1] : T.open[0]);
  let step = 0;

  const dots = STEPS.map(
    (s, i) =>
      `<li class="lb-dot" data-lb-dot="${i}"><span class="lb-dot__n" aria-hidden="true">${i + 1}</span><span class="lb-dot__l"><span aria-hidden="true">${s.icon}</span> ${bi(s.en, s.es)}</span></li>`,
  ).join("");
  panel.innerHTML = `
    <ol class="lb-dots">${dots}</ol>
    <div class="lb-card" tabindex="-1">
      <p class="lb-card__do"></p>
      <p class="lb-card__text"><span class="lang-en"></span><span class="lang-es" lang="es"></span></p>
      <p class="lb-tally" aria-live="polite"></p>
      <div class="lb-card__frame"></div>
      <div class="lb-card__say"></div>
    </div>
    <div class="lb-nav">
      <button type="button" class="lb-btn" data-lb="back">${bi(T.back[0], T.back[1])}</button>
      <button type="button" class="lb-btn lb-btn--go" data-lb="next">${bi(T.next[0], T.next[1])} <span aria-hidden="true">→</span></button>
    </div>`;

  const card = panel.querySelector(".lb-card");
  const textEn = card.querySelector(".lb-card__text .lang-en");
  const textEs = card.querySelector(".lb-card__text .lang-es");
  const tally = card.querySelector(".lb-tally");
  const back = panel.querySelector('[data-lb="back"]');
  const next = panel.querySelector('[data-lb="next"]');

  const sayItems = () => {
    const en =
      step === 0 ? plainStory(rEn, T.blank[0]) : step === 1 ? section.__lbEn : rEn.question || plainStory(rEn, T.blank[0]);
    const es = rEs
      ? step === 0
        ? plainStory(rEs, T.blank[1])
        : step === 1
          ? section.__lbEs
          : rEs.question || plainStory(rEs, T.blank[1])
      : "";
    const m = mode();
    const list = [];
    if (m !== "es") list.push({ text: en, lang: "en" });
    if (m !== "en" && es) list.push({ text: es, lang: "es" });
    if (!list.length) list.push({ text: en, lang: "en" });
    return list;
  };

  function updateTally() {
    if (step !== 1) {
      tally.hidden = true;
      return;
    }
    const lang = mode() === "es" ? "es" : "en";
    const host = lang === "es" ? textEs : textEn;
    const all = host.querySelectorAll(".lb-num");
    const done = host.querySelectorAll('.lb-num[aria-pressed="true"]').length;
    tally.hidden = false;
    tally.innerHTML = bi(
      `${done} of ${all.length} numbers talked about${done === all.length && all.length ? " ✓" : ""}`,
      `${done} de ${all.length} números comentados${done === all.length && all.length ? " ✓" : ""}`,
    );
  }

  function render(focus) {
    const [doEn, doEs] = [T.r1, T.r2, T.r3][step];
    const [fEn, fEs] = [T.f1, T.f2, T.f3][step];
    card.dataset.step = String(step);
    card.querySelector(".lb-card__do").innerHTML = bi(doEn, doEs);
    textEn.innerHTML = readHtml(rEn, step, "en");
    textEs.innerHTML = rEs ? readHtml(rEs, step, "es") : readHtml(rEn, step, "en");
    card.querySelector(".lb-card__frame").innerHTML = frame(fEn, fEs);
    const say = card.querySelector(".lb-card__say");
    say.replaceChildren(sayButton(sayItems));
    panel.querySelectorAll(".lb-dot").forEach((d, i) => {
      d.classList.toggle("is-now", i === step);
      d.classList.toggle("is-done", i < step);
      if (i === step) d.setAttribute("aria-current", "step");
      else d.removeAttribute("aria-current");
    });
    back.hidden = step === 0;
    next.innerHTML =
      step === 2
        ? `${bi(T.solve[0], T.solve[1])} <span aria-hidden="true">✏️</span>`
        : `${bi(T.next[0], T.next[1])} <span aria-hidden="true">→</span>`;
    updateTally();
    if (focus) card.focus({ preventScroll: false });
  }

  panel.addEventListener("click", (e) => {
    const num = e.target.closest(".lb-num");
    if (num) {
      const on = num.getAttribute("aria-pressed") !== "true";
      num.setAttribute("aria-pressed", String(on));
      num.querySelector(".lb-num__what").innerHTML = on ? num.querySelector("template").innerHTML : "";
      updateTally();
      return;
    }
    if (e.target.closest('[data-lb="back"]')) {
      step = Math.max(0, step - 1);
      render(true);
    } else if (e.target.closest('[data-lb="next"]')) {
      if (step < 2) {
        step++;
        render(true);
      } else {
        closeReads(section, true);
      }
    }
  });
  render(false);
  return panel;
}

function closeReads(section, toAnswer) {
  const panel = section.querySelector(".lb-reads");
  const btn = section.querySelector(".lb-open");
  if (panel) panel.hidden = true;
  if (btn) btn.setAttribute("aria-expanded", "false");
  window.hwVoice?.stop?.();
  if (toAnswer) {
    /* The first place an answer goes: a box or a choice, never a word-help button. */
    const target =
      section.querySelector(
        ".problem-body :is(input:not([type=hidden]):not([type=radio]):not([type=checkbox]), textarea, select):not([disabled])",
      ) || section.querySelector(".problem-body :is(input[type=radio], input[type=checkbox]):not([disabled])");
    (target || btn)?.focus();
  } else btn?.focus();
}

/** Adds "Read it 3 ways" to each word problem on the page. Idempotent; returns how many it added. */
export function decorateThreeReads(root = document) {
  let added = 0;
  for (const sec of root.querySelectorAll(".problem-section")) {
    if (sec.hasAttribute("data-lb-reads")) continue;
    sec.setAttribute("data-lb-reads", "");
    const stem = sec.querySelector(".problem-stem");
    const head = sec.querySelector(".problem-header-row");
    if (!stem || !head) continue;
    const en = (stem.querySelector(".lang-en")?.textContent || "").replace(/\s+/g, " ").trim();
    const es = (stem.querySelector(".lang-es")?.textContent || "").replace(/\s+/g, " ").trim();
    const rEn = threeReads(en);
    if (!rEn) continue;
    const rEs = es ? threeReads(es, { force: true }) : null;
    sec.__lbEn = en;
    sec.__lbEs = es;
    const btn = el(
      "button",
      "lb-open",
      `<span aria-hidden="true">👀</span> ${bi(T.open[0], T.open[1])}`,
    );
    btn.type = "button";
    btn.setAttribute("aria-expanded", "false");
    btn.addEventListener("click", () => {
      let panel = sec.querySelector(".lb-reads");
      if (panel && !panel.hidden) {
        closeReads(sec, false);
        return;
      }
      if (!panel) {
        panel = buildReads(sec, rEn, rEs);
        panel.id = `lb_reads_${sec.id || added}`;
        btn.setAttribute("aria-controls", panel.id);
        stem.after(panel);
      }
      panel.hidden = false;
      btn.setAttribute("aria-expanded", "true");
      panel.querySelector(".lb-card")?.focus();
    });
    const listen = head.querySelector(".btn-listen-prob");
    if (listen) listen.after(btn);
    else head.appendChild(btn);
    added++;
  }
  return added;
}

/* ── Word Bridge ───────────────────────────────────────────────────── */

/**
 * One term with the letters it shares with its twin wrapped in <b>, word by word: each word is lit
 * against the twin word cognate() paired it with ("Commutative" with "conmutativa", never with
 * "Propiedad"). `pairs` holds [en, es] folded words; `side` says which half this term is.
 */
function litWord(term, pairs, side) {
  const fold = (w) =>
    w
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();
  return term
    .split(/(\s+|-)/)
    .map((tok) => {
      const f = fold(tok);
      const hit = pairs.find((p) => p[side] === f);
      if (!hit) return esc(tok);
      const keep = sharedLetters(tok, hit[side === 0 ? 1 : 0]);
      let i = 0;
      let out = "";
      for (const ch of tok) out += keep[i++] ? `<b>${esc(ch)}</b>` : esc(ch);
      return out;
    })
    .join("");
}

/** Tonight's words from the page's own vocabulary data. Lesson words first, duplicates dropped. */
function lessonWords() {
  const list = Array.isArray(window.__HW_VOCAB__) ? window.__HW_VOCAB__ : [];
  const seen = new Set();
  const out = [];
  for (const v of list) {
    const en = String(v?.term || "").trim();
    const es = String(v?.termEs || "").trim();
    if (!en || !es) continue;
    const key = en.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ en, es, def: v.def || "", defEs: v.defEs || "" });
  }
  return out;
}

/** Stable shuffle (same order every visit for the same lesson), never identical to the input. */
function shuffled(arr, seed) {
  const a = arr.slice();
  let h = 2166136261;
  for (const ch of seed) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  for (let i = a.length - 1; i > 0; i--) {
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    const j = Math.abs(h) % (i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  if (a.length > 1 && a.every((x, i) => x === arr[i])) a.push(a.shift());
  return a;
}

function pairRow(w) {
  const li = el(
    "li",
    "wb-pair",
    `<span class="wb-word" lang="en">${litWord(w.en, w.pairs, 0)}</span><span class="wb-link" aria-hidden="true"></span><span class="wb-word wb-word--es" lang="es-US">${litWord(w.es, w.pairs, 1)}</span>`,
  );
  const say = sayButton(
    [
      { text: w.en, lang: "en" },
      { text: w.es, lang: "es" },
    ],
    ["Hear both", "Escuchar las dos"],
    "lb-say wb-say",
  );
  /* Icon-only on the row; the name says which pair it reads. */
  say.setAttribute("aria-label", `${w.en} · ${w.es} 🔊`);
  say.querySelectorAll(".lang-en, .lang-es").forEach((n) => n.classList.add("wb-say__label"));
  li.append(say);
  return li;
}

function buildMatch(twins, seed) {
  const wrap = el("div", "wb-match");
  const picks = twins.slice(0, 6);
  const right = shuffled(picks, seed);
  wrap.innerHTML = `
    <p class="wb-match__how">${bi(
      "Tap an English word, then its Spanish twin.",
      "Toca una palabra en inglés y luego su gemela en español.",
    )}</p>
    <div class="wb-cols">
      <ul class="wb-col" aria-label="English">${picks
        .map((w, i) => `<li><button type="button" class="wb-tile" data-wb-en="${i}" aria-pressed="false" lang="en">${esc(w.en)}</button></li>`)
        .join("")}</ul>
      <ul class="wb-col" aria-label="Español" lang="es-US">${right
        .map((w) => `<li><button type="button" class="wb-tile wb-tile--es" data-wb-es="${picks.indexOf(w)}" aria-pressed="false" lang="es-US">${esc(w.es)}</button></li>`)
        .join("")}</ul>
    </div>
    <p class="wb-match__say" role="status" aria-live="polite"></p>
    <button type="button" class="lb-btn wb-again" hidden>${bi("Play again", "Jugar otra vez")}</button>`;
  const say = wrap.querySelector(".wb-match__say");
  const again = wrap.querySelector(".wb-again");
  let pickEn = null;
  let made = 0;

  const clearPick = () => {
    wrap.querySelectorAll('.wb-tile[aria-pressed="true"]:not(.is-matched)').forEach((t) => t.setAttribute("aria-pressed", "false"));
    pickEn = null;
  };

  wrap.addEventListener("click", (e) => {
    if (e.target.closest(".wb-again")) {
      wrap.querySelectorAll(".wb-tile").forEach((t) => {
        t.classList.remove("is-matched", "is-miss");
        t.disabled = false;
        t.setAttribute("aria-pressed", "false");
      });
      made = 0;
      pickEn = null;
      say.textContent = "";
      again.hidden = true;
      wrap.querySelector(".wb-tile")?.focus();
      return;
    }
    const t = e.target.closest(".wb-tile");
    if (!t || t.disabled) return;
    wrap.querySelectorAll(".is-miss").forEach((x) => x.classList.remove("is-miss"));
    if (t.dataset.wbEn != null) {
      clearPick();
      pickEn = Number(t.dataset.wbEn);
      t.setAttribute("aria-pressed", "true");
      say.innerHTML = bi(`Now find the Spanish twin of “${picks[pickEn].en}”.`, `Ahora busca la gemela en español de “${picks[pickEn].en}”.`);
      return;
    }
    const es = Number(t.dataset.wbEs);
    if (pickEn == null) {
      say.innerHTML = bi("Start with an English word on the left.", "Empieza con una palabra en inglés a la izquierda.");
      return;
    }
    const w = picks[pickEn];
    const enTile = wrap.querySelector(`[data-wb-en="${pickEn}"]`);
    if (es === pickEn) {
      for (const x of [enTile, t]) {
        x.classList.add("is-matched");
        x.setAttribute("aria-pressed", "true");
        x.disabled = true;
      }
      made++;
      pickEn = null;
      const v = voice();
      if (v)
        v.run(
          [
            { text: w.en, lang: "en" },
            { text: w.es, lang: "es" },
          ],
          null,
        );
      say.innerHTML =
        made === picks.length
          ? bi(
              `All ${picks.length} twins matched. Your Spanish already knew these words!`,
              `¡Las ${picks.length} gemelas unidas! Tu español ya conocía estas palabras.`,
            )
          : bi(`Twins! ${w.en} = ${w.es}.`, `¡Gemelas! ${w.en} = ${w.es}.`);
      if (made === picks.length) again.hidden = false;
    } else {
      const other = picks[es];
      t.classList.add("is-miss");
      say.innerHTML = bi(
        `Not twins: “${other.es}” goes with “${other.en}”. Find the letters that match “${w.en}” and try again.`,
        `No son gemelas: “${other.es}” va con “${other.en}”. Busca las letras que coinciden con “${w.en}” e intenta otra vez.`,
      );
    }
  });
  return wrap;
}

/**
 * The Word Bridge card, placed before the optional extras on the Discover stop. Shown when at least
 * three of tonight's words are twins. Returns the card or null.
 */
export function mountWordBridge(root = document) {
  if (root.querySelector(".wb-card")) return null;
  const anchor = root.querySelector("#hw_panel_connect .fp-optional-group");
  if (!anchor) return null;
  const words = lessonWords();
  const twins = [];
  const fresh = [];
  for (const w of words) {
    const c = cognate(w.en, w.es);
    if (c.twin) twins.push({ ...w, pairs: c.pairs });
    else fresh.push(w);
  }
  /* A headline like "2 of 9" is not a head start; the card earns its place at three twins. */
  if (twins.length < 3) return null;

  const card = el("section", "wb-card fm-card");
  card.setAttribute("aria-labelledby", "wb_title");
  const n = twins.length;
  const total = words.length;
  card.innerHTML = `
    <p class="wb-kicker">${bi("Word Bridge · English ⇄ Español", "Puente de palabras · English ⇄ Español")}</p>
    <h3 class="wb-title" id="wb_title">${bi(
      `${n} of tonight's ${total} math words are word twins`,
      `${n} de las ${total} palabras de matemáticas de hoy son palabras gemelas`,
    )}</h3>
    <p class="wb-lede">${bi(
      "Word twins look and sound alike in English and Spanish, and mean the same thing. If your family speaks Spanish, you already know these words. The matching letters are lit up.",
      "Las palabras gemelas se ven y suenan parecido en inglés y en español, y significan lo mismo. Si en su familia hablan español, ya conocen estas palabras. Las letras que coinciden están resaltadas.",
    )}</p>
    <ul class="wb-pairs"></ul>
    <details class="wb-play">
      <summary><span aria-hidden="true">🧩</span> ${bi("Match the twins", "Une las gemelas")}</summary>
    </details>
    ${
      fresh.length
        ? `<details class="wb-new"><summary>${bi(
            `${fresh.length} new ${fresh.length === 1 ? "word" : "words"} to learn by meaning`,
            `${fresh.length} ${fresh.length === 1 ? "palabra nueva" : "palabras nuevas"} para aprender por su significado`,
          )}</summary><ul class="wb-fresh">${fresh
            .map(
              (w) =>
                `<li><strong lang="en">${esc(w.en)}</strong> · <strong lang="es-US">${esc(w.es)}</strong>${
                  w.def ? `<br><span class="lang-en">${esc(w.def)}</span><span class="lang-es" lang="es">${esc(w.defEs || w.def)}</span>` : ""
                }</li>`,
            )
            .join("")}</ul></details>`
        : ""
    }`;
  const list = card.querySelector(".wb-pairs");
  const shown = twins.slice(0, 8);
  for (const w of shown) list.append(pairRow(w));
  if (twins.length > shown.length) {
    const more = el("li", "wb-more", bi(`+ ${twins.length - shown.length} more twins`, `+ ${twins.length - shown.length} gemelas más`));
    list.append(more);
  }
  const play = card.querySelector(".wb-play");
  play.addEventListener(
    "toggle",
    () => {
      if (play.open && !play.querySelector(".wb-match")) play.append(buildMatch(twins, String(window.LESSON_ID || location.pathname)));
    },
    { passive: true },
  );
  if (!reducedMotion()) card.classList.add("wb-card--enter");
  anchor.before(card);
  return card;
}
