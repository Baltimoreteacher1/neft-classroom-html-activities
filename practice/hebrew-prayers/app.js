/* Hebrew Prayer Practice — interactive logic.
   No frameworks, works offline (after fonts cache). Uses Web Speech API
   SpeechSynthesis with a Hebrew voice when available, otherwise falls back
   to reading the transliteration with the default voice. */

(function () {
  "use strict";

  // ---------- state ----------
  var STORAGE_KEY = "hp-prayer-status-v1";
  var state = {
    current: null, // current prayer object
    mode: "both", // tr | he | both
    rate: 0.85,
    fontScale: 1,
    stepIndex: 0,
    speaking: false,
  };

  // ---------- elements ----------
  var $ = function (id) {
    return document.getElementById(id);
  };
  var picker = $("picker");
  var practice = $("practice");
  var cardGrid = $("cardGrid");
  var encourage = $("encourage");

  var practiceTitle = $("practiceTitle");
  var practiceSub = $("practiceSub");
  var practiceNote = $("practiceNote");
  var voiceWarn = $("voiceWarn");
  var linesWrap = $("linesWrap");
  var linesEl = $("lines");
  var stepEl = $("step");
  var stepBody = $("stepBody");
  var stepProgressBar = $("stepProgressBar");
  var stepProgressLabel = $("stepProgressLabel");

  var modeSeg = $("modeSeg");
  var playAllBtn = $("playAllBtn");
  var stepBtn = $("stepBtn");
  var backBtn = $("backBtn");
  var rateInput = $("rate");
  var fontInput = $("fontSize");
  var confidenceSet = $("confidenceSet");

  var wordPop = $("wordPop");
  var popHe = $("popHe");

  // ---------- storage ----------
  function loadStatus() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
    } catch (e) {
      return {};
    }
  }
  function saveStatus(map) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
    } catch (e) {
      /* ignore quota / private mode */
    }
  }
  function getStatus(id) {
    return loadStatus()[id] || "new";
  }
  function setStatus(id, status) {
    var map = loadStatus();
    map[id] = status;
    saveStatus(map);
  }

  var STATUS_META = {
    new: { label: "Still new", cls: "hp-status-new" },
    practicing: { label: "Practicing", cls: "hp-status-practicing" },
    confident: { label: "Confident ⭐", cls: "hp-status-confident" },
  };

  // ---------- speech ----------
  var synth = window.speechSynthesis;
  var hebrewVoice = null;
  var voiceChecked = false;

  function pickHebrewVoice() {
    if (!synth) return null;
    var voices = synth.getVoices() || [];
    for (var i = 0; i < voices.length; i++) {
      var lang = (voices[i].lang || "").toLowerCase();
      if (lang.indexOf("he") === 0 || lang.indexOf("iw") === 0) {
        return voices[i];
      }
    }
    return null;
  }

  function refreshVoice() {
    hebrewVoice = pickHebrewVoice();
    voiceChecked = true;
  }

  if (synth) {
    refreshVoice();
    if (typeof synth.onvoiceschanged !== "undefined") {
      synth.onvoiceschanged = refreshVoice;
    }
  }

  function stopSpeaking() {
    if (synth) synth.cancel();
    state.speaking = false;
    clearReadingHighlight();
    playAllBtn.classList.remove("is-playing");
    playAllBtn.textContent = "▶ Read whole prayer";
  }

  // Speak one line. onend fires after it finishes. Returns true if it spoke.
  function speakLine(line, onend) {
    if (!synth) {
      if (onend) onend();
      return;
    }
    var utter;
    if (hebrewVoice) {
      utter = new SpeechSynthesisUtterance(stripParens(line.he));
      utter.voice = hebrewVoice;
      utter.lang = "he-IL";
    } else {
      // fallback: read the transliteration with default voice
      utter = new SpeechSynthesisUtterance(stripParens(line.tr));
      utter.lang = "en-US";
    }
    utter.rate = state.rate;
    utter.onend = function () {
      if (onend) onend();
    };
    utter.onerror = function () {
      if (onend) onend();
    };
    synth.speak(utter);
  }

  function stripParens(text) {
    return text.replace(/\([^)]*\)/g, "").trim();
  }

  // ---------- highlight ----------
  function clearReadingHighlight() {
    var els = linesEl.querySelectorAll(".hp-line.is-reading");
    for (var i = 0; i < els.length; i++) {
      els[i].classList.remove("is-reading");
    }
  }

  // ---------- render: picker ----------
  function renderPicker() {
    cardGrid.innerHTML = "";
    var statusMap = loadStatus();
    var confidentCount = 0;

    PRAYERS.forEach(function (p) {
      var status = statusMap[p.id] || "new";
      if (status === "confident") confidentCount++;
      var meta = STATUS_META[status];

      var card = document.createElement("button");
      card.type = "button";
      card.className = "hp-prayer-card";
      card.setAttribute("aria-label", "Practice " + p.title);

      var he = document.createElement("div");
      he.className = "hp-card-he";
      he.dir = "rtl";
      he.textContent = firstWords(p.lines[0].he, 3);
      card.appendChild(he);

      var h3 = document.createElement("h3");
      h3.textContent = p.title;
      card.appendChild(h3);

      var sub = document.createElement("p");
      sub.className = "hp-card-sub";
      sub.textContent = p.subtitle;
      card.appendChild(sub);

      var pill = document.createElement("span");
      pill.className = "hp-status-pill " + meta.cls;
      pill.textContent = meta.label;
      card.appendChild(pill);

      card.addEventListener("click", function () {
        openPrayer(p);
      });
      cardGrid.appendChild(card);
    });

    renderEncourage(confidentCount);
  }

  function firstWords(text, n) {
    var parts = stripParens(text).split(/\s+/);
    return parts.slice(0, n).join(" ");
  }

  function renderEncourage(confidentCount) {
    var total = PRAYERS.length;
    var msg;
    if (confidentCount === 0) {
      msg = "🌟 Pick any prayer to start. Every reader starts somewhere!";
    } else if (confidentCount < total) {
      msg =
        "🎉 You're feeling confident on " +
        confidentCount +
        " of " +
        total +
        " prayers. Keep it going!";
    } else {
      msg = "🏆 Amazing — you marked all " + total + " prayers confident!";
    }
    encourage.textContent = msg;
  }

  // ---------- render: practice ----------
  function openPrayer(p) {
    stopSpeaking();
    state.current = p;
    state.stepIndex = 0;

    practiceTitle.textContent = p.title;
    practiceSub.textContent = p.subtitle;

    if (p.note) {
      practiceNote.textContent = "⚠️ " + p.note;
      practiceNote.hidden = false;
    } else {
      practiceNote.textContent =
        "⚠️ Double-check the Hebrew with a parent or teacher.";
      practiceNote.hidden = false;
    }

    // voice fallback warning
    voiceWarn.classList.toggle("is-shown", voiceChecked && !hebrewVoice);

    renderLines(p);
    showStep(false);

    picker.classList.add("is-hidden");
    practice.classList.add("is-active");
    practice.focus();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function renderLines(p) {
    linesEl.innerHTML = "";
    linesEl.setAttribute("data-mode", state.mode);

    p.lines.forEach(function (line, idx) {
      var row = document.createElement("div");
      row.className = "hp-line";
      row.tabIndex = 0;
      row.setAttribute("role", "button");
      row.setAttribute("aria-label", "Read line: " + stripParens(line.tr));
      row.dataset.idx = idx;

      var he = document.createElement("div");
      he.className = "hp-line-he";
      he.dir = "rtl";
      appendWords(he, line.he);
      row.appendChild(he);

      var tr = document.createElement("div");
      tr.className = "hp-line-tr";
      tr.textContent = line.tr;
      row.appendChild(tr);

      var en = document.createElement("div");
      en.className = "hp-line-en";
      en.textContent = line.en;
      row.appendChild(en);

      row.addEventListener("click", function (e) {
        if (e.target.classList.contains("hp-word")) return; // word handled separately
        playSingleLine(line, row);
      });
      row.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          playSingleLine(line, row);
        }
      });

      linesEl.appendChild(row);
    });
  }

  // split Hebrew into tappable words
  function appendWords(container, hebrew) {
    var words = hebrew.split(/\s+/);
    words.forEach(function (w, i) {
      if (!w) return;
      if (/^\([^)]*\)$/.test(w) || w.indexOf("(") === 0) {
        // parenthetical note — plain text, not tappable
        container.appendChild(document.createTextNode((i ? " " : "") + w));
        return;
      }
      var span = document.createElement("span");
      span.className = "hp-word";
      span.tabIndex = 0;
      span.setAttribute("role", "button");
      span.textContent = w;
      span.addEventListener("click", function (e) {
        e.stopPropagation();
        showWord(w);
      });
      span.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          e.stopPropagation();
          showWord(w);
        }
      });
      if (i) container.appendChild(document.createTextNode(" "));
      container.appendChild(span);
    });
  }

  function playSingleLine(line, row) {
    stopSpeaking();
    clearReadingHighlight();
    if (row) row.classList.add("is-reading");
    speakLine(line, function () {
      if (row) row.classList.remove("is-reading");
    });
  }

  function showWord(word) {
    popHe.textContent = word;
    wordPop.classList.add("is-open");
    // speak just the word
    if (synth) {
      synth.cancel();
      var u = new SpeechSynthesisUtterance(word);
      if (hebrewVoice) {
        u.voice = hebrewVoice;
        u.lang = "he-IL";
      } else {
        u.lang = "he-IL";
      }
      u.rate = Math.max(0.6, state.rate - 0.1);
      synth.speak(u);
    }
  }

  function closeWord() {
    wordPop.classList.remove("is-open");
    if (synth) synth.cancel();
  }

  // ---------- read whole prayer ----------
  function playAll() {
    if (state.speaking) {
      stopSpeaking();
      return;
    }
    var p = state.current;
    if (!p) return;
    state.speaking = true;
    playAllBtn.classList.add("is-playing");
    playAllBtn.textContent = "⏹ Stop";

    var rows = linesEl.querySelectorAll(".hp-line");
    var i = 0;
    function next() {
      if (!state.speaking || i >= p.lines.length) {
        stopSpeaking();
        return;
      }
      clearReadingHighlight();
      var row = rows[i];
      if (row) {
        row.classList.add("is-reading");
        row.scrollIntoView({ block: "center", behavior: "smooth" });
      }
      var line = p.lines[i];
      i++;
      speakLine(line, next);
    }
    next();
  }

  // ---------- step mode ----------
  function showStep(active) {
    stepEl.classList.toggle("is-active", active);
    linesWrap.classList.toggle("is-hidden", active);
    stepBtn.textContent = active
      ? "📜 See whole prayer"
      : "🎯 One line at a time";
    if (active) {
      state.stepIndex = 0;
      renderStep();
    } else {
      stopSpeaking();
    }
  }

  function renderStep() {
    stopSpeaking();
    var p = state.current;
    var total = p.lines.length;
    var idx = state.stepIndex;

    if (idx >= total) {
      stepProgressBar.style.width = "100%";
      stepProgressLabel.textContent = "All " + total + " lines — done!";
      stepBody.innerHTML = "";
      var done = document.createElement("div");
      done.className = "hp-step-done";
      done.innerHTML =
        "<h3>🎉 Nice work!</h3><p>You went through every line of " +
        escapeHtml(p.title) +
        ".</p>";
      var again = document.createElement("button");
      again.className = "hp-btn hp-btn-primary";
      again.type = "button";
      again.textContent = "↺ Start over";
      again.addEventListener("click", function () {
        state.stepIndex = 0;
        renderStep();
      });
      done.appendChild(again);
      stepBody.appendChild(done);
      return;
    }

    var pct = Math.round((idx / total) * 100);
    stepProgressBar.style.width = pct + "%";
    stepProgressLabel.textContent = "Line " + (idx + 1) + " of " + total;

    var line = p.lines[idx];
    stepBody.innerHTML = "";

    var card = document.createElement("div");
    card.className = "hp-step-card";
    card.setAttribute("data-mode", state.mode);

    var he = document.createElement("div");
    he.className = "hp-line-he";
    he.dir = "rtl";
    appendWords(he, line.he);
    card.appendChild(he);

    var tr = document.createElement("div");
    tr.className = "hp-line-tr";
    tr.textContent = line.tr;
    card.appendChild(tr);

    var en = document.createElement("div");
    en.className = "hp-line-en";
    en.textContent = line.en;
    card.appendChild(en);

    var actions = document.createElement("div");
    actions.className = "hp-step-actions";

    var hear = document.createElement("button");
    hear.className = "hp-btn";
    hear.type = "button";
    hear.textContent = "🔊 Hear it";
    hear.addEventListener("click", function () {
      stopSpeaking();
      speakLine(line);
    });

    var againBtn = document.createElement("button");
    againBtn.className = "hp-btn";
    againBtn.type = "button";
    againBtn.textContent = "🔁 Practice again";
    againBtn.addEventListener("click", function () {
      stopSpeaking();
      speakLine(line);
    });

    var got = document.createElement("button");
    got.className = "hp-btn hp-btn-primary";
    got.type = "button";
    got.textContent = "✅ Got it — next";
    got.addEventListener("click", function () {
      state.stepIndex++;
      renderStep();
      window.scrollTo({ top: 0, behavior: "smooth" });
    });

    actions.appendChild(hear);
    actions.appendChild(againBtn);
    actions.appendChild(got);
    card.appendChild(actions);

    stepBody.appendChild(card);
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }

  // ---------- mode / controls ----------
  function setMode(mode) {
    state.mode = mode;
    var btns = modeSeg.querySelectorAll("button");
    for (var i = 0; i < btns.length; i++) {
      btns[i].setAttribute(
        "aria-pressed",
        btns[i].dataset.mode === mode ? "true" : "false",
      );
    }
    linesEl.setAttribute("data-mode", mode);
    var stepCard = stepBody.querySelector(".hp-step-card");
    if (stepCard) stepCard.setAttribute("data-mode", mode);
  }

  function applyFontScale() {
    document.documentElement.style.setProperty(
      "--hp-font-scale",
      String(state.fontScale),
    );
  }

  function backToPicker() {
    stopSpeaking();
    practice.classList.remove("is-active");
    picker.classList.remove("is-hidden");
    renderPicker(); // refresh status pills
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // ---------- events ----------
  modeSeg.addEventListener("click", function (e) {
    var btn = e.target.closest("button[data-mode]");
    if (btn) setMode(btn.dataset.mode);
  });

  playAllBtn.addEventListener("click", playAll);
  stepBtn.addEventListener("click", function () {
    showStep(!stepEl.classList.contains("is-active"));
  });
  backBtn.addEventListener("click", backToPicker);

  rateInput.addEventListener("input", function () {
    state.rate = parseFloat(rateInput.value);
  });
  fontInput.addEventListener("input", function () {
    state.fontScale = parseFloat(fontInput.value);
    applyFontScale();
  });

  confidenceSet.addEventListener("click", function (e) {
    var btn = e.target.closest("button[data-status]");
    if (!btn || !state.current) return;
    setStatus(state.current.id, btn.dataset.status);
    // gentle confirmation
    var prev = btn.textContent;
    btn.textContent = "Saved! 💛";
    setTimeout(function () {
      btn.textContent = prev;
    }, 1100);
  });

  wordPop.addEventListener("click", closeWord);

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") {
      if (wordPop.classList.contains("is-open")) {
        closeWord();
      } else if (practice.classList.contains("is-active")) {
        backToPicker();
      }
    }
  });

  // stop audio if the tab is hidden
  document.addEventListener("visibilitychange", function () {
    if (document.hidden) stopSpeaking();
  });

  // ---------- init ----------
  applyFontScale();
  setMode("both");
  renderPicker();
})();
