/* Nightly Hebrew — proving it stuck.
 *
 *   spot  (bonus)    Spot the Mistake — somebody else read it wrong. Was the
 *                    mistake the LETTER or the VOWEL? Naming the error type is
 *                    what turns a miss into something a reader can fix, and it
 *                    is the exact diagnostic move the hint ladder makes all
 *                    night.
 *   final (required) Final At-Bat — twelve mixed questions drawn from every
 *                    skill of the night, then a box score that says which part
 *                    is solid and which part wants another pass tomorrow.
 */
(function () {
  "use strict";

  // ------------------------------------------------------- spot the mistake
  HEB.registerActivity({
    id: "spot",
    title: "🕵️ Spot the Mistake",
    how: "Eight readings. Some are right. For the wrong ones, name what went wrong — the letter, or the vowel.",
    mount(root, api) {
      const { unit } = api;
      const letters = unit.letterPool;
      const vowels = unit.vowelPool;
      root.innerHTML = `<p class="note">Somebody read each of these out loud. Your job is to be the umpire: is that reading right, and if not, <b>which half</b> did they get wrong?</p>`;

      api.quiz(root, {
        total: 8,
        unitWord: "Call",
        winNote: "You can name your own mistakes now. That is how a reader gets unstuck alone.",
        next(i) {
          const s = api.syl(api.pick(letters), api.pick(vowels));
          const roll = i % 4;
          if (roll === 3) return correctCall(api, s);
          if (roll === 1) return wrongLetter(api, s, letters);
          return wrongVowel(api, s, vowels);
        },
        onFinish() {
          api.done();
        },
      });
    },
  });

  const CHOICES = [
    "They got the LETTER wrong",
    "They got the VOWEL wrong",
    "Nothing — that's right",
  ];

  function frame(api, s, said) {
    return `<span class="glyph xl">${s.heb}</span>
      <p class="ask">They read it as <b class="said">“${api.esc(said)}”</b>.</p>`;
  }

  function wrongVowel(api, s, vowels) {
    const other = api.pick(vowels.filter((k) => api.VOWELS[k].v !== s.v)) || vowels[0];
    const bad = api.syl(s.letter, other);
    if (!bad || bad.tr === s.tr) return correctCall(api, s);
    return {
      qHtml: frame(api, s, bad.tr),
      answer: CHOICES[1],
      choices: CHOICES,
      wide: true,
      meta: "spot",
      sayHeb: s.heb,
      sayTr: s.tr,
      hint1: "Compare the two sounds piece by piece. Does the FIRST part match, or the second?",
      hint2: `Both start with <b>${api.esc(
        s.c || "no consonant",
      )}</b>, so the letter was fine. Look lower.`,
      explain: `The vowel. It is <b>${api.esc(s.V.name)}</b> — <b>${api.esc(
        s.v,
      )}</b> — so it says <b>${api.esc(s.tr)}</b>, not “${api.esc(bad.tr)}”.`,
      pause: 1500,
    };
  }

  function wrongLetter(api, s, letters) {
    const other = api.pick(letters.filter((c) => api.LETTERS[c].c !== s.c)) || letters[0];
    const bad = api.syl(other, s.vowel);
    if (!bad || bad.tr === s.tr) return correctCall(api, s);
    return {
      qHtml: frame(api, s, bad.tr),
      answer: CHOICES[0],
      choices: CHOICES,
      wide: true,
      meta: "spot",
      sayHeb: s.heb,
      sayTr: s.tr,
      hint1: "Compare the two sounds piece by piece. Does the FIRST part match, or the second?",
      hint2: `Both end in <b>${api.esc(s.v)}</b>, so the vowel was fine. Look at the letter.`,
      explain: `The letter. That is <b>${api.esc(s.L.name)}</b> — it says <b>${api.esc(
        s.c || "nothing",
      )}</b> — so the whole thing is <b>${api.esc(s.tr)}</b>.`,
      pause: 1500,
    };
  }

  function correctCall(api, s) {
    return {
      qHtml: frame(api, s, s.tr),
      answer: CHOICES[2],
      choices: CHOICES,
      wide: true,
      meta: "spot",
      sayHeb: s.heb,
      sayTr: s.tr,
      hint1: "Check both halves before you call it. Letter first, then the mark.",
      hint2: `${api.esc(s.L.name)} says ${api.esc(s.c || "nothing")}, ${api.esc(
        s.V.name,
      )} says ${api.esc(s.v)}. Add them up.`,
      explain: `Good call — that reading is correct. Being willing to say “nothing is wrong” matters as much as catching the errors.`,
      pause: 1400,
    };
  }

  // ------------------------------------------------------------ final at-bat
  const KIND_LABEL = {
    blend: "Reading a letter + vowel",
    vowel: "Naming the vowel",
    letter: "Knowing the letters",
    look: "Telling look-alikes apart",
    word: "Word meanings",
  };

  HEB.registerActivity({
    id: "final",
    title: "🏆 Final At-Bat",
    how: "Twelve mixed questions from everything tonight, then a box score.",
    mount(root, api) {
      const { unit, el, $ } = api;
      const letters = unit.letterPool;
      const vowels = unit.vowelPool;
      const groups = api.confusableGroups();
      const words = api.allWords();
      const tally = {};
      const bump = (kind, ok) => {
        const t = (tally[kind] = tally[kind] || { right: 0, total: 0 });
        t.total++;
        if (ok) t.right++;
      };

      root.innerHTML = `
        <p class="note">Last at-bat. This mixes every skill from tonight, plus review from the innings before it — no warning about which is coming.</p>
        <div id="fn-quiz"></div>
        <div id="fn-box" hidden></div>`;

      const ORDER = [
        "blend",
        "vowel",
        "word",
        "look",
        "blend",
        "letter",
        "vowel",
        "word",
        "blend",
        "look",
        "letter",
        "blend",
      ];

      api.quiz($("#fn-quiz", root), {
        total: 12,
        unitWord: "At-bat",
        winNote: "That is a complete inning of reading.",
        tryNote: "Solid inning. The box score below says where to aim tomorrow.",
        next(i) {
          const kind = ORDER[i] || "blend";
          if (kind === "vowel") return vowelQ(api, letters, vowels);
          if (kind === "letter") return letterQ(api, unit.allLetters);
          if (kind === "look" && groups.length) return lookQ(api, groups);
          if (kind === "word") return wordQ(api, words);
          return blendQ(api, letters, vowels);
        },
        onAnswer(ok, meta) {
          bump(meta || "blend", ok);
        },
        onFinish(right, total) {
          const box = $("#fn-box", root);
          box.hidden = false;
          const rows = Object.keys(tally)
            .map((k) => {
              const t = tally[k];
              const pct = Math.round((t.right / t.total) * 100);
              return `<div class="box-row ${pct >= 80 ? "good" : pct >= 50 ? "mid" : "low"}">
                <span class="box-lbl">${api.esc(KIND_LABEL[k] || k)}</span>
                <span class="box-bar"><span style="width:${pct}%"></span></span>
                <span class="box-num">${t.right}/${t.total}</span>
              </div>`;
            })
            .join("");
          const weakest = Object.keys(tally).sort(
            (a, b) => tally[a].right / tally[a].total - tally[b].right / tally[b].total,
          )[0];
          box.innerHTML = `
            <h4 class="sub-h">📊 Box score</h4>
            <div class="boxscore">${rows}</div>
            <p class="note">${
              right === total
                ? "Perfect at-bat. Nothing to clean up — go to bed. 🏆"
                : weakest
                  ? `Strongest tonight: the parts in green. The one to aim at tomorrow: <b>${api.esc(
                      KIND_LABEL[weakest] || weakest,
                    )}</b>.`
                  : ""
            }</p>`;
          api.done();
        },
      });
    },
  });

  function blendQ(api, letters, vowels) {
    const s = api.syl(api.pick(letters), api.pick(vowels));
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
      meta: "blend",
      sayHeb: s.heb,
      sayTr: s.tr,
      hint1: "Mark under the letter first — which vowel is it?",
      hint2: `The vowel says <b>${api.esc(s.v)}</b>.`,
      explain: `<b>${api.esc(s.tr)}</b> — ${api.esc(s.L.name)} + ${api.esc(s.V.name)}.`,
    };
  }

  function vowelQ(api, letters, vowels) {
    const k = api.pick(vowels);
    const s = api.syl(api.pick(letters), k);
    const V = api.VOWELS[k];
    const others = api
      .shuffle(vowels.slice())
      .filter((x) => x !== k)
      .slice(0, 3);
    return {
      qHtml: `<span class="glyph xl">${s.heb}</span><p class="note">Name the mark.</p>`,
      answer: V.name,
      choices: [V.name, ...others.map((x) => api.VOWELS[x].name)],
      meta: "vowel",
      sayHeb: s.heb,
      sayTr: s.tr,
      hint1: "Describe it before you name it: how many dots, and where do they sit?",
      hint2: `It is ${api.esc(V.art)}.`,
      explain: `<b>${api.esc(V.name)}</b> — ${api.esc(V.art)}, says ${api.esc(V.v)}.`,
    };
  }

  function letterQ(api, roster) {
    const ch = api.pick(roster.filter((c) => api.LETTERS[c]));
    const L = api.LETTERS[ch];
    const others = api
      .shuffle(roster.slice())
      .filter((c) => c !== ch && api.LETTERS[c] && api.LETTERS[c].name !== L.name)
      .slice(0, 3);
    return {
      qHtml: `<span class="glyph xl">${ch}</span><p class="note">Name the letter.</p>`,
      answer: L.name,
      choices: [L.name, ...others.map((c) => api.LETTERS[c].name)],
      meta: "letter",
      sayHeb: ch,
      sayTr: L.c || L.name,
      hint1: `What sound does it carry? Start there and the name usually follows.`,
      hint2: api.esc(L.note),
      explain: `<b>${api.esc(L.name)}</b> — ${api.esc(L.say)}.`,
    };
  }

  function lookQ(api, groups) {
    const g = api.pick(groups);
    const target = api.pick(g.chars);
    const L = api.LETTERS[target];
    const cell = (c) => ({ text: c, html: `<span class="glyph">${c}</span>` });
    return {
      qHtml: `<p class="ask">Which one is <b>${api.esc(L.name)}</b>?</p>`,
      answer: target,
      choices: g.chars.map(cell),
      wide: true,
      meta: "look",
      sayHeb: target,
      sayTr: L.c || L.name,
      hint1: "Slow down and look at the shapes. What is actually different?",
      hint2: api.esc(g.why),
      explain: `<span class="glyph md">${target}</span> ${api.esc(L.name)}. ${api.esc(g.why)}`,
      pause: 1300,
    };
  }

  function wordQ(api, words) {
    const w = api.pick(words);
    const others = api
      .shuffle(words.slice())
      .filter((x) => x.en !== w.en)
      .slice(0, 3);
    return {
      qHtml: `<span class="glyph xl">${w.heb}</span><p class="note">What does it mean?</p>`,
      answer: w.en,
      choices: [w.en, ...others.map((x) => x.en)],
      meta: "word",
      sayHeb: w.heb,
      sayTr: w.tr,
      hint1: "Sound it out first — out loud. The meaning usually arrives with the sound.",
      hint2: `It says <b>${api.esc(w.tr)}</b>.`,
      explain: `<b>${api.esc(w.tr)}</b> — ${api.esc(w.en)}.`,
    };
  }
})();
