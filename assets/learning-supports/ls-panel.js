// The student-facing panel for Learning Supports.
//
// There is ONE panel. On the curriculum hub it extends the existing "Reading
// supports" popover (the same button, the same open and close behaviour, the
// existing high-contrast switch). On every other page, which has no such
// popover, the same controls open from a small "Learning supports" button.

import {
  getPreferredVoiceName,
  listVoices,
  makeUtterance,
  onVoicesChanged,
  setPreferredVoiceName,
} from "./engine-speech.js";
import { RATES } from "./ls-prefs.js";
import { canSpeak, createReader } from "./ls-read-aloud.js";
import { line } from "./ls-strings.js";
import { announce, bi, one, pageLang } from "./ls-ui.js";
import { canListen } from "./ls-voice-answer.js";

/** @typedef {import("./ls-prefs.js").Prefs} Prefs */
/** @typedef {ReturnType<typeof import("./ls-prefs.js").createPrefs>} PrefsStore */

let uid = 0;

/**
 * @param {string} tag
 * @param {string} [className]
 * @param {...(string | Node)} children
 */
function el(tag, className = "", ...children) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  node.append(...children);
  return node;
}

/**
 * A labelled on/off switch row.
 * @param {PrefsStore} prefs
 * @param {keyof Prefs} key
 * @param {string} label string key
 * @param {string | null} hint string key, or null for a label-only row
 */
function switchRow(prefs, key, label, hint) {
  const input = /** @type {HTMLInputElement} */ (el("input"));
  input.type = "checkbox";
  input.id = `ls-${key}-${++uid}`;
  input.dataset.lsKey = key;
  input.checked = Boolean(prefs.get()[key]);
  input.addEventListener("change", () => prefs.set({ [key]: input.checked }));
  prefs.subscribe((p) => {
    input.checked = Boolean(p[key]);
  });
  const text = el("span", "ls-row-text", el("b", "", bi(label)));
  if (hint) text.append(el("small", "", bi(hint)));
  return el("label", "ls-row", input, text);
}

/**
 * A labelled drop-down row.
 * @param {string} label string key
 * @param {[string, string][]} options value and visible text
 * @param {string} value
 * @param {(value: string) => void} onChange
 */
function selectRow(label, options, value, onChange) {
  const select = /** @type {HTMLSelectElement} */ (el("select", "ls-select"));
  select.id = `ls-select-${++uid}`;
  for (const [v, text] of options) {
    const opt = /** @type {HTMLOptionElement} */ (el("option"));
    opt.value = v;
    opt.textContent = text;
    select.append(opt);
  }
  select.value = value;
  select.addEventListener("change", () => onChange(select.value));
  const lab = /** @type {HTMLLabelElement} */ (el("label", "ls-field", bi(label), select));
  lab.htmlFor = select.id;
  return { row: lab, select };
}

/** One line of both languages as plain option text. */
const both = (/** @type {string} */ key) => {
  const { en, es } = line(key);
  return en === es ? en : `${en} · ${es}`;
};

/**
 * Build the panel body.
 * @param {PrefsStore} prefs
 * @returns {{ body: HTMLElement, reader: ReturnType<typeof createReader> }}
 */
export function buildPanelBody(prefs) {
  /** @type {Element | null} */
  let anchor = null;
  document.addEventListener("focusin", (e) => {
    if (e.target instanceof Element && !e.target.closest("[data-ls-ui]")) anchor = e.target;
  });

  const status = el("p", "ls-status");
  status.setAttribute("role", "status");
  status.setAttribute("aria-live", "polite");

  const readBtn = /** @type {HTMLButtonElement} */ (el("button", "ls-btn ls-btn-primary"));
  readBtn.type = "button";
  const showReadLabel = (/** @type {boolean} */ playing) => {
    readBtn.replaceChildren(playing ? "■ " : "▶ ", bi(playing ? "stop" : "readPage"));
  };
  showReadLabel(false);

  const reader = createReader({
    getPrefs: () => prefs.get(),
    getLang: pageLang,
    getAnchor: () => anchor,
    onState(state) {
      showReadLabel(state === "playing");
      readBtn.setAttribute("aria-pressed", String(state === "playing"));
      const key = { empty: "readEmpty", unsupported: "readUnsupported", playing: "readStarted" }[
        /** @type {string} */ (state)
      ];
      status.replaceChildren(key ? bi(key) : "");
    },
  });
  readBtn.addEventListener("click", () => {
    if (reader.state === "playing") {
      reader.stop();
      announce("readStopped");
    } else {
      reader.read();
    }
  });
  document.addEventListener("keydown", (e) => {
    if (e.altKey && e.code === "KeyR" && canSpeak()) {
      e.preventDefault();
      readBtn.click();
    }
  });
  if (!canSpeak()) readBtn.disabled = true;

  // Read aloud
  const readTitle = el("h3", "ls-h", bi("readTitle"));
  const readHint = el("p", "ls-hint", bi("readHint"));
  const langRow = selectRow(
    "readLang",
    [
      ["auto", both("langAuto")],
      ["en", both("langEn")],
      ["es", both("langEs")],
    ],
    prefs.get().readLang,
    (v) => prefs.set({ readLang: /** @type {Prefs["readLang"]} */ (v) }),
  );
  const speedRow = selectRow(
    "speed",
    [
      [String(RATES[0]), both("speedSlow")],
      [String(RATES[1]), both("speedNormal")],
      [String(RATES[2]), both("speedFast")],
    ],
    String(prefs.get().rate),
    (v) => prefs.set({ rate: Number(v) }),
  );
  const voices = el("div", "ls-voices");
  const fillVoices = () => {
    voices.replaceChildren();
    for (const [lang, label, code] of /** @type {const} */ ([
      ["en", "voiceEn", "en-US"],
      ["es", "voiceEs", "es-US"],
    ])) {
      const list = listVoices(code, { localOnly: prefs.get().offlineVoices });
      if (!list.length) continue;
      const { row } = selectRow(
        label,
        [
          ["", both("voiceAuto")],
          ...list.map((v) => /** @type {[string, string]} */ ([v.name, v.name])),
        ],
        getPreferredVoiceName(code),
        (name) => {
          setPreferredVoiceName(name, code);
          if (canSpeak()) {
            window.speechSynthesis.cancel();
            window.speechSynthesis.speak(
              makeUtterance(lang === "es" ? "Así suena mi voz." : "This is how it sounds.", code, {
                rate: prefs.get().rate,
              }),
            );
          }
        },
      );
      voices.append(row);
    }
  };
  fillVoices();
  onVoicesChanged(fillVoices);
  prefs.subscribe(fillVoices);

  // Say my answers
  const voiceRow = switchRow(prefs, "voiceAnswer", "voiceAnswer", "voiceAnswerHint");
  if (!canListen()) {
    const input = /** @type {HTMLInputElement} */ (voiceRow.querySelector("input"));
    input.disabled = true;
    voiceRow.querySelector("small")?.replaceChildren(bi("voiceUnsupported"));
  }

  const body = el(
    "div",
    "ls-panel-body",
    el(
      "section",
      "ls-section",
      readTitle,
      readBtn,
      readHint,
      status,
      langRow.row,
      speedRow.row,
      voices,
      switchRow(prefs, "offlineVoices", "offline", null),
      voiceRow,
    ),
    el(
      "section",
      "ls-section",
      el("h3", "ls-h", bi("lookTitle")),
      switchRow(prefs, "calm", "calm", "calmHint"),
      switchRow(prefs, "focus", "focus", "focusHint"),
      switchRow(prefs, "spacing", "spacing", "spacingHint"),
      switchRow(prefs, "contrast", "contrast", "contrastHint"),
      switchRow(prefs, "targets", "targets", "targetsHint"),
    ),
  );
  const resetBtn = /** @type {HTMLButtonElement} */ (el("button", "ls-btn", bi("reset")));
  resetBtn.type = "button";
  resetBtn.addEventListener("click", () => {
    reader.stop();
    prefs.reset();
    announce("resetDone");
  });
  body.append(el("p", "ls-note", bi("panelNote")), resetBtn);
  return { body, reader };
}

/**
 * The hub already has a "Reading supports" popover with its own button and
 * high-contrast switch. Extend it rather than add a second panel.
 * @param {PrefsStore} prefs
 * @param {HTMLElement} menu
 */
export function extendHubPopover(prefs, menu) {
  const { body } = buildPanelBody(prefs);
  const section = el("section", "ls-hub-extension", body);
  section.setAttribute("aria-label", one("panelTitle"));
  // The popover's own switch IS the contrast control: drop ours, bind theirs.
  body.querySelector('[data-ls-key="contrast"]')?.closest("label")?.remove();
  const chk = /** @type {HTMLInputElement | null} */ (menu.querySelector("#chkHighContrast"));
  if (chk) {
    chk.checked = prefs.get().contrast;
    chk.addEventListener("change", () => prefs.set({ contrast: chk.checked }));
    prefs.subscribe((p) => {
      chk.checked = p.contrast;
      document.body.classList.toggle("hub-high-contrast", p.contrast);
    });
    document.body.classList.toggle("hub-high-contrast", prefs.get().contrast);
  }
  const link = menu.querySelector("a[href]");
  menu.classList.add("ls-extended");
  menu.insertBefore(section, link);
}

/**
 * Pages with no Reading supports popover get one small button that opens the
 * same controls.
 * @param {PrefsStore} prefs
 */
export function mountStandalonePanel(prefs) {
  const { body, reader } = buildPanelBody(prefs);
  const id = `ls-panel-${++uid}`;

  const launcher = /** @type {HTMLButtonElement} */ (el("button", "ls-launcher"));
  launcher.type = "button";
  launcher.setAttribute("data-ls-ui", "");
  launcher.setAttribute("aria-expanded", "false");
  launcher.setAttribute("aria-controls", id);
  const icon = el("span", "", "♿");
  icon.setAttribute("aria-hidden", "true");
  launcher.append(icon, bi("panelButton"));

  const panel = el("div", "ls-panel");
  panel.id = id;
  panel.setAttribute("data-ls-ui", "");
  panel.setAttribute("role", "dialog");
  panel.setAttribute("aria-label", one("panelTitle"));
  panel.hidden = true;
  const close = /** @type {HTMLButtonElement} */ (el("button", "ls-btn ls-close", bi("close")));
  close.type = "button";
  panel.append(el("h2", "ls-panel-title", bi("panelTitle")), body, close);

  /** @param {boolean} open @param {boolean} [restore] */
  function setOpen(open, restore = false) {
    panel.hidden = !open;
    launcher.setAttribute("aria-expanded", String(open));
    if (open)
      /** @type {HTMLElement | null} */ (panel.querySelector("button, input, select"))?.focus();
    else if (restore) launcher.focus();
  }
  launcher.addEventListener("click", () =>
    setOpen(launcher.getAttribute("aria-expanded") !== "true"),
  );
  close.addEventListener("click", () => setOpen(false, true));
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !panel.hidden) {
      e.preventDefault();
      setOpen(false, true);
    }
  });
  document.addEventListener("pointerdown", (e) => {
    if (
      !panel.hidden &&
      e.target instanceof Node &&
      !panel.contains(e.target) &&
      !launcher.contains(e.target)
    ) {
      setOpen(false);
    }
  });
  document.body.append(launcher, panel);
  return { launcher, panel, reader };
}
