// The grade-band Guided Tour and Mr. Neft, the guide: every tour activity is the real activity (id, title, level,
// minutes against content/index.json; voice ladders and Language Upgrade items against their own data), every
// route opens in the grade it names, the guide's quick answers come from verified text, and /api/language-guide is
// grounded in that same data, refuses bad input and says "offline" (never an invented answer) with no model bound.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { JSDOM } from "jsdom";

const ROOT = new URL("../", import.meta.url);
const win = new JSDOM("<main id='app'></main>", { url: "https://lab.test/access-practice-lab/" })
  .window;
for (const key of ["window", "document", "localStorage", "sessionStorage", "location", "history"])
  globalThis[key] = win[key];

const index = JSON.parse(
  readFileSync(new URL("access-practice-lab/content/index.json", ROOT), "utf8"),
);
const { GRADE_PICKS } = await import("../access-practice-lab/src/grade-bands.js");
const { normalizeBand } = await import("../access-practice-lab/src/bands.js");
const { BAND_TOUR, DOMAINS, tourActivities, tourRoute } = await import(
  "../access-practice-lab/src/intro/tour-bands.js"
);
const { TOUR_STOPS } = await import("../access-practice-lab/src/intro/data.js");
const { LADDERS } = await import("../access-practice-lab/src/content/voice-lab.js");
const { itemById } = await import("../access-practice-lab/src/content/scaffold-items.js");
const { checkUpgrade } = await import("../access-practice-lab/src/lang/scaffold-check.js");
const { GUIDE, GUIDE_RULES, QUICK, guideContext, quickAnswer } = await import(
  "../access-practice-lab/src/intro/guide-knowledge.js"
);
const { pickFromParam } = await import("../access-practice-lab/src/intro/band.js");

const DOMAIN_NAME = {
  listening: "Listening",
  speaking: "Speaking",
  reading: "Reading",
  writing: "Writing",
};

/** The index row for an activity id: [band, domain, level, row]. */
function indexRow(id) {
  for (const [band, b] of Object.entries(index.bands))
    for (const [domain, d] of Object.entries(b.domains))
      for (const [level, l] of Object.entries(d.levels))
        for (const row of l.activities)
          if (row[0] === id) return { band, domain, level, row, tier: l.tier?.name };
  return null;
}

test("every grade choice has one activity per domain, in Listening, Speaking, Reading, Writing order", () => {
  assert.deepEqual(
    DOMAINS.map((d) => d.id),
    ["listening", "speaking", "reading", "writing"],
  );
  assert.deepEqual(Object.keys(BAND_TOUR).sort(), GRADE_PICKS.map((p) => p.id).sort());
  for (const p of GRADE_PICKS) {
    const acts = tourActivities(p.id);
    assert.equal(acts.length, 4, p.id);
    for (const a of acts) {
      assert.equal(a.steps.length, 3, `${p.id}/${a.domain.id} has three try-it steps`);
      assert.ok(
        a.students && a.notice && a.use && a.supports.length >= 3,
        `${p.id}/${a.domain.id} is complete`,
      );
      assert.doesNotMatch(JSON.stringify(a), /\b(score of|level [1-6]|proficien|WIDA level)/i);
    }
  }
});

test("domain activities are the real ones: id, title, level, minutes and grade match the content index", () => {
  for (const p of GRADE_PICKS)
    for (const a of tourActivities(p.id)) {
      const m = /^\/(Listening|Reading|Speaking|Writing)\/([A-Z])\/([\w-]+)$/.exec(a.route);
      if (!m) continue;
      const hit = indexRow(m[3]);
      assert.ok(hit, `${a.route} is in content/index.json`);
      assert.equal(hit.domain, m[1]);
      assert.equal(hit.domain, DOMAIN_NAME[a.domain.id], `${a.id} sits under its own domain`);
      assert.equal(hit.level, m[2]);
      assert.equal(hit.row[1].replace(/'/g, "’"), a.title.replace(/'/g, "’"), `${a.id} title`);
      assert.equal(hit.row[4], a.minutes, `${a.id} minutes`);
      assert.equal(hit.band, normalizeBand(p.id), `${a.id} belongs to ${p.id}`);
      assert.equal(hit.tier, a.level, `${a.id} level label`);
    }
});

test("voice ladders and Language Upgrade items exist and the writing samples pass the real check", () => {
  for (const p of GRADE_PICKS)
    for (const a of tourActivities(p.id)) {
      const ladder = /^\/voice\/ladder\/([\w-]+)$/.exec(a.route);
      if (ladder)
        assert.ok(
          LADDERS.some((l) => l.id === ladder[1]),
          a.route,
        );
      const item = /item=([\w-]+)/.exec(a.route);
      if (item) {
        const it = itemById(item[1]);
        assert.ok(it, a.route);
        assert.equal(checkUpgrade(it, a.sample).ok, true, `${p.id} sample: ${a.sample}`);
      }
    }
});

test("every tour route opens in its own grade, and ?grades= values resolve to a pick", () => {
  for (const p of GRADE_PICKS)
    for (const a of tourActivities(p.id)) {
      const url = new URL(tourRoute(a, { frame: "1" }), "https://x.test");
      assert.equal(url.searchParams.get("grades"), p.id);
      assert.equal(url.searchParams.get("frame"), "1");
      assert.ok(normalizeBand(url.searchParams.get("grades")), url.href);
    }
  assert.equal(pickFromParam("3-5"), "4-5");
  assert.equal(pickFromParam("k"), "K");
  assert.equal(pickFromParam("nope"), "");
});

test("the tour has six stops: grades, the four domains, a plan", () => {
  assert.deepEqual(
    TOUR_STOPS.map((s) => s.id),
    ["start", "listening", "speaking", "reading", "writing", "tomorrow"],
  );
});

test("Mr. Neft's quick answers are non-empty, verified text, and never claim a score", () => {
  assert.equal(GUIDE.name, "Mr. Neft");
  const act = tourActivities("2-3")[0];
  for (const id of Object.keys(QUICK)) {
    const en = quickAnswer(id, act, "en");
    assert.ok(en.length > 20, id);
    assert.doesNotMatch(en, /\byou (will|’ll) (get|receive) a (score|grade)/i, id);
  }
  assert.equal(quickAnswer("students", act), act.students);
  assert.match(quickAnswer("scored", null), /never gives a score/);
  assert.match(quickAnswer("account", null, "es"), /cuenta/);
  // Answers that name buttons follow the grade (the early player says "I said my answer"; the 6-8 Speak studio has
  // "I said it out loud (no recording)"). Full coverage: tools/access-intro-guide-ai.test.mjs.
  assert.match(quickAnswer("norecord", tourActivities("K")[1]), /I said my answer/);
  assert.doesNotMatch(quickAnswer("norecord", tourActivities("K")[1]), /no recording/);
  assert.match(quickAnswer("norecord", null, "en", "6-8"), /no recording/);
});

test("the AI guide's context carries the chosen grade's activities and the site's rules", () => {
  const ctx = guideContext({ pick: "K", page: "tour", step: "Listening" });
  for (const a of tourActivities("K")) assert.ok(ctx.includes(a.title), a.title);
  assert.match(ctx, /WHAT IT CANNOT DO/);
  assert.match(ctx, /thelanguagepage\.com\/access-practice-lab\/practice-together/);
  assert.match(GUIDE_RULES, /Answer only from the FACTS/);
  assert.match(GUIDE_RULES, /Never say the site gives scores/);
});

test("/api/language-guide: refuses bad input, is offline without a model, answers from a model", async () => {
  const { onRequest } = await import("../functions/api/language-guide.js");
  const post = (body, env = {}) =>
    onRequest({
      request: new Request("https://x.test/api/language-guide", {
        method: "POST",
        headers: { "content-type": "application/json", "CF-Connecting-IP": `t${Math.random()}` },
        body: JSON.stringify(body),
      }),
      env,
    });
  assert.equal((await post({ question: "" })).status, 400);
  const off = await post({ question: "Do I need an account?" });
  assert.equal(off.status, 503);
  assert.equal((await off.json()).offline, true);
  let seen;
  const env = {
    AI: {
      run: async (_model, input) => {
        seen = input;
        return { response: "No account is needed to practice." };
      },
    },
  };
  const res = await post(
    {
      question: "Do I need an account?",
      grades: "2-3",
      page: "family",
      lang: "es",
      history: [{ q: "hi", a: "hello" }],
    },
    env,
  );
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.answer, "No account is needed to practice.");
  assert.equal(data.source, "workers-ai");
  assert.match(seen.messages[0].content, /Leo’s Library Card/, "grounded in the chosen grade");
  assert.match(seen.messages[1].content, /Language: es/);
  assert.match(seen.messages[1].content, /Earlier question: hi/);
  const get = await onRequest({ request: new Request("https://x.test/api/language-guide"), env });
  assert.equal(get.status, 405);
});

test("the Language Page host serves the guide endpoint", async () => {
  const src = readFileSync(new URL("functions/_lib/language-page.js", ROOT), "utf8");
  assert.match(src, /"\/api\/language-guide"/);
});
