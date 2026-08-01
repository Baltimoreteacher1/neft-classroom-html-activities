/* 4th Inning game — BATTERY MATCH.
 *
 * Mechanic: set collection under a two-part constraint. The bullpen shows the
 * dot-IN letters in one row and the dot-OUT letters in another, with NO sound
 * labels anywhere. To bank a battery the player has to do the two things this
 * inning actually teaches, in order:
 *   1. see that two glyphs are the same SHAPE (the dot is the only difference),
 *   2. decide which of that pair's two sounds belongs to which member.
 * Step 1 alone is a shape-matching puzzle a non-reader could brute-force;
 * step 2 alone would be a quiz. Chained, they are the dagesh rule itself.
 *
 * Everything is derived, never hard-coded: a "hard" letter is literally its
 * soft twin plus one combining code point, so stripping that code point groups
 * the pairs. A letter whose group has no twin (Nun tonight) sits in the catcher
 * row as an honest decoy — noticing he works alone is part of the reading.
 *
 * Calm by design: no clock, unlimited attempts, and every miss names the KIND
 * of mistake before it ever names a sound.
 */
(function () {
  "use strict";

  // U+05BC HEBREW POINT DAGESH — the dot INSIDE the letter, not the vowel
  // below it. Written as an escape because a bare combining mark in source is
  // invisible to the next reader and easy to delete by accident.
  const DAGESH = "\u05BC";
  const stripDot = (ch) => ch.split(DAGESH).join("");
  // Roster names carry a parenthetical for the card view ("Pey (dot inside)").
  // In a hint that parenthetical would restate the very thing being hinted at,
  // so hints use the bare name.
  const shortName = (L) => String(L.name).replace(/\s*\([^)]*\)\s*$/, "");

  HEB.registerGame({
    name: "Battery Match",
    goal: "Pair each pitcher with the catcher who shares his shape, then decide which one throws the hard pitch and which throws the soft one.",
    blurb: "Match the dot-in letter to its dot-out twin, then hand each one the right sound.",

    mount(root, api) {
      const { unit, LETTERS, syl, trHtml, say, shuffle, pick, el, esc } = api;

      api.style(`
        .bat-board{display:grid;gap:8px;margin-bottom:14px}
        .bat-slotrow{display:grid;grid-template-columns:auto 1fr;gap:12px;align-items:center;
          background:rgba(0,0,0,.28);border:1px solid var(--line);border-radius:12px;padding:9px 12px}
        .bat-slotrow.on{border-color:var(--good);background:rgba(95,209,140,.12)}
        .bat-tag{font-weight:900;font-size:.74rem;letter-spacing:.8px;text-transform:uppercase;
          color:var(--muted);white-space:nowrap}
        .bat-slotrow.on .bat-tag{color:var(--good)}
        .bat-fill{display:flex;flex-wrap:wrap;gap:6px 16px;align-items:baseline}
        .bat-fill .glyph{font-size:1.9rem}
        .bat-fill em{font-style:normal;color:var(--lights);font-weight:900}
        .bat-step{background:rgba(255,209,102,.1);border:1px solid rgba(255,209,102,.34);
          border-radius:12px;padding:10px 13px;margin-bottom:12px;font-size:.96rem}
        .bat-step b{color:var(--lights)}
        .bat-row{margin-bottom:12px}
        .bat-lbl{font-size:.78rem;font-weight:900;color:var(--muted);margin-bottom:5px;
          letter-spacing:.4px}
        .bat-cards{display:flex;flex-wrap:wrap;gap:8px;direction:rtl}
        .bat-card{border:1px solid var(--line);background:linear-gradient(165deg,#16354a,#0e2434);
          color:var(--chalk);border-radius:13px;min-width:66px;min-height:72px;padding:4px 10px;
          font:inherit;cursor:pointer;display:grid;place-items:center}
        .bat-card .glyph{font-size:2.3rem}
        .bat-card[aria-pressed="true"]{border-color:var(--lights);background:rgba(255,209,102,.18)}
        .bat-card[disabled]{opacity:.34;cursor:default}
        .bat-snd{min-width:150px;flex:1 1 150px;padding:8px 12px;gap:2px}
        .bat-snd .snd-c{font-weight:900;font-size:1.3rem}
        .bat-snd small{color:var(--muted);font-size:.78rem;line-height:1.25}
        .bat-snd[aria-pressed="true"] small{color:var(--chalk)}
        .bat-duo{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:12px}
        .bat-slot{border:1px dashed var(--line);background:rgba(0,0,0,.3);color:var(--chalk);
          border-radius:14px;min-height:132px;padding:10px 8px;font:inherit;cursor:pointer;
          display:grid;place-items:center;gap:4px;text-align:center}
        .bat-slot .glyph{font-size:3rem}
        .bat-slot .drop{font-size:.8rem;color:var(--muted);min-height:2.4em;line-height:1.25}
        .bat-slot.armed{border-style:solid;border-color:var(--lights)}
        .bat-slot.filled{border-style:solid;border-color:var(--grass)}
        .bat-slot.filled .drop{color:var(--good);font-weight:900;font-size:1.02rem}
        .bat-pitch{border:1px solid var(--lights);background:rgba(0,0,0,.3);color:var(--chalk);
          border-radius:16px;width:100%;min-height:150px;padding:12px;font:inherit;cursor:pointer;
          display:grid;place-items:center;gap:6px;margin-bottom:12px}
        .bat-pitch .glyph{font-size:4.2rem}
        .bat-pitch .peek{font-size:1rem;color:var(--muted);direction:ltr}
        /* The shared sheet only rings .chip/.btn/.tile — these are new shapes. */
        .bat-card:focus-visible,.bat-slot:focus-visible,.bat-pitch:focus-visible{
          outline:3px solid #7fd4ff;outline-offset:2px}
        @media (max-width:400px){.bat-duo{grid-template-columns:1fr}}
      `);

      // ------------------------------------------------------------ derive
      // Group every live letter by its dot-less base. A group is a real battery
      // only if it has both forms AND they say different things — that last
      // test is what keeps תּ/ת (both "t") out of a game about sound change.
      const groups = new Map();
      for (const ch of unit.letterPool) {
        if (!LETTERS[ch]) continue;
        const base = stripDot(ch);
        if (!groups.has(base)) groups.set(base, []);
        groups.get(base).push(ch);
      }
      const pairs = [];
      for (const members of groups.values()) {
        const hard = members.find((ch) => ch.includes(DAGESH));
        const soft = members.find((ch) => !ch.includes(DAGESH));
        if (hard && soft && LETTERS[hard].c !== LETTERS[soft].c) {
          pairs.push({ hard, soft, base: stripDot(hard) });
        }
      }
      // Decoys: letters introduced tonight that never take a partner. One or
      // two keeps the catcher row honest without turning it into a haystack.
      const paired = new Set(pairs.flatMap((p) => [p.hard, p.soft]));
      const loners = unit.newLetters
        .filter((ch) => LETTERS[ch] && !paired.has(ch) && !ch.includes(DAGESH))
        .slice(0, 2);

      if (!pairs.length) {
        // No dagesh pairs live in this unit — degrade to a no-fail note rather
        // than mounting an unplayable board.
        root.innerHTML =
          '<p class="note">No dot-in / dot-out pairs are in play this inning.</p>' +
          '<button class="btn primary block" type="button" id="bp-skip">Continue</button>';
        root
          .querySelector("#bp-skip")
          .addEventListener("click", () => api.win("Nothing to pair tonight — inning credited."));
        return;
      }

      const board = shuffle(pairs);
      const locked = new Set(); // base strings of banked batteries
      let selHard = null;
      let selSoft = null;
      let current = null; // the pair being sounded out
      let assign = {}; // letter -> chosen consonant sound
      let armed = null; // the sound chip currently held
      let pairMiss = 0;
      let soundMiss = 0;

      root.innerHTML = `
        <div class="bat-board" id="bp-board"></div>
        <div class="bat-step" id="bp-step"></div>
        <div id="bp-stage"></div>`;
      const boardHost = root.querySelector("#bp-board");
      const stepHost = root.querySelector("#bp-step");
      const stage = root.querySelector("#bp-stage");

      function drawBoard() {
        boardHost.innerHTML = "";
        board.forEach((p, i) => {
          const on = locked.has(p.base);
          boardHost.appendChild(
            el(`<div class="bat-slotrow${on ? " on" : ""}">
              <span class="bat-tag">${on ? "✓ " : ""}Battery ${i + 1}</span>
              <span class="bat-fill">${
                on
                  ? `<span class="glyph">${p.hard}</span><em>${esc(LETTERS[p.hard].c)}</em>
                     <span class="glyph">${p.soft}</span><em>${esc(LETTERS[p.soft].c)}</em>`
                  : '<span class="note">still warming up in the bullpen</span>'
              }</span>
            </div>`),
          );
        });
        api.setHud(
          `<span class="stat">Batteries ${locked.size}/${board.length}</span>` +
            `<span class="stat">Bullpen ${board.length - locked.size}</span>`,
        );
      }

      // ------------------------------------------------- phase 1: find the pair
      function drawPairPhase() {
        api.clearFeedback();
        selHard = null;
        selSoft = null;
        stepHost.innerHTML =
          "<b>Step 1 — find a battery.</b> Tap one pitcher and one catcher that are the <b>same letter shape</b>. The dot inside is the only thing that should be different.";
        stage.innerHTML = `
          <div class="bat-row">
            <div class="bat-lbl">🥎 Pitchers — every one has the dot INSIDE</div>
            <div class="bat-cards" id="bp-hard" role="group" aria-label="Pitchers"></div>
          </div>
          <div class="bat-row">
            <div class="bat-lbl">🧤 Catchers — no dot</div>
            <div class="bat-cards" id="bp-soft" role="group" aria-label="Catchers"></div>
          </div>
          <button class="btn primary block" type="button" id="bp-form" disabled>🤝 Call them to the mound</button>`;

        const hardHost = stage.querySelector("#bp-hard");
        const softHost = stage.querySelector("#bp-soft");
        const formBtn = stage.querySelector("#bp-form");

        const mkCard = (ch, host, isHard) => {
          const done = locked.has(stripDot(ch));
          const b = el(
            `<button class="bat-card" type="button" aria-pressed="false" data-ch="${ch}"${
              done ? " disabled" : ""
            }><span class="glyph">${ch}</span></button>`,
          );
          if (!done) {
            b.addEventListener("click", () => {
              if (isHard) selHard = ch;
              else selSoft = ch;
              paintCards();
            });
          }
          host.appendChild(b);
        };

        shuffle(board.map((p) => p.hard)).forEach((ch) => mkCard(ch, hardHost, true));
        shuffle(board.map((p) => p.soft).concat(loners)).forEach((ch) =>
          mkCard(ch, softHost, false),
        );

        function paintCards() {
          hardHost.querySelectorAll("[data-ch]").forEach((b) => {
            b.setAttribute("aria-pressed", String(b.dataset.ch === selHard));
          });
          softHost.querySelectorAll("[data-ch]").forEach((b) => {
            b.setAttribute("aria-pressed", String(b.dataset.ch === selSoft));
          });
          formBtn.disabled = !(selHard && selSoft);
        }

        formBtn.addEventListener("click", () => {
          if (!selHard || !selSoft) return;
          const hit = board.find((p) => p.hard === selHard && p.soft === selSoft);
          if (hit) {
            pairMiss = 0;
            current = hit;
            drawSoundPhase();
            return;
          }
          pairMiss++;
          if (loners.includes(selSoft) && pairMiss === 1) {
            api.feedback(
              "no",
              `That catcher has no dot-in twin anywhere in the bullpen — some letters only ever throw one pitch. Leave him be and try another catcher.`,
            );
          } else if (pairMiss === 1) {
            api.feedback(
              "no",
              "Those two aren't the same letter. Put a finger over the dot and compare the two outlines — a battery has to look like the <b>same shape</b> twice.",
            );
          } else if (pairMiss === 2) {
            api.feedback(
              "tip",
              `Half a hint: the pitcher you're holding is <b>${esc(
                shortName(LETTERS[selHard]),
              )}</b>. His catcher is that same outline with the dot erased, and it is still sitting in the row.`,
            );
          } else {
            api.feedback(
              "tip",
              `Erase the dot from your pitcher and you're left with <span class="glyph">${stripDot(
                selHard,
              )}</span> — find that one in the catcher row.`,
            );
          }
        });
      }

      // ------------------------------------------- phase 2: assign the sounds
      function drawSoundPhase() {
        api.clearFeedback();
        soundMiss = 0;
        assign = {};
        armed = null;
        const members = shuffle([current.hard, current.soft]);
        const sounds = shuffle([LETTERS[current.hard].c, LETTERS[current.soft].c]);
        stepHost.innerHTML =
          "<b>Step 2 — who throws what?</b> Tap a sound below, then tap the letter that throws it. Fill both, then lock the battery in.";
        stage.innerHTML = `
          <div class="bat-duo">
            ${members
              .map(
                (ch) => `<button class="bat-slot" type="button" data-ch="${ch}">
                  <span class="glyph">${ch}</span>
                  <span class="drop">tap a sound, then tap here</span>
                </button>`,
              )
              .join("")}
          </div>
          <div class="bat-lbl">🔊 The two pitches this letter can throw</div>
          <div class="bat-cards" id="bp-sounds" role="group" aria-label="Sounds" style="direction:ltr"></div>
          <div class="row" style="margin-top:12px">
            <button class="btn sm" type="button" id="bp-clear">↺ Start over</button>
            <span class="spacer"></span>
            <button class="btn primary" type="button" id="bp-lock" disabled>🔒 Lock the battery in</button>
          </div>`;

        const soundHost = stage.querySelector("#bp-sounds");
        const lockBtn = stage.querySelector("#bp-lock");
        const slots = [...stage.querySelectorAll(".bat-slot")];

        sounds.forEach((c) => {
          const owner = LETTERS[current.hard].c === c ? current.hard : current.soft;
          // The plain-English anchor is safe to show: it describes the SOUND,
          // never which of the two glyphs owns it.
          const b = el(
            `<button class="bat-card bat-snd" type="button" aria-pressed="false" data-c="${esc(c)}">
              <span class="snd-c">${esc(c)}</span>
              <small>${esc(LETTERS[owner].say)}</small>
            </button>`,
          );
          b.addEventListener("click", () => {
            armed = c;
            paintSounds();
          });
          soundHost.appendChild(b);
        });

        function paintSounds() {
          soundHost.querySelectorAll("[data-c]").forEach((b) => {
            b.setAttribute("aria-pressed", String(b.dataset.c === armed));
          });
          slots.forEach((s) => {
            const got = assign[s.dataset.ch];
            s.classList.toggle("filled", !!got);
            s.classList.toggle("armed", !got && !!armed);
            s.querySelector(".drop").textContent = got
              ? `throws “${got}”`
              : armed
                ? "tap here to give him this pitch"
                : "tap a sound, then tap here";
          });
          lockBtn.disabled = Object.keys(assign).length < 2;
        }

        slots.forEach((s) => {
          s.addEventListener("click", () => {
            const ch = s.dataset.ch;
            if (assign[ch]) {
              // Tapping a filled slot takes the pitch back — no dead ends.
              delete assign[ch];
            } else if (armed) {
              // A sound can only be in one glove at a time.
              for (const k of Object.keys(assign)) if (assign[k] === armed) delete assign[k];
              assign[ch] = armed;
              armed = null;
            }
            paintSounds();
          });
        });
        stage.querySelector("#bp-clear").addEventListener("click", () => {
          assign = {};
          armed = null;
          api.clearFeedback();
          paintSounds();
        });

        lockBtn.addEventListener("click", () => {
          const okHard = assign[current.hard] === LETTERS[current.hard].c;
          const okSoft = assign[current.soft] === LETTERS[current.soft].c;
          if (okHard && okSoft) {
            locked.add(current.base);
            drawBoard();
            api.feedback(
              "ok",
              `Battery locked. <span class="glyph">${current.hard}</span> with the dot says <b>${esc(
                LETTERS[current.hard].c,
              )}</b>, <span class="glyph">${current.soft}</span> without it says <b>${esc(
                LETTERS[current.soft].c,
              )}</b>. One dot, two pitches.`,
            );
            drawWarmup();
            return;
          }
          soundMiss++;
          if (soundMiss === 1) {
            api.feedback(
              "no",
              "Right shapes — wrong pitches. You've got the two sounds swapped. The <b>only</b> thing that changed between these two letters is the dot inside, so let the dot decide.",
            );
          } else if (soundMiss === 2) {
            api.feedback(
              "tip",
              `Half a hint: the one carrying the dot is <b>${esc(
                shortName(LETTERS[current.hard]),
              )}</b>, and its dot-less twin is <b>${esc(
                shortName(LETTERS[current.soft]),
              )}</b>. Two different names, so two different sounds — which is which?`,
            );
          } else {
            api.feedback(
              "tip",
              `<span class="glyph">${current.hard}</span> — dot in — says <b>${esc(
                LETTERS[current.hard].c,
              )}</b> (${esc(LETTERS[current.hard].say)}). Take the dot out and <span class="glyph">${
                current.soft
              }</span> says <b>${esc(LETTERS[current.soft].c)}</b>.`,
            );
          }
          assign = {};
          armed = null;
          paintSounds();
        });

        paintSounds();
      }

      // ----------------------------------------- bonus: one warm-up pitch
      // A locked battery is knowledge about a letter; this turns it straight
      // back into reading — the same letter, now wearing a vowel.
      function drawWarmup() {
        const ch = pick([current.hard, current.soft]);
        const s = syl(ch, pick(unit.vowelPool));
        const last = locked.size >= board.length;
        stepHost.innerHTML =
          "<b>Warm-up pitch.</b> Say this one out loud <b>first</b>, then tap it to check yourself.";
        stage.innerHTML = `
          <button class="bat-pitch" type="button" id="bp-pitch">
            <span class="glyph">${s.heb}</span>
            <span class="peek">tap to check</span>
          </button>
          <button class="btn primary block" type="button" id="bp-next" disabled>
            ${last ? "🏆 Finish the inning" : "⚾ Back to the bullpen"}
          </button>`;
        const pitch = stage.querySelector("#bp-pitch");
        const next = stage.querySelector("#bp-next");
        pitch.addEventListener("click", () => {
          pitch.querySelector(".peek").innerHTML = trHtml(s);
          next.disabled = false;
          say(s.heb, s.tr);
        });
        next.addEventListener("click", () => {
          if (!last) {
            current = null;
            drawPairPhase();
            return;
          }
          stepHost.innerHTML = `<b>Bullpen's empty.</b> Every pitcher found his catcher.${
            loners.length
              ? ` ${esc(shortName(LETTERS[loners[0]]))} never needed one — no dot, no twin, one pitch all night.`
              : ""
          }`;
          stage.innerHTML = "";
          api.win(
            "🏆 Every battery matched. You read the dot, not just the shape — that's the whole inning.",
          );
        });
      }

      drawBoard();
      drawPairPhase();
    },
  });
})();
