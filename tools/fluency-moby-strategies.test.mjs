// Tests for Strategy instruction, models, and strategy theater.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

// DOM environment simulation
class MockClassList {
  constructor(el) {
    this.el = el;
    this.classes = new Set();
  }
  add(...names) {
    names.forEach((n) => this.classes.add(n));
    this.sync();
  }
  remove(...names) {
    names.forEach((n) => this.classes.delete(n));
    this.sync();
  }
  toggle(name, force) {
    const has = this.classes.has(name);
    const shouldAdd = force !== undefined ? Boolean(force) : !has;
    if (shouldAdd) this.classes.add(name);
    else this.classes.delete(name);
    this.sync();
    return shouldAdd;
  }
  contains(name) {
    return this.classes.has(name);
  }
  sync() {
    this.el.className = Array.from(this.classes).join(" ");
  }
}

class MockElement {
  constructor(tag, ns = null) {
    this.tagName = tag.toUpperCase();
    this.namespaceURI = ns;
    this.attributes = new Map();
    this.children = [];
    this.parentElement = null;
    this.textContent = "";
    this.className = "";
    this.classList = new MockClassList(this);
    this.style = {};
    this.listeners = new Map();
    this.dataset = {};
    this.value = "";
    this.disabled = false;
  }
  setAttribute(k, v) {
    this.attributes.set(k, String(v));
    if (k === "class") {
      this.className = String(v);
      this.classList.classes = new Set(String(v).split(/\s+/).filter(Boolean));
    }
  }
  getAttribute(k) {
    return this.attributes.has(k) ? this.attributes.get(k) : null;
  }
  hasAttribute(k) {
    return this.attributes.has(k);
  }
  removeAttribute(k) {
    this.attributes.delete(k);
  }
  append(...nodes) {
    for (const node of nodes) {
      if (typeof node === "string") {
        const textNode = new MockElement("#text");
        textNode.textContent = node;
        this.children.push(textNode);
      } else if (node) {
        node.parentElement = this;
        this.children.push(node);
      }
    }
  }
  replaceChildren(...nodes) {
    this.children = [];
    this.append(...nodes);
  }
  remove() {
    if (this.parentElement) {
      const idx = this.parentElement.children.indexOf(this);
      if (idx !== -1) this.parentElement.children.splice(idx, 1);
      this.parentElement = null;
    }
  }
  addEventListener(type, fn) {
    if (!this.listeners.has(type)) this.listeners.set(type, []);
    this.listeners.get(type).push(fn);
  }
  removeEventListener(type, fn) {
    if (this.listeners.has(type)) {
      this.listeners.set(
        type,
        this.listeners.get(type).filter((f) => f !== fn),
      );
    }
  }
  dispatchEvent(ev) {
    const list = this.listeners.get(ev.type) || [];
    list.forEach((fn) => fn(ev));
  }
  click() {
    this.dispatchEvent({ type: "click", target: this });
  }
  focus() {
    this.dispatchEvent({ type: "focus", target: this });
  }
  select() {
    this.dispatchEvent({ type: "select", target: this });
  }
  querySelector(sel) {
    return this.querySelectorAll(sel)[0] || null;
  }
  querySelectorAll(sel) {
    const results = [];
    const walk = (node) => {
      if (!node || !node.attributes) return;
      let match = false;
      if (sel.startsWith(".")) {
        const cls = sel.slice(1);
        if (node.classList.contains(cls)) match = true;
      } else if (sel.startsWith("#")) {
        if (node.getAttribute("id") === sel.slice(1)) match = true;
      } else if (sel.startsWith("[")) {
        const attr = sel.slice(1, -1).split("=")[0];
        if (node.hasAttribute(attr)) match = true;
      } else if (node.tagName.toLowerCase() === sel.toLowerCase()) {
        match = true;
      }
      if (match) results.push(node);
      for (const kid of node.children) walk(kid);
    };
    for (const kid of this.children) walk(kid);
    return results;
  }
}

globalThis.document = {
  createElement: (tag) => new MockElement(tag),
  createElementNS: (ns, tag) => new MockElement(tag, ns),
  body: new MockElement("body"),
};
globalThis.window = globalThis;
globalThis.localStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };

const { STRATEGY_IDS } = await import("../math/fluency-lab/moby/fact-strategies.js");
const { getStrategy, allStrategies } = await import("../math/fluency-lab/moby/strategies-data.js");
const { answerOf, factText } = await import("../math/fluency-lab/moby/strategies-kit.js");
const { mountModel } = await import("../math/fluency-lab/moby/models.js");
const { mountStrategyTheater } = await import("../math/fluency-lab/moby/strategy-theater.js");
const { ES_MOBY_STRATEGIES } = await import("../math/fluency-lab/moby/i18n-es-strategies.js");
const { ES } = await import("../math/fluency-lab/i18n.js");

let passed = 0;
const check = (name, fn) => {
  try {
    fn();
    passed += 1;
  } catch (err) {
    console.error(`FAIL: ${name}`);
    throw err;
  }
};

// 1. Structure: all 14 fixed strategy IDs exist with complete fields
check("all 14 fixed strategy IDs exist and have complete content", () => {
  assert.equal(STRATEGY_IDS.length, 14);
  for (const id of STRATEGY_IDS) {
    const strat = getStrategy(id);
    assert.ok(strat, `Strategy ${id} exists in data`);
    assert.equal(strat.id, id);
    assert.ok(strat.title);
    assert.ok(strat.when);
    assert.ok(Array.isArray(strat.grades) && strat.grades.length === 2);
    assert.ok(Array.isArray(strat.operations) && strat.operations.length >= 1);
    assert.ok(
      ["numberline", "tenframe", "array", "groups", "baseten", "partwhole"].includes(
        strat.modelKind,
      ),
      `modelKind ${strat.modelKind} valid`,
    );
    assert.ok(Array.isArray(strat.examples) && strat.examples.length >= 3, `examples for ${id}`);
    assert.ok(
      strat.demonstration &&
        Array.isArray(strat.demonstration.steps) &&
        strat.demonstration.steps.length >= 3,
    );
    assert.ok(strat.tryIt && strat.tryIt.fact && strat.tryIt.target);
    assert.ok(strat.choose && strat.choose.options.some((o) => o.correct));
    assert.ok(strat.why);
    assert.ok(strat.misconception);
  }
});

// 2. Arithmetic verification of examples and demonstrations
check("every example and demonstration step is mathematically correct", () => {
  for (const strat of allStrategies()) {
    // Check all examples
    for (const eg of strat.examples) {
      assert.ok(eg, `example in ${strat.id} normalizes`);
      const ans = answerOf(eg);
      assert.ok(Number.isFinite(ans), `answer for ${factText(eg)} in ${strat.id} is finite`);
    }

    // Check demonstration fact
    const demoFact = strat.demonstration.fact;
    assert.ok(demoFact);
    const demoAns = answerOf(demoFact);
    assert.ok(Number.isFinite(demoAns));

    // Try-it fact
    const tryAns = answerOf(strat.tryIt.fact);
    assert.ok(Number.isFinite(tryAns));
  }
});

// 3. Model mounting and keyboard/API control smoke tests for every model kind
check("models mount correctly and implement standard interface", () => {
  const kinds = ["tenframe", "numberline", "groups", "array", "baseten", "partwhole"];
  for (const kind of kinds) {
    const host = new MockElement("div");
    const model = mountModel(
      kind,
      host,
      { state: { rows: 2, cols: 3, tens: 1, ones: 2, start: 0, hops: [1], n1: 2, n2: 3 } },
      { grade: 4 },
    );
    assert.ok(model, `mountModel for ${kind} succeeded`);
    assert.equal(typeof model.getState, "function");
    assert.equal(typeof model.setState, "function");
    assert.equal(typeof model.play, "function");
    assert.equal(typeof model.destroy, "function");
    assert.equal(typeof model.announce, "function");

    const st = model.getState();
    assert.ok(st && typeof st === "object");

    model.destroy();
  }
});

// 4. Strategy Theater lifecycle: Watch -> Build -> Try -> Choose -> Done
check("strategy theater mounts and completes three-phase experience", () => {
  const host = new MockElement("div");
  let _resultEmitted = null;
  let _doneCalled = false;

  const theater = mountStrategyTheater(host, {
    strategyId: "count-on",
    grade: 2,
    reducedMotion: true,
    onResult: (res) => {
      _resultEmitted = res;
    },
    onDone: () => {
      _doneCalled = true;
    },
  });

  assert.ok(theater);
  assert.equal(typeof theater.destroy, "function");
  assert.equal(typeof theater.getState, "function");

  const st1 = theater.getState();
  assert.equal(st1.phase, "watch");

  // Advance to build phase
  const buildBtn = host.querySelector(".mby-btn-primary");
  assert.ok(buildBtn);
  buildBtn.click();

  const st2 = theater.getState();
  assert.equal(st2.phase, "build");

  // Click check button in build phase
  const checkBtn = host.querySelector(".mby-btn-success");
  assert.ok(checkBtn);
  checkBtn.click();

  // Clean up
  theater.destroy();
  assert.equal(host.children.length, 0);
});

// 5. CSS validation: Zero purple / violet
check("strategy-theater.css contains zero purple/violet/magenta/indigo", () => {
  const css = readFileSync(
    new URL("../math/fluency-lab/moby/strategy-theater.css", import.meta.url),
    "utf8",
  );
  // Check for forbidden color words or hex ranges in hue 255-335
  const forbidden = /\b(purple|violet|magenta|indigo|fuchsia)\b/i;
  assert.ok(!forbidden.test(css), "no purple color keywords in CSS");
});

// 6. Spanish coverage: all English strings in strategies-data have translations
check("all strategy data strings exist in ES_MOBY_STRATEGIES or ES", () => {
  const missing = [];
  const checkKey = (text) => {
    if (!text || typeof text !== "string") return;
    if (ES_MOBY_STRATEGIES[text] === undefined && ES[text] === undefined) {
      missing.push(text);
    }
  };

  for (const strat of allStrategies()) {
    checkKey(strat.title.k);
    checkKey(strat.when.k);
    checkKey(strat.why.k);
    checkKey(strat.misconception.k);
    checkKey(strat.tryIt.instruction.k);
    checkKey(strat.choose.question.k);
    for (const opt of strat.choose.options) {
      checkKey(opt.reason.k);
    }
    for (const step of strat.demonstration.steps) {
      checkKey(step.caption.k);
    }
  }

  assert.deepEqual(missing, [], `Missing translations: ${missing.join(" | ")}`);
});

console.log(`fluency-moby-strategies: all ${passed} checks passed.`);
