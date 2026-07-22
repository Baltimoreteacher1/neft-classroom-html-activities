/* Design Twist — the client calls back. An advanced revision challenge for
 * every culminating project: the client changes a real constraint, and the
 * student must show how the plan AND the mathematics change. Optional,
 * invitation-style (collapsed details), bilingual EN/ES inline, evidence kept
 * in localStorage beside the Community Math Studio store.
 *
 * Injected by tools/inject-projects-twist.mjs; self-scopes via
 * projects-twist-config.json — pages without an entry render nothing. */
(function () {
  "use strict";
  if (typeof document === "undefined") return;

  var CONFIG_URL = "/shared/projects/projects-twist-config.json?v=20260722";
  var STORE_KEY = "nt-design-twist:v1:" + location.pathname;
  var MIN_PLAN = 12;

  var state = load();

  function load() {
    try {
      return JSON.parse(localStorage.getItem(STORE_KEY)) || {};
    } catch (_error) {
      return {};
    }
  }

  function save() {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify(state));
    } catch (_error) {}
    document.dispatchEvent(new CustomEvent("neft:design-twist-updated", { detail: state }));
  }

  function esc(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function bi(en, es) {
    return (
      '<span class="ntdt-en">' +
      esc(en) +
      '</span><span class="ntdt-es" lang="es">' +
      esc(es) +
      "</span>"
    );
  }

  function render(entry) {
    var host = document.createElement("section");
    host.className = "ntdt";
    host.setAttribute("aria-label", "Design Twist challenge");
    var details = document.createElement("details");
    details.className = "ntdt-card";
    if (state.twist != null || state.done) details.open = true;
    details.innerHTML =
      "<summary><span aria-hidden='true'>🌀</span><span>" +
      bi("Design Twist — the client calls back", "Giro de diseño — el cliente vuelve a llamar") +
      "</span><span class='ntdt-tag'>" +
      bi("Advanced challenge", "Reto avanzado") +
      "</span></summary>";
    var body = document.createElement("div");
    body.className = "ntdt-body";
    body.innerHTML =
      "<p class='ntdt-lead'>" +
      bi(
        "Real designers revise. The client just changed one constraint — choose the call you take, then show how your plan and your math change.",
        "Los diseñadores de verdad revisan. El cliente cambió una condición — elige la llamada que aceptas y muestra cómo cambian tu plan y tu matemática.",
      ) +
      "</p>";

    var chips = document.createElement("div");
    chips.className = "ntdt-chips";
    chips.setAttribute("role", "group");
    chips.setAttribute("aria-label", "Choose your twist");
    entry.twists.forEach(function (twist, index) {
      var chip = document.createElement("button");
      chip.type = "button";
      chip.className = "ntdt-chip";
      chip.innerHTML =
        "<b>" +
        bi("Call " + (index + 1), "Llamada " + (index + 1)) +
        "</b>" +
        bi(twist.en, twist.es);
      chip.setAttribute("aria-pressed", String(state.twist === index));
      chip.addEventListener("click", function () {
        state.twist = index;
        save();
        Array.prototype.forEach.call(chips.children, function (other) {
          other.setAttribute("aria-pressed", "false");
        });
        chip.setAttribute("aria-pressed", "true");
        work.hidden = false;
        refresh();
      });
      chips.appendChild(chip);
    });
    body.appendChild(chips);

    var work = document.createElement("div");
    work.className = "ntdt-work";
    work.hidden = state.twist == null;

    var planLabel = document.createElement("label");
    planLabel.innerHTML = bi("What changes in your plan?", "¿Qué cambia en tu plan?");
    var plan = document.createElement("textarea");
    plan.rows = 3;
    plan.value = state.plan || "";
    plan.placeholder = "Before, we… Now, we… / Antes… Ahora…";
    planLabel.appendChild(plan);
    work.appendChild(planLabel);

    var mathLabel = document.createElement("label");
    mathLabel.innerHTML = bi(
      "How does the math change? Show it.",
      "¿Cómo cambia la matemática? Muéstralo.",
    );
    var math = document.createElement("textarea");
    math.rows = 3;
    math.value = state.math || "";
    math.placeholder = "Old numbers → new numbers… / Números anteriores → nuevos…";
    mathLabel.appendChild(math);
    work.appendChild(mathLabel);

    var button = document.createElement("button");
    button.type = "button";
    button.className = "ntdt-btn";
    button.innerHTML = bi("Deliver the revision 🏆", "Entregar la revisión 🏆");
    var ready = function () {
      return (
        state.twist != null &&
        plan.value.trim().length >= MIN_PLAN &&
        math.value.trim().length >= MIN_PLAN
      );
    };
    var refresh = function () {
      button.disabled = !ready();
    };
    plan.addEventListener("input", function () {
      state.plan = plan.value;
      save();
      refresh();
    });
    math.addEventListener("input", function () {
      state.math = math.value;
      save();
      refresh();
    });
    button.addEventListener("click", function () {
      state.done = true;
      save();
      finish();
    });
    refresh();
    work.appendChild(button);
    body.appendChild(work);

    var status = document.createElement("p");
    status.className = "ntdt-status";
    status.setAttribute("aria-live", "polite");
    body.appendChild(status);

    function finish() {
      if (!body.querySelector(".ntdt-done")) {
        var done = document.createElement("p");
        done.className = "ntdt-done";
        done.innerHTML =
          "<strong>" +
          bi(
            "🏆 Revision delivered — that's what professionals do.",
            "🏆 Revisión entregada — eso hacen los profesionales.",
          ) +
          "</strong>";
        body.appendChild(done);
      }
      status.innerHTML = bi("Design Twist complete.", "Giro de diseño completo.");
    }
    if (state.done) finish();

    details.appendChild(body);
    host.appendChild(details);
    var anchor = document.querySelector("main") || document.body;
    anchor.appendChild(host);
  }

  function boot() {
    fetch(CONFIG_URL)
      .then(function (response) {
        return response.ok ? response.json() : null;
      })
      .then(function (config) {
        var entry = config && config.projects && config.projects[location.pathname];
        if (!entry || !Array.isArray(entry.twists) || !entry.twists.length) return;
        render(entry);
      })
      .catch(function () {
        /* offline — the project works exactly as before */
      });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
