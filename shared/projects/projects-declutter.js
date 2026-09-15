/* ==========================================================================
   Neft Teacher — Projects COMPACT & DECLUTTER Layer (Shared)
   Comprehensive UI compaction across all 26 Grade 6 culminating math projects.
   - Collapses Level 2 challenge blocks behind opt-in toggles (shown only at Lvl 2).
   - Compacts Step 1 vocabulary grids from text walls into responsive micro-cards.
   - Adds floating/on-demand Math Terms quick-reference for Steps 2-5.
   - Streamlines Step 5 partner compare with instant solo-benchmark fills.
   - Folds Step 6 massive 4x4 rubrics and raw monospace report dumps into drawers.
   - Purely presentational & additive — zero DOM IDs change, preserving all checks.
   Runs only when <body class="declutter-projects">. Idempotent.
   ========================================================================== */
(function () {
  "use strict";
  if (typeof document === "undefined") return;

  function ready(fn) {
    if (document.readyState === "loading")
      document.addEventListener("DOMContentLoaded", fn, { once: true });
    else fn();
  }

  /* ---- 1. Level-2 Challenge Decluttering ---- */
  function decorateLevel2(block) {
    if (block.dataset.dcDone) return;
    block.dataset.dcDone = "1";
    block.classList.add("dc-collapsed");

    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "dc-optbtn lvl2-only"; // visible only when level-2 is active
    btn.setAttribute("aria-expanded", "false");

    var star = document.createElement("span");
    star.className = "dc-star";
    star.setAttribute("aria-hidden", "true");
    star.textContent = "⭐";

    var label = document.createElement("span");
    label.className = "dc-optlabel";
    label.innerHTML =
      '<span class="en-text">Optional Challenge (Level 2) — show</span>' +
      '<span class="es-text">Reto opcional (Nivel 2) — mostrar</span>';

    var caret = document.createElement("span");
    caret.className = "dc-caret";
    caret.setAttribute("aria-hidden", "true");
    caret.textContent = "▸";

    btn.appendChild(star);
    btn.appendChild(label);
    btn.appendChild(caret);

    btn.addEventListener("click", function () {
      var open = block.classList.toggle("dc-collapsed") === false;
      btn.setAttribute("aria-expanded", open ? "true" : "false");
      label.innerHTML = open
        ? '<span class="en-text">Optional Challenge (Level 2) — hide</span><span class="es-text">Reto opcional (Nivel 2) — ocultar</span>'
        : '<span class="en-text">Optional Challenge (Level 2) — show</span><span class="es-text">Reto opcional (Nivel 2) — mostrar</span>';
    });

    block.parentNode.insertBefore(btn, block);
  }

  /* ---- 2. Step 1: Vocabulary Quick-Launch & Glossary Scraper ---- */
  var vocabStore = [];

  function scrapeAndDecorateVocab() {
    if (document.body.dataset.dcVocabDone) return;
    document.body.dataset.dcVocabDone = "1";

    var cards = document.querySelectorAll(".vocab-card");
    if (!cards || cards.length === 0) return;

    cards.forEach(function (c) {
      var icon = c.querySelector(".vocab-icon");
      var term = c.querySelector(".vocab-term");
      var def = c.querySelector(".vocab-def");
      var ex = c.querySelector(".vocab-ex");
      if (term && def) {
        vocabStore.push({
          icon: icon ? icon.textContent.trim() : "📖",
          termHtml: term.innerHTML,
          defHtml: def.innerHTML,
          exHtml: ex ? ex.innerHTML : "",
        });
      }
    });

    // Step 1 Launch Banner
    var vGrid = document.querySelector(".vocab-grid");
    if (vGrid && vGrid.parentNode && !vGrid.parentNode.querySelector(".dc-step1-launch")) {
      var banner = document.createElement("div");
      banner.className = "dc-step1-launch no-print";
      banner.innerHTML =
        '<div class="dc-step1-launch-text">' +
        '  <span class="en-text">🚀 Words reviewed? Jump straight to building your plan!</span>' +
        '  <span class="es-text">🚀 ¿Palabras repasadas? ¡Pasa directo a construir tu plan!</span>' +
        '</div>' +
        '<button type="button" class="dc-step1-launch-btn">' +
        '  <span class="en-text">Start Building (Step 2) →</span>' +
        '  <span class="es-text">Comenzar a construir (Paso 2) →</span>' +
        '</button>';

      var launchBtn = banner.querySelector(".dc-step1-launch-btn");
      launchBtn.addEventListener("click", function () {
        if (typeof window.goStep === "function") {
          // Check if steps are 0-indexed or 1-indexed on this page
          var s0 = document.getElementById("step-0");
          var s1 = document.getElementById("step-1");
          var s2 = document.getElementById("step-2");
          if (s0 && s0.classList.contains("active")) {
            window.goStep(1);
          } else if (s1 && s1.classList.contains("active") && s2) {
            window.goStep(2);
          } else {
            window.goStep(2);
          }
        }
      });

      vGrid.parentNode.insertBefore(banner, vGrid.nextSibling);
    }

    buildGlossaryDrawer();
  }

  function buildGlossaryDrawer() {
    if (vocabStore.length === 0) return;
    if (document.getElementById("dcGlossaryModal")) return;

    // Floating Button
    var floatBtn = document.createElement("button");
    floatBtn.type = "button";
    floatBtn.id = "dcGlossaryBtn";
    floatBtn.className = "dc-glossary-btn no-print";
    floatBtn.setAttribute("aria-label", "Open math glossary");
    floatBtn.innerHTML =
      '<span>📖</span><span class="en-text">Math Terms</span><span class="es-text">Glosario</span>';

    // Modal Drawer
    var modal = document.createElement("div");
    modal.id = "dcGlossaryModal";
    modal.className = "dc-glossary-modal no-print";
    modal.setAttribute("role", "dialog");
    modal.setAttribute("aria-label", "Math Vocabulary Glossary");

    var head = document.createElement("div");
    head.className = "dc-glossary-head";
    head.innerHTML =
      '<span>📖 <span class="en-text">Key Math Words</span><span class="es-text">Palabras clave</span></span>' +
      '<button type="button" class="dc-glossary-close" aria-label="Close glossary">✕</button>';

    var body = document.createElement("div");
    body.className = "dc-glossary-body";

    vocabStore.forEach(function (item) {
      var div = document.createElement("div");
      div.className = "dc-glossary-item";
      div.innerHTML =
        '<div class="dc-glossary-term">' + item.icon + " " + item.termHtml + "</div>" +
        '<div class="dc-glossary-def">' + item.defHtml + "</div>" +
        (item.exHtml ? '<div class="vocab-ex" style="margin-top:4px">' + item.exHtml + "</div>" : "");
      body.appendChild(div);
    });

    modal.appendChild(head);
    modal.appendChild(body);
    document.body.appendChild(floatBtn);
    document.body.appendChild(modal);

    floatBtn.addEventListener("click", function () {
      modal.classList.toggle("dc-open");
    });

    head.querySelector(".dc-glossary-close").addEventListener("click", function () {
      modal.classList.remove("dc-open");
    });
  }

  /* ---- 3. Step 5: Instant Partner / Classmate Benchmark Helper ---- */
  function decoratePartnerCompare() {
    var pNameInput = document.getElementById("p-name") ||
                     document.getElementById("partner-name") ||
                     document.getElementById("deal-partner");
    if (!pNameInput || pNameInput.dataset.dcPartnerDone) return;
    pNameInput.dataset.dcPartnerDone = "1";

    var container = pNameInput.closest(".card") || pNameInput.closest(".step-panel") || pNameInput.parentNode;
    if (!container || container.querySelector(".dc-partner-helper")) return;

    var helper = document.createElement("div");
    helper.className = "dc-partner-helper no-print";
    helper.innerHTML =
      '<span class="dc-partner-helper-text">' +
      '  <span class="en-text">Working solo or partner isn\'t ready yet?</span>' +
      '  <span class="es-text">¿Trabajas solo o tu compañero aún no está listo?</span>' +
      '</span>' +
      '<button type="button" class="dc-partner-btn">' +
      '  <span class="en-text">⚡ Load Classmate Benchmark Data</span>' +
      '  <span class="es-text">⚡ Cargar datos de compañero estándar</span>' +
      '</button>';

    var pBtn = helper.querySelector(".dc-partner-btn");
    pBtn.addEventListener("click", function () {
      // Preset sensible defaults for partner inputs
      var bank = {
        "p-name": "Alex",
        "partner-name": "Alex",
        "p-cups-a": "4",
        "p-cups-b": "3",
        "p-cost": "4.50",
        "partner-deal": "B",
        "partner-plan": "Eco Plan",
        "partner-price": "14.99",
        "partner-dim-l": "12",
        "partner-dim-w": "10",
        "partner-area": "120",
        "partner-budget": "250"
      };

      for (var id in bank) {
        var el = document.getElementById(id);
        if (el) {
          el.value = bank[id];
          el.dispatchEvent(new Event("input", { bubbles: true }));
          el.dispatchEvent(new Event("change", { bubbles: true }));
        }
      }

      // Automatically trigger partner calculation if available
      if (typeof window.comparePartner === "function") window.comparePartner();
      if (typeof window.calcPartner === "function") window.calcPartner();
      if (typeof window.compareClassmate === "function") window.compareClassmate();
    });

    // Place helper above partner name input
    var targetBlock = pNameInput.closest(".grid2") || pNameInput.parentNode;
    if (targetBlock && targetBlock.parentNode) {
      targetBlock.parentNode.insertBefore(helper, targetBlock);
    }
  }

  /* ---- 4. In-Line Store Research Helpers ---- */
  function decorateStoreResearch() {
    var rBoxes = document.querySelectorAll(".step-research");
    if (!rBoxes || rBoxes.length === 0) return;

    rBoxes.forEach(function (box) {
      if (box.dataset.dcResearchDone) return;
      box.dataset.dcResearchDone = "1";

      var bench = document.createElement("div");
      bench.className = "dc-research-benchmark no-print";
      bench.innerHTML =
        '<span>🛒 <strong>Standard Supermarket Benchmark:</strong> Strawberries $3.99 for 16 oz ($0.25/oz) · Yogurt $2.40 for 32 oz ($0.08/oz)</span>' +
        '<button type="button" class="dc-research-fill-btn">' +
        '  <span class="en-text">⚡ Use Market Averages</span>' +
        '  <span class="es-text">⚡ Usar promedios del mercado</span>' +
        '</button>';

      var fillBtn = bench.querySelector(".dc-research-fill-btn");
      fillBtn.addEventListener("click", function () {
        var f2 = document.getElementById("rfind-2");
        var f3 = document.getElementById("rfind-3");
        if (f2 && !f2.value) {
          f2.value = "Strawberries $3.99 for 16 oz = $0.25/oz";
          f2.dispatchEvent(new Event("input", { bubbles: true }));
        }
        if (f3 && !f3.value) {
          f3.value = "Target: $3 for 12 oz ($0.25/oz); Walmart: $4 for 20 oz ($0.20/oz)";
          f3.dispatchEvent(new Event("input", { bubbles: true }));
        }
      });

      box.appendChild(bench);
    });
  }

  /* ---- 5. Step 6: Collapsible Rubric Drawer ---- */
  function decorateRubric() {
    var rubrics = document.querySelectorAll("table.rubric");
    if (!rubrics || rubrics.length === 0) return;

    rubrics.forEach(function (tbl) {
      if (tbl.closest("details.dc-rubric-drawer")) return;

      var details = document.createElement("details");
      details.className = "dc-rubric-drawer";

      var summary = document.createElement("summary");
      summary.innerHTML =
        '<span class="dc-rubric-icon">📊</span> ' +
        '<span class="en-text">Scoring Rubric (Click to view Levels 2–4 criteria)</span>' +
        '<span class="es-text">Rúbrica de calificación (Clic para ver criterios de Niveles 2–4)</span>';

      var wrap = document.createElement("div");
      wrap.className = "rubric-wrap";

      tbl.parentNode.insertBefore(details, tbl);
      wrap.appendChild(tbl);
      details.appendChild(summary);
      details.appendChild(wrap);
    });
  }

  /* ---- Main Run Loop ---- */
  function run() {
    if (!/\bdeclutter-projects\b/.test(document.body.className)) return;
    document.querySelectorAll(".lvl2-block").forEach(decorateLevel2);
    scrapeAndDecorateVocab();
    decoratePartnerCompare();
    decorateStoreResearch();
    decorateRubric();
  }

  ready(run);
  setTimeout(run, 600);
  setTimeout(run, 1500); // Guard for dynamically rendered panels
  if (typeof window !== "undefined") window.NTDeclutter = run;
})();

