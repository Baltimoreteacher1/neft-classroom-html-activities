/* ==========================================================================
   Neft Teacher — Manipulative: COMBO FORGE (data-manip="combo-forge")
   Unit 6 · Expressions & Exponents (Game Studio Scoring Engine) — 6.AT.5-7.
   A scoring-engine tuning bench: each stage hands you an algebraic expression
   and a value for the variable; EVALUATE it (respecting order of operations)
   and pick the score it forges from 3 options —
     1) EVALUATE  : coefficient + constant, e.g. score = 8·levels + 15 @5 = 55
     2) POWER     : exponent = repeated multiplication, e.g. 5·2³ = 40
     3) DISTRIBUTE: distribute to BOTH terms / pick the equivalent expression
   Correct => "combo locked" + the substitution shown worked out, and advance;
   all stages => HIGH SCORE / engine tuned payoff with the forged combo chain.
   Distractors encode real errors (wrong order of ops, multiplying the exponent
   instead of repeated multiplication, distributing to only one term).
   Self-mounting + self-styling like the other manip-*.js. Level-aware
   (body.level-0/1/2 — L0 = 2 stages, L1 adds a power stage, L2 adds
   distributive reasoning with larger values), bilingual, no-fail.
   Usage:  <div class="pki-manip" data-manip="combo-forge"></div>
   ========================================================================== */
(function () {
  "use strict";
  if (typeof document === "undefined") return;
  var STYLE_ID = "pki-cf-styles";

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
      ".pki-cf{--cf-ink:#12102b;--cf-violet:#7b3ff2;--cf-cyan:#12b5c9;--cf-green:#12a150;--cf-amber:#e08a00;font-family:inherit;color:var(--cf-ink)}",
      ".pki-cf h4{margin:0 0 4px;font-size:18px;font-weight:800}",
      ".pki-cf .cf-sub{margin:0 0 12px;font-size:13.5px;color:#5d5a76}",
      ".pki-cf .cf-rail{display:flex;gap:8px;margin:0 0 14px}",
      ".pki-cf .cf-pip{flex:1;height:8px;border-radius:99px;background:#e8e4f5}",
      ".pki-cf .cf-pip.done{background:linear-gradient(90deg,var(--cf-green),#0c7c3d)}",
      ".pki-cf .cf-pip.active{background:linear-gradient(90deg,var(--cf-violet),var(--cf-cyan))}",
      ".pki-cf .cf-card{border:1px solid rgba(30,22,60,.14);border-radius:14px;padding:14px;background:linear-gradient(180deg,#1a1440,#120e2c);color:#e9e4ff}",
      ".pki-cf .cf-stg{font-size:12px;font-weight:800;letter-spacing:.05em;text-transform:uppercase;color:#b39bff}",
      ".pki-cf .cf-emoji{font-size:26px}",
      ".pki-cf .cf-expr{display:inline-block;margin:8px 0 2px;padding:6px 12px;border-radius:10px;background:#241a54;border:1px solid #3a2c78;font-size:20px;font-weight:800;color:#8fe6f2;font-variant-numeric:tabular-nums}",
      ".pki-cf .cf-prompt{margin:6px 0 10px;font-size:15px;color:#efeaff}",
      ".pki-cf .cf-prompt .es{display:block;color:#b0a6d6;font-style:italic;font-size:12.5px;margin-top:2px}",
      ".pki-cf .cf-opts{display:flex;flex-wrap:wrap;gap:8px}",
      ".pki-cf .cf-opt{cursor:pointer;border:2px solid #3d3172;background:#1e1748;color:#efeaff;border-radius:10px;padding:10px 18px;font-size:17px;font-weight:800;font-variant-numeric:tabular-nums;transition:transform .08s,border-color .12s}",
      ".pki-cf .cf-opt:hover{transform:translateY(-1px);border-color:var(--cf-cyan)}",
      ".pki-cf .cf-opt:focus-visible{outline:3px solid rgba(123,63,242,.5);outline-offset:2px}",
      ".pki-cf .cf-opt.wrong{border-color:#ff5a5a;animation:cfShake .3s}",
      ".pki-cf .cf-opt.hit{border-color:var(--cf-green);background:#123a24}",
      ".pki-cf .cf-opt:disabled{opacity:.5;cursor:default}",
      ".pki-cf .cf-msg{min-height:20px;margin:10px 0 0;font-size:13.5px;font-weight:700}",
      ".pki-cf .cf-msg.hint{color:#ffcf6b}.pki-cf .cf-msg.ok{color:#7ff0b0}",
      ".pki-cf .cf-tele{display:flex;gap:8px;margin:12px 0 0}",
      ".pki-cf .cf-cell{flex:1;text-align:center;border:1px solid #ddd6ec;border-radius:10px;padding:8px 4px;font-size:11px;font-weight:700;color:#9a92b8;letter-spacing:.03em}",
      ".pki-cf .cf-cell b{display:block;font-size:16px;color:#c6bce4;margin-top:2px}",
      ".pki-cf .cf-cell.on{border-color:var(--cf-green);color:var(--cf-green)}.pki-cf .cf-cell.on b{color:var(--cf-green)}",
      ".pki-cf .cf-done{text-align:center;padding:16px 12px}",
      ".pki-cf .cf-hi{display:inline-block;font-size:28px;font-weight:900;letter-spacing:.06em;color:#8fe6f2}",
      ".pki-cf .cf-again{margin-top:14px;cursor:pointer;border:0;background:var(--cf-violet);color:#fff;font-weight:800;border-radius:10px;padding:9px 16px;font-size:14px}",
      "@keyframes cfShake{0%,100%{transform:translateX(0)}25%{transform:translateX(-4px)}75%{transform:translateX(4px)}}",
      "@media (prefers-reduced-motion:reduce){.pki-cf *{animation:none!important;transition:none!important}}",
      "@media (prefers-color-scheme:dark){.pki-cf{--cf-ink:#eae6ff;color:var(--cf-ink)}.pki-cf .cf-sub{color:#b0a6d6}.pki-cf .cf-pip{background:#2a2450}.pki-cf .cf-cell{border-color:#3a3266;color:#a89ecf}.pki-cf .cf-cell b{color:#cdc3ef}}",
    ].join("\n");
    document.head.appendChild(s);
  }

  // Stage: {tag, emoji, ans, expr, opts[], hint, work, prompt{en,es}}
  // ans compared as a string so numeric AND expression answers both work.
  var SETS = {
    0: [
      {
        tag: "EVALUATE",
        emoji: "🎯",
        expr: "6·levels + 4",
        ans: 22,
        opts: [22, 18, 42],
        hint: "Multiply first, THEN add the +4 constant (order of operations).",
        work: "6·3 + 4 = 18 + 4 = 22",
        prompt: {
          en: "The score engine reads score = 6·levels + 4. Forge the score at levels = 3.",
          es: "El motor calcula score = 6·niveles + 4. Forja el puntaje con niveles = 3.",
        },
      },
      {
        tag: "EVALUATE",
        emoji: "💎",
        expr: "5·gems + 7",
        ans: 27,
        opts: [27, 55, 20],
        hint: "Do the multiply (5·gems) first, then add 7. Don't add inside first.",
        work: "5·4 + 7 = 20 + 7 = 27",
        prompt: {
          en: "Bonus combo = 5·gems + 7. Forge the combo at gems = 4.",
          es: "Combo extra = 5·gemas + 7. Forja el combo con gemas = 4.",
        },
      },
    ],
    1: [
      {
        tag: "EVALUATE",
        emoji: "🎯",
        expr: "8·levels + 15",
        ans: 55,
        opts: [55, 160, 40],
        hint: "Multiply 8·levels FIRST, then add the +15 constant.",
        work: "8·5 + 15 = 40 + 15 = 55",
        prompt: {
          en: "Score engine: score = 8·levels + 15. Forge the score at levels = 5.",
          es: "Motor de puntaje: score = 8·niveles + 15. Forja el puntaje con niveles = 5.",
        },
      },
      {
        tag: "POWER",
        emoji: "⚡",
        expr: "5·2³",
        ans: 40,
        opts: [40, 30, 8],
        hint: "2³ means repeated multiplication: 2·2·2 — NOT 2·3. Then multiply by 5.",
        work: "5·2³ = 5·(2·2·2) = 5·8 = 40",
        prompt: {
          en: "Combo multiplier = 5·2³. Forge the combo (an exponent is repeated multiplication).",
          es: "Multiplicador de combo = 5·2³. Forja el combo (un exponente es multiplicación repetida).",
        },
      },
      {
        tag: "DISTRIBUTE",
        emoji: "🧩",
        expr: "3(x + 4)",
        ans: 27,
        opts: [27, 19, 15],
        hint: "Distribute the 3 to BOTH terms: 3·x AND 3·4. Then add.",
        work: "3(5 + 4) = 3·5 + 3·4 = 15 + 12 = 27",
        prompt: {
          en: "Multiplier zone = 3(x + 4). Forge the value at x = 5 (distribute to both terms).",
          es: "Zona multiplicadora = 3(x + 4). Forja el valor con x = 5 (distribuye a ambos términos).",
        },
      },
    ],
    2: [
      {
        tag: "EVALUATE",
        emoji: "🎯",
        expr: "12·levels + 45",
        ans: 141,
        opts: [141, 636, 96],
        hint: "Multiply 12·levels FIRST, then add 45. Don't add inside the parentheses of value.",
        work: "12·8 + 45 = 96 + 45 = 141",
        prompt: {
          en: "Score engine: score = 12·levels + 45. Forge the score at levels = 8.",
          es: "Motor de puntaje: score = 12·niveles + 45. Forja el puntaje con niveles = 8.",
        },
      },
      {
        tag: "POWER",
        emoji: "⚡",
        expr: "4·3³",
        ans: 108,
        opts: [108, 36, 27],
        hint: "3³ = 3·3·3 (repeated multiplication), NOT 3·3. Then multiply by 4.",
        work: "4·3³ = 4·(3·3·3) = 4·27 = 108",
        prompt: {
          en: "Combo multiplier = 4·3³. Forge the combo (repeated multiplication, then ×4).",
          es: "Multiplicador de combo = 4·3³. Forja el combo (multiplicación repetida, luego ×4).",
        },
      },
      {
        tag: "EQUIVALENT",
        emoji: "🧩",
        expr: "6(x + 4)",
        ans: "6x + 24",
        opts: ["6x + 24", "6x + 4", "6x + 10"],
        hint: "Distribute the outside 6 to BOTH terms inside: 6·x AND 6·4.",
        work: "6(x + 4) = 6·x + 6·4 = 6x + 24",
        prompt: {
          en: "Which expression is EQUIVALENT to the combo blueprint 6(x + 4)?",
          es: "¿Qué expresión es EQUIVALENTE al plano de combo 6(x + 4)?",
        },
      },
    ],
  };

  function levelOf() {
    var m = String(document.body.className || "").match(/level-(\d)/);
    return m ? Math.max(0, Math.min(2, parseInt(m[1], 10))) : 1;
  }
  function esc(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }
  function escAttr(s) {
    return esc(s).replace(/"/g, "&quot;");
  }

  function init(el) {
    if (el.dataset.pkiManipDone) return;
    el.dataset.pkiManipDone = "1";
    injectCSS();
    el.classList.add("pki-cf");
    var state = { idx: 0, level: levelOf(), vals: [] };
    function stages() {
      return SETS[state.level] || SETS[1];
    }

    function render() {
      var S = stages();
      var total = S.length;
      var rail = '<div class="cf-rail">';
      for (var i = 0; i < total; i++)
        rail +=
          '<div class="cf-pip ' +
          (i < state.idx ? "done" : i === state.idx ? "active" : "") +
          '"></div>';
      rail += "</div>";
      var tele = '<div class="cf-tele">';
      for (var j = 0; j < total; j++)
        tele +=
          '<div class="cf-cell ' +
          (state.vals[j] != null ? "on" : "") +
          '">' +
          esc(S[j].tag) +
          "<b>" +
          (state.vals[j] != null ? esc(state.vals[j]) : "—") +
          "</b></div>";
      tele += "</div>";

      var head =
        "<h4>🎮 Combo Forge</h4>" +
        '<p class="cf-sub">Forja de combos — evaluate each expression to lock the score.</p>' +
        rail;

      if (state.idx >= total) {
        el.innerHTML =
          head +
          '<div class="cf-card cf-done"><div class="cf-hi">🏆 HIGH SCORE</div>' +
          '<p style="margin:10px 0 0;color:#efeaff;font-weight:700">Engine tuned — every combo locked: <b>' +
          esc(state.vals.join("  ·  ")) +
          "</b>. Ship it!</p></div>" +
          tele +
          '<div style="text-align:center"><button type="button" class="cf-again" data-again>Forge again</button></div>';
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
          return (
            '<button type="button" class="cf-opt" data-v="' +
            escAttr(o) +
            '">' +
            esc(o) +
            "</button>"
          );
        })
        .join("");
      el.innerHTML =
        head +
        '<div class="cf-card">' +
        '<div class="cf-stg"><span class="cf-emoji">' +
        st.emoji +
        "</span> " +
        esc(st.tag) +
        " · Combo " +
        (state.idx + 1) +
        " of " +
        total +
        "</div>" +
        '<p class="cf-prompt">' +
        esc(st.prompt.en) +
        '<span class="es">' +
        esc(st.prompt.es) +
        "</span></p>" +
        '<div class="cf-expr">' +
        esc(st.expr) +
        "</div>" +
        '<div class="cf-opts">' +
        opts +
        "</div>" +
        '<p class="cf-msg" data-msg aria-live="polite"></p>' +
        "</div>" +
        tele;

      var msg = el.querySelector("[data-msg]");
      var btns = el.querySelectorAll(".cf-opt");
      btns.forEach(function (btn) {
        btn.addEventListener("click", function () {
          if (btn.disabled) return;
          if (String(btn.dataset.v) === String(st.ans)) {
            state.vals[state.idx] = st.ans;
            btn.classList.add("hit");
            btns.forEach(function (b) {
              b.disabled = true;
            });
            msg.className = "cf-msg ok";
            msg.textContent = "✓ Combo locked — " + st.work;
            setTimeout(function () {
              state.idx++;
              render();
            }, 1250);
          } else {
            btn.classList.add("wrong");
            setTimeout(function () {
              btn.classList.remove("wrong");
            }, 350);
            msg.className = "cf-msg hint";
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
    document.querySelectorAll('.pki-manip[data-manip="combo-forge"]').forEach(init);
  }
  ready(scan);
  setTimeout(scan, 900);
  if (typeof window !== "undefined") {
    window.NeftManips = window.NeftManips || {};
    window.NeftManips["combo-forge"] = init;
  }
})();
