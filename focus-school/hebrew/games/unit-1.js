/* 1st Inning game — LINEUP BUILDER.
 *
 * Mechanic: two-component crafting. The coach calls a sound for each spot in
 * the batting order; the player MANUFACTURES that sound by snapping a letter
 * card onto a vowel card and sending the result out to the field. The reading
 * skill IS the mechanic — there is no multiple-choice list of syllables to
 * guess from, you have to build the one you want.
 *
 * Calm by design: no clock, unlimited attempts, and a wrong build tells you
 * WHICH half is off (letter or vowel) without handing over the answer.
 */
(function () {
  "use strict";

  HEB.registerGame({
    name: "Lineup Builder",
    goal: "The coach calls a sound. Snap a letter onto a vowel to build it, then send that player out to the field.",
    blurb: "Build six players by combining a letter card with a vowel card.",

    mount(root, api) {
      const { unit, syl, trHtml, say, shuffle, pick, el, esc } = api;
      const letters = unit.letterPool;
      const vowels = unit.vowelPool;

      api.style(`
        .lineup-card{display:grid;gap:8px;margin-bottom:14px}
        .lu-slot{display:grid;grid-template-columns:auto 1fr auto auto;align-items:center;gap:10px;
          background:rgba(0,0,0,.28);border:1px solid var(--line);border-radius:12px;padding:9px 12px}
        .lu-slot.next{border-color:var(--lights);background:rgba(255,209,102,.1)}
        .lu-slot.done{border-color:var(--good);background:rgba(95,209,140,.12)}
        .lu-n{font-weight:900;width:24px;height:24px;border-radius:50%;display:grid;place-items:center;
          background:rgba(255,255,255,.14);font-size:.82rem}
        .lu-pos{font-size:.9rem;color:var(--muted);font-weight:700}
        .lu-want{font-size:.92rem;color:var(--muted)}
        .lu-want b{color:var(--lights)}
        .lu-slot.done .lu-want b{color:var(--good)}
        .lu-got{font-size:1.9rem;min-width:2.2ch;text-align:center}
        .workbench{background:rgba(0,0,0,.3);border:1px dashed var(--line);border-radius:14px;padding:14px}
        .wb-title{font-size:.72rem;letter-spacing:1.2px;text-transform:uppercase;color:var(--muted);font-weight:900}
        .wb-call{margin:6px 0 12px;font-size:1.02rem}
        .wb-call b{color:var(--lights)}
        .wb-coach{color:var(--grass);font-weight:900}
        .wb-racks{display:grid;gap:10px;margin-bottom:10px}
        .wb-rack-label{font-size:.78rem;color:var(--muted);font-weight:800;margin-bottom:4px}
        .wb-stage{display:flex;align-items:center;justify-content:center;gap:14px;min-height:74px;
          background:rgba(0,0,0,.3);border-radius:12px;margin-bottom:10px;padding:6px 10px;flex-wrap:wrap}
        .wb-preview{font-size:3.2rem}
        .wb-says{font-size:1.05rem}
      `);

      const POSITIONS = [
        ["1", "Leadoff", "🧢"],
        ["2", "Second", "🥎"],
        ["3", "Cleanup", "🏏"],
        ["4", "Catcher", "🧤"],
        ["5", "Shortstop", "⚡"],
        ["6", "Center field", "🌾"],
      ];

      // Build six DISTINCT target sounds so the lineup can't be filled by
      // repeating one lucky combo.
      const allSounds = [];
      const seen = new Set();
      for (const L of letters) {
        for (const V of vowels) {
          const s = syl(L, V);
          if (!s || seen.has(s.tr)) continue;
          seen.add(s.tr);
          allSounds.push(s);
        }
      }
      const targets = shuffle(allSounds).slice(0, POSITIONS.length);
      while (targets.length < POSITIONS.length) targets.push(pick(allSounds));

      let filled = 0;
      let curL = null;
      let curV = null;
      let misses = 0;

      root.innerHTML = `
        <div class="lineup-card" id="lu-card"></div>
        <div class="workbench">
          <div class="wb-title">Your workbench</div>
          <div class="wb-call" id="lu-call"></div>
          <div class="wb-racks">
            <div>
              <div class="wb-rack-label">Letter cards</div>
              <div class="blend-pick" id="lu-letters" role="group" aria-label="Letter cards"></div>
            </div>
            <div>
              <div class="wb-rack-label">Vowel cards</div>
              <div class="blend-pick" id="lu-vowels" role="group" aria-label="Vowel cards"></div>
            </div>
          </div>
          <div class="wb-stage">
            <span class="wb-preview glyph" id="lu-preview">—</span>
            <span class="wb-says" id="lu-says"></span>
          </div>
          <button class="btn primary block" type="button" id="lu-send" disabled>
            ⚾ Send him out to the field
          </button>
        </div>`;

      const cardHost = root.querySelector("#lu-card");
      const callHost = root.querySelector("#lu-call");
      const preview = root.querySelector("#lu-preview");
      const says = root.querySelector("#lu-says");
      const sendBtn = root.querySelector("#lu-send");

      function drawLineup() {
        cardHost.innerHTML = "";
        POSITIONS.forEach(([n, name, emoji], i) => {
          const t = targets[i];
          const isNext = i === filled;
          const isDone = i < filled;
          const slot = el(`<div class="lu-slot${isDone ? " done" : ""}${isNext ? " next" : ""}">
            <span class="lu-n">${n}</span>
            <span class="lu-pos">${emoji} ${esc(name)}</span>
            <span class="lu-want">${isDone ? "" : "wanted: "}<b>${esc(t.tr)}</b></span>
            <span class="lu-got glyph">${isDone ? t.heb : "—"}</span>
          </div>`);
          cardHost.appendChild(slot);
        });
        api.setHud(
          `<span class="stat">Lineup ${filled}/${POSITIONS.length}</span>` +
            `<span class="stat">Bench ${POSITIONS.length - filled}</span>`,
        );
      }

      function drawCall() {
        if (filled >= POSITIONS.length) {
          callHost.innerHTML = "<b>Lineup card is full.</b>";
          return;
        }
        const t = targets[filled];
        const [, name, emoji] = POSITIONS[filled];
        callHost.innerHTML = `<span class="wb-coach">Coach:</span> “Give me a <b>${esc(
          t.tr,
        )}</b> at ${emoji} ${esc(name)}.”`;
      }

      const lWrap = root.querySelector("#lu-letters");
      const vWrap = root.querySelector("#lu-vowels");

      letters.forEach((ch) => {
        const b = el(
          `<button class="chip" type="button" data-l="${ch}" aria-pressed="false"><span class="glyph">${ch}</span><small>${esc(
            api.LETTERS[ch].c || "silent",
          )}</small></button>`,
        );
        b.addEventListener("click", () => {
          curL = ch;
          paint();
        });
        lWrap.appendChild(b);
      });
      vowels.forEach((k) => {
        const V = api.VOWELS[k];
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
        lWrap.querySelectorAll("[data-l]").forEach((b) => {
          b.setAttribute("aria-pressed", String(b.dataset.l === curL));
        });
        vWrap.querySelectorAll("[data-v]").forEach((b) => {
          b.setAttribute("aria-pressed", String(b.dataset.v === curV));
        });
        if (curL && curV) {
          const s = syl(curL, curV);
          preview.textContent = s.heb;
          says.innerHTML = `says ${trHtml(s)}`;
          sendBtn.disabled = false;
        } else {
          preview.textContent = curL || (curV ? "א" + api.VOWELS[curV].ch : "—");
          says.innerHTML = curL
            ? '<span class="note">…now pick a vowel card.</span>'
            : '<span class="note">Pick a letter card first.</span>';
          sendBtn.disabled = true;
        }
      }

      sendBtn.addEventListener("click", () => {
        if (!curL || !curV || filled >= POSITIONS.length) return;
        const built = syl(curL, curV);
        const want = targets[filled];
        say(built.heb, built.tr);

        if (built.tr === want.tr) {
          // Accept ANY vowel that makes the right sound — Kamatz and Patach
          // really are interchangeable here, and noticing that is the lesson.
          targets[filled] = built;
          filled++;
          misses = 0;
          curL = null;
          curV = null;
          api.feedback(
            "ok",
            `<b>${esc(built.tr)}</b> — he's in. ${esc(built.L.name)} says <b>${esc(
              built.c,
            )}</b>, ${esc(built.V.name)} says <b>${esc(built.v)}</b>.`,
          );
          drawLineup();
          drawCall();
          paint();
          if (filled >= POSITIONS.length) {
            api.win("🏆 Full lineup — six players, six sounds you built yourself. Play ball!");
          }
          return;
        }

        misses++;
        // Diagnose which HALF is wrong. That's the coaching move: name the
        // error, don't name the answer.
        let msg;
        if (built.c !== want.c && built.v !== want.v) {
          msg = `Both halves are off. Coach wanted <b>${esc(want.tr)}</b>; you built <b>${esc(
            built.tr,
          )}</b>.`;
        } else if (built.c !== want.c) {
          msg = `Your vowel is right (<b>${esc(built.v)}</b>) — it's the letter. You used ${esc(
            built.L.name,
          )}, which says <b>${esc(built.c)}</b>.`;
        } else {
          msg = `Your letter is right (${esc(built.L.name)} = <b>${esc(
            built.c,
          )}</b>) — it's the vowel. Yours says <b>${esc(built.v)}</b>.`;
        }
        if (misses >= 2) {
          const hintV = api.VOWELS[want.vowel];
          msg += ` <br><b>Hint:</b> the vowel you need is <b>${esc(hintV.name)}</b> — ${esc(
            hintV.art,
          )}.`;
        }
        api.feedback("no", msg);
      });

      drawLineup();
      drawCall();
      paint();
    },
  });
})();
