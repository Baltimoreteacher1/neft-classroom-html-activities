#!/usr/bin/env node
// Combine the lab's ordered stylesheets in dist only. The source links stay separate for
// editing and hash validation; the shipped shell makes one CSS request instead of 100+.
import { createHash } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

const root = process.cwd();
const dist = join(root, "dist/access-practice-lab");
const linkRE =
  /<link\b(?=[^>]*\brel="stylesheet")[^>]*\bhref="(\/access-practice-lab\/[^"?]+\.css)(?:\?[^"\s]*)?"[^>]*\/?\s*>/g;
const pages = ["index.html", "app-shell"];
const BUNDLE_DIR = "/access-practice-lab";
const ABSOLUTE_URL = /^(\/|https?:|data:|#)/;

// Top-level url() arguments only. A data: URL can hold its own url(%23id) (SVG fill refs),
// so quotes and nested parentheses are consumed instead of splitting on the first ")".
function cssUrls(source) {
  const urls = [];
  let i = source.indexOf("url(");
  while (i !== -1) {
    i += 4;
    while (/\s/.test(source[i])) i++;
    const quote = /["']/.test(source[i]) ? source[i++] : "";
    let depth = 0;
    const start = i;
    for (; i < source.length; i++) {
      const c = source[i];
      if (quote ? c === quote : c === ")" && depth === 0) break;
      if (!quote) depth += c === "(" ? 1 : c === ")" ? -1 : 0;
    }
    urls.push(source.slice(start, i).trim());
    i = source.indexOf("url(", i);
  }
  return urls;
}

const html = pages.map((name) => readFileSync(join(dist, name), "utf8"));
const links = [...html[0].matchAll(linkRE)];
if (links.length < 2)
  throw new Error("ACCESS CSS links are missing; refusing to bundle an incomplete shell");

for (const page of html) {
  const found = [...page.matchAll(linkRE)];
  if (found.map((m) => m[1]).join("\n") !== links.map((m) => m[1]).join("\n"))
    throw new Error("ACCESS app-shell and index.html have different stylesheet lists");
  if (found.some(([tag]) => /\b(?:media|title)=|\sdisabled\b/.test(tag)))
    throw new Error(
      "ACCESS stylesheet link has media/disabled/title; bundling would apply it always",
    );
  for (let i = 1; i < found.length; i++) {
    const between = page.slice(found[i - 1].index + found[i - 1][0].length, found[i].index);
    if (!/^\s*(?:<!--[\s\S]*?-->\s*)*$/.test(between))
      throw new Error(
        "ACCESS stylesheet links are not contiguous; bundling would change the cascade",
      );
  }
}

const css = links
  .map(([, href]) => {
    const path = join(root, "dist", href.slice(1));
    if (!existsSync(path)) throw new Error(`Missing ACCESS stylesheet: ${href}`);
    const source = readFileSync(path, "utf8");
    if (/@(?:import|charset)\b/.test(source))
      throw new Error(`Cannot concatenate imported CSS: ${href}`);
    // The bundle lives in the sheets' own directory, so relative URLs keep their base; only a
    // sheet from another directory would need rebasing.
    if (dirname(href) !== BUNDLE_DIR && cssUrls(source).some((url) => !ABSOLUTE_URL.test(url)))
      throw new Error(`Relative CSS URL needs rebasing: ${href}`);
    return `/* ${href} */\n${source}`;
  })
  .join("\n");
const hash = createHash("sha256").update(css).digest("hex").slice(0, 12);
// ?v=<sha256-12> is the lab's content-address: functions/access-practice-lab/[[path]].js checks the
// bytes against it before granting immutable caching, and the worker precaches the same URL.
const bundle = `/access-practice-lab/lab.styles.${hash}.css?v=${hash}`;
writeFileSync(join(dist, `lab.styles.${hash}.css`), css);
for (let i = 0; i < pages.length; i++) {
  const matches = [...html[i].matchAll(linkRE)];
  const first = matches[0];
  const last = matches.at(-1);
  const updated =
    html[i].slice(0, first.index) +
    `<link rel="stylesheet" href="${bundle}" />` +
    html[i].slice(last.index + last[0].length);
  writeFileSync(join(dist, pages[i]), updated);
}

// Install caches the app shell and its critical CSS before an offline visit. Since this
// bundle is made after source sync, add it to the shipped worker's core list here.
const workerPath = join(dist, "sw.js");
const worker = readFileSync(workerPath, "utf8");
if (!worker.includes("const PRECACHE_CORE = [\n"))
  throw new Error("ACCESS worker core cache marker missing");
writeFileSync(
  workerPath,
  worker.replace("const PRECACHE_CORE = [\n", `const PRECACHE_CORE = [\n  "${bundle}",\n`),
);
console.log(
  `bundle-access-styles: ${links.length} links → 1 request (${Buffer.byteLength(css)} bytes before compression)`,
);
