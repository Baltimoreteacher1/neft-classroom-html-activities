// Class-level, anonymous summary of pasted WIDA practice evidence. PURE: no DOM, no storage.
// Every statement carries the number of attempts behind it and is held back until MIN_ATTEMPTS attempts support it.
// Objective items are reported as instructional indicators (counts of correct parts), never as scores or levels.
import { DOMAINS, TIER_IDS } from "../../data/taxonomy.js";
import {
  MIN_ATTEMPTS,
  evidenceStatement,
  signalFor,
  summarizeEvidence,
} from "../../core/wida-path.js";

const STRUCTURAL = /^(domain|mode|type|support):/;
const UNSCORED = "unscored";

const bump = (map, key, by = 1) => map.set(key, (map.get(key) || 0) + by);
const sorted = (map) => [...map].sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : 1));

/**
 * aggregate(attempts, { domainOf }) ->
 *   { total, tiers:{ee,dev,exp,br}, captions, domains:[...], collections:[...], tags:[[tag,n]] }
 * `attempts` are decoded evidence attempts (core/evidence.js). Attempts from other engines are ignored.
 */
export function aggregate(attempts = [], { domainOf } = {}) {
  const wida = attempts.filter((a) => a?.eng === "wida-studio");
  const summary = summarizeEvidence(wida, { domainOf });
  const tiers = Object.fromEntries(TIER_IDS.map((t) => [t, 0]));
  const tags = new Map();
  const byAid = new Map();
  let captions = 0;

  for (const att of wida) {
    if (att.tier in tiers) tiers[att.tier] += 1;
    const c = byAid.get(att.aid) || { aid: att.aid, attempts: 0, tasks: new Map() };
    c.attempts += 1;
    byAid.set(att.aid, c);
    let usedCaptions = false;
    for (const it of att.items || []) {
      const t = c.tasks.get(it.id) || {
        id: it.id,
        n: 0,
        scored: 0,
        correct: 0,
        firstTry: 0,
        hints: 0,
        tags: new Map(),
      };
      t.n += 1;
      t.hints += Number(it.hints) || 0;
      const itemTags = it.tags || [];
      if (itemTags.includes("support:captions")) usedCaptions = true;
      if (!itemTags.includes(UNSCORED)) {
        t.scored += 1;
        if (it.ok) {
          t.correct += 1;
          if (it.tries <= 1) t.firstTry += 1;
        }
      }
      for (const tag of itemTags) {
        if (STRUCTURAL.test(tag) || tag === UNSCORED) continue;
        bump(t.tags, tag);
        bump(tags, tag);
      }
      c.tasks.set(it.id, t);
    }
    if (usedCaptions) captions += 1;
  }

  const domains = DOMAINS.map((d) => {
    const s = summary.domains[d];
    return {
      domain: d,
      attempts: s.attempts,
      signal: signalFor(s),
      enough: s.attempts >= MIN_ATTEMPTS,
      statement: evidenceStatement(d, s),
    };
  });

  const collections = [...byAid.values()]
    .map((c) => ({
      aid: c.aid,
      domain: domainOf?.(c.aid) || null,
      attempts: c.attempts,
      enough: c.attempts >= MIN_ATTEMPTS,
      tasks: [...c.tasks.values()].map((t) => ({ ...t, tags: sorted(t.tags) })),
    }))
    .sort((a, b) => b.attempts - a.attempts || (a.aid < b.aid ? -1 : 1));

  return {
    total: wida.length,
    ignored: attempts.length - wida.length,
    tiers,
    captions,
    domains,
    collections,
    tags: sorted(tags),
  };
}

/** Plain next-step suggestion for a task row, or "" when the evidence is too thin to say anything. */
export function taskNote(t) {
  if (t.n < MIN_ATTEMPTS) return "";
  if (t.scored && t.correct / t.scored < 0.6)
    return "Many students missed parts of this task. Replay the audio or text together and rehearse the frames aloud.";
  if (t.hints / t.n >= 1.5)
    return "Students asked for many hints here. Pre-teach the key words before the next try.";
  if (t.tags.length)
    return `The most common slip was tagged "${t.tags[0][0]}". Name it with the class and show one model.`;
  return "";
}
