/**
 * Practice Studio contrasting cases (RT.kinds.contrast). Contract: docs/audits/studio-v4/brief-x-pedagogy.md, item 3.
 *
 * Two worked solutions to ONE problem sit side by side with their verdicts hidden. The student first says what stayed the same and
 * what changed between them (three chips each). Then the verdicts open.
 *
 *   kind "trap"     one solution is right and one falls into a named trap. Graded: a wrong chip names what to look at again
 *                   (the item's own feedback line) and never says which solution is right; two misses close the item like any other.
 *   kind "methods"  two valid methods. Not graded: any chip is accepted, then "See what each method says" opens the verdicts.
 *
 * Item shape (authored in data/practice-studio/pedagogy-layer.json, validated by contrastProblems()):
 *   { k: "contrast", id, kind, trap?, q, qEs,
 *     solA: { steps: [..], stepsEs: [..], verdict, verdictEs }, solB: { same shape },
 *     same: { chips: [3 x { t, tEs }], ok, f: [3], fEs: [3] },     diff: { same shape },
 *     x, xEs, h: [2-3], hEs }
 */
(() => {
  const W = /** @type {any} */ (window);
  const RT = (W.StudioRT = W.StudioRT || {});
  const K = (RT.kinds = RT.kinds || {});
  const U = () => RT.util;

  const CSS = `
.ct-cols{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,17rem),1fr));gap:.75rem;margin:.5rem 0}
.ct-col{border:2px solid var(--brand,#1b2c3f);border-radius:12px;padding:.6rem .8rem}
.ct-col h4{margin:0 0 .3rem}
.ct-steps{margin:.2rem 0 .4rem 1.1rem;padding:0}
.ct-verdict{margin:.4rem 0 0;padding-top:.4rem;border-top:1px dashed currentColor}
.ct-q{margin:.6rem 0 .2rem;font-weight:600}
.ct-chips{display:flex;flex-direction:column;gap:.4rem;margin-bottom:.4rem}
.ct-chips .btn{text-align:left;white-space:normal;height:auto;min-height:44px}
.ct-chips .btn.correct{outline:3px solid var(--ok,#1c7c3c);outline-offset:2px}
.ct-chips .btn[aria-pressed="true"]{outline:3px solid var(--brand,#1b2c3f);outline-offset:2px}
@media (forced-colors:active){.ct-col{border-color:CanvasText}.ct-chips .btn[aria-pressed="true"]{outline-color:Highlight}}
`;

  /** @param {any} it */
  const summary = (it) =>
    `<strong>Now you can compare them.${U().es("Ahora puedes compararlas.")}</strong> ${U().tx(it.x)}${U().txEs(it.xEs)}`;

  K.contrast = {
    mount(/** @type {any} */ ctx) {
      W.StudioPedagogy?.css("contrast", CSS);
      const it = ctx.it;
      const { esc, es, tx, txEs, stem, viz } = U();
      const graded = it.kind === "trap";
      const picks = (ctx.state.picks[it.id] = ctx.solved
        ? { s: it.same.ok, d: it.diff.ok, done: true }
        : ctx.state.picks[it.id] || { s: null, d: null });
      const open = () => !!picks.done;
      const col = (
        /** @type {any} */ side,
        /** @type {string} */ label,
        /** @type {string} */ labelEs,
      ) => {
        const steps = side.steps
          .map(
            (/** @type {string} */ s, /** @type {number} */ i) =>
              `<li>${tx(s)}${txEs((side.stepsEs || [])[i])}</li>`,
          )
          .join("");
        const verdict = open()
          ? `<p class="ct-verdict"><strong>${esc(label)}:</strong> ${tx(side.verdict)}${txEs(side.verdictEs)}</p>`
          : `<p class="item-sub ct-hidden">What does it say about this solution? Decide what you notice first.${es("¿Qué dice sobre esta solución? Primero decide qué notas.")}</p>`;
        return `<section class="ct-col" aria-label="${esc(label)}"><h4>${esc(label)}${es(labelEs)}</h4><ol class="ct-steps">${steps}</ol>${verdict}</section>`;
      };
      const row = (
        /** @type {"s"|"d"} */ key,
        /** @type {any} */ spec,
        /** @type {string} */ en,
        /** @type {string} */ sp,
      ) => {
        const lock = open() || (graded && picks[key] !== null);
        const chips = spec.chips
          .map((/** @type {any} */ c, /** @type {number} */ i) => {
            const on = picks[key] === i;
            const cls = graded && on && i === spec.ok ? " correct" : "";
            return `<button type="button" class="btn btn-sm conf-btn${cls}" data-ct="${key}" data-i="${i}" aria-pressed="${on}"${lock ? " disabled" : ""}>${esc(c.t)}${es(c.tEs)}</button>`;
          })
          .join("");
        return `<p class="ct-q" id="ct-${key}-${esc(it.id)}">${esc(en)}${es(sp)}</p><div class="ct-chips" role="group" aria-labelledby="ct-${key}-${esc(it.id)}">${chips}</div>`;
      };
      const draw = () => {
        const both = picks.s !== null && picks.d !== null;
        ctx.host.innerHTML = `${viz(it)}<p class="item-q">${stem(it.q, it.qEs)}</p>
          <p class="item-sub">Two students solved this. Study both solutions, then say what you notice.${es("Dos estudiantes resolvieron esto. Estudia las dos soluciones y di qué notas.")}</p>
          <div class="ct-cols">${col(it.solA, "Solution A", "Solución A")}${col(it.solB, "Solution B", "Solución B")}</div>
          <div class="answer-zone">${row("s", it.same, "What stayed the same in both solutions?", "¿Qué fue igual en las dos soluciones?")}${row("d", it.diff, "What changed between them?", "¿Qué cambió entre las dos?")}
          ${!graded && both && !open() ? `<div class="item-actions"><button type="button" class="btn btn-go btn-sm" data-ct-open>See what each method says${es("Ver qué dice cada método")}</button></div>` : ""}</div>
          ${ctx.hintBlock()}<div class="item-fb feedback-box" role="status"></div>`;
        if (ctx.solved) return ctx.showSolved(summary(it));
        wire();
      };
      const finish = () => {
        picks.done = true;
        ctx.save();
        draw();
        ctx.solve(summary(it));
      };
      const wire = () => {
        for (const b of /** @type {HTMLElement[]} */ ([...ctx.host.querySelectorAll("[data-ct]")]))
          b.addEventListener("click", () => {
            const key = /** @type {"s"|"d"} */ (b.dataset.ct);
            const i = Number(b.dataset.i);
            const spec = key === "s" ? it.same : it.diff;
            if (!graded) {
              picks[key] = i;
              ctx.save();
              draw();
              return;
            }
            if (i === spec.ok) {
              picks[key] = i;
              ctx.save();
              if (picks.s !== null && picks.d !== null) return finish();
              draw();
              ctx.fb(
                "ok",
                `<strong>Yes, that is what you can see.</strong> Now answer the other question.${es("Sí, eso es lo que se ve. Ahora responde la otra pregunta.")}`,
              );
              return;
            }
            b.classList.add("wrong");
            ctx.miss({
              tag: it.trap || undefined,
              say: spec.chips[i].f,
              sayEs: spec.chips[i].fEs,
              kind: "warn",
              noLead: true,
              wrongText: spec.chips[i].t,
            });
          });
        ctx.host.querySelector("[data-ct-open]")?.addEventListener("click", finish);
      };
      draw();
    },
  };
})();
