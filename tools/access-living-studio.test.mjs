// The Living Language Studio: Language World engine, its content contract, and the hero art contract.
//
//   node --test tools/access-living-studio.test.mjs
//
// The engine is pure (src/lang/exhibition.js); these tests drive it with the real scenario content so a
// content edit that breaks a rule, a key, or the "help never gives the answer" contract fails here.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import {
  EXHIBITION_GLOSSARY,
  EXHIBITIONS,
  STEP_ORDER,
} from "../access-practice-lab/src/content/exhibition.js";
import {
  bandState,
  compareDrafts,
  copiedRun,
  emptyState,
  evaluateWriting,
  isRight,
  noteHelp,
  parseState,
  progress,
  setSupport,
  stepStatus,
  suggestion,
  updateTask,
} from "../access-practice-lab/src/lang/exhibition.js";
import { H, hallSVG, STATIONS, studioSVG, W } from "./access-hall-art.mjs";
import { REPO_ROOT } from "./lib/access-lab-content.mjs";
import { SCORE_CLAIM } from "./lib/access-studio-rules.mjs";

const LAB = join(REPO_ROOT, "access-practice-lab");
const BANDS = Object.keys(EXHIBITIONS);
const sources = (s) => [...s.tasks.read.sentences, ...s.tasks.listen.script];

test("both grade bands have a complete four-step scenario", () => {
  assert.deepEqual(BANDS.sort(), ["3-5", "6-8"]);
  for (const band of BANDS) {
    const s = EXHIBITIONS[band];
    assert.equal(s.band, band);
    assert.deepEqual(Object.keys(s.tasks), STEP_ORDER, `${band} task order`);
    const domains = STEP_ORDER.map((k) => s.tasks[k].domain);
    assert.deepEqual(domains, ["Listening", "Reading", "Speaking", "Writing"]);
    for (const k of STEP_ORDER) {
      assert.ok(
        ["Narrate", "Inform", "Explain", "Argue"].includes(s.tasks[k].klu),
        `${band} ${k} KLU`,
      );
      assert.match(
        s.tasks[k].objective,
        /^I can /,
        `${band} ${k} objective is a learner statement`,
      );
    }
    assert.ok(
      s.tasks.write.transfer?.length > 40,
      `${band} has a transfer prompt for the new attempt`,
    );
  }
});

test("every question has exactly one key, keys are not parked in one position, evidence keys exist", () => {
  for (const band of BANDS) {
    const positions = [];
    for (const step of ["listen", "read"]) {
      const spec = EXHIBITIONS[band].tasks[step];
      for (const q of spec.questions) {
        if (q.kind === "evidence") {
          assert.ok(
            Number.isInteger(q.answer) && spec.sentences[q.answer],
            `${band} ${q.id} evidence index`,
          );
          assert.ok(q.why, `${band} ${q.id} has a hint for a miss`);
          continue;
        }
        const keys = q.options.filter((o) => o.ok);
        assert.equal(keys.length, 1, `${band} ${step}/${q.id} has one key`);
        for (const o of q.options)
          if (!o.ok) assert.ok(o.why?.length > 20, `${band} ${q.id}/${o.id} explains the miss`);
        positions.push(q.options.findIndex((o) => o.ok));
      }
    }
    assert.ok(new Set(positions).size >= 2, `${band}: answer positions vary (${positions})`);
  }
});

test("help never gives the answer away", () => {
  for (const band of BANDS) {
    const { listen, read } = EXHIBITIONS[band].tasks;
    const keys = [...listen.questions, ...read.questions.filter((q) => q.options)].map((q) =>
      q.options.find((o) => o.ok).text.toLowerCase(),
    );
    // the picture of places is names only, never paired with what happens there
    for (const place of listen.map)
      assert.equal(typeof place, "string", `${band} map entries are plain place names`);
    // word-help examples never repeat the announcement or a key (the leak this rule was written for)
    const runs = (t) => {
      const w = t.toLowerCase().match(/[a-z0-9']+/g) || [];
      return new Set(w.slice(0, -3).map((_, i) => w.slice(i, i + 4).join(" ")));
    };
    const scriptRuns = new Set([...listen.script, ...keys].flatMap((t) => [...runs(t)]));
    for (const w of [...listen.vocab, ...read.vocab]) {
      const g = EXHIBITION_GLOSSARY[w];
      assert.ok(g, `${band}: "${w}" has a glossary entry`);
      for (const r of runs(g[2]))
        assert.ok(
          !scriptRuns.has(r),
          `${band}: example for "${w}" repeats the announcement ("${r}")`,
        );
    }
    // a word the vocabulary question asks about is not in that step's word help
    const asked = read.questions
      .map((q) => q.prompt.match(/“([a-z]+)”/i)?.[1]?.toLowerCase())
      .filter(Boolean);
    for (const word of asked)
      assert.ok(
        !read.vocab.includes(word),
        `${band}: reading word help defines the tested word "${word}"`,
      );
  }
});

test("scenario text makes no score, level or proficiency claim", () => {
  for (const band of BANDS) {
    const text = JSON.stringify(EXHIBITIONS[band]);
    assert.ok(
      !SCORE_CLAIM.test(text),
      `${band} content contains a score claim: ${text.match(SCORE_CLAIM)?.[0]}`,
    );
  }
});

test("state: parse is defensive, updates merge, support never erases work", () => {
  assert.deepEqual(parseState("not json"), emptyState());
  assert.deepEqual(parseState('{"v":2,"bands":{}}'), emptyState());
  let s = emptyState();
  s = updateTask(s, "6-8", "write", { attempts: [{ text: "draft", drafts: [] }] });
  s = setSupport(s, "6-8", "C");
  s = setSupport(s, "6-8", "Z");
  const b = bandState(s, "6-8");
  assert.equal(b.support, "C");
  assert.equal(b.tasks.write.attempts[0].text, "draft", "changing support keeps the draft");
  s = noteHelp(s, "6-8", "write", "organizer");
  s = noteHelp(s, "6-8", "write", "organizer");
  assert.deepEqual(bandState(s, "6-8").tasks.write.help, ["organizer"]);
  assert.equal(
    bandState(s, "6-8").tasks.write.attempts[0].text,
    "draft",
    "noting help keeps the draft",
  );
});

test("step status follows saved work, and the suggestion explains itself", () => {
  for (const band of BANDS) {
    const scen = EXHIBITIONS[band];
    let s = emptyState();
    assert.equal(progress(scen, bandState(s, band)).next, "listen");
    const answers = Object.fromEntries(
      scen.tasks.listen.questions.map((q) => [q.id, q.options.find((o) => o.ok).id]),
    );
    s = updateTask(s, band, "listen", { answers: { [Object.keys(answers)[0]]: "zz" } });
    assert.equal(stepStatus(scen, bandState(s, band).tasks.listen, "listen"), "started");
    s = updateTask(s, band, "listen", { answers });
    assert.equal(stepStatus(scen, bandState(s, band).tasks.listen, "listen"), "done");
    const read = Object.fromEntries(
      scen.tasks.read.questions.map((q) => [
        q.id,
        q.kind === "evidence" ? String(q.answer) : q.options.find((o) => o.ok).id,
      ]),
    );
    for (const q of scen.tasks.read.questions)
      assert.ok(isRight(scen.tasks.read, q.id, read[q.id]));
    s = updateTask(s, band, "read", { answers: read });
    s = updateTask(s, band, "speak", { said: true, checks: { a: true, b: true, c: true } });
    assert.equal(stepStatus(scen, bandState(s, band).tasks.speak, "speak"), "done");
    assert.deepEqual(suggestion(scen, bandState(s, band)), { step: "write", reason: "next-step" });
    s = updateTask(s, band, "write", {
      attempts: [{ kind: "supported", drafts: [{ text: "x" }], checked: true }],
    });
    assert.equal(progress(scen, bandState(s, band)).done, 4);
    assert.deepEqual(suggestion(scen, bandState(s, band)), { step: "write", reason: "transfer" });
    s = updateTask(s, band, "write", {
      attempts: [
        ...bandState(s, band).tasks.write.attempts,
        { kind: "independent", drafts: [{ text: "y" }], checked: true },
      ],
    });
    assert.equal(suggestion(scen, bandState(s, band)), null);
  }
});

test("writing feedback quotes the learner and names one next move, never a grade", () => {
  const s68 = EXHIBITIONS["6-8"];
  const weak = evaluateWriting("Filters are cool.", s68.tasks.write, sources(s68));
  assert.equal(weak.next.id, "claim");
  assert.deepEqual(weak.shows, []);
  const draft =
    "The garden team should build the layered sand filter because it makes muddy water clearer. In the exhibition test, brown water came out nearly clear after 6 minutes. Also, the gravel and sand layers catch particles, so the barrel will not clog. Although the filter cannot remove germs, the water is only for plants, not for drinking.";
  const strong = evaluateWriting(draft, s68.tasks.write, sources(s68));
  assert.equal(strong.next, null, `strong draft still asks for ${strong.next?.id}`);
  for (const sh of strong.shows)
    assert.ok(draft.includes(sh.quote), `quote comes from the draft: ${sh.quote}`);
  assert.ok(!("score" in strong) && !("level" in strong) && !("percent" in strong));
  const change = compareDrafts(weak, strong);
  assert.ok(change.added.includes("claim") && change.lost.length === 0);

  const s35 = EXHIBITIONS["3-5"];
  const kid = evaluateWriting(
    "The plant in Cup A grew tall and green because it was by the sunny window. The plant in Cup B was yellow because the closet was dark. Plants need light.",
    s35.tasks.write,
    sources(s35),
  );
  assert.equal(kid.next, null, `grade 3-5 model still asks for ${kid.next?.id}`);
});

test("copying a whole source sentence is noticed", () => {
  const s = EXHIBITIONS["6-8"];
  assert.ok(
    copiedRun(
      "In our test, water that started out brown came out nearly clear after 6 minutes.",
      sources(s),
    ).split(" ").length >= 6,
  );
  assert.equal(copiedRun("The water got clearer in six minutes in the test.", sources(s)), "");
});

test("hero hotspots sit on the stations the art draws, and the art is current", () => {
  const hero = readFileSync(join(LAB, "src/views/home-hero.js"), "utf8");
  for (const [domain, { x, y }] of Object.entries(STATIONS)) {
    const m = hero.match(new RegExp(`${domain}: \\{ x: ([\\d.]+), y: ([\\d.]+)`));
    assert.ok(m, `home-hero.js has a ${domain} station`);
    assert.ok(Math.abs(Number(m[1]) - (x / W) * 100) < 0.2, `${domain} x`);
    assert.ok(Math.abs(Number(m[2]) - (y / H) * 100) < 0.2, `${domain} y`);
  }
  for (const band of ["68", "35"])
    assert.equal(
      readFileSync(join(LAB, `pictures/ds/hall-${band}.svg`), "utf8"),
      hallSVG(band),
      `hall-${band}.svg is stale`,
    );
  for (const d of ["listening", "reading", "speaking", "writing"])
    assert.equal(
      readFileSync(join(LAB, `pictures/ds/domain-${d}.svg`), "utf8"),
      studioSVG(d),
      `domain-${d}.svg is stale`,
    );
});

test("assessment-style practice is visually separated and labelled", () => {
  const ds = readFileSync(join(LAB, "ds.css"), "utf8");
  assert.match(ds, /body\[data-lab-view="test"\]/, "test screens get the quiet focused mode");
  const nav = readFileSync(join(LAB, "src/nav.js"), "utf8");
  assert.match(nav, /mode-flag/, "test screens carry a Focused practice mode label");
});
