/* ==========================================================================
   Reveal Math · Grade 6 Fluency & Diagnostic Guide — application engine
   Every view is rendered from DATA. There is no duplicated lesson markup.
   ========================================================================== */
(function () {
  "use strict";
  const DATA = window.FluencyData;
  const LESSON_VIEW = document.getElementById("tab-lessons").dataset.view;
  const FluencyStudio = window.FluencyStudio;

  /* ---------------------------------------------------------------- utils */
  const $ = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));
  const esc = (s) =>
    String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  const stripTags = (s) =>
    String(s == null ? "" : s)
      .replace(/<br\s*\/?>/gi, " ")
      .replace(/<[^>]*>/g, "");

  const store = {
    get(key, fallback) {
      try {
        const raw = localStorage.getItem(key);
        return raw == null ? fallback : JSON.parse(raw);
      } catch (_) {
        return fallback;
      }
    },
    set(key, value) {
      try {
        localStorage.setItem(key, JSON.stringify(value));
        return true;
      } catch (_) {
        return false;
      }
    },
  };

  const KEY = {
    theme: "rmg6.theme.v2",
    saved: "rmg6.saved.v2",
    tracker: "rmg6.tracker.v2",
    plan: "rmg6.plan.v2",
    form: "rmg6.form.v2",
  };

  /* ----------------------------------------------------------- data index */
  const LESSONS = [];
  const byId = Object.create(null);
  DATA.units.forEach((unit) => {
    unit.lessons.forEach((lesson) => {
      lesson.unitNumber = unit.number;
      lesson.unitTitle = unit.title;
      lesson.forms = [{ form: "A", prompt: lesson.quick_check, answer: lesson.solution }].concat(
        lesson.variants || [],
      );
      lesson.spineRanks = (lesson.spine_links || []).map((s) => s.rank);
      lesson.hasElementary = lesson.skills.some((s) => /^Gr\s*[2-5]/.test(s.source));
      lesson.hasSpiral = lesson.skills.some((s) => !/^Gr\s*[2-5]/.test(s.source));
      LESSONS.push(lesson);
      byId[lesson.id] = lesson;
    });
  });

  const spineByRank = Object.create(null);
  DATA.spine.forEach((s) => {
    spineByRank[s.rank] = s;
  });

  const searchIndex = Object.create(null);
  LESSONS.forEach((lesson) => {
    const bits = [
      lesson.id,
      lesson.title,
      lesson.subtopics,
      lesson.unitTitle,
      lesson.standard && lesson.standard.code,
      lesson.standard && lesson.standard.text,
      lesson.skills.map((s) => s.text + " " + s.source).join(" "),
      lesson.forms.map((f) => f.prompt + " " + stripTags(f.answer)).join(" "),
      lesson.diagnostic,
      lesson.reteach_source,
      (lesson.vocabulary || []).map((v) => v.term + " " + v.def).join(" "),
      (lesson.errors || []).map((e) => e.shows + " " + e.means).join(" "),
      lesson.frame,
      lesson.extension && lesson.extension.prompt,
      lesson.spineRanks.map((r) => "spine " + r).join(" "),
    ];
    searchIndex[lesson.id] = stripTags(bits.join(" ")).toLowerCase();
  });

  /* --------------------------------------------------------------- state */
  const state = {
    view: LESSON_VIEW,
    search: "",
    unit: "all",
    spine: "all",
    origin: "all",
    savedOnly: false,
    form: store.get(KEY.form, "A"),
    saved: new Set((store.get(KEY.saved, []) || []).filter((id) => byId[id])),
    tracker: store.get(KEY.tracker, {}) || {},
    plan: store.get(KEY.plan, ["", "", "", "", ""]) || ["", "", "", "", ""],
    openDrawers: new Set(),
    modalLesson: null,
  };

  /* -------------------------------------------------- sticky stack sizing */
  function measureStack() {
    const header = $(".site-header");
    const viewbar = $(".viewbar");
    const headerH = getComputedStyle(header).position === "sticky" ? header.offsetHeight : 0;
    const stackH =
      headerH + (getComputedStyle(viewbar).position === "sticky" ? viewbar.offsetHeight : 0);
    document.documentElement.style.setProperty("--header-h", headerH + "px");
    document.documentElement.style.setProperty("--stack-h", stackH + "px");
  }

  /* --------------------------------------------------------------- theme */
  function applyTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    const btn = $("#themeBtn");
    if (btn) {
      btn.setAttribute("aria-pressed", String(theme === "dark"));
      btn.querySelector(".label").textContent = theme === "dark" ? "Light" : "Dark";
    }
    store.set(KEY.theme, theme);
  }

  /* --------------------------------------------------------------- toast */
  let toastTimer = null;
  function toast(message) {
    const host = $("#toasts");
    host.innerHTML =
      '<div class="toast"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg><span>' +
      esc(message) +
      "</span></div>";
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      host.innerHTML = "";
    }, 2600);
  }

  /* ------------------------------------------------------------ filtering */
  function matches(lesson) {
    if (state.unit !== "all" && String(lesson.unitNumber) !== state.unit) return false;
    if (state.spine !== "all" && !lesson.spineRanks.includes(Number(state.spine))) return false;
    if (state.origin === "elementary" && !lesson.hasElementary) return false;
    if (state.origin === "spiral" && !lesson.hasSpiral) return false;
    if (state.savedOnly && !state.saved.has(lesson.id)) return false;

    const query = state.search.trim().toLowerCase();
    if (!query) return true;
    const exact = query.match(/^(?:lesson\s+)?(\d+)[.\-](\d+)$/);
    if (exact) return lesson.id === Number(exact[1]) + "-" + Number(exact[2]);
    return query
      .split(/\s+/)
      .filter(Boolean)
      .every((token) => searchIndex[lesson.id].includes(token));
  }

  function visibleLessons() {
    return LESSONS.filter(matches);
  }

  /* --------------------------------------------------------- render parts */
  function srcTag(source) {
    const elementary = /^Gr\s*[2-5]/.test(source);
    return (
      '<span class="src ' +
      (elementary ? "src-elem" : "src-spiral") +
      '">' +
      esc(source) +
      "</span>"
    );
  }

  function skillRows(lesson, compact) {
    return lesson.skills
      .map(
        (skill, i) =>
          '<div class="skill-row">' +
          (compact ? "" : '<span class="skill-n">' + (i + 1) + "</span>") +
          '<span class="skill-text">' +
          (compact ? "<b>" + (i + 1) + ".</b> " : "") +
          esc(skill.text) +
          "</span>" +
          srcTag(skill.source) +
          "</div>",
      )
      .join("");
  }

  function activeForm(lesson) {
    return lesson.forms.find((f) => f.form === state.form) || lesson.forms[0];
  }

  function formSwitch(lesson) {
    return (
      '<div class="form-switch" role="group" aria-label="Quick check version for lesson ' +
      esc(lesson.id) +
      '">' +
      lesson.forms
        .map(
          (f) =>
            '<button type="button" data-act="form" data-form="' +
            f.form +
            '" aria-pressed="' +
            (f.form === state.form) +
            '" title="Version ' +
            f.form +
            '">' +
            f.form +
            "</button>",
        )
        .join("") +
      "</div>"
    );
  }

  function trackerBlock(lesson) {
    const t = state.tracker[lesson.id] || { secure: 0, dev: 0, not: 0 };
    const cell = (key, cls, label) =>
      '<span class="tally ' +
      cls +
      '">' +
      '<button type="button" data-act="tally" data-id="' +
      lesson.id +
      '" data-key="' +
      key +
      '" data-delta="-1" aria-label="Decrease ' +
      label +
      ' count">−</button>' +
      '<span class="val">' +
      t[key] +
      "</span>" +
      '<button type="button" data-act="tally" data-id="' +
      lesson.id +
      '" data-key="' +
      key +
      '" data-delta="1" aria-label="Increase ' +
      label +
      ' count">+</button>' +
      '</span><span class="tally-label">' +
      label +
      "</span>";
    return (
      '<div class="tracker">' +
      '<div class="tracker-title">After the check — how did the room do?</div>' +
      '<div class="tracker-row">' +
      cell("secure", "secure", "Secure") +
      cell("dev", "dev", "Developing") +
      cell("not", "not", "Not yet") +
      '<button class="btn btn-sm" type="button" data-act="tally-reset" data-id="' +
      lesson.id +
      '">Reset</button></div></div>'
    );
  }

  function answerDrawer(lesson) {
    const form = activeForm(lesson);
    const errors = (lesson.errors || [])
      .map(
        (e) =>
          "<tr><td>" +
          esc(e.shows) +
          "</td><td>" +
          esc(e.means) +
          "</td><td>" +
          esc(e.do) +
          "</td></tr>",
      )
      .join("");

    return (
      '<div class="drawer' +
      (state.openDrawers.has(lesson.id) ? " open" : "") +
      '" id="drawer-' +
      lesson.id +
      '">' +
      '<div class="answer"><b>Answer (version ' +
      form.form +
      "):</b><br>" +
      form.answer +
      "</div>" +
      '<div class="sub-head">What the wrong answers tell you</div>' +
      '<p class="diag">' +
      esc(lesson.diagnostic) +
      "</p>" +
      (errors
        ? '<table class="err-table"><thead><tr><th>If you see</th><th>It means</th><th>Do this</th></tr></thead><tbody>' +
          errors +
          "</tbody></table>"
        : "") +
      '<div class="sub-head">' +
      esc(lesson.reteach.minutes) +
      "-minute reteach</div>" +
      '<div class="reteach"><span class="reteach-time">' +
      esc(lesson.reteach.minutes) +
      " minutes · whole class or small group</span>" +
      "<ol>" +
      lesson.reteach.steps.map((s) => "<li>" + esc(s) + "</li>").join("") +
      "</ol></div>" +
      '<div class="sub-head">Say it this way</div>' +
      '<div class="frame-box">' +
      esc(lesson.frame) +
      "</div>" +
      '<div class="sub-head">Words students need</div>' +
      '<div class="vocab">' +
      (lesson.vocabulary || [])
        .map(
          (v) => '<span class="vocab-item"><b>' + esc(v.term) + "</b> — " + esc(v.def) + "</span>",
        )
        .join("") +
      "</div>" +
      '<div class="sub-head">If they finish early</div>' +
      '<div class="ext"><b>' +
      esc(lesson.extension.prompt) +
      "</b><br>" +
      esc(lesson.extension.answer) +
      "</div>" +
      '<div class="sub-head">Fall back to</div>' +
      '<p class="diag">' +
      esc(lesson.reteach_source) +
      "</p>" +
      trackerBlock(lesson) +
      "</div>"
    );
  }

  function lessonCard(lesson) {
    const form = activeForm(lesson);
    const isSaved = state.saved.has(lesson.id);
    const std = lesson.standard;

    return (
      '<article class="lesson" id="lesson-' +
      lesson.id +
      '" data-id="' +
      lesson.id +
      '">' +
      '<div class="lesson-head">' +
      "<div>" +
      '<span class="lesson-id">Lesson ' +
      esc(lesson.id) +
      "</span>" +
      "<h3>" +
      esc(lesson.title) +
      "</h3>" +
      '<div class="lesson-sub">' +
      esc(lesson.subtopics) +
      "</div>" +
      "</div>" +
      '<div class="lesson-tags">' +
      '<span class="std-chip" title="' +
      esc(std.text) +
      '">' +
      esc(std.code) +
      "</span>" +
      lesson.spine_links
        .map(
          (s) =>
            '<button type="button" class="spine-chip" data-act="filter-spine" data-rank="' +
            s.rank +
            '" title="' +
            esc(s.skill) +
            '">Spine #' +
            s.rank +
            "</button>",
        )
        .join("") +
      "</div>" +
      "</div>" +
      '<div class="lesson-body">' +
      '<div class="col">' +
      '<div class="col-title">' +
      '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>' +
      "Fluency needed first · " +
      lesson.skills.length +
      " skills" +
      "</div>" +
      skillRows(lesson) +
      "</div>" +
      '<div class="col">' +
      '<div class="col-title" style="justify-content:space-between">' +
      '<span class="qc-badge"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>2-minute quick check</span>' +
      formSwitch(lesson) +
      "</div>" +
      '<div class="qc-prompt">' +
      esc(form.prompt) +
      "</div>" +
      '<div class="actions">' +
      '<button class="btn btn-primary btn-sm" type="button" data-act="resources" data-id="' +
      lesson.id +
      '">Worksheets &amp; practice</button>' +
      '<button class="btn btn-ok btn-sm" type="button" data-act="project" data-id="' +
      lesson.id +
      '">' +
      '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/></svg>Project</button>' +
      '<button class="btn btn-sm" type="button" data-act="toggle-drawer" data-id="' +
      lesson.id +
      '" aria-expanded="' +
      state.openDrawers.has(lesson.id) +
      '" aria-controls="drawer-' +
      lesson.id +
      '">Answer &amp; teaching notes</button>' +
      '<button class="btn btn-sm" type="button" data-act="copy-prompt" data-id="' +
      lesson.id +
      '">Copy prompt</button>' +
      '<button class="btn btn-sm" type="button" data-act="copy-notes" data-id="' +
      lesson.id +
      '">Copy notes</button>' +
      '<button class="btn btn-sm" type="button" data-act="save" data-id="' +
      lesson.id +
      '" aria-pressed="' +
      isSaved +
      '">' +
      (isSaved ? "Saved ✓" : "Save") +
      "</button>" +
      "</div>" +
      answerDrawer(lesson) +
      "</div>" +
      "</div>" +
      "</article>"
    );
  }

  function renderLessons() {
    const visible = visibleLessons();
    const host = $("#view-lessons");
    if (!visible.length) {
      host.innerHTML =
        '<div class="empty"><h3>No lessons match these filters</h3>' +
        "<p>Try fewer keywords, another unit, or clear the filters to see all 54 lessons.</p>" +
        '<button class="btn btn-primary" type="button" data-act="clear">Clear all filters</button></div>';
      return;
    }
    const groups = DATA.units
      .map((unit) => {
        const lessons = unit.lessons.filter(matches);
        if (!lessons.length) return "";
        return (
          '<section class="unit" id="unit-' +
          unit.number +
          '">' +
          '<div class="unit-banner">' +
          '<div class="unit-banner-top">' +
          '<span class="unit-label">Unit ' +
          unit.number +
          "</span>" +
          '<span class="unit-count">' +
          (lessons.length === unit.lessons.length
            ? unit.lessons.length + " lessons"
            : lessons.length + " of " + unit.lessons.length + " lessons") +
          "</span>" +
          "</div>" +
          "<h2>" +
          esc(unit.title) +
          "</h2>" +
          '<p class="unit-premise">' +
          esc(unit.premise) +
          "</p>" +
          "</div>" +
          '<div class="lesson-cards">' +
          lessons.map(lessonCard).join("") +
          "</div>" +
          "</section>"
        );
      })
      .join("");
    host.innerHTML = groups;
  }

  function renderTable() {
    const visible = visibleLessons();
    const rows = visible
      .map((lesson) => {
        const form = activeForm(lesson);
        return (
          "<tr>" +
          '<td><span class="mx-id">' +
          esc(lesson.id) +
          "</span></td>" +
          '<td><div class="mx-title">' +
          esc(lesson.title) +
          '</div><div class="mx-sub">' +
          esc(lesson.subtopics) +
          "</div>" +
          '<div class="mx-sub" style="margin-top:4px"><span class="std-chip">' +
          esc(lesson.standard.code) +
          "</span></div></td>" +
          "<td>" +
          lesson.skills
            .map(
              (s, i) =>
                '<div class="mx-skill"><span><b>' +
                (i + 1) +
                ".</b> " +
                esc(s.text) +
                "</span>" +
                srcTag(s.source) +
                "</div>",
            )
            .join("") +
          "</td>" +
          '<td><div style="font-weight:600;margin-bottom:6px">' +
          esc(form.prompt) +
          "</div>" +
          '<button class="btn btn-sm" type="button" data-act="project" data-id="' +
          lesson.id +
          '">Project</button></td>' +
          "<td><div>" +
          form.answer +
          '</div><div class="mx-fallback">Fall back to: ' +
          esc(lesson.reteach_source) +
          "</div></td>" +
          "</tr>"
        );
      })
      .join("");

    $("#view-table").innerHTML = visible.length
      ? '<div class="table-wrap"><table class="matrix"><thead><tr>' +
        '<th style="width:70px">Lesson</th><th style="width:230px">Title &amp; components</th>' +
        '<th>Fluency needed first</th><th style="width:270px">Quick check (version ' +
        state.form +
        ")</th>" +
        '<th style="width:280px">Answer &amp; fallback</th></tr></thead><tbody>' +
        rows +
        "</tbody></table></div>"
      : '<div class="empty"><h3>No lessons match these filters</h3><button class="btn btn-primary" type="button" data-act="clear">Clear all filters</button></div>';
  }

  function renderSpine() {
    const cards = DATA.spine
      .map((s) => {
        const open = state.spine === String(s.rank);
        return (
          '<div class="card spine-card' +
          (open ? " active" : "") +
          '">' +
          '<div class="spine-top"><span class="spine-rank">Spine #' +
          s.rank +
          "</span>" +
          '<span class="spine-serves">Serves ' +
          s.count +
          " lessons</span></div>" +
          "<h3>" +
          esc(s.skill) +
          "</h3>" +
          '<p class="spine-why">' +
          esc(s.rationale) +
          "</p>" +
          '<div class="spine-lessons">' +
          s.lessons_list
            .map(
              (id) =>
                '<button type="button" class="lchip" data-act="goto" data-id="' +
                id +
                '">' +
                id +
                "</button>",
            )
            .join("") +
          "</div>" +
          '<div class="sub-head">Why it matters</div><p class="diag">' +
          esc(s.cognitive) +
          "</p>" +
          '<div class="sub-head">Where it comes from · where it goes</div>' +
          '<p class="diag"><b>Before Grade 6:</b> ' +
          esc(s.from) +
          "<br><b>After Grade 6:</b> " +
          esc(s.to) +
          "</p>" +
          '<div class="sub-head">Common misconceptions</div><p class="diag">' +
          esc(s.misconceptions) +
          "</p>" +
          '<div class="sub-head">Warm-up routine</div><p class="diag">' +
          s.routine +
          "</p>" +
          '<div class="sub-head">' +
          esc(s.drill.title) +
          " · 6-item drill</div>" +
          '<div class="drill-list">' +
          s.drill.items
            .map(
              (it) =>
                '<div class="drill-item"><b>' +
                esc(it.q) +
                "</b><span>" +
                esc(it.a) +
                "</span></div>",
            )
            .join("") +
          "</div>" +
          '<div class="spine-actions">' +
          '<button class="btn btn-sm btn-primary" type="button" data-act="filter-spine" data-rank="' +
          s.rank +
          '">Show its lessons</button>' +
          '<button class="btn btn-sm" type="button" data-act="copy-drill" data-rank="' +
          s.rank +
          '">Copy drill</button>' +
          "</div>" +
          "</div>"
        );
      })
      .join("");

    // Coverage heat map: spine skill × unit
    const units = DATA.units.map((u) => u.number);
    const heatRows = DATA.spine
      .map((s) => {
        const cells = units
          .map((n) => {
            const count = s.lessons_list.filter((id) => id.split("-")[0] === String(n)).length;
            const cls = count === 0 ? "h0" : count <= 1 ? "h1" : count <= 3 ? "h2" : "h3";
            return '<td class="' + cls + '">' + (count || "·") + "</td>";
          })
          .join("");
        return (
          '<tr><td class="row-head">#' +
          s.rank +
          " · " +
          esc(s.skill) +
          "</td>" +
          cells +
          '<td class="h3">' +
          s.count +
          "</td></tr>"
        );
      })
      .join("");

    $("#view-spine").innerHTML =
      '<div class="section-head"><div><h2 class="section-title">The fluency spine</h2>' +
      '<p class="section-sub">Twelve skills, ordered by how many Grade 6 lessons depend on each. Rehearse these and most of the year gets easier at once.</p></div></div>' +
      '<div class="spine-grid">' +
      cards +
      "</div>" +
      '<div class="section-head" style="margin-top:34px"><div><h2 class="section-title">Where each skill lands</h2>' +
      '<p class="section-sub">How many lessons in each unit call on each spine skill. Darker means heavier demand — plan the warm-up before the unit starts.</p></div></div>' +
      '<div class="heat-wrap"><table class="heat"><thead><tr><th class="row-head">Fluency spine skill</th>' +
      units.map((n) => "<th>U" + n + "</th>").join("") +
      "<th>All</th></tr></thead><tbody>" +
      heatRows +
      "</tbody></table></div>";
  }

  function renderPlanner() {
    const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
    const options = (selected) =>
      '<option value="">— no check this day —</option>' +
      DATA.units
        .map(
          (u) =>
            '<optgroup label="Unit ' +
            u.number +
            ": " +
            esc(u.title) +
            '">' +
            u.lessons
              .map(
                (l) =>
                  '<option value="' +
                  l.id +
                  '"' +
                  (l.id === selected ? " selected" : "") +
                  ">" +
                  esc(l.id + " · " + l.title) +
                  "</option>",
              )
              .join("") +
            "</optgroup>",
        )
        .join("");

    const slots = days
      .map(
        (day, i) =>
          '<div class="card slot"><span class="slot-day">' +
          day +
          "</span>" +
          '<label class="sr-only" for="slot-' +
          i +
          '">Lesson for ' +
          day +
          "</label>" +
          '<select class="select" id="slot-' +
          i +
          '" data-act="plan" data-slot="' +
          i +
          '">' +
          options(state.plan[i]) +
          "</select></div>",
      )
      .join("");

    const chosen = state.plan.map((id) => byId[id]).filter(Boolean);
    const tally = {};
    chosen.forEach((l) =>
      l.spineRanks.forEach((r) => {
        tally[r] = (tally[r] || 0) + 1;
      }),
    );
    const tallyRows = Object.keys(tally)
      .sort((a, b) => tally[b] - tally[a])
      .map(
        (rank) =>
          "<li><span>#" +
          rank +
          " · " +
          esc(spineByRank[rank].skill) +
          "</span><b>" +
          tally[rank] +
          "×</b></li>",
      )
      .join("");

    $("#view-planner").innerHTML =
      '<div class="section-head"><div><h2 class="section-title">Week planner</h2>' +
      '<p class="section-sub">Pick the lesson you teach each day. The guide builds a five-day bellringer sheet you can print for students and a matching key for yourself.</p></div>' +
      '<div style="display:flex;gap:8px;flex-wrap:wrap">' +
      '<button class="btn btn-primary" type="button" data-act="print-week" data-mode="student">Print student sheet</button>' +
      '<button class="btn" type="button" data-act="print-week" data-mode="teacher">Print teacher key</button>' +
      '<button class="btn" type="button" data-act="copy-week">Copy week</button>' +
      '<button class="btn" type="button" data-act="clear-week">Clear</button></div></div>' +
      '<div class="planner-grid"><div class="slot-list">' +
      slots +
      "</div>" +
      '<aside class="card plan-preview"><h3>This week rehearses</h3>' +
      "<p>" +
      (chosen.length
        ? chosen.length + " checks selected"
        : "Choose lessons to see which fluency skills the week covers.") +
      "</p>" +
      (tallyRows ? '<ul class="plan-skill-tally">' + tallyRows + "</ul>" : "") +
      "</aside></div>";

    renderWeekSheet();
  }

  function renderWeekSheet() {
    const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
    const blocks = state.plan
      .map((id, i) => {
        const lesson = byId[id];
        if (!lesson) return "";
        const form = activeForm(lesson);
        return (
          '<div class="week-day"><h2>' +
          days[i] +
          " · Lesson " +
          esc(lesson.id) +
          " — " +
          esc(lesson.title) +
          "</h2>" +
          '<div class="wprompt">' +
          esc(form.prompt) +
          "</div>" +
          '<div class="wwork"></div>' +
          '<div class="wanswer"><b>Answer:</b> ' +
          form.answer +
          "<br><b>Watch for:</b> " +
          esc(lesson.diagnostic) +
          "</div></div>"
        );
      })
      .join("");

    $("#printWeekSheet").innerHTML =
      '<div class="week-sheet-head"><h1>Fluency Quick Checks · Week Sheet</h1>' +
      "<p>Reveal Math · Grade 6 · Name _______________________________  Class _______  Week of ____________</p></div>" +
      (blocks || "<p>No lessons selected.</p>");
  }

  function renderReference() {
    const groups = {};
    LESSONS.forEach((l) => {
      const domain = l.standard.code.split(".").slice(0, 2).join(".");
      (groups[domain] = groups[domain] || []).push(l);
    });
    const domainNames = {
      "6.RP": "Ratios and Proportional Relationships",
      "6.NS": "The Number System",
      "6.EE": "Expressions and Equations",
      "6.G": "Geometry",
      "6.SP": "Statistics and Probability",
    };
    const stdCards = Object.keys(groups)
      .sort()
      .map((domain) => {
        const seen = {};
        groups[domain].forEach((l) => {
          (seen[l.standard.code] = seen[l.standard.code] || []).push(l);
        });
        return (
          '<div class="card std-group"><h3>' +
          esc(domain) +
          "</h3><p>" +
          esc(domainNames[domain] || "") +
          "</p>" +
          Object.keys(seen)
            .sort()
            .map(
              (code) =>
                '<div style="margin-bottom:11px"><div style="font-family:var(--font-mono);font-size:12.5px;font-weight:700">' +
                esc(code) +
                "</div>" +
                '<div style="font-size:12.5px;color:var(--ink-3);margin:2px 0 5px">' +
                esc(seen[code][0].standard.text) +
                "</div>" +
                '<div class="spine-lessons">' +
                seen[code]
                  .map(
                    (l) =>
                      '<button type="button" class="lchip" data-act="goto" data-id="' +
                      l.id +
                      '">' +
                      l.id +
                      "</button>",
                  )
                  .join("") +
                "</div></div>",
            )
            .join("") +
          "</div>"
        );
      })
      .join("");

    const terms = {};
    LESSONS.forEach((l) =>
      (l.vocabulary || []).forEach((v) => {
        if (!terms[v.term]) terms[v.term] = { def: v.def, lessons: [] };
        terms[v.term].lessons.push(l.id);
      }),
    );
    const glossary = Object.keys(terms)
      .sort((a, b) => a.localeCompare(b))
      .map(
        (term) =>
          '<div class="gloss-item"><b>' +
          esc(term) +
          "</b>" +
          esc(terms[term].def) +
          " <em>" +
          terms[term].lessons.join(", ") +
          "</em></div>",
      )
      .join("");

    $("#view-reference").innerHTML =
      '<div class="section-head"><div><h2 class="section-title">Standards index</h2>' +
      '<p class="section-sub">Every lesson mapped to the Grade 6 standard it teaches. Click a lesson number to open it.</p></div></div>' +
      '<div class="ref-grid">' +
      stdCards +
      "</div>" +
      '<div class="section-head" style="margin-top:34px"><div><h2 class="section-title">Glossary</h2>' +
      '<p class="section-sub">' +
      Object.keys(terms).length +
      " terms used across the guide, with the lessons that introduce them.</p></div></div>" +
      '<div class="card" style="padding:20px"><div class="glossary">' +
      glossary +
      "</div></div>";
  }

  /* ------------------------------------------------------------ rendering */
  function syncControls() {
    document.body.classList.toggle("studio-mode", state.view === "studio");
    $("#searchInput").value = state.search;
    $("#searchClear").style.display = state.search ? "block" : "none";
    $("#spineSelect").value = state.spine;
    $("#originSelect").value = state.origin;
    $$(".pill").forEach((p) =>
      p.setAttribute("aria-pressed", String(p.dataset.unit === state.unit)),
    );
    const savedBtn = $("#savedBtn");
    savedBtn.textContent = "Saved (" + state.saved.size + ")";
    savedBtn.setAttribute("aria-pressed", String(state.savedOnly));
    const count = visibleLessons().length;
    $("#results").textContent = "Showing " + count + " of " + LESSONS.length + " lessons";
    $$(".viewtab").forEach((t) =>
      t.setAttribute("aria-selected", String(t.dataset.view === state.view)),
    );
    $$("[data-panel]").forEach((p) => {
      p.hidden = p.dataset.panel !== state.view;
    });
    $("#toolbar").hidden = !(state.view === LESSON_VIEW || state.view === "table");
  }

  function render() {
    syncControls();
    if (state.view === LESSON_VIEW) renderLessons();
    else if (state.view === "table") renderTable();
    else if (state.view === "spine") renderSpine();
    else if (state.view === "planner") renderPlanner();
    else if (state.view === "reference") renderReference();
    else if (state.view === "studio") FluencyStudio.render();
    renderWeekSheet();
    writeHash();
  }

  /* ------------------------------------------------------------- routing */
  let suppressHash = false;
  function writeHash() {
    if (suppressHash) return;
    if (state.view === "studio") {
      history.replaceState(null, "", FluencyStudio.hash());
      return;
    }
    const parts = ["view=" + state.view];
    if (state.search) parts.push("q=" + encodeURIComponent(state.search));
    if (state.unit !== "all") parts.push("unit=" + state.unit);
    if (state.spine !== "all") parts.push("spine=" + state.spine);
    if (state.origin !== "all") parts.push("origin=" + state.origin);
    const hash = "#" + parts.join("&");
    if (location.hash !== hash) history.replaceState(null, "", hash);
  }

  function readHash() {
    const raw = location.hash.replace(/^#/, "");
    if (!raw || raw === "main") return false;
    const params = new URLSearchParams(raw.replace(/&/g, "&"));
    state.view = [LESSON_VIEW, "studio", "table", "spine", "planner", "reference"].includes(
      params.get("view"),
    )
      ? params.get("view")
      : LESSON_VIEW;
    state.search = "";
    state.unit = "all";
    state.spine = "all";
    state.origin = "all";
    if (FluencyStudio.isStudent()) state.view = "studio";
    if (params.get("q")) state.search = params.get("q");
    if (params.get("unit")) state.unit = params.get("unit");
    if (params.get("spine")) state.spine = params.get("spine");
    if (params.get("origin")) state.origin = params.get("origin");
    const lesson = params.get("lesson");
    if (lesson && byId[lesson] && state.view !== "studio") {
      state.view = LESSON_VIEW;
      state.search = lesson;
    }
    return true;
  }

  /* --------------------------------------------------------------- modal */
  const timer = { total: 120, left: 120, running: false, handle: null, deadline: 0 };
  let modalOpener = null;

  function openModal(id) {
    const lesson = byId[id];
    if (!lesson) return;
    state.modalLesson = id;
    modalOpener = document.activeElement;

    const form = activeForm(lesson);
    $("#modalBadge").textContent = "Lesson " + lesson.id;
    $("#modalTitle").textContent = lesson.title;
    $("#modalPrompt").textContent = form.prompt;
    $("#modalForms").innerHTML = lesson.forms
      .map(
        (f) =>
          '<button type="button" data-act="modal-form" data-form="' +
          f.form +
          '" aria-pressed="' +
          (f.form === state.form) +
          '">' +
          f.form +
          "</button>",
      )
      .join("");
    $("#modalAnswerBody").innerHTML =
      '<div class="answer">' +
      form.answer +
      "</div>" +
      '<div class="sub-head">Watch for</div><p class="diag">' +
      esc(lesson.diagnostic) +
      "</p>" +
      '<div class="sub-head">Fall back to</div><p class="diag">' +
      esc(lesson.reteach_source) +
      "</p>";
    $("#modalAnswer").classList.remove("open");
    $("#revealBtn").textContent = "Reveal answer";
    $("#revealBtn").setAttribute("aria-expanded", "false");

    resetTimer();
    $("#backdrop").classList.add("open");
    document.body.style.overflow = "hidden";
    $("#modal").focus();
  }

  function closeModal() {
    $("#backdrop").classList.remove("open");
    document.body.style.overflow = "";
    pauseTimer();
    if (modalOpener && modalOpener.isConnected) modalOpener.focus();
  }

  function stepModal(delta) {
    if (!state.modalLesson) return;
    const index = LESSONS.findIndex((l) => l.id === state.modalLesson);
    const next = LESSONS[(index + delta + LESSONS.length) % LESSONS.length];
    openModal(next.id);
  }

  function updateTimer() {
    const m = Math.floor(timer.left / 60),
      s = timer.left % 60;
    const digits = $("#timerDigits");
    digits.textContent = String(m).padStart(2, "0") + ":" + String(s).padStart(2, "0");
    digits.classList.toggle("warning", timer.left <= 10);
    const fill = $("#timerFill");
    fill.style.width = (timer.total ? (timer.left / timer.total) * 100 : 0) + "%";
    fill.style.background = timer.left <= 10 ? "var(--alert)" : "var(--accent)";
  }

  function startTimer() {
    if (timer.running) return;
    if (timer.left <= 0) timer.left = timer.total;
    timer.deadline = Date.now() + timer.left * 1000;
    timer.running = true;
    $("#timerBtn").textContent = "Pause";
    timer.handle = setInterval(() => {
      timer.left = Math.max(0, Math.ceil((timer.deadline - Date.now()) / 1000));
      updateTimer();
      if (timer.left === 0) {
        pauseTimer();
        chime();
        toast("Time is up.");
      }
    }, 200);
  }

  function pauseTimer() {
    if (timer.running) timer.left = Math.max(0, Math.ceil((timer.deadline - Date.now()) / 1000));
    timer.running = false;
    clearInterval(timer.handle);
    const btn = $("#timerBtn");
    if (btn) btn.textContent = "Start";
  }

  function resetTimer(seconds) {
    pauseTimer();
    if (seconds) timer.total = seconds;
    timer.left = timer.total;
    updateTimer();
    $$('[data-act="preset"]').forEach((b) =>
      b.setAttribute("aria-pressed", String(Number(b.dataset.seconds) === timer.total)),
    );
  }

  function chime() {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      [523.25, 659.25, 783.99].forEach((freq, i) => {
        const osc = ctx.createOscillator(),
          gain = ctx.createGain();
        const at = ctx.currentTime + i * 0.15;
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, at);
        gain.gain.setValueAtTime(0, at);
        gain.gain.linearRampToValueAtTime(0.3, at + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, at + 1.2);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(at);
        osc.stop(at + 1.3);
      });
    } catch (_) {
      /* audio is optional */
    }
  }

  /* ---------------------------------------------------------------- copy */
  async function copy(text, message) {
    try {
      if (!navigator.clipboard || !navigator.clipboard.writeText) throw new Error("unavailable");
      await navigator.clipboard.writeText(text);
      toast(message);
    } catch (_) {
      const field = document.createElement("textarea");
      field.value = text;
      field.setAttribute("aria-hidden", "true");
      field.style.cssText = "position:fixed;left:0;top:0;width:1px;height:1px;opacity:0";
      document.body.appendChild(field);
      field.select();
      let ok = false;
      try {
        ok = document.execCommand("copy");
      } catch (_) {}
      field.remove();
      if (ok) toast(message);
      else window.prompt("Copy with Ctrl+C or ⌘C:", text);
    }
  }

  function lessonNotes(lesson) {
    const form = activeForm(lesson);
    return [
      "Lesson " + lesson.id + ": " + lesson.title,
      "Components: " + lesson.subtopics,
      "Standard: " + lesson.standard.code + " — " + lesson.standard.text,
      "",
      "FLUENCY NEEDED FIRST",
      lesson.skills.map((s, i) => i + 1 + ". " + s.text + "  (" + s.source + ")").join("\n"),
      "",
      "QUICK CHECK (version " + form.form + ")",
      form.prompt,
      "",
      "ANSWER",
      stripTags(form.answer),
      "",
      "WATCH FOR",
      lesson.diagnostic,
      (lesson.errors || [])
        .map((e) => "· " + e.shows + " → " + e.means + " Do: " + e.do)
        .join("\n"),
      "",
      lesson.reteach.minutes + "-MINUTE RETEACH",
      lesson.reteach.steps.map((s, i) => i + 1 + ". " + s).join("\n"),
      "",
      "SENTENCE FRAME",
      lesson.frame,
      "",
      "IF THEY FINISH EARLY",
      lesson.extension.prompt + "  →  " + lesson.extension.answer,
      "",
      "FALL BACK TO: " + lesson.reteach_source,
    ].join("\n");
  }

  /* -------------------------------------------------------------- actions */
  const actions = {
    resources(el) {
      FluencyStudio.open(el.dataset.id);
      state.view = "studio";
      render();
      document.getElementById("view-studio").scrollIntoView({ block: "start" });
    },
    view(el) {
      state.view = el.dataset.view;
      render();
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    clear() {
      state.search = "";
      state.unit = "all";
      state.spine = "all";
      state.origin = "all";
      state.savedOnly = false;
      render();
      toast("Filters cleared");
    },
    "filter-unit"(el) {
      state.unit = el.dataset.unit;
      render();
      if (state.unit !== "all") {
        const block = document.getElementById("unit-" + state.unit);
        if (block) block.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    },
    "filter-spine"(el) {
      state.spine = String(el.dataset.rank);
      state.view = LESSON_VIEW;
      render();
      toast("Showing lessons that need spine #" + el.dataset.rank);
      $("#toolbar").scrollIntoView({ behavior: "smooth", block: "start" });
    },
    "saved-only"() {
      state.savedOnly = !state.savedOnly;
      render();
    },
    save(el) {
      const id = el.dataset.id;
      if (state.saved.has(id)) state.saved.delete(id);
      else state.saved.add(id);
      if (!store.set(KEY.saved, Array.from(state.saved)))
        toast("Saved for this session only — browser storage is unavailable.");
      render();
    },
    "toggle-drawer"(el) {
      const id = el.dataset.id;
      if (state.openDrawers.has(id)) state.openDrawers.delete(id);
      else state.openDrawers.add(id);
      const drawer = document.getElementById("drawer-" + id);
      if (drawer) {
        drawer.classList.toggle("open", state.openDrawers.has(id));
        el.setAttribute("aria-expanded", String(state.openDrawers.has(id)));
      }
    },
    "toggle-all"() {
      const allOpen = state.openDrawers.size >= visibleLessons().length;
      state.openDrawers = allOpen ? new Set() : new Set(visibleLessons().map((l) => l.id));
      $("#expandBtn").textContent = allOpen ? "Expand all answers" : "Collapse answers";
      render();
    },
    form(el) {
      state.form = el.dataset.form;
      store.set(KEY.form, state.form);
      render();
    },
    "modal-form"(el) {
      state.form = el.dataset.form;
      store.set(KEY.form, state.form);
      openModal(state.modalLesson);
    },
    project(el) {
      openModal(el.dataset.id);
    },
    goto(el) {
      state.view = LESSON_VIEW;
      state.search = el.dataset.id;
      state.unit = "all";
      state.spine = "all";
      state.origin = "all";
      state.savedOnly = false;
      render();
      const card = document.getElementById("lesson-" + el.dataset.id);
      if (card) card.scrollIntoView({ behavior: "smooth", block: "center" });
    },
    "copy-prompt"(el) {
      const lesson = byId[el.dataset.id],
        form = activeForm(lesson);
      copy(
        "[Reveal Math 6 · Lesson " +
          lesson.id +
          " quick check · version " +
          form.form +
          "]\n" +
          lesson.title +
          "\n\n" +
          form.prompt,
        "Student prompt copied",
      );
    },
    "copy-notes"(el) {
      copy(lessonNotes(byId[el.dataset.id]), "Teacher notes copied");
    },
    "copy-drill"(el) {
      const s = spineByRank[el.dataset.rank];
      copy(
        s.drill.title +
          " — spine #" +
          s.rank +
          ": " +
          s.skill +
          "\n\n" +
          s.drill.items.map((it, i) => i + 1 + ". " + it.q + "   →   " + it.a).join("\n"),
        "Drill copied",
      );
    },
    tally(el) {
      const id = el.dataset.id,
        key = el.dataset.key,
        delta = Number(el.dataset.delta);
      const entry = state.tracker[id] || { secure: 0, dev: 0, not: 0 };
      entry[key] = Math.max(0, entry[key] + delta);
      state.tracker[id] = entry;
      store.set(KEY.tracker, state.tracker);
      const val = el.parentElement.querySelector(".val");
      if (val) val.textContent = entry[key];
    },
    "tally-reset"(el) {
      delete state.tracker[el.dataset.id];
      store.set(KEY.tracker, state.tracker);
      render();
    },
    plan(el) {
      state.plan[Number(el.dataset.slot)] = el.value;
      store.set(KEY.plan, state.plan);
      renderPlanner();
    },
    "clear-week"() {
      state.plan = ["", "", "", "", ""];
      store.set(KEY.plan, state.plan);
      renderPlanner();
    },
    "copy-week"() {
      const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
      const lines = state.plan.map((id, i) => {
        const lesson = byId[id];
        if (!lesson) return days[i] + ": —";
        const form = activeForm(lesson);
        return (
          days[i] +
          " · Lesson " +
          lesson.id +
          " (" +
          lesson.title +
          ")\n  Prompt: " +
          form.prompt +
          "\n  Answer: " +
          stripTags(form.answer)
        );
      });
      copy("Fluency quick checks — week sheet\n\n" + lines.join("\n\n"), "Week copied");
    },
    "print-week"(el) {
      document.body.classList.add("print-week");
      document.body.classList.toggle("print-student", el.dataset.mode === "student");
      window.print();
    },
    print() {
      if (state.view === "studio") {
        FluencyStudio.print();
        return;
      }
      document.body.classList.remove("print-week");
      document.body.classList.toggle("print-student", $("#printMode").value === "student");
      window.print();
    },
    theme() {
      applyTheme(document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark");
    },
    help() {
      $("#helpBackdrop").classList.add("open");
      $("#helpModal").focus();
    },
    "close-help"() {
      $("#helpBackdrop").classList.remove("open");
    },
    "close-modal": closeModal,
    "modal-prev"() {
      stepModal(-1);
    },
    "modal-next"() {
      stepModal(1);
    },
    timer() {
      timer.running ? pauseTimer() : startTimer();
    },
    "timer-reset"() {
      resetTimer();
    },
    preset(el) {
      resetTimer(Number(el.dataset.seconds));
    },
    reveal() {
      const box = $("#modalAnswer"),
        btn = $("#revealBtn");
      const open = box.classList.toggle("open");
      btn.textContent = open ? "Hide answer" : "Reveal answer";
      btn.setAttribute("aria-expanded", String(open));
    },
  };

  /* --------------------------------------------------------------- events */
  document.addEventListener("click", (event) => {
    const el = event.target.closest("[data-act]");
    if (!el || el.tagName === "SELECT") return;
    const fn = actions[el.dataset.act];
    if (fn) {
      event.preventDefault();
      fn(el);
    }
  });

  document.addEventListener("change", (event) => {
    const el = event.target;
    if (el.dataset && el.dataset.act === "plan") {
      actions.plan(el);
      return;
    }
    if (el.id === "spineSelect") {
      state.spine = el.value;
      render();
      return;
    }
    if (el.id === "originSelect") {
      state.origin = el.value;
      render();
      return;
    }
    if (el.id === "printMode") {
      document.body.classList.toggle("print-student", el.value === "student");
    }
  });

  document.addEventListener("input", (event) => {
    if (event.target.id === "searchInput") {
      state.search = event.target.value;
      $("#searchClear").style.display = state.search ? "block" : "none";
      render();
    }
  });

  window.addEventListener("afterprint", () => {
    document.body.classList.remove("print-week");
  });

  window.addEventListener("hashchange", () => {
    suppressHash = true;
    if (readHash()) render();
    suppressHash = false;
  });

  document.addEventListener("keydown", (event) => {
    const modalOpen = $("#backdrop").classList.contains("open");
    const helpOpen = $("#helpBackdrop").classList.contains("open");
    const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(event.target.tagName);

    if (event.key === "Escape") {
      if (helpOpen) {
        actions["close-help"]();
        return;
      }
      if (modalOpen) {
        closeModal();
        return;
      }
    }

    if (modalOpen) {
      if (event.key === "Tab") {
        const modal = $("#modal");
        const focusable = $$("button, a[href], select, input", modal).filter(
          (el) => !el.disabled && el.getClientRects().length,
        );
        if (!focusable.length) return;
        const first = focusable[0],
          last = focusable[focusable.length - 1];
        if (
          event.shiftKey &&
          (document.activeElement === first || document.activeElement === modal)
        ) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
        return;
      }
      if (typing || event.ctrlKey || event.metaKey || event.altKey || event.repeat) return;
      if (event.code === "Space") {
        event.preventDefault();
        actions.timer();
      } else if (event.key.toLowerCase() === "r") actions["timer-reset"]();
      else if (event.key.toLowerCase() === "s") actions.reveal();
      else if (event.key === "ArrowLeft") stepModal(-1);
      else if (event.key === "ArrowRight") stepModal(1);
      return;
    }

    if (typing || event.ctrlKey || event.metaKey || event.altKey) return;
    if (event.key === "/") {
      event.preventDefault();
      $("#searchInput").focus();
    } else if (event.key === "?") {
      event.preventDefault();
      actions.help();
    } else if (event.key.toLowerCase() === "t") actions.theme();
  });

  $("#backdrop").addEventListener("click", (e) => {
    if (e.target.id === "backdrop") closeModal();
  });
  $("#helpBackdrop").addEventListener("click", (e) => {
    if (e.target.id === "helpBackdrop") actions["close-help"]();
  });

  /* ----------------------------------------------------------------- boot */
  function boot() {
    const saved = store.get(KEY.theme, null);
    applyTheme(
      saved ||
        (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches
          ? "dark"
          : "light"),
    );

    $("#spineSelect").innerHTML =
      '<option value="all">All fluency spine skills</option>' +
      DATA.spine
        .map(
          (s) => '<option value="' + s.rank + '">#' + s.rank + " · " + esc(s.skill) + "</option>",
        )
        .join("");

    $("#unitPills").innerHTML =
      '<button class="pill" type="button" data-act="filter-unit" data-unit="all">All units (' +
      LESSONS.length +
      ")</button>" +
      DATA.units
        .map(
          (u) =>
            '<button class="pill" type="button" data-act="filter-unit" data-unit="' +
            u.number +
            '">Unit ' +
            u.number +
            ": " +
            esc(u.title.split(/[,&]/)[0].trim()) +
            " (" +
            u.lessons.length +
            ")</button>",
        )
        .join("");

    $$(".viewtab").forEach((tab) => {
      const counts = {
        lessons: LESSONS.length,
        table: LESSONS.length,
        spine: DATA.spine.length,
        planner: 5,
        reference: null,
      };
      const badge = tab.querySelector(".count");
      if (badge && counts[tab.dataset.view] != null) badge.textContent = counts[tab.dataset.view];
    });

    measureStack();
    window.addEventListener("resize", measureStack, { passive: true });
    if (window.ResizeObserver) {
      const ro = new ResizeObserver(measureStack);
      ro.observe($(".site-header"));
      ro.observe($(".viewbar"));
    }

    if (FluencyStudio.isStudent()) state.view = "studio";
    readHash();
    render();
    updateTimer();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
