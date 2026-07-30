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
    // Cosmetic gear. `level` is the season level that unlocks it (1-based).
    gear: [
      {
        id: "bat_ash",
        slot: "bat",
        level: 1,
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
        emoji: "👕",
        name: "Home Whites",
        note: "Clean. For now.",
      },
      {
        id: "jersey_pin",
        slot: "jersey",
        level: 2,
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
        emoji: "🏆",
        name: "Champion Kit",
        note: "Earned, not bought.",
      },
      {
        id: "cap_team",
        slot: "cap",
        level: 1,
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
        emoji: "🌾",
        name: "The Sandlot",
        note: "Bases are backpacks.",
      },
      {
        id: "park_lights",
        slot: "park",
        level: 4,
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
    const equipped = {};
    for (const [slot] of THEME.slots) {
      const id = src.equipped?.[slot];
      if (typeof id === "string" && THEME.gear.some((g) => g.id === id && g.slot === slot)) {
        equipped[slot] = id;
      }
    }
    const day = typeof src.lastDay === "string" && /^\d{4}-\d{2}-\d{2}$/.test(src.lastDay)
      ? src.lastDay
      : "";
    return {
      xp: clampInt(src.xp, 0, 10_000_000),
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
    // Newly unlocked gear equips itself if that slot is empty, so a kid who
    // never opens the locker still visibly changes as the season goes on.
    for (const g of fresh)
      if (!after.equipped[g.slot]) after.equipped = { ...after.equipped, [g.slot]: g.id };
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
    if (!item || item.level > levelInfo(cur.xp).level) return cur;
    return { ...cur, equipped: { ...cur.equipped, [item.slot]: item.id } };
  }

  const itemById = (id) => THEME.gear.find((g) => g.id === id) || null;

  // --- Markup ---------------------------------------------------------------
  // Returned as strings so app.js keeps its one-render-pass model. The <style>
  // is injected once by app.js rather than shipping a second stylesheet.
  const CSS = `
  .sp-wrap{--sp-accent:${THEME.accent};--sp-soft:${THEME.accentSoft}}
  .sp-card{display:flex;gap:14px;align-items:center;flex-wrap:wrap}
  .sp-avatar{font-size:34px;line-height:1;letter-spacing:2px;background:var(--sp-soft);border-radius:16px;padding:10px 12px}
  .sp-meta{flex:1;min-width:180px}
  .sp-level{font-weight:800;font-size:1.05rem;margin:0}
  .sp-sub{margin:2px 0 0;opacity:.75;font-size:.86rem}
  .sp-bar{height:12px;border-radius:999px;background:rgba(127,127,127,.22);overflow:hidden;margin-top:8px}
  .sp-bar>span{display:block;height:100%;background:var(--sp-accent);border-radius:999px;transition:width .5s ease}
  .sp-diamond{display:block;width:100%;max-width:260px;margin:12px auto 0}
  .sp-legs{display:flex;justify-content:space-between;font-size:.75rem;opacity:.7;max-width:260px;margin:4px auto 0}
  .sp-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:10px;margin-top:10px}
  .sp-item{text-align:left;border:2px solid rgba(127,127,127,.25);border-radius:14px;padding:10px;background:transparent;font:inherit;color:inherit;cursor:pointer}
  .sp-item[data-on="1"]{border-color:var(--sp-accent);background:var(--sp-soft);color:#1f2937}
  .sp-item[disabled]{opacity:.5;cursor:default}
  .sp-item b{display:block;font-size:.92rem}
  .sp-item small{display:block;opacity:.75;margin-top:2px}
  .sp-emoji{font-size:22px}
  .sp-ladder{display:flex;flex-direction:column;gap:6px;margin-top:10px}
  .sp-rung{display:flex;gap:10px;align-items:center;padding:8px 10px;border-radius:12px;background:rgba(127,127,127,.10)}
  .sp-rung[data-on="1"]{background:var(--sp-soft);color:#1f2937;font-weight:700}
  .sp-rung small{margin-left:auto;opacity:.7}
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
      } · ${esc(lv.name)}</p></div><div class="sp-emoji">${esc(avatarFor(s))}</div></div>
      <div class="sp-bar"><span style="width:${lv.pct}%"></span></div>
      <p class="sp-sub">${
        s.streak > 1 ? `🔥 ${s.streak} days in a row · ` : ""
      }${
        lv.isMax
          ? `Hall of Fame — every piece of gear is yours. 🏛️`
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
      <div class="sp-avatar">${esc(avatarFor(s))}</div>
      <div class="sp-meta">
        <p class="sp-level">${esc(lv.badge)} Level ${lv.level} — ${esc(lv.name)}</p>
        <p class="sp-sub">${lv.total} ${THEME.pointWord} earned${
          lv.isMax ? "" : ` · ${lv.toNext} to ${esc(lv.nextName)}`
        }</p>
        <div class="sp-bar"><span style="width:${lv.pct}%"></span></div>
      </div>
    </div>
    ${diamondSvg(lv.pct)}
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
            const owned = g.level <= lv.level;
            const on = s.equipped[slot] === g.id;
            return `<button class="sp-item" data-on="${on ? 1 : 0}" ${
              owned ? `data-act="sports-equip" data-arg="${g.id}"` : "disabled"
            }>
              <span class="sp-emoji">${owned ? g.emoji : "🔒"}</span>
              <b>${esc(g.name)}</b>
              <small>${owned ? esc(g.note) : `Unlocks at level ${g.level}`}</small>
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
    )}${wrap("sp-locker", "🎒 Gear locker", "Tap to wear it.", lockerHtml)}${wrap(
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
    award,
    equip,
    itemById,
    avatarFor,
    renderCard,
    renderView,
    levelUpMessage,
  };
})();
