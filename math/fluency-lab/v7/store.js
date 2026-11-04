// v7's own additive progress record. It never writes the lab's existing keys; reads them only to recommend.
const KEY = "ewl-v7-progress-v1";
const LAB_KEY = "ewl-fluency-progress-v1";
const read = (key) => { try { const v = JSON.parse(localStorage.getItem(key) || "{}"); return v && typeof v === "object" ? v : {}; } catch { return {}; } };
export function loadProgress() {
  const lab = read(LAB_KEY), mine = read(KEY), out = {};
  for (const src of [lab, mine]) for (const [k, r] of Object.entries(src)) {
    if (!r || typeof r !== "object") continue;
    const a = Number(r.attempts) || 0, c = Math.min(a, Number(r.correct) || 0);
    out[k] = { attempts: (out[k]?.attempts || 0) + a, correct: (out[k]?.correct || 0) + c };
  }
  return out;
}
// Returns false (and keeps working) when storage is blocked or full: a failed write must never lose the session.
export function record(key, correct) {
  const mine = read(KEY);
  const r = mine[key] || { attempts: 0, correct: 0 };
  mine[key] = { attempts: r.attempts + 1, correct: r.correct + (correct ? 1 : 0), lastAt: Date.now() };
  try { localStorage.setItem(KEY, JSON.stringify(mine)); return true; } catch { return false; }
}
