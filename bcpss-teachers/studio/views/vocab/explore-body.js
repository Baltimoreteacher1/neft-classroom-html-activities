// Arts (see, think, wonder) and movement (cue cards) templates.
import { announce, h } from "../../core/dom.js";
import { copyText } from "../../core/actions.js";
import { deriveCues, deriveExamples } from "./explore-model.js";
import { exampleSort, panel, stepper, useWord } from "./explore-common.js";
import { altBlock, visualSvg } from "./visual.js";
import { speakButton, uid } from "./ui.js";

function altToggle(spec) {
  const block = altBlock(spec, false);
  const btn = h("button", { class: "st-v-btn st-v-quiet", type: "button", "aria-expanded": "false" }, "Show picture description");
  btn.addEventListener("click", () => {
    block.hidden = !block.hidden;
    btn.setAttribute("aria-expanded", String(!block.hidden));
    btn.textContent = block.hidden ? "Show picture description" : "Hide picture description";
  });
  return h("div", {}, h("p", {}, btn), block);
}

const wordIn = (word, text) => new RegExp(`\\b${word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`, "i").test(text);

export function mountArts(host, { entry: e }) {
  const zoomId = uid("zoom");
  const art = h("div", { class: "st-v-zoomwrap", tabindex: "0", role: "group", "aria-label": "Picture. Scroll to look closer when zoomed." }, h("div", { class: "st-v-zoomart", html: e.visual ? visualSvg(e.visual) : "" }));
  const zoom = h("input", { id: zoomId, type: "range", min: "1", max: "3", step: "0.5", value: "1", "aria-valuetext": "Zoom 1 times" });
  zoom.addEventListener("input", () => {
    art.firstChild.style.setProperty("--zoom", zoom.value);
    zoom.setAttribute("aria-valuetext", `Zoom ${zoom.value} times`);
  });
  const prompts = [
    ["see", "See", "What do you see? Name colors, shapes, lines and details.", "I see..."],
    ["think", "Think", `What do you think is happening, or what idea does it show about ${e.word}?`, "I think... because..."],
    ["wonder", "Wonder", "What do you wonder? What would you ask the artist?", "I wonder..."],
  ];
  const areas = prompts.map(([k, title, q, ph]) => ({ k, title, q, id: uid(k), el: h("textarea", { class: "st-v-textarea", rows: "3", maxlength: "500", placeholder: ph }) }));
  const status = h("p", { class: "st-v-fb", role: "status", "aria-live": "polite", hidden: true });
  const note = () => {
    const all = areas.map((a) => a.el.value).join(" ");
    status.hidden = !all.trim();
    status.dataset.kind = wordIn(e.word, all) ? "right" : "retry";
    status.textContent = wordIn(e.word, all) ? `You used the word "${e.word}" in your description.` : `Try to use the word "${e.word}" in at least one box.`;
  };
  for (const a of areas) {
    a.el.id = a.id;
    a.el.addEventListener("input", note);
  }
  const copy = h("button", { class: "st-v-btn", type: "button", onclick: async () => announce((await copyText(areas.map((a) => `${a.title}: ${a.el.value}`).join("\n"))) ? "Your notes were copied." : "Could not copy.") }, "Copy my notes");
  const examples = deriveExamples(e);
  host.replaceChildren(
    panel("Look closely", "Zoom in and look for details.", e.visual ? h("div", {}, art, h("label", { for: zoomId, class: "st-v-label" }, "Zoom"), zoom, altToggle(e.visual)) : h("p", {}, e.noVisualReason || "")),
    panel("See, think, wonder", `Describe it. Try to use the word "${e.word}".`, ...areas.map((a) => h("div", { class: "st-v-stw" }, h("label", { for: a.id, class: "st-v-label" }, h("strong", {}, a.title), ` ${a.q}`), a.el)), status, h("p", {}, copy)),
    examples.length ? panel(`Does it fit ${e.word}?`, "Decide whether each example fits the word.", exampleSort({ word: e.word, items: examples })) : null,
    panel("Use the word", "", useWord(e)),
  );
}

export function mountMovement(host, { entry: e }) {
  const cues = deriveCues(e);
  const tried = new Set();
  const progress = h("p", { class: "st-v-fb", role: "status", "aria-live": "polite" }, `0 of ${cues.length} cues practiced.`);
  const view = stepper({
    steps: cues.map((c, i) => ({ label: `Cue ${i + 1}`, ...c })),
    label: "Cue",
    renderStep: (c, i, n) => {
      const id = uid("tried");
      const box = h("input", { type: "checkbox", id, checked: tried.has(i) });
      box.addEventListener("change", () => {
        if (box.checked) tried.add(i);
        else tried.delete(i);
        progress.textContent = `${tried.size} of ${n} cues practiced.`;
      });
      return h("div", { class: "st-v-stepcard st-v-cue" }, h("p", { class: "st-v-stepcount" }, `Cue ${i + 1} of ${n}`), h("p", { class: "st-v-cuetext" }, c.cue, " ", speakButton(c.cue, { label: `Hear cue ${i + 1}` })), c.detail ? h("p", { class: "st-v-stepdetail" }, c.detail) : null, h("label", { class: "st-v-check", for: id }, box, " I tried this cue"));
    },
  });
  const examples = deriveExamples(e);
  host.replaceChildren(
    panel("Practice the cues", `Say each cue, then do the movement or the action for ${e.word}.`, h("div", { class: "st-v-split" }, e.visual ? h("div", { class: "st-v-fig-art st-v-fig-large", html: visualSvg(e.visual), role: "img", "aria-label": e.visual.alt }) : null, h("div", {}, view, progress))),
    panel("Give your partner feedback", "Use these frames with a partner.", h("ul", { class: "st-v-frames" }, h("li", {}, `I noticed you used ${e.word} when...`), h("li", {}, "One thing to try next time is..."))),
    examples.length ? panel(`Does it fit ${e.word}?`, "Decide whether each example fits the word.", exampleSort({ word: e.word, items: examples })) : null,
    panel("Use the word", "", useWord(e)),
  );
}
