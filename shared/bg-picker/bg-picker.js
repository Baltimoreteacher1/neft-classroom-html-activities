/* ==========================================================================
   Neft Teacher — Background Color Picker (vanilla, zero-dependency)

   Adds a "Colors" button to the project header. Students pick a page
   color (tints the background, cards, panels and tables below the header)
   and a banner color (also the accent for buttons and progress) from
   swatches or a custom color input. Choices persist in localStorage, shared by all four level pages
   (the key is project-wide, not per page).

   Readability is enforced, not hoped for:
     page background  → text (#3b0764) must keep >= 7:1 contrast
     header banner    → white text must keep >= 4.5:1 contrast
   A custom color that fails is nudged to the nearest passing shade and the
   student is told so.
   ========================================================================== */
(function () {
  "use strict";

  var STORE_KEY = "nt_mall_mogul_colors_v1";
  var PAGE_INK = "#3b0764";
  var PAGE_MIN = 7;
  var HEADER_MIN = 4.5;

  // Defaults mirror the page's own look; "Cotton candy" == no change.
  var PAGE_SWATCHES = [
    { name: "Cotton candy (original)", color: "#fdf4ff" },
    { name: "Sky", color: "#e0f2fe" },
    { name: "Mint", color: "#dcfce7" },
    { name: "Sunshine", color: "#fef9c3" },
    { name: "Peach", color: "#ffedd5" },
    { name: "Lavender", color: "#ede9fe" },
    { name: "Rose", color: "#ffe4e6" },
    { name: "Cloud", color: "#f1f5f9" },
    { name: "White", color: "#ffffff" },
  ];
  var HEADER_SWATCHES = [
    {
      name: "Mall pink (original)",
      color: null,
      fill: "linear-gradient(135deg,#581c87,#be185d 40%,#ec4899)",
    },
    { name: "Ocean blue", color: "#0c4a6e" },
    { name: "Forest green", color: "#14532d" },
    { name: "Royal purple", color: "#581c87" },
    { name: "Sunset orange", color: "#9a3412" },
    { name: "Ruby red", color: "#991b1b" },
    { name: "Teal", color: "#115e59" },
    { name: "Midnight", color: "#1e1b4b" },
    { name: "Charcoal", color: "#1f2937" },
  ];

  function hexToRgb(hex) {
    var m = /^#([0-9a-f]{6})$/i.exec(hex);
    if (!m) return null;
    var n = parseInt(m[1], 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  function rgbToHex(c) {
    return (
      "#" +
      c
        .map(function (v) {
          return Math.max(0, Math.min(255, Math.round(v)))
            .toString(16)
            .padStart(2, "0");
        })
        .join("")
    );
  }
  function luminance(c) {
    var l = c.map(function (v) {
      v /= 255;
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * l[0] + 0.7152 * l[1] + 0.0722 * l[2];
  }
  function contrast(a, b) {
    var la = luminance(a);
    var lb = luminance(b);
    return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
  }
  // Move a color toward `target` in small steps until `ratio` against `text` holds.
  function nudge(hex, target, text, ratio) {
    var c = hexToRgb(hex);
    var t = hexToRgb(target);
    var x = hexToRgb(text);
    var step = 0;
    while (contrast(c, x) < ratio && step < 100) {
      step++;
      c = c.map(function (v, i) {
        return v + (t[i] - v) * 0.05;
      });
    }
    return rgbToHex(c);
  }
  function fitPage(hex) {
    return contrast(hexToRgb(hex), hexToRgb(PAGE_INK)) >= PAGE_MIN
      ? hex
      : nudge(hex, "#ffffff", PAGE_INK, PAGE_MIN);
  }
  function fitHeader(hex) {
    return contrast(hexToRgb(hex), [255, 255, 255]) >= HEADER_MIN
      ? hex
      : nudge(hex, "#000000", "#ffffff", HEADER_MIN);
  }
  function headerGradient(hex) {
    var c = hexToRgb(hex);
    var light = rgbToHex(
      c.map(function (v) {
        return v + (255 - v) * 0.18;
      }),
    );
    return "linear-gradient(135deg," + hex + " 0%," + light + " 100%)";
  }
  function tickFor(hex) {
    return luminance(hexToRgb(hex)) > 0.4 ? "#3b0764" : "#ffffff";
  }

  function load() {
    try {
      var s = JSON.parse(localStorage.getItem(STORE_KEY) || "{}");
      return {
        page: /^#[0-9a-f]{6}$/i.test(s.page) ? s.page : null,
        header: /^#[0-9a-f]{6}$/i.test(s.header) ? s.header : null,
      };
    } catch (e) {
      return { page: null, header: null };
    }
  }
  function save(state) {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify(state));
    } catch (e) {
      /* private mode / blocked storage: colors still apply for this visit */
    }
  }

  var root = document.documentElement;
  var state = load();

  function mix(hex, toward, amount) {
    var c = hexToRgb(hex);
    var t = hexToRgb(toward);
    return rgbToHex(
      c.map(function (v, i) {
        return v + (t[i] - v) * amount;
      }),
    );
  }

  // The page color tints every surface below the header; the banner color
  // becomes the accent for buttons, chips, and progress. Each variable
  // replaces one the page already defines, so the whole page re-themes.
  var PAGE_VARS = {
    "--mall-bg": function (p) {
      return p;
    },
    "--mall-cream": function (p) {
      return p;
    },
    "--mall-surface": function (p) {
      return mix(p, "#ffffff", 0.6);
    },
    "--mall-pink-light": function (p) {
      return mix(p, "#000000", 0.06);
    },
    "--mall-purple-light": function (p) {
      return mix(p, "#000000", 0.06);
    },
  };
  var ACCENT_VARS = ["--mall-pink", "--mall-pink-dark", "--mall-purple"];

  function apply() {
    var name;
    if (state.page) {
      root.style.setProperty("--bgp-page", state.page);
      root.setAttribute("data-bgp-page", "");
      for (name in PAGE_VARS) root.style.setProperty(name, PAGE_VARS[name](state.page));
    } else {
      root.style.removeProperty("--bgp-page");
      root.removeAttribute("data-bgp-page");
      for (name in PAGE_VARS) root.style.removeProperty(name);
    }
    if (state.header) {
      root.style.setProperty("--bgp-header", headerGradient(state.header));
      root.setAttribute("data-bgp-header", "");
      ACCENT_VARS.forEach(function (v) {
        root.style.setProperty(v, state.header);
      });
    } else {
      root.style.removeProperty("--bgp-header");
      root.removeAttribute("data-bgp-header");
      ACCENT_VARS.forEach(function (v) {
        root.style.removeProperty(v);
      });
    }
  }
  apply(); // run immediately so a saved color shows before the panel is built

  function build() {
    var header = document.querySelector(".app-header");
    if (!header || document.getElementById("bgpOpen")) return;

    var btn = document.createElement("button");
    btn.type = "button";
    btn.id = "bgpOpen";
    btn.className = "bgp-open no-print";
    btn.setAttribute("aria-expanded", "false");
    btn.setAttribute("aria-controls", "bgpPanel");
    btn.innerHTML = '<span aria-hidden="true">🎨</span> Colors';
    header.appendChild(btn);

    var panel = document.createElement("div");
    panel.id = "bgpPanel";
    panel.className = "bgp-panel no-print";
    panel.setAttribute("role", "dialog");
    panel.setAttribute("aria-labelledby", "bgpTitle");
    panel.hidden = true;
    panel.innerHTML =
      '<div class="bgp-head"><h2 class="bgp-title" id="bgpTitle">Make it yours</h2>' +
      '<button type="button" class="bgp-close" aria-label="Close colors">✕</button></div>' +
      '<fieldset class="bgp-group"><legend>Page &amp; cards</legend>' +
      '<div class="bgp-row" data-group="page"></div>' +
      '<label class="bgp-custom">Your own: <input type="color" id="bgpPageCustom" value="#fdf4ff"></label></fieldset>' +
      '<fieldset class="bgp-group"><legend>Banner &amp; buttons</legend>' +
      '<div class="bgp-row" data-group="header"></div>' +
      '<label class="bgp-custom">Your own: <input type="color" id="bgpHeaderCustom" value="#581c87"></label></fieldset>' +
      '<p class="bgp-note" id="bgpNote" role="status" aria-live="polite"></p>' +
      '<button type="button" class="bgp-reset">Back to original colors</button>';
    document.body.appendChild(panel);

    var note = panel.querySelector("#bgpNote");

    function makeSwatches(group, list) {
      var row = panel.querySelector('[data-group="' + group + '"]');
      list.forEach(function (sw) {
        var b = document.createElement("button");
        b.type = "button";
        b.className = "bgp-sw";
        b.setAttribute("aria-label", sw.name);
        b.title = sw.name;
        b.dataset.color = sw.color || "";
        b.style.background = sw.fill || sw.color;
        b.style.setProperty("--bgp-tick", tickFor(sw.color || "#be185d"));
        b.addEventListener("click", function () {
          setColor(group, sw.color, null);
        });
        row.appendChild(b);
      });
    }
    makeSwatches("page", PAGE_SWATCHES);
    makeSwatches("header", HEADER_SWATCHES);

    function refresh() {
      panel.querySelectorAll(".bgp-sw").forEach(function (b) {
        var group = b.parentNode.dataset.group;
        var cur = state[group] || (group === "page" ? "#fdf4ff" : "");
        if (group === "page" && !state.page) cur = "#fdf4ff";
        b.setAttribute("aria-pressed", String((b.dataset.color || "") === (cur || "")));
      });
      panel.querySelector("#bgpPageCustom").value = state.page || "#fdf4ff";
      panel.querySelector("#bgpHeaderCustom").value = state.header || "#581c87";
    }

    function setColor(group, hex, message) {
      // The original page color is stored as "no override" so future edits to
      // the page's own theme still show through.
      if (group === "page") state.page = hex && hex !== "#fdf4ff" ? fitPage(hex) : null;
      else state.header = hex ? fitHeader(hex) : null;
      var asked = hex && hex.toLowerCase();
      var got = group === "page" ? state.page : state.header;
      note.textContent =
        message ||
        (asked && got && got.toLowerCase() !== asked
          ? "We adjusted that color a little so the words stay easy to read."
          : "");
      save(state);
      apply();
      refresh();
    }

    panel.querySelector("#bgpPageCustom").addEventListener("input", function (e) {
      setColor("page", e.target.value, null);
    });
    panel.querySelector("#bgpHeaderCustom").addEventListener("input", function (e) {
      setColor("header", e.target.value, null);
    });
    panel.querySelector(".bgp-reset").addEventListener("click", function () {
      state = { page: null, header: null };
      note.textContent = "Original colors are back.";
      save(state);
      apply();
      refresh();
    });

    function setOpen(open) {
      panel.hidden = !open;
      btn.setAttribute("aria-expanded", String(open));
      if (open) panel.querySelector(".bgp-close").focus();
    }
    btn.addEventListener("click", function () {
      setOpen(panel.hidden);
    });
    panel.querySelector(".bgp-close").addEventListener("click", function () {
      setOpen(false);
      btn.focus();
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && !panel.hidden) {
        setOpen(false);
        btn.focus();
      }
    });

    refresh();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", build);
  else build();
})();
