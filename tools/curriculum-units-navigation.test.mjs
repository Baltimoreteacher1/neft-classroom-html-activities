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
      select.addEventListener("change", (event) => {
        // Match the shared renderer: user changes replace the current URL
        // before the navigation bridge receives the bubbling event.
        if (event.bubbles) {
          const url = new URL(window.location.href);
          url.searchParams.set("u", String(unit.unitIndex));
          url.searchParams.set("l", unit.lessons[select.selectedIndex].lessonId);
          url.searchParams.delete("a");
          window.history.replaceState(null, "", url);
        }
        activity.replaceChildren(
          new window.Option("Choose", ""),
          new window.Option(
            "Interactive lesson",
            `/lessons/${unit.lessons[select.selectedIndex].lessonId}/`,
          ),
        );
      });
      activity.addEventListener("change", (event) => {
        activityLaunches += 1;
        if (event.bubbles) {
          const url = new URL(window.location.href);
          if (activity.value) url.searchParams.set("a", activity.value);
          else url.searchParams.delete("a");
          window.history.replaceState(null, "", url);
          launch.href = activity.value;
          launch.style.display = activity.value ? "" : "none";
        }
      });
      const resources = document.createElement("div");
      resources.className = "unit-resources-row";
      const unitLink = document.createElement("a");
      unitLink.href = `/math/unit-${unit.unitIndex}/projects/`;
      unitLink.textContent = "Unit project";
      resources.appendChild(unitLink);
      card.append(resources, select, activity, launch);
      select.dispatchEvent(new window.Event("change"));
      grid.appendChild(card);
    });
    hub.appendChild(grid);
  },
  renderSearchResults(query) {
    hub.innerHTML = '<div class="search-results-panel"></div>';
    hub.firstElementChild.textContent = query;
    if (
      query === "volume" ||
      (!query && document.querySelector('[data-filter="notes"][aria-pressed="true"]'))
    ) {
      hub.firstElementChild.replaceChildren();
      const title = document.createElement("h2");
      title.textContent = query ? `Search Results for ${query}` : 'Search Results for ""';
      hub.firstElementChild.appendChild(title);
      for (let index = 0; index < 13; index++) {
        const result = document.createElement("div");
        result.className = "search-result-item";
        result.innerHTML = `<span class="search-result-unit">Unit ${(index % 10) + 1}</span><div class="search-result-header">Lesson ${index + 1}: <mark>Volume</mark></div><p class="lesson-info-obj">A complete learning target.</p><ul class="lesson-outline-list"><li class="lesson-outline-item"><a href="/lessons/3-2/notes.html?sample=${index}">Guided notes</a></li></ul>`;
        hub.firstElementChild.appendChild(result);
      }
    }
    if (query === "zzzznotalesson") {
      const clear = document.createElement("button");
      clear.className = "hub-clear-filters";
      clear.textContent = "Clear search & filters";
      clear.addEventListener("click", () => {
        api.searchBox.value = "";
        api.renderHub();
      });
      hub.firstElementChild.appendChild(clear);
    }
  },
};
const toolbar = document.createElement("div");
toolbar.id = "hub-toolbar-sticky";
api.searchBox.closest(".controls").before(toolbar);
toolbar.appendChild(api.searchBox.closest(".controls"));
const chips = document.createElement("div");
chips.className = "hub-filter-chips";
for (const [filter, label] of [
  ["all", "All"],
  ["notes", "Notes"],
]) {
  const chip = document.createElement("button");
  chip.className = "hub-filter-chip";
  chip.dataset.filter = filter;
  chip.textContent = label;
  chip.setAttribute("aria-pressed", String(filter === "all"));
  chip.addEventListener("click", () => {
    chips
      .querySelectorAll("button")
      .forEach((item) => item.setAttribute("aria-pressed", String(item === chip)));
    api.renderHub();
  });
  chips.appendChild(chip);
}
toolbar.appendChild(chips);
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
// Back to the bare entry URL must restore Unit 1 instead of retaining Unit 9.
window.history.replaceState({}, "", "/curriculum/units/");
window.dispatchEvent(new window.PopStateEvent("popstate"));
assert.equal(picker.value, "1");
assert.equal(visible()[0].id, "unit-1");
assert.match(selectedLesson(), /1-1/);

picker.value = "3";
picker.dispatchEvent(new window.Event("change"));
const changeLesson = (id) => {
  const select = visible()[0].querySelector(".lesson-select");
  select.selectedIndex = unitsData[2].lessons.findIndex((lesson) => lesson.lessonId === id);
  select.dispatchEvent(new window.Event("change", { bubbles: true }));
};
const historyLength = window.history.length;
const beforeLessonChanges = selectedLesson();
changeLesson("3-2");
changeLesson("3-3");
assert.equal(
  window.history.length,
  historyLength + 2,
  "explicit lesson changes create history entries",
);
const back = () =>
  new Promise((resolve) => {
    window.addEventListener("popstate", () => resolve(), { once: true });
    window.history.back();
  });
await back();
assert.match(selectedLesson(), /3-2/, "Back restores the preceding selected lesson");
await back();
assert.equal(
  selectedLesson(),
  beforeLessonChanges,
  "Back restores the unit's previous lesson, including variants",
);

const beforeActivity = window.location.href;
const currentActivity = visible()[0].querySelector(".activity-select");
currentActivity.selectedIndex = 1;
currentActivity.dispatchEvent(new window.Event("change", { bubbles: true }));
assert.ok(new URL(window.location.href).searchParams.get("a"));
await back();
assert.equal(
  window.location.href,
  beforeActivity,
  "Back restores the URL before an activity choice",
);
assert.equal(
  visible()[0].querySelector(".activity-select").value,
  "",
  "Back clears the later activity choice",
);
assert.equal(visible()[0].querySelector(".btn-launch").style.display, "none");
assert.equal(activityLaunches, 1, "history restoration never launches an activity");

api.searchBox.value = "zzzznotalesson";
api.searchBox.dispatchEvent(new window.Event("input"));
api.renderSearchResults("zzzznotalesson");
assert.equal(new URL(window.location.href).searchParams.get("q"), "zzzznotalesson");
hub.querySelector(".hub-clear-filters").click();
assert.equal(api.searchBox.value, "");
assert.equal(
  new URL(window.location.href).searchParams.get("q"),
  null,
  "empty-state recovery clears URL search",
);
assert.equal(document.activeElement, api.searchBox, "empty-state recovery restores search focus");
window.dispatchEvent(new window.PopStateEvent("popstate"));
assert.equal(visible()[0].id, "unit-3", "reloading the cleared URL preserves browsing");
assert.equal(api.searchBox.value, "");

assert.ok(
  toolbar.querySelector("details.units-refine"),
  "optional filters stay reachable in a native disclosure",
);
assert.equal(
  toolbar.querySelector(".units-refine").contains(api.searchBox),
  false,
  "search stays visible outside optional filters",
);
assert.equal(hub.querySelectorAll(".unit-card").length, 10);
assert.equal(
  hub.querySelectorAll(".units-resource-drawer .unit-resources-row a").length,
  10,
  "unit resources preserve every link and card order",
);
const beforeFiltering = selectedLesson();
chips.querySelector('[data-filter="notes"]').click();
assert.equal(
  hub.querySelectorAll(".search-result-item").length,
  13,
  "category filtering renders every matching lesson",
);
assert.equal(
  hub.querySelectorAll(".search-result-item:not([hidden])").length,
  8,
  "initial results stay compact",
);
assert.match(hub.querySelector("h2").textContent, /Notes across all units/);
assert.match(hub.querySelector(".units-results-status").textContent, /Showing 8 of 13/);
assert.equal(hub.querySelectorAll("details.units-result-details").length, 13);
assert.equal(
  hub.querySelectorAll("details.units-result-details a").length,
  13,
  "compacting results retains every resource link",
);
assert.equal(
  hub.querySelectorAll("h3 mark").length,
  13,
  "search highlights survive semantic heading conversion",
);
const firstDetails = hub.querySelector(".units-result-details");
assert.equal(firstDetails.open, false);
firstDetails.open = true;
assert.ok(firstDetails.querySelector(".lesson-info-obj"));
assert.equal(firstDetails.querySelector("a").textContent, "Guided notes");
hub.querySelector(".units-results-more").click();
assert.equal(hub.querySelectorAll(".search-result-item:not([hidden])").length, 13);
assert.match(hub.querySelector(".units-results-status").textContent, /Showing 13 of 13/);
assert.equal(document.activeElement, hub.querySelectorAll(".units-result-details > summary")[8]);
assert.equal(hub.querySelector(".units-results-more").hidden, true);
chips.querySelector('[data-filter="all"]').click();
assert.equal(visible().length, 1);
assert.equal(
  selectedLesson(),
  beforeFiltering,
  "leaving category results restores the exact selected lesson",
);
api.searchBox.value = "volume";
api.searchBox.dispatchEvent(new window.Event("input"));
api.renderSearchResults("volume");
assert.equal(
  hub.querySelectorAll(".search-result-item:not([hidden])").length,
  8,
  "text searches use the same compact result model",
);
assert.match(hub.querySelector("h2").textContent, /volume/);
api.searchBox.value = "";
api.searchBox.dispatchEvent(new window.Event("input"));
api.renderHub();
assert.equal(selectedLesson(), beforeFiltering, "leaving search restores selection and all cards");
assert.equal(hub.querySelectorAll(".unit-card").length, 10);

window.history.replaceState({}, "", "/curriculum/units/#unit-10");
window.dispatchEvent(new window.HashChangeEvent("hashchange"));
assert.equal(visible()[0].id, "unit-10");
assert.equal(document.querySelector('[data-unit-step="1"]').disabled, true);
window.close();
console.log(
  "curriculum-units-navigation: PASS — 84 lessons, 10 units, deep links, refresh, global search, exact variants, history, compact category/search results, resource disclosures, pagination, and silent restoration",
);
