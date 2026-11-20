// The family home "Today" panel reads the two practice apps' own saved records. These tests pin the three ways
// that goes wrong silently: counting work that was not real practice, counting the wrong week, and the language
// seed overwriting a choice a learner already made inside an app.
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { test } from "node:test";
import vm from "node:vm";
import {
  ACCESS_PREFIX,
  englishSummary,
  FLUENCY_TUTOR_KEY,
  fluencySummary,
  suggestNext,
  weekStart,
} from "../family-app/progress.js";

const root = new URL("../", import.meta.url);
const read = (p) => readFileSync(new URL(p, root), "utf8");

// Wednesday 2026-10-28 12:00 local. The week starts Monday 2026-10-26.
const NOW = new Date(2026, 9, 28, 12);
const at = (month, day, hour = 9) => new Date(2026, month - 1, day, hour).getTime();

const fakeStore = (entries) => ({
  get: (k) => (k in entries ? entries[k] : null),
  keys: () => Object.keys(entries),
});

test("weekStart is the Monday before (or on) the date, local time", () => {
  assert.equal(weekStart(NOW), new Date(2026, 9, 26).getTime());
  assert.equal(
    weekStart(new Date(2026, 9, 25, 23, 59)),
    new Date(2026, 9, 19).getTime(),
    "Sunday belongs to the week before",
  );
  assert.equal(weekStart(new Date(2026, 9, 26, 0, 1)), new Date(2026, 9, 26).getTime());
});

test("fluency: counts this week's sessions only, with 'right without help' from the independent count", () => {
  const sessions = [
    { at: at(10, 20), answered: 40, correct: 30 }, // last week
    { at: at(10, 26), answered: 12, correct: 9 },
    { at: at(10, 26, 15), answered: 8, correct: 5 }, // same day: one practice day
    { at: at(10, 28), answered: 10, correct: 10 },
  ];
  const s = fluencySummary(fakeStore({ [FLUENCY_TUTOR_KEY]: JSON.stringify({ sessions }) }), NOW);
  assert.equal(s.daysThisWeek, 2);
  assert.equal(s.answeredThisWeek, 30);
  assert.equal(s.withoutHelpThisWeek, 24);
  assert.equal(s.lastAt, at(10, 28));
});

test("fluency: empty, corrupt or malformed storage reads as 'nothing yet', never throws", () => {
  for (const raw of [
    null,
    "",
    "not json",
    "{}",
    '{"sessions":"x"}',
    '{"sessions":[null,{"at":"yesterday"}]}',
  ]) {
    const s = fluencySummary(fakeStore(raw === null ? {} : { [FLUENCY_TUTOR_KEY]: raw }), NOW);
    assert.deepEqual([s.daysThisWeek, s.answeredThisWeek, s.lastAt], [0, 0, null], String(raw));
  }
});

const level = (results) => JSON.stringify({ results });
const real = (day) => ({
  date: new Date(2026, 9, day, 10).toISOString(),
  words: 20,
  meaningful: true,
});

test("english: counts real practice, not blank or unpracticed results", () => {
  const store = fakeStore({
    [`${ACCESS_PREFIX}Writing:A`]: level({
      a: real(27),
      b: real(28),
      blank: { ...real(28), words: 0 },
      draft: { ...real(28), meaningful: false },
      skipped: { ...real(28), practiced: false },
      old: real(19),
    }),
  });
  const s = englishSummary(store, NOW);
  assert.equal(s.activitiesThisWeek, 2);
  assert.equal(s.daysThisWeek, 2);
});

test("english: grade 3-5 records count; settings and side stores do not", () => {
  const noise = level({ x: real(28) });
  const store = fakeStore({
    [`${ACCESS_PREFIX}g3-5:Reading:B`]: level({ a: real(28) }),
    [`${ACCESS_PREFIX}prefs`]: noise,
    [`${ACCESS_PREFIX}studentName`]: noise,
    [`${ACCESS_PREFIX}ledger:x`]: noise,
    [`${ACCESS_PREFIX}studio:Speaking`]: noise,
    "somethingElse:Writing:A": noise,
  });
  assert.equal(englishSummary(store, NOW).activitiesThisWeek, 1);
});

test("english: a practice test with real answers counts once; an untouched one does not", () => {
  const worked = JSON.stringify({
    results: { date: new Date(2026, 9, 28, 9).toISOString(), sections: [{ correct: 3 }] },
  });
  const untouched = JSON.stringify({
    results: {
      date: new Date(2026, 9, 28, 9).toISOString(),
      sections: [{ openDone: 0, attempted: 0, correct: 0 }],
    },
  });
  assert.equal(
    englishSummary(fakeStore({ [`${ACCESS_PREFIX}test:t1`]: worked }), NOW).daysThisWeek,
    1,
  );
  assert.equal(
    englishSummary(fakeStore({ [`${ACCESS_PREFIX}test:t2`]: untouched }), NOW).daysThisWeek,
    0,
  );
});

test("suggestNext: fewer days this week wins, then the longer wait, then math", () => {
  const a = (daysThisWeek, lastAt) => ({ daysThisWeek, lastAt });
  assert.equal(suggestNext(a(3, 5), a(1, 9)), "english");
  assert.equal(suggestNext(a(1, 5), a(3, 9)), "math");
  assert.equal(suggestNext(a(2, 9), a(2, 5)), "english");
  assert.equal(suggestNext(a(2, 5), a(2, 9)), "math");
  assert.equal(suggestNext(a(0, null), a(0, null)), "math");
});

test("progress.js reports counts only: no score, level or proficiency field", () => {
  const keys = [
    ...Object.keys(fluencySummary(fakeStore({}), NOW)),
    ...Object.keys(englishSummary(fakeStore({}), NOW)),
  ];
  for (const k of keys) assert.doesNotMatch(k, /score|level|percent|proficien|band|accuracy/i, k);
});

// --- language seed (family-app/home-link.js, runs in all three practice areas) ---
function runSeed(initial) {
  const data = { ...initial };
  const localStorage = {
    getItem: (k) => (k in data ? data[k] : null),
    setItem: (k, v) => {
      data[k] = String(v);
    },
  };
  const window = { matchMedia: () => ({ matches: false }), localStorage };
  vm.runInNewContext(read("family-app/home-link.js"), {
    window,
    localStorage,
    navigator: {},
    location: { pathname: "/math/fluency-lab/" },
    document: {},
  });
  return data;
}

test("seed: Español on the family home becomes Spanish in an app that has no setting yet", () => {
  const d = runSeed({ "ewl-family-lang": "es" });
  assert.equal(d["ewl-fluency-lang-v1"], '"es"');
  assert.deepEqual(JSON.parse(d["accessPracticeLab:v1:prefs"]), { lang: "es" });
});

test("seed: never overwrites a choice already made inside an app", () => {
  const d = runSeed({
    "ewl-family-lang": "es",
    "ewl-fluency-lang-v1": '"en"',
    "accessPracticeLab:v1:prefs": JSON.stringify({ lang: "en", band: "6-8" }),
  });
  assert.equal(d["ewl-fluency-lang-v1"], '"en"');
  assert.deepEqual(JSON.parse(d["accessPracticeLab:v1:prefs"]), { lang: "en", band: "6-8" });
});

test("seed: writes nothing when the family home was never visited or holds junk", () => {
  assert.deepEqual(runSeed({}), {});
  assert.deepEqual(runSeed({ "ewl-family-lang": "fr" }), { "ewl-family-lang": "fr" });
});

// --- Family-home button (family-app/home-link.js): old shell unchanged, Language Page app returns to the lab home ---
function runButton({
  host,
  native = true,
  path = "/access-practice-lab/Listening/A",
  prefs,
  family,
  navLang = "en-US",
}) {
  const data = {};
  if (prefs) data["accessPracticeLab:v1:prefs"] = JSON.stringify(prefs);
  if (family) data["ewl-family-lang"] = family;
  const localStorage = {
    getItem: (k) => (k in data ? data[k] : null),
    setItem: (k, v) => {
      data[k] = String(v);
    },
  };
  const attrs = {};
  const link = {
    style: {},
    hidden: false,
    setAttribute: (k, v) => {
      attrs[k] = v;
    },
  };
  const location = { pathname: path, hostname: host };
  const history = {
    pushState(_s, _t, url) {
      location.pathname = url;
    },
    replaceState() {},
  };
  const timers = [];
  let appended = null;
  vm.runInNewContext(read("family-app/home-link.js"), {
    window: {
      Capacitor: native ? { isNativePlatform: () => true } : undefined,
      matchMedia: () => ({ matches: false }),
      addEventListener() {},
      localStorage,
    },
    localStorage,
    navigator: { language: navLang },
    location,
    history,
    setTimeout: (fn) => timers.push(fn),
    document: {
      createElement: () => link,
      body: { appendChild: (el) => (appended = el) },
      addEventListener() {},
    },
  });
  const flush = () => timers.splice(0).forEach((fn) => fn());
  return { link, attrs, appended: () => appended, history, location, flush };
}

test("home button: old shell host keeps the family-home link and labels", () => {
  const r = runButton({ host: "eduwonderlab.com", path: "/access-practice-lab/" });
  assert.equal(r.link.href, "/family-app/");
  assert.equal(r.link.textContent, "\u2302 Family home");
  assert.equal(r.attrs["aria-label"], "Back to the family app home");
  assert.equal(r.link.style.display, undefined, "never hidden on the old host");
  const es = runButton({ host: "eduwonderlab.com", family: "es" });
  assert.equal(es.link.textContent, "\u2302 Inicio");
  assert.equal(es.attrs["aria-label"], "Volver al inicio de la app familiar");
});

test("home button: thelanguagepage.com app goes to the lab home, bilingual, hidden on the lab home", () => {
  const r = runButton({ host: "thelanguagepage.com" });
  assert.equal(r.link.href, "/access-practice-lab/");
  assert.equal(r.link.textContent, "\u2302 Home");
  assert.equal(r.attrs["aria-label"], "Back to The Language Page home");
  assert.equal(r.appended(), r.link);
  const es = runButton({ host: "thelanguagepage.com", prefs: { lang: "es" } });
  assert.equal(es.link.textContent, "\u2302 Inicio");
  assert.equal(es.attrs["aria-label"], "Volver al inicio de The Language Page");
  const home = runButton({ host: "thelanguagepage.com", path: "/access-practice-lab/" });
  assert.equal(home.link.hidden, true, "nowhere to go back to on the lab home");
  assert.equal(home.link.style.display, "none");
  // single-page route changes: leaving the home shows the button, coming back hides it
  home.history.pushState({}, "", "/access-practice-lab/Reading/A");
  home.flush();
  assert.equal(home.link.hidden, false);
  assert.equal(home.link.style.display, "inline-flex");
  home.history.pushState({}, "", "/access-practice-lab/");
  home.flush();
  assert.equal(home.link.hidden, true);
});

test("home button: in the Language Page app the label follows the LAB language, not the phone or the family home", () => {
  const phoneEs = runButton({ host: "thelanguagepage.com", navLang: "es-US" });
  assert.equal(
    phoneEs.link.textContent,
    "\u2302 Home",
    "lab has no language set: English, whatever the phone says",
  );
  const bi = runButton({ host: "thelanguagepage.com", prefs: { lang: "bi" }, navLang: "es-US" });
  assert.equal(bi.link.textContent, "\u2302 Home", "EN+ES reads English");
  const labEs = runButton({ host: "thelanguagepage.com", prefs: { lang: "es" }, navLang: "en-US" });
  assert.equal(labEs.link.textContent, "\u2302 Inicio");
  const www = runButton({ host: "www.thelanguagepage.com" });
  assert.equal(www.link.href, "/access-practice-lab/");
  // the old host still reads the family language and the phone
  assert.equal(
    runButton({ host: "eduwonderlab.com", navLang: "es-US" }).link.textContent,
    "\u2302 Inicio",
  );
});

test("home button: the same host in a plain browser tab shows nothing (not an installed app)", () => {
  assert.equal(runButton({ host: "thelanguagepage.com", native: false }).appended(), null);
});

test("seed writes the exact values the apps read back", () => {
  // Fluency reads JSON.parse(localStorage[KEY]) === "es"; ACCESS merges the stored object over its defaults.
  const fluency = read("math/fluency-lab/lang-state.js");
  assert.match(fluency, /const KEY = "ewl-fluency-lang-v1"/);
  assert.match(fluency, /readLocal\(KEY, "en"\) === "es"/);
  assert.match(read("access-practice-lab/src/store.js"), /const PREFS_KEY = `\$\{PREFIX\}:prefs`/);
  assert.match(
    read("access-practice-lab/src/store.js"),
    /export const PREFIX = "accessPracticeLab:v1"/,
  );
  assert.match(read("math/fluency-lab/app.js"), /const TUTOR_KEY = "ewl-fluency-tutor-v2"/);
});

// --- wiring ---
test("home page loads the Today module and its worker precaches the files", () => {
  assert.match(
    read("family-app/index.html"),
    /<script type="module" src="\/family-app\/today\.js">/,
  );
  assert.match(read("family-app/index.html"), /id="today"/);
  const sw = read("family-app/sw.js");
  for (const f of ["progress.js", "today.js"]) {
    assert.ok(sw.includes(`"/family-app/${f}"`), `${f} precached`);
    assert.ok(existsSync(new URL(`family-app/${f}`, root)), `${f} exists`);
  }
  assert.match(sw, /const CACHE = "ewl-family-v2"/, "cache bumped when the precache list changed");
});
