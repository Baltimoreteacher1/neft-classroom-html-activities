// Adaptive practice selection (Enterprise 8). Chooses today's tasks from real evidence only, in the order
//   Learn -> Practice -> Review -> Transfer -> Demonstrate (plus an occasional Challenge),
// and says why each one was chosen. The same inputs always give the same plan; nothing is random or fixed.
// Evidence comes from the lab's tutor records (independent and supported answers kept apart) plus the Enterprise 8 extras.
import { skillKey } from "../tutor-engine.js";
import { buildGraph, directPrerequisites } from "./knowledge-graph.js";
import { evidenceFor } from "./mastery-evidence.js";
import { activePatterns } from "./misconception-engine.js";

const DAY = 86400000;
const ROLE_ORDER = [
  "learn",
  "practice",
  "review",
  "transfer",
  "demonstrate",
  "challenge",
];
export const ROLE_LABELS = {
  learn: { en: "Learn", es: "Aprender" },
  practice: { en: "Practice", es: "Practicar" },
  review: { en: "Review", es: "Repasar" },
  transfer: { en: "Transfer", es: "Transferir" },
  demonstrate: { en: "Show it", es: "Demostrarlo" },
  challenge: { en: "Challenge", es: "Desafío" },
};
const QUOTA = {
  review: 3,
  repair: 2,
  foundation: 2,
  practice: 4,
  learn: 2,
  demonstrate: 2,
  transfer: 1,
  challenge: 1,
};

const days = (ms) => Math.max(0, Math.round(ms / DAY));
const title = (key) => buildGraph().nodes.get(key)?.title || key;
const lastAt = (record) =>
  record?.recent?.length ? record.recent.at(-1).at : 0;

function supportedShare(record) {
  const r = record?.recent || [];
  return r.length ? r.filter((e) => !e.independent).length / r.length : 0;
}

// Difficulty follows evidence: picture-first when support was relied on or the last independent try missed,
// grade level otherwise, and a challenge only for transfer and challenge tasks. Never a jump of more than one level.
function levelFor(role, ev, record) {
  const lastInd = (record?.recent || []).filter((e) => e.independent).at(-1);
  if (role === "learn") return 0;
  if (role === "challenge" || role === "transfer") return 2;
  if (supportedShare(record) >= 0.5 || (lastInd && !lastInd.correct))
    return role === "review" ? 1 : 0;
  return 1;
}

function reasonFor(role, key, ev, record, now, extra = {}) {
  const t = title(key);
  const ind = ev.independent;
  const ok = (record?.recent || []).filter(
    (e) => e.independent && e.correct,
  ).length;
  switch (role) {
    case "review": {
      const since = days(now - lastAt(record));
      return {
        en:
          ev.overdue || since
            ? `It has been ${since} day${since === 1 ? "" : "s"} since ${t}. A short review keeps it strong.`
            : `A recent miss on ${t} says a short review will help.`,
        es:
          ev.overdue || since
            ? `Han pasado ${since} día${since === 1 ? "" : "s"} desde ${t}. Un repaso corto lo mantiene fuerte.`
            : `Un error reciente en ${t} indica que un repaso corto ayudará.`,
      };
    }
    case "repair":
      return {
        en: `Your recent answers show a pattern: ${extra.title.en.toLowerCase()}. This practice uses a model to fix it.`,
        es: `Tus respuestas recientes muestran un patrón: ${extra.title.es.toLowerCase()}. Esta práctica usa un modelo para corregirlo.`,
      };
    case "foundation":
      return {
        en: `${title(extra.target)} builds on ${t}, and ${t} needs more work first.`,
        es: `${title(extra.target)} se apoya en ${t}, y ${t} necesita más trabajo primero.`,
      };
    case "demonstrate":
      return {
        en: `You are close on ${t}: ${ok} right on your own so far. ${ev.next.en}`,
        es: `Estás cerca en ${t}: ${ok} correctas tú solo hasta ahora. ${ev.next.es}`,
      };
    case "transfer":
      return {
        en: `You are doing well on ${t}. Try it in a new form to show the idea, not just the steps.`,
        es: `Vas bien en ${t}. Pruébalo de otra forma para mostrar la idea y no solo los pasos.`,
      };
    case "challenge":
      return {
        en: `You showed ${t} on your own. Here is a harder one.`,
        es: `Demostraste ${t} tú solo. Aquí tienes uno más difícil.`,
      };
    case "practice":
      return {
        en: ind
          ? `${ok} of your ${ind} tries on ${t} were right on your own. More practice will help it stick.`
          : `More practice on ${t}, with support if you want it.`,
        es: ind
          ? `${ok} de tus ${ind} intentos en ${t} fueron correctos tú solo. Más práctica ayudará a que se quede.`
          : `Más práctica en ${t}, con apoyo si lo quieres.`,
      };
    default:
      return {
        en: `${t} is the next idea on your path.`,
        es: `${t} es la siguiente idea en tu camino.`,
      };
  }
}

export function planPractice({
  tutor,
  extras = {},
  patterns = null,
  grade,
  now = Date.now(),
  size = 10,
}) {
  const { nodes, order } = buildGraph();
  const records = tutor?.records || {};
  const ev = {};
  for (const key of nodes.keys())
    ev[key] = evidenceFor(records[key], extras[key] || {}, now);
  const inGrade = (key) => nodes.get(key).grade === Number(grade);
  const candidates = [];
  const add = (c) => candidates.push(c);
  const weak = (key) =>
    ev[key].independent >= 2 &&
    (ev[key].indicators.independentAccuracy?.value ?? 1) < 0.6;
  const ready = (key) => directPrerequisites(key).every((p) => !weak(p));

  // Misconception patterns that are likely or persistent route to the skill that the model repairs.
  for (const p of patterns || []) {
    const skillKeyFor = p.info.skills.find((k) => nodes.has(k));
    if (skillKeyFor)
      add({
        key: skillKeyFor,
        role: "repair",
        score: p.status === "persistent" ? 95 : 90,
        extra: { title: p.info.title, model: p.info.models[0] },
      });
  }
  for (const key of order) {
    const e = ev[key];
    const rec = records[key];
    const gradeSkill = inGrade(key);
    if (e.state === "review-due")
      add({
        key,
        role: "review",
        score: 100 + Math.min(30, e.overdue ? days(now - e.dueAt) : 0),
      });
    if (!gradeSkill) continue;
    // A grade skill whose foundation is shaky sends the learner to the foundation first.
    if (e.state !== "demonstrated")
      for (const pre of directPrerequisites(key))
        if (weak(pre))
          add({
            key: pre,
            role: "foundation",
            score: 85,
            extra: { target: key },
          });
    if (e.state === "not-yet" && ready(key))
      add({ key, role: "learn", score: 55 - order.indexOf(key) / 1000 });
    if (e.state === "developing" || e.state === "practicing") {
      const acc = e.indicators.independentAccuracy?.value ?? 0.4;
      const idle = rec ? Math.min(6, days(now - lastAt(rec))) : 0;
      add({ key, role: "practice", score: 70 - 20 * acc + idle });
    }
    const c = e.criteria;
    if (e.state === "practicing" && e.independent >= 4 && c.accurate)
      add({ key, role: "demonstrate", score: 80 });
    if (
      e.state === "practicing" &&
      (e.indicators.independentAccuracy?.value ?? 0) >= 0.8 &&
      !e.indicators.transfer
    )
      add({ key, role: "transfer", score: 65 });
    if (e.state === "demonstrated" && !e.indicators.transfer)
      add({ key, role: "challenge", score: 40 });
  }

  candidates.sort((a, b) => b.score - a.score || a.key.localeCompare(b.key));
  const used = new Set();
  const counts = {};
  const picked = [];
  // Quotas keep a day balanced. When evidence offers little else (a new learner, an all-mastered grade), learn and practice
  // tasks may fill the remaining places rather than leaving the day nearly empty.
  const take = (c, limit) => {
    if (picked.length >= size || used.has(c.key) || (counts[c.role] || 0) >= limit) return;
    used.add(c.key);
    counts[c.role] = (counts[c.role] || 0) + 1;
    // Repairs and foundations are presented as learn/practice tasks; the reason keeps the true cause.
    const shownRole = c.role === "repair" || c.role === "foundation" ? (ev[c.key].state === "not-yet" ? "learn" : "practice") : c.role;
    const rec = records[c.key];
    picked.push({ key: c.key, title: title(c.key), role: shownRole, cause: c.role, level: levelFor(shownRole, ev[c.key], rec), state: ev[c.key].state, model: c.extra?.model || nodes.get(c.key).models[0] || null, reason: reasonFor(c.role, c.key, ev[c.key], rec, now, c.extra) });
  };
  for (const c of candidates) take(c, QUOTA[c.role]);
  for (const c of candidates) if (c.role === "learn" || c.role === "practice") take(c, size);
  // Learn -> Practice -> Review -> Transfer -> Demonstrate, strongest evidence first inside each role.
  const rank = (t) => ROLE_ORDER.indexOf(t.role);
  const items = picked
    .map((p, i) => ({ ...p, i }))
    .sort((a, b) => rank(a) - rank(b) || a.i - b.i)
    .map(({ i, ...p }) => p);

  const recent = Object.keys(records).filter(
    (k) =>
      nodes.has(k) &&
      now - lastAt(records[k]) <= 3 * DAY &&
      ["developing", "practicing"].includes(ev[k].state),
  );
  return {
    items,
    review: [...nodes.keys()].filter((k) => ev[k].state === "review-due"),
    recentlyLearned: recent,
    readyForChallenge: [...nodes.keys()].filter(
      (k) => inGrade(k) && ev[k].state === "demonstrated",
    ),
    evidence: ev,
  };
}

// Read-only view of the review schedule the tutor engine already keeps (1, 3, 7, 14, 30 day ladder).
export function reviewSchedule(record, now = Date.now()) {
  const dueAt = Number.isFinite(record?.dueAt) ? record.dueAt : null;
  return {
    dueAt,
    intervalDays: record?.interval || 0,
    overdueDays: dueAt && now > dueAt ? days(now - dueAt) : 0,
    due: dueAt !== null && now >= dueAt,
  };
}

export { skillKey };
