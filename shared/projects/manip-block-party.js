/* ==========================================================================
   Neft Teacher — Manipulative: BLOCK PARTY PLANNER (data-manip="block-party")
   Unit 1 project manipulative for the Number System (6.NOS). Plan a block
   party in a 3-stage chain — each stage a themed multiple-choice question with
   a small SVG visual:
     1) GOODIE BAGS  — GCF: most equal bags with nothing left over.
     2) ENTERTAINMENT — LCM: first minute the DJ loop + games line up again.
     3) BUDGET        — multi-digit division / decimals: cost per guest.
   Each correct answer lights a part of the party checklist; all correct =>
   "🎉 PARTY READY!" payoff. Wrong = kind amber hint (names the idea, never the
   answer) with unlimited retries. Two stages at Level 0 (no budget).

   Self-mounting + self-styling like the other manip-*.js. Level-aware
   (body.level-0/1/2), bilingual, no-fail, reduced-motion + dark-mode safe.
   Usage:  <div class="pki-manip" data-manip="block-party"></div>
   ========================================================================== */
(function () {
  "use strict";
  if (typeof document === "undefined") return;
  var STYLE_ID = "pki-bpty-styles";

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
      ".pki-bpty{--bp-ink:#1c1830;--bp-pink:#e0407f;--bp-purple:#7b3fe4;--bp-gold:#d98a00;--bp-green:#12a150;font-family:inherit;color:var(--bp-ink)}",
      ".pki-bpty h4{margin:0 0 4px;font-size:18px;font-weight:800}",
      ".pki-bpty .bp-sub{margin:0 0 12px;font-size:13.5px;color:#5a5470}",
      ".pki-bpty .bp-rail{display:flex;gap:8px;margin:0 0 14px}",
      ".pki-bpty .bp-pip{flex:1;height:8px;border-radius:99px;background:#ece7f5}",
      ".pki-bpty .bp-pip.done{background:linear-gradient(90deg,var(--bp-green),#0c7c3d)}",
      ".pki-bpty .bp-pip.active{background:linear-gradient(90deg,var(--bp-purple),var(--bp-pink))}",
      ".pki-bpty .bp-card{border:1px solid rgba(28,24,48,.12);border-radius:14px;padding:14px;background:#fff}",
      ".pki-bpty .bp-stageno{font-size:12px;font-weight:800;letter-spacing:.04em;text-transform:uppercase;color:var(--bp-purple)}",
      ".pki-bpty .bp-prompt{margin:6px 0 8px;font-size:15px}",
      ".pki-bpty .bp-prompt .es{display:block;color:#6b6480;font-style:italic;font-size:12.5px;margin-top:2px}",
      ".pki-bpty .bp-viz{display:block;margin:2px auto 6px;max-width:100%;height:auto}",
      ".pki-bpty .bp-ask{font-size:13px;font-weight:800;color:#3a3252;margin:6px 0 8px}",
      ".pki-bpty .bp-opts{display:flex;flex-wrap:wrap;gap:8px}",
      ".pki-bpty .bp-opt{flex:1;min-width:84px;cursor:pointer;border:2px solid #ddd5ec;background:#faf7ff;border-radius:11px;padding:12px 10px;font-size:17px;font-weight:800;color:var(--bp-ink);font-variant-numeric:tabular-nums;transition:transform .08s,border-color .12s}",
      ".pki-bpty .bp-opt:hover{transform:translateY(-1px);border-color:var(--bp-purple)}",
      ".pki-bpty .bp-opt:focus-visible{outline:3px solid rgba(123,63,228,.4);outline-offset:2px}",
      ".pki-bpty .bp-opt.ok{border-color:var(--bp-green);background:rgba(18,161,80,.12);color:var(--bp-green)}",
      ".pki-bpty .bp-opt.wrong{border-color:var(--bp-pink);animation:bpShake .3s}",
      ".pki-bpty .bp-opt:disabled{cursor:default}",
      ".pki-bpty .bp-msg{min-height:20px;margin:10px 0 0;font-size:13.5px;font-weight:700}",
      ".pki-bpty .bp-msg.hint{color:var(--bp-gold)}",
      ".pki-bpty .bp-msg.ok{color:var(--bp-green)}",
      ".pki-bpty .bp-check{display:flex;flex-wrap:wrap;gap:8px;margin:12px 0 0}",
      ".pki-bpty .bp-chip{flex:1;min-width:110px;text-align:center;border:2px dashed #d3cbe6;border-radius:10px;padding:8px 6px;font-size:12.5px;font-weight:700;color:#9990b0;background:#faf7ff}",
      ".pki-bpty .bp-chip.lit{border-style:solid;border-color:var(--bp-green);color:var(--bp-green);background:rgba(18,161,80,.08)}",
      ".pki-bpty .bp-done{text-align:center;padding:18px 12px}",
      ".pki-bpty .bp-banner{display:inline-block;font-size:24px;font-weight:900;letter-spacing:.04em;background:linear-gradient(90deg,var(--bp-purple),var(--bp-pink));-webkit-background-clip:text;background-clip:text;color:transparent}",
      ".pki-bpty .bp-again{margin-top:14px;cursor:pointer;border:0;background:var(--bp-purple);color:#fff;font-weight:800;border-radius:10px;padding:9px 16px;font-size:14px}",
      "@keyframes bpShake{0%,100%{transform:translateX(0)}25%{transform:translateX(-4px)}75%{transform:translateX(4px)}}",
      "@keyframes bpPop{0%{transform:scale(.6);opacity:0}100%{transform:scale(1);opacity:1}}",
      ".pki-bpty .bp-pop{animation:bpPop .4s}",
      "@media (prefers-reduced-motion:reduce){.pki-bpty *{animation:none!important;transition:none!important}}",
      "@media (prefers-color-scheme:dark){.pki-bpty{color:#f0ecfa}.pki-bpty .bp-card{background:#211c33;border-color:rgba(255,255,255,.14)}.pki-bpty .bp-opt,.pki-bpty .bp-chip{background:#2b2440;border-color:#453c60;color:#f0ecfa}.pki-bpty .bp-sub,.pki-bpty .bp-prompt .es,.pki-bpty .bp-chip{color:#b7aecf}}",
    ].join("\n");
    document.head.appendChild(s);
  }

  // Stage data by level. Each stage: {kind, a, b, aDisp?, ans (choice string), choices[]}
  //   gcf: most equal goodie bags       -> GCF(a,b)
  //   lcm: DJ loop + games line up      -> LCM(a,b)
  //   div: budget split among guests    -> aDisp ÷ b   (ans is a $ string)
  // Distractors: GCF stages offer LCM + a smaller common factor; LCM stages
  // offer the product + the GCF; budget offers place-value / quotient slips.
  var SETS = {
    0: [
      { kind: "gcf", a: 12, b: 8, ans: "4", choices: ["4", "2", "24"] },
      { kind: "lcm", a: 4, b: 6, ans: "12", choices: ["12", "24", "2"] },
    ],
    1: [
      { kind: "gcf", a: 24, b: 36, ans: "12", choices: ["6", "12", "72"] },
      { kind: "lcm", a: 8, b: 12, ans: "24", choices: ["96", "24", "4"] },
      { kind: "div", a: 96, b: 8, aDisp: "$96", ans: "$12", choices: ["$8", "$12", "$24"] },
    ],
    2: [
      { kind: "gcf", a: 84, b: 60, ans: "12", choices: ["6", "420", "12"] },
      { kind: "lcm", a: 9, b: 15, ans: "45", choices: ["135", "3", "45"] },
      {
        kind: "div",
        a: 153.6,
        b: 12,
        aDisp: "$153.60",
        ans: "$12.80",
        choices: ["$15.36", "$12.60", "$12.80"],
      },
    ],
  };

  // Per-kind copy: checklist chip + prompt + question + kind-hint + worked line.
  var META = {
    gcf: { icon: "🎁", en: "Goodie bags", es: "Bolsas sorpresa" },
    lcm: { icon: "🎵", en: "Entertainment", es: "Entretenimiento" },
    div: { icon: "💰", en: "Budget", es: "Presupuesto" },
  };

  function promptOf(st) {
    if (st.kind === "gcf")
      return {
        en:
          "Pack " +
          st.a +
          " treats and " +
          st.b +
          " favors into equal goodie bags with none left over. What is the MOST bags you can make?",
        es:
          "Empaca " +
          st.a +
          " golosinas y " +
          st.b +
          " regalitos en bolsas iguales sin que sobre nada. ¿Cuál es el MAYOR número de bolsas?",
        ask: "Most equal bags?",
      };
    if (st.kind === "lcm")
      return {
        en:
          "The DJ's song loops every " +
          st.a +
          " min and the games restart every " +
          st.b +
          " min. They start together — after how many minutes do they line up again?",
        es:
          "La canción del DJ se repite cada " +
          st.a +
          " min y los juegos reinician cada " +
          st.b +
          " min. Empiezan juntos — ¿en cuántos minutos vuelven a coincidir?",
        ask: "First shared minute?",
      };
    return {
      en:
        "You have " +
        st.aDisp +
        " to split evenly among " +
        st.b +
        " guests. How much can you spend per guest?",
      es:
        "Tienes " +
        st.aDisp +
        " para repartir por igual entre " +
        st.b +
        " invitados. ¿Cuánto puedes gastar por invitado?",
      ask: "Cost per guest?",
    };
  }

  function hintOf(st) {
    if (st.kind === "gcf")
      return "Not quite — think of the BIGGEST number that divides BOTH counts with nothing left over.";
    if (st.kind === "lcm")
      return "Not quite — find the FIRST minute that is a multiple of BOTH times.";
    return "Not quite — divide the TOTAL by the number of guests.";
  }

  function workOf(st) {
    if (st.kind === "gcf") return "GCF(" + st.a + ", " + st.b + ") = " + st.ans;
    if (st.kind === "lcm") return "LCM(" + st.a + ", " + st.b + ") = " + st.ans;
    return st.aDisp + " ÷ " + st.b + " = " + st.ans;
  }

  function visualOf(st) {
    var head =
      '<svg class="bp-viz" width="238" height="94" viewBox="0 0 238 94" role="img" aria-label="';
    if (st.kind === "gcf") {
      return (
        head +
        'goodie bags visual">' +
        bag(58, st.a, "🍬") +
        '<text x="119" y="52" text-anchor="middle" font-size="20" font-weight="800" fill="#9990b0">&amp;</text>' +
        bag(180, st.b, "🎈") +
        "</svg>"
      );
    }
    if (st.kind === "lcm") {
      return (
        head +
        'entertainment timing visual">' +
        loop(64, st.a, "🎧", "#7b3fe4") +
        loop(174, st.b, "🎮", "#d98a00") +
        "</svg>"
      );
    }
    return (
      head +
      'budget visual">' +
      '<rect x="44" y="24" width="150" height="48" rx="9" fill="rgba(18,161,80,.12)" stroke="#12a150" stroke-width="2.5"/>' +
      '<text x="119" y="48" text-anchor="middle" font-size="19" font-weight="800" fill="#0c7c3d" font-variant-numeric="tabular-nums">' +
      st.aDisp +
      "</text>" +
      '<text x="119" y="66" text-anchor="middle" font-size="11.5" font-weight="700" fill="#5a5470">split among ' +
      st.b +
      " guests</text>" +
      "</svg>"
    );
  }

  function bag(cx, count, emoji) {
    var x = cx - 26;
    return (
      '<path d="M' +
      x +
      ' 34 h52 v42 a6 6 0 0 1 -6 6 h-40 a6 6 0 0 1 -6 -6 z" fill="rgba(224,64,127,.14)" stroke="#e0407f" stroke-width="2.5"/>' +
      '<path d="M' +
      x +
      ' 40 h52" stroke="#e0407f" stroke-width="2"/>' +
      '<text x="' +
      cx +
      '" y="26" text-anchor="middle" font-size="14">' +
      emoji +
      "</text>" +
      '<text x="' +
      cx +
      '" y="66" text-anchor="middle" font-size="20" font-weight="800" fill="#e0407f" font-variant-numeric="tabular-nums">' +
      count +
      "</text>"
    );
  }

  function loop(cx, mins, emoji, color) {
    return (
      '<circle cx="' +
      cx +
      '" cy="42" r="25" fill="none" stroke="' +
      color +
      '" stroke-width="4" stroke-dasharray="6 5"/>' +
      '<text x="' +
      cx +
      '" y="40" text-anchor="middle" font-size="17">' +
      emoji +
      "</text>" +
      '<text x="' +
      cx +
      '" y="86" text-anchor="middle" font-size="11" font-weight="700" fill="#5a5470">every ' +
      mins +
      " min</text>"
    );
  }

  function levelOf() {
    var m = String(document.body.className || "").match(/level-(\d)/);
    return m ? Math.max(0, Math.min(2, parseInt(m[1], 10))) : 1;
  }

  function shuffled(list, seed) {
    // deterministic rotation so the correct answer isn't always in one slot
    var a = list.slice();
    for (var i = 0; i < seed % a.length; i++) a.push(a.shift());
    return a;
  }

  function init(el) {
    if (el.dataset.pkiManipDone) return;
    el.dataset.pkiManipDone = "1";
    injectCSS();
    el.classList.add("pki-bpty");

    var state = { idx: 0, level: levelOf(), done: [] };

    function stages() {
      return SETS[state.level] || SETS[1];
    }

    function checklist(S) {
      var html = '<div class="bp-check">';
      for (var i = 0; i < S.length; i++) {
        var m = META[S[i].kind];
        html +=
          '<span class="bp-chip ' +
          (state.done[i] ? "lit" : "") +
          '" data-chip="' +
          i +
          '">' +
          m.icon +
          " " +
          m.en +
          (state.done[i] ? " ✓" : "") +
          "</span>";
      }
      return html + "</div>";
    }

    function render() {
      var S = stages();
      var total = S.length;
      var rail = '<div class="bp-rail">';
      for (var i = 0; i < total; i++)
        rail +=
          '<div class="bp-pip ' +
          (i < state.idx ? "done" : i === state.idx ? "active" : "") +
          '"></div>';
      rail += "</div>";

      var head =
        "<h4>🎉 Block Party Planner</h4>" +
        '<p class="bp-sub">Planifica la fiesta — solve each stage to lock in your plan.</p>' +
        rail;

      if (state.idx >= total) {
        el.innerHTML =
          head +
          '<div class="bp-card bp-done"><div class="bp-banner bp-pop">🎉 PARTY READY!</div>' +
          '<p style="margin:12px 0 0;font-weight:700">Every part of the plan is locked in — the block party is a go!' +
          '<span style="display:block;color:#6b6480;font-style:italic;font-size:12.5px;margin-top:3px">¡Todo el plan está listo — la fiesta está lista!</span></p>' +
          checklist(S) +
          '<button type="button" class="bp-again" data-again>Plan another party</button></div>';
        el.querySelector("[data-again]").addEventListener("click", function () {
          state.idx = 0;
          state.done = [];
          state.level = levelOf();
          render();
        });
        return;
      }

      var st = S[state.idx];
      var p = promptOf(st);
      var m = META[st.kind];
      var opts = shuffled(st.choices, state.idx + st.a);
      var optsHtml = opts
        .map(function (c) {
          return '<button type="button" class="bp-opt" data-val="' + c + '">' + c + "</button>";
        })
        .join("");

      el.innerHTML =
        head +
        '<div class="bp-card">' +
        '<div class="bp-stageno">Stage ' +
        (state.idx + 1) +
        " of " +
        total +
        " · " +
        m.icon +
        " " +
        m.en +
        "</div>" +
        '<p class="bp-prompt">' +
        p.en +
        '<span class="es">' +
        p.es +
        "</span></p>" +
        visualOf(st) +
        '<p class="bp-ask">' +
        p.ask +
        "</p>" +
        '<div class="bp-opts">' +
        optsHtml +
        "</div>" +
        '<p class="bp-msg" data-msg aria-live="polite"></p>' +
        "</div>" +
        checklist(S);

      var msg = el.querySelector("[data-msg]");
      var btns = el.querySelectorAll(".bp-opt");
      btns.forEach(function (btn) {
        btn.addEventListener("click", function () {
          if (btn.disabled) return;
          if (btn.dataset.val === st.ans) {
            btns.forEach(function (b) {
              b.disabled = true;
            });
            btn.classList.add("ok");
            state.done[state.idx] = true;
            var chip = el.querySelector('[data-chip="' + state.idx + '"]');
            if (chip) {
              chip.classList.add("lit");
              chip.textContent = m.icon + " " + m.en + " ✓";
            }
            msg.className = "bp-msg ok";
            msg.textContent = "✓ " + m.en + " locked in! " + workOf(st);
            setTimeout(function () {
              state.idx++;
              render();
            }, 1300);
          } else {
            btn.classList.add("wrong");
            setTimeout(function () {
              btn.classList.remove("wrong");
            }, 350);
            msg.className = "bp-msg hint";
            msg.textContent = hintOf(st);
          }
        });
      });
    }

    render();

    // Re-theme if the teacher/student switches level (body class changes),
    // but only before the first answer so progress isn't wiped mid-run.
    var obs = new MutationObserver(function () {
      var lv = levelOf();
      if (lv !== state.level && state.idx === 0 && state.done.length === 0) {
        state.level = lv;
        render();
      }
    });
    obs.observe(document.body, { attributes: true, attributeFilter: ["class"] });
  }

  function scan() {
    document.querySelectorAll('.pki-manip[data-manip="block-party"]').forEach(init);
  }
  ready(scan);
  setTimeout(scan, 900);
  if (typeof window !== "undefined") {
    window.NeftManips = window.NeftManips || {};
    window.NeftManips["block-party"] = init;
  }
})();
