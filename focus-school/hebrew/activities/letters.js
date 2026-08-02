/* Nightly Hebrew — meeting tonight's letters.
 *
 *   letters   (required) Meet the Players — the full card for every new
 *                        letter: name, sound, shape, how the hand draws it,
 *                        and the look-alike it gets confused with. Reading the
 *                        cards is not enough on its own, so the activity only
 *                        closes after a short check on the letters just read.
 *   lookalike (required) Look-Alike Lineup — pure visual discrimination on the
 *                        pairs that actually get swapped. This is the single
 *                        biggest source of misreads, and no other activity
 *                        isolates it.
 */
(function () {
  "use strict";

  HEB.registerActivity({
    id: "letters",
    title: (u) => (u.newLetters.length ? "🧢 Meet the Players" : "🧢 Scouting Report"),
    how: (u) =>
      u.newLetters.length
        ? `${u.newLetters.length} new letter${
            u.newLetters.length === 1 ? "" : "s"
          } joining the roster — read every card, then take the check.`
        : "No new letters tonight — go back over the roster you already have, then take the check.",
    mount(root, api) {
      const { unit, el, $ } = api;
      const showing = unit.newLetters.length ? unit.newLetters : unit.letterPool.slice(-6);
      root.innerHTML = `
        <p class="note">Tap a card to hear it. Read the <b>sound</b> line out loud, and trace the shape in the air with your finger while you read the <b>how to draw it</b> line.</p>
        <div class="card-grid" id="lt-grid"></div>
        <div class="feedback" id="lt-fb"></div>
        <div id="lt-check" hidden></div>`;
      const grid = $("#lt-grid", root);
      const fbn = $("#lt-fb", root);
      let tapped = 0;

      showing.forEach((ch) => {
        const L = api.LETTERS[ch];
        if (!L) return;
        const c = el(`<button class="lcard" type="button">
          <div class="glyph">${ch}</div>
          <div class="lname">${api.esc(L.name)}</div>
          <div class="lsound">${L.c ? "says " + api.esc(L.c) : "SILENT"} — ${api.esc(L.say)}</div>
          <div class="lnote">${api.esc(L.note)}</div>
          ${L.trace ? `<div class="ltrace">✍️ ${api.esc(L.trace)}</div>` : ""}
          ${L.watch ? `<div class="lwatch">👀 Don't mix up: ${api.esc(L.watch)}</div>` : ""}
        </button>`);
        c.addEventListener("click", () => {
          api.say(ch, L.c || L.name);
          if (!c.dataset.seen) {
            c.dataset.seen = "1";
            c.classList.add("read");
            tapped++;
            if (tapped === showing.length) startCheck();
            else api.fb(fbn, "tip", `${tapped} of ${showing.length} cards read.`);
          }
        });
        grid.appendChild(c);
      });

      function startCheck() {
        api.fb(fbn, "ok", "Roster read. Now cover the cards with your hand and take the check.");
        const host = $("#lt-check", root);
        host.hidden = false;
        api.quiz(host, {
          total: Math.max(5, showing.length),
          unitWord: "Card",
          winNote: "Those letters are yours.",
          next() {
            const ch = api.pick(showing);
            const L = api.LETTERS[ch];
            const others = api
              .shuffle(unit.allLetters.slice())
              .filter((c2) => c2 !== ch && api.LETTERS[c2])
              .slice(0, 3);
            const cell = (c2) => ({ text: c2, html: `<span class="glyph">${c2}</span>` });
            return {
              qHtml: `<p class="ask">Which one is <b>${api.esc(L.name)}</b>${
                L.c ? ` (${api.esc(L.c)})` : " (silent)"
              }?</p>`,
              answer: ch,
              choices: [cell(ch), ...others.map(cell)],
              wide: true,
              sayHeb: ch,
              sayTr: L.c || L.name,
              hint1: `Not that one. ${api.esc(L.note)}`,
              hint2: `Draw it in your head: ${api.esc(L.trace || L.note)}`,
              explain: `<span class="glyph md">${ch}</span> ${api.esc(L.name)} — ${api.esc(L.say)}.`,
            };
          },
          onFinish() {
            api.done();
          },
        });
        host.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }
    },
  });

  // ------------------------------------------------------- look-alike lineup
  HEB.registerActivity({
    id: "lookalike",
    title: "👀 Look-Alike Lineup",
    how: "Eight rounds on the shapes that get mixed up. Nothing here is a new letter — this is about looking before you read.",
    mount(root, api) {
      const groups = api.confusableGroups();
      if (!groups.length) {
        root.innerHTML =
          '<p class="note">Nothing tonight looks confusingly like anything else yet. Free pass — tap to move on.</p><button class="btn sm" type="button" id="la-skip">Got it</button>';
        api.$("#la-skip", root).addEventListener("click", () => api.done());
        return;
      }
      root.innerHTML = `
        <div class="pairwall" id="la-wall"></div>
        <p class="note">Study the pairs above first. Then eight rounds — the wrong answer is always the letter that looks almost the same.</p>
        <div id="la-quiz"></div>`;
      const wall = api.$("#la-wall", root);
      for (const g of groups) {
        wall.appendChild(
          api.el(`<div class="pair">
            <div class="pair-glyphs">${g.chars
              .map(
                (c) =>
                  `<span><span class="glyph">${c}</span><small>${api.esc(
                    api.LETTERS[c] ? api.LETTERS[c].c || "silent" : "",
                  )}</small></span>`,
              )
              .join('<span class="vs">vs</span>')}</div>
            <p>${api.esc(g.why)}</p>
          </div>`),
        );
      }

      api.quiz(api.$("#la-quiz", root), {
        total: 8,
        unitWord: "Look",
        winNote: "You are looking before you read. That is the whole skill.",
        next() {
          const g = api.pick(groups);
          const target = api.pick(g.chars);
          const L = api.LETTERS[target];
          const cell = (c) => ({ text: c, html: `<span class="glyph">${c}</span>` });
          return {
            qHtml: `<p class="ask">Which one is <b>${api.esc(L.name)}</b>${
              L.c ? ` — the one that says <b>${api.esc(L.c)}</b>` : " — the silent one"
            }?</p>`,
            answer: target,
            choices: g.chars.map(cell),
            wide: true,
            sayHeb: target,
            sayTr: L.c || L.name,
            hint1: "Look again — slowly. What is different about the two shapes?",
            hint2: api.esc(g.why),
            explain: `<span class="glyph md">${target}</span> ${api.esc(L.name)}. ${api.esc(g.why)}`,
            pause: 1300,
          };
        },
        onFinish() {
          api.done();
        },
      });
    },
  });
})();
