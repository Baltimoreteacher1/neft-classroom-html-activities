/* Nightly Hebrew — shared engine.
 *
 * Every inning page is the same seven-activity shell; only the DATA (data.js)
 * and the GAME (games/unit-N.js) change. Keeping the shell here means the
 * teaching moves — "letter first, then vowel", hide-the-answer-until-you-try,
 * always review what came before — are defined once and can't drift between
 * pages.
 *
 * Page contract:
 *   <body data-unit="N">  →  <script src="data.js">  →  <script src="engine.js">
 *   →  <script src="games/unit-N.js">  →  HEB.boot()
 */
(function (global) {
  "use strict";

  const D = global.HEB_DATA;
  const { LETTERS, VOWELS, UNITS } = D;

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

  // -------------------------------------------------------------- progress
  const PROGRESS_KEY = "nightly-hebrew:progress";
  const EARN_KEY = "focus-school:hebrew-earnings";
  const ACT_IDS = ["warmup", "letters", "rules", "blender", "batting", "game", "closer"];

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
  const registerGame = (spec) => {
    gameSpec = spec;
  };

  function done(actId) {
    if (progress.acts[actId]) return;
    progress.acts[actId] = true;
    saveUnitProgress(unit.id, progress);
    const card = document.getElementById("act-" + actId);
    if (card) {
      card.classList.remove("locked");
      const num = $(".num", card);
      if (num) {
        num.classList.add("done");
        num.textContent = "✓";
      }
      let flag = $(".done-flag", card);
      if (!flag) {
        flag = el('<span class="done-flag">✓ Done</span>');
        $("header", card).appendChild(flag);
      }
    }
    refreshScore();
  }

  function refreshScore() {
    const n = ACT_IDS.filter((k) => progress.acts[k]).length;
    const bug = document.getElementById("scorebug");
    if (bug) bug.textContent = `${n}/7`;
    const bar = document.getElementById("topbar-bar");
    if (bar) bar.style.width = `${Math.round((n / ACT_IDS.length) * 100)}%`;
    renderPayout(n === ACT_IDS.length);
  }

  // Standard activity card frame. Everything a unit page shows goes through
  // here so numbering, done-state and scroll anchors stay consistent.
  function actCard(id, num, title, how, bodyHtml) {
    const isDone = !!progress.acts[id];
    return el(`<section class="act" id="act-${id}">
      <header>
        <div class="num${isDone ? " done" : ""}">${isDone ? "✓" : num}</div>
        <div>
          <h3>${title}</h3>
          <p class="how">${how}</p>
        </div>
        ${isDone ? '<span class="done-flag">✓ Done</span>' : ""}
      </header>
      <div class="act-body">${bodyHtml}</div>
    </section>`);
  }

  const fb = (node, kind, msg) => {
    node.className = "feedback " + kind;
    node.innerHTML = msg;
  };

  // ------------------------------------------------------ 1. Dugout warm-up
  // Spaced review. Unit 1 has nothing behind it, so it becomes the "how
  // Hebrew works" orientation instead of a review of nothing.
  function buildWarmup() {
    if (unit.id === 1) return buildOrientation();
    const pool = [];
    for (const L of unit.prevLetters) {
      for (const V of unit.prevVowels.length ? unit.prevVowels : unit.vowelPool) {
        const s = syl(L, V);
        if (s) pool.push(s);
      }
    }
    const items = sample(pool, 8);
    const body = `
      <p class="note">Say each one out loud, <b>then</b> tap it to check. Letter first, vowel second.</p>
      <div class="drill-row" id="wu-row"></div>
      <div class="feedback" id="wu-fb"></div>`;
    const card = actCard(
      "warmup",
      1,
      "⚾ Dugout Warm-Up",
      "Everything you already own — 8 quick reps before tonight's new stuff.",
      body,
    );
    const row = $("#wu-row", card);
    const fbn = $("#wu-fb", card);
    let checked = 0;
    items.forEach((s) => {
      const t = el(
        `<button class="tile" type="button"><span class="glyph">${s.heb}</span><span class="peek">?</span></button>`,
      );
      t.addEventListener("click", () => {
        if (t.classList.contains("revealed")) {
          say(s.heb, s.tr);
          return;
        }
        t.classList.add("revealed");
        $(".peek", t).innerHTML = trHtml(s);
        say(s.heb, s.tr);
        checked++;
        if (checked === items.length) {
          fb(fbn, "ok", "Warm-up complete — arm's loose. ⚾");
          done("warmup");
        } else {
          fbn.className = "feedback tip";
          fbn.textContent = `${checked} of ${items.length} checked.`;
        }
      });
      row.appendChild(t);
    });
    return card;
  }

  function buildOrientation() {
    const steps = [
      [
        "➡️",
        "Hebrew reads RIGHT to left",
        "Start on the right edge of the line and move left — the opposite of English.",
      ],
      [
        "🔤",
        "A letter is a SOUND",
        "Every letter carries one consonant sound. ד is d. ז is z. That never changes.",
      ],
      [
        "🔻",
        "The vowel lives UNDERNEATH",
        "The little mark below the letter tells you which vowel to say.",
      ],
      [
        "🗣️",
        "Say the letter, then the vowel",
        'ד + ָ is not "ah-d". It\'s <b>dah</b> — letter first, vowel second, every time.',
      ],
    ];
    const body = `
      <p class="note">Tap each card. These four ideas are the whole game.</p>
      <div class="rules" id="or-list"></div>
      <div class="feedback" id="or-fb"></div>`;
    const card = actCard(
      "warmup",
      1,
      "⚾ How Hebrew Works",
      "Four ground rules before your first at-bat.",
      body,
    );
    const list = $("#or-list", card);
    const fbn = $("#or-fb", card);
    let n = 0;
    steps.forEach(([pin, t, d]) => {
      const r = el(
        `<button class="rule" type="button" style="text-align:left;cursor:pointer"><span class="pin">${pin}</span><span><b>${t}</b><span>${d}</span></span></button>`,
      );
      r.addEventListener(
        "click",
        () => {
          r.style.borderColor = "var(--good)";
          n++;
          if (n === steps.length) {
            fb(fbn, "ok", "You've got the ground rules. Play ball!");
            done("warmup");
          }
        },
        { once: true },
      );
      list.appendChild(r);
    });
    return card;
  }

  // ------------------------------------------------------- 2. Meet the players
  function buildLetters() {
    const showing = unit.newLetters.length ? unit.newLetters : unit.letterPool.slice(-6);
    const isReview = !unit.newLetters.length;
    const body = `
      <p class="note">Tap a card to hear it. Read the <b>sound</b> line out loud before you move on.</p>
      <div class="card-grid" id="lt-grid"></div>
      <div class="feedback" id="lt-fb"></div>`;
    const card = actCard(
      "letters",
      2,
      isReview ? "🧢 Scouting Report" : "🧢 Meet the Players",
      isReview
        ? "No new letters tonight — check the roster you already have."
        : `${showing.length} new letter${showing.length === 1 ? "" : "s"} joining the roster.`,
      body,
    );
    const grid = $("#lt-grid", card);
    const fbn = $("#lt-fb", card);
    let tapped = 0;
    showing.forEach((ch) => {
      const L = LETTERS[ch];
      if (!L) return;
      const c = el(`<button class="lcard" type="button" style="cursor:pointer">
        <div class="glyph">${ch}</div>
        <div class="lname">${esc(L.name)}</div>
        <div class="lsound">${L.c ? "says " + esc(L.c) : "SILENT"} — ${esc(L.say)}</div>
        <div class="lnote">${esc(L.note)}</div>
        ${L.watch ? `<div class="lwatch">👀 Don't mix up: ${esc(L.watch)}</div>` : ""}
      </button>`);
      c.addEventListener("click", () => {
        say(ch, L.c || L.name);
        if (!c.dataset.seen) {
          c.dataset.seen = "1";
          c.style.borderColor = "var(--good)";
          tapped++;
          if (tapped === showing.length) {
            fb(fbn, "ok", "Roster memorised. On to the vowels.");
            done("letters");
          } else {
            fbn.className = "feedback tip";
            fbn.textContent = `${tapped} of ${showing.length} cards read.`;
          }
        }
      });
      grid.appendChild(c);
    });
    return card;
  }

  // ------------------------------------------------------ 3. Coach's chalk talk
  function buildRules() {
    const vowelRows = unit.newVowels
      .map((k) => {
        const V = VOWELS[k];
        return `<div class="rule"><span class="pin glyph" style="font-size:2rem">א${V.ch}</span><span><b>${esc(
          V.name,
        )} — says <span style="color:var(--lights)">${esc(V.v)}</span></b><span>${esc(
          V.say,
        )}. Look for ${esc(V.art)}.</span></span></div>`;
      })
      .join("");
    const body = `
      ${vowelRows ? `<div class="rules" style="margin-bottom:12px">${vowelRows}</div>` : ""}
      <div class="rules" id="rl-list"></div>
      <div class="feedback" id="rl-fb"></div>`;
    const card = actCard(
      "rules",
      3,
      "📋 Coach's Chalk Talk",
      "The rules that make the sounds work. Tap each one once you've read it.",
      body,
    );
    const list = $("#rl-list", card);
    const fbn = $("#rl-fb", card);
    let n = 0;
    unit.rules.forEach(([t, d]) => {
      const r = el(
        `<button class="rule" type="button" style="text-align:left;cursor:pointer"><span class="pin">📌</span><span><b>${esc(
          t,
        )}</b><span>${d}</span></span></button>`,
      );
      r.addEventListener(
        "click",
        () => {
          r.style.borderColor = "var(--good)";
          n++;
          if (n === unit.rules.length) {
            fb(fbn, "ok", "Chalk talk done. Now go make some sounds.");
            done("rules");
          }
        },
        { once: true },
      );
      list.appendChild(r);
    });
    return card;
  }

  // --------------------------------------------------------- 4. The blender
  // Explore freely, then prove it. The challenge half hides the answer until
  // an attempt is made, and hints arrive in tiers instead of all at once.
  function buildBlender() {
    const letters = unit.letterPool;
    const vowels = unit.vowelPool;
    const body = `
      <div class="blend-pick" id="bl-letters" role="group" aria-label="Pick a letter"></div>
      <div class="blend-pick" id="bl-vowels" role="group" aria-label="Pick a vowel"></div>
      <div class="blend-stage">
        <div class="slot"><small>letter</small><span class="glyph lg" id="bl-l"></span></div>
        <div class="op">+</div>
        <div class="slot"><small>vowel</small><span class="glyph lg" id="bl-v"></span></div>
        <div class="op eq">=</div>
        <div class="slot result"><small>says</small><span class="glyph" id="bl-r"></span></div>
      </div>
      <div class="blend-say" id="bl-say"></div>
      <div class="row" style="margin-top:12px">
        <button class="btn sm" type="button" id="bl-hear">🔊 Hear it</button>
        <button class="btn sm" type="button" id="bl-roll">🎲 Surprise me</button>
        <span class="spacer"></span>
        <button class="btn primary sm" type="button" id="bl-start">Start the 8-pitch challenge →</button>
      </div>
      <div id="bl-challenge" hidden style="margin-top:16px;border-top:1px solid var(--line);padding-top:14px">
        <div class="row" style="margin-bottom:8px"><b id="bl-count">Pitch 1 of 8</b><span class="spacer"></span><span class="note" id="bl-score"></span></div>
        <div style="text-align:center"><span class="glyph xl" id="bl-q"></span></div>
        <div class="choices" id="bl-choices"></div>
        <div class="feedback" id="bl-fb"></div>
      </div>`;
    const card = actCard(
      "blender",
      4,
      "⚙️ The Blending Machine",
      "Snap any letter onto any vowel and watch the sound come out. Then prove you can do it without looking.",
      body,
    );

    let curL = letters[letters.length - 1];
    let curV = vowels[vowels.length - 1];
    const lWrap = $("#bl-letters", card);
    const vWrap = $("#bl-vowels", card);

    letters.forEach((ch) => {
      const b = el(
        `<button class="chip" type="button" data-l="${ch}" aria-pressed="false"><span class="glyph">${ch}</span><small>${esc(
          LETTERS[ch].c || "silent",
        )}</small></button>`,
      );
      b.addEventListener("click", () => {
        curL = ch;
        paint();
      });
      lWrap.appendChild(b);
    });
    vowels.forEach((k) => {
      const V = VOWELS[k];
      const b = el(
        `<button class="chip" type="button" data-v="${k}" aria-pressed="false"><span class="glyph">א${V.ch}</span><small>${esc(
          V.v,
        )}</small></button>`,
      );
      b.addEventListener("click", () => {
        curV = k;
        paint();
      });
      vWrap.appendChild(b);
    });

    function paint() {
      const s = syl(curL, curV);
      $("#bl-l", card).textContent = curL;
      $("#bl-v", card).textContent = "א" + VOWELS[curV].ch;
      $("#bl-r", card).textContent = s.heb;
      $("#bl-r", card).className = "glyph";
      $("#bl-say", card).innerHTML =
        `${trHtml(s)} &nbsp;·&nbsp; <span class="note">${esc(LETTERS[curL].c ? LETTERS[curL].name + " says " + LETTERS[curL].c : LETTERS[curL].name + " is silent")}, ${esc(
          VOWELS[curV].name,
        )} says ${esc(VOWELS[curV].v)}</span>`;
      lWrap.querySelectorAll("[data-l]").forEach((b) => {
        b.setAttribute("aria-pressed", String(b.dataset.l === curL));
      });
      vWrap.querySelectorAll("[data-v]").forEach((b) => {
        b.setAttribute("aria-pressed", String(b.dataset.v === curV));
      });
    }
    paint();
    $("#bl-hear", card).addEventListener("click", () => {
      const s = syl(curL, curV);
      say(s.heb, s.tr);
    });
    $("#bl-roll", card).addEventListener("click", () => {
      curL = pick(letters);
      curV = pick(vowels);
      paint();
      const s = syl(curL, curV);
      say(s.heb, s.tr);
    });

    // ---- challenge ----
    const TOTAL = 8;
    let qn = 0;
    let right = 0;
    let misses = 0;
    let current = null;
    const wrap = $("#bl-challenge", card);
    const fbn = $("#bl-fb", card);

    $("#bl-start", card).addEventListener("click", () => {
      wrap.hidden = false;
      $("#bl-start", card).disabled = true;
      nextQ();
      wrap.scrollIntoView({ behavior: "smooth", block: "center" });
    });

    // Distractors are deliberately CLOSE: same consonant/different vowel, and
    // same vowel/different consonant. Guessing by elimination shouldn't work.
    function distractors(s) {
      const out = new Set();
      for (const k of shuffle(vowels)) {
        if (k === s.vowel) continue;
        const d = syl(s.letter, k);
        if (d && d.tr !== s.tr) out.add(d.tr);
        if (out.size >= 2) break;
      }
      for (const ch of shuffle(letters)) {
        if (ch === s.letter) continue;
        const d = syl(ch, s.vowel);
        if (d && d.tr !== s.tr) out.add(d.tr);
        if (out.size >= 3) break;
      }
      return [...out].slice(0, 3);
    }

    function nextQ() {
      if (qn >= TOTAL) {
        const pct = Math.round((right / TOTAL) * 100);
        fb(
          fbn,
          right >= TOTAL - 2 ? "ok" : "tip",
          right >= TOTAL - 2
            ? `<b>${right}/${TOTAL} — that's a solid inning.</b> You're reading the vowel, not guessing.`
            : `<b>${right}/${TOTAL}.</b> Good reps. Scroll back up to the machine and play with the ones that tripped you.`,
        );
        $("#bl-q", card).textContent = pct >= 0 ? "⚾" : "";
        $("#bl-choices", card).innerHTML = "";
        $("#bl-count", card).textContent = "Challenge complete";
        done("blender");
        return;
      }
      qn++;
      misses = 0;
      // Prefer the unit's NEW material, but keep a third of the pitches from
      // earlier units so review is baked in rather than optional.
      const useNew = unit.newLetters.length || unit.newVowels.length;
      const wantNew = useNew && qn % 3 !== 0;
      const L =
        wantNew && unit.newLetters.length
          ? pick(unit.newLetters.filter((x) => letters.includes(x)))
          : pick(letters);
      const V = wantNew && unit.newVowels.length ? pick(unit.newVowels) : pick(vowels);
      current = syl(L || pick(letters), V || pick(vowels));
      $("#bl-count", card).textContent = `Pitch ${qn} of ${TOTAL}`;
      $("#bl-score", card).textContent = `${right} clean`;
      $("#bl-q", card).textContent = current.heb;
      fbn.className = "feedback";
      fbn.innerHTML = "";
      const opts = shuffle([current.tr, ...distractors(current)]);
      const ch = $("#bl-choices", card);
      ch.innerHTML = "";
      opts.forEach((t) => {
        const b = el(`<button class="choice" type="button">${esc(t)}</button>`);
        b.addEventListener("click", () => answer(b, t, ch));
        ch.appendChild(b);
      });
    }

    function answer(btn, text, ch) {
      if (text === current.tr) {
        btn.classList.add("ok");
        [...ch.children].forEach((b) => (b.disabled = true));
        if (misses === 0) right++;
        say(current.heb, current.tr);
        fb(
          fbn,
          "ok",
          `<b>${esc(current.tr)}</b> — ${esc(current.L.name)} says <b>${esc(
            current.c || "nothing",
          )}</b>, ${esc(current.V.name)} says <b>${esc(current.v)}</b>.`,
        );
        setTimeout(nextQ, 950);
        return;
      }
      btn.classList.add("no");
      btn.disabled = true;
      misses++;
      if (misses === 1) {
        // Tier 1 — name the move, not the answer.
        fb(
          fbn,
          "no",
          `Not that one. Look at the mark <b>under</b> the letter first — which vowel is it? Then say the letter's sound in front of it.`,
        );
      } else if (misses === 2) {
        // Tier 2 — give one half away, never both.
        fb(
          fbn,
          "tip",
          `Hint: the vowel is <b>${esc(current.V.name)}</b>, and it says <b>${esc(
            current.v,
          )}</b>. Now which letter is in front of it?`,
        );
      } else {
        fb(
          fbn,
          "tip",
          `Hint: the letter is <b>${esc(current.L.name)}</b> (${esc(
            current.c || "silent",
          )}) and the vowel says <b>${esc(current.v)}</b>.`,
        );
      }
    }

    return card;
  }

  // ------------------------------------------------------ 5. Batting practice
  // Fluency: a full page of reps with the answer hidden, no clock anywhere.
  function buildBatting() {
    const letters = unit.letterPool;
    const vowels = unit.vowelPool;
    const rows = [];
    for (let r = 0; r < 4; r++) {
      const row = [];
      const rowV = r < 2 && unit.newVowels.length ? pick(unit.newVowels) : null;
      const rowL = r >= 2 && unit.newLetters.length ? pick(unit.newLetters) : null;
      for (let i = 0; i < 6; i++) {
        const L = rowL || pick(letters);
        const V = rowV || pick(vowels);
        row.push(syl(L, V));
      }
      rows.push(row);
    }
    const body = `
      <p class="note">Read a whole row out loud <b>before</b> you tap anything. Then tap each one to check yourself. No clock — go at your speed.</p>
      <div id="bp-rows"></div>
      <div class="row" style="margin-top:12px">
        <button class="btn sm" type="button" id="bp-reveal">👁 Show every answer</button>
        <button class="btn sm" type="button" id="bp-new">🔄 Fresh set of pitches</button>
      </div>
      <div class="feedback" id="bp-fb"></div>`;
    const card = actCard(
      "batting",
      5,
      "🏏 Batting Practice",
      "Four rows of reps. Reading a whole row without stopping is the goal.",
      body,
    );
    const host = $("#bp-rows", card);
    const fbn = $("#bp-fb", card);
    let rowsDone = 0;

    function drawRows() {
      host.innerHTML = "";
      rowsDone = 0;
      rows.forEach((row, i) => {
        const wrap = el(
          `<div style="margin-bottom:12px"><div class="note" style="margin-bottom:5px">Row ${i + 1}</div><div class="drill-row"></div></div>`,
        );
        const line = $(".drill-row", wrap);
        let tapped = 0;
        row.forEach((s) => {
          const t = el(
            `<button class="tile" type="button"><span class="glyph">${s.heb}</span><span class="peek">?</span></button>`,
          );
          t.addEventListener("click", () => {
            if (!t.classList.contains("revealed")) {
              t.classList.add("revealed");
              $(".peek", t).innerHTML = trHtml(s);
              tapped++;
              if (tapped === row.length) {
                rowsDone++;
                if (rowsDone === rows.length) {
                  fb(fbn, "ok", "All four rows checked. That's a full round of BP. ⚾");
                  done("batting");
                }
              }
            }
            say(s.heb, s.tr);
          });
          line.appendChild(t);
        });
        host.appendChild(wrap);
      });
    }
    drawRows();

    $("#bp-reveal", card).addEventListener("click", () => {
      host.querySelectorAll(".tile:not(.revealed)").forEach((t) => t.click());
    });
    $("#bp-new", card).addEventListener("click", () => {
      rows.forEach((row, r) => {
        const rowV = r < 2 && unit.newVowels.length ? pick(unit.newVowels) : null;
        const rowL = r >= 2 && unit.newLetters.length ? pick(unit.newLetters) : null;
        for (let i = 0; i < row.length; i++) {
          row[i] = syl(rowL || pick(letters), rowV || pick(vowels));
        }
      });
      drawRows();
      fbn.className = "feedback";
      fbn.innerHTML = "";
    });
    return card;
  }

  // ---------------------------------------------------------------- 6. Game
  function buildGame() {
    const spec = gameSpec || {
      name: "Coming up",
      goal: "This inning's game is still in the bullpen.",
      mount(root, api) {
        root.innerHTML = '<p class="note">No game loaded for this inning.</p>';
        api.win();
      },
    };
    const body = `<div class="game">
      <h4>⚾ ${esc(spec.name)}</h4>
      <p class="goal">${esc(spec.goal)}</p>
      <div class="hud" id="gm-hud"></div>
      <div id="gm-root"></div>
      <div class="feedback" id="gm-fb"></div>
    </div>`;
    const card = actCard("game", 6, "🎮 Tonight's Game", esc(spec.blurb || spec.goal), body);
    const root = $("#gm-root", card);
    const hud = $("#gm-hud", card);
    const fbn = $("#gm-fb", card);
    let won = false;
    const api = {
      unit,
      LETTERS,
      VOWELS,
      syl,
      trHtml,
      say,
      toast,
      shuffle,
      sample,
      pick,
      randInt,
      el,
      esc,
      setHud(html) {
        hud.innerHTML = html;
      },
      // Each game owns its own layout CSS instead of everyone editing one
      // shared stylesheet — nine games, nine independent files, no collisions.
      style(css) {
        const id = "gm-style-" + (unit.id || 0);
        if (document.getElementById(id)) return;
        const s = document.createElement("style");
        s.id = id;
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
        done("game");
      },
    };
    // A game that throws must not take the whole page down with it.
    try {
      spec.mount(root, api);
    } catch (err) {
      root.innerHTML =
        '<p class="note">This game hit a snag. Everything else on the page still works — tap below to skip it.</p><button class="btn sm" type="button" id="gm-skip">Skip this game</button>';
      $("#gm-skip", root)?.addEventListener("click", () => api.win("Game skipped."));
      if (global.console) console.error("[nightly-hebrew] game failed to mount", err);
    }
    return card;
  }

  // ------------------------------------------------------------- 7. Game day
  function buildCloser() {
    const words = unit.words;
    const siddur = unit.siddur;
    const body = `
      <p class="note">Real words, built only from letters you already own. Tap one to check the sound and the meaning.</p>
      <div class="words" id="cl-words"></div>
      ${
        siddur.length
          ? `<h4 style="margin:18px 0 4px">📖 Straight from the siddur</h4>
             <p class="note" style="margin-top:0">These exact lines are in your prayer book. Read them out loud.</p>
             <div id="cl-siddur"></div>`
          : ""
      }
      <div class="feedback" id="cl-fb"></div>`;
    const card = actCard(
      "closer",
      7,
      "📖 Game Day",
      "Put it together: whole words, and real lines from davening.",
      body,
    );
    const wWrap = $("#cl-words", card);
    const fbn = $("#cl-fb", card);
    let read = 0;
    const need = words.length + siddur.length;

    const tick = () => {
      read++;
      if (read >= need) {
        fb(fbn, "ok", "That's the game. You just read real Hebrew. 🏆");
        done("closer");
      } else {
        fbn.className = "feedback tip";
        fbn.textContent = `${read} of ${need} read.`;
      }
    };

    words.forEach((w) => {
      const b = el(`<button class="word hide" type="button">
        <span class="glyph">${w.heb}</span>
        <span class="meta"><span class="tr"><span class="c">${esc(w.tr)}</span></span><br><span class="en">${esc(
          w.en,
        )}</span></span>
      </button>`);
      b.addEventListener("click", () => {
        if (b.classList.contains("hide")) {
          b.classList.remove("hide");
          tick();
        }
        say(w.heb, w.tr);
      });
      wWrap.appendChild(b);
    });

    if (siddur.length) {
      const sWrap = $("#cl-siddur", card);
      siddur.forEach((s) => {
        const b =
          el(`<button class="word hide" type="button" style="display:block;text-align:right">
          <span class="glyph" style="font-size:1.9rem;display:block">${s.heb}</span>
          <span class="meta" style="text-align:left;display:block;margin-top:6px"><span class="tr"><span class="c">${esc(
            s.tr,
          )}</span></span><br><span class="en">${esc(s.en)}</span></span>
        </button>`);
        b.addEventListener("click", () => {
          if (b.classList.contains("hide")) {
            b.classList.remove("hide");
            tick();
          }
          say(s.heb, s.tr);
        });
        sWrap.appendChild(b);
      });
    }
    return card;
  }

  // --------------------------------------------------------------- payout
  function renderPayout(unlocked) {
    const host = document.getElementById("payout");
    if (!host) return;
    const day = todayKey();
    const paid = alreadyClaimedToday(unit.id, day);
    if (paid) {
      host.className = "payout paid";
      host.innerHTML = `<div class="amount">$0.20</div>
        <h3>Paid — nice work tonight ⚾</h3>
        <p>It's on its way to your <b>Allowance</b> page. Open Focus School and it'll be sitting in your balance.</p>
        <a class="btn sm" href="/">Open Focus School →</a>`;
      return;
    }
    if (!unlocked) {
      const n = ACT_IDS.filter((k) => progress.acts[k]).length;
      host.className = "payout";
      host.innerHTML = `<div class="amount" style="opacity:.45">$0.20</div>
        <h3>Finish the inning to get paid</h3>
        <p>${n} of 7 activities done. Clear all seven and this button unlocks.</p>
        <button class="btn block" type="button" disabled>🔒 Locked</button>`;
      return;
    }
    host.className = "payout";
    host.innerHTML = `<div class="amount">$0.20</div>
      <h3>Inning complete — collect your pay</h3>
      <p>All seven activities done. Tap once and it syncs straight to your Allowance.</p>
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
        <div class="big-idea"><b>Tonight's big idea:</b> ${esc(unit.bigIdea)}</div>`;
    }

    const acts = document.getElementById("acts");
    if (acts) {
      acts.appendChild(buildWarmup());
      acts.appendChild(buildLetters());
      acts.appendChild(buildRules());
      acts.appendChild(buildBlender());
      acts.appendChild(buildBatting());
      acts.appendChild(buildGame());
      acts.appendChild(buildCloser());
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

  global.HEB = {
    boot,
    registerGame,
    syl,
    trHtml,
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
  };
})(window);
