/* ==========================================================================
   Neft Teacher — Manipulative: MISSION CONTROL (data-manip="mission-control")
   A systems-tuning chain for The Number System (6.NOS): three console stages
   that must each be tuned correctly to LAUNCH —
     1) Reactor: prime factorization -> compute the thrust code
     2) Crew kits: GCF (largest equal split, none left over)
     3) Launch window: LCM (first minute two cycles align)
   Each correct tune brings a subsystem ONLINE and feeds the launch telemetry;
   all three => MISSION GO / launch. Self-mounting + self-styling like the
   other manip-*.js. Level-aware (body.level-0/1/2), bilingual, no-fail.
   Usage:  <div class="pki-manip" data-manip="mission-control"></div>
   ========================================================================== */
(function () {
  "use strict";
  if (typeof document === "undefined") return;
  var STYLE_ID = "pki-mc-styles";

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
      ".pki-mc{--mc-ink:#0b1020;--mc-blue:#2f6bff;--mc-green:#12a150;--mc-amber:#e08a00;font-family:inherit;color:var(--mc-ink)}",
      ".pki-mc h4{margin:0 0 4px;font-size:18px;font-weight:800}",
      ".pki-mc .mc-sub{margin:0 0 12px;font-size:13.5px;color:#5a6478}",
      ".pki-mc .mc-rail{display:flex;gap:8px;margin:0 0 14px}",
      ".pki-mc .mc-pip{flex:1;height:8px;border-radius:99px;background:#e6ebf5}",
      ".pki-mc .mc-pip.done{background:linear-gradient(90deg,var(--mc-green),#0c7c3d)}",
      ".pki-mc .mc-pip.active{background:linear-gradient(90deg,var(--mc-blue),#1748c0)}",
      ".pki-mc .mc-card{border:1px solid rgba(23,32,51,.12);border-radius:14px;padding:14px;background:linear-gradient(180deg,#0f1830,#0b1020);color:#dfe7fb}",
      ".pki-mc .mc-stg{font-size:12px;font-weight:800;letter-spacing:.05em;text-transform:uppercase;color:#8fb4ff}",
      ".pki-mc .mc-emoji{font-size:26px}",
      ".pki-mc .mc-prompt{margin:6px 0 10px;font-size:15px;color:#eaf0ff}",
      ".pki-mc .mc-prompt .es{display:block;color:#9fb0d6;font-style:italic;font-size:12.5px;margin-top:2px}",
      ".pki-mc .mc-opts{display:flex;flex-wrap:wrap;gap:8px}",
      ".pki-mc .mc-opt{cursor:pointer;border:2px solid #33406a;background:#16203d;color:#eaf0ff;border-radius:10px;padding:10px 18px;font-size:17px;font-weight:800;font-variant-numeric:tabular-nums;transition:transform .08s,border-color .12s}",
      ".pki-mc .mc-opt:hover{transform:translateY(-1px);border-color:var(--mc-blue)}",
      ".pki-mc .mc-opt:focus-visible{outline:3px solid rgba(47,107,255,.5);outline-offset:2px}",
      ".pki-mc .mc-opt.wrong{border-color:#ff5a5a;animation:mcShake .3s}",
      ".pki-mc .mc-opt:disabled{opacity:.5;cursor:default}",
      ".pki-mc .mc-msg{min-height:20px;margin:10px 0 0;font-size:13.5px;font-weight:700}",
      ".pki-mc .mc-msg.hint{color:#ffcf6b}.pki-mc .mc-msg.ok{color:#7ff0b0}",
      ".pki-mc .mc-tele{display:flex;gap:8px;margin:12px 0 0}",
      ".pki-mc .mc-cell{flex:1;text-align:center;border:1px solid #d5ddec;border-radius:10px;padding:8px 4px;font-size:12px;font-weight:700;color:#9aa4ba}",
      ".pki-mc .mc-cell b{display:block;font-size:17px;color:#c7d0e2}",
      ".pki-mc .mc-cell.on{border-color:var(--mc-green);color:var(--mc-green)}.pki-mc .mc-cell.on b{color:var(--mc-green)}",
      ".pki-mc .mc-done{text-align:center;padding:16px 12px}",
      ".pki-mc .mc-go{display:inline-block;font-size:30px;font-weight:900;letter-spacing:.06em;color:var(--mc-green)}",
      ".pki-mc .mc-again{margin-top:14px;cursor:pointer;border:0;background:var(--mc-blue);color:#fff;font-weight:800;border-radius:10px;padding:9px 16px;font-size:14px}",
      "@keyframes mcShake{0%,100%{transform:translateX(0)}25%{transform:translateX(-4px)}75%{transform:translateX(4px)}}",
      "@media (prefers-reduced-motion:reduce){.pki-mc *{animation:none!important;transition:none!important}}",
    ].join("\n");
    document.head.appendChild(s);
  }

  // Stage: {sys, emoji, ans, prompt{en,es}, opts[], hint}
  var SETS = {
    0: [
      {
        sys: "Crew Kits · GCF",
        emoji: "🎒",
        ans: 4,
        opts: [4, 2, 6],
        hint: "The biggest number that divides BOTH 12 and 8 with nothing left over.",
        prompt: {
          en: "Pack 12 meal packs and 8 water pods into equal crew kits with none left over. Most kits?",
          es: "Empaca 12 comidas y 8 aguas en kits iguales sin sobrar. ¿Máximo de kits?",
        },
      },
      {
        sys: "Launch Window · LCM",
        emoji: "🛰️",
        ans: 12,
        opts: [12, 24, 10],
        hint: "The FIRST minute that is a multiple of both 4 and 6.",
        prompt: {
          en: "The station passes every 4 min; the antenna re-aims every 6 min. First minute they line up?",
          es: "La estación pasa cada 4 min; la antena apunta cada 6 min. ¿Primer minuto que coinciden?",
        },
      },
    ],
    1: [
      {
        sys: "Reactor · Primes",
        emoji: "⚛️",
        ans: 84,
        opts: [84, 42, 168],
        hint: "Multiply the prime rods: 2 × 2 × 3 × 7.",
        prompt: {
          en: "Reactor thrust code = 2 · 2 · 3 · 7. Compute the thrust number it unlocks.",
          es: "Código del reactor = 2 · 2 · 3 · 7. Calcula el número de empuje.",
        },
      },
      {
        sys: "Crew Kits · GCF",
        emoji: "🎒",
        ans: 12,
        opts: [12, 6, 24],
        hint: "Biggest number dividing BOTH 84 and 60 evenly.",
        prompt: {
          en: "Split 84 ration packs and 60 water pods into equal kits, none left over. Most kits?",
          es: "Reparte 84 raciones y 60 aguas en kits iguales sin sobrar. ¿Máximo de kits?",
        },
      },
      {
        sys: "Launch Window · LCM",
        emoji: "🛰️",
        ans: 24,
        opts: [24, 96, 48],
        hint: "First minute that is a multiple of both 12 and 8.",
        prompt: {
          en: "Station passes every 12 min; antenna re-aims every 8 min. First aligned minute?",
          es: "La estación pasa cada 12 min; la antena cada 8 min. ¿Primer minuto alineado?",
        },
      },
    ],
    2: [
      {
        sys: "Reactor · Primes",
        emoji: "⚛️",
        ans: 504,
        opts: [504, 378, 252],
        hint: "2³·3²·7 = 8 × 9 × 7.",
        prompt: {
          en: "Reactor code = 2³ · 3² · 7. Compute the thrust number.",
          es: "Código del reactor = 2³ · 3² · 7. Calcula el empuje.",
        },
      },
      {
        sys: "Crew Kits · GCF",
        emoji: "🎒",
        ans: 12,
        opts: [12, 6, 24],
        hint: "Biggest number dividing BOTH 168 and 132 evenly.",
        prompt: {
          en: "Split 168 crates and 132 pods into equal kits, none left over. Most kits?",
          es: "Reparte 168 cajas y 132 cápsulas en kits iguales sin sobrar. ¿Máximo de kits?",
        },
      },
      {
        sys: "Launch Window · LCM",
        emoji: "🛰️",
        ans: 90,
        opts: [90, 270, 45],
        hint: "First minute that is a multiple of both 15 and 18.",
        prompt: {
          en: "Orbit A repeats every 15 min; orbit B every 18 min. First aligned minute?",
          es: "La órbita A cada 15 min; la órbita B cada 18 min. ¿Primer minuto alineado?",
        },
      },
    ],
  };

  function levelOf() {
    var m = String(document.body.className || "").match(/level-(\d)/);
    return m ? Math.max(0, Math.min(2, parseInt(m[1], 10))) : 1;
  }
  function esc(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;");
  }

  function init(el) {
    if (el.dataset.pkiManipDone) return;
    el.dataset.pkiManipDone = "1";
    injectCSS();
    el.classList.add("pki-mc");
    var state = { idx: 0, level: levelOf(), vals: [] };
    function stages() {
      return SETS[state.level] || SETS[1];
    }

    function render() {
      var S = stages();
      var total = S.length;
      var rail = '<div class="mc-rail">';
      for (var i = 0; i < total; i++)
        rail +=
          '<div class="mc-pip ' +
          (i < state.idx ? "done" : i === state.idx ? "active" : "") +
          '"></div>';
      rail += "</div>";
      var tele = '<div class="mc-tele">';
      for (var j = 0; j < total; j++)
        tele +=
          '<div class="mc-cell ' +
          (state.vals[j] != null ? "on" : "") +
          '">' +
          esc(S[j].sys.split(" · ")[1] || S[j].sys) +
          "<b>" +
          (state.vals[j] != null ? state.vals[j] : "—") +
          "</b></div>";
      tele += "</div>";

      var head =
        "<h4>🚀 Mission Control</h4>" +
        '<p class="mc-sub">Control de misión — tune each system correctly to launch.</p>' +
        rail;

      if (state.idx >= total) {
        el.innerHTML =
          head +
          '<div class="mc-card mc-done"><div class="mc-go">🚀 MISSION GO</div>' +
          '<p style="margin:10px 0 0;color:#eaf0ff;font-weight:700">All systems online. Telemetry locked: <b>' +
          state.vals.join(" · ") +
          "</b>. Liftoff!</p></div>" +
          tele +
          '<div style="text-align:center"><button type="button" class="mc-again" data-again>Run it again</button></div>';
        el.querySelector("[data-again]").addEventListener("click", function () {
          state.idx = 0;
          state.vals = [];
          state.level = levelOf();
          render();
        });
        return;
      }

      var st = S[state.idx];
      var opts = st.opts
        .map(function (o) {
          return '<button type="button" class="mc-opt" data-v="' + o + '">' + o + "</button>";
        })
        .join("");
      el.innerHTML =
        head +
        '<div class="mc-card">' +
        '<div class="mc-stg"><span class="mc-emoji">' +
        st.emoji +
        "</span> " +
        esc(st.sys) +
        " · System " +
        (state.idx + 1) +
        " of " +
        total +
        "</div>" +
        '<p class="mc-prompt">' +
        esc(st.prompt.en) +
        '<span class="es">' +
        esc(st.prompt.es) +
        "</span></p>" +
        '<div class="mc-opts">' +
        opts +
        "</div>" +
        '<p class="mc-msg" data-msg aria-live="polite"></p>' +
        "</div>" +
        tele;

      var msg = el.querySelector("[data-msg]");
      var btns = el.querySelectorAll(".mc-opt");
      btns.forEach(function (btn) {
        btn.addEventListener("click", function () {
          if (btn.disabled) return;
          if (parseInt(btn.dataset.v, 10) === st.ans) {
            state.vals[state.idx] = st.ans;
            btns.forEach(function (b) {
              b.disabled = true;
            });
            msg.className = "mc-msg ok";
            msg.textContent = "✓ " + st.sys.split(" · ")[0] + " online — telemetry " + st.ans + ".";
            setTimeout(function () {
              state.idx++;
              render();
            }, 1000);
          } else {
            btn.classList.add("wrong");
            setTimeout(function () {
              btn.classList.remove("wrong");
            }, 350);
            msg.className = "mc-msg hint";
            msg.textContent = "Off spec — " + st.hint;
          }
        });
      });
    }

    render();
    var obs = new MutationObserver(function () {
      var lv = levelOf();
      if (lv !== state.level && state.idx === 0 && state.vals.length === 0) {
        state.level = lv;
        render();
      }
    });
    obs.observe(document.body, { attributes: true, attributeFilter: ["class"] });
  }

  function scan() {
    document.querySelectorAll('.pki-manip[data-manip="mission-control"]').forEach(init);
  }
  ready(scan);
  setTimeout(scan, 900);
  if (typeof window !== "undefined") {
    window.NeftManips = window.NeftManips || {};
    window.NeftManips["mission-control"] = init;
  }
})();
