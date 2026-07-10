(function () {
  "use strict";

  var MANIFEST_URL = "/data/curriculum-launch-manifest.json";
  var STORAGE_PREFIX = "curriculumStudentLaunch:";
  var RESOURCE_LABELS = {
    lesson: "Start interactive lesson",
    guidedNotes: "Guided notes",
    handout: "Practice handout",
    homework: "Homework practice",
    familyPage: "Family help",
    studentHelp: "Student help",
    exitTicket: "Check understanding",
  };

  var lessonsById = {};
  var playlist = [];
  var position = 0;
  var speaking = false;

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

  function setText(id, value) {
    var node = byId(id);
    if (node) node.textContent = value || "";
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

  function loadProgress(lessonId) {
    var saved = {};
    try {
      saved = JSON.parse(localStorage.getItem(progressKey(lessonId))) || {};
    } catch (error) {
      saved = {};
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
        } catch (error) {}
      };
    });
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
    Object.keys(RESOURCE_LABELS).forEach(function (key) {
      var path = lesson.resources && lesson.resources[key];
      if (!path) return;
      var link = document.createElement("a");
      link.className = "resource-link";
      link.href = path;
      link.textContent = RESOURCE_LABELS[key];
      container.appendChild(link);
    });
    byId("start-lesson").href = lesson.resources.lesson;
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
    if (!lesson) {
      showError("That lesson is not available in the student launcher.");
      return;
    }
    window.speechSynthesis?.cancel();
    speaking = false;
    setText("launch-status", "Lesson ready. Your work stays on this device.");
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
