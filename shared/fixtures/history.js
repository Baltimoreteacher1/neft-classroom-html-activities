/**
 * Synthetic practice histories: attempt logs per student.
 * An attempt is { studentId, domain, nodeId, ts, correct, hintsUsed, durationSec }.
 * nodeId is a free string ("reading.g3.n07"): later waves map their own graph onto it.
 * Time starts at HISTORY_START and only moves forward; nothing reads the clock.
 * Model: each student has a latent ability from their band (+ small per-student and per-domain
 * offsets) that grows slowly with practice; P(correct) is logistic in (ability - node difficulty).
 */
import { createRng } from "./prng.js";

export const DOMAINS = Object.freeze(["listening", "speaking", "reading", "writing"]);
export const NODES_PER_DOMAIN = 12;
export const HISTORY_START = "2026-09-08T13:00:00.000Z";
const DAY_MS = 86_400_000;
const BAND_ABILITY = { emerging: 0.2, developing: 0.4, expanding: 0.6, bridging: 0.8 };

export function nodeIdsFor(domain, grade) {
  return Array.from(
    { length: NODES_PER_DOMAIN },
    (_, i) => `${domain}.g${String(grade).toLowerCase()}.n${String(i + 1).padStart(2, "0")}`,
  );
}

const clamp = (x, lo, hi) => Math.min(hi, Math.max(lo, x));

export function buildHistory(cls, { attemptsPerStudent = 40 } = {}) {
  const attempts = [];
  const start = Date.parse(HISTORY_START);
  for (const student of cls.students) {
    const rng = createRng(`history:${student.id}`);
    const base = BAND_ABILITY[student.band] + (rng.next() - 0.5) * 0.16;
    const domainShift = Object.fromEntries(DOMAINS.map((d) => [d, (rng.next() - 0.5) * 0.2]));
    let clockMs = start + rng.int(0, 90) * 60_000;
    for (let i = 0; i < attemptsPerStudent; i++) {
      const domain = rng.pick(DOMAINS);
      const ability = clamp(base + domainShift[domain] + i * 0.004, 0.02, 0.98);
      const nodes = nodeIdsFor(domain, cls.grade);
      // Practice drifts up the node list with time; it does NOT track ability, so bands separate.
      const index = clamp(Math.round(3 + i * 0.1) + rng.int(-3, 3), 0, NODES_PER_DOMAIN - 1);
      const difficulty = index / (NODES_PER_DOMAIN - 1);
      const pCorrect = clamp(1 / (1 + Math.exp(-8 * (ability - difficulty))), 0.05, 0.95);
      const correct = rng.chance(pCorrect);
      if (i % 4 === 0 && i > 0) clockMs += DAY_MS + rng.int(0, 120) * 60_000;
      else clockMs += rng.int(2, 15) * 60_000;
      attempts.push({
        studentId: student.id,
        domain,
        nodeId: nodes[index],
        ts: new Date(clockMs).toISOString(),
        correct,
        hintsUsed: correct ? rng.int(0, 1) : rng.int(0, 2),
        durationSec: rng.int(8, 90),
      });
    }
  }
  return attempts.sort(
    (a, b) => a.ts.localeCompare(b.ts) || a.studentId.localeCompare(b.studentId),
  );
}
