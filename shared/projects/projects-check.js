// @ts-nocheck — not yet type-clean. This file is INSIDE the checkJs program
// (see tsconfig.json); the marker is the debt, and removing it is the unit of
// work. tools/typecheck-ratchet.test.mjs pins the count so it can only shrink.
/* ==========================================================================
   Neft Teacher — Projects STEP-CHECK layer (shared)

   Adds a config-driven "Check my work" affordance to each step panel of a unit
   culminating-project wizard page, plus a 3-rung no-give-away hint ladder.

   WHY: most project steps are open-ended (the student picks their own prices,
   rooms, data), so a fixed answer key is impossible. The workhorse check kind
   is therefore `derived`: the typed value must equal a formula computed from
   the student's OWN other entries. That validates the ARITHMETIC without
   dictating any creative choice.

   Check kinds
     derived  — value must equal expr({refA} op {refB} …) within a tolerance
     range    — value must fall in [min, max]
     relation — value compared (< <= > >= == !=) against an expression
     exact    — fixed expected value with a rounding tolerance
     nonempty — written response: minimum characters / words only

   Hint ladder (matches engine/core/hint-ladder.js + the per-page
   `_wrongAttempt`/`ladderStep` ladders already used on these project pages):
     1 💡 Tip        — point at what to re-read / which quantity to look at
     2 🧭 Strategy   — name the operation or relationship to use
     3 👀 Show me how— walk the setup with the student's OWN numbers, then STOP
                       before the final value. Never states the answer.

   Double-feedback safety: any field that the PAGE already validates is skipped.
   Detected three ways — (a) an explicit `skipFields` list in the config,
   (b) a page-authored feedback node `#<id>-feedback|-badge|-out|-status`,
   (c) an inline oninput/onchange handler naming a check/verify/validate fn.

   Gated on <body class="pro-projects">. Idempotent. No id is ever renamed, so
   Save/Resume is untouched. Nothing is ever auto-corrected and no answer is
   ever revealed.

   Injected by tools/inject-projects-check.mjs.
   ========================================================================== */
(function () {
  "use strict";
  if (typeof document === "undefined") return;

  var CONFIG_URL = "/shared/projects/projects-check-config.json";
  var DEFAULT_TOLERANCE = 0.01;
  var DEFAULT_MIN_WORDS = 12;
  var CFG = null;
  var STATE = {}; // checkKey -> { tries: n, revealed: n }

  /* ---------- tiny helpers ---------------------------------------------- */

  function ready(fn) {
    if (document.readyState === "loading")
      document.addEventListener("DOMContentLoaded", fn, { once: true });
    else fn();
  }

  /* A check whose field is not currently displayed (e.g. a lvl2-only box while
     the page is at Level 1) must not be counted in the step summary — otherwise
     the student reads "2 of 3 look right" pointing at a box they cannot see. */
  function isVisible(el) {
    if (!el) return false;
    if (el.type === "hidden") return false;
    return !!(el.offsetParent || (el.getClientRects && el.getClientRects().length));
  }

  function isEs() {
    var b = document.getElementById("body") || document.body;
    return !!(b && b.classList.contains("es"));
  }

  function bi(en, es) {
    return (
      '<span class="en-text">' +
      esc(en) +
      "</span>" +
      '<span class="es-text">' +
      esc(es) +
      "</span>"
    );
  }

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function pagePath() {
    var p = location.pathname.replace(/index\.html?$/i, "");
    if (p.charAt(p.length - 1) !== "/") p += "/";
    return p;
  }

  function field(ref) {
    if (!ref) return null;
    return (
      document.getElementById(ref) ||
      document.querySelector('[name="' + String(ref).replace(/"/g, '\\"') + '"]')
    );
  }

  function rawValue(ref) {
    var el = field(ref);
    if (!el) return "";
    if (el.tagName === "SELECT") return el.value || "";
    return el.value == null ? "" : String(el.value);
  }

  /* Currency / percent / comma / whitespace normalisation → Number. */
  function num(raw) {
    if (raw == null) return NaN;
    var s = String(raw).trim();
    if (!s) return NaN;
    var neg = /^\(.*\)$/.test(s);
    s = s
      .replace(/[−–—]/g, "-") // unicode minus / dashes
      .replace(/[()]/g, "")
      .replace(/[$€£¥]/g, "")
      .replace(/%/g, "")
      .replace(/,/g, "")
      .replace(/\s+/g, "");
    if (!s) return NaN;
    // mixed number "1 1/2" collapses to "11/2" after whitespace strip, so read
    // the ORIGINAL for that shape before falling back to plain parse.
    var mixed = String(raw)
      .trim()
      .match(/^(-?\d+)\s+(\d+)\s*\/\s*(\d+)$/);
    if (mixed) {
      var w = parseFloat(mixed[1]);
      var fr = parseFloat(mixed[2]) / parseFloat(mixed[3]);
      return w < 0 ? w - fr : w + fr;
    }
    var frac = s.match(/^(-?\d+(?:\.\d+)?)\/(-?\d+(?:\.\d+)?)$/);
    var n;
    if (frac) n = parseFloat(frac[1]) / parseFloat(frac[2]);
    else n = parseFloat(s);
    if (!isFinite(n)) return NaN;
    return neg ? -Math.abs(n) : n;
  }

  function words(s) {
    return String(s || "")
      .trim()
      .split(/\s+/)
      .filter(function (w) {
        return w.length > 0;
      });
  }

  /* ---------- safe expression evaluator ---------------------------------
     Grammar (no eval, no new Function):
       expr    := term (('+'|'-') term)*
       term    := unary (('*'|'/') unary)*
       unary   := '-' unary | primary
       primary := NUMBER | '{' ref '}' | FUNC '(' args ')' | '(' expr ')'
     Refs are written {input-id} so hyphenated ids never collide with minus.
  --------------------------------------------------------------------- */

  /* gcd/lcm are here so a project can ask the student to FIND the greatest
     common factor and then check their answer against their own inputs, rather
     than having the page compute and print it. Without them the only way to
     validate a student-entered GCF was to hand-roll it on the page and add the
     field to `skipFields` (see unit-1/version-a), which is why unit-1/version-c
     ended up simply displaying the answer instead. Both coerce to non-negative
     integers and return NaN for a non-integer or non-positive input, so a
     mistyped decimal fails the check instead of silently passing. */
  function gcdOf(a, b) {
    a = Math.abs(a);
    b = Math.abs(b);
    if (!isFinite(a) || !isFinite(b) || a !== Math.floor(a) || b !== Math.floor(b)) return NaN;
    if (a === 0 && b === 0) return NaN;
    while (b) {
      var t = a % b;
      a = b;
      b = t;
    }
    return a;
  }
  var FUNCS = {
    abs: Math.abs,
    min: Math.min,
    max: Math.max,
    round: Math.round,
    floor: Math.floor,
    ceil: Math.ceil,
    sqrt: Math.sqrt,
    gcd: gcdOf,
    lcm: function (a, b) {
      var g = gcdOf(a, b);
      if (isNaN(g) || g === 0) return NaN;
      return Math.abs(a * b) / g;
    },
  };

  function tokenize(src) {
    var out = [];
    var i = 0;
    var s = String(src);
    while (i < s.length) {
      var c = s.charAt(i);
      if (/\s/.test(c)) {
        i++;
        continue;
      }
      if (c === "{") {
        var end = s.indexOf("}", i);
        if (end === -1) throw new Error("unterminated ref");
        out.push({ t: "ref", v: s.slice(i + 1, end).trim() });
        i = end + 1;
        continue;
      }
      if (/[0-9.]/.test(c)) {
        var m = /^[0-9]*\.?[0-9]+/.exec(s.slice(i));
        if (!m) throw new Error("bad number");
        out.push({ t: "num", v: parseFloat(m[0]) });
        i += m[0].length;
        continue;
      }
      if (/[A-Za-z_]/.test(c)) {
        var mi = /^[A-Za-z_][A-Za-z0-9_]*/.exec(s.slice(i));
        out.push({ t: "fn", v: mi[0] });
        i += mi[0].length;
        continue;
      }
      if ("+-*/(),".indexOf(c) !== -1) {
        out.push({ t: c });
        i++;
        continue;
      }
      throw new Error("illegal character " + c);
    }
    return out;
  }

  /* getRef(name) → Number (NaN when the student has not filled it in yet). */
  function evaluate(src, getRef, usedRefs) {
    var toks = tokenize(src);
    var pos = 0;

    function peek() {
      return toks[pos];
    }
    function eat(t) {
      var tok = toks[pos];
      if (!tok || (t && tok.t !== t)) throw new Error("expected " + t);
      pos++;
      return tok;
    }

    function primary() {
      var tok = peek();
      if (!tok) throw new Error("unexpected end");
      if (tok.t === "num") {
        pos++;
        return tok.v;
      }
      if (tok.t === "ref") {
        pos++;
        if (usedRefs && usedRefs.indexOf(tok.v) === -1) usedRefs.push(tok.v);
        return getRef(tok.v);
      }
      if (tok.t === "fn") {
        pos++;
        var fn = FUNCS[tok.v];
        if (!fn) throw new Error("unknown function " + tok.v);
        eat("(");
        var args = [];
        if (peek() && peek().t !== ")") {
          args.push(expr());
          while (peek() && peek().t === ",") {
            pos++;
            args.push(expr());
          }
        }
        eat(")");
        for (var a = 0; a < args.length; a++) if (isNaN(args[a])) return NaN;
        return fn.apply(null, args);
      }
      if (tok.t === "(") {
        pos++;
        var v = expr();
        eat(")");
        return v;
      }
      throw new Error("unexpected token");
    }

    function unary() {
      if (peek() && peek().t === "-") {
        pos++;
        return -unary();
      }
      if (peek() && peek().t === "+") {
        pos++;
        return unary();
      }
      return primary();
    }

    function term() {
      var v = unary();
      while (peek() && (peek().t === "*" || peek().t === "/")) {
        var op = eat().t;
        var r = unary();
        v = op === "*" ? v * r : v / r;
      }
      return v;
    }

    function expr() {
      var v = term();
      while (peek() && (peek().t === "+" || peek().t === "-")) {
        var op = eat().t;
        var r = term();
        v = op === "+" ? v + r : v - r;
      }
      return v;
    }

    var result = expr();
    if (pos !== toks.length) throw new Error("trailing tokens");
    return result;
  }

  /* Same walk, but substituting the student's OWN numbers instead of computing.
     Used by hint rung 3 so the setup is shown but never the final value. */
  function exprWithValues(src) {
    return String(src).replace(/\{([^}]+)\}/g, function (_, ref) {
      var raw = rawValue(ref).trim();
      return raw === "" ? "___" : raw;
    });
  }

  function refsOf(src) {
    var out = [];
    String(src).replace(/\{([^}]+)\}/g, function (_, r) {
      if (out.indexOf(r.trim()) === -1) out.push(r.trim());
      return "";
    });
    return out;
  }

  /* ---------- page label lookup (so hints name the student's own boxes) --- */

  function labelFor(ref) {
    var el = field(ref);
    if (!el) return ref;
    var lab =
      document.querySelector('label[for="' + String(ref).replace(/"/g, '\\"') + '"]') ||
      el.closest("label");
    if (!lab) return ref;
    var pick = lab.querySelector(isEs() ? ".es-text" : ".en-text");
    var text = ((pick || lab).textContent || "").replace(/\s+/g, " ").trim();
    return text || ref;
  }

  /* ---------- double-feedback detection ---------------------------------- */

  var PAGE_CHECK_FN = /(check|verify|validate|solve|compare)[A-Z_]/;

  function pageAlreadyChecks(ref, skipList) {
    if (skipList && skipList.indexOf(ref) !== -1) return true;
    var suffixes = ["-feedback", "-badge", "-out", "-status"];
    for (var i = 0; i < suffixes.length; i++) {
      if (document.getElementById(ref + suffixes[i])) return true;
    }
    var el = field(ref);
    if (!el) return false;
    var handlers = (el.getAttribute("oninput") || "") + ";" + (el.getAttribute("onchange") || "");
    if (PAGE_CHECK_FN.test(handlers)) return true;
    return false;
  }

  /* ---------- evaluating one check --------------------------------------- */

  /* → { status: "pass"|"fail"|"blank"|"needs-inputs", msgEn, msgEs } */
  function runCheck(chk) {
    var raw = rawValue(chk.ref);
    var kind = chk.kind || "nonempty";

    if (kind === "nonempty") {
      var minW = chk.minWords != null ? chk.minWords : DEFAULT_MIN_WORDS;
      var minC = chk.minChars != null ? chk.minChars : 0;
      var w = words(raw);
      if (!raw.trim()) return { status: "blank" };
      if (w.length < minW || raw.trim().length < minC) {
        return {
          status: "fail",
          msgEn: "Keep going — aim for at least " + minW + " words so your reasoning is clear.",
          msgEs: "Sigue — escribe al menos " + minW + " palabras para explicar tu razonamiento.",
        };
      }
      return {
        status: "pass",
        msgEn: "Looks complete.",
        msgEs: "Se ve completo.",
      };
    }

    if (kind === "choice") {
      if (!raw.trim()) return { status: "blank" };
      return { status: "pass", msgEn: "Choice recorded.", msgEs: "Elección registrada." };
    }

    var val = num(raw);
    if (!raw.trim() || isNaN(val)) return { status: "blank" };

    if (kind === "range") {
      var lo = chk.min != null ? chk.min : -Infinity;
      var hi = chk.max != null ? chk.max : Infinity;
      if (val < lo || val > hi) {
        return {
          status: "fail",
          msgEn: "That value looks out of range for this step. Re-read what the box is asking for.",
          msgEs:
            "Ese valor parece fuera de rango para este paso. Vuelve a leer qué pide la casilla.",
        };
      }
      return {
        status: "pass",
        msgEn: "In a sensible range.",
        msgEs: "Está en un rango razonable.",
      };
    }

    var tol = chk.tolerance != null ? chk.tolerance : DEFAULT_TOLERANCE;

    if (kind === "exact") {
      if (chk.expected == null) return { status: "blank" };
      if (Math.abs(val - Number(chk.expected)) <= tol)
        return { status: "pass", msgEn: "That matches.", msgEs: "Eso coincide." };
      return {
        status: "fail",
        msgEn: "Not matching yet — check your calculation and try again.",
        msgEs: "Todavía no coincide — revisa tu cálculo e inténtalo de nuevo.",
      };
    }

    if (kind === "derived" || kind === "relation") {
      var used = [];
      var target;
      try {
        target = evaluate(
          chk.expr,
          function (r) {
            return num(rawValue(r));
          },
          used,
        );
      } catch (_e) {
        return { status: "blank" };
      }
      if (isNaN(target) || !isFinite(target)) {
        var missing = used.filter(function (r) {
          return isNaN(num(rawValue(r)));
        });
        return {
          status: "needs-inputs",
          msgEn: missing.length
            ? "Fill in " + missing.map(labelFor).join(" and ") + " first."
            : "Fill in the boxes above first.",
          msgEs: missing.length
            ? "Primero completa " + missing.map(labelFor).join(" y ") + "."
            : "Primero completa las casillas de arriba.",
        };
      }
      if (kind === "relation") {
        var op = chk.op || "==";
        var ok =
          op === "<"
            ? val < target
            : op === "<="
              ? val <= target
              : op === ">"
                ? val > target
                : op === ">="
                  ? val >= target
                  : op === "!="
                    ? Math.abs(val - target) > tol
                    : Math.abs(val - target) <= tol;
        if (ok)
          return {
            status: "pass",
            msgEn: "That relationship holds.",
            msgEs: "Esa relación se cumple.",
          };
        return {
          status: "fail",
          msgEn: "That comparison does not hold yet — compare the two amounts again.",
          msgEs: "Esa comparación aún no se cumple — compara las dos cantidades otra vez.",
        };
      }
      // derived: relative tolerance for large values so cents don't fail dollars
      var allow = Math.max(
        tol,
        Math.abs(target) * (chk.relTolerance != null ? chk.relTolerance : 0),
      );
      if (Math.abs(val - target) <= allow)
        return { status: "pass", msgEn: "Your math checks out.", msgEs: "Tu cálculo cuadra." };
      return {
        status: "fail",
        msgEn: "Not quite yet — your number does not match your own entries above.",
        msgEs: "Todavía no — tu número no coincide con tus propias entradas de arriba.",
      };
    }

    return { status: "blank" };
  }

  /* ---------- hint ladder ------------------------------------------------ */

  function generatedHints(chk) {
    var kind = chk.kind || "nonempty";
    var refs = chk.expr ? refsOf(chk.expr) : [];
    var names = refs.map(labelFor);
    var opEn = chk.operation && chk.operation.en ? chk.operation.en : "";
    var opEs = chk.operation && chk.operation.es ? chk.operation.es : "";

    if (kind === "derived" || kind === "relation") {
      return [
        {
          en: names.length
            ? "Look back at the numbers you already entered: " +
              names.join(", ") +
              ". This box depends on those — nothing new."
            : "Re-read the step. Which numbers that you already entered does this box depend on?",
          es: names.length
            ? "Vuelve a mirar los números que ya escribiste: " +
              names.join(", ") +
              ". Esta casilla depende de ellos — nada nuevo."
            : "Vuelve a leer el paso. ¿De qué números que ya escribiste depende esta casilla?",
        },
        {
          en:
            opEn ||
            "Decide which operation connects those numbers — add, subtract, multiply, or divide? Say the relationship out loud before you compute.",
          es:
            opEs ||
            "Decide qué operación conecta esos números: ¿sumar, restar, multiplicar o dividir? Di la relación en voz alta antes de calcular.",
        },
        {
          en:
            "Set it up with YOUR numbers:  " +
            exprWithValues(chk.expr || "") +
            "  = ___ . Now do that arithmetic yourself.",
          es:
            "Escríbelo con TUS números:  " +
            exprWithValues(chk.expr || "") +
            "  = ___ . Ahora haz tú esa operación.",
        },
      ];
    }

    if (kind === "range") {
      return [
        {
          en: "Re-read the label on this box. What unit is it asking for — dollars, inches, percent, or a count?",
          es: "Vuelve a leer la etiqueta de esta casilla. ¿Qué unidad pide: dólares, pulgadas, porcentaje o una cantidad?",
        },
        {
          en: "Compare your value with the examples in the step. Is yours ten times too big or too small? Check where the decimal point belongs.",
          es: "Compara tu valor con los ejemplos del paso. ¿El tuyo es diez veces mayor o menor? Revisa dónde va el punto decimal.",
        },
        {
          en:
            "A sensible answer here sits between " +
            (chk.min != null ? chk.min : "—") +
            " and " +
            (chk.max != null ? chk.max : "—") +
            ". Adjust your entry until it lands inside that window — you choose the exact value.",
          es:
            "Una respuesta razonable aquí está entre " +
            (chk.min != null ? chk.min : "—") +
            " y " +
            (chk.max != null ? chk.max : "—") +
            ". Ajusta tu entrada hasta que caiga en esa ventana — el valor exacto lo eliges tú.",
        },
      ];
    }

    if (kind === "exact") {
      return [
        {
          en: "Re-read the numbers the step gives you. Which ones belong in this calculation?",
          es: "Vuelve a leer los números que da el paso. ¿Cuáles pertenecen a este cálculo?",
        },
        {
          en:
            opEn ||
            "Name the operation first, then compute. Write the number sentence before typing an answer.",
          es:
            opEs ||
            "Nombra primero la operación y luego calcula. Escribe el enunciado numérico antes de escribir la respuesta.",
        },
        {
          en: "Write out every value from the step in a list, then combine them with the operation you named. Stop and check the list before you finish the arithmetic.",
          es: "Escribe en una lista todos los valores del paso y luego combínalos con la operación que nombraste. Revisa la lista antes de terminar la operación.",
        },
      ];
    }

    // nonempty
    return [
      {
        en: "Re-read the question above the box. What exactly is it asking you to explain?",
        es: "Vuelve a leer la pregunta sobre la casilla. ¿Qué te pide explicar exactamente?",
      },
      {
        en: "Use at least two of YOUR numbers from this step in your sentence, and say what they mean.",
        es: "Usa al menos dos de TUS números de este paso en tu oración y di qué significan.",
      },
      {
        en: 'Start like this: "My ___ is ___, which is (more/less) than ___ because ___." Then finish the sentence in your own words.',
        es: 'Empieza así: "Mi ___ es ___, que es (más/menos) que ___ porque ___." Después termina la oración con tus propias palabras.',
      },
    ];
  }

  function hintsFor(chk) {
    var authored = Array.isArray(chk.hints) ? chk.hints.filter(Boolean) : [];
    var gen = generatedHints(chk);
    var out = [];
    for (var i = 0; i < 3; i++) {
      var a = authored[i];
      if (a && (a.en || a.es)) out.push({ en: a.en || gen[i].en, es: a.es || gen[i].es });
      else out.push(gen[i]);
    }
    return out;
  }

  var HINT_LABELS = [
    { en: "💡 Tip", es: "💡 Consejo" },
    { en: "🧭 Strategy", es: "🧭 Estrategia" },
    { en: "👀 Show me how", es: "👀 Muéstrame cómo" },
  ];

  /* ---------- DOM building ----------------------------------------------- */

  var seq = 0;

  function messageNode(chk, key) {
    var el = document.getElementById("ntchk-msg-" + key);
    if (el) return el;
    el = document.createElement("p");
    el.id = "ntchk-msg-" + key;
    el.className = "ntchk-msg";
    el.setAttribute("role", "status");
    el.hidden = true;
    var target = field(chk.ref);
    if (target && target.parentNode) {
      target.parentNode.insertBefore(el, target.nextSibling);
    }
    return el;
  }

  function ladderNode(chk, key) {
    var wrap = document.createElement("div");
    wrap.className = "ntchk-ladder no-print";
    wrap.id = "ntchk-ladder-" + key;
    wrap.hidden = true;

    var head = document.createElement("p");
    head.className = "ntchk-ladder-head";
    head.innerHTML =
      bi("Need a nudge?", "¿Necesitas una pista?") +
      ' <span class="ntchk-ladder-count" aria-live="polite">0 / 3</span>';
    wrap.appendChild(head);

    var hints = hintsFor(chk);
    hints.forEach(function (h, idx) {
      var step = document.createElement("div");
      step.className = "ntchk-rung";

      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "ntchk-rung-btn";
      btn.setAttribute("aria-expanded", "false");
      btn.setAttribute("aria-controls", "ntchk-hint-" + key + "-" + idx);
      btn.innerHTML = bi(HINT_LABELS[idx].en, HINT_LABELS[idx].es);
      if (idx > 0) btn.disabled = true;

      var body = document.createElement("div");
      body.id = "ntchk-hint-" + key + "-" + idx;
      body.className = "ntchk-rung-body";
      body.hidden = true;
      // Hint text is authored/generated plain text — escape then re-add spans.
      body.innerHTML = bi(h.en, h.es);

      btn.addEventListener("click", function () {
        var st = STATE[key] || (STATE[key] = { tries: 0, revealed: 0 });
        if (idx > st.revealed) return;
        var open = body.hidden;
        body.hidden = !open;
        btn.setAttribute("aria-expanded", open ? "true" : "false");
        step.classList.toggle("is-open", open);
        if (open && idx === st.revealed) {
          st.revealed = Math.min(st.revealed + 1, 3);
          syncLadder(wrap, key);
        }
      });

      step.appendChild(btn);
      step.appendChild(body);
      wrap.appendChild(step);
    });

    return wrap;
  }

  function syncLadder(wrap, key) {
    var st = STATE[key] || (STATE[key] = { tries: 0, revealed: 0 });
    var count = wrap.querySelector(".ntchk-ladder-count");
    if (count) count.textContent = st.revealed + " / 3";
    var rungs = wrap.querySelectorAll(".ntchk-rung");
    for (var i = 0; i < rungs.length; i++) {
      var btn = rungs[i].querySelector(".ntchk-rung-btn");
      if (!btn) continue;
      btn.disabled = i > st.revealed;
      rungs[i].classList.toggle("is-available", i <= st.revealed);
      if (i < st.revealed) rungs[i].classList.add("is-used");
    }
  }

  function applyResult(chk, key, res) {
    var el = field(chk.ref);
    var msg = messageNode(chk, key);
    var ladder = document.getElementById("ntchk-ladder-" + key);
    var st = STATE[key] || (STATE[key] = { tries: 0, revealed: 0 });

    if (!el || !msg) return res.status;

    msg.hidden = false;
    msg.classList.remove("is-pass", "is-fail", "is-blank");

    var icon, textEn, textEs;
    if (res.status === "pass") {
      icon = "✅";
      textEn = res.msgEn || "Looks right.";
      textEs = res.msgEs || "Se ve bien.";
      msg.classList.add("is-pass");
      el.setAttribute("aria-invalid", "false");
      st.tries = 0;
      if (ladder) ladder.hidden = true;
    } else if (res.status === "blank") {
      icon = "✍️";
      textEn = "Type your answer here, then check again.";
      textEs = "Escribe tu respuesta aquí y vuelve a comprobar.";
      msg.classList.add("is-blank");
      el.removeAttribute("aria-invalid");
    } else if (res.status === "needs-inputs") {
      icon = "🔎";
      textEn = res.msgEn;
      textEs = res.msgEs;
      msg.classList.add("is-blank");
      el.removeAttribute("aria-invalid");
    } else {
      icon = "🔁";
      textEn = res.msgEn || "Not quite yet — give it another look.";
      textEs = res.msgEs || "Todavía no — revísalo otra vez.";
      msg.classList.add("is-fail");
      el.setAttribute("aria-invalid", "true");
      st.tries += 1;
      if (ladder) {
        ladder.hidden = false;
        // Repeated requests unlock one more rung at a time.
        st.revealed = Math.max(st.revealed, Math.min(st.tries - 1, 3));
        syncLadder(ladder, key);
      }
    }

    // Icon AND text — never colour alone.
    msg.innerHTML =
      '<span class="ntchk-ico" aria-hidden="true">' + icon + "</span>" + bi(textEn, textEs);

    var described = (el.getAttribute("aria-describedby") || "").split(/\s+/).filter(Boolean);
    if (described.indexOf(msg.id) === -1) described.push(msg.id);
    el.setAttribute("aria-describedby", described.join(" "));

    return res.status;
  }

  function buildStep(panel, stepCfg, skipFields) {
    var checks = (stepCfg && stepCfg.checks) || [];
    var live = checks.filter(function (c) {
      if (!c || !c.ref) return false;
      if (!field(c.ref)) return false;
      if (pageAlreadyChecks(c.ref, skipFields)) return false;
      return true;
    });
    if (!live.length) return 0;

    var host = document.createElement("div");
    host.className = "ntchk no-print";
    host.setAttribute("data-ntchk", "1");

    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "ntchk-btn";
    btn.innerHTML =
      '<span aria-hidden="true">🔎</span> ' + bi("Check my work", "Revisa mi trabajo");
    host.appendChild(btn);

    var summary = document.createElement("p");
    summary.className = "ntchk-summary";
    summary.setAttribute("aria-live", "polite");
    summary.hidden = true;
    host.appendChild(summary);

    var keys = [];
    live.forEach(function (chk) {
      var key = "c" + ++seq;
      keys.push({ key: key, chk: chk });
      STATE[key] = { tries: 0, revealed: 0 };
      messageNode(chk, key);
      host.appendChild(ladderNode(chk, key));
    });

    btn.addEventListener("click", function () {
      var pass = 0;
      var attempted = 0;
      var shown = keys.filter(function (k) {
        return isVisible(field(k.chk.ref));
      });
      if (!shown.length) {
        summary.hidden = false;
        summary.className = "ntchk-summary";
        summary.innerHTML = bi(
          "Nothing to check on this step yet — fill in your answers first.",
          "Todavía no hay nada que revisar en este paso — primero escribe tus respuestas.",
        );
        return;
      }
      shown.forEach(function (k) {
        var res = runCheck(k.chk);
        var status = applyResult(k.chk, k.key, res);
        if (status === "pass") pass++;
        if (status !== "blank" && status !== "needs-inputs") attempted++;
      });
      summary.hidden = false;
      var total = shown.length;
      if (pass === total) {
        summary.className = "ntchk-summary is-pass";
        summary.innerHTML =
          '<span aria-hidden="true">🎉</span> ' +
          bi(
            "All " + total + " checked on this step look right.",
            "Los " + total + " puntos de este paso se ven bien.",
          );
      } else {
        summary.className = "ntchk-summary is-fail";
        summary.innerHTML =
          '<span aria-hidden="true">🔁</span> ' +
          bi(
            pass +
              " of " +
              total +
              " look right. Open a hint on any box that needs another look — the hints never give the answer.",
            pass +
              " de " +
              total +
              " se ven bien. Abre una pista en la casilla que lo necesite — las pistas nunca dan la respuesta.",
          );
      }
      void attempted;
    });

    var nav = panel.querySelector(".nav-row");
    if (nav && nav.parentNode === panel) panel.insertBefore(host, nav);
    else panel.appendChild(host);

    return live.length;
  }

  /* ---------- boot -------------------------------------------------------- */

  function mount(cfg) {
    CFG = cfg || {};
    var page = (CFG.pages || {})[pagePath()];
    if (!page) return;
    var skip = page.skipFields || [];
    var steps = page.steps || {};
    var mounted = 0;
    Object.keys(steps).forEach(function (stepId) {
      var panel = document.getElementById(stepId);
      if (!panel || !panel.classList.contains("step-panel")) return;
      mounted += buildStep(panel, steps[stepId], skip);
    });
    if (mounted && window.console && CFG.debug) {
      console.info("[projects-check] mounted " + mounted + " check(s)");
    }
  }

  function run() {
    if (!document.body || !document.body.classList.contains("pro-projects")) return;
    if (document.body.dataset.ntCheckInit === "1") return;
    document.body.dataset.ntCheckInit = "1";
    fetch(CONFIG_URL, { credentials: "same-origin" })
      .then(function (r) {
        return r.ok ? r.json() : null;
      })
      .then(function (cfg) {
        if (cfg) mount(cfg);
      })
      .catch(function () {
        /* no config reachable — page is untouched */
      });
  }

  ready(run);
  window.NTCheck = {
    run: run,
    // exposed for tests / console: evaluate an expression against live inputs
    evaluate: function (src) {
      try {
        return evaluate(
          src,
          function (r) {
            return num(rawValue(r));
          },
          [],
        );
      } catch (_e) {
        return NaN;
      }
    },
    normalize: num,
  };
})();
