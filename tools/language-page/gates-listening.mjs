// G-53 listening-content-derived, G-54 listening-tts-plumbing (G-55 is reserved for this area).
//
// G-53 re-reads the AUTHORED unit files and proves every Listening Lab item is a faithful copy of the authored field
//     its `from` pointer names (vocab def, clue_game clue, word_sort item), with the right answer and options drawn
//     only from the same unit. An invented sentence, a wrong answer or an outside option fails.
// G-54 mounts the real players in jsdom with a fake speechSynthesis: the transcript is on by default for WIDA levels 1-2
//     and off for 3-6 with a working toggle, Listen speaks the item at normal then slow speed, the replay counter counts,
//     dictogloss has a Slow/Natural speed choice, and nothing uses an audio file, a timer or the network.
import { STUDIO_LOADERS } from "../../db/seeds/bcpss/v2/index.mjs";
import { LAB_GENERATOR, LAB_MIN_LISTENING, norm } from "../../db/seeds/bcpss/v2/listening-lab.mjs";
import { clone } from "./dataset.mjs";
import { setupDom } from "./render.mjs";

const LEVELS = ["l1_2", "l3_4", "l5_6"];
const DIGIT_WORD = {
  zero: 0,
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
};

// An oracle that does NOT call spokenMath: the spoken words must equal the authored text once the spoken operator words
// and the written math symbols are both removed, fractions read as "n <ordinal>", decimals digit by digit.
const SPOKEN_OPS =
  /\b(plus|times|divided by|equals|is less than or equal to|is greater than or equal to|is less than|is greater than|minus|squared|cubed|negative|the square root of|pi)\b/g;
const core = (s) =>
  norm(
    String(s)
      .toLowerCase()
      .replace(SPOKEN_OPS, " ")
      .replace(/[+×÷=<>≤≥²³√π−]/g, " "),
  );
const ORD = {
  2: ["half", "halves"],
  3: ["third", "thirds"],
  4: ["fourth", "fourths"],
  5: ["fifth", "fifths"],
  6: ["sixth", "sixths"],
  7: ["seventh", "sevenths"],
  8: ["eighth", "eighths"],
  9: ["ninth", "ninths"],
  10: ["tenth", "tenths"],
  12: ["twelfth", "twelfths"],
  100: ["hundredth", "hundredths"],
};
const digitsOf = (s) =>
  String(s)
    .toLowerCase()
    .replace(/\b(zero|one|two|three|four|five|six|seven|eight|nine)\b/g, (w) => DIGIT_WORD[w])
    .replace(/\D/g, "");
const SYMBOLS = /[×÷=<>≤≥²³√π−+]/;
function sameSpoken(say, text) {
  const t = String(text).trim();
  const frac = t.match(/^(\d+)\/(\d+)$/);
  if (frac) {
    const word = ORD[frac[2]];
    const ok = word ? `${frac[1]} ${frac[1] === "1" ? word[0] : word[1]}` : "";
    return norm(say) === ok || norm(say) === norm(`${frac[1]} over ${frac[2]}`);
  }
  if (/^\d+\.\d+$/.test(t)) return digitsOf(say) === t.replace(/\D/g, "") && /point/.test(say);
  return core(say) === core(t);
}

const authored = new Map();
async function authoredUnit(id) {
  if (!authored.has(id)) authored.set(id, (await STUDIO_LOADERS[id]()).default);
  return authored.get(id);
}

// ── G-53 ──────────────────────────────────────────────────────────────────────
function checkItem(unitId, a, it, k, raw, errors) {
  const where = `${unitId} "${a.title}" item ${k + 1}`;
  const labels = it.options.map((o) => o.label);
  if (!Number.isInteger(it.answer) || it.answer < 0 || it.answer >= labels.length)
    return errors.push(`${where}: answer index out of range`);
  const [type, x, y] = String(it.from || "").split(":");
  const terms = raw.vocab.map((v) => v.term);
  if (type === "vocab") {
    const v = raw.vocab.find((t) => t.term === x);
    if (!v) return errors.push(`${where}: from names a vocab term that does not exist ("${x}")`);
    if (!sameSpoken(it.say, v.def))
      errors.push(`${where}: sentence is not the authored definition of "${x}"`);
    if (labels[it.answer] !== v.term) errors.push(`${where}: answer is not "${x}"`);
    if (!it.why.includes(v.example))
      errors.push(`${where}: explanation lacks the authored example`);
    for (const l of labels)
      if (!terms.includes(l)) errors.push(`${where}: option "${l}" is not a word of this unit`);
    if (norm(v.def).includes(norm(v.term))) errors.push(`${where}: the meaning says the answer`);
  } else if (type === "clue_game") {
    const card = raw.activities.find((q) => q.kind === "clue_game")?.payload.cards[Number(x)];
    if (!card) return errors.push(`${where}: from names a clue card that does not exist`);
    if (!sameSpoken(it.say, card.clues[Number(y)]))
      errors.push(`${where}: sentence is not the authored clue`);
    if (labels[it.answer] !== card.term) errors.push(`${where}: answer is not "${card.term}"`);
    for (const l of labels)
      if (
        !terms.includes(l) &&
        !raw.activities.find((q) => q.kind === "clue_game").payload.cards.some((c) => c.term === l)
      )
        errors.push(`${where}: option "${l}" is not a word of this unit`);
  } else if (type === "word_sort") {
    const src = raw.activities[Number(x)];
    const item = src?.kind === "word_sort" ? src.payload.items[Number(y)] : null;
    if (!item) return errors.push(`${where}: from names a word_sort item that does not exist`);
    if (!sameSpoken(it.say, item.text))
      errors.push(`${where}: sentence is not the authored item "${item.text}"`);
    if (labels[it.answer] !== src.payload.categories[item.cat].name)
      errors.push(`${where}: answer is not the authored group`);
    const names = src.payload.categories.map((c) => c.name);
    if (labels.length !== names.length || labels.some((l, i) => l !== names[i]))
      errors.push(`${where}: options are not the authored groups`);
  } else errors.push(`${where}: no provenance pointer ("${it.from}")`);
  if (SYMBOLS.test(it.say)) errors.push(`${where}: spoken text still holds a math symbol`);
  if (new Set(labels).size !== labels.length) errors.push(`${where}: duplicate options`);
}

export async function checkDerived(units) {
  const errors = [];
  for (const d of units) {
    const id = d.unit.id;
    const raw = await authoredUnit(id);
    const acts = d.studio?.activities || [];
    const authoredCount = raw.activities.length;
    if (acts.slice(0, authoredCount).some((a, i) => a.title !== raw.activities[i].title))
      errors.push(`${id}: authored activities moved or changed`);
    const lab = acts.filter((a) => a.derived?.generator === LAB_GENERATOR);
    if (acts.length !== authoredCount + lab.length)
      errors.push(`${id}: unexplained extra activities`);
    const listening = acts.filter((a) => a.domain === "Listening").length;
    if (listening < LAB_MIN_LISTENING) errors.push(`${id}: ${listening} Listening activities`);
    if (!lab.some((a) => a.payload.mode === "choose")) errors.push(`${id}: no listen-and-choose`);
    for (const a of lab) {
      if (a.derived.status !== "draft" || !a.derived.notice)
        errors.push(`${id} "${a.title}": derived activity is not marked draft with a notice`);
      if (a.kind !== "listen_and_show" || a.domain !== "Listening")
        errors.push(`${id} "${a.title}": wrong kind/domain`);
      if (a.payload.transcript !== "toggle")
        errors.push(`${id} "${a.title}": no transcript toggle`);
      if (a.payload.items.length < 4) errors.push(`${id} "${a.title}": fewer than 4 items`);
      a.payload.items.forEach((it, k) => checkItem(id, a, it, k, raw, errors));
    }
  }
  return errors;
}

const swapSay = (data, what) => {
  const c = clone(data.units);
  const a = c[3].studio.activities.find((x) => x.derived);
  if (what === "invented") a.payload.items[0].say = "The purple dragon counted seven golden coins.";
  if (what === "answer")
    a.payload.items[1].answer = (a.payload.items[1].answer + 1) % a.payload.items[1].options.length;
  if (what === "option") a.payload.items[2].options[0] = { label: "unicorn" };
  if (what === "pointer") a.payload.items[0].from = "";
  if (what === "draft") a.derived.status = "reviewed";
  return c;
};

export const g53 = {
  id: "G-53",
  name: "listening-content-derived",
  async run({ data }) {
    const errors = await checkDerived(data.units);
    const lab = data.units.flatMap((d) => d.studio.activities.filter((a) => a.derived));
    const items = lab.reduce((n, a) => n + a.payload.items.length, 0);
    return {
      errors,
      info: {
        derivedActivities: lab.length,
        items,
        choose: lab.filter((a) => a.payload.mode === "choose").length,
        sort: lab.filter((a) => a.payload.mode === "sort").length,
      },
    };
  },
  async controls({ data }) {
    const out = [];
    for (const [name, what] of [
      ["an invented sentence", "invented"],
      ["a wrong answer", "answer"],
      ["an option from outside the unit", "option"],
      ["an item with no provenance pointer", "pointer"],
      ["a derived activity marked reviewed", "draft"],
    ])
      out.push({ name, errors: await checkDerived(swapSay(data, what)) });
    return out;
  },
};

// ── G-54 ──────────────────────────────────────────────────────────────────────
function installDom() {
  const window = setupDom();
  for (const k of ["Node", "HTMLElement", "Event", "KeyboardEvent"]) globalThis[k] ||= window[k];
  window.matchMedia ||= () => ({ matches: true });
  window.HTMLElement.prototype.scrollIntoView ||= () => {};
  return window;
}

function speech(window, { speaks = true } = {}) {
  const spoken = [];
  window.speechSynthesis = {
    speak(u) {
      if (!speaks) return;
      spoken.push(u);
      queueMicrotask(() => u.onend?.());
    },
    cancel() {},
  };
  globalThis.SpeechSynthesisUtterance = class {
    constructor(text) {
      this.text = text;
    }
  };
  return spoken;
}
const noSpeech = (window) => {
  delete window.speechSynthesis;
  delete globalThis.SpeechSynthesisUtterance;
};

const settle = () => new Promise((r) => setImmediate(r));
let guard = null;
async function mount(kind, activity, level, studio) {
  const window = installDom();
  document.body.replaceChildren();
  const root = document.createElement("div");
  document.body.append(root);
  const mod = await import(`../../bcpss-teachers/language-studio/studio-kinds/${kind}.js`);
  const ctx = {
    payload: activity.payload,
    activity,
    level,
    studio,
    shuffle: (a) => [...a],
    rng: () => 0.5,
    tts: async () => false,
    announce() {},
    vocabIcon: () => "",
    loadState: () => null,
    saveState() {},
    done() {},
  };
  window.setInterval = guard.interval;
  const cleanup = mod.default(root, ctx);
  return { root, cleanup };
}

/** What a student can see/do in one mounted listening activity. Returns a list of problems. */
async function probe(kind, activity, level, studio, { interact, hook, speaks = true }) {
  const where = `${studio.id} "${activity.title}" ${level}`;
  const errors = [];
  const window = installDom();
  const spoken = speech(window, { speaks });
  guard = { calls: 0, interval: () => (guard.calls++, 0) };
  const { root, cleanup } = await mount(kind, activity, level, studio);
  hook?.(root, level);
  const q = (s) => root.querySelector(s);
  const caption = q(".sl-caption");
  const toggle = q('[data-key="transcript"]');
  const wantShown = level === "l1_2";
  if (!toggle) errors.push(`${where}: no transcript toggle`);
  if (!caption) errors.push(`${where}: no transcript text in the page`);
  else if (caption.hidden === wantShown)
    errors.push(
      `${where}: transcript ${caption.hidden ? "hidden" : "shown"} by default, expected ${wantShown ? "shown" : "hidden"}`,
    );
  if (toggle && caption) {
    toggle.click();
    if (caption.hidden !== wantShown)
      errors.push(`${where}: transcript toggle did not flip the text`);
    toggle.click();
  }
  if (root.querySelector("audio, video, [src], [data-timer], .timer, [role=timer]"))
    errors.push(`${where}: audio file, media element or timer in the page`);
  if (kind === "listen_and_show" && !q(".sg-hints__btn")) errors.push(`${where}: no hint ladder`);
  if (/\b(undefined|null|NaN)\b|\[object/.test(root.textContent))
    errors.push(`${where}: placeholder text (undefined/null) rendered in the page`);
  if (/\b(timer|countdown|seconds left|time left)\b/i.test(root.textContent))
    errors.push(`${where}: timer wording in the page`);
  if (interact) {
    const listen = q(".sl-listen__go") || q(".ow-listen button");
    const text = kind === "dictogloss" ? activity.payload.text : activity.payload.items[0].say;
    listen?.click();
    await settle();
    if (!spoken.length) errors.push(`${where}: Listen did not call speechSynthesis`);
    else if (spoken[0].text !== text)
      errors.push(`${where}: spoke "${spoken[0].text}", expected the item text`);
    if (kind === "dictogloss") {
      if (spoken[0] && spoken[0].rate !== 0.8)
        errors.push(`${where}: first dictogloss listen is not slow`);
      q('[data-key="speed-natural"]')?.click();
      q(".ow-listen button")?.click();
      await settle();
      if (spoken[1] && spoken[1].rate !== 1)
        errors.push(`${where}: Natural speed did not speak at normal rate`);
      q('[data-key="speed-slow"]')?.click();
      q(".ow-listen button")?.click();
      await settle();
      if (spoken[2] && spoken[2].rate !== 0.8)
        errors.push(`${where}: Slow speed did not speak slowly`);
    } else {
      if (spoken[0] && spoken[0].rate !== 0.95)
        errors.push(`${where}: Listen is not at normal speed`);
      q(".sl-listen__slow")?.click();
      await settle();
      if (spoken[1] && spoken[1].rate !== 0.7) errors.push(`${where}: Listen slowly is not slow`);
    }
    const plays = q(".ll-plays");
    const n = kind === "dictogloss" ? 3 : 2;
    if (!plays || plays.dataset.count !== String(n))
      errors.push(`${where}: replay counter reads "${plays?.textContent}", expected ${n}`);
  }
  if (guard.calls) errors.push(`${where}: setInterval used (${guard.calls})`);
  cleanup?.();
  return errors;
}

function targets(units) {
  const out = [];
  for (const d of units) {
    const studio = { id: d.unit.id, vocab: d.studio.vocab };
    for (const a of d.studio.activities) {
      if (a.derived) out.push({ kind: "listen_and_show", a, studio, d });
      else if (a.kind === "dictogloss") out.push({ kind: "dictogloss", a, studio, d });
    }
  }
  return out;
}

export async function checkPlumbing(
  units,
  { sample = 8, hook, speaks = true, strip = false } = {},
) {
  const errors = [];
  const all = targets(units);
  const step = Math.max(1, Math.floor(units.length / sample));
  const sampled = new Set(units.filter((_, i) => i % step === 0).map((d) => d.unit.id));
  for (const t of all) {
    const activity = strip ? { ...t.a, payload: { ...t.a.payload, transcript: undefined } } : t.a;
    for (const level of LEVELS)
      errors.push(
        ...(await probe(t.kind, activity, level, t.studio, {
          interact: sampled.has(t.studio.id) && level === "l3_4",
          hook,
          speaks,
        })),
      );
  }
  // No speech on the device: the words must always be readable and the page must say audio is missing.
  const window = installDom();
  for (const t of all.filter((x) => x.kind === "listen_and_show").slice(0, 6)) {
    noSpeech(window);
    document.body.replaceChildren();
    const root = document.createElement("div");
    document.body.append(root);
    const mod = await import(
      "../../bcpss-teachers/language-studio/studio-kinds/listen_and_show.js"
    );
    const cleanup = mod.default(root, {
      payload: t.a.payload,
      activity: t.a,
      level: "l5_6",
      studio: t.studio,
      shuffle: (a) => a,
      rng: () => 0.5,
      tts: async () => false,
      announce() {},
      vocabIcon: () => "",
      loadState: () => null,
      saveState() {},
      done() {},
    });
    if (root.querySelector(".sl-caption")?.hidden)
      errors.push(`${t.studio.id}: no speech but the words are hidden`);
    if (!/Audio is not available/.test(root.textContent))
      errors.push(`${t.studio.id}: no speech and no notice`);
    cleanup?.();
  }
  return errors;
}

export const g54 = {
  id: "G-54",
  name: "listening-tts-plumbing",
  async run({ data }) {
    const errors = await checkPlumbing(data.units);
    return {
      errors,
      info: { activitiesProbed: targets(data.units).length, levels: LEVELS.length },
    };
  },
  async controls({ data }) {
    const some = data.units.filter((_, i) => i % 40 === 0);
    return [
      {
        name: "transcript forced visible at every level",
        errors: await checkPlumbing(some, {
          sample: 1,
          hook: (root) => root.querySelectorAll(".sl-caption").forEach((c) => (c.hidden = false)),
        }),
      },
      {
        name: "payload without the transcript toggle",
        errors: await checkPlumbing(some, { sample: 1, strip: true }),
      },
      {
        name: "speechSynthesis that never speaks",
        errors: await checkPlumbing(some, { sample: 1, speaks: false }),
      },
    ];
  },
};
