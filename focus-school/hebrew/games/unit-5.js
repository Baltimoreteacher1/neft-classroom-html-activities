/* 5th Inning game — BASE RUNNING.
 *
 * Mechanic: hand management. You hold five vowel cards dealt off a deck. Each
 * base ahead of the runner shows a BARE letter and calls the sound it wants
 * ("loh"); you advance by spending the card that turns that letter into that
 * sound. When the sound you need isn't in hand you pay the game's only real
 * cost — throw a card back to draw a new one.
 *
 * The reading IS the resource: cards show only the MARK, never its sound, so
 * choosing one means reading nikud. A "sign key" toggle reveals the sounds for
 * anyone who wants that scaffold, and tier-3 help flips it on for them.
 *
 * Tonight's teaching point rides in the preview: pick a card and the plate
 * shows the letter WEARING it, so ֹ landing on the shoulder and וֹ trailing
 * after the letter become two visibly different pictures of one sound.
 *
 * Calm by design: no clock, no fail state, unlimited attempts, and redraw is
 * always available, so the hand can never dead-end.
 */
(function () {
  "use strict";

  HEB.registerGame({
    name: "Base Running",
    goal: "Each base calls for a sound. Play the vowel card that makes it with that base's letter, and run the diamond three times.",
    blurb:
      "Hold five vowel cards. Spend the right one at each base to move your runner around the diamond.",

    mount(root, api) {
      const { unit, LETTERS, VOWELS, syl, trHtml, say, shuffle, pick, randInt, el, esc } = api;

      // A base demands a SPOKEN sound, so a silent vowel has nothing to demand —
      // and a card that can never satisfy any base is dead weight in a hand
      // game. Filtered off V.v so this holds for whatever the pool becomes.
      const playable = unit.vowelPool.filter((k) => VOWELS[k] && VOWELS[k].v !== "'");
      const VKEYS = playable.length >= 2 ? playable : unit.vowelPool.slice();
      const LKEYS = unit.letterPool.filter((ch) => LETTERS[ch]);
      const newV = unit.newVowels.filter((k) => VKEYS.includes(k));
      const newL = unit.newLetters.filter((ch) => LKEYS.includes(ch));

      const HAND_SIZE = 5;
      const INNINGS = 3;
      // Home is both the start and the finish, so one lap is four legs and the
      // runner never has to teleport between innings.
      const SPOTS = [
        { x: 50, y: 92, label: "Home" },
        { x: 92, y: 50, label: "1st base" },
        { x: 50, y: 8, label: "2nd base" },
        { x: 8, y: 50, label: "3rd base" },
        { x: 50, y: 92, label: "Home" },
      ];

      api.style(`
        .bd-field{position:relative;width:100%;max-width:268px;margin:0 auto 10px;aspect-ratio:1/1}
        .bd-grass{position:absolute;inset:4%;border-radius:18px;
          background:radial-gradient(circle at 50% 65%,#1c4b32,#0c281b)}
        .bd-infield{position:absolute;left:50%;top:50%;width:58%;height:58%;margin:-29% 0 0 -29%;
          transform:rotate(45deg);background:rgba(224,122,95,.2);
          border:2px solid rgba(224,122,95,.5);border-radius:8px}
        .bd-base{position:absolute;width:36px;height:36px;margin:-18px 0 0 -18px;border-radius:9px;
          display:grid;place-items:center;font-size:.58rem;font-weight:900;letter-spacing:.4px;
          background:rgba(255,255,255,.16);border:2px solid var(--line);color:var(--muted)}
        .bd-base.touched{background:var(--good);border-color:var(--good);color:var(--ink)}
        .bd-base.next{border-color:var(--lights);color:var(--lights);box-shadow:0 0 0 5px rgba(255,209,102,.18)}
        .bd-runner{position:absolute;width:40px;height:40px;margin:-20px 0 0 -20px;z-index:2;
          display:grid;place-items:center;font-size:1.55rem;
          transition:left .5s ease,top .5s ease}
        .bd-status{text-align:center;font-size:.92rem;color:var(--muted);margin:0 0 12px}
        .bd-status b{color:var(--lights)}
        .bd-plate{display:grid;gap:5px;width:100%;text-align:center;font:inherit;color:inherit;
          cursor:pointer;background:rgba(0,0,0,.3);border:2px dashed var(--line);
          border-radius:14px;padding:13px 12px;min-height:44px}
        .bd-plate.armed{border-style:solid;border-color:var(--lights);background:rgba(255,209,102,.1)}
        .bd-plate[disabled]{cursor:default;opacity:.65}
        .bd-tag{font-size:.7rem;letter-spacing:1.2px;text-transform:uppercase;color:var(--muted);font-weight:900}
        .bd-plate .glyph{font-size:3.1rem}
        .bd-want{font-size:1rem}
        .bd-want b{color:var(--lights);font-size:1.16rem}
        .bd-cue{font-size:.84rem;color:var(--muted)}
        .bd-handlabel{font-size:.72rem;letter-spacing:1.2px;text-transform:uppercase;
          color:var(--muted);font-weight:900;margin:16px 0 6px}
        .bd-hand small{visibility:hidden}
        .bd-hand.keyed small{visibility:visible}
        /* .btn.sm is 38px tall in the shared sheet — too small for a thumb. */
        .bd-act{min-height:46px;flex:1 1 auto}
        /* .btn has no pressed state in the shared sheet; the toggle needs one. */
        .bd-act[aria-pressed="true"]{background:var(--lights);color:var(--ink);border-color:var(--lights)}
      `);

      let deck = [];
      let hand = [];
      let selected = null; // index into hand
      let base = null; // { letter, want }
      let leg = 0; // bases taken this lap, 0..4
      let inning = 1;
      let runs = 0;
      let misses = 0;
      let over = false;

      root.innerHTML = `
        <p class="note bd-intro">Your runner is on the basepaths. Every base shows a <b>letter</b> and
        calls out the <b>sound</b> it wants. Tap the vowel card from your hand that makes that sound
        with that letter, then tap the base to play it. The card is spent — the dugout deals you
        another. Three trips around the diamond scores three runs.</p>
        <div class="bd-field" id="bd-field" aria-hidden="true">
          <div class="bd-grass"></div><div class="bd-infield"></div>
          <div class="bd-runner" id="bd-runner">🏃</div>
        </div>
        <p class="bd-status" id="bd-status"></p>
        <button class="bd-plate" type="button" id="bd-plate">
          <span class="bd-tag" id="bd-tag"></span>
          <span class="glyph" id="bd-glyph"></span>
          <span class="bd-want" id="bd-want"></span>
          <span class="bd-cue" id="bd-cue"></span>
        </button>
        <div class="bd-handlabel">Your hand — vowel cards</div>
        <div class="blend-pick bd-hand" id="bd-hand" role="group" aria-label="Your vowel cards"></div>
        <div class="row">
          <button class="btn sm bd-act" type="button" id="bd-redraw">🔄 Ask for a new sign</button>
          <button class="btn sm bd-act" type="button" id="bd-key" aria-pressed="false">
            👀 Sign key
          </button>
        </div>`;

      const field = root.querySelector("#bd-field");
      const runner = root.querySelector("#bd-runner");
      const status = root.querySelector("#bd-status");
      const plate = root.querySelector("#bd-plate");
      const handHost = root.querySelector("#bd-hand");
      const keyBtn = root.querySelector("#bd-key");

      // Four pads, drawn once; only their state classes change after that.
      const pads = SPOTS.slice(0, 4).map((s) => {
        const pad = el(
          `<div class="bd-base" style="left:${s.x}%;top:${s.y}%">${esc(
            s.label.replace(" base", "").toUpperCase(),
          )}</div>`,
        );
        field.appendChild(pad);
        return pad;
      });

      // ------------------------------------------------------------- deck
      // Weighted toward tonight's new vowels so the oh cards actually turn up,
      // and rebuilt (never exhausted) so a long game can't strand the player.
      function buildDeck() {
        const cards = [];
        for (const k of VKEYS) {
          const copies = newV.includes(k) ? 5 : 3;
          for (let i = 0; i < copies; i++) cards.push(k);
        }
        deck = shuffle(cards);
      }
      function refillHand() {
        while (hand.length < HAND_SIZE) {
          if (!deck.length) {
            buildDeck();
            api.toast("Fresh deck of signs from the dugout.");
          }
          hand.push(deck.pop());
        }
      }

      // ------------------------------------------------------------- bases
      function rollBase() {
        const letter = newL.length && randInt(2) === 0 ? pick(newL) : pick(LKEYS);
        // The catcher calls a sign the pitcher can actually flash: two bases in
        // three demand a sound the current hand can already make. The remaining
        // third is where the redraw earns its keep — enough tension to make the
        // hand feel like a resource, not so much that the game becomes shuffling.
        const held = hand.filter((k) => VKEYS.includes(k));
        const bag = held.length && randInt(3) !== 0 ? held : VKEYS;
        const fresh = bag.filter((k) => newV.includes(k));
        const vowel = fresh.length && randInt(2) === 0 ? pick(fresh) : pick(bag);
        return { letter, want: syl(letter, vowel) };
      }
      // Reroll a base that repeats the one just cleared — bounded, because a
      // one-letter/one-vowel pool has nothing else to offer and must not hang.
      function nextBase() {
        const same = (b) => base && b.letter === base.letter && b.want.tr === base.want.tr;
        let b = rollBase();
        for (let i = 0; i < 8 && same(b); i++) b = rollBase();
        base = b;
        misses = 0;
      }
      // Every vowel in the pool that would satisfy the current base — usually
      // one, but two whenever the pool holds a pair that says the same thing
      // (ֹ and וֹ, ָ and ַ). Hints must own that, not pretend there's one answer.
      const solvers = () => VKEYS.filter((k) => syl(base.letter, k).tr === base.want.tr);

      // ------------------------------------------------------------ render
      const tag = root.querySelector("#bd-tag");
      const glyph = root.querySelector("#bd-glyph");
      const want = root.querySelector("#bd-want");
      const cue = root.querySelector("#bd-cue");

      function draw() {
        const spot = SPOTS[leg];
        runner.style.left = spot.x + "%";
        runner.style.top = spot.y + "%";
        pads.forEach((pad, i) => {
          pad.classList.toggle("touched", (i >= 1 && i <= leg) || (i === 0 && leg === 4));
          pad.classList.toggle("next", !over && i === (leg + 1) % 4);
        });

        if (over) {
          status.innerHTML = `<b>${runs} runs</b> — that's the ballgame.`;
          plate.disabled = true;
          plate.classList.remove("armed");
          tag.textContent = "Final";
          glyph.textContent = "🏆";
          want.textContent = "You read your way around the diamond three times.";
          cue.textContent = "";
        } else {
          const here = leg === 0 ? "at home plate" : "on " + SPOTS[leg].label;
          status.innerHTML = `Inning ${inning} — runner ${esc(here)}, heading for <b>${esc(
            SPOTS[leg + 1].label,
          )}</b>.`;
          tag.textContent = "Next stop · " + SPOTS[leg + 1].label;
          want.innerHTML = `wants the sound <b>${esc(base.want.tr)}</b>`;
          // The preview is the whole teaching payoff tonight: the same "oh"
          // shows up as a dot on the shoulder or a Vav trailing the letter.
          const card = selected === null ? null : hand[selected];
          glyph.textContent = card ? base.letter + VOWELS[card].ch : base.letter;
          plate.classList.toggle("armed", !!card);
          cue.textContent = card
            ? "Tap here to play that card."
            : "Pick a vowel card below, then tap here.";
        }

        handHost.innerHTML = "";
        hand.forEach((k, i) => {
          const V = VOWELS[k];
          const b = el(
            `<button class="chip" type="button" aria-pressed="${selected === i}"><span class="glyph">א${
              V.ch
            }</span><small>${esc(V.v)}</small></button>`,
          );
          b.addEventListener("click", () => {
            selected = selected === i ? null : i;
            draw();
          });
          handHost.appendChild(b);
        });

        api.setHud(
          `<span class="stat">🏃 Runs ${runs}/${INNINGS}</span>` +
            `<span class="stat">Inning ${Math.min(inning, INNINGS)} of ${INNINGS}</span>` +
            `<span class="stat">Deck ${deck.length}</span>` +
            `<span class="stat">Hand ${hand.length}</span>`,
        );
      }

      // -------------------------------------------------------------- play
      plate.addEventListener("click", () => {
        if (over) return;
        if (selected === null) {
          api.feedback("tip", "Pick a vowel card from your hand first, then tap the base.");
          return;
        }
        const key = hand[selected];
        const made = syl(base.letter, key);
        say(made.heb, made.tr);

        if (made.tr !== base.want.tr) {
          diagnose(made);
          return;
        }

        hand.splice(selected, 1);
        selected = null;
        refillHand();
        const reached = SPOTS[leg + 1].label;
        leg++;
        if (leg === 4) {
          runs++;
          if (runs >= INNINGS) over = true;
          else {
            inning++;
            leg = 0;
          }
        }
        nextBase();
        api.feedback(
          "ok",
          `${trHtml(made)} — safe at ${esc(reached)}! ${esc(made.L.name)} says <b>${esc(
            made.c || "nothing",
          )}</b>, ${esc(made.V.name)} says <b>${esc(made.v)}</b>.` +
            (leg === 0 || over ? " <b>Run scored.</b>" : ""),
        );
        draw();
        if (over) {
          api.win("🏆 Three runs, three trips around the diamond. You read every sign yourself.");
        }
      });

      // Tiered coaching: name the ERROR first, then the shape, then the name.
      // Never the card itself while the player still has moves to make.
      function diagnose(made) {
        misses++;
        if (misses === 1) {
          api.feedback(
            "no",
            `That sign turns <b>${esc(LETTERS[base.letter].name)}</b> into <b>${esc(
              made.tr,
            )}</b> — this base is calling for <b>${esc(base.want.tr)}</b>. Read the mark again.`,
          );
          return;
        }
        const keys = solvers();
        if (misses === 2) {
          const shapes = keys.map((k) => `<b>${esc(VOWELS[k].art)}</b>`).join(" — or ");
          api.feedback(
            "tip",
            `Still after <b>${esc(base.want.tr)}</b>. Look for ${shapes}. ` +
              "If nothing in your hand looks like that, throw a card back and ask for a new sign — it costs you nothing.",
          );
          return;
        }
        setKey(true);
        const names = keys.map((k) => `<b>${esc(VOWELS[k].name)}</b>`).join(" or ");
        api.feedback(
          "tip",
          `The sign you need is ${names} — it says <b>${esc(
            base.want.v,
          )}</b>. I turned the sign key on, so every card in your hand now shows what it says.`,
        );
      }

      // ------------------------------------------------------------ actions
      root.querySelector("#bd-redraw").addEventListener("click", () => {
        if (over) return;
        if (selected === null) {
          api.feedback("tip", "Tap the card you want to throw back first, then ask again.");
          return;
        }
        const tossed = VOWELS[hand[selected]];
        hand.splice(selected, 1);
        selected = null;
        refillHand();
        api.feedback(
          "tip",
          `You threw back the sign with ${esc(tossed.art)}. The dugout dealt you a fresh card.`,
        );
        draw();
      });

      function setKey(on) {
        handHost.classList.toggle("keyed", on);
        keyBtn.setAttribute("aria-pressed", String(on));
      }
      keyBtn.addEventListener("click", () => {
        setKey(keyBtn.getAttribute("aria-pressed") !== "true");
      });

      buildDeck();
      refillHand();
      nextBase();
      draw();
    },
  });
})();
