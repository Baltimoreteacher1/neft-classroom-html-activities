/* ==========================================================================
   Neft Teacher — Manipulative: GROWTH ROOM (data-manip="growth-room")
   A rate-forecast dashboard for constant rate of change (6.AT rate reasoning).
   You run a streaming channel: given a STARTING subscriber count and a GOAL to
   hit by a deadline week, set your WEEKLY GROWTH RATE (new subs per week) with a
   +/- stepper/slider. A live SVG line graph draws subs = start + rate × week and
   a live readout shows the projected total at the deadline and whether it clears
   the goal. Press RUN THE SEASON to tick the weeks and lock GOAL MET / short.
     Math win = pick a rate so start + rate × weeks ≥ goal (and, at the top
     level, find the MINIMUM whole rate that hits it). A "peek week" reader lets
     students read any point off the line. That IS the rate reasoning.
   Self-mounting + self-styling like the other manip-*.js. Level-aware
   (body.level-0/1/2), bilingual, no-fail (adjust + re-run freely).
   Usage:  <div class="pki-manip" data-manip="growth-room"></div>
   ========================================================================== */
(function () {
  "use strict";
  if (typeof document === "undefined") return;
  var STYLE_ID = "pki-gr-styles";

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
      ".pki-gr{--gr-ink:#141c2e;--gr-blue:#2f6bff;--gr-green:#12a150;--gr-red:#d33;--gr-amber:#e08a00;font-family:inherit;color:var(--gr-ink)}",
      ".pki-gr h4{margin:0 0 4px;font-size:18px;font-weight:800}",
      ".pki-gr .gr-sub{margin:0 0 12px;font-size:13.5px;color:#5a6478}",
      ".pki-gr .gr-sub .es{display:block;font-style:italic;font-size:12px;color:#7a8399}",
      ".pki-gr .gr-card{border:1px solid rgba(20,28,46,.12);border-radius:14px;padding:14px;background:#fff}",
      ".pki-gr .gr-facts{display:flex;flex-wrap:wrap;gap:8px;margin:0 0 12px}",
      ".pki-gr .gr-fact{flex:1;min-width:88px;text-align:center;background:#f4f8ff;border:1px solid #e0e8f8;border-radius:10px;padding:8px 6px;font-size:11px;font-weight:700;color:#5a6478}",
      ".pki-gr .gr-fact b{display:block;font-size:16px;color:var(--gr-ink);font-variant-numeric:tabular-nums}",
      ".pki-gr .gr-fact.goal b{color:var(--gr-amber)}",
      ".pki-gr .gr-graph{border:1px solid #e6ebf5;border-radius:12px;background:#fbfcff;margin:0 0 12px}",
      ".pki-gr .gr-graph svg{display:block;width:100%;height:auto}",
      ".pki-gr .gr-ctl{margin:4px 0 10px}",
      ".pki-gr .gr-ctl label{font-size:13px;font-weight:800;display:flex;justify-content:space-between;align-items:baseline}",
      ".pki-gr .gr-ctl label b{color:var(--gr-blue);font-size:16px;font-variant-numeric:tabular-nums}",
      ".pki-gr .gr-row{display:flex;align-items:center;gap:8px;margin-top:6px}",
      ".pki-gr .gr-step{cursor:pointer;border:2px solid #d5ddec;background:#f4f8ff;color:var(--gr-ink);border-radius:9px;width:40px;height:40px;font-size:20px;font-weight:800}",
      ".pki-gr .gr-step:focus-visible{outline:3px solid rgba(47,107,255,.5);outline-offset:2px}",
      ".pki-gr input[type=range]{flex:1;accent-color:var(--gr-blue)}",
      ".pki-gr .gr-derived{display:flex;flex-wrap:wrap;gap:8px;margin:10px 0 0}",
      ".pki-gr .gr-d{flex:1;min-width:120px;background:#f2f6ff;border-radius:10px;padding:8px 10px;font-size:12px;font-weight:700;color:#34405a}",
      ".pki-gr .gr-d b{display:block;font-size:16px;font-variant-numeric:tabular-nums}",
      ".pki-gr .gr-d.win b{color:var(--gr-green)}.pki-gr .gr-d.lose b{color:var(--gr-red)}",
      ".pki-gr .gr-peek{display:flex;align-items:center;gap:8px;margin:12px 0 0;font-size:12.5px;font-weight:700;color:#34405a;flex-wrap:wrap}",
      ".pki-gr .gr-peek .gr-peekval{color:var(--gr-blue);font-variant-numeric:tabular-nums}",
      ".pki-gr .gr-mini{cursor:pointer;border:2px solid #d5ddec;background:#f4f8ff;color:var(--gr-ink);border-radius:8px;width:30px;height:30px;font-size:16px;font-weight:800}",
      ".pki-gr .gr-run{margin-top:12px;width:100%;cursor:pointer;border:0;background:linear-gradient(90deg,var(--gr-blue),#1748c0);color:#fff;font-weight:800;border-radius:11px;padding:12px;font-size:16px}",
      ".pki-gr .gr-result{margin:12px 0 0;text-align:center}",
      ".pki-gr .gr-verdict{font-size:20px;font-weight:900}",
      ".pki-gr .gr-verdict.win{color:var(--gr-green)}.pki-gr .gr-verdict.lose{color:var(--gr-red)}",
      ".pki-gr .gr-msg{min-height:18px;font-size:13px;font-weight:700;color:var(--gr-amber);margin-top:6px}",
      ".pki-gr .gr-again{margin-top:12px;cursor:pointer;border:0;background:var(--gr-green);color:#fff;font-weight:800;border-radius:10px;padding:9px 16px;font-size:14px}",
      ".pki-gr .gr-hint{font-size:12px;color:#5a6478;margin:10px 0 0;line-height:1.4}",
      "@media (prefers-reduced-motion:reduce){.pki-gr *{transition:none!important;animation:none!important}}",
      "@media (prefers-color-scheme:dark){.pki-gr{color:#eef2fb}.pki-gr .gr-card{background:#1b2233;border-color:rgba(255,255,255,.14)}.pki-gr .gr-fact,.pki-gr .gr-d{background:#232c40;border-color:#39435c;color:#c6cede}.pki-gr .gr-fact b{color:#eef2fb}.pki-gr .gr-graph{background:#161d2c;border-color:#39435c}.pki-gr .gr-step,.pki-gr .gr-mini{background:#232c40;border-color:#39435c;color:#eef2fb}.pki-gr .gr-hint,.pki-gr .gr-sub{color:#9aa4ba}}",
    ].join("\n");
    document.head.appendChild(s);
  }

  // Level configs. rate so start + rate*weeks (minus dip) >= goal is always
  // reachable within [0,max]. dip = subs lost the week the mid-season dip hits.
  var CFG = {
    0: { start: 100, weeks: 4, goal: 300, step: 25, max: 150, dip: 0, dipWeek: 0 },
    1: { start: 250, weeks: 8, goal: 1050, step: 10, max: 200, dip: 0, dipWeek: 0 },
    2: { start: 400, weeks: 10, goal: 1500, step: 25, max: 250, dip: 150, dipWeek: 5 },
  };

  function levelOf() {
    var m = String(document.body.className || "").match(/level-(\d)/);
    return m ? Math.max(0, Math.min(2, parseInt(m[1], 10))) : 1;
  }
  function num(n) {
    return Math.round(n).toLocaleString("en-US");
  }
  function reduceMotion() {
    return (
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    );
  }

  function init(el) {
    if (el.dataset.pkiManipDone) return;
    el.dataset.pkiManipDone = "1";
    injectCSS();
    el.classList.add("pki-gr");
    var level = levelOf();
    var c = Object.assign({}, CFG[level] || CFG[1]);
    var state = { rate: 0, peek: c.weeks, ran: false, timers: [] };

    // subscribers on the projection line at a given week
    function subsAt(week) {
      var v = c.start + state.rate * week;
      if (c.dip && week >= c.dipWeek) v -= c.dip;
      return Math.max(0, v);
    }
    // minimum WHOLE rate (subs/week) that clears the goal by the deadline
    function neededRate() {
      return Math.max(0, Math.ceil((c.goal - c.start + (c.dip || 0)) / c.weeks));
    }
    function finalSubs() {
      return subsAt(c.weeks);
    }
    function meetsGoal() {
      return finalSubs() >= c.goal - 1e-9;
    }

    // ---- SVG line graph ------------------------------------------------------
    var W = 320,
      H = 176,
      padL = 40,
      padR = 12,
      padT = 12,
      padB = 26;
    var plotW = W - padL - padR,
      plotH = H - padT - padB;

    function chartMaxY() {
      var raw = Math.max(c.goal, finalSubs(), c.start);
      return raw * 1.15 || 1;
    }
    function px(week) {
      return padL + (week / c.weeks) * plotW;
    }
    function py(subs, maxY) {
      return padT + plotH * (1 - subs / maxY);
    }

    function graphSVG(uptoWeek) {
      var maxY = chartMaxY();
      var upto = uptoWeek == null ? c.weeks : uptoWeek;
      var pts = [];
      for (var w = 0; w <= c.weeks; w++) pts.push([px(w), py(subsAt(w), maxY)]);
      var line = pts
        .slice(0, upto + 1)
        .map(function (p) {
          return p[0].toFixed(1) + "," + p[1].toFixed(1);
        })
        .join(" ");
      var dots = pts
        .slice(0, upto + 1)
        .map(function (p) {
          return (
            '<circle cx="' +
            p[0].toFixed(1) +
            '" cy="' +
            p[1].toFixed(1) +
            '" r="2.6" fill="#2f6bff"/>'
          );
        })
        .join("");
      var goalY = py(c.goal, maxY);
      var head = px(upto),
        headY = py(subsAt(upto), maxY);
      var peekX = px(state.peek),
        peekY = py(subsAt(state.peek), maxY);
      return (
        '<svg viewBox="0 0 ' +
        W +
        " " +
        H +
        '" role="img" aria-label="Subscriber growth projection">' +
        // axes
        '<line x1="' +
        padL +
        '" y1="' +
        padT +
        '" x2="' +
        padL +
        '" y2="' +
        (padT + plotH) +
        '" stroke="#c3ccdd" stroke-width="1"/>' +
        '<line x1="' +
        padL +
        '" y1="' +
        (padT + plotH) +
        '" x2="' +
        (W - padR) +
        '" y2="' +
        (padT + plotH) +
        '" stroke="#c3ccdd" stroke-width="1"/>' +
        // goal line
        '<line x1="' +
        padL +
        '" y1="' +
        goalY.toFixed(1) +
        '" x2="' +
        (W - padR) +
        '" y2="' +
        goalY.toFixed(1) +
        '" stroke="#e08a00" stroke-width="1.5" stroke-dasharray="5 4"/>' +
        '<text x="' +
        (W - padR) +
        '" y="' +
        (goalY - 4).toFixed(1) +
        '" text-anchor="end" font-size="10" font-weight="700" fill="#e08a00">Goal ' +
        num(c.goal) +
        "</text>" +
        // axis labels
        '<text x="' +
        padL +
        '" y="' +
        (H - 8) +
        '" font-size="10" fill="#8a93a8">wk 0</text>' +
        '<text x="' +
        (W - padR) +
        '" y="' +
        (H - 8) +
        '" text-anchor="end" font-size="10" fill="#8a93a8">wk ' +
        c.weeks +
        "</text>" +
        '<text x="4" y="' +
        (padT + 8) +
        '" font-size="9" fill="#8a93a8">subs</text>' +
        // projection line + dots
        '<polyline points="' +
        line +
        '" fill="none" stroke="#2f6bff" stroke-width="2.5" stroke-linejoin="round"/>' +
        dots +
        // running head marker
        '<circle cx="' +
        head.toFixed(1) +
        '" cy="' +
        headY.toFixed(1) +
        '" r="5" fill="#12a150" stroke="#fff" stroke-width="1.5"/>' +
        // peek marker (read a point off the line)
        '<circle cx="' +
        peekX.toFixed(1) +
        '" cy="' +
        peekY.toFixed(1) +
        '" r="4" fill="none" stroke="#d33" stroke-width="2"/>' +
        '<line x1="' +
        peekX.toFixed(1) +
        '" y1="' +
        (padT + plotH) +
        '" x2="' +
        peekX.toFixed(1) +
        '" y2="' +
        peekY.toFixed(1) +
        '" stroke="#d33" stroke-width="1" stroke-dasharray="2 3"/>' +
        "</svg>"
      );
    }

    // ---- shell ---------------------------------------------------------------
    function shell() {
      var facts =
        '<div class="gr-facts">' +
        '<div class="gr-fact">Start subs<b>' +
        num(c.start) +
        "</b></div>" +
        '<div class="gr-fact">Deadline<b>wk ' +
        c.weeks +
        "</b></div>" +
        '<div class="gr-fact goal">Goal<b>' +
        num(c.goal) +
        "</b></div>" +
        (c.dip
          ? '<div class="gr-fact">Dip wk ' + c.dipWeek + "<b>−" + num(c.dip) + "</b></div>"
          : "") +
        "</div>";
      var ctl =
        '<div class="gr-ctl"><label>Weekly growth rate <b data-rlabel>' +
        num(state.rate) +
        "/wk</b></label>" +
        '<div class="gr-row"><button type="button" class="gr-step" data-dec aria-label="lower rate">−</button>' +
        '<input type="range" min="0" max="' +
        c.max +
        '" step="' +
        c.step +
        '" value="' +
        state.rate +
        '" data-slider aria-label="weekly growth rate">' +
        '<button type="button" class="gr-step" data-inc aria-label="raise rate">+</button></div></div>';
      var derived =
        '<div class="gr-derived">' +
        '<div class="gr-d">Rate (unit)<b data-unit>' +
        num(state.rate) +
        "/wk</b></div>" +
        '<div class="gr-d ' +
        (meetsGoal() ? "win" : "lose") +
        '" data-projbox>Projected wk ' +
        c.weeks +
        "<b data-proj>" +
        num(finalSubs()) +
        "</b></div>" +
        '<div class="gr-d ' +
        (meetsGoal() ? "win" : "lose") +
        '" data-gapbox>' +
        (meetsGoal() ? "Over goal by" : "Short by") +
        "<b data-gap>" +
        num(Math.abs(finalSubs() - c.goal)) +
        "</b></div>" +
        "</div>";
      var peek =
        '<div class="gr-peek">📈 Read the line — at week ' +
        '<button type="button" class="gr-mini" data-pdec aria-label="earlier week">−</button>' +
        "<b data-pweek>" +
        state.peek +
        "</b>" +
        '<button type="button" class="gr-mini" data-pinc aria-label="later week">+</button>' +
        ' → <span class="gr-peekval" data-pval>' +
        num(subsAt(state.peek)) +
        " subs</span></div>";
      var hint =
        '<p class="gr-hint">💡 Each week adds your rate: <b>total = start + rate × weeks</b>. ' +
        "Raise the rate until the blue line clears the dashed goal line" +
        (c.dip ? ", even after the mid-season dip" : "") +
        (level === 2
          ? ". Challenge: find the <b>smallest whole rate</b> that still hits the goal."
          : ".") +
        "</p>";
      return (
        "<h4>📡 Growth Room</h4>" +
        '<p class="gr-sub">Forecast your streaming channel — set a weekly rate that reaches the goal by the deadline.' +
        '<span class="es">Sala de crecimiento — elige una tasa semanal que alcance la meta antes de la fecha límite.</span></p>' +
        '<div class="gr-card">' +
        facts +
        '<div class="gr-graph" data-graph>' +
        graphSVG() +
        "</div>" +
        ctl +
        derived +
        peek +
        '<button type="button" class="gr-run" data-run>▶ RUN THE SEASON</button>' +
        '<div class="gr-result" data-result></div>' +
        '<div class="gr-msg" data-msg aria-live="polite"></div>' +
        hint +
        "</div>"
      );
    }

    function q(s) {
      return el.querySelector(s);
    }

    function refresh() {
      if (q("[data-rlabel]")) q("[data-rlabel]").textContent = num(state.rate) + "/wk";
      if (q("[data-unit]")) q("[data-unit]").textContent = num(state.rate) + "/wk";
      if (q("[data-proj]")) q("[data-proj]").textContent = num(finalSubs());
      var met = meetsGoal();
      var pb = q("[data-projbox]");
      if (pb) {
        pb.classList.toggle("win", met);
        pb.classList.toggle("lose", !met);
      }
      var gb = q("[data-gapbox]");
      if (gb) {
        gb.classList.toggle("win", met);
        gb.classList.toggle("lose", !met);
        gb.childNodes[0].nodeValue = met ? "Over goal by" : "Short by";
      }
      if (q("[data-gap]")) q("[data-gap]").textContent = num(Math.abs(finalSubs() - c.goal));
      if (q("[data-pweek]")) q("[data-pweek]").textContent = state.peek;
      if (q("[data-pval]")) q("[data-pval]").textContent = num(subsAt(state.peek)) + " subs";
      var g = q("[data-graph]");
      if (g) g.innerHTML = graphSVG();
    }

    function clearTimers() {
      state.timers.forEach(clearTimeout);
      state.timers = [];
    }

    function runSeason() {
      clearTimers();
      var resBox = q("[data-result]"),
        msg = q("[data-msg]"),
        graph = q("[data-graph]");
      resBox.innerHTML = "";
      msg.textContent = "";
      var met = meetsGoal();

      function finish() {
        var over = finalSubs() - c.goal;
        resBox.innerHTML =
          "<p style='margin:0;font-weight:700'>Week " +
          c.weeks +
          " total: <b style='font-variant-numeric:tabular-nums'>" +
          num(finalSubs()) +
          "</b> vs goal " +
          num(c.goal) +
          "</p>" +
          '<div class="gr-verdict ' +
          (met ? "win" : "lose") +
          '">' +
          (met ? "🎉 GOAL MET — channel is booming!" : "📉 " + num(-over) + " subs short") +
          "</div>" +
          '<button type="button" class="gr-again" data-again>Run it again</button>';
        q("[data-again]").addEventListener("click", function () {
          state.ran = false;
          state.rate = 0;
          var sl = q("[data-slider]");
          if (sl) sl.value = 0;
          refresh();
          resBox.innerHTML = "";
          msg.textContent = "";
        });
        if (!met) {
          var need = neededRate();
          msg.textContent =
            "Try a rate of at least " +
            num(need) +
            "/week" +
            (c.dip
              ? " to recover from the week-" + c.dipWeek + " dip and still reach the goal."
              : " to reach the goal.");
        } else if (level === 2 && state.rate > neededRate()) {
          msg.textContent =
            "Nice! You cleared it — can you find the exact minimum rate (" +
            num(neededRate()) +
            "/week) that still meets the goal?";
        }
        state.ran = true;
      }

      if (reduceMotion()) {
        graph.innerHTML = graphSVG(c.weeks);
        finish();
        return;
      }
      // tick the weeks one at a time, drawing the line as it goes
      var wk = 0;
      (function tick() {
        graph.innerHTML = graphSVG(wk);
        if (wk >= c.weeks) {
          state.timers.push(setTimeout(finish, 220));
          return;
        }
        wk++;
        state.timers.push(setTimeout(tick, 260));
      })();
    }

    function render() {
      clearTimers();
      el.innerHTML = shell();
      var slider = q("[data-slider]");
      slider.addEventListener("input", function () {
        state.rate = parseInt(slider.value, 10) || 0;
        refresh();
      });
      q("[data-inc]").addEventListener("click", function () {
        state.rate = Math.min(c.max, state.rate + c.step);
        slider.value = state.rate;
        refresh();
      });
      q("[data-dec]").addEventListener("click", function () {
        state.rate = Math.max(0, state.rate - c.step);
        slider.value = state.rate;
        refresh();
      });
      q("[data-pinc]").addEventListener("click", function () {
        state.peek = Math.min(c.weeks, state.peek + 1);
        refresh();
      });
      q("[data-pdec]").addEventListener("click", function () {
        state.peek = Math.max(0, state.peek - 1);
        refresh();
      });
      q("[data-run]").addEventListener("click", runSeason);
    }

    render();

    var obs = new MutationObserver(function () {
      var lv = levelOf();
      if (lv !== level && !state.ran) {
        level = lv;
        c = Object.assign({}, CFG[lv] || CFG[1]);
        state = { rate: 0, peek: c.weeks, ran: false, timers: [] };
        render();
      }
    });
    obs.observe(document.body, { attributes: true, attributeFilter: ["class"] });
  }

  function scan() {
    document.querySelectorAll('.pki-manip[data-manip="growth-room"]').forEach(init);
  }
  ready(scan);
  setTimeout(scan, 900);
  if (typeof window !== "undefined") {
    window.NeftManips = window.NeftManips || {};
    window.NeftManips["growth-room"] = init;
  }
})();
