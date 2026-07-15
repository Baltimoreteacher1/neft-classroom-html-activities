import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import {
  buildOutlookUrl,
  composeMessage,
  getLessonResources,
  messageRequiresReview,
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

console.log("Family Connections tests passed.");
