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

  // --- 5. Tap-a-word glossary (image + simple bilingual definition) --------
  // Mirrors the lesson vocab cards: reuses the shared /assets/vocab-images
  // SVGs. Keys are the normalized English term from the "Key words" table.
  var GLOSSARY = {
    factor: {
      img: "factor",
      en: "A number you multiply with another to make a product. 3 and 4 are factors of 12.",
      es: "Un número que multiplicas con otro para formar un producto. 3 y 4 son factores de 12.",
    },
    multiple: {
      img: "multiple",
      en: "The answer when you multiply a number by 1, 2, 3, and so on. 5, 10, 15 are multiples of 5.",
      es: "El resultado de multiplicar un número por 1, 2, 3, y así. 5, 10, 15 son múltiplos de 5.",
    },
    "greatest common factor": {
      img: "greatest-common-factor",
      en: "The biggest number that divides two numbers evenly. The GCF of 12 and 18 is 6.",
      es: "El número más grande que divide dos números de manera exacta. El MCD de 12 y 18 es 6.",
    },
    fraction: {
      img: "fraction",
      en: "A number that shows part of a whole, like 3/4.",
      es: "Un número que muestra una parte de un entero, como 3/4.",
    },
    reciprocal: {
      img: "reciprocal",
      en: "A fraction flipped upside down. The reciprocal of 2/3 is 3/2. We use it to divide fractions.",
      es: "Una fracción volteada al revés. El recíproco de 2/3 es 3/2. Lo usamos para dividir fracciones.",
    },
    divide: {
      img: "divide",
      en: "To split a number into equal groups. 12 ÷ 3 = 4.",
      es: "Separar un número en grupos iguales. 12 ÷ 3 = 4.",
    },
    ratio: {
      img: "ratio",
      en: "A way to compare two amounts, like 2 cups to 3 cups (2:3).",
      es: "Una manera de comparar dos cantidades, como 2 tazas a 3 tazas (2:3).",
    },
    rate: {
      img: "rate",
      en: "A ratio that compares two amounts with different units, like miles per hour.",
      es: "Una razón que compara dos cantidades con unidades diferentes, como millas por hora.",
    },
    "unit rate": {
      img: "unit-rate",
      en: "The cost or amount for just 1, like $3 for 1 apple.",
      es: "El costo o cantidad para solo 1, como $3 por 1 manzana.",
    },
    percent: {
      img: "percent",
      en: "A part out of 100. 25% means 25 out of 100.",
      es: "Una parte de 100. 25% significa 25 de 100.",
    },
    discount: {
      img: "discount",
      en: "Money taken off a price. 25% off means you pay less.",
      es: "Dinero que se quita de un precio. 25% de descuento significa que pagas menos.",
    },
    "sales tax": {
      img: "percent",
      en: "Extra money added to a price that goes to the government, given as a percent.",
      es: "Dinero extra que se añade a un precio y va al gobierno, dado como un porcentaje.",
    },
    area: {
      img: "area",
      en: "The flat space inside a shape, measured in square units.",
      es: "El espacio plano dentro de una figura, medido en unidades cuadradas.",
    },
    base: {
      img: "base",
      en: "The bottom side of a shape that we measure from.",
      es: "El lado de abajo de una figura desde donde medimos.",
    },
    height: {
      img: "height",
      en: "How tall a shape is, measured straight up from the base.",
      es: "Qué tan alta es una figura, medida recta hacia arriba desde la base.",
    },
    expression: {
      img: "expression",
      en: "A math phrase with numbers and symbols, like 2 + 3 × 4. It has no equal sign.",
      es: "Una frase matemática con números y símbolos, como 2 + 3 × 4. No tiene signo de igual.",
    },
    variable: {
      img: "variable",
      en: "A letter that stands for a number we do not know yet, like x.",
      es: "Una letra que representa un número que todavía no conocemos, como x.",
    },
    exponent: {
      img: "exponent",
      en: "A small number that tells how many times to multiply a number by itself. 2³ = 2×2×2.",
      es: "Un número pequeño que dice cuántas veces multiplicar un número por sí mismo. 2³ = 2×2×2.",
    },
    equation: {
      img: "equation",
      en: "A math sentence with an equal sign, like x + 7 = 20.",
      es: "Una oración matemática con un signo de igual, como x + 7 = 20.",
    },
    solve: {
      img: "equation",
      en: "To find the value that makes an equation true.",
      es: "Encontrar el valor que hace verdadera una ecuación.",
    },
    "inverse operation": {
      img: "operation",
      en: "The opposite operation that undoes another. Subtraction undoes addition.",
      es: "La operación opuesta que deshace otra. La resta deshace la suma.",
    },
    mean: {
      img: "mean",
      en: "The average. Add all the numbers, then divide by how many there are.",
      es: "El promedio. Suma todos los números y divide entre cuántos hay.",
    },
    median: {
      img: "median",
      en: "The middle number when the numbers are in order.",
      es: "El número del medio cuando los números están en orden.",
    },
    range: {
      img: "range",
      en: "The difference between the biggest and smallest number.",
      es: "La diferencia entre el número más grande y el más pequeño.",
    },
    integer: {
      img: "integer",
      en: "A whole number that can be positive or negative, like -3, 0, or 5.",
      es: "Un número entero que puede ser positivo o negativo, como -3, 0 o 5.",
    },
    "absolute value": {
      img: "absolute-value",
      en: "How far a number is from 0, always positive. |−15| = 15.",
      es: "Qué tan lejos está un número de 0, siempre positivo. |−15| = 15.",
    },
    "coordinate plane": {
      img: "coordinate-plane",
      en: "A grid with an x-axis and a y-axis used to plot points.",
      es: "Una cuadrícula con un eje x y un eje y que se usa para marcar puntos.",
    },
    volume: {
      img: "volume",
      en: "The space inside a 3D object, measured in cubic units.",
      es: "El espacio dentro de un objeto 3D, medido en unidades cúbicas.",
    },
    "surface area": {
      img: "surface-area",
      en: "The total area of all the outside faces of a 3D shape.",
      es: "El área total de todas las caras exteriores de una figura 3D.",
    },
    "rectangular prism": {
      img: "rectangular-prism",
      en: "A 3D box shape with 6 rectangle faces.",
      es: "Una figura de caja 3D con 6 caras rectangulares.",
    },
  };
  function normTerm(s) {
    return s
      .replace(/\(.*?\)/g, "")
      .replace(/\s+/g, " ")
      .trim()
      .toLowerCase();
  }

  var glossTables = cols.querySelectorAll("table.voc");
  if (glossTables.length) {
    // One shared modal for the page.
    var modal = document.createElement("div");
    modal.className = "fl-modal";
    modal.hidden = true;
    modal.setAttribute("role", "dialog");
    modal.setAttribute("aria-modal", "true");
    modal.setAttribute("aria-labelledby", "fl-modal-term");
    modal.innerHTML =
      '<div class="fl-modal-backdrop" data-close></div>' +
      '<div class="fl-modal-card" role="document">' +
      '<button type="button" class="fl-modal-x" data-close aria-label="Close / Cerrar">✕</button>' +
      '<img class="fl-modal-img" alt="" />' +
      '<h3 id="fl-modal-term" class="fl-modal-term"></h3>' +
      '<p class="fl-modal-def"><span class="fl-modal-flag">🇺🇸</span> <span data-en></span> ' +
      '<button type="button" class="fl-modal-say" data-say-en aria-label="Read in English">🔊</button></p>' +
      '<p class="fl-modal-def"><span class="fl-modal-flag">🇲🇽</span> <span data-es></span> ' +
      '<button type="button" class="fl-modal-say" data-say-es aria-label="Leer en español">🔊</button></p>' +
      "</div>";
    document.body.appendChild(modal);
    var mImg = modal.querySelector(".fl-modal-img");
    var mTerm = modal.querySelector(".fl-modal-term");
    var mEn = modal.querySelector("[data-en]");
    var mEs = modal.querySelector("[data-es]");
    var lastFocus = null;

    function say(text, lang) {
      if (!window.speechSynthesis) return;
      window.speechSynthesis.cancel();
      var u = new SpeechSynthesisUtterance(text);
      u.lang = lang;
      u.rate = 0.92;
      window.speechSynthesis.speak(u);
    }
    function openModal(term, label) {
      var e = GLOSSARY[term];
      if (!e) return;
      lastFocus = document.activeElement;
      mImg.src = "/assets/vocab-images/" + e.img + ".svg";
      mImg.alt = "Picture of " + label;
      mImg.style.display = "";
      mImg.onerror = function () {
        mImg.style.display = "none";
      };
      mTerm.textContent = label;
      mEn.textContent = e.en;
      mEs.textContent = e.es;
      modal.hidden = false;
      modal.querySelector(".fl-modal-x").focus();
    }
    function closeModal() {
      if (window.speechSynthesis) window.speechSynthesis.cancel();
      modal.hidden = true;
      if (lastFocus && lastFocus.focus) lastFocus.focus();
    }
    modal.addEventListener("click", function (ev) {
      if (ev.target.hasAttribute("data-close")) closeModal();
      else if (ev.target.hasAttribute("data-say-en"))
        say(mTerm.textContent + ". " + mEn.textContent, "en-US");
      else if (ev.target.hasAttribute("data-say-es"))
        say(mTerm.textContent + ". " + mEs.textContent, "es-MX");
    });
    document.addEventListener("keydown", function (ev) {
      if (ev.key === "Escape" && !modal.hidden) closeModal();
    });

    // Make each "Key words" term a tap target that opens its card.
    Array.prototype.forEach.call(glossTables, function (table) {
      Array.prototype.forEach.call(table.rows, function (row) {
        var enCell = row.cells[0];
        if (!enCell) return;
        var key = normTerm(enCell.textContent);
        if (!GLOSSARY[key]) return;
        Array.prototype.forEach.call(row.cells, function (cell) {
          var label = cell.textContent.trim();
          var b = document.createElement("button");
          b.type = "button";
          b.className = "fl-term";
          b.innerHTML = label + '<span class="fl-term-i" aria-hidden="true">ⓘ</span>';
          b.setAttribute("aria-label", label + " — tap for a picture and definition");
          b.addEventListener("click", function () {
            openModal(key, label);
          });
          cell.textContent = "";
          cell.appendChild(b);
        });
      });
    });
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
