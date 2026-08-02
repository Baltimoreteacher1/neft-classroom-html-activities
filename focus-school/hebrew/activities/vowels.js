/* Nightly Hebrew — the rules, and the marks the rules are about.
 *
 *   rules      (required) Coach's Chalk Talk — tonight's new vowels, tonight's
 *                         rules, and then the Sound Wall: every vowel learned
 *                         so far, sorted by the sound it makes. Sorting is the
 *                         point — two marks that look nothing alike can say
 *                         the same thing, and that fact has to be built, not
 *                         announced.
 *   vowelradar (required) Vowel Radar — name the MARK, not the whole sound.
 *                         Readers who guess are guessing the vowel; this is
 *                         the activity that makes them look at it.
 */
(function () {
  "use strict";

  const FAMILY_LABEL = {
    ah: "says ah",
    ay: "says ay",
    eh: "says eh",
    ee: "says ee",
    oh: "says oh",
    oo: "says oo",
    quiet: "mostly silent",
  };

  HEB.registerActivity({
    id: "rules",
    title: "📋 Coach's Chalk Talk",
    how: "Tonight's rules, then build the Sound Wall from every vowel you own.",
    mount(root, api) {
      const { unit, el, $ } = api;
      const vowelRows = unit.newVowels
        .map((k) => {
          const V = api.VOWELS[k];
          return `<div class="rule new-vowel"><span class="pin glyph">א${V.ch}</span><span><b>${api.esc(
            V.name,
          )} — says <span class="hot">${api.esc(V.v)}</span></b><span>${api.esc(
            V.say,
          )}. Look for ${api.esc(V.art)}.</span></span></div>`;
        })
        .join("");

      root.innerHTML = `
        ${
          vowelRows
            ? `<h4 class="sub-h">🔻 New vowels tonight</h4><div class="rules">${vowelRows}</div>`
            : '<p class="note">No new vowels tonight — every mark you meet is one you already own.</p>'
        }
        <h4 class="sub-h">📌 The rules</h4>
        <p class="note">Tap each one once you have read it out loud.</p>
        <div class="rules" id="rl-list"></div>
        <div class="feedback" id="rl-fb"></div>
        <div id="rl-wall" hidden></div>`;

      const list = $("#rl-list", root);
      const fbn = $("#rl-fb", root);
      let n = 0;
      unit.rules.forEach(([t, d]) => {
        const r = el(
          `<button class="rule" type="button"><span class="pin">📌</span><span><b>${api.esc(
            t,
          )}</b><span>${d}</span></span></button>`,
        );
        r.addEventListener(
          "click",
          () => {
            r.classList.add("read");
            n++;
            if (n === unit.rules.length) buildWall();
            else api.fb(fbn, "tip", `${n} of ${unit.rules.length} read.`);
          },
          { once: true },
        );
        list.appendChild(r);
      });

      function buildWall() {
        api.fb(fbn, "ok", "Chalk talk done. Now build the wall.");
        const host = $("#rl-wall", root);
        host.hidden = false;
        const fams = api.vowelFamilies();
        const famKeys = Object.keys(fams);
        const chips = api.shuffle(unit.vowelPool.slice());
        host.innerHTML = `
          <h4 class="sub-h">🧱 The Sound Wall</h4>
          <p class="note">Tap a mark, then tap the shelf it belongs on. Marks that look nothing alike can say exactly the same thing — that is what this wall is for.</p>
          <div class="chipbin" id="wl-bin"></div>
          <div class="shelves" id="wl-shelves"></div>
          <div class="feedback" id="wl-fb"></div>`;
        const bin = $("#wl-bin", host);
        const shelves = $("#wl-shelves", host);
        const wfb = $("#wl-fb", host);
        let selected = null;
        let placed = 0;

        for (const f of famKeys) {
          shelves.appendChild(
            el(`<button class="shelf" type="button" data-fam="${f}">
              <span class="shelf-label">${api.esc(FAMILY_LABEL[f] || f)}</span>
              <span class="shelf-slot"></span>
            </button>`),
          );
        }
        for (const k of chips) {
          const V = api.VOWELS[k];
          const b = el(
            `<button class="chip vowel-chip" type="button" data-v="${k}" aria-pressed="false"><span class="glyph">א${V.ch}</span><small>${api.esc(
              V.name,
            )}</small></button>`,
          );
          b.addEventListener("click", () => {
            if (b.classList.contains("placed")) return;
            selected = selected === k ? null : k;
            bin.querySelectorAll(".chip").forEach((c) => {
              c.setAttribute("aria-pressed", String(c.dataset.v === selected));
            });
            api.say("א" + V.ch, V.v);
          });
          bin.appendChild(b);
        }

        shelves.querySelectorAll(".shelf").forEach((sh) => {
          sh.addEventListener("click", () => {
            if (!selected) {
              api.fb(wfb, "tip", "Pick a mark from the bin first, then tap a shelf.");
              return;
            }
            const V = api.VOWELS[selected];
            if (V.family !== sh.dataset.fam) {
              api.fb(
                wfb,
                "no",
                `<b>${api.esc(V.name)}</b> doesn't live there. ${api.esc(
                  V.say,
                )} — say it out loud and listen for which shelf that is.`,
              );
              return;
            }
            const chip = bin.querySelector(`[data-v="${selected}"]`);
            chip.classList.add("placed");
            chip.setAttribute("aria-pressed", "false");
            chip.disabled = true;
            $(".shelf-slot", sh).appendChild(
              el(`<span class="placed-chip"><span class="glyph">א${V.ch}</span></span>`),
            );
            selected = null;
            placed++;
            if (placed === chips.length) {
              api.fb(
                wfb,
                "ok",
                "Wall built. Every mark on the same shelf says the same thing — that is why two different-looking vowels can be read the same way.",
              );
              api.done();
            } else {
              api.fb(wfb, "ok", `${placed} of ${chips.length} shelved.`);
            }
          });
        });
        host.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }
    },
  });

  // ------------------------------------------------------------ vowel radar
  HEB.registerActivity({
    id: "vowelradar",
    title: "🔻 Vowel Radar",
    how: "Ten rounds naming the MARK under the letter. Not the whole sound — just the vowel.",
    mount(root, api) {
      const { unit } = api;
      root.innerHTML = `<p class="note">A reader who guesses is guessing the vowel. This drill takes the letter out of the equation so there is nothing left to guess with.</p>`;
      const vowels = unit.vowelPool;
      api.quiz(root, {
        total: 10,
        unitWord: "Read",
        winNote: "Your eyes are going to the mark first. That is exactly right.",
        next(i) {
          const V0 = api.pick(i % 3 === 2 && unit.newVowels.length ? unit.newVowels : vowels);
          const s = api.syl(api.pick(unit.letterPool), V0);
          const V = api.VOWELS[V0];
          const askName = i % 2 === 0;
          const others = api
            .shuffle(vowels.slice())
            .filter((k) => k !== V0)
            .slice(0, 3);
          if (askName) {
            return {
              qHtml: `<span class="glyph xl">${s.heb}</span><p class="note">Which vowel is under (or on) that letter?</p>`,
              answer: V.name,
              choices: [V.name, ...others.map((k) => api.VOWELS[k].name)],
              sayHeb: s.heb,
              sayTr: s.tr,
              hint1:
                "Ignore the letter completely. Just describe the mark: how many dots, and where?",
              hint2: `It is ${api.esc(V.art)}.`,
              explain: `<b>${api.esc(V.name)}</b> — ${api.esc(V.art)} — and it says <b>${api.esc(
                V.v,
              )}</b>, so the whole thing is ${api.trHtml(s)}.`,
            };
          }
          const wrongSounds = [...new Set(others.map((k) => api.VOWELS[k].v))]
            .filter((v) => v !== V.v)
            .slice(0, 3);
          return {
            qHtml: `<span class="glyph xl">${s.heb}</span><p class="note">Forget the letter. What does the <b>mark</b> say?</p>`,
            answer: V.v,
            choices: [V.v, ...wrongSounds],
            sayHeb: s.heb,
            sayTr: s.tr,
            hint1: "Look only at the mark. Count its dots and notice where it sits.",
            hint2: `That mark is a <b>${api.esc(V.name)}</b> — ${api.esc(V.art)}.`,
            explain: `<b>${api.esc(V.name)}</b> says <b>${api.esc(V.v)}</b> — ${api.esc(
              V.say,
            )}. With that letter in front it is ${api.trHtml(s)}.`,
          };
        },
        onFinish() {
          api.done();
        },
      });
    },
  });
})();
