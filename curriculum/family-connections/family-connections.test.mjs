import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import {
  buildOutlookUrl,
  composeMessage,
  getLessonResources,
  messageRequiresReview,
  normalizeLessons,
  sanitizePlannerItem,
} from "./templates.js";

const message = composeMessage({
  purpose: "missing-work",
  language: "plain",
  student: "Jordan",
  lessonLabel: "Lesson 3-2 · Unit Rates",
  resource: {
    label: "Family Homework",
    url: "/lessons/3-2/homework.html",
  },
  context: "The first two questions are complete.",
});

assert.match(message.subject, /Jordan/);
assert.match(message.body, /Jordan/);
assert.match(message.body, /first two questions/i);
assert.match(
  message.body,
  /https:\/\/eduwonderlab\.com\/lessons\/3-2\/homework\.html/,
);
assert.equal(message.requiresReview, true);
assert.equal(messageRequiresReview("missing-work"), true);
assert.equal(messageRequiresReview("celebration"), false);
assert.match(
  buildOutlookUrl(message),
  /^https:\/\/outlook\.office\.com\/mail\/deeplink\/compose\?/,
);
assert.deepEqual(getLessonResources({ id: "3-2", resources: {} })[0], {
  kind: "family-homework",
  label: "Family Homework",
  url: "/lessons/3-2/homework.html",
});

const normalizedLessons = normalizeLessons({
  lessons: [
    {
      id: "2-1-flagship",
      unit: 2,
      lesson: 1,
      title: "Flagship Fractions",
      flagship: true,
      resources: {},
    },
    {
      id: "2-1",
      unit: 2,
      lesson: 1,
      title: "Fractions",
      flagship: false,
      resources: {
        familyPage: { exists: true, path: "/lessons/2-1/family/" },
      },
    },
    {
      id: "1-2",
      unit: 1,
      lesson: 2,
      title: "Decimals",
      flagship: false,
      resources: {},
    },
  ],
});
assert.deepEqual(
  normalizedLessons.map((lesson) => lesson.id),
  ["1-2", "2-1"],
);
assert.equal(normalizedLessons[1].familyResources[1].url, "/lessons/2-1/family/");

assert.deepEqual(
  sanitizePlannerItem({
    id: "item-1",
    student: "J".repeat(50),
    purpose: "missing-work",
    nextDate: "not-a-date",
    note: "N".repeat(300),
    completed: 1,
    email: "private@example.com",
    recipient: "Do not keep",
  }),
  {
    id: "item-1",
    student: "J".repeat(40),
    purpose: "missing-work",
    nextDate: "",
    note: "N".repeat(240),
    completed: true,
  },
);

const outlook = new URL(buildOutlookUrl(message));
assert.equal(outlook.searchParams.get("subject"), message.subject);
assert.equal(outlook.searchParams.get("body"), message.body);
assert.equal(outlook.searchParams.has("to"), false);

const html = readFileSync(new URL("./index.html", import.meta.url), "utf8");
assert.match(html, /<!doctype html>/i);
assert.match(html, /<html lang="en">/);
assert.match(html, /name="viewport"/);
assert.match(html, /class="skip-link"/);
assert.match(html, /id="message-studio"/);
assert.match(html, /id="resource-navigator"/);
assert.match(html, /id="engagement-lab"/);
assert.match(html, /id="connection-planner"/);
assert.match(html, /aria-live="polite"/);
assert.match(html, /src="\/curriculum\/family-connections\/app\.js"/);

const app = readFileSync(new URL("./app.js", import.meta.url), "utf8");
assert.match(app, /fetch\("\/data\/curriculum-manifest\.json"/);
assert.match(app, /https:\/\/teach\.classdojo\.com\//);
assert.match(app, /function openOutlook/);
assert.match(app, /neft\.familyConnections\.planner\.v1/);

console.log("Family Connections tests passed.");
