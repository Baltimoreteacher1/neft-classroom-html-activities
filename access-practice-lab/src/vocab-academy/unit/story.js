// Vocabulary Academy — Story Restore, a unit activity. The pages of a lesson's reading passage have "gone blank": the
// words the lesson teaches are missing from the sentences. The learner restores each page by tapping a word in the word
// bank and then a blank (or the other way round; Tab, arrows, Enter and the number keys work too). A word that does not
// fit the blank is not accepted and the page never prints the right one. When a page is fully restored it comes alive: the
// paragraph fades in with a small scene of glyphs, and each restored word opens its meaning. After the last page the
// whole story is shown and the learner may retell one sentence in their own words (kept on this device only).
// Built on the shared game kit, so it has the same supports, hints, keyboard keys, resume and finish cards as the games.
// Retry and hints are always free; nothing is timed; a miss only leaves a blank empty a little longer.
import { recordResult } from "../model.js";
import { workOf } from "./work.js";
import { langMode, makeI18n } from "../../i18n.js";
import { fbHTML, html, icon, mountGame, raw, toHtml } from "../games/kit.js";
import { esc2, findForm, formsOf, norm, sentencesOf } from "../games/text.js";

export const TITLE = ["Story Restore", "Restaurar el cuento"];
// Per band: sentences a page tries to hold, blanks a page may hold, wrong words added to the bank.
const BAND = {
  early: { sents: 2, blanks: 3, extra: 1 },
  "upper-elem": { sents: 3, blanks: 4, extra: 2 },
  middle: { sents: 4, blanks: 5, extra: 2 },
  high: { sents: 4, blanks: 6, extra: 2 },
};
export const BANK_MAX = 9; // the number keys 1 to 9 choose a bank word
export const RETELL_MAX = 400;

/** A passage the activity can use: paragraphs of text. Pure. */
export const hasPassage = (lesson) =>
  Array.isArray(lesson?.passage?.paras) && lesson.passage.paras.some((p) => String(p || "").trim());

// ── the engine: pure, deterministic, DOM-free ───────────────────────────────────────────────────────────────────
/** Every place a target word (in any of its forms) occurs in `text`, longest match first, no overlaps: [{ start, end, wordId, text }]. */
export function findBlanks(text, targets) {
  const hits = [];
  for (const w of targets) {
    const re = new RegExp(`(?<![A-Za-z])(?:${formsOf(w).map(esc2).join("|")})(?![A-Za-z])`, "gi");
    for (const m of String(text).matchAll(re))
      hits.push({ start: m.index, end: m.index + m[0].length, wordId: w.id, text: m[0] });
  }
  hits.sort((a, b) => b.end - b.start - (a.end - a.start) || a.start - b.start);
  const taken = [];
  for (const h of hits) if (!taken.some((t) => h.start < t.end && t.start < h.end)) taken.push(h);
  return taken.sort((a, b) => a.start - b.start);
}

/** The target words of a pool: the passage's own word list, as records, in that order. */
export function targetsOf(pool) {
  const ids = pool.passage?.words?.length ? pool.passage.words : pool.words.map((w) => w.id);
  const seen = new Set();
  const out = [];
  for (const id of ids) {
    const w = pool.byId.get(id);
    if (w && !seen.has(id) && pool.words.some((x) => x.id === id)) {
      seen.add(id);
      out.push(w);
    }
  }
  return out;
}

/** A blank accepts one word: the same word id, in the same form (case and accents do not matter). Pure. */
export const fits = (page, k, j) => {
  const blank = page.blanks[k];
  const chip = page.bank[j];
  return Boolean(
    blank && chip && chip.wordId === blank.wordId && norm(chip.form) === norm(blank.text),
  );
};
/** Bank positions that fit blank k (one form of one word, so this is every chip of that exact word). */
export const fitting = (page, k) => page.bank.map((_, j) => j).filter((j) => fits(page, k, j));

const wordsOnPage = (page) => new Set(page.blanks.map((b) => b.wordId));
const posOf = (w) => String(w?.pos || "");

/** Wrong words for a page's bank: other unit words that cannot be taken for the answer. Pure. */
function distractorsFor(pool, page, want, rng) {
  if (!want) return [];
  const answers = page.blanks.map((b) => pool.byId.get(b.wordId)).filter(Boolean);
  const answerForms = new Set(page.blanks.map((b) => norm(b.text)));
  const printed = page.blocks
    .flatMap((b) => b.segs)
    .filter((s) => s[0] === "t")
    .map((s) => s[1])
    .join(" ");
  const close = new Set();
  for (const a of answers) {
    close.add(norm(a.hw));
    for (const x of [...(a.syn || []), ...(a.ant || [])]) close.add(norm(x));
  }
  const rels = new Set(answers.map((a) => norm(a.rel)).filter(Boolean));
  const onPage = wordsOnPage(page);
  const seen = new Set();
  const cands = [...pool.review, ...pool.words].filter((w) => {
    if (!w || onPage.has(w.id) || seen.has(norm(w.hw))) return false;
    seen.add(norm(w.hw));
    if (close.has(norm(w.hw))) return false;
    if (
      (w.syn || []).some((x) => close.has(norm(x))) ||
      (w.ant || []).some((x) => close.has(norm(x)))
    )
      return false;
    if (rels.size && w.rel && rels.has(norm(w.rel)) && !pool.review.includes(w)) return false;
    if (formsOf(w).some((f) => answerForms.has(f))) return false;
    if (findForm(printed, w)) return false;
    return true;
  });
  const sameKind = (w) => answers.filter((a) => posOf(a) === posOf(w)).length;
  return rng
    .shuffle(cands)
    .sort((a, b) => sameKind(a) - sameKind(b))
    .slice(0, want);
}

/**
 * Pure engine: the story for a pool (a lesson with a passage) and a seeded rng.
 *   { lid, title, genre, grade, pages:[{ blocks:[{ p, segs:[["t",text] | ["b",k]] }], blanks:[{ wordId, text }],
 *     bank:[{ wordId, form, extra }] }], st:[page progress], i, stage, sel, peek, retell, claimed }
 * Every occurrence of a target word is a blank, so no page prints a word its bank is asked for.
 */
export function buildStory(pool, rng, opts = {}) {
  const empty = { lid: pool.id, pages: [], st: [], i: 0, stage: "pages", claimed: false };
  if (!pool.passage?.paras?.length) return empty;
  const lim = BAND[pool.band] || BAND.middle;
  const cap = Math.min(opts.cap || lim.blanks, BANK_MAX - 1);
  const targets = targetsOf(pool);
  if (!targets.length) return empty;
  const pages = [];
  const lead = []; // blank-free paragraphs before the first blank; they open the first page
  pool.passage.paras.forEach((para, p) => {
    const sents = sentencesOf(para).map((text) => ({ text, hits: findBlanks(text, targets) }));
    if (!sents.length) return;
    let cur = null;
    const close = () => {
      if (cur?.nb) pages.push(cur);
      cur = null;
    };
    const open = () => {
      cur = { p, nb: 0, ns: 0, runs: [] };
    };
    for (const s of sents) {
      if (cur && cur.nb && cur.nb + s.hits.length > cap) close();
      if (!cur) open();
      cur.runs.push(s);
      cur.nb += s.hits.length;
      cur.ns += 1;
      if (cur.ns >= lim.sents && cur.nb > 0) close();
    }
    if (cur?.nb) pages.push(cur);
    else if (cur) {
      // text with no blanks joins the page before it, or opens the first page
      const last = pages.at(-1);
      const run = { p, runs: cur.runs };
      if (last) (last.tail ||= []).push(run);
      else lead.push(run);
    }
  });
  if (!pages.length) return empty;
  // Assemble blocks: a page's own sentence run, with any blank-free text that follows it (or leads the first page).
  const built = pages.map((pg, idx) => {
    const blanks = [];
    const toSegs = (runs) => {
      const segs = [];
      const parts = [];
      for (const s of runs) {
        let at = 0;
        let out = "";
        const push = () => {
          if (out) segs.push(["t", out]);
          out = "";
        };
        for (const h of s.hits) {
          out += s.text.slice(at, h.start);
          push();
          blanks.push({ wordId: h.wordId, text: h.text });
          segs.push(["b", blanks.length - 1]);
          at = h.end;
        }
        out += s.text.slice(at);
        push();
        parts.push(segs.splice(0));
      }
      // join the sentences of one paragraph with single spaces
      const flat = [];
      parts.forEach((sg, n) => {
        if (n) flat.push(["t", " "]);
        flat.push(...sg);
      });
      return flat;
    };
    const blocks = [];
    if (idx === 0) for (const l of lead) blocks.push({ p: l.p, segs: toSegs(l.runs) });
    blocks.push({ p: pg.p, segs: toSegs(pg.runs) });
    for (const t of pg.tail || []) blocks.push({ p: t.p, segs: toSegs(t.runs) });
    return { blocks, blanks };
  });
  // A paragraph split across pages: a page's block continues the paragraph, so neighbours share a paragraph number.
  const out = built.map((page, n) => {
    const answers = page.blanks.map((b, k) => ({
      wordId: b.wordId,
      form: norm(b.text),
      extra: false,
      k,
    }));
    const extraWords = distractorsFor(
      pool,
      page,
      Math.min(lim.extra, BANK_MAX - answers.length),
      rng,
    );
    const chips = [
      ...answers.map(({ wordId, form }) => ({ wordId, form, extra: false })),
      ...extraWords.map((w) => ({ wordId: w.id, form: norm(w.hw), extra: true })),
    ];
    return { n, ...page, bank: rng.shuffle(chips) };
  });
  return {
    lid: pool.id,
    title: pool.passage.title || pool.title || "",
    genre: pool.passage.genre || "",
    grade: pool.grade,
    pages: out,
    st: out.map(newPageState),
    i: 0,
    stage: "pages",
    sel: null,
    peek: null,
    retell: "",
    claimed: false,
  };
}

export const newPageState = () => ({
  placed: {},
  wrong: {},
  tries: {},
  hints: {},
  hidden: [],
  last: null,
});
const isPlaced = (pg, k) => pg.placed[k] != null;
const chipUsed = (pg, j) => Object.values(pg.placed).includes(j);
export const pageRestored = (page, pg) => page.blanks.every((_, k) => isPlaced(pg, k));

/** Try bank word j in blank k. Pure; fills the blank only when it fits. -> { changed, ok, first } */
export function place(page, pg, k, j) {
  if (
    !page.blanks[k] ||
    !page.bank[j] ||
    isPlaced(pg, k) ||
    chipUsed(pg, j) ||
    pg.hidden.includes(j)
  )
    return { changed: false, ok: false, first: false };
  pg.tries[k] = (pg.tries[k] || 0) + 1;
  if (fits(page, k, j)) {
    pg.placed[k] = j;
    pg.last = { k, ok: true };
    return { changed: true, ok: true, first: pg.tries[k] === 1 };
  }
  (pg.wrong[k] ||= []).push(j);
  pg.last = { k, ok: false };
  return { changed: true, ok: false, first: false };
}

/** Hint ladder for a blank: 1 the meaning, 2 the kind of word and its first letter, 3 one wrong word leaves the bank. */
export function hint(page, pg, k) {
  if (!page.blanks[k] || isPlaced(pg, k) || (pg.hints[k] || 0) >= 3) return false;
  pg.hints[k] = (pg.hints[k] || 0) + 1;
  if (pg.hints[k] >= 3) {
    const live = page.bank
      .map((c, j) => (c.extra && !pg.hidden.includes(j) && !chipUsed(pg, j) ? j : -1))
      .filter((j) => j >= 0);
    if (live.length) pg.hidden.push(live[0]);
  }
  return true;
}
/** The blank a hint is about: the chosen one if it is empty, otherwise the first empty one. */
export const hintTarget = (page, pg, sel) =>
  sel?.t === "b" && !isPlaced(pg, sel.v)
    ? sel.v
    : page.blanks.findIndex((_, k) => !isPlaced(pg, k));

/** The text of a hint, with the answer's own forms masked so a definition can never give the word away. Pure. */
export function hintText(word, level, text = {}, also = []) {
  if (!word) return "";
  const mask = (s) => {
    let out = String(s || "");
    for (const w of [word, ...also])
      for (const f of formsOf(w))
        out = out.replace(new RegExp(`(?<![A-Za-z])${esc2(f)}(?![A-Za-z])`, "gi"), "___");
    return out;
  };
  if (level <= 1) return mask(word.def);
  const first = norm(word.hw)[0]?.toUpperCase() || "";
  return `${mask(word.def)} ${text.kind || ""}${word.pos ? ` ${word.pos}` : ""}; ${text.starts || "starts with"} ${first}.`;
}

/** The authored paragraphs rebuilt from the pages, once every blank holds its word. Pure. */
export function restoredParas(s, { all = false } = {}) {
  const paras = [];
  s.pages.forEach((page, n) => {
    if (!all && !pageRestored(page, s.st[n])) return;
    for (const b of page.blocks) {
      const text = b.segs.map((sg) => (sg[0] === "t" ? sg[1] : page.blanks[sg[1]].text)).join("");
      const last = paras.at(-1);
      if (last && last.p === b.p) last.text += ` ${text}`;
      else paras.push({ p: b.p, text });
    }
  });
  return paras.map((x) => x.text);
}
/** What a page shows while it is still blank: the text with every blank as "___" (never an answer). Pure. */
export const maskedBlocks = (page) =>
  page.blocks.map((b) => b.segs.map((sg) => (sg[0] === "t" ? sg[1] : "___")).join(""));

export const progressOf = (s) => ({
  done: s.st.reduce((n, pg) => n + Object.keys(pg.placed).length, 0),
  total: s.pages.reduce((n, p) => n + p.blanks.length, 0),
});
export const allRestored = (s) =>
  s.pages.length > 0 && s.pages.every((p, n) => pageRestored(p, s.st[n]));

/** The sentence frame for the retell, by kind of passage. Pure. */
export function retellFrame(genre, band) {
  const story = ["narrative", "dialogue", "biography", "history", "description"].includes(genre);
  if (band === "early")
    return story
      ? ["The story is about ___.", "El cuento trata de ___."]
      : ["This tells about ___.", "Esto trata de ___."];
  return story
    ? ["First, ___. Then ___. At the end, ___.", "Primero, ___. Luego, ___. Al final, ___."]
    : [
        "This passage tells about ___. One important idea is ___.",
        "Esta lectura trata de ___. Una idea importante es ___.",
      ];
}

// ── the view ────────────────────────────────────────────────────────────────────────────────────────────────────
const glyphsOf = (s, n, env) => {
  const page = s.pages[n];
  const out = [];
  for (const id of new Set(page.blanks.map((b) => b.wordId)))
    for (const g of (env.pool.byId.get(id)?.visual?.glyphs || []).slice(0, 2))
      if (!out.includes(g)) out.push(g);
  return out.slice(0, 6);
};

function meaningCard(word, env) {
  const I = env.I;
  const spanishOn = I.S("a", "b") !== "a";
  const gloss = word.es?.gloss && (env.sup.glossaryEs || spanishOn) ? word.es.gloss : "";
  return html`<aside
    class="va-st-meaning"
    role="note"
    aria-label="${I.S("Word meaning", "Significado de la palabra")}"
  >
    <p class="va-st-meaning-h">
      <strong lang="en">${word.hw}</strong>
      ${word.pos ? html`<span class="va-st-pos" lang="en">${word.pos}</span>` : ""}
      ${gloss ? html`<span class="vag-es" lang="es">${gloss}</span>` : ""}
    </p>
    <p lang="en">${word.def}</p>
    ${word.ex ? html`<p class="va-st-ex" lang="en">${word.ex}</p>` : ""}
    <p class="va-st-meaning-act">
      ${env.speakBtn(`${word.hw}. ${word.def}`, word.hw)}
      <button type="button" class="btn small" data-st-peek-close data-fk="peek-close">
        ${icon("x")}${I.T("Close", "Cerrar")}
      </button>
    </p>
  </aside>`;
}

function textHTML(s, env, n, alive) {
  const I = env.I;
  const page = s.pages[n];
  const pg = s.st[n];
  const sel = s.sel;
  const nBlanks = page.blanks.length;
  const blankBtn = (k) => {
    const j = pg.placed[k];
    if (j != null) {
      const shown = page.blanks[k].text;
      if (alive)
        return html`<button
          type="button"
          class="va-st-word"
          data-st-word="${n}:${k}"
          data-fk="w-${k}"
          data-rv
          aria-expanded="${s.peek === `${n}:${k}`}"
          aria-label="${shown}: ${I.S("see the meaning", "ver el significado")}"
        >
          ${shown}
        </button>`;
      return html`<span class="va-st-filled" data-fk="b-${k}" data-rv tabindex="-1"
        >${shown}<span class="vag-sr">, ${I.S("fits", "encaja")}</span></span
      >`;
    }
    const picked = sel?.t === "b" && sel.v === k;
    const nope = pg.last && !pg.last.ok && pg.last.k === k;
    const label = `${I.S("Blank", "Espacio")} ${k + 1} ${I.S("of", "de")} ${nBlanks}${nope ? `. ${I.S("The last word did not fit", "La última palabra no encajó")}` : ""}${picked ? `. ${I.S("Chosen", "Elegido")}` : ""}`;
    return html`<button
      type="button"
      class="va-st-blank"
      data-st-blank="${k}"
      data-fk="b-${k}"
      data-rv
      data-state="${picked ? "sel" : nope ? "no" : ""}"
      aria-pressed="${picked}"
      aria-label="${label}"
    >
      <span aria-hidden="true">${nope ? raw("✕") : raw("___")}</span>
    </button>`;
  };
  return html`<div
    class="va-st-text"
    data-rove
    aria-label="${I.S("Story page", "Página del cuento")}"
  >
    ${page.blocks.map(
      (b) =>
        html`<p class="va-st-para">
          ${b.segs.map((sg) => (sg[0] === "t" ? sg[1] : blankBtn(sg[1])))}
        </p>`,
    )}
  </div>`;
}

function bankHTML(s, env, n) {
  const I = env.I;
  const page = s.pages[n];
  const pg = s.st[n];
  const pics = env.band === "early" || env.ctx.supports?.picture;
  return html`<div
    class="va-st-bank"
    data-rove
    role="group"
    aria-label="${I.S("Word bank", "Banco de palabras")}"
  >
    ${page.bank.map((c, j) => {
      if (pg.hidden.includes(j)) return "";
      const used = chipUsed(pg, j);
      const picked = s.sel?.t === "c" && s.sel.v === j;
      const word = env.pool.byId.get(c.wordId);
      return html`<button
        type="button"
        class="va-st-chip"
        data-st-chip="${j}"
        data-n="${j + 1}"
        data-fk="c-${j}"
        data-rv
        data-state="${used ? "used" : picked ? "sel" : ""}"
        aria-pressed="${picked}"
        aria-disabled="${used}"
      >
        <span class="vag-n" aria-hidden="true">${j + 1}</span>
        ${pics && word?.visual ? html`<span class="va-st-chip-pic" aria-hidden="true">${env.pic(word, "sm")}</span>` : ""}
        <span class="va-st-chip-t" lang="en">${c.form}</span>
        ${used ? html`<span class="vag-sr">${I.S("used", "usada")}</span>` : ""}
      </button>`;
    })}
  </div>`;
}

function dotsHTML(s, env) {
  const I = env.I;
  return html`<ol class="va-st-dots" aria-label="${I.S("Pages", "Páginas")}">
    ${s.pages.map((p, n) => {
      const done = pageRestored(p, s.st[n]);
      const now = s.stage === "pages" && n === s.i;
      const text = done
        ? I.S("restored", "restaurada")
        : now
          ? I.S("working on this one", "trabajando en esta")
          : I.S("blank", "en blanco");
      return html`<li
        class="va-st-dot"
        data-state="${done ? "done" : now ? "now" : "blank"}"
        role="img"
        aria-label="${I.S("Page", "Página")} ${n + 1}: ${text}"
      >
        <span aria-hidden="true">${done ? raw("✓") : n + 1}</span>
      </li>`;
    })}
  </ol>`;
}

function peekHTML(s, env) {
  if (!s.peek) return "";
  const [n, k] = String(s.peek).split(":").map(Number);
  const page = s.pages[n];
  const word = page && env.pool.byId.get(page.blanks[k]?.wordId);
  return word ? meaningCard(word, env) : "";
}

function pageView(s, env) {
  const I = env.I;
  const n = s.i;
  const page = s.pages[n];
  const pg = s.st[n];
  const alive = pageRestored(page, pg);
  const last = n === s.pages.length - 1;
  const hk = hintTarget(page, pg, s.sel);
  const hintLevel = hk >= 0 ? pg.hints[hk] || 0 : 0;
  const hw = hk >= 0 ? env.pool.byId.get(page.blanks[hk].wordId) : null;
  const glyphs = alive ? glyphsOf(s, n, env) : [];
  const fb = pg.last
    ? pg.last.ok
      ? alive
        ? fbHTML(
            "ok",
            I.T(
              "That word fits. This page is restored.",
              "Esa palabra encaja. Esta página está restaurada.",
            ),
            I,
          )
        : fbHTML("ok", I.T("That word fits.", "Esa palabra encaja."), I)
      : fbHTML(
          "retry",
          I.T(
            "That word does not fit here, try another.",
            "Esa palabra no encaja aquí, prueba otra.",
          ),
          I,
        )
    : "";
  return html`<header class="va-st-head">
      <p class="va-st-title"><strong>${s.title}</strong></p>
      ${dotsHTML(s, env)}
    </header>
    <div class="va-st-page${alive ? " is-alive" : ""}" data-alive="${alive}">
      <p class="vag-qtype">
        <strong>${I.T("Page", "Página")} ${n + 1} ${I.T("of", "de")} ${s.pages.length}</strong>
      </p>
      ${
        alive
          ? html`<p class="va-st-scene" aria-hidden="true">
                ${glyphs.length ? glyphs.map((g) => html`<span>${g}</span>`) : html`<span>📖</span><span>✨</span>`}
              </p>
              <p class="vag-fine">
                ${I.T("This page came alive. Tap a green word to see what it means.", "Esta página cobró vida. Toca una palabra verde para ver qué significa.")}
              </p>`
          : html`<p class="vag-fine">
              ${I.T(
                "Words are missing from this page. Tap a word in the bank, then tap the blank where it fits.",
                "Faltan palabras en esta página. Toca una palabra del banco y luego el espacio donde encaja.",
              )}
            </p>`
      }
      ${textHTML(s, env, n, alive)}
      ${alive ? html`<div class="va-st-listen">${env.speakBtn(restoredParas({ pages: [page], st: [pg] }).join(" "), "")}</div>` : ""}
      ${peekHTML(s, env)}
    </div>
    ${
      alive
        ? ""
        : html`<h3 class="va-st-h">${I.T("Word bank", "Banco de palabras")}</h3>
            ${bankHTML(s, env, n)}`
    }
    <div class="vag-actions">
      ${
        alive || hintLevel >= 3
          ? ""
          : html`<button type="button" class="btn small vag-hint" data-st-hint data-fk="hint">
              ${icon("bulb")}${I.T("Hint", "Pista")}
            </button>`
      }
      ${
        alive
          ? html`<button
              type="button"
              class="btn btn-primary"
              data-st-next
              data-fk="next"
              data-autofocus
            >
              ${last ? I.T("See the whole story", "Ver todo el cuento") : I.T("Next page", "Página siguiente")}${icon("arrow-right")}
            </button>`
          : ""
      }
    </div>
    ${
      hintLevel >= 1 && hw && !alive
        ? fbHTML(
            "hint",
            `${I.S("Blank", "Espacio")} ${hk + 1}: ${hintText(hw, hintLevel, { kind: I.S("It is a", "Es"), starts: I.S("it starts with", "empieza con") }, targetsOf(env.pool))}${pg.hidden.length ? ` ${I.S("A word was taken away.", "Se quitó una palabra.")}` : ""}`,
            I,
          )
        : ""
    }
    ${fb}`;
}

function storyView(s, env) {
  const I = env.I;
  const paras = restoredParas(s);
  const frame = retellFrame(s.genre, env.band);
  const fullText = paras.join(" ");
  // The restored story with every word tappable for its meaning.
  const wordsIn = (n) =>
    s.pages[n].blocks.map(
      (b) =>
        html`${b.segs.map((sg) =>
          sg[0] === "t"
            ? sg[1]
            : html`<button
                type="button"
                class="va-st-word"
                data-st-word="${n}:${sg[1]}"
                data-fk="w-${n}-${sg[1]}"
                data-rv
                aria-expanded="${s.peek === `${n}:${sg[1]}`}"
              >
                ${s.pages[n].blanks[sg[1]].text}
              </button>`,
        )}`,
    );
  // group blocks of one paragraph across pages
  const groups = [];
  s.pages.forEach((page, n) => {
    const rendered = wordsIn(n);
    page.blocks.forEach((b, bi) => {
      const last = groups.at(-1);
      if (last && last.p === b.p) last.parts.push(rendered[bi]);
      else groups.push({ p: b.p, parts: [rendered[bi]] });
    });
  });
  const all = s.pages.flatMap((_, n) => glyphsOf(s, n, env));
  const glyphs = [...new Set(all)].slice(0, 8);
  return html`<header class="va-st-head">
      <p class="va-st-title"><strong>${s.title}</strong></p>
      ${dotsHTML(s, env)}
    </header>
    <div class="va-st-page is-alive" data-alive="true">
      <p class="va-st-scene" aria-hidden="true">${glyphs.map((g) => html`<span>${g}</span>`)}</p>
      <p class="vag-fine">
        ${I.T("The whole story is back. Tap a green word to see what it means.", "Todo el cuento está de vuelta. Toca una palabra verde para ver qué significa.")}
      </p>
      <div class="va-st-text va-st-whole" data-rove>
        ${groups.map((g) => html`<p class="va-st-para">${g.parts.map((part, i) => html`${i ? " " : ""}${part}`)}</p>`)}
      </div>
      <div class="va-st-listen">${env.speakBtn(fullText, "")}</div>
      ${peekHTML(s, env)}
    </div>
    <section class="va-st-retell-card" aria-labelledby="${env.uid}-rt">
      <h3 id="${env.uid}-rt" class="va-st-h">
        ${I.T("Retell it in your own words (optional)", "Cuéntalo con tus palabras (opcional)")}
      </h3>
      <p class="vag-fine">
        ${I.T("Write one sentence about the story. Your sentence stays on this device.", "Escribe una oración sobre el cuento. Tu oración se queda en este dispositivo.")}
      </p>
      <p class="va-st-frame" lang="en">
        <strong>${I.T("Sentence frame", "Marco de oración")}:</strong> ${I.T(...frame)}
      </p>
      <label class="va-st-retell-l" for="${env.uid}-retell"
        >${I.T("My sentence", "Mi oración")}</label
      >
      <textarea
        id="${env.uid}-retell"
        class="va-st-retell"
        data-st-retell
        rows="3"
        maxlength="${RETELL_MAX}"
        lang="en"
        autocomplete="off"
        spellcheck="true"
      >
${s.retell || ""}</textarea>
      ${s.retell ? "" : html`<p><button type="button" class="btn small" data-st-frame data-fk="frame">${icon("writing")}${I.T("Use the frame", "Usar el marco")}</button></p>`}
    </section>
    <div class="vag-actions">
      <button type="button" class="btn btn-primary" data-st-claim data-fk="claim">
        ${icon("star")}${I.T("Finish the story", "Terminar el cuento")}
      </button>
    </div>`;
}

function view(s, env) {
  return s.stage === "story" ? storyView(s, env) : pageView(s, env);
}

// ── the spec ────────────────────────────────────────────────────────────────────────────────────────────────────
function peekToggle(s, id) {
  s.peek = s.peek === id ? null : id;
  return true;
}

function attempt(s, env, k, j) {
  const page = s.pages[s.i];
  const pg = s.st[s.i];
  const blank = page.blanks[k];
  s.sel = null;
  const r = place(page, pg, k, j);
  if (!r.changed) return false;
  env.report({ wordId: blank.wordId, dim: "ctx", ok: r.ok, firstTry: r.first, kind: "story" });
  env.say(
    r.ok
      ? pageRestored(page, pg)
        ? env.I.S(
            "That word fits. This page is restored.",
            "Esa palabra encaja. Esta página está restaurada.",
          )
        : env.I.S("That word fits.", "Esa palabra encaja.")
      : env.I.S(
          "That word does not fit here, try another.",
          "Esa palabra no encaja aquí, prueba otra.",
        ),
  );
  return true;
}

const spec = {
  id: "story-restore",
  title: TITLE,
  persist: true,
  howTo: [
    [
      "The pages of this story have gone blank. Words are missing from the sentences.",
      "Las páginas de este cuento se quedaron en blanco. Faltan palabras en las oraciones.",
    ],
    [
      "Tap a word in the word bank, then tap the blank where it fits. You can also tap the blank first.",
      "Toca una palabra del banco y luego el espacio donde encaja. También puedes tocar primero el espacio.",
    ],
    [
      "If a word does not fit, pick another. Hints are always free, and nothing is taken away.",
      "Si una palabra no encaja, elige otra. Las pistas son gratis y no se quita nada.",
    ],
    [
      "When a page is restored it comes alive. Tap a green word to see what it means.",
      "Cuando una página se restaura, cobra vida. Toca una palabra verde para ver qué significa.",
    ],
    [
      "At the end, read the whole story and, if you like, retell one sentence in your own words.",
      "Al final, lee todo el cuento y, si quieres, cuenta una oración con tus propias palabras.",
    ],
  ],
  keys: [
    ["1 to 9", ["choose a word in the bank", "elegir una palabra del banco"]],
    [
      "Tab, arrows",
      ["move between blanks or bank words", "moverte entre espacios o palabras del banco"],
    ],
    ["Enter", ["choose, place or open a meaning", "elegir, colocar o abrir un significado"]],
    ["Esc", ["close a meaning", "cerrar un significado"]],
  ],
  build: (env) => buildStory(env.pool, env.rng),
  valid: (s) =>
    Array.isArray(s?.pages) &&
    s.pages.length > 0 &&
    Array.isArray(s.st) &&
    s.st.length === s.pages.length &&
    s.pages.every(
      (p) => Array.isArray(p.blanks) && Array.isArray(p.bank) && Array.isArray(p.blocks),
    ),
  unplayable: (s) => !s.pages.length,
  isDone: (s) => Boolean(s.claimed),
  progress: (s) => progressOf(s),
  view,
  click(el, s, env) {
    if (el.closest("[data-st-peek-close]")) {
      s.peek = null;
      return true;
    }
    const word = el.closest("[data-st-word]");
    if (word) return peekToggle(s, word.dataset.stWord);
    if (s.stage === "story") {
      if (el.closest("[data-st-frame]")) {
        s.retell = retellFrame(s.genre, env.band)[0];
        return true;
      }
      if (el.closest("[data-st-claim]")) {
        s.claimed = true;
        return true;
      }
      return false;
    }
    const page = s.pages[s.i];
    const pg = s.st[s.i];
    if (el.closest("[data-st-next]")) {
      if (!pageRestored(page, pg)) return false;
      s.peek = null;
      s.sel = null;
      if (s.i >= s.pages.length - 1) s.stage = "story";
      else s.i += 1;
      env.say(env.I.S("Next page.", "Página siguiente."));
      return true;
    }
    if (el.closest("[data-st-hint]")) {
      const k = hintTarget(page, pg, s.sel);
      if (k < 0 || !hint(page, pg, k)) return false;
      env.use("model");
      env.say(env.I.S("Hint shown.", "Pista mostrada."));
      return true;
    }
    const chip = el.closest("[data-st-chip]");
    if (chip) {
      const j = Number(chip.dataset.stChip);
      if (chipUsed(pg, j)) return false;
      if (s.sel?.t === "b") return attempt(s, env, s.sel.v, j);
      s.sel = s.sel?.t === "c" && s.sel.v === j ? null : { t: "c", v: j };
      pg.last = null;
      return true;
    }
    const blank = el.closest("[data-st-blank]");
    if (blank) {
      const k = Number(blank.dataset.stBlank);
      if (isPlaced(pg, k)) return false;
      if (s.sel?.t === "c") return attempt(s, env, k, s.sel.v);
      s.sel = s.sel?.t === "b" && s.sel.v === k ? null : { t: "b", v: k };
      pg.last = null;
      return true;
    }
    return false;
  },
  key(ev, s) {
    if (ev.key === "Escape" && s.peek) {
      s.peek = null;
      return true;
    }
    return false;
  },
  input(el, s, env) {
    if (!el.matches?.("[data-st-retell]")) return false;
    s.retell = String(el.value || "").slice(0, RETELL_MAX);
    env.save();
    return false; // no re-render: typing must keep the caret
  },
  extra: (s) => ({
    pages: s.pages.length,
    blanks: progressOf(s).total,
    retell: String(s.retell || "").trim(),
    title: s.title,
  }),
  finishExtra: (s, env) =>
    html`<p class="va-st-fin">
      ${icon("star")} ${env.I.T("The story is restored:", "El cuento está restaurado:")}
      <strong lang="en">${s.title}</strong>.
      ${s.retell?.trim() ? html`<br /><em lang="en">${s.retell.trim()}</em>` : ""}
    </p>`,
};

/** Mount Story Restore into a host element. opts is the games' option bag ({ unit, review, grade, ctx, onResult, onDone, persist, restore }). */
export const mountStory = (root, opts) => mountGame(root, opts, spec);
export const storySpec = spec;

/** The unit page's entry point (see ./extras.js): a lesson picker, then the restore; results through the model,
 *  the learner's record in unitWork[gid].story = { lessons:{ <lesson id>: { done, at, retell } }, resume:{…}, done }. */
export function start(host, ctx, va, { gid, g, lessons }) {
  const story = (workOf(va.progress, gid).story ||= {});
  story.lessons = story.lessons && typeof story.lessons === "object" ? story.lessons : {};
  story.resume = story.resume && typeof story.resume === "object" ? story.resume : {};
  const list = (lessons || []).filter(hasPassage);
  const I = makeI18n(langMode(ctx.prefs), "en");
  let current = null;
  let handle = null;
  host.innerHTML = `<div class="va-st-wrap"><div class="va-st-picker-slot"></div><div class="va-st-stage"></div></div>`;
  const slot = host.querySelector(".va-st-picker-slot");
  const stage = host.querySelector(".va-st-stage");

  const status = (l) => {
    const rec = story.lessons[l.id];
    if (rec?.done) return ["✓", I.S("restored", "restaurada")];
    if (story.resume[l.id]) return ["…", I.S("in progress", "en curso")];
    return ["", ""];
  };
  function renderPicker() {
    if (list.length < 2) {
      slot.innerHTML = "";
      return;
    }
    const buttons = list
      .map((l) => {
        const [mark, said] = status(l);
        return html`<li>
          <button
            type="button"
            class="va-st-pick"
            data-st-lesson="${l.id}"
            aria-pressed="${l.id === current}"
          >
            <span class="va-st-pick-n" aria-hidden="true">${l.n ?? ""}</span>
            <span class="va-st-pick-t" lang="en">${l.passage?.title || l.title}</span>
            ${mark ? html`<span class="va-st-pick-m" aria-label="${said}">${mark}</span>` : ""}
          </button>
        </li>`;
      })
      .map((x) => toHtml(x))
      .join("");
    const lab = I.S("Choose a story to restore", "Elige un cuento para restaurar");
    slot.innerHTML = `<nav class="va-st-picker" aria-label="${lab}"><p class="va-st-picker-h"><strong>${lab}</strong></p><ul class="va-st-picks">${buttons}</ul></nav>`;
  }

  function mount(lid) {
    const lesson = list.find((l) => l.id === lid) || list[0];
    if (!lesson) {
      stage.innerHTML = "";
      return;
    }
    current = lesson.id;
    story.last = current;
    handle?.destroy();
    const others = (lessons || []).filter((l) => l.id !== lesson.id).flatMap((l) => l.words || []);
    handle = mountStory(stage, {
      unit: lesson,
      review: others,
      grade: g,
      ctx: { ...ctx, supports: va.supports("reading") },
      now: Date.now(),
      onResult: (ev) => {
        recordResult(va.progress, {
          wordId: ev.wordId,
          dim: ev.dim,
          ok: ev.ok,
          sup: ev.sup,
          type: ev.type,
          now: new Date(),
          unit: gid,
          grade: g,
        });
        va.save();
      },
      onDone: (sum) => {
        story.lessons[lesson.id] = {
          done: true,
          at: new Date().toISOString(),
          judged: sum.judged,
          correct: sum.correct,
          retell: sum.retell || "",
        };
        story.done = true;
        story.at = story.lessons[lesson.id].at;
        va.save();
        renderPicker();
      },
      persist: (key, state) => {
        const lid2 = String(key).split("|")[1] || lesson.id;
        if (state) story.resume[lid2] = { key, at: Date.now(), state };
        else delete story.resume[lid2];
        va.save();
        renderPicker();
      },
      restore: (key) => {
        const lid2 = String(key).split("|")[1] || lesson.id;
        return story.resume[lid2]?.key === key ? story.resume[lid2].state : null;
      },
    });
    renderPicker();
  }
  const onClick = (ev) => {
    const b = ev.target.closest?.("[data-st-lesson]");
    if (!b || !host.contains(b)) return;
    if (b.dataset.stLesson !== current) {
      mount(b.dataset.stLesson);
      stage.scrollIntoView?.({ block: "nearest" });
    }
  };
  host.addEventListener("click", onClick);
  const first =
    (story.last && list.find((l) => l.id === story.last)) ||
    list.find((l) => !story.lessons[l.id]?.done) ||
    list[0];
  mount(first?.id);
  return {
    destroy() {
      host.removeEventListener("click", onClick);
      handle?.destroy();
      handle = null;
    },
    get handle() {
      return handle;
    },
  };
}
