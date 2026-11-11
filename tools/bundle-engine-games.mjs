#!/usr/bin/env node
// Post-build: bundle each Machine Labs game in dist/ into ONE module file.
//
// Source stays modular (math/games/engines/core/*.js + <slug>/{game,render,
// math,strings}.js) so node tests import math.js directly and files stay small.
// dist/ is what Cloudflare Pages counts against its 20,000-file limit, and the
// site sits close to it, so in dist/ only each game's game.js becomes a single
// self-contained bundle and the modules it inlined are removed. index.html is
// untouched (it already loads ./game.js); core/page.css stays.
//
// Fails loudly: a bundle that does not parse, or a page left pointing at a file
// that no longer exists, exits 1 so `npm run build` stops.
//
// Usage: node tools/bundle-engine-games.mjs   (run by `npm run build`, after vite build)

import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync, rmSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { rolldown } from "rolldown";

const ROOT = resolve(fileURLToPath(new URL("..", import.meta.url)));
const SRC = join(ROOT, "math/games/engines");
const DIST = join(ROOT, "dist/math/games/engines");

if (!existsSync(DIST)) {
  console.error(`bundle-engine-games: ${DIST} is missing; run after the vite build.`);
  process.exit(1);
}

const slugs = readdirSync(SRC).filter((d) => d !== "core" && existsSync(join(SRC, d, "game.js")));
if (!slugs.length) {
  console.error("bundle-engine-games: no games found under math/games/engines/");
  process.exit(1);
}

let removed = 0;
for (const slug of slugs) {
  const out = join(DIST, slug, "game.js");
  const bundle = await rolldown({ input: join(SRC, slug, "game.js"), logLevel: "warn" });
  await bundle.write({ file: out, format: "esm", minify: false });
  await bundle.close();
  // The bundle must parse as a module on its own.
  execFileSync(process.execPath, ["--check", "--input-type=module"], { input: readFileSync(out) });
  for (const f of readdirSync(join(DIST, slug))) {
    if (f.endsWith(".js") && f !== "game.js") {
      rmSync(join(DIST, slug, f));
      removed++;
    }
  }
  const html = readFileSync(join(DIST, slug, "index.html"), "utf8");
  for (const m of html.matchAll(/(?:src|href)="(\.\.?\/[^"]+)"/g)) {
    const target = resolve(join(DIST, slug), m[1]);
    if (!existsSync(target)) {
      console.error(`bundle-engine-games: ${slug}/index.html points at missing ${m[1]}`);
      process.exit(1);
    }
  }
}
for (const f of readdirSync(join(DIST, "core"))) {
  if (f.endsWith(".js")) {
    rmSync(join(DIST, "core", f));
    removed++;
  }
}
const left = (dir) =>
  readdirSync(dir).reduce(
    (n, f) => n + (statSync(join(dir, f)).isDirectory() ? left(join(dir, f)) : 1),
    0,
  );
console.log(
  `bundle-engine-games: ${slugs.length} games bundled, ${removed} module files removed from dist/, ${left(DIST)} files remain under dist/math/games/engines/`,
);
