/* =============================================================================
 * Number Realm — RPG runtime
 * -----------------------------------------------------------------------------
 * A small, dependency-free story-RPG engine. A unit config (window.MRPG_UNIT)
 * describes a themed realm: chapters (monster battles) and a boss. Battles are
 * fought by answering standards-aligned math problems from MRPG_PROBLEMS.
 *
 * Public API:
 *   window.NumberRealm.start({ unit: <config>, mount: <el|selector> })
 *
 * Integrations (all optional / guarded — the game runs fully offline):
 *   - AI "Sage" Socratic hints via POST /api/tutor (never reveals the answer;
 *     falls back to the problem's own method hint when the tutor is offline).
 *   - Save/Resume via window.NeftSaveResume custom-state hooks, PLUS a local
 *     backup in localStorage so progress survives with or without that engine.
 *
 * Hard rules: never throws into the host page, every branch is guarded, motion
 * respects prefers-reduced-motion (handled in CSS), and it is idempotent.
 * ========================================================================== */
(function () {
  "use strict";
  if (window.NumberRealm) return;

  var P = window.MRPG_PROBLEMS;

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
  function clear(el) {
    while (el && el.firstChild) el.removeChild(el.firstChild);
  }
  function reduceMotion() {
    return !!(
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    );
  }

  /* ---- engine state ------------------------------------------------------ */
  var UNIT = null; // active unit config
  var MOUNT = null; // root element
  var GAME = null; // persisted progress
  var BATTLE = null; // transient battle state

  function storeKey() {
    return "mrpg:unit" + (UNIT ? UNIT.id : "x");
  }

  function freshGame() {
    return {
      v: 1,
      unitId: UNIT.id,
      seenIntro: false,
      hero: { level: 1, xp: 0, xpNext: 100, hp: 60, maxHp: 60, gold: 0 },
      cleared: {}, // chapterId -> true
      bossDone: false,
      done: false,
    };
  }

  function loadGame() {
    var g = null;
    try {
      var raw = localStorage.getItem(storeKey());
      if (raw) g = JSON.parse(raw);
    } catch (e) {}
    if (!g || g.unitId !== UNIT.id || g.v !== 1) g = freshGame();
    // Defensive: make sure hero fields exist.
    if (!g.hero) g.hero = freshGame().hero;
    if (!g.cleared) g.cleared = {};
    return g;
  }

  function saveGame() {
    try {
      localStorage.setItem(storeKey(), JSON.stringify(GAME));
    } catch (e) {}
    // Nudge the Save/Resume engine to snapshot (it also polls on a timer).
    try {
      if (window.NeftSaveResume && window.NeftSaveResume.save) {
        window.NeftSaveResume.save("mrpg");
      }
    } catch (e) {}
  }

  /* ---- Save/Resume custom-state wiring ----------------------------------- */
  function wireSaveResume() {
    try {
      var SR = window.NeftSaveResume;
      if (!SR || SR.__mrpgWired) return;
      SR.__mrpgWired = true;
      if (SR.registerStateProvider) {
        SR.registerStateProvider(function () {
          return { mrpg: GAME };
        });
      }
      if (SR.registerStateRestorer) {
        SR.registerStateRestorer(function (obj) {
          if (obj && obj.mrpg && obj.mrpg.unitId === UNIT.id) {
            GAME = obj.mrpg;
            if (!GAME.hero) GAME.hero = freshGame().hero;
            if (!GAME.cleared) GAME.cleared = {};
            saveGame();
            if (!BATTLE) render(); // don't yank a student out of an active fight
          }
        });
      }
    } catch (e) {}
  }

  /* ---- AI Sage (Socratic hints) ----------------------------------------- */
  var SAGE = { online: null }; // null = unknown, true/false once probed
  function askSage(problem, cb) {
    // Try the tutor endpoint; fall back to the problem's built-in method hint.
    var fallback = problem.explain || "Re-read the question and name what it is asking for.";
    var done = false;
    function finish(text, source) {
      if (done) return;
      done = true;
      cb(text, source);
    }
    var ctrl = null;
    try {
      ctrl = typeof AbortController !== "undefined" ? new AbortController() : null;
    } catch (e) {}
    var timer = setTimeout(function () {
      if (ctrl) try { ctrl.abort(); } catch (e) {}
      finish(fallback, "offline");
    }, 12000);

    try {
      fetch("/api/tutor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: ctrl ? ctrl.signal : undefined,
        body: JSON.stringify({
          mode: "hint",
          standard: problem.standard || "",
          itemText: problem.prompt || "",
          studentWork: "",
          history: [],
        }),
      })
        .then(function (r) {
          return r.json().catch(function () { return null; });
        })
        .then(function (data) {
          clearTimeout(timer);
          if (data && data.ok && data.reply) {
            SAGE.online = true;
            finish(data.reply, "sage");
          } else {
            SAGE.online = false;
            finish(fallback, "offline");
          }
        })
        .catch(function () {
          clearTimeout(timer);
          SAGE.online = false;
          finish(fallback, "offline");
        });
    } catch (e) {
      clearTimeout(timer);
      finish(fallback, "offline");
    }
  }

  /* ---- rendering: shared chrome ----------------------------------------- */
  function stage(kids) {
    clear(MOUNT);
    var s = h("div", { class: "mrpg-stage" }, kids);
    MOUNT.appendChild(s);
    MOUNT.scrollIntoView({ block: "nearest" });
    return s;
  }

  function chapterList() {
    return UNIT.chapters || [];
  }
  function allChaptersCleared() {
    return chapterList().every(function (c) { return GAME.cleared[c.id]; });
  }
  function nextOpenIndex() {
    var list = chapterList();
    for (var i = 0; i < list.length; i++) {
      if (!GAME.cleared[list[i].id]) return i;
    }
    return list.length; // all cleared -> boss
  }

  function backLink() {
    return h("a", {
      class: "mrpg-backlink",
      href: "/math-rpg/",
      text: "← All realms",
    });
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
        h("button", {
          class: "mrpg-btn",
          onclick: function () {
            GAME.seenIntro = true;
            saveGame();
            showMap();
          },
        }, ["Begin your quest ⚔️"]),
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
      return h(
        "button",
        {
          class: cls,
          disabled: locked ? true : false,
          "aria-label":
            ch.title + (cleared ? " (cleared)" : locked ? " (locked)" : " (ready)"),
          onclick: locked ? null : function () { startChapter(ch, false); },
        },
        [
          h("span", { class: "mrpg-node-emoji", "aria-hidden": "true", text: ch.enemy.emoji || "👾" }),
          h("span", { class: "mrpg-node-body" }, [
            h("p", { class: "mrpg-node-title", text: ch.title }),
            h("p", { class: "mrpg-node-sub", text: ch.topicLabel || (ch.enemy.name + " · " + (ch.standard || "")) }),
          ]),
          h("span", { class: "mrpg-node-flag", "aria-hidden": "true", text: cleared ? "✅" : locked ? "🔒" : "▶️" }),
        ]
      );
    });

    // Boss node
    var bossReady = allChaptersCleared();
    if (UNIT.boss) {
      nodes.push(
        h(
          "button",
          {
            class: "mrpg-node" + (GAME.bossDone ? " cleared" : bossReady ? " current" : ""),
            disabled: bossReady ? false : true,
            "aria-label": "Boss: " + UNIT.boss.name + (GAME.bossDone ? " (defeated)" : bossReady ? " (ready)" : " (locked)"),
            onclick: bossReady ? function () { startBoss(); } : null,
          },
          [
            h("span", { class: "mrpg-node-emoji", "aria-hidden": "true", text: UNIT.boss.emoji || "🐉" }),
            h("span", { class: "mrpg-node-body" }, [
              h("p", { class: "mrpg-node-title", text: "BOSS · " + UNIT.boss.name }),
              h("p", { class: "mrpg-node-sub", text: UNIT.boss.subtitle || "The realm's final challenge" }),
            ]),
            h("span", { class: "mrpg-node-flag", "aria-hidden": "true", text: GAME.bossDone ? "👑" : bossReady ? "🔥" : "🔒" }),
          ]
        )
      );
    }

    stage([
      statBar(),
      h("p", { class: "mrpg-kicker", text: UNIT.title + " · " + UNIT.realm }),
      h("h1", { text: "World Map" }),
      h("p", { text: GAME.done ? "You cleared this realm — replay any battle to keep your skills sharp." : "Choose your next battle. Defeat each foe to unlock the path forward." }),
      h("div", { class: "mrpg-map" }, nodes),
      backLink(),
    ]);
  }

  function statBar() {
    var hero = GAME.hero;
    return h("div", { class: "mrpg-statbar", role: "status" }, [
      h("span", { class: "mrpg-stat", text: "🛡️ Lv " + hero.level }),
      h("span", { class: "mrpg-stat", html: "❤️ " + hero.hp + "/" + hero.maxHp + " HP" }),
      h("span", { class: "mrpg-stat mrpg-xp-chip", text: "✨ " + hero.xp + "/" + hero.xpNext + " XP" }),
      h("span", { class: "mrpg-stat", text: "🪙 " + hero.gold }),
    ]);
  }

  /* ---- battle setup ----------------------------------------------------- */
  function startChapter(ch, replay) {
    // Chapter intro scene, then the fight.
    BATTLE = null;
    stage([
      h("p", { class: "mrpg-kicker", text: ch.title }),
      h("span", { class: "mrpg-hero-emoji", "aria-hidden": "true", text: ch.enemy.emoji || "👾" }),
      h("h1", { text: "A wild " + ch.enemy.name + " appears!" }),
      ch.scene ? h("div", { class: "mrpg-scene", text: ch.scene }) : null,
      h("p", { text: "Solve problems to attack. A wrong answer lets it strike back — you can ask the Sage for a hint any time." }),
      h("div", { class: "mrpg-actions" }, [
        h("button", { class: "mrpg-btn", onclick: function () { beginBattle(ch, false); } }, ["Fight! ⚔️"]),
        h("button", { class: "mrpg-btn ghost", onclick: showMap }, ["Retreat"]),
      ]),
    ]);
  }

  function startBoss() {
    var boss = UNIT.boss;
    stage([
      h("p", { class: "mrpg-kicker", text: "FINAL BATTLE" }),
      h("span", { class: "mrpg-hero-emoji", "aria-hidden": "true", text: boss.emoji || "🐉" }),
      h("h1", { text: boss.name }),
      boss.scene ? h("div", { class: "mrpg-scene", text: boss.scene }) : null,
      h("p", { text: "The boss draws on everything you've learned in this realm. Stay calm and use your hints." }),
      h("div", { class: "mrpg-actions" }, [
        h("button", { class: "mrpg-btn", onclick: function () { beginBattle(boss, true); } }, ["Face the boss 🔥"]),
        h("button", { class: "mrpg-btn ghost", onclick: showMap }, ["Not yet"]),
      ]),
    ]);
  }

  function beginBattle(node, isBoss) {
    // Refill hero HP at the start of each battle (fair retries).
    GAME.hero.hp = GAME.hero.maxHp;
    var topics = (node.topics && node.topics.length ? node.topics : ["gcf"]).filter(function (t) {
      return P.has(t);
    });
    if (!topics.length) topics = ["gcf"];
    var hitsToWin = node.hitsToWin || (isBoss ? 8 : 5);
    var enemyMax = 100;
    BATTLE = {
      node: node,
      isBoss: isBoss,
      topics: topics,
      enemyMax: enemyMax,
      enemyHp: enemyMax,
      dmg: Math.ceil(enemyMax / hitsToWin),
      enemyDmg: Math.ceil(GAME.hero.maxHp / (isBoss ? 6 : 5)),
      streak: 0,
      correct: 0,
      asked: 0,
      hintsUsed: 0,
      problem: null,
      answered: false,
    };
    nextProblem();
  }

  function nextProblem() {
    var t = BATTLE.topics[BATTLE.asked % BATTLE.topics.length];
    // Vary topic order a little after the first pass.
    if (BATTLE.asked >= BATTLE.topics.length) {
      t = BATTLE.topics[Math.floor(Math.random() * BATTLE.topics.length)];
    }
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
      h("div", { class: hpBarClass(frac) }, [
        h("span", { style: "width:" + Math.max(0, Math.round(frac * 100)) + "%" }),
      ]),
      h("p", { class: "mrpg-hp-label", text: Math.max(0, hp) + " / " + maxHp + " HP" }),
    ]);
  }

  function renderBattle() {
    var b = BATTLE;
    var p = b.problem;
    var hero = GAME.hero;

    var choiceBtns = p.choices.map(function (c, i) {
      return h("button", {
        class: "mrpg-choice",
        type: "button",
        "data-i": i,
        onclick: function () { onChoice(i); },
      }, [c]);
    });

    var log = h("p", { class: "mrpg-log", "aria-live": "polite" }, [
      b.isBoss ? "The boss glares. Make your move." : "Choose the correct answer to attack!",
    ]);

    var sage = h("div", { class: "mrpg-sage", hidden: true }, [
      h("p", { class: "mrpg-sage-title" }, ["🦉 The Sage says:"]),
      h("p", { class: "mrpg-sage-body" }, [""]),
    ]);

    var heroBox = fighter(UNIT.hero || "🧑‍🎓", "You", hero.hp, hero.maxHp, "hero");
    var enemyBox = fighter(b.node.emoji || "👾", b.node.name || b.node.title, b.enemyHp, b.enemyMax, "enemy");

    stage([
      statBar(),
      h("div", { class: "mrpg-combatants" }, [
        heroBox,
        h("div", { class: "mrpg-vs", "aria-hidden": "true", text: "VS" }),
        enemyBox,
      ]),
      h("div", { class: "mrpg-question" }, [
        h("p", { class: "mrpg-q-standard", text: (p.topic || "") + (p.standard ? " · " + p.standard : "") }),
        h("p", { class: "mrpg-q-text", tabindex: "-1", text: p.prompt }),
        h("div", { class: "mrpg-choices" }, choiceBtns),
      ]),
      h("div", { class: "mrpg-actions" }, [
        h("button", {
          class: "mrpg-btn ghost small",
          type: "button",
          onclick: function () { onHint(sage); },
        }, ["🦉 Ask the Sage for a hint"]),
        h("button", { class: "mrpg-btn ghost small", type: "button", onclick: showMap }, ["Flee"]),
      ]),
      sage,
      log,
    ]);

    // Store live refs for the handlers.
    b._els = {
      log: log,
      sage: sage,
      choices: choiceBtns,
      heroBox: heroBox,
      enemyBox: enemyBox,
      qtext: MOUNT.querySelector(".mrpg-q-text"),
    };
    // Focus the question for screen-reader users.
    if (b._els.qtext) { try { b._els.qtext.focus(); } catch (e) {} }
  }

  function animate(el, cls) {
    if (!el || reduceMotion()) return;
    el.classList.remove(cls);
    // reflow to restart animation
    void el.offsetWidth;
    el.classList.add(cls);
  }

  function setLog(node, parts) {
    if (!node) return;
    clear(node);
    (parts || []).forEach(function (p) {
      if (typeof p === "string") node.appendChild(document.createTextNode(p));
      else node.appendChild(p);
    });
  }

  function onHint(sageEl) {
    var b = BATTLE;
    if (!b || b.answered) return;
    b.hintsUsed++;
    sageEl.hidden = false;
    var body = sageEl.querySelector(".mrpg-sage-body");
    body.className = "mrpg-sage-body thinking";
    body.textContent = "The Sage is thinking…";
    askSage(b.problem, function (text) {
      if (!BATTLE || BATTLE !== b) return;
      body.className = "mrpg-sage-body";
      body.textContent = text;
    });
  }

  function onChoice(i) {
    var b = BATTLE;
    if (!b || b.answered) return;
    b.answered = true;
    b.asked++;
    var p = b.problem;
    var correct = i === p.answer;
    var els = b._els;
    // lock choices, reveal state
    els.choices.forEach(function (btn, idx) {
      btn.disabled = true;
      if (idx === p.answer) btn.classList.add("correct");
      if (idx === i && !correct) btn.classList.add("wrong");
    });

    if (correct) {
      b.correct++;
      b.streak++;
      var crit = b.streak >= 3 && !reduceMotion() ? 1.5 : 1;
      var dmg = Math.round(b.dmg * (crit > 1 ? 1.5 : 1));
      b.enemyHp = Math.max(0, b.enemyHp - dmg);
      animate(els.enemyBox, "mrpg-anim-hit");
      updateBar(els.enemyBox, b.enemyHp, b.enemyMax);
      setLog(els.log, [
        h("span", {}, [crit > 1 ? "💥 Critical hit! " : "⚔️ Hit! "]),
        h("span", { class: "dmg", text: "−" + dmg + " to " + (b.node.name || "the foe") }),
        b.streak >= 3 ? h("span", { text: "  (streak ×" + b.streak + "!)" }) : "",
      ]);
      if (b.enemyHp <= 0) {
        setTimeout(winBattle, 650);
      } else {
        setTimeout(nextProblem, 850);
      }
    } else {
      b.streak = 0;
      GAME.hero.hp = Math.max(0, GAME.hero.hp - b.enemyDmg);
      animate(els.heroBox, "mrpg-anim-hit");
      updateBar(els.heroBox, GAME.hero.hp, GAME.hero.maxHp);
      saveGame();
      setLog(els.log, [
        h("span", { class: "dmg", text: "✖ Not quite. " + (b.node.name || "The foe") + " strikes for −" + b.enemyDmg + ". " }),
        h("span", { text: p.explain || "" }),
      ]);
      // Show a continue button (don't auto-advance on a miss — give reading time).
      if (GAME.hero.hp <= 0) {
        setTimeout(loseBattle, 700);
      } else {
        var cont = h("div", { class: "mrpg-actions" }, [
          h("button", { class: "mrpg-btn", onclick: nextProblem }, ["Next problem →"]),
        ]);
        els.log.parentNode.insertBefore(cont, els.log.nextSibling);
      }
    }
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

  /* ---- battle outcomes -------------------------------------------------- */
  function grantXp(amount) {
    var hero = GAME.hero;
    hero.xp += amount;
    var leveled = 0;
    while (hero.xp >= hero.xpNext) {
      hero.xp -= hero.xpNext;
      hero.level++;
      hero.xpNext = hero.level * 100;
      hero.maxHp += 10;
      hero.hp = hero.maxHp;
      leveled++;
    }
    return leveled;
  }

  function winBattle() {
    var b = BATTLE;
    var acc = b.asked ? Math.round((b.correct / b.asked) * 100) : 100;
    var baseXp = b.isBoss ? 120 : 60;
    var bonus = Math.round(baseXp * (acc / 100)) + b.correct * 5;
    var xp = baseXp + bonus;
    var gold = (b.isBoss ? 50 : 20) + b.correct * 3;
    GAME.hero.gold += gold;
    var leveled = grantXp(xp);

    if (b.isBoss) {
      GAME.bossDone = true;
      GAME.done = true;
    } else {
      GAME.cleared[b.node.id] = true;
    }
    saveGame();

    var scene = b.isBoss ? (UNIT.boss.victory || "") : (b.node.victory || "");
    BATTLE = null;

    stage([
      h("div", { class: "mrpg-result" }, [
        h("span", { class: "big-emoji", "aria-hidden": "true", text: b.isBoss ? "👑" : "🎉" }),
        h("h1", { text: b.isBoss ? "The realm is saved!" : "Victory!" }),
        scene ? h("div", { class: "mrpg-scene", text: scene }) : null,
        h("p", { text: "Accuracy: " + acc + "%" + (b.hintsUsed ? "  ·  Hints used: " + b.hintsUsed : "") }),
        h("div", { class: "mrpg-reward" }, [
          h("span", { text: "✨ +" + xp + " XP" }),
          h("span", { text: "🪙 +" + gold }),
          leveled ? h("span", { text: "⬆️ Level up! Now Lv " + GAME.hero.level }) : null,
        ]),
        h("div", { class: "mrpg-actions", style: "justify-content:center" }, [
          b.isBoss
            ? h("button", { class: "mrpg-btn", onclick: showComplete }, ["See your results 🏆"])
            : h("button", { class: "mrpg-btn", onclick: showMap }, ["Continue the quest →"]),
        ]),
      ]),
    ]);
  }

  function loseBattle() {
    var b = BATTLE;
    var node = b.node;
    var isBoss = b.isBoss;
    BATTLE = null;
    GAME.hero.hp = GAME.hero.maxHp; // heal for the retry
    saveGame();
    stage([
      h("div", { class: "mrpg-result" }, [
        h("span", { class: "big-emoji", "aria-hidden": "true", text: "💫" }),
        h("h1", { text: "You were knocked out!" }),
        h("p", { text: "No worries — every hero regroups. Use the Sage's hints and try again. Your progress on other battles is safe." }),
        h("div", { class: "mrpg-actions", style: "justify-content:center" }, [
          h("button", { class: "mrpg-btn", onclick: function () { isBoss ? startBoss() : startChapter(node, true); } }, ["Try again 🔁"]),
          h("button", { class: "mrpg-btn ghost", onclick: showMap }, ["World map"]),
        ]),
      ]),
    ]);
  }

  /* ---- screen: realm complete ------------------------------------------- */
  function showComplete() {
    BATTLE = null;
    var hero = GAME.hero;
    stage([
      h("div", { class: "mrpg-result" }, [
        h("span", { class: "big-emoji", "aria-hidden": "true", text: "🏆" }),
        h("p", { class: "mrpg-kicker", text: UNIT.title + " · " + UNIT.realm }),
        h("h1", { text: "Realm Cleared!" }),
        UNIT.outro ? h("div", { class: "mrpg-scene", text: UNIT.outro }) : null,
        h("p", { text: "You mastered the challenges of " + (UNIT.standard || "this unit") + "." }),
        h("div", { class: "mrpg-reward" }, [
          h("span", { text: "🛡️ Level " + hero.level }),
          h("span", { text: "🪙 " + hero.gold + " gold" }),
        ]),
        h("div", { class: "mrpg-actions", style: "justify-content:center" }, [
          h("button", { class: "mrpg-btn", onclick: showMap }, ["Back to map"]),
          h("a", { class: "mrpg-btn ghost", href: "/math-rpg/", role: "button" }, ["Choose another realm →"]),
        ]),
      ]),
    ]);
  }

  /* ---- boot ------------------------------------------------------------- */
  function render() {
    if (!UNIT || !MOUNT) return;
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
    // Accent theming from the unit config.
    if (UNIT.accent) MOUNT.style.setProperty("--accent", UNIT.accent);
    if (!P) {
      MOUNT.appendChild(h("p", { text: "Problem engine failed to load. Please refresh." }));
      return;
    }
    GAME = loadGame();
    wireSaveResume();
    render();
  }

  window.NumberRealm = { start: start, _debug: function () { return { UNIT: UNIT, GAME: GAME, BATTLE: BATTLE }; } };
})();
