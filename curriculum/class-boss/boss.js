/* =============================================================================
 * Class Boss — the weekly raid.
 * -----------------------------------------------------------------------------
 * Every week the class faces one boss. Its three attacks ARE the class's own top
 * three misconceptions, read from /api/class-pulse (student-safe: tag counts
 * only, k-anonymity floor of 5 students / 12 events). When the pulse is
 * suppressed — a quiet week, or no database bound — the boss is built from the
 * curriculum's misconception map instead, chosen deterministically from the ISO
 * week so the whole class still meets the SAME boss. There is no error state.
 *
 * Rules this file must never break:
 *   - NO TIMERS. Pace is entirely student-controlled. No clocks, no pressure.
 *   - NO Math.random() for anything shared. Boss, palette, art and questions all
 *     come from a seeded PRNG so thirty devices and the projector agree.
 *   - NO names. The shared feed says "someone in the class", always.
 *   - No-fail. A wrong answer costs the class a few points and buys the student
 *     the coaching line. Nothing is scored against the individual.
 * ========================================================================== */

import { BOSS_TAGS, buildQuestion, hashSeed, makeRng } from "./questions.js";

/* --- tuning -------------------------------------------------------------- */
const BASE_HP = 60; // per student in the class
// Floor for the class size. Before the pulse has a cohort — a quiet week, or
// the first two students of the week — a literal cohort of 1 would give a boss
// six questions could kill, and health that then GREW as classmates joined,
// un-defeating a boss the class had already beaten. A Grade 6 section is never
// smaller than this, so the bar only ever moves in one direction.
const MIN_COHORT = 12;
const DAMAGE = 10; // a correct answer
const MISS_COST = 3; // the boss lands its attack (class total only)
const POLL_MS = 5000; // shared health bar refresh
const MAX_ATTACKS = 3;
const FEED_MAX = 8;

const KEY_LANG = "nt_boss.lang";
const KEY_DEVICE = "nt_boss.device";
const keyLocal = (wk) => `nt_boss.local.${wk}`;
const keyAttempt = (wk) => `nt_boss.attempt.${wk}`;

/* --- interface copy ------------------------------------------------------ */
const UI = {
  en: {
    skipLink: "Skip to the questions",
    back: "Back to curriculum",
    projector: "Projector mode",
    eyebrow: "This week's raid",
    title: "Class Boss",
    intro:
      "One boss. One health bar for the whole class. Every attack it uses is a mistake our class has actually been making — so every answer you get right takes a piece out of it. No timers. Go at your own pace.",
    loading: "Loading this week's boss…",
    stageHeading: "The boss",
    attacksTitle: "Its three attacks",
    feedTitle: "Live from the class",
    feedEmpty: "Nothing yet. The first hit shows up here.",
    yourTurn: "Your turn",
    next: "Next question",
    noFail:
      "Nothing is being scored against you. A wrong answer just shows you the fix and gives you another go — as many as you want.",
    privacy:
      "This page never shows anyone's name. It reads only how often the class as a whole picked each kind of mistake, and only once enough people have played that no single person can be picked out.",
    hpLabel: "Class health bar",
    hpCaption: (left, total) =>
      `${left} of ${total} health left. Every right answer knocks off ${DAMAGE}.`,
    hpDefeated: "Boss defeated. The class did that together.",
    victory:
      "🏆 Beaten! The class knocked this boss down together. Keep playing to build the streak.",
    liveData: (n, days) =>
      `Built from what our class actually got wrong in the last ${days} days (${n} tagged moments).`,
    defaultData:
      "Not enough class data yet this week, so this is the curriculum's practice boss. It changes every week.",
    offlineData:
      "Playing on this device only right now — the class bar will catch up when the connection returns.",
    attackWord: "Attack",
    questionTag: (n, name, label) => `Attack ${n} — ${name}: ${label}`,
    hitTitle: "Direct hit!",
    hitBody: (dmg) =>
      `You knocked ${dmg} health off the boss. The whole class shares that hit.`,
    landTitle: (name) => `The boss used ${name}.`,
    youPicked: (v) => `You picked ${v}.`,
    thatIs: (label) => `That answer matches one exact slip: "${label}".`,
    theAnswer: (v) => `The answer was ${v}.`,
    coachLead: "Here is the move that beats this attack:",
    tryAgain: "Nothing lost. Take the next one whenever you are ready.",
    feedYouHit: (name) => `You landed a hit on ${name}.`,
    feedYouLand: (name) => `${name} got you that round — coaching collected.`,
    feedTheyHit: (name) => `Someone in the class landed a hit on ${name}.`,
    feedTheyLand: (name) => `${name} caught someone in the class.`,
    feedDefeated: "The class just finished this boss off!",
    contributors: (n) =>
      n === 1 ? "1 person has fought this week." : `${n} people have fought this week.`,
    langBtn: "Español",
    langBtnAria: "Cambiar a español",
    bossOf: (week) => `Week ${week} boss`,
  },
  es: {
    skipLink: "Ir a las preguntas",
    back: "Volver al currículo",
    projector: "Modo proyector",
    eyebrow: "El desafío de esta semana",
    title: "Jefe de la Clase",
    intro:
      "Un solo jefe. Una sola barra de vida para toda la clase. Cada ataque que usa es un error que nuestra clase ha estado cometiendo de verdad, así que cada respuesta correcta le quita un pedazo. Sin cronómetros. Ve a tu propio ritmo.",
    loading: "Cargando el jefe de esta semana…",
    stageHeading: "El jefe",
    attacksTitle: "Sus tres ataques",
    feedTitle: "En vivo desde la clase",
    feedEmpty: "Todavía nada. El primer golpe aparecerá aquí.",
    yourTurn: "Tu turno",
    next: "Siguiente pregunta",
    noFail:
      "Nada de esto cuenta en tu contra. Una respuesta incorrecta solo te muestra cómo arreglarlo y te da otra oportunidad, todas las que quieras.",
    privacy:
      "Esta página nunca muestra el nombre de nadie. Solo lee con qué frecuencia la clase entera eligió cada tipo de error, y únicamente cuando ya jugaron suficientes personas como para que nadie pueda ser identificado.",
    hpLabel: "Barra de vida de la clase",
    hpCaption: (left, total) =>
      `Quedan ${left} de ${total} de vida. Cada respuesta correcta le quita ${DAMAGE}.`,
    hpDefeated: "Jefe derrotado. La clase lo logró junta.",
    victory:
      "🏆 ¡Derrotado! La clase venció a este jefe junta. Sigue jugando para mantener la racha.",
    liveData: (n, days) =>
      `Creado con lo que nuestra clase realmente falló en los últimos ${days} días (${n} momentos registrados).`,
    defaultData:
      "Todavía no hay suficientes datos de la clase esta semana, así que este es el jefe de práctica del currículo. Cambia cada semana.",
    offlineData:
      "Por ahora juegas solo en este dispositivo; la barra de la clase se pondrá al día cuando vuelva la conexión.",
    attackWord: "Ataque",
    questionTag: (n, name, label) => `Ataque ${n} — ${name}: ${label}`,
    hitTitle: "¡Golpe directo!",
    hitBody: (dmg) =>
      `Le quitaste ${dmg} de vida al jefe. Toda la clase comparte ese golpe.`,
    landTitle: (name) => `El jefe usó ${name}.`,
    youPicked: (v) => `Elegiste ${v}.`,
    thatIs: (label) => `Esa respuesta corresponde a un error muy concreto: "${label}".`,
    theAnswer: (v) => `La respuesta era ${v}.`,
    coachLead: "Esta es la jugada que vence a este ataque:",
    tryAgain: "No perdiste nada. Sigue con la próxima cuando quieras.",
    feedYouHit: (name) => `Le diste un golpe a ${name}.`,
    feedYouLand: (name) => `${name} te ganó esta ronda; te llevas el consejo.`,
    feedTheyHit: (name) => `Alguien de la clase le dio un golpe a ${name}.`,
    feedTheyLand: (name) => `${name} atrapó a alguien de la clase.`,
    feedDefeated: "¡La clase acaba de acabar con este jefe!",
    contributors: (n) =>
      n === 1 ? "1 persona ha peleado esta semana." : `${n} personas han peleado esta semana.`,
    langBtn: "English",
    langBtnAria: "Switch to English",
    bossOf: (week) => `Jefe de la semana ${week}`,
  },
};

/* Spanish for the repo's English `watchFor` coaching lines. The English side is
 * read straight from data/misconception-labels.json so it never drifts. */
const WATCH_ES = {
  "decimal-place-value":
    "Primero estima al número entero más cercano y luego cuenta en voz alta los lugares decimales.",
  "exponent-as-multiplication":
    "Desarróllalo una vez: escribe todos los factores antes de calcular.",
  "fraction-added-denominators":
    "Vuelve al modelo de barras: tercios más quintos no pueden convertirse en octavos.",
  "fraction-no-reciprocal": "Compruébalo con un caso de números enteros en el que ya confías.",
  "fraction-straight-across-division":
    "Vuelve a pensar la división como “¿cuántos de estos caben en aquello?”",
  "measure-area-perimeter-swap":
    "Pregúntate cuál debe ser la unidad: ¿unidades o unidades cuadradas?",
  "op-added-instead-of-multiplied":
    "Pregúntate qué le hace la operación a la cantidad antes de calcular.",
  "op-divided-instead-of-multiplied":
    "Estima primero: ¿la respuesta debe ser mayor o menor que el número inicial?",
  "op-multiplied-instead-of-added":
    "Vuelve a contar el problema como una historia y luego nombra la operación.",
  "op-multiplied-instead-of-divided":
    "Estima primero: ¿la respuesta debe ser mayor o menor que el número inicial?",
  "op-reversed-division":
    "Pregúntate “¿qué se está repartiendo y entre cuántos?” antes de escribirlo.",
  "op-reversed-subtraction": "Ubica los dos números en una recta numérica antes de restar.",
  "order-of-operations-left-to-right":
    "Encierra en un círculo la operación que va primero y luego calcula.",
  "percent-scale-off-by-100": "Compara con el 50 % y con el 10 % antes de confiar en el número.",
  "percent-used-as-whole-number": "Di el porcentaje en voz alta como “por cada cien”.",
  "rate-not-per-one": "Pregúntate “¿por UNA qué?” y termina la oración.",
  "ratio-inverted": "Etiqueta las dos cantidades con sus unidades antes de escribir la razón.",
  "sign-dropped": "Coloca la respuesta en una recta numérica: ¿de qué lado del cero está?",
  "stat-summed-instead-of-averaged":
    "Pregúntate si la respuesta podría ser un valor real dentro de ese conjunto.",
};

/* --- boss vocabulary (parallel EN/ES, indexed by the same seeded draw) ----- */
const BOSS_ADJ = [
  ["Grumbling", "Gruñón"],
  ["Hollow", "Hueco"],
  ["Static", "Estático"],
  ["Marble", "de Mármol"],
  ["Thunder", "del Trueno"],
  ["Glass", "de Vidrio"],
  ["Iron", "de Hierro"],
  ["Velvet", "de Terciopelo"],
  ["Whispering", "Susurrante"],
  ["Crooked", "Torcido"],
  ["Gilded", "Dorado"],
  ["Restless", "Inquieto"],
];
const BOSS_NOUN = [
  ["Colossus", "Coloso"],
  ["Sentinel", "Centinela"],
  ["Devourer", "Devorador"],
  ["Warden", "Guardián"],
  ["Behemoth", "Behemot"],
  ["Hydra", "Dragón"],
  ["Golem", "Gólem"],
  ["Leviathan", "Leviatán"],
  ["Wyrm", "Basilisco"],
  ["Automaton", "Autómata"],
  ["Titan", "Titán"],
  ["Watcher", "Vigilante"],
];
const ATTACK_ADJ = [
  ["Iron", "de Hierro"],
  ["Hollow", "del Vacío"],
  ["Shifting", "de Cambio"],
  ["Crooked", "de Giro"],
  ["Endless", "sin Fin"],
  ["Sudden", "de Golpe"],
  ["Silent", "de Silencio"],
  ["Twisted", "de Nudo"],
  ["Rusted", "de Óxido"],
  ["Wandering", "de Niebla"],
];
const ATTACK_NOUN = [
  ["Surge", "Oleada"],
  ["Snare", "Trampa"],
  ["Echo", "Eco"],
  ["Grip", "Garra"],
  ["Spiral", "Espiral"],
  ["Fang", "Colmillo"],
  ["Tide", "Marea"],
  ["Storm", "Tormenta"],
  ["Coil", "Espira"],
  ["Shard", "Esquirla"],
];

/* --- state --------------------------------------------------------------- */
const state = {
  lang: "en",
  weekKey: "",
  week: 1,
  tags: [],
  boss: null,
  source: "default", // "live" | "default"
  pulse: null,
  cohort: 0,
  labels: {},
  standards: {},
  progress: null,
  localOnly: false, // the backend has no database: this device is the source
  unreachable: false, // a request dropped: the class total is still out there
  attempt: 0,
  current: null,
  answered: false,
  lastAnswer: null,
  feed: [],
  seenByTag: null,
  projector: false,
};

const $ = (id) => document.getElementById(id);
const el = {};

/* --- small helpers ------------------------------------------------------- */
function safeStorage(fn, fallback) {
  try {
    return fn();
  } catch {
    return fallback;
  }
}

function readLang() {
  const saved = safeStorage(() => localStorage.getItem(KEY_LANG), null);
  if (saved === "en" || saved === "es") return saved;
  return (navigator.language || "en").toLowerCase().startsWith("es") ? "es" : "en";
}

function deviceId() {
  let id = safeStorage(() => localStorage.getItem(KEY_DEVICE), null);
  if (!id) {
    const buf = new Uint8Array(16);
    (globalThis.crypto || {}).getRandomValues?.(buf);
    id = Array.from(buf, (b) => b.toString(16).padStart(2, "0")).join("");
    if (id.length < 8) id = `d${Date.now().toString(36)}${BOSS_TAGS.length}`;
    safeStorage(() => localStorage.setItem(KEY_DEVICE, id), null);
  }
  return id;
}

/** ISO-8601 week number and its year. */
function isoWeek(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const day = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - day);
  const yearStart = Date.UTC(d.getUTCFullYear(), 0, 1);
  const week = Math.ceil(((d.getTime() - yearStart) / 86400000 + 1) / 7);
  return { year: d.getUTCFullYear(), week };
}

const t = () => UI[state.lang];
const pretty = (v) => String(v).replace(/^-/, "−");
const clampInt = (n, lo, hi) => Math.min(Math.max(Math.round(Number(n) || 0), lo), hi);

function labelFor(tag) {
  const info = state.labels[tag];
  if (!info) return tag.replace(/-/g, " ");
  return state.lang === "es" ? info.labelEs || info.label : info.label;
}

function coachFor(tag) {
  if (state.lang === "es") return WATCH_ES[tag] || state.labels[tag]?.watchFor || "";
  return state.labels[tag]?.watchFor || "";
}

/* --- boss generation ----------------------------------------------------- */
function makeBoss(weekKey, week, tags) {
  const seedStr = `${week}|${tags.slice().sort().join(",")}`;
  const r = makeRng(hashSeed(seedStr));
  const adj = BOSS_ADJ[r.int(0, BOSS_ADJ.length - 1)];
  const noun = BOSS_NOUN[r.int(0, BOSS_NOUN.length - 1)];
  const hue = r.int(0, 359);
  const hue2 = (hue + r.int(55, 170)) % 360;

  const attacks = tags.map((tag, i) => {
    const ar = makeRng(hashSeed(`${seedStr}|attack|${tag}`));
    const a = ATTACK_ADJ[ar.int(0, ATTACK_ADJ.length - 1)];
    const n = ATTACK_NOUN[ar.int(0, ATTACK_NOUN.length - 1)];
    return { tag, index: i + 1, name: { en: `${a[0]} ${n[0]}`, es: `${n[1]} ${a[1]}` } };
  });

  return {
    weekKey,
    seedStr,
    name: { en: `The ${adj[0]} ${noun[0]}`, es: `El ${noun[1]} ${adj[1]}` },
    palette: {
      c1: `hsl(${hue} 58% 42%)`,
      c2: `hsl(${hue2} 64% 54%)`,
      glow: `hsl(${hue} 82% 92%)`,
      ink: `hsl(${hue} 45% 16%)`,
    },
    art: {
      points: r.int(7, 12),
      eyes: r.int(2, 5),
      spikes: r.int(4, 9),
      runes: r.int(3, 6),
      jaw: r.int(0, 2),
      seed: hashSeed(`${seedStr}|art`),
    },
    attacks,
  };
}

const mid = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
const n1 = (x) => Math.round(x * 10) / 10;

/** A smooth closed blob whose wobble comes from the seed. */
function blobPath(r, cx, cy, base, points, wobble) {
  const pts = [];
  for (let i = 0; i < points; i += 1) {
    const ang = (i / points) * Math.PI * 2 - Math.PI / 2;
    const rad = base * (1 - wobble / 2 + (r.int(0, 100) / 100) * wobble);
    pts.push([cx + Math.cos(ang) * rad, cy + Math.sin(ang) * rad]);
  }
  const start = mid(pts[pts.length - 1], pts[0]);
  let d = `M ${n1(start[0])} ${n1(start[1])}`;
  for (let i = 0; i < pts.length; i += 1) {
    const cur = pts[i];
    const m = mid(cur, pts[(i + 1) % pts.length]);
    d += ` Q ${n1(cur[0])} ${n1(cur[1])} ${n1(m[0])} ${n1(m[1])}`;
  }
  return `${d} Z`;
}

/** Pure-SVG boss art. Every coordinate is a number derived from the seed. */
function bossSvg(boss) {
  const r = makeRng(boss.art.seed);
  const a = boss.art;
  const body = blobPath(r, 160, 175, 96, a.points, 0.3);
  const belly = blobPath(r, 160, 200, 52, Math.max(6, a.points - 2), 0.22);
  const aura = blobPath(r, 160, 165, 132, 9, 0.18);

  let spikes = "";
  for (let i = 0; i < a.spikes; i += 1) {
    const ang = Math.PI + (Math.PI * (i + 0.5)) / a.spikes;
    const len = 26 + r.int(0, 22);
    const bx = 160 + Math.cos(ang) * 88;
    const by = 175 + Math.sin(ang) * 88;
    const tx = 160 + Math.cos(ang) * (88 + len);
    const ty = 175 + Math.sin(ang) * (88 + len);
    const px = 160 + Math.cos(ang + 0.16) * 88;
    const py = 175 + Math.sin(ang + 0.16) * 88;
    spikes += `<polygon class="spike" points="${n1(bx)},${n1(by)} ${n1(tx)},${n1(ty)} ${n1(px)},${n1(py)}" />`;
  }

  let eyes = "";
  const span = a.eyes === 1 ? 0 : 108;
  for (let i = 0; i < a.eyes; i += 1) {
    const x = 160 - span / 2 + (a.eyes === 1 ? 0 : (span / (a.eyes - 1)) * i);
    const y = 158 + (i % 2 === 0 ? 0 : 12);
    const rx = 15 - Math.min(4, a.eyes - 2) * 1.5;
    eyes +=
      `<g><ellipse class="eye-white" cx="${n1(x)}" cy="${n1(y)}" rx="${n1(rx)}" ry="${n1(rx * 1.15)}" />` +
      `<circle class="pupil" cx="${n1(x)}" cy="${n1(y + 2)}" r="${n1(rx * 0.42)}" />` +
      `<ellipse class="eye-lid" cx="${n1(x)}" cy="${n1(y)}" rx="${n1(rx)}" ry="${n1(rx * 1.15)}" fill="var(--boss-1)" style="animation-delay:${i * 0.7}s" /></g>`;
  }

  const mouthY = 215;
  const mouth =
    a.jaw === 0
      ? `<path class="mouth" d="M 122 ${mouthY} Q 160 ${mouthY + 34} 198 ${mouthY} Q 160 ${mouthY + 12} 122 ${mouthY} Z" />`
      : a.jaw === 1
        ? `<rect class="mouth" x="120" y="${mouthY}" width="80" height="20" rx="8" />`
        : `<path class="mouth" d="M 120 ${mouthY + 12} Q 160 ${mouthY - 16} 200 ${mouthY + 12} Q 160 ${mouthY + 26} 120 ${mouthY + 12} Z" />`;

  let teeth = "";
  for (let i = 0; i < 4; i += 1) {
    const x = 130 + i * 20;
    teeth += `<polygon class="tooth" points="${x},${mouthY + 2} ${x + 9},${mouthY + 2} ${x + 4.5},${mouthY + 13}" />`;
  }

  let runes = "";
  for (let i = 0; i < a.runes; i += 1) {
    const ang = (i / a.runes) * Math.PI * 2;
    runes += `<circle class="rune" cx="${n1(160 + Math.cos(ang) * 138)}" cy="${n1(165 + Math.sin(ang) * 138)}" r="${5 + r.int(0, 5)}" />`;
  }

  return (
    `<svg class="boss-art" viewBox="0 0 320 320" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">` +
    `<defs><linearGradient id="bossGrad" x1="0" y1="0" x2="0.4" y2="1">` +
    `<stop offset="0%" stop-color="var(--boss-2)" /><stop offset="100%" stop-color="var(--boss-1)" />` +
    `</linearGradient></defs>` +
    `<path class="aura" d="${aura}" />${runes}` +
    `<g class="float">${spikes}<path class="body" d="${body}" /><path class="belly" d="${belly}" />` +
    `${mouth}${teeth}${eyes}</g></svg>`
  );
}

/* --- data loading -------------------------------------------------------- */
async function getJson(url, init) {
  const res = await fetch(url, { headers: { Accept: "application/json" }, ...init });
  if (!res.ok) throw new Error(`${url} -> ${res.status}`);
  return res.json();
}

/** Deterministic fallback tags: same ISO week, same boss, for everybody. */
function defaultTags(week, pool) {
  const all = pool.slice().sort();
  const r = makeRng(hashSeed(`class-boss-default|${week}`));
  const bag = all.slice();
  for (let i = bag.length - 1; i > 0; i -= 1) {
    const j = r.int(0, i);
    const tmp = bag[i];
    bag[i] = bag[j];
    bag[j] = tmp;
  }
  return bag.slice(0, MAX_ATTACKS);
}

async function loadWorld() {
  const [labelsRes, nerveRes, pulseRes] = await Promise.allSettled([
    getJson("/data/misconception-labels.json"),
    getJson("/data/curriculum-nervous-system.json"),
    getJson("/api/class-pulse?days=7"),
  ]);

  if (labelsRes.status === "fulfilled" && labelsRes.value?.tags) {
    state.labels = labelsRes.value.tags;
  }

  let pool = BOSS_TAGS;
  if (nerveRes.status === "fulfilled" && nerveRes.value?.misconceptions) {
    const map = nerveRes.value.misconceptions;
    pool = Object.keys(map).filter((tag) => BOSS_TAGS.includes(tag));
    if (!pool.length) pool = BOSS_TAGS;
    for (const [tag, entry] of Object.entries(map)) {
      state.standards[tag] = Array.isArray(entry.standards) ? entry.standards : [];
      if (!state.labels[tag]) state.labels[tag] = entry;
    }
  }

  const pulse = pulseRes.status === "fulfilled" ? pulseRes.value : null;
  state.pulse = pulse;
  const liveTags = (pulse?.tags || [])
    .map((row) => row.tag)
    .filter((tag) => BOSS_TAGS.includes(tag))
    .slice(0, MAX_ATTACKS);

  if (pulse && pulse.ok && !pulse.suppressed && liveTags.length) {
    state.tags = liveTags;
    state.source = "live";
    state.cohort = clampInt(pulse.cohort, 0, 200);
    for (const row of pulse.tags) {
      if (row.standards?.length && !state.standards[row.tag])
        state.standards[row.tag] = row.standards;
    }
  } else {
    state.tags = defaultTags(state.week, pool);
    state.source = "default";
    state.cohort = 0;
  }
  // Belt and braces: the raid always has at least one attack.
  if (!state.tags.length) state.tags = defaultTags(state.week, BOSS_TAGS);
}

/* --- shared progress ----------------------------------------------------- */
function localProgress() {
  const raw = safeStorage(() => localStorage.getItem(keyLocal(state.weekKey)), null);
  let saved = { hits: 0, misses: 0, byTag: {} };
  try {
    if (raw) saved = { ...saved, ...JSON.parse(raw) };
  } catch {
    /* corrupt local copy — start the week fresh rather than fail */
  }
  return saved;
}

function saveLocal(saved) {
  safeStorage(() => localStorage.setItem(keyLocal(state.weekKey), JSON.stringify(saved)), null);
}

function shapeProgress(raw) {
  const cohort = Math.max(1, MIN_COHORT, state.cohort, raw.contributors || 0);
  const hp = Number(raw.hp) > 0 ? Number(raw.hp) : BASE_HP * cohort;
  const hits = Math.max(0, Number(raw.hits) || 0);
  const misses = Math.max(0, Number(raw.misses) || 0);
  const damage =
    raw.damage === undefined
      ? Math.max(0, Math.min(hp, hits * DAMAGE - misses * MISS_COST))
      : Math.max(0, Math.min(hp, Number(raw.damage) || 0));
  return {
    hits,
    misses,
    hp,
    damage,
    defeated: raw.defeated === true || damage >= hp,
    contributors: Math.max(0, Number(raw.contributors) || 0),
    byTag: raw.byTag && typeof raw.byTag === "object" ? raw.byTag : {},
  };
}

function localShaped() {
  const saved = localProgress();
  return shapeProgress({ ...saved, contributors: 1 });
}

/**
 * The shared figure, or null when the server simply could not be reached.
 * Two different failures need two different answers: `offline: true` means the
 * backend has no database and this device IS the source of truth, but a dropped
 * request means the class total is still out there — returning the local count
 * would yank the shared bar backwards on every flaky poll.
 */
async function fetchProgress() {
  try {
    const data = await getJson(
      `/api/class-boss?weekKey=${encodeURIComponent(state.weekKey)}&cohort=${state.cohort}`,
    );
    if (!data || data.ok !== true) {
      state.unreachable = true;
      return null;
    }
    state.unreachable = false;
    if (data.offline) {
      state.localOnly = true;
      return localShaped();
    }
    state.localOnly = false;
    return shapeProgress(data);
  } catch {
    state.unreachable = true;
    return null;
  }
}

async function recordHit(tag, correct) {
  const saved = localProgress();
  if (correct) saved.hits += 1;
  else saved.misses += 1;
  const bucket = saved.byTag[tag] || { hits: 0, misses: 0 };
  bucket[correct ? "hits" : "misses"] += 1;
  saved.byTag[tag] = bucket;
  saveLocal(saved);

  const send = () =>
    fetch("/api/class-boss", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        weekKey: state.weekKey,
        tag,
        correct: correct === true,
        device: deviceId(),
        cohort: state.cohort,
      }),
    });

  try {
    let data = await (await send()).json();
    // Two students can share an anonymous bucket, so a legitimate answer can
    // land inside another's rate-limit window. Wait out the window once rather
    // than quietly dropping the hit off the class bar.
    if (data && data.throttled) {
      await new Promise((resolve) => setTimeout(resolve, 1200));
      data = await (await send()).json();
    }
    if (data && data.ok === true && !data.offline && !data.throttled) {
      state.unreachable = false;
      state.localOnly = false;
      state.progress = shapeProgress(data);
      renderProgress();
      return;
    }
    if (data && data.offline) state.localOnly = true;
  } catch {
    state.unreachable = true;
  }
  // The tap must always move the bar. With no backend at all that is the local
  // count; otherwise it is the last shared figure plus this answer, which the
  // next poll reconciles against the server.
  state.progress = state.localOnly
    ? localShaped()
    : shapeProgress({
        ...(state.progress || localShaped()),
        hits: (state.progress?.hits || 0) + (correct ? 1 : 0),
        misses: (state.progress?.misses || 0) + (correct ? 0 : 1),
        damage: undefined,
      });
  renderProgress();
}

/* --- rendering ----------------------------------------------------------- */
function applyStaticCopy() {
  for (const node of document.querySelectorAll("[data-i18n]")) {
    const key = node.getAttribute("data-i18n");
    const value = t()[key];
    if (typeof value === "string") node.textContent = value;
  }
  document.documentElement.lang = state.lang;
  el.langBtn.textContent = t().langBtn;
  el.langBtn.setAttribute("aria-label", t().langBtnAria);
  el.langBtn.lang = state.lang === "en" ? "es" : "en";
}

function renderBoss() {
  const boss = state.boss;
  const root = document.documentElement;
  root.style.setProperty("--boss-1", boss.palette.c1);
  root.style.setProperty("--boss-2", boss.palette.c2);
  root.style.setProperty("--boss-glow", boss.palette.glow);
  root.style.setProperty("--boss-ink", boss.palette.ink);

  el.bossName.textContent = boss.name[state.lang];
  el.bossTagline.textContent = t().bossOf(state.week);
  el.bossArt.setAttribute("aria-label", boss.name[state.lang]);
  el.bossArt.innerHTML = bossSvg(boss);

  el.attackList.replaceChildren();
  for (const attack of boss.attacks) {
    const li = document.createElement("li");
    li.className = "attack";
    const no = document.createElement("span");
    no.className = "attack-no";
    no.textContent = String(attack.index);
    no.setAttribute("aria-hidden", "true");
    const box = document.createElement("div");
    const name = document.createElement("p");
    name.className = "attack-name";
    name.textContent = `${t().attackWord} ${attack.index}: ${attack.name[state.lang]}`;
    const label = document.createElement("p");
    label.className = "attack-label";
    label.textContent = labelFor(attack.tag);
    box.append(name, label);
    const stds = state.standards[attack.tag];
    if (stds?.length) {
      const meta = document.createElement("p");
      meta.className = "attack-meta";
      meta.textContent = stds.join(" · ");
      box.append(meta);
    }
    li.append(no, box);
    el.attackList.append(li);
  }

  renderNote();
}

function renderNote() {
  const note =
    state.source === "live"
      ? t().liveData(state.pulse?.totalTagged || 0, state.pulse?.days || 7)
      : t().defaultData;
  const alone = state.localOnly || state.unreachable;
  el.dataNote.textContent = alone ? `${note} ${t().offlineData}` : note;
}

function renderProgress() {
  const p = state.progress;
  if (!p) return;
  const left = Math.max(0, p.hp - p.damage);
  const pct = p.hp > 0 ? Math.round((left / p.hp) * 100) : 0;
  el.hpFill.style.width = `${pct}%`;
  el.hpNumbers.textContent = `${left} / ${p.hp}`;
  el.hpBar.setAttribute("aria-valuenow", String(pct));
  el.hpBar.setAttribute("aria-valuetext", `${pct}%`);
  el.hpCaption.textContent = p.defeated
    ? `${t().hpDefeated} ${t().contributors(Math.max(p.contributors, 1))}`
    : `${t().hpCaption(left, p.hp)} ${t().contributors(Math.max(p.contributors, 1))}`;
  el.hpBlock.classList.toggle("hp-defeated", p.defeated);
  el.victory.hidden = !p.defeated;
  el.victory.textContent = p.defeated ? t().victory : "";
}

function attackFor(tag) {
  return state.boss.attacks.find((a) => a.tag === tag) || state.boss.attacks[0];
}

function pushFeed(kind, tag) {
  state.feed.unshift({ kind, tag });
  state.feed = state.feed.slice(0, FEED_MAX);
  renderFeed();
}

function feedText(entry) {
  const name = entry.tag ? attackFor(entry.tag).name[state.lang] : "";
  switch (entry.kind) {
    case "you-hit":
      return t().feedYouHit(name);
    case "you-land":
      return t().feedYouLand(name);
    case "they-hit":
      return t().feedTheyHit(name);
    case "they-land":
      return t().feedTheyLand(name);
    default:
      return t().feedDefeated;
  }
}

function renderFeed() {
  el.feed.replaceChildren();
  if (!state.feed.length) {
    const li = document.createElement("li");
    li.className = "feed-empty";
    li.textContent = t().feedEmpty;
    el.feed.append(li);
    return;
  }
  for (const entry of state.feed) {
    const li = document.createElement("li");
    li.className = entry.kind.endsWith("hit") ? "hit" : "land";
    li.textContent = feedText(entry);
    el.feed.append(li);
  }
}

function flashBoss(cls) {
  el.bossStage.classList.add(cls);
  setTimeout(() => el.bossStage.classList.remove(cls), 520);
}

/* --- the question loop --------------------------------------------------- */
function questionSeed(attempt) {
  return `${state.weekKey}|${hashSeed(deviceId()) % 100000}|${attempt}`;
}

function nextQuestion() {
  const tags = state.tags;
  const tag = tags[state.attempt % tags.length];
  const templateIndex = Math.floor(state.attempt / tags.length);
  state.current = buildQuestion(tag, templateIndex, questionSeed(state.attempt));
  state.answered = false;
  state.lastAnswer = null;
  renderQuestion();
  // Move focus to the question itself, so a screen reader reads the problem
  // before the student tabs into the four answer buttons.
  el.questionBlock?.focus();
}

function renderQuestion() {
  const q = state.current;
  if (!q) return;
  const attack = attackFor(q.tag);
  el.questionText.textContent = q.prompt[state.lang] || q.prompt.en;
  el.questionTag.textContent = t().questionTag(
    attack.index,
    attack.name[state.lang],
    labelFor(q.tag),
  );
  el.feedback.className = "feedback";
  el.feedback.replaceChildren();
  el.nextBtn.hidden = true;

  el.choices.replaceChildren();
  q.choices.forEach((choice, i) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "choice";
    const key = document.createElement("span");
    key.className = "key";
    key.setAttribute("aria-hidden", "true");
    key.textContent = String(i + 1);
    const val = document.createElement("span");
    val.textContent = pretty(choice);
    btn.dataset.value = String(choice);
    btn.append(key, val);
    btn.addEventListener("click", () => answer(choice));
    el.choices.append(btn);
  });

  // Re-rendering an already-answered question (a language switch) must put the
  // marked-up buttons and the coaching back exactly as the student left them.
  if (state.answered && state.lastAnswer) {
    applyAnsweredUi(state.lastAnswer.choice, state.lastAnswer.correct);
  }
}

function applyAnsweredUi(chosen, correct) {
  const q = state.current;
  for (const node of el.choices.querySelectorAll(".choice")) {
    node.disabled = true;
    if (node.dataset.value === String(q.correct)) node.classList.add("is-correct");
    if (!correct && node.dataset.value === String(chosen)) node.classList.add("is-chosen-wrong");
  }
  showFeedback(correct, chosen);
  el.nextBtn.hidden = false;
}

function showFeedback(correct, chosen) {
  const q = state.current;
  const attack = attackFor(q.tag);
  el.feedback.className = `feedback ${correct ? "good" : "coach"}`;
  const head = document.createElement("h3");
  const body = document.createElement("p");

  if (correct) {
    head.textContent = t().hitTitle;
    body.textContent = t().hitBody(DAMAGE);
    el.feedback.append(head, body);
    return;
  }

  head.textContent = t().landTitle(attack.name[state.lang]);
  const picked = document.createElement("p");
  picked.textContent =
    String(chosen) === String(q.distractor)
      ? `${t().youPicked(pretty(chosen))} ${t().thatIs(labelFor(q.tag))}`
      : `${t().youPicked(pretty(chosen))} ${t().theAnswer(pretty(q.correct))}`;
  const lead = document.createElement("p");
  lead.textContent = t().coachLead;
  const coach = document.createElement("p");
  coach.className = "coach-line";
  coach.textContent = coachFor(q.tag);
  const calm = document.createElement("p");
  calm.textContent = `${t().theAnswer(pretty(q.correct))} ${t().tryAgain}`;
  el.feedback.append(head, picked, lead, coach, calm);
}

function answer(choice) {
  if (state.answered) return;
  const q = state.current;
  const correct = String(choice) === String(q.correct);
  state.answered = true;
  state.lastAnswer = { choice, correct };

  applyAnsweredUi(choice, correct);
  flashBoss(correct ? "is-hit" : "is-attacking");
  pushFeed(correct ? "you-hit" : "you-land", q.tag);

  state.attempt += 1;
  safeStorage(() => localStorage.setItem(keyAttempt(state.weekKey), String(state.attempt)), null);
  recordHit(q.tag, correct);
  el.nextBtn.focus();
}

/* --- polling ------------------------------------------------------------- */
function diffFeed(next) {
  const before = state.seenByTag;
  state.seenByTag = JSON.parse(JSON.stringify(next.byTag || {}));
  if (!before) return;
  for (const [tag, counts] of Object.entries(next.byTag || {})) {
    if (!state.tags.includes(tag)) continue;
    const prev = before[tag] || { hits: 0, misses: 0 };
    const gainedHits = Math.min(3, (counts.hits || 0) - (prev.hits || 0));
    const gainedMiss = Math.min(2, (counts.misses || 0) - (prev.misses || 0));
    for (let i = 0; i < gainedHits; i += 1) pushFeed("they-hit", tag);
    for (let i = 0; i < gainedMiss; i += 1) pushFeed("they-land", tag);
  }
}

async function refresh() {
  const next = await fetchProgress();
  if (!next) {
    renderProgress(); // unreachable: hold the last shared figure, say so in the note
    renderNote();
    return;
  }
  const wasDefeated = state.progress?.defeated;
  diffFeed(next);
  state.progress = next;
  renderProgress();
  renderNote();
  if (next.defeated && !wasDefeated) pushFeed("defeated", null);
}

/* --- language + projector ------------------------------------------------ */
function setLang(lang) {
  state.lang = lang;
  safeStorage(() => localStorage.setItem(KEY_LANG, lang), null);
  applyStaticCopy();
  renderBoss();
  renderProgress();
  renderFeed();
  renderQuestion();
}

function setProjector(on) {
  state.projector = on;
  document.body.classList.toggle("projector", on);
  el.projectorBtn.setAttribute("aria-pressed", String(on));
  const url = new URL(window.location.href);
  if (on) url.searchParams.set("mode", "projector");
  else url.searchParams.delete("mode");
  window.history.replaceState({}, "", url);
}

/* --- boot ---------------------------------------------------------------- */
async function init() {
  for (const id of [
    "langBtn",
    "projectorBtn",
    "dataNote",
    "bossStage",
    "bossName",
    "bossTagline",
    "bossArt",
    "attackList",
    "hpBlock",
    "hpBar",
    "hpFill",
    "hpNumbers",
    "hpCaption",
    "victory",
    "feed",
    "questionBlock",
    "questionText",
    "questionTag",
    "choices",
    "feedback",
    "nextBtn",
  ]) {
    el[id] = $(id);
  }

  state.lang = readLang();
  const { year, week } = isoWeek(new Date());
  state.week = week;
  state.weekKey = `${year}-W${String(week).padStart(2, "0")}`;
  state.attempt = clampInt(
    safeStorage(() => localStorage.getItem(keyAttempt(state.weekKey)), 0) || 0,
    0,
    100000,
  );

  applyStaticCopy();
  setProjector(new URLSearchParams(window.location.search).get("mode") === "projector");

  await loadWorld();
  state.boss = makeBoss(state.weekKey, state.week, state.tags);
  renderBoss();

  state.progress = (await fetchProgress()) || localShaped();
  state.seenByTag = JSON.parse(JSON.stringify(state.progress.byTag || {}));
  renderProgress();
  renderFeed();
  nextQuestion();

  el.nextBtn.addEventListener("click", () => nextQuestion());
  el.langBtn.addEventListener("click", () => setLang(state.lang === "en" ? "es" : "en"));
  el.projectorBtn.addEventListener("click", () => setProjector(!state.projector));

  // Number keys 1-4 pick a choice, so the raid is playable from the keyboard.
  document.addEventListener("keydown", (event) => {
    if (event.metaKey || event.ctrlKey || event.altKey) return;
    const tag = String(event.target?.tagName || "").toLowerCase();
    if (tag === "input" || tag === "textarea") return;
    const n = Number(event.key);
    if (!Number.isInteger(n) || n < 1 || n > 4) return;
    const buttons = el.choices.querySelectorAll(".choice");
    if (buttons[n - 1] && !buttons[n - 1].disabled) {
      event.preventDefault();
      buttons[n - 1].click();
    }
  });

  setInterval(() => {
    if (!document.hidden) refresh();
  }, POLL_MS);
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) refresh();
  });
}

init().catch((err) => {
  // Never a blank screen and never an error screen: rebuild the raid from the
  // inlined tag vocabulary and play it entirely on this device.
  console.error("Class Boss falling back to a purely local raid", err);
  try {
    state.localOnly = true;
    if (!state.tags.length) state.tags = defaultTags(state.week || 1, BOSS_TAGS);
    state.boss = state.boss || makeBoss(state.weekKey, state.week || 1, state.tags);
    state.source = "default";
    renderBoss();
    state.progress = localShaped();
    renderProgress();
    renderFeed();
    nextQuestion();
  } catch (fatal) {
    console.error("Class Boss could not start", fatal);
  }
});
