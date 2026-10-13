/* Math Workbench — calculator extras. Works on the calculator that is already in the page
 * (index.html) by pressing its own keys, so there is exactly one arithmetic path:
 *  - keyboard input (digits, + - * /, ., %, Enter/=, Backspace, C)
 *  - a history tape with "send to board"
 *  - Fractions and Percent modes (exact arithmetic)
 *  - an off switch for no-calculator work: `?calc=off`, or a teacher turns it off on this
 *    device from the Access panel (see wb-teacher.js). */
(function (root) {
  "use strict";
  const doc = root.document;
  if (root.MWBCalcMath) return;

  const $ = (selector, scope) => (scope || doc).querySelector(selector);
  const el = (tag, cls, text) => {
    const node = doc.createElement(tag);
    if (cls) node.className = cls;
    if (text != null) node.textContent = text;
    return node;
  };

  /* ---------------------------------------------------------------- fractions */
  function gcd(a, b) {
    let x = Math.abs(a);
    let y = Math.abs(b);
    while (y) [x, y] = [y, x % y];
    return x || 1;
  }
  function reduce(n, d) {
    if (d < 0) {
      n = -n;
      d = -d;
    }
    const g = gcd(n, d);
    return { n: n / g, d: d / g };
  }
  function combine(a, op, b) {
    switch (op) {
      case "+":
        return reduce(a.n * b.d + b.n * a.d, a.d * b.d);
      case "−":
        return reduce(a.n * b.d - b.n * a.d, a.d * b.d);
      case "×":
        return reduce(a.n * b.n, a.d * b.d);
      case "÷":
        return b.n === 0 ? null : reduce(a.n * b.d, a.d * b.n);
      default:
        return null;
    }
  }
  function mixed(f) {
    if (f.d === 1) return String(f.n);
    const whole = Math.trunc(f.n / f.d);
    const rest = Math.abs(f.n % f.d);
    if (!whole) return `${f.n}/${f.d}`;
    return `${whole} ${rest}/${f.d}`;
  }
  function decimal(f) {
    const v = f.n / f.d;
    return String(Math.round((v + Number.EPSILON) * 1e6) / 1e6);
  }
  function fractionText(f) {
    return f.d === 1 ? String(f.n) : `${f.n}/${f.d}`;
  }

  /* ------------------------------------------------------------------ percent */
  function round(v) {
    return String(Math.round((v + Number.EPSILON) * 1e6) / 1e6);
  }

  root.MWBCalcMath = Object.freeze({ combine, reduce, mixed, decimal, round });
  if (!doc) return;

  /* ---------------------------------------------------------------------- UI */
  function numberField(id, label) {
    const wrap = el("label", "wbx-calc-field");
    wrap.append(el("span", "", label));
    const input = el("input", "wbx-input");
    input.type = "number";
    input.id = id;
    input.inputMode = "decimal";
    input.step = "any";
    wrap.appendChild(input);
    return { wrap, input };
  }
  function intField(id, label) {
    const f = numberField(id, label);
    f.input.step = "1";
    f.input.inputMode = "numeric";
    return f;
  }

  function buildFractionPane(sendToBoard) {
    const pane = el("div", "wbx-calc-pane");
    pane.hidden = true;
    pane.dataset.pane = "fractions";
    const a = { n: intField("wbxFa", "Top"), d: intField("wbxFad", "Bottom") };
    const b = { n: intField("wbxFb", "Top"), d: intField("wbxFbd", "Bottom") };
    const op = el("select", "wbx-input");
    op.id = "wbxFop";
    op.setAttribute("aria-label", "Operation");
    for (const symbol of ["+", "−", "×", "÷"]) op.appendChild(el("option", "", symbol));
    const grid = el("div", "wbx-calc-fracs");
    const colA = el("div", "wbx-calc-frac");
    colA.append(a.n.wrap, a.d.wrap);
    const colB = el("div", "wbx-calc-frac");
    colB.append(b.n.wrap, b.d.wrap);
    grid.append(colA, op, colB);
    const out = el("div", "wbx-calc-out");
    out.setAttribute("role", "status");
    out.setAttribute("aria-live", "polite");
    const send = el("button", "tbtn", "Send to board");
    send.type = "button";
    send.disabled = true;
    pane.append(grid, out, send);
    let last = "";
    const calc = () => {
      const vals = [a.n, a.d, b.n, b.d].map((f) => Number.parseInt(f.input.value, 10));
      if (vals.some((v) => Number.isNaN(v))) {
        out.textContent = "Type two fractions.";
        send.disabled = true;
        return;
      }
      if (vals[1] === 0 || vals[3] === 0) {
        out.textContent = "A bottom number cannot be 0.";
        send.disabled = true;
        return;
      }
      const left = reduce(vals[0], vals[1]);
      const right = reduce(vals[2], vals[3]);
      const res = combine(left, op.value, right);
      if (!res) {
        out.textContent = "You cannot divide by 0.";
        send.disabled = true;
        return;
      }
      last = `${vals[0]}/${vals[1]} ${op.value} ${vals[2]}/${vals[3]} = ${fractionText(res)}`;
      out.textContent = `${fractionText(res)}  ·  ${mixed(res)}  ·  ${decimal(res)}`;
      send.disabled = false;
    };
    pane.addEventListener("input", calc);
    send.addEventListener("click", () => last && sendToBoard(last));
    return pane;
  }

  function buildPercentPane(sendToBoard) {
    const pane = el("div", "wbx-calc-pane");
    pane.hidden = true;
    pane.dataset.pane = "percent";
    const kind = el("select", "wbx-input");
    kind.id = "wbxPkind";
    kind.setAttribute("aria-label", "Percent question");
    for (const [value, label] of [
      ["of", "What is P% of W?"],
      ["is", "A is what percent of B?"],
    ]) {
      const o = el("option", "", label);
      o.value = value;
      kind.appendChild(o);
    }
    const f1 = numberField("wbxP1", "P (percent)");
    const f2 = numberField("wbxP2", "W (whole)");
    const out = el("div", "wbx-calc-out");
    out.setAttribute("role", "status");
    out.setAttribute("aria-live", "polite");
    const send = el("button", "tbtn", "Send to board");
    send.type = "button";
    send.disabled = true;
    pane.append(kind, f1.wrap, f2.wrap, out, send);
    let last = "";
    const labels = () => {
      const part = kind.value === "is";
      f1.wrap.firstChild.textContent = part ? "A (the part)" : "P (percent)";
      f2.wrap.firstChild.textContent = part ? "B (the whole)" : "W (whole)";
    };
    const calc = () => {
      labels();
      const x = Number.parseFloat(f1.input.value);
      const y = Number.parseFloat(f2.input.value);
      if (Number.isNaN(x) || Number.isNaN(y)) {
        out.textContent = "Type two numbers.";
        send.disabled = true;
        return;
      }
      if (kind.value === "of") {
        last = `${round(x)}% of ${round(y)} = ${round((x / 100) * y)}`;
      } else {
        if (y === 0) {
          out.textContent = "The whole cannot be 0.";
          send.disabled = true;
          return;
        }
        last = `${round(x)} is ${round((x / y) * 100)}% of ${round(y)}`;
      }
      out.textContent = last;
      send.disabled = false;
    };
    pane.addEventListener("input", calc);
    pane.addEventListener("change", calc);
    send.addEventListener("click", () => last && sendToBoard(last));
    labels();
    return pane;
  }

  /* ------------------------------------------------------------------ boot */
  function boot() {
    const panel = $("#calcPanel");
    const btn = $("#calcBtn");
    const exprEl = $("#calcExpr");
    const outEl = $("#calcOut");
    const keys = $(".calc-keys");
    const basic = $("#calcBasic");
    const graph = $("#calcGraphWrap");
    const body = $(".calc-body", panel || doc);
    const modes = $(".calc-modes");
    if (!panel || !btn || !exprEl || !outEl || !keys || !basic || !body || !modes) return;

    const sendToBoard = (text) => {
      root.dispatchEvent(new CustomEvent("mwb:add-text", { detail: { text: String(text) } }));
      if (root.MWBShell) root.MWBShell.toast("Sent to your board");
    };

    /* off switch */
    const applyOff = () => {
      const off = !!(root.MWBTeacher && root.MWBTeacher.calcOff());
      btn.hidden = off;
      btn.toggleAttribute("data-calc-off", off);
      if (off && !panel.hidden) $("#calcClose").click();
    };
    applyOff();
    if (root.MWBTeacher) root.MWBTeacher.onChange(applyOff);

    /* history tape + send to board */
    const tape = [];
    const tapeBox = el("details", "wbx-tape");
    tapeBox.append(el("summary", "", "History"));
    const tapeList = el("ol", "wbx-tape-list");
    tapeBox.appendChild(tapeList);
    const actions = el("div", "wbx-calc-actions");
    const sendBtn = el("button", "tbtn", "Send result to board");
    sendBtn.type = "button";
    actions.appendChild(sendBtn);
    basic.append(actions, tapeBox);
    const renderTape = () => {
      tapeList.textContent = "";
      tape
        .slice()
        .reverse()
        .forEach((entry) => {
          const li = el("li", "", entry);
          const b = el("button", "wbx-chip", "Send");
          b.type = "button";
          b.setAttribute("aria-label", `Send to board: ${entry}`);
          b.addEventListener("click", () => sendToBoard(entry));
          li.appendChild(b);
          tapeList.appendChild(li);
        });
      if (!tape.length) tapeList.appendChild(el("li", "wbx-muted", "Your equals appear here."));
    };
    renderTape();
    const record = () => {
      const expr = exprEl.textContent.trim();
      const out = outEl.textContent.trim();
      if (!expr || !out || out === "Error" || out === expr) return;
      const line = `${expr} = ${out}`;
      if (tape[tape.length - 1] !== line) tape.push(line);
      if (tape.length > 20) tape.shift();
      renderTape();
    };
    keys.addEventListener("click", (event) => {
      const key = event.target.closest(".calc-key");
      if (key && key.getAttribute("data-act") === "equals") root.setTimeout(record, 0);
    });
    sendBtn.addEventListener("click", () => {
      const out = outEl.textContent.trim();
      if (!out || out === "0") return;
      const expr = exprEl.textContent.trim();
      sendToBoard(expr && expr !== out ? `${expr} = ${out}` : out);
    });

    /* fractions + percent modes */
    const fractions = buildFractionPane(sendToBoard);
    const percent = buildPercentPane(sendToBoard);
    body.append(fractions, percent);
    const extra = [
      ["fractions", "Fractions", fractions],
      ["percent", "Percent", percent],
    ];
    const extraBtns = extra.map(([id, label, pane]) => {
      const b = el("button", "calc-mode", label);
      b.type = "button";
      b.dataset.extra = id;
      b.addEventListener("click", () => {
        basic.hidden = true;
        if (graph) graph.hidden = true;
        for (const [, , p] of extra) p.hidden = p !== pane;
        panel.querySelectorAll(".calc-mode").forEach((m) => {
          m.classList.toggle("is-active", m === b);
        });
        const first = pane.querySelector("input");
        if (first) first.focus();
      });
      modes.appendChild(b);
      return b;
    });
    modes.querySelectorAll(".calc-mode[data-mode]").forEach((m) => {
      m.addEventListener("click", () => {
        for (const [, , p] of extra) p.hidden = true;
        extraBtns.forEach((x) => {
          x.classList.remove("is-active");
        });
      });
    });

    /* keyboard */
    const map = {
      "+": "[data-op='+']",
      "-": "[data-op='-']",
      "*": "[data-op='*']",
      x: "[data-op='*']",
      "/": "[data-op='/']",
      ".": "[data-act='dot']",
      ",": "[data-act='dot']",
      "%": "[data-act='percent']",
      "=": "[data-act='equals']",
      Enter: "[data-act='equals']",
      Backspace: "[data-act='back']",
      Delete: "[data-act='clear']",
      c: "[data-act='clear']",
      C: "[data-act='clear']",
    };
    doc.addEventListener(
      "keydown",
      (event) => {
        if (panel.hidden || basic.hidden || event.ctrlKey || event.metaKey || event.altKey) return;
        const t = event.target;
        if (
          t &&
          (t.tagName === "INPUT" ||
            t.tagName === "TEXTAREA" ||
            t.tagName === "SELECT" ||
            t.isContentEditable ||
            (t.closest && t.closest("#overlay")))
        )
          return;
        if (t && t.tagName === "BUTTON" && event.key === "Enter" && panel.contains(t)) return;
        const selector = /^[0-9]$/.test(event.key) ? `[data-num='${event.key}']` : map[event.key];
        if (!selector) return;
        const key = $(selector, keys);
        if (!key) return;
        event.preventDefault();
        event.stopPropagation();
        key.click();
        key.classList.add("wbx-pressed");
        root.setTimeout(() => key.classList.remove("wbx-pressed"), 120);
      },
      true,
    );

    root.MWBCalc = Object.freeze({ applyOff });
  }

  if (doc.readyState === "loading") doc.addEventListener("DOMContentLoaded", boot);
  else boot();
})(window);
