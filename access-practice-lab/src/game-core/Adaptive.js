// Adaptive.js — a small, explainable question selector. It adapts to three things the learner or teacher
// controls or shows, and says why it chose each prompt:
//   1. GRADE   — the content band (K, 1, 2-3, 3-5, 6-8) and, inside 6-8, the grade focus (6, 7 or 8).
//   2. LEVEL   — the WIDA practice level (1-6) picked as a practice target. It sets the starting difficulty and
//                how much help is on offer. It never lowers the thinking an item asks for.
//   3. ABILITY — evidence from this and earlier sessions: independent (first-try, no scaffold) successes move
//                the target up and fade scaffolds; misses and revealed answers move it down and bring a
//                transfer item back a few questions later. Reaction time is never read.
// Informal practice evidence only: nothing here estimates an official ACCESS score.
import { clampLevel, levelProfile } from "./WidaLevels.js";

export const SHIFT_MIN = -1;
export const SHIFT_MAX = 2;
const RECENT = 12;
const TRANSFER_AFTER = 2;

export const emptyAdaptive = () => ({
  v: 1,
  shift: 0,
  families: {},
  transfer: [],
  recent: [],
  seen: 0,
  domains: {},
});

export function cleanAdaptive(raw) {
  const out = emptyAdaptive();
  if (!raw || typeof raw !== "object") return out;
  out.shift = Math.min(SHIFT_MAX, Math.max(SHIFT_MIN, Number(raw.shift) || 0));
  for (const [k, f] of Object.entries(
    raw.families && typeof raw.families === "object" ? raw.families : {},
  )) {
    out.families[k] = {
      indep: +f.indep || 0,
      run: +f.run || 0,
      scaffolded: +f.scaffolded || 0,
      revealed: +f.revealed || 0,
      total: +f.total || 0,
    };
  }
  out.transfer = Array.isArray(raw.transfer)
    ? raw.transfer.filter((t) => t && typeof t.family === "string").slice(-6)
    : [];
  out.recent = Array.isArray(raw.recent)
    ? raw.recent.filter((x) => typeof x === "string").slice(-RECENT)
    : [];
  out.seen = +raw.seen || 0;
  for (const [d, n] of Object.entries(
    raw.domains && typeof raw.domains === "object" ? raw.domains : {},
  ))
    out.domains[d] = +n || 0;
  return out;
}

/** What to ask for: the grade band, grade focus and WIDA practice level, validated. */
export function playProfile({ band = "6-8", gradeFocus = "", level = 3 } = {}) {
  return Object.freeze({
    band,
    gradeFocus:
      band === "6-8" && ["6", "7", "8"].includes(String(gradeFocus)) ? String(gradeFocus) : "",
    level: clampLevel(level),
  });
}

/** The practice level the next prompt aims at: the chosen level moved by what the learner has shown. */
export const targetLevel = (profile, st) => Math.min(6, Math.max(1, profile.level + st.shift));

/**
 * Record one finished prompt. `outcome`: "independent" (first try, no scaffold), "revised" (right on the second
 * try), "scaffolded" (right after opening help) or "revealed" (answer shown). Returns the next state.
 */
export function record(st, prompt, outcome, { level = 3 } = {}) {
  const fam = prompt.analyticsMetadata?.skillFamily || "language-use";
  const f = { ...(st.families[fam] || { indep: 0, run: 0, scaffolded: 0, revealed: 0, total: 0 }) };
  f.total += 1;
  let shift = st.shift;
  const transfer = [...st.transfer];
  if (outcome === "independent") {
    f.indep += 1;
    f.run += 1;
    if (f.run >= 2) shift = Math.min(SHIFT_MAX, shift + 0.5);
  } else {
    f.run = 0;
    if (outcome === "scaffolded" || outcome === "revised") f.scaffolded += 1;
    if (outcome === "revealed") f.revealed += 1;
    shift = Math.max(SHIFT_MIN, shift - (outcome === "revealed" ? 0.5 : 0.25));
    // Related transfer: the same skill family again a couple of questions later, so a repeat guess is not mastery.
    if (outcome !== "scaffolded" || f.scaffolded > f.indep)
      transfer.push({ family: fam, dueAt: st.seen + 1 + TRANSFER_AFTER, from: prompt.id });
  }
  const domains = { ...st.domains, [prompt.domain]: (st.domains[prompt.domain] || 0) + 1 };
  const recent = [...st.recent, prompt.id].slice(-RECENT);
  return {
    ...st,
    shift,
    families: { ...st.families, [fam]: f },
    transfer: transfer.slice(-6),
    recent,
    seen: st.seen + 1,
    domains,
  };
}

/** True when a family has run independent long enough that its scaffolds fade (one fewer layer, never the recovery hint). */
export const fades = (st, family) => (st.families[family]?.run || 0) >= 3;
export function layersAllowed(st, prompt, level) {
  const base = Math.min(prompt.scaffoldLevels.length, levelProfile(level).hintLayers);
  const fam = prompt.analyticsMetadata?.skillFamily;
  return fades(st, fam) ? Math.max(1, base - 1) : base;
}

const gradeFits = (p, profile) =>
  !profile.gradeFocus || !p.grades.length || p.grades.includes(profile.gradeFocus);

const WHY = {
  start: {
    en: "A good place to start at your practice level.",
    es: "Un buen lugar para empezar en tu nivel de práctica.",
  },
  up: {
    en: "You have been working on your own, so this one asks for a little more.",
    es: "Has trabajado por tu cuenta, así que esta pide un poco más.",
  },
  down: {
    en: "A little more support on this skill, then you try again.",
    es: "Un poco más de apoyo con esta destreza y luego lo intentas otra vez.",
  },
  transfer: {
    en: "Same skill, new words: this shows you can use it on your own.",
    es: "La misma destreza con palabras nuevas: así se ve que puedes usarla por tu cuenta.",
  },
  balance: {
    en: "A different language skill to keep practice balanced.",
    es: "Otra destreza del lenguaje para equilibrar la práctica.",
  },
};

/**
 * Choose the next prompt. Deterministic for a given `rng` (a seeded function returning [0,1)).
 * Returns { prompt, reason: {en, es}, kind } or null when the pool has nothing left.
 */
export function pickNext(
  pool,
  st,
  { profile, rng = Math.random, domains, formats, exclude = [] } = {},
) {
  const target = targetLevel(profile, st);
  const skip = new Set([...st.recent, ...exclude]);
  const allowed = (p) =>
    (!domains || domains.includes(p.domain)) && (!formats || formats.includes(p.format));
  const base = pool.filter(allowed);
  if (!base.length) return null;

  // 1. a transfer item that is due: same skill family, a different prompt
  const due = st.transfer.find((t) => st.seen >= t.dueAt);
  if (due) {
    const cands = base.filter(
      (p) =>
        p.analyticsMetadata?.skillFamily === due.family &&
        p.id !== due.from &&
        !skip.has(p.id) &&
        gradeFits(p, profile),
    );
    if (cands.length) {
      cands.sort(
        (a, b) =>
          Math.abs(a.proficiencyLevel - profile.level) -
          Math.abs(b.proficiencyLevel - profile.level),
      );
      return {
        prompt: cands[Math.floor(rng() * Math.min(3, cands.length))],
        reason: WHY.transfer,
        kind: "transfer",
        clearTransfer: due,
      };
    }
  }

  const total = Object.values(st.domains).reduce((n, x) => n + x, 0) || 1;
  let fresh = base.filter((p) => !skip.has(p.id) && gradeFits(p, profile));
  if (fresh.length < 6) fresh = base.filter((p) => !skip.has(p.id)); // a grade focus prefers, it never starves
  if (!fresh.length) fresh = base;
  const scored = fresh.map((p) => {
    const dist = Math.abs(p.proficiencyLevel - target);
    const fam = st.families[p.analyticsMetadata?.skillFamily];
    const need = fam && fam.run === 0 && fam.total > 0 ? 1.5 : 0;
    const balance = 1 - (st.domains[p.domain] || 0) / total;
    return { p, score: -dist * 2 + need + balance * 0.6 + rng() * 0.5 };
  });
  scored.sort((a, b) => b.score - a.score);
  const choice = scored[0].p;
  const kind =
    st.seen === 0
      ? "start"
      : st.shift >= 0.5 && choice.proficiencyLevel > profile.level
        ? "up"
        : st.shift <= -0.5
          ? "down"
          : "balance";
  return {
    prompt: choice,
    reason: WHY[kind === "balance" && st.seen === 0 ? "start" : kind],
    kind,
  };
}

/** Remove a transfer entry once it has been served. */
export const clearTransfer = (st, entry) =>
  entry ? { ...st, transfer: st.transfer.filter((t) => t !== entry) } : st;

/** A learner-facing sentence about what the practice is doing now. Observed practice, not a score. */
export function describe(st, profile) {
  const target = targetLevel(profile, st);
  const up = target > profile.level;
  const down = target < profile.level;
  return {
    en: up
      ? "Practice is stretching because you have been working on your own."
      : down
        ? "Practice is giving you more support on skills you are still building."
        : "Practice matches the level you chose.",
    es: up
      ? "La práctica se amplía porque has trabajado por tu cuenta."
      : down
        ? "La práctica te da más apoyo en las destrezas que aún construyes."
        : "La práctica coincide con el nivel que elegiste.",
  };
}
