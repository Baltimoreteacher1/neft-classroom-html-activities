/**
 * Compose small groups from what students actually got wrong.
 *
 * The pedagogical claim this encodes: group by the SPECIFIC ERROR, not by a
 * score band. Ability grouping ("low / middle / high") is the thing everyone
 * defaults to and it tends to become permanent — a student sorted into the low
 * group in October is still there in April. A group defined by "these six
 * students all flipped the ratio" is targeted, is temporary by construction,
 * and dissolves the moment that error clears. The measurement half below is
 * what makes "dissolves" real rather than aspirational.
 *
 * Deliberately PURE and dependency-free: no DOM, no network, no imports. The
 * taxonomy arrives as data (data/misconception-taxonomy.json) and the variant
 * index as data (data/small-group-variants.json), so this same file runs
 * unchanged in `npm test` under Node and in the browser page.
 *
 * Input events are the rows /api/progress/telemetry already returns:
 *   { studentName, section, lessonSlug, standard, type, props: { tag }, at }
 */

/** A group of one is a check-in, not a group — but it must not vanish. */
export const DEFAULT_MIN_GROUP = 2;
/** Past ~6 the teacher is running a class, not a small group. */
export const DEFAULT_MAX_GROUP = 6;
export const DEFAULT_WINDOW_DAYS = 7;

const MISCONCEPTION_EVENT = "misconception";

/** Parse a timestamp defensively; unparseable → null (row is skipped, not crashed). */
function toTime(value) {
  if (value == null) return null;
  const ms = typeof value === "number" ? value : Date.parse(String(value));
  return Number.isFinite(ms) ? ms : null;
}

/** The tag can arrive under several keys depending on which path recorded it. */
function tagOf(event) {
  const p = event?.props || {};
  const raw = p.tag || p.misconceptionTag || p.misconception || event?.tag || "";
  return typeof raw === "string" ? raw.trim() : "";
}

function nameOf(event) {
  const raw = event?.studentName ?? event?.student ?? "";
  return typeof raw === "string" ? raw.trim() : "";
}

/** Base lesson id ("3-2") from a slug that may already carry a variant suffix. */
export function baseLessonOf(slug) {
  const m = String(slug || "").match(/^(\d{1,2}-\d{1,2})\b/);
  return m ? m[1] : "";
}

/**
 * Split a roster into subgroups no larger than `max`, balanced rather than
 * greedy. Nine students with max 6 become 5+4, never 6+3 — a group of three
 * next to a group of six is a worse hour for everyone in the group of six.
 */
export function balancedChunks(items, max) {
  const list = [...items];
  if (list.length <= max) return [list];
  const parts = Math.ceil(list.length / max);
  const size = Math.floor(list.length / parts);
  let extra = list.length % parts;
  const out = [];
  let i = 0;
  for (let p = 0; p < parts; p++) {
    const take = size + (extra > 0 ? 1 : 0);
    if (extra > 0) extra -= 1;
    out.push(list.slice(i, i + take));
    i += take;
  }
  return out;
}

/**
 * Pick the entry with the highest count; ties broken by the most RECENT hit,
 * then by name so the result is never order-dependent.
 * @param {Map<string, {count: number, last: number}>} tally
 */
function dominant(tally) {
  let best = null;
  for (const [key, v] of [...tally.entries()].sort((a, b) => (a[0] < b[0] ? -1 : 1))) {
    if (
      !best ||
      v.count > best.v.count ||
      (v.count === best.v.count && v.last > best.v.last)
    ) {
      best = { key, v };
    }
  }
  return best;
}

/**
 * Build the grouping plan.
 *
 * @param {Array<object>} events - telemetry rows (all types; filtered here)
 * @param {object} [opts]
 * @param {number} [opts.now] - epoch ms "now" (injected so tests are deterministic)
 * @param {number} [opts.windowDays]
 * @param {string} [opts.section] - restrict to one class period ("" = all)
 * @param {number} [opts.minGroup]
 * @param {number} [opts.maxGroup]
 * @param {object} [opts.taxonomy] - id → { label, labelEs, watchFor, student, studentEs }
 * @param {object} [opts.variants] - base → { title, variants: string[] }
 */
export function buildPlan(events, opts = {}) {
  const {
    now = Date.now(),
    windowDays = DEFAULT_WINDOW_DAYS,
    section = "",
    minGroup = DEFAULT_MIN_GROUP,
    maxGroup = DEFAULT_MAX_GROUP,
    taxonomy = {},
    variants = {},
  } = opts;

  const spanMs = Math.max(1, windowDays) * 86400000;
  const windowStart = now - spanMs;
  const priorStart = windowStart - spanMs;

  const rows = Array.isArray(events) ? events : [];
  const inSection = (e) => !section || (e?.section || "") === section;

  // Everyone we have ANY signal from in the window — the denominator for
  // "on track", and the reason this takes all event types rather than only
  // misconceptions.
  const seen = new Set();
  // student → tag → { count, last, lessons: Map<base, count> }
  const byStudent = new Map();
  // Class-wide tag counts, current window and the one immediately before it.
  const tagNow = new Map();
  const tagPrior = new Map();

  for (const e of rows) {
    if (!inSection(e)) continue;
    const at = toTime(e?.at);
    if (at == null) continue;

    const name = nameOf(e);
    if (at >= windowStart && at <= now && name) seen.add(name);

    if (e?.type !== MISCONCEPTION_EVENT) continue;
    const tag = tagOf(e);
    if (!tag) continue;

    if (at >= priorStart && at < windowStart) {
      tagPrior.set(tag, (tagPrior.get(tag) || 0) + 1);
      continue;
    }
    if (at < windowStart || at > now) continue;
    tagNow.set(tag, (tagNow.get(tag) || 0) + 1);

    // An event with no student name cannot be grouped — it still counts toward
    // the class-wide trend above, which is exactly the split the privacy model
    // already draws elsewhere in this repo.
    if (!name) continue;
    if (!byStudent.has(name)) byStudent.set(name, new Map());
    const tags = byStudent.get(name);
    if (!tags.has(tag)) tags.set(tag, { count: 0, last: 0, lessons: new Map() });
    const slot = tags.get(tag);
    slot.count += 1;
    slot.last = Math.max(slot.last, at);
    const base = baseLessonOf(e?.lessonSlug);
    if (base) slot.lessons.set(base, (slot.lessons.get(base) || 0) + 1);
  }

  // Each student joins the group for the error they hit MOST. A student cannot
  // sit in two groups at once, so this has to resolve to exactly one.
  const clusters = new Map(); // tag → [{ student, hits, lessons }]
  for (const [student, tags] of byStudent) {
    const top = dominant(tags);
    if (!top) continue;
    if (!clusters.has(top.key)) clusters.set(top.key, []);
    clusters.get(top.key).push({
      student,
      hits: top.v.count,
      lessons: top.v.lessons,
      otherTags: tags.size - 1,
    });
  }

  const describe = (tag) => {
    const t = taxonomy[tag] || {};
    return {
      tag,
      // An unknown tag still groups — it just shows its raw id rather than
      // being silently dropped. A new misconception must not become invisible
      // because the taxonomy has not caught up.
      label: t.label || tag,
      labelEs: t.labelEs || t.label || tag,
      watchFor: t.watchFor || "",
      student: t.student || "",
      studentEs: t.studentEs || t.student || "",
      known: Boolean(taxonomy[tag]),
    };
  };

  const trendFor = (tag) => {
    const current = tagNow.get(tag) || 0;
    const prior = tagPrior.get(tag) || 0;
    let direction = "holding";
    if (!prior) direction = "new";
    else if (current < prior) direction = "clearing";
    else if (current > prior) direction = "growing";
    return { current, prior, direction };
  };

  /** Which lesson this group's error keeps happening on. */
  const lessonFor = (members) => {
    const tally = new Map();
    for (const m of members) {
      for (const [base, n] of m.lessons) {
        if (!tally.has(base)) tally.set(base, { count: 0, last: 0 });
        tally.get(base).count += n;
      }
    }
    const top = dominant(tally);
    return top ? top.key : "";
  };

  const groups = [];
  const soloCheckIns = [];

  for (const [tag, membersRaw] of clusters) {
    const members = [...membersRaw].sort((a, b) =>
      a.student.localeCompare(b.student, "en", { sensitivity: "base" }),
    );
    const info = describe(tag);
    const trend = trendFor(tag);
    const base = lessonFor(members);
    const baseInfo = variants[base] || null;

    if (members.length < minGroup) {
      for (const m of members) {
        soloCheckIns.push({
          ...info,
          student: m.student,
          hits: m.hits,
          trend,
          lesson: resolveLesson(base, baseInfo, 0),
        });
      }
      continue;
    }

    const chunks = balancedChunks(members, maxGroup);
    chunks.forEach((chunk, i) => {
      groups.push({
        ...info,
        trend,
        // Parallel chunks get parallel variants — that is exactly what
        // group1/group2 exist for, so two simultaneous groups are not handed
        // the identical worksheet.
        lesson: resolveLesson(base, baseInfo, i),
        part: chunks.length > 1 ? { index: i + 1, of: chunks.length } : null,
        students: chunk.map((m) => m.student),
        hits: chunk.reduce((n, m) => n + m.hits, 0),
        size: chunk.length,
      });
    });
  }

  // Biggest, most-active group first — that is the one worth the teacher's
  // first twenty minutes.
  groups.sort((a, b) => b.size - a.size || b.hits - a.hits || a.tag.localeCompare(b.tag));
  soloCheckIns.sort((a, b) => b.hits - a.hits || a.student.localeCompare(b.student));

  const grouped = new Set([
    ...groups.flatMap((g) => g.students),
    ...soloCheckIns.map((s) => s.student),
  ]);
  const onTrack = [...seen].filter((n) => !grouped.has(n)).sort((a, b) => a.localeCompare(b));

  return {
    window: { start: windowStart, end: now, days: windowDays, section: section || null },
    groups,
    soloCheckIns,
    onTrack,
    stats: {
      studentsSeen: seen.size,
      studentsGrouped: grouped.size,
      groups: groups.length,
      distinctErrors: clusters.size,
      totalMisses: [...tagNow.values()].reduce((a, b) => a + b, 0),
    },
  };
}

/**
 * Turn a base lesson id into a runnable small-group link.
 *
 * Returns null when the base has no variants rather than guessing a URL — the
 * naming convention is regular enough to construct, which is precisely the
 * trap: not every base has a catch-up, and a 404 in front of a class is worse
 * than no link at all.
 */
export function resolveLesson(base, baseInfo, index = 0) {
  if (!base || !baseInfo || !baseInfo.variants?.length) return null;
  const suffix = baseInfo.variants[index % baseInfo.variants.length];
  return {
    base,
    title: baseInfo.title || base,
    variant: suffix,
    id: `${base}-${suffix}`,
    url: `/lessons/${base}-${suffix}/`,
  };
}
