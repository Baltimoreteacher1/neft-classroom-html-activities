// Social studies template: sequence and compare events on a timeline, locate places on a map, judge sources, name relationships.
import { h, shuffle } from "../../core/dom.js";
import { deriveExamples, derivePlaces, deriveSources } from "./explore-model.js";
import { choiceTask, exampleSort, orderTask, panel, stepper, useWord } from "./explore-common.js";
import { visualFigure } from "./visual.js";

const events = (e) => (e.visual?.kind === "timeline" ? [...(e.visual.events || [])].sort((a, b) => a.at - b.at) : []);

function timelinePanels(e, evs) {
  const out = [panel("Put the events in order", "Tap the events from earliest to latest.", orderTask({ prompt: "Which happened first? Then which came next?", items: evs.map((v) => ({ label: v.label, detail: v.detail })), seed: `tl-${e.id}` }))];
  const pairs = evs.length > 2 ? [[0, 2], [1, evs.length - 1]] : [[0, 1]];
  const qs = pairs.map(([a, b], k) => {
    const flip = k % 2 === 1;
    const choices = shuffle([{ text: evs[a].label, ok: true }, { text: evs[b].label, ok: false, feedback: "That one came later on the timeline." }], `ba-${e.id}-${k}`);
    return choiceTask({ prompt: `Look at the timeline. Which happened first: ${flip ? evs[b].label : evs[a].label} or ${flip ? evs[a].label : evs[b].label}?`, choices, explanation: `${evs[a].label} came before ${evs[b].label}.` });
  });
  out.push(panel("Before or after?", "Use the timeline to compare two events.", ...qs));
  return out;
}

function mapPanels(e, places) {
  const regions = (e.visual?.regions || []).map((r) => r.label);
  const out = [];
  const noted = places.filter((p) => p.note);
  if (places.length) out.push(panel("Explore the places", "Step through the places on the map.", h("div", { class: "st-v-split" }, visualFigure(e.visual, { cls: "st-v-fig-large" }), stepper({ steps: places.map((p) => ({ label: p.region, detail: p.note })), label: "Place", renderStep: (s) => h("div", { class: "st-v-stepcard" }, h("h4", { class: "st-v-steptitle" }, s.label), h("p", { class: "st-v-stepdetail" }, s.detail || "Find this place on the map.")) }))));
  if (noted.length && regions.length > 2) {
    const q = (p, i) => {
      const names = shuffle([p.region, ...shuffle(regions.filter((r) => r !== p.region), `plw-${e.id}-${i}`).slice(0, 2)], `pl-${e.id}-${i}`);
      return choiceTask({ prompt: p.note, choices: names.map((r) => ({ text: r, ok: r === p.region, feedback: "That place does not match the clue." })), explanation: `${p.region}.` });
    };
    out.push(panel("Which place is it?", "Use the clue to choose the place.", ...noted.slice(0, 3).map(q)));
  }
  return out;
}

function sourcePanels(e, sources) {
  const qs = sources.map((s, i) => choiceTask({ prompt: `Source ${i + 1}: ${s.text}`, choices: [{ text: "Primary source: made at the time by someone who was there", ok: s.type === "primary", feedback: "Think about who made it and when." }, { text: "Secondary source: made later by someone studying the past", ok: s.type === "secondary", feedback: "Think about who made it and when." }], explanation: s.why || (s.type === "primary" ? "It was made at the time." : "It was made later, to explain the past.") }));
  return qs.length ? [panel("Judge the sources", "Decide what kind of source each one is.", ...qs)] : [];
}

function relationPanel(e) {
  const rel = e.explore?.social?.relations || [];
  if (!rel.length) return null;
  const labels = [...new Set(rel.map((r) => r.label))];
  const qs = rel.map((r, i) => {
    const wrong = labels.filter((l) => l !== r.label);
    const choices = shuffle([{ text: r.label, ok: true }, ...(wrong.length ? wrong : ["They are not connected."]).slice(0, 2).map((text) => ({ text, ok: false, feedback: "Reread both ideas and how they are connected." }))], `rel-${e.id}-${i}`);
    return choiceTask({ prompt: `How are "${r.from}" and "${r.to}" connected?`, choices, explanation: `${r.from} ${r.label} ${r.to}.` });
  });
  return panel("How are they connected?", "Name the relationship between two ideas.", ...qs);
}

export function mountSocial(host, { entry: e }) {
  const evs = events(e);
  const places = e.visual?.kind === "map" ? derivePlaces(e) : [];
  const sources = deriveSources(e);
  const examples = deriveExamples(e);
  const panels = [];
  if (evs.length >= 2) panels.push(...timelinePanels(e, evs));
  if (places.length) panels.push(...mapPanels(e, places));
  panels.push(...sourcePanels(e, sources));
  const rel = relationPanel(e);
  if (rel) panels.push(rel);
  if (!panels.length && e.visual) panels.push(panel("Look closely", `What does the picture show about ${e.word}?`, visualFigure(e.visual, { cls: "st-v-fig-large" })));
  if (examples.length) panels.push(panel(`Does it fit ${e.word}?`, "Decide whether each example fits the word.", exampleSort({ word: e.word, items: examples })));
  panels.push(panel("Use the word", "Say it, then write it.", useWord(e)));
  host.replaceChildren(...panels);
}
