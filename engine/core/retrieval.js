// retrieval.js — the spaced-review opener ("Remember When").
//
// The curriculum already labels 76 files "spiral", but nothing scheduled
// anything: a review appeared where an author happened to put one, which means
// the students who most needed a second pass at 6.NOS.1 got it on the same day
// as the students who did not. This module is the missing scheduler.
//
// WHAT IT MAY ASK ABOUT is decided by the district's scope and sequence: only
// lessons taught BEFORE today's, in the order the district teaches them —
// data/retrieval-bank.json carries that order (`sequence`, built from the same
// three pacing files the warmups read; see scripts/generate-retrieval-bank.mjs).
// It used to ask about whatever standard this device's Leitner schedule said
// was due, which on a lesson numbered 6-1 but taught in August's Pre-Unit could
// be a standard from a unit the class had not met (Joel, 2026-08-28: "use a
// previous lesson … following the updated scope and sequence and lesson
// scope"). WHICH of those lessons comes first is still the schedule's call —
// NTSignal.dueStandards() — and when the device has no schedule yet, the
// sequence itself supplies a spread: a few lessons back, about a week back,
// and a couple of weeks back. What it asks WITH is lifted verbatim from lesson
// configs that validate:math already checked, so nothing here invents
// mathematics.
//
// Four rules keep it from becoming a chore:
//   - It is capped at MAX_ITEMS. A review that grows without bound stops being
//     an opener and starts being the lesson.
//   - Today's standard is never reviewed. It is about to be taught; asking it
//     now measures nothing and spends the student's attention twice.
//   - Yesterday's lesson is never reviewed here. That is the Warm-Up's job,
//     directly below, and asking it twice is the same question twice.
//   - Nothing renders when there is nothing to remember: a course opener, or a
//     lesson the district plan does not schedule, gets no empty card.

import { renderMultipleChoice } from "../components/multiple-choice.js";

const MAX_ITEMS = 3;
/* Positions counted back from the lesson before yesterday's, when the device
 * has no schedule of its own: recent, about a week ago, a couple of weeks ago. */
const SPREAD = [0, 3, 8];
let bankPromise = null;

/** Fetch (once) the review bank. Resolves to { bank: {}, sequence: [] } when unavailable. */
export function loadRetrievalBank() {
  if (!bankPromise) {
    bankPromise = fetch("/data/retrieval-bank.json", { credentials: "omit" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => ({
        bank: (d && d.bank) || {},
        sequence: Array.isArray(d?.sequence) ? d.sequence : [],
      }))
      .catch(() => ({ bank: {}, sequence: [] }));
  }
  return bankPromise;
}

/**
 * The lessons taught before `lessonId` in the district's order, MOST RECENT
 * FIRST — so [0] is yesterday's lesson. Variants (6-1-group2, 6-1-catchup)
 * inherit their parent's position. Empty when the lesson is not in the paced
 * sequence, which is a real state (course opener, unpaced arc), not an error.
 */
export function taughtBefore(sequence, lessonId) {
  const base = String(lessonId || "").match(/^(\d+-\d+)/)?.[1];
  if (!base || !Array.isArray(sequence)) return [];
  const at = sequence.findIndex((e) => e && e.id === base);
  if (at <= 0) return [];
  return sequence.slice(0, at).reverse();
}

/**
 * Choose the review items for this sitting.
 *
 * Pure and clock-injectable so the schedule can be tested without waiting three
 * weeks. `due` is whatever NTSignal.dueStandards() returned; `bank` is the item
 * bank; `exclude` is today's standard; `before` is taughtBefore() — the lessons
 * already met, most recent first.
 *
 * With `before`, the scope is FIXED by the sequence: a standard may be asked
 * only if a lesson before today's taught it, and yesterday's lesson (before[0])
 * is left to the Warm-Up. Due standards inside that scope go first (the device
 * knows what is fading); the SPREAD from the sequence fills the rest, so the
 * opener reads "earlier this year" on every device, including a fresh one.
 * Without `before` (a lesson outside the paced sequence) only due standards
 * are asked, as before.
 */
export function selectReviewItems(
  due,
  bank,
  { exclude = "", max = MAX_ITEMS, seed = 0, before = [] } = {},
) {
  const picked = [];
  const taken = new Set();
  const scoped = Array.isArray(before) && before.length > 0;
  const allowed = new Set(scoped ? before.slice(1).map((e) => e && e.standard) : []);
  const yesterday = scoped ? before[0]?.standard : "";
  const lessonOf = new Map(scoped ? before.map((e) => [e.standard, e.id]) : []);
  // A standard code recurs across lessons (3-3 and 3-4 share one), so "some
  // earlier lesson taught it" does not make every banked item for it fair
  // game: an item authored in a lesson the class has NOT met yet asks in that
  // lesson's terms. Inside the scope, only items from met lessons may travel.
  const met = new Set(scoped ? before.map((e) => e.id) : []);
  const poolFor = (standard) => {
    const items = Array.isArray(bank?.[standard]) ? bank[standard] : [];
    return scoped ? items.filter((it) => met.has(it.lesson)) : items;
  };

  // A mathematical-practice code (MPP.*) names a habit, not content: "Math is
  // Mine" has nothing to retrieve. Derived from the code, not listed, so a new
  // reflection lesson is treated the same without an edit here.
  const usable = (standard) =>
    standard &&
    !/^MPP\b/i.test(standard) &&
    standard !== exclude &&
    standard !== yesterday &&
    !taken.has(standard) &&
    (!scoped || allowed.has(standard)) &&
    poolFor(standard).length > 0;

  // Rotate through the bank by review count rather than picking at random, so
  // a student who keeps missing a standard meets a DIFFERENT question each
  // time instead of memorising one card's answer position. Inside the scope,
  // prefer the question the remembered lesson itself asked.
  const pickFrom = (standard, lessonId, rotation) => {
    const items = poolFor(standard);
    const own = lessonId ? items.filter((it) => it.lesson === lessonId) : [];
    const pool = own.length ? own : items;
    const item = pool[(rotation + seed) % pool.length];
    taken.add(standard);
    picked.push({ standard, lesson: lessonId || item.lesson || "", item, box: rotation });
  };

  for (const entry of due || []) {
    if (picked.length >= max) break;
    const standard = entry?.standard;
    if (!usable(standard)) continue;
    pickFrom(standard, lessonOf.get(standard) || "", Number(entry.box) || 0);
  }

  if (scoped) {
    const candidates = before.slice(1);
    for (const offset of SPREAD) {
      if (picked.length >= max) break;
      const entry = candidates[offset];
      if (!entry || !usable(entry.standard)) continue;
      pickFrom(entry.standard, entry.id, 0);
    }
    // A short history (the third lesson of the year) may not reach the spread's
    // later offsets; walk the rest so a student still gets what exists.
    for (const entry of candidates) {
      if (picked.length >= max) break;
      if (!entry || !usable(entry.standard)) continue;
      pickFrom(entry.standard, entry.id, 0);
    }
  }
  return picked;
}

function esc(s) {
  const d = document.createElement("div");
  d.textContent = s ?? "";
  return d.innerHTML;
}

/**
 * Mount the opener into `host`.
 * @returns {Promise<number>} how many review items rendered (0 = nothing due)
 */
export async function mountRetrievalOpener(host, config, state, phaseId) {
  if (!host) return 0;
  const signal = typeof window !== "undefined" ? window.NTSignal : null;
  const canSchedule = !!signal && typeof signal.dueStandards === "function";
  const due = canSchedule ? signal.dueStandards(MAX_ITEMS + 2) : [];

  const { bank, sequence } = await loadRetrievalBank();
  const before = taughtBefore(sequence, config?.lessonId);
  // Nothing to remember and nothing due: no empty card.
  if (!before.length && !due.length) return 0;

  const picks = selectReviewItems(due, bank, { exclude: config?.standard || "", before });
  if (!picks.length) return 0;

  const card = document.createElement("section");
  card.className = "card card-indigo retrieval-card";
  card.setAttribute("aria-labelledby", "retrieval-heading");
  card.innerHTML = `
    <h3 id="retrieval-heading" style="margin:0 0 var(--sp-2)">🔁 Remember When</h3>
    <p style="margin:0 0 var(--sp-3); color:var(--muted)">
      ${picks.length === 1 ? "One question" : `${picks.length} questions`} from earlier this year.
      You are not being graded — this is practice at <em>remembering</em>, which is what makes it stick.
    </p>
  `;

  const list = document.createElement("div");
  list.className = "retrieval-items";
  card.append(list);

  let answered = 0;
  const status = document.createElement("p");
  status.className = "retrieval-status";
  status.setAttribute("role", "status");
  status.style.cssText = "margin:var(--sp-3) 0 0; font-weight:600;";

  picks.forEach((pick, i) => {
    const wrap = document.createElement("div");
    wrap.className = "retrieval-item";
    wrap.style.cssText =
      i > 0
        ? "margin-top:var(--sp-4); padding-top:var(--sp-4); border-top:1px solid var(--line);"
        : "";

    const tag = document.createElement("p");
    tag.className = "retrieval-tag";
    tag.style.cssText = "margin:0 0 var(--sp-2); font-size:0.8rem; color:var(--muted);";
    // Name the LESSON the question comes from, not just the standard code: a
    // student remembers "the box plot day", not "6.DS.5".
    const from = pick.lesson
      ? `<span class="badge badge-indigo">Lesson ${esc(pick.lesson)}</span> `
      : "";
    tag.innerHTML = `${from}<span class="badge badge-indigo">${esc(pick.standard)}</span>`;
    wrap.append(tag);

    renderMultipleChoice(wrap, {
      ...pick.item,
      onAnswer: (isCorrect) => {
        // The review's own outcome drives the schedule. It deliberately does NOT
        // go through state.recordAnswer(): this is not part of today's lesson and
        // must not move today's accuracy or XP.
        try {
          if (canSchedule) signal.recordReview(pick.standard, isCorrect);
          window.NTtelemetry?.track?.("retrieval_review", {
            standard: pick.standard,
            result: isCorrect ? "correct" : "incorrect",
          });
        } catch {
          /* signals are best-effort */
        }
        answered += 1;
        status.textContent =
          answered >= picks.length
            ? "Review done — nice. On to today."
            : `${answered} of ${picks.length} done.`;
        state?.saveResponse?.(phaseId, `retrieval_${pick.standard}`, isCorrect ? "y" : "n");
      },
    });

    list.append(wrap);
  });

  card.append(status);
  host.append(card);
  return picks.length;
}

export default mountRetrievalOpener;
