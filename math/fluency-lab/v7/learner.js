// EduWonderLab 7.0 learner model: interpretable and conservative. It reads only what the lab already stores locally
// (per-skill attempts/correct from the progress record) and recommends ONE next step with a plain reason. It makes no
// claim without enough evidence (MIN_EVIDENCE attempts) and never labels a learner; it labels evidence.
import { conceptFor, keyOf, skillsForGrade } from "./concepts.js";

export const MIN_EVIDENCE = 4;
const rate = (r) => (r && r.attempts ? r.correct / r.attempts : null);
const status = (r) => {
  if (!r || r.attempts < MIN_EVIDENCE) return "unknown";
  const p = rate(r);
  return p >= 0.85 ? "secure" : p >= 0.6 ? "developing" : "needs-support";
};
export const evidenceFor = (progress, key) => ({ key, ...(progress?.[key] || { attempts: 0, correct: 0 }), status: status(progress?.[key]) });

// Returns { intent: "learn"|"practice"|"explore", key, reason:{en,es}, evidence } — always something to do.
export function recommend({ grade, progress = {} }) {
  const skills = skillsForGrade(grade).map(keyOf);
  const ev = skills.map((key) => evidenceFor(progress, key));
  const weak = ev.filter((e) => e.status === "needs-support").sort((a, b) => a.correct / a.attempts - b.correct / b.attempts)[0];
  if (weak) {
    const gap = conceptFor(weak.key).prerequisites.map((k) => evidenceFor(progress, k)).find((e) => e.status === "needs-support");
    const key = gap ? gap.key : weak.key;
    return { intent: "learn", key, evidence: weak, reason: gap ? { en: "A foundation skill needs another look first.", es: "Una destreza base necesita otro repaso primero." } : { en: "This idea is still tricky — see it again with a picture.", es: "Esta idea aún cuesta — vuélvela a ver con un dibujo." } };
  }
  const dev = ev.find((e) => e.status === "developing");
  if (dev) return { intent: "practice", key: dev.key, evidence: dev, reason: { en: "You are getting there — a little more practice will help.", es: "Vas bien — un poco más de práctica ayuda." } };
  const fresh = ev.find((e) => e.status === "unknown");
  if (fresh) return { intent: "learn", key: fresh.key, evidence: fresh, reason: { en: "A new idea to start with.", es: "Una idea nueva para empezar." } };
  return { intent: "explore", key: ev[0]?.key || skills[0], evidence: ev[0], reason: { en: "You have this grade covered — explore something open-ended.", es: "Dominas este grado — explora algo abierto." } };
}
