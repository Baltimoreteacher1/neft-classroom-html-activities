// ACCESS Learning Journey: existing lab resources <-> Journey steps. The ONE source of truth for "what else in the
// lab supports this mission step". Pure, rule-based, deterministic: no DOM, no storage, no random, no clock.
//
//   resourcesFor(missionId, step, band, index) -> [{ kind, title, titleT?, href, domain, why: T, tag?: T }]   (max 4)
//   checkpointsFor(unitN, band, index)         -> same shape, optional end-of-unit practice tests              (max 4)
//   practiceTarget(missionId, step, band)      -> { href, label: T }  one index-free "Practice this skill" link
//
// `index` is the lab content index (content.js loadIndex()). Without it only the route registry applies, so every
// step still returns at least one resource.
//
// RULES (documented here because there is no hand-typed list of activities)
//  1. Routes (studios, rooms, games, printables) come from resources-data.js and are matched by step and by Key
//     Language Use: a route listing the mission's use (or none = all four) ranks first.
//  2. Bank activities are ranked per step: the step's domains (STEP_PLAN), then
//       score = 4 if the activity's Key Language Use equals the mission's  (tag = keyUseForSkill(skill text); the
//                   index carries no explicit tag, so this is a rule over the skill text, see lang/purpose.js)
//             + 1 if the skill text names no use (a general skill is still usable)
//             + 2 per mission feature found in skill + title (FEATURE_PATTERNS, capped at 4)
//             + 1 for a `constructed` item on communicate/show (real production, not a choice)
//     Activities with score 0 are never listed. Ties break by level preference (STEP_PLAN.levels), then id.
//     Model-Test items are excluded (they are test items, not practice).
//  3. Study steps (discover..improve) may show supports. `show` items are labelled "On your own" and link with
//     `mode=independent`, so they open with no frames, word bank or model.
//  4. Practice tests are never transformed or scaffolded. They are only ever returned by checkpointsFor (and as the
//     single mini check at the end of `show`), labelled "Checkpoint", linked to /test/<id> in Independent
//     Rehearsal mode (`rehearsal=independent`).
import { BASE } from "../util.js";
import { keyUseForSkill } from "../lang/purpose.js";
import { FEATURES, MISSIONS, STEPS, missionNumber } from "./curriculum.js";
import {
  CHECKPOINT_PLAN,
  EXTERNAL,
  FEATURE_PATTERNS,
  GAMES,
  PRINTABLES,
  ROUTES,
  STEP_PLAN,
} from "./resources-data.js";

export const MAX_RESOURCES = 4;
/** A ranked activity counts as a STRONG match (not just usable) at this score: same use, or a feature hit plus no conflicting use. */
export const STRONG = 3;

const DOMAIN_ES = {
  Listening: "escucha",
  Reading: "lectura",
  Speaking: "expresión oral",
  Writing: "escritura",
};
const TAG_OWN = ["On your own", "Por tu cuenta"];
const TAG_CHECK = ["Checkpoint", "Punto de control"];
const q = (band, extra = "") => `?grades=${band}${extra}`;

const routeById = new Map(ROUTES.map((r) => [r.id, r]));
const familyRoute = routeById.get("family");

// ── the registry as resources ──────────────────────────────────────────────────
const fits = (klus, klu) => klus.length === 0 || klus.includes(klu);
const routeRes = (r, band, kind = r.kind) => ({
  kind: kind === "room" || kind === "journey" ? "studio" : kind,
  title: r.label[0],
  titleT: r.label,
  href: `${BASE}/${r.path}${q(band)}`,
  domain: r.domain,
  why: r.objective,
});
const gameRes = (g, band) => ({
  kind: "game",
  title: g.label[0],
  titleT: g.label,
  href: `${BASE}/games/${g.id}${q(band)}`,
  domain: g.domain,
  why: g.objective,
});

/** Registry rows for a step, mission-use matches first, then registry order. Pure. */
function registryFor(step, klu, ids) {
  const pool = ids.map((id) => routeById.get(id)).filter(Boolean);
  return pool
    .filter((r) => r.steps.includes(step))
    .map((r, i) => ({ r, i, hit: r.klus.includes(klu) ? 0 : fits(r.klus, klu) ? 1 : 2 }))
    .filter((x) => x.hit < 2)
    .sort((a, b) => a.hit - b.hit || a.i - b.i)
    .map((x) => x.r);
}

const gamesFor = (step, klu, band) =>
  GAMES.filter((g) => g.steps.includes(step) && fits(g.klus, klu)).map((g) => gameRes(g, band));

// ── bank activities ────────────────────────────────────────────────────────────
function featureHits(mission, text) {
  const t = text.toLowerCase();
  return mission.features.filter((f) => FEATURE_PATTERNS[f]?.test(t));
}

/** Rows of the index for a band and domain list: [{ id, title, type, skill, minutes, domain, level }]. */
function bankRows(index, band, domains) {
  const out = [];
  const doms = index?.bands?.[band]?.domains || {};
  for (const domain of domains)
    for (const [level, L] of Object.entries(doms[domain]?.levels || {}))
      for (const [id, title, type, skill, minutes] of L.activities || [])
        out.push({ id, title, type, skill: skill || "", minutes, domain, level });
  return out;
}

/** The mission's Key Language Use match for a row: 4 = same use, 1 = no use named, 0 = another use. */
export function kluScore(row, klu) {
  const tag = keyUseForSkill(row.skill);
  return tag === klu ? 4 : tag === null ? 1 : 0;
}

function rankActivities(index, band, mission, step) {
  const plan = STEP_PLAN[step];
  const produce = step === "communicate" || step === "show";
  const scored = bankRows(index, band, plan.domains).map((row) => {
    const hits = featureHits(mission, `${row.skill} ${row.title}`);
    const score =
      kluScore(row, mission.klu) +
      Math.min(4, hits.length * 2) +
      (produce && row.type === "constructed" ? 1 : 0);
    return {
      row,
      hits,
      score,
      lv: plan.levels.indexOf(row.level),
      dom: plan.domains.indexOf(row.domain),
    };
  });
  return scored
    .filter((x) => x.score > 0)
    .sort(
      (a, b) =>
        b.score - a.score || a.lv - b.lv || a.dom - b.dom || a.row.id.localeCompare(b.row.id),
    );
}

/** Inverse rule (inventory): the mission a skill/title fits best: same Key Language Use + feature hits; ties -> lowest number. */
export function missionFor(klu, text) {
  let best = { id: "m01", score: -1 };
  for (const [id, m] of Object.entries(MISSIONS)) {
    const score = (klu && m.klu === klu ? 4 : klu ? 0 : 1) + Math.min(4, featureHits(m, text).length * 2);
    if (score > best.score) best = { id, score };
  }
  return best.id;
}

/** Inverse rule (inventory): the step a bank activity practices, by skill and support level. */
export const stepFor = (domain, level) =>
  domain === "Listening" || domain === "Reading" ? "understand" : level === "C" ? "show" : "communicate";

/** Qualifying bank activities for a mission step, best first (the pool resourcesFor draws from). */
export const candidatesFor = (missionId, step, band, index) =>
  MISSIONS[missionId] ? rankActivities(index, band, MISSIONS[missionId], step) : [];

const activityWhy = (mission, hits, row, own) => {
  const f = hits[0] && FEATURES[hits[0]]?.label;
  const domEs = DOMAIN_ES[row.domain] || "lenguaje";
  const en = `${own ? "On your own, with no help shown. " : ""}Practices: ${row.skill || row.title}.${f ? ` Fits “${f[0]}” in this mission.` : ""}`;
  const es = `${own ? "Por tu cuenta, sin ayuda a la vista. " : ""}Práctica de ${domEs}.${f ? ` Se relaciona con «${f[1]}» de esta misión.` : ""}`;
  return [en, es];
};

const activityRes = (x, mission, band, own) => ({
  kind: "activity",
  title: x.row.title,
  href: `${BASE}/${x.row.domain}/${x.row.level}/${x.row.id}${q(band, own ? "&mode=independent" : "")}`,
  domain: x.row.domain,
  why: activityWhy(mission, x.hits, x.row, own),
  ...(own ? { tag: TAG_OWN } : {}),
});

/** Best `n` activities per domain in `domains`, in domain order (so a step names each of its skills). */
function topPerDomain(ranked, domains, n) {
  const out = [];
  for (const d of domains) out.push(...ranked.filter((x) => x.row.domain === d).slice(0, n));
  return out;
}

// ── studio tasks (Speaking / Writing Studio, chosen by Key Language Use) ──────
function studioTasks(index, band, klu) {
  const take = (list, base, domain, why) =>
    (list || [])
      .filter((t) => t.band === band && t.keyUse === klu)
      .sort((a, b) => a.id.localeCompare(b.id))
      .slice(0, 1)
      .map((t) => ({
        kind: "studio",
        title: t.title,
        href: `${BASE}/${base}/${t.id}${q(band)}`,
        domain,
        why,
      }));
  return [
    ...take(index?.studio?.speaking, "speak", "Speaking", [
      "A Speaking Studio task for this kind of language: say it, type it, review it.",
      "Una tarea del Estudio de expresión oral para este tipo de lenguaje: dilo, escríbelo y revísalo.",
    ]),
    ...take(index?.studio?.writing, "write", "Writing", [
      "A Writing Studio task for this kind of language: plan, draft and revise.",
      "Una tarea del Estudio de escritura para este tipo de lenguaje: planifica, escribe y revisa.",
    ]),
  ];
}

// ── tests ──────────────────────────────────────────────────────────────────────
const CHECK_WHY = (title) => [
  `An optional practice check: ${title}. No help is shown, and it does not change your journey.`,
  `Una revisión de práctica opcional: ${title}. No se muestra ayuda y no cambia tu viaje.`,
];
const testRes = (t, band) => ({
  kind: "test",
  title: t.title,
  href: `${BASE}/test/${t.id}${q(band, "&rehearsal=independent")}`,
  domain: t.domain || "All",
  why: CHECK_WHY(t.title),
  tag: TAG_CHECK,
});
const testsOf = (index, band) =>
  (index?.tests || []).filter((t) => t.band === band).sort((a, b) => a.id.localeCompare(b.id));

/**
 * End-of-unit optional practice-test checkpoints (JOURNEY: the tests stay exactly as they exist; nothing here
 * adds a scaffold). Per CHECKPOINT_PLAN: units 1 and 2 give a short practice set for two skills; units 3 and 4 give
 * a second test for those skills when the band has one, plus a full form (Form A closes unit 3; Form B then A close
 * unit 4). Grades 3-5 has one test per skill, so units 3 and 4 carry only full forms.
 */
export function checkpointsFor(unitN, band, index) {
  const plan = CHECKPOINT_PLAN[unitN];
  if (!plan) return [];
  const tests = testsOf(index, band);
  const kindRank = (t) => (t.kind === "mini" ? 0 : 1);
  const picked = plan.domains.map((d) =>
    tests.filter((t) => t.domain === d).sort((a, b) => kindRank(a) - kindRank(b) || a.id.localeCompare(b.id))[plan.pick],
  );
  // Form A closes unit 3; Form B then Form A close unit 4.
  const fulls = tests.filter((t) => t.kind === "full");
  picked.push(...(plan.fulls === 2 ? [fulls[1], fulls[0]] : fulls.slice(0, plan.fulls)));
  return dedupe(picked.filter(Boolean).map((t) => testRes(t, band))).slice(0, MAX_RESOURCES);
}


/** The single mini check shown last in `show`: the short practice set for the mission's own use-fitting skill. */
function showCheckpoint(index, band, missionId) {
  const doms = ["Reading", "Listening", "Speaking", "Writing"];
  const d = doms[(missionNumber(missionId) - 1) % doms.length];
  const t = testsOf(index, band).find((x) => x.kind === "mini" && x.domain === d);
  return t ? [testRes(t, band)] : [];
}

// ── assembly ───────────────────────────────────────────────────────────────────
function dedupe(list) {
  const seen = new Set();
  return list.filter((r) => r && !seen.has(r.href) && seen.add(r.href));
}

/** Resources for one mission step (see header rules). Always at least one, at most four, no duplicate href. */
export function resourcesFor(missionId, step, band, index = null) {
  const mission = MISSIONS[missionId];
  if (!mission || !STEPS.some((s) => s.id === step)) return [];
  const klu = mission.klu;
  const plan = STEP_PLAN[step];
  const ranked = index ? rankActivities(index, band, mission, step) : [];
  const own = step === "show";
  const acts = (n) =>
    topPerDomain(ranked, plan.domains, n).map((x) => activityRes(x, mission, band, own));
  const routes = (ids) => registryFor(step, klu, ids).map((r) => routeRes(r, band));
  let list;
  switch (step) {
    case "discover":
      list = [
        ...routes(["exhibition", "worlds", "reality", "stories", "reading-room"]).slice(0, 3),
        ...acts(1),
      ];
      break;
    case "understand":
      list = [
        ...acts(2),
        ...gamesFor(step, klu, band).slice(0, 1),
        ...routes(["ladder", "reading-room", "learn"]),
      ];
      break;
    case "build":
      list = [
        ...routes(["construction", "vocabulary", "detective"]),
        ...gamesFor(step, klu, band),
        ...routes(["flashcards"]),
      ];
      break;
    case "communicate":
      list = [
        ...studioTasks(index, band, klu),
        ...routes(["conversation"]),
        ...acts(1),
        ...gamesFor(step, klu, band),
      ];
      break;
    case "improve":
      list = [
        ...routes(["detective", "evidence"]),
        ...gamesFor(step, klu, band).slice(0, 1),
        ...(familyRoute ? [{ ...routeRes(familyRoute, band, "family"), href: `${BASE}/family?mission=${missionId}&grades=${band}` }] : []),
      ];
      break;
    default:
      list = [
        ...acts(1),
        ...showCheckpoint(index, band, missionId),
        ...PRINTABLES.filter((p) => p.steps.includes(step)).map((p) => printRes(p)),
      ];
  }
  const out = dedupe(list).slice(0, MAX_RESOURCES);
  return out.length ? out : fallback(step, band);
}

const printRes = (p) => ({
  kind: "printable",
  title: p.label[0],
  titleT: p.label,
  href: p.path,
  domain: p.domain,
  why: p.objective,
});

/** A step whose rules found nothing still gets the skill's own room (never an empty list). */
function fallback(step, band) {
  const d = STEP_PLAN[step].domains[0];
  return [
    {
      kind: "studio",
      title: d,
      href: `${BASE}/${d}${q(band)}`,
      domain: d,
      why: [`More ${d.toLowerCase()} practice.`, `Más práctica de ${DOMAIN_ES[d]}.`],
    },
  ];
}

/** One index-free "Practice this skill" link for a step: the room of the skill that step practices. */
export function practiceTarget(missionId, step, band) {
  const d = (STEP_PLAN[step] || STEP_PLAN.communicate).domains[0];
  return {
    href: `${BASE}/${d}${q(band)}`,
    label: ["Practice this skill", "Practicar esta destreza"],
    domain: d,
  };
}

/** Every route the registry can emit, for tests and the inventory: [{ path, kind }]. */
export const registeredPaths = () => [
  ...ROUTES.map((r) => ({ path: r.path, kind: r.kind })),
  ...GAMES.map((g) => ({ path: `games/${g.id}`, kind: "game" })),
  ...EXTERNAL.map((e) => ({ path: e.path, kind: e.kind })),
  ...PRINTABLES.map((p) => ({ path: p.path, kind: "printable" })),
];
