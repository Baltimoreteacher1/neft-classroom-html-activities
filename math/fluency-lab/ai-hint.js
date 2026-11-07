// AI hint tutor (#28). The model never writes a hint: it picks which of the skill's OWN authored hints (the strategy
// hint and the guided steps that step-leak.js says are safe to show) fits what the learner just tried. The server
// filters candidates with the same step-leak check before the model sees them and checks its pick again; this module
// checks once more on the device. Any failure, a slow reply or no model at all returns null and the caller shows the
// authored strategy hint exactly as before.
import { peekCap, stepLeaks } from "./step-leak.js";

const ENDPOINT = "/api/class/ai";
const WAIT_MS = 2500;
let available = null;

/** Is a model backend bound? Asked once per page; a failed probe means "no". */
export function aiHintAvailable(fetchImpl = (...a) => fetch(...a)) {
  available ||= fetchImpl(`${ENDPOINT}/health`)
    .then((r) => (r.ok ? r.json() : null))
    .then((h) => Boolean(h?.ok && (h.claude || h.workersAi)))
    .catch(() => false);
  return available;
}

/** Authored hints a learner may see before answering: the strategy hint, then guided steps up to the safe cap. */
export function hintCandidates(item) {
  const steps = (item.steps || []).slice(0, peekCap(item));
  return [item.hint, ...steps]
    .filter((h) => typeof h === "string" && h.trim())
    .filter((h, i, all) => all.indexOf(h) === i && !stepLeaks(h, item))
    .slice(0, 8);
}

/** @returns {Promise<string | null>} one of the item's own hints, or null to keep the default. */
export async function chooseHint(item, attempt, fetchImpl = (...a) => fetch(...a)) {
  const hints = hintCandidates(item);
  if (hints.length < 2 || !(await aiHintAvailable(fetchImpl))) return null;
  const answers = [...(item.answers || []), item.displayAnswer].filter(Boolean).map(String);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), WAIT_MS);
  try {
    const res = await fetchImpl(`${ENDPOINT}/hint`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({ question: item.question, attempt: String(attempt || ""), answers, hints }),
    });
    const data = await res.json().catch(() => null);
    const picked = res.ok && data?.ok && Number.isInteger(data.index) ? hints[data.index] : null;
    return picked && !stepLeaks(picked, item) ? picked : null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}
