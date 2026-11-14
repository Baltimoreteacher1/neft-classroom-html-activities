#!/usr/bin/env node
/**
 * Inventory of the ACCESS Practice Lab: every route, every activity, every CSS
 * file with bytes, and which CSS files nothing references.
 *
 *   node tools/access-lab-inventory.mjs [--out=reports/language-page/inventory.json]
 *
 * Fields the catalog does not carry (standard, Key Language Use, language
 * function, language dimension, proficiency range) are null here. They are
 * filled by the P4A metadata sidecar, never by editing activities.
 */
import { mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { gzipSync } from "node:zlib";
import { allActivities, LAB_DIR } from "./lib/access-lab-content.mjs";

const out = (
  process.argv.find((a) => a.startsWith("--out=")) || "--out=reports/language-page/inventory.json"
).slice(6);

const mainJs = readFileSync(join(LAB_DIR, "src/main.js"), "utf8");
const loaders = [...mainJs.matchAll(/^\s+"?([a-z0-9-]+)"?: \(\) => import\("([^"]+)"\)/gm)].map(
  (m) => ({
    route: m[1],
    module: m[2],
  }),
);
const aliases = Object.fromEntries(
  [
    ...(mainJs.match(/const VIEW_ALIASES = \{([\s\S]*?)\};/)?.[1] || "").matchAll(
      /"?([a-z-]+)"?: "([a-z-]+)"/g,
    ),
  ].map((m) => [m[1], m[2]]),
);

const walk = (dir, filter, acc = []) => {
  for (const name of readdirSync(dir)) {
    if (name === "node_modules" || name === "audio" || name === "pictures") continue;
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, filter, acc);
    else if (filter(p)) acc.push(p);
  }
  return acc;
};

const cssFiles = readdirSync(LAB_DIR).filter((f) => f.endsWith(".css"));
const referrers = walk(LAB_DIR, (p) => /\.(html|js|css|json)$/.test(p)).map((p) => [
  p,
  readFileSync(p, "utf8"),
]);
const css = cssFiles.map((file) => {
  const buf = readFileSync(join(LAB_DIR, file));
  const users = referrers
    .filter(([p, text]) => !p.endsWith(`/${file}`) && text.includes(file))
    .map(([p]) => p.slice(LAB_DIR.length + 1));
  return {
    file,
    bytes: buf.length,
    gzip: gzipSync(buf).length,
    referencedBy: users.length,
    dead: users.length === 0,
  };
});

const activities = allActivities().map(({ band, domain, level, activity: a }) => ({
  id: a.id,
  band,
  domain,
  level,
  type: a.type,
  minutes: Number.parseInt(a.time, 10) || null,
  canDo: a.wida || [],
  standard: null,
  keyLanguageUse: null,
  scaffolds: ["hint", "frames", "wordBank", "vocabulary", "directionsEs"].filter(
    (k) => a[k] && a[k].length,
  ),
  audio: Boolean(a.script || a.segments || a.listening),
  images: Boolean(
    a.picture || a.chart || a.table || a.scene || (a.options || []).some((o) => o.visual),
  ),
}));

const report = {
  routes: { count: loaders.length, aliases, loaders },
  css: {
    count: css.length,
    bytes: css.reduce((n, c) => n + c.bytes, 0),
    gzip: css.reduce((n, c) => n + c.gzip, 0),
    dead: css.filter((c) => c.dead).map((c) => c.file),
    files: css,
  },
  activities: { count: activities.length, rows: activities },
};
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, `${JSON.stringify(report, null, 1)}\n`);
console.log(
  `inventory: ${report.routes.count} routes, ${report.activities.count} activities, ${css.length} CSS files (${report.css.bytes} B raw, ${report.css.gzip} B gzip), ${report.css.dead.length} unreferenced`,
);
