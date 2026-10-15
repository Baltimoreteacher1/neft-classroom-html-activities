/**
 * Practice Studio v2 — the hands-on item kinds: sort into groups, match pairs, place a point on a number
 * line, and the activity host that mounts a StudioAct widget. Same ctx contract as kinds-basic.js.
 *
 * Everything works by tap/click + keyboard (no drag required): tap a card, then tap where it goes.
 */
(() => {
  const W = /** @type {any} */ (window);
  const RT = (W.StudioRT = W.StudioRT || {});
  const K = (RT.kinds = RT.kinds || {});
  const U = () => RT.util;
  const esc = (/** @type {any} */ s) => U().esc(s);
  const es = (/** @type {any} */ s) => U().es(s);
  const nowrap = (/** @type {number} */ n) => String(Math.round(n * 1000) / 1000);

  /* ---- sort: tap a card, then tap its group -------------------------------------------------- */
  K.sort = {
    mount(/** @type {any} */ ctx) {
      const it = ctx.it;
      const st = ctx.state;
      /** card index -> bin index */
      const placed = (st.sorts[it.id] = ctx.solved
        ? Object.fromEntries(
            it.cards.map((/** @type {any} */ c, /** @type {number} */ i) => [i, c.b]),
          )
        : st.sorts[it.id] || {});
      /** @type {number[]} */
      const locked = ctx.solved
        ? it.cards.map((/** @type {any} */ _c, /** @type {number} */ i) => i)
        : st.ticks[it.id] || [];
      /** @type {number | null} */
      let sel = null;

      const cardBtn = (/** @type {number} */ i, /** @type {string} */ cls) => {
        const c = it.cards[i];
        return `<button type="button" class="sort-card ${cls}${sel === i ? " selected" : ""}" data-card="${i}"${locked.includes(i) ? " disabled" : ""} aria-pressed="${sel === i}"><span>${esc(c.t)}${es(c.tEs)}</span></button>`;
      };
      const draw = () => {
        const pool = it.cards
          .map((/** @type {any} */ _c, /** @type {number} */ i) => i)
          .filter((/** @type {number} */ i) => placed[i] === undefined);
        const bins = it.bins
          .map(
            (
              /** @type {any} */ b,
              /** @type {number} */ bi,
            ) => `<div class="sort-bin" role="group" aria-label="${esc(b.l)}">
              <button type="button" class="sort-bin-btn" data-bin="${bi}"${ctx.solved ? " disabled" : ""}><strong>${esc(b.l)}</strong>${es(b.lEs)}<small>${sel === null ? "Tap a card first" : "Put it here"}</small></button>
              <div class="sort-drop">${it.cards
                .map((/** @type {any} */ _c, /** @type {number} */ i) => i)
                .filter((/** @type {number} */ i) => placed[i] === bi)
                .map((/** @type {number} */ i) =>
                  cardBtn(i, `placed${locked.includes(i) ? " locked" : ""}`),
                )
                .join("")}</div></div>`,
          )
          .join("");
        ctx.host.innerHTML = `${U().viz(it)}<p class="item-q">${esc(it.q)}${es(it.qEs)}</p>
          <p class="item-sub">Tap a card, then tap the group where it belongs. Tap a card in a group to take it back.${es("Toca una tarjeta y luego el grupo donde va. Toca una tarjeta de un grupo para sacarla.")}</p>
          <div class="answer-zone"><div class="sort-pool" aria-label="Cards to sort">${pool.map((/** @type {number} */ i) => cardBtn(i, "")).join("") || '<p class="item-sub">All cards are placed.</p>'}</div>
          <div class="sort-bins" style="--bins:${it.bins.length}">${bins}</div>
          ${ctx.solved || Object.keys(placed).length < it.cards.length ? "" : '<div class="item-actions"><button type="button" class="btn btn-primary btn-sm" data-check-sort>Check my sorting</button></div>'}</div>
          ${ctx.hintBlock()}<div class="item-fb feedback-box" role="status"></div>`;
        if (ctx.solved) return ctx.showSolved(`<strong>Sorted.</strong> ${esc(it.x)}${es(it.xEs)}`);
        wire();
      };
      const wire = () => {
        for (const btn of /** @type {HTMLElement[]} */ ([
          ...ctx.host.querySelectorAll("[data-card]"),
        ]))
          btn.addEventListener("click", () => {
            const i = Number(btn.dataset.card);
            if (placed[i] !== undefined) {
              delete placed[i];
              sel = i;
            } else sel = sel === i ? null : i;
            st.sorts[it.id] = placed;
            ctx.save();
            draw();
            ctx.say(
              sel === null ? "Card put down" : `Selected ${it.cards[sel].t}. Choose a group.`,
            );
          });
        for (const btn of /** @type {HTMLElement[]} */ ([
          ...ctx.host.querySelectorAll("[data-bin]"),
        ]))
          btn.addEventListener("click", () => {
            if (sel === null) return;
            placed[sel] = Number(btn.dataset.bin);
            sel = null;
            st.sorts[it.id] = placed;
            ctx.save();
            draw();
          });
        ctx.host.querySelector("[data-check-sort]")?.addEventListener("click", () => {
          const wrong = it.cards
            .map((/** @type {any} */ c, /** @type {number} */ i) => (placed[i] === c.b ? -1 : i))
            .filter((/** @type {number} */ i) => i >= 0);
          for (let i = 0; i < it.cards.length; i++)
            if (!wrong.includes(i) && !locked.includes(i)) locked.push(i);
          st.ticks[it.id] = locked;
          if (!wrong.length) {
            draw();
            return ctx.solve(`<strong>Sorted.</strong> ${esc(it.x)}${es(it.xEs)}`);
          }
          for (const i of wrong) delete placed[i];
          st.sorts[it.id] = placed;
          draw();
          ctx.miss({
            tag: "sort-misplaced",
            kind: "warn",
            say: `${wrong.length} card${wrong.length > 1 ? "s were" : " was"} in the wrong group and went back. Look at what the cards in each group have in common.`,
            noLead: true,
          });
        });
      };
      draw();
    },
  };

  /* ---- match: tap a left item, then its partner ----------------------------------------------- */
  K.match = {
    mount(/** @type {any} */ ctx) {
      const it = ctx.it;
      const st = ctx.state;
      const n = it.pairs.length;
      const order = W.StudioGen.rng(`match|${it.id}`).shuffle(
        it.pairs.map((/** @type {any} */ _p, /** @type {number} */ i) => i),
      );
      /** left index -> right index (original index) */
      const made = (st.matches[it.id] = ctx.solved
        ? Object.fromEntries(
            it.pairs.map((/** @type {any} */ _p, /** @type {number} */ i) => [i, i]),
          )
        : st.matches[it.id] || {});
      /** @type {number[]} */
      const locked = ctx.solved
        ? it.pairs.map((/** @type {any} */ _p, /** @type {number} */ i) => i)
        : st.ticks[it.id] || [];
      /** @type {{side: "l"|"r", i: number} | null} */
      let sel = null;
      const badge = (/** @type {number} */ left) => {
        const keys = Object.keys(made).map(Number);
        const k = keys.indexOf(left);
        return k < 0 ? "" : `<b class="pair-badge">${k + 1}</b>`;
      };
      const draw = () => {
        const L = it.pairs
          .map(
            (/** @type {any} */ p, /** @type {number} */ i) =>
              `<button type="button" class="match-item${made[i] !== undefined ? " paired" : ""}${sel?.side === "l" && sel.i === i ? " selected" : ""}${locked.includes(i) ? " locked" : ""}" data-l="${i}"${locked.includes(i) ? " disabled" : ""}>${badge(i)}<span>${esc(p.l)}${es(p.lEs)}</span></button>`,
          )
          .join("");
        const R = order
          .map((/** @type {number} */ j) => {
            const left = Object.keys(made)
              .map(Number)
              .find((/** @type {number} */ l) => made[l] === j);
            return `<button type="button" class="match-item${left !== undefined ? " paired" : ""}${sel?.side === "r" && sel.i === j ? " selected" : ""}${left !== undefined && locked.includes(left) ? " locked" : ""}" data-r="${j}"${left !== undefined && locked.includes(left) ? " disabled" : ""}>${left !== undefined ? badge(left) : ""}<span>${esc(it.pairs[j].r)}${es(it.pairs[j].rEs)}</span></button>`;
          })
          .join("");
        ctx.host.innerHTML = `${U().viz(it)}<p class="item-q">${esc(it.q)}${es(it.qEs)}</p>
          <p class="item-sub">Tap one item on the left, then the item on the right that goes with it. Matching pairs get the same number.${es("Toca un elemento de la izquierda y luego el de la derecha que le corresponde. Las parejas llevan el mismo número.")}</p>
          <div class="answer-zone"><div class="match-board"><div class="match-col" aria-label="Left side">${L}</div><div class="match-col" aria-label="Right side">${R}</div></div>
          ${ctx.solved || Object.keys(made).length < n ? "" : '<div class="item-actions"><button type="button" class="btn btn-primary btn-sm" data-check-match>Check my matches</button></div>'}</div>
          ${ctx.hintBlock()}<div class="item-fb feedback-box" role="status"></div>`;
        if (ctx.solved)
          return ctx.showSolved(`<strong>All matched.</strong> ${esc(it.x)}${es(it.xEs)}`);
        wire();
      };
      const pair = (/** @type {number} */ l, /** @type {number} */ r) => {
        for (const k of Object.keys(made)) if (Number(k) === l || made[k] === r) delete made[k];
        made[l] = r;
        sel = null;
        st.matches[it.id] = made;
        ctx.save();
        draw();
      };
      const wire = () => {
        for (const btn of /** @type {HTMLElement[]} */ ([
          ...ctx.host.querySelectorAll("[data-l],[data-r]"),
        ]))
          btn.addEventListener("click", () => {
            const side = btn.dataset.l !== undefined ? "l" : "r";
            const i = Number(side === "l" ? btn.dataset.l : btn.dataset.r);
            if (sel && sel.side !== side) return side === "r" ? pair(sel.i, i) : pair(i, sel.i);
            // tapping an already-paired item unpairs it
            const owner =
              side === "l"
                ? made[i] !== undefined
                  ? i
                  : undefined
                : Object.keys(made)
                    .map(Number)
                    .find((/** @type {number} */ l) => made[l] === i);
            if (owner !== undefined && !sel) {
              delete made[owner];
              st.matches[it.id] = made;
              ctx.save();
            }
            sel = sel && sel.side === side && sel.i === i ? null : { side, i };
            draw();
          });
        ctx.host.querySelector("[data-check-match]")?.addEventListener("click", () => {
          const wrong = Object.keys(made)
            .map(Number)
            .filter((/** @type {number} */ l) => made[l] !== l);
          for (const l of Object.keys(made).map(Number))
            if (!wrong.includes(l) && !locked.includes(l)) locked.push(l);
          st.ticks[it.id] = locked;
          if (!wrong.length) {
            draw();
            return ctx.solve(`<strong>All matched.</strong> ${esc(it.x)}${es(it.xEs)}`);
          }
          for (const l of wrong) delete made[l];
          st.matches[it.id] = made;
          draw();
          ctx.miss({
            tag: "match-wrong-pair",
            kind: "warn",
            say: `${wrong.length} pair${wrong.length > 1 ? "s do" : " does"} not belong together and ${wrong.length > 1 ? "were" : "was"} unmatched. Keep the good pairs and try the others again.`,
            noLead: true,
          });
        });
      };
      draw();
    },
  };

  /* ---- number line: slide a point to the right place ----------------------------------------- */
  K.nline = {
    mount(/** @type {any} */ ctx) {
      const it = ctx.it;
      const st = ctx.state;
      const span = it.max - it.min;
      const X = (/** @type {number} */ v) => 30 + ((v - it.min) / span) * 540;
      const every = Math.max(1, Math.ceil(span / it.step / 10));
      const ticks = [];
      for (let k = 0, v = it.min; v <= it.max + 1e-9; k++, v = it.min + k * it.step)
        ticks.push(
          `<line x1="${X(v)}" x2="${X(v)}" y1="${k % every === 0 ? 40 : 46}" y2="62" stroke="var(--ink-light,#566475)" stroke-width="2"/>${k % every === 0 || Math.abs(v - it.max) < 1e-9 ? `<text x="${X(v)}" y="82" text-anchor="middle" font-size="15" font-weight="700" fill="var(--ink,#1B2733)">${nowrap(v).replace("-", "−")}</text>` : ""}`,
        );
      const have = ctx.solved ? it.a : st.lines[it.id];
      const val = have === undefined ? (it.min + it.max) / 2 : have;
      ctx.host.innerHTML = `${U().viz(it)}<p class="item-q">${esc(it.q)}${es(it.qEs)}</p>
        <div class="answer-zone"><div class="nline-wrap"><svg viewBox="0 0 600 96" width="100%" role="img" aria-label="Number line from ${nowrap(it.min)} to ${nowrap(it.max)}" style="max-width:640px;height:auto"><line x1="24" x2="576" y1="62" y2="62" stroke="var(--ink,#1B2733)" stroke-width="3" stroke-linecap="round"/>${ticks.join("")}
          <g class="nline-pt" ${have === undefined ? 'style="display:none"' : ""}><circle cx="${X(val)}" cy="30" r="12" fill="var(--sun,#F0BD4F)" stroke="var(--brand-dark,#1B2C3F)" stroke-width="3"/><line x1="${X(val)}" x2="${X(val)}" y1="42" y2="62" stroke="var(--brand-dark,#1B2C3F)" stroke-width="3"/></g></svg>
          <label class="sr-only" for="nl-${esc(it.id)}">Point position</label>
          <input class="nline-range" id="nl-${esc(it.id)}" type="range" min="${it.min}" max="${it.max}" step="${it.step}" value="${val}"${ctx.solved ? " disabled" : ""} aria-valuetext="${nowrap(val)}">
          <p class="item-sub nline-read">${have === undefined ? "Slide the point, then check." : `Your point: <strong>${nowrap(val).replace("-", "−")}</strong>`}</p>
          ${ctx.solved ? "" : '<div class="item-actions"><button type="button" class="btn btn-primary btn-sm" data-check-line>Check my point</button></div>'}</div></div>
        ${ctx.hintBlock()}<div class="item-fb feedback-box" role="status"></div>`;
      if (ctx.solved)
        return ctx.showSolved(`<strong>That is the spot.</strong> ${esc(it.x)}${es(it.xEs)}`);
      const range = /** @type {HTMLInputElement} */ (ctx.host.querySelector(".nline-range"));
      const pt = /** @type {SVGGElement} */ (ctx.host.querySelector(".nline-pt"));
      const read = /** @type {HTMLElement} */ (ctx.host.querySelector(".nline-read"));
      const move = () => {
        const v = Number(range.value);
        st.lines[it.id] = v;
        pt.style.display = "";
        const x = X(v);
        pt.querySelector("circle")?.setAttribute("cx", String(x));
        for (const l of pt.querySelectorAll("line")) {
          l.setAttribute("x1", String(x));
          l.setAttribute("x2", String(x));
        }
        range.setAttribute("aria-valuetext", nowrap(v));
        read.innerHTML = `Your point: <strong>${nowrap(v).replace("-", "−")}</strong>`;
        ctx.save();
      };
      range.addEventListener("input", move);
      ctx.host.querySelector("[data-check-line]")?.addEventListener("click", () => {
        if (st.lines[it.id] === undefined) move();
        const v = st.lines[it.id];
        if (Math.abs(v - it.a) <= (Number.isFinite(it.tol) ? it.tol : 1e-9)) {
          range.setAttribute("disabled", "");
          ctx.host.querySelector("[data-check-line]")?.remove();
          ctx.solve(`<strong>That is the spot.</strong> ${esc(it.x)}${es(it.xEs)}`);
        } else {
          const side =
            ctx.misses() >= 1
              ? ` Your point is a little too far ${v > it.a ? "right" : "left"}.`
              : "";
          ctx.miss({
            tag: "number-line-position",
            say: `Not quite. Check your point against the labelled numbers on either side of it.${side}`,
            sayEs: "Todavía no. Compara tu punto con los números marcados a cada lado.",
          });
        }
      });
    },
  };

  /* ---- act: a StudioAct widget ------------------------------------------------------------------ */
  K.act = {
    mount(/** @type {any} */ ctx) {
      const it = ctx.it;
      const def = W.StudioAct.registry[it.kind];
      ctx.host.innerHTML = `<p class="item-q">${esc(it.q)}${es(it.qEs)}</p>
        <div class="answer-zone"><div class="act-host" data-act="${esc(it.kind)}"></div></div>
        ${ctx.hintBlock()}<div class="item-fb feedback-box" role="status"></div>`;
      const host = /** @type {HTMLElement} */ (ctx.host.querySelector(".act-host"));
      const finish = (/** @type {any} */ state) => {
        ctx.state.acts[it.id] = state;
        host.innerHTML = "";
        def.mount(host, it, {
          restore: state,
          solved: true,
          es: () => ctx.es(),
          say: ctx.say,
          hint() {},
          change() {},
          submit() {},
        });
      };
      const explain = () => `<strong>Built it.</strong> ${esc(it.x)}${es(it.xEs)}`;
      if (ctx.solved) {
        finish(ctx.state.acts[it.id] ?? def.solution(it));
        return ctx.showSolved(explain());
      }
      def.mount(host, it, {
        restore: ctx.state.acts[it.id] ?? null,
        solved: false,
        es: () => ctx.es(),
        say: ctx.say,
        hint: () => ctx.openHint(),
        change(/** @type {any} */ s) {
          ctx.state.acts[it.id] = s;
          ctx.save();
        },
        submit(/** @type {any} */ s) {
          const g = W.StudioAct.grade(it, s);
          if (g.ok) {
            finish(s);
            ctx.solve(explain());
          } else
            ctx.miss({
              tag: g.tag || `${it.kind}-miss`,
              say: g.say,
              sayEs: g.sayEs,
            });
        },
      });
    },
  };
})();
