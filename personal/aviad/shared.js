(function () {
  // Global Subject State
  var subject = document.body.dataset.subject || "hub";
  var storageKey = "ewl-aviad-" + subject + "-v3";

  var state = {
    done: {},
    notes: {},
    interactive: {}, // Stores responses for matching/sorting/solving
    highScores: {}, // Stores highest score achieved in embedded subject games
  };

  try {
    var stored = localStorage.getItem(storageKey);
    if (stored) {
      state = JSON.parse(stored);
    }
  } catch (error) {
    console.error("Failed to load local state:", error);
  }

  // Web Audio Synth for Arcade Sound Effects
  var audioCtx = null;
  function playArcadeSound(type) {
    try {
      if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      }
      if (audioCtx.state === "suspended") {
        audioCtx.resume();
      }

      var now = audioCtx.currentTime;

      if (type === "fail" || type === true) {
        // Lower frequency descending buzz
        var osc = audioCtx.createOscillator();
        var gain = audioCtx.createGain();
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(140, now);
        osc.frequency.linearRampToValueAtTime(70, now + 0.2);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(now);
        osc.stop(now + 0.22);
      } else if (type === "success" || type === false) {
        // High ascending shiny arpeggio
        var freqs = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
        freqs.forEach(function (freq, i) {
          var osc = audioCtx.createOscillator();
          var gain = audioCtx.createGain();
          osc.type = "triangle";
          osc.frequency.setValueAtTime(freq, now + i * 0.07);
          gain.gain.setValueAtTime(0.08, now + i * 0.07);
          gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.07 + 0.25);
          osc.connect(gain);
          gain.connect(audioCtx.destination);
          osc.start(now + i * 0.07);
          osc.stop(now + i * 0.07 + 0.35);
        });
      } else if (type === "game-start") {
        // Upbeat arcade insert coin sound
        var notes = [440, 554.37, 659.25, 880]; // A4, C#5, E5, A5
        notes.forEach(function (freq, i) {
          var osc = audioCtx.createOscillator();
          var gain = audioCtx.createGain();
          osc.type = "square";
          osc.frequency.setValueAtTime(freq, now + i * 0.05);
          gain.gain.setValueAtTime(0.05, now + i * 0.05);
          gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.05 + 0.15);
          osc.connect(gain);
          gain.connect(audioCtx.destination);
          osc.start(now + i * 0.05);
          osc.stop(now + i * 0.05 + 0.2);
        });
      } else if (type === "hit") {
        // Damage sound
        var osc = audioCtx.createOscillator();
        var gain = audioCtx.createGain();
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(300, now);
        osc.frequency.exponentialRampToValueAtTime(100, now + 0.1);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(now);
        osc.stop(now + 0.12);
      } else if (type === "powerup") {
        // Rising retro laser
        var osc = audioCtx.createOscillator();
        var gain = audioCtx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(400, now);
        osc.frequency.exponentialRampToValueAtTime(1600, now + 0.3);
        gain.gain.setValueAtTime(0.06, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(now);
        osc.stop(now + 0.32);
      }
    } catch (err) {
      console.warn("Web Audio chime synth failed:", err);
    }
  }

  // Update Page Progress
  function updateProgress() {
    var cards = Array.from(document.querySelectorAll(".activity"));
    if (!cards.length) return;

    var doneCount = 0;
    cards.forEach(function (card) {
      var id = card.dataset.id;
      var area = card.querySelector("textarea");
      var isCompleted = Boolean(state.done[id]);

      card.classList.toggle("done", isCompleted);

      // Load saved notes if textarea is empty or reset
      if (area && !area.value && state.notes[id]) {
        area.value = state.notes[id];
      }

      if (isCompleted) {
        doneCount += 1;
      }
    });

    var pct = Math.round((doneCount / cards.length) * 100);

    var xpEl = document.getElementById("xp");
    var doneEl = document.getElementById("done");

    if (xpEl) xpEl.textContent = doneCount * 50 + " XP";
    if (doneEl) doneEl.textContent = pct + "%";

    // Save state back to localStorage
    try {
      localStorage.setItem(storageKey, JSON.stringify(state));
    } catch (e) {}

    // Save subject progress to global registry for main hub
    try {
      var hubRegistry =
        JSON.parse(localStorage.getItem("ewl-aviad-registry-v3")) || {};
      hubRegistry[subject] = {
        doneCount: doneCount,
        totalCount: cards.length,
        pct: pct,
        highScores: state.highScores || {},
      };
      localStorage.setItem(
        "ewl-aviad-registry-v3",
        JSON.stringify(hubRegistry),
      );
    } catch (e) {}
  }

  // Drag and Drop Engine
  function initDragAndDrop() {
    var draggedItem = null;

    document.addEventListener("dragstart", function (e) {
      if (e.target.matches(".drag-item")) {
        draggedItem = e.target;
        e.target.classList.add("dragging");
        e.dataTransfer.setData(
          "text/plain",
          e.target.dataset.val || e.target.textContent,
        );
      }
    });

    document.addEventListener("dragend", function (e) {
      if (e.target.matches(".drag-item")) {
        e.target.classList.remove("dragging");
      }
    });

    document.addEventListener("dragover", function (e) {
      var container = e.target.closest(".drop-container");
      if (container) {
        e.preventDefault();
        container.classList.add("dragover");
      }
    });

    document.addEventListener("dragleave", function (e) {
      var container = e.target.closest(".drop-container");
      if (container && !container.contains(e.relatedTarget)) {
        container.classList.remove("dragover");
      }
    });

    document.addEventListener("drop", function (e) {
      var container = e.target.closest(".drop-container");
      if (container) {
        e.preventDefault();
        container.classList.remove("dragover");
        if (draggedItem) {
          // Check limits
          var maxItems = parseInt(container.dataset.max, 10) || Infinity;
          var currentItems = container.querySelectorAll(".drag-item");

          if (currentItems.length >= maxItems) {
            // Return first item to its drawer
            var drawerId = currentItems[0].dataset.drawer;
            var drawer = document.getElementById(drawerId);
            if (drawer) {
              drawer.appendChild(currentItems[0]);
            } else {
              currentItems[0].remove();
            }
          }

          container.appendChild(draggedItem);

          // Trigger validation
          var activity = container.closest(".activity");
          if (activity && typeof window.validateActivityState === "function") {
            window.validateActivityState(activity);
          }
        }
      }
    });
  }

  // Global High Score Saver
  function saveHighScore(gameId, score) {
    if (!state.highScores) state.highScores = {};
    var currentHigh = state.highScores[gameId] || 0;
    if (score > currentHigh) {
      state.highScores[gameId] = score;
      try {
        localStorage.setItem(storageKey, JSON.stringify(state));
      } catch (e) {}
      updateProgress();
      return true; // New High Score
    }
    return false;
  }

  // Click Event Listeners
  document.addEventListener("click", function (event) {
    var target = event.target;

    // 1. Tab Filter clicks
    if (target.matches("[data-filter]")) {
      document.querySelectorAll("[data-filter]").forEach(function (button) {
        button.setAttribute("aria-selected", String(button === target));
      });
      document.querySelectorAll(".activity").forEach(function (card) {
        card.style.display =
          target.dataset.filter === "all" ||
          card.dataset.type === target.dataset.filter
            ? "flex"
            : "none";
      });
    }

    // 2. Save Workspace clicks
    if (target.matches("[data-save]")) {
      var saveCard = target.closest(".activity");
      var id = saveCard.dataset.id;
      var area = saveCard.querySelector("textarea");
      if (area) {
        state.notes[id] = area.value;
      }

      if (typeof window.getInteractiveState === "function") {
        state.interactive[id] = window.getInteractiveState(saveCard);
      }

      try {
        localStorage.setItem(storageKey, JSON.stringify(state));
      } catch (e) {}

      target.textContent = "Saved";
      target.style.background = "var(--success)";
      target.style.color = "#ffffff";
      setTimeout(function () {
        target.textContent = "Save workspace";
        target.style.background = "";
        target.style.color = "";
      }, 1000);
    }

    // 3. Complete clicks
    if (target.matches("[data-complete]")) {
      var card = target.closest(".activity");
      var id = card.dataset.id;
      var area = card.querySelector("textarea");

      // Validate
      if (typeof window.checkInteractiveComplete === "function") {
        var validation = window.checkInteractiveComplete(card);
        if (!validation.success) {
          playArcadeSound("fail");
          alert(
            validation.message || "Complete the activity requirements first!",
          );
          return;
        }
      } else {
        // Default text validation
        var textVal = area ? area.value.trim() : "";
        if (!state.done[id] && textVal.length < 20) {
          playArcadeSound("fail");
          if (area) {
            area.placeholder =
              "Please enter real evidence here first (at least 20 letters) so your parent or teacher can see your work!";
            area.focus();
          }
          return;
        }
      }

      // Toggle Done
      state.done[id] = !state.done[id];
      if (area) {
        state.notes[id] = area.value;
      }

      if (state.done[id]) {
        playArcadeSound("success");
      }

      updateProgress();

      target.textContent = state.done[id]
        ? "Mark Incomplete"
        : "Complete with evidence";
      target.classList.toggle("secondary", state.done[id]);
    }
  });

  // ---- Per-answer instant correct/incorrect feedback ----
  // Pages register an answer key: { fieldId: "correctVal" | ["v1","v2"] }.
  // Any registered <select> is graded the moment a choice is made; any
  // registered text/number <input> is graded when the student leaves the
  // field (the native "change" event). Matching is case-insensitive and
  // numeric-tolerant ("7" matches "7.0", " -4 " matches "-4").
  var answerKey = {};

  function normalizeAnswer(v) {
    return String(v == null ? "" : v)
      .trim()
      .toLowerCase();
  }

  var NUMERIC_RE = /^-?\d*\.?\d+$/;

  function valueMatches(expected, actual) {
    var e = normalizeAnswer(expected);
    var a = normalizeAnswer(actual);
    if (e === a) return true;
    if (NUMERIC_RE.test(e) && NUMERIC_RE.test(a)) {
      return parseFloat(e) === parseFloat(a);
    }
    return false;
  }

  function isCorrect(id, value) {
    var key = answerKey[id];
    if (key == null) return null;
    var list = Array.isArray(key) ? key : [key];
    for (var i = 0; i < list.length; i++) {
      if (valueMatches(list[i], value)) return true;
    }
    return false;
  }

  function gradeField(field) {
    if (!field || !field.id || !(field.id in answerKey)) return;
    var mark = field.parentNode
      ? field.parentNode.querySelector('.sel-mark[data-for="' + field.id + '"]')
      : null;
    if (!mark) {
      mark = document.createElement("span");
      mark.className = "sel-mark";
      mark.setAttribute("data-for", field.id);
      mark.setAttribute("aria-hidden", "true");
      field.insertAdjacentElement("afterend", mark);
    }
    if (!String(field.value == null ? "" : field.value).trim()) {
      field.classList.remove("sel-correct", "sel-incorrect");
      mark.textContent = "";
      mark.className = "sel-mark";
      return;
    }
    var ok = isCorrect(field.id, field.value);
    field.classList.toggle("sel-correct", ok === true);
    field.classList.toggle("sel-incorrect", ok === false);
    mark.textContent = ok ? "✓" : "✗";
    mark.className = "sel-mark " + (ok ? "ok" : "no");
  }

  function gradeAllFields() {
    Object.keys(answerKey).forEach(function (id) {
      var field = document.getElementById(id);
      if (field && String(field.value == null ? "" : field.value).trim()) {
        gradeField(field);
      }
    });
  }

  document.addEventListener("change", function (e) {
    var field = e.target;
    if (!field || !field.matches || !field.matches("select, input")) return;
    if (!(field.id in answerKey)) return;
    var hasVal = String(field.value == null ? "" : field.value).trim() !== "";
    gradeField(field);
    if (hasVal) {
      playArcadeSound(isCorrect(field.id, field.value) ? "success" : "fail");
    }
  });

  // Expose API
  window.EWL = {
    state: state,
    save: function () {
      try {
        localStorage.setItem(storageKey, JSON.stringify(state));
      } catch (e) {}
    },
    updateProgress: updateProgress,
    playAudio: playArcadeSound,
    saveHighScore: saveHighScore,
    registerAnswers: function (map) {
      Object.keys(map || {}).forEach(function (id) {
        answerKey[id] = map[id];
      });
      gradeAllFields();
      // Re-grade after restore pass populates saved selections.
      setTimeout(gradeAllFields, 250);
    },
  };

  // Initialize
  updateProgress();
  initDragAndDrop();

  setTimeout(function () {
    document.querySelectorAll(".activity").forEach(function (card) {
      var id = card.dataset.id;
      var completeBtn = card.querySelector("[data-complete]");
      if (completeBtn && state.done[id]) {
        completeBtn.textContent = "Mark Incomplete";
        completeBtn.classList.add("secondary");
      }

      if (
        state.interactive[id] &&
        typeof window.restoreInteractiveState === "function"
      ) {
        window.restoreInteractiveState(card, state.interactive[id]);
      }
    });
  }, 100);
})();
