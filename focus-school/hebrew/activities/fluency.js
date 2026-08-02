/* Nightly Hebrew — fluency work.
 *
 *   batting (required) Batting Practice — six rows of reps with the answer
 *                      hidden and no clock anywhere. Each row ends with an
 *                      honest self-rating, because "did I read that smoothly?"
 *                      is a question only the reader can answer.
 *   ladder  (bonus)    Fluency Ladder — the same sounds, stacked into longer
 *                      and longer strings. Reading one piece is decoding;
 *                      reading four in a row without stopping is fluency.
 *   minimal (bonus)    Twin Pitches — two sounds that differ by exactly one
 *                      thing. Isolates the difference so it cannot be guessed
 *                      around.
 */
(function () {
  "use strict";

  const ROWS = 6;
  const PER_ROW = 6;

  HEB.registerActivity({
    id: "batting",
    title: "🏏 Batting Practice",
    how: "Six rows of reps. Reading a whole row without stopping is the goal — there is no clock.",
    mount(root, api) {
      const { unit, el, $ } = api;
      const letters = unit.letterPool;
      const vowels = unit.vowelPool;

      root.innerHTML = `
        <p class="note">Read a whole row out loud <b>before</b> you tap anything. Then tap each one to check yourself, and tell the truth on the row rating — nobody sees it but you.</p>
        <div id="bp-rows"></div>
        <div class="row" style="margin-top:12px">
          <button class="btn sm" type="button" id="bp-reveal">👁 Show every answer</button>
          <button class="btn sm" type="button" id="bp-new">🔄 Fresh set of pitches</button>
        </div>
        <div class="feedback" id="bp-fb"></div>`;
      const host = $("#bp-rows", root);
      const fbn = $("#bp-fb", root);
      let rated = 0;

      function makeRow(r) {
        // The first two rows lock in tonight's new VOWEL, the next two lock in
        // tonight's new LETTER, and the last two are a free mix of everything
        // — so a row is always about one thing before it is about everything.
        const rowV = r < 2 && unit.newVowels.length ? api.pick(unit.newVowels) : null;
        const rowL = r >= 2 && r < 4 && unit.newLetters.length ? api.pick(unit.newLetters) : null;
        const out = [];
        for (let i = 0; i < PER_ROW; i++) {
          out.push(api.syl(rowL || api.pick(letters), rowV || api.pick(vowels)));
        }
        return {
          items: out,
          focus: rowV ? api.VOWELS[rowV].name : rowL ? api.LETTERS[rowL].name : "mixed",
        };
      }

      function draw() {
        host.innerHTML = "";
        rated = 0;
        for (let r = 0; r < ROWS; r++) {
          const { items, focus } = makeRow(r);
          const wrap = el(`<div class="bp-row">
            <div class="note rowlabel">Row ${r + 1} <span class="focus">${api.esc(focus)}</span></div>
          </div>`);
          const rate = el(`<div class="rating" hidden>
            <span class="note">How did that row go?</span>
            <button class="btn sm" type="button" data-r="smooth">😎 Smooth</button>
            <button class="btn sm" type="button" data-r="ok">🙂 Got there</button>
            <button class="btn sm" type="button" data-r="slow">🐢 Needed a minute</button>
          </div>`);
          wrap.appendChild(
            api.tileRow(items, {
              onAll() {
                rate.hidden = false;
              },
            }),
          );
          wrap.appendChild(rate);
          rate.querySelectorAll("button").forEach((b) => {
            b.addEventListener("click", () => {
              rate.innerHTML = `<span class="note rated">${
                b.dataset.r === "smooth"
                  ? "😎 Smooth — logged."
                  : b.dataset.r === "ok"
                    ? "🙂 Got there — logged."
                    : "🐢 Worth one more pass. Tap “Fresh set of pitches” at the end."
              }</span>`;
              rated++;
              if (rated === ROWS) {
                api.fb(fbn, "ok", "All six rows read and rated. That is a full round of BP. ⚾");
                api.done();
              } else {
                api.fb(fbn, "tip", `${rated} of ${ROWS} rows done.`);
              }
            });
          });
          host.appendChild(wrap);
        }
      }
      draw();

      $("#bp-reveal", root).addEventListener("click", () => {
        host.querySelectorAll(".tile:not(.revealed)").forEach((t) => t.click());
      });
      $("#bp-new", root).addEventListener("click", () => {
        draw();
        fbn.className = "feedback";
        fbn.innerHTML = "";
      });
    },
  });

  // ------------------------------------------------------------ the ladder
  HEB.registerActivity({
    id: "ladder",
    title: "📈 Fluency Ladder",
    how: "Five rungs. Each one is longer than the last — climb without stopping in the middle.",
    mount(root, api) {
      const { unit, el, $ } = api;
      const letters = unit.letterPool;
      const vowels = unit.vowelPool;
      const rungs = [];
      for (let n = 1; n <= 5; n++) {
        const parts = [];
        for (let i = 0; i < n; i++) parts.push(api.syl(api.pick(letters), api.pick(vowels)));
        rungs.push(parts);
      }
      root.innerHTML = `
        <p class="note">Read the whole rung out loud in one breath, <b>then</b> tap to check. If you stopped in the middle, read it again before you climb.</p>
        <div class="ladder" id="ld-rungs"></div>
        <div class="feedback" id="ld-fb"></div>`;
      const host = $("#ld-rungs", root);
      const fbn = $("#ld-fb", root);
      let climbed = 0;

      rungs.forEach((parts, i) => {
        const heb = parts.map((p) => p.heb).join("");
        const tr = parts.map((p) => p.tr).join("-");
        const row = el(`<button class="rung" type="button">
          <span class="rung-n">${i + 1}</span>
          <span class="rung-heb">${heb}</span>
          <span class="rung-tr">?</span>
        </button>`);
        row.addEventListener("click", () => {
          api.say(heb, tr);
          if (row.classList.contains("revealed")) return;
          row.classList.add("revealed");
          $(".rung-tr", row).textContent = tr;
          climbed++;
          if (climbed === rungs.length) {
            api.fb(
              fbn,
              "ok",
              "Top of the ladder. Five pieces in a row without stopping is what reading a real word feels like. 🪜",
            );
            api.done();
          } else {
            api.fb(fbn, "tip", `Rung ${climbed} of ${rungs.length}.`);
          }
        });
        host.appendChild(row);
      });
    },
  });

  // ----------------------------------------------------------- twin pitches
  HEB.registerActivity({
    id: "minimal",
    title: "⚖️ Twin Pitches",
    how: "Ten rounds on pairs that differ by exactly one thing — one letter, or one mark.",
    mount(root, api) {
      const { unit } = api;
      const letters = unit.letterPool;
      const vowels = unit.vowelPool;
      const groups = api.confusableGroups();
      root.innerHTML = `<p class="note">Both options are real sounds. Only one of them is the one you were asked for — the difference is always a single letter or a single mark.</p>`;

      api.quiz(root, {
        total: 10,
        unitWord: "Pair",
        winNote: "You are separating twins. That is fine-grained reading.",
        next(i) {
          const mode = i % 3;
          if (mode === 0 && vowels.length > 1) return vowelTwin(api, letters, vowels);
          if (mode === 1 && groups.length) return letterTwin(api, groups, vowels);
          return letterTwinAny(api, letters, vowels);
        },
        onFinish() {
          api.done();
        },
      });
    },
  });

  const cell = (s) => ({ text: s.tr + "|" + s.heb, html: `<span class="glyph">${s.heb}</span>` });

  function vowelTwin(api, letters, vowels) {
    const L = api.pick(letters);
    const [v1, v2] = api.shuffle(vowels.slice()).slice(0, 2);
    const a = api.syl(L, v1);
    const b = api.syl(L, v2);
    if (!a || !b || a.tr === b.tr) return vowelTwinFallback(api, letters, vowels);
    return {
      qHtml: `<p class="ask">Same letter, two different marks. Which one says <b>${api.esc(
        a.tr,
      )}</b>?</p>`,
      answer: cell(a).text,
      choices: [cell(a), cell(b)],
      wide: true,
      sayHeb: a.heb,
      sayTr: a.tr,
      hint1: "The letter is identical in both. Look only at the mark.",
      hint2: `You want <b>${api.esc(a.V.name)}</b> — ${api.esc(a.V.art)}.`,
      explain: `<span class="glyph md">${a.heb}</span> is ${api.esc(a.tr)} (${api.esc(
        a.V.name,
      )}); <span class="glyph md">${b.heb}</span> is ${api.esc(b.tr)} (${api.esc(b.V.name)}).`,
      pause: 1200,
    };
  }
  function vowelTwinFallback(api, letters, vowels) {
    return letterTwinAny(api, letters, vowels);
  }

  function letterTwin(api, groups, vowels) {
    const g = api.pick(groups);
    const [c1, c2] = api.shuffle(g.chars.slice()).slice(0, 2);
    const v = api.pick(vowels);
    const a = api.syl(c1, v);
    const b = api.syl(c2, v);
    if (!a || !b || a.tr === b.tr) return letterTwinAny(api, [c1, c2], vowels);
    return {
      qHtml: `<p class="ask">Same mark, two look-alike letters. Which one says <b>${api.esc(
        a.tr,
      )}</b>?</p>`,
      answer: cell(a).text,
      choices: [cell(a), cell(b)],
      wide: true,
      sayHeb: a.heb,
      sayTr: a.tr,
      hint1: "The mark is identical in both. Look only at the letter shape.",
      hint2: api.esc(g.why),
      explain: `<span class="glyph md">${a.heb}</span> is ${api.esc(a.tr)}; <span class="glyph md">${
        b.heb
      }</span> is ${api.esc(b.tr)}. ${api.esc(g.why)}`,
      pause: 1300,
    };
  }

  function letterTwinAny(api, letters, vowels) {
    const [c1, c2] = api.shuffle(letters.slice()).slice(0, 2);
    const v = api.pick(vowels);
    const a = api.syl(c1, v);
    const b = api.syl(c2 || c1, v);
    if (!a || !b || a.tr === b.tr) {
      const v2 = api.pick(vowels.filter((k) => api.VOWELS[k].v !== a.v)) || vowels[0];
      const b2 = api.syl(c1, v2);
      return {
        qHtml: `<p class="ask">Which one says <b>${api.esc(a.tr)}</b>?</p>`,
        answer: cell(a).text,
        choices: [cell(a), cell(b2)],
        wide: true,
        sayHeb: a.heb,
        sayTr: a.tr,
        hint1: "One mark is different. Find it.",
        hint2: `You want <b>${api.esc(a.V.name)}</b> — ${api.esc(a.V.art)}.`,
        explain: `<span class="glyph md">${a.heb}</span> = ${api.esc(a.tr)}.`,
      };
    }
    return {
      qHtml: `<p class="ask">Which one says <b>${api.esc(a.tr)}</b>?</p>`,
      answer: cell(a).text,
      choices: [cell(a), cell(b)],
      wide: true,
      sayHeb: a.heb,
      sayTr: a.tr,
      hint1: "Say both out loud. Which one starts with the sound you were asked for?",
      hint2: `The sound starts with <b>${api.esc(a.c || "no consonant at all")}</b> — that is ${api.esc(
        a.L.name,
      )}.`,
      explain: `<span class="glyph md">${a.heb}</span> is ${api.esc(a.tr)}; <span class="glyph md">${
        b.heb
      }</span> is ${api.esc(b.tr)}.`,
    };
  }
})();
