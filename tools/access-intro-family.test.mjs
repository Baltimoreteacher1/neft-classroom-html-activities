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
import { familyPlan, render } from "../access-practice-lab/src/intro/family.js";
import {
  FAMILY,
  FAMILY_ACTIVITIES,
  FAMILY_HANDOUT,
  familyBandFromGrades,
  HANDOUT_COPY,
  practiceAtHome,
  TONIGHT,
} from "../access-practice-lab/src/intro/family-data.js";
import {
  EARLY_MODELS,
  earlyPickFrom,
  earlyRoutine,
  FAMILY_HANDOUT_K2,
  HANDOUT_K2_COPY,
} from "../access-practice-lab/src/intro/family-k2-data.js";
import {
  COACH_COPY,
  FAMILY_HELP,
  FAMILY_SAY,
  PAGE,
  STEPS,
  pickLang,
  resolveLang,
} from "../access-practice-lab/src/intro/family-guide-data.js";
import { loopSteps } from "../access-practice-lab/src/coach/activity-steps.js";
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
  practiceAtHome,
  TONIGHT,
  HANDOUT_COPY,
  HANDOUT_K2_COPY,
  PAGE,
  STEPS,
  COACH_COPY,
  FAMILY_SAY,
  FAMILY_HELP,
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
    TONIGHT,
    HANDOUT_COPY,
    { ...PAGE, machine: null },
    FAMILY_SAY,
    COACH_COPY,
    FAMILY_HELP,
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

const page = async (prefs, grades = "", band = "6-8", step = "") =>
  toHtml((await render({ prefs, route: { view: "practice-together", grades, step }, band })).html);
const EN = { lang: "en", langChosen: true };
const ES = { lang: "es", langChosen: true };
const BI = { lang: "bi", langChosen: true };
const pressed = (h) => /data-ft-band="([^"]+)"\s+aria-pressed="true"/.exec(h)?.[1];

test("a teacher's ?grades= link opens that grade", async () => {
  assert.equal(pressed(await page(EN, "4-5")), "3-5");
  assert.equal(pressed(await page(EN, "K")), "k-2");
  assert.equal(pressed(await page(EN, "6-8", "3-5")), "6-8");
  assert.equal(pressed(await page(EN, "", "6-8")), "6-8", "no link: the lab's band");
});

test("step 1: one primary action, three steps across the top, the reassurance and the handout by language", async () => {
  const en = await page(EN);
  assert.equal((en.match(/btn-primary/g) || []).length, 1, "one primary action");
  assert.match(en, /Let’s practice English together\./);
  assert.match(en, /You do not need to speak English well to help\./);
  assert.match(en, /href="\/access-practice-lab\/practice-together\?step=2&amp;grades=6-8"/);
  assert.equal((en.match(/aria-current="step"/g) || []).length, 1);
  assert.ok(en.includes(FAMILY_HANDOUT.en.pdf) && !en.includes(FAMILY_HANDOUT.es.pdf));
  const es = await page(ES);
  assert.match(es, /Practiquemos inglés juntos\./);
  assert.ok(es.includes(FAMILY_HANDOUT.es.pdf) && !es.includes(FAMILY_HANDOUT.en.pdf));
  const bi = await page(BI);
  assert.ok(bi.includes(FAMILY_HANDOUT.en.pdf) && bi.includes(FAMILY_HANDOUT.es.pdf));
  assert.ok((await page(EN, "1")).includes(FAMILY_HANDOUT_K2.en.pdf), "K–2 handout");
});

test("student practice stays one tap away from step 1, with the return hint", async () => {
  assert.match(await page(EN), /href="\/access-practice-lab\/voice\/ladder\/school-hallway\?grades=6-8&amp;intro=together"/);
});

test("step 2: a stage for the live activity, with Back and a way past it", async () => {
  const h = await page(EN, "6-8", "6-8", "2");
  assert.match(h, /data-gt-stage/);
  assert.match(h, /data-src="\/access-practice-lab\/Reading\/A\/read-main-idea\?grades=6-8&amp;frame=1"/);
  assert.match(h, /data-coach-slot/);
  assert.match(h, /step=1&amp;grades=6-8/);
  assert.match(h, /step=3&amp;grades=6-8/);
  const k = await page(EN, "K", "6-8", "2");
  assert.match(k, /\/Listening\/A\/gk-l-a-find-seed\?grades=K&amp;frame=1/);
});

test("step 3: one primary action, the next real activity, how to keep going, device and saving answers", async () => {
  const h = await page(EN, "4-5", "6-8", "3");
  assert.equal((h.match(/btn-primary/g) || []).length, 1);
  assert.match(h, /href="\/access-practice-lab\/voice\/ladder\/class-garden\?grades=4-5&amp;intro=together"/);
  assert.match(h, /Start practicing/);
  assert.match(h, /More than one child uses this device/);
  assert.match(h, /Where is our work saved\?/);
  const k = await page(ES, "2-3", "6-8", "3");
  assert.match(k, /\/Speaking\/A\/g23-s-a-garden-see\?grades=2-3/);
  assert.match(k, /Empezar a practicar/);
});

test("familyPlan: every grade practices a checkable activity and moves on to speaking", () => {
  for (const [band, pick] of [["k-2", "K"], ["k-2", "1"], ["k-2", "2-3"], ["3-5"], ["6-8"]]) {
    const p = familyPlan(band, pick);
    assert.ok(p.practice.route.startsWith("/Listening/") || p.practice.route.startsWith("/Reading/"), band);
    assert.ok(p.next.route && p.next.name && p.next.description && p.next.steps.length === 3, band);
    assert.ok(p.more.length >= 1, band);
  }
});

test("the family guide speaks to the adult in either language and every step has words", () => {
  for (const lang of ["en", "es"]) {
    const steps = loopSteps(resolveLang(FAMILY_SAY, lang));
    for (const st of steps) {
      const title = typeof st.title === "function" ? st.title(null) : st.title;
      const body = typeof st.body === "function" ? st.body(null) : st.body;
      assert.ok(title && body, `${lang}:${st.id}`);
    }
    assert.ok(steps.at(-1).primary, "the last step names its button");
    assert.ok(steps.some((s) => s.id === "spanish"));
  }
  assert.equal(pickLang({ en: "Hi" }, "ar"), "Hi", "a language with no entry falls back to English");
});

test("the guide never quotes a button's words (they change with the page language)", () => {
  for (const id of ["skill", "directions", "check", "retry", "helpChild", "spanish", "words"])
    for (const lang of ["en", "es"]) {
      const body = FAMILY_SAY[id].body[lang];
      assert.ok(!/[“«]/.test(body), `${id}.${lang} quotes a control: ${body}`);
    }
});
