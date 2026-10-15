/**
 * Unit 4 Practice Studio — engagement layer shared by every Unit 4 practice studio page (/math/unit-4/ folders ending in practice-studio).
 *
 * A page calls `U4Studio.init(cfg)` once after it has loaded its saved state and
 * `U4Studio.sync()` at the end of its own `updateProgressHeader()`. Everything else
 * (stars, rank, trail fill, celebration, section toast, My Stars dialog) is driven from
 * the page's existing `state.solved1..5` maps, so the page's answer-checking code is
 * untouched. Stars live in `state.play`, which the page already saves and restores.
 *
 * cfg = {
 *   state,                      the page's live state object
 *   totals: {1..5: number},     tasks per section (shown in My Stars)
 *   need:   {1..5: number},     solved count that completes a section (default = totals)
 *   goToTab(n),                 the page's selectTab
 *   solvedMap(n),               optional: where section n keeps its solved ids (default state.solved<n>)
 *   glyphs: string[],           what the celebration throws (default: stars and percents)
 *   bonus:  {...}               optional, see assets/u4-studio-bonus.js
 * }
 */
(() => {
  const W = /** @type {any} */ (window);
  const TABS = [1, 2, 3, 4, 5];
  const RANKS = [
    { name: "Starter", es: "Principiante", at: 0 },
    { name: "Explorer", es: "Explorador", at: 0.2 },
    { name: "Builder", es: "Constructor", at: 0.45 },
    { name: "Pro", es: "Profesional", at: 0.7 },
    { name: "Master", es: "Maestro", at: 0.92 },
  ];
  const FX_KEY = "u4-studio-fx";
  const KINDS = ["k-frac", "k-dec", "k-pct"];

  /** @type {any} */
  const S = { cfg: null, ready: false, fxOn: true };

  const $ = (/** @type {string} */ sel, root = document) => root.querySelector(sel);
  const el = (/** @type {string} */ tag, /** @type {string} */ cls, html = "") => {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html) n.innerHTML = html;
    return n;
  };
  const bilingual = (/** @type {string} */ en, /** @type {string} */ es) =>
    `${en}<span class="es-text">${es}</span>`;

  function readFx() {
    try {
      return localStorage.getItem(FX_KEY) !== "off";
    } catch (_e) {
      return true;
    }
  }

  function setFx(/** @type {boolean} */ on) {
    S.fxOn = on;
    document.body.classList.toggle("fx-off", !on);
    try {
      localStorage.setItem(FX_KEY, on ? "on" : "off");
    } catch (_e) {
      /* a blocked store only means the choice is not remembered */
    }
  }

  function play() {
    const st = S.cfg.state;
    if (!st.play || typeof st.play !== "object") st.play = {};
    const p = st.play;
    if (!p.stars || typeof p.stars !== "object") p.stars = {};
    if (!p.done || typeof p.done !== "object") p.done = {};
    if (!p.bonus || typeof p.bonus !== "object") p.bonus = {};
    return p;
  }

  /** Solved ids in a section. Random extra-practice items ("rand…") earn no stars. */
  function solvedIds(/** @type {number} */ tab) {
    const map = (S.cfg.solvedMap ? S.cfg.solvedMap(tab) : S.cfg.state[`solved${tab}`]) || {};
    return Object.keys(map).filter((k) => map[k] && !k.startsWith("rand"));
  }

  const need = (/** @type {number} */ tab) => (S.cfg.need || S.cfg.totals)[tab];

  function bonusStars() {
    return Object.values(play().bonus).reduce((a, b) => a + (Number(b) || 0), 0);
  }

  function totalStars() {
    return Object.keys(play().stars).length + bonusStars();
  }

  function maxStars() {
    const solvable = TABS.reduce((a, t) => a + S.cfg.totals[t], 0);
    const rounds = S.cfg.bonus ? S.cfg.bonus.rounds.length * 3 : 0;
    return solvable + rounds;
  }

  function rankFor(/** @type {number} */ stars) {
    const share = maxStars() ? stars / maxStars() : 0;
    let idx = 0;
    RANKS.forEach((r, i) => {
      if (share >= r.at) idx = i;
    });
    return { idx, ...RANKS[idx], next: RANKS[idx + 1] || null };
  }

  function say(/** @type {string} */ msg) {
    const live = $("#sr-live");
    if (!live) return;
    live.textContent = "";
    setTimeout(() => {
      live.textContent = msg;
    }, 25);
  }

  /* ---- Celebration -------------------------------------------------------- */
  function originPoint() {
    const panel = $(".tab-panel.active");
    const target = (panel && ($(".feedback-box.show", panel) || $(".stage-card", panel))) || null;
    const r = target ? target.getBoundingClientRect() : null;
    if (r && r.bottom > 0 && r.top < window.innerHeight) {
      return { x: r.left + Math.min(r.width / 2, 160), y: Math.max(r.top + 20, 80) };
    }
    return { x: window.innerWidth / 2, y: window.innerHeight / 3 };
  }

  /** Percent-and-fraction chips pop at the answer, then one star flies to the counter. */
  function burst() {
    if (!S.fxOn || !S.fx || !S.fx.isConnected) return;
    const glyphs = S.cfg.glyphs && S.cfg.glyphs.length ? S.cfg.glyphs : ["%", "\u00BD", "0.5"];
    const o = originPoint();
    for (let i = 0; i < 6; i++) {
      const a = (Math.PI * 2 * i) / 6 + Math.random() * 0.6;
      const d = 46 + Math.random() * 40;
      const s = el("span", `u4-spark ${KINDS[i % KINDS.length]}`);
      s.textContent = glyphs[i % glyphs.length];
      S.fx.appendChild(s);
      const dx = Math.cos(a) * d;
      const dy = Math.sin(a) * d - 20;
      const anim = s.animate(
        [
          { transform: `translate(${o.x}px, ${o.y}px) scale(0.5)`, opacity: 0 },
          {
            transform: `translate(${o.x + dx}px, ${o.y + dy}px) scale(1)`,
            opacity: 1,
            offset: 0.4,
          },
          {
            transform: `translate(${o.x + dx * 1.2}px, ${o.y + dy * 1.2 + 24}px) scale(0.9)`,
            opacity: 0,
          },
        ],
        { duration: 750, easing: "ease-out" },
      );
      anim.onfinish = () => s.remove();
    }
    const star = el("span", "u4-spark k-star");
    star.textContent = "\u2605 +1";
    S.fx.appendChild(star);
    const t = S.starsBtn ? S.starsBtn.getBoundingClientRect() : null;
    const tx = t ? t.left + t.width / 2 - 28 : window.innerWidth - 120;
    const ty = t ? Math.max(t.top, 8) : 8;
    const fly = star.animate(
      [
        { transform: `translate(${o.x}px, ${o.y}px) scale(0.6)`, opacity: 0 },
        { transform: `translate(${o.x}px, ${o.y - 40}px) scale(1.15)`, opacity: 1, offset: 0.25 },
        { transform: `translate(${tx}px, ${ty}px) scale(0.8)`, opacity: 0.9 },
      ],
      { duration: 1000, easing: "ease-in-out" },
    );
    fly.onfinish = () => star.remove();
  }

  /* ---- Header, trail, toast ------------------------------------------------ */
  function injectHeader() {
    const actions = $(".header-actions");
    if (!actions) return;
    const stars = el("button", "top-btn stars-btn");
    stars.type = "button";
    stars.id = "u4-stars-btn";
    stars.addEventListener("click", openStars);
    actions.prepend(stars);
    S.starsBtn = stars;
    if (S.cfg.bonus && W.U4Studio.bonus) {
      const b = el("button", "top-btn bonus-btn", "🎮 Bonus Round");
      b.type = "button";
      b.id = "u4-bonus-btn";
      b.addEventListener("click", () => W.U4Studio.bonus.open());
      actions.prepend(b);
    }
  }

  function injectLayers() {
    const fx = el("div", "");
    fx.id = "u4-fx";
    fx.setAttribute("aria-hidden", "true");
    document.body.appendChild(fx);
    S.fx = fx;
    const toast = el("div", "u4-toast");
    toast.hidden = true;
    toast.setAttribute("role", "status");
    document.body.appendChild(toast);
    S.toast = toast;
  }

  function showToast(
    /** @type {string} */ html,
    /** @type {{label:string, run:() => void} | null} */ action,
  ) {
    const t = S.toast;
    t.innerHTML = `<span>${html}</span>`;
    if (action) {
      const go = el("button", "btn btn-go btn-sm");
      go.type = "button";
      go.innerHTML = action.label;
      go.addEventListener("click", () => {
        t.hidden = true;
        action.run();
      });
      t.appendChild(go);
    }
    const x = el("button", "u4-toast-close", "×");
    x.type = "button";
    x.setAttribute("aria-label", "Dismiss");
    x.addEventListener("click", () => {
      t.hidden = true;
    });
    t.appendChild(x);
    t.hidden = false;
    clearTimeout(S.toastTimer);
    S.toastTimer = setTimeout(() => {
      t.hidden = true;
    }, 14000);
  }

  function refresh() {
    const stars = totalStars();
    const rank = rankFor(stars);
    if (S.starsBtn) {
      S.starsBtn.textContent = `⭐ ${stars} · ${rank.name}`;
      S.starsBtn.setAttribute(
        "aria-label",
        `My stars: ${stars}. Level ${rank.idx + 1}, ${rank.name}. Open details.`,
      );
    }
    // Each stretch of the trail fills as its section is solved; the last stop has no stretch after it.
    const ratio = (/** @type {number} */ t) => Math.min(1, solvedIds(t).length / need(t));
    const list = $(".tab-list");
    if (list)
      list.style.setProperty("--trail", String((ratio(1) + ratio(2) + ratio(3) + ratio(4)) / 4));
    return { stars, rank };
  }

  /** Stamp the cross-lesson passport (assets/studio/store.js), the same one the generated studios write. */
  function passportStamp() {
    const m = location.pathname.match(/\/math\/unit-4\/([^/]+)\//);
    if (!m) return;
    const slug = m[1];
    const lesson = slug.startsWith("percent-practice-studio")
      ? "4-1"
      : (slug.match(/^(4-\d+)-practice-studio/) || [])[1];
    if (!lesson) return;
    const mode = /-challenging$/.test(slug) ? "challenge" : "practice";
    let done = 0;
    let total = 0;
    for (const t of TABS) {
      done += Math.min(need(t), solvedIds(t).length);
      total += need(t);
    }
    const write = () =>
      W.StudioStore.passport.update(
        lesson,
        mode,
        done,
        total,
        mode === "challenge" && solvedIds(5).length >= need(5),
      );
    if (W.StudioStore) return write();
    if (S.storeLoading) return;
    S.storeLoading = true;
    const tag = document.createElement("script");
    tag.src = "/assets/studio/store.js";
    tag.onload = write;
    document.head.append(tag);
  }

  /** Award stars for newly solved items and announce finished sections. */
  function sync() {
    if (!S.ready) return;
    const p = play();
    let fresh = 0;
    for (const t of TABS) {
      for (const id of solvedIds(t)) {
        const key = `t${t}:${id}`;
        if (!p.stars[key]) {
          p.stars[key] = 1;
          fresh++;
        }
      }
    }
    const before = S.lastStars;
    const { stars, rank } = refresh();
    S.lastStars = stars;
    if (fresh) {
      if (S.cfg.save) S.cfg.save();
      if (S.starsBtn) {
        S.starsBtn.classList.remove("bump");
        void S.starsBtn.offsetWidth;
        S.starsBtn.classList.add("bump");
      }
      burst();
      say(`Star earned. ${stars} stars.`);
    }
    if (before !== undefined && rank.idx > S.lastRank) {
      showToast(
        bilingual(
          `<strong>Level up!</strong> You are now a ${rank.name}.`,
          `Subiste de nivel: ${rank.es}.`,
        ),
        null,
      );
    }
    S.lastRank = rank.idx;
    passportStamp();
    announceSections();
  }

  function announceSections() {
    const p = play();
    for (const t of TABS) {
      if (p.done[t] || solvedIds(t).length < need(t)) continue;
      p.done[t] = 1;
      if (!S.announce) continue;
      const all = TABS.every((x) => p.done[x]);
      if (all) {
        showToast(
          bilingual(
            "<strong>Every section is complete!</strong> Check your stars.",
            "¡Terminaste todas las secciones! Mira tus estrellas.",
          ),
          { label: "My stars", run: openStars },
        );
      } else {
        const n = TABS.find((x) => x > t && !p.done[x]);
        showToast(
          bilingual(`<strong>Section ${t} complete!</strong>`, `¡Sección ${t} completa!`),
          n ? { label: `Go to section ${n}`, run: () => S.cfg.goToTab(n) } : null,
        );
      }
      break;
    }
  }

  /* ---- My Stars dialog ----------------------------------------------------- */
  function dialog(
    /** @type {string} */ id,
    /** @type {string} */ title,
    /** @type {string} */ titleEs,
  ) {
    let d = /** @type {HTMLDialogElement | null} */ ($(`#${id}`));
    if (d) d.remove();
    d = /** @type {HTMLDialogElement} */ (el("dialog", "u4-dialog"));
    d.id = id;
    d.setAttribute("aria-labelledby", `${id}-title`);
    d.innerHTML = `<div class="u4-dialog-head"><h2 id="${id}-title">${bilingual(title, titleEs)}</h2><button type="button" class="u4-close">Close</button></div><div class="u4-dialog-body"></div>`;
    $(".u4-close", d)?.addEventListener("click", () => d?.close());
    d.addEventListener("click", (e) => {
      if (e.target === d) d?.close();
    });
    document.body.appendChild(d);
    return d;
  }

  function openStars() {
    const p = play();
    const stars = totalStars();
    const rank = rankFor(stars);
    const d = dialog("u4-stars", "My Stars", "Mis estrellas");
    const body = /** @type {HTMLElement} */ ($(".u4-dialog-body", d));
    const toNext = rank.next ? Math.ceil(rank.next.at * maxStars()) - stars : 0;
    const bar = rank.next
      ? Math.min(100, Math.round((stars / Math.ceil(rank.next.at * maxStars())) * 100))
      : 100;
    const names = [...document.querySelectorAll(".tab-name")].map((n) => n.textContent);
    const rows = TABS.map((t) => {
      const n = solvedIds(t).length;
      const pct = Math.min(100, Math.round((n / S.cfg.totals[t]) * 100));
      return `<li class="${p.done[t] ? "is-done" : ""}"><span>${t}. ${names[t - 1] || ""}</span><span class="u4-meter" aria-hidden="true"><i style="width:${pct}%"></i></span><span>${n} / ${S.cfg.totals[t]}</span></li>`;
    }).join("");
    const bonus = S.cfg.bonus
      ? `<p><strong>Bonus Round:</strong> ${bonusStars()} of ${S.cfg.bonus.rounds.length * 3} stars</p>`
      : "";
    body.innerHTML = `
      <div class="u4-rank">
        <div class="u4-rank-badge"><b>${rank.idx + 1}</b><span>LEVEL</span></div>
        <div class="u4-rank-text">
          <h3>${bilingual(rank.name, rank.es)}</h3>
          <p>${stars} stars${rank.next ? ` · ${toNext} more to reach ${rank.next.name}` : " · top level"}</p>
          <div class="u4-meter" aria-hidden="true"><i style="width:${bar}%"></i></div>
        </div>
      </div>
      <ul class="u4-sections">${rows}</ul>
      ${bonus}
      <label class="u4-setting"><input type="checkbox" id="u4-fx-toggle" ${S.fxOn ? "checked" : ""}> Celebration effects</label>`;
    $("#u4-fx-toggle", body)?.addEventListener("change", (e) =>
      setFx(/** @type {HTMLInputElement} */ (e.target).checked),
    );
    d.showModal();
  }

  /* ---- Examine: a step that asks what the answer MEANS instead of for a number to copy ---- */
  /** @type {Record<string, number>} */
  const picks = {};
  const fmt = (/** @type {number} */ n) => String(Math.round(n * 1e6) / 1e6);

  /**
   * "What does your percent say?" for percent `n` found from a part of `whole`.
   * Built from the problem's own numbers, so the right sentence is right by construction and
   * the wrong ones are the real misreadings (out of the old whole, flipped, or "more than").
   */
  function meaningCheck(/** @type {number} */ n, /** @type {number} */ whole) {
    const p = fmt(n);
    const right = {
      en: `${p}% means ${p} out of every 100.`,
      es: `${p}% significa ${p} de cada 100.`,
    };
    const wrong = [];
    if (whole && whole !== 100) {
      wrong.push({
        en: `${p}% means ${p} out of every ${fmt(whole)}.`,
        es: `${p}% significa ${p} de cada ${fmt(whole)}.`,
      });
    }
    wrong.push(
      { en: `${p}% means 100 out of every ${p}.`, es: `${p}% significa 100 de cada ${p}.` },
      { en: `${p}% means ${p} more than 100.`, es: `${p}% significa ${p} más que 100.` },
      { en: `${p}% means ${p} out of every 10.`, es: `${p}% significa ${p} de cada 10.` },
    );
    const choices = wrong.filter((c) => c.en !== right.en).slice(0, 2);
    const at = Math.round(n * 7) % 3;
    choices.splice(at, 0, right);
    return {
      prompt: "Look at your percent. Which sentence says what it means?",
      promptEs: "Mira tu porcentaje. ¿Qué oración dice lo que significa?",
      choices,
      correct: at,
    };
  }

  /** Markup for an examine step; clicks are handled once, at the document. */
  function examineHtml(/** @type {string} */ group, /** @type {any} */ ex) {
    delete picks[group];
    const rows = ex.choices
      .map(
        (/** @type {{en: string, es: string}} */ c, /** @type {number} */ i) =>
          `<button type="button" class="choice-btn" role="radio" aria-checked="false" data-examine-pick="${i}">${bilingual(c.en, c.es)}</button>`,
      )
      .join("");
    return `<div class="examine" data-examine="${group}" role="radiogroup" aria-label="${ex.prompt}"><div class="choice-stack">${rows}</div></div>`;
  }

  const examinePicked = (/** @type {string} */ group) => (group in picks ? picks[group] : -1);

  /** Colour the picked sentence once the page has judged it. */
  function examineMark(/** @type {string} */ group, /** @type {boolean} */ ok) {
    const box = $(`[data-examine="${group}"]`);
    if (!box) return;
    for (const b of box.querySelectorAll(".choice-btn")) {
      const on = b.getAttribute("aria-checked") === "true";
      b.classList.toggle("correct", on && ok);
      b.classList.toggle("wrong", on && !ok);
    }
  }

  function onExamineClick(/** @type {Event} */ e) {
    const btn = /** @type {HTMLElement | null} */ (
      /** @type {HTMLElement} */ (e.target).closest("[data-examine-pick]")
    );
    const box = btn?.closest("[data-examine]");
    if (!btn || !box) return;
    picks[/** @type {HTMLElement} */ (box).dataset.examine || ""] = Number(btn.dataset.examinePick);
    for (const b of box.querySelectorAll(".choice-btn")) {
      b.setAttribute("aria-checked", String(b === btn));
      b.classList.remove("correct", "wrong");
      b.classList.toggle("selected", b === btn);
    }
  }

  /* ---- Public API ---------------------------------------------------------- */
  function init(/** @type {any} */ cfg) {
    S.cfg = cfg;
    S.announce = false;
    document.addEventListener("click", onExamineClick);
    play();
    setFx(readFx());
    injectLayers();
    injectHeader();
    S.ready = true;
    rebase();
    S.announce = true;
  }

  /** Treat everything solved right now as already celebrated (page load, Save/Resume restore). */
  function rebase() {
    const p = play();
    for (const t of TABS) {
      for (const id of solvedIds(t)) p.stars[`t${t}:${id}`] = 1;
      if (solvedIds(t).length >= need(t)) p.done[t] = 1;
    }
    const r = refresh();
    S.lastStars = r.stars;
    S.lastRank = r.rank.idx;
  }

  /** The page's "Reset all" cleared its solved maps: forget the stars too. */
  function reset() {
    S.cfg.state.play = {};
    play();
    rebase();
  }

  W.U4Studio = {
    init,
    sync,
    rebase,
    reset,
    meaningCheck,
    examineHtml,
    examinePicked,
    examineMark,
    dialog,
    totalStars,
    refresh,
    /** @param {(cfg: any) => any} fn */
    withCfg: (fn) => fn(S.cfg),
    /** Bonus Round hooks: persist best stars for a round and refresh the header. */
    recordBonus(/** @type {number} */ round, /** @type {number} */ stars) {
      const p = play();
      if ((p.bonus[round] || 0) < stars) p.bonus[round] = stars;
      refresh();
      if (S.cfg.save) S.cfg.save();
    },
    bonusBest: (/** @type {number} */ round) => play().bonus[round] || 0,
    burst,
    say,
  };
})();
