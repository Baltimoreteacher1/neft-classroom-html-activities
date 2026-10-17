// @ts-nocheck — not yet type-clean. This file is INSIDE the checkJs program
// (see tsconfig.json); the marker is the debt, and removing it is the unit of
// work. tools/typecheck-ratchet.test.mjs pins the count so it can only shrink.
(function () {
  "use strict";

  var MANIFEST_URL = "/data/curriculum-launch-manifest.json";
  var STORAGE_PREFIX = "curriculumStudentLaunch:";
  var RESOURCE_LABELS = {
    lesson: "Must do · Start interactive lesson",
    readiness: "Before you begin · Get ready",
    guidedNotes: "If needed · Guided notes",
    handout: "Handout",
    worksheetLevel0: "Start with support",
    worksheet: "Worksheet 1",
    worksheet2: "Worksheet 2",
    mstarWorksheet: "MSTAR practice",
    learningLab: "Interactive learning lab",
    homework: "At home · Homework practice",
    familyPage: "At home · Family help",
    studentHelp: "If needed · Student help",
    exitTicket: "Show what you know · Final check",
  };

  var lessonsById = {};
  var playlist = [];
  var position = 0;
  var speaking = false;
  var temporaryProgress = Object.create(null);

  function byId(id) {
    return document.getElementById(id);
  }

  function validId(value) {
    return /^[0-9]{1,2}-[0-9]{1,2}(?:-flagship)?$/.test(value || "");
  }

  function queryIds() {
    var params = new URLSearchParams(window.location.search);
    var rawPlaylist = params.get("playlist") || "";
    var ids = rawPlaylist
      .split(",")
      .map(function (id) {
        return id.trim();
      })
      .filter(validId);
    if (!ids.length) {
      var lessonId = params.get("lesson") || "1-1";
      if (validId(lessonId)) ids.push(lessonId);
    }
    return ids.slice(0, 20);
  }

  function querySupports() {
    var raw = new URLSearchParams(window.location.search).get("supports") || "";
    return raw
      .split(",")
      .map(function (item) {
        return item.trim();
      })
      .filter(function (item) {
        return /^[a-z0-9][a-z0-9-]{0,49}$/.test(item);
      })
      .slice(0, 30);
  }

  function setText(id, value) {
    var node = byId(id);
    if (node) node.textContent = value || "";
  }

  function forceStudentMode(path, lessonId, key) {
    if (
      typeof path !== "string" ||
      !path.startsWith("/") ||
      path.startsWith("//") ||
      /[\\\u0000-\u001f]/.test(path)
    )
      return "";
    var url;
    try {
      url = new URL(path, window.location.origin);
    } catch (_error) {
      return "";
    }
    if (url.origin !== window.location.origin) return "";
    if (key === "learningLab") {
      if (!/^\/curriculum\/learning-labs\/[a-z0-9]+(?:-[a-z0-9]+)*\/$/.test(url.pathname))
        return "";
    } else if (
      !url.pathname.startsWith("/lessons/" + lessonId + "/") ||
      /teacher|answer(?:-|_)?key|gradebook|dashboard|\.docx|\.pdf/i.test(url.pathname)
    ) {
      return "";
    }
    url.searchParams.set("student", "1");
    var supports = querySupports();
    // Keep section anchors such as #reflect: the supports engine accepts both
    // query and fragment transport, so use the query when linking to a lesson.
    if (supports.length) url.searchParams.set("supports", supports.join(","));
    return url.pathname + url.search + url.hash;
  }

  function addTextElement(parent, tag, className, value) {
    var node = document.createElement(tag);
    node.className = className;
    node.textContent = value;
    parent.appendChild(node);
    return node;
  }

  function showError(message) {
    setText("launch-status", message || "Lesson unavailable.");
    byId("lesson-view").hidden = true;
    byId("launch-error").hidden = false;
  }

  function progressKey(lessonId) {
    return STORAGE_PREFIX + lessonId;
  }

  function checklistStatus(message) {
    setText(byId("checklist-status") ? "checklist-status" : "launch-status", message);
  }

  function loadProgress(lessonId) {
    var saved = temporaryProgress[lessonId] || {};
    var temporaryMessage =
      "Your checklist changes are temporary. This browser could not save them; they will be lost when you close or reload this page.";
    if (temporaryProgress[lessonId]) {
      checklistStatus(temporaryMessage);
    } else {
      try {
        var parsed = JSON.parse(localStorage.getItem(progressKey(lessonId)) || "null");
        if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) saved = parsed;
        checklistStatus(
          "Mark the steps you complete. This checklist is separate from lesson scores.",
        );
      } catch (_error) {
        checklistStatus(
          "Saved checklist progress could not be loaded. You can still mark steps here; changes may be temporary.",
        );
      }
    }
    document.querySelectorAll("[data-progress]").forEach(function (box) {
      box.checked = saved[box.dataset.progress] === true;
      box.onchange = function () {
        var next = {};
        document.querySelectorAll("[data-progress]").forEach(function (item) {
          next[item.dataset.progress] = item.checked;
        });
        try {
          localStorage.setItem(progressKey(lessonId), JSON.stringify(next));
          delete temporaryProgress[lessonId];
          checklistStatus("Checklist saved on this device.");
        } catch (_error) {
          temporaryProgress[lessonId] = next;
          checklistStatus(temporaryMessage);
        }
        updateNextStep();
      };
    });
    updateNextStep();
  }

  function updateNextStep() {
    var boxes = {};
    document.querySelectorAll("[data-progress]").forEach(function (box) {
      boxes[box.dataset.progress] = box.checked;
    });
    var message = "Next: open the interactive lesson and follow each step.";
    if (boxes.lesson && !boxes.explain) {
      message = "Next: explain one answer with the sentence frame.";
    } else if (boxes.lesson && boxes.explain && !boxes.check) {
      message = "Next: complete the final check to show what you know.";
    } else if (boxes.lesson && boxes.explain && boxes.check) {
      message =
        "You marked every step complete. If the final check felt difficult, use Student Help; if it felt solid, choose Practice or Challenge in the lesson.";
    }
    setText("next-step", message);
  }

  var LAUNCH_MENTORS = {
    maya: {
      name: "Maya",
      move: "Draw It Out",
      tip: "Sketch a quick tape diagram or number line first.",
    },
    jordan: {
      name: "Jordan",
      move: "Table It",
      tip: "Organize values in a two-column table to spot the pattern.",
    },
    alex: {
      name: "Alex",
      move: "Try a Simpler Case",
      tip: "Test with small whole numbers first, then use the same rule.",
    },
    sam: {
      name: "Sam",
      move: "Estimate First",
      tip: "Make a 5-second ballpark estimate before computing.",
    },
    riley: {
      name: "Riley",
      move: "Work Backwards",
      tip: "Start from the goal and use inverse operations to check.",
    },
  };

  function speakShortText(text) {
    try {
      if (!("speechSynthesis" in window) || typeof SpeechSynthesisUtterance === "undefined") return;
      window.speechSynthesis.cancel();
      var u = new SpeechSynthesisUtterance(String(text || ""));
      u.rate = 0.92;
      window.speechSynthesis.speak(u);
    } catch (_e) {
      /* ignore speech errors */
    }
  }

  function renderVocabulary(lesson) {
    var container = byId("vocabulary");
    container.replaceChildren();
    var words = (lesson.vocabulary || []).slice(0, 10);
    if (!words.length) words = ["model", "explain", "reasoning"];
    words.forEach(function (word) {
      var pill = addTextElement(container, "span", "vocabulary-word", "🔊 " + word);
      pill.setAttribute("role", "button");
      pill.setAttribute("tabindex", "0");
      pill.setAttribute("title", "Tap to hear pronunciation and add to your explanation");
      var onPick = function () {
        speakShortText(word);
        var box = byId("sentence-rehearsal-input");
        if (box) {
          box.value = box.value ? box.value.replace(/_{2,}/, word) : word;
          if (!box.value.includes(word)) box.value = (box.value.trim() + " " + word).trim();
          box.focus();
        }
      };
      pill.onclick = onPick;
      pill.onkeydown = function (e) {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onPick();
        }
      };
    });
    var frame = (lesson.sentenceFrames || [])[0] || "My answer is ___ because ___.";
    setText("sentence-frame", "Sentence frame: " + frame);

    var frameNode = byId("sentence-frame");
    if (frameNode && frameNode.parentNode) {
      var existingRehearsal = byId("sentence-rehearsal-wrap");
      if (existingRehearsal) existingRehearsal.remove();
      var wrap = document.createElement("div");
      wrap.id = "sentence-rehearsal-wrap";
      wrap.className = "sentence-rehearsal-wrap";
      try {
        var rawMentor = localStorage.getItem("nt_mentor");
        var parsedMentor = rawMentor ? JSON.parse(rawMentor) : null;
        var mentor =
          parsedMentor && parsedMentor.id
            ? LAUNCH_MENTORS[String(parsedMentor.id).toLowerCase()]
            : null;
        if (mentor) {
          var mentorNote = document.createElement("p");
          mentorNote.className = "launch-mentor-tip";
          mentorNote.textContent =
            "🧭 " + mentor.name + "’s Move (" + mentor.move + "): " + mentor.tip;
          wrap.appendChild(mentorNote);
        }
      } catch (_e) {
        /* ignore storage error */
      }
      var input = document.createElement("textarea");
      input.id = "sentence-rehearsal-input";
      input.className = "sentence-rehearsal-input";
      input.rows = 2;
      input.placeholder = frame;
      input.setAttribute("aria-label", "Practice your math explanation using the sentence frame");
      var btnRow = document.createElement("div");
      btnRow.className = "sentence-rehearsal-actions";
      var useFrameBtn = document.createElement("button");
      useFrameBtn.type = "button";
      useFrameBtn.className = "small-button";
      useFrameBtn.textContent = "✍️ Use sentence starter";
      useFrameBtn.onclick = function () {
        if (!input.value.trim()) input.value = frame;
        input.focus();
      };
      var hearBtn = document.createElement("button");
      hearBtn.type = "button";
      hearBtn.className = "small-button";
      hearBtn.textContent = "🔊 Hear my explanation";
      hearBtn.onclick = function () {
        speakShortText(input.value.trim() || frame);
      };
      var markExplainBtn = document.createElement("button");
      markExplainBtn.type = "button";
      markExplainBtn.className = "small-button";
      markExplainBtn.textContent = "✓ Mark reasoning explained";
      markExplainBtn.onclick = function () {
        var explainBox = document.querySelector('[data-progress="explain"]');
        if (explainBox && !explainBox.checked) {
          explainBox.checked = true;
          if (typeof explainBox.onchange === "function") explainBox.onchange();
        }
      };
      btnRow.append(useFrameBtn, hearBtn, markExplainBtn);
      wrap.append(input, btnRow);
      frameNode.after(wrap);
    }
  }

  function renderResources(lesson) {
    var container = byId("resource-links");
    container.replaceChildren();
    function addLinks(parent, keys) {
      keys.forEach(function (key) {
        var href = forceStudentMode(lesson.resources && lesson.resources[key], lesson.id, key);
        if (!href) return;
        var link = document.createElement("a");
        link.className = "resource-link";
        link.dataset.resource = key;
        link.href = href;
        link.textContent = RESOURCE_LABELS[key];
        parent.appendChild(link);
      });
    }
    addLinks(container, ["lesson", "readiness", "guidedNotes", "studentHelp", "exitTicket"]);
    [
      [
        "Choose practice",
        ["handout", "worksheetLevel0", "worksheet", "worksheet2", "mstarWorksheet"],
      ],
      ["Explore & apply", ["learningLab"]],
      ["At home", ["homework", "familyPage"]],
    ].forEach(function (group) {
      var details = document.createElement("details");
      details.className = "resource-group";
      var links = document.createElement("div");
      links.className = "resource-group-content";
      addLinks(links, group[1]);
      if (!links.children.length) return;
      var summary = document.createElement("summary");
      summary.textContent =
        group[0] +
        " · " +
        links.children.length +
        (links.children.length === 1 ? " resource" : " resources");
      details.append(summary, links);
      container.appendChild(details);
    });
    byId("start-lesson").href = forceStudentMode(lesson.resources.lesson, lesson.id);
  }

  function savedLessonWork(lessonId) {
    var latest = null;
    try {
      for (var i = 0; i < localStorage.length; i++) {
        var key = localStorage.key(i);
        if (!key || !key.startsWith("nsr:rec:")) continue;
        var record;
        try {
          record = JSON.parse(localStorage.getItem(key) || "null");
        } catch (_invalidRecord) {
          continue;
        }
        if (!record || typeof record.url !== "string") continue;
        var url;
        try {
          url = new URL(record.url, window.location.origin);
        } catch (_invalidUrl) {
          continue;
        }
        if (url.origin !== window.location.origin) continue;
        if (!url.pathname.startsWith("/lessons/" + lessonId + "/")) continue;
        if (/teacher|answer(?:-|_)?key|gradebook|dashboard/i.test(url.pathname)) continue;
        var updated = Date.parse(record.updatedAt);
        if (!Number.isFinite(updated) || Date.now() - updated > 30 * 86400000) continue;
        if (Number(record.progressPercent) >= 100) continue;
        if (!latest || updated > latest.updated) {
          latest = {
            url: url.pathname + url.search + url.hash,
            updated: updated,
            step: record.currentStepLabel || record.phase || "",
          };
        }
      }
    } catch (_error) {
      return null;
    }
    return latest;
  }

  function renderMission(lesson) {
    var store = window.EWLStateStore;
    var stages = {};
    var check = null;
    if (store && !lesson.id.endsWith("-flagship")) {
      try {
        store.setLesson(lesson.id);
        var state = store.get();
        stages = (state.mission[lesson.id] && state.mission[lesson.id].stages) || {};
        check = state.checks[lesson.id] || null;
      } catch (_error) {
        stages = {};
      }
    }
    var steps = [
      ["curious", "Investigate the lesson", "lesson"],
      ["notes", "Represent and explain", "guidedNotes"],
      ["lab", "Test a new case", "learningLab"],
      ["check", "Check your understanding", "exitTicket"],
    ];
    var list = byId("mission-stages");
    list.replaceChildren();
    var next = null;
    steps.forEach(function (step) {
      var href = forceStudentMode(
        lesson.resources && lesson.resources[step[2]],
        lesson.id,
        step[2],
      );
      if (!href) return;
      var item = document.createElement("li");
      var status = document.createElement("span");
      status.className = "mission-stage-status";
      status.textContent = stages[step[0]] ? "Recorded as done" : "To explore";
      var link = document.createElement("a");
      link.href = href;
      link.textContent = step[1];
      item.append(link, status);
      list.appendChild(item);
      if (!next && !stages[step[0]]) next = step[1].toLowerCase();
    });
    setText(
      "mission-guidance",
      next
        ? "Next: " + next + ". Your teacher may choose a different starting point."
        : "All available mission stages have recorded work. Try a new case or review your teacher's next assignment.",
    );
    setText(
      "mission-evidence",
      check && check.status === "ok"
        ? "A Check Yourself result is recorded. Open the final check to review or try again; completion alone does not show independent understanding."
        : check && check.status === "unsure"
          ? "Your Check Yourself result says you are unsure. Use a model or notes, then try a new check."
          : "Mission stages record activity. Your final check is separate evidence of understanding.",
    );
    var saved = savedLessonWork(lesson.id);
    var resume = byId("resume-work");
    resume.hidden = !saved;
    if (saved) {
      resume.href = forceStudentMode(saved.url, lesson.id, "lesson");
      resume.textContent = saved.step
        ? "Continue saved work: " + String(saved.step).slice(0, 80)
        : "Continue saved work";
    }
  }

  function readLesson(lesson) {
    if (!("speechSynthesis" in window)) {
      setText("launch-status", "Read aloud is not available in this browser.");
      return;
    }
    if (speaking) {
      window.speechSynthesis.cancel();
      speaking = false;
      byId("read-aloud").textContent = "🔊 Read aloud";
      return;
    }
    var words = (lesson.vocabulary || []).join(", ");
    var text = [
      lesson.title + ".",
      lesson.objective,
      lesson.languageObjective,
      "First, open the lesson and follow each step.",
      "Next, use the notes or help page if you need support.",
      "Then, explain one answer using the sentence frame.",
      "Finally, complete the check for understanding.",
      words ? "Words to know: " + words + "." : "",
    ]
      .filter(Boolean)
      .join(" ");
    var utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.92;
    utterance.onend = function () {
      speaking = false;
      byId("read-aloud").textContent = "🔊 Read aloud";
    };
    speaking = true;
    byId("read-aloud").textContent = "■ Stop reading";
    window.speechSynthesis.speak(utterance);
  }

  function renderPlaylistNavigation() {
    var nav = byId("playlist-nav");
    nav.hidden = playlist.length < 2;
    byId("previous-lesson").disabled = position === 0;
    byId("next-lesson").disabled = position >= playlist.length - 1;
    setText("playlist-position", `Lesson ${position + 1} of ${playlist.length}`);
  }

  function renderLesson() {
    var lesson = lessonsById[playlist[position]];
    if (!lesson || !forceStudentMode(lesson.resources && lesson.resources.lesson, lesson.id)) {
      showError("That lesson is not available in the student launcher.");
      return;
    }
    window.speechSynthesis?.cancel();
    speaking = false;
    setText("read-aloud", "🔊 Read aloud");
    setText("launch-status", "Lesson ready. Open the lesson or choose a resource below.");
    setText(
      "lesson-meta",
      `Unit ${lesson.unit} · Lesson ${lesson.id} · ${lesson.standard} · ${lesson.timeEstimate}`,
    );
    setText("lesson-title", lesson.title);
    setText("lesson-objective", "Math goal: " + lesson.objective);
    setText("language-objective", "Language goal: " + lesson.languageObjective);
    renderVocabulary(lesson);
    renderResources(lesson);
    renderMission(lesson);
    loadProgress(lesson.id);
    renderPlaylistNavigation();
    byId("launch-error").hidden = true;
    byId("lesson-view").hidden = false;
    byId("read-aloud").onclick = function () {
      readLesson(lesson);
    };
    document.title = lesson.title + " — Student Lesson";
    byId("lesson-main").focus();
  }

  function move(delta) {
    var next = position + delta;
    if (next < 0 || next >= playlist.length) return;
    position = next;
    renderLesson();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  byId("previous-lesson").addEventListener("click", function () {
    move(-1);
  });
  byId("next-lesson").addEventListener("click", function () {
    move(1);
  });

  fetch(MANIFEST_URL, { credentials: "same-origin" })
    .then(function (response) {
      if (!response.ok) throw new Error("manifest unavailable");
      return response.json();
    })
    .then(function (manifest) {
      (manifest.lessons || []).forEach(function (lesson) {
        lessonsById[lesson.id] = lesson;
      });
      playlist = queryIds().filter(function (id) {
        return Boolean(lessonsById[id]);
      });
      if (!playlist.length) throw new Error("unknown lesson");
      renderLesson();
    })
    .catch(function () {
      showError("We could not load that lesson. Please return to the curriculum hub.");
    });
})();
