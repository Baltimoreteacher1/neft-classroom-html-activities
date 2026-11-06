// Mystery Word. Each case hides one school word (3-5: science, social studies and school words; 6-8: academic
// words built from prefixes, roots and suffixes). A case card gives a meaning clue, a picture (3-5), a context
// sentence with a blank and the word length. The learner types guesses on the ABC keyboard or a physical keyboard;
// each scored tile is green + check (right spot), gold + arrows (another spot) or gray + dash (not in the word),
// so color is never the only cue. Six guesses per case, three cases per run, each a bit harder.
//
// Word list limitation: a guess must be on the band's authored allowed list for that length (plus every case
// answer). Real words that are not listed are turned away with a gentle message and do NOT use a guess.
//
// Evidence: one judge() call per case, when it is cracked or after the sixth miss. rs.tries is set to the guess
// count first, so `first` = cracked on guess 1 with no hints, `revised` = needed letter feedback to get there,
// and six misses report ok:false. Hints: 1 part of speech + theme, 2 one letter (counted help), 3 a morpheme.
// The Spanish gloss of the word only appears after the case closes (cognates would give it away).
import {
  audioBtn,
  feedbackHTML,
  frameBox,
  glossHTML,
  hintHTML,
  html,
  icon,
  judge,
  newRound,
  pips,
  settled,
  takeHint,
} from "./engine.js";
import { PICS, pic } from "./icons.js";
import {
  allowedFor,
  boardHTML,
  keyboardHTML,
  legendHTML,
  LETTERS,
  MAX_GUESSES,
  nextStep,
  score,
  starsHTML,
  starsOf,
  stickersHTML,
} from "./mystery-word-board.js";

const POS = {
  noun: ["a noun (a naming word)", "un sustantivo (una palabra que nombra)"],
  verb: ["a verb (an action word)", "un verbo (una palabra de acción)"],
  adjective: ["an adjective (a describing word)", "un adjetivo (una palabra que describe)"],
};
const LEN = { "3-5": [5, 6], "6-8": [6, 8] };
const bandOf = (env) => env.content?.bands?.[env.band] || env.content || {};
const cleared = (r) => {
  r.fresh = false;
  r.shake = false;
};
const say = (en, es) => ({ en, es });

function submit(r, s, env) {
  const len = r.word.length;
  const cur = r.cur;
  if (cur.length < len) {
    r.msg = say(`Type ${len} letters first.`, `Primero escribe ${len} letras.`);
    r.shake = true;
    return true;
  }
  if (!allowedFor(bandOf(env), len).has(cur)) {
    r.msg = say(
      `${cur} is not on this game's word list. Try another word. That did not use a guess.`,
      `${cur} no está en la lista de palabras del juego. Prueba otra palabra. No gastaste un intento.`,
    );
    r.shake = true;
    return true;
  }
  if (r.guesses.includes(cur)) {
    r.msg = say(
      `You already tried ${cur}. Try a new word.`,
      `Ya probaste ${cur}. Prueba una palabra nueva.`,
    );
    r.shake = true;
    return true;
  }
  r.guesses.push(cur);
  r.cur = "";
  r.fresh = true;
  const n = r.guesses.length;
  const marks = score(cur, r.word);
  const green = marks.filter((m) => m === "g").length;
  const gold = marks.filter((m) => m === "y").length;
  const ev = {
    id: r.id,
    skill: env.def?.skill?.toLowerCase() || "writing",
    extra: { guesses: n, word: r.word },
  };
  if (cur === r.word) {
    r.rs.tries = n - 1;
    judge(r.rs, true, env, ev);
    r.stars = starsOf(n, r.rs.h);
    r.msg = say(
      `Case cracked! ${r.word} in ${n} ${n === 1 ? "guess" : "guesses"}.`,
      `¡Caso resuelto! ${r.word} en ${n} ${n === 1 ? "intento" : "intentos"}.`,
    );
    s.fk = "next";
  } else if (n >= MAX_GUESSES) {
    r.rs.tries = MAX_GUESSES - 1;
    judge(r.rs, false, env, ev);
    r.msg = say(
      `Six guesses used. The mystery word was ${r.word}.`,
      `Usaste seis intentos. La palabra misteriosa era ${r.word}.`,
    );
    s.fk = "next";
  } else {
    r.msg = say(
      `Guess ${n} of 6: ${cur}. ${green} in the right spot, ${gold} in another spot. ${MAX_GUESSES - n} left.`,
      `Intento ${n} de 6: ${cur}. ${green} en el lugar correcto, ${gold} en otro lugar. Quedan ${MAX_GUESSES - n}.`,
    );
  }
  return true;
}

function press(r, k, s, env) {
  if (settled(r.rs)) return false;
  cleared(r);
  if (k === "enter") return submit(r, s, env);
  if (k === "back") {
    if (!r.cur) return false;
    r.cur = r.cur.slice(0, -1);
    r.msg = null;
    return true;
  }
  if (!LETTERS.includes(k) || r.cur.length >= r.word.length) return false;
  r.cur += k;
  r.msg = null;
  return true;
}

function caseCard(r, s, env) {
  const I = env.I;
  const len = r.word.length;
  const showPic = s.band === "3-5" && env.sup.visuals !== false && r.pic && PICS.includes(r.pic);
  const slots = Array.from({ length: len }, (_, i) => {
    const known = r.hintPos === i && r.rs.h >= 2;
    return html`<li class="mw-slot${known ? " is-known" : ""}">${known ? r.word[i] : ""}</li>`;
  });
  const sentence = String(r.context.en).split("___");
  return html`<article class="mw-case" aria-labelledby="mw-case-t">
    <header class="mw-case-head">
      <span class="mw-case-n"
        >${icon("detective")}${I.T(`Case ${s.i + 1} of ${s.rounds.length}`, `Caso ${s.i + 1} de ${s.rounds.length}`)}</span
      >
      <h2 id="mw-case-t" class="mw-case-title" tabindex="-1">
        ${I.T("Crack the mystery word", "Descubre la palabra misteriosa")}
      </h2>
    </header>
    <div class="mw-case-body${showPic ? " has-pic" : ""}">
      ${showPic ? html`<div class="mw-pic">${pic(r.pic, s.band, I.S("Picture clue", "Imagen de pista"))}</div>` : ""}
      <div class="mw-clues">
        <p class="mw-clue">
          <span class="mw-tag">${I.T("Meaning clue", "Pista de significado")}</span>
          ${I.T(r.clue.en, r.clue.es)}
        </p>
        <p class="mw-context">
          <span class="mw-tag">${I.T("In a sentence", "En una oración")}</span>
          <span lang="en"
            >${sentence[0]}<span
              class="mw-blank"
              role="img"
              aria-label="${I.S("blank", "espacio en blanco")}"
            ></span
            >${sentence[1] || ""}</span
          >${(I.mode || "en") === "en" ? "" : html`<span class="mw-context-es" lang="es">${r.context.es}</span>`}
        </p>
        ${audioBtn(`${r.clue.en} ${r.context.en.replace("___", "blank")}`, I, I.S("Hear the clues", "Escuchar las pistas"))}
      </div>
    </div>
    <div class="mw-length">
      <span class="mw-tag">${I.T(`${len} letters`, `${len} letras`)}</span>
      <ol class="mw-slots" aria-hidden="true">
        ${slots}
      </ol>
    </div>
  </article>`;
}

function studyCard(r, env) {
  const I = env.I;
  const word = r.word.toLowerCase();
  return html`<section class="mw-study" aria-label="${I.S("Word study", "Estudio de la palabra")}">
    <div class="mw-study-head">
      <p class="mw-word">${r.word}</p>
      ${glossHTML(r.es, env)}${audioBtn(word, I, I.S("Hear the word", "Escuchar la palabra"))}${r.rs.status === "right" ? starsHTML(r.stars, I) : ""}
    </div>
    <p class="mw-mean">
      <strong>${I.T("Meaning:", "Significado:")}</strong> ${I.T(r.clue.en, r.clue.es)}
    </p>
    <ol class="mw-parts" aria-label="${I.S("Word parts", "Partes de la palabra")}">
      ${r.parts.map((p) => html`<li><span class="mw-part">${p.t}</span><span class="mw-part-m">${I.T(p.en, p.es)}</span></li>`)}
    </ol>
    <p class="mw-context">
      <span class="mw-tag">${I.T("Back in the sentence", "De vuelta en la oración")}</span>
      ${r.context.en.replace("___", word)}
    </p>
    ${frameBox(r.frame, env, { label: I.T("Use it", "Úsala") })}
  </section>`;
}

export default {
  id: "mystery-word",

  init(env) {
    const band = bandOf(env);
    const tiers = [1, 2, 3]
      .map((t) => (band.words || []).filter((w) => w.tier === t))
      .filter((list) => list.length);
    const n = Math.max(1, Math.min(tiers.length, env.count(3, 2)));
    const rounds = tiers
      .slice(0, n)
      .map((list) => ({
        ...env.rng.pick(list),
        rs: newRound(),
        guesses: [],
        cur: "",
        msg: null,
        hintPos: -1,
        fresh: false,
        shake: false,
        stars: 0,
      }));
    return { band: env.band, i: 0, fk: "", rounds };
  },

  done: (s) => s.i >= s.rounds.length,
  progress: (s) => ({ done: s.rounds.filter((r) => settled(r.rs)).length, total: s.rounds.length }),

  view(s, env) {
    const I = env.I;
    const r = s.rounds[s.i];
    if (!r)
      return html`<p role="status">
        ${I.T("Every case is closed.", "Todos los casos están cerrados.")}
      </p>`;
    const p = this.progress(s);
    const open = !settled(r.rs);
    const pos = POS[r.pos] || POS.noun;
    const hints = [
      I.T(`It is ${pos[0]} about ${r.theme.en}.`, `Es ${pos[1]} sobre ${r.theme.es}.`),
      r.hintPos >= 0
        ? I.T(
            `Letter ${r.hintPos + 1} is ${r.word[r.hintPos]}.`,
            `La letra ${r.hintPos + 1} es ${r.word[r.hintPos]}.`,
          )
        : "",
      I.T(r.morph.en, r.morph.es),
    ];
    const msg = r.msg
      ? I.T(r.msg.en, r.msg.es)
      : open
        ? I.T(
            `${MAX_GUESSES - r.guesses.length} guesses left.`,
            `Quedan ${MAX_GUESSES - r.guesses.length} intentos.`,
          )
        : "";
    const last = s.i + 1 === s.rounds.length;
    return html`<section
      class="cg-station mw-desk mw-${s.band === "6-8" ? "older" : "younger"}"
      data-mechanic="letter-feedback"
    >
      <div class="mw-top">
        ${pips(p.done, p.total, I.S(`${p.done} of ${p.total} cases closed`, `${p.done} de ${p.total} casos cerrados`), I.S)}${stickersHTML(s, I)}
      </div>
      ${caseCard(r, s, env)} ${legendHTML(I)} ${boardHTML(r, I)}
      <p class="mw-status${r.shake ? " is-warn" : ""}" role="status" aria-live="polite">${msg}</p>
      ${
        open
          ? html`${keyboardHTML(r, I)}
              <p class="fine mw-tip">
                ${I.T("You can also type on your keyboard. Enter checks the word.", "También puedes escribir con tu teclado. Enter revisa la palabra.")}
              </p>`
          : ""
      }
      ${hintHTML(r.rs, hints, env, { disabled: !open })}
      ${open ? "" : feedbackHTML(r.rs, { I, right: I.T(`You cracked it in ${r.guesses.length} of 6 guesses.`, `Lo descubriste en ${r.guesses.length} de 6 intentos.`), answer: I.T(`The mystery word was ${r.word}.`, `La palabra misteriosa era ${r.word}.`), explain: I.T(r.explain.en, r.explain.es) })}
      ${open ? "" : studyCard(r, env)}
      ${open ? "" : html`<div class="gs-actions"><button type="button" class="btn btn-primary btn-big" data-g-next>${icon("arrow-right")}${last ? I.T("Close the case file", "Cerrar el expediente") : I.T("Open the next case", "Abrir el siguiente caso")}</button></div>`}
    </section>`;
  },

  click(el, s, env) {
    const b = el.closest("button");
    const r = s.rounds[s.i];
    if (!b || !r) return false;
    if (b.dataset.gK !== undefined) {
      const changed = press(r, b.dataset.gK, s, env);
      if (changed && !settled(r.rs)) s.fk = b.dataset.gK;
      return changed;
    }
    if (b.hasAttribute("data-g-hint") && !settled(r.rs)) {
      const k = takeHint(r.rs, env);
      if (k < 0) return false;
      cleared(r);
      if (k === 1) {
        const found = new Set();
        r.guesses.forEach((g) =>
          score(g, r.word).forEach((m, i) => {
            if (m === "g") found.add(i);
          }),
        );
        const left = [...r.word].map((_, i) => i).filter((i) => !found.has(i));
        r.hintPos = left.length ? left[Math.min(left.length - 1, Math.floor(left.length / 2))] : 0;
      }
      s.fk = "hint";
      return true;
    }
    if (b.hasAttribute("data-g-next") && settled(r.rs)) {
      s.i += 1;
      s.fk = "case";
      return true;
    }
    return false;
  },

  key(e, s, env) {
    if (e.ctrlKey || e.metaKey || e.altKey) return false;
    const r = s.rounds[s.i];
    if (!r) return false;
    const onControl = e.target?.closest?.("button, a, summary, input, textarea, select");
    if (settled(r.rs)) {
      if (e.key !== "Enter" || onControl) return false;
      s.i += 1;
      s.fk = "case";
      return true;
    }
    let k = "";
    if (/^[a-z]$/i.test(e.key)) k = e.key.toUpperCase();
    else if (e.key === "Backspace") k = "back";
    else if (e.key === "Enter" && !onControl) k = "enter";
    if (!k) return false;
    const changed = press(r, k, s, env);
    if (changed && !settled(r.rs)) s.fk = "";
    return changed;
  },

  mount(root, s) {
    const f = s.fk;
    if (!f) return;
    const sel =
      f === "case"
        ? "#mw-case-t"
        : f === "next"
          ? "[data-g-next]"
          : f === "hint"
            ? "[data-g-hint]"
            : `[data-g-k="${f}"]`;
    const el =
      root.querySelector(sel) || (f === "hint" ? root.querySelector('[data-g-k="enter"]') : null);
    el?.focus({ preventScroll: f !== "case" && f !== "next" });
  },

  plan(s, { wrong } = {}, env) {
    const r = s.rounds[s.i];
    if (!r) return [];
    if (settled(r.rs)) return [{ click: "[data-g-next]" }];
    const band = env ? bandOf(env) : { words: s.rounds };
    return nextStep(r, allowedFor(band, r.word.length), wrong);
  },

  validate(content) {
    const errors = [];
    for (const name of ["3-5", "6-8"]) {
      const band = content.bands?.[name] || {};
      const words = band.words || [];
      const [lo, hi] = LEN[name];
      for (const t of [1, 2, 3])
        if (words.filter((w) => w.tier === t).length < 3)
          errors.push(`${name}: tier ${t} needs at least three words`);
      if (new Set(words.map((w) => w.word)).size !== words.length)
        errors.push(`${name}: words must be unique`);
      for (const [len, list] of Object.entries(band.allowed || {})) {
        for (const w of String(list).split(/\s+/).filter(Boolean))
          if (w.length !== Number(len) || !/^[A-Z]+$/.test(w))
            errors.push(`${name}: allowed word ${w} is not ${len} capital letters`);
      }
      for (const w of words) {
        const at = `${name}/${w.id}`;
        if (!/^[A-Z]+$/.test(w.word || "") || w.word.length < lo || w.word.length > hi)
          errors.push(`${at}: word must be ${lo}-${hi} capital letters`);
        if (!POS[w.pos]) errors.push(`${at}: pos must be noun, verb or adjective`);
        if (w.pic && !PICS.includes(w.pic)) errors.push(`${at}: unknown picture ${w.pic}`);
        for (const f of ["theme", "clue", "context", "morph", "explain"])
          if (!w[f]?.en || !w[f]?.es) errors.push(`${at}: ${f} must be bilingual`);
        if (!w.es || !w.frame || !Array.isArray(w.parts))
          errors.push(`${at}: needs es, frame and parts`);
        if (!w.word) continue;
        const lower = w.word.toLowerCase();
        const esWord = String(w.es || "")
          .split(/[ (]/)[0]
          .toLowerCase();
        for (const f of ["theme", "clue", "context", "morph"]) {
          if (new RegExp(`\\b${lower}\\b`, "i").test(`${w[f]?.en} ${w[f]?.es}`))
            errors.push(`${at}: ${f} gives away the answer`);
          if (
            esWord &&
            String(w[f]?.es || "")
              .toLowerCase()
              .includes(esWord)
          )
            errors.push(`${at}: ${f} gives away the Spanish word`);
        }
        if (!String(w.context?.en).includes("___") || !String(w.context?.es).includes("___"))
          errors.push(`${at}: context needs a ___ blank in both languages`);
        if ((w.parts || []).map((p) => p.t).join("") !== w.word)
          errors.push(`${at}: parts must spell the word`);
        if ((w.parts || []).length < 2 || w.parts.some((p) => !p.en || !p.es))
          errors.push(`${at}: at least two bilingual word parts`);
        if (/timer|countdown/i.test(JSON.stringify(w))) errors.push(`${at}: no timer language`);
        const decoys = [...allowedFor(band, w.word.length)].filter((x) => x !== w.word);
        if (decoys.length < 8)
          errors.push(`${at}: needs at least eight other allowed ${w.word.length}-letter guesses`);
      }
    }
    return errors;
  },
};
