/* =============================================================================
 * sports.js — the Soccer Season progression for Shai's planner.
 * -----------------------------------------------------------------------------
 * WHAT THIS IS
 * A Zwift-style, money-free reward track. Finishing real work (a to-do, a
 * routine, a focus session, a set of push-ups) earns TRAINING POINTS. Points
 * carry the ball up the pitch, level you up through a season ladder, and unlock
 * cosmetic gear you can equip on your player card. Nothing here is real, buyable
 * or tradeable — it is pride, not property, and it is deliberately kept separate
 * from the allowance ledger so a capped-out day still makes progress.
 *
 * WHY IT IS ITS OWN FILE
 * app.js is a single 500KB hand-formatted bundle; anything added there is hard
 * to read and easy to break. The whole progression — catalog, curve, markup —
 * lives here as pure functions over a plain `sport` object. app.js owns exactly
 * three things: award points on an earn, render what this returns, and equip.
 *
 * SIBLING: focus-school/sports.js is the same engine with a baseball THEME.
 * Keep the two engines identical; only THEME differs.
 * ===========================================================================*/
(() => {
  "use strict";

  // --- Theme: everything sport-specific lives in this one object -------------
  const THEME = {
    key: "soccer",
    title: "Soccer Season",
    icon: "⚽",
    tagline: "Earn training points, carry the ball up the pitch, unlock kit.",
    accent: "#15803d",
    accentSoft: "#dcfce7",
    // Points needed to REACH each level. Gaps widen so late levels stay special
    // without ever becoming unreachable for a kid who works most days.
    levels: [
      { at: 0, name: "Park Kickabout", badge: "⚽" },
      { at: 120, name: "Club Trialist", badge: "🥾" },
      { at: 300, name: "Squad Regular", badge: "👕" },
      { at: 540, name: "First XI", badge: "🥇" },
      { at: 840, name: "Playmaker", badge: "🧠" },
      { at: 1200, name: "Striker", badge: "🎯" },
      { at: 1650, name: "Captain's Armband", badge: "🧢" },
      { at: 2200, name: "Cup Semi-Final", badge: "🔥" },
      { at: 2850, name: "Cup Final", badge: "🏟️" },
      { at: 3600, name: "Golden Boot", badge: "👟" },
      { at: 4500, name: "League Champion", badge: "🏆" },
      { at: 5600, name: "Legend", badge: "👑" },
    ],
    slots: [
      ["boots", "Boots"],
      ["ball", "Balls"],
      ["kit", "Kit"],
      ["socks", "Socks"],
      ["shin", "Shin pads"],
      ["keeper", "Keeper gloves"],
      ["extra", "Captain gear"],
      ["bag", "Kit bag"],
      ["pitch", "Pitches"],
    ],
    // The locker has more slots than one line of emoji can show, so the
    // player card renders only these — the rest are still worn.
    avatarSlots: ["kit", "boots", "ball", "extra", "pitch"],
    avatar: { name: "Shai", number: "10" },
    // Cosmetic gear. `level` opens the item in the shop; `price` uses training
    // points already earned. Buying gear never lowers XP or a season level.
    gear: [
      {
        id: "boots_street",
        slot: "boots",
        level: 1,
        price: 0,
        emoji: "👟",
        name: "Street Trainers",
        note: "Grass, concrete, whatever.",
      },
      {
        id: "boots_astro",
        slot: "boots",
        level: 2,
        emoji: "🟩",
        name: "Astro Turf Trainers",
        note: "Rubber pimples for indoors.",
      },
      {
        id: "boots_studs",
        slot: "boots",
        level: 3,
        price: 140,
        emoji: "🔩",
        name: "Screw-In Studs",
        note: "Swap them for a wet pitch.",
      },
      {
        id: "boots_blades",
        slot: "boots",
        level: 4,
        emoji: "🌱",
        name: "Firm-Ground Blades",
        note: "Blades bite, turns get sharp.",
      },
      {
        id: "boots_laceless",
        slot: "boots",
        level: 5,
        emoji: "➿",
        name: "Laceless Speed Boots",
        note: "Nothing between foot and ball.",
      },
      {
        id: "boots_leather",
        slot: "boots",
        level: 6,
        emoji: "🟫",
        name: "Kangaroo-Leather Classics",
        note: "Broken in by game two.",
      },
      {
        id: "boots_flame",
        slot: "boots",
        level: 7,
        price: 360,
        emoji: "🔥",
        name: "Flame Boots",
        note: "Left-foot rocket included.",
      },
      {
        id: "boots_knit",
        slot: "boots",
        level: 8,
        emoji: "🧵",
        name: "Knitted Sock Boots",
        note: "Pulls on like a sock.",
      },
      {
        id: "boots_carbon",
        slot: "boots",
        level: 9,
        emoji: "⚫",
        name: "Carbon-Plate Sprinters",
        note: "Stiff plate, all forward.",
      },
      {
        id: "boots_gold",
        slot: "boots",
        level: 10,
        price: 650,
        emoji: "🥇",
        name: "Golden Boots",
        note: "Top scorer energy.",
      },
      {
        id: "boots_sg",
        slot: "boots",
        level: 11,
        emoji: "⚙️",
        name: "Soft-Ground Metal Tips",
        note: "Six studs for a muddy final.",
      },
      {
        id: "boots_signature",
        slot: "boots",
        level: 12,
        emoji: "🌟",
        name: "Signature Boots",
        note: "Your name on the heel.",
      },
      {
        id: "ball_worn",
        slot: "ball",
        level: 1,
        price: 0,
        emoji: "⚽",
        name: "Park Ball",
        note: "Slightly flat. Still perfect.",
      },
      {
        id: "ball_hivis",
        slot: "ball",
        level: 2,
        emoji: "🟠",
        name: "Hi-Vis Winter Ball",
        note: "Orange, so snow can't hide it.",
      },
      {
        id: "ball_futsal",
        slot: "ball",
        level: 3,
        emoji: "🔵",
        name: "Futsal Ball",
        note: "Small, heavy, low bounce.",
      },
      {
        id: "ball_match",
        slot: "ball",
        level: 4,
        price: 190,
        emoji: "✨",
        name: "Match Ball",
        note: "Pumped to exactly right.",
      },
      {
        id: "ball_thermo",
        slot: "ball",
        level: 6,
        emoji: "🌍",
        name: "Thermo-Bonded Pro",
        note: "No stitches, no soaking up rain.",
      },
      {
        id: "ball_comet",
        slot: "ball",
        level: 8,
        price: 430,
        emoji: "☄️",
        name: "Comet Ball",
        note: "Leaves a trail on the volley.",
      },
      {
        id: "ball_final",
        slot: "ball",
        level: 11,
        emoji: "🌟",
        name: "Cup Final Ball",
        note: "Gold panels. One game only.",
      },
      {
        id: "kit_home",
        slot: "kit",
        level: 1,
        price: 0,
        emoji: "👕",
        name: "Home Shirt",
        note: "Number on the back.",
      },
      {
        id: "kit_away",
        slot: "kit",
        level: 2,
        price: 80,
        emoji: "🎽",
        name: "Away Kit",
        note: "For the loud games.",
      },
      {
        id: "kit_keeper",
        slot: "kit",
        level: 4,
        emoji: "🧤",
        name: "Keeper Shirt",
        note: "Long sleeves, padded elbows.",
      },
      {
        id: "kit_neon",
        slot: "kit",
        level: 6,
        price: 300,
        emoji: "🟩",
        name: "Neon Third Kit",
        note: "Visible from the stands.",
      },
      {
        id: "kit_retro",
        slot: "kit",
        level: 8,
        emoji: "📻",
        name: "1990s Retro Shirt",
        note: "Baggy on purpose.",
      },
      {
        id: "kit_champ",
        slot: "kit",
        level: 11,
        price: 760,
        emoji: "🏆",
        name: "Champions Kit",
        note: "Earned, not bought.",
      },
      {
        id: "socks_club",
        slot: "socks",
        level: 1,
        emoji: "🧦",
        name: "Club Socks",
        note: "Pulled up over the knee.",
      },
      {
        id: "socks_grip",
        slot: "socks",
        level: 3,
        emoji: "🕸️",
        name: "Grip Socks",
        note: "Sticky pads, foot stays put.",
      },
      {
        id: "socks_cut",
        slot: "socks",
        level: 6,
        emoji: "✂️",
        name: "Cut-Off Socks",
        note: "The pro look. Coach is unsure.",
      },
      {
        id: "socks_gold",
        slot: "socks",
        level: 10,
        emoji: "🟡",
        name: "Gold Trim Socks",
        note: "Final-day socks.",
      },
      {
        id: "shin_slip",
        slot: "shin",
        level: 1,
        emoji: "🛡️",
        name: "Slip-In Shin Pads",
        note: "Light. Barely there.",
      },
      {
        id: "shin_ankle",
        slot: "shin",
        level: 4,
        emoji: "🦶",
        name: "Ankle-Guard Pads",
        note: "For the tackles you don't see.",
      },
      {
        id: "shin_carbon",
        slot: "shin",
        level: 8,
        emoji: "⬛",
        name: "Carbon Shin Guards",
        note: "Feels like nothing. Stops everything.",
      },
      {
        id: "shin_custom",
        slot: "shin",
        level: 11,
        emoji: "🖼️",
        name: "Custom Printed Pads",
        note: "Your photo on the front.",
      },
      {
        id: "keeper_basic",
        slot: "keeper",
        level: 1,
        emoji: "🧤",
        name: "Training Keeper Gloves",
        note: "For when you go in goal.",
      },
      {
        id: "keeper_negative",
        slot: "keeper",
        level: 4,
        emoji: "🫱",
        name: "Negative-Cut Grip",
        note: "Tight fit, more feel.",
      },
      {
        id: "keeper_finger",
        slot: "keeper",
        level: 7,
        emoji: "🖐️",
        name: "Finger-Save Spines",
        note: "Stops the bend-back.",
      },
      {
        id: "keeper_pro",
        slot: "keeper",
        level: 10,
        emoji: "🟣",
        name: "All-Weather Pro Palms",
        note: "Sticky in the rain.",
      },
      {
        id: "extra_band",
        slot: "extra",
        level: 1,
        price: 0,
        emoji: "🦺",
        name: "Training Bib",
        note: "Everyone starts in a bib.",
      },
      {
        id: "extra_tape",
        slot: "extra",
        level: 2,
        emoji: "🩹",
        name: "Sock Tape",
        note: "Holds the pads, looks pro.",
      },
      {
        id: "extra_armband",
        slot: "extra",
        level: 5,
        price: 240,
        emoji: "🅰️",
        name: "Captain's Armband",
        note: "You lead the warm-up now.",
      },
      {
        id: "extra_snood",
        slot: "extra",
        level: 6,
        emoji: "🧣",
        name: "Winter Snood",
        note: "For January training.",
      },
      {
        id: "extra_crown",
        slot: "extra",
        level: 9,
        price: 520,
        emoji: "👑",
        name: "Crown",
        note: "Slightly ridiculous. Deserved.",
      },
      {
        id: "extra_medal",
        slot: "extra",
        level: 12,
        emoji: "🏅",
        name: "League Medal",
        note: "Round your neck at full time.",
      },
      {
        id: "bag_school",
        slot: "bag",
        level: 1,
        emoji: "🎒",
        name: "School Backpack",
        note: "Boots in a plastic bag.",
      },
      {
        id: "bag_duffel",
        slot: "bag",
        level: 3,
        emoji: "👝",
        name: "Club Duffel",
        note: "Name printed on the side.",
      },
      {
        id: "bag_boot",
        slot: "bag",
        level: 6,
        emoji: "👜",
        name: "Boot Bag",
        note: "Keeps mud off everything else.",
      },
      {
        id: "bag_pro",
        slot: "bag",
        level: 10,
        emoji: "🧳",
        name: "Pro Travel Case",
        note: "Wheels and a team crest.",
      },
      {
        id: "pitch_park",
        slot: "pitch",
        level: 1,
        price: 0,
        emoji: "🏞️",
        name: "The Park",
        note: "Jumpers for goalposts.",
      },
      {
        id: "pitch_cage",
        slot: "pitch",
        level: 3,
        emoji: "🔗",
        name: "Street Cage",
        note: "Rebound off the fence, play on.",
      },
      {
        id: "pitch_lights",
        slot: "pitch",
        level: 4,
        price: 200,
        emoji: "💡",
        name: "Floodlit Pitch",
        note: "Kick-off under the lights.",
      },
      {
        id: "pitch_dome",
        slot: "pitch",
        level: 6,
        emoji: "🟢",
        name: "Astro Turf Dome",
        note: "Winter league home.",
      },
      {
        id: "pitch_stadium",
        slot: "pitch",
        level: 8,
        price: 450,
        emoji: "🏟️",
        name: "The Big Stadium",
        note: "60,000 singing.",
      },
      {
        id: "pitch_moon",
        slot: "pitch",
        level: 12,
        price: 900,
        emoji: "🌙",
        name: "Moonlight Pitch",
        note: "Only legends play here.",
      },
    ],
    // The four legs of the run you make up the pitch inside every level.
    legs: ["Own half", "Midfield", "Final third", "Goal"],
    lapWord: "run up the pitch",
    pointWord: "training points",
    moveLine: "Every finished thing carries the ball forward.",
    maxLine: "You have taken the ball as far as it goes.",
    formWord: "On form",
    formLine: "days in a row with work finished",
    // Awarded purely by reaching a level — nothing extra to grind for.
    trophies: [
      { level: 3, emoji: "👟", name: "Signed" },
      { level: 6, emoji: "🎯", name: "Goal Machine" },
      { level: 9, emoji: "🧤", name: "Cup Run" },
      { level: 12, emoji: "👑", name: "Legend" },
    ],
  };

  // Catalog entries may be expanded independently, so pricing lives here as
  // the single fallback rule. Explicit prices still win; every starter is free.
  const GEAR_PRICE_BY_LEVEL = [0, 80, 140, 190, 240, 300, 360, 430, 520, 650, 760, 900];
  for (const item of THEME.gear) {
    if (!Number.isFinite(Number(item.price))) {
      item.price = GEAR_PRICE_BY_LEVEL[item.level - 1] ?? GEAR_PRICE_BY_LEVEL.at(-1);
    }
  }

  // --- Points ---------------------------------------------------------------
  // What each kind of finished work is worth. Deliberately flat-ish: the point
  // is consistency, not optimizing which task to do.
  const POINTS = {
    task: 10,
    routine: 12,
    focus: 15,
    reminder: 5,
    health: 20,
    pushups: 20,
  };
  const pointsFor = (kind) => POINTS[kind] || 8;

  const clampInt = (v, min, max) => {
    const n = Math.floor(Number(v));
    return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : min;
  };

  // A synced or imported blob can carry anything — never trust it into the UI.
  function normalize(s) {
    const src = s && typeof s === "object" ? s : {};
    const xp = clampInt(src.xp, 0, 10_000_000);
    const equipped = {};
    for (const [slot] of THEME.slots) {
      const id = src.equipped?.[slot];
      if (typeof id === "string" && THEME.gear.some((g) => g.id === id && g.slot === slot)) {
        equipped[slot] = id;
      }
    }
    // Before the shop existed, reaching a level automatically owned every item
    // at that level. Preserve those lockers once, then use the explicit list.
    const legacyOwned = THEME.gear
      .filter((g) => g.level <= levelInfo(xp).level)
      .map((g) => g.id);
    const requestedOwned = Array.isArray(src.owned) ? src.owned : legacyOwned;
    const owned = [...new Set([
      ...THEME.gear.filter((g) => g.price === 0).map((g) => g.id),
      ...requestedOwned,
      ...Object.values(equipped),
    ])].filter((id) => THEME.gear.some((g) => g.id === id));
    const day = typeof src.lastDay === "string" && /^\d{4}-\d{2}-\d{2}$/.test(src.lastDay)
      ? src.lastDay
      : "";
    return {
      xp,
      owned,
      equipped,
      // Consecutive days with something finished. Form is a reason to come
      // back tomorrow; it never takes points away, it only adds a bonus.
      streak: clampInt(src.streak, 0, 3650),
      bestStreak: clampInt(src.bestStreak, 0, 3650),
      lastDay: day,
      // Highest level the kid has actually been CONGRATULATED for, so a
      // level-up celebration fires exactly once per level, on any device.
      celebrated: clampInt(src.celebrated, 0, THEME.levels.length),
    };
  }

  // XP only ever grows, so the merge rule across devices is simply "keep the
  // most progress" — no clock comparison, nothing to lose in a race.
  function merge(local, remote) {
    const a = normalize(local);
    const b = normalize(remote);
    const winner = b.xp > a.xp ? b : a;
    // The device that worked most recently owns the running streak; the best
    // streak ever is simply the higher of the two.
    const recent = b.lastDay > a.lastDay ? b : a;
    return {
      xp: Math.max(a.xp, b.xp),
      owned: [...new Set([...a.owned, ...b.owned])],
      equipped: { ...a.equipped, ...winner.equipped },
      celebrated: Math.max(a.celebrated, b.celebrated),
      streak: recent.streak,
      lastDay: recent.lastDay,
      bestStreak: Math.max(a.bestStreak, b.bestStreak, recent.streak),
    };
  }

  // Where a point total sits on the ladder: current level, progress into it,
  // and what is left to the next one.
  function levelInfo(xp) {
    const total = Math.max(0, Number(xp) || 0);
    let idx = 0;
    for (let i = 0; i < THEME.levels.length; i++) if (total >= THEME.levels[i].at) idx = i;
    const cur = THEME.levels[idx];
    const next = THEME.levels[idx + 1] || null;
    const span = next ? next.at - cur.at : 0;
    const into = total - cur.at;
    return {
      level: idx + 1,
      name: cur.name,
      badge: cur.badge,
      total,
      into,
      span,
      toNext: next ? next.at - total : 0,
      nextName: next ? next.name : "",
      pct: next ? Math.min(100, Math.round((into / span) * 100)) : 100,
      isMax: !next,
    };
  }

  const unlockedGear = (xp) => THEME.gear.filter((g) => g.level <= levelInfo(xp).level);
  const lockedGear = (xp) => THEME.gear.filter((g) => g.level > levelInfo(xp).level);
  const nextUnlock = (xp) => lockedGear(xp).sort((a, b) => a.level - b.level)[0] || null;
  const ownsItem = (sport, itemId) => normalize(sport).owned.includes(itemId);
  const gearBalance = (sport) => {
    const s = normalize(sport);
    const spent = s.owned.reduce((sum, id) => sum + (itemById(id)?.price || 0), 0);
    return Math.max(0, s.xp - spent);
  };

  // Add points for one finished thing. Returns the new sport object plus what
  // just changed, so the caller can celebrate without recomputing anything.
  const dayBefore = (isoDay) => {
    const d = new Date(`${isoDay}T12:00:00`);
    if (Number.isNaN(d.getTime())) return "";
    d.setDate(d.getDate() - 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
      d.getDate(),
    ).padStart(2, "0")}`;
  };

  // Points for keeping a streak alive, paid once on the first finished thing
  // of a new day. Capped so a long streak stays a nice bonus rather than the
  // only thing that matters.
  const formBonusFor = (streak) => Math.min(7, Math.max(0, streak)) * 5;

  // Add points for one finished thing. `today` (YYYY-MM-DD) lets the caller's
  // clock own what "a day" means. Returns the new sport object plus what just
  // changed, so the caller can celebrate without recomputing anything.
  function award(sport, kind, amount, today) {
    const before = normalize(sport);
    const gain = Math.max(0, Math.round(Number(amount) || pointsFor(kind)));
    let streak = before.streak;
    let bonus = 0;
    const isNewDay = typeof today === "string" && today && today !== before.lastDay;
    if (isNewDay) {
      streak = before.lastDay && dayBefore(today) === before.lastDay ? before.streak + 1 : 1;
      bonus = formBonusFor(streak);
    }
    const after = {
      ...before,
      xp: before.xp + gain + bonus,
      streak,
      bestStreak: Math.max(before.bestStreak, streak),
      lastDay: isNewDay ? today : before.lastDay,
    };
    const wasLevel = levelInfo(before.xp).level;
    const nowLevel = levelInfo(after.xp).level;
    const fresh = THEME.gear.filter((g) => g.level > wasLevel && g.level <= nowLevel);
    return {
      sport: after,
      gain,
      formBonus: bonus,
      streak,
      leveledUp: nowLevel > wasLevel,
      level: levelInfo(after.xp),
      unlocked: fresh,
    };
  }

  function equip(sport, itemId) {
    const cur = normalize(sport);
    const item = THEME.gear.find((g) => g.id === itemId);
    if (!item || !cur.owned.includes(item.id)) return cur;
    return { ...cur, equipped: { ...cur.equipped, [item.slot]: item.id } };
  }

  function purchase(sport, itemId) {
    const cur = normalize(sport);
    const item = THEME.gear.find((g) => g.id === itemId);
    if (!item) return { sport: cur, status: "missing", item: null };
    if (cur.owned.includes(item.id)) return { sport: cur, status: "owned", item };
    if (item.level > levelInfo(cur.xp).level) return { sport: cur, status: "level", item };
    if (item.price > gearBalance(cur)) return { sport: cur, status: "points", item };
    const next = { ...cur, owned: [...cur.owned, item.id] };
    // The new purchase goes straight onto the avatar for an immediate payoff.
    next.equipped = { ...next.equipped, [item.slot]: item.id };
    return { sport: next, status: "purchased", item };
  }

  const itemById = (id) => THEME.gear.find((g) => g.id === id) || null;

  // --- Markup ---------------------------------------------------------------
  // Returned as strings so app.js keeps its one-render-pass model. The <style>
  // is injected once by app.js rather than shipping a second stylesheet.
  const CSS = `
  .sp-wrap{--sp-accent:${THEME.accent};--sp-soft:${THEME.accentSoft}}
  .sp-card{display:grid;grid-template-columns:minmax(210px,1.05fr) minmax(210px,.95fr);gap:18px;align-items:center}
  .sp-stage{position:relative;min-height:280px;overflow:hidden;border-radius:24px;background:linear-gradient(var(--sp-sky,#7dd3fc) 0 57%,var(--sp-ground,#4ade80) 57%);box-shadow:inset 0 0 0 1px rgba(255,255,255,.45),0 18px 38px rgba(15,23,42,.18);isolation:isolate}
  .sp-stage:before{content:"";position:absolute;inset:56% -15% -40%;background:repeating-linear-gradient(102deg,rgba(255,255,255,.12) 0 24px,transparent 24px 48px);transform:perspective(180px) rotateX(34deg);transform-origin:top}
  .sp-stage:after{content:"";position:absolute;left:50%;bottom:-70px;width:260px;height:170px;border:4px solid rgba(255,255,255,.75);border-radius:50%;transform:translateX(-50%);z-index:-1}
  .sp-avatar-svg{display:block;width:100%;height:280px;filter:drop-shadow(0 14px 12px rgba(15,23,42,.24));position:relative;z-index:1}
  .sp-player-bob{transform-origin:150px 280px;animation:sp-idle 2.8s ease-in-out infinite}
  .sp-ball{transform-origin:center;animation:sp-ball 2.8s ease-in-out infinite}
  .sp-card-mini{width:96px;height:102px;flex:0 0 auto;border-radius:18px;min-height:0}
  .sp-card-mini .sp-avatar-svg{height:102px}
  .sp-card-mini:after,.sp-card-mini:before{display:none}
  .sp-stage-tag{position:absolute;left:12px;top:12px;z-index:2;padding:6px 9px;border-radius:999px;background:rgba(15,23,42,.72);color:#fff;font-size:.7rem;font-weight:800;letter-spacing:.06em;text-transform:uppercase;backdrop-filter:blur(8px)}
  .sp-meta{flex:1;min-width:180px}
  .sp-level{font-weight:900;font-size:1.12rem;margin:0}
  .sp-sub{margin:2px 0 0;opacity:.75;font-size:.86rem}
  .sp-wallet{display:inline-flex;align-items:center;gap:7px;margin:10px 0 4px;padding:8px 11px;border-radius:12px;background:#0f172a;color:#fff;font-weight:900;box-shadow:0 7px 16px rgba(15,23,42,.18)}
  .sp-wallet span{color:#fbbf24}
  .sp-bar{height:12px;border-radius:999px;background:rgba(127,127,127,.22);overflow:hidden;margin-top:8px}
  .sp-bar>span{display:block;height:100%;background:linear-gradient(90deg,var(--sp-accent),#fbbf24);border-radius:999px;transition:width .5s ease;position:relative}
  .sp-bar>span:after{content:"";position:absolute;inset:1px;background:linear-gradient(90deg,transparent,rgba(255,255,255,.65),transparent);animation:sp-shine 2.8s linear infinite}
  .sp-diamond{display:block;width:100%;max-width:260px;margin:12px auto 0}
  .sp-legs{display:flex;justify-content:space-between;font-size:.75rem;opacity:.7;max-width:260px;margin:4px auto 0}
  .sp-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:10px;margin-top:10px}
  .sp-item{text-align:left;border:2px solid rgba(127,127,127,.22);border-radius:16px;padding:11px;background:rgba(255,255,255,.04);font:inherit;color:inherit;cursor:pointer;position:relative;transition:transform .18s ease,border-color .18s ease,box-shadow .18s ease}
  button.sp-item:hover:not([disabled]){transform:translateY(-3px);border-color:var(--sp-accent);box-shadow:0 10px 22px rgba(15,23,42,.12)}
  .sp-item[data-on="1"]{border-color:var(--sp-accent);background:var(--sp-soft);color:#1f2937;box-shadow:0 0 0 3px color-mix(in srgb,var(--sp-accent) 15%,transparent)}
  .sp-item[data-state="buy"]{border-style:dashed}
  .sp-item[disabled]{opacity:.5;cursor:default}
  .sp-item b{display:block;font-size:.92rem}
  .sp-item small{display:block;opacity:.75;margin-top:2px}
  .sp-emoji{font-size:22px}
  .sp-price{position:absolute;right:8px;top:8px;border-radius:999px;padding:4px 7px;background:#0f172a;color:#fbbf24;font-size:.7rem;font-weight:900}
  .sp-owned{color:var(--sp-accent);font-weight:900}
  .sp-ladder{display:flex;flex-direction:column;gap:6px;margin-top:10px}
  .sp-rung{display:flex;gap:10px;align-items:center;padding:8px 10px;border-radius:12px;background:rgba(127,127,127,.10)}
  .sp-rung[data-on="1"]{background:var(--sp-soft);color:#1f2937;font-weight:700}
  .sp-rung small{margin-left:auto;opacity:.7}
  @keyframes sp-idle{0%,100%{transform:translateY(0) rotate(-.4deg)}50%{transform:translateY(-4px) rotate(.4deg)}}
  @keyframes sp-ball{0%,100%{transform:translateY(0) rotate(0)}50%{transform:translateY(-7px) rotate(12deg)}}
  @keyframes sp-shine{from{transform:translateX(-110%)}to{transform:translateX(110%)}}
  @media(max-width:620px){.sp-card{grid-template-columns:1fr}.sp-stage{min-height:240px}.sp-avatar-svg{height:240px}.sp-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}
  @media(prefers-reduced-motion:reduce){.sp-player-bob,.sp-ball,.sp-bar>span:after{animation:none}.sp-item{transition:none}}
  `;

  // A pitch with the ball carried further forward as the level fills.
  function pitchSvg(pct) {
    const p = Math.max(0, Math.min(100, Number(pct) || 0)) / 100;
    const bx = 12 + p * 76;
    const marker = (x, on) =>
      `<line x1="${x}" y1="10" x2="${x}" y2="90" stroke="${
        on ? THEME.accent : "rgba(127,127,127,.35)"
      }" stroke-width="${on ? 2 : 1}" stroke-dasharray="4 4"/>`;
    return `<svg class="sp-diamond" viewBox="0 0 100 100" role="img" aria-label="Ball ${Math.round(
      p * 100,
    )}% of the way to goal">
      <rect x="6" y="10" width="88" height="80" rx="4" fill="rgba(127,127,127,.10)" stroke="rgba(127,127,127,.35)" stroke-width="2"/>
      <circle cx="50" cy="50" r="14" fill="none" stroke="rgba(127,127,127,.35)" stroke-width="1.5"/>
      <rect x="86" y="34" width="8" height="32" fill="none" stroke="rgba(127,127,127,.45)" stroke-width="1.5"/>
      ${marker(31, p >= 0.25)}${marker(50, p >= 0.5)}${marker(69, p >= 0.75)}
      <circle cx="${bx}" cy="50" r="7" fill="${THEME.accent}"/>
      <text x="${bx}" y="${53.5}" text-anchor="middle" font-size="8" fill="#fff">${THEME.icon}</text>
    </svg>`;
  }

  // A full locker has more slots than a player card can show in one line, so
  // THEME.avatarSlots picks the handful that read as "the look". Everything else
  // is still equipped — it just isn't crammed into the avatar.
  const avatarFor = (sport) => {
    const s = normalize(sport);
    const shown = THEME.avatarSlots?.length
      ? THEME.avatarSlots
      : THEME.slots.map(([slot]) => slot);
    const worn = shown.map((slot) => itemById(s.equipped[slot])).filter(Boolean);
    return worn.length ? worn.map((g) => g.emoji).join("") : THEME.icon;
  };

  // --- Sport avatar begin --------------------------------------------------
  function avatarLook(sport) {
    const s = normalize(sport);
    const has = (id) => Object.values(s.equipped).includes(id);
    return {
      kit: has("kit_neon") ? "#a3e635" : has("kit_champ") ? "#facc15" : has("kit_away") ? "#f97316" : "#2563eb",
      trim: has("kit_champ") ? "#7c3aed" : has("kit_away") ? "#fff7ed" : "#f8fafc",
      boots: has("boots_gold") ? "#facc15" : has("boots_flame") ? "#ef4444" : has("boots_studs") ? "#111827" : "#f8fafc",
      ball: has("ball_comet") ? "#fb7185" : has("ball_match") ? "#facc15" : "#f8fafc",
      band: has("extra_crown") ? "#facc15" : has("extra_armband") ? "#ef4444" : "#f8fafc",
      sky: has("pitch_moon") ? "#172554" : has("pitch_stadium") ? "#334155" : has("pitch_lights") ? "#fb923c" : "#7dd3fc",
      ground: has("pitch_moon") ? "#14532d" : "#22c55e",
      venue: itemById(s.equipped.pitch)?.name || "The Park",
    };
  }

  function avatarSvg(sport, compact = false) {
    const look = avatarLook(sport);
    const label = `${THEME.avatar.name}'s soccer avatar at ${look.venue}`;
    return `<div class="sp-stage${compact ? " sp-card-mini" : ""}" style="--sp-sky:${look.sky};--sp-ground:${look.ground}">
      ${compact ? "" : `<span class="sp-stage-tag">⚽ ${look.venue}</span>`}
      <svg class="sp-avatar-svg" viewBox="0 0 300 340" role="img" aria-label="${label}">
        <g class="sp-player-bob">
          <ellipse cx="151" cy="304" rx="78" ry="13" fill="rgba(15,23,42,.20)"/>
          <path d="M130 207 Q116 252 105 288" fill="none" stroke="#1e3a8a" stroke-width="28" stroke-linecap="round"/>
          <path d="M172 207 Q197 229 225 251" fill="none" stroke="#1e3a8a" stroke-width="28" stroke-linecap="round"/>
          <path d="M88 291h42" stroke="${look.boots}" stroke-width="18" stroke-linecap="round"/>
          <path d="M214 253l34 15" stroke="${look.boots}" stroke-width="18" stroke-linecap="round"/>
          <path d="M119 120 Q87 149 75 187" fill="none" stroke="#d99b72" stroke-width="20" stroke-linecap="round"/>
          <path d="M181 120 Q213 144 229 177" fill="none" stroke="#d99b72" stroke-width="20" stroke-linecap="round"/>
          <path d="M105 115 Q150 96 195 116 L183 213 Q150 229 117 213Z" fill="${look.kit}" stroke="${look.trim}" stroke-width="6"/>
          <path d="M112 132h76" stroke="${look.trim}" stroke-width="5" opacity=".65"/>
          <text x="150" y="178" text-anchor="middle" font-size="43" font-weight="900" fill="${look.trim}">${THEME.avatar.number}</text>
          <rect x="207" y="143" width="20" height="10" rx="5" fill="${look.band}" transform="rotate(54 217 148)"/>
          <circle cx="150" cy="76" r="41" fill="#d99b72"/>
          <path d="M112 70 Q116 25 153 26 Q187 27 191 72 Q172 51 112 70Z" fill="#3f2d20"/>
          <circle cx="136" cy="79" r="4" fill="#1f2937"/><circle cx="166" cy="79" r="4" fill="#1f2937"/>
          <path d="M139 96q12 10 24 0" fill="none" stroke="#7c2d12" stroke-width="4" stroke-linecap="round"/>
        </g>
        <g class="sp-ball">
          <circle cx="253" cy="282" r="23" fill="${look.ball}" stroke="#111827" stroke-width="3"/>
          <path d="M253 267l10 8-4 12h-12l-4-12Z" fill="#111827"/><path d="M231 277l12-2M263 275l11-5M259 287l8 12M247 287l-7 13" stroke="#111827" stroke-width="3"/>
        </g>
      </svg>
    </div>`;
  }
  // --- Sport avatar end ----------------------------------------------------

  // Compact home-screen card: level, avatar, progress. Taps into the full view.
  function renderCard(sport, helpers) {
    const esc = helpers?.esc || ((v) => String(v));
    const s = normalize(sport);
    const lv = levelInfo(s.xp);
    return `<section class="card sp-wrap" data-card="sports" data-act="view-sports" role="button" tabindex="0" aria-label="Open ${esc(
      THEME.title,
    )}">
      <div class="head"><div><h3>${THEME.icon} ${esc(THEME.title)}</h3><p class="sub">Level ${
        lv.level
      } · ${esc(lv.name)}</p></div>${avatarSvg(s, true)}</div>
      <div class="sp-bar"><span style="width:${lv.pct}%"></span></div>
      <p class="sp-sub">${
        s.streak > 1 ? `🔥 ${s.streak} days in a row · ` : ""
      }🪙 ${gearBalance(s)} spendable · ${
        lv.isMax
          ? `${esc(THEME.maxLine)} Every shop level is unlocked.`
          : `${lv.toNext} more ${THEME.pointWord} to ${esc(lv.nextName)}.`
      }</p>
    </section>`;
  }

  // The full screen: player card, progress track, gear locker, season ladder.
  function renderView(sport, helpers) {
    const esc = helpers?.esc || ((v) => String(v));
    const card = helpers?.card;
    const s = normalize(sport);
    const lv = levelInfo(s.xp);
    const next = nextUnlock(s.xp);

    const playerHtml = `<div class="sp-card">
      ${avatarSvg(s)}
      <div class="sp-meta">
        <p class="sp-level">${esc(lv.badge)} Level ${lv.level} — ${esc(lv.name)}</p>
        <p class="sp-sub">${lv.total} ${THEME.pointWord} earned${
          lv.isMax ? "" : ` · ${lv.toNext} to ${esc(lv.nextName)}`
        }</p>
        <div class="sp-wallet" aria-label="${gearBalance(s)} spendable training points"><span>●</span> ${gearBalance(s)} to spend</div>
        <div class="sp-bar"><span style="width:${lv.pct}%"></span></div>
        ${pitchSvg(lv.pct)}
      </div>
    </div>
    <div class="sp-legs">${THEME.legs.map((l) => `<span>${esc(l)}</span>`).join("")}</div>
    <p class="sp-sub" style="text-align:center;margin-top:8px">${
      lv.isMax
        ? esc(THEME.maxLine)
        : `${esc(THEME.moveLine)} ${esc(lv.pct)}% of this ${esc(THEME.lapWord)}.`
    }</p>
    ${
      s.streak > 0
        ? `<p class="sp-sub" style="text-align:center">🔥 ${esc(THEME.formWord)}: <b>${
            s.streak
          }</b> ${esc(THEME.formLine)}${
            s.bestStreak > s.streak ? ` · best ${s.bestStreak}` : ""
          }</p>`
        : ""
    }`;

    const lockerHtml =
      THEME.slots
        .map(([slot, label]) => {
          const items = THEME.gear.filter((g) => g.slot === slot);
          return `<h4 style="margin:14px 0 0;font-size:.95rem">${esc(label)}</h4>
        <div class="sp-grid">${items
          .map((g) => {
            const owned = s.owned.includes(g.id);
            const levelReady = g.level <= lv.level;
            const on = s.equipped[slot] === g.id;
            const action = owned ? "sports-equip" : "sports-buy";
            return `<button class="sp-item" data-on="${on ? 1 : 0}" data-state="${owned ? "owned" : levelReady ? "buy" : "locked"}" ${
              levelReady ? `data-act="${action}" data-arg="${g.id}"` : "disabled"
            }>
              ${!owned && levelReady ? `<span class="sp-price">${g.price} ●</span>` : ""}
              <span class="sp-emoji">${levelReady ? g.emoji : "🔒"}</span>
              <b>${esc(g.name)}</b>
              <small>${owned ? `<span class="sp-owned">${on ? "Wearing now" : "Owned · tap to wear"}</span>` : levelReady ? `${esc(g.note)} · Buy for ${g.price}` : `Reach level ${g.level}`}</small>
            </button>`;
          })
          .join("")}</div>`;
        })
        .join("") +
      (next
        ? `<p class="sp-sub" style="margin-top:12px">🔜 Next unlock: <b>${esc(next.name)}</b> at level ${
            next.level
          }.</p>`
        : "");

    const ladderHtml = `<div class="sp-ladder">${THEME.levels
      .map(
        (l, i) =>
          `<div class="sp-rung" data-on="${i + 1 <= lv.level ? 1 : 0}"><span class="sp-emoji">${
            i + 1 <= lv.level ? l.badge : "🔒"
          }</span><span>Level ${i + 1} — ${esc(l.name)}</span><small>${l.at} pts</small></div>`,
      )
      .join("")}</div>`;

    // Trophies are pure recognition: they follow the ladder, so there is
    // nothing extra to grind for and nothing that can be lost.
    const trophyHtml = `<div class="sp-grid">${THEME.trophies
      .map((t) => {
        const won = lv.level >= t.level;
        return `<div class="sp-item" data-on="${won ? 1 : 0}">
          <span class="sp-emoji">${won ? t.emoji : "🔒"}</span>
          <b>${esc(t.name)}</b>
          <small>${won ? "Earned" : `Reach level ${t.level}`}</small>
        </div>`;
      })
      .join("")}</div>`;

    const wrap = (id, title, sub, body) =>
      card
        ? card(id, title, sub, body)
        : `<section class="card"><h3>${title}</h3>${body}</section>`;

    return `<div class="sp-wrap">${wrap(
      "sp-player",
      `${THEME.icon} ${esc(THEME.title)}`,
      esc(THEME.tagline),
      playerHtml,
    )}${wrap("sp-locker", "🛍️ Clubhouse shop", "Use training points—not real money. Buy it once, then swap gear anytime.", lockerHtml)}${wrap(
      "sp-trophies",
      "🏆 Trophy case",
      "Won by climbing the ladder.",
      trophyHtml,
    )}${wrap("sp-ladder", "📈 Season ladder", "Where this season goes.", ladderHtml)}</div>`;
  }

  // A short, kid-facing line for the level-up toast.
  const levelUpMessage = (lv) => `Level ${lv.level} — ${lv.name}! ${lv.badge}`;

  globalThis.NeftSports = {
    THEME,
    POINTS,
    CSS,
    pointsFor,
    normalize,
    merge,
    levelInfo,
    unlockedGear,
    lockedGear,
    nextUnlock,
    ownsItem,
    gearBalance,
    award,
    purchase,
    equip,
    itemById,
    avatarFor,
    renderCard,
    renderView,
    levelUpMessage,
  };
})();
