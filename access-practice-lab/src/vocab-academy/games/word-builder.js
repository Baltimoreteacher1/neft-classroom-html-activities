// Word Builder — assemble prefixes, bases and suffixes into REAL words. Rounds alternate between
// "build" (from the meaning you want, drag or tap parts into slots) and "predict, then check" (the parts are
// joined for you; predict what the new word will mean, then see the word). A combination that is not a real
// word gets a kind "that is not a word we use" message and is never printed as a word. Only combinations that
// exist in the data are real: the unit's own words, its study.parts examples, and the Word Study dataset.
import { keyOf, buildRecords, validKeys } from "./morph-records.js";
import { choiceCount } from "./data.js";
import {
  choicesHTML,
  fbHTML,
  hintButton,
  html,
  icon,
  mcAct,
  mcFeedback,
  mountGame,
} from "./kit.js";
import { newMc } from "./questions.js";
import { mem, playOnce, rose } from "./stage-a.js";
import { cue } from "./fx.js";
import { clean, norm, uniq } from "./text.js";

export const TITLE = ["Word Builder", "Constructor de palabras"];
const COUNT = { early: 4, "upper-elem": 5, middle: 6, high: 6 };
const SLOT_NAME = {
  prefix: ["Start part", "Parte inicial"],
  compound: ["First word", "Primera palabra"],
  base: ["Base word", "Palabra base"],
  suffix: ["End part", "Parte final"],
};
const MAX_TRAY = 7;
/** What each kind of part is called on its tile. Shape, colour and this word all say it, so colour is never the only cue. */
const ROLE_NAME = {
  prefix: ["Prefix", "Prefijo"],
  compound: ["Word", "Palabra"],
  base: ["Base", "Base"],
  suffix: ["Suffix", "Sufijo"],
};
const roleOf = (type) => (ROLE_NAME[type] ? type : "base");

const partLabel = (p) => (p.meaning ? `${p.form} (${p.meaning})` : p.form);
const eq = (parts) => parts.map(partLabel).join(" + ");

/** Meaning choices for a predict round: the word's gloss among other real glosses. */
function glossChoices(pool, records, rec, rng) {
  const n = choiceCount(pool);
  const taken = new Set([norm(rec.gloss)]);
  const others = [
    ...records.filter((r) => r !== rec).map((r) => r.gloss),
    ...pool.all.map((w) => w.def),
  ]
    .map(clean)
    .filter((g) => g && !taken.has(norm(g)));
  const wrong = uniq(rng.shuffle(uniq(others))).slice(0, n - 1);
  if (wrong.length < 2) return null;
  const all = rng.shuffle([clean(rec.gloss), ...wrong]);
  return { choices: all, answer: all.indexOf(clean(rec.gloss)) };
}

/** Parts that look plausible but are not in this word, by slot type. */
function distractors(records, rec, rng) {
  const mine = new Set(rec.parts.map((p) => p.k));
  const out = [];
  for (const type of uniq(rec.parts.map((p) => p.type))) {
    const seen = new Set(mine);
    const cands = [];
    for (const r of records)
      for (const p of r.parts)
        if (p.type === type && !seen.has(p.k)) {
          seen.add(p.k);
          cands.push(p);
        }
    out.push(...rng.shuffle(cands).slice(0, type === "base" ? 2 : 1));
  }
  return out;
}

/** Pure engine. records: from buildRecords. Returns rounds (empty when fewer than two real words exist). */
export function buildBuilder(pool, records, rng, { count } = {}) {
  if (records.length < 2) return [];
  const chosen = rng.shuffle(records).slice(0, count || COUNT[pool.band] || 5);
  return chosen.map((rec, i) => {
    const mc = i % 2 === 1 && rec.gloss ? glossChoices(pool, records, rec, rng) : null;
    const tray = rng.shuffle([...rec.parts, ...distractors(records, rec, rng)]).slice(0, MAX_TRAY);
    for (const p of rec.parts) if (!tray.some((t) => t.k === p.k)) tray.push(p);
    const base = {
      rec,
      i,
      tries: 0,
      hints: 0,
      hidden: [],
      assist: "",
      msg: null,
      done: false,
      firstTry: false,
      sel: "",
    };
    if (mc) {
      return {
        ...base,
        mode: "predict",
        tray: [],
        slots: rec.parts.map((p) => p.k),
        q: {
          type: "predict",
          wordId: rec.wordId || "",
          dim: "morph",
          stem: `Predict. If you join ${eq(rec.parts)}, what will the new word mean?`,
          choices: mc.choices,
          answer: mc.answer,
          hint: "Say what each part adds, one at a time. Then put the meanings together.",
          why: `The new word is “${rec.word}”. It means: ${clean(rec.gloss)}`,
        },
        mc: newMc(),
      };
    }
    return { ...base, mode: "build", tray, slots: rec.parts.map(() => "") };
  });
}

/** What a built combination is: "target", a real word that is not the target, or "none". */
export function judgeBuild(round, valid) {
  const key = round.slots.join("+");
  if (round.slots.some((k) => !k)) return { kind: "incomplete" };
  if (key === keyOf(round.rec.parts)) return { kind: "target" };
  const other = valid.get(key);
  return other ? { kind: "real", rec: other } : { kind: "none" };
}

/** Place or remove a chip. Pure on the round. */
export function toggleChip(round, k) {
  const at = round.slots.indexOf(k);
  if (at >= 0) {
    round.slots[at] = "";
    return true;
  }
  const chip = round.tray.find((t) => t.k === k);
  if (!chip) return false;
  const types = round.rec.parts.map((p) => p.type);
  let slot = types.findIndex((t, i) => t === chip.type && !round.slots[i]);
  if (slot < 0) slot = types.findIndex((t) => t === chip.type);
  if (slot < 0) return false;
  round.slots[slot] = k;
  return true;
}

const clueFor = (rec) =>
  rec.gloss
    ? `Build a word that means: “${clean(rec.gloss)}”`
    : `Build a word from ${rec.parts
        .map((p) =>
          p.type === "base"
            ? `the base “${p.form}”`
            : p.meaning
              ? `a part that means “${p.meaning}”`
              : `“${p.form}”`,
        )
        .join(" and ")}.`;

function slotsView(r, env, interactive) {
  const I = env.I;
  const chipOf = (k) => r.rec.parts.find((p) => p.k === k) || r.tray.find((t) => t.k === k);
  const joined = r.slots.length > 0 && r.slots.every(Boolean);
  return html`<ol class="vag-slots ${joined ? "is-joined" : ""}" aria-label="${I.S("Word slots", "Espacios de la palabra")}">
    ${r.rec.parts.map((p, i) => {
      const k = r.slots[i];
      const chip = k ? chipOf(k) : null;
      const name = I.S(...SLOT_NAME[p.type]);
      const role = roleOf(p.type);
      return html`<li class="vag-slot-wrap">
        ${
          interactive
            ? html`<button
                type="button"
                class="vag-slot ${chip ? "is-full" : ""}"
                data-role="${role}"
                data-slot="${i}"
                data-fk="slot-${i}"
                aria-label="${name}: ${chip ? `${chip.form}. ${I.S("Press to take it out.", "Presiona para quitarla.")}` : I.S("empty", "vacío")}"
              >
                ${chip ? html`<span class="vga-tile-f">${chip.form}</span><span class="vga-tile-r" aria-hidden="true">${I.T(...ROLE_NAME[role])}</span>` : html`<span class="vag-slot-hint">${name}</span>`}
              </button>`
            : html`<span class="vag-slot is-full" data-role="${role}"
                ><span class="vag-sr">${name}: </span><span class="vga-tile-f">${chip ? chip.form : ""}</span><span class="vga-tile-r" aria-hidden="true">${I.T(...ROLE_NAME[role])}</span></span
              >`
        }
        ${i < r.rec.parts.length - 1 ? html`<span class="vag-plus" aria-hidden="true">+</span>` : ""}
      </li>`;
    })}
  </ol>`;
}

function buildView(r, env) {
  const I = env.I;
  const showMeaning = env.band !== "middle" || env.sup.model;
  const msg = r.msg;
  const full = r.slots.every(Boolean);
  const live = r.tray.filter((t) => !r.hidden.includes(t.k));
  return html`<div class="vag-qcard vag-build">
    <p class="vag-qtype">
      <strong>${I.T("Word", "Palabra")} ${r.i + 1}</strong> ·
      ${I.T("Build the word", "Construye la palabra")}
    </p>
    <p class="vag-q">${clueFor(r.rec)}</p>
    ${r.done ? "" : slotsView(r, env, true)}
    ${
      r.done
        ? ""
        : html`<ul
            class="vag-chips"
            data-rove
            data-cols="0"
            aria-label="${I.S("Word parts", "Partes de palabras")}"
          >
            ${live.map((t, n) => {
              const placed = r.slots.includes(t.k);
              return html`<li>
                <button
                  type="button"
                  class="vag-chip ${placed ? "is-placed" : ""} ${r.assist === t.k ? "is-assist" : ""}"
                  data-role="${roleOf(t.type)}"
                  data-chip="${t.k}"
                  data-fk="chip-${t.k}"
                  data-rv
                  ${n === 0 ? "data-rv-cur" : ""}
                  aria-pressed="${placed}"
                >
                  <span class="vag-chip-f"
                    >${r.assist === t.k ? icon("star") : placed ? icon("check") : ""}${t.form}</span
                  >
                  <span class="vga-tile-r" aria-hidden="true">${I.T(...ROLE_NAME[roleOf(t.type)])}</span>
                  ${showMeaning && t.meaning ? html`<span class="vag-chip-m">${t.meaning}</span>` : ""}
                </button>
              </li>`;
            })}
          </ul>`
    }
    ${r.done ? revealView(r, env) : ""}
    <div class="vag-actions">
      ${
        r.done
          ? html`<button
              type="button"
              class="btn btn-primary"
              data-next
              data-fk="next"
              data-autofocus
            >
              ${I.T("Next word", "Siguiente palabra")}${icon("arrow-right")}
            </button>`
          : html`<button
                type="button"
                class="btn btn-primary"
                data-check
                data-fk="check"
                ${full ? "" : 'aria-disabled="true"'}
              >
                ${icon("check")}${I.T("Check my word", "Revisar mi palabra")}
              </button>
              <button type="button" class="btn small" data-clear data-fk="clear">
                ${icon("retry")}${I.T("Clear", "Borrar")}
              </button>
              ${r.hints >= 3 ? "" : html`<button type="button" class="btn small vag-hint" data-bhint data-fk="hint">${icon("bulb")}${I.T("Hint", "Pista")}</button>`}`
      }
    </div>
    ${msg ? fbHTML(msg.kind, msg.text, I) : ""}
  </div>`;
}

function revealView(r, env) {
  const I = env.I;
  const rec = r.rec;
  return html`<div class="vag-reveal">
    <div class="vga-machine" aria-hidden="true">
      <span class="vga-m-in">${rec.parts.map((p) => html`<span class="vga-m-part" data-role="${roleOf(p.type)}">${p.form}<small>${I.T(...ROLE_NAME[roleOf(p.type)])}</small></span>`)}</span>
      <span class="vga-m-box"><i class="vga-gear vga-gear-a"></i><i class="vga-gear vga-gear-b"></i><b>${I.T("Word machine", "Máquina de palabras")}</b></span>
      <span class="vga-m-out"><strong>${rec.word}</strong></span>
    </div>
    <p class="vag-built">
      <span class="vag-sr">${I.S("The word you built:", "La palabra que construiste:")} </span
      ><strong>${rec.word}</strong>
    </p>
    <p class="vag-eq">${eq(rec.parts)} → <strong>${rec.word}</strong></p>
    <p>
      ${rec.gloss ? html`${I.T("It means", "Significa")}: ${rec.gloss}` : I.T("Each part adds its own meaning to the base.", "Cada parte le suma su significado a la base.")}
    </p>
  </div>`;
}

function predictView(r, env) {
  const I = env.I;
  return html`<div class="vag-qcard vag-build">
    <p class="vag-qtype">
      <strong>${I.T("Word", "Palabra")} ${r.i + 1}</strong> ·
      ${I.T("Predict, then check", "Predice y comprueba")}
    </p>
    <p class="vag-q">${r.q.stem}</p>
    ${slotsView(r, env, false)} ${choicesHTML(r.q, r.mc, env)}
    ${r.mc.done ? revealView(r, env) : ""}
    <div class="vag-actions">
      ${hintButton(r.mc, env)}
      ${r.mc.done ? html`<button type="button" class="btn btn-primary" data-next data-fk="next" data-autofocus>${I.T("Next word", "Siguiente palabra")}${icon("arrow-right")}</button>` : ""}
    </div>
    ${mcFeedback(r.q, r.mc, env)}
  </div>`;
}

const spec = {
  id: "word-builder",
  title: TITLE,
  howTo: [
    [
      "Read what the word should mean. Tap the parts to put them in the slots, in order.",
      "Lee qué debe significar la palabra. Toca las partes para ponerlas en los espacios, en orden.",
    ],
    [
      "Choose Check my word. If the parts do not make a real word, you will be told, and you can try again.",
      "Elige Revisar mi palabra. Si las partes no forman una palabra real, te lo diremos y puedes intentar otra vez.",
    ],
    [
      "Some rounds are Predict. The parts are joined for you. Pick what you think the new word means.",
      "En algunas rondas debes predecir. Las partes ya están unidas. Elige qué crees que significa la palabra nueva.",
    ],
    [
      "Only real words count. Letters can join in many ways, but only some make words people use.",
      "Solo cuentan las palabras reales. Las letras se pueden unir de muchas formas, pero solo algunas forman palabras que la gente usa.",
    ],
  ],
  keys: [
    [
      "Tab and Enter",
      ["pick a part, or take one out of a slot", "elegir una parte o quitarla de un espacio"],
    ],
    ["Arrow keys", ["move between parts", "moverse entre partes"]],
    [
      "1 to 4",
      ["choose an answer in a Predict round", "elegir una respuesta en una ronda de predicción"],
    ],
  ],
  empty: [
    "This set does not have enough words with parts to build. Choose a lesson about word parts, such as un-, re- or -ful, and try again.",
    "Este conjunto no tiene suficientes palabras con partes. Elige una lección sobre partes de palabras, como un-, re- o -ful, e inténtalo de nuevo.",
  ],

  async load(env) {
    let ds = env.opts.morph?.dataset;
    let isReal = env.opts.morph?.isRealDerivation;
    if (!env.opts.morph) {
      try {
        const ws = await import("../wordstudy/index.js");
        ds = await ws.morphDataset?.();
        isReal = ws.isRealDerivation;
      } catch {
        /* the Word Study module is optional: the unit's own parts are enough */
      }
    }
    env.recs = buildRecords(env.pool, { dataset: ds, isReal });
    env.valid = validKeys(env.recs, ds, env.pool);
  },
  build(env) {
    return { rounds: buildBuilder(env.pool, env.recs || [], env.rng), i: 0 };
  },
  valid: (s) => Array.isArray(s?.rounds) && s.rounds.length > 0,
  unplayable: (s) => !s.rounds.length,
  isDone: (s) => s.i >= s.rounds.length,
  progress: (s) => ({ done: Math.min(s.i, s.rounds.length), total: s.rounds.length }),
  view: (s, env) => {
    const r = s.rounds[s.i];
    return r.mode === "predict" ? predictView(r, env) : buildView(r, env);
  },

  click(el, s, env) {
    const r = s.rounds[s.i];
    if (el.closest("[data-next]")) {
      if (!(r.mode === "predict" ? r.mc.done : r.done)) return false;
      s.i += 1;
      return true;
    }
    if (r.mode === "predict") return mcAct(el, r.q, r.mc, env, { kind: "predict" });
    if (r.done) return false;
    const chip = el.closest("[data-chip]");
    if (chip) {
      r.msg = null;
      r.assist = "";
      return toggleChip(r, chip.dataset.chip);
    }
    const slot = el.closest("[data-slot]");
    if (slot) {
      const k = r.slots[Number(slot.dataset.slot)];
      if (!k) return false;
      r.slots[Number(slot.dataset.slot)] = "";
      r.msg = null;
      return true;
    }
    if (el.closest("[data-clear]")) {
      r.slots = r.slots.map(() => "");
      r.msg = null;
      return true;
    }
    if (el.closest("[data-bhint]")) {
      r.hints += 1;
      env.use("model");
      const meanings = r.rec.parts
        .filter((p) => p.meaning)
        .map((p) => `${p.form} means “${p.meaning}”`);
      if (r.hints === 1)
        r.msg = {
          kind: "hint",
          text: meanings.length
            ? `${meanings.join(". ")}.`
            : "Say each part out loud. What does each part add?",
        };
      else if (r.hints === 2) {
        const wrong = r.tray.find(
          (t) =>
            !r.rec.parts.some((p) => p.k === t.k) &&
            !r.hidden.includes(t.k) &&
            !r.slots.includes(t.k),
        );
        if (wrong) r.hidden.push(wrong.k);
        r.msg = {
          kind: "hint",
          text: wrong
            ? "One part that does not belong was taken away."
            : "Check the order of your parts.",
        };
      } else {
        const want = r.rec.parts.find((p, i) => r.slots[i] !== p.k);
        r.assist = want ? want.k : "";
        r.msg = { kind: "hint", text: "One part is marked with a star. It belongs in the word." };
      }
      return true;
    }
    if (el.closest("[data-check]")) {
      if (r.slots.some((k) => !k)) {
        env.say(env.I.S("Fill every slot first.", "Llena todos los espacios primero."));
        return false;
      }
      const j = judgeBuild(r, env.valid);
      const first = r.tries === 0;
      r.tries += 1;
      if (j.kind === "target") {
        r.done = true;
        r.msg = { kind: "ok", text: "That is a real word, and it is the one we were building." };
        if (r.rec.wordId)
          env.report({
            wordId: r.rec.wordId,
            dim: "morph",
            ok: true,
            firstTry: first,
            kind: "build",
          });
        env.say(
          env.I.S("Right. You built a real word.", "Correcto. Construiste una palabra real."),
        );
      } else {
        r.msg =
          j.kind === "real"
            ? {
                kind: "info",
                text: `${j.rec.word} is a real word${j.rec.gloss ? `: ${j.rec.gloss}` : ""}. This round asks for a different word. Look at the meaning again.`,
              }
            : {
                kind: "retry",
                text: "That combination is not a word people use. Letters can join in many ways, but only some make real words. Try a different part.",
              };
        if (r.rec.wordId)
          env.report({
            wordId: r.rec.wordId,
            dim: "morph",
            ok: false,
            firstTry: false,
            kind: "build",
          });
        env.say(
          env.I.S(
            "That is not the word. Try different parts.",
            "Esa no es la palabra. Prueba otras partes.",
          ),
        );
      }
      return true;
    }
    return false;
  },
  /** Decoration only: tiles snap into their slots, the finished word closes up, and the word machine runs once. */
  after(body, s, env) {
    const r = s.rounds[s.i];
    if (!r) return;
    const m = mem(env);
    const slots = r.slots.map((k) => k || "");
    if (m.round === s.i && Array.isArray(m.slots)) {
      slots.forEach((k, j) => {
        if (k && k !== m.slots[j]) playOnce(body.querySelector(`.vag-slot[data-slot="${j}"]`), "is-snapping");
      });
    }
    const full = slots.length > 0 && slots.every(Boolean);
    if (m.round === s.i && full && !m.full) {
      playOnce(body.querySelector(".vag-slots"), "is-joining");
      cue("step");
    }
    m.round = s.i;
    m.slots = slots;
    m.full = full;
    const done = r.mode === "predict" ? r.mc.done : r.done;
    if (rose(env, `done-${s.i}`, done)) body.querySelector(".vga-machine")?.classList.add("is-run");
  },
  extra: (s) => ({ words: s.rounds.map((r) => r.rec.word) }),
};

export default {
  id: "word-builder",
  title: TITLE[0],
  titleEs: TITLE[1],
  blurb: "Join prefixes, bases and suffixes into real words, and predict what each new word means.",
  blurbEs: "Une prefijos, bases y sufijos en palabras reales y predice qué significa cada una.",
  purpose: "See how word parts build meaning, using only real words.",
  minGrade: "1",
  maxGrade: "12",
  dims: ["morph"],
  mount: (root, opts) => mountGame(root, opts, spec),
  engine: { build: buildBuilder, judge: judgeBuild, toggle: toggleChip, records: buildRecords },
};
