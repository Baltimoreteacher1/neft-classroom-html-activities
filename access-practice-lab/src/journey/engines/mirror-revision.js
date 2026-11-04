// Growth Mirror revision rules: what changed between two drafts, whether the revision is still the learner's own, and
// the reasons offered for "why does this help". Pure; never writes the revision.
import { compareDrafts } from "../../lang/analyze.js";
import { diffWords, isStop, stem, tokenize } from "../../lang/text.js";
import { GENERIC_WHYS, NOTICES, WHY_FOLLOWUP } from "./mirror-copy.js";
import { analysisOpts, clipText, copyOf } from "./mirror-core.js";

// ── Revision ─────────────────────────────────────────────────────────────────────

/** diffWords with end-of-clause punctuation split off, so "small." and "small because" differ by what was added, not by a dot. */
export function diffTokens(before, after) {
  const split = (t) => String(t || "").replace(/([.,;:!?])(?=\s|$)/g, " $1");
  return diffWords(split(before), split(after)).map((d) => ({ ...d, text: d.text.replace(/ ([.,;:!?])(?=\s|$)/g, "$1") }));
}

const tokensOf = (t) => tokenize(t).map((x) => x.lower);
const contentStems = (t) => [
  ...new Set(
    tokenize(t)
      .filter((x) => !isStop(x.lower))
      .map((x) => stem(x.lower)),
  ),
];

function targetFixedIn(target, bA, aA) {
  if (!target) return false;
  if (target.kind === "cohesion" || target.id === "cohesion")
    return (
      aA.cohesion.variety > bA.cohesion.variety ||
      aA.cohesion.unlinked.length < bA.cohesion.unlinked.length
    );
  if (target.kind === "precision" || target.id === "precision")
    return aA.word.vague.length < bA.word.vague.length;
  return Boolean(aA.purpose.moves.find((m) => m.id === target.id)?.present);
}

const moveRows = (from, to, present) =>
  to.purpose.moves.filter(
    (m) =>
      m.required &&
      m.present === present &&
      from.purpose.moves.find((n) => n.id === m.id && n.present !== present),
  );

const NOT_FOUND = { from: "not found", fromEs: "no se encontró", to: "found", toEs: "se encontró" };

function newSpan(items, otherText) {
  const hit = items.find(
    (x) => x?.text && !String(otherText).toLowerCase().includes(String(x.text).toLowerCase()),
  );
  return hit ? clipText(hit.text) : "";
}

/** Did anything change, and what can the learner point at? `opts`: { target, keyUse, ...analysisOpts }. Never writes text. */
export function evaluateRevision(before, after, opts = {}) {
  const b = String(before || "");
  const a = String(after || "");
  const target =
    opts.target && typeof opts.target === "object"
      ? opts.target
      : opts.target
        ? { id: opts.target, kind: "move" }
        : null;
  const bt = tokensOf(b);
  const at = tokensOf(a);
  const same = bt.length === at.length && bt.every((x, i) => x === at[i]);
  if (same) {
    const kind = b === a ? "unchanged" : "trivial";
    return {
      changed: false,
      trivial: kind === "trivial",
      targetFixed: false,
      gained: [],
      lost: [],
      observable: [],
      diff: [],
      added: [],
      removed: [],
      errorsFixed: [],
      errorsNew: [],
      noChange: { kind, message: NOTICES[kind] },
    };
  }
  const aopts = {
    ...analysisOpts({}, opts.keyUse || "Explain"),
    ...opts.analysis,
    keyUse: opts.keyUse || "Explain",
  };
  delete aopts.target;
  const cmp = compareDrafts(b, a, aopts);
  const bA = cmp.before;
  const aA = cmp.after;
  const diff = diffTokens(b, a);
  const observable = [];
  const gained = moveRows(bA, aA, true).map((m) => ({ id: m.id, label: m.label }));
  const lost = moveRows(aA, bA, true).map((m) => ({ id: m.id, label: m.label }));
  for (const g of gained) {
    const c = copyOf(g.id);
    observable.push({
      kind: "move",
      id: g.id,
      what: c.label[0],
      whatEs: c.label[1],
      ...NOT_FOUND,
      evidenceSpan: clipText(aA.purpose.moves.find((m) => m.id === g.id).evidence[0]?.text || ""),
      better: true,
    });
  }
  for (const l of lost) {
    const c = copyOf(l.id);
    observable.push({
      kind: "move",
      id: l.id,
      what: c.label[0],
      whatEs: c.label[1],
      from: NOT_FOUND.to,
      fromEs: NOT_FOUND.toEs,
      to: NOT_FOUND.from,
      toEs: NOT_FOUND.fromEs,
      evidenceSpan: clipText(bA.purpose.moves.find((m) => m.id === l.id).evidence[0]?.text || ""),
      better: false,
    });
  }
  const FEATURE_ES = {
    link: "Maneras de conectar ideas",
    cites: "Referencias a la fuente",
    complex: "Oraciones con más de una idea",
    academic: "Palabras precisas del tema",
  };
  const FEATURE_SPAN = {
    link: () => newSpan(aA.cohesion.devices, b),
    cites: () =>
      newSpan(
        [...aA.evidence.termHits, ...aA.evidence.numbersFromSource, ...aA.evidence.attributions],
        b,
      ),
    complex: () =>
      newSpan(
        aA.sentenceStats.shapes.filter((s) => s.complex),
        b,
      ),
    academic: () => newSpan([...aA.word.academic, ...aA.word.domain], b),
  };
  for (const ch of cmp.changes) {
    if (!FEATURE_SPAN[ch.key]) continue; // word count is never evidence
    observable.push({
      kind: "feature",
      id: ch.key,
      what: ch.label,
      whatEs: FEATURE_ES[ch.key],
      from: String(ch.from),
      to: String(ch.to),
      fromEs: String(ch.from),
      toEs: String(ch.to),
      unit: ch.unit,
      evidenceSpan: ch.better ? FEATURE_SPAN[ch.key]() : "",
      better: ch.better,
    });
  }
  for (const id of cmp.errorsFixed) {
    const e = bA.errors.find((x) => x.id === id && x.confidence === "high");
    if (e)
      observable.push({
        kind: "error",
        id,
        what: e.name,
        whatEs: e.name,
        from: `“${clipText(e.text, 40)}”`,
        fromEs: `“${clipText(e.text, 40)}”`,
        to: "not found",
        toEs: "no se encontró",
        evidenceSpan: "",
        better: true,
      });
  }
  for (const id of cmp.errorsNew) {
    const e = aA.errors.find((x) => x.id === id && x.confidence === "high");
    if (e)
      observable.push({
        kind: "error",
        id,
        what: e.name,
        whatEs: e.name,
        from: "not found",
        fromEs: "no se encontró",
        to: `“${clipText(e.text, 40)}”`,
        toEs: `“${clipText(e.text, 40)}”`,
        evidenceSpan: "",
        better: false,
      });
  }
  return {
    changed: true,
    trivial: false,
    noChange: null,
    targetFixed: targetFixedIn(target, bA, aA),
    gained,
    lost,
    brokeOther: lost.length > 0,
    observable,
    diff,
    added: diff.filter((d) => d.op === "add").map((d) => d.text),
    removed: diff.filter((d) => d.op === "del").map((d) => d.text),
    errorsFixed: cmp.errorsFixed,
    errorsNew: cmp.errorsNew,
  };
}

/**
 * Does the revision still carry the learner's own words? A revision that is the model sentence and nothing else gets a
 * gentle prompt once; `prompted` (already asked) always accepts, so this never blocks completion.
 */
export function ownershipCheck(before, after, model = null, prompted = false) {
  const own = contentStems(before);
  const mine = new Set(contentStems(after));
  const keptShare = own.length ? own.filter((s) => mine.has(s)).length / own.length : 1;
  let pasted = false;
  if (model) {
    const m = new Set(contentStems(model));
    const overlap = mine.size ? [...mine].filter((s) => m.has(s)).length / mine.size : 0;
    const ownBeyondModel = own.filter((s) => !m.has(s) && mine.has(s)).length;
    pasted = overlap >= 0.85 && ownBeyondModel === 0;
  }
  const ok = !pasted && keptShare >= 0.5;
  const kind = pasted ? "own-words" : "keep-yours";
  return {
    ok,
    accepted: ok || Boolean(prompted),
    pasted,
    keptShare,
    prompt: ok ? null : { kind, ...NOTICES[kind] },
  };
}

// ── Why it helps ─────────────────────────────────────────────────────────────────

const hash = (s) => {
  let h = 2166136261;
  for (const ch of String(s)) h = Math.imul(h ^ ch.charCodeAt(0), 16777619) >>> 0;
  return h;
};
const seeded = (seed) => {
  let s = hash(seed) || 1;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
};
const shuffled = (list, seed) => {
  const r = seeded(seed);
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

/**
 * Reasons the learner can pick: those that match the target, plus two others, in a fixed shuffled order. Any option is
 * accepted; an option that does not match the target carries a gentle follow-up question instead of a verdict.
 */
export function reasonOptions(whys, target, seed = "") {
  const list = Array.isArray(whys) ? whys : [];
  const matching = list.filter((w) => w.moves?.includes(target.id));
  if (!matching.length && GENERIC_WHYS[target.id]) matching.push(GENERIC_WHYS[target.id]);
  const others = shuffled(
    list.filter((w) => !matching.includes(w)),
    `${target.id}|${seed}|others`,
  ).slice(0, 2);
  const chosen = [...matching, ...others].map((w) => ({
    id: w.id,
    text: w.text,
    matches: matching.includes(w),
    followUp: matching.includes(w) ? null : WHY_FOLLOWUP,
  }));
  return shuffled(chosen, `${target.id}|${seed}|order`);
}

