import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { JSDOM } from "jsdom";
import { weekStartFor } from "./family-state.js";

const start = weekStartFor(new Date());
const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"].map((day, index) => ({
  date: new Date(new Date(`${start}T12:00:00`).setDate(new Date(`${start}T12:00:00`).getDate() + index)).toISOString().slice(0, 10),
  status: "lesson", lessonId: "7-4", label: "7.4", title: { en: "Static title", es: "Título estático" }, url: "/families/lessons/7-4/",
}));
const week = { start, days, nights: days.map((day) => day.date) };

async function boot() {
  const dom = new JSDOM('<main><section id="tonight-hub"></section><ul id="hub-replay-days"></ul></main>', {
    url: "https://eduwonderlab.com/curriculum/family-connections/?section=all-families&lang=es",
  });
  const keys = ["document", "window", "location", "localStorage"];
  const previous = Object.fromEntries(keys.map((key) => [key, globalThis[key]]));
  for (const key of keys) Object.defineProperty(globalThis, key, { configurable: true, value: dom.window[key] });
  const oldFetch = globalThis.fetch;
  globalThis.fetch = async (url) => ({
    ok: true,
    json: async () => String(url).includes("weeks.json") ? { weeks: [week] } : {
      weeks: [{ sectionId: "all-families", publishedAt: "2026-11-20T12:00:00Z", week: {
        startDate: start,
        days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"].map((day) => ({ day, status: "lesson", lessonId: "8-2" })),
      }}],
    },
  });
  try {
    await import(`./family-hub.js?test=${Date.now()}`);
    return dom;
  } finally {
    globalThis.fetch = oldFetch;
    for (const key of keys) {
      if (previous[key] === undefined) delete globalThis[key];
      else Object.defineProperty(globalThis, key, { configurable: true, value: previous[key] });
    }
  }
}

const dom = await boot();
try {
  const { document } = dom.window;
  assert.match(document.querySelector(".tonight-practice h2").textContent, /Static title|Título estático/);
  assert.match(document.querySelector(".tonight-actions a").href, /\/lessons\/8-2\/homework\.html\?lang=es$/);
  assert.match(document.querySelector(".tonight-actions a:nth-child(2)").href, /math-studio\/\?lesson=8-2&lang=es$/);
  assert.match(document.querySelector(".tonight-actions a[download]").href, /week-\d{4}-\d{2}-\d{2}-es\.pdf$/);
  assert.equal(document.querySelectorAll(".tonight-progress input[type=checkbox]").length, 5);
  assert.equal(document.documentElement.lang, "es");
} finally {
  dom.window.close();
}
