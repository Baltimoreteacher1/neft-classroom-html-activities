/* ==========================================================================
   Neft Teacher — GAME VISUALS ("See It")

   Adds a calm, opt-in "See It" helper to arcade games: a floating button that
   opens an overlay holding one of the shared, self-contained math
   manipulatives (shared/projects/manip-<name>.js) matched to the game's topic.
   The goal is comprehension — students explore the model behind the questions,
   then return to play. Nothing is graded and nothing leaves the browser.

   Design contract (mirrors the projects-visuals / game-fx layers):
     • Purely additive + defensive: every DOM op guarded; a missing map entry,
       element, or widget is a silent no-op, never a throw.
     • Idempotent: double-injection or re-run is a no-op.
     • Overlay-based, position:fixed — never reflows the game's own layout
       (games range from full-screen canvases to quiz grids).
     • Reuses the proven manip-*.js widgets + their own scoped styles; this
       module only owns the launcher button, overlay, and bilingual framing.
     • Bilingual EN/ES, toggled by the same body.es class game-fx sets from its
       🌐 Language button. The card id (game-visual-helper) is on game-fx's
       translate skip-list so its ES text is authoritative, not auto-translated.
     • Lazy: the widget script loads only on first open (zero cost otherwise).

   Loaded at runtime by assets/game-fx.js, which is already present on every
   arcade game — so no per-game HTML change is needed. Unmapped games get
   nothing.
   ========================================================================== */
(function () {
  "use strict";
  if (typeof document === "undefined") return;
  if (window.__gameVisualsInit) return;
  window.__gameVisualsInit = true;

  /* --- Topic → manipulative map, keyed by the game's top-level folder slug.
     Only confident matches are listed; a game absent from the map shows no
     helper (a mismatched visual would hurt comprehension more than none). --- */
  var MAP = {
    "cartesian-odyssey": {
      manip: "coord-plot",
      data: { range: "10" },
      title: { en: "Plot points on the grid", es: "Marca puntos en la cuadrícula" },
      why: {
        en: "Tap the grid to drop points and read their (x, y). See how the four quadrants change the signs.",
        es: "Toca la cuadrícula para marcar puntos y leer su (x, y). Observa cómo los cuatro cuadrantes cambian los signos.",
      },
    },
    "correlation-playground": {
      manip: "coord-plot",
      data: { range: "10" },
      title: { en: "Plot the data points", es: "Marca los puntos de datos" },
      why: {
        en: "Drop points to build a scatter plot. Watch whether they trend up, down, or scatter — that is correlation.",
        es: "Marca puntos para crear un diagrama de dispersión. Observa si suben, bajan o se dispersan: eso es la correlación.",
      },
    },
    "fractions-soccer": {
      manip: "fraction-bar",
      data: {},
      title: { en: "See the fraction", es: "Ve la fracción" },
      why: {
        en: "Split the bar into equal parts and shade them to picture the fraction before you answer.",
        es: "Divide la barra en partes iguales y sombréalas para ver la fracción antes de responder.",
      },
    },
    "mad-balance-sandbox": {
      manip: "dot-plot",
      data: {},
      title: { en: "Plot the data, find the spread", es: "Marca los datos, halla la dispersión" },
      why: {
        en: "Place each value on the dot plot. Mean Absolute Deviation measures how far the dots sit from the mean.",
        es: "Coloca cada valor en el diagrama de puntos. La desviación media absoluta mide cuánto se alejan los puntos de la media.",
      },
    },
    "sports-analytics": {
      manip: "dot-plot",
      data: {},
      title: { en: "Build a dot plot", es: "Crea un diagrama de puntos" },
      why: {
        en: "Add each data value as a dot. Then read the center, spread, and shape — the story the stats tell.",
        es: "Añade cada valor como un punto. Luego lee el centro, la dispersión y la forma: la historia que cuentan los datos.",
      },
    },
    "netfold-pro": {
      manip: "cube-builder",
      data: {},
      title: { en: "Build the solid from its net", es: "Arma el sólido desde su plantilla" },
      why: {
        en: "Fold the net into a 3-D solid and count the faces. This is how a flat net becomes a prism.",
        es: "Dobla la plantilla en un sólido 3-D y cuenta las caras. Así una plantilla plana se convierte en un prisma.",
      },
    },
    "surface-area-review": {
      manip: "cube-builder",
      data: {},
      title: { en: "See every face", es: "Ve cada cara" },
      why: {
        en: "Build the prism and see all six faces. Surface area is the total area of every face added together.",
        es: "Arma el prisma y observa las seis caras. El área superficial es el área total de todas las caras sumadas.",
      },
    },
    "number-system": {
      manip: "number-line",
      data: { range: "20", unit: "" },
      title: { en: "Place it on the number line", es: "Ubícalo en la recta numérica" },
      why: {
        en: "Tap the line to place a value. Absolute value is its distance from 0 — always positive.",
        es: "Toca la recta para ubicar un valor. El valor absoluto es su distancia desde 0: siempre positivo.",
      },
    },
    ratiolab: {
      manip: "ratio-build",
      data: { "label-a": "part", "label-b": "part", "default-a": "2", "default-b": "3" },
      title: { en: "Build the ratio", es: "Construye la razón" },
      why: {
        en: "Adjust the two amounts and watch the equivalent ratios and unit rate update together.",
        es: "Ajusta las dos cantidades y observa cómo se actualizan las razones equivalentes y la tasa unitaria.",
      },
    },
    "ratios-proportions": {
      manip: "ratio-build",
      data: { "label-a": "part", "label-b": "part", "default-a": "2", "default-b": "3" },
      title: { en: "Build the ratio", es: "Construye la razón" },
      why: {
        en: "Scale both amounts up and down to see equivalent ratios — the heart of a proportion.",
        es: "Aumenta y disminuye ambas cantidades para ver razones equivalentes: la base de una proporción.",
      },
    },
    "world-architect-math-project": {
      manip: "area-tiler",
      data: {},
      title: { en: "Tile the area", es: "Cubre el área" },
      why: {
        en: "Fill the shape with unit tiles. Area is the number of unit squares it takes to cover it.",
        es: "Llena la figura con azulejos unitarios. El área es la cantidad de cuadrados unitarios que la cubren.",
      },
    },
  };

  /* Whitelist of widgets we are allowed to load (defense-in-depth vs the map). */
  var ALLOWED = {
    "coord-plot": 1,
    "fraction-bar": 1,
    "dot-plot": 1,
    "cube-builder": 1,
    "number-line": 1,
    "ratio-build": 1,
    "area-tiler": 1,
  };

  function slug() {
    var parts = String(location.pathname || "")
      .split("/")
      .filter(Boolean);
    return parts.length ? parts[0].toLowerCase() : "";
  }

  function ready(fn) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", fn, { once: true });
    } else {
      fn();
    }
  }

  function biSpan(en, es) {
    var wrap = document.createElement("span");
    var a = document.createElement("span");
    a.className = "gv-en";
    a.textContent = en;
    var b = document.createElement("span");
    b.className = "gv-es";
    b.textContent = es;
    wrap.appendChild(a);
    wrap.appendChild(b);
    return wrap;
  }

  function injectStyle() {
    if (document.getElementById("gv-style")) return;
    var css =
      /* Toolbar-button form (default: appended to #game-pub-toolbar) */
      "#gv-launch{display:inline-flex;align-items:center;gap:6px;cursor:pointer;" +
      "background:#0e9a8c;color:#fff;border:1px solid rgba(255,255,255,.25);border-radius:8px;" +
      "padding:6px 12px;font:600 13px system-ui,-apple-system,sans-serif;box-shadow:0 4px 12px rgba(0,0,0,.2)}" +
      "#gv-launch:hover{background:#0c887c}" +
      /* Floating fallback when no toolbar exists on the page */
      "#gv-launch.gv-float{position:fixed;left:12px;top:12px;z-index:100000;border:2px solid #fff;" +
      "border-radius:999px;padding:9px 15px;font-size:14px;box-shadow:0 4px 14px rgba(0,0,0,.28)}" +
      "#gv-launch:focus-visible{outline:3px solid #ffd54a;outline-offset:2px}" +
      "#gv-backdrop{position:fixed;inset:0;z-index:100000;background:rgba(8,14,24,.6);display:none}" +
      "#gv-backdrop.gv-open{display:block}" +
      "#game-visual-helper{position:fixed;z-index:100001;left:50%;top:50%;transform:translate(-50%,-50%);" +
      "width:min(680px,94vw);max-height:90vh;overflow:auto;background:#fff;color:#172033;border-radius:18px;" +
      "box-shadow:0 18px 60px rgba(0,0,0,.4);padding:20px;display:none;font:15px/1.5 system-ui,-apple-system,sans-serif}" +
      "#game-visual-helper.gv-open{display:block}" +
      "#game-visual-helper h2{margin:0 0 4px;font-size:1.3rem;display:flex;align-items:center;gap:8px}" +
      "#game-visual-helper .gv-why{margin:0 0 14px;color:#3a4a5e;font-size:1rem}" +
      "#gv-close{position:absolute;top:12px;right:14px;width:36px;height:36px;border-radius:10px;border:2px solid #e4ebf2;" +
      "background:#fff;color:#172033;font-size:20px;font-weight:700;cursor:pointer;line-height:1}" +
      "#gv-close:hover{background:#f4f8ff}" +
      ".gv-badge{background:#0e9a8c;color:#fff;border-radius:999px;padding:2px 10px;font-size:.72rem;font-weight:700;letter-spacing:.03em;text-transform:uppercase}" +
      ".gv-es{display:none}body.es .gv-en{display:none}body.es .gv-es{display:inline}" +
      "@media print{#gv-launch,#gv-backdrop,#game-visual-helper{display:none!important}}";
    var s = document.createElement("style");
    s.id = "gv-style";
    s.textContent = css;
    document.head.appendChild(s);
  }

  var loadedWidgets = {};
  function loadWidget(manip) {
    if (loadedWidgets[manip]) return;
    loadedWidgets[manip] = 1;
    var src = "/shared/projects/manip-" + manip + ".js";
    if (document.querySelector('script[src="' + src + '"]')) return;
    var s = document.createElement("script");
    s.src = src;
    s.defer = true;
    document.body.appendChild(s);
  }

  ready(function () {
    try {
      var cfg = MAP[slug()];
      if (!cfg || !ALLOWED[cfg.manip]) return;
      if (document.getElementById("gv-launch")) return;

      injectStyle();

      /* Launcher — prefer the existing game control toolbar (collision-free,
         consistent with the other controls); float top-left if none exists. */
      var btn = document.createElement("button");
      btn.id = "gv-launch";
      btn.type = "button";
      btn.className = "no-print";
      btn.setAttribute("aria-haspopup", "dialog");
      btn.setAttribute("aria-expanded", "false");
      var eye = document.createElement("span");
      eye.setAttribute("aria-hidden", "true");
      eye.textContent = "🔎";
      btn.appendChild(eye);
      btn.appendChild(biSpan(" See It", " Míralo"));
      var toolbar = document.getElementById("game-pub-toolbar");
      if (toolbar) {
        toolbar.appendChild(btn);
      } else {
        btn.classList.add("gv-float");
        document.body.appendChild(btn);
      }

      /* Overlay (built once, widget mounted lazily on first open) */
      var backdrop = document.createElement("div");
      backdrop.id = "gv-backdrop";
      backdrop.className = "no-print";

      var panel = document.createElement("div");
      panel.id = "game-visual-helper";
      panel.className = "no-print";
      panel.setAttribute("role", "dialog");
      panel.setAttribute("aria-modal", "true");
      panel.setAttribute("aria-label", "Math visual helper");

      var close = document.createElement("button");
      close.id = "gv-close";
      close.type = "button";
      close.setAttribute("aria-label", "Close");
      close.textContent = "×";
      panel.appendChild(close);

      var h = document.createElement("h2");
      var badge = document.createElement("span");
      badge.className = "gv-badge";
      badge.appendChild(biSpan("See it — no grade", "Míralo — sin nota"));
      h.appendChild(biSpan(cfg.title.en, cfg.title.es));
      h.appendChild(badge);
      panel.appendChild(h);

      var why = document.createElement("p");
      why.className = "gv-why";
      why.appendChild(biSpan(cfg.why.en, cfg.why.es));
      panel.appendChild(why);

      var mount = document.createElement("div");
      mount.className = "gv-mount";
      panel.appendChild(mount);

      document.body.appendChild(backdrop);
      document.body.appendChild(panel);

      var mounted = false;
      function open() {
        if (!mounted) {
          mounted = true;
          /* Container must exist BEFORE the widget script executes: every
             manip-*.js self-scans for its container on load, which hydrates it
             even for widgets without a NeftManips late-mount bridge. */
          var holder = document.createElement("div");
          holder.className = "pki-manip";
          holder.setAttribute("data-manip", cfg.manip);
          var data = cfg.data || {};
          Object.keys(data).forEach(function (k) {
            if (/^[a-z][a-z0-9-]*$/.test(k)) holder.setAttribute("data-" + k, String(data[k]));
          });
          mount.appendChild(holder);
          loadWidget(cfg.manip);
        }
        backdrop.classList.add("gv-open");
        panel.classList.add("gv-open");
        btn.setAttribute("aria-expanded", "true");
        close.focus();
      }
      function hide() {
        backdrop.classList.remove("gv-open");
        panel.classList.remove("gv-open");
        btn.setAttribute("aria-expanded", "false");
        btn.focus();
      }

      btn.addEventListener("click", open);
      close.addEventListener("click", hide);
      backdrop.addEventListener("click", hide);
      document.addEventListener("keydown", function (e) {
        if (e.key === "Escape" && panel.classList.contains("gv-open")) hide();
      });
    } catch (_e) {
      /* never break a game */
    }
  });
})();
