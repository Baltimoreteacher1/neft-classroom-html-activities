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
  .sp-stage{position:relative;min-height:320px;overflow:hidden;border:1px solid rgba(255,255,255,.7);border-radius:26px;background:radial-gradient(circle at 78% 13%,#fff7ad 0 3%,rgba(255,247,173,.38) 3.5% 9%,transparent 17%),linear-gradient(165deg,color-mix(in srgb,var(--sp-sky,#38bdf8) 62%,#182c69) 0%,var(--sp-sky,#38bdf8) 52%,var(--sp-ground,#16a34a) 52.5%,color-mix(in srgb,var(--sp-ground,#16a34a) 66%,#06371f) 100%);box-shadow:inset 0 1px 0 rgba(255,255,255,.85),inset 0 -55px 90px rgba(4,25,48,.17),0 22px 48px rgba(15,23,42,.24);isolation:isolate}
  .sp-stage:before{content:"";position:absolute;z-index:0;inset:51% -15% -40%;background:repeating-linear-gradient(102deg,rgba(255,255,255,.16) 0 30px,transparent 30px 60px);transform:perspective(180px) rotateX(34deg);transform-origin:top}
  .sp-stage:after{content:"";position:absolute;z-index:0;left:50%;bottom:-61px;width:270px;height:180px;border:4px solid rgba(255,255,255,.72);border-radius:50%;transform:translateX(-50%);box-shadow:0 0 24px rgba(255,255,255,.16)}
  .sp-avatar-svg{display:block;width:100%;height:320px;filter:drop-shadow(0 18px 16px rgba(9,18,42,.32));position:relative;z-index:1}
  .sp-player-bob{transform-origin:150px 290px;animation:sp-idle 2.8s ease-in-out infinite}
  .sp-ball{transform-origin:center;animation:sp-ball 2.8s ease-in-out infinite}
  .sp-spark{transform-origin:center;animation:sp-spark 2.2s ease-in-out infinite}
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
  @keyframes sp-idle{0%,100%{transform:translateY(0) rotate(-.35deg)}50%{transform:translateY(-4px) rotate(.35deg)}}
  @keyframes sp-ball{0%,100%{transform:translateY(0) rotate(0)}50%{transform:translateY(-7px) rotate(12deg)}}
  @keyframes sp-spark{0%,100%{opacity:.45;transform:scale(.78) rotate(0)}50%{opacity:1;transform:scale(1.12) rotate(18deg)}}
  @keyframes sp-shine{from{transform:translateX(-110%)}to{transform:translateX(110%)}}
  @media(max-width:620px){.sp-card{grid-template-columns:1fr}.sp-stage{min-height:270px}.sp-avatar-svg{height:270px}.sp-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}
  @media(prefers-reduced-motion:reduce){.sp-player-bob,.sp-ball,.sp-spark,.sp-bar>span:after{animation:none}.sp-item{transition:none}}
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
      kit: has("kit_neon") ? "#9be51b" : has("kit_champ") ? "#ffc928" : has("kit_retro") ? "#ef3f52" : has("kit_keeper") ? "#7c3aed" : has("kit_away") ? "#ff6b24" : "#2563eb",
      trim: has("kit_neon") ? "#102a43" : has("kit_champ") ? "#6d28d9" : has("kit_away") ? "#fff7ed" : "#f8fafc",
      shorts: has("kit_away") ? "#172554" : has("kit_neon") ? "#102a43" : "#152b5f",
      boots: has("boots_gold") ? "#facc15" : has("boots_signature") ? "#7c3aed" : has("boots_flame") ? "#ef3340" : has("boots_studs") ? "#111827" : "#ff4d3d",
      ball: has("ball_comet") ? "#fb4f87" : has("ball_final") ? "#7c3aed" : has("ball_match") ? "#facc15" : has("ball_hivis") ? "#f97316" : "#f8fafc",
      band: has("extra_crown") ? "#facc15" : has("extra_armband") ? "#ef3340" : "#f8fafc",
      sky: has("pitch_moon") ? "#172554" : has("pitch_stadium") ? "#334155" : has("pitch_lights") ? "#f97316" : "#38bdf8",
      ground: has("pitch_moon") ? "#14532d" : "#16a34a",
      venue: itemById(s.equipped.pitch)?.name || "The Park",
    };
  }

  function avatarSvg(sport, compact = false) {
    const look = avatarLook(sport);
    const uid = compact ? "sc-mini" : "sc-full";
    const label = `${THEME.avatar.name}'s soccer avatar at ${look.venue}`;
    return `<div class="sp-stage${compact ? " sp-card-mini" : ""}" style="--sp-sky:${look.sky};--sp-ground:${look.ground}">
      ${compact ? "" : `<span class="sp-stage-tag">⚽ ${look.venue}</span>`}
      <svg class="sp-avatar-svg" viewBox="0 0 300 340" role="img" aria-label="${label}">
        <defs>
          <linearGradient id="${uid}-skin" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#efb07b"/><stop offset=".52" stop-color="#c87548"/><stop offset="1" stop-color="#93462f"/></linearGradient>
          <linearGradient id="${uid}-kit" x1="0" y1="0" x2=".9" y2="1"><stop stop-color="#fff" stop-opacity=".4"/><stop offset=".2" stop-color="${look.kit}"/><stop offset="1" stop-color="${look.kit}"/></linearGradient>
          <linearGradient id="${uid}-shorts" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#fff" stop-opacity=".18"/><stop offset=".28" stop-color="${look.shorts}"/><stop offset="1" stop-color="#07152e"/></linearGradient>
          <radialGradient id="${uid}-ball" cx="35%" cy="28%"><stop stop-color="#fff"/><stop offset=".35" stop-color="${look.ball}"/><stop offset="1" stop-color="${look.ball}"/></radialGradient>
          <filter id="${uid}-lift" x="-30%" y="-30%" width="160%" height="180%"><feDropShadow dx="0" dy="6" stdDeviation="5" flood-color="#07152e" flood-opacity=".35"/></filter>
        </defs>
        <path d="M0 144 Q52 108 102 137 T205 130 T300 137 V188 H0Z" fill="#10254c" opacity=".54"/>
        <g fill="#f8fafc" opacity=".78"><circle cx="22" cy="138" r="3"/><circle cx="41" cy="130" r="3"/><circle cx="61" cy="140" r="3"/><circle cx="81" cy="132" r="3"/><circle cx="104" cy="139" r="3"/><circle cx="206" cy="136" r="3"/><circle cx="229" cy="128" r="3"/><circle cx="252" cy="138" r="3"/><circle cx="278" cy="131" r="3"/></g>
        <g stroke="#fff" stroke-width="5" stroke-linecap="round" opacity=".88"><path d="M22 112V78M9 78h26"/><path d="M278 112V78m-13 0h26"/></g>
        <g class="sp-spark" fill="#fff7ad"><path d="M247 108l4 9 9 4-9 4-4 9-4-9-9-4 9-4Z"/><circle cx="70" cy="105" r="4"/></g>
        <g class="sp-player-bob" filter="url(#${uid}-lift)">
          <ellipse cx="154" cy="309" rx="88" ry="14" fill="#07152e" opacity=".3"/>
          <path d="M133 211 Q123 244 116 265" fill="none" stroke="#101b36" stroke-width="37" stroke-linecap="round"/>
          <path d="M133 211 Q123 244 116 265" fill="none" stroke="url(#${uid}-skin)" stroke-width="27" stroke-linecap="round"/>
          <path d="M116 259 Q110 278 104 289" fill="none" stroke="#101b36" stroke-width="31" stroke-linecap="round"/>
          <path d="M116 259 Q110 278 104 289" fill="none" stroke="${look.trim}" stroke-width="21" stroke-linecap="round"/>
          <path d="M164 211 Q191 222 207 238" fill="none" stroke="#101b36" stroke-width="37" stroke-linecap="round"/>
          <path d="M164 211 Q191 222 207 238" fill="none" stroke="url(#${uid}-skin)" stroke-width="27" stroke-linecap="round"/>
          <path d="M204 236 Q219 246 232 252" fill="none" stroke="#101b36" stroke-width="31" stroke-linecap="round"/>
          <path d="M204 236 Q219 246 232 252" fill="none" stroke="${look.trim}" stroke-width="21" stroke-linecap="round"/>
          <path d="M83 287q22-8 44 3l4 14H84q-11-6-1-17Z" fill="${look.boots}" stroke="#101b36" stroke-width="6"/>
          <path d="M222 244q18 3 33 18l-7 13-40-18q-5-9 14-13Z" fill="${look.boots}" stroke="#101b36" stroke-width="6"/>
          <path d="M98 296h23m106-43l19 10" stroke="#fff" stroke-width="4" opacity=".65"/>
          <path d="M116 194q34-14 69 0l-2 33q-16 10-32 0-17 10-35 0Z" fill="url(#${uid}-shorts)" stroke="#101b36" stroke-width="7" stroke-linejoin="round"/>
          <path d="M120 126 Q88 146 73 181" fill="none" stroke="#101b36" stroke-width="29" stroke-linecap="round"/>
          <path d="M120 126 Q88 146 73 181" fill="none" stroke="url(#${uid}-skin)" stroke-width="20" stroke-linecap="round"/>
          <path d="M181 126 Q211 143 229 175" fill="none" stroke="#101b36" stroke-width="29" stroke-linecap="round"/>
          <path d="M181 126 Q211 143 229 175" fill="none" stroke="url(#${uid}-skin)" stroke-width="20" stroke-linecap="round"/>
          <path d="M104 120 Q150 97 196 120 L184 205 Q150 223 116 205Z" fill="url(#${uid}-kit)" stroke="#101b36" stroke-width="7" stroke-linejoin="round"/>
          <path d="M107 122q16-11 31-14l8 24-29 9Z" fill="${look.trim}"/><path d="M193 122q-16-11-31-14l-8 24 29 9Z" fill="${look.trim}"/>
          <path d="M112 139h76" stroke="${look.trim}" stroke-width="6" opacity=".82"/>
          <path d="M147 111l-12 19 15 10 15-10-12-19Z" fill="${look.trim}" opacity=".9"/>
          <text x="153" y="188" text-anchor="middle" font-size="47" font-family="ui-rounded,system-ui" font-weight="1000" fill="#101b36" opacity=".28">${THEME.avatar.number}</text>
          <text x="150" y="184" text-anchor="middle" font-size="47" font-family="ui-rounded,system-ui" font-weight="1000" fill="${look.trim}" stroke="#fff" stroke-width="1.5" paint-order="stroke">${THEME.avatar.number}</text>
          <rect x="207" y="145" width="22" height="12" rx="6" fill="${look.band}" stroke="#101b36" stroke-width="3" transform="rotate(52 218 151)"/>
          <path d="M132 111v-18h36v18" fill="url(#${uid}-skin)" stroke="#101b36" stroke-width="6"/>
          <circle cx="109" cy="73" r="12" fill="url(#${uid}-skin)" stroke="#101b36" stroke-width="6"/><circle cx="191" cy="73" r="12" fill="url(#${uid}-skin)" stroke="#101b36" stroke-width="6"/>
          <circle cx="150" cy="72" r="43" fill="url(#${uid}-skin)" stroke="#101b36" stroke-width="7"/>
          <path d="M111 67q-2-32 18-42 20-13 42-1 24 10 20 45-10-14-20-16-6-15-15-3-8-18-17 0-8-14-14 5-8 0-14 12Z" fill="#25191d"/>
          <g fill="#3a2327"><circle cx="122" cy="38" r="11"/><circle cx="140" cy="28" r="12"/><circle cx="159" cy="27" r="12"/><circle cx="178" cy="40" r="12"/></g>
          <path d="M127 73q9-6 18 0m12 0q9-6 18 0" stroke="#3a211b" stroke-width="4" stroke-linecap="round"/>
          <ellipse cx="137" cy="80" rx="7" ry="8" fill="#fff"/><ellipse cx="165" cy="80" rx="7" ry="8" fill="#fff"/><circle cx="139" cy="82" r="3.5" fill="#101b36"/><circle cx="167" cy="82" r="3.5" fill="#101b36"/><circle cx="140" cy="80" r="1.3" fill="#fff"/><circle cx="168" cy="80" r="1.3" fill="#fff"/>
          <path d="M151 83l-3 8 7 1" fill="none" stroke="#91462f" stroke-width="3" stroke-linecap="round"/>
          <path d="M135 98q15 14 31 0-3 19-16 19-12 0-15-19Z" fill="#7d2935" stroke="#101b36" stroke-width="3"/><path d="M140 101q11 6 22 0" stroke="#fff" stroke-width="5" stroke-linecap="round"/>
          <circle cx="123" cy="94" r="5" fill="#ef6f61" opacity=".45"/><circle cx="177" cy="94" r="5" fill="#ef6f61" opacity=".45"/>
        </g>
        <g class="sp-ball">
          <path d="M219 282h-17m13-12h-11" stroke="#fff" stroke-width="5" stroke-linecap="round" opacity=".65"/>
          <circle cx="253" cy="282" r="25" fill="url(#${uid}-ball)" stroke="#101b36" stroke-width="5"/>
          <path d="M253 266l10 8-4 12h-12l-4-12Z" fill="#101b36"/><path d="M230 276l13-2M263 274l12-5M259 286l9 13M247 286l-8 14" stroke="#101b36" stroke-width="3.5"/>
          <circle cx="246" cy="273" r="4" fill="#fff" opacity=".75"/>
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
