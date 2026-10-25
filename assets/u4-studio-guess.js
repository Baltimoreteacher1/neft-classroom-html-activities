/**
 * Unit 4 Practice Studio: guess resistance for the ten hand-built pages (window.U4Guess).
 *
 * The generated studios (assets/studio/runtime.js, repair.js) stop a student from clicking every choice until one turns green.
 * This file gives the Unit 4 pages the same behavior without touching their answer-checking code. Policy is not copied: it
 * is read from assets/studio/attempts.js (window.StudioAttempts), which must load first.
 *
 *   miss        every wrong try is counted per problem slot (section + step dot), saved in state.play.guess, and survives a reload
 *   hold        after a miss the student picks one thing to do before trying again (no clock); buttons and Enter wait
 *   reshuffle   after a miss the choices move, so a position cannot be memorised
 *   look closer the second miss closes the item into a short note: study the model, a fresh problem comes next
 *   tier        the first solve is classed clean / assisted / guessed from its misses (StudioAttempts.tierOf)
 *   star        clean and assisted answers earn the star; a guessed answer earns it only after one fresh problem
 *               (assets/u4-studio-twin.js), else it is released with a teacher flag and earns none
 *
 * Pages call U4Studio.miss(item, i, { tab }) for a wrong choice, U4Studio.wrong(tab) for a wrong typed answer, and
 * assets/u4-studio.js asks this file which solved items still owe a fresh problem (pending) and which may not earn a star (noStar).
 * Nothing here is timed and nothing prints an answer.
 */
(() => {
  const W = /** @type {any} */ (window);
  const U = W.U4Studio;
  const AT = W.StudioAttempts;
  if (!U || !AT) return;

  const TABS = [1, 2, 3, 4, 5];
  const $ = (/** @type {string} */ sel, /** @type {ParentNode} */ root = document) =>
    /** @type {any} */ (root.querySelector(sel));
  const es = (/** @type {string} */ t) => `<span class="es-text">${t}</span>`;
  const bi = (/** @type {string} */ en, /** @type {string} */ sp) => `${en}${es(sp)}`;
  const countable = (/** @type {string} */ id) => !id.startsWith("rand") && !id.endsWith("_choice");
  const idKey = (/** @type {number} */ tab, /** @type {string} */ id) => `t${tab}:${id}`;
  const slotKey = (/** @type {number} */ tab, /** @type {number} */ idx) => `${tab}:${idx}`;

  /** The saved attempt record: state.play.guess. Cleared by U4Studio.reset (which empties state.play). */
  function record() {
    const st = U.withCfg((/** @type {any} */ c) => c && c.state);
    if (!st) return null;
    if (!st.play || typeof st.play !== "object") st.play = {};
    const g =
      st.play.guess && typeof st.play.guess === "object" ? st.play.guess : (st.play.guess = {});
    for (const k of ["miss", "tier", "slot", "proved", "flag", "proof"])
      if (!g[k] || typeof g[k] !== "object") g[k] = {};
    return g;
  }
  const save = () => U.withCfg((/** @type {any} */ c) => c && c.save && c.save());
  const solvedMap = (/** @type {number} */ tab) =>
    U.withCfg((/** @type {any} */ c) =>
      c ? (c.solvedMap ? c.solvedMap(tab) : c.state[`solved${tab}`]) || {} : {},
    );
  const say = (/** @type {string} */ msg) => U.say?.(msg);

  /* ---- slots: the active step dot of a section ------------------------------------------------------------------ */
  const panelOf = (/** @type {number} */ tab) => $(`#panel-${tab}`);
  function activeIdx(/** @type {number} */ tab) {
    const panel = panelOf(tab);
    if (!panel) return -1;
    return [...panel.querySelectorAll(".step-dot")].findIndex((d) =>
      d.classList.contains("active"),
    );
  }
  function dotSolved(/** @type {number} */ tab, /** @type {number} */ idx) {
    const dots = panelOf(tab)?.querySelectorAll(".step-dot");
    return !!dots?.[idx]?.classList.contains("solved");
  }
  const misses = (/** @type {number} */ tab, /** @type {number} */ idx) =>
    record()?.miss[slotKey(tab, idx)] || 0;

  /* ---- what each solved item earned ----------------------------------------------------------------------------- */
  /** A guessed answer that has not yet been shown on a fresh problem and has not been released. */
  function pending(/** @type {number} */ tab, /** @type {string} */ id) {
    const g = record();
    const k = idKey(tab, id);
    return !!g && g.tier[k] === "guessed" && !g.proved[k] && !g.flag[k];
  }
  /** A guessed answer earns no star until it is shown; a released one never earns it. */
  function noStar(/** @type {number} */ tab, /** @type {string} */ id) {
    const g = record();
    const k = idKey(tab, id);
    return !!g && g.tier[k] === "guessed" && !g.proved[k];
  }

  /** Class every newly solved item by the misses its slot collected. Called by U4Studio.sync before it awards stars. */
  function assign() {
    const g = record();
    const stars = U.withCfg(
      (/** @type {any} */ c) => (c && c.state.play && c.state.play.stars) || {},
    );
    if (!g) return;
    for (const tab of TABS) {
      const map = solvedMap(tab);
      for (const id of Object.keys(map)) {
        if (!map[id] || !countable(id)) continue;
        const k = idKey(tab, id);
        if (g.tier[k] || stars[k]) continue;
        const idx = activeIdx(tab);
        const slot = slotKey(tab, idx);
        g.tier[k] = idx < 0 ? "clean" : AT.tierOf(g.miss[slot] || 0, 0);
        if (idx >= 0) {
          g.slot[slot] = id;
          delete g.miss[slot];
        }
      }
    }
  }

  /* ---- a miss --------------------------------------------------------------------------------------------------- */
  function wrong(/** @type {number} */ tab) {
    const g = record();
    if (!g || !TABS.includes(tab)) return;
    const idx = activeIdx(tab);
    if (idx < 0 || dotSolved(tab, idx)) return; // extra practice on a finished slot does not count
    // a click on Check with every answer box empty tried nothing, so it is not a miss
    const typed = [...(panelOf(tab)?.querySelectorAll(".stage-card input.num-input") || [])].filter(
      (i) => !i.closest(".u4-twin"),
    );
    if (
      typed.length &&
      typed.every((i) => !(/** @type {HTMLInputElement} */ (i.value || "").trim()))
    )
      return;
    const slot = slotKey(tab, idx);
    g.miss[slot] = (g.miss[slot] || 0) + 1;
    save();
    const stage = panelOf(tab)?.querySelector(".stage-card");
    if (stage) arrange(/** @type {HTMLElement} */ (stage), tab, idx);
    queueMicrotask(() => afterMiss(tab));
  }

  /** Where the page just wrote its feedback for this section. */
  function feedbackBox(/** @type {HTMLElement} */ stage) {
    const boxes = [...stage.querySelectorAll(".feedback-box.show")].filter(
      (b) => !b.classList.contains("ok"),
    );
    return /** @type {HTMLElement|null} */ (boxes[boxes.length - 1] || null);
  }

  function afterMiss(/** @type {number} */ tab) {
    const panel = panelOf(tab);
    const stage = /** @type {HTMLElement|null} */ (
      panel && (panel.querySelector(".stage-card") || panel)
    );
    if (!stage) return;
    const idx = activeIdx(tab);
    const n = misses(tab, idx);
    arrange(stage, tab, idx);
    const box = feedbackBox(stage);
    if (!box) return;
    box.querySelector(".look-closer")?.remove();
    box.querySelector(".hold-chips")?.remove();
    const look = n >= AT.LOOK_AT;
    if (look) {
      say("Look closer. Study the model and read the question again.");
    }
  }

  /* ---- the pause: buttons and Enter wait until one thing is picked ---------------------------------------------- */
  const ALLOW =
    ".hold-chip,.speak-btn,[data-speak],.read-aloud-btn,.next-btn,.step-dot,.hint-btn,[id$='-hint-btn'],[data-hint],.u4-twin,.prove-box,.repair-note";
  const GATED =
    "button,[role=button],.choice-btn,input[type=checkbox],input[type=radio],[data-examine-pick]";
  const heldStage = (_t) => null;
  function releaseHold(/** @type {HTMLElement} */ stage, /** @type {string} */ reason) {
    delete stage.dataset.hold;
    stage.querySelector(".hold-chips")?.remove();
    const focus = (/** @type {HTMLElement|null} */ n) => {
      if (!n) return false;
      if (!n.hasAttribute("tabindex") && !/^(BUTTON|INPUT|SELECT|TEXTAREA|A)$/.test(n.tagName))
        n.setAttribute("tabindex", "-1");
      n.focus();
      return true;
    };
    if (reason === "hint") {
      /** @type {HTMLElement|null} */ (
        stage.querySelector(".hint-btn,[id$='-hint-btn'],[data-hint]")
      )?.click();
    } else if (reason === "model") {
      focus(stage.querySelector("svg,.tape,.grid,figure,.vis"));
    } else if (reason === "check") {
      focus(stage.querySelector(".item-workspace textarea,.item-workspace button,input"));
    } else {
      focus(stage.querySelector("p"));
    }
    say("Try again when you are ready.");
  }
  document.addEventListener(
    "click",
    (e) => {
      const t = e.target instanceof Element ? e.target : null;
      if (!t) return;
      // The stage itself also carries data-hold="1". Match only an actual reason chip,
      // otherwise any click inside the held stage accidentally releases the pause.
      const chip = /** @type {HTMLElement|null} */ (t.closest(".hold-chip[data-hold]"));
      const stage = heldStage(t);
      if (chip && stage) return void releaseHold(stage, chip.dataset.hold || "reread");
      if (!stage) return;
      if (t.closest(".hint-btn,[id$='-hint-btn'],[data-hint]")) {
        delete stage.dataset.hold;
        stage.querySelector(".hold-chips")?.remove();
        return;
      }
      if (t.closest(ALLOW)) return;
      if (t.closest(GATED)) {
        e.stopPropagation();
        e.preventDefault();
        say("Pick one thing to do before you try again.");
        /** @type {HTMLElement|null} */ (stage.querySelector(".hold-chip"))?.focus();
      }
    },
    true,
  );
  document.addEventListener(
    "keydown",
    (e) => {
      const t = e.target instanceof Element ? e.target : null;
      if (e.key !== "Enter" || !t || !(t instanceof HTMLInputElement)) return;
      const stage = heldStage(t);
      if (!stage || t.closest(".u4-twin")) return;
      e.stopPropagation();
      e.preventDefault();
      say("Pick one thing to do before you try again.");
      /** @type {HTMLElement|null} */ (stage.querySelector(".hold-chip"))?.focus();
    },
    true,
  );

  /* ---- the choices move after a miss ---------------------------------------------------------------------------- */
  function arrange(
    /** @type {HTMLElement} */ stage,
    /** @type {number} */ tab,
    /** @type {number} */ idx,
  ) {
    const n = misses(tab, idx);
    if (n < 1) return;
    const stack = [...stage.querySelectorAll(".choice-stack, .choice-list")].find(
      (s) =>
        !s.closest("[data-examine]") &&
        [...s.children].filter((c) => c.classList.contains("choice-btn")).length >= 3 &&
        [...s.children].every((c) => c.classList.contains("choice-btn")),
    );
    if (!stack) return;
    const tag = `${slotKey(tab, idx)}:${n}`;
    if (stack.dataset.arranged === tag) return;
    const btns = /** @type {HTMLElement[]} */ ([...stack.children]);
    btns.forEach((b, i) => {
      if (b.dataset.u4o === undefined) b.dataset.u4o = String(i);
    });
    const base = btns.slice().sort((a, b) => Number(a.dataset.u4o) - Number(b.dataset.u4o));
    const seed = (tab * 131 + idx) * 7919 + n * 104729;
    let order = AT.shuffleOrder(base.length, seed);
    let next = order.map((/** @type {number} */ i) => base[i]);
    if (next.every((b, i) => b === btns[i])) {
      order = order.map((/** @type {number} */ i) => (i + 1) % base.length);
      next = order.map((/** @type {number} */ i) => base[i]);
    }
    const hadFocus = stack.contains(document.activeElement) ? document.activeElement : null;
    next.forEach((b, i) => {
      stack.appendChild(b);
      const letter = b.querySelector(".choice-letter");
      if (letter) letter.textContent = "ABCDEFGH"[i] || "";
    });
    stack.dataset.arranged = tag;
    /** @type {HTMLElement|null} */ (hadFocus)?.focus?.();
  }

  /** The letter a choice shows now (it follows the choice's position, and moves after a miss). */
  const letterOf = (/** @type {Element|null} */ btn, /** @type {string} */ fallback) =>
    btn?.querySelector(".choice-letter")?.textContent || fallback;
  /** The original index of each choice, in the order the student sees them now (for read-aloud: position, not index, names a letter). */
  function order(/** @type {Element|null} */ scope, /** @type {number} */ n) {
    const btns = scope
      ? [...scope.querySelectorAll(".choice-stack > .choice-btn, .choice-list > .choice-btn")]
      : [];
    if (btns.length !== n) return Array.from({ length: n }, (_, i) => i);
    return btns.map((b, i) => Number(/** @type {HTMLElement} */ (b).dataset.u4o ?? i));
  }

  /* ---- a guessed answer owes one fresh problem ------------------------------------------------------------------ */
  const family = () => U.withCfg((/** @type {any} */ c) => (c && c.bonus && c.bonus.gen) || "");

  function offerProof(
    /** @type {HTMLElement} */ stage,
    /** @type {number} */ tab,
    /** @type {string} */ id,
  ) {
    const box = /** @type {HTMLElement|null} */ ($(".feedback-box", stage));
    if (!box || $(".prove-box", box) || $(".u4-twin", stage)) return;
    if (!W.U4Twin || !W.U4Twin.families.includes(family())) return void finish(tab, id, "no-twin");
    box.dataset.owed = "1";
    const note = document.createElement("div");
    note.className = "repair-note prove-box";
    note.innerHTML = `<p><strong>${bi("Show it again with new numbers.", "Demuéstralo otra vez con números nuevos.")}</strong> ${bi("You found it after a few tries. One fresh problem, and this one counts.", "Lo encontraste después de varios intentos. Un problema nuevo, y este cuenta.")}</p>`;
    const go = document.createElement("button");
    go.type = "button";
    go.className = "btn btn-go btn-sm";
    go.setAttribute("data-prove", "");
    go.innerHTML = bi("Try a fresh problem →", "Probar un problema nuevo →");
    go.addEventListener("click", () => {
      note.remove();
      mountTwin(stage, box, tab, id);
    });
    note.append(go);
    box.append(note);
  }

  let serial = 0;
  function mountTwin(
    /** @type {HTMLElement} */ stage,
    /** @type {HTMLElement} */ box,
    /** @type {number} */ tab,
    /** @type {string} */ id,
  ) {
    $(".u4-twin", stage)?.remove();
    const seed = Math.floor(Math.random() * 90000) + 2000 + ++serial;
    const tw = W.U4Twin.make(family(), seed);
    if (!tw) return void finish(tab, id, "no-twin");
    const host = document.createElement("div");
    host.className = "u4-twin stage-card";
    host.setAttribute("role", "group");
    host.setAttribute("aria-label", "A fresh problem on the same skill");
    host.dataset.seed = String(seed);
    host.innerHTML = `<p class="u4-twin-q"><strong>${bi("A fresh problem", "Un problema nuevo")}</strong></p>
      <p class="u4-twin-stem">${bi(tw.q, tw.qEs)}</p>
      <div class="u4-twin-row"><label for="u4-twin-in-${serial}">${bi("Your answer", "Tu respuesta")}</label>
      <input type="text" inputmode="decimal" autocomplete="off" class="num-input" id="u4-twin-in-${serial}" data-twin-in>${tw.unit ? ` <span aria-hidden="true">${tw.unit}</span>` : ""}
      <button type="button" class="btn btn-primary btn-sm" data-twin-check>${bi("Check", "Revisar")}</button></div>
      <div class="feedback-box" data-twin-fb role="status" aria-live="polite"></div>`;
    box.after(host);
    const input = /** @type {HTMLInputElement} */ ($("[data-twin-in]", host));
    const fb = /** @type {HTMLElement} */ ($("[data-twin-fb]", host));
    let tries = 0;
    const check = () => {
      const r = tw.check(input.value);
      if (r.ok === false && /^Type a number/.test(r.say)) {
        fb.className = "feedback-box show warn";
        fb.innerHTML = bi(r.say, r.sayEs);
        return;
      }
      tries += 1;
      if (r.ok) return void settle(tab, id, tries <= 2, host, box);
      fb.className = "feedback-box show err";
      fb.innerHTML = `${bi(r.say, r.sayEs)}${tries === 1 ? ` <span class="item-sub">${bi("Hint: " + tw.hint, "Pista: " + tw.hintEs)}</span>` : ""}`;
      input.focus();
    };
    $("[data-twin-check]", host)?.addEventListener("click", check);
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") check();
    });
    input.focus();
  }

  /** The fresh problem was answered: two or fewer tries proves the skill; otherwise another, then a flag for the teacher. */
  function settle(
    /** @type {number} */ tab,
    /** @type {string} */ id,
    /** @type {boolean} */ proved,
    /** @type {HTMLElement} */ host,
    /** @type {HTMLElement} */ box,
  ) {
    const g = record();
    if (!g) return;
    const k = idKey(tab, id);
    const note = document.createElement("p");
    note.className = "repair-note";
    host.remove();
    if (proved) {
      delete g.proof[k];
      note.innerHTML = `<strong>${bi("Shown!", "¡Demostrado!")}</strong> ${bi("That one counts now.", "Ahora sí cuenta.")}`;
      box.append(note);
      return void finish(tab, id, "proved");
    }
    g.proof[k] = (g.proof[k] || 0) + 1;
    if (g.proof[k] >= AT.MAX_PROOFS) {
      delete g.proof[k];
      note.innerHTML = `<strong>${bi("Let us look at this one together.", "Veamos este juntos.")}</strong> ${bi("Show your teacher what you tried.", "Muéstrale a tu maestro lo que intentaste.")}`;
      box.append(note);
      return void finish(tab, id, "teacher");
    }
    save();
    note.innerHTML = `${bi("Almost. One more fresh problem will show it.", "Casi. Un problema nuevo más lo demostrará.")} `;
    const again = document.createElement("button");
    again.type = "button";
    again.className = "btn btn-sm repair-btn";
    again.innerHTML = bi("Try another fresh problem →", "Otro problema nuevo →");
    again.addEventListener("click", () => {
      note.remove();
      const stage = /** @type {HTMLElement} */ (box.closest(".stage-card") || box.parentElement);
      mountTwin(stage, box, tab, id);
    });
    note.append(again);
    box.append(note);
  }

  /** @param {number} tab @param {string} id @param {"proved"|"teacher"|"no-twin"} how */
  function finish(tab, id, how) {
    const g = record();
    if (!g) return;
    const k = idKey(tab, id);
    if (how === "proved") g.proved[k] = 1;
    else g.flag[k] = how;
    document
      .querySelectorAll(".feedback-box[data-owed]")
      .forEach((b) => b.removeAttribute("data-owed"));
    save();
    U.sync();
    document.dispatchEvent(
      new CustomEvent("u4:proof", { detail: { tab, id, how, flagged: how !== "proved" } }),
    );
  }

  /* ---- keep the page in step with the record: choices moved, proof offered ---------------------------------------- */
  function refresh() {
    const g = record();
    if (!g) return;
    for (const tab of TABS) {
      const panel = panelOf(tab);
      const stage = /** @type {HTMLElement|null} */ (panel && panel.querySelector(".stage-card"));
      if (!stage) continue;
      const idx = activeIdx(tab);
      if (idx < 0) continue;
      if (!dotSolved(tab, idx)) arrange(stage, tab, idx);
      const id = g.slot[slotKey(tab, idx)];
      if (id && dotSolved(tab, idx) && pending(tab, id)) offerProof(stage, tab, id);
    }
    markOwed(g);
  }
  /** A dot whose answer still owes its fresh problem shows a dashed ring (the same class the generated studios use). */
  function markOwed(/** @type {any} */ g) {
    for (const tab of TABS) {
      const dots = [...(panelOf(tab)?.querySelectorAll(".step-dot") || [])];
      dots.forEach((d, i) => {
        const id = g.slot[slotKey(tab, i)];
        d.classList.toggle("owed", !!id && pending(tab, id));
      });
    }
  }
  let queued = false;
  function schedule() {
    if (queued) return;
    queued = true;
    queueMicrotask(() => {
      queued = false;
      try {
        refresh();
      } catch (e) {
        console.warn("U4Guess refresh failed", e);
      }
    });
  }
  function watch() {
    const root = $(".main-container") || document.body;
    new MutationObserver(schedule).observe(root, { childList: true, subtree: true });
    schedule();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", watch);
  else watch();

  /* ---- wire into U4Studio ------------------------------------------------------------------------------------------- */
  const baseMiss = U.miss;
  U.miss = (/** @type {any} */ item, /** @type {number} */ i, ctx = {}) => {
    const html = baseMiss(item, i, ctx);
    if (ctx && typeof (/** @type {any} */ (ctx).tab) === "number")
      wrong(/** @type {any} */ (ctx).tab);
    return html;
  };
  U.wrong = wrong;
  U.letterOf = letterOf;
  U.order = order;

  W.U4Guess = { assign, pending, noStar, wrong, schedule, record, letterOf, order, activeIdx };
})();
