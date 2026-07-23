/* ==========================================================================
   Neft Teacher — Projects tabs bootstrap (shared)
   Injects optional data-driven Research phase, then calls PK.initProjectTabs()
   from projects-kit.js. Reference AFTER projects-kit.js with projects-tabs.css.
   ========================================================================== */
(function () {
  "use strict";

  if (typeof document === "undefined") return;

  function ready(fn) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", fn, { once: true });
    } else {
      fn();
    }
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      }[c];
    });
  }

  function buildResearchPhase() {
    var dataEl = document.getElementById("pk-research");
    if (!dataEl) return null;
    var cfg;
    try {
      cfg = JSON.parse(dataEl.textContent || "{}");
    } catch (_e) {
      return null;
    }
    if (!cfg || !Array.isArray(cfg.links) || !cfg.links.length) return null;

    var icon = cfg.icon || "🔎";
    var title = cfg.title || "Research & Resources";
    var section = document.createElement("section");
    section.className = "phase pk-research-phase";

    var head = document.createElement("div");
    head.className = "phase-head";
    var badge = document.createElement("div");
    badge.className = "phase-num";
    badge.setAttribute("style", "background:var(--teal,#0e9a8c)");
    badge.textContent = icon;
    var headText = document.createElement("div");
    var skill = document.createElement("div");
    skill.className = "skill";
    skill.textContent = "Gather real information";
    var h2 = document.createElement("h2");
    h2.textContent = title;
    headText.appendChild(skill);
    headText.appendChild(h2);
    head.appendChild(badge);
    head.appendChild(headText);
    section.appendChild(head);

    if (cfg.intro) {
      var intro = document.createElement("p");
      intro.innerHTML = cfg.intro;
      section.appendChild(intro);
    }

    if (cfg.brief) {
      var brief = document.createElement("div");
      brief.className =
        "pk-mission-brief" + (cfg.brief.theme ? " pk-mission-" + cfg.brief.theme : "");
      if (cfg.brief.title) {
        var bt = document.createElement("h3");
        bt.textContent = cfg.brief.title;
        brief.appendChild(bt);
      }
      if (cfg.brief.hook) {
        var bh = document.createElement("p");
        bh.className = "pk-mission-hook";
        bh.innerHTML = cfg.brief.hook;
        brief.appendChild(bh);
      }
      if (Array.isArray(cfg.brief.steps) && cfg.brief.steps.length) {
        var ol = document.createElement("ol");
        ol.className = "pk-mission-steps";
        cfg.brief.steps.forEach(function (s) {
          var li = document.createElement("li");
          li.textContent = s;
          ol.appendChild(li);
        });
        brief.appendChild(ol);
      }
      section.appendChild(brief);
    }

    // Curated research links — shown WITH the questions (top of the phase),
    // not buried at the bottom, so students open their sources before recording.
    var listTitle = document.createElement("h3");
    listTitle.className = "pk-research-links-title";
    listTitle.textContent = "Curated Research Links — open these to find your data";
    section.appendChild(listTitle);
    var list = document.createElement("div");
    list.className = "pk-research-list";
    cfg.links.forEach(function (lnk) {
      if (!lnk || !lnk.url) return;
      var a = document.createElement("a");
      a.className = "pk-research-card";
      a.href = lnk.url;
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      var top = document.createElement("div");
      top.className = "pk-rc-top";
      var ic = document.createElement("span");
      ic.className = "pk-rc-icon";
      ic.textContent = lnk.icon || "🔗";
      var tt = document.createElement("span");
      tt.className = "pk-rc-title";
      tt.textContent = lnk.name || lnk.url;
      var ext = document.createElement("span");
      ext.className = "pk-rc-ext";
      ext.textContent = "opens in new tab ↗";
      top.appendChild(ic);
      top.appendChild(tt);
      top.appendChild(ext);
      a.appendChild(top);
      if (lnk.find) {
        var find = document.createElement("p");
        find.className = "pk-rc-find";
        find.textContent = lnk.find;
        a.appendChild(find);
      }
      if (lnk.look) {
        var look = document.createElement("p");
        look.className = "pk-rc-look";
        look.innerHTML = "<b>Look for:</b> " + escapeHtml(lnk.look);
        a.appendChild(look);
      }
      list.appendChild(a);
    });
    section.appendChild(list);

    if (cfg.fieldNotes && Array.isArray(cfg.fieldNotes.fields) && cfg.fieldNotes.fields.length) {
      var fnWrap = document.createElement("div");
      fnWrap.className = "pk-field-notes";
      var fnTitle = document.createElement("h3");
      fnTitle.textContent = cfg.fieldNotes.title || "Field Notes — Record What You Find";
      fnWrap.appendChild(fnTitle);
      if (cfg.fieldNotes.intro) {
        var fnIntro = document.createElement("p");
        fnIntro.className = "pk-fn-intro";
        fnIntro.innerHTML = cfg.fieldNotes.intro;
        fnWrap.appendChild(fnIntro);
      }
      cfg.fieldNotes.fields.forEach(function (f, idx) {
        if (!f) return;
        var row = document.createElement("div");
        row.className = "pk-fn-row";
        var meta = document.createElement("div");
        meta.className = "pk-fn-meta";
        var lbl = document.createElement("label");
        lbl.className = "fld";
        var fid = f.id || "fn-" + idx;
        lbl.setAttribute("for", fid);
        lbl.innerHTML =
          '<span class="pk-fn-num">' + (idx + 1) + "</span> " + escapeHtml(f.label || "Data point");
        meta.appendChild(lbl);
        if (f.source) {
          var src = document.createElement("span");
          src.className = "pk-fn-source";
          src.textContent = "Source: " + f.source;
          meta.appendChild(src);
        }
        row.appendChild(meta);
        var inp = document.createElement("input");
        inp.type = "text";
        inp.id = fid;
        inp.setAttribute("data-save", "");
        inp.className = "pk-fn-input";
        if (f.placeholder) inp.placeholder = f.placeholder;
        row.appendChild(inp);
        if (f.hint) {
          var hint = document.createElement("p");
          hint.className = "pk-fn-hint";
          hint.textContent = f.hint;
          row.appendChild(hint);
        }
        fnWrap.appendChild(row);
      });
      section.appendChild(fnWrap);
    }

    if (Array.isArray(cfg.mathTasks) && cfg.mathTasks.length) {
      var mtWrap = document.createElement("div");
      mtWrap.className = "pk-math-tasks";
      var mtTitle = document.createElement("h3");
      mtTitle.textContent = "Apply Your Research — Required Math";
      mtWrap.appendChild(mtTitle);
      var mtIntro = document.createElement("p");
      mtIntro.className = "pk-mt-intro";
      mtIntro.textContent =
        "These problems require numbers from your Field Notes above. You cannot skip the research — your answers must use real data you found.";
      mtWrap.appendChild(mtIntro);
      cfg.mathTasks.forEach(function (t, idx) {
        if (!t) return;
        var card = document.createElement("div");
        card.className = "pk-mt-card";
        var th = document.createElement("h4");
        th.textContent = t.title || "Research Problem " + (idx + 1);
        card.appendChild(th);
        if (t.prompt) {
          var tp = document.createElement("p");
          tp.className = "pk-mt-prompt";
          tp.innerHTML = t.prompt;
          card.appendChild(tp);
        }
        var workId = t.workId || "mt-work-" + idx;
        var ta = document.createElement("textarea");
        ta.id = workId;
        ta.setAttribute("data-save", "");
        ta.rows = 3;
        ta.placeholder = "Show your work. Cite the Field Note # you used and write the math.";
        card.appendChild(ta);
        if (t.level2) {
          var l2 = document.createElement("div");
          l2.className = "pk-lvl2 pk-mt-l2";
          var l2p = document.createElement("p");
          l2p.innerHTML = "<b>Level 2 extension:</b> " + t.level2;
          l2.appendChild(l2p);
          var l2ta = document.createElement("textarea");
          l2ta.id = workId + "-l2";
          l2ta.setAttribute("data-save", "");
          l2ta.rows = 2;
          l2ta.placeholder = "Level 2 answer with justification…";
          l2.appendChild(l2ta);
          card.appendChild(l2);
        }
        mtWrap.appendChild(card);
      });
      section.appendChild(mtWrap);
    }

    if (Array.isArray(cfg.investigationChecklist) && cfg.investigationChecklist.length) {
      var ckWrap = document.createElement("div");
      ckWrap.className = "pk-inv-checklist";
      var ckTitle = document.createElement("h3");
      ckTitle.textContent = "Investigation Checklist";
      ckWrap.appendChild(ckTitle);
      var ul = document.createElement("ul");
      ul.className = "checklist pk-inv-list";
      cfg.investigationChecklist.forEach(function (item, idx) {
        var li = document.createElement("li");
        var cb = document.createElement("input");
        cb.type = "checkbox";
        cb.id = "inv-ck-" + idx;
        cb.setAttribute("data-save", "");
        var lab = document.createElement("label");
        lab.setAttribute("for", "inv-ck-" + idx);
        lab.textContent = item;
        li.appendChild(cb);
        li.appendChild(lab);
        ul.appendChild(li);
      });
      ckWrap.appendChild(ul);
      section.appendChild(ckWrap);
    }

    var safe = document.createElement("p");
    safe.className = "pk-research-safe";
    safe.textContent =
      cfg.note ||
      "These sites were picked for class. They open in a new tab so you keep your project. If a page asks you to sign in or buy something, just close it and come back.";
    section.appendChild(safe);

    return section;
  }

  function injectResearchPhase() {
    if (document.querySelector(".pk-research-phase")) return;
    var wrap =
      document.querySelector(".pk .wrap, body.pk .wrap") || document.querySelector(".wrap");
    if (!wrap) return;

    var research = buildResearchPhase();
    if (!research) return;

    var phases =
      window.PK && typeof window.PK.collectWrapPhases === "function"
        ? window.PK.collectWrapPhases(wrap)
        : Array.prototype.slice.call(wrap.querySelectorAll(":scope > section.phase"));
    if (!phases.length) return;

    var vocabPhase = phases[0];
    var hasVocab = /visual math notes|vocabulary|before you start/i.test(
      vocabPhase ? vocabPhase.textContent.slice(0, 200) : "",
    );
    if (hasVocab && vocabPhase.nextSibling) {
      wrap.insertBefore(research, vocabPhase.nextSibling);
      return;
    }

    var last = phases[phases.length - 1];
    var isRubric = /rubric|how you are scored|scored/i.test(last.textContent.slice(0, 120));
    if (isRubric) {
      wrap.insertBefore(research, last);
    } else {
      wrap.appendChild(research);
    }
  }

  /* ---- Audio FX Engine ---- */
  var audioCtx = null;
  var soundEnabled = localStorage.getItem("pk-sound-enabled") !== "false";

  function getAudioContext() {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === "suspended") {
      audioCtx.resume();
    }
    return audioCtx;
  }

  function playSynthTone(freq, type, duration, delay) {
    if (!soundEnabled) return;
    setTimeout(function () {
      try {
        var ctx = getAudioContext();
        var osc = ctx.createOscillator();
        var gain = ctx.createGain();
        osc.type = type || "sine";
        osc.frequency.setValueAtTime(freq, ctx.currentTime);
        gain.gain.setValueAtTime(0.06, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + duration);
      } catch (_e) {}
    }, delay || 0);
  }

  function playSuccessSound() {
    playSynthTone(261.63, "triangle", 0.35, 0); // C4
    playSynthTone(329.63, "triangle", 0.35, 80); // E4
    playSynthTone(392.0, "triangle", 0.35, 160); // G4
    playSynthTone(523.25, "sine", 0.7, 240); // C5
  }

  function playClickSound() {
    playSynthTone(580, "sine", 0.08, 0);
  }

  function fireConfetti() {
    var reduce = !!(
      window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches
    );
    if (reduce) return;
    var colors = ["#ff595e", "#ffca3a", "#8ac926", "#1982c4", "#ff6b6b", "#4ecdc4", "#9b5de5"];
    var count = 50;
    var w = window.innerWidth;
    var h = window.innerHeight;
    var startX = w / 2;
    var startY = h / 2;

    var el = document.getElementById("pct") || document.getElementById("pfill");
    if (el) {
      var r = el.getBoundingClientRect();
      if (r.width || r.height) {
        startX = r.left + r.width / 2;
        startY = r.top + r.height / 2;
      }
    }

    for (var i = 0; i < count; i++) {
      var s = document.createElement("div");
      s.className = "pk-confetti-spark";
      s.style.background = colors[Math.floor(Math.random() * colors.length)];
      s.style.left = startX + "px";
      s.style.top = startY + "px";
      if (Math.random() > 0.5) s.style.borderRadius = "0px";
      var size = 6 + Math.random() * 8;
      s.style.width = size + "px";
      s.style.height = size + "px";
      document.body.appendChild(s);

      var angle = Math.random() * Math.PI * 2;
      var dist = 60 + Math.random() * 180;
      var tx = Math.cos(angle) * dist;
      var ty = Math.sin(angle) * dist - (30 + Math.random() * 120);

      try {
        var anim = s.animate(
          [
            {
              transform: "translate(-50%,-50%) scale(1) rotate(0deg)",
              opacity: 1,
            },
            {
              transform:
                "translate(calc(-50% + " +
                tx +
                "px), calc(-50% + " +
                ty +
                "px)) scale(0.2) rotate(" +
                Math.random() * 360 +
                "deg)",
              opacity: 0,
            },
          ],
          {
            duration: 900 + Math.random() * 700,
            easing: "cubic-bezier(0.1, 0.8, 0.3, 1)",
          },
        );
        anim.onfinish = (function (node) {
          return function () {
            if (node.parentNode) node.parentNode.removeChild(node);
          };
        })(s);
      } catch (_e) {
        if (s.parentNode) s.parentNode.removeChild(s);
      }
    }
  }

  var progressFired = false;
  function watchProgress() {
    var pctEl = document.getElementById("pct");
    if (!pctEl) return;
    if (pctEl.textContent === "100") progressFired = true;
    try {
      if (window.MutationObserver) {
        var obs = new MutationObserver(function () {
          var val = pctEl.textContent.trim();
          if (val === "100" && !progressFired) {
            progressFired = true;
            playSuccessSound();
            fireConfetti();
          } else if (val !== "100") {
            progressFired = false;
          }
        });
        obs.observe(pctEl, {
          childList: true,
          characterData: true,
          subtree: true,
        });
      }
    } catch (_e) {}
  }

  function injectSoundToggle() {
    var parent = document.querySelector(".pk-tabbar-top") || document.querySelector(".pk-step-bar");
    if (!parent || document.getElementById("pk-sound-btn")) return;
    var btn = document.createElement("button");
    btn.type = "button";
    btn.id = "pk-sound-btn";
    btn.className = "pk-sound-toggle";
    btn.title = "Toggle Sound Effects";

    function update() {
      btn.innerHTML = soundEnabled ? "🔊 Sound: On" : "🔇 Sound: Off";
    }
    btn.addEventListener("click", function () {
      soundEnabled = !soundEnabled;
      localStorage.setItem("pk-sound-enabled", soundEnabled);
      update();
      if (soundEnabled) {
        getAudioContext();
        playSynthTone(523.25, "sine", 0.08, 0);
      }
    });
    update();
    parent.appendChild(btn);
  }

  function wireInteractiveSounds() {
    document.addEventListener("change", function (e) {
      if (e.target && (e.target.type === "checkbox" || e.target.type === "radio")) {
        playClickSound();
      }
    });
    document.addEventListener("click", function (e) {
      if (e.target && e.target.classList.contains("pk-tab")) {
        playClickSound();
      }
    });
  }

  var VOCAB_MAP = {
    "dependent variable": "The output variable (y) that changes in response to the input.",
    "independent variable": "The input variable (x) that you control or choose.",
    origin: "The point (0, 0) where the x and y axes cross on a coordinate plane.",
    proportional: "A relationship with a constant rate, starting at (0, 0).",
    "unit rate": "A rate comparing a value to exactly 1 unit of another value.",
    "ordered pair": "A pair of coordinates (x, y) giving a exact point on a grid.",
    "greatest common factor": "GCF: The largest number that divides evenly into two numbers.",
    "least common multiple": "LCM: The smallest multiple shared by two numbers.",
    net: "A flat 2D pattern that folds to form a 3D solid shape.",
    volume: "The amount of 3D space inside a solid shape, in cubic units.",
    mean: "The average value, found by adding values and dividing by the count.",
    median: "The middle value when data points are sorted from least to greatest.",
    quadrant: "One of the 4 sections of the coordinate plane divided by axes.",
  };

  function injectVocabTooltips() {
    var targets = document.querySelectorAll(".phase p, .phase li, .phase .task, .phase td");
    var keys = Object.keys(VOCAB_MAP);
    keys.sort(function (a, b) {
      return b.length - a.length;
    });
    targets.forEach(function (el) {
      if (el.querySelector("svg, input, textarea, a, button")) return;
      // Skip the student-friendly Formula Bank: its class names (e.g.
      // "pk-f-mean") contain vocab words like "mean", and this string-based
      // innerHTML replace would wrap them INSIDE the tag and corrupt markup.
      // Formula rows are already self-explanatory and need no auto-tooltips.
      if (el.closest(".pk-formula")) return;
      var html = el.innerHTML;
      var modified = false;
      for (var i = 0; i < keys.length; i++) {
        var key = keys[i];
        var regex = new RegExp(
          "\\b(" + key.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&") + ")\\b",
          "gi",
        );
        if (regex.test(html) && !html.includes('data-tooltip="' + VOCAB_MAP[key])) {
          html = html.replace(regex, function (match) {
            modified = true;
            return (
              '<span class="pk-vocab-term" data-tooltip="' +
              escapeHtml(VOCAB_MAP[key]) +
              '">' +
              match +
              "</span>"
            );
          });
        }
      }
      if (modified) el.innerHTML = html;
    });
  }

  /* ---- Saved to Device Pulsing Indicator ---- */
  var saveDebounceTimer = null;
  function injectSaveIndicator() {
    var parent = document.querySelector(".pk-tabbar-top");
    if (!parent || document.getElementById("pk-save-indicator")) return;

    var ind = document.createElement("span");
    ind.id = "pk-save-indicator";
    ind.className = "pk-save-indicator";
    ind.innerHTML =
      '<span class="pk-save-icon">☁️</span> <span class="pk-save-text">Saved to Device</span>';

    parent.appendChild(ind);

    function triggerSaving() {
      ind.classList.add("saving");
      ind.querySelector(".pk-save-text").textContent = "Saving progress...";

      clearTimeout(saveDebounceTimer);
      saveDebounceTimer = setTimeout(function () {
        ind.classList.remove("saving");
        ind.querySelector(".pk-save-text").textContent = "Saved to Device";
      }, 800);
    }

    document.addEventListener("input", function (e) {
      if (e.target && (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA")) {
        triggerSaving();
      }
    });
    document.addEventListener("change", function (e) {
      if (
        e.target &&
        (e.target.tagName === "INPUT" ||
          e.target.tagName === "TEXTAREA" ||
          e.target.type === "checkbox")
      ) {
        triggerSaving();
      }
    });
  }

  /* ---- Multi-Theme / Skin Selector ---- */
  function injectThemeSelector() {
    var parent = document.querySelector(".pk-tabbar-top");
    if (!parent || document.getElementById("pk-theme-selector")) return;

    var div = document.createElement("div");
    div.id = "pk-theme-selector";
    div.className = "pk-theme-selector";
    div.innerHTML =
      '<label for="pk-theme-select">🎨 Skin:</label>' +
      '<select id="pk-theme-select">' +
      '  <option value="theme-default">Classic Blue</option>' +
      '  <option value="theme-cyber">Cyberpunk Neon</option>' +
      '  <option value="theme-notebook">Notebook Lined</option>' +
      "</select>";

    parent.appendChild(div);

    var select = document.getElementById("pk-theme-select");
    var activeTheme = localStorage.getItem("pk-active-theme") || "theme-default";
    select.value = activeTheme;

    function applyTheme(theme) {
      document.body.classList.remove("theme-cyber", "theme-notebook");
      if (theme !== "theme-default") {
        document.body.classList.add(theme);
      }
    }
    applyTheme(activeTheme);

    select.addEventListener("change", function () {
      var selected = select.value;
      localStorage.setItem("pk-active-theme", selected);
      applyTheme(selected);
      playClickSound();
    });
  }

  /* ---- Floating Scratchpad whiteboard panel ---- */
  function injectScratchpad() {
    if (document.getElementById("pk-scratch-btn")) return;

    // Inject floating button
    var btn = document.createElement("button");
    btn.type = "button";
    btn.id = "pk-scratch-btn";
    btn.className = "pk-scratch-btn pk-no-print";
    btn.innerHTML = "✏️ Scratchpad";
    document.body.appendChild(btn);

    // Inject panel
    var panel = document.createElement("div");
    panel.id = "pk-scratch-panel";
    panel.className = "pk-scratch-panel pk-no-print";
    panel.innerHTML =
      '<div class="pk-scratch-header">' +
      "  <span>✏️ Floating Scratchpad</span>" +
      '  <button type="button" class="pk-scratch-close" id="pk-scratch-close">×</button>' +
      "</div>" +
      '<div class="pk-scratch-canvas-wrap">' +
      '  <canvas id="pk-scratch-canvas"></canvas>' +
      "</div>" +
      '<div class="pk-scratch-toolbar">' +
      '  <button type="button" class="pk-scratch-tool color-black active" data-action="draw-black"></button>' +
      '  <button type="button" class="pk-scratch-tool color-red" data-action="draw-red"></button>' +
      '  <button type="button" class="pk-scratch-tool color-blue" data-action="draw-blue"></button>' +
      '  <button type="button" class="pk-scratch-tool" data-action="eraser" title="Eraser">🧽</button>' +
      '  <button type="button" class="pk-scratch-tool" style="margin-left: auto;" data-action="clear" title="Clear Canvas">🗑️ Clear</button>' +
      "</div>";
    document.body.appendChild(panel);

    btn.addEventListener("click", function () {
      panel.classList.toggle("open");
      playClickSound();
    });

    document.getElementById("pk-scratch-close").addEventListener("click", function () {
      panel.classList.remove("open");
      playClickSound();
    });

    initScratchpadCanvas(document.getElementById("pk-scratch-canvas"), panel);
  }

  function initScratchpadCanvas(canvas, panel) {
    var ctx = canvas.getContext("2d");
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.strokeStyle = "#000000";
    var drawing = false;
    var lastX = 0;
    var lastY = 0;

    function resize() {
      var rect = canvas.parentNode.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
      ctx.lineWidth = 3;
      ctx.lineCap = "round";
      ctx.strokeStyle = "#000000";
    }
    setTimeout(resize, 400);
    window.addEventListener("resize", resize);

    function getPos(e) {
      var rect = canvas.getBoundingClientRect();
      var cx = e.clientX || (e.touches && e.touches[0].clientX);
      var cy = e.clientY || (e.touches && e.touches[0].clientY);
      return { x: cx - rect.left, y: cy - rect.top };
    }

    function start(e) {
      drawing = true;
      var pos = getPos(e);
      lastX = pos.x;
      lastY = pos.y;
    }

    function draw(e) {
      if (!drawing) return;
      var pos = getPos(e);
      ctx.beginPath();
      ctx.moveTo(lastX, lastY);
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
      lastX = pos.x;
      lastY = pos.y;
    }

    function stop() {
      drawing = false;
    }

    canvas.addEventListener("mousedown", start);
    canvas.addEventListener("mousemove", draw);
    canvas.addEventListener("mouseup", stop);
    canvas.addEventListener("mouseleave", stop);
    canvas.addEventListener("touchstart", function (e) {
      start(e);
      e.preventDefault();
    });
    canvas.addEventListener("touchmove", function (e) {
      draw(e);
      e.preventDefault();
    });
    canvas.addEventListener("touchend", function (e) {
      stop(e);
      e.preventDefault();
    });

    var tools = panel.querySelectorAll(".pk-scratch-tool");
    tools.forEach(function (tool) {
      tool.addEventListener("click", function () {
        var act = tool.getAttribute("data-action");
        if (act === "clear") {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          playClickSound();
        } else {
          tools.forEach(function (t) {
            if (t.getAttribute("data-action") !== "clear") t.classList.remove("active");
          });
          tool.classList.add("active");
          playClickSound();
          if (act === "eraser") {
            ctx.strokeStyle = "#f8fafc";
            ctx.lineWidth = 16;
          } else if (act === "draw-black") {
            ctx.strokeStyle = "#000000";
            ctx.lineWidth = 3;
          } else if (act === "draw-red") {
            ctx.strokeStyle = "#ef4444";
            ctx.lineWidth = 3;
          } else if (act === "draw-blue") {
            ctx.strokeStyle = "#3b82f6";
            ctx.lineWidth = 3;
          }
        }
      });
    });
  }

  /* ---- Digital Signature Canvas & printable Certificate lock ---- */
  function generateMockQrCode() {
    var size = 15;
    var svg =
      '<svg class="pk-cert-qr-svg" viewBox="0 0 15 15" width="50" height="50" shape-rendering="crispEdges">';
    function drawAnchor(x, y) {
      svg += '<rect x="' + x + '" y="' + y + '" width="5" height="5" fill="black"/>';
      svg += '<rect x="' + (x + 1) + '" y="' + (y + 1) + '" width="3" height="3" fill="white"/>';
      svg += '<rect x="' + (x + 2) + '" y="' + (y + 2) + '" width="1" height="1" fill="black"/>';
    }
    drawAnchor(0, 0);
    drawAnchor(10, 0);
    drawAnchor(0, 10);
    for (var r = 0; r < size; r++) {
      for (var c = 0; c < size; c++) {
        var isAnchor = (r < 5 && c < 5) || (r < 5 && c >= 10) || (r >= 10 && c < 5);
        if (!isAnchor) {
          if (Math.random() > 0.55) {
            svg += '<rect x="' + c + '" y="' + r + '" width="1" height="1" fill="black"/>';
          }
        }
      }
    }
    svg += "</svg>";
    return svg;
  }

  function injectSignatureAndCertificate() {
    var panels = document.querySelectorAll(".pk-tab-panel");
    if (!panels.length) return;

    var lastPanel = panels[panels.length - 1];
    if (!lastPanel || lastPanel.querySelector(".pk-signature-card")) return;

    var projKey = location.pathname;

    var sigCard = document.createElement("div");
    sigCard.className = "pk-signature-card pk-no-print";
    sigCard.innerHTML =
      "<h3>✍️ Certify & Sign Project</h3>" +
      "<p>Drawing your signature below locks all calculations and issues your official project certificate.</p>" +
      '<div class="pk-signature-area">' +
      '  <canvas id="pk-sig-canvas" width="400" height="120"></canvas>' +
      '  <button type="button" id="pk-sig-clear">Clear</button>' +
      "</div>" +
      '<button type="button" class="btn" id="pk-sig-lock">Certify & Lock Project</button>';

    var certCard = document.createElement("div");
    certCard.id = "pk-cert-card";
    certCard.className = "pk-certificate-card";
    certCard.style.display = "none";
    certCard.innerHTML =
      '<div class="pk-cert-border">' +
      "  <h2>📜 CERTIFICATE OF MATHEMATICAL DESIGN</h2>" +
      '  <p class="pk-cert-award">This certifies that:</p>' +
      '  <h3 class="pk-cert-name" id="pk-cert-student-name">Grade 6 Architect</h3>' +
      '  <p class="pk-cert-body">Has successfully designed, audited, and mathematically verified all proportional parameters for this Grade 6 culminating project:</p>' +
      '  <h4 class="pk-cert-project" id="pk-cert-title">Project Design Ratios & Relationships</h4>' +
      '  <div class="pk-cert-footer">' +
      '    <div class="pk-cert-sig-img-wrap">' +
      '      <img id="pk-cert-sig-img" src="" alt="Signature"/>' +
      '      <div class="pk-cert-line">Student Architect</div>' +
      "    </div>" +
      '    <div class="pk-cert-qr-wrap">' +
      '      <div id="pk-cert-qr"></div>' +
      '      <div class="pk-cert-line" style="border:none; margin-top:2px;">CODE: <span id="pk-cert-code"></span></div>' +
      "    </div>" +
      "  </div>" +
      "</div>" +
      '<div style="margin-top: 15px;" class="pk-no-print">' +
      '  <button type="button" class="btn" onclick="window.print()">Print / Save PDF</button>' +
      '  <button type="button" class="btn alt" id="pk-sig-unlock" style="margin-left: 10px;">🔓 Unlock &amp; Edit</button>' +
      "</div>";

    lastPanel.appendChild(sigCard);
    lastPanel.appendChild(certCard);

    var canvas = document.getElementById("pk-sig-canvas");
    var clearBtn = document.getElementById("pk-sig-clear");
    var lockBtn = document.getElementById("pk-sig-lock");
    var unlockBtn = document.getElementById("pk-sig-unlock");
    var nameEl = document.getElementById("pk-cert-student-name");

    initSignatureCanvas(canvas, clearBtn);

    function setControlsLock(locked) {
      var inputs = document.querySelectorAll("input, textarea, select");
      inputs.forEach(function (inp) {
        if (inp.id !== "pk-theme-select" && inp.id !== "pk-sig-unlock") {
          inp.disabled = locked;
        }
      });
    }

    function lockProject() {
      // get student name
      var studentName = "Grade 6 Student";
      var sName = document.querySelector(
        "input[id*='studentName'], input[id*='partnerName'], input[id*='partner']",
      );
      if (sName && sName.value.trim()) {
        studentName = sName.value.trim();
      } else if (window.NeftIdentity && typeof window.NeftIdentity.getName === "function") {
        studentName = window.NeftIdentity.getName() || studentName;
      }

      // project title
      var pTitle = document.querySelector("h1, h2");
      var titleText = pTitle
        ? pTitle.textContent.replace(/✍️|📝|📐|🎨/g, "").trim()
        : "Grade 6 Project";

      var dataUrl = canvas.toDataURL();
      localStorage.setItem("pk-certified-" + projKey, "true");
      localStorage.setItem("pk-sig-data-" + projKey, dataUrl);

      nameEl.textContent = studentName;
      document.getElementById("pk-cert-title").textContent = titleText;
      document.getElementById("pk-cert-sig-img").src = dataUrl;
      document.getElementById("pk-cert-qr").innerHTML = generateMockQrCode();

      var randomCode = "MATH-" + Math.floor(100000 + Math.random() * 900000);
      document.getElementById("pk-cert-code").textContent = randomCode;

      sigCard.style.display = "none";
      certCard.style.display = "block";
      setControlsLock(true);
      playSuccessSound();
      fireConfetti();
    }

    function unlockProject() {
      localStorage.removeItem("pk-certified-" + projKey);
      localStorage.removeItem("pk-sig-data-" + projKey);
      sigCard.style.display = "block";
      certCard.style.display = "none";
      setControlsLock(false);

      // clear signature canvas
      var ctx = canvas.getContext("2d");
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      playClickSound();
    }

    lockBtn.addEventListener("click", lockProject);
    unlockBtn.addEventListener("click", unlockProject);

    // Check initial certified state
    if (localStorage.getItem("pk-certified-" + projKey) === "true") {
      var savedSig = localStorage.getItem("pk-sig-data-" + projKey);
      if (savedSig) {
        var img = new Image();
        img.onload = function () {
          canvas.getContext("2d").drawImage(img, 0, 0);
          lockProject();
        };
        img.src = savedSig;
      }
    }
  }

  function initSignatureCanvas(canvas, clearBtn) {
    var ctx = canvas.getContext("2d");
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.strokeStyle = "#0f2b3c";
    var drawing = false;
    var lastX = 0;
    var lastY = 0;

    function getPos(e) {
      var rect = canvas.getBoundingClientRect();
      var cx = e.clientX || (e.touches && e.touches[0].clientX);
      var cy = e.clientY || (e.touches && e.touches[0].clientY);
      return {
        x: (cx - rect.left) * (canvas.width / rect.width),
        y: (cy - rect.top) * (canvas.height / rect.height),
      };
    }

    function start(e) {
      drawing = true;
      var pos = getPos(e);
      lastX = pos.x;
      lastY = pos.y;
    }

    function draw(e) {
      if (!drawing) return;
      var pos = getPos(e);
      ctx.beginPath();
      ctx.moveTo(lastX, lastY);
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
      lastX = pos.x;
      lastY = pos.y;
    }
    function stop() {
      drawing = false;
    }

    canvas.addEventListener("mousedown", start);
    canvas.addEventListener("mousemove", draw);
    canvas.addEventListener("mouseup", stop);
    canvas.addEventListener("mouseleave", stop);
    canvas.addEventListener("touchstart", function (e) {
      start(e);
      e.preventDefault();
    });
    canvas.addEventListener("touchmove", function (e) {
      draw(e);
      e.preventDefault();
    });
    canvas.addEventListener("touchend", function (e) {
      stop(e);
      e.preventDefault();
    });
    clearBtn.addEventListener("click", function () {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      playClickSound();
    });
  }

  ready(function () {
    if (document.body.hasAttribute("data-pk-no-tabs")) return;
    injectResearchPhase();
    if (window.PK && typeof window.PK.initProjectTabs === "function") {
      window.PK.initProjectTabs();
    }
    // Wire shared Read-Aloud (TTS). Pages call PK.initLevel themselves, so the
    // injected Level-0 button is already wired; TTS has no per-page init, so do
    // it here. Persist the preference per page path.
    if (window.PK && typeof window.PK.initTts === "function") {
      window.PK.initTts({
        storageKey: "pk-tts:" + (location.pathname || "project"),
      });
    }
    watchProgress();
    injectSoundToggle();
    wireInteractiveSounds();
    setTimeout(injectVocabTooltips, 200);
    injectSaveIndicator();
    injectThemeSelector();
    injectScratchpad();
    setTimeout(injectSignatureAndCertificate, 300);
  });
})();
