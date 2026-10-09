/* Ratio Rally Pro: the calm progression layer for the Ratio Rally flagship.
 * Garage (cars unlocked with coins), a paced rival field, streak tiers, badges,
 * biome art and feedback effects. Nothing here reads a clock: rivals advance one
 * step per solved checkpoint, so students always set their own pace. */
(() => {
  "use strict";
  const KEY = "ratio_rally_profile_v1";
  const SKINS = [
    { id: "azure", name: "Azure", body: 0x00aaff, trim: 0x0077bb, need: 0 },
    { id: "ember", name: "Ember", body: 0xff6a2b, trim: 0xc94a14, need: 40 },
    { id: "mint", name: "Mint Runner", body: 0x2ee59d, trim: 0x1ba871, need: 90 },
    { id: "violet", name: "Violet Comet", body: 0xa86bff, trim: 0x7a3fd1, need: 160 },
    { id: "gold", name: "Golden Ratio", body: 0xffc933, trim: 0xd19a10, need: 260 },
  ];
  const TIERS = [
    { min: 7, name: "UNSTOPPABLE", mult: 2, color: "#ff7cf5" },
    { min: 5, name: "ON FIRE", mult: 2, color: "#ff8a4a" },
    { min: 3, name: "HOT STREAK", mult: 1.5, color: "#ffd23d" },
  ];
  const BADGES = [
    {
      id: "clean",
      name: "Clean Lap",
      desc: "Every checkpoint on the first try",
      test: (s) => s.totalCorrect === s.total,
    },
    {
      id: "streak5",
      name: "Five Alive",
      desc: "A streak of 5 first tries",
      test: (s) => s.maxCombo >= 5,
    },
    {
      id: "bounce",
      name: "Bounce Back",
      desc: "Learn from a miss, then get 3 first tries in a row",
      test: (s) => s.recovered,
    },
    {
      id: "champ",
      name: "Race Winner",
      desc: "Finish the trip in 1st place",
      test: (s) => s.position === 1,
    },
    {
      id: "allround",
      name: "All-Rounder",
      desc: "Practice all six skills in one trip",
      test: (s) => s.skillSeen.length >= 6,
    },
    {
      id: "coins",
      name: "Coin Collector",
      desc: "Earn 30 coins in one trip",
      test: (s) => s.coins >= 30,
    },
  ];
  const SCENERY = {
    easy: ["cactus", "rock"],
    medium: ["lamp", "bldg"],
    hard: ["crystal", "asteroid"],
  };
  const PACE = { easy: [0.7, 0.8], medium: [0.78, 0.88], hard: [0.86, 0.95] };
  const GAIN = [1.15, 0.85, 0.6]; // race progress by number of wrong tries before solving
  const ORDINAL = ["1st", "2nd", "3rd"];

  // ── Profile (lifetime coins, chosen car, badges) ──
  let profile = null;
  const blank = () => ({ coins: 0, trips: 0, skin: "azure", badges: {} });
  function readProfile() {
    try {
      const v = JSON.parse(localStorage.getItem(KEY) || "null");
      if (v && typeof v === "object") {
        const coins = Number.isFinite(v.coins) && v.coins > 0 ? Math.floor(v.coins) : 0;
        const trips = Number.isFinite(v.trips) && v.trips > 0 ? Math.floor(v.trips) : 0;
        const skin = SKINS.some((s) => s.id === v.skin && coins >= s.need) ? v.skin : "azure";
        const badges = v.badges && typeof v.badges === "object" ? v.badges : {};
        return { coins, trips, skin, badges };
      }
    } catch (e) {}
    return blank();
  }
  const getProfile = () => (profile ||= readProfile());
  function persist() {
    try {
      localStorage.setItem(KEY, JSON.stringify(profile));
    } catch (e) {}
  }
  const carKey = () => `car_${getProfile().skin}`;

  // ── Pure rules ──
  const tierFor = (combo) => TIERS.find((t) => combo >= t.min) || null;
  const points = (base, tries, combo) =>
    Math.round(base * (tries === 0 ? tierFor(combo)?.mult || 1 : 1));
  const coinsFor = (tries, nitro) => (tries === 0 ? (nitro ? 5 : 3) : tries === 1 ? 2 : 1);
  const ordinal = (position) => ORDINAL[position - 1] || `${position}th`;
  function rank(firstTryPct, position) {
    const score = firstTryPct + (position === 1 ? 10 : position === 2 ? 5 : 0);
    return score >= 95 ? "S" : score >= 80 ? "A" : score >= 60 ? "B" : "C";
  }
  function createRace(difficulty, total) {
    const pace = PACE[difficulty] || PACE.easy;
    const jitter = pace.map(() =>
      Array.from({ length: total }, () => (Math.random() - 0.5) * 0.24),
    );
    let step = 0;
    let player = 0;
    const rivalAt = (i) => jitter[i].slice(0, step).reduce((sum, j) => sum + pace[i] + j, 0);
    const snapshot = () => {
      const rivals = pace.map((_, i) => rivalAt(i));
      return { player, rivals, position: 1 + rivals.filter((r) => r > player).length };
    };
    return {
      snapshot,
      advance(tries, nitro) {
        step++;
        player += GAIN[Math.min(tries, GAIN.length - 1)] + (nitro ? 0.25 : 0);
        return snapshot();
      },
    };
  }
  // Commit one finished trip to the profile. Call exactly once per trip.
  function commit(stats) {
    const p = getProfile();
    const before = p.coins;
    p.coins += stats.coins;
    p.trips += 1;
    const earned = BADGES.filter((b) => b.test(stats));
    const fresh = earned.filter((b) => !p.badges[b.id]);
    fresh.forEach((b) => {
      p.badges[b.id] = true;
    });
    persist();
    return {
      earned,
      fresh,
      unlockedSkins: SKINS.filter((s) => s.need > before && s.need <= p.coins),
      totalCoins: p.coins,
      owned: { ...p.badges },
    };
  }

  // ── Textures ──
  function carArt(g, body, trim) {
    g.fillStyle(0x222222);
    [
      [0, 5],
      [24, 5],
      [0, 35],
      [24, 35],
    ].forEach(([x, y]) => g.fillRoundedRect(x, y, 6, 13, 2));
    g.fillStyle(body);
    g.fillRoundedRect(3, 0, 24, 50, 8);
    g.fillStyle(trim);
    g.fillRect(13, 2, 4, 42);
    g.fillRect(3, 44, 24, 4);
    g.fillStyle(0x9fe3ff);
    g.fillRoundedRect(7, 13, 16, 9, 3);
    g.fillStyle(0x4a7a99);
    g.fillRoundedRect(8, 31, 14, 6, 2);
    g.fillStyle(0xfff2a0);
    g.fillRect(5, 1, 6, 3);
    g.fillRect(19, 1, 6, 3);
    g.fillStyle(0xff3030);
    g.fillRect(5, 47, 6, 2);
    g.fillRect(19, 47, 6, 2);
  }
  const ART = {
    cactus: [
      22,
      38,
      (g) => {
        g.fillStyle(0x3f8f4a);
        g.fillRoundedRect(8, 4, 7, 34, 3);
        g.fillRect(1, 16, 8, 4);
        g.fillRect(1, 9, 4, 11);
        g.fillRect(14, 12, 8, 4);
        g.fillRect(18, 6, 4, 10);
        g.fillStyle(0x5fb26a);
        g.fillRect(10, 6, 2, 30);
      },
    ],
    rock: [
      28,
      18,
      (g) => {
        g.fillStyle(0x8a6a4a);
        g.fillEllipse(14, 11, 28, 14);
        g.fillStyle(0xa98462);
        g.fillEllipse(11, 8, 14, 7);
      },
    ],
    lamp: [
      20,
      44,
      (g) => {
        g.fillStyle(0x556677);
        g.fillRect(9, 8, 3, 36);
        g.fillStyle(0xffe7a0, 0.25);
        g.fillCircle(10, 8, 9);
        g.fillStyle(0xffe7a0);
        g.fillCircle(10, 8, 5);
      },
    ],
    bldg: [
      34,
      60,
      (g) => {
        g.fillStyle(0x1f2a40);
        g.fillRect(0, 0, 34, 60);
        for (let r = 0; r < 5; r++)
          for (let c = 0; c < 3; c++) {
            g.fillStyle((r * 7 + c * 3) % 4 === 0 ? 0xffe08a : 0x33415f);
            g.fillRect(4 + c * 10, 6 + r * 11, 6, 7);
          }
      },
    ],
    crystal: [
      20,
      38,
      (g) => {
        g.fillStyle(0x7ef0ff);
        g.beginPath();
        g.moveTo(10, 0);
        g.lineTo(20, 16);
        g.lineTo(12, 38);
        g.lineTo(4, 30);
        g.lineTo(0, 14);
        g.closePath();
        g.fillPath();
        g.fillStyle(0xc9fbff);
        g.fillTriangle(10, 3, 14, 14, 7, 16);
      },
    ],
    asteroid: [
      30,
      26,
      (g) => {
        g.fillStyle(0x6b6478);
        g.fillCircle(14, 13, 12);
        g.fillCircle(22, 15, 8);
        g.fillStyle(0x4e4860);
        g.fillCircle(10, 10, 3);
        g.fillCircle(20, 18, 2.5);
      },
    ],
    coin: [
      18,
      18,
      (g) => {
        g.fillStyle(0xd19a10);
        g.fillCircle(9, 9, 9);
        g.fillStyle(0xffd23d);
        g.fillCircle(9, 9, 7);
        g.fillStyle(0xfff0a0);
        g.fillRect(8, 4, 2, 10);
      },
    ],
    flame: [
      14,
      28,
      (g) => {
        g.fillStyle(0xff7a1a);
        g.fillTriangle(0, 0, 14, 0, 7, 28);
        g.fillStyle(0xffe066);
        g.fillTriangle(3, 0, 11, 0, 7, 16);
      },
    ],
    speedline: [
      2,
      46,
      (g) => {
        g.fillStyle(0xffffff, 0.55);
        g.fillRect(0, 0, 2, 46);
      },
    ],
    rumble: [
      10,
      40,
      (g) => {
        g.fillStyle(0xdd3333);
        g.fillRect(0, 0, 10, 20);
        g.fillStyle(0xffffff);
        g.fillRect(0, 20, 10, 20);
      },
    ],
  };
  function buildTextures(scene) {
    const g = scene.make.graphics({ add: false });
    const make = (key, w, h, draw) => {
      if (scene.textures.exists(key)) return;
      draw(g);
      g.generateTexture(key, w, h);
      g.clear();
    };
    SKINS.forEach((s) => make(`car_${s.id}`, 30, 50, (gg) => carArt(gg, s.body, s.trim)));
    make("car_rival1", 30, 50, (gg) => carArt(gg, 0xff4444, 0xcc2222));
    make("car_rival2", 30, 50, (gg) => carArt(gg, 0xffaa00, 0xcc8800));
    Object.entries(ART).forEach(([key, [w, h, draw]]) => make(key, w, h, draw));
    g.destroy();
  }
  const sceneryFor = (difficulty) => SCENERY[difficulty] || SCENERY.easy;

  // ── Feedback effects (all honor scene.reducedMotion) ──
  function popup(scene, x, y, text, color = "#ffffff", size = 22) {
    const t = scene.add
      .text(x, y, text, {
        fontSize: `${size}px`,
        fontStyle: "bold",
        color,
        stroke: "#000000",
        strokeThickness: 4,
      })
      .setOrigin(0.5)
      .setDepth(40);
    if (scene.reducedMotion) {
      scene.time.delayedCall(900, () => t.destroy());
      return t;
    }
    scene.tweens.add({
      targets: t,
      y: y - 50,
      alpha: 0,
      duration: 1100,
      ease: "Cubic.easeOut",
      onComplete: () => t.destroy(),
    });
    return t;
  }
  function flair(scene, text, color) {
    const t = scene.add
      .text(scene.scale.width / 2, 82, text, {
        fontSize: "30px",
        fontStyle: "bold",
        color,
        stroke: "#000000",
        strokeThickness: 5,
      })
      .setOrigin(0.5)
      .setDepth(41);
    if (scene.reducedMotion) {
      scene.time.delayedCall(1100, () => t.destroy());
      return;
    }
    t.setScale(0.4);
    scene.tweens.add({ targets: t, scale: 1, duration: 260, ease: "Back.easeOut" });
    scene.tweens.add({
      targets: t,
      alpha: 0,
      delay: 900,
      duration: 300,
      onComplete: () => t.destroy(),
    });
  }
  function nextToast(scene) {
    const item = scene.toastQ.shift();
    if (!item) {
      scene.toastBusy = false;
      return;
    }
    scene.toastBusy = true;
    const { width, height } = scene.scale;
    const bg = scene.add.rectangle(0, 0, 380, 48, 0x0d1b33, 0.96).setStrokeStyle(2, item.color);
    const title = scene.add
      .text(0, -9, item.title, { fontSize: "16px", fontStyle: "bold", color: "#ffffff" })
      .setOrigin(0.5);
    const sub = scene.add
      .text(0, 11, item.sub, { fontSize: "12px", color: "#b8d4ee" })
      .setOrigin(0.5);
    const box = scene.add.container(width / 2, height + 40, [bg, title, sub]).setDepth(45);
    const finish = () => {
      box.destroy();
      nextToast(scene);
    };
    if (scene.reducedMotion) {
      box.y = height - 34;
      scene.time.delayedCall(1800, finish);
      return;
    }
    scene.tweens.add({ targets: box, y: height - 34, duration: 260, ease: "Back.easeOut" });
    scene.time.delayedCall(1900, () =>
      scene.tweens.add({ targets: box, y: height + 40, duration: 220, onComplete: finish }),
    );
  }
  function toast(scene, title, sub, color = 0xffd23d) {
    (scene.toastQ ||= []).push({ title, sub, color });
    if (!scene.toastBusy) nextToast(scene);
  }
  function shake(scene, ms = 140, amount = 0.004) {
    if (!scene.reducedMotion) scene.cameras.main.shake(ms, amount);
  }
  function coinFly(scene, from, to, count, onArrive) {
    for (let i = 0; i < count; i++) {
      const c = scene.add.image(from.x, from.y, "coin").setDepth(42);
      if (scene.reducedMotion) {
        c.destroy();
        continue;
      }
      scene.tweens.add({
        targets: c,
        x: to.x,
        y: to.y,
        delay: i * 70,
        duration: 520,
        ease: "Cubic.easeIn",
        onComplete: () => {
          c.destroy();
          onArrive?.();
        },
      });
    }
  }

  // ── Garage selector (title screen) ──
  function garageUI(scene, cx, y, { onChange, onMove } = {}) {
    const p = getProfile();
    let idx = Math.max(
      0,
      SKINS.findIndex((s) => s.id === p.skin),
    );
    const name = scene.add
      .text(cx, y - 8, "", { fontSize: "17px", fontStyle: "bold", color: "#ffffff" })
      .setOrigin(0.5);
    const sub = scene.add
      .text(cx, y + 14, "", { fontSize: "12px", color: "#9fc3e6" })
      .setOrigin(0.5);
    const preview = scene.add
      .image(cx - 150, y, carKey())
      .setScale(0.7)
      .setAngle(90);
    const render = () => {
      const s = SKINS[idx];
      const open = p.coins >= s.need;
      name.setText(open ? s.name : `${s.name} (locked)`).setColor(open ? "#ffffff" : "#8899aa");
      sub.setText(
        open
          ? `${p.coins} coins saved  ·  ◀ ▶ changes your car`
          : `Unlocks at ${s.need} coins  ·  you have ${p.coins}`,
      );
      preview.setTexture(`car_${s.id}`);
      if (open) {
        preview.clearTint();
        p.skin = s.id;
        persist();
        onChange?.(`car_${s.id}`);
      } else preview.setTint(0x445566);
    };
    const move = (dir) => {
      idx = (idx + dir + SKINS.length) % SKINS.length;
      onMove?.();
      render();
    };
    [
      [cx - 190, "◀", -1],
      [cx + 190, "▶", 1],
    ].forEach(([x, label, dir]) => {
      const r = scene.add
        .rectangle(x, y, 44, 34, 0x224466)
        .setStrokeStyle(2, 0x6fa8dc)
        .setInteractive({ useHandCursor: true });
      scene.add.text(x, y, label, { fontSize: "18px", color: "#ffffff" }).setOrigin(0.5);
      r.on("pointerdown", () => move(dir));
    });
    scene.input.keyboard.on("keydown-LEFT", () => move(-1));
    scene.input.keyboard.on("keydown-RIGHT", () => move(1));
    render();
  }

  window.RRPro = Object.freeze({
    SKINS,
    BADGES,
    TIERS,
    profile: getProfile,
    carKey,
    buildTextures,
    sceneryFor,
    createRace,
    tierFor,
    points,
    coinsFor,
    rank,
    ordinal,
    commit,
    popup,
    flair,
    toast,
    shake,
    coinFly,
    garageUI,
  });
})();
