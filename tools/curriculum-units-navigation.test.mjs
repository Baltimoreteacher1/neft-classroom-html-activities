import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { JSDOM } from "jsdom";

const html = readFileSync(new URL("../curriculum/units/index.html", import.meta.url), "utf8");
const script = readFileSync(
  new URL("../assets/curriculum-units-navigation.js", import.meta.url),
  "utf8",
);
const dom = new JSDOM(html, {
  url: "https://eduwonderlab.com/curriculum/units/?u=6&l=6-4&a=%2Flessons%2F6-4%2F",
  runScripts: "outside-only",
});
const { window } = dom;
const { document } = window;
window.HTMLElement.prototype.scrollIntoView = () => {};
const source = [...document.querySelectorAll("details.unit")];
assert.equal(source.length, 10);
assert.deepEqual(
  source.map((unit) => unit.id),
  Array.from({ length: 10 }, (_, index) => `unit-${index + 1}`),
);
const unitsData = source.map((unit, index) => ({
  unitIndex: index + 1,
  num: `Unit ${index + 1}`,
  name: unit.querySelector(".unit-name").textContent.trim(),
  lessons: [...unit.querySelectorAll("details.lesson")]
    .map((lesson) => ({
      lessonId: /^\d+-\d+(?:-(?:group1|group2|catchup|flagship|part2|part3))?/.exec(
        lesson.dataset.search,
      )?.[0],
      title: lesson.querySelector(".lesson-head").textContent.trim(),
    }))
    .filter((lesson) => lesson.lessonId),
}));
const coreCount = unitsData
  .flatMap((unit) => unit.lessons)
  .filter((lesson) => /^\d+-\d+$/.test(lesson.lessonId)).length;
assert.equal(coreCount, 84, "all authored core lessons remain available");
const hub = document.getElementById("interactive-hub");
let activityLaunches = 0;
const api = {
  unitsData,
  hubEl: hub,
  searchBox: document.getElementById("curr-search"),
  renderHub() {
    hub.replaceChildren();
    const grid = document.createElement("div");
    grid.className = "units-grid";
    unitsData.forEach((unit) => {
      const card = document.createElement("div");
      card.className = "unit-card";
      const select = document.createElement("select");
      select.className = "lesson-select";
      unit.lessons.forEach((lesson, index) =>
        select.add(new window.Option(lesson.title, String(index))),
      );
      const activity = document.createElement("select");
      activity.className = "activity-select";
      const launch = document.createElement("a");
      launch.className = "btn-launch";
      select.addEventListener("change", () => {
        activity.replaceChildren(
          new window.Option("Choose", ""),
          new window.Option(
            "Interactive lesson",
            `/lessons/${unit.lessons[select.selectedIndex].lessonId}/`,
          ),
        );
      });
      activity.addEventListener("change", () => {
        activityLaunches += 1;
      });
      card.append(select, activity, launch);
      select.dispatchEvent(new window.Event("change"));
      grid.appendChild(card);
    });
    hub.appendChild(grid);
  },
  renderSearchResults(query) {
    hub.innerHTML = '<div class="search-results-panel"></div>';
    hub.firstElementChild.textContent = query;
  },
};
window.CurriculumHub = api;
api.renderHub();
window.eval(script);
document.dispatchEvent(new window.Event("DOMContentLoaded"));
const picker = document.getElementById("units-browser-select");
const visible = () => [...hub.querySelectorAll(".unit-card:not([hidden])")];
const selectedLesson = () =>
  visible()[0].querySelector(".lesson-select").selectedOptions[0].textContent;
assert.equal(picker.options.length, 10);
assert.equal(picker.value, "6");
assert.equal(visible().length, 1);
assert.match(selectedLesson(), /6-4/);
assert.equal(visible()[0].querySelector(".btn-launch").getAttribute("href"), "/lessons/6-4/");
api.renderHub();
assert.match(selectedLesson(), /6-4/, "async refresh preserves the requested lesson");
assert.equal(activityLaunches, 0, "restoring activities never opens launch dialogs");
assert.equal(
  hub.querySelectorAll(".unit-card").length,
  10,
  "enhancement indexing retains every unit card",
);
assert.equal(
  document.querySelectorAll("details.unit").length,
  10,
  "static print source is preserved",
);
assert.equal(document.querySelectorAll('[id="unit-6"]').length, 1, "no duplicate fragment targets");

picker.value = "2";
picker.dispatchEvent(new window.Event("change"));
assert.equal(visible()[0].id, "unit-2");
assert.equal(new URL(window.location.href).searchParams.get("u"), "2");
api.searchBox.value = "ratios";
api.searchBox.dispatchEvent(new window.Event("input"));
api.renderSearchResults("ratios");
assert.equal(hub.querySelector(".search-results-panel").textContent, "ratios");
assert.match(document.getElementById("units-browser-status").textContent, /all 10 units/);
api.searchBox.value = "";
api.renderHub();
assert.equal(visible()[0].id, "unit-2", "clearing search returns to the chosen unit");

const bottom = document.getElementById("bottom-lesson-select");
assert.equal(bottom.querySelectorAll("optgroup").length, 10);
bottom.value = "3-2-group2";
bottom.dispatchEvent(new window.Event("change"));
assert.equal(visible()[0].id, "unit-3");
assert.equal(new URL(window.location.href).searchParams.get("l"), "3-2-group2");
assert.match(
  selectedLesson(),
  /Group 2/,
  "bottom picker resolves an exact variant, never a prefix match",
);

window.history.replaceState({}, "", "/curriculum/units/?u=9&l=9-2#unit-9");
window.dispatchEvent(new window.PopStateEvent("popstate"));
assert.equal(visible()[0].id, "unit-9");
assert.match(selectedLesson(), /9-2/, "back/forward restores unit and lesson");
window.history.replaceState({}, "", "/curriculum/units/#unit-10");
window.dispatchEvent(new window.HashChangeEvent("hashchange"));
assert.equal(visible()[0].id, "unit-10");
assert.equal(document.querySelector('[data-unit-step="1"]').disabled, true);
window.close();
console.log(
  "curriculum-units-navigation: PASS — 84 lessons, 10 units, deep links, refresh, global search, exact variants, history, and silent restoration",
);
