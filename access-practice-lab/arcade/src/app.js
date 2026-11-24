// Activity Arcade: hub, router and chrome. The five activities are separate
// modules loaded on demand so the hub stays light.
import { qs, qsa, esc, announce, formatNumber } from "./core/dom.js";
import { fx } from "./core/fx.js";
import { sound, stopSpeaking } from "./core/audio.js";
import { store, levelInfo } from "./core/store.js";
import { t, setLang, lang, applyChrome } from "./core/i18n.js";
import { toast } from "./core/toast.js";
import { GameShell } from "./core/shell.js";

const GAMES = [
  {
    id: "grammar-jungle",
    title: ["Grammar Jungle", "Selva de gramática"],
    skill: "Writing",
    art: "jungle",
    minutes: 7,
    tag: [
      "Swing the canopy by finding the word that breaks a rule — then repair it.",
      "Cruza la selva encontrando la palabra que rompe una regla y corrígela.",
    ],
    focus: ["Subject–verb agreement", "Verb tense", "Precise word choice"],
    load: () => import("./games/grammar-jungle.js"),
  },
  {
    id: "vocab-quest",
    title: ["Vocabulary Quest", "Misión del vocabulario"],
    skill: "Reading",
    art: "trail",
    minutes: 7,
    tag: [
      "Travel a trail of three gates: meaning, sentence, and context.",
      "Recorre un sendero de tres puertas: significado, oración y contexto.",
    ],
    focus: ["Academic words", "Context clues", "Spanish support"],
    load: () => import("./games/vocab-quest.js"),
  },
  {
    id: "story-detective",
    title: ["Story Detective", "Detective de cuentos"],
    skill: "Reading",
    art: "detective",
    minutes: 8,
    tag: [
      "Pin the evidence, then name the inference. Two cases per grade band.",
      "Fija la evidencia y nombra la inferencia. Dos casos por banda.",
    ],
    focus: ["Evidence", "Inference", "Cause and effect"],
    load: () => import("./games/story-detective.js"),
  },
  {
    id: "sound-studio",
    title: ["Sound & Word Studio", "Estudio de sonido y palabra"],
    skill: "Listening",
    art: "studio",
    minutes: 6,
    tag: [
      "Rebuild a word from its syllables on the mixer, then find the strong beat.",
      "Forma una palabra con sus sílabas en el mezclador y halla el golpe fuerte.",
    ],
    focus: ["Syllables", "Word stress", "Decoding"],
    load: () => import("./games/sound-studio.js"),
  },
  {
    id: "fluency-echo",
    title: ["Echo Canyon", "Cañón del eco"],
    skill: "Speaking",
    art: "echo",
    minutes: 6,
    tag: [
      "Echo a modelled line, hear yourself back, and judge your own rhythm.",
      "Repite una línea modelo, escúchate y juzga tu propio ritmo.",
    ],
    focus: ["Phrasing", "Pace", "Self-assessment"],
    load: () => import("./games/fluency-echo.js"),
  },
];

const SKILLS = ["Listening", "Reading", "Speaking", "Writing"];
const SKILL_VAR = {
  Listening: "#075568",
  Reading: "#2e4a94",
  Speaking: "#8a3a5c",
  Writing: "#9a4a26",
};

const BAND_KEY = "tlp.arcade.band";
const TEXT_STEPS = ["0", "1", "2"];

let band = localStorage.getItem(BAND_KEY) || "3-5";
let filter = "all";
let activeShell = null;
let activeGameId = null;

const main = qs("#main");

/* ------------------------------------------------------------------ chrome */

function icon(name) {
  if (name === "sound") {
    return '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 9.5h3l4-3.5v12l-4-3.5H4z"/><path d="M15.5 8.5a6 6 0 010 7"/><path d="M18 6a9.5 9.5 0 010 12"/></svg>';
  }
  return '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 9.5h3l4-3.5v12l-4-3.5H4z"/><path d="M16 9.5l5 5m0-5l-5 5"/></svg>';
}

function syncChrome() {
  document.documentElement.lang = lang();
  document.documentElement.dataset.text = String(store.settings.text ?? 0);

  const soundBtn = qs('[data-act="sound"]');
  if (soundBtn) {
    soundBtn.innerHTML = icon(sound.enabled ? "sound" : "mute");
    soundBtn.setAttribute("aria-pressed", String(sound.enabled));
    soundBtn.setAttribute(
      "aria-label",
      sound.enabled ? `${t("common.sound")}: on` : `${t("common.sound")}: off`
    );
  }

  qsa("[data-lang]").forEach((btn) => {
    btn.setAttribute("aria-pressed", String(btn.dataset.lang === lang()));
  });

  const navArcade = qs('[data-nav="arcade"]');
  if (navArcade) navArcade.textContent = t("nav.arcade");
  const navJourney = qs('[data-nav="journey"]');
  if (navJourney) navJourney.textContent = t("nav.journey");
  const howBtn = qs('[data-open="how"]');
  if (howBtn) howBtn.textContent = t("nav.how");
}

qs('[data-act="sound"]')?.addEventListener("click", () => {
  stopSpeaking();
  store.setSetting("sound", !sound.enabled);
  syncChrome();
  if (sound.enabled) {
    sound.click();
    toast(t("common.sound"), { icon: "♪", detail: "On", ms: 1500 });
  }
});

qs('[data-act="text"]')?.addEventListener("click", () => {
  const next = (Number(store.settings.text || 0) + 1) % TEXT_STEPS.length;
  store.setSetting("text", next);
  syncChrome();
  toast(t("common.textSize"), {
    icon: "A",
    detail: `${next + 1} / ${TEXT_STEPS.length}`,
    ms: 1400,
  });
  sound.click();
});

qsa("[data-lang]").forEach((btn) => {
  btn.addEventListener("click", () => {
    const next = btn.dataset.lang;
    if (next === lang()) return;
    if (activeShell) {
      const ok = window.confirm(
        lang() === "es"
          ? "Cambiar el idioma reinicia esta actividad. ¿Continuar?"
          : "Changing language restarts this activity. Continue?"
      );
      if (!ok) return;
    }
    setLang(next);
    syncChrome();
    sound.click();
    if (activeGameId) {
      openGame(activeGameId, { band });
    } else {
      renderHub();
    }
  });
});

qs('[data-open="how"]')?.addEventListener("click", openHow);

function openHow() {
  const prior = qs("#hub-modal");
  prior?.remove();
  const modal = document.createElement("div");
  modal.id = "hub-modal";
  modal.className = "modal-backdrop";
  modal.innerHTML = `
    <div class="modal" role="dialog" aria-modal="true" aria-labelledby="how-title">
      <p class="modal-kicker">${t("nav.arcade")}</p>
      <h2 id="how-title">${t("how.title")}</h2>
      <p class="modal-sub">${t("how.p1")}</p>
      <p class="modal-sub">${t("how.p2")}</p>
      <p class="modal-sub">${t("how.p3")}</p>
      <div class="modal-actions">
        <button class="btn btn-primary" type="button" data-close>${t("how.close")}</button>
      </div>
    </div>`;
  document.body.appendChild(modal);
  document.body.classList.add("has-modal");
  const close = () => {
    modal.remove();
    document.body.classList.remove("has-modal");
    qs('[data-open="how"]')?.focus({ preventScroll: true });
  };
  modal.addEventListener("click", (event) => {
    if (event.target === modal || event.target.closest("[data-close]")) close();
  });
  document.addEventListener(
    "keydown",
    (event) => {
      if (event.key === "Escape" && document.body.contains(modal)) close();
    },
    { once: true }
  );
  window.setTimeout(() => modal.querySelector("[data-close]")?.focus(), 60);
}

/* -------------------------------------------------------------------- hub */

function missionTasks() {
  const done = store.dailyDone();
  return [
    { id: "daily.one", label: t("daily.one"), hint: t("card.play") },
    { id: "daily.two", label: t("daily.two"), hint: "★ ★" },
    { id: "daily.three", label: t("daily.three"), hint: t("filter.all") },
  ].map((task) => ({ ...task, done: done.includes(task.id) }));
}

function bestOf(id) {
  return store.state.games[id]?.stars || 0;
}

function starRow(stars, label = "") {
  return `<span class="stars" aria-label="${stars} ${t("common.stars")} ${esc(label)}">${[1, 2, 3]
    .map((n) => `<i class="${n <= stars ? "on" : ""}">★</i>`)
    .join("")}</span>`;
}

function cardHTML(meta) {
  const stars = bestOf(meta.id);
  const played = !!store.state.games[meta.id];
  const title = meta.title[lang() === "es" ? 1 : 0];
  const tag = meta.tag[lang() === "es" ? 1 : 0];
  return `
    <article class="card" style="--skill:${SKILL_VAR[meta.skill]}">
      <a class="card-art" href="#/play/${meta.id}" tabindex="-1" aria-hidden="true">
        <img src="./assets/art/${meta.art}.jpg" alt="" decoding="async" width="624" height="416" />
        <span class="skill-tag"><i aria-hidden="true"></i>${t(`skill.${meta.skill}`)}</span>
        ${!played ? `<span class="new-pill">${t("card.new")}</span>` : ""}
      </a>
      <div class="card-body">
        <h3><a href="#/play/${meta.id}">${esc(title)}</a></h3>
        <p class="card-tag">${esc(tag)}</p>
        <ul class="card-meta">
          <li>${t(`band.${band}`)}</li>
          <li>${meta.minutes} ${t("card.minutes")}</li>
          <li>${played ? `${t("card.best")} ${starRow(stars)}` : `<span class="muted">${t("card.new")}</span>`}</li>
        </ul>
        <div class="card-foot">
          <span class="card-skill">${meta.focus[0]}</span>
          <a class="btn btn-card" href="#/play/${meta.id}">
            ${played ? t("card.replay") : t("card.play")}
          </a>
        </div>
      </div>
    </article>`;
}

function gridHTML() {
  const list = GAMES.filter((meta) => filter === "all" || meta.skill === filter);
  if (!list.length) {
    return `<p class="empty">${t("journey.empty")}</p>`;
  }
  return list.map(cardHTML).join("");
}

function recommended() {
  const ranked = [...GAMES].sort((a, b) => bestOf(a.id) - bestOf(b.id));
  return ranked[0];
}

function renderHub() {
  destroyGame();
  activeGameId = null;
  document.title = `Activity Arcade · The Language Page`;

  const level = levelInfo();
  const rank = level.rank[lang() === "es" ? "es" : "en"];
  const played = Object.values(store.state.games).reduce((n, g) => n + (g.plays || 0), 0);
  const stars = store.bestStars();
  const tasks = missionTasks();
  const doneCount = tasks.filter((task) => task.done).length;
  const cont = store.state.last.game && GAMES.find((g) => g.id === store.state.last.game);
  const contMeta = cont || recommended();
  const contTitle = contMeta.title[lang() === "es" ? 1 : 0];
  const rec = recommended();
  const recTitle = rec.title[lang() === "es" ? 1 : 0];

  main.innerHTML = `
    <section class="hero">
      <div class="hero-copy">
        <p class="kicker"><i aria-hidden="true"></i>${t("hero.kicker")}</p>
        <h1>${t("hero.title")}</h1>
        <p class="lede">${t("hero.sub")}</p>
        <div class="hero-actions">
          <a class="btn btn-primary btn-lg" href="#/play/${contMeta.id}">
            ${cont ? t("hero.continue") : t("hero.start")}
            <span class="btn-note">${esc(contTitle)}</span>
          </a>
          <a class="btn btn-quiet btn-lg" href="#mission">${t("hero.daily")}</a>
        </div>
        <ul class="hero-skills" aria-label="${t("filter.all")}">
          ${SKILLS.map(
            (skill) =>
              `<li style="--skill:${SKILL_VAR[skill]}"><i aria-hidden="true"></i>${t(`skill.${skill}`)}</li>`
          ).join("")}
        </ul>
      </div>

      <aside class="player-card" aria-label="${t("journey.title")}">
        <div class="pc-top">
          <div class="level-ring" style="--pct:${level.pct}">
            <svg viewBox="0 0 100 100" aria-hidden="true">
              <circle class="ring-bg" cx="50" cy="50" r="44" />
              ${
                level.pct > 0
                  ? `<circle class="ring-fg" cx="50" cy="50" r="44" style="stroke-dasharray:${
                      (level.pct / 100) * 276.46
                    } 999" />`
                  : ""
              }
            </svg>
            <span>${level.level}</span>
            <small>${t("player.level")}</small>
          </div>
          <div class="pc-id">
            <p class="pc-rank">${esc(rank)}</p>
            <p class="pc-xp">${formatNumber(store.state.xp)} XP</p>
          </div>
        </div>
        <div class="xp-track" aria-hidden="true"><i style="width:${level.pct}%"></i></div>
        <p class="xp-note">${level.next} ${t("player.toNext")}</p>
        <div class="pc-stats">
          <div><strong>${played}</strong><span>${t("player.games")}</span></div>
          <div><strong>${stars}<small>/15</small></strong><span>${t("common.stars")}</span></div>
          <div><strong>${store.state.streak.days}</strong><span>${t("player.streak")}</span></div>
        </div>
        <a class="pc-link" href="#journey">${t("journey.title")} →</a>
      </aside>
    </section>

    <section class="mission" id="mission">
      <div class="mission-head">
        <p class="kicker">${t("hero.daily")}</p>
        <h2>${t("hero.dailySub")}</h2>
        <div class="mission-ring" style="--done:${doneCount}" aria-label="${doneCount} / 3">
          <span>${doneCount}<small>/3</small></span>
        </div>
      </div>
      <ul class="mission-tasks">
        ${tasks
          .map(
            (task) => `
          <li class="task ${task.done ? "is-done" : ""}">
            <span class="tick" aria-hidden="true">✓</span>
            <div><strong>${esc(task.label)}</strong></div>
          </li>`
          )
          .join("")}
      </ul>
      <a class="btn btn-gold" href="#/play/${rec.id}">${t("hero.startMission")}</a>
    </section>

    <section class="catalogue" id="catalogue">
      <div class="cat-head">
        <div class="cat-copy">
          <h2>${t("grid.title")}</h2>
          <p>${t("grid.sub")}</p>
        </div>
        <div class="cat-tools">
          <div class="seg-band" role="group" aria-label="${t("filter.band")}">
            <button type="button" data-band="3-5" aria-pressed="${band === "3-5"}">${t("band.3-5")}</button>
            <button type="button" data-band="6-8" aria-pressed="${band === "6-8"}">${t("band.6-8")}</button>
          </div>
          <div class="filters" role="group" aria-label="${t("filter.all")}">
            <button type="button" class="chip" data-filter="all" aria-pressed="${filter === "all"}">${t(
              "filter.all"
            )}</button>
            ${SKILLS.map(
              (skill) =>
                `<button type="button" class="chip" data-filter="${skill}" style="--skill:${
                  SKILL_VAR[skill]
                }" aria-pressed="${filter === skill}"><i aria-hidden="true"></i>${t(
                  `skill.${skill}`
                )}</button>`
            ).join("")}
          </div>
          <p class="cat-count"><span data-count>${GAMES.length}</span> ${t("filter.count")}</p>
        </div>
      </div>
      <div class="grid" data-grid>${gridHTML()}</div>
    </section>

    <section class="journey-panel" id="journey">
      <div class="journey-head">
        <div>
          <h2>${t("journey.title")}</h2>
          <p>${t("journey.sub")}</p>
        </div>
        <button class="link-btn" type="button" data-reset>${t("journey.reset")}</button>
      </div>

      <div class="journey-grid">
        <div class="j-stat"><span>${t("player.level")}</span><strong>${level.level}</strong><small>${esc(rank)}</small></div>
        <div class="j-stat"><span>${t("player.games")}</span><strong>${played}</strong><small>${t("journey.title")}</small></div>
        <div class="j-stat"><span>${t("common.stars")}</span><strong>${stars}<small>/15</small></strong><small>${t("card.best")}</small></div>
        <div class="j-stat"><span>${t("player.streak")}</span><strong>${store.state.streak.days}</strong><small>${t("hero.daily")}</small></div>
      </div>

      <div class="badge-shelf">
        <h3>${t("journey.badges")}</h3>
        <ul class="badges">
          ${store.badges
            .map((badge) => {
              const owned = store.hasBadge(badge.id);
              return `<li class="badge ${owned ? "is-owned" : ""}">
                <span class="badge-icon" aria-hidden="true">${owned ? badge.icon : "·"}</span>
                <strong>${esc(lang() === "es" ? badge.es : badge.name)}</strong>
                <small>${owned ? esc(badge.desc) : t("badge.locked")}</small>
              </li>`;
            })
            .join("")}
        </ul>
      </div>

      <div class="next-step">
        <span class="ns-icon" aria-hidden="true">→</span>
        <div><strong>${t("journey.next")}</strong><p>${esc(recTitle)} · ${t(`skill.${rec.skill}`)} · ${t(`band.${band}`)}</p></div>
        <a class="btn btn-quiet" href="#/play/${rec.id}">${t("card.play")}</a>
      </div>
    </section>`;

  wireHub();
  applyChrome(document);
}

function wireHub() {
  qsa("[data-band]").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (btn.dataset.band === band) return;
      band = btn.dataset.band;
      localStorage.setItem(BAND_KEY, band);
      sound.whoosh();
      renderHub();
    });
  });

  qsa("[data-filter]").forEach((btn) => {
    btn.addEventListener("click", () => {
      filter = btn.dataset.filter;
      qsa("[data-filter]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.filter === filter)));
      const grid = qs("[data-grid]");
      if (grid) {
        grid.classList.remove("is-swapping");
        grid.innerHTML = gridHTML();
        void grid.offsetWidth;
        grid.classList.add("is-swapping");
      }
      const count = qs("[data-count]");
      if (count) {
        count.textContent = String(GAMES.filter((g) => filter === "all" || g.skill === filter).length);
      }
      sound.click();
      announce(`${filter} ${t("filter.count")}`);
    });
  });

  qs("[data-reset]")?.addEventListener("click", () => {
    if (!window.confirm(t("journey.resetConfirm"))) return;
    store.reset();
    band = "3-5";
    localStorage.setItem(BAND_KEY, band);
    filter = "all";
    syncChrome();
    renderHub();
    toast(t("journey.reset"), { icon: "↺", ms: 2200 });
  });
}

/* ------------------------------------------------------------------- game */

function destroyGame() {
  activeShell?.destroy();
  activeShell = null;
}

function nextGameId(currentId) {
  const index = GAMES.findIndex((g) => g.id === currentId);
  for (let step = 1; step <= GAMES.length; step++) {
    const meta = GAMES[(index + step) % GAMES.length];
    if (meta.id !== currentId) return meta.id;
  }
  return GAMES[0].id;
}

async function openGame(id, options = {}) {
  const meta = GAMES.find((g) => g.id === id);
  if (!meta) {
    location.hash = "#/";
    return;
  }
  const useBand = options.band || band;
  band = useBand;
  localStorage.setItem(BAND_KEY, band);
  destroyGame();
  activeGameId = id;
  main.innerHTML = `
    <div class="game-loading" role="status">
      <span class="spinner" aria-hidden="true"></span>
      <p>${t("common.loading")}</p>
    </div>`;
  main.scrollIntoView({ block: "start" });
  window.scrollTo({ top: 0, behavior: "smooth" });

  try {
    const mod = await meta.load();
    const game = mod.default || mod;
    const title = meta.title[lang() === "es" ? 1 : 0];
    document.title = `${title} · The Language Page`;

    main.innerHTML = "";
    const host = document.createElement("div");
    host.className = "game-host";
    main.appendChild(host);

    activeShell = new GameShell({
      game: { ...game, id: meta.id, title, skill: meta.skill },
      band: useBand,
      host,
      onExit: () => {
        location.hash = "#/";
      },
      onRestart: (nextBand) => openGame(meta.id, { band: nextBand || useBand }),
      onNext: (currentId) => openGame(nextGameId(currentId), { band: useBand }),
    });
    sound.start();
  } catch (error) {
    console.warn("activity failed to load", error);
    main.innerHTML = `<div class="game-error"><p>This activity did not load. Check your connection and try again.</p><a class="btn btn-primary" href="#/">${t(
      "common.back"
    )}</a></div>`;
  }
}

/* ------------------------------------------------------------------ router */

function route() {
  const hash = location.hash || "#/";
  const match = hash.match(/^#\/play\/([a-z0-9-]+)/);
  if (match) {
    openGame(match[1], { band });
  } else {
    renderHub();
    if (hash === "#journey") {
      window.setTimeout(() => {
        qs("#journey")?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 80);
    } else if (hash === "#mission") {
      window.setTimeout(() => {
        qs("#mission")?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 80);
    }
  }
}

window.addEventListener("hashchange", route);

if ("scrollRestoration" in history) history.scrollRestoration = "manual";

fx.init(qs("#fx"));
fx.setEnabled(store.settings.motion !== false);
store.subscribe(syncChrome);
syncChrome();
route();
