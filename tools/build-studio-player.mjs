#!/usr/bin/env node
/**
 * Bundles the Activity Studio student player into one classic script and one stylesheet:
 *   access-practice-lab/src/studio/player/index.js (+ imports, incl. ../core/*) -> access-practice-lab/player/studio-player.js
 *   access-practice-lab/src/studio/player/*.css                               -> access-practice-lab/player/studio-player.css
 *
 * Modules are ordered topologically, `import`/`export` syntax is stripped and everything is wrapped in one IIFE that
 * exposes `window.StudioPlayer = { mountPlayer }`. The build FAILS on a top-level name that two modules both declare
 * (stripping imports puts every module in one scope), on an import that is not exported, and on import/export forms
 * it does not handle (default, namespace, `as`, dynamic). Deterministic: a second run changes nothing.
 *
 *   node tools/build-studio-player.mjs          write the outputs
 *   node tools/build-studio-player.mjs --check  exit 1 when the outputs are stale
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
// STUDIO_PLAYER_SRC / STUDIO_PLAYER_OUT redirect the build (the tests build throwaway copies); normal runs use neither.
const SRC = process.env.STUDIO_PLAYER_SRC || join(ROOT, "access-practice-lab/src/studio");
const ENTRY = join(SRC, "player/index.js");
const CSS_FILES = ["player.css", "formats.css", "games.css"].map((f) => join(SRC, "player", f));
const OUT_DIR = process.env.STUDIO_PLAYER_OUT || join(ROOT, "access-practice-lab/player");
const OUT_JS = join(OUT_DIR, "studio-player.js");
const OUT_CSS = join(OUT_DIR, "studio-player.css");
const ALLOWED = [join(SRC, "player"), join(SRC, "core")];

const fail = (msg) => {
  console.error(`build-studio-player: ${msg}`);
  process.exit(1);
};
const rel = (p) => relative(ROOT, p);

const IMPORT = /^import\s+([^;]*?)\s+from\s+"([^"]+)";?[ \t]*$/gms;

/** Parse one module: its imports, exported names, top-level declarations and stripped body. */
function parseModule(file) {
  if (!ALLOWED.some((dir) => file.startsWith(`${dir}/`)))
    fail(`${rel(file)} is outside the player and core folders`);
  let src = readFileSync(file, "utf8");
  if (/^\s*import\s*\(/m.test(src) || /\bimport\.meta\b/.test(src))
    fail(`${rel(file)}: dynamic import / import.meta`);
  if (/^import\s+["']/m.test(src)) fail(`${rel(file)}: side-effect import`);
  const imports = [];
  src = src.replace(IMPORT, (_, clause, from) => {
    const m = /^\{([^}]*)\}$/s.exec(clause.trim());
    if (!m) fail(`${rel(file)}: only named imports are supported (got "${clause.trim()}")`);
    const names = m[1]
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    if (names.some((n) => /\s/.test(n)))
      fail(`${rel(file)}: import aliases ("as") are not supported`);
    if (!from.startsWith(".")) fail(`${rel(file)}: bare import "${from}"`);
    imports.push({ from: resolve(dirname(file), from), names });
    return "";
  });
  if (/^import\s/m.test(src)) fail(`${rel(file)}: unparsed import statement`);
  if (/^export\s+default\b/m.test(src) || /^export\s+\*/m.test(src))
    fail(`${rel(file)}: default / star export`);
  const exported = new Set();
  src = src.replace(/^export\s+\{([^}]*)\};?[ \t]*$/gms, (_, list) => {
    for (const n of list
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)) {
      if (/\s/.test(n)) fail(`${rel(file)}: export alias "${n}"`);
      exported.add(n);
    }
    return "";
  });
  const declared = [];
  src = src.replace(
    /^export\s+((?:async\s+)?function\s*\*?\s*|const\s+|let\s+|var\s+|class\s+)(\w+)/gm,
    (_, kw, name) => {
      exported.add(name);
      return `${kw}${name}`;
    },
  );
  for (const m of src.matchAll(/^(?:async\s+)?function\s*\*?\s*(\w+)/gm)) declared.push(m[1]);
  for (const m of src.matchAll(/^(?:const|let|var|class)\s+(\w+)/gm)) declared.push(m[1]);
  if (/^(?:const|let|var)\s*[[{]/m.test(src))
    fail(`${rel(file)}: top-level destructuring is not supported`);
  return { file, imports, exported, declared, body: src.replace(/\n{3,}/g, "\n\n").trim() };
}

function collect() {
  const mods = new Map();
  const order = [];
  const visit = (file, via) => {
    if (mods.has(file)) return;
    if (!existsSync(file)) fail(`${rel(via)} imports missing file ${rel(file)}`);
    const mod = parseModule(file);
    mods.set(file, mod);
    for (const imp of mod.imports) visit(imp.from, file);
    order.push(mod);
  };
  visit(ENTRY, ENTRY);
  for (const mod of order)
    for (const imp of mod.imports)
      for (const name of imp.names)
        if (!mods.get(imp.from).exported.has(name))
          fail(`${rel(mod.file)} imports "${name}" which ${rel(imp.from)} does not export`);
  const owner = new Map();
  for (const mod of order)
    for (const name of mod.declared) {
      if (owner.has(name))
        fail(
          `top-level name "${name}" is declared in both ${rel(owner.get(name))} and ${rel(mod.file)}`,
        );
      owner.set(name, mod.file);
    }
  if (!mods.get(ENTRY).exported.has("mountPlayer")) fail("index.js must export mountPlayer");
  return order;
}

function build() {
  const parts = collect().map((m) => `// ── ${relative(SRC, m.file)}\n${m.body}`);
  const js = `// GENERATED by tools/build-studio-player.mjs from access-practice-lab/src/studio/player/index.js. Do not edit.
(() => {
"use strict";
${parts.join("\n\n")}

window.StudioPlayer = { mountPlayer };
})();
`;
  const css = `/* GENERATED by tools/build-studio-player.mjs from access-practice-lab/src/studio/player/*.css. Do not edit. */\n${CSS_FILES.map((f) => readFileSync(f, "utf8").trim()).join("\n\n")}\n`;
  return { js, css };
}

const out = build();
const same = (file, text) => existsSync(file) && readFileSync(file, "utf8") === text;
if (process.argv.includes("--check")) {
  const stale = [
    [OUT_JS, out.js],
    [OUT_CSS, out.css],
  ]
    .filter(([f, t]) => !same(f, t))
    .map(([f]) => rel(f));
  if (stale.length) {
    console.error(
      `build-studio-player: stale output (run node tools/build-studio-player.mjs): ${stale.join(", ")}`,
    );
    process.exit(1);
  }
  console.log("build-studio-player: outputs are current");
} else {
  mkdirSync(OUT_DIR, { recursive: true });
  let changed = 0;
  for (const [file, text] of [
    [OUT_JS, out.js],
    [OUT_CSS, out.css],
  ]) {
    if (same(file, text)) continue;
    writeFileSync(file, text);
    changed++;
  }
  console.log(
    `build-studio-player: ${changed ? `wrote ${changed} file(s)` : "no changes"} (${(out.js.length / 1024).toFixed(0)} KB js, ${(out.css.length / 1024).toFixed(0)} KB css)`,
  );
}
