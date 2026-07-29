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
      ["ball", "Ball"],
      ["kit", "Kit"],
      ["extra", "Captain gear"],
      ["pitch", "Pitch"],
    ],
    // Cosmetic gear. `level` is the season level that unlocks it (1-based).
    gear: [
      {
        id: "boots_street",
        slot: "boots",
        level: 1,
        emoji: "👟",
        name: "Street Trainers",
        note: "Grass, concrete, whatever.",
      },
      {
        id: "boots_studs",
        slot: "boots",
        level: 3,
        emoji: "🧶",
        name: "Proper Studs",
        note: "No more slipping on the turn.",
      },
      {
        id: "boots_flame",
        slot: "boots",
        level: 7,
        emoji: "🔥",
        name: "Flame Boots",
        note: "Left-foot rocket included.",
      },
      {
        id: "boots_gold",
        slot: "boots",
        level: 10,
        emoji: "🥇",
        name: "Golden Boots",
        note: "Top scorer energy.",
      },
      {
        id: "ball_worn",
        slot: "ball",
        level: 1,
        emoji: "⚽",
        name: "Park Ball",
        note: "Slightly flat. Still perfect.",
      },
      {
        id: "ball_match",
        slot: "ball",
        level: 4,
        emoji: "🏐",
        name: "Match Ball",
        note: "Pumped to exactly right.",
      },
      {
        id: "ball_comet",
        slot: "ball",
        level: 8,
        emoji: "☄️",
        name: "Comet Ball",
        note: "Leaves a trail on the volley.",
      },
      {
        id: "kit_home",
        slot: "kit",
        level: 1,
        emoji: "👕",
        name: "Home Shirt",
        note: "Number on the back.",
      },
      {
        id: "kit_away",
        slot: "kit",
        level: 2,
        emoji: "🎽",
        name: "Away Kit",
        note: "For the loud games.",
      },
      {
        id: "kit_neon",
        slot: "kit",
        level: 6,
        emoji: "🟩",
        name: "Neon Third Kit",
        note: "Visible from the stands.",
      },
      {
        id: "kit_champ",
        slot: "kit",
        level: 11,
        emoji: "🏆",
        name: "Champions Kit",
        note: "Earned, not bought.",
      },
      {
        id: "extra_band",
        slot: "extra",
        level: 1,
        emoji: "🧢",
        name: "Training Bib",
        note: "Everyone starts in a bib.",
      },
      {
        id: "extra_armband",
        slot: "extra",
        level: 5,
        emoji: "🧥",
        name: "Captain's Armband",
        note: "You lead the warm-up now.",
      },
      {
        id: "extra_crown",
        slot: "extra",
        level: 9,
        emoji: "👑",
        name: "Crown",
        note: "Slightly ridiculous. Deserved.",
      },
      {
        id: "pitch_park",
        slot: "pitch",
        level: 1,
        emoji: "🌳",
        name: "The Park",
        note: "Jumpers for goalposts.",
      },
      {
        id: "pitch_lights",
        slot: "pitch",
        level: 4,
        emoji: "💡",
        name: "Floodlit Pitch",
        note: "Kick-off under the lights.",
      },
      {
        id: "pitch_stadium",
        slot: "pitch",
        level: 8,
        emoji: "🏟️",
        name: "The Big Stadium",
        note: "60,000 singing.",
      },
      {
        id: "pitch_moon",
        slot: "pitch",
        level: 12,
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

  const avatarFor = (sport) => {
    const s = normalize(sport);
    const worn = THEME.slots.map(([slot]) => itemById(s.equipped[slot])).filter(Boolean);
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
    ${pitchSvg(lv.pct)}
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
