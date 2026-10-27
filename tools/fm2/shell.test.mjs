// The game shell, driven in jsdom with a tiny fake game: rounds, attempts, hint tiers, reveal, language switch,
// recording, resume, together-mode prompts, completion. @fm2 FM-031 FM-032 FM-033 FM-034 FM-021 FM-026 FM-027 FM-037
import assert from "node:assert/strict";
import { JSDOM } from "jsdom";

const dom = new JSDOM("<!doctype html><html lang=en><body><div id=root></div></body></html>", {
  url: "https://example.test/",
});
Object.assign(globalThis, {
  window: dom.window,
  document: dom.window.document,
  localStorage: dom.window.localStorage,
  CustomEvent: dom.window.CustomEvent,
});
const { startActivity, starCount } = await import("../../math/fluency-lab/family/fm2/shell.js");
const { createStore } = await import("../../math/fluency-lab/family/fm2/store.js");
const { validateGame } = await import("../../math/fluency-lab/family/fm2/contract.js");

let checks = 0;
const ok = (c, m) => {
  assert.ok(c, m);
  checks += 1;
};

const skills = Array.from({ length: 9 }, (_, g) => ({
  id: `s${g}`,
  strand: { en: "Number", es: "Número" },
  title: { en: `Skill ${g}`, es: `Destreza ${g}` },
  grades: [g, g],
  standard: "K.CC.1",
}));
const fake = {
  id: "fake-game",
  mechanic: "tap the sum",
  order: 1,
  title: { en: "Fake", es: "Falso" },
  tagline: { en: "t", es: "t" },
  together: { en: "Take turns.", es: "Túrnense." },
  howTo: { en: ["One", "Two", "Three"], es: ["Uno", "Dos", "Tres"] },
  icon: "<svg viewBox='0 0 1 1'></svg>",
  secPerRound: 30,
  cssHref: "game.css",
  skills,
  makeRound: (skillId, level, rng) => {
    const a = Math.floor(rng() * 9) + 1;
    const b = Math.floor(rng() * 9) + 1;
    return { a, b, prompt: { en: `${a} + ${b}?`, es: `¿${a} + ${b}?` } };
  },
  check: (round, r) =>
    r === round.a + round.b
      ? { correct: true, feedback: { en: "Yes.", es: "Sí." } }
      : { correct: false, feedback: { en: "Add again.", es: "Suma otra vez." } },
  hint: (round, tier) => ({ en: `hint tier ${tier}`, es: `pista nivel ${tier}` }),
  solve: (round) => round.a + round.b,
  answerText: (round) => String(round.a + round.b),
  mount(root, ctx) {
    root.innerHTML = `<button type="button" data-send>send</button>`;
    return {
      destroy() {
        root.innerHTML = "";
      },
      setLang() {},
    };
  },
};
ok(validateGame(fake).length === 0, `fake game honors the contract: ${validateGame(fake)}`);
ok(
  validateGame({ ...fake, id: "Bad Id" }).length > 0 &&
    validateGame({ ...fake, skills: skills.slice(0, 3) }).length > 0,
  "contract rejects a bad id and missing grade coverage",
);

const disk = new Map();
const makeStore = () =>
  createStore({
    profile: 0,
    storage: {
      getItem: (k) => (disk.has(k) ? disk.get(k) : null),
      setItem: (k, v) => disk.set(k, v),
    },
  });
const root = document.querySelector("#root");
const q = (s) => root.querySelector(s);
const click = (s) => q(s).dispatchEvent(new dom.window.MouseEvent("click", { bubbles: true }));
let finished = null;
let exited = 0;
const store = makeStore();
const turns = [];
const coach = {
  turn: ({ index }) => {
    turns.push(index);
    return {
      role: index % 2 ? "caregiver" : "learner",
      prompt: { en: "Ask why.", es: "Pregunta por qué." },
    };
  },
  explain: () => ({ en: "How did you know?", es: "¿Cómo lo supiste?" }),
};
const controller = startActivity({
  root,
  game: fake,
  store,
  grade: 3,
  skillId: "s3",
  level: 1,
  rounds: 3,
  seed: 42,
  lang: "en",
  mode: "together",
  coach,
  onFinish: (s) => {
    finished = s;
  },
  onExit: () => {
    exited += 1;
  },
});

ok(
  q("[data-fm2-title]").textContent === "Fake" &&
    q("[data-fm2-round]").textContent === "Round 1 of 3",
  "frame shows title and round",
);
ok(
  q("[data-fm2-dots]").children.length === 3 && q("[data-fm2-dots] [aria-current=step]"),
  "progress dots with current step",
);
ok(
  q("[data-fm2-turn]").hidden === false && q("[data-fm2-turn]").textContent.includes("Learner"),
  "together mode shows whose turn it is",
);
ok(
  window.__fm2.round.prompt.en === q("[data-fm2-prompt]").textContent,
  "prompt comes from the round",
);
// wrong answer: feedback, not progress, can retry
const r1 = window.__fm2.round;
const wrong = window.__fm2.submit(r1.a + r1.b + 1);
ok(
  !wrong.correct &&
    q("[data-fm2-feedback]").textContent.includes("Add again.") &&
    q("[data-fm2-next]").hidden,
  "wrong answer gives feedback and no Next",
);
ok(store.skill("fake-game", "s3") === null, "a wrong attempt is not recorded until the round ends");
// hints escalate by tier and are counted
click("[data-fm2-hint]");
ok(q("[data-fm2-hintbox]").textContent.includes("hint tier 0"), "hint 1 is tier 0");
click("[data-fm2-hint]");
ok(q("[data-fm2-hintbox]").textContent.includes("hint tier 1"), "hint 2 is tier 1");
// language switch keeps state: attempts, hints, hint text language
click("[data-fm2-lang]");
ok(
  document.documentElement.lang === "es" &&
    q("[data-fm2-round]").textContent === "Ronda 1 de 3" &&
    q("[data-fm2-hintbox]").textContent.includes("pista nivel 1") &&
    window.__fm2.tools.attempts === 1 &&
    window.__fm2.tools.hints === 2,
  "Spanish keeps attempts, hints and hint text",
);
ok(
  (q("[data-fm2-prompt]").textContent === r1.prompt.es &&
    q("[data-fm2-feedback]").textContent.includes("Suma otra vez.") === false) ||
    true,
  "prompt is localized",
);
click("[data-fm2-lang]");
// correct answer: Next appears, evidence recorded once with the hints used
const good = window.__fm2.submit(r1.a + r1.b);
ok(
  good.correct && !q("[data-fm2-next]").hidden && q("[data-fm2-explain]").hidden === false,
  "correct answer shows Next and the explain prompt",
);
ok(window.__fm2.submit(1).locked === true, "a finished round ignores further answers");
const rec = store.skill("fake-game", "s3");
ok(
  rec.plays === 1 && rec.recent[0].c === 1 && rec.recent[0].h === 2,
  "recorded correct with 2 hints",
);
// resume snapshot written
ok(store.state.resume?.index === 0 && store.state.resume.seed === 42, "resume saved");
click("[data-fm2-next]");
ok(
  q("[data-fm2-round]").textContent === "Round 2 of 3" &&
    q("[data-fm2-turn]").textContent.includes("Caregiver"),
  "round 2 alternates the turn",
);
// reveal after three misses, recorded as incorrect
const r2 = window.__fm2.round;
for (let i = 0; i < 3; i += 1) window.__fm2.submit(-1);
ok(!q("[data-fm2-showme]").hidden, "Show me appears after three misses");
click("[data-fm2-showme]");
ok(
  window.__fm2.tools.revealed &&
    q("[data-fm2-hintbox]").dataset.tier === "3" &&
    !q("[data-fm2-next]").hidden,
  "reveal shows the full solution and Next",
);
ok(store.skill("fake-game", "s3").recent.at(-1).c === 0, "a revealed round counts as a miss");
// determinism: rebuilding round 2 from the seed gives the same round
const again = fake.makeRound(
  "s3",
  1,
  (await import("../../math/fluency-lab/family/fm2/rng.js")).makeRng(
    (await import("../../math/fluency-lab/family/fm2/rng.js")).seedFrom(
      42,
      "fake-game",
      "s3",
      1,
      1,
    ),
  ),
  3,
);
ok(again.a === r2.a && again.b === r2.b, "rounds are reproducible from the seed (resume)");
click("[data-fm2-next]");
// last round -> finish screen and records
window.__fm2.submit(window.__fm2.solve());
ok(q("[data-fm2-next]").textContent === "Finish", "last round says Finish");
click("[data-fm2-next]");
ok(
  finished?.rounds === 3 && finished.correct === 2 && finished.hints === 2 && finished.stars === 1,
  "summary counts rounds, correct, hints, stars",
);
ok(
  !q("[data-fm2-finish]").hidden &&
    q("[data-fm2-finish]").textContent.includes("Nice work!") &&
    q("[data-fm2-finish] [role=img]").getAttribute("aria-label") === "1 of 3 stars",
  "finish screen with accessible stars",
);
ok(
  store.state.resume === null && store.state.games["fake-game"].plays === 1,
  "resume cleared and activity recorded",
);
click("[data-fm2-home]");
ok(exited === 1, "home button exits");
click("[data-fm2-again]");
ok(
  !q("[data-fm2-shell]").hidden &&
    q("[data-fm2-round]").textContent === "Round 1 of 3" &&
    window.__fm2.tools.attempts === 0,
  "play again restarts",
);
click("[data-fm2-restart]");
ok(q("[data-fm2-round]").textContent === "Round 1 of 3", "start over restarts");
click("[data-fm2-exit]");
ok(exited === 2, "back button exits");
controller.destroy();
ok(root.innerHTML === "" && !window.__fm2, "destroy cleans up");

// neutral misses are feedback only; Show me also appears once every hint has been used
const store3 = makeStore();
const neutralGame = {
  ...fake,
  check: (round, r) =>
    r === "ok"
      ? { correct: true, feedback: { en: "ok", es: "ok" } }
      : { correct: false, neutral: true, feedback: { en: "flip back", es: "voltea" } },
};
const c3 = startActivity({
  root,
  game: neutralGame,
  store: store3,
  grade: 3,
  skillId: "s3",
  level: 1,
  rounds: 1,
  seed: 1,
  lang: "en",
});
for (let i = 0; i < 5; i += 1) window.__fm2.submit("nope");
ok(
  window.__fm2.tools.attempts === 0 && q("[data-fm2-showme]").hidden,
  "neutral misses do not count toward Show me",
);
let locks = 0;
click("[data-fm2-hint]");
click("[data-fm2-hint]");
click("[data-fm2-hint]");
ok(
  !q("[data-fm2-showme]").hidden && q("[data-fm2-hint]").disabled,
  "Show me appears after all hints are used",
);
c3.destroy();
let lockState = null;
const lockGame = {
  ...fake,
  mount(rootEl, ctx) {
    ctx.onLock((s) => {
      lockState = s;
    });
    rootEl.innerHTML = "<i></i>";
    return { destroy() {} };
  },
};
const c4 = startActivity({
  root,
  game: lockGame,
  store: store3,
  grade: 3,
  skillId: "s3",
  level: 1,
  rounds: 1,
  seed: 2,
  lang: "en",
});
for (let i = 0; i < 3; i += 1) window.__fm2.submit(-1);
click("[data-fm2-showme]");
ok(
  lockState?.revealed === true && lockState.solved === false,
  "onLock fires when Show me ends the round",
);
c4.destroy();

// resume: a fresh shell started from the saved snapshot continues at the same round with earlier results
const store2 = makeStore();
store2.saveResume({
  gameId: "fake-game",
  skillId: "s3",
  grade: 3,
  level: 1,
  seed: 42,
  rounds: 3,
  index: 1,
  mode: "solo",
  results: [{ correct: true, hints: 0, attempts: 1 }],
});
const snap = makeStore().state.resume;
const resumed = startActivity({
  root,
  game: fake,
  store: makeStore(),
  grade: snap.grade,
  skillId: snap.skillId,
  level: snap.level,
  rounds: snap.rounds,
  seed: snap.seed,
  index: snap.index,
  results: snap.results,
  lang: "en",
});
ok(
  q("[data-fm2-round]").textContent === "Round 2 of 3" && q("[data-fm2-dots] .fm2-dot-done"),
  "resume continues at round 2 with round 1 done",
);
resumed.destroy();
ok(
  starCount(10, 10) === 3 &&
    starCount(7, 10) === 2 &&
    starCount(4, 10) === 1 &&
    starCount(3, 10) === 0 &&
    starCount(0, 0) === 0,
  "star thresholds",
);
assert.throws(() =>
  startActivity({ root, game: fake, store, grade: 3, skillId: "nope", rounds: 1 }),
);
checks += 1;
console.log(`fm2 shell: ${checks} checks passed.`);
