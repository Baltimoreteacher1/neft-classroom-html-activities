// AI second look at writing (Language Page #25). The model only CLASSIFIES: it names one of the lab's authored next
// moves and up to two authored error patterns, and this module shows the lab's own wording for those ids. Without a
// model (or offline) the rule-based Language Coach feedback is the whole answer, exactly as before.
//
// What leaves the device: the learner's own draft text and the purpose (Narrate/Inform/Explain/Argue), only after the
// learner presses the button. Never the task prompt, a passage, or a test item.
import { DETECTORS } from "../lang/errors.js";
import { MOVES } from "../lang/purpose.js";

const URL = "/api/class/ai/writing";

/** @returns {Promise<{ ok: true, source: string, move: object | null, patterns: object[] } | { ok: false, offline: boolean }>} */
export async function askSecondLook(text, keyUse, fetchImpl = (...a) => fetch(...a)) {
  let res;
  try {
    res = await fetchImpl(URL, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ text: String(text || "").slice(0, 1800), keyUse }),
    });
  } catch {
    return { ok: false, offline: true };
  }
  const data = await res.json().catch(() => null);
  if (!res.ok || !data?.ok) return { ok: false, offline: !res.ok && res.status !== 400 };
  // Resolve ids to authored entries; anything not in the lab's lists is dropped again here.
  const move = (MOVES[keyUse] || []).find((m) => m.id === data.move) || null;
  const patterns = (data.patterns || []).map((id) => DETECTORS.find((d) => d.id === id)).filter(Boolean);
  return move || patterns.length ? { ok: true, source: data.source, move, patterns } : { ok: false, offline: true };
}
