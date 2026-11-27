/* plan-engine.js — deterministic resource sets for /curriculum/find/ ("Plan a set" and "My practice path").
 *
 * A teacher names a target (a lesson, a standard or a topic) and a purpose; a student names a lesson. Each purpose is
 * an ordered list of slots ("Get ready", "Small group: extra support", "Game" …). Every slot is filled from resources
 * that already exist in data/curriculum-find-index.json, looked for in rings: the lesson itself, then the same
 * standard, then the same topic (by tag or by the topic named in the title). The ring is said out loud in `where`, so
 * a teacher can see when a pick is from a neighbouring lesson. A slot with nothing to offer says so; it is never
 * padded with an unrelated resource. Nothing here writes, generates or changes a lesson: it only links.
 *
 * Pure functions over the index: the same index and request always give the same set (tools/curriculum-find-plan.test.mjs). */

import { parseQuery, scoreDoc, standardLabel, topicOf } from "./find-engine.js";

const LP_SEARCH = "https://thelanguagepage.com/access-practice-lab/search";

/** Registry topics (data/curriculum-find-index.json standards[code][0]) in course order, with the words a teacher uses. */
export const TOPICS = {
  ratios: "Ratios, rates and percents",
  statistics: "Statistics",
  fractions: "Fractions",
  decimals: "Decimals",
  factors: "Factors and multiples",
  "number-line": "Integers and the number line",
  "coordinate-plane": "The coordinate plane",
  exponents: "Exponents",
  expressions: "Expressions",
  inequalities: "Equations and inequalities",
  area: "Area",
  "surface-area": "Surface area",
  volume: "Volume",
};

/** How a Find topic key reads inside a sentence ("Same topic: percents (named in its title)"). */
const TOPIC_WORDS_SHOWN = {
  percent: "percents",
  practices: "mathematical practices",
  "number-line": "the number line",
  "coordinate-plane": "the coordinate plane",
};
const isPrintable = (d, re) => d.k === "printable" && re.test(d.t);
// The interactive practice studios: generated (/math/practice-studio/<id>/) and the hand-built Unit 4 ones
// (/math/unit-4/<id>-practice-studio/, filed as activities).
const STUDIO = /\/practice-studio\/|-practice-studio(-challenging)?\/$/;
/** The slot library. `test` reads index fields first and the generated title patterns only where no field exists. */
const SLOTS = {
  ready: {
    label: "Get ready",
    student: "Warm up",
    test: (d) => d.k === "readiness",
    why: "Reviews the earlier skills this lesson builds on, so gaps show before the lesson starts.",
    studentWhy: "A quick warm-up with the skills you need for this lesson.",
  },
  language: {
    label: "Language support",
    why: "Vocabulary, sentence frames and speaking practice for this topic on The Language Page, with visual and Spanish supports. This opens a search there, not one checked resource.",
  },
  notes: {
    label: "Guided notes",
    test: (d) => isPrintable(d, /— Notes$/) && !d.v,
    why: "Printable notes students fill in during the lesson.",
  },
  explore: {
    label: "Explore it",
    test: (d) =>
      d.k === "lab" ||
      (d.k === "tool" && /Learning Lab/.test(d.t)) ||
      (d.k === "activity" && !STUDIO.test(d.p)),
    why: "A hands-on lab or activity on the same idea, for building understanding before practice.",
  },
  practice: {
    label: "Interactive practice",
    student: "Practice",
    test: (d) => (d.k === "practice" || d.k === "activity") && STUDIO.test(d.p) && !d.v,
    why: "Online practice on this skill that students can do on their own.",
    studentWhy: "Practice the skill. You can go back and try again as many times as you like.",
  },
  apply: {
    label: "Apply it",
    test: (d) => d.k === "practice" && /-part2\/$/.test(d.p),
    why: "Part II: the lesson applied to a real-world problem, worked in small groups.",
  },
  worksheet: {
    label: "Printable worksheet",
    test: (d) => isPrintable(d, /Practice Worksheet/) && !d.v,
    why: "A printable worksheet for independent practice or homework.",
  },
  supportSheet: {
    label: "Worksheet with extra support",
    test: (d) => d.k === "printable" && d.v === "support" && /Worksheet/.test(d.t),
    why: "The extra-support version of the lesson worksheet.",
  },
  workbook: {
    label: "Practice workbook",
    test: (d) => isPrintable(d, /Practice Workbook/) && !d.v,
    why: "The printable practice workbook, for a longer review session.",
  },
  smallSupport: {
    label: "Small group: extra support",
    test: (d) => d.k === "small-group" && d.v === "support",
    why: "The small-group lesson written for students who need more support (Group 1).",
  },
  smallOn: {
    label: "Small group: on level",
    test: (d) => d.k === "small-group" && !d.v,
    why: "The on-level small-group lesson (Group 2), for students who need one more pass.",
  },
  catchup: {
    label: "Catch-up",
    test: (d) => d.k === "catch-up",
    why: "A catch-up lesson that revisits this lesson together with the ones around it.",
  },
  game: {
    label: "Game",
    student: "Play",
    test: (d) => d.k === "game",
    why: "A game on the same idea, for extra practice that students choose to do.",
    studentWhy: "A game that uses the same math.",
  },
  check: {
    label: "Check for understanding",
    student: "Check yourself",
    test: (d) => d.k === "review",
    why: "A review set to see who has the skill before moving on.",
    studentWhy: "See what you can do now. If something is hard, look back at the practice.",
  },
  challenge: {
    label: "Challenge",
    test: (d) => d.v === "challenge" && d.k !== "printable",
    why: "The challenge level of the same practice, for students who are ready to go further.",
  },
  enrich: {
    label: "Enrichment",
    test: (d) => d.k === "enrichment",
    why: "Enrichment problems on the same standard.",
  },
  project: {
    label: "Project",
    test: (d) => d.k === "project",
    why: "A longer project where the unit's math is used to make something.",
  },
  family: {
    label: "Family practice",
    test: (d) => d.k === "family",
    why: "Homework a family can do together at home.",
  },
};

/** What a set is for, in the order the slots should be used. */
export const PURPOSES = {
  introduce: {
    label: "Teach the lesson",
    lead: "Before, during and after the lesson.",
    slots: ["ready", "language", "notes", "explore", "practice", "check", "family"],
  },
  practice: {
    label: "Independent practice",
    lead: "Practice students can do on their own, online and on paper.",
    slots: ["practice", "worksheet", "game", "apply", "challenge", "family"],
  },
  intervene: {
    label: "Small-group reteach",
    lead: "For students who need the lesson again, with more support.",
    slots: ["ready", "smallSupport", "catchup", "supportSheet", "language", "game"],
  },
  review: {
    label: "Review before a test",
    lead: "Revisit the skill and see who has it.",
    slots: ["check", "workbook", "game", "smallOn", "practice"],
  },
  extend: {
    label: "Extend",
    lead: "For students who are ready to go further.",
    slots: ["challenge", "enrich", "project", "explore", "game"],
  },
  family: {
    label: "Practice at home",
    lead: "Things a family can do together, on paper or on a phone.",
    slots: ["family", "game", "practice"],
  },
};
/** The student practice path: four steps, in student words. */
export const PATH_SLOTS = ["ready", "practice", "game", "check"];

const LESSON_ID = /^(\d+)-(\d+)$/;
/** Course lessons in order: [{ id, unit, title, standard }]. */
export function lessons(index) {
  return index.docs
    .filter((d) => d.k === "lesson" && LESSON_ID.test(d.l || "") && d.p === `/lessons/${d.l}/`)
    .map((d) => ({
      id: d.l,
      unit: d.u,
      title: d.t.replace(/^\d+-\d+\s+/, ""),
      standard: d.s || null,
    }))
    .sort((a, b) => {
      const [, au, an] = a.id.match(LESSON_ID);
      const [, bu, bn] = b.id.match(LESSON_ID);
      return au - bu || an - bn;
    });
}
export const nextLesson = (index, id) => {
  const all = lessons(index);
  const at = all.findIndex((l) => l.id === id);
  return at >= 0 ? all[at + 1] || null : null;
};

/** "6-6", "s:6.AT.7" or "t:ratios" → a resolved target, or null when it is not in the index. */
export function resolveTarget(index, raw) {
  const v = String(raw || "").trim();
  if (LESSON_ID.test(v)) {
    const l = lessons(index).find((x) => x.id === v);
    if (!l) return null;
    const topic = l.standard ? index.standards[l.standard]?.[0] || null : null;
    return {
      key: v,
      kind: "lesson",
      lesson: v,
      standard: l.standard,
      unit: l.unit ?? null,
      topic,
      label: `Lesson ${v}: ${l.title}`,
    };
  }
  if (v.startsWith("s:") && index.standards[v.slice(2)]) {
    const s = v.slice(2);
    return {
      key: v,
      kind: "standard",
      lesson: null,
      standard: s,
      unit: lessons(index).find((x) => x.standard === s)?.unit ?? null,
      topic: index.standards[s][0],
      label: `${s} ${standardLabel(index, s)}`,
    };
  }
  if (v.startsWith("t:") && TOPICS[v.slice(2)])
    return {
      key: v,
      kind: "topic",
      lesson: null,
      standard: null,
      unit: null,
      topic: v.slice(2),
      label: TOPICS[v.slice(2)],
    };
  return null;
}

/** Where a candidate sits relative to the target: 0 lesson, 1 standard, 2 unit, 3 topic; null when unrelated. */
function ringOf(index, target, d, topicHits) {
  if (target.lesson && d.l === target.lesson) return 0;
  if (target.standard && d.s === target.standard) return 1;
  // A resource's unit is only trusted when it belongs to a lesson or teaches a standard on the same topic: games still
  // carry the unit number of their legacy folder ("Unit 2 Decimal Computation" is filed as unit 2, now Statistics).
  if (target.unit != null && d.u === target.unit && (d.l || topicOf(index, d) === target.topic))
    return 2;
  if (target.topic && (topicOf(index, d) === target.topic || topicHits.has(d.p))) return 3;
  return null;
}
function whereText(index, target, d, ring, topicHits) {
  if (ring === 0) return `From Lesson ${target.lesson}`;
  const from = d.l ? `, from Lesson ${d.l}` : "";
  if (ring === 1)
    return target.kind === "standard"
      ? `Teaches ${target.standard}${from}`
      : `Same standard (${target.standard})${from}`;
  const none = `Nothing of this kind is tagged to this ${target.kind}`;
  if (ring === 2) {
    const name = index.units?.[target.unit];
    return `Same unit (Unit ${target.unit}${name ? `: ${name}` : ""})${from}. ${none}${target.kind === "lesson" ? " or its standard" : ""}.`;
  }
  const tagged = topicOf(index, d) === target.topic;
  const about = tagged
    ? TOPICS[target.topic]?.toLowerCase() || target.topic
    : `${topicHits.get(d.p)} (named in its title)`;
  return target.kind === "topic"
    ? `About ${about}${from}`
    : `Same topic: ${about}${from}. ${none}${target.unit != null ? " or its unit" : ""}.`;
}

/**
 * Documents whose TITLE names one of the target's topics (games, labs and tools carry no standard), mapped to the topic
 * named. The topics are the narrower ones the target's own title names ("Relate Fractions, Decimals, and Percentages" →
 * fractions, decimals, percent) and then its registry topic, so a percent lesson finds a percent game first.
 */
function topicTextHits(index, target) {
  const hits = new Map();
  const topics = new Set(parseQuery(target.label).topics);
  if (target.topic) for (const t of parseQuery(target.topic.replace(/-/g, " ")).topics) topics.add(t);
  for (const t of topics) {
    const q = { ...parseQuery(""), topics: [t] };
    for (const d of index.docs) {
      if (hits.has(d.p)) continue;
      if (scoreDoc(index, d, q)?.why.includes("Topic named in the title"))
        hits.set(d.p, TOPIC_WORDS_SHOWN[t] || t.replace(/-/g, " "));
    }
  }
  return hits;
}

function rank(target) {
  return (a, b) =>
    a.ring - b.ring ||
    // In the lesson ring, the lesson's own folder before its small-group and catch-up variants.
    (target.lesson ? own(b.doc, target) - own(a.doc, target) : 0) ||
    (target.lesson
      ? Math.abs(lessonNo(a.doc) - lessonNo(target)) - Math.abs(lessonNo(b.doc) - lessonNo(target))
      : 0) ||
    (a.doc.u ?? 99) - (b.doc.u ?? 99) ||
    a.doc.t.localeCompare(b.doc.t);
}
const own = (d, target) => (d.p.startsWith(`/lessons/${target.lesson}/`) ? 1 : 0);
function lessonNo(x) {
  const m = String(x.l || x.lesson || "").match(LESSON_ID);
  return m ? Number(m[1]) * 100 + Number(m[2]) : 9999;
}

/** The Language Page search for the target's topic, by grade band 6-8. */
export function languageLink(target) {
  const words = target.topic ? TOPICS[target.topic] || target.topic : target.label;
  const params = new URLSearchParams({ q: `${words} vocabulary`.toLowerCase(), grades: "6-8" });
  return `${LP_SEARCH}?${params}`;
}

/**
 * Build a set. `purpose` is a PURPOSES key or "path" (the student practice path). Returns
 * { target, purpose, slots: [{ id, label, why, pick: { doc, ring, where } | null, alts: [...], external? }] }.
 * `alts` are the next candidates in rank order for "Swap"; no document appears in two slots.
 */
export function buildSet(index, rawTarget, purpose) {
  const target = typeof rawTarget === "string" ? resolveTarget(index, rawTarget) : rawTarget;
  const student = purpose === "path";
  const slotIds = student ? PATH_SLOTS : PURPOSES[purpose]?.slots;
  if (!target || !slotIds) return null;
  const topicHits = topicTextHits(index, target);
  const used = new Set();
  const slots = slotIds.map((id) => {
    const def = SLOTS[id];
    const base = {
      id,
      label: (student && def.student) || def.label,
      why: (student && def.studentWhy) || def.why,
    };
    if (id === "language") {
      return {
        ...base,
        pick: null,
        alts: [],
        external: {
          href: languageLink(target),
          title: `${target.topic ? TOPICS[target.topic] : target.label}: vocabulary and sentence frames`,
        },
      };
    }
    const pool = [];
    for (const doc of index.docs) {
      if (!def.test(doc) || used.has(doc.p)) continue;
      // A student path only offers what a student opens online on their own.
      if (student && (doc.pr || !String(doc.a || "s").includes("s"))) continue;
      const ring = ringOf(index, target, doc, topicHits);
      if (ring != null) pool.push({ doc, ring });
    }
    pool.sort(rank(target));
    const [first, ...rest] = pool;
    if (first) used.add(first.doc.p);
    const withWhere = (c) => ({ ...c, where: whereText(index, target, c.doc, c.ring, topicHits) });
    return { ...base, pick: first ? withWhere(first) : null, rest, withWhere };
  });
  // Swaps come from what no other slot picked, so a swap can never show one resource twice.
  return {
    target,
    purpose,
    slots: slots.map(({ rest = [], withWhere, ...slot }) =>
      slot.external
        ? slot
        : { ...slot, alts: rest.filter((c) => !used.has(c.doc.p)).slice(0, 3).map(withWhere) },
    ),
  };
}

/** Apply "Swap" choices ({ slotId: altIndex }) to a built set: the chosen alternative becomes the pick. */
export function applySwaps(set, swaps = {}) {
  if (!set) return set;
  return {
    ...set,
    slots: set.slots.map((s) => {
      const n = Number(swaps[s.id]);
      if (!s.pick || !Number.isInteger(n) || n < 1 || n > s.alts.length) return s;
      const all = [s.pick, ...s.alts];
      return { ...s, pick: all[n], alts: all.filter((_, i) => i !== n) };
    }),
  };
}
