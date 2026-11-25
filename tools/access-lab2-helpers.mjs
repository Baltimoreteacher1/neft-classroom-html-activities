// Shared test helpers for the ACCESS Practice Lab 2.0 engine tests. Not a test file.
import { DEMO_ITEMS } from "../shared/access-lab2/demo-items.js";

export const HUMAN = Object.freeze({
  name: "Test Reviewer",
  role: "pedagogy",
  date: "2026-11-25",
  actor: "human",
});

/** A copy of the demo items with the given review state. Review is a human act; this only simulates one in tests. */
export const withState = (items, reviewState) =>
  items.map((it) => ({
    ...it,
    reviewState,
    reviewers: reviewState === "reviewed" ? [{ ...HUMAN }] : [],
  }));

export const reviewedDemo = () => withState(DEMO_ITEMS, "reviewed");
export const clone = (v) => JSON.parse(JSON.stringify(v));

/** The best possible answer to an item (key or all checks). */
export function bestAnswer(item) {
  if (item.scoring.type === "key") return { response: item.scoring.key };
  return { checks: Object.fromEntries(item.scoring.rubric.map((c) => [c.id, true])) };
}

/** A clearly wrong answer to an item (wrong response or no checks). */
export function worstAnswer(item) {
  if (item.scoring.type === "key") {
    const m = item.response.mode;
    if (m === "select")
      return {
        response: item.response.constraints.options.find((o) => o.id !== item.scoring.key).id,
      };
    if (m === "multi")
      return {
        response: [
          item.response.constraints.options.find((o) => !item.scoring.key.includes(o.id)).id,
        ],
      };
    if (m === "order") return { response: [...item.scoring.key].reverse() };
    return { response: Object.fromEntries(Object.keys(item.scoring.key).map((k) => [k, "nope"])) };
  }
  return { checks: Object.fromEntries(item.scoring.rubric.map((c) => [c.id, false])) };
}
