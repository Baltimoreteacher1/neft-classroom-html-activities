/* =============================================================================
 * Weekly Family Broadcast — page controller (vanilla ES module, no build step)
 * -----------------------------------------------------------------------------
 * Reads one child's week from /api/family-broadcast using the save code that
 * arrived in the family's link, and plays it as a short paced story.
 *
 * DESIGN RULES THIS FILE KEEPS
 *   - Every card is reachable without the story: "Read it all at once" turns
 *     the same DOM into one scrolling page, and print shows all of it.
 *   - Auto-advance never starts on its own when the reader asked for reduced
 *     motion, and it can always be paused. It is never the only way forward.
 *   - The code typed into the form is kept in sessionStorage only. It is never
 *     written into the address bar, never put in browser history, and the page
 *     sends no referrer, so a forwarded link cannot leak the code onward.
 *   - Nothing is ever inserted as HTML. Every value from the API lands through
 *     textContent, and link targets must be site-relative paths.
 *   - No grade, no score, no ranking, and no other child appears anywhere. The
 *     only class-level line comes from the anonymous, k-anonymous
 *     /api/class-pulse aggregate and is labelled as class-wide.
 * ========================================================================== */

import { UI } from "./broadcast-content.js";

const LANG_KEY = "nt_broadcast.lang";
const CODE_KEY = "nt_broadcast.code";
const WINDOW_DAYS = 7;
const BASE_DWELL_MS = 7000;
const PER_ITEM_MS = 900;
const MAX_DWELL_MS = 14000;

const reducedMotion =
  typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;

const byId = (id) => document.getElementById(id);

const el = {
  gate: byId("gate"),
  gateForm: byId("gate-form"),
  codeInput: byId("code-input"),
  message: byId("message"),
  messageTitle: byId("message-title"),
  messageBody: byId("message-body"),
  stage: byId("stage"),
  windowLabel: byId("window-label"),
  positionLabel: byId("position-label"),
  progress: byId("progress"),
  cards: byId("cards"),
  langToggle: byId("lang-toggle"),
  langToggleText: byId("lang-toggle-text"),
  btnPrev: byId("btn-prev"),
  btnPlay: byId("btn-play"),
  btnPlayIcon: byId("btn-play-icon"),
  btnPlayText: byId("btn-play-text"),
  btnNext: byId("btn-next"),
  btnMode: byId("btn-mode"),
  btnModeText: byId("btn-mode-text"),
  btnPrint: byId("btn-print"),
  live: byId("live-status"),
};

const state = {
  lang: readLang(),
  code: readCode(),
  data: null,
  pulse: null,
  cards: [],
  index: 0,
  playing: false,
  storyMode: true,
  rafId: 0,
  segStart: 0,
  segElapsed: 0,
  loading: false,
  messageKey: "",
};

/* ------------------------------------------------------------- preferences */

function readLang() {
  try {
    return localStorage.getItem(LANG_KEY) === "es" ? "es" : "en";
  } catch (_e) {
    return "en";
  }
}

function writeLang(lang) {
  try {
    localStorage.setItem(LANG_KEY, lang);
  } catch (_e) {
    /* private browsing — the toggle still works for this visit */
  }
}

/** URL first (that is how the link arrives), then this tab's own session. */
function readCode() {
  try {
    const fromUrl = new URL(location.href).searchParams.get("code");
    if (fromUrl) return fromUrl.trim().toUpperCase();
    return (sessionStorage.getItem(CODE_KEY) || "").trim().toUpperCase();
  } catch (_e) {
    return "";
  }
}

function rememberCode(code) {
  try {
    sessionStorage.setItem(CODE_KEY, code);
  } catch (_e) {
    /* the broadcast still plays; a refresh will ask again */
  }
}

const ui = () => UI[state.lang];

/* ------------------------------------------------------------------ chrome */

function applyChrome() {
  const t = ui();
  document.documentElement.lang = state.lang;
  for (const node of document.querySelectorAll("[data-copy]")) {
    const value = t[node.dataset.copy];
    if (typeof value === "string") node.textContent = value;
  }
  el.langToggleText.textContent = t.switchTo;
  el.langToggle.lang = state.lang === "es" ? "en" : "es";
  el.langToggle.setAttribute("aria-pressed", String(state.lang === "es"));
  el.langToggle.setAttribute(
    "aria-label",
    state.lang === "es" ? "Switch to English" : "Cambiar a español",
  );
  el.btnPlayText.textContent = state.playing ? t.pause : t.play;
  el.btnModeText.textContent = state.storyMode ? t.readAll : t.readAsStory;
  // A message already on screen has to follow the language too.
  if (state.messageKey) showMessage(state.messageKey);
}

/** Messages are stored as UI keys so the language toggle re-renders them. */
function showMessage(bodyKey) {
  const t = ui();
  state.messageKey = bodyKey;
  el.messageTitle.textContent = t.errorTitle;
  el.messageBody.textContent = t[bodyKey] || t.errorBody;
  el.message.hidden = false;
}

function hideMessage() {
  state.messageKey = "";
  el.message.hidden = true;
}

/* -------------------------------------------------------------- small DOM */

function node(tag, className, text) {
  const n = document.createElement(tag);
  if (className) n.className = className;
  if (text != null) n.textContent = text;
  return n;
}

/** Only site-relative paths become links. Anything else renders as plain text. */
function safePath(path) {
  const p = String(path || "");
  return /^\/[^/\\]/.test(p) ? p : "";
}

function itemList(items) {
  const ul = node("ul", "item-list");
  for (const item of items) {
    const li = node("li");
    const href = safePath(item.path);
    if (href) {
      const a = node("a", null, item.title);
      a.href = href;
      a.rel = "noreferrer";
      li.appendChild(a);
    } else {
      li.appendChild(node("strong", null, item.title));
    }
    if (item.note) li.appendChild(node("span", "item-note", item.note));
    ul.appendChild(li);
  }
  return ul;
}

function weekday(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  try {
    return new Intl.DateTimeFormat(state.lang === "es" ? "es" : "en-US", {
      weekday: "long",
    }).format(d);
  } catch (_e) {
    return "";
  }
}

/* ------------------------------------------------------------ card building */

function buildCards(data) {
  const t = ui();
  const cards = [];

  cards.push({
    kicker: t.windowLabel(data.window ? data.window.days : WINDOW_DAYS),
    title: data.headline || t.brandSub,
    weight: 0,
    build(body) {
      if (data.note) body.appendChild(node("p", "lede", data.note));
    },
  });

  const did = Array.isArray(data.did) ? data.did : [];
  cards.push({
    kicker: t.cardDid,
    title: t.cardDid,
    weight: did.length,
    build(body) {
      if (!did.length) {
        body.appendChild(node("p", "lede", t.emptyDid));
        return;
      }
      body.appendChild(
        itemList(
          did.map((item) => ({
            title: item.title,
            path: item.path,
            note: weekday(item.when),
          })),
        ),
      );
    },
  });

  const grew = Array.isArray(data.grew) ? data.grew : [];
  cards.push({
    kicker: t.cardGrew,
    title: t.cardGrew,
    weight: grew.length,
    build(body) {
      if (!grew.length) {
        body.appendChild(node("p", "lede", t.emptyGrew));
        return;
      }
      const ul = node("ul");
      for (const item of grew) {
        const li = node("li");
        li.appendChild(node("span", "chip", item.label));
        li.appendChild(node("span", "item-note", item.evidence));
        ul.appendChild(li);
      }
      body.appendChild(ul);
    },
  });

  const stuck = Array.isArray(data.stuck) ? data.stuck : [];
  cards.push({
    kicker: t.cardStuck,
    title: t.cardStuck,
    weight: stuck.length,
    build(body) {
      if (!stuck.length) {
        body.appendChild(node("p", "lede", t.emptyStuck));
        return;
      }
      for (const item of stuck) {
        const box = node("div", "callout");
        box.appendChild(node("strong", null, item.label));
        const p = node("p");
        p.appendChild(node("em", null, `${t.watchLabel}: `));
        p.appendChild(document.createTextNode(item.watchFor));
        box.appendChild(p);
        body.appendChild(box);
      }
    },
  });

  const kt = data.kitchenTable || null;
  cards.push({
    kicker: t.cardKitchen,
    title: kt ? kt.title : t.cardKitchen,
    weight: kt && Array.isArray(kt.steps) ? kt.steps.length : 0,
    build(body) {
      if (!kt) return;
      const chips = node("p");
      chips.appendChild(node("span", "chip chip-warm", t.minutesLabel(kt.minutes)));
      body.appendChild(chips);
      if (kt.materials) {
        body.appendChild(node("p", "lede", `${t.materialsLabel}: ${kt.materials}`));
      }
      const ol = node("ol");
      for (const step of kt.steps || []) ol.appendChild(node("li", null, step));
      body.appendChild(ol);
      if (kt.why) {
        const box = node("div", "callout");
        box.appendChild(node("strong", null, t.whyLabel));
        box.appendChild(node("p", null, kt.why));
        body.appendChild(box);
      }
    },
  });

  const nextUp = Array.isArray(data.nextUp) ? data.nextUp : [];
  const pulse = state.pulse;
  cards.push({
    kicker: t.cardNext,
    title: t.cardNext,
    weight: nextUp.length,
    build(body) {
      if (nextUp.length) {
        body.appendChild(
          itemList(nextUp.map((item) => ({ title: item.title, path: item.path, note: item.why }))),
        );
      }
      // Class context is optional, anonymous and clearly marked as class-wide.
      if (pulse) {
        const box = node("div", "class-context");
        box.appendChild(node("strong", null, t.classLabel));
        box.appendChild(node("span", null, pulse));
        box.appendChild(node("span", "item-note", t.classNote));
        body.appendChild(box);
      }
    },
  });

  cards.push({
    kicker: t.cardClose,
    title: t.closingTitle,
    weight: 0,
    build(body) {
      body.appendChild(node("p", null, t.closingBody));
      const back = node("p");
      const a = node("a", null, t.backToFamily);
      a.href = "/curriculum/family-connections/";
      a.rel = "noreferrer";
      back.appendChild(a);
      body.appendChild(back);
    },
  });

  return cards;
}

function renderCards() {
  el.cards.textContent = "";
  el.progress.textContent = "";
  for (let i = 0; i < state.cards.length; i++) {
    const card = state.cards[i];
    const section = node("article", "card");
    section.id = `card-${i}`;
    section.setAttribute("role", "group");
    section.setAttribute("aria-roledescription", "card");
    section.appendChild(node("p", "card-kicker", card.kicker));
    const h = node("h2", null, card.title);
    h.tabIndex = -1;
    h.id = `card-title-${i}`;
    section.setAttribute("aria-labelledby", h.id);
    section.appendChild(h);
    const body = node("div", "card-body");
    card.build(body);
    section.appendChild(body);
    el.cards.appendChild(section);

    const step = node("div", "progress-step");
    step.appendChild(node("div", "progress-fill"));
    el.progress.appendChild(step);
  }
  state.index = 0;
  paintPosition();
}

/* ------------------------------------------------------------- story engine */

function dwellFor(i) {
  const card = state.cards[i];
  const weight = card ? card.weight || 0 : 0;
  return Math.min(MAX_DWELL_MS, BASE_DWELL_MS + weight * PER_ITEM_MS);
}

function paintFill(fraction) {
  const steps = el.progress.children;
  for (let i = 0; i < steps.length; i++) {
    const fill = steps[i].firstElementChild;
    if (!fill) continue;
    if (i < state.index) fill.style.width = "100%";
    else if (i > state.index) fill.style.width = "0%";
    else fill.style.width = `${Math.round(Math.min(1, Math.max(0, fraction)) * 100)}%`;
  }
}

function paintPosition() {
  const t = ui();
  const n = state.cards.length;
  const cards = el.cards.children;
  for (let i = 0; i < cards.length; i++) {
    cards[i].classList.toggle("is-current", i === state.index);
    // In story mode only the current card is in the tab order at all.
    if (state.storyMode) cards[i].toggleAttribute("inert", i !== state.index);
    else cards[i].removeAttribute("inert");
  }
  el.positionLabel.textContent = state.storyMode ? t.cardOf(state.index + 1, n) : "";
  el.btnPrev.disabled = state.index === 0;
  el.btnNext.disabled = state.index >= n - 1;
  paintFill(state.playing ? 0 : state.index >= n - 1 ? 1 : 0);
}

function announce() {
  const t = ui();
  const card = state.cards[state.index];
  if (!card) return;
  el.live.textContent = `${t.cardOf(state.index + 1, state.cards.length)}: ${card.title}`;
}

function goTo(i, opts) {
  const n = state.cards.length;
  if (!n) return;
  const next = Math.min(Math.max(i, 0), n - 1);
  const changed = next !== state.index;
  state.index = next;
  state.segElapsed = 0;
  state.segStart = performance.now();
  paintPosition();
  announce();
  if (opts && opts.focus && changed) {
    const heading = document.getElementById(`card-title-${state.index}`);
    if (heading) heading.focus({ preventScroll: false });
  }
  if (state.index >= n - 1 && state.playing) pause();
}

function frame() {
  if (!state.playing) return;
  const now = performance.now();
  const elapsed = state.segElapsed + (now - state.segStart);
  const dwell = dwellFor(state.index);
  paintFill(elapsed / dwell);
  if (elapsed >= dwell) {
    if (state.index >= state.cards.length - 1) {
      pause();
      return;
    }
    goTo(state.index + 1, { focus: false });
  }
  state.rafId = requestAnimationFrame(frame);
}

function play() {
  if (state.playing || !state.storyMode || !state.cards.length) return;
  if (state.index >= state.cards.length - 1) goTo(0, { focus: false });
  state.playing = true;
  state.segStart = performance.now();
  state.rafId = requestAnimationFrame(frame);
  syncPlayButton();
}

function pause() {
  if (!state.playing) return;
  state.playing = false;
  state.segElapsed += performance.now() - state.segStart;
  cancelAnimationFrame(state.rafId);
  syncPlayButton();
}

function syncPlayButton() {
  const t = ui();
  el.btnPlay.setAttribute("aria-pressed", String(state.playing));
  el.btnPlayIcon.textContent = state.playing ? "❚❚" : "▶";
  el.btnPlayText.textContent = state.playing ? t.pause : t.play;
}

function setStoryMode(on) {
  state.storyMode = on;
  if (!on) pause();
  el.cards.classList.toggle("mode-story", on);
  el.cards.classList.toggle("mode-all", !on);
  el.btnMode.setAttribute("aria-pressed", String(!on));
  el.btnModeText.textContent = on ? ui().readAll : ui().readAsStory;
  paintPosition();
}

/* -------------------------------------------------------------------- data */

async function loadClassPulse() {
  try {
    const res = await fetch(`/api/class-pulse?days=${WINDOW_DAYS}`, { credentials: "omit" });
    if (!res.ok) return null;
    const body = await res.json();
    if (!body || body.suppressed || !Array.isArray(body.tags) || !body.tags.length) return null;
    const top = body.tags[0];
    return state.lang === "es" ? top.labelEs || top.label : top.label;
  } catch (_e) {
    return null;
  }
}

async function loadBroadcast() {
  const t = ui();
  if (!state.code || state.loading) return;
  state.loading = true;
  hideMessage();
  el.live.textContent = t.loading;
  try {
    const url = `/api/family-broadcast?code=${encodeURIComponent(state.code)}&days=${WINDOW_DAYS}&lang=${state.lang}`;
    const [res, pulse] = await Promise.all([
      fetch(url, { credentials: "omit", cache: "no-store" }),
      loadClassPulse(),
    ]);
    state.pulse = pulse;
    if (res.status === 429) {
      failGate("errorBusy");
      return;
    }
    if (!res.ok) {
      failGate("errorBody");
      return;
    }
    const data = await res.json();
    if (!data || !data.ok) {
      failGate("errorBody");
      return;
    }
    state.data = data;
    showBroadcast();
  } catch (_e) {
    failGate("errorNetwork");
  } finally {
    state.loading = false;
  }
}

/** Generic on purpose: the page never says whether a code exists. */
function failGate(bodyKey) {
  state.data = null;
  el.stage.hidden = true;
  el.gate.hidden = false;
  showMessage(bodyKey);
  el.codeInput.focus();
}

function showBroadcast() {
  const t = ui();
  const data = state.data;
  el.gate.hidden = true;
  hideMessage();
  el.stage.hidden = false;
  el.windowLabel.textContent = t.windowLabel(data.window ? data.window.days : WINDOW_DAYS);
  state.cards = buildCards(data);
  renderCards();
  setStoryMode(state.storyMode);
  announce();
  // Reduced motion: start paused and never start the timer on our own.
  if (!reducedMotion && state.storyMode) play();
}

/* ------------------------------------------------------------------ events */

el.langToggle.addEventListener("click", () => {
  state.lang = state.lang === "es" ? "en" : "es";
  writeLang(state.lang);
  applyChrome();
  syncPlayButton();
  if (state.data) {
    const wasPlaying = state.playing;
    pause();
    loadBroadcast().then(() => {
      if (!wasPlaying) pause();
    });
  }
});

el.gateForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const code = el.codeInput.value.trim().toUpperCase();
  if (!code) return;
  // Kept out of the address bar and out of history on purpose.
  state.code = code;
  rememberCode(code);
  loadBroadcast();
});

el.btnPrev.addEventListener("click", () => {
  pause();
  goTo(state.index - 1, { focus: true });
});

el.btnNext.addEventListener("click", () => {
  pause();
  goTo(state.index + 1, { focus: true });
});

el.btnPlay.addEventListener("click", () => {
  if (state.playing) pause();
  else play();
});

el.btnMode.addEventListener("click", () => {
  setStoryMode(!state.storyMode);
});

el.btnPrint.addEventListener("click", () => {
  pause();
  window.print();
});

// Any pointer or focus inside the cards means someone is reading: stop moving.
el.cards.addEventListener("pointerdown", () => pause());
el.cards.addEventListener("focusin", () => pause());

document.addEventListener("keydown", (event) => {
  if (el.stage.hidden || !state.storyMode) return;
  const tag = event.target && event.target.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
  if (event.metaKey || event.ctrlKey || event.altKey) return;
  if (event.key === "ArrowRight") {
    pause();
    goTo(state.index + 1, { focus: true });
  } else if (event.key === "ArrowLeft") {
    pause();
    goTo(state.index - 1, { focus: true });
  } else if (event.key === "Home") {
    pause();
    goTo(0, { focus: true });
  } else if (event.key === "End") {
    pause();
    goTo(state.cards.length - 1, { focus: true });
  } else if (event.key === " " || event.key === "Spacebar") {
    if (event.target && event.target.closest && event.target.closest("button, a")) return;
    event.preventDefault();
    if (state.playing) pause();
    else play();
  } else {
    return;
  }
});

document.addEventListener("visibilitychange", () => {
  if (document.hidden) pause();
});

window.addEventListener("beforeprint", () => pause());

/* -------------------------------------------------------------------- boot */

applyChrome();
syncPlayButton();
if (state.code) loadBroadcast();
else el.gate.hidden = false;
