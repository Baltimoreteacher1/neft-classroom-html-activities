/**
 * Teacher-first curriculum workflow. Additive: reads canonical curriculum data,
 * renders only in the existing PIN-gated Teacher Mode, and stores plans locally.
 */
(function () {
  "use strict";

  var STORAGE = "curriculumTeacherWorkflow:v1";
  var DATA = { launch: null, supports: null, workflow: null, uifr: null };
  var lessons = [];
  var lessonsById = {};
  var state = loadState();
  var panel = null;

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = text;
    return node;
  }

  function loadState() {
    try {
      return Object.assign(
        { selected: "1-1", section: "601", favorites: [], recent: [], view: "today" },
        JSON.parse(localStorage.getItem(STORAGE)) || {},
      );
    } catch (error) {
      return { selected: "1-1", section: "601", favorites: [], recent: [], view: "today" };
    }
  }

  function saveState() {
    try {
      localStorage.setItem(STORAGE, JSON.stringify(state));
    } catch (error) {}
  }

  function getJson(url) {
    return fetch(url, { credentials: "same-origin" }).then(function (response) {
      if (!response.ok) throw new Error("Missing curriculum workflow data");
      return response.json();
    });
  }

  function familyFor(lesson) {
    var text = `${lesson.title} ${lesson.standard}`.toLowerCase();
    if (/decimal|factor|multiple|multi-digit/.test(text)) return "decimals";
    if (/fraction/.test(text)) return "fractions";
    if (/ratio/.test(text)) return "ratios";
    if (/percent|rate|measurement/.test(text)) return "percents";
    if (/exponent|expression|variable relationship/.test(text)) return "expressions";
    if (/equation|inequalit/.test(text)) return "equations";
    if (/statistic|data|mean|median|histogram|distribution/.test(text)) return "statistics";
    if (/integer|absolute|coordinate|ordered pair|rational number/.test(text)) return "integers";
    if (/area|polygon|triangle|parallelogram|trapezoid/.test(text)) return "geometry";
    if (/volume|surface|prism|pyramid|net/.test(text)) return "volume";
    return "general";
  }

  function selectedLesson() {
    return lessonsById[state.selected] || lessons[0];
  }

  function studentUrl(lessonOrIds) {
    var base = `${location.origin}/curriculum/student-launch/`;
    if (Array.isArray(lessonOrIds)) return `${base}?playlist=${lessonOrIds.join(",")}`;
    return `${base}?lesson=${lessonOrIds.id}`;
  }

  function copyText(text, button) {
    var done = function () {
      var old = button.textContent;
      button.textContent = "✓ Copied";
      setTimeout(function () {
        button.textContent = old;
      }, 1200);
    };
    if (navigator.clipboard?.writeText) navigator.clipboard.writeText(text).then(done, done);
    else {
      var area = el("textarea");
      area.value = text;
      area.style.position = "fixed";
      area.style.left = "-9999px";
      document.body.appendChild(area);
      area.select();
      document.execCommand("copy");
      area.remove();
      done();
    }
  }

  function button(label, action, className) {
    var node = el("button", `ctw-button ${className || ""}`, label);
    node.type = "button";
    node.addEventListener("click", action);
    return node;
  }

  function link(label, href, className) {
    var node = el("a", `ctw-button ${className || ""}`, label);
    node.href = href;
    return node;
  }

  function field(labelText, control) {
    var label = el("label", "ctw-field");
    label.appendChild(el("span", null, labelText));
    label.appendChild(control);
    return label;
  }

  function kv(labelText, value) {
    var item = el("div", "ctw-readiness-item");
    item.appendChild(el("h4", null, labelText));
    item.appendChild(el("p", null, value || "Use the lesson's built-in support."));
    return item;
  }

  function updateRecent(lessonId) {
    state.recent = [lessonId]
      .concat((state.recent || []).filter(function (id) {
        return id !== lessonId && lessonsById[id];
      }))
      .slice(0, 6);
    saveState();
  }

  function renderQr(container, url) {
    container.replaceChildren();
    var image = document.createElement("img");
    image.className = "ctw-qr";
    image.alt = "QR code for the student lesson link";
    image.width = 148;
    image.height = 148;
    image.loading = "lazy";
    image.referrerPolicy = "no-referrer";
    image.src = `https://api.qrserver.com/v1/create-qr-code/?size=296x296&margin=10&data=${encodeURIComponent(url)}`;
    image.addEventListener("error", function () {
      container.replaceChildren(el("p", "ctw-muted", "QR unavailable offline. Use Copy student link."));
    });
    container.appendChild(image);
  }

  function substitutePlan(lesson, support) {
    return [
      `SUBSTITUTE PLAN — ${lesson.id}: ${lesson.title}`,
      `Class: ${state.section} · Time: ${lesson.timeEstimate}`,
      `Math goal: ${lesson.objective}`,
      `Language goal: ${lesson.languageObjective}`,
      "",
      "1. Do Now (5 min): Ask students to name what they remember about the prerequisite.",
      "2. Lesson (15 min): Open the interactive lesson and complete the model together.",
      "3. Practice (15 min): Students use guided notes or the practice handout.",
      `4. Explain (5 min): ${support?.sentenceFrame || "My answer is ___ because ___."}`,
      "5. Check (5 min): Complete the lesson check and leave work for Mr. Neft.",
      "",
      `Student link: ${studentUrl(lesson)}`,
    ].join("\n");
  }

  function renderSelectors(container, onChange) {
    var section = el("select", "ctw-select");
    ["601", "602", "603", "Other"].forEach(function (name) {
      var option = el("option", null, name);
      option.value = name;
      option.selected = state.section === name;
      section.appendChild(option);
    });
    section.addEventListener("change", function () {
      state.section = section.value;
      saveState();
      onChange();
    });

    var unit = el("select", "ctw-select");
    Array.from(new Set(lessons.map(function (lesson) { return lesson.unit; }))).forEach(function (number) {
      var option = el("option", null, `Unit ${number}`);
      option.value = String(number);
      unit.appendChild(option);
    });
    unit.value = String(selectedLesson().unit);

    var lessonSelect = el("select", "ctw-select");
    function fillLessons(unitNumber) {
      lessonSelect.replaceChildren();
      lessons.filter(function (lesson) { return lesson.unit === Number(unitNumber); }).forEach(function (lesson) {
        var option = el("option", null, `${lesson.id} · ${lesson.title}`);
        option.value = lesson.id;
        lessonSelect.appendChild(option);
      });
      if (lessonsById[state.selected]?.unit === Number(unitNumber)) lessonSelect.value = state.selected;
      else state.selected = lessonSelect.value;
    }
    fillLessons(unit.value);
    unit.addEventListener("change", function () {
      fillLessons(unit.value);
      state.selected = lessonSelect.value;
      updateRecent(state.selected);
      onChange();
    });
    lessonSelect.addEventListener("change", function () {
      state.selected = lessonSelect.value;
      updateRecent(state.selected);
      onChange();
    });

    container.appendChild(field("Class", section));
    container.appendChild(field("Unit", unit));
    container.appendChild(field("Lesson", lessonSelect));
  }

  function sequence(title, steps) {
    var details = el("details", "ctw-sequence");
    details.appendChild(el("summary", null, title));
    var list = el("ol");
    (steps || []).forEach(function (step) { list.appendChild(el("li", null, step)); });
    details.appendChild(list);
    return details;
  }

  function renderToday(stage) {
    var lesson = selectedLesson();
    var family = familyFor(lesson);
    var readiness = DATA.workflow.families[family] || DATA.workflow.families.general;
    var support = DATA.supports.families[family] || DATA.supports.families.general;
    var index = lessons.findIndex(function (item) { return item.id === lesson.id; });
    var safeUrl = studentUrl(lesson);
    stage.replaceChildren();

    var selectors = el("div", "ctw-selectors");
    renderSelectors(selectors, function () { renderToday(stage); });
    stage.appendChild(selectors);

    var nav = el("div", "ctw-lesson-nav");
    nav.appendChild(button("← Previous", function () {
      if (index > 0) { state.selected = lessons[index - 1].id; updateRecent(state.selected); renderToday(stage); }
    }));
    nav.appendChild(el("span", "ctw-position", `Lesson ${index + 1} of ${lessons.length}`));
    nav.appendChild(button("Next →", function () {
      if (index < lessons.length - 1) { state.selected = lessons[index + 1].id; updateRecent(state.selected); renderToday(stage); }
    }));
    stage.appendChild(nav);

    var hero = el("section", "ctw-today-card");
    var copy = el("div", "ctw-today-copy");
    copy.appendChild(el("p", "ctw-kicker", `Today's Teaching · ${state.section} · Unit ${lesson.unit}`));
    copy.appendChild(el("h3", null, `${lesson.id} · ${lesson.title}`));
    copy.appendChild(el("p", "ctw-objective", lesson.objective));
    copy.appendChild(el("p", "ctw-language", `Language objective: ${lesson.languageObjective}`));
    var metadata = el("div", "ctw-metadata");
    [lesson.standard, lesson.timeEstimate, readiness.materials].forEach(function (value) {
      metadata.appendChild(el("span", null, value));
    });
    copy.appendChild(metadata);
    var actions = el("div", "ctw-actions");
    actions.appendChild(link("Teach this lesson", lesson.resources.lesson, "ctw-primary"));
    actions.appendChild(link("Launch for students", safeUrl, "ctw-student"));
    actions.appendChild(button("Copy student link", function (event) { copyText(safeUrl, event.currentTarget); }));
    actions.appendChild(button("Print lesson plan", function () { document.body.classList.add("ctw-printing"); window.print(); }));
    actions.appendChild(button((state.favorites || []).includes(lesson.id) ? "★ Favorited" : "☆ Favorite", function () {
      var set = new Set(state.favorites || []);
      set.has(lesson.id) ? set.delete(lesson.id) : set.add(lesson.id);
      state.favorites = Array.from(set); saveState(); renderToday(stage);
    }));
    copy.appendChild(actions);
    hero.appendChild(copy);
    var qr = el("div", "ctw-qr-wrap");
    renderQr(qr, safeUrl);
    qr.appendChild(el("p", "ctw-muted", "Scan to open the student-safe lesson."));
    hero.appendChild(qr);
    stage.appendChild(hero);

    var readinessCard = el("section", "ctw-readiness");
    readinessCard.appendChild(el("h3", null, "Lesson Readiness"));
    var grid = el("div", "ctw-readiness-grid");
    grid.appendChild(kv("Success criteria", readiness.successCriteria));
    grid.appendChild(kv("Prerequisite", readiness.prerequisite));
    grid.appendChild(kv("Common misconception", readiness.misconception));
    grid.appendChild(kv("Teacher response", readiness.responseMove));
    grid.appendChild(kv("Vocabulary", (support.vocabulary || lesson.vocabulary).join(", ")));
    grid.appendChild(kv("TWR sentence frame", support.sentenceFrame || lesson.sentenceFrames[0]));
    grid.appendChild(kv("WIDA 1–2", support.wida12));
    grid.appendChild(kv("WIDA 3–4", support.wida34));
    grid.appendChild(kv("SPED access", support.sped));
    grid.appendChild(kv("Enrichment", support.extension));
    readinessCard.appendChild(grid);
    readinessCard.appendChild(sequence("45-minute sequence", DATA.workflow.sequences.minutes45));
    readinessCard.appendChild(sequence("90-minute sequence", DATA.workflow.sequences.minutes90));
    var sub = button("Copy substitute plan", function (event) {
      copyText(substitutePlan(lesson, support), event.currentTarget);
    });
    readinessCard.appendChild(sub);
    stage.appendChild(readinessCard);

    var quick = el("section", "ctw-quick");
    quick.appendChild(el("h3", null, "Favorites & recent lessons"));
    var quickLinks = el("div", "ctw-quick-links");
    Array.from(new Set((state.favorites || []).concat(state.recent || []))).slice(0, 8).forEach(function (id) {
      if (!lessonsById[id]) return;
      quickLinks.appendChild(button(`${id} · ${lessonsById[id].title}`, function () {
        state.selected = id; updateRecent(id); renderToday(stage);
      }));
    });
    if (!quickLinks.children.length) quickLinks.appendChild(el("p", "ctw-muted", "Favorite a lesson to keep it here."));
    quick.appendChild(quickLinks);
    stage.appendChild(quick);
  }

  function renderPanel() {
    if (!panel) return;
    var stage = panel.querySelector(".ctw-stage");
    panel.querySelectorAll("[data-ctw-view]").forEach(function (tab) {
      tab.setAttribute("aria-pressed", tab.dataset.ctwView === state.view ? "true" : "false");
    });
    if (state.view === "today") renderToday(stage);
    else if (window.CurriculumTeacherPlanning?.render) {
      window.CurriculumTeacherPlanning.render(state.view, stage, {
        state: state, saveState: saveState, lessons: lessons, lessonsById: lessonsById,
        data: DATA, studentUrl: studentUrl, button: button, link: link, el: el,
      });
    }
  }

  function buildPanel() {
    panel = el("section", "ctw-panel");
    panel.id = "curriculum-teacher-workflow";
    panel.setAttribute("aria-label", "Teacher curriculum command center");
    var hero = el("header", "ctw-header");
    hero.appendChild(el("p", "ctw-kicker", "Teacher Command Center · Local & private"));
    hero.appendChild(el("h2", null, "Plan it. Teach it. Launch it."));
    hero.appendChild(el("p", null, "Start with today's lesson, then build the week, a student playlist, a unit map, or tomorrow's groups."));
    panel.appendChild(hero);
    var tabs = el("nav", "ctw-tabs");
    tabs.setAttribute("aria-label", "Teacher workflow views");
    [
      ["today", "Today's Teaching"], ["week", "Weekly Pacing"],
      ["playlist", "Student Playlist"], ["unit", "Unit Map"], ["next", "Next-Day Plan"],
    ].forEach(function (entry) {
      var tab = button(entry[1], function () { state.view = entry[0]; saveState(); renderPanel(); });
      tab.dataset.ctwView = entry[0];
      tabs.appendChild(tab);
    });
    panel.appendChild(tabs);
    panel.appendChild(el("div", "ctw-stage"));
    return panel;
  }

  function syncTeacherMode() {
    if (!panel) return;
    panel.hidden = !document.body.classList.contains("teacher-mode");
    if (!panel.hidden) renderPanel();
  }

  function init() {
    Promise.all([
      getJson("/data/curriculum-launch-manifest.json"),
      getJson("/data/curriculum-supports.json"),
      getJson("/data/curriculum-teacher-workflow.json"),
      getJson("/data/curriculum-uifr-level4.json"),
    ]).then(function (results) {
      DATA.launch = results[0]; DATA.supports = results[1]; DATA.workflow = results[2]; DATA.uifr = results[3];
      lessons = DATA.launch.lessons || [];
      lessons.forEach(function (lesson) { lessonsById[lesson.id] = lesson; });
      if (!lessonsById[state.selected]) state.selected = lessons[0].id;
      var anchor = document.querySelector(".wrap");
      if (!anchor?.parentNode) return;
      anchor.parentNode.insertBefore(buildPanel(), anchor);
      window.CurriculumTeacherPlanning?.organizeTools?.();
      syncTeacherMode();
      new MutationObserver(syncTeacherMode).observe(document.body, { attributes: true, attributeFilter: ["class"] });
      window.addEventListener("afterprint", function () { document.body.classList.remove("ctw-printing"); });
    }).catch(function (error) { console.error("Teacher workflow unavailable", error); });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
