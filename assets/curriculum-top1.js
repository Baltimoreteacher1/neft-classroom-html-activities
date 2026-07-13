/**
 * curriculum-top1.js — Role-aware "Start Here" command center for the Curriculum Hub.
 *
 * ADDITIVE + SCOPED: reads window.CurriculumHub.unitsData and renders its own UI
 * region. It never touches the existing render/search/progress code, so it cannot
 * break them. It cooperates with the existing teacher/student mode (body.teacher-mode
 * + #hub-mode-toggle) instead of forking it.
 *
 * Modes: Student (default) · Teacher (UIFR Level 4 evidence) · Family · Substitute ·
 * Intervention · Assessment/Mastery · Today Mode. Plus display/accessibility controls.
 */
(function () {
  "use strict";

  var LS_TODAY = "top1TodayLesson";
  var LS_SECTION = "top1Section";
  var LS_DISPLAY = "top1Display";

  var DATA = {
    units: null,
    supports: null,
    taxonomy: null,
    uifr: null,
  };
  var hub = null;
  var stageView = "student";

  function ready(fn) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", fn);
    } else {
      fn();
    }
  }

  function getJson(url) {
    return fetch(url)
      .then(function (r) {
        return r.ok ? r.json() : null;
      })
      .catch(function () {
        return null;
      });
  }

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function el(tag, cls, html) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  }

  function isTeacherMode() {
    return document.body.classList.contains("teacher-mode");
  }

  /* ----- lesson / standard helpers ----- */

  function lessonStandard(lesson) {
    var src = (lesson && (lesson.dataSearch || lesson.title)) || "";
    var m = src.match(/6\.(ns|rp|ee|g|sp)\.\d+[a-z]?/i);
    return m ? m[0].toUpperCase() : "";
  }

  function lessonNumber(lesson) {
    var m = ((lesson && lesson.title) || "").match(/([0-9]+-[0-9]+)/);
    return m ? m[1] : lesson && lesson.lessonId ? lesson.lessonId : "";
  }

  function lessonName(lesson) {
    var t = (lesson && lesson.title) || "";
    return t.replace(/^\s*Lesson\s+[0-9-]+\s*[·:-]?\s*/i, "").trim() || t;
  }

  // Detect the support/skill family from standard + title keywords.
  function skillFamily(lesson) {
    var std = lessonStandard(lesson);
    var t = ((lesson && lesson.title + " " + (lesson.dataSearch || "")) || "").toLowerCase();
    if (/decimal|multi-digit|gcf|lcm|factor|multiple/.test(t)) return "decimals";
    if (/fraction/.test(t)) return "fractions";
    if (/ratio|tape diagram|equivalent ratio/.test(t)) return "ratios";
    if (/percent|unit rate|\brate\b/.test(t)) return "percents";
    if (/exponent|expression|evaluate|variable\b/.test(t)) return "expressions";
    if (/equation|inequalit|solve for/.test(t)) return "equations";
    if (/statistic|data|mean|median|histogram|dot plot|distribution/.test(t)) return "statistics";
    if (/integer|negative|absolute value|coordinate|quadrant/.test(t)) return "integers";
    if (/area|polygon|triangle|parallelogram/.test(t)) return "geometry";
    if (/volume|surface area|net|prism/.test(t)) return "volume";
    if (std.indexOf("6.NOS") === 0) return "decimals";
    if (std.indexOf("6.AT") === 0) return "ratios";
    if (std.indexOf("6.AT") === 0) return "equations";
    if (std.indexOf("6.GR") === 0) return "geometry";
    if (std.indexOf("6.DS") === 0) return "statistics";
    return "general";
  }

  function supportFor(lesson) {
    var fams = (DATA.supports && DATA.supports.families) || {};
    return fams[skillFamily(lesson)] || fams.general || null;
  }

  // Classify a resource link via the taxonomy rules.
  function classify(act) {
    var text = ((act && act.text) || "").toLowerCase();
    var href = ((act && act.href) || "").toLowerCase();
    var hay = text + " " + href;
    var rules = (DATA.taxonomy && DATA.taxonomy.rules) || [];
    for (var i = 0; i < rules.length; i++) {
      try {
        if (new RegExp(rules[i].match, "i").test(hay)) return rules[i];
      } catch (e) {}
    }
    return (
      (DATA.taxonomy && DATA.taxonomy.fallback) || {
        badges: ["Student"],
        visibility: "public",
      }
    );
  }

  function allActs(lesson) {
    return (lesson.activities || []).concat(lesson.projects || []);
  }

  function findAct(lesson, re) {
    var acts = allActs(lesson);
    for (var i = 0; i < acts.length; i++) {
      var a = acts[i];
      if (re.test(((a.text || "") + " " + (a.href || "")).toLowerCase())) return a;
    }
    return null;
  }

  function studentActs(lesson) {
    return allActs(lesson).filter(function (a) {
      return classify(a).visibility !== "teacher";
    });
  }

  /* ----- copy-ready text generators ----- */

  function studentDirections(lesson) {
    var sup = supportFor(lesson);
    var frame = sup ? sup.sentenceFrame : "My answer is ______ because ______.";
    var lines = [
      "Today you will complete Lesson " + lessonNumber(lesson) + ": " + lessonName(lesson) + ".",
      "",
      "1. Open the Interactive Lesson and work through the guided practice.",
      "2. Complete the Guided Notes (or the practice / homework).",
      "3. Write one sentence explaining your reasoning: " + frame,
      "4. Finish the Check-Understanding activity (exit ticket).",
    ];
    return lines.join("\n");
  }

  function classroomDirections(lesson, platform) {
    return (
      platform +
      " — Lesson " +
      lessonNumber(lesson) +
      ": " +
      lessonName(lesson) +
      "\n\nLearning goal: " +
      (lesson.objective || "I can " + lessonName(lesson).toLowerCase() + ".") +
      "\n\nWhat to do:\n1) Open the Interactive Lesson.\n2) Complete the guided practice and notes.\n3) Post one sentence explaining your thinking.\n4) Submit the exit ticket / check for understanding."
    );
  }

  function familyMessage(unit, lesson) {
    var name = lessonName(lesson);
    return (
      "What we are learning: Students are working on " +
      name.toLowerCase() +
      " (" +
      unit.name +
      ").\n" +
      "En español: Los estudiantes están aprendiendo " +
      name.toLowerCase() +
      " (" +
      unit.name +
      ").\n\n" +
      "How to help at home: Ask your child to explain one problem out loud and to show their work two ways (for example, with a model and with numbers).\n" +
      "En español: Pida a su hijo/a que explique un problema en voz alta y que muestre su trabajo de dos maneras."
    );
  }

  function absentMessage(lesson) {
    return (
      "You were absent for Lesson " +
      lessonNumber(lesson) +
      ": " +
      lessonName(lesson) +
      ".\n\nTo catch up:\n1) Open the Interactive Lesson and the Guided Notes.\n2) Try the practice problems.\n3) Write one sentence explaining how you solved one problem.\n4) Bring any questions to class or office hours."
    );
  }

  function subDirections(lesson) {
    var inter = findAct(lesson, /interactive lesson|\/lessons\//);
    var notes = findAct(lesson, /guided notes|notes\.html/);
    var hw = findAct(lesson, /homework/);
    return (
      "SUBSTITUTE PLAN — 45 minutes — Lesson " +
      lessonNumber(lesson) +
      ": " +
      lessonName(lesson) +
      "\n\n" +
      "No setup required. Students can work from the linked pages on their devices.\n\n" +
      "1) Warm-up (5 min): Students read the goal — " +
      (lesson.objective || "today's objective") +
      "\n2) Lesson (15 min): " +
      (inter
        ? "Open the Interactive Lesson together or individually."
        : "Use the Guided Notes as the lesson.") +
      "\n3) Guided practice (10 min): " +
      (notes ? "Complete the Guided Notes." : "Work the practice problems on the lesson page.") +
      "\n4) Independent practice (10 min): " +
      (hw ? "Start the Homework." : "Finish remaining practice problems.") +
      "\n5) Early finishers (5 min): Play the unit Game or write one sentence explaining their thinking.\n\n" +
      "Collect: a sentence or exit response showing each student's reasoning."
    );
  }

  function uifrNotes(unit, lesson) {
    var sup = supportFor(lesson);
    var std = lessonStandard(lesson);
    return [
      "Lesson: " + lessonNumber(lesson) + " — " + lessonName(lesson),
      "Standard: " + (std || "Grade 6 Math"),
      "Objective: " + (lesson.objective || "I can " + lessonName(lesson).toLowerCase() + "."),
      "",
      "Level 4 Evidence Planned:",
      "- Students engage with a grade-level standard through the interactive lesson and aligned practice.",
      "- Students choose how to show thinking (equation, model, words, table, graph, or drawing).",
      "- Students explain reasoning using the sentence frame: " +
        (sup ? sup.sentenceFrame : "My answer is ___ because ___."),
      "- Students use structured academic talk with partner roles and evidence stems.",
      "- Teacher checks understanding at the beginning, middle, and end of the lesson.",
      "- Teacher uses responses to assign reteach, core practice, language support, or extension.",
      "- Teacher reflects on misconceptions, student-work evidence, and next instructional steps.",
    ].join("\n");
  }

  /* ----- small UI builders ----- */

  function copyBtn(label, getText) {
    var b = el("button", "top1-copy", "📋 " + esc(label));
    b.type = "button";
    b.addEventListener("click", function () {
      var text = getText();
      var done = function () {
        var old = b.innerHTML;
        b.innerHTML = "✓ Copied";
        setTimeout(function () {
          b.innerHTML = old;
        }, 1400);
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(done, function () {
          fallbackCopy(text);
          done();
        });
      } else {
        fallbackCopy(text);
        done();
      }
    });
    return b;
  }

  function fallbackCopy(text) {
    var ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.position = "absolute";
    ta.style.left = "-9999px";
    document.body.appendChild(ta);
    ta.select();
    try {
      document.execCommand("copy");
    } catch (e) {}
    document.body.removeChild(ta);
  }

  function badge(text, kind) {
    return el("span", "top1-badge top1-badge-" + (kind || "student"), esc(text));
  }

  function collapsible(summary, buildBody) {
    var d = el("details", "top1-collapse");
    var s = el("summary", null, esc(summary));
    d.appendChild(s);
    var body = el("div", "top1-collapse-body");
    buildBody(body);
    d.appendChild(body);
    return d;
  }

  function linkList(acts) {
    var wrap = el("div", "top1-links");
    acts.forEach(function (a) {
      var info = classify(a);
      var row = el("div", "top1-link-row");
      var link = el("a", "top1-link", esc(a.text));
      link.href = a.href;
      row.appendChild(link);
      (info.badges || []).forEach(function (bd) {
        var kind = /teacher|google login/i.test(bd)
          ? "teacher"
          : /download|printable/i.test(bd)
            ? "download"
            : /assessment/i.test(bd)
              ? "assess"
              : /game|extension/i.test(bd)
                ? "game"
                : /family/i.test(bd)
                  ? "family"
                  : "student";
        row.appendChild(badge(bd, kind));
      });
      if (info.time) row.appendChild(el("span", "top1-meta", esc(info.time)));
      // 🖨 print — same affordance and classifier as the unit-card outline,
      // reused via window.NeftPrint (exposed by curriculum-enhancements.js) so
      // paper resources listed here can be printed without opening the lesson.
      if (window.NeftPrint && window.NeftPrint.canPrint(a.text, a.href)) {
        var printBtn = el("button", "top1-link-print", "🖨");
        printBtn.type = "button";
        printBtn.title = "Print “" + a.text + "”";
        printBtn.setAttribute("aria-label", "Print: " + a.text);
        printBtn.addEventListener("click", function (e) {
          e.preventDefault();
          window.NeftPrint.print(a.href);
        });
        row.appendChild(printBtn);
      } else if (window.NeftPrint && window.NeftPrint.packetHref) {
        // The interactive-lesson row itself is not a paper resource, so canPrint
        // is false — but a full printable packet (printable.html) exists. Offer a
        // 🖨 that prints the whole lesson straight from the hub.
        var packet = window.NeftPrint.packetHref(a.href);
        if (packet) {
          var pktBtn = el("button", "top1-link-print", "🖨");
          pktBtn.type = "button";
          pktBtn.title = "Print full lesson packet";
          pktBtn.setAttribute("aria-label", "Print full lesson packet");
          pktBtn.addEventListener("click", function (e) {
            e.preventDefault();
            window.NeftPrint.print(packet);
          });
          row.appendChild(pktBtn);
        }
      }
      wrap.appendChild(row);
    });
    return wrap;
  }

  /* ----- lesson picker (shared) ----- */

  function buildLessonPicker(onChange) {
    var wrap = el("div", "top1-picker");
    var savedSection = "";
    try {
      savedSection = localStorage.getItem(LS_SECTION) || "";
    } catch (e) {}

    var secWrap = el("label", "top1-field", "Class");
    var sec = el("select", "top1-select");
    ["601", "602", "603", "Other"].forEach(function (s) {
      var o = el("option", null, s);
      o.value = s;
      if (s === savedSection) o.selected = true;
      sec.appendChild(o);
    });
    secWrap.appendChild(sec);

    var uWrap = el("label", "top1-field", "Unit");
    var uSel = el("select", "top1-select");
    hub.unitsData.forEach(function (u, i) {
      var o = el("option", null, u.num + " · " + u.name);
      o.value = String(i);
      uSel.appendChild(o);
    });
    uWrap.appendChild(uSel);

    var lWrap = el("label", "top1-field", "Lesson");
    var lSel = el("select", "top1-select");
    lWrap.appendChild(lSel);

    function fillLessons(uIdx) {
      lSel.innerHTML = "";
      (hub.unitsData[uIdx].lessons || []).forEach(function (l, i) {
        var o = el("option", null, l.title);
        o.value = String(i);
        lSel.appendChild(o);
      });
    }

    function emit() {
      try {
        localStorage.setItem(LS_SECTION, sec.value);
        localStorage.setItem(LS_TODAY, uSel.value + ":" + lSel.value);
      } catch (e) {}
      var u = hub.unitsData[+uSel.value];
      var l = u.lessons[+lSel.value];
      if (l) onChange(u, l, sec.value);
    }

    sec.addEventListener("change", emit);
    uSel.addEventListener("change", function () {
      fillLessons(+uSel.value);
      emit();
    });
    lSel.addEventListener("change", emit);

    // restore
    var saved = null;
    try {
      saved = localStorage.getItem(LS_TODAY);
    } catch (e) {}
    var ui = 0,
      li = 0;
    if (saved && /^\d+:\d+$/.test(saved)) {
      var p = saved.split(":");
      ui = Math.min(+p[0], hub.unitsData.length - 1);
    }
    uSel.value = String(ui);
    fillLessons(ui);
    if (saved && /^\d+:\d+$/.test(saved)) {
      li = Math.min(+saved.split(":")[1], lSel.options.length - 1);
    }
    lSel.value = String(li);

    wrap.appendChild(secWrap);
    wrap.appendChild(uWrap);
    wrap.appendChild(lWrap);
    return { wrap: wrap, emit: emit };
  }

  /* ----- stage renderers ----- */

  function renderStage(stage) {
    stage.innerHTML = "";
    if (stageView === "today") return renderToday(stage);
    if (stageView === "teacher") return renderTeacher(stage);
    if (stageView === "family") return renderFamily(stage);
    if (stageView === "substitute") return renderSubstitute(stage);
    if (stageView === "intervention") return renderIntervention(stage);
    if (stageView === "assessment") return renderAssessment(stage);
    return renderStudent(stage);
  }

  function lessonCard(u, l, opts) {
    opts = opts || {};
    var card = el("div", "top1-lesson-card");
    var std = lessonStandard(l);
    card.appendChild(
      el(
        "div",
        "top1-lesson-head",
        "<strong>" +
          esc(lessonName(l)) +
          "</strong> " +
          (std ? '<span class="top1-badge top1-badge-std">' + esc(std) + "</span>" : ""),
      ),
    );
    if (l.objective) card.appendChild(el("p", "top1-obj", "🎯 " + esc(l.objective)));

    if (opts.directions) {
      card.appendChild(
        el(
          "p",
          "top1-why",
          "Today's goal: " +
            esc(l.objective || "I can " + lessonName(l).toLowerCase() + ".") +
            "<br>Choose one way to show your thinking: equation, model, words, table, graph, or drawing.",
        ),
      );
    }

    var acts = opts.teacher ? allActs(l) : studentActs(l);
    if (acts.length) card.appendChild(linkList(acts));
    return card;
  }

  function supportsPanel(l) {
    var sup = supportFor(l);
    if (!sup) return null;
    return collapsible("🧩 Supports (ESOL · SPED · UDL)", function (body) {
      body.appendChild(
        el("p", "top1-kv", "<strong>Vocabulary:</strong> " + esc(sup.vocabulary.join(", "))),
      );
      body.appendChild(
        el("p", "top1-kv", "<strong>Sentence frame:</strong> " + esc(sup.sentenceFrame)),
      );
      body.appendChild(
        el(
          "p",
          "top1-kv",
          "<strong>Because / But / So:</strong><br>" +
            esc(sup.becauseButSo.because) +
            "<br>" +
            esc(sup.becauseButSo.but) +
            "<br>" +
            esc(sup.becauseButSo.so),
        ),
      );
      body.appendChild(
        el("p", "top1-kv", "<strong>Visual model:</strong> " + esc(sup.visualModel)),
      );
      if (isTeacherMode()) {
        body.appendChild(el("p", "top1-kv", "<strong>WIDA 1–2:</strong> " + esc(sup.wida12)));
        body.appendChild(el("p", "top1-kv", "<strong>WIDA 3–4:</strong> " + esc(sup.wida34)));
        body.appendChild(el("p", "top1-kv", "<strong>SPED:</strong> " + esc(sup.sped)));
        body.appendChild(
          el("p", "top1-kv top1-note", "<strong>Teacher note:</strong> " + esc(sup.teacherNote)),
        );
      }
      body.appendChild(el("p", "top1-kv", "<strong>Extension:</strong> " + esc(sup.extension)));
    });
  }

  function masteryPanel() {
    var u = DATA.uifr;
    if (!u || !u.masteryChecklist) return null;
    return collapsible("✅ Mastery check — I can…", function (body) {
      var ul = el("ul", "top1-checklist");
      u.masteryChecklist.forEach(function (m) {
        ul.appendChild(el("li", null, esc(m)));
      });
      body.appendChild(ul);
    });
  }

  function renderStudent(stage) {
    var picker = buildLessonPicker(function (u, l) {
      paint(u, l);
    });
    stage.appendChild(
      intro(
        "What do I do today?",
        "Pick your class and lesson. Open the lesson, practice, explain your thinking, then check understanding.",
      ),
    );
    stage.appendChild(picker.wrap);
    var out = el("div", "top1-out");
    stage.appendChild(out);

    function paint(u, l) {
      out.innerHTML = "";
      out.appendChild(lessonCard(u, l, { directions: true }));
      var sp = supportsPanel(l);
      if (sp) out.appendChild(sp);
      var mp = masteryPanel();
      if (mp) out.appendChild(mp);
      var bar = el("div", "top1-btnrow");
      bar.appendChild(
        copyBtn("Copy student directions", function () {
          return studentDirections(l);
        }),
      );
      out.appendChild(bar);
    }
    picker.emit();
  }

  function renderToday(stage) {
    stage.appendChild(
      intro(
        "Today Mode",
        "Choose class, unit, and lesson. Get the essential links and copy-ready directions for any platform.",
      ),
    );
    var picker = buildLessonPicker(function (u, l) {
      paint(u, l);
    });
    stage.appendChild(picker.wrap);
    var out = el("div", "top1-out");
    stage.appendChild(out);

    function paint(u, l) {
      out.innerHTML = "";
      out.appendChild(lessonCard(u, l, { teacher: isTeacherMode() }));
      var bar = el("div", "top1-btnrow");
      bar.appendChild(
        copyBtn("Student directions", function () {
          return studentDirections(l);
        }),
      );
      bar.appendChild(
        copyBtn("Google Classroom", function () {
          return classroomDirections(l, "Google Classroom");
        }),
      );
      bar.appendChild(
        copyBtn("Canvas", function () {
          return classroomDirections(l, "Canvas");
        }),
      );
      bar.appendChild(
        copyBtn("Family message", function () {
          return familyMessage(u, l);
        }),
      );
      bar.appendChild(
        copyBtn("Absent-student message", function () {
          return absentMessage(l);
        }),
      );
      bar.appendChild(
        copyBtn("Substitute directions", function () {
          return subDirections(l);
        }),
      );
      if (isTeacherMode()) {
        bar.appendChild(
          copyBtn("UIFR evidence notes", function () {
            return uifrNotes(u, l);
          }),
        );
      }
      out.appendChild(bar);
    }
    picker.emit();
  }

  function uifrCard(u, l) {
    var card = el("div", "top1-uifr");
    card.appendChild(el("p", "top1-uifr-disc", esc((DATA.uifr && DATA.uifr.disclaimer) || "")));
    card.appendChild(lessonCard(u, l, { teacher: true }));

    var sp = supportsPanel(l);
    if (sp) card.appendChild(sp);

    // Questioning ladder
    if (DATA.uifr.questioningLadder) {
      card.appendChild(
        collapsible("❓ Questioning Ladder", function (b) {
          var ol = el("ol", "top1-ladder");
          DATA.uifr.questioningLadder.forEach(function (q) {
            ol.appendChild(el("li", null, "<strong>" + esc(q.rung) + ":</strong> " + esc(q.q)));
          });
          b.appendChild(ol);
        }),
      );
    }
    // Academic talk
    card.appendChild(
      collapsible("💬 Academic Talk", function (b) {
        b.appendChild(
          el(
            "p",
            "top1-kv",
            "<strong>Partner roles:</strong> " + esc((DATA.uifr.partnerRoles || []).join(", ")),
          ),
        );
        var ul = el("ul", "top1-checklist");
        (DATA.uifr.academicTalkStems || []).forEach(function (s) {
          ul.appendChild(el("li", null, esc(s)));
        });
        b.appendChild(ul);
      }),
    );
    // Formative checkpoints
    card.appendChild(
      collapsible("📍 Formative Checkpoints", function (b) {
        (DATA.uifr.formativeCheckpoints || []).forEach(function (c) {
          b.appendChild(el("p", "top1-kv", "<strong>" + esc(c.when) + ":</strong> " + esc(c.move)));
        });
        b.appendChild(el("p", "top1-kv", "<strong>Feedback stems:</strong>"));
        var ul = el("ul", "top1-checklist");
        (DATA.uifr.feedbackStems || []).forEach(function (s) {
          ul.appendChild(el("li", null, esc(s)));
        });
        b.appendChild(ul);
      }),
    );
    // Reflection + next steps
    card.appendChild(
      collapsible("🔁 Reflect & Next Step From Evidence", function (b) {
        var ul = el("ul", "top1-checklist");
        (DATA.uifr.reflectionCard || []).forEach(function (s) {
          ul.appendChild(el("li", null, esc(s)));
        });
        b.appendChild(ul);
        (DATA.uifr.dataNextSteps || []).forEach(function (n) {
          b.appendChild(
            el("p", "top1-kv", "<strong>If " + esc(n.if) + " →</strong> " + esc(n.then)),
          );
        });
      }),
    );
    // Rubric components
    card.appendChild(
      collapsible("📋 UIFR Domains (Prepare · Teach · Reflect)", function (b) {
        (DATA.uifr.components || []).forEach(function (c) {
          b.appendChild(
            el("p", "top1-kv", "<strong>" + esc(c.title) + ":</strong> " + esc(c.prompt)),
          );
        });
      }),
    );

    var bar = el("div", "top1-btnrow");
    bar.appendChild(
      copyBtn("Copy UIFR Evidence Notes", function () {
        return uifrNotes(u, l);
      }),
    );
    card.appendChild(bar);
    return card;
  }

  function renderTeacher(stage) {
    stage.appendChild(
      intro(
        "Teacher Mode — UIFR Level 4 Evidence",
        "Pick a lesson to see the planning structures, student tasks, questioning, and reflection that make Level 4 evidence visible and easy to collect.",
      ),
    );
    var picker = buildLessonPicker(function (u, l) {
      paint(u, l);
    });
    stage.appendChild(picker.wrap);
    var out = el("div", "top1-out");
    stage.appendChild(out);
    function paint(u, l) {
      out.innerHTML = "";
      out.appendChild(uifrCard(u, l));
    }
    picker.emit();
  }

  function renderFamily(stage) {
    stage.appendChild(
      intro(
        "Family help",
        "See what your child is learning and how to help. Pick the unit and lesson.",
      ),
    );
    var picker = buildLessonPicker(function (u, l) {
      paint(u, l);
    });
    stage.appendChild(picker.wrap);
    var out = el("div", "top1-out");
    stage.appendChild(out);
    function paint(u, l) {
      out.innerHTML = "";
      var ident =
        (DATA.units &&
          DATA.units.units &&
          DATA.units.units[String(u.unitIndex || u.num.replace(/\D/g, ""))]) ||
        null;
      var card = el("div", "top1-lesson-card");
      card.appendChild(
        el("div", "top1-lesson-head", "<strong>" + esc(lessonName(l)) + "</strong>"),
      );
      card.appendChild(
        el(
          "p",
          "top1-kv",
          "<strong>What we are learning:</strong> " +
            esc(lessonName(l)) +
            " (" +
            esc(u.name) +
            ").",
        ),
      );
      card.appendChild(
        el(
          "p",
          "top1-kv",
          "<strong>En español:</strong> " + esc(lessonName(l)) + " (" + esc(u.name) + ").",
        ),
      );
      var sup = supportFor(l);
      if (sup) {
        card.appendChild(
          el("p", "top1-kv", "<strong>Words to know:</strong> " + esc(sup.vocabulary.join(", "))),
        );
        card.appendChild(
          el(
            "p",
            "top1-kv",
            "<strong>How to help at home:</strong> Ask your child to explain one problem out loud using: " +
              esc(sup.sentenceFrame),
          ),
        );
      }
      if (ident)
        card.appendChild(el("p", "top1-kv top1-note", esc(ident.icon + " " + ident.mission)));
      var fam = studentActs(l).filter(function (a) {
        return /homework|family|notes|practice|review|interactive/i.test(a.text);
      });
      if (fam.length) card.appendChild(linkList(fam));
      out.appendChild(card);
      var bar = el("div", "top1-btnrow");
      bar.appendChild(
        copyBtn("Copy family message", function () {
          return familyMessage(u, l);
        }),
      );
      out.appendChild(bar);
    }
    picker.emit();
  }

  function renderSubstitute(stage) {
    stage.appendChild(
      intro("Substitute Mode", "A 45-minute, no-setup plan. Private teacher tools are hidden."),
    );
    var picker = buildLessonPicker(function (u, l) {
      paint(u, l);
    });
    stage.appendChild(picker.wrap);
    var out = el("div", "top1-out");
    stage.appendChild(out);
    function paint(u, l) {
      out.innerHTML = "";
      out.appendChild(lessonCard(u, l, { teacher: false }));
      out.appendChild(el("pre", "top1-plan", esc(subDirections(l))));
      var bar = el("div", "top1-btnrow");
      bar.appendChild(
        copyBtn("Copy substitute directions", function () {
          return subDirections(l);
        }),
      );
      out.appendChild(bar);
    }
    picker.emit();
  }

  function renderIntervention(stage) {
    stage.appendChild(
      intro(
        "Intervention Mode",
        "Choose a skill family for a reteach-friendly path: vocabulary, visual model, practice, and a check.",
      ),
    );
    var fams = (DATA.supports && DATA.supports.families) || {};
    var picker = el("div", "top1-picker");
    var lab = el("label", "top1-field", "Skill family");
    var sel = el("select", "top1-select");
    Object.keys(fams).forEach(function (k) {
      if (k === "general") return;
      var o = el("option", null, fams[k].label);
      o.value = k;
      sel.appendChild(o);
    });
    lab.appendChild(sel);
    picker.appendChild(lab);
    stage.appendChild(picker);
    var out = el("div", "top1-out");
    stage.appendChild(out);

    function paint() {
      var key = sel.value;
      var sup = fams[key];
      out.innerHTML = "";
      var card = el("div", "top1-lesson-card");
      card.appendChild(
        el(
          "div",
          "top1-lesson-head",
          "<strong>10-minute reteach — " + esc(sup.label) + "</strong>",
        ),
      );
      card.appendChild(
        el("p", "top1-kv", "<strong>1. Vocabulary:</strong> " + esc(sup.vocabulary.join(", "))),
      );
      card.appendChild(
        el("p", "top1-kv", "<strong>2. Visual model:</strong> " + esc(sup.visualModel)),
      );
      card.appendChild(
        el("p", "top1-kv", "<strong>3. Sentence frame:</strong> " + esc(sup.sentenceFrame)),
      );
      card.appendChild(
        el(
          "p",
          "top1-kv",
          "<strong>4. Check understanding:</strong> Have the student solve one problem and explain it with the frame.",
        ),
      );
      // Matching lessons by family
      var matches = [];
      hub.unitsData.forEach(function (u) {
        (u.lessons || []).forEach(function (l) {
          if (skillFamily(l) === key) matches.push({ u: u, l: l });
        });
      });
      if (matches.length) {
        card.appendChild(el("p", "top1-kv top1-note", "Reteach-friendly lessons:"));
        var acts = [];
        matches.slice(0, 6).forEach(function (m) {
          var inter = findAct(m.l, /interactive lesson|\/lessons\//) || studentActs(m.l)[0];
          if (inter)
            acts.push({
              text: "Lesson " + lessonNumber(m.l) + " · " + lessonName(m.l),
              href: inter.href,
            });
        });
        if (acts.length) card.appendChild(linkList(acts));
      }
      out.appendChild(card);
    }
    sel.addEventListener("change", paint);
    paint();
  }

  function renderAssessment(stage) {
    stage.appendChild(
      intro(
        "Assessment & Mastery",
        "Pre-test, post-test, study guide, and MCAP-style practice, with a recommended next step.",
      ),
    );
    var picker = buildLessonPicker(function (u, l) {
      paint(u, l);
    });
    stage.appendChild(picker.wrap);
    var out = el("div", "top1-out");
    stage.appendChild(out);
    function paint(u, l) {
      out.innerHTML = "";
      var card = el("div", "top1-lesson-card");
      card.appendChild(
        el("div", "top1-lesson-head", "<strong>" + esc(u.num + " · " + u.name) + "</strong>"),
      );
      // unit-level assessments
      var ures = (u.resources || []).filter(function (a) {
        return /pre-test|post-test|study guide|quiz|mcap|review/i.test(
          (a.text || "") + " " + (a.href || ""),
        );
      });
      var lres = studentActs(l).filter(function (a) {
        return /exit|check|mcap|quiz|test|study/i.test(a.text);
      });
      var combined = ures.concat(lres);
      if (combined.length) card.appendChild(linkList(combined));
      else
        card.appendChild(
          el("p", "top1-kv", "Open the unit above for its pre-test, post-test, and study guide."),
        );
      card.appendChild(
        el(
          "div",
          "top1-nextsteps",
          "<strong>Recommended next step:</strong><br>" +
            "• New to this skill? Start with the Interactive Lesson.<br>" +
            "• Need more practice? Go to Practice / Homework.<br>" +
            "• Ready to show mastery? Take the Check / Exit Ticket.<br>" +
            "• Finished early? Try the Extension or Game.",
        ),
      );
      out.appendChild(card);
    }
    picker.emit();
  }

  function intro(title, sub) {
    var d = el("div", "top1-intro");
    d.appendChild(el("h3", "top1-intro-title", esc(title)));
    d.appendChild(el("p", "top1-intro-sub", esc(sub)));
    return d;
  }

  /* ----- mode switching cooperating with existing toggle ----- */

  function setPageTeacherMode(on) {
    var isOn = isTeacherMode();
    if (isOn === on) return;
    var btn = document.getElementById("hub-mode-toggle");
    if (btn) btn.click();
  }

  function selectRole(view, roleEls, stage) {
    stageView = view;
    roleEls.forEach(function (r) {
      r.setAttribute("aria-pressed", r.dataset.view === view ? "true" : "false");
    });
    // Page mode follows explicit role choices only. Teacher → Teacher Mode;
    // student-facing roles → Student Mode. Neutral views (today/intervention/
    // assessment) keep whatever mode the user is already in.
    if (view === "teacher") setPageTeacherMode(true);
    else if (view === "student" || view === "family" || view === "substitute")
      setPageTeacherMode(false);
    renderStage(stage);
  }

  /* ----- display / accessibility controls ----- */

  function applyDisplay(cfg) {
    var b = document.body;
    b.classList.toggle("top1-text-lg", cfg.text === "large");
    b.classList.toggle("top1-text-xl", cfg.text === "xl");
    b.classList.toggle("top1-space", cfg.space === "more");
    b.classList.toggle("top1-contrast", cfg.contrast === "high");
    b.classList.toggle("top1-reduced", cfg.motion === "reduced");
    b.classList.toggle("top1-bilingual", cfg.lang === "es");
  }

  function loadDisplay() {
    try {
      return JSON.parse(localStorage.getItem(LS_DISPLAY)) || {};
    } catch (e) {
      return {};
    }
  }

  function displayControls() {
    var cfg = loadDisplay();
    applyDisplay(cfg);
    var wrap = collapsible("⚙️ Display & accessibility", function (body) {
      var groups = [
        {
          key: "text",
          label: "Text size",
          opts: [
            ["normal", "Normal"],
            ["large", "Large"],
            ["xl", "Extra large"],
          ],
        },
        {
          key: "space",
          label: "Spacing",
          opts: [
            ["normal", "Normal"],
            ["more", "More space"],
          ],
        },
        {
          key: "contrast",
          label: "Color",
          opts: [
            ["normal", "Default"],
            ["high", "High contrast"],
          ],
        },
        {
          key: "motion",
          label: "Motion",
          opts: [
            ["normal", "Default"],
            ["reduced", "Reduced"],
          ],
        },
        {
          key: "lang",
          label: "Language",
          opts: [
            ["en", "English"],
            ["es", "English + Spanish"],
          ],
        },
      ];
      groups.forEach(function (g) {
        var row = el("div", "top1-disp-row");
        row.appendChild(el("span", "top1-disp-label", esc(g.label)));
        g.opts.forEach(function (o) {
          var b = el("button", "top1-chip", esc(o[1]));
          b.type = "button";
          var active = (cfg[g.key] || g.opts[0][0]) === o[0];
          b.setAttribute("aria-pressed", active ? "true" : "false");
          b.addEventListener("click", function () {
            cfg[g.key] = o[0];
            try {
              localStorage.setItem(LS_DISPLAY, JSON.stringify(cfg));
            } catch (e) {}
            applyDisplay(cfg);
            row.querySelectorAll(".top1-chip").forEach(function (c) {
              c.setAttribute("aria-pressed", "false");
            });
            b.setAttribute("aria-pressed", "true");
          });
          row.appendChild(b);
        });
        body.appendChild(row);
      });
    });
    return wrap;
  }

  /* ----- main panel ----- */

  function buildPanel() {
    var panel = el("section", "top1");
    panel.id = "top1-start-here";
    panel.setAttribute("aria-label", "Start here — guided curriculum");

    panel.appendChild(
      el(
        "div",
        "top1-hero",
        '<p class="top1-eyebrow">Grade 6 Math · Curriculum Hub</p>' +
          "<h2>Start here — pick who you are</h2>" +
          '<p class="top1-lede">Students, teachers, and families each get a clear path: what to do today, how to practice and explain, what to print, and how to get help.</p>',
      ),
    );

    var roles = [
      {
        view: "student",
        icon: "🎒",
        label: "I am a student",
        sub: "Today's lesson, practice, explain, get help",
      },
      {
        view: "teacher",
        icon: "👩‍🏫",
        label: "I am a teacher",
        sub: "Teach, assign, print, assess, UIFR evidence",
      },
      {
        view: "family",
        icon: "👪",
        label: "I am a family member",
        sub: "Help with homework, words, review",
      },
      {
        view: "substitute",
        icon: "🧑‍🏫",
        label: "Substitute",
        sub: "45-minute no-setup plan",
      },
      {
        view: "intervention",
        icon: "🛟",
        label: "Intervention",
        sub: "Reteach by skill family",
      },
      {
        view: "assessment",
        icon: "🧪",
        label: "Assessment",
        sub: "Pre/post tests, mastery, next step",
      },
      {
        view: "today",
        icon: "📅",
        label: "Today Mode",
        sub: "Pick a lesson, copy directions",
      },
    ];

    var rolebar = el("div", "top1-roles");
    var roleEls = [];
    var stage = el("div", "top1-stage");
    stage.id = "top1-stage";

    roles.forEach(function (r) {
      var b = el(
        "button",
        "top1-role",
        '<span class="top1-role-icon">' +
          r.icon +
          '</span><span class="top1-role-label">' +
          esc(r.label) +
          '</span><span class="top1-role-sub">' +
          esc(r.sub) +
          "</span>",
      );
      b.type = "button";
      b.dataset.view = r.view;
      b.setAttribute("aria-pressed", r.view === "student" ? "true" : "false");
      b.addEventListener("click", function () {
        selectRole(r.view, roleEls, stage);
        stage.scrollIntoView({
          behavior: document.body.classList.contains("top1-reduced") ? "auto" : "smooth",
          block: "nearest",
        });
      });
      roleEls.push(b);
      rolebar.appendChild(b);
    });

    panel.appendChild(rolebar);
    panel.appendChild(displayControls());
    panel.appendChild(stage);

    // initial: match current page mode
    stageView = isTeacherMode() ? "teacher" : "student";
    roleEls.forEach(function (r) {
      r.setAttribute("aria-pressed", r.dataset.view === stageView ? "true" : "false");
    });
    renderStage(stage);

    // keep role UI in sync if user uses the existing toggle
    var mo = new MutationObserver(function () {
      var teacher = isTeacherMode();
      if (teacher && stageView === "student") {
        selectRole("teacher", roleEls, stage);
      } else if (!teacher && stageView === "teacher") {
        selectRole("student", roleEls, stage);
      }
    });
    mo.observe(document.body, { attributes: true, attributeFilter: ["class"] });

    return panel;
  }

  function inject() {
    if (document.getElementById("top1-start-here")) return;
    var header = document.querySelector("header.hub");
    var controls =
      document.querySelector(".controls#hub-content") || document.querySelector(".controls");
    var panel = buildPanel();
    if (controls && controls.parentNode) {
      controls.parentNode.insertBefore(panel, controls);
    } else if (header && header.parentNode) {
      header.parentNode.insertBefore(panel, header.nextSibling);
    } else {
      document.body.insertBefore(panel, document.body.firstChild);
    }
  }

  function waitForHub(tries) {
    if (
      window.CurriculumHub &&
      window.CurriculumHub.unitsData &&
      window.CurriculumHub.unitsData.length
    ) {
      hub = window.CurriculumHub;
      Promise.all([
        getJson("/data/curriculum-unit-identities.json"),
        getJson("/data/curriculum-supports.json"),
        getJson("/data/curriculum-resource-taxonomy.json"),
        getJson("/data/curriculum-uifr-level4.json"),
      ]).then(function (res) {
        DATA.units = res[0];
        DATA.supports = res[1];
        DATA.taxonomy = res[2];
        DATA.uifr = res[3] || {};
        if (!DATA.uifr.masteryChecklist) {
          // minimal fallback so the layer still renders if a data file is missing
          DATA.uifr = DATA.uifr || {};
        }
        inject();
      });
      return;
    }
    if (tries <= 0) return;
    setTimeout(function () {
      waitForHub(tries - 1);
    }, 120);
  }

  ready(function () {
    waitForHub(60);
  });
})();
