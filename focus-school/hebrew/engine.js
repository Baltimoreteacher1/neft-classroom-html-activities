/* Nightly Hebrew — shared engine (core + page shell).
 *
 * Every inning page is the same long practice session; only the DATA
 * (data.js + units.js) and the GAME (games/unit-N.js) change. Keeping the
 * shell here means the teaching moves — "letter first, then vowel",
 * hide-the-answer-until-you-try, always review what came before — are defined
 * once and can't drift between pages.
 *
 * The activities themselves live in activities/*.js. Each one calls
 * HEB.registerActivity({ id, title, how, mount }) and the shell decides where
 * it lands, whether it counts toward the payout, and how it is numbered — so
 * a new activity is one file, not an edit to nine pages.
 *
 * Page contract:
 *   <body data-unit="N">
 *     → data.js → units.js → engine.js → activities/*.js → games/unit-N.js
 *     → HEB.boot()
 */
(function (global) {
  "use strict";

  const D = global.HEB_DATA;
  const { LETTERS, VOWELS, UNITS, CONFUSABLES } = D;

  // ------------------------------------------------------------- utilities
  const $ = (sel, root) => (root || document).querySelector(sel);
  const esc = (s) =>
    String(s).replace(
      /[&<>"']/g,
      (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c],
    );
  const randInt = (n) => Math.floor(Math.random() * n);
  const pick = (arr) => arr[randInt(arr.length)];
  const shuffle = (arr) => {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = randInt(i + 1);
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };
  // Sample without replacement; if `n` exceeds the pool, cycle it instead of
  // returning a short list (drills should always be the length we promised).
  const sample = (arr, n) => {
    if (!arr.length) return [];
    const out = [];
    let bag = shuffle(arr);
    while (out.length < n) {
      if (!bag.length) bag = shuffle(arr);
      out.push(bag.pop());
    }
    return out;
  };
  const el = (html) => {
    const t = document.createElement("template");
    t.innerHTML = html.trim();
    return t.content.firstElementChild;
  };
  const todayKey = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
      d.getDate(),
    ).padStart(2, "0")}`;
  };

  // --------------------------------------------------------------- syllable
  // The single source of truth for "what does this letter + this vowel say".
  // Concatenation is literally what a reader does: letter first, vowel second.
  function syl(letterCh, vowelKey) {
    const L = LETTERS[letterCh];
    const V = VOWELS[vowelKey];
    if (!L || !V) return null;
    const c = L.c;
    const v = V.v;
    const tr = v === "'" ? (c || "") + "'" : (c || "") + v;
    return { heb: letterCh + V.ch, tr, c, v, letter: letterCh, vowel: vowelKey, L, V };
  }
  // Coloured transliteration: consonant part vs vowel part, so the split is
  // visible every single time instead of being a thing an adult says once.
  const trHtml = (s) =>
    `<span class="tr">${s.c ? `<span class="c">${esc(s.c)}</span>` : ""}<span class="v">${esc(
      s.v === "'" ? "'" : s.v,
    )}</span></span>`;

  // ----------------------------------------------------------- word pieces
  // Break a written word into the pieces a reader actually decodes: one base
  // letter plus whatever marks are stuck to it. This is NOT linguistic
  // syllabification — a silent sheva really closes the syllable before it —
  // and the UI never calls it that. It is "letter + its mark", which is the
  // exact unit the blending machine teaches, so the two agree.
  const DAGESH = "ּ";
  const SHIN_DOT = "ׁ";
  const SIN_DOT = "ׂ";
  const isVowelMark = (ch) => (ch >= "ְ" && ch <= "ֻ") || ch === "ׇ" || ch === "ֺ";
  const isMark = (ch) =>
    isVowelMark(ch) ||
    ch === DAGESH ||
    ch === SHIN_DOT ||
    ch === SIN_DOT ||
    ch === "ֽ" ||
    (ch >= "֑" && ch <= "֯");
  const isBase = (ch) => ch >= "א" && ch <= "ת";
  // vowel mark character → vowel key (single-character forms only; the malei
  // forms are recognised by the mater letter that follows).
  const MARK_TO_VOWEL = {};
  for (const [k, v] of Object.entries(VOWELS)) {
    if (v.ch.length === 1) MARK_TO_VOWEL[v.ch] = k;
  }
  MARK_TO_VOWEL["ֺ"] = "cholam"; // cholam haser for vav
  MARK_TO_VOWEL["ׇ"] = "kamatz"; // kamatz katan reads as an oh/ah kamatz here

  function pieces(word) {
    const s = String(word || "");
    const out = [];
    let i = 0;
    while (i < s.length) {
      const ch = s[i];
      if (!isBase(ch)) {
        // Spaces and punctuation separate words inside a line.
        if (!/\s/.test(ch) && !isMark(ch)) out.push({ sep: true, heb: ch });
        else if (/\s/.test(ch)) out.push({ sep: true, heb: " " });
        i++;
        continue;
      }
      let base = ch;
      let vowelKey = null;
      let dagesh = false;
      i++;
      while (i < s.length && isMark(s[i])) {
        const m = s[i];
        if (m === DAGESH) dagesh = true;
        else if (m === SHIN_DOT || m === SIN_DOT) base += m;
        else if (isVowelMark(m) && MARK_TO_VOWEL[m]) vowelKey = MARK_TO_VOWEL[m];
        i++;
      }
      // A dagesh only changes the SOUND for the bet/kaf/pey family (and the
      // primer's dotted tav). Everywhere else it just means "press the
      // letter", so it must not send the lookup off a cliff.
      let key = base;
      if (dagesh && LETTERS[base + DAGESH]) key = base + DAGESH;
      else if (!LETTERS[key] && LETTERS[base]) key = base;

      const prev = out.length ? out[out.length - 1] : null;
      const prevOpen = prev && !prev.sep && !prev.vowelKey;
      // Mater lectionis: a ו or י that is really finishing the sound of the
      // letter BEFORE it rather than starting a sound of its own. Merge it in
      // — "toh", not "t-oh"; "kee", not "kee-y".
      //   וֹ  = vav carrying a cholam   → oh
      //   וּ  = vav carrying a dagesh    → oo
      //   ִי / ֵי = bare yud after chirik/tzere → still ee / ay
      const vavAsOh = base === "ו" && vowelKey === "cholam";
      const vavAsOo = base === "ו" && !vowelKey && dagesh;
      if ((vavAsOh || vavAsOo) && prevOpen) {
        prev.vowelKey = vavAsOo ? "shuruk" : "cholamMalei";
        prev.heb += vavAsOo ? "ו" + DAGESH : "וֹ";
        prev.mater = true;
        recompute(prev);
        continue;
      }
      if (base === "י" && !vowelKey && !dagesh && prev && !prev.sep) {
        if (prev.vowelKey === "chirik" || prev.vowelKey === "tzere") {
          prev.vowelKey = prev.vowelKey === "chirik" ? "chirikMalei" : "tzereYud";
          prev.heb += "י";
          prev.mater = true;
          recompute(prev);
          continue;
        }
        // A bare Yud landing on an ah turns the pair into "ai" — דַי is "dai",
        // חַי is "chai". Reading it as two beats ("dah-y") is the mistake this
        // merge exists to prevent. But a Yud that is about to be handed a Vav
        // of its own (הַיוֹם) is a plain consonant, not half of a diphthong.
        const vavNext = s[i] === "ו" && (s[i + 1] === "ֹ" || s[i + 1] === DAGESH);
        if (!vavNext && (prev.vowelKey === "patach" || prev.vowelKey === "kamatz")) {
          prev.heb += "י";
          prev.mater = true;
          prev.diphthong = true;
          recompute(prev);
          continue;
        }
      }

      const p = { key, vowelKey, dagesh };
      if ((vavAsOh || vavAsOo) && !prevOpen) {
        // A shuruk or cholam-malei with nothing to lean on (start of a word,
        // or after an already-closed sound) is a pure vowel — "oo", not "voo".
        p.vowelKey = vavAsOo ? "shuruk" : "cholamMalei";
        p.vowelOnly = true;
        p.heb = vavAsOo ? "ו" + DAGESH : "וֹ";
      } else {
        p.heb = base + (dagesh ? DAGESH : "") + (vowelKey ? VOWELS[vowelKey].ch : "");
      }
      recompute(p);
      out.push(p);
    }
    // Word-final rules. They only make sense once a word is known to have
    // ended, so they run as a second pass over each word in the line.
    let start = 0;
    for (let k = 0; k <= out.length; k++) {
      if (k === out.length || out[k].sep) {
        finishWord(out.slice(start, k));
        start = k + 1;
      }
    }
    return out;
  }

  // Three things only happen at the END of a word, and getting them wrong is
  // how a reader ends up saying "chah-yah-h" or "sah-may-chah".
  function finishWord(seg) {
    if (seg.length < 2) return;
    const last = seg[seg.length - 1];
    if (last.vowelOnly) return;
    const c = last.L ? last.L.c : "";
    if (!last.vowelKey && (last.key === "ה" || last.key === "א")) {
      last.silent = true;
      last.c = "";
      last.tr = "(silent)";
      last.hint = "Silent at the end of a word — it just marks the ending.";
      return;
    }
    if (last.vowelKey === "patach" && (last.key === "ח" || last.key === "ע")) {
      last.sneaky = true;
      last.tr = "a" + c;
      last.hint = "The sneaky patach: say the ah BEFORE the letter, not after it.";
      return;
    }
    if (last.vowelKey === "sheva") {
      last.tr = c;
      last.hint = "A Sheva at the very end of a word is silent.";
    }
  }

  function recompute(p) {
    const L = p.vowelOnly ? null : LETTERS[p.key];
    const V = p.vowelKey ? VOWELS[p.vowelKey] : null;
    p.L = L;
    p.V = V;
    p.c = p.vowelOnly ? "" : L ? L.c : "";
    p.v = V ? V.v : "";
    if (p.vowelOnly) {
      p.tr = V ? V.v : "";
      return;
    }
    if (!L) {
      p.tr = "";
      return;
    }
    if (!V) p.tr = L.c || "(silent)";
    else if (p.diphthong) p.tr = (L.c || "") + "ai";
    else if (V.v === "'") p.tr = (L.c || "") + "'";
    else p.tr = (L.c || "") + V.v;
    if (p.diphthong) p.v = "ai";
  }

  // The last piece of a word being חַ / עַ / הַ is the "sneaky patach": the ah
  // is said BEFORE the letter. Worth flagging wherever a word is broken down.
  function sneakyPatach(ps) {
    const real = ps.filter((p) => !p.sep);
    const last = real[real.length - 1];
    if (!last || last.vowelKey !== "patach") return false;
    return ["ח", "ע", "ה"].includes(last.key);
  }

  // ---------------------------------------------------------------- speech
  // Best effort: a real Hebrew voice if the device has one, otherwise speak
  // the sound-spelling slowly. The WRITTEN sound-spelling is always on screen,
  // so audio is a bonus channel and never the only one.
  let voicesReady = false;
  let hebVoice = null;
  let warnedNoVoice = false;
  function loadVoices() {
    if (!("speechSynthesis" in global)) return;
    const list = global.speechSynthesis.getVoices() || [];
    if (!list.length) return;
    voicesReady = true;
    hebVoice = list.find((v) => /^he\b|^iw\b/i.test(v.lang)) || null;
  }
  if ("speechSynthesis" in global) {
    loadVoices();
    global.speechSynthesis.addEventListener?.("voiceschanged", loadVoices);
  }
  function say(heb, tr) {
    if (!("speechSynthesis" in global)) return;
    if (!voicesReady) loadVoices();
    try {
      global.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance();
      if (hebVoice && heb) {
        u.text = heb;
        u.voice = hebVoice;
        u.lang = hebVoice.lang;
        u.rate = 0.75;
      } else {
        // No Hebrew voice — read the sound spelling, hyphens as beats.
        u.text = String(tr || heb || "").replace(/-/g, " — ");
        u.lang = "en-US";
        u.rate = 0.7;
        if (!warnedNoVoice) {
          warnedNoVoice = true;
          toast("No Hebrew voice on this device — use the sound spelling on screen.");
        }
      }
      global.speechSynthesis.speak(u);
    } catch {
      /* speech is a bonus; never let it break an activity */
    }
  }

  // ----------------------------------------------------------------- toast
  let toastEl = null;
  let toastTimer = 0;
  function toast(msg) {
    if (!toastEl) {
      toastEl = el('<div class="toast" role="status" aria-live="polite"></div>');
      document.body.appendChild(toastEl);
    }
    toastEl.textContent = msg;
    toastEl.classList.add("on");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove("on"), 2600);
  }

  // -------------------------------------------------------------- the plan
  // Order and grouping of the whole session. `req` activities gate the $0.20;
  // the rest are marked "Extra Innings" — real practice, freely skippable, so
  // a long page never becomes a hostage situation on a school night.
  const PLAN = [
    {
      key: "warm",
      name: "Warm-Up",
      blurb: "Loosen the arm on everything you already own.",
      acts: ["warmup", "rollcall"],
    },
    {
      key: "learn",
      name: "Tonight's New Material",
      blurb: "Meet it, look at it closely, and learn the rule behind it.",
      acts: ["letters", "lookalike", "rules", "vowelradar"],
    },
    {
      key: "drill",
      name: "Drill It In",
      blurb: "Reps. This is the part that turns thinking into reading.",
      acts: ["blender", "reverse", "batting", "ladder", "minimal"],
    },
    {
      key: "words",
      name: "Real Words",
      blurb: "Stop reading pieces. Start reading words.",
      acts: ["workshop", "builder", "meaning"],
    },
    { key: "play", name: "Tonight's Game", blurb: "Earned it.", acts: ["game"] },
    {
      key: "read",
      name: "Read For Real",
      blurb: "Whole lines, out loud, the way you would in shul.",
      acts: ["sentences", "closer"],
    },
    {
      key: "prove",
      name: "Prove It",
      blurb: "Last at-bat. Show that tonight stuck.",
      acts: ["spot", "final"],
    },
  ];

  // The payout gate. Every id here must be registered by an activity module.
  const ACT_IDS = [
    "warmup",
    "letters",
    "lookalike",
    "rules",
    "vowelradar",
    "blender",
    "batting",
    "workshop",
    "game",
    "sentences",
    "closer",
    "final",
  ];
  const BONUS_IDS = ["rollcall", "reverse", "ladder", "minimal", "builder", "meaning", "spot"];

  // -------------------------------------------------------------- progress
  const PROGRESS_KEY = "nightly-hebrew:progress";
  const EARN_KEY = "focus-school:hebrew-earnings";

  function readProgress() {
    try {
      const p = JSON.parse(localStorage.getItem(PROGRESS_KEY) || "{}");
      return p && typeof p === "object" ? p : {};
    } catch {
      return {};
    }
  }
  function writeProgress(p) {
    try {
      localStorage.setItem(PROGRESS_KEY, JSON.stringify(p));
    } catch {
      /* private mode — progress just won't persist */
    }
  }
  function unitProgress(id) {
    const p = readProgress();
    const u = p["u" + id];
    return u && typeof u === "object" ? u : { acts: {}, finishedOn: "", finishes: 0 };
  }
  function saveUnitProgress(id, up) {
    const p = readProgress();
    p["u" + id] = up;
    writeProgress(p);
  }

  // --------------------------------------------------------- earnings queue
  // The planner app owns the allowance ledger. These static pages must never
  // write into `focus-school:state` directly (the app would clobber it and the
  // sync merge would fight over it), so a completed inning drops a claim in an
  // outbox and the app drains it on load / focus / storage event. The id is
  // deterministic — unit + calendar day — so a double-claim is impossible even
  // across devices.
  function queueEarning(unit, dayKey) {
    let q = [];
    try {
      q = JSON.parse(localStorage.getItem(EARN_KEY) || "[]");
      if (!Array.isArray(q)) q = [];
    } catch {
      q = [];
    }
    const id = `heb-u${unit.id}-${dayKey}`;
    if (q.some((e) => e && e.id === id)) return false;
    q.push({
      id,
      unit: unit.id,
      label: `Nightly Hebrew — ${unit.inning}: ${unit.title}`,
      ts: new Date().toISOString(),
      day: dayKey,
    });
    // Keep the outbox tiny; the app drains it constantly.
    try {
      localStorage.setItem(EARN_KEY, JSON.stringify(q.slice(-60)));
    } catch {
      return false;
    }
    return true;
  }
  function alreadyClaimedToday(unitId, dayKey) {
    try {
      const q = JSON.parse(localStorage.getItem(EARN_KEY) || "[]");
      if (Array.isArray(q) && q.some((e) => e && e.id === `heb-u${unitId}-${dayKey}`)) return true;
    } catch {
      /* fall through */
    }
    // The app removes drained entries, so also trust our own local record.
    const up = unitProgress(unitId);
    return up.paidOn === dayKey;
  }

  // =========================================================== the page shell
  let unit = null;
  let progress = null;
  let gameSpec = null;
  const registry = new Map();

  const registerGame = (spec) => {
    gameSpec = spec;
  };
  const registerActivity = (spec) => {
    if (!spec || !spec.id) return;
    registry.set(spec.id, spec);
  };

  function done(actId) {
    if (progress.acts[actId]) return;
    progress.acts[actId] = true;
    saveUnitProgress(unit.id, progress);
    const card = document.getElementById("act-" + actId);
    if (card) {
      card.classList.add("finished");
      const num = $(".num", card);
      if (num) {
        num.classList.add("done");
        num.textContent = "✓";
      }
      if (!$(".done-flag", card)) {
        $("header", card).appendChild(el('<span class="done-flag">✓ Done</span>'));
      }
    }
    const step = document.getElementById("toc-" + actId);
    if (step) step.classList.add("done");
    refreshScore();
  }

  function refreshScore() {
    const req = ACT_IDS.filter((k) => progress.acts[k]).length;
    const bonus = BONUS_IDS.filter((k) => progress.acts[k]).length;
    const bug = document.getElementById("scorebug");
    if (bug) bug.textContent = `${req}/${ACT_IDS.length}${bonus ? ` +${bonus}` : ""}`;
    const bar = document.getElementById("topbar-bar");
    if (bar) bar.style.width = `${Math.round((req / ACT_IDS.length) * 100)}%`;
    const tally = document.getElementById("toc-tally");
    if (tally) {
      tally.textContent =
        `${req} of ${ACT_IDS.length} done` +
        (bonus ? ` · ${bonus} of ${BONUS_IDS.length} extra innings` : "");
    }
    renderPayout(req === ACT_IDS.length);
  }

  // Standard activity card frame. Everything a unit page shows goes through
  // here so numbering, done-state and scroll anchors stay consistent.
  function actCard(id, num, title, how, bonus) {
    const isDone = !!progress.acts[id];
    const card = el(`<section class="act${isDone ? " finished" : ""}${
      bonus ? " bonus" : ""
    }" id="act-${id}">
      <header>
        <div class="num${isDone ? " done" : ""}">${isDone ? "✓" : num}</div>
        <div>
          <h3>${title}${bonus ? ' <span class="tag">Extra Innings</span>' : ""}</h3>
          <p class="how">${how}</p>
        </div>
        ${isDone ? '<span class="done-flag">✓ Done</span>' : ""}
      </header>
      <div class="act-body"></div>
    </section>`);
    return card;
  }

  const fb = (node, kind, msg) => {
    node.className = "feedback " + kind;
    node.innerHTML = msg;
  };

  // ---------------------------------------------------------------- the game
  // The one activity the shell owns directly, because it is the hand-off point
  // to the per-inning bespoke module.
  registerActivity({
    id: "game",
    title: () => "🎮 " + (gameSpec ? gameSpec.name : "Tonight's Game"),
    how: () => (gameSpec ? gameSpec.blurb || gameSpec.goal : "Tonight's game."),
    mount(root, api) {
      const spec = gameSpec || {
        name: "Coming up",
        goal: "This inning's game is still in the bullpen.",
        mount(r, a) {
          r.innerHTML = '<p class="note">No game loaded for this inning.</p>';
          a.win();
        },
      };
      root.innerHTML = `<div class="game">
        <h4>⚾ ${esc(spec.name)}</h4>
        <p class="goal">${esc(spec.goal)}</p>
        <div class="hud" id="gm-hud"></div>
        <div id="gm-root"></div>
        <div class="feedback" id="gm-fb"></div>
      </div>`;
      const gr = $("#gm-root", root);
      const hud = $("#gm-hud", root);
      const fbn = $("#gm-fb", root);
      let won = false;
      const gameApi = Object.assign({}, api, {
        setHud(html) {
          hud.innerHTML = html;
        },
        // Each game owns its own layout CSS instead of everyone editing one
        // shared stylesheet — nine games, nine independent files, no
        // collisions.
        style(css) {
          const sid = "gm-style-" + (unit.id || 0);
          if (document.getElementById(sid)) return;
          const s = document.createElement("style");
          s.id = sid;
          s.textContent = css;
          document.head.appendChild(s);
        },
        feedback(kind, msg) {
          fb(fbn, kind, msg);
        },
        clearFeedback() {
          fbn.className = "feedback";
          fbn.innerHTML = "";
        },
        win(msg) {
          if (won) return;
          won = true;
          fb(fbn, "ok", msg || "🏆 Game over — you won it. Nice reading.");
          api.done();
        },
      });
      // A game that throws must not take the whole page down with it.
      try {
        spec.mount(gr, gameApi);
      } catch (err) {
        gr.innerHTML =
          '<p class="note">This game hit a snag. Everything else on the page still works — tap below to skip it.</p><button class="btn sm" type="button" id="gm-skip">Skip this game</button>';
        $("#gm-skip", gr)?.addEventListener("click", () => gameApi.win("Game skipped."));
        if (global.console) console.error("[nightly-hebrew] game failed to mount", err);
      }
    },
  });

  // --------------------------------------------------------------- payout
  function renderPayout(unlocked) {
    const host = document.getElementById("payout");
    if (!host) return;
    const day = todayKey();
    const paid = alreadyClaimedToday(unit.id, day);
    const bonus = BONUS_IDS.filter((k) => progress.acts[k]).length;
    const perfect = bonus === BONUS_IDS.length;
    if (paid) {
      host.className = "payout paid";
      host.innerHTML = `<div class="amount">$0.20</div>
        <h3>Paid — nice work tonight ⚾</h3>
        <p>It's on its way to your <b>Allowance</b> page. Open Focus School and it'll be sitting in your balance.${
          perfect ? " And you cleared every extra inning — perfect game. 🏆" : ""
        }</p>
        <a class="btn sm" href="/">Open Focus School →</a>`;
      return;
    }
    if (!unlocked) {
      const n = ACT_IDS.filter((k) => progress.acts[k]).length;
      host.className = "payout";
      host.innerHTML = `<div class="amount" style="opacity:.45">$0.20</div>
        <h3>Finish the inning to get paid</h3>
        <p>${n} of ${ACT_IDS.length} main activities done. Extra Innings are optional — they don't hold up your pay.</p>
        <button class="btn block" type="button" disabled>🔒 Locked</button>`;
      return;
    }
    host.className = "payout";
    host.innerHTML = `<div class="amount">$0.20</div>
      <h3>Inning complete — collect your pay</h3>
      <p>All ${ACT_IDS.length} main activities done.${
        perfect ? " Every extra inning too — that's a perfect game. 🏆" : ""
      } Tap once and it syncs straight to your Allowance.</p>
      <button class="btn grass block" type="button" id="pay-btn">💰 Claim $0.20</button>`;
    $("#pay-btn", host).addEventListener("click", () => {
      const ok = queueEarning(unit, day);
      progress.paidOn = day;
      progress.finishedOn = day;
      progress.finishes = (progress.finishes || 0) + 1;
      saveUnitProgress(unit.id, progress);
      if (ok) toast("$0.20 added to your allowance 💰");
      else toast("Already claimed for tonight — come back tomorrow.");
      renderPayout(true);
    });
  }

  // -------------------------------------------------------- shared widgets
  // Nineteen activities would otherwise grow nineteen slightly different
  // multiple-choice widgets — and nineteen slightly different ideas about how
  // a wrong answer is handled. There is exactly one, here, and it always
  // tiers the hint (name the move → give one half → give the other half)
  // instead of printing the answer on the first miss.
  function quiz(host, opts) {
    const total = opts.total || 8;
    const wrap = el(`<div class="quiz">
      <div class="row quiz-top"><b class="qcount"></b><span class="spacer"></span><span class="note qscore"></span></div>
      <div class="qstage"></div>
      <div class="choices"></div>
      <div class="feedback"></div>
    </div>`);
    host.appendChild(wrap);
    const countEl = $(".qcount", wrap);
    const scoreEl = $(".qscore", wrap);
    const stage = $(".qstage", wrap);
    const choicesEl = $(".choices", wrap);
    const fbn = $(".feedback", wrap);
    let n = 0;
    let right = 0;
    let misses = 0;
    let cur = null;

    function next() {
      if (n >= total) {
        stage.innerHTML = `<div class="qdone">${right >= total - 2 ? "🏆" : "⚾"}</div>`;
        choicesEl.innerHTML = "";
        countEl.textContent = "Round complete";
        scoreEl.textContent = "";
        fb(
          fbn,
          right >= total - 2 ? "ok" : "tip",
          right >= total - 2
            ? `<b>${right} of ${total} clean.</b> ${opts.winNote || "You are reading, not guessing."}`
            : `<b>${right} of ${total} clean.</b> ${
                opts.tryNote || "Good reps — the misses are the ones worth another look."
              }`,
        );
        opts.onFinish?.(right, total);
        return;
      }
      n++;
      misses = 0;
      cur = opts.next(n - 1);
      if (!cur) {
        n = total;
        return next();
      }
      countEl.textContent = `${opts.unitWord || "Question"} ${n} of ${total}`;
      scoreEl.textContent = `${right} clean`;
      stage.innerHTML = cur.qHtml;
      fbn.className = "feedback";
      fbn.innerHTML = "";
      choicesEl.innerHTML = "";
      choicesEl.className = "choices" + (cur.wide ? " wide" : "");
      for (const c of shuffle(cur.choices.slice())) {
        const b = el(`<button class="choice" type="button">${c.html || esc(c.text || c)}</button>`);
        const text = c.text != null ? c.text : c;
        b.addEventListener("click", () => answer(b, text));
        choicesEl.appendChild(b);
      }
      if (cur.saySound) say(cur.sayHeb, cur.sayTr);
    }

    function answer(btn, text) {
      if (text === cur.answer) {
        btn.classList.add("ok");
        [...choicesEl.children].forEach((b) => (b.disabled = true));
        if (misses === 0) right++;
        opts.onAnswer?.(misses === 0, cur.meta);
        if (cur.sayHeb || cur.sayTr) say(cur.sayHeb, cur.sayTr);
        fb(fbn, "ok", cur.explain || "That's it.");
        setTimeout(next, cur.pause || 1000);
        return;
      }
      btn.classList.add("no");
      btn.disabled = true;
      misses++;
      const tiers = [cur.hint1, cur.hint2, cur.hint3].filter(Boolean);
      const msg = tiers[Math.min(misses, tiers.length) - 1] || cur.explain;
      fb(fbn, misses === 1 ? "no" : "tip", msg);
    }

    next();
    return wrap;
  }

  // A row of "read it, then tap to check yourself" tiles. The answer is hidden
  // until the reader commits, which is the whole difference between practice
  // and looking at a list of answers.
  function tileRow(items, opts) {
    const o = opts || {};
    const row = el('<div class="drill-row"></div>');
    let tapped = 0;
    items.forEach((it) => {
      const t = el(
        `<button class="tile" type="button"><span class="glyph${
          o.small ? " sm" : ""
        }">${it.heb}</span><span class="peek">?</span></button>`,
      );
      t.addEventListener("click", () => {
        if (!t.classList.contains("revealed")) {
          t.classList.add("revealed");
          $(".peek", t).innerHTML =
            it.trHtml || `<span class="tr"><span class="c">${esc(it.tr)}</span></span>`;
          tapped++;
          if (tapped === items.length) o.onAll?.();
        }
        say(it.heb, it.tr);
      });
      row.appendChild(t);
    });
    row.revealAll = () => row.querySelectorAll(".tile:not(.revealed)").forEach((t) => t.click());
    return row;
  }

  // --------------------------------------------------------- activity api
  // Everything an activity module is allowed to touch. Handing this out
  // explicitly (rather than letting modules reach into the shell) is what
  // keeps nineteen activities from quietly growing nineteen private contracts.
  function apiFor(id) {
    return {
      unit,
      LETTERS,
      VOWELS,
      UNITS,
      CONFUSABLES,
      syl,
      trHtml,
      pieces,
      sneakyPatach,
      say,
      toast,
      shuffle,
      sample,
      pick,
      randInt,
      el,
      esc,
      $,
      confusableGroups,
      vowelFamilies,
      allWords,
      quiz,
      tileRow,
      done: () => done(id),
      isDone: () => !!progress.acts[id],
      fb,
    };
  }

  // Confusable groups whose every member is already taught tonight — never
  // ask a reader to rule out a letter he has not met.
  function confusableGroups() {
    const known = new Set(unit.allLetters);
    return CONFUSABLES.filter((g) => g.chars.every((c) => known.has(c)));
  }
  // Vowel keys grouped by the sound they make, for "which ones say ah?".
  function vowelFamilies() {
    const out = {};
    for (const k of unit.vowelPool) {
      const f = VOWELS[k].family;
      (out[f] = out[f] || []).push(k);
    }
    return out;
  }
  // Everything readable tonight, de-duplicated, longest first — the pool the
  // word activities draw from.
  function allWords() {
    const seen = new Set();
    const out = [];
    for (const w of unit.words) {
      if (seen.has(w.heb)) continue;
      seen.add(w.heb);
      out.push(w);
    }
    return out;
  }

  // ----------------------------------------------------------------- boot
  function boot() {
    const id = Number(document.body.dataset.unit || 1);
    unit = UNITS.find((u) => u.id === id) || UNITS[0];
    progress = unitProgress(unit.id);
    // A new night = a fresh run. Progress from an earlier day is kept as a
    // "finished before" record but the activities reset so the practice
    // actually happens again (and so the $0.20 is earned, not re-collected).
    if (progress.day !== todayKey()) {
      progress = {
        day: todayKey(),
        acts: {},
        finishedOn: progress.finishedOn || "",
        finishes: progress.finishes || 0,
        paidOn: progress.paidOn || "",
      };
      saveUnitProgress(unit.id, progress);
    }

    document.title = `${unit.inning}: ${unit.title} — Nightly Hebrew`;
    const chip = document.getElementById("inning-chip");
    if (chip) chip.textContent = unit.inning;
    const h1 = document.getElementById("page-title");
    if (h1) h1.textContent = `${unit.title} — ${unit.subtitle}`;

    const hero = document.getElementById("hero");
    if (hero) {
      const peek = (unit.closer[0] || unit.words[0] || {}).heb || "";
      hero.innerHTML = `
        <p class="eyebrow">${esc(unit.inning)} · Nightly Hebrew</p>
        <h2>${esc(unit.title)}</h2>
        <p class="sub">${esc(unit.subtitle)}</p>
        ${peek ? `<div class="hebsub">${peek}</div>` : ""}
        <div class="big-idea"><b>Tonight's big idea:</b> ${esc(unit.bigIdea)}</div>
        ${unit.why ? `<div class="big-idea why"><b>Why it matters:</b> ${esc(unit.why)}</div>` : ""}`;
    }

    const acts = document.getElementById("acts");
    if (acts) {
      const toc = buildToc();
      acts.appendChild(toc);
      let num = 0;
      for (const sec of PLAN) {
        const live = sec.acts.filter((a) => registry.has(a));
        if (!live.length) continue;
        acts.appendChild(
          el(`<div class="section-head" id="sec-${sec.key}">
            <h2>${esc(sec.name)}</h2>
            <p>${esc(sec.blurb)}</p>
          </div>`),
        );
        for (const actId of live) {
          const spec = registry.get(actId);
          const bonus = BONUS_IDS.includes(actId);
          if (!bonus) num++;
          const label = bonus ? "＋" : num;
          const title = typeof spec.title === "function" ? spec.title(unit) : spec.title;
          const how = typeof spec.how === "function" ? spec.how(unit) : spec.how;
          const card = actCard(actId, label, title, how, bonus);
          acts.appendChild(card);
          const body = $(".act-body", card);
          try {
            spec.mount(body, apiFor(actId));
          } catch (err) {
            body.innerHTML =
              '<p class="note">This activity hit a snag and skipped itself. Everything else on the page still works.</p>';
            if (global.console) console.error("[nightly-hebrew] activity failed: " + actId, err);
            // A broken activity must not be able to lock the payout.
            done(actId);
          }
        }
      }
    }

    // Previous / next inning links.
    const nav = document.getElementById("footnav");
    if (nav) {
      const prev = UNITS.find((u) => u.id === unit.id - 1);
      const next = UNITS.find((u) => u.id === unit.id + 1);
      nav.innerHTML =
        (prev ? `<a href="${prev.slug}">← ${esc(prev.inning)}</a>` : "") +
        `<a href="./">⚾ All innings</a>` +
        (next ? `<a href="${next.slug}">${esc(next.inning)} →</a>` : "");
    }

    refreshScore();
  }

  // A nineteen-activity page needs a map. The card list doubles as a progress
  // board and as jump links, so nobody has to scroll to find where they left
  // off.
  function buildToc() {
    const wrap = el(`<nav class="toc" aria-label="Tonight's activities">
      <div class="toc-head">
        <h3>Tonight's lineup</h3>
        <span class="note" id="toc-tally"></span>
      </div>
      <ol class="toc-list"></ol>
      <p class="note toc-foot">Main activities unlock the $0.20. <b>Extra Innings</b> are optional bonus practice.</p>
    </nav>`);
    const list = $(".toc-list", wrap);
    let num = 0;
    for (const sec of PLAN) {
      const live = sec.acts.filter((a) => registry.has(a));
      if (!live.length) continue;
      for (const actId of live) {
        const spec = registry.get(actId);
        const bonus = BONUS_IDS.includes(actId);
        if (!bonus) num++;
        const title = typeof spec.title === "function" ? spec.title(unit) : spec.title;
        const li = el(`<li class="toc-step${progress.acts[actId] ? " done" : ""}${
          bonus ? " bonus" : ""
        }" id="toc-${actId}">
          <a href="#act-${actId}"><span class="dot">${bonus ? "＋" : num}</span><span class="lbl">${title}</span></a>
        </li>`);
        list.appendChild(li);
      }
    }
    return wrap;
  }

  global.HEB = {
    boot,
    registerGame,
    registerActivity,
    syl,
    trHtml,
    pieces,
    sneakyPatach,
    say,
    toast,
    shuffle,
    sample,
    pick,
    randInt,
    el,
    esc,
    LETTERS,
    VOWELS,
    UNITS,
    readProgress,
    ACT_IDS,
    BONUS_IDS,
    PLAN,
  };
})(window);
