// ELA template: context-clue hunt, meaning in context, shades of meaning on an ordered scale.
import { announce, h, shuffle } from "../../core/dom.js";
import { deriveExamples, deriveShades, meaningChoices } from "./explore-model.js";
import { choiceTask, exampleSort, feedbackLine, orderTask, panel, useWord } from "./explore-common.js";
import { uid } from "./ui.js";

const STOP = new Set("that this with from they them their there then than have were what when which your into over under about because while would could should these those some each other also very just".split(" "));

/** The passage with the target word marked. */
function passageNode(text, word) {
  const re = new RegExp(`(\\b${word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\w*)`, "i");
  const parts = text.split(re);
  return h("p", { class: "st-v-passage" }, parts.map((p, i) => (i % 2 ? h("mark", { class: "st-v-target" }, p) : p)));
}

export function clueCandidates(e, passage) {
  const clues = e.explore?.ela?.clues || [];
  if (!clues.length) return [];
  const decoys =
    e.explore.ela.decoys ||
    shuffle(
      [...new Set(passage.toLowerCase().match(/[a-z]{4,}/g) || [])].filter((w) => !STOP.has(w) && !e.word.toLowerCase().includes(w) && !clues.some((c) => c.toLowerCase().includes(w))),
      `decoy-${e.id}`,
    ).slice(0, 2);
  return shuffle([...clues.map((text) => ({ text, ok: true })), ...decoys.map((text) => ({ text, ok: false }))], `cl-${e.id}`);
}

function cluePanel(e, passage, cands) {
  const fb = feedbackLine();
  const boxes = cands.map((c) => ({ c, id: uid("cl"), el: h("input", { type: "checkbox", id: "" }) }));
  const list = h("div", { class: "st-v-checks", role: "group", "aria-labelledby": "st-v-cluelab" });
  for (const b of boxes) {
    b.el.id = b.id;
    list.append(h("label", { class: "st-v-checkcard", for: b.id }, b.el, " ", b.c.text));
  }
  const check = h("button", { class: "st-v-btn st-v-primary", type: "button" }, "Check my clues");
  check.addEventListener("click", () => {
    const picked = boxes.filter((b) => b.el.checked);
    const good = picked.filter((b) => b.c.ok).length;
    const bad = picked.length - good;
    const total = cands.filter((c) => c.ok).length;
    for (const b of boxes) b.el.closest("label").dataset.state = b.c.ok ? (b.el.checked ? "right" : "missed") : b.el.checked ? "wrong" : "";
    if (good === total && !bad) {
      fb.show("right", `These clues tell you the meaning: ${cands.filter((c) => c.ok).map((c) => c.text).join("; ")}.`);
      announce("All clues found.");
    } else fb.show("retry", `You found ${good} of ${total} clues${bad ? ` and chose ${bad} that do not help` : ""}. Reread the sentence and look for words that explain ${e.word}.`);
  });
  return panel("Find the context clues", "Which words or phrases help you work out what the highlighted word means? Choose every one that helps.", passageNode(passage, e.word), h("p", { class: "st-v-prompt", id: "st-v-cluelab" }, "Choose the clues."), list, h("p", {}, check), fb.el);
}

export function mountEla(host, { collection, entry: e }) {
  const passage = e.explore?.ela?.passage || e.context;
  const cands = clueCandidates(e, passage);
  const shades = deriveShades(e);
  const examples = deriveExamples(e);
  const panels = [];
  if (cands.length) panels.push(cluePanel(e, passage, cands));
  panels.push(panel("What does it mean here?", "Read the sentence, then choose the meaning that fits.", passageNode(passage, e.word), choiceTask({ prompt: `In this sentence, what does "${e.word}" mean?`, choices: meaningChoices(e, collection).map((c) => ({ ...c, feedback: "That is a different word's meaning. Use the sentence around the word." })), explanation: e.def })));
  if (shades) {
    const items = shades.words.map((w) => ({ label: w }));
    panels.push(panel("Shades of meaning", shades.prompt || "These words are close in meaning but not the same.", orderTask({ prompt: `Tap the words from weakest to strongest. Where does "${e.word}" belong?`, items, seed: `sh-${e.id}` })));
  }
  if (examples.length) panels.push(panel(`Does it fit ${e.word}?`, "Decide whether each example fits the word.", exampleSort({ word: e.word, items: examples })));
  panels.push(panel("Use the word", "Say it, then write it.", useWord(e)));
  host.replaceChildren(...panels);
}
