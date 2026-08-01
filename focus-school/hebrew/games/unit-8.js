/* 8th Inning game — FIELD THE GROUNDER.
 *
 * Mechanic: constrained path-finding on a 5×5 infield. The ball starts at home
 * plate (bottom-right) and must reach first base (top-left) by orthogonal steps.
 * THE RULE: each play the coach calls one vowel sound, and the ball may only
 * touch bases whose VOWEL says that sound. Every candidate base has to actually
 * be READ before it can be judged — no shape, colour or position cue shortcuts
 * it, which is exactly the skill this inning is for.
 *
 * Why it fits Inning 8: the pool now contains א and ע, which have no consonant
 * sound at all. On a silent base the syllable IS the vowel — syl("א","kamatz")
 * transliterates to plain "ah" — so a kid still hunting for a consonant walks
 * right past the legal route. One play per game seeds silent letters onto the
 * path so that realisation has to happen.
 *
 * Generation is constructive, not random-and-pray: a random monotone staircase
 * is laid from home to first and those cells get the target sound, so a legal
 * route exists BY CONSTRUCTION. Everything else gets a contrasting vowel, then a
 * few off-path decoys are flipped to the target sound so the trail isn't simply
 * "the only readable line". A flood-fill re-proves solvability before the board
 * is shown, inside a bounded loop with a provably-connected fallback.
 *
 * Calm by design: no clock, no fail state, unlimited attempts. An illegal step is
 * charged as an "error" — a baseball STAT, not a loss — and the ball stays put.
 * Hints arrive in tiers and never name a legal base.
 */
(function () {
  "use strict";

  HEB.registerGame({
    name: "Field the Grounder",
    goal: "Route the ground ball from home plate to first base — but you may only step on bases whose vowel says the sound the coach called.",
    blurb: "Read every base's vowel to find the one legal route across the infield.",

    mount(root, api) {
      const { unit, LETTERS, VOWELS, syl, say, shuffle, pick, randInt, el, esc } = api;

      const N = 5;
      const START = [N - 1, N - 1]; // home plate — bottom-right
      const GOAL = [0, 0]; // first base — top-left
      // prettier-ignore
      const DIRS = [[-1, 0], [1, 0], [0, -1], [0, 1]]; // orthogonal only — no diagonals
      const PLAYS = 4;
      const DECOYS = 3;
      const cellKey = (r, c) => r + "," + c;

      const letters = unit.letterPool;
      // א and ע are the whole point of this inning: LETTERS[ch].c is "" for them.
      const silentLetters = letters.filter((ch) => !LETTERS[ch].c);
      // Sheva is dropped from the board: its "sound" is silence, so "step only on
      // the sheva bases" would be a rule about an absence — unreadable as a goal.
      const liveVowels = unit.vowelPool.filter((vk) => VOWELS[vk].v !== "'");
      // Only sounds that have at least one CONTRASTING vowel can be a target;
      // otherwise every cell on the board would be legal and there'd be no puzzle.
      const sounds = [...new Set(liveVowels.map((vk) => VOWELS[vk].v))].filter((v) =>
        liveVowels.some((vk) => VOWELS[vk].v !== v),
      );

      const order = shuffle(sounds).slice(0, PLAYS);
      while (order.length < PLAYS) order.push(pick(sounds));
      // Never play 1 — let the mechanic land before the silent-letter twist.
      const silentPlay = silentLetters.length ? 1 + randInt(PLAYS - 1) : -1;

      api.style(`
        .fg-call{background:rgba(255,209,102,.1);border:1px solid rgba(255,209,102,.34);
          border-radius:12px;padding:11px 13px;margin-bottom:11px}
        .fg-call .fg-coach{color:var(--grass);font-weight:900}
        .fg-call .fg-sound{font-size:1.45rem;font-weight:900;color:var(--lights);letter-spacing:.5px}
        .fg-call .note{display:block;margin-top:4px}
        .fg-scroll{overflow-x:auto;-webkit-overflow-scrolling:touch;padding-bottom:4px}
        .fg-grid{display:grid;gap:6px;min-width:312px;background:rgba(0,0,0,.3);
          border:1px solid var(--line);border-radius:14px;padding:8px}
        .fg-cell{position:relative;min-width:58px;min-height:74px;border:1px solid var(--line);
          border-radius:11px;background:linear-gradient(165deg,#16354a,#0e2434);color:var(--chalk);
          font:inherit;cursor:pointer;display:grid;place-items:center;padding:12px 2px 4px}
        .fg-cell:active{transform:scale(.97)}
        .fg-cell .glyph{font-size:1.8rem;line-height:1.5}
        .fg-cell .fg-tr{font-size:.72rem;font-weight:800;color:var(--lights);direction:ltr;min-height:1em}
        .fg-cell .fg-tag{position:absolute;top:3px;left:5px;font-size:.56rem;font-weight:900;
          letter-spacing:.6px;text-transform:uppercase;color:var(--muted)}
        .fg-cell .fg-num{position:absolute;top:3px;right:5px;font-size:.62rem;font-weight:900;color:var(--good)}
        .fg-cell.step{border-color:var(--good);background:linear-gradient(165deg,#16442e,#0e2a1e)}
        .fg-cell.ball{border-color:var(--lights);box-shadow:0 0 0 2px rgba(255,209,102,.45)}
        .fg-cell.ball::after{content:"⚾";position:absolute;bottom:2px;right:4px;font-size:.9rem}
        .fg-cell.miss{border-color:var(--bad);background:linear-gradient(165deg,#43202a,#2a121a)}
        .fg-cell.goal .fg-tag{color:var(--lights)}
        .fg-log{display:grid;gap:6px;margin-top:12px}
        .fg-log .fg-line{font-size:.85rem;color:#b7d8c4;background:rgba(0,0,0,.26);
          border-left:3px solid var(--grass);border-radius:8px;padding:7px 10px;line-height:1.45}
        .fg-log .fg-line b{color:var(--lights)}
        .fg-chain{direction:ltr;word-break:break-word}
      `);

      // ------------------------------------------------------------ generation
      // A monotone staircase can only ever move toward first base, so it never
      // crosses itself and always lands exactly on the goal.
      function monotonePath() {
        const moves = shuffle([...Array(N - 1).fill("u"), ...Array(N - 1).fill("l")]);
        let r = START[0];
        let c = START[1];
        const path = [[r, c]];
        for (const m of moves) {
          if (m === "u") r--;
          else c--;
          path.push([r, c]);
        }
        return path;
      }

      // Straight-line fallback: up the right edge, then left along the top. Same
      // guarantee, zero randomness — the escape hatch for the bounded retry loop.
      function elbowPath() {
        const path = [];
        for (let r = START[0]; r >= GOAL[0]; r--) path.push([r, START[1]]);
        for (let c = START[1] - 1; c >= GOAL[1]; c--) path.push([GOAL[0], c]);
        return path;
      }

      function fill(path, sound, wantSilent) {
        const matchV = liveVowels.filter((vk) => VOWELS[vk].v === sound);
        const otherV = liveVowels.filter((vk) => VOWELS[vk].v !== sound);
        const grid = Array.from({ length: N }, () => Array(N).fill(null));
        const onPath = new Set(path.map(([r, c]) => cellKey(r, c)));

        path.forEach(([r, c], i) => {
          // Seed the silent play so the route CANNOT be run without reading a
          // base that has no consonant on it at all.
          const useSilent =
            wantSilent && (i === 1 || i === Math.floor(path.length / 2) || Math.random() < 0.45);
          grid[r][c] = syl(useSilent ? pick(silentLetters) : pick(letters), pick(matchV));
        });
        for (let r = 0; r < N; r++) {
          for (let c = 0; c < N; c++) {
            if (grid[r][c]) continue;
            const useSilent = wantSilent && Math.random() < 0.3;
            grid[r][c] = syl(useSilent ? pick(silentLetters) : pick(letters), pick(otherV));
          }
        }

        // Decoys: off-path bases that DO say the target sound but dead-end. They
        // are what turns "find the lit trail" into an actual read-and-choose.
        const touching = [];
        for (let r = 0; r < N; r++) {
          for (let c = 0; c < N; c++) {
            if (onPath.has(cellKey(r, c))) continue;
            const near = DIRS.some(([dr, dc]) => onPath.has(cellKey(r + dr, c + dc)));
            if (near) touching.push([r, c]);
          }
        }
        for (const [r, c] of shuffle(touching).slice(0, DECOYS)) {
          grid[r][c] = syl(grid[r][c].letter, pick(matchV));
        }
        return grid;
      }

      // Flood-fill over target-sound cells only. Constructive generation should
      // always pass this; it runs anyway so a future change to fill() can't ship
      // an unwinnable board silently.
      function solvable(grid, sound) {
        if (grid[START[0]][START[1]].v !== sound) return false;
        const seen = new Set([cellKey(START[0], START[1])]);
        const queue = [START];
        while (queue.length) {
          const [r, c] = queue.shift();
          if (r === GOAL[0] && c === GOAL[1]) return true;
          for (const [dr, dc] of DIRS) {
            const nr = r + dr;
            const nc = c + dc;
            if (nr < 0 || nc < 0 || nr >= N || nc >= N) continue;
            const key = cellKey(nr, nc);
            if (seen.has(key) || grid[nr][nc].v !== sound) continue;
            seen.add(key);
            queue.push([nr, nc]);
          }
        }
        return false;
      }

      function buildBoard(sound, wantSilent) {
        for (let tries = 0; tries < 60; tries++) {
          const g = fill(monotonePath(), sound, wantSilent);
          if (solvable(g, sound)) return g;
        }
        return fill(elbowPath(), sound, wantSilent); // connected by construction
      }

      // ---------------------------------------------------------------- state
      let playIdx = 0;
      let errors = 0;
      let misses = 0; // drives the hint ladder; resets on each new play and good step
      let grid = null;
      let target = "";
      let route = [];
      let lastMiss = null;
      let awaitingNext = false;
      let finished = false; // all 4 plays in the books — the board goes read-only

      root.innerHTML = `
        <p class="note">Tap a base <b>next to the ball</b> — up, down, left or right — to roll it there.
        You may only touch bases whose <b>vowel</b> says the sound the coach called. Tap a base you already
        ran through to walk the ball back. No clock, unlimited tries.</p>
        <div class="fg-call" id="fg-call"></div>
        <div class="fg-scroll"><div class="fg-grid" id="fg-grid" role="group" aria-label="Infield"></div></div>
        <div class="row" style="margin-top:10px">
          <button class="btn sm" type="button" id="fg-undo">↩ Undo last step</button>
          <button class="btn sm" type="button" id="fg-reset">⌂ Back to home plate</button>
          <span class="spacer"></span>
          <button class="btn primary sm" type="button" id="fg-next" hidden>▶ Next play</button>
        </div>
        <div class="fg-log" id="fg-log"></div>`;

      const callHost = root.querySelector("#fg-call");
      const gridHost = root.querySelector("#fg-grid");
      const logHost = root.querySelector("#fg-log");
      const undoBtn = root.querySelector("#fg-undo");
      const resetBtn = root.querySelector("#fg-reset");
      const nextBtn = root.querySelector("#fg-next");
      gridHost.style.gridTemplateColumns = `repeat(${N}, minmax(58px, 1fr))`;

      // ------------------------------------------------------------- rendering
      function drawGrid() {
        gridHost.innerHTML = "";
        for (let r = 0; r < N; r++) {
          for (let c = 0; c < N; c++) {
            const isStart = r === START[0] && c === START[1];
            const isGoal = r === GOAL[0] && c === GOAL[1];
            const b = el(`<button class="fg-cell${isGoal ? " goal" : ""}" type="button"
              aria-pressed="false" aria-label="Base row ${r + 1}, column ${c + 1}"
              data-r="${r}" data-c="${c}">
              <span class="fg-tag">${isStart ? "Home" : isGoal ? "1st" : ""}</span>
              <span class="fg-num"></span>
              <span class="glyph">${grid[r][c].heb}</span>
              <span class="fg-tr"></span>
            </button>`);
            b.addEventListener("click", () => onTap(r, c));
            gridHost.appendChild(b);
          }
        }
      }

      function refresh() {
        const idxOf = new Map(route.map(([r, c], i) => [cellKey(r, c), i]));
        gridHost.querySelectorAll(".fg-cell").forEach((b) => {
          const r = Number(b.dataset.r);
          const c = Number(b.dataset.c);
          const key = cellKey(r, c);
          const i = idxOf.has(key) ? idxOf.get(key) : -1;
          b.classList.toggle("step", i >= 0);
          b.classList.toggle("ball", i === route.length - 1);
          b.classList.toggle("miss", lastMiss === key);
          b.setAttribute("aria-pressed", String(i >= 0));
          // The sound is revealed only AFTER the base is fielded — reading it
          // first is the whole task, so nothing is pre-labelled.
          b.querySelector(".fg-num").textContent = i > 0 ? String(i) : "";
          b.querySelector(".fg-tr").textContent = i >= 0 ? grid[r][c].tr : "";
        });
        undoBtn.disabled = route.length < 2 || awaitingNext || finished;
        resetBtn.disabled = route.length < 2 || awaitingNext || finished;
        api.setHud(
          `<span class="stat">Plays ${playIdx + (awaitingNext ? 1 : 0)}/${PLAYS}</span>` +
            `<span class="stat">This play: <span style="color:var(--lights)">${esc(target)}</span></span>` +
            `<span class="stat">Errors charged ${errors}</span>`,
        );
      }

      function drawCall() {
        const silentHint =
          playIdx === silentPlay
            ? `<span class="note">Heads up: some bases out there are ${esc(
                silentLetters.join(" and "),
              )} — those letters make no sound of their own, so the base just says its vowel.</span>`
            : `<span class="note">More than one vowel mark can make the same sound. Read the mark, not the letter shape.</span>`;
        callHost.innerHTML = `<span class="fg-coach">Coach:</span> “Play ${playIdx + 1} of ${PLAYS} —
          field it home to first, and stay on the <span class="fg-sound">${esc(target)}</span> bases.”
          ${silentHint}`;
      }

      // ------------------------------------------------------------- game flow
      function startPlay() {
        target = order[playIdx];
        grid = buildBoard(target, playIdx === silentPlay);
        route = [START.slice()];
        misses = 0;
        lastMiss = null;
        awaitingNext = false;
        nextBtn.hidden = true;
        drawCall();
        drawGrid();
        refresh();
        api.clearFeedback();
      }

      function finishPlay() {
        const chain = route.map(([r, c]) => grid[r][c].tr).join(" → ");
        const usedSilent = route.some(([r, c]) => !grid[r][c].c);
        logHost.appendChild(
          el(`<div class="fg-line"><b>Play ${playIdx + 1} — “${esc(target)}” route:</b>
            <span class="fg-chain">${esc(chain)}</span> — ${route.length} bases, out at first. ⚾${
              usedSilent ? ` <em>You read a silent base on the way — nice.</em>` : ""
            }</div>`),
        );
        playIdx++;
        if (playIdx >= PLAYS) {
          awaitingNext = false;
          finished = true;
          refresh();
          api.win(
            `🏆 Four plays fielded clean${errors ? ` with ${errors} error${errors === 1 ? "" : "s"} charged` : " — no errors charged"}. ` +
              `You read every base's vowel to get there, silent letters and all.`,
          );
          return;
        }
        awaitingNext = true;
        nextBtn.hidden = false;
        refresh();
        api.feedback(
          "ok",
          `Out at first! That's play ${playIdx} of ${PLAYS}. Tap <b>Next play</b> when you're ready.`,
        );
      }

      function onTap(r, c) {
        if (finished) {
          say(grid[r][c].heb, grid[r][c].tr); // free re-reads after the win, no state change
          return;
        }
        if (awaitingNext) {
          api.feedback(
            "tip",
            "That play is in the books — tap <b>▶ Next play</b> to take the field again.",
          );
          return;
        }
        const s = grid[r][c];
        const idx = route.findIndex((p) => p[0] === r && p[1] === c);

        // Tapping the ball itself just replays the sound — a free, no-cost check.
        if (idx === route.length - 1) {
          say(s.heb, s.tr);
          return;
        }
        // Tapping anywhere on the trail walks the ball back to there. Touch-first
        // undo that doesn't require hunting for a button.
        if (idx >= 0) {
          route.length = idx + 1;
          lastMiss = null;
          refresh();
          api.feedback(
            "tip",
            `Walked the ball back to base ${idx === 0 ? "home plate" : idx}. Pick a different route.`,
          );
          return;
        }
        const [br, bc] = route[route.length - 1];
        if (Math.abs(br - r) + Math.abs(bc - c) !== 1) {
          api.feedback(
            "tip",
            "The ball can only roll to the base right next door — up, down, left or right. No jumping.",
          );
          return;
        }
        if (s.v !== target) return chargeError(r, c, s);

        route.push([r, c]);
        lastMiss = null;
        // A good read restarts the hint ladder, so the scaffold is per-decision
        // rather than "one bad guess early and everything is tier 3 forever".
        misses = 0;
        say(s.heb, s.tr);
        if (r === GOAL[0] && c === GOAL[1]) {
          finishPlay();
          return;
        }
        refresh();
        api.feedback(
          "ok",
          s.c
            ? `<b>${esc(s.tr)}</b> — ${esc(s.L.name)} says <b>${esc(s.c)}</b>, ${esc(s.V.name)} says <b>${esc(s.v)}</b>. Keep going.`
            : `<b>${esc(s.tr)}</b> — <b>${esc(s.L.name)}</b> is silent, so that base says nothing but its vowel: <b>${esc(s.v)}</b>. Keep going.`,
        );
      }

      function chargeError(r, c, s) {
        errors++;
        misses++;
        lastMiss = cellKey(r, c);
        refresh();
        // Tier 1: name the mismatch, never the vowel. Tier 2: name the vowel that
        // is actually there. Tier 3+: describe a mark that WOULD be legal. The
        // silent-letter note is added whenever the base has no consonant, because
        // "I couldn't find a sound on it" is the misread this inning exists for.
        let msg;
        if (misses === 1) {
          msg = `The ball stops there — that base's vowel says something different from <b>${esc(
            target,
          )}</b>. Look at the mark itself, then try another base.`;
        } else if (misses === 2) {
          msg = `Still not it. That mark is <b>${esc(s.V.name)}</b> — ${esc(
            s.V.art,
          )} — and it doesn't say <b>${esc(target)}</b>.`;
        } else {
          const want = VOWELS[liveVowels.find((vk) => VOWELS[vk].v === target)];
          msg = `That one is <b>${esc(s.V.name)}</b> (${esc(s.V.art)}). One of the marks that DOES say <b>${esc(
            target,
          )}</b> is <b>${esc(want.name)}</b> — ${esc(want.art)}. Hunt for it.`;
        }
        if (!s.c) {
          msg += `<br><b>${esc(s.L.name)}</b> has no sound of its own — that base just says its vowel, nothing in front of it.`;
        }
        api.feedback(
          "no",
          `${msg} <span class="note">(Error charged — it's just a stat. Ball's still live.)</span>`,
        );
      }

      undoBtn.addEventListener("click", () => {
        if (route.length < 2 || awaitingNext) return;
        route.pop();
        lastMiss = null;
        refresh();
        api.feedback("tip", "Took the last step back. The ball's live where it stands.");
      });
      resetBtn.addEventListener("click", () => {
        if (awaitingNext) return;
        route = [START.slice()];
        lastMiss = null;
        misses = 0;
        refresh();
        api.feedback("tip", "Back to home plate. Fresh route, no errors added.");
      });
      nextBtn.addEventListener("click", () => {
        if (!awaitingNext) return;
        startPlay();
      });

      startPlay();
    },
  });
})();
