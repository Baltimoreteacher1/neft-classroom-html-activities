/**
 * Practice Studio inline repair (window.StudioRepair): when a generated item was solved only after a miss or a hint, offer
 * "Try a fresh one", the same skill on new numbers, mounted under the item with `redeem: true` so it never changes section
 * progress or stars. A clean answer is a Repair: the learner model counts it, `studio:repair` fires, and the original miss leaves
 * the Redemption Round queue. Contract: docs/specs/studio-v3-w2.md section 3. Nothing is required and nothing is timed.
 */
(() => {
  const W = /** @type {any} */ (window);
  const RT = (W.StudioRT = W.StudioRT || {});
  const { es } = RT.util;
  /** @type {any} */
  let rt = null;
  let serial = 0;

  const $ = (/** @type {string} */ sel, /** @type {ParentNode} */ root = document) =>
    /** @type {any} */ (root.querySelector(sel));

  function offer(/** @type {any} */ e) {
    const st = rt.api.state;
    const spec = rt.api.sections[e.tab - 1]?.items[st.idx[e.tab]];
    const helped = !e.first || (st.hints[e.itemId] || 0) > 0;
    if (!spec || spec.k !== "gen" || !helped) return;
    const stage = $(`#stage-${e.tab}`);
    const fb = stage && $(".item-fb", stage);
    if (!fb || $("[data-repair]", fb)) return;
    const b = document.createElement("button");
    b.type = "button";
    b.className = "btn btn-sm repair-btn";
    b.setAttribute("data-repair", "");
    b.innerHTML = `🔁 Try a fresh one${es("Prueba una nueva")}`;
    b.addEventListener("click", () => start(e.tab, st.idx[e.tab], e.itemId, stage));
    fb.append(b);
  }

  /** Repairs on screen, by the fresh item's id. @type {Record<string, { tab: number, idx: number, origin: string, stage: HTMLElement, host: HTMLElement, it: any }>} */
  const open = {};

  function start(
    /** @type {number} */ tab,
    /** @type {number} */ idx,
    /** @type {string} */ origin,
    /** @type {HTMLElement} */ stage,
  ) {
    $(".repair-stage", stage)?.remove();
    const host = document.createElement("div");
    host.className = "repair-stage stage-card";
    host.setAttribute("aria-label", "A fresh problem on the same skill");
    stage.append(host);
    const id = `rp_${origin}_${++serial}`;
    const it = { ...rt.api.expand(tab, idx, Math.floor(Math.random() * 90000) + 2000), id };
    open[id] = { tab, idx, origin, stage, host, it };
    rt.api.mountItem({ tab, it, host, redeem: true });
  }

  /** The fresh item was solved (the bus `answer` carries its tries and hints): close the repair or offer another. */
  function finish(/** @type {any} */ e) {
    const r = open[e.itemId];
    if (!r) return;
    delete open[e.itemId];
    const st = rt.api.state;
    const clean = e.tries === 1 && !e.hints;
    const fb = $(".item-fb", r.host);
    const note = document.createElement("p");
    note.className = "repair-note";
    if (clean) {
      st.missLog = st.missLog.filter((/** @type {any} */ x) => x.id !== r.origin);
      rt.api.save();
      W.StudioBus.emit("repair", {
        lesson: rt.api.data.lesson,
        itemId: r.origin,
        skill: r.it.skill || "",
      });
      note.innerHTML = `<strong>Repaired!</strong>${es("¡Arreglado!")} You got a fresh one right with no help.${es("Acertaste una nueva sin ayuda.")}`;
    } else {
      note.innerHTML = `Nice work. A fresh one with no hint will finish the repair.${es("Buen trabajo. Una nueva sin pista completa el arreglo.")}`;
      const again = document.createElement("button");
      again.type = "button";
      again.className = "btn btn-sm repair-btn";
      again.innerHTML = `🔁 Try a fresh one${es("Prueba una nueva")}`;
      again.addEventListener("click", () => start(r.tab, r.idx, r.origin, r.stage));
      note.append(" ", again);
    }
    fb?.append(note);
    rt.api.wipeItem(e.itemId);
  }

  W.StudioRepair = {
    init(/** @type {any} */ runtime) {
      rt = runtime;
      W.StudioBus.on("answer", (/** @type {any} */ e) => {
        if (e.ok && String(e.itemId).startsWith("rp_")) finish(e);
      });
      W.StudioBus.on("solved", (/** @type {any} */ e) => {
        if (!e.redeem) offer(e);
      });
    },
  };
})();
