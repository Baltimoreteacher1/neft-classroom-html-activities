// Route facts for the ACCESS Learning Journey tools: what the lab really answers (src/main.js parseRoute), what the
// navigation links to (src/nav.js), and whether an href produced by src/journey/resources.js resolves.
// Used by tools/gen-journey-inventory.mjs (preservation checklist) and tools/access-journey-resources.test.mjs.
// Reads source text on purpose: importing main.js would pull in the whole app.
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { LAB_DIR } from "./access-lab-content.mjs";

export const BASE = "/access-practice-lab";
const read = (rel) => readFileSync(join(LAB_DIR, rel), "utf8");
const quoted = (s) => [...s.matchAll(/"([\w-]+)"/g)].map((m) => m[1]);

/** First path segments parseRoute answers, the content domains it resolves, and the Journey sub-routes. */
export function routeFacts() {
  const main = read("src/main.js");
  const body = main.slice(
    main.indexOf("export function parseRoute"),
    main.indexOf("const app = {"),
  );
  const roots = new Set();
  for (const m of body.matchAll(/\ba === "([\w-]+)"/g)) roots.add(m[1]);
  const list = /\[((?:"[\w-]+",?\s*)+)\]\.includes\(a\)/.exec(body);
  for (const r of quoted(list?.[1] || "")) roots.add(r);
  const domains = quoted(/const DOMAINS = \[([^\]]*)\]/.exec(main)?.[1] || "");
  const journey = read("src/views/journey.js");
  const sub = quoted(/\["map", "guide", "growth"\]/.exec(journey)?.[0] || "");
  return {
    roots: [...roots].sort(),
    domains,
    journeySub: [...new Set([...sub, "teacher"])].sort(),
  };
}

/** Every href the top navigation and the More menu render, without query strings, in order of first appearance. */
export async function navPaths(band = "6-8") {
  const [{ navHTML }, { makeI18n }, { toHtml }] = await Promise.all([
    import(join(LAB_DIR, "src/nav.js")),
    import(join(LAB_DIR, "src/i18n.js")),
    import(join(LAB_DIR, "src/util.js")),
  ]);
  const markup = toHtml(navHTML({ band, route: { view: "home" } }, makeI18n("en")));
  const seen = new Set();
  for (const m of markup.matchAll(/href="([^"]+)"/g)) {
    if (m[1].includes("ui-icons.svg")) continue;
    seen.add(m[1].replace(/\?.*$/, ""));
  }
  return [...seen];
}

/** What the content index says exists, for id checks: activities by domain/level, tests, studio task ids, games. */
export function contentFacts(index, gameIds) {
  const acts = new Set();
  for (const [band, B] of Object.entries(index.bands))
    for (const [domain, D] of Object.entries(B.domains))
      for (const [level, L] of Object.entries(D.levels))
        for (const [id] of L.activities) acts.add(`${band}|${domain}|${level}|${id}`);
  return {
    acts,
    tests: new Set(index.tests.map((t) => t.id)),
    speak: new Set(index.studio.speaking.map((t) => t.id)),
    write: new Set(index.studio.writing.map((t) => t.id)),
    games: new Set(gameIds),
  };
}

/** Why an href does NOT resolve, or null when it does. Mirrors parseRoute; ids are checked against the content. */
export function hrefProblem(href, facts, content) {
  const [path, query = ""] = href.split("?");
  const band = new URLSearchParams(query).get("grades") || "";
  const external = [
    "/access-teacher/",
    "/access-expedition/",
    "/access-family-expedition/",
    "/access-family-tour/",
  ];
  if (external.includes(path)) return null;
  if (!path.startsWith(`${BASE}/`)) return "not under the lab";
  const parts = path
    .slice(BASE.length + 1)
    .split("/")
    .filter(Boolean)
    .map(decodeURIComponent);
  const [a, b, c] = parts;
  if (!a) return null; // the lab home
  if (a === "paper-passport")
    return existsSync(join(LAB_DIR, path.slice(BASE.length + 1))) ? null : "file missing";
  if (facts.domains.includes(a) && a !== "Model-Test") {
    if (!b) return null;
    return content.acts.has(`${band}|${a}|${b}|${c}`)
      ? null
      : `no activity ${a}/${b}/${c} in band ${band}`;
  }
  if (!facts.roots.includes(a)) return `unknown first segment "${a}"`;
  if (a === "test") return content.tests.has(b) ? null : `no test ${b}`;
  if (a === "speak" && b) return content.speak.has(b) ? null : `no speaking task ${b}`;
  if (a === "write" && b) return content.write.has(b) ? null : `no writing task ${b}`;
  if (a === "games" && b) return content.games.has(b) ? null : `no game ${b}`;
  if (a === "journey" && b && !facts.journeySub.includes(b) && !/^m\d\d$/.test(b))
    return `bad journey path ${b}`;
  return null;
}
