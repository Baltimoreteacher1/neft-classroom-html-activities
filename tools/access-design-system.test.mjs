/**
 * Guards the ACCESS Practice Lab design system so the redesign cannot quietly erode:
 *   - every icon the code asks for exists in the sprite
 *   - every CSS custom property a lab stylesheet reads is defined
 *   - text/background pairs of the domain palette meet WCAG AA contrast
 *   - the self-hosted fonts the system names are on disk
 *   - illustration files are small, titled, script-free and self-contained
 *   - no emoji is used as interface chrome in the lab's own source (emoji inside activity content are data)
 */
import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import test from "node:test";
import { REPO_ROOT } from "./lib/access-lab-content.mjs";

const LAB = join(REPO_ROOT, "access-practice-lab");
const read = (p) => readFileSync(p, "utf8");
const walk = (dir, keep) =>
  readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? walk(join(dir, e.name), keep) : keep(e.name) ? [join(dir, e.name)] : [],
  );

const SPRITE = read(join(LAB, "pictures/ui-icons.svg"));
const SYMBOLS = new Set([...SPRITE.matchAll(/<symbol id="([^"]+)"/g)].map((m) => m[1]));

test("the icon sprite is well formed and every symbol is named", () => {
  assert.ok(SYMBOLS.size >= 50, `expected a full icon set, found ${SYMBOLS.size}`);
  assert.ok(
    !/<script|href="https?:/i.test(SPRITE),
    "sprite must be self-contained and script-free",
  );
});

test("every icon() reference in the lab source resolves to a sprite symbol", () => {
  const files = walk(join(LAB, "src"), (n) => n.endsWith(".js"));
  const missing = [];
  for (const file of files) {
    const src = read(file);
    for (const m of src.matchAll(/\bicon\(\s*["']([a-z0-9-]+)["']/g))
      if (!SYMBOLS.has(m[1])) missing.push(`${relative(LAB, file)}: icon("${m[1]}")`);
    for (const m of src.matchAll(/ui-icons\.svg#([a-z0-9-]+)/g))
      if (!SYMBOLS.has(m[1])) missing.push(`${relative(LAB, file)}: #${m[1]}`);
  }
  // Names computed at run time (DOMAIN_META.icon, nav items) must also exist.
  const util = read(join(LAB, "src/util.js"));
  for (const m of util.matchAll(/icon:\s*"([a-z0-9-]+)"/g))
    if (!SYMBOLS.has(m[1])) missing.push(`util.js: ${m[1]}`);
  const nav = read(join(LAB, "src/nav.js"));
  for (const m of nav.matchAll(/(?:icon:|link\()\s*"([a-z0-9-]+)"/g))
    if (!SYMBOLS.has(m[1])) missing.push(`nav.js: ${m[1]}`);
  assert.deepEqual(missing, [], `unknown icons:\n${missing.join("\n")}`);
});

test("every CSS custom property the lab reads is defined somewhere in the lab styles", () => {
  const sheets = walk(LAB, (n) => n.endsWith(".css"));
  const text = sheets.map(read).join("\n");
  const defined = new Set([...text.matchAll(/(--[a-z0-9-]+)\s*:/gi)].map((m) => m[1]));
  const inline = walk(join(LAB, "src"), (n) => n.endsWith(".js"))
    .map(read)
    .join("\n");
  for (const m of inline.matchAll(/(--[a-z0-9-]+)\s*:/gi)) defined.add(m[1]);
  const undefinedVars = new Set();
  for (const m of text.matchAll(/var\(\s*(--[a-z0-9-]+)\s*(?:,[^)]*)?\)/gi))
    if (!defined.has(m[1]) && !/var\(\s*--[a-z0-9-]+\s*,/.test(m[0])) undefinedVars.add(m[1]);
  assert.deepEqual(
    [...undefinedVars],
    [],
    `undefined custom properties: ${[...undefinedVars].join(", ")}`,
  );
});

const hex = (h) => {
  const n = h.replace("#", "");
  return [0, 2, 4].map((i) => Number.parseInt(n.slice(i, i + 2), 16) / 255);
};
const lum = (h) => {
  const [r, g, b] = hex(h).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const ratio = (a, b) => {
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};
const token = (name) => {
  const m = read(join(LAB, "ds.css")).match(new RegExp(`${name}:\\s*(#[0-9a-fA-F]{6})`));
  assert.ok(m, `${name} must be a hex token in ds.css`);
  return m[1];
};

test("domain palette: white text on each fill and ink on white/tint meet WCAG AA (4.5:1)", () => {
  const failures = [];
  for (const d of ["listening", "reading", "speaking", "writing"]) {
    const fill = token(`--${d}`);
    const ink = token(`--${d}-ink`);
    const soft = token(`--${d}-soft`);
    const pairs = [
      [`white on --${d}`, "#ffffff", fill],
      [`--${d}-ink on white`, ink, "#ffffff"],
      [`--${d}-ink on --${d}-soft`, ink, soft],
    ];
    for (const [label, fg, bg] of pairs) {
      const r = ratio(fg, bg);
      if (r < 4.5) failures.push(`${label}: ${r.toFixed(2)}:1`);
    }
  }
  for (const [label, fg, bg] of [
    ["--ink on --bg", token("--ink"), token("--bg")],
    ["--ink-2 on white", token("--ink-2"), "#ffffff"],
    ["--ink-3 on white", token("--ink-3"), "#ffffff"],
    ["white on --brand", "#ffffff", token("--brand")],
    ["--brand-ink on white", token("--brand-ink"), "#ffffff"],
    ["--right on --right-soft", token("--right"), token("--right-soft")],
    ["--wrong on --wrong-soft", token("--wrong"), token("--wrong-soft")],
    ["--hint on --hint-soft", token("--hint"), token("--hint-soft")],
  ]) {
    const r = ratio(fg, bg);
    if (r < 4.5) failures.push(`${label}: ${r.toFixed(2)}:1`);
  }
  assert.deepEqual(failures, [], `contrast failures:\n${failures.join("\n")}`);
});

test("domain colours in the content files match the design tokens", () => {
  const want = {
    Listening: token("--listening"),
    Reading: token("--reading"),
    Speaking: token("--speaking"),
    Writing: token("--writing"),
  };
  for (const band of ["g3-5", "g6-8"])
    for (const [domain, color] of Object.entries(want)) {
      const data = JSON.parse(read(join(LAB, "content", band, `${domain}.json`)));
      assert.equal(
        String(data.color).toLowerCase(),
        color.toLowerCase(),
        `${band}/${domain} colour`,
      );
    }
});

test("fonts named in ds.css exist on disk", () => {
  const css = read(join(LAB, "ds.css"));
  const urls = [...css.matchAll(/url\((\/assets\/fonts\/[^)]+\.woff2)\)/g)].map((m) => m[1]);
  assert.ok(urls.length >= 6, "ds.css should declare Atkinson Hyperlegible and Fraunces");
  for (const url of urls)
    assert.ok(existsSync(join(REPO_ROOT, "public", url)), `${url} is missing from public/`);
});

test("illustrations are titled, small, script-free and self-contained", () => {
  const files = walk(join(LAB, "pictures/ds"), (n) => n.endsWith(".svg"));
  assert.ok(files.length >= 7, "expected the hero, four domain scenes and two state illustrations");
  for (const file of files) {
    const svg = read(file);
    const name = relative(LAB, file);
    assert.ok(/<title>[^<]+<\/title>/.test(svg), `${name} needs a <title>`);
    assert.ok(
      !/<script|<foreignObject|href="https?:|xlink:href="https?:/i.test(svg),
      `${name} must be self-contained`,
    );
    assert.ok(statSync(file).size < 24 * 1024, `${name} is over 24 KB`);
  }
});

const EMOJI = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B50}\u{2705}\u{274C}\u{2728}]/u;
test("no emoji is used as interface chrome in the lab source", () => {
  // Activity pictures and mission art are content (JSON and src/content); the shell and views are chrome.
  const files = [
    ...walk(join(LAB, "src"), (n) => n.endsWith(".js")).filter(
      (f) => !f.includes(`${join("src", "content")}`),
    ),
    join(LAB, "index.html"),
  ];
  const offenders = [];
  for (const file of files)
    read(file)
      .split("\n")
      .forEach((line, i) => {
        if (EMOJI.test(line))
          offenders.push(`${relative(LAB, file)}:${i + 1}: ${line.trim().slice(0, 90)}`);
      });
  assert.deepEqual(
    offenders,
    [],
    `emoji in interface source (use icon()):\n${offenders.join("\n")}`,
  );
});
