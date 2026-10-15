/* EWL.Fluency — the Fluency Spiral: short seeded fact sessions that revisit older skills while the new one grows.
 *
 *   var code = EWL.Fluency.newCode();                    // "KITE-4821": share it, everyone gets the same items
 *   var plan = EWL.Fluency.plan(code, 20, unit);         // 12 new / 5 review / 3 stretch (60 / 25 / 15), shuffled by the code
 *   EWL.Fluency.judge(item, "60%")                       // exact: any form of the same number is right
 *   EWL.Fluency.mount(host, { unit: 4, code: code, n: 20 })   // the session UI
 *   EWL.Fluency.hud(host)                                // streak, accuracy, best and the mix, from EWLStateStore
 *
 * There is no clock. A "sprint" is a fixed number of items that a whole class can run from one code and compare.
 * A miss never prints the answer first: it offers a picture (built in one synchronous pass, well under 200ms),
 * and only a second miss shows the checked fact once and puts that fact back later in the same session.
 * Answers are exact EWL.Rat values, so 3/5, 0.6 and 60% are the same answer.
 */
(function (root) {
  "use strict";
  var EWL = (root.EWL = root.EWL || {});
  var R = EWL.Rat;

  var WORDS = [
    "KITE",
    "MAPLE",
    "COMET",
    "RIVER",
    "ORBIT",
    "LANTERN",
    "PEBBLE",
    "HARBOR",
    "CEDAR",
    "FALCON",
    "MEADOW",
    "ZEPHYR",
    "TULIP",
    "BEACON",
    "QUARTZ",
    "SAVANNA",
  ];
  var CODE_RE = /^([A-Z]{3,8})-(\d{4})$/;

  /* ----- item makers: each returns {kind, prompt, promptEs, answer, visual} from a seeded rng ----- */
  var MAKERS = {
    mult: function (r) {
      var a = r.int(2, 12);
      var b = r.int(2, 12);
      return {
        prompt: a + " × " + b,
        promptEs: a + " × " + b,
        answer: R.of(a * b),
        visual: { t: "array", rows: a, cols: b },
      };
    },
    div: function (r) {
      var b = r.int(2, 12);
      var q = r.int(2, 12);
      return {
        prompt: b * q + " ÷ " + b,
        promptEs: b * q + " ÷ " + b,
        answer: R.of(q),
        visual: { t: "array", rows: b, cols: q },
      };
    },
    equiv: function (r) {
      var d = r.pick([2, 3, 4, 5, 6, 8]);
      var n = r.int(1, d - 1);
      var k = r.int(2, 6);
      return {
        prompt: n + "/" + d + " = ?/" + d * k + "  (write the missing top number)",
        promptEs: n + "/" + d + " = ?/" + d * k + "  (escribe el numerador que falta)",
        answer: R.of(n * k),
        visual: { t: "strip", parts: d, shaded: n, split: k },
      };
    },
    fracadd: function (r) {
      var d = r.pick([3, 4, 5, 6, 8, 10]);
      var a = r.int(1, d - 1);
      var b = r.int(1, d - 1);
      var x = R.of(a, d);
      var y = R.of(b, d);
      return {
        prompt: x.frac() + " + " + y.frac(),
        promptEs: x.frac() + " + " + y.frac(),
        answer: x.add(y),
        visual: { t: "strip", parts: d, shaded: a, extra: b },
      };
    },
    fracof: function (r) {
      var d = r.pick([2, 3, 4, 5, 6, 8]);
      var w = d * r.int(2, 9);
      return {
        prompt: "1/" + d + " of " + w,
        promptEs: "1/" + d + " de " + w,
        answer: R.of(w, d),
        visual: { t: "tape", parts: d, total: w },
      };
    },
    pctof: function (r) {
      var p = r.pick([10, 20, 25, 50, 75]);
      var w = r.pick([20, 40, 60, 80, 120, 200]);
      return {
        prompt: p + "% of " + w,
        promptEs: p + " % de " + w,
        answer: R.of(p * w, 100),
        visual: {
          t: "tape",
          parts: p % 25 === 0 ? 4 : 10,
          total: w,
          pct: p,
        },
      };
    },
    decmul: function (r) {
      var a = r.pick(["0.2", "0.5", "0.25", "1.5", "0.4", "0.75"]);
      var b = r.pick([2, 4, 5, 8, 10]);
      return {
        prompt: a + " × " + b,
        promptEs: a + " × " + b,
        answer: R.parse(a).mul(b),
        visual: { t: "tape", parts: b, total: R.parse(a).mul(b).num(), each: a },
      };
    },
    intadd: function (r) {
      var a = r.int(-12, 12);
      var b = r.int(-12, 12);
      if (a === 0) a = 5;
      return {
        prompt: a + " + " + (b < 0 ? "(" + b + ")" : b),
        promptEs: a + " + " + (b < 0 ? "(" + b + ")" : b),
        answer: R.of(a + b),
        visual: { t: "nline", from: a, move: b },
      };
    },
    exp: function (r) {
      var n = r.int(2, 9);
      var p = r.pick([2, 2, 3]);
      var ok = p === 3 ? Math.min(n, 5) : n;
      return {
        prompt: ok + (p === 2 ? "²" : "³"),
        promptEs: ok + (p === 2 ? "²" : "³"),
        answer: R.of(Math.pow(ok, p)),
        visual: { t: "array", rows: ok, cols: ok },
      };
    },
    onestep: function (r) {
      var a = r.int(2, 20);
      var x = r.int(1, 20);
      return {
        prompt: "x + " + a + " = " + (x + a) + ",  x = ?",
        promptEs: "x + " + a + " = " + (x + a) + ",  x = ?",
        answer: R.of(x),
        visual: { t: "balance", left: "x + " + a, right: String(x + a) },
      };
    },
    unitrate: function (r) {
      var u = r.int(2, 9);
      var n = r.int(3, 9);
      return {
        prompt: "$" + u * n + " for " + n + " items. Price for 1 item?",
        promptEs: "$" + u * n + " por " + n + " artículos. ¿Precio de 1?",
        answer: R.of(u),
        visual: { t: "tape", parts: n, total: u * n },
      };
    },
    area: function (r) {
      var l = r.int(3, 12);
      var w = r.int(2, 9);
      return {
        prompt: "Area of a " + l + " by " + w + " rectangle",
        promptEs: "Área de un rectángulo de " + l + " por " + w,
        answer: R.of(l * w),
        visual: { t: "array", rows: w, cols: l },
      };
    },
  };
  var KINDS = Object.keys(MAKERS);

  /* what each unit adds (new), in the repo's real unit numbers; "base" kinds are always in the review pool */
  var NEW_BY_UNIT = {
    1: ["mult", "div"],
    2: ["div", "decmul"],
    3: ["equiv", "unitrate", "mult"],
    4: ["pctof", "decmul", "equiv"],
    5: ["area", "mult", "fracof"],
    6: ["fracadd", "fracof", "exp"],
    7: ["intadd", "exp"],
    8: ["onestep", "intadd"],
    9: ["onestep", "unitrate", "decmul"],
  };
  var STRETCH = {
    2: ["fracadd"],
    3: ["pctof"],
    4: ["unitrate"],
    5: ["exp"],
    6: ["intadd"],
    7: ["onestep"],
    8: ["unitrate"],
    9: ["pctof"],
    1: ["fracof"],
  };

  function pools(unit) {
    var u = NEW_BY_UNIT[unit] ? unit : 3;
    var fresh = NEW_BY_UNIT[u];
    var earlier = [];
    for (var k = 1; k < u; k++)
      (NEW_BY_UNIT[k] || []).forEach(function (x) {
        if (fresh.indexOf(x) < 0 && earlier.indexOf(x) < 0) earlier.push(x);
      });
    if (!earlier.length) earlier = ["mult", "div"];
    var stretch = (STRETCH[u] || ["exp"]).filter(function (x) {
      return fresh.indexOf(x) < 0;
    });
    if (!stretch.length) stretch = ["exp"];
    return { new: fresh, review: earlier, stretch: stretch };
  }

  var MIX = { new: 60, review: 25, stretch: 15 };
  /** Exact quotas for n items: largest-remainder so 20 -> 12/5/3 and every n adds up. */
  function quotas(n, mix) {
    mix = mix || MIX;
    var tiers = ["new", "review", "stretch"];
    var raw = tiers.map(function (t) {
      return (n * mix[t]) / 100;
    });
    var base = raw.map(Math.floor);
    var left =
      n -
      base.reduce(function (a, b) {
        return a + b;
      }, 0);
    raw
      .map(function (v, i) {
        return { i: i, f: v - Math.floor(v) };
      })
      .sort(function (a, b) {
        return b.f - a.f || a.i - b.i;
      })
      .slice(0, left)
      .forEach(function (o) {
        base[o.i]++;
      });
    return { new: base[0], review: base[1], stretch: base[2] };
  }

  function newCode(rng) {
    var r = rng || EWL.rng(Date.now() >>> 0);
    return r.pick(WORDS) + "-" + String(r.int(0, 9999)).padStart(4, "0");
  }
  function parseCode(code) {
    var m = CODE_RE.exec(
      String(code || "")
        .trim()
        .toUpperCase(),
    );
    return m ? { word: m[1], num: m[2], seed: EWL.hash(m[1] + "-" + m[2]) } : null;
  }

  /** The whole session, determined by (code, n, unit): the same for every student who types the same code. */
  function plan(code, n, unit) {
    var c = parseCode(code);
    if (!c) throw new RangeError("EWL.Fluency.plan: bad class code " + code);
    n = Math.max(3, Math.min(60, n | 0 || 20));
    var r = EWL.rng(c.seed ^ ((unit | 0) * 2654435761));
    var p = pools(unit);
    var q = quotas(n);
    var tiers = [];
    Object.keys(q).forEach(function (t) {
      for (var i = 0; i < q[t]; i++) tiers.push(t);
    });
    tiers = r.shuffle(tiers);
    var seen = {};
    return tiers.map(function (tier, i) {
      var item;
      var tries = 0;
      do {
        var kind = r.pick(p[tier]);
        item = MAKERS[kind](r);
        item.kind = kind;
        tries++;
      } while (seen[item.prompt] && tries < 12);
      seen[item.prompt] = 1;
      item.tier = tier;
      item.id = "f" + i;
      return item;
    });
  }

  function judge(item, text) {
    var v = R.parse(String(text == null ? "" : text));
    if (!v) return { ok: false, readable: false };
    return { ok: v.eq(item.answer), readable: true, value: v };
  }

  /* ----- pictures: a synchronous SVG for every kind of visual spec ----- */
  function drawVisual(spec) {
    var h = EWL.h;
    var s = EWL.svg;
    var W = 240;
    var svg = s("svg", {
      viewBox: "0 0 " + W + " 110",
      class: "ewl-fig",
      role: "img",
      "aria-label": "Picture of the problem",
    });
    svg.appendChild(s("title", {}, "Picture of the problem"));
    function rect(x, y, w, hh, fill, stroke) {
      svg.appendChild(
        s("rect", {
          x: x,
          y: y,
          width: w,
          height: hh,
          fill: fill || "none",
          stroke: stroke || "currentColor",
          "stroke-width": 1.5,
        }),
      );
    }
    if (spec.t === "array") {
      var rows = Math.min(spec.rows, 12);
      var cols = Math.min(spec.cols, 12);
      var cell = Math.min(18, Math.floor(200 / cols), Math.floor(100 / rows));
      for (var i = 0; i < rows; i++)
        for (var j = 0; j < cols; j++)
          rect(10 + j * cell, 5 + i * cell, cell - 2, cell - 2, "#cfe3f6");
      svg.setAttribute("aria-label", rows + " rows of " + cols);
    } else if (spec.t === "strip") {
      var parts = Math.min(spec.parts, 12);
      for (var k = 0; k < parts; k++)
        rect(
          10 + k * (220 / parts),
          30,
          220 / parts,
          36,
          k < spec.shaded ? "#cfe3f6" : k < spec.shaded + (spec.extra || 0) ? "#f6dcc0" : "#fff",
        );
      svg.setAttribute("aria-label", spec.shaded + " of " + spec.parts + " equal parts shaded");
    } else if (spec.t === "tape") {
      var tp = Math.max(1, Math.min(spec.parts || 4, 12));
      for (var m = 0; m < tp; m++) rect(10 + m * (220 / tp), 30, 220 / tp, 36, "#cfe3f6");
      svg.appendChild(
        s(
          "text",
          { x: 120, y: 90, "text-anchor": "middle", "font-size": 12, fill: "currentColor" },
          "whole = " + spec.total,
        ),
      );
      svg.setAttribute(
        "aria-label",
        "A tape split into " + tp + " equal parts, whole " + spec.total,
      );
    } else if (spec.t === "nline") {
      var lo = Math.min(spec.from, spec.from + spec.move, 0) - 1;
      var hi = Math.max(spec.from, spec.from + spec.move, 0) + 1;
      var sc = 220 / (hi - lo);
      svg.appendChild(
        s("line", { x1: 10, y1: 60, x2: 230, y2: 60, stroke: "currentColor", "stroke-width": 2 }),
      );
      for (var t = lo; t <= hi; t++)
        svg.appendChild(
          s("line", {
            x1: 10 + (t - lo) * sc,
            y1: 54,
            x2: 10 + (t - lo) * sc,
            y2: 66,
            stroke: "currentColor",
          }),
        );
      svg.appendChild(
        s("circle", { cx: 10 + (spec.from - lo) * sc, cy: 60, r: 5, fill: "#b45309" }),
      );
      svg.appendChild(
        s("path", {
          d:
            "M" +
            (10 + (spec.from - lo) * sc) +
            " 48 L" +
            (10 + (spec.from + spec.move - lo) * sc) +
            " 48",
          stroke: "#1e6fa8",
          "stroke-width": 3,
          fill: "none",
        }),
      );
      svg.setAttribute("aria-label", "Start at " + spec.from + " and move " + spec.move);
    } else if (spec.t === "balance") {
      svg.appendChild(
        s("path", {
          d: "M120 40 L120 90 M70 90 L170 90 M40 40 L200 40",
          stroke: "currentColor",
          "stroke-width": 3,
          fill: "none",
        }),
      );
      svg.appendChild(
        s(
          "text",
          { x: 60, y: 32, "text-anchor": "middle", fill: "currentColor", "font-size": 14 },
          spec.left,
        ),
      );
      svg.appendChild(
        s(
          "text",
          { x: 180, y: 32, "text-anchor": "middle", fill: "currentColor", "font-size": 14 },
          spec.right,
        ),
      );
      svg.setAttribute("aria-label", "Balance: " + spec.left + " equals " + spec.right);
    }
    return h("figure", { class: "ewl-fluency-fig" }, svg);
  }

  /* ----- the session UI ----- */
  function mount(host, opts) {
    var h = EWL.h;
    var store = EWL.state;
    opts = opts || {};
    var code = parseCode(opts.code) ? String(opts.code).toUpperCase() : newCode();
    var items = plan(code, opts.n || 20, opts.unit || store.get().unit || 3);
    var queue = items.slice();
    var done = 0;
    var correct = 0;
    var tries = 0;
    var es = EWL.lang() === "es";
    EWL.clear(host);
    var title = h(
      "h3",
      { tabindex: "-1" },
      EWL.t("Class sprint " + code, "Carrera de clase " + code),
    );
    var prompt = h("p", { class: "ewl-fluency-prompt", "aria-live": "polite" });
    var input = h("input", {
      type: "text",
      inputmode: "text",
      autocomplete: "off",
      id: "ewl-fl-in",
      "aria-label": EWL.t("Your answer", "Tu respuesta"),
    });
    var msg = h("p", { class: "ewl-msg", role: "status", hidden: true });
    var fig = h("div", {});
    var check = h(
      "button",
      { type: "button", class: "ewl-btn", "data-primary": "1" },
      EWL.t("Check", "Comprobar"),
    );
    var pic = h(
      "button",
      { type: "button", class: "ewl-btn", hidden: true },
      EWL.t("Show me a picture", "Muéstrame un dibujo"),
    );
    var prog = h("p", { class: "ewl-fluency-prog" });
    host.appendChild(
      h(
        "section",
        { class: "ewl-card ewl-fluency", "aria-labelledby": "ewl-fl-t" },
        title,
        prog,
        prompt,
        h("div", { class: "ewl-row" }, input, check, pic),
        msg,
        fig,
      ),
    );
    title.id = "ewl-fl-t";
    function cur() {
      return queue[0];
    }
    function show() {
      var it = cur();
      EWL.clear(fig);
      msg.hidden = true;
      pic.hidden = true;
      tries = 0;
      if (!it) return finish();
      prompt.textContent = es ? it.promptEs : it.prompt;
      prog.textContent = EWL.t(
        "Question " + (done + 1) + " of " + items.length,
        "Pregunta " + (done + 1) + " de " + items.length,
      );
      input.value = "";
      input.focus();
    }
    function say(kind, text) {
      msg.hidden = false;
      msg.setAttribute("data-kind", kind);
      msg.textContent = text;
      EWL.announce(text);
    }
    function submit() {
      var it = cur();
      if (!it) return;
      var j = judge(it, input.value);
      if (!j.readable)
        return say(
          "warn",
          EWL.t(
            "Type a number, like 12, 3/4, 0.75 or 75%.",
            "Escribe un número, como 12, 3/4, 0.75 o 75 %.",
          ),
        );
      store.recordFluency(j.ok && tries === 0);
      if (j.ok) {
        done++;
        if (tries === 0) correct++;
        queue.shift();
        say("ok", EWL.t("That matches.", "Eso concuerda."));
        setTimeout(show, 450);
        return;
      }
      tries++;
      pic.hidden = false;
      if (tries === 1)
        say(
          "warn",
          EWL.t(
            "Not yet. Try again, or press the picture button.",
            "Todavía no. Inténtalo otra vez o pulsa el botón del dibujo.",
          ),
        );
      else {
        say(
          "warn",
          EWL.t(
            "Checked result: " + it.answer.frac() + ". This one will come back at the end.",
            "Resultado comprobado: " + it.answer.frac() + ". Esta volverá al final.",
          ),
        );
        queue.push(queue.shift());
        done++;
        setTimeout(show, 1600);
      }
    }
    function finish() {
      EWL.clear(fig);
      prompt.textContent = EWL.t(
        "Sprint finished: " + correct + " of " + items.length + " right the first time.",
        "Carrera terminada: " + correct + " de " + items.length + " correctas al primer intento.",
      );
      prog.textContent = "";
      input.hidden = check.hidden = pic.hidden = true;
      say(
        "ok",
        EWL.t(
          "Share this code with your class: " + code + "  (" + correct + "/" + items.length + ")",
          "Comparte este código con tu clase: " + code + "  (" + correct + "/" + items.length + ")",
        ),
      );
      store.addEvidence(EWL.id("fluency", "spiral"), {
        note: code + " " + correct + "/" + items.length,
        ok: correct === items.length,
      });
    }
    check.addEventListener("click", submit);
    input.addEventListener("keydown", function (e) {
      if (e.key === "Enter") submit();
    });
    pic.addEventListener("click", function () {
      EWL.clear(fig);
      fig.appendChild(drawVisual(cur().visual));
    });
    show();
    return {
      items: items,
      code: code,
      destroy: function () {
        EWL.clear(host);
      },
    };
  }

  function hud(host) {
    var h = EWL.h;
    var store = EWL.state;
    function render() {
      var f = store.get().fluency;
      var acc = f.answered ? Math.round((100 * f.correct) / f.answered) : 0;
      EWL.clear(host);
      host.appendChild(
        h(
          "div",
          { class: "ewl-fluency-hud", role: "group", "aria-label": EWL.t("Fluency", "Fluidez") },
          h("span", { class: "ewl-chip" }, EWL.t("Streak ", "Racha ") + f.streak),
          h("span", { class: "ewl-chip" }, EWL.t("Best ", "Mejor ") + f.best),
          h("span", { class: "ewl-chip" }, EWL.t("Accuracy ", "Precisión ") + acc + "%"),
          h(
            "span",
            { class: "ewl-chip", title: EWL.t("Practice mix", "Mezcla de práctica") },
            f.mix.new +
              "/" +
              f.mix.review +
              "/" +
              f.mix.stretch +
              " " +
              EWL.t("new/review/stretch", "nuevo/repaso/reto"),
          ),
        ),
      );
    }
    render();
    return store.subscribe(render);
  }

  EWL.Fluency = {
    KINDS: KINDS,
    MIX: MIX,
    plan: plan,
    judge: judge,
    quotas: quotas,
    newCode: newCode,
    parseCode: parseCode,
    pools: pools,
    drawVisual: drawVisual,
    mount: mount,
    hud: hud,
  };
  EWL.selfTests = EWL.selfTests || [];
  EWL.selfTests.push({
    name: "fluency: a class code gives every student the same sprint",
    run: function () {
      var a = plan("KITE-4821", 20, 4);
      var b = plan("kite-4821", 20, 4);
      return (
        a.length === 20 &&
        JSON.stringify(
          a.map(function (x) {
            return x.prompt;
          }),
        ) ===
          JSON.stringify(
            b.map(function (x) {
              return x.prompt;
            }),
          )
      );
    },
  });
})(typeof window !== "undefined" ? window : globalThis);
