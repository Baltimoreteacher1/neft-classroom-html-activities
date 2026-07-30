// retrieval.js — the spaced-review opener ("Remember When").
//
// The curriculum already labels 76 files "spiral", but nothing scheduled
// anything: a review appeared where an author happened to put one, which means
// the students who most needed a second pass at 6.NOS.1 got it on the same day
// as the students who did not. This module is the missing scheduler.
//
// What it asks is decided by NTSignal.dueStandards() — standards whose Leitner
// interval has elapsed on THIS device. What it asks WITH comes from
// data/retrieval-bank.json, which is lifted verbatim from lesson configs that
// validate:math already checked, so nothing here invents mathematics.
//
// Three rules keep it from becoming a chore:
//   - It is capped at MAX_ITEMS. A review that grows without bound stops being
//     an opener and starts being the lesson.
//   - Today's standard is never reviewed. It is about to be taught; asking it
//     now measures nothing and spends the student's attention twice.
//   - Nothing renders at all when nothing is due. A student on their first
//     lesson sees no empty "you have 0 reviews" card.

import { renderMultipleChoice } from "../components/multiple-choice.js";

const MAX_ITEMS = 3;
let bankPromise = null;

/** Fetch (once) the review bank. Resolves to {} when unavailable. */
export function loadRetrievalBank() {
  if (!bankPromise) {
    bankPromise = fetch("/data/retrieval-bank.json", { credentials: "omit" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => (d && d.bank) || {})
      .catch(() => ({}));
  }
  return bankPromise;
}

/**
 * Choose the review items for this sitting.
 *
 * Pure and clock-injectable so the schedule can be tested without waiting three
 * weeks. `due` is whatever NTSignal.dueStandards() returned; `bank` is the item
 * bank; `exclude` is today's standard.
 */
export function selectReviewItems(due, bank, { exclude = "", max = MAX_ITEMS, seed = 0 } = {}) {
  const picked = [];
  for (const entry of due || []) {
    if (picked.length >= max) break;
    const standard = entry.standard;
    if (!standard || standard === exclude) continue;
    const items = bank?.[standard];
    if (!Array.isArray(items) || !items.length) continue;
    // Rotate through the bank by review count rather than picking at random, so
    // a student who keeps missing a standard meets a DIFFERENT question each
    // time instead of memorising one card's answer position.
    const index = (Number(entry.box) || 0) + seed;
    picked.push({ standard, item: items[index % items.length], box: entry.box || 0 });
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
  if (!signal || typeof signal.dueStandards !== "function") return 0;

  // Ask the schedule BEFORE fetching the bank: on the overwhelming majority of
  // page loads nothing is due, and that path should cost no network at all.
  const due = signal.dueStandards(MAX_ITEMS + 2);
  if (!due.length) return 0;

  const bank = await loadRetrievalBank();
  const picks = selectReviewItems(due, bank, { exclude: config?.standard || "" });
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
  status.style.cssText = "margin:var(--sp-3) 0 0; font-weight:700;";

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
    tag.innerHTML = `<span class="badge badge-indigo">${esc(pick.standard)}</span>`;
    wrap.append(tag);

    renderMultipleChoice(wrap, {
      ...pick.item,
      onAnswer: (isCorrect) => {
        // The review's own outcome drives the schedule. It deliberately does NOT
        // go through state.recordAnswer(): this is not part of today's lesson and
        // must not move today's accuracy or XP.
        try {
          signal.recordReview(pick.standard, isCorrect);
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
