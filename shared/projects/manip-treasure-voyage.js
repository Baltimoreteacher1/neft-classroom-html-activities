/* ==========================================================================
   Neft Teacher — Manipulative: TREASURE VOYAGE (data-manip="treasure-voyage")
   A navigation quest for the Coordinate Plane (6.NOS.6-8): plotting an ordered
   pair is how you MOVE. Each leg gives a clue ("3 east, 2 south"); click the
   matching lattice point and your ship sails there, revealing the next clue.
   Chart every leg to reach the treasure. L2 adds a storm that reflects your
   ship across an axis — plot the mirrored point to recover.
   Self-mounting + self-styling like the other manip-*.js. Level-aware
   (body.level-0/1/2), bilingual, no-fail (wrong plot = gentle reef, retry).
   Usage:  <div class="pki-manip" data-manip="treasure-voyage"></div>
   ========================================================================== */
(function () {
  "use strict";
  if (typeof document === "undefined") return;
  var STYLE_ID = "pki-tv-styles";

  function ready(fn) {
    if (document.readyState === "loading")
      document.addEventListener("DOMContentLoaded", fn, { once: true });
    else fn();
  }
  function injectCSS() {
    if (document.getElementById(STYLE_ID)) return;
    var s = document.createElement("style");
    s.id = STYLE_ID;
    s.textContent = [
      ".pki-tv{--tv-ink:#0d2036;font-family:inherit;color:var(--tv-ink)}",
      ".pki-tv h4{margin:0 0 4px;font-size:18px;font-weight:800}",
      ".pki-tv .tv-sub{margin:0 0 12px;font-size:13.5px;color:#5a6478}",
      ".pki-tv .tv-rail{display:flex;gap:8px;margin:0 0 12px}",
      ".pki-tv .tv-pip{flex:1;height:8px;border-radius:99px;background:#e6ebf5}",
      ".pki-tv .tv-pip.done{background:linear-gradient(90deg,#12a150,#0c7c3d)}",
      ".pki-tv .tv-pip.active{background:linear-gradient(90deg,#2f6bff,#1748c0)}",
      ".pki-tv .tv-card{border:1px solid rgba(23,32,51,.12);border-radius:14px;padding:14px;background:linear-gradient(180deg,#eaf4ff,#dcecfb)}",
      ".pki-tv .tv-clue{font-size:15px;font-weight:700;margin:0 0 4px}",
      ".pki-tv .tv-clue .es{display:block;color:#5a6f88;font-style:italic;font-size:12.5px;font-weight:500;margin-top:2px}",
      ".pki-tv svg{display:block;margin:8px auto;max-width:100%;height:auto;touch-action:manipulation}",
      ".pki-tv .tv-dot{fill:#7fa8d8;cursor:pointer;transition:fill .1s,r .1s}",
      ".pki-tv .tv-dot:hover{fill:#2f6bff;r:5}",
      ".pki-tv .tv-msg{min-height:20px;margin:8px 0 0;font-size:13.5px;font-weight:700;text-align:center}",
      ".pki-tv .tv-msg.hint{color:#e08a00}.pki-tv .tv-msg.ok{color:#12a150}",
      ".pki-tv .tv-done{text-align:center;padding:12px}",
      ".pki-tv .tv-x{font-size:30px;font-weight:900;color:#c47b16}",
      ".pki-tv .tv-again{margin-top:12px;cursor:pointer;border:0;background:#2f6bff;color:#fff;font-weight:800;border-radius:10px;padding:9px 16px;font-size:14px}",
      "@media (prefers-reduced-motion:reduce){.pki-tv *{transition:none!important}}",
      "@media (prefers-color-scheme:dark){.pki-tv{color:#eef2fb}.pki-tv .tv-card{background:linear-gradient(180deg,#122a44,#0d2036);border-color:rgba(255,255,255,.14)}.pki-tv .tv-sub{color:#9fb0d6}.pki-tv .tv-clue .es{color:#9fb0d6}}",
    ].join("\n");
    document.head.appendChild(s);
  }

  // Legs: {x,y, clue{en,es}, treasure?} ; storm leg adds {storm:'x'|'y', from:[x,y]}
  var SETS = {
    0: [
      {
        x: 3,
        y: 2,
        clue: {
          en: "Weigh anchor! Sail to 3 east and 2 north — plot (3, 2).",
          es: "¡Zarpa! Navega 3 al este y 2 al norte — ubica (3, 2).",
        },
      },
      {
        x: 1,
        y: 4,
        clue: {
          en: "Now steer to 1 east, 4 north — plot (1, 4).",
          es: "Ahora a 1 al este, 4 al norte — ubica (1, 4).",
        },
      },
      {
        x: 4,
        y: 4,
        clue: {
          en: "The treasure lies at 4 east, 4 north — plot (4, 4).",
          es: "El tesoro está en 4 al este, 4 al norte — ubica (4, 4).",
        },
        treasure: true,
      },
    ],
    1: [
      {
        x: -3,
        y: 2,
        clue: {
          en: "Sail 3 WEST and 2 north — plot (−3, 2).",
          es: "Navega 3 al OESTE y 2 al norte — ubica (−3, 2).",
        },
      },
      {
        x: 2,
        y: -4,
        clue: {
          en: "Steer 2 east and 4 SOUTH — plot (2, −4).",
          es: "2 al este y 4 al SUR — ubica (2, −4).",
        },
      },
      {
        x: -4,
        y: -3,
        clue: {
          en: "Now 4 west and 3 south — plot (−4, −3).",
          es: "4 al oeste y 3 al sur — ubica (−4, −3).",
        },
      },
      {
        x: 5,
        y: -1,
        clue: {
          en: "Treasure at 5 east, 1 south — plot (5, −1).",
          es: "Tesoro en 5 al este, 1 al sur — ubica (5, −1).",
        },
        treasure: true,
      },
    ],
    2: [
      { x: -4, y: 3, clue: { en: "Sail to (−4, 3).", es: "Navega a (−4, 3)." } },
      { x: 3, y: -5, clue: { en: "Steer to (3, −5).", es: "Navega a (3, −5)." } },
      {
        x: 3,
        y: 5,
        storm: "x",
        from: [3, -5],
        clue: {
          en: "STORM! It flipped you across the x-axis. You're at (3, −5) — plot your TRUE mirrored spot.",
          es: "¡TORMENTA! Te volteó sobre el eje x. Estás en (3, −5) — ubica tu punto reflejado.",
        },
      },
      {
        x: -2,
        y: -4,
        clue: { en: "Treasure at (−2, −4) — plot it!", es: "Tesoro en (−2, −4) — ¡ubícalo!" },
        treasure: true,
      },
    ],
  };

  function levelOf() {
    var m = String(document.body.className || "").match(/level-(\d)/);
    return m ? Math.max(0, Math.min(2, parseInt(m[1], 10))) : 1;
  }

  function init(el) {
    if (el.dataset.pkiManipDone) return;
    el.dataset.pkiManipDone = "1";
    injectCSS();
    el.classList.add("pki-tv");
    var level = levelOf();
    var R = 5,
      PAD = 22,
      STEP = 26;
    var SIZE = PAD * 2 + STEP * 2 * R;
    function legs() {
      return SETS[level] || SETS[1];
    }
    var state = { idx: 0, ship: [0, 0] };

    function px(x) {
      return PAD + (x + R) * STEP;
    }
    function py(y) {
      return PAD + (R - y) * STEP;
    }

    function grid(target) {
      var g = "";
      // grid lines
      for (var i = -R; i <= R; i++) {
        var lc = i === 0 ? "#7f93b5" : "#c3d4ea";
        var w = i === 0 ? 2 : 1;
        g +=
          '<line x1="' +
          px(i) +
          '" y1="' +
          py(-R) +
          '" x2="' +
          px(i) +
          '" y2="' +
          py(R) +
          '" stroke="' +
          lc +
          '" stroke-width="' +
          w +
          '"/>';
        g +=
          '<line x1="' +
          px(-R) +
          '" y1="' +
          py(i) +
          '" x2="' +
          px(R) +
          '" y2="' +
          py(i) +
          '" stroke="' +
          lc +
          '" stroke-width="' +
          w +
          '"/>';
      }
      // treasure marker at target
      g +=
        '<text x="' +
        px(target.x) +
        '" y="' +
        (py(target.y) + 6) +
        '" text-anchor="middle" font-size="17" opacity=".55">' +
        (target.treasure ? "💎" : "❓") +
        "</text>";
      // clickable lattice dots
      for (var xx = -R; xx <= R; xx++)
        for (var yy = -R; yy <= R; yy++)
          g +=
            '<circle class="tv-dot" cx="' +
            px(xx) +
            '" cy="' +
            py(yy) +
            '" r="3.4" data-x="' +
            xx +
            '" data-y="' +
            yy +
            '"><title>(' +
            xx +
            ", " +
            yy +
            ")</title></circle>";
      // ship + route trace so far
      g +=
        '<text x="' +
        px(state.ship[0]) +
        '" y="' +
        (py(state.ship[1]) + 7) +
        '" text-anchor="middle" font-size="19">⛵</text>';
      return (
        '<svg width="' +
        SIZE +
        '" height="' +
        SIZE +
        '" viewBox="0 0 ' +
        SIZE +
        " " +
        SIZE +
        '" role="img" aria-label="navigation grid">' +
        g +
        "</svg>"
      );
    }

    function render() {
      var L = legs();
      var total = L.length;
      var rail = '<div class="tv-rail">';
      for (var i = 0; i < total; i++)
        rail +=
          '<div class="tv-pip ' +
          (i < state.idx ? "done" : i === state.idx ? "active" : "") +
          '"></div>';
      rail += "</div>";
      var head =
        "<h4>🗺️ Treasure Voyage</h4>" +
        '<p class="tv-sub">Viaje del tesoro — plot each point to sail there and reach the treasure.</p>' +
        rail;
      if (state.idx >= total) {
        el.innerHTML =
          head +
          '<div class="tv-card tv-done"><div class="tv-x">💎 TREASURE FOUND</div>' +
          '<p style="margin:8px 0 0;font-weight:700">You charted every ordered pair and reached the treasure. Fair winds, Captain!</p>' +
          '<button type="button" class="tv-again" data-again>New voyage</button></div>';
        el.querySelector("[data-again]").addEventListener("click", function () {
          state.idx = 0;
          state.ship = [0, 0];
          level = levelOf();
          render();
        });
        return;
      }
      var leg = L[state.idx];
      // storm legs start the ship at the flipped position
      if (leg.storm && (state.ship[0] !== leg.from[0] || state.ship[1] !== leg.from[1]))
        state.ship = leg.from.slice();
      el.innerHTML =
        head +
        '<div class="tv-card">' +
        '<p class="tv-clue">Leg ' +
        (state.idx + 1) +
        " of " +
        total +
        ": " +
        leg.clue.en +
        '<span class="es">' +
        leg.clue.es +
        "</span></p>" +
        grid(leg) +
        '<p class="tv-msg" data-msg aria-live="polite"></p></div>';
      var msg = el.querySelector("[data-msg]");
      el.querySelectorAll(".tv-dot").forEach(function (dot) {
        dot.addEventListener("click", function () {
          var gx = parseInt(dot.dataset.x, 10),
            gy = parseInt(dot.dataset.y, 10);
          if (gx === leg.x && gy === leg.y) {
            state.ship = [gx, gy];
            msg.className = "tv-msg ok";
            msg.textContent = leg.treasure
              ? "💎 X marks the spot!"
              : "⛵ Anchored at (" + gx + ", " + gy + ").";
            setTimeout(function () {
              state.idx++;
              render();
            }, 850);
          } else {
            msg.className = "tv-msg hint";
            msg.textContent =
              "Reef ahead — that's (" +
              gx +
              ", " +
              gy +
              "). Check east/west (x) then north/south (y).";
          }
        });
      });
    }

    render();
    var obs = new MutationObserver(function () {
      var lv = levelOf();
      if (lv !== level && state.idx === 0) {
        level = lv;
        state.ship = [0, 0];
        render();
      }
    });
    obs.observe(document.body, { attributes: true, attributeFilter: ["class"] });
  }

  function scan() {
    document.querySelectorAll('.pki-manip[data-manip="treasure-voyage"]').forEach(init);
  }
  ready(scan);
  setTimeout(scan, 900);
  if (typeof window !== "undefined") {
    window.NeftManips = window.NeftManips || {};
    window.NeftManips["treasure-voyage"] = init;
  }
})();
