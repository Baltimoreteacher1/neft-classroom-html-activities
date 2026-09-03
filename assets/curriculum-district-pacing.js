(function () {
  "use strict";
  const crosswalk = [
    {
      sequence: 1,
      quarter: "Q1",
      district_title: "Pre Unit: Course 1 Pre Unit",
      eduwonderlab_unit: "Unit 0 & Unit 1 + Computation Launch Pad",
      additional_days: 1.0,
      assessments: ["Unit Quiz (9/9/26)", "iReady Placement Window"],
      /* THE PRE-UNIT IS ASSEMBLED, and its membership lives in exactly one
       * place: data/pacing-unit-lessons.json. This crosswalk used to carry its
       * own nine-lesson version (1-1 … 1-6 plus 2-6, 2-7, 2-11, 2-12) while the
       * Teach picker on this same page derived a different one — two Pre-Units
       * on one screen, neither aware of the other.
       *
       * Titles and standards for these five are copied from the curriculum
       * manifest and PINNED to it by validate:pacing-unit-order, so they cannot
       * go stale the way the previous ones had: 2-6 read "Divide
       * Multi-Digit Whole Numbers (Computation Bridge)" against a manifest that
       * says "Divide Multi-Digit Numbers Using an Algorithm", and carried the
       * 2010 code 6.NS.B.2 against a registry re-coded to 6.NOS.2. The other ten
       * units below still hold uncorrected inline copies; that is a known,
       * separate debt, not something this change quietly fixed. */
      lessons: [{ id: "1-1" }, { id: "2-6" }, { id: "2-7" }, { id: "6-1" }, { id: "6-2" }],
      /* The culminating project sits AFTER 6-2 and is not a lesson, so it is
       * not in the `lessons` array — validate:pacing-unit-order pins that array
       * to data/pacing-unit-lessons.json, and a non-lesson id in it would make
       * the Pre-Unit's membership disagree with itself again. It renders as a
       * trailing entry in the Teach picker instead. It consumes the Pre-Unit's
       * existing `additional_days: 1.0`, so no later unit's dates move. */
      project: { path: "/math/pre-unit/projects/", title: "Pre-Unit Culminating Project" },
    },
    {
      sequence: 2,
      quarter: "Q1",
      district_title: "Unit 3: Ratios & Rates",
      eduwonderlab_unit: "Unit 3: Ratios & Rates",
      additional_days: 2.0,
      assessments: ["Unit Assessment (10/9/26)", "iReady Progress Monitor", "MSTAR Math Task"],
      lessons: [
        { id: "3-1" },
        { id: "3-2" },
        { id: "3-3" },
        { id: "3-4" },
        { id: "3-5" },
        { id: "3-6" },
        { id: "3-7" },
      ],
    },
    {
      sequence: 3,
      quarter: "Q1",
      district_title: "Unit 4: Understand and Use Percentages",
      eduwonderlab_unit: "Unit 4: Percents",
      additional_days: 2.0,
      assessments: ["Unit Assessment (11/5/26)", "MSTAR Math Task"],
      lessons: [{ id: "4-1" }, { id: "4-2" }, { id: "4-3" }, { id: "4-4" }, { id: "4-5" }],
    },
    {
      sequence: 4,
      quarter: "Q2",
      district_title: "Unit 6: Numerical and Algebraic Expressions",
      eduwonderlab_unit: "Unit 6: Expressions",
      additional_days: 2.0,
      assessments: ["Unit Assessment (12/8/26)", "MSTAR Math Task"],
      lessons: [
        { id: "6-1" },
        { id: "6-2" },
        { id: "6-3" },
        { id: "6-4" },
        { id: "6-5" },
        { id: "6-6" },
        { id: "6-7" },
        { id: "6-8" },
      ],
    },
    {
      sequence: 5,
      quarter: "Q3",
      district_title: "Unit 7: Integers, Rational Numbers, and the Coordinate Plane",
      eduwonderlab_unit: "Unit 7: Integers & Coordinate Plane",
      additional_days: 2.0,
      assessments: ["Unit Assessment (1/21/27)", "iReady Window", "MSTAR Math Task"],
      lessons: [
        { id: "7-1" },
        { id: "7-2" },
        { id: "7-3" },
        { id: "7-4" },
        { id: "7-5" },
        { id: "7-6" },
        { id: "7-7" },
      ],
    },
    {
      sequence: 6,
      quarter: "Q3",
      district_title: "Unit 8: Equations & Inequalities",
      eduwonderlab_unit: "Unit 8: Equations & Inequalities",
      additional_days: 2.0,
      assessments: ["Unit Assessment (2/22/27)", "iReady Window", "MSTAR Math Task"],
      lessons: [{ id: "8-1" }, { id: "8-2" }, { id: "8-3" }, { id: "8-4" }, { id: "8-5" }],
    },
    {
      sequence: 7,
      quarter: "Q3",
      district_title: "Unit 9: Relationships Between Two Variables",
      eduwonderlab_unit: "Unit 9: Two-Variable Relationships",
      additional_days: 2.0,
      assessments: ["Unit Assessment (3/17/27)", "MSTAR Math Task"],
      lessons: [{ id: "9-1" }, { id: "9-2" }, { id: "9-3" }, { id: "9-4" }],
    },
    {
      sequence: 8,
      quarter: "Q4",
      district_title: "Unit 5: Solve Area, Surface Area, and Volume Problems",
      eduwonderlab_unit: "Unit 5: Area, Surface Area & Volume",
      additional_days: 1.0,
      assessments: ["Unit Assessment (4/21/27)", "MSTAR Math Task"],
      lessons: [
        { id: "5-1" },
        { id: "5-2" },
        { id: "5-3" },
        { id: "5-4" },
        { id: "5-5" },
        { id: "5-6" },
        { id: "5-7" },
        { id: "5-8" },
      ],
    },
    {
      sequence: 9,
      quarter: "Q4",
      district_title: "Unit 2: Understanding the World Around Us Through Statistics",
      eduwonderlab_unit: "Unit 2: Statistics (Data Displays & Variation)",
      additional_days: 1.0,
      assessments: ["Unit Assessment (5/17/27)", "MSTAR Review Tasks"],
      lessons: [
        { id: "2-1" },
        { id: "2-2" },
        { id: "2-3" },
        { id: "2-4" },
        { id: "2-5" },
        { id: "2-8" },
        { id: "2-9" },
        { id: "2-10" },
      ],
    },
    {
      sequence: 10,
      quarter: "Q4",
      district_title: "MSTAR Preparation & Take MSTAR",
      eduwonderlab_unit: "MSTAR Prep / Arcade Blitz / Command Center",
      additional_days: 0.0,
      assessments: ["State MSTAR Math Blueprint Testing"],
      lessons: [
        {
          id: "MSTAR-1",
          title: "MSTAR Domain Blitz: Ratios & Expressions",
          standards: ["6.RP", "6.EE"],
        },
        {
          id: "MSTAR-2",
          title: "MSTAR Domain Blitz: Number System & Geometry",
          standards: ["6.NS", "6.G"],
        },
        {
          id: "MSTAR-3",
          title: "MSTAR Practice Performance Tasks",
          standards: ["6.SP", "6.RP", "6.EE"],
        },
      ],
    },
    {
      sequence: 11,
      quarter: "Q4",
      district_title: "Unit 10: Math Is...",
      eduwonderlab_unit: "Unit 10: Reflection & EOY Showcase",
      additional_days: 0.0,
      assessments: ["EOY Student Portfolio & Project Showcase"],
      lessons: [{ id: "10-1" }, { id: "10-2" }],
    },
  ];

  /**
   * Stamp canonical unit dates onto the crosswalk before anything reads
   * `NTDistrictPacing.today()`. The payload is generated by the pacing
   * importer (same run as `data/pacing-unit-ranges.json`) and loaded by a
   * blocking script tag. Fetch-reconcile below still overlays the JSON file,
   * so a stale generated copy cannot survive a fresh ranges fetch — and a
   * failed fetch cannot fall back to a second hand-typed calendar, because
   * there isn't one.
   */
  function applyGeneratedDates() {
    const dates = window.__NT_PACING_DATES;
    if (!dates) return;
    crosswalk.forEach(function (item) {
      const live = dates[item.sequence] || dates[String(item.sequence)];
      if (!live || !live.start_date || !live.end_date) return;
      item.start_date = live.start_date;
      item.end_date = live.end_date;
      item.instructional_days = live.instructional_days;
    });
  }
  /**
   * The sequence dropdown used to carry its own dates, typed into the option
   * text in curriculum/index.html: "Seq 2: Unit 3: Ratios & Rates (9/14/26 -
   * 10/19/26)". That is the second authored calendar this file was already
   * cleaned of — pacing-date-parity.test.mjs forbids one in the crosswalk after
   * the hub's hand-typed copy drifted 27 days on Unit 7 — except it survived in
   * label form, where a JS-source check cannot see it. So the console SHOWED
   * 9/14 while getActiveDistrictSeq() ACTED on 9/9: same record, two calendars.
   *
   * Labels are now printed from the same item the behaviour reads, so they
   * cannot disagree by construction, and they follow a live pacing change out
   * of the planner instead of staying frozen at import time.
   */
  function syncSeqLabels() {
    // Printing a label must never be able to break the console. This runs ahead
    // of `window.getActiveDistrictSeq` being published, so an exception here
    // would leave the pacing API undefined and take the whole panel with it —
    // for a cosmetic date string. A missing label is survivable; a missing
    // getActiveDistrictSeq() is not.
    try {
      syncSeqLabelsUnsafe();
    } catch (_) {
      /* labels stay as they are; the pacing API still publishes */
    }
  }

  function syncSeqLabelsUnsafe() {
    const select = document.getElementById("district-seq-select");
    if (!select) return;
    crosswalk.forEach(function (item) {
      const opt = select.querySelector('option[value="' + item.sequence + '"]');
      if (!opt || !item.start_date || !item.end_date) return;
      // Strip any trailing "(…)" first so repeated calls stay idempotent.
      const name = opt.textContent
        .replace(/\s+/g, " ")
        .trim()
        .replace(/\s*\([^()]*\)\s*$/, "");
      opt.textContent = name + " (" + item.start_date + " - " + item.end_date + ")";
    });
  }

  applyGeneratedDates();
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", syncSeqLabels);
  } else {
    syncSeqLabels();
  }

  window.getActiveDistrictSeq = function () {
    const select = document.getElementById("district-seq-select");
    const seqVal = select ? select.value : "1";
    return crosswalk.find((x) => x.sequence == seqVal) || crosswalk[0];
  };

  /* ---------------------------------------------------------- pacing clock */

  /**
   * Parse the crosswalk's `M/D/YY` dates as LOCAL midnight. `new Date("8/24/26")`
   * is engine-dependent and `new Date("2026-08-24")` parses as UTC — either one
   * lands a teacher on the wrong sequence for a day at each boundary.
   */
  function parseSeqDate(text) {
    const bits = String(text || "").split("/");
    if (bits.length !== 3) return null;
    const month = Number(bits[0]);
    const day = Number(bits[1]);
    let year = Number(bits[2]);
    if (!month || !day || Number.isNaN(year)) return null;
    if (year < 100) year += 2000;
    return new Date(year, month - 1, day);
  }

  function atMidnight(date) {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
  }

  /**
   * The district sequence a given date falls in. Dates inside a window return
   * that window. Dates in a GAP between windows (breaks, testing weeks) return
   * the sequence that starts next, because that is what a teacher is planning
   * toward. Before the year starts → sequence 1; after it ends → the last one.
   */
  function seqForDate(when) {
    const day = atMidnight(when instanceof Date ? when : new Date());
    let upcoming = null;
    for (const item of crosswalk) {
      const start = parseSeqDate(item.start_date);
      const end = parseSeqDate(item.end_date);
      if (!start || !end) continue;
      if (day >= start && day <= end) return item;
      if (day < start && (!upcoming || start < parseSeqDate(upcoming.start_date))) upcoming = item;
    }
    return upcoming || crosswalk[crosswalk.length - 1];
  }

  /**
   * The shared pacing API. The Teacher Command Center reads this so the hub has
   * ONE answer to "where is the district right now" instead of two surfaces
   * disagreeing — the cockpit used to open on lesson 1-1 all year.
   */
  window.NTDistrictPacing = {
    crosswalk: crosswalk,
    seqForDate: seqForDate,
    /** The sequence covering today. */
    today: function () {
      return seqForDate(new Date());
    },
    /** The sequence the teacher currently has selected in the pacing console. */
    active: function () {
      return window.getActiveDistrictSeq();
    },
    /** Lesson ids for a sequence, in district order. */
    lessonIds: function (item) {
      return ((item && item.lessons) || []).map(function (lesson) {
        return lesson.id;
      });
    },
    label: function (item) {
      if (!item) return "";
      return `${item.quarter} · Seq ${item.sequence} · ${item.district_title}`;
    },
  };

  window.onDistrictSeqChange = function (seqVal) {
    const item = crosswalk.find((x) => x.sequence == seqVal);
    const lessonSelect = document.getElementById("district-lesson-select");
    if (!item || !lessonSelect) return;

    lessonSelect.innerHTML = "";

    const groupActions = document.createElement("optgroup");
    groupActions.label =
      "⚡ Quick Unit Planning Actions (Synced to " + item.quarter + " Seq " + item.sequence + ")";
    groupActions.innerHTML = `
      <option value="launch_first">🚀 Launch First Lesson of Unit (${item.lessons[0] ? item.lessons[0].id : ""})</option>
      <option value="build_week">📺 Build the Week's Class Board Display (Seq ${item.sequence})</option>
      <option value="playlist">🎵 Tiered Student Playlist (Seq ${item.sequence})</option>
      <option value="unit_map">🗺️ Unit Scope & Prerequisites Map</option>
      <option value="groups">👥 Studio Small-Group Rotation Console</option>
      <option value="scorm">🎓 Download Canvas SCORM Package for Sequence ${item.sequence}</option>
    `;
    lessonSelect.appendChild(groupActions);

    const groupLessons = document.createElement("optgroup");
    groupLessons.label = "📖 Lessons & Synced Small-Group Pathways (District Sequence)";

    item.lessons.forEach((l) => {
      // Parent Interactive Lesson
      const optMain = document.createElement("option");
      optMain.value = `lesson_${l.id}`;
      /* Defensive: a lesson the manifest cannot resolve still renders as its
       * id rather than "undefined [". */
      const stds =
        Array.isArray(l.standards) && l.standards.length ? ` [${l.standards.join(", ")}]` : "";
      optMain.textContent = `Lesson ${l.id}${l.title ? `: ${l.title}` : ""}${stds}`;
      groupLessons.appendChild(optMain);

      // Synced Group 1 (Support / Level 1)
      const optG1 = document.createElement("option");
      optG1.value = `sg1_${l.id}`;
      optG1.textContent = `    ↳ 💡 Lesson ${l.id} Group 1 (Level 1 Support Pathway)`;
      groupLessons.appendChild(optG1);

      // Synced Group 2 (Enrichment / Level 2)
      const optG2 = document.createElement("option");
      optG2.value = `sg2_${l.id}`;
      optG2.textContent = `    ↳ 🚀 Lesson ${l.id} Group 2 (Level 2 Enrichment Pathway)`;
      groupLessons.appendChild(optG2);

      // The bridge practice set, under the later of the two lessons it bridges.
      if (l.bridge) {
        const optBridge = document.createElement("option");
        optBridge.value = `bridge_${l.bridge.id}`;
        optBridge.textContent = `    ↳ 🧮 ${l.bridge.title} (Combined Practice)`;
        groupLessons.appendChild(optBridge);
      }

      // The band review, under the lesson it reviews up to.
      if (l.catchUp) {
        const optCatchUp = document.createElement("option");
        optCatchUp.value = `catchup_${l.catchUp.id}`;
        optCatchUp.textContent = `    ↳ 🔁 ${l.catchUp.title} (Review & Catch-Up)`;
        groupLessons.appendChild(optCatchUp);
      }
    });

    /* The culminating project closes the unit, so it renders last — after the
     * final lesson, never between lessons. */
    if (item.project && item.project.path) {
      const optProject = document.createElement("option");
      optProject.value = "project";
      optProject.textContent = `🏆 ${item.project.title}`;
      groupLessons.appendChild(optProject);
    }
    lessonSelect.appendChild(groupLessons);
  };

  // The four teacher-workspace actions navigate IN THIS TAB.
  //
  // They used to `window.open(..., "_blank")`, which is what made the SCORM
  // button look broken: /teacher-tools/* answers 401 with a
  // `WWW-Authenticate: Basic` challenge, and a challenge that arrives in a
  // freshly-opened tab is the worst place for it — a blocked popup, a dismissed
  // prompt, or credentials the new tab has not been given all leave the teacher
  // staring at a blank error page with no way back.
  //
  // Same-tab navigation hands the 401 to the browser in the tab the teacher is
  // already using, so the native password prompt appears and, once accepted,
  // the browser loads THE URL IT WAS ALREADY GOING TO — the specific tool, with
  // its ?seq/&unit intact. There is no second flow to build and nothing about
  // the 401 gate changes; the auth simply happens where it can be answered.
  //
  // location.assign, never location.replace: assign leaves a history entry, so
  // Back returns to the Hub. Replace would strand the teacher.
  const goToTool = (url) => {
    window.location.assign(url);
  };

  // Download the whole unit as ONE Canvas-ready archive.
  //
  // /api/scorm-bundle returns a single .zip holding one ready-to-upload SCORM
  // package per lesson, each still its own nested .zip — Canvas imports SCORM
  // one package per assignment, so they cannot be merged, but a teacher setting
  // up a unit should download once.
  //
  // This replaced firing N staggered downloads: browsers meet that with a
  // "this site wants to download multiple files" prompt, and it scatters N
  // files loose in Downloads with nothing tying them to a unit. One archive
  // unzips to one named folder with a README.
  //
  // A plain anchor, no fetch: the browser streams it straight to disk, the
  // Content-Disposition filename is honoured, and the page never leaves the Hub.
  const downloadUnitScorm = (item) => {
    const lessons = Array.isArray(item.lessons) ? item.lessons : [];
    if (!lessons.length) {
      window.alert("No lessons found for this unit yet.");
      return;
    }
    const ids = lessons.map((l) => l.id).join(",");
    const a = document.createElement("a");
    a.href =
      "/api/scorm-bundle?activities=" +
      encodeURIComponent(ids) +
      "&name=" +
      encodeURIComponent(item.district_title || "SCORM packages");
    a.download = "";
    a.rel = "noopener";
    a.style.display = "none";
    document.body.appendChild(a);
    a.click();
    setTimeout(() => a.remove(), 2000);
  };

  window.executeQuickAction = function (actionType) {
    const item = window.getActiveDistrictSeq();
    const seq = item.sequence;
    const unitTitle = encodeURIComponent(item.district_title);
    const firstLessonId = item.lessons[0] ? item.lessons[0].id : "1-1";

    if (actionType === "launch_first") {
      window.open("/lessons/" + firstLessonId + "/", "_blank");
    } else if (actionType === "build_week") {
      goToTool("/math/student-board/?seq=" + seq + "&unit=" + unitTitle + "&edit=1");
    } else if (actionType === "playlist") {
      goToTool("/teacher-tools/tiered-differentiation-builder/?seq=" + seq + "&unit=" + unitTitle);
    } else if (actionType === "unit_map") {
      window.open("/curriculum/map/?seq=" + seq + "&unit=" + unitTitle, "_blank");
    } else if (actionType === "groups") {
      goToTool("/neft-math-lab-studio/?seq=" + seq + "&unit=" + unitTitle);
    } else if (actionType === "scorm") {
      downloadUnitScorm(item);
    } else if (actionType === "project") {
      if (item.project && item.project.path) window.open(item.project.path, "_blank");
    }
  };

  window.onDistrictLessonChange = function (val) {
    if (!val) return;
    if (val.startsWith("lesson_")) {
      const lid = val.replace("lesson_", "");
      window.open("/lessons/" + lid + "/", "_blank");
    } else if (val.startsWith("sg1_")) {
      const lid = val.replace("sg1_", "");
      window.open("/lessons/" + lid + "-group1/", "_blank");
    } else if (val.startsWith("sg2_")) {
      const lid = val.replace("sg2_", "");
      window.open("/lessons/" + lid + "-group2/", "_blank");
    } else if (val.startsWith("bridge_")) {
      window.open("/lessons/" + val.replace("bridge_", "") + "/", "_blank");
    } else if (val.startsWith("catchup_")) {
      // The manifest id IS the folder name (6-2-catchup → /lessons/6-2-catchup/).
      window.open("/lessons/" + val.replace("catchup_", "") + "/", "_blank");
    } else {
      window.executeQuickAction(val);
    }
  };

  window.launchTargetLesson = function () {
    const select = document.getElementById("district-lesson-select");
    const val = select ? select.value : "";
    if (val) {
      window.onDistrictLessonChange(val);
    } else {
      window.executeQuickAction("launch_first");
    }
  };

  /* Unit start/end dates are not authored in the `crosswalk` array. They come
   * from data/pacing-unit-ranges.json (generated by the same import that seeds
   * the Pacing Planner). applyGeneratedDates() stamps the compiled copy from
   * assets/pacing-unit-dates.generated.js at parse time so a failed fetch — or
   * a consumer that reads NTDistrictPacing.today() before reconcile() — cannot
   * open the wrong unit. This fetch still overlays the JSON so the two
   * generated copies cannot silently diverge at runtime.
   *
   * LIVE pacing changes are deliberately NOT reflected here. They live behind
   * the teacher gate in /curriculum/planning/; this page shows the plan of
   * record. */
  function loadJson(url) {
    var cache = window.NTJsonCache;
    var request = cache
      ? cache.json(url)
      : fetch(url).then(function (r) {
          return r.ok ? r.json() : {};
        });
    return request.catch(function () {
      return {};
    });
  }

  const usDate = (iso) => {
    if (!iso) return null;
    const [y, m, d] = iso.split("-").map(Number);
    return `${m}/${d}/${String(y).slice(2)}`;
  };

  /**
   * Overlay canonical data before anything renders.
   *
   * DATES are stamped from the generated fallback at parse time, then confirmed
   * here from pacing-unit-ranges.json. LESSON TITLES AND STANDARDS had drifted
   * the same way the dates once did: 2-6 read "Divide Multi-Digit Whole Numbers
   * (Computation Bridge)" against a manifest saying "Divide Multi-Digit Numbers
   * Using an Algorithm", and carried the 2010 code 6.NS.B.2 against a registry
   * re-coded to 6.NOS.2.
   *
   * They are no longer stored here at all. Canonical lesson entries are now
   * `{ id }` and the title and standards are resolved from the curriculum
   * manifest at render time, so the drift has nowhere to live.
   *
   * WHAT STAYS INLINE, deliberately: the unit's `district_title` (the district's
   * own name for the unit — pacing owns that), and the three MSTAR prep entries,
   * whose ids are not canonical lessons and have no manifest counterpart.
   */
  function reconcile() {
    return Promise.all([
      loadJson("/data/pacing-unit-ranges.json"),
      loadJson("/data/curriculum-launch-manifest.json"),
    ]).then(function (results) {
      const data = results[0] || {};
      const manifest = results[1] || {};

      const bySeq = new Map((data.units || []).map((u) => [u.sequence, u]));
      crosswalk.forEach(function (item) {
        const live = bySeq.get(item.sequence);
        if (!live || !live.startDate || !live.endDate) return;
        item.start_date = usDate(live.startDate);
        item.end_date = usDate(live.endDate);
        item.instructional_days = live.instructionalDays;
      });

      const byId = new Map((manifest.lessons || []).map((l) => [l.id, l]));
      /* Catch-up stations, keyed by the lesson they hang under. The manifest
       * already names that lesson (`parent`), so 6-2-catchup — "6.1 · 6.2 · 6.9
       * Catch-Up" — belongs directly beneath 6.2 and nowhere else. They were
       * absent from this picker entirely: a teacher could reach every lesson
       * and both small-group pathways from it, but the review station for the
       * band had no door here at all. */
      /* Bridge practice pages — a combined set that sits BETWEEN two lessons
       * (/lessons/6-1-6-2-practice/, "6.1–6.2 · Extra Practice"). They are not
       * catch-up stations and not lesson variants, so nothing in the launch
       * manifest enumerates them: the hub lists this one by hand in
       * curriculum/units/index.html, and the picker listed it nowhere at all.
       * Listed here by the lesson they follow. Add a row to add a page. */
      const bridgePractice = {
        "6-2": { id: "6-1-6-2-practice", title: "6.1–6.2 · Extra Practice" },
      };
      const catchUpByParent = new Map(
        (manifest.catchUps || []).filter((c) => c && c.parent && c.id).map((c) => [c.parent, c]),
      );
      crosswalk.forEach(function (item) {
        (item.lessons || []).forEach(function (lesson) {
          const station = catchUpByParent.get(lesson.id);
          if (station) lesson.catchUp = { id: station.id, title: station.title };
          if (bridgePractice[lesson.id]) lesson.bridge = bridgePractice[lesson.id];
          const canonical = byId.get(lesson.id);
          if (!canonical) return; // MSTAR and anything retired keep what they have.
          lesson.title = canonical.title;
          lesson.standards = canonical.standard ? [canonical.standard] : [];
        });
      });

      // The overlay just moved the dates; the labels have to move with them.
      syncSeqLabels();
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    const select = document.getElementById("district-seq-select");
    if (!select) return;
    reconcile().then(startHub);
  });

  function startHub() {
    const select = document.getElementById("district-seq-select");
    if (!select) return;
    // Open on where the district actually is today, not on Seq 1 in June.
    const today = seqForDate(new Date());
    if (today && select.querySelector(`option[value="${today.sequence}"]`)) {
      select.value = String(today.sequence);
    }
    if (select.value) window.onDistrictSeqChange(select.value);
  }
})();
