/* 2nd Inning game — DUGOUT SORT.
 *
 * Mechanic: deck sorting. A stack of scouting cards sits on the mound, one
 * face-up at a time. Each dugout bin belongs to ONE letter, and the only way
 * to file a card is to actually read which letter is carrying the vowel. There
 * is no list of answers to eliminate from — the whole board is the answer set,
 * every card, all game.
 *
 * Why this shape for THIS inning: ה ח ת are the same drawing with one detail
 * changed, and ק is the first letter to drop below the line. Bins sit in
 * teaching order so the look-alikes end up shoulder to shoulder, which forces
 * the discrimination instead of letting a rough glance carry the round.
 *
 * Calm by design: no clock, no fail. A card you misread stays on the mound
 * with a stronger hint each try, and once you finally place it, it goes to the
 * review tray instead of the dugout — the bins only ever collect CLEAN reads.
 * When the mound empties, the tray flips back over and you sort it again.
 */
(function () {
  "use strict";

  HEB.registerGame({
    name: "Dugout Sort",
    goal: "Read the card on the mound and tap the dugout for the letter it starts with. Cards you have to guess at come back around.",
    blurb: "Sort a stack of scouting cards into the right dugout by which letter you read.",

    mount(root, api) {
      const { unit, LETTERS, syl, trHtml, say, shuffle, sample, pick, el, esc, toast } = api;
      const vowels = unit.vowelPool;

      api.style(`
        .ds-mound{background:rgba(0,0,0,.3);border:1px dashed var(--line);border-radius:14px;padding:12px}
        .ds-head{display:flex;align-items:center;gap:8px;flex-wrap:wrap;
          font-size:.72rem;letter-spacing:1.2px;text-transform:uppercase;color:var(--muted);font-weight:900}
        .ds-round{background:rgba(224,122,95,.2);border:1px solid var(--clay);color:#ffd9cf;
          border-radius:999px;padding:2px 9px;letter-spacing:.6px}
        .ds-stack{position:relative;min-height:162px;display:grid;place-items:center;margin:8px 0 2px}
        .ds-back,.ds-card{width:120px;height:142px;border-radius:14px;display:grid;place-items:center}
        .ds-back{position:absolute;background:linear-gradient(160deg,#123448,#0b1c29);
          border:1px solid var(--line);opacity:.8}
        .ds-card{position:relative;background:linear-gradient(160deg,#1d4763,#0f2a3c);
          border:2px solid var(--lights);box-shadow:0 10px 24px rgba(0,0,0,.5)}
        .ds-card.empty{border-color:var(--good);border-style:dashed;font-size:2.6rem}
        .ds-card .glyph{font-size:3.5rem}
        .ds-left{text-align:center;font-weight:800;color:var(--muted);font-size:.9rem}
        .ds-do{margin:10px 0 0;text-align:center}
        .ds-bins{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:10px;margin-top:14px}
        .ds-bin{min-height:96px;text-align:left;padding:10px 11px;border-radius:14px;
          background:linear-gradient(165deg,#16354a,#0e2434);border:1px solid var(--line);color:var(--chalk)}
        .ds-bin:hover:not([disabled]){border-color:var(--lights)}
        .ds-bin[disabled]{opacity:.55}
        .ds-bin-top{display:flex;align-items:center;gap:9px}
        .ds-bin-top .glyph{font-size:2.3rem;line-height:1.2}
        .ds-bin-name{font-weight:900;font-size:.98rem;line-height:1.15}
        .ds-bin-says{color:var(--lights);font-weight:800;font-size:.82rem}
        .ds-filed{display:flex;flex-wrap:wrap;gap:4px;margin-top:8px;min-height:26px;
          border-top:1px solid var(--line);padding-top:7px}
        .ds-filed .glyph{font-size:1.25rem;background:rgba(95,209,140,.16);border:1px solid var(--good);
          border-radius:7px;padding:0 5px;line-height:1.5}
        .ds-filed .ds-none{font-size:.76rem;color:var(--muted);font-weight:700}
        .ds-tray{margin-top:12px;border:1px dashed var(--clay);border-radius:12px;padding:10px 12px;
          background:rgba(224,122,95,.1)}
        .ds-tray .glyph{font-size:1.4rem;margin-left:6px}
      `);

      // ---------------------------------------------------------------- bins
      // Two bins must never claim the same sound, or a card would have two
      // right answers. De-duping on the consonant spelling does that AND
      // quietly folds תּ into ת — the dot never changed the t.
      const MAX_BINS = 6;
      const bins = [];
      const claimed = new Set();
      const openBin = (ch) => {
        const L = LETTERS[ch];
        if (!L || bins.length >= MAX_BINS) return;
        const key = L.c || "(silent)";
        if (claimed.has(key)) return;
        claimed.add(key);
        bins.push({ ch, L, c: key, filed: [] });
      };
      // Teaching order first: that is what parks ה ח ת next to each other.
      unit.newLetters.forEach(openBin);
      // Then a couple of earlier letters so the sort is never only new stuff.
      shuffle(unit.prevLetters).forEach(openBin);
      unit.letterPool.forEach(openBin); // last resort for a unit with no new letters

      // Every letter that SOUNDS like a bin can be dealt into the deck, so the
      // dot-variants show up as cards and land in their plain letter's dugout.
      const binOf = new Map();
      for (const ch of unit.letterPool) {
        const L = LETTERS[ch];
        const b = L && bins.find((x) => x.c === (L.c || "(silent)"));
        if (b) binOf.set(ch, b);
      }

      // ---------------------------------------------------------------- deck
      const TOTAL = 14;
      // Weight tonight's letters heavier, but never let a bin sit empty all
      // game — one guaranteed card each, then fill from the weighted bag.
      const bag = [];
      for (const ch of binOf.keys()) {
        const reps = unit.newLetters.includes(ch) ? 3 : 1;
        for (let i = 0; i < reps; i++) bag.push(ch);
      }
      const chars = bins.map((b) => b.ch);
      if (chars.length < TOTAL && bag.length) chars.push(...sample(bag, TOTAL - chars.length));
      let mound = shuffle(chars).map((ch) => ({
        s: syl(ch, pick(vowels)),
        bin: binOf.get(ch),
        misses: 0,
        pass: 0,
      }));
      const total = mound.length;
      let tray = [];
      let clean = 0;
      let round = 1;

      root.innerHTML = `
        <div class="ds-mound">
          <div class="ds-head"><span>⚾ Cards on the mound</span><span class="ds-round" id="ds-round" hidden></span></div>
          <div class="ds-stack" id="ds-stack"></div>
          <div class="ds-left" id="ds-left"></div>
          <p class="note ds-do" id="ds-do"></p>
        </div>
        <div class="ds-bins" id="ds-bins" role="group" aria-label="Dugout bins"></div>
        <div class="ds-tray" id="ds-tray" hidden></div>`;

      const stack = root.querySelector("#ds-stack");
      const leftEl = root.querySelector("#ds-left");
      const doEl = root.querySelector("#ds-do");
      const roundEl = root.querySelector("#ds-round");
      const trayEl = root.querySelector("#ds-tray");
      const binHost = root.querySelector("#ds-bins");

      bins.forEach((b) => {
        b.node = el(`<button class="ds-bin" type="button">
          <span class="ds-bin-top"><span class="glyph">${b.ch}</span>
            <span><span class="ds-bin-name">${esc(b.L.name)}</span><br>
            <span class="ds-bin-says">says ${esc(b.c === "(silent)" ? "nothing" : b.c)}</span></span></span>
          <span class="ds-filed"></span>
        </button>`);
        b.strip = b.node.querySelector(".ds-filed");
        b.node.addEventListener("click", () => fileInto(b));
        binHost.appendChild(b.node);
      });

      // ---------------------------------------------------------------- draw
      function draw() {
        const card = mound[0];
        stack.innerHTML = "";
        for (let i = Math.min(mound.length - 1, 4); i > 0; i--) {
          stack.appendChild(
            el(`<div class="ds-back" style="transform:translate(${i * 5}px,${i * -5}px)"></div>`),
          );
        }
        stack.appendChild(
          card
            ? el(`<div class="ds-card"><span class="glyph">${card.s.heb}</span></div>`)
            : el('<div class="ds-card empty">🏆</div>'),
        );
        leftEl.textContent = card
          ? `${mound.length} card${mound.length === 1 ? "" : "s"} to sort`
          : "Mound is clear";
        doEl.innerHTML = card
          ? "Say it out loud, then tap the dugout for the <b>letter</b> you read."
          : "<b>Every card is filed clean.</b>";
        roundEl.hidden = round === 1;
        roundEl.textContent = `Second look · round ${round}`;

        bins.forEach((b) => {
          b.node.disabled = !card;
          b.strip.innerHTML = b.filed.length
            ? b.filed.map((c) => `<span class="glyph">${c.s.heb}</span>`).join("")
            : '<span class="ds-none">empty</span>';
        });

        trayEl.hidden = !tray.length;
        if (tray.length) {
          trayEl.innerHTML =
            `<b>🔁 Review tray — ${tray.length} to re-sort</b> <span class="note">these come back once the mound is clear</span><div>` +
            tray.map((c) => `<span class="glyph">${c.s.heb}</span>`).join("") +
            "</div>";
        }

        api.setHud(
          `<span class="stat">Filed clean ${clean}/${total}</span>` +
            `<span class="stat">Mound ${mound.length}</span>` +
            `<span class="stat">Review tray ${tray.length}</span>`,
        );
      }

      // ------------------------------------------------------------- sorting
      function fileInto(bin) {
        const card = mound[0];
        if (!card) return;

        if (bin !== card.bin) {
          card.misses++;
          api.feedback("no", missHint(card, bin));
          return; // the card stays put — you get as many looks as you need
        }

        mound.shift();
        say(card.s.heb, card.s.tr);
        if (card.misses === 0) {
          bin.filed.push(card);
          clean++;
          api.feedback(
            "ok",
            `${trHtml(card.s)} — into the ${esc(bin.L.name)} dugout. ${esc(bin.L.name)} says <b>${esc(
              bin.c,
            )}</b>, ${esc(card.s.V.name)} says <b>${esc(card.s.v)}</b>.`,
          );
        } else {
          tray.push(card);
          api.feedback(
            "tip",
            `Right dugout — ${trHtml(card.s)} is a ${esc(bin.L.name)}. That one took a few looks, so it goes to the <b>review tray</b> and comes back around.`,
          );
        }
        advance();
      }

      // Tiered coaching. Tier climbs with misses AND with how many times this
      // card has already come back, so a repeat offender opens with more help.
      function missHint(card, chosen) {
        const right = card.s.L;
        const tier = Math.min(card.misses + card.pass, 3);
        if (tier <= 1) {
          return (
            `That's the <b>${esc(chosen.L.name)}</b> dugout — ${esc(chosen.L.say)}. This card isn't one of his. ` +
            (chosen.L.watch
              ? `👀 ${esc(chosen.L.watch)}`
              : "Look at the letter again before the vowel underneath it.")
          );
        }
        if (tier === 2) {
          // One half only: the SHAPE of the right letter, never its name.
          return `Not that dugout either. Here's the scouting note on this card's letter, name blacked out: <i>${esc(
            right.note,
          )}</i> Which dugout is that?`;
        }
        return `This one is <b>${esc(right.name)}</b> — ${esc(right.say)}. Tap the ${esc(
          right.name,
        )} dugout, then read the vowel underneath to say the whole card.`;
      }

      function advance() {
        if (!mound.length && tray.length) {
          round++;
          mound = shuffle(tray).map((c) => ({ ...c, misses: 0, pass: c.pass + 1 }));
          tray = [];
          toast(
            `${mound.length} card${mound.length === 1 ? "" : "s"} came back — sort them clean.`,
          );
        }
        draw();
        if (!mound.length && !tray.length) {
          api.win(
            `🏆 Dugout sorted — all ${total} cards filed clean. You told ${bins
              .map((b) => b.L.name)
              .join(", ")} apart by reading them.`,
          );
        }
      }

      draw();
    },
  });
})();
