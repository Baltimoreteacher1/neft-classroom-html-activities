// The explanation card as something to watch and touch: the problem, its model, and one step at a time.
// The active step lights up and the numbers it uses light up in the problem, so students see which
// part of the problem each step is about. Steps, pictures and "Your turn" boxes come from stepsBlock.
import { mathText, stepsBlock } from "./trail-pictures.js";
import { t } from "./i18n.js";

const esc = (value) =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
const NUMBER = /\d[\d,]*(?:\.\d+)?/g;
// Digits right after "^" are an exponent, not a quantity in the problem.
const QUANTITY = /((?<!\^-?)\d[\d,]*(?:\.\d+)?)/;
// "1, 2, 3, 4" is a list of facts, not quantities the step is about, so its numbers never link to the problem.
const LIST_RUN = /(\d+(?:\.\d+)?(?:,\s+\d+(?:\.\d+)?){2,})/;
const players = new Map();
let counter = 0;

const key = (text) => String(text).replaceAll(",", "");

function problemLine(question) {
  return String(question)
    .split(QUANTITY)
    .map((piece, i) =>
      i % 2
        ? `<span class="sp-num" data-n="${esc(key(piece))}">${esc(piece)}</span>`
        : mathText(piece),
    )
    .join("");
}

// `cap` limits how many steps can ever open (live help passes peekCap so the answer step stays shut).
export function stepPlayer(item, { start = 1, cap = Infinity } = {}) {
  const steps = item?.steps || [];
  if (steps.length < 2) return "";
  const id = `sp-${++counter}`;
  const limit = Math.min(cap, steps.length);
  players.set(id, { steps, shown: Math.min(start, limit), active: null, cap: limit });
  return `<section class="step-player" data-step-player="${id}" aria-label="${esc(t("Step by step"))}">
    <p class="sp-problem"><span class="sp-label">${esc(t("Problem"))}</span> <span class="sp-q">${problemLine(item.question)}</span></p>
    <p class="sp-hint">${esc(t("Tap a step to see it in the problem. Tap Next step to keep going."))}</p>
    <div class="sp-steps" data-sp-steps>${stepsBlock(steps, Math.min(start, limit), { id, cap: limit })}</div>
    <p class="sp-live tr-sr" role="status" aria-live="polite"></p>
  </section>`;
}

function unmark(root) {
  for (const mark of root.querySelectorAll("mark.sp-link"))
    mark.replaceWith(mark.ownerDocument.createTextNode(mark.textContent));
  root.normalize();
}

function markNumbers(text, numbers) {
  const walker = text.ownerDocument.createTreeWalker(text, 4);
  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);
  for (const node of nodes) {
    if (node.parentElement.closest("input, mark, .tr-step-badge")) continue;
    const fragment = node.ownerDocument.createDocumentFragment();
    node.nodeValue.split(LIST_RUN).forEach((chunk, c) => {
      if (c % 2) return void fragment.append(chunk);
      chunk.split(QUANTITY).forEach((piece, i) => {
        if (i % 2 && numbers.has(key(piece))) {
          const mark = node.ownerDocument.createElement("mark");
          mark.className = "sp-link";
          mark.textContent = piece;
          fragment.append(mark);
        } else if (piece) fragment.append(piece);
      });
    });
    node.replaceWith(fragment);
  }
}

// Light up the active step and, in the problem, the numbers it uses.
function light(section) {
  const entry = players.get(section.dataset.stepPlayer);
  if (!entry) return;
  const items = [...section.querySelectorAll(".tr-steps > li")];
  const index = Math.min(entry.active ?? items.length - 1, items.length - 1);
  unmark(section.querySelector("[data-sp-steps]"));
  items.forEach((li, i) => {
    li.classList.toggle("sp-active", i === index);
    li.classList.toggle("sp-done", i < index);
    li.tabIndex = 0;
    li.setAttribute("aria-current", i === index ? "step" : "false");
    const line = li.querySelector(".tr-step-text:not(.tr-fill-row)");
    if (line && !li.querySelector(".step-audio-btn")) {
      const spoken = line.cloneNode(true);
      spoken.querySelector(".tr-step-badge")?.remove();
      line.insertAdjacentHTML(
        "afterend",
        `<button type="button" class="step-audio-btn" data-speak-step="${esc(spoken.textContent)}" aria-label="${esc(t("Listen to step"))}">🔊</button>`,
      );
    }
  });
  const current = items[index];
  if (!current) return;
  const stated = (current.querySelector(".tr-step-text")?.textContent || "").split(LIST_RUN).filter((_, i) => i % 2 === 0).join(" ");
  const used = new Set((stated.match(NUMBER) || []).map(key));
  section
    .querySelectorAll(".sp-num")
    .forEach((span) => span.classList.toggle("sp-lit", used.has(span.dataset.n)));
  const text = current.querySelector(".tr-step-text");
  if (text)
    markNumbers(
      text,
      new Set([...section.querySelectorAll(".sp-num")].map((span) => span.dataset.n)),
    );
  section.querySelector(".sp-live").textContent = t("Step {n} of {total}", {
    n: index + 1,
    total: entry.cap ?? entry.steps.length,
  });
}

export function lightStepPlayers(root) {
  root.querySelectorAll?.("[data-step-player]").forEach(light);
}

// Returns true when the click belonged to a step player.
export function handleStepPlayerClick(target) {
  const section = target.closest?.("[data-step-player]");
  if (!section) return false;
  const entry = players.get(section.dataset.stepPlayer);
  const next = target.closest("button.tr-step-next");
  if (next && entry) {
    entry.shown += 1;
    entry.active = null;
    section.querySelector("[data-sp-steps]").innerHTML = stepsBlock(entry.steps, entry.shown, {
      id: section.dataset.stepPlayer,
      cap: entry.cap,
    });
    light(section);
    section.querySelector("button.tr-step-next")?.focus();
    return true;
  }
  const li = target.closest(".tr-steps > li");
  if (li && entry && !target.closest("input, button")) {
    entry.active = [...li.parentElement.children].indexOf(li);
    light(section);
    return true;
  }
  return false;
}

// A solved "Your turn" row adds its picture; the newest step stays the active one.
export function handleStepPlayerSolved(target) {
  const section = target.closest?.("[data-step-player]");
  if (section) light(section);
}
