/**
 * Practice Studio attempt policy (window.StudioAttempts): what a wrong answer costs, and what credit a right one earns.
 *
 * Until v4 a student could click every choice until one turned green and be paid in full: the solve marked the item done, the
 * star landed, the seal counted it, and a page reload forgot the misses. The policy here is pure (no DOM, no storage) so a test
 * can pin it; runtime.js, repair.js and learner.js read it.
 *
 *   tierOf(misses, hints)   "clean" | "assisted" | "guessed"
 *   LOOK_AT                 misses before the item closes into "Look closer" (2; 3 on a teacher support link)
 *   creditable(tier)        only a clean answer earns seals, Boost progress and first-try credit
 *   starCredit(tier)        clean and assisted answers earn the item's star; a guessed one waits for a fresh problem
 *   shuffleOrder(n, seed)   a stable shuffle of 0..n-1 (choice order after a miss)
 *   HOLD_REASONS            the four things a student picks before trying again (a pause with no clock)
 *
 * Nothing here is timed, and nothing prints an answer.
 */
(() => {
  const W = /** @type {any} */ (typeof window === "undefined" ? globalThis : window);
  const search = typeof location === "undefined" ? "" : location.search || "";
  /** A teacher link (?support=1) gives a student one more try before the item closes. It is a link, never a label on a student. */
  const support = /[?&]support=1(&|$)/.test(search);
  const LOOK_AT = support ? 3 : 2;
  /** after this many fresh problems still guessed, the item is released and flagged for the teacher instead of looping */
  const MAX_PROOFS = 2;

  /** @param {number} misses @param {number} hints */
  function tierOf(misses, hints) {
    if (misses >= LOOK_AT) return "guessed";
    if (misses >= 1 || hints >= 2) return "assisted";
    return "clean";
  }
  const creditable = (/** @type {string} */ tier) => tier === "clean";
  const starCredit = (/** @type {string} */ tier) => tier !== "guessed";

  /** A small seeded shuffle (mulberry32), so a choice order is the same on every render of one miss. */
  function shuffleOrder(/** @type {number} */ n, /** @type {number} */ seed) {
    const order = Array.from({ length: n }, (_, i) => i);
    let a = (seed >>> 0) + 0x6d2b79f5;
    const rnd = () => {
      a = (a + 0x6d2b79f5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    for (let i = n - 1; i > 0; i--) {
      const j = Math.floor(rnd() * (i + 1));
      [order[i], order[j]] = [order[j], order[i]];
    }
    return order;
  }

  const HOLD_REASONS = [
    { id: "reread", en: "Reread the question", es: "Releer la pregunta" },
    { id: "model", en: "Look at the picture or model", es: "Mirar la imagen o el modelo" },
    { id: "check", en: "Check my work or my units", es: "Revisar mi trabajo o mis unidades" },
    { id: "hint", en: "Open a hint", es: "Abrir una pista" },
  ];

  W.StudioAttempts = {
    LOOK_AT,
    MAX_PROOFS,
    support,
    tierOf,
    creditable,
    starCredit,
    shuffleOrder,
    HOLD_REASONS,
  };
})();
