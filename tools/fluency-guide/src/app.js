/* ==========================================================================
   Reveal Math · Grade 6 Fluency & Diagnostic Guide — Application Engine
   Teacher navigation, diagnostics, local planning, and projector controls
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
    mode: "rmg6.mode.v3",
    saved: "rmg6.saved.v2",
    tracker: "rmg6.tracker.v2",
    plan: "rmg6.plan.v2",
    form: "rmg6.form.v2",
    projectorSize: "rmg6.projSize.v3",
    sound: "rmg6.sound.v3",
    roster: "rmg6.roster.v3",
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
    mode: store.get(KEY.mode, "teacher"),
    view: LESSON_VIEW,
    search: "",
    unit: "all",
    domain: "all",
    spine: "all",
    origin: "all",
    savedOnly: false,
    form: store.get(KEY.form, "A"),
    saved: new Set((store.get(KEY.saved, []) || []).filter((id) => byId[id])),
    tracker: store.get(KEY.tracker, {}) || {},
    plan: store.get(KEY.plan, ["", "", "", "", ""]) || ["", "", "", "", ""],
    openDrawers: new Set(),
    modalLesson: null,
    projectorSize: store.get(KEY.projectorSize, "standard"),
    projectorContrast: false,
    soundEnabled: store.get(KEY.sound, true),
    activeToolTab: "ratio",
    roster: store.get(KEY.roster, [
      "Table 1",
      "Table 2",
      "Table 3",
      "Table 4",
      "Table 5",
      "Table 6",
      "Team Alpha",
      "Team Beta",
      "Partner Pair A",
      "Partner Pair B",
      "Partner Pair C",
      "Partner Pair D",
    ]),
  };

  /* ------------------------------------------------- accessibility helpers */
  function announce(message) {
    const el = $("#a11yStatus");
    if (el) el.textContent = message;
  }

  /* -------------------------------------------------- sticky stack sizing */
  function measureStack() {
    const header = $(".site-header");
    const viewbar = $(".viewbar");
    const headerH =
      header && getComputedStyle(header).position === "sticky" ? header.offsetHeight : 0;
    const stackH =
      headerH +
      (viewbar && getComputedStyle(viewbar).position === "sticky" ? viewbar.offsetHeight : 0);
    document.documentElement.style.setProperty("--header-h", headerH + "px");
    document.documentElement.style.setProperty("--stack-h", stackH + "px");
  }

  /* --------------------------------------------------------------- theme */
  function applyTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    const btn = $("#themeBtn");
    if (btn) {
      btn.setAttribute("aria-pressed", String(theme === "dark"));
      const label = btn.querySelector(".label");
      if (label) label.textContent = theme === "dark" ? "Light" : "Dark";
    }
    store.set(KEY.theme, theme);
    announce(theme === "dark" ? "Dark theme enabled" : "Light theme enabled");
  }

  /* ----------------------------------------------------------------- mode */
  function setMode(newMode) {
    state.mode = newMode;
    store.set(KEY.mode, newMode);
    const isStudent = newMode === "student";
    document.body.classList.toggle("mode-student", isStudent);
    document.body.classList.toggle("student-mode", isStudent);

    if (isStudent) {
      const tableHost = $("#view-table");
      if (tableHost) tableHost.innerHTML = "";
    }

    const teacherBtn = $("#modeTeacherBtn");
    const studentBtn = $("#modeStudentBtn");
    if (teacherBtn) {
      teacherBtn.classList.toggle("active", !isStudent);
      teacherBtn.setAttribute("aria-pressed", String(!isStudent));
    }
    if (studentBtn) {
      studentBtn.classList.toggle("active", isStudent);
      studentBtn.setAttribute("aria-pressed", String(isStudent));
    }

    FluencyStudio.setStudentMode(isStudent);

    if (isStudent && state.view !== "studio") {
      state.view = "studio";
    }

    render();
    announce(isStudent ? "Switched to Student Practice mode" : "Switched to Teacher Guide mode");
  }

  /* --------------------------------------------------------------- toast */
  let toastTimer = null;
  function toast(message) {
    const host = $("#toasts");
    if (!host) return;
    host.innerHTML =
      '<div class="toast"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg><span>' +
      esc(message) +
      "</span></div>";
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      host.innerHTML = "";
    }, 2600);
    announce(message);
  }

  /* ------------------------------------------------------------ filtering */
  function matches(lesson) {
    if (state.unit !== "all" && String(lesson.unitNumber) !== state.unit) return false;
    if (
      state.domain !== "all" &&
      (!lesson.standard || !lesson.standard.code || !lesson.standard.code.startsWith(state.domain))
    )
      return false;
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
    const activeTab = (state.drawerTabs && state.drawerTabs[lesson.id]) || "solution";
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
      '<div class="drawer-tabbar" role="tablist">' +
      '<button type="button" class="drawer-tab-btn ' +
      (activeTab === "solution" ? "active" : "") +
      '" data-act="drawer-tab" data-id="' +
      lesson.id +
      '" data-tab="solution">🔍 Solution &amp; Diagnostics</button>' +
      '<button type="button" class="drawer-tab-btn ' +
      (activeTab === "reteach" ? "active" : "") +
      '" data-act="drawer-tab" data-id="' +
      lesson.id +
      '" data-tab="reteach">⏱️ ' +
      esc(lesson.reteach.minutes) +
      "-Min Reteach Script</button>" +
      '<button type="button" class="drawer-tab-btn ' +
      (activeTab === "scaffolds" ? "active" : "") +
      '" data-act="drawer-tab" data-id="' +
      lesson.id +
      '" data-tab="scaffolds">💬 Talk, Vocab &amp; Scaffolds</button>' +
      '<button type="button" class="drawer-tab-btn ' +
      (activeTab === "tally" ? "active" : "") +
      '" data-act="drawer-tab" data-id="' +
      lesson.id +
      '" data-tab="tally">📊 Whiteboard Tally</button>' +
      "</div>" +
      // Tab 1: Solution & Diagnostics
      '<div class="drawer-tab-pane ' +
      (activeTab === "solution" ? "active" : "") +
      '" data-pane="solution">' +
      '<div class="drawer-grid">' +
      '<div class="drawer-col-main">' +
      '<div class="answer"><b>Answer (version ' +
      form.form +
      "):</b><br>" +
      form.answer +
      "</div>" +
      '<div class="sub-head">What student responses tell you</div>' +
      '<p class="diag">' +
      esc(lesson.diagnostic) +
      "</p>" +
      "</div>" +
      '<div class="drawer-col-side">' +
      (errors
        ? '<div class="sub-head">Error Analysis &amp; Diagnostic Fixes</div><table class="err-table"><thead><tr><th>If you see</th><th>It means</th><th>Coaching move</th></tr></thead><tbody>' +
          errors +
          "</tbody></table>"
        : "") +
      "</div>" +
      "</div>" +
      "</div>" +
      // Tab 2: Reteach Script
      '<div class="drawer-tab-pane ' +
      (activeTab === "reteach" ? "active" : "") +
      '" data-pane="reteach">' +
      '<div class="drawer-grid">' +
      '<div class="drawer-col-main">' +
      '<div class="reteach"><span class="reteach-time">' +
      esc(lesson.reteach.minutes) +
      " minutes · scripted mini-lesson</span>" +
      "<ol>" +
      lesson.reteach.steps.map((s) => "<li>" + esc(s) + "</li>").join("") +
      "</ol></div>" +
      "</div>" +
      '<div class="drawer-col-side">' +
      '<div class="sub-head">Prerequisite fallback standard</div>' +
      '<p class="diag">' +
      esc(lesson.reteach_source) +
      "</p>" +
      "</div>" +
      "</div>" +
      "</div>" +
      // Tab 3: Talk & Scaffolds
      '<div class="drawer-tab-pane ' +
      (activeTab === "scaffolds" ? "active" : "") +
      '" data-pane="scaffolds">' +
      '<div class="drawer-grid">' +
      '<div class="drawer-col-main">' +
      '<div class="sub-head">Sentence &amp; thinking frame</div>' +
      '<div class="frame-box">“' +
      esc(lesson.frame) +
      "”</div>" +
      '<div class="sub-head">If they finish early (Extension)</div>' +
      '<div class="ext"><b>' +
      esc(lesson.extension.prompt) +
      "</b><br>" +
      esc(lesson.extension.answer) +
      "</div>" +
      "</div>" +
      '<div class="drawer-col-side">' +
      '<div class="sub-head">Words students need</div>' +
      '<div class="vocab">' +
      (lesson.vocabulary || [])
        .map(
          (v) => '<span class="vocab-item"><b>' + esc(v.term) + "</b> — " + esc(v.def) + "</span>",
        )
        .join("") +
      "</div>" +
      "</div>" +
      "</div>" +
      "</div>" +
      // Tab 4: Room Tally
      '<div class="drawer-tab-pane ' +
      (activeTab === "tally" ? "active" : "") +
      '" data-pane="tally">' +
      trackerBlock(lesson) +
      "</div>" +
      "</div>"
    );
  }

  function lessonCard(lesson) {
    const form = activeForm(lesson);
    const isSaved = state.saved.has(lesson.id);
    const std = lesson.standard;
    const isStudent = state.mode === "student";

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
      (!isStudent
        ? '<button class="btn btn-ok btn-sm" type="button" data-act="project" data-id="' +
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
          "</button>"
        : "") +
      "</div>" +
      "</div>" +
      "</div>" +
      (!isStudent ? answerDrawer(lesson) : "") +
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
          '<div class="' +
          LESSON_VIEW +
          '">' +
          lessons.map(lessonCard).join("") +
          "</div>" +
          "</section>"
        );
      })
      .join("");
    host.innerHTML = groups;
  }

  function renderTable() {
    const isStudent = state.mode === "student";
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
          (!isStudent
            ? '<button class="btn btn-sm" type="button" data-act="project" data-id="' +
              lesson.id +
              '">Project</button>'
            : "") +
          "</td>" +
          "<td>" +
          (!isStudent
            ? "<div>" +
              form.answer +
              '</div><div class="mx-fallback">Fall back to: ' +
              esc(lesson.reteach_source) +
              "</div>"
            : '<span style="color:var(--ink-4);font-style:italic">Teacher guide only</span>') +
          "</td>" +
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
          '<button class="btn btn-sm" type="button" data-studio="print-drill" data-rank="' +
          s.rank +
          '">Print drill sheet</button>' +
          "</div>" +
          "</div>"
        );
      })
      .join("");

    // Coverage heat map
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
      '<button class="btn btn-primary" type="button" data-act="print-week-student">Print student sheet</button>' +
      '<button class="btn" type="button" data-act="print-week-key">Print teacher key</button>' +
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

    const target = $("#printWeekSheet");
    if (target) {
      target.innerHTML =
        '<div class="week-sheet-head"><h1>Fluency Quick Checks · Week Sheet</h1>' +
        "<p>Reveal Math · Grade 6 · Name _______________________________  Class _______  Week of ____________</p></div>" +
        (blocks || "<p>No lessons selected.</p>");
    }
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
        if (!terms[v.term].lessons.includes(l.id)) terms[v.term].lessons.push(l.id);
      }),
    );

    const sortedTerms = Object.keys(terms).sort((a, b) => a.localeCompare(b));
    const activeLetters = new Set(sortedTerms.map((t) => t[0].toUpperCase()));
    const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

    const azButtons =
      '<div class="glossary-az" role="group" aria-label="Filter glossary by letter">' +
      '<button type="button" class="az-btn active" data-act="glossary-letter" data-letter="ALL">All (' +
      sortedTerms.length +
      ")</button>" +
      alphabet
        .map((lt) => {
          const has = activeLetters.has(lt);
          return (
            '<button type="button" class="az-btn' +
            (has ? "" : " disabled") +
            '" data-act="glossary-letter" data-letter="' +
            lt +
            '"' +
            (has ? "" : ' disabled aria-disabled="true"') +
            ">" +
            lt +
            "</button>"
          );
        })
        .join("") +
      "</div>";

    const glossary = sortedTerms
      .map(
        (term) =>
          '<div class="gloss-item" data-letter="' +
          term[0].toUpperCase() +
          '"><b>' +
          esc(term) +
          "</b>" +
          esc(terms[term].def) +
          '<div class="spine-lessons" style="margin-top:6px">' +
          terms[term].lessons
            .map(
              (id) =>
                '<button type="button" class="lchip" data-act="goto" data-id="' +
                id +
                '" title="Go to Lesson ' +
                id +
                '">' +
                id +
                "</button>",
            )
            .join("") +
          "</div></div>",
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
      sortedTerms.length +
      " mathematical terms used across the guide, with the lessons that introduce them.</p></div></div>" +
      azButtons +
      '<div class="card" style="padding:20px"><div class="glossary" id="glossaryList">' +
      glossary +
      "</div></div>";
  }

  /* ------------------------------------------------------------ rendering */
  function syncControls() {
    document.body.classList.toggle("studio-mode", state.view === "studio");
    document.body.dataset.view = state.view;
    const isStudent = state.mode === "student";
    const hero = $("#heroSection");
    if (hero) hero.hidden = state.view !== LESSON_VIEW || isStudent;
    const protocol = $("#protocolSection");
    if (protocol) protocol.hidden = state.view !== LESSON_VIEW || isStudent;

    $("#searchInput").value = state.search;
    $("#searchClear").style.display = state.search ? "block" : "none";
    $("#spineSelect").value = state.spine;
    $("#originSelect").value = state.origin;
    $$(".pill[data-unit]").forEach((p) =>
      p.setAttribute("aria-pressed", String(p.dataset.unit === state.unit)),
    );
    $$('[data-act="filter-domain"]').forEach((b) =>
      b.setAttribute("aria-pressed", String(b.dataset.domain === state.domain)),
    );
    const savedBtn = $("#savedBtn");
    if (savedBtn) {
      savedBtn.textContent = "★ Saved (" + state.saved.size + ")";
      savedBtn.setAttribute("aria-pressed", String(state.savedOnly));
    }
    const count = visibleLessons().length;
    const res = $("#results");
    if (res) res.textContent = "Showing " + count + " of " + LESSONS.length + " lessons";

    $$(".viewtab").forEach((t) => {
      const active = t.dataset.view === state.view;
      t.setAttribute("aria-selected", String(active));
      t.setAttribute("tabindex", active ? "0" : "-1");
    });

    $$("[data-panel]").forEach((p) => {
      p.hidden = p.dataset.panel !== state.view;
    });
    const tb = $("#toolbar");
    if (tb) tb.hidden = !(state.view === LESSON_VIEW || state.view === "table");
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
    if (state.mode === "student") parts.push("mode=student");
    if (state.search) parts.push("q=" + encodeURIComponent(state.search));
    if (state.unit !== "all") parts.push("unit=" + state.unit);
    if (state.domain !== "all") parts.push("domain=" + state.domain);
    if (state.spine !== "all") parts.push("spine=" + state.spine);
    if (state.origin !== "all") parts.push("origin=" + state.origin);
    const hash = "#" + parts.join("&");
    if (location.hash !== hash) history.replaceState(null, "", hash);
  }

  function readHash() {
    const params = new URLSearchParams(location.hash.replace(/^#/, ""));
    const searchParams = new URLSearchParams(location.search);
    const requestedMode = params.get("mode") || searchParams.get("mode");
    if (
      params.get("student") === "1" ||
      searchParams.get("student") === "1" ||
      requestedMode === "student"
    )
      state.mode = "student";
    else if (requestedMode === "teacher") state.mode = "teacher";
    state.view = [LESSON_VIEW, "studio", "table", "spine", "planner", "reference"].includes(
      params.get("view"),
    )
      ? params.get("view")
      : LESSON_VIEW;
    state.search = params.get("q") || "";
    state.unit = DATA.units.some((u) => String(u.number) === params.get("unit"))
      ? params.get("unit")
      : "all";
    state.domain = ["6.RP", "6.NS", "6.EE", "6.G", "6.SP"].includes(params.get("domain"))
      ? params.get("domain")
      : "all";
    state.spine = DATA.spine.some((s) => String(s.rank) === params.get("spine"))
      ? params.get("spine")
      : "all";
    state.origin = ["elementary", "spiral"].includes(params.get("origin"))
      ? params.get("origin")
      : "all";
    state.savedOnly = false;
    if (state.mode === "student") state.view = "studio";
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

  function syncProjTally(id) {
    const lessonId = id || state.modalLesson;
    if (!lessonId) return;
    const t = state.tracker[lessonId] || { secure: 0, dev: 0, not: 0 };
    const sEl = $("#projTallySecure"),
      dEl = $("#projTallyDev"),
      nEl = $("#projTallyNot");
    if (sEl) sEl.textContent = t.secure || 0;
    if (dEl) dEl.textContent = t.dev || 0;
    if (nEl) nEl.textContent = t.not || 0;
  }

  function openModal(id) {
    const lesson = byId[id];
    if (!lesson) return;
    state.modalLesson = id;
    if (!$("#backdrop").classList.contains("open")) modalOpener = document.activeElement;

    const form = activeForm(lesson);
    $("#modalBadge").textContent = "Lesson " + lesson.id;
    $("#modalTitle").textContent = lesson.title;
    $("#modalPrompt").textContent = form.prompt;
    $("#projectorFormLabel").textContent =
      "Quick check — version " + form.form + " · answer on your whiteboard";
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

    applyProjectorSettings();
    syncProjTally(id);
    resetTimer();
    $("#backdrop").classList.add("open");
    document.body.style.overflow = "hidden";
    $("#modal").focus();
    announce("Opened projector view for lesson " + lesson.id);
  }

  function closeModal() {
    $("#backdrop").classList.remove("open");
    document.body.style.overflow = "";
    pauseTimer();
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    if (annotating) actions["toggle-annotation"]();
    if (document.fullscreenElement) {
      try {
        document.exitFullscreen();
      } catch (_) {}
    }
    if (modalOpener && modalOpener.isConnected) modalOpener.focus();
    announce("Closed projector view");
  }

  function applyProjectorSettings() {
    const box = $("#projectorBox");
    if (box) {
      box.classList.remove("font-standard", "font-large", "font-giant");
      box.classList.add("font-" + state.projectorSize);
    }
    $$(".scaler-btn").forEach((b) => {
      b.setAttribute("aria-pressed", String(b.dataset.size === state.projectorSize));
    });
    $("#modal").classList.toggle("projector-contrast", state.projectorContrast);
    const contrastBtn = $("#projectorContrastBtn");
    if (contrastBtn) contrastBtn.setAttribute("aria-pressed", String(state.projectorContrast));
    const soundBtn = $("#soundToggleBtn");
    if (soundBtn) {
      soundBtn.setAttribute("aria-pressed", String(state.soundEnabled));
      soundBtn.textContent = state.soundEnabled ? "🔔" : "🔕";
    }
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
    announce("Timer started: " + timer.left + " seconds");
    timer.handle = setInterval(() => {
      timer.left = Math.max(0, Math.ceil((timer.deadline - Date.now()) / 1000));
      updateTimer();
      if (timer.left === 0) {
        pauseTimer();
        if (state.soundEnabled) chime();
        toast("Time is up.");
        announce("Time is up");
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
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      [523.25, 659.25, 783.99].forEach((freq, i) => {
        const osc = ctx.createOscillator(),
          gain = ctx.createGain();
        const at = ctx.currentTime + i * 0.14;
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, at);
        gain.gain.setValueAtTime(0, at);
        gain.gain.linearRampToValueAtTime(0.28, at + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.001, at + 1.1);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(at);
        osc.stop(at + 1.2);
      });
    } catch (_) {}
  }

  /* ----------------------------------------------- text to speech (math voice) */
  function speakPrompt(text) {
    if (!("speechSynthesis" in window)) {
      toast("Text-to-speech not supported in this browser");
      return;
    }
    window.speechSynthesis.cancel();
    if (!text) return;

    let speechText = text
      .replace(/Lesson\s+(\d+)[–-](\d+)/gi, "Lesson $1 $2")
      .replace(/(\d+)\s*[–-]\s*(\d+)/g, "$1 to $2")
      .replace(/(^|[\s(=+\-*/])[-–](\d+)/g, "$1negative $2")
      .replace(/(\d+)\s*[-–]\s*(\d+)/g, "$1 minus $2")
      .replace(/(\d+)\s+(\d+)\/(\d+)/g, "$1 and $2 over $3")
      .replace(/(\d+)\/(\d+)/g, "$1 over $2")
      .replace(/÷/g, " divided by ")
      .replace(/×|\*/g, " times ")
      .replace(/\^2|²/g, " squared ")
      .replace(/\^3|³/g, " cubed ")
      .replace(/\^(\d+)/g, " to the power of $1 ")
      .replace(/≤|<=/g, " is less than or equal to ")
      .replace(/≥|>=/g, " is greater than or equal to ")
      .replace(/≠|!=/g, " does not equal ")
      .replace(/\$/g, " dollars ")
      .replace(/%/g, " percent ")
      .replace(/\+/g, " plus ")
      .replace(/=/g, " equals ")
      .replace(/\bft\b/gi, " feet ")
      .replace(/\bin\b/gi, " inches ")
      .replace(/\bcm\b/gi, " centimeters ")
      .replace(/\bm\b/gi, " meters ")
      .replace(/\bkm\b/gi, " kilometers ")
      .replace(/\blb\b|\blbs\b/gi, " pounds ")
      .replace(/\boz\b/gi, " ounces ")
      .replace(/\bhr\b|\bhrs\b/gi, " hours ")
      .replace(/\bmin\b|\bmins\b/gi, " minutes ")
      .replace(/\bsec\b|\bsecs\b/gi, " seconds ")
      .replace(/6\.(RP|NS|EE|G|SP)/g, "Standard 6 $1")
      .replace(/\s{2,}/g, " ")
      .trim();

    const utterance = new SpeechSynthesisUtterance(speechText);
    utterance.rate = 0.92;
    const btn = $("#readPromptBtn");
    if (btn) btn.classList.add("active");
    utterance.onend = () => {
      if (btn) btn.classList.remove("active");
    };
    utterance.onerror = () => {
      if (btn) btn.classList.remove("active");
    };
    window.speechSynthesis.speak(utterance);
    toast("Reading prompt aloud");
  }

  /* --------------------------------------------- projector on-screen annotation */
  let annotating = false;
  let penMode = "highlighter";
  let isDrawing = false;
  let lastX = 0,
    lastY = 0;

  function initProjectorCanvas() {
    const canvas = $("#projectorCanvas");
    const container = canvas ? canvas.parentElement : null;
    if (!canvas || !container) return;

    const rect = container.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    const ctx = canvas.getContext("2d");
    ctx.scale(dpr, dpr);

    const getPos = (e) => {
      const cr = canvas.getBoundingClientRect();
      return {
        x: e.clientX - cr.left,
        y: e.clientY - cr.top,
      };
    };

    canvas.onpointerdown = (e) => {
      isDrawing = true;
      const pos = getPos(e);
      lastX = pos.x;
      lastY = pos.y;
      canvas.setPointerCapture(e.pointerId);
    };

    canvas.onpointermove = (e) => {
      if (!isDrawing) return;
      const pos = getPos(e);
      ctx.beginPath();
      ctx.moveTo(lastX, lastY);
      ctx.lineTo(pos.x, pos.y);
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      if (penMode === "highlighter") {
        ctx.globalCompositeOperation = "source-over";
        ctx.strokeStyle = "rgba(255, 235, 59, 0.45)";
        ctx.lineWidth = 18;
      } else if (penMode === "pen") {
        ctx.globalCompositeOperation = "source-over";
        ctx.strokeStyle = "#d93025";
        ctx.lineWidth = 4;
      } else if (penMode === "eraser") {
        ctx.globalCompositeOperation = "destination-out";
        ctx.lineWidth = 26;
      }
      ctx.stroke();
      lastX = pos.x;
      lastY = pos.y;
    };

    canvas.onpointerup = canvas.onpointercancel = () => {
      isDrawing = false;
    };
  }

  function clearProjectorCanvas() {
    const canvas = $("#projectorCanvas");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    toast("Annotation canvas cleared");
  }

  /* ---------------------------------------------------- cold call spinner wheel */
  let spinning = false;
  const pickedColdCall = new Set();

  function renderRosterUI() {
    const input = $("#rosterInput");
    if (input) input.value = state.roster.join("\n");
  }

  function spinColdCall() {
    if (spinning) return;
    if (!state.roster || !state.roster.length) {
      toast("Please enter at least one name or group.");
      return;
    }

    const noRepeatBox = $("#coldCallNoRepeat") || $("#coldCallExcludePicked");
    const shouldExclude = noRepeatBox && noRepeatBox.checked;

    let pool = state.roster;
    if (shouldExclude) {
      pool = state.roster.filter((n) => !pickedColdCall.has(n));
      if (!pool.length) {
        pickedColdCall.clear();
        pool = state.roster.slice();
        toast("All students/groups picked! Resetting pool.");
      }
    }

    spinning = true;
    const display = $("#coldCallDisplay");
    display.classList.remove("picked");
    let count = 0;
    const totalSteps = 22;
    let delay = 50;

    const tick = () => {
      const idx = Math.floor(Math.random() * pool.length);
      display.textContent = pool[idx];
      count++;
      if (count < totalSteps) {
        delay += 10;
        setTimeout(tick, delay);
      } else {
        spinning = false;
        display.classList.add("picked");
        const chosen = display.textContent;
        if (shouldExclude) {
          pickedColdCall.add(chosen);
          const remaining = state.roster.length - pickedColdCall.size;
          announce("Selected: " + chosen + " (" + remaining + " left in pool)");
        } else {
          announce("Selected: " + chosen);
        }
        if (state.soundEnabled) chime();
      }
    };
    tick();
  }

  /* --------------------------------------------- virtual math manipulatives tools */
  function initTools() {
    switchToolTab(state.activeToolTab || "ratio");
    calcRatioTable();
    renderCoordSvg();
    renderFractionStrip();
  }

  function switchToolTab(tab) {
    state.activeToolTab = tab;
    $$('#toolsModal [data-act="tool-tab"]').forEach((btn) => {
      const active = btn.dataset.tab === tab;
      btn.classList.toggle("active", active);
      btn.setAttribute("aria-selected", String(active));
      btn.tabIndex = active ? 0 : -1;
    });
    $$("#toolsModal .tool-panel").forEach((panel) => {
      panel.hidden = panel.id !== "tool-" + tab;
    });
    if (tab === "coord") renderCoordSvg();
  }

  function toolError(panelId, ids, message) {
    const panel = document.getElementById(panelId);
    let error = panel.querySelector(".teacher-tool-error");
    if (!error) {
      error = document.createElement("p");
      error.className = "teacher-tool-error";
      error.id = panelId + "-error";
      error.setAttribute("role", "alert");
      panel.querySelector(".tool-sub").after(error);
    }
    panel.querySelectorAll("input").forEach((input) => {
      input.removeAttribute("aria-invalid");
      input.removeAttribute("aria-describedby");
    });
    error.textContent = message || "";
    error.hidden = !message;
    if (message)
      ids.forEach((id) => {
        const input = document.getElementById(id);
        if (input) {
          input.setAttribute("aria-invalid", "true");
          input.setAttribute("aria-describedby", error.id);
        }
      });
    return false;
  }

  function toolNumber(id) {
    const input = document.getElementById(id);
    return !input || input.value.trim() === "" ? NaN : Number(input.value);
  }

  function displayToolNumber(number, places = 6) {
    if (number === 0) return "0";
    const rounded = Number(number.toPrecision(places));
    const approximate =
      Math.abs(number - rounded) > Math.max(Number.EPSILON, Math.abs(number) * 1e-12);
    return (approximate ? "≈ " : "") + String(rounded);
  }

  function calcRatioTable() {
    const l1 = $("#ratioLabel1").value.trim(),
      l2 = $("#ratioLabel2").value.trim();
    const v1 = toolNumber("ratioVal1"),
      v2 = toolNumber("ratioVal2");
    const outTable = $("#ratioTableOutput"),
      outLine = $("#doubleNumberLineOutput");
    const invalid = [];
    if (!l1 || l1.length > 32) invalid.push("ratioLabel1");
    if (!l2 || l2.length > 32) invalid.push("ratioLabel2");
    if (!Number.isFinite(v1) || v1 < 0) invalid.push("ratioVal1");
    if (!Number.isFinite(v2) || v2 <= 0) invalid.push("ratioVal2");
    if (invalid.length || !Number.isFinite((v1 / v2) * 10) || (v1 > 0 && v1 / v2 === 0)) {
      outTable.innerHTML = "";
      outLine.innerHTML = "";
      return toolError(
        "tool-ratio",
        invalid.length ? invalid : ["ratioVal1", "ratioVal2"],
        "Enter two labels (up to 32 characters), a nonnegative first quantity, and a positive second quantity. Both quantities and the resulting rate must be finite.",
      );
    }
    toolError("tool-ratio", [], "");
    const unit = v1 / v2,
      factors = [0, 1, 2, 3, 4, 5, 10];
    outTable.innerHTML =
      '<div class="teacher-table-scroll"><table class="ratio-table-render"><caption>Starting pair: ' +
      esc(l1) +
      " = " +
      esc(String(v1)) +
      "; " +
      esc(l2) +
      " = " +
      esc(String(v2)) +
      '. Every column has the same ratio.</caption><thead><tr><th scope="col">Quantity</th>' +
      factors.map((f) => '<th scope="col">' + f + " " + esc(l2) + "</th>").join("") +
      '</tr></thead><tbody><tr><th scope="row">' +
      esc(l1) +
      "</th>" +
      factors.map((f) => "<td>" + displayToolNumber(unit * f) + "</td>").join("") +
      '</tr><tr><th scope="row">' +
      esc(l2) +
      "</th>" +
      factors.map((f) => "<td>" + f + "</td>").join("") +
      '</tr></tbody></table></div><p class="teacher-tool-summary"><strong>Unit rate:</strong> ' +
      displayToolNumber(unit) +
      " " +
      esc(l1) +
      " per 1 " +
      esc(l2) +
      ". The symbol ≈ marks a rounded value. The zero column shows the shared origin.</p>";
    if (v1 === 0) {
      outLine.innerHTML =
        '<p class="teacher-tool-summary">A zero unit rate keeps the first quantity at 0 for every value of the second quantity. Use the table to describe this constant relationship.</p>';
      announce("Ratio table updated with a unit rate of zero.");
      return;
    }
    let svg =
      '<svg viewBox="0 0 660 160" class="numberline-svg" role="img" aria-label="Double number line for equivalent ratios; the exact inputs and each marked value also appear in the table.">';
    svg +=
      '<text x="16" y="16" fill="var(--ink)" font-size="12">' +
      esc(l1) +
      '</text><text x="16" y="154" fill="var(--ink)" font-size="12">' +
      esc(l2) +
      "</text>";
    [48, 110].forEach((y) => {
      svg +=
        '<line x1="30" y1="' +
        y +
        '" x2="630" y2="' +
        y +
        '" stroke="var(--ink)" stroke-width="2"/>';
    });
    [0, 2, 4, 6, 8, 10].forEach((f) => {
      const x = 30 + f * 60;
      svg +=
        '<line x1="' +
        x +
        '" y1="48" x2="' +
        x +
        '" y2="110" stroke="var(--line-strong)" stroke-dasharray="3 4"/>';
      [48, 110].forEach((y) => {
        svg +=
          '<line x1="' +
          x +
          '" y1="' +
          (y - 5) +
          '" x2="' +
          x +
          '" y2="' +
          (y + 5) +
          '" stroke="var(--ink)" stroke-width="2"/>';
      });
      svg +=
        '<text x="' +
        x +
        '" y="35" text-anchor="middle" fill="var(--ink)" font-size="11">' +
        displayToolNumber(unit * f, 4) +
        '</text><text x="' +
        x +
        '" y="134" text-anchor="middle" fill="var(--ink)" font-size="12">' +
        f +
        "</text>";
    });
    outLine.innerHTML = '<div class="numberline-render">' + svg + "</svg></div>";
    announce(
      "Ratio table updated. Unit rate " + displayToolNumber(unit) + " " + l1 + " per " + l2 + ".",
    );
  }

  let coordPoints = [{ x: 3, y: -4, label: "P(3, -4)" }];
  function renderCoordSvg() {
    const svg = $("#coordSvg");
    if (!svg) return;
    const step = 20;
    let content = "";

    for (let i = -10; i <= 10; i++) {
      const p = i * step;
      const isAxis = i === 0;
      content +=
        '<line x1="' +
        p +
        '" y1="-200" x2="' +
        p +
        '" y2="200" stroke="' +
        (isAxis ? "var(--ink)" : "var(--line)") +
        '" stroke-width="' +
        (isAxis ? 2.5 : 1) +
        '"/>';
      content +=
        '<line x1="-200" y1="' +
        p +
        '" x2="200" y2="' +
        p +
        '" stroke="' +
        (isAxis ? "var(--ink)" : "var(--line)") +
        '" stroke-width="' +
        (isAxis ? 2.5 : 1) +
        '"/>';
      if (i !== 0 && i % 2 === 0) {
        content +=
          '<text x="' +
          p +
          '" y="16" font-size="10" text-anchor="middle" fill="var(--ink-3)" font-family="var(--font-mono)">' +
          i +
          "</text>";
        content +=
          '<text x="-12" y="' +
          (-p + 4) +
          '" font-size="10" text-anchor="end" fill="var(--ink-3)" font-family="var(--font-mono)">' +
          i +
          "</text>";
      }
    }
    content +=
      '<text x="130" y="-140" font-size="16" font-weight="800" fill="var(--ink-4)" opacity="0.3">Quadrant I</text>';
    content +=
      '<text x="-180" y="-140" font-size="16" font-weight="800" fill="var(--ink-4)" opacity="0.3">Quadrant II</text>';
    content +=
      '<text x="-180" y="150" font-size="16" font-weight="800" fill="var(--ink-4)" opacity="0.3">Quadrant III</text>';
    content +=
      '<text x="110" y="150" font-size="16" font-weight="800" fill="var(--ink-4)" opacity="0.3">Quadrant IV</text>';

    content += '<text x="215" y="4" font-size="12" font-weight="800" fill="var(--ink)">X</text>';
    content += '<text x="-4" y="-212" font-size="12" font-weight="800" fill="var(--ink)">Y</text>';

    coordPoints.forEach((pt, idx) => {
      const cx = pt.x * step;
      const cy = -pt.y * step;
      content +=
        '<circle cx="' +
        cx +
        '" cy="' +
        cy +
        '" r="6" fill="' +
        (idx === 0 ? "var(--accent)" : "var(--ok)") +
        '" stroke="#fff" stroke-width="2"/>';
      content +=
        '<text x="' +
        (cx + 8) +
        '" y="' +
        (cy - 8) +
        '" font-size="12" font-weight="700" fill="var(--ink)" font-family="var(--font-mono)">' +
        esc(pt.label || `(${pt.x},${pt.y})`) +
        "</text>";
    });

    svg.innerHTML = content;
  }

  function plotCoordPoint(x, y) {
    if (!Number.isFinite(x) || !Number.isFinite(y) || Math.abs(x) > 10 || Math.abs(y) > 10) {
      return toolError(
        "tool-coord",
        ["coordX", "coordY"],
        "Enter both coordinates as numbers from −10 to 10. Decimals are allowed. The existing point stays unchanged.",
      );
    }
    toolError("tool-coord", [], "");
    const xIn = $("#coordX"),
      yIn = $("#coordY");
    if (xIn) xIn.value = x;
    if (yIn) yIn.value = y;
    coordPoints = [{ x, y, label: `P(${x}, ${y})` }];
    const position =
      x === 0 && y === 0
        ? "at the origin"
        : x === 0
          ? "on the y-axis"
          : y === 0
            ? "on the x-axis"
            : "in quadrant " + (x > 0 ? (y > 0 ? "I" : "IV") : y > 0 ? "II" : "III");
    const readout = $("#coordReadout");
    if (readout) readout.textContent = `Point: (${x}, ${y}), ${position}.`;
    renderCoordSvg();
    announce(`Plotted point at ${x}, ${y}, ${position}.`);
  }

  function reflectCoord(axis) {
    if (!coordPoints.length) return;
    const base = coordPoints[0];
    const newX = axis === "y" ? -base.x : base.x;
    const newY = axis === "x" ? -base.y : base.y;
    coordPoints.push({
      x: newX,
      y: newY,
      label: `Reflect-${axis.toUpperCase()}(${newX}, ${newY})`,
    });
    renderCoordSvg();
    toast(`Reflected point over ${axis.toUpperCase()}-axis to (${newX}, ${newY})`);
    announce(`Reflected point over ${axis.toUpperCase()} axis`);
  }

  function clearCoordPoints() {
    coordPoints = [];
    const readout = $("#coordReadout");
    if (readout) readout.textContent = "Points cleared";
    renderCoordSvg();
    toast("Coordinate points cleared");
  }

  function renderFractionStrip() {
    const num = toolNumber("fracNum"),
      den = toolNumber("fracDen");
    if (
      !Number.isInteger(num) ||
      !Number.isInteger(den) ||
      num < 0 ||
      den < 1 ||
      den > 24 ||
      num > 5 * den
    ) {
      $("#fractionStripOutput").innerHTML = "";
      return toolError(
        "tool-fraction",
        ["fracNum", "fracDen"],
        "Use whole numbers: denominator 1–24, numerator 0 to 5 × denominator. No value was changed for you.",
      );
    }
    toolError("tool-fraction", [], "");
    const pct = displayToolNumber((num / den) * 100);
    const dec = displayToolNumber(num / den);

    const totalWholes = Math.max(1, Math.ceil(num / den));
    const wholePart = Math.floor(num / den);
    const remPart = num % den;
    const mixedStr =
      num >= den ? (remPart === 0 ? String(wholePart) : wholePart + " " + remPart + "/" + den) : "";

    let barsHtml = '<div class="fraction-bars-list">';
    for (let w = 0; w < totalWholes; w++) {
      let segments = "";
      for (let i = 0; i < den; i++) {
        const globalIdx = w * den + i;
        const isShaded = globalIdx < num;
        segments +=
          '<div class="fraction-segment' +
          (isShaded ? " active" : "") +
          '">' +
          (isShaded ? "1/" + den : "") +
          "</div>";
      }
      barsHtml +=
        '<div class="fraction-bar-row">' +
        (totalWholes > 1 ? '<span class="fraction-bar-label">Whole ' + (w + 1) + "</span>" : "") +
        '<div class="fraction-strip-bar">' +
        segments +
        "</div>" +
        "</div>";
    }
    barsHtml += "</div>";

    const html =
      '<div class="fraction-strip-container">' +
      barsHtml +
      '<div class="fraction-strip-legend">' +
      "<span><b>Fraction:</b> " +
      num +
      "/" +
      den +
      (mixedStr ? " (" + mixedStr + ")" : "") +
      "</span>" +
      "<span><b>Decimal:</b> " +
      dec +
      "</span>" +
      "<span><b>Percentage:</b> " +
      pct +
      "%</span>" +
      "<span><b>Shaded:</b> " +
      num +
      " equal parts; each whole has " +
      den +
      " parts.</span>" +
      "</div></div>";

    const out = $("#fractionStripOutput");
    if (out) out.innerHTML = html;
    announce("Fraction model updated: " + num + " over " + den + ".");
  }

  /* --------------------------------- classroom diagnostics & analytics engine */
  function renderAnalyticsDashboard() {
    let grandSecure = 0,
      grandDev = 0,
      grandNot = 0;
    let lessonsCounted = 0;
    const unitStats = {};
    const priorityList = [];

    DATA.units.forEach((u) => {
      unitStats[u.number] = { title: u.title, secure: 0, dev: 0, not: 0, total: 0 };
    });

    LESSONS.forEach((l) => {
      const t = state.tracker[l.id];
      if (t && (t.secure > 0 || t.dev > 0 || t.not > 0)) {
        lessonsCounted++;
        grandSecure += t.secure;
        grandDev += t.dev;
        grandNot += t.not;
        const total = t.secure + t.dev + t.not;
        const u = unitStats[l.unitNumber];
        if (u) {
          u.secure += t.secure;
          u.dev += t.dev;
          u.not += t.not;
          u.total += total;
        }
        const struggleRate = (t.dev + t.not) / total;
        if (struggleRate >= 0.25 || t.not >= 3) {
          priorityList.push({
            id: l.id,
            title: l.title,
            standard: l.standard.code,
            strugglePct: Math.round(struggleRate * 100),
            notYet: t.not,
            dev: t.dev,
            total,
          });
        }
      }
    });

    const grandTotal = grandSecure + grandDev + grandNot;
    const readinessPct = grandTotal > 0 ? Math.round((grandSecure / grandTotal) * 100) : null;

    $("#summaryTotalChecks").textContent = lessonsCounted;
    $("#summaryReadinessPct").textContent = readinessPct != null ? readinessPct + "%" : "--%";
    $("#summaryNeedsReteach").textContent = priorityList.length;

    // Unit Breakdown
    const unitRows = DATA.units
      .map((u) => {
        const stat = unitStats[u.number];
        if (stat.total === 0) {
          return (
            '<div class="unit-readiness-row">' +
            '<div class="unit-readiness-meta"><span>Unit ' +
            u.number +
            ": " +
            esc(u.title.split(/[,&]/)[0]) +
            '</span><span style="color:var(--ink-4)">No checks recorded</span></div>' +
            '<div class="unit-bar"><div style="width:100%;background:var(--surface-sunk)"></div></div></div>'
          );
        }
        const sPct = (stat.secure / stat.total) * 100;
        const dPct = (stat.dev / stat.total) * 100;
        const nPct = (stat.not / stat.total) * 100;
        return (
          '<div class="unit-readiness-row">' +
          '<div class="unit-readiness-meta"><span>Unit ' +
          u.number +
          ": " +
          esc(u.title.split(/[,&]/)[0]) +
          "</span><b>" +
          Math.round(sPct) +
          "% Secure (" +
          stat.total +
          " students)</b></div>" +
          '<div class="unit-bar">' +
          '<div class="unit-bar-fill-secure" style="width:' +
          sPct +
          '%" title="Secure: ' +
          stat.secure +
          '"></div>' +
          '<div class="unit-bar-fill-dev" style="width:' +
          dPct +
          '%" title="Developing: ' +
          stat.dev +
          '"></div>' +
          '<div class="unit-bar-fill-notyet" style="width:' +
          nPct +
          '%" title="Not yet: ' +
          stat.not +
          '"></div>' +
          "</div></div>"
        );
      })
      .join("");
    $("#unitReadinessList").innerHTML = unitRows;

    // Priority Reteach list
    if (priorityList.length === 0) {
      $("#priorityReteachList").innerHTML =
        '<div style="font-size:13px;color:var(--ink-3);padding:14px;background:var(--surface);border-radius:var(--r-sm);border:1px dashed var(--line)">' +
        "No priority reteach flags. As you tally student whiteboard results after quick checks, lessons with &gt;25% misconception rates will appear here for spiral review.</div>";
    } else {
      priorityList.sort((a, b) => b.strugglePct - a.strugglePct);
      $("#priorityReteachList").innerHTML = priorityList
        .map(
          (item) =>
            '<div class="priority-item">' +
            '<div><div class="p-title">Lesson ' +
            item.id +
            " · " +
            esc(item.title) +
            "</div>" +
            '<div style="font-size:11.5px;color:var(--ink-3)">' +
            item.standard +
            " · " +
            item.notYet +
            " Not Yet, " +
            item.dev +
            " Developing of " +
            item.total +
            " students</div></div>" +
            '<div style="display:flex;align-items:center;gap:8px">' +
            '<span class="p-badge">' +
            item.strugglePct +
            "% Need Support</span>" +
            '<button class="btn btn-sm" type="button" data-act="project" data-id="' +
            item.id +
            '">Project</button>' +
            "</div></div>",
        )
        .join("");
    }
  }

  function exportClassroomJSON() {
    const data = {
      version: 3,
      exportedAt: new Date().toISOString(),
      saved: Array.from(state.saved),
      tracker: state.tracker,
      plan: state.plan,
      roster: state.roster,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "RevealMath-Grade6-Classroom-Data.json";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(a.href);
    toast("Exported classroom data JSON");
  }

  function exportClassroomCSV() {
    const headers = [
      "Unit",
      "Lesson",
      "Title",
      "Standard",
      "Secure",
      "Developing",
      "Not Yet",
      "Total Students",
      "Readiness Percent",
    ];
    const rows = [headers];
    LESSONS.forEach((l) => {
      const t = state.tracker[l.id] || { secure: 0, dev: 0, not: 0 };
      const total = t.secure + t.dev + t.not;
      const pct = total > 0 ? Math.round((t.secure / total) * 100) + "%" : "N/A";
      rows.push([
        l.unitNumber,
        l.id,
        '"' + l.title.replace(/"/g, '""') + '"',
        l.standard.code,
        t.secure,
        t.dev,
        t.not,
        total,
        pct,
      ]);
    });
    const csvContent = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "RevealMath-Grade6-Readiness-Report.csv";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(a.href);
    toast("Exported classroom summary CSV");
  }

  function importClassroomJSON(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        if (Array.isArray(data.saved)) {
          state.saved = new Set(data.saved.filter((id) => byId[id]));
          store.set(KEY.saved, Array.from(state.saved));
        }
        if (data.tracker && typeof data.tracker === "object") {
          state.tracker = data.tracker;
          store.set(KEY.tracker, state.tracker);
        }
        if (Array.isArray(data.plan)) {
          state.plan = data.plan;
          store.set(KEY.plan, state.plan);
        }
        if (Array.isArray(data.roster)) {
          state.roster = data.roster;
          store.set(KEY.roster, state.roster);
        }
        render();
        renderAnalyticsDashboard();
        toast("Classroom data imported successfully");
      } catch (err) {
        toast("Error reading JSON file");
      }
    };
    reader.readAsText(file);
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

  /* ------------------------------------------------- student HTML generator */
  function exportStudentHTML() {
    const studentData = {
      spine: [],
      units: DATA.units.map((u) => ({
        number: u.number,
        title: u.title,
        lessons: u.lessons.map((l) => ({
          id: l.id,
          title: l.title,
          standard: l.standard,
          skills: l.skills,
          practice: l.practice,
          quick_check: l.quick_check,
          solution: l.solution,
          variants: l.variants,
          extension: l.extension,
          vocabulary: l.vocabulary,
          frame: l.frame,
        })),
      })),
    };

    const styleContent = Array.from(document.querySelectorAll("style"))
      .map((style) => style.textContent)
      .join("\n");
    const engine = document.getElementById("fluency-studio");
    if (!engine || !engine.textContent.trim()) {
      toast("Student download is unavailable: the practice engine could not be found.");
      return;
    }
    const studioScript = engine.textContent;

    const htmlString = `<!doctype html>
<html lang="en" data-student="true" data-theme="light">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="description" content="Reveal Math Grade 6 Fluency & Practice Studio — Student Edition with interactive checking, scratchpad, and worked solutions.">
<meta name="color-scheme" content="light dark">
<title>Reveal Math · Grade 6 · Student Practice Studio</title>
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 64 64%22%3E%3Crect width=%2264%22 height=%2264%22 rx=%2213%22 fill=%22%231a56c4%22/%3E%3Ctext x=%229%22 y=%2244%22 font-family=%22Georgia,serif%22 font-size=%2234%22 fill=%22white%22%3ER6%3C/text%3E%3C/svg%3E">
<style>${styleContent}</style>
</head>
<body class="mode-student student-mode studio-mode" data-view="studio">
<header class="site-header" role="banner">
  <div class="wrap header-inner">
    <div class="brand">
      <span class="brand-badge" aria-hidden="true">R6</span>
      <span>
        <span class="brand-series">Reveal Math · McGraw Hill · Grade 6</span>
        <span class="brand-title">Student Practice Studio</span>
      </span>
    </div>
    <div class="header-actions">
      <button class="btn btn-sm" type="button" id="themeBtn" aria-pressed="false" aria-label="Toggle dark mode">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>
        <span class="label">Dark</span>
      </button>
    </div>
  </div>
</header>
<a class="skip-link" href="#main">Skip to practice</a>
<main id="main" tabindex="-1"><div class="wrap section"><div id="view-studio"></div></div></main>
<div class="sr-only" id="a11yStatus" role="status" aria-live="polite"></div>
<div id="studio-print"></div>
<footer class="site-footer" role="contentinfo">
  <div class="wrap"><div class="footer-grid"><div><p><strong>Reveal Math · Grade 6 · Student Practice Edition.</strong> Try a strategy, check the result, and explain your thinking. Work stays in this browser tab.</p></div></div></div>
</footer>
<script>window.FluencyData = ${JSON.stringify(studentData).replace(/<\/script/gi, "<\\/script")};<\/script>
<script id="fluency-studio">${studioScript}<\/script>
<script>
  const themeBtn = document.getElementById('themeBtn');
  function setTheme(t) {
    document.documentElement.setAttribute('data-theme', t);
    if (themeBtn) {
      themeBtn.querySelector('.label').textContent = t === 'dark' ? 'Light' : 'Dark';
      themeBtn.setAttribute('aria-pressed', String(t === 'dark'));
    }
  }
  setTheme('light');
  if (themeBtn) {
    themeBtn.addEventListener('click', () => {
      const cur = document.documentElement.getAttribute('data-theme') || 'light';
      setTheme(cur === 'dark' ? 'light' : 'dark');
    });
  }
  FluencyStudio.setStudentMode(true);
  FluencyStudio.render();
  window.addEventListener('hashchange', () => FluencyStudio.render());
<\/script>
</body>
</html>`;

    const blob = new Blob([htmlString], { type: "text/html;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "Reveal-Math-Grade6-Student-Edition.html";
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    toast("Downloaded Standalone Student Edition HTML");
  }

  /* -------------------------------------------------------------- actions */
  const actions = {
    "set-mode"(el) {
      setMode(el.dataset.mode);
    },
    "find-lesson"() {
      state.view = LESSON_VIEW;
      render();
      $("#toolbar").scrollIntoView({ behavior: "smooth", block: "start" });
      $("#searchInput").focus({ preventScroll: true });
    },
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
      announce("Viewing " + el.textContent);
    },
    clear() {
      state.search = "";
      state.unit = "all";
      state.domain = "all";
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
      $("#expandBtn").textContent = allOpen ? "Expand all notes" : "Collapse notes";
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
      state.domain = "all";
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
      entry[key] = Math.max(0, (entry[key] || 0) + delta);
      state.tracker[id] = entry;
      store.set(KEY.tracker, state.tracker);
      const val = el.parentElement.querySelector(".val");
      if (val) val.textContent = entry[key];
      syncProjTally(id);
    },
    "tally-reset"(el) {
      delete state.tracker[el.dataset.id];
      store.set(KEY.tracker, state.tracker);
      render();
      syncProjTally(el.dataset.id);
    },
    "proj-tally"(el) {
      const id = state.modalLesson;
      if (!id) return;
      const key = el.dataset.key;
      const delta = Number(el.dataset.delta);
      const entry = state.tracker[id] || { secure: 0, dev: 0, not: 0 };
      entry[key] = Math.max(0, (entry[key] || 0) + delta);
      state.tracker[id] = entry;
      store.set(KEY.tracker, state.tracker);
      syncProjTally(id);
      const drawerVal = document.querySelector("#drawer-" + id + " .tally." + key + " .val");
      if (drawerVal) drawerVal.textContent = entry[key];
      announce(key + " count: " + entry[key]);
    },
    "proj-tally-reset"() {
      const id = state.modalLesson;
      if (!id) return;
      delete state.tracker[id];
      store.set(KEY.tracker, state.tracker);
      syncProjTally(id);
      const drawer = document.getElementById("drawer-" + id);
      if (drawer) {
        drawer.querySelectorAll(".tally .val").forEach((v) => {
          v.textContent = "0";
        });
      }
      toast("Tally reset for Lesson " + id);
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
    "print-week-student"() {
      document.body.classList.add("print-week", "print-student");
      window.print();
    },
    "print-week-key"() {
      document.body.classList.add("print-week");
      document.body.classList.remove("print-student");
      window.print();
    },
    // Print Center modal
    "open-print"() {
      const p = $("#printBackdrop");
      if (p) {
        modalOpener = document.activeElement;

        const lSelect = $("#printLessonSelect");
        if (lSelect) {
          lSelect.innerHTML = DATA.units
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
                      '<option value="' + l.id + '">' + l.id + " · " + esc(l.title) + "</option>",
                  )
                  .join("") +
                "</optgroup>",
            )
            .join("");
          lSelect.value =
            state.modalLesson || (visibleLessons()[0] ? visibleLessons()[0].id : "2-1");
        }

        const dSelect = $("#printDrillSelect");
        if (dSelect) {
          dSelect.innerHTML = DATA.spine
            .map(
              (s) =>
                '<option value="' +
                s.rank +
                '">Spine #' +
                s.rank +
                " · " +
                esc(s.skill) +
                "</option>",
            )
            .join("");
        }

        const plSelect = $("#printPartnerLessonSelect");
        if (plSelect) {
          plSelect.innerHTML = DATA.units
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
                      '<option value="' + l.id + '">' + l.id + " · " + esc(l.title) + "</option>",
                  )
                  .join("") +
                "</optgroup>",
            )
            .join("");
          plSelect.value =
            state.modalLesson || (visibleLessons()[0] ? visibleLessons()[0].id : "2-1");
        }

        p.classList.add("open");
        $("#printModal").focus();
        announce("Print and Export Center opened");
      }
    },
    "close-print"() {
      const p = $("#printBackdrop");
      if (p) {
        p.classList.remove("open");
        if (modalOpener && modalOpener.isConnected) modalOpener.focus();
        announce("Print and Export Center closed");
      }
    },
    "print-lesson-student"() {
      const lesson =
        ($("#printLessonSelect") && $("#printLessonSelect").value) || state.modalLesson || "2-1";
      const tier = ($("#printTierSelect") && $("#printTierSelect").value) || "core";
      FluencyStudio.printWorksheet(lesson, false, tier);
    },
    "print-lesson-key"() {
      const lesson =
        ($("#printLessonSelect") && $("#printLessonSelect").value) || state.modalLesson || "2-1";
      const tier = ($("#printTierSelect") && $("#printTierSelect").value) || "core";
      FluencyStudio.printWorksheet(lesson, true, tier);
    },
    "print-unit-pack"() {
      const unitSel = $("#printUnitSelect");
      const unit = unitSel ? unitSel.value : "2";
      FluencyStudio.printUnitPack(unit, false);
    },
    "print-unit-keys"() {
      const unitSel = $("#printUnitSelect");
      const unit = unitSel ? unitSel.value : "2";
      FluencyStudio.printUnitPack(unit, true);
    },
    "print-all-drills"() {
      FluencyStudio.printAllDrills(false);
    },
    "print-all-drill-keys"() {
      FluencyStudio.printAllDrills(true);
    },
    "print-current-drill"() {
      const rank = ($("#printDrillSelect") && Number($("#printDrillSelect").value)) || 1;
      FluencyStudio.printDrill(rank, false);
    },
    "print-drill-key"() {
      const rank = ($("#printDrillSelect") && Number($("#printDrillSelect").value)) || 1;
      FluencyStudio.printDrill(rank, true);
    },
    "print-current-drill-key"() {
      const rank = ($("#printDrillSelect") && Number($("#printDrillSelect").value)) || 1;
      FluencyStudio.printDrill(rank, true);
    },
    "print-partner-student"() {
      const lesson =
        ($("#printPartnerLessonSelect") && $("#printPartnerLessonSelect").value) ||
        state.modalLesson ||
        "2-1";
      FluencyStudio.printActivity(lesson, false);
    },
    "print-partner-key"() {
      const lesson =
        ($("#printPartnerLessonSelect") && $("#printPartnerLessonSelect").value) ||
        state.modalLesson ||
        "2-1";
      FluencyStudio.printActivity(lesson, true);
    },
    "export-student-html"() {
      exportStudentHTML();
    },
    // Projector controls
    "font-size"(el) {
      state.projectorSize = el.dataset.size;
      store.set(KEY.projectorSize, state.projectorSize);
      applyProjectorSettings();
    },
    "projector-contrast"() {
      state.projectorContrast = !state.projectorContrast;
      applyProjectorSettings();
    },
    "toggle-sound"() {
      state.soundEnabled = !state.soundEnabled;
      store.set(KEY.sound, state.soundEnabled);
      applyProjectorSettings();
      toast(state.soundEnabled ? "Chime sound on" : "Chime sound muted");
    },
    "toggle-fullscreen"() {
      const modal = $("#modal");
      if (!modal) return;
      if (!document.fullscreenElement) {
        if (modal.requestFullscreen) modal.requestFullscreen();
        else if (modal.webkitRequestFullscreen) modal.webkitRequestFullscreen();
      } else {
        if (document.exitFullscreen) document.exitFullscreen();
      }
    },
    "drawer-tab"(el) {
      const lessonId = el.dataset.id;
      const tab = el.dataset.tab;
      state.drawerTabs = state.drawerTabs || {};
      state.drawerTabs[lessonId] = tab;
      const drawer = $("#drawer-" + lessonId);
      if (drawer) {
        drawer
          .querySelectorAll(".drawer-tab-btn")
          .forEach((b) => b.classList.toggle("active", b.dataset.tab === tab));
        drawer
          .querySelectorAll(".drawer-tab-pane")
          .forEach((p) => p.classList.toggle("active", p.dataset.pane === tab));
      }
    },
    "toggle-proj-tools"() {
      const drawer = $("#projectorToolsDrawer");
      const btn = $("#projMathToolsBtn");
      if (drawer) {
        const isOpen = drawer.classList.toggle("open");
        if (btn) btn.setAttribute("aria-pressed", String(isOpen));
        if (isOpen && window.updateProjectorTools) {
          window.updateProjectorTools();
        }
      }
    },
    "proj-tool-tab"(el) {
      const ptab = el.dataset.ptab;
      const drawer = $("#projectorToolsDrawer");
      if (drawer) {
        drawer
          .querySelectorAll(".projector-tool-tab")
          .forEach((b) => b.classList.toggle("active", b === el));
        drawer
          .querySelectorAll(".projector-tool-panel")
          .forEach((p) =>
            p.classList.toggle(
              "active",
              p.id === "projPanel" + ptab.charAt(0).toUpperCase() + ptab.slice(1),
            ),
          );
        if (window.FluencyStudio) {
          if (ptab === "fraction") {
            const frac = $("#projFractionStripContainer");
            const dInput = $("#projDenomInput");
            const nInput = $("#projNumInput");
            if (frac)
              FluencyStudio.renderFractionStrip(
                frac,
                nInput ? nInput.value : 3,
                dInput ? dInput.value : 4,
              );
          } else if (ptab === "ratio") {
            const ratio = $("#projRatioContainer");
            const aIn = $("#projRatioA");
            const bIn = $("#projRatioB");
            if (ratio)
              FluencyStudio.renderRatioTable(ratio, aIn ? aIn.value : 2, bIn ? bIn.value : 5);
          } else if (ptab === "coord") {
            const coord = $("#projCoordContainer");
            const xIn = $("#projCoordX");
            const yIn = $("#projCoordY");
            if (coord)
              FluencyStudio.renderCoordinatePlaneSVG(
                coord,
                xIn ? xIn.value : 3,
                yIn ? yIn.value : -4,
              );
          }
        }
      }
    },
    theme() {
      applyTheme(document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark");
    },
    help() {
      modalOpener = document.activeElement;
      $("#helpBackdrop").classList.add("open");
      $("#helpModal").focus();
    },
    "close-help"() {
      $("#helpBackdrop").classList.remove("open");
      if (modalOpener && modalOpener.isConnected) modalOpener.focus();
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
      announce(open ? "Answer revealed" : "Answer hidden");
    },

    // Domain filtering
    "filter-domain"(el) {
      state.domain = el.dataset.domain;
      render();
      announce("Filtered by domain " + state.domain);
    },

    // Speech prompt
    "speak-prompt"() {
      const promptEl = $("#modalPrompt");
      if (promptEl) speakPrompt(promptEl.textContent);
    },

    // Live annotation
    "toggle-annotation"() {
      annotating = !annotating;
      const bar = $("#annotationBar"),
        canvas = $("#projectorCanvas"),
        btn = $("#annotateBtn");
      if (bar) bar.hidden = !annotating;
      if (canvas) {
        canvas.hidden = !annotating;
        if (annotating) initProjectorCanvas();
      }
      if (btn) btn.setAttribute("aria-pressed", String(annotating));
      announce(annotating ? "On-screen annotation active" : "On-screen annotation hidden");
    },
    "pen-mode"(el) {
      penMode = el.dataset.mode;
      $$('#annotationBar [data-act="pen-mode"]').forEach((b) =>
        b.classList.toggle("active", b === el),
      );
    },
    "clear-annotation"() {
      clearProjectorCanvas();
    },

    // Cold Call
    "open-coldcall"() {
      modalOpener = document.activeElement;
      $("#coldCallBackdrop").classList.add("open");
      $("#coldCallModal").focus();
      renderRosterUI();
      announce("Cold call picker opened");
    },
    "close-coldcall"() {
      $("#coldCallBackdrop").classList.remove("open");
      if (modalOpener && modalOpener.isConnected) modalOpener.focus();
    },
    "spin-coldcall"() {
      spinColdCall();
    },
    "toggle-roster-edit"() {
      const box = $("#rosterEditBox");
      if (box) box.hidden = !box.hidden;
    },
    "save-roster"() {
      const input = $("#rosterInput");
      if (!input) return;
      const names = input.value
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean);
      if (names.length) {
        state.roster = names;
        store.set(KEY.roster, state.roster);
        toast("Roster saved (" + names.length + " entries)");
        $("#rosterEditBox").hidden = true;
      } else {
        toast("Please enter at least one name");
      }
    },
    "roster-preset"(el) {
      const preset = el.dataset.preset;
      if (preset === "tables") {
        state.roster = ["Table 1", "Table 2", "Table 3", "Table 4", "Table 5", "Table 6"];
      } else if (preset === "pairs") {
        state.roster = [
          "Partner Pair A",
          "Partner Pair B",
          "Partner Pair C",
          "Partner Pair D",
          "Partner Pair E",
          "Partner Pair F",
        ];
      } else if (preset === "teams") {
        state.roster = ["Team Alpha", "Team Beta", "Team Gamma", "Team Delta"];
      }
      pickedColdCall.clear();
      store.set(KEY.roster, state.roster);
      renderRosterUI();
      toast("Applied " + preset + " preset (" + state.roster.length + " entries)");
    },
    "glossary-letter"(el) {
      const letter = el.dataset.letter;
      $$(".az-btn").forEach((b) => b.classList.toggle("active", b === el));
      $$(".gloss-item").forEach((item) => {
        item.hidden = letter !== "ALL" && item.dataset.letter !== letter;
      });
      announce(
        letter === "ALL" ? "Showing all glossary terms" : "Showing terms starting with " + letter,
      );
    },

    // Virtual Math Tools
    "open-tools"() {
      modalOpener = document.activeElement;
      $("#toolsBackdrop").classList.add("open");
      $("#toolsModal").focus();
      initTools();
      announce("Virtual Math Tools opened");
    },
    "close-tools"() {
      $("#toolsBackdrop").classList.remove("open");
      if (modalOpener && modalOpener.isConnected) modalOpener.focus();
    },
    "tool-tab"(el) {
      switchToolTab(el.dataset.tab);
    },
    "calc-ratio"() {
      calcRatioTable();
    },
    "plot-point"() {
      const x = toolNumber("coordX");
      const y = toolNumber("coordY");
      plotCoordPoint(x, y);
    },
    "reflect-x"() {
      reflectCoord("x");
    },
    "reflect-y"() {
      reflectCoord("y");
    },
    "clear-points"() {
      clearCoordPoints();
    },
    "render-strip"() {
      renderFractionStrip();
    },

    // Analytics Dashboard
    "open-analytics"() {
      modalOpener = document.activeElement;
      $("#analyticsBackdrop").classList.add("open");
      $("#analyticsModal").focus();
      renderAnalyticsDashboard();
      announce("Classroom Readiness Dashboard opened");
    },
    "close-analytics"() {
      $("#analyticsBackdrop").classList.remove("open");
      if (modalOpener && modalOpener.isConnected) modalOpener.focus();
    },
    "export-data-json"() {
      exportClassroomJSON();
    },
    "export-data-csv"() {
      exportClassroomCSV();
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
  });

  document.addEventListener("input", (event) => {
    if (event.target.id === "searchInput") {
      state.search = event.target.value;
      $("#searchClear").style.display = state.search ? "block" : "none";
      render();
    }
  });

  window.addEventListener("afterprint", () => {
    document.body.classList.remove("print-week", "print-student");
  });

  window.addEventListener("hashchange", () => {
    suppressHash = true;
    if (readHash()) setMode(state.mode);
    suppressHash = false;
    writeHash();
  });

  // W3C Tablist keyboard navigation
  const tablist = $("#viewTablist");
  if (tablist) {
    tablist.addEventListener("keydown", (e) => {
      const tabs = $$(".viewtab", tablist).filter(
        (tab) =>
          !tab.hidden &&
          tab.getClientRects().length &&
          getComputedStyle(tab).visibility !== "hidden",
      );
      const idx = tabs.indexOf(document.activeElement);
      if (idx === -1) return;

      let nextIdx = -1;
      if (e.key === "ArrowRight" || e.key === "ArrowDown") {
        nextIdx = (idx + 1) % tabs.length;
      } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        nextIdx = (idx - 1 + tabs.length) % tabs.length;
      } else if (e.key === "Home") {
        nextIdx = 0;
      } else if (e.key === "End") {
        nextIdx = tabs.length - 1;
      }

      if (nextIdx !== -1) {
        e.preventDefault();
        tabs[nextIdx].focus();
        tabs[nextIdx].click();
      }
    });
  }

  const toolsTablist = $("#toolsModal .tools-tablist");
  if (toolsTablist)
    toolsTablist.addEventListener("keydown", (event) => {
      const tabs = Array.from(toolsTablist.querySelectorAll('[role="tab"]'));
      const current = tabs.indexOf(document.activeElement);
      if (current < 0) return;
      let next = current;
      if (event.key === "ArrowRight") next = (current + 1) % tabs.length;
      else if (event.key === "ArrowLeft") next = (current + tabs.length - 1) % tabs.length;
      else if (event.key === "Home") next = 0;
      else if (event.key === "End") next = tabs.length - 1;
      else return;
      event.preventDefault();
      tabs[next].focus();
      tabs[next].click();
    });

  // Track active input for On-Screen Math Keypad
  let lastActiveInput = null;
  document.addEventListener("focusin", (e) => {
    if (e.target && (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA")) {
      if (!e.target.closest("#toolsModal") && !e.target.closest("#coldCallModal")) {
        lastActiveInput = e.target;
      }
    }
  });

  // On-screen math keypad click dispatcher
  document.addEventListener("click", (e) => {
    const keyBtn = e.target.closest(".key-btn");
    if (!keyBtn) return;
    const key = keyBtn.dataset.key;
    let target = lastActiveInput;
    if (!target || !target.isConnected) {
      target = document.querySelector('textarea:not([hidden]), input[type="text"]:not([hidden])');
    }
    if (!target) {
      toast("Selected " + key + " (focus a response box to type directly)");
      return;
    }
    const start = target.selectionStart ?? target.value.length;
    const end = target.selectionEnd ?? target.value.length;
    const val = target.value;
    if (key === "del") {
      if (start === end && start > 0) {
        target.value = val.slice(0, start - 1) + val.slice(end);
        target.selectionStart = target.selectionEnd = start - 1;
      } else if (start !== end) {
        target.value = val.slice(0, start) + val.slice(end);
        target.selectionStart = target.selectionEnd = start;
      }
    } else {
      let insert = key;
      if (key === "pm") insert = "±";
      else if (key === "^2") insert = "²";
      else if (key === "*") insert = "×";
      else if (key === "/") insert = "/";
      target.value = val.slice(0, start) + insert + val.slice(end);
      target.selectionStart = target.selectionEnd = start + insert.length;
    }
    target.dispatchEvent(new Event("input", { bubbles: true }));
  });

  // Interactive Coordinate Plane SVG click plotting
  const coordSvg = $("#coordSvg");
  if (coordSvg) {
    coordSvg.addEventListener("click", (e) => {
      const rect = coordSvg.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;
      // SVG viewBox is -240 -240 480 480
      const viewBoxX = (clickX / rect.width) * 480 - 240;
      const viewBoxY = (clickY / rect.height) * 480 - 240;
      const gridX = Math.round(viewBoxX / 20);
      const gridY = Math.round(-viewBoxY / 20);
      plotCoordPoint(gridX, gridY);
    });
  }

  // Keyboard navigation & modal focus trapping
  document.addEventListener("keydown", (event) => {
    const modalOpen = $("#backdrop").classList.contains("open");
    const helpOpen = $("#helpBackdrop").classList.contains("open");
    const printOpen = $("#printBackdrop").classList.contains("open");
    const toolsOpen = $("#toolsBackdrop") && $("#toolsBackdrop").classList.contains("open");
    const analyticsOpen =
      $("#analyticsBackdrop") && $("#analyticsBackdrop").classList.contains("open");
    const coldCallOpen =
      $("#coldCallBackdrop") && $("#coldCallBackdrop").classList.contains("open");

    const openBackdrops = $$(".backdrop.open");
    const topBackdrop = openBackdrops[openBackdrops.length - 1];
    const activeModal = topBackdrop ? topBackdrop.querySelector('[role="dialog"]') : null;

    const typing =
      /^(INPUT|TEXTAREA|SELECT)$/.test(event.target.tagName) || event.target.isContentEditable;
    const onControl = !!event.target.closest("button, a, summary, [role=tab], [role=slider]");

    if (event.key === "Escape" && activeModal) {
      event.preventDefault();
      const closeAction = {
        modal: "close-modal",
        helpModal: "close-help",
        printModal: "close-print",
        toolsModal: "close-tools",
        analyticsModal: "close-analytics",
        coldCallModal: "close-coldcall",
      }[activeModal.id];
      if (closeAction) actions[closeAction]();
      return;
    }

    if (activeModal) {
      if (event.key === "Tab") {
        const focusable = $$("button, a[href], select, input, textarea", activeModal).filter(
          (el) => !el.disabled && el.getClientRects().length,
        );
        if (!focusable.length) {
          event.preventDefault();
          activeModal.focus();
          return;
        }
        const first = focusable[0],
          last = focusable[focusable.length - 1];
        if (
          event.shiftKey &&
          (document.activeElement === first ||
            document.activeElement === activeModal ||
            !activeModal.contains(document.activeElement))
        ) {
          event.preventDefault();
          last.focus();
        } else if (
          !event.shiftKey &&
          (document.activeElement === last || !activeModal.contains(document.activeElement))
        ) {
          event.preventDefault();
          first.focus();
        }
        return;
      }

      if (
        activeModal.id === "modal" &&
        !typing &&
        !onControl &&
        !event.ctrlKey &&
        !event.metaKey &&
        !event.altKey &&
        !event.repeat
      ) {
        if (event.code === "Space") {
          event.preventDefault();
          actions.timer();
        } else if (event.key.toLowerCase() === "r") actions["timer-reset"]();
        else if (event.key.toLowerCase() === "s") actions.reveal();
        else if (event.key.toLowerCase() === "f") actions["toggle-fullscreen"]();
        else if (event.key.toLowerCase() === "a") actions["toggle-annotation"]();
        else if (event.key === "ArrowLeft") stepModal(-1);
        else if (event.key === "ArrowRight") stepModal(1);
        else if (event.key === "1" || event.key === "2" || event.key === "3") {
          const formLetters = ["A", "B", "C"];
          const targetForm = formLetters[Number(event.key) - 1];
          const lesson = byId[state.modalLesson];
          if (lesson && lesson.forms.some((f) => f.form === targetForm)) {
            state.form = targetForm;
            store.set(KEY.form, state.form);
            openModal(state.modalLesson);
          }
        }
        return;
      }
    }

    if (
      activeModal ||
      typing ||
      onControl ||
      event.ctrlKey ||
      event.metaKey ||
      event.altKey ||
      event.repeat
    )
      return;
    if (event.key === "/" && $("#searchInput").getClientRects().length) {
      event.preventDefault();
      $("#searchInput").focus();
    } else if (event.key === "?") {
      event.preventDefault();
      actions.help();
    } else if (event.key.toLowerCase() === "x") actions["open-tools"]();
    else if (event.key.toLowerCase() === "t") actions.theme();
    else if (event.key.toLowerCase() === "m")
      setMode(state.mode === "student" ? "teacher" : "student");
  });

  $("#backdrop").addEventListener("click", (e) => {
    if (e.target.id === "backdrop") closeModal();
  });
  $("#helpBackdrop").addEventListener("click", (e) => {
    if (e.target.id === "helpBackdrop") actions["close-help"]();
  });
  $("#printBackdrop").addEventListener("click", (e) => {
    if (e.target.id === "printBackdrop") actions["close-print"]();
  });
  const tb = $("#toolsBackdrop");
  if (tb)
    tb.addEventListener("click", (e) => {
      if (e.target.id === "toolsBackdrop") actions["close-tools"]();
    });
  const ab = $("#analyticsBackdrop");
  if (ab)
    ab.addEventListener("click", (e) => {
      if (e.target.id === "analyticsBackdrop") actions["close-analytics"]();
    });
  const cb = $("#coldCallBackdrop");
  if (cb)
    cb.addEventListener("click", (e) => {
      if (e.target.id === "coldCallBackdrop") actions["close-coldcall"]();
    });

  const importInput = $("#importDataInput");
  if (importInput) {
    importInput.addEventListener("change", (e) => {
      if (e.target.files && e.target.files[0]) {
        importClassroomJSON(e.target.files[0]);
        e.target.value = "";
      }
    });
  }

  /* ------------------------------------------------------ self-test suite */
  function selfTest() {
    const report = {
      passed: true,
      totalLessons: LESSONS.length,
      prerequisites: LESSONS.reduce((n, l) => n + l.skills.length, 0),
      spineSkills: DATA.spine.length,
      units: DATA.units.length,
      mathParserTests: [],
    };

    // Math parser validation tests
    const testCases = [
      ["3.75", 3.75],
      ["$15.50", 15.5],
      ["2 1/2", 2.5],
      ["3/4", 0.75],
      ["75%", 0.75],
      ["-3", -3],
      ["–3", -3],
      ["1,250", 1250],
      ["3:4", 0.75],
      ["5 miles", 5],
      ["12 cm", 12],
    ];

    testCases.forEach(([input, expected]) => {
      const parsed = FluencyStudio.parseNumber(input);
      const ok = Math.abs(parsed - expected) < 1e-6;
      report.mathParserTests.push({ input, expected, parsed, ok });
      if (!ok) report.passed = false;
    });

    if (report.totalLessons !== 54) report.passed = false;
    if (report.spineSkills !== 12) report.passed = false;

    console.log(
      report.passed
        ? "✓ Self-test passed: 54 lessons, 216 foundation exercises, 12 spine skills, parser verified."
        : "✗ Self-test detected inconsistencies.",
      report,
    );
    return report;
  }

  /* --------------------------------- classroom command bar */
  function initCommandBar() {
    const sel = $("#cmdLessonSelect");
    if (!sel) return;

    sel.innerHTML = DATA.units
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
                '<option value="' + l.id + '">Lesson ' + l.id + ": " + esc(l.title) + "</option>",
            )
            .join("") +
          "</optgroup>",
      )
      .join("");

    let pinnedId = null;
    try {
      pinnedId = localStorage.getItem("rmg6.pinnedLesson");
    } catch (_) {}
    if (pinnedId && byId[pinnedId]) {
      sel.value = pinnedId;
    }

    const pinBtn = $("#cmdPinBtn");
    function updatePinUI(isPinned) {
      if (!pinBtn) return;
      pinBtn.classList.toggle("pinned", isPinned);
      pinBtn.textContent = isPinned ? "📌 Pinned" : "📌 Pin";
    }

    updatePinUI(pinnedId && sel.value === pinnedId);

    sel.addEventListener("change", () => {
      updatePinUI(pinnedId && sel.value === pinnedId);
    });

    if (pinBtn) {
      pinBtn.addEventListener("click", () => {
        const cur = sel.value;
        if (pinnedId === cur) {
          pinnedId = null;
          try {
            localStorage.removeItem("rmg6.pinnedLesson");
          } catch (_) {}
          updatePinUI(false);
          toast("Unpinned lesson");
        } else {
          pinnedId = cur;
          try {
            localStorage.setItem("rmg6.pinnedLesson", cur);
          } catch (_) {}
          updatePinUI(true);
          toast("Pinned Lesson " + cur + " as today's focus");
        }
      });
    }

    const projBtn = $("#cmdLaunchProjector");
    if (projBtn) projBtn.addEventListener("click", () => openModal(sel.value));

    const checkBtn = $("#cmdPrintStudentCheck");
    if (checkBtn)
      checkBtn.addEventListener("click", () => {
        FluencyStudio.printWorksheet(sel.value, false, "core");
      });

    const keyBtn = $("#cmdPrintTeacherKey");
    if (keyBtn)
      keyBtn.addEventListener("click", () => {
        FluencyStudio.printWorksheet(sel.value, true, "core");
      });

    const coldCallBtn = $("#cmdLaunchColdCall");
    if (coldCallBtn) coldCallBtn.addEventListener("click", () => actions["open-coldcall"]());

    const toolsBtn = $("#cmdOpenMathTools");
    if (toolsBtn) toolsBtn.addEventListener("click", () => actions["open-tools"]());
  }

  function initProjectorMathTools() {
    const toolsDrawer = $("#projectorToolsDrawer");
    if (!toolsDrawer) return;

    const fracContainer = $("#projFractionStripContainer");
    const ratioContainer = $("#projRatioContainer");
    const coordContainer = $("#projCoordContainer");

    function updateProjectorTools() {
      if (window.FluencyStudio) {
        if (fracContainer && !fracContainer.dataset.init) {
          const dInput = $("#projDenomInput");
          const nInput = $("#projNumInput");
          FluencyStudio.renderFractionStrip(
            fracContainer,
            nInput ? nInput.value : 3,
            dInput ? dInput.value : 4,
          );
          if (dInput && nInput) {
            const upd = () =>
              FluencyStudio.renderFractionStrip(fracContainer, nInput.value, dInput.value);
            dInput.oninput = upd;
            nInput.oninput = upd;
          }
          fracContainer.dataset.init = "true";
        }
        if (ratioContainer && !ratioContainer.dataset.init) {
          const aIn = $("#projRatioA");
          const bIn = $("#projRatioB");
          FluencyStudio.renderRatioTable(ratioContainer, aIn ? aIn.value : 2, bIn ? bIn.value : 5);
          const genBtn = $("#projGenRatioBtn");
          if (genBtn && aIn && bIn) {
            genBtn.onclick = () =>
              FluencyStudio.renderRatioTable(ratioContainer, aIn.value, bIn.value);
          }
          ratioContainer.dataset.init = "true";
        }
        if (coordContainer && !coordContainer.dataset.init) {
          const xIn = $("#projCoordX");
          const yIn = $("#projCoordY");
          FluencyStudio.renderCoordinatePlaneSVG(coordContainer, 3, -4);
          const plotBtn = $("#projPlotBtn");
          if (plotBtn && xIn && yIn) {
            plotBtn.onclick = () =>
              FluencyStudio.renderCoordinatePlaneSVG(coordContainer, xIn.value, yIn.value);
          }
          coordContainer.dataset.init = "true";
        }
      }
    }

    window.updateProjectorTools = updateProjectorTools;

    toolsDrawer.querySelectorAll(".projector-tool-tab").forEach((tabBtn) => {
      tabBtn.addEventListener("click", () => {
        const ptab = tabBtn.dataset.ptab;
        toolsDrawer
          .querySelectorAll(".projector-tool-tab")
          .forEach((b) => b.classList.toggle("active", b === tabBtn));
        toolsDrawer
          .querySelectorAll(".projector-tool-panel")
          .forEach((p) =>
            p.classList.toggle(
              "active",
              p.id === "projPanel" + ptab.charAt(0).toUpperCase() + ptab.slice(1),
            ),
          );
        updateProjectorTools();
      });
    });
  }

  /* ----------------------------------------------------------------- boot */
  function boot() {
    const savedTheme = store.get(KEY.theme, null);
    applyTheme(
      savedTheme ||
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

    initCommandBar();
    initProjectorMathTools();

    measureStack();
    window.addEventListener("resize", measureStack, { passive: true });
    if (window.ResizeObserver) {
      const ro = new ResizeObserver(measureStack);
      ro.observe($(".site-header"));
      ro.observe($(".viewbar"));
    }

    readHash();
    setMode(state.mode);
    updateTimer();
    selfTest();
  }

  window.RevealMathApp = {
    selfTest,
    getState: () => state,
    setMode,
  };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
