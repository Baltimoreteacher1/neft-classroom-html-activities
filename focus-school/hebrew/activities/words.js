/* Nightly Hebrew — from pieces to whole words.
 *
 *   workshop (required) Word Workshop — take a real word apart into the exact
 *                       units the blending machine teaches (one letter plus
 *                       whatever mark is stuck to it), read each one, then put
 *                       it back together. This is the bridge between drilling
 *                       syllables and reading anything.
 *   builder  (bonus)    Word Builder — rebuild a word from a shuffled tray,
 *                       right to left. Getting the ORDER right is its own
 *                       skill when your eyes are trained on English.
 *   meaning  (bonus)    Match the Meaning — Hebrew to English. Decoding a word
 *                       you do not understand is only half of reading.
 */
(function () {
  "use strict";

  const WORKSHOP_N = 6;
  const BUILDER_N = 5;
  const MATCH_N = 8;

  HEB.registerActivity({
    id: "workshop",
    title: "🔨 Word Workshop",
    how: "Six real words, taken apart piece by piece and put back together.",
    mount(root, api) {
      const { el, $ } = api;
      const words = api.sample(api.allWords(), WORKSHOP_N);
      root.innerHTML = `
        <p class="note">A long word is never one thing to learn — it is a few pieces you already own, sitting next to each other. Break each word, read every piece, then say the whole thing.</p>
        <div id="ws-list"></div>
        <div class="feedback" id="ws-fb"></div>`;
      const host = $("#ws-list", root);
      const fbn = $("#ws-fb", root);
      let finished = 0;

      words.forEach((w) => {
        const ps = api.pieces(w.heb).filter((p) => !p.sep);
        const card = el(`<div class="ws-card">
          <div class="ws-word"><span class="glyph">${w.heb}</span></div>
          <div class="row"><button class="btn sm" type="button" data-act="break">🔨 Break it into pieces</button></div>
          <div class="ws-pieces" hidden></div>
          <div class="ws-hint note" hidden></div>
          <div class="row ws-finish" hidden><button class="btn primary sm" type="button" data-act="whole">I said the whole word — check me</button></div>
          <div class="ws-answer" hidden></div>
        </div>`);
        const piecesWrap = $(".ws-pieces", card);
        const hintWrap = $(".ws-hint", card);
        const finishRow = $(".ws-finish", card);
        const answer = $(".ws-answer", card);
        let read = 0;

        $('[data-act="break"]', card).addEventListener("click", (e) => {
          e.currentTarget.disabled = true;
          piecesWrap.hidden = false;
          // Right-to-left: the pieces are laid out in reading order, and the
          // container is RTL, so piece 1 is on the right where it belongs.
          ps.forEach((p, idx) => {
            const b = el(`<button class="ws-piece" type="button">
              <span class="pn">${idx + 1}</span>
              <span class="glyph">${p.heb}</span>
              <span class="peek">?</span>
            </button>`);
            b.addEventListener("click", () => {
              api.say(p.heb, p.tr);
              if (b.classList.contains("revealed")) return;
              b.classList.add("revealed");
              $(".peek", b).textContent = p.tr;
              if (p.hint) {
                hintWrap.hidden = false;
                hintWrap.innerHTML = `💡 ${api.esc(p.hint)}`;
              }
              read++;
              if (read === ps.length) finishRow.hidden = false;
            });
            piecesWrap.appendChild(b);
          });
        });

        $('[data-act="whole"]', card).addEventListener("click", (e) => {
          e.currentTarget.disabled = true;
          api.say(w.heb, w.tr);
          answer.hidden = false;
          answer.innerHTML = `<span class="tr"><span class="c">${api.esc(
            w.tr,
          )}</span></span> <span class="en">${api.esc(w.en)}</span>`;
          card.classList.add("done");
          finished++;
          if (finished === words.length) {
            api.fb(
              fbn,
              "ok",
              "Six words taken apart and put back together. Nothing in the siddur is built any differently. 🔨",
            );
            api.done();
          } else {
            api.fb(fbn, "tip", `${finished} of ${words.length} words built.`);
          }
        });

        host.appendChild(card);
      });
    },
  });

  // ---------------------------------------------------------- word builder
  HEB.registerActivity({
    id: "builder",
    title: "🧱 Word Builder",
    how: "Five words, one shuffled tray each. Build them right to left.",
    mount(root, api) {
      const { el, $ } = api;
      const pool = api
        .allWords()
        .filter((w) => api.pieces(w.heb).filter((p) => !p.sep).length >= 3);
      const words = api.sample(pool.length >= BUILDER_N ? pool : api.allWords(), BUILDER_N);
      root.innerHTML = `
        <p class="note">Tap the pieces in the order you would <b>read</b> them — starting on the right. Get one wrong and it just bounces back; nothing is lost.</p>
        <div class="row"><b id="wb-count"></b><span class="spacer"></span><span class="note" id="wb-score"></span></div>
        <div class="wb-target" id="wb-target"></div>
        <div class="wb-slots" id="wb-slots"></div>
        <div class="wb-tray" id="wb-tray"></div>
        <div class="feedback" id="wb-fb"></div>`;

      let n = 0;
      let clean = 0;
      let missedThis = false;
      const fbn = $("#wb-fb", root);

      function nextWord() {
        if (n >= words.length) {
          $("#wb-target", root).innerHTML = `<div class="qdone">🧱</div>`;
          $("#wb-slots", root).innerHTML = "";
          $("#wb-tray", root).innerHTML = "";
          $("#wb-count", root).textContent = "All built";
          api.fb(
            fbn,
            "ok",
            `<b>${clean} of ${words.length} built with no wrong taps.</b> Right to left is starting to feel normal.`,
          );
          api.done();
          return;
        }
        const w = words[n];
        n++;
        missedThis = false;
        const ps = api.pieces(w.heb).filter((p) => !p.sep);
        $("#wb-count", root).textContent = `Word ${n} of ${words.length}`;
        $("#wb-score", root).textContent = `${clean} clean`;
        $("#wb-target", root).innerHTML =
          `<span class="tlabel">Build</span><span class="tsound">${api.esc(
            w.tr,
          )}</span><span class="ten">${api.esc(w.en)}</span>`;
        const slots = $("#wb-slots", root);
        const tray = $("#wb-tray", root);
        slots.innerHTML = "";
        tray.innerHTML = "";
        ps.forEach(() => slots.appendChild(el('<span class="wb-slot"></span>')));
        let at = 0;
        api.shuffle(ps.map((p, i) => ({ p, i }))).forEach(({ p, i }) => {
          const b = el(
            `<button class="wb-tile" type="button"><span class="glyph">${
              p.heb
            }</span><small>${api.esc(p.tr)}</small></button>`,
          );
          b.addEventListener("click", () => {
            if (b.disabled) return;
            if (i !== at) {
              missedThis = true;
              b.classList.add("bump");
              setTimeout(() => b.classList.remove("bump"), 320);
              api.fb(
                fbn,
                "no",
                at === 0
                  ? "Start on the <b>right</b> — the first sound you say goes in the rightmost slot."
                  : `You are looking for the piece that says <b>${api.esc(ps[at].tr)}</b> next.`,
              );
              return;
            }
            b.disabled = true;
            b.classList.add("used");
            slots.children[at].innerHTML = `<span class="glyph">${p.heb}</span>`;
            api.say(p.heb, p.tr);
            at++;
            if (at === ps.length) {
              if (!missedThis) clean++;
              api.say(w.heb, w.tr);
              api.fb(
                fbn,
                "ok",
                `<span class="glyph md">${w.heb}</span> — <b>${api.esc(w.tr)}</b>, ${api.esc(w.en)}.`,
              );
              setTimeout(nextWord, 1400);
            } else {
              api.fb(fbn, "tip", `${at} of ${ps.length} placed.`);
            }
          });
          tray.appendChild(b);
        });
      }
      nextWord();
    },
  });

  // ------------------------------------------------------ match the meaning
  HEB.registerActivity({
    id: "meaning",
    title: "🗂️ Match the Meaning",
    how: "Eight words, eight meanings. Decoding a word you don't understand is only half of reading.",
    mount(root, api) {
      const { el, $ } = api;
      const words = api.sample(api.allWords(), MATCH_N);
      root.innerHTML = `
        <p class="note">Tap a Hebrew word, then tap what it means. Say the word out loud before you match it.</p>
        <div class="match">
          <div class="match-col" id="mt-heb"></div>
          <div class="match-col" id="mt-en"></div>
        </div>
        <div class="feedback" id="mt-fb"></div>`;
      const hebCol = $("#mt-heb", root);
      const enCol = $("#mt-en", root);
      const fbn = $("#mt-fb", root);
      let picked = null;
      let matched = 0;
      let misses = 0;

      api.shuffle(words).forEach((w, i) => {
        const b = el(
          `<button class="match-item heb" type="button" data-k="${i}"><span class="glyph">${w.heb}</span></button>`,
        );
        b.dataset.heb = w.heb;
        b.addEventListener("click", () => {
          if (b.classList.contains("matched")) return;
          api.say(w.heb, w.tr);
          picked = picked === b ? null : b;
          hebCol
            .querySelectorAll(".match-item")
            .forEach((x) => x.classList.toggle("sel", x === picked));
        });
        hebCol.appendChild(b);
      });
      api.shuffle(words.slice()).forEach((w) => {
        const b = el(`<button class="match-item en" type="button">${api.esc(w.en)}</button>`);
        b.dataset.heb = w.heb;
        b.addEventListener("click", () => {
          if (b.classList.contains("matched")) return;
          if (!picked) {
            api.fb(fbn, "tip", "Pick a Hebrew word first.");
            return;
          }
          if (picked.dataset.heb !== w.heb) {
            misses++;
            b.classList.add("bump");
            setTimeout(() => b.classList.remove("bump"), 320);
            const real = words.find((x) => x.heb === picked.dataset.heb);
            api.fb(
              fbn,
              "no",
              misses < 3
                ? "Not that one. Read the Hebrew out loud first — the sound often gives the meaning away."
                : `That word says <b>${api.esc(real.tr)}</b>. Which meaning sounds like it?`,
            );
            return;
          }
          picked.classList.add("matched");
          picked.classList.remove("sel");
          b.classList.add("matched");
          picked = null;
          matched++;
          if (matched === words.length) {
            api.fb(fbn, "ok", "All eight matched. You are reading words, not just sounds. 🗂️");
            api.done();
          } else {
            api.fb(fbn, "ok", `${matched} of ${words.length} matched.`);
          }
        });
        enCol.appendChild(b);
      });
    },
  });
})();
