/**
 * /curriculum/units/ pacing: the "Now" unit, every unit's dates, the teaching
 * order, the Today / Next strip and the student view of teacher-only links.
 *
 * Regression pin (2026-10-08 audit): `assets/pacing-unit-dates.generated.js`
 * is keyed by DISTRICT SEQUENCE (1 = Pre-Unit, 2 = Unit 3, 3 = Unit 4, …) and
 * the units page looked it up by curriculum unit number, so on 2026-10-08 it
 * marked Unit 2 (Statistics) "Now · Taught Sep 9 – Oct 8" and gave every unit
 * from 2 to 10 another unit's dates. Each unit must resolve through its
 * `curriculum_unit`, against data/pacing-unit-ranges.json (the SoT).
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import { JSDOM } from "jsdom";
import { isTeacherSurface } from "../functions/_lib/teacher-surface.js";

const read = (rel) => readFileSync(new URL(`../${rel}`, import.meta.url), "utf8");
const RANGES = JSON.parse(read("data/pacing-unit-ranges.json"));
const GENERATED = read("assets/pacing-unit-dates.generated.js");
const PACING = read("assets/curriculum-units-pacing.js");
const NAV = read("assets/curriculum-units-navigation.js");
const HTML = read("curriculum/units/index.html");

function loadPacing() {
  const sandbox = { window: {}, document: {} };
  vm.runInNewContext(GENERATED, sandbox);
  vm.runInNewContext(PACING, sandbox);
  const { __NT_PACING_DATES: dates, __NT_PACING_DAYS: days, NTUnitsPacing: api } = sandbox.window;
  return { dates, days, api, ranges: api.unitRanges(dates) };
}

test("every curriculum unit resolves to its own pacing-unit-ranges entry", () => {
  const { ranges } = loadPacing();
  const paced = RANGES.units.filter((unit) => unit.curriculumUnit != null);
  assert.equal(ranges.size, paced.length);
  for (const unit of paced) {
    const got = ranges.get(unit.curriculumUnit);
    assert.ok(got, `Unit ${unit.curriculumUnit} has no range`);
    assert.equal(got.start, unit.startDate, `Unit ${unit.curriculumUnit} start`);
    assert.equal(got.end, unit.endDate, `Unit ${unit.curriculumUnit} end`);
    assert.equal(got.days, unit.instructionalDays, `Unit ${unit.curriculumUnit} days`);
  }
});

test("a generated map without curriculum_unit yields no dates, not the wrong ones", () => {
  const { api } = loadPacing();
  const stale = { 2: { start_date: "9/9/26", end_date: "10/8/26", instructional_days: 21 } };
  assert.equal(api.unitRanges(stale).size, 0);
});

test("on 2026-10-08 Unit 3 is Now and Unit 4 is next, starting 2026-10-09", () => {
  const { api, ranges, days } = loadPacing();
  const current = api.currentUnit(ranges, days, "2026-10-08");
  assert.equal(current, 3);
  assert.equal(api.unitStatus(ranges.get(4), current, ranges), "next");
  assert.equal(ranges.get(4).start, "2026-10-09");
  assert.equal(api.unitStatus(ranges.get(1), current, ranges), "past");
  assert.equal(api.unitStatus(ranges.get(2), current, ranges), "later");
  // A weekend between units belongs to the unit of the next school day.
  assert.equal(api.currentUnit(ranges, days, "2026-10-10"), 4);
});

test("units are offered in district teaching order", () => {
  const { api, ranges } = loadPacing();
  const all = Array.from({ length: 10 }, (_, index) => index + 1);
  assert.deepEqual([...api.teachingOrder(all, ranges)], [1, 3, 4, 6, 7, 8, 9, 5, 2, 10]);
});

test("Today / Next reads the plan and rolls weekends forward", () => {
  const { api, days } = loadPacing();
  const plan = api.todayAndNext(days, "2026-10-08");
  assert.equal(plan.isToday, true);
  assert.equal(plan.today.dayType, "Project");
  assert.equal(plan.next.date, "2026-10-09");
  assert.equal(plan.next.lessonId, "4-1");
  const weekend = api.todayAndNext(days, "2026-10-10");
  assert.equal(weekend.isToday, false);
  assert.equal(weekend.today.date, "2026-10-12");
  assert.deepEqual([...api.dayLabels("2026-10-09")], ["Fri Oct 9", "vie 9 oct"]);
});

/* ── The page itself, in jsdom, on 2026-10-08 ─────────────────────────────── */

function bootPage(url) {
  const dom = new JSDOM(HTML, { url, runScripts: "outside-only" });
  const { window } = dom;
  const { document } = window;
  window.HTMLElement.prototype.scrollIntoView = () => {};
  window.eval(`(() => {
    const fixed = new Date(2026, 9, 8, 10, 0, 0).getTime();
    const RealDate = Date;
    class FixedDate extends RealDate {
      constructor(...args) { if (args.length) super(...args); else super(fixed); }
      static now() { return fixed; }
    }
    window.Date = FixedDate;
  })()`);
  const units = [...document.querySelectorAll("details.unit")].map((unit, index) => ({
    unitIndex: index + 1,
    num: `Unit ${index + 1}`,
    name: unit.querySelector(".unit-name").textContent.trim(),
    lessons: [...unit.querySelectorAll("details.lesson")]
      .map((lesson) => ({
        lessonId: /^\d+-\d+(?:-group[12])?(?=\s)/.exec(lesson.dataset.search)?.[0],
        title: lesson.querySelector(".lesson-head").textContent.replace(/\s+/g, " ").trim(),
        links: [...lesson.querySelectorAll(".lesson-body .res")].map((a) => [
          a.getAttribute("href"),
          a.textContent.trim(),
        ]),
      }))
      .filter((lesson) => lesson.lessonId),
  }));
  const hub = document.getElementById("interactive-hub");
  const api = {
    unitsData: units,
    hubEl: hub,
    searchBox: document.getElementById("curr-search"),
    renderHub() {
      hub.replaceChildren();
      const grid = document.createElement("div");
      grid.className = "units-grid";
      for (const unit of units) {
        const card = document.createElement("div");
        card.className = "unit-card";
        const meta = document.createElement("div");
        meta.className = "unit-card-meta";
        const select = document.createElement("select");
        select.className = "lesson-select";
        for (const [index, lesson] of unit.lessons.entries())
          select.add(new window.Option(lesson.title, String(index)));
        const info = document.createElement("div");
        info.className = "lesson-info";
        const list = document.createElement("ul");
        list.className = "lesson-outline-list";
        for (const [href, text] of unit.lessons[0].links) {
          const item = document.createElement("li");
          item.className = "lesson-outline-item";
          const link = document.createElement("a");
          link.href = href;
          link.textContent = text;
          item.appendChild(link);
          list.appendChild(item);
        }
        info.appendChild(list);
        const selector = document.createElement("div");
        selector.className = "selector-group--lesson";
        selector.appendChild(select);
        card.append(meta, selector, info);
        grid.appendChild(card);
      }
      hub.appendChild(grid);
    },
    renderSearchResults() {},
  };
  window.CurriculumHub = api;
  api.renderHub();
  window.eval(GENERATED);
  window.eval(PACING);
  window.eval(NAV);
  document.dispatchEvent(new window.Event("DOMContentLoaded"));
  return { window, document, hub };
}

test("the units page marks Unit 3 Now and prints each unit's own range", () => {
  const { document, hub } = bootPage("https://eduwonderlab.com/curriculum/units/");
  const { ranges } = loadPacing();
  const cards = [...hub.querySelectorAll(".unit-card")];
  assert.equal(cards.length, 10);
  const nowCards = cards.filter((card) => card.classList.contains("is-current-unit"));
  assert.deepEqual(
    nowCards.map((card) => card.id),
    ["unit-3"],
    "exactly Unit 3 is being taught on 2026-10-08",
  );
  assert.match(document.querySelector("#unit-3 .unit-card-dates").textContent, /^Now · Ahora /);
  assert.match(
    document.querySelector("#unit-4 .unit-card-dates").textContent,
    /^Next · Sigue Taught Oct 9 – /,
  );
  for (const card of cards) {
    const number = Number(card.id.replace("unit-", ""));
    const line = card.querySelector(".unit-card-dates");
    const range = ranges.get(number);
    assert.ok(line, `${card.id} prints its dates`);
    assert.equal(line.dataset.start, range.start, `${card.id} start`);
    assert.equal(line.dataset.end, range.end, `${card.id} end`);
  }
  // A bare URL opens today's unit on its latest taught lesson.
  assert.deepEqual(
    [...hub.querySelectorAll(".unit-card:not([hidden])")].map((card) => card.id),
    ["unit-3"],
  );
  const lessonSelect = hub.querySelector(".unit-card:not([hidden]) .lesson-select");
  assert.match(
    lessonSelect.selectedOptions[0].textContent,
    /3-10/,
    "after a catch-up day the unit opens on its latest core lesson",
  );
  const picker = document.getElementById("units-browser-select");
  assert.deepEqual(
    [...picker.options].map((option) => option.value),
    ["1", "3", "4", "6", "7", "8", "9", "5", "2", "10"],
  );
  const pills = [...document.querySelectorAll(".units-overview .unit-jump-pill")];
  assert.deepEqual(
    pills.map((pill) => pill.getAttribute("href")),
    [
      "#unit-1",
      "#unit-3",
      "#unit-4",
      "#unit-6",
      "#unit-7",
      "#unit-8",
      "#unit-9",
      "#unit-5",
      "#unit-2",
      "#unit-10",
    ],
  );
  assert.ok(pills[0].classList.contains("is-past"));
});

test("the Today / Next strip names today's project and links tomorrow's lesson", () => {
  const { document } = bootPage("https://eduwonderlab.com/curriculum/units/");
  const strip = document.getElementById("units-today");
  assert.equal(strip.hidden, false);
  const items = [...strip.querySelectorAll(".units-today__item")];
  assert.equal(items.length, 2);
  assert.match(items[0].textContent, /Today · Thu Oct 8/);
  assert.match(items[0].textContent, /Unit 3 project \(day 2\)/);
  assert.match(items[0].textContent, /Proyecto de la Unidad 3 \(día 2\)/);
  assert.match(items[1].textContent, /Next · Fri Oct 9/);
  assert.match(items[1].textContent, /Understand Percent/);
  const link = items[1].querySelector("a");
  assert.equal(new URL(link.href).pathname, "/lessons/4-1/");
  for (const es of strip.querySelectorAll(".units-today__es")) assert.equal(es.lang, "es");
});

test("an explicit #unit-N anchor still wins over today's unit", () => {
  const { hub } = bootPage("https://eduwonderlab.com/curriculum/units/#unit-2");
  assert.deepEqual(
    [...hub.querySelectorAll(".unit-card:not([hidden])")].map((card) => card.id),
    ["unit-2"],
  );
});

test("teacher-gated links are teacher-only in the student view", () => {
  const { hub, document } = bootPage("https://eduwonderlab.com/curriculum/units/");
  const links = [...hub.querySelectorAll(".lesson-outline-item > a")];
  const forms = links.filter((link) => /post-forms/.test(link.getAttribute("href")));
  assert.ok(forms.length >= 10, "the fixture renders Google Forms rows");
  for (const link of links) {
    const href = link.getAttribute("href");
    assert.equal(
      link.closest(".lesson-outline-item").classList.contains("hub-teacher-only"),
      isTeacherSurface(href),
      `${href} teacher-only marking must match isTeacherSurface`,
    );
  }
  // The static no-script source carries the same marking.
  for (const link of document.querySelectorAll("details.unit a.res[href]")) {
    if (!isTeacherSurface(link.getAttribute("href"))) continue;
    assert.ok(
      link.classList.contains("hub-teacher-only"),
      `${link.getAttribute("href")} is shown to students in the static list`,
    );
  }
});
