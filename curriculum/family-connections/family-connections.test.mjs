import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import { JSDOM } from "jsdom";
import { createDefaultSnapshot } from "./shared/model.js";
import { SESSIONS } from "../../scripts/lib/homework-session-flow.mjs";
import {
  DEFAULT_ROUTE,
  PRODUCT_NAME,
  ROUTES,
  SESSION_LABELS,
  SESSION_TWO_LESSONS,
  homeworkHref,
  sessionsForWeek,
} from "./shared/hub-routes.js";
import { isTeacherSurface } from "../../functions/_lib/teacher-surface.js";
import {
  weekPhase,
  schoolDate,
  familyLink,
  isHomeworkEditorPath,
  messageDestination,
  renderHomeworkHub,
} from "./shared/homework-hub.js";
const html = await readFile(new URL("./index.html", import.meta.url), "utf8");
test("family entry has only homework and messaging; legacy meetings keep their page", async () => {
  for (const id of [
    "section-select",
    "family-homework",
    "language-switch",
    "text-size-toggle",
    "contrast-toggle",
    "teacher-access",
  ])
    assert.match(html, new RegExp(`id="${id}"`));
  assert.doesNotMatch(
    html,
    /homework-library|family-quick-post|family-scheduler\.js|family-pulse|contenteditable/,
  );
  const meetings = await readFile(new URL("./meetings/index.html", import.meta.url), "utf8");
  assert.match(meetings, /id="meeting-request-form"/);
  const app = await readFile(new URL("./family-app.js", import.meta.url), "utf8");
  assert.match(app, /query\.get\(["']section["']\) \|\| preferences\.sectionId/);
  assert.match(app, /location\.replace/);
});
test("teacher editor lives only on a password-gated teacher route", async () => {
  const app = await readFile(new URL("./family-app.js", import.meta.url), "utf8");
  const login = await readFile(new URL("./teacher/login.html", import.meta.url), "utf8");
  const teacherHtml = await readFile(new URL("./teacher/homework.html", import.meta.url), "utf8");
  assert.doesNotMatch(html, /id="teacher-inline"|id="inline-days"/);
  assert.match(teacherHtml, /id="teacher-inline"[^>]*hidden/);
  assert.match(teacherHtml, /id="inline-days"/);
  assert.match(teacherHtml, /id="draft-preview-panel"[^>]*hidden/);
  assert.match(html, /Teacher sign in/);
  assert.match(app, /if \(editRequested\) \{\s*try \{\s*editDraft = await loadDraft\(\)/);
  assert.match(app, /query\.get\("edit"\) === "1"\) location\.replace\(editorLoginUrl\(\)\)/);
  assert.match(login, /family-connections\/teacher\/homework\.html/);
  assert.equal(isTeacherSurface("/curriculum/family-connections/teacher/login.html"), true);
  assert.equal(isTeacherSurface("/curriculum/family-connections/teacher/homework.html"), true);
  assert.equal(isTeacherSurface("/curriculum/family-connections/teacher/homework"), true);
  assert.equal(isTeacherSurface("/curriculum/family-connections/"), false);
});
test("Cloudflare's extensionless editor URL stays in teacher mode", () => {
  assert.equal(isHomeworkEditorPath("/curriculum/family-connections/teacher/homework.html"), true);
  assert.equal(isHomeworkEditorPath("/curriculum/family-connections/teacher/homework"), true);
  assert.equal(isHomeworkEditorPath("/curriculum/family-connections/teacher/homework/"), true);
  assert.equal(isHomeworkEditorPath("/curriculum/family-connections/"), false);
});
test("freshness uses school date, handles missing/stale/future weeks and Sunday boundary", () => {
  assert.equal(schoolDate(new Date("2026-09-28T01:00:00Z")), "2026-09-27");
  // School time, not UTC: 03:00Z Saturday is still Friday 11 pm in Baltimore.
  assert.equal(weekPhase("2026-09-21", new Date("2026-09-26T03:00:00Z")), "current");
  // A weekend belongs to the week about to start (pacing-week.js weekStartFor).
  assert.equal(weekPhase("2026-09-21", new Date("2026-09-26T16:00:00Z")), "past");
  assert.equal(weekPhase("2026-09-28", new Date("2026-09-26T16:00:00Z")), "current");
  assert.equal(weekPhase("2026-09-28", new Date("2026-09-28T01:00:00Z")), "current");
  assert.equal(weekPhase("2026-09-21", new Date("2026-09-28T12:00:00Z")), "past");
  assert.equal(weekPhase("2026-09-28", new Date("2026-09-24T12:00:00Z")), "upcoming");
  assert.equal(weekPhase("2026-99-99"), "empty");
});
test("class share and accurate ClassDojo destination", () => {
  assert.equal(
    familyLink("period-2", "es"),
    "https://eduwonderlab.com/curriculum/family-connections/?section=period-2&lang=es",
  );
  assert.equal(messageDestination(createDefaultSnapshot()), "https://home.classdojo.com/");
  assert.equal(
    messageDestination({ integrations: { classDojoUrl: "https://example.com/fake" } }),
    "https://home.classdojo.com/",
  );
});
test("actual family view renders selected homework, due date and Spanish action, hides stale cards", () => {
  const dom = new JSDOM('<div id="root"></div>');
  const previous = globalThis.document;
  globalThis.document = dom.window.document;
  try {
    const root = document.getElementById("root");
    const snapshot = createDefaultSnapshot();
    snapshot.sections[0].week.startDate = "2026-09-21";
    Object.assign(snapshot.sections[0].week.days[0], {
      status: "lesson",
      lessonId: "3-2",
      dueDate: "2026-09-25",
    });
    const lessons = [
      { id: "3-2", title: "Unit rates", homeworkPath: "/lessons/3-2/homework.html" },
    ];
    renderHomeworkHub(root, snapshot, lessons, "all-families", "es", {
      now: new Date("2026-09-24T12:00:00Z"),
    });
    assert.match(root.textContent, /Empezar el Estudio familiar de matemáticas · 5–10 min/);
    assert.match(root.textContent, /Entrega/);
    assert.equal(
      root.querySelector(".homework-card a").getAttribute("href"),
      "/lessons/3-2/homework.html?route=quick&lang=es&section=all-families",
    );
    renderHomeworkHub(root, snapshot, lessons, "all-families", "en", {
      now: new Date("2026-10-01T12:00:00Z"),
    });
    assert.equal(root.querySelector(".homework-card"), null);
    assert.match(root.querySelector("#family-week h2").textContent, /Waiting for this week/);
    assert.match(root.textContent, /Last posted: Sep 21, 2026 – Sep 25, 2026/);
    // Between weeks the last plan stays one tap away (audit 2026-10-04: the
    // waiting card had no homework link at all).
    assert.equal(
      root.querySelector(".catch-up-link").getAttribute("href"),
      "?section=all-families&week=2026-09-21",
    );
    assert.match(root.querySelector(".week-dates").textContent, /Sep 28, 2026 – Oct 2, 2026/);
  } finally {
    globalThis.document = previous;
    dom.window.close();
  }
});
test("family homework keeps all five weekdays in order, including repeated lessons and empty days", () => {
  const dom = new JSDOM('<div id="root"></div>');
  const previous = globalThis.document;
  globalThis.document = dom.window.document;
  try {
    const snapshot = createDefaultSnapshot();
    snapshot.sections[0].week.startDate = "2026-09-21";
    for (const [day, id] of [["Monday", "3-2"], ["Tuesday", "3-3"], ["Wednesday", "3-2"]]) {
      Object.assign(snapshot.sections[0].week.days.find((entry) => entry.day === day), {
        status: "lesson", lessonId: id,
      });
    }
    const lessons = [
      { id: "3-2", title: "Unit rates", homeworkPath: "/lessons/3-2/homework.html" },
      { id: "3-3", title: "Ratio tables", homeworkPath: "/lessons/3-3/homework.html" },
    ];
    const root = document.getElementById("root");
    renderHomeworkHub(root, snapshot, lessons, "all-families", "en", {
      now: new Date("2026-09-24T12:00:00Z"),
    });
    const cards = [...root.querySelectorAll(".homework-card")];
    assert.deepEqual(cards.map((card) => card.querySelector("h3").textContent), [
      "Monday", "Tuesday", "Wednesday", "Thursday", "Friday",
    ]);
    assert.deepEqual(cards.map((card) => card.querySelector("a")?.getAttribute("href") || ""), [
      "/lessons/3-2/homework.html?route=quick&lang=en&section=all-families",
      "/lessons/3-3/homework.html?route=quick&lang=en&section=all-families",
      // The same lesson posted again later in the week is its Session 2 night.
      "/lessons/3-2-part2/homework.html?route=quick&lang=en&section=all-families",
      "", "",
    ]);
    assert.deepEqual(cards.slice(0, 3).map((card) => card.querySelector(".eyebrow").textContent), [
      "Lesson 3-2 · Session 1: Concept Launch",
      "Lesson 3-3 · Session 1: Concept Launch",
      "Lesson 3-2 · Session 2: Compare & Apply",
    ]);
    assert.match(cards[3].textContent, /Not posted yet/);
    assert.equal(cards[3].querySelector(".today-badge")?.textContent, "Today");
    assert.equal(cards[0].querySelector(".day-date")?.textContent, "Sep 21, 2026");
    assert.equal(cards[0].querySelector(".day-work h4")?.textContent, "Unit rates");
    renderHomeworkHub(root, snapshot, lessons, "all-families", "es", {
      now: new Date("2026-09-24T12:00:00Z"),
    });
    assert.equal(root.querySelector(".homework-card h3").textContent, "Lunes");
  } finally {
    globalThis.document = previous;
    dom.window.close();
  }
});
test("service worker removes only its own cache and never caches authenticated pages", async () => {
  const sw = await readFile(new URL("./sw.js", import.meta.url), "utf8");
  assert.match(sw, /startsWith\(["']family-connections-["']\)/);
  assert.doesNotMatch(sw, /respondWith|cache\.put/);
});

/* ---- the weekly hub: time chooser, recommended route, sessions, empty state ---- */
const lessonList = [
  { id: "3-2", title: "Unit rates", homeworkPath: "/lessons/3-2/homework.html" },
  { id: "1-1", title: "Math is everywhere", homeworkPath: "/lessons/1-1/homework.html" },
  { id: "3-test-review", title: "Unit 3 Test Review", homeworkPath: "/curriculum/unit-3-test-review/" },
];
function withHub(fn) {
  const dom = new JSDOM('<div id="root"></div>', { url: "https://eduwonderlab.com/curriculum/family-connections/" });
  const previous = globalThis.document;
  globalThis.document = dom.window.document;
  const realFetch = globalThis.fetch;
  // The hub renders from data it was handed. A render that fetches is a defect.
  globalThis.fetch = () => {
    throw new Error("renderHomeworkHub must not touch the network");
  };
  try {
    return fn(dom.window.document.getElementById("root"));
  } finally {
    globalThis.fetch = realFetch;
    globalThis.document = previous;
    dom.window.close();
  }
}
const week = (days) => {
  const snapshot = createDefaultSnapshot();
  snapshot.sections[0].week.startDate = "2026-09-21";
  for (const [day, id] of days)
    Object.assign(snapshot.sections[0].week.days.find((entry) => entry.day === day), {
      status: "lesson",
      lessonId: id,
    });
  return snapshot;
};
const NOW = { now: new Date("2026-09-24T12:00:00Z") };

test("each posted night offers Family Math Studio first and the two shorter routes second, all carrying the chosen language", () => {
  withHub((root) => {
    const snapshot = week([["Monday", "3-2"]]);
    renderHomeworkHub(root, snapshot, lessonList, "all-families", "en", NOW);
    const card = root.querySelector(".homework-card");
    const links = [...card.querySelectorAll("a")];
    assert.deepEqual(
      links.map((a) => a.getAttribute("href")),
      [
        "/lessons/3-2/homework.html?route=quick&lang=en&section=all-families",
        "/lessons/3-2/homework.html?route=full&lang=en&section=all-families",
      ],
    );
    assert.match(links[0].textContent, /^Start Family Math Studio · 5–10 min/);
    assert.ok(links[0].classList.contains("route-primary"));
    assert.match(links[0].textContent, /Quick Practice route · recommended/);
    assert.equal(card.querySelector(".route-short-label").textContent, "More time tonight?");
    assert.deepEqual(links.slice(1).map((a) => a.textContent), ["Keep Going · 20–30 min"]);
    renderHomeworkHub(root, snapshot, lessonList, "all-families", "es", NOW);
    const spanish = [...root.querySelectorAll(".homework-card a")];
    assert.deepEqual(spanish.map((a) => a.getAttribute("href")), [
      "/lessons/3-2/homework.html?route=quick&lang=es&section=all-families",
      "/lessons/3-2/homework.html?route=full&lang=es&section=all-families",
    ]);
    assert.match(spanish[0].textContent, /^Empezar el Estudio familiar de matemáticas · 5–10 min/);
    assert.match(spanish[0].textContent, /Ruta: Práctica rápida · recomendada/);
    assert.equal(root.querySelector(".route-short-label").textContent, "¿Más tiempo esta noche?");
    assert.deepEqual(spanish.slice(1).map((a) => a.textContent), ["Seguir practicando · 20–30 min"]);
    // A family that never chose a language gets links that leave the choice to the lesson page.
    renderHomeworkHub(root, snapshot, lessonList, "all-families", "en", { ...NOW, linkLang: "" });
    assert.ok([...root.querySelectorAll(".homework-card a")].every((a) => !a.getAttribute("href").includes("lang=")));
  });
});

test("the recommended-route sentence names Family Math Studio (5–10 min) and nothing on the hub recommends the 20-minute route", () => {
  withHub((root) => {
    renderHomeworkHub(root, week([["Monday", "3-2"]]), lessonList, "all-families", "en", NOW);
    assert.equal(
      root.querySelector(".route-recommendation").textContent,
      "Family Math Studio (5–10 min) is the recommended route. Keep Going is for nights with more time.",
    );
    renderHomeworkHub(root, week([["Monday", "3-2"]]), lessonList, "all-families", "es", NOW);
    assert.match(root.querySelector(".route-recommendation").textContent, /^El Estudio familiar de matemáticas \(5–10 min\) es la ruta recomendada\./);
    assert.doesNotMatch(root.textContent, /20 o 30|20 or 30/);
    // A week with only a unit review has no routes to recommend.
    renderHomeworkHub(root, week([["Monday", "3-test-review"]]), lessonList, "all-families", "en", NOW);
    assert.equal(root.querySelector(".route-recommendation"), null);
  });
});

test("Joel's 2026-10-26 decision holds on the hub: Quick Practice is the default and primary route", async () => {
  const decisions = JSON.parse(await readFile(new URL("../../data/product-decisions.json", import.meta.url), "utf8"));
  const decision = decisions.decisions.find((entry) => entry.id === "family-homework-route-choices");
  assert.match(decision.decision, /Quick Practice is the default path/);
  assert.equal(decision.decidedOn, "2026-10-26");
  assert.equal(PRODUCT_NAME.en, "Family Math Studio");
  assert.equal(PRODUCT_NAME.es, "Estudio familiar de matemáticas");
  assert.deepEqual(Object.keys(ROUTES), ["quick", "full"], "default route first");
  // The hub and the lesson page name the default route the same way.
  const { DEFAULT_ROUTE: LESSON_DEFAULT_ROUTE } = await import("../../scripts/lib/homework-experience.mjs");
  assert.equal(DEFAULT_ROUTE, LESSON_DEFAULT_ROUTE);
  assert.equal(ROUTES.quick.label.en, "Quick Practice");
  assert.equal(ROUTES.quick.label.es, "Práctica rápida");
  assert.equal(ROUTES.full.label.en, "Keep Going");
  assert.equal(ROUTES.full.label.es, "Seguir practicando");
  const sources = await Promise.all(
    ["shared/homework-hub.js", "shared/hub-panels.js", "shared/hub-routes.js", "family-app.js", "index.html"].map((file) =>
      readFile(new URL(`./${file}`, import.meta.url), "utf8"),
    ),
  );
  for (const source of sources) assert.doesNotMatch(source, /20 or 30|20-minute|20 minute|route=core&|Elige 20 o 30/);
  for (const language of ["en", "es"]) assert.ok(ROUTES.full.label[language] !== PRODUCT_NAME[language]);
});

test("the hub's route words and times are the lesson page's", async () => {
  const generator = await readFile(new URL("../../scripts/homework-guided-notes.mjs", import.meta.url), "utf8");
  const { ROUTE_TIMES } = await import("../../scripts/lib/homework-experience.mjs");
  for (const [route, { minutes }] of Object.entries(ROUTES)) {
    assert.ok(generator.includes(`data-route-mode="${route}"`), `the lesson page has a ${route} route`);
    assert.equal(ROUTE_TIMES[route], minutes, `${route} time range`);
  }
  assert.match(generator, /Family Math Studio/);
});

test("session labels are the lesson pages' own words, and the same lesson posted twice is Session 1 then Session 2", () => {
  assert.equal(SESSION_LABELS[1].en, SESSIONS[1].en);
  assert.equal(SESSION_LABELS[1].es, SESSIONS[1].es);
  assert.equal(SESSION_LABELS[2].en, SESSIONS[2].en);
  assert.equal(SESSION_LABELS[2].es, SESSIONS[2].es);
  assert.deepEqual(
    sessionsForWeek([{ id: "3-2" }, { id: "1-1" }, { id: "3-2" }, { id: "3-test-review" }, { id: "3-2" }]),
    [1, null, 2, null, 2],
  );
  withHub((root) => {
    const snapshot = week([["Monday", "3-2"], ["Tuesday", "1-1"], ["Wednesday", "3-2"]]);
    renderHomeworkHub(root, snapshot, lessonList, "all-families", "es", NOW);
    const cards = [...root.querySelectorAll(".homework-card")];
    assert.equal(cards[0].querySelector(".eyebrow").textContent, "Lección 3-2 · Sesión 1: Lanzamiento del concepto");
    assert.equal(cards[1].querySelector(".eyebrow").textContent, "Lección 1-1", "a lesson with no Session 2 page is not a session");
    assert.equal(cards[2].querySelector(".eyebrow").textContent, "Lección 3-2 · Sesión 2: Comparar y aplicar");
    assert.equal(cards[2].querySelector("a").getAttribute("href"), "/lessons/3-2-part2/homework.html?route=quick&lang=es&section=all-families");
    assert.equal(cards[1].querySelector("a").getAttribute("href"), "/lessons/1-1/homework.html?route=quick&lang=es&section=all-families");
  });
});

test("the Session 2 list is the launch manifest's, and every Session 2 page exists", async () => {
  const launch = JSON.parse(await readFile(new URL("../../data/curriculum-launch-manifest.json", import.meta.url), "utf8"));
  assert.deepEqual([...SESSION_TWO_LESSONS].sort(), [...new Set(launch.partTwo.map((entry) => entry.parent))].sort());
  const { existsSync } = await import("node:fs");
  for (const id of SESSION_TWO_LESSONS)
    assert.ok(existsSync(new URL(`../../lessons/${id}-part2/homework.html`, import.meta.url)), `${id}-part2`);
});

test("homeworkHref refuses a route it does not know and only ever carries en or es", () => {
  assert.throws(() => homeworkHref("/lessons/3-2/homework.html", { route: "turbo" }), /unknown homework route/);
  assert.equal(homeworkHref("/lessons/3-2/homework.html", { route: "quick", lang: "fr", sectionId: "602" }), "/lessons/3-2/homework.html?route=quick&section=602");
});

test("the empty state is a Tonight anyway panel with three large optional tiles and keeps the ClassDojo block", () => {
  withHub((root) => {
    const snapshot = week([["Monday", "3-2"]]);
    renderHomeworkHub(root, snapshot, lessonList, "all-families", "en", { now: new Date("2026-10-07T12:00:00Z") });
    const panel = root.querySelector(".tonight-anyway");
    assert.ok(panel, "past week with nothing newer -> panel");
    assert.equal(panel.querySelector("h3").textContent, "Tonight anyway");
    assert.equal(panel.querySelector(".empty-state").textContent, "No homework is posted yet. Everything here is optional.");
    assert.deepEqual([...panel.querySelectorAll("a")].map((a) => a.getAttribute("href")), [
      "/math/practice-studio/boost/",
      "/curriculum/units/",
      "?section=all-families&week=2026-09-21",
    ]);
    assert.match(panel.textContent, /Last posted|Catch up on last week/);
    assert.match(root.textContent, /Last posted: Sep 21, 2026 – Sep 25, 2026/);
    assert.equal(root.querySelector(".message-panel a").getAttribute("href"), "https://home.classdojo.com/");
    // No plan has ever been posted: no catch-up tile, nothing invented.
    renderHomeworkHub(root, createDefaultSnapshot(), lessonList, "all-families", "es", NOW);
    assert.deepEqual([...root.querySelectorAll(".tonight-anyway a")].map((a) => a.getAttribute("href")), [
      "/math/practice-studio/boost/",
      "/curriculum/units/",
    ]);
    assert.match(root.textContent, /Todavía no hay tarea publicada/);
    assert.match(root.querySelector(".message-panel").textContent, /ClassDojo/);
  });
});

test("Mr. Neft's note renders only for the displayed week, with text lanes in both languages and no placeholder", () => {
  withHub((root) => {
    const snapshot = week([["Monday", "3-2"]]);
    const welcome = {
      enabled: true,
      weeks: { "2026-09-21": { en: "Hello families", es: "Hola familias" } },
    };
    renderHomeworkHub(root, snapshot, lessonList, "all-families", "en", { ...NOW, welcome });
    assert.equal(root.querySelector(".welcome-note .welcome-text").textContent, "Hello families");
    assert.equal(root.querySelector(".welcome-note video"), null, "no video, no player");
    renderHomeworkHub(root, snapshot, lessonList, "all-families", "es", { ...NOW, welcome });
    assert.equal(root.querySelector(".welcome-note .welcome-text").textContent, "Hola familias");
    for (const none of [null, { enabled: false, weeks: welcome.weeks }, { enabled: true, weeks: {} }]) {
      renderHomeworkHub(root, snapshot, lessonList, "all-families", "en", { ...NOW, welcome: none });
      assert.equal(root.querySelector(".welcome-note"), null);
      assert.doesNotMatch(root.textContent, /A note from Mr\. Neft/);
    }
    // Nothing posted: the note belongs to a posted week, not to the waiting card.
    renderHomeworkHub(root, snapshot, lessonList, "all-families", "en", { now: new Date("2026-10-07T12:00:00Z"), welcome });
    assert.equal(root.querySelector(".welcome-note"), null);
  });
});

/* ---- phone layout, read from the stylesheet the page ships ---- */
const css = await readFile(new URL("./homework-publisher.css", import.meta.url), "utf8");
function rules(source) {
  const out = [];
  const flat = source.replace(/\/\*[\s\S]*?\*\//g, "");
  const pattern = /([^{}@][^{}]*)\{([^{}]*)\}/g;
  for (let match = pattern.exec(flat); match; match = pattern.exec(flat))
    out.push({ selector: match[1].trim(), body: match[2] });
  return out;
}
const ROOT_PX = 17;
const toPx = (value) => {
  const m = String(value).trim().match(/^([\d.]+)(rem|em|px)$/);
  if (!m) return null;
  return m[2] === "px" ? Number(m[1]) : Number(m[1]) * ROOT_PX;
};
const declared = (body, property) => [...body.matchAll(new RegExp(`(?:^|;|\\s)${property}\\s*:\\s*([^;]+)`, "g"))].map((m) => m[1]);

test("phone type: no text on the hub stylesheet is under 14px, body copy is 16px+", () => {
  const sizes = [];
  for (const { selector, body } of rules(css))
    for (const value of declared(body, "font-size")) {
      const px = toPx(value);
      if (px !== null) sizes.push({ selector, px });
    }
  assert.ok(sizes.length > 40, "the audit actually read the stylesheet");
  const small = sizes.filter(({ px }) => px < 14);
  assert.deepEqual(small, [], "every declared size is at least 14px");
  assert.ok(Number.parseFloat(css.match(/:root\s*\{[^}]*font-size:\s*(\d+)px/)[1]) >= 16, "root text is 16px or more");
  for (const selector of [".empty-state", ".welcome-text", ".week-dates"]) {
    const found = rules(css).filter((rule) => rule.selector === selector).flatMap((rule) => declared(rule.body, "font-size")).map(toPx);
    assert.ok(found.every((px) => px >= 16), `${selector} is body copy (16px+): ${found}`);
  }
});

test("phone targets: every control on the hub is at least 44px tall, with visible focus and calm motion", () => {
  const all = rules(css);
  const minHeight = (selector) =>
    all.filter((rule) => rule.selector.split(",").map((part) => part.trim()).includes(selector))
      .flatMap((rule) => declared(rule.body, "min-height")).map(toPx).filter((px) => px !== null);
  for (const selector of [
    "button",
    ".button",
    ".lang-switch button",
    ".route-primary",
    ".route-secondary",
    ".tonight-tile",
    ".toolbar select",
    ".teacher-login",
    "input",
  ])
    assert.ok(Math.max(0, ...minHeight(selector)) >= 44, `${selector} min-height >= 44px`);
  assert.match(css, /:focus-visible\s*\{[^}]*outline:\s*3px/);
  assert.match(css, /prefers-reduced-motion:\s*reduce\)[^{]*\{[^}]*animation:\s*none[^}]*transition:\s*none|prefers-reduced-motion:\s*reduce\)[^{]*\{[^}]*transition:\s*none[^}]*animation:\s*none/);
  // No horizontal scroll: long words wrap (the 390px browser pass measures the rest).
  assert.match(css, /h1, h2, h3, h4, p \{ overflow-wrap: anywhere; \}/);
});

test("the Learning supports launcher cannot sit on top of the page: the body reserves its height", async () => {
  const launcher = await readFile(new URL("../../assets/learning-supports/ls-supports.css", import.meta.url), "utf8");
  const rule = rules(launcher).find((entry) => entry.selector === ".ls-launcher");
  const bottom = toPx(declared(rule.body, "bottom")[0]);
  const height = toPx(declared(rule.body, "min-height")[0]);
  assert.match(rule.body, /position:\s*fixed/);
  const reserve = rules(css).filter((entry) => entry.selector === "body").flatMap((entry) => declared(entry.body, "padding-bottom"));
  const screen = reserve.find((value) => value.includes("calc"));
  assert.ok(screen, "body reserves bottom space on screen");
  const px = Number(screen.match(/calc\((\d+)px/)[1]);
  assert.ok(px >= bottom + height, `reserve ${px}px covers the launcher (${bottom}px gap + ${height}px tall)`);
  assert.match(screen, /safe-area-inset-bottom/);
  assert.ok(reserve.includes("0"), "print drops the reserve");
});

test("weekly hub synchronizes V3.0 Companion status with localStorage and shows completion badge without extra links", () => {
  withHub((root) => {
    const snapshot = week([["Monday", "3-2"]]);
    const store = root.ownerDocument.defaultView.localStorage;
    store.setItem("hw_exp_3-2_goal_met", "1");
    renderHomeworkHub(root, snapshot, lessonList, "all-families", "en", NOW);
    const card = root.querySelector(".homework-card");
    assert.ok(card.classList.contains("is-completed"));
    assert.match(card.querySelector(".companion-status").textContent, /Completed on this device/);
    assert.match(card.querySelector(".companion-features").textContent, /60-Sec Dinner Talk/);
    assert.equal(card.querySelectorAll("a").length, 2, "only the two route links are anchors");
  });
});
