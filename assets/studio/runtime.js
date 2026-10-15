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
  const KEY = String(data.storageKey) + (PATH.scaffold ? "_p1" : "");
  const lvl = (/** @type {number} */ n) => (PATH.scaffold ? Math.max(1, n - 1) : n);
  const SECTIONS = /** @type {any[]} */ (data.sections);
  const TABS = [1, 2, 3, 4, 5];
  const { esc, es } = RT.util;
  const state = W.StudioStore.load(KEY);
  /** wrong tries this session, per item id (a fresh page load starts a fresh count) */
  /** @type {Record<string, number>} */
  const tries = {};
  /** @type {Set<string>} */
  const counted = new Set();

  const $ = (/** @type {string} */ sel, /** @type {ParentNode} */ root = document) =>
    /** @type {any} */ (root.querySelector(sel));
  const solvedMap = (/** @type {number} */ tab) => state[`solved${tab}`];
  const stg = (/** @type {number} */ tab) => /** @type {HTMLElement} */ ($(`#stage-${tab}`));
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
    1000 + (hash(`${data.lesson}|${data.mode}|${id}`) % 90000);

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
    const list = hs
      .slice(0, shown)
      .map(
        (/** @type {string} */ h, /** @type {number} */ i) =>
          `<li>${esc(h)}${es((it.hEs || [])[i])}</li>`,
      )
      .join("");
    const more = shown < hs.length;
    const tutor =
      !more && W.StudioTutor
        ? `<button type="button" class="btn btn-sm" data-tutor="${esc(it.id)}">Ask for help</button>`
        : "";
    return `<div class="hint-area"><ol class="hint-list">${list}</ol>${more ? `<button type="button" class="btn btn-sm" data-hint="${esc(it.id)}">💡 ${shown ? "Another hint" : "Give me a hint"}</button>` : ""}${tutor}</div>`;
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
      }
    });
    fb.append(b);
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
      misses: () => tries[it.id] || 0,
      hintBlock: () => hintHtml(it),
      openHint: () => /** @type {HTMLElement|null} */ ($("[data-hint]", host))?.click(),
      showSolved(/** @type {string} */ html) {
        fb("ok", html);
        if (!redeem) nextButton(tab, host);
      },
      solve(/** @type {string} */ html) {
        const rep = !redeem && !!solvedMap(tab)[it.id] && !isSolved(tab, it);
        const first = !tries[it.id];
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
        fb("ok", `<strong>${voice("ok", it.id)}</strong> ${html}`);
        say("Correct");
        if (redeem) {
          o.onSolved?.();
        } else {
          if (!rep) {
            solvedMap(tab)[it.id] = true;
            if (it.reroll) state.solvedSeed[it.id] = it.seed;
          }
          nextButton(tab, host);
        }
        W.StudioBus.emit("answer", {
          lesson: data.lesson,
          mode: data.mode,
          itemId: it.id,
          kind: it.k,
          ok: true,
          tries: (tries[it.id] || 0) + 1,
          hints: state.hints[it.id] || 0,
          tag: null,
          skill: it.skill || null,
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
        hud();
        save();
      },
      miss(/** @type {any} */ m) {
        tries[it.id] = (tries[it.id] || 0) + 1;
        if (!counted.has(`${it.id}@${it.seed}`)) {
          counted.add(`${it.id}@${it.seed}`);
          state.stats.tries++;
        }
        state.stats.streak = 0;
        const cal = state.calib[it.id];
        if (cal && cal.ok === null) cal.ok = false;
        const text =
          m.say || m.generic || "Look again at what the question asks, then try another choice.";
        const textEs = m.sayEs || (m.say ? "" : m.genericEs) || "";
        const nudge =
          tries[it.id] >= 2 && (it.h || []).length > (state.hints[it.id] || 0)
            ? `<p class="item-sub">Stuck? Open a hint below.${es("¿Atascado? Abre una pista abajo.")}</p>`
            : "";
        fb(
          m.kind || "err",
          `${m.noLead ? "" : `<strong>${voice("retry", it.id)}</strong> `}${esc(text)}${es(textEs)}${nudge}`,
        );
        say("Not yet");
        W.StudioBus.emit("answer", {
          lesson: data.lesson,
          mode: data.mode,
          itemId: it.id,
          kind: it.k,
          ok: false,
          tries: tries[it.id],
          hints: state.hints[it.id] || 0,
          tag: m.tag || null,
          say: text,
          wrong: m.wrongText ?? null,
          skill: it.skill || null,
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
      const done = !!solvedMap(tab)[idOf(tab, i)];
      const b = document.createElement("button");
      b.type = "button";
      b.className = `step-dot ${i === state.idx[tab] ? "active" : ""} ${done ? "solved" : ""}`;
      b.textContent = done ? `${i + 1} ✓` : String(i + 1);
      b.setAttribute("aria-label", `Problem ${i + 1}${done ? " completed" : ""}`);
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
      ${it.skill ? `<span class="chip chip-skill">${esc(lang && it.skillEs ? it.skillEs : it.skill)}</span>` : ""}
      ${it.lvl ? `<span class="chip chip-level" role="img" aria-label="Level ${it.lvl} of 4">${stars(it.lvl)}</span>` : ""}
      <span class="item-tools">${it.reroll ? `<button type="button" class="tool-btn" data-reroll>🎲 ${lang ? "Números nuevos" : "New numbers"}</button>` : ""}<button type="button" class="tool-btn" data-read aria-label="Read this problem aloud">🔊 ${lang ? "Leer" : "Read"}</button></span></div>`;
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
    delete tries[id];
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
    if (sec.conf && (it.k === "mc" || it.k === "num") && !isSolved(tab, it)) confRow(it, host);
    dots(tab);
    for (const b of /** @type {HTMLElement[]} */ ([...stage.querySelectorAll("[data-reroll]")]))
      b.addEventListener("click", () => {
        const id = it.id;
        const isPool = SECTIONS[tab - 1].items[i].k === "pool";
        const cur = state.seeds[id] ?? (isPool ? 0 : baseSeed(id));
        state.seeds[id] = isPool ? cur + 1 : cur + 1 + Math.floor(Math.random() * 997);
        wipeItem(id);
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

  function progress() {
    const counts = TABS.map((t) => Object.keys(solvedMap(t)).length);
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
        banner.innerHTML = `<strong>${esc(data.bannerText)}</strong>${es(data.bannerTextEs)}<span class="banner-actions"><button type="button" class="btn btn-sm" data-open-think>See my thinking map</button>${data.otherUrl ? `<a class="btn btn-go btn-sm" href="${esc(data.otherUrl)}">${esc(data.otherLabel)}</a>` : ""}</span>`;
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
    for (const k of Object.keys(tries)) delete tries[k];
    counted.clear();
    W.U4Studio?.reset();
    W.StudioStore.clear(KEY);
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
    sections: SECTIONS,
    tabs: TABS,
  };
  W.U4Studio?.init({
    state,
    save,
    totals: Object.fromEntries(TABS.map((t) => [t, SECTIONS[t - 1].items.length])),
    need: Object.fromEntries(TABS.map((t) => [t, SECTIONS[t - 1].items.length])),
    goToTab: selectTab,
    glyphs: data.glyphs || ["★", "✓", "+", "="],
  });
  applyLang();
  TABS.forEach(render);
  selectTab(Math.min(5, Math.max(1, state.activeTab)));
  progress();
  hud();
  W.StudioInsight?.init(RT);
})();
