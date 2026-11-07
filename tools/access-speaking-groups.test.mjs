// Teacher-led small-group speaking routines from class evidence (Language Page feature #16).
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { JSDOM } from "jsdom";

const sg = await import("../access-practice-lab/src/lang/speaking-groups.js");

const entry = (o = {}) => ({
  src: "speaking",
  kind: "first",
  stage: "independent",
  use: "Narrate",
  ...o,
});
const student = (alias, entries) => ({ alias, section: "P1", band: "6-8", ledger: { entries } });

test("every routine is bilingual, teacher-led, untimed and never names a level or score", () => {
  for (const need of sg.NEED_ORDER) {
    const r = sg.ROUTINES[need];
    for (const o of [r.title, r.why, r.listen, ...r.steps]) {
      assert.ok(o.en && o.es && o.en !== o.es, `${need}`);
      assert.doesNotMatch(
        `${o.en} ${o.es}`,
        /timer|countdown|seconds? left|WIDA level|score/i,
        need,
      );
    }
    assert.ok(r.steps.length >= 3 && r.frames.length >= 1, need);
  }
});

test("the need follows the evidence in priority order", () => {
  const ev = (entries) => sg.speakingEvidence(student("x", entries));
  assert.equal(sg.needOf(ev([entry()])), "start");
  assert.equal(
    sg.needOf(ev([entry({ stage: "supported" }), entry({ stage: "supported" })])),
    "fade",
  );
  assert.equal(
    sg.needOf(ev([entry({ m: { spk: { speech: 8 } } }), entry({ m: { spk: { speech: 12 } } })])),
    "extend",
  );
  assert.equal(sg.needOf(ev([entry(), entry()])), "argue");
  assert.equal(sg.needOf(ev([entry({ use: "Argue" }), entry(), entry()])), "coach");
  assert.equal(sg.needOf(ev([entry({ use: "Explain" }), entry({ stage: "supported" })])), "extend");
});

test("revisions are not counted as tries, and writing evidence is ignored", () => {
  const ev = sg.speakingEvidence(
    student("x", [entry(), entry({ kind: "revision" }), { src: "writing", kind: "first" }]),
  );
  assert.equal(ev.tries, 1);
});

test("groups hold at most four, students without evidence are listed, not guessed", () => {
  const roster = [
    ...Array.from({ length: 6 }, (_, i) =>
      student(`S${i}`, [entry({ stage: "supported" }), entry({ stage: "supported" })]),
    ),
    student("New", []),
  ];
  const { groups, noEvidence } = sg.suggestGroups(roster);
  assert.deepEqual(
    groups.map((g) => [g.need, g.members.length]),
    [
      ["fade", 4],
      ["fade", 2],
    ],
  );
  assert.deepEqual(noEvidence, ["New"]);
  assert.deepEqual(sg.suggestGroups([]), { groups: [], noEvidence: [] });
});

test("the Teacher Hub panel renders the groups with their counts in English and Spanish", async () => {
  const dom = new JSDOM("<body></body>", { url: "https://example.test/access-teacher/" });
  globalThis.window = dom.window;
  globalThis.document = dom.window.document;
  Object.defineProperty(globalThis, "localStorage", {
    value: dom.window.localStorage,
    configurable: true,
  });
  const lab = new URL("../access-practice-lab/", import.meta.url).href;
  const src = readFileSync(
    new URL("../access-teacher/speaking-groups.js", import.meta.url),
    "utf8",
  ).replaceAll("/access-practice-lab/", lab);
  const panel = await import(`data:text/javascript;base64,${Buffer.from(src).toString("base64")}`);
  const { makeI18n } = await import("../access-practice-lab/src/i18n.js");
  const { toHtml } = await import("../access-practice-lab/src/util.js");
  const roster = [student("Ana", [entry(), entry()])];
  for (const mode of ["en", "es", "bi"]) {
    document.body.innerHTML = toHtml(panel.speakingGroupsHTML(makeI18n(mode), roster));
    assert.equal(document.querySelectorAll("[data-speaking-group=argue]").length, 1, mode);
    assert.match(document.body.textContent, /Ana/);
    document.body.innerHTML = toHtml(panel.ladderControlsHTML(makeI18n(mode), "https://x.test"));
    assert.ok(
      document.querySelector('a[href="https://x.test/access-practice-lab/ladder?spanish=on"]'),
      mode,
    );
  }
  const hub = readFileSync(new URL("../access-teacher/index.html", import.meta.url), "utf8");
  assert.match(hub, /id="speakingGroups"/);
  assert.match(hub, /src="\/access-teacher\/speaking-groups\.js/);
});
