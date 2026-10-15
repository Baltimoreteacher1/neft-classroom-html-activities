// Practice Studio figures: every figure the studios actually draw must be a valid, accessible, finite SVG.
//   node tools/studio-viz.test.mjs
// Covers (a) every `viz` spec authored in data/practice-studio/*.json and (b) every figure a generator emits
// across levels 1-4 and 20 seeds. A figure that throws, prints NaN/undefined, or fails to parse is a figure a
// student would see broken.
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { JSDOM } from "jsdom";
import { REPO_ROOT } from "./lib/curriculum-source.mjs";
import { loadStudio } from "./lib/studio-vm.mjs";

const ctx = loadStudio({ gen: true, viz: true });
const V = ctx.StudioViz;
assert.ok(V && typeof V.render === "function", "StudioViz.render exists");

const specs = [];
const walk = (x, where) => {
  if (Array.isArray(x)) return x.forEach((v, i) => walk(v, `${where}[${i}]`));
  if (!x || typeof x !== "object") return;
  if (x.viz) specs.push([where, x.viz]);
  for (const [k, v] of Object.entries(x)) if (k !== "viz") walk(v, `${where}.${k}`);
};
const dir = join(REPO_ROOT, "data/practice-studio");
for (const f of readdirSync(dir).filter((n) => /^\d/.test(n)))
  walk(JSON.parse(readFileSync(join(dir, f), "utf8")), f);
// every figure on every generated page, including the Connect pictures carried onto the mastery questions
for (const d of readdirSync(join(REPO_ROOT, "math/practice-studio")).filter((n) =>
  /^\d+-\d+$/.test(n),
))
  for (const sub of ["", "challenge/"]) {
    const html = readFileSync(
      join(REPO_ROOT, `math/practice-studio/${d}/${sub}index.html`),
      "utf8",
    );
    const m = /id="studio-data">([\s\S]*?)<\/script>/.exec(html);
    if (m) walk(JSON.parse(m[1]), `page ${d}/${sub}`);
  }
const authored = specs.length;
for (const id of ctx.StudioGen.ids())
  for (let level = 1; level <= 4; level++)
    for (let seed = 1; seed <= 20; seed++) {
      const item = ctx.StudioGen.make(id, level, seed);
      if (item.viz) specs.push([`gen ${id} L${level} #${seed}`, item.viz]);
    }
assert.ok(authored > 100, `expected 100+ authored figures, found ${authored}`);
assert.ok(specs.length > authored + 500, "generators should contribute hundreds of figures");

const types = new Set();
for (const [where, spec] of specs) {
  assert.ok(V.types.includes(spec.t), `${where}: unknown figure type "${spec.t}"`);
  types.add(spec.t);
  let svg;
  try {
    svg = V.render(JSON.parse(JSON.stringify(spec)));
  } catch (e) {
    assert.fail(`${where}: render threw ${e.message}`);
  }
  assert.ok(svg.startsWith("<svg"), `${where}: not an svg`);
  assert.ok(/viewBox="[^"]+"/.test(svg), `${where}: no viewBox`);
  assert.ok(/role="img"/.test(svg), `${where}: no role="img"`);
  assert.ok(/<title>[^<]{4,}<\/title>/.test(svg), `${where}: no text alternative`);
  assert.ok(
    !/NaN|undefined|Infinity|\[object/.test(svg),
    `${where}: prints a non-finite value: ${svg.match(/.{20}(NaN|undefined|Infinity|\[object).{20}/)?.[0]}`,
  );
  const dom = new JSDOM(svg, { contentType: "image/svg+xml" });
  assert.equal(
    dom.window.document.documentElement.nodeName.toLowerCase(),
    "svg",
    `${where}: does not parse as svg`,
  );
}
console.log(
  `studio-viz: ${specs.length} figures (${authored} authored) across ${types.size} types rendered cleanly.`,
);

// Histogram bars touch, even when the bins are written as inclusive pairs (20–24, 25–29).
{
  const svg = V.render({
    t: "hist",
    bins: [
      { from: 20, to: 24, n: 3 },
      { from: 25, to: 29, n: 5 },
      { from: 30, to: 34, n: 2 },
    ],
  });
  const rects = [...svg.matchAll(/<rect[^>]*class="[^"]*fb[^"]*"[^>]*>/g)].map((m) => {
    const g = (k) => Number(new RegExp(`${k}="([-\\d.]+)"`).exec(m[0])[1]);
    return { x: g("x"), w: g("width") };
  });
  assert.equal(rects.length, 3, "three bars");
  for (let i = 1; i < rects.length; i++)
    assert.ok(Math.abs(rects[i - 1].x + rects[i - 1].w - rects[i].x) < 0.01, "adjacent bars touch");
}
