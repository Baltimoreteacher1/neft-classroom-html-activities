#!/usr/bin/env node
/** Behavior checks for the lesson desk using real public curriculum manifests. */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { JSDOM } from "jsdom";

const source = readFileSync(new URL("../assets/curriculum-navigator.js", import.meta.url), "utf8");
const catalog = JSON.parse(
  readFileSync(new URL("../data/curriculum-manifest.json", import.meta.url), "utf8"),
);
const launch = JSON.parse(
  readFileSync(new URL("../data/curriculum-launch-manifest.json", import.meta.url), "utf8"),
);
const SAVED = "ewl:curriculum:saved:v1";
const RECENT = "ewl:curriculum:recent:v1";
const markup = `<main><section id="curriculum-navigator"><div id="nav-recent"></div><div class="cn-layout"><div class="cn-browser"><label for="curr-search">Find a lesson</label><input id="curr-search" type="search"><button id="curr-search-clear" hidden>Clear search</button><label for="nav-unit">Unit</label><select id="nav-unit"></select><button id="nav-saved" type="button" aria-pressed="false">Saved</button><button id="nav-reset" type="button">Reset</button><p id="nav-results-status" role="status"></p><ol id="nav-results"></ol><button id="nav-more" type="button" hidden>More</button></div><section id="nav-preview" tabindex="-1" aria-labelledby="nav-lesson-title"><h3 id="nav-lesson-title">Choose a lesson</h3></section></div><p id="nav-message" role="status"></p><button id="nav-retry" type="button" hidden>Retry</button></section></main>`;
const tick = () => new Promise((resolve) => setTimeout(resolve, 0));
const tests = [];
const test = (name, action) => tests.push({ name, action });

async function setup(options = {}) {
  const dom = new JSDOM(markup, {
    url: "https://eduwonderlab.com/curriculum/" + (options.query || ""),
    runScripts: "outside-only",
  });
  const { window } = dom;
  window.HTMLElement.prototype.scrollIntoView = function () {};
  if (options.guide) {
    const guide = window.document.createElement("button");
    guide.dataset.guideTeacherView = "today";
    guide.addEventListener("click", options.guide);
    window.document.body.appendChild(guide);
  }
  if (options.teacher) window.document.body.classList.add("teacher-mode");
  const data = options.catalog || structuredClone(catalog);
  const launches = options.launch || structuredClone(launch);
  const calls = [];
  const payload = (url) => (url.includes("launch-manifest") ? launches : data);
  window.fetch =
    options.fetch ||
    (async (url) => {
      calls.push(["fetch", url]);
      return { ok: true, status: 200, json: async () => structuredClone(payload(url)) };
    });
  if (options.cache !== false)
    window.NTJsonCache = {
      json:
        options.cache ||
        (async (url) => {
          calls.push(["cache", url]);
          return structuredClone(payload(url));
        }),
    };
  if (options.saved) window.localStorage.setItem(SAVED, JSON.stringify(options.saved));
  if (options.recent) window.localStorage.setItem(RECENT, JSON.stringify(options.recent));
  if (options.storage) Object.defineProperty(window, "localStorage", { value: options.storage });
  if (options.clipboard)
    Object.defineProperty(window.navigator, "clipboard", { value: options.clipboard });
  if (options.cockpit) window.CurriculumCockpit = options.cockpit;
  window.eval(source);
  await tick();
  const $ = (id) => window.document.getElementById(id);
  const find = (value) => {
    $("curr-search").value = value;
    $("curr-search").dispatchEvent(new window.Event("input", { bubbles: true }));
  };
  const pick = (id) => {
    find(id);
    const el = window.document.querySelector(`[data-lesson-id="${id}"]`);
    assert.ok(el, `lesson ${id} in results`);
    el.click();
  };
  return { dom, window, $, find, pick, calls, close: () => dom.window.close() };
}

async function using(options, action) {
  const app = await setup(options);
  try {
    await action(app);
  } finally {
    app.close();
  }
}

test("Lesson 3.4 has its own Section 1 ratio-table lab without replacing the student lesson", () =>
  using({}, ({ $, pick }) => {
    pick("3-4");
    const lab = $("nav-preview").querySelector(
      'a[href="/curriculum/learning-labs/ratio-table-lab/?student=1"]',
    );
    assert.ok(lab);
    assert.equal(lab.textContent, "Ratio Table Lab · Section 1");
    assert.ok($("nav-preview").querySelector('a[href$="/curriculum/student-launch/?lesson=3-4"]'));
    pick("3-3");
    assert.equal($("nav-preview").querySelector('a[href*="/ratio-table-lab/"]'), null);
  }));

test("all 84 real lessons load through the shared JSON cache and paginate", () =>
  using({}, ({ $, calls, window }) => {
    assert.equal(catalog.lessons.length, 84);
    assert.match($("nav-results-status").textContent, /^84 lessons found · Showing 8 of 84$/);
    assert.equal($("nav-results").children.length, 8);
    assert.equal($("nav-unit").options.length, 11);
    assert.deepEqual(
      calls.map((call) => call[0]),
      ["cache", "cache"],
    );
    $("nav-more").click();
    assert.equal($("nav-results").children.length, 16);
    assert.equal(window.document.activeElement, $("nav-results").children[8].firstChild);
    assert.match($("nav-results-status").textContent, /Showing 16 of 84/);
  }));

test("search finds lesson numbers, titles, standards, topics, objectives, and vocabulary", () =>
  using({}, ({ $, find }) => {
    for (const value of ["3.2", "3-2", "unit rates", "6.AT.2", "travel time", "better buy"]) {
      find(value);
      assert.ok($("nav-results").querySelector('[data-lesson-id="3-2"]'), value);
    }
    find("RaTiO");
    assert.ok($("nav-results").querySelector("[data-lesson-id]"));
    find("community");
    assert.ok($("nav-results").querySelector('[data-lesson-id="1-1"]'));
  }));

test("unit and saved filters combine; no-results reset restores the catalog", () =>
  using({ saved: ["3-2", "4-1", "garbage"] }, ({ $, window, find }) => {
    $("nav-saved").click();
    assert.equal($("nav-results").children.length, 2);
    assert.match($("nav-saved").textContent, /\(2\)/);
    $("nav-unit").value = "3";
    $("nav-unit").dispatchEvent(new window.Event("change"));
    assert.equal($("nav-results").children.length, 1);
    find("unfindable-xyz");
    assert.match($("nav-results-status").textContent, /No saved lessons match/);
    $("nav-results").querySelector("button").click();
    assert.equal($("curr-search").value, "");
    assert.equal($("nav-unit").value, "");
    assert.equal($("nav-saved").getAttribute("aria-pressed"), "false");
    assert.match($("nav-results-status").textContent, /^84 lessons/);
  }));

test("selection shows target and real resources, including supported lesson variants", () =>
  using({}, ({ $, pick, window }) => {
    pick("3-2");
    assert.equal(
      $("nav-lesson-title").textContent,
      catalog.lessons.find((lesson) => lesson.id === "3-2").title,
    );
    assert.match($("nav-preview").textContent, /Learning target/);
    assert.match($("nav-preview").textContent, /Continue with Part 2/);
    assert.match($("nav-preview").textContent, /Small-group learning/);
    assert.ok($("nav-preview").querySelector('a[href="/lessons/3-2-part2/?student=1"]'));
    assert.ok($("nav-preview").querySelector('a[href="/lessons/3-2-group1/?student=1"]'));
    assert.ok(
      $("nav-preview").querySelector('a[href="/lessons/3-2-group2/worksheet-2.html?student=1"]'),
    );
    assert.ok($("nav-preview").querySelector(".hub-teacher-only a"));
    assert.match($("nav-preview").textContent, /does not record student learning or mastery/);
    assert.equal(window.document.activeElement, $("nav-preview"));
    assert.equal(new URL(window.location.href).searchParams.get("lesson"), "3-2");
    pick("1-3");
    assert.match($("nav-preview").textContent, /Catch up & reconnect/);
    pick("1-1");
    assert.doesNotMatch($("nav-preview").textContent, /Continue with Part 2/);
    assert.equal($("nav-preview").querySelector('a[href*="mstar-worksheet"]'), null);
  }));

test("unavailable and inapplicable catalog resources never become links", async () => {
  const altered = structuredClone(catalog);
  const lesson = altered.lessons.find((entry) => entry.id === "3-2");
  lesson.resources.worksheet.exists = false;
  lesson.resources.guidedNotes.applicable = false;
  lesson.resources.slides.exists = false;
  await using({ catalog: altered }, ({ $, pick }) => {
    pick("3-2");
    assert.equal(
      $("nav-preview").querySelector('a[href="/lessons/3-2/worksheet.html?student=1"]'),
      null,
    );
    assert.equal(
      $("nav-preview").querySelector('a[href="/lessons/3-2/notes.html?student=1"]'),
      null,
    );
    assert.equal($("nav-preview").querySelector('a[href="/lessons/3-2/slides.html"]'), null);
  });
});

test("unsafe resource URLs and text cannot execute or leave the site", async () => {
  const alteredCatalog = structuredClone(catalog);
  const alteredLaunch = structuredClone(launch);
  alteredCatalog.lessons[0].title = '<img src=x onerror="alert(1)">';
  alteredCatalog.lessons[0].resources.teacherNotes.path = "javascript:alert(1)";
  const resources = alteredLaunch.lessons[0].resources;
  resources.guidedNotes = "//attacker.example/lessons/x";
  resources.handout = "javascript:alert(1)";
  resources.worksheet = "/\\attacker.example/lessons/x";
  resources.homework = "/lessons/../../../api/private";
  resources.familyPage = "https://attacker.example/lessons/x";
  await using({ catalog: alteredCatalog, launch: alteredLaunch }, ({ $, pick }) => {
    pick("1-1");
    assert.equal($("nav-preview").querySelector("img"), null);
    const links = Array.from($("nav-preview").querySelectorAll("a"));
    assert.ok(links.length);
    assert.ok(links.every((link) => link.origin === "https://eduwonderlab.com"));
    assert.ok(links.every((link) => !link.pathname.startsWith("/api/")));
    assert.ok(links.every((link) => link.protocol === "https:"));
    assert.equal($("nav-preview").querySelector('a[href*="teacher-notes"]'), null);
  });
});

test("URL restoration and browser back keep filters and selected preview synchronized", () =>
  using({ query: "?q=rate&u=3&lesson=3.2" }, async ({ $, pick, window }) => {
    assert.equal($("curr-search").value, "rate");
    assert.equal($("nav-unit").value, "3");
    assert.equal($("nav-lesson-title").textContent, "Understand Rates and Unit Rates");
    pick("3-3");
    assert.equal(new URL(window.location.href).searchParams.get("lesson"), "3-3");
    window.history.back();
    await new Promise((resolve) => setTimeout(resolve, 30));
    assert.equal($("nav-lesson-title").textContent, "Understand Rates and Unit Rates");
    assert.equal($("curr-search").value, "rate");
    assert.equal($("nav-unit").value, "3");
  }));

test("unknown URL values recover with an honest selection message", () =>
  using({ query: "?lesson=99-99&u=99" }, ({ $ }) => {
    assert.equal($("nav-unit").value, "");
    assert.equal($("nav-lesson-title").textContent, "Choose your next lesson");
    assert.match($("nav-message").textContent, /not in this catalog/);
  }));

test("saving persists IDs only and retains keyboard focus", () =>
  using({}, ({ $, pick, window }) => {
    pick("3-2");
    const save = $("nav-preview").querySelector("[data-save-lesson]");
    save.focus();
    save.click();
    assert.deepEqual(JSON.parse(window.localStorage.getItem(SAVED)), ["3-2"]);
    assert.equal(window.document.activeElement, save);
    assert.equal(save.getAttribute("aria-pressed"), "true");
    assert.match($("nav-action-message").textContent, /saved on this device/);
    save.click();
    assert.deepEqual(JSON.parse(window.localStorage.getItem(SAVED)), []);
    assert.equal(save.getAttribute("aria-pressed"), "false");
    assert.deepEqual(JSON.parse(window.localStorage.getItem(RECENT)), ["3-2"]);
  }));

test("unavailable storage never reports a successful save", () =>
  using(
    {
      storage: {
        getItem() {
          throw new Error("disabled");
        },
        setItem() {
          throw new Error("disabled");
        },
      },
    },
    ({ $, pick }) => {
      assert.match($("nav-message").textContent, /storage is unavailable/);
      pick("3-2");
      const save = $("nav-preview").querySelector("[data-save-lesson]");
      save.click();
      assert.equal(save.getAttribute("aria-pressed"), "false");
      assert.match($("nav-action-message").textContent, /could not save your lesson/);
      assert.match($("nav-saved").textContent, /\(0\)/);
    },
  ));

test("corrupt and unrelated local data never become recent lesson entries", () =>
  using({ saved: ["private-name", "3-2", "3-2"], recent: ["unrecognized", "1-1"] }, ({ $ }) => {
    assert.equal($("nav-recent").querySelectorAll("button").length, 1);
    assert.match($("nav-recent").textContent, /1.1/);
    assert.doesNotMatch($("nav-recent").textContent, /unrecognized|private-name/);
    assert.match($("nav-saved").textContent, /\(1\)/);
  }));

test("malformed stored strings and optional text arrays do not break browsing", async () => {
  const altered = structuredClone(catalog);
  const alteredLaunch = structuredClone(launch);
  altered.lessons[0].supports.vocabulary = "not-an-array";
  alteredLaunch.lessons[0].vocabulary = "not-an-array";
  alteredLaunch.lessons[0].sentenceFrames = { invalid: true };
  await using(
    {
      catalog: altered,
      launch: alteredLaunch,
      storage: {
        getItem() {
          return "{broken-json";
        },
        setItem() {},
      },
    },
    ({ $, pick }) => {
      assert.match($("nav-results-status").textContent, /^84 lessons/);
      pick("1-1");
      assert.equal($("nav-lesson-title").textContent, "Math is Mine");
      assert.equal($("nav-preview").querySelector(".cn-vocabulary"), null);
      assert.equal($("nav-retry").hidden, true);
    },
  );
});

test("copy uses only the student launch URL and reports actual clipboard success", async () => {
  let copied;
  await using(
    {
      clipboard: {
        async writeText(value) {
          copied = value;
        },
      },
    },
    async ({ $, pick }) => {
      pick("3-2");
      Array.from($("nav-preview").querySelectorAll("button"))
        .find((button) => button.textContent === "Copy student link")
        .click();
      await tick();
      assert.equal(copied, "https://eduwonderlab.com/curriculum/student-launch/?lesson=3-2");
      assert.match($("nav-action-message").textContent, /Student link copied/);
      assert.equal($("nav-copy-url").parentElement.hidden, true);
    },
  );
});

test("denied clipboard exposes a visible selectable URL instead of claiming success", () =>
  using(
    {
      clipboard: {
        async writeText() {
          throw new Error("denied");
        },
      },
    },
    async ({ $, pick, window }) => {
      pick("3-2");
      Array.from($("nav-preview").querySelectorAll("button"))
        .find((button) => button.textContent === "Copy student link")
        .click();
      await tick();
      assert.equal($("nav-copy-url").parentElement.hidden, false);
      assert.equal($("nav-copy-url").readOnly, true);
      assert.equal(window.document.activeElement, $("nav-copy-url"));
      assert.match($("nav-action-message").textContent, /Select and copy/);
      assert.doesNotMatch($("nav-action-message").textContent, /link copied/);
    },
  ));

test("failed cache load has an explicit retry that bypasses a cached HTTP failure", () =>
  using(
    {
      cache: async () => {
        throw new Error("HTTP 503");
      },
    },
    async ({ $, calls }) => {
      assert.equal($("nav-retry").hidden, false);
      assert.match($("nav-results-status").textContent, /could not load/);
      assert.equal($("curriculum-navigator").getAttribute("aria-busy"), "false");
      $("nav-retry").click();
      await tick();
      assert.equal($("nav-retry").hidden, true);
      assert.match($("nav-results-status").textContent, /^84 lessons/);
      assert.equal(calls.filter(([type]) => type === "fetch").length, 2);
    },
  ));

test("fallback fetch rejects HTTP errors and malformed catalogs", async () => {
  await using(
    { cache: false, fetch: async () => ({ ok: false, status: 503, json: async () => catalog }) },
    ({ $ }) => {
      assert.equal($("nav-retry").hidden, false);
      assert.equal($("nav-results").children.length, 0);
    },
  );
  await using({ catalog: { lessons: [] } }, ({ $ }) => {
    assert.equal($("nav-retry").hidden, false);
    assert.match($("nav-results-status").textContent, /could not load/);
  });
});

test("cockpit selection synchronizes in both directions without echo or forced scroll", async () => {
  const selections = [];
  let listener;
  const cockpit = {
    onSelect(callback) {
      listener = callback;
    },
    select(id, options) {
      selections.push([id, options]);
      listener?.(id);
    },
  };
  await using({ cockpit }, ({ $, pick }) => {
    pick("3-2");
    assert.equal(selections.length, 1);
    assert.equal(selections[0][1].scroll, false);
    listener("1-1");
    assert.equal($("nav-lesson-title").textContent, "Math is Mine");
    assert.equal(selections.length, 1);
  });
});

test("an earlier cockpit receives URL selection after delayed catalog loading", async () => {
  const selections = [];
  const pending = new Map();
  let subscriptions = 0;
  const cockpit = {
    onSelect() {
      subscriptions++;
    },
    select(id, options) {
      selections.push([id, options]);
    },
  };
  await using(
    {
      query: "?lesson=3-2",
      cockpit,
      cache: (url) => new Promise((resolve) => pending.set(url, resolve)),
    },
    async ({ $, window }) => {
      // An unrelated asynchronous panel mounts while both catalog requests are pending.
      window.document.body.appendChild(window.document.createElement("aside"));
      await tick();
      for (const [url, resolve] of pending)
        resolve(structuredClone(url.includes("launch-manifest") ? launch : catalog));
      await tick();
      assert.equal($("nav-lesson-title").textContent, "Understand Rates and Unit Rates");
      assert.equal(subscriptions, 1);
      assert.equal(selections.length, 1);
      assert.equal(selections[0][0], "3-2");
      assert.equal(selections[0][1].scroll, false);
    },
  );
});

test("a later cockpit API receives a URL-selected lesson when it becomes available", () =>
  using({ query: "?lesson=3-2" }, async ({ window }) => {
    const selections = [];
    window.CurriculumCockpit = {
      onSelect() {},
      select(id, options) {
        selections.push([id, options]);
      },
    };
    window.document.body.appendChild(window.document.createElement("aside"));
    await tick();
    assert.equal(selections.length, 1);
    assert.equal(selections[0][0], "3-2");
    assert.equal(selections[0][1].scroll, false);
  }));

test("Enter opens a matching lesson; IME composition never triggers selection", () =>
  using({}, ({ $, find, window }) => {
    find("3.2");
    $("curr-search").dispatchEvent(
      new window.KeyboardEvent("keydown", { key: "Enter", isComposing: true }),
    );
    assert.equal($("nav-lesson-title").textContent, "Choose your next lesson");
    $("curr-search").dispatchEvent(new window.KeyboardEvent("keydown", { key: "Enter" }));
    assert.equal($("nav-lesson-title").textContent, "Understand Rates and Unit Rates");
  }));

test("lesson prefixes, unit prefixes, and Spanish titles resolve authored matches", () =>
  using({}, ({ $, find }) => {
    for (const text of ["Lesson3.2", "lesson3-2", "Lesson 3.2", "Unit 3 Lesson 2"]) {
      find(text);
      assert.equal($("nav-results").querySelectorAll("[data-lesson-id]").length, 1, text);
      assert.ok($("nav-results").querySelector('[data-lesson-id="3-2"]'), text);
    }
    find("lesson6.1");
    assert.equal(
      $("nav-results").querySelectorAll("[data-lesson-id]").length,
      1,
      "6.1 does not also match 6.10 through 6.15",
    );
    for (const text of ["unit3", "unit 3", "unit:3", "Unidad 3"]) {
      find(text);
      const count = catalog.lessons.filter((lesson) => lesson.unit === 3).length;
      assert.match($("nav-results-status").textContent, new RegExp("^" + count + " lessons"));
      assert.ok(
        [...$("nav-results").querySelectorAll("[data-lesson-id]")].every((item) =>
          item.dataset.lessonId.startsWith("3-"),
        ),
      );
    }
    find("unit 3 rates");
    assert.ok($("nav-results").querySelector('[data-lesson-id="3-2"]'));
    for (const text of ["matematicas son mias", "MATEMÁTICAS SON MÍAS"]) {
      find(text);
      const result = $("nav-results").querySelector('[data-lesson-id="1-1"]');
      assert.ok(result, text);
      assert.equal(result.querySelector('[lang="es"]').textContent, catalog.lessons[0].titleEs);
    }
  }));

test("Back to results restores the selected result and retains pagination", () =>
  using({}, ({ $, window }) => {
    $("nav-more").click();
    const original = $("nav-results").querySelectorAll("[data-lesson-id]")[12];
    const id = original.dataset.lessonId;
    original.click();
    assert.equal(window.document.activeElement, $("nav-preview"));
    $("nav-preview").querySelector(".cn-back").click();
    assert.equal(window.document.activeElement.dataset.lessonId, id);
    assert.equal($("nav-results").querySelectorAll("[data-lesson-id]").length, 16);
    assert.match($("nav-lesson-title").textContent, /\S/);
  }));

test("Back to results focuses search if the selected saved lesson was removed", () =>
  using({ query: "?saved=1&lesson=3-2", saved: ["3-2"] }, ({ $, window }) => {
    $("nav-preview").querySelector("[data-save-lesson]").click();
    $("nav-preview").querySelector(".cn-back").click();
    assert.equal(window.document.activeElement, $("curr-search"));
  }));

test("recent selection clears conflicting filters and retains compatible saved filtering", () =>
  using(
    { query: "?q=4-1&u=4&saved=1", saved: ["3-2", "4-1"], recent: ["3-2"] },
    ({ $, window }) => {
      $("nav-recent").querySelector("button").click();
      assert.equal($("curr-search").value, "");
      assert.equal($("nav-unit").value, "");
      assert.equal($("nav-saved").getAttribute("aria-pressed"), "true");
      assert.equal($("nav-results").querySelector('[aria-current="true"]').dataset.lessonId, "3-2");
      assert.equal(new URL(window.location.href).searchParams.get("saved"), "1");
      assert.equal(new URL(window.location.href).searchParams.has("q"), false);
      assert.equal($("curr-search-clear").hidden, true);
    },
  ));

test("recent selection retains matching query and unit, and reveals later result pages", async () => {
  await using({ query: "?q=rates&u=3&saved=1", saved: ["3-2"], recent: ["3-2"] }, ({ $ }) => {
    $("nav-recent").querySelector("button").click();
    assert.equal($("curr-search").value, "rates");
    assert.equal($("nav-unit").value, "3");
    assert.equal($("nav-saved").getAttribute("aria-pressed"), "true");
  });
  await using({ query: "?saved=1", saved: ["1-1"], recent: ["10-6"] }, ({ $ }) => {
    $("nav-recent").querySelector("button").click();
    assert.equal($("nav-saved").getAttribute("aria-pressed"), "false");
    assert.equal($("nav-results").querySelector('[aria-current="true"]').dataset.lessonId, "10-6");
  });
});

test("search clear state follows reset and restored browser history", () =>
  using({ query: "?q=rate" }, ({ $, window, find }) => {
    assert.equal($("curr-search-clear").hidden, false);
    $("nav-reset").click();
    assert.equal($("curr-search-clear").hidden, true);
    find("lesson3.2");
    assert.equal($("curr-search-clear").hidden, false);
    window.history.replaceState({}, "", "/curriculum/");
    window.dispatchEvent(new window.PopStateEvent("popstate"));
    assert.equal($("curr-search").value, "");
    assert.equal($("curr-search-clear").hidden, true);
    window.history.replaceState({}, "", "/curriculum/?q=percents");
    window.dispatchEvent(new window.PopStateEvent("popstate"));
    assert.equal($("curr-search-clear").hidden, false);
  }));

test("Save feedback is an inline live status immediately after the actions", () =>
  using({}, ({ $, pick }) => {
    pick("3-2");
    $("nav-preview").querySelector("[data-save-lesson]").click();
    const feedback = $("nav-action-message");
    assert.equal(feedback.previousElementSibling.className, "cn-preview-actions");
    assert.equal(feedback.getAttribute("role"), "status");
    assert.equal(feedback.getAttribute("aria-live"), "polite");
    assert.equal(feedback.getAttribute("aria-atomic"), "true");
    assert.match(feedback.textContent, /saved on this device/);
  }));

test("readiness and learning-lab links use the existing launch manifest without another fetch", () =>
  using({}, ({ $, pick, calls }) => {
    pick("3-2");
    const resources = launch.lessons.find((lesson) => lesson.id === "3-2").resources;
    assert.ok(
      resources.readiness && resources.learningLab,
      "generator supplies source-backed resource keys",
    );
    assert.ok($("nav-preview").querySelector('a[href="' + resources.readiness + '?student=1"]'));
    assert.ok($("nav-preview").querySelector('a[href="' + resources.learningLab + '?student=1"]'));
    assert.equal(calls.length, 2, "only existing catalog and launch-manifest requests");
    const withoutReadiness = launch.lessons.find((lesson) => !lesson.resources.readiness);
    pick(withoutReadiness.id);
    assert.equal(
      [...$("nav-preview").querySelectorAll("a")].some(
        (link) => link.textContent === "Readiness check",
      ),
      false,
    );
  }));

test("learning-lab exception rejects external, encoded, traversal, and other-resource paths", async () => {
  for (const unsafe of [
    "//evil.example/curriculum/learning-labs/recipe-remix/",
    "/curriculum/learning-labs/recipe-remix/?next=/api/private",
    "/curriculum/learning-labs/%72ecipe-remix/",
    "/curriculum/learning-labs/../private/",
    "/lessons/3-2/",
  ]) {
    const modified = structuredClone(launch);
    modified.lessons.find((lesson) => lesson.id === "3-2").resources.learningLab = unsafe;
    await using({ launch: modified }, ({ $, pick }) => {
      pick("3-2");
      assert.equal(
        [...$("nav-preview").querySelectorAll("a")].some(
          (link) => link.textContent === "Interactive learning lab",
        ),
        false,
        unsafe,
      );
    });
  }
  const modified = structuredClone(launch);
  modified.lessons.find((lesson) => lesson.id === "3-2").resources.handout =
    "/curriculum/learning-labs/recipe-remix/";
  await using({ launch: modified }, ({ $, pick }) => {
    pick("3-2");
    assert.equal(
      [...$("nav-preview").querySelectorAll("a")].some((link) => link.textContent === "Handout"),
      false,
    );
  });
});

test("Teach this lesson reuses the existing workflow control with the selected lesson", async () => {
  const selections = [];
  let opened = 0;
  await using(
    {
      teacher: true,
      guide: () => {
        opened++;
      },
      cockpit: {
        onSelect() {},
        select(id) {
          selections.push(id);
          return true;
        },
      },
    },
    ({ $, pick }) => {
      pick("3-2");
      const teach = $("nav-preview").querySelector(".cn-teach");
      assert.ok(teach.classList.contains("hub-teacher-only"));
      teach.click();
      assert.equal(selections.at(-1), "3-2");
      assert.equal(opened, 1);
    },
  );
  await using(
    {
      guide: () => {
        opened++;
      },
    },
    ({ $, pick }) => {
      pick("3-2");
      $("nav-preview").querySelector(".cn-teach").click();
      assert.equal(opened, 1, "student mode does not activate teacher tools");
    },
  );
});

for (const { name, action } of tests) {
  await action();
  console.log(`✓ ${name}`);
}
console.log(`curriculum-navigator: ${tests.length} behavior checks passed`);
