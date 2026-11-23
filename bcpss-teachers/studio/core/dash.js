// Class evidence dashboard logic. Pure functions over anonymous attempt records (core/evidence.js).
// Honesty rules: a statement exists only when at least MIN_N attempts support it, and the n behind it is always returned.
// Nothing here is a WIDA score, a prediction or a placement. Manual assessment entries are stored and shown, never computed on.
import { DOMAINS, TIERS, TIER_IDS } from "../data/taxonomy.js";
import { fadeSuggestion } from "./scaffold.js";

export const MIN_N = 3;
const TIER = Object.fromEntries(TIERS.map((t) => [t.id, t]));

export const humanizeTag = (tag) =>
  String(tag || "")
    .replace(/[-_.]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
const pct = (a, b) => (b ? Math.round((a / b) * 100) : 0);
const plural = (n, one, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

/** Keep well-formed attempts only. Pasted codes are already scrubbed; this guards against damaged storage. */
export function normalizeAttempts(list) {
  return (Array.isArray(list) ? list : [])
    .filter((a) => a && typeof a.aid === "string" && Array.isArray(a.items))
    .map((a) => ({
      aid: a.aid,
      eng: a.eng || "",
      lesson: a.lesson || "",
      tier: TIER_IDS.includes(a.tier) ? a.tier : "dev",
      t: a.t || "",
      reflection: typeof a.reflection === "string" ? a.reflection : "",
      items: a.items
        .filter((i) => i && i.id != null)
        .map((i) => ({
          id: String(i.id),
          tries: Number(i.tries) || 0,
          hints: Number(i.hints) || 0,
          ok: i.ok === true,
          tags: Array.isArray(i.tags) ? i.tags.map(String) : [],
        })),
    }));
}

/** Best-effort item kind from an item id and its tags when the activity data cannot say. */
export function inferKind(id, tags = []) {
  const s = `${id} ${tags.join(" ")}`.toLowerCase();
  if (/vocab|word|term|meaning|definition/.test(s)) return "vocabulary";
  if (/evid|cite|detail|source/.test(s)) return "evidence";
  if (/reason|why|explain|justif|claim|infer|argu/.test(s)) return "reasoning";
  if (/comput|calc|solve|numer|math/.test(s)) return "computation";
  return "other";
}

const missed = (i) => !i.ok;
const needed = (i) => i.hints > 0 || i.tries > 1;
const independentAttempt = (a) =>
  a.items.length >= 3 &&
  a.items.filter((i) => i.ok && i.tries === 1 && !i.hints).length / a.items.length >= 0.8;
const DOMAIN_RE = /listening|speaking|reading|writing/i;

function domainOf(att, resolveDomain) {
  const d =
    resolveDomain?.(att) || (DOMAIN_RE.exec(att.aid) || DOMAIN_RE.exec(att.lesson) || [])[0];
  if (!d) return null;
  return DOMAINS.find((x) => x.toLowerCase() === String(d).toLowerCase()) || null;
}

function tagStats(attempts) {
  const map = new Map();
  for (const a of attempts) {
    const seen = new Set();
    for (const i of a.items) {
      for (const t of i.tags) {
        const r = map.get(t) || { tag: t, label: humanizeTag(t), attempts: 0, items: 0 };
        r.items += 1;
        if (!seen.has(t)) {
          r.attempts += 1;
          seen.add(t);
        }
        map.set(t, r);
      }
    }
  }
  return [...map.values()]
    .map((r) => ({ ...r, enough: r.attempts >= MIN_N }))
    .sort((a, b) => b.attempts - a.attempts || b.items - a.items || a.tag.localeCompare(b.tag));
}

function domainStats(attempts, resolveDomain) {
  const map = new Map(
    DOMAINS.map((d) => [d, { domain: d, n: 0, items: 0, firstTry: 0, hinted: 0 }]),
  );
  for (const a of attempts) {
    if (a.eng !== "wida-studio" && !resolveDomain?.(a) && !DOMAIN_RE.test(a.aid)) continue;
    const d = domainOf(a, resolveDomain);
    if (!d) continue;
    const r = map.get(d);
    r.n += 1;
    for (const i of a.items) {
      r.items += 1;
      if (i.ok && i.tries === 1 && !i.hints) r.firstTry += 1;
      if (i.hints > 0) r.hinted += 1;
    }
  }
  return [...map.values()]
    .filter((r) => r.n > 0)
    .map((r) => ({ ...r, enough: r.n >= MIN_N, autoChecked: r.items > 0 }));
}

function persistentMisses(attempts, title) {
  const map = new Map();
  for (const a of attempts) {
    for (const i of a.items) {
      const k = `${a.aid}\u0000${i.id}`;
      const r = map.get(k) || {
        aid: a.aid,
        id: i.id,
        attempts: 0,
        missed: 0,
        title: title?.(a.aid) || a.aid,
      };
      r.attempts += 1;
      if (missed(i)) r.missed += 1;
      map.set(k, r);
    }
  }
  return [...map.values()]
    .filter((r) => r.attempts >= MIN_N && r.missed >= MIN_N && r.missed / r.attempts >= 0.5)
    .sort((a, b) => b.missed - a.missed || a.aid.localeCompare(b.aid))
    .slice(0, 3);
}

/**
 * summarizeEvidence(attempts, { resolveKind(att,item), resolveDomain(att), resolveTitle(aid) })
 * -> { n, items, byTier, tags, domains, kinds, statements, moves, reflections, fade }
 */
export function summarizeEvidence(raw, { resolveKind, resolveDomain, resolveTitle } = {}) {
  const attempts = normalizeAttempts(raw);
  const n = attempts.length;
  const items = attempts.reduce((s, a) => s + a.items.length, 0);
  const byTier = TIER_IDS.map((t) => ({
    tier: t,
    label: TIER[t].short,
    n: attempts.filter((a) => a.tier === t).length,
  }));
  const statements = [];
  const moves = [];
  const add = (id, text, count, of) => statements.push({ id, text, n: count, of });

  // Hints: many attempts needed a hint before answering.
  const hinted = attempts.filter(
    (a) => a.items.length >= 2 && a.items.filter((i) => i.hints > 0).length / a.items.length >= 0.5,
  );
  if (hinted.length >= MIN_N && hinted.length / n >= 0.5) {
    add(
      "hints",
      `Many attempts needed hints before answering: in ${hinted.length} of ${n} attempts, at least half of the items used a hint.`,
      hinted.length,
      n,
    );
  }

  // Kinds: evidence/reasoning items compared with vocabulary items.
  const kindOf = (a, i) => resolveKind?.(a, i) || inferKind(i.id, i.tags);
  const groups = {
    evr: { attempts: 0, items: 0, missed: 0 },
    vocab: { attempts: 0, items: 0, missed: 0 },
  };
  const kindCount = new Map();
  for (const a of attempts) {
    const seen = new Set();
    for (const i of a.items) {
      const k = kindOf(a, i);
      kindCount.set(k, kindCount.get(k) || { kind: k, items: 0, missed: 0 });
      kindCount.get(k).items += 1;
      if (missed(i)) kindCount.get(k).missed += 1;
      const g = k === "evidence" || k === "reasoning" ? "evr" : k === "vocabulary" ? "vocab" : null;
      if (!g) continue;
      groups[g].items += 1;
      if (missed(i)) groups[g].missed += 1;
      if (!seen.has(g)) {
        seen.add(g);
        groups[g].attempts += 1;
      }
    }
  }
  const { evr, vocab } = groups;
  const kinds = [...kindCount.values()].sort(
    (a, b) => b.items - a.items || a.kind.localeCompare(b.kind),
  );
  if (evr.attempts >= MIN_N && vocab.attempts >= MIN_N) {
    const rEvr = evr.missed / evr.items;
    const rVoc = vocab.missed / vocab.items;
    const detail = `Evidence and reasoning items: ${evr.missed} of ${evr.items} missed in ${plural(evr.attempts, "attempt")}. Vocabulary items: ${vocab.missed} of ${vocab.items} missed in ${plural(vocab.attempts, "attempt")}.`;
    if (rEvr - rVoc >= 0.15)
      add(
        "evr-over-vocab",
        `Evidence and reasoning items were missed more than vocabulary items. ${detail}`,
        Math.min(evr.attempts, vocab.attempts),
        n,
      );
    else if (rVoc - rEvr >= 0.15)
      add(
        "vocab-over-evr",
        `Vocabulary items were missed more than evidence and reasoning items. ${detail}`,
        Math.min(evr.attempts, vocab.attempts),
        n,
      );
  }

  // Independence.
  const indep = attempts.filter(independentAttempt);
  if (indep.length >= MIN_N)
    add(
      "independent",
      `In ${indep.length} of ${n} attempts, nearly every item was answered correctly on the first try without a hint.`,
      indep.length,
      n,
    );

  // Support level used.
  const modal = byTier.reduce((best, t) => (t.n > best.n ? t : best), byTier[0]);
  if (modal.n >= MIN_N)
    add("tier", `${modal.n} of ${n} attempts were done with ${modal.label} supports.`, modal.n, n);

  // Items missed again and again.
  const stuck = persistentMisses(attempts, resolveTitle);
  for (const r of stuck)
    add(
      `stuck-${r.aid}-${r.id}`,
      `Item ${r.id} in "${r.title}" was missed in ${r.missed} of ${r.attempts} attempts.`,
      r.missed,
      r.attempts,
    );

  // Misconception tags.
  const tags = tagStats(attempts);
  for (const t of tags.filter((x) => x.enough).slice(0, 3))
    add(
      `tag-${t.tag}`,
      `The tag "${t.label}" appeared in ${t.attempts} of ${n} attempts.`,
      t.attempts,
      n,
    );

  const domains = domainStats(attempts, resolveDomain);
  const modalTierAttempts = attempts.filter((a) => a.tier === modal.tier);
  const fade = fadeSuggestion(modalTierAttempts, { tier: modal.tier });

  // Next moves: only from statements that exist.
  const has = (id) => statements.some((s) => s.id === id);
  if (stuck[0])
    moves.push({
      id: "preview-stuck",
      label: `Preview "${stuck[0].title}" and look at item ${stuck[0].id}`,
      why: `Missed in ${stuck[0].missed} of ${stuck[0].attempts} attempts.`,
      action: { type: "activity", aid: stuck[0].aid, tier: modal.tier, mode: "preview" },
    });
  if (has("vocab-over-evr"))
    moves.push({
      id: "vocab",
      label: "Practice the key words",
      why: `Vocabulary items were missed more (${vocab.missed} of ${vocab.items}).`,
      action: { type: "nav", hash: "#/vocab" },
    });
  if (has("evr-over-vocab")) {
    const lesson = attempts.find((a) => a.lesson)?.lesson || "";
    moves.push({
      id: "small-group",
      label: "Create a small-group activity on evidence and reasoning",
      why: `Evidence and reasoning items were missed more (${evr.missed} of ${evr.items}).`,
      action: {
        type: "nav",
        hash: `#/create?type=small-group${lesson ? `&lesson=${encodeURIComponent(lesson)}` : ""}`,
      },
    });
  }
  if (has("hints") && TIER_IDS.indexOf(modal.tier) > 0) {
    const more = TIER_IDS[TIER_IDS.indexOf(modal.tier) - 1];
    const aid = modalTierAttempts[0]?.aid;
    if (aid)
      moves.push({
        id: "more-support",
        label: `Preview the same activity with ${TIER[more].short} supports`,
        why: `Hints were used in ${hinted.length} of ${n} attempts.`,
        action: { type: "activity", aid, tier: more, mode: "preview" },
      });
  }
  if (has("independent") && fade.action === "lighten")
    moves.push({
      id: "lighter",
      label: `Consider ${TIER[fade.to].short} supports next`,
      why: fade.text,
      action: { type: "note" },
    });

  return {
    n,
    items,
    byTier,
    tags,
    domains,
    kinds,
    statements,
    moves,
    fade,
    reflections: attempts.filter((a) => a.reflection.trim()).map((a) => a.reflection.trim()),
  };
}

// Manual assessment entries (ACCESS, MODEL or other). Stored and displayed; never combined, trended or used to place a student.
export const ASSESS_TYPES = [
  { id: "ACCESS", label: "ACCESS for ELLs" },
  { id: "MODEL", label: "WIDA MODEL" },
  { id: "other", label: "Other measure" },
];
export const ASSESS_DOMAINS = [...DOMAINS, "Oral Language", "Literacy", "Comprehension", "Overall"];
export const VALUE_KINDS = [
  { id: "level", label: "Proficiency level (for example 3.4)" },
  { id: "scale", label: "Scale score" },
  { id: "other", label: "Other" },
];
export const ASSESS_CAUTION =
  "These numbers are what you typed from a report. Scale scores and proficiency levels are different things, and results from different years, grade-level forms or tests are not directly comparable. This page does not draw trends, predict results or place students. Enter group or class summaries, never student names or ids.";

const str = (v, max) => (typeof v === "string" ? v.trim().slice(0, max) : "");

/** validateAssessment(raw, { nowYear }) -> { ok, errors:{field:msg}, entry } */
export function validateAssessment(raw = {}, { nowYear = new Date().getFullYear() } = {}) {
  const errors = {};
  const type = ASSESS_TYPES.some((t) => t.id === raw.type) ? raw.type : "";
  if (!type) errors.type = "Choose ACCESS, MODEL or other.";
  const year = Number(raw.year);
  if (!Number.isInteger(year) || year < 2000 || year > nowYear + 1)
    errors.year = `Enter the assessment year, from 2000 to ${nowYear + 1}.`;
  const domain = ASSESS_DOMAINS.includes(raw.domain) ? raw.domain : "";
  if (!domain) errors.domain = "Choose a domain or composite.";
  const valueKind = VALUE_KINDS.some((v) => v.id === raw.valueKind) ? raw.valueKind : "";
  if (!valueKind) errors.valueKind = "Say what kind of number this is.";
  const value = str(raw.value, 12);
  if (!/^\d{1,3}(\.\d{1,2})?$/.test(value)) errors.value = "Enter a number such as 3.4 or 412.";
  else if (valueKind === "level" && Number(value) > 6.9)
    errors.value = "A proficiency level is between 1.0 and 6.9. Check your report.";
  const source = str(raw.source, 120);
  if (!source) errors.source = "Say where the number came from, such as the name of the report.";
  const note = str(raw.note, 120);
  const entry = { id: str(raw.id, 40), type, year, domain, valueKind, value, source, note };
  return { ok: Object.keys(errors).length === 0, errors, entry };
}

/** Group by year (newest first), then type and domain. No differences are computed between years. */
export function groupAssessments(entries) {
  const byYear = new Map();
  for (const e of entries || []) {
    if (!byYear.has(e.year)) byYear.set(e.year, []);
    byYear.get(e.year).push(e);
  }
  const order = (d) => ASSESS_DOMAINS.indexOf(d);
  return [...byYear.entries()]
    .sort((a, b) => b[0] - a[0])
    .map(([year, rows]) => ({
      year,
      rows: rows.sort(
        (a, b) =>
          a.type.localeCompare(b.type) ||
          order(a.domain) - order(b.domain) ||
          a.value.localeCompare(b.value),
      ),
    }));
}
