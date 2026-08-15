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
      '<p class="tws-sub">All 10 units — interactive whole-group lessons, small-group lessons, and every lesson resource.</p>' +
      '<p class="tws-actions">' +
      '<a class="tws-btn" href="/curriculum/units/">Browse units &amp; lessons</a>' +
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
      '<p class="tws-sub">Language frames and vocabulary for multilingual students, accommodations that keep the objective, and scaffolded small-group pathways.</p>' +
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
