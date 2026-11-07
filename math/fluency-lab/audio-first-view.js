// Audio-first (pre-reader) mode, the screen. Draws the character guide, the picture answer choices and the
// tap-to-count / keypad answers, and speaks the question, the choices and each result. The rules (when the mode is on,
// what is said, how a problem is answered) are in audio-first-core.js; the voice is audio-first-speech.js.
//
// Nothing here removes a choice, marks one as better, or says anything about the answer. The words stay on the
// screen: if a device cannot speak, the guide says so and the question is still there to read.
import { buddySvg } from "./buddy.js";
import {
  answerPlan,
  BUDDY_MOOD,
  blocksToNumber,
  choicePicture,
  choiceSpeech,
  feedbackSpeech,
  pictureName,
  problemScript,
  speakable,
} from "./audio-first-core.js";
import { audioAvailable, speakLines, stopSpeaking } from "./audio-first-speech.js";
import { getLang, t } from "./i18n.js";
import { mountResponse } from "./response-widgets.js";
import { onGameMessage } from "./speech.js";

const esc = (value) =>
  String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");

// The app supplies these once: whether the mode is on, the learner's buddy, and the Spanish text helpers.
let config = {
  active: () => false,
  buddyLook: () => ({}),
  questionEs: () => null,
  choicesEs: () => null,
  format: (text) => esc(text),
};
export const configureAudioFirst = (next) => {
  config = { ...config, ...next };
};
export const audioFirstOn = () => Boolean(config.active());

let guide = null;
let current = { item: null, plan: null };
let spokenKinds = new Set();
let lastGameText = "";
let lastGameAt = 0;
let gameBanner = null;

// ---- guide --------------------------------------------------------------------------------------------------------
function buildGuide() {
  const host = document.querySelector(".problem-question-zone");
  if (!host) return null;
  const el = document.createElement("div");
  el.id = "af-guide";
  el.className = "af-guide";
  el.setAttribute("role", "group");
  el.setAttribute("aria-label", t("Listening helper"));
  el.innerHTML = `<div class="af-buddy" aria-hidden="true"></div>
    <div class="af-bubble"><p class="af-line" aria-hidden="true"></p><p class="af-note" role="status"></p></div>
    <div class="af-buttons">
      <button type="button" class="af-replay" data-af-replay>${esc(t("Listen again"))}</button>
      <button type="button" class="af-other" data-af-other></button>
    </div>`;
  host.prepend(el);
  el.addEventListener("click", (event) => {
    if (event.target.closest("[data-af-replay]")) replay(getLang());
    else if (event.target.closest("[data-af-other]")) replay(getLang() === "es" ? "en" : "es");
  });
  return el;
}

function setMood(mood) {
  const buddy = guide?.querySelector(".af-buddy");
  if (buddy) buddy.innerHTML = buddySvg({ ...config.buddyLook(), mood });
}

function setNote(text) {
  const note = guide?.querySelector(".af-note");
  if (note) note.textContent = text || "";
  document.body.classList.toggle("af-silent", Boolean(text) && !audioAvailable());
}

function labelGuide() {
  if (!guide) return;
  const es = getLang() === "es";
  guide.setAttribute("aria-label", t("Listening helper"));
  guide.querySelector("[data-af-replay]").textContent = t("Listen again");
  const other = guide.querySelector("[data-af-other]");
  other.textContent = es ? t("Hear it in English") : t("Hear it in Spanish");
  other.setAttribute("lang", es ? "en" : "es");
  guide.querySelector(".af-line").textContent = t("Tap the speaker to hear the question.");
}

// Shown on the practice screen for the current problem; removed when the mode is off.
export function syncGuide() {
  const on = audioFirstOn();
  document.body.classList.toggle("audio-first", on);
  if (!on) {
    stopSpeaking();
    if (guide) guide.hidden = true;
    document.body.classList.remove("af-silent");
    return;
  }
  guide ||= buildGuide();
  if (!guide) return;
  guide.hidden = false;
  labelGuide();
  setMood("happy");
  if (!audioAvailable())
    setNote(
      t(
        "Sound is not available on this device. Read the words on the screen, or ask a grown-up to read to you.",
      ),
    );
  else setNote("");
}

// ---- speaking -----------------------------------------------------------------------------------------------------
const lineEl = () => guide?.querySelector(".af-line");

function say(lines, lang) {
  document
    .querySelectorAll(".af-choice.is-speaking")
    .forEach((n) => n.classList.remove("is-speaking"));
  speakLines(lines, {
    lang,
    onLine: (line) => {
      guide?.classList.add("is-speaking");
      if (lineEl()) lineEl().textContent = line.text;
      document
        .querySelectorAll(".af-choice.is-speaking")
        .forEach((n) => n.classList.remove("is-speaking"));
      if (line.kind === "choice")
        document
          .querySelector(`.af-choice[data-index="${line.index}"]`)
          ?.classList.add("is-speaking");
    },
    onDone: () => {
      guide?.classList.remove("is-speaking");
      document
        .querySelectorAll(".af-choice.is-speaking")
        .forEach((n) => n.classList.remove("is-speaking"));
      if (lineEl()) lineEl().textContent = t("Tap the speaker to hear the question.");
    },
    onError: (reason) => {
      guide?.classList.remove("is-speaking");
      setNote(
        reason === "not-allowed"
          ? t("Tap Listen again to hear it.")
          : t(
              "Sound is not available on this device. Read the words on the screen, or ask a grown-up to read to you.",
            ),
      );
    },
  });
}

const scriptFor = (item, plan, lang, withInstruction) =>
  problemScript(item, {
    lang,
    plan,
    questionEs: lang === "es" ? config.questionEs(item) : null,
    choicesEs: lang === "es" ? config.choicesEs(item) : null,
    withInstruction,
  });

// Replay says the same thing again, instruction included. It is the only help this mode adds.
export function replay(lang = getLang()) {
  if (!audioFirstOn() || !current.item) return;
  setNote("");
  say(scriptFor(current.item, current.plan, lang, true), lang);
}

// A problem appeared: remember it and read it. The first time a kind of answer is met, its one-line instruction is
// read too; after that only a replay repeats it.
export function presentProblem(item, plan = answerPlan(item)) {
  current = { item, plan };
  syncGuide();
  if (!audioFirstOn() || !guide) return;
  const first = !spokenKinds.has(plan.kind);
  spokenKinds.add(plan.kind);
  setMood("happy");
  say(scriptFor(item, plan, getLang(), first), getLang());
}

export function speakNow(text, lang = getLang()) {
  if (audioFirstOn() && text) speakLines([{ text }], { lang });
}

// A result: short, kind, and never the answer unless the screen already shows it.
export function speakFeedback(view) {
  if (!audioFirstOn() || !view) return;
  const lang = getLang();
  const shown = view.lines?.find((line) => line.label === t("Correct answer"))?.value || "";
  setMood(BUDDY_MOOD[view.phase] || "happy");
  const text = feedbackSpeech(view.phase, { lang, answer: shown });
  if (text) speakLines([{ text }], { lang });
}

// ---- answer choices -----------------------------------------------------------------------------------------------
const FRAME_DOTS = (n) => {
  const rows = Math.max(1, Math.ceil(n / 5));
  const dots = Array.from(
    { length: n },
    (_, i) => `<circle cx="${10 + (i % 5) * 12}" cy="${10 + Math.floor(i / 5) * 12}" r="4.5"/>`,
  ).join("");
  return `<svg viewBox="0 0 68 ${rows * 12 + 8}" focusable="false" class="af-dots">${dots}</svg>`;
};
const SHAPE_PATHS = {
  circle: '<circle cx="30" cy="30" r="24"/>',
  square: '<rect x="8" y="8" width="44" height="44"/>',
  rectangle: '<rect x="4" y="14" width="52" height="32"/>',
  triangle: '<polygon points="30,6 56,52 4,52"/>',
  hexagon: '<polygon points="16,6 44,6 58,30 44,54 16,54 2,30"/>',
  pentagon: '<polygon points="30,4 57,24 47,54 13,54 3,24"/>',
  rhombus: '<polygon points="30,4 56,30 30,56 4,30"/>',
  trapezoid: '<polygon points="16,10 44,10 58,50 2,50"/>',
};
const pairsPicture = (name) => {
  if (name === "neither") return '<svg viewBox="0 0 60 54" focusable="false" class="af-pairs"><text x="30" y="42" text-anchor="middle" font-size="40" font-weight="800">?</text></svg>';
  const count = name === "even" ? 6 : 5;
  const dots = Array.from({ length: count }, (_, i) => `<circle cx="${14 + Math.floor(i / 2) * 16}" cy="${i % 2 ? 36 : 18}" r="6"/>`).join("");
  return `<svg viewBox="0 0 60 54" focusable="false" class="af-pairs">${dots}</svg>`;
};
function pictureHtml(picture) {
  if (!picture) return "";
  if (picture.type === "dots") return FRAME_DOTS(picture.count);
  if (picture.type === "shape")
    return `<svg viewBox="0 0 60 60" focusable="false" class="af-shape">${SHAPE_PATHS[picture.name] || ""}</svg>`;
  if (picture.type === "pairs") return pairsPicture(picture.name);
  if (picture.type === "emoji") return `<span class="af-emoji">${picture.glyph}</span>`;
  return "";
}

// Fills the choice host. Every tile keeps the app's own `data-answer` button (so Check, evidence and feedback run the
// normal path) and is at least 64px; a separate speaker button reads that one choice.
export function renderChoiceTiles(host, item) {
  const lang = getLang();
  const choicesEs = lang === "es" ? config.choicesEs(item) : null;
  host.className = "choice-answers af-choices";
  host.innerHTML = item.choices
    .map((choice, index) => {
      const picture = choicePicture(choice, item);
      const spoken = choiceSpeech(choice, lang, { choicesEs, index });
      const symbol = /^[<=>]$/.test(String(choice));
      return `<div class="af-choice" data-index="${index}">
        <button type="button" class="choice-answer af-tile${symbol ? " af-symbol" : ""}" data-answer="${esc(choice)}" aria-label="${esc(pictureName(picture, spoken))}">
          ${picture ? `<span class="af-pic" aria-hidden="true">${pictureHtml(picture)}</span>` : ""}
          <span class="af-label">${config.format(choice)}</span>
        </button>
        <button type="button" class="af-hear" data-af-hear="${index}" aria-label="${esc(t("Hear choice {n}", { n: index + 1 }))}"><span aria-hidden="true">🔊</span></button>
      </div>`;
    })
    .join("");
  host.onclick = (event) => {
    const hear = event.target.closest("[data-af-hear]");
    if (!hear) return;
    event.stopPropagation();
    const index = Number(hear.dataset.afHear);
    speakNow(choiceSpeech(item.choices[index], lang, { choicesEs, index }), lang);
  };
}

// ---- answers that are counted or keyed ---------------------------------------------------------------------------

function keypad(host, plan, emit) {
  let value = "";
  const keys = [..."123456789", "⌫", "0", ...plan.extras];
  host.innerHTML = `<div class="af-keypad" role="group" aria-label="${esc(t("Number pad"))}">${keys
    .map((k) =>
      k === "⌫"
        ? `<button type="button" class="af-key af-back" data-key="back" aria-label="${esc(t("Erase last"))}"><span aria-hidden="true">⌫</span></button>`
        : `<button type="button" class="af-key" data-key="${esc(k)}">${esc(k)}</button>`,
    )
    .join("")}</div><p class="af-keyreadout" aria-live="polite"></p>`;
  const readout = host.querySelector(".af-keyreadout");
  const show = () => {
    readout.textContent = value ? t("Your answer: {v}", { v: value }) : t("Nothing yet.");
    emit(value, value);
  };
  host.querySelector(".af-keypad").addEventListener("click", (event) => {
    const key = event.target.closest("[data-key]")?.dataset.key;
    if (!key) return;
    value = key === "back" ? value.slice(0, -1) : (value + key).slice(0, 8);
    show();
  });
  show();
}

// Mounts the control for a number answer into `host` and reports the answer as the same text a typed answer would be.
// Returns the same handle shape as mountResponse (value / showVerdict / destroy).
export function mountCountedAnswer(host, plan, { onChange = () => {} } = {}) {
  host.hidden = false;
  host.className = `response-widget af-answer af-${plan.kind}`;
  host.innerHTML = '<div class="af-stage"></div><div class="af-zero-row"></div>';
  const stage = host.querySelector(".af-stage");
  const zeroRow = host.querySelector(".af-zero-row");
  let value = "";
  let zero = false;
  let quiet = true;
  const report = (next, heard) => {
    value = next;
    onChange(value);
    if (!quiet && heard) speakNow(heard);
  };
  const mountInner = () => {
    quiet = true;
    stage.innerHTML = "";
    const inner = document.createElement("div");
    stage.append(inner);
    if (plan.kind === "keypad") keypad(inner, plan, (v) => ((zero = false), report(v, "")));
    else {
      const response =
        plan.kind === "tenFrame"
          ? { type: "tenFrame", frames: plan.frames, target: 0 }
          : { type: "baseTen", places: plan.places, target: 0 };
      mountResponse(
        inner,
        { response },
        {
          onChange: (raw) => {
            if (quiet) return;
            zero = false;
            zeroButton?.setAttribute("aria-pressed", "false");
            const number = plan.kind === "baseTen" ? blocksToNumber(raw) : raw;
            report(number, number);
          },
        },
      );
    }
    quiet = false;
  };
  let zeroButton = null;
  if (plan.kind !== "keypad") {
    zeroRow.innerHTML = `<button type="button" class="af-zero" aria-pressed="false">${esc(t("Zero (none)"))}</button>`;
    zeroButton = zeroRow.querySelector(".af-zero");
    zeroButton.addEventListener("click", () => {
      zero = !zero;
      mountInner();
      zeroButton.setAttribute("aria-pressed", String(zero));
      report(zero ? "0" : "", zero ? "0" : "");
    });
  }
  mountInner();
  return {
    value: () => value,
    showVerdict() {},
    destroy() {
      host.innerHTML = "";
      host.hidden = true;
    },
  };
}

// ---- games ----------------------------------------------------------------------------------------------------------
// Games keep their own boards. What this mode adds there: each game message is read aloud once, a button reads the
// last one again, and a note says plainly that some games still need reading or typing.
function ensureGameBanner() {
  const room = document.querySelector("#games-view");
  if (!room) return null;
  if (!gameBanner) {
    gameBanner = document.createElement("div");
    gameBanner.id = "af-game-banner";
    gameBanner.className = "af-game-banner";
    gameBanner.hidden = true;
    gameBanner.innerHTML = '<p class="af-game-note"></p><button type="button" class="af-replay" data-af-game-replay></button>';
    room.before(gameBanner);
    gameBanner.addEventListener("click", (event) => {
      if (event.target.closest("[data-af-game-replay]")) speakNow(lastGameText ? speakable(lastGameText, getLang()) : t("Pick a game to play."));
    });
    if (typeof MutationObserver === "function") new MutationObserver(syncGameBanner).observe(room, { attributes: true, attributeFilter: ["hidden"] });
  }
  return gameBanner;
}
// The banner exists only once the mode has been on; it follows the Game Room's visibility.
export function syncGameBanner() {
  if (!gameBanner && !audioFirstOn()) return;
  const room = document.querySelector("#games-view");
  const banner = ensureGameBanner();
  if (!banner) return;
  banner.hidden = !(audioFirstOn() && room && !room.hidden);
  banner.querySelector(".af-game-note").textContent = t(
    "Listening help is on. Games read their messages out loud. Some games still need reading or typing, so a grown-up may need to help.",
  );
  banner.querySelector("[data-af-game-replay]").textContent = t("Listen again");
}
onGameMessage((text) => {
  syncGameBanner();
  if (!audioFirstOn() || !text) return;
  const now = Date.now();
  // The same message twice in a row is one render repeating itself, not a new result.
  if (text === lastGameText && now - lastGameAt < 2000) return;
  lastGameText = text;
  lastGameAt = now;
  speakNow(speakable(text, getLang()));
});
