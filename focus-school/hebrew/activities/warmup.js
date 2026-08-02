/* Nightly Hebrew — Warm-Up section.
 *
 *   warmup   (required) Dugout Warm-Up — spaced review of everything already
 *                       owned. Unit 1 has nothing behind it, so it becomes the
 *                       "how Hebrew works" orientation instead of a review of
 *                       nothing.
 *   rollcall (bonus)    Roll Call — the whole roster, both directions:
 *                       shape → sound and sound → shape.
 */
(function () {
  "use strict";

  // -------------------------------------------------------------- warm-up
  HEB.registerActivity({
    id: "warmup",
    title: (u) => (u.id === 1 ? "⚾ How Hebrew Works" : "⚾ Dugout Warm-Up"),
    how: (u) =>
      u.id === 1
        ? "Five ground rules before your first at-bat, then one practice swing."
        : "Everything you already own — twelve quick reps, then a four-pitch check.",
    mount(root, api) {
      if (api.unit.id === 1) return orientation(root, api);
      return review(root, api);
    },
  });

  function review(root, api) {
    const { unit, syl, trHtml, el, $ } = api;
    const vowels = unit.prevVowels.length ? unit.prevVowels : unit.vowelPool;
    const pool = [];
    for (const L of unit.prevLetters) {
      for (const V of vowels) {
        const s = syl(L, V);
        if (s) pool.push(s);
      }
    }
    const items = api.sample(pool, 12);
    root.innerHTML = `
      <p class="note">Say each one out loud, <b>then</b> tap it to check. Letter first, vowel second.</p>
      <div id="wu-rows"></div>
      <div class="feedback" id="wu-fb"></div>
      <div id="wu-check" hidden></div>`;
    const rows = $("#wu-rows", root);
    const fbn = $("#wu-fb", root);
    let rowsDone = 0;
    for (let r = 0; r < 2; r++) {
      const slice = items.slice(r * 6, r * 6 + 6);
      const wrap = el(
        `<div style="margin-bottom:10px"><div class="note rowlabel">Row ${r + 1}</div></div>`,
      );
      wrap.appendChild(
        api.tileRow(slice, {
          onAll() {
            rowsDone++;
            if (rowsDone === 2) startCheck();
            else api.fb(fbn, "tip", "Row 1 checked. One more.");
          },
        }),
      );
      rows.appendChild(wrap);
    }

    function startCheck() {
      api.fb(fbn, "ok", "Arm's loose. Four pitches to prove it stuck. ⚾");
      const host = $("#wu-check", root);
      host.hidden = false;
      api.quiz(host, {
        total: 4,
        unitWord: "Pitch",
        winNote: "Warm-up complete.",
        tryNote: "Warm-up complete — those two are worth a second look tonight.",
        next() {
          const s = api.pick(items);
          return question(api, s, unit.letterPool, vowels);
        },
        onFinish() {
          api.done();
        },
      });
      host.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }

  // One shared question shape: "what does this say?", with distractors that
  // are deliberately CLOSE — same letter/different vowel, and same
  // vowel/different letter — so elimination does not work.
  function question(api, s, letters, vowels) {
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
      hint1: "Not that one. Look at the mark <b>under</b> the letter first — which vowel is it?",
      hint2: `Hint: the vowel is <b>${api.esc(s.V.name)}</b> and it says <b>${api.esc(
        s.v,
      )}</b>. Which letter is in front of it?`,
      hint3: `Hint: the letter is <b>${api.esc(s.L.name)}</b> (${api.esc(
        s.c || "silent",
      )}) and the vowel says <b>${api.esc(s.v)}</b>.`,
      explain: `<b>${api.esc(s.tr)}</b> — ${api.esc(s.L.name)} says <b>${api.esc(
        s.c || "nothing",
      )}</b>, ${api.esc(s.V.name)} says <b>${api.esc(s.v)}</b>.`,
    };
  }

  // ---------------------------------------------------------- orientation
  function orientation(root, api) {
    const { el, $ } = api;
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
      [
        "🚫",
        "There are no silent tricks",
        "English makes you memorise words. Hebrew lets you build them. If you know the letter and the mark, you can read it — even a word you have never seen.",
      ],
    ];
    root.innerHTML = `
      <p class="note">Tap each card. These five ideas are the whole game.</p>
      <div class="rules" id="or-list"></div>
      <div class="feedback" id="or-fb"></div>
      <div id="or-try" hidden></div>`;
    const list = $("#or-list", root);
    const fbn = $("#or-fb", root);
    let n = 0;
    steps.forEach(([pin, t, d]) => {
      const r = el(
        `<button class="rule" type="button"><span class="pin">${pin}</span><span><b>${t}</b><span>${d}</span></span></button>`,
      );
      r.addEventListener(
        "click",
        () => {
          r.classList.add("read");
          n++;
          if (n === steps.length) firstSwing();
          else api.fb(fbn, "tip", `${n} of ${steps.length} read.`);
        },
        { once: true },
      );
      list.appendChild(r);
    });

    function firstSwing() {
      api.fb(fbn, "ok", "You've got the ground rules. One practice swing, then play ball.");
      const host = $("#or-try", root);
      host.hidden = false;
      const s = api.syl("ד", "kamatz");
      host.innerHTML = `<div class="swing">
        <p class="note">Here is your first Hebrew ever. The letter is <b>Dalet</b> and it says <b>d</b>. The mark underneath is a <b>Kamatz</b> and it says <b>ah</b>.</p>
        <div style="text-align:center"><span class="glyph xl">${s.heb}</span></div>
        <p class="note" style="text-align:center">Say it out loud — letter first, then the vowel — and tap to check.</p>
        <div style="text-align:center"><button class="btn primary" type="button" id="or-check">I said it — check me</button></div>
        <div class="feedback" id="or-fb2"></div>
      </div>`;
      $("#or-check", host).addEventListener("click", () => {
        api.say(s.heb, s.tr);
        api.fb(
          $("#or-fb2", host),
          "ok",
          `It says <b>dah</b>. ${api.trHtml(s)} — that's it. That is reading Hebrew, and you just did it.`,
        );
        $("#or-check", host).disabled = true;
        api.done();
      });
      host.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }

  // ------------------------------------------------------------- roll call
  HEB.registerActivity({
    id: "rollcall",
    title: "🧠 Roll Call",
    how: "Ten quickfire calls on the whole roster — both directions: shape to sound, and sound to shape.",
    mount(root, api) {
      const roster = api.unit.allLetters.filter((ch) => api.LETTERS[ch]);
      root.innerHTML = `<p class="note">No vowels here — just the letters themselves. Half the calls show you a letter, half of them name a sound.</p>`;
      api.quiz(root, {
        total: 10,
        unitWord: "Call",
        winNote: "You know the roster cold.",
        next(i) {
          return i % 2 === 0 ? shapeToSound(api, roster) : soundToShape(api, roster);
        },
        onFinish() {
          api.done();
        },
      });
    },
  });

  const label = (L) => (L.c ? `says ${L.c}` : "SILENT");

  function shapeToSound(api, roster) {
    const ch = api.pick(roster);
    const L = api.LETTERS[ch];
    const wrong = api
      .shuffle(roster.slice())
      .filter((c) => api.LETTERS[c] && label(api.LETTERS[c]) !== label(L))
      .slice(0, 3)
      .map((c) => label(api.LETTERS[c]));
    return {
      qHtml: `<span class="glyph xl">${ch}</span><p class="note">What sound does this letter carry?</p>`,
      answer: label(L),
      choices: [label(L), ...new Set(wrong)],
      sayHeb: ch,
      sayTr: L.c || L.name,
      hint1: "Picture the shape, not the sound. What is this letter's NAME?",
      hint2: `Its name is <b>${api.esc(L.name)}</b>. Now — what does a ${api.esc(L.name)} say?`,
      explain: `<b>${api.esc(L.name)}</b> — ${api.esc(L.say)}.`,
    };
  }

  function soundToShape(api, roster) {
    const ch = api.pick(roster);
    const L = api.LETTERS[ch];
    const wrong = api
      .shuffle(roster.slice())
      .filter((c) => c !== ch && api.LETTERS[c] && api.LETTERS[c].c !== L.c)
      .slice(0, 3);
    const cell = (c) => ({ text: c, html: `<span class="glyph">${c}</span>` });
    return {
      qHtml: `<p class="ask">Which letter is <b>${api.esc(L.name)}</b>${
        L.c ? ` — the one that says <b>${api.esc(L.c)}</b>` : " — one of the silent ones"
      }?</p>`,
      answer: ch,
      choices: [cell(ch), ...wrong.map(cell)],
      wide: true,
      sayHeb: ch,
      sayTr: L.c || L.name,
      hint1: `Not that one. Remember the shape: ${api.esc(L.note)}`,
      hint2: L.watch
        ? `Careful — ${api.esc(L.watch)}`
        : `Trace it in your head: ${api.esc(L.trace || L.note)}`,
      explain: `<span class="glyph md">${ch}</span> — ${api.esc(L.name)}, ${api.esc(L.say)}.`,
    };
  }
})();
