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
  var smallGroupsByParent = {};
  var catchUpsByParent = {};
  var endOfUnitByUnit = {};
  var state = loadState();
  var panel = null;

  // Full display/navigation order: each core lesson followed by its Group 1 /
  // Group 2 small-group lessons, with the unit's End-of-Unit project after the
  // last lesson of that unit. Mirrors the curriculum hub grouping.
  function navOrderIds() {
    var out = [];
    lessons.forEach(function (lesson, i) {
      out.push(lesson.id);
      (smallGroupsByParent[lesson.id] || []).forEach(function (group) {
        out.push(group.id);
      });
      (catchUpsByParent[lesson.id] || []).forEach(function (catchUp) {
        out.push(catchUp.id);
      });
      var next = lessons[i + 1];
      if (!next || next.unit !== lesson.unit) {
        var eou = endOfUnitByUnit[lesson.unit];
        if (eou) out.push(eou.id);
      }
    });
    return out;
  }

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = text;
    return node;
  }

  /**
   * The lesson the district pacing calendar puts us on today. Falls back to
   * "1-1" only when the pacing module is absent — never as a silent default,
   * which is what used to strand the cockpit on lesson 1-1 for the whole year.
   */
  function pacingDefaultLesson() {
    var pacing = window.NTDistrictPacing;
    if (!pacing) return "1-1";
    try {
      var ids = pacing.lessonIds(pacing.today());
      return ids[0] || "1-1";
    } catch (_error) {
      return "1-1";
    }
  }

  /** The district sequence number for today, or 0 when pacing is unavailable. */
  function pacingSeqNumber() {
    var pacing = window.NTDistrictPacing;
    if (!pacing) return 0;
    try {
      var item = pacing.today();
      return (item && item.sequence) || 0;
    } catch (_error) {
      return 0;
    }
  }

  /**
   * The pacing line in the hero. Mirrors the top console's
   * "Grade 6 Math · Course 1 District Pacing" and adds WHICH sequence is live,
   * so the cockpit states its own alignment instead of implying it.
   */
  function pacingStampText() {
    var base = "Grade 6 Math · Course 1 District Pacing";
    var pacing = window.NTDistrictPacing;
    if (!pacing) return base;
    try {
      // Quarter only — the <h2> already names the sequence and unit.
      var item = pacing.today();
      return item && item.quarter ? `${base} · ${item.quarter}` : base;
    } catch (_error) {
      return base;
    }
  }

  /**
   * The cockpit's own heading: the district sequence it is currently pointed
   * at. Falls back to a plain title when pacing is unavailable, so the panel is
   * never left headless.
   */
  function pacingHeadingText() {
    var fallback = "Today's Teaching";
    var pacing = window.NTDistrictPacing;
    if (!pacing) return fallback;
    try {
      var item = pacing.today();
      if (!item) return fallback;
      return `Seq ${item.sequence} · ${item.district_title}`;
    } catch (_error) {
      return fallback;
    }
  }

  function defaultState() {
    return {
      selected: pacingDefaultLesson(),
      section: "601",
      favorites: [],
      recent: [],
      view: "today",
      seqStamp: pacingSeqNumber(),
    };
  }

  /**
   * Saved state wins WITHIN a district sequence — a teacher's chosen lesson,
   * section and view must survive a reload. But when the calendar rolls into a
   * new sequence, the stored `selected` is a stale answer to "what are we
   * teaching", so the lesson (and only the lesson) re-defaults to the new
   * sequence's opener. Favourites, section and recents are never touched.
   */
  function loadState() {
    var base = defaultState();
    // Captured BEFORE the merge: Object.assign mutates `base`, so reading
    // base.selected afterwards would hand back the stale saved lesson.
    var pacingLesson = base.selected;
    var saved;
    try {
      saved = JSON.parse(localStorage.getItem(STORAGE)) || {};
    } catch (_error) {
      return base;
    }
    var merged = Object.assign(base, saved);
    var seq = pacingSeqNumber();
    if (seq && merged.seqStamp !== seq) {
      merged.selected = pacingLesson;
      merged.seqStamp = seq;
    }
    return merged;
  }

  function saveState() {
    try {
      localStorage.setItem(STORAGE, JSON.stringify(state));
    } catch (_error) {}
  }

  // Selection bridge — the docked Units & Lessons library subscribes here so the
  // two parts share ONE unit/lesson selection: changing the lesson in the
  // cockpit updates the library, and vice-versa (curriculum-lesson-merge.js).
  var selectListeners = [];
  function fireSelect() {
    selectListeners.forEach(function (fn) {
      try {
        fn(state.selected);
      } catch (_e) {}
    });
  }

  // Routed through /assets/curriculum-json-cache.js so the hub fetches each
  // data file once instead of once per feature script.
  function getJson(url) {
    var cache = window.NTJsonCache;
    if (cache) {
      return cache.json(url).catch(function () {
        throw new Error("Missing curriculum workflow data");
      });
    }
    return fetch(url, { credentials: "same-origin" }).then(function (response) {
      if (!response.ok) throw new Error("Missing curriculum workflow data");
      return response.json();
    });
  }

  function familyFor(lesson) {
    var text = `${lesson.title} ${lesson.standard}`.toLowerCase();
    var rules = DATA.workflow?.familyRules || [];
    for (var i = 0; i < rules.length; i += 1) {
      try {
        if (new RegExp(rules[i].pattern, "i").test(text)) return rules[i].family;
      } catch (error) {
        console.error("Invalid curriculum family rule", rules[i], error);
      }
    }
    return "general";
  }

  function selectedLesson() {
    return lessonsById[state.selected] || lessons[0];
  }

  function studentUrl(lessonOrIds) {
    var base = `${location.origin}/curriculum/student-launch/`;
    if (Array.isArray(lessonOrIds)) return `${base}?playlist=${lessonOrIds.join(",")}`;
    // Small-group and end-of-unit entries are not in the student-launch
    // playlist manifest, so link straight to their real student-safe route.
    if (lessonOrIds.kind && lessonOrIds.resources?.lesson)
      return `${location.origin}${lessonOrIds.resources.lesson}`;
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

  // One-paste Canvas assignment: title, student-facing description, direct
  // link, and the ready-to-upload SCORM package URL. Plain string building
  // only — no network calls happen here.
  function canvasAssignmentText(lesson, safeUrl) {
    var kindLabel =
      lesson.kind === "smallGroup"
        ? lesson.group === 1
          ? " (Foundations small group)"
          : " (Challenge small group)"
        : lesson.kind === "catchUp"
          ? " (Catch-Up review)"
          : "";
    var scormUrl =
      `${location.origin}/api/scorm?activity=${encodeURIComponent(lesson.id)}` +
      `&title=${encodeURIComponent(lesson.title)}`;
    var differentiates = lesson.kind === "smallGroup" || lesson.kind === "catchUp";
    var autoUrl = differentiates
      ? safeUrl + (safeUrl.indexOf("?") === -1 ? "?" : "&") + "route=auto"
      : null;
    var lines = [
      `${lesson.id} · ${lesson.title}${kindLabel}`,
      "",
      lesson.objective,
      "",
      `Student link: ${safeUrl}`,
      `SCORM package (upload to Canvas for automatic grade passback): ${scormUrl}`,
      "",
      "Setup: Canvas → Assignments → + Assignment → Submission Type “External Tool”/file upload,",
      "or upload the SCORM zip via Settings → Import. Use “Assign To” to give this version",
      "to specific students only.",
    ];
    if (autoUrl)
      lines.push(
        "",
        "Auto-differentiate (assign ONE link to the whole class): " + autoUrl,
        "Each student is sent to the variant you assigned them in Learning Supports;",
        "everyone else stays on this version. Or add ?group=1 / ?group=2 to force a version.",
      );
    // One-upload auto-router SCORM: grade passback + per-student routing in a
    // single package. Built from the site-relative path so the package always
    // targets production regardless of where the hub is being viewed.
    var autoPath =
      autoUrl && lesson.resources?.lesson ? lesson.resources.lesson + "?route=auto" : null;
    if (autoPath)
      lines.push(
        "",
        "Auto-router SCORM package (one upload: grade passback + auto-routing): " +
          `${location.origin}/api/scorm?activity=${encodeURIComponent(autoPath)}` +
          `&title=${encodeURIComponent(lesson.title + " (auto-routed)")}`,
      );
    return lines.join("\n");
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

  function _kv(labelText, value) {
    var item = el("div", "ctw-readiness-item");
    item.appendChild(el("h4", null, labelText));
    item.appendChild(el("p", null, value || "Use the lesson's built-in support."));
    return item;
  }

  function updateRecent(lessonId) {
    state.recent = [lessonId]
      .concat(
        (state.recent || []).filter(function (id) {
          return id !== lessonId && lessonsById[id];
        }),
      )
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
      container.replaceChildren(
        el("p", "ctw-muted", "QR unavailable offline. Use Copy student link."),
      );
    });
    container.appendChild(image);
  }

  function _substitutePlan(lesson, support) {
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
    Array.from(
      new Set(
        lessons.map(function (lesson) {
          return lesson.unit;
        }),
      ),
    ).forEach(function (number) {
      var option = el("option", null, `Unit ${number}`);
      option.value = String(number);
      unit.appendChild(option);
    });
    unit.value = String(selectedLesson().unit);

    var lessonSelect = el("select", "ctw-select");
    function addOption(id, label) {
      var option = el("option", null, label);
      option.value = id;
      lessonSelect.appendChild(option);
    }
    function fillLessons(unitNumber) {
      lessonSelect.replaceChildren();
      var number = Number(unitNumber);
      lessons
        .filter(function (lesson) {
          return lesson.unit === number;
        })
        .forEach(function (lesson) {
          addOption(lesson.id, `${lesson.id} · ${lesson.title}`);
          // Group 1 / Group 2 small-group lessons, indented under their base.
          (smallGroupsByParent[lesson.id] || []).forEach(function (group) {
            addOption(group.id, `   ↳ ${group.title}`);
          });
          // Band-review catch-up lesson, after that band's last lesson.
          (catchUpsByParent[lesson.id] || []).forEach(function (catchUp) {
            addOption(catchUp.id, `   ↺ ${catchUp.title}`);
          });
        });
      // End-of-unit culminating project at the bottom of the unit.
      var eou = endOfUnitByUnit[number];
      if (eou) addOption(eou.id, `   ★ ${eou.title}`);
      if (lessonsById[state.selected]?.unit === number) lessonSelect.value = state.selected;
      else state.selected = lessonSelect.value;
    }
    fillLessons(unit.value);
    unit.addEventListener("change", function () {
      fillLessons(unit.value);
      state.selected = lessonSelect.value;
      updateRecent(state.selected);
      onChange();
      fireSelect();
    });
    lessonSelect.addEventListener("change", function () {
      state.selected = lessonSelect.value;
      updateRecent(state.selected);
      onChange();
      fireSelect();
    });

    container.appendChild(field("Class", section));
    container.appendChild(field("Unit", unit));
    container.appendChild(field("Lesson", lessonSelect));
  }

  // ── Assembled printable lesson plan ──────────────────────────────────────
  // Builds a clean, fully-expanded lesson-plan document from every part of the
  // lesson (objectives, materials, vocabulary, readiness, differentiation, the
  // 45/90-min sequences, a sub-friendly plan, and the student link + QR), then
  // prints just that document. Replaces the old behavior that printed the live
  // interactive panel — where the sequence <details> printed collapsed, so the
  // steps were missing.
  function planSection(title, build) {
    var sec = el("section", "ctw-plan-section");
    sec.appendChild(el("h2", null, title));
    build(sec);
    return sec;
  }

  function planRows(sec, rows) {
    var dl = el("dl", "ctw-plan-dl");
    rows.forEach(function (row) {
      if (row[1] == null || row[1] === "") return;
      dl.appendChild(el("dt", null, row[0]));
      dl.appendChild(el("dd", null, row[1]));
    });
    if (dl.children.length) sec.appendChild(dl);
  }

  function planList(sec, steps) {
    var list = el("ol", "ctw-plan-list");
    (steps || []).forEach(function (step) {
      list.appendChild(el("li", null, step));
    });
    sec.appendChild(list);
  }

  function buildLessonPlan(lesson, readiness, support) {
    var url = studentUrl(lesson);
    var doc = el("article", "ctw-plan-doc");
    doc.setAttribute("aria-label", "Printable lesson plan for " + lesson.id + " " + lesson.title);

    var head = el("header", "ctw-plan-head");
    head.appendChild(el("p", "ctw-plan-brand", "Neft Teacher · Grade 6 Math · Lesson Plan"));
    head.appendChild(el("h1", null, lesson.id + " · " + lesson.title));
    head.appendChild(
      el(
        "p",
        "ctw-plan-meta",
        [
          "Class " + state.section,
          "Unit " + lesson.unit,
          lesson.standard,
          lesson.timeEstimate,
          "Date: ____________",
          "Teacher: Mr. Neft",
        ]
          .filter(Boolean)
          .join("  ·  "),
      ),
    );
    doc.appendChild(head);

    doc.appendChild(
      planSection("Objectives", function (sec) {
        planRows(sec, [
          ["Content objective", lesson.objective],
          ["Language objective", lesson.languageObjective],
          ["Success criteria", readiness.successCriteria],
        ]);
      }),
    );

    doc.appendChild(
      planSection("Materials & Vocabulary", function (sec) {
        planRows(sec, [
          ["Materials", readiness.materials],
          ["Vocabulary", (support.vocabulary || lesson.vocabulary || []).join(", ")],
          ["Sentence frame", support.sentenceFrame || (lesson.sentenceFrames || [])[0]],
        ]);
      }),
    );

    doc.appendChild(
      planSection("Readiness & Misconceptions", function (sec) {
        planRows(sec, [
          ["Prerequisite", readiness.prerequisite],
          ["Common misconception", readiness.misconception],
          ["Teacher response", readiness.responseMove],
        ]);
      }),
    );

    doc.appendChild(
      planSection("Differentiation", function (sec) {
        planRows(sec, [
          ["WIDA 1–2 (entering/emerging)", support.wida12],
          ["WIDA 3–4 (developing/expanding)", support.wida34],
          ["SPED access", support.sped],
          ["Enrichment", support.extension],
        ]);
      }),
    );

    doc.appendChild(
      planSection("45-Minute Lesson Sequence", function (sec) {
        planList(sec, DATA.workflow.sequences.minutes45);
      }),
    );
    doc.appendChild(
      planSection("90-Minute Lesson Sequence", function (sec) {
        planList(sec, DATA.workflow.sequences.minutes90);
      }),
    );

    doc.appendChild(
      planSection("If a Substitute Teaches This", function (sec) {
        planList(sec, [
          "Do Now (5 min): Ask students to name what they remember about the prerequisite.",
          "Lesson (15 min): Open the interactive lesson and complete the model together.",
          "Practice (15 min): Students use guided notes or the practice handout.",
          "Explain (5 min): " + (support.sentenceFrame || "My answer is ___ because ___."),
          "Check (5 min): Complete the lesson check and leave student work for Mr. Neft.",
        ]);
      }),
    );

    var linkSec = el("section", "ctw-plan-section ctw-plan-link");
    linkSec.appendChild(el("h2", null, "Student Lesson Link"));
    linkSec.appendChild(el("p", "ctw-plan-url", url));
    var qr = el("div", "ctw-plan-qr");
    renderQr(qr, url);
    linkSec.appendChild(qr);
    doc.appendChild(linkSec);

    return doc;
  }

  // Deep-links this lesson into the full Lesson Plan Generator, pre-filled with
  // the real standard/title/objective/time so it auto-generates the complete
  // 14-section editable plan (with Word/PDF export) instead of a generic guess.
  // Opens in a new tab so the teacher keeps the hub open.
  function generatorLink(lesson) {
    var query = new URLSearchParams({
      standard: lesson.standard || "",
      topic: lesson.title || "",
      focus: lesson.objective || "",
      length: lesson.timeEstimate || "",
      autogen: "1",
    });
    var href = "/teacher-tools/lesson-plan-generator/?" + query.toString();
    // Keep the always-visible hub "Lesson Plan Generator" feature card in sync,
    // so its Open button also pre-fills + auto-generates for the lesson the
    // teacher is currently planning here (not a blank generator).
    var staticBtn = document.querySelector(".lpg-feature a.mf-btn.solid");
    if (staticBtn) staticBtn.setAttribute("href", href);
    var node = link("Full plan + Word →", href, "ctw-generator");
    node.target = "_blank";
    node.rel = "noopener";
    node.title =
      "Open this lesson in the Lesson Plan Generator — full editable 14-section plan with Word/PDF export";
    return node;
  }

  function printLessonPlan(lesson, readiness, support) {
    var host = document.getElementById("ctw-plan-print");
    if (host) host.remove();
    host = el("div");
    host.id = "ctw-plan-print";
    host.appendChild(buildLessonPlan(lesson, readiness, support));
    document.body.appendChild(host);
    document.body.classList.add("ctw-plan-printing");

    var cleaned = false;
    function cleanup() {
      if (cleaned) return;
      cleaned = true;
      document.body.classList.remove("ctw-plan-printing");
      var node = document.getElementById("ctw-plan-print");
      if (node) node.remove();
      window.removeEventListener("afterprint", cleanup);
    }
    window.addEventListener("afterprint", cleanup);
    // Small delay lets the (usually already-cached) QR image settle before the
    // print dialog snapshots the page. The link text always prints regardless.
    setTimeout(function () {
      window.print();
    }, 80);
    setTimeout(cleanup, 12000);
  }

  function _sequence(title, steps) {
    var details = el("details", "ctw-sequence");
    details.appendChild(el("summary", null, title));
    var list = el("ol");
    (steps || []).forEach(function (step) {
      list.appendChild(el("li", null, step));
    });
    details.appendChild(list);
    return details;
  }

  function renderToday(stage) {
    var lesson = selectedLesson();
    var family = familyFor(lesson);
    var readiness = DATA.workflow.families[family] || DATA.workflow.families.general;
    var support = DATA.supports.families[family] || DATA.supports.families.general;
    // Prev/Next walk the full display order (core lessons + their small groups
    // + end-of-unit projects), so navigation stays in sync with the dropdown.
    var order = navOrderIds();
    var index = order.indexOf(lesson.id);
    var safeUrl = studentUrl(lesson);
    stage.replaceChildren();

    var selectors = el("div", "ctw-selectors");
    renderSelectors(selectors, function () {
      renderToday(stage);
    });
    stage.appendChild(selectors);

    var nav = el("div", "ctw-lesson-nav");
    nav.appendChild(
      button("← Previous", function () {
        if (index > 0) {
          state.selected = order[index - 1];
          updateRecent(state.selected);
          renderToday(stage);
        }
      }),
    );
    nav.appendChild(
      el(
        "span",
        "ctw-position",
        index >= 0 ? `Lesson ${index + 1} of ${order.length}` : lesson.title,
      ),
    );
    nav.appendChild(
      button("Next →", function () {
        if (index >= 0 && index < order.length - 1) {
          state.selected = order[index + 1];
          updateRecent(state.selected);
          renderToday(stage);
        }
      }),
    );
    stage.appendChild(nav);

    var hero = el("section", "ctw-today-card");
    var copy = el("div", "ctw-today-copy");
    copy.appendChild(
      el("p", "ctw-kicker", `Today's Teaching · ${state.section} · Unit ${lesson.unit}`),
    );
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
    actions.appendChild(
      button("Copy student link", function (event) {
        copyText(safeUrl, event.currentTarget);
      }),
    );
    actions.appendChild(
      button("Copy Canvas assignment", function (event) {
        copyText(canvasAssignmentText(lesson, safeUrl), event.currentTarget);
      }),
    );
    actions.appendChild(
      button("Print lesson plan", function () {
        printLessonPlan(lesson, readiness, support);
      }),
    );
    actions.appendChild(
      link(
        "🔥 Daily Warm-Up",
        "/spiral-review/?upto=" + encodeURIComponent(lesson.id) + "&donow=1",
        "ctw-warmup",
      ),
    );
    actions.appendChild(generatorLink(lesson));
    actions.appendChild(
      button(
        (state.favorites || []).includes(lesson.id) ? "★ Favorited" : "☆ Favorite",
        function () {
          var set = new Set(state.favorites || []);
          set.has(lesson.id) ? set.delete(lesson.id) : set.add(lesson.id);
          state.favorites = Array.from(set);
          saveState();
          renderToday(stage);
        },
      ),
    );
    copy.appendChild(actions);
    hero.appendChild(copy);
    var qr = el("div", "ctw-qr-wrap");
    renderQr(qr, safeUrl);
    qr.appendChild(el("p", "ctw-muted", "Scan to open the student-safe lesson."));
    hero.appendChild(qr);
    stage.appendChild(hero);

    // Optional live-data layer (assets/curriculum-live-signal.js). The core
    // workflow stays local & private by contract (validate:teacher-workflow);
    // the live card is an additive module that renders only when loaded.
    if (window.CurriculumLiveSignal?.render) {
      window.CurriculumLiveSignal.render(stage, {
        el: el,
        button: button,
        link: link,
        section: state.section,
        catchUps: (DATA.launch && DATA.launch.catchUps) || [],
        rerender: renderPanel,
      });
    }

    // Additive module (assets/curriculum-next-move.js): reads section-level
    // evidence and recommends a lane plus two misconceptions to watch for. Same
    // contract as the live-signal card above — renders only when loaded, so the
    // core workflow stays local and private.
    if (window.CurriculumNextMove?.render) {
      window.CurriculumNextMove.render(stage, {
        el: el,
        button: button,
        link: link,
        section: state.section,
      });
    }

    var readinessCard = el("section", "ctw-readiness");
    readinessCard.appendChild(el("h3", null, "Lesson Readiness"));
    readinessCard.appendChild(
      el(
        "p",
        "ctw-muted",
        "Use the success criteria and likely misconception to make the first instructional move.",
      ),
    );
    var readinessGrid = el("div", "ctw-readiness-grid");
    readinessGrid.append(
      _kv("Success criteria", readiness.successCriteria),
      _kv("Prerequisite", readiness.prerequisite),
      _kv("Common misconception", readiness.misconception),
      _kv("Teacher response", readiness.responseMove),
      _kv("WIDA 1–2", support.wida12),
      _kv("WIDA 3–4", support.wida34),
      _kv("SPED access", support.sped),
      _kv("Extension", support.extension),
    );
    readinessCard.appendChild(readinessGrid);
    stage.appendChild(readinessCard);
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
        state: state,
        saveState: saveState,
        lessons: lessons,
        lessonsById: lessonsById,
        data: DATA,
        studentUrl: studentUrl,
        button: button,
        link: link,
        el: el,
      });
    }
  }

  function buildPanel() {
    panel = el("section", "ctw-panel");
    panel.id = "curriculum-teacher-workflow";
    panel.setAttribute("aria-label", "Teacher curriculum command center");

    // Quick-links row — the FIRST thing a teacher sees on the hub: the full
    // Teacher Tools hub and the selected lesson's printable packet. The
    // printables button resolves state.selected at click time so it always
    // opens the packet for whatever lesson is currently chosen.
    var quick = el("div", "ctw-quicklinks");
    quick.setAttribute("aria-label", "Teacher quick links");
    var toolsCard = link("", "/teacher-tools/", "ctw-ql-card");
    toolsCard.appendChild(el("span", "ctw-ql-icon", "🧰"));
    var toolsBody = el("span", "ctw-ql-body");
    toolsBody.appendChild(el("strong", null, "Teacher Tools Hub"));
    toolsBody.appendChild(el("span", null, "Every teacher tool — plan, teach live, data, Canvas"));
    toolsCard.appendChild(toolsBody);
    quick.appendChild(toolsCard);
    var printCard = button(
      "",
      function () {
        var id = state.selected || (lessons[0] && lessons[0].id);
        if (id) window.open("/lessons/" + id + "/printable.html", "_blank");
      },
      "ctw-ql-card",
    );
    printCard.appendChild(el("span", "ctw-ql-icon", "🖨️"));
    var printBody = el("span", "ctw-ql-body");
    printBody.appendChild(el("strong", null, "Printable Resources"));
    printBody.appendChild(
      el("span", "ctw-ql-sub", "Print the full packet for the selected lesson"),
    );
    printCard.appendChild(printBody);
    quick.appendChild(printCard);
    panel.appendChild(quick);

    var hero = el("header", "ctw-header");
    var headrow = el("div", "ctw-headrow");
    headrow.appendChild(el("p", "ctw-kicker", "🔒 Teacher Command Center · Local & private"));
    headrow.appendChild(el("p", "ctw-pacing-stamp", pacingStampText()));
    hero.appendChild(headrow);
    // Deliberately NOT "Plan it. Teach it. Launch it." — #district-pacing-console
    // owns that hero ~2200px up this page, and printing it twice made the
    // cockpit read as a duplicate of a panel the teacher already scrolled past.
    // Naming the live sequence instead states what this cockpit is pointed at.
    hero.appendChild(el("h2", null, pacingHeadingText()));
    hero.appendChild(
      el(
        "p",
        null,
        "Everything for the lesson you pick — launch links, student supports, small groups and printables, plus the week ahead and tomorrow's plan.",
      ),
    );
    panel.appendChild(hero);
    var tabs = el("nav", "ctw-tabs");
    tabs.setAttribute("aria-label", "Teacher workflow views");
    [
      ["today", "Today's Teaching"],
      ["week", "Weekly Pacing"],
      ["playlist", "Student Playlist"],
      ["unit", "Unit Map"],
      ["next", "Next-Day Plan"],
    ].forEach(function (entry) {
      var tab = button(entry[1], function () {
        state.view = entry[0];
        saveState();
        renderPanel();
      });
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
    // Only the launch manifest is required to build the panel; supports /
    // workflow / uifr are enrichment, so a single missing/404 enrichment file
    // must NOT take down the entire teacher planning UI (previously any one
    // rejection killed the whole Promise.all and the panel silently vanished).
    Promise.all([
      getJson("/data/curriculum-launch-manifest.json"),
      getJson("/data/curriculum-supports.json").catch(function () {
        return {};
      }),
      getJson("/data/curriculum-teacher-workflow.json").catch(function () {
        return {};
      }),
      getJson("/data/curriculum-uifr-level4.json").catch(function () {
        return {};
      }),
    ])
      .then(function (results) {
        DATA.launch = results[0] || {};
        DATA.supports = results[1];
        DATA.workflow = results[2];
        DATA.uifr = results[3];
        lessons = DATA.launch.lessons || [];
        // No lessons → nothing to plan against; bail before touching lessons[0].
        if (!lessons.length) return;
        lessons.forEach(function (lesson) {
          lessonsById[lesson.id] = lesson;
        });
        (DATA.launch.smallGroups || []).forEach(function (group) {
          lessonsById[group.id] = group;
          (smallGroupsByParent[group.parent] = smallGroupsByParent[group.parent] || []).push(group);
        });
        (DATA.launch.catchUps || []).forEach(function (catchUp) {
          lessonsById[catchUp.id] = catchUp;
          (catchUpsByParent[catchUp.parent] = catchUpsByParent[catchUp.parent] || []).push(catchUp);
        });
        (DATA.launch.endOfUnit || []).forEach(function (project) {
          lessonsById[project.id] = project;
          endOfUnitByUnit[project.unit] = project;
        });
        if (!lessonsById[state.selected]) state.selected = lessons[0].id;
        var anchor = document.querySelector(".wrap");
        if (!anchor?.parentNode) return;
        anchor.parentNode.insertBefore(buildPanel(), anchor);
        // Public selection bridge so the Units & Lessons library can drive the
        // cockpit (Option 1 merge): the library's "Teach / Launch" control calls
        // select(id) to load a lesson here and scroll up; the bridge reads
        // getSelected() to open the cockpit's lesson down in the library.
        window.CurriculumCockpit = {
          getSelected: function () {
            return state.selected;
          },
          onSelect: function (cb) {
            if (typeof cb === "function") selectListeners.push(cb);
          },
          // select(id, { scroll = true, silent = false })
          //   scroll:false → sync selection without yanking the viewport (used
          //     for live cockpit↔library sync).
          //   silent:true  → don't notify listeners (prevents echo when the
          //     call itself originates from a library-driven sync).
          select: function (id, opts) {
            if (!id || !lessonsById[id]) return false;
            opts = opts || {};
            state.selected = id;
            state.view = "today";
            saveState();
            updateRecent(id);
            renderPanel();
            if (opts.scroll !== false) {
              try {
                var node = panel || document.getElementById("curriculum-teacher-workflow");
                node.scrollIntoView({
                  behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
                    ? "auto"
                    : "smooth",
                  block: "start",
                });
              } catch (_e) {}
            }
            if (!opts.silent) fireSelect();
            return true;
          },
        };
        window.CurriculumTeacherPlanning?.organizeTools?.();
        syncTeacherMode();
        new MutationObserver(syncTeacherMode).observe(document.body, {
          attributes: true,
          attributeFilter: ["class"],
        });
        // Shared cleanup for the planning views' printView() (Weekly Pacing,
        // Unit Map, etc.), which toggle body.ctw-printing. The "Print lesson
        // plan" button manages its own ctw-plan-printing lifecycle separately.
        window.addEventListener("afterprint", function () {
          document.body.classList.remove("ctw-printing");
        });
      })
      .catch(function (error) {
        console.error("Teacher workflow unavailable", error);
      });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
