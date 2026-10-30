// Gradual release, as it shows in a learner's own work: for each Key Language Use, the stage of every
// first attempt in order (guided → supported → independent). The scaffold ladder is the lab's
// "I do / we do / you do"; this shows whether the learner is actually moving along it.
// Direction needs MIN_POINTS first attempts and is read from the two halves of the sequence.
// It describes how much support was opened. It is not a level and is never summed into one number.
import { MIN_POINTS, firstAttempts } from "./ledger.js";

export const STAGE_RANK = Object.freeze({ guided: 0, supported: 1, independent: 2 });
export const STAGE_LABEL = Object.freeze({
  guided: { en: "Guided", es: "Guiado" },
  supported: { en: "Supported", es: "Con apoyo" },
  independent: { en: "On my own", es: "Por mi cuenta" },
});
const rank = (stage) => STAGE_RANK[stage] ?? STAGE_RANK.supported;
const mean = (a) => a.reduce((x, y) => x + y, 0) / a.length;

/** "up" / "down" / "steady" from the first half against the second half; "not-enough" under MIN_POINTS. */
export function fadeDirection(stages) {
  if (!Array.isArray(stages) || stages.length < MIN_POINTS) return "not-enough";
  const mid = Math.floor(stages.length / 2);
  const gap = mean(stages.slice(mid).map(rank)) - mean(stages.slice(0, mid).map(rank));
  return gap >= 0.5 ? "up" : gap <= -0.5 ? "down" : "steady";
}

/** One row per Key Language Use, ordered by how much evidence there is. `sequence` is oldest to newest. */
export function fadeTrajectory(entries = []) {
  const fa = firstAttempts(Array.isArray(entries) ? entries : [], (e) => e.t).sort((a, b) =>
    String(a.t).localeCompare(String(b.t)),
  );
  const byUse = new Map();
  for (const e of fa) {
    const use = e.use || "Other";
    if (!byUse.has(use)) byUse.set(use, []);
    byUse.get(use).push(Object.hasOwn(STAGE_RANK, e.stage) ? e.stage : "supported");
  }
  return [...byUse]
    .map(([use, sequence]) => ({
      use,
      n: sequence.length,
      sequence,
      latest: sequence.at(-1),
      direction: fadeDirection(sequence),
    }))
    .sort((a, b) => b.n - a.n || a.use.localeCompare(b.use));
}

const SENTENCE = {
  up: {
    en: "uses fewer supports than before",
    es: "usa menos apoyos que antes",
    you: { en: "You use fewer supports than before.", es: "Usas menos apoyos que antes." },
  },
  down: {
    en: "has been using more supports lately",
    es: "ha usado más apoyos últimamente",
    you: { en: "You have been using more supports lately.", es: "Has usado más apoyos últimamente." },
  },
  steady: {
    en: "is working with about the same supports",
    es: "trabaja con apoyos parecidos",
    you: { en: "You are working with about the same supports.", es: "Trabajas con apoyos parecidos." },
  },
  "not-enough": {
    en: "not enough attempts yet to see a direction",
    es: "todavía no hay suficientes intentos para ver una dirección",
    you: { en: "Not enough attempts yet to see a direction.", es: "Todavía no hay suficientes intentos para ver una dirección." },
  },
};
export const fadeSentence = (row) => SENTENCE[row.direction];
/** The same reading addressed to the learner, as a complete sentence. */
export const fadeYou = (row) => SENTENCE[row.direction].you;
