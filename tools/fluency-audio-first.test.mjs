// Audio-first (pre-reader) mode: when it is on (grade default, learner choice, old saves, an assignment field), what is
// spoken for every generated Kindergarten to Grade 3 problem in English and Spanish (never the answer), how each problem
// is answered without typing (a plan for every item), the picture choices, the speaker queue, and the DOM layer driven
// in JSDOM with a fake speech engine: choices are never removed, replay repeats the same lines, a device with no
// speech gets visible text and a note, a result is read without giving the answer away.
import assert from "node:assert/strict";
import { JSDOM } from "jsdom";

const dom = new JSDOM(
  '<!doctype html><body><div class="problem-question-zone"><p id="question" class="question">Q</p></div><div id="response-widget" hidden></div><div id="choice-answers"></div><section id="games-view" hidden></section></body>',
  { pretendToBeVisual: true },
);
Object.assign(globalThis, {
  window: dom.window,
  document: dom.window.document,
  HTMLElement: dom.window.HTMLElement,
  MutationObserver: dom.window.MutationObserver,
});
Object.defineProperty(globalThis, "localStorage", {
  configurable: true,
  value: { getItem: () => null, setItem() {}, removeItem() {} },
});

// A fake speech engine: every utterance starts and ends on the next tick, like a real one; cancel() drops the queue.
const spoken = [];
let speechFails = null;
const pending = new Set();
class Utterance {
  constructor(text) {
    this.text = text;
  }
}
const engine = {
  speak(u) {
    const id = setTimeout(() => {
      pending.delete(id);
      if (speechFails) return u.onerror?.({ error: speechFails });
      spoken.push(u.text);
      u.onstart?.();
      u.onend?.();
    }, 0);
    pending.add(id);
  },
  cancel() {
    for (const id of pending) clearTimeout(id);
    pending.clear();
  },
  getVoices: () => [],
};
const installSpeech = () => {
  for (const target of [globalThis, dom.window]) {
    target.speechSynthesis = engine;
    target.SpeechSynthesisUtterance = Utterance;
  }
};
const removeSpeech = () => {
  for (const target of [globalThis, dom.window]) {
    delete target.speechSynthesis;
    delete target.SpeechSynthesisUtterance;
  }
};
const settle = () => new Promise((resolve) => setTimeout(resolve, 150));
installSpeech();

const core = await import("../math/fluency-lab/audio-first-core.js");
const view = await import("../math/fluency-lab/audio-first-view.js");
const { speakLines } = await import("../math/fluency-lab/audio-first-speech.js");
const { ALL_SKILLS } = await import("../math/fluency-lab/problem-bank.js");
const { adaptiveItem } = await import("../math/fluency-lab/adaptive-item.js");
const { questionEs, choicesEs } = await import("../math/fluency-lab/question-es.js");
const { makeResponseItem, RESPONSE_SKILLS } = await import("../math/fluency-lab/response-items.js");
const { setLang } = await import("../math/fluency-lab/i18n.js");
const { ES } = await import("../math/fluency-lab/i18n-es.js");
const { checkResponse } = await import("../math/fluency-lab/response-check.js");

// ---- when the mode is on -------------------------------------------------------------------------------------------
assert.equal(core.cleanAudioFirst(undefined), "auto", "an old save has no field: follow the grade");
assert.equal(core.cleanAudioFirst(true), "on");
assert.equal(core.cleanAudioFirst(false), "off");
assert.equal(core.cleanAudioFirst("banana"), "auto");
assert.deepEqual(
  core.cleanSettings({ largeText: true, readingFont: true }),
  { largeText: true, readingFont: true, audioFirst: "auto" },
  "other settings survive the migration",
);
assert.deepEqual(core.cleanSettings(null), { audioFirst: "auto" });
assert.deepEqual(core.cleanSettings([1]), { audioFirst: "auto" });
for (const grade of [0, 1, 2])
  assert.equal(
    core.audioFirstActive({ setting: "auto", grade }),
    true,
    `grade ${grade} defaults on`,
  );
assert.equal(core.audioFirstActive({ setting: "auto", grade: 3 }), false, "grade 3 defaults off");
assert.equal(core.audioFirstActive({ setting: "on", grade: 3 }), true, "grade 3 can switch it on");
assert.equal(
  core.audioFirstActive({ setting: "off", grade: 0 }),
  false,
  "a learner can switch it off",
);
assert.equal(
  core.audioFirstActive({ setting: "on", grade: 4 }),
  false,
  "later grades never get it from the switch",
);
assert.equal(
  core.audioFirstActive({ setting: "auto", grade: 6, assignment: { audioFirst: true } }),
  true,
  "an assignment can turn it on at any grade",
);
assert.equal(
  core.audioFirstActive({ setting: "off", grade: 1, assignment: { audioFirst: true } }),
  true,
);
assert.equal(core.audioFirstActive({ setting: "auto", grade: 1, assignment: {} }), true);
assert.equal(core.audioFirstOffered(3) && !core.audioFirstOffered(4), true);

// ---- what is said --------------------------------------------------------------------------------------------------
assert.equal(core.speakable("3 + 4 = ?", "en"), "3 plus 4 equals what?");
assert.equal(
  core.speakable("12 + ___ = 13", "en"),
  "12 plus blank = 13".replace("=", "is equal to").replace("is equal to", "="),
  "a blank is the word blank",
);
assert.match(core.speakable("8 − 3", "en"), /^8 minus 3$/);
assert.match(core.speakable("3 + 4", "es"), /^3 más 4$/);
assert.match(core.speakable("12 + ___", "es"), /espacio en blanco/);
assert.equal(core.speakable("🍎 3/4 of it", "en"), "3 over 4 of it");
assert.equal(core.choiceSpeech("<", "en"), "is less than");
assert.equal(core.choiceSpeech(">", "es"), "es mayor que");
assert.equal(core.choiceSpeech("even", "es", { choicesEs: ["par", "impar"], index: 0 }), "par");

// Every generated K-3 problem: a script in both languages, a plan, and nothing that depends on the answer.
let seed = 4242;
const rng = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
const skills = ALL_SKILLS.filter((skill) => skill.grade <= 3);
assert.ok(skills.length >= 20, "K-3 skills found");
const planCount = {};
let items = 0;
let noSpanish = 0;
let keypadMissing = 0;
for (const skill of skills) {
  for (let i = 0; i < 40; i += 1) {
    const item = adaptiveItem(skill, rng, 1 + (i % 5));
    items += 1;
    const plan = core.answerPlan(item);
    planCount[`${skill.grade <= 2 ? "k2" : "g3"}:${plan.kind}`] =
      (planCount[`${skill.grade <= 2 ? "k2" : "g3"}:${plan.kind}`] || 0) + 1;
    assert.ok(
      ["choices", "tenFrame", "baseTen", "keypad", "typed"].includes(plan.kind),
      `${skill.id}: plan ${plan.kind}`,
    );
    const answers = item.answers.map(String);
    if (plan.kind === "tenFrame")
      assert.ok(
        answers.every((a) => /^\d+$/.test(a) && Number(a) <= core.COUNT_MAX),
        `${skill.id}: ten-frame holds ${answers}`,
      );
    if (plan.kind === "baseTen")
      assert.ok(
        answers.every((a) => /^\d+$/.test(a) && Number(a) <= core.BLOCKS_MAX),
        `${skill.id}: blocks hold ${answers}`,
      );
    if (plan.kind === "keypad") {
      for (const a of answers)
        for (const ch of a.replace("−", "-"))
          assert.ok(
            "0123456789".includes(ch) || plan.extras.includes(ch),
            `${skill.id}: keypad lacks "${ch}" for ${a}`,
          );
    }
    if (plan.kind === "typed")
      assert.ok(
        answers.some((a) => /[^\d:./\-−]/.test(a)),
        `${skill.id}: only a wordy answer stays typed (${answers})`,
      );
    // Both languages say the question; a script names no answer.
    for (const lang of ["en", "es"]) {
      const lines = core.problemScript(item, {
        lang,
        plan,
        questionEs: lang === "es" ? questionEs(item) : null,
        choicesEs: lang === "es" ? choicesEs(item) : null,
      });
      assert.ok(
        lines.length >= 1 && lines[0].kind === "stem" && lines[0].text,
        `${skill.id}/${lang}: a stem line`,
      );
      for (const line of lines)
        assert.ok(
          !/undefined|null|\[object/.test(line.text),
          `${skill.id}/${lang}: clean text "${line.text}"`,
        );
      assert.equal(
        lines.filter((l) => l.kind === "choice").length,
        (item.choices || []).length,
        `${skill.id}/${lang}: every choice is read, none removed`,
      );
      const how = lines.find((l) => l.kind === "instruction");
      if (how) assert.ok(!/\d/.test(how.text), "an instruction states no number");
    }
    if (item.choices && !questionEs(item) && /[A-Za-z]{4,}/.test(item.question)) noSpanish += 1;
    if (plan.kind === "keypad" && !plan.extras.length && item.kind === "fraction")
      keypadMissing += 1;
  }
}
const k2Typed = planCount["k2:typed"] || 0;
const k2Total = Object.entries(planCount)
  .filter(([key]) => key.startsWith("k2:"))
  .reduce((sum, [, n]) => sum + n, 0);
assert.ok(
  k2Typed / k2Total < 0.05,
  `at most 5% of K-2 problems still need the keyboard (${k2Typed}/${k2Total})`,
);
assert.equal(keypadMissing, 0);
assert.ok(
  planCount["k2:tenFrame"] > 100 && planCount["k2:choices"] > 50,
  `plans spread across kinds: ${JSON.stringify(planCount)}`,
);
assert.ok(
  noSpanish < items * 0.1,
  `Spanish stems cover most choice items (${noSpanish}/${items} fall back to English)`,
);

// A Spanish request never puts English words through a Spanish voice: with no Spanish wording the line is said in English.
{
  const noRule = {
    question: "Which shape is round?",
    answers: ["circle"],
    kind: "choice",
    choices: ["square", "circle"],
  };
  const lines = core.problemScript(noRule, { lang: "es", plan: { kind: "choices" } });
  assert.deepEqual(
    lines.map((l) => l.lang),
    ["en", "en", "en", "es"],
    "stem and word choices in English, the instruction in Spanish",
  );
  const withRule = core.problemScript(
    { question: "Is 84 even or odd?", answers: ["even"], kind: "choice", choices: ["even", "odd"] },
    {
      lang: "es",
      plan: { kind: "choices" },
      questionEs: "¿Es 84 par o impar?",
      choicesEs: ["par", "impar"],
    },
  );
  assert.deepEqual(
    withRule.map((l) => l.lang),
    ["es", "es", "es", "es"],
  );
  const sums = core.problemScript(
    { question: "3 + 2 = ?", answers: ["5"], kind: "number" },
    { lang: "es", plan: { kind: "tenFrame" } },
  );
  assert.equal(sums[0].lang, "es", "a stem with no words is said in the learner's language");
}

// The size of a counting control never reveals the answer: the ten-frame always has two frames, blocks always three places.
assert.deepEqual(core.answerPlan({ kind: "number", answers: ["3"] }), {
  kind: "tenFrame",
  frames: 2,
});
assert.deepEqual(core.answerPlan({ kind: "number", answers: ["17"] }), {
  kind: "tenFrame",
  frames: 2,
});
assert.deepEqual(core.answerPlan({ kind: "number", answers: ["46"] }), {
  kind: "baseTen",
  places: ["hundreds", "tens", "ones"],
});
assert.equal(
  core.answerPlan({ kind: "number", answers: ["46"], choices: ["46", "47"] }).kind,
  "choices",
);
assert.equal(core.answerPlan({ kind: "number", answers: ["1500"] }).kind, "keypad");
assert.deepEqual(core.answerPlan({ kind: "text", answers: ["2:30"] }).extras, [":"]);
assert.equal(core.answerPlan({ kind: "text", answers: ["oranges"] }).kind, "typed");
assert.equal(
  core.answerPlan({ kind: "number", answers: ["7"], response: { type: "tenFrame" } }).kind,
  "response",
);
assert.equal(core.blocksToNumber("1,4,7"), "147");
assert.equal(core.blocksToNumber("0,0,0"), "0");
assert.equal(core.blocksToNumber(""), "");
assert.equal(core.blocksToNumber("1,x,3"), "");

// ---- pictures ------------------------------------------------------------------------------------------------------
assert.deepEqual(core.choicePicture("circle"), { type: "shape", name: "circle" });
assert.deepEqual(core.choicePicture("even"), { type: "pairs", name: "even" });
assert.deepEqual(core.choicePicture("bananas"), { type: "emoji", glyph: "🍌" });
assert.deepEqual(core.choicePicture("7", { choices: ["6", "7", "8"] }), { type: "dots", count: 7 });
assert.equal(
  core.choicePicture("7", { choices: ["6", "7", "eight"] }),
  null,
  "a mixed set is text",
);
assert.equal(core.choicePicture("Used a part twice"), null, "a sentence is text");

// ---- results -------------------------------------------------------------------------------------------------------
for (const lang of ["en", "es"]) {
  for (const phase of ["correct", "assisted", "retry", "revealed", "revised", "empty"]) {
    const text = core.feedbackSpeech(phase, { lang });
    assert.ok(text, `${lang}/${phase} has words`);
    assert.ok(!/\d/.test(text), `${lang}/${phase}: no number in a result without a shown answer`);
  }
  assert.ok(
    !/742/.test(core.feedbackSpeech("retry", { lang, answer: "742" })),
    "a miss never says the answer",
  );
  assert.ok(!/742/.test(core.feedbackSpeech("correct", { lang, answer: "742" })));
  assert.match(
    core.feedbackSpeech("revealed", { lang, answer: "742" }),
    /742/,
    "a result that shows the answer says it",
  );
}
assert.equal(core.feedbackSpeech("idle"), "");

// ---- the voice queue -----------------------------------------------------------------------------------------------
{
  spoken.length = 0;
  const marks = [];
  await new Promise((resolve) =>
    speakLines([{ text: "one" }, { text: "two" }, { text: "three" }], {
      onLine: (_, i) => marks.push(i),
      onDone: resolve,
    }),
  );
  assert.deepEqual(spoken, ["one", "two", "three"]);
  assert.deepEqual(marks, [0, 1, 2]);
  spoken.length = 0;
  speakLines([{ text: "stale one" }, { text: "stale two" }]);
  speakLines([{ text: "fresh" }]);
  await settle();
  assert.deepEqual(spoken, ["fresh"], "a new request cancels the old queue");
  removeSpeech();
  let reason = null;
  assert.equal(speakLines([{ text: "x" }], { onError: (r) => (reason = r) }), false);
  assert.equal(reason, "unavailable", "no speech engine is reported, not thrown");
  installSpeech();
  reason = null;
  speechFails = "synthesis-failed";
  speakLines([{ text: "x" }], { onError: (r) => (reason = r) });
  await settle();
  assert.equal(reason, "synthesis-failed");
  speechFails = null;
}

// ---- the screen ----------------------------------------------------------------------------------------------------
let on = true;
view.configureAudioFirst({
  active: () => on,
  buddyLook: () => ({ color: "blue" }),
  questionEs,
  choicesEs,
});
const $ = (selector) => document.querySelector(selector);
const chooseItem = {
  question: "Which shape is round?",
  answers: ["circle"],
  kind: "choice",
  choices: ["square", "circle", "triangle"],
  hint: "",
  explanation: "",
};

// Practice problem with choices: guide, read order, picture tiles, every choice kept, speakers per choice.
{
  setLang("en", { persist: false });
  spoken.length = 0;
  view.presentProblem(chooseItem, core.answerPlan(chooseItem));
  view.renderChoiceTiles($("#choice-answers"), chooseItem);
  await settle();
  assert.ok($("#af-guide") && !$("#af-guide").hidden, "the guide is drawn");
  assert.equal($("#af-guide .af-buddy svg") !== null, true, "the buddy is drawn");
  assert.ok(document.body.classList.contains("audio-first"));
  assert.deepEqual(
    spoken,
    ["Which shape is round?", "square", "circle", "triangle", "Tap your answer."],
    "question, choices, then how to answer",
  );
  const tiles = [...document.querySelectorAll("#choice-answers .af-tile")];
  assert.deepEqual(
    tiles.map((b) => b.dataset.answer),
    chooseItem.choices,
    "every choice is on screen, none removed",
  );
  assert.ok(
    tiles.every((b) => b.querySelector(".af-pic svg")),
    "shapes have pictures",
  );
  assert.equal(document.querySelectorAll("#choice-answers [data-af-hear]").length, 3);
  spoken.length = 0;
  document.querySelector('[data-af-hear="1"]').click();
  await settle();
  assert.deepEqual(spoken, ["circle"], "a speaker reads one choice");
  spoken.length = 0;
  $("[data-af-replay]").click();
  await settle();
  assert.deepEqual(
    spoken,
    ["Which shape is round?", "square", "circle", "triangle", "Tap your answer."],
    "replay says the same thing again",
  );
  assert.equal(
    document.querySelectorAll("#choice-answers .af-tile").length,
    3,
    "replay removes nothing",
  );
  spoken.length = 0;
  $("[data-af-other]").click();
  await settle();
  assert.equal(
    spoken[0],
    "Which shape is round?",
    "the other-language replay falls back to the English stem when no Spanish rule exists",
  );
}

// The same problem in Spanish says Spanish words for the instruction and the guide labels.
{
  setLang("es", { persist: false });
  spoken.length = 0;
  view.syncGuide();
  assert.equal(
    $("[data-af-replay]").textContent,
    ES["Listen again"],
    "guide buttons are in Spanish",
  );
  assert.equal($("[data-af-other]").textContent, ES["Hear it in English"]);
  const evenItem = {
    question: "Is 84 even or odd?",
    answers: ["even"],
    kind: "choice",
    choices: ["even", "odd"],
    hint: "",
    explanation: "",
  };
  view.presentProblem(evenItem, core.answerPlan(evenItem));
  await settle();
  assert.deepEqual(
    spoken,
    ["¿Es 84 par o impar?", "par", "impar"],
    "Spanish stem and choice words; the instruction was already read once for this kind of answer",
  );
  spoken.length = 0;
  view.replay("es");
  await settle();
  assert.deepEqual(
    spoken,
    ["¿Es 84 par o impar?", "par", "impar", "Toca tu respuesta."],
    "a replay always includes the instruction",
  );
  setLang("en", { persist: false });
}

// Counting answers: a ten-frame, blocks and a keypad write the text a typed answer would.
{
  const host = $("#response-widget");
  const seen = [];
  let handle = view.mountCountedAnswer(host, core.answerPlan({ kind: "number", answers: ["7"] }), {
    onChange: (v) => seen.push(v),
  });
  assert.equal(
    host.querySelectorAll("[data-cell]").length,
    20,
    "two ten-frames, whatever the answer",
  );
  spoken.length = 0;
  for (let i = 0; i < 7; i += 1) host.querySelector(`[data-cell="${i}"]`).click();
  assert.equal(handle.value(), "7");
  assert.equal(seen.at(-1), "7");
  await settle();
  assert.equal(spoken.at(-1), "7", "tapping counts aloud");
  host.querySelector(".af-zero").click();
  assert.equal(handle.value(), "0", "zero is its own button");
  assert.equal(
    host.querySelectorAll('[data-cell][aria-pressed="true"]').length,
    0,
    "zero clears the frame",
  );
  host.querySelector('[data-cell="0"]').click();
  assert.equal(handle.value(), "1");
  assert.equal(host.querySelector(".af-zero").getAttribute("aria-pressed"), "false");
  handle.destroy();

  handle = view.mountCountedAnswer(host, core.answerPlan({ kind: "number", answers: ["147"] }), {
    onChange: () => {},
  });
  assert.equal(host.querySelectorAll("[data-more]").length, 3, "three places, whatever the answer");
  host.querySelector('[data-more="hundreds"]').click();
  for (let i = 0; i < 4; i += 1) host.querySelector('[data-more="tens"]').click();
  for (let i = 0; i < 7; i += 1) host.querySelector('[data-more="ones"]').click();
  assert.equal(handle.value(), "147", "blocks become the number");
  handle.destroy();

  handle = view.mountCountedAnswer(host, core.answerPlan({ kind: "text", answers: ["2:30"] }), {
    onChange: () => {},
  });
  for (const key of ["2", ":", "3", "0", "9"]) host.querySelector(`[data-key="${key}"]`).click();
  host.querySelector('[data-key="back"]').click();
  assert.equal(handle.value(), "2:30", "keypad with a colon and an erase key");
  handle.destroy();
  assert.equal(host.hidden, true);
}

// A device with no speech: the words stay, the guide says so, the speaker buttons step aside, nothing throws.
{
  removeSpeech();
  view.presentProblem(chooseItem, core.answerPlan(chooseItem));
  assert.match($("#af-guide .af-note").textContent, /Sound is not available/);
  assert.ok(document.body.classList.contains("af-silent"), "speaker buttons are hidden by class");
  assert.equal($("#question").textContent, "Q", "the question text is untouched");
  installSpeech();
  view.presentProblem(chooseItem, core.answerPlan(chooseItem));
  assert.equal($("#af-guide .af-note").textContent, "", "sound back: note cleared");
  assert.ok(!document.body.classList.contains("af-silent"));
  // Autoplay refused by the browser: ask for a tap instead of claiming the sound is broken.
  speechFails = "not-allowed";
  view.presentProblem(chooseItem, core.answerPlan(chooseItem));
  await settle();
  assert.match($("#af-guide .af-note").textContent, /Tap Listen again/);
  speechFails = null;
}

// Results are read: short, kind, and a miss never says the answer.
{
  spoken.length = 0;
  view.speakFeedback({ phase: "retry", lines: [{ label: "Your answer", value: "5" }] });
  await settle();
  assert.deepEqual(spoken, ["Not yet. Listen again and try again."]);
  spoken.length = 0;
  view.speakFeedback({ phase: "revealed", lines: [{ label: "Correct answer", value: "9" }] });
  await settle();
  assert.match(spoken[0], /The answer is 9/);
}

// Games: one listener reads each message once; the banner says what is and is not covered.
{
  const { syncLive } = await import("../math/fluency-lab/speech.js");
  const room = $("#games-view");
  room.hidden = false;
  room.innerHTML = '<p class="gm-note">Pick two tiles that make 10</p>';
  spoken.length = 0;
  syncLive(room);
  syncLive(room);
  await settle();
  assert.deepEqual(spoken, ["Pick two tiles that make 10"], "a repeated render is read once");
  assert.equal($("#af-game-banner").hidden, false);
  assert.match(
    $("#af-game-banner .af-game-note").textContent,
    /still need reading or typing/,
    "the limit is stated",
  );
  room.hidden = true;
  await settle();
  assert.equal($("#af-game-banner").hidden, true, "the banner follows the Game Room");
}

// Switched off: nothing is spoken and the guide steps aside.
{
  on = false;
  spoken.length = 0;
  view.presentProblem(chooseItem, core.answerPlan(chooseItem));
  view.speakFeedback({ phase: "correct", lines: [] });
  await settle();
  assert.deepEqual(spoken, []);
  assert.equal($("#af-guide").hidden, true);
  assert.ok(!document.body.classList.contains("audio-first"));
  on = true;
}

// Built answers keep their own widgets; the plan hands them over untouched.
{
  const skill = ALL_SKILLS.find((s) => RESPONSE_SKILLS[`${s.grade}:${s.id}`] && s.grade <= 2);
  const built = makeResponseItem(skill, rng);
  assert.equal(core.answerPlan(built).kind, "response");
  assert.ok(checkResponse("", built).nudge, "a built answer with nothing built is a nudge");
}

console.log(
  `fluency-audio-first: ${items} generated K-3 problems have scripts (EN/ES) and answer plans; plans ${JSON.stringify(planCount)}; DOM, speech queue, fallback and games pass`,
);
process.exit(0);
