/* Nightly Hebrew — structural + wiring guards.
 *
 * The lesson pages are static HTML under focus-school/hebrew/ and the money
 * path crosses a process boundary (a static page writes a localStorage outbox;
 * app.js drains it into the allowance ledger). Nothing else in the suite would
 * notice if either half of that contract drifted, so it is pinned here.
 */
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import test from "node:test";
import { createContext, runInContext } from "node:vm";

const read = (p) => readFileSync(p, "utf8");
const app = read("focus-school/app.js");
const sw = read("focus-school/sw.js");
const engine = read("focus-school/hebrew/engine.js");

const UNITS = 9;
const ACTS = ["warmup", "letters", "rules", "blender", "batting", "game", "closer"];

// --- the pages exist and are wired to their own game ------------------------
test("nine inning pages, each loading its own game module", () => {
  assert.ok(existsSync("focus-school/hebrew/index.html"), "hub page exists");
  for (let i = 1; i <= UNITS; i++) {
    const page = `focus-school/hebrew/unit-${i}.html`;
    assert.ok(existsSync(page), `${page} exists`);
    assert.ok(existsSync(`focus-school/hebrew/games/unit-${i}.js`), `game ${i} exists`);
    const html = read(page);
    assert.match(html, new RegExp(`data-unit="${i}"`), `unit-${i}.html declares its unit`);
    assert.match(html, new RegExp(`games/unit-${i}\\.js`), `unit-${i}.html loads game ${i}`);
    assert.match(html, /src="data\.js"/, `unit-${i}.html loads the curriculum`);
    assert.match(html, /src="engine\.js"/, `unit-${i}.html loads the engine`);
    assert.match(html, /id="payout"/, `unit-${i}.html has the payout slot`);
  }
});

// --- the curriculum is internally consistent -------------------------------
test("curriculum data: every unit's pools are built from real letters/vowels", () => {
  const sandbox = { window: {} };
  createContext(sandbox);
  runInContext(read("focus-school/hebrew/data.js"), sandbox);
  const { LETTERS, VOWELS, UNITS: units, FINALS } = sandbox.window.HEB_DATA;
  assert.equal(units.length, UNITS, "nine innings");

  const seenLetters = new Set();
  const seenVowels = new Set();
  for (const u of units) {
    assert.ok(u.bigIdea && u.rules.length, `unit ${u.id} teaches something`);
    assert.ok(u.words.length >= 3, `unit ${u.id} has real words`);
    for (const ch of u.newLetters) {
      assert.ok(LETTERS[ch], `unit ${u.id}: letter ${ch} is defined`);
      assert.ok(!seenLetters.has(ch), `unit ${u.id}: letter ${ch} introduced once`);
      seenLetters.add(ch);
    }
    for (const k of u.newVowels) {
      assert.ok(VOWELS[k], `unit ${u.id}: vowel ${k} is defined`);
      seenVowels.add(k);
    }
    // Review is the whole point: every unit past the first must be able to
    // draw on earlier material, and no unit may drill a final form (they only
    // ever end words, so a "final + vowel" syllable would teach a lie).
    assert.ok(u.letterPool.length > 0, `unit ${u.id} has a letter pool`);
    assert.ok(u.vowelPool.length > 0, `unit ${u.id} has a vowel pool`);
    for (const ch of u.letterPool) assert.ok(!FINALS.has(ch), `pool excludes final ${ch}`);
    if (u.id > 1) assert.ok(u.prevLetters.length > 0, `unit ${u.id} reviews earlier letters`);
  }
  // Every word must be spellable from letters taught by that inning.
  const strip = (s) => [...s].filter((c) => c >= "א" && c <= "ת");
  for (const u of units) {
    const allowed = new Set(u.allLetters.map((ch) => ch[0]));
    for (const w of u.words) {
      for (const ch of strip(w.heb)) {
        assert.ok(allowed.has(ch), `unit ${u.id}: "${w.heb}" uses ${ch} before it is taught`);
      }
    }
  }
});

// --- the engine's contract with the app ------------------------------------
test("engine writes the outbox the app drains, with a deterministic id", () => {
  assert.match(engine, /focus-school:hebrew-earnings/, "engine names the outbox key");
  assert.match(app, /focus-school:hebrew-earnings/, "app names the same outbox key");
  assert.match(engine, /heb-u\$\{unit\.id\}-\$\{dayKey\}/, "engine id is unit + calendar day");
  assert.match(app, /"e_" \+ String\(entry\.id\)/, "app prefixes the ledger id from the claim id");
  assert.match(
    app,
    /if \(r\.ledger\.some\(\(e\) => e\.id === id\)\) continue;/,
    "app skips a claim already in the ledger — draining twice cannot double-pay",
  );
  // All seven activities must be required before the payout unlocks.
  const ids = ACTS.map((a) => `"${a}"`).join(", ");
  assert.ok(engine.includes(`const ACT_IDS = [${ids}];`), "seven activities gate the payout");
  assert.match(engine, /n === ACT_IDS\.length/, "payout unlocks only at 7/7");
});

test("app pays the Hebrew rate and reports it on the paystub", () => {
  assert.match(app, /hebrew: 0\.2,/, "seeded at $0.20 an inning");
  assert.match(
    app,
    /hebrew: Math\.max\(0, num\(rates\.hebrew, base\.rates\.hebrew\)\)/,
    "rate survives sync/import normalisation",
  );
  assert.match(app, /r\.rates\.hebrew = num\("rw_hebrew"\)/, "a parent can change the rate");
  const stubKinds = app.match(/\["task", "routine", "focus", "reminder", "health", "hebrew"\]/g);
  assert.equal(stubKinds?.length, 2, "both paystubs list the hebrew category");
  assert.equal(
    (app.match(/hebrew: "(⚾ )?Nightly Hebrew"/g) || []).length,
    2,
    "both paystubs label the hebrew category",
  );
});

test("the Now-screen card exists, is registered, and links to the lessons", () => {
  assert.match(app, /\["hebrew", "Nightly Hebrew"\]/, "registered in CARDS");
  assert.match(app, /hebrew: hebrewCard\(\)/, "rendered on the Now screen");
  assert.match(app, /href="\/hebrew\/"/, "links to the lesson hub");
  // It must sit next to the routine card for BOTH a fresh install (seed order)
  // and an established account (the migration) — normalize() returns the seed
  // untouched when there is no stored state, so the migration never sees it.
  const cards = app.slice(app.indexOf("const CARDS = ["), app.indexOf("const STEP_TEMPLATES"));
  assert.ok(
    cards.indexOf('"hebrew"') < cards.indexOf('"glance"'),
    "seed order puts Nightly Hebrew second, right under the routine card",
  );
  assert.match(app, /if \(!s\.hebrewCardMigrated\)/, "existing accounts get a one-time placement");
});

test("app drains the outbox on open, on refocus, and cross-tab", () => {
  assert.match(app, /drainHebrewEarnings\(\);\n/, "drains on boot");
  assert.match(app, /document\.visibilityState === "visible" && drainHebrewEarnings\(\)/, "on show");
  assert.match(app, /e\.key === HEBREW_EARN_KEY && drainHebrewEarnings\(\)/, "cross-tab");
  assert.match(app, /localStorage\.setItem\(HEBREW_EARN_KEY, "\[\]"\)/, "outbox is cleared");
});

// --- offline ---------------------------------------------------------------
test("service worker precaches every Hebrew page and serves it back offline", () => {
  for (let i = 1; i <= UNITS; i++) {
    assert.ok(sw.includes(`"hebrew/unit-${i}.html"`), `sw precaches unit-${i}.html`);
    assert.ok(sw.includes(`"hebrew/games/unit-${i}.js"`), `sw precaches game ${i}`);
  }
  for (const f of ["hebrew/", "hebrew/hebrew.css", "hebrew/data.js", "hebrew/engine.js"]) {
    assert.ok(sw.includes(`"${f}"`), `sw precaches ${f}`);
  }
  // Without this, an offline navigation to /hebrew/unit-3.html would fall all
  // the way back to the planner shell instead of opening the lesson.
  assert.match(
    sw,
    /caches\s*\n?\s*\.match\(req, \{ ignoreSearch: true \}\)/,
    "offline navigations prefer the exact cached page",
  );
});

// --- games behave like games -----------------------------------------------
test("every game registers itself and is winnable, calmly", () => {
  // Comments legitimately SAY "no countdown" — strip them so the ban checks
  // code, not prose. (Naive strip: good enough for a same-repo source scan.)
  const stripComments = (s) => s.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
  for (let i = 1; i <= UNITS; i++) {
    const raw = read(`focus-school/hebrew/games/unit-${i}.js`);
    const src = stripComments(raw);
    assert.match(src, /HEB\.registerGame\(/, `game ${i} registers`);
    assert.match(src, /api\.win\(/, `game ${i} can be won (which unlocks the payout)`);
    // No clocks and no twitch: these games are read-think-then-act by design.
    // (A one-shot setTimeout for a reveal/flip delay is fine; a repeating tick
    // or an animation loop is not — that is what a "fast game" is made of.)
    assert.doesNotMatch(src, /setInterval|requestAnimationFrame/, `game ${i} has no clock loop`);
    assert.doesNotMatch(src, /\bcountdown\b|\btimeLeft\b|\bsecondsLeft\b/i, `game ${i} has no timer`);
    // HTML5 drag is unreliable on the tablet this is actually used on.
    assert.doesNotMatch(src, /draggable=|ondragstart|"dragstart"/, `game ${i} uses tap, not drag`);
    // Games are self-contained play spaces — no escape hatches mid-activity.
    assert.doesNotMatch(src, /<a\s+[^>]*href=/, `game ${i} has no links out`);
  }
});
