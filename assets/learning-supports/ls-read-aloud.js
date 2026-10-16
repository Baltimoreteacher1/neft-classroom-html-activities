// Read-aloud with the spoken word highlighted on the page.
//
// Uses the browser's built-in speech synthesis, so it works with no network
// when the device has a voice saved on it. The page is spoken in short pieces
// (some browsers cut a long utterance off after about fifteen seconds), and the
// voice's word-boundary events move the highlight. Network voices often send no
// boundary events at all; then the highlight is paced by an estimate instead of
// freezing on the first word.
//
// The highlight uses the CSS Custom Highlight API, which draws over the page
// without changing it. Where that is missing a small caption shows the sentence
// with the current word marked, so the feature never depends on one browser.

import { makeUtterance } from "./engine-speech.js";
import { collectTokens, resolveTarget } from "./ls-collect.js";
import { buildChunks, tokenIndexAt } from "./ls-speech-text.js";

/** @typedef {import("./ls-prefs.js").Prefs} Prefs */
/** @typedef {import("./ls-speech-text.js").Lang} Lang */
/** @typedef {"idle" | "playing" | "empty" | "unsupported"} ReaderState */

const HIGHLIGHT_NAME = "ls-reading";
/** Words a minute at rate 1; used only when the voice sends no boundary events. */
const WORDS_PER_MINUTE = 160;
/** How long to wait for a first boundary event before pacing the highlight ourselves. */
const BOUNDARY_GRACE_MS = 900;

/** @returns {boolean} */
export function canSpeak() {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

/** @returns {any} */
const highlights = () => (typeof CSS !== "undefined" ? /** @type {any} */ (CSS).highlights : null);

/** @param {Lang} lang */
const bcp47 = (lang) => (lang === "es" ? "es-US" : "en-US");

/**
 * @param {{
 *   getPrefs: () => Prefs,
 *   getLang: () => Lang,
 *   onState?: (state: ReaderState, detail?: { kind?: string }) => void,
 *   getAnchor?: () => Element | null,
 * }} deps getLang is the student's chosen page language (EN / ES); getAnchor is
 *   the element the student was last working in, so "read this problem" works
 *   even though the panel button has focus
 */
export function createReader({ getPrefs, getLang, onState, getAnchor }) {
  /** @type {ReaderState} */
  let state = "idle";
  let session = 0;
  /** The utterance being spoken: held so the browser cannot collect it mid-sentence. */
  const live = { /** @type {SpeechSynthesisUtterance | null} */ utterance: null };
  /** @type {HTMLElement | null} */
  let caption = null;
  /** @type {ReturnType<typeof setInterval> | null} */
  let pacer = null;

  /** @param {ReaderState} next @param {{ kind?: string }} [detail] */
  function setState(next, detail) {
    state = next;
    onState?.(next, detail);
  }

  function clearVisuals() {
    if (pacer) clearInterval(pacer);
    pacer = null;
    highlights()?.delete(HIGHLIGHT_NAME);
    caption?.remove();
    caption = null;
    document.documentElement.removeAttribute("data-ls-reading");
  }

  /**
   * @param {import("./ls-collect.js").PageToken} token
   * @param {import("./ls-collect.js").PageToken[]} sentence
   */
  function show(token, sentence) {
    document.documentElement.setAttribute("data-ls-reading", "");
    const registry = highlights();
    if (registry && typeof Highlight !== "undefined") {
      const range = document.createRange();
      range.setStart(token.node, token.start);
      range.setEnd(token.node, token.end);
      registry.set(HIGHLIGHT_NAME, new Highlight(range));
      const el = token.node.parentElement;
      if (el && !inView(el)) {
        el.scrollIntoView({
          block: "center",
          behavior: getPrefs().calm ? "auto" : "smooth",
        });
      }
      return;
    }
    // No Highlight API: show the sentence in a caption with the word marked.
    if (!caption) {
      caption = document.createElement("div");
      caption.className = "ls-caption";
      caption.setAttribute("data-ls-ui", "");
      caption.setAttribute("aria-hidden", "true");
      document.body.append(caption);
    }
    caption.textContent = "";
    for (const t of sentence) {
      const word = t === token ? document.createElement("mark") : document.createElement("span");
      word.textContent = `${t.node.data.slice(t.start, t.end)} `;
      caption.append(word);
    }
  }

  /** @param {Element} el */
  function inView(el) {
    const r = el.getBoundingClientRect();
    return r.top >= 0 && r.bottom <= (window.innerHeight || document.documentElement.clientHeight);
  }

  function stop() {
    session += 1;
    if (canSpeak()) window.speechSynthesis.cancel();
    live.utterance = null;
    clearVisuals();
    if (state === "playing") setState("idle");
  }

  /**
   * Read the selection, the problem being worked on, or the main page.
   * @param {{ root: Node, range?: Range | null, kind?: string }} [target]
   *   defaults to the best guess from the selection or where the student was
   */
  function read(target) {
    if (!canSpeak()) {
      setState("unsupported");
      return false;
    }
    stop();
    const picked = target ?? resolveTarget(document, getAnchor?.());
    const prefs = getPrefs();
    const want = prefs.readLang === "auto" ? getLang() : prefs.readLang;
    const tokens = collectTokens(picked.root, {
      want,
      range: "range" in picked ? (picked.range ?? null) : null,
    });
    const chunks = buildChunks(tokens);
    if (!chunks.length) {
      setState("empty");
      return false;
    }
    const mine = ++session;
    setState("playing", { kind: "kind" in picked ? String(picked.kind) : "page" });

    /** @param {number} i */
    function playChunk(i) {
      if (mine !== session) return;
      if (i >= chunks.length) {
        clearVisuals();
        live.utterance = null;
        setState("idle");
        return;
      }
      const chunk = chunks[i];
      const members = chunk.indices.map((k) => tokens[k]);
      const { rate, offlineVoices } = getPrefs();
      const utter = makeUtterance(chunk.text, bcp47(chunk.lang), {
        rate,
        localOnly: offlineVoices,
      });
      live.utterance = utter;
      let sawBoundary = false;
      let cursor = 0;

      /** @param {number} at */
      const highlightAt = (at) => {
        const idx = tokenIndexAt(chunk, at);
        show(tokens[idx], members);
      };
      utter.onstart = () => {
        if (mine !== session) return;
        show(members[0], members);
        pacer = setTimeout(() => {
          if (sawBoundary || mine !== session) return;
          // The voice sends no word events: pace the highlight by an estimate.
          const msPerWord = 60000 / (WORDS_PER_MINUTE * rate);
          pacer = setInterval(() => {
            if (mine !== session || cursor >= members.length - 1) return;
            cursor += 1;
            show(members[cursor], members);
          }, msPerWord);
        }, BOUNDARY_GRACE_MS);
      };
      utter.onboundary = (e) => {
        if (mine !== session || (e.name && e.name !== "word")) return;
        sawBoundary = true;
        if (pacer) clearInterval(pacer);
        pacer = null;
        highlightAt(e.charIndex);
      };
      const next = () => {
        if (pacer) clearInterval(pacer);
        pacer = null;
        playChunk(i + 1);
      };
      utter.onend = next;
      utter.onerror = (e) => {
        // Our own cancel() reports "interrupted"/"canceled"; anything else is a
        // real failure and stops the read rather than skipping text silently.
        if (mine !== session) return;
        if (e.error === "interrupted" || e.error === "canceled") return;
        stop();
      };
      // A beat after cancel() so browsers that drop an immediate speak() keep it.
      setTimeout(() => {
        if (mine === session) window.speechSynthesis.speak(utter);
      }, 30);
    }
    playChunk(0);
    return true;
  }

  if (typeof window !== "undefined") {
    window.addEventListener("pagehide", stop);
  }

  return {
    read,
    stop,
    get state() {
      return state;
    },
  };
}
