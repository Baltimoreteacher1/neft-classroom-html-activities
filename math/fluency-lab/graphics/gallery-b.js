// Gallery for the six graphics-b kinds: every kind in every mode, language toggle, and a state dump the browser
// test reads. window.__gb exposes the live handles and the onChange log.
import { setLang } from "../i18n.js";
import { button, h, segmented } from "./b-core.js";
import { DEMOS, KIND_TITLES } from "./demos-b/index.js";
import { mountGraphic } from "./registry.js";

const params = new URLSearchParams(location.search);
const lang = params.get("lang") === "es" ? "es" : "en";
setLang(lang, { persist: false });
const only = params.get("kind");
const startMode = ["explore", "build", "check"].includes(params.get("mode")) ? params.get("mode") : "explore";
const kinds = Object.keys(DEMOS).filter((kind) => !only || kind === only);
const log = {};
const handles = {};
window.__gb = { handles, log, ready: false };

const MODE_LABELS = { explore: "Explore", build: "Build", check: "Check" };
async function mountDemo(kind, mode, stage, dump) {
  handles[kind]?.destroy();
  log[kind] = [];
  const config = { ...DEMOS[kind][mode], mode, lang };
  config.onChange = (state, meta) => {
    log[kind].push({ state, meta });
    dump.textContent = JSON.stringify({ state, meta });
  };
  handles[kind] = await mountGraphic(kind, stage, config);
  dump.textContent = JSON.stringify({ state: handles[kind].getState() });
}

async function addCard(kind) {
  const stage = h("div", { class: "gg-stage", "data-kind": kind });
  const dump = h("pre", { class: "gg-state", "data-state": kind, "aria-label": `${kind} state` });
  const modes = h("div", { class: "gg-modes", role: "group", "aria-label": "Mode" });
  const pick = async (mode) => {
    for (const b of modes.children) b.setAttribute("aria-pressed", String(b.dataset.mode === mode));
    stage.dataset.mode = mode;
    await mountDemo(kind, mode, stage, dump);
  };
  for (const mode of Object.keys(DEMOS[kind]))
    modes.append(button(MODE_LABELS[mode], () => pick(mode), { "data-mode": mode, "aria-pressed": "false" }));
  document.getElementById("gg-list").append(
    h("section", { class: "gg-card", id: kind }, h("header", {}, h("h2", { text: KIND_TITLES[kind] }), modes), stage, h("details", {}, h("summary", { text: "State" }), dump)),
  );
  await pick(Object.hasOwn(DEMOS[kind], startMode) ? startMode : "explore");
}

document.getElementById("gg-nav").append(...kinds.map((kind) => h("a", { href: `#${kind}`, text: KIND_TITLES[kind] })));
document.getElementById("gg-lang").append(
  segmented("Language", [["en", "English"], ["es", "Español"]], lang, (next) => {
    params.set("lang", next);
    location.search = params.toString();
  }),
);
for (const kind of kinds) await addCard(kind);
window.__gb.ready = true;
