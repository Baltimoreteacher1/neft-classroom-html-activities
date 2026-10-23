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
    if (st.owed?.[e.itemId]) return; // a guessed answer already has its fresh problem waiting
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
    /** @type {{required?: boolean, oTab?: number, oHost?: HTMLElement}} [req] */ req,
  ) {
    $(".repair-stage", stage)?.remove();
    const host = document.createElement("div");
    host.className = "repair-stage stage-card";
    host.setAttribute("aria-label", "A fresh problem on the same skill");
    stage.append(host);
    const id = `rp_${origin}_${++serial}`;
    const it = { ...rt.api.expand(tab, idx, Math.floor(Math.random() * 90000) + 2000), id };
    open[id] = { tab, idx, origin, stage, host, it, ...(req || {}), required: !!req?.required };
    rt.api.mountItem({ tab, it, host, redeem: true });
  }

  /** The fresh item was solved (the bus `answer` carries its tries and hints): close the repair or offer another. */
  function finish(/** @type {any} */ e) {
    const r = open[e.itemId];
    if (!r) return;
    delete open[e.itemId];
    const st = rt.api.state;
    if (r.required) return void finishRequired(e, r);
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

  /** A fresh problem on the same skill: this section's own generator or activity, else the first one the lesson has. */
  function twinFor(/** @type {number} */ tab, /** @type {number} */ idx) {
    const secs = rt.api.sections;
    const own = secs[tab - 1].items[idx];
    if (own && (own.k === "gen" || own.k === "act")) return { tab, idx };
    const order = [tab, ...rt.api.tabs.filter((/** @type {number} */ t) => t !== tab)];
    for (const t of order) {
      const j = secs[t - 1].items.findIndex(
        (/** @type {any} */ s) => s.k === "gen" || s.k === "act",
      );
      if (j >= 0) return { tab: t, idx: j };
    }
    return null;
  }

  /** Let the student go on: the item's credit stays unearned, and a teacher flag says it never stood on its own. */
  function release(
    /** @type {string} */ origin,
    /** @type {number} */ tab,
    /** @type {HTMLElement} */ host,
    /** @type {string} */ why,
  ) {
    const st = rt.api.state;
    delete st.owed[origin];
    if (why) st.flag[origin] = why;
    rt.api.save();
    rt.api.progress();
    rt.api.nextButton(tab, host);
  }

  /** The student answered this problem only after two or more misses: a fresh problem must show it before the next one opens. */
  function prove(
    /** @type {number} */ tab,
    /** @type {number} */ idx,
    /** @type {string} */ origin,
    /** @type {HTMLElement} */ host,
  ) {
    const st = rt.api.state;
    const fb = $(".item-fb", host);
    if (!fb || $("[data-prove]", fb)) return;
    const twin = twinFor(tab, idx);
    if (!twin) return release(origin, tab, host, "no-twin");
    const stage = $(`#stage-${tab}`);
    const note = document.createElement("div");
    note.className = "repair-note prove-box";
    note.innerHTML = `<p><strong>Show it again with new numbers.</strong>${es("Demuéstralo otra vez con números nuevos.")} You found it after a few tries. One fresh problem, and this one counts.${es("Lo encontraste después de varios intentos. Un problema nuevo, y este cuenta.")}</p>`;
    const go = document.createElement("button");
    go.type = "button";
    go.className = "btn btn-go btn-sm";
    go.setAttribute("data-prove", "");
    go.innerHTML = `Try a fresh problem →${es("Probar un problema nuevo →")}`;
    go.addEventListener("click", () => {
      note.remove();
      start(twin.tab, twin.idx, origin, stage || host, { required: true, oTab: tab, oHost: host });
    });
    note.append(go);
    fb.append(note);
    st.proof ||= {};
  }

  /** A required fresh problem was solved: two or fewer tries proves the skill; otherwise another, then a flag for the teacher. */
  function finishRequired(/** @type {any} */ e, /** @type {any} */ r) {
    const st = rt.api.state;
    st.proof ||= {};
    const tab = r.oTab;
    const host = /** @type {HTMLElement} */ (r.oHost);
    const fb = $(".item-fb", host);
    const proved = e.tries <= 2 && (e.hints || 0) <= 2 && e.tier !== "guessed";
    const n = (st.proof[r.origin] = (st.proof[r.origin] || 0) + (proved ? 0 : 1));
    r.stage.querySelectorAll(".repair-stage").forEach((/** @type {Element} */ x) => x.remove());
    const note = document.createElement("p");
    note.className = "repair-note";
    if (proved) {
      delete st.proof[r.origin];
      note.innerHTML = `<strong>Shown!</strong>${es("¡Demostrado!")} That one counts now.${es("Ahora sí cuenta.")}`;
      fb?.append(note);
      rt.api.wipeItem(e.itemId);
      W.StudioBus.emit("proved", { lesson: rt.api.data.lesson, itemId: r.origin });
      return release(r.origin, tab, host, "");
    }
    if (n >= AT_MAX()) {
      delete st.proof[r.origin];
      note.innerHTML = `<strong>Let us look at this one together.</strong>${es("Veamos este juntos.")} Show your teacher what you tried.${es("Muéstrale a tu maestro lo que intentaste.")}`;
      fb?.append(note);
      rt.api.wipeItem(e.itemId);
      return release(r.origin, tab, host, "teacher");
    }
    note.innerHTML = `Almost. One more fresh problem will show it.${es("Casi. Un problema nuevo más lo demostrará.")}`;
    const again = document.createElement("button");
    again.type = "button";
    again.className = "btn btn-sm repair-btn";
    again.innerHTML = `Try another fresh problem →${es("Otro problema nuevo →")}`;
    again.addEventListener("click", () =>
      start(r.tab, r.idx, r.origin, r.stage, { required: true, oTab: tab, oHost: host }),
    );
    note.append(" ", again);
    fb?.append(note);
    rt.api.wipeItem(e.itemId);
  }

  const AT_MAX = () => W.StudioAttempts?.MAX_PROOFS || 2;

  W.StudioRepair = {
    prove,
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
