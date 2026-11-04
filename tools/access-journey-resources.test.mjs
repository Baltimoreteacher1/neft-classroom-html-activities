// Existing resources <-> the Journey: src/journey/resources.js (rule-based mapping), the checkpoint tests, the
// "Practice this skill" link on support/review recommendations, and the related-practice markup.
//
//   node --test tools/access-journey-resources.test.mjs
//
// Every href is checked against what the lab really answers (parseRoute roots read from src/main.js, the
// navigation rendered from src/nav.js, ids against the content), so a renamed route or a deleted test fails here.
import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import { makeI18n } from "../access-practice-lab/src/i18n.js";
import {
  MISSION_IDS,
  MISSIONS,
  STEP_IDS,
  UNITS,
} from "../access-practice-lab/src/journey/curriculum.js";
import { recommendNext } from "../access-practice-lab/src/journey/recommend.js";
import {
  checkpointsFor,
  MAX_RESOURCES,
  practiceTarget,
  registeredPaths,
  resourcesFor,
} from "../access-practice-lab/src/journey/resources.js";
import {
  EXTERNAL,
  GAMES,
  PRINTABLES,
  ROUTES,
  STEP_PLAN,
} from "../access-practice-lab/src/journey/resources-data.js";
import { alternatives } from "../access-practice-lab/src/journey/runner-panels.js";
import { completeStep, emptyState, setCursor } from "../access-practice-lab/src/journey/state.js";
import {
  checkpointCardHTML,
  relatedListHTML,
} from "../access-practice-lab/src/journey/ui/related.js";
import { toHtml } from "../access-practice-lab/src/util.js";
import { buildIndex, LAB_DIR } from "./lib/access-lab-content.mjs";
import { contentFacts, hrefProblem, navPaths, routeFacts } from "./lib/journey-routes.mjs";

const BANDS = ["3-5", "6-8"];
const index = buildIndex();
const facts = routeFacts();
const gameIds = readdirSync(join(LAB_DIR, "content/games")).map((f) => f.replace(/\.json$/, ""));
const content = contentFacts(index, gameIds);
const isPair = (x) =>
  Array.isArray(x) && x.length === 2 && x.every((s) => typeof s === "string" && s.trim());
const problems = (list) => list.map((r) => hrefProblem(r.href, facts, content)).filter(Boolean);

test("every mission x step x band returns 1-4 resources, no duplicate href, deterministic (coverage table)", () => {
  const rows = [];
  for (const band of BANDS)
    for (const id of MISSION_IDS) {
      const row = [band, id];
      for (const step of STEP_IDS) {
        const list = resourcesFor(id, step, band, index);
        assert.ok(list.length >= 1, `${id}/${step}/${band} has no resource`);
        assert.ok(list.length <= MAX_RESOURCES, `${id}/${step}/${band} lists ${list.length}`);
        const hrefs = list.map((r) => r.href);
        assert.equal(new Set(hrefs).size, hrefs.length, `${id}/${step}/${band} repeats an href`);
        assert.deepEqual(list, resourcesFor(id, step, band, index), "same input, same output");
        row.push(`${list.length}(${list.filter((r) => r.kind === "activity").length}a)`);
      }
      rows.push(row.join("\t"));
    }
  console.log(`band\tmission\t${STEP_IDS.join("\t")}\n${rows.join("\n")}`);
});

test("with no content index every step still returns the registry resources", () => {
  for (const band of BANDS)
    for (const id of MISSION_IDS)
      for (const step of STEP_IDS)
        assert.ok(resourcesFor(id, step, band, null).length >= 1, `${id}/${step}/${band}`);
  assert.deepEqual(resourcesFor("zz", "build", "6-8", index), [], "unknown mission");
  assert.deepEqual(resourcesFor("m01", "zz", "6-8", index), [], "unknown step");
});

test("every href resolves against parseRoute roots, the content ids and the files on disk", () => {
  assert.ok(
    facts.roots.includes("journey") && facts.roots.includes("test"),
    "parseRoute roots were read",
  );
  const all = [];
  for (const band of BANDS) {
    for (const id of MISSION_IDS)
      for (const step of STEP_IDS) all.push(...resourcesFor(id, step, band, index));
    for (const u of UNITS) all.push(...checkpointsFor(u.n, band, index));
  }
  assert.ok(all.length > 400);
  assert.deepEqual(problems(all), []);
  assert.deepEqual(problems(BANDS.map((b) => practiceTarget("m01", "build", b))), []);
});

test("the registry only names real routes, real games and real files", () => {
  for (const { path, kind } of registeredPaths()) {
    const href = path.startsWith("/") ? path : `/access-practice-lab/${path}?grades=6-8`;
    assert.equal(hrefProblem(href, facts, content), null, `${kind} ${path}`);
  }
  for (const g of GAMES) {
    const def = JSON.parse(readFileSync(join(LAB_DIR, `content/games/${g.id}.json`), "utf8"));
    assert.deepEqual(Object.keys(def.bands).sort(), BANDS, `${g.id} ships both bands`);
  }
  for (const p of PRINTABLES)
    assert.ok(existsSync(join(LAB_DIR, p.path.replace("/access-practice-lab/", ""))));
  assert.ok(EXTERNAL.length >= 4);
});

test("every navigation link still resolves (the preservation checklist)", async () => {
  const paths = await navPaths("6-8");
  assert.ok(paths.length > 30);
  for (const p of paths) assert.equal(hrefProblem(p, facts, content), null, `nav link ${p}`);
});

test("steps keep their domain split: build/improve are not Listening, show is production, discover is not a test", () => {
  assert.deepEqual(STEP_PLAN.understand.domains, ["Listening", "Reading"]);
  assert.deepEqual(STEP_PLAN.show.domains, ["Speaking", "Writing"]);
  assert.equal(STEP_PLAN.show.levels[0], "C", "show prefers the least-supported level");
  for (const band of BANDS)
    for (const id of MISSION_IDS) {
      assert.ok(!resourcesFor(id, "discover", band, index).some((r) => r.kind === "test"));
      for (const r of resourcesFor(id, "show", band, index).filter((x) => x.kind === "activity")) {
        assert.match(r.href, /mode=independent/, "on-your-own items open with no help");
        assert.equal(r.tag[0], "On your own");
      }
      for (const step of STEP_IDS.filter((s) => s !== "show"))
        for (const r of resourcesFor(id, step, band, index)) {
          assert.doesNotMatch(
            r.href,
            /mode=independent/,
            "supported steps are not forced independent",
          );
          if (r.kind === "test") assert.fail(`${step} lists a test`);
        }
    }
});

test("show-aligned items are labelled On your own; practice tests are labelled Checkpoint and never carry supports", () => {
  const scaffold = /frames|wordBank|word bank|hint|support|scaffold|model|vocab/i;
  const allowed = new Set(["kind", "title", "titleT", "href", "domain", "why", "tag"]);
  const checks = [];
  for (const band of BANDS) {
    for (const u of UNITS) checks.push(...checkpointsFor(u.n, band, index));
    for (const id of MISSION_IDS)
      checks.push(...resourcesFor(id, "show", band, index).filter((r) => r.kind === "test"));
  }
  assert.ok(checks.length >= 20);
  for (const r of checks) {
    assert.equal(r.kind, "test");
    assert.equal(r.tag[0], "Checkpoint");
    assert.deepEqual(
      Object.keys(r).filter((k) => !allowed.has(k)),
      [],
      "no extra fields",
    );
    assert.ok(!Object.keys(r).some((k) => scaffold.test(k)), "no scaffold fields");
    const id = /\/test\/([^?]+)\?grades=([\d-]+)&rehearsal=independent$/.exec(r.href);
    assert.ok(id, `exact existing test route: ${r.href}`);
    const t = index.tests.find((x) => x.id === id[1]);
    assert.ok(t && t.band === id[2], "the test exists for that band");
    assert.ok(existsSync(join(LAB_DIR, `content/tests/${id[1]}.json`)));
  }
  for (const band of BANDS)
    for (const u of UNITS)
      assert.ok(checkpointsFor(u.n, band, index).length >= 1, `unit ${u.n} ${band}`);
  assert.deepEqual(checkpointsFor(9, "6-8", index), []);
  assert.deepEqual(checkpointsFor(1, "6-8", null), []);
});

test("every resource has a bilingual why, and bilingual titles for routes", () => {
  const all = [];
  for (const band of BANDS) {
    for (const id of MISSION_IDS)
      for (const step of STEP_IDS) all.push(...resourcesFor(id, step, band, index));
    for (const u of UNITS) all.push(...checkpointsFor(u.n, band, index));
  }
  for (const r of all) {
    assert.ok(isPair(r.why), `why of ${r.href}`);
    assert.ok(r.title?.trim() && r.href && r.domain && r.kind, r.href);
    assert.ok(
      ["activity", "studio", "test", "game", "printable", "family"].includes(r.kind),
      r.kind,
    );
    if (r.titleT) assert.ok(isPair(r.titleT));
    if (r.tag) assert.ok(isPair(r.tag));
    assert.notEqual(r.why[0], r.why[1], "Spanish is not a copy of the English");
  }
  for (const r of ROUTES) assert.ok(isPair(r.label) && isPair(r.objective), r.id);
  for (const g of GAMES) assert.ok(isPair(g.label) && isPair(g.objective), g.id);
  for (const p of PRINTABLES) assert.ok(isPair(p.label) && isPair(p.objective), p.id);
});

const entry = (task, moves, t) => ({
  src: "mission",
  task,
  band: "6-8",
  stage: "supported",
  m: { moves },
  t,
});
const done = (s, steps) =>
  steps.reduce(
    (x, step) =>
      completeStep(x, "6-8", "m08", step, { independent: false, now: "2026-11-01T12:00:00Z" }),
    s,
  );

test("support and review recommendations carry a Practice this skill link; other fields are unchanged", () => {
  let s = done(emptyState(), STEP_IDS.slice(0, 4));
  s = setCursor(s, "6-8", "m08", "communicate");
  const ledger = {
    entries: [entry("m08.communicate", { phenomenon: 1, cause: 0 }, "2026-11-01T18:00:00Z")],
  };
  const r = recommendNext(s, "6-8", { ledger, now: "2026-11-01T19:00:00Z" });
  assert.equal(r.kind, "support");
  assert.equal(r.step, "build", "existing fields unchanged");
  assert.deepEqual(r.missing, ["cause"]);
  assert.match(r.practice.href, /^\/access-practice-lab\/Writing\?grades=6-8$/);
  assert.ok(isPair(r.practice.label));
  assert.equal(hrefProblem(r.practice.href, facts, content), null);
  const I = makeI18n("en");
  const alts = alternatives({
    I,
    band: "6-8",
    rec: r,
    primaryHref: "/x",
    practiceDomain: "Writing",
  });
  assert.ok(alts.length <= 2);
  assert.equal(alts[0].href, r.practice.href, "the practice link is offered first");
  assert.ok(alts.every((a) => a.href !== "/x"));
  // a teacher-assigned link is untouched: no practice field, same kind
  const assigned = recommendNext(s, "6-8", {
    assigned: { mission: "m08", step: "show" },
    ledger,
    now: "2026-11-01T19:00:00Z",
  });
  assert.equal(assigned.kind, "assigned");
  assert.equal(assigned.practice, undefined);
});

test("related practice markup: a collapsible of 3, and an optional checkpoint card with the tests as they are", () => {
  const I = makeI18n("en");
  const list = toHtml(relatedListHTML(I, "6-8", "m08", "build", index));
  assert.match(list, /<details class="jr-related"/);
  assert.equal((list.match(/<li>/g) || []).length, 3);
  const card = toHtml(checkpointCardHTML(I, "6-8", 3, index));
  assert.match(card, /Unit checkpoint \(optional\)/);
  assert.match(card, /data-jr-checkpoint/);
  assert.match(card, /\/test\/[\w-]+\?grades=6-8&amp;rehearsal=independent/);
  assert.doesNotMatch(card, /mode=guided/);
  assert.equal(toHtml(checkpointCardHTML(I, "6-8", 9, index)), "");
  const es = toHtml(relatedListHTML(makeI18n("es"), "6-8", "m08", "show", index));
  assert.match(es, /Práctica relacionada/);
  assert.match(es, /Por tu cuenta/);
  assert.ok(MISSIONS.m08);
});
