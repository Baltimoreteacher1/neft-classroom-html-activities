/* 6th Inning game — HOME RUN DERBY.
 *
 * Mechanic: word construction from a scrambled tray, RIGHT to LEFT. The batter
 * gets the meaning and the sound spelling of a word — never the word — and has
 * to rebuild it one readable piece at a time. Placing a piece means knowing what
 * sound it makes AND where that sound falls, which is exactly what this inning
 * teaches: a whole word is just syllables stitched together, read from the right.
 *
 * Both teaching points fall out of the mechanic instead of being announced. The
 * FINAL letter is a tile like any other and the only place it fits is last (try
 * it anywhere else and the game says so by name); the ee-piece — a Chirik with
 * its Yud riding along — is one tile that has to be read as one sound.
 *
 * Calm by design: no clock, unlimited attempts, a real Undo, tiered hints.
 */
(function () {
  "use strict";

  // A Hebrew "piece" is one letter plus whatever nikud is riding on it. Split
  // on the LETTER range so one tile always equals one thing you can read aloud,
  // no matter which word the unit hands us.
  const isLetter = (ch) => ch >= "א" && ch <= "ת";
  const isMark = (ch) => ch >= "֑" && ch <= "ׇ";

  function splitClusters(heb) {
    const out = [];
    for (const ch of String(heb)) {
      if (isLetter(ch)) out.push(ch);
      else if (isMark(ch) && out.length) out[out.length - 1] += ch;
      // Spaces and punctuation are dropped — a tray tile must be readable.
    }
    return out;
  }

  const ROUNDS = 6;
  const FEET_PER_PIECE = 100;
  const CLEAN_BONUS = 60; // a build with no misses is a "no-doubter"
  const FENCE = 340;
  const MAX_FEET = 600; // the scale of the stadium graphic

  HEB.registerGame({
    name: "Home Run Derby",
    goal: "You get the meaning and the sound — not the word. Rebuild it from the tray, right to left, and see how far it flies.",
    blurb: "Build the word letter by letter from the tray. Longer words fly farther.",

    mount(root, api) {
      const { unit, LETTERS, VOWELS, say, shuffle, el, esc } = api;

      // Final-form letters, derived: the data keeps them out of the blending
      // pool precisely because they only ever end a word.
      const finals = new Set(unit.allLetters.filter((ch) => !unit.letterPool.includes(ch)));

      // Two-character vowels in the data are a mark plus a whole letter, and
      // which side the letter sits on tells you its job: BEFORE the mark it is
      // a chair the vowel sits on (וֹ, וּ); AFTER it, a silent passenger (ִי, ֵי).
      // Reading that off VOWELS keeps this file free of hard-coded Hebrew.
      const chairs = [];
      const riders = [];
      const markToVowel = {};
      for (const key of Object.keys(VOWELS)) {
        const ch = VOWELS[key].ch;
        if (ch.length === 1) {
          if (!markToVowel[ch]) markToVowel[ch] = key;
        } else if (isLetter(ch[0])) chairs.push({ letter: ch[0], mark: ch[1], key });
        else if (isLetter(ch[1])) riders.push({ letter: ch[1], mark: ch[0], key });
      }

      // What does this piece say, and why? Used only for hints and the recap —
      // never shown on the tile itself, or there would be nothing to read.
      function readCluster(cl, i, list) {
        const base = cl[0];
        const marks = cl.slice(1);
        const L = LETTERS[base];
        const name = L ? esc(L.name) : esc(base);
        const chair = chairs.find((c) => c.letter === base && marks.indexOf(c.mark) >= 0);
        if (chair) {
          const v = esc(VOWELS[chair.key].v);
          return { sound: v, why: `${name} is just a chair — the whole piece says <b>${v}</b>` };
        }
        const prev = i > 0 ? list[i - 1].slice(1) : "";
        const rider = riders.find((p) => p.letter === base && !marks && prev.indexOf(p.mark) >= 0);
        if (rider) {
          const v = esc(VOWELS[rider.key].v);
          return {
            sound: "",
            why: `${name} is silent — it rides along with the <b>${v}</b> before it`,
          };
        }
        let vKey = "";
        for (const m of marks) {
          if (markToVowel[m]) {
            vKey = markToVowel[m];
            break;
          }
        }
        const c = L ? L.c : "";
        const V = vKey ? VOWELS[vKey] : null;
        const sound = (c || "") + (V ? (V.v === "'" ? "'" : V.v) : "");
        let why;
        if (finals.has(base)) {
          why = `${name} — says <b>${esc(c)}</b>, and it only ever lands at the END of a word`;
        } else if (V) {
          why = `${name} says <b>${esc(c || "nothing")}</b> and ${esc(V.name)} says <b>${esc(V.v)}</b>`;
        } else {
          why = `${name} — says <b>${esc(c || "nothing")}</b>, with no vowel of its own`;
          if (i === list.length - 1) why += ", and at the end of a word you barely hear it";
        }
        return { sound: sound || "(silent)", why };
      }

      // Prefer words with real length — a two-piece word is not a swing worth
      // taking — but never come up short if the unit's list is thin.
      const all = unit.words
        .filter((w) => w.heb.indexOf(" ") < 0)
        .map((w) => ({ ...w, cl: splitClusters(w.heb) }))
        .filter((w) => w.cl.length >= 2);
      const long = all.filter((w) => w.cl.length >= 3);
      const bank = shuffle(long.length >= ROUNDS ? long : all).slice(0, ROUNDS);

      api.style(`
        .hd-how{background:rgba(255,209,102,.1);border:1px solid rgba(255,209,102,.34);border-radius:12px;padding:11px 13px;font-size:.92rem;margin-bottom:12px}
        .hd-how b{color:var(--lights)}
        /* Stadium. The ball's travel is a PERCENTAGE of .hd-air, so distance and
           the fence stay in scale at any width with no resize handler. */
        .hd-stadium{position:relative;height:158px;border-radius:14px;overflow:hidden;margin-bottom:14px;border:1px solid var(--line);background:linear-gradient(180deg,#0b2c3f 0%,#123a29 58%,#1c5233 100%)}
        .hd-air{position:absolute;left:16px;right:30px;top:0;bottom:0}
        .hd-flight{position:absolute;left:var(--dx,0%);bottom:16px;font-size:1.45rem;line-height:1}
        .hd-flight.go{animation:hd-run 1.25s ease-out both}
        .hd-flight.go .hd-ball{animation:hd-hop 1.25s ease-in-out both;display:inline-block}
        /* Reduced motion kills both animations site-wide; the inline --dx still
           puts the ball where it landed, so the readout never lies. */
        @keyframes hd-run{from{left:0%}to{left:var(--dx,0%)}}
        @keyframes hd-hop{0%{transform:translateY(0)}50%{transform:translateY(-86px)}100%{transform:translateY(0)}}
        .hd-fence{position:absolute;bottom:10px;width:5px;height:44px;border-radius:3px;background:repeating-linear-gradient(180deg,#e9f3ff 0 7px,#7f9db3 7px 14px)}
        .hd-fence span{position:absolute;bottom:-2px;left:9px;font-size:.66rem;font-weight:900;color:#cfe6f6;white-space:nowrap}
        .hd-batter{position:absolute;left:8px;bottom:12px;font-size:1.5rem}
        .hd-turf{position:absolute;left:0;right:0;bottom:0;height:12px;background:rgba(0,0,0,.3)}
        .hd-call{position:absolute;top:8px;left:0;right:0;text-align:center;font-weight:900;font-size:.92rem;color:var(--lights);text-shadow:0 2px 6px rgba(0,0,0,.6)}
        .hd-clue{background:rgba(0,0,0,.3);border:1px solid var(--line);border-radius:14px;padding:13px;margin-bottom:12px}
        .hd-lab{font-size:.7rem;letter-spacing:1.2px;text-transform:uppercase;color:var(--muted);font-weight:900}
        .hd-en{font-size:1.18rem;font-weight:900;margin:2px 0 6px}
        .hd-tr{font-size:1.05rem;font-weight:800;color:var(--lights);letter-spacing:.5px}
        .hd-reveal{font-family:var(--heb);direction:rtl;font-size:3rem;line-height:1.6;text-align:center;margin-top:4px}
        .hd-ends{display:flex;justify-content:space-between;font-size:.72rem;font-weight:800;color:var(--muted);margin-bottom:4px}
        /* direction:rtl on the strip and tray is what makes spot 1 sit on the
           RIGHT — the layout teaches the reading direction before any text does. */
        .hd-strip{display:flex;flex-wrap:wrap;gap:8px;direction:rtl;justify-content:center;align-items:center;background:rgba(0,0,0,.3);border:1px dashed var(--line);border-radius:14px;padding:12px 10px;min-height:92px}
        .hd-slot{position:relative;min-width:64px;min-height:64px;border-radius:12px;font:inherit;border:1px dashed rgba(255,255,255,.24);display:grid;place-items:center;padding:2px 6px;background:transparent;color:var(--chalk)}
        .hd-slot .hd-n{position:absolute;top:2px;right:5px;font-size:.66rem;font-weight:900;color:var(--muted)}
        .hd-slot .glyph{font-size:2.1rem}
        .hd-slot .glyph.ghost{opacity:.42}
        .hd-slot .hd-drop{position:absolute;bottom:0;left:0;right:0;font-size:.58rem;font-weight:900;letter-spacing:.4px;color:var(--lights)}
        .hd-slot.next{border-style:solid;border-color:var(--lights);background:rgba(255,209,102,.12);cursor:pointer}
        .hd-slot.next .hd-n{color:var(--lights)}
        .hd-slot.set{border-style:solid;border-color:var(--good);background:rgba(95,209,140,.12)}
        .hd-slot:focus-visible,.hd-tile:focus-visible{outline:3px solid #7fd4ff;outline-offset:2px}
        .hd-tray{display:flex;flex-wrap:wrap;gap:9px;direction:rtl;justify-content:center;margin:12px 0}
        .hd-tile{min-width:66px;min-height:66px;border-radius:13px;border:1px solid var(--line);background:linear-gradient(165deg,#16354a,#0e2434);color:var(--chalk);font:inherit;cursor:pointer;display:grid;place-items:center;padding:4px 8px;transition:transform .12s ease,border-color .12s ease}
        .hd-tile .glyph{font-size:2.2rem}
        .hd-tile:active{transform:scale(.96)}
        .hd-tile.used{visibility:hidden}
        .hd-tile[aria-pressed="true"]{border-color:var(--lights);transform:translateY(-5px);background:linear-gradient(165deg,#4b3a12,#2c2208);box-shadow:0 7px 15px rgba(0,0,0,.5)}
        .hd-tile.wrong{border-color:var(--bad);background:linear-gradient(165deg,#43222a,#2a1218)}
        .hd-tile.hint{border-color:var(--lights);box-shadow:0 0 0 3px rgba(255,209,102,.35)}
        /* Still a 58px target at 360px wide — comfortably above the 44px floor. */
        @media(max-width:380px){.hd-slot,.hd-tile{min-width:56px;min-height:58px}.hd-slot .glyph,.hd-tile .glyph{font-size:1.85rem}}
      `);

      root.innerHTML = `
        <p class="hd-how">You get the <b>meaning</b> and the <b>sound</b> — the word itself stays hidden.
          Tap a piece to pick it up, then tap the glowing spot to drop it in. The word is built
          <b>right to left</b>, so spot 1 is on the RIGHT. Finish it and the batter swings — longer
          words fly farther.</p>
        <div class="hd-stadium">
          <div class="hd-batter">🧍</div>
          <div class="hd-air">
            <div class="hd-fence" id="hd-fence"><span>${FENCE} ft</span></div>
            <div class="hd-flight" id="hd-flight"><span class="hd-ball">⚾</span></div>
          </div>
          <div class="hd-turf"></div>
          <div class="hd-call" id="hd-call"></div>
        </div>
        <div class="hd-clue">
          <div class="hd-lab">Batter up — build this word</div>
          <div class="hd-en" id="hd-en"></div>
          <div><span class="hd-lab">it sounds like</span> <span class="hd-tr" id="hd-tr"></span></div>
          <div class="hd-reveal" id="hd-word" hidden></div>
        </div>
        <div class="hd-ends"><span>end of the word ▶</span><span>◀ start here</span></div>
        <div class="hd-strip" id="hd-strip"></div>
        <div class="hd-tray" id="hd-tray" role="group" aria-label="Word pieces"></div>
        <div class="row">
          <button class="btn sm" type="button" id="hd-hear">🔊 Hear it again</button>
          <button class="btn sm" type="button" id="hd-undo" disabled>↩︎ Take the piece back</button>
          <span class="spacer"></span>
          <button class="btn primary sm" type="button" id="hd-next" hidden>Next batter →</button>
        </div>`;

      const $ = (sel) => root.querySelector(sel);
      const stripEl = $("#hd-strip");
      const trayEl = $("#hd-tray");
      const flightEl = $("#hd-flight");
      const callEl = $("#hd-call");
      const wordEl = $("#hd-word");
      const undoBtn = $("#hd-undo");
      const nextBtn = $("#hd-next");
      $("#hd-fence").style.left = `${(FENCE / MAX_FEET) * 100}%`;

      let round = 0;
      let feetTotal = 0;
      let homers = 0;
      let word = null;
      let tiles = [];
      let placed = [];
      let misses = 0;
      let picked = null; // id of the piece currently in the player's hand

      function hud() {
        api.setHud(
          `<span class="stat">⚾ Batter ${Math.min(round + 1, ROUNDS)}/${ROUNDS}</span>` +
            `<span class="stat">📏 ${feetTotal} ft</span>` +
            `<span class="stat">🏟 ${homers} home run${homers === 1 ? "" : "s"}</span>`,
        );
      }

      function drawStrip() {
        stripEl.innerHTML = "";
        const hand = tiles.find((t) => t.id === picked);
        word.cl.forEach((cl, i) => {
          const set = i < placed.length;
          const next = i === placed.length;
          const label = set
            ? `spot ${i + 1}, filled`
            : next
              ? `spot ${i + 1} — drop the piece you picked up here`
              : `spot ${i + 1}, still empty`;
          const slot =
            el(`<button class="hd-slot${set ? " set" : next ? " next" : ""}" type="button"
            ${next ? "" : "disabled"} aria-label="${label}">
            <span class="hd-n">${i + 1}</span>
            <span class="glyph${next && hand ? " ghost" : ""}">${set ? placed[i] : next && hand ? hand.cl : ""}</span>
            ${next && hand ? '<span class="hd-drop">tap to drop</span>' : ""}
          </button>`);
          if (next) slot.addEventListener("click", drop);
          stripEl.appendChild(slot);
        });
        undoBtn.disabled = placed.length === 0;
      }

      function drawTray() {
        trayEl.innerHTML = "";
        tiles.forEach((t) => {
          const b = el(
            `<button class="hd-tile${t.used ? " used" : ""}" type="button" data-id="${t.id}"
              aria-pressed="${t.id === picked}" aria-label="word piece ${t.n}">
              <span class="glyph">${t.cl}</span></button>`,
          );
          b.addEventListener("click", () => pickUp(t));
          trayEl.appendChild(b);
        });
      }

      // Repaint the pressed state WITHOUT rebuilding the tray, so a tier-3 hint
      // outline survives while the player keeps trying pieces.
      function paintTray() {
        trayEl.querySelectorAll(".hd-tile").forEach((b) => {
          b.setAttribute("aria-pressed", String(Number(b.dataset.id) === picked));
        });
      }

      const clearWrong = () =>
        trayEl.querySelectorAll(".wrong").forEach((b) => b.classList.remove("wrong"));

      function newBatter() {
        word = bank[round];
        placed = [];
        misses = 0;
        picked = null;
        // Number the tiles AFTER shuffling. Numbering them by their place in the
        // word would put the answer in the data-id and the aria-label, which
        // hands the whole puzzle to a screen-reader user.
        tiles = shuffle(word.cl.slice()).map((cl, i) => ({ cl, id: i, n: i + 1, used: false }));
        $("#hd-en").textContent = word.en;
        $("#hd-tr").textContent = word.tr;
        wordEl.hidden = true;
        callEl.textContent = "";
        nextBtn.hidden = true;
        flightEl.classList.remove("go");
        flightEl.style.setProperty("--dx", "0%");
        api.clearFeedback();
        drawStrip();
        drawTray();
        hud();
      }

      function fly(feet, homer) {
        flightEl.style.setProperty("--dx", `${Math.min(feet / MAX_FEET, 1) * 100}%`);
        flightEl.classList.remove("go");
        void flightEl.offsetWidth; // restart the arc for this swing
        flightEl.classList.add("go");
        callEl.textContent = homer ? `${feet} ft — GONE! 🎆` : `${feet} ft — off the wall`;
      }

      // Tap-to-select, then tap-to-place. Tapping the piece a second time drops
      // it too — two taps either way, and nothing here needs a steady hand.
      function pickUp(t) {
        if (t.used || placed.length >= word.cl.length) return;
        clearWrong();
        if (picked === t.id) {
          drop();
          return;
        }
        picked = t.id;
        drawStrip();
        paintTray();
      }

      function drop() {
        if (picked === null) {
          api.feedback("tip", "Pick a piece up from the tray first, then tap this spot.");
          return;
        }
        const t = tiles.find((x) => x.id === picked);
        const btn = trayEl.querySelector(`[data-id="${t.id}"]`);
        const want = word.cl[placed.length];
        picked = null;

        if (t.cl === want) {
          t.used = true;
          placed.push(t.cl);
          const r = readCluster(t.cl, placed.length - 1, word.cl);
          drawStrip();
          drawTray(); // a fresh tray also wipes any hint the player no longer needs
          if (placed.length < word.cl.length) {
            api.feedback(
              "ok",
              `Piece ${placed.length} is in — ${r.why}. Now the next one, moving <b>left</b>.`,
            );
            return;
          }
          finishWord();
          return;
        }

        // ---- a wrong piece: tier the help, never hand over the answer ----
        misses++;
        if (btn) btn.classList.add("wrong");
        drawStrip();
        paintTray();
        const got = readCluster(t.cl, placed.length, word.cl);
        const need = readCluster(want, placed.length, word.cl);
        const spot = placed.length + 1;

        if (finals.has(t.cl[0]) && placed.length < word.cl.length - 1) {
          // The whole point of the inning — call it out by name every time.
          api.feedback(
            "no",
            `That's a <b>final letter</b> (${esc(LETTERS[t.cl[0]].name)}). A final letter only ever
             lands at the <b>END</b> of a word — save it for spot ${word.cl.length}.`,
          );
          return;
        }
        if (misses === 1) {
          api.feedback(
            "no",
            `Not there. The piece you tapped says <b>${esc(got.sound)}</b> — ${got.why}. Remember the
             word <b>starts on the right</b>, and you're filling spot ${spot} counting from the right.
             Say the sound spelling out loud and listen for what comes next.`,
          );
        } else if (misses === 2) {
          api.feedback(
            "tip",
            `Hint: the sound you need in spot ${spot} is <b>${esc(need.sound)}</b>. Look through the
             tray for the piece that makes it — don't grab the first one that looks close.`,
          );
        } else {
          const match = tiles.find((x) => !x.used && x.cl === want);
          const el2 = match && trayEl.querySelector(`[data-id="${match.id}"]`);
          if (el2) el2.classList.add("hint");
          api.feedback(
            "tip",
            `Hint: it's the outlined piece — ${need.why}, so it says <b>${esc(need.sound)}</b>.`,
          );
        }
      }

      function finishWord() {
        const clean = misses === 0;
        const feet = word.cl.length * FEET_PER_PIECE + (clean ? CLEAN_BONUS : 0);
        const homer = feet >= FENCE;
        feetTotal += feet;
        if (homer) homers++;
        wordEl.hidden = false;
        wordEl.textContent = word.heb;
        say(word.heb, word.tr);
        fly(feet, homer);
        hud();
        round++;

        const line = clean
          ? `<b>No-doubter!</b> Built clean, so it carries an extra ${CLEAN_BONUS} ft.`
          : `Built it. ${misses} miss${misses === 1 ? "" : "es"} on the way, so no clean-swing bonus.`;
        api.feedback(
          "ok",
          `${line} <b>${esc(word.tr)}</b> — ${esc(word.en)}. ${word.cl.length} pieces, ${feet} ft.`,
        );

        if (round >= bank.length) {
          nextBtn.hidden = true;
          api.win(
            `🏆 Derby over — ${feetTotal} ft and ${homers} home run${homers === 1 ? "" : "s"}.
             You built ${bank.length} whole words from scratch, right to left.`,
          );
          return;
        }
        nextBtn.hidden = false;
        nextBtn.textContent = `Next batter (${round + 1} of ${bank.length}) →`;
      }

      undoBtn.addEventListener("click", () => {
        if (!placed.length) return;
        const back = placed.pop();
        const t = tiles.find((x) => x.used && x.cl === back);
        if (t) t.used = false;
        picked = null;
        api.feedback(
          "tip",
          "Piece back in the tray. Read the sound spelling again from the right.",
        );
        drawStrip();
        drawTray();
      });

      $("#hd-hear").addEventListener("click", () => say(word.heb, word.tr));
      nextBtn.addEventListener("click", newBatter);

      newBatter();
    },
  });
})();
