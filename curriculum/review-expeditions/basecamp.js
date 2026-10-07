/* Expedition campaigns: a shared, dependency-free adventure layer for review games.
 *
 * Rewards are DERIVED from each game's own record of validated correct work: the page
 * passes `pool()`, which reads the game's save (solved questions, earned stars). The
 * campaign never awards anything itself, so one correct answer can only ever count once,
 * and clicking around the campaign cannot create rewards. Players spend those rewards on
 * permanent story choices, chapter by chapter, toward a capstone with several endings.
 *
 * The campaign keeps its own versioned save, separate from the game's save, so existing
 * game saves load unchanged. No timers, no network, no dependencies.
 */
(() => {
  "use strict";

  const VERSION = 1;
  const worlds = {};

  const UI = {
    expedition: { en: "Expedition {n}", es: "Expedición {n}" },
    chapter: { en: "Chapter {i}", es: "Capítulo {i}" },
    chapterOf: { en: "Chapter {i} of {n}", es: "Capítulo {i} de {n}" },
    finale: { en: "Finale", es: "Final" },
    choose: {
      en: "Choose one path. Your choice is permanent for this expedition and changes the ending.",
      es: "Elige un camino. Tu elección es permanente en esta expedición y cambia el final.",
    },
    ready: { en: "Ready", es: "Listo" },
    need: { en: "Need {n} more", es: "Faltan {n}" },
    pick: { en: "Pick a path above.", es: "Elige un camino arriba." },
    short: {
      en: "Solve more problems correctly to earn {n} more {r}.",
      es: "Resuelve más problemas correctamente para ganar {n} {r} más.",
    },
    practice: { en: "Earn more: next challenge →", es: "Gana más: siguiente reto →" },
    available: { en: "to spend", es: "para usar" },
    earned: { en: "earned", es: "en total" },
    endings: { en: "Endings found", es: "Finales descubiertos" },
    complete: { en: "Expedition complete", es: "Expedición completa" },
    journey: { en: "Your path", es: "Tu camino" },
    again: { en: "Start a new expedition", es: "Comenzar una nueva expedición" },
    againNote: {
      en: "Choose different paths to discover the other endings. Everything you built stays in your journal.",
      es: "Elige otros caminos para descubrir los demás finales. Todo lo que construiste queda en tu diario.",
    },
    againCost: {
      en: "Each new expedition costs more, so keep solving to fund it.",
      es: "Cada nueva expedición cuesta más, así que sigue resolviendo para pagarla.",
    },
    gained: {
      en: "+{n} {r} earned from correct work",
      es: "+{n} {r} por trabajo correcto",
    },
    chosen: { en: "{c} chosen.", es: "Elegiste: {c}." },
    locked: { en: "Locked", es: "Bloqueado" },
    unlocks: { en: "Unlocks", es: "Desbloquea" },
    discount: {
      en: "Later chapters cost {n} less {r}",
      es: "Los capítulos siguientes cuestan {n} {r} menos",
    },
    route: { en: "Expedition route", es: "Ruta de la expedición" },
    wallet: { en: "Supplies", es: "Suministros" },
    open: { en: "Show the map", es: "Mostrar el mapa" },
    close: { en: "Hide the map", es: "Ocultar el mapa" },
  };

  const esc = (value) =>
    String(value ?? "").replace(
      /[&<>"']/g,
      (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c],
    );
  const isObj = (value) => !!value && typeof value === "object" && !Array.isArray(value);
  const counts = (value) => {
    const out = {};
    if (!isObj(value)) return out;
    for (const [key, n] of Object.entries(value)) {
      const num = Number(n);
      if (Number.isFinite(num) && num > 0) out[key] = Math.floor(num);
    }
    return out;
  };
  /* A variable may itself be bilingual ({ en, es }); it resolves in the text's own language. */
  const fill = (text, vars, lang = "en") =>
    text.replace(/\{(\w+)\}/g, (_, k) => {
      if (!(k in vars)) return "";
      const v = vars[k];
      return isObj(v) ? (lang === "es" ? v.es || v.en : v.en) : v;
    });

  function fresh() {
    return {
      v: VERSION,
      season: 1,
      picks: {},
      spent: {},
      banked: {},
      finished: false,
      endings: [],
      perks: [],
      seen: null,
      collapsed: false,
    };
  }

  /* Accepts any older or damaged save and returns a valid v1 state. Unknown fields drop. */
  function normalize(raw) {
    const state = fresh();
    if (!isObj(raw)) return state;
    state.season = Number.isInteger(raw.season) && raw.season > 0 ? raw.season : 1;
    if (isObj(raw.picks)) {
      for (const [ch, opt] of Object.entries(raw.picks))
        if (typeof opt === "string") state.picks[ch] = opt;
    }
    state.spent = counts(raw.spent);
    state.banked = counts(raw.banked);
    state.finished = raw.finished === true;
    state.endings = Array.isArray(raw.endings)
      ? raw.endings.filter((e) => typeof e === "string")
      : [];
    state.perks = Array.isArray(raw.perks) ? raw.perks.filter((p) => typeof p === "string") : [];
    state.collapsed = raw.collapsed === true;
    state.seen = isObj(raw.seen) ? counts(raw.seen) : null;
    return state;
  }

  function readSave(key) {
    try {
      return JSON.parse(localStorage.getItem(key) || "null");
    } catch (e) {
      return null;
    }
  }

  function mount(options) {
    const { host, storageKey, pool, onPractice, onChange } = options || {};
    const world = typeof options?.world === "string" ? worlds[options.world] : options?.world;
    if (!host || !storageKey || !world || typeof pool !== "function") {
      throw new Error("ExpeditionCampaign.mount needs host, storageKey, world, and pool()");
    }
    const total = typeof options.total === "function" ? options.total : () => ({});
    const lang = typeof options.lang === "function" ? options.lang : () => "en";
    const resources = world.resources;
    const mainRes = resources[0].id;
    const chapters = world.chapters;
    const permanent = world.spend === "permanent";
    let state = normalize(readSave(storageKey));
    let selected = null;
    let justBuilt = -1;
    let gain = null;

    host.classList.add("xc", `xc--${world.id}`);
    host.innerHTML = '<div class="xc-body"></div><p class="xc-sr" aria-live="polite"></p>';
    const body = host.querySelector(".xc-body");
    const live = host.querySelector(".xc-sr");

    const persist = () => {
      try {
        localStorage.setItem(storageKey, JSON.stringify(state));
      } catch (e) {
        /* storage blocked: keep playing in memory */
      }
    };

    /* Text helpers. Bilingual mode shows English with Spanish beneath it. */
    const mode = () => {
      const m = lang();
      return m === "es" || m === "bilingual" ? m : "en";
    };
    const plain = (text, vars = {}) => {
      if (text == null) return "";
      if (typeof text === "string") return fill(text, vars);
      return mode() === "es" ? fill(text.es || text.en, vars, "es") : fill(text.en, vars);
    };
    const t = (text, vars = {}) => {
      if (text == null) return "";
      if (typeof text === "string") return esc(fill(text, vars));
      if (mode() === "bilingual" && text.es && text.es !== text.en) {
        return `${esc(fill(text.en, vars))}<span class="xc-es" lang="es">${esc(fill(text.es, vars, "es"))}</span>`;
      }
      return esc(plain(text, vars));
    };
    const resName = (id, n) => {
      const r = resources.find((x) => x.id === id) || resources[0];
      const name = n === 1 && r.one ? r.one : r.name;
      // Keep both languages so t() can place each one in its own line in bilingual mode.
      return mode() === "bilingual" ? name : plain(name);
    };
    const resIcon = (id) => (resources.find((x) => x.id === id) || resources[0]).icon;

    /* Rewards and costs */
    const poolNow = () => {
      const raw = pool() || {};
      return typeof raw === "number" ? counts({ [mainRes]: raw }) : counts(raw);
    };
    const totals = () => {
      const raw = total() || {};
      return typeof raw === "number" ? counts({ [mainRes]: raw }) : counts(raw);
    };
    const available = (p = poolNow()) => {
      const out = {};
      for (const r of resources) {
        out[r.id] = Math.max(
          0,
          (p[r.id] || 0) - (state.spent[r.id] || 0) - (state.banked[r.id] || 0),
        );
      }
      return out;
    };
    const optionOf = (ch, id) => ch.options.find((o) => o.id === id) || null;
    const pickedOption = (index) => {
      const ch = chapters[index];
      return ch ? optionOf(ch, state.picks[ch.id]) : null;
    };
    const currentIndex = () => {
      const i = chapters.findIndex((ch) => !optionOf(ch, state.picks[ch.id]));
      return i === -1 ? chapters.length : i;
    };
    function costOf(base, index) {
      const raw = typeof base === "number" ? { [mainRes]: base } : base || {};
      const tot = world.costMode === "share" ? totals() : null;
      const out = {};
      for (const [res, value] of Object.entries(raw)) {
        let n = tot ? Math.max(1, Math.floor((tot[res] || 0) * value)) : value;
        for (let i = 0; i < index; i++) {
          const prior = pickedOption(i);
          if (prior?.discount?.[res]) n -= prior.discount[res];
        }
        n = Math.max(1, n);
        if (permanent && state.season > 1) n = Math.ceil(n * (1 + 0.5 * (state.season - 1)));
        out[res] = n;
      }
      return out;
    }
    const shortfall = (cost, avail) =>
      Object.entries(cost)
        .filter(([res, n]) => (avail[res] || 0) < n)
        .map(([res, n]) => [res, n - (avail[res] || 0)]);
    const costHTML = (cost) =>
      Object.entries(cost)
        .map(
          ([res, n]) =>
            `<span class="xc-chip" aria-label="${n} ${esc(plain(resName(res, n)))}"><span aria-hidden="true">${resIcon(res)}</span> ${n}</span>`,
        )
        .join("");

    function ending() {
      const tally = {};
      let last = null;
      chapters.forEach((_, i) => {
        const o = pickedOption(i);
        if (!o?.flag) return;
        tally[o.flag] = (tally[o.flag] || 0) + 1;
        last = o.flag;
      });
      let best = last;
      for (const [flag, n] of Object.entries(tally)) if (n > (tally[best] || 0)) best = flag;
      return best && world.endings[best] ? best : Object.keys(world.endings)[0];
    }

    /* Rendering */
    function walletHTML(avail, p) {
      return resources
        .map((r) => {
          const pop = gain?.[r.id]
            ? `<span class="xc-gain" aria-hidden="true">+${gain[r.id]}</span>`
            : "";
          return `<div class="xc-coin${gain?.[r.id] ? " xc-coin--up" : ""}"><span class="xc-coin-icon" aria-hidden="true">${r.icon}</span><span class="xc-coin-num">${avail[r.id]}</span><span class="xc-coin-label">${t(r.name)} <small>${t(UI.available)} · ${p[r.id] || 0} ${t(UI.earned)}</small></span>${pop}</div>`;
        })
        .join("");
    }

    function routeHTML(now) {
      const stops = chapters.map((ch, i) => {
        const o = pickedOption(i);
        const cls = o ? "done" : i === now ? "now" : "locked";
        return `<li class="xc-stop xc-stop--${cls}"${i === now ? ' aria-current="step"' : ""}><span class="xc-stop-dot" aria-hidden="true">${o ? o.icon || "✓" : i + 1}</span><span class="xc-stop-name">${t(ch.place)}</span><small>${o ? t(o.title) : i === now ? t(UI.chapter, { i: i + 1 }) : t(UI.locked)}</small></li>`;
      });
      const capCls = state.finished ? "done" : now === chapters.length ? "now" : "locked";
      stops.push(
        `<li class="xc-stop xc-stop--${capCls} xc-stop--cap"${now === chapters.length && !state.finished ? ' aria-current="step"' : ""}><span class="xc-stop-dot" aria-hidden="true">${world.capstone.icon}</span><span class="xc-stop-name">${t(world.capstone.place)}</span><small>${state.finished ? t(UI.complete) : t(UI.finale)}</small></li>`,
      );
      return `<ol class="xc-route" aria-label="${esc(plain(UI.route))}">${stops.join("")}</ol>`;
    }

    function optionHTML(o, cost, avail) {
      const lack = shortfall(cost, avail);
      const effects = [];
      if (o.perkLabel) effects.push(`${t(UI.unlocks)}: ${t(o.perkLabel)}`);
      if (o.discount) {
        for (const [res, n] of Object.entries(o.discount)) {
          effects.push(t(UI.discount, { n, r: resName(res, n) }));
        }
      }
      const status = lack.length
        ? lack.map(([res, n]) => `${t(UI.need, { n })} ${resIcon(res)}`).join(" · ")
        : t(UI.ready);
      return `<button type="button" class="xc-option${lack.length ? " xc-option--short" : ""}" data-xc-option="${esc(o.id)}" data-xc-focus="opt-${esc(o.id)}" aria-pressed="${selected === o.id}">
        <span class="xc-option-icon" aria-hidden="true">${o.icon || "◆"}</span>
        <strong>${t(o.title)}</strong>
        <span class="xc-option-text">${t(o.text)}</span>
        ${effects.length ? `<span class="xc-effect">${effects.join("<br>")}</span>` : ""}
        <span class="xc-option-foot"><span class="xc-cost">${costHTML(cost)}</span><span class="xc-status">${status}</span></span>
      </button>`;
    }

    function chapterHTML(index, avail) {
      const ch = chapters[index];
      const verb = world.verb || { en: "Commit", es: "Confirmar" };
      const choice = selected ? optionOf(ch, selected) : null;
      const cost = choice ? costOf(choice.cost, index) : null;
      const lack = choice ? shortfall(cost, avail) : [];
      const note = !choice
        ? t(UI.pick)
        : lack.length
          ? lack.map(([res, n]) => t(UI.short, { n, r: resName(res, n) })).join(" ")
          : "";
      return `<div class="xc-card">
        <p class="xc-step">${t(UI.chapterOf, { i: index + 1, n: chapters.length })} · ${t(ch.place)}</p>
        <h3>${t(ch.title)}</h3>
        <p class="xc-text">${t(ch.text)}</p>
        <p class="xc-rule">${t(UI.choose)}</p>
        <div class="xc-options">${ch.options.map((o) => optionHTML(o, costOf(o.cost, index), avail)).join("")}</div>
        <div class="xc-commit-row">
          <button type="button" class="xc-commit" data-xc-commit data-xc-focus="commit" ${choice && !lack.length ? "" : "disabled"}>${t(verb)}${choice ? `: ${t(choice.title)}` : ""}</button>
          <span class="xc-commit-note">${note}</span>
        </div>
      </div>`;
    }

    function capstoneHTML(avail) {
      const cap = world.capstone;
      const cost = costOf(cap.cost, chapters.length);
      const lack = shortfall(cost, avail);
      return `<div class="xc-card xc-card--cap">
        <p class="xc-step">${t(UI.finale)} · ${t(cap.place)}</p>
        <h3>${t(cap.title)}</h3>
        <p class="xc-text">${t(cap.text)}</p>
        <div class="xc-cap-cost"><span class="xc-cost">${costHTML(cost)}</span><span class="xc-status">${lack.length ? lack.map(([res, n]) => `${t(UI.need, { n })} ${resIcon(res)}`).join(" · ") : t(UI.ready)}</span></div>
        <div class="xc-commit-row">
          <button type="button" class="xc-commit xc-commit--cap" data-xc-capstone data-xc-focus="cap" ${lack.length ? "disabled" : ""}>${t(cap.verb)}</button>
          <span class="xc-commit-note">${lack.length ? lack.map(([res, n]) => t(UI.short, { n, r: resName(res, n) })).join(" ") : ""}</span>
        </div>
      </div>`;
    }

    function endingHTML() {
      const key = ending();
      const end = world.endings[key];
      const total = Object.keys(world.endings).length;
      const path = chapters
        .map((ch, i) => {
          const o = pickedOption(i);
          return o
            ? `<li><span aria-hidden="true">${o.icon || "◆"}</span> ${t(ch.place)}: <b>${t(o.title)}</b></li>`
            : "";
        })
        .join("");
      const found = Object.keys(world.endings)
        .map((k) => {
          const got = state.endings.includes(k);
          return `<li class="${got ? "xc-found" : "xc-missing"}">${got ? `${world.endings[k].icon} ${t(world.endings[k].title)}` : "？"}</li>`;
        })
        .join("");
      return `<div class="xc-card xc-card--end">
        <p class="xc-step">${t(UI.complete)} · ${t(UI.expedition, { n: state.season })}</p>
        <div class="xc-end-badge" aria-hidden="true">${end.icon}</div>
        <h3>${t(end.title)}</h3>
        <p class="xc-text">${t(end.text)}</p>
        <h4>${t(UI.journey)}</h4><ul class="xc-path">${path}</ul>
        <h4>${t(UI.endings)}: ${state.endings.length} / ${total}</h4><ul class="xc-endings">${found}</ul>
        <p class="xc-text">${t(UI.againNote)}${permanent ? ` ${t(UI.againCost)}` : ""}</p>
        <div class="xc-commit-row"><button type="button" class="xc-commit" data-xc-again data-xc-focus="again">${t(UI.again)}</button></div>
      </div>`;
    }

    function render() {
      // Celebrate rewards earned since the player last saw this panel (first visit counts from zero).
      const p = poolNow();
      const seen = state.seen || {};
      const up = {};
      for (const r of resources) {
        const d = (p[r.id] || 0) - (seen[r.id] || 0);
        if (d > 0) up[r.id] = d;
      }
      if (Object.keys(up).length) {
        gain = up;
        live.textContent = Object.entries(up)
          .map(([res, n]) => plain(UI.gained, { n, r: resName(res, n) }))
          .join(". ");
      }
      if (Object.keys(up).length || !state.seen || resources.some((r) => (seen[r.id] || 0) !== (p[r.id] || 0))) {
        state.seen = { ...p };
        persist();
      }
      const avail = available(p);
      const now = currentIndex();
      const focusKey = host.contains(document.activeElement)
        ? document.activeElement.dataset.xcFocus
        : null;
      const ctx = {
        built: chapters.map((_, i) => !!pickedOption(i)),
        picks: chapters.map((_, i) => pickedOption(i)?.id || null),
        now,
        finished: state.finished,
        justBuilt,
        season: state.season,
      };
      host.dataset.xcChapter = String(now);
      host.dataset.xcFinished = String(state.finished);
      const toggle = `<button type="button" class="xc-toggle" data-xc-toggle data-xc-focus="toggle" aria-expanded="${!state.collapsed}">${t(state.collapsed ? UI.open : UI.close)}</button>`;
      host.classList.toggle("xc--collapsed", state.collapsed);
      if (state.collapsed) {
        const step = state.finished ? t(UI.complete) : now < chapters.length ? t(chapters[now].place) : t(world.capstone.place);
        body.innerHTML = `
        <header class="xc-head xc-head--row">
          <div><p class="xc-kicker">${t(world.kicker)} · ${t(UI.expedition, { n: state.season })}</p>
          <h2 class="xc-title">${t(world.title)}</h2>
          <p class="xc-mini">${resources.map((r) => `<span class="xc-chip${gain?.[r.id] ? " xc-chip--up" : ""}"><span aria-hidden="true">${r.icon}</span> ${avail[r.id]} ${t(r.name)}</span>`).join(" ")} <span class="xc-mini-step">${step}</span></p></div>
          ${toggle}
        </header>`;
        gain = null;
        if (focusKey) body.querySelector(`[data-xc-focus="${focusKey}"]`)?.focus();
        return;
      }
      body.innerHTML = `
        <header class="xc-head xc-head--row">
          <div><p class="xc-kicker">${t(world.kicker)} · ${t(UI.expedition, { n: state.season })}</p>
          <h2 class="xc-title">${t(world.title)}</h2>
          <p class="xc-story">${t(world.story)}</p></div>
          ${toggle}
        </header>
        <div class="xc-scene${state.finished ? " xc-scene--finished" : ""}" aria-hidden="true">${world.scene(ctx)}</div>
        <div class="xc-wallet" role="group" aria-label="${esc(plain(UI.wallet))}">${walletHTML(avail, p)}<p class="xc-earn-rule">${t(world.earnRule)}</p></div>
        ${routeHTML(now)}
        <div class="xc-stage">${state.finished ? endingHTML() : now < chapters.length ? chapterHTML(now, avail) : capstoneHTML(avail)}</div>
        ${typeof onPractice === "function" && !state.finished ? `<div class="xc-foot"><button type="button" class="xc-practice" data-xc-practice data-xc-focus="practice">${t(world.practiceLabel || UI.practice)}</button></div>` : ""}`;
      gain = null;
      justBuilt = -1;
      if (focusKey) body.querySelector(`[data-xc-focus="${focusKey}"]`)?.focus();
    }

    function commitChoice() {
      const index = currentIndex();
      const ch = chapters[index];
      const choice = ch && selected ? optionOf(ch, selected) : null;
      if (!choice || state.finished) return;
      const cost = costOf(choice.cost, index);
      if (shortfall(cost, available()).length) return;
      for (const [res, n] of Object.entries(cost)) state.spent[res] = (state.spent[res] || 0) + n;
      state.picks[ch.id] = choice.id;
      if (choice.perk && !state.perks.includes(choice.perk)) state.perks.push(choice.perk);
      selected = null;
      justBuilt = index;
      persist();
      live.textContent = plain(UI.chosen, { c: plain(choice.title) });
      render();
      body.querySelector(".xc-commit, .xc-option")?.focus();
      onChange?.(api);
    }

    function commitCapstone() {
      if (state.finished || currentIndex() < chapters.length) return;
      const cost = costOf(world.capstone.cost, chapters.length);
      if (shortfall(cost, available()).length) return;
      for (const [res, n] of Object.entries(cost)) state.spent[res] = (state.spent[res] || 0) + n;
      state.finished = true;
      const key = ending();
      if (!state.endings.includes(key)) state.endings.push(key);
      if (world.capstone.perk && !state.perks.includes(world.capstone.perk))
        state.perks.push(world.capstone.perk);
      justBuilt = chapters.length;
      persist();
      live.textContent = `${plain(UI.complete)}: ${plain(world.endings[key].title)}`;
      render();
      body.querySelector("[data-xc-again]")?.focus();
      onChange?.(api);
    }

    function newExpedition() {
      if (!state.finished) return;
      if (permanent) {
        for (const [res, n] of Object.entries(state.spent))
          state.banked[res] = (state.banked[res] || 0) + n;
      }
      state.spent = {};
      state.picks = {};
      state.finished = false;
      state.season += 1;
      selected = null;
      persist();
      render();
      body.querySelector(".xc-option")?.focus();
      onChange?.(api);
    }

    body.addEventListener("click", (event) => {
      const target = event.target.closest("button");
      if (!target || !body.contains(target)) return;
      if (target.dataset.xcOption) {
        selected = target.dataset.xcOption;
        render();
        body.querySelector(`[data-xc-focus="opt-${CSS.escape(selected)}"]`)?.focus();
      } else if ("xcCommit" in target.dataset) commitChoice();
      else if ("xcCapstone" in target.dataset) commitCapstone();
      else if ("xcAgain" in target.dataset) newExpedition();
      else if ("xcPractice" in target.dataset) onPractice?.();
      else if ("xcToggle" in target.dataset) {
        state.collapsed = !state.collapsed;
        persist();
        render();
      }
    });

    const api = {
      refresh: render,
      hasPerk: (id) => state.perks.includes(id),
      perks: () => state.perks.slice(),
      available: () => available(),
      snapshot: () => JSON.parse(JSON.stringify(state)),
    };
    render();
    onChange?.(api);
    return api;
  }

  window.ExpeditionCampaign = { VERSION, worlds, mount, normalize };
})();
