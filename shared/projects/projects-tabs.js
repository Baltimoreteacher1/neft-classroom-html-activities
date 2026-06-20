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
    } catch (e) {
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

    var listTitle = document.createElement("h3");
    listTitle.className = "pk-research-links-title";
    listTitle.textContent = "Curated Research Links";
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
      } catch (e) {}
    }, delay || 0);
  }

  function playSuccessSound() {
    playSynthTone(261.63, "triangle", 0.35, 0); // C4
    playSynthTone(329.63, "triangle", 0.35, 80); // E4
    playSynthTone(392.00, "triangle", 0.35, 160); // G4
    playSynthTone(523.25, "sine", 0.7, 240); // C5
  }

  function playClickSound() {
    playSynthTone(580, "sine", 0.08, 0);
  }

  function fireConfetti() {
    var reduce = !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
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
        var anim = s.animate([
          { transform: "translate(-50%,-50%) scale(1) rotate(0deg)", opacity: 1 },
          { transform: "translate(calc(-50% + " + tx + "px), calc(-50% + " + ty + "px)) scale(0.2) rotate(" + (Math.random() * 360) + "deg)", opacity: 0 }
        ], {
          duration: 900 + Math.random() * 700,
          easing: "cubic-bezier(0.1, 0.8, 0.3, 1)"
        });
        anim.onfinish = (function (node) {
          return function () { if (node.parentNode) node.parentNode.removeChild(node); };
        })(s);
      } catch (e) {
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
        obs.observe(pctEl, { childList: true, characterData: true, subtree: true });
      }
    } catch (e) {}
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
    "origin": "The point (0, 0) where the x and y axes cross on a coordinate plane.",
    "proportional": "A relationship with a constant rate, starting at (0, 0).",
    "unit rate": "A rate comparing a value to exactly 1 unit of another value.",
    "ordered pair": "A pair of coordinates (x, y) giving a exact point on a grid.",
    "greatest common factor": "GCF: The largest number that divides evenly into two numbers.",
    "least common multiple": "LCM: The smallest multiple shared by two numbers.",
    "net": "A flat 2D pattern that folds to form a 3D solid shape.",
    "volume": "The amount of 3D space inside a solid shape, in cubic units.",
    "mean": "The average value, found by adding values and dividing by the count.",
    "median": "The middle value when data points are sorted from least to greatest.",
    "quadrant": "One of the 4 sections of the coordinate plane divided by axes."
  };

  function injectVocabTooltips() {
    var targets = document.querySelectorAll(".phase p, .phase li, .phase .task, .phase td");
    var keys = Object.keys(VOCAB_MAP);
    keys.sort(function (a, b) { return b.length - a.length; });
    targets.forEach(function (el) {
      if (el.querySelector("svg, input, textarea, a, button")) return;
      var html = el.innerHTML;
      var modified = false;
      for (var i = 0; i < keys.length; i++) {
        var key = keys[i];
        var regex = new RegExp("\\b(" + key.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&") + ")\\b", "gi");
        if (regex.test(html) && !html.includes('data-tooltip="' + VOCAB_MAP[key])) {
          html = html.replace(regex, function (match) {
            modified = true;
            return '<span class="pk-vocab-term" data-tooltip="' + escapeHtml(VOCAB_MAP[key]) + '">' + match + '</span>';
          });
        }
      }
      if (modified) el.innerHTML = html;
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
  });
})();
