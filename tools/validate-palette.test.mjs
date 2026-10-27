// Negative controls for validate:palette. A gate that has quietly stopped firing and a
// gate watching a clean tree print the same PASS, so each half is proven against a
// defect it must catch, an empty sweep it must refuse, and a palette-only file it must pass.
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { isForbiddenHue, parseColor } from "./lib/color-math.mjs";
import { remapForbidden, remapText } from "./lib/palette-remap.mjs";
import { findForbiddenLiterals, forbiddenHsl, probe } from "./validate-palette.mjs";

const GATE = join(dirname(fileURLToPath(import.meta.url)), "validate-palette.mjs");
const run = (...args) => spawnSync(process.execPath, [GATE, ...args], { encoding: "utf8" });

function tempRoot(files) {
  const root = mkdtempSync(join(tmpdir(), "palette-gate-"));
  for (const [rel, body] of Object.entries(files)) {
    mkdirSync(dirname(join(root, rel)), { recursive: true });
    writeFileSync(join(root, rel), body);
  }
  return root;
}

// ---- detector units: what counts as a forbidden literal
{
  const bad = (s) => findForbiddenLiterals(s).length > 0;
  assert.ok(bad(".a{color:#5b21b6}"), "hex violet");
  assert.ok(bad(".a{color:#7c3aed}"), "hex violet 2");
  assert.ok(bad(".a{background:rgba(124,58,237,.16)}"), "rgba violet");
  assert.ok(bad(".a{color:rgb(124 58 237)}"), "space-separated rgb");
  assert.ok(bad(".a{color:hsl(270, 60%, 40%)}"), "hsl purple");
  assert.ok(bad(".a{color:hsl(300deg 50% 50%)}"), "hsl magenta, deg");
  assert.ok(bad(".a{color: purple}"), "named purple");
  assert.ok(bad('const c = { fill: "rebeccapurple" }'), "named, quoted, in JS");
  assert.ok(bad('<rect fill="orchid"/>'), "named in an SVG attribute");
  // not hits
  assert.ok(!bad(".a{color:#17324D;background:#1FA6A2;border-color:#F2C15B}"), "palette hexes");
  assert.ok(!bad(".a{color:#24323F;background:#F7F4EC}"), "text and off-white");
  assert.ok(!bad(".a{color:#808090}"), "a low-saturation blue-grey is not violet");
  assert.ok(!bad(".a{color:hsl(210, 50%, 20%)}"), "navy hsl");
  assert.ok(!bad('el.className = "badge badge-indigo"'), "a class name is not a colour");
  assert.ok(!bad("/* the old violet #5b21b6 button */ .a{color:#17324D}"), "a CSS comment");
  assert.ok(!bad("// was purple\nconst x = 1;"), "a JS line comment");
  assert.ok(!bad(".a{color:#eeeaff}"), "lightness above 97% is paper, not violet");
  assert.ok(
    forbiddenHsl(270, 0.5, 0.5) && !forbiddenHsl(254, 0.5, 0.5) && !forbiddenHsl(336, 0.5, 0.5),
    "hue range edges",
  );
  // line numbers survive comment stripping
  assert.equal(findForbiddenLiterals("/* a\nb */\n.a{color:#5b21b6}")[0].line, 3);
}

// ---- remap: lands in the palette's hue families, keeps lightness
{
  for (const hex of ["#7c5cbf", "#4a2d7a", "#6b4c9a", "#a78bfa", "#d946ef", "#c026d3"]) {
    const out = parseColor(remapText(hex));
    assert.ok(!isForbiddenHue(out), `${hex} -> still forbidden`);
  }
  assert.equal(remapText("#1fa6a2"), "#1fa6a2", "palette colours are left alone");
  const c = remapForbidden(parseColor("#7c5cbf"));
  assert.ok(!isForbiddenHue(c));
}

// ---- STATIC half, end to end through the CLI
const MANIFEST = JSON.stringify({ lessons: [{ id: "9-9" }] });
{
  const clean = tempRoot({
    "data/curriculum-launch-manifest.json": MANIFEST,
    "engine/styles/a.css": ".a{color:#17324D;background:#1FA6A2;border-color:#F2C15B}",
    "engine/core/b.js": 'export const C = { navy: "#17324D", teal: "#1FA6A2", amber: "#F2C15B" };',
  });
  const r = run("--static-only", "--root", clean, "--min-files", "2");
  assert.equal(r.status, 0, `a teal/navy/amber-only tree must pass\n${r.stderr}${r.stdout}`);

  const dirty = tempRoot({
    "data/curriculum-launch-manifest.json": MANIFEST,
    "engine/styles/a.css": ".a{color:#17324D}",
    "engine/core/panel.js": "const s = `.x{background:#5b21b6;color:#fff}`;",
  });
  const d = run("--static-only", "--root", dirty, "--min-files", "2");
  assert.equal(d.status, 1, "a seeded purple literal must fail the gate");
  assert.match(
    d.stderr,
    /engine\/core\/panel\.js:1\s+#5b21b6/,
    "and name the file, line and colour",
  );

  // the lesson page's own /assets reference is part of the sweep
  const viaPage = tempRoot({
    "data/curriculum-launch-manifest.json": MANIFEST,
    [`lessons/9-9/index.html`]: '<link rel="stylesheet" href="/assets/skin.css?v=1">',
    "assets/skin.css": ".a{border-color:rgb(124,58,237)}",
  });
  const v = run("--static-only", "--root", viaPage, "--min-files", "1");
  assert.equal(v.status, 1, "a stylesheet a lesson page links must be swept");
  assert.match(v.stderr, /assets\/skin\.css/);

  // a hit in a file no lesson loads is not this gate's business
  const unrelated = tempRoot({
    "data/curriculum-launch-manifest.json": MANIFEST,
    "engine/core/ok.js": "export const x = 1;",
    "games/arcade/style.css": ".a{color:#7c3aed}",
  });
  assert.equal(run("--static-only", "--root", unrelated, "--min-files", "1").status, 0);

  // the empty-sweep guard: nothing swept is a FAIL, not a pass
  const empty = tempRoot({ "data/curriculum-launch-manifest.json": MANIFEST });
  const e = run("--static-only", "--root", empty, "--min-files", "1");
  assert.equal(e.status, 1, "an empty sweep must fail");
  assert.match(e.stderr, /swept 0 files/);
  const tooFew = tempRoot({
    "data/curriculum-launch-manifest.json": MANIFEST,
    "engine/core/ok.js": "export const x = 1;",
  });
  assert.equal(
    run("--static-only", "--root", tooFew).status,
    1,
    "fewer than the default floor must fail",
  );
}

// ---- BROWSER half: the probe, against a page built to hide purple where only a browser finds it
{
  let chromium;
  let browser;
  try {
    ({ chromium } = await import("playwright"));
    browser = await chromium.launch(
      process.env.PW_CHROMIUM_PATH ? { executablePath: process.env.PW_CHROMIUM_PATH } : {},
    );
  } catch (e) {
    console.log(
      `SKIPPED browser negative controls: no Chromium (${String(e.message).split("\n")[0]})`,
    );
  }
  if (browser) {
    const page = await browser.newPage();
    const measure = async (html) => {
      await page.setContent(`<!doctype html><body>${html}</body>`);
      return (await page.evaluate(probe)).found;
    };
    const cases = [
      ["text colour", '<p style="color:#5b21b6">x</p>'],
      [
        "background inside a CLOSED <details>",
        '<details><summary>s</summary><div style="background:#7c3aed;width:9px;height:9px">y</div></details>',
      ],
      ["border", '<div style="border:3px solid #6d28d9;width:9px;height:9px"></div>'],
      ["svg fill", '<svg width="20" height="20"><rect width="9" height="9" fill="#7c5cbf"/></svg>'],
      [
        "svg stroke",
        '<svg width="20" height="20"><rect width="9" height="9" fill="none" stroke="rebeccapurple"/></svg>',
      ],
      [
        "gradient",
        '<div style="width:9px;height:9px;background:linear-gradient(#1fa6a2,#a78bfa)"></div>',
      ],
      [
        "box-shadow",
        '<div style="width:9px;height:9px;box-shadow:0 2px 4px rgba(124,58,237,.4)"></div>',
      ],
      [
        "translucent overlay",
        '<div style="width:9px;height:9px;background:rgba(147,51,234,.2)"></div>',
      ],
      [
        "colour-mix result",
        '<div style="width:9px;height:9px;background:color-mix(in srgb,#7c3aed 60%,white)"></div>',
      ],
      ["::before", '<style>i::before{content:"a";color:#5b21b6}</style><i>z</i>'],
    ];
    for (const [name, html] of cases) {
      const found = await measure(html);
      assert.ok(found.length > 0, `probe missed purple in: ${name}`);
    }
    const ok = await measure(
      '<p style="color:#17324D;background:#F7F4EC;border:1px solid #1FA6A2">a</p><svg width="9" height="9"><rect width="9" height="9" fill="#F2C15B"/></svg><p style="color:#808090">grey</p><p style="color:#B3402A">err</p>',
    );
    assert.deepEqual(ok, [], "a palette-only page reports nothing");
    const hidden = await measure('<div style="display:none;color:#5b21b6">invisible</div>');
    assert.deepEqual(hidden, [], "display:none paints nothing");
    await browser.close();
  }
}

console.log("validate-palette.test: all controls passed");
