// Practice Together copy: every { en, es } pair is complete and different, adult lines use "ustedes", routes come from
// data.js, and the Start links carry the return hint. Pure logic: no browser.
import assert from "node:assert/strict";
import test from "node:test";
import {
  ACTIVITIES,
  ACTIVITY_BY_ID,
  FACTS,
  SUPPLEMENTAL,
} from "../access-practice-lab/src/intro/data.js";
import { render } from "../access-practice-lab/src/intro/family.js";
import {
  FAMILY,
  FAMILY_ACTIVITIES,
  FAMILY_HANDOUT,
  FAMILY_MORE,
  FAMILY_WELCOME,
  familyBandFromGrades,
  HANDOUT_COPY,
  practiceAtHome,
  TONIGHT,
} from "../access-practice-lab/src/intro/family-data.js";
import {
  EARLY_CARD,
  EARLY_MODELS,
  earlyPickFrom,
  earlyRoutine,
  FAMILY_HANDOUT_K2,
  HANDOUT_K2_COPY,
} from "../access-practice-lab/src/intro/family-k2-data.js";
import { READ_LABELS, readLang, stepLines } from "../access-practice-lab/src/intro/family-read.js";
import { RETURNS, withReturn } from "../access-practice-lab/src/intro/return-bar.js";
import { toHtml } from "../access-practice-lab/src/util.js";

/** Every object that has an `en` or `es` key, with its path. */
function pairs(node, path = "", out = []) {
  if (Array.isArray(node)) node.forEach((v, i) => pairs(v, `${path}[${i}]`, out));
  else if (node && typeof node === "object") {
    if ("en" in node || "es" in node) out.push([path, node]);
    else for (const [k, v] of Object.entries(node)) pairs(v, `${path}.${k}`, out);
  }
  return out;
}
const ALL = pairs({
  FAMILY,
  FAMILY_ACTIVITIES,
  FAMILY_MORE,
  practiceAtHome,
  TONIGHT,
  FAMILY_WELCOME,
  HANDOUT_COPY,
  EARLY_CARD,
  HANDOUT_K2_COPY,
  READ_LABELS,
  early: ["K", "1", "2-3"].map((p) => earlyRoutine(p).steps),
});

test("the walk finds the page copy", () => {
  assert.ok(ALL.length > 60, `expected many pairs, found ${ALL.length}`);
});

test("every pair has English and a different Spanish", () => {
  for (const [path, p] of ALL) {
    assert.equal(typeof p.en, "string", `${path}.en`);
    assert.equal(typeof p.es, "string", `${path}.es`);
    assert.ok(p.en.trim() && p.es.trim(), `${path} is empty`);
    assert.notEqual(p.es, p.en, `${path}: Spanish is identical to English`);
  }
});

test("Spanish follows the style guide: no usted, no tú, no vosotros, percent and ranges plain", () => {
  for (const [path, p] of ALL) {
    assert.ok(!/\busted\b|\bvosotros\b|\bvos\b/i.test(p.es), `${path}: usted/vos/vosotros`);
    assert.ok(
      !/\b(tú|tu|te|ti)\b/i.test(p.es.replace(/«[^»]*»/g, "")),
      `${path}: tú form in an adult line`,
    );
    assert.ok(!/\d %/.test(p.es), `${path}: spaced percent`);
  }
});

test("two choices: talk (hallway) and write (upgrade), routes from data.js", () => {
  assert.deepEqual(
    FAMILY_ACTIVITIES.map((a) => [a.id, a.activityId]),
    [
      ["talk", "hallway"],
      ["write", "upgrade"],
    ],
  );
  for (const a of FAMILY_ACTIVITIES) {
    assert.equal(a.route, ACTIVITY_BY_ID[a.activityId].route);
    assert.equal(a.activityName, ACTIVITY_BY_ID[a.activityId].name);
    assert.equal(a.steps.length, 3, `${a.id} has three steps`);
    assert.ok(a.example.label, `${a.id} example is labeled`);
  }
  assert.equal(FAMILY_ACTIVITIES[0].route, "/voice/ladder/school-hallway");
  assert.ok(
    FAMILY_ACTIVITIES[1].route.startsWith("/scaffold/language-upgrade?item=lu68-argue-phones"),
  );
  assert.ok(
    ACTIVITIES.some((a) => a.id === "hallway") && ACTIVITIES.some((a) => a.id === "upgrade"),
  );
});

test("the three steps follow the routine: look, try, share", () => {
  for (const a of FAMILY_ACTIVITIES)
    assert.deepEqual(
      a.steps.map((s) => s.head.en),
      ["Look at the example", "Try it together", "Share what you did"],
    );
});

test("More Practice lists exactly the supplemental resources, with their routes", () => {
  assert.deepEqual(
    FAMILY_MORE.map((m) => [m.id, m.route]),
    SUPPLEMENTAL.map((s) => [s.id, s.route]),
  );
});

test("account, saving, audio and microphone answers reuse data.js facts", () => {
  const by = Object.fromEntries(FAMILY.help.items.map((i) => [i.id, i.a.en]));
  assert.equal(by.account, FACTS.account);
  assert.ok(by.sound.startsWith(FACTS.audio));
  assert.equal(by.mic, FACTS.microphone);
});

test("help covers return, stop and sound, and links the device check", () => {
  const ids = FAMILY.help.items.map((i) => i.id);
  for (const id of ["account", "sound", "back", "stop"]) assert.ok(ids.includes(id), id);
  assert.equal(FAMILY.help.items.find((i) => i.id === "sound").link.route, "/tools");
  assert.match(FAMILY.help.items.find((i) => i.id === "back").a.en, /Back to Practice Together/);
});

test("practice at home has the four bullets", () => {
  assert.deepEqual(
    practiceAtHome.map((b) => b.id),
    ["choose", "together", "language", "stop"],
  );
});

test("no path or route contains 'teacher'; links stay in the lab", () => {
  const routes = [
    ...FAMILY_ACTIVITIES.map((a) => a.route),
    ...FAMILY_MORE.map((m) => m.route),
    FAMILY.links.siteGuide.route,
    FAMILY.links.familyCorner.route,
    ...FAMILY.help.items.filter((i) => i.link).map((i) => i.link.route),
  ];
  for (const r of routes) {
    assert.ok(r.startsWith("/"), r);
    assert.ok(!/teacher/i.test(r), r);
  }
  assert.equal(FAMILY.links.siteGuide.route, "/site-guide?for=family");
  assert.equal(FAMILY.links.familyCorner.route, "/family");
});

test("withReturn keeps the query and adds the together hint", () => {
  assert.ok(RETURNS.together);
  const href = withReturn(
    "/access-practice-lab/scaffold/language-upgrade?item=lu68-argue-phones",
    "together",
  );
  assert.equal(
    href,
    "/access-practice-lab/scaffold/language-upgrade?item=lu68-argue-phones&intro=together",
  );
  assert.equal(
    withReturn("/access-practice-lab/voice/ladder/school-hallway", "together"),
    "/access-practice-lab/voice/ladder/school-hallway?intro=together",
  );
});

test("copy never claims what the lab does not do", () => {
  const { spanishNote, ...page } = FAMILY; // the machine-assisted note names "translator" on purpose
  const text = JSON.stringify([
    page,
    FAMILY_ACTIVITIES,
    FAMILY_MORE,
    TONIGHT,
    FAMILY_WELCOME,
    HANDOUT_COPY,
  ]).toLowerCase();
  for (const bad of [
    "translat",
    "wida level",
    "proficiency",
    "score",
    "points",
    "streak",
    "certificate",
    "automatic",
    "timer",
    "free",
  ])
    assert.ok(!text.includes(bad), `claims "${bad}"`);
  assert.ok(spanishNote.es.includes("máquina"));
});

// ── grade from a teacher's link, the tonight flow, the guide panel, the handout link ───────────────────────────────
test("?grades= maps to the family grade: K, 1, 2-3 → k-2; 4-5, 3-5 → 3-5; 6-8 → 6-8; anything else → none", () => {
  const want = {
    K: "k-2",
    k: "k-2",
    1: "k-2",
    "2-3": "k-2",
    "4-5": "3-5",
    "3-5": "3-5",
    "6-8": "6-8",
  };
  for (const [g, band] of Object.entries(want)) assert.equal(familyBandFromGrades(g), band, g);
  for (const g of ["", null, undefined, "9-12", "all", "3"])
    assert.equal(familyBandFromGrades(g), "", String(g));
});

test("tonight is three steps: choose, practice, celebrate", () => {
  assert.deepEqual(
    TONIGHT.map((t) => t.id),
    ["choose", "practice", "celebrate"],
  );
  assert.match(TONIGHT[1].body.en, /5 to 10 minutes/);
});

test("the handout export names EN and ES PDF and Word files in /guides", () => {
  for (const lang of ["en", "es"])
    for (const kind of ["pdf", "docx"])
      assert.match(
        FAMILY_HANDOUT[lang][kind],
        new RegExp(
          `^/access-practice-lab/guides/family-handout${lang === "es" ? "-es" : ""}\\.${kind}$`,
        ),
      );
});

const page = async (prefs, grades = "", band = "6-8") =>
  toHtml((await render({ prefs, route: { view: "practice-together", grades }, band })).html);
const EN = { lang: "en", langChosen: true };
const ES = { lang: "es", langChosen: true };
const BI = { lang: "bi", langChosen: true };
const pressed = (h) => /data-tg-band="([^"]+)" aria-pressed="true"/.exec(h)?.[1];

test("a teacher's ?grades= link opens that grade", async () => {
  assert.equal(pressed(await page(EN, "4-5")), "3-5");
  assert.equal(pressed(await page(EN, "K")), "k-2");
  assert.equal(pressed(await page(EN, "6-8", "3-5")), "6-8");
  assert.match(await page(EN, "4-5"), /class-garden/, "grades 3–5 cards");
  assert.match(
    await page(EN, "2-3"),
    /\/Speaking\/A\/g23-s-a-garden-see\?grades=2-3/,
    "K–2 routine",
  );
  assert.match(await page(EN, "2-3"), /\/early\?grades=2-3/, "K–2 card links the early page");
  assert.equal(pressed(await page(EN, "", "6-8")), "6-8", "no link: the lab's band");
});

test("Mr. Neft welcomes the family, in Spanish on the Spanish page and in English otherwise", async () => {
  const en = await page(EN);
  assert.match(en, /data-pg-page="family"/);
  assert.match(en, /data-pg-lang="en"/);
  assert.match(en, /Welcome! I am Mr. Neft\./);
  for (const id of ["what", "account", "mic", "saved", "sound", "language"])
    assert.match(en, new RegExp(`data-pg-quick="${id}"`), id);
  assert.match(await page(ES), /data-pg-lang="es"/);
  assert.match(await page(BI), /data-pg-lang="en"/);
});

test("one next action, the tonight flow, domain colours and art, and the print link by language", async () => {
  const en = await page(EN);
  assert.equal((en.match(/data-tg-go/g) || []).length, 1);
  assert.match(en, /class="tg-tonight"/);
  assert.match(en, /tg-card is-talk d-speaking/);
  assert.match(en, /tg-card is-write d-writing/);
  assert.match(en, /pictures\/ds\/domain-speaking\.svg/);
  assert.match(en, /pictures\/ds\/domain-writing\.svg/);
  assert.ok(en.includes(FAMILY_HANDOUT.en.pdf) && !en.includes(FAMILY_HANDOUT.es.pdf));
  const es = await page(ES);
  assert.ok(es.includes(FAMILY_HANDOUT.es.pdf) && !es.includes(FAMILY_HANDOUT.en.pdf));
  const bi = await page(BI);
  assert.ok(bi.includes(FAMILY_HANDOUT.en.pdf) && bi.includes(FAMILY_HANDOUT.es.pdf));
});

// ── grades K–2: one picture-talk routine on the page, and the K–2 handout ─────────────────────────────────────────
test("the K–2 routine follows the remembered early pick (K, 1 or 2-3), else Kindergarten", () => {
  assert.equal(earlyPickFrom("1", ""), "1");
  assert.equal(earlyPickFrom("k", ""), "K");
  assert.equal(earlyPickFrom("", "2-3"), "2-3");
  assert.equal(earlyPickFrom("", "6-8"), "K");
  assert.equal(earlyPickFrom("4-5", "1"), "1");
  assert.equal(earlyPickFrom("", ""), "K");
});

test("each early routine is that grade's Speaking activity, three steps, and the model the activity plays", async () => {
  const { readFileSync } = await import("node:fs");
  const files = { K: "gK", 1: "g1", "2-3": "g2-3" };
  for (const pick of ["K", "1", "2-3"]) {
    const r = earlyRoutine(pick);
    assert.equal(r.activity.domain.id, "speaking");
    assert.equal(r.steps.length, 3);
    const content = JSON.parse(
      readFileSync(
        new URL(`../access-practice-lab/content/${files[pick]}/Speaking.json`, import.meta.url),
      ),
    );
    const find = (n) =>
      Array.isArray(n)
        ? n.map(find).find(Boolean)
        : n && typeof n === "object"
          ? n.id === r.activity.id
            ? n
            : Object.values(n).map(find).find(Boolean)
          : null;
    const a = find(content);
    assert.ok(a, `${r.activity.id} is in content`);
    assert.equal(a.modelStudent.name, EARLY_MODELS[pick].label, pick);
    assert.equal(a.modelStudent.text, EARLY_MODELS[pick].text, pick);
    assert.ok(a.modelStudent.name.startsWith(EARLY_MODELS[pick].first));
    assert.ok(r.steps[0].body.en.includes(`Hear ${a.modelStudent.name} answer first`));
  }
});

test("K–2 chosen: the routine card with Start to the real activity, the early page link and the K–2 handout", async () => {
  const en = await page(EN, "1");
  assert.match(en, /tg-card is-early d-speaking/);
  assert.equal((en.match(/class="btn btn-primary tg-start"/g) || []).length, 1);
  assert.match(
    en,
    /href="\/access-practice-lab\/Speaking\/A\/g1-s-a-garden-name\?grades=1&amp;intro=together"/,
  );
  assert.match(en, /Mateo, age 6: “I see the sun\.”/);
  assert.ok(en.includes(FAMILY_HANDOUT_K2.en.pdf) && !en.includes(FAMILY_HANDOUT.en.pdf));
  const es = await page(ES, "K");
  assert.ok(es.includes(FAMILY_HANDOUT_K2.es.pdf) && !es.includes(FAMILY_HANDOUT_K2.en.pdf));
  assert.match(es, /Hablemos de una imagen/);
  assert.ok(!(await page(EN, "6-8")).includes(FAMILY_HANDOUT_K2.en.pdf));
});

test("Hear the steps: one hidden button per card (shown on mount when speech exists), read in the screen's language", async () => {
  for (const [grades, n] of [
    ["6-8", 2],
    ["4-5", 2],
    ["K", 1],
  ]) {
    const h = await page(EN, grades);
    assert.equal((h.match(/data-tg-read="/g) || []).length, n, grades);
    assert.equal((h.match(/data-tg-read-box="[^"]+" hidden/g) || []).length, n, `${grades} hidden`);
  }
  assert.match(await page(ES), /Escuchar los pasos/);
  assert.equal(readLang("en", "es-MX"), "en");
  assert.equal(readLang("es", "en-US"), "es");
  assert.equal(readLang("bi", "es-US"), "es");
  assert.equal(readLang("bi", "en-US"), "en");
  const lines = stepLines(FAMILY_ACTIVITIES[0].steps, "es");
  assert.equal(lines.length, 3);
  assert.match(lines[0], /^Miren el ejemplo\. Miren la imagen/);
});
