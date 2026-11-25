#!/usr/bin/env node
/**
 * BCPSS Language Studio lessons UI, driven in jsdom with REAL payloads from loadLessons('g6-math-u1'):
 * timeline (draft chip, demand badges), lesson page (teacher card, arc stepper by keyboard, newcomer toggle, projector,
 * student link + QR), the student view (no teacher text, resume, Spanish help, device-only storage), the retry path,
 * accessible names on every control, and a grep that the stylesheet carries no fixed widths that could force a sideways scroll.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { JSDOM } from "jsdom";
import { loadLessons, summarize } from "../functions/_lib/bcpss/lessons.js";
import { loadStudio } from "../functions/_lib/bcpss/studio.js";

const UNIT = "g6-math-u1"; // a generated (draft) unit; g6-math-u2 is hand-authored
const BASE = "https://eduwonderlab.com/bcpss-teachers/language-studio/";
const set = await loadLessons(UNIT);
const studio = await loadStudio(UNIT);
const lessons = set.lessons;
const lesson = lessons[0];

// ---------- environment ----------
const dom = new JSDOM(
  '<!doctype html><html lang="en"><body><main id="stMain"></main><div id="stLive"></div></body></html>',
  { url: `${BASE}?unit=${UNIT}`, pretendToBeVisual: true },
);
const { window } = dom;
const { document } = window;
Object.assign(globalThis, {
  window,
  document,
  Node: window.Node,
  HTMLElement: window.HTMLElement,
  location: window.location,
  CSS: window.CSS || { escape: (s) => String(s) },
});
window.scrollTo = () => {};
let fullscreenCalls = 0;
window.HTMLElement.prototype.requestFullscreen = () => {
  fullscreenCalls++;
  return Promise.resolve();
};

let failApi = false;
const requested = [];
globalThis.fetch = async (url) => {
  requested.push(String(url));
  const json = (body, status = 200) => ({ ok: status < 400, status, json: async () => body });
  if (failApi) return json({}, 503);
  if (url === `/api/bcpss/units/${UNIT}/lessons`)
    return json({
      unit_id: UNIT,
      version: set.version,
      source: set.source,
      draft_notice:
        set.source === "draft_standards_based" ? "Draft: align to your pacing guide" : null,
      lessons: lessons.map(summarize),
    });
  const m = /^\/api\/bcpss\/lessons\/([a-z0-9-]+)$/.exec(url);
  const found = m && lessons.find((l) => l.id === m[1]);
  return found ? json(found) : json({}, 404);
};

const { lessonsSection, renderLessonPage, demandBadge } = await import(
  "../bcpss-teachers/language-studio/studio-lessons.js"
);
const { lessonKeep, demandLevel } = await import(
  "../bcpss-teachers/language-studio/studio-lesson-data.js"
);

const main = document.getElementById("stMain");
let cleanup = null;
const app = {
  unitId: UNIT,
  level: "l3_4",
  unit: { unit_title: "Ratios and rates" },
  studio: { vocab: studio.vocab, activities: [] },
  family: false,
  hasKind: () => true,
  go: () => {
    window.history.pushState(null, "", `${BASE}?unit=${UNIT}`);
    app.route();
  },
  setLevel(level) {
    app.level = level;
    const p = new URLSearchParams({ unit: UNIT, level, ...(lessonKeep() || {}) });
    window.history.replaceState(null, "", `${BASE}?${p}`);
    app.route();
  },
  route() {
    cleanup?.();
    cleanup = renderLessonPage(main, app);
  },
};

const wait = (ms) => new Promise((r) => setTimeout(r, ms));
async function waitFor(fn, label, ms = 3000) {
  const end = Date.now() + ms;
  for (;;) {
    const v = fn();
    if (v) return v;
    if (Date.now() > end) assert.fail(`timed out waiting for ${label}`);
    await wait(15);
  }
}
const open = (query) => {
  window.history.replaceState(null, "", `${BASE}?unit=${UNIT}&level=${app.level}&${query}`);
  app.route();
};
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
const text = (el) => (el?.textContent || "").replace(/\s+/g, " ").trim();
const panelTitle = () => text($(".sl-panel h3"));
const stepButtons = () => $$(".sl-step");

function accessibleName(el) {
  const label = el.getAttribute("aria-label");
  if (label?.trim()) return label.trim();
  const by = el.getAttribute("aria-labelledby");
  if (by)
    return by
      .split(/\s+/)
      .map((id) => text(document.getElementById(id)))
      .join(" ")
      .trim();
  if (el.id) {
    const lab = document.querySelector(`label[for="${el.id}"]`);
    if (lab) return text(lab);
  }
  return text(el);
}

// ---------- tests ----------
test("demand bands: low < 0.45, medium < 0.6, high >= 0.6", () => {
  assert.equal(demandLevel(0.44), "low");
  assert.equal(demandLevel(0.45), "medium");
  assert.equal(demandLevel(0.59), "medium");
  assert.equal(demandLevel(0.6), "high");
  const badge = demandBadge(0.5);
  assert.match(text(badge), /Language demand: Medium/);
  assert.ok($(".sl-bars", badge), "badge carries a shape, not color alone");
});

test("timeline: one item per lesson, draft chip, demand badge, minutes, KLU, named links", async () => {
  const section = lessonsSection(app);
  main.replaceChildren(section);
  await waitFor(() => $$(".sl-tl__item", section).length === lessons.length, "timeline items");
  assert.equal(set.source, "draft_standards_based", "fixture is a draft unit");
  assert.ok(text(section).includes("Draft: align to your pacing guide"), "draft chip text visible");
  assert.equal(
    $$(".sl-draft", section).length,
    lessons.length + 1,
    "section chip + one per lesson",
  );
  const items = $$(".sl-tl__item", section);
  items.forEach((item, i) => {
    const l = lessons[i];
    const label = { low: "Low", medium: "Medium", high: "High" }[
      demandLevel(l.language_demand_score)
    ];
    assert.match(text($(".sl-demand", item)), new RegExp(`Language demand: ${label}`));
    assert.ok($(".sl-bars", item));
    assert.ok(text(item).includes(`${l.teacher_card.minutes} min`));
    assert.ok(text(item).includes(l.language_objective.klu));
    const link = $("a.sl-tl__link", item);
    assert.match(link.getAttribute("href"), new RegExp(`lesson=${l.id}`));
    assert.ok(text(link).includes(l.title));
  });
});

test("timeline: API failure shows a friendly error with a working retry", async () => {
  failApi = true;
  // the unit-lessons response is cached after the first success, so use a unit id that was never fetched
  const fresh = lessonsSection({ ...app, unitId: "g6-math-u99" });
  main.replaceChildren(fresh);
  await waitFor(() => $(".sl-fail", fresh), "error card");
  assert.ok($(".sl-fail button", fresh), "retry button");
  assert.match(text($(".sl-fail", fresh)), /connection|offline/i);
  failApi = false;
  $(".sl-fail button", fresh).click();
  await waitFor(() => !document.body.contains(fresh) || !$(".sl-fail", fresh), "retry resolves");
});

test("lesson page (teacher): teacher card first, arc stepper by keyboard, all six kinds mount or degrade kindly", async () => {
  open(`lesson=${lesson.id}`);
  await waitFor(() => $(".sl-panel"), "lesson panel");
  assert.equal(text($("h1")), lesson.title);
  assert.ok(!/\b(null|undefined)\b/.test(text($(".sl"))), "no stray null/undefined text");
  const order = $$("h2, h1").map(text);
  assert.ok(
    order.indexOf("Plan this lesson") > 0 &&
      order.indexOf("Teach it step by step") > order.indexOf("Plan this lesson"),
    "teacher card precedes the stepper",
  );
  const card = text($(".sl-teacher"));
  for (const t of [
    lesson.content_objective,
    lesson.teacher_card.listen_for[0],
    lesson.teacher_card.watchouts[0],
    lesson.teacher_card.materials[0],
    lesson.teacher_card.differentiation.newcomer,
    lesson.language_objective.by_level.l3_4,
  ])
    assert.ok(card.includes(t), `teacher card has: ${t.slice(0, 40)}`);
  for (const h3 of [
    "Objectives",
    "The 3 moves",
    "Materials",
    "What to listen for",
    "Watch-outs",
    "Differentiation",
  ])
    assert.ok(card.includes(h3), h3);
  assert.equal(
    $$(".sl-checklist input[type=checkbox]").length,
    lesson.teacher_card.listen_for.length,
  );
  assert.equal(
    $("a[href*='/export?format=html']").getAttribute("href"),
    `/api/bcpss/lessons/${lesson.id}/export?format=html`,
  );

  const names = ["Warm Up", "Input", "Notice", "Interact", "Produce", "Check"];
  const btns = stepButtons();
  assert.equal(btns.length, 6 + 1, "six arc steps + optional extension");
  assert.deepEqual(
    btns.slice(0, 6).map((b) => text($(".sl-step__name", b))),
    names,
  );
  assert.equal(btns[0].getAttribute("aria-current"), "step");
  btns[0].focus();
  btns[0].dispatchEvent(new window.KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
  assert.equal(document.activeElement, btns[1], "ArrowRight moves focus to the next step");
  btns[1].dispatchEvent(new window.KeyboardEvent("keydown", { key: "End", bubbles: true }));
  assert.equal(document.activeElement, btns[btns.length - 1]);
  btns[1].focus();

  let mounted = 0;
  for (let i = 0; i < 6; i++) {
    const step = lesson.arc[i];
    if (i > 0) {
      const next = $$(".sl-pager button").find((b) => text(b).startsWith("Next"));
      assert.ok(next, "Next button");
      next.click();
    }
    assert.equal(panelTitle(), step.activity.title);
    assert.equal(stepButtons()[i].getAttribute("aria-current"), "step");
    assert.equal(new URLSearchParams(window.location.search).get("step"), String(i + 1));
    await waitFor(
      () => $(".sl-stage .st-kind")?.childNodes.length > 0,
      `stage content for ${step.activity.kind}`,
    );
    if (!$(".sl-stage .st-stage--placeholder")) mounted++;
    assert.equal($(".sl-stage .st-kind").dataset.kind, step.activity.kind);
  }
  console.log(`  kinds mounted in jsdom: ${mounted}/6 (the rest degrade to the placeholder card)`);
  assert.ok(mounted >= 1, "at least one real kind mounts");
});

test("differentiation toggle: Newcomer swaps the arc for newcomer_path; levels switch back", async () => {
  open(`lesson=${lesson.id}`);
  await waitFor(() => $(".sl-panel"), "lesson panel");
  const toggle = $$(".sl-toggle button");
  assert.deepEqual(toggle.map(text), ["L1–2", "L3–4", "L5–6", "Newcomer"]);
  assert.equal(toggle[1].getAttribute("aria-pressed"), "true");
  toggle[3].click();
  await waitFor(() => stepButtons().length === lesson.newcomer_path.length, "newcomer steps");
  assert.deepEqual(
    stepButtons().map((b) => text($(".sl-step__name", b))),
    lesson.newcomer_path.map((a) => a.title),
  );
  assert.equal($$(".sl-toggle button")[3].getAttribute("aria-pressed"), "true");
  assert.equal(panelTitle(), lesson.newcomer_path[0].title);
  assert.equal(new URLSearchParams(window.location.search).get("track"), "newcomer");
  assert.ok(!text($(".sl-stepper")).includes("Extension"), "no extension on the newcomer path");
  $$(".sl-toggle button")[2].click();
  await waitFor(() => stepButtons().length === 7, "arc is back");
  assert.equal(app.level, "l5_6");
  assert.equal($$(".sl-toggle button")[2].getAttribute("aria-pressed"), "true");
  assert.ok(!new URLSearchParams(window.location.search).has("track"));
  assert.equal(
    new URLSearchParams(window.location.search).get("lesson"),
    lesson.id,
    "level change keeps the lesson in the URL",
  );
  app.level = "l3_4";
});

test("extension opens as an optional step for L5-6", async () => {
  app.level = "l5_6";
  open(`lesson=${lesson.id}&step=ext`);
  await waitFor(() => $(".sl-panel"), "panel");
  assert.equal(panelTitle(), lesson.extension.title);
  assert.match(text(stepButtons().at(-1)), /Extension.*optional/);
  app.level = "l3_4";
});

test("projector mode adds sl-projector, requests fullscreen, leaves on Escape; share panel has link and QR", async () => {
  open(`lesson=${lesson.id}&step=2`);
  await waitFor(() => $(".sl-panel"), "panel");
  const share = $(".sl-share");
  const url = $("#slShareUrl").value;
  assert.match(url, /^https:\/\/eduwonderlab\.com\/bcpss-teachers\/language-studio\/\?/);
  assert.match(url, new RegExp(`lesson=${lesson.id}`));
  assert.match(url, /step=2/);
  assert.match(url, /view=student/);
  assert.ok($(".sl-qr svg", share), "QR code rendered");
  assert.ok($(".sl-qr svg", share).getAttribute("aria-label").includes("QR code"));
  const project = $$("button").find((b) => text(b) === "Project this step");
  project.click();
  assert.ok($(".sl").classList.contains("sl-projector"));
  assert.equal(fullscreenCalls, 1);
  document.dispatchEvent(new window.KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
  assert.ok(!$(".sl").classList.contains("sl-projector"));
  assert.equal(document.activeElement, project, "focus returns to the project button");
});

test("student view: no teacher text, resume, Spanish help, device-only storage", async () => {
  window.localStorage.clear();
  open(`lesson=${lesson.id}&view=student`);
  await waitFor(() => $(".sl-panel"), "student panel");
  const body = text(document.body);
  assert.ok(!/\b(null|undefined)\b/.test(body), "no stray null/undefined text");
  const teacherOnly = [
    "Teacher card",
    "Plan this lesson",
    "What to listen for",
    "Watch-outs",
    lesson.teacher_card.listen_for[0],
    lesson.teacher_card.watchouts[0],
    lesson.teacher_card.materials[0],
    lesson.teacher_card.differentiation.newcomer,
    lesson.arc[0].activity.tip,
    "Teacher tip",
    "Print lesson",
    "Project this step",
    "Student link",
    "Differentiation",
  ];
  for (const t of teacherOnly) assert.ok(!body.includes(t), `student view must not show: ${t}`);
  assert.ok(!$(".sl-teacher") && !$(".sl-share") && !$("a[href*='export']"));
  assert.equal($(".sl").dataset.view, "student");
  assert.equal(window.document.documentElement.dataset.slView, "student");
  assert.match(text($(".sl-ican")), /Today I can/);
  assert.equal(panelTitle(), lesson.arc[0].activity.title);

  // resume: advance two steps, reopen with no ?step=
  const next = () =>
    $$(".sl-pager button")
      .find((b) => text(b).startsWith("Next"))
      .click();
  next();
  next();
  assert.equal(panelTitle(), lesson.arc[2].activity.title);
  open(`lesson=${lesson.id}&view=student`);
  await waitFor(() => $(".sl-panel"), "resumed panel");
  assert.equal(panelTitle(), lesson.arc[2].activity.title, "resumes at the last step");

  // Spanish help
  const es = $(".sl-es");
  assert.equal(es.getAttribute("aria-pressed"), "false");
  assert.ok(!$(".sl-gloss section, .sl-gloss h3"));
  es.click();
  assert.equal(es.getAttribute("aria-pressed"), "true");
  const gloss = text($(".sl-gloss"));
  const studio = (await import("../db/seeds/bcpss/v2/units/g6-math-u1.mjs")).default;
  const spanish = studio.vocab.map((v) => v.es).filter(Boolean);
  assert.ok(
    spanish.some((w) => gloss.includes(w)),
    "Spanish gloss from the unit vocabulary",
  );
  assert.equal($(".sl-gloss [lang=es]").getAttribute("lang"), "es");

  // storage: only bcpss-lesson: keys, nothing else on the device from this UI
  const keys = Object.keys(window.localStorage);
  assert.ok(keys.length >= 2);
  for (const k of keys) assert.ok(k.startsWith("bcpss-lesson:"), `unexpected storage key ${k}`);
  assert.ok(
    // The one read outside /api/bcpss is the aggregate review badge for the unit (no student field, no key).
    requested.every(
      (u) =>
        (u.startsWith("/api/bcpss/") || /^\/api\/review\/summary\?unit=[a-z0-9-]+$/.test(u)) &&
        !/stars|rating|progress/.test(u),
    ),
    "no student data sent to a server",
  );
});

test("student view works with storage blocked", async () => {
  const real = Object.getOwnPropertyDescriptor(window, "localStorage");
  Object.defineProperty(window, "localStorage", {
    configurable: true,
    get() {
      throw new window.DOMException("blocked", "SecurityError");
    },
  });
  try {
    open(`lesson=${lesson.id}&view=student&step=3`);
    await waitFor(() => $(".sl-panel"), "panel without storage");
    assert.equal(panelTitle(), lesson.arc[2].activity.title);
    $(".sl-es").click();
    $$(".sl-pager button")
      .find((b) => text(b).startsWith("Next"))
      .click();
    assert.equal(panelTitle(), lesson.arc[3].activity.title);
  } finally {
    if (real) Object.defineProperty(window, "localStorage", real);
    else delete window.localStorage;
  }
});

test("lesson page: API failure shows a friendly error and retry loads the lesson; bad ids are not found", async () => {
  failApi = true;
  const other = lessons[1];
  open(`lesson=${other.id}`);
  const card = await waitFor(() => $(".sl-fail"), "lesson error card");
  assert.match(text(card), /did not load/i);
  assert.equal(card.getAttribute("role"), "alert");
  failApi = false;
  $$("button", card)
    .find((b) => text(b) === "Try again")
    .click();
  await waitFor(() => $(".sl-panel") && text($("h1")) === other.title, "retry renders lesson");
  open("lesson=NOT_A_LESSON!");
  await waitFor(() => $(".sl-fail"), "not found");
  assert.match(text($(".sl-fail")), /could not find that lesson/i);
  open("lesson=g6-math-u9-l01");
  await waitFor(() => $(".sl-fail"), "wrong unit not found");
});

test("every interactive control is a native button/link/input with an accessible name", async () => {
  for (const q of [`lesson=${lesson.id}`, `lesson=${lesson.id}&view=student`]) {
    open(q);
    await waitFor(() => $(".sl-panel"), "panel");
    for (const bad of $$("[onclick], [role=button], div[tabindex='0'], span[tabindex='0']"))
      assert.fail(`non-native control: ${bad.outerHTML.slice(0, 80)}`);
    const controls = $$(".sl button, .sl a, .sl input, .sl summary");
    assert.ok(controls.length > 8);
    for (const el of controls) {
      assert.ok(accessibleName(el).length > 0, `unnamed control: ${el.outerHTML.slice(0, 100)}`);
      if (el.tagName === "A") assert.ok(el.getAttribute("href"), "link has href");
      if (el.tagName === "BUTTON") assert.equal(el.getAttribute("type"), "button");
    }
    for (const svg of $$(".sl svg")) {
      const labelled = svg.getAttribute("aria-label") || svg.getAttribute("aria-hidden") === "true";
      assert.ok(labelled || svg.closest(".sl-qr"), "decorative svg is aria-hidden");
    }
  }
});

test("stylesheet has no fixed widths that could cause horizontal overflow", () => {
  const css = readFileSync(
    fileURLToPath(new URL("../bcpss-teachers/language-studio/studio-lessons.css", import.meta.url)),
    "utf8",
  ).replace(/\/\*[\s\S]*?\*\//g, "");
  const fixed = [
    ...css.matchAll(
      /(?<![-\w])(width|min-width|inline-size|min-inline-size)\s*:\s*([\d.]+)(px|vw)\b/g,
    ),
  ];
  const bad = fixed.filter(
    ([, prop, n, unit]) => unit === "vw" || (prop === "min-width" ? Number(n) > 48 : Number(n) > 2),
  );
  assert.deepEqual(
    bad.map((m) => m[0]),
    [],
    "fixed widths found",
  );
  assert.ok(!/overflow-x\s*:\s*scroll/.test(css));
  assert.match(css, /prefers-reduced-motion/);
  assert.ok(!/(?<![-\w])(left|right)\s*:\s*-\d{3,}px/.test(css));
});
