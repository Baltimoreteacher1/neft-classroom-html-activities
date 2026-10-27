#!/usr/bin/env node
/**
 * design-tokens.test.mjs — negative controls for tools/build-design-tokens.mjs.
 *
 * The generator is the gate for the colour system: it must fail on a purple
 * token, on a contrast pair under its floor, and on a stale generated file or
 * guide table. Each case drives the REAL script (via DS_TOKENS_* overrides)
 * against a seeded defect and asserts the failure names the defect — a script
 * that dies on a missing import also exits non-zero and proves nothing.
 */
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { copyFileSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { contrast, isForbiddenHue, parseColor } from "./lib/color-math.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const SCRIPT = join(ROOT, "tools", "build-design-tokens.mjs");
const tokens = () => JSON.parse(readFileSync(join(ROOT, "engine/design/tokens.json"), "utf8"));

function sandbox(mutate) {
  const dir = mkdtempSync(join(tmpdir(), "ds-tokens-"));
  const src = join(dir, "tokens.json");
  const t = tokens();
  if (mutate) mutate(t);
  writeFileSync(src, JSON.stringify(t));
  const out = join(dir, "ds.css");
  const guide = join(dir, "guide.md");
  copyFileSync(join(ROOT, "docs/style-guide.md"), guide);
  return {
    dir,
    env: { ...process.env, DS_TOKENS_SRC: src, DS_TOKENS_OUT: out, DS_TOKENS_GUIDE: guide },
    out,
    guide,
  };
}
function run(env, ...args) {
  try {
    return {
      code: 0,
      out: execFileSync(process.execPath, [SCRIPT, ...args], {
        cwd: ROOT,
        env,
        encoding: "utf8",
        stdio: ["ignore", "pipe", "pipe"],
      }),
    };
  } catch (e) {
    return { code: e.status ?? 1, out: `${e.stdout || ""}${e.stderr || ""}` };
  }
}

test("the committed tokens pass --check", () => {
  const r = run(process.env, "--check");
  assert.equal(r.code, 0, r.out);
  assert.match(r.out, /PASS build-design-tokens/);
});

test("colour maths: known WCAG values", () => {
  const w = parseColor("#ffffff");
  const k = parseColor("#000000");
  assert.ok(Math.abs(contrast(w, k) - 21) < 0.01);
  assert.ok(
    Math.abs(contrast(parseColor("#1fa6a2"), w) - 2.99) < 0.02,
    "brand teal on white is ~2.99:1",
  );
});

test("the forbidden-hue detector fires on violet/purple/magenta and not on the palette or neutrals", () => {
  for (const bad of ["#7c3aed", "#6d28d9", "#a855f7", "#c026d3", "#4a2d7a", "#ede8f7"])
    assert.ok(isForbiddenHue(parseColor(bad)), `${bad} must be forbidden`);
  for (const ok of [
    "#17324d",
    "#1fa6a2",
    "#f2c15b",
    "#f7f4ec",
    "#24323f",
    "#ffffff",
    "#000000",
    "#64748b",
    "#0284c7",
  ])
    assert.ok(!isForbiddenHue(parseColor(ok)), `${ok} must be allowed`);
});

test("NEGATIVE: a purple palette token fails the script and names the token", () => {
  const sb = sandbox((t) => {
    t.palette.error = "#7C3AED";
  });
  try {
    const r = run(sb.env);
    assert.notEqual(r.code, 0);
    assert.match(r.out, /forbidden violet\/purple\/magenta/);
    assert.match(r.out, /token error/);
  } finally {
    rmSync(sb.dir, { recursive: true, force: true });
  }
});

test("NEGATIVE: a contrast pair under its floor fails and names the pair", () => {
  const sb = sandbox((t) => {
    t.contrastPairs.push({ fg: "teal", bg: "white", min: 4.5, use: "seeded defect" });
  });
  try {
    const r = run(sb.env);
    assert.notEqual(r.code, 0);
    assert.match(r.out, /contrast teal on white is 2\.99, needs 4\.5/);
  } finally {
    rmSync(sb.dir, { recursive: true, force: true });
  }
});

test("NEGATIVE: --check fails when the generated CSS is stale, and when the guide table is stale", () => {
  const sb = sandbox();
  try {
    assert.equal(run(sb.env).code, 0, "build into the sandbox");
    assert.equal(run(sb.env, "--check").code, 0, "fresh sandbox passes");
    writeFileSync(sb.out, `${readFileSync(sb.out, "utf8")}\n/* drift */\n`);
    const stale = run(sb.env, "--check");
    assert.notEqual(stale.code, 0);
    assert.match(stale.out, /ds-tokens\.generated\.css is stale/);
    run(sb.env);
    writeFileSync(sb.guide, readFileSync(sb.guide, "utf8").replace("11.92", "99.99"));
    const guide = run(sb.env, "--check");
    assert.notEqual(guide.code, 0);
    assert.match(guide.out, /contrast table in docs\/style-guide\.md is stale/);
  } finally {
    rmSync(sb.dir, { recursive: true, force: true });
  }
});

test("every contrast pair holds on the EMITTED hex values, not just the unrounded maths", () => {
  // Regression: the generator once verified teal-ink at 4.52:1 on unrounded channels, then
  // emitted a rounded hex that measured 4.49:1 in the browser — under the AA floor.
  const css = readFileSync(join(ROOT, "engine/styles/ds-tokens.generated.css"), "utf8");
  const emitted = {};
  for (const m of css.matchAll(/--ds-color-([a-z-]+): (#[0-9a-f]{6});/g)) {
    emitted[m[1].replace(/-([a-z])/g, (_, c) => c.toUpperCase())] = parseColor(m[2]);
  }
  const t = tokens();
  assert.ok(Object.keys(emitted).length >= 10, "parsed the emitted colour tokens");
  for (const p of t.contrastPairs) {
    const ratio = contrast(emitted[p.fg], emitted[p.bg]);
    assert.ok(
      ratio >= p.min,
      `${p.fg} on ${p.bg} is ${ratio.toFixed(2)} as emitted, needs ${p.min}`,
    );
  }
});
