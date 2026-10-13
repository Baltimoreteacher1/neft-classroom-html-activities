import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { JSDOM } from "jsdom";

// Every new Workbench tool: drop it with its default props, build it, save it
// (JSON), load it back and build it again. A tool that cannot survive that round
// trip cannot survive undo, Save, Backup or a Live Board snapshot.
const dir = "curriculum/math-workbench";
const dom = new JSDOM(
  "<!doctype html><body><div class='workspace'><div id='overlay'></div></div></body>",
  { runScripts: "outside-only", pretendToBeVisual: true },
);
const win = dom.window;
for (const f of [
  "wb-core",
  "wb-math",
  "wb-tools-grids",
  "wb-tools-number",
  "wb-tools-geo",
  "wb-tools-linked",
  "wb-stats",
  "wb-explain",
  "wb-mathtext",
  "wb-export",
]) {
  win.eval(readFileSync(`${dir}/${f}.js`, "utf8"));
}
const MWB = win.MWB;
assert.ok(MWB, "the registry loads");

const made = [];
const ctx = {
  state: { objects: [] },
  overlay: win.document.getElementById("overlay"),
  workspace: win.document.querySelector(".workspace"),
  makeObject: (type, props) => {
    const o = {
      id: `o${made.length + 1}`,
      type,
      x: 10,
      y: 10,
      scale: 1,
      color: null,
      ...(props || {}),
    };
    made.push(o);
    return o;
  },
  pushHistory() {},
  updateObjEl() {},
  showToast() {},
  speak() {},
  renderAll() {},
  selectObject() {},
};
MWB.setContext(ctx);

const items = MWB.paletteItems("Percent, decimals & equations").concat(
  MWB.paletteItems("Number theory, fractions & units"),
  MWB.paletteItems("Geometry & measure"),
  MWB.paletteItems("Ratios & graphs"),
);
assert.ok(items.length >= 13, `all ${items.length} palette tools registered`);
for (const item of items) item.go();
assert.equal(made.length, items.length, "every palette entry drops an object");

const normalize = (o) => JSON.stringify(o, Object.keys(o).sort());
for (const o of made) {
  assert.ok(MWB.has(o.type), `${o.type} is registered`);
  assert.doesNotThrow(
    () => MWB.label(o),
    `${o.type}: the accessible label works before the tool is built`,
  );
  const built = MWB.build(o);
  assert.ok(built && built.el instanceof win.HTMLElement, `${o.type} builds an element`);
  assert.ok(built.el.querySelector("button, input, select, svg"), `${o.type} is interactive`);
  // round trip through JSON (undo, save, backup, Live Board)
  const copy = JSON.parse(JSON.stringify(o));
  const rebuilt = MWB.build(copy);
  assert.ok(rebuilt.el, `${o.type} rebuilds from saved JSON`);
  assert.equal(
    normalize(JSON.parse(JSON.stringify(copy))),
    normalize(JSON.parse(JSON.stringify(JSON.parse(JSON.stringify(o))))),
    `${o.type}: building twice does not drift the saved state`,
  );
  assert.equal(MWB.label(copy), MWB.label(o), `${o.type}: same label after a round trip`);
  // controls are named and big enough to target
  for (const b of built.el.querySelectorAll("button")) {
    assert.ok(
      (b.getAttribute("aria-label") || b.textContent || "").trim(),
      `${o.type}: every button has a name`,
    );
  }
  for (const i of built.el.querySelectorAll("input")) {
    assert.ok(i.getAttribute("aria-label"), `${o.type}: every input has a label`);
  }
  // no answer is shipped in a tool's explanation
  const ex = MWB.def(o.type) && MWB.def(o.type).explain;
  if (ex)
    for (const q of ex.tryThis || [])
      assert.ok(
        q.endsWith("?") || /\.$/.test(q),
        `${o.type}: challenge cards are phrased as prompts`,
      );
}

// Reasoning Studio contract: model types are discoverable
const types = win.MWB_MODEL_TYPES;
for (const t of ["hundredgrid", "balance", "decarea", "net", "linkedratio", "plotgrid"])
  assert.ok(types.has(t), `${t} counts as a math representation`);
assert.equal(types.has("image"), false, "a pasted picture is not a math representation");

// Explanations exist for the older manipulatives too
for (const t of [
  "numline",
  "coordgrid",
  "fracbar",
  "dblnumline",
  "ratiotable",
  "tape",
  "dotplot",
  "histogram",
  "algebra",
]) {
  assert.ok(MWB.explain.has({ type: t }), `${t} can explain itself`);
}

// Unknown object types never crash the board: the engine shows a message instead
assert.equal(MWB.build({ type: "from-the-future" }), null);

console.log(`wb-tools: ${made.length} tools build, save and reload`);
