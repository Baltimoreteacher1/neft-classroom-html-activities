/**
 * Practice Studio v2 — the five answer-checked item kinds: multiple choice, typed number, find-the-error,
 * fill-in table, and written explanation with a self-check rubric.
 *
 * Every kind exposes mount(ctx). The runtime (assets/studio/runtime.js) builds ctx:
 *   ctx.it, ctx.state, ctx.host, ctx.solved, ctx.es()
 *   ctx.hintBlock()        the hint-ladder markup (the runtime wires its buttons)
 *   ctx.solve(html)        the student got it: stars, streak, explanation, next button
 *   ctx.showSolved(html)   redraw a finished item after a reload (no stats change)
 *   ctx.miss({tag, say, sayEs?, kind?})   a wrong try: counts it, names the misconception, explains
 *   ctx.fb(kind, html)     raw feedback box ("ok" | "err" | "warn")
 * Nothing here knows any mathematics: every right answer comes from the item.
 */
(() => {
  const W = /** @type {any} */ (window);
  const RT = (W.StudioRT = W.StudioRT || {});
  const K = (RT.kinds = RT.kinds || {});

  const esc = (/** @type {any} */ s) =>
    String(s ?? "").replace(
      /[&<>"']/g,
      (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] || c,
    );
  const es = (/** @type {any} */ text) =>
    text ? `<span class="es-text" lang="es">${esc(text)}</span>` : "";
  /** The situation an item belongs to (a lesson's Connect scenario) and its figure, shown above the question. */
  const viz = (/** @type {any} */ it) =>
    `${it.ctx ? `<p class="item-ctx">${esc(it.ctx)}${es(it.ctxEs)}</p>` : ""}${
      it.viz && W.StudioViz
        ? `<div class="viz-host" data-viz="${esc(it.viz.t)}">${W.StudioViz.render(it.viz)}</div>`
        : ""
    }`;
  /** Number from "12", "+18", "$3.50", "3/4", "2 1/3", "−5", or "12 cm" (a trailing unit is ignored). */
  const value = (/** @type {any} */ raw) => {
    const lead = String(raw).match(/^\s*([+−-]?\s*\$?[\d.,]+(?:\s+\d+\/\d+|\s*\/\s*\d+)?)/);
    return W.StudioGen.value(lead ? lead[1].replace(/\s*\/\s*/, "/") : String(raw));
  };
  const same = (/** @type {any} */ typed, /** @type {any} */ right, /** @type {number} */ tol) => {
    const a = value(typed);
    const b = value(right);
    return Number.isFinite(a) && Number.isFinite(b) && Math.abs(a - b) <= tol;
  };
  /**
   * Is a typed table cell right? Spacing, case, minus signs, × / · / *, thousands commas and "9 to 15" vs "9:15" do not matter.
   * A key written "a or b" accepts either. A key that is one number plus a unit ("12 cm²") accepts the number alone or with the
   * unit. A key with a SECOND number ("9 to 15", "(2, 6)", "1, 2, 3") must match whole: typing only "9" is not "9 to 15".
   */
  const canon = (/** @type {any} */ x) =>
    String(x ?? "")
      .toLowerCase()
      .replace(/[−–—]/g, "-")
      .replace(/[·*]/g, "×")
      .replace(/(\d),(?=\d{3}(?!\d))/g, "$1")
      .replace(/\s+/g, "")
      .replace(/(\d)to(\d)/g, "$1:$2")
      .replace(/\.$/, "");
  const LEAD = /^([+\-−]?\s*\$?\d[\d,]*(?:\.\d+)?(?:\s*\/\s*\d+)?)(.*)$/;
  const cellOk = (
    /** @type {any} */ typed,
    /** @type {any} */ want,
    /** @type {number} */ tol = 0.005,
  ) => {
    const t = String(typed ?? "").trim();
    if (!t) return false;
    for (const alt of String(want ?? "").split(/\s+or\s+/i)) {
      if (canon(t) === canon(alt)) return true;
      const a = LEAD.exec(alt.trim());
      const b = LEAD.exec(t);
      if (a && !/\d/.test(a[2]) && b) {
        const rest = canon(b[2]);
        if ((!rest || rest === canon(a[2])) && same(b[1], a[1], tol)) return true;
      }
    }
    return false;
  };
  /** A label in both languages; body.show-es picks which one shows (and which one a screen reader hears). */
  const bi = (/** @type {string} */ en, /** @type {string} */ sp) =>
    `<span class="t-en">${en}</span><span class="t-es" lang="es">${sp}</span>`;

  /**
   * The hint ladder: every shown rung is labelled "Hint k of n", and the button names the next rung and how many follow it.
   * `extra` is appended inside the area (the runtime's tutor button). Shared by the studios and the Unit 4 lab bench.
   */
  const ladder = (/** @type {any} */ it, /** @type {number} */ shown, extra = "") => {
    const hs = it.h || [];
    if (!hs.length) return "";
    const n = hs.length;
    const k = Math.min(n, Math.max(0, shown));
    const list = hs
      .slice(0, k)
      .map(
        (/** @type {string} */ h, /** @type {number} */ i) =>
          `<li><span class="hint-tag">${bi(`Hint ${i + 1} of ${n}`, `Pista ${i + 1} de ${n}`)}</span> ${esc(h)}${es((it.hEs || [])[i])}</li>`,
      )
      .join("");
    const left = n - k - 1;
    const more =
      k < n
        ? `<button type="button" class="btn btn-sm hint-btn" data-hint>💡 ${bi(`Hint ${k + 1} of ${n}`, `Pista ${k + 1} de ${n}`)}</button><span class="hint-left">${
            left > 0
              ? bi(
                  `${left} more after this one`,
                  `${left === 1 ? "queda 1 más" : `quedan ${left} más`} después de esta`,
                )
              : bi("last hint", "última pista")
          }</span>`
        : "";
    return `<div class="hint-area"><ol class="hint-list">${list}</ol>${more}${extra}</div>`;
  };

  /**
   * Feedback anatomy. Right: confirm, why it works, and (when the item names a trap) what to watch for.
   * Wrong: the trap's name when the misconception taxonomy has it, then one guiding line. Neither ever prints the answer
   * on a miss: the guiding line is the item's own authored feedback, the trap's fix, or a generic nudge.
   */
  const fbOk = (/** @type {string} */ lead, /** @type {string} */ why, watch = "") =>
    `<p class="fb-line fb-confirm"><strong>${lead}</strong></p> ${
      why
        ? `<div class="fb-line fb-why"><span class="fb-label">${bi("Why it works", "Por qué funciona")}<span class="sr-only">: </span></span> ${why}</div>`
        : ""
    }${watch ? `<p class="fb-line fb-watch"><span class="fb-label">${bi("Watch for", "Cuidado con")}<span class="sr-only">: </span></span> ${watch}</p>` : ""}`;
  const fbMiss = (
    /** @type {string} */ lead,
    /** @type {string} */ trap,
    /** @type {string} */ guide,
  ) =>
    `${lead ? `<p class="fb-line fb-confirm"><strong>${lead}</strong></p>` : ""}${
      trap
        ? `<p class="fb-line fb-trap"><span class="fb-label">${bi("Trap", "Trampa")}<span class="sr-only">: </span></span> ${trap}</p>`
        : ""
    }<div class="fb-line fb-guide">${guide}</div>`;

  /** Typeset text (assets/studio/typeset.js): clean fractions stack, stems split into setup and ask. Plain when absent. */
  const T = () => W.StudioType;
  const tx = (/** @type {any} */ s) => (T() ? T().frac(esc(s), "en") : esc(s));
  /** A choice with no Spanish twin (a bare number): its fraction words follow the page language. */
  const txBoth = (/** @type {any} */ s) => (T() ? T().frac(esc(s), "both") : esc(s));
  const txEs = (/** @type {any} */ s) =>
    s ? `<span class="es-text" lang="es">${T() ? T().frac(esc(s), "es") : esc(s)}</span>` : "";
  const stem = (/** @type {any} */ en, /** @type {any} */ sp) =>
    T() ? T().stem(String(en ?? ""), sp ? String(sp) : "", esc) : `${esc(en)}${es(sp)}`;

  RT.util = {
    esc,
    es,
    bi,
    tx,
    txBoth,
    txEs,
    stem,
    viz,
    value,
    same,
    canon,
    cellOk,
    ladder,
    fbOk,
    fbMiss,
  };

  const done = (/** @type {any} */ it) =>
    `<strong>${esc(it.x ? "" : "")}</strong>${tx(it.x)}${txEs(it.xEs)}`;

  /* ---- multiple choice ----------------------------------------------------------------------- */
  K.mc = {
    mount(/** @type {any} */ ctx) {
      const it = ctx.it;
      const chosen = ctx.state.picks[it.id];
      const rows = it.c
        .map((/** @type {string} */ c, /** @type {number} */ i) => {
          const cls = ctx.solved
            ? i === it.a
              ? "correct"
              : i === chosen
                ? "wrong"
                : ""
            : chosen === i
              ? "wrong"
              : "";
          return `<button type="button" class="choice-btn ${cls}" data-mc="${i}"${ctx.solved ? " disabled" : ""}><span>${(it.cEs || [])[i] ? tx(c) : txBoth(c)}${txEs((it.cEs || [])[i])}</span></button>`;
        })
        .join("");
      // "Which move?": the work so far, shown above the question it is about
      const work = Array.isArray(it.work)
        ? `<div class="move-work" role="group" aria-label="Work so far"><p class="move-label">Work so far${es("Trabajo hasta ahora")}</p><ol class="move-lines">${it.work
            .map(
              (/** @type {string} */ l, /** @type {number} */ i) =>
                `<li>${tx(l)}${txEs((it.workEs || [])[i])}</li>`,
            )
            .join("")}</ol></div>`
        : "";
      ctx.host.innerHTML = `${viz(it)}${work}<p class="item-q">${stem(it.q, it.qEs)}</p>
        <div class="answer-zone"><div class="choice-stack" role="group" aria-label="Answer choices">${rows}</div></div>
        ${ctx.hintBlock()}<div class="item-fb feedback-box" role="status"></div>`;
      if (ctx.solved) return ctx.showSolved(done(it));
      for (const btn of /** @type {HTMLElement[]} */ ([...ctx.host.querySelectorAll("[data-mc]")]))
        btn.addEventListener("click", () => {
          const i = Number(btn.dataset.mc);
          for (const b of ctx.host.querySelectorAll("[data-mc]")) b.classList.remove("wrong");
          ctx.state.picks[it.id] = i;
          if (i === it.a) {
            btn.classList.add("correct");
            for (const b of ctx.host.querySelectorAll("[data-mc]")) b.setAttribute("disabled", "");
            ctx.solve(done(it));
          } else {
            btn.classList.add("wrong");
            ctx.miss({
              tag: (it.tag || [])[i],
              say: (it.f || [])[i],
              sayEs: (it.fEs || [])[i],
              wrongText: it.c[i],
            });
            // the order changes after every miss, so remembering a position finds nothing
            const stack = ctx.host.querySelector(".choice-stack");
            const btns = /** @type {HTMLElement[]} */ ([
              ...(stack?.querySelectorAll("[data-mc]") || []),
            ]);
            if (stack && btns.length > 2) {
              const seed = ctx.misses() * 7919 + String(it.id).length * 31;
              for (const k of W.StudioAttempts.shuffleOrder(btns.length, seed))
                stack.append(btns[k]);
            }
            /** @type {HTMLElement|null} */ (ctx.host.querySelector(".hold-chip"))?.focus();
          }
        });
    },
  };

  /* ---- typed number --------------------------------------------------------------------------- */
  K.num = {
    mount(/** @type {any} */ ctx) {
      const it = ctx.it;
      const typed = ctx.solved ? it.a : (ctx.state.notes[it.id] ?? "");
      ctx.host.innerHTML = `${viz(it)}<p class="item-q">${stem(it.q, it.qEs)}</p>
        <div class="answer-zone"><div class="num-row">
          <label class="sr-only" for="num-${esc(it.id)}">Your answer</label>
          <input class="num-input${ctx.solved ? " ok" : ""}" id="num-${esc(it.id)}" type="text" inputmode="text" autocomplete="off" autocapitalize="off" spellcheck="false" value="${esc(typed)}"${ctx.solved ? " readonly" : ""} placeholder="?">
          ${it.unit ? `<span class="num-unit">${esc(it.unit)}</span>` : ""}
          ${ctx.solved ? "" : '<button type="button" class="btn btn-primary btn-sm" data-check>Check</button>'}
        </div></div>
        ${ctx.hintBlock()}<div class="item-fb feedback-box" role="status"></div>`;
      if (ctx.solved) return ctx.showSolved(done(it));
      const input = /** @type {HTMLInputElement} */ (ctx.host.querySelector(".num-input"));
      const tol = Number.isFinite(it.tol) ? it.tol : 0.005;
      const check = () => {
        ctx.state.notes[it.id] = input.value;
        ctx.save();
        if (!input.value.trim()) return;
        const n = value(input.value);
        if (!Number.isFinite(n)) {
          ctx.fb(
            "warn",
            `<strong>Type a number.</strong> Like 12, 3/4, 2.5 or 2 1/3.${es("Escribe un número, como 12, 3/4, 2.5 o 2 1/3.")}`,
          );
          return;
        }
        if (same(input.value, it.a, tol)) {
          input.classList.add("ok");
          input.setAttribute("readonly", "");
          ctx.host.querySelector("[data-check]")?.remove();
          ctx.solve(done(it));
        } else {
          input.classList.add("err");
          const hit = (it.fw || []).find((/** @type {any} */ w) => same(input.value, w.v, tol));
          ctx.miss({
            tag: hit?.tag,
            say: hit?.f,
            sayEs: hit?.fEs,
            wrongText: input.value,
            generic: "That is not it yet. Reread the question, then open a hint if you want one.",
            genericEs: "Todavía no. Vuelve a leer la pregunta y abre una pista si quieres.",
          });
        }
      };
      input.addEventListener("input", () => {
        input.classList.remove("err");
        ctx.state.notes[it.id] = input.value;
      });
      input.addEventListener("keydown", (e) => {
        if (e.key === "Enter") check();
      });
      ctx.host.querySelector("[data-check]")?.addEventListener("click", check);
    },
  };

  /* ---- find the error ------------------------------------------------------------------------- */
  const errDone = (/** @type {any} */ it) =>
    `<strong>Yes, that is the step.</strong> ${tx(it.fix)}${txEs(it.fixEs)} ${tx(it.x)}${txEs(it.xEs)}`;
  K.err = {
    mount(/** @type {any} */ ctx) {
      const it = ctx.it;
      const chosen = ctx.state.picks[it.id];
      const steps = it.s
        .map((/** @type {any} */ s, /** @type {number} */ i) => {
          const cls =
            ctx.solved && i === it.e ? "correct" : chosen === i && i !== it.e ? "wrong" : "";
          return `<li><button type="button" class="choice-btn err-step ${cls}" data-err="${i}"${ctx.solved ? " disabled" : ""}><span class="choice-letter" aria-hidden="true">${i + 1}</span><span><strong>${esc(s.l)}</strong>: ${esc(s.w)}${s.wEs ? `<span class="es-text" lang="es">${esc(s.lEs || s.l)}: ${esc(s.wEs)}</span>` : ""}</span></button></li>`;
        })
        .join("");
      ctx.host.innerHTML = `${viz(it)}<p class="item-q">${stem(it.t, it.tEs)}</p>
        <p class="item-sub">One step has a mistake. Tap the step where it first goes wrong.${es("Un paso tiene un error. Toca el paso donde se equivoca primero.")}</p>
        <div class="answer-zone"><ol class="err-steps">${steps}</ol></div>${ctx.hintBlock()}<div class="item-fb feedback-box" role="status"></div>`;
      if (ctx.solved) return ctx.showSolved(errDone(it));
      for (const btn of /** @type {HTMLElement[]} */ ([...ctx.host.querySelectorAll("[data-err]")]))
        btn.addEventListener("click", () => {
          const i = Number(btn.dataset.err);
          for (const b of ctx.host.querySelectorAll("[data-err]")) b.classList.remove("wrong");
          ctx.state.picks[it.id] = i;
          if (i === it.e) {
            btn.classList.add("correct");
            for (const b of ctx.host.querySelectorAll("[data-err]")) b.setAttribute("disabled", "");
            ctx.solve(errDone(it));
          } else {
            btn.classList.add("wrong");
            const hs = it.h || [];
            ctx.miss({
              tag: `${i < it.e ? "checked-a-correct-step" : "missed-the-first-error"}`,
              say: `That step is fine. ${hs[Math.min(ctx.misses() - 1, Math.max(0, hs.length - 1))] || "Check each step against the one before it."}`,
              noLead: true,
            });
          }
        });
    },
  };

  /* ---- fill-in table -------------------------------------------------------------------------- */
  K.tbl = {
    mount(/** @type {any} */ ctx) {
      const it = ctx.it;
      const mine = ctx.state.cells[it.id] || {};
      const key = (/** @type {number} */ r, /** @type {number} */ c) => `${r}:${c}`;
      const editable = new Map(it.cells.map((/** @type {any} */ x) => [key(x.r, x.c), x.a]));
      const body = it.rows
        .map(
          (/** @type {string[]} */ row, /** @type {number} */ r) =>
            `<tr>${row
              .map((/** @type {string} */ cell, /** @type {number} */ c) => {
                if (!editable.has(key(r, c)))
                  return `<td>${esc(cell)}${es((it.rowsEs || [])[r]?.[c])}</td>`;
                const v = ctx.solved ? editable.get(key(r, c)) : (mine[key(r, c)] ?? "");
                return `<td><input class="num-input${ctx.solved ? " ok" : ""}" type="text" inputmode="decimal" autocomplete="off" data-cell="${key(r, c)}" value="${esc(v)}" aria-label="${esc(it.hd[c])}, row ${r + 1}"${ctx.solved ? " readonly" : ""}></td>`;
              })
              .join("")}</tr>`,
        )
        .join("");
      ctx.host.innerHTML = `${viz(it)}<p class="item-q">${stem(it.t, it.tEs)}</p>
        <div class="answer-zone"><div class="table-wrap"><table class="data-table"><thead><tr>${it.hd.map((/** @type {string} */ h, /** @type {number} */ i) => `<th scope="col">${esc(h)}${es((it.hdEs || [])[i])}</th>`).join("")}</tr></thead><tbody>${body}</tbody></table></div>
        ${ctx.solved ? "" : '<div class="item-actions"><button type="button" class="btn btn-primary btn-sm" data-check-table>Check my table</button></div>'}</div>
        ${ctx.hintBlock()}<div class="item-fb feedback-box" role="status"></div>`;
      if (ctx.solved)
        return ctx.showSolved(`<strong>Table complete.</strong> ${tx(it.x)}${txEs(it.xEs)}`);
      const inputs = /** @type {HTMLInputElement[]} */ ([
        ...ctx.host.querySelectorAll("[data-cell]"),
      ]);
      for (const inp of inputs)
        inp.addEventListener("input", () => {
          ctx.state.cells[it.id] = ctx.state.cells[it.id] || {};
          ctx.state.cells[it.id][inp.dataset.cell || ""] = inp.value;
          inp.classList.remove("ok", "err");
          ctx.save();
        });
      ctx.host.querySelector("[data-check-table]")?.addEventListener("click", () => {
        let right = 0;
        let empty = 0;
        for (const inp of inputs) {
          const [r, c] = (inp.dataset.cell || "0:0").split(":").map(Number);
          const want = it.cells.find((/** @type {any} */ x) => x.r === r && x.c === c).a;
          if (!inp.value.trim()) {
            empty++;
            inp.classList.remove("ok", "err");
          } else if (cellOk(inp.value, want, 0.005)) {
            right++;
            inp.classList.add("ok");
            inp.classList.remove("err");
          } else {
            inp.classList.add("err");
            inp.classList.remove("ok");
          }
        }
        if (right === inputs.length) {
          for (const i of inputs) i.setAttribute("readonly", "");
          ctx.host.querySelector("[data-check-table]")?.remove();
          ctx.solve(`<strong>Table complete.</strong> ${tx(it.x)}${txEs(it.xEs)}`);
        } else
          ctx.miss({
            tag: "table-cell",
            kind: "warn",
            say: `${right} of ${inputs.length} cells are right. ${empty ? `${empty} still empty. ` : ""}Fix the red ones, then check again.`,
            noLead: true,
          });
      });
    },
  };

  /* ---- written explanation with a self-check rubric -------------------------------------------------- */
  // v4 (pedagogy brief item 7): the minimum is WORDS, the model answer stays hidden until the student submits, at least one
  // rubric tick must be backed by one of the student's own words ("which of my words shows it?"), and the writing is kept on
  // this device (state.notes) with a share flag (state.wr[id].share) that only the explicit "Copy my results" consent turns on.
  const P = () => W.StudioPedagogy;
  const modelHtml = (/** @type {any} */ it) =>
    `<div class="wr-model"><p><strong>Compare your answer with this model.${es("Compara tu respuesta con este modelo.")}</strong> ${tx(it.x)}${txEs(it.xEs)}</p></div>`;
  const wrSaved = (/** @type {any} */ it) =>
    `<strong>Saved.</strong> Great work explaining your thinking.${es("Guardado. Buen trabajo al explicar tu razonamiento.")} ${modelHtml(it)}`;
  const wrRec = (/** @type {any} */ ctx) => {
    const all = (ctx.state.wr = ctx.state.wr || {});
    const rec = (all[ctx.it.id] = all[ctx.it.id] || { ev: {}, share: false });
    rec.ev = rec.ev || {};
    return rec;
  };
  const evidenceRow = (
    /** @type {any} */ ctx,
    /** @type {number} */ i,
    /** @type {boolean} */ lock,
  ) => {
    const it = ctx.it;
    if (!(ctx.state.rubric[it.id] || [])[i]) return "";
    const words = P()?.evidenceWords(ctx.state.notes[it.id], it.kw) || [];
    if (!words.length) return "";
    const pick = wrRec(ctx).ev[i];
    return `<div class="wr-ev" role="group" aria-label="Which of my words shows it?"><span class="item-sub">Which of my words shows it?${es("¿Cuál de mis palabras lo muestra?")}</span> ${words
      .map(
        (/** @type {string} */ w) =>
          `<button type="button" class="btn btn-sm conf-btn" data-ev="${i}" data-w="${esc(w)}" aria-pressed="${pick === w}"${lock ? " disabled" : ""}>${esc(w)}</button>`,
      )
      .join(" ")}</div>`;
  };
  const review = (/** @type {any} */ ctx, /** @type {boolean} */ lock) => {
    const it = ctx.it;
    const text = String(ctx.state.notes[it.id] || "").toLowerCase();
    const ticks = ctx.state.rubric[it.id] || [];
    // an idea written in Spanish (or in both languages) counts: the word is looked for in either list
    const kw = (it.kw || []).map((/** @type {string} */ k, /** @type {number} */ i) => {
      const alt = String((it.kwEs || [])[i] || "").toLowerCase();
      const hit = text.includes(String(k).toLowerCase()) || (alt && text.includes(alt));
      return `${hit ? "✓" : "○"} ${esc(k)}${alt && alt !== String(k).toLowerCase() ? ` <span class="es-text" lang="es">/ ${esc((it.kwEs || [])[i])}</span>` : ""}`;
    });
    const rows = (it.rubric || [])
      .map(
        (/** @type {string} */ r, /** @type {number} */ i) =>
          `<li><label><input type="checkbox" data-rubric="${i}"${ticks[i] ? " checked" : ""}${lock ? " disabled" : ""}> ${esc(r)}${es((it.rubricEs || [])[i])}</label>${evidenceRow(ctx, i, lock)}</li>`,
      )
      .join("");
    const share = wrRec(ctx).share;
    return `<div class="wr-review">
      ${kw.length ? `<p class="item-sub">Words to look for in your answer: ${kw.join(" · ")}${es("Palabras que debes buscar en tu respuesta (en español o inglés).")}</p>` : ""}
      <p class="item-sub"><strong>Check yourself.${es("Revísate.")}</strong> Tick what your answer really did, then pick one of your own words that shows it:${es("Marca lo que tu respuesta realmente hizo y elige una de tus palabras que lo muestra:")}</p><ul class="rubric-list">${rows}</ul>
      ${
        lock
          ? ""
          : `<p class="item-sub wr-consent"><label><input type="checkbox" data-share${share ? " checked" : ""}> Include my writing when I tap "Copy my results". It stays on this device until I copy it.${es('Incluir mi escritura cuando toque "Copiar mis resultados". Se queda en este dispositivo hasta que la copie.')}</label></p>
      <div class="item-actions"><button type="button" class="btn btn-go btn-sm" data-rubric-done>I checked my answer${es("Revisé mi respuesta")}</button></div>`
      }</div>`;
  };
  K.wr = {
    mount(/** @type {any} */ ctx) {
      const it = ctx.it;
      const text = ctx.state.notes[it.id] || "";
      // The Foundational pathway asks for a shorter piece of writing: the idea matters more than the length.
      const min = P()
        ? P().minWords(it, !!W.EWLChrome?.pathway?.scaffold)
        : Math.max(8, Math.round((it.min || 40) / 6));
      const count = (/** @type {string} */ t) =>
        P() ? P().wordCount(t) : t.trim().split(/\s+/).filter(Boolean).length;
      const reviewed = ctx.solved || ctx.state.rubric[it.id] !== undefined;
      ctx.host.innerHTML = `${viz(it)}<p class="item-q">${stem(it.p, it.pEs)}</p>
        ${it.fr ? `<p class="item-sub frame-line" data-frame><strong>Sentence frame:${es("Marco de oración:")}</strong> ${esc(it.fr)}${es(it.frEs)}</p>` : ""}
        <p class="item-sub">You can write in English, Spanish, or both.${es("Puedes escribir en inglés, en español o en ambos.")}</p>
        <label class="write-label" for="wr-${esc(it.id)}">Your explanation${es("Tu explicación")}</label>
        <textarea id="wr-${esc(it.id)}" class="write-box" rows="5" data-write${reviewed ? " readonly" : ""}>${esc(text)}</textarea>
        <p class="item-sub" data-count>${count(text)} of ${min} words${es(`${count(text)} de ${min} palabras`)}</p>
        ${reviewed ? "" : `<div class="item-actions"><button type="button" class="btn btn-primary btn-sm" data-check-write>Check my thinking${es("Revisar mi razonamiento")}</button></div>`}
        <div data-review>${reviewed && !ctx.solved ? review(ctx, false) : ""}</div>
        ${ctx.hintBlock()}<div class="item-fb feedback-box" role="status"></div>`;
      const box = /** @type {HTMLTextAreaElement} */ (ctx.host.querySelector("[data-write]"));
      const slot = () => /** @type {HTMLElement} */ (ctx.host.querySelector("[data-review]"));
      const redraw = () => {
        slot().innerHTML = review(ctx, false);
        wire();
      };
      const wire = () => {
        for (const cb of /** @type {HTMLInputElement[]} */ ([
          ...ctx.host.querySelectorAll("[data-rubric]"),
        ]))
          cb.addEventListener("change", () => {
            const arr = ctx.state.rubric[it.id] || [];
            arr[Number(cb.dataset.rubric)] = cb.checked;
            ctx.state.rubric[it.id] = arr;
            if (!cb.checked) delete wrRec(ctx).ev[Number(cb.dataset.rubric)];
            ctx.save();
            redraw();
            /** @type {HTMLElement|null} */ (
              ctx.host.querySelector(`[data-rubric="${cb.dataset.rubric}"]`)
            )?.focus();
          });
        for (const b of /** @type {HTMLElement[]} */ ([...ctx.host.querySelectorAll("[data-ev]")]))
          b.addEventListener("click", () => {
            wrRec(ctx).ev[Number(b.dataset.ev)] = b.dataset.w;
            ctx.save();
            redraw();
            /** @type {HTMLElement|null} */ (
              ctx.host.querySelector(`[data-ev="${b.dataset.ev}"][aria-pressed="true"]`)
            )?.focus();
          });
        ctx.host.querySelector("[data-share]")?.addEventListener("change", (e) => {
          wrRec(ctx).share = /** @type {HTMLInputElement} */ (e.target).checked;
          ctx.save();
        });
        ctx.host.querySelector("[data-rubric-done]")?.addEventListener("click", () => {
          const rec = wrRec(ctx);
          const ticks = ctx.state.rubric[it.id] || [];
          if (!ticks.some((/** @type {boolean} */ t, /** @type {number} */ i) => t && rec.ev[i])) {
            ctx.fb(
              "warn",
              `<strong>One more step.</strong> Tick one thing your answer really did, then pick one of your own words that shows it.${es("Un paso más: marca algo que tu respuesta realmente hizo y elige una de tus palabras que lo muestra.")}`,
            );
            return;
          }
          rec.words = count(box.value);
          rec.at = Date.now();
          for (const cb of ctx.host.querySelectorAll("[data-rubric],[data-ev],[data-share]"))
            cb.setAttribute("disabled", "");
          ctx.host.querySelector("[data-rubric-done]")?.remove();
          ctx.solve(wrSaved(it));
        });
      };
      if (ctx.solved) return ctx.showSolved(wrSaved(it));
      if (reviewed) wire();
      box.addEventListener("input", () => {
        ctx.state.notes[it.id] = box.value;
        const c = ctx.host.querySelector("[data-count]");
        if (c)
          c.innerHTML = `${count(box.value)} of ${min} words${es(`${count(box.value)} de ${min} palabras`)}`;
        ctx.save();
      });
      ctx.host.querySelector("[data-check-write]")?.addEventListener("click", () => {
        if (count(box.value) < min) {
          ctx.fb(
            "warn",
            `<strong>Keep going.</strong> Write at least ${min} words, using your own words and the numbers from the problem.${es(`Sigue escribiendo: escribe al menos ${min} palabras, con tus propias palabras y los números del problema.`)}`,
          );
          return;
        }
        ctx.state.rubric[it.id] = ctx.state.rubric[it.id] || [];
        box.setAttribute("readonly", "");
        ctx.host.querySelector("[data-check-write]")?.remove();
        redraw();
        ctx.save();
      });
    },
  };
})();
