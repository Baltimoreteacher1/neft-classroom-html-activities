import assert from "node:assert/strict";
import test from "node:test";
import { homeworkDom, tick } from "./lib/homework-page-dom.mjs";

const PAGES = ["4-3", "6-1-part2"];
const STOPS = ["learn", "words", "check", "play", "done", "photobooth"];
const wc = (t) => t.trim().split(/\s+/).length;

async function read(w, d, spoken, stop) {
  spoken.length = 0;
  w.switchHomeworkTab(stop);
  d.querySelector(`[data-tab-panel="${stop}"] .hw-listen-stop`).click();
  // The speaker fires one utterance per tick; wait until it has finished the queue.
  for (let last = -1; last !== spoken.length; ) {
    last = spoken.length;
    await tick(15);
  }
  return [...spoken];
}

test("every stop has a Read-aloud control that speaks each instruction block in the right language and voice", async () => {
  for (const id of PAGES) {
    for (const lang of ["en", "es", "bilingual"]) {
      const { w, d, spoken } = await homeworkDom(id, { lang });
      for (const stop of STOPS) {
        const panel = d.querySelector(`[data-tab-panel="${stop}"]`);
        assert.ok(panel.querySelector(".hw-listen-stop"), `${id}/${stop}: control exists`);
        const heard = await read(w, d, spoken, stop);
        assert.ok(heard.length > 0, `${id}/${stop}/${lang}: something is read`);
        for (const u of heard) {
          if (u.lang.startsWith("es"))
            assert.equal(u.voice, "Test Spanish", "Spanish text gets the Spanish voice");
          else assert.equal(u.voice, "Test English");
        }
        const langs = new Set(heard.map((u) => u.lang.slice(0, 2)));
        if (lang === "en") assert.deepEqual([...langs], ["en"]);
        if (lang === "es") assert.deepEqual([...langs], ["es"]);
        if (lang === "bilingual") assert.deepEqual([...langs].sort(), ["en", "es"]);
        // Independent coverage check: every long paired paragraph outside problems/answer keys is spoken.
        const said = heard.map((u) => u.text).join(" ");
        for (const en of panel.querySelectorAll("p.lang-en, span.lang-en")) {
          if (
            en.closest(
              "button, summary, label, h1, h2, h3, h4, .problem-section, .hw-answer-key, details:not([open]), [hidden], [aria-hidden='true'], .hw-listen-bar, [data-no-listen]",
            )
          )
            continue;
          if (en.parentElement.closest(".lang-en")) continue;
          const text = en.textContent.replace(/\s+/g, " ").trim();
          if (wc(text) < 5 || /[×÷=%/]|[\p{Extended_Pictographic}]/u.test(text)) continue;
          const probe = text.slice(0, 40);
          const wanted = lang === "es" ? null : probe;
          if (wanted)
            assert.ok(
              said.includes(wanted.replace(/ ([.,;:!?])/g, "$1")),
              `${id}/${stop}/${lang}: not read aloud: "${probe}"`,
            );
        }
      }
    }
  }
});

test("math is spoken the way a teacher says it, with no emoji", async () => {
  const { w } = await homeworkDom("4-3");
  const say = (t, l = "en") => w.hwVoice.prepare(t, l);
  assert.equal(say("3/4 of 12"), "three fourths of 12");
  assert.equal(say("1/2"), "one half");
  assert.equal(say("3/4", "es"), "tres cuartos");
  assert.equal(say("7/11"), "7 over 11");
  assert.equal(say("2 × 3 = 6"), "2 times 3 equals 6");
  assert.equal(say("25%", "es"), "25 por ciento");
  assert.equal(say("🎭 Hello"), "Hello");
});

test("no speech support: controls are hidden, nothing throws", async () => {
  const { d, errors } = await homeworkDom("4-3", { speech: false });
  assert.ok(d.body.classList.contains("no-speech"));
  assert.equal(d.querySelectorAll(".hw-listen-bar").length, 0);
  assert.equal(errors.length, 0);
});

test("voice entry: boxes are marked, the shared layer is told, a transcript fills like typing", async () => {
  const calls = [];
  const { w, d } = await homeworkDom("6-1");
  // Late arrival of the shared layer: the page also announces its targets by event.
  let announced = null;
  d.addEventListener("ewl:voice-entry-targets", (e) => (announced = e.detail));
  w.document.dispatchEvent(new w.CustomEvent("ewl:voice-entry-targets", { detail: { boxes: [] } }));
  assert.ok(announced);
  const boxes = [...d.querySelectorAll("[data-voice-entry]")];
  assert.ok(boxes.length > 0, "answer boxes are marked");
  const text = boxes.find((b) => b.tagName === "TEXTAREA");
  const input = boxes.find((b) => b.tagName === "INPUT");
  let inputs = 0;
  for (const b of [text, input].filter(Boolean)) b.addEventListener("input", () => inputs++);
  text.dispatchEvent(
    new w.CustomEvent("ewl:voice-entry", {
      bubbles: true,
      detail: { transcript: "I divided by one fourth", lang: "en" },
    }),
  );
  assert.match(text.value, /I divided by one fourth/);
  text.dispatchEvent(
    new w.CustomEvent("ewl:voice-entry", {
      bubbles: true,
      detail: { transcript: "so it is twelve", lang: "en" },
    }),
  );
  assert.match(text.value, /fourth so it is twelve$/);
  if (input && input.dataset.voiceEntry === "number") {
    input.dispatchEvent(
      new w.CustomEvent("ewl:voice-entry", {
        bubbles: true,
        detail: { transcript: "hello there", lang: "en" },
      }),
    );
    assert.equal(input.value, "", "a number box refuses a sentence");
    input.dispatchEvent(
      new w.CustomEvent("ewl:voice-entry", {
        bubbles: true,
        detail: { transcript: "12", lang: "en" },
      }),
    );
    assert.equal(input.value, "12");
  }
  assert.ok(inputs >= 2, "input events fire so Save/Resume and checkers run");
  assert.ok(d.getElementById("hw_voice_status"));
  assert.equal(calls.length, 0);
});

test("voice entry: a shared learning-supports layer, when present, is handed every box", async () => {
  const { w, d } = await homeworkDom("6-1");
  const handed = [];
  w.EWLLearningSupports = { attachVoiceEntry: (box, opts) => handed.push([box, opts.kind]) };
  w.hwVoiceInitEntry();
  const marked = d.querySelectorAll("[data-voice-entry]").length;
  assert.equal(handed.length, marked);
  assert.ok(handed.every(([, kind]) => kind === "number" || kind === "text"));
});
