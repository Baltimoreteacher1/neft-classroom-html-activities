/**
 * Practice Studio v2 — the page runtime for /math/practice-studio/<lesson>/ and its /challenge/ twin.
 *
 * A page ships its lesson as JSON (<script type="application/json" id="studio-data">). This file owns state, the
 * five sections, expanding generated problems (StudioGen), hands-on activities (StudioAct) and pooled items into
 * concrete items, the hint ladder, language, reset, and the shared engagement layer (U4Studio stars + ranks).
 * The item kinds live in kinds-basic.js and kinds-hands.js; thinking map, redemption round, read-aloud, share
 * code and the passport live in insight.js. Contract: docs/specs/practice-studio-v2.md.
 *
 * Nothing here knows any mathematics: every right answer comes from an item or a generator's own check().
 */
(() => {
  const W = /** @type {any} */ (window);
  const dataNode = document.getElementById("studio-data");
  if (!dataNode) return;
  const RT = (W.StudioRT = W.StudioRT || {});
  /** @type {any} */
  const data = JSON.parse(dataNode.textContent || "{}");
  /** Pathway 1 (Foundational) is a different run of the same studio: easier generated levels, a hint showing, its own save. */
  const PATH = W.EWLChrome?.pathway || { id: data.mode === "challenge" ? 3 : 2, scaffold: false };
  const KEY =
    String(data.storageKey) +
    (PATH.scaffold ? "_p1" : "") +
    (W.StudioPedagogy?.storageSuffix || "");
  const lvl = (/** @type {number} */ n) => (PATH.scaffold ? Math.max(1, n - 1) : n);
  const SECTIONS = /** @type {any[]} */ (data.sections);
  const TABS = [1, 2, 3, 4, 5];
  const { esc, es } = RT.util;
  const AT = () => /** @type {any} */ (W.StudioAttempts);
  const state = W.StudioStore.load(KEY);
  /** wrong tries per item id, SAVED with the lesson: reloading the page must not give a guesser a clean slate */
  const A = () => /** @type {Record<string, number>} */ (state.att || (state.att = {}));
  /** @type {Set<string>} */
  const counted = new Set();

  const $ = (/** @type {string} */ sel, /** @type {ParentNode} */ root = document) =>
    /** @type {any} */ (root.querySelector(sel));
  const solvedMap = (/** @type {number} */ tab) => state[`solved${tab}`];
  const _stg = (/** @type {number} */ tab) => /** @type {HTMLElement} */ ($(`#stage-${tab}`));
  const save = () => W.StudioStore.save(KEY, state);
  const say = (/** @type {string} */ msg) => {
    const live = $("#sr-live");
    if (live) live.textContent = msg;
  };
  const hash = (/** @type {string} */ s) => {
    let h = 7;
    for (let i = 0; i < s.length; i++) h = (Math.imul(h, 31) + s.charCodeAt(i)) >>> 0;
    return h;
  };
  const baseSeed = (/** @type {string} */ id) =>
    1000 +
    (hash(
      `${W.StudioPedagogy?.seedToken ? `${W.StudioPedagogy.seedToken}|` : ""}${data.lesson}|${data.mode}|${id}`,
    ) %
      90000);

  /* ---- expanding specs into concrete items ------------------------------------------------------ */
  const idOf = (/** @type {number} */ tab, /** @type {number} */ i) =>
    SECTIONS[tab - 1].items[i].id || `t${tab}i${i + 1}`;

  /** The concrete item for slot i of section tab. Generated, pooled and activity slots depend on their seed. */
  function expand(
    /** @type {number} */ tab,
    /** @type {number} */ i,
    /** @type {number} [forceSeed] */ forceSeed,
  ) {
    const sec = SECTIONS[tab - 1];
    const spec = sec.items[i];
    const id = idOf(tab, i);
    const seed = forceSeed ?? state.seeds[id];
    try {
      /** @type {any} */
      let it;
      if (spec.k === "gen") {
        const s = seed ?? baseSeed(id);
        it = W.StudioGen.make(spec.g, lvl(spec.level), s);
        it.reroll = true;
        it.seed = s;
        it.skill = spec.lab || W.StudioGen.registry[spec.g].title;
        it.skillEs = W.StudioGen.registry[spec.g].titleEs;
        it.lvl = it.gen.level;
      } else if (spec.k === "act") {
        const s = seed ?? baseSeed(id);
        it = W.StudioAct.make(spec.kind, lvl(spec.level), s, spec.p);
        it.k = "act";
        it.reroll = true;
        it.seed = s;
        it.skill = spec.lab || W.StudioAct.registry[spec.kind].title;
        it.skillEs = W.StudioAct.registry[spec.kind].titleEs;
        it.lvl = it.level;
      } else if (spec.k === "pool") {
        const r = seed ?? 0;
        const order = W.StudioGen.rng(`${data.lesson}|${data.mode}|${tab}`).shuffle(
          sec.pool.map((/** @type {any} */ _q, /** @type {number} */ k) => k),
        );
        it = { ...sec.pool[order[(i + r * sec.items.length) % sec.pool.length]] };
        it.reroll = true;
        it.seed = r;
        if (it.k === "act") {
          const act = W.StudioAct.make(it.kind, lvl(it.level), baseSeed(id) + r, it.p);
          it = {
            ...act,
            k: "act",
            reroll: true,
            seed: r,
            skill: it.lab || W.StudioAct.registry[it.kind].title,
          };
          it.skillEs = W.StudioAct.registry[act.kind].titleEs;
          it.lvl = act.level;
        }
      } else it = { ...spec };
      it.id = id;
      return it;
    } catch (e) {
      console.warn("Studio item could not be built", id, e);
      return { k: "broken", id };
    }
  }

  const isSolved = (/** @type {number} */ tab, /** @type {any} */ it) =>
    !!solvedMap(tab)[it.id] && (!it.reroll || state.solvedSeed[it.id] === it.seed);

  /* ---- feedback voice, hints, next ------------------------------------------------------------- */
  const world = data.world || { voice: {} };
  const voice = (/** @type {"ok"|"retry"} */ kind, /** @type {string} */ id) => {
    const en = world.voice?.[kind] || [kind === "ok" ? "Correct." : "Not yet."];
    const sp = world.voice?.[`${kind}Es`] || [];
    const k = hash(id + state.stats.tries) % en.length;
    return `${esc(en[k])}${es(sp[k])}`;
  };

  function hintHtml(/** @type {any} */ it) {
    const hs = it.h || [];
    if (!hs.length) return "";
    const shown = Math.min(hs.length, (state.hints[it.id] || 0) + (PATH.scaffold ? 1 : 0));
    const tutor =
      shown >= hs.length && W.StudioTutor
        ? `<button type="button" class="btn btn-sm" data-tutor="${esc(it.id)}">Ask for help</button>`
        : "";
    return RT.util.ladder(it, shown, tutor);
  }

  /** "Watch for": the name of the first trap this item's wrong answers are tagged with, when the taxonomy has it. */
  function watchFor(/** @type {any} */ it) {
    const tags = [
      ...(Array.isArray(it.tag) ? it.tag : []),
      ...(it.fw || []).map((/** @type {any} */ w) => w?.tag),
    ];
    const t = tags.map((x) => x && data.traps?.[x]).find(Boolean);
    return t ? `<strong>${esc(t.n)}</strong>${es(t.nEs)}` : "";
  }

  function wireHints(/** @type {any} */ it, /** @type {HTMLElement} */ host) {
    if (/** @type {any} */ (host)._hints) return;
    /** @type {any} */ (host)._hints = true;
    host.addEventListener("click", (e) => {
      const b = /** @type {HTMLElement|null} */ (
        /** @type {HTMLElement} */ (e.target).closest("[data-hint],[data-tutor]")
      );
      if (!b) return;
      if (b.dataset.tutor !== undefined) return void W.StudioTutor?.ask(it, state);
      state.hints[it.id] = (state.hints[it.id] || 0) + 1;
      state.stats.hints++;
      const area = host.querySelector(".hint-area");
      if (area) area.outerHTML = hintHtml(it);
      save();
    });
  }

  function nextButton(/** @type {number} */ tab, /** @type {HTMLElement} */ host) {
    const fb = $(".item-fb", host);
    if (!fb || fb.querySelector(".next-btn")) return;
    const last = state.idx[tab] === SECTIONS[tab - 1].items.length - 1;
    const b = document.createElement("button");
    b.type = "button";
    b.className = "btn btn-go btn-sm next-btn";
    b.textContent = !last
      ? "Next problem →"
      : tab < 5
        ? `Continue to Section ${tab + 1} →`
        : "See how I did →";
    b.addEventListener("click", () => {
      if (!last) {
        state.idx[tab] += 1;
        render(tab);
      } else if (tab < 5) selectTab(tab + 1);
      else {
        render(tab);
        document.getElementById("complete-banner")?.scrollIntoView({ block: "center" });
        /** @type {HTMLElement|null} */ (
          document.querySelector("#complete-banner .exit-title")
        )?.focus({
          preventScroll: true,
        });
      }
    });
    fb.append(b);
  }

  /* ---- a pause with no clock: after a miss the student picks one thing to do before the next try ------------ */
  const HOLD_ALLOW =
    ".hold-chips,[data-hint],[data-tutor],[data-conf],.tool-btn,.next-btn,[data-example],[data-read],[data-reroll],.repair-btn,[data-prove],.item-workspace";
  const holdLive = (/** @type {HTMLElement} */ host) =>
    host.dataset.hold === "1" && !!host.querySelector(".hold-chips");
  function releaseHold(/** @type {HTMLElement} */ host, /** @type {string} */ reason) {
    delete host.dataset.hold;
    host.querySelector(".hold-chips")?.remove();
    const focusOn = (/** @type {string} */ sel) => {
      const n = /** @type {HTMLElement|null} */ (host.querySelector(sel));
      if (!n) return false;
      if (!n.hasAttribute("tabindex") && !/^(BUTTON|INPUT|SELECT|TEXTAREA|A)$/.test(n.tagName))
        n.setAttribute("tabindex", "-1");
      n.focus({ preventScroll: false });
      return true;
    };
    if (reason === "hint")
      /** @type {HTMLElement|null} */ (host.querySelector("[data-hint]"))?.click();
    else if (reason === "model") focusOn(".act-host, .lab-host, svg, .viz");
    else if (reason === "check") focusOn(".item-workspace button, .item-workspace textarea");
    else focusOn(".item-q");
    say("Try again when you are ready.");
  }
  function installHold(/** @type {HTMLElement} */ host) {
    const h = /** @type {any} */ (host);
    if (h._hold) return;
    h._hold = true;
    host.addEventListener(
      "click",
      (e) => {
        const t = e.target;
        if (!(t instanceof Element)) return;
        const chip = /** @type {HTMLElement|null} */ (t.closest("[data-hold]"));
        if (chip) return releaseHold(host, chip.dataset.hold || "reread");
        if (t.closest("[data-hint]")) {
          delete host.dataset.hold;
          host.querySelector(".hold-chips")?.remove();
          return;
        }
        if (!holdLive(host)) return void delete host.dataset.hold;
        if (t.closest(HOLD_ALLOW)) return;
        if (
          t.closest(
            "button,[role=button],[data-mc],[data-err],input[type=checkbox],input[type=radio]",
          )
        ) {
          e.stopImmediatePropagation();
          e.preventDefault();
          say("Pick one thing to do before you try again.");
          /** @type {HTMLElement|null} */ (host.querySelector(".hold-chip"))?.focus();
        }
      },
      true,
    );
    host.addEventListener(
      "keydown",
      (e) => {
        if (e.key !== "Enter" || !holdLive(host)) return;
        const t = e.target;
        if (!(t instanceof HTMLInputElement) || t.type === "range") return;
        e.stopImmediatePropagation();
        e.preventDefault();
        say("Pick one thing to do before you try again.");
        /** @type {HTMLElement|null} */ (host.querySelector(".hold-chip"))?.focus();
      },
      true,
    );
  }
  function holdFor(/** @type {any} */ ctx, /** @type {number} */ n) {
    const host = /** @type {HTMLElement} */ (ctx.host);
    const box = $(".item-fb", host);
    if (!box) return;
    const look = n >= AT().LOOK_AT;
    if (look) ctx.openHint();
    const chips = AT()
      .HOLD_REASONS.map(
        (/** @type {any} */ r) =>
          `<button type="button" class="btn btn-sm hold-chip" data-hold="${r.id}">${esc(r.en)}${es(r.es)}</button>`,
      )
      .join("");
    const note = look
      ? `<p class="item-sub look-closer"><strong>Look closer.</strong>${es("Mira con más cuidado.")} Read the next hint and study the model. A fresh problem comes next, so you can show you have it.${es("Lee la siguiente pista y estudia el modelo. Sigue un problema nuevo para que muestres que lo dominas.")}</p>`
      : "";
    box.insertAdjacentHTML(
      "beforeend",
      `${note}<div class="hold-chips" role="group" aria-label="Before you try again"><p class="item-sub hold-q">Before you try again, pick one thing to do:${es("Antes de intentar otra vez, elige una cosa por hacer:")}</p>${chips}</div>`,
    );
    host.dataset.hold = "1";
  }

  /* ---- the ctx every item kind receives -------------------------------------------------------- */
  function makeCtx(/** @type {any} */ o) {
    const { tab, it, host } = o;
    const redeem = !!o.redeem;
    const fb = (/** @type {string} */ kind, /** @type {string} */ html) => {
      const box = $(".item-fb", host);
      if (!box) return;
      box.className = `item-fb feedback-box show ${kind}`;
      box.innerHTML = html;
    };
    /** @type {any} */
    const ctx = {
      it,
      tab,
      host,
      state,
      redeem,
      solved: redeem ? false : isSolved(tab, it),
      es: () => state.showEs,
      save,
      say,
      fb,
      misses: () => A()[it.id] || 0,
      hintBlock: () => hintHtml(it),
      openHint: () => /** @type {HTMLElement|null} */ ($("[data-hint]", host))?.click(),
      showSolved(/** @type {string} */ html) {
        fb("ok", html);
        if (redeem) return;
        // an answer that took two or more misses has not been shown yet: the next problem waits for a fresh one
        if (state.owed?.[it.id] && W.StudioRepair?.prove)
          W.StudioRepair.prove(tab, state.idx[tab], it.id, host);
        else nextButton(tab, host);
      },
      solve(/** @type {string} */ html) {
        const rep = !redeem && !!solvedMap(tab)[it.id] && !isSolved(tab, it);
        const first = !A()[it.id];
        const tier = AT().tierOf(A()[it.id] || 0, state.hints[it.id] || 0);
        delete host.dataset.hold;
        $(".hold-chips", host)?.remove();
        if (!counted.has(`${it.id}@${it.seed}`)) {
          counted.add(`${it.id}@${it.seed}`);
          state.stats.tries++;
          if (first) {
            state.stats.first++;
            state.stats.streak++;
            state.stats.best = Math.max(state.stats.best, state.stats.streak);
          }
        }
        if (rep) state.stats.reps++;
        const cal = state.calib[it.id];
        if (cal && cal.ok === null) cal.ok = first;
        fb("ok", RT.util.fbOk(voice("ok", it.id), html, watchFor(it)));
        $(".conf-optional", host)?.remove();
        say("Correct");
        if (redeem) {
          o.onSolved?.();
        } else {
          if (!rep) {
            solvedMap(tab)[it.id] = true;
            if (it.reroll) state.solvedSeed[it.id] = it.seed;
          }
          if (tier === "guessed" && W.StudioRepair?.prove) {
            state.owed[it.id] = tab;
            W.StudioRepair.prove(tab, state.idx[tab], it.id, host);
          } else {
            delete state.owed[it.id];
            nextButton(tab, host);
          }
        }
        W.StudioBus.emit("answer", {
          lesson: data.lesson,
          mode: data.mode,
          itemId: it.id,
          kind: it.k,
          gen: it.gen?.id || null,
          genLevel: it.gen?.level || null,
          ok: true,
          tier,
          tries: (A()[it.id] || 0) + 1,
          hints: state.hints[it.id] || 0,
          tag: null,
          skill: it.skill || null,
          skillEs: it.skillEs || null,
          conf: state.calib[it.id]?.c ?? null,
          traps: Array.isArray(it.tag) ? it.tag.filter(Boolean) : null,
          redeem,
        });
        W.StudioBus.emit("solved", {
          lesson: data.lesson,
          mode: data.mode,
          itemId: it.id,
          tab,
          first,
          redeem,
        });
        if (!redeem) {
          dots(tab);
          progress();
        }
        if (redeem) delete A()[it.id];
        hud();
        save();
      },
      miss(/** @type {any} */ m) {
        A()[it.id] = (A()[it.id] || 0) + 1;
        if (!counted.has(`${it.id}@${it.seed}`)) {
          counted.add(`${it.id}@${it.seed}`);
          state.stats.tries++;
        }
        state.stats.streak = 0;
        const cal = state.calib[it.id];
        if (cal && cal.ok === null) cal.ok = false;
        const trap = (m.tag && data.traps?.[m.tag]) || null;
        // the guiding line: the item's own feedback for this answer, else the trap's fix, else a generic nudge
        const text =
          m.say ||
          trap?.fix ||
          m.generic ||
          "Look again at what the question asks, then try another choice.";
        const textEs = m.sayEs || (m.say ? "" : trap?.fixEs || m.genericEs) || "";
        const nudge =
          A()[it.id] >= 2 && (it.h || []).length > (state.hints[it.id] || 0)
            ? `<p class="item-sub">Stuck? Open a hint below.${es("¿Atascado? Abre una pista abajo.")}</p>`
            : "";
        fb(
          m.kind || "err",
          RT.util.fbMiss(
            m.noLead ? "" : voice("retry", it.id),
            trap ? `<strong>${esc(trap.n)}</strong>${es(trap.nEs)}` : "",
            `${RT.util.tx(text)}${RT.util.txEs(textEs)}${nudge}`,
          ),
        );
        say("Not yet");
        holdFor(ctx, A()[it.id]);
        W.StudioBus.emit("answer", {
          lesson: data.lesson,
          mode: data.mode,
          itemId: it.id,
          kind: it.k,
          gen: it.gen?.id || null,
          genLevel: it.gen?.level || null,
          ok: false,
          tries: A()[it.id],
          hints: state.hints[it.id] || 0,
          tag: m.tag || null,
          say: text,
          sayEs: textEs,
          wrong: m.wrongText ?? null,
          skill: it.skill || null,
          skillEs: it.skillEs || null,
          conf: state.calib[it.id]?.c ?? null,
          traps: Array.isArray(it.tag) ? it.tag.filter(Boolean) : null,
          tab,
          redeem,
        });
        hud();
        save();
      },
    };
    return ctx;
  }

  RT.kinds.broken = {
    mount(/** @type {any} */ ctx) {
      ctx.host.innerHTML = `<p class="item-q">This problem could not load.</p><p class="item-sub">It counts as done so you are never stuck. Go on to the next one.</p><div class="item-fb feedback-box" role="status"></div>`;
      if (!ctx.redeem) {
        solvedMap(ctx.tab)[ctx.it.id] = true;
        nextButton(ctx.tab, ctx.host);
        progress();
      }
    },
  };

  /** Mount one concrete item into host. Used by the sections and by the redemption round. */
  function mountItem(/** @type {any} */ o) {
    const kind = RT.kinds[o.it.k];
    if (!kind) {
      o.host.textContent = "This kind of problem is not available.";
      return;
    }
    installHold(o.host);
    const ctx = makeCtx(o);
    try {
      kind.mount(ctx);
    } catch (e) {
      console.warn("Studio item failed to mount", o.it.id, e);
      RT.kinds.broken.mount(ctx);
    }
    wireHints(o.it, o.host);
    return ctx;
  }

  /* ---- sections -------------------------------------------------------------------------------- */
  function dots(/** @type {number} */ tab) {
    const wrap = $(`#dots-${tab}`);
    if (!wrap) return;
    wrap.innerHTML = "";
    SECTIONS[tab - 1].items.forEach((/** @type {any} */ _s, /** @type {number} */ i) => {
      const owed = !!state.owed?.[idOf(tab, i)];
      const done = !!solvedMap(tab)[idOf(tab, i)] && !owed;
      const b = document.createElement("button");
      b.type = "button";
      b.className = `step-dot ${i === state.idx[tab] ? "active" : ""} ${done ? "solved" : ""} ${owed ? "owed" : ""}`;
      b.textContent = done ? `${i + 1} ✓` : owed ? `${i + 1} ↻` : String(i + 1);
      b.setAttribute(
        "aria-label",
        `Problem ${i + 1}${done ? " completed" : owed ? " needs a fresh problem to prove it" : ""}`,
      );
      if (i === state.idx[tab]) b.setAttribute("aria-current", "step");
      b.addEventListener("click", () => {
        state.idx[tab] = i;
        render(tab);
      });
      wrap.append(b);
    });
  }

  const stars = (/** @type {number} */ n) => `${"★".repeat(n)}${"☆".repeat(Math.max(0, 4 - n))}`;

  function headHtml(/** @type {number} */ tab, /** @type {any} */ it) {
    const n = SECTIONS[tab - 1].items.length;
    const lang = state.showEs;
    return `<div class="item-head"><span class="item-count">Problem ${state.idx[tab] + 1} of ${n}</span>
      ${it.id === "lab-explore" ? `<span class="chip chip-explore">Explore first${es("Explora primero")}</span>` : ""}
      ${it.skill ? `<span class="chip chip-skill">${esc(lang && it.skillEs ? it.skillEs : it.skill)}</span>` : ""}
      ${it.lvl ? `<span class="chip chip-level" role="img" aria-label="Level ${it.lvl} of 4">${stars(it.lvl)}</span>` : ""}
      <span class="item-tools">${it.gen ? `<button type="button" class="tool-btn" data-example>👀 ${lang ? "Ejemplo resuelto" : "Worked example"}</button>` : ""}${it.reroll ? `<button type="button" class="tool-btn" data-reroll>🎲 ${lang ? "Números nuevos" : "New numbers"}</button>` : ""}<button type="button" class="tool-btn" data-read aria-label="Read this problem aloud">🔊 ${lang ? "Leer" : "Read"}</button></span></div>`;
  }

  const CONF = [
    ["Guess", "Adivino"],
    ["Pretty sure", "Bastante seguro"],
    ["Certain", "Seguro"],
  ];
  function confRow(/** @type {any} */ it, /** @type {HTMLElement} */ host) {
    const zone = $(".answer-zone", host);
    if (!zone || state.calib[it.id]) return;
    zone.inert = true;
    zone.classList.add("need-conf");
    const row = document.createElement("div");
    row.className = "conf-row";
    row.setAttribute("role", "group");
    row.setAttribute("aria-label", "How sure are you?");
    row.innerHTML = `<span class="conf-q">How sure are you before you answer?${es("¿Qué tan seguro estás antes de responder?")}</span>${CONF.map((c, i) => `<button type="button" class="btn btn-sm conf-btn" data-conf="${i + 1}">${c[0]}${es(c[1])}</button>`).join("")}`;
    zone.before(row);
    row.addEventListener("click", (e) => {
      const b = /** @type {HTMLElement|null} */ (
        /** @type {HTMLElement} */ (e.target).closest("[data-conf]")
      );
      if (!b) return;
      state.calib[it.id] = { c: Number(b.dataset.conf), ok: null };
      zone.inert = false;
      zone.classList.remove("need-conf");
      row.remove();
      save();
    });
  }

  /**
   * The optional confidence tap for every item that is not a Boss item: the same three chips, never blocking. A student who skips
   * it loses nothing; a tap is remembered in state.calib (My thinking's calibration summary and the learner model read it).
   */
  function confChips(/** @type {any} */ it, /** @type {HTMLElement} */ host) {
    const zone = $(".answer-zone", host);
    if (!zone) return;
    const now = state.calib[it.id]?.c;
    const row = document.createElement("div");
    row.className = "conf-row conf-optional";
    row.setAttribute("role", "group");
    row.setAttribute("aria-label", "How sure are you? (optional)");
    row.innerHTML = `<span class="conf-q">How sure are you? <span class="conf-opt">(optional)</span>${es("¿Qué tan seguro estás? (opcional)")}</span>${CONF.map((c, i) => `<button type="button" class="btn btn-sm conf-btn" data-conf="${i + 1}" aria-pressed="${now === i + 1}">${c[0]}${es(c[1])}</button>`).join("")}`;
    zone.before(row);
    row.addEventListener("click", (e) => {
      const b = /** @type {HTMLElement|null} */ (
        /** @type {HTMLElement} */ (e.target).closest("[data-conf]")
      );
      if (!b) return;
      const c = Number(b.dataset.conf);
      state.calib[it.id] = { c, ok: null };
      for (const x of row.querySelectorAll("[data-conf]"))
        x.setAttribute("aria-pressed", String(x === b));
      save();
    });
  }

  /** Forget everything saved for one item id so a fresh problem starts clean. */
  function wipeItem(/** @type {string} */ id) {
    for (const k of [
      "picks",
      "cells",
      "notes",
      "hints",
      "acts",
      "sorts",
      "matches",
      "lines",
      "ticks",
      "rubric",
      "calib",
    ])
      delete state[k][id];
    delete A()[id];
    delete state.owed?.[id];
  }

  /** The kinds a student works out on paper; the hands-on kinds and the labs are their own work surface. */
  const WORKSPACE_KINDS = new Set(["mc", "num", "err", "tbl", "wr"]);
  const WORKSPACE_CAPTION = {
    en: "✏️ Draw or write your work here:",
    es: "✏️ Dibuja o escribe tu trabajo aquí:",
  };

  /** One workspace under the item, saved per item id. */
  function mountWorkspace(/** @type {HTMLElement} */ stage, /** @type {any} */ it) {
    const WS = W.NTWorkspace;
    if (!WS || !WORKSPACE_KINDS.has(it.k)) return;
    stage.insertAdjacentHTML(
      "beforeend",
      `<div class="item-workspace">${WS.html({
        key: it.id,
        notesId: `work_${it.id}`,
        notesAttr: "data-fw-persist",
        caption: WORKSPACE_CAPTION,
        stamp: WS.stampForUnit(Number.parseInt(String(data.lesson), 10)),
        dialect: "studio",
        lazy: true,
      })}</div>`,
    );
    WS.mount(stage);
  }

  function render(/** @type {number} */ tab) {
    const sec = SECTIONS[tab - 1];
    const i = state.idx[tab];
    const stage = $(`#stage-${tab}`);
    if (!stage || !sec.items[i]) return;
    const it = expand(tab, i);
    stage.innerHTML = `${headHtml(tab, it)}<div class="item-body"></div>`;
    const host = $(".item-body", stage);
    mountItem({ tab, it, host });
    W.StudioWorked?.decorate(tab, it, host);
    W.StudioPedagogy?.decorate(tab, it, host);
    W.StudioLanguage?.decorate(tab, it, host, stage);
    mountWorkspace(stage, it);
    if ((it.k === "mc" || it.k === "num") && !isSolved(tab, it))
      (sec.conf ? confRow : confChips)(it, host);
    dots(tab);
    for (const b of /** @type {HTMLElement[]} */ ([...stage.querySelectorAll("[data-reroll]")]))
      b.addEventListener("click", () => {
        const id = it.id;
        const isPool = SECTIONS[tab - 1].items[i].k === "pool";
        const cur = state.seeds[id] ?? (isPool ? 0 : baseSeed(id));
        state.seeds[id] =
          isPool || W.StudioPedagogy?.seedToken
            ? cur + 1
            : cur + 1 + Math.floor(Math.random() * 997);
        // new numbers must not be a way to reset the count: an unsolved item keeps its misses
        const kept = solvedMap(tab)[id] ? 0 : A()[id] || 0;
        wipeItem(id);
        if (kept) A()[id] = kept;
        W.NTWorkspace?.forget(id);
        save();
        render(tab);
        W.StudioBus.emit("reroll", { lesson: data.lesson, mode: data.mode, itemId: id });
      });
    for (const b of stage.querySelectorAll("[data-read]"))
      b.addEventListener("click", () => W.StudioInsight?.read(tab));
  }

  /* ---- shell: tabs, progress, HUD, language, reset --------------------------------------------- */
  const tabBtns = /** @type {HTMLElement[]} */ ([...document.querySelectorAll(".tab-btn")]);
  const panels = /** @type {HTMLElement[]} */ ([...document.querySelectorAll(".tab-panel")]);
  function selectTab(/** @type {number} */ n) {
    state.activeTab = n;
    tabBtns.forEach((b) => {
      const on = Number(b.dataset.tab) === n;
      b.setAttribute("aria-selected", String(on));
      b.setAttribute("tabindex", on ? "0" : "-1");
    });
    panels.forEach((p, i) => p.classList.toggle("active", i + 1 === n));
    save();
    W.StudioBus.emit("section", { lesson: data.lesson, mode: data.mode, tab: n });
  }
  tabBtns.forEach((b, i) => {
    b.addEventListener("click", () => selectTab(Number(b.dataset.tab)));
    b.addEventListener("keydown", (e) => {
      const j =
        e.key === "ArrowRight"
          ? i + 1
          : e.key === "ArrowLeft"
            ? i - 1
            : e.key === "Home"
              ? 0
              : e.key === "End"
                ? tabBtns.length - 1
                : -1;
      if (j < 0 || j >= tabBtns.length) return;
      e.preventDefault();
      selectTab(j + 1);
      tabBtns[j].focus();
    });
  });

  const total = TABS.reduce((a, t) => a + SECTIONS[t - 1].items.length, 0);

  function hud() {
    const s = state.stats;
    const pill = $("#hud-pill");
    if (!pill) return;
    const acc = s.tries ? Math.round((100 * s.first) / s.tries) : null;
    pill.innerHTML = `<span title="Right on the first try, in a row">🔥 ${s.streak}</span><span title="Right on the first try">${acc === null ? "—" : `${acc}%`}</span>`;
    pill.setAttribute(
      "aria-label",
      `Streak ${s.streak}. First-try accuracy ${acc === null ? "not yet" : `${acc} percent`}.`,
    );
  }

  /**
   * The exit card: the lesson target and the sections done, the first-try count, and ONE next step — the redemption
   * round when misses are waiting and first tries ran under 70%, else the Challenge (from Practice), the Daily Boost
   * (from a Challenge), or every studio (from the Boost).
   */
  function exitHtml() {
    const s = state.stats;
    const first = Math.min(s.first, total);
    const redo = W.StudioInsight?.toRedo?.() || 0;
    const boost = data.lesson === "0-0";
    /** @type {{en: string, es: string, href?: string, attr?: string}} */
    const next =
      redo && first < 0.7 * total
        ? {
            en: `Replay the ${Math.min(redo, 5)} you missed →`,
            es: `Repite ${Math.min(redo, 5) === 1 ? "la que fallaste" : `las ${Math.min(redo, 5)} que fallaste`} →`,
            attr: "data-replay",
          }
        : boost
          ? {
              en: "Pick a lesson studio →",
              es: "Elige un estudio de lección →",
              href: "/math/practice-studio/",
            }
          : data.mode === "practice"
            ? { en: "Take the Challenge →", es: "Haz el Reto →", href: data.otherUrl }
            : {
                en: "Keep it fresh: Daily Boost →",
                es: "Repaso diario →",
                href: "/math/practice-studio/boost/",
              };
    const card = W.StudioClarity?.exitCard;
    if (!card) return `<strong>${esc(data.bannerText)}</strong>${es(data.bannerTextEs)}`;
    return `<p class="exit-banner"><strong>${esc(data.bannerText)}</strong>${es(data.bannerTextEs)}</p>${card(
      {
        sections: SECTIONS.map((/** @type {any} */ x) => ({ en: x.name, es: x.nameEs })),
        tally: {
          en: `You solved ${first} of ${total} on the first try.`,
          es: `Resolviste ${first} de ${total} al primer intento.`,
        },
        seals: (W.StudioSeals?.earnedThisVisit?.() || []).map((/** @type {any} */ x) => ({
          name: W.StudioLearner.SEALS[x.seal].name,
          nameEs: W.StudioLearner.SEALS[x.seal].nameEs,
          label: x.label,
          labelEs: x.labelEs,
        })),
        extra: W.StudioPedagogy?.exitExtras?.() || "",
        next,
      },
    )}${W.StudioPulse?.slotHtml?.() || '<div class="pulse-slot" data-pulse-slot></div>'}`;
  }

  function progress() {
    const counts = TABS.map(
      (t) => Object.keys(solvedMap(t)).filter((k) => !state.owed?.[k]).length,
    );
    const done = counts.reduce((a, b) => a + b, 0);
    const pill = $("#header-progress-count");
    if (pill) pill.textContent = `${done} / ${total}`;
    TABS.forEach((t, i) => {
      const complete = counts[i] >= SECTIONS[t - 1].items.length;
      $(`#tab-${t}`)?.classList.toggle("tab-complete", complete);
      const badge = $(`#badge-${t}`);
      if (badge) badge.textContent = complete ? "✓" : String(t);
    });
    const every = counts.every((c, i) => c >= SECTIONS[TABS[i] - 1].items.length);
    const banner = $("#complete-banner");
    if (banner) {
      banner.toggleAttribute("hidden", !every);
      if (every && !banner.dataset.built) {
        banner.dataset.built = "1";
        banner.innerHTML = exitHtml();
        W.StudioBus.emit("complete", { lesson: data.lesson, mode: data.mode });
      }
    }
    W.StudioBus.emit("progress", {
      lesson: data.lesson,
      mode: data.mode,
      done,
      total,
      boss: counts[4] >= SECTIONS[4].items.length,
    });
    save();
    W.U4Studio?.sync();
  }

  const esBtn = $("#toggle-es-btn");
  const applyLang = () => {
    document.body.classList.toggle("show-es", state.showEs);
    document.documentElement.lang = state.showEs ? "es" : "en";
    esBtn?.setAttribute("aria-pressed", String(state.showEs));
  };
  esBtn?.addEventListener("click", () => {
    state.showEs = !state.showEs;
    applyLang();
    save();
    TABS.forEach(render);
  });
  $("#print-btn")?.addEventListener("click", () => window.print());
  $("#reset-all-btn")?.addEventListener("click", () => {
    if (!window.confirm("Start this studio over? Your saved progress here will be cleared."))
      return;
    const keepEs = state.showEs;
    for (const k of Object.keys(state)) delete state[k];
    Object.assign(state, W.StudioStore.fresh(), { showEs: keepEs });
    counted.clear();
    W.U4Studio?.reset();
    W.NTWorkspace?.forget();
    W.StudioStore.clear(KEY);
    const banner = $("#complete-banner");
    if (banner) delete banner.dataset.built;
    TABS.forEach(render);
    progress();
    hud();
    selectTab(1);
  });

  /* ---- start ----------------------------------------------------------------------------------- */
  RT.api = {
    state,
    data,
    save,
    say,
    render,
    selectTab,
    mountItem,
    expand,
    progress,
    hud,
    wipeItem,
    nextButton,
    sections: SECTIONS,
    tabs: TABS,
  };
  W.StudioPedagogy?.init(RT);
  W.U4Studio?.init({
    state,
    save,
    totals: Object.fromEntries(TABS.map((t) => [t, SECTIONS[t - 1].items.length])),
    need: Object.fromEntries(TABS.map((t) => [t, SECTIONS[t - 1].items.length])),
    // a star is for an answer that stood on its own: an owed (guessed) item earns it after its fresh problem
    solvedMap: (/** @type {number} */ t) =>
      Object.fromEntries(
        Object.entries(state[`solved${t}`] || {}).filter(([k]) => !state.owed?.[k]),
      ),
    goToTab: selectTab,
    glyphs: data.glyphs || ["★", "✓", "+", "="],
  });
  // A teacher can send a student straight to a station: ?s=4&i=1 opens section 4, problem 1; &lang=es starts in Spanish.
  // Nothing is marked solved by a link, and a saved position is only replaced when the link names one.
  {
    const q = new URLSearchParams(location.search);
    const sec = Number(q.get("s"));
    if (Number.isInteger(sec) && sec >= 1 && sec <= 5) {
      state.activeTab = sec;
      const at = Number(q.get("i"));
      if (Number.isInteger(at) && at >= 1 && at <= SECTIONS[sec - 1].items.length)
        state.idx[sec] = at - 1;
    }
    if (q.get("lang") === "es") state.showEs = true;
  }
  applyLang();
  TABS.forEach(render);
  selectTab(Math.min(5, Math.max(1, state.activeTab)));
  progress();
  hud();
  W.StudioInsight?.init(RT);
  W.StudioSeals?.init(RT);
  W.StudioRepair?.init(RT);
  W.StudioReflect?.init(RT);
  W.StudioWorked?.init(RT);
  W.StudioTrapBook?.init(RT);
  W.StudioPulse?.init(RT);
})();
