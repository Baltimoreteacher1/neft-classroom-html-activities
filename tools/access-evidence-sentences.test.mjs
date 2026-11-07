// Because / but / so evidence sentences (Language Page feature #11): authored keyword rubrics judged on the
// device, many revision rounds, feedback that names a next move and never states the answer.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { JSDOM } from "jsdom";

const LAB = new URL("../access-practice-lab/", import.meta.url);
const read = (p) => JSON.parse(readFileSync(new URL(p, LAB), "utf8"));
const data = read("content/studio/evidence-sentences.json");
const { tasks } = read("content/studio/writing.json");
const ev = await import("../access-practice-lab/src/lang/evidence-feedback.js");

const prompt = (task, id) => data.tasks[task].find((p) => p.id === id);
const sources = (taskId) =>
  tasks
    .find((t) => t.id === taskId)
    .sources.flatMap((s) => [...(s.text || []), ...(s.table?.rows || []).flat()])
    .join(" ");

test("every rubric belongs to a real Writing Studio task and has because, but and so", () => {
  for (const [taskId, prompts] of Object.entries(data.tasks)) {
    assert.ok(
      tasks.some((t) => t.id === taskId),
      taskId,
    );
    assert.deepEqual(
      prompts.map((p) => p.id),
      ["because", "but", "so"],
    );
    for (const p of prompts) {
      assert.ok(p.stem.toLowerCase().includes(p.id), `${taskId}/${p.id} stem`);
      for (const c of p.checks) {
        assert.ok(c.en && c.es && c.en !== c.es, `${taskId}/${p.id} feedback must be bilingual`);
        assert.ok(c.all.length && c.all.every((g) => g.length), `${taskId}/${p.id} groups`);
      }
    }
  }
  assert.ok(data.maxRounds >= 10);
});

test("feedback never contains a complete passing answer", () => {
  for (const prompts of Object.values(data.tasks))
    for (const p of prompts)
      for (const c of p.checks) {
        // The feedback alone, used as a response, must not pass every check.
        const r = ev.judge(p, `${c.en}`);
        assert.notEqual(r.status, "strong", `${p.stem}: feedback "${c.en}" passes as an answer`);
      }
});

test("strong, revise, short, copied and empty responses are told apart", () => {
  const because = prompt("wrt-mulch-cer", "because");
  const src = sources("wrt-mulch-cer");
  assert.equal(ev.judge(because, "", { sources: src }).status, "empty");
  assert.equal(ev.judge(because, "it is good", { sources: src }).status, "short");
  assert.equal(
    ev.judge(
      because,
      "the runoff drained into a bucket, and the group dried and weighed the soil",
      { sources: src },
    ).status,
    "copied",
  );
  const vague = ev.judge(because, "it is a very good thing for gardens to have", { sources: src });
  assert.equal(vague.status, "revise");
  assert.equal(vague.check, 0);
  const halfway = ev.judge(because, "the wood chips cover the ground when rain falls on it", {
    sources: src,
  });
  assert.equal(halfway.status, "revise");
  assert.equal(halfway.check, 1);
  const strong = ev.judge(
    because,
    "Mulch reduces soil erosion on a slope because the chips cover the soil so rain cannot knock it loose.",
    { sources: src },
  );
  assert.equal(strong.status, "strong");
});

test("the stem retyped by the learner is not counted as their evidence", () => {
  const p = prompt("wrt-sea-otter-summary", "so");
  assert.equal(ev.ownPart(p.stem, `${p.stem} urchins`), "urchins");
  assert.equal(ev.judge(p, p.stem).status, "empty");
});

test("strong responses get errors.js grammar notes, never a weaker status", () => {
  const p = prompt("wrt-sea-otter-summary", "so");
  const r = ev.judge(p, "the urchins eats all the kelp and made barrens");
  assert.equal(r.status, "strong");
  assert.ok(Array.isArray(r.grammar));
});

test("rounds: up to the maximum, unchanged text is not a new round, strong marks done", () => {
  let e;
  for (let i = 0; i < 20; i += 1) e = ev.addRound(e, `try ${i}`, "revise", 15);
  assert.equal(e.rounds.length, 15);
  let f = ev.addRound(undefined, "a", "revise");
  f = ev.addRound(f, "a", "revise");
  assert.equal(f.rounds.length, 1);
  f = ev.addRound(f, "b", "strong");
  assert.equal(f.done, true);
  assert.deepEqual(ev.normalizeRounds("bad"), {});
  assert.deepEqual(ev.normalizeRounds({ t: { because: { rounds: [{ text: 1 }] } } }), {
    t: { because: { rounds: [], done: false } },
  });
});

test("the warm-up renders inside a task in all three language modes and stays out of independent work", async () => {
  const dom = new JSDOM("<body></body>", {
    url: "https://example.test/access-practice-lab/write/wrt-mulch-cer",
  });
  globalThis.window = dom.window;
  globalThis.document = dom.window.document;
  globalThis.fetch = async (url) => ({
    ok: true,
    json: async () => read(`content/${String(url).split("/content/")[1].split("?")[0]}`),
  });
  Object.defineProperty(globalThis, "localStorage", {
    value: dom.window.localStorage,
    configurable: true,
  });
  const view = await import("../access-practice-lab/src/views/evidence-sentences.js");
  const { makeI18n } = await import("../access-practice-lab/src/i18n.js");
  const { toHtml } = await import("../access-practice-lab/src/util.js");
  const task = tasks.find((t) => t.id === "wrt-mulch-cer");
  for (const mode of ["en", "es", "bi"]) {
    document.body.innerHTML = toHtml(await view.evidenceSentencesHTML(makeI18n(mode), task));
    assert.equal(document.querySelectorAll("[data-evs-check]").length, 3, mode);
  }
  assert.equal(await view.evidenceSentencesHTML(makeI18n("en"), task, { independent: true }), "");
  assert.equal(
    await view.evidenceSentencesHTML(
      makeI18n("en"),
      tasks.find((t) => t.id === "wrt-garden-summary"),
    ),
    "",
  );
  document.querySelector('[data-evs-text="but"]').value = "it is still nice";
  const button = document.querySelector('[data-evs-check="but"]');
  assert.equal(view.onEvidenceClick({ target: button }, task), true);
  document.body.innerHTML = toHtml(await view.evidenceSentencesHTML(makeI18n("es"), task));
  assert.match(
    document.querySelector('[data-evs-prompt="but"] .feedback').textContent,
    /contraste/,
  );
  const page = readFileSync(new URL("src/views/write.js", LAB), "utf8");
  assert.match(page, /evidenceSentencesHTML\(I, task/);
  assert.match(page, /onEvidenceClick\(e, S\.task\)/);
});
