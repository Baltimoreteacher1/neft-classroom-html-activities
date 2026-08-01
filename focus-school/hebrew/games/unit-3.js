/* 3rd Inning game — STRIKE ZONE.
 *
 * Mechanic: coordinate targeting. The strike zone is a grid whose ROWS are
 * letters and whose COLUMNS are vowel marks. The catcher calls a SOUND; the
 * player has to work out which row starts that sound and which column finishes
 * it, aim at the intersection, and throw. The cells stay EMPTY until a pitch
 * lands there — if the board were pre-filled the player would just hunt for a
 * matching glyph instead of blending the two halves in their head, which is
 * the entire skill this inning teaches.
 *
 * That is also why this inning gets a grid instead of a card game: unit 3 adds
 * no new letters, only new marks, so the lesson is "same row, different column
 * = different sound". Sliding one column left or right IS the lesson.
 *
 * Calm by design: no clock, unlimited throws, and a miss is a BALL, never a
 * strikeout. Misses coach in tiers — first the axis that's wrong, then one
 * half, then both — and never point at the cell.
 */
(function () {
  "use strict";

  HEB.registerGame({
    name: "Strike Zone",
    goal: "The catcher calls a sound. Find the row (letter) and the column (vowel mark) that cross to make it, then throw the pitch.",
    blurb:
      "Aim your pitch: pick the row (letter) and the column (vowel) that land the sound the catcher called.",

    mount(root, api) {
      const { unit, LETTERS, VOWELS, syl, trHtml, say, shuffle, pick, el, esc } = api;

      // ---------------------------------------------------------- board setup
      // Rows must carry DISTINCT consonant sounds and columns DISTINCT vowel
      // sounds. ת and תּ both say t; Kamatz and Patach both say ah. If either
      // pair shared the board, two different cells would say the same thing and
      // "which cell says tah?" would have two right answers — which would make
      // the miss diagnosis lie. Dedupe by SOUND, not by glyph.
      const dedupe = (keys, soundOf) => {
        const seen = new Set();
        const out = [];
        for (const k of keys) {
          const s = soundOf(k);
          if (seen.has(s)) continue;
          seen.add(s);
          out.push(k);
        }
        return out;
      };

      const letterKeys = dedupe(unit.letterPool, (ch) => LETTERS[ch].c || "·silent·");
      // New marks first, so tonight's four vowels are guaranteed columns and
      // the older ah is only along for contrast if there's room left.
      const vowelKeys = dedupe(
        unit.newVowels.filter((k) => unit.vowelPool.includes(k)).concat(unit.vowelPool),
        (k) => VOWELS[k].v,
      );

      const rows = shuffle(letterKeys).slice(0, Math.min(4, letterKeys.length));
      const cols = vowelKeys
        .slice(0, Math.min(5, vowelKeys.length))
        // Display in curriculum order so the board reads the way the chalk talk
        // introduced the marks, even though selection was newest-first.
        .sort((a, b) => unit.vowelPool.indexOf(a) - unit.vowelPool.indexOf(b));

      const R = rows.length;
      const C = cols.length;
      const cellAt = (r, c) => syl(rows[r], cols[c]);
      const isEdgeR = (r) => r === 0 || r === R - 1;
      const isEdgeC = (c) => c === 0 || c === C - 1;
      // Corners are the hardest read (both extremes of the board) and pay most.
      const zoneOf = (r, c) =>
        isEdgeR(r) && isEdgeC(c)
          ? { n: "corner", pts: 3 }
          : isEdgeR(r) || isEdgeC(c)
            ? { n: "edge", pts: 2 }
            : { n: "middle", pts: 1 };

      // ------------------------------------------------------- the at-bat plan
      const PITCHES = 9;
      const corners = [];
      const rest = [];
      for (let r = 0; r < R; r++) {
        for (let c = 0; c < C; c++) {
          (zoneOf(r, c).n === "corner" ? corners : rest).push({ r, c });
        }
      }
      // Every corner is guaranteed to be called, so "paint the corners" is a
      // goal the player can actually complete rather than a lottery.
      const plan = shuffle(
        corners.concat(shuffle(rest).slice(0, Math.max(0, PITCHES - corners.length))),
      );
      while (plan.length < PITCHES) plan.push(pick(corners.concat(rest)));

      let pitch = 0;
      let strikes = 0;
      let balls = 0;
      let pts = 0;
      let misses = 0;
      let aimR = null;
      let aimC = null;
      const painted = new Set();

      // ------------------------------------------------------------------ DOM
      api.style(`
        .sz-call{background:rgba(0,0,0,.3);border:1px solid var(--line);border-radius:14px;
          padding:12px 14px;margin-bottom:10px;display:flex;flex-wrap:wrap;align-items:center;gap:10px}
        .sz-call .lbl{font-size:.72rem;letter-spacing:1.2px;text-transform:uppercase;
          color:var(--muted);font-weight:900;display:block}
        .sz-call .snd{font-size:2.1rem;font-weight:900;color:var(--lights);line-height:1.15}
        .sz-call .zone{font-size:.84rem;color:var(--muted);font-weight:700}
        .sz-how{font-size:.9rem;color:var(--muted);margin:0 0 10px}
        .sz-scroll{overflow-x:auto;-webkit-overflow-scrolling:touch;padding:2px 2px 8px}
        .sz-grid{display:grid;gap:6px;min-width:max-content;
          grid-template-columns:auto repeat(var(--cols),minmax(58px,1fr))}
        .sz-hd{min-height:56px;padding:6px 8px;font-family:var(--heb);font-size:1.6rem}
        .sz-hd[aria-pressed="true"]{border-color:var(--lights);background:rgba(255,209,102,.2)}
        /* A lone nikud needs a carrier. ◌ (U+25CC) is the Unicode-standard one,
           but it must come from a font that ALSO has the mark or the two split
           across font runs and the mark drifts. Noto's script fonts ship ◌ for
           exactly this reason, so ask for them first. */
        .sz-col{font-family:"Noto Sans Hebrew","Arial Unicode MS",var(--heb),var(--ui)}
        .sz-blank{min-height:56px}
        .zc{min-height:56px;border:1px solid var(--line);border-radius:10px;background:rgba(0,0,0,.26);
          display:grid;place-items:center;padding:3px 2px;line-height:1.1}
        .zc .zg{font-family:var(--heb);font-size:1.55rem}
        .zc .zt{font-size:.68rem;font-weight:800;color:var(--good)}
        .zc.corner{border-style:dashed;border-color:rgba(255,209,102,.4)}
        .zc.aim-row,.zc.aim-col{background:rgba(255,209,102,.09);border-color:rgba(255,209,102,.4)}
        .zc.aim{background:rgba(255,209,102,.22);border-color:var(--lights);
          box-shadow:inset 0 0 0 2px rgba(255,209,102,.3)}
        .zc.lit{background:rgba(95,209,140,.16);border-color:rgba(95,209,140,.55)}
        .zc.ball{border-color:var(--bad);background:rgba(255,143,122,.14)}
        .sz-aim{margin:10px 0;font-size:.95rem;display:flex;flex-wrap:wrap;align-items:center;gap:10px}
        .sz-aim .pill{background:rgba(0,0,0,.3);border:1px solid var(--line);border-radius:999px;
          padding:5px 12px;font-weight:800}
        .sz-aim .pill .glyph{font-size:1.3rem;vertical-align:middle}
        .sz-legend{font-size:.8rem;color:var(--muted);margin:6px 0 0}
        /* .btn.sm is 38px tall — under the 44px touch minimum for a tablet. */
        #sz-hear,#sz-clear{min-height:44px}
      `);

      root.innerHTML = `
        <div class="sz-call">
          <div style="flex:1;min-width:150px">
            <span class="lbl">Catcher calls</span>
            <span class="snd" id="sz-snd">—</span>
            <span class="zone" id="sz-zone"></span>
          </div>
          <button class="btn sm" type="button" id="sz-hear">🔊 Say the call</button>
        </div>
        <p class="sz-how">Read the call in two pieces. The <b>front</b> of the sound picks your
          <b>row</b> (the letter). The <b>end</b> of the sound picks your <b>column</b> (the mark
          that goes under it). Tap one of each, then throw. The cells stay dark until a pitch lands.</p>
        <div class="sz-scroll">
          <div class="sz-grid" id="sz-grid" style="--cols:${C}" role="group" aria-label="Strike zone"></div>
        </div>
        <p class="sz-legend">Dashed = corners, worth 3. Edges 2, middle 1. Full value on a
          first-throw strike — after that a pitch still counts, it just scores 1.</p>
        <div class="sz-aim">
          <span id="sz-aimtxt" class="note">Pick a row and a column.</span>
          <span class="spacer"></span>
          <button class="btn sm" type="button" id="sz-clear">↺ Clear aim</button>
        </div>
        <button class="btn primary block" type="button" id="sz-throw" disabled>⚾ Throw the pitch</button>`;

      const grid = root.querySelector("#sz-grid");
      const throwBtn = root.querySelector("#sz-throw");
      const aimTxt = root.querySelector("#sz-aimtxt");

      grid.appendChild(el('<div class="sz-blank" aria-hidden="true"></div>'));
      cols.forEach((k, c) => {
        // The mark alone on a dotted circle (◌, the standard placeholder for a
        // combining mark) — no name, no sound spelling. Reading the mark is the
        // whole job; printing "ay" under it would hand over half the answer.
        const b = el(
          `<button class="btn sz-hd sz-col" type="button" data-c="${c}" aria-pressed="false"
            aria-label="Column ${c + 1}, vowel mark">◌${VOWELS[k].ch}</button>`,
        );
        b.addEventListener("click", () => {
          aimC = c;
          paint();
        });
        grid.appendChild(b);
      });
      rows.forEach((ch, r) => {
        const b = el(
          `<button class="btn sz-hd" type="button" data-r="${r}" aria-pressed="false"
            aria-label="Row ${r + 1}">${ch}</button>`,
        );
        b.addEventListener("click", () => {
          aimR = r;
          paint();
        });
        grid.appendChild(b);
        for (let c = 0; c < C; c++) {
          grid.appendChild(
            el(
              `<div class="zc${zoneOf(r, c).n === "corner" ? " corner" : ""}" data-cell="${r}-${c}"></div>`,
            ),
          );
        }
      });
      const cellEl = (r, c) => grid.querySelector(`[data-cell="${r}-${c}"]`);

      // ---------------------------------------------------------------- render
      function hud() {
        const cornersPainted = corners.filter((p) => painted.has(`${p.r}-${p.c}`)).length;
        api.setHud(
          `<span class="stat">Pitch ${Math.min(pitch + 1, PITCHES)}/${PITCHES}</span>` +
            `<span class="stat">⚾ Strikes ${strikes}</span>` +
            `<span class="stat">Balls ${balls}</span>` +
            `<span class="stat">Zone pts ${pts}</span>` +
            `<span class="stat">Corners ${cornersPainted}/${corners.length}</span>`,
        );
      }

      function paint() {
        grid.querySelectorAll("[data-r]").forEach((b) => {
          b.setAttribute("aria-pressed", String(Number(b.dataset.r) === aimR));
        });
        grid.querySelectorAll("[data-c]").forEach((b) => {
          b.setAttribute("aria-pressed", String(Number(b.dataset.c) === aimC));
        });
        for (let r = 0; r < R; r++) {
          for (let c = 0; c < C; c++) {
            const n = cellEl(r, c);
            n.classList.remove("aim", "aim-row", "aim-col", "ball");
            if (aimR === r && aimC === c) n.classList.add("aim");
            else if (aimR === r) n.classList.add("aim-row");
            else if (aimC === c) n.classList.add("aim-col");
          }
        }
        const ready = aimR !== null && aimC !== null && pitch < PITCHES;
        throwBtn.disabled = !ready;
        aimTxt.innerHTML =
          aimR === null && aimC === null
            ? '<span class="note">Pick a row and a column.</span>'
            : `<span class="pill">Row <span class="glyph">${
                aimR === null ? "—" : rows[aimR]
              }</span></span><span class="pill">Column <span class="glyph">${
                aimC === null ? "—" : "◌" + VOWELS[cols[aimC]].ch
              }</span></span>` + (ready ? "" : ' <span class="note">…one more to pick.</span>');
      }

      function drawCall() {
        const want = plan[pitch];
        const z = zoneOf(want.r, want.c);
        root.querySelector("#sz-snd").textContent = cellAt(want.r, want.c).tr;
        root.querySelector("#sz-zone").textContent =
          `${z.n} of the zone · worth ${z.pts} point${z.pts === 1 ? "" : "s"}`;
      }

      // ----------------------------------------------------------- the throw
      root.querySelector("#sz-hear").addEventListener("click", () => {
        // Empty Hebrew on purpose: the engine then reads the sound SPELLING, so
        // hearing the call never shows which cell it lives in.
        if (pitch < PITCHES) say("", cellAt(plan[pitch].r, plan[pitch].c).tr);
      });
      root.querySelector("#sz-clear").addEventListener("click", () => {
        aimR = null;
        aimC = null;
        api.clearFeedback();
        paint();
      });

      throwBtn.addEventListener("click", () => {
        if (aimR === null || aimC === null || pitch >= PITCHES) return;
        const want = plan[pitch];
        const target = cellAt(want.r, want.c);

        if (aimR === want.r && aimC === want.c) {
          const z = zoneOf(want.r, want.c);
          const gained = misses === 0 ? z.pts : 1;
          pts += gained;
          strikes++;
          painted.add(`${want.r}-${want.c}`);
          const n = cellEl(want.r, want.c);
          n.classList.add("lit");
          n.innerHTML = `<span class="zg">${target.heb}</span><span class="zt">${esc(target.tr)}</span>`;
          say(target.heb, target.tr);
          api.feedback(
            "ok",
            `<b>Strike — ${z.n} painted, +${gained}.</b> ${trHtml(target)} : ${esc(
              target.L.name,
            )} says <b>${esc(target.c || "nothing")}</b>, ${esc(target.V.name)} says <b>${esc(
              target.v,
            )}</b>.`,
          );
          pitch++;
          misses = 0;
          aimR = null;
          aimC = null;
          hud();
          paint();
          if (pitch >= PITCHES) {
            const cp = corners.filter((p) => painted.has(`${p.r}-${p.c}`)).length;
            api.win(
              `🏆 At-bat over — ${strikes} strikes, ${pts} zone points, ${cp}/${corners.length} corners painted. ` +
                `Same letters all inning; you found a different sound in every column.`,
            );
          } else {
            drawCall();
          }
          return;
        }

        // ------------------------------------------------------ ball + coaching
        balls++;
        misses++;
        cellEl(aimR, aimC).classList.add("ball");
        // Force a genuine re-aim before the next throw. Without this a stray
        // double-tap would rack up balls on the same cell and learn nothing.
        throwBtn.disabled = true;
        const rowOk = aimR === want.r;
        const colOk = aimC === want.c;
        const V = VOWELS[cols[want.c]];
        const L = LETTERS[rows[want.r]];

        // Tier 1 — name the axis that's off. Nothing about the answer itself.
        let msg = rowOk
          ? "Ball. Your <b>row is right</b> — that letter does start the call. It's the mark <b>underneath</b> it: wrong column."
          : colOk
            ? "Ball. Your <b>column is right</b> — that mark makes the right vowel sound. It's the <b>row</b>: that letter doesn't start the call."
            : "Ball — both axes are off. Split the call in two: the sound at the <b>front</b> is the row, the sound at the <b>end</b> is the column.";

        // Tier 2 — exactly ONE half, and never the coordinate. If both axes were
        // wrong, the vowel is the half worth naming: this inning is about marks.
        if (misses === 2) {
          msg += colOk
            ? ` <br><b>Hint:</b> the letter you want is <b>${esc(L.name)}</b> — it says <b>${esc(
                L.c || "nothing",
              )}</b>. Find that row.`
            : ` <br><b>Hint:</b> the mark you want is <b>${esc(V.name)}</b> — look for ${esc(
                V.art,
              )}. Find that column.`;
        } else if (misses >= 3) {
          // Tier 3+ — both halves named. Still no coordinate: they place it.
          msg += ` <br><b>Bigger hint:</b> row = <b>${esc(L.name)}</b> (says ${esc(
            L.c || "nothing",
          )}), column = <b>${esc(V.name)}</b> (${esc(V.art)}, says ${esc(V.v)}).`;
        }
        api.feedback("no", msg);
        hud();
      });

      drawCall();
      hud();
      paint();
    },
  });
})();
