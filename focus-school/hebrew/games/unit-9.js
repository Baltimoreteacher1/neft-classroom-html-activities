/* 9th Inning game — CLOSE OUT THE INNING.
 *
 * The payoff for the whole nine-inning arc. Two phases, both real games:
 *
 *   1. RECORD THREE OUTS. Every batter is a real word from the unit with its
 *      LAST letter stripped off. The player reads the sound spelling, works out
 *      what sound the word has to finish on, and brings that closer in from the
 *      bullpen — tap a card, tap the empty box, send him in.
 *
 *      The bullpen deliberately stocks BOTH forms of every letter on the table
 *      (נ and ן, כ and ך …). So the player has to know two separate things to
 *      record an out: that ן is still n / ך is still ch (the sound survives the
 *      shape change), and that only a final form is allowed to end a word.
 *      Every final on the table brings its twin along, so the presence of the
 *      answer's twin is never a tell.
 *
 *   2. THE SAVE. Real siddur lines. Tap every word that ends on a closer, then
 *      commit. This is the skill in the wild: a tail dropping below the line is
 *      the best "this word is over" signal Hebrew has. One of the lines has NO
 *      closers in it at all, which is the point — you have to actually read.
 *
 * Calm by design: no clock, unlimited attempts, and misses answer with a
 * diagnosis instead of the answer. Nothing Hebrew is hard-coded here — the
 * batters, the closers and the lines all come out of api.unit / HEB_DATA.FINALS.
 */
(function () {
  "use strict";

  HEB.registerGame({
    name: "Close Out the Inning",
    goal: "Bring the right closer in from the bullpen to finish each word, then record the save by finding every closer hiding in a real siddur line.",
    blurb:
      "Every word is one letter short. Pick the closer whose sound finishes it — then close out the siddur.",

    mount(root, api) {
      const { unit, LETTERS, say, shuffle, el, esc } = api;
      // The one source of truth for "which letters change shape at the end".
      const FINALS = window.HEB_DATA.FINALS;

      api.style(`
        .cl-say{margin:0 0 12px}
        /* Every target in this game clears 44px, including the shared .btn.sm
           secondaries — scoped so no other inning's buttons move. */
        #cl-stage .btn.sm{min-height:44px}
        .cl-panel{background:rgba(0,0,0,.3);border:1px solid var(--line);border-radius:14px;
          padding:13px;margin-bottom:12px}
        .cl-label{font-size:.68rem;letter-spacing:1.2px;text-transform:uppercase;color:var(--muted);
          font-weight:900;margin-bottom:8px}
        .cl-word{font-family:var(--heb);direction:rtl;unicode-bidi:isolate;font-size:2.6rem;
          line-height:1.85;display:flex;align-items:center;justify-content:center;gap:4px;flex-wrap:wrap}
        .cl-slot{font:inherit;min-width:1.5em;min-height:52px;padding:0 .1em;cursor:pointer;
          border:2px dashed var(--lights);border-radius:12px;background:rgba(255,209,102,.09);
          color:var(--lights);display:inline-flex;align-items:center;justify-content:center}
        .cl-slot.filled{border-style:solid;background:rgba(255,209,102,.2);color:var(--chalk)}
        .cl-slot.good{border-style:solid;border-color:var(--good);background:rgba(95,209,140,.18);
          color:var(--chalk);animation:cl-gate .5s ease}
        .cl-slot[disabled]{cursor:default;opacity:1}
        @keyframes cl-gate{from{transform:translateY(-30px) scale(.65);opacity:0}to{transform:none;opacity:1}}
        .cl-clue{text-align:center;margin:6px 0 0;font-size:.98rem}
        .cl-clue b{color:#9fd7ff}
        .cl-clue .en{color:var(--muted)}
        .cl-pen{display:flex;flex-wrap:wrap;gap:9px;justify-content:center}
        .cl-card{min-width:62px;min-height:66px;padding:2px 10px;cursor:pointer;font:inherit;
          color:var(--chalk);border:1px solid var(--line);border-radius:13px;
          background:linear-gradient(165deg,#16354a,#0e2434);display:grid;place-items:center}
        .cl-card .g{font-family:var(--heb);font-size:2.1rem;line-height:1.4}
        .cl-card[aria-pressed="true"]{border-color:var(--lights);background:rgba(255,209,102,.2)}
        .cl-card[disabled]{opacity:.32;cursor:default}
        .cl-dots span{color:rgba(255,255,255,.24);letter-spacing:2px}
        .cl-dots span.on{color:var(--clay)}
        .cl-line{font-family:var(--heb);direction:rtl;unicode-bidi:isolate;font-size:1.8rem;
          display:flex;flex-wrap:wrap;gap:7px;justify-content:flex-start;margin-bottom:4px}
        .cl-tok{font:inherit;color:var(--chalk);cursor:pointer;padding:1px 9px;min-height:46px;min-width:46px;
          border:2px solid transparent;border-radius:11px;background:rgba(255,255,255,.05)}
        .cl-tok[aria-pressed="true"]{background:rgba(255,209,102,.22);border-color:var(--lights)}
        .cl-tok.hit{background:rgba(95,209,140,.2);border-color:var(--good)}
        .cl-tok.mistake{border-color:var(--bad)}
        .cl-sep{font-family:var(--heb);font-size:1.8rem;color:var(--muted);padding:0 2px}
        .cl-reveal{direction:ltr;text-align:left;margin-top:6px;font-size:.95rem}
        .cl-final{text-align:center;padding:6px 0}
        .cl-final .big{font-size:2.6rem;line-height:1.2}
        @media (max-width:560px){
          .cl-word{font-size:2.15rem}
          .cl-line{font-size:1.6rem}
        }
      `);

      // ------------------------------------------------------ word plumbing
      // Nikud, dageshim and punctuation all sit AROUND the consonants, so the
      // only safe way to ask "what does this word end with" is to look at the
      // last base consonant (U+05D0–U+05EA) and ignore everything else. That is
      // what makes בָּרוּךְ (trailing sheva) and הָעוֹלָם and a line-final "חֶדֶר."
      // all read correctly.
      const isBase = (c) => c >= "א" && c <= "ת";
      function lastBaseIndex(s) {
        for (let i = s.length - 1; i >= 0; i--) if (isBase(s[i])) return i;
        return -1;
      }
      function endsWithCloser(token) {
        const i = lastBaseIndex(token);
        return i >= 0 && FINALS.has(token[i]);
      }
      // stem = the word minus its last letter; tail = that letter WITH its vowel,
      // so putting the closer back restores exactly what the siddur prints.
      function splitEnding(word) {
        const i = lastBaseIndex(word);
        return i < 0 ? null : { stem: word.slice(0, i), tail: word.slice(i), ch: word[i] };
      }
      // In Unicode's Hebrew block every final form sits immediately before its
      // ordinary form (ך05DA/כ05DB, ם05DD/מ05DE, ן05DF/נ05E0, ף05E3/פ05E4,
      // ץ05E5/צ05E6). Deriving the twin that way keeps this file free of
      // hard-coded letters and free of a lookup table that could drift.
      function twinOf(ch) {
        const t = String.fromCharCode(ch.charCodeAt(0) + 1);
        return LETTERS[t] ? t : "";
      }

      // ------------------------------------------------------------ the card
      const OUTS = 3;
      const knownFinals = [...FINALS].filter((c) => LETTERS[c] && unit.allLetters.includes(c));
      // Scale to the supply: 3 innings if the unit has 9+ closer words, fewer if not.
      const batters = shuffle(unit.words.filter((w) => endsWithCloser(w.heb))).slice(0, OUTS * 3);
      const innings = Math.ceil(batters.length / OUTS);
      const saves = (unit.siddur || []).map((src) => {
        const toks = String(src.heb).split(/\s+/).filter(Boolean);
        return { src, toks, flags: toks.map(endsWithCloser) };
      });

      let phase = batters.length ? "outs" : "save";
      let bi = 0; // batter index
      let si = 0; // siddur-line index
      let outs = 0;
      let savesMade = 0;

      root.innerHTML = `<p class="note cl-say" id="cl-say"></p><div id="cl-stage"></div>`;
      const stage = root.querySelector("#cl-stage");
      const sayLine = root.querySelector("#cl-say");

      function drawHud() {
        const bits = [];
        if (batters.length) {
          const inning = Math.min(innings, Math.floor(outs / OUTS) + 1);
          const start = (inning - 1) * OUTS;
          const cap = Math.min(OUTS, batters.length - start);
          const lit = outs - start;
          let dots = "";
          for (let i = 0; i < cap; i++) dots += `<span class="${i < lit ? "on" : ""}">⚫</span>`;
          bits.push(`<span class="stat">Inning ${inning} of ${innings}</span>`);
          bits.push(`<span class="stat cl-dots">Outs ${dots}</span>`);
        }
        if (saves.length)
          bits.push(`<span class="stat">Saves ${savesMade} of ${saves.length}</span>`);
        api.setHud(bits.join(""));
      }

      // ============================================ PHASE 1 — record the outs
      function renderOut() {
        const w = batters[bi];
        const p = splitEnding(w.heb);
        const answer = p.ch;
        let selected = ""; // card in your hand
        let placed = ""; // card standing on the mound
        let misses = 0; // any wrong call — governs when the coach is earned
        let soundMisses = 0; // wrong CLOSER only — governs the sound hint ladder

        sayLine.innerHTML =
          "Three outs to an inning. Read the sound spelling, work out what sound the word has to <b>finish</b> on, and bring in the closer who makes it.";

        stage.innerHTML = `
          <div class="cl-panel">
            <div class="cl-label">Now batting — one letter short</div>
            <div class="cl-word">
              <span>${esc(p.stem)}</span>
              <button class="cl-slot" type="button" id="cl-slot">?</button>
            </div>
            <p class="cl-clue">it sounds like <b>${esc(w.tr)}</b>
              <span class="en">· it means ${esc(w.en)}</span></p>
          </div>
          <div class="cl-panel">
            <div class="cl-label">Bullpen — tap a closer, then tap the empty box</div>
            <div class="cl-pen" id="cl-pen" role="group" aria-label="Bullpen cards"></div>
          </div>
          <button class="btn primary block" type="button" id="cl-go" disabled>⚾ Bring him in</button>
          <div class="row" style="margin-top:9px">
            <button class="btn sm" type="button" id="cl-hear">🔊 Hear how it sounds</button>
            <span class="spacer"></span>
            <button class="btn sm" type="button" id="cl-coach" hidden>📞 Call the pitching coach</button>
          </div>`;

        const pen = stage.querySelector("#cl-pen");
        const slot = stage.querySelector("#cl-slot");
        const go = stage.querySelector("#cl-go");
        const coach = stage.querySelector("#cl-coach");

        // Two or three finals on the table, each with its ordinary twin, so the
        // player must rule out shapes AND match sounds. No card is labelled with
        // its sound — that would hand over the whole lesson.
        const picks = shuffle(
          [answer].concat(shuffle(knownFinals.filter((c) => c !== answer)).slice(0, 2)),
        );
        const cards = shuffle(picks.concat(picks.map(twinOf).filter(Boolean)));
        cards.forEach((ch) => {
          const b = el(
            `<button class="cl-card" type="button" data-ch="${ch}" aria-pressed="false"
               aria-label="Closer card ${esc(LETTERS[ch] ? LETTERS[ch].name : ch)}"><span class="g">${ch}</span></button>`,
          );
          b.addEventListener("click", () => {
            selected = ch;
            paint();
          });
          pen.appendChild(b);
        });

        function paint() {
          pen.querySelectorAll(".cl-card").forEach((b) => {
            b.setAttribute("aria-pressed", String(b.dataset.ch === selected));
          });
          slot.textContent = placed || "?";
          slot.classList.toggle("filled", !!placed);
          slot.setAttribute(
            "aria-label",
            placed
              ? "A closer is on the mound — tap to send him back"
              : "Empty last letter — tap to place the closer you picked",
          );
          go.disabled = !placed;
        }

        slot.addEventListener("click", () => {
          if (placed) {
            placed = "";
            selected = "";
            paint();
            return;
          }
          if (!selected) {
            api.toast("Tap a closer in the bullpen first, then tap the box.");
            return;
          }
          placed = selected;
          selected = "";
          paint();
        });

        stage.querySelector("#cl-hear").addEventListener("click", () => say(w.heb, w.tr));

        coach.addEventListener("click", () => {
          coach.disabled = true;
          const A = LETTERS[answer];
          api.feedback(
            "tip",
            `<b>Pitching coach:</b> “Look for the one shaped like this — ${esc(A.note)}” Now say the word out loud one more time and listen to the very last sound.`,
          );
        });

        go.addEventListener("click", () => {
          if (!placed) return;
          const P = LETTERS[placed] || { name: placed, c: "" };

          if (placed === answer) {
            slot.textContent = p.tail; // the letter back WITH its vowel mark
            slot.classList.remove("filled");
            slot.classList.add("good");
            slot.disabled = true;
            go.disabled = true;
            pen.querySelectorAll(".cl-card").forEach((b) => (b.disabled = true));
            say(w.heb, w.tr);
            outs++;
            bi++;
            drawHud();
            api.feedback(
              "ok",
              `<b>${esc(w.tr)}</b> — ${esc(P.name)} still says <b>${esc(P.c)}</b>. Only the shape changed at the end of the word. <b>That's an out.</b>`,
            );
            if (outs % OUTS === 0 && bi < batters.length) {
              api.toast("Three up, three down — side retired. New inning.");
            }
            setTimeout(next, 1500);
            return;
          }

          misses++;
          if (misses >= 2) coach.hidden = false;

          if (!FINALS.has(placed)) {
            // The shape error. Always called out immediately, at every miss —
            // this is the rule the whole inning is built on. It deliberately
            // does NOT advance the sound ladder: a shape mistake shouldn't buy
            // you the sound on your next guess.
            api.feedback(
              "no",
              `<b>${esc(P.name)}</b> — that shape can't end a word. Look for the one with the long tail that drops below the line. (The one exception is the square Final Mem, which squares off instead.)`,
            );
          } else if (++soundMisses === 1) {
            // Tier 1 — name what's wrong with THEIR pick, not what's right.
            api.feedback(
              "no",
              `That closer says <b>${esc(P.c)}</b>. This word doesn't finish on that sound — read the sound spelling again, all the way to the last beat.`,
            );
          } else if (soundMisses === 2) {
            // Tier 2 — hand over the SOUND, never the letter.
            api.feedback(
              "no",
              `This word has to end on the sound <b>${esc(LETTERS[answer].c)}</b>. Which closer in the bullpen makes that sound?`,
            );
          } else {
            api.feedback(
              "tip",
              `Still the sound <b>${esc(LETTERS[answer].c)}</b> at the end. Tap <b>📞 Call the pitching coach</b> and he'll describe the shape you're hunting for.`,
            );
          }
          placed = "";
          paint();
        });

        paint();
        drawHud();
      }

      // ================================================ PHASE 2 — the save
      function renderSave() {
        const s = saves[si];
        const need = s.flags.filter(Boolean).length;
        const marks = s.toks.map(() => false);
        const tokEls = [];
        let misses = 0;

        sayLine.innerHTML =
          "Save situation. This is a real line out of your siddur — find <b>every</b> word that ends on a closer.";

        stage.innerHTML = `
          <div class="cl-panel">
            <div class="cl-label">The save — line ${si + 1} of ${saves.length}</div>
            <p class="note" style="margin-top:0">Tap every word that <b>ends</b> with one of the closers (${esc(
              [...FINALS].join(" "),
            )}). Tap again to unmark. If this line has none, commit with nothing marked.</p>
            <div class="cl-line" id="cl-line"></div>
            <p class="note" style="margin:8px 0 0">Means: ${esc(s.src.en)}</p>
            <div class="cl-reveal" id="cl-rev" hidden></div>
          </div>
          <button class="btn primary block" type="button" id="cl-commit">🔒 Record the save</button>`;

        const line = stage.querySelector("#cl-line");
        const rev = stage.querySelector("#cl-rev");
        const commit = stage.querySelector("#cl-commit");

        s.toks.forEach((tok, i) => {
          // A token with no consonant in it (a separator dot, punctuation) isn't
          // a word and must not be tappable.
          if (lastBaseIndex(tok) < 0) {
            line.appendChild(el(`<span class="cl-sep">${esc(tok)}</span>`));
            tokEls.push(null);
            return;
          }
          const b = el(
            `<button class="cl-tok" type="button" aria-pressed="false" aria-label="Word ${esc(tok)} — tap to mark it as ending in a closer">${esc(tok)}</button>`,
          );
          b.addEventListener("click", () => {
            marks[i] = !marks[i];
            b.setAttribute("aria-pressed", String(marks[i]));
          });
          line.appendChild(b);
          tokEls.push(b);
        });

        commit.addEventListener("click", () => {
          const wrong = marks.filter((m, i) => m && !s.flags[i]).length;
          const left = s.flags.filter((f, i) => f && !marks[i]).length;

          if (!wrong && !left) {
            s.flags.forEach((f, i) => {
              if (f && tokEls[i]) tokEls[i].classList.add("hit");
            });
            tokEls.forEach((b) => b && (b.disabled = true));
            commit.disabled = true;
            rev.hidden = false;
            rev.innerHTML = `<span class="tr"><span class="c">${esc(s.src.tr)}</span></span>`;
            say(s.src.heb, s.src.tr);
            savesMade++;
            si++;
            drawHud();
            api.feedback(
              "ok",
              need
                ? `<b>Save recorded.</b> ${need} closer${need === 1 ? "" : "s"} spotted — every one of them told you the word was finished.`
                : `<b>Save recorded</b> — and you were right that this line has no closers at all. Not marking anything took real reading.`,
            );
            setTimeout(next, 1600);
            return;
          }

          misses++;
          if (misses === 1) {
            // Tier 1 — count the problem, don't point at it.
            const parts = [];
            if (wrong)
              parts.push(
                wrong === 1
                  ? "one word you marked doesn't finish on a closer"
                  : `${wrong} of the words you marked don't finish on a closer`,
              );
            if (left)
              parts.push(
                left === 1
                  ? "one closer is still out there unmarked"
                  : `${left} closers are still out there unmarked`,
              );
            api.feedback(
              "no",
              `Not yet — ${parts.join(", and ")}. Check the <b>last</b> letter of each word: does its tail drop below the line?`,
            );
          } else if (misses === 2) {
            // Tier 2 — give the count, which narrows the search without solving it.
            api.feedback(
              "no",
              need
                ? `Closer look: this line has exactly <b>${need}</b> word${need === 1 ? "" : "s"} ending in a closer. Read it right to left and check every ending.`
                : `Closer look: this line has <b>no</b> words ending in a closer at all. Unmark everything and commit.`,
            );
          } else {
            // Tier 3 — one worked example, free. The rest is still theirs.
            const showIdx = s.flags.findIndex((f, i) => f && !marks[i]);
            if (showIdx >= 0 && tokEls[showIdx]) {
              // Mark it for them too, so the freebie really is a freebie and
              // the next commit doesn't report it as still missing.
              tokEls[showIdx].classList.add("hit");
              marks[showIdx] = true;
              tokEls[showIdx].setAttribute("aria-pressed", "true");
              api.feedback(
                "tip",
                `<b>Here's one of them, free</b> — look at how that last letter drops below the line. Now find the rest (and unmark anything that doesn't do that).`,
              );
            } else {
              const badIdx = marks.findIndex((m, i) => m && !s.flags[i]);
              if (badIdx >= 0 && tokEls[badIdx]) tokEls[badIdx].classList.add("mistake");
              api.feedback(
                "tip",
                `You've found the closers — but the word outlined in red doesn't end on one. Look at its last letter again and unmark it.`,
              );
            }
          }
        });

        drawHud();
      }

      // ------------------------------------------------------------ the flow
      function next() {
        if (phase === "outs") {
          if (bi < batters.length) return renderOut();
          phase = "save";
        }
        if (si < saves.length) return renderSave();
        finish();
      }

      function finish() {
        sayLine.textContent = "";
        stage.innerHTML = `
          <div class="cl-panel cl-final">
            <div class="big">🏆</div>
            <div class="cl-label" style="margin-top:6px">Final</div>
            <p style="margin:4px 0 0"><b>${outs} out${outs === 1 ? "" : "s"}</b> recorded and
              <b>${savesMade} save${savesMade === 1 ? "" : "s"}</b> in the book.</p>
            <p class="note" style="margin:8px 0 0">Five letters change shape at the end of a word —
              and not one of them changed its sound. That tail under the line is Hebrew telling you
              the word is over, and now you can read it.</p>
          </div>`;
        drawHud();
        api.win("🏆 Game over — you closed it out. Nine innings, and you just read the siddur.");
      }

      drawHud();
      next();
    },
  });
})();
