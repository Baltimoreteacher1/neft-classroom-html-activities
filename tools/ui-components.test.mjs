// shared/ui behavior under jsdom: keyboard handling, focus management and ARIA wiring for every component.
// Each contract is a function that returns a list of problems, so the SAME check that passes the real component
// is also run against a hand-built broken fixture, which it must flag (negative control).
import assert from "node:assert/strict";
import { test } from "node:test";
import { JSDOM } from "jsdom";

const dom = new JSDOM(
  "<!doctype html><body><button id=outside>outside</button><main id=app></main></body>",
  {
    url: "https://test.local/bcpss-teachers/studio/",
  },
);
for (const k of ["window", "document", "Node", "CustomEvent", "KeyboardEvent", "Event"]) {
  Object.defineProperty(globalThis, k, {
    value: dom.window[k],
    configurable: true,
    writable: true,
  });
}

const ui = await import("../shared/ui/index.js");
const { directionOf } = await import("../shared/ui/h.js");
const doc = dom.window.document;
const app = doc.getElementById("app");
const key = (el, k, opts = {}) =>
  el.dispatchEvent(
    new dom.window.KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true, ...opts }),
  );
const mount = (el, dir) => {
  app.replaceChildren();
  if (dir) app.setAttribute("dir", dir);
  else app.removeAttribute("dir");
  app.append(el);
  return el;
};
const sampleTabs = (onChange) =>
  ui.createTabs({
    label: "Sample",
    onChange,
    tabs: [
      { id: "a", label: "A", panel: "Panel A" },
      { id: "b", label: "B", panel: "Panel B" },
      { id: "c", label: "C", panel: "Panel C" },
    ],
  });

/* ---- contracts ---- */

function tabsAriaProblems(root) {
  const problems = [];
  const tabs = [...root.querySelectorAll('[role="tab"]')];
  if (root.querySelector('[role="tablist"]')?.getAttribute("aria-label") == null)
    problems.push("tablist has no label");
  const selected = tabs.filter((t) => t.getAttribute("aria-selected") === "true");
  if (selected.length !== 1) problems.push(`${selected.length} tabs selected, expected 1`);
  for (const t of tabs) {
    const panel = doc.getElementById(t.getAttribute("aria-controls") || "");
    if (!panel) problems.push(`tab ${t.id} controls nothing`);
    else {
      if (panel.getAttribute("role") !== "tabpanel")
        problems.push(`panel for ${t.id} is not a tabpanel`);
      if (panel.getAttribute("aria-labelledby") !== t.id)
        problems.push(`panel for ${t.id} is not labelled by it`);
      if (panel.hidden === (t.getAttribute("aria-selected") === "true"))
        problems.push(`panel visibility wrong for ${t.id}`);
    }
    const stop = t.getAttribute("aria-selected") === "true" ? "0" : "-1";
    if (t.getAttribute("tabindex") !== stop)
      problems.push(`tab ${t.id} tabindex ${t.getAttribute("tabindex")}, expected ${stop}`);
  }
  return problems;
}

function dialogAriaProblems(root) {
  const problems = [];
  const d = root.querySelector('[role="dialog"]');
  if (!d) return ["no role=dialog"];
  if (d.getAttribute("aria-modal") !== "true") problems.push("aria-modal is not true");
  const label = doc.getElementById(d.getAttribute("aria-labelledby") || "");
  if (!label?.textContent.trim()) problems.push("dialog has no accessible title");
  return problems;
}

function bandProblems(root) {
  const problems = [];
  const radios = [...root.querySelectorAll("input")];
  if (root.tagName !== "FIELDSET" || !root.querySelector("legend")?.textContent.trim())
    problems.push("not a fieldset with a legend");
  if (radios.length < 2) problems.push("fewer than two options");
  if (radios.some((r) => r.type !== "radio")) problems.push("an option is not a radio");
  if (new Set(radios.map((r) => r.name)).size !== 1) problems.push("radios do not share one name");
  if (radios.filter((r) => r.checked).length > 1) problems.push("more than one checked");
  for (const r of radios)
    if (!root.querySelector(`label[for="${r.id}"]`)) problems.push(`radio ${r.value} has no label`);
  return problems;
}

/* ---- tabs ---- */

test("tabs: aria wiring, roving tabindex, one selected", () => {
  const tabs = mount(sampleTabs());
  assert.deepEqual(tabsAriaProblems(tabs), []);
});

test("tabs: ArrowRight/ArrowLeft move and activate, wrapping; Home and End jump (LTR)", () => {
  const seen = [];
  const tabs = mount(sampleTabs((id) => seen.push(id)));
  const [a, b, c] = tabs.querySelectorAll('[role="tab"]');
  a.focus();
  key(a, "ArrowRight");
  assert.equal(doc.activeElement, b);
  assert.equal(b.getAttribute("aria-selected"), "true");
  key(b, "End");
  assert.equal(doc.activeElement, c);
  key(c, "ArrowRight");
  assert.equal(doc.activeElement, a, "ArrowRight wraps to the first tab");
  key(a, "ArrowLeft");
  assert.equal(doc.activeElement, c, "ArrowLeft wraps to the last tab");
  key(c, "Home");
  assert.equal(doc.activeElement, a);
  assert.deepEqual(seen, ["b", "c", "a", "c", "a"]);
  assert.deepEqual(tabsAriaProblems(tabs), []);
});

test("tabs: in an RTL container ArrowRight goes to the previous tab", () => {
  const tabs = mount(sampleTabs(), "rtl");
  const [a, b, c] = tabs.querySelectorAll('[role="tab"]');
  assert.equal(directionOf(tabs), "rtl");
  b.click();
  b.focus();
  key(b, "ArrowRight");
  assert.equal(doc.activeElement, a);
  key(a, "ArrowLeft");
  assert.equal(doc.activeElement, b);
  key(b, "ArrowLeft");
  assert.equal(doc.activeElement, c);
});

test("tabs: click selects, select() is silent about focus, unknown id and bad input are handled", () => {
  const tabs = mount(sampleTabs());
  const [, b] = tabs.querySelectorAll('[role="tab"]');
  b.click();
  assert.equal(b.getAttribute("aria-selected"), "true");
  tabs.select("c");
  assert.equal(tabs.querySelector('[aria-selected="true"]').textContent, "C");
  tabs.select("nope");
  assert.equal(tabs.querySelector('[aria-selected="true"]').textContent, "C");
  assert.throws(() => ui.createTabs({ tabs: [], label: "x" }), /tabs is required/);
  assert.throws(
    () =>
      ui.createTabs({
        tabs: [
          { id: "a", label: "A", panel: "" },
          { id: "a", label: "B", panel: "" },
        ],
        label: "x",
      }),
    /unique/,
  );
});

test("negative control: the tabs contract flags a broken tablist", () => {
  const bad = doc.createElement("div");
  bad.innerHTML =
    '<div role="tablist"><button role="tab" id="t1" aria-selected="true" tabindex="0">One</button><button role="tab" id="t2" aria-selected="true" tabindex="0">Two</button></div>';
  mount(bad);
  const problems = tabsAriaProblems(bad);
  assert.ok(
    problems.length >= 4,
    `expected the contract to flag the fixture, got ${JSON.stringify(problems)}`,
  );
});

/* ---- dialog ---- */

test("dialog: aria-modal, focus moves in, Tab and Shift+Tab are trapped, background is inert", () => {
  const opener = ui.createButton({ label: "Open" });
  mount(opener);
  const ok = ui.createButton({ label: "OK" });
  const cancel = ui.createButton({ label: "Cancel", variant: "secondary" });
  const dialog = ui.createDialog({ title: "Confirm", body: "Sure?", actions: [cancel, ok] });
  opener.focus();
  dialog.open(opener);
  assert.deepEqual(dialogAriaProblems(dialog), []);
  assert.equal(dialog.isOpen, true);
  assert.ok(dialog.contains(doc.activeElement), "focus moved inside");
  assert.equal(doc.activeElement, cancel, "first non-Close control is focused");
  assert.ok(
    app.hasAttribute("inert") && doc.getElementById("outside").hasAttribute("inert"),
    "page is inert",
  );
  ok.focus();
  key(ok, "Tab");
  assert.equal(
    doc.activeElement,
    doc.querySelector(".ui-dialog__head .ui-btn"),
    "Tab from the last control wraps to the first",
  );
  const close = doc.querySelector(".ui-dialog__head .ui-btn");
  close.focus();
  key(close, "Tab", { shiftKey: true });
  assert.equal(doc.activeElement, ok, "Shift+Tab from the first control wraps to the last");
  dialog.close();
});

test("dialog: Escape closes, focus returns to the opener, inert and scroll lock are released", () => {
  const opener = ui.createButton({ label: "Open" });
  mount(opener);
  let closed = 0;
  const dialog = ui.createDialog({ title: "Esc", body: "x", onClose: () => closed++ });
  opener.focus();
  dialog.open(opener);
  assert.ok(doc.documentElement.classList.contains("ui-scroll-lock"));
  key(doc.activeElement, "Escape");
  assert.equal(dialog.isOpen, false);
  assert.equal(doc.activeElement, opener, "focus returned to the opener");
  assert.equal(doc.querySelector('[role="dialog"]'), null, "dialog removed from the DOM");
  assert.ok(!app.hasAttribute("inert") && !doc.getElementById("outside").hasAttribute("inert"));
  assert.ok(!doc.documentElement.classList.contains("ui-scroll-lock"));
  assert.equal(closed, 1);
  dialog.close();
  assert.equal(closed, 1, "closing twice runs onClose once");
});

test("dialog: backdrop click closes, a click inside does not; theme and direction follow the opener", () => {
  const scope = doc.createElement("div");
  scope.setAttribute("data-ui-theme", "dark");
  scope.setAttribute("dir", "rtl");
  const opener = ui.createButton({ label: "Open" });
  scope.append(opener);
  mount(scope);
  const dialog = ui.createDialog({ title: "Scrim", body: "x" });
  dialog.open(opener);
  assert.equal(dialog.getAttribute("data-ui-theme"), "dark");
  assert.equal(dialog.getAttribute("dir"), "rtl");
  doc
    .querySelector(".ui-dialog")
    .dispatchEvent(new dom.window.MouseEvent("click", { bubbles: true }));
  assert.equal(dialog.isOpen, true);
  dialog.dispatchEvent(new dom.window.MouseEvent("click", { bubbles: true }));
  assert.equal(dialog.isOpen, false);
});

test("negative control: the dialog contract flags a dialog with no title or aria-modal", () => {
  const bad = doc.createElement("div");
  bad.innerHTML = '<div role="dialog"><p>hi</p></div>';
  mount(bad);
  assert.ok(dialogAriaProblems(bad).length >= 2);
});

/* ---- band selector ---- */

const BANDS = [
  { value: "x", label: "X", hint: "first" },
  { value: "y", label: "Y" },
  { value: "z", label: "Z" },
];

test("band selector: fieldset, legend, one shared radio name, labelled, one checked", () => {
  const picked = [];
  const sel = mount(
    ui.createBandSelector({
      name: "band",
      label: "Band",
      bands: BANDS,
      value: "y",
      onChange: (v) => picked.push(v),
    }),
  );
  assert.deepEqual(bandProblems(sel), []);
  assert.equal(sel.value(), "y");
  const z = sel.querySelector('input[value="z"]');
  z.click();
  assert.equal(sel.value(), "z");
  assert.deepEqual(picked, ["z"]);
  assert.equal(
    sel.querySelector('input[value="y"]').checked,
    false,
    "radio group keeps exactly one checked",
  );
});

test("band selector: hint is described by the group; bad input throws; nothing is preselected by default", () => {
  const sel = mount(
    ui.createBandSelector({ name: "b2", label: "Band", bands: BANDS, hint: "Teacher-side choice" }),
  );
  const note = doc.getElementById(sel.getAttribute("aria-describedby"));
  assert.equal(note.textContent, "Teacher-side choice");
  assert.equal(sel.value(), "");
  assert.throws(
    () => ui.createBandSelector({ name: "n", label: "L", bands: [BANDS[0]] }),
    /two bands/,
  );
  assert.throws(() => ui.createBandSelector({ label: "L", bands: BANDS }), /name is required/);
});

test("negative control: the band contract flags checkboxes and a missing legend", () => {
  const bad = doc.createElement("div");
  bad.innerHTML =
    '<input type="checkbox" id="q1" name="a"><input type="checkbox" id="q2" name="b">';
  mount(bad);
  assert.ok(bandProblems(bad).length >= 4);
});

/* ---- button, badge, card, vocabulary, activity, print sheet ---- */

test("button: native keyboard element, toggle flips aria-pressed and reports the new state", () => {
  const states = [];
  const b = mount(
    ui.createButton({
      label: "Hints",
      variant: "secondary",
      pressed: false,
      onClick: (s) => states.push(s),
    }),
  );
  assert.equal(b.tagName, "BUTTON");
  assert.equal(b.type, "button");
  b.click();
  b.click();
  assert.deepEqual(states, [true, false]);
  const link = ui.createButton({ label: "Go", href: "#/x" });
  assert.equal(link.tagName, "A");
  assert.throws(() => ui.createButton({}), /label is required/);
  assert.throws(() => ui.createButton({ label: "x", variant: "neon" }), /unknown variant/);
  const off = ui.createButton({ label: "Off", disabled: true });
  assert.equal(off.disabled, true);
});

test("badge: tone class plus a decorative mark; the hidden prefix is real text; unknown tone throws", () => {
  const b = ui.createBadge({ label: "Reviewed", tone: "success", srPrefix: "Status" });
  assert.ok(b.classList.contains("ui-badge--success"));
  assert.equal(b.querySelector(".ui-badge__mark").getAttribute("aria-hidden"), "true");
  assert.match(b.textContent, /Status: Reviewed/);
  assert.throws(() => ui.createBadge({ label: "x", tone: "purple" }), /unknown tone/);
});

test("card: labelled by its own heading; linked card has one link in the heading; heading level is clamped", () => {
  const plain = mount(ui.createCard({ title: "Plain", body: "Body", headingLevel: 4 }));
  assert.equal(plain.querySelector("h4").id, plain.getAttribute("aria-labelledby"));
  const linked = mount(ui.createCard({ title: "Linked", href: "#/x", headingLevel: 1 }));
  assert.equal(linked.querySelectorAll("a").length, 1);
  assert.ok(linked.querySelector("h2 > a.ui-card__link"), "level 1 is clamped to h2");
  assert.throws(() => ui.createCard({}), /title is required/);
});

test("vocabulary card: translations carry lang and dir; speak button only when a handler is given", () => {
  const spoken = [];
  const card = mount(
    ui.createVocabularyCard({
      term: "compare",
      partOfSpeech: "verb",
      definition: "Say how two things are alike and different.",
      example: "I compare two drawings.",
      translations: [
        { lang: "es", language: "Spanish", text: "comparar" },
        { lang: "ar", language: "Arabic", text: "يقارن", dir: "rtl" },
      ],
      onSpeak: (t) => spoken.push(t),
    }),
  );
  const texts = [...card.querySelectorAll(".ui-vocab__text")];
  assert.deepEqual(
    texts.map((t) => [t.lang, t.getAttribute("dir")]),
    [
      ["es", "auto"],
      ["ar", "rtl"],
    ],
  );
  card.querySelector("button").click();
  assert.deepEqual(spoken, ["compare"]);
  const quiet = ui.createVocabularyCard({ term: "t", definition: "d" });
  assert.equal(quiet.querySelector("button"), null);
  assert.throws(() => ui.createVocabularyCard({ term: "t" }), /definition is required/);
});

test("activity card: one action link whose name contains its visible label; paper-only default materials", () => {
  const card = mount(
    ui.createActivityCard({ title: "Sort and explain", summary: "s", href: "#/x", minutes: 15 }),
  );
  const link = card.querySelector("a.ui-btn");
  assert.equal(link.getAttribute("aria-label"), "Open activity: Sort and explain");
  assert.ok(link.getAttribute("aria-label").includes(link.textContent));
  assert.match(card.textContent, /Paper and pencil/);
  assert.match(card.textContent, /15 min/);
  assert.throws(() => ui.createActivityCard({ title: "t" }), /href is required/);
});

test("print sheet: write-in lines, ruled lines are decorative, no page-break styling in markup", () => {
  const sheet = mount(
    ui.createPrintSheet({
      title: "Compare",
      sections: [{ heading: "Mine", body: "Frame", lines: 3 }],
      footer: "Not official.",
    }),
  );
  assert.equal(sheet.querySelectorAll(".ui-sheet__line").length, 3);
  assert.equal(sheet.querySelector(".ui-sheet__lines").getAttribute("aria-hidden"), "true");
  assert.equal(sheet.querySelectorAll(".ui-sheet__field").length, 2);
  assert.equal(
    sheet.querySelector(".ui-sheet__who").textContent,
    "NameDate",
    "nothing is pre-filled",
  );
  assert.ok(!/break-|page-break/i.test(sheet.outerHTML));
  assert.equal(
    ui.createPrintSheet({ title: "t", nameLine: false }).querySelector(".ui-sheet__who"),
    null,
  );
});

test("h(): text is always a text node, never markup", () => {
  const card = ui.createCard({ title: "<img src=x onerror=alert(1)>", body: "<b>bold</b>" });
  assert.equal(card.querySelector("img"), null);
  assert.equal(card.querySelector("b"), null);
  assert.match(card.textContent, /<b>bold<\/b>/);
});

/* ---- the Studio specimen route ---- */

test("route #/design reaches the specimen view, which has a title and an entry in VIEW_TITLES", async () => {
  const { parseHash, VIEW_FOR, VIEW_TITLES } = await import(
    "../bcpss-teachers/studio/core/router.js"
  );
  const route = parseHash("#/design");
  assert.equal(route.view, VIEW_FOR.design);
  assert.ok(VIEW_TITLES[route.view]);
  const mod = await import(
    new URL(`../bcpss-teachers/studio/views/${route.view}.js`, import.meta.url)
  );
  assert.equal(typeof mod.render, "function");
});

test("specimen renders every component in light and dark, and the RTL switch flips dir", async () => {
  const { render } = await import("../bcpss-teachers/studio/design/specimen.js");
  const root = doc.createElement("main");
  doc.body.append(root);
  render({ root });
  assert.equal(root.querySelectorAll("h1").length, 1);
  for (const theme of ["light", "dark"]) {
    const panel = root.querySelector(`[data-ui-theme="${theme}"]`);
    assert.ok(panel, `${theme} panel`);
    for (const sel of [
      ".ui-btn--primary",
      ".ui-btn--danger",
      ".ui-badge--error",
      ".ui-card--link",
      '[role="tablist"]',
      "fieldset.ui-bands",
      ".ui-vocab",
      ".ui-activity",
      ".ui-sheet",
    ]) {
      assert.ok(panel.querySelector(sel), `${theme} panel is missing ${sel}`);
    }
    const open = [...panel.querySelectorAll("button")].find((b) =>
      b.textContent.startsWith("Open dialog"),
    );
    open.focus();
    open.click();
    assert.equal(doc.querySelector(".ui-dialog-backdrop").getAttribute("data-ui-theme"), theme);
    key(doc.activeElement, "Escape");
    assert.equal(doc.activeElement, open);
  }
  const stage = root.querySelector(".ds-stage");
  assert.equal(stage.getAttribute("dir"), "ltr");
  [...root.querySelectorAll("button")].find((b) => b.textContent === "Right-to-left").click();
  assert.equal(stage.getAttribute("dir"), "rtl");
  assert.ok(
    doc.querySelector('link[href$="/shared/ui/theme.css"]') &&
      doc.querySelector('link[href$="/engine/styles/ds-tokens.generated.css"]'),
  );
  const texts = [...root.querySelectorAll(".ui-badge, .ui-vocab, .ui-band__hint, .ui-bands__note")]
    .map((e) => e.textContent)
    .join(" ");
  assert.doesNotMatch(texts, /\bESOL\b/i, "no ESOL labelling");
});
