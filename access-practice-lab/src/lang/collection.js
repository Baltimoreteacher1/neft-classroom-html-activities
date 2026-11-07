// The Collection Book: badges that celebrate effort and range, never rank. Pure logic over evidence the lab already
// keeps (warm-up days, skill shields, missions, reading log, games, portfolio). A badge names something the learner
// did; it is never a level, a score or a place in line. Nobody sees anyone else's book and there is no leaderboard.
//
// Earned badges are remembered in prefs.collection = { earned: { <id>: "YYYY-MM-DD" } } the first time they show up,
// so a badge stays in the book even if the evidence it came from is later cleared. Mission keepsakes and world scenes
// come straight from src/lang/unlocks.js, and skill shields from src/lang/shields.js, so nothing is counted twice.
import { shieldBoard, SKILLS } from "./shields.js";
import { WORLD_SCENES, unlocks } from "./unlocks.js";
import { completeDays, monday, warmupDays, warmupTotals } from "./warmup.js";

const s = (en, es) => ({ en, es });
const asArray = (v) => (Array.isArray(v) ? v : []);
/** Facts the badges are decided from. Everything is a count or a yes/no. */
export function gatherEvidence({
  warmup,
  ledger,
  studio,
  reading,
  games,
  records = [],
  practice = [],
  garden = [],
  prefs = {},
}) {
  const wu = warmupTotals(warmup || { days: {} });
  const board = shieldBoard(asArray(ledger?.entries), records);
  const shieldCount = board.reduce((n, r) => n + r.shields.filter((x) => x.earned).length, 0);
  const unlocked = unlocks(studio || { missions: {} });
  const domainsByWeek = new Map();
  for (const rec of records)
    for (const r of Object.values(rec.record?.results || {})) {
      if (!r?.date) continue;
      const wk = monday(String(r.date).slice(0, 10));
      if (!domainsByWeek.has(wk)) domainsByWeek.set(wk, new Set());
      domainsByWeek.get(wk).add(rec.domain);
    }
  const allDays = [...new Set([...warmupDays(warmup || { days: {} }), ...practice])].sort();
  let returned = false;
  for (let i = 1; i < allDays.length; i++)
    if ((Date.parse(allDays[i]) - Date.parse(allDays[i - 1])) / 864e5 >= 7) returned = true;
  const warmupWeek = new Map();
  for (const d of warmupDays(warmup || { days: {} }))
    warmupWeek.set(monday(d), (warmupWeek.get(monday(d)) || 0) + 1);
  return {
    wu,
    fullDays: completeDays(warmup || { days: {} }).length,
    bestWarmupWeek: Math.max(0, ...warmupWeek.values()),
    skillsPracticed: board.filter((r) => r.shields[0].earned).length,
    allFour: SKILLS.length === board.filter((r) => r.shields[0].earned).length,
    shieldCount,
    fullShieldRow: board.some((r) => r.shields.every((x) => x.earned)),
    onMyOwn: board.some((r) => r.shields.find((x) => x.id === "on-my-own")?.earned),
    madeBetter: board.some((r) => r.shields.find((x) => x.id === "made-better")?.earned),
    bestWeekSkills: Math.max(0, ...[...domainsByWeek.values()].map((x) => x.size)),
    returned,
    missions: unlocked.count,
    scenes: unlocked.scenes.filter((x) => x.unlocked).map((x) => x.id),
    readingEntries: asArray(reading?.log).length,
    gamesPlayed: asArray(games?.history).length,
    recordings: Object.values(studio?.speaking || {}).reduce(
      (n, x) => n + asArray(x.takes).length,
      0,
    ),
    gardenWords: garden.length,
    blooms: garden.filter((g) => g.stage === 3).length,
    pins: asArray(prefs.portfolio?.pins).length,
    sharedWithFamily: Boolean(prefs.portfolio?.sharedAt),
  };
}

const B = (id, group, icon, name, how, test) => ({ id, group, icon, name, how, test });
export const GROUPS = [
  [
    "habit",
    s("Showing up", "Presentarme"),
    s(
      "Small, regular steps. Any pace counts.",
      "Pasos pequeños y constantes. Cualquier ritmo cuenta.",
    ),
  ],
  [
    "range",
    s("Many ways to learn", "Muchas formas de aprender"),
    s("Listening, reading, speaking, writing and more.", "Escuchar, leer, hablar, escribir y más."),
  ],
  [
    "growth",
    s("Making it better", "Mejorar mi trabajo"),
    s(
      "Revising, working on my own and growing words.",
      "Revisar, trabajar por mi cuenta y hacer crecer mis palabras.",
    ),
  ],
  [
    "world",
    s("Language World", "Mundo del lenguaje"),
    s("Scenes that open as missions are finished.", "Escenas que se abren al terminar misiones."),
  ],
  [
    "share",
    s("Sharing my work", "Compartir mi trabajo"),
    s("Choosing what to show and who sees it.", "Elegir qué mostrar y quién lo ve."),
  ],
];
export const BADGES = [
  B(
    "first-warmup",
    "habit",
    "sparkle",
    s("First warm-up", "Primer calentamiento"),
    s(
      "Do all four steps of one daily warm-up.",
      "Haz los cuatro pasos de un calentamiento diario.",
    ),
    (e) => e.fullDays >= 1,
  ),
  B(
    "warmup-week",
    "habit",
    "calendar",
    s("A good week", "Una buena semana"),
    s(
      "Do a warm-up step on three days of the same week.",
      "Haz un paso del calentamiento en tres días de la misma semana.",
    ),
    (e) => e.bestWarmupWeek >= 3,
  ),
  B(
    "welcome-back",
    "habit",
    "road",
    s("Welcome back", "Bienvenido de nuevo"),
    s(
      "Come back after a week or more away. Breaks are normal.",
      "Vuelve después de una semana o más. Los descansos son normales.",
    ),
    (e) => e.returned,
  ),
  B(
    "ten-warmups",
    "habit",
    "medal",
    s("Ten full warm-ups", "Diez calentamientos completos"),
    s(
      "Finish ten daily warm-ups, in any weeks.",
      "Termina diez calentamientos diarios, en cualquier semana.",
    ),
    (e) => e.fullDays >= 10,
  ),
  B(
    "word-collector",
    "habit",
    "words",
    s("Word collector", "Coleccionista de palabras"),
    s("Meet twenty words of the day.", "Conoce veinte palabras del día."),
    (e) => e.wu.words >= 20,
  ),
  B(
    "good-listener",
    "range",
    "listening",
    s("Good listener", "Buen oyente"),
    s("Answer ten warm-up listening clips.", "Responde diez audios de escucha del calentamiento."),
    (e) => e.wu.clips >= 10,
  ),
  B(
    "quick-writer",
    "range",
    "writing",
    s("Quick writer", "Escritor ágil"),
    s("Save ten warm-up sentences.", "Guarda diez oraciones del calentamiento."),
    (e) => e.wu.sentences >= 10,
  ),
  B(
    "brave-voice",
    "range",
    "speaking",
    s("Brave voice", "Voz valiente"),
    s(
      "Rehearse speaking ten times, or record a speaking take.",
      "Ensaya hablar diez veces o graba una toma.",
    ),
    (e) => e.wu.spoken >= 10 || e.recordings >= 1,
  ),
  B(
    "all-four-skills",
    "range",
    "language",
    s("All four skills", "Las cuatro destrezas"),
    s(
      "Finish an activity in listening, reading, speaking and writing.",
      "Termina una actividad de escuchar, leer, hablar y escribir.",
    ),
    (e) => e.allFour,
  ),
  B(
    "many-ways",
    "range",
    "grid",
    s("Many ways in one week", "Muchas formas en una semana"),
    s(
      "Practice three different skills in one week.",
      "Practica tres destrezas distintas en una semana.",
    ),
    (e) => e.bestWeekSkills >= 3,
  ),
  B(
    "book-keeper",
    "range",
    "reading",
    s("Reading log keeper", "Cuidador del registro de lectura"),
    s("Add five things to my reading log.", "Añade cinco lecturas a mi registro de lectura."),
    (e) => e.readingEntries >= 5,
  ),
  B(
    "game-explorer",
    "range",
    "sparkle",
    s("Game explorer", "Explorador de juegos"),
    s("Finish five language games.", "Termina cinco juegos de lenguaje."),
    (e) => e.gamesPlayed >= 5,
  ),
  B(
    "made-it-better",
    "growth",
    "retry",
    s("Made it better", "Lo mejoré"),
    s("Revise your work after feedback.", "Revisa tu trabajo después de los comentarios."),
    (e) => e.madeBetter,
  ),
  B(
    "on-my-own",
    "growth",
    "user",
    s("On my own", "Por mi cuenta"),
    s("Finish an activity with no help.", "Termina una actividad sin ayuda."),
    (e) => e.onMyOwn,
  ),
  B(
    "shield-collector",
    "growth",
    "medal",
    s("Shield collector", "Coleccionista de escudos"),
    s("Earn five skill shields in all.", "Gana cinco escudos de destrezas en total."),
    (e) => e.shieldCount >= 5,
  ),
  B(
    "full-shield-row",
    "growth",
    "check",
    s("A full row of shields", "Una fila completa de escudos"),
    s("Earn all five shields for one skill.", "Gana los cinco escudos de una destreza."),
    (e) => e.fullShieldRow,
  ),
  B(
    "word-garden",
    "growth",
    "growth",
    s("A growing garden", "Un jardín que crece"),
    s(
      "Plant ten words in my vocabulary garden.",
      "Planta diez palabras en mi jardín de vocabulario.",
    ),
    (e) => e.gardenWords >= 10,
  ),
  B(
    "first-bloom",
    "growth",
    "bulb",
    s("First bloom", "Primera flor"),
    s(
      "Work with one word four times so it blooms.",
      "Trabaja con una palabra cuatro veces para que florezca.",
    ),
    (e) => e.blooms >= 1,
  ),
  ...WORLD_SCENES.map((w) =>
    B(
      `scene-${w.id}`,
      "world",
      "worlds",
      w.name,
      s(
        `Finish ${w.need} mission${w.need === 1 ? "" : "s"}.`,
        `Termina ${w.need} misión${w.need === 1 ? "" : "es"}.`,
      ),
      (e) => e.scenes.includes(w.id),
    ),
  ),
  B(
    "first-pick",
    "share",
    "bookmark",
    s("First showcase pick", "Primera obra elegida"),
    s("Choose a piece of writing for my showcase.", "Elige un texto para mi muestra."),
    (e) => e.pins >= 1,
  ),
  B(
    "shared-with-family",
    "share",
    "families",
    s("Shared with family", "Compartido con la familia"),
    s("Open the family view of my portfolio.", "Abre la vista para la familia de mi portafolio."),
    (e) => e.sharedWithFamily,
  ),
];
export const BADGE_IDS = BADGES.map((b) => b.id);

/** Every badge with whether the evidence shows it now or the book already holds it. */
export function evaluate(evidence, saved = {}) {
  const held = saved?.earned && typeof saved.earned === "object" ? saved.earned : {};
  return BADGES.map((b) => ({
    ...b,
    earned: Boolean(held[b.id]) || b.test(evidence),
    date: held[b.id] || "",
  }));
}

/** Add badges the evidence now shows. Returns the new collection state and the ids that are new this time. */
export function syncEarned(saved, evidence, today) {
  const held = { ...(saved?.earned && typeof saved.earned === "object" ? saved.earned : {}) };
  const fresh = [];
  for (const b of BADGES)
    if (!held[b.id] && b.test(evidence)) {
      held[b.id] = today;
      fresh.push(b.id);
    }
  const earned = Object.fromEntries(Object.entries(held).filter(([id]) => BADGE_IDS.includes(id)));
  return { collection: { v: 1, earned }, fresh };
}
