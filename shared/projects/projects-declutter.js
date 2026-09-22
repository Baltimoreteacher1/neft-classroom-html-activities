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

  function triggerInput(el) {
    if (!el) return;
    var evt;
    try {
      var EvtClass = (typeof window !== "undefined" && window.Event) || Event;
      evt = new EvtClass("input", { bubbles: true });
    } catch (_e) {
      evt = document.createEvent("Event");
      evt.initEvent("input", true, true);
    }
    el.dispatchEvent(evt);
  }

  function triggerChange(el) {
    if (!el) return;
    var evt;
    try {
      var EvtClass = (typeof window !== "undefined" && window.Event) || Event;
      evt = new EvtClass("change", { bubbles: true });
    } catch (_e) {
      evt = document.createEvent("Event");
      evt.initEvent("change", true, true);
    }
    el.dispatchEvent(evt);
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
        "</div>" +
        '<button type="button" class="dc-step1-launch-btn">' +
        '  <span class="en-text">Start Building (Step 2) →</span>' +
        '  <span class="es-text">Comenzar a construir (Paso 2) →</span>' +
        "</button>";

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
        '<div class="dc-glossary-term">' +
        item.icon +
        " " +
        item.termHtml +
        "</div>" +
        '<div class="dc-glossary-def">' +
        item.defHtml +
        "</div>" +
        (item.exHtml
          ? '<div class="vocab-ex" style="margin-top:4px">' + item.exHtml + "</div>"
          : "");
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
    var pNameInput =
      document.getElementById("p-name") ||
      document.getElementById("partner-name") ||
      document.getElementById("deal-partner");
    if (!pNameInput || pNameInput.dataset.dcPartnerDone) return;
    pNameInput.dataset.dcPartnerDone = "1";

    var container =
      pNameInput.closest(".card") || pNameInput.closest(".step-panel") || pNameInput.parentNode;
    if (!container || container.querySelector(".dc-partner-helper")) return;

    var helper = document.createElement("div");
    helper.className = "dc-partner-helper no-print";
    helper.innerHTML =
      '<span class="dc-partner-helper-text">' +
      '  <span class="en-text">Working solo or partner isn\'t ready yet?</span>' +
      '  <span class="es-text">¿Trabajas solo o tu compañero aún no está listo?</span>' +
      "</span>" +
      '<button type="button" class="dc-partner-btn">' +
      '  <span class="en-text">⚡ Load Classmate Benchmark Data</span>' +
      '  <span class="es-text">⚡ Cargar datos de compañero estándar</span>' +
      "</button>";

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
        "partner-budget": "250",
      };

      for (var id in bank) {
        var el = document.getElementById(id);
        if (el) {
          el.value = bank[id];
          triggerInput(el);
          triggerChange(el);
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
        "<span>🛒 <strong>Standard Supermarket Benchmark:</strong> Strawberries $3.99 for 16 oz ($0.25/oz) · Yogurt $2.40 for 32 oz ($0.08/oz)</span>" +
        '<button type="button" class="dc-research-fill-btn">' +
        '  <span class="en-text">⚡ Use Market Averages</span>' +
        '  <span class="es-text">⚡ Usar promedios del mercado</span>' +
        "</button>";

      var fillBtn = bench.querySelector(".dc-research-fill-btn");
      fillBtn.addEventListener("click", function () {
        var f2 = document.getElementById("rfind-2");
        var f3 = document.getElementById("rfind-3");
        if (f2 && !f2.value) {
          f2.value = "Strawberries $3.99 for 16 oz = $0.25/oz";
          triggerInput(f2);
        }
        if (f3 && !f3.value) {
          f3.value = "Target: $3 for 12 oz ($0.25/oz); Walmart: $4 for 20 oz ($0.20/oz)";
          triggerInput(f3);
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

  /* ---- 6. Two-Session Pacing Checkpoints ---- */
  function decoratePacingCheckpoints() {
    var stepTrail = document.getElementById("stepTrail");
    if (stepTrail && !document.querySelector(".dc-session-bar")) {
      var sBar = document.createElement("div");
      sBar.className = "dc-session-bar no-print";
      sBar.innerHTML =
        '<span class="dc-session-tag dc-sess-1 active">' +
        '  <span class="en-text">Session 1 · Steps 1–3: The Math Lab</span>' +
        '  <span class="es-text">Sesión 1 · Pasos 1–3: Laboratorio de Matemáticas</span>' +
        "</span>" +
        '<span class="dc-session-tag dc-sess-2">' +
        '  <span class="en-text">Session 2 · Steps 4–6: Defense & Showcase</span>' +
        '  <span class="es-text">Sesión 2 · Pasos 4–6: Defensa y Presentación</span>' +
        "</span>";
      stepTrail.parentNode.insertBefore(sBar, stepTrail);
    }

    // Session 1 Milestone Card at end of Step 3
    var step3 = document.getElementById("step-3") || document.getElementById("step-2");
    if (step3 && !step3.querySelector(".dc-session-milestone")) {
      var milestone = document.createElement("div");
      milestone.className = "dc-session-milestone no-print";
      milestone.innerHTML =
        '<div class="dc-milestone-icon">🏁</div>' +
        '<div class="dc-milestone-body">' +
        "  <h4>" +
        '    <span class="en-text">Session 1 Milestone Reached!</span>' +
        '    <span class="es-text">¡Meta de la Sesión 1 Alcanzada!</span>' +
        "  </h4>" +
        "  <p>" +
        '    <span class="en-text">Great work completing your setup and core calculations! Your progress is saved automatically. Pick up tomorrow at Step 4 for your comparison and mathematical defense.</span>' +
        '    <span class="es-text">¡Excelente trabajo completando tu configuración y cálculos clave! Tu progreso se guarda automáticamente. Continúa mañana en el Paso 4 para tu comparación y defensa matemática.</span>' +
        "  </p>" +
        '  <div class="dc-milestone-actions">' +
        '    <button type="button" class="dc-milestone-savebtn">' +
        '      <span class="en-text">💾 Get My Save Code</span>' +
        '      <span class="es-text">💾 Obtener mi código de guardado</span>' +
        "    </button>" +
        '    <span class="dc-milestone-cont">' +
        '      <span class="en-text">Or click Next Step below to continue →</span>' +
        '      <span class="es-text">O haz clic abajo en Siguiente Paso para continuar →</span>' +
        "    </span>" +
        "  </div>" +
        "</div>";

      var sBtn = milestone.querySelector(".dc-milestone-savebtn");
      sBtn.addEventListener("click", function () {
        if (window.SaveResume && typeof window.SaveResume.openModal === "function") {
          window.SaveResume.openModal();
        } else {
          var code =
            (typeof window !== "undefined" && window.localStorage
              ? window.localStorage.getItem("nt-student-save-code")
              : null) || "WORK-SAVED";
          if (typeof window !== "undefined" && typeof window.alert === "function") {
            window.alert("Your work is saved in this browser! Checkpoint save code: " + code);
          }
        }
      });

      var card = step3.querySelector(".card");
      if (card) {
        card.appendChild(milestone);
      } else {
        step3.appendChild(milestone);
      }
    }
  }

  /* ---- 7. Live Dynamic Visualizer ---- */
  function decorateDynamicVisualizer() {
    if (document.body.dataset.dcVisDone) return;
    document.body.dataset.dcVisDone = "1";

    function pulseSvg(svgEl) {
      if (!svgEl) return;
      svgEl.classList.add("dc-svg-pulse");
      setTimeout(function () {
        svgEl.classList.remove("dc-svg-pulse");
      }, 700);
    }

    function updateVisuals(e) {
      var fruitLbs = document.getElementById("deal-a-lbs");
      var fruitCost = document.getElementById("deal-a-cost");
      var svgDescA = document.getElementById("svg-deal-a-desc");
      var svgRateA = document.getElementById("svg-deal-a-rate");
      if (fruitLbs && fruitCost && svgDescA && svgRateA) {
        var lbs = parseFloat(fruitLbs.value) || 0;
        var cost = parseFloat(fruitCost.value) || 0;
        svgDescA.textContent = lbs + " lbs for $" + cost.toFixed(2);
        svgRateA.textContent = lbs > 0 ? "$" + (cost / lbs).toFixed(2) + " per lb" : "$? per lb";
        pulseSvg(svgDescA.closest("svg"));
      }

      var fruitLbsB = document.getElementById("deal-b-lbs");
      var fruitCostB = document.getElementById("deal-b-cost");
      var svgDescB = document.getElementById("svg-deal-b-desc");
      var svgRateB = document.getElementById("svg-deal-b-rate");
      if (fruitLbsB && fruitCostB && svgDescB && svgRateB) {
        var lbsB = parseFloat(fruitLbsB.value) || 0;
        var costB = parseFloat(fruitCostB.value) || 0;
        svgDescB.textContent = lbsB + " lbs for $" + costB.toFixed(2);
        svgRateB.textContent = lbsB > 0 ? "$" + (costB / lbsB).toFixed(2) + " per lb" : "$? per lb";
        pulseSvg(svgDescB.closest("svg"));
      }

      // If an input inside a card or step with an SVG is edited, pulse the diagram
      if (e && e.target && e.target.tagName === "INPUT") {
        var panel =
          e.target.closest(".step-panel") ||
          e.target.closest(".card") ||
          e.target.closest("section");
        if (panel) {
          var s = panel.querySelector("svg");
          if (s) pulseSvg(s);
        }
      }
    }

    document.addEventListener("input", updateVisuals);
    document.addEventListener("change", updateVisuals);
  }

  /* ---- 8. SPED / ESOL Sentence-Starter Assist ---- */
  function decorateSentenceStarters() {
    var textareas = document.querySelectorAll("textarea");
    if (!textareas || textareas.length === 0) return;

    textareas.forEach(function (ta) {
      if (ta.dataset.dcStarterDone) return;
      ta.dataset.dcStarterDone = "1";

      var id = ta.id || "";
      var starters = [];

      if (id === "pitch") {
        starters = [
          {
            en: "I claim my plan is effective because when I calculated ___, I found ___. Someone might object that ___, but my numbers prove ___.",
            es: "Afirmo que mi plan es efectivo porque al calcular ___, obtuve ___. Alguien podría objetar que ___, pero mis números demuestran ___.",
          },
          {
            en: "My final design uses ___ because dividing ___ by ___ gives ___. Therefore, my recommendation is ___.",
            es: "Mi diseño final utiliza ___ porque al dividir ___ entre ___ da ___. Por lo tanto, mi recomendación es ___.",
          },
        ];
      } else if (id === "peer-reflect") {
        starters = [
          {
            en: "Comparing our plans, my rate was $___ while Alex's rate was $___. My plan is more ___ because ___.",
            es: "Al comparar nuestros planes, mi tasa fue $___ mientras que la de Alex fue $___. Mi plan es más ___ porque ___.",
          },
          {
            en: "We both calculated ___, but we made different decisions about ___ because ___.",
            es: "Ambos calculamos ___, pero tomamos decisiones diferentes sobre ___ porque ___.",
          },
        ];
      } else if (id === "r-math" || id === "r-rep" || id === "r-ready") {
        starters = [
          {
            en: "The calculation that required the most careful thinking was ___ because ___. The strategy that helped me most was ___.",
            es: "El cálculo que requirió mayor atención fue ___ porque ___. La estrategia que más me ayudó fue ___.",
          },
        ];
      } else {
        starters = [
          {
            en: "I know this result is reasonable because when I divide ___ by ___, the quotient represents ___.",
            es: "Sé que este resultado es razonable porque al dividir ___ entre ___, el cociente representa ___.",
          },
          {
            en: "The mathematical evidence for my choice is ___ which shows that ___.",
            es: "La evidencia matemática de mi elección es ___ lo cual muestra que ___.",
          },
        ];
      }

      var drawer = document.createElement("details");
      drawer.className = "dc-starter-drawer no-print";
      drawer.innerHTML =
        "<summary>" +
        "  <span>💡</span>" +
        '  <span class="en-text">Need a sentence starter?</span>' +
        '  <span class="es-text">¿Necesitas ayuda para empezar?</span>' +
        "</summary>" +
        '<div class="dc-starter-content"></div>';

      var content = drawer.querySelector(".dc-starter-content");
      starters.forEach(function (st) {
        var item = document.createElement("div");
        item.className = "dc-starter-item";
        item.innerHTML =
          '<span class="dc-starter-text">' +
          '  <span class="en-text">' +
          st.en +
          "</span>" +
          '  <span class="es-text">' +
          st.es +
          "</span>" +
          "</span>" +
          '<button type="button" class="dc-starter-insert-btn">' +
          '  <span class="en-text">➕ Insert</span>' +
          '  <span class="es-text">➕ Insertar</span>' +
          "</button>";

        item.querySelector(".dc-starter-insert-btn").addEventListener("click", function () {
          var isEs = document.body.classList.contains("es");
          var textToInsert = isEs ? st.es : st.en;
          if (ta.value.trim().length > 0) {
            ta.value += " " + textToInsert;
          } else {
            ta.value = textToInsert;
          }
          triggerInput(ta);
          ta.focus();
        });

        content.appendChild(item);
      });

      ta.parentNode.insertBefore(drawer, ta.nextSibling);
    });
  }

  /* ---- 9. Teacher 1-Click Exemplar Modeling Mode ---- */
  function isTeacherMode() {
    try {
      var storage =
        typeof window !== "undefined" && window.localStorage
          ? window.localStorage
          : typeof localStorage !== "undefined"
            ? localStorage
            : null;
      var v = storage ? (storage.getItem("nt-teacher-mode") || "").toLowerCase() : "";
      return (
        v === "1" ||
        v === "true" ||
        v === "on" ||
        v === "yes" ||
        (typeof document !== "undefined" &&
          document.body &&
          document.body.classList.contains("is-teacher"))
      );
    } catch (_e) {
      return false;
    }
  }

  function decorateTeacherExemplar() {
    if (!isTeacherMode()) return;
    if (document.querySelector(".dc-teacher-exemplar-btn")) return;

    var heroActions =
      document.querySelector(".hero-actions") ||
      document.querySelector(".level-bar") ||
      document.querySelector(".hero");
    if (!heroActions) return;

    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "dc-teacher-exemplar-btn no-print";
    btn.innerHTML =
      "<span>✨</span> " +
      '<span class="en-text">Fill Exemplar Plan (Teacher Demo)</span>' +
      '<span class="es-text">Cargar Plan Ejemplar (Demostración)</span>';

    btn.addEventListener("click", function () {
      var sampleData = {
        "d-students": "738",
        "d-seats": "24",
        "d-budget": "58.50",
        "d-unit-cost": "2.25",
        "d-rope": "12",
        "d-each": "3/4",
        "d-buses": "31",
        "d-packs": "26",
        "d-banners": "16",
        "deal-a-lbs": "5",
        "deal-a-cost": "10.00",
        "deal-b-lbs": "3",
        "deal-b-cost": "7.00",
        "ua-rate": "2.00",
        "ub-rate": "2.33",
        "deal-better": "A",
        "scale-a-2": "6",
        "scale-a-5": "15",
        "scale-a-10": "30",
        "scale-a-20": "60",
        "scale-b-2": "4",
        "scale-b-5": "10",
        "scale-b-10": "20",
        "scale-b-20": "40",
        "p-name": "Alex",
        "p-cups-a": "4",
        "p-cups-b": "3",
        "p-cost": "4.50",
        pitch:
          "I claim my plan is optimal because when I calculated the unit rate, Deal A cost $2.00/lb versus Deal B at $2.33/lb. For a batch of 20 smoothies, our ratio of 3 strawberries to 2 bananas scales accurately to 60 and 40 cups while minimizing ingredient expenses.",
        "peer-reflect":
          "Comparing our smoothies, my cost per smoothie was $4.00 while Alex's was $4.50. My recipe is more cost-effective because buying strawberries in bulk saved $0.33 per pound.",
      };

      for (var id in sampleData) {
        var el = document.getElementById(id);
        if (el) {
          el.value = sampleData[id];
          triggerInput(el);
          triggerChange(el);
        }
      }

      document.querySelectorAll('input[type="checkbox"]').forEach(function (ck) {
        ck.checked = true;
        triggerChange(ck);
      });

      if (typeof window.verifyScalingTable === "function") window.verifyScalingTable();
      if (typeof window.compareDeals === "function") window.compareDeals();
      if (typeof window.comparePartner === "function") window.comparePartner();
      if (typeof window.calcUnitRates === "function") window.calcUnitRates();
      if (typeof window.checkDesign === "function") window.checkDesign();

      if (typeof window !== "undefined" && typeof window.alert === "function") {
        window.alert(
          "✨ Exemplar plan populated! All verification cards updated for whole-class demonstration.",
        );
      }
    });

    heroActions.appendChild(btn);
  }

  /* ---- 10. 1-Page Printable Companion Sheet ---- */
  function decoratePrintCompanion() {
    if (document.querySelector(".dc-print-companion-btn")) return;
    var heroActions = document.querySelector(".hero-actions") || document.querySelector(".hero");
    if (!heroActions) return;

    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "dc-print-companion-btn no-print";
    btn.innerHTML =
      "<span>🖨️</span> " +
      '<span class="en-text">1-Page Companion Sheet</span>' +
      '<span class="es-text">Hoja de trabajo de 1 página</span>';

    btn.addEventListener("click", function () {
      document.body.classList.add("print-companion-mode");
      window.print();
      setTimeout(function () {
        document.body.classList.remove("print-companion-mode");
      }, 1500);
    });

    heroActions.appendChild(btn);
  }

  /* ---- Main Run Loop ---- */
  function run() {
    if (!/\bdeclutter-projects\b/.test(document.body.className)) return;
    document.querySelectorAll(".lvl2-block").forEach(decorateLevel2);
    scrapeAndDecorateVocab();
    decoratePartnerCompare();
    decorateStoreResearch();
    decorateRubric();
    decoratePacingCheckpoints();
    decorateDynamicVisualizer();
    decorateSentenceStarters();
    decorateTeacherExemplar();
    decoratePrintCompanion();
  }

  ready(run);
  setTimeout(run, 600);
  setTimeout(run, 1500); // Guard for dynamically rendered panels
  if (typeof window !== "undefined") window.NTDeclutter = run;
})();
