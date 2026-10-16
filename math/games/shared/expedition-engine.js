/* EduWonderLab Expedition Engine — shared campaign layer for the math skill games.
 *
 * Each skill game registers ONE expedition: a world the student restores by doing
 * the mathematics. The engine owns everything that must behave identically across
 * games — persistence, the world map, the mission loop (check → targeted feedback
 * → tiered hints → worked demo → revision twin → independent mastery check),
 * stars, achievements, skill/misconception evidence, reporting, audio, EN/ES and
 * the accessible control deck. A game supplies only its world art and its mission
 * builders, where the student's numbers drive what happens in the world.
 *
 *   EWLExpedition.register(game, def)     add the expedition to an existing Phaser game
 *   EWLExpedition.mountStandalone(host, def)  run it in its own Phaser game (DOM games)
 *
 * def = {
 *   id, title:{en,es}, accent:'#rrggbb', music:{root:Hz, mode:'major'|'minor'|'dorian', bpm},
 *   skills: { [skillId]: { en, es, standard } },
 *   chapters: [{ id, name:{en,es}, landmark:{en,es}, missions:[{ id, type, skill,
 *       name:{en,es}, brief:{en,es}, mastery?:true, tier?:1..3 }] }],
 *   paint(scene, kit, ctx)   draw the world; ctx = {mode:'map'|'play', chapter, restored, state, mission?}
 *   builders: { [type](scene, api) -> controller }
 *   misconceptions?: { [tag]: {en,es} }   journal labels for the tags check() returns
 *   onRestore?(scene, kit, info)          extra celebration when a mission is won
 *   entry?: {x, y}                         title-screen button position (default bottom-right)
 * }
 * Chapter: name = place name; landmark = the thing restored, as a noun phrase
 *   ("the seedling beds") — the map shows "Restore: {landmark}".
 * Skill: {en, es, standard, lessons?: "3-1, 3-3"} — lessons use the curriculum manifest ids.
 *
 * api (2nd builder argument) = { kit, mission, rng, seed, revision, mastery, tier, lang, t, sfx,
 *   area:{x,y,w,h} (board space between the banner and the action row), setBrief(s),
 *   say(s) (screen reader), feedback(s, tone), refresh() (re-publish the deck/status) }
 *
 * controller = {
 *   check(): Result | Promise<Result>     Result = {ok, misconception?, feedback:{en,es}, explain?:{en,es}}
 *                                         {ok:false, incomplete:true, feedback} = nothing to judge yet:
 *                                         shown as guidance, never counted as a miss.
 *   hints: [{en,es}, {en,es}]             tier 1 = method, tier 2 = concrete step. Never the answer.
 *   demo(): Promise<void>                 tier 3: show a worked solution ON THE BOARD
 *   actions: [{key, label:{en,es}, run}] keyboard + DOM deck controls (key = KeyboardEvent.key)
 *   checkLabel?: {en,es}                  verb for the main button ("Open the gates")
 *   destroy?()
 * }
 *
 * All state stays on this device (localStorage). No network calls except the
 * existing EduPulse bridge, which the games already load.
 */
(function () {
  "use strict";
  if (window.EWLExpedition) return;

  const W = 820;
  const H = 600;
  const STORE_PREFIX = "ewl-expedition-v1:";
  const INDEX_KEY = "ewl-expedition-index-v1";
  const LANG_KEY = "nt-lang";
  const FONT = '"Outfit", "Segoe UI", system-ui, sans-serif';
  const defs = {};

  /* ── Language ─────────────────────────────────────────────────────────── */
  function lang() {
    try {
      return localStorage.getItem(LANG_KEY) === "es" ? "es" : "en";
    } catch (_e) {
      return "en";
    }
  }
  function setLang(value) {
    try {
      localStorage.setItem(LANG_KEY, value === "es" ? "es" : "en");
    } catch (_e) {}
    document.dispatchEvent(new CustomEvent("ewl:lang", { detail: { lang: lang() } }));
  }
  /** t("plain") | t({en, es}) | t({en, es}, {n: 3}) → "{n}" placeholders filled. */
  function t(value, vars) {
    let s =
      value == null ? "" : typeof value === "string" ? value : value[lang()] || value.en || "";
    if (vars) s = s.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? String(vars[k]) : m));
    return s;
  }
  const UI = {
    check: { en: "Check", es: "Comprobar" },
    hint: { en: "Hint", es: "Pista" },
    showMe: { en: "Show me", es: "Muéstrame" },
    map: { en: "Map", es: "Mapa" },
    journal: { en: "Field Journal", es: "Diario de campo" },
    next: { en: "Next mission", es: "Siguiente misión" },
    replay: { en: "New numbers", es: "Números nuevos" },
    revise: { en: "Try one like it", es: "Intenta uno parecido" },
    play: { en: "Play", es: "Jugar" },
    locked: {
      en: "Locked — finish the mission before it",
      es: "Bloqueada — termina la misión anterior",
    },
    mastery: { en: "Mastery check · no hints", es: "Prueba de dominio · sin pistas" },
    missionDone: { en: "Mission complete!", es: "¡Misión completada!" },
    notYet: {
      en: "Not yet — the world shows what happened.",
      es: "Todavía no — el mundo muestra lo que pasó.",
    },
    revision: {
      en: "Revision: a fresh one like it. Full stars are back on the table.",
      es: "Revisión: uno nuevo parecido. Puedes ganar todas las estrellas.",
    },
    restored: { en: "Landmark restored: {place}", es: "Lugar restaurado: {place}" },
    restoreGoal: { en: "Restore: {place}", es: "Restaura: {place}" },
    expedition: { en: "EXPEDITION", es: "EXPEDICIÓN" },
    expeditionLong: { en: "Expedition — restore the world", es: "Expedición — restaura el mundo" },
    music: { en: "Music", es: "Música" },
    lang: { en: "Español", es: "English" },
    close: { en: "Close", es: "Cerrar" },
    mastered: { en: "Mastered on your own", es: "Dominado por tu cuenta" },
    growing: { en: "Growing", es: "En progreso" },
    notStarted: { en: "Not started", es: "Sin empezar" },
    revisit: { en: "Worth another look", es: "Vale la pena repasar" },
    practice: { en: "Practice this", es: "Practicar esto" },
    stars: { en: "stars", es: "estrellas" },
  };

  /* ── Persistence ──────────────────────────────────────────────────────── */
  function emptyProgress() {
    return {
      v: 1,
      missions: {},
      skills: {},
      misconceptions: {},
      achievements: {},
      xp: 0,
      plays: 0,
      updated: 0,
    };
  }
  function load(id) {
    try {
      const raw = JSON.parse(localStorage.getItem(STORE_PREFIX + id) || "null");
      if (raw && raw.v === 1 && typeof raw.missions === "object")
        return Object.assign(emptyProgress(), raw);
    } catch (_e) {}
    return emptyProgress();
  }
  function save(def, state) {
    state.updated = Date.now();
    try {
      localStorage.setItem(STORE_PREFIX + def.id, JSON.stringify(state));
      const index = JSON.parse(localStorage.getItem(INDEX_KEY) || "{}") || {};
      const all = allMissions(def);
      index[def.id] = {
        title: def.title,
        stars: all.reduce((s, m) => s + (state.missions[m.id]?.stars || 0), 0),
        maxStars: all.length * 3,
        done: all.filter((m) => state.missions[m.id]?.done).length,
        missions: all.length,
        chaptersRestored: def.chapters.filter((c) => chapterDone(c, state)).length,
        chapters: def.chapters.length,
        achievements: Object.keys(state.achievements).length,
        achievementKeys: Object.keys(state.achievements),
        accent: def.accent,
        skills: Object.keys(def.skills).length,
        skillsMastered: Object.values(state.skills).filter((x) => x.independent > 0).length,
        // Top misconceptions with their labels, so the games hub can suggest what to revisit.
        revisit: Object.entries(state.misconceptions)
          .sort((a, b) => b[1].count - a[1].count)
          .slice(0, 2)
          .map(([tag, m]) => ({ tag, count: m.count, label: def.misconceptions?.[tag] || null })),
        updated: state.updated,
      };
      localStorage.setItem(INDEX_KEY, JSON.stringify(index));
    } catch (_e) {}
  }
  function readIndex() {
    try {
      return JSON.parse(localStorage.getItem(INDEX_KEY) || "{}") || {};
    } catch (_e) {
      return {};
    }
  }
  const allMissions = (def) => def.chapters.flatMap((c) => c.missions);
  const chapterDone = (c, state) => c.missions.every((m) => state.missions[m.id]?.done);
  function unlocked(def, state, missionId) {
    const list = allMissions(def);
    const i = list.findIndex((m) => m.id === missionId);
    return i <= 0 || !!state.missions[list[i - 1].id]?.done;
  }
  function restoredFraction(def, state) {
    const list = allMissions(def);
    return list.filter((m) => state.missions[m.id]?.done).length / list.length;
  }

  /* ── Seeded randomness (twins and replays get fresh, reproducible numbers) ─ */
  function rng(seed) {
    let s = seed >>> 0 || 1;
    const next = () => {
      s ^= s << 13;
      s ^= s >>> 17;
      s ^= s << 5;
      return (s >>> 0) / 4294967296;
    };
    return {
      next,
      int: (a, b) => a + Math.floor(next() * (b - a + 1)),
      pick: (arr) => arr[Math.floor(next() * arr.length)],
      shuffle(arr) {
        const a = arr.slice();
        for (let i = a.length - 1; i > 0; i--) {
          const j = Math.floor(next() * (i + 1));
          [a[i], a[j]] = [a[j], a[i]];
        }
        return a;
      },
    };
  }

  /* ── Preferences shared with GameStudio ───────────────────────────────── */
  const reducedMotion = () =>
    window.GameStudio?.settings?.reducedMotion ??
    matchMedia("(prefers-reduced-motion: reduce)").matches;
  const muted = () =>
    window.GameStudio?.settings ? !!window.GameStudio.settings.muted : window.NT_MUTED !== false;

  /* ── Audio: small WebAudio synth + optional generative soundtrack ──────── */
  const Audio = (() => {
    let ctx;
    let master;
    let musicGain;
    let musicTimer = 0;
    let musicOn = false;
    try {
      musicOn = localStorage.getItem("ewl-expedition-music") === "1";
    } catch (_e) {}
    function ensure() {
      if (muted()) return null;
      try {
        if (!ctx) {
          ctx = new (window.AudioContext || window.webkitAudioContext)();
          master = ctx.createGain();
          master.gain.value = 0.5;
          master.connect(ctx.destination);
          musicGain = ctx.createGain();
          musicGain.gain.value = 0.12;
          musicGain.connect(master);
        }
        if (ctx.state === "suspended") ctx.resume().catch(() => {});
        return ctx;
      } catch (_e) {
        return null;
      }
    }
    function tone(freq, dur, opts = {}) {
      const c = ensure();
      if (!c) return;
      const t0 = c.currentTime + (opts.delay || 0);
      const o = c.createOscillator();
      const g = c.createGain();
      o.type = opts.type || "sine";
      o.frequency.setValueAtTime(freq, t0);
      if (opts.slide) o.frequency.exponentialRampToValueAtTime(opts.slide, t0 + dur);
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(opts.vol || 0.18, t0 + 0.012);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      o.connect(g);
      g.connect(opts.bus || master);
      o.start(t0);
      o.stop(t0 + dur + 0.05);
    }
    function noise(dur, opts = {}) {
      const c = ensure();
      if (!c) return;
      const len = Math.floor(c.sampleRate * dur);
      const buf = c.createBuffer(1, len, c.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
      const src = c.createBufferSource();
      src.buffer = buf;
      const f = c.createBiquadFilter();
      f.type = opts.filter || "lowpass";
      f.frequency.value = opts.freq || 900;
      const g = c.createGain();
      g.gain.value = opts.vol || 0.12;
      src.connect(f);
      f.connect(g);
      g.connect(master);
      src.start(c.currentTime + (opts.delay || 0));
    }
    const sfx = {
      tap: () => tone(660, 0.06, { type: "triangle", vol: 0.1 }),
      tick: (step = 0) => tone(440 * 2 ** (step / 12), 0.07, { type: "triangle", vol: 0.09 }),
      select: () => tone(523, 0.09, { type: "square", vol: 0.05, slide: 784 }),
      place: () => {
        tone(196, 0.12, { type: "triangle", vol: 0.16 });
        noise(0.08, { freq: 1800, vol: 0.06 });
      },
      whoosh: () => noise(0.35, { filter: "bandpass", freq: 1200, vol: 0.1 }),
      flow: () => noise(0.9, { filter: "lowpass", freq: 600, vol: 0.08 }),
      success: () =>
        [523, 659, 784, 1047].forEach((f, i) =>
          tone(f, 0.28, { delay: i * 0.07, type: "triangle", vol: 0.14 }),
        ),
      miss: () => {
        tone(330, 0.16, { type: "sine", vol: 0.12, slide: 262 });
      },
      unlock: () =>
        [392, 523, 659, 784, 1047, 1319].forEach((f, i) =>
          tone(f, 0.35, { delay: i * 0.06, type: "triangle", vol: 0.1 }),
        ),
      fanfare: () => {
        [523, 659, 784].forEach((f) => tone(f, 0.9, { type: "triangle", vol: 0.09 }));
        [1047, 1319, 1568].forEach((f, i) =>
          tone(f, 0.5, { delay: 0.25 + i * 0.1, type: "sine", vol: 0.08 }),
        );
      },
      hum: () => tone(110, 0.6, { type: "sawtooth", vol: 0.04, slide: 220 }),
    };
    const MODES = {
      major: [0, 2, 4, 7, 9, 12, 14, 16],
      minor: [0, 3, 5, 7, 10, 12, 15, 17],
      dorian: [0, 2, 3, 7, 9, 12, 14, 15],
    };
    let musicSpec = null;
    function startMusic(spec) {
      musicSpec = spec || musicSpec;
      stopMusic();
      if (!musicOn || !musicSpec || !ensure()) return;
      const root = musicSpec.root || 220;
      const scale = MODES[musicSpec.mode] || MODES.major;
      const beat = 60 / (musicSpec.bpm || 84);
      let step = 0;
      const prog = [0, 5, 3, 4];
      musicTimer = setInterval(() => {
        if (muted() || !musicOn) return;
        const bar = Math.floor(step / 8) % prog.length;
        const chordRoot = scale[prog[bar]] || 0;
        if (step % 8 === 0) {
          [0, 2, 4].forEach((d) =>
            tone(root * 2 ** ((chordRoot + scale[d % scale.length]) / 12) * 0.5, beat * 7.5, {
              type: "sine",
              vol: 0.05,
              bus: musicGain,
            }),
          );
        }
        if (step % 2 === 0 || Math.random() < 0.3) {
          const n = scale[(step * 3 + bar) % scale.length];
          tone(root * 2 ** ((chordRoot + n) / 12), beat * 0.9, {
            type: "triangle",
            vol: 0.05,
            bus: musicGain,
          });
        }
        step++;
      }, beat * 500);
    }
    function stopMusic() {
      if (musicTimer) clearInterval(musicTimer);
      musicTimer = 0;
    }
    function setMusic(on) {
      musicOn = !!on;
      try {
        localStorage.setItem("ewl-expedition-music", musicOn ? "1" : "0");
      } catch (_e) {}
      if (musicOn) startMusic();
      else stopMusic();
    }
    return {
      sfx,
      tone,
      noise,
      startMusic,
      stopMusic,
      setMusic,
      get musicOn() {
        return musicOn;
      },
    };
  })();

  /* ── Phaser kit: textures, art helpers, juice, widgets ─────────────────── */
  function hex(c) {
    return typeof c === "number" ? c : Number.parseInt(String(c).replace("#", ""), 16);
  }
  function css(c) {
    return typeof c === "string" ? c : "#" + c.toString(16).padStart(6, "0");
  }
  function mix(a, b, k) {
    const A = hex(a);
    const B = hex(b);
    const r = Math.round(((A >> 16) & 255) * (1 - k) + ((B >> 16) & 255) * k);
    const g = Math.round(((A >> 8) & 255) * (1 - k) + ((B >> 8) & 255) * k);
    const bl = Math.round((A & 255) * (1 - k) + (B & 255) * k);
    return (r << 16) | (g << 8) | bl;
  }
  function ensureTextures(scene) {
    const tx = scene.textures;
    if (!tx.exists("ewl-dot")) {
      const g = scene.make.graphics({ x: 0, y: 0, add: false });
      g.fillStyle(0xffffff, 1);
      g.fillCircle(8, 8, 8);
      g.generateTexture("ewl-dot", 16, 16);
      g.destroy();
    }
    if (!tx.exists("ewl-glow")) {
      const c = tx.createCanvas("ewl-glow", 128, 128);
      const x = c.getContext();
      const grd = x.createRadialGradient(64, 64, 0, 64, 64, 64);
      grd.addColorStop(0, "rgba(255,255,255,1)");
      grd.addColorStop(0.35, "rgba(255,255,255,0.45)");
      grd.addColorStop(1, "rgba(255,255,255,0)");
      x.fillStyle = grd;
      x.fillRect(0, 0, 128, 128);
      c.refresh();
    }
    if (!tx.exists("ewl-spark")) {
      const g = scene.make.graphics({ x: 0, y: 0, add: false });
      g.fillStyle(0xffffff, 1);
      g.fillPoints(
        [
          { x: 12, y: 0 },
          { x: 15, y: 9 },
          { x: 24, y: 12 },
          { x: 15, y: 15 },
          { x: 12, y: 24 },
          { x: 9, y: 15 },
          { x: 0, y: 12 },
          { x: 9, y: 9 },
        ],
        true,
      );
      g.generateTexture("ewl-spark", 24, 24);
      g.destroy();
    }
  }
  function makeKit(scene, def) {
    ensureTextures(scene);
    const accent = hex(def.accent || "#7be0c8");
    const kit = {
      W,
      H,
      FONT,
      accent,
      hex,
      css,
      mix,
      t,
      lang,
      reduced: reducedMotion,
      sfx: Audio.sfx,
      /** Vertical sky gradient drawn into a canvas texture (crisp, one draw call). */
      sky(top, bottom, key = "ewl-sky-" + def.id) {
        if (!scene.textures.exists(key)) {
          const c = scene.textures.createCanvas(key, 8, H);
          const x = c.getContext();
          const grd = x.createLinearGradient(0, 0, 0, H);
          grd.addColorStop(0, css(top));
          grd.addColorStop(1, css(bottom));
          x.fillStyle = grd;
          x.fillRect(0, 0, 8, H);
          c.refresh();
        }
        return scene.add.image(0, 0, key).setOrigin(0).setDisplaySize(W, H).setDepth(-100);
      },
      /** Smooth silhouette ridge (layered depth). parallax 0..1 moves with the pointer. */
      ridge(color, baseY, amp, seed, opts = {}) {
        const r = rng(seed);
        const g = scene.add.graphics().setDepth(opts.depth ?? -90);
        const pts = [{ x: -40, y: H + 10 }];
        const n = opts.points || 9;
        const phase = r.next() * 6;
        for (let i = 0; i <= n; i++) {
          const x = -40 + (i * (W + 80)) / n;
          const y = baseY - amp * (0.55 * Math.sin(i * 0.9 + phase) + 0.45 * r.next());
          pts.push({ x, y });
        }
        pts.push({ x: W + 40, y: H + 10 });
        g.fillStyle(hex(color), opts.alpha ?? 1);
        // Catmull-Rom smooth the top edge.
        const curve = new Phaser.Curves.Spline(
          pts.slice(1, -1).map((p) => new Phaser.Math.Vector2(p.x, p.y)),
        );
        const smooth = curve.getPoints(n * 8);
        g.fillPoints([pts[0], ...smooth, pts[pts.length - 1]], true);
        if (opts.rim) {
          g.lineStyle(2, hex(opts.rim), 0.55);
          g.strokePoints(smooth, false);
        }
        g.parallax = opts.parallax ?? 0;
        kit._parallax.push(g);
        return g;
      },
      /** Soft light bloom (additive). */
      glow(x, y, size, color, alpha = 0.5, depth = -80) {
        return scene.add
          .image(x, y, "ewl-glow")
          .setDisplaySize(size, size)
          .setTint(hex(color))
          .setAlpha(alpha)
          .setBlendMode(Phaser.BlendModes.ADD)
          .setDepth(depth);
      },
      stars(count, seed, color = 0xdff6ff) {
        const r = rng(seed);
        for (let i = 0; i < count; i++) {
          const s = scene.add
            .image(r.int(0, W), r.int(0, H * 0.55), "ewl-dot")
            .setScale(0.08 + r.next() * 0.16)
            .setTint(color)
            .setAlpha(0.3 + r.next() * 0.6)
            .setDepth(-95);
          if (!reducedMotion())
            scene.tweens.add({
              targets: s,
              alpha: 0.15,
              duration: 1200 + r.int(0, 2400),
              yoyo: true,
              repeat: -1,
              delay: r.int(0, 2000),
            });
        }
      },
      /** Drifting ambient motes (dust, pollen, plankton, embers). */
      motes(color, count = 26, opts = {}) {
        if (reducedMotion()) return null;
        return scene.add
          .particles(0, 0, "ewl-dot", {
            x: { min: 0, max: W },
            y: { min: opts.top ?? 60, max: opts.bottom ?? H },
            lifespan: 6000,
            speedY: opts.speedY ?? { min: -12, max: -4 },
            speedX: opts.speedX ?? { min: -6, max: 6 },
            scale: { start: opts.scale ?? 0.22, end: 0 },
            alpha: { start: 0.55, end: 0 },
            tint: hex(color),
            frequency: Math.round(6000 / count),
            blendMode: "ADD",
          })
          .setDepth(opts.depth ?? -70);
      },
      _parallax: [],
      /** Burst of particles — the "juice" for a correct action. */
      burst(x, y, color = accent, n = 18, opts = {}) {
        if (reducedMotion()) return;
        const p = scene.add
          .particles(x, y, opts.texture || "ewl-spark", {
            speed: { min: 60, max: opts.speed || 220 },
            angle: { min: 0, max: 360 },
            scale: { start: opts.scale || 0.55, end: 0 },
            lifespan: opts.life || 700,
            gravityY: opts.gravity ?? 160,
            tint: [hex(color), 0xffffff],
            blendMode: "ADD",
            emitting: false,
          })
          .setDepth(opts.depth ?? 50);
        p.explode(n);
        scene.time.delayedCall((opts.life || 700) + 200, () => p.destroy());
      },
      floatText(x, y, text, color = "#ffffff", size = 22) {
        const tx = scene.add
          .text(x, y, text, {
            fontFamily: FONT,
            fontSize: size + "px",
            fontStyle: "800",
            color,
            stroke: "#06121c",
            strokeThickness: 5,
          })
          .setOrigin(0.5)
          .setDepth(60);
        if (reducedMotion()) {
          scene.time.delayedCall(900, () => tx.destroy());
          return tx;
        }
        scene.tweens.add({
          targets: tx,
          y: y - 46,
          alpha: 0,
          duration: 1100,
          ease: "Cubic.easeOut",
          onComplete: () => tx.destroy(),
        });
        return tx;
      },
      shake(intensity = 0.004, ms = 160) {
        if (!reducedMotion()) scene.cameras.main.shake(ms, intensity);
      },
      flash(color = 0xffffff, ms = 180) {
        if (!reducedMotion()) {
          const c = Phaser.Display.Color.IntegerToRGB(hex(color));
          scene.cameras.main.flash(ms, c.r, c.g, c.b);
        }
      },
      pop(target, scale = 1.12) {
        if (reducedMotion()) return;
        scene.tweens.add({
          targets: target,
          scale: { from: target.scale * scale, to: target.scale },
          duration: 260,
          ease: "Back.easeOut",
        });
      },
      tween(cfg) {
        if (reducedMotion()) {
          cfg.duration = Math.min(cfg.duration ?? 300, 1);
          cfg.delay = 0;
          delete cfg.yoyo;
          if (cfg.repeat === -1) return null;
        }
        return scene.tweens.add(cfg);
      },
      text(x, y, str, size = 18, color = "#eaf6ff", opts = {}) {
        return scene.add
          .text(x, y, str, {
            fontFamily: FONT,
            fontSize: size + "px",
            fontStyle: opts.weight || "700",
            color,
            align: opts.align || "center",
            wordWrap: opts.wrap ? { width: opts.wrap } : undefined,
            stroke: opts.stroke || undefined,
            strokeThickness: opts.stroke ? opts.strokeWidth || 4 : 0,
            lineSpacing: opts.lineSpacing || 2,
          })
          .setOrigin(opts.ox ?? 0.5, opts.oy ?? 0.5)
          .setDepth(opts.depth ?? 20);
      },
      /** Rounded glass panel. */
      panel(x, y, w, h, opts = {}) {
        const g = scene.add.graphics().setDepth(opts.depth ?? 10);
        g.fillStyle(hex(opts.fill ?? 0x08161f), opts.alpha ?? 0.82);
        g.fillRoundedRect(x, y, w, h, opts.r ?? 14);
        g.lineStyle(opts.lineWidth ?? 2, hex(opts.line ?? accent), opts.lineAlpha ?? 0.55);
        g.strokeRoundedRect(x, y, w, h, opts.r ?? 14);
        return g;
      },
      /** Canvas button with hover/press feel. Keyboard reaches it through the action deck. */
      button(x, y, w, h, label, onClick, opts = {}) {
        const c = scene.add.container(x, y).setDepth(opts.depth ?? 30);
        const bg = scene.add.graphics();
        const fill = hex(opts.fill ?? accent);
        const draw = (state) => {
          bg.clear();
          const k = state === "hover" ? 0.18 : state === "down" ? -0.15 : 0;
          const base = k >= 0 ? mix(fill, 0xffffff, k) : mix(fill, 0x000000, -k);
          bg.fillStyle(mix(base, 0x000000, 0.35), 1);
          bg.fillRoundedRect(-w / 2, -h / 2 + 4, w, h, h / 2.6);
          bg.fillStyle(base, c.disabled ? 0.35 : 1);
          bg.fillRoundedRect(-w / 2, -h / 2 + (state === "down" ? 3 : 0), w, h, h / 2.6);
          bg.fillStyle(0xffffff, c.disabled ? 0.05 : 0.18);
          bg.fillRoundedRect(
            -w / 2 + 6,
            -h / 2 + 4 + (state === "down" ? 3 : 0),
            w - 12,
            h * 0.36,
            h / 4,
          );
        };
        const lbl = scene.add
          .text(0, 0, label, {
            fontFamily: FONT,
            fontSize: (opts.size || 18) + "px",
            fontStyle: "800",
            color: opts.color || "#06121c",
          })
          .setOrigin(0.5);
        c.add([bg, lbl]);
        c.setSize(w, h);
        c.setInteractive({ useHandCursor: true });
        c.on("pointerover", () => !c.disabled && draw("hover"));
        c.on("pointerout", () => draw("idle"));
        c.on("pointerdown", () => !c.disabled && draw("down"));
        c.on("pointerup", () => {
          if (c.disabled) return;
          draw("hover");
          Audio.sfx.tap();
          onClick();
        });
        c.setLabel = (s) => lbl.setText(s);
        c.setDisabled = (v) => {
          c.disabled = !!v;
          draw("idle");
        };
        c.label = lbl;
        draw("idle");
        return c;
      },
      /** Make any game object draggable inside bounds, with snapping + key support handled by caller. */
      draggable(obj, onDrag, onDrop) {
        obj.setInteractive({ draggable: true, useHandCursor: true });
        scene.input.setDraggable(obj);
        obj.on("drag", (_p, x, y) => onDrag(x, y));
        if (onDrop) obj.on("dragend", () => onDrop());
        return obj;
      },
      /** Touch keypad row. Keyboard digits reach builders through kit.onType. */
      keypad(x, y, onKey, opts = {}) {
        const keys = opts.keys || ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0", "⌫"];
        const size = opts.size || 40;
        const gap = opts.gap ?? 6;
        const c = scene.add.container(x, y).setDepth(opts.depth ?? 30);
        keys.forEach((k, i) => {
          const b = kit.button(
            i * (size + gap) + size / 2,
            0,
            size,
            size,
            k,
            () => onKey(k === "⌫" ? "Backspace" : k),
            { size: 18, fill: 0x2f4b5c, color: "#eaf6ff" },
          );
          c.add(b);
        });
        c.width = keys.length * (size + gap) - gap;
        return c;
      },
      /** Digits, minus, decimal point and Backspace typed on the keyboard. */
      onType(fn) {
        const handler = (ev) => {
          if (window.GameStudio?.paused) return;
          if (/^[0-9.\-]$/.test(ev.key) || ev.key === "Backspace") {
            ev.preventDefault?.();
            fn(ev.key);
          }
        };
        scene.input.keyboard.on("keydown", handler);
        scene.events.once("shutdown", () => scene.input.keyboard.off("keydown", handler));
      },
      /** Resolve after ms (instant in calm motion). */
      wait(ms) {
        return new Promise((resolve) =>
          scene.time.delayedCall(reducedMotion() ? 1 : ms, resolve),
        );
      },
      rng,
    };
    // Pointer parallax for ridges (skipped in calm motion).
    scene.input.on("pointermove", (p) => {
      if (reducedMotion()) return;
      const dx = (p.x / W - 0.5) * 2;
      const dy = (p.y / H - 0.5) * 2;
      kit._parallax.forEach((g) => {
        if (!g.parallax) return;
        g.x += (-dx * 14 * g.parallax - g.x) * 0.08;
        g.y += (-dy * 6 * g.parallax - g.y) * 0.08;
      });
    });
    return kit;
  }

  /* ── Accessible deck: scenes publish {prompt, progress, feedback, actions} ─ */
  const srRegion = (() => {
    let el;
    return (msg) => {
      if (!el) {
        el = document.createElement("div");
        el.className = "ewl-x-sr";
        el.setAttribute("role", "status");
        el.setAttribute("aria-live", "polite");
        document.body.append(el);
      }
      el.textContent = "";
      setTimeout(() => {
        el.textContent = msg;
      }, 30);
    };
  })();
  function publish(scene, info) {
    scene.studio = Object.assign(scene.studio || { v: 0 }, info);
    scene.studio.v = (scene.studio.v || 0) + 1;
    document.dispatchEvent(new CustomEvent("ewl:studio", { detail: scene.studio }));
  }
  function bindKeys(scene, getActions) {
    scene.input.keyboard.on("keydown", (ev) => {
      if (window.GameStudio?.paused) return;
      // Arrows and Space belong to the game while it has focus; never scroll the page.
      if (/^(Arrow(Up|Down|Left|Right)| )$/.test(ev.key) && ev.target === scene.game.canvas)
        ev.preventDefault?.();
      const key = ev.key.length === 1 ? ev.key.toLowerCase() : ev.key;
      const action = getActions().find(
        (a) => (a.key.length === 1 ? a.key.toLowerCase() : a.key) === key && !a.disabled,
      );
      if (action) {
        ev.preventDefault?.();
        action.run();
      }
    });
  }

  /* ── Achievements ─────────────────────────────────────────────────────── */
  const ACHIEVEMENTS = {
    first: {
      icon: "🧭",
      en: "First Steps",
      es: "Primeros pasos",
      desc: { en: "Complete your first mission.", es: "Completa tu primera misión." },
    },
    sharp: {
      icon: "🎯",
      en: "Sharp Thinker",
      es: "Mente aguda",
      desc: { en: "Three missions with 3 stars.", es: "Tres misiones con 3 estrellas." },
    },
    comeback: {
      icon: "🌱",
      en: "Comeback",
      es: "Remontada",
      desc: { en: "Fix a mistake and solve it yourself.", es: "Corrige un error y resuélvelo tú." },
    },
    reviser: {
      icon: "🔁",
      en: "Reviser",
      es: "Revisor",
      desc: { en: "Finish a revision mission.", es: "Termina una misión de revisión." },
    },
    independent: {
      icon: "🏅",
      en: "On My Own",
      es: "Por mi cuenta",
      desc: {
        en: "Pass a mastery check on the first try.",
        es: "Aprueba una prueba de dominio al primer intento.",
      },
    },
    chapter: {
      icon: "🏛️",
      en: "Landmark Restored",
      es: "Monumento restaurado",
      desc: { en: "Restore a whole chapter.", es: "Restaura un capítulo completo." },
    },
    world: {
      icon: "🌍",
      en: "World Restored",
      es: "Mundo restaurado",
      desc: {
        en: "Restore every chapter of this world.",
        es: "Restaura todos los capítulos de este mundo.",
      },
    },
    explorer: {
      icon: "🗺️",
      en: "Explorer",
      es: "Explorador",
      desc: {
        en: "Complete missions in 3 different worlds.",
        es: "Completa misiones en 3 mundos distintos.",
      },
    },
  };
  function toast(html) {
    let host = document.querySelector(".ewl-x-toasts");
    if (!host) {
      host = document.createElement("div");
      host.className = "ewl-x-toasts";
      host.setAttribute("aria-live", "polite");
      document.body.append(host);
    }
    const el = document.createElement("div");
    el.className = "ewl-x-toast";
    el.innerHTML = html;
    host.append(el);
    setTimeout(() => el.classList.add("out"), 3800);
    setTimeout(() => el.remove(), 4400);
  }
  function grant(def, state, key) {
    if (state.achievements[key]) return false;
    state.achievements[key] = Date.now();
    const a = ACHIEVEMENTS[key];
    toast(
      `<span class="ewl-x-toast-icon" aria-hidden="true">${a.icon}</span><span><strong>${t(a)}</strong><br>${t(a.desc)}</span>`,
    );
    Audio.sfx.unlock();
    try {
      window.NTPassport?.award?.(15, def.id + ":achievement:" + key);
    } catch (_e) {}
    return true;
  }

  /* ── Evidence + reporting ─────────────────────────────────────────────── */
  function recordEvidence(def, state, mission, outcome) {
    const skill = def.skills[mission.skill] || {};
    const s = (state.skills[mission.skill] ||= {
      attempts: 0,
      correct: 0,
      firstTry: 0,
      independent: 0,
      last: 0,
    });
    s.attempts++;
    if (outcome.ok) s.correct++;
    if (outcome.ok && outcome.firstTry) s.firstTry++;
    if (outcome.ok && outcome.independent) s.independent++;
    s.last = Date.now();
    if (outcome.misconception) {
      const m = (state.misconceptions[outcome.misconception] ||= {
        count: 0,
        skill: mission.skill,
        last: 0,
      });
      m.count++;
      m.last = Date.now();
    }
    try {
      window.NTSignal?.record?.({
        standard: skill.standard,
        correct: !!outcome.ok,
        misconceptionTag: outcome.misconception || undefined,
      });
    } catch (_e) {}
  }
  /**
   * One gradebook/Canvas record per restored chapter. EduPulse.record also shows the
   * student their Canvas completion code, so a record per mission would interrupt
   * every mission; a chapter is the natural "finished something" moment. Per-attempt
   * evidence still flows through NTSignal in recordEvidence().
   */
  function reportChapter(def, state, chapter) {
    const missions = chapter.missions;
    const stars = missions.reduce((n, m) => n + (state.missions[m.id]?.stars || 0), 0);
    const firstTry = missions.filter((m) => state.missions[m.id]?.stars === 3).length;
    const standards = [...new Set(missions.map((m) => def.skills[m.skill]?.standard).filter(Boolean))];
    try {
      window.EduPulse?.record?.({
        activityTitle:
          document.title.split(/[|—]/)[0].trim() + " — Expedition: " + t(chapter.name),
        score: stars,
        maxScore: missions.length * 3,
        percent: Math.round((stars / (missions.length * 3)) * 100),
        stars,
        standard: standards.join(" / "),
        problemsCorrect: firstTry,
        problemsAttempted: missions.length,
      });
    } catch (_e) {}
  }

  /* ── Common scene chrome ──────────────────────────────────────────────── */
  function hudBar(scene, kit, def, state, titleText) {
    const bar = scene.add.graphics().setDepth(40);
    bar.fillStyle(0x050e16, 0.78);
    bar.fillRect(0, 0, W, 52);
    bar.lineStyle(2, kit.accent, 0.5);
    bar.lineBetween(0, 52, W, 52);
    kit.text(16, 26, t(def.title), 19, css(kit.accent), { ox: 0, depth: 41, weight: "800" });
    const sub = kit.text(
      16 + 8 + scene.children.list[scene.children.list.length - 1].width,
      27,
      titleText || "",
      15,
      "#cfe3ee",
      { ox: 0, depth: 41 },
    );
    const total = allMissions(def).reduce((s, m) => s + (state.missions[m.id]?.stars || 0), 0);
    const meter = kit.text(
      W - 16,
      26,
      "★ " + total + " / " + allMissions(def).length * 3,
      17,
      "#ffd76a",
      { ox: 1, depth: 41, weight: "800" },
    );
    return { bar, sub, meter };
  }

  /* ── Map scene ────────────────────────────────────────────────────────── */
  function makeMapScene(def) {
    return class ExpeditionMap extends Phaser.Scene {
      constructor() {
        super({ key: "ExpeditionMap" });
      }
      create() {
        const kit = (this.kit = makeKit(this, def));
        const state = (this.state = load(def.id));
        const chapterIdx = Math.max(
          0,
          def.chapters.findIndex((c) => !chapterDone(c, state)),
        );
        def.paint(this, kit, {
          mode: "map",
          chapter: chapterIdx === -1 ? def.chapters.length - 1 : chapterIdx,
          restored: restoredFraction(def, state),
          state,
        });
        const veil = this.add.graphics().setDepth(-5);
        veil.fillGradientStyle(0x02070c, 0x02070c, 0x02070c, 0x02070c, 0.15, 0.15, 0.55, 0.55);
        veil.fillRect(0, 0, W, H);
        hudBar(this, kit, def, state, "· " + t(UI.map));
        Audio.startMusic(def.music);

        // Mission nodes along a winding path, chapter by chapter.
        const missions = allMissions(def);
        const nodes = [];
        const cols = def.chapters.length;
        const colW = W / cols;
        def.chapters.forEach((ch, ci) => {
          const cx = colW * ci + colW / 2;
          const done = chapterDone(ch, state);
          kit.panel(cx - colW / 2 + 10, 66, colW - 20, 74, {
            alpha: 0.7,
            line: done ? 0xffd76a : kit.accent,
            depth: 5,
          });
          kit.text(cx, 88, t(ch.name), 17, done ? "#ffe9a8" : "#ffffff", {
            depth: 6,
            weight: "800",
            wrap: colW - 36,
          });
          kit.text(cx, 118, done ? "✓ " + t(ch.landmark) : t(UI.restoreGoal, { place: t(ch.landmark) }), 13, done ? "#ffd76a" : "#b9d3df", {
            depth: 6,
            wrap: colW - 36,
          });
          ch.missions.forEach((m, mi) => {
            // Snake: even chapters run down, odd chapters run up, so the path never crosses.
            const step = (H - 350) / Math.max(1, ch.missions.length - 1);
            const row = ci % 2 ? ch.missions.length - 1 - mi : mi;
            const y = 178 + row * step;
            const x = cx + (row % 2 ? 40 : -40);
            nodes.push({ m, x, y, ci });
          });
        });
        const path = this.add.graphics().setDepth(4);
        path.lineStyle(5, 0xffffff, 0.22);
        for (let i = 1; i < nodes.length; i++) {
          const a = nodes[i - 1];
          const b = nodes[i];
          const done = state.missions[a.m.id]?.done;
          path.lineStyle(done ? 6 : 4, done ? kit.accent : 0xffffff, done ? 0.75 : 0.18);
          const mid = { x: (a.x + b.x) / 2 + (b.ci !== a.ci ? 0 : 0), y: (a.y + b.y) / 2 };
          const curve = new Phaser.Curves.QuadraticBezier(
            new Phaser.Math.Vector2(a.x, a.y),
            new Phaser.Math.Vector2(mid.x + (b.y - a.y) * 0.2, mid.y),
            new Phaser.Math.Vector2(b.x, b.y),
          );
          curve.draw(path, 24);
        }
        this.nodes = nodes.map((n, i) => {
          const rec = state.missions[n.m.id] || {};
          const open = unlocked(def, state, n.m.id);
          const c = this.add.container(n.x, n.y).setDepth(8);
          const halo = kit.glow(0, 0, 90, rec.done ? 0xffd76a : kit.accent, open ? 0.45 : 0.08, 0);
          const disc = this.add.graphics();
          disc.fillStyle(0x000000, 0.4);
          disc.fillCircle(0, 4, 25);
          disc.fillStyle(rec.done ? 0xffd76a : open ? kit.accent : 0x45535d, 1);
          disc.fillCircle(0, 0, 25);
          disc.lineStyle(3, 0xffffff, open ? 0.85 : 0.25);
          disc.strokeCircle(0, 0, 25);
          const icon = this.add
            .text(0, 0, n.m.mastery ? "🏅" : open ? String(i + 1) : "🔒", {
              fontFamily: FONT,
              fontSize: n.m.mastery || !open ? "20px" : "20px",
              fontStyle: "800",
              color: "#06121c",
            })
            .setOrigin(0.5);
          const stars = this.add
            .text(0, 36, rec.stars ? "★".repeat(rec.stars) + "☆".repeat(3 - rec.stars) : "", {
              fontFamily: FONT,
              fontSize: "14px",
              color: "#ffd76a",
              stroke: "#06121c",
              strokeThickness: 3,
            })
            .setOrigin(0.5);
          c.add([halo, disc, icon, stars]);
          c.setSize(56, 56).setInteractive({ useHandCursor: open });
          c.on("pointerover", () => this.focus(i));
          c.on("pointerup", () => this.launch(i));
          if (open && !rec.done && !reducedMotion())
            this.tweens.add({ targets: halo, alpha: 0.85, duration: 900, yoyo: true, repeat: -1 });
          return { ...n, open, c, rec };
        });
        // Info card for the focused mission.
        this.card = kit.panel(40, H - 96, W - 80, 84, { depth: 12, alpha: 0.88 });
        this.cardTitle = kit.text(60, H - 76, "", 18, "#ffffff", {
          ox: 0,
          depth: 13,
          weight: "800",
        });
        this.cardBody = kit.text(60, H - 50, "", 14, "#cfe3ee", {
          ox: 0,
          oy: 0,
          depth: 13,
          wrap: W - 320,
          align: "left",
        });
        this.playBtn = kit.button(
          W - 130,
          H - 54,
          150,
          46,
          t(UI.play) + " ▶",
          () => this.launch(this.sel),
          { depth: 14 },
        );
        this.journalBtn = kit.button(W - 100, 92 + 0, 0, 0, "", () => {}, { depth: -1 });
        this.journalBtn.setVisible(false);
        const firstOpen = this.nodes.findIndex((n) => n.open && !n.rec.done);
        this.focus(firstOpen === -1 ? 0 : firstOpen);
        const actions = () => [
          {
            key: "ArrowRight",
            label: { en: "Next mission →", es: "Siguiente →" },
            run: () => this.focus(Math.min(this.nodes.length - 1, this.sel + 1)),
          },
          {
            key: "ArrowLeft",
            label: { en: "← Previous", es: "← Anterior" },
            run: () => this.focus(Math.max(0, this.sel - 1)),
          },
          {
            key: "Enter",
            label: { en: "Play this mission", es: "Jugar esta misión" },
            run: () => this.launch(this.sel),
          },
          {
            key: "j",
            label: UI.journal,
            run: () => openJournal(def, (id) => this.launchById(id, true)),
          },
          {
            key: "l",
            label: UI.lang,
            run: () => {
              setLang(lang() === "es" ? "en" : "es");
              this.scene.restart();
            },
          },
          { key: "m", label: UI.music, run: () => Audio.setMusic(!Audio.musicOn) },
        ];
        this.actions = actions;
        bindKeys(this, actions);
        this.publish();
        this.events.once("shutdown", () => closeJournal());
      }
      focus(i) {
        if (!this.nodes[i]) return;
        if (this.sel !== undefined && this.nodes[this.sel]) this.nodes[this.sel].c.setScale(1);
        this.sel = i;
        const n = this.nodes[i];
        n.c.setScale(1.18);
        Audio.sfx.tick(i % 8);
        const rec = n.rec;
        this.cardTitle.setText(
          (n.m.mastery ? "🏅 " : "") +
            t(n.m.name) +
            (rec.stars ? "   " + "★".repeat(rec.stars) : ""),
        );
        this.cardBody.setText(
          n.open ? (n.m.mastery ? t(UI.mastery) + " — " : "") + t(n.m.brief) : t(UI.locked),
        );
        this.playBtn.setDisabled(!n.open);
        this.publish();
      }
      publish() {
        const n = this.nodes?.[this.sel];
        publish(this, {
          prompt: n ? t(n.m.name) + ": " + (n.open ? t(n.m.brief) : t(UI.locked)) : "",
          progress:
            t(def.title) +
            " · " +
            Math.round(restoredFraction(def, this.state) * 100) +
            "% " +
            (lang() === "es" ? "restaurado" : "restored"),
          feedback: "",
          actions: this.actions ? this.actions() : [],
        });
      }
      launch(i) {
        const n = this.nodes[i];
        if (!n || !n.open) {
          Audio.sfx.miss();
          return;
        }
        Audio.sfx.whoosh();
        const go = () => this.scene.start("Expedition", { missionId: n.m.id });
        if (reducedMotion()) go();
        else {
          this.cameras.main.zoomTo(1.25, 280, "Cubic.easeIn");
          this.cameras.main.fadeOut(300, 2, 7, 12);
          this.time.delayedCall(310, go);
        }
      }
      launchById(id, practice) {
        closeJournal();
        this.scene.start("Expedition", { missionId: id, practice: !!practice });
      }
    };
  }

  /* ── Field journal (DOM dialog: real text, real focus management) ─────── */
  let journalEl;
  function closeJournal() {
    if (journalEl) {
      journalEl.close?.();
      journalEl.remove();
      journalEl = null;
    }
  }
  function openJournal(def, onPractice) {
    closeJournal();
    const state = load(def.id);
    const d = document.createElement("dialog");
    d.className = "ewl-x-journal";
    d.setAttribute("aria-label", t(UI.journal));
    const skillRows = Object.entries(def.skills)
      .map(([id, s]) => {
        const r = state.skills[id];
        const status = !r ? UI.notStarted : r.independent > 0 ? UI.mastered : UI.growing;
        const cls = !r ? "none" : r.independent > 0 ? "mastered" : "growing";
        const mission = allMissions(def).find((m) => m.skill === id && unlocked(def, state, m.id));
        return `<li class="${cls}"><span><strong>${t(s)}</strong> <small>${s.standard || ""}${s.lessons ? " · " + (lang() === "es" ? "Lecciones " : "Lessons ") + s.lessons : ""}</small></span><span class="ewl-x-pill">${t(status)}</span>${
          mission && r
            ? `<button type="button" data-practice="${mission.id}">${t(UI.practice)}</button>`
            : ""
        }</li>`;
      })
      .join("");
    const misc = Object.entries(state.misconceptions)
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 4)
      .map(([tag, m]) => {
        const label = def.misconceptions?.[tag];
        const mission = allMissions(def).find(
          (x) => x.skill === m.skill && unlocked(def, state, x.id),
        );
        return `<li><span>${label ? t(label) : tag}</span>${mission ? `<button type="button" data-practice="${mission.id}">${t(UI.practice)}</button>` : ""}</li>`;
      })
      .join("");
    const ach = Object.entries(ACHIEVEMENTS)
      .map(
        ([k, a]) =>
          `<li class="${state.achievements[k] ? "got" : ""}" title="${t(a.desc)}"><span aria-hidden="true">${a.icon}</span>${t(a)}</li>`,
      )
      .join("");
    d.innerHTML = `<h2>📓 ${t(UI.journal)} · ${t(def.title)}</h2>
      <section><h3>${lang() === "es" ? "Habilidades" : "Skills"}</h3><ul class="ewl-x-skills">${skillRows}</ul></section>
      ${misc ? `<section><h3>${t(UI.revisit)}</h3><ul class="ewl-x-misc">${misc}</ul></section>` : ""}
      <section><h3>${lang() === "es" ? "Logros" : "Achievements"}</h3><ul class="ewl-x-ach">${ach}</ul></section>
      <button type="button" class="ewl-x-close">${t(UI.close)}</button>`;
    document.body.append(d);
    journalEl = d;
    d.querySelector(".ewl-x-close").addEventListener("click", closeJournal);
    d.addEventListener("cancel", (e) => {
      e.preventDefault();
      closeJournal();
    });
    d.querySelectorAll("[data-practice]").forEach((b) =>
      b.addEventListener("click", () => onPractice(b.dataset.practice)),
    );
    d.showModal?.();
    d.querySelector("button")?.focus();
  }

  /* ── Mission scene ────────────────────────────────────────────────────── */
  function makeMissionScene(def) {
    return class Expedition extends Phaser.Scene {
      constructor() {
        super({ key: "Expedition" });
      }
      init(data) {
        this.missionId = data.missionId || allMissions(def)[0].id;
        this.mission = allMissions(def).find((m) => m.id === this.missionId) || allMissions(def)[0];
        this.chapterIdx = def.chapters.findIndex((c) => c.missions.includes(this.mission));
        this.revision = !!data.revision;
        this.practice = !!data.practice;
        this.seed = data.seed || (Date.now() ^ (Math.random() * 1e9)) >>> 0;
        this.misses = 0;
        this.hintsUsed = 0;
        this.demoed = false;
        this.busy = false;
        this.finished = false;
      }
      create() {
        const kit = (this.kit = makeKit(this, def));
        this.state = load(def.id);
        const m = this.mission;
        this.cameras.main.fadeIn(reducedMotion() ? 1 : 320, 2, 7, 12);
        def.paint(this, kit, {
          mode: "play",
          chapter: this.chapterIdx,
          restored: restoredFraction(def, this.state),
          state: this.state,
          mission: m,
        });
        this.hud = hudBar(this, kit, def, this.state, "· " + t(def.chapters[this.chapterIdx].name));
        Audio.startMusic(def.music);

        // Mission banner.
        this.banner = kit.panel(12, 58, W - 24, 70, { depth: 35, alpha: 0.86 });
        this.title = kit.text(
          26,
          72,
          (m.mastery ? "🏅 " : this.revision ? "🔁 " : "") + t(m.name),
          17,
          "#ffffff",
          { ox: 0, depth: 36, weight: "800" },
        );
        this.brief = kit.text(26, 86, "", 14, "#d4e7f1", {
          ox: 0,
          oy: 0,
          depth: 36,
          wrap: W - 60,
          align: "left",
        });
        this.tag = kit.text(
          W - 26,
          72,
          m.mastery
            ? t(UI.mastery)
            : this.revision
              ? lang() === "es"
                ? "Revisión"
                : "Revision"
              : "",
          13,
          "#ffd76a",
          { ox: 1, depth: 36, weight: "800" },
        );

        // Feedback strip (above the action row).
        this.fbPanel = kit.panel(12, H - 116, W - 24, 50, { depth: 35, alpha: 0.0, lineAlpha: 0 });
        this.fb = kit.text(W / 2, H - 91, "", 15, "#ffffff", { depth: 36, wrap: W - 60 });

        const api = {
          kit,
          mission: m,
          rng: rng(this.seed),
          seed: this.seed,
          revision: this.revision,
          mastery: !!m.mastery,
          tier: m.tier || 1,
          lang,
          t,
          sfx: Audio.sfx,
          /** Board area the builder owns (between banner and action row). */
          area: { x: 12, y: 134, w: W - 24, h: H - 134 - 122 },
          setBrief: (s) => {
            this.brief.setText(t(s));
            this.publishState();
          },
          say: (s) => srRegion(t(s)),
          feedback: (s, tone) => this.showFeedback(s, tone),
          refresh: () => this.publishState(),
        };
        this.controller = def.builders[m.type](this, api);
        if (!this.controller) throw new Error("No builder for mission type " + m.type);
        if (!this.brief.text) this.brief.setText(t(m.brief));

        // Action row.
        const y = H - 34;
        this.checkBtn = kit.button(
          W - 120,
          y,
          200,
          48,
          t(this.controller.checkLabel || UI.check) + " ✓",
          () => this.check(),
          { depth: 37, size: 17 },
        );
        this.hintBtn = kit.button(96, y, 150, 44, "💡 " + t(UI.hint), () => this.hint(), {
          depth: 37,
          fill: 0x2f4b5c,
          color: "#eaf6ff",
          size: 16,
        });
        this.mapBtn = kit.button(250, y, 120, 44, "🗺️ " + t(UI.map), () => this.toMap(), {
          depth: 37,
          fill: 0x2f4b5c,
          color: "#eaf6ff",
          size: 16,
        });
        if (m.mastery) this.hintBtn.setDisabled(true);

        const actions = () => {
          const own = (this.controller.actions || []).map((a) => ({ ...a, label: a.label }));
          if (this.finished) return this.endActions || [];
          return [
            ...own,
            {
              key: "Enter",
              label: this.controller.checkLabel || UI.check,
              run: () => this.check(),
              disabled: this.busy,
            },
            {
              key: "h",
              label: this.canDemo() ? UI.showMe : UI.hint,
              run: () => this.hint(),
              disabled: !!m.mastery || this.busy,
            },
            { key: "Escape", label: UI.map, run: () => this.toMap() },
          ];
        };
        this.actions = actions;
        bindKeys(this, actions);
        this.publishState();
        api.say(t(m.name) + ". " + this.brief.text);
        this.events.once("shutdown", () => this.controller.destroy?.());
      }
      canDemo() {
        return !this.mission.mastery && this.misses >= 2 && this.hintsUsed >= 2 && !this.demoed;
      }
      publishState() {
        publish(this, {
          prompt: t(this.mission.name) + ": " + this.brief.text,
          progress:
            (this.mission.mastery ? t(UI.mastery) + " · " : "") +
            (this.controller?.status ? t(this.controller.status()) : ""),
          feedback: this.fb?.text || "",
          actions: this.actions ? this.actions() : [],
        });
      }
      showFeedback(s, tone = "info") {
        const colors = { good: 0x2bd38a, bad: 0xffb35c, info: this.kit.accent, hint: 0xffd76a };
        this.fbPanel.clear();
        this.fbPanel.fillStyle(0x06121c, 0.9);
        this.fbPanel.fillRoundedRect(12, H - 116, W - 24, 50, 12);
        this.fbPanel.lineStyle(2, colors[tone] || colors.info, 0.9);
        this.fbPanel.strokeRoundedRect(12, H - 116, W - 24, 50, 12);
        this.fb.setText(t(s));
        this.kit.pop(this.fb, 1.05);
        srRegion(t(s));
        this.publishState();
      }
      async check() {
        if (this.busy || this.finished || window.GameStudio?.paused) return;
        this.busy = true;
        this.checkBtn.setDisabled(true);
        let res;
        try {
          res = await this.controller.check();
        } catch (e) {
          console.error(e);
          res = { ok: false, feedback: UI.notYet };
        }
        if (!this.scene.isActive()) return;
        this.busy = false;
        this.checkBtn.setDisabled(false);
        if (res.ok) return this.win(res);
        if (res.incomplete) {
          // Nothing to judge yet (empty plate, no stations): guide, but no miss and no evidence.
          Audio.sfx.tap();
          this.showFeedback(res.feedback || UI.notYet, "info");
          return;
        }
        this.misses++;
        Audio.sfx.miss();
        this.kit.shake(0.003, 140);
        recordEvidence(def, this.state, this.mission, {
          ok: false,
          misconception: res.misconception,
        });
        save(def, this.state);
        const extra = this.mission.mastery
          ? ""
          : this.misses >= 2 && this.hintsUsed < 2
            ? lang() === "es"
              ? " ¿Una pista?"
              : " Want a hint?"
            : this.canDemo()
              ? lang() === "es"
                ? " Puedes pedir «Muéstrame»."
                : " You can ask “Show me”."
              : "";
        this.showFeedback(t(res.feedback || UI.notYet) + extra, "bad");
        if (this.canDemo()) this.hintBtn.setLabel("🎬 " + t(UI.showMe));
      }
      async hint() {
        if (this.mission.mastery || this.busy || this.finished) return;
        const hints = this.controller.hints || [];
        if (this.canDemo() && this.controller.demo) {
          this.busy = true;
          this.demoed = true;
          this.showFeedback(
            lang() === "es"
              ? "Mira cómo se resuelve en el tablero…"
              : "Watch it get solved on the board…",
            "hint",
          );
          await this.controller.demo();
          if (!this.scene.isActive()) return;
          this.busy = false;
          this.hintBtn.setDisabled(true);
          // Worked demo → the student now does a fresh twin on their own.
          return this.win({ ok: true, demoed: true, explain: this.controller.explain?.() });
        }
        if (this.hintsUsed < hints.length) {
          const h = hints[this.hintsUsed];
          this.hintsUsed++;
          Audio.sfx.select();
          this.showFeedback("💡 " + t(h), "hint");
          if (this.hintsUsed >= hints.length)
            this.hintBtn.setLabel(this.misses >= 2 ? "🎬 " + t(UI.showMe) : "💡 " + t(UI.hint));
        } else if (!this.controller.demo || this.misses < 2) {
          this.showFeedback(
            lang() === "es"
              ? "Usaste todas las pistas. Prueba tu idea y mira lo que pasa en el mundo."
              : "That's every hint. Try your idea and watch what the world does.",
            "hint",
          );
        }
        if (this.canDemo()) this.hintBtn.setLabel("🎬 " + t(UI.showMe));
        this.publishState();
      }
      win(res) {
        if (this.finished) return;
        this.finished = true;
        const m = this.mission;
        const firstTry = this.misses === 0 && this.hintsUsed === 0 && !res.demoed;
        const stars = res.demoed ? 1 : firstTry ? 3 : 2;
        const state = this.state;
        const prev = state.missions[m.id] || {};
        const rec = (state.missions[m.id] = {
          ...prev,
          done: true,
          stars: Math.max(prev.stars || 0, stars),
          plays: (prev.plays || 0) + 1,
        });
        if (m.mastery && firstTry) rec.mastered = true;
        if (!res.demoed)
          recordEvidence(def, state, m, {
            ok: true,
            firstTry,
            independent: firstTry && (m.mastery || this.revision || m.tier >= 2),
          });
        state.xp += stars * 10;
        state.plays++;
        const chapter = def.chapters[this.chapterIdx];
        const wasChapterDone = chapter.missions.every(
          (x) => x.id === m.id ? !!prev.done : !!state.missions[x.id]?.done,
        );
        const chapterNow = chapterDone(chapter, state);
        // Achievements.
        grant(def, state, "first");
        const threeStar = Object.values(state.missions).filter((x) => x.stars === 3).length;
        if (threeStar >= 3) grant(def, state, "sharp");
        if (!res.demoed && this.misses > 0) grant(def, state, "comeback");
        if (this.revision && !res.demoed) grant(def, state, "reviser");
        if (m.mastery && firstTry) grant(def, state, "independent");
        if (chapterNow && !wasChapterDone) grant(def, state, "chapter");
        if (def.chapters.every((c) => chapterDone(c, state))) grant(def, state, "world");
        save(def, state);
        const idx = readIndex();
        if (Object.values(idx).filter((x) => x.done > 0).length >= 3) {
          grant(def, state, "explorer");
          save(def, state);
        }
        try {
          window.NTPassport?.award?.(stars * 5, def.id + ":expedition");
        } catch (_e) {}
        if (chapterNow && !wasChapterDone)
          this.time.delayedCall(reducedMotion() ? 400 : 1800, () => reportChapter(def, state, chapter));

        // Celebration: world restoration + mission card.
        Audio.sfx.success();
        this.kit.flash(0xffffff, 120);
        this.kit.burst(W / 2, H / 2, this.kit.accent, 34, { speed: 320 });
        if (def.onRestore)
          def.onRestore(this, this.kit, {
            chapter: this.chapterIdx,
            restored: restoredFraction(def, state),
            mission: m,
          });
        const explain = res.explain || this.controller.explain?.();
        this.time.delayedCall(reducedMotion() ? 50 : 650, () =>
          this.missionCard(stars, explain, res.demoed, chapterNow && !wasChapterDone),
        );
      }
      missionCard(stars, explain, demoed, chapterRestored) {
        const kit = this.kit;
        const shade = this.add.rectangle(W / 2, H / 2, W, H, 0x02070c, 0.55).setDepth(70);
        const cw = 560;
        const ch = 330;
        const x = (W - cw) / 2;
        const y = (H - ch) / 2;
        const card = kit.panel(x, y, cw, ch, {
          depth: 71,
          alpha: 0.96,
          line: 0xffd76a,
          lineWidth: 3,
          r: 20,
        });
        const head = kit.text(
          W / 2,
          y + 36,
          demoed
            ? lang() === "es"
              ? "Ahora te toca a ti"
              : "Now it's your turn"
            : t(UI.missionDone),
          26,
          "#ffffff",
          { depth: 72, weight: "900" },
        );
        const starObjs = [0, 1, 2].map((i) => {
          const s = kit.text(
            W / 2 + (i - 1) * 54,
            y + 86,
            i < stars ? "★" : "☆",
            44,
            i < stars ? "#ffd76a" : "#4b5a66",
            { depth: 72 },
          );
          if (!reducedMotion() && i < stars) {
            s.setScale(0);
            this.tweens.add({
              targets: s,
              scale: 1,
              delay: 150 + i * 160,
              duration: 420,
              ease: "Back.easeOut",
              onStart: () => Audio.sfx.tick(i * 4),
            });
          }
          return s;
        });
        const lines = [];
        if (chapterRestored)
          lines.push("🏛️ " + t(UI.restored, { place: t(def.chapters[this.chapterIdx].landmark) }));
        if (explain) lines.push(t(explain));
        if (demoed) lines.push(t(UI.revision));
        const body = kit.text(W / 2, y + 128, lines.join("\n\n"), 15, "#d8eaf3", {
          depth: 72,
          wrap: cw - 60,
          oy: 0,
        });
        const list = allMissions(def);
        const i = list.indexOf(this.mission);
        const nextM = list[i + 1];
        const end = [];
        const by = y + ch - 40;
        const mk = (bx, label, fn, key, fill) => {
          const b = kit.button(bx, by, 160, 44, t(label), fn, { depth: 73, size: 15, fill });
          end.push({ key, label, run: fn });
          return b;
        };
        const items = [shade, card, head, body, ...starObjs];
        if (demoed || stars < 3)
          items.push(
            mk(
              W / 2 - 170,
              UI.revise,
              () => this.scene.restart({ missionId: this.mission.id, revision: true }),
              "r",
              0xffd76a,
            ),
          );
        else
          items.push(
            mk(
              W / 2 - 170,
              UI.replay,
              () => this.scene.restart({ missionId: this.mission.id }),
              "r",
              0x2f4b5c,
            ),
          );
        if (nextM && !demoed)
          items.push(
            mk(W / 2 + 0, UI.next, () => this.scene.restart({ missionId: nextM.id }), "Enter"),
          );
        items.push(mk(W / 2 + 170, UI.map, () => this.toMap(), "Escape", 0x2f4b5c));
        if (items[items.length - 1].label && end.length === 2)
          items[items.length - 1].x = W / 2 + 90;
        if (end.length === 2) items[items.length - 2].x = W / 2 - 90;
        if (end[0].label && !reducedMotion()) {
          items.forEach((o) => {
            o.alpha = 0;
            this.tweens.add({ targets: o, alpha: 1, duration: 260 });
          });
          shade.alpha = 0;
          this.tweens.add({ targets: shade, alpha: 1, duration: 260 });
        }
        this.endActions = end;
        srRegion([t(head.text), stars + " " + t(UI.stars), ...lines].join(". "));
        this.publishState();
        if (stars === 3 && !reducedMotion()) this.time.delayedCall(450, () => Audio.sfx.fanfare());
      }
      toMap() {
        this.scene.start("ExpeditionMap");
      }
    };
  }

  /* ── Entry points ─────────────────────────────────────────────────────── */
  function validateDef(def) {
    const need = ["id", "title", "chapters", "paint", "builders", "skills"];
    need.forEach((k) => {
      if (!def[k]) throw new Error("EWLExpedition: def." + k + " is required");
    });
    const ids = new Set();
    allMissions(def).forEach((m) => {
      if (ids.has(m.id)) throw new Error("EWLExpedition: duplicate mission id " + m.id);
      ids.add(m.id);
      if (!def.builders[m.type]) throw new Error("EWLExpedition: no builder for type " + m.type);
      if (!def.skills[m.skill]) throw new Error("EWLExpedition: unknown skill " + m.skill);
    });
  }
  function addTitleEntry(game, def) {
    const hook = (scene) => {
      if (!scene || scene.__ewlEntry) return;
      scene.__ewlEntry = true;
      scene.events.on("create", () => {
        const kit = makeKit(scene, def);
        // def.entry = {x, y} moves the button when the title screen uses that corner.
        const bx = def.entry?.x ?? W - 118;
        const by = def.entry?.y ?? H - 48;
        const glow = kit.glow(bx, by, 260, kit.accent, 0.35, 90);
        const b = kit.button(
          bx,
          by,
          200,
          52,
          "🗺️ " + t(UI.expedition),
          () => {
            game.scene.getScenes(true).forEach((s) => game.scene.stop(s.sys.settings.key));
            game.scene.start("ExpeditionMap");
          },
          { depth: 91, size: 18 },
        );
        if (!reducedMotion())
          kit.tween({ targets: glow, alpha: 0.7, duration: 1100, yoyo: true, repeat: -1 });
        b.setName("ewl-expedition-entry");
      });
    };
    const tryHook = () => {
      const title = game.scene.getScene("Title");
      if (title) hook(title);
    };
    if (game.isBooted) tryHook();
    else game.events.once("ready", tryHook);
  }
  function register(game, def) {
    validateDef(def);
    defs[def.id] = def;
    const add = () => {
      game.scene.add("ExpeditionMap", makeMapScene(def), false);
      game.scene.add("Expedition", makeMissionScene(def), false);
      addTitleEntry(game, def);
      // Deep link: ?expedition=1 opens the map directly (hub "Continue expedition").
      if (/[?&]expedition=1\b/.test(location.search)) {
        game.scene.getScenes(true).forEach((s) => game.scene.stop(s.sys.settings.key));
        game.scene.start("ExpeditionMap");
      }
    };
    if (game.isBooted) add();
    else game.events.once("ready", add);
    game.ewlExpedition = def;
    document.documentElement.classList.add("ewl-has-expedition");
    return def;
  }
  /** For games that are not Phaser (e.g. Factor Frenzy): run the expedition in its own canvas. */
  function mountStandalone(host, def) {
    validateDef(def);
    defs[def.id] = def;
    const game = new Phaser.Game({
      type: Phaser.AUTO,
      parent: host,
      width: W,
      height: H,
      backgroundColor: "#06121c",
      scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_HORIZONTALLY },
      scene: [makeMapScene(def), makeMissionScene(def)],
    });
    game.ewlExpedition = def;
    return game;
  }

  window.EWLExpedition = {
    W,
    H,
    register,
    mountStandalone,
    lang,
    setLang,
    t,
    rng,
    audio: Audio,
    load,
    readIndex,
    achievements: ACHIEVEMENTS,
    _internals: { makeKit, restoredFraction, allMissions, chapterDone, unlocked, emptyProgress },
  };
})();
