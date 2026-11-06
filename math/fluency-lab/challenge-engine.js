// Interactive Quest & Challenge Engine for Fluency Lab Manipulatives
// Attaches conceptual mini-puzzles to each interactive model with instant visual and harmonic feedback.

import { spawnParticleBurst } from "./particle-fx.js";
import { playResolutionSequence, playStepChime } from "./harmonic-audio.js";

const esc = (value) =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");

export const CHALLENGE_CATALOG = {
  angle: [
    {
      id: "angle-obtuse-120",
      title: "Target: 120° Obtuse Angle",
      instruction: "Adjust the angle slider until the measurement is exactly 120°.",
      predicate: (st) => Number(st.angle) === 120,
      rewardHint: "Nice work! 120° is an obtuse angle, exactly two-thirds of a straight 180° line.",
    },
    {
      id: "angle-right-90",
      title: "Target: Perfect 90° Right Angle",
      instruction: "Find the exact point where two perpendicular rays meet at 90°.",
      predicate: (st) => Number(st.angle) === 90,
      rewardHint: "Brilliant! 90° forms a square corner, the foundation of coordinate geometry.",
    },
  ],
  pythagoras: [
    {
      id: "pyth-triple-6-8-10",
      title: "Pythagorean Quest: Find the 6 - 8 - 10 Triple",
      instruction: "Set Leg a to 6 and Leg b to 8 to discover an integer hypotenuse.",
      predicate: (st) => (st.a === 6 && st.b === 8) || (st.a === 8 && st.b === 6),
      rewardHint: "Eureka! 6² (36) + 8² (64) = 100, and √100 = 10 exactly!",
    },
  ],
  dilation: [
    {
      id: "dil-quadruple-area",
      title: "Area Quadrupling Challenge",
      instruction: "Find the scale factor k that makes the new area 4 times as big as the original pre-image.",
      predicate: (st) => Number(st.k) === 2,
      rewardHint: "Crucial Insight Unlocked! Doubling lengths (k = 2) quadruples area (k² = 4)!",
    },
  ],
  funcMach: [
    {
      id: "func-slope-3",
      title: "Function Target: Output of 10",
      instruction: "With rule y = 3x − 2, set the Input to reach an Output of 10.",
      predicate: (st) => Number(st.currentInput) === 4,
      rewardHint: "Solved! 3(4) − 2 = 12 − 2 = 10.",
    },
  ],
  algebraTiles: [
    {
      id: "alg-solve-2x3-11",
      title: "Balance Challenge: 2x + 3 = 11",
      instruction: "Perform inverse operations to isolate x and solve the equation.",
      predicate: (st) => Number(st.leftX) === 1 && Number(st.leftConst) === 0 && Number(st.rightConst) === 4,
      rewardHint: "Mastered! By subtracting 3 and dividing by 2, you proved x = 4!",
    },
  ],
  circlePi: [
    {
      id: "circle-unroll-100",
      title: "Unroll the Full Perimeter",
      instruction: "Drag the unroll slider to 100% to view the complete circumference ribbon.",
      predicate: (st) => Math.round(Number(st.unrollProgress)) === 100,
      rewardHint: "Incredible! The unrolled ribbon length is exactly C = 2πr = πd!",
    },
  ],
  intVector: [
    {
      id: "int-sub-neg",
      title: "Mystery Case: Subtracting a Negative",
      instruction: "Set the problem to (−3) − (−5) to witness directional reversal.",
      predicate: (st) => Number(st.a) === -3 && st.op === "-" && Number(st.b) === -5,
      rewardHint: "Boom! Subtracting negative 5 reverses direction and hops right to +2!",
    },
  ],
};

const STORAGE_KEY = "ewl-fluency-challenges-v1";

export function getCompletedChallenges() {
  if (typeof localStorage === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return new Set(raw ? JSON.parse(raw) : []);
  } catch {
    return new Set();
  }
}

export function markChallengeCompleted(challengeId) {
  if (typeof localStorage === "undefined") return;
  try {
    const completed = getCompletedChallenges();
    completed.add(challengeId);
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...completed]));
  } catch {
    // Non-fatal fallback
  }
}

export function renderChallengeBanner(modelKey, state = {}) {
  const challenges = CHALLENGE_CATALOG[modelKey];
  if (!challenges || challenges.length === 0) return "";

  const completed = getCompletedChallenges();
  const challenge = challenges[0]; // Active challenge
  const isSolved = challenge.predicate(state);
  const alreadyEarned = completed.has(challenge.id);

  return `
    <div class="challenge-quest-banner ${isSolved ? "is-quest-solved" : ""}" data-challenge-id="${esc(challenge.id)}" data-solved="${isSolved}">
      <div class="quest-banner-left">
        <span class="quest-badge-icon">${isSolved || alreadyEarned ? "🌟" : "🎯"}</span>
        <div class="quest-text-col">
          <div class="quest-title-row">
            <strong class="quest-title">${esc(challenge.title)}</strong>
            ${isSolved || alreadyEarned ? `<span class="quest-completed-tag">SOLVED! +25 XP</span>` : `<span class="quest-active-tag">Active Quest</span>`}
          </div>
          <p class="quest-instruction">${esc(isSolved ? challenge.rewardHint : challenge.instruction)}</p>
        </div>
      </div>
    </div>
  `;
}

export function checkAndTriggerReward(container, modelKey, state = {}) {
  if (!container) return false;
  const banner = container.querySelector(".challenge-quest-banner");
  if (!banner) return false;

  const challengeId = banner.dataset.challengeId;
  const challenges = CHALLENGE_CATALOG[modelKey] || [];
  const challenge = challenges.find((c) => c.id === challengeId);
  if (!challenge) return false;

  const isSolved = challenge.predicate(state);
  const completed = getCompletedChallenges();

  if (isSolved && !completed.has(challenge.id)) {
    markChallengeCompleted(challenge.id);
    spawnParticleBurst(banner);
    playResolutionSequence();
    return true;
  }
  return false;
}
