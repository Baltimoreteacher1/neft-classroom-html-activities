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
// The twelve activities that gate the $0.20, in the order the shell renders
// them. Extra Innings (BONUS) are real practice but must never hold up pay.
const ACTS = [
  "warmup",
  "letters",
  "lookalike",
  "rules",
  "vowelradar",
  "blender",
  "batting",
  "workshop",
  "game",
  "sentences",
  "closer",
  "final",
];
const BONUS = ["rollcall", "reverse", "ladder", "minimal", "builder", "meaning", "spot"];
const MODULES = ["warmup", "letters", "vowels", "blend", "fluency", "words", "read", "prove"];

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
    assert.match(html, /src="data\.js"/, `unit-${i}.html loads the alphabet`);
    assert.match(html, /src="units\.js"/, `unit-${i}.html loads the curriculum`);
    assert.match(html, /src="engine\.js"/, `unit-${i}.html loads the engine`);
    assert.match(html, /id="payout"/, `unit-${i}.html has the payout slot`);
    // Every activity module must be on every page: the shell only renders an
    // activity that registered itself, so a missing <script> silently drops a
    // required activity and the payout could never unlock.
    for (const m of MODULES) {
      assert.ok(
        html.includes(`activities/${m}.js`),
        `unit-${i}.html loads activities/${m}.js`,
      );
    }
    // Load order is load-bearing: data → units → engine → activities → game.
    const order = [
      html.indexOf('src="data.js"'),
      html.indexOf('src="units.js"'),
      html.indexOf('src="engine.js"'),
      html.indexOf('activities/warmup.js'),
      html.indexOf(`games/unit-${i}.js`),
      html.indexOf("HEB.boot()"),
    ];
    assert.deepEqual(
      order.slice().sort((a, b) => a - b),
      order,
      `unit-${i}.html loads its scripts in dependency order`,
    );
  }
});

// --- every activity the shell asks for actually exists ----------------------
test("every required and bonus activity is registered by a module", () => {
  const src = MODULES.map((m) => read(`focus-school/hebrew/activities/${m}.js`)).join("\n");
  for (const id of [...ACTS, ...BONUS]) {
    if (id === "game") continue; // the shell registers this one itself
    assert.match(
      src,
      new RegExp(`id: "${id}"`),
      `activity "${id}" is registered — the shell lists it in PLAN`,
    );
  }
  assert.match(engine, /id: "game"/, "the shell owns the game hand-off");
  // Each id appears exactly once across all modules: two registrations of the
  // same id would silently replace each other in the registry Map.
  for (const id of [...ACTS, ...BONUS]) {
    const hits = (src.match(new RegExp(`id: "${id}"`, "g")) || []).length;
    if (id === "game") continue;
    assert.equal(hits, 1, `activity "${id}" is registered exactly once`);
  }
});

// --- the curriculum is internally consistent -------------------------------
test("curriculum data: every unit's pools are built from real letters/vowels", () => {
  const sandbox = { window: {} };
  createContext(sandbox);
  runInContext(read("focus-school/hebrew/data.js"), sandbox);
  runInContext(read("focus-school/hebrew/units.js"), sandbox);
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
  // Every word, sentence and closer line must be spellable from letters AND
  // markable with vowels already taught by that inning. A word the reader
  // cannot decode is not practice, it is a wall.
  const strip = (s) => [...s].filter((c) => c >= "א" && c <= "ת");
  const marks = (s) => [...s].filter((c) => c >= "\u05B0" && c <= "\u05BB");
  const markToVowel = {};
  for (const [k, v] of Object.entries(VOWELS)) if (v.ch.length === 1) markToVowel[v.ch] = k;
  for (const u of units) {
    const allowed = new Set(u.allLetters.map((ch) => ch[0]));
    const vAllowed = new Set(u.vowelPool);
    for (const w of [...u.words, ...u.sentences, ...u.closer]) {
      for (const ch of strip(w.heb)) {
        assert.ok(allowed.has(ch), `unit ${u.id}: "${w.heb}" uses ${ch} before it is taught`);
      }
      for (const m of marks(w.heb)) {
        const key = markToVowel[m];
        assert.ok(key, `unit ${u.id}: "${w.heb}" carries an unknown mark`);
        // The malei forms are the same vowel wearing a mater letter, so a
        // plain chirik counts as taught once chirik-malei is.
        const ok =
          vAllowed.has(key) ||
          (key === "chirik" && vAllowed.has("chirikMalei")) ||
          (key === "tzere" && vAllowed.has("tzereYud"));
        assert.ok(ok, `unit ${u.id}: "${w.heb}" uses vowel ${key} before it is taught`);
      }
    }
    // Depth: the whole point of this build-out. A thin inning is a regression.
    assert.ok(u.words.length >= 9, `unit ${u.id} has at least nine words`);
    assert.ok(u.rules.length >= 4, `unit ${u.id} has at least four rules`);
    assert.ok(u.why, `unit ${u.id} says why tonight matters`);
    if (u.id > 1) assert.ok(u.sentences.length >= 4, `unit ${u.id} has connected reading`);
  }
});

// --- the word splitter, which every word activity is built on --------------
test("word pieces decode the way the page teaches them to", () => {
  const sandbox = { window: {}, console };
  sandbox.window.window = sandbox.window;
  createContext(sandbox);
  for (const f of ["data.js", "units.js", "engine.js"]) {
    runInContext(read(`focus-school/hebrew/${f}`), sandbox);
  }
  const { pieces } = sandbox.window.HEB;
  const tr = (w) =>
    pieces(w)
      .filter((p) => !p.sep)
      .map((p) => p.tr)
      .join("-");

  // A mater is part of the sound before it, never a consonant of its own.
  assert.equal(tr("תּוֹרָה"), "toh-rah-(silent)", "cholam-malei rides the letter before it");
  assert.equal(tr("בָּרוּךְ"), "bah-roo-ch", "shuruk rides the letter before it");
  assert.equal(tr("מִי"), "mee", "chirik + yud is still just ee");
  // A bare yud on an ah is a diphthong, not a second beat.
  assert.equal(tr("חַי"), "chai", "patach + bare yud is 'ai'");
  // ...unless the yud has a vav of its own coming, in which case it is a real
  // consonant. This is the case that made the naive rule wrong.
  assert.equal(tr("הַיוֹם"), "hah-yoh-m", "a yud with its own vav is a consonant");
  // The sneaky patach says the ah BEFORE the letter.
  assert.equal(tr("שָׂמֵחַ"), "sah-may-ach", "final chet + patach is 'ach'");
  // A vav that already has a full sound in front of it is a plain v.
  assert.equal(tr("וָו"), "vah-v", "a closed sound before a bare vav keeps the v");

  // And nothing in the curriculum may fail to split at all.
  for (const u of sandbox.window.HEB_DATA.UNITS) {
    for (const w of u.words) {
      const ps = pieces(w.heb).filter((p) => !p.sep);
      assert.ok(ps.length > 0, `unit ${u.id}: "${w.heb}" splits into pieces`);
      assert.ok(
        ps.every((p) => p.tr !== ""),
        `unit ${u.id}: every piece of "${w.heb}" has a readable sound`,
      );
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
  // Every main activity must be required before the payout unlocks, and the
  // bonus ones must NOT be — a nineteen-activity page that withheld pay until
  // all nineteen were cleared would be a trap on a school night.
  const beforeBonus = engine.split("const BONUS_IDS")[0];
  const afterBonus = (engine.split("const BONUS_IDS")[1] || "").split("\n")[0];
  for (const id of ACTS) {
    assert.ok(new RegExp(`^\\s*"${id}",$`, "m").test(beforeBonus), `"${id}" is in ACT_IDS`);
  }
  assert.match(engine, /const BONUS_IDS = \[/, "bonus activities are listed separately");
  for (const id of BONUS) {
    assert.ok(afterBonus.includes(`"${id}"`), `"${id}" is a bonus activity, not a payout gate`);
    assert.ok(!new RegExp(`^\\s*"${id}",$`, "m").test(beforeBonus), `"${id}" is not in ACT_IDS`);
  }
  assert.match(engine, /req === ACT_IDS\.length/, "payout unlocks at the full required set");
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

test("Nightly Hebrew is its own nav button, pinned and pointed at the lessons", () => {
  assert.match(app, /\["hebrew", "Hebrew", "📖"\]/, "registered as a tab");
  // Pinned, not usage-ranked: a brand-new tab ranks last and would land under
  // "More", which is the one place a nightly-habit button cannot live.
  assert.match(app, /const PINNED = \["home", "homework", "hebrew"\]/, "pinned in the compact bar");
  // The tab leaves the SPA — every other tab renders an in-app view, so without
  // this branch the bar would switch to a view that draws nothing.
  assert.match(
    app,
    /if \(v === "hebrew"\) \{[\s\S]{0,140}location\.href = "\/hebrew\/";/,
    "the button navigates to the lesson hub",
  );
  // The Now-screen card was retired in favour of the button; nothing should
  // still reference it (normalize() drops the stale homeOrder key on its own).
  assert.doesNotMatch(app, /hebrewCard\(/, "no leftover Now-screen card");
  assert.doesNotMatch(app, /\["hebrew", "Nightly Hebrew"\]/, "not registered in CARDS");
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
    // Extensionless on purpose: Pages 308s "*.html" to the clean URL and
    // cache.add() rejects a redirect, so a ".html" entry never precaches.
    assert.ok(sw.includes(`"hebrew/unit-${i}"`), `sw precaches unit-${i} (clean URL)`);
    assert.ok(!sw.includes(`"hebrew/unit-${i}.html"`), `sw does not precache a redirecting URL`);
    assert.ok(sw.includes(`"hebrew/games/unit-${i}.js"`), `sw precaches game ${i}`);
  }
  const core = ["hebrew/", "hebrew/hebrew.css", "hebrew/data.js", "hebrew/units.js", "hebrew/engine.js"];
  for (const f of [...core, ...MODULES.map((m) => `hebrew/activities/${m}.js`)]) {
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
