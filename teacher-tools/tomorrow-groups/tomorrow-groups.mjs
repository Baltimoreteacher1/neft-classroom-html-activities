/**
 * Tomorrow's groups — who to pull for the NEXT paced lesson, and why.
 *
 * Groups from Evidence answers "which errors are live this week?". This answers
 * the planning question a teacher asks the night before: for tomorrow's lesson
 * (the next lesson on the district pacing plan), which students go to
 * Small Group 1, Small Group 2, or Catch-Up, what misconception puts each of
 * them there, and which small-group lesson to open.
 *
 * It invents no data and no backend. Inputs are the rows the teacher tools
 * already read:
 *   - /api/progress/telemetry (TEACHER_KEY-gated): `misconception` events
 *     (props.tag), `item_attempt` (props.result), `phase_complete`
 *     (props.correct / props.total) — the per-student evidence
 *   - data/pacing-baseline-2026-27.json — which lesson is next
 *   - data/misconception-taxonomy.json, data/small-group-variants.json — labels
 *     and which variant lessons exist (shared with Groups from Evidence)
 *
 * Placement rules (stated on the page, so a teacher can disagree with them):
 *   - CATCH-UP: the same misconception 3+ times in the window, or under 50%
 *     correct on 4+ graded attempts. The error is entrenched; the catch-up
 *     lesson re-teaches the prerequisite lessons it covers.
 *   - GROUP 1: a named misconception 1–2 times. Targeted support at the table.
 *   - GROUP 2: no named misconception, but 50–79% correct on 4+ attempts —
 *     mostly there; Group 2 pushes "explain why".
 *   - Everyone else with evidence stays whole-group.
 * A student is placed in exactly one group.
 *
 * PURE: no DOM, no network, clock injected. Runs in Node tests and the page.
 */

import { baseLessonOf, DEFAULT_WINDOW_DAYS } from "../evidence-groups/grouping.mjs";

export const CATCHUP_REPEATS = 3;
export const CATCHUP_ACCURACY = 0.5;
export const GROUP2_ACCURACY = 0.8;
export const MIN_ATTEMPTS = 4;

const DAY_MS = 86400000;

/** YYYY-MM-DD in local time — pacing dates are calendar days, not instants. */
export function isoDay(ms) {
  const d = new Date(ms);
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

/**
 * The next paced lesson strictly after `today` (YYYY-MM-DD) — a base lesson id
 * the plan schedules, skipping catch-up/flex/testing days that carry none.
 * @returns {{ id: string, date: string, title: string } | null}
 */
export function nextPacedLesson(days, today) {
  for (const d of Array.isArray(days) ? days : []) {
    if (!d || String(d.date) <= today) continue;
    const id = baseLessonOf(d.plan?.lessonId || "");
    if (!id || id !== d.plan.lessonId) continue;
    return { id, date: d.date, title: d.plan.planTitle || "" };
  }
  return null;
}

function toTime(v) {
  const ms = typeof v === "number" ? v : Date.parse(String(v ?? ""));
  return Number.isFinite(ms) ? ms : null;
}

function tagOf(e) {
  const p = e?.props || {};
  const raw = p.tag || p.misconceptionTag || p.misconception || e?.tag || "";
  return typeof raw === "string" ? raw.trim() : "";
}

/** Link for a variant that EXISTS; null rather than a guessed URL. */
function variantLink(base, variants, suffix) {
  const info = variants?.[base];
  if (!info || !Array.isArray(info.variants) || !info.variants.includes(suffix)) return null;
  return { id: `${base}-${suffix}`, url: `/lessons/${base}-${suffix}/`, title: info.title || base };
}

/**
 * Build tomorrow's plan.
 * @param {object[]} events telemetry rows
 * @param {object} opts
 * @param {string} opts.lessonId the lesson the groups are for (base id)
 * @param {number} [opts.now]
 * @param {number} [opts.windowDays]
 * @param {string} [opts.section]
 * @param {object} [opts.taxonomy]
 * @param {object} [opts.variants]
 */
export function planTomorrow(events, opts) {
  const {
    lessonId,
    now = Date.now(),
    windowDays = DEFAULT_WINDOW_DAYS,
    section = "",
    taxonomy = {},
    variants = {},
  } = opts || {};
  const start = now - Math.max(1, windowDays) * DAY_MS;

  /** name → { tags: Map<tag,{count,last}>, correct, attempts } */
  const students = new Map();
  const get = (name) => {
    if (!students.has(name)) students.set(name, { tags: new Map(), correct: 0, attempts: 0 });
    return students.get(name);
  };

  for (const e of Array.isArray(events) ? events : []) {
    if (section && (e?.section || "") !== section) continue;
    const at = toTime(e?.at);
    if (at == null || at < start || at > now) continue;
    const name = typeof e?.studentName === "string" ? e.studentName.trim() : "";
    if (!name) continue;
    const s = get(name);
    const p = e.props || {};
    if (e.type === "misconception") {
      const tag = tagOf(e);
      if (!tag) continue;
      const slot = s.tags.get(tag) || { count: 0, last: 0 };
      slot.count += 1;
      slot.last = Math.max(slot.last, at);
      s.tags.set(tag, slot);
    } else if (e.type === "item_attempt") {
      s.attempts += 1;
      if (p.result === "correct") s.correct += 1;
    } else if (e.type === "phase_complete") {
      const total = Number(p.total);
      const correct = Number(p.correct);
      if (Number.isFinite(total) && total > 0 && Number.isFinite(correct)) {
        s.attempts += total;
        s.correct += Math.max(0, Math.min(total, correct));
      }
    }
  }

  const describe = (tag) => {
    const t = taxonomy[tag] || {};
    return {
      tag,
      label: t.label || tag,
      labelEs: t.labelEs || t.label || tag,
      watchFor: t.watchFor || "",
    };
  };

  const groups = {
    group1: { key: "group1", students: [], link: variantLink(lessonId, variants, "group1") },
    group2: { key: "group2", students: [], link: variantLink(lessonId, variants, "group2") },
    catchup: { key: "catchup", students: [], link: variantLink(lessonId, variants, "catchup") },
  };
  // A lesson with no catch-up variant still needs somewhere to send the
  // students who most need it: Group 1 is the most supported variant.
  if (!groups.catchup.link) groups.catchup.fallback = groups.group1.link;
  const wholeGroup = [];

  for (const [name, s] of [...students].sort((a, b) => a[0].localeCompare(b[0]))) {
    let top = null;
    for (const [tag, v] of [...s.tags].sort((a, b) => (a[0] < b[0] ? -1 : 1))) {
      if (!top || v.count > top.count || (v.count === top.count && v.last > top.last))
        top = { tag, ...v };
    }
    const accuracy = s.attempts ? s.correct / s.attempts : null;
    const graded = s.attempts >= MIN_ATTEMPTS;
    const row = {
      student: name,
      accuracy,
      attempts: s.attempts,
      misconception: top ? { ...describe(top.tag), hits: top.count } : null,
    };
    if ((top && top.count >= CATCHUP_REPEATS) || (graded && accuracy < CATCHUP_ACCURACY)) {
      row.reason = top && top.count >= CATCHUP_REPEATS ? "repeated" : "low-accuracy";
      groups.catchup.students.push(row);
    } else if (top) {
      row.reason = "misconception";
      groups.group1.students.push(row);
    } else if (graded && accuracy < GROUP2_ACCURACY) {
      row.reason = "partial";
      groups.group2.students.push(row);
    } else {
      wholeGroup.push(row);
    }
  }

  /** The misconception driving each group: the most common among its members. */
  for (const g of Object.values(groups)) {
    const tally = new Map();
    for (const r of g.students) {
      if (r.misconception) tally.set(r.misconception.tag, (tally.get(r.misconception.tag) || 0) + 1);
    }
    const ranked = [...tally].sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : 1));
    g.drivers = ranked.map(([tag, n]) => ({ ...describe(tag), students: n }));
  }

  return {
    lessonId,
    window: { start, end: now, days: windowDays, section: section || null },
    groups,
    wholeGroup,
    stats: {
      studentsSeen: students.size,
      pulled: groups.group1.students.length + groups.group2.students.length + groups.catchup.students.length,
    },
  };
}
