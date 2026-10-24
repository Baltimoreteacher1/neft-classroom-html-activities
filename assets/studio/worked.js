/**
 * Practice Studio worked examples with fading (window.StudioWorked). Contract: docs/specs/studio-v3-w3.md, W3b.
 *
 * A generated item already carries a computed answer, a three-step hint ladder that never states the answer, and a full
 * explanation (English and Spanish). A worked example is a FRESH problem on the same skill, never the student's own, shown as
 * the question, the ladder as numbered steps, and the explanation with the answer. Fading: study the example, then try a fresh
 * one with step 1 already open, then the student's own problem. Offered first to a skill the student has barely met; always
 * there as a tool. Nothing here is timed, graded or counted as progress.
 */
(() => {
  const W = /** @type {any} */ (window);
  const RT = (W.StudioRT = W.StudioRT || {});
  const { esc, es, tx, txEs, stem, viz } = RT.util;
  /** @type {any} */
  let rt = null;
  let serial = 0;
  /** Skills whose example the student has opened this visit, so the offer does not nag. */
  const seenExample = new Set();

  const $ = (/** @type {string} */ sel, /** @type {ParentNode} */ root = document) =>
    /** @type {any} */ (root.querySelector(sel));

  /** A fresh item of the same generator and level whose question differs from `it`'s. */
  function freshOf(/** @type {any} */ it) {
    for (let n = 0; n < 12; n++) {
      const seed = Math.floor(Math.random() * 90000) + 3000 + n;
      const ex = W.StudioGen.make(it.gen.id, it.gen.level, seed);
      if (ex.q !== it.q) return { ex, seed };
    }
    return null;
  }

  const answerOf = (/** @type {any} */ ex) =>
    ex.k === "mc"
      ? { en: ex.c[ex.a], es: ex.cEs?.[ex.a] || "" }
      : {
          en: `${ex.a}${ex.unit ? ` ${ex.unit}` : ""}`,
          es: `${ex.a}${ex.unitEs || ex.unit ? ` ${ex.unitEs || ex.unit}` : ""}`,
        };

  /** ?path=check (a teacher link): the example opens one step at a time, and the answer opens after the last step. */
  const chunked = () => !!W.StudioPedagogy?.checkPath;

  function card(/** @type {any} */ ex) {
    const chunk = chunked() && (ex.h || []).length > 1;
    const steps = (ex.h || [])
      .map(
        (/** @type {string} */ h, /** @type {number} */ i) =>
          `<li${chunk && i > 0 ? " hidden" : ""}>${tx(h)}${txEs(ex.hEs?.[i])}</li>`,
      )
      .join("");
    const ans = answerOf(ex);
    return `<section class="example-card" aria-label="Worked example">
      <h3 class="example-title">👀 Worked example${es("Ejemplo resuelto")} <span class="chip">Not your problem${es("No es tu problema")}</span></h3>
      <div class="example-q">${viz(ex)}<p class="item-q">${stem(ex.q, ex.qEs)}</p></div>
      <ol class="example-steps" aria-label="Steps">${steps}</ol>
      ${chunk ? `<p class="example-next"><button type="button" class="btn btn-sm" data-example-next>I followed this step. Show the next one →${es("Seguí este paso. Muestra el siguiente →")}</button></p>` : ""}
      <p class="example-answer"${chunk ? " hidden" : ""}><strong>Answer:${es("Respuesta:")}</strong> ${tx(ans.en)}${txEs(ans.es)}</p>
      <p class="example-why"${chunk ? " hidden" : ""}>${tx(ex.x)}${txEs(ex.xEs)}</p>
      <div class="example-actions"><button type="button" class="btn btn-go btn-sm" data-example-try>Now try one with step 1 shown →${es("Ahora prueba una con el paso 1 a la vista →")}</button><button type="button" class="btn btn-sm" data-example-close>Hide${es("Ocultar")}</button></div>
      <div class="example-try"></div>
    </section>`;
  }

  function open(/** @type {HTMLElement} */ stage) {
    const tab = Number(String(stage.id).replace("stage-", ""));
    const st = rt.api.state;
    const it = rt.api.expand(tab, st.idx[tab]);
    if (!it?.gen) return;
    $(".example-card", stage)?.remove();
    const f = freshOf(it);
    if (!f) return;
    seenExample.add(it.gen.id);
    $(".example-offer", stage)?.remove();
    const wrap = document.createElement("div");
    wrap.innerHTML = card(f.ex);
    const el = /** @type {HTMLElement} */ (wrap.firstElementChild);
    ($(".item-head", stage) || stage).after(el);
    $("[data-example-close]", el)?.addEventListener("click", () => el.remove());
    $("[data-example-next]", el)?.addEventListener("click", () => {
      const next = /** @type {HTMLElement|null} */ ($("ol.example-steps li[hidden]", el));
      if (next) {
        next.hidden = false;
        next.setAttribute("tabindex", "-1");
        next.focus();
      }
      if (!$("ol.example-steps li[hidden]", el)) {
        $(".example-next", el)?.remove();
        /** @type {HTMLElement} */ for (const n of el.querySelectorAll(
          ".example-answer, .example-why",
        ))
          n.hidden = false;
      }
    });
    $("[data-example-try]", el)?.addEventListener("click", () => tryOne(tab, st.idx[tab], it, el));
    W.StudioBus.emit("example", { lesson: rt.api.data.lesson, gen: it.gen.id });
  }

  /** Stage two of the fade: a fresh problem on the same skill with its first step already open. Never touches progress. */
  function tryOne(
    /** @type {number} */ tab,
    /** @type {number} */ idx,
    /** @type {any} */ it,
    /** @type {HTMLElement} */ el,
  ) {
    const host = $(".example-try", el);
    host.innerHTML = "";
    const fresh = {
      ...rt.api.expand(tab, idx, Math.floor(Math.random() * 90000) + 4000),
      id: `ex_${it.id}_${++serial}`,
    };
    const box = document.createElement("div");
    box.className = "stage-card example-try-stage";
    host.append(box);
    rt.api.mountItem({ tab, it: fresh, host: box, redeem: true });
    // ?path=check fades backward: every step but the last is open, so the student does the final step on their own
    const open = chunked() ? Math.max(1, ((fresh.h || []).length || 2) - 1) : 1;
    for (let k = 0; k < open; k++) $("[data-hint]", box)?.click();
  }

  /** The gentle offer above a generated item the student has barely met. */
  function decorate(
    /** @type {number} */ _tab,
    /** @type {any} */ it,
    /** @type {HTMLElement} */ host,
  ) {
    if (!it?.gen || !W.StudioLearner || seenExample.has(it.gen.id)) return;
    const rec = W.StudioLearner.get(W.StudioLearner.keyOf({ gen: it.gen.id }));
    if (rec && rec.seen >= 2) return;
    const stage = host.closest("[id^=stage-]");
    if (!stage || $(".example-offer", stage)) return;
    const offer = document.createElement("p");
    offer.className = "example-offer";
    offer.innerHTML = `New to this skill?${es("¿Nueva habilidad?")} <button type="button" class="btn btn-sm" data-example>👀 See a worked example first${es("Mira un ejemplo resuelto primero")}</button>`;
    host.before(offer);
  }

  W.StudioWorked = {
    init(/** @type {any} */ runtime) {
      rt = runtime;
      document.addEventListener("click", (e) => {
        const b = /** @type {HTMLElement|null} */ (
          /** @type {HTMLElement} */ (e.target).closest?.("[data-example]")
        );
        if (!b) return;
        const stage = /** @type {HTMLElement|null} */ (b.closest("[id^=stage-]"));
        if (stage) open(stage);
      });
    },
    decorate,
    open,
  };
  void esc;
})();
