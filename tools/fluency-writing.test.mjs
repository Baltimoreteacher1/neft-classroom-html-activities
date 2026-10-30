// Fluency Lab Math Writing Studio: organizers, sentence starters, prompts, the writing folder and its backup.
// Run: node tools/fluency-writing.test.mjs
import assert from "node:assert/strict";

const store = new Map();
Object.defineProperty(globalThis, "localStorage", {
  configurable: true,
  value: {
    getItem: (key) => (store.has(key) ? store.get(key) : null),
    setItem: (key, value) => store.set(key, String(value)),
    removeItem: (key) => store.delete(key),
  },
});
Object.defineProperty(globalThis, "window", {
  configurable: true,
  value: { dispatchEvent() {}, addEventListener() {} },
});
globalThis.CustomEvent = class {};

const lab = "../math/fluency-lab/";
const { ALL_SKILLS, seededRandom } = await import(`${lab}problem-bank.js`);
const organizers = await import(`${lab}writing-organizers.js`);
const prompts = await import(`${lab}writing-prompts.js`);
const folder = await import(`${lab}writing-store.js`);
const print = await import(`${lab}writing-print.js`);
const journal = await import(`${lab}language-journal.js`);
const play = await import(`${lab}play-backup.js`);
const { ES } = await import(`${lab}i18n-es.js`);

let checks = 0;
const ok = (condition, message) => {
  checks += 1;
  assert.ok(condition, message);
};

// 1. Every box has a job, a label, a task and a starter at three levels, in both languages, with no digits.
const JOBS = Object.keys(organizers.JOBS);
ok(organizers.ORGANIZERS.length === 5, "five organizers");
for (const organizer of organizers.ORGANIZERS) {
  ok(organizer.boxes.length >= 3, `${organizer.id} has at least three boxes`);
  ok(
    organizer.model.length === organizer.boxes.length,
    `${organizer.id} model has one sentence per box`,
  );
  ok(
    organizer.prompt.en && organizer.prompt.es && organizer.prompt.en !== organizer.prompt.es,
    `${organizer.id} prompt in both languages`,
  );
  const seen = new Set();
  for (const box of organizer.boxes) {
    ok(!seen.has(box.id), `${organizer.id}/${box.id} id is unique`);
    seen.add(box.id);
    ok(JOBS.includes(box.job), `${organizer.id}/${box.id} job is known`);
    ok(box.starters.length === 3, `${organizer.id}/${box.id} has three starters`);
    for (const pair of [box.label, box.task, ...box.starters]) {
      ok(pair.en && pair.es, `${organizer.id}/${box.id} both languages`);
      ok(
        pair.en !== pair.es,
        `${organizer.id}/${box.id} Spanish is not English copied: ${pair.en}`,
      );
    }
    for (const starter of box.starters) {
      ok(
        !/\d/.test(starter.en + starter.es),
        `no digits in a starter (a starter can never state an answer): ${starter.en}`,
      );
      ok(
        starter.en.includes("___") && starter.es.includes("___"),
        `starter has a blank in both languages: ${starter.en}`,
      );
    }
    // Starters get longer: level 1 has no more blanks than level 3.
    const blanks = box.starters.map((s) => (s.en.match(/___/g) || []).length);
    ok(blanks[0] <= blanks[2], `${organizer.id}/${box.id} support fades with the level`);
  }
  // The model paragraph is real writing: it reads as carrying the language moves the checklist looks for.
  const model = organizer.model.map((pair) => pair.en).join(" ");
  const read = journal.analyze(model);
  ok(read.moves.term, `${organizer.id} model uses a math word`);
  ok(!model.includes("___"), `${organizer.id} model has no blanks`);
}
// Level 4 gives no starter until asked, then the level 3 starter.
const sample = organizers.ORGANIZERS[0].boxes[0];
ok(organizers.starterFor(sample, 4, "en") === "", "level 4 shows no starter by default");
ok(
  organizers.starterFor(sample, 4, "es", { asked: true }) === sample.starters[2].es,
  "level 4 asked gives the level 3 starter",
);
ok(
  organizers.starterFor(sample, 1, "en") === sample.starters[0].en,
  "level 1 gives the level 1 starter",
);

// 2. The worked models state arithmetic that is true.
const modelText = organizers.ORGANIZERS.flatMap((o) => o.model.map((p) => p.en)).join(" ");
for (const [, a, op, b, c] of modelText.matchAll(/(\d+) ([×+]) (\d+) = (\d+)/g)) {
  const value = op === "×" ? Number(a) * Number(b) : Number(a) + Number(b);
  ok(value === Number(c), `model arithmetic ${a} ${op} ${b} = ${c}`);
}

// 3. Slips: always different from the answer, same shape.
for (const answer of ["360", "1,659", "7", "12.5", "0.3", "28/45", "-4"]) {
  const slip = prompts.slipOf(answer);
  ok(slip !== answer && slip !== "", `slip differs from ${answer}: ${slip}`);
}
ok(
  prompts.slipOf("3 1/2") === "" && prompts.slipOf("yes") === "",
  "no slip for shapes it cannot alter",
);

// 4. A prompt can be built for every skill and every organizer, and a shown claim is never wrongly labelled.
const rng = seededRandom ? seededRandom(7) : Math.random;
let prompted = 0;
for (const skill of ALL_SKILLS) {
  for (const organizer of organizers.ORGANIZERS) {
    const prompt = prompts.buildPrompt(skill, organizer.id, organizer.prompt, prompted % 6, rng);
    prompted += 1;
    ok(prompt.problem && !/\bundefined\b|NaN/.test(prompt.problem), `${skill.id} problem text`);
    ok(prompt.task.en && prompt.task.es, `${skill.id}/${organizer.id} task in both languages`);
    if (organizer.id === "fix")
      ok(
        !prompt.claim || prompt.claim.wrong || prompt.task.en !== organizer.prompt.en,
        `${skill.id} find-and-fix never shows a correct answer as a mistake`,
      );
    if (prompt.claim)
      ok(
        prompts.claimLine(prompt.claim, "es").includes(prompt.claim.shown),
        "claim line carries the shown answer",
      );
  }
}
ok(prompted === ALL_SKILLS.length * 5, `prompted every skill and organizer (${prompted})`);
ok(
  prompts.skillById("4:multiply-2digit")?.grade === 4 && prompts.skillById("multiply-2digit"),
  "skills are found by key or id",
);

// 5. The folder keeps words, rejects blanks, joins in organizer order and survives a bad store.
const paragraph = organizers.organizerById("paragraph");
const boxes = {
  say: "I solved it by splitting",
  show: "First I split. Then I added.",
  why: "This works because the parts add back",
  end: "The answer is 360.",
};
ok(
  folder.joinParagraph(paragraph, boxes) ===
    "I solved it by splitting. First I split. Then I added. This works because the parts add back. The answer is 360.",
  "paragraph joins in organizer order with end punctuation",
);
ok(
  folder.joinParagraph(paragraph, { all: "One block" }) === "One block.",
  "a test-view response joins as it is",
);
const saved = folder.addPiece({
  organizer: "paragraph",
  lang: "en",
  level: 2,
  grade: 4,
  skill: "multiply-2digit",
  problem: "24 × 15",
  boxes,
  day: "2026-10-30",
});
ok(saved && folder.loadPieces().length === 1, "a piece saves");
ok(saved.moves.reason && saved.moves.sequence, "a piece records the moves its words already show");
ok(
  folder.addPiece({ organizer: "paragraph", lang: "en", boxes: { say: "I did ___" } }) === null,
  "a box with an unfilled blank is not saved",
);
ok(folder.addPiece({ organizer: "nope", boxes }) === null, "an unknown organizer is not saved");
ok(
  folder.addPiece({
    organizer: "test",
    lang: "es",
    boxes: { all: "Mi respuesta es 360 porque 24 por 15 es 360." },
  })?.lang === "es",
  "a test-view piece saves in Spanish",
);
for (let i = 0; i < organizers.MAX_PIECES + 10; i += 1)
  folder.addPiece({ organizer: "paragraph", boxes });
ok(
  folder.loadPieces().length === organizers.MAX_PIECES,
  "the folder holds a bounded number of pieces",
);
store.set("ewl-writing-pieces-v1", "{not json");
ok(folder.loadPieces().length === 0, "a corrupt store reads as empty");
folder.removePiece("none");

// 6. The backup carries the folder; an older backup leaves it alone; a damaged one is cleaned.
folder.addPiece({
  organizer: "cer",
  lang: "en",
  boxes: { say: "My claim is that it is wrong", show: "My evidence is the sum" },
  problem: "x",
});
const exported = play.exportPlay();
ok(
  Array.isArray(exported.writing) && exported.writing.length === 1,
  "export carries the writing folder",
);
const cleaned = play.cleanPlay(JSON.parse(JSON.stringify(exported)));
ok(cleaned.writing.length === 1, "clean keeps a good piece");
const hostile = play.cleanPlay({
  ...JSON.parse(JSON.stringify(exported)),
  writing: [
    { organizer: "cer", boxes: { say: "<img src=x onerror=1>", "bad key!": "x" } },
    null,
    5,
    { organizer: "zzz", boxes: { say: "x" } },
  ],
});
ok(
  hostile.writing.length === 1 && !("bad key!" in hostile.writing[0].boxes),
  "damaged pieces are cleaned, bad keys dropped",
);
const older = play.cleanPlay({ ...JSON.parse(JSON.stringify(exported)), writing: undefined });
ok(older.writing === null, "an older backup has no writing list");
play.importPlay(older);
ok(folder.loadPieces().length === 1, "importing an older backup leaves the folder alone");
play.importPlay(play.cleanPlay({ ...JSON.parse(JSON.stringify(exported)), writing: [] }));
ok(folder.loadPieces().length === 0, "importing an explicit empty list empties the folder");

// 7. Print pages escape everything a learner typed and label every part.
const evil = {
  id: "w1",
  at: 1,
  organizer: "cer",
  lang: "en",
  level: 2,
  problem: "<b>x</b>",
  boxes: { say: "<script>alert(1)</script>", show: "ok" },
};
const html = print.pieceHtml(evil, organizers.organizerById("cer"));
ok(!html.includes("<script>") && !html.includes("<b>x"), "a printed piece escapes learner text");
ok(html.includes("Claim") && html.includes("Evidence"), "a printed piece labels each part");
const blank = print.blankOrganizerHtml(organizers.organizerById("compare"), {
  lang: "es",
  problem: "7 + 8",
});
ok(
  blank.includes("Manera 1") && blank.includes("wr-print-line"),
  "a blank organizer prints labelled ruled lines",
);

// 8. Every studio string has Spanish.
for (const word of [
  "Math Writing Studio",
  "Practice like the test",
  "Save to my writing folder",
  "{n} words",
])
  ok(ES[word], `Spanish for "${word}"`);

console.log(`fluency-writing: ${checks} checks passed`);
