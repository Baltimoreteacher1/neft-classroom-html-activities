/* ==========================================================================
   Neft Teacher — Manipulative: ESCAPE CHAIN (data-manip="escape-chain")
   A deduction escape-room for Equations (6.AT.8): a chain of locked "cases".
   Each lock shows a real-world clue + its one-step equation on a balance
   scale; the student cracks it by choosing the inverse operation to undo on
   BOTH sides. The scale only levels — and the lock only opens — on the correct
   isolate. Each solved value becomes a digit of the final vault combo; all
   locks solved => CASE CRACKED stamp.

   Self-mounting + self-styling (like the other manip-*.js). Level-aware
   (reads body.level-0/1/2), bilingual, no-fail (unlimited kind retries).
   Usage:  <div class="pki-manip" data-manip="escape-chain"></div>
   ========================================================================== */
(function () {
  "use strict";
  if (typeof document === "undefined") return;
  var STYLE_ID = "pki-ec-styles";

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
      ".pki-ec{--ec-ink:#172033;--ec-blue:#2f6bff;--ec-green:#12a150;--ec-amber:#e08a00;font-family:inherit;color:var(--ec-ink)}",
      ".pki-ec h4{margin:0 0 4px;font-size:18px;font-weight:800}",
      ".pki-ec .ec-sub{margin:0 0 12px;font-size:13.5px;color:#5a6478}",
      ".pki-ec .ec-rail{display:flex;gap:8px;margin:0 0 14px}",
      ".pki-ec .ec-pip{flex:1;height:8px;border-radius:99px;background:#e6ebf5}",
      ".pki-ec .ec-pip.done{background:linear-gradient(90deg,var(--ec-green),#0c7c3d)}",
      ".pki-ec .ec-pip.active{background:linear-gradient(90deg,var(--ec-blue),#1748c0)}",
      ".pki-ec .ec-card{border:1px solid rgba(23,32,51,.12);border-radius:14px;padding:14px;background:#fff}",
      ".pki-ec .ec-lockno{font-size:12px;font-weight:800;letter-spacing:.04em;text-transform:uppercase;color:var(--ec-blue)}",
      ".pki-ec .ec-clue{margin:4px 0 10px;font-size:15px}",
      ".pki-ec .ec-clue .es{display:block;color:#6b7488;font-style:italic;font-size:12.5px;margin-top:2px}",
      ".pki-ec .ec-scale{display:block;margin:2px auto 10px}",
      ".pki-ec .ec-eq{text-align:center;font-size:22px;font-weight:800;margin:2px 0 12px;font-variant-numeric:tabular-nums}",
      ".pki-ec .ec-eq b{color:var(--ec-blue)}",
      ".pki-ec .ec-prompt{font-size:13px;font-weight:700;color:#34405a;margin:0 0 8px}",
      ".pki-ec .ec-ops{display:flex;flex-wrap:wrap;gap:8px}",
      ".pki-ec .ec-op{cursor:pointer;border:2px solid #d5ddec;background:#f7f9ff;border-radius:10px;padding:9px 14px;font-size:15px;font-weight:800;color:var(--ec-ink);font-variant-numeric:tabular-nums;transition:transform .08s,border-color .12s}",
      ".pki-ec .ec-op:hover{transform:translateY(-1px);border-color:var(--ec-blue)}",
      ".pki-ec .ec-op:focus-visible{outline:3px solid rgba(47,107,255,.4);outline-offset:2px}",
      ".pki-ec .ec-op.wrong{border-color:#d33;animation:ecShake .3s}",
      ".pki-ec .ec-op:disabled{opacity:.5;cursor:default}",
      ".pki-ec .ec-msg{min-height:20px;margin:10px 0 0;font-size:13.5px;font-weight:700}",
      ".pki-ec .ec-msg.hint{color:var(--ec-amber)}",
      ".pki-ec .ec-msg.ok{color:var(--ec-green)}",
      ".pki-ec .ec-combo{margin:12px 0 0;text-align:center;font-size:14px;font-weight:800;color:#34405a}",
      ".pki-ec .ec-combo .slot{display:inline-block;min-width:34px;padding:4px 6px;margin:0 3px;border-radius:8px;border:2px dashed #c7d0e2;color:#9aa4ba}",
      ".pki-ec .ec-combo .slot.filled{border-style:solid;border-color:var(--ec-green);color:var(--ec-green);background:rgba(18,161,80,.08)}",
      ".pki-ec .ec-done{text-align:center;padding:18px 12px}",
      ".pki-ec .ec-stamp{display:inline-block;transform:rotate(-8deg);border:4px solid #d33;color:#d33;border-radius:12px;padding:8px 18px;font-size:26px;font-weight:900;letter-spacing:.06em}",
      ".pki-ec .ec-again{margin-top:14px;cursor:pointer;border:0;background:var(--ec-blue);color:#fff;font-weight:800;border-radius:10px;padding:9px 16px;font-size:14px}",
      "@keyframes ecShake{0%,100%{transform:translateX(0)}25%{transform:translateX(-4px)}75%{transform:translateX(4px)}}",
      "@media (prefers-reduced-motion:reduce){.pki-ec *{animation:none!important;transition:none!important}}",
      "@media (prefers-color-scheme:dark){.pki-ec{color:#eef2fb}.pki-ec .ec-card{background:#1b2233;border-color:rgba(255,255,255,.14)}.pki-ec .ec-op{background:#232c40;border-color:#39435c;color:#eef2fb}.pki-ec .ec-sub,.pki-ec .ec-combo{color:#aeb7cc}}",
    ].join("\n");
    document.head.appendChild(s);
  }

  // Puzzle sets by level. Each lock: {op, b, c, clue{en,es}}
  //   +  : x + b = c  -> x = c-b   (undo: − b)
  //   -  : x − b = c  -> x = c+b   (undo: + b)
  //   *  : b·x = c    -> x = c/b   (undo: ÷ b)
  //   /  : x ÷ b = c  -> x = c·b   (undo: × b)
  var SETS = {
    0: [
      {
        op: "+",
        b: 6,
        c: 15,
        clue: {
          en: "The safe held some coins. Add the 6 found on the floor and there are 15.",
          es: "La caja tenía monedas. Suma las 6 del piso y hay 15.",
        },
      },
      {
        op: "-",
        b: 4,
        c: 10,
        clue: {
          en: "After 4 coins were taken, 10 remain in the tin.",
          es: "Después de quitar 4 monedas, quedan 10 en la lata.",
        },
      },
    ],
    1: [
      {
        op: "+",
        b: 18,
        c: 45,
        clue: {
          en: "The tin held $45 once you add back the $18 that fell out.",
          es: "La lata tenía $45 al sumar los $18 que se cayeron.",
        },
      },
      {
        op: "*",
        b: 4,
        c: 96,
        clue: {
          en: "4 identical raffle rolls cost $96 in total. Find one roll.",
          es: "4 rollos de rifa iguales cuestan $96 en total. Halla uno.",
        },
      },
      {
        op: "/",
        b: 3,
        c: 19,
        clue: {
          en: "The loot split into 3 envelopes is $19 each. Find the whole take.",
          es: "El botín en 3 sobres es $19 cada uno. Halla el total.",
        },
      },
    ],
    2: [
      {
        op: "-",
        b: 27,
        c: 58,
        clue: {
          en: "After spending $27, the account shows $58. What was the start?",
          es: "Tras gastar $27, la cuenta muestra $58. ¿Cuál era el inicio?",
        },
      },
      {
        op: "*",
        b: 7,
        c: 168,
        clue: {
          en: "7 crates weigh 168 kg together. Find one crate.",
          es: "7 cajas pesan 168 kg juntas. Halla una caja.",
        },
      },
      {
        op: "/",
        b: 6,
        c: 24,
        clue: {
          en: "Divided evenly among 6 vaults, each holds 24 bars. Find the total.",
          es: "Repartido en 6 bóvedas, cada una guarda 24 barras. Halla el total.",
        },
      },
    ],
  };

  var INV = { "+": "−", "-": "+", "*": "÷", "/": "×" };
  function answer(l) {
    if (l.op === "+") return l.c - l.b;
    if (l.op === "-") return l.c + l.b;
    if (l.op === "*") return l.c / l.b;
    return l.c * l.b;
  }
  function eqStr(l) {
    if (l.op === "+") return "x + " + l.b + " = " + l.c;
    if (l.op === "-") return "x − " + l.b + " = " + l.c;
    if (l.op === "*") return l.b + "·x = " + l.c;
    return "x ÷ " + l.b + " = " + l.c;
  }
  // three op-chips: correct inverse + 2 plausible distractors
  function chips(l) {
    var correct = INV[l.op] + " " + l.b;
    var set = [correct];
    var alt = { "+": "+ " + l.b, "-": "− " + l.b, "*": "× " + l.b, "/": "÷ " + l.b };
    if (set.indexOf(alt[l.op]) < 0) set.push(alt[l.op]);
    var extra = l.op === "+" || l.op === "-" ? "÷ " + l.b : "− " + l.b;
    if (set.indexOf(extra) < 0) set.push(extra);
    // deterministic shuffle by b so it isn't always position 0
    if (l.b % 2 === 0) set.reverse();
    return { list: set, correct: correct };
  }

  function levelOf() {
    var m = String(document.body.className || "").match(/level-(\d)/);
    return m ? Math.max(0, Math.min(2, parseInt(m[1], 10))) : 1;
  }

  function scaleSVG(tilt, solved) {
    var t = solved ? 0 : tilt;
    return (
      '<svg class="ec-scale" width="220" height="96" viewBox="0 0 220 96" aria-hidden="true">' +
      '<line x1="110" y1="20" x2="110" y2="80" stroke="#8894ad" stroke-width="4"/>' +
      '<polygon points="94,86 126,86 110,72" fill="#8894ad"/>' +
      '<g transform="rotate(' +
      t.toFixed(1) +
      ' 110 24)">' +
      '<line x1="40" y1="24" x2="180" y2="24" stroke="var(--ec-ink)" stroke-width="5" stroke-linecap="round"/>' +
      '<circle cx="40" cy="24" r="6" fill="' +
      (solved ? "#12a150" : "#2f6bff") +
      '"/>' +
      '<circle cx="180" cy="24" r="6" fill="' +
      (solved ? "#12a150" : "#2f6bff") +
      '"/>' +
      '<path d="M22 24 h36 l-8 20 a10 10 0 0 1 -20 0 z" fill="rgba(47,107,255,.14)" stroke="#8894ad"/>' +
      '<path d="M162 24 h36 l-8 20 a10 10 0 0 1 -20 0 z" fill="rgba(47,107,255,.14)" stroke="#8894ad"/>' +
      "</g></svg>"
    );
  }

  function init(el) {
    if (el.dataset.pkiManipDone) return;
    el.dataset.pkiManipDone = "1";
    injectCSS();
    el.classList.add("pki-ec");

    var state = { idx: 0, level: levelOf(), solvedVals: [] };

    function locks() {
      return SETS[state.level] || SETS[1];
    }

    function render() {
      var L = locks();
      var total = L.length;
      // progress rail
      var rail = '<div class="ec-rail">';
      for (var i = 0; i < total; i++)
        rail +=
          '<div class="ec-pip ' +
          (i < state.idx ? "done" : i === state.idx ? "active" : "") +
          '"></div>';
      rail += "</div>";

      // combo readout
      var combo = '<div class="ec-combo">Vault code: ';
      for (var j = 0; j < total; j++) {
        var v = state.solvedVals[j];
        combo +=
          '<span class="slot ' +
          (v != null ? "filled" : "") +
          '">' +
          (v != null ? v : "?") +
          "</span>";
      }
      combo += "</div>";

      var head =
        "<h4>🔐 Crack the Locks</h4>" +
        '<p class="ec-sub">Descifra los candados — solve each equation to open the next lock.</p>' +
        rail;

      if (state.idx >= total) {
        el.innerHTML =
          head +
          '<div class="ec-card ec-done"><div class="ec-stamp">CASE CRACKED</div>' +
          '<p style="margin:12px 0 0;font-weight:700">You isolated the variable on every lock. Vault code: <b>' +
          state.solvedVals.join(" · ") +
          "</b></p>" +
          combo +
          '<button type="button" class="ec-again" data-again>Run it again</button></div>';
        el.querySelector("[data-again]").addEventListener("click", function () {
          state.idx = 0;
          state.solvedVals = [];
          state.level = levelOf();
          render();
        });
        return;
      }

      var lock = L[state.idx];
      var c = chips(lock);
      var opsHtml = c.list
        .map(function (op) {
          return (
            '<button type="button" class="ec-op" data-op="' +
            op +
            '">' +
            op +
            " (both sides)</button>"
          );
        })
        .join("");

      el.innerHTML =
        head +
        '<div class="ec-card">' +
        '<div class="ec-lockno">Lock ' +
        (state.idx + 1) +
        " of " +
        total +
        "</div>" +
        '<p class="ec-clue">' +
        lock.clue.en +
        '<span class="es">' +
        lock.clue.es +
        "</span></p>" +
        scaleSVG(14, false) +
        '<div class="ec-eq">' +
        eqStr(lock).replace(/x/g, "<b>x</b>") +
        "</div>" +
        '<p class="ec-prompt">To free x, undo the same operation on BOTH sides:</p>' +
        '<div class="ec-ops">' +
        opsHtml +
        "</div>" +
        '<p class="ec-msg" data-msg aria-live="polite"></p>' +
        "</div>" +
        combo;

      var msg = el.querySelector("[data-msg]");
      var ops = el.querySelectorAll(".ec-op");
      ops.forEach(function (btn) {
        btn.addEventListener("click", function () {
          if (btn.dataset.chosen) return;
          if (btn.dataset.op === c.correct) {
            var x = answer(lock);
            state.solvedVals[state.idx] = x;
            ops.forEach(function (b) {
              b.disabled = true;
            });
            var eq = el.querySelector(".ec-eq");
            eq.innerHTML = "<b>x = " + x + "</b>";
            var svg = el.querySelector(".ec-scale");
            if (svg) svg.outerHTML = scaleSVG(0, true);
            msg.className = "ec-msg ok";
            msg.textContent =
              "⚖️ Balanced! Lock " + (state.idx + 1) + " opens — code digit " + x + ".";
            setTimeout(function () {
              state.idx++;
              render();
            }, 1100);
          } else {
            btn.classList.add("wrong");
            btn.dataset.chosen = "1";
            setTimeout(function () {
              btn.classList.remove("wrong");
              delete btn.dataset.chosen;
            }, 350);
            msg.className = "ec-msg hint";
            msg.textContent =
              lock.op === "+" || lock.op === "-"
                ? "Not level yet — to move a term off x, use the OPPOSITE (+ ↔ −)."
                : "Not level yet — to free x from × or ÷, use the OPPOSITE (× ↔ ÷).";
          }
        });
      });
    }

    render();

    // Re-theme puzzles if the teacher/student switches level (body class changes)
    var obs = new MutationObserver(function () {
      var lv = levelOf();
      if (lv !== state.level && state.idx === 0 && state.solvedVals.length === 0) {
        state.level = lv;
        render();
      }
    });
    obs.observe(document.body, { attributes: true, attributeFilter: ["class"] });
  }

  function scan() {
    document.querySelectorAll('.pki-manip[data-manip="escape-chain"]').forEach(init);
  }
  ready(scan);
  setTimeout(scan, 900);
  if (typeof window !== "undefined") {
    window.NeftManips = window.NeftManips || {};
    window.NeftManips["escape-chain"] = init;
  }
})();
