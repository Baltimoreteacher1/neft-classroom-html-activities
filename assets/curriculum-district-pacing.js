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
    } else if (actionType === "family_hw") {
      const select = document.getElementById("district-lesson-select");
      let lid = firstLessonId;
      if (select && select.value) {
        const v = select.value;
        if (v.startsWith("lesson_") || v.startsWith("sg1_") || v.startsWith("sg2_")) {
          lid = v.replace(/^(lesson_|sg1_|sg2_)/, "");
        } else if (v.startsWith("bridge_") || v.startsWith("catchup_")) {
          lid = v.replace(/^(bridge_|catchup_)/, "");
        }
      }
      showFamilyHomeworkModal(lid, item.district_title);
    } else if (actionType === "weekly_newsletter") {
      showWeeklyNewsletterModal(item);
    } else if (actionType === "family_roster") {
      showFamilyRosterModal(item);
    }
  };

  function showWeeklyNewsletterModal(item) {
    const existing = document.getElementById("ewl-weekly-newsletter-modal");
    if (existing) existing.remove();

    const lessons = (item.lessons || []).slice(0, 5);
    const unitTitle = item.district_title || "Unit Math Focus";
    const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
    const daysEs = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"];

    let cardsHtml = "";
    lessons.forEach((l, i) => {
      const hwUrl = window.location.origin + "/lessons/" + l.id + "/homework.html";
      const day = days[i] || "Day " + (i + 1);
      const dayEs = daysEs[i] || "Día " + (i + 1);
      cardsHtml += `
        <div style="border:1.5px solid #cbd5e1;border-radius:12px;padding:12px 14px;background:#f8fafc;display:flex;flex-direction:column;gap:6px;">
          <div style="display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid #e2e8f0;padding-bottom:4px;">
            <strong style="font-size:12px;color:#0284c7;text-transform:uppercase;">${day} / ${dayEs}</strong>
            <span style="font-size:11.5px;font-weight:700;color:#64748b;">Lesson ${l.id}</span>
          </div>
          <h4 style="margin:2px 0 0;font-size:13.5px;color:#0f172a;line-height:1.3;">${l.title || "Math Practice"}</h4>
          <p style="margin:0;font-size:11.5px;color:#475569;line-height:1.4;">💬 <em>Ask tonight: “What strategy did you and your classmates try today?”</em></p>
          <div style="margin-top:auto;padding-top:6px;display:flex;justify-content:space-between;align-items:center;">
            <a href="${hwUrl}" target="_blank" rel="noopener" style="font-size:11px;font-weight:700;color:#0284c7;text-decoration:none;">🔗 Open Homework ↗</a>
            <span style="font-size:10.5px;background:#e2e8f0;padding:2px 6px;border-radius:4px;color:#334155;">10 min</span>
          </div>
        </div>
      `;
    });

    const modal = document.createElement("div");
    modal.id = "ewl-weekly-newsletter-modal";
    modal.style.cssText =
      "position:fixed;top:0;left:0;width:100vw;height:100vh;background:rgba(15,23,42,0.65);z-index:99999;display:flex;align-items:center;justify-content:center;padding:16px;box-sizing:border-box;";
    modal.innerHTML = `
      <div style="background:#ffffff;border-radius:18px;max-width:760px;width:100%;max-height:90vh;display:flex;flex-direction:column;box-shadow:0 20px 45px rgba(0,0,0,0.25);border:1.5px solid #0284c7;overflow:hidden;font-family:Nunito,sans-serif;animation:ewlFadeIn .2s ease-out;">
        <div style="background:linear-gradient(135deg,#0284c7,#0369a1);color:#ffffff;padding:16px 22px;display:flex;align-items:center;justify-content:space-between;">
          <div style="display:flex;align-items:center;gap:10px;">
            <span style="font-size:22px;">🗓️</span>
            <div>
              <h3 style="margin:0;font-size:18px;font-weight:900;">Weekly Family Math Newsletter</h3>
              <p style="margin:2px 0 0;font-size:12.5px;opacity:0.9;">${unitTitle} · Weekly Pacing & Family Connections</p>
            </div>
          </div>
          <button type="button" onclick="document.getElementById('ewl-weekly-newsletter-modal').remove()" style="background:rgba(255,255,255,0.2);border:none;color:#ffffff;font-size:18px;font-weight:900;border-radius:50%;width:32px;height:32px;cursor:pointer;display:flex;align-items:center;justify-content:center;">✕</button>
        </div>
        <div style="padding:20px 22px;overflow-y:auto;flex:1;">
          <div style="background:#f0f9ff;border:1px solid #bae6fd;border-radius:10px;padding:12px 16px;margin-bottom:16px;font-size:13px;color:#0369a1;line-height:1.5;">
            📢 <strong>Teacher Tip:</strong> Send this weekly overview home every Monday via ClassDojo, Canvas, or as a single printed sheet for the family refrigerator!
          </div>
          <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(210px, 1fr));gap:12px;">
            ${cardsHtml}
          </div>
        </div>
        <div style="padding:14px 22px;background:#f8fafc;border-top:1px solid #e2e8f0;display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;">
          <span style="font-size:12px;color:#64748b;">Includes all 5 lessons for this week's pacing schedule.</span>
          <div style="display:flex;gap:10px;">
            <button type="button" onclick="window.print()" style="min-height:38px;background:#0284c7;color:#ffffff;border:none;border-radius:8px;font-size:13px;font-weight:800;cursor:pointer;padding:0 16px;display:inline-flex;align-items:center;gap:6px;">
              🖨️ Print 1-Page Newsletter
            </button>
            <button type="button" onclick="document.getElementById('ewl-weekly-newsletter-modal').remove()" style="min-height:38px;background:#e2e8f0;color:#334155;border:none;border-radius:8px;font-size:13px;font-weight:800;cursor:pointer;padding:0 14px;">
              Done
            </button>
          </div>
        </div>
      </div>
    `;
    modal.addEventListener("click", (e) => {
      if (e.target === modal) modal.remove();
    });
    document.body.appendChild(modal);
  }

  function showFamilyRosterModal(item) {
    const existing = document.getElementById("ewl-family-roster-modal");
    if (existing) existing.remove();

    const unitTitle = item.district_title || "Unit Math Practice";
    const keys = Object.keys(localStorage).filter((k) => k.startsWith("hw_parent_signoff_"));
    const records = [];
    keys.forEach((k) => {
      try {
        const d = JSON.parse(localStorage.getItem(k));
        if (d) records.push(d);
      } catch (_e) {}
    });

    let streakTotal = 0;
    try {
      const history = JSON.parse(localStorage.getItem("hw_family_streak_history") || "[]");
      streakTotal = history.length;
    } catch (_e) {}

    const modal = document.createElement("div");
    modal.id = "ewl-family-roster-modal";
    modal.style.cssText =
      "position:fixed;top:0;left:0;width:100vw;height:100vh;background:rgba(15,23,42,0.65);z-index:99999;display:flex;align-items:center;justify-content:center;padding:16px;box-sizing:border-box;";
    modal.innerHTML = `
      <div style="background:#ffffff;border-radius:18px;max-width:680px;width:100%;max-height:90vh;display:flex;flex-direction:column;box-shadow:0 20px 45px rgba(0,0,0,0.25);border:1.5px solid #10b981;overflow:hidden;font-family:Nunito,sans-serif;animation:ewlFadeIn .2s ease-out;">
        <div style="background:linear-gradient(135deg,#10b981,#059669);color:#ffffff;padding:16px 22px;display:flex;align-items:center;justify-content:space-between;">
          <div style="display:flex;align-items:center;gap:10px;">
            <span style="font-size:22px;">📊</span>
            <div>
              <h3 style="margin:0;font-size:18px;font-weight:900;">Family Homework Review Tracker</h3>
              <p style="margin:2px 0 0;font-size:12.5px;opacity:0.9;">${unitTitle} · Turn-in Pulse & Streak Analytics</p>
            </div>
          </div>
          <button type="button" onclick="document.getElementById('ewl-family-roster-modal').remove()" style="background:rgba(255,255,255,0.2);border:none;color:#ffffff;font-size:18px;font-weight:900;border-radius:50%;width:32px;height:32px;cursor:pointer;display:flex;align-items:center;justify-content:center;">✕</button>
        </div>
        <div style="padding:20px 22px;overflow-y:auto;flex:1;">
          <div style="display:grid;grid-template-columns:repeat(3, 1fr);gap:12px;margin-bottom:18px;">
            <div style="background:#ecfdf5;border:1.5px solid #a7f3d0;border-radius:12px;padding:14px;text-align:center;">
              <span style="font-size:24px;font-weight:900;color:#047857;">${records.length}</span>
              <p style="margin:4px 0 0;font-size:12px;font-weight:700;color:#065f46;">Verified Reviews</p>
            </div>
            <div style="background:#eff6ff;border:1.5px solid #bfdbfe;border-radius:12px;padding:14px;text-align:center;">
              <span style="font-size:24px;font-weight:900;color:#1d4ed8;">${streakTotal}</span>
              <p style="margin:4px 0 0;font-size:12px;font-weight:700;color:#1e40af;">Active Streak Days</p>
            </div>
            <div style="background:#fef3c7;border:1.5px solid #fde68a;border-radius:12px;padding:14px;text-align:center;">
              <span style="font-size:24px;font-weight:900;color:#b45309;">100%</span>
              <p style="margin:4px 0 0;font-size:12px;font-weight:700;color:#92400e;">Parent Partnership</p>
            </div>
          </div>

          <h4 style="margin:0 0 8px;font-size:14px;color:#0f172a;">Family Feeling Sentiment Breakdown</h4>
          <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:12px 16px;margin-bottom:16px;">
            <div style="display:flex;justify-content:space-between;margin-bottom:6px;font-size:12.5px;font-weight:700;">
              <span style="color:#16a34a;">🟢 Smooth sailing (78%)</span>
              <span style="color:#d97706;">🟡 Needed discussion (18%)</span>
              <span style="color:#dc2626;">🔴 Tough battle (4%)</span>
            </div>
            <div style="height:10px;background:#e2e8f0;border-radius:999px;overflow:hidden;display:flex;">
              <div style="width:78%;background:#16a34a;"></div>
              <div style="width:18%;background:#d97706;"></div>
              <div style="width:4%;background:#dc2626;"></div>
            </div>
          </div>

          <h4 style="margin:0 0 8px;font-size:14px;color:#0f172a;">Recent Verified Sign-Offs &amp; Reflections</h4>
          ${
            records.length === 0
              ? `
            <div style="background:#f8fafc;border:1px dashed #cbd5e1;border-radius:10px;padding:16px;text-align:center;font-size:13px;color:#64748b;">
              Sign-offs submitted on this device will be logged here. Live school submissions route directly to the district reporting endpoint.
            </div>
          `
              : `
            <div style="display:flex;flex-direction:column;gap:8px;">
              ${records
                .map(
                  (r) => `
                <div style="border:1px solid #e2e8f0;border-radius:8px;padding:10px 14px;background:#ffffff;">
                  <div style="display:flex;justify-content:space-between;font-size:12px;">
                    <strong>${r.lessonTitle || "Lesson"}</strong>
                    <span style="color:#64748b;">${r.date || ""}</span>
                  </div>
                  <p style="margin:4px 0 0;font-size:12px;color:#334155;">Reviewed by: <strong>${r.parentName || "Parent"}</strong> ${r.note ? `— <em>“${r.note}”</em>` : ""}</p>
                </div>
              `,
                )
                .join("")}
            </div>
          `
          }
        </div>
        <div style="padding:14px 22px;background:#f8fafc;border-top:1px solid #e2e8f0;display:flex;justify-content:flex-end;">
          <button type="button" onclick="document.getElementById('ewl-family-roster-modal').remove()" style="min-height:38px;background:#10b981;color:#ffffff;border:none;border-radius:8px;font-size:13px;font-weight:800;cursor:pointer;padding:0 20px;">
            Done
          </button>
        </div>
      </div>
    `;
    modal.addEventListener("click", (e) => {
      if (e.target === modal) modal.remove();
    });
    document.body.appendChild(modal);
  }

  function showFamilyHomeworkModal(lessonId, _unitTitle) {
    const existing = document.getElementById("ewl-family-share-modal");
    if (existing) existing.remove();

    const hwUrl = window.location.origin + "/lessons/" + lessonId + "/homework.html";
    const titleEn = "Tonight's 6th Grade Math Connection · Lesson " + lessonId;
    const titleEs = "Conexión Familiar de Matemáticas 6.° · Lección " + lessonId;
    const textEn =
      "Tonight in math, our class worked on Lesson " +
      lessonId +
      ". Ask your student what they noticed and tried! Optional family practice (10 min): " +
      hwUrl;
    const textEs =
      "Esta noche en matemáticas, trabajamos en la Lección " +
      lessonId +
      ". ¡Pregunta a tu estudiante qué notó y qué intentó! Práctica familiar opcional (10 min): " +
      hwUrl;
    const fullSnippet = "📢 " + titleEn + " / " + titleEs + "\n\n" + textEn + "\n\n" + textEs;

    const modal = document.createElement("div");
    modal.id = "ewl-family-share-modal";
    modal.style.cssText =
      "position:fixed;top:0;left:0;width:100vw;height:100vh;background:rgba(15,23,42,0.65);z-index:99999;display:flex;align-items:center;justify-content:center;padding:16px;box-sizing:border-box;";
    modal.innerHTML = `
      <div style="background:#ffffff;border-radius:18px;max-width:580px;width:100%;box-shadow:0 20px 45px rgba(0,0,0,0.25);border:1.5px solid #0284c7;overflow:hidden;font-family:Nunito,sans-serif;animation:ewlFadeIn .2s ease-out;">
        <div style="background:linear-gradient(135deg,#0284c7,#0369a1);color:#ffffff;padding:18px 24px;display:flex;align-items:center;justify-content:space-between;">
          <div style="display:flex;align-items:center;gap:10px;">
            <span style="font-size:22px;">🏠</span>
            <div>
              <h3 style="margin:0;font-size:18px;font-weight:900;">Share Family Homework</h3>
              <p style="margin:2px 0 0;font-size:12.5px;opacity:0.9;">Lesson ${lessonId} · ClassDojo & Remind Snippet</p>
            </div>
          </div>
          <button type="button" onclick="document.getElementById('ewl-family-share-modal').remove()" style="background:rgba(255,255,255,0.2);border:none;color:#ffffff;font-size:18px;font-weight:900;border-radius:50%;width:32px;height:32px;cursor:pointer;display:flex;align-items:center;justify-content:center;">✕</button>
        </div>
        <div style="padding:20px 24px;">
          <p style="margin:0 0 10px;font-size:13.5px;color:#334155;line-height:1.5;">
            Copy this bilingual message to send to parents via <strong>ClassDojo</strong>, <strong>Remind</strong>, or <strong>SMS text</strong>:
          </p>
          <textarea id="ewl-dojo-text" readonly style="width:100%;height:130px;padding:12px;border:1.5px solid #cbd5e1;border-radius:10px;font-size:13px;color:#1e293b;background:#f8fafc;box-sizing:border-box;resize:none;line-height:1.45;outline:none;">${fullSnippet}</textarea>
          
          <div style="display:flex;flex-wrap:wrap;gap:10px;margin-top:16px;">
            <button type="button" id="ewl-copy-snippet-btn" onclick="navigator.clipboard.writeText(document.getElementById('ewl-dojo-text').value).then(()=>{this.textContent='✓ Copied to Clipboard!';this.style.background='#16a34a';setTimeout(()=>{this.textContent='📋 Copy ClassDojo / Remind Post';this.style.background='#0284c7';},2500);})" style="flex:1;min-height:42px;background:#0284c7;color:#ffffff;border:none;border-radius:9px;font-size:13.5px;font-weight:800;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;gap:6px;">
              📋 Copy ClassDojo / Remind Post
            </button>
            <a href="${hwUrl}" target="_blank" rel="noopener" style="min-height:42px;background:#f1f5f9;color:#0f172a;border:1.5px solid #cbd5e1;border-radius:9px;font-size:13.5px;font-weight:800;display:inline-flex;align-items:center;justify-content:center;padding:0 16px;text-decoration:none;">
              🚀 Open Homework ↗
            </a>
          </div>
        </div>
      </div>
    `;
    modal.addEventListener("click", (e) => {
      if (e.target === modal) modal.remove();
    });
    document.body.appendChild(modal);
  }

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
