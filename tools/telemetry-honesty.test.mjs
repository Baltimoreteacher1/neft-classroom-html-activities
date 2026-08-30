#!/usr/bin/env node
/**
 * The usage numbers have to be true, because they are the ones decisions get
 * made from — which lessons to improve next, which of the 364 folders are dead
 * weight. Three defects made them false at once, and each is pinned here.
 *
 *   1. A driven browser wrote student rows. `night-shift/modules/06-lesson-render.mjs`
 *      boots every live lesson on eduwonderlab.com headlessly at 2am; each boot
 *      wrote a `time_on_task` row into the production database. The 06:00-08:00Z
 *      window alone held 1,469 events across 343 phantom "sessions", and
 *      lessons nobody had taught yet ranked in "most-used".
 *
 *   2. Time on task restated the whole session on every hide. `startTs` was page
 *      load and never reset, so a student who glanced away at 5, 10 and 15
 *      minutes reported 5+10+15 = 30 minutes for a 15-minute lesson.
 *
 *   3. `pagehide` and `visibilitychange`->hidden both fired on a close, so most
 *      stretches were written twice. In the live table only 2,322 of ~7,700
 *      (session, seconds, lesson) groups were singletons; 4,705 were exact
 *      pairs, with a tail out to 27 copies. The report SUMs, so lesson 2-6 read
 *      9,299 minutes against a true 2,820 — 3.3x.
 *
 * The client half is driven through real lifecycle events in jsdom rather than
 * by reading the source, because the bug was never in what the code said: every
 * line of the old version was individually reasonable, and the defect only
 * appears when the events actually fire in the order a browser fires them.
 *
 * The report half runs the real `scripts/usage-report.mjs` against a synthetic
 * SQLite database whose true answer is known by construction, so the repair rule
 * is proven end to end and not string-matched.
 */
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { skipExit } from "./lib/skip-exit.mjs";

const ROOT = process.cwd();
const failures = [];
function check(name, fn) {
  try {
    fn();
    console.log(`  ok  ${name}`);
  } catch (e) {
    failures.push(`${name}: ${e.message}`);
    console.log(`  FAIL ${name}\n       ${e.message}`);
  }
}
function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

/* ------------------------------------------------------- the client, driven */

let JSDOM;
try {
  ({ JSDOM } = await import("jsdom"));
} catch {
  process.exit(skipExit("jsdom is not installed — the telemetry client cannot be driven."));
}

const CLIENT = readFileSync(join(ROOT, "assets/lesson-telemetry.js"), "utf8");

/* Every jsdom window opened here, so all of them can be closed. An unclosed
 * window keeps its timers — and the process — alive. */
const windows = [];
function closeWindows() {
  for (const w of windows) {
    try {
      w.close();
    } catch {
      /* already gone */
    }
  }
  windows.length = 0;
}

/**
 * Boot the telemetry client in a fresh document and hand back a handle that can
 * move time, flip visibility, and read what was queued.
 *
 * Events are read out of the localStorage queue rather than by intercepting
 * fetch: the queue is where `track()` actually lands, so this survives any
 * change to how batches are sent, and it is the same array `getQueue()` exposes.
 */
function boot({ webdriver = false } = {}) {
  const dom = new JSDOM("<!doctype html><html><body></body></html>", {
    url: "https://eduwonderlab.com/lessons/2-6/",
    // `pretendToBeVisual` is deliberately OFF. It starts a requestAnimationFrame
    // loop that holds the event loop open, so the process prints every passing
    // assertion and then never exits — this file hung for 120s+ and was the
    // single reason `npm test` ran over the deploy gate's 900s timeout, which
    // aborted a push. Nothing here needs a paint clock; the lifecycle events are
    // dispatched by hand.
    runScripts: "outside-only",
  });
  windows.push(dom.window);
  const { window } = dom;
  Object.defineProperty(window.navigator, "webdriver", {
    value: webdriver,
    configurable: true,
  });

  // Freeze the clock so a "stretch" is exactly as long as the test says it is.
  let now = 1_700_000_000_000;
  const RealDate = window.Date;
  window.Date = class extends RealDate {
    constructor(...a) {
      super(...(a.length ? a : [now]));
    }
    static now() {
      return now;
    }
  };

  let visibility = "visible";
  Object.defineProperty(window.document, "visibilityState", {
    get: () => visibility,
    configurable: true,
  });

  // Never let a test reach the network; a failed send must not lose the queue.
  window.fetch = () => Promise.reject(new Error("offline in test"));
  window.navigator.sendBeacon = () => false;

  window.eval(CLIENT);
  window.document.dispatchEvent(new window.Event("DOMContentLoaded"));

  return {
    window,
    advance(seconds) {
      now += seconds * 1000;
    },
    hide() {
      visibility = "hidden";
      window.document.dispatchEvent(new window.Event("visibilitychange"));
    },
    show() {
      visibility = "visible";
      window.document.dispatchEvent(new window.Event("visibilitychange"));
    },
    /** What a real tab close does: the visibility flip AND pagehide, in order. */
    close() {
      this.hide();
      window.dispatchEvent(new window.Event("pagehide"));
    },
    times() {
      const q = window.NTtelemetry ? window.NTtelemetry.getQueue() : [];
      return q.filter((e) => e.event === "time_on_task").map((e) => e.props.seconds);
    },
    all() {
      return window.NTtelemetry ? window.NTtelemetry.getQueue() : [];
    },
  };
}

console.log("telemetry client");

check("a driven browser writes nothing at all", () => {
  const t = boot({ webdriver: true });
  t.advance(300);
  t.close();
  assert(
    t.all().length === 0,
    `headless boot queued ${t.all().length} event(s); the 2am render check is a robot, not a class`,
  );
});

check("a real browser still reports", () => {
  const t = boot();
  t.advance(600);
  t.close();
  assert(t.times().length >= 1, "a genuine 10-minute visit reported nothing");
});

check("closing a tab writes ONE row, not a pagehide/visibilitychange pair", () => {
  const t = boot();
  t.advance(600);
  t.close();
  assert(
    t.times().length === 1,
    `one close produced ${t.times().length} time_on_task rows (${t.times().join(", ")}) — this is the duplicate that made 4,705 exact pairs`,
  );
  assert(t.times()[0] === 600, `expected 600s, got ${t.times()[0]}`);
});

check("each stretch is measured on its own, not restated from page load", () => {
  const t = boot();
  t.advance(300); // 5 min of work
  t.hide();
  t.show();
  t.advance(300); // 5 more
  t.hide();
  t.show();
  t.advance(300); // 5 more
  t.close();
  const secs = t.times();
  const total = secs.reduce((a, b) => a + b, 0);
  assert(
    total === 900,
    `three 5-minute stretches summed to ${total}s; the old cumulative reading gave 300+600+900 = 1800s for the same 15 minutes`,
  );
  assert(
    secs.every((s) => s === 300),
    `expected three equal 300s stretches, got ${secs.join(", ")}`,
  );
});

check("time spent behind another tab is not time on task", () => {
  const t = boot();
  t.advance(60); // 1 min of work
  t.hide();
  t.advance(3600); // an hour parked in a background tab
  t.show();
  t.advance(60); // 1 more min of work
  t.close();
  const total = t.times().reduce((a, b) => a + b, 0);
  assert(
    total === 120,
    `expected 120s of attention across an hour-long background parking, got ${total}s`,
  );
});

check("a page that opens and closes instantly writes no row", () => {
  const t = boot();
  t.close(); // zero elapsed — a prerender, a bounce, a robot
  assert(
    t.times().length === 0,
    `a 0-second visit wrote ${t.times().length} row(s); these are the rows that put untaught lessons in "most-used"`,
  );
});

closeWindows();

/* ------------------------------------------------- the report, end to end */

console.log("usage report");

let sqliteOk = true;
try {
  execFileSync("sqlite3", ["-version"], { stdio: "ignore" });
} catch {
  sqliteOk = false;
}

if (!sqliteOk) {
  console.log("  -- sqlite3 unavailable; report repair rule not verified");
  if (failures.length) {
    console.error(`\n${failures.length} failure(s)`);
    process.exit(1);
  }
  process.exit(skipExit("sqlite3 is not installed — the report half could not run."));
}

const dir = mkdtempSync(join(tmpdir(), "telemetry-honesty-"));
const db = join(dir, "usage.sqlite");
try {
  // A database whose true answer is known by construction.
  //
  //   old-honest   ONE pre-fix session, cumulative rows 300/600/900 written
  //                twice each (the exact live shape). True attention: 900s.
  //                Summing the raw rows gives 3,600s — 4x.
  //   robot        60 pre-fix sessions that opened and closed at 0s, the way
  //                the nightly render check did. True attention: none.
  //   new-honest   ONE post-fix session of three disjoint 300s stretches,
  //                written once each. True attention: 900s, and here SUM is
  //                the correct reading.
  const rows = [];
  const row = (slug, sess, secs, at) =>
    rows.push(
      `INSERT INTO lesson_telemetry (lesson_slug,lesson_title,event_type,payload_json,created_at) VALUES ('${slug}','${slug}','time_on_task','{"session":"${sess}","props":{"seconds":${secs}}}','${at}');`,
    );

  for (const secs of [300, 600, 900]) {
    row("lessons-old", "old-1", secs, "2026-08-01T12:00:00.000Z");
    row("lessons-old", "old-1", secs, "2026-08-01T12:00:00.001Z"); // the duplicate
  }
  for (let i = 0; i < 60; i++) {
    row("lessons-robot", `bot-${i}`, 0, "2026-08-01T06:02:00.000Z");
  }
  for (const secs of [300, 300, 300]) {
    row("lessons-new", "new-1", secs, "2026-08-30T12:00:00.000Z");
  }

  execFileSync(
    "sqlite3",
    [
      db,
      `CREATE TABLE lesson_telemetry (id INTEGER PRIMARY KEY AUTOINCREMENT, lesson_slug TEXT, lesson_title TEXT, standard TEXT, student_name TEXT, section TEXT, event_type TEXT, payload_json TEXT, created_at TEXT NOT NULL);
       CREATE TABLE game_scores (id INTEGER PRIMARY KEY AUTOINCREMENT, game_id TEXT, points INTEGER, correct INTEGER, total INTEGER, created_at TEXT);
       ${rows.join("\n")}`,
    ],
    { stdio: "ignore" },
  );

  // --out keeps the fixture numbers out of the real reports/usage-report.md.
  const out = join(dir, "report.md");
  execFileSync("node", ["scripts/usage-report.mjs", "--db", db, "--out", out], {
    cwd: ROOT,
    stdio: "ignore",
  });
  const md = readFileSync(out, "utf8");

  const minutesFor = (slug) => {
    const line = md.split("\n").find((l) => l.includes(`| ${slug} |`));
    if (!line) return null;
    const m = /\|\s*(\d+) min\s*\|/.exec(line);
    return m ? Number(m[1]) : null;
  };

  check("a cumulative, duplicated pre-fix session reads as its true total", () => {
    const mins = minutesFor("lessons-old");
    assert(mins !== null, "lessons-old is missing from the report entirely");
    assert(
      mins === 15,
      `expected 15 min (900s of real attention), got ${mins} min; a raw SUM of those rows reads 60 min`,
    );
  });

  check("post-fix stretches are summed, not collapsed", () => {
    const mins = minutesFor("lessons-new");
    assert(mins !== null, "lessons-new is missing from the report entirely");
    assert(
      mins === 15,
      `expected 15 min (three disjoint 300s stretches), got ${mins} min; taking the max here would undercount to 5`,
    );
  });

  check("60 headless 0-second boots do not make a lesson used", () => {
    assert(
      !md.includes("| lessons-robot |"),
      "the nightly render check's lesson still ranks as used",
    );
    assert(
      /Excluded as drive-by: \*\*60 session/.test(md),
      "the report does not disclose the excluded drive-by sessions; a silent correction is not an auditable one",
    );
  });
} finally {
  rmSync(dir, { recursive: true, force: true });
}

if (failures.length) {
  console.error(`\n${failures.length} failure(s)`);
  process.exit(1);
}
console.log("\nall telemetry honesty checks passed");
