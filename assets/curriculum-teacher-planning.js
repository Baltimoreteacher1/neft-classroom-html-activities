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
    var actions = context.el("div", "ctw-planning-actions");
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
        "Scan the sequence, readiness, standards, timing, and student launch for every lesson.",
      ),
    );
    var units = Array.from(
      new Set(
        context.lessons.map(function (lesson) {
          return lesson.unit;
        }),
      ),
    );
    var unitSelect = context.el("select", "ctw-select");
    units.forEach(function (number) {
      unitSelect.appendChild(option(document, String(number), `Unit ${number}`));
    });
    unitSelect.value = String(selected.unit);
    card.appendChild(unitSelect);
    var list = context.el("div", "ctw-planning-grid");

    function paint() {
      list.replaceChildren();
      context.lessons
        .filter(function (lesson) {
          return lesson.unit === Number(unitSelect.value);
        })
        .forEach(function (lesson) {
          var row = context.el("article", "ctw-unit-row");
          var title = context.el("div", "ctw-row-copy");
          title.appendChild(
            context.el("strong", "ctw-row-title", `${lesson.id} · ${lesson.title}`),
          );
          title.appendChild(
            context.el("p", null, `${lesson.standard} · ${lesson.timeEstimate} · Ready`),
          );
          row.appendChild(title);
          var objective = context.el("div", "ctw-row-copy");
          objective.appendChild(context.el("p", null, lesson.objective));
          objective.appendChild(context.el("p", null, `Language: ${lesson.languageObjective}`));
          row.appendChild(objective);
          var actions = context.el("div", "ctw-planning-actions");
          actions.appendChild(context.link("Teach", lesson.resources.lesson));
          actions.appendChild(
            context.link("Student launch", context.studentUrl(lesson), "ctw-student"),
          );
          row.appendChild(actions);
          list.appendChild(row);
        });
    }
    unitSelect.addEventListener("change", paint);
    paint();
    card.appendChild(list);
    stage.replaceChildren(card);
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

  function organizeTools() {
    var tools = document.querySelector(".curriculum-tools-bar");
    if (!tools || tools.closest(".ctw-tools-drawer")) return;
    var details = document.createElement("details");
    details.className = "ctw-tools-drawer";
    // Expanded by default so all featured resource + teacher-tool cards are
    // visible at the top (their long-standing home) rather than hidden behind a
    // collapsed summary. The summary still lets anyone collapse the row.
    details.open = true;
    var summary = document.createElement("summary");
    summary.textContent = "Teacher Tools & Featured Resources";
    tools.parentNode.insertBefore(details, tools);
    details.appendChild(summary);
    details.appendChild(tools);
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
  }

  function render(view, stage, context) {
    if (view === "week") return renderWeek(stage, context);
    if (view === "playlist") return renderPlaylist(stage, context);
    if (view === "unit") return renderUnit(stage, context);
    if (view === "next") return renderNextDay(stage, context);
  }

  window.CurriculumTeacherPlanning = { render: render, organizeTools: organizeTools };
})();
