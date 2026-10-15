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
  const viz = (/** @type {any} */ it) =>
    it.viz && W.StudioViz ? `<div class="viz-host">${W.StudioViz.render(it.viz)}</div>` : "";
  /** Number from "12", "$3.50", "3/4", "2 1/3", "−5", or "12 cm" (a trailing unit is ignored). */
  const value = (/** @type {any} */ raw) => {
    const lead = String(raw).match(/^\s*([−-]?\s*\$?[\d.,]+(?:\s+\d+\/\d+|\s*\/\s*\d+)?)/);
    return W.StudioGen.value(lead ? lead[1].replace(/\s*\/\s*/, "/") : String(raw));
  };
  const same = (/** @type {any} */ typed, /** @type {any} */ right, /** @type {number} */ tol) => {
    const a = value(typed);
    const b = value(right);
    return Number.isFinite(a) && Number.isFinite(b) && Math.abs(a - b) <= tol;
  };
  RT.util = { esc, es, viz, value, same };

  const done = (/** @type {any} */ it) =>
    `<strong>${esc(it.x ? "" : "")}</strong>${esc(it.x)}${es(it.xEs)}`;

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
          return `<button type="button" class="choice-btn ${cls}" data-mc="${i}"${ctx.solved ? " disabled" : ""}><span>${esc(c)}${es((it.cEs || [])[i])}</span></button>`;
        })
        .join("");
      ctx.host.innerHTML = `${viz(it)}<p class="item-q">${esc(it.q)}${es(it.qEs)}</p>
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
          }
        });
    },
  };

  /* ---- typed number --------------------------------------------------------------------------- */
  K.num = {
    mount(/** @type {any} */ ctx) {
      const it = ctx.it;
      const typed = ctx.solved ? it.a : (ctx.state.notes[it.id] ?? "");
      ctx.host.innerHTML = `${viz(it)}<p class="item-q">${esc(it.q)}${es(it.qEs)}</p>
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
    `<strong>Yes, that is the step.</strong> ${esc(it.fix)}${es(it.fixEs)} ${esc(it.x)}${es(it.xEs)}`;
  K.err = {
    mount(/** @type {any} */ ctx) {
      const it = ctx.it;
      const chosen = ctx.state.picks[it.id];
      const steps = it.s
        .map((/** @type {any} */ s, /** @type {number} */ i) => {
          const cls =
            ctx.solved && i === it.e ? "correct" : chosen === i && i !== it.e ? "wrong" : "";
          return `<li><button type="button" class="choice-btn err-step ${cls}" data-err="${i}"${ctx.solved ? " disabled" : ""}><span><strong>${esc(s.l)}</strong>: ${esc(s.w)}${s.wEs ? `<span class="es-text" lang="es">${esc(s.lEs || s.l)}: ${esc(s.wEs)}</span>` : ""}</span></button></li>`;
        })
        .join("");
      ctx.host.innerHTML = `${viz(it)}<p class="item-q">${esc(it.t)}${es(it.tEs)}</p>
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
      ctx.host.innerHTML = `${viz(it)}<p class="item-q">${esc(it.t)}${es(it.tEs)}</p>
        <div class="answer-zone"><div class="table-wrap"><table class="data-table"><thead><tr>${it.hd.map((/** @type {string} */ h, /** @type {number} */ i) => `<th scope="col">${esc(h)}${es((it.hdEs || [])[i])}</th>`).join("")}</tr></thead><tbody>${body}</tbody></table></div>
        ${ctx.solved ? "" : '<div class="item-actions"><button type="button" class="btn btn-primary btn-sm" data-check-table>Check my table</button></div>'}</div>
        ${ctx.hintBlock()}<div class="item-fb feedback-box" role="status"></div>`;
      if (ctx.solved)
        return ctx.showSolved(`<strong>Table complete.</strong> ${esc(it.x)}${es(it.xEs)}`);
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
          } else if (
            same(inp.value, want, 0.005) ||
            inp.value.trim().toLowerCase() === String(want).trim().toLowerCase()
          ) {
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
          ctx.solve(`<strong>Table complete.</strong> ${esc(it.x)}${es(it.xEs)}`);
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

  /* ---- written explanation with a self-check rubric ------------------------------------------- */
  const review = (/** @type {any} */ ctx, /** @type {boolean} */ lock) => {
    const it = ctx.it;
    const text = String(ctx.state.notes[it.id] || "").toLowerCase();
    const ticks = ctx.state.rubric[it.id] || [];
    const kw = (it.kw || []).map(
      (/** @type {string} */ k) =>
        `${text.includes(String(k).toLowerCase()) ? "✓" : "○"} ${esc(k)}`,
    );
    const rows = (it.rubric || [])
      .map(
        (/** @type {string} */ r, /** @type {number} */ i) =>
          `<li><label><input type="checkbox" data-rubric="${i}"${ticks[i] ? " checked" : ""}${lock ? " disabled" : ""}> ${esc(r)}</label></li>`,
      )
      .join("");
    return `<div class="wr-review"><p><strong>Compare your answer with this model.</strong> ${esc(it.x)}${es(it.xEs)}</p>
      ${kw.length ? `<p class="item-sub">Words to look for in your answer: ${kw.join(" · ")}</p>` : ""}
      <p class="item-sub"><strong>Check yourself.</strong> Tick what your answer really did:</p><ul class="rubric-list">${rows}</ul>
      ${lock ? "" : '<div class="item-actions"><button type="button" class="btn btn-go btn-sm" data-rubric-done>I checked my answer</button></div>'}</div>`;
  };
  K.wr = {
    mount(/** @type {any} */ ctx) {
      const it = ctx.it;
      const text = ctx.state.notes[it.id] || "";
      const reviewed = ctx.solved || ctx.state.rubric[it.id] !== undefined;
      ctx.host.innerHTML = `${viz(it)}<p class="item-q">${esc(it.p)}${es(it.pEs)}</p>
        ${it.fr ? `<p class="item-sub"><strong>Sentence frame:</strong> ${esc(it.fr)}</p>` : ""}
        <label class="write-label" for="wr-${esc(it.id)}">Your explanation</label>
        <textarea id="wr-${esc(it.id)}" class="write-box" rows="5" data-write${reviewed ? " readonly" : ""}>${esc(text)}</textarea>
        <p class="item-sub" data-count>${text.trim().length} of ${it.min} characters</p>
        ${reviewed ? "" : '<div class="item-actions"><button type="button" class="btn btn-primary btn-sm" data-check-write>Check my thinking</button></div>'}
        <div data-review>${reviewed ? review(ctx, ctx.solved) : ""}</div>
        ${ctx.hintBlock()}<div class="item-fb feedback-box" role="status"></div>`;
      const box = /** @type {HTMLTextAreaElement} */ (ctx.host.querySelector("[data-write]"));
      const wire = () => {
        for (const cb of /** @type {HTMLInputElement[]} */ ([
          ...ctx.host.querySelectorAll("[data-rubric]"),
        ]))
          cb.addEventListener("change", () => {
            const arr = ctx.state.rubric[it.id] || [];
            arr[Number(cb.dataset.rubric)] = cb.checked;
            ctx.state.rubric[it.id] = arr;
            ctx.save();
          });
        ctx.host.querySelector("[data-rubric-done]")?.addEventListener("click", () => {
          for (const cb of ctx.host.querySelectorAll("[data-rubric]"))
            cb.setAttribute("disabled", "");
          ctx.host.querySelector("[data-rubric-done]")?.remove();
          ctx.solve("<strong>Saved.</strong> Great work explaining your thinking.");
        });
      };
      if (ctx.solved)
        return ctx.showSolved("<strong>Saved.</strong> Great work explaining your thinking.");
      if (reviewed) wire();
      box.addEventListener("input", () => {
        ctx.state.notes[it.id] = box.value;
        const c = ctx.host.querySelector("[data-count]");
        if (c) c.textContent = `${box.value.trim().length} of ${it.min} characters`;
        ctx.save();
      });
      ctx.host.querySelector("[data-check-write]")?.addEventListener("click", () => {
        if (box.value.trim().length < it.min) {
          ctx.fb(
            "warn",
            `<strong>Keep going.</strong> Write at least ${it.min} characters, using your own words and the numbers from the problem.${es("Sigue escribiendo: usa tus propias palabras y los números del problema.")}`,
          );
          return;
        }
        ctx.state.rubric[it.id] = ctx.state.rubric[it.id] || [];
        box.setAttribute("readonly", "");
        ctx.host.querySelector("[data-check-write]")?.remove();
        const slot = /** @type {HTMLElement} */ (ctx.host.querySelector("[data-review]"));
        slot.innerHTML = review(ctx, false);
        wire();
        ctx.save();
      });
    },
  };
})();
