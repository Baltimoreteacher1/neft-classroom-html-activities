/* Goal Adventure: Health & Wellness — What Are Your Goals?
   Grade 3 choose-your-own-adventure. Vanilla JS, self-contained.
   Theme: Responsible Decision Making (Studies Weekly Grade 3, Week 26).

   EXPANDED: each map stop is now a MINI-SET of 3-5 parts (a short reading +
   several activities, with lots of creating/art). Each stop still earns ONE
   star, awarded only after every part inside it is finished. Architecture
   (hub map, progress/stars in localStorage, bilingual + read-aloud,
   celebration) is preserved and extended. */
(function () {
  "use strict";

  /* ---------------- Read-aloud (guarded) ---------------- */
  var synth = "speechSynthesis" in window ? window.speechSynthesis : null;
  function speak(text, lang) {
    if (!synth || !text) return;
    try {
      synth.cancel();
      var u = new SpeechSynthesisUtterance(text);
      u.lang = lang || "en-US";
      u.rate = 0.92;
      u.pitch = 1.05;
      var voices = synth.getVoices() || [];
      var match = voices.find(function (v) {
        return v.lang && v.lang.toLowerCase().indexOf(lang.slice(0, 2)) === 0;
      });
      if (match) u.voice = match;
      synth.speak(u);
    } catch (e) {
      /* no-op */
    }
  }
  if (synth && typeof synth.getVoices === "function") {
    synth.getVoices();
    if (typeof synth.addEventListener === "function") {
      synth.addEventListener("voiceschanged", function () {
        synth.getVoices();
      });
    }
  }

  /* A 🔊 button that says EN then (on second tap) ES. */
  function sayBtn(en, es) {
    var b = document.createElement("button");
    b.className = "say";
    b.type = "button";
    b.textContent = "🔊";
    b.setAttribute("aria-label", "Read aloud / Leer en voz alta");
    b.title = "Read aloud · Leer en voz alta";
    var toggle = 0;
    b.addEventListener("click", function () {
      if (!es) {
        speak(en, "en-US");
        return;
      }
      if (toggle % 2 === 0) speak(en, "en-US");
      else speak(es, "es-ES");
      toggle++;
    });
    return b;
  }

  function wireStaticSay(root) {
    (root || document)
      .querySelectorAll(".say[data-say-en]")
      .forEach(function (b) {
        if (b.__wired) return;
        b.__wired = true;
        var t = 0;
        b.addEventListener("click", function () {
          var en = b.getAttribute("data-say-en");
          var es = b.getAttribute("data-say-es");
          if (!es) {
            speak(en, "en-US");
            return;
          }
          if (t % 2 === 0) speak(en, "en-US");
          else speak(es, "es-ES");
          t++;
        });
      });
  }

  /* ---------------- DOM helpers ---------------- */
  function el(tag, opts) {
    var n = document.createElement(tag);
    opts = opts || {};
    if (opts.cls) n.className = opts.cls;
    if (opts.html != null) n.innerHTML = opts.html;
    if (opts.text != null) n.textContent = opts.text;
    if (opts.attrs)
      Object.keys(opts.attrs).forEach(function (k) {
        n.setAttribute(k, opts.attrs[k]);
      });
    return n;
  }

  /* Bilingual instruction block with read-aloud. */
  function bilingual(en, es) {
    var box = el("div", { cls: "bilingual" });
    var rowEn = el("div", { cls: "en" });
    rowEn.appendChild(el("span", { cls: "flag", text: "🇺🇸" }));
    rowEn.appendChild(el("p", { text: en }));
    rowEn.appendChild(sayBtn(en, null));
    var rowEs = el("div", { cls: "es" });
    rowEs.appendChild(el("span", { cls: "flag", text: "🇪🇸" }));
    rowEs.appendChild(el("p", { text: es }));
    var esBtn = sayBtn(es, null);
    esBtn.title = "Leer en español";
    rowEs.appendChild(esBtn);
    box.appendChild(rowEn);
    box.appendChild(rowEs);
    return box;
  }

  /* ---------------- Progress state ---------------- */
  var STORAGE = "neft_health_goals_adventure_v1";
  var state = load();
  function load() {
    try {
      var raw = localStorage.getItem(STORAGE);
      if (raw) {
        var s = JSON.parse(raw);
        if (!s.parts) s.parts = {};
        return s;
      }
    } catch (e) {}
    return { done: {}, parts: {}, stars: 0 };
  }
  function save() {
    try {
      localStorage.setItem(STORAGE, JSON.stringify(state));
    } catch (e) {}
  }

  /* ---------------- Confetti (motion-safe) ---------------- */
  var reduceMotion =
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  function confetti() {
    if (reduceMotion) return;
    var emojis = ["⭐", "🎉", "🌟", "💚", "🥳", "🌈"];
    for (var i = 0; i < 26; i++) {
      var c = el("div", { cls: "confetti", text: emojis[i % emojis.length] });
      c.style.left = Math.random() * 100 + "vw";
      c.style.animationDuration = 2 + Math.random() * 2 + "s";
      c.style.animationDelay = Math.random() * 0.6 + "s";
      document.body.appendChild(c);
      (function (node) {
        setTimeout(function () {
          node.remove();
        }, 4500);
      })(c);
    }
  }

  /* ---------------- Inline SVG scene library ---------------- */
  /* Friendly, big, colorful scenes built from SVG so there are no external
     assets. Each returns an <svg> string. */
  var SCENES = {
    garden:
      '<svg class="scene-svg" viewBox="0 0 320 180" role="img" aria-label="A sunny garden with a growing plant">' +
      '<rect width="320" height="180" rx="16" fill="#eafaf1"/>' +
      '<circle cx="58" cy="42" r="26" fill="#ffce3a"/>' +
      '<g class="float-soft"><circle cx="250" cy="40" r="16" fill="#fff"/><circle cx="270" cy="46" r="20" fill="#fff"/><circle cx="232" cy="48" r="14" fill="#fff"/></g>' +
      '<rect y="130" width="320" height="50" fill="#a5d6a7"/>' +
      '<rect x="150" y="80" width="8" height="52" rx="4" fill="#2e9e5b"/>' +
      '<circle cx="154" cy="72" r="22" fill="#ff6b6b"/><circle cx="154" cy="72" r="9" fill="#ffce3a"/>' +
      '<path d="M150 110 q-22 -6 -28 -26 q24 2 28 26" fill="#4caf50"/>' +
      '<path d="M158 116 q22 -6 28 -26 q-24 2 -28 26" fill="#4caf50"/>' +
      "</svg>",
    cafe:
      '<svg class="scene-svg" viewBox="0 0 320 180" role="img" aria-label="A plate of healthy food">' +
      '<rect width="320" height="180" rx="16" fill="#fff7e6"/>' +
      '<ellipse cx="160" cy="150" rx="120" ry="16" fill="#f0e4c8"/>' +
      '<circle cx="160" cy="100" r="64" fill="#fff" stroke="#cfe0d8" stroke-width="8"/>' +
      '<circle cx="135" cy="92" r="18" fill="#ff6b6b"/>' +
      '<path d="M180 78 l18 6 -6 18 -18 -6z" fill="#4caf50"/>' +
      '<rect x="150" y="108" width="34" height="12" rx="6" fill="#ffb627"/>' +
      '<circle cx="138" cy="120" r="10" fill="#7c5cbf"/>' +
      "</svg>",
    forest:
      '<svg class="scene-svg" viewBox="0 0 320 180" role="img" aria-label="A calm forest">' +
      '<rect width="320" height="180" rx="16" fill="#e3f2fd"/>' +
      '<rect y="130" width="320" height="50" fill="#a5d6a7"/>' +
      '<g class="float-soft"><circle cx="120" cy="80" r="38" fill="#4caf50"/><rect x="114" y="100" width="12" height="40" fill="#8d6e63"/></g>' +
      '<circle cx="210" cy="92" r="30" fill="#2e9e5b"/><rect x="205" y="108" width="10" height="34" fill="#8d6e63"/>' +
      '<circle cx="160" cy="120" r="14" fill="#ffce3a"/><text x="160" y="126" font-size="16" text-anchor="middle">🙂</text>' +
      "</svg>",
    crossroads:
      '<svg class="scene-svg" viewBox="0 0 320 180" role="img" aria-label="A crossroads with a traffic light">' +
      '<rect width="320" height="180" rx="16" fill="#eef4f8"/>' +
      '<rect x="120" y="40" width="80" height="140" fill="#cfd8dc"/>' +
      '<rect y="92" width="320" height="42" fill="#cfd8dc"/>' +
      '<rect x="230" y="40" width="34" height="86" rx="10" fill="#37474f"/>' +
      '<circle cx="247" cy="58" r="11" fill="#ff6b6b"/>' +
      '<circle cx="247" cy="83" r="11" fill="#ffce3a"/>' +
      '<circle cx="247" cy="108" r="11" fill="#4caf50"/>' +
      "</svg>",
    meadow:
      '<svg class="scene-svg" viewBox="0 0 320 180" role="img" aria-label="A flower meadow">' +
      '<rect width="320" height="180" rx="16" fill="#f3fbf6"/>' +
      '<rect y="120" width="320" height="60" fill="#a5d6a7"/>' +
      flowers() +
      "</svg>",
    hill:
      '<svg class="scene-svg" viewBox="0 0 320 180" role="img" aria-label="Steps going up a hill">' +
      '<rect width="320" height="180" rx="16" fill="#eafaf1"/>' +
      '<circle cx="270" cy="40" r="22" fill="#ffce3a"/>' +
      '<path d="M0 180 L80 180 L80 140 L150 140 L150 100 L220 100 L220 60 L300 60 L300 180 Z" fill="#c8e6c9" stroke="#2e9e5b" stroke-width="3"/>' +
      '<text x="250" y="50" font-size="22">🎯</text>' +
      "</svg>",
    pond:
      '<svg class="scene-svg" viewBox="0 0 320 180" role="img" aria-label="A quiet story pond">' +
      '<rect width="320" height="180" rx="16" fill="#e3f2fd"/>' +
      '<ellipse cx="160" cy="130" rx="130" ry="40" fill="#90caf9"/>' +
      '<text x="120" y="120" font-size="26">🐢</text>' +
      '<text x="190" y="110" font-size="22">📖</text>' +
      '<circle cx="60" cy="40" r="20" fill="#ffce3a"/>' +
      "</svg>",
    falls:
      '<svg class="scene-svg" viewBox="0 0 320 180" role="img" aria-label="Friendly waterfall">' +
      '<rect width="320" height="180" rx="16" fill="#e3f2fd"/>' +
      '<rect x="120" y="20" width="80" height="120" fill="#90caf9"/>' +
      '<ellipse cx="160" cy="150" rx="110" ry="20" fill="#64b5f6"/>' +
      '<text x="110" y="120" font-size="26">🧑</text><text x="170" y="120" font-size="26">🧒</text>' +
      "</svg>",
    move:
      '<svg class="scene-svg" viewBox="0 0 320 180" role="img" aria-label="Children moving and exercising">' +
      '<rect width="320" height="180" rx="16" fill="#eaf5ff"/>' +
      '<circle cx="60" cy="40" r="20" fill="#ffce3a"/>' +
      '<text x="80" y="130" font-size="60" class="float-soft">🏃</text>' +
      '<text x="180" y="120" font-size="44">⚽</text>' +
      "</svg>",
    sleep:
      '<svg class="scene-svg" viewBox="0 0 320 180" role="img" aria-label="Night time with a moon and stars">' +
      '<rect width="320" height="180" rx="16" fill="#311b92"/>' +
      '<circle cx="250" cy="50" r="26" fill="#fff59d"/>' +
      '<text x="60" y="60" font-size="20" fill="#fff">⭐</text>' +
      '<text x="120" y="40" font-size="16" fill="#fff">⭐</text>' +
      '<text x="170" y="70" font-size="14" fill="#fff">⭐</text>' +
      '<rect y="120" width="320" height="60" fill="#4527a0"/>' +
      '<text x="130" y="150" font-size="40">🛏️</text>' +
      "</svg>",
    helpers:
      '<svg class="scene-svg" viewBox="0 0 320 180" role="img" aria-label="Community helpers in a neighborhood">' +
      '<rect width="320" height="180" rx="16" fill="#fff7e6"/>' +
      '<rect y="120" width="320" height="60" fill="#c8e6c9"/>' +
      '<rect x="40" y="70" width="60" height="60" fill="#90caf9"/>' +
      '<rect x="220" y="60" width="60" height="70" fill="#ffab91"/>' +
      '<text x="120" y="135" font-size="34">👩‍⚕️</text><text x="170" y="135" font-size="34">👮</text>' +
      "</svg>",
  };
  function flowers() {
    var cols = ["#ff6b6b", "#ffce3a", "#7c5cbf", "#3aa3e3", "#ff8fab"];
    var s = "";
    for (var i = 0; i < 5; i++) {
      var x = 40 + i * 56;
      s +=
        '<rect x="' +
        (x - 2) +
        '" y="120" width="5" height="34" fill="#2e9e5b"/>' +
        '<circle cx="' +
        x +
        '" cy="116" r="13" fill="' +
        cols[i] +
        '"/><circle cx="' +
        x +
        '" cy="116" r="5" fill="#fff"/>';
    }
    return s;
  }

  /* A reading card: SVG picture + simple text + read-aloud EN/ES + word bank. */
  function readingCard(opts) {
    /* opts: { sceneKey, en, es, keywords:[{w,ic}] } */
    var card = el("div", { cls: "reading-card" });
    if (opts.sceneKey && SCENES[opts.sceneKey]) {
      var holder = el("div");
      holder.innerHTML = SCENES[opts.sceneKey];
      var svg = holder.firstChild;
      svg.classList.add("reading-scene");
      card.appendChild(svg);
    }
    var txt = el("p", { cls: "reading-text", html: opts.en });
    card.appendChild(txt);
    if (opts.es) {
      card.appendChild(
        el("p", {
          text: opts.es,
          attrs: {
            style: "color:#7c5cbf;font-style:italic;margin:8px 0 0",
          },
        }),
      );
    }
    var actions = el("div", { cls: "reading-actions" });
    actions.appendChild(
      el("span", { cls: "lbl", text: "🔊 Listen · Escuchar:" }),
    );
    var enB = sayBtn(opts.enPlain || stripTags(opts.en), null);
    enB.title = "Read in English";
    var esB = sayBtn(opts.es, null);
    esB.title = "Leer en español";
    actions.appendChild(enB);
    actions.appendChild(el("span", { text: "English" }));
    actions.appendChild(esB);
    actions.appendChild(el("span", { text: "Español" }));
    card.appendChild(actions);

    if (opts.keywords && opts.keywords.length) {
      var bank = el("div", {
        cls: "wordbank",
        attrs: { "aria-label": "Word bank · Banco de palabras" },
      });
      bank.appendChild(
        el("span", {
          text: "Word bank · Banco de palabras: ",
          attrs: { style: "font-weight:700" },
        }),
      );
      opts.keywords.forEach(function (k) {
        var chip = el("button", {
          cls: "chip",
          attrs: {
            type: "button",
            style: "cursor:pointer;font-family:inherit",
          },
        });
        chip.innerHTML = (k.ic ? k.ic + " " : "") + k.w;
        chip.addEventListener("click", function () {
          speak(k.w, "en-US");
        });
        bank.appendChild(chip);
      });
      card.appendChild(bank);
    }
    return card;
  }
  function stripTags(html) {
    var d = el("div", { html: html });
    return d.textContent || "";
  }

  /* ---------------- Generic feedback helper ---------------- */
  function feedbackBox() {
    return el("div", { cls: "feedback", attrs: { "aria-live": "polite" } });
  }
  function showFeedback(f, kind, enText, esText) {
    f.className = "feedback show " + (kind === "good" ? "good" : "try");
    f.innerHTML = "";
    f.appendChild(
      el("span", {
        cls: "ic",
        text: kind === "good" ? "✅" : "💡",
        attrs: { "aria-hidden": "true" },
      }),
    );
    var d = el("div");
    d.appendChild(el("p", { text: enText, attrs: { style: "margin:0" } }));
    if (esText)
      d.appendChild(
        el("p", {
          text: esText,
          attrs: { style: "margin:2px 0 0;font-style:italic" },
        }),
      );
    f.appendChild(d);
    f.appendChild(sayBtn(enText, esText || null));
  }

  /* A "done" banner shown when a creating activity is finished. */
  function partDoneBanner(enText, esText) {
    var f = el("div", { cls: "feedback good show" });
    f.appendChild(
      el("span", { cls: "ic", text: "🎨", attrs: { "aria-hidden": "true" } }),
    );
    var d = el("div");
    d.appendChild(el("p", { text: enText, attrs: { style: "margin:0" } }));
    if (esText)
      d.appendChild(
        el("p", {
          text: esText,
          attrs: { style: "margin:2px 0 0;font-style:italic" },
        }),
      );
    f.appendChild(d);
    f.appendChild(sayBtn(enText, esText || null));
    return f;
  }

  /* ---------------- Canvas download helper ---------------- */
  function downloadCanvas(canvas, filename) {
    try {
      var url = canvas.toDataURL("image/png");
      var a = el("a", {
        attrs: { href: url, download: filename || "my-art.png" },
      });
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (e) {
      /* no-op: download blocked */
    }
  }

  /* ===================================================================
     SHARED CREATING TOOLS
     =================================================================== */

  /* Canvas free-draw tool with colors, sizes, eraser, stamps, clear, save. */
  function canvasDrawTool(root, opts, onUse) {
    opts = opts || {};
    var wrap = el("div", { cls: "draw-wrap" });
    var bar = el("div", { cls: "draw-toolbar" });

    var colors = [
      "#213547",
      "#ff6b6b",
      "#ffb627",
      "#ffce3a",
      "#2e9e5b",
      "#3aa3e3",
      "#7c5cbf",
      "#ff8fab",
    ];
    var current = { color: colors[0], size: 8, mode: "draw", stamp: null };

    colors.forEach(function (c) {
      var sw = el("button", {
        cls: "swatch",
        attrs: {
          type: "button",
          "aria-label": "Color " + c,
          "aria-pressed": c === current.color ? "true" : "false",
          style: "background:" + c,
        },
      });
      sw.addEventListener("click", function () {
        current.color = c;
        current.mode = "draw";
        current.stamp = null;
        syncPressed();
      });
      bar.appendChild(sw);
    });

    var range = el("input", {
      cls: "size-range",
      attrs: {
        type: "range",
        min: "2",
        max: "30",
        value: "8",
        "aria-label": "Brush size",
      },
    });
    range.addEventListener("input", function () {
      current.size = parseInt(range.value, 10);
    });
    bar.appendChild(range);

    var eraser = el("button", {
      cls: "tool-btn",
      attrs: { type: "button", "aria-pressed": "false" },
      html: "🧽 Eraser",
    });
    eraser.addEventListener("click", function () {
      current.mode = current.mode === "erase" ? "draw" : "erase";
      current.stamp = null;
      syncPressed();
    });
    bar.appendChild(eraser);

    wrap.appendChild(bar);

    /* Optional sticker stamps */
    if (opts.stamps && opts.stamps.length) {
      var stampRow = el("div", {
        cls: "stamp-row",
        attrs: { style: "margin-bottom:10px" },
      });
      opts.stamps.forEach(function (s) {
        var sb = el("button", {
          cls: "stamp-btn",
          attrs: {
            type: "button",
            "aria-pressed": "false",
            "aria-label": "Stamp " + s,
          },
          text: s,
        });
        sb.addEventListener("click", function () {
          current.mode = "stamp";
          current.stamp = s;
          syncPressed();
        });
        stampRow.appendChild(sb);
        sb.__stamp = true;
      });
      wrap.appendChild(stampRow);
    }

    var canvas = el("canvas", {
      cls: "draw-canvas",
      attrs: {
        width: "560",
        height: "360",
        role: "img",
        "aria-label": opts.label || "Drawing area · Área para dibujar",
      },
    });
    wrap.appendChild(canvas);
    root.appendChild(wrap);

    var ctx = canvas.getContext("2d");
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    if (opts.guide) opts.guide(ctx, canvas);

    var drawing = false,
      used = false,
      lastX = 0,
      lastY = 0;
    function pos(e) {
      var r = canvas.getBoundingClientRect();
      var cx = (e.touches ? e.touches[0].clientX : e.clientX) - r.left;
      var cy = (e.touches ? e.touches[0].clientY : e.clientY) - r.top;
      return {
        x: (cx / r.width) * canvas.width,
        y: (cy / r.height) * canvas.height,
      };
    }
    function start(e) {
      e.preventDefault();
      var p = pos(e);
      if (current.mode === "stamp" && current.stamp) {
        ctx.font = current.size * 4 + "px serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(current.stamp, p.x, p.y);
        markUsed();
        return;
      }
      drawing = true;
      lastX = p.x;
      lastY = p.y;
      dot(p.x, p.y);
    }
    function dot(x, y) {
      ctx.beginPath();
      ctx.fillStyle = current.mode === "erase" ? "#ffffff" : current.color;
      ctx.arc(x, y, current.size / 2, 0, Math.PI * 2);
      ctx.fill();
      markUsed();
    }
    function moveTo(e) {
      if (!drawing) return;
      e.preventDefault();
      var p = pos(e);
      ctx.strokeStyle = current.mode === "erase" ? "#ffffff" : current.color;
      ctx.lineWidth = current.size;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.beginPath();
      ctx.moveTo(lastX, lastY);
      ctx.lineTo(p.x, p.y);
      ctx.stroke();
      lastX = p.x;
      lastY = p.y;
    }
    function end() {
      drawing = false;
    }
    function markUsed() {
      if (!used) {
        used = true;
        if (onUse) onUse();
      }
    }
    canvas.addEventListener("mousedown", start);
    canvas.addEventListener("mousemove", moveTo);
    window.addEventListener("mouseup", end);
    canvas.addEventListener("touchstart", start, { passive: false });
    canvas.addEventListener("touchmove", moveTo, { passive: false });
    canvas.addEventListener("touchend", end);

    function syncPressed() {
      wrap.querySelectorAll(".swatch").forEach(function (s) {
        s.setAttribute(
          "aria-pressed",
          current.mode === "draw" &&
            s.style.background.indexOf(rgbHint(current.color)) > -1
            ? "true"
            : "false",
        );
      });
      eraser.setAttribute(
        "aria-pressed",
        current.mode === "erase" ? "true" : "false",
      );
      wrap.querySelectorAll(".stamp-btn").forEach(function (s) {
        s.setAttribute(
          "aria-pressed",
          current.mode === "stamp" && s.textContent === current.stamp
            ? "true"
            : "false",
        );
      });
    }
    function rgbHint(hex) {
      return hex; /* style.background normalizes; comparison best-effort */
    }
    /* Robust pressed sync by exact hex match on the data we set. */
    syncPressed = function () {
      var i = 0;
      wrap.querySelectorAll(".swatch").forEach(function (s) {
        var c = colors[i++];
        s.setAttribute(
          "aria-pressed",
          current.mode === "draw" && c === current.color ? "true" : "false",
        );
      });
      eraser.setAttribute(
        "aria-pressed",
        current.mode === "erase" ? "true" : "false",
      );
      wrap.querySelectorAll(".stamp-btn").forEach(function (s) {
        s.setAttribute(
          "aria-pressed",
          current.mode === "stamp" && s.textContent === current.stamp
            ? "true"
            : "false",
        );
      });
    };
    syncPressed();

    return {
      canvas: canvas,
      ctx: ctx,
      isUsed: function () {
        return used;
      },
    };
  }

  /* ===================================================================
     MULTI-PART STOP RUNNER
     =================================================================== */
  function runParts(stop, body, completeStop) {
    var parts = stop.parts;
    var pstate = state.parts[stop.id] || {};
    state.parts[stop.id] = pstate;

    var barBar = el("div", { cls: "parts-bar", attrs: { role: "tablist" } });
    var titleRow = el("div", { cls: "part-title" });
    var content = el("div");
    body.appendChild(barBar);
    body.appendChild(titleRow);
    body.appendChild(content);

    var current = firstUndone();
    function firstUndone() {
      for (var i = 0; i < parts.length; i++) if (!pstate[parts[i].id]) return i;
      return 0;
    }

    function renderBar() {
      barBar.innerHTML = "";
      parts.forEach(function (p, i) {
        var chip = el("button", {
          cls: "pchip" + (pstate[p.id] ? " done" : ""),
          attrs: {
            type: "button",
            role: "tab",
            "aria-current": i === current ? "true" : "false",
            "aria-label":
              "Part " +
              (i + 1) +
              ": " +
              p.title +
              (pstate[p.id] ? ", done" : ""),
          },
        });
        chip.innerHTML =
          '<span class="dot" aria-hidden="true">' +
          (pstate[p.id] ? "✅" : i + 1) +
          "</span> " +
          p.short;
        chip.addEventListener("click", function () {
          current = i;
          renderPart();
        });
        barBar.appendChild(chip);
      });
    }

    function renderPart() {
      renderBar();
      var p = parts[current];
      titleRow.innerHTML =
        '<span aria-hidden="true" style="font-size:1.5rem">' +
        (p.emoji || "✨") +
        "</span>" +
        "<div><h3>" +
        "Part " +
        (current + 1) +
        " · " +
        p.title +
        '</h3><p class="es-name">' +
        p.titleEs +
        "</p></div>";
      titleRow.appendChild(sayBtn(p.title, p.titleEs));
      content.innerHTML = "";

      var partDone = false;
      function done() {
        if (partDone) return;
        partDone = true;
        if (!pstate[p.id]) {
          pstate[p.id] = true;
          save();
          renderBar();
        }
        addPartNav();
        if (allPartsDone()) completeStop();
      }
      p.build(content, done);
      wireStaticSay(content);

      function addPartNav() {
        if (content.querySelector(".part-nav")) return;
        var nav = el("div", { cls: "part-nav" });
        var next = nextUndonePart();
        if (next != null) {
          var nb = el("button", {
            cls: "btn primary",
            text: "Next: " + parts[next].title + " ▶",
          });
          nb.addEventListener("click", function () {
            current = next;
            renderPart();
            content.scrollIntoView({
              behavior: reduceMotion ? "auto" : "smooth",
              block: "start",
            });
          });
          nav.appendChild(nb);
        }
        content.appendChild(nav);
      }
      content.scrollIntoView({
        behavior: reduceMotion ? "auto" : "smooth",
        block: "nearest",
      });
    }
    function nextUndonePart() {
      for (var s = 1; s <= parts.length; s++) {
        var i = (current + s) % parts.length;
        if (!pstate[parts[i].id]) return i;
      }
      return null;
    }
    function allPartsDone() {
      return parts.every(function (p) {
        return pstate[p.id];
      });
    }
    renderPart();
  }

  /* ===================================================================
     STOP DEFINITIONS — each has parts[] (3-5 mini activities)
     =================================================================== */
  var STOPS = [
    {
      id: "garden",
      emoji: "🌱",
      title: "Goal Garden",
      titleEs: "Jardín de metas",
      typeLabel: "Read · Build · Draw",
      parts: [
        {
          id: "g_read",
          short: "Read",
          emoji: "📖",
          title: "Meet the goal",
          titleEs: "Conoce la meta",
          build: garden_read,
        },
        {
          id: "g_build",
          short: "Build",
          emoji: "🌷",
          title: "Build a goal",
          titleEs: "Arma una meta",
          build: garden_build,
        },
        {
          id: "g_draw",
          short: "Draw",
          emoji: "🎨",
          title: "Draw your goal",
          titleEs: "Dibuja tu meta",
          build: garden_draw,
        },
      ],
    },
    {
      id: "cafe",
      emoji: "🥗",
      title: "Healthy Choices Café",
      titleEs: "Café de opciones sanas",
      typeLabel: "Read · Sort · Design",
      parts: [
        {
          id: "c_read",
          short: "Read",
          emoji: "📖",
          title: "Food is fuel",
          titleEs: "La comida es energía",
          build: cafe_read,
        },
        {
          id: "c_sort",
          short: "Sort",
          emoji: "🍎",
          title: "Sort the foods",
          titleEs: "Clasifica la comida",
          build: buildCafe,
        },
        {
          id: "c_plate",
          short: "Design",
          emoji: "🍽️",
          title: "Design a healthy plate",
          titleEs: "Diseña un plato sano",
          build: cafe_plate,
        },
        {
          id: "c_quiz",
          short: "Quiz",
          emoji: "❓",
          title: "Quick check",
          titleEs: "Revisión rápida",
          build: cafe_quiz,
        },
      ],
    },
    {
      id: "forest",
      emoji: "🌳",
      title: "Feelings Forest",
      titleEs: "Bosque de sentimientos",
      typeLabel: "Read · Match · Make",
      parts: [
        {
          id: "f_read",
          short: "Read",
          emoji: "📖",
          title: "All feelings are okay",
          titleEs: "Todo sentimiento está bien",
          build: forest_read,
        },
        {
          id: "f_pick",
          short: "Match",
          emoji: "😊",
          title: "Name the feeling",
          titleEs: "Nombra el sentimiento",
          build: buildFeelings,
        },
        {
          id: "f_calm",
          short: "Calm",
          emoji: "🌬️",
          title: "Calm-down toolbox",
          titleEs: "Caja para calmarse",
          build: forest_calm,
        },
        {
          id: "f_poster",
          short: "Make",
          emoji: "🖼️",
          title: "Make a feelings poster",
          titleEs: "Haz un cartel de sentimientos",
          build: forest_poster,
        },
      ],
    },
    {
      id: "crossroads",
      emoji: "🚦",
      title: "Decision Crossroads",
      titleEs: "Cruce de decisiones",
      typeLabel: "Read · Choose · Comic",
      parts: [
        {
          id: "x_read",
          short: "Read",
          emoji: "📖",
          title: "What is responsible?",
          titleEs: "¿Qué es ser responsable?",
          build: cross_read,
        },
        {
          id: "x_1",
          short: "Choose 1",
          emoji: "🗑️",
          title: "The playground",
          titleEs: "El patio",
          build: buildCrossroads,
        },
        {
          id: "x_2",
          short: "Choose 2",
          emoji: "📚",
          title: "The borrowed book",
          titleEs: "El libro prestado",
          build: cross_book,
        },
        {
          id: "x_comic",
          short: "Comic",
          emoji: "💬",
          title: "Build a choice comic",
          titleEs: "Haz un cómic de decisiones",
          build: cross_comic,
        },
      ],
    },
    {
      id: "match",
      emoji: "🧩",
      title: "Word Match Meadow",
      titleEs: "Pradera de palabras",
      typeLabel: "Read · Match · Write",
      parts: [
        {
          id: "m_read",
          short: "Words",
          emoji: "📖",
          title: "Word picture cards",
          titleEs: "Tarjetas de palabras",
          build: match_read,
        },
        {
          id: "m_match",
          short: "Match",
          emoji: "🧩",
          title: "Match word & picture",
          titleEs: "Empareja palabra y dibujo",
          build: buildWordMatch,
        },
        {
          id: "m_fill",
          short: "Fill",
          emoji: "✏️",
          title: "Finish the sentence",
          titleEs: "Completa la oración",
          build: match_fill,
        },
      ],
    },
    {
      id: "move",
      emoji: "🤸",
      title: "Move-Your-Body Station",
      titleEs: "Estación de movimiento",
      typeLabel: "Read · Move · Plan",
      parts: [
        {
          id: "mv_read",
          short: "Read",
          emoji: "📖",
          title: "Why we move",
          titleEs: "Por qué nos movemos",
          build: move_read,
        },
        {
          id: "mv_brain",
          short: "Move",
          emoji: "🧠",
          title: "Brain-break jumps",
          titleEs: "Pausa de saltos",
          build: move_brainbreak,
        },
        {
          id: "mv_plan",
          short: "Plan",
          emoji: "📅",
          title: "Plan a play day",
          titleEs: "Planea un día de juego",
          build: move_plan,
        },
      ],
    },
    {
      id: "sleep",
      emoji: "🌙",
      title: "Sleep & Rest Cove",
      titleEs: "Caleta del descanso",
      typeLabel: "Read · Order · Color",
      parts: [
        {
          id: "s_read",
          short: "Read",
          emoji: "📖",
          title: "Sleep helps me grow",
          titleEs: "Dormir me ayuda a crecer",
          build: sleep_read,
        },
        {
          id: "s_order",
          short: "Order",
          emoji: "🪜",
          title: "Bedtime steps in order",
          titleEs: "Pasos para dormir en orden",
          build: sleep_order,
        },
        {
          id: "s_color",
          short: "Color",
          emoji: "🎨",
          title: "Color the calm room",
          titleEs: "Colorea el cuarto tranquilo",
          build: sleep_color,
        },
      ],
    },
    {
      id: "steps",
      emoji: "🪜",
      title: "Step-by-Step Hill",
      titleEs: "Colina paso a paso",
      typeLabel: "Read · Order · Map",
      parts: [
        {
          id: "st_read",
          short: "Read",
          emoji: "📖",
          title: "Big goals, small steps",
          titleEs: "Metas grandes, pasos pequeños",
          build: steps_read,
        },
        {
          id: "st_order",
          short: "Order",
          emoji: "🪜",
          title: "Put steps in order",
          titleEs: "Ordena los pasos",
          build: buildOrderSteps,
        },
        {
          id: "st_map",
          short: "Map",
          emoji: "🗺️",
          title: "Draw your goal path",
          titleEs: "Dibuja tu camino",
          build: steps_map,
        },
      ],
    },
    {
      id: "reading",
      emoji: "📖",
      title: "Story Pond",
      titleEs: "Estanque del cuento",
      typeLabel: "Read · Answer · Retell",
      parts: [
        {
          id: "r_story",
          short: "Story",
          emoji: "📖",
          title: "Read & answer",
          titleEs: "Lee y responde",
          build: buildReading,
        },
        {
          id: "r_seq",
          short: "Retell",
          emoji: "🔢",
          title: "Retell in order",
          titleEs: "Vuelve a contar en orden",
          build: reading_retell,
        },
        {
          id: "r_comic",
          short: "Draw",
          emoji: "🎨",
          title: "Draw the best part",
          titleEs: "Dibuja la mejor parte",
          build: reading_draw,
        },
      ],
    },
    {
      id: "helpers",
      emoji: "🦸",
      title: "Healthy Helpers",
      titleEs: "Ayudantes saludables",
      typeLabel: "Read · Match · Choose",
      parts: [
        {
          id: "h_read",
          short: "Read",
          emoji: "📖",
          title: "Who keeps us healthy?",
          titleEs: "¿Quién nos cuida?",
          build: helpers_read,
        },
        {
          id: "h_match",
          short: "Match",
          emoji: "🧩",
          title: "Helper & job",
          titleEs: "Ayudante y trabajo",
          build: helpers_match,
        },
        {
          id: "h_choose",
          short: "Choose",
          emoji: "🤝",
          title: "Be a helper",
          titleEs: "Sé un ayudante",
          build: helpers_choose,
        },
      ],
    },
    {
      id: "falls",
      emoji: "🤝",
      title: "Friendship Falls",
      titleEs: "Cascada de amistad",
      typeLabel: "Read · Choose · Design",
      parts: [
        {
          id: "fr_read",
          short: "Read",
          emoji: "📖",
          title: "Kind friends",
          titleEs: "Amigos amables",
          build: falls_read,
        },
        {
          id: "fr_1",
          short: "Choose",
          emoji: "🤗",
          title: "New student at lunch",
          titleEs: "Estudiante nuevo",
          build: buildFriendship,
        },
        {
          id: "fr_badge",
          short: "Badge",
          emoji: "🏅",
          title: "Design a kindness badge",
          titleEs: "Diseña una medalla",
          build: falls_badge,
        },
      ],
    },
  ];

  var hub = document.getElementById("hub");
  var stage = document.getElementById("stage");
  var mapGrid = document.getElementById("mapGrid");

  /* ---------------- Render hub ---------------- */
  function renderHub() {
    mapGrid.innerHTML = "";
    STOPS.forEach(function (stop, i) {
      var card = el("button", {
        cls: "stop" + (state.done[stop.id] ? " done" : ""),
      });
      card.type = "button";
      card.setAttribute("role", "listitem");
      var partsDone = countPartsDone(stop);
      card.setAttribute(
        "aria-label",
        stop.title +
          ". " +
          stop.parts.length +
          " activities. " +
          partsDone +
          " done." +
          (state.done[stop.id] ? " Star earned." : ""),
      );
      card.innerHTML =
        '<span class="badge-star" aria-hidden="true">⭐</span>' +
        '<span class="emoji" aria-hidden="true">' +
        stop.emoji +
        "</span>" +
        "<h3>" +
        stop.title +
        "</h3>" +
        '<p class="es-name">' +
        stop.titleEs +
        "</p>" +
        '<p class="stop-type">' +
        stop.typeLabel +
        "</p>" +
        '<span class="part-count">' +
        stop.parts.length +
        " activities</span>" +
        dotsHtml(stop) +
        '<span class="stop-num" aria-hidden="true">Stop ' +
        (i + 1) +
        "/" +
        STOPS.length +
        "</span>";
      if (state.done[stop.id]) {
        card.appendChild(el("span", { cls: "ribbon", text: "DONE ✓" }));
      }
      card.addEventListener("click", function () {
        openStop(stop);
      });
      mapGrid.appendChild(card);
    });
    updateProgress();

    if (countDone() >= STOPS.length) {
      var cel = el("button", {
        cls: "btn primary",
        text: "🎉 See my celebration! · ¡Ver mi celebración!",
      });
      cel.style.gridColumn = "1 / -1";
      cel.style.fontSize = "1.2rem";
      cel.addEventListener("click", showCelebration);
      mapGrid.appendChild(cel);
    }
  }

  function dotsHtml(stop) {
    var ps = state.parts[stop.id] || {};
    var s = '<span class="stop-dots" aria-hidden="true">';
    stop.parts.forEach(function (p) {
      s += '<i class="' + (ps[p.id] ? "on" : "") + '"></i>';
    });
    return s + "</span>";
  }
  function countPartsDone(stop) {
    var ps = state.parts[stop.id] || {};
    return stop.parts.filter(function (p) {
      return ps[p.id];
    }).length;
  }
  function countDone() {
    return Object.keys(state.done).filter(function (k) {
      return state.done[k];
    }).length;
  }

  function updateProgress() {
    var done = countDone();
    var pct = Math.round((done / STOPS.length) * 100);
    document.getElementById("starCount").textContent = "⭐ " + state.stars;
    var fill = document.getElementById("barFill");
    fill.style.width = pct + "%";
    fill.parentElement.setAttribute("aria-valuenow", String(pct));
    var pt = document.getElementById("progressText");
    if (done === 0)
      pt.textContent =
        "Pick any stop to begin! · ¡Elige una parada para empezar!";
    else if (done >= STOPS.length)
      pt.textContent =
        "You finished every stop! Amazing! · ¡Terminaste todas! ¡Increíble!";
    else
      pt.textContent =
        done +
        " of " +
        STOPS.length +
        " stops done · " +
        done +
        " de " +
        STOPS.length +
        " paradas";
  }

  function showHub() {
    stage.classList.add("hidden");
    stage.innerHTML = "";
    hub.classList.remove("hidden");
    renderHub();
    window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
  }

  /* Open a stop into the stage (now a multi-part mini-set). */
  function openStop(stop) {
    hub.classList.add("hidden");
    stage.classList.remove("hidden");
    stage.innerHTML = "";

    var screen = el("div", { cls: "screen" });
    var head = el("div", { cls: "screen-head" });
    head.innerHTML =
      '<span class="emoji" aria-hidden="true">' +
      stop.emoji +
      "</span>" +
      "<div><h2>" +
      stop.title +
      '</h2><p class="es-name">' +
      stop.titleEs +
      "</p></div>";
    head.appendChild(sayBtn(stop.title, stop.titleEs));
    screen.appendChild(head);

    var body = el("div");
    screen.appendChild(body);
    stage.appendChild(screen);

    var completed = false;
    function complete() {
      if (completed) return;
      completed = true;
      if (!state.done[stop.id]) {
        state.done[stop.id] = true;
        state.stars += 1;
        save();
      }
      celebrateStop(stop, screen);
    }

    runParts(stop, body, complete);

    var nav = el("div", { cls: "btn-row" });
    var back = el("button", {
      cls: "btn ghost",
      text: "🗺️ Back to map · Volver al mapa",
    });
    back.addEventListener("click", showHub);
    nav.appendChild(back);
    screen.appendChild(nav);

    wireStaticSay(stage);
    head.querySelector("h2").setAttribute("tabindex", "-1");
    head.querySelector("h2").focus();
    window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });

    /* If reopening an already-finished stop, show finished state. */
    if (state.done[stop.id]) {
      completed = true;
    }
  }

  function celebrateStop(stop, screen) {
    updateProgress();
    confetti();
    var done = el("div", { cls: "feedback good show" });
    done.innerHTML = '<span class="ic" aria-hidden="true">⭐</span>';
    var msg = el("div");
    msg.appendChild(
      el("p", {
        html: "<strong>Whole stop done! You earned a star!</strong>",
        attrs: { style: "margin:0" },
      }),
    );
    msg.appendChild(
      el("p", {
        text: "¡Parada completa! ¡Ganaste una estrella!",
        attrs: { style: "margin:2px 0 0;font-style:italic" },
      }),
    );
    done.appendChild(msg);
    done.appendChild(
      sayBtn(
        "Whole stop done! You earned a star!",
        "¡Parada completa! Ganaste una estrella.",
      ),
    );
    screen.insertBefore(done, screen.querySelector(".btn-row"));

    var nav = screen.querySelector(".btn-row");
    var next = findNextUndone(stop.id);
    if (next) {
      var nb = el("button", {
        cls: "btn primary",
        text: "Next stop: " + next.title + " " + next.emoji,
      });
      nb.addEventListener("click", function () {
        openStop(next);
      });
      nav.insertBefore(nb, nav.firstChild);
    } else {
      var cb = el("button", {
        cls: "btn primary",
        text: "🎉 Celebration time!",
      });
      cb.addEventListener("click", showCelebration);
      nav.insertBefore(cb, nav.firstChild);
    }
    done.scrollIntoView({
      behavior: reduceMotion ? "auto" : "smooth",
      block: "center",
    });
  }

  function findNextUndone(currentId) {
    var idx = STOPS.findIndex(function (s) {
      return s.id === currentId;
    });
    for (var step = 1; step <= STOPS.length; step++) {
      var s = STOPS[(idx + step) % STOPS.length];
      if (!state.done[s.id]) return s;
    }
    return null;
  }

  /* ===================================================================
     READINGS (one per stop) — short, ESOL-friendly, picture + read-aloud
     =================================================================== */
  function garden_read(root, done) {
    root.appendChild(
      bilingual(
        "Read about goals. Press 🔊 to listen.",
        "Lee sobre las metas. Presiona 🔊 para escuchar.",
      ),
    );
    root.appendChild(
      readingCard({
        sceneKey: "garden",
        en: 'A <span class="kw">goal</span> is something you want to do. Goals can be big or small. Like a seed, a goal needs care to grow. You water it a little each day. Soon it grows big and strong!',
        es: "Una meta es algo que quieres lograr. Las metas pueden ser grandes o pequeñas. Como una semilla, una meta necesita cuidado para crecer. La riegas un poco cada día. ¡Pronto crece grande y fuerte!",
        keywords: [
          { w: "goal", ic: "🎯" },
          { w: "grow", ic: "🌱" },
          { w: "seed", ic: "🌰" },
        ],
      }),
    );
    readDoneButton(root, done);
  }
  function cafe_read(root, done) {
    root.appendChild(
      bilingual(
        "Read about food. Press 🔊 to listen.",
        "Lee sobre la comida. Presiona 🔊 para escuchar.",
      ),
    );
    root.appendChild(
      readingCard({
        sceneKey: "cafe",
        en: 'Food is <span class="kw">fuel</span> for your body. <span class="kw">Healthy</span> foods like fruit, vegetables, and water help you run, think, and grow. Treats are okay sometimes. But every day, fill your plate with colors!',
        es: "La comida es energía para tu cuerpo. Los alimentos saludables como la fruta, las verduras y el agua te ayudan a correr, pensar y crecer. Los dulces están bien a veces. ¡Pero cada día, llena tu plato de colores!",
        keywords: [
          { w: "healthy", ic: "🥗" },
          { w: "fuel", ic: "⚡" },
          { w: "water", ic: "💧" },
        ],
      }),
    );
    readDoneButton(root, done);
  }
  function forest_read(root, done) {
    root.appendChild(
      bilingual(
        "Read about feelings. Press 🔊 to listen.",
        "Lee sobre los sentimientos. Presiona 🔊 para escuchar.",
      ),
    );
    root.appendChild(
      readingCard({
        sceneKey: "forest",
        en: 'Everyone has <span class="kw">feelings</span>. Happy, sad, mad, scared — all feelings are okay. Feelings come and go like clouds. When a big feeling comes, you can take a slow breath and feel calm again.',
        es: "Todos tenemos sentimientos. Feliz, triste, enojado, asustado — todos los sentimientos están bien. Los sentimientos van y vienen como nubes. Cuando llega un sentimiento grande, puedes respirar despacio y calmarte otra vez.",
        keywords: [
          { w: "feelings", ic: "😊" },
          { w: "calm", ic: "🌬️" },
          { w: "breath", ic: "💨" },
        ],
      }),
    );
    readDoneButton(root, done);
  }
  function cross_read(root, done) {
    root.appendChild(
      bilingual(
        "Read about good choices. Press 🔊 to listen.",
        "Lee sobre las buenas decisiones. Presiona 🔊 para escuchar.",
      ),
    );
    root.appendChild(
      readingCard({
        sceneKey: "crossroads",
        en: 'A <span class="kw">responsible</span> choice helps, not hurts. Before you act, stop and think: "Is this kind? Is this safe? Is this fair?" Good choices make our class and home better for everyone.',
        es: "Una decisión responsable ayuda, no lastima. Antes de actuar, detente y piensa: '¿Es amable? ¿Es seguro? ¿Es justo?' Las buenas decisiones hacen mejor nuestra clase y casa para todos.",
        keywords: [
          { w: "responsible", ic: "✅" },
          { w: "safe", ic: "🛟" },
          { w: "fair", ic: "⚖️" },
        ],
      }),
    );
    readDoneButton(root, done);
  }
  function match_read(root, done) {
    root.appendChild(
      bilingual(
        "Look at the word cards. Press 🔊 on each card to hear it.",
        "Mira las tarjetas. Presiona 🔊 en cada tarjeta para escucharla.",
      ),
    );
    var words = [
      { en: "Goal", es: "Meta", ic: "🎯" },
      { en: "Healthy", es: "Saludable", ic: "🥗" },
      { en: "Kind", es: "Amable", ic: "🤝" },
      { en: "Rest", es: "Descanso", ic: "😴" },
      { en: "Feeling", es: "Sentimiento", ic: "😊" },
    ];
    var grid = el("div", { cls: "tile-grid" });
    words.forEach(function (w) {
      var t = el("div", {
        cls: "tile",
        attrs: { "aria-label": w.en + " · " + w.es },
      });
      t.innerHTML =
        '<span class="ic" aria-hidden="true">' +
        w.ic +
        "</span>" +
        w.en +
        '<br><span style="font-size:.8rem;color:#7c5cbf">' +
        w.es +
        "</span>";
      t.appendChild(sayBtn(w.en, w.es));
      grid.appendChild(t);
    });
    root.appendChild(grid);
    readDoneButton(root, done, "I read the words! · ¡Leí las palabras!");
  }
  function move_read(root, done) {
    root.appendChild(
      bilingual(
        "Read about moving your body. Press 🔊 to listen.",
        "Lee sobre mover tu cuerpo. Presiona 🔊 para escuchar.",
      ),
    );
    root.appendChild(
      readingCard({
        sceneKey: "move",
        en: 'Your body loves to <span class="kw">move</span>! Running, dancing, and playing make your heart strong and your brain happy. Try to move and play every day. Moving even helps you learn!',
        es: "¡A tu cuerpo le encanta moverse! Correr, bailar y jugar hacen fuerte tu corazón y feliz tu cerebro. Trata de moverte y jugar cada día. ¡Moverte hasta te ayuda a aprender!",
        keywords: [
          { w: "move", ic: "🏃" },
          { w: "heart", ic: "❤️" },
          { w: "play", ic: "⚽" },
        ],
      }),
    );
    readDoneButton(root, done);
  }
  function sleep_read(root, done) {
    root.appendChild(
      bilingual(
        "Read about sleep. Press 🔊 to listen.",
        "Lee sobre el sueño. Presiona 🔊 para escuchar.",
      ),
    );
    root.appendChild(
      readingCard({
        sceneKey: "sleep",
        en: 'Sleep helps you <span class="kw">grow</span>. While you sleep, your body rests and your brain saves what you learned. Kids need about ten hours of sleep. A calm bedtime helps you sleep well.',
        es: "Dormir te ayuda a crecer. Mientras duermes, tu cuerpo descansa y tu cerebro guarda lo que aprendiste. Los niños necesitan unas diez horas de sueño. Una rutina tranquila te ayuda a dormir bien.",
        keywords: [
          { w: "sleep", ic: "😴" },
          { w: "rest", ic: "🛏️" },
          { w: "grow", ic: "📏" },
        ],
      }),
    );
    readDoneButton(root, done);
  }
  function steps_read(root, done) {
    root.appendChild(
      bilingual(
        "Read about reaching goals. Press 🔊 to listen.",
        "Lee sobre lograr metas. Presiona 🔊 para escuchar.",
      ),
    );
    root.appendChild(
      readingCard({
        sceneKey: "hill",
        en: 'Big goals are like a tall hill. You do not jump to the top! You take one small <span class="kw">step</span> at a time. Choose a goal, make a plan, try each day, and celebrate. Step by step, you get there!',
        es: "Las metas grandes son como una colina alta. ¡No saltas hasta arriba! Das un pasito a la vez. Elige una meta, haz un plan, intenta cada día y celebra. ¡Paso a paso, lo logras!",
        keywords: [
          { w: "step", ic: "🪜" },
          { w: "plan", ic: "📝" },
          { w: "try", ic: "💪" },
        ],
      }),
    );
    readDoneButton(root, done);
  }
  function helpers_read(root, done) {
    root.appendChild(
      bilingual(
        "Read about helpers. Press 🔊 to listen.",
        "Lee sobre los ayudantes. Presiona 🔊 para escuchar.",
      ),
    );
    root.appendChild(
      readingCard({
        sceneKey: "helpers",
        en: 'Many people help us stay <span class="kw">healthy</span> and safe. Doctors and nurses help us feel better. Police and firefighters keep us safe. Cooks and farmers grow our food. We can be helpers too!',
        es: "Muchas personas nos ayudan a estar sanos y seguros. Los doctores y enfermeros nos ayudan a sentirnos mejor. La policía y los bomberos nos cuidan. Los cocineros y agricultores hacen nuestra comida. ¡Nosotros también podemos ayudar!",
        keywords: [
          { w: "doctor", ic: "👩‍⚕️" },
          { w: "safe", ic: "🛟" },
          { w: "helper", ic: "🤝" },
        ],
      }),
    );
    readDoneButton(root, done);
  }
  function falls_read(root, done) {
    root.appendChild(
      bilingual(
        "Read about friendship. Press 🔊 to listen.",
        "Lee sobre la amistad. Presiona 🔊 para escuchar.",
      ),
    );
    root.appendChild(
      readingCard({
        sceneKey: "falls",
        en: 'A good friend is <span class="kw">kind</span>. Friends share, take turns, and include others. When someone is sad, a kind word helps a lot. Small kind acts make big smiles!',
        es: "Un buen amigo es amable. Los amigos comparten, toman turnos e incluyen a los demás. Cuando alguien está triste, una palabra amable ayuda mucho. ¡Los pequeños actos de bondad hacen grandes sonrisas!",
        keywords: [
          { w: "kind", ic: "🤝" },
          { w: "share", ic: "🤲" },
          { w: "include", ic: "🫂" },
        ],
      }),
    );
    readDoneButton(root, done);
  }

  function readDoneButton(root, done, label) {
    var b = el("button", {
      cls: "btn primary",
      text: label || "✅ I read it! · ¡Lo leí!",
    });
    b.style.marginTop = "8px";
    b.addEventListener("click", function () {
      b.disabled = true;
      done();
    });
    root.appendChild(b);
  }

  /* ===================================================================
     STOP: GARDEN — build a goal + draw your goal
     =================================================================== */
  function garden_build(root, complete) {
    root.appendChild(
      bilingual(
        "Plant a goal! Pick ONE goal. Then pick THREE steps to reach it.",
        "¡Planta una meta! Elige UNA meta. Luego elige TRES pasos para lograrla.",
      ),
    );
    var goals = [
      { ic: "📚", en: "Read every day", es: "Leer cada día" },
      { ic: "💧", en: "Drink more water", es: "Tomar más agua" },
      { ic: "🏃", en: "Move my body", es: "Mover mi cuerpo" },
      { ic: "😴", en: "Get good sleep", es: "Dormir bien" },
    ];
    var steps = [
      { ic: "📅", en: "Pick a time each day", es: "Elige una hora cada día" },
      { ic: "👀", en: "Make it easy to see", es: "Hazla fácil de ver" },
      { ic: "🙌", en: "Ask family to help", es: "Pide ayuda a tu familia" },
      { ic: "✅", en: "Check it off when done", es: "Márcala cuando termines" },
      { ic: "🎯", en: "Start small", es: "Empieza con poco" },
      { ic: "🎉", en: "Celebrate my wins", es: "Celebra tus logros" },
    ];
    var chosenGoal = null,
      chosenSteps = [];
    root.appendChild(
      el("p", {
        cls: "prompt",
        html: "<strong>1) Pick your goal · Elige tu meta</strong>",
      }),
    );
    var goalRow = el("div", { cls: "pickrow" });
    goals.forEach(function (g) {
      var b = el("button", {
        cls: "opt",
        attrs: { type: "button", "aria-pressed": "false" },
      });
      b.innerHTML = '<span aria-hidden="true">' + g.ic + "</span> " + g.en;
      b.appendChild(sayBtn(g.en, g.es));
      b.addEventListener("click", function () {
        goalRow.querySelectorAll(".opt").forEach(function (o) {
          o.setAttribute("aria-pressed", "false");
        });
        b.setAttribute("aria-pressed", "true");
        chosenGoal = g;
        checkReady();
      });
      goalRow.appendChild(b);
    });
    root.appendChild(goalRow);
    root.appendChild(
      el("p", {
        cls: "prompt",
        html: "<strong>2) Pick 3 steps · Elige 3 pasos</strong>",
      }),
    );
    var stepRow = el("div", { cls: "pickrow" });
    steps.forEach(function (s) {
      var b = el("button", {
        cls: "opt",
        attrs: { type: "button", "aria-pressed": "false" },
      });
      b.innerHTML = '<span aria-hidden="true">' + s.ic + "</span> " + s.en;
      b.appendChild(sayBtn(s.en, s.es));
      b.addEventListener("click", function () {
        var on = b.getAttribute("aria-pressed") === "true";
        if (on) {
          b.setAttribute("aria-pressed", "false");
          chosenSteps = chosenSteps.filter(function (x) {
            return x !== s;
          });
        } else {
          if (chosenSteps.length >= 3) return;
          b.setAttribute("aria-pressed", "true");
          chosenSteps.push(s);
        }
        checkReady();
      });
      stepRow.appendChild(b);
    });
    root.appendChild(stepRow);
    var goBtn = el("button", {
      cls: "btn primary",
      text: "🌷 Grow my goal! · ¡Hacer crecer mi meta!",
      attrs: { disabled: "true" },
    });
    var goalCard = el("div", { cls: "goal-card" });
    root.appendChild(goBtn);
    root.appendChild(goalCard);
    function checkReady() {
      if (chosenGoal && chosenSteps.length === 3)
        goBtn.removeAttribute("disabled");
      else goBtn.setAttribute("disabled", "true");
    }
    goBtn.addEventListener("click", function () {
      if (!chosenGoal || chosenSteps.length !== 3) return;
      var html =
        "<p style='margin:0 0 6px'><strong>🌻 My goal:</strong> " +
        chosenGoal.ic +
        " " +
        chosenGoal.en +
        "</p>";
      html += "<ol style='margin:6px 0 0;padding-left:22px'>";
      chosenSteps.forEach(function (s) {
        html += "<li>" + s.ic + " " + s.en + "</li>";
      });
      html += "</ol>";
      goalCard.innerHTML = html;
      goalCard.classList.add("show");
      goalCard.appendChild(
        sayBtn(
          "My goal is to " +
            chosenGoal.en +
            ". My three steps are: " +
            chosenSteps
              .map(function (s) {
                return s.en;
              })
              .join(", ") +
            ".",
          "Mi meta es " + chosenGoal.es + ".",
        ),
      );
      goBtn.setAttribute("disabled", "true");
      complete();
    });
  }

  function garden_draw(root, complete) {
    root.appendChild(
      bilingual(
        "Draw a picture of YOUR goal! Use colors and stamps. Then save it.",
        "¡Dibuja una imagen de TU meta! Usa colores y sellos. Luego guárdala.",
      ),
    );
    var tool = canvasDrawTool(
      root,
      {
        label: "Draw your goal",
        stamps: ["⭐", "🎯", "📚", "💧", "🏃", "😴", "❤️", "🌟"],
      },
      null,
    );
    makeActions(
      root,
      tool.canvas,
      "my-goal.png",
      complete,
      "I drew my goal! · ¡Dibujé mi meta!",
    );
  }

  /* ===================================================================
     STOP: CAFÉ — sort (original) + design-a-plate + quiz
     =================================================================== */
  function buildCafe(root, complete) {
    root.appendChild(
      bilingual(
        "Sort each card. Healthy choices go in the green plate. Less-healthy go in the gray plate.",
        "Clasifica cada tarjeta. Las opciones sanas van en el plato verde. Las menos sanas en el plato gris.",
      ),
    );
    root.appendChild(
      el("p", {
        cls: "hint",
        text: "Tip: drag a card, OR tap a card then tap a plate. · Consejo: arrastra, o toca una tarjeta y luego un plato.",
      }),
    );
    var items = [
      { ic: "🍎", en: "Apple", healthy: true },
      { ic: "💧", en: "Water", healthy: true },
      { ic: "🥕", en: "Carrots", healthy: true },
      { ic: "🛌", en: "Good sleep", healthy: true },
      { ic: "🍭", en: "Lots of candy", healthy: false },
      { ic: "🥤", en: "Soda", healthy: false },
      { ic: "📺", en: "Too much screen", healthy: false },
      { ic: "🍟", en: "Only fries", healthy: false },
    ];
    var tray = el("div", { cls: "tile-grid" });
    var bins = el("div", { cls: "bins" });
    var goodBin = makeBin("Healthy plate", "Plato sano", "🥗", true);
    var badBin = makeBin("Less-healthy plate", "Plato menos sano", "🍩", false);
    bins.appendChild(goodBin.node);
    bins.appendChild(badBin.node);
    var selected = null,
      placedCount = 0;
    var f = feedbackBox();
    items.forEach(function (it, i) {
      var t = el("div", {
        cls: "tile",
        attrs: {
          tabindex: "0",
          role: "button",
          draggable: "true",
          "aria-label": it.en + ". Tap, then tap a plate.",
        },
      });
      t.dataset.healthy = it.healthy ? "1" : "0";
      t.innerHTML =
        '<span class="ic" aria-hidden="true">' + it.ic + "</span>" + it.en;
      t.addEventListener("dragstart", function (e) {
        e.dataTransfer.setData("text/plain", i);
        e.dataTransfer.effectAllowed = "move";
        selected = t;
      });
      t.addEventListener("click", function () {
        selectTile(t);
      });
      t.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          selectTile(t);
        }
      });
      tray.appendChild(t);
    });
    root.appendChild(tray);
    root.appendChild(bins);
    root.appendChild(f);
    function selectTile(t) {
      if (t.classList.contains("placed")) return;
      tray.querySelectorAll(".tile").forEach(function (x) {
        x.classList.remove("selected");
      });
      if (selected === t) {
        selected = null;
        return;
      }
      selected = t;
      t.classList.add("selected");
    }
    function makeBin(en, es, ic, isHealthy) {
      var node = el("div", {
        cls: "bin",
        attrs: { role: "group", "aria-label": en },
      });
      node.innerHTML =
        '<h4><span aria-hidden="true">' +
        ic +
        "</span> " +
        en +
        ' <span style="font-size:.8rem;color:#888">/ ' +
        es +
        "</span></h4>";
      var list = el("div", { cls: "drop-list" });
      node.appendChild(list);
      node.addEventListener("dragover", function (e) {
        e.preventDefault();
        node.classList.add("over");
      });
      node.addEventListener("dragleave", function () {
        node.classList.remove("over");
      });
      node.addEventListener("drop", function (e) {
        e.preventDefault();
        node.classList.remove("over");
        if (selected) place(selected, isHealthy, list);
      });
      node.addEventListener("click", function () {
        if (selected) place(selected, isHealthy, list);
      });
      return { node: node, list: list, isHealthy: isHealthy };
    }
    function place(tile, binHealthy, list) {
      var correct = (tile.dataset.healthy === "1") === binHealthy;
      if (!correct) {
        tile.classList.add("wrong");
        setTimeout(function () {
          tile.classList.remove("wrong");
        }, 450);
        showFeedback(
          f,
          "try",
          "Hmm, try the other plate! Think: does it help my body grow strong?",
          "Mmm, prueba el otro plato. Piensa: ¿ayuda a mi cuerpo a crecer fuerte?",
        );
        return;
      }
      tile.classList.remove("selected");
      tile.classList.add("placed");
      list.appendChild(el("span", { cls: "mini", html: tile.innerHTML }));
      selected = null;
      placedCount++;
      showFeedback(
        f,
        "good",
        "Yes! Good sorting.",
        "¡Sí! Buena clasificación.",
      );
      if (placedCount === items.length) {
        showFeedback(
          f,
          "good",
          "You sorted them all! Healthy choices help us reach our goals.",
          "¡Las clasificaste todas! Las opciones sanas nos ayudan a lograr nuestras metas.",
        );
        complete();
      }
    }
  }

  function cafe_plate(root, complete) {
    root.appendChild(
      bilingual(
        "Design a healthy plate! Drag at least 4 foods onto the plate. Add fruits, veggies, and water.",
        "¡Diseña un plato sano! Arrastra al menos 4 comidas al plato. Agrega frutas, verduras y agua.",
      ),
    );
    root.appendChild(
      el("p", {
        cls: "hint",
        text: "Tip: drag a food, OR tap a food then tap the plate. · Consejo: arrastra, o toca una comida y luego el plato.",
      }),
    );
    var foods = [
      { ic: "🍎", en: "Apple" },
      { ic: "🥦", en: "Broccoli" },
      { ic: "🥕", en: "Carrot" },
      { ic: "🍌", en: "Banana" },
      { ic: "🐟", en: "Fish" },
      { ic: "🍚", en: "Rice" },
      { ic: "🥚", en: "Egg" },
      { ic: "💧", en: "Water" },
      { ic: "🍇", en: "Grapes" },
      { ic: "🥗", en: "Salad" },
      { ic: "🧀", en: "Cheese" },
      { ic: "🍅", en: "Tomato" },
    ];
    var stage = el("div", { cls: "plate-stage" });
    var tray = el("div", { cls: "food-tray" });
    var plate = el("div", {
      cls: "plate",
      attrs: { role: "group", "aria-label": "Your plate · Tu plato" },
    });
    var hint = el("div", {
      cls: "plate-hint",
      text: "Drop foods here! · ¡Pon comida aquí!",
    });
    plate.appendChild(hint);
    var selected = null,
      count = 0;
    foods.forEach(function (food, i) {
      var c = el("button", {
        cls: "food-chip",
        attrs: { type: "button", draggable: "true", "aria-label": food.en },
      });
      c.innerHTML = food.ic + "<small>" + food.en + "</small>";
      c.dataset.ic = food.ic;
      c.addEventListener("dragstart", function (e) {
        e.dataTransfer.setData("text/plain", i);
        selected = c;
      });
      c.addEventListener("click", function () {
        tray.querySelectorAll(".food-chip").forEach(function (x) {
          x.classList.remove("selected");
        });
        if (selected === c) {
          selected = null;
          return;
        }
        selected = c;
        c.classList.add("selected");
      });
      tray.appendChild(c);
    });
    plate.addEventListener("dragover", function (e) {
      e.preventDefault();
      plate.classList.add("over");
    });
    plate.addEventListener("dragleave", function () {
      plate.classList.remove("over");
    });
    plate.addEventListener("drop", function (e) {
      e.preventDefault();
      plate.classList.remove("over");
      if (selected) addFood();
    });
    plate.addEventListener("click", function () {
      if (selected) addFood();
    });
    var f = feedbackBox();
    var doneBtn = el("button", {
      cls: "btn primary",
      text: "🍽️ My plate is ready! · ¡Mi plato está listo!",
      attrs: { disabled: "true" },
    });
    function addFood() {
      if (hint.parentNode) hint.remove();
      var s = el("span", { cls: "dropped", text: selected.dataset.ic });
      plate.appendChild(s);
      selected.classList.remove("selected");
      selected = null;
      count++;
      showFeedback(
        f,
        "good",
        "Yum! Added to your plate.",
        "¡Rico! Lo agregaste a tu plato.",
      );
      if (count >= 4) doneBtn.removeAttribute("disabled");
    }
    stage.appendChild(tray);
    stage.appendChild(plate);
    root.appendChild(stage);
    root.appendChild(f);
    root.appendChild(doneBtn);
    doneBtn.addEventListener("click", function () {
      doneBtn.disabled = true;
      showFeedback(
        f,
        "good",
        "What a colorful, healthy plate! Eating colors helps you grow strong.",
        "¡Qué plato tan colorido y sano! Comer colores te ayuda a crecer fuerte.",
      );
      complete();
    });
  }

  function cafe_quiz(root, complete) {
    quizSet(root, complete, [
      {
        q: "Which drink is the healthiest choice?",
        qEs: "¿Cuál bebida es la opción más sana?",
        opts: [
          { en: "💧 Water", ok: true },
          { en: "🥤 Soda", ok: false },
          { en: "🧋 Sugary drink", ok: false },
        ],
      },
      {
        q: "How should you fill most of your plate?",
        qEs: "¿Con qué debes llenar la mayor parte de tu plato?",
        opts: [
          { en: "🍟 Only fries", ok: false },
          { en: "🥦🍎 Fruits and vegetables", ok: true },
          { en: "🍭 Candy", ok: false },
        ],
      },
    ]);
  }

  /* ===================================================================
     STOP: FEELINGS — name (original) + calm toolbox + poster maker
     =================================================================== */
  function buildFeelings(root, complete) {
    root.appendChild(
      bilingual(
        "Read each little story. Tap the feeling that matches. Then see a calm-down idea!",
        "Lee cada cuento corto. Toca el sentimiento que va. ¡Luego mira una idea para calmarte!",
      ),
    );
    var rounds = [
      {
        story: "Maria worked hard and finished her reading goal.",
        storyEs: "María se esforzó y terminó su meta de lectura.",
        answer: "proud",
        tip: "When you feel proud, smile and say: 'I did it!'",
        tipEs: "Cuando te sientes orgulloso, sonríe y di: '¡Lo logré!'",
      },
      {
        story: "Sam lost the game and feels upset inside.",
        storyEs: "Sam perdió el juego y se siente molesto.",
        answer: "frustrated",
        tip: "When you feel frustrated, take 3 slow breaths. Breathe in... and out.",
        tipEs:
          "Cuando te sientes frustrado, respira 3 veces despacio. Inhala... y exhala.",
      },
      {
        story: "It is the first day at a new school. Lin's tummy feels jumpy.",
        storyEs:
          "Es el primer día en una escuela nueva. A Lin le tiembla la pancita.",
        answer: "nervous",
        tip: "When you feel nervous, find one friendly face and say hello.",
        tipEs: "Cuando estás nervioso, busca una cara amable y saluda.",
      },
    ];
    var feelings = [
      { id: "proud", ic: "😄", en: "Proud", es: "Orgulloso" },
      { id: "frustrated", ic: "😣", en: "Frustrated", es: "Frustrado" },
      { id: "nervous", ic: "😟", en: "Nervous", es: "Nervioso" },
    ];
    var idx = 0;
    var area = el("div");
    root.appendChild(area);
    var f = feedbackBox();
    root.appendChild(f);
    renderRound();
    function renderRound() {
      area.innerHTML = "";
      var r = rounds[idx];
      var p = el("div", { cls: "passage" });
      p.appendChild(el("span", { text: r.story }));
      p.appendChild(sayBtn(r.story, r.storyEs));
      p.appendChild(
        el("p", {
          text: r.storyEs,
          attrs: {
            style:
              "margin:6px 0 0;color:#7c5cbf;font-style:italic;font-size:.95rem",
          },
        }),
      );
      area.appendChild(p);
      area.appendChild(
        el("p", {
          cls: "prompt",
          html: "<strong>How does this person feel? · ¿Cómo se siente?</strong>",
        }),
      );
      var grid = el("div", { cls: "tile-grid" });
      feelings.forEach(function (fe) {
        var b = el("button", {
          cls: "tile",
          attrs: { type: "button", "aria-label": fe.en },
        });
        b.innerHTML =
          '<span class="ic" aria-hidden="true">' +
          fe.ic +
          "</span>" +
          fe.en +
          '<br><span style="font-size:.8rem;color:#7c5cbf">' +
          fe.es +
          "</span>";
        b.addEventListener("click", function () {
          pick(fe, b, grid);
        });
        grid.appendChild(b);
      });
      area.appendChild(grid);
      f.className = "feedback";
    }
    function pick(fe, btn, grid) {
      var r = rounds[idx];
      if (fe.id === r.answer) {
        btn.classList.add("matched");
        grid.querySelectorAll(".tile").forEach(function (t) {
          t.disabled = true;
        });
        showFeedback(f, "good", "Yes! " + r.tip, "¡Sí! " + r.tipEs);
        idx++;
        if (idx >= rounds.length) {
          setTimeout(function () {
            showFeedback(
              f,
              "good",
              "You named every feeling! Naming feelings helps us calm down.",
              "¡Nombraste cada sentimiento! Nombrar lo que sentimos nos ayuda a calmarnos.",
            );
            complete();
          }, 1200);
        } else {
          var nb = el("button", {
            cls: "btn primary",
            text: "Next story · Siguiente cuento",
          });
          nb.style.marginTop = "10px";
          nb.addEventListener("click", function () {
            renderRound();
          });
          f.appendChild(nb);
        }
      } else {
        btn.classList.add("wrong");
        setTimeout(function () {
          btn.classList.remove("wrong");
        }, 450);
        showFeedback(
          f,
          "try",
          "Read the story again. How is the body feeling?",
          "Lee el cuento otra vez. ¿Cómo se siente el cuerpo?",
        );
      }
    }
  }

  function forest_calm(root, complete) {
    root.appendChild(
      bilingual(
        "Big feelings? Try a calm-down tool. Tap one and do it. Then tap 'I tried it'.",
        "¿Sentimiento grande? Prueba una herramienta para calmarte. Toca una y hazla. Luego toca 'Lo intenté'.",
      ),
    );
    var tools = [
      {
        ic: "🌬️",
        en: "Breathe slowly 3 times",
        es: "Respira despacio 3 veces",
      },
      { ic: "🐢", en: "Count to ten", es: "Cuenta hasta diez" },
      { ic: "🤗", en: "Hug yourself tight", es: "Date un abrazo fuerte" },
      { ic: "💧", en: "Drink some water", es: "Toma agua" },
      { ic: "🚶", en: "Take a quiet walk", es: "Da un paseo tranquilo" },
      { ic: "🗣️", en: "Tell a grown-up", es: "Dile a un adulto" },
    ];
    var grid = el("div", { cls: "tile-grid" });
    var tried = 0;
    var f = feedbackBox();
    tools.forEach(function (t) {
      var b = el("button", {
        cls: "tile",
        attrs: { type: "button", "aria-label": t.en },
      });
      b.innerHTML =
        '<span class="ic" aria-hidden="true">' +
        t.ic +
        "</span>" +
        t.en +
        '<br><span style="font-size:.78rem;color:#7c5cbf">' +
        t.es +
        "</span>";
      b.appendChild(sayBtn(t.en, t.es));
      b.addEventListener("click", function () {
        if (b.classList.contains("matched")) return;
        b.classList.add("matched");
        tried++;
        if (tried < 2) {
          showFeedback(
            f,
            "good",
            "Nice! Try one more tool.",
            "¡Bien! Prueba una herramienta más.",
          );
        } else if (tried === 2) {
          showFeedback(
            f,
            "good",
            "You found calm-down tools that work for you! Use them anytime.",
            "¡Encontraste herramientas que te sirven! Úsalas cuando quieras.",
          );
          complete();
        }
      });
      grid.appendChild(b);
    });
    root.appendChild(grid);
    root.appendChild(f);
  }

  function forest_poster(root, complete) {
    root.appendChild(
      bilingual(
        "Make a feelings poster! Type a title and add feeling stickers. When it has 3 stickers, save it.",
        "¡Haz un cartel de sentimientos! Escribe un título y agrega caritas. Cuando tenga 3, guárdalo.",
      ),
    );
    var poster = el("div", { cls: "poster" });
    var title = el("input", {
      cls: "poster-title",
      attrs: {
        type: "text",
        value: "My Feelings",
        maxlength: "28",
        "aria-label": "Poster title · Título del cartel",
      },
    });
    var canvasArea = el("div", { cls: "poster-canvas" });
    poster.appendChild(title);
    poster.appendChild(canvasArea);
    var stickers = ["😄", "😢", "😣", "😟", "😴", "😮", "🥰", "😎", "🤗", "😌"];
    var palette = el("div", {
      cls: "stamp-row",
      attrs: { style: "margin:10px 0" },
    });
    var count = 0;
    var f = feedbackBox();
    stickers.forEach(function (s) {
      var b = el("button", {
        cls: "stamp-btn",
        attrs: { type: "button", "aria-label": "Add " + s },
        text: s,
      });
      b.addEventListener("click", function () {
        canvasArea.appendChild(el("span", { cls: "sticker", text: s }));
        count++;
        if (count === 3) {
          showFeedback(
            f,
            "good",
            "Great poster! You can add more or save it.",
            "¡Buen cartel! Puedes agregar más o guardarlo.",
          );
        }
      });
      palette.appendChild(b);
    });
    root.appendChild(
      el("p", {
        cls: "prompt",
        html: "<strong>Add stickers · Agrega caritas</strong>",
      }),
    );
    root.appendChild(palette);
    root.appendChild(poster);
    root.appendChild(f);
    var actions = el("div", { cls: "make-actions" });
    var saveBtn = el("button", {
      cls: "btn primary",
      text: "💾 Save my poster · Guardar mi cartel",
      attrs: { disabled: "true" },
    });
    var doneBtn = el("button", {
      cls: "btn ghost",
      text: "✅ I made it! · ¡Lo hice!",
      attrs: { disabled: "true" },
    });
    function refresh() {
      if (count >= 3) {
        saveBtn.removeAttribute("disabled");
        doneBtn.removeAttribute("disabled");
      }
    }
    var obs = setInterval(refresh, 300);
    saveBtn.addEventListener("click", function () {
      posterToPng(title.value, canvasArea, "my-feelings-poster.png");
    });
    doneBtn.addEventListener("click", function () {
      clearInterval(obs);
      doneBtn.disabled = true;
      complete();
    });
    actions.appendChild(saveBtn);
    actions.appendChild(doneBtn);
    actions.appendChild(
      el("span", {
        cls: "make-note",
        text: "Saving downloads a picture you can print. · Guardar descarga una imagen para imprimir.",
      }),
    );
    root.appendChild(actions);
  }

  /* Render a poster (title + emoji stickers) to a canvas PNG and download. */
  function posterToPng(title, canvasArea, filename) {
    var c = el("canvas", { attrs: { width: "640", height: "420" } });
    var ctx = c.getContext("2d");
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, 640, 420);
    ctx.strokeStyle = "#7c5cbf";
    ctx.lineWidth = 8;
    ctx.setLineDash([16, 10]);
    ctx.strokeRect(14, 14, 612, 392);
    ctx.setLineDash([]);
    ctx.fillStyle = "#7c5cbf";
    ctx.font = "bold 34px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(title || "My Feelings", 320, 64);
    var stickers = canvasArea.querySelectorAll(".sticker");
    ctx.font = "56px serif";
    ctx.textBaseline = "middle";
    var perRow = 5;
    stickers.forEach(function (s, i) {
      var col = i % perRow,
        row = Math.floor(i / perRow);
      var x = 110 + col * 110,
        y = 150 + row * 90;
      ctx.fillText(s.textContent, x, y);
    });
    downloadCanvas(c, filename);
  }

  /* ===================================================================
     STOP: CROSSROADS — two scenarios + choice comic
     =================================================================== */
  function buildCrossroads(root, complete) {
    buildBranching(root, complete, {
      en: "You see trash on the playground floor. What is the responsible choice?",
      es: "Ves basura en el patio. ¿Cuál es la decisión responsable?",
      choices: [
        {
          ic: "🗑️",
          en: "Pick it up and put it in the bin.",
          good: true,
          fbEn: "Great choice! Taking care of our space is responsible. It helps everyone.",
          fbEs: "¡Buena decisión! Cuidar nuestro espacio es responsable. Ayuda a todos.",
        },
        {
          ic: "🙈",
          en: "Walk away and ignore it.",
          good: false,
          fbEn: "Hmm. If we all walk away, the mess stays. A responsible friend helps clean up.",
          fbEs: "Mmm. Si todos nos vamos, el desorden queda. Un amigo responsable ayuda a limpiar.",
        },
        {
          ic: "👉",
          en: "Kick it to someone else.",
          good: false,
          fbEn: "That makes a bigger mess. The responsible choice helps, not hurts.",
          fbEs: "Eso hace más desorden. La decisión responsable ayuda, no estorba.",
        },
      ],
    });
  }
  function cross_book(root, complete) {
    buildBranching(root, complete, {
      en: "Your friend lent you a book and it got torn. What is the responsible choice?",
      es: "Tu amigo te prestó un libro y se rompió. ¿Cuál es la decisión responsable?",
      choices: [
        {
          ic: "🗣️",
          en: "Tell your friend the truth and say sorry.",
          good: true,
          fbEn: "Yes! Being honest and saying sorry is responsible. You can fix it together.",
          fbEs: "¡Sí! Ser honesto y pedir perdón es responsable. Pueden arreglarlo juntos.",
        },
        {
          ic: "🤫",
          en: "Hide it and say nothing.",
          good: false,
          fbEn: "Hiding it can hurt trust. A responsible friend tells the truth, even when it is hard.",
          fbEs: "Esconderlo puede dañar la confianza. Un amigo responsable dice la verdad, aunque sea difícil.",
        },
        {
          ic: "😠",
          en: "Blame someone else.",
          good: false,
          fbEn: "Blaming is not fair. Responsible means owning what happened and making it right.",
          fbEs: "Culpar no es justo. Ser responsable es aceptar lo que pasó y arreglarlo.",
        },
      ],
    });
  }

  function cross_comic(root, complete) {
    comicBuilder(root, complete, {
      titleEn:
        "Build a 'good choice' comic! Pick a picture and a sentence for each box.",
      titleEs:
        "¡Haz un cómic de buena decisión! Elige un dibujo y una oración para cada cuadro.",
      panels: [
        {
          label: "1. The problem · El problema",
          scenes: ["🧒", "🚦", "🗑️", "📚"],
          lines: [
            "Uh oh, a problem!",
            "I see something wrong.",
            "What should I do?",
          ],
        },
        {
          label: "2. I think · Yo pienso",
          scenes: ["🤔", "💭", "🧠"],
          lines: ["Is it kind?", "Is it safe?", "Is it fair?"],
        },
        {
          label: "3. Good choice · Buena decisión",
          scenes: ["✅", "🤝", "🧹", "😊"],
          lines: [
            "I made a good choice!",
            "I helped!",
            "I did the right thing.",
          ],
        },
      ],
      filename: "my-choice-comic.png",
    });
  }

  function buildBranching(root, complete, data) {
    root.appendChild(bilingual(data.en, data.es));
    var prompt = el("div", { cls: "passage" });
    prompt.appendChild(el("span", { text: data.en }));
    prompt.appendChild(sayBtn(data.en, data.es));
    root.appendChild(prompt);
    var choices = el("div", { cls: "choices" });
    var f = feedbackBox();
    var resolved = false;
    data.choices.forEach(function (c) {
      var b = el("button", { cls: "choice", attrs: { type: "button" } });
      b.innerHTML =
        '<span class="ic" aria-hidden="true">' +
        c.ic +
        "</span><span>" +
        c.en +
        "</span>";
      b.appendChild(sayBtn(c.en, null));
      b.addEventListener("click", function () {
        choices.querySelectorAll(".choice").forEach(function (x) {
          x.classList.remove("good", "meh");
        });
        b.classList.add(c.good ? "good" : "meh");
        showFeedback(f, c.good ? "good" : "try", c.fbEn, c.fbEs);
        if (c.good && !resolved) {
          resolved = true;
          choices.querySelectorAll(".choice").forEach(function (x) {
            x.disabled = true;
          });
          complete();
        }
      });
      choices.appendChild(b);
    });
    root.appendChild(choices);
    root.appendChild(f);
  }

  /* Reusable comic builder: pick scene + sentence per panel, then save PNG. */
  function comicBuilder(root, complete, data) {
    root.appendChild(bilingual(data.titleEn, data.titleEs));
    var strip = el("div", { cls: "comic-strip" });
    var picks = [];
    data.panels.forEach(function (p, i) {
      var panel = el("div", { cls: "comic-panel" });
      panel.appendChild(el("div", { cls: "panel-num", text: p.label }));
      var scene = el("div", {
        cls: "panel-scene",
        attrs: {
          role: "button",
          tabindex: "0",
          "aria-label": "Pick a picture",
        },
        text: "＋",
      });
      var sceneIdx = 0;
      function cycleScene() {
        picks[i].scene = p.scenes[sceneIdx % p.scenes.length];
        scene.textContent = picks[i].scene;
        sceneIdx++;
      }
      scene.addEventListener("click", cycleScene);
      scene.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          cycleScene();
        }
      });
      panel.appendChild(scene);
      var sel = el("select", { attrs: { "aria-label": "Pick a sentence" } });
      sel.appendChild(
        el("option", { text: "Pick a sentence…", attrs: { value: "" } }),
      );
      p.lines.forEach(function (line) {
        sel.appendChild(el("option", { text: line, attrs: { value: line } }));
      });
      var bubble = el("div", { cls: "bubble", text: "…" });
      sel.addEventListener("change", function () {
        picks[i].line = sel.value;
        bubble.textContent = sel.value || "…";
        check();
      });
      panel.appendChild(sel);
      panel.appendChild(bubble);
      strip.appendChild(panel);
      picks.push({ scene: "", line: "" });
    });
    root.appendChild(strip);
    var f = feedbackBox();
    root.appendChild(f);
    var actions = el("div", { cls: "make-actions" });
    var saveBtn = el("button", {
      cls: "btn primary",
      text: "💾 Save my comic · Guardar mi cómic",
      attrs: { disabled: "true" },
    });
    var doneBtn = el("button", {
      cls: "btn ghost",
      text: "✅ My comic is done! · ¡Mi cómic está listo!",
      attrs: { disabled: "true" },
    });
    actions.appendChild(saveBtn);
    actions.appendChild(doneBtn);
    actions.appendChild(
      el("span", {
        cls: "make-note",
        text: "Pick a picture and a sentence in every box. · Elige dibujo y oración en cada cuadro.",
      }),
    );
    root.appendChild(actions);
    function check() {
      var ready = picks.every(function (p) {
        return p.scene && p.line;
      });
      if (ready) {
        saveBtn.removeAttribute("disabled");
        doneBtn.removeAttribute("disabled");
      }
    }
    /* also enable once a scene is set on each — re-check on scene clicks */
    strip.addEventListener("click", check);
    saveBtn.addEventListener("click", function () {
      comicToPng(data.panels, picks, data.filename);
    });
    doneBtn.addEventListener("click", function () {
      doneBtn.disabled = true;
      showFeedback(
        f,
        "good",
        "Awesome comic! You showed a good choice from start to end.",
        "¡Gran cómic! Mostraste una buena decisión de principio a fin.",
      );
      complete();
    });
  }

  function comicToPng(panels, picks, filename) {
    var n = panels.length;
    var pw = 220,
      ph = 240,
      gap = 16;
    var c = el("canvas", {
      attrs: {
        width: String(n * pw + (n + 1) * gap),
        height: String(ph + gap * 2),
      },
    });
    var ctx = c.getContext("2d");
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, c.width, c.height);
    for (var i = 0; i < n; i++) {
      var x = gap + i * (pw + gap),
        y = gap;
      ctx.strokeStyle = "#213547";
      ctx.lineWidth = 5;
      ctx.strokeRect(x, y, pw, ph);
      ctx.font = "84px serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(picks[i].scene || "", x + pw / 2, y + 90);
      ctx.fillStyle = "#fff8e9";
      ctx.fillRect(x + 14, y + 160, pw - 28, 64);
      ctx.strokeStyle = "#ffb627";
      ctx.lineWidth = 3;
      ctx.strokeRect(x + 14, y + 160, pw - 28, 64);
      ctx.fillStyle = "#213547";
      ctx.font = "18px sans-serif";
      wrapText(ctx, picks[i].line || "", x + pw / 2, y + 186, pw - 40, 22);
    }
    downloadCanvas(c, filename);
  }
  function wrapText(ctx, text, cx, y, maxW, lh) {
    var words = String(text).split(" "),
      line = "",
      lines = [];
    words.forEach(function (w) {
      var test = line ? line + " " + w : w;
      if (ctx.measureText(test).width > maxW && line) {
        lines.push(line);
        line = w;
      } else line = test;
    });
    if (line) lines.push(line);
    lines.slice(0, 3).forEach(function (ln, i) {
      ctx.fillText(ln, cx, y + i * lh);
    });
  }

  /* ===================================================================
     STOP: MATCH MEADOW — match (original) + fill the sentence
     =================================================================== */
  function buildWordMatch(root, complete) {
    root.appendChild(
      bilingual(
        "Tap a word. Then tap the picture that matches it.",
        "Toca una palabra. Luego toca el dibujo que va con ella.",
      ),
    );
    var pairs = [
      { id: "goal", en: "Goal", es: "Meta", ic: "🎯" },
      { id: "healthy", en: "Healthy", es: "Saludable", ic: "🥗" },
      { id: "kind", en: "Kind", es: "Amable", ic: "🤝" },
      { id: "rest", en: "Rest", es: "Descanso", ic: "😴" },
      { id: "feeling", en: "Feeling", es: "Sentimiento", ic: "😊" },
    ];
    var words = pairs.slice();
    var pics = shuffle(pairs.slice());
    var selectedWord = null,
      matched = 0;
    var f = feedbackBox();
    var cols = el("div", {
      attrs: { style: "display:grid;grid-template-columns:1fr 1fr;gap:14px" },
    });
    var wCol = el("div");
    wCol.appendChild(
      el("p", { cls: "prompt", html: "<strong>Words · Palabras</strong>" }),
    );
    var pCol = el("div");
    pCol.appendChild(
      el("p", { cls: "prompt", html: "<strong>Pictures · Dibujos</strong>" }),
    );
    words.forEach(function (w) {
      var b = el("button", {
        cls: "tile",
        attrs: { type: "button", "aria-label": w.en },
      });
      b.dataset.id = w.id;
      b.style.display = "flex";
      b.style.alignItems = "center";
      b.style.gap = "6px";
      b.style.justifyContent = "center";
      b.style.marginBottom = "10px";
      b.innerHTML =
        "<span>" +
        w.en +
        '<br><span style="font-size:.78rem;color:#7c5cbf">' +
        w.es +
        "</span></span>";
      b.appendChild(sayBtn(w.en, w.es));
      b.addEventListener("click", function () {
        wCol.querySelectorAll(".tile").forEach(function (x) {
          x.classList.remove("selected");
        });
        selectedWord = b;
        b.classList.add("selected");
      });
      wCol.appendChild(b);
    });
    pics.forEach(function (p) {
      var b = el("button", {
        cls: "tile",
        attrs: { type: "button", "aria-label": "Picture for " + p.en },
      });
      b.dataset.id = p.id;
      b.style.marginBottom = "10px";
      b.innerHTML = '<span class="ic" aria-hidden="true">' + p.ic + "</span>";
      b.addEventListener("click", function () {
        if (!selectedWord) {
          showFeedback(
            f,
            "try",
            "First tap a word on the left.",
            "Primero toca una palabra a la izquierda.",
          );
          return;
        }
        if (selectedWord.dataset.id === p.id) {
          selectedWord.classList.add("matched");
          selectedWord.disabled = true;
          b.classList.add("matched");
          b.disabled = true;
          selectedWord = null;
          matched++;
          showFeedback(
            f,
            "good",
            "Match! Nice work.",
            "¡Coincide! Buen trabajo.",
          );
          if (matched === pairs.length) {
            showFeedback(
              f,
              "good",
              "You matched every word! You are a vocabulary star.",
              "¡Emparejaste todas las palabras! Eres una estrella del vocabulario.",
            );
            complete();
          }
        } else {
          b.classList.add("wrong");
          setTimeout(function () {
            b.classList.remove("wrong");
          }, 450);
          showFeedback(
            f,
            "try",
            "Not yet — try another picture.",
            "Todavía no, prueba otro dibujo.",
          );
        }
      });
      pCol.appendChild(b);
    });
    cols.appendChild(wCol);
    cols.appendChild(pCol);
    root.appendChild(cols);
    root.appendChild(f);
  }

  function match_fill(root, complete) {
    quizSet(root, complete, [
      {
        q: "My ____ is to read every day.",
        qEs: "Mi ____ es leer cada día.",
        opts: [
          { en: "🎯 goal", ok: true },
          { en: "🍭 candy", ok: false },
          { en: "📺 TV", ok: false },
        ],
      },
      {
        q: "A ____ friend shares and helps.",
        qEs: "Un amigo ____ comparte y ayuda.",
        opts: [
          { en: "😠 mean", ok: false },
          { en: "🤝 kind", ok: true },
          { en: "😴 sleepy", ok: false },
        ],
      },
      {
        q: "Eating fruit is a ____ choice.",
        qEs: "Comer fruta es una opción ____.",
        opts: [
          { en: "🥗 healthy", ok: true },
          { en: "🍩 less-healthy", ok: false },
        ],
      },
    ]);
  }

  /* ===================================================================
     STOP: MOVE — read + brain-break jumps + plan a play day
     =================================================================== */
  function move_brainbreak(root, complete) {
    root.appendChild(
      bilingual(
        "Time for a brain break! Stand up and do 10 jumps. Tap the button each time you jump.",
        "¡Hora de una pausa! Levántate y haz 10 saltos. Toca el botón cada vez que saltes.",
      ),
    );
    var card = el("div", { cls: "move-card" });
    var emoji = el("div", { cls: "move-emoji", text: "🤸" });
    var count = el("div", { cls: "move-count", text: "0 / 10" });
    card.appendChild(emoji);
    card.appendChild(count);
    var tap = el("button", {
      cls: "btn primary big-tap",
      text: "⬆️ I jumped! · ¡Salté!",
    });
    var f = feedbackBox();
    var n = 0;
    tap.addEventListener("click", function () {
      if (n >= 10) return;
      n++;
      count.textContent = n + " / 10";
      emoji.classList.add("go");
      setTimeout(function () {
        emoji.classList.remove("go");
      }, 500);
      if (n === 5)
        showFeedback(f, "good", "Halfway! Keep going!", "¡A la mitad! ¡Sigue!");
      if (n >= 10) {
        tap.disabled = true;
        emoji.textContent = "🎉";
        showFeedback(
          f,
          "good",
          "10 jumps! Your heart is pumping and your brain is awake. Moving feels good!",
          "¡10 saltos! Tu corazón late y tu cerebro despierta. ¡Moverse se siente bien!",
        );
        complete();
      }
    });
    card
      .appendChild(el("div", { attrs: { style: "margin-top:12px" } }))
      .appendChild(tap);
    root.appendChild(card);
    root.appendChild(f);
  }

  function move_plan(root, complete) {
    root.appendChild(
      bilingual(
        "Plan a play day! Pick 3 ways you will move your body this week.",
        "¡Planea un día de juego! Elige 3 maneras de mover tu cuerpo esta semana.",
      ),
    );
    pickThree(
      root,
      complete,
      [
        { ic: "🏃", en: "Run or race", es: "Correr o competir" },
        { ic: "💃", en: "Dance to music", es: "Bailar con música" },
        { ic: "⚽", en: "Play soccer", es: "Jugar fútbol" },
        { ic: "🚲", en: "Ride a bike", es: "Andar en bici" },
        { ic: "🤾", en: "Play ball games", es: "Jugar con pelota" },
        { ic: "🧘", en: "Stretch and yoga", es: "Estirarse y yoga" },
        { ic: "🏊", en: "Swim", es: "Nadar" },
        { ic: "🦘", en: "Jump rope", es: "Saltar la cuerda" },
      ],
      "🏅 My play plan is ready! · ¡Mi plan de juego está listo!",
      "Awesome plan! Moving every day keeps your body and brain strong.",
      "¡Buen plan! Moverte cada día mantiene fuerte tu cuerpo y cerebro.",
    );
  }

  /* ===================================================================
     STOP: SLEEP — read + order bedtime steps + color the room
     =================================================================== */
  function sleep_order(root, complete) {
    orderSteps(root, complete, {
      en: "These bedtime steps are mixed up. Put them in order: 1, 2, 3, 4.",
      es: "Estos pasos para dormir están mezclados. Ponlos en orden: 1, 2, 3, 4.",
      correct: [
        { ic: "🛁", en: "Take a bath", es: "Báñate" },
        { ic: "🦷", en: "Brush your teeth", es: "Cepíllate los dientes" },
        { ic: "📖", en: "Read a story", es: "Lee un cuento" },
        { ic: "😴", en: "Go to sleep", es: "Ve a dormir" },
      ],
      okEn: "Perfect bedtime order! A calm routine helps you sleep well.",
      okEs: "¡Orden perfecto! Una rutina tranquila te ayuda a dormir bien.",
      tryEn: "Almost! What do you do FIRST, before sleeping?",
      tryEs: "¡Casi! ¿Qué haces PRIMERO, antes de dormir?",
    });
  }

  function sleep_color(root, complete) {
    root.appendChild(
      bilingual(
        "Color the calm bedroom! Pick a color, then tap a part of the picture.",
        "¡Colorea el cuarto tranquilo! Elige un color y toca una parte del dibujo.",
      ),
    );
    var colors = [
      "#ffce3a",
      "#ff6b6b",
      "#3aa3e3",
      "#2e9e5b",
      "#7c5cbf",
      "#ff8fab",
      "#8d6e63",
    ];
    var current = { c: colors[0] };
    var palette = el("div", { cls: "draw-toolbar" });
    colors.forEach(function (c, i) {
      var sw = el("button", {
        cls: "swatch",
        attrs: {
          type: "button",
          "aria-label": "Color " + (i + 1),
          "aria-pressed": i === 0 ? "true" : "false",
          style: "background:" + c,
        },
      });
      sw.addEventListener("click", function () {
        current.c = c;
        palette.querySelectorAll(".swatch").forEach(function (s) {
          s.setAttribute("aria-pressed", "false");
        });
        sw.setAttribute("aria-pressed", "true");
      });
      palette.appendChild(sw);
    });
    root.appendChild(palette);
    var scene = el("div", { cls: "color-scene" });
    scene.innerHTML =
      '<svg viewBox="0 0 400 260" role="img" aria-label="A bedroom to color">' +
      '<rect class="fillable" x="0" y="0" width="400" height="180" fill="#f4f8fb" stroke="#213547" stroke-width="2" data-p="wall"/>' +
      '<rect class="fillable" x="0" y="180" width="400" height="80" fill="#f4f8fb" stroke="#213547" stroke-width="2" data-p="floor"/>' +
      '<rect class="fillable" x="40" y="120" width="170" height="90" rx="10" fill="#ffffff" stroke="#213547" stroke-width="2" data-p="bed"/>' +
      '<rect class="fillable" x="55" y="130" width="60" height="40" rx="8" fill="#ffffff" stroke="#213547" stroke-width="2" data-p="pillow"/>' +
      '<circle class="fillable" cx="320" cy="60" r="34" fill="#ffffff" stroke="#213547" stroke-width="2" data-p="moon"/>' +
      '<polygon class="fillable" points="150,40 158,60 180,60 162,74 168,96 150,82 132,96 138,74 120,60 142,60" fill="#ffffff" stroke="#213547" stroke-width="2" data-p="star"/>' +
      "</svg>";
    var painted = {};
    var f = feedbackBox();
    var doneBtn = el("button", {
      cls: "btn primary",
      text: "🎨 My room is colorful! · ¡Mi cuarto tiene color!",
      attrs: { disabled: "true" },
    });
    scene.querySelectorAll(".fillable").forEach(function (shape) {
      shape.setAttribute("tabindex", "0");
      shape.setAttribute("role", "button");
      function paint() {
        shape.setAttribute("fill", current.c);
        painted[shape.dataset.p] = true;
        if (Object.keys(painted).length >= 3)
          doneBtn.removeAttribute("disabled");
      }
      shape.addEventListener("click", paint);
      shape.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          paint();
        }
      });
    });
    root.appendChild(scene);
    var actions = el("div", { cls: "make-actions" });
    var saveBtn = el("button", {
      cls: "tool-btn",
      text: "💾 Save picture · Guardar dibujo",
    });
    saveBtn.addEventListener("click", function () {
      svgToPng(scene.querySelector("svg"), "my-calm-room.png");
    });
    actions.appendChild(doneBtn);
    actions.appendChild(saveBtn);
    root.appendChild(actions);
    root.appendChild(f);
    doneBtn.addEventListener("click", function () {
      doneBtn.disabled = true;
      showFeedback(
        f,
        "good",
        "Beautiful! A cozy, calm room helps you rest.",
        "¡Hermoso! Un cuarto acogedor y tranquilo te ayuda a descansar.",
      );
      complete();
    });
  }

  /* ===================================================================
     STOP: STEPS — read + order (original) + draw your goal path
     =================================================================== */
  function buildOrderSteps(root, complete) {
    orderSteps(root, complete, {
      en: "These steps to reach a goal are mixed up. Put them in order: 1, 2, 3, 4. Use the arrows or drag.",
      es: "Estos pasos para lograr una meta están mezclados. Ponlos en orden: 1, 2, 3, 4. Usa las flechas o arrastra.",
      correct: [
        { ic: "💡", en: "Choose a goal", es: "Elige una meta" },
        { ic: "📝", en: "Make a small plan", es: "Haz un plan pequeño" },
        {
          ic: "💪",
          en: "Try a little every day",
          es: "Intenta un poco cada día",
        },
        {
          ic: "🎉",
          en: "Celebrate when you do it",
          es: "Celebra cuando lo logres",
        },
      ],
      okEn: "Perfect order! That is how we reach a goal: choose, plan, try, celebrate.",
      okEs: "¡Orden perfecto! Así se logra una meta: elegir, planear, intentar, celebrar.",
      tryEn:
        "Almost! Think about what comes FIRST. You choose the goal before you plan.",
      tryEs: "¡Casi! Piensa qué va PRIMERO. Eliges la meta antes de planear.",
    });
  }

  function steps_map(root, complete) {
    root.appendChild(
      bilingual(
        "Draw your goal path! Draw a road, a starting point, and the prize at the end.",
        "¡Dibuja tu camino de meta! Dibuja un camino, un inicio y el premio al final.",
      ),
    );
    var tool = canvasDrawTool(
      root,
      {
        label: "Draw your goal path",
        stamps: ["🏁", "🎯", "⭐", "🪜", "💪", "🎉", "➡️", "🚶"],
        guide: function (ctx, c) {
          ctx.strokeStyle = "#d7e7e0";
          ctx.lineWidth = 2;
          ctx.setLineDash([8, 8]);
          ctx.beginPath();
          ctx.moveTo(20, c.height - 30);
          ctx.lineTo(c.width - 20, 40);
          ctx.stroke();
          ctx.setLineDash([]);
          ctx.fillStyle = "#9bb3aa";
          ctx.font = "16px sans-serif";
          ctx.fillText("Start", 20, c.height - 8);
          ctx.fillText("Goal!", c.width - 60, 30);
        },
      },
      null,
    );
    makeActions(
      root,
      tool.canvas,
      "my-goal-path.png",
      complete,
      "I drew my path! · ¡Dibujé mi camino!",
    );
  }

  /* ===================================================================
     STOP: STORY POND — read+answer (original) + retell + draw best part
     =================================================================== */
  function buildReading(root, complete) {
    root.appendChild(
      bilingual(
        "Read the short story. Press 🔊 to hear it. Then answer the questions.",
        "Lee el cuento corto. Presiona 🔊 para escucharlo. Luego responde las preguntas.",
      ),
    );
    var storyEn =
      'Diego wanted to ride his bike all by himself. It felt hard at first. He made a plan. Every day after school, he practiced for ten minutes. Some days he wobbled and fell. He took a deep breath and tried again. After two weeks, Diego rode all the way to the park! He felt so proud. "A goal takes time and trying," he said.';
    var storyEs =
      "Diego quería andar en bici solito. Al principio fue difícil. Hizo un plan. Cada día después de la escuela, practicaba diez minutos. Algunos días se tambaleaba y se caía. Respiraba hondo e intentaba otra vez. ¡Después de dos semanas, Diego llegó hasta el parque! Se sintió muy orgulloso.";
    var p = el("div", { cls: "passage" });
    p.appendChild(el("span", { text: storyEn }));
    var sayRow = el("div", {
      attrs: {
        style: "margin-top:8px;display:flex;gap:8px;align-items:center",
      },
    });
    var sEn = sayBtn(storyEn, null);
    sEn.title = "Read in English";
    var sEs = sayBtn(storyEs, null);
    sEs.title = "Leer en español";
    sayRow.appendChild(
      el("span", { text: "🔊 ", attrs: { "aria-hidden": "true" } }),
    );
    sayRow.appendChild(sEn);
    sayRow.appendChild(el("span", { text: "English" }));
    sayRow.appendChild(sEs);
    sayRow.appendChild(el("span", { text: "Español" }));
    p.appendChild(sayRow);
    root.appendChild(p);
    var qs = [
      {
        q: "What goal did Diego have?",
        qEs: "¿Qué meta tenía Diego?",
        opts: [
          { en: "To ride his bike by himself", ok: true },
          { en: "To win a race", ok: false },
          { en: "To buy a new bike", ok: false },
        ],
        bankEn: "ride · bike · by himself",
      },
      {
        q: "What did Diego do when he fell?",
        qEs: "¿Qué hizo Diego cuando se cayó?",
        opts: [
          { en: "He gave up", ok: false },
          { en: "He took a deep breath and tried again", ok: true },
          { en: "He went home for the day", ok: false },
        ],
        bankEn: "deep breath · tried again",
      },
      {
        q: "How did Diego feel at the end?",
        qEs: "¿Cómo se sintió Diego al final?",
        opts: [
          { en: "Proud", ok: true },
          { en: "Angry", ok: false },
          { en: "Bored", ok: false },
        ],
        bankEn: "proud · happy with himself",
      },
    ];
    var qi = 0;
    var area = el("div");
    var f = feedbackBox();
    root.appendChild(area);
    root.appendChild(f);
    renderQ();
    function renderQ() {
      area.innerHTML = "";
      var item = qs[qi];
      var prompt = el("p", { cls: "prompt" });
      prompt.appendChild(el("strong", { text: qi + 1 + ") " + item.q }));
      prompt.appendChild(sayBtn(item.q, item.qEs));
      area.appendChild(prompt);
      area.appendChild(
        el("p", {
          text: item.qEs,
          attrs: { style: "margin:-6px 0 6px;color:#7c5cbf;font-style:italic" },
        }),
      );
      var choices = el("div", { cls: "choices" });
      item.opts.forEach(function (o) {
        var b = el("button", { cls: "choice", attrs: { type: "button" } });
        b.innerHTML =
          '<span class="ic" aria-hidden="true">🔘</span><span>' +
          o.en +
          "</span>";
        b.appendChild(sayBtn(o.en, null));
        b.addEventListener("click", function () {
          if (o.ok) {
            b.classList.add("good");
            choices.querySelectorAll(".choice").forEach(function (x) {
              x.disabled = true;
            });
            qi++;
            if (qi >= qs.length) {
              showFeedback(
                f,
                "good",
                "You answered them all! Great reading. Goals take time and trying — just like Diego.",
                "¡Respondiste todas! Buena lectura. Las metas toman tiempo e intentos, como Diego.",
              );
              complete();
            } else {
              showFeedback(
                f,
                "good",
                "Correct! Keep going.",
                "¡Correcto! Sigue así.",
              );
              var nb = el("button", {
                cls: "btn primary",
                text: "Next question · Siguiente pregunta",
              });
              nb.style.marginTop = "10px";
              nb.addEventListener("click", renderQ);
              f.appendChild(nb);
            }
          } else {
            b.classList.add("meh");
            showFeedback(
              f,
              "try",
              "Look back at the story. The answer is in there!",
              "Mira el cuento otra vez. ¡La respuesta está ahí!",
            );
          }
        });
        choices.appendChild(b);
      });
      area.appendChild(choices);
      var bank = el("div", {
        cls: "wordbank",
        attrs: { "aria-label": "Word bank" },
      });
      bank.appendChild(
        el("span", {
          text: "Word bank: ",
          attrs: { style: "font-weight:700" },
        }),
      );
      item.bankEn.split(" · ").forEach(function (w) {
        bank.appendChild(el("span", { cls: "chip", text: w }));
      });
      area.appendChild(bank);
      f.className = "feedback";
    }
  }

  function reading_retell(root, complete) {
    orderSteps(root, complete, {
      en: "Retell Diego's story! Put what happened in order: 1, 2, 3, 4.",
      es: "¡Vuelve a contar la historia de Diego! Pon lo que pasó en orden: 1, 2, 3, 4.",
      correct: [
        {
          ic: "🎯",
          en: "Diego wanted to ride his bike",
          es: "Diego quería andar en bici",
        },
        {
          ic: "📝",
          en: "He made a plan to practice",
          es: "Hizo un plan para practicar",
        },
        {
          ic: "🚲",
          en: "He fell but tried again",
          es: "Se cayó pero lo intentó otra vez",
        },
        {
          ic: "😄",
          en: "He rode to the park and felt proud",
          es: "Llegó al parque y se sintió orgulloso",
        },
      ],
      okEn: "Perfect retelling! Stories have a beginning, middle, and end.",
      okEs: "¡Bien contado! Los cuentos tienen principio, medio y final.",
      tryEn: "Almost! What happened FIRST in the story?",
      tryEs: "¡Casi! ¿Qué pasó PRIMERO en el cuento?",
    });
  }

  function reading_draw(root, complete) {
    root.appendChild(
      bilingual(
        "Draw the BEST part of Diego's story! Maybe him riding to the park. Then save it.",
        "¡Dibuja la MEJOR parte de la historia de Diego! Quizá cuando llega al parque. Luego guárdala.",
      ),
    );
    var tool = canvasDrawTool(
      root,
      {
        label: "Draw the best part",
        stamps: ["🚲", "🌳", "☀️", "🏞️", "😄", "⭐"],
      },
      null,
    );
    makeActions(
      root,
      tool.canvas,
      "diego-story.png",
      complete,
      "I drew it! · ¡Lo dibujé!",
    );
  }

  /* ===================================================================
     STOP: HELPERS — read + match helper to job + be a helper
     =================================================================== */
  function helpers_match(root, complete) {
    root.appendChild(
      bilingual(
        "Tap a helper. Then tap the job they do.",
        "Toca un ayudante. Luego toca el trabajo que hace.",
      ),
    );
    var pairs = [
      {
        id: "doc",
        en: "Doctor",
        es: "Doctor",
        ic: "👩‍⚕️",
        job: "Helps sick people feel better",
        jobEs: "Ayuda a sanar a los enfermos",
      },
      {
        id: "fire",
        en: "Firefighter",
        es: "Bombero",
        ic: "👨‍🚒",
        job: "Puts out fires and keeps us safe",
        jobEs: "Apaga incendios y nos cuida",
      },
      {
        id: "farm",
        en: "Farmer",
        es: "Agricultor",
        ic: "👩‍🌾",
        job: "Grows our healthy food",
        jobEs: "Cultiva nuestra comida sana",
      },
      {
        id: "teach",
        en: "Teacher",
        es: "Maestro",
        ic: "👨‍🏫",
        job: "Helps us learn",
        jobEs: "Nos ayuda a aprender",
      },
    ];
    var jobs = shuffle(pairs.slice());
    var selected = null,
      matched = 0;
    var f = feedbackBox();
    var cols = el("div", {
      attrs: { style: "display:grid;grid-template-columns:1fr 1fr;gap:14px" },
    });
    var hCol = el("div");
    hCol.appendChild(
      el("p", { cls: "prompt", html: "<strong>Helpers · Ayudantes</strong>" }),
    );
    var jCol = el("div");
    jCol.appendChild(
      el("p", { cls: "prompt", html: "<strong>Jobs · Trabajos</strong>" }),
    );
    pairs.forEach(function (p) {
      var b = el("button", {
        cls: "tile",
        attrs: { type: "button", "aria-label": p.en },
      });
      b.dataset.id = p.id;
      b.style.marginBottom = "10px";
      b.innerHTML =
        '<span class="ic" aria-hidden="true">' +
        p.ic +
        "</span>" +
        p.en +
        '<br><span style="font-size:.78rem;color:#7c5cbf">' +
        p.es +
        "</span>";
      b.appendChild(sayBtn(p.en, p.es));
      b.addEventListener("click", function () {
        hCol.querySelectorAll(".tile").forEach(function (x) {
          x.classList.remove("selected");
        });
        selected = b;
        b.classList.add("selected");
      });
      hCol.appendChild(b);
    });
    jobs.forEach(function (p) {
      var b = el("button", {
        cls: "tile",
        attrs: { type: "button", "aria-label": p.job },
      });
      b.dataset.id = p.id;
      b.style.marginBottom = "10px";
      b.innerHTML =
        "<span style='font-size:.92rem'>" +
        p.job +
        '<br><span style="font-size:.75rem;color:#7c5cbf">' +
        p.jobEs +
        "</span></span>";
      b.appendChild(sayBtn(p.job, p.jobEs));
      b.addEventListener("click", function () {
        if (!selected) {
          showFeedback(
            f,
            "try",
            "First tap a helper on the left.",
            "Primero toca un ayudante a la izquierda.",
          );
          return;
        }
        if (selected.dataset.id === p.id) {
          selected.classList.add("matched");
          selected.disabled = true;
          b.classList.add("matched");
          b.disabled = true;
          selected = null;
          matched++;
          showFeedback(
            f,
            "good",
            "Match! That is their job.",
            "¡Coincide! Ese es su trabajo.",
          );
          if (matched === pairs.length) {
            showFeedback(
              f,
              "good",
              "You matched all the helpers! We thank them for keeping us healthy.",
              "¡Emparejaste a todos! Les damos gracias por cuidarnos.",
            );
            complete();
          }
        } else {
          b.classList.add("wrong");
          setTimeout(function () {
            b.classList.remove("wrong");
          }, 450);
          showFeedback(
            f,
            "try",
            "Not yet — try another job.",
            "Todavía no, prueba otro trabajo.",
          );
        }
      });
      jCol.appendChild(b);
    });
    cols.appendChild(hCol);
    cols.appendChild(jCol);
    root.appendChild(cols);
    root.appendChild(f);
  }

  function helpers_choose(root, complete) {
    buildBranching(root, complete, {
      en: "Your little brother spilled his blocks and feels sad. How can YOU be a helper?",
      es: "Tu hermanito tiró sus bloques y está triste. ¿Cómo puedes TÚ ser un ayudante?",
      choices: [
        {
          ic: "🤝",
          en: "Help him pick them up and cheer him up.",
          good: true,
          fbEn: "Wonderful! Helpers at home make families happy. You are a kind helper!",
          fbEs: "¡Maravilloso! Los ayudantes en casa hacen feliz a la familia. ¡Eres un buen ayudante!",
        },
        {
          ic: "😤",
          en: "Tell him it is his own fault.",
          good: false,
          fbEn: "That can hurt. A helper is kind and lends a hand instead.",
          fbEs: "Eso puede lastimar. Un ayudante es amable y echa una mano.",
        },
        {
          ic: "🚶",
          en: "Walk away and play alone.",
          good: false,
          fbEn: "Hmm. A helper notices when someone needs help and steps in.",
          fbEs: "Mmm. Un ayudante nota cuando alguien necesita ayuda y actúa.",
        },
      ],
    });
  }

  /* ===================================================================
     STOP: FRIENDSHIP — choose (original) + design a kindness badge
     =================================================================== */
  function buildFriendship(root, complete) {
    buildBranching(root, complete, {
      en: "A new student is sitting alone at lunch. What is the kind choice?",
      es: "Un estudiante nuevo está solo en el almuerzo. ¿Cuál es la decisión amable?",
      choices: [
        {
          ic: "🤗",
          en: "Invite them to sit with you.",
          good: true,
          fbEn: "Wonderful! Being a good friend means including others. You made their day brighter!",
          fbEs: "¡Maravilloso! Ser buen amigo es incluir a los demás. ¡Les alegraste el día!",
        },
        {
          ic: "😶",
          en: "Say nothing.",
          good: false,
          fbEn: "It is okay to feel shy. But a small 'hi' can help a lot. Try inviting them next time.",
          fbEs: "Está bien ser tímido. Pero un pequeño 'hola' ayuda mucho. Invítalo la próxima vez.",
        },
        {
          ic: "👀",
          en: "Laugh with friends about them.",
          good: false,
          fbEn: "Ouch — that can hurt feelings. A good friend is kind, even to new people.",
          fbEs: "Ay, eso puede lastimar. Un buen amigo es amable, también con los nuevos.",
        },
      ],
    });
  }

  function falls_badge(root, complete) {
    root.appendChild(
      bilingual(
        "Design a kindness badge! Pick a color, a picture, and a word. Then save your badge.",
        "¡Diseña una medalla de bondad! Elige color, dibujo y palabra. Luego guarda tu medalla.",
      ),
    );
    var colorList = [
      "#2e9e5b",
      "#3aa3e3",
      "#7c5cbf",
      "#ff6b6b",
      "#ffb627",
      "#ff8fab",
    ];
    var emojiList = ["🤝", "❤️", "🌟", "🫂", "😊", "🤲", "🌈", "🦸"];
    var wordList = ["KIND", "CARING", "HELPER", "FRIEND", "SHARING", "BRAVE"];
    var picked = {
      color: colorList[0],
      emoji: emojiList[0],
      word: wordList[0],
    };

    var stageRow = el("div", { cls: "badge-stage" });
    var preview = el("div", { cls: "badge-preview", attrs: { role: "img" } });
    function renderPreview() {
      preview.style.background =
        "radial-gradient(circle at 50% 35%, " +
        lighten(picked.color) +
        ", " +
        picked.color +
        ")";
      preview.innerHTML =
        '<span class="b-emoji" aria-hidden="true">' +
        picked.emoji +
        '</span><span class="b-word">' +
        picked.word +
        "</span>";
      preview.setAttribute(
        "aria-label",
        "Badge: " + picked.word + " " + picked.emoji,
      );
    }
    var controls = el("div", { cls: "badge-controls" });
    controls.appendChild(
      el("div", { cls: "grp-label", text: "Color · Color" }),
    );
    var colRow = el("div", { cls: "stamp-row" });
    colorList.forEach(function (c, i) {
      var sw = el("button", {
        cls: "swatch",
        attrs: {
          type: "button",
          "aria-label": "Color " + (i + 1),
          "aria-pressed": i === 0 ? "true" : "false",
          style: "background:" + c,
        },
      });
      sw.addEventListener("click", function () {
        picked.color = c;
        colRow.querySelectorAll(".swatch").forEach(function (s) {
          s.setAttribute("aria-pressed", "false");
        });
        sw.setAttribute("aria-pressed", "true");
        renderPreview();
      });
      colRow.appendChild(sw);
    });
    controls.appendChild(colRow);
    controls.appendChild(
      el("div", { cls: "grp-label", text: "Picture · Dibujo" }),
    );
    var emRow = el("div", { cls: "stamp-row" });
    emojiList.forEach(function (e, i) {
      var b = el("button", {
        cls: "stamp-btn",
        attrs: {
          type: "button",
          "aria-pressed": i === 0 ? "true" : "false",
          "aria-label": "Picture " + e,
        },
        text: e,
      });
      b.addEventListener("click", function () {
        picked.emoji = e;
        emRow.querySelectorAll(".stamp-btn").forEach(function (s) {
          s.setAttribute("aria-pressed", "false");
        });
        b.setAttribute("aria-pressed", "true");
        renderPreview();
      });
      emRow.appendChild(b);
    });
    controls.appendChild(emRow);
    controls.appendChild(
      el("div", { cls: "grp-label", text: "Word · Palabra" }),
    );
    var wordSel = el("select", {
      attrs: {
        "aria-label": "Badge word · Palabra de la medalla",
        style:
          "font-family:inherit;font-size:1rem;padding:8px;border-radius:10px;border:2px solid var(--line)",
      },
    });
    wordList.forEach(function (w) {
      wordSel.appendChild(el("option", { text: w, attrs: { value: w } }));
    });
    wordSel.addEventListener("change", function () {
      picked.word = wordSel.value;
      renderPreview();
    });
    controls.appendChild(wordSel);

    stageRow.appendChild(preview);
    stageRow.appendChild(controls);
    root.appendChild(stageRow);
    renderPreview();

    var f = feedbackBox();
    var actions = el("div", { cls: "make-actions" });
    var saveBtn = el("button", {
      cls: "btn primary",
      text: "💾 Save my badge · Guardar mi medalla",
    });
    var doneBtn = el("button", {
      cls: "btn ghost",
      text: "🏅 My badge is done! · ¡Mi medalla está lista!",
    });
    saveBtn.addEventListener("click", function () {
      badgeToPng(picked, "my-kindness-badge.png");
    });
    doneBtn.addEventListener("click", function () {
      doneBtn.disabled = true;
      showFeedback(
        f,
        "good",
        "What a kind badge! Wear it and spread kindness everywhere.",
        "¡Qué medalla tan amable! Úsala y comparte bondad.",
      );
      complete();
    });
    actions.appendChild(saveBtn);
    actions.appendChild(doneBtn);
    root.appendChild(actions);
    root.appendChild(f);
  }
  function lighten(hex) {
    var n = parseInt(hex.slice(1), 16);
    var r = Math.min(255, ((n >> 16) & 255) + 70);
    var g = Math.min(255, ((n >> 8) & 255) + 70);
    var b = Math.min(255, (n & 255) + 70);
    return "rgb(" + r + "," + g + "," + b + ")";
  }
  function badgeToPng(picked, filename) {
    var c = el("canvas", { attrs: { width: "360", height: "360" } });
    var ctx = c.getContext("2d");
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, 360, 360);
    var grad = ctx.createRadialGradient(180, 130, 20, 180, 180, 160);
    grad.addColorStop(0, lighten(picked.color));
    grad.addColorStop(1, picked.color);
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(180, 180, 150, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.7)";
    ctx.lineWidth = 14;
    ctx.stroke();
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = "96px serif";
    ctx.fillText(picked.emoji, 180, 150);
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 44px sans-serif";
    ctx.fillText(picked.word, 180, 250);
    downloadCanvas(c, filename);
  }

  /* ===================================================================
     SHARED REUSABLE MINI-ACTIVITIES
     =================================================================== */

  /* Multiple-choice quiz set (used by several stops). */
  function quizSet(root, complete, qs) {
    root.appendChild(
      bilingual(
        "Tap the best answer. Read it or press 🔊 to listen.",
        "Toca la mejor respuesta. Léela o presiona 🔊 para escuchar.",
      ),
    );
    var qi = 0;
    var area = el("div");
    var f = feedbackBox();
    root.appendChild(area);
    root.appendChild(f);
    renderQ();
    function renderQ() {
      area.innerHTML = "";
      var item = qs[qi];
      var prompt = el("p", { cls: "prompt" });
      prompt.appendChild(el("strong", { text: qi + 1 + ") " + item.q }));
      prompt.appendChild(sayBtn(item.q, item.qEs));
      area.appendChild(prompt);
      area.appendChild(
        el("p", {
          text: item.qEs,
          attrs: { style: "margin:-6px 0 6px;color:#7c5cbf;font-style:italic" },
        }),
      );
      var choices = el("div", { cls: "choices" });
      item.opts.forEach(function (o) {
        var b = el("button", { cls: "choice", attrs: { type: "button" } });
        b.innerHTML =
          '<span class="ic" aria-hidden="true">🔘</span><span>' +
          o.en +
          "</span>";
        b.appendChild(sayBtn(o.en, null));
        b.addEventListener("click", function () {
          if (o.ok) {
            b.classList.add("good");
            choices.querySelectorAll(".choice").forEach(function (x) {
              x.disabled = true;
            });
            qi++;
            if (qi >= qs.length) {
              showFeedback(
                f,
                "good",
                "You got them all! Great thinking.",
                "¡Las acertaste todas! Buen pensamiento.",
              );
              complete();
            } else {
              showFeedback(
                f,
                "good",
                "Correct! Keep going.",
                "¡Correcto! Sigue así.",
              );
              var nb = el("button", {
                cls: "btn primary",
                text: "Next · Siguiente",
              });
              nb.style.marginTop = "10px";
              nb.addEventListener("click", renderQ);
              f.appendChild(nb);
            }
          } else {
            b.classList.add("meh");
            showFeedback(
              f,
              "try",
              "Not quite — try again!",
              "Casi, ¡inténtalo de nuevo!",
            );
          }
        });
        choices.appendChild(b);
      });
      area.appendChild(choices);
      f.className = "feedback";
    }
  }

  /* Pick-exactly-three selector (used by Move plan). */
  function pickThree(root, complete, items, btnLabel, okEn, okEs) {
    var chosen = [];
    var row = el("div", { cls: "pickrow" });
    items.forEach(function (it) {
      var b = el("button", {
        cls: "opt",
        attrs: { type: "button", "aria-pressed": "false" },
      });
      b.innerHTML = '<span aria-hidden="true">' + it.ic + "</span> " + it.en;
      b.appendChild(sayBtn(it.en, it.es));
      b.addEventListener("click", function () {
        var on = b.getAttribute("aria-pressed") === "true";
        if (on) {
          b.setAttribute("aria-pressed", "false");
          chosen = chosen.filter(function (x) {
            return x !== it;
          });
        } else {
          if (chosen.length >= 3) return;
          b.setAttribute("aria-pressed", "true");
          chosen.push(it);
        }
        go.disabled = chosen.length !== 3;
      });
      row.appendChild(b);
    });
    root.appendChild(row);
    var go = el("button", {
      cls: "btn primary",
      text: btnLabel,
      attrs: { disabled: "true" },
    });
    var card = el("div", { cls: "goal-card" });
    root.appendChild(go);
    root.appendChild(card);
    go.addEventListener("click", function () {
      var html = "<ol style='margin:0;padding-left:22px'>";
      chosen.forEach(function (s) {
        html += "<li>" + s.ic + " " + s.en + "</li>";
      });
      html += "</ol>";
      card.innerHTML =
        "<p style='margin:0 0 6px'><strong>" + okEn + "</strong></p>" + html;
      card.classList.add("show");
      card.appendChild(sayBtn(okEn, okEs));
      go.disabled = true;
      complete();
    });
  }

  /* Reusable ordering activity (used by Steps, Sleep, Story retell). */
  function orderSteps(root, complete, data) {
    root.appendChild(bilingual(data.en, data.es));
    var correct = data.correct;
    var order = shuffle(correct.slice());
    if (sameOrder(order, correct)) order.reverse();
    var f = feedbackBox();
    var list = el("ol", {
      cls: "order-list",
      attrs: { "aria-label": "Steps to order" },
    });
    root.appendChild(list);
    var checkBtn = el("button", {
      cls: "btn primary",
      text: "Check my order · Revisar mi orden",
    });
    root.appendChild(checkBtn);
    root.appendChild(f);
    var dragIndex = null;
    function render() {
      list.innerHTML = "";
      order.forEach(function (item, i) {
        var li = el("li", {
          cls: "order-item",
          attrs: { draggable: "true", "aria-label": item.en },
        });
        li.dataset.en = item.en;
        li.innerHTML =
          '<span class="num" aria-hidden="true">' +
          (i + 1) +
          "</span>" +
          '<span aria-hidden="true">' +
          item.ic +
          "</span>" +
          "<span>" +
          item.en +
          ' <span style="font-size:.8rem;color:#7c5cbf">/ ' +
          item.es +
          "</span></span>";
        li.appendChild(sayBtn(item.en, item.es));
        var arrows = el("span", { cls: "arrows" });
        var up = el("button", {
          attrs: { type: "button", "aria-label": "Move up" },
          text: "▲",
        });
        var dn = el("button", {
          attrs: { type: "button", "aria-label": "Move down" },
          text: "▼",
        });
        up.addEventListener("click", function () {
          move(i, -1);
        });
        dn.addEventListener("click", function () {
          move(i, 1);
        });
        arrows.appendChild(up);
        arrows.appendChild(dn);
        li.appendChild(arrows);
        li.addEventListener("dragstart", function () {
          dragIndex = i;
        });
        li.addEventListener("dragover", function (e) {
          e.preventDefault();
          li.classList.add("over");
        });
        li.addEventListener("dragleave", function () {
          li.classList.remove("over");
        });
        li.addEventListener("drop", function (e) {
          e.preventDefault();
          li.classList.remove("over");
          dropOn(i);
        });
        list.appendChild(li);
      });
    }
    function dropOn(target) {
      if (dragIndex == null || dragIndex === target) return;
      var moved = order.splice(dragIndex, 1)[0];
      order.splice(target, 0, moved);
      dragIndex = null;
      render();
    }
    function move(i, dir) {
      var j = i + dir;
      if (j < 0 || j >= order.length) return;
      var tmp = order[i];
      order[i] = order[j];
      order[j] = tmp;
      render();
    }
    render();
    checkBtn.addEventListener("click", function () {
      if (sameOrder(order, correct)) {
        list.querySelectorAll(".order-item").forEach(function (li) {
          li.classList.add("correct");
        });
        showFeedback(f, "good", data.okEn, data.okEs);
        checkBtn.disabled = true;
        complete();
      } else {
        showFeedback(f, "try", data.tryEn, data.tryEs);
      }
    });
    function sameOrder(a, b) {
      return a.every(function (x, i) {
        return x.en === b[i].en;
      });
    }
  }

  /* Save/print + "done" controls for a finished canvas creation. */
  function makeActions(root, canvas, filename, complete, doneLabel) {
    var f = feedbackBox();
    var actions = el("div", { cls: "make-actions" });
    var saveBtn = el("button", {
      cls: "tool-btn",
      text: "💾 Save / print · Guardar",
    });
    var doneBtn = el("button", {
      cls: "btn primary",
      text: doneLabel || "✅ I made it! · ¡Lo hice!",
    });
    saveBtn.addEventListener("click", function () {
      downloadCanvas(canvas, filename);
    });
    doneBtn.addEventListener("click", function () {
      doneBtn.disabled = true;
      showFeedback(
        f,
        "good",
        "Beautiful work, artist! You can save it to print or share.",
        "¡Hermoso trabajo, artista! Puedes guardarlo para imprimir o compartir.",
      );
      complete();
    });
    actions.appendChild(doneBtn);
    actions.appendChild(saveBtn);
    actions.appendChild(
      el("span", {
        cls: "make-note",
        text: "Save downloads a picture. · Guardar descarga una imagen.",
      }),
    );
    root.appendChild(actions);
    root.appendChild(f);
  }

  /* Render an SVG element to a PNG and download (best-effort). */
  function svgToPng(svg, filename) {
    try {
      var clone = svg.cloneNode(true);
      var w = 480,
        h = 312;
      clone.setAttribute("width", w);
      clone.setAttribute("height", h);
      var data = new XMLSerializer().serializeToString(clone);
      var svg64 =
        "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(data)));
      var img = new Image();
      img.onload = function () {
        var c = el("canvas", {
          attrs: { width: String(w), height: String(h) },
        });
        var ctx = c.getContext("2d");
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, w, h);
        ctx.drawImage(img, 0, 0, w, h);
        downloadCanvas(c, filename);
      };
      img.src = svg64;
    } catch (e) {
      /* no-op */
    }
  }

  /* ===================================================================
     CELEBRATION
     =================================================================== */
  function showCelebration() {
    hub.classList.add("hidden");
    stage.classList.remove("hidden");
    stage.innerHTML = "";
    var c = el("div", { cls: "screen celebrate" });
    c.innerHTML =
      '<div class="big" aria-hidden="true">🎉🌟🥳</div>' +
      "<h2>You did it, Goal Champion!</h2>" +
      '<p style="font-size:1.2rem;margin:4px 0">¡Lo lograste, Campeón de Metas!</p>' +
      '<p style="font-size:1.3rem;font-weight:800;color:var(--green-deep)">⭐ ' +
      state.stars +
      " stars earned!</p>" +
      '<p style="max-width:560px;margin:10px auto;font-size:1.1rem">You read stories, set goals, made healthy plates, named feelings, moved your body, made kind choices, and created your own art. That is what champions do!</p>' +
      '<p style="max-width:560px;margin:0 auto 16px;font-style:italic;color:#7c5cbf">Leíste cuentos, pusiste metas, hiciste platos sanos, nombraste sentimientos, moviste tu cuerpo, tomaste decisiones amables y creaste tu arte. ¡Eso hacen los campeones!</p>';
    var sb = sayBtn(
      "You did it, Goal Champion! You read stories, set goals, made healthy choices, named feelings, moved your body, and made kind decisions.",
      "Lo lograste, Campeón de Metas. Leíste, pusiste metas y tomaste buenas decisiones.",
    );
    c.appendChild(sb);
    var row = el("div", {
      cls: "btn-row",
      attrs: { style: "justify-content:center" },
    });
    var map = el("button", {
      cls: "btn ghost",
      text: "🗺️ Back to map · Volver al mapa",
    });
    map.addEventListener("click", showHub);
    row.appendChild(map);
    c.appendChild(row);
    stage.appendChild(c);
    confetti();
    window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
  }

  /* ---------------- Utils ---------------- */
  function shuffle(a) {
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i];
      a[i] = a[j];
      a[j] = t;
    }
    return a;
  }

  /* ---------------- Reset ---------------- */
  document.getElementById("resetBtn").addEventListener("click", function () {
    state = { done: {}, parts: {}, stars: 0 };
    save();
    showHub();
  });

  /* ---------------- Init ---------------- */
  wireStaticSay(document);
  renderHub();
})();
