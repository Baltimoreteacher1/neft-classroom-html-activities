#!/usr/bin/env node
/* ==========================================================================
 * injector-anchor-safety.test.mjs — the three ways a sentinel injector can
 * damage a page it is supposed to leave alone.
 *
 * WHY THIS EXISTS
 *
 * tools/build-injectors-idempotent.test.mjs proves the injectors are a no-op
 * on the tree AS COMMITTED. That is a real property and it is not this one:
 * it can only ever see the fleet's current shape. Every defect below is
 * invisible to it, because each needs a page shape the fleet does not happen
 * to contain right now — a `</body>` literal inside an inline script, an
 * uppercase closer, a stale asset version, a page that already carries two
 * blocks. The fleet gains those shapes one generator change at a time, and by
 * then the injector has already rewritten it.
 *
 * So this file supplies the shapes. Each case builds a throwaway mini-repo,
 * copies the REAL injector into it (the injectors resolve ROOT from
 * import.meta.url, so a copy at <tmp>/tools/x.js treats <tmp> as the repo),
 * runs it for real, and asserts on the bytes it wrote.
 *
 * Every assertion here was watched to FAIL against the code as it stood before
 * fix/injector-anchor-hazards; a test nobody saw fail proves nothing.
 * ========================================================================== */

import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { copyFileSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");

let failures = 0;
const test = (name, fn) => {
  let sandbox;
  try {
    sandbox = mkdtempSync(join(tmpdir(), "injector-anchor-"));
    fn(sandbox);
    console.log(`   ✓ ${name}`);
  } catch (err) {
    failures++;
    console.error(`   ✗ ${name}\n     ${String(err.message).split("\n").join("\n     ")}`);
  } finally {
    if (sandbox) rmSync(sandbox, { recursive: true, force: true });
  }
};

/** Copy one real injector into the sandbox and run it there. */
function runInjector(sandbox, tool, args = []) {
  mkdirSync(join(sandbox, "tools"), { recursive: true });
  copyFileSync(join(ROOT, "tools", tool), join(sandbox, "tools", tool));
  return execFileSync(process.execPath, [join(sandbox, "tools", tool), ...args], {
    encoding: "utf8",
    stdio: "pipe",
  });
}

const write = (sandbox, rel, body) => {
  const file = join(sandbox, rel);
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, body, "utf8");
  return file;
};
const read = (file) => readFileSync(file, "utf8");
const count = (s, needle) => s.split(needle).length - 1;

console.log("injector anchor safety");

/* ── DEFECT 1 — tools/inject-game-fx.js ─────────────────────────────────────
 * It inserted with `html.replace(/<\/head>/i, …)` / `html.replace(/<\/body>/i, …)`:
 * first match, no /g, no lastIndexOf. Game pages routinely build a whole HTML
 * document inside a JS template string (print sheet, share card, export), so
 * the first `</body>` in the file is a string literal — and the injected block
 * landed inside it, putting a `</script>` into the page's own inline script and
 * killing the game while the page still served 200. Same bug class already
 * fixed in inject-save-resume.js (6270f79f9) and inject-math-workbench.js
 * (1dfb1e171); game-fx never got the fix.
 *
 * The replacement also re-emitted a literal lowercase closer, so an uppercase
 * `</BODY>` was silently case-folded on write.
 * ------------------------------------------------------------------------- */

// A print/export generator in <head> AND one in <body>, so both anchors are
// exercised: the first `</head>` and the first `</body>` in the byte stream are
// both string literals, not the document's real closers.
const PRINT_PAGE = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Ratio Race</title>
  <script>
    const PRINT_SHELL = \`<html><head><style>b{color:red}</style></head><body><h1>Score</h1></body></html>\`;
  </script>
</head>
<body>
  <canvas id="game"></canvas>
  <script>
    function exportSheet(rows) {
      return \`<!doctype html><html><head><title>Sheet</title></head><body>\${rows}</body></html>\`;
    }
  </script>
</body>
</html>
`;

test("game-fx: injects at the document's real </head> and </body>, not a literal inside a script", (s) => {
  const file = write(s, "games/print-page.html", PRINT_PAGE);
  runInjector(s, "inject-game-fx.js");
  const out = read(file);

  // The template strings must survive byte-for-byte. If the injector spliced
  // into one, its `</script>` terminated the page's inline script early.
  assert.ok(
    out.includes(
      "`<html><head><style>b{color:red}</style></head><body><h1>Score</h1></body></html>`",
    ),
    "the <head> generator's template string was rewritten",
  );
  assert.ok(
    out.includes(
      "`<!doctype html><html><head><title>Sheet</title></head><body>${rows}</body></html>`",
    ),
    "the <body> generator's template string was rewritten",
  );

  // Exactly one of each block, and each one outside every <script>.
  assert.equal(count(out, "gfx-injected:begin"), 2, "expected one head block and one body block");
  assert.ok(out.includes('<link rel="stylesheet" href="/assets/game-fx.css">'), "no stylesheet");
  assert.ok(out.includes('<script src="/assets/game-fx.js" defer></script>'), "no script tag");

  // Position, not just presence: the body block belongs after the page's own
  // export generator, i.e. at the document's real close.
  assert.ok(
    out.indexOf('src="/assets/game-fx.js"') > out.indexOf("function exportSheet"),
    "the game-fx script landed before the page's own export generator",
  );
});

// The same page with a CLEAN <head>, so the body anchor is proven on its own:
// the only `</body>` before the document's real one is a string literal.
const BODY_ONLY_PAGE = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Ratio Race</title>
</head>
<body>
  <canvas id="game"></canvas>
  <script>
    function exportSheet(rows) {
      return \`<!doctype html><html><head><title>Sheet</title></head><body>\${rows}</body></html>\`;
    }
  </script>
</body>
</html>
`;

test("game-fx: the body block goes to the LAST </body>, not a literal in a template string", (s) => {
  const file = write(s, "games/export-only.html", BODY_ONLY_PAGE);
  runInjector(s, "inject-game-fx.js");
  const out = read(file);

  assert.ok(
    out.includes(
      "`<!doctype html><html><head><title>Sheet</title></head><body>${rows}</body></html>`",
    ),
    "the export generator's template string was rewritten",
  );
  assert.ok(
    out.indexOf('src="/assets/game-fx.js"') > out.indexOf("function exportSheet"),
    "the game-fx script landed inside the page's own export generator",
  );
  assert.equal(count(out, "gfx-injected:begin"), 2, "expected one head block and one body block");
});

test("game-fx: preserves an uppercase </BODY> instead of rewriting it lowercase", (s) => {
  const file = write(
    s,
    "games/legacy-caps.html",
    `<!DOCTYPE HTML>
<HTML>
<HEAD><TITLE>Legacy</TITLE></HEAD>
<BODY>
  <p>hi</p>
</BODY>
</HTML>
`,
  );
  runInjector(s, "inject-game-fx.js");
  const out = read(file);

  assert.ok(out.includes("</HEAD>"), "the uppercase </HEAD> was case-folded on write");
  assert.ok(out.includes("</BODY>"), "the uppercase </BODY> was case-folded on write");
  assert.equal(count(out, "</body>"), 0, "a second, lowercase </body> was emitted");
  assert.equal(count(out, "</head>"), 0, "a second, lowercase </head> was emitted");
  assert.equal(count(out, "gfx-injected:begin"), 2, "expected one head block and one body block");
});

test("game-fx: a second run is a no-op (sentinel guard still holds)", (s) => {
  const file = write(s, "games/print-page.html", PRINT_PAGE);
  runInjector(s, "inject-game-fx.js");
  const once = read(file);
  runInjector(s, "inject-game-fx.js");
  assert.equal(read(file), once, "a re-run changed the page");
});

/* ── DEFECT 2 — tools/inject-learning-supports.mjs ──────────────────────────
 * (a) The idempotency guards tested for a `…?v=<version>` asset URL. A page
 *     holding the PREVIOUS version fails that test, so the injector appended a
 *     SECOND block and left the stale one — every version bump double-injects
 *     the whole fleet. Live today: all 84 canonical lessons carry the
 *     unversioned URL that scripts/generate-lesson-shells.mjs writes, so one
 *     plain run added 84 duplicate CSS blocks and 84 duplicate JS blocks.
 * (b) checkFile() demanded `v26` while the writer emitted `v28`, so `--check`
 *     reported EVERY lesson INVALID and exited 1 — permanently red, therefore
 *     unread.
 * ------------------------------------------------------------------------- */

// What the fleet actually looks like: sentinels present, asset URLs unversioned.
const lessonPage = (cssHref, jsSrc, lessonId = "1-1") => `<!doctype html>
<html lang="en" data-ewl-supports-lesson="${lessonId}">
<head>
  <meta charset="utf-8">
  <title>Lesson 1-1</title>
<!-- ewl-supports-injected:begin -->
  <link rel="stylesheet" href="${cssHref}" />
<!-- ewl-supports-injected:end -->
</head>
<body>
  <div id="app"></div>
<!-- ewl-supports-injected:begin -->
  <script src="${jsSrc}" defer></script>
<!-- ewl-supports-injected:end -->
</body>
</html>
`;
const CSS = "/assets/learning-supports/learning-supports.css";
const JS = "/assets/learning-supports/learning-supports.js";

test("learning-supports: an already-injected lesson is left untouched (sentinel guard, not version)", (s) => {
  const file = write(s, "lessons/1-1/index.html", lessonPage(CSS, JS));
  const before = read(file);
  runInjector(s, "inject-learning-supports.mjs");
  const out = read(file);

  assert.equal(count(out, "ewl-supports-injected:begin"), 2, "a duplicate block was appended");
  assert.equal(count(out, CSS), 1, "the stylesheet is referenced more than once");
  assert.equal(count(out, JS), 1, "learning-supports.js is loaded more than once");
  assert.equal(out, before, "an already-integrated lesson was rewritten");
});

test("learning-supports: a stale-version block is REFRESHED in place, never appended to", (s) => {
  const file = write(
    s,
    "lessons/1-1/index.html",
    lessonPage(`${CSS}?v=20260714-supports-v27`, `${JS}?v=20260714-supports-v27`),
  );
  runInjector(s, "inject-learning-supports.mjs");
  const out = read(file);

  assert.equal(count(out, "ewl-supports-injected:begin"), 2, "the stale block was not replaced");
  assert.equal(count(out, "supports-v27"), 0, "the stale asset version survived the refresh");
  assert.ok(out.includes(`href="${CSS}"`), "the refreshed stylesheet href is wrong");
  assert.ok(out.includes(`src="${JS}"`), "the refreshed script src is wrong");
  // The refreshed block must stay where it was: head block in <head>, body
  // block in <body>. A rebuild that re-appends would move them.
  assert.ok(out.indexOf(`href="${CSS}"`) < out.indexOf("<body>"), "the CSS block left the <head>");
  assert.ok(out.indexOf(`src="${JS}"`) > out.indexOf("<body>"), "the JS block left the <body>");
});

test("learning-supports: a page already double-injected is repaired to one block per asset", (s) => {
  const dup = lessonPage(CSS, JS).replace(
    `<!-- ewl-supports-injected:begin -->\n  <link rel="stylesheet" href="${CSS}" />\n<!-- ewl-supports-injected:end -->`,
    `<!-- ewl-supports-injected:begin -->\n  <link rel="stylesheet" href="${CSS}?v=old" />\n<!-- ewl-supports-injected:end -->\n<!-- ewl-supports-injected:begin -->\n  <link rel="stylesheet" href="${CSS}" />\n<!-- ewl-supports-injected:end -->`,
  );
  const file = write(s, "lessons/1-1/index.html", dup);
  assert.equal(count(dup, "ewl-supports-injected:begin"), 3, "fixture is not doubled");

  runInjector(s, "inject-learning-supports.mjs");
  const out = read(file);
  assert.equal(count(out, "ewl-supports-injected:begin"), 2, "the duplicate CSS block survived");
  assert.equal(count(out, CSS), 1, "the stylesheet is still referenced twice");
});

test("learning-supports: --check agrees with what the injector writes (exit 0, not permanently red)", (s) => {
  write(s, "lessons/1-1/index.html", lessonPage(CSS, JS));
  write(s, "lessons/1-2/index.html", lessonPage(`${CSS}?v=old`, `${JS}?v=old`, "1-2"));

  // Before injection, 1-2 is stale, so --check must fail (exit 1).
  assert.throws(
    () => runInjector(s, "inject-learning-supports.mjs", ["--check"]),
    "--check passed a lesson carrying a stale asset version",
  );

  runInjector(s, "inject-learning-supports.mjs");
  const out = runInjector(s, "inject-learning-supports.mjs", ["--check"]);
  assert.match(out, /2\/2 lessons integrated/, `--check still reports INVALID:\n${out}`);
});

test("learning-supports: --dry-run reports without writing", (s) => {
  const file = write(s, "lessons/1-1/index.html", lessonPage(`${CSS}?v=old`, `${JS}?v=old`));
  const before = read(file);
  const out = runInjector(s, "inject-learning-supports.mjs", ["--dry-run"]);
  assert.match(out, /Would modify 1 lesson launchers/, `dry-run summary wrong:\n${out}`);
  assert.equal(read(file), before, "--dry-run wrote to disk");
});

/* ── DEFECT 3 — tools/inject-enterprise-head.js ─────────────────────────────
 * stripBlock() used indexOf: first occurrence only. Idempotency here is
 * strip-then-rebuild, so a surplus block was permanent — strip one, re-add one,
 * back to two, on every build, forever. `--revert` could not clear it either,
 * because it strips through the same function. The page meanwhile shipped two
 * <link rel="canonical"> and two sets of og: tags.
 * ------------------------------------------------------------------------- */

const HEAD_BEGIN =
  "<!-- enthead-injected:begin (enterprise head/meta — tools/inject-enterprise-head.js) -->";
const HEAD_END = "<!-- enthead-injected:end -->";
const SHELL_BEGIN =
  "<!-- entshell-injected:begin (no-JS + boot-failure fallback — tools/inject-enterprise-head.js) -->";
const SHELL_END = "<!-- entshell-injected:end -->";

const headBlock = (canonical) =>
  [
    HEAD_BEGIN,
    '  <link rel="icon" href="/assets/favicon.svg" type="image/svg+xml">',
    `  <link rel="canonical" href="${canonical}">`,
    `  ${HEAD_END}`,
  ].join("\n  ");

const launcher = (extraHeadBlocks) => `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Lesson 1-1 — Neft Teacher</title>
${extraHeadBlocks}
</head>
<body>
  <div id="app"><p class="sg-boot">Loading your math studio…</p></div>
  <script type="module" src="/assets/lesson-engine.js"></script>
</body>
</html>
`;

test("enterprise-head: two committed head blocks collapse to one", (s) => {
  const fixture = launcher(
    `  ${headBlock("https://eduwonderlab.com/lessons/1-1/")}\n  ${headBlock("https://eduwonderlab.com/lessons/1-1/")}`,
  );
  assert.equal(count(fixture, "enthead-injected:begin"), 2, "fixture is not doubled");
  const file = write(s, "lessons/1-1/index.html", fixture);

  runInjector(s, "inject-enterprise-head.js");
  const out = read(file);
  assert.equal(count(out, "enthead-injected:begin"), 1, "the surplus head block survived");
  assert.equal(count(out, "enthead-injected:end"), 1, "the surplus head block survived");
  assert.equal(count(out, 'rel="canonical"'), 1, "the page still ships two canonical links");
});

test("enterprise-head: --revert clears every block, not just the first", (s) => {
  const fixture = launcher(
    `  ${headBlock("https://eduwonderlab.com/lessons/1-1/")}\n  ${headBlock("https://eduwonderlab.com/lessons/1-1/")}`,
  );
  const file = write(s, "lessons/1-1/index.html", fixture);
  runInjector(s, "inject-enterprise-head.js", ["--revert"]);
  const out = read(file);
  assert.equal(count(out, "enthead-injected"), 0, "--revert left a block behind");
  assert.equal(count(out, 'rel="canonical"'), 0, "--revert left a canonical link behind");
});

test("enterprise-head: still idempotent on a normal page (one block, stable across runs)", (s) => {
  const file = write(s, "lessons/1-1/index.html", launcher(""));
  runInjector(s, "inject-enterprise-head.js");
  const once = read(file);
  runInjector(s, "inject-enterprise-head.js");
  const twice = read(file);
  assert.equal(twice, once, "a re-run changed the page");
  assert.equal(count(once, "enthead-injected:begin"), 1, "expected exactly one head block");
});

/* Regression guard for 9eb7c0bb6 — the fix that nearly deleted 148 blank-screen
 * guards. The shell block must be re-emitted for any page that ALREADY carried
 * one, even when isLauncherShell() no longer matches. stripBlock removing more
 * blocks must not weaken that: `hadShell` reads the ORIGINAL text. */
test("enterprise-head: keeps the blank-screen guard on a page the predicate no longer matches", (s) => {
  const notAShell = `<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><title>Lesson 1-1 — Neft Teacher</title></head>
<body>
  <div id="app"><section><h1>Rendered server-side</h1></section></div>
  ${SHELL_BEGIN}
  <noscript>needs JS</noscript>
  <script src="/assets/lesson-shell-guard.js" defer></script>
  ${SHELL_END}
</body>
</html>
`;
  const file = write(s, "lessons/1-1/index.html", notAShell);
  runInjector(s, "inject-enterprise-head.js");
  const out = read(file);
  assert.ok(
    out.includes("/assets/lesson-shell-guard.js"),
    "the blank-screen guard was deleted from a page that already had it",
  );
  assert.equal(count(out, "entshell-injected:begin"), 1, "expected exactly one shell block");
});

test("enterprise-head: two shell blocks also collapse to one", (s) => {
  const doubled = `<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><title>Lesson 1-1 — Neft Teacher</title></head>
<body>
  <div id="app"><p class="sg-boot">Loading…</p></div>
  <script type="module" src="/assets/lesson-engine.js"></script>
  ${SHELL_BEGIN}
  <script src="/assets/lesson-shell-guard.js" defer></script>
  ${SHELL_END}
  ${SHELL_BEGIN}
  <script src="/assets/lesson-shell-guard.js" defer></script>
  ${SHELL_END}
</body>
</html>
`;
  const file = write(s, "lessons/1-1/index.html", doubled);
  runInjector(s, "inject-enterprise-head.js");
  const out = read(file);
  assert.equal(count(out, "entshell-injected:begin"), 1, "the surplus shell block survived");
  assert.equal(count(out, "/assets/lesson-shell-guard.js"), 1, "the guard is loaded twice");
});

if (failures) {
  console.error(`\n✗ injector anchor safety: ${failures} failing case(s)`);
  process.exit(1);
}
console.log("   ✓ all injector anchor-safety cases pass");
