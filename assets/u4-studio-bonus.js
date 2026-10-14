/**
 * Unit 4 Practice Studio — Bonus Round: "Match the Trios".
 *
 * Nine tiles, three hidden trios. Tap three tiles that belong together; a right trio locks
 * in a colour, a wrong guess just clears the selection and counts a miss. No timer, no
 * answer is shown on a miss, and a round can be replayed to improve its stars.
 *
 * Tiles are generated from numbers, never typed, so a label cannot disagree with its trio:
 *   fdp         {n, d}        fraction / decimal / percent        (4-2)
 *   pctMeaning  {p}           percent / "p out of 100" / decimal  (4-1)
 *   partOf      {p, w, how}   "p% of w" / method / the part       (4-3, 4-4)
 *   wholeOf     {part, p}     "part is p% of ?" / method / whole  (4-5)
 * Loaded after assets/u4-studio.js; a page opts in with `bonus` in U4Studio.init.
 */
(() => {
  const U = /** @type {any} */ (window).U4Studio;
  if (!U) return;

  const fmt = (/** @type {number} */ n) => String(Math.round(n * 1e6) / 1e6);
  const isWhole = (/** @type {number} */ n) => Math.abs(n - Math.round(n)) < 1e-9;
  const places = (/** @type {number} */ n) => (fmt(n).split(".")[1] || "").length;
  const need = (/** @type {boolean} */ ok, /** @type {string} */ msg) => {
    if (!ok) throw new Error(`Bonus Round spec: ${msg}`);
  };
  const tile = (
    /** @type {string} */ kind,
    /** @type {string} */ text,
    /** @type {string} */ cap,
    /** @type {string} */ capEs,
  ) => ({
    kind,
    text,
    cap,
    capEs,
  });

  const GEN = {
    fdp({ n, d }) {
      const dec = n / d;
      need(places(dec) <= 4 && places(dec * 100) <= 2, `${n}/${d} does not end as a short decimal`);
      return [
        tile("k-frac", `${n}/${d}`, "fraction", "fracción"),
        tile("k-dec", fmt(dec), "decimal", "decimal"),
        tile("k-pct", `${fmt(dec * 100)}%`, "percent", "porcentaje"),
      ];
    },
    pctMeaning({ p }) {
      return [
        tile("k-pct", `${fmt(p)}%`, "percent", "porcentaje"),
        tile("k-a", `${fmt(p)} out of 100`, "rate per 100", "tasa por 100"),
        tile("k-dec", fmt(p / 100), "decimal", "decimal"),
      ];
    },
    partOf({ p, w, how }) {
      const part = (p * w) / 100;
      need(places(part) <= 2, `${p}% of ${w} is not a friendly number`);
      const expr = tile("k-pct", `${fmt(p)}% of ${fmt(w)}`, "percent of", "porcentaje de");
      const value = tile("k-c", fmt(part), "the part", "la parte");
      if (how === "divide") {
        need(isWhole(100 / p), `${p}% has no whole-number divisor`);
        return [expr, tile("k-b", `${fmt(w)} ÷ ${fmt(100 / p)}`, "divide", "dividir"), value];
      }
      return [expr, tile("k-b", `${fmt(p / 100)} × ${fmt(w)}`, "multiply", "multiplicar"), value];
    },
    wholeOf({ part, p }) {
      const whole = (part * 100) / p;
      need(places(whole) <= 2, `${part} is ${p}% of an awkward whole`);
      return [
        tile("k-pct", `${fmt(part)} is ${fmt(p)}% of ?`, "question", "pregunta"),
        tile("k-b", `${fmt(part)} ÷ ${fmt(p / 100)}`, "divide", "dividir"),
        tile("k-c", fmt(whole), "the whole", "el entero"),
      ];
    },
  };

  /** A round = three trios. Returns tiles tagged with their trio number. */
  function buildRound(/** @type {string} */ gen, /** @type {any[]} */ specs) {
    const make = /** @type {any} */ (GEN)[gen];
    need(typeof make === "function", `unknown generator ${gen}`);
    return specs.flatMap((spec, g) =>
      make(spec).map((/** @type {any} */ t) => ({ ...t, group: g })),
    );
  }

  const shuffle = (/** @type {any[]} */ list) => {
    const a = list.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };

  const starsFor = (/** @type {number} */ misses) => (misses === 0 ? 3 : misses <= 2 ? 2 : 1);
  const starRow = (/** @type {number} */ n) => "★".repeat(n) + "☆".repeat(3 - n);
  const esc = (/** @type {string} */ s) =>
    s.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c] || c);

  const esOn = () => document.body.classList.contains("show-es");

  function open() {
    const cfg = U.withCfg((/** @type {any} */ c) => c).bonus;
    const d = U.dialog("u4-bonus", cfg.title, cfg.titleEs);
    const body = /** @type {HTMLElement} */ (d.querySelector(".u4-dialog-body"));

    function menu() {
      const cards = cfg.rounds
        .map(
          (/** @type {any} */ _r, /** @type {number} */ i) =>
            `<button type="button" class="btn" data-round="${i}">Round ${i + 1} <span class="u4-stars-row" style="font-size:1.1rem;letter-spacing:2px" aria-label="${U.bonusBest(i)} of 3 stars">${starRow(U.bonusBest(i))}</span></button>`,
        )
        .join("");
      body.innerHTML = `<p class="u4-board-help">${esc(cfg.help)}<span class="es-text">${esc(cfg.helpEs)}</span></p><div class="u4-board-actions">${cards}</div>`;
      for (const b of body.querySelectorAll("[data-round]")) {
        b.addEventListener("click", () =>
          round(Number(/** @type {HTMLElement} */ (b).dataset.round)),
        );
      }
    }

    function round(/** @type {number} */ idx) {
      const tiles = shuffle(buildRound(cfg.gen, cfg.rounds[idx])).map((t, i) => ({ ...t, id: i }));
      let picked = /** @type {number[]} */ ([]);
      let misses = 0;
      const matched = /** @type {number[]} */ ([]);
      body.innerHTML = `
        <div class="u4-board-top">
          <span class="chip">Round ${idx + 1} of ${cfg.rounds.length}</span>
          <span class="chip" id="u4-matched">Trios: 0 / 3</span>
          <span class="chip" id="u4-misses">Misses: 0</span>
        </div>
        <p class="u4-board-help">${esc(cfg.help)}<span class="es-text">${esc(cfg.helpEs)}</span></p>
        <div class="u4-board" role="group" aria-label="Tiles"></div>
        <p class="u4-board-note" id="u4-note" aria-live="polite"></p>`;
      const board = /** @type {HTMLElement} */ (body.querySelector(".u4-board"));
      const note = /** @type {HTMLElement} */ (body.querySelector("#u4-note"));

      function paint() {
        board.innerHTML = "";
        for (const t of tiles) {
          const set = matched.indexOf(t.group);
          const b = document.createElement("button");
          b.type = "button";
          b.className = `u4-tile ${t.kind}${set >= 0 ? ` is-matched set-${set}` : ""}`;
          b.disabled = set >= 0;
          b.dataset.id = String(t.id);
          b.setAttribute("aria-pressed", String(picked.includes(t.id)));
          b.setAttribute(
            "aria-label",
            `${t.text}, ${esOn() ? t.capEs : t.cap}${set >= 0 ? ", matched" : ""}`,
          );
          b.innerHTML = `${esc(t.text)}<small>${esc(esOn() ? t.capEs : t.cap)}</small>`;
          b.addEventListener("click", () => choose(t, b));
          board.appendChild(b);
        }
        /** @type {HTMLElement} */ (body.querySelector("#u4-matched")).textContent =
          `Trios: ${matched.length} / 3`;
        /** @type {HTMLElement} */ (body.querySelector("#u4-misses")).textContent =
          `Misses: ${misses}`;
      }

      function choose(/** @type {any} */ t, /** @type {HTMLElement} */ btn) {
        picked = picked.includes(t.id) ? picked.filter((x) => x !== t.id) : [...picked, t.id];
        note.textContent = "";
        if (picked.length < 3) return paint();
        const groups = new Set(picked.map((id) => tiles[id].group));
        if (groups.size === 1) {
          matched.push([...groups][0]);
          picked = [];
          note.textContent = "Trio found!";
          paint();
          if (matched.length === 3) finish();
        } else {
          misses++;
          const chosen = picked.map(String);
          picked = [];
          paint();
          for (const b of board.querySelectorAll(".u4-tile")) {
            if (chosen.includes(/** @type {HTMLElement} */ (b).dataset.id || ""))
              b.classList.add("shake");
          }
          note.textContent = "Not a trio. Read what each tile says, then try again.";
          btn.blur();
        }
      }

      function finish() {
        const stars = starsFor(misses);
        U.recordBonus(idx, stars);
        U.burst();
        U.say(`Round complete. ${stars} stars.`);
        const last = idx + 1 >= cfg.rounds.length;
        body.innerHTML = `
          <div class="u4-result">
            <div class="u4-stars-row" aria-label="${stars} of 3 stars">${starRow(stars)}</div>
            <h3>${stars === 3 ? "No misses!" : "Round complete"}</h3>
            <p>${misses} ${misses === 1 ? "miss" : "misses"} · you can replay a round to earn more stars.</p>
            <div class="u4-board-actions" style="justify-content:center">
              ${last ? "" : '<button type="button" class="btn btn-go" id="u4-next">Next round</button>'}
              <button type="button" class="btn" id="u4-again">Play again</button>
              <button type="button" class="btn" id="u4-menu">All rounds</button>
            </div>
          </div>`;
        body.querySelector("#u4-next")?.addEventListener("click", () => round(idx + 1));
        body.querySelector("#u4-again")?.addEventListener("click", () => round(idx));
        body.querySelector("#u4-menu")?.addEventListener("click", menu);
        /** @type {HTMLElement | null} */ (body.querySelector(".btn"))?.focus();
      }

      paint();
    }

    menu();
    d.showModal();
  }

  U.bonus = { open, GEN, buildRound, starsFor };
})();
