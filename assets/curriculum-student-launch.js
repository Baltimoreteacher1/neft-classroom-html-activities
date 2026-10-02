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

  function renderVocabulary(lesson) {
    var container = byId("vocabulary");
    container.replaceChildren();
    var words = (lesson.vocabulary || []).slice(0, 10);
    if (!words.length) words = ["model", "explain", "reasoning"];
    words.forEach(function (word) {
      addTextElement(container, "span", "vocabulary-word", word);
    });
    var frame = (lesson.sentenceFrames || [])[0] || "My answer is ___ because ___.";
    setText("sentence-frame", "Sentence frame: " + frame);
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
