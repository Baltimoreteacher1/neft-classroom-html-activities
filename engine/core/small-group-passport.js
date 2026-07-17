// small-group-passport.js — bridges the small-group studio into the site-wide
// Student Passport economy (assets/lesson-passport.js → window.NTPassport, the
// same lifetime XP/level/badge profile the full lessons and unit games feed).
// It never forks the economy: it lazy-loads the canonical passport layer (which
// self-mounts its top-left pill — the platform's designated free corner; the
// studio's bottom-right slot belongs to the Math Workbench launcher) and awards
// through window.NTPassport.award().
//
// Award map (all idempotent per lesson+event via the studio's device store):
//   - each solved problem ................ small XP  (derived from persisted
//     solve state, so a restored session never double-awards)
//   - a live streak of 3 correct ......... bonus XP  (capped per lesson)
//   - each phase completion .............. medium XP (once per phase key)
//   - studio completion (reflectDone) .... large XP, reason "studio_complete"
//     (drives the Studio Star badge + marks the lesson complete in the profile)
//
// Hard rules: never throws into the studio — a missing or failed passport
// layer degrades to a no-op; every hook is wrapped; work finished before this
// layer existed is baselined silently (no retroactive XP bursts).

const PASSPORT_CSS = "/assets/lesson-passport.css";
const PASSPORT_JS = "/assets/lesson-passport.js";

const XP_SOLVED = 10;
const XP_STREAK_BONUS = 15;
const XP_PHASE = 20;
const XP_STUDIO = 60;
const STREAK_LENGTH = 3;
const STREAK_BONUS_CAP = 3;
const MAX_BUFFERED = 200;

// Phase-completion store keys (renderer's phaseDone/RESTORE_MARKS vocabulary).
// reflectDone is deliberately absent: it is the studio-completion event.
const PHASE_KEYS = [
  "launchDone",
  "buildDone",
  "vocabDone",
  "guidedDone",
  "practiceDone",
  "checkSolved",
  "moreDone",
  "applyDone",
];
const STUDIO_KEY = "reflectDone";
// Lab solves persisted as booleans; practice solves persist as a list of
// indexes. checkSolved/applyDone count as phases above, not solves, so the
// exit ticket and apply lab are never double-credited.
const SOLVE_FLAGS = ["exploreDone", "modelDone"];

// This layer's own ledger, kept inside the studio's nt-sg:<lessonId> store so
// clearing a studio ("Start fresh") also resets what has been awarded for it.
const LEDGER_SOLVED = "passportSolvedAwarded";
const LEDGER_PHASES = "passportPhasesAwarded";
const LEDGER_STUDIO = "passportStudioAwarded";
const LEDGER_STREAKS = "passportStreakBonuses";

function countSolved(store) {
  let total = 0;
  try {
    const list = store.get("solvedPractice", []);
    if (Array.isArray(list)) total += list.length;
    for (const flag of SOLVE_FLAGS) if (store.get(flag)) total += 1;
  } catch {
    /* unreadable store — treat as no solves */
  }
  return total;
}

// Ensure the canonical passport layer is present (mirrors the games' include
// pattern: one css link + one script). Resolves once window.NTPassport.award
// is callable; rejects if the layer cannot load.
function loadPassportLayer() {
  return new Promise((resolve, reject) => {
    const usable = () => window.NTPassport && typeof window.NTPassport.award === "function";
    if (usable()) {
      resolve();
      return;
    }
    const head = document.head;
    if (!head) {
      reject(new Error("no document head"));
      return;
    }
    if (!document.querySelector(`link[href^="${PASSPORT_CSS}"]`)) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = PASSPORT_CSS;
      head.appendChild(link);
    }
    const settle = () => (usable() ? resolve() : reject(new Error("passport global missing")));
    const fail = () => reject(new Error("passport script failed to load"));
    const existing = document.querySelector(`script[src^="${PASSPORT_JS}"]`);
    if (existing) {
      // Another layer already added the tag; wait for it instead of racing.
      existing.addEventListener("load", settle, { once: true });
      existing.addEventListener("error", fail, { once: true });
      window.setTimeout(settle, 4000); // late safety net; extra settles are inert
      return;
    }
    const script = document.createElement("script");
    script.src = PASSPORT_JS;
    script.async = true;
    script.onload = settle;
    script.onerror = fail;
    head.appendChild(script);
  });
}

/**
 * Install the passport bridge for one studio session.
 * Call once at the end of bootSmallGroup, after every section (and any
 * restore-time re-fires) has been wired, with the renderer's own store and
 * events hub. Returns true when the bridge is armed, false when it declined
 * (bad arguments / no DOM); it never throws.
 */
export function installSmallGroupPassport({ lessonId, store, events } = {}) {
  try {
    if (typeof window === "undefined" || typeof document === "undefined") return false;
    if (!store || typeof store.get !== "function" || typeof store.set !== "function") return false;
    if (!events || typeof events !== "object") return false;
    const slug = String(lessonId || "lesson");

    // Snapshots at install time. Anything already done (older sessions, or the
    // renderer's restore pass, which runs before this install) is baselined
    // silently so a returning device never receives a retroactive XP burst.
    const solvedAtInstall = countSolved(store);
    const phasesAtInstall = PHASE_KEYS.filter((key) => {
      try {
        return !!store.get(key);
      } catch {
        return false;
      }
    });
    const studioAtInstall = (() => {
      try {
        return !!store.get(STUDIO_KEY);
      } catch {
        return false;
      }
    })();

    // Until the passport layer is ready, award intents buffer here (bounded).
    let ready = false;
    const buffered = [];
    const run = (fn) => {
      if (ready) fn();
      else if (buffered.length < MAX_BUFFERED) buffered.push(fn);
    };
    const award = (xp, reason) => {
      try {
        window.NTPassport.award(xp, reason);
      } catch {
        /* passport refused — stay silent, the studio must never notice */
      }
    };

    // Ledgers (hydrated on ready; guarded in-memory so double-fires within a
    // session are inert even before persistence catches up).
    let awardedSolved = 0;
    let streakBonuses = 0;
    let studioAwarded = false;
    const awardedPhases = new Set();

    const rememberPhase = (key) => {
      try {
        if (typeof store.addTo === "function") store.addTo(LEDGER_PHASES, key);
      } catch {
        /* persistence best-effort */
      }
    };

    const reconcileSolved = () => {
      const total = countSolved(store);
      if (total <= awardedSolved) return;
      const gained = total - awardedSolved;
      awardedSolved = total;
      try {
        store.set(LEDGER_SOLVED, awardedSolved);
      } catch {
        /* persistence best-effort */
      }
      award(gained * XP_SOLVED, `sg_solved:${slug}`);
    };

    const awardPhase = (key) => {
      if (awardedPhases.has(key)) return;
      awardedPhases.add(key);
      rememberPhase(key);
      award(XP_PHASE, `sg_phase:${key}`);
    };

    const awardStudio = () => {
      if (studioAwarded) return;
      studioAwarded = true;
      try {
        store.set(LEDGER_STUDIO, true);
      } catch {
        /* persistence best-effort */
      }
      // The reason string is load-bearing: lesson-passport.js counts a
      // completed studio (Studio Star badge) and marks this lesson complete.
      award(XP_STUDIO, "studio_complete");
    };

    const maybeStreakBonus = () => {
      if (streakBonuses >= STREAK_BONUS_CAP) return;
      streakBonuses += 1;
      try {
        store.set(LEDGER_STREAKS, streakBonuses);
      } catch {
        /* persistence best-effort */
      }
      award(XP_STREAK_BONUS, `sg_streak:${slug}`);
    };

    // ── Hooks ──────────────────────────────────────────────────────────────
    // The renderer's sections invoke these via property lookup, so patching
    // the shared objects in place observes every future call without touching
    // any small-group engine file.
    const originalAttempt = events.onAttempt;
    events.onAttempt = function patchedOnAttempt(info) {
      const result =
        typeof originalAttempt === "function" ? originalAttempt.call(events, info) : undefined;
      try {
        const streak = typeof events.streak === "function" ? Number(events.streak()) : 0;
        if (streak === STREAK_LENGTH) run(maybeStreakBonus);
      } catch {
        /* streak read failed — skip the bonus, never the lesson */
      }
      return result;
    };

    const originalSolved = events.onSolved;
    events.onSolved = function patchedOnSolved(...args) {
      const result =
        typeof originalSolved === "function" ? originalSolved.apply(events, args) : undefined;
      try {
        // Callers persist the solve right after firing; settle first, then
        // reconcile against the store so the count is derived, not guessed.
        queueMicrotask(() => run(reconcileSolved));
      } catch {
        /* no microtasks — skip this reconcile; the next solve catches up */
      }
      return result;
    };

    const originalSet = store.set;
    store.set = function patchedSet(name, value) {
      const result = originalSet.call(store, name, value);
      try {
        if (value) {
          if (name === STUDIO_KEY) run(awardStudio);
          else if (PHASE_KEYS.includes(name)) run(() => awardPhase(name));
        }
      } catch {
        /* award intent failed — persistence above already succeeded */
      }
      return result;
    };

    // ── Arm ────────────────────────────────────────────────────────────────
    loadPassportLayer().then(
      () => {
        try {
          const storedSolved = store.get(LEDGER_SOLVED);
          awardedSolved =
            typeof storedSolved === "number" && storedSolved >= 0 ? storedSolved : solvedAtInstall;
          const storedPhases = store.get(LEDGER_PHASES, []);
          if (Array.isArray(storedPhases)) for (const key of storedPhases) awardedPhases.add(key);
          for (const key of phasesAtInstall) {
            if (!awardedPhases.has(key)) {
              awardedPhases.add(key);
              rememberPhase(key);
            }
          }
          studioAwarded = !!store.get(LEDGER_STUDIO) || studioAtInstall;
          if (studioAtInstall && !store.get(LEDGER_STUDIO)) store.set(LEDGER_STUDIO, true);
          streakBonuses = Number(store.get(LEDGER_STREAKS)) || 0;
          if (typeof storedSolved !== "number") store.set(LEDGER_SOLVED, awardedSolved);
          ready = true;
          const queued = buffered.splice(0, buffered.length);
          for (const fn of queued) fn();
        } catch {
          /* hydration failed — leave the bridge unarmed */
        }
      },
      () => {
        /* passport layer unavailable — the studio runs exactly as before */
      },
    );
    return true;
  } catch {
    return false;
  }
}

export default installSmallGroupPassport;
