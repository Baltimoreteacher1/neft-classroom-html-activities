/* 7th Inning game — DUGOUT MEMORY.
 *
 * Mechanic: concentration/memory on a dugout wall of face-down lineup cards.
 * Half the cards are Hebrew syllables, half are sound spellings. Remembering
 * WHERE a card is, is the game; READING is what tells you whether the two you
 * turned over are actually the same sound. That's the whole design — memory
 * gives the reading a reason to happen over and over without a quiz frame.
 *
 * The teaching twist for this inning is baked into the board, not bolted on:
 *   • a SWITCH-HITTER card carries two spellings of one sound (טוּ / טֻ) and
 *     matches a single sound card — "two marks, one sound", which is exactly
 *     what shuruk vs kubutz (and kamatz vs patach) are;
 *   • a CONTRAST duo puts שׁ and שׂ on the wall with the SAME vowel, so the two
 *     cards look nearly identical and only the side of the dot tells them
 *     apart. Mixing them up is the mistake the inning exists to fix.
 * Every sound spelling on the board is unique, so a pair is never ambiguous —
 * the confusion is in the Hebrew, where it belongs.
 *
 * Calm by design: no clock, no countdown, unlimited attempts, and nothing ever
 * flips back on a timer — a mismatch stays face up until the player taps again.
 * The "scout" peek is EARNED (three misses in a row), and it reveals a card's
 * face, never its sound, so the reading is still theirs to do.
 */
(function () {
  "use strict";

  HEB.registerGame({
    name: "Dugout Memory",
    goal: "Turn over two lineup cards. Read them. If the sound card says what the Hebrew card says, the pair locks into the dugout.",
    blurb: "Flip cards two at a time and match every Hebrew syllable to the sound it makes.",

    mount(root, api) {
      const { unit, LETTERS, VOWELS, syl, trHtml, say, shuffle, pick, randInt, el, esc } = api;

      api.style(`
        .dm-how{margin:0 0 10px}
        /* The wall is capped and centred: 20 cards stretched across a desktop
           panel would be four huge tiles a row and a page of scrolling. */
        .dm-stage,.dm-grid{max-width:470px;margin-left:auto;margin-right:auto}
        .dm-stage{display:grid;grid-template-columns:1fr auto 1fr;align-items:center;gap:8px;
          background:rgba(0,0,0,.3);border:1px dashed var(--line);border-radius:14px;
          padding:10px 8px;margin-bottom:12px}
        .dm-slot{text-align:center;min-height:84px;display:flex;flex-direction:column;
          align-items:center;justify-content:center;gap:2px}
        .dm-slot small{color:var(--muted);font-size:.68rem;letter-spacing:.8px;
          text-transform:uppercase;font-weight:900}
        .dm-slot .glyph{font-size:2.2rem;line-height:1.5}
        .dm-slot .tr{font-size:1.3rem}
        .dm-slot.empty{opacity:.45}
        .dm-forms{display:flex;flex-wrap:wrap;align-items:center;justify-content:center;gap:6px}
        .dm-eq{color:var(--lights);font-weight:900}
        .dm-vs{color:var(--muted);font-weight:900;font-size:.75rem}
        .dm-grid{display:grid;gap:6px;margin-bottom:12px}
        .dm-card{position:relative;aspect-ratio:4/5;min-height:62px;padding:0;border:0;
          background:none;font:inherit;color:var(--chalk);cursor:pointer;perspective:620px}
        .dm-inner{position:absolute;inset:0;transform-style:preserve-3d;transition:transform .4s ease}
        .dm-card.up .dm-inner{transform:rotateY(180deg)}
        .dm-face{position:absolute;inset:0;border:1px solid var(--line);border-radius:11px;
          display:flex;flex-direction:column;align-items:center;justify-content:center;
          padding:2px;overflow:hidden;backface-visibility:hidden;-webkit-backface-visibility:hidden}
        .dm-back{background-image:repeating-linear-gradient(135deg,rgba(255,255,255,.06) 0 5px,transparent 5px 10px),
          linear-gradient(160deg,#16354a,#0e2434)}
        .dm-num{color:var(--muted);font-size:.7rem;font-weight:900}
        .dm-front{transform:rotateY(180deg)}
        .dm-front.dm-heb{background:linear-gradient(165deg,#1a3d55,#102a3c);border-color:rgba(159,215,255,.45)}
        .dm-front.dm-snd{background:linear-gradient(165deg,#14442e,#0c2a1e);border-color:rgba(95,209,140,.45)}
        .dm-card.miss .dm-front{border-color:var(--bad)}
        .dm-card.peeked .dm-front{border-color:var(--lights);box-shadow:inset 0 0 0 2px rgba(255,209,102,.35)}
        .dm-card.locked{cursor:default}
        .dm-card.locked .dm-front{border-color:var(--good);box-shadow:inset 0 0 0 2px rgba(95,209,140,.3)}
        /* Nikud is the whole point, so the glyph is pushed as large as a card
           this size can hold — and the stage above echoes it larger still. */
        .dm-card .dm-g{font-size:clamp(1.3rem,6vw,2rem);line-height:1.25}
        .dm-card.twin .dm-g{font-size:clamp(1rem,4.6vw,1.5rem);line-height:1.2}
        .dm-tag{font-size:.54rem;letter-spacing:.6px;text-transform:uppercase;color:var(--lights);font-weight:900}
        .dm-say .tr{font-size:clamp(.78rem,3.4vw,1.05rem)}
        .dm-card:focus-visible{outline:3px solid #7fd4ff;outline-offset:2px;border-radius:12px}
      `);

      // ------------------------------------------------------------- pools
      const letters = unit.letterPool;
      // Sheva is (mostly) silent, so a card reading "b'" is a poor thing to
      // hunt for on a wall — and this inning is about oo, not about the quiet
      // one. Everything else the reader owns stays live.
      const vowels = unit.vowelPool.filter((k) => VOWELS[k].v !== "'");
      const newL = unit.newLetters.filter((c) => letters.includes(c));
      const newV = unit.newVowels.filter((k) => vowels.includes(k));
      const pickFrom = (arr) => (arr && arr.length ? pick(arr) : null);

      // Vowels drawn differently that SAY the same thing (shuruk/kubutz,
      // kamatz/patach, …). Found from the data, never hard-coded.
      const bySound = {};
      vowels.forEach((k) => (bySound[VOWELS[k].v] = (bySound[VOWELS[k].v] || []).concat(k)));
      const twinSounds = Object.keys(bySound).filter((v) => bySound[v].length >= 2);
      // Letters that share a base shape and differ only by a dot (שׁ/שׂ, בּ/ב …):
      // strip the mark by taking the first code point.
      const byShape = {};
      letters.forEach((ch) => {
        const base = String.fromCodePoint(ch.codePointAt(0));
        (byShape[base] = byShape[base] || []).push(ch);
      });
      const contrastSets = Object.values(byShape).filter(
        (g) => g.length >= 2 && new Set(g.map((c) => LETTERS[c].c)).size >= 2,
      );

      // ------------------------------------------------------- board build
      const TARGET = 10; // 10 pairs = a 4×5 wall
      const usedTr = new Set();
      const pairs = [];

      // A pair is one Hebrew card + one sound card. `forms` holds one syllable
      // (plain) or two spellings of the SAME sound (switch-hitter).
      function addPair(forms, sibling) {
        const clean = forms.filter(Boolean);
        if (!clean.length || usedTr.has(clean[0].tr)) return false;
        if (clean.some((f) => f.tr !== clean[0].tr)) return false;
        usedTr.add(clean[0].tr);
        pairs.push({ tr: clean[0].tr, forms: clean, sibling: sibling || null });
        return true;
      }
      const plain = (ch, vk, sibling) => (ch && vk ? addPair([syl(ch, vk)], sibling) : false);

      // 1. The headline switch-hitter: the vowel group this inning introduced.
      const twinSound =
        twinSounds.find((v) => bySound[v].some((k) => newV.includes(k))) || pickFrom(twinSounds);
      const contrastSet =
        contrastSets.find((g) => g.some((c) => newL.includes(c))) || pickFrom(contrastSets) || [];
      if (twinSound) {
        const keys = bySound[twinSound].slice(0, 2);
        const twinL =
          pickFrom(newL.filter((c) => !contrastSet.includes(c))) || pickFrom(newL) || pick(letters);
        addPair(keys.map((k) => syl(twinL, k)));
      }

      // 2. The contrast duo: same vowel on both look-alike letters, so the only
      //    thing separating the two cards on the wall is the side of the dot.
      if (contrastSet.length >= 2) {
        const cv = pickFrom(newV) || pick(vowels);
        contrastSet.slice(0, 2).forEach((ch) => {
          const sib = contrastSet.find((x) => x !== ch && LETTERS[x].c !== LETTERS[ch].c);
          plain(ch, cv, sib);
        });
      }

      // 3. A second switch-hitter from an EARLIER inning's vowel pair, on an
      //    older letter — the same lesson, already-owned material.
      const oldTwin = pickFrom(twinSounds.filter((v) => v !== twinSound));
      if (oldTwin) {
        const keys = bySound[oldTwin].slice(0, 2);
        addPair(keys.map((k) => syl(pickFrom(unit.prevLetters) || pick(letters), k)));
      }

      // 4. Fill the rest, weighted toward tonight's new letters and vowels but
      //    never only them — the wall should still be full of review.
      for (let guard = 400; pairs.length < TARGET && guard > 0; guard--) {
        const ch = (newL.length && randInt(100) < 55 ? pickFrom(newL) : null) || pick(letters);
        const vk = (newV.length && randInt(100) < 45 ? pickFrom(newV) : null) || pick(vowels);
        plain(ch, vk);
      }

      // Never render a grid we can't fill: step down to the largest board the
      // available distinct sounds actually support, and only ever use a column
      // count that divides the card count evenly so the wall stays rectangular.
      const PAIRS =
        pairs.length >= 10 ? 10 : pairs.length >= 8 ? 8 : pairs.length >= 6 ? 6 : pairs.length;
      const chosen = pairs.slice(0, PAIRS);
      const cardCount = chosen.length * 2;
      const cols = cardCount % 4 === 0 ? 4 : cardCount % 3 === 0 ? 3 : 2;

      const cards = shuffle(
        chosen.flatMap((p) => [
          { pair: p, type: "heb", up: false, locked: false },
          { pair: p, type: "snd", up: false, locked: false },
        ]),
      );
      cards.forEach((c, i) => (c.n = i + 1));

      // ------------------------------------------------------------- state
      let found = 0;
      let flips = 0;
      let misses = 0;
      let streak = 0; // consecutive misses — three of them earn a scout
      let scouts = 0;
      let scouting = false;
      let turn = []; // the cards face-up in the current attempt
      let pending = null; // {kind:'miss'|'peek', cards:[…]} — cleared by a tap, never a timer

      root.innerHTML = `
        <p class="note dm-how">Tap a lineup card to turn it over, then turn a second one.
          <b>Read them both out loud.</b> If the sound card says what the Hebrew card says, the pair
          locks into the dugout. Nothing flips back on its own — tap again when you're ready.
          No clock.</p>
        <div class="dm-stage">
          <div class="dm-slot empty" id="dm-s1"></div>
          <div class="dm-vs" aria-hidden="true">vs</div>
          <div class="dm-slot empty" id="dm-s2"></div>
        </div>
        <div class="dm-grid" id="dm-grid" role="group" aria-label="Dugout wall of lineup cards"></div>
        <div class="row">
          <button class="btn sm" type="button" id="dm-scout" aria-pressed="false" disabled>🔎 Scout a card</button>
          <span class="note" id="dm-scout-note"></span>
        </div>`;

      const grid = root.querySelector("#dm-grid");
      const slot1 = root.querySelector("#dm-s1");
      const slot2 = root.querySelector("#dm-s2");
      const scoutBtn = root.querySelector("#dm-scout");
      const scoutNote = root.querySelector("#dm-scout-note");
      grid.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;

      const faceHtml = (card) =>
        card.type === "heb"
          ? card.pair.forms.map((f) => `<span class="glyph dm-g">${f.heb}</span>`).join("") +
            (card.pair.forms.length > 1 ? '<span class="dm-tag">both</span>' : "")
          : `<span class="dm-say">${trHtml(card.pair.forms[0])}</span>`;

      cards.forEach((card) => {
        const twin = card.type === "heb" && card.pair.forms.length > 1 ? " twin" : "";
        const btn = el(`<button class="dm-card${twin}" type="button" aria-pressed="false">
          <span class="dm-inner">
            <span class="dm-face dm-back"><span class="dm-num">${card.n}</span></span>
            <span class="dm-face dm-front ${card.type === "heb" ? "dm-heb" : "dm-snd"}">${faceHtml(card)}</span>
          </span>
        </button>`);
        card.btn = btn;
        btn.addEventListener("click", () => onTap(card));
        grid.appendChild(btn);
      });

      // --------------------------------------------------------- rendering
      function slotHtml(card, label) {
        if (!card) return `<small>${esc(label)}</small><span class="glyph">⚾</span>`;
        const body =
          card.type === "heb"
            ? `<span class="dm-forms">${card.pair.forms
                .map((f) => `<span class="glyph">${f.heb}</span>`)
                .join('<span class="dm-eq">=</span>')}</span>`
            : `<span class="dm-say">${trHtml(card.pair.forms[0])}</span>`;
        return `<small>${esc(label)} · ${card.type === "heb" ? "Hebrew" : "sound"}</small>${body}`;
      }

      function render() {
        const shown = pending ? pending.cards : turn;
        const peeking = !!pending && pending.kind === "peek";
        slot1.innerHTML = slotHtml(shown[0], peeking ? "scouting report" : "1st card");
        slot2.innerHTML = slotHtml(peeking ? null : shown[1], "2nd card");
        slot1.classList.toggle("empty", !shown[0]);
        slot2.classList.toggle("empty", peeking || !shown[1]);
        cards.forEach((c) => {
          c.btn.classList.toggle("up", c.up || c.locked);
          c.btn.classList.toggle("locked", c.locked);
          c.btn.classList.toggle("miss", !!pending && pending.kind === "miss" && c.up);
          c.btn.classList.toggle("peeked", peeking && pending.cards.includes(c));
          c.btn.setAttribute("aria-pressed", String(c.up || c.locked));
          c.btn.setAttribute(
            "aria-label",
            c.locked
              ? `Card ${c.n}, matched`
              : c.up
                ? `Card ${c.n}, face up, ${c.type === "heb" ? "Hebrew syllable" : "sound " + c.pair.tr}`
                : `Card ${c.n}, face down`,
          );
        });
        scoutBtn.disabled = scouts === 0 && !scouting;
        scoutBtn.setAttribute("aria-pressed", String(scouting));
        scoutBtn.textContent = scouts ? `🔎 Scout a card (${scouts})` : "🔎 Scout a card";
        scoutNote.textContent = scouting
          ? "Now tap any face-down card to take a look at it."
          : scouts
            ? "You earned a look at one face-down card."
            : "Miss three in a row and the scout comes down from the press box.";
        api.setHud(
          `<span class="stat">Pairs ${found}/${chosen.length}</span>` +
            `<span class="stat">Flips ${flips}</span>` +
            `<span class="stat">🔎 ${scouts}</span>`,
        );
      }

      // -------------------------------------------------------- the coaching
      function matchMsg(p) {
        const f = p.forms[0];
        if (p.forms.length > 1) {
          const a = p.forms[0].V;
          const b = p.forms[1].V;
          return `<b>${esc(p.tr)}</b> — and there's tonight's whole lesson. <b>${esc(a.name)}</b>
            (${esc(a.art)}) and <b>${esc(b.name)}</b> (${esc(b.art)}) look nothing alike, but they
            BOTH say <b>${esc(f.v)}</b>. Two different marks, one sound.`;
        }
        if (p.sibling) {
          const S = LETTERS[p.sibling];
          return `<b>${esc(p.tr)}</b> — ${esc(f.L.name)}. ${esc(f.L.note)} Move that dot and it
            becomes ${esc(S.name)}, which says <b>${esc(S.c)}</b>. The side of the dot is the
            entire difference.`;
        }
        return `<b>${esc(p.tr)}</b> — ${esc(f.L.name)} says <b>${esc(f.L.c || "nothing")}</b>,
          ${esc(f.V.name)} says <b>${esc(f.v)}</b>.`;
      }

      // Tiered on purpose: the first miss just reads back ONE card, later
      // misses name the trap. Never the answer, never both halves at once.
      function missMsg(a, b) {
        if (misses === 1) {
          return `Those two aren't a pair. The second card you turned says <b>${esc(b.pair.tr)}</b> —
            remember where it lives. Tap any card to turn them back over.`;
        }
        const dotted = [a, b].find((c) => c.pair.sibling);
        if (dotted) {
          const L = dotted.pair.forms[0].L;
          return `<b>${esc(a.pair.tr)}</b> and <b>${esc(b.pair.tr)}</b> aren't the same sound. Check
            the <b>dot</b> on ${esc(L.name)}: ${esc(L.note)}${L.watch ? " 👀 " + esc(L.watch) : ""}`;
        }
        const twin = [a, b].find((c) => c.pair.forms.length > 1);
        if (twin) {
          const t = twin.pair.forms;
          return `<b>${esc(a.pair.tr)}</b> and <b>${esc(b.pair.tr)}</b> — no match. And remember:
            two marks that look nothing alike can still say one sound. <b>${esc(t[0].V.name)}</b> and
            <b>${esc(t[1].V.name)}</b> both say <b>${esc(t[0].v)}</b>.`;
        }
        return `<b>${esc(a.pair.tr)}</b> and <b>${esc(b.pair.tr)}</b> — two different sounds, so they
          don't pair up. Say each card out loud as you turn it; that's what makes the spot stick.`;
      }

      // --------------------------------------------------------- interaction
      function clearPending() {
        const was = pending.cards;
        was.forEach((c) => (c.up = false));
        pending = null;
        api.clearFeedback();
        return was;
      }

      function onTap(card) {
        // A face-up mismatch (or a scouting peek) waits for the player, not a
        // clock. The next tap puts those cards back — and only then does the
        // tap count as the start of a new turn.
        if (pending) {
          const was = clearPending();
          render();
          if (was.includes(card)) return;
        }
        if (card.locked) {
          say(card.pair.forms[0].heb, card.pair.tr);
          return;
        }
        if (scouting) {
          scouting = false;
          scouts = Math.max(0, scouts - 1);
          card.up = true;
          pending = { kind: "peek", cards: [card] };
          say(card.type === "heb" ? card.pair.forms[0].heb : "", card.pair.tr);
          api.feedback(
            "tip",
            `Scouting report on card ${card.n}. Read it, remember where it sits, then tap any card to slide it back.`,
          );
          render();
          return;
        }
        if (card.up || turn.length >= 2) return; // no card can be flipped twice
        card.up = true;
        turn.push(card);
        flips++;
        say(card.type === "heb" ? card.pair.forms[0].heb : "", card.pair.tr);
        if (turn.length === 1) {
          api.feedback("tip", "Read that one out loud, then turn over a second card.");
          render();
          return;
        }
        resolveTurn();
      }

      function resolveTurn() {
        const [a, b] = turn;
        turn = [];
        if (a.pair === b.pair) {
          a.locked = b.locked = true;
          found++;
          streak = 0;
          const lesson = matchMsg(a.pair);
          render();
          if (found === chosen.length) {
            // api.win() REPLACES the feedback box, so the last pair's coaching
            // rides along inside the win message instead of being wiped out —
            // and the last pair is as likely as any to be the switch-hitter.
            grid.classList.add("cleared");
            api.win(
              `${lesson}<br><br>🏆 Dugout cleared — all ${chosen.length} pairs matched in
               ${flips} flips. You read every one of them, dots and all. Great inning.`,
            );
            return;
          }
          api.feedback("ok", lesson);
          return;
        }
        misses++;
        streak++;
        pending = { kind: "miss", cards: [a, b] };
        let msg = missMsg(a, b);
        if (streak >= 3) {
          streak = 0;
          scouts++;
          msg += ` <br><b>Scout earned.</b> Three tough turns in a row — use the 🔎 button to take
            one good look at any face-down card.`;
        }
        api.feedback("no", msg);
        render();
      }

      scoutBtn.addEventListener("click", () => {
        if (pending) {
          clearPending();
        }
        scouting = scouting ? false : scouts > 0;
        render();
      });

      render();
    },
  });
})();
