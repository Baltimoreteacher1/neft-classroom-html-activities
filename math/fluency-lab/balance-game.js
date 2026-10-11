// Balance It: a scale shows one side as a problem and the other as a part plus a missing number. The learner
// picks the number that balances it. The beam tilts toward the heavier side after each try, so the scale gives
// direction ("too small" or "too big") but never the answer.
import { answerOf, cardText, gameProblem, shuffle } from "./game-pool.js";
import { t } from "./i18n.js";
import { canSpeak, speak, syncLive } from "./speech.js";
import { mathText } from "./trail-pictures.js";

const ROUNDS = 5;
const balanceStars = (wrong) => (wrong <= 2 ? 3 : wrong <= 5 ? 2 : 1);
const MAX_TILT = 14;

// V (the left pan) is split as part + missing; the learner finds the missing number.
export function balanceRound(grade, stop) {
  for (let tries = 0; tries < 300; tries += 1) {
    const item = gameProblem(grade, stop);
    const total = answerOf(item);
    if (!Number.isInteger(total) || total < 6 || total > 400) continue;
    const step = total > 40 ? 10 : total > 15 ? 5 : 1;
    const part = Math.max(step, Math.floor((total * 0.55) / step) * step);
    const missing = total - part;
    if (missing < 1) continue;
    const decoys = [missing + 1, missing - 1, missing + step, missing - step, missing * 2, missing + 2].filter((n) => n > 0 && n !== missing);
    const choices = shuffle([missing, ...shuffle([...new Set(decoys)]).slice(0, 3)]);
    return { item, total, part, missing, choices };
  }
  throw new Error(`Could not build a Balance It round for grade ${grade} stop ${stop}`);
}

// Beam geometry: positive tilt lowers the right pan. Pans hang from the beam ends and stay level.
export function scaleSvg({ left, rightText, tilt }) {
  const rad = (tilt * Math.PI) / 180;
  const half = 110;
  const ends = [
    [180 - half * Math.cos(rad), 52 - half * Math.sin(rad)],
    [180 + half * Math.cos(rad), 52 + half * Math.sin(rad)],
  ];
  const pan = ([x, y], text) => `<line x1="${x}" y1="${y}" x2="${x - 40}" y2="${y + 38}" stroke="#4a5a70" stroke-width="2"/><line x1="${x}" y1="${y}" x2="${x + 40}" y2="${y + 38}" stroke="#4a5a70" stroke-width="2"/><rect x="${x - 56}" y="${y + 38}" width="112" height="36" rx="10" fill="#fff" stroke="#13233a" stroke-width="3"/><text x="${x}" y="${y + 63}" text-anchor="middle" font-size="19" font-weight="700" fill="#13233a">${text}</text>`;
  return `<svg class="gm-scale" viewBox="0 0 360 150" role="img" aria-hidden="true"><polygon points="180,52 162,138 198,138" fill="#8aa0bd"/><line x1="${ends[0][0]}" y1="${ends[0][1]}" x2="${ends[1][0]}" y2="${ends[1][1]}" stroke="#13233a" stroke-width="7" stroke-linecap="round"/><circle cx="180" cy="52" r="8" fill="#f3b61f" stroke="#13233a" stroke-width="3"/>${pan(ends[0], left)}${pan(ends[1], rightText)}</svg>`;
}

const esc = (value) => String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");

export function playBalance(host, { grade, stop, calm, finish }) {
  const total = calm ? 3 : ROUNDS;
  const rounds = Array.from({ length: total }, () => balanceRound(grade, stop));
  let at = 0;
  let wrong = 0;
  let tried = new Map();
  let solved = false;
  let note = "";
  let tilt = 0;
  const missed = new Map();
  let timer = null;
  const current = () => rounds[at];

  function render(focus) {
    const round = current();
    const rightValue = round.part + (solved ? round.missing : 0);
    const rightText = solved ? `${round.part} + ${round.missing}` : `${round.part} + ?`;
    const gap = round.total - rightValue;
    tilt = solved ? 0 : -Math.sign(gap) * MAX_TILT;
    const lastTry = [...tried.keys()].at(-1);
    if (!solved && lastTry != null) tilt = -Math.sign(round.total - (round.part + lastTry)) * Math.min(MAX_TILT, 4 + Math.abs(round.total - (round.part + lastTry)) / Math.max(1, round.total) * 20);
    host.innerHTML = `<div class="gm-play gm-balance">
      <div class="gm-bar"><button type="button" class="tr-back" data-gm-menu>${t("← Games")}</button><b>${t("Balance It")}</b><span>${t("Problem {a} of {b}", { a: at + 1, b: total })}</span></div>
      <p class="gm-ask">${t("Make the scale balance. Which number goes in the right pan?")}</p>
      ${canSpeak() ? `<button type="button" class="tr-tool" data-gm-read>${t("Read to me")}</button>` : ""}
      <div class="gm-scale-wrap" role="img" aria-label="${esc(t("Left side: {a}. Right side: {b}.", { a: cardText(round.item), b: rightText }))}">${scaleSvg({ left: esc(cardText(round.item)), rightText: esc(rightText), tilt })}</div>
      <div class="gm-cards cols-4" role="group" aria-label="${t("Number tiles")}">${round.choices.map((n) => `<button type="button" class="gm-card q${tried.has(n) ? " nope" : ""}${solved && n === round.missing ? " done" : ""}" data-b="${n}" ${tried.has(n) || solved ? "disabled" : ""}><span>${n}</span></button>`).join("")}</div>
      <p class="gm-note">${esc(note)}</p></div>`;
    if (focus) host.querySelector("[data-b]:not(:disabled)")?.focus();
    syncLive(host);
  }

  function advance() {
    at += 1;
    tried = new Map();
    solved = false;
    note = "";
    if (at >= total) {
      timer = setTimeout(() => finish({ game: "balance", stars: balanceStars(wrong), missed: [...missed.values()], line: wrong === 1 ? t("{n} wrong try", { n: wrong }) : t("{n} wrong tries", { n: wrong }) }), 500);
      return;
    }
    render(true);
  }

  host.onclick = (event) => {
    const round = current();
    if (event.target.closest("[data-gm-read]")) return speak(`${cardText(round.item)}`);
    const tile = event.target.closest("[data-b]");
    if (!tile || solved) return;
    const n = Number(tile.dataset.b);
    if (n === round.missing) {
      solved = true;
      note = t("Balanced!");
      render();
      timer = setTimeout(advance, 1000);
      return;
    }
    wrong += 1;
    missed.set(round.item.question, round.item);
    tried.set(n, true);
    note = round.part + n < round.total ? t("The left side is still heavier. Try a bigger number.") : t("The right side is heavier now. Try a smaller number.");
    render(true);
  };
  render();
  return () => {
    clearTimeout(timer);
    host.onclick = null;
  };
}
