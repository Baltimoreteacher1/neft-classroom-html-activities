// Digital players for the eight lesson-companion kinds, mounted in jsdom with payloads from a REAL generated lesson
// (g6-math-u2). Each kind must render, be operable with the keyboard (native buttons, Enter/Space), label every
// control, show no timer or countdown, finish through ctx.done, and keep student data on the device.
import assert from "node:assert/strict";
import { test } from "node:test";
import { JSDOM } from "jsdom";
import { loadLessons } from "../functions/_lib/bcpss/lessons.js";

const dom = new JSDOM('<!doctype html><html lang="en"><body></body></html>', {
  url: "https://example.test/",
  pretendToBeVisual: true,
});
const { window } = dom;
for (const k of ["window", "document", "Node", "HTMLElement", "Event", "KeyboardEvent"]) {
  Object.defineProperty(globalThis, k, {
    value: k === "window" ? window : window[k],
    configurable: true,
    writable: true,
  });
}
Object.defineProperty(globalThis, "navigator", { value: window.navigator, configurable: true });
globalThis.CSS = { escape: (s) => String(s).replace(/[^\w-]/g, (c) => `\\${c}`) };
window.matchMedia = () => ({ matches: true }); // reduced motion: no animation timers
window.HTMLMediaElement.prototype.play = () => Promise.resolve();
window.HTMLElement.prototype.scrollIntoView = () => {};

const { shuffle, rng } = await import("../bcpss-teachers/language-studio/studio-core.js");

const NEW_KINDS = [
  "flash_retrieval",
  "listen_and_show",
  "sentence_xray",
  "speak_and_record",
  "exit_check",
  "point_and_say",
  "tpr_cards",
  "home_language_bridge",
];
const set = await loadLessons("g6-math-u2");
assert.ok(set?.lessons?.length, "g6-math-u2 lessons load");
const real = Object.fromEntries(NEW_KINDS.map((k) => [k, []]));
for (const lesson of set.lessons) {
  const acts = [
    ...lesson.arc.map((s) => s.activity),
    ...(lesson.newcomer_path || []),
    lesson.extension,
    lesson.exit_check,
  ].filter(Boolean);
  for (const a of acts) if (real[a.kind]) real[a.kind].push({ lessonId: lesson.id, activity: a });
}

// ---------- environment helpers ----------
let intervals = 0;
window.setInterval = () => {
  intervals++;
  return 0;
};
let network = 0;
window.fetch = () => {
  network++;
  return Promise.reject(new Error("no network in lesson kinds"));
};

function installSpeech() {
  const spoken = [];
  window.speechSynthesis = {
    speak(u) {
      spoken.push(u);
      queueMicrotask(() => {
        u.onboundary?.({ name: "word", charIndex: 0 });
        u.onend?.();
      });
    },
    cancel() {},
  };
  globalThis.SpeechSynthesisUtterance = class {
    constructor(text) {
      this.text = text;
    }
  };
  return spoken;
}
function removeSpeech() {
  delete window.speechSynthesis;
  delete globalThis.SpeechSynthesisUtterance;
}

const done = [];
let cleanup = null;
let root = null;
function ctxFor(entry, extra = {}) {
  return {
    payload: entry.activity.payload,
    activity: entry.activity,
    lessonId: entry.lessonId,
    level: "l3_4",
    studio: { vocab: [] },
    shuffle,
    rng,
    tts: async () => false,
    announce() {},
    vocabIcon: () => "",
    done: (r) => done.push(r),
    ...extra,
  };
}
async function mountKind(kind, entry, extra) {
  document.body.replaceChildren();
  root = document.createElement("div");
  document.body.append(root);
  done.length = 0;
  const mod = await import(`../bcpss-teachers/language-studio/studio-kinds/${kind}.js`);
  cleanup = mod.default(root, ctxFor(entry, extra));
  return root;
}
const $ = (s) => root.querySelector(s);
const $$ = (s) => [...root.querySelectorAll(s)];
const key = (k) => $(`[data-key="${k}"]`);
/** Enter or Space on a focused native button: the browser fires `click` as the default action. */
function press(el, k = "Enter") {
  assert.ok(el, "control exists");
  assert.equal(el.tagName, "BUTTON", "keyboard controls are native buttons");
  el.focus();
  const down = new window.KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true });
  if (el.dispatchEvent(down) && !(el.disabled === true)) el.click();
}
const settle = () => new Promise((r) => setTimeout(r, 0));

const nameOf = (el) =>
  (el.getAttribute("aria-label") || el.labels?.[0]?.textContent || el.textContent || "").trim();
function assertAccessible(label) {
  const bad = $$("button, input, select, textarea").filter((el) => !nameOf(el));
  assert.equal(bad.length, 0, `${label}: every control has a name`);
  for (const el of $$('[role="group"], [role="img"], audio'))
    assert.ok(
      el.getAttribute("aria-label") || el.getAttribute("aria-labelledby"),
      `${label}: ${el.tagName} is labelled`,
    );
  for (const el of $$("[aria-labelledby]"))
    assert.ok(
      document.getElementById(el.getAttribute("aria-labelledby")),
      `${label}: labelledby target exists`,
    );
  assert.equal(
    $$('[role="button"], [tabindex]:not([tabindex="-1"])').length,
    0,
    `${label}: only native controls take focus`,
  );
  assert.equal($$('[aria-live="assertive"]').length, 0, `${label}: nothing assertive`);
  const ids = $$("[id]").map((n) => n.id);
  assert.equal(new Set(ids).size, ids.length, `${label}: unique ids`);
  assert.equal(
    $$('[role="timer"], progress, [class*="timer"], [class*="countdown"]').length,
    0,
    `${label}: no timer element`,
  );
  assert.doesNotMatch(
    root.textContent,
    /countdown|timer\b|time left|seconds left|hurry|\b\d+:\d{2}\b/i,
    `${label}: no timer words`,
  );
}
test.afterEach(() => {
  cleanup?.();
  cleanup = null;
  removeSpeech();
});

// ---------- every real payload renders ----------
for (const kind of NEW_KINDS) {
  test(`${kind}: real payloads from g6-math-u2 render with labelled, timer-free controls`, async () => {
    assert.ok(real[kind].length > 0, `the unit generates at least one ${kind}`);
    for (const entry of real[kind]) {
      installSpeech();
      await mountKind(kind, entry);
      assert.ok(root.textContent.trim().length > 20, `${kind} (${entry.lessonId}) renders`);
      assert.ok(root.classList.contains("sl"), "lesson-kind root class");
      assertAccessible(`${kind} ${entry.lessonId}`);
      cleanup?.();
      removeSpeech();
    }
    assert.equal(intervals, 0, "no setInterval anywhere");
  });
  test(`${kind}: projector mode adds sl-projector`, async () => {
    await mountKind(kind, real[kind][0], { projector: true });
    assert.ok(root.classList.contains("sl-projector"));
  });
}

// ---------- play-throughs ----------
test("flash_retrieval: answer stays hidden until Show answer; Not yet returns the card once; finishes", async () => {
  const entry = real.flash_retrieval[0];
  const n = entry.activity.payload.cards.length;
  await mountKind("flash_retrieval", entry);
  assert.equal($("#slAnswer").hidden, true, "answer hidden before the attempt");
  assert.equal(
    $("[data-key=got]").closest("[hidden]") !== null,
    true,
    "rating hidden before reveal",
  );
  let seen = 0;
  while (!key("finish")) {
    assert.ok(seen < n + 2, "terminates");
    press(key("reveal"), "Space");
    assert.equal($("#slAnswer").hidden, false);
    press(seen === 0 ? key("not") : key("got"));
    seen++;
  }
  assert.equal(seen, n + 1, "the not-yet card came back exactly once");
  press(key("finish"));
  assert.equal(done.length, 1);
  assert.ok(done[0].stars >= 1);
});

test("listen_and_show: audio first, caption after the first listen, hint, kind feedback, why after the right pick", async () => {
  const entry = real.listen_and_show[0];
  const { items } = entry.activity.payload;
  const spoken = installSpeech();
  await mountKind("listen_and_show", entry);
  assert.equal(spoken.length, 0, "does not autoplay");
  assert.equal($("#slCaption").hidden, true, "no text before the first listen");
  press(key("o0"));
  assert.match($(".sg-feedback").textContent, /Listen first/i, "gentle nudge, nothing chosen");
  press($(".sl-listen__go"));
  await settle();
  assert.equal(spoken.length, 1);
  assert.equal(spoken[0].rate, 0.95);
  assert.equal($("#slCaption").hidden, false, "caption after listening");
  press($(".sl-listen__slow"));
  assert.equal(spoken[1].rate, 0.7);
  for (let i = 0; i < items.length; i++) {
    const it = items[i];
    const wrongK = it.options.findIndex((_, k) => k !== it.answer);
    if (i === 0) {
      press(key("hint"));
      assert.equal($$(".sl-opt.is-out").length, 1, "hint removes one choice");
    }
    press(key(`o${wrongK === 0 && i === 0 ? 1 : wrongK}`));
    assert.doesNotMatch(
      $(".sg-feedback").textContent,
      new RegExp(it.options[it.answer].label ?? "zzz", "i"),
      "a wrong pick never reveals the answer",
    );
    assert.equal($(".sl-why"), null, "no explanation before the right pick");
    press(key(`o${it.answer}`));
    assert.match($(".sl-why").textContent, /Why:/);
    if (i + 1 < items.length) {
      press(key("next"));
      press($(".sl-listen__go"));
    }
  }
  press(key("next"));
  assert.equal(done.length, 1, "finished via ctx.done");
});

test("listen_and_show: with no speech the text is shown at once and says so", async () => {
  removeSpeech();
  await mountKind("listen_and_show", real.listen_and_show[0]);
  assert.equal($("#slCaption").hidden, false);
  assert.match(root.textContent, /Audio is not available/);
  press(key(`o${real.listen_and_show[0].activity.payload.items[0].answer}`));
  assert.ok($(".sl-why"));
});

test("sentence_xray: chunks join to text, tone has a label and a glyph, tap to hear, rebuild by keyboard, arrow keys move", async () => {
  const entry = real.sentence_xray[0];
  const { text, chunks } = entry.activity.payload;
  assert.equal(chunks.map((c) => c.text).join(" "), text, "chunks join to text exactly");
  const spoken = installSpeech();
  await mountKind("sentence_xray", entry);
  for (const c of $$(".sl-xray .sl-chunk"))
    assert.ok(
      c.querySelector(".sl-chunk__tag").textContent.trim().length > 3,
      "non-colour cue on every chunk",
    );
  press($(".sl-xray .sl-chunk"));
  await settle();
  assert.equal(spoken[0].text, chunks[0].text);
  assert.match($(".sl-xpanel").textContent, new RegExp(chunks[0].role));
  press(key("m-build"));
  // wrong order first (reverse): no completion, specific kind feedback
  const n = chunks.length;
  for (let i = 0; i < n; i++) {
    press(key(`c${i}`));
    press(key(`slot${n - 1 - i}`));
  }
  press(key("check"));
  assert.equal(done.length, 0);
  assert.match($(".sg-feedback").textContent, /Not yet/);
  // arrow keys move a placed chunk, then rebuild in the right order
  const slot0 = key("slot0");
  slot0.focus();
  slot0.dispatchEvent(
    new window.KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true, cancelable: true }),
  );
  assert.ok(key("slot1").classList.contains("sl-chunk"), "still filled after a move");
  for (let pos = 0; pos < n; pos++) press(key(`slot${pos}`)); // pick every chunk back up
  press(key(`slot${n - 1}`)); // drop the active-slot mark so chunks go where they are told
  for (let i = 0; i < n; i++) {
    press(key(`c${i}`));
    press(key(`slot${i}`));
  }
  press(key("check"));
  assert.match($(".sg-feedback").textContent, /rebuilt it/i);
  press(key("finish"), "Space");
  assert.equal(done.length, 1);
});

test("speak_and_record: text-only self-check when MediaRecorder is missing; stays on device", async () => {
  delete window.MediaRecorder;
  delete globalThis.MediaRecorder;
  const entry = real.speak_and_record[0];
  await mountKind("speak_and_record", entry);
  assert.match($(".sl-note--warn").textContent, /cannot record/);
  assert.equal($$("input[type=checkbox]").length, 3, "3-item checklist");
  assert.equal(key("finish").disabled, false);
  $$("input[type=checkbox]")[0].click();
  press(key("finish"));
  assert.equal(done.length, 1);
  assert.match(done[0].detail, /1 of 3/);
  assert.equal(network, 0);
});

test("speak_and_record: record, stop, play back, record again; denied permission degrades kindly", async () => {
  const revoked = [];
  let denied = false;
  const track = { stop() {} };
  Object.defineProperty(window.navigator, "mediaDevices", {
    configurable: true,
    value: {
      getUserMedia: async () =>
        denied ? Promise.reject(new Error("denied")) : { getTracks: () => [track] },
    },
  });
  class FakeRecorder {
    start() {
      this.state = "recording";
    }
    stop() {
      this.state = "inactive";
      this.ondataavailable?.({ data: { size: 4 } });
      this.onstop?.();
    }
  }
  window.MediaRecorder = globalThis.MediaRecorder = FakeRecorder;
  const make = URL.createObjectURL;
  const revoke = URL.revokeObjectURL;
  URL.createObjectURL = () => "blob:fake";
  URL.revokeObjectURL = (u) => revoked.push(u);
  try {
    await mountKind("speak_and_record", real.speak_and_record[0]);
    assert.equal(key("finish").disabled, true, "finish waits for a recording");
    press(key("record"));
    await settle();
    assert.ok(key("stop"), "recording shows Stop");
    assert.doesNotMatch(root.textContent, /\b\d+:\d{2}\b|seconds/, "no elapsed-time display");
    press(key("stop"));
    assert.ok(key("play") && key("again"));
    assert.equal(key("finish").disabled, false);
    press(key("play"));
    press(key("again"));
    assert.deepEqual(revoked, ["blob:fake"], "re-record drops the old recording");
    denied = true;
    press(key("record"));
    await settle();
    assert.match($(".sl-note--warn").textContent, /microphone is off or blocked/);
    assert.equal(key("finish").disabled, false, "text-only self-check can finish");
    assertAccessible("speak_and_record denied");
  } finally {
    URL.createObjectURL = make;
    URL.revokeObjectURL = revoke;
    delete window.navigator.mediaDevices;
    delete window.MediaRecorder;
    delete globalThis.MediaRecorder;
  }
});

test("exit_check: items then a can-do rating, stored on this device only", async () => {
  const entry = real.exit_check[0];
  const { items, can_do: canDo } = entry.activity.payload;
  await mountKind("exit_check", entry);
  for (const it of items) {
    const wrongK = it.options.findIndex((_, k) => k !== it.answer);
    press(key(`o${wrongK}`));
    assert.equal($(".sl-why"), null);
    press(key(`o${it.answer}`));
    press(key("next"));
  }
  assert.equal($(".sl-prompt").textContent, canDo);
  assert.deepEqual(
    $$(".sl-rating").map((b) => b.textContent.trim()),
    ["With help", "By myself", "And I can teach it"],
  );
  assert.equal(key("finish").disabled, true, "choose a rating first");
  press(key("by_myself"));
  const saved = JSON.parse(window.localStorage.getItem(`bcpss-lesson:${entry.lessonId}:rating`));
  assert.equal(saved.rating, "by_myself");
  assert.equal(key("by_myself").getAttribute("aria-pressed"), "true");
  assertAccessible("exit_check rating");
  press(key("finish"));
  assert.equal(done.length, 1);
  assert.equal(network, 0, "nothing sent to a server");
});

test("exit_check: falls back to a fixed key when the shell gives no lesson id", async () => {
  const entry = { ...real.exit_check[0], lessonId: undefined };
  await mountKind("exit_check", entry);
  for (const it of entry.activity.payload.items) {
    press(key(`o${it.answer}`));
    press(key("next"));
  }
  press(key("can_teach"));
  assert.equal(
    JSON.parse(window.localStorage.getItem("bcpss-lesson:lesson:rating")).rating,
    "can_teach",
  );
});

for (const [kind, confirm] of [
  ["point_and_say", "I said it"],
  ["tpr_cards", "I did it"],
  ["home_language_bridge", "I said it both ways"],
]) {
  test(`${kind}: audio, a big confirmation button, no reading needed to finish`, async () => {
    const entry = real[kind][0];
    const n = entry.activity.payload.items.length;
    const spoken = installSpeech();
    await mountKind(kind, entry);
    assert.equal(spoken.length, 0, "no autoplay");
    assert.equal(key("confirm").textContent.trim(), confirm);
    for (let i = 0; i < n; i++) {
      press(key("confirm"));
      assert.ok($(".sg-feedback.st-feedback--ok"), "kind confirmation");
      press(key("next"), "Space");
    }
    assert.equal(done.length, 1, "finished via ctx.done");
    assert.ok(done[0].stars >= 1);
  });
}

test("point_and_say: the word button and listen buttons speak at normal and slow speed", async () => {
  const spoken = installSpeech();
  await mountKind("point_and_say", real.point_and_say[0]);
  press($(".sl-word-btn"));
  press($(".sl-listen__slow"));
  assert.equal(spoken[1].rate, 0.7);
  assert.ok($(".sl-picture").getAttribute("aria-label"), "picture has a text alternative");
});

test("home_language_bridge: Spanish side is marked lang=es and spoken with a Spanish voice", async () => {
  const spoken = installSpeech();
  await mountKind("home_language_bridge", real.home_language_bridge[0]);
  assert.ok($('[lang="es"]'));
  press(key("es"));
  assert.equal(spoken[0].lang, "es-US");
});
