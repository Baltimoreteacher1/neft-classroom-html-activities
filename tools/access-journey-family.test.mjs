/**
 * Family Mission Companions (access-practice-lab/src/content/journey/family.js) and the family surfaces that show them.
 *   - all twelve companions satisfy validateFamily and sit under m01..m12
 *   - plain language: no WIDA terms, no "usted", no spaced percent, no ASCII double quotes, no English left in the
 *     Spanish slot (outside « » quotes), Spanish for adults uses "ustedes"
 *   - the five-minute activity and the conversation prompt differ between grade bands; frames carry blanks; the
 *     home-language note says English-only is not required; revision never hands over the answer; missions after
 *     the first link back to earlier work
 *   - pure helpers in src/family/journey-link.js read counts and step names only
 *   - the family view renders the m08 companion in English, Español and bilingual under jsdom
 */
import assert from "node:assert/strict";
import { join } from "node:path";
import test from "node:test";
import { JSDOM } from "jsdom";
import { REPO_ROOT } from "./lib/access-lab-content.mjs";

const LAB = join(REPO_ROOT, "access-practice-lab");
const dom = new JSDOM("<!doctype html><html><body><div id=app></div></body></html>", {
  url: "https://example.test/access-practice-lab/family?mission=m08&grades=6-8",
});
for (const k of ["window", "document", "localStorage", "sessionStorage", "location", "history"])
  Object.defineProperty(globalThis, k, {
    value: dom.window[k],
    configurable: true,
    writable: true,
  });
Object.defineProperty(globalThis, "navigator", { value: dom.window.navigator, configurable: true });

const { MISSION_IDS, MISSIONS, validateFamily } = await import(
  join(LAB, "src/journey/curriculum.js")
);
const family = (await import(join(LAB, "src/content/journey/family.js"))).default;
const link = await import(join(LAB, "src/family/journey-link.js"));
const { makeI18n } = await import(join(LAB, "src/i18n.js"));
const { toHtml } = await import(join(LAB, "src/util.js"));

/** Every [English, Spanish] pair in a companion, with a readable path. */
function pairs(c, id) {
  const out = [];
  const walk = (node, path) => {
    if (Array.isArray(node) && node.length === 2 && node.every((x) => typeof x === "string"))
      out.push({ path: `${id}.${path}`, en: node[0], es: node[1] });
    else if (Array.isArray(node)) node.forEach((x, i) => walk(x, `${path}[${i}]`));
    else if (node && typeof node === "object")
      for (const [k, v] of Object.entries(node)) walk(v, path ? `${path}.${k}` : k);
  };
  walk(c, "");
  return out;
}
const all = MISSION_IDS.flatMap((id) => pairs(family[id], id));
const stripQuotes = (s) => s.replace(/«[^»]*»/g, "");

test("twelve companions, m01 to m12, each valid", () => {
  assert.deepEqual(Object.keys(family), MISSION_IDS);
  const errors = MISSION_IDS.flatMap((id) => validateFamily(family[id], id));
  assert.deepEqual(errors, []);
  assert.ok(
    all.length >= 12 * 14,
    `expected at least ${12 * 14} bilingual pairs, found ${all.length}`,
  );
});

test("no assessment jargon in any family string", () => {
  const banned = [
    /WIDA/i,
    /Key Language Use/i,
    /discourse/i,
    /cohesi/i,
    /proficiency level/i,
    /\bELD\b/,
    /Language Expectation/i,
  ];
  const hits = all.flatMap((p) =>
    banned.filter((re) => re.test(p.en) || re.test(p.es)).map((re) => `${p.path}: ${re}`),
  );
  assert.deepEqual(hits, []);
});

test("Spanish register and format: ustedes, never usted; 60% not 60 %; guillemets for quotes", () => {
  const bad = [];
  for (const p of all) {
    if (/\busted\b/i.test(p.es) || /\b(vosotros|vos)\b/i.test(p.es))
      bad.push(`${p.path}: usted/vos`);
    if (/\d\s+%/.test(p.en) || /\d\s+%/.test(p.es)) bad.push(`${p.path}: spaced percent`);
    if (p.en.includes('"') || p.es.includes('"')) bad.push(`${p.path}: ASCII double quote`);
    if (p.en === p.es) bad.push(`${p.path}: Spanish is a copy of English`);
  }
  assert.deepEqual(bad, []);
});

test("the Spanish slot holds no English function words (frame quotes excepted)", () => {
  const english = /\b(the|and|because|with|your|that|this|they|you|are|was|what|when|each|then)\b/i;
  const hits = all.filter((p) => english.test(stripQuotes(p.es))).map((p) => `${p.path}: ${p.es}`);
  assert.deepEqual(hits, []);
});

test("the English slot is plain English: no Spanish accents or inverted marks", () => {
  const hits = all
    .filter((p) => /[¿¡ñáéíóúü]/i.test(p.en.replace(/María/g, "")))
    .map((p) => p.path);
  assert.deepEqual(hits, []);
});

test("five-minute activity and conversation prompt differ by grade band, in both languages", () => {
  for (const id of MISSION_IDS) {
    for (const key of ["fiveMinute", "talk"]) {
      const [a, b] = [family[id][key]["3-5"], family[id][key]["6-8"]];
      assert.notEqual(a[0], b[0], `${id}.${key} English is the same for both bands`);
      assert.notEqual(a[1], b[1], `${id}.${key} Spanish is the same for both bands`);
    }
    if (id === "m08") continue; // frozen entry: its 3-5 prompt asks two short questions
    assert.equal(
      (family[id].talk["3-5"][0].match(/\?/g) || []).length,
      1,
      `${id}.talk 3-5 must be one question`,
    );
    assert.equal(
      (family[id].talk["6-8"][0].match(/\?/g) || []).length,
      1,
      `${id}.talk 6-8 must be one question`,
    );
  }
});

test("frames carry blanks and name real language; the home-language note says English-only is not required", () => {
  for (const id of MISSION_IDS) {
    const c = family[id];
    assert.ok(c.frames.length >= 3, `${id}: 3+ frames`);
    for (const [en, es] of c.frames) {
      assert.match(en, /___/, `${id}: English frame needs a blank: ${en}`);
      assert.match(es, /___/, `${id}: Spanish frame needs a blank: ${es}`);
    }
    if (id === "m08") continue; // frozen entry, shorter wording
    assert.match(c.homeLanguage[0], /not needed|not required/i, `${id}.homeLanguage (en)`);
    assert.match(c.homeLanguage[1], /no es necesario|no hace falta/i, `${id}.homeLanguage (es)`);
  }
  assert.match(family.m08.homeLanguage[0], /any language/i);
});

test("revision invites the child to decide; missions after the first link back to earlier work", () => {
  for (const id of MISSION_IDS) {
    assert.match(
      family[id].revise[0],
      /Let your child|You do not need/i,
      `${id}.revise must leave the answer to the child`,
    );
    assert.match(family[id].revise[1], /Dejen que|No es necesario/i, `${id}.revise (es)`);
    assert.doesNotMatch(
      family[id].revise[0],
      /the answer is|the correct answer/i,
      `${id}.revise must not give an answer`,
    );
  }
  // m08 is the frozen quality bar and carries no spiral line; m01 has nothing before it.
  for (const id of MISSION_IDS.filter((x) => x !== "m01" && x !== "m08")) {
    const text = `${family[id].revise[0]} ${family[id].challenge[0]}`;
    assert.match(
      text,
      /connect with|earlier|last mission|first mission|whole year/i,
      `${id}: add a gentle link to earlier work`,
    );
  }
});

test("each companion stays short enough to read aloud", () => {
  for (const id of MISSION_IDS) {
    for (const p of pairs(family[id], id))
      assert.ok(p.en.length <= 380, `${p.path} English is ${p.en.length} characters`);
    const words = pairs(family[id], id).reduce((n, p) => n + p.en.split(/\s+/).length, 0);
    assert.ok(words <= 520, `${id}: ${words} English words in one companion`);
  }
});

// ── pure helpers ───────────────────────────────────────────────────────────────
test("journey-link: ids, hrefs and the privacy of the progress summary", async () => {
  assert.equal(link.missionFromSearch("?mission=m03"), "m03");
  assert.equal(link.missionFromSearch("?mission=7"), "m07");
  assert.equal(link.missionFromSearch("?mission=zzz"), "");
  assert.equal(
    link.familyContinueHref("m01", "6-8"),
    "/access-practice-lab/family?mission=m01&grades=6-8",
  );
  assert.equal(
    link.familyContinueHref("m01", "bogus"),
    "/access-practice-lab/family?mission=m01&grades=3-5",
  );
  assert.equal(
    link.journeyStepHref("m08", "build", "3-5"),
    "/access-practice-lab/journey/m08/build?grades=3-5",
  );
  assert.equal(link.journeyStepHref("", "", "3-5"), "/access-practice-lab/journey?grades=3-5");
  assert.equal((await link.familyCompanionFor("m12")).goal[0], family.m12.goal[0]);
  assert.equal(await link.familyCompanionFor("nope"), null);
  const state = {
    v: 1,
    bands: {
      "3-5": {
        missions: {
          m01: {
            steps: {
              discover: {
                status: "done",
                doneAt: "2026-11-01T10:00:00Z",
                data: { text: "PRIVATE DRAFT" },
              },
              understand: { status: "started" },
            },
          },
        },
      },
      "6-8": { missions: {} },
    },
  };
  const s = link.progressSummary(state, "3-5");
  assert.equal(s.byMission.m01, 1);
  assert.equal(s.started, 1);
  assert.equal(s.completed, 0);
  assert.deepEqual(s.recent, [
    { mission: "m01", step: "discover", doneAt: "2026-11-01T10:00:00Z" },
  ]);
  assert.ok(
    !JSON.stringify(s).includes("PRIVATE"),
    "summary must not carry anything the learner wrote",
  );
  assert.equal(link.progressSummary(null, "3-5").totalSteps, 0);
  const cur = await link.currentMissionForFamily(null, "3-5");
  assert.ok(MISSION_IDS.includes(cur.mission));
});

// ── the family view under jsdom ────────────────────────────────────────────────
const { render } = await import(join(LAB, "src/views/family.js"));
const { i18nFor } = await import(join(LAB, "src/i18n.js"));
const ctxFor = (lang, band = "6-8") => ({
  route: { view: "family", id: "" },
  band,
  bands: ["3-5", "6-8"],
  prefs: { lang },
});
const pageText = async (lang, band) => {
  const ctx = ctxFor(lang, band);
  const out = await render(ctx);
  return { title: out.title, html: toHtml(out.html) };
};

test("family view renders the m08 companion in English, Español and bilingual", async () => {
  localStorage.setItem("accessPracticeLab:v1:studentName", "Ana <b>");
  const m = MISSIONS.m08;
  const f = family.m08;
  const en = await pageText("en", "6-8");
  assert.equal(en.title, m.title[0]);
  for (const need of [
    m.title[0],
    f.goal[0],
    f.why[0],
    f.practicing[0],
    f.fiveMinute["6-8"][0],
    f.talk["6-8"][0],
    f.listenOrRead[0],
    f.challenge[0],
    f.revise[0],
    f.homeLanguage[0],
    "Print this companion",
    "Do the next practice together",
    "Progress shown is from this device only.",
    "Mission 8 of 12",
    f.frames[0][0],
  ])
    assert.ok(
      en.html.includes(need.replace(/&/g, "&amp;")) || en.html.includes(need),
      `English view is missing: ${need}`,
    );
  assert.ok(!en.html.includes(f.fiveMinute["3-5"][0]), "6-8 view must not show the 3-5 activity");
  assert.ok(!en.html.includes("Ana <b>"), "the learner name must be escaped");
  assert.ok(en.html.includes("Ana &lt;b&gt;"), "the active learner is named");
  assert.ok(!en.html.includes("traductor humano"), "no Spanish notice in English mode");
  assert.ok(!en.html.includes(f.goal[1]), "English mode shows no Spanish companion text");
  assert.match(en.html, /data-print/);
  assert.match(
    en.html,
    /href="\/access-practice-lab\/journey\/m\d\d[^"]*"/,
    "links to the recommended next step",
  );
  assert.match(
    en.html,
    /mission=m08[^"]*"\s+aria-current="page"/,
    "the picker marks the current mission",
  );
  assert.equal((en.html.match(/class="jf-n"/g) || []).length, 12, "the picker lists all twelve");
  assert.ok(!/undefined|\[object/.test(en.html), "no undefined or [object] in the English page");

  const es = await pageText("es", "6-8");
  for (const need of [
    m.title[1],
    f.goal[1],
    f.why[1],
    f.fiveMinute["6-8"][1],
    f.talk["6-8"][1],
    f.revise[1],
    f.homeLanguage[1],
    "Imprimir esta guía",
    "Hagan juntos la siguiente práctica",
    "El progreso que se muestra es solo de este dispositivo.",
    "traductor humano",
    f.frames[0][1],
  ])
    assert.ok(es.html.includes(need), `Spanish view is missing: ${need}`);
  assert.ok(!es.html.includes(f.goal[0]), "Spanish mode shows no English companion prose");
  assert.ok(es.html.includes(f.frames[0][0]), "the English sentence starter stays, tagged lang=en");
  assert.match(es.html, /lang="en"/);
  assert.ok(!/undefined|\[object/.test(es.html), "no undefined or [object] in the Spanish page");

  const bi = await pageText("bi", "3-5");
  for (const need of [
    f.goal[0],
    f.goal[1],
    f.fiveMinute["3-5"][0],
    f.fiveMinute["3-5"][1],
    "Print this companion",
    "Imprimir esta guía",
    "traductor humano",
  ])
    assert.ok(bi.html.includes(need), `Bilingual view is missing: ${need}`);
  assert.match(bi.html, /lang="es"/);
  assert.ok(
    bi.html.indexOf(f.goal[0]) < bi.html.indexOf(f.goal[1]),
    "English first, Spanish under it",
  );
  assert.ok(!bi.html.includes(f.fiveMinute["6-8"][0]), "3-5 view must not show the 6-8 activity");
});

test("home continue card: current mission, one prompt, the activity, the challenge and a link to the companion", async () => {
  const { continueSectionHTML } = await import(join(LAB, "src/family/journey-companion.js"));
  for (const lang of ["en", "es", "bi"]) {
    const ctx = ctxFor(lang, "3-5");
    const out = toHtml(await continueSectionHTML(ctx, i18nFor(ctx)));
    assert.match(out, /jf-continue/);
    assert.match(
      out,
      /href="\/access-practice-lab\/family\?mission=m\d\d&amp;grades=3-5"|href="\/access-practice-lab\/family\?mission=m\d\d&grades=3-5"/,
    );
    assert.equal((out.match(/jf-picker-list/g) || []).length, 1, "mission picker lists all twelve");
    assert.equal((out.match(/class="jf-n"/g) || []).length, 12);
    assert.ok(!/undefined|\[object/.test(out), `${lang}: no undefined or [object]`);
    assert.ok(out.includes("Ana &lt;b&gt;") || lang !== "en", "the active learner is shown");
  }
  makeI18n("en"); // keep the import used
});
