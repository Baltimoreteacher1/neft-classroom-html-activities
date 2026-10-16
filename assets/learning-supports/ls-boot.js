// Entry point for the student Learning Supports. One script tag on a page turns
// on everything in this folder:
//
//   <script type="module" src="/assets/learning-supports/ls-boot.js"></script>
//
// It loads the saved choices, applies the look (calm, spacing, contrast, larger
// targets), and mounts the one panel. Heavier parts (one-problem-at-a-time and
// voice answers) are only fetched once a student turns them on.

import { installCalm } from "./ls-calm.js";
import { createPrefs, SHARED_KEYS } from "./ls-prefs.js";

const READY_FLAG = "lsReady";

/** Classes the look-and-feel choices put on <html>; styles are in ls-supports.css. */
const LOOKS = /** @type {const} */ ({
  spacing: "ls-spacing",
  contrast: "ls-contrast",
  targets: "ls-targets",
});

function addStylesheets() {
  for (const name of ["ls-looks.css", "ls-supports.css"]) {
    const href = new URL(name, import.meta.url).href;
    if (document.querySelector(`link[href="${href}"]`)) continue;
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = href;
    document.head.append(link);
  }
}

/**
 * Fetch and start a feature the first time its switch is on.
 * @param {ReturnType<typeof createPrefs>} prefs
 * @param {"focus" | "voiceAnswer"} key
 * @param {() => Promise<(p: ReturnType<typeof createPrefs>) => void>} load
 */
function startWhenWanted(prefs, key, load) {
  let started = false;
  const start = () => {
    if (started || !prefs.get()[key]) return;
    started = true;
    load()
      .then((install) => install(prefs))
      .catch((err) => {
        started = false;
        console.warn(`Learning supports: ${key} could not start.`, err);
      });
  };
  start();
  prefs.subscribe(start);
}

function boot() {
  const root = document.documentElement;
  if (root.dataset[READY_FLAG]) return;
  root.dataset[READY_FLAG] = "1";

  const prefs = createPrefs();
  addStylesheets();

  const applyLooks = () => {
    const p = prefs.get();
    for (const [key, cls] of Object.entries(LOOKS)) {
      root.classList.toggle(cls, Boolean(p[/** @type {keyof typeof LOOKS} */ (key)]));
    }
  };
  applyLooks();
  prefs.subscribe(applyLooks);
  installCalm(prefs);

  // Other pages and tabs write the same record; follow them.
  window.addEventListener("storage", (e) => {
    if (e.key === null || SHARED_KEYS.includes(e.key)) prefs.reload();
  });

  // The dock that opens on lessons reads and writes through this handle.
  /** @type {any} */ (window).ewlLs = Object.freeze({
    get: () => prefs.get(),
    set: (/** @type {Partial<import("./ls-prefs.js").Prefs>} */ patch) => prefs.set(patch),
    subscribe: (/** @type {(p: import("./ls-prefs.js").Prefs) => void} */ fn) =>
      prefs.subscribe(fn),
  });

  startWhenWanted(prefs, "focus", async () => (await import("./ls-focus.js")).installFocus);
  startWhenWanted(
    prefs,
    "voiceAnswer",
    async () => (await import("./ls-voice-answer.js")).installVoiceAnswer,
  );

  const mount = async () => {
    const panel = await import("./ls-panel.js");
    const menu = document.getElementById("udlMenuPopover");
    if (menu) panel.extendHubPopover(prefs, menu);
    else panel.mountStandalonePanel(prefs);
  };
  const run = () => mount().catch((err) => console.warn("Learning supports: panel failed.", err));
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", run);
  else run();
}

boot();
