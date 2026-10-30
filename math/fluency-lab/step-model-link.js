// Links the picture beside a worked example to the step the learner is on. For the area model (multi-digit
// multiplication) the step that splits a number marks the split, each partial-product step lights its own part with a
// "Step n of N" tag, finished parts get a check, and the adding step lights the total with arrows up from the parts.
// Tapping any step shows that step in the picture. Other pictures keep their own behaviour.
// It reads the page rather than the app's state, so the Learn tab and the practice coach share it. A mutation
// observer re-applies it whenever steps or the model are redrawn; a signature check keeps that from looping.
import { t } from "./i18n.js";

const PRODUCT = /(\d+(?:\.\d+)?) × (\d+(?:\.\d+)?) =/;
const norm = (text) => String(text).replaceAll(",", "").replace(/\s+/g, " ").trim();
const SURFACES = [
  { steps: "[data-learn-steps] .tr-steps", model: ".learn-simple", line: ".tr-step-text" },
  {
    steps: "#guided-steps",
    model: "#problem-visual-scaffold",
    line: ".guided-step-text, .tr-step-text",
  },
];

// The step's own words, without its role tag ("Friendly start") or the audio button.
const stepLine = (li, selector) => {
  const line = li.querySelector(selector)?.cloneNode(true);
  if (!line) return "";
  line.querySelectorAll(".tr-step-badge, .guided-step-badge, button").forEach((node) => node.remove());
  return norm(line.textContent).replace(/^Your turn:\s*/, "");
};

function kindOf(text) {
  if (/^Split\b/i.test(text)) return "split";
  if (/^Add\b/i.test(text)) return "sum";
  const product = PRODUCT.exec(text);
  return product ? { a: product[1], b: product[2] } : "other";
}

function captionFor(kind, text, index, total) {
  const tag = t("Step {n} of {total}", { n: index + 1, total });
  if (kind === "split") return `${tag} · ${t("Split the number")} ↓`;
  if (kind === "sum") return `${tag} · ${t("Add the parts")} ↑`;
  if (kind === "other") return tag;
  return `${tag} · ${t("Work on")} ${text.replace(/ =.*$/, "")} ↓`;
}

function clearArea(area) {
  area.classList.remove("link-split", "link-sum");
  for (const part of area.querySelectorAll(".tp-part"))
    part.classList.remove("step-dim", "step-focus", "step-done");
  area.parentElement?.querySelector(".tp-sum")?.classList.remove("step-focus");
  area.parentElement?.querySelector("[data-step-caption]")?.remove();
}

function applyArea(area, steps, active, total, selector) {
  clearArea(area);
  const parts = [...area.querySelectorAll(".tp-part")];
  const lines = steps.map((li) => stepLine(li, selector));
  const kind = kindOf(lines[active]);
  const label = (part) => norm(part.querySelector("b")?.textContent || "");
  const owner = (line) => {
    const k = kindOf(line);
    if (typeof k !== "object") return -1;
    return parts.findIndex((part) => [`${k.a} × ${k.b}`, `${k.b} × ${k.a}`].includes(label(part)));
  };
  const finished = new Set(
    lines
      .slice(0, active)
      .map(owner)
      .filter((index) => index >= 0),
  );
  parts.forEach((part, index) => {
    if (finished.has(index)) part.classList.add("step-done");
  });
  if (kind === "split") area.classList.add("link-split");
  else if (kind === "sum") {
    area.classList.add("link-sum");
    area.parentElement.querySelector(".tp-sum")?.classList.add("step-focus");
    parts.forEach((part) => part.classList.add("step-done"));
  } else if (typeof kind === "object") {
    const at = owner(lines[active]);
    parts.forEach((part, index) => {
      if (index === at) part.classList.add("step-focus");
      else if (!finished.has(index)) part.classList.add("step-dim");
    });
  }
  const caption = area.ownerDocument.createElement("p");
  caption.className = "step-caption";
  caption.dataset.stepCaption = "";
  caption.textContent = captionFor(kind, lines[active], active, total);
  area.before(caption);
}

export function sync() {
  for (const surface of SURFACES) {
    const list = document.querySelector(surface.steps);
    const model = document.querySelector(surface.model);
    const area = model?.querySelector('[data-live="area"] .tp-area');
    if (!list || !area) continue;
    const steps = [...list.querySelectorAll(":scope > li")];
    if (!steps.length) continue;
    const count = steps.length;
    if (Number(list.dataset.seenSteps) !== count) {
      list.dataset.seenSteps = String(count);
      delete list.dataset.activeStep;
    }
    const active = Math.min(Number(list.dataset.activeStep ?? count - 1), count - 1);
    steps.forEach((li, index) => li.classList.toggle("step-linked", index === active));
    const shownTotal =
      Number(list.closest("[data-total-steps]")?.dataset.totalSteps) ||
      Number(
        /of (\d+) steps/.exec(document.querySelector("#guided-step-count")?.textContent || "")?.[1],
      ) ||
      count;
    const signature = [
      active,
      count,
      steps.map((li) => li.textContent.length).join("."),
      area.textContent.length,
      area.querySelectorAll("input").length,
    ].join("|");
    if (area.dataset.linkSignature === signature && model.querySelector("[data-step-caption]"))
      continue;
    area.dataset.linkSignature = signature;
    applyArea(area, steps, active, Math.max(shownTotal, count), surface.line);
  }
}

let frame = 0;
const schedule = () => {
  if (frame) return;
  frame = requestAnimationFrame(() => {
    frame = 0;
    sync();
  });
};

export function initStepModelLink(roots) {
  // A page without observers (a bare test DOM) simply has no linked picture.
  if (typeof MutationObserver === "undefined" || typeof requestAnimationFrame === "undefined") return;
  const observer = new MutationObserver(schedule);
  for (const root of roots) if (root) observer.observe(root, { childList: true, subtree: true });
  // Tapping a step shows that step in the picture.
  document.addEventListener("click", (event) => {
    if (event.target.closest("input, button, a")) return;
    for (const surface of SURFACES) {
      const li = event.target.closest(`${surface.steps} > li`);
      if (!li) continue;
      const list = li.parentElement;
      list.dataset.activeStep = String([...list.children].indexOf(li));
      const area = document.querySelector(`${surface.model} [data-live="area"] .tp-area`);
      if (area) delete area.dataset.linkSignature;
      schedule();
      return;
    }
  });
  schedule();
}
