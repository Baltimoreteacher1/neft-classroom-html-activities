// Lesson 6-5 pixel art engine. One engine, many pictures: art/*.js supplies data only.
// Flow: solve a can's expression -> its code unlocks -> paint-by-number -> picture + finale.
(() => {
  "use strict";
  const A = window.PIXEL_ARTS?.[document.body.dataset.art];
  if (!A) return;
  const KEY = "ewl-pixel-6-5-" + A.id;
  const ROWS = A.grid.length;
  const COLS = A.grid[0].length;
  const REDUCED = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const TEACHER = new URLSearchParams(location.search).get("teacher") === "1";
  const $ = (s, r = document) => r.querySelector(s);
  const esc = (s) =>
    String(s).replace(
      /[&<>"]/g,
      (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c],
    );

  /* ---------- math: one source of truth (codes are computed, never typed) ---------- */
  const exprOf = (k) => {
    const q = A.colors[k].q;
    return q.choices ? q.choices.find((c) => c.ok).t : q.expr;
  };
  const toJs = (expr, vars) =>
    expr
      .replace(/[a-z]/g, (m) => `(${vars[m]})`)
      .replace(/÷/g, "/")
      .replace(/×/g, "*")
      .replace(/−/g, "-")
      .replace(/²/g, "**2")
      .replace(/(\d|\))\s*\(/g, "$1*(");
  const evaluate = (expr, vars) => {
    const js = toJs(expr, vars);
    if (!/^[\d\s+\-*/().]+$/.test(js)) throw new Error("Unsafe expression: " + expr);
    return Function(`"use strict";return (${js})`)();
  };
  // Show the substitution the way a student would write it: 3n -> 3(6), x² -> (5)²
  const substitute = (expr, vars) =>
    expr.replace(/[a-z]/g, (m, i) =>
      /[\d)]/.test(expr[i - 1] || "") || expr[i + 1] === "²" ? `(${vars[m]})` : String(vars[m]),
    );
  const varLine = (vars) =>
    Object.entries(vars)
      .map(([k, v]) => `${k} = ${v}`)
      .join(", ");

  const KEYS = Object.keys(A.colors);
  const CODE = Object.fromEntries(KEYS.map((k) => [k, evaluate(exprOf(k), A.colors[k].q.vars)]));
  if (new Set(Object.values(CODE)).size !== KEYS.length)
    console.warn("Pixel art: duplicate can codes", CODE);
  // Order-of-operations step (opt-in per picture): authored "what first?" choices + intermediate rewrites.
  const hasOoo = (k) => !!(A.ooo && A.colors[k].q.ooo);
  const oooChain = (k) => {
    const q = A.colors[k].q;
    return [substitute(exprOf(k), q.vars), ...q.ooo.steps, CODE[k]];
  };
  KEYS.filter(hasOoo).forEach((k) =>
    A.colors[k].q.ooo.steps.forEach((st) => {
      if (evaluate(st, A.colors[k].q.vars) !== CODE[k])
        console.warn("Pixel art: order-of-operations step does not equal the can code", k, st);
    }),
  );
  const COUNT = {};
  let TOTAL = 0;
  A.grid.forEach((row) =>
    [...row].forEach((ch) => {
      if (ch !== ".") {
        COUNT[ch] = (COUNT[ch] || 0) + 1;
        TOTAL++;
      }
    }),
  );
  const lum = (hex) => {
    const n = parseInt(hex.slice(1), 16);
    return (0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255;
  };

  /* ---------- state ---------- */
  let S = { unlocked: {}, painted: [], mistakes: 0 };
  try {
    S = { ...S, ...JSON.parse(localStorage.getItem(KEY) || "{}") };
  } catch {
    /* private mode */
  }
  const painted = new Set(S.painted);
  let sel = null;
  let cur = 0;
  const save = () => {
    try {
      localStorage.setItem(
        KEY,
        JSON.stringify({ unlocked: S.unlocked, painted: [...painted], mistakes: S.mistakes }),
      );
    } catch {
      /* ignore */
    }
  };

  /* ---------- page skeleton ---------- */
  document.documentElement.style.setProperty("--accent", A.accent);
  document.documentElement.style.setProperty("--bgc", A.bg);
  document.documentElement.style.setProperty("--cols", COLS);
  const MY = A.mystery; // names and emoji stay hidden until the picture is finished
  document.title = `${MY.title} — Pixel Art | Lesson 6-5 | Neft Teacher`;
  const stars = (t) => "★".repeat(t) + "☆".repeat(3 - t);
  $("#app").innerHTML = `
    <header class="top">
      <a class="back" href="/math/unit-6/6-5-pixel-art/">← Pixel Art Studio</a>
      <div class="ttl"><span class="em" id="hdrEm" aria-hidden="true">🎨</span><div><h1 id="hdrTitle">${esc(MY.title)}</h1><p>${esc(A.tagline)}</p></div></div>
      <div class="tools">
        <button class="btn ghost" id="howBtn" type="button">How to play</button>
        <button class="btn ghost" id="printBtn" type="button">🖨️ Print worksheet</button>
        <button class="btn ghost" id="resetBtn" type="button">↺ Restart</button>
      </div>
    </header>
    ${
      TEACHER
        ? `<div class="teacher" role="region" aria-label="Teacher tools"><strong>Teacher mode</strong>
      <button class="btn" id="tUnlock" type="button">Unlock all cans</button>
      <button class="btn" id="tKey" type="button">🖨️ Print answer key</button></div>`
        : ""
    }
    <p class="story" id="storyP">${esc(A.story)}</p>
    <div class="meter" aria-live="polite"><div class="bar"><i id="barFill"></i></div><span id="meterTxt"></span></div>
    <main class="stage">
      <section class="boardWrap" aria-label="Pixel canvas">
        <div class="board" id="board" role="grid" tabindex="0" aria-label="${esc(MY.title)} paint by number board. Arrow keys move, Space paints."></div>
        <p class="boardHint" id="boardHint">Unlock a paint can, pick it, then tap or drag on squares with its code.</p>
      </section>
      <aside class="shelf" aria-label="Paint cans">
        <h2>🎨 Paint shelf</h2>
        <div class="cans" id="cans"></div>
        <div class="brush" id="brush" aria-live="polite"></div>
        <details class="toolbox"><summary>🧰 Math toolbox</summary>
          <div class="anat"><b class="co">3</b><b class="va">n</b> <b>+</b> <b class="cn">5</b></div>
          <ul><li><b class="co">coefficient</b> multiplies the variable</li><li><b class="va">variable</b> is a letter for an unknown number</li><li><b class="cn">constant</b> is a number on its own</li><li><b>substitute</b> to swap the variable for its value</li><li><b>evaluate</b> to find the value (multiply/divide before add/subtract)</li></ul>
          ${A.ooo ? '<p class="pemdas"><b>Order of operations:</b> ① parentheses ② exponents ③ multiply &amp; divide (left to right) ④ add &amp; subtract (left to right)</p>' : ""}
        </details>
      </aside>
    </main>
    <dialog id="dlg" aria-labelledby="dlgTitle"></dialog>
    <dialog id="howDlg" class="how" aria-labelledby="howTitle">
      <h2 id="howTitle">How to play</h2>
      <ol><li><b>Pick a locked can</b> and solve its ${A.mode === "write" ? "phrase: write the expression, then evaluate it" : "expression: evaluate it for the given value"}.</li>
      <li>The answer is the can's <b>code number</b>. The can unlocks!</li>
      <li><b>Select the can</b>, then tap or drag across squares showing that same number.</li>
      <li>Paint every square to reveal the <b>mystery picture</b>.</li></ol>
      <p class="muted">Tip: tap <b>Fill all</b> on a can to paint every square of that colour at once. Your progress saves on this device.</p>
      <form method="dialog"><button class="btn primary">Let's paint!</button></form>
    </dialog>
    <canvas id="confetti" aria-hidden="true"></canvas>
    <div class="toast" id="toast" role="status" aria-live="polite"></div>
    <section id="printSheet" aria-hidden="true"></section>`;

  /* ---------- board ---------- */
  const board = $("#board");
  const cells = [];
  A.grid.forEach((row, r) =>
    [...row].forEach((ch, c) => {
      const el = document.createElement("div");
      el.className = "cell" + (ch === "." ? " bg" : "");
      el.dataset.r = r;
      el.dataset.c = c;
      if (ch !== ".") {
        el.dataset.k = ch;
        el.textContent = CODE[ch];
        el.style.setProperty("--c", A.colors[ch].hex);
        el.style.setProperty("--tc", lum(A.colors[ch].hex) > 0.55 ? "#2b2b3a" : "#ffffff");
        el.setAttribute("role", "gridcell");
        el.setAttribute("aria-label", `Row ${r + 1}, column ${c + 1}, code ${CODE[ch]}`);
      } else el.setAttribute("aria-hidden", "true");
      board.append(el);
      cells.push(el);
    }),
  );
  const idx = (el) => +el.dataset.r * COLS + +el.dataset.c;
  const isPainted = (el) => painted.has(idx(el));

  function paintEl(el, instant) {
    const i = idx(el);
    painted.add(i);
    el.classList.add("on");
    if (!instant && !REDUCED) {
      el.classList.remove("pop");
      void el.offsetWidth;
      el.classList.add("pop");
    }
  }
  cells.forEach((el) => {
    if (el.dataset.k && painted.has(idx(el))) paintEl(el, true);
  });

  let dragging = false;
  const hit = (e) => document.elementFromPoint(e.clientX, e.clientY)?.closest?.(".cell[data-k]");
  function tryPaint(el, strict) {
    if (!el || isPainted(el)) return;
    if (!sel) {
      if (strict) {
        toast("Pick an unlocked paint can first 🎨");
        pulse($("#cans"));
      }
      return;
    }
    if (el.dataset.k !== sel) {
      if (strict) {
        S.mistakes++;
        save();
        el.classList.remove("shake");
        void el.offsetWidth;
        el.classList.add("shake");
        toast(`That square says ${CODE[el.dataset.k]}, but this can is code ${CODE[sel]}.`);
      }
      return;
    }
    paintEl(el);
    afterPaint();
  }
  board.addEventListener("pointerdown", (e) => {
    const el = hit(e);
    if (!el) return;
    dragging = true;
    board.setPointerCapture(e.pointerId);
    cur = idx(el);
    tryPaint(el, true);
  });
  board.addEventListener("pointermove", (e) => {
    if (dragging) tryPaint(hit(e), false);
  });
  const stop = () => {
    dragging = false;
  };
  board.addEventListener("pointerup", stop);
  board.addEventListener("pointercancel", stop);
  board.addEventListener("keydown", (e) => {
    const d = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -COLS, ArrowDown: COLS }[e.key];
    if (d) {
      e.preventDefault();
      cur = Math.max(0, Math.min(ROWS * COLS - 1, cur + d));
      markCur();
    } else if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      tryPaint(cells[cur], true);
    }
  });
  board.addEventListener("focus", markCur);
  board.addEventListener("blur", () => cells.forEach((c) => c.classList.remove("cur")));
  function markCur() {
    cells.forEach((c, i) => c.classList.toggle("cur", i === cur));
  }

  /* ---------- paint shelf ---------- */
  const cansEl = $("#cans");
  const order = [...KEYS].sort((a, b) => A.colors[a].tier - A.colors[b].tier);
  const remaining = (k) => cells.filter((c) => c.dataset.k === k && !isPainted(c)).length;
  function renderShelf() {
    cansEl.innerHTML = order
      .map((k) => {
        const c = A.colors[k],
          open = S.unlocked[k],
          left = remaining(k);
        const state = !open ? "locked" : left === 0 ? "done" : "ready";
        return `<button type="button" class="can ${state} ${sel === k ? "sel" : ""}" data-k="${k}" style="--c:${c.hex}"
        aria-label="${open ? `${c.name} paint, code ${CODE[k]}, ${left} squares left` : `Locked paint can, level ${c.tier}. Solve to unlock.`}">
        <span class="sw">${open ? "" : "🔒"}${state === "done" ? "✓" : ""}</span>
        <span class="nm">${open ? esc(c.name) : "Mystery can"}</span>
        <span class="cd">${open ? "Code " + CODE[k] : stars(c.tier)}</span></button>`;
      })
      .join("");
    const b = $("#brush");
    if (sel) {
      const left = remaining(sel);
      b.innerHTML = `<span class="chip" style="--c:${A.colors[sel].hex}"></span> Painting with <b>${esc(A.colors[sel].name)}</b> · code <b>${CODE[sel]}</b> · ${left} left
        ${left ? '<button class="btn small" id="fillBtn" type="button">Fill all</button>' : ""}`;
    } else b.textContent = "Select an unlocked can to start painting.";
  }
  cansEl.addEventListener("click", (e) => {
    const b = e.target.closest(".can");
    if (!b) return;
    const k = b.dataset.k;
    if (!S.unlocked[k]) return openQuestion(k);
    if (remaining(k) === 0) return toast("All squares of this colour are done ✓");
    sel = k;
    renderShelf();
    highlightTargets();
  });
  $("#brush").addEventListener("click", (e) => {
    if (e.target.id !== "fillBtn") return;
    let n = 0;
    cells
      .filter((c) => c.dataset.k === sel && !isPainted(c))
      .forEach((c) =>
        setTimeout(
          () => {
            paintEl(c);
            afterPaint(true);
          },
          REDUCED ? 0 : n++ * 14,
        ),
      );
  });
  function highlightTargets() {
    cells.forEach((c) =>
      c.classList.toggle("target", !!sel && c.dataset.k === sel && !isPainted(c)),
    );
  }

  /* ---------- question dialog ---------- */
  const dlg = $("#dlg");
  const closeBtn = '<button class="x" type="button" data-close aria-label="Close">✕</button>';
  dlg.addEventListener("click", (e) => {
    if (e.target.matches("[data-close]") || e.target === dlg) dlg.close();
  });
  function openQuestion(k) {
    const q = A.colors[k].q;
    if (q.choices) stepWrite(k);
    else stepEval(k, q.expr, false);
    dlg.showModal();
  }
  function head(k, label) {
    return `${closeBtn}<div class="qhead"><span class="chip" style="--c:#8a93b8"></span><h2 id="dlgTitle">${label}</h2><span class="tier">Level ${stars(A.colors[k].tier)}</span></div>`;
  }
  function stepWrite(k) {
    const q = A.colors[k].q;
    const wrong = q.choices.map((c, i) => ({ ...c, i })).filter((c) => c.ok !== true);
    const right = { ...q.choices.find((c) => c.ok), i: q.choices.findIndex((c) => c.ok) };
    const opts = [...wrong];
    opts.splice(k.charCodeAt(0) % q.choices.length, 0, right); // answer position varies by can
    dlg.innerHTML = `${head(k, q.situation ? "Step 1 · Translate the situation" : "Step 1 · Write the expression")}
      <p class="phrase${q.situation ? " long" : ""}">${q.situation ? esc(q.situation) : `“${esc(q.phrase)}”`}</p>
      <div class="opts" role="group" aria-label="Choose the matching expression">${opts.map((o) => `<button type="button" class="opt" data-i="${o.i}">${esc(o.t)}</button>`).join("")}</div>
      <p class="fb" id="fb" role="status" aria-live="polite">Which expression matches?</p>`;
    dlg.onclick = (e) => {
      if (e.target.matches("[data-close]") || e.target === dlg) return dlg.close();
      const b = e.target.closest(".opt");
      if (!b) return;
      const ch = q.choices[+b.dataset.i];
      const fb = $("#fb", dlg);
      if (ch.ok) {
        b.classList.add("good");
        fb.className = "fb good";
        fb.textContent = "Yes! That expression matches the words.";
        setTimeout(() => (hasOoo(k) ? stepOoo(k, ch.t) : stepEval(k, ch.t, true)), REDUCED ? 0 : 700);
      } else {
        b.classList.add("bad");
        b.disabled = true;
        fb.className = "fb bad";
        fb.textContent = ch.why;
        S.mistakes++;
        save();
      }
    };
  }
  function stepOoo(k, expr) {
    const q = A.colors[k].q,
      first = q.ooo.first;
    const right = { ...first.find((c) => c.ok), i: first.findIndex((c) => c.ok) };
    const opts = first.map((c, i) => ({ ...c, i })).filter((c) => c.ok !== true);
    opts.splice(k.charCodeAt(0) % first.length, 0, right);
    dlg.innerHTML = `${head(k, "Step 2 · Order of operations")}
      <div class="exprCard"><div class="expr">${esc(substitute(expr, q.vars))}</div><div class="when">after substituting ${esc(varLine(q.vars))}</div></div>
      <p class="phrase long">Parentheses, exponents, multiply &amp; divide, then add &amp; subtract. Which step do you do <b>first</b>?</p>
      <div class="opts ooo" role="group" aria-label="Choose the first step">${opts.map((o) => `<button type="button" class="opt" data-i="${o.i}">${esc(o.t)}</button>`).join("")}</div>
      <p class="fb" id="fb" role="status" aria-live="polite">What does the order of operations say to do first?</p>`;
    dlg.onclick = (e) => {
      if (e.target.matches("[data-close]") || e.target === dlg) return dlg.close();
      const b = e.target.closest(".opt");
      if (!b) return;
      const ch = first[+b.dataset.i];
      const fb = $("#fb", dlg);
      if (ch.ok) {
        b.classList.add("good");
        fb.className = "fb good";
        fb.textContent = "Yes! That step comes first in the order of operations.";
        setTimeout(() => stepEval(k, expr, true), REDUCED ? 0 : 700);
      } else {
        b.classList.add("bad");
        b.disabled = true;
        fb.className = "fb bad";
        fb.textContent = ch.why;
        S.mistakes++;
        save();
      }
    };
  }
  function stepEval(k, expr, fromWrite) {
    const q = A.colors[k].q,
      vars = q.vars;
    let tries = 0;
    dlg.innerHTML = `${head(k, fromWrite ? (q.use ? `Step ${hasOoo(k) ? 3 : 2} · Use your expression` : "Step 2 · Evaluate it") : "Evaluate the expression")}
      <div class="exprCard"><div class="expr">${esc(expr)}</div><div class="when">when ${esc(varLine(vars))}</div>${q.use ? `<p class="use">${esc(q.use)}</p>` : ""}</div>
      <form class="ans" id="ansForm" autocomplete="off"><label for="ans">Value =</label>
        <input id="ans" inputmode="numeric" pattern="[0-9]*" maxlength="4" aria-describedby="fb" />
        <button class="btn primary" type="submit">Check</button>
        <button class="btn ghost" type="button" id="hintBtn">Hint</button></form>
      <p class="fb" id="fb" role="status" aria-live="polite">Substitute the value, then follow the order of operations.</p>`;
    dlg.onclick = (e) => {
      if (e.target.matches("[data-close]") || e.target === dlg) return dlg.close();
      if (e.target.id === "hintBtn") showHint();
      if (e.target.id === "paintNow") {
        dlg.close();
        sel = k;
        renderShelf();
        highlightTargets();
      }
    };
    const fb = $("#fb", dlg),
      input = $("#ans", dlg);
    const showHint = () => {
      fb.className = "fb hint";
      fb.innerHTML = `Replace the variable with its value: <b>${esc(substitute(expr, vars))}</b>. ${hasOoo(k) ? `Start with: <b>${esc(q.ooo.first.find((c) => c.ok).t)}</b>.` : "Multiply and divide first, then add or subtract."}`;
    };
    $("#ansForm", dlg).onsubmit = (e) => {
      e.preventDefault();
      const raw = input.value.trim();
      if (!/^\d+$/.test(raw)) {
        fb.className = "fb bad";
        fb.textContent = "Type a whole number.";
        return;
      }
      if (+raw === CODE[k]) {
        S.unlocked[k] = 1;
        save();
        renderShelf();
        dlg.innerHTML = `${closeBtn}<div class="win"><div class="bigChip" style="--c:${A.colors[k].hex}"></div>
          <h2 id="dlgTitle">Can unlocked!</h2>
          <p>${esc(expr)} when ${esc(varLine(vars))} → <b>${hasOoo(k) ? oooChain(k).map(esc).join(" → ") : `${esc(substitute(expr, vars))} = ${CODE[k]}`}</b></p>
          <p class="codeBadge">${esc(A.colors[k].name)} = code ${CODE[k]}</p>
          <button class="btn primary" id="paintNow" type="button">Paint with it →</button></div>`;
        if (!REDUCED) burst(innerWidth / 2, innerHeight / 2, 40);
      } else {
        tries++;
        S.mistakes++;
        save();
        input.classList.remove("shake");
        void input.offsetWidth;
        input.classList.add("shake");
        if (tries >= 2) showHint();
        else {
          fb.className = "fb bad";
          fb.textContent = "Not quite. Substitute the value, then use the order of operations.";
        }
        input.select();
      }
    };
    setTimeout(() => input.focus(), 30);
  }

  /* ---------- progress, finale ---------- */
  function updateMeter() {
    const n = painted.size,
      u = Object.keys(S.unlocked).length;
    $("#barFill").style.width = (100 * n) / TOTAL + "%";
    $("#meterTxt").textContent =
      `${u}/${KEYS.length} cans unlocked · ${n}/${TOTAL} squares painted`;
  }
  let finished = false;
  function afterPaint(quiet) {
    save();
    updateMeter();
    renderShelf();
    highlightTargets();
    if (sel && remaining(sel) === 0) {
      sel = null;
      renderShelf();
    }
    if (painted.size === TOTAL && !finished) finish(quiet);
  }
  function finish(quiet) {
    finished = true;
    board.classList.add("done");
    $("#hdrTitle").textContent = A.title;
    $("#hdrEm").textContent = A.emoji;
    document.title = `${A.title} — Pixel Art | Lesson 6-5 | Neft Teacher`;
    $("#boardHint").innerHTML = `🎉 Mystery solved: it's <b>${esc(A.title)}</b>! Mistakes: ${S.mistakes}.`;
    if (!REDUCED) burst(innerWidth / 2, innerHeight / 3, 140);
    const other = A.next
      ? `<a class="btn" href="${A.next.href}">Next picture: ${esc(A.next.label)} →</a>`
      : "";
    const done = document.createElement("div");
    done.className = "finale";
    done.id = "finale";
    done.innerHTML = `<h2>🏆 ${esc(A.title)} complete!</h2><p>You evaluated ${KEYS.length} expressions and painted ${TOTAL} squares${S.mistakes ? ` with ${S.mistakes} slip${S.mistakes > 1 ? "s" : ""} along the way` : " with zero mistakes"}.</p>
      <div class="row"><button class="btn primary" id="dlPng" type="button">⬇ Download picture</button><a class="btn ghost" href="/lessons/6-5/">Back to Lesson 6-5</a>${other}</div>`;
    $(".boardWrap").append(done);
    if (!quiet) done.scrollIntoView({ behavior: REDUCED ? "auto" : "smooth", block: "nearest" });
  }
  document.addEventListener("click", (e) => {
    if (e.target.id !== "dlPng") return;
    const S2 = 24,
      cv = document.createElement("canvas");
    cv.width = COLS * S2;
    cv.height = ROWS * S2;
    const g = cv.getContext("2d");
    A.grid.forEach((row, r) =>
      [...row].forEach((ch, c) => {
        g.fillStyle = ch === "." ? A.bg : A.colors[ch].hex;
        g.fillRect(c * S2, r * S2, S2, S2);
      }),
    );
    cv.toBlob((b) => {
      const a = document.createElement("a");
      a.href = URL.createObjectURL(b);
      a.download = `mystery-picture-${MY.n}.png`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 2000);
    });
  });

  /* ---------- toast, pulse, confetti ---------- */
  let tt;
  function toast(msg) {
    const t = $("#toast");
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(tt);
    tt = setTimeout(() => t.classList.remove("show"), 2600);
  }
  function pulse(el) {
    if (REDUCED) return;
    el.classList.remove("pulse");
    void el.offsetWidth;
    el.classList.add("pulse");
  }
  const cvs = $("#confetti"),
    cg = cvs.getContext("2d");
  let parts = [],
    raf = 0;
  function burst(x, y, n) {
    cvs.width = innerWidth;
    cvs.height = innerHeight;
    const pal = [A.accent, "#ffffff", ...KEYS.map((k) => A.colors[k].hex)];
    for (let i = 0; i < n; i++)
      parts.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 14,
        vy: Math.random() * -13 - 3,
        s: 5 + Math.random() * 6,
        c: pal[(Math.random() * pal.length) | 0],
        r: Math.random() * 6,
        life: 90 + Math.random() * 40,
      });
    if (!raf) raf = requestAnimationFrame(tick);
  }
  function tick() {
    cg.clearRect(0, 0, cvs.width, cvs.height);
    parts = parts.filter((p) => p.life-- > 0);
    parts.forEach((p) => {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.45;
      p.r += 0.2;
      cg.fillStyle = p.c;
      cg.save();
      cg.translate(p.x, p.y);
      cg.rotate(p.r);
      cg.fillRect(-p.s / 2, -p.s / 4, p.s, p.s / 2);
      cg.restore();
    });
    raf = parts.length
      ? requestAnimationFrame(tick)
      : (cg.clearRect(0, 0, cvs.width, cvs.height), 0);
  }

  /* ---------- print worksheet (paper version, same data) ---------- */
  function buildPrint(withKey) {
    const rows = order
      .map((k, i) => {
        const q = A.colors[k].q;
        const task = q.choices
          ? `${q.situation ? esc(q.situation) + " Write an expression, then use it" : `Write an expression for “${esc(q.phrase)}”, then evaluate it`} when ${esc(varLine(q.vars))}.${q.use ? " " + esc(q.use) : ""}<div class="line">${withKey ? esc(exprOf(k)) : ""}</div>${hasOoo(k) ? `<div class="line">Order of operations (show your steps)${withKey ? ": " + oooChain(k).map(esc).join(" → ") : ""}</div>` : ""}`
          : `Evaluate <b>${esc(q.expr)}</b> when ${esc(varLine(q.vars))}.`;
        return `<tr><td>${i + 1}</td><td>${task}</td><td class="ansBox">${withKey ? CODE[k] : ""}</td><td><span class="chip" style="--c:${A.colors[k].hex}"></span> ${esc(A.colors[k].name)}</td></tr>`;
      })
      .join("");
    const grid = A.grid
      .map((row) =>
        [...row]
          .map((ch) =>
            ch === "."
              ? '<i class="pb"></i>'
              : `<i style="${withKey ? `background:${A.colors[ch].hex};color:${lum(A.colors[ch].hex) > 0.55 ? "#222" : "#fff"}` : ""}">${CODE[ch]}</i>`,
          )
          .join(""),
      )
      .join("");
    $("#printSheet").innerHTML =
      `<h1>🎨 ${esc(MY.title)} — Pixel Art${withKey ? " (ANSWER KEY)" : ""}</h1>
      <p class="pl">Name: ______________________ &nbsp; Date: ____________ &nbsp; Lesson 6-5 · 6.AT.6a</p>
      <p>${esc(A.story)} Solve each row. Your answer is the code number, so use that colour on the grid.</p>
      <table><thead><tr><th>#</th><th>Task</th><th>Code</th><th>Colour</th></tr></thead><tbody>${rows}</tbody></table>
      <h2>Colour by code</h2><div class="pgrid" style="--cols:${COLS}">${grid}</div>`;
  }
  const doPrint = (key) => {
    buildPrint(key);
    setTimeout(() => print(), 60);
  };
  $("#printBtn").onclick = () => doPrint(false);
  $("#tKey")?.addEventListener("click", () => doPrint(true));
  $("#tUnlock")?.addEventListener("click", () => {
    KEYS.forEach((k) => (S.unlocked[k] = 1));
    save();
    renderShelf();
  });

  /* ---------- chrome ---------- */
  $("#howBtn").onclick = () => $("#howDlg").showModal();
  $("#resetBtn").onclick = () => {
    if (!confirm("Restart this picture? Your painted squares and unlocked cans will be cleared."))
      return;
    try {
      localStorage.removeItem(KEY);
    } catch {
      /* ignore */
    }
    location.reload();
  };
  renderShelf();
  updateMeter();
  highlightTargets();
  if (painted.size === TOTAL) finish(true);
  else if (
    !painted.size &&
    !Object.keys(S.unlocked).length &&
    !sessionStorage.getItem(KEY + "-seen")
  ) {
    try {
      sessionStorage.setItem(KEY + "-seen", "1");
    } catch {
      /* ignore */
    }
    $("#howDlg").showModal();
  }
})();
