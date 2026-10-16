// Balance Builder page contract: Joel's standing game rules (no timers, no hub links,
// no solution on a miss) run against THIS game's own files with the real detectors
// from tools/validate-game-rules.mjs, plus bilingual completeness, no-new-taxonomy,
// shared-runtime wiring and the "student writes every number" promise.
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { scan } from "../tools/validate-game-rules.mjs";
import { STRINGS, t } from "./strings.js";

const DIR = dirname(fileURLToPath(import.meta.url));
const ROOT = join(DIR, "..");
const files = readdirSync(DIR).filter((f) => /\.(html|js|css)$/.test(f) && !f.includes(".test."));
const read = (f) => readFileSync(join(DIR, f), "utf8");
const source = (ext) => files.filter((f) => f.endsWith(ext)).map((f) => [f, read(f)]);
const noComments = (text) => text.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");

test("the game folder has the files the page loads", () => {
  for (const f of ["index.html", "game.js", "balance.css", "balance-model.js", "puzzles.js", "share-code.js", "session.js", "editor.js", "view.js", "strings.js"]) {
    assert.ok(files.includes(f), f);
  }
  const page = read("index.html");
  for (const ref of page.matchAll(/(?:src|href)="(?!https?:|\/|#)([^"]+)"/g)) {
    assert.ok(files.includes(ref[1].split("?")[0]), `index.html points at missing ${ref[1]}`);
  }
});

test("validate-game-rules detectors find nothing in any game file", () => {
  for (const [name, text] of [...source(".html"), ...source(".js")]) {
    assert.deepEqual(scan(text), [], `${name}: ${JSON.stringify(scan(text))}`);
  }
});

test("no clock anywhere: the game cannot time a student", () => {
  const banned = /\b(setInterval|requestAnimationFrame|Date\.now|performance\.now|new Date)\b/;
  for (const [name, text] of source(".js")) assert.doesNotMatch(text, banned, name);
  const strings = JSON.stringify(STRINGS);
  assert.doesNotMatch(strings, /\b(countdown|seconds? left|time left|hurry|beat the clock|race against)\b/i);
  assert.match(STRINGS.en.studioHelp[0], /no timer/i);
});

test("the page has no link to a hub, the games catalog or the curriculum", () => {
  const page = read("index.html");
  assert.doesNotMatch(page, /href="\/(?:curriculum|math|games)[^"]*"/);
  assert.doesNotMatch(read("game.js"), /location\.(href|assign|replace)/);
});

test("no third-party code or network call is added by the game", () => {
  for (const [name, text] of [...source(".html"), ...source(".js"), ...source(".css")]) {
    assert.doesNotMatch(text, /https?:\/\/(?!www\.w3\.org)/, name);
  }
  const net = source(".js").filter(([, text]) => /globalThis\.fetch|\bfetch\(|XMLHttpRequest|sendBeacon|WebSocket/.test(text)).map(([n]) => n);
  assert.deepEqual(net, ["labels.js"], "only the shared labels file is fetched, same origin");
  assert.match(read("labels.js"), /"\/data\/misconception-labels\.json"/);
});

test("English and Spanish have exactly the same keys, and Spanish is not English copied over", () => {
  const en = Object.keys(STRINGS.en).sort();
  const es = Object.keys(STRINGS.es).sort();
  assert.deepEqual(es, en);
  for (const key of en) {
    const a = STRINGS.en[key];
    const b = STRINGS.es[key];
    assert.equal(Array.isArray(a), Array.isArray(b), key);
    if (Array.isArray(a)) assert.equal(a.length, b.length, key);
    const placeholders = (s) => [...String(s).matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort().join(",");
    assert.equal(placeholders(Array.isArray(a) ? a.join(" ") : a), placeholders(Array.isArray(b) ? b.join(" ") : b), `${key} placeholders differ`);
    const one = Array.isArray(a) ? a.join(" ") : a;
    const two = Array.isArray(b) ? b.join(" ") : b;
    if (one.length > 18 && !/^[\d\W]+$/.test(one)) assert.notEqual(one, two, `${key} is not translated`);
  }
});

test("every string the code asks for exists", () => {
  const keys = new Set(Object.keys(STRINGS.en));
  const asked = new Set();
  for (const [, raw] of [...source(".js"), ...source(".html")]) {
    const text = noComments(raw);
    for (const m of text.matchAll(/\bt\((?:app\.lang|lang|api\.lang\(\)),\s*"([\w.]+)"/g)) asked.add(m[1]);
    for (const m of text.matchAll(/data-t(?:-label|-ph|-title)?="([\w.]+)"/g)) asked.add(m[1]);
  }
  for (const m of read("game.js").matchAll(/(?:setFeedback\(\s*t\(app\.lang,\s*)"([\w.]+)"/g)) asked.add(m[1]);
  for (const key of asked) assert.ok(keys.has(key), `missing string: ${key}`);
  for (const level of [1, 2, 3, 4]) {
    for (const k of [`level${level}`, `level${level}Desc`]) assert.ok(keys.has(k), k);
  }
  for (const code of ["range", "noVariable", "sameCoefficient", "noWholeAnswer", "negativeAnswer", "alreadySolved", "tiltDirection", "shape"]) {
    assert.ok(keys.has(`err.${code}`), `err.${code}`);
  }
  for (const reason of ["length", "chars", "checksum", "invalid"]) assert.ok(keys.has(`code.${reason}`), `code.${reason}`);
  for (const coach of ["arith", "bothSides", "partial", "signLost", "givenNumber", "relFlip", "relStrict", "sameOp", "wrongFamily", "graphDirection", "graphCircle", "graphBoth"]) {
    assert.ok(keys.has(`coach.${coach}`), `coach.${coach}`);
  }
  const hintKeys = [...read("hints.js").matchAll(/"(hint[A-Z]\w+)"/g)].map((m) => m[1]);
  assert.ok(hintKeys.length >= 9, "hint keys found in hints.js");
  for (const key of hintKeys) assert.ok(keys.has(key), key);
  for (const reason of ["unreadable", "combine", "needRel", "tooBig", "needAmount", "needPositive", "noZeroAmount", "noVariableScale"]) {
    assert.ok(keys.has(reason), reason);
  }
});

test("no coaching or hint string contains a placeholder for a result", () => {
  const resultSlots = /\{(value|answer|solution|result|n)\}/;
  for (const lang of ["en", "es"]) {
    for (const [key, text] of Object.entries(STRINGS[lang])) {
      if (!/^(coach\.|hint|err\.|needs?|unreadable|combine|tooBig|notBalanced|side(Ok|Off)|prove(Bad))/.test(key)) continue;
      assert.doesNotMatch(String(text), resultSlots, `${lang} ${key} could print a value`);
    }
  }
});

test("a wrong answer never prints the worked solution: miss paths build no solved text", () => {
  const game = read("game.js");
  const wrong = game.slice(game.indexOf("function wrongEntryText"), game.indexOf("function onEntry"));
  assert.doesNotMatch(wrong, /"solved"|value|answer|expected/);
  const model = read("balance-model.js");
  const check = model.slice(model.indexOf("export function checkEntry"));
  assert.doesNotMatch(check.replace(/\/\*\*[\s\S]*?\*\//g, ""), /expected:|want:\s*\w+\s*,\s*\n\s*\}/);
});

test("every misconception tag in the source is in the shared taxonomy (no new tags)", async () => {
  const labels = JSON.parse(readFileSync(join(ROOT, "data/misconception-labels.json"), "utf8")).tags;
  const { MISCONCEPTIONS } = await import("@eduwonderlab/engine/core/misconceptions.js");
  const used = new Set();
  const re = /["']((?:equation|inequality|algebra-distributive)-[a-z-]+|sign-dropped)["']/g;
  for (const [, text] of source(".js")) for (const m of text.matchAll(re)) used.add(m[1]);
  assert.ok(used.size >= 7, `found only ${used.size} tags`);
  for (const tag of used) {
    assert.ok(labels[tag], `${tag} is not in data/misconception-labels.json`);
    assert.ok(MISCONCEPTIONS[tag], `${tag} is not in engine/core/misconceptions.js`);
  }
});

test("shared runtime is wired: game toolbar, score, signal, save/resume, language key", () => {
  const page = read("index.html");
  for (const needle of ["/assets/game-studio.js", "/assets/game-studio.css", "/assets/game-score.js", "/assets/nt-signal.js", "/shared/save-resume/save-resume-engine.js", "/assets/canvas-bridge.js"]) {
    assert.ok(page.includes(needle), needle);
  }
  const game = read("game.js");
  for (const needle of ["registerStateProvider", "registerStateRestorer", "NeftScore", "NTSignal", "GameStudio", '"nt-lang"', "ewl:lang"]) {
    assert.ok(game.includes(needle), needle);
  }
});

test("injected layers stay balanced and in place", () => {
  const page = read("index.html");
  const begins = [...page.matchAll(/<!-- ([\w-]+)-injected:begin/g)].map((m) => m[1]).sort();
  const ends = [...page.matchAll(/<!-- ([\w-]+)-injected:end/g)].map((m) => m[1]).sort();
  assert.deepEqual(begins, ends);
  for (const layer of ["mobile-access", "uifr", "nsr", "mwb", "canvas-bridge", "nt-chrome"]) assert.ok(begins.includes(layer), layer);
});

test("every field a student types into opts out of the generic save sweep", () => {
  const html = [read("index.html"), read("editor.js")].join("\n");
  for (const tag of html.match(/<input\b[^>]*>/g) ?? []) {
    if (/type="radio"/.test(tag)) continue;
    assert.match(tag, /data-nsr-ignore/, tag);
  }
  assert.match(read("view.js"), /data-nsr-ignore/);
});

test("the editor accepts numbers, one letter and one symbol from fixed lists, never free text", () => {
  const editor = read("editor.js");
  const inputs = editor.match(/<input\b[^>]*>/g) ?? [];
  assert.ok(inputs.some((i) => /id="ed-code"/.test(i)));
  for (const tag of inputs) {
    if (/id="ed-code"/.test(tag)) assert.match(tag, /maxlength="16"/);
    else assert.match(tag, /type="number"/, tag);
  }
  assert.match(editor, /<select id="ed-rel"/);
  assert.match(editor, /<select id="ed-var"/);
});

test("the page names its own purpose in English and nothing is a placeholder", () => {
  const page = read("index.html");
  assert.match(page, /<title>Balance Builder/);
  assert.match(page, /<html lang="en">/);
  assert.doesNotMatch([...source(".html"), ...source(".js")].map(([, x]) => x).join("\n"), /lorem ipsum|\bTODO\b|\bFIXME\b/);
  assert.equal(t("es", "title"), "Constructor de balanzas");
});
