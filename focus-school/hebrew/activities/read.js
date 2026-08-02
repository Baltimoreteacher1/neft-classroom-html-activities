/* Nightly Hebrew — connected reading.
 *
 *   sentences (required) Read the Line — whole lines, one word at a time, with
 *                        the translation held back until the line has been
 *                        read. Reading a list of words is not reading; this is
 *                        where the eyes have to keep moving.
 *   closer    (required) Game Day — the victory lap: tonight's words and the
 *                        actual siddur lines they unlock, then one honest
 *                        cold read of the whole set with nothing revealed.
 */
(function () {
  "use strict";

  HEB.registerActivity({
    id: "sentences",
    title: (u) => (u.sentences.length ? "📜 Read the Line" : "📜 Read the Lineup"),
    how: (u) =>
      u.sentences.length
        ? "Whole sentences. Tap word by word to check yourself, then read the line again straight through."
        : "Not enough letters for sentences yet — so these are reading lines. Read each one straight through without stopping.",
    mount(root, api) {
      const { unit, el, $ } = api;
      const lines = unit.sentences.length ? unit.sentences.slice() : makeLines(api);
      root.innerHTML = `
        <p class="note">Read the whole line out loud first — right to left, no stopping. <b>Then</b> tap the words to check, and finish by reading it once more, smoothly.</p>
        <div id="sn-lines"></div>
        <div class="feedback" id="sn-fb"></div>`;
      const host = $("#sn-lines", root);
      const fbn = $("#sn-fb", root);
      let done = 0;

      lines.forEach((line, i) => {
        const words = String(line.heb).trim().split(/\s+/);
        const card = el(`<div class="line-card">
          <div class="note rowlabel">Line ${i + 1}</div>
          <div class="line-words"></div>
          <div class="line-meta" hidden></div>
          <div class="row line-again" hidden><button class="btn primary sm" type="button">✅ I read it again, smoothly</button></div>
        </div>`);
        const wrap = $(".line-words", card);
        const meta = $(".line-meta", card);
        const again = $(".line-again", card);
        let tapped = 0;

        words.forEach((w) => {
          const b = el(
            `<button class="line-word" type="button"><span class="glyph">${w}</span></button>`,
          );
          b.addEventListener("click", () => {
            const ps = api.pieces(w).filter((p) => !p.sep);
            api.say(w, ps.map((p) => p.tr).join("-"));
            if (b.classList.contains("revealed")) return;
            b.classList.add("revealed");
            b.appendChild(el(`<span class="wtr">${api.esc(ps.map((p) => p.tr).join("-"))}</span>`));
            tapped++;
            if (tapped === words.length) {
              meta.hidden = false;
              meta.innerHTML = `<span class="tr"><span class="c">${api.esc(
                line.tr,
              )}</span></span><span class="en">${api.esc(line.en)}</span>`;
              again.hidden = false;
            }
          });
          wrap.appendChild(b);
        });

        $("button", again).addEventListener("click", (e) => {
          e.currentTarget.disabled = true;
          e.currentTarget.textContent = "✅ Read";
          card.classList.add("done");
          api.say(line.heb, line.tr);
          done++;
          if (done === lines.length) {
            api.fb(
              fbn,
              "ok",
              "Every line read twice — once to work it out, once for real. That second read is the one that counts. 📜",
            );
            api.done();
          } else {
            api.fb(fbn, "tip", `${done} of ${lines.length} lines read.`);
          }
        });

        host.appendChild(card);
      });
    },
  });

  // Unit 1 owns five letters and one vowel sound, which is not enough for a
  // real sentence. Rather than fake one, it reads LINES — three real words in
  // a row, which is the same eye-movement work.
  function makeLines(api) {
    const words = api.allWords();
    const out = [];
    for (let i = 0; i < 4; i++) {
      const three = api.sample(words, 3);
      out.push({
        heb: three.map((w) => w.heb).join(" "),
        tr: three.map((w) => w.tr).join(" · "),
        en: three.map((w) => w.en).join(" · "),
      });
    }
    return out;
  }

  // ----------------------------------------------------------------- closer
  HEB.registerActivity({
    id: "closer",
    title: "📖 Game Day",
    how: "The victory lap: real words, real siddur lines, and one cold read at the end.",
    mount(root, api) {
      const { unit, el, $ } = api;
      const words = unit.closer.length ? unit.closer : unit.words.slice(0, 4);
      const siddur = unit.siddur;
      root.innerHTML = `
        <p class="note">Real words, built only from letters you already own. Tap one to check the sound and the meaning.</p>
        <div class="words" id="cl-words"></div>
        ${
          siddur.length
            ? `<h4 class="sub-h">📖 Straight from the siddur</h4>
               <p class="note">These exact lines are in your prayer book. Read them out loud.</p>
               <div id="cl-siddur"></div>`
            : ""
        }
        <div class="feedback" id="cl-fb"></div>
        <div id="cl-cold" hidden></div>`;
      const wWrap = $("#cl-words", root);
      const fbn = $("#cl-fb", root);
      let read = 0;
      const need = words.length + siddur.length;

      const tick = () => {
        read++;
        if (read >= need) coldRead();
        else api.fb(fbn, "tip", `${read} of ${need} read.`);
      };

      words.forEach((w) => {
        const b = el(`<button class="word hide" type="button">
          <span class="glyph">${w.heb}</span>
          <span class="meta"><span class="tr"><span class="c">${api.esc(
            w.tr,
          )}</span></span><br><span class="en">${api.esc(w.en)}</span></span>
        </button>`);
        b.addEventListener("click", () => {
          if (b.classList.contains("hide")) {
            b.classList.remove("hide");
            tick();
          }
          api.say(w.heb, w.tr);
        });
        wWrap.appendChild(b);
      });

      if (siddur.length) {
        const sWrap = $("#cl-siddur", root);
        siddur.forEach((s) => {
          const b = el(`<button class="word siddur hide" type="button">
            <span class="glyph">${s.heb}</span>
            <span class="meta"><span class="tr"><span class="c">${api.esc(
              s.tr,
            )}</span></span><br><span class="en">${api.esc(s.en)}</span></span>
          </button>`);
          b.addEventListener("click", () => {
            if (b.classList.contains("hide")) {
              b.classList.remove("hide");
              tick();
            }
            api.say(s.heb, s.tr);
          });
          sWrap.appendChild(b);
        });
      }

      // The cold read is the whole point of the section: everything above has
      // already been revealed, so the only honest test left is reading the set
      // straight through with the answers covered.
      function coldRead() {
        api.fb(fbn, "ok", "All read. One last thing — the cold read.");
        const host = $("#cl-cold", root);
        host.hidden = false;
        const all = words.concat(siddur);
        host.innerHTML = `
          <h4 class="sub-h">🥶 The cold read</h4>
          <p class="note">Cover the sound spellings with your hand. Read this whole set out loud, top to bottom, without stopping. Then tap the button — honestly.</p>
          <div class="cold-list">${all
            .map((w) => `<div class="cold-line"><span class="glyph">${w.heb}</span></div>`)
            .join("")}</div>
          <div class="row">
            <button class="btn grass" type="button" data-r="clean">✅ Read it clean</button>
            <button class="btn sm" type="button" data-r="rough">🔁 Rough — I'll go again</button>
          </div>
          <div class="feedback" id="cl-fb2"></div>`;
        const fb2 = $("#cl-fb2", host);
        host.querySelectorAll("[data-r]").forEach((b) => {
          b.addEventListener("click", () => {
            if (b.dataset.r === "rough") {
              api.fb(
                fb2,
                "tip",
                "Good call. Read it again — slower is fine, stopping is fine. Tap the green button when it flows.",
              );
              return;
            }
            api.fb(
              fb2,
              "ok",
              "That's the game. You just read real Hebrew, cold, with nothing on the screen helping you. 🏆",
            );
            host.querySelectorAll("[data-r]").forEach((x) => (x.disabled = true));
            api.done();
          });
        });
        host.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }
    },
  });
})();
