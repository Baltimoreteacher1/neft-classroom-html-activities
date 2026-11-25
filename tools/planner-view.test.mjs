#!/usr/bin/env node
/**
 * "My Week" Studio view (#/week) in jsdom with the real planner behind a stubbed fetch: the form fills from the URL,
 * the plan shows minutes per day and the dropped list, the export buttons point at the right API formats, the calendar
 * button needs a start date, the share link carries every choice, and a bad URL shows an error instead of a plan.
 * Also: router registration, no inline script, and the band labels stay out of student-facing text (there is none).
 * Exit 0 pass, 1 fail, 3 broken. Run: node tools/planner-view.test.mjs
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { JSDOM } from "jsdom";
import { VIEW_FOR, VIEW_TITLES } from "../bcpss-teachers/studio/core/router.js";
import { buildWeekPlan } from "../functions/_lib/bcpss/week-plan.js";
import { parseSearch } from "../shared/planner/params.js";

const dom = new JSDOM("<!doctype html><body><main id=root></main></body>", {
  url: "https://example.test/bcpss-teachers/studio/index.html",
});
Object.assign(globalThis, {
  window: dom.window,
  document: dom.window.document,
  location: dom.window.location,
  HashChangeEvent: dom.window.HashChangeEvent,
});
Object.defineProperty(globalThis, "navigator", { value: dom.window.navigator, configurable: true });

const calls = [];
globalThis.fetch = async (url) => {
  calls.push(String(url));
  const parsed = parseSearch(String(url).split("?")[1]);
  if (!parsed.ok)
    return new Response(JSON.stringify({ ok: false, error: parsed.errors.join(" ") }), {
      status: 400,
    });
  const res = await buildWeekPlan({}, parsed.params);
  return new Response(
    JSON.stringify(res.ok ? { ok: true, plan: res.plan } : { ok: false, error: res.error }),
    { status: res.ok ? 200 : res.status },
  );
};
const catalog = {
  seedUnits: async () => [{ id: "g6-math-u1", unit_number: 1, unit_title: "Geometry in boxes" }],
};

const { render } = await import("../bcpss-teachers/studio/views/week/week.js");
const tick = (ms = 10) => new Promise((r) => setTimeout(r, ms));
/** Wait (bounded) until the page shows a plan or an error. */
async function settled() {
  for (let i = 0; i < 300; i++) {
    if (document.querySelector(".st-wk-day, .st-wk-out .st-error")) return;
    await tick(10);
  }
}
const root = document.getElementById("root");
const text = (el) => el.textContent.replace(/\s+/g, " ");

async function main() {
  assert.equal(VIEW_FOR.week, "week/week");
  assert.equal(VIEW_TITLES["week/week"], "My Week");

  const params = {
    unit: "g6-math-u1",
    b12: "6",
    b34: "12",
    b56: "6",
    block: "45",
    days: "3",
    seed: "0",
    start: "2026-11-30",
    cal: "0",
    route: "week",
  };
  await render({ root, params, shell: { catalog } });
  await settled();
  assert.ok(root.querySelector("h1")?.textContent === "My Week", "heading");
  assert.equal(root.querySelector("#wk-block").value, "45", "form filled from the URL");
  assert.equal(root.querySelector("#wk-1_2").value, "6");
  assert.equal(
    root.querySelector("#wk-unit").value,
    "g6-math-u1",
    "unit selected after the list loads",
  );
  const days = [...root.querySelectorAll(".st-wk-day h3")].map((n) => n.textContent);
  assert.equal(days.length, 3, `three days: ${text(root.querySelector(".st-wk-out"))}`);
  for (const d of days) {
    const [, used, cap] = /(\d+) of (\d+) minutes/.exec(d);
    assert.ok(Number(used) <= Number(cap) && Number(cap) === 45, `day within cap: ${d}`);
  }
  assert.match(days[0], /Day 1 · Mon Nov 30 · \d+ of 45 minutes/, "date label from the start date");
  assert.ok(root.querySelector(".st-wk-dropped li"), "dropped list is shown");
  assert.match(
    text(root.querySelector(".st-wk-dropped")),
    /Lower priority|Needs|Takes/,
    "each drop says why",
  );
  const actions = [...root.querySelectorAll(".st-wk-actions a")].map((a) => [
    a.textContent,
    a.getAttribute("href"),
  ]);
  assert.deepEqual(
    actions.map(([t]) => t),
    ["Print", "DOCX", ".ics calendar"],
  );
  assert.match(actions[0][1], /format=pdf/);
  assert.match(actions[1][1], /format=docx/);
  assert.match(actions[2][1], /format=ics/);
  assert.ok(
    [...root.querySelectorAll("button")].some((b) => b.textContent === "Copy link"),
    "copy link button",
  );
  assert.match(text(root.querySelector(".st-wk-summary")), /Planned \d+ of 135 minutes/);
  assert.match(text(root), /Paper and pencil only/);
  assert.match(text(root), /not official, not a score, not a placement tool/);

  // Without a start date there is no .ics link, and the copy link carries every choice.
  root.replaceChildren();
  await render({ root, params: { ...params, start: "" }, shell: { catalog } });
  await settled();
  assert.ok(
    ![...root.querySelectorAll(".st-wk-actions a")].some((a) => a.textContent.includes(".ics")),
    "no ics without a start date",
  );
  let copied = "";
  Object.defineProperty(globalThis.navigator, "clipboard", {
    value: {
      writeText: async (t) => {
        copied = t;
      },
    },
    configurable: true,
  });
  [...root.querySelectorAll("button")].find((b) => b.textContent === "Copy link").click();
  await tick(10);
  assert.match(
    copied,
    /#\/week\?unit=g6-math-u1&b12=6&b34=12&b56=6&block=45&days=3&seed=0$/,
    "share link holds the whole plan",
  );

  // A bad URL shows the reason and builds no plan.
  root.replaceChildren();
  const before = calls.length;
  await render({ root, params: { ...params, block: "50" }, shell: { catalog } });
  await settled();
  assert.match(text(root.querySelector("#wk-errors")), /block must be one of 45, 60, 90/);
  assert.equal(calls.length, before, "no API call for an invalid plan");
  assert.equal(root.querySelectorAll(".st-wk-day").length, 0);

  // No inline script, no purple/violet/indigo in the stylesheet.
  const css = readFileSync(
    new URL("../bcpss-teachers/studio/views/week/week.css", import.meta.url),
    "utf8",
  );
  assert.ok(!/(purple|violet|indigo|#[0-9a-f]{6})/i.test(css), "stylesheet uses tokens only");
  assert.equal(root.querySelectorAll("script").length, 0, "no inline script");
  console.log(
    "PASS planner-view: form, plan, dropped list, export links, share link, invalid-URL path",
  );
  return 0;
}

main().then(
  (c) => process.exit(c),
  (err) => {
    if (err?.name === "AssertionError") {
      console.error(`FAIL planner-view: ${err.message}`);
      process.exit(1);
    }
    console.error("BROKEN GATE planner-view:", err);
    process.exit(3);
  },
);
