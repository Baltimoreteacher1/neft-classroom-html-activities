// "Real-world check" cards inside the practice studio steps: every
// <section class="wp-inline" data-wp-lesson="6-5" data-wp-step="0"> gets that lesson's steps[n] problem
// from /math/word-problems/unit-<n>.json, drawn by word-problems-card.mjs. Solved cards are remembered
// on this device, separately from the studio's own progress.
import { mountProblem } from "./word-problems-card.mjs";

const STORE = "ewl_word_problems_steps_v1";
const read = () => {
  try {
    return JSON.parse(localStorage.getItem(STORE) || "{}") || {};
  } catch {
    return {};
  }
};
const save = (/** @type {string} */ key) => {
  try {
    const all = read();
    all[key] = 1;
    localStorage.setItem(STORE, JSON.stringify(all));
  } catch {
    /* storage blocked: the card still works, it just forgets */
  }
};

async function boot() {
  const hosts = /** @type {HTMLElement[]} */ ([...document.querySelectorAll(".wp-inline[data-wp-lesson]")]);
  if (!hosts.length) return;
  const lesson = /** @type {string} */ (hosts[0].dataset.wpLesson);
  if (!/^\d+-\d+$/.test(lesson)) return;
  const v = hosts[0].dataset.wpV || "";
  let set;
  try {
    const res = await fetch(`/math/word-problems/unit-${lesson.split("-")[0]}.json?v=${v}`);
    set = (await res.json())[lesson];
  } catch {
    set = null;
  }
  const solved = read();
  for (const host of hosts) {
    const n = Number(host.dataset.wpStep);
    const p = set?.steps?.[n];
    const slot = /** @type {HTMLElement | null} */ (host.querySelector("[data-wp-host]"));
    if (!p || !slot) {
      host.hidden = true;
      continue;
    }
    const key = `${lesson}:${n}`;
    mountProblem(slot, p, {
      id: `wpi-${n}`,
      solved: !!solved[key],
      example: set?.example,
      onSolved: () => save(key),
    });
    host.hidden = false;
  }
}

boot();
