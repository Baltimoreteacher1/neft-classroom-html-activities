/* =============================================================================
 * sports.js — the Baseball Season progression for Focus School.
 * -----------------------------------------------------------------------------
 * WHAT THIS IS
 * A Zwift-style, money-free reward track. Finishing real work (a to-do, a
 * routine, a focus session, a bike ride) earns TRAINING POINTS. Points move a
 * runner around the diamond, level you up through a season ladder, and unlock
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
 * SIBLING: shai-school/sports.js is the same engine with a soccer THEME. Keep
 * the two engines identical; only THEME differs.
 * ===========================================================================*/
(() => {
  "use strict";

  // --- Theme: everything sport-specific lives in this one object -------------
  const THEME = {
    key: "baseball",
    title: "Baseball Season",
    icon: "⚾",
    tagline: "Earn training points, round the bases, unlock gear.",
    accent: "#b45309",
    accentSoft: "#fef3c7",
    // Points needed to REACH each level. Gaps widen so late levels stay special
    // without ever becoming unreachable for a kid who works most days.
    levels: [
      { at: 0, name: "Little League Rookie", badge: "🧢" },
      { at: 120, name: "Sandlot Regular", badge: "⚾" },
      { at: 300, name: "Bench Spark", badge: "🔥" },
      { at: 540, name: "Everyday Starter", badge: "🧤" },
      { at: 840, name: "Leadoff Hitter", badge: "🏃" },
      { at: 1200, name: "Cleanup Slugger", badge: "💥" },
      { at: 1650, name: "Gold Glove", badge: "🥇" },
      { at: 2200, name: "All-Star", badge: "🌟" },
      { at: 2850, name: "Silver Slugger", badge: "🏏" },
      { at: 3600, name: "Team MVP", badge: "👑" },
      { at: 4500, name: "Playoff Hero", badge: "🎆" },
      { at: 5600, name: "Hall of Fame", badge: "🏛️" },
    ],
    slots: [
      ["bat", "Bats"],
      ["glove", "Gloves"],
      ["bgloves", "Batting gloves"],
      ["helmet", "Helmets"],
      ["cleats", "Cleats"],
      ["jersey", "Jerseys"],
      ["cap", "Caps"],
      ["extra", "Dugout extras"],
      ["park", "Ballparks"],
    ],
    // The locker has more slots than one line of emoji can show, so the
    // player card renders only these — the rest are still worn.
    avatarSlots: ["cap", "jersey", "bat", "glove", "park"],
    avatar: { name: "Noam", number: "7" },
    // Cosmetic gear. `level` opens the item in the shop; `price` uses training
    // points already earned. Buying gear never lowers XP or a season level.
    gear: [
      {
        id: "bat_ash",
        slot: "bat",
        level: 1,
        price: 0,
        emoji: "🏏",
        name: "Ash Bat",
        note: "Where everyone starts.",
      },
      {
        id: "bat_birch",
        slot: "bat",
        level: 2,
        emoji: "🌳",
        name: "Birch Barrel",
        note: "Bends like ash, hard like maple.",
      },
      {
        id: "bat_maple",
        slot: "bat",
        level: 3,
        price: 140,
        emoji: "🪵",
        name: "Maple Barrel",
        note: "Heavier. Louder.",
      },
      {
        id: "bat_axe",
        slot: "bat",
        level: 4,
        emoji: "🪓",
        name: "Axe-Handle Knob",
        note: "Handle shaped like a real axe.",
      },
      {
        id: "bat_cupped",
        slot: "bat",
        level: 5,
        emoji: "⚖️",
        name: "Cupped-End 33/30",
        note: "Hollow tip, drop-3 balance.",
      },
      {
        id: "bat_twotone",
        slot: "bat",
        level: 6,
        emoji: "🎨",
        name: "Two-Tone Black and Natural",
        note: "Black barrel, bare handle.",
      },
      {
        id: "bat_gold",
        slot: "bat",
        level: 7,
        price: 360,
        emoji: "🥇",
        name: "Gold-Tape Bat",
        note: "Taped by a Gold Glove.",
      },
      {
        id: "bat_bamboo",
        slot: "bat",
        level: 8,
        emoji: "🎍",
        name: "Bamboo Composite",
        note: "Laminated. Nearly unbreakable.",
      },
      {
        id: "bat_fungo",
        slot: "bat",
        level: 9,
        emoji: "🥢",
        name: "Coach's Fungo",
        note: "Long and skinny, for hitting flies.",
      },
      {
        id: "bat_comet",
        slot: "bat",
        level: 10,
        price: 650,
        emoji: "☄️",
        name: "Comet Bat",
        note: "Leaves a trail.",
      },
      {
        id: "bat_thunder",
        slot: "bat",
        level: 11,
        emoji: "⚡",
        name: "Thunderstick",
        note: "Pine tar, taped, feared.",
      },
      {
        id: "bat_cooperstown",
        slot: "bat",
        level: 12,
        emoji: "🏛️",
        name: "Cooperstown Bat",
        note: "Behind glass one day.",
      },
      {
        id: "glove_worn",
        slot: "glove",
        level: 1,
        price: 0,
        emoji: "🧤",
        name: "Broken-In Glove",
        note: "Smells like summer.",
      },
      {
        id: "glove_iweb",
        slot: "glove",
        level: 2,
        emoji: "🪢",
        name: "I-Web Infielder",
        note: "Shallow pocket, quick hands.",
      },
      {
        id: "glove_first",
        slot: "glove",
        level: 3,
        emoji: "🪃",
        name: "First-Base Mitt",
        note: "Long and curved. Scoops it all.",
      },
      {
        id: "glove_web",
        slot: "glove",
        level: 4,
        price: 190,
        emoji: "🕸️",
        name: "Deep Web Trapper",
        note: "Nothing gets through.",
      },
      {
        id: "glove_catcher",
        slot: "glove",
        level: 5,
        emoji: "🛡️",
        name: "Catcher's Mitt",
        note: "Padded like a shield.",
      },
      {
        id: "glove_lace",
        slot: "glove",
        level: 6,
        emoji: "🧶",
        name: "Custom Lace Job",
        note: "Your colors in the laces.",
      },
      {
        id: "glove_flame",
        slot: "glove",
        level: 8,
        price: 430,
        emoji: "🔥",
        name: "Flame Mitt",
        note: "Pop heard from the dugout.",
      },
      {
        id: "glove_kip",
        slot: "glove",
        level: 10,
        emoji: "🐂",
        name: "Kip Leather Pro",
        note: "Game-ready out of the box.",
      },
      {
        id: "bgloves_grip",
        slot: "bgloves",
        level: 1,
        emoji: "✋",
        name: "Grip Gloves",
        note: "Tacky palms, no blisters.",
      },
      {
        id: "bgloves_pine",
        slot: "bgloves",
        level: 2,
        emoji: "🌲",
        name: "Pine-Tar Grips",
        note: "Sticky on purpose.",
      },
      {
        id: "bgloves_neon",
        slot: "bgloves",
        level: 5,
        emoji: "🟢",
        name: "Neon Cuffs",
        note: "Seen from the on-deck circle.",
      },
      {
        id: "bgloves_sheep",
        slot: "bgloves",
        level: 7,
        emoji: "🟫",
        name: "Sheepskin Palms",
        note: "Soft, thin, expensive-feeling.",
      },
      {
        id: "bgloves_iron",
        slot: "bgloves",
        level: 10,
        emoji: "🦾",
        name: "Iron-Grip Pros",
        note: "The bat cannot move.",
      },
      {
        id: "helmet_team",
        slot: "helmet",
        level: 1,
        emoji: "⛑️",
        name: "Team Helmet",
        note: "Standard issue.",
      },
      {
        id: "helmet_flap",
        slot: "helmet",
        level: 3,
        emoji: "🛡️",
        name: "Extended Jaw Flap",
        note: "Crowds the plate safely.",
      },
      {
        id: "helmet_matte",
        slot: "helmet",
        level: 6,
        emoji: "🖤",
        name: "Matte Blackout Lid",
        note: "No shine, all business.",
      },
      {
        id: "helmet_chrome",
        slot: "helmet",
        level: 9,
        emoji: "🪩",
        name: "Chrome Finish",
        note: "Catches the stadium lights.",
      },
      {
        id: "helmet_star",
        slot: "helmet",
        level: 12,
        emoji: "🌠",
        name: "Star-Spangled Lid",
        note: "Opening day, every day.",
      },
      {
        id: "cleats_turf",
        slot: "cleats",
        level: 1,
        emoji: "👟",
        name: "Turf Trainers",
        note: "The practice pair.",
      },
      {
        id: "cleats_metal",
        slot: "cleats",
        level: 3,
        emoji: "🔩",
        name: "Metal Spikes",
        note: "Bite the dirt, no slipping.",
      },
      {
        id: "cleats_low",
        slot: "cleats",
        level: 5,
        emoji: "⚡",
        name: "Low-Cut Speed Cleats",
        note: "Built for stealing second.",
      },
      {
        id: "cleats_high",
        slot: "cleats",
        level: 8,
        emoji: "🥾",
        name: "High-Top Ankle Guards",
        note: "For sliding hard.",
      },
      {
        id: "cleats_gold",
        slot: "cleats",
        level: 11,
        emoji: "✨",
        name: "Gold Spikes",
        note: "Loud. Earned.",
      },
      {
        id: "jersey_home",
        slot: "jersey",
        level: 1,
        price: 0,
        emoji: "👕",
        name: "Home Whites",
        note: "Clean. For now.",
      },
      {
        id: "jersey_pin",
        slot: "jersey",
        level: 2,
        price: 80,
        emoji: "🎽",
        name: "Pinstripes",
        note: "Classic.",
      },
      {
        id: "jersey_road",
        slot: "jersey",
        level: 4,
        emoji: "🌫️",
        name: "Road Grays",
        note: "Away-game gray.",
      },
      {
        id: "jersey_neon",
        slot: "jersey",
        level: 6,
        price: 300,
        emoji: "🟩",
        name: "Neon Alternate",
        note: "Friday-night fit.",
      },
      {
        id: "jersey_throwback",
        slot: "jersey",
        level: 8,
        emoji: "📻",
        name: "1970s Throwback",
        note: "Wool, and proud of it.",
      },
      {
        id: "jersey_champ",
        slot: "jersey",
        level: 11,
        price: 760,
        emoji: "🏆",
        name: "Champion Kit",
        note: "Earned, not bought.",
      },
      {
        id: "cap_team",
        slot: "cap",
        level: 1,
        price: 0,
        emoji: "🧢",
        name: "Team Cap",
        note: "Brim already curved.",
      },
      {
        id: "cap_flat",
        slot: "cap",
        level: 3,
        emoji: "📐",
        name: "Flat-Brim Snapback",
        note: "Sticker still on it.",
      },
      {
        id: "cap_star",
        slot: "cap",
        level: 5,
        price: 240,
        emoji: "⭐",
        name: "All-Star Cap",
        note: "For the big game.",
      },
      {
        id: "cap_camo",
        slot: "cap",
        level: 7,
        emoji: "🪖",
        name: "Camo Cap",
        note: "Weekend-series special.",
      },
      {
        id: "cap_crown",
        slot: "cap",
        level: 9,
        price: 520,
        emoji: "👑",
        name: "Crown Cap",
        note: "Slightly ridiculous. Deserved.",
      },
      {
        id: "extra_eyeblack",
        slot: "extra",
        level: 1,
        emoji: "🖤",
        name: "Eye Black",
        note: "Two stripes. Instant business.",
      },
      {
        id: "extra_shades",
        slot: "extra",
        level: 2,
        emoji: "🕶️",
        name: "Flip-Up Shades",
        note: "Down for fly balls.",
      },
      {
        id: "extra_sleeve",
        slot: "extra",
        level: 4,
        emoji: "💪",
        name: "Compression Arm Sleeve",
        note: "Keeps the arm warm.",
      },
      {
        id: "extra_gum",
        slot: "extra",
        level: 6,
        emoji: "🫧",
        name: "Bubble Gum Bucket",
        note: "One piece per inning.",
      },
      {
        id: "extra_walkup",
        slot: "extra",
        level: 9,
        emoji: "🎵",
        name: "Walk-Up Song",
        note: "Three seconds of pure hype.",
      },
      {
        id: "extra_ring",
        slot: "extra",
        level: 12,
        emoji: "💍",
        name: "Championship Ring",
        note: "Too big to wear to school.",
      },
      {
        id: "park_sandlot",
        slot: "park",
        level: 1,
        price: 0,
        emoji: "🌾",
        name: "The Sandlot",
        note: "Bases are backpacks.",
      },
      {
        id: "park_lights",
        slot: "park",
        level: 4,
        price: 200,
        emoji: "💡",
        name: "Night Lights Field",
        note: "First pitch at dusk.",
      },
      {
        id: "park_ivy",
        slot: "park",
        level: 6,
        emoji: "🍀",
        name: "Ivy Wall Field",
        note: "Lost in the vines is a double.",
      },
      {
        id: "park_dome",
        slot: "park",
        level: 8,
        price: 450,
        emoji: "🏟️",
        name: "The Big Dome",
        note: "45,000 seats.",
      },
      {
        id: "park_harbor",
        slot: "park",
        level: 10,
        emoji: "⚓",
        name: "Harborside Park",
        note: "Warehouse over the right-field wall.",
      },
      {
        id: "park_moon",
        slot: "park",
        level: 12,
        price: 900,
        emoji: "🌙",
        name: "Moonlight Park",
        note: "Only legends play here.",
      },
    ],
    // The four legs of the lap you run inside every level.
    legs: ["1st", "2nd", "3rd", "Home"],
    lapWord: "lap around the bases",
    pointWord: "training points",
    moveLine: "Every finished thing moves the runner.",
    maxLine: "You have run every base there is.",
    formWord: "Hot streak",
    formLine: "days in a row with work finished",
    // Awarded purely by reaching a level — nothing extra to grind for.
    trophies: [
      { level: 3, emoji: "🥎", name: "Called Up" },
      { level: 6, emoji: "💥", name: "Big Bat" },
      { level: 9, emoji: "🧤", name: "Two-Way Star" },
      { level: 12, emoji: "🏛️", name: "Hall of Fame" },
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

  // A diamond with the runner placed by progress through the current level.
  function diamondSvg(pct) {
    const p = Math.max(0, Math.min(100, Number(pct) || 0)) / 100;
    // home -> 1st -> 2nd -> 3rd -> home, as a fraction of the lap
    const pts = [
      [50, 92],
      [92, 50],
      [50, 8],
      [8, 50],
      [50, 92],
    ];
    const leg = Math.min(3, Math.floor(p * 4));
    const t = p * 4 - leg;
    const [x1, y1] = pts[leg];
    const [x2, y2] = pts[leg + 1];
    const rx = x1 + (x2 - x1) * t;
    const ry = y1 + (y2 - y1) * t;
    const base = (x, y, on) =>
      `<rect x="${x - 5}" y="${y - 5}" width="10" height="10" rx="2" transform="rotate(45 ${x} ${y})" fill="${
        on ? THEME.accent : "rgba(127,127,127,.35)"
      }"/>`;
    return `<svg class="sp-diamond" viewBox="0 0 100 100" role="img" aria-label="Runner ${Math.round(
      p * 100,
    )}% around the bases">
      <path d="M50 92 L92 50 L50 8 L8 50 Z" fill="rgba(127,127,127,.10)" stroke="rgba(127,127,127,.35)" stroke-width="2"/>
      ${base(50, 92, true)}${base(92, 50, p >= 0.25)}${base(50, 8, p >= 0.5)}${base(8, 50, p >= 0.75)}
      <circle cx="${rx}" cy="${ry}" r="7" fill="${THEME.accent}"/>
      <text x="${rx}" y="${ry + 3.5}" text-anchor="middle" font-size="8" fill="#fff">${THEME.icon}</text>
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
      jersey: has("jersey_neon") ? "#a3e635" : has("jersey_champ") ? "#facc15" : "#f8fafc",
      trim: has("jersey_pin") ? "#dc2626" : has("jersey_champ") ? "#7c3aed" : "#1e3a8a",
      cap: has("cap_crown") ? "#facc15" : has("cap_star") ? "#ef4444" : "#1e3a8a",
      bat: has("bat_comet") ? "#fb7185" : has("bat_gold") ? "#facc15" : has("bat_maple") ? "#92400e" : "#d6a665",
      glove: has("glove_flame") ? "#f97316" : has("glove_web") ? "#6d28d9" : "#a16207",
      sky: has("park_moon") ? "#172554" : has("park_dome") ? "#334155" : has("park_lights") ? "#fb923c" : "#7dd3fc",
      ground: has("park_moon") ? "#1e3a5f" : has("park_dome") ? "#15803d" : "#4ade80",
      venue: itemById(s.equipped.park)?.name || "The Sandlot",
    };
  }

  function avatarSvg(sport, compact = false) {
    const look = avatarLook(sport);
    const label = `${THEME.avatar.name}'s baseball avatar at ${look.venue}`;
    return `<div class="sp-stage${compact ? " sp-card-mini" : ""}" style="--sp-sky:${look.sky};--sp-ground:${look.ground}">
      ${compact ? "" : `<span class="sp-stage-tag">⚾ ${look.venue}</span>`}
      <svg class="sp-avatar-svg" viewBox="0 0 300 340" role="img" aria-label="${label}">
        <g class="sp-player-bob">
          <ellipse cx="150" cy="304" rx="69" ry="13" fill="rgba(15,23,42,.20)"/>
          <path d="M128 204 Q116 250 112 291" fill="none" stroke="#1e3a8a" stroke-width="28" stroke-linecap="round"/>
          <path d="M172 204 Q190 246 203 283" fill="none" stroke="#1e3a8a" stroke-width="28" stroke-linecap="round"/>
          <path d="M93 293h43" stroke="#f8fafc" stroke-width="18" stroke-linecap="round"/>
          <path d="M184 288h43" stroke="#f8fafc" stroke-width="18" stroke-linecap="round"/>
          <path d="M119 118 Q99 153 86 190" fill="none" stroke="#d99b72" stroke-width="20" stroke-linecap="round"/>
          <path d="M181 120 Q205 148 218 172" fill="none" stroke="#d99b72" stroke-width="20" stroke-linecap="round"/>
          <path d="M105 115 Q150 96 195 116 L183 216 Q150 233 117 216Z" fill="${look.jersey}" stroke="${look.trim}" stroke-width="6"/>
          <path d="M150 108v113" stroke="${look.trim}" stroke-width="5" opacity=".75"/>
          <text x="150" y="172" text-anchor="middle" font-size="42" font-weight="900" fill="${look.trim}">${THEME.avatar.number}</text>
          <circle cx="150" cy="76" r="41" fill="#d99b72"/>
          <path d="M113 68 Q118 25 154 27 Q187 29 190 69 Q170 51 113 68Z" fill="#3f2d20"/>
          <path d="M109 64 Q150 39 190 61 L187 78 Q150 62 112 78Z" fill="${look.cap}"/>
          <path d="M175 61q36 3 43 14q-28 3-43 0Z" fill="${look.cap}"/>
          <circle cx="136" cy="78" r="4" fill="#1f2937"/><circle cx="166" cy="78" r="4" fill="#1f2937"/>
          <path d="M139 95q12 10 24 0" fill="none" stroke="#7c2d12" stroke-width="4" stroke-linecap="round"/>
          <path d="M222 170 L256 76" stroke="${look.bat}" stroke-width="14" stroke-linecap="round"/>
          <path d="M220 169 L207 202" stroke="${look.bat}" stroke-width="8" stroke-linecap="round"/>
          <path d="M67 174q-18 18 2 39q23 7 31-13q-3-20-33-26Z" fill="${look.glove}" stroke="#713f12" stroke-width="4"/>
          <path d="M72 183l17 17M65 191l18 15" stroke="#fef3c7" stroke-width="3" opacity=".7"/>
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
        ${diamondSvg(lv.pct)}
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
