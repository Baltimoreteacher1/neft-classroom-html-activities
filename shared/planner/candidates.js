// Candidate pool for "My Week": ESOL pack week sections + Studio activities + lessons, each with minutes,
// arc position, standards and at most one dependency. Pure over plain data (no loaders, no fetch).
import {
  ACTIVITY_DEPENDS_ON,
  PACK_DEPENDS_ON,
  PACK_DOMAIN,
  PACK_SECTION_WEIGHT,
  PACK_TITLES,
  SOURCE_RANK,
} from "./constants.js";

/** Split `total` minutes across keys by weight; whole minutes, sums exactly, ties go to the earlier key. */
export function allocateMinutes(total, keys, weights) {
  const sum = keys.reduce((n, k) => n + weights[k], 0);
  const raw = keys.map((k) => (total * weights[k]) / sum);
  const out = raw.map(Math.floor);
  let left = total - out.reduce((n, v) => n + v, 0);
  const byRemainder = raw
    .map((r, i) => ({ i, frac: r - Math.floor(r) }))
    .sort((a, b) => b.frac - a.frac || a.i - b.i);
  for (const { i } of byRemainder) {
    if (left <= 0) break;
    out[i] += 1;
    left -= 1;
  }
  return out;
}

const arcOf = (index, count) => (count > 1 ? index / (count - 1) : 0);

function packCandidates(pack) {
  const out = [];
  const weeks = pack?.week_plan || [];
  for (const day of weeks) {
    const mins = allocateMinutes(day.minutes, day.sections, PACK_SECTION_WEIGHT);
    day.sections.forEach((section, i) => {
      out.push({
        id: `pack-${section}`,
        source: "pack",
        section,
        title: PACK_TITLES[section] || section,
        domain: PACK_DOMAIN[section] || "Reading",
        baseMinutes: mins[i],
        standards: [],
        dependsOn: null,
      });
    });
  }
  const present = new Set(out.map((c) => c.section));
  for (const c of out) {
    const parent = PACK_DEPENDS_ON[c.section];
    c.dependsOn = parent && present.has(parent) ? `pack-${parent}` : null;
  }
  return out;
}

function studioCandidates(studio) {
  const acts = studio?.activities || [];
  const firstOfKind = new Map();
  acts.forEach((a, i) => {
    if (!firstOfKind.has(a.kind)) firstOfKind.set(a.kind, `s${i + 1}`);
  });
  return acts.map((a, i) => {
    const parentKind = ACTIVITY_DEPENDS_ON[a.kind];
    const parent = parentKind ? firstOfKind.get(parentKind) : null;
    return {
      id: `s${i + 1}`,
      source: "studio",
      kind: a.kind,
      title: a.title,
      domain: a.domain,
      baseMinutes: a.minutes,
      standards: [],
      dependsOn: parent && parent !== `s${i + 1}` ? parent : null,
    };
  });
}

function lessonCandidates(lessons) {
  const seen = new Set();
  const sorted = [...(lessons || [])].sort((a, b) => a.sequence - b.sequence);
  return sorted.map((l, i) => {
    const standards = [...new Set(l.standards || [])];
    const fresh = standards.filter((s) => !seen.has(s));
    for (const s of standards) seen.add(s);
    return {
      id: l.id,
      source: "lesson",
      title: l.title,
      domain: "Lesson",
      baseMinutes: l.teacher_card.minutes,
      standards,
      newStandards: fresh.length,
      dependsOn: i > 0 ? sorted[i - 1].id : null,
    };
  });
}

/**
 * -> candidates sorted in teaching order. Each: { id, source, title, domain, baseMinutes, arc (0..1), standards,
 * newStandards, domainRank, dependsOn (id|null), order }.
 */
export function buildCandidates({ pack, studio, lessons } = {}) {
  const groups = [lessonCandidates(lessons), packCandidates(pack), studioCandidates(studio)];
  const all = [];
  for (const group of groups) {
    group.forEach((c, i) => {
      all.push({ newStandards: 0, ...c, arc: arcOf(i, group.length), index: i });
    });
  }
  // Rank within a domain by arc (lessons are not domain-balanced: they are the spine, not a menu).
  const seenByDomain = new Map();
  for (const c of [...all].sort(
    (a, b) => a.arc - b.arc || SOURCE_RANK[a.source] - SOURCE_RANK[b.source] || a.index - b.index,
  )) {
    if (c.source === "lesson") {
      c.domainRank = 0;
      continue;
    }
    const n = seenByDomain.get(c.domain) || 0;
    c.domainRank = n;
    seenByDomain.set(c.domain, n + 1);
  }
  all.sort(
    (a, b) => a.arc - b.arc || SOURCE_RANK[a.source] - SOURCE_RANK[b.source] || a.index - b.index,
  );
  const ids = new Set(all.map((c) => c.id));
  all.forEach((c, order) => {
    c.order = order;
    if (c.dependsOn && !ids.has(c.dependsOn)) c.dependsOn = null;
    delete c.index;
  });
  return all;
}
