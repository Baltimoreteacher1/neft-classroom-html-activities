// Create · adapters for the Language Page views in batch b: each new family extracts a real ref, validates, keeps a
// known word or question from the source unchanged, and the view's route resolves to that ref.
//   node --test tools/create-adapters-b.test.mjs
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { capabilityFor } from "../access-practice-lab/src/create/routes.js";
import { customizeFrom } from "../access-practice-lab/src/studio/adapters/registry.js";
import { deps, fetchJson, read } from "./studio-customize-adapters-helpers.mjs";

const LAB = "/access-practice-lab";

// parseRoute as main.js defines it (main.js touches the DOM at import, so its function text is evaluated with the
// three names it reads from module scope).
const MAIN = readFileSync(new URL("../access-practice-lab/src/main.js", import.meta.url), "utf8");
const start = MAIN.indexOf("export function parseRoute");
const body = MAIN.slice(start, MAIN.indexOf("\n}\n", start) + 2).replace("export ", "");
const parseRoute = new Function(
  "BASE",
  "DOMAINS",
  "readMathLanguageBridge",
  "location",
  `${body}; return parseRoute;`,
)(LAB, [], () => null, { pathname: "", search: "" });
const questions = (a) => a.blocks.filter((b) => b.type === "question");
const allText = (a) => JSON.stringify(a.blocks);

async function made(family, ref) {
  const out = await customizeFrom(family, ref, deps);
  assert.deepEqual(out.validation.errors, [], `${family}/${ref}: validation errors`);
  return out.activity;
}

function routeSource(path) {
  const [pathname, query = ""] = path.split("?");
  const search = query ? `?${query}` : "";
  return capabilityFor(parseRoute(`${LAB}${pathname}`, search), search).source;
}

test("reading-ladder: passage, Spanish version and authored keys survive; the ladder route opens the picker", async () => {
  const src = read("access-practice-lab/content/ladder/passages.json").passages[0];
  const a = await made("reading-ladder", src.id);
  assert.ok(a.blocks.some((b) => b.type === "passage" && b.text === src.text));
  assert.ok(a.blocks.some((b) => b.id === "passage-es"));
  const q = questions(a);
  assert.equal(q.length, 3);
  assert.equal(q[0].prompt, src.questions[0].q);
  assert.equal(
    q[0].options.find((o) => o.id === q[0].answer).text,
    src.questions[0].choices[src.questions[0].answer],
  );
  const cap = capabilityFor(parseRoute(`${LAB}/ladder`, ""), "");
  assert.equal(cap.disposition, "hub");
});

test("missions: every question key and evidence pick is the file's own; /missions/<id> resolves", async () => {
  const m = read("access-practice-lab/content/missions/watershed-mystery.json");
  const a = await made("missions", m.id);
  const byId = new Map(questions(a).map((q) => [q.id, q]));
  for (const task of m.phases.flatMap((p) => p.tasks || [])) {
    const q = byId.get(task.id);
    assert.ok(q, `${task.id} missing`);
    if (task.kind === "question")
      assert.equal(
        q.options.find((o) => o.id === q.answer).text,
        task.options.find((o) => o.id === task.answer).text,
      );
    if (task.kind === "evidence")
      assert.deepEqual(
        q.answers.map((id) => q.options.find((o) => o.id === id).text).sort(),
        task.pool
          .filter((p) => p.supports)
          .map((p) => p.text)
          .sort(),
      );
    if (task.kind === "speak" || task.kind === "write") {
      assert.equal(q.format, "short");
      assert.equal(q.sample, task.task.stages.guided.model);
    }
  }
  const vocab = a.blocks.find((b) => b.type === "vocab");
  assert.ok(vocab.items.some((v) => v.term === "runoff" && v.es.startsWith("escorrentía")));
  assert.match(
    a.notes.teacher +
      a.blocks
        .filter((b) => b.type === "note")
        .map((b) => b.text)
        .join(" "),
    /Decision point/,
  );
  assert.deepEqual(routeSource("/missions/watershed-mystery"), {
    family: "missions",
    ref: "watershed-mystery",
  });
  assert.deepEqual(routeSource("/mission/space-colony"), {
    family: "missions",
    ref: "space-colony",
  });
  assert.equal(capabilityFor(parseRoute(`${LAB}/missions`, ""), "").disposition, "hub");
});

test("puzzle-den: order, odd-one-out and grid keys; /puzzles/<id> resolves", async () => {
  const ps = read("access-practice-lab/content/puzzles/puzzles.json").puzzles;
  const order = ps.find((p) => p.type === "order");
  const odd = ps.find((p) => p.type === "odd");
  const grid = ps.find((p) => p.id === "grid-pets");
  const o = questions(await made("puzzle-den", order.id))[0];
  assert.deepEqual(
    o.items.map((i) => i.text),
    order.answers[0],
  );
  const c = questions(await made("puzzle-den", odd.id))[0];
  assert.equal(c.options.find((x) => x.id === c.answer).text, odd.words[odd.answer]);
  const g = questions(await made("puzzle-den", grid.id))[0];
  assert.equal(g.format, "match");
  assert.deepEqual(Object.fromEntries(g.pairs.map((p) => [p.left, p.right])), {
    Ana: "fish",
    Ben: "dog",
    Cy: "cat",
  });
  assert.deepEqual(routeSource(`/puzzles/${odd.id}`), { family: "puzzle-den", ref: odd.id });
});

test("mentor-texts: phrases sort under the author's marked moves; /mentor/<id> resolves, toolbox does not", async () => {
  const a = await made("mentor-texts", "m01");
  const sort = questions(a).find((q) => q.format === "sort");
  const tip = sort.items.find((i) => i.text === "tiptoed");
  assert.equal(sort.categories.find((c) => c.id === tip.category).label, "Strong verb");
  assert.ok(
    questions(a).some(
      (q) => q.format === "short" && q.sample === "Maya tiptoed across the dark hallway.",
    ),
  );
  assert.deepEqual(routeSource("/mentor/m01"), { family: "mentor-texts", ref: "m01" });
  assert.equal(routeSource("/mentor/toolbox"), null);
});

test("newsroom-prompts: assignment, Spanish and reporter questions survive; /newsroom/<id> resolves", async () => {
  const a = await made("newsroom-prompts", "np-35-01");
  assert.match(allText(a), /Imagine a class plants a garden behind the gym/);
  assert.match(allText(a), /Imagina que una clase planta un jardín/);
  assert.ok(questions(a).some((q) => q.prompt.startsWith("Who helped plant the garden?")));
  assert.ok(questions(a).every((q) => q.format === "short"));
  assert.deepEqual(routeSource("/newsroom/np-35-01?step=draft"), {
    family: "newsroom-prompts",
    ref: "np-35-01",
  });
});

test("reading-path: decodable book and Spanish survive; unit routes resolve, library pages do not", async () => {
  const book = read("access-practice-lab/content/reading-path/short-a.json");
  const a = await made("reading-path", "short-a");
  assert.ok(a.blocks.some((b) => b.type === "audio" && b.say.includes(book.pages[0].en)));
  assert.ok(a.blocks.some((b) => b.id === "book-es" && b.text.includes(book.pages[0].es)));
  assert.deepEqual(routeSource("/reading-path/short-a/reader"), {
    family: "reading-path",
    ref: "short-a",
  });
  assert.equal(routeSource("/reading-path/library"), null);
});

test("newcomer-packs: English-Spanish pairs are the pack's own; extended pack routes resolve", async () => {
  const pack = read("access-practice-lab/content/packs/survival-vocabulary.json");
  for (const topic of pack.topics) {
    const a = await made("newcomer-packs", `survival-${topic.id}`);
    const pairs = questions(a).flatMap((q) => q.pairs);
    assert.deepEqual(
      pairs.map((p) => `${p.left}=${p.right}`).sort(),
      topic.words.map((w) => `${w.en}=${w.es}`).sort(),
    );
    for (const q of questions(a))
      assert.equal(new Set(q.pairs.map((p) => p.right)).size, q.pairs.length);
  }
  const cards = await made("newcomer-packs", "speaking-listening-cards");
  assert.equal(questions(cards)[0].frame, "First, ___. Next, ___. Finally, ___.");
  assert.deepEqual(routeSource("/packs/new-arrival-school"), {
    family: "newcomer-packs",
    ref: "new-arrival-school",
  });
  assert.equal(routeSource("/packs"), null);
});

test("quest-missions: checks, sorts and timelines keep their keys; /quest/mission/<id> resolves", async () => {
  const m = read("access-practice-lab/content/quest/missions/hp-the-bell-of-port-alder.json");
  const a = await made("quest-missions", m.id);
  const items = m.stages.flatMap((s) => s.items);
  const tl = items.find((i) => i.kind === "timeline");
  const q = questions(a).find((x) => x.id === tl.id);
  assert.deepEqual(
    q.items.map((i) => i.text),
    [...tl.events].sort((x, y) => x.order - y.order).map((e) => e.text),
  );
  for (const chk of items.filter((i) => i.kind === "check")) {
    const qq = questions(a).find((x) => x.id === chk.id);
    assert.equal(
      qq.options.find((o) => o.id === qq.answer).text,
      chk.options.find((o) => o.id === chk.answer).label,
    );
  }
  assert.deepEqual(routeSource(`/quest/mission/${m.id}`), { family: "quest-missions", ref: m.id });
  assert.equal(routeSource("/quest/world"), null);
});

test("batch b dispositions: records are hubs, engines without an adapter are not offered", () => {
  const cap = (path) => capabilityFor(parseRoute(`${LAB}${path}`, ""), "");
  for (const p of [
    "/passport",
    "/path",
    "/portfolio",
    "/lens",
    "/ready-plan",
    "/reader",
    "/radar",
    "/partner",
  ])
    assert.equal(cap(p).disposition, "hub", p);
  for (const p of [
    "/journey",
    "/learn",
    "/reality",
    "/lingua",
    "/language-labs",
    "/language-studios",
    "/language-games",
    "/method",
    "/move",
  ])
    assert.equal(cap(p).disposition, "excluded", p);
  assert.equal(cap("/pairs").tray, false);
  // no listed source of a new family is unreadable
  return fetchJson(`${LAB}/content/index.json`).then((idx) =>
    assert.ok(idx.studio.missions.length >= 9),
  );
});
