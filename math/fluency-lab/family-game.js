// Fact Family Builder: three numbers make four related equations. The learner places number tiles into the
// equation frames, in both orders for the two add (or multiply) sentences, then checks them.
import { shuffle } from "./game-pool.js";
import { t } from "./i18n.js";
import { syncLive } from "./speech.js";

const ROUNDS = 3;
const familyStars = (wrong) => (wrong <= 2 ? 3 : wrong <= 5 ? 2 : 1);
const pick = (list) => list[Math.floor(Math.random() * list.length)];

export const familyOpFor = (grade) => (grade <= 2 ? "+" : "×");

// Numbers [a, b, c] with a ≠ b and a op b = c; Grade 1 stays within 10, Grade 2 within 20.
export function familyNumbers(grade) {
  const op = familyOpFor(grade);
  const limit = grade === 1 ? 10 : grade === 2 ? 20 : grade === 3 ? 10 : 12;
  const options = [];
  for (let a = op === "+" ? 1 : 2; a <= limit; a += 1)
    for (let b = a + 1; b <= limit; b += 1) {
      const c = op === "+" ? a + b : a * b;
      if (op === "×" || c <= limit) options.push([a, b, c]);
    }
  return pick(options);
}

const FRAMES = (op) => [
  { op, id: 0 },
  { op, id: 1 },
  { op: op === "+" ? "−" : "÷", id: 2 },
  { op: op === "+" ? "−" : "÷", id: 3 },
];

const value = (op, x, y) => (op === "+" ? x + y : op === "−" ? x - y : op === "×" ? x * y : y === 0 ? NaN : x / y);

// An equation frame is correct when it uses each of the three numbers once and the arithmetic holds.
export function frameOk(frame, slots, numbers) {
  const [x, y, z] = slots;
  if ([x, y, z].some((s) => s == null)) return false;
  if ([x, y, z].slice().sort((p, q) => p - q).join() !== numbers.slice().sort((p, q) => p - q).join()) return false;
  return value(frame.op, x, y) === z;
}

export function playFamily(host, { grade, calm, finish }) {
  const op = familyOpFor(grade);
  const total = calm ? 2 : ROUNDS;
  let round = 0;
  let numbers = null;
  let slots = [];
  let chosen = null;
  let verdict = null;
  let wrong = 0;
  let timer = null;
  const frames = FRAMES(op);

  function start() {
    numbers = familyNumbers(grade);
    slots = frames.map(() => [null, null, null]);
    chosen = null;
    verdict = null;
    render();
  }

  const slotButton = (f, s) => {
    const v = slots[f][s];
    const label = v == null ? t("Empty") : String(v);
    return `<button type="button" class="gm-slot${v == null ? "" : " filled"}" data-slot="${f}:${s}" aria-label="${t("Equation {n}, spot {m}: {v}", { n: f + 1, m: s + 1, v: label })}">${v == null ? "" : v}</button>`;
  };

  function render() {
    const rows = frames.map((frame, f) => {
      const status = verdict ? (verdict[f] ? " ok" : slots[f].some((x) => x != null) ? " bad" : "") : "";
      return `<li class="gm-eq${status}">${slotButton(f, 0)}<span>${frame.op}</span>${slotButton(f, 1)}<span>=</span>${slotButton(f, 2)}${verdict ? `<em aria-hidden="true">${verdict[f] ? "✓" : slots[f].some((x) => x != null) ? "✗" : ""}</em>` : ""}</li>`;
    });
    host.innerHTML = `<div class="gm-play gm-family">
      <div class="gm-bar"><button type="button" class="tr-back" data-gm-menu>${t("← Games")}</button><b>${t("Fact Family Builder")}</b><span>${t("Round {n} of {m}", { n: round + 1, m: total })}</span></div>
      <p class="gm-ask">${t("These three numbers are a fact family. Build all four equations. Pick a tile, then tap a spot. Tap a filled spot to clear it.")}</p>
      <div class="gm-tiles" role="group" aria-label="${t("Number tiles")}">${numbers.map((n, i) => `<button type="button" class="gm-card q${chosen === i ? " pick" : ""}" data-t="${i}" aria-pressed="${chosen === i}"><span>${n}</span></button>`).join("")}</div>
      <ul class="gm-eqs">${rows.join("")}</ul>
      <p class="gm-note">${verdict ? (verdict.every(Boolean) ? t("All four are right!") : t("Some equations need another look.")) : chosen == null ? t("Pick a number tile.") : t("Now tap a spot in an equation.")}</p>
      <div class="gm-choice"><button type="button" class="tr-go" data-check>${t("Check")}</button>${verdict?.every(Boolean) ? `<button type="button" class="tr-go alt" data-gm-next>${t("Next round")}</button>` : ""}</div></div>`;
    syncLive(host);
  }

  function check() {
    const result = frames.map((frame, f) => frameOk(frame, slots[f], numbers));
    // The two add (or multiply) sentences must be in different orders, so one counts as repeated.
    if (result[0] && result[1] && slots[0][0] === slots[1][0] && slots[0][1] === slots[1][1]) result[1] = false;
    if (result[2] && result[3] && slots[2][0] === slots[3][0] && slots[2][1] === slots[3][1]) result[3] = false;
    verdict = result;
    wrong += result.filter((ok, f) => !ok && slots[f].some((x) => x != null)).length;
    render();
    if (result.every(Boolean)) {
      round += 1;
      if (round >= total) timer = setTimeout(() => finish({ game: "family", stars: familyStars(wrong), missed: [], line: wrong === 1 ? t("{n} wrong equation", { n: wrong }) : t("{n} wrong equations", { n: wrong }) }), 1100);
      else host.querySelector("[data-gm-next]")?.focus();
    }
  }

  host.onclick = (event) => {
    if (event.target.closest("[data-gm-next]")) return start();
    if (event.target.closest("[data-check]")) return check();
    const tile = event.target.closest("[data-t]");
    if (tile) {
      chosen = chosen === Number(tile.dataset.t) ? null : Number(tile.dataset.t);
      verdict = null;
      render();
      host.querySelector(`[data-t="${chosen ?? tile.dataset.t}"]`)?.focus();
      return;
    }
    const slot = event.target.closest("[data-slot]");
    if (!slot) return;
    const [f, s] = slot.dataset.slot.split(":").map(Number);
    verdict = null;
    if (slots[f][s] != null) slots[f][s] = null;
    else if (chosen != null) {
      // Within one equation each number is used once (the three numbers are always different).
      if (slots[f].includes(numbers[chosen])) {
        render();
        return;
      }
      slots[f][s] = numbers[chosen];
      chosen = null;
    }
    render();
    host.querySelector(`[data-slot="${f}:${s}"]`)?.focus();
  };
  start();
  return () => {
    clearTimeout(timer);
    host.onclick = null;
  };
}
