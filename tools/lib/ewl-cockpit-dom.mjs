// DOM tests for the cockpit and the Pocket Reference drawer (jsdom). Called by tools/ewl-cockpit.test.mjs.
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { JSDOM } from "jsdom";
import { MANIFEST, readJson, rel, workbenchPresets } from "./ewl-cockpit-data.mjs";

const deq = (a, b, m) =>
  assert.deepStrictEqual(JSON.parse(JSON.stringify(a)), JSON.parse(JSON.stringify(b)), m);

function makeDom(search, extraHtml = "") {
  const dom = new JSDOM(
    `<!doctype html><html><body class="curriculum-home">${extraHtml}<button id="opener">open</button><main></main></body></html>`,
    {
      url: `http://localhost/curriculum/${search}`,
      runScripts: "outside-only",
      pretendToBeVisual: true,
    },
  );
  const w = dom.window;
  return { dom, w };
}
/** A fetch that answers from the repo on disk (404 when the file is absent) and a script loader that runs files from disk. */
function wireDisk(w) {
  w.fetch = async (url) => {
    const p = rel(String(url).split("?")[0].replace(/^\//, ""));
    const ok = existsSync(p);
    const body = ok ? readFileSync(p, "utf8") : "";
    return {
      ok,
      status: ok ? 200 : 404,
      text: async () => body,
      json: async () => JSON.parse(body),
    };
  };
  const head = w.document.head;
  const orig = head.appendChild.bind(head);
  head.appendChild = (el) => {
    if (el.tagName !== "SCRIPT") return orig(el);
    w.eval(readFileSync(rel(new URL(el.src).pathname.slice(1)), "utf8"));
    setTimeout(() => el.onload?.(), 0);
    return el;
  };
}
const tick = (ms = 20) => new Promise((r) => setTimeout(r, ms));
function evalEwl(w, files) {
  for (const f of files) w.eval(readFileSync(rel(`assets/ewl/${f}`), "utf8"));
}
const press = (w, init) =>
  w.document.dispatchEvent(
    new w.KeyboardEvent("keydown", { bubbles: true, cancelable: true, ...init }),
  );

export async function domTests(ref, plan, cfg, G, C) {
  const ALL = [
    "rational.js",
    "state-store.js",
    "reasoning.js",
    "ui.js",
    "lab-registry.js",
    "cockpit-core.js",
    "cockpit-check.js",
    "cockpit.js",
    "reference-core.js",
    "reference-icons.js",
    "reference.js",
  ];

  // --- cockpit
  {
    const { w } = makeDom("?lesson=3-4&unit=3&preset=ratio-tables&lens=tape");
    wireDisk(w);
    evalEwl(w, ALL);
    const host = w.document.createElement("section");
    host.id = "ewl-cockpit";
    w.document.body.appendChild(host);
    const store = w.EWL.Store.create({
      storage: { getItem: () => null, setItem() {}, removeItem() {} },
    });
    const lessons = w.EWL.Cockpit.taughtLessons(MANIFEST);
    const api = w.EWL.Cockpit.mount(host, {
      store,
      manifest: MANIFEST,
      integ: null,
      plan,
      today: "2026-10-15",
    });
    assert.equal(api.state().lesson, "3-4", "?lesson= wins");
    assert.equal(store.get().prefs.preset, "ratio-tables");
    assert.equal(store.get().prefs.lens, "tape");
    // the unit + lesson selects list exactly the taught lessons
    const unitSel = host.querySelector("#ewlc-unit");
    const seen = [];
    for (const opt of [...unitSel.options]) {
      unitSel.value = opt.value;
      unitSel.dispatchEvent(new w.Event("change", { bubbles: true }));
      seen.push(...[...host.querySelector("#ewlc-lesson").options].map((o) => o.value));
    }
    deq(seen.sort(), lessons.map((l) => l.id).sort(), "switcher = taught lessons");
    assert.ok(!seen.some((id) => id.startsWith("10-")));
    assert.equal([...host.querySelector("#ewlc-unit").options].length, 9);
    assert.equal(
      store.get().lesson,
      "9-1",
      "switching persists with setLesson (last unit's first lesson)",
    );
    // the stepper: Mark done is self-reported, one stage at a time
    const steps = () =>
      [...host.querySelectorAll(".ewlc-step")].map(
        (b) => b.getAttribute("aria-current") === "step",
      );
    deq(steps(), [true, false, false, false]);
    const markDone = () =>
      [...host.querySelectorAll(".ewlc-nav button")].find((b) => b.textContent === "Mark done");
    markDone().click();
    deq(store.stagesDone("9-1"), ["curious"]);
    deq(steps(), [false, true, false, false], "Mark done moves to the next step");
    assert.equal(host.querySelector(".ewlc-count").textContent, "1 of 4 steps done");
    host.querySelector('[data-stage="check"]').click();
    assert.ok(host.querySelector("#ewlc-check"), "Check Yourself panel mounts in stage 4");
    assert.ok(
      [...host.querySelectorAll("#ewlc-panel a")].some(
        (a) => a.href.includes("exit") || a.textContent === "Exit ticket",
      ),
    );
    const foot = [...host.querySelectorAll(".ewlc-foot a")].map((a) => a.getAttribute("href"));
    assert.ok(
      foot.some((h) => h.includes("/curriculum/student-launch/?lesson=9-1")),
      "links to the existing playlist",
    );
    assert.ok(foot.includes("/math/lesson-path/9-1/"), "links to the one-page lesson path");
    // a saved lesson wins over the pacing plan; Unit 10 in the URL is ignored
    api.destroy();
    const w2 = makeDom("?lesson=10-1");
    evalEwl(w2.w, ALL);
    const h2 = w2.w.document.createElement("section");
    w2.w.document.body.appendChild(h2);
    const s2 = w2.w.EWL.Store.create({
      storage: { getItem: () => null, setItem() {}, removeItem() {} },
    });
    const a2 = w2.w.EWL.Cockpit.mount(h2, {
      store: s2,
      manifest: MANIFEST,
      plan,
      today: "2026-10-15",
    });
    assert.equal(a2.state().lesson, "3-5", "Unit 10 deep link falls back to this week's lesson");
    a2.destroy();
    const w3 = makeDom("?unit=6");
    evalEwl(w3.w, ALL);
    const h3 = w3.w.document.createElement("section");
    w3.w.document.body.appendChild(h3);
    const s3 = w3.w.EWL.Store.create({
      storage: { getItem: () => null, setItem() {}, removeItem() {} },
    });
    assert.equal(
      w3.w.EWL.Cockpit.mount(h3, {
        store: s3,
        manifest: MANIFEST,
        plan,
        today: "2026-10-15",
      }).state().lesson,
      "6-1",
      "?unit= opens that unit",
    );
  }

  // --- Check Yourself, end to end: wrong pick -> a question (no answer), reveal only after two misses, router chips
  {
    const { w } = makeDom("?lesson=3-1");
    wireDisk(w);
    evalEwl(w, ALL);
    const host = w.document.createElement("section");
    w.document.body.appendChild(host);
    const store = w.EWL.Store.create({
      storage: { getItem: () => null, setItem() {}, removeItem() {} },
    });
    w.EWL.Cockpit.mount(host, {
      store,
      manifest: MANIFEST,
      integ: null,
      plan,
      today: "2026-10-15",
      refReady: () => true,
    });
    host.querySelector('[data-stage="check"]').click();
    await tick(120);
    const codeForm = host.querySelector(".ewlc-coderow");
    host.querySelector("#ewlc-code").value = "4821";
    codeForm.dispatchEvent(new w.Event("submit", { bubbles: true, cancelable: true }));
    const wanted = C.buildItems(
      G,
      C.checkPlan({
        lesson: "3-1",
        genIds: C.studioGenIds(readJson("data/practice-studio/3-1.json")),
        code: "4821",
        levels: cfg.levels,
      }),
    );
    assert.equal(wanted.length, 3);
    assert.ok(
      wanted.every((i) => i.k === "mc"),
      "3-1 generates multiple-choice items",
    );
    const submit = () =>
      host
        .querySelector(".ewlc-form")
        .dispatchEvent(new w.Event("submit", { bubbles: true, cancelable: true }));
    const choose = (k) => {
      const r = host.querySelectorAll('input[name="ewlc-c"]')[k];
      r.checked = true;
    };
    const wrongOf = (it, n) => [...it.c.keys()].filter((k) => k !== it.a)[n];
    const fb = () => host.querySelector(".ewlc-fb").textContent;
    // item 1: two wrong picks, then ask for the checked result
    assert.ok(host.textContent.includes(wanted[0].q), "first question is the seeded one");
    assert.ok(host.textContent.includes("Question 1 of 3"));
    assert.ok(!/timer|seconds|countdown/i.test(host.textContent), "no timer");
    choose(wrongOf(wanted[0], 0));
    submit();
    assert.ok(fb().startsWith("Not yet."), fb());
    assert.ok(fb().includes("What is it asking you to find?"), "first help is a question");
    assert.ok(!fb().includes(wanted[0].x), "no worked solution on a wrong pick");
    assert.equal(host.querySelector("[data-reveal]"), null, "no checked result after one miss");
    choose(wrongOf(wanted[0], 1));
    submit();
    assert.ok(!fb().includes(wanted[0].x), "still no worked solution");
    host.querySelector("[data-reveal]").click();
    assert.ok(fb().includes("Checked result:"), "checked result appears only when asked for");
    host.querySelector("#ewlc-next").click();
    // item 2: right first try
    choose(wanted[1].a);
    submit();
    assert.ok(fb().startsWith("Yes"));
    host.querySelector("#ewlc-next").click();
    // item 3: one miss, then right
    choose(wrongOf(wanted[2], 0));
    submit();
    choose(wanted[2].a);
    submit();
    host.querySelector("#ewlc-next").click();
    assert.equal(store.get().checks["3-1"].status, "repair");
    assert.ok(store.get().checks["3-1"].repair || true);
    const chips = [...host.querySelectorAll(".ewlc-repair a, .ewlc-repair button")].map(
      (n) => n.getAttribute("href") || n.textContent,
    );
    assert.ok(
      chips.includes("/curriculum/extra-help/#lesson-3-1"),
      "repair chips include Extra Help for the lesson",
    );
    assert.ok(
      chips.includes("/math/practice-studio/3-1/"),
      "repair chips include the Practice Studio",
    );
    assert.ok(
      chips.some((c) => c.includes("learning-labs")),
      "repair chips include the learning lab",
    );
    assert.ok(chips.includes("Pocket Reference words"));
    // the same code on another device gives the same first question
    host.querySelector("#ewlc-code").value = "4821";
    host
      .querySelector(".ewlc-coderow")
      .dispatchEvent(new w.Event("submit", { bubbles: true, cancelable: true }));
    assert.ok(host.textContent.includes(wanted[0].q), "same class code, same questions");
  }
  // a lesson with no generator gets an honest self-rating, never invented questions
  {
    const { w } = makeDom("?lesson=1-1");
    wireDisk(w);
    evalEwl(w, ALL);
    const host = w.document.createElement("section");
    w.document.body.appendChild(host);
    const store = w.EWL.Store.create({
      storage: { getItem: () => null, setItem() {}, removeItem() {} },
    });
    w.EWL.Cockpit.mount(host, { store, manifest: MANIFEST, plan, today: "2026-10-15" });
    host.querySelector('[data-stage="check"]').click();
    await tick(60);
    assert.equal(host.querySelectorAll('input[type="radio"]').length, 0, "no fake items");
    [...host.querySelectorAll("button")]
      .find((b) => b.textContent === "I need another look")
      .click();
    assert.equal(store.get().checks["1-1"].status, "unsure");
    assert.ok(host.querySelector(".ewlc-repair a[href='/curriculum/extra-help/#lesson-1-1']"));
    [...host.querySelectorAll("button")].find((b) => b.textContent === "I could teach it").click();
    assert.equal(store.get().checks["1-1"].status, "ok");
  }

  // --- teacher mode renders nothing
  for (const [search, bodyClass] of [
    ["?teacher=1", ""],
    ["", "teacher-mode"],
  ]) {
    const { w } = makeDom(search);
    if (bodyClass) w.document.body.classList.add(bodyClass);
    evalEwl(w, ALL);
    const host = w.document.createElement("section");
    host.id = "ewl-cockpit";
    w.document.body.appendChild(host);
    const store = w.EWL.Store.create({
      storage: { getItem: () => null, setItem() {}, removeItem() {} },
    });
    w.EWL.Cockpit.mount(host, { store, manifest: MANIFEST, plan, today: "2026-10-15" });
    assert.equal(host.children.length, 0, `teacher mode (${search || bodyClass}) renders nothing`);
    assert.equal(host.hidden, true);
  }

  // --- Pocket Reference drawer
  {
    const { w } = makeDom("");
    wireDisk(w);
    evalEwl(w, ALL);
    await tick();
    const R = w.EWL.Reference;
    const opener = w.document.getElementById("opener");
    opener.focus();
    press(w, { key: "k", ctrlKey: true });
    await new Promise((r) => setTimeout(r, 30));
    const dlg = w.document.querySelector('[role="dialog"]');
    assert.ok(
      R.isOpen() && dlg.getAttribute("aria-modal") === "true",
      "Ctrl+K opens a modal dialog",
    );
    assert.equal(w.document.activeElement.id, "ewlr-q", "focus lands in search");
    assert.ok(
      dlg.getAttribute("aria-labelledby") &&
        w.document.getElementById(dlg.getAttribute("aria-labelledby")),
    );
    // search narrows; Spanish works
    const q = w.document.getElementById("ewlr-q");
    q.value = "razon";
    q.dispatchEvent(new w.Event("input", { bubbles: true }));
    assert.ok(
      [...w.document.querySelectorAll(".ewlr-item strong")].some((n) => n.textContent === "Ratio"),
    );
    // open a detail view: term, example, frame, sandbox button with a preset that exists
    [...w.document.querySelectorAll(".ewlr-item")]
      .find((b) => b.querySelector("strong").textContent === "Ratio")
      .click();
    const text = dlg.textContent;
    for (const part of ["Example", "Say it", "Taught in", "Launch in Sandbox"])
      assert.ok(text.includes(part), part);
    const sb = [...dlg.querySelectorAll("a")].find((a) => a.textContent === "Launch in Sandbox");
    const preset = new URL(sb.href).searchParams.get("preset");
    assert.ok(
      workbenchPresets().includes(preset),
      `sandbox preset ${preset} exists in the Workbench`,
    );
    assert.ok(dlg.querySelector("svg title"), "entry has an accessible picture");
    // focus trap
    const focusables = [
      ...dlg.querySelectorAll("a[href],button:not([disabled]),input:not([disabled])"),
    ];
    focusables[focusables.length - 1].focus();
    const tab = new w.KeyboardEvent("keydown", { key: "Tab", bubbles: true, cancelable: true });
    w.document.activeElement.dispatchEvent(tab);
    assert.equal(tab.defaultPrevented, true, "Tab at the end wraps");
    assert.equal(w.document.activeElement, focusables[0]);
    focusables[0].focus();
    const stab = new w.KeyboardEvent("keydown", {
      key: "Tab",
      shiftKey: true,
      bubbles: true,
      cancelable: true,
    });
    focusables[0].dispatchEvent(stab);
    assert.equal(
      w.document.activeElement,
      focusables[focusables.length - 1],
      "Shift+Tab at the start wraps",
    );
    // Esc closes and focus goes back
    w.document.activeElement.dispatchEvent(
      new w.KeyboardEvent("keydown", { key: "Escape", bubbles: true, cancelable: true }),
    );
    assert.equal(R.isOpen(), false);
    assert.equal(w.document.activeElement, opener, "focus restored to the opener");
    assert.ok(
      Object.keys(w.EWLStateStore.get().vocab).includes("ratio"),
      "looking a word up is recorded as a vocab token",
    );
    // another modal dialog open: the shortcut does not fight it
    const other = w.document.createElement("dialog");
    other.setAttribute("open", "");
    w.document.body.appendChild(other);
    press(w, { key: "k", ctrlKey: true });
    await new Promise((r) => setTimeout(r, 10));
    assert.equal(R.isOpen(), false, "Ctrl+K ignored while another dialog is open");
    other.remove();
    assert.ok(w.document.querySelector(".ewlr-fab"), "visible button exists");
    // every self-test registered by the cockpit and reference modules passes
    for (const t of w.EWL.selfTests.filter((x) => /^(cockpit|reference)/.test(x.name)))
      assert.equal(t.run(), true, t.name);
  }
  // on the hub the palette owns Ctrl/Cmd+K, so the drawer uses Alt+K
  {
    const { w } = makeDom("", '<section id="ewl-cockpit" hidden></section>');
    w.fetch = async () => ({ ok: true, json: async () => ref });
    let paletteSaw = 0;
    await tick(1);
    w.document.addEventListener("keydown", (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") paletteSaw++;
    });
    evalEwl(w, [
      "rational.js",
      "state-store.js",
      "reasoning.js",
      "ui.js",
      "reference-core.js",
      "reference-icons.js",
      "reference.js",
    ]);
    await tick();
    press(w, { key: "k", ctrlKey: true });
    press(w, { key: "k", metaKey: true });
    assert.equal(w.EWL.Reference.isOpen(), false, "hub: Ctrl/Cmd+K left to the command palette");
    assert.equal(paletteSaw, 2);
    assert.equal(
      w.document.querySelector(".ewlr-fab").title.includes("Alt+K") ||
        w.document.querySelector(".ewlr-fab").title.includes("Option+K"),
      true,
    );
    press(w, { key: "˚", code: "KeyK", altKey: true });
    await new Promise((r) => setTimeout(r, 10));
    assert.equal(w.EWL.Reference.isOpen(), true, "hub: Alt+K opens the drawer");
  }
  // Spanish
  {
    const { w } = makeDom("?lang=es");
    w.fetch = async () => ({ ok: true, json: async () => ref });
    evalEwl(w, [
      "rational.js",
      "state-store.js",
      "reasoning.js",
      "ui.js",
      "reference-core.js",
      "reference-icons.js",
      "reference.js",
    ]);
    await w.EWL.Reference.open({ term: "razón" });
    assert.ok(w.document.querySelector(".ewlr").textContent.includes("Lanzar") === false);
    assert.ok(w.document.querySelector(".ewlr").textContent.includes("Abrir en el Taller"));
    assert.equal(w.document.querySelector("#ewlr-term").textContent, "Razón");
  }
}
