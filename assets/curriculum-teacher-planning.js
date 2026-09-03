/** Weekly pacing, playlists, unit maps, and aggregate next-day planning. */
(function () {
  "use strict";

  var DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

  function option(documentRef, value, label) {
    var node = documentRef.createElement("option");
    node.value = value;
    node.textContent = label;
    return node;
  }

  /* ── The district's teaching order — ONE derivation, two readers ───────────
   * WHICH units and lessons exist is the curriculum's answer; WHAT ORDER they
   * are taught in is the district's, and they are not the same answer. The
   * manifest numbers units 1..10; this district teaches Pre, 3, 4, 6, 7, 8, 9,
   * 5, 2, 10, and assembles the Pre-Unit out of lessons that live in four
   * different canonical units (1-1, 2-6, 2-7, 6-1, 6-2).
   *
   * The Class → Unit → Lesson picker got this right and the Unit Map did not:
   * the map listed units 1,2,3… and read membership off `lesson.unit`, so a
   * teacher in November scrolled past six units they teach in spring, and
   * "Unit 1" showed the "Math Is…" arc instead of the Pre-Unit sequence they
   * were actually teaching (Joel, 2026-09-01: "the teacher command center unit
   * map doesn't follow correct sequence of lessons"). Two views of one
   * curriculum on one page disagreed about the order of the year.
   *
   * So the derivation lives here once and both call it. Sources, unchanged:
   *   unit ORDER + district labels   data/pacing-unit-ranges.json
   *   assembled unit MEMBERSHIP      data/pacing-unit-lessons.json
   * Both are ADVISORY: unreadable means fall back to manifest order, never an
   * empty list. Teaching continues when planning data does not.
   */
  function deriveUnitSequence(lessons, projects, pacing, authored, assessments) {
    var lessonsByUnit = Object.create(null);
    var manifestOrder = [];
    var byId = Object.create(null);
    (lessons || []).forEach(function (l) {
      var key = String(l.unit);
      if (!lessonsByUnit[key]) {
        lessonsByUnit[key] = [];
        manifestOrder.push(key);
      }
      lessonsByUnit[key].push(l);
      byId[l.id] = l;
    });

    /* End-of-unit culminating projects go LAST in their unit, because that is
     * when they are taught — the multi-day performance task at the end, not
     * lesson zero. Appended rather than merged so a unit with no project simply
     * has no project row instead of a dead one. */
    var projectsByUnit = Object.create(null);
    (projects || []).forEach(function (p) {
      if (!p || !p.resources || !p.resources.lesson) return;
      var key = String(p.unit);
      (projectsByUnit[key] = projectsByUnit[key] || []).push(p);
    });

    /* MSTAR practice tests sit AFTER the final lesson and BEFORE the project:
     * they rehearse the unit a teacher just finished teaching, while the
     * project stays the unit's closing row — a placement the picker test pins.
     * Same dead-row rule as projects: no resource, no row. */
    var assessmentsByUnit = Object.create(null);
    (assessments || []).forEach(function (t) {
      if (!t || !t.resources || !t.resources.lesson) return;
      var key = String(t.unit);
      (assessmentsByUnit[key] = assessmentsByUnit[key] || []).push(t);
    });

    var authoredUnits = (authored && authored.units) || {};
    var authoredLessons = Object.create(null);
    var labels = Object.create(null);
    var order = [];
    ((pacing && pacing.units) || []).forEach(function (entry) {
      // MSTAR and friends carry no curriculumUnit and own no lessons: they are
      // pacing entries, not units of this list.
      if (!entry || entry.curriculumUnit == null) return;
      var key = String(entry.curriculumUnit);
      if (order.indexOf(key) !== -1) return;

      var authoredEntry = authoredUnits[entry.key];
      if (authoredEntry && Array.isArray(authoredEntry.lessons)) {
        /* Resolve ids against the manifest and drop anything it does not have,
         * so a retired lesson leaves a shorter sequence rather than a dead row.
         * validate:pacing-unit-order fails on that mismatch, so the silent
         * shortening cannot survive a build. */
        var resolved = authoredEntry.lessons
          .map(function (id) {
            return byId[id];
          })
          .filter(Boolean);
        if (resolved.length) authoredLessons[key] = resolved;
      }

      if (!lessonsByUnit[key] && !authoredLessons[key]) return;
      order.push(key);
      if (entry.districtLabel) labels[key] = entry.districtLabel;
    });
    /* A unit the pacing plan does not mention is APPENDED, never dropped: the
     * curriculum is the authority on what exists, and silently hiding a real
     * unit because a schedule forgot it is the worse failure. */
    manifestOrder.forEach(function (key) {
      if (order.indexOf(key) === -1) order.push(key);
    });

    return {
      order: order,
      /* The district's own label when the pacing plan gives one ("Unit 3:
       * Ratios & Rates", "Pre-Unit: Course 1 Pre Unit") — the teacher is
       * following that document, and the Pre-Unit is not called "Unit 1" on
       * it. Plain "Unit N" otherwise. */
      label: function (key) {
        return labels[String(key)] || "Unit " + key;
      },
      /* An authored sequence wins for THIS unit only; every other unit keeps its
       * ordinary manifest membership and order. Entries are tagged so a caller
       * can label a project differently from a lesson without re-deriving which
       * is which. */
      entriesFor: function (unit) {
        var key = String(unit);
        var out = (authoredLessons[key] || lessonsByUnit[key] || []).map(function (l) {
          return { item: l, kind: "lesson" };
        });
        (assessmentsByUnit[key] || []).forEach(function (t) {
          out.push({ item: t, kind: "assessment" });
        });
        (projectsByUnit[key] || []).forEach(function (p) {
          out.push({ item: p, kind: "project" });
        });
        return out;
      },
      /* Which unit key a lesson is shown under in DISTRICT order. A lesson
       * listed in an assembled unit is still its own canonical unit's lesson —
       * 2-6 appears in the Pre-Unit AND in Unit 2 — so this answers "where does
       * the map open when this lesson is selected?", preferring the assembled
       * unit the district actually teaches it in. */
      unitOf: function (lessonId) {
        for (var i = 0; i < order.length; i += 1) {
          var key = order[i];
          var seq = authoredLessons[key];
          if (seq && seq.some((l) => l.id === lessonId)) return key;
        }
        return null;
      },
    };
  }

  /* The pacing files are fetched once per page and shared. window.NTJsonCache is
   * what three other hub scripts already use for these paths, so the Unit Map
   * costs no extra request on a page whose picker has already loaded them. */
  var pacingPromise = null;
  function loadPacingSources() {
    if (pacingPromise) return pacingPromise;
    var cache = window.NTJsonCache;
    function get(path) {
      return (
        cache
          ? cache.json(path)
          : fetch(path, { credentials: "same-origin" }).then(function (r) {
              if (!r.ok) throw new Error(String(r.status));
              return r.json();
            })
      ).catch(function () {
        return null;
      });
    }
    pacingPromise = Promise.all([
      get("/data/pacing-unit-ranges.json"),
      get("/data/pacing-unit-lessons.json"),
    ]).then(function (r) {
      return { pacing: r[0], authored: r[1] };
    });
    return pacingPromise;
  }

  function lessonSelect(context, value) {
    var select = context.el("select", "ctw-select");
    select.appendChild(option(document, "", "No lesson selected"));
    context.lessons.forEach(function (lesson) {
      select.appendChild(
        option(document, lesson.id, `Unit ${lesson.unit} · ${lesson.id} · ${lesson.title}`),
      );
    });
    select.value = context.lessonsById[value] ? value : "";
    return select;
  }

  function heading(context, title, copy) {
    var header = context.el("div", "ctw-planning-heading");
    header.appendChild(context.el("h3", null, title));
    header.appendChild(context.el("p", "ctw-muted", copy));
    return header;
  }

  function copyText(text, event) {
    var button = event.currentTarget;
    var done = function () {
      var label = button.textContent;
      button.textContent = "✓ Copied";
      setTimeout(function () {
        button.textContent = label;
      }, 1200);
    };
    navigator.clipboard?.writeText ? navigator.clipboard.writeText(text).then(done, done) : done();
  }

  function printView() {
    document.body.classList.add("ctw-printing");
    window.print();
  }

  function renderWeek(stage, context) {
    context.state.week = context.state.week || {};
    var card = context.el("section", "ctw-planning-card");
    card.appendChild(
      heading(
        context,
        "Weekly Pacing",
        "Choose one lesson for each day. The plan stays in this browser.",
      ),
    );
    var grid = context.el("div", "ctw-planning-grid");
    DAYS.forEach(function (day) {
      var row = context.el("div", "ctw-week-row");
      row.appendChild(context.el("strong", "ctw-day", day));
      var select = lessonSelect(context, context.state.week[day]);
      select.setAttribute("aria-label", `${day} lesson`);
      select.addEventListener("change", function () {
        context.state.week[day] = select.value;
        context.saveState();
      });
      row.appendChild(select);
      row.appendChild(
        context.button("Clear", function () {
          select.value = "";
          context.state.week[day] = "";
          context.saveState();
        }),
      );
      grid.appendChild(row);
    });
    card.appendChild(grid);

    /* Fill from the pacing plan.
     *
     * Plan Week decides HOW the week is taught; the Pacing Planner decides WHEN
     * each lesson happens. Before this, the two did not speak, so the teacher
     * picked the same five lessons twice — once in the planner and again here.
     *
     * The planner's live overlay is read from this device first
     * (localStorage["nt-pacing:overlay"], written by curriculum/planning/
     * planning-store.js) and the published baseline is the fallback, so this
     * still fills sensibly on a device that has never opened the planner. The
     * baseline is fetched ON CLICK, not on load: it is ~400 KB and this page is
     * student-facing with a request budget. */
    var status = context.el("p", "ctw-muted");
    card.appendChild(status);

    function mondayOf(date) {
      var d = new Date(date.getTime());
      d.setHours(12, 0, 0, 0);
      d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
      return d.toISOString().slice(0, 10);
    }

    function readOverlay() {
      try {
        return JSON.parse(localStorage.getItem("nt-pacing:overlay")) || {};
      } catch (_e) {
        return {};
      }
    }

    function fillFromPlan() {
      status.textContent = "Reading the pacing plan…";
      fetch("/data/pacing-baseline-2026-27.json")
        .then(function (r) {
          if (!r.ok) throw new Error("unavailable");
          return r.json();
        })
        .then(function (baseline) {
          var overlay = readOverlay();
          var monday = mondayOf(new Date());
          if (monday < baseline.firstStudentDay)
            monday = mondayOf(new Date(baseline.firstStudentDay + "T12:00:00Z"));
          var filled = 0;
          DAYS.forEach(function (day, i) {
            var iso = new Date(Date.parse(monday + "T12:00:00Z") + i * 86400000)
              .toISOString()
              .slice(0, 10);
            var entry = baseline.days.find(function (d) {
              return d.date === iso;
            });
            if (!entry) return;
            var plan = Object.assign({}, entry.plan, (overlay[iso] || {}).plan || {});
            var id = context.lessonsById[plan.lessonId] ? plan.lessonId : "";
            context.state.week[day] = id;
            if (id) filled++;
          });
          context.saveState();
          renderWeek(stage, context);
          status.textContent =
            filled > 0
              ? `Filled ${filled} day${filled === 1 ? "" : "s"} from the pacing plan for the week of ${monday}.`
              : `The pacing plan has no core lessons scheduled for the week of ${monday}.`;
        })
        .catch(function () {
          status.textContent =
            "The pacing plan could not be read just now. Choose lessons by hand, or open the Pacing Planner.";
        });
    }

    var actions = context.el("div", "ctw-planning-actions");
    actions.appendChild(context.button("Fill from the pacing plan", fillFromPlan));
    actions.appendChild(
      context.button("Copy week", function (event) {
        var text = DAYS.map(function (day) {
          var lesson = context.lessonsById[context.state.week[day]];
          return `${day}: ${lesson ? `${lesson.id} · ${lesson.title}` : "Open / flex day"}`;
        }).join("\n");
        copyText(`WEEKLY MATH PLAN\nClass ${context.state.section}\n\n${text}`, event);
      }),
    );
    actions.appendChild(context.button("Print week", printView));
    actions.appendChild(
      context.button("Clear entire week", function () {
        context.state.week = {};
        context.saveState();
        renderWeek(stage, context);
      }),
    );
    card.appendChild(actions);
    stage.replaceChildren(card);
  }

  function renderPlaylist(stage, context) {
    context.state.playlist = (context.state.playlist || [])
      .filter(function (id) {
        return context.lessonsById[id];
      })
      .slice(0, 20);
    var card = context.el("section", "ctw-planning-card");
    card.appendChild(
      heading(
        context,
        "Student Playlist",
        "Build one ordered, distraction-free link for students. Teacher resources are never included.",
      ),
    );
    var addRow = context.el("div", "ctw-selectors");
    var select = lessonSelect(context, context.state.selected);
    addRow.appendChild(select);
    addRow.appendChild(
      context.button(
        "Add lesson",
        function () {
          if (select.value && !context.state.playlist.includes(select.value)) {
            context.state.playlist.push(select.value);
            context.saveState();
            renderPlaylist(stage, context);
          }
        },
        "ctw-primary",
      ),
    );
    card.appendChild(addRow);
    var list = context.el("div", "ctw-planning-grid");
    context.state.playlist.forEach(function (id, index) {
      var lesson = context.lessonsById[id];
      var row = context.el("div", "ctw-playlist-row");
      row.appendChild(context.el("strong", "ctw-row-title", String(index + 1)));
      var copy = context.el("div", "ctw-row-copy");
      copy.appendChild(context.el("strong", null, `${lesson.id} · ${lesson.title}`));
      copy.appendChild(context.el("p", null, lesson.objective));
      row.appendChild(copy);
      var actions = context.el("div", "ctw-planning-actions");
      actions.appendChild(
        context.button("↑", function () {
          if (index < 1) return;
          context.state.playlist.splice(index - 1, 0, context.state.playlist.splice(index, 1)[0]);
          context.saveState();
          renderPlaylist(stage, context);
        }),
      );
      actions.appendChild(
        context.button("↓", function () {
          if (index >= context.state.playlist.length - 1) return;
          context.state.playlist.splice(index + 1, 0, context.state.playlist.splice(index, 1)[0]);
          context.saveState();
          renderPlaylist(stage, context);
        }),
      );
      actions.appendChild(
        context.button("Remove", function () {
          context.state.playlist.splice(index, 1);
          context.saveState();
          renderPlaylist(stage, context);
        }),
      );
      row.appendChild(actions);
      list.appendChild(row);
    });
    if (!context.state.playlist.length)
      list.appendChild(
        context.el("p", "ctw-empty", "Add lessons in the order students should complete them."),
      );
    card.appendChild(list);
    if (context.state.playlist.length) {
      var url = context.studentUrl(context.state.playlist);
      var footer = context.el("div", "ctw-planning-actions");
      footer.appendChild(context.link("Preview student playlist", url, "ctw-student"));
      footer.appendChild(
        context.button("Copy playlist link", function (event) {
          copyText(url, event);
        }),
      );
      footer.appendChild(
        context.button("Clear playlist", function () {
          context.state.playlist = [];
          context.saveState();
          renderPlaylist(stage, context);
        }),
      );
      card.appendChild(footer);
    }
    stage.replaceChildren(card);
  }

  function renderUnit(stage, context) {
    var selected = context.lessonsById[context.state.selected] || context.lessons[0];
    var card = context.el("section", "ctw-planning-card");
    card.appendChild(
      heading(
        context,
        "Unit Map",
        "Scan the sequence, readiness, standards, timing, and student launch for every lesson — in the order the district teaches them.",
      ),
    );
    var unitSelect = context.el("select", "ctw-select");
    card.appendChild(unitSelect);
    var list = context.el("div", "ctw-planning-grid");
    card.appendChild(list);
    stage.replaceChildren(card);

    /* The unit dropdown and every row below it are ordered by the DISTRICT's
     * sequence, not the curriculum's numbering, and assembled units (the
     * Pre-Unit) list their authored membership — the same derivation the
     * Class → Unit → Lesson picker on this page uses, so the two cannot
     * disagree about the order of the year. See deriveUnitSequence().
     *
     * The pacing files are advisory and load asynchronously, so the map paints
     * once, when the order is known, rather than painting the manifest order
     * first and re-sorting under the teacher's eyes. */
    loadPacingSources().then(function (sources) {
      var sequence = deriveUnitSequence(
        context.lessons,
        (context.data && context.data.launch && context.data.launch.endOfUnit) || [],
        sources.pacing,
        sources.authored,
        (context.data && context.data.launch && context.data.launch.unitAssessments) || [],
      );
      if (!sequence.order.length) return;
      sequence.order.forEach(function (key) {
        unitSelect.appendChild(option(document, key, sequence.label(key)));
      });
      /* Open on the unit the SELECTED lesson is taught in. For a lesson the
       * district pulled into an assembled unit (2-6 is taught in the Pre-Unit)
       * that is the assembled unit, not its canonical number — otherwise
       * picking the lesson the teacher is on lands them in a unit they teach
       * in March. */
      var openAt = selected ? sequence.unitOf(selected.id) || String(selected.unit) : null;
      unitSelect.value =
        openAt && sequence.order.indexOf(openAt) !== -1 ? openAt : sequence.order[0];

      function paint() {
        list.replaceChildren();
        sequence.entriesFor(unitSelect.value).forEach(function (entry) {
          var lesson = entry.item;
          var row = context.el("article", "ctw-unit-row");
          var title = context.el("div", "ctw-row-copy");
          title.appendChild(
            context.el(
              "strong",
              "ctw-row-title",
              entry.kind === "project" ? `🏆 ${lesson.title}` : `${lesson.id} · ${lesson.title}`,
            ),
          );
          /* A culminating project carries no standard or per-lesson timing the
           * way a lesson does; saying "undefined · undefined · Ready" would be
           * worse than saying what it is. */
          title.appendChild(
            context.el(
              "p",
              null,
              entry.kind === "project"
                ? "End-of-unit culminating project"
                : `${lesson.standard} · ${lesson.timeEstimate} · Ready`,
            ),
          );
          row.appendChild(title);
          var objective = context.el("div", "ctw-row-copy");
          objective.appendChild(context.el("p", null, lesson.objective || ""));
          if (lesson.languageObjective) {
            objective.appendChild(context.el("p", null, `Language: ${lesson.languageObjective}`));
          }
          row.appendChild(objective);
          var actions = context.el("div", "ctw-planning-actions");
          if (lesson.resources && lesson.resources.lesson) {
            actions.appendChild(
              context.link(
                entry.kind === "project" ? "Open project" : "Teach",
                lesson.resources.lesson,
              ),
            );
          }
          if (entry.kind === "lesson") {
            actions.appendChild(
              context.link("Student launch", context.studentUrl(lesson), "ctw-student"),
            );
          }
          row.appendChild(actions);
          list.appendChild(row);
        });
      }
      unitSelect.addEventListener("change", paint);
      paint();
    });
  }

  function recommendation(context, title, count, text, href) {
    var card = context.el("article", "ctw-recommendation");
    card.appendChild(context.el("h4", null, `${title} · ${count}`));
    card.appendChild(context.el("p", null, text));
    if (href) card.appendChild(context.link("Open resource", href));
    return card;
  }

  function renderNextDay(stage, context) {
    var lesson = context.lessonsById[context.state.selected] || context.lessons[0];
    context.state.evidence = context.state.evidence || {};
    var evidence = Object.assign(
      { ready: 0, developing: 0, reteach: 0 },
      context.state.evidence[lesson.id],
    );
    var card = context.el("section", "ctw-planning-card");
    card.appendChild(
      heading(
        context,
        "Next-Day Plan",
        `Enter aggregate exit-ticket counts for ${lesson.id} · ${lesson.title}. Do not enter student names.`,
      ),
    );
    var lessonPicker = lessonSelect(context, lesson.id);
    lessonPicker.addEventListener("change", function () {
      context.state.selected = lessonPicker.value;
      context.saveState();
      renderNextDay(stage, context);
    });
    card.appendChild(lessonPicker);
    var counts = context.el("div", "ctw-evidence-grid");
    [
      ["ready", "Ready"],
      ["developing", "Developing"],
      ["reteach", "Reteach"],
    ].forEach(function (entry) {
      var input = context.el("input", "ctw-input");
      input.type = "number";
      input.min = "0";
      input.max = "99";
      input.inputMode = "numeric";
      input.value = String(evidence[entry[0]] || 0);
      input.addEventListener("input", function () {
        evidence[entry[0]] = Math.max(0, Math.min(99, Number(input.value) || 0));
        context.state.evidence[lesson.id] = evidence;
        context.saveState();
        paintRecommendations();
      });
      counts.appendChild(
        (function () {
          var label = context.el("label", "ctw-field");
          label.appendChild(context.el("span", null, entry[1]));
          label.appendChild(input);
          return label;
        })(),
      );
    });
    card.appendChild(counts);
    card.appendChild(
      context.el(
        "p",
        "ctw-muted",
        "Privacy: only group counts are stored locally. No names, IDs, or responses are collected.",
      ),
    );
    var results = context.el("div", "ctw-recommendations");
    card.appendChild(results);

    function paintRecommendations() {
      results.replaceChildren();
      results.appendChild(
        recommendation(
          context,
          "Extend",
          evidence.ready,
          "Use the challenge, game, project, or ask students to prove the idea a second way.",
          lesson.resources.lesson,
        ),
      );
      results.appendChild(
        recommendation(
          context,
          "Core practice",
          evidence.developing,
          "Use guided notes, a sentence frame, partner explanation, and one new check.",
          lesson.resources.guidedNotes || lesson.resources.handout,
        ),
      );
      results.appendChild(
        recommendation(
          context,
          "Reteach",
          evidence.reteach,
          "Start with the prerequisite and visual model, then retry one grade-level problem.",
          lesson.resources.studentHelp || lesson.resources.lesson,
        ),
      );
    }
    paintRecommendations();
    var actions = context.el("div", "ctw-planning-actions");
    actions.appendChild(
      context.button("Copy next-day plan", function (event) {
        copyText(
          [
            `NEXT-DAY PLAN — ${lesson.id}: ${lesson.title}`,
            `Ready (${evidence.ready}): extension or second proof.`,
            `Developing (${evidence.developing}): guided notes + sentence frame + new check.`,
            `Reteach (${evidence.reteach}): prerequisite + visual model + one grade-level retry.`,
          ].join("\n"),
          event,
        );
      }),
    );
    actions.appendChild(context.button("Print plan", printView));
    card.appendChild(actions);
    stage.replaceChildren(card);
  }

  /* ── The teacher workspace ──────────────────────────────────────────────────
   * /curriculum/ had grown into a directory of everything the platform can do:
   * 42 teacher destinations, 21 of them inside a drawer that is collapsed by
   * default. A teacher opening it could not answer "where do I teach, plan and
   * find supports" without reading the whole page.
   *
   * This block answers those three questions above everything else, in the
   * order they actually matter — Lessons dominant, Planner and Supports beside
   * each other, More as a plain link. It ADDS no destinations and REMOVES none:
   * every link here already existed somewhere on the page, and everything that
   * was on the page is still on the page below it.
   *
   * No fetches. Everything rendered here is either a static route or already in
   * the DOM (the resume strip's lesson), because a navigation surface that
   * waits on data is slower than the page it replaced.
   */
  /* ── Class Section → Unit → Lesson ─────────────────────────────────────────
   * The Teach band's browse control.
   *
   * CLASS SECTION is 601 / 602 / 603 — the teacher's class periods. It
   * establishes WHICH CLASS is being taught; it does NOT filter the
   * curriculum, because all three classes are taught the same Grade 6
   * curriculum. Unit filters lessons; class does not filter units.
   *
   * This replaced a first cut that read "section" as the MCCRS standards
   * DOMAIN (Algebraic Thinking, Geometric Reasoning, …) and filtered units by
   * it. That was the wrong noun: it made the class period look like a
   * curricular hierarchy and hid two thirds of the curriculum behind a choice
   * that has nothing to do with which lessons exist. The domain data is
   * untouched and still used elsewhere — it simply is not this control.
   *
   * SOURCES OF TRUTH, both existing:
   *   the class list      assets/learning-supports/supports-schema.js SECTIONS
   *   the chosen class    curriculumTeacherWorkflow:v1.section, the key the
   *                       Teacher Workflow card's own class selector already
   *                       writes — so picking 602 here and picking 602 there
   *                       are the same act
   *   units + lessons     data/curriculum-launch-manifest.json, via
   *                       window.NTJsonCache, which three other hub scripts
   *                       already use for this exact file. No extra request.
   *   unit ORDER          data/pacing-unit-ranges.json, generated by
   *                       tools/import-pacing-baseline.mjs from the district
   *                       plan. See the note below — this is a separate source
   *                       from the manifest ON PURPOSE.
   *
   * FAILURE. Anything that goes wrong is confined to this band. The rest of
   * /curriculum/ is untouched, and the band falls back to the browse and search
   * links that were always there.
   */

  /* The canonical class list is supports-schema.js SECTIONS. It is read from
   * window.EWLSupportsSchema when that schema is loaded and otherwise falls
   * back to this, which tools/hub-lesson-picker.test.mjs pins against the
   * schema file so the two cannot drift. */
  var SECTION_FALLBACK = ["601", "602", "603"];
  var TEACHER_STATE_KEY = "curriculumTeacherWorkflow:v1";
  var PICK_LS = "nt-hub-lesson-pick";

  function classSections() {
    try {
      var schema = window.EWLSupportsSchema;
      if (schema && Array.isArray(schema.sections) && schema.sections.length) {
        return schema.sections.slice();
      }
    } catch (_e) {
      /* fall through */
    }
    return SECTION_FALLBACK.slice();
  }

  /** Read/write the class through the teacher state that already owns it. */
  function readTeacherState() {
    try {
      return JSON.parse(localStorage.getItem(TEACHER_STATE_KEY) || "{}") || {};
    } catch (_e) {
      return {};
    }
  }

  function writeTeacherSection(value) {
    try {
      var state = readTeacherState();
      if (value) state.section = value;
      else delete state.section;
      localStorage.setItem(TEACHER_STATE_KEY, JSON.stringify(state));
    } catch (_e) {
      /* private mode — the picker still works, it just does not remember */
    }
  }

  function fillOptions(select, items, placeholder) {
    select.replaceChildren();
    select.appendChild(option(document, "", placeholder));
    items.forEach(function (item) {
      select.appendChild(option(document, item.value, item.label));
    });
  }

  function mountLessonPicker(ws) {
    var sectionSel = ws.querySelector("#tws-section");
    var unitSel = ws.querySelector("#tws-unit");
    var lessonSel = ws.querySelector("#tws-lesson");
    var openBox = ws.querySelector("#tws-open");
    if (!sectionSel || !unitSel || !lessonSel || !openBox) return;

    var cache = window.NTJsonCache;
    function loadJson(path) {
      return cache
        ? cache.json(path)
        : fetch(path, { credentials: "same-origin" }).then(function (r) {
            if (!r.ok) throw new Error(String(r.status));
            return r.json();
          });
    }

    // The unit ORDER is a separate fetch because it is a separate question. The
    // manifest answers "what is the canonical curriculum?"; the pacing ranges
    // answer "in what order does the district teach it?". Merging the two would
    // put a scheduling decision inside the curriculum's source of truth, where a
    // pacing correction would look like a curriculum edit.
    //
    // Pacing is ADVISORY here and never fatal: a missing or unreadable ranges
    // file leaves the picker on manifest order rather than leaving the teacher
    // with no lesson list at all. Teaching continues when planning data does not.
    var request = Promise.all([
      loadJson("/data/curriculum-launch-manifest.json"),
      loadJson("/data/pacing-unit-ranges.json").catch(function () {
        return null;
      }),
      /* Authored lesson sequences for units whose membership is an instructional
       * decision rather than the curriculum's numbering — the Pre-Unit is one.
       * Advisory like the pacing plan: unreadable means fall back to manifest
       * membership, never means an empty Lesson dropdown. */
      loadJson("/data/pacing-unit-lessons.json").catch(function () {
        return null;
      }),
    ]);

    request.then(
      function (results) {
        setup(results[0], results[1], results[2]);
      },
      function () {
        fillOptions(sectionSel, [], "Lessons could not be loaded");
        sectionSel.disabled = true;
        openBox.replaceChildren();
        var p = document.createElement("p");
        p.className = "tws-pick-error";
        p.textContent = "The lesson list could not be loaded. ";
        var retry = document.createElement("button");
        retry.type = "button";
        retry.className = "tws-btn ghost";
        retry.textContent = "Try again";
        retry.addEventListener("click", function () {
          window.location.reload();
        });
        p.appendChild(retry);
        openBox.appendChild(p);
      },
    );

    function setup(manifest, pacing, authored) {
      var lessons = (manifest && manifest.lessons) || [];
      // Small-group and catch-up variants, keyed by the core lesson they belong
      // to — the manifest already carries the relationship, so nothing here
      // infers a variant's purpose from its number.
      var variantsByParent = Object.create(null);
      function addVariant(entry, fallbackLabel, shortLabel) {
        if (!entry || !entry.parent || !entry.resources || !entry.resources.lesson) return;
        (variantsByParent[entry.parent] = variantsByParent[entry.parent] || []).push({
          id: entry.id,
          title: entry.title || fallbackLabel,
          shortLabel: shortLabel,
          href: entry.resources.lesson,
          resources: entry.resources,
        });
      }
      (manifest.smallGroups || []).forEach(function (g) {
        addVariant(g, "Small group", g.group ? "Group " + g.group : "Small group");
      });
      (manifest.catchUps || []).forEach(function (c) {
        addVariant(c, "Catch-up", "Catch-up");
      });

      /* Part 2 — the second day of the SAME lesson, where the Reveal Apply word
       * problem is now taught. It is deliberately NOT a variant: a variant is a
       * different version of the lesson for a different group of students, and
       * Part 2 is the same lesson for the same students on the next day. So it
       * is offered in the top action row beside "Open whole-group lesson"
       * rather than under the "Small-group lessons" label, which would tell a
       * teacher the opposite of what is true. */
      var partTwoByParent = Object.create(null);
      (manifest.partTwo || []).forEach(function (p2) {
        if (!p2 || !p2.parent || !p2.resources || !p2.resources.lesson) return;
        partTwoByParent[p2.parent] = p2;
      });

      /* End-of-unit culminating projects are offered at the BOTTOM of the Lesson
       * dropdown and open through the same expansion as a lesson, so a teacher
       * reaches the project the same way they reach anything else they teach.
       * deriveUnitSequence() places them; see its note. */

      /* renderOpen resolves whatever the Lesson dropdown selected, and that is
       * now lessons AND projects. Looking only at `lessons` is why an option can
       * be selectable and expand to nothing. */
      var openable = lessons.concat(manifest.endOfUnit || [], manifest.unitAssessments || []);

      /* The district's order, derived in ONE place this file shares with the
       * Unit Map — see deriveUnitSequence(). Class section does not appear in it
       * at all: all three classes are taught the same curriculum in the same
       * district order. */
      var sequence = deriveUnitSequence(
        lessons,
        manifest.endOfUnit,
        pacing,
        authored,
        manifest.unitAssessments,
      );
      var unitOrder = sequence.order;

      var classes = classSections().map(function (id) {
        return { value: id, label: id };
      });
      if (!classes.length || !unitOrder.length) {
        fillOptions(sectionSel, [], "No classes available");
        sectionSel.disabled = true;
        return;
      }
      fillOptions(sectionSel, classes, "Select class");

      function unitItems() {
        return unitOrder.map(function (u) {
          return { value: u, label: sequence.label(u) };
        });
      }

      function lessonsFor(unit) {
        return sequence.entriesFor(unit).map(function (entry) {
          return entry.kind === "project" || entry.kind === "assessment"
            ? { value: entry.item.id, label: entry.item.title }
            : { value: entry.item.id, label: entry.item.id + " · " + entry.item.title };
        });
      }

      function setDisabled(select, disabled, placeholder) {
        select.disabled = disabled;
        if (disabled) fillOptions(select, [], placeholder);
      }

      /* The lesson's parts, in the order a teacher meets them: what they teach
       * from, then what the student writes on, then what goes home. Each entry
       * is [manifest resource key, button label]. Nothing is rendered for a key
       * the manifest does not carry — see the note on dead buttons below. */
      var TEACH_PARTS = [
        ["guidedNotes", "Guided notes"],
        ["handout", "Student handout"],
        ["worksheet", "Worksheet"],
        ["worksheet2", "Worksheet B"],
        ["mstarWorksheet", "MSTAR practice"],
        ["exitTicket", "Exit ticket"],
      ];
      var HOME_PARTS = [
        ["homework", "Family homework"],
        ["familyPage", "Family page"],
        ["studentHelp", "Student help"],
      ];

      /* What a small-group or catch-up variant hands out, in the order the
       * teacher meets it at the table: the sheet the group writes on during the
       * session, then the packet that continues it afterwards. Same [manifest
       * key, label] shape and same dead-button rule as the parts above — a
       * catch-up has a worksheet and no practice set, and the manifest says so
       * per variant rather than this file guessing from the id. */
      var VARIANT_PARTS = [
        ["worksheet", "Worksheet"],
        ["worksheet2", "Worksheet B"],
        ["practice", "Practice Set"],
      ];

      /** One labelled row of links, appended only if it has something in it. */
      function partRow(lesson, parts, labelText, className) {
        var present = parts.filter(function (p) {
          return lesson.resources && lesson.resources[p[0]];
        });
        if (!present.length) return;
        var row = document.createElement("p");
        row.className = "tws-actions " + className;
        var label = document.createElement("span");
        label.className = "tws-open-label";
        label.textContent = labelText;
        row.appendChild(label);
        present.forEach(function (p) {
          var a = document.createElement("a");
          a.className = "tws-btn ghost";
          a.href = lesson.resources[p[0]];
          a.textContent = p[1];
          row.appendChild(a);
        });
        openBox.appendChild(row);
      }

      function renderOpen() {
        openBox.replaceChildren();
        var lesson = openable.filter(function (l) {
          return l.id === lessonSel.value;
        })[0];
        if (!lesson) return;

        var isProject = lesson.kind === "endOfUnit";
        var isAssessment = lesson.kind === "unitAssessment";
        var isLesson = !isProject && !isAssessment;

        var head = document.createElement("p");
        head.className = "tws-open-title";
        head.textContent = isLesson ? "Lesson " + lesson.id + " — " + lesson.title : lesson.title;
        openBox.appendChild(head);

        var row = document.createElement("p");
        row.className = "tws-actions tws-open-actions";

        // Only actions the manifest actually carries a route for. A dead button
        // on a lesson that has no small-group version is worse than no button,
        // because the teacher finds out at 7:55am.
        var lessonHref = (lesson.resources && lesson.resources.lesson) || null;
        if (lessonHref) {
          var a = document.createElement("a");
          a.className = "tws-btn";
          a.href = lessonHref;
          a.textContent = isProject
            ? "Open culminating project"
            : isAssessment
              ? "Open practice test"
              : "Open whole-group lesson";
          row.appendChild(a);
        }
        /* The class travels with the lesson, so the supports surface opens on
         * the configuration for the class being taught rather than the
         * all-class default. The lesson itself is canonical either way — this
         * is context, not a different lesson.
         *
         * Not offered for a culminating project: the supports catalogue is keyed
         * by lesson id, and `?lesson=unit-1-project` resolves to nothing there.
         * A button that opens an empty surface is the dead button this file
         * already refuses to render elsewhere. */
        /* Day 2 of this lesson, when it has one. 76 of the 84 core lessons do —
         * the 8 without are the "Math is…" mindset lessons whose Apply is a
         * reflection prompt, and they get no button rather than a dead one. */
        var p2 = isLesson ? partTwoByParent[lesson.id] : null;
        if (p2) {
          var p2a = document.createElement("a");
          p2a.className = "tws-btn ghost";
          p2a.href = p2.resources.lesson;
          p2a.textContent = "Open Part 2 · Apply";
          row.appendChild(p2a);
        }

        if (isLesson) {
          var supports = document.createElement("a");
          supports.className = "tws-btn ghost";
          supports.href =
            "/curriculum/student-supports/?lesson=" +
            encodeURIComponent(lesson.id) +
            (sectionSel.value ? "&section=" + encodeURIComponent(sectionSel.value) : "");
          supports.textContent = "Student supports";
          row.appendChild(supports);
        }
        openBox.appendChild(row);

        if (sectionSel.value) {
          var ctx = document.createElement("p");
          ctx.className = "tws-open-context";
          ctx.textContent = "Teaching class " + sectionSel.value + ".";
          openBox.appendChild(ctx);
        }

        var variants = variantsByParent[lesson.id] || [];
        if (variants.length) {
          var group = document.createElement("p");
          group.className = "tws-actions tws-open-variants";
          var label = document.createElement("span");
          label.className = "tws-open-label";
          label.textContent = "Small-group lessons";
          group.appendChild(label);
          variants.forEach(function (v) {
            var va = document.createElement("a");
            va.className = "tws-btn ghost";
            va.href = v.href;
            va.textContent = v.title;
            group.appendChild(va);
          });
          openBox.appendChild(group);

          /* One row per variant for what it hands out. Kept separate from the
           * lessons row above, and labelled with the group it belongs to,
           * because two groups' worksheets in one undifferentiated row is a
           * teacher printing Group 2's sheet for Group 1 at 7:55am. */
          variants.forEach(function (v) {
            partRow(
              v,
              VARIANT_PARTS,
              (v.shortLabel || v.title) + " printables",
              "tws-open-variant-parts",
            );
          });
        }

        /* Apply Day's own printables. Part 2 is day 2 of this lesson rather than
         * a small-group variant, so it is not in `variants` and got no row —
         * its worksheets were in the manifest and unreachable from this card. */
        if (p2) {
          partRow(p2, VARIANT_PARTS, "Part 2 · Apply printables", "tws-open-variant-parts");
        }

        /* Everything else the lesson ships with. Choosing a lesson here used to
         * offer two buttons and then send the teacher to /curriculum/units/ to
         * find the notes, the homework and the family page — the parts are all
         * in the manifest already, so the trip was pure navigation cost. */
        partRow(lesson, TEACH_PARTS, "Lesson materials", "tws-open-parts");
        partRow(lesson, HOME_PARTS, "Home & student support", "tws-open-home");
      }

      function remember() {
        try {
          localStorage.setItem(
            PICK_LS,
            JSON.stringify({
              section: sectionSel.value,
              unit: unitSel.value,
              lesson: lessonSel.value,
            }),
          );
        } catch (_e) {
          /* private mode — the picker still works, it just does not remember */
        }
      }

      sectionSel.addEventListener("change", function () {
        /* Changing class keeps Unit and Lesson exactly where they are. All
         * three classes are taught the same curriculum, so clearing them would
         * make "show me this same lesson for my next class" — the single most
         * common reason to touch this control — into a three-step chore. What
         * DOES change is the class context the expansion carries, and the class
         * the rest of the teacher tools consider current. */
        writeTeacherSection(sectionSel.value || null);
        renderOpen();
        remember();
      });

      unitSel.addEventListener("change", function () {
        // Changing unit resets the lesson: a Unit 5 lesson is not in Unit 6.
        var unit = unitSel.value;
        if (!unit) {
          setDisabled(lessonSel, true, "Choose a unit first");
        } else {
          var items = lessonsFor(unit);
          fillOptions(lessonSel, items, items.length ? "Select lesson" : "No lessons in this unit");
          lessonSel.disabled = !items.length;
        }
        openBox.replaceChildren();
        remember();
      });

      lessonSel.addEventListener("change", function () {
        renderOpen();
        remember();
      });

      /* Restore. The class comes from the teacher state that already owns it,
       * so a class chosen in the Teacher Workflow card is the class this
       * control opens on. Unit and lesson come from this control's own memory,
       * and each is dropped rather than approximated if it stops resolving
       * against the CURRENT curriculum. */
      var savedSection = readTeacherState().section;
      if (
        classes.some(function (c) {
          return c.value === savedSection;
        })
      ) {
        sectionSel.value = savedSection;
      }

      /* Unit and Lesson are available as soon as there is a curriculum. The
       * class is context, not a gate on the curriculum existing — which is the
       * correction this control exists to make. */
      var units = unitItems();
      fillOptions(unitSel, units, "Select unit");
      unitSel.disabled = !units.length;

      var saved = null;
      try {
        saved = JSON.parse(localStorage.getItem(PICK_LS) || "null");
      } catch (_e) {
        saved = null;
      }
      if (
        saved &&
        units.some(function (u) {
          return u.value === String(saved.unit);
        })
      ) {
        unitSel.value = String(saved.unit);
        var items = lessonsFor(saved.unit);
        fillOptions(lessonSel, items, "Select lesson");
        lessonSel.disabled = !items.length;
        if (
          items.some(function (i) {
            return i.value === saved.lesson;
          })
        ) {
          lessonSel.value = saved.lesson;
          renderOpen();
        }
      } else if (saved) {
        try {
          localStorage.removeItem(PICK_LS);
        } catch (_e) {
          /* nothing to clean up */
        }
      }
    }
  }

  function buildWorkspace(plannerCard) {
    if (document.querySelector(".tws")) return null;
    var ws = document.createElement("section");
    ws.className = "tws hub-teacher-only";
    ws.setAttribute("aria-label", "Teacher workspace");

    // "Continue Lesson 5-3" beats any description we could write — but only if
    // the resume strip actually resolved one. No invention.
    var resumeLink = document.querySelector("#resume-strip a[href]");
    var resumeHref = resumeLink && resumeLink.getAttribute("href");
    var resumeText = resumeLink && resumeLink.textContent.replace(/\s+/g, " ").trim();

    ws.innerHTML =
      '<div class="tws-lead">' +
      '<p class="tws-kicker">Teach</p>' +
      "<h2>Lessons</h2>" +
      '<p class="tws-sub">Choose your class, unit, and lesson.</p>' +
      // Three native <select>s. Native because a teacher gets their platform's
      // own picker — including the phone one — keyboard support, screen-reader
      // naming and type-ahead for free, and none of that is worth rebuilding.
      '<div class="tws-pick" role="group" aria-label="Choose a lesson">' +
      '<p class="tws-pick-field">' +
      '<label for="tws-section">Class Section</label>' +
      '<select id="tws-section"><option value="">Select class</option></select>' +
      "</p>" +
      '<p class="tws-pick-field">' +
      '<label for="tws-unit">Unit</label>' +
      '<select id="tws-unit" disabled><option value="">Choose a class first</option></select>' +
      "</p>" +
      '<p class="tws-pick-field">' +
      '<label for="tws-lesson">Lesson</label>' +
      '<select id="tws-lesson" disabled><option value="">Choose a unit first</option></select>' +
      "</p>" +
      "</div>" +
      '<div class="tws-open" id="tws-open" role="status" aria-live="polite"></div>' +
      '<p class="tws-actions">' +
      '<a class="tws-btn ghost" href="/curriculum/units/">Browse units &amp; lessons</a>' +
      '<a class="tws-btn ghost" href="#hub-content" data-tws="search">Search lessons</a>' +
      (resumeHref && resumeText
        ? '<a class="tws-btn ghost" href="' + resumeHref + '">' + resumeText + "</a>"
        : "") +
      "</p>" +
      "</div>" +
      '<div class="tws-pair">' +
      '<div class="tws-card">' +
      '<p class="tws-kicker">Plan</p>' +
      "<h2>Math Planner</h2>" +
      '<p class="tws-sub">Today, this week, the whole year. Move a lesson and see what shifts, and record what you actually taught.</p>' +
      '<p class="tws-actions"><a class="tws-btn" href="/curriculum/planning/">Open the planner</a></p>' +
      "</div>" +
      '<div class="tws-card">' +
      '<p class="tws-kicker">Support students</p>' +
      "<h2>Student Supports &amp; Accommodations</h2>" +
      '<p class="tws-sub">Choose the supports a lesson needs, see exactly what they change, and apply them — the interactive lesson and its small-group versions open with them already in place.</p>' +
      '<p class="tws-actions"><a class="tws-btn" href="/curriculum/student-supports/">Open supports</a></p>' +
      "</div>" +
      "</div>" +
      '<p class="tws-more"><a href="#ctw-more-tools" data-tws="more">More teacher tools</a> — planning documents, exports, Canvas, gradebook, AI tools and classroom utilities.</p>';

    // The Search action focuses the search box that already exists rather than
    // adding a second one.
    ws.querySelector('[data-tws="search"]').addEventListener("click", function (e) {
      var box = document.getElementById("curr-search");
      if (!box) return;
      e.preventDefault();
      box.scrollIntoView({ block: "center", behavior: "smooth" });
      box.focus();
    });
    // "More" opens the drawer it points at, so the link is never a dead anchor.
    ws.querySelector('[data-tws="more"]').addEventListener("click", function (e) {
      var drawer = document.querySelector("details.ctw-tools-drawer");
      if (!drawer) return;
      e.preventDefault();
      drawer.open = true;
      drawer.scrollIntoView({ block: "start", behavior: "smooth" });
      drawer.querySelector("summary")?.focus();
    });

    mountLessonPicker(ws);

    // The planner card keeps its full description below the workspace: the
    // workspace answers "where do I plan", the card explains what the planner
    // does. Losing it would trade discoverability for tidiness.
    if (plannerCard) plannerCard.classList.add("tws-has-card");
    return ws;
  }

  function organizeTools() {
    var tools = document.querySelector(".curriculum-tools-bar");
    if (!tools || tools.closest(".ctw-tools-drawer")) return;
    var details = document.createElement("details");
    details.className = "ctw-tools-drawer ctw-menu-mode";
    // Compact dropdown: collapsed by default (2026-07-15, Joel's ask — the
    // giant cards overwhelmed the top of the page). The open/closed choice is
    // remembered per device.
    var OPEN_LS = "nt-hub-tools-open";
    var savedOpen = "";
    try {
      savedOpen = localStorage.getItem(OPEN_LS) || "";
    } catch (_e) {
      savedOpen = "";
    }
    details.open = savedOpen === "1";
    details.addEventListener("toggle", function () {
      try {
        localStorage.setItem(OPEN_LS, details.open ? "1" : "0");
      } catch (_e) {
        /* private mode */
      }
    });
    var summary = document.createElement("summary");
    summary.textContent = "🧰 Teacher Tools & Featured Resources";
    tools.parentNode.insertBefore(details, tools);
    details.appendChild(summary);

    // Keep the student "continue where you left off" strip ALWAYS visible:
    // lift it out of the bar so collapsing the drawer never hides it.
    var resume = tools.querySelector(".resume-strip");

    // Same treatment for the Pacing Planner, and for the same reason. The
    // planner answers "what am I teaching today", so it cannot live behind a
    // drawer that is collapsed by default: moving its card to the TOP of the
    // bar (7ee9e8745) put it at the top of something nobody had open, which is
    // why it read as missing from /curriculum/ even though the markup, the
    // route and the teacher gate were all correct. It stays hub-teacher-only,
    // so students still never see it.
    var planner = tools.querySelector("section.cns-feature");

    // Compact menu derived from the existing cards — the card markup stays the
    // single source of truth. Items copy hub-teacher-only so the existing
    // class-based student-mode gating applies to them unchanged.
    var menu = document.createElement("nav");
    menu.className = "ctw-menu";
    menu.setAttribute("aria-label", "Teacher tools and featured resources");
    function revealCard(card, item) {
      var wasOn = card.classList.contains("ctw-reveal");
      tools.querySelectorAll("section.ctw-reveal").forEach(function (c) {
        c.classList.remove("ctw-reveal");
      });
      menu.querySelectorAll(".ctw-menu-item[aria-expanded]").forEach(function (b) {
        b.setAttribute("aria-expanded", "false");
      });
      if (!wasOn) {
        card.classList.add("ctw-reveal");
        item.setAttribute("aria-expanded", "true");
        card.scrollIntoView({ block: "nearest", behavior: "smooth" });
      }
    }
    tools.querySelectorAll("section").forEach(function (card) {
      // The planner card is lifted out of the drawer below, so a menu row for
      // it would be a second control with the same accessible name pointing at
      // the same place.
      if (card === planner) return;
      var titleEl = card.querySelector("h2");
      if (!titleEl) return;
      var iconEl = card.querySelector(".mf-icon");
      var link = card.querySelector(".mf-actions a");
      var item;
      if (link) {
        item = document.createElement("a");
        item.href = link.getAttribute("href");
      } else {
        // Interactive panel cards (AI Hub, Class Brain, Futures Lab) have no
        // single destination — the menu item reveals that one card in place.
        item = document.createElement("button");
        item.type = "button";
        item.setAttribute("aria-expanded", "false");
        item.addEventListener("click", function () {
          revealCard(card, item);
        });
      }
      item.className =
        "ctw-menu-item" + (card.classList.contains("hub-teacher-only") ? " hub-teacher-only" : "");
      var ic = document.createElement("span");
      ic.className = "ctw-menu-ic";
      ic.setAttribute("aria-hidden", "true");
      ic.textContent = (iconEl && iconEl.textContent.trim()) || (link ? "🔗" : "▦");
      var label = document.createElement("span");
      // The compact menu and its source card coexist in the DOM. Give the
      // Gradebook shortcut a concise, distinct label so text locators and
      // assistive technology do not encounter duplicate names.
      var title = titleEl.textContent.trim();
      label.textContent = title === "Gradebook & Save Codes" ? "Gradebook + Save Codes" : title;
      item.appendChild(ic);
      item.appendChild(label);
      menu.appendChild(item);
    });
    details.appendChild(menu);
    details.appendChild(tools);
    tools.classList.add("ctw-cards-hidden");
    if (resume) details.parentNode.insertBefore(resume, details);
    // Above the drawer, below the resume strip — the first teacher-facing thing
    // on the page, and no longer dependent on the drawer's remembered state.
    if (planner) details.parentNode.insertBefore(planner, details);

    // Escape hatch: the classic full-card wall, one toggle away.
    var showAll = document.createElement("button");
    showAll.type = "button";
    showAll.className = "ctw-show-all";
    showAll.textContent = "Show full cards ▾";
    showAll.setAttribute("aria-expanded", "false");
    showAll.addEventListener("click", function () {
      var showing = tools.classList.toggle("ctw-cards-hidden");
      showAll.textContent = showing ? "Show full cards ▾" : "Hide full cards ▴";
      showAll.setAttribute("aria-expanded", showing ? "false" : "true");
    });
    menu.appendChild(showAll);

    // Fold the standalone "🧰 Teacher Tools (for Mr. Neft)" links group into the
    // same drawer so every teacher-facing tool lives at the top of the page
    // instead of being stranded at the bottom below the units grid.
    var teacherTools = document.querySelector("details.teacher-tools");
    if (teacherTools) details.appendChild(teacherTools);
    // Lift the drawer to the very TOP of the page — above the Teacher Command
    // Center panel (#curriculum-teacher-workflow) when it's present, otherwise
    // above the main units grid (.wrap). organizeTools() runs right after that
    // panel is inserted (curriculum-teacher-workflow.js), so it already exists
    // here; the .wrap fail-safe keeps working if the panel is ever absent. In
    // normal block flow its own max-width:1180px + margin:auto center it as a
    // full-width section at the top.
    var topAnchor =
      document.getElementById("curriculum-teacher-workflow") || document.querySelector(".wrap");
    if (topAnchor && topAnchor.parentNode) topAnchor.parentNode.insertBefore(details, topAnchor);
    // Re-anchor both lifted blocks AFTER the drawer moves — inserting relative
    // to its old parent above would otherwise strand them mid-page.
    if (resume && details.parentNode) details.parentNode.insertBefore(resume, details);
    if (planner && details.parentNode) {
      // Out of the tools rail, the rail's own layout rules no longer fit: at
      // >=1080px curriculum-polish.css compacts every .mailbox-feature to
      // icon+title+button (correct for a narrow rail, wrong for a full-width
      // band), and the rail was also what constrained the card's width. The
      // class re-states both for the lifted copy only.
      planner.classList.add("cns-lifted");
      // Inline + important: .mailbox-feature is styled by this file's sheet,
      // by curriculum-polish.css and by the hub's own inline <style>, so a
      // class-level rule wins or loses on load order. Inline always wins.
      planner.style.setProperty("max-width", "1180px", "important");
      planner.style.setProperty("margin", "0 auto 14px", "important");
      planner.querySelectorAll(".mf-sub, .mf-text").forEach(function (el) {
        el.style.setProperty("display", "block", "important");
      });
      details.parentNode.insertBefore(planner, details);
    }

    // The drawer needs a stable id for the workspace's "More teacher tools"
    // link to point at.
    details.id = details.id || "ctw-more-tools";

    /* Workspace goes at the TOP OF THE PAGE, directly under the "Curriculum
     * Hub" heading — not merely above the drawer.
     *
     * Placing it above the drawer put it at 3297px on desktop and 7552px on
     * mobile, because the page header alone is ~1780px tall and the preset bar
     * another ~1030px. Something a teacher must scroll seven screens to reach
     * has not been made primary; it has been made present, which is the exact
     * trap the planner card fell into. Anchor to the header's own lede/H1 so
     * the three pathways are the first thing under the title, and everything
     * that was on the page stays on the page beneath them. */
    var workspace = buildWorkspace(planner);
    if (workspace) {
      var header = document.querySelector("header.curriculum-guide");
      var afterTitle =
        header && (header.querySelector(".curriculum-guide__lede") || header.querySelector("h1"));
      if (afterTitle && afterTitle.parentNode) {
        afterTitle.insertAdjacentElement("afterend", workspace);
      } else {
        var anchor = planner && planner.parentNode ? planner : details;
        anchor.parentNode.insertBefore(workspace, anchor);
      }
    }
  }

  function render(view, stage, context) {
    if (view === "week") return renderWeek(stage, context);
    if (view === "playlist") return renderPlaylist(stage, context);
    if (view === "unit") return renderUnit(stage, context);
    if (view === "next") return renderNextDay(stage, context);
  }

  window.CurriculumTeacherPlanning = { render: render, organizeTools: organizeTools };
})();
