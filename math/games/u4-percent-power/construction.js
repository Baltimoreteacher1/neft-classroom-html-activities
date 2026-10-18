/* Percent Power's exact constructed amount and compatible save-code payload.
 * No expression evaluation, no answer selection, and no state deletion on bad data. */
(() => {
  "use strict";
  function parseAmount(raw) {
    const text = String(raw ?? "").trim().replace(/^\$\s*/, "");
    const number = "[+-]?(?:\\d+(?:\\.\\d*)?|\\.\\d+)";
    const match = text.match(new RegExp(`^(${number})(?:\\s*/\\s*(${number}))?$`));
    if (!match) return null;
    const denominator = match[2] == null ? 1 : Number(match[2]);
    const value = Number(match[1]) / denominator;
    return denominator !== 0 && Number.isFinite(value) ? value : null;
  }
  const counts = ["score", "streak", "bestStreak", "attempts", "correctSubs", "solved", "firstTry", "round", "wrongShade", "wrongValue"];
  function validSnapshot(raw) {
    if (!raw || !["shade", "value", "done"].includes(raw.phase)) return null;
    if (!counts.every(key => Number.isSafeInteger(raw[key]) && raw[key] >= 0 && raw[key] <= 1e9)) return null;
    if (![raw.level, raw.startLevel].every(n => Number.isInteger(n) && n >= 1 && n <= 8)) return null;
    if (!Number.isFinite(raw.markerPct) || raw.markerPct < 0 || raw.markerPct > 100) return null;
    if (![0, 1, 2].includes(raw.scaffoldTier)) return null;
    const p = raw.problem;
    if (!p || !["part", "sale", "percent", "decimal"].includes(p.kind)) return null;
    if (!Number.isFinite(p.whole) || p.whole <= 0 || p.whole > 1e6 || !Number.isFinite(p.targetPct) || p.targetPct < 0 || p.targetPct > 100) return null;
    if (Math.abs(p.tenth - p.whole / 10) > 1e-9) return null;
    if (![p.prompt, p.why, p.label].every(x => typeof x === "string" && x.length > 0 && x.length < 2000)) return null;
    if (p.ask) {
      const options = p.ask.options;
      if (typeof p.ask.q !== "string" || !Array.isArray(options) || options.length > 8 || options.filter(o => o.correct).length !== 1) return null;
      if (!options.every(o => Number.isFinite(o.value) && typeof o.label === "string" && typeof o.why === "string")) return null;
      if (Math.abs(options.find(o => o.correct).value - p.whole * p.targetPct / 100) > 1e-9) return null;
    } else if (raw.phase === "value") return null;
    if (raw.phase === "value" && raw.markerPct !== p.targetPct) return null;
    const safe = Object.fromEntries(counts.map(key => [key, raw[key]]));
    Object.assign(safe, { problem: p, phase: raw.phase, markerPct: raw.markerPct, level: raw.level, startLevel: raw.startLevel, scaffoldTier: raw.scaffoldTier });
    for (const key of ["support", "auto", "endless", "usedHelp"]) safe[key] = !!raw[key];
    safe.stats = {};
    for (const kind of ["part", "sale", "percent", "decimal"]) {
      const entry = raw.stats?.[kind];
      if (entry && [entry.seen, entry.clean].every(n => Number.isSafeInteger(n) && n >= 0) && entry.clean <= entry.seen) safe.stats[kind] = { seen: entry.seen, clean: entry.clean };
    }
    safe.amountDraft = typeof raw.amountDraft === "string" ? raw.amountDraft.slice(0, 200) : "";
    return safe;
  }
  window.PercentConstruction = Object.freeze({ parseAmount, validSnapshot });
})();
