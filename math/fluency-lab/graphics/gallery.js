// Gallery for the graphics-a components: every kind in explore, build and check mode, with a language toggle.
// ?kind=<kind> shows one kind, ?mode=<mode> one mode, ?lang=es starts in Spanish. State survives a language change.
import { setLang } from "../i18n.js";
import { DEMOS } from "./demos-a/demos.js";
import { mountGraphic } from "./registry.js";

const params = new URLSearchParams(location.search);
const MODES = ["explore", "build", "check"];
const kinds = Object.keys(DEMOS).filter((kind) => !params.get("kind") || params.get("kind") === kind);
const modes = MODES.filter((mode) => !params.get("mode") || params.get("mode") === mode);
const saved = new Map();
const handles = new Map();
let lang = params.get("lang") === "es" ? "es" : "en";

const el = (tag, props = {}, ...kids) => {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(props)) node.setAttribute(key, value);
  node.append(...kids);
  return node;
};
const label = (value) => (typeof value === "string" ? value : value[lang]);

async function mountCard(kind, mode, mount, output) {
  const key = `${kind}:${mode}`;
  handles.get(key)?.destroy();
  const demo = DEMOS[kind].modes[mode];
  const config = {
    ...demo.config,
    mode,
    lang,
    onChange: (state) => {
      saved.set(key, state);
      output.textContent = JSON.stringify(state);
    },
  };
  try {
    const handle = await mountGraphic(DEMOS[kind].kind ?? kind, mount, config);
    if (saved.has(key)) {
      const { correct: _c, checked: _k, ...state } = saved.get(key);
      handle.setState(state);
    }
    if (params.get("state") && !saved.has(key)) handle.setState(JSON.parse(params.get("state")));
    handles.set(key, handle);
    output.textContent = JSON.stringify(handle.getState());
  } catch (error) {
    console.error(error);
    mount.textContent = `Could not load ${kind}: ${error.message}`;
  }
}

async function build() {
  const root = document.getElementById("gallery");
  const pending = [];
  for (const kind of kinds) {
    const demo = DEMOS[kind];
    const grid = el("div", { class: "gal-grid" });
    for (const mode of modes) {
      const mount = el("div", { class: "gal-mount" });
      const output = el("pre");
      const prompt = el("p", { class: "gal-prompt" }, label(demo.modes[mode].prompt));
      prompt.dataset.prompt = `${kind}:${mode}`;
      grid.append(el("article", { class: "gal-card", "data-card": `${kind}:${mode}` }, el("h3", {}, mode), prompt, mount, el("details", {}, el("summary", {}, "State (JSON)"), output)));
      pending.push(() => mountCard(kind, mode, mount, output));
    }
    root.append(el("section", { class: "gal-section", id: kind }, el("h2", {}, label(demo.title)), el("p", {}, label(demo.blurb)), grid));
  }
  await Promise.all(pending.map((run) => run()));
  document.body.dataset.ready = "1";
}

function applyLang(next) {
  lang = next;
  setLang(next, { persist: false });
  for (const button of document.querySelectorAll("[data-lang]")) button.setAttribute("aria-pressed", String(button.dataset.lang === next));
  for (const kind of kinds) {
    const section = document.getElementById(kind);
    section.querySelector("h2").textContent = label(DEMOS[kind].title);
    section.querySelector(":scope > p").textContent = label(DEMOS[kind].blurb);
    for (const mode of modes) section.querySelector(`[data-prompt="${kind}:${mode}"]`).textContent = label(DEMOS[kind].modes[mode].prompt);
  }
}

for (const kind of kinds) document.getElementById("gal-links").append(el("a", { href: `#${kind}` }, label(DEMOS[kind].title)));
for (const button of document.querySelectorAll("[data-lang]")) {
  button.addEventListener("click", async () => {
    if (button.dataset.lang === lang) return;
    applyLang(button.dataset.lang);
    document.body.dataset.ready = "0";
    await Promise.all([...handles.keys()].map((key) => {
      const [kind, mode] = key.split(":");
      const card = document.querySelector(`[data-card="${key}"]`);
      return mountCard(kind, mode, card.querySelector(".gal-mount"), card.querySelector("pre"));
    }));
    document.body.dataset.ready = "1";
  });
}
setLang(lang, { persist: false });
window.__gallery = { handles };
await build();
applyLang(lang);
