/* Legacy game adventure layer.
 * Each legacy page declares window.LegacyAdventureConfig and calls
 * LegacyAdventure.reward(problem) exactly where its own checker has validated a
 * correct answer. The native game stays the scoring and SCORM authority; this
 * layer only turns solved problems into expedition supplies and never writes
 * grades. The strategic mission (spend supplies, undo, three landmarks, replay,
 * device save) is CabinetAdventure; this file gives each game its own world:
 * scenery, palette, landmark trail, story beats, and an expedition rank. */
(() => {
  "use strict";
  const config = window.LegacyAdventureConfig;
  if (!config || !window.CabinetAdventure || !window.CabinetWorlds) return;
  const SCENES = [
    "sky",
    "forge",
    "reef",
    "oasis",
    "city",
    "garden",
    "rail",
    "bridge",
    "wild",
    "rover",
    "orbit",
  ];
  const RANKS = [
    [0, "Recruit"],
    [1, "Scout"],
    [3, "Pathfinder"],
    [6, "Navigator"],
    [9, "Captain"],
    [15, "Legend"],
  ];
  const baseWorld = window.CabinetWorlds.worlds[config.id];
  if (!baseWorld || !Array.isArray(config.chapters) || config.chapters.length !== 3) {
    console.warn("LegacyAdventure: config needs a known cabinet id and three chapters.");
    return;
  }
  const accent = /^#[0-9a-f]{6}$/i.test(config.accent || "") ? config.accent : baseWorld[2];
  const scene = SCENES.includes(config.scene) ? config.scene : baseWorld[0];
  const icons =
    Array.isArray(config.icons) && config.icons.length === 3 ? config.icons : ["1", "2", "3"];
  const story = Array.isArray(config.story) && config.story.length === 4 ? config.story : null;
  // Register this game's own world so the shared painter uses its scenery and palette.
  const artId = "legacy:" + location.pathname.replace(/index\.html$/, "");
  window.CabinetWorlds.worlds[artId] = [scene, config.title, accent, config.chapters.slice()];

  const awarded = new WeakMap();
  let controller = null;
  let queued = 0;
  let trail = null;
  /** Award once per validated problem instance (and optional part). Repeated
   * events for the same problem object are ignored, so double clicks, key
   * repeats, and per-frame collisions cannot farm supplies. */
  function reward(problem, part = "complete") {
    if (!problem || typeof problem !== "object") return false;
    let seen = awarded.get(problem);
    if (!seen) {
      seen = new Set();
      awarded.set(problem, seen);
    }
    const key = String(part);
    if (seen.has(key)) return false;
    seen.add(key);
    if (controller) grant();
    else queued++;
    return true;
  }
  window.LegacyAdventure = { reward };

  const calm = () =>
    matchMedia("(prefers-reduced-motion: reduce)").matches ||
    document.documentElement.classList.contains("studio-reduced-motion") ||
    window.GameStudio?.settings?.reducedMotion === true;
  const landmarks = (state) => state.completed * 3 + state.chapter;
  const rankFor = (count) =>
    RANKS.reduce((name, [min, label]) => (count >= min ? label : name), RANKS[0][1]);

  function grant() {
    controller.reward();
    updateTrail();
    if (!trail || calm()) return;
    const burst = document.createElement("span");
    burst.className = "legacy-reward-burst";
    burst.textContent = "+4";
    burst.setAttribute("aria-hidden", "true");
    trail.append(burst);
    burst.addEventListener("animationend", () => burst.remove(), { once: true });
    setTimeout(() => burst.remove(), 1500);
  }

  function buildTrail(nav) {
    trail = document.createElement("div");
    trail.className = "legacy-trail";
    trail.innerHTML =
      '<ol class="legacy-trail-path" aria-label="Expedition landmarks"></ol>' +
      '<span class="legacy-trail-rank"></span><span class="legacy-sr" role="status" aria-live="polite"></span>';
    nav.querySelector(".mission-world-name")?.after(trail);
    nav.classList.add("legacy-nav");
    nav.style.setProperty("--legacy-accent", accent);
  }

  function updateTrail(announce) {
    if (!trail || !controller) return;
    const state = controller.getState();
    const done = state.chapter >= 3;
    trail.querySelector(".legacy-trail-path").innerHTML =
      config.chapters
        .map((name, i) => {
          const status = i < state.chapter ? "restored" : i === state.chapter ? "current" : "ahead";
          return `<li class="is-${status}" ${status === "current" ? 'aria-current="step"' : ""}><span aria-hidden="true">${icons[i]}</span><span class="legacy-sr">${name}: ${status}</span></li>`;
        })
        .join("") +
      `<li class="legacy-trail-flag ${done ? "is-restored" : "is-ahead"}"><span aria-hidden="true">🏁</span><span class="legacy-sr">Expedition finish: ${done ? "reached" : "ahead"}</span></li>`;
    const count = landmarks(state);
    trail.querySelector(".legacy-trail-rank").textContent =
      `${rankFor(count)} · ${count} landmark${count === 1 ? "" : "s"}`;
    const caption = document.querySelector(".legacy-nav .mission-world-name small");
    if (caption) {
      caption.textContent = story
        ? story[Math.min(state.chapter, 3)]
        : done
          ? "Expedition complete. Start another in Mission chart."
          : "Each solved problem earns 4 mission supplies.";
    }
    if (announce) {
      trail.querySelector('[role="status"]').textContent = announce;
      window.GameStudio?.announce?.(announce, "good");
    }
  }

  function onLandmark(event) {
    const chapter = event.detail?.chapter;
    if (!Number.isInteger(chapter)) return;
    const finished = chapter >= 3;
    const name = config.chapters[Math.min(chapter, 3) - 1];
    updateTrail(
      finished
        ? `Expedition complete! ${config.title} is restored. Your rank: ${rankFor(landmarks(controller.getState()))}.`
        : `${name} restored. Next landmark: ${config.chapters[chapter]}.`,
    );
    if (calm() || !trail) return;
    trail.classList.remove("legacy-celebrate");
    void trail.offsetWidth;
    trail.classList.add(finished ? "legacy-celebrate" : "legacy-step");
  }

  /** True when a key press belongs to page UI rather than the Phaser game. */
  function keyBelongsToPage(target, canvas) {
    if (!(target instanceof Element) || target === canvas) return false;
    if (target.closest(".cabinet-adventure,.mission-nav,dialog,[role=dialog]")) return true;
    return target.matches(
      "input,textarea,select,button,a[href],[contenteditable=''],[contenteditable=true],[role=button]",
    );
  }

  function mountPhaser(game, canvas) {
    let host = canvas.parentElement;
    if (host === document.body) {
      // Phaser appends its canvas at the end of <body>, below the coach tip and
      // site footer. Seat the game right under the arcade header instead.
      host = document.createElement("div");
      const header = document.querySelector(".ewl-arcade-header-bar");
      if (header?.parentElement === document.body) header.after(host);
      else canvas.before(host);
      host.append(canvas);
    }
    host.classList.add("legacy-adventure-host", "legacy-phaser-host");
    game.scale.parent = host;
    game.scale.parentIsWindow = false;
    // Fit the whole game below the adventure bar on a 768px Chromebook screen:
    // width is capped by the container, 1050px, and the visible height.
    const ratio = Number(game.config.width) / Number(game.config.height);
    const resize = () => {
      const nav = host.previousElementSibling;
      const room = window.innerHeight - (nav?.offsetHeight || 0) - 28;
      const width = Math.floor(
        Math.min(host.parentElement.clientWidth, 1050, Math.max(320, room * ratio)),
      );
      host.style.setProperty("width", `${width}px`, "important");
      host.style.height = `${Math.round(width / ratio)}px`;
      game.scale.refresh();
    };
    new ResizeObserver(resize).observe(host.parentElement);
    window.addEventListener("resize", resize);
    resize();
    canvas.tabIndex = 0;
    canvas.setAttribute(
      "aria-label",
      `${config.title}. Select the game to use its keyboard controls.`,
    );
    canvas.addEventListener("pointerdown", () => canvas.focus({ preventScroll: true }));
    // Phaser listens on window. Disable its keyboard while a key press targets
    // page controls (mission buttons, toolbars, text boxes) so typing there
    // never moves the player, without blocking the control's own handlers.
    const keyboard = game.input?.keyboard;
    if (keyboard) {
      window.addEventListener(
        "keydown",
        (event) => {
          keyboard.enabled = !keyBelongsToPage(event.target, canvas);
        },
        true,
      );
      window.addEventListener(
        "keyup",
        () => {
          keyboard.enabled = true;
        },
        true,
      );
    }
    return host;
  }

  /** game-fx.js pins its tool row (Language, Read, Contrast...) fixed over the
   * page, where it covers the player toolbar. Use its own docked layout: a
   * "Game tools" disclosure under the arcade header, as Practice Arcade does. */
  function dockGameTools() {
    const toolbar = document.getElementById("game-pub-toolbar");
    if (!toolbar || toolbar.closest(".game-tools-menu")) return;
    const anchor =
      document.querySelector(".ewl-arcade-header-bar") || document.querySelector(".studio-toolbar");
    if (!anchor) return;
    const menu = document.createElement("details");
    menu.className = "game-tools-menu no-print legacy-tools-menu";
    const summary = document.createElement("summary");
    summary.textContent = "Game tools";
    menu.append(summary, toolbar);
    const dock = document.getElementById("gfx-arcade-controls");
    if (dock) menu.append(dock);
    anchor.after(menu);
  }

  function mount() {
    dockGameTools();
    window.addEventListener("load", dockGameTools, { once: true });
    const game = window.__legacyAdventureGame;
    const native = game?.canvas || document.querySelector("#screen-play > .card");
    if (!native) return;
    let host;
    if (game) host = mountPhaser(game, native);
    else {
      host = document.createElement("div");
      host.className = "legacy-adventure-host legacy-dom-host";
      native.before(host);
      host.append(native);
    }
    host.style.setProperty("--legacy-accent", accent);
    // Key presses on adventure and player controls belong to those controls,
    // and while the mission chart, a dialog, or Pause makes the game inert,
    // no key belongs to the game. Stop them at <body> so document-level game
    // shortcuts (dials, Enter to submit) neither act behind the panel nor
    // cancel Enter on the focused button.
    const PAGE_CONTROLS = ".mission-nav,.cabinet-adventure,.studio-toolbar,.legacy-tools-menu,dialog";
    document.body.addEventListener("keydown", (event) => {
      const target = event.target instanceof Element ? event.target : null;
      if (native.inert || target?.closest(PAGE_CONTROLS)) event.stopPropagation();
    });
    const activeScenes = () =>
      game ? game.scene.getScenes(true).map((s) => s.sys.settings.key) : [];
    const pauseScenes = () => {
      const keys = activeScenes();
      for (const key of keys) game.scene.pause(key);
      return keys;
    };
    const resumeScenes = (keys) => {
      for (const key of keys) game?.scene.resume(key);
    };
    let missionScenes = [];
    let studioScenes = [];
    controller = window.CabinetAdventure.create({
      id: config.id,
      artId,
      title: config.title,
      chapters: config.chapters,
      storageId: location.pathname.replace(/index\.html$/, ""),
      host,
      onView(open) {
        if (open) {
          missionScenes = pauseScenes();
          native.inert = true;
        } else {
          resumeScenes(missionScenes);
          missionScenes = [];
          native.inert = false;
          updateTrail();
        }
      },
    });
    if (!controller) return;
    window.__cabinetAdventure = controller;
    const nav = host.previousElementSibling;
    if (nav?.classList.contains("mission-nav")) buildTrail(nav);
    if (game) window.dispatchEvent(new Event("resize"));
    host
      .querySelector(".cabinet-adventure")
      ?.addEventListener("click", () => queueMicrotask(updateTrail));
    document.addEventListener("cabinet:landmark", onLandmark);
    updateTrail();
    while (queued > 0) {
      queued--;
      grant();
    }
    const art = document.createElement("canvas");
    window.CabinetWorlds.paint(art, artId, 0, true);
    host.style.setProperty("--legacy-world", `url(${art.toDataURL()})`);
    if (game) {
      const decorated = new WeakSet();
      game.events.on("step", () => {
        for (const s of game.scene.getScenes(true)) {
          if (decorated.has(s) || !s.children.list.length) continue;
          decorated.add(s);
          // Platform scenes keep their own collision art; menus get the world backdrop.
          if (["Title", "Vocab", "Results", "Result"].includes(s.sys.settings.key))
            controller.decorate(s);
        }
      });
    }
    window.GameStudio?.register({
      title: config.title,
      instructions: [
        config.brief,
        "Each problem you solve correctly earns 4 supplies. Open Mission chart to spend them and restore three landmarks.",
        "Each mission move costs 1 supply. Undo gives it back. Your expedition saves on this device.",
      ],
      pause() {
        studioScenes = pauseScenes();
        native.inert = true;
      },
      resume() {
        resumeScenes(studioScenes);
        studioScenes = [];
        native.inert = controller.open;
      },
      setMuted(value) {
        window.NT_MUTED = value;
        if (game?.sound) game.sound.mute = value;
      },
      setMotion(value) {
        for (const s of game?.scene.getScenes(false) || []) s.reduceMotion = value;
      },
    });
  }
  if (document.readyState === "loading")
    document.addEventListener("DOMContentLoaded", () => requestAnimationFrame(mount), {
      once: true,
    });
  else requestAnimationFrame(mount);
})();
