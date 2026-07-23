/* ==========================================================================
   Neft Teacher — Manipulative: PARK MAP DESIGNER (data-manip="park-map")
   A coordinate-plane quest for Unit 7 (6.NOS.6-8): plot ordered pairs in all
   four quadrants, find distance between points on a shared line, and reflect
   across an axis. A chain of "placement tickets" fills a 4-quadrant park map:
   each ticket names an attraction and its ordered pair; clicking the correct
   lattice point drops a labeled ride marker (🎢🎡🍔🎪) and unlocks the next
   ticket. One DISTANCE ticket asks how many units apart two aligned points
   are; at L2 a REFLECTION ticket places a mirror-image twin. Wrong plot =>
   a gentle east/west then north/south nudge, unlimited retries. All tickets
   placed => "🗺️ PARK MAP COMPLETE!" payoff.
   Self-mounting + self-styling like the other manip-*.js. Level-aware
   (body.level-0/1/2), bilingual, no-fail. Math is the win condition.
   Usage:  <div class="pki-manip" data-manip="park-map"></div>
   ========================================================================== */
(function () {
  "use strict";
  if (typeof document === "undefined") return;
  var STYLE_ID = "pki-pm-styles";
  var N = 6,
    STEP = 22,
    PAD = 30;
  var W = 2 * N * STEP + 2 * PAD;

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
      ".pki-pm{--pm-ink:#172033;--pm-blue:#2f6bff;--pm-green:#12a150;--pm-amber:#e08a00;font-family:inherit;color:var(--pm-ink)}",
      ".pki-pm h4{margin:0 0 4px;font-size:18px;font-weight:800}",
      ".pki-pm .pm-sub{margin:0 0 12px;font-size:13.5px;color:#5a6478}",
      ".pki-pm .pm-rail{display:flex;gap:8px;margin:0 0 12px}",
      ".pki-pm .pm-pip{flex:1;height:8px;border-radius:99px;background:#e6ebf5}",
      ".pki-pm .pm-pip.done{background:linear-gradient(90deg,var(--pm-green),#0c7c3d)}",
      ".pki-pm .pm-pip.active{background:linear-gradient(90deg,var(--pm-blue),#1748c0)}",
      ".pki-pm .pm-card{border:1px solid rgba(23,32,51,.12);border-radius:14px;padding:14px;background:#fff}",
      ".pki-pm .pm-ticketno{font-size:12px;font-weight:800;letter-spacing:.04em;text-transform:uppercase;color:var(--pm-blue)}",
      ".pki-pm .pm-clue{margin:4px 0 10px;font-size:15px}",
      ".pki-pm .pm-clue .es{display:block;color:#6b7488;font-style:italic;font-size:12.5px;margin-top:2px}",
      ".pki-pm svg{display:block;margin:2px auto 8px;max-width:100%;height:auto;touch-action:manipulation}",
      ".pki-pm .pm-pt{cursor:pointer}",
      ".pki-pm .pm-hover{pointer-events:none;fill:rgba(47,107,255,.22);stroke:var(--pm-blue);stroke-width:2}",
      ".pki-pm .pm-prompt{font-size:13px;font-weight:700;color:#34405a;margin:6px 0 8px}",
      ".pki-pm .pm-opts{display:flex;gap:8px}",
      ".pki-pm .pm-opt{flex:1;cursor:pointer;border:2px solid #d5ddec;background:#f7f9ff;border-radius:11px;padding:12px;font-size:17px;font-weight:800;color:var(--pm-ink);font-variant-numeric:tabular-nums;transition:transform .08s,border-color .12s}",
      ".pki-pm .pm-opt:hover{border-color:var(--pm-blue);transform:translateY(-1px)}",
      ".pki-pm .pm-opt:focus-visible{outline:3px solid rgba(47,107,255,.4);outline-offset:2px}",
      ".pki-pm .pm-opt.wrong{border-color:#d33;animation:pmShake .3s}",
      ".pki-pm .pm-opt:disabled{opacity:.5;cursor:default}",
      ".pki-pm .pm-msg{min-height:20px;margin:10px 0 0;font-size:13.5px;font-weight:700}",
      ".pki-pm .pm-msg.hint{color:var(--pm-amber)}.pki-pm .pm-msg.ok{color:var(--pm-green)}",
      ".pki-pm .pm-drop{animation:pmPop .35s ease-out}",
      ".pki-pm .pm-done{text-align:center;padding:6px 4px 12px}",
      ".pki-pm .pm-stamp{display:inline-block;transform:rotate(-7deg);border:4px solid var(--pm-green);color:var(--pm-green);border-radius:12px;padding:8px 18px;font-size:23px;font-weight:900;letter-spacing:.04em;margin-bottom:6px}",
      ".pki-pm .pm-again{margin-top:12px;cursor:pointer;border:0;background:var(--pm-blue);color:#fff;font-weight:800;border-radius:10px;padding:9px 16px;font-size:14px}",
      "@keyframes pmShake{0%,100%{transform:translateX(0)}25%{transform:translateX(-4px)}75%{transform:translateX(4px)}}",
      "@keyframes pmPop{0%{transform:scale(0);opacity:0}70%{transform:scale(1.25)}100%{transform:scale(1);opacity:1}}",
      "@media (prefers-reduced-motion:reduce){.pki-pm *{animation:none!important;transition:none!important}}",
      "@media (prefers-color-scheme:dark){.pki-pm{color:#eef2fb}.pki-pm .pm-card{background:#1b2233;border-color:rgba(255,255,255,.14)}.pki-pm .pm-opt{background:#232c40;border-color:#39435c;color:#eef2fb}.pki-pm .pm-sub,.pki-pm .pm-clue .es{color:#aeb7cc}}",
    ].join("\n");
    document.head.appendChild(s);
  }

  // ---- Tickets by level -----------------------------------------------------
  // place/reflect: {type,ride,target:{x,y},clue,source?}
  // distance:      {type,a,b,answer,options,clue}
  var TICKETS = {
    0: [
      {
        type: "place",
        ride: "🎢",
        target: { x: 3, y: 2 },
        clue: {
          en: "Put the Roller Coaster 3 east and 2 north — plot (3, 2).",
          es: "Coloca la montaña rusa 3 al este y 2 al norte — marca (3, 2).",
        },
      },
      {
        type: "place",
        ride: "🎡",
        target: { x: 5, y: 4 },
        clue: {
          en: "Put the Ferris Wheel 5 east and 4 north — plot (5, 4).",
          es: "Coloca la rueda de la fortuna 5 al este y 4 al norte — marca (5, 4).",
        },
      },
    ],
    1: [
      {
        type: "place",
        ride: "🎢",
        target: { x: 4, y: -3 },
        clue: {
          en: "Put the Roller Coaster 4 east and 3 south — plot (4, −3).",
          es: "Coloca la montaña rusa 4 al este y 3 al sur — marca (4, −3).",
        },
      },
      {
        type: "place",
        ride: "🎡",
        target: { x: -5, y: 2 },
        clue: {
          en: "Put the Ferris Wheel 5 west and 2 north — plot (−5, 2).",
          es: "Coloca la rueda de la fortuna 5 al oeste y 2 al norte — marca (−5, 2).",
        },
      },
      {
        type: "distance",
        a: { x: -2, y: 5, emoji: "🍔" },
        b: { x: -2, y: -1, emoji: "🚻" },
        answer: 6,
        options: [4, 6, 7],
        clue: {
          en: "The Food Court is at (−2, 5) and the Restrooms at (−2, −1). They share the same x‑value, so they line up on one vertical line. How many units apart are they?",
          es: "La zona de comida está en (−2, 5) y los baños en (−2, −1). Comparten la x, así que están en la misma recta vertical. ¿A cuántas unidades están?",
        },
      },
    ],
    2: [
      {
        type: "place",
        ride: "🎢",
        target: { x: 4, y: -3 },
        clue: {
          en: "Put the Roller Coaster 4 east and 3 south — plot (4, −3).",
          es: "Coloca la montaña rusa 4 al este y 3 al sur — marca (4, −3).",
        },
      },
      {
        type: "place",
        ride: "🍔",
        target: { x: -5, y: 2 },
        clue: {
          en: "Put the Snack Bar 5 west and 2 north — plot (−5, 2).",
          es: "Coloca el puesto de comida 5 al oeste y 2 al norte — marca (−5, 2).",
        },
      },
      {
        type: "distance",
        a: { x: -2, y: 5, emoji: "🍿" },
        b: { x: -2, y: -1, emoji: "🚻" },
        answer: 6,
        options: [4, 6, 7],
        clue: {
          en: "The Popcorn Stand is at (−2, 5) and the Restrooms at (−2, −1). Same x‑value → one vertical line. How many units apart are they? Use |5 − (−1)|.",
          es: "El puesto de palomitas está en (−2, 5) y los baños en (−2, −1). Misma x → una recta vertical. ¿A cuántas unidades? Usa |5 − (−1)|.",
        },
      },
      {
        type: "place",
        ride: "🎪",
        source: { x: 3, y: 4 },
        target: { x: 3, y: -4 },
        clue: {
          en: "A mirror ride reflects the Big Top at (3, 4) across the x‑axis. Place its twin 🎪 at (3, −4).",
          es: "Una atracción espejo refleja la carpa de (3, 4) sobre el eje x. Coloca su gemela 🎪 en (3, −4).",
        },
      },
    ],
  };

  function levelOf() {
    var m = String(document.body.className || "").match(/level-(\d)/);
    return m ? Math.max(0, Math.min(2, parseInt(m[1], 10))) : 1;
  }
  function cx(x) {
    return PAD + (x + N) * STEP;
  }
  function cy(y) {
    return PAD + (N - y) * STEP;
  }
  function fmt(n) {
    return n < 0 ? "−" + -n : "" + n;
  }
  function pair(p) {
    return "(" + fmt(p.x) + ", " + fmt(p.y) + ")";
  }

  // Build the coordinate grid SVG. opts: {placed, ghost, mirror, segment, interactive}
  function gridSVG(opts) {
    var g = "";
    var lo = cy(N),
      hi = cy(-N),
      L = cx(-N),
      R = cx(N);
    for (var i = -N; i <= N; i++) {
      var isAxis = i === 0;
      var col = isAxis ? "#5a6478" : "#dce3f0";
      var wgt = isAxis ? 2 : 1;
      g +=
        '<line x1="' +
        cx(i) +
        '" y1="' +
        lo +
        '" x2="' +
        cx(i) +
        '" y2="' +
        hi +
        '" stroke="' +
        col +
        '" stroke-width="' +
        wgt +
        '"/>';
      g +=
        '<line x1="' +
        L +
        '" y1="' +
        cy(i) +
        '" x2="' +
        R +
        '" y2="' +
        cy(i) +
        '" stroke="' +
        col +
        '" stroke-width="' +
        wgt +
        '"/>';
    }
    // lattice affordance dots
    for (var x = -N; x <= N; x++)
      for (var y = -N; y <= N; y++)
        g += '<circle cx="' + cx(x) + '" cy="' + cy(y) + '" r="1.4" fill="#b7c0d6"/>';
    // axis number labels (every 2, skip origin duplicate)
    for (var k = -N; k <= N; k += 2) {
      if (k === 0) continue;
      g +=
        '<text x="' +
        cx(k) +
        '" y="' +
        (cy(0) + 12) +
        '" text-anchor="middle" font-size="8.5" fill="#8894ad">' +
        k +
        "</text>";
      g +=
        '<text x="' +
        (cx(0) - 7) +
        '" y="' +
        (cy(k) + 3) +
        '" text-anchor="end" font-size="8.5" fill="#8894ad">' +
        k +
        "</text>";
    }
    g +=
      '<text x="' +
      (cx(0) - 6) +
      '" y="' +
      (cy(0) + 12) +
      '" text-anchor="end" font-size="8.5" fill="#8894ad">0</text>';
    g +=
      '<text x="' +
      R +
      '" y="' +
      (cy(0) - 6) +
      '" text-anchor="end" font-size="9" font-weight="700" fill="#5a6478">x</text>';
    g +=
      '<text x="' +
      (cx(0) + 6) +
      '" y="' +
      (lo + 8) +
      '" text-anchor="start" font-size="9" font-weight="700" fill="#5a6478">y</text>';
    // mirror axis highlight (reflection ticket)
    if (opts.mirror === "x")
      g +=
        '<line x1="' +
        L +
        '" y1="' +
        cy(0) +
        '" x2="' +
        R +
        '" y2="' +
        cy(0) +
        '" stroke="#e08a00" stroke-width="3" stroke-dasharray="6 4"/>';
    // ghost source point (reflection reference)
    if (opts.ghost) {
      g += marker(opts.ghost.x, opts.ghost.y, opts.ghost.emoji, 0.45, false);
    }
    // distance connecting segment
    if (opts.segment) {
      var s = opts.segment;
      g +=
        '<line x1="' +
        cx(s.a.x) +
        '" y1="' +
        cy(s.a.y) +
        '" x2="' +
        cx(s.b.x) +
        '" y2="' +
        cy(s.b.y) +
        '" stroke="#12a150" stroke-width="3"/>';
    }
    // placed markers
    (opts.placed || []).forEach(function (mk) {
      g += marker(
        mk.x,
        mk.y,
        mk.emoji,
        1,
        opts.animateLast && mk === opts.placed[opts.placed.length - 1],
      );
    });
    // hover highlight (interactive only)
    if (opts.interactive)
      g += '<circle class="pm-hover" r="10" cx="-99" cy="-99" style="display:none"/>';
    return (
      '<svg viewBox="0 0 ' +
      W +
      " " +
      W +
      '" width="' +
      W +
      '" height="' +
      W +
      '" role="img" aria-label="four-quadrant coordinate grid from -6 to 6"' +
      (opts.interactive ? ' data-plot="1"' : "") +
      ">" +
      g +
      "</svg>"
    );
  }

  function marker(x, y, emoji, opacity, animate) {
    var c =
      '<circle cx="' +
      cx(x) +
      '" cy="' +
      cy(y) +
      '" r="11" fill="#fff" stroke="#2f6bff" stroke-width="2" opacity="' +
      opacity +
      '"/>' +
      '<text x="' +
      cx(x) +
      '" y="' +
      (cy(y) + 5) +
      '" text-anchor="middle" font-size="16" opacity="' +
      opacity +
      '">' +
      emoji +
      "</text>";
    return animate ? '<g class="pm-drop">' + c + "</g>" : "<g>" + c + "</g>";
  }

  function init(el) {
    if (el.dataset.pkiManipDone) return;
    el.dataset.pkiManipDone = "1";
    injectCSS();
    el.classList.add("pki-pm");

    var state = { idx: 0, level: levelOf(), placed: [], seeded: {}, locked: false, animate: false };

    function tickets() {
      return TICKETS[state.level] || TICKETS[1];
    }

    function fromEvent(svg, evt) {
      var r = svg.getBoundingClientRect();
      var pt = evt.touches && evt.touches[0] ? evt.touches[0] : evt;
      var vx = ((pt.clientX - r.left) / r.width) * W;
      var vy = ((pt.clientY - r.top) / r.height) * W;
      var x = Math.round((vx - PAD) / STEP - N);
      var y = Math.round(N - (vy - PAD) / STEP);
      if (x < -N || x > N || y < -N || y > N) return null;
      return { x: x, y: y };
    }

    function render() {
      var T = tickets();
      var total = T.length;
      state.locked = false;
      var rail = '<div class="pm-rail">';
      for (var i = 0; i < total; i++)
        rail +=
          '<div class="pm-pip ' +
          (i < state.idx ? "done" : i === state.idx ? "active" : "") +
          '"></div>';
      rail += "</div>";
      var head =
        "<h4>🗺️ Design the Park Map</h4>" +
        '<p class="pm-sub">Diseña el mapa del parque — plot each attraction on the coordinate grid to fill in the map.</p>' +
        rail;

      if (state.idx >= total) {
        el.innerHTML =
          head +
          '<div class="pm-card pm-done"><div class="pm-stamp">🗺️ PARK MAP COMPLETE!</div>' +
          gridSVG({ placed: state.placed }) +
          '<p style="margin:6px 0 0;font-weight:700">Every attraction is plotted in the right quadrant. Great coordinate work! · ¡Excelente trabajo con las coordenadas!</p>' +
          '<button type="button" class="pm-again" data-again>Design again · Otra vez</button></div>';
        el.querySelector("[data-again]").addEventListener("click", function () {
          state.idx = 0;
          state.placed = [];
          state.seeded = {};
          state.animate = false;
          state.level = levelOf();
          render();
        });
        return;
      }

      var cur = T[state.idx];
      if (cur.type === "distance") return renderDistance(cur, head, total);
      return renderPlot(cur, head, total);
    }

    function renderPlot(cur, head, total) {
      var opts = {
        placed: state.placed,
        interactive: true,
        animateLast: state.animate,
        ghost: cur.source ? { x: cur.source.x, y: cur.source.y, emoji: cur.ride } : null,
        mirror: cur.type === "reflect" || cur.source ? "x" : null,
      };
      el.innerHTML =
        head +
        '<div class="pm-card">' +
        '<div class="pm-ticketno">Ticket ' +
        (state.idx + 1) +
        " of " +
        total +
        "</div>" +
        '<p class="pm-clue">' +
        cur.clue.en +
        '<span class="es">' +
        cur.clue.es +
        "</span></p>" +
        gridSVG(opts) +
        '<p class="pm-prompt">Click the grid point to place it · Haz clic en el punto del plano.</p>' +
        '<p class="pm-msg" data-msg aria-live="polite"></p></div>';
      state.animate = false;
      wirePlot(cur);
    }

    function wirePlot(cur) {
      var svg = el.querySelector("svg[data-plot]");
      var hover = el.querySelector(".pm-hover");
      var msg = el.querySelector("[data-msg]");
      if (!svg) return;
      svg.addEventListener("mousemove", function (e) {
        var p = fromEvent(svg, e);
        if (!p) {
          hover.style.display = "none";
          return;
        }
        hover.setAttribute("cx", cx(p.x));
        hover.setAttribute("cy", cy(p.y));
        hover.style.display = "";
      });
      svg.addEventListener("mouseleave", function () {
        hover.style.display = "none";
      });
      svg.addEventListener("click", function (e) {
        if (state.locked) return;
        var p = fromEvent(svg, e);
        if (!p) return;
        var t = cur.target;
        if (p.x === t.x && p.y === t.y) {
          state.locked = true;
          state.placed.push({ x: t.x, y: t.y, emoji: cur.ride });
          state.animate = true;
          msg.className = "pm-msg ok";
          msg.textContent =
            cur.ride + " Placed at " + pair(t) + "! Next ticket unlocked. · ¡Colocado!";
          setTimeout(function () {
            state.idx++;
            render();
          }, 1050);
        } else {
          msg.className = "pm-msg hint";
          var axis =
            p.x !== t.x
              ? "check east/west (x) first · revisa este/oeste (x)"
              : "now check north/south (y) · revisa norte/sur (y)";
          msg.textContent = "Not there — " + axis + ". You clicked " + pair(p) + ". Try again!";
        }
      });
    }

    function renderDistance(cur, head, total) {
      if (!state.seeded[state.idx]) {
        state.placed.push({ x: cur.a.x, y: cur.a.y, emoji: cur.a.emoji });
        state.placed.push({ x: cur.b.x, y: cur.b.y, emoji: cur.b.emoji });
        state.seeded[state.idx] = true;
      }
      var optsHtml = cur.options
        .map(function (v) {
          return '<button type="button" class="pm-opt" data-v="' + v + '">' + v + " units</button>";
        })
        .join("");
      el.innerHTML =
        head +
        '<div class="pm-card">' +
        '<div class="pm-ticketno">Ticket ' +
        (state.idx + 1) +
        " of " +
        total +
        " · Distance</div>" +
        '<p class="pm-clue">' +
        cur.clue.en +
        '<span class="es">' +
        cur.clue.es +
        "</span></p>" +
        gridSVG({ placed: state.placed, segment: { a: cur.a, b: cur.b } }) +
        '<p class="pm-prompt">Count the units along the green line · Cuenta las unidades en la recta verde:</p>' +
        '<div class="pm-opts">' +
        optsHtml +
        "</div>" +
        '<p class="pm-msg" data-msg aria-live="polite"></p></div>';
      var msg = el.querySelector("[data-msg]");
      el.querySelectorAll(".pm-opt").forEach(function (btn) {
        btn.addEventListener("click", function () {
          if (state.locked) return;
          if (parseInt(btn.dataset.v, 10) === cur.answer) {
            state.locked = true;
            el.querySelectorAll(".pm-opt").forEach(function (b) {
              b.disabled = true;
            });
            msg.className = "pm-msg ok";
            msg.textContent =
              "✓ Exactly — |" +
              fmt(cur.a.y) +
              " − (" +
              fmt(cur.b.y) +
              ")| = " +
              cur.answer +
              " units apart.";
            setTimeout(function () {
              state.idx++;
              render();
            }, 1250);
          } else {
            btn.classList.add("wrong");
            setTimeout(function () {
              btn.classList.remove("wrong");
            }, 350);
            msg.className = "pm-msg hint";
            msg.textContent =
              "Not quite — count each step along the vertical line from " +
              pair(cur.b) +
              " up to " +
              pair(cur.a) +
              ". · Cuenta cada paso.";
          }
        });
      });
    }

    render();

    var obs = new MutationObserver(function () {
      var lv = levelOf();
      if (lv !== state.level && state.idx === 0 && state.placed.length === 0) {
        state.level = lv;
        render();
      }
    });
    obs.observe(document.body, { attributes: true, attributeFilter: ["class"] });
  }

  function scan() {
    document.querySelectorAll('.pki-manip[data-manip="park-map"]').forEach(init);
  }
  ready(scan);
  setTimeout(scan, 900);
  if (typeof window !== "undefined") {
    window.NeftManips = window.NeftManips || {};
    window.NeftManips["park-map"] = init;
  }
})();
