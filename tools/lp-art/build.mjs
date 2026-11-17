#!/usr/bin/env node
// Writes every Language Page activity picture from its scene script (tools/lp-art/scenes/*.mjs) and the shared kit.
//   node tools/lp-art/build.mjs                 write all
//   node tools/lp-art/build.mjs --only=a,b      write the named scenes (file stem, e.g. 35-reading-park)
//   node tools/lp-art/build.mjs --check         fail if any output differs from its scene
// A scene module exports default { file, w, h, title, draw }, where draw() returns the picture body.
import { readdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { resetIds, svg } from "./kit.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const OUT = join(here, "../../access-practice-lab/pictures");
const args = process.argv.slice(2);
const check = args.includes("--check");
const only = (args.find((a) => a.startsWith("--only=")) || "").slice(7).split(",").filter(Boolean);

const dir = join(here, "scenes");
const files = readdirSync(dir).filter((f) => f.endsWith(".mjs")).sort();
let stale = 0;
let wrote = 0;
for (const f of files) {
  const scene = (await import(pathToFileURL(join(dir, f)).href)).default;
  if (!scene?.file || !scene.draw) throw new Error(`${f}: missing file or draw()`);
  const stem = scene.file.replace(/\.svg$/, "").split("/").pop();
  if (only.length && !only.includes(stem)) continue;
  resetIds();
  const out = svg({ w: scene.w, h: scene.h, title: scene.title, body: scene.draw(), grain: scene.grain !== false });
  const target = join(OUT, scene.file);
  if (check) {
    if (!existsSync(target) || readFileSync(target, "utf8") !== out) {
      console.error(`stale: pictures/${scene.file} (run node tools/lp-art/build.mjs --only=${stem})`);
      stale++;
    }
    continue;
  }
  writeFileSync(target, out);
  wrote++;
}
if (check) {
  if (stale) process.exit(1);
  console.log(`lp-art: ${files.length} scenes current`);
} else console.log(`lp-art: wrote ${wrote} picture(s)`);
