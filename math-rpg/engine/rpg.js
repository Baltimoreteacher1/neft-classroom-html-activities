/* =============================================================================
 * Number Realm — RPG runtime (v2: campaign edition)
 * -----------------------------------------------------------------------------
 * A dependency-free story-RPG engine designed for a weeks-long classroom
 * campaign. A unit config (window.MRPG_UNIT) describes a themed realm of
 * chapters (monster battles) and a boss. One persistent hero (MRPG_PROFILE)
 * travels every realm, earning gold, buying items, unlocking abilities, and
 * building per-standard mastery.
 *
 * Public API:
 *   window.NumberRealm.start({ unit: <config>, mount: <el|selector> })
 *
 * Systems: battles (MC problems + SVG diagrams), a shop, battle items &
 * level-gated abilities, per-standard mastery, achievements, a daily quest with
 * a return streak, a hero codex, and a gated finale. All integrations
 * (AI Sage /api/tutor, Save/Resume) are optional and guarded; the game runs
 * fully offline with progress in localStorage.
 * ========================================================================== */
(function () {
  "use strict";
  if (window.NumberRealm) return;

  var P = window.MRPG_PROBLEMS;
  var PROFILE = window.MRPG_PROFILE;
  var ITEMS = window.MRPG_ITEMS;
  var DIAG = window.MRPG_DIAGRAMS;

  /* ---- tiny DOM helpers -------------------------------------------------- */
  function h(tag, attrs, kids) {
    var n = document.createElement(tag);
    if (attrs) {
      Object.keys(attrs).forEach(function (k) {
        if (k === "class") n.className = attrs[k];
        else if (k === "html") n.innerHTML = attrs[k];
        else if (k === "text") n.textContent = attrs[k];
        else if (k.slice(0, 2) === "on" && typeof attrs[k] === "function")
          n.addEventListener(k.slice(2).toLowerCase(), attrs[k]);
        else if (attrs[k] === true) n.setAttribute(k, "");
        else if (attrs[k] != null && attrs[k] !== false) n.setAttribute(k, attrs[k]);
      });
    }
    (kids || []).forEach(function (c) {
      if (c == null) return;
      n.appendChild(typeof c === "string" ? document.createTextNode(c) : c);
    });
    return n;
  }
  function clear(el) { while (el && el.firstChild) el.removeChild(el.firstChild); }
  function reduceMotion() {
    return !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }

  /* ---- date helpers (local calendar day) -------------------------------- */
  function dstr(ms) {
    var d = new Date(ms);
    var z = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
    return z.toISOString().slice(0, 10);
  }
  function today() { return dstr(Date.now()); }
  function yesterday() { return dstr(Date.now() - 86400000); }

  /* ---- engine state ------------------------------------------------------ */
  var UNIT = null; // active unit / realm config
  var MOUNT = null;
  var GAME = null; // per-realm progress
  var BATTLE = null; // transient battle state

  function storeKey() { return "mrpg:unit" + (UNIT ? UNIT.id : "x"); }

  function freshGame() {
    return { v: 2, unitId: UNIT.id, seenIntro: false, cleared: {}, bossDone: false, done: false };
  }
  function loadGame() {
    var g = null;
    try { var raw = localStorage.getItem(storeKey()); if (raw) g = JSON.parse(raw); } catch (e) {}
    if (!g || g.unitId !== UNIT.id) g = freshGame();
    if (!g.cleared) g.cleared = {};
    // v1 -> v2: migrate any legacy per-unit hero into the global profile.
    if (g.hero && PROFILE) { try { PROFILE.migrateFrom(g.hero); } catch (e) {} delete g.hero; g.v = 2; }
    return g;
  }
  function saveGame() {
    try { localStorage.setItem(storeKey(), JSON.stringify(GAME)); } catch (e) {}
    try { if (window.NeftSaveResume && window.NeftSaveResume.save) window.NeftSaveResume.save("mrpg"); } catch (e) {}
  }

  // Count realms (units 1..10) marked done, by scanning their saves.
  function realmsClearedCount() {
    var n = 0;
    for (var i = 1; i <= 10; i++) {
      try {
        var raw = localStorage.getItem("mrpg:unit" + i);
        if (raw && JSON.parse(raw).done) n++;
      } catch (e) {}
    }
    return n;
  }

  /* ---- Save/Resume custom-state wiring ----------------------------------- */
  function wireSaveResume() {
    try {
      var SR = window.NeftSaveResume;
      if (!SR || SR.__mrpgWired) return;
      SR.__mrpgWired = true;
      if (SR.registerStateProvider) {
        SR.registerStateProvider(function () {
          return { mrpg: GAME, mrpgHero: PROFILE ? PROFILE.get() : null };
        });
      }
      if (SR.registerStateRestorer) {
        SR.registerStateRestorer(function (obj) {
          if (obj && obj.mrpg && obj.mrpg.unitId === UNIT.id) {
            GAME = obj.mrpg;
            if (!GAME.cleared) GAME.cleared = {};
            saveGame();
          }
          if (obj && obj.mrpgHero && PROFILE) {
            try { localStorage.setItem("mrpg:hero", JSON.stringify(obj.mrpgHero)); } catch (e) {}
          }
          if (!BATTLE) render();
        });
      }
    } catch (e) {}
  }

  /* ---- achievements ----------------------------------------------------- */
  var pendingToasts = [];
  function grantAch(id) {
    if (!PROFILE) return;
    if (PROFILE.grant(id)) {
      var def = ITEMS.ACHIEVEMENTS.filter(function (a) { return a.id === id; })[0];
      if (def) pendingToasts.push(def.emoji + " Achievement: " + def.name);
    }
  }
  function checkThresholdAchievements() {
    if (!PROFILE) return;
    var pr = PROFILE.get();
    if (pr.level >= 5) grantAch("level-5");
    if (pr.level >= 10) grantAch("level-10");
    if (pr.stats.bossesBeaten >= 5) grantAch("boss-slayer");
    if (PROFILE.masteredCount() >= 5) grantAch("scholar-5");
    var rc = realmsClearedCount();
    if (rc >= 3) grantAch("realms-3");
    if (rc >= 10) grantAch("realms-all");
  }
  function flushToasts() {
    if (!pendingToasts.length) return;
    var wrap = h("div", { class: "mrpg-toasts", "aria-live": "polite" },
      pendingToasts.map(function (t) { return h("div", { class: "mrpg-toast", text: t }); }));
    document.body.appendChild(wrap);
    pendingToasts = [];
    setTimeout(function () { if (wrap.parentNode) wrap.parentNode.removeChild(wrap); }, 4200);
  }

  /* ---- AI Sage (Socratic hints) ----------------------------------------- */
  function askSage(problem, cb) {
    var fallback = problem.explain || "Re-read the question and name what it is asking for.";
    var done = false;
    function finish(text, source) { if (!done) { done = true; cb(text, source); } }
    var ctrl = null;
    try { ctrl = typeof AbortController !== "undefined" ? new AbortController() : null; } catch (e) {}
    var timer = setTimeout(function () { if (ctrl) try { ctrl.abort(); } catch (e) {} finish(fallback, "offline"); }, 12000);
    try {
      fetch("/api/tutor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: ctrl ? ctrl.signal : undefined,
        body: JSON.stringify({ mode: "hint", standard: problem.standard || "", itemText: problem.prompt || "", studentWork: "", history: [] }),
      })
        .then(function (r) { return r.json().catch(function () { return null; }); })
        .then(function (data) {
          clearTimeout(timer);
          if (data && data.ok && data.reply) finish(data.reply, "sage");
          else finish(fallback, "offline");
        })
        .catch(function () { clearTimeout(timer); finish(fallback, "offline"); });
    } catch (e) { clearTimeout(timer); finish(fallback, "offline"); }
  }

  /* ---- rendering: shared chrome ----------------------------------------- */
  function stage(kids) {
    clear(MOUNT);
    var s = h("div", { class: "mrpg-stage" }, kids);
    MOUNT.appendChild(s);
    MOUNT.scrollIntoView({ block: "nearest" });
    flushToasts();
    return s;
  }
  function chapterList() { return UNIT.chapters || []; }
  function allChaptersCleared() { return chapterList().every(function (c) { return GAME.cleared[c.id]; }); }
  function nextOpenIndex() {
    var list = chapterList();
    for (var i = 0; i < list.length; i++) if (!GAME.cleared[list[i].id]) return i;
    return list.length;
  }
  function backLink() { return h("a", { class: "mrpg-backlink", href: "/math-rpg/", text: "← All realms" }); }

  function statBar() {
    var pr = PROFILE.get();
    var frac = pr.xpNext ? Math.round((pr.xp / pr.xpNext) * 100) : 0;
    return h("div", { class: "mrpg-statbar", role: "status" }, [
      h("span", { class: "mrpg-stat", text: "🛡️ Lv " + pr.level }),
      h("span", { class: "mrpg-stat mrpg-xp-chip", text: "✨ " + pr.xp + "/" + pr.xpNext + " XP" }),
      h("span", { class: "mrpg-stat", text: "🪙 " + pr.gold }),
      h("span", { class: "mrpg-stat", text: "❤️ " + pr.maxHp + " HP" }),
      h("span", { class: "mrpg-statbar-actions" }, [
        h("button", { class: "mrpg-chip-btn", type: "button", onclick: showShop }, ["🛒 Shop"]),
        h("button", { class: "mrpg-chip-btn", type: "button", onclick: showCodex }, ["📖 Hero"]),
      ]),
    ]);
  }

  /* ---- screen: intro ---------------------------------------------------- */
  function showIntro() {
    BATTLE = null;
    stage([
      h("p", { class: "mrpg-kicker", text: UNIT.title + " · " + (UNIT.standard || "") }),
      h("span", { class: "mrpg-hero-emoji", "aria-hidden": "true", text: UNIT.hero || "🧭" }),
      h("h1", { text: UNIT.realm }),
      UNIT.tagline ? h("p", { text: UNIT.tagline }) : null,
      h("div", { class: "mrpg-scene", text: UNIT.intro || "" }),
      h("div", { class: "mrpg-actions" }, [
        h("button", { class: "mrpg-btn", onclick: function () { GAME.seenIntro = true; saveGame(); showMap(); } }, ["Begin your quest ⚔️"]),
      ]),
      backLink(),
    ]);
  }

  /* ---- screen: world map ------------------------------------------------ */
  function showMap() {
    BATTLE = null;
    var list = chapterList();
    var openIdx = nextOpenIndex();
    var nodes = list.map(function (ch, i) {
      var cleared = !!GAME.cleared[ch.id];
      var isCurrent = i === openIdx;
      var locked = i > openIdx;
      var cls = "mrpg-node" + (cleared ? " cleared" : "") + (isCurrent ? " current" : "");
      return h("button", {
        class: cls, disabled: locked ? true : false,
        "aria-label": ch.title + (cleared ? " (cleared)" : locked ? " (locked)" : " (ready)"),
        onclick: locked ? null : function () { startChapter(ch); },
      }, [
        h("span", { class: "mrpg-node-emoji", "aria-hidden": "true", text: ch.enemy.emoji || "👾" }),
        h("span", { class: "mrpg-node-body" }, [
          h("p", { class: "mrpg-node-title", text: ch.title }),
          h("p", { class: "mrpg-node-sub", text: ch.topicLabel || (ch.enemy.name + " · " + (ch.standard || "")) }),
        ]),
        h("span", { class: "mrpg-node-flag", "aria-hidden": "true", text: cleared ? "✅" : locked ? "🔒" : "▶️" }),
      ]);
    });
    var bossReady = allChaptersCleared();
    if (UNIT.boss) {
      nodes.push(h("button", {
        class: "mrpg-node" + (GAME.bossDone ? " cleared" : bossReady ? " current" : ""),
        disabled: bossReady ? false : true,
        "aria-label": "Boss: " + UNIT.boss.name + (GAME.bossDone ? " (defeated)" : bossReady ? " (ready)" : " (locked)"),
        onclick: bossReady ? function () { startBoss(); } : null,
      }, [
        h("span", { class: "mrpg-node-emoji", "aria-hidden": "true", text: UNIT.boss.emoji || "🐉" }),
        h("span", { class: "mrpg-node-body" }, [
          h("p", { class: "mrpg-node-title", text: "BOSS · " + UNIT.boss.name }),
          h("p", { class: "mrpg-node-sub", text: UNIT.boss.subtitle || "The realm's final challenge" }),
        ]),
        h("span", { class: "mrpg-node-flag", "aria-hidden": "true", text: GAME.bossDone ? "👑" : bossReady ? "🔥" : "🔒" }),
      ]));
    }
    var dailyDone = PROFILE.dailyDone(today());
    stage([
      statBar(),
      h("div", { class: "mrpg-daily-strip" }, [
        h("div", {}, [
          h("strong", { text: dailyDone ? "✅ Daily Quest complete" : "🗓️ Daily Quest" }),
          h("span", { class: "mrpg-daily-sub", text: dailyDone ? "Come back tomorrow to keep your streak alive." : "A fresh mixed challenge. Win it for bonus XP & gold." }),
        ]),
        h("div", { class: "mrpg-daily-right" }, [
          h("span", { class: "mrpg-streak", text: "🔥 " + PROFILE.get().daily.streak + "-day streak" }),
          h("button", { class: "mrpg-btn small" + (dailyDone ? " ghost" : ""), type: "button", disabled: dailyDone ? true : false, onclick: dailyDone ? null : startDaily }, [dailyDone ? "Done today" : "Start Daily"]),
        ]),
      ]),
      h("p", { class: "mrpg-kicker", text: UNIT.title + " · " + UNIT.realm }),
      h("h1", { text: "World Map" }),
      h("p", { text: GAME.done ? "You cleared this realm — replay any battle to keep your skills sharp." : "Choose your next battle. Defeat each foe to unlock the path forward." }),
      h("div", { class: "mrpg-map" }, nodes),
      backLink(),
    ]);
    checkThresholdAchievements();
    flushToasts();
  }

  /* ---- battle setup ----------------------------------------------------- */
  function startChapter(ch) {
    BATTLE = null;
    stage([
      h("p", { class: "mrpg-kicker", text: ch.title }),
      h("span", { class: "mrpg-hero-emoji", "aria-hidden": "true", text: ch.enemy.emoji || "👾" }),
      h("h1", { text: "A wild " + ch.enemy.name + " appears!" }),
      ch.scene ? h("div", { class: "mrpg-scene", text: ch.scene }) : null,
      h("p", { text: "Solve problems to attack. A wrong answer lets it strike back — use items, abilities, or ask the Sage." }),
      h("div", { class: "mrpg-actions" }, [
        h("button", { class: "mrpg-btn", onclick: function () { beginBattle(ch, false, false); } }, ["Fight! ⚔️"]),
        h("button", { class: "mrpg-btn ghost", onclick: showMap }, ["Retreat"]),
      ]),
    ]);
  }
  function startBoss() {
    var boss = UNIT.boss;
    stage([
      h("p", { class: "mrpg-kicker", text: UNIT.finale ? "SAGA FINALE" : "FINAL BATTLE" }),
      h("span", { class: "mrpg-hero-emoji", "aria-hidden": "true", text: boss.emoji || "🐉" }),
      h("h1", { text: boss.name }),
      boss.scene ? h("div", { class: "mrpg-scene", text: boss.scene }) : null,
      h("p", { text: "The boss draws on everything you've learned. Stock up in the shop first if you need to." }),
      h("div", { class: "mrpg-actions" }, [
        h("button", { class: "mrpg-btn", onclick: function () { beginBattle(boss, true, false); } }, ["Face the boss 🔥"]),
        h("button", { class: "mrpg-btn ghost", onclick: showShop }, ["🛒 Shop first"]),
        h("button", { class: "mrpg-btn ghost", onclick: showMap }, ["Not yet"]),
      ]),
    ]);
  }
  function startDaily() {
    // Global mixed challenge; themed by the current realm.
    var node = {
      id: "daily", name: "Daily Challenger", emoji: "🗓️",
      topics: dailyTopics(), hitsToWin: 6, victory: "", scene: "",
    };
    stage([
      h("p", { class: "mrpg-kicker", text: "DAILY QUEST · " + today() }),
      h("span", { class: "mrpg-hero-emoji", "aria-hidden": "true", text: "🗓️" }),
      h("h1", { text: "The Daily Challenger" }),
      h("div", { class: "mrpg-scene", text: "A mixed set of problems from across the Number Realm. Win to earn bonus rewards and grow your streak. Come back every day!" }),
      h("div", { class: "mrpg-actions" }, [
        h("button", { class: "mrpg-btn", onclick: function () { beginBattle(node, false, true); } }, ["Begin Daily Quest ⚔️"]),
        h("button", { class: "mrpg-btn ghost", onclick: showMap }, ["Later"]),
      ]),
    ]);
  }
  // Pick a spread of topics for the daily quest. Seeded by the date so every
  // student on the same day faces the same skill mix (but fresh numbers).
  function dailyTopics() {
    var all = P.topics();
    var seed = 0, s = today();
    for (var i = 0; i < s.length; i++) seed = (seed * 31 + s.charCodeAt(i)) >>> 0;
    var picks = [];
    for (var k = 0; k < 6; k++) { seed = (seed * 1103515245 + 12345) >>> 0; picks.push(all[seed % all.length]); }
    return picks;
  }

  function beginBattle(node, isBoss, isDaily) {
    var pr = PROFILE.get();
    var topics = (node.topics && node.topics.length ? node.topics : ["gcf"]).filter(function (t) { return P.has(t); });
    if (!topics.length) topics = ["gcf"];
    var hitsToWin = node.hitsToWin || (isBoss ? 8 : 5);
    // Enemy scales gently with hero level so battles stay challenging for weeks.
    var levelScale = 1 + Math.min(0.6, (pr.level - 1) * 0.06);
    var enemyMax = 100;
    BATTLE = {
      node: node, isBoss: isBoss, isDaily: !!isDaily, topics: topics,
      enemyMax: enemyMax, enemyHp: enemyMax,
      dmg: Math.ceil(enemyMax / hitsToWin),
      enemyDmg: Math.round(Math.ceil(pr.maxHp / (isBoss ? 6 : 5)) * levelScale),
      heroHp: pr.maxHp, heroMax: pr.maxHp,
      streak: 0, correct: 0, asked: 0, hintsUsed: 0,
      powerNext: false, aegis: false, phoenix: false,
      usedSecondWind: false, usedScholar: false,
      abilityCharges: {}, problem: null, answered: false,
    };
    // Fresh ability charges for this battle.
    ITEMS.ABILITIES.forEach(function (a) { if (pr.abilities[a.id]) BATTLE.abilityCharges[a.id] = a.charges; });
    nextProblem();
  }

  function nextProblem() {
    var t = BATTLE.topics[BATTLE.asked % BATTLE.topics.length];
    if (BATTLE.asked >= BATTLE.topics.length) t = BATTLE.topics[Math.floor(Math.random() * BATTLE.topics.length)];
    BATTLE.problem = P.generate(t);
    BATTLE.answered = false;
    renderBattle();
  }

  /* ---- battle rendering -------------------------------------------------- */
  function hpBarClass(frac) {
    if (frac <= 0.25) return "mrpg-bar low";
    if (frac <= 0.5) return "mrpg-bar warn";
    return "mrpg-bar";
  }
  function fighter(emoji, name, hp, maxHp, side) {
    var frac = Math.max(0, hp) / maxHp;
    return h("div", { class: "mrpg-fighter", "data-side": side }, [
      h("span", { class: "emoji", "aria-hidden": "true", text: emoji }),
      h("p", { class: "name", text: name }),
      h("div", { class: hpBarClass(frac) }, [h("span", { style: "width:" + Math.max(0, Math.round(frac * 100)) + "%" })]),
      h("p", { class: "mrpg-hp-label", text: Math.max(0, hp) + " / " + maxHp + " HP" }),
    ]);
  }

  function renderBattle() {
    var b = BATTLE;
    var p = b.problem;
    var pr = PROFILE.get();

    var choiceBtns = p.choices.map(function (c, i) {
      return h("button", { class: "mrpg-choice", type: "button", "data-i": i, onclick: function () { onChoice(i); } }, [c]);
    });

    var diagramHtml = (DIAG && p.diagram) ? DIAG.render(p.diagram) : "";
    var qKids = [
      h("p", { class: "mrpg-q-standard", text: (p.topic || "") + (p.standard ? " · " + p.standard : "") }),
    ];
    if (diagramHtml) qKids.push(h("div", { class: "mrpg-diagram", html: diagramHtml }));
    qKids.push(h("p", { class: "mrpg-q-text", tabindex: "-1", text: p.prompt }));
    qKids.push(h("div", { class: "mrpg-choices" }, choiceBtns));

    var log = h("p", { class: "mrpg-log", "aria-live": "polite" }, [b.isBoss ? "The boss glares. Make your move." : "Choose the correct answer to attack!"]);
    var sage = h("div", { class: "mrpg-sage", hidden: true }, [
      h("p", { class: "mrpg-sage-title" }, ["🦉 The Sage says:"]),
      h("p", { class: "mrpg-sage-body" }, [""]),
    ]);

    var heroBox = fighter(pr.avatar || "🧑‍🎓", pr.name || "You", b.heroHp, b.heroMax, "hero");
    var enemyBox = fighter(b.node.emoji || "👾", b.node.name || b.node.title, b.enemyHp, b.enemyMax, "enemy");

    // Ability + item action rows (always present so they can refresh in place).
    var abilBar = h("div", { class: "mrpg-toolbar", "aria-label": "Abilities" }, buildAbilityBtns());
    var itemBar = h("div", { class: "mrpg-toolbar", "aria-label": "Items" }, buildItemBtns());

    stage([
      statBar(),
      h("div", { class: "mrpg-combatants" }, [heroBox, h("div", { class: "mrpg-vs", "aria-hidden": "true", text: "VS" }), enemyBox]),
      h("div", { class: "mrpg-question" }, qKids),
      abilBar,
      itemBar,
      h("div", { class: "mrpg-actions" }, [
        h("button", { class: "mrpg-btn ghost small", type: "button", onclick: function () { onHint(sage); } }, ["🦉 Ask the Sage"]),
        h("button", { class: "mrpg-btn ghost small", type: "button", onclick: showMap }, ["Flee"]),
      ]),
      sage,
      log,
    ]);
    abilBar.style.display = abilBar.children.length ? "" : "none";
    itemBar.style.display = itemBar.children.length ? "" : "none";

    b._els = { log: log, sage: sage, choices: choiceBtns, heroBox: heroBox, enemyBox: enemyBox, abilBar: abilBar, itemBar: itemBar, qtext: MOUNT.querySelector(".mrpg-q-text") };
    if (b._els.qtext) { try { b._els.qtext.focus(); } catch (e) {} }
  }

  // Build ability buttons (non-passive, unlocked) for the current battle.
  function buildAbilityBtns() {
    var b = BATTLE, pr = PROFILE.get(), out = [];
    if (!b) return out;
    ITEMS.ABILITIES.forEach(function (a) {
      if (!pr.abilities[a.id] || a.passive) return;
      var charges = b.abilityCharges[a.id] || 0;
      out.push(h("button", {
        class: "mrpg-tool", type: "button", disabled: charges > 0 ? false : true,
        title: a.desc, onclick: function () { useAbility(a.id); },
      }, [a.emoji + " " + a.name + " (" + charges + ")"]));
    });
    return out;
  }
  // Build item buttons for items currently owned.
  function buildItemBtns() {
    var out = [];
    if (!BATTLE) return out;
    ITEMS.SHOP.forEach(function (it) {
      var count = PROFILE.itemCount(it.id);
      if (count <= 0) return;
      out.push(h("button", {
        class: "mrpg-tool item", type: "button", title: it.desc, onclick: function () { useItem(it.id); },
      }, [it.emoji + " " + it.name + " ×" + count]));
    });
    return out;
  }
  // Refresh only the toolbars in place — never touches the choices or log.
  function refreshToolbars() {
    var b = BATTLE;
    if (!b || !b._els) return;
    if (b._els.abilBar) { clear(b._els.abilBar); buildAbilityBtns().forEach(function (n) { b._els.abilBar.appendChild(n); }); b._els.abilBar.style.display = b._els.abilBar.children.length ? "" : "none"; }
    if (b._els.itemBar) { clear(b._els.itemBar); buildItemBtns().forEach(function (n) { b._els.itemBar.appendChild(n); }); b._els.itemBar.style.display = b._els.itemBar.children.length ? "" : "none"; }
  }

  function animate(el, cls) {
    if (!el || reduceMotion()) return;
    el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls);
  }
  function setLog(node, parts) {
    if (!node) return;
    clear(node);
    (parts || []).forEach(function (p) { node.appendChild(typeof p === "string" ? document.createTextNode(p) : p); });
  }
  function updateBar(fighterEl, hp, maxHp) {
    if (!fighterEl) return;
    var frac = Math.max(0, hp) / maxHp;
    var bar = fighterEl.querySelector(".mrpg-bar");
    var span = bar ? bar.querySelector("span") : null;
    var lbl = fighterEl.querySelector(".mrpg-hp-label");
    if (bar) bar.className = hpBarClass(frac);
    if (span) span.style.width = Math.max(0, Math.round(frac * 100)) + "%";
    if (lbl) lbl.textContent = Math.max(0, hp) + " / " + maxHp + " HP";
  }

  /* ---- battle tools ----------------------------------------------------- */
  function removeTwoWrong() {
    var b = BATTLE;
    if (!b || b.answered) return false;
    var wrongIdx = [];
    b._els.choices.forEach(function (btn, i) {
      if (i !== b.problem.answer && !btn.disabled) wrongIdx.push(i);
    });
    // shuffle and disable two
    for (var i = wrongIdx.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = wrongIdx[i]; wrongIdx[i] = wrongIdx[j]; wrongIdx[j] = t; }
    wrongIdx.slice(0, 2).forEach(function (i) { b._els.choices[i].disabled = true; b._els.choices[i].classList.add("removed"); });
    return true;
  }
  function useAbility(id) {
    var b = BATTLE;
    if (!b || b.answered) return;
    if ((b.abilityCharges[id] || 0) <= 0) return;
    if (id === "focus") { if (!removeTwoWrong()) return; b.abilityCharges[id]--; setLog(b._els.log, ["🎯 Focus! Two wrong answers vanished."]); }
    else if (id === "power") { b.abilityCharges[id]--; b.powerNext = true; setLog(b._els.log, ["⚡ Power Strike armed — your next correct answer hits double!"]); }
    refreshToolbars();
  }
  function useItem(id) {
    var b = BATTLE;
    if (!b || b.answered) return;
    if (!PROFILE.itemCount(id)) return;
    if (id === "potion") {
      if (!PROFILE.useItem(id)) return;
      var heal = Math.round(b.heroMax * 0.45);
      b.heroHp = Math.min(b.heroMax, b.heroHp + heal);
      updateBar(b._els.heroBox, b.heroHp, b.heroMax);
      animate(b._els.heroBox, "mrpg-anim-pop");
      setLog(b._els.log, [h("span", { class: "heal", text: "🧪 Potion! +" + heal + " HP" })]);
    } else if (id === "insight") {
      if (!PROFILE.useItem(id)) return;
      b._els.sage.hidden = false;
      var body = b._els.sage.querySelector(".mrpg-sage-body");
      body.className = "mrpg-sage-body"; body.textContent = "📜 " + (b.problem.explain || "Work through the method step by step.");
    } else if (id === "aegis") {
      if (!PROFILE.useItem(id)) return;
      b.aegis = true; setLog(b._els.log, ["🛡️ Aegis Charm ready — it will block your next wrong answer."]);
    } else if (id === "phoenix") {
      if (!PROFILE.useItem(id)) return;
      b.phoenix = true; setLog(b._els.log, ["🔥 Phoenix Feather ready — you'll revive once if knocked out."]);
    } else if (id === "tome") {
      if (!removeTwoWrong()) return;
      PROFILE.useItem(id); setLog(b._els.log, ["📘 Tome of Focus! Two wrong answers vanished."]);
    }
    refreshToolbars();
  }

  function onHint(sageEl) {
    var b = BATTLE;
    if (!b || b.answered) return;
    b.hintsUsed++;
    if (PROFILE) PROFILE.bump("hintsUsed");
    sageEl.hidden = false;
    var body = sageEl.querySelector(".mrpg-sage-body");
    body.className = "mrpg-sage-body thinking"; body.textContent = "The Sage is thinking…";
    askSage(b.problem, function (text) {
      if (!BATTLE || BATTLE !== b) return;
      body.className = "mrpg-sage-body"; body.textContent = text;
    });
  }

  function onChoice(i) {
    var b = BATTLE;
    if (!b || b.answered) return;
    b.answered = true; b.asked++;
    var p = b.problem;
    var correct = i === p.answer;
    var els = b._els;
    els.choices.forEach(function (btn, idx) {
      btn.disabled = true;
      if (idx === p.answer) btn.classList.add("correct");
      if (idx === i && !correct) btn.classList.add("wrong");
    });
    if (PROFILE) PROFILE.recordAnswer(p.standard, correct);

    if (correct) {
      b.correct++; b.streak++;
      var crit = b.streak >= 3;
      var dmg = Math.round(b.dmg * (crit ? 1.5 : 1));
      var powered = false;
      if (b.powerNext) { dmg *= 2; b.powerNext = false; powered = true; }
      b.enemyHp = Math.max(0, b.enemyHp - dmg);
      animate(els.enemyBox, "mrpg-anim-hit");
      updateBar(els.enemyBox, b.enemyHp, b.enemyMax);
      setLog(els.log, [
        h("span", {}, [powered ? "⚡💥 Power Strike! " : crit ? "💥 Critical hit! " : "⚔️ Hit! "]),
        h("span", { class: "dmg", text: "−" + dmg + " to " + (b.node.name || "the foe") }),
        b.streak >= 3 ? h("span", { text: "  (streak ×" + b.streak + "!)" }) : "",
      ]);
      if (b.enemyHp <= 0) setTimeout(winBattle, 650);
      else setTimeout(nextProblem, 850);
    } else {
      b.streak = 0;
      var damage = b.enemyDmg;
      var note = "";
      if (b.aegis) { damage = 0; b.aegis = false; note = "🛡️ Aegis blocked the hit! "; }
      else if (PROFILE.get().abilities.scholar && !b.usedScholar) { damage = 0; b.usedScholar = true; note = "📚 Scholar's Mercy — no damage this time. "; }
      b.heroHp = Math.max(0, b.heroHp - damage);
      // Second Wind rescue.
      if (b.heroHp <= 0 && PROFILE.get().abilities.secondwind && !b.usedSecondWind) {
        b.usedSecondWind = true; b.heroHp = Math.round(b.heroMax * 0.4); note += "💨 Second Wind revived you! ";
      } else if (b.heroHp <= 0 && b.phoenix) {
        b.phoenix = false; b.heroHp = Math.round(b.heroMax * 0.5); note += "🔥 The Phoenix Feather revived you! ";
      }
      animate(els.heroBox, "mrpg-anim-hit");
      updateBar(els.heroBox, b.heroHp, b.heroMax);
      setLog(els.log, [
        h("span", { class: "dmg", text: "✖ Not quite. " + note + (damage ? "(−" + damage + " HP) " : "") }),
        h("span", { text: p.explain || "" }),
      ]);
      if (b.heroHp <= 0) setTimeout(loseBattle, 700);
      else {
        var cont = h("div", { class: "mrpg-actions" }, [h("button", { class: "mrpg-btn", onclick: nextProblem }, ["Next problem →"])]);
        els.log.parentNode.insertBefore(cont, els.log.nextSibling);
      }
    }
  }

  /* ---- battle outcomes -------------------------------------------------- */
  function winBattle() {
    var b = BATTLE;
    var acc = b.asked ? Math.round((b.correct / b.asked) * 100) : 100;
    var flawless = b.asked > 0 && b.correct === b.asked;
    var baseXp = b.isBoss ? 130 : b.isDaily ? 90 : 60;
    var xp = baseXp + Math.round(baseXp * (acc / 100)) + b.correct * 5;
    var gold = (b.isBoss ? 55 : b.isDaily ? 40 : 22) + b.correct * 3;

    // Daily streak bonus.
    var streakInfo = null;
    if (b.isDaily) {
      streakInfo = PROFILE.completeDaily(today(), yesterday());
      var mult = 1 + Math.min(1, (streakInfo.streak - 1) * 0.1);
      gold = Math.round(gold * mult); xp = Math.round(xp * mult);
      if (streakInfo.streak >= 3) grantAch("streak-3");
      if (streakInfo.streak >= 7) grantAch("streak-7");
    }

    PROFILE.addGold(gold);
    var lvl = PROFILE.addXp(xp);
    PROFILE.bump("battlesWon");
    if (flawless) { grantAch("flawless"); PROFILE.bump("perfectBattles"); }
    grantAch("first-blood");

    if (b.isBoss) {
      PROFILE.bump("bossesBeaten");
      if (b.hintsUsed === 0) grantAch("no-hints-boss");
      if (UNIT.finale) grantAch("the-null");
      GAME.bossDone = true; GAME.done = true;
      PROFILE.bump("realmsCleared");
    } else if (!b.isDaily) {
      GAME.cleared[b.node.id] = true;
    }
    if (!b.isDaily) saveGame();
    checkThresholdAchievements();

    var scene = b.isDaily ? "" : b.isBoss ? (UNIT.boss.victory || "") : (b.node.victory || "");
    var wasBoss = b.isBoss, wasDaily = b.isDaily;
    BATTLE = null;

    stage([
      h("div", { class: "mrpg-result" }, [
        h("span", { class: "big-emoji", "aria-hidden": "true", text: wasBoss ? "👑" : wasDaily ? "🗓️" : "🎉" }),
        h("h1", { text: wasBoss ? (UNIT.finale ? "The saga is complete!" : "The realm is saved!") : wasDaily ? "Daily Quest complete!" : "Victory!" }),
        scene ? h("div", { class: "mrpg-scene", text: scene }) : null,
        h("p", { text: "Accuracy: " + acc + "%" + (b.hintsUsed ? "  ·  Hints used: " + b.hintsUsed : "") + (flawless ? "  ·  Flawless! 💎" : "") }),
        streakInfo ? h("p", { class: "mrpg-streak", text: "🔥 " + streakInfo.streak + "-day streak (best: " + streakInfo.longest + ")" }) : null,
        h("div", { class: "mrpg-reward" }, [
          h("span", { text: "✨ +" + xp + " XP" }),
          h("span", { text: "🪙 +" + gold }),
          lvl.levels ? h("span", { text: "⬆️ Level up! Now Lv " + PROFILE.get().level }) : null,
        ]),
        lvl.abilities && lvl.abilities.length ? h("div", { class: "mrpg-unlock", text: "🔓 New ability unlocked: " + lvl.abilities.map(function (id) { var a = ITEMS.abilityById(id); return a ? a.emoji + " " + a.name : id; }).join(", ") }) : null,
        h("div", { class: "mrpg-actions", style: "justify-content:center" }, [
          wasBoss
            ? h("button", { class: "mrpg-btn", onclick: showComplete }, ["See your results 🏆"])
            : h("button", { class: "mrpg-btn", onclick: showMap }, ["Continue the quest →"]),
        ]),
      ]),
    ]);
    flushToasts();
  }

  function loseBattle() {
    var b = BATTLE;
    var node = b.node, isBoss = b.isBoss, isDaily = b.isDaily;
    BATTLE = null;
    stage([
      h("div", { class: "mrpg-result" }, [
        h("span", { class: "big-emoji", "aria-hidden": "true", text: "💫" }),
        h("h1", { text: "You were knocked out!" }),
        h("p", { text: "Every hero regroups. Buy a potion in the shop, use the Sage's hints, and try again. Your other progress is safe." }),
        h("div", { class: "mrpg-actions", style: "justify-content:center" }, [
          h("button", { class: "mrpg-btn", onclick: function () { isDaily ? startDaily() : isBoss ? startBoss() : startChapter(node); } }, ["Try again 🔁"]),
          h("button", { class: "mrpg-btn ghost", onclick: showShop }, ["🛒 Shop"]),
          h("button", { class: "mrpg-btn ghost", onclick: showMap }, ["World map"]),
        ]),
      ]),
    ]);
  }

  /* ---- screen: shop ----------------------------------------------------- */
  function showShop() {
    BATTLE = null;
    var pr = PROFILE.get();
    var cards = ITEMS.SHOP.map(function (it) {
      var owned = PROFILE.itemCount(it.id);
      var afford = pr.gold >= it.cost;
      return h("div", { class: "mrpg-shop-item" }, [
        h("span", { class: "mrpg-shop-emoji", "aria-hidden": "true", text: it.emoji }),
        h("div", { class: "mrpg-shop-body" }, [
          h("p", { class: "mrpg-shop-name", text: it.name + (owned ? "  (have " + owned + ")" : "") }),
          h("p", { class: "mrpg-shop-desc", text: it.desc }),
        ]),
        h("button", {
          class: "mrpg-btn small" + (afford ? "" : " ghost"), type: "button", disabled: afford ? false : true,
          onclick: function () { buyItem(it.id); },
        }, ["🪙 " + it.cost]),
      ]);
    });
    stage([
      statBar(),
      h("p", { class: "mrpg-kicker", text: "The Wandering Merchant" }),
      h("h1", { text: "🛒 Shop" }),
      h("p", { text: "Spend gold on items you can use during battle. Items are shared across every realm." }),
      h("div", { class: "mrpg-shop" }, cards),
      h("div", { class: "mrpg-actions" }, [h("button", { class: "mrpg-btn ghost", onclick: showMap }, ["← Back to map"])]),
    ]);
  }
  function buyItem(id) {
    var it = ITEMS.shopById(id);
    if (!it) return;
    if (!PROFILE.spendGold(it.cost)) return;
    PROFILE.addItem(id, 1);
    grantAch("shopper");
    showShop();
    flushToasts();
  }

  /* ---- screen: hero codex ----------------------------------------------- */
  function showCodex() {
    BATTLE = null;
    var pr = PROFILE.get();
    // Mastery grid across all standards seen.
    var stds = Object.keys(pr.mastery).sort();
    var masteryRows = stds.length ? stds.map(function (s) {
      var m = pr.mastery[s];
      var tier = PROFILE.masteryTier(s);
      var acc = m.total ? Math.round((m.correct / m.total) * 100) : 0;
      return h("div", { class: "mrpg-mastery-row" }, [
        h("span", { class: "mrpg-mastery-std", text: s }),
        h("span", { class: "mrpg-mastery-bar" }, [h("span", { class: "fill tier-" + (tier || "none"), style: "width:" + acc + "%" })]),
        h("span", { class: "mrpg-mastery-tag tier-" + (tier || "none"), text: tier ? tier : "—" }),
        h("span", { class: "mrpg-mastery-n", text: m.correct + "/" + m.total }),
      ]);
    }) : [h("p", { class: "mrpg-muted", text: "Answer problems in battle to start building mastery." })];

    var achChips = ITEMS.ACHIEVEMENTS.map(function (a) {
      var got = PROFILE.has(a.id);
      return h("div", { class: "mrpg-ach" + (got ? " got" : ""), title: a.hint }, [
        h("span", { class: "mrpg-ach-emoji", "aria-hidden": "true", text: got ? a.emoji : "🔒" }),
        h("span", { class: "mrpg-ach-name", text: a.name }),
        h("span", { class: "mrpg-ach-hint", text: got ? "Earned" : a.hint }),
      ]);
    });

    var abilChips = ITEMS.ABILITIES.map(function (a) {
      var unlocked = pr.abilities[a.id];
      return h("div", { class: "mrpg-abil" + (unlocked ? " on" : "") }, [
        h("span", { text: (unlocked ? a.emoji : "🔒") + " " + a.name }),
        h("span", { class: "mrpg-abil-desc", text: unlocked ? a.desc : "Unlocks at level " + a.level }),
      ]);
    });

    var inv = Object.keys(pr.inventory);
    var invRow = inv.length ? inv.map(function (id) {
      var it = ITEMS.shopById(id);
      return h("span", { class: "mrpg-inv-chip", text: (it ? it.emoji + " " + it.name : id) + " ×" + pr.inventory[id] });
    }) : [h("span", { class: "mrpg-muted", text: "No items yet — visit the shop." })];

    stage([
      statBar(),
      h("h1", { text: "📖 Hero Codex" }),
      h("div", { class: "mrpg-codex-grid" }, [
        h("div", { class: "mrpg-panel" }, [
          h("h2", { text: "Adventurer" }),
          h("p", {}, [h("strong", { text: (pr.name || "Hero") + " " + (pr.avatar || "🧑‍🎓") })]),
          h("p", { text: "Level " + pr.level + " · " + pr.xp + "/" + pr.xpNext + " XP · 🪙 " + pr.gold }),
          h("p", { text: "🔥 Daily streak: " + pr.daily.streak + " (best " + pr.daily.longest + ") · Days played: " + pr.daily.daysPlayed }),
          h("p", { text: "Realms cleared: " + realmsClearedCount() + "/10 · Bosses beaten: " + pr.stats.bossesBeaten }),
          h("p", { text: "Problems solved: " + pr.stats.problemsSolved + " · Perfect battles: " + pr.stats.perfectBattles }),
          h("h3", { text: "Backpack" }),
          h("div", { class: "mrpg-inv" }, invRow),
        ]),
        h("div", { class: "mrpg-panel" }, [
          h("h2", { text: "Abilities" }),
          h("div", { class: "mrpg-abils" }, abilChips),
        ]),
      ]),
      h("div", { class: "mrpg-panel" }, [
        h("h2", { text: "Skill Mastery (by standard)" }),
        h("p", { class: "mrpg-muted", text: "Master = 80%+ over at least 5 problems. Teachers can read this from the Save/Resume summary." }),
        h("div", { class: "mrpg-mastery" }, masteryRows),
      ]),
      h("div", { class: "mrpg-panel" }, [
        h("h2", { text: "Achievements (" + ITEMS.ACHIEVEMENTS.filter(function (a) { return PROFILE.has(a.id); }).length + "/" + ITEMS.ACHIEVEMENTS.length + ")" }),
        h("div", { class: "mrpg-achs" }, achChips),
      ]),
      h("div", { class: "mrpg-actions" }, [h("button", { class: "mrpg-btn ghost", onclick: showMap }, ["← Back to map"])]),
    ]);
  }

  /* ---- screen: realm complete ------------------------------------------- */
  function showComplete() {
    BATTLE = null;
    var pr = PROFILE.get();
    var allDone = realmsClearedCount() >= 10;
    stage([
      h("div", { class: "mrpg-result" }, [
        h("span", { class: "big-emoji", "aria-hidden": "true", text: UNIT.finale ? "🌌" : "🏆" }),
        h("p", { class: "mrpg-kicker", text: UNIT.title + " · " + UNIT.realm }),
        h("h1", { text: UNIT.finale ? "The Number Realm is Saved" : "Realm Cleared!" }),
        UNIT.outro ? h("div", { class: "mrpg-scene", text: UNIT.outro }) : null,
        h("p", { text: "You mastered the challenges of " + (UNIT.standard || "this unit") + "." }),
        h("div", { class: "mrpg-reward" }, [h("span", { text: "🛡️ Level " + pr.level }), h("span", { text: "🪙 " + pr.gold + " gold" })]),
        (allDone && !UNIT.finale) ? h("div", { class: "mrpg-unlock", text: "🌌 All ten realms cleared — the Saga Finale is now open!" }) : null,
        h("div", { class: "mrpg-actions", style: "justify-content:center" }, [
          h("button", { class: "mrpg-btn", onclick: showMap }, ["Back to map"]),
          (allDone && !UNIT.finale) ? h("a", { class: "mrpg-btn", href: "/math-rpg/finale/", role: "button" }, ["Enter the Finale 🌌"]) : null,
          h("a", { class: "mrpg-btn ghost", href: "/math-rpg/", role: "button" }, ["Choose another realm →"]),
        ]),
      ]),
    ]);
    flushToasts();
  }

  /* ---- gated finale ----------------------------------------------------- */
  function showFinaleLocked() {
    var have = realmsClearedCount();
    stage([
      h("span", { class: "mrpg-hero-emoji", "aria-hidden": "true", text: "🌌" }),
      h("h1", { text: "The Saga Finale is sealed" }),
      h("div", { class: "mrpg-scene", text: "The Null waits beyond all ten realms. Clear every unit realm to break the seal." }),
      h("p", { text: "Realms cleared: " + have + " / 10" }),
      h("div", { class: "mrpg-actions" }, [h("a", { class: "mrpg-btn", href: "/math-rpg/", role: "button" }, ["← Choose a realm"])]),
    ]);
  }

  /* ---- boot ------------------------------------------------------------- */
  function render() {
    if (!UNIT || !MOUNT) return;
    if (UNIT.finale && realmsClearedCount() < 10 && !GAME.done) return showFinaleLocked();
    if (GAME.done && GAME.bossDone) return showComplete();
    if (!GAME.seenIntro) return showIntro();
    return showMap();
  }

  function start(opts) {
    opts = opts || {};
    UNIT = opts.unit || window.MRPG_UNIT;
    if (!UNIT) return;
    MOUNT = typeof opts.mount === "string" ? document.querySelector(opts.mount) : opts.mount;
    if (!MOUNT) MOUNT = document.getElementById("mrpg-root") || document.body;
    MOUNT.classList.add("mrpg");
    if (UNIT.accent) MOUNT.style.setProperty("--accent", UNIT.accent);
    if (!P || !PROFILE || !ITEMS) {
      MOUNT.appendChild(h("p", { text: "The adventure failed to load. Please refresh." }));
      return;
    }
    GAME = loadGame();
    // Register today's visit (return streak / days played).
    try { PROFILE.touchDay(today(), yesterday()); } catch (e) {}
    wireSaveResume();
    render();
  }

  window.NumberRealm = { start: start, _debug: function () { return { UNIT: UNIT, GAME: GAME, BATTLE: BATTLE, PROFILE: PROFILE ? PROFILE.get() : null }; } };
})();
