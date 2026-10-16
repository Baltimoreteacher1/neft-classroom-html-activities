// The Learning Supports that change what a page does: one problem at a time,
// saying an answer, calm mode, and read-aloud with the spoken word highlighted.
import assert from "node:assert/strict";
import test from "node:test";
import { JSDOM } from "jsdom";

const dom = new JSDOM("<!doctype html><html lang='en'><body></body></html>", {
  url: "http://localhost/",
  pretendToBeVisual: true,
});
const { window } = dom;

/** A fake speech engine: speaks word by word and fires the boundary events. */
const spoken = [];
const synth = {
  _cur: null,
  getVoices: () => [{ name: "Test", lang: "en-US", localService: true }],
  addEventListener() {},
  cancel() {
    const u = synth._cur;
    synth._cur = null;
    u?.onerror?.({ error: "interrupted" });
  },
  speak(u) {
    synth._cur = u;
    spoken.push({ text: u.text, lang: u.lang, rate: u.rate });
    const starts = [...u.text.matchAll(/\S+/g)].map((m) => m.index);
    setTimeout(() => {
      if (synth._cur !== u) return;
      u.onstart?.({});
      starts.forEach((charIndex, i) =>
        setTimeout(() => synth._cur === u && u.onboundary?.({ name: "word", charIndex }), i * 2),
      );
      setTimeout(() => {
        if (synth._cur === u) {
          synth._cur = null;
          u.onend?.({});
        }
      }, starts.length * 2 + 4);
    }, 1);
  },
};
window.speechSynthesis = synth;
window.SpeechSynthesisUtterance = class {
  constructor(text) {
    this.text = text;
  }
};
Object.assign(globalThis, {
  window,
  document: window.document,
  localStorage: window.localStorage,
  HTMLElement: window.HTMLElement,
  HTMLInputElement: window.HTMLInputElement,
  HTMLTextAreaElement: window.HTMLTextAreaElement,
  HTMLMediaElement: window.HTMLMediaElement,
  Element: window.Element,
  Node: window.Node,
  Event: window.Event,
  FocusEvent: window.FocusEvent,
  MutationObserver: window.MutationObserver,
  SpeechSynthesisUtterance: window.SpeechSynthesisUtterance,
});
Object.defineProperty(globalThis, "navigator", { value: window.navigator, configurable: true });
window.Element.prototype.scrollIntoView = () => {};

const { createPrefs } = await import("./ls-prefs.js");
const { installFocus, findGroups } = await import("./ls-focus.js");
const { isAnswerField, writeToField } = await import("./ls-voice-answer.js");
const { installCalm } = await import("./ls-calm.js");
const { createReader } = await import("./ls-read-aloud.js");

function memoryPrefs() {
  const data = new Map();
  return createPrefs({
    storage: /** @type {any} */ ({
      getItem: (k) => (data.has(k) ? data.get(k) : null),
      setItem: (k, v) => void data.set(k, String(v)),
    }),
  });
}
const tick = (ms = 200) => new Promise((r) => setTimeout(r, ms));
const setPage = (html) => {
  document.body.innerHTML = html;
};
const problems = (n) =>
  `<section id="list">${Array.from({ length: n }, (_, i) => `<article class="problem-card" id="p${i + 1}"><p>Problem ${i + 1} <input id="a${i + 1}"></p></article>`).join("")}</section>`;

// ---------- one problem at a time ----------

test("one problem at a time: only the current problem shows, with a Back / Next bar", () => {
  setPage(problems(3));
  const prefs = memoryPrefs();
  installFocus(prefs);
  assert.equal(document.querySelector(".ls-focus-bar"), null, "off until the student turns it on");
  prefs.set({ focus: true });
  const cards = [...document.querySelectorAll(".problem-card")];
  assert.deepEqual(cards.map((c) => c.classList.contains("ls-focus-hidden")), [false, true, true]);
  const [back, next] = document.querySelectorAll(".ls-focus-bar button");
  assert.equal(back.disabled, true);
  assert.match(document.querySelector(".ls-focus-count").textContent, /Problem 1 of 3/);
  assert.match(document.querySelector(".ls-focus-count").textContent, /Problema 1 de 3/);

  next.click();
  assert.deepEqual(cards.map((c) => c.classList.contains("ls-focus-hidden")), [true, false, true]);
  assert.equal(document.activeElement, cards[1], "focus moves to the problem that appears");
  assert.equal(back.disabled, false);
  next.click();
  assert.equal(next.disabled, true);
  prefs.set({ focus: false });
});

test("turning it off puts every problem back, answers intact", () => {
  setPage(problems(3));
  const prefs = memoryPrefs();
  installFocus(prefs);
  prefs.set({ focus: true });
  document.getElementById("a1").value = "42";
  prefs.set({ focus: false });
  assert.equal(document.querySelectorAll(".ls-focus-hidden").length, 0);
  assert.equal(document.querySelector(".ls-focus-bar"), null);
  assert.equal(document.getElementById("a1").value, "42");
});

test("something that sends focus into a hidden problem reveals it", () => {
  setPage(problems(3));
  const prefs = memoryPrefs();
  installFocus(prefs);
  prefs.set({ focus: true });
  document.getElementById("a3").focus();
  assert.equal(document.getElementById("p3").classList.contains("ls-focus-hidden"), false);
  assert.equal(document.getElementById("p1").classList.contains("ls-focus-hidden"), true);
  prefs.set({ focus: false });
});

test("problems added later join the pages, and the student keeps their place", async () => {
  setPage(problems(2));
  const prefs = memoryPrefs();
  installFocus(prefs);
  prefs.set({ focus: true });
  document.querySelectorAll(".ls-focus-bar button")[1].click(); // on problem 2
  const extra = document.createElement("article");
  extra.className = "problem-card";
  extra.id = "p3";
  extra.textContent = "Problem 3";
  document.getElementById("list").append(extra);
  await tick(300);
  assert.match(document.querySelector(".ls-focus-count").textContent, /Problem 2 of 3/);
  assert.equal(document.getElementById("p2").classList.contains("ls-focus-hidden"), false);
  prefs.set({ focus: false });
});

test("a single problem is left alone, and nested problems are not paged separately", () => {
  setPage(problems(1));
  assert.equal(findGroups(document).size, 0);
  setPage('<div><article class="problem-card"><div class="problem-card">inner</div></article><article class="problem-card"></article></div>');
  assert.equal([...findGroups(document).values()][0].length, 2);
});

test("a page that already pages its own problems is left to its own pager", () => {
  setPage(problems(3));
  document.getElementById("p2").style.display = "none";
  document.getElementById("p3").style.display = "none";
  assert.equal(findGroups(document).size, 0, "only one problem is drawn, so the page is paging them");
  document.getElementById("p2").style.display = "";
  assert.equal(findGroups(document).size, 1);
});

// ---------- say my answers ----------

test("which boxes get the microphone", () => {
  setPage(`
    <article class="problem-card"><input id="num" type="text" inputmode="decimal"><input id="txt" type="text"><textarea id="why"></textarea></article>
    <input id="search" type="text">
    <input id="name" type="text" autocomplete="name">
    <input id="pw" type="password">
    <input id="ro" type="number" readonly>
    <input id="off" type="text" data-ls-voice="off">
    <input id="loose" type="number">`);
  const yes = (id) => isAnswerField(document.getElementById(id));
  assert.equal(yes("num"), true);
  assert.equal(yes("txt"), true, "a text box inside a problem");
  assert.equal(yes("why"), true);
  assert.equal(yes("loose"), true, "a number box anywhere");
  assert.equal(yes("search"), false, "a text box outside any problem");
  assert.equal(yes("name"), false);
  assert.equal(yes("pw"), false);
  assert.equal(yes("ro"), false);
  assert.equal(yes("off"), false);
});

test("spoken text lands in the box the way typing would", () => {
  setPage('<input id="a" type="text"><textarea id="t"></textarea>');
  const seen = [];
  const a = document.getElementById("a");
  a.addEventListener("input", () => seen.push(["input", a.value]));
  a.addEventListener("change", () => seen.push(["change", a.value]));
  writeToField(a, "12.5");
  assert.equal(a.value, "12.5");
  assert.deepEqual(seen, [["input", "12.5"], ["change", "12.5"]]);
  const t = document.getElementById("t");
  writeToField(t, "first");
  writeToField(t, "second");
  assert.equal(t.value, "first second", "a longer answer is added to, not replaced");
});

// ---------- calm mode ----------

test("calm mode answers 'does this person want less motion?' and silences new audio", async () => {
  /** @type {any[]} */
  const made = [];
  window.matchMedia = (q) => ({ matches: /no-preference/.test(q), media: q, addEventListener() {} });
  window.AudioContext = class {
    constructor() {
      this.state = "running";
      made.push(this);
    }
    suspend() {
      this.state = "suspended";
      return Promise.resolve();
    }
    resume() {
      this.state = "running";
      return Promise.resolve();
    }
  };
  const prefs = memoryPrefs();
  installCalm(prefs);
  const reduce = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const fine = () => window.matchMedia("(prefers-reduced-motion: no-preference)").matches;
  assert.equal(reduce(), false);
  assert.equal(fine(), true);

  prefs.set({ calm: true });
  assert.equal(document.documentElement.classList.contains("ls-calm"), true);
  assert.equal(reduce(), true);
  assert.equal(fine(), false);
  assert.equal(window.matchMedia("(min-width: 600px)").matches, false, "other queries are untouched");

  const ctx = new window.AudioContext();
  await ctx.resume();
  assert.equal(ctx.state, "suspended", "a sound made while calm stays silent");

  assert.equal(window.NT_MUTED, true, "the site-wide mute switch is on");

  prefs.set({ calm: false });
  assert.equal(window.NT_MUTED, undefined, "and put back as it was");
  assert.equal(document.documentElement.classList.contains("ls-calm"), false);
  assert.equal(reduce(), false);
  await ctx.resume();
  assert.equal(ctx.state, "running", "turning calm off restores sound without a reload");
});

// ---------- read aloud ----------

function reader(prefs, onState) {
  return createReader({ getPrefs: () => prefs.get(), getLang: () => "en", onState });
}

test("read aloud speaks the page and highlights the word being said", async () => {
  setPage("<main><h1>Ratios</h1><p>Find 3:4 of 12.</p></main>");
  spoken.length = 0;
  const prefs = memoryPrefs();
  prefs.set({ rate: 0.7 });
  const seen = [];
  const states = [];
  const r = reader(prefs, (s) => states.push(s));
  assert.equal(r.read(), true);
  const watch = setInterval(() => {
    const word = document.querySelector(".ls-caption mark")?.textContent.trim();
    if (word && seen.at(-1) !== word) seen.push(word);
  }, 1);
  await tick(250);
  clearInterval(watch);
  assert.deepEqual(spoken.map((s) => s.text), ["Ratios.", "Find 3 to 4 of 12."]);
  assert.equal(spoken[0].rate, 0.7);
  assert.deepEqual(seen, ["Ratios", "Find", "3:4", "of", "12."], "the DISPLAYED word is highlighted, not the spoken one");
  assert.equal(document.querySelector(".ls-caption"), null, "the caption goes away when reading ends");
  assert.deepEqual(states, ["playing", "idle"]);
});

test("Stop ends the reading at once and clears the highlight", async () => {
  setPage("<main><p>One two three four five six seven eight nine ten.</p></main>");
  const r = reader(memoryPrefs());
  r.read();
  await tick(8);
  r.stop();
  assert.equal(r.state, "idle");
  assert.equal(document.querySelector(".ls-caption"), null);
  assert.equal(document.documentElement.hasAttribute("data-ls-reading"), false);
  assert.equal(synth._cur, null);
});

test("an empty page is reported, not read in silence", () => {
  setPage("<main></main>");
  const states = [];
  const r = reader(memoryPrefs(), (s) => states.push(s));
  assert.equal(r.read(), false);
  assert.deepEqual(states, ["empty"]);
});

test("a device with no speech reports it instead of failing", () => {
  const saved = window.speechSynthesis;
  delete window.speechSynthesis;
  try {
    const states = [];
    const r = reader(memoryPrefs(), (s) => states.push(s));
    assert.equal(r.read(), false);
    assert.deepEqual(states, ["unsupported"]);
  } finally {
    window.speechSynthesis = saved;
  }
});

test("each language chunk is spoken with its own language", async () => {
  setPage("<main><p>Hello there friend.</p><p lang='es'>Hola amigo mío.</p></main>");
  spoken.length = 0;
  reader(memoryPrefs()).read();
  await tick(250);
  assert.deepEqual(spoken.map((s) => s.lang), ["en-US", "es-US"]);
});
