/* ==========================================================================
   Neft Teacher — Manipulative: STAT DRAFT (data-manip="stat-draft")
   A class-data war-room for Statistics (6.DS.3-6). Read a data set of daily
   values on a live dot plot with mean + median markers. On outlier cases,
   press "Add the outlier day" and watch the MEAN lurch toward it while the
   MEDIAN barely moves — then pick the measure that best describes a TYPICAL
   day. Correct reads win the case; clear the board => board solved.
   Self-mounting + self-styling like the other manip-*.js. Level-aware
   (body.level-0/1/2), bilingual, no-fail (wrong pick = a coached retry).
   Usage:  <div class="pki-manip" data-manip="stat-draft"></div>
   ========================================================================== */
(function () {
  "use strict";
  if (typeof document === "undefined") return;
  var STYLE_ID = "pki-sd-styles";

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
      ".pki-sd{--sd-ink:#172033;--sd-blue:#2f6bff;--sd-green:#12a150;--sd-red:#d33;font-family:inherit;color:var(--sd-ink)}",
      ".pki-sd h4{margin:0 0 4px;font-size:18px;font-weight:800}",
      ".pki-sd .sd-sub{margin:0 0 12px;font-size:13.5px;color:#5a6478}",
      ".pki-sd .sd-rail{display:flex;gap:8px;margin:0 0 12px}",
      ".pki-sd .sd-pip{flex:1;height:8px;border-radius:99px;background:#e6ebf5}",
      ".pki-sd .sd-pip.done{background:linear-gradient(90deg,var(--sd-green),#0c7c3d)}",
      ".pki-sd .sd-pip.active{background:linear-gradient(90deg,var(--sd-blue),#1748c0)}",
      ".pki-sd .sd-card{border:1px solid rgba(23,32,51,.12);border-radius:14px;padding:14px;background:#fff}",
      ".pki-sd .sd-player{font-size:12px;font-weight:800;letter-spacing:.04em;text-transform:uppercase;color:var(--sd-blue)}",
      ".pki-sd .sd-need{margin:4px 0 8px;font-size:14.5px}",
      ".pki-sd .sd-need .es{display:block;color:#6b7488;font-style:italic;font-size:12.5px;margin-top:2px}",
      ".pki-sd svg{display:block;margin:6px auto;max-width:100%;height:auto}",
      ".pki-sd .sd-stats{display:flex;gap:8px;margin:8px 0 0}",
      ".pki-sd .sd-stat{flex:1;text-align:center;border:2px solid #e2e8f6;border-radius:10px;padding:8px 4px;font-size:12px;font-weight:700;color:#5a6478}",
      ".pki-sd .sd-stat b{display:block;font-size:18px;font-variant-numeric:tabular-nums}",
      ".pki-sd .sd-stat.mean b{color:#c0392b}.pki-sd .sd-stat.median b{color:#1f7a3f}",
      ".pki-sd .sd-outbtn{margin:10px 0 0;width:100%;cursor:pointer;border:0;background:#0f172a;color:#fff;font-weight:800;border-radius:10px;padding:10px;font-size:14px}",
      ".pki-sd .sd-q{margin:12px 0 6px;font-size:14px;font-weight:800}",
      ".pki-sd .sd-picks{display:flex;gap:8px}",
      ".pki-sd .sd-pick{flex:1;cursor:pointer;border:2px solid #d5ddec;background:#f7f9ff;border-radius:11px;padding:12px;font-size:15px;font-weight:800;color:var(--sd-ink)}",
      ".pki-sd .sd-pick:hover{border-color:var(--sd-blue);transform:translateY(-1px)}",
      ".pki-sd .sd-pick.wrong{border-color:var(--sd-red);animation:sdShake .3s}",
      ".pki-sd .sd-pick:disabled{opacity:.5;cursor:default}",
      ".pki-sd .sd-msg{min-height:20px;margin:10px 0 0;font-size:13.5px;font-weight:700}",
      ".pki-sd .sd-msg.hint{color:#e08a00}.pki-sd .sd-msg.ok{color:var(--sd-green)}",
      ".pki-sd .sd-done{text-align:center;padding:14px}",
      ".pki-sd .sd-lock{font-size:26px;font-weight:900;color:var(--sd-green)}",
      ".pki-sd .sd-again{margin-top:12px;cursor:pointer;border:0;background:var(--sd-blue);color:#fff;font-weight:800;border-radius:10px;padding:9px 16px;font-size:14px}",
      "@keyframes sdShake{0%,100%{transform:translateX(0)}25%{transform:translateX(-4px)}75%{transform:translateX(4px)}}",
      ".pki-sd .sd-mk{transition:transform .5s}",
      "@media (prefers-reduced-motion:reduce){.pki-sd *{transition:none!important;animation:none!important}}",
      "@media (prefers-color-scheme:dark){.pki-sd{color:#eef2fb}.pki-sd .sd-card{background:#1b2233;border-color:rgba(255,255,255,.14)}.pki-sd .sd-stat,.pki-sd .sd-pick{background:#232c40;border-color:#39435c;color:#eef2fb}.pki-sd .sd-sub,.pki-sd .sd-need .es{color:#aeb7cc}}",
    ].join("\n");
    document.head.appendChild(s);
  }

  // Case: {name, scores[], outlier?, answer:'mean'|'median', need{en,es}, why}
  var SETS = {
    0: [
      {
        name: "Room 6 · Quiz scores",
        scores: [8, 9, 7, 10, 8],
        outlier: 30,
        answer: "median",
        need: {
          en: "The case: find a STEADY, typical value. Which measure fits?",
          es: "El caso pide un valor CONSTANTE y típico. ¿Qué medida sirve?",
        },
        why: "One huge day pulled the mean way up. The median ignores that spike.",
      },
      {
        name: "Mr. N.s class · Recess laps",
        scores: [12, 13, 11, 12, 13],
        answer: "mean",
        need: {
          en: "Scores are close together — no wild days. Best typical measure?",
          es: "Los datos son parecidos, sin valores raros. ¿Mejor medida típica?",
        },
        why: "With no outlier, the mean uses every day fairly.",
      },
    ],
    1: [
      {
        name: "Room 6 · Quiz scores",
        scores: [12, 14, 13, 15, 11, 14],
        outlier: 40,
        answer: "median",
        need: {
          en: "The case: which single number best describes a typical day?",
          es: "El caso: ¿qué número describe mejor un día típico?",
        },
        why: "The 40-point day yanks the mean up; the median stays near the real level.",
      },
      {
        name: "Mr. N.s class · Recess laps",
        scores: [20, 22, 21, 23, 19, 21],
        answer: "mean",
        need: {
          en: "Steady data, no blow-up days. Best measure of a typical day?",
          es: "Datos estables, sin valores extremos. ¿Mejor medida típica?",
        },
        why: "No outlier — the mean summarizes all six days well.",
      },
      {
        name: "Book Club · Reading minutes",
        scores: [6, 7, 5, 8, 6, 7],
        outlier: 28,
        answer: "median",
        need: {
          en: "One huge value vs an off day — describe the TYPICAL day.",
          es: "Un valor enorme vs un día bajo — describe el día TÍPICO.",
        },
        why: "The outlier inflates the mean; the median resists it.",
      },
    ],
    2: [
      {
        name: "Room 6 · Quiz scores",
        scores: [18, 21, 19, 22, 20, 19],
        outlier: 55,
        answer: "median",
        need: {
          en: "A 55-point explosion is in the data. Which measure tells the TRUTH about a typical day?",
          es: "Hay un valor extremo de 55. ¿Qué medida dice la VERDAD del día típico?",
        },
        why: "Extreme outlier → mean is misleading; median is the robust center.",
      },
      {
        name: "Mr. N.s class · Recess laps",
        scores: [24, 26, 25, 27, 23, 26],
        answer: "mean",
        need: {
          en: "Tight, consistent range. Best single number for a typical day?",
          es: "Rango ajustado y consistente. ¿Mejor número típico?",
        },
        why: "Symmetric with no outlier — the mean is the fair summary.",
      },
      {
        name: "Book Club · Reading minutes",
        scores: [9, 11, 10, 12, 8, 2],
        outlier: null,
        answer: "median",
        need: {
          en: "A very low day (2) drags things down. Best TYPICAL measure?",
          es: "Un día bajo de 2 baja el promedio. ¿Mejor medida TÍPICA?",
        },
        why: "The low outlier pulls the mean down; the median holds the typical level.",
      },
    ],
  };

  function levelOf() {
    var m = String(document.body.className || "").match(/level-(\d)/);
    return m ? Math.max(0, Math.min(2, parseInt(m[1], 10))) : 1;
  }
  function mean(a) {
    return (
      a.reduce(function (s, v) {
        return s + v;
      }, 0) / a.length
    );
  }
  function median(a) {
    var b = a.slice().sort(function (x, y) {
      return x - y;
    });
    var n = b.length,
      m = n >> 1;
    return n % 2 ? b[m] : (b[m - 1] + b[m]) / 2;
  }
  function r1(n) {
    return Math.round(n * 10) / 10;
  }

  function init(el) {
    if (el.dataset.pkiManipDone) return;
    el.dataset.pkiManipDone = "1";
    injectCSS();
    el.classList.add("pki-sd");
    var level = levelOf();
    function cases() {
      return SETS[level] || SETS[1];
    }
    var state = { idx: 0, added: false };

    function dotplot(scores, meanV, medV) {
      var maxV = Math.max.apply(null, scores.concat([medV, meanV])) + 2;
      var W = 320,
        H = 108,
        PADL = 12,
        PADR = 12,
        axisY = 74;
      var sx = function (v) {
        return PADL + (v / maxV) * (W - PADL - PADR);
      };
      var g =
        '<line x1="' +
        PADL +
        '" y1="' +
        axisY +
        '" x2="' +
        (W - PADR) +
        '" y2="' +
        axisY +
        '" stroke="#8894ad" stroke-width="2"/>';
      // ticks
      for (var t = 0; t <= maxV; t += Math.ceil(maxV / 6)) {
        g +=
          '<line x1="' +
          sx(t) +
          '" y1="' +
          axisY +
          '" x2="' +
          sx(t) +
          '" y2="' +
          (axisY + 4) +
          '" stroke="#8894ad"/>';
        g +=
          '<text x="' +
          sx(t) +
          '" y="' +
          (axisY + 16) +
          '" text-anchor="middle" font-size="9" fill="#8894ad">' +
          t +
          "</text>";
      }
      // stack dots
      var counts = {};
      scores
        .slice()
        .sort(function (a, b) {
          return a - b;
        })
        .forEach(function (v) {
          counts[v] = (counts[v] || 0) + 1;
          g +=
            '<circle cx="' +
            sx(v) +
            '" cy="' +
            (axisY - 8 - (counts[v] - 1) * 11) +
            '" r="4.5" fill="#4f7fd8"/>';
        });
      // median marker (green line) + mean marker (red triangle, animated)
      g +=
        '<line class="sd-mk" x1="' +
        sx(medV) +
        '" y1="14" x2="' +
        sx(medV) +
        '" y2="' +
        axisY +
        '" stroke="#1f7a3f" stroke-width="2.5" stroke-dasharray="4 3"/>';
      g +=
        '<text x="' +
        sx(medV) +
        '" y="11" text-anchor="middle" font-size="9" font-weight="700" fill="#1f7a3f">median</text>';
      g +=
        '<polygon class="sd-mk" points="' +
        (sx(meanV) - 6) +
        "," +
        axisY +
        " " +
        (sx(meanV) + 6) +
        "," +
        axisY +
        " " +
        sx(meanV) +
        "," +
        (axisY - 9) +
        '" fill="#c0392b"><title>mean</title></polygon>';
      g +=
        '<text x="' +
        sx(meanV) +
        '" y="' +
        (axisY + 28) +
        '" text-anchor="middle" font-size="9" font-weight="700" fill="#c0392b">mean</text>';
      return (
        '<svg viewBox="0 0 ' +
        W +
        " " +
        H +
        '" width="' +
        W +
        '" height="' +
        H +
        '" role="img" aria-label="dot plot with mean and median">' +
        g +
        "</svg>"
      );
    }

    function render() {
      var C = cases();
      var total = C.length;
      var rail = '<div class="sd-rail">';
      for (var i = 0; i < total; i++)
        rail +=
          '<div class="sd-pip ' +
          (i < state.idx ? "done" : i === state.idx ? "active" : "") +
          '"></div>';
      rail += "</div>";
      var head =
        "<h4>🔍 Data Detective</h4>" +
        '<p class="sd-sub">Detective de datos — lee los datos y elige la medida que dice la verdad.</p>' +
        rail;
      if (state.idx >= total) {
        el.innerHTML =
          head +
          '<div class="sd-card sd-done"><div class="sd-lock">📋 DRAFT LOCKED</div>' +
          '<p style="margin:8px 0 0;font-weight:700">You picked the right measure of center on every scout — outliers didn\'t fool you.</p>' +
          '<button type="button" class="sd-again" data-again>New case</button></div>';
        el.querySelector("[data-again]").addEventListener("click", function () {
          state.idx = 0;
          state.added = false;
          level = levelOf();
          render();
        });
        return;
      }
      var cs = C[state.idx];
      var scores = cs.outlier != null && state.added ? cs.scores.concat([cs.outlier]) : cs.scores;
      var mv = mean(scores),
        md = median(scores);
      var outBtn =
        cs.outlier != null && !state.added
          ? '<button type="button" class="sd-outbtn" data-out>➕ Add the outlier day (' +
            cs.outlier +
            " pts) — watch the mean</button>"
          : "";
      el.innerHTML =
        head +
        '<div class="sd-card">' +
        '<div class="sd-player">' +
        cs.name +
        "  · Case " +
        (state.idx + 1) +
        " of " +
        total +
        "</div>" +
        '<p class="sd-need">' +
        cs.need.en +
        '<span class="es">' +
        cs.need.es +
        "</span></p>" +
        dotplot(scores, mv, md) +
        '<div class="sd-stats"><div class="sd-stat mean">Mean<b data-mean>' +
        r1(mv) +
        "</b></div>" +
        '<div class="sd-stat median">Median<b data-median>' +
        r1(md) +
        "</b></div></div>" +
        outBtn +
        '<p class="sd-q">Best measure of a TYPICAL day?</p>' +
        '<div class="sd-picks"><button type="button" class="sd-pick" data-p="mean">Mean</button>' +
        '<button type="button" class="sd-pick" data-p="median">Median</button></div>' +
        '<p class="sd-msg" data-msg aria-live="polite"></p></div>';

      var msg = el.querySelector("[data-msg]");
      var ob = el.querySelector("[data-out]");
      if (ob)
        ob.addEventListener("click", function () {
          state.added = true;
          render();
          var m2 = el.querySelector("[data-msg]");
          m2.className = "sd-msg hint";
          m2.textContent =
            "See it? The mean jumped toward " + cs.outlier + "; the median barely moved.";
        });
      el.querySelectorAll(".sd-pick").forEach(function (btn) {
        btn.addEventListener("click", function () {
          if (btn.disabled) return;
          if (btn.dataset.p === cs.answer) {
            el.querySelectorAll(".sd-pick").forEach(function (b) {
              b.disabled = true;
            });
            msg.className = "sd-msg ok";
            msg.textContent = "✓ Good read — " + cs.why;
            setTimeout(function () {
              state.idx++;
              state.added = false;
              render();
            }, 1300);
          } else {
            btn.classList.add("wrong");
            setTimeout(function () {
              btn.classList.remove("wrong");
            }, 350);
            msg.className = "sd-msg hint";
            msg.textContent =
              cs.answer === "median"
                ? "Look again — an extreme day pulls the MEAN. Which one ignores that spike?"
                : "Look again — the days are close with no outlier. Which measure uses them all?";
          }
        });
      });
    }

    render();
    var obs = new MutationObserver(function () {
      var lv = levelOf();
      if (lv !== level && state.idx === 0 && !state.added) {
        level = lv;
        render();
      }
    });
    obs.observe(document.body, { attributes: true, attributeFilter: ["class"] });
  }

  function scan() {
    document.querySelectorAll('.pki-manip[data-manip="stat-draft"]').forEach(init);
  }
  ready(scan);
  setTimeout(scan, 900);
  if (typeof window !== "undefined") {
    window.NeftManips = window.NeftManips || {};
    window.NeftManips["stat-draft"] = init;
  }
})();
