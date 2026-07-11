/* EduWonderLab Learning Supports — additive, local-only lesson enhancement. */
(function () {
  "use strict";
  if (window.EWLLearningSupports && window.EWLLearningSupports.__loaded) return;

  var PROFILE_KEYS = [
    "read-understand",
    "focus-organize",
    "build-math",
    "express-thinking",
    "language-support",
    "challenge-extend",
  ];
  var PROFILE_LABELS = {
    "read-understand": ["Read & Understand", "Listen, vocabulary, and clearer steps"],
    "focus-organize": ["Focus & Organize", "Reduce visual competition and organize the task"],
    "build-math": ["Build the Math", "Worked example, readiness review, and models"],
    "express-thinking": ["Express My Thinking", "Sentence frames and mathematical word banks"],
    "language-support": ["Language Support", "Visual and bilingual vocabulary supports"],
    "challenge-extend": ["Challenge & Extend", "Transfer and deeper-reasoning prompts"],
  };
  var TOOLS = {
    listen: "Listen",
    focus: "Focus",
    words: "Words",
    example: "Example",
    model: "Model",
    explain: "Explain",
    extend: "Extend",
  };
  var STORE = "ewl-supports:v1:preferences";
  var state = { lesson: null, selected: new Set(), root: null, opener: null };

  function allow(values) {
    return (values || []).filter(function (value, index, all) {
      return PROFILE_KEYS.indexOf(value) >= 0 && all.indexOf(value) === index;
    });
  }

  function parseSettings(fragment) {
    try {
      var source = String(fragment || "");
      if (source.length > 2048) return [];
      var match = source.match(/(?:^#|[&#])ewl-supports=([^&]*)/);
      return match ? allow(decodeURIComponent(match[1]).split(",")) : [];
    } catch {
      return [];
    }
  }

  function serializeSettings(values) {
    var valid = allow(Array.from(values || []));
    return valid.length ? "#ewl-supports=" + valid.join(",") : "";
  }

  function storage(action, value) {
    try {
      if (action === "get") return localStorage.getItem(STORE);
      if (action === "set") localStorage.setItem(STORE, value);
      if (action === "remove") localStorage.removeItem(STORE);
    } catch {
      return null;
    }
    return null;
  }

  function el(tag, attributes, text) {
    var node = document.createElement(tag);
    Object.keys(attributes || {}).forEach(function (key) {
      if (key === "class") node.className = attributes[key];
      else if (key === "hidden") node.hidden = Boolean(attributes[key]);
      else node.setAttribute(key, attributes[key]);
    });
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function loadSelection() {
    var shared = parseSettings(location.hash);
    if (shared.length) return shared;
    try {
      var saved = JSON.parse(storage("get") || "null");
      return saved && saved.schemaVersion === 1 ? allow(saved.profiles) : [];
    } catch {
      return [];
    }
  }

  function enabledTools() {
    var result = new Set();
    state.selected.forEach(function (profile) {
      var map = {
        "read-understand": ["listen", "words"],
        "focus-organize": ["focus"],
        "build-math": ["example", "model"],
        "express-thinking": ["explain"],
        "language-support": ["listen", "words", "explain"],
        "challenge-extend": ["extend"],
      };
      (map[profile] || []).forEach(function (tool) {
        result.add(tool);
      });
    });
    return result;
  }

  function setPressed(button, value) {
    button.setAttribute("aria-pressed", value ? "true" : "false");
  }

  function updateTools() {
    if (!state.root) return;
    var enabled = enabledTools();
    var bar = state.root.querySelector("[data-ewl-supports-tools]");
    bar.hidden = enabled.size === 0;
    bar.querySelectorAll("[data-ewl-supports-tool]").forEach(function (button) {
      var available = enabled.has(button.dataset.ewlSupportsTool);
      button.hidden = !available;
      if (!available) setPressed(button, false);
    });
  }

  function stopSpeech() {
    try {
      window.speechSynthesis && window.speechSynthesis.cancel();
    } catch {
      /* optional */
    }
  }

  function renderList(items) {
    var list = el("ul", { class: "ewl-supports-content-list" });
    (items || []).forEach(function (item) {
      list.appendChild(el("li", {}, item));
    });
    return list;
  }

  function renderTool(tool) {
    var panel = state.root.querySelector("[data-ewl-supports-content]");
    panel.replaceChildren(el("h3", {}, TOOLS[tool]));
    panel.hidden = false;
    if (tool === "listen") {
      var text = [state.lesson.contentObjective, state.lesson.languageObjective]
        .filter(Boolean)
        .join(" ");
      panel.appendChild(el("p", {}, text));
      var play = el("button", { type: "button", class: "ewl-supports-action" }, "Read aloud");
      var stop = el("button", { type: "button", class: "ewl-supports-action" }, "Stop");
      play.addEventListener("click", function () {
        stopSpeech();
        try {
          var utterance = new SpeechSynthesisUtterance(text);
          utterance.rate = 0.9;
          window.speechSynthesis && window.speechSynthesis.speak(utterance);
        } catch {
          panel.appendChild(
            el("p", { role: "status" }, "Read-aloud is unavailable in this browser."),
          );
        }
      });
      stop.addEventListener("click", stopSpeech);
      panel.append(play, stop);
    } else if (tool === "words") {
      state.lesson.vocabulary.forEach(function (word) {
        var card = el("section", { class: "ewl-supports-word" });
        card.append(
          el("h4", {}, word.term + (word.termEs ? " · " + word.termEs : "")),
          el("p", {}, word.definition),
        );
        if (word.visual) card.appendChild(el("p", { class: "ewl-supports-visual" }, word.visual));
        panel.appendChild(card);
      });
    } else if (tool === "example") panel.appendChild(renderList(state.lesson.workedExample));
    else if (tool === "model") {
      panel.append(
        el("p", {}, "Review the prerequisite skill before continuing."),
        el(
          "a",
          { class: "ewl-supports-action", href: state.lesson.readinessHref },
          "Open Get Ready support",
        ),
      );
    } else if (tool === "explain") {
      panel.append(
        renderList(state.lesson.sentenceFrames),
        el(
          "p",
          { class: "ewl-supports-word-bank" },
          "Word bank: " + state.lesson.wordBank.join(" · "),
        ),
      );
    } else if (tool === "extend") panel.appendChild(renderList(state.lesson.extensionPrompts));
  }

  function activateTool(button) {
    var tool = button.dataset.ewlSupportsTool;
    if (tool === "focus") {
      var active = !document.body.classList.contains("ewl-supports-focus-active");
      document.body.classList.toggle("ewl-supports-focus-active", active);
      setPressed(button, active);
      return;
    }
    state.root.querySelectorAll("[data-ewl-supports-tool]").forEach(function (item) {
      if (item.dataset.ewlSupportsTool !== "focus") setPressed(item, item === button);
    });
    renderTool(tool);
  }

  function closeDialog() {
    if (!state.root) return;
    state.root.querySelector("[role=dialog]").hidden = true;
    document.body.classList.remove("ewl-supports-dialog-open");
    if (state.opener) state.opener.focus();
  }

  function reset() {
    stopSpeech();
    state.selected.clear();
    storage("remove");
    document.body.classList.remove("ewl-supports-focus-active");
    state.root.querySelectorAll("[aria-pressed]").forEach(function (button) {
      setPressed(button, false);
    });
    var panel = state.root.querySelector("[data-ewl-supports-content]");
    panel.replaceChildren();
    panel.hidden = true;
    updateTools();
  }

  function buildUi() {
    var root = el("aside", {
      class: "ewl-supports-root",
      "data-ewl-supports-root": "",
      "aria-label": "Learning Supports",
    });
    var teacher = el(
      "button",
      { type: "button", class: "ewl-supports-teacher", "data-ewl-supports-teacher": "" },
      "Prepare Supports",
    );
    var tools = el("nav", {
      class: "ewl-supports-tools",
      "data-ewl-supports-tools": "",
      hidden: true,
      "aria-label": "Learning Tools",
    });
    Object.keys(TOOLS).forEach(function (key) {
      var button = el(
        "button",
        { type: "button", "data-ewl-supports-tool": key, "aria-pressed": "false", hidden: true },
        TOOLS[key],
      );
      button.addEventListener("click", function () {
        activateTool(button);
      });
      tools.appendChild(button);
    });
    var content = el("section", {
      class: "ewl-supports-content",
      "data-ewl-supports-content": "",
      hidden: true,
      "aria-live": "polite",
    });
    var dialog = el("section", {
      class: "ewl-supports-dialog",
      role: "dialog",
      "aria-modal": "true",
      "aria-labelledby": "ewl-supports-title",
      hidden: true,
    });
    var heading = el("div", { class: "ewl-supports-dialog-header" });
    var close = el(
      "button",
      { type: "button", class: "ewl-supports-close", "aria-label": "Close Learning Supports" },
      "×",
    );
    heading.append(el("h2", { id: "ewl-supports-title" }, "Prepare Learning Supports"), close);
    dialog.append(
      heading,
      el("p", {}, "Choose access tools while keeping the grade-level learning target unchanged."),
    );
    var profiles = el("div", { class: "ewl-supports-profiles" });
    PROFILE_KEYS.forEach(function (key) {
      var copy = PROFILE_LABELS[key];
      var button = el("button", {
        type: "button",
        "data-ewl-supports-profile": key,
        "aria-pressed": state.selected.has(key) ? "true" : "false",
      });
      button.append(el("strong", {}, copy[0]), el("span", {}, copy[1]));
      button.addEventListener("click", function () {
        state.selected.has(key) ? state.selected.delete(key) : state.selected.add(key);
        setPressed(button, state.selected.has(key));
        storage("set", JSON.stringify({ schemaVersion: 1, profiles: Array.from(state.selected) }));
        updateTools();
      });
      profiles.appendChild(button);
    });
    dialog.appendChild(profiles);
    var actions = el("div", { class: "ewl-supports-dialog-actions" });
    var share = el(
      "button",
      { type: "button", class: "ewl-supports-action", "data-ewl-supports-copy": "" },
      "Prepare support link",
    );
    var resetButton = el(
      "button",
      { type: "button", class: "ewl-supports-action", "data-ewl-supports-reset": "" },
      "Reset supports",
    );
    var status = el("span", { role: "status", "aria-live": "polite" });
    share.addEventListener("click", function () {
      history.replaceState(null, "", location.pathname + serializeSettings(state.selected));
      status.textContent = "Support settings added to the address bar.";
    });
    resetButton.addEventListener("click", reset);
    actions.append(share, resetButton, status);
    dialog.appendChild(actions);
    teacher.addEventListener("click", function () {
      state.opener = teacher;
      dialog.hidden = false;
      document.body.classList.add("ewl-supports-dialog-open");
      close.focus();
    });
    close.addEventListener("click", closeDialog);
    root.append(teacher, tools, content, dialog);
    document.body.appendChild(root);
    state.root = root;
    updateTools();
  }

  function resolveManifest() {
    if (window.__EWL_SUPPORTS_MANIFEST__) return Promise.resolve(window.__EWL_SUPPORTS_MANIFEST__);
    return fetch("/assets/learning-supports/manifest.json").then(function (response) {
      if (!response.ok) throw new Error("manifest unavailable");
      return response.json();
    });
  }

  function init() {
    if (state.root || !document.body) return Promise.resolve(Boolean(state.root));
    var lessonId = document.documentElement.getAttribute("data-ewl-supports-lesson");
    if (!/^\d+-\d+$/.test(lessonId || "")) return Promise.resolve(false);
    function mount(manifest) {
      if (!manifest || manifest.schemaVersion !== 1 || !Array.isArray(manifest.lessons))
        return false;
      var lesson = manifest.lessons.find(function (item) {
        return item.lessonId === lessonId;
      });
      if (!lesson || !Array.isArray(lesson.profiles)) return false;
      state.lesson = lesson;
      state.selected = new Set(loadSelection());
      buildUi();
      return true;
    }
    if (window.__EWL_SUPPORTS_MANIFEST__)
      return Promise.resolve(mount(window.__EWL_SUPPORTS_MANIFEST__));
    return resolveManifest()
      .then(mount)
      .catch(function () {
        return false;
      });
  }

  function destroy() {
    stopSpeech();
    document.body.classList.remove("ewl-supports-focus-active", "ewl-supports-dialog-open");
    if (state.root) state.root.remove();
    state = { lesson: null, selected: new Set(), root: null, opener: null };
  }

  document.addEventListener("keydown", function (event) {
    if (!state.root) return;
    var dialog = state.root.querySelector("[role=dialog]");
    if (dialog.hidden) return;
    if (event.key === "Escape") closeDialog();
    if (event.key === "Tab") {
      var focusable = Array.from(
        dialog.querySelectorAll("button:not([hidden]), a[href]:not([hidden])"),
      );
      if (!focusable.length) return;
      var first = focusable[0];
      var last = focusable[focusable.length - 1];
      if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      } else if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      }
    }
  });
  window.EWLLearningSupports = {
    __loaded: true,
    version: "1.0.0",
    init: init,
    destroy: destroy,
    parseSettings: parseSettings,
    serializeSettings: serializeSettings,
  };
  if (document.body) init();
  else document.addEventListener("DOMContentLoaded", init, { once: true });
})();
