import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import { JSDOM } from "jsdom";
import { createDefaultSnapshot } from "./shared/model.js";
import {
  weekPhase,
  schoolDate,
  familyLink,
  messageDestination,
  renderHomeworkHub,
} from "./shared/homework-hub.js";
const html = await readFile(new URL("./index.html", import.meta.url), "utf8");
test("family entry has only homework and messaging; legacy meetings keep their page", async () => {
  for (const id of [
    "section-select",
    "family-homework",
    "language-toggle",
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
test("freshness uses school date, handles missing/stale/future weeks and Sunday boundary", () => {
  assert.equal(schoolDate(new Date("2026-09-28T01:00:00Z")), "2026-09-27");
  assert.equal(weekPhase("2026-09-21", new Date("2026-09-28T01:00:00Z")), "current");
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
    assert.match(root.textContent, /Abrir tarea/);
    assert.match(root.textContent, /Entrega/);
    assert.equal(
      root.querySelector(".homework-card a").getAttribute("href"),
      "/lessons/3-2/homework.html?route=quick&lang=es",
    );
    renderHomeworkHub(root, snapshot, lessons, "all-families", "en", {
      now: new Date("2026-10-01T12:00:00Z"),
    });
    assert.equal(root.querySelector(".homework-card"), null);
    assert.match(root.textContent, /not been posted/);
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
      "/lessons/3-2/homework.html?route=quick&lang=en",
      "/lessons/3-3/homework.html?route=quick&lang=en",
      "/lessons/3-2/homework.html?route=quick&lang=en",
      "", "",
    ]);
    assert.match(cards[3].textContent, /No homework posted/);
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
