// Evidence-sensitive error analysis (Enterprise 8). One wrong answer is classified, never over-interpreted:
//   correct | representation | incomplete | misread | calculation | conceptual | uncertain
// A misconception is named only when the answer is exactly what that misconception produces. Two different
// misconceptions matching the same answer is "uncertain", and the engine says so. Accumulated evidence across DISTINCT
// items raises a pattern from "possible" to "likely" to "persistent"; a repaired pattern needs an independent success.
import { parseRational, equivalent } from "./rational.js";
import { matchSignatures } from "./misconception-detectors.js";
import { MISCONCEPTIONS, misconceptionById } from "./misconception-library.js";

const DAY = 86400000;
const dayOf = (t) => new Date(t).toISOString().slice(0, 10);

// ---------------------------------------------------------------- classify one response
export function analyzeResponse({
  skill,
  question,
  answers,
  response,
  simplified = false,
}) {
  const text = String(response ?? "").trim();
  const key = answers?.[0];
  if (!text)
    return {
      category: "incomplete",
      confidence: "high",
      note: {
        en: "No answer was entered.",
        es: "No se escribió una respuesta.",
      },
    };
  const isSymbol = /^[<>=]$/.test(String(key).trim());
  if (isSymbol) {
    if (text === String(key).trim())
      return { category: "correct", confidence: "high" };
    const symbolic = matchSignatures(skill, question, text, answers);
    return symbolic.length
      ? conceptual(symbolic)
      : {
          category: "uncertain",
          confidence: "low",
          note: {
            en: "The comparison is wrong; the reason is not clear from this one answer.",
            es: "La comparación es incorrecta; con esta respuesta no se ve la razón.",
          },
        };
  }
  const r = parseRational(text);
  const c = parseRational(String(key));
  // A key that is not a number (a pattern, a word, a shape name) can only be compared as text; no cause is guessed.
  if (!c) {
    const norm = (v) => String(v).trim().toLowerCase().replace(/\s+/g, " ");
    return norm(text) === norm(key) ? { category: "correct", confidence: "high" } : { category: "uncertain", confidence: "low", note: { en: "The answer is not the expected one; the cause is not clear from this one answer.", es: "La respuesta no es la esperada; con esta respuesta no se ve la causa." } };
  }
  if (!r)
    return {
      category: "misread",
      confidence: "medium",
      note: {
        en: "The answer was not a number, fraction or decimal.",
        es: "La respuesta no era un número, una fracción ni un decimal.",
      },
    };
  if (!c) return { category: "uncertain", confidence: "low" };
  if (r.eq(c)) {
    // Right value; wrong only if the task asked for a particular form.
    if (simplified && !equivalent(text, c, { simplified: true }))
      return {
        category: "representation",
        confidence: "high",
        note: {
          en: "The value is right but the form is not simplified.",
          es: "El valor es correcto pero la forma no está simplificada.",
        },
      };
    return { category: "correct", confidence: "high" };
  }
  const matches = matchSignatures(skill, question, text, answers);
  const distinct = [...new Set(matches.map((m) => m.id))];
  if (distinct.length === 1) return conceptual(matches);
  if (distinct.length > 1)
    return {
      category: "uncertain",
      confidence: "low",
      candidates: distinct,
      note: {
        en: "More than one idea could produce this answer, so no single cause is claimed.",
        es: "Más de una idea puede producir esta respuesta, así que no se afirma una sola causa.",
      },
    };
  // No signature. A tiny whole-number miss is more likely a slip than an idea.
  if (c.isInteger() && r.isInteger() && r.sub(c).abs().lte(2))
    return {
      category: "calculation",
      confidence: "low",
      note: {
        en: "Close to the answer: likely a calculation slip.",
        es: "Cerca de la respuesta: probablemente un descuido al calcular.",
      },
    };
  return {
    category: "uncertain",
    confidence: "low",
    note: {
      en: "The cause is not clear from this one answer.",
      es: "Con esta respuesta no se ve la causa.",
    },
  };
}

function conceptual(matches) {
  const best = matches.find((m) => m.confidence === "high") || matches[0];
  const entry = misconceptionById(best.id);
  // Operation swaps on a plain +/− problem are usually a misread sign before they are an idea: say so.
  const category =
    best.id === "operation-swap"
      ? "misread"
      : best.id === "counting-off-by-one"
        ? "calculation"
        : "conceptual";
  return {
    category,
    id: best.id,
    confidence: best.confidence,
    evidence: best.evidence,
    title: entry?.title,
  };
}

// ---------------------------------------------------------------- evidence over time (per learner)
export const emptyEvidence = () => ({ version: 1, items: {} });

export function recordDiagnosis(
  store,
  analysis,
  { sig, skillKey, now = Date.now() } = {},
) {
  if (
    !analysis.id ||
    !["conceptual", "misread", "calculation"].includes(analysis.category)
  )
    return store;
  const entry = store.items[analysis.id] || {
    count: 0,
    sigs: [],
    days: [],
    skills: [],
    first: now,
    last: now,
    repairedAt: null,
  };
  entry.count += 1;
  if (sig && !entry.sigs.includes(sig))
    entry.sigs = [...entry.sigs, sig].slice(-8);
  const d = dayOf(now);
  if (!entry.days.includes(d)) entry.days = [...entry.days, d].slice(-8);
  if (skillKey && !entry.skills.includes(skillKey))
    entry.skills = [...entry.skills, skillKey].slice(-6);
  entry.last = now;
  store.items[analysis.id] = entry;
  return store;
}

// possible: seen once. likely: two different items. persistent: three or more different items over at least two days.
// repaired: a repair was completed and nothing has been seen since.
export function misconceptionStatus(entry) {
  if (!entry) return null;
  if (entry.repairedAt && entry.last <= entry.repairedAt) return "repaired";
  const items = entry.sigs.length || entry.count;
  if (items >= 3 && entry.days.length >= 2) return "persistent";
  if (items >= 2) return "likely";
  return "possible";
}

export function markRepaired(store, id, now = Date.now()) {
  if (store.items[id]) store.items[id].repairedAt = now;
  return store;
}

// Patterns worth acting on, most serious first. Only likely/persistent are surfaced to a learner or teacher as a pattern.
export function activePatterns(store, { includePossible = false } = {}) {
  const rank = { persistent: 0, likely: 1, possible: 2 };
  return Object.entries(store.items)
    .map(([id, entry]) => ({
      id,
      status: misconceptionStatus(entry),
      entry,
      info: misconceptionById(id),
    }))
    .filter(
      (p) =>
        p.info &&
        p.status &&
        p.status !== "repaired" &&
        (includePossible || p.status !== "possible"),
    )
    .sort(
      (a, b) => rank[a.status] - rank[b.status] || b.entry.last - a.entry.last,
    );
}

export function sanitizeEvidence(value) {
  const out = emptyEvidence();
  if (!value || typeof value !== "object" || value.version !== 1) return out;
  for (const [id, e] of Object.entries(value.items || {})) {
    if (!misconceptionById(id) || !e || typeof e !== "object") continue;
    const count = Math.min(9999, Math.max(0, Math.floor(Number(e.count) || 0)));
    if (!count) continue;
    out.items[id] = {
      count,
      sigs: (Array.isArray(e.sigs) ? e.sigs : [])
        .filter((s) => typeof s === "string" && s.length <= 24)
        .slice(-8),
      days: (Array.isArray(e.days) ? e.days : [])
        .filter((d) => /^\d{4}-\d{2}-\d{2}$/.test(d))
        .slice(-8),
      skills: (Array.isArray(e.skills) ? e.skills : [])
        .filter((k) => /^\d:[\w-]{1,30}$/.test(k))
        .slice(-6),
      first: Number.isFinite(e.first) ? e.first : 0,
      last: Number.isFinite(e.last) ? e.last : 0,
      repairedAt: Number.isFinite(e.repairedAt) ? e.repairedAt : null,
    };
  }
  return out;
}

export const detectableCount = () =>
  MISCONCEPTIONS.filter((m) => m.detect).length;
export { DAY };
