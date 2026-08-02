/* Nightly Hebrew — blending.
 *
 *   blender (required) The Blending Machine — free play (snap ANY letter onto
 *                      ANY vowel and watch the sound come out), then a twelve
 *                      pitch challenge with the answer hidden.
 *   reverse (bonus)    Sound to Sign — the same skill backwards. Given a
 *                      sound, BUILD it. Recognising "dah" and producing "dah"
 *                      are different skills and only one of them was ever
 *                      being practised.
 */
(function () {
  "use strict";

  HEB.registerActivity({
    id: "blender",
    title: "⚙️ The Blending Machine",
    how: "Play with the machine as long as you like, then take the twelve-pitch challenge without looking.",
    mount(root, api) {
      const { unit, el, $ } = api;
      const letters = unit.letterPool;
      const vowels = unit.vowelPool;
      root.innerHTML = `
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
          <button class="btn primary sm" type="button" id="bl-start">Start the 12-pitch challenge →</button>
        </div>
        <div id="bl-challenge" hidden class="sub-panel"></div>`;

      let curL = letters[letters.length - 1];
      let curV = vowels[vowels.length - 1];
      const lWrap = $("#bl-letters", root);
      const vWrap = $("#bl-vowels", root);

      letters.forEach((ch) => {
        const b = el(
          `<button class="chip" type="button" data-l="${ch}" aria-pressed="false"><span class="glyph">${ch}</span><small>${api.esc(
            api.LETTERS[ch].c || "silent",
          )}</small></button>`,
        );
        b.addEventListener("click", () => {
          curL = ch;
          paint();
          api.say(api.syl(curL, curV).heb, api.syl(curL, curV).tr);
        });
        lWrap.appendChild(b);
      });
      vowels.forEach((k) => {
        const V = api.VOWELS[k];
        const b = el(
          `<button class="chip" type="button" data-v="${k}" aria-pressed="false"><span class="glyph">א${V.ch}</span><small>${api.esc(
            V.v,
          )}</small></button>`,
        );
        b.addEventListener("click", () => {
          curV = k;
          paint();
          api.say(api.syl(curL, curV).heb, api.syl(curL, curV).tr);
        });
        vWrap.appendChild(b);
      });

      function paint() {
        const s = api.syl(curL, curV);
        $("#bl-l", root).textContent = curL;
        $("#bl-v", root).textContent = "א" + api.VOWELS[curV].ch;
        $("#bl-r", root).textContent = s.heb;
        $("#bl-say", root).innerHTML = `${api.trHtml(s)} &nbsp;·&nbsp; <span class="note">${api.esc(
          api.LETTERS[curL].c
            ? api.LETTERS[curL].name + " says " + api.LETTERS[curL].c
            : api.LETTERS[curL].name + " is silent",
        )}, ${api.esc(api.VOWELS[curV].name)} says ${api.esc(api.VOWELS[curV].v)}</span>`;
        lWrap.querySelectorAll("[data-l]").forEach((b) => {
          b.setAttribute("aria-pressed", String(b.dataset.l === curL));
        });
        vWrap.querySelectorAll("[data-v]").forEach((b) => {
          b.setAttribute("aria-pressed", String(b.dataset.v === curV));
        });
      }
      paint();
      $("#bl-hear", root).addEventListener("click", () => {
        const s = api.syl(curL, curV);
        api.say(s.heb, s.tr);
      });
      $("#bl-roll", root).addEventListener("click", () => {
        curL = api.pick(letters);
        curV = api.pick(vowels);
        paint();
        const s = api.syl(curL, curV);
        api.say(s.heb, s.tr);
      });

      $("#bl-start", root).addEventListener("click", () => {
        const wrap = $("#bl-challenge", root);
        wrap.hidden = false;
        $("#bl-start", root).disabled = true;
        wrap.innerHTML = '<h4 class="sub-h">⚾ Twelve pitches</h4>';
        api.quiz(wrap, {
          total: 12,
          unitWord: "Pitch",
          winNote: "You are reading the vowel, not guessing it.",
          tryNote:
            "Good reps. Scroll back up to the machine and play with the ones that tripped you.",
          next(i) {
            // Prefer tonight's NEW material, but keep a third of the pitches
            // from earlier units so review is baked in rather than optional.
            const wantNew = (unit.newLetters.length || unit.newVowels.length) && (i + 1) % 3 !== 0;
            const L =
              wantNew && unit.newLetters.length
                ? api.pick(unit.newLetters.filter((x) => letters.includes(x)))
                : api.pick(letters);
            const V =
              wantNew && unit.newVowels.length ? api.pick(unit.newVowels) : api.pick(vowels);
            const s = api.syl(L || api.pick(letters), V || api.pick(vowels));
            return blendQ(api, s, letters, vowels);
          },
          onFinish() {
            api.done();
          },
        });
        wrap.scrollIntoView({ behavior: "smooth", block: "center" });
      });
    },
  });

  // Distractors are deliberately CLOSE: same consonant/different vowel, and
  // same vowel/different consonant. Guessing by elimination shouldn't work.
  function blendQ(api, s, letters, vowels) {
    const out = new Set();
    for (const k of api.shuffle(vowels.slice())) {
      if (k === s.vowel) continue;
      const d = api.syl(s.letter, k);
      if (d && d.tr !== s.tr) out.add(d.tr);
      if (out.size >= 2) break;
    }
    for (const ch of api.shuffle(letters.slice())) {
      if (ch === s.letter) continue;
      const d = api.syl(ch, s.vowel);
      if (d && d.tr !== s.tr) out.add(d.tr);
      if (out.size >= 3) break;
    }
    return {
      qHtml: `<span class="glyph xl">${s.heb}</span>`,
      answer: s.tr,
      choices: [s.tr, ...out],
      sayHeb: s.heb,
      sayTr: s.tr,
      hint1:
        "Not that one. Look at the mark <b>under</b> the letter first — which vowel is it? Then say the letter's sound in front of it.",
      hint2: `Hint: the vowel is <b>${api.esc(s.V.name)}</b>, and it says <b>${api.esc(
        s.v,
      )}</b>. Now which letter is in front of it?`,
      hint3: `Hint: the letter is <b>${api.esc(s.L.name)}</b> (${api.esc(
        s.c || "silent",
      )}) and the vowel says <b>${api.esc(s.v)}</b>.`,
      explain: `<b>${api.esc(s.tr)}</b> — ${api.esc(s.L.name)} says <b>${api.esc(
        s.c || "nothing",
      )}</b>, ${api.esc(s.V.name)} says <b>${api.esc(s.v)}</b>.`,
    };
  }

  // ---------------------------------------------------------- sound to sign
  HEB.registerActivity({
    id: "reverse",
    title: "🔁 Sound to Sign",
    how: "Eight rounds the other way round: you get the sound, you build the Hebrew.",
    mount(root, api) {
      const { unit, el, $ } = api;
      const letters = unit.letterPool;
      const vowels = unit.vowelPool;
      root.innerHTML = `
        <p class="note">Reading a sound and <b>making</b> one are two different skills. This is the second one.</p>
        <div class="row"><b id="rv-count">Build 1 of 8</b><span class="spacer"></span><span class="note" id="rv-score"></span></div>
        <div class="target" id="rv-target"></div>
        <div class="blend-pick" id="rv-letters" role="group" aria-label="Pick a letter"></div>
        <div class="blend-pick" id="rv-vowels" role="group" aria-label="Pick a vowel"></div>
        <div class="blend-stage compact">
          <div class="slot"><small>your build</small><span class="glyph lg" id="rv-out">·</span></div>
        </div>
        <div class="row"><button class="btn primary sm" type="button" id="rv-check">Check it</button>
        <button class="btn sm" type="button" id="rv-clear">Clear</button></div>
        <div class="feedback" id="rv-fb"></div>`;

      const TOTAL = 8;
      let n = 0;
      let right = 0;
      let misses = 0;
      let target = null;
      let selL = null;
      let selV = null;
      const lWrap = $("#rv-letters", root);
      const vWrap = $("#rv-vowels", root);
      const fbn = $("#rv-fb", root);

      letters.forEach((ch) => {
        const b = el(
          `<button class="chip" type="button" data-l="${ch}" aria-pressed="false"><span class="glyph">${ch}</span><small>${api.esc(
            api.LETTERS[ch].c || "silent",
          )}</small></button>`,
        );
        b.addEventListener("click", () => {
          selL = ch;
          paint();
        });
        lWrap.appendChild(b);
      });
      vowels.forEach((k) => {
        const V = api.VOWELS[k];
        const b = el(
          `<button class="chip" type="button" data-v="${k}" aria-pressed="false"><span class="glyph">א${V.ch}</span><small>${api.esc(
            V.v,
          )}</small></button>`,
        );
        b.addEventListener("click", () => {
          selV = k;
          paint();
        });
        vWrap.appendChild(b);
      });

      function paint() {
        const out = $("#rv-out", root);
        out.textContent = selL
          ? selL + (selV ? api.VOWELS[selV].ch : "")
          : selV
            ? "א" + api.VOWELS[selV].ch
            : "·";
        lWrap.querySelectorAll("[data-l]").forEach((b) => {
          b.setAttribute("aria-pressed", String(b.dataset.l === selL));
        });
        vWrap.querySelectorAll("[data-v]").forEach((b) => {
          b.setAttribute("aria-pressed", String(b.dataset.v === selV));
        });
      }

      function nextBuild() {
        if (n >= TOTAL) {
          $("#rv-target", root).innerHTML =
            `<div class="qdone">${right >= TOTAL - 2 ? "🏆" : "⚾"}</div>`;
          $("#rv-count", root).textContent = "Round complete";
          $("#rv-check", root).disabled = true;
          api.fb(
            fbn,
            right >= TOTAL - 2 ? "ok" : "tip",
            `<b>${right} of ${TOTAL} built clean.</b> Building a sound from scratch is harder than recognising one — this is the skill that makes writing possible later.`,
          );
          api.done();
          return;
        }
        n++;
        misses = 0;
        selL = null;
        selV = null;
        const L = api.pick(unit.newLetters.length ? unit.newLetters : letters);
        const V = api.pick(unit.newVowels.length && n % 2 === 0 ? unit.newVowels : vowels);
        target = api.syl(letters.includes(L) ? L : api.pick(letters), V);
        $("#rv-count", root).textContent = `Build ${n} of ${TOTAL}`;
        $("#rv-score", root).textContent = `${right} clean`;
        $("#rv-target", root).innerHTML =
          `<span class="tlabel">Build the sound</span><span class="tsound">${api.esc(
            target.tr,
          )}</span>`;
        api.fb(fbn, "", "");
        fbn.className = "feedback";
        paint();
      }

      $("#rv-clear", root).addEventListener("click", () => {
        selL = null;
        selV = null;
        paint();
      });
      $("#rv-check", root).addEventListener("click", () => {
        if (!selL || !selV) {
          api.fb(fbn, "tip", "Pick one letter <b>and</b> one vowel, then check.");
          return;
        }
        const built = api.syl(selL, selV);
        if (built.tr === target.tr) {
          if (misses === 0) right++;
          api.say(target.heb, target.tr);
          api.fb(
            fbn,
            "ok",
            `<span class="glyph md">${built.heb}</span> — yes. ${api.esc(
              api.LETTERS[selL].name,
            )} for the <b>${api.esc(target.c || "silent start")}</b>, ${api.esc(
              api.VOWELS[selV].name,
            )} for the <b>${api.esc(target.v)}</b>.`,
          );
          setTimeout(nextBuild, 1200);
          return;
        }
        misses++;
        if (misses === 1) {
          api.fb(
            fbn,
            "no",
            `Not yet. Split the sound in your head: which part is the <b>letter</b> and which part is the <b>vowel</b>?`,
          );
        } else if (misses === 2) {
          api.fb(
            fbn,
            "tip",
            `The vowel part is <b>${api.esc(target.v)}</b>. Find a mark that says that, then worry about the letter.`,
          );
        } else {
          api.fb(
            fbn,
            "tip",
            `The letter is <b>${api.esc(target.L.name)}</b> and the vowel says <b>${api.esc(
              target.v,
            )}</b>. Careful: more than one mark can say ${api.esc(target.v)} — any of them is right.`,
          );
        }
      });

      nextBuild();
    },
  });
})();
