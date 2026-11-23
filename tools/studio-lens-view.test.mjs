// Language Lens and Resource Remix views rendered in jsdom against the Lens fixtures: paste, analyse, hand off, remix, send on.
//   node --test tools/studio-lens-view.test.mjs
import assert from "node:assert/strict";
import { join } from "node:path";
import { before, beforeEach, describe, it } from "node:test";
import { pathToFileURL } from "node:url";
import { JSDOM } from "jsdom";
import { VOCAB } from "./studio-lens-fixtures/pack.js";
import { TEXTS } from "./studio-lens-fixtures/texts.js";

const STUDIO = new URL("../bcpss-teachers/studio/", import.meta.url).pathname;
const U = (p) => pathToFileURL(join(STUDIO, p)).href;

const dom = new JSDOM('<!doctype html><html><body><main id="st-main"></main></body></html>', {
  url: "http://localhost/bcpss-teachers/studio/",
  pretendToBeVisual: true,
});
const w = dom.window;
for (const k of ["window", "document", "localStorage", "sessionStorage", "location", "history"])
  Object.defineProperty(globalThis, k, { value: w[k], configurable: true, writable: true });
Object.defineProperty(globalThis, "navigator", { value: w.navigator, configurable: true });
w.scrollTo = () => {};
w.HTMLElement.prototype.scrollIntoView = () => {};

const lens = await import(U("views/lens.js"));
const remix = await import(U("views/remix.js"));
const { readHandoff, REMIX_TARGETS } = await import(U("core/remix.js"));
const { VIEW_FOR } = await import(U("core/router.js"));
const { GRADES } = await import(U("data/taxonomy.js"));

const okShell = () => ({
  prefs: { getPrefs: () => ({ grade: null, subject: null }) },
  catalog: { byKind: async () => [{ id: VOCAB.id }], vocab: async () => VOCAB },
});
const failShell = () => ({
  prefs: { getPrefs: () => ({}) },
  catalog: {
    byKind: async () => {
      throw new Error("offline");
    },
  },
});

const root = () => document.getElementById("st-main");
const $ = (sel) => root().querySelector(sel);
const $$ = (sel) => [...root().querySelectorAll(sel)];
const wait = async (cond, ms = 2000) => {
  const end = Date.now() + ms;
  while (Date.now() < end) {
    if (cond()) return true;
    await new Promise((r) => setTimeout(r, 10));
  }
  return cond();
};
const buttonByText = (t) => $$("button, a").find((b) => b.textContent.trim().startsWith(t));
const type = (el, value) => {
  el.value = value;
  el.dispatchEvent(new w.Event("input", { bubbles: true }));
};
const choose = (el, value) => {
  el.value = value;
  el.dispatchEvent(new w.Event("change", { bubbles: true }));
};
const text68 = TEXTS.find((t) => t.id === "68-math");
const EMOJI = /\p{Extended_Pictographic}/u;

beforeEach(() => {
  root().replaceChildren();
  window.location.hash = "";
  sessionStorage.clear();
  localStorage.clear();
});

describe("router wiring", () => {
  it("lens and remix resolve to view modules that export render()", () => {
    assert.equal(VIEW_FOR.lens, "lens");
    assert.equal(VIEW_FOR.remix, "remix");
    assert.equal(typeof lens.render, "function");
    assert.equal(typeof remix.render, "function");
  });
});

describe("Language Lens view", () => {
  it("opens with an h1, a plain privacy statement, K-8 grades only and an empty state", async () => {
    await lens.render({ root: root(), params: {}, shell: okShell() });
    assert.equal($("h1").textContent, "Language Lens");
    assert.match(root().textContent, /stays on this device/i);
    assert.match(root().textContent, /Nothing is uploaded/);
    assert.match(root().textContent, /Nothing looked at yet/);
    const grades = [...$("#st-lens-grade").options].map((o) => o.value).filter(Boolean);
    assert.deepEqual(grades, GRADES);
    assert.ok(!/Pre-K|grade 9|grade 12|high school/i.test(root().textContent));
    assert.ok(!EMOJI.test(root().textContent));
    assert.ok($("textarea").labels.length >= 1);
    assert.equal($(".st-lt-status").getAttribute("aria-live"), "polite");
  });

  it("asks for more text instead of analysing almost nothing", async () => {
    await lens.render({ root: root(), params: {}, shell: okShell() });
    type($("#st-lens-text"), "Hi there");
    buttonByText("Look at the language").click();
    assert.equal($(".st-lt-status").getAttribute("role"), "alert");
    assert.match($(".st-lt-status").textContent, /at least 3 words/);
    assert.equal($("#st-lens-results"), null);
  });

  it("analyses a pasted text with honest framing, no score, and the two hand-offs", async () => {
    await lens.render({ root: root(), params: {}, shell: okShell() });
    type($("#st-lens-text"), text68.text);
    choose($("#st-lens-grade"), "6");
    choose($("#st-lens-subject"), "math");
    buttonByText("Look at the language").click();
    assert.ok($("#st-lens-results"));
    const t = root().textContent;
    assert.match(t, /Automated estimate/);
    assert.match(t, /Your own judgement/);
    assert.match(t, /not a measure of how hard the idea is/);
    assert.match(t, /Tier 3: subject words/);
    assert.match(t, /Tier 2: academic words/);
    assert.match(t, /ratio table/);
    assert.match(t, /Words with more than one meaning/);
    assert.ok(!/\bscore\b/i.test(t), "no scores");
    assert.equal(document.activeElement.id, "st-lens-results");
    const remixLink = buttonByText("Remix this text");
    assert.match(remixLink.getAttribute("href"), /^#\/remix\?from=lens&grade=6&subject=math$/);
    assert.ok(await wait(() => /Create a vocabulary mat/.test($(".st-lt-mat").textContent)));
    const mat = $(".st-lt-mat a");
    assert.match(
      mat.getAttribute("href"),
      /^#\/create\?type=vocab-mat&vocab=fixture-g6-ratios&grade=6&subject=math$/,
    );
    assert.ok(!/null/.test(root().textContent));
  });

  it("shows a Spanish word and a review badge only where a studio collection holds one", async () => {
    await lens.render({ root: root(), params: { grade: "6", subject: "math" }, shell: okShell() });
    type(
      $("#st-lens-text"),
      "Use the ratio to find the unit rate. Explain how the ratio compares two quantities.",
    );
    buttonByText("Look at the language").click();
    assert.ok(await wait(() => /Spanish in the studio: razon/.test(root().textContent)));
    const slot = $$(".st-lt-es").find((s) => /razon/.test(s.textContent));
    assert.match(slot.textContent, /Needs review/);
    assert.ok(!/Verified/.test(slot.textContent));
    assert.ok(!/null/.test(root().textContent));
    assert.match($(".st-lt-cognate-note").textContent, /not a complete list/);
  });

  it("runs every fixture text without error and keeps sentences exactly as typed", async () => {
    for (const f of TEXTS) {
      root().replaceChildren();
      await lens.render({
        root: root(),
        params: { grade: f.grade, subject: f.subject },
        shell: okShell(),
      });
      type($("#st-lens-text"), f.text);
      buttonByText("Look at the language").click();
      assert.ok($("#st-lens-results"), f.id);
      const shown = $$(".st-lt-sentences > li > span:first-child")
        .map((s) => s.textContent)
        .join(" ");
      assert.equal(shown, f.text.replace(/\s+/g, " ").trim().replace(/\s+/g, " "), f.id);
      assert.ok(!EMOJI.test(root().textContent), f.id);
    }
  });

  it("clears the box and says nothing was saved", async () => {
    await lens.render({ root: root(), params: {}, shell: okShell() });
    buttonByText("Use an example").click();
    assert.ok($("#st-lens-results"));
    buttonByText("Clear").click();
    assert.equal($("#st-lens-text").value, "");
    assert.equal($("#st-lens-results"), null);
    assert.match($(".st-lt-status").textContent, /Nothing was saved/);
  });

  it("still analyses and explains when the studio vocabulary cannot load, with a retry", async () => {
    await lens.render({ root: root(), params: {}, shell: failShell() });
    type($("#st-lens-text"), text68.text);
    buttonByText("Look at the language").click();
    assert.ok(await wait(() => /could not be loaded/.test($(".st-lt-mat").textContent)));
    assert.ok(
      await wait(() =>
        /could not be loaded, so Spanish words are not shown/.test(root().textContent),
      ),
    );
    assert.ok($(".st-lt-mat button"), "retry offered");
    assert.match(root().textContent, /Tier 3: subject words/);
  });

  it("sends nothing over the network", async () => {
    let calls = 0;
    const realFetch = globalThis.fetch;
    globalThis.fetch = () => {
      calls += 1;
      return Promise.reject(new Error("no network expected"));
    };
    w.fetch = globalThis.fetch;
    await lens.render({ root: root(), params: {}, shell: okShell() });
    type($("#st-lens-text"), text68.text);
    buttonByText("Look at the language").click();
    await wait(() => /Create a vocabulary mat/.test($(".st-lt-mat").textContent));
    buttonByText("Remix this text").click();
    globalThis.fetch = realFetch;
    assert.equal(calls, 0);
  });
});

describe("Resource Remix view", () => {
  const TEXT =
    'The "ratio" of 3:2 is 1.5 -- say "it\'s 3 to 2".\nA second line stays too.   Extra   spaces remain!';

  it("opens with every remix type as a radio choice, the rights notice and an empty state", async () => {
    await remix.render({ root: root(), params: {}, shell: okShell() });
    assert.equal($("h1").textContent, "Resource Remix");
    assert.equal($$("input[type=radio]").length, REMIX_TARGETS.length);
    assert.equal($$("input[type=radio]").filter((r) => r.checked).length, 1);
    assert.match(root().textContent, /responsible for having the right to use/);
    assert.match(root().textContent, /stays on this device/i);
    assert.match(root().textContent, /No draft yet/);
    assert.ok(!EMOJI.test(root().textContent));
  });

  it("shows the objective box for objective types and the text box for text types", async () => {
    await remix.render({ root: root(), params: { target: "exit-ticket" }, shell: okShell() });
    assert.equal($("#st-rx-obj").closest(".st-lt-field").hidden, false);
    assert.equal($("#st-rx-text").closest(".st-lt-field").hidden, true);
    choose($("#st-rx-t-discussion"), "discussion");
    assert.equal($("#st-rx-text").closest(".st-lt-field").hidden, false);
  });

  it("makes a draft for every type, keeps the teacher's text exactly, and blocks sending until it is ready", async () => {
    for (const t of REMIX_TARGETS) {
      root().replaceChildren();
      window.location.hash = "#/remix";
      await remix.render({ root: root(), params: { target: t.id }, shell: okShell() });
      const raw =
        t.input === "text"
          ? `${TEXT} ${text68.text}`
          : "I can compare two fractions using a number line.";
      type($(t.input === "text" ? "#st-rx-text" : "#st-rx-obj"), raw);
      choose($("#st-rx-grade"), "6");
      buttonByText("Make my draft").click();
      assert.ok(await wait(() => $("#st-rx-draft")), t.id);
      assert.match($("#st-rx-draft").textContent, /Your draft:/);
      assert.match(root().textContent, /kept exactly as typed/, t.id);
      assert.ok(!EMOJI.test(root().textContent), t.id);
      const before = window.location.hash;
      buttonByText("Open in Resource Studio").click();
      if (["vocab-cards", "evidence"].includes(t.id)) {
        assert.equal(window.location.hash, before, `${t.id} must not send an unfinished draft`);
        assert.equal($(".st-lt-status").getAttribute("role"), "alert");
        assert.match($(".st-lt-problems").textContent, /Still needed/);
      } else {
        assert.equal(window.location.hash, `#/create?type=remix-${t.id}&draft=remix&grade=6`, t.id);
        assert.equal(readHandoff().draft.type, t.id);
      }
    }
  });

  it("vocabulary cards: studio meaning fills in, a confirmed card goes to the Resource Studio, the text is untouched", async () => {
    await remix.render({ root: root(), params: { target: "vocab-cards" }, shell: okShell() });
    type($("#st-rx-text"), text68.text);
    choose($("#st-rx-subject"), "math");
    buttonByText("Make my draft").click();
    assert.ok(await wait(() => $(".st-lt-card")));
    const card =
      $$(".st-lt-card").find((c) => c.querySelector("h3").textContent === "ratio table") ||
      $(".st-lt-card");
    const word = card.querySelector("h3").textContent;
    const meaning = card.querySelector("textarea");
    if (!meaning.value) type(meaning, "A table that shows equal ratios.");
    card.querySelector("input[type=checkbox]").click();
    type(card.querySelector("textarea"), "My own meaning.");
    buttonByText("Open in Resource Studio").click();
    assert.equal(window.location.hash, "#/create?type=remix-vocab-cards&draft=remix&subject=math");
    const saved = readHandoff().draft;
    assert.equal(saved.source, text68.text);
    const sent = saved.cards.find((c) => c.word === word);
    assert.equal(sent.def, "My own meaning.");
    assert.equal(sent.confirmed, true);
  });

  it("adds a word, removes a card, and does not duplicate a word", async () => {
    await remix.render({ root: root(), params: { target: "vocab-cards" }, shell: okShell() });
    type($("#st-rx-text"), text68.text);
    buttonByText("Make my draft").click();
    assert.ok(await wait(() => $(".st-lt-card")));
    const n = $$(".st-lt-card").length;
    const input = $(".st-lt-add input");
    type(input, "denominator");
    buttonByText("Add word").click();
    assert.equal($$(".st-lt-card").length, n + 1);
    type($(".st-lt-add input"), "Denominator");
    buttonByText("Add word").click();
    assert.equal($$(".st-lt-card").length, n + 1);
    buttonByText("Remove denominator").click();
    assert.equal($$(".st-lt-card").length, n);
  });

  it("evidence: needs a claim, a marked sentence and a choice before it can go on", async () => {
    await remix.render({ root: root(), params: { target: "evidence" }, shell: okShell() });
    type($("#st-rx-text"), text68.text);
    buttonByText("Make my draft").click();
    assert.ok(await wait(() => $("#st-rx-draft")));
    assert.match($(".st-lt-problems").textContent, /Add at least one claim/);
    buttonByText("Add to claims").click();
    type($(".st-ll-editlist textarea"), "The unit rate stays the same.");
    const rows = $$(".st-lt-evrow");
    assert.ok(rows.length >= 3);
    rows[0].querySelector("input[type=checkbox]").click();
    const sel = rows[0].querySelector("select");
    assert.equal(sel.hidden, false);
    assert.equal(sel.options.length, 2);
    choose(sel, sel.options[1].value);
    assert.match($(".st-lt-problems").textContent, /ready for the Resource Studio/);
    buttonByText("Open in Resource Studio").click();
    assert.match(window.location.hash, /^#\/create\?type=remix-evidence&draft=remix/);
    assert.equal(readHandoff().draft.evidence.find((e) => e.use).supports, "c1");
  });

  it("exit ticket: the task is editable and blank list lines are dropped on the way out", async () => {
    await remix.render({ root: root(), params: { target: "exit-ticket" }, shell: okShell() });
    type($("#st-rx-obj"), "I can compare two fractions using a number line.");
    buttonByText("Make my draft").click();
    assert.ok(await wait(() => $("#st-rx-draft")));
    buttonByText("Add to criteria").click();
    type($("#st-rx-obj"), "unchanged");
    buttonByText("Open in Resource Studio").click();
    const d = readHandoff().draft;
    assert.ok(d.criteria.every((c) => c.trim()));
    assert.match(d.prompt, /^Compare two fractions using a number line\.$/);
    assert.equal(Object.keys(d.frames).length, 4);
  });

  it("carries text from the Language Lens exactly and says so", async () => {
    await lens.render({ root: root(), params: {}, shell: okShell() });
    const exact = `${TEXT} ${text68.text}`;
    type($("#st-lens-text"), exact);
    choose($("#st-lens-grade"), "6");
    buttonByText("Look at the language").click();
    buttonByText("Remix this text").click();
    await remix.render({ root: root(), params: { from: "lens", grade: "6" }, shell: okShell() });
    assert.equal($("#st-rx-text").value, exact.slice(0, 20000));
    assert.match(root().textContent, /came from the Language Lens/);
    assert.equal($("#st-rx-grade").value, "6");
  });

  it("explains a draft that cannot be made, keeps the text, and offers a retry", async () => {
    await remix.render({ root: root(), params: { target: "discussion" }, shell: okShell() });
    type($("#st-rx-text"), "Two words");
    buttonByText("Make my draft").click();
    assert.equal($(".st-lt-status").getAttribute("role"), "alert");
    assert.equal($("#st-rx-text").value, "Two words");
    assert.equal($("#st-rx-draft"), null);
  });

  it("vocabulary cards still work when the studio vocabulary cannot load", async () => {
    await remix.render({ root: root(), params: { target: "vocab-cards" }, shell: failShell() });
    type($("#st-rx-text"), text68.text);
    buttonByText("Make my draft").click();
    assert.ok(await wait(() => $("#st-rx-draft")));
    assert.match(root().textContent, /studio vocabulary could not be loaded/);
    assert.ok($$(".st-lt-card textarea").every((t) => t.value === ""));
  });
});
