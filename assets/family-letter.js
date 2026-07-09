/* family-letter.js — progressive interactive layer for the bilingual Family
   Letters (math/family/unit-N/index.html).

   Auto-enhances the existing hand-authored markup — no per-page edits needed:
     1. Language focus toggle (Both / English / Español), remembered per device.
     2. "Try it together" answers hidden behind a Show-answer button.
     3. Per-column Read-aloud (Web Speech API), Spanish voice for the ES column.
     4. A "We practiced together tonight" checkbox saved per unit.

   Everything degrades gracefully: with JS off the page is the original static,
   fully-printable letter. Printing forces both languages + revealed answers. */
(function () {
  "use strict";

  var cols = document.querySelector(".cols");
  if (!cols) return;
  var langs = Array.prototype.slice.call(cols.querySelectorAll(".lang"));
  if (langs.length < 1) return;

  // --- Identify English vs Spanish columns by their flag label. -------------
  langs.forEach(function (col) {
    var flag = col.querySelector(".flag");
    var isEs = flag && /espa|🇲🇽/i.test(flag.textContent);
    col.classList.add(isEs ? "lang-es" : "lang-en");
    col.dataset.lang = isEs ? "es" : "en";
  });

  var STR = {
    en: { show: "Show answer", hide: "Hide answer", read: "🔊 Read aloud", stop: "⏹ Stop" },
    es: {
      show: "Mostrar respuesta",
      hide: "Ocultar respuesta",
      read: "🔊 Leer en voz alta",
      stop: "⏹ Detener",
    },
  };
  function t(col, key) {
    return STR[col.dataset.lang === "es" ? "es" : "en"][key];
  }

  // --- 1. Language focus toggle --------------------------------------------
  var LANG_KEY = "nt-family-lang";
  var bar = document.createElement("div");
  bar.className = "fl-langbar";
  bar.setAttribute("role", "group");
  bar.setAttribute("aria-label", "Choose language / Elija el idioma");
  bar.innerHTML = '<span class="fl-lang-label">Language / Idioma</span>';
  var views = [
    { view: "both", label: "🌐 Both / Ambos" },
    { view: "en", label: "🇺🇸 English" },
    { view: "es", label: "🇲🇽 Español" },
  ];
  function setView(view) {
    cols.dataset.langView = view;
    Array.prototype.forEach.call(bar.querySelectorAll(".fl-seg"), function (b) {
      b.setAttribute("aria-pressed", String(b.dataset.view === view));
    });
    try {
      localStorage.setItem(LANG_KEY, view);
    } catch (e) {}
  }
  views.forEach(function (v) {
    var b = document.createElement("button");
    b.type = "button";
    b.className = "fl-seg";
    b.dataset.view = v.view;
    b.textContent = v.label;
    b.addEventListener("click", function () {
      setView(v.view);
    });
    bar.appendChild(b);
  });
  var barAnchor = document.querySelector(".fl-bar");
  if (barAnchor) barAnchor.parentNode.insertBefore(bar, barAnchor.nextSibling);
  else cols.parentNode.insertBefore(bar, cols);
  var saved = "both";
  try {
    saved = localStorage.getItem(LANG_KEY) || "both";
  } catch (e) {}
  setView(saved);

  // --- 2. Interactive "Try it together" answers ----------------------------
  langs.forEach(function (col) {
    var box = col.querySelector(".tryit");
    if (!box) return;
    // The answer is the trailing <strong>Answer:/Respuesta:</strong> + text.
    var strong = box.querySelector("strong");
    if (!strong) return;
    var answer = document.createElement("span");
    answer.className = "fl-answer";
    answer.hidden = true;
    // Move the <br> before the label (if any) and everything from the label on.
    var node = strong;
    if (node.previousSibling && node.previousSibling.nodeName === "BR") node = node.previousSibling;
    var toMove = [];
    for (var n = node; n; n = n.nextSibling) toMove.push(n);
    toMove.forEach(function (m) {
      answer.appendChild(m);
    });
    box.appendChild(answer);

    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "fl-reveal";
    btn.textContent = t(col, "show");
    btn.setAttribute("aria-expanded", "false");
    btn.addEventListener("click", function () {
      var showing = answer.hidden;
      answer.hidden = !showing;
      btn.setAttribute("aria-expanded", String(showing));
      btn.textContent = t(col, showing ? "hide" : "show");
    });
    box.parentNode.insertBefore(btn, box.nextSibling);
  });

  // --- 3. Per-column read-aloud (Web Speech API) ---------------------------
  var synth = window.speechSynthesis;
  if (synth) {
    var speaking = null; // the button currently active
    function resetBtn(b) {
      b.setAttribute("aria-pressed", "false");
      b.textContent = t(b._col, "read");
    }
    langs.forEach(function (col) {
      var tools = document.createElement("div");
      tools.className = "fl-col-tools";
      var b = document.createElement("button");
      b.type = "button";
      b.className = "fl-speak";
      b._col = col;
      b.textContent = t(col, "read");
      b.setAttribute("aria-pressed", "false");
      b.addEventListener("click", function () {
        if (speaking === b) {
          synth.cancel();
          return;
        } // onend resets
        if (speaking) synth.cancel();
        var text = readableText(col);
        var u = new SpeechSynthesisUtterance(text);
        u.lang = col.dataset.lang === "es" ? "es-MX" : "en-US";
        u.rate = 0.92;
        u.onend = u.onerror = function () {
          resetBtn(b);
          if (speaking === b) speaking = null;
        };
        speaking = b;
        b.setAttribute("aria-pressed", "true");
        b.textContent = t(col, "stop");
        synth.speak(u);
      });
      tools.appendChild(b);
      col.insertBefore(tools, col.firstChild);
    });
    window.addEventListener("beforeunload", function () {
      synth.cancel();
    });
  }

  // Collect spoken text from a column: headings, paragraphs, list items,
  // vocabulary pairs and the try-it prompt. Skip the injected controls.
  function readableText(col) {
    var parts = [];
    Array.prototype.forEach.call(
      col.querySelectorAll("h2, h3, p, li, .tryit, table.voc td"),
      function (el) {
        if (el.closest(".fl-col-tools") || el.classList.contains("fl-answer")) return;
        var s = el.textContent.replace(/\s+/g, " ").trim();
        if (s) parts.push(s);
      },
    );
    return parts.join(". ");
  }

  // --- 4. "We practiced together tonight" completion check -----------------
  var footer = document.querySelector(".site-footer");
  if (footer) {
    var DONE_KEY = "nt-family-done:" + location.pathname;
    var label = document.createElement("label");
    label.className = "fl-done";
    label.innerHTML =
      '<input type="checkbox" />' +
      "<span>We practiced together tonight · <em>Practicamos juntos esta noche</em></span>" +
      '<span class="fl-done-cheer" aria-hidden="true">🎉</span>';
    var cb = label.querySelector("input");
    function paint() {
      label.classList.toggle("is-done", cb.checked);
    }
    try {
      cb.checked = localStorage.getItem(DONE_KEY) === "1";
    } catch (e) {}
    paint();
    cb.addEventListener("change", function () {
      paint();
      try {
        localStorage.setItem(DONE_KEY, cb.checked ? "1" : "0");
      } catch (e) {}
    });
    footer.parentNode.insertBefore(label, footer);
  }

  // --- Print: show both languages + all answers, then restore. -------------
  var printPrev = null;
  window.addEventListener("beforeprint", function () {
    printPrev = cols.dataset.langView;
    cols.dataset.langView = "both";
  });
  window.addEventListener("afterprint", function () {
    if (printPrev) cols.dataset.langView = printPrev;
  });
})();
