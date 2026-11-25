// Weekly family plan (D1) and plain-language progress note. Pure and deterministic (no DOM, no fetch, no clock):
// the plan is ASSEMBLED from a unit's authored family block (family.say_it, talk, try_at_home, goals, celebrate),
// never written. Every phrase is a verbatim member of the authored data, English and Spanish side by side.
//
// "Ten minutes" is the cap on each sitting: three short sittings a week (say it and talk, one try-at-home task, check
// and celebrate), each 10 minutes or less. Household items are allowed (decision D3); a task is chosen only if it is
// free and safe by the screen below. The progress note is words only: no digits, no scores, no level labels.
import { DRAFT_NOTICE } from "./bcpss-provenance.js";

export const SITTING_CAP_MINUTES = 10;
export const SAY_COUNT = 2;
export const TALK_COUNT = 2;
const SAY_MINUTES = 1;
const TALK_MINUTES = 2;
const CHECK_MINUTES = 3;

export const SAFETY = Object.freeze({
  en: "A grown-up stays close. Skip any step that does not feel safe. Everything here is free and uses things you already have.",
  es: "Un adulto se queda cerca. Salten cualquier paso que no se sienta seguro. Todo aquí es gratis y usa cosas que ya tienen.",
  small: {
    en: "Keep coins, beans, buttons and other small things away from little children.",
    es: "Mantengan las monedas, los frijoles, los botones y otras cosas pequeñas lejos de los niños pequeños.",
  },
});

/** Words that make a task unsafe or not free, in both languages. A hit removes the task from the plan. */
export const HAZARD = Object.freeze({
  en: /\b(candles?|flames?|fire|matchsticks?|matchbox(?:es)?|light a match|knife|knives|blade|razor|stove|oven|boil\w*|microwave|hot|radiator|heater|bleach|medicine|pills?|ladder|climb\w*|bath|swim\w*|needles?|glass jar|buy|purchase|download|app store|subscription)\b/i,
  es: /\b(velas?|llamas?|fuego|f[oó]sforos?|cerillos?|encendedor|cuchillo|navaja|estufa|horno|hervir|microondas|caliente|radiador|calentador|cloro|medicina|pastillas?|escalera de mano|trepar|ba[nñ]era|nadar|agujas?|comprar|descargar|suscripci[oó]n)\b/i,
});

const textOf = (task) =>
  ["en", "es"].map((lang) =>
    [task.title?.[lang], task.materials?.[lang], ...(task.steps?.[lang] || [])].join(" \n "),
  );

/** { ok, why } for one try-at-home task: bilingual, within the sitting cap, nothing hazardous or paid. */
export function screenTask(task) {
  if (!task?.title?.en || !task?.title?.es) return { ok: false, why: "missing-language" };
  const en = task.steps?.en || [];
  const es = task.steps?.es || [];
  if (!en.length || en.length !== es.length) return { ok: false, why: "steps-mismatch" };
  if (!(Number(task.minutes) > 0) || Number(task.minutes) > 2 * SITTING_CAP_MINUTES)
    return { ok: false, why: "too-long" };
  const [enText, esText] = textOf(task);
  if (HAZARD.en.test(enText) || HAZARD.es.test(esText)) return { ok: false, why: "hazard" };
  return { ok: true, why: "" };
}

/** Text a speech engine should read: blanks become a pause. */
export const spoken = (text) => String(text).replace(/\[[^\]]+\]|_{3,}/g, "…");

const pick = (list, start, count) =>
  list.length
    ? Array.from(
        { length: Math.min(count, list.length) },
        (_, i) => list[(start + i) % list.length],
      )
    : [];

/** One sitting for a task of 10 minutes or less; two sittings (first steps, then the rest) for a longer one. */
function trySittings(task) {
  const minutes = Number(task.minutes);
  const title = { en: "Try it at home", es: "Pruébenlo en casa" };
  const n = task.steps.en.length;
  if (minutes <= SITTING_CAP_MINUTES) return [{ id: "try", title, minutes, task, from: 0, to: n }];
  const cut = Math.ceil(n / 2);
  const half = Math.ceil(minutes / 2);
  return [
    { id: "try-1", title, minutes: half, task, from: 0, to: cut, part: [1, 2] },
    { id: "try-2", title, minutes: half, task, from: cut, to: n, part: [2, 2] },
  ];
}

/**
 * The plan for one unit and one week. `guide` is the family guide (/api/bcpss/family-guide/:unit). `week` rotates which
 * phrases, questions and task are used, so a family gets something fresh each week from the same authored data.
 * @returns {{unitId, week, draft, notice, safety, sittings:Array, totalMinutes:number}|null} null when no task passes the screen
 */
export function buildWeeklyPlan(guide, week = 0) {
  const tasks = (guide?.try_at_home || []).filter((t) => screenTask(t).ok);
  const say = guide?.say_it || [];
  const talk = guide?.talk || [];
  if (!tasks.length || !say.length || !talk.length) return null;
  const w = Math.max(0, Math.trunc(week));
  // Prefer a task that fits one sitting; otherwise it is split over two days (never shortened or rewritten).
  const short = tasks.filter((t) => Number(t.minutes) <= SITTING_CAP_MINUTES);
  const task = (short.length ? short : tasks)[w % (short.length || tasks.length)];
  const goal = guide.goals?.en?.length
    ? {
        en: guide.goals.en[w % guide.goals.en.length],
        es: guide.goals.es?.[w % guide.goals.en.length],
      }
    : null;
  const sayItems = pick(say, w * SAY_COUNT, SAY_COUNT);
  const talkItems = pick(talk, w * TALK_COUNT, TALK_COUNT);
  const sittings = [
    {
      id: "say-talk",
      title: { en: "Say it and talk", es: "Díganlo y conversen" },
      minutes: sayItems.length * SAY_MINUTES + talkItems.length * TALK_MINUTES,
      say: sayItems,
      talk: talkItems,
    },
    ...trySittings(task),
    {
      id: "celebrate",
      title: { en: "Check and celebrate", es: "Revisen y celebren" },
      minutes: CHECK_MINUTES,
      goal,
      celebrate: guide.celebrate,
    },
  ];
  // Draft unless a person has reviewed the unit: absence of a review state is never read as reviewed.
  const draft = guide.authored === false || guide.provenance?.state !== "reviewed";
  return {
    unitId: guide.unit?.id || "",
    week: w,
    draft,
    notice: {
      en: DRAFT_NOTICE,
      es: "Borrador: todavía no lo ha revisado un docente ni un especialista en idiomas.",
    },
    safety: SAFETY,
    sittings,
    totalMinutes: sittings.reduce((n, s) => n + s.minutes, 0),
  };
}

/* ── progress note ─────────────────────────────────────────────────────────── */

const DOMAINS = ["listening", "speaking", "reading", "writing"];
const DOMAIN_WORD = {
  listening: ["listening", "comprensión auditiva"],
  speaking: ["speaking", "expresión oral"],
  reading: ["reading", "lectura"],
  writing: ["writing", "escritura"],
};
/** Words that must never appear in a family progress note. */
export const NOTE_BANNED =
  /\d|%|\blevels?\b|\bniveles?\b|\bscores?\b|\bpuntaje\b|\bgrade\b|\bband\b|\bbehind\b|\bIEP\b|\bSPED\b/i;

const dayWords = (days) =>
  days <= 0
    ? ["has not practiced yet this week", "todavía no ha practicado esta semana"]
    : days <= 2
      ? ["practiced a little this week", "practicó un poco esta semana"]
      : days <= 4
        ? ["practiced on several days this week", "practicó varios días esta semana"]
        : ["practiced almost every day this week", "practicó casi todos los días esta semana"];

/**
 * A short note for one learner from their class summary (counts per domain, practice days). Words only: never a number,
 * a score, a level or a comparison with other students. `alias` is the learner's class alias.
 * @returns {{en:string, es:string}}
 */
export function progressNote(summary = {}, alias = "Your learner") {
  const days = Number(summary.weekDays) || 0;
  const counts = DOMAINS.map((d) => [d, Number(summary.domains?.[d]) || 0]);
  const total = counts.reduce((n, [, c]) => n + c, 0);
  const [dayEn, dayEs] = dayWords(days);
  const most = [...counts].sort(
    (a, b) => b[1] - a[1] || DOMAINS.indexOf(a[0]) - DOMAINS.indexOf(b[0]),
  )[0][0];
  const least = [...counts].sort(
    (a, b) => a[1] - b[1] || DOMAINS.indexOf(a[0]) - DOMAINS.indexOf(b[0]),
  )[0][0];
  const spread = total > 0 && most !== least;
  const en = [
    `${alias} ${dayEn}.`,
    spread ? `${alias} has done the most ${DOMAIN_WORD[most][0]} practice.` : "",
    spread
      ? `A good next step at home: a little ${DOMAIN_WORD[least][0]}, using the Say it phrases.`
      : "A good next step at home: try the Say it phrases together.",
  ];
  const es = [
    `${alias} ${dayEs}.`,
    spread ? `${alias} ha hecho más práctica de ${DOMAIN_WORD[most][1]}.` : "",
    spread
      ? `Un buen siguiente paso en casa: un poco de ${DOMAIN_WORD[least][1]}, con las frases de Díganlo.`
      : "Un buen siguiente paso en casa: practiquen juntos las frases de Díganlo.",
  ];
  return { en: en.filter(Boolean).join(" "), es: es.filter(Boolean).join(" ") };
}
