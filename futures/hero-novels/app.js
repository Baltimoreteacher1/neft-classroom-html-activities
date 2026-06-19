/* Hero Novels — the student is the hero of a Grade-6 ratio/unit-rate comic.
 * PRIVACY: name/avatar/interest entered at runtime, stored ONLY in localStorage
 * (key: hero-novel-profile). No network calls, no external images, fully offline.
 * "Start over" clears it. Never uses the label "ESOL" (Level 1 / Level 2 only). */
(function () {
  "use strict";
  const KEY = "hero-novel-profile";
  const shell = document.getElementById("shell");

  // ---- avatars (inline SVG, offline) ----
  const AV = [
    { id: "a1", c: "#1fa6a2", f: "😀" },
    { id: "a2", c: "#f2c15b", f: "😎" },
    { id: "a3", c: "#d9795d", f: "🤓" },
    { id: "a4", c: "#12355b", f: "🦸" },
    { id: "a5", c: "#9b5de5", f: "🧑‍🚀" },
    { id: "a6", c: "#0f7c4a", f: "🦊" },
  ];
  const avSVG = (a, size = 64) =>
    `<svg class="av" viewBox="0 0 64 64" width="${size}" height="${size}" role="img" aria-hidden="true">
       <circle cx="32" cy="32" r="30" fill="${a.c}" stroke="#14202b" stroke-width="4"/>
       <text x="32" y="42" font-size="30" text-anchor="middle">${a.f}</text></svg>`;

  // ---- interest themes (swap the story's setting + art) ----
  const THEMES = {
    soccer: {
      label: "Soccer",
      icon: "⚽",
      setting: "snack stand at the soccer field",
      itemA: "oranges",
      itemB: "water bottles",
      sky: "#bfe3ff",
      ground: "#6fbf73",
      sfx: "GOAL!",
    },
    space: {
      label: "Space",
      icon: "🚀",
      setting: "fuel depot on a space station",
      itemA: "oxygen cans",
      itemB: "fuel cells",
      sky: "#0b1437",
      ground: "#3a3a5a",
      sfx: "WHOOSH!",
    },
    gaming: {
      label: "Gaming",
      icon: "🎮",
      setting: "potion shop in your favorite game",
      itemA: "health potions",
      itemB: "gold coins",
      sky: "#1c1030",
      ground: "#2e1d52",
      sfx: "LEVEL UP!",
    },
    cooking: {
      label: "Cooking",
      icon: "🍳",
      setting: "smoothie cart downtown",
      itemA: "cups of berries",
      itemB: "cups of yogurt",
      sky: "#ffe7c2",
      ground: "#e0a85a",
      sfx: "BLEND!",
    },
    music: {
      label: "Music",
      icon: "🎧",
      setting: "merch booth at a concert",
      itemA: "posters",
      itemB: "wristbands",
      sky: "#2b0a3d",
      ground: "#5a2b6e",
      sfx: "ENCORE!",
    },
    animals: {
      label: "Animals",
      icon: "🐾",
      setting: "animal rescue shelter",
      itemA: "cups of food",
      itemB: "scoops of treats",
      sky: "#cdeef0",
      ground: "#8bbf6f",
      sfx: "WOOF!",
    },
  };

  // ---- story: 3 challenges + finale, two difficulty levels ----
  function buildStory(p) {
    const t = THEMES[p.interest],
      n = esc(p.name) || "Hero";
    const L = p.level; // 1 support, 2 enrichment
    const c = (q, choices, correct, hint) => ({ q, choices, correct, hint });
    const challenges =
      L === 2
        ? [
            c(
              `Your recipe is <b>4 ${t.itemA} : 5 ${t.itemB}</b>. Make <b>3 batches</b> and keep the ratio. How much of each?`,
              ["12 : 15", "7 : 8", "12 : 5", "9 : 15"],
              0,
              "Multiply BOTH parts by 3 — don't just add 3.",
            ),
            c(
              `A crate is <b>$15 for 6 ${t.itemA}</b>. What is the price per item (unit rate)?`,
              ["$2.50", "$21.00", "$0.40", "$9.00"],
              0,
              "Unit rate = dollars ÷ items, so 15 ÷ 6.",
            ),
            c(
              `Better deal: <b>8 ${t.itemA} for $6</b> or <b>12 for $8</b>?`,
              [
                "12 for $8 ($0.67 each)",
                "8 for $6 ($0.75 each)",
                "They cost the same",
                "Can't tell",
              ],
              0,
              "Find each unit price: 6÷8 = $0.75 vs 8÷12 ≈ $0.67.",
            ),
          ]
        : [
            c(
              `Your recipe is <b>2 ${t.itemA} : 3 ${t.itemB}</b>. Make <b>3 batches</b>. How much of each?`,
              ["6 : 9", "5 : 6", "2 : 9", "6 : 6"],
              0,
              "Multiply BOTH parts by 3: 2×3 and 3×3.",
            ),
            c(
              `You sell <b>4 ${t.itemA} for $12</b>. What is the price for ONE?`,
              ["$3", "$48", "$8", "$12"],
              0,
              "Unit rate = 12 ÷ 4.",
            ),
            c(
              `Better deal: <b>6 ${t.itemA} for $3</b> or <b>10 for $4</b>?`,
              [
                "10 for $4 ($0.40 each)",
                "6 for $3 ($0.50 each)",
                "Same price",
                "Can't tell",
              ],
              0,
              "Each unit price: 3÷6 = $0.50 vs 4÷10 = $0.40.",
            ),
          ];
    const beats = [
      {
        cap: `Welcome to the ${t.setting}!`,
        who: "Coach",
        line: `${n}, the rush is coming. Mix the recipe right or we run out!`,
      },
      {
        cap: "A customer wants the price.",
        who: "Customer",
        line: `How much for just one? ${n}, quick — what's the unit rate?`,
      },
      {
        cap: "Two suppliers, one choice.",
        who: "Supplier",
        line: `${n}, pick the better deal and you save the day's budget!`,
      },
    ];
    return { t, n, beats, challenges, finale: t.sfx };
  }

  // ---- helpers ----
  const esc = (s) =>
    String(s == null ? "" : s).replace(
      /[&<>"]/g,
      (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[m],
    );
  const load = () => {
    try {
      return JSON.parse(localStorage.getItem(KEY)) || null;
    } catch {
      return null;
    }
  };
  const save = (p) => localStorage.setItem(KEY, JSON.stringify(p));
  const clear = () => localStorage.removeItem(KEY);

  function sceneSVG(t, av) {
    return `<svg viewBox="0 0 320 180" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <rect width="320" height="120" fill="${t.sky}"/>
      <rect y="120" width="320" height="60" fill="${t.ground}"/>
      <text x="250" y="60" font-size="44">${t.icon}</text>
      <text x="60" y="120" font-size="56">${AV.find((a) => a.id === av)?.f || "🦸"}</text>
    </svg>`;
  }

  // ---- views ----
  function renderOnboard() {
    const p = { name: "", avatar: "a1", interest: "soccer", level: 1 };
    shell.innerHTML = `
      <span class="tag">Choose your hero</span>
      <div class="card">
        <h1>Be the hero of your own math comic</h1>
        <p class="lede">Enter your name, pick your look, and choose a world. You'll solve real Grade-6 ratio puzzles to save the day.</p>
        <div class="field"><label for="nm">Your first name</label>
          <input id="nm" type="text" maxlength="20" autocomplete="off" placeholder="Type your name" /></div>
        <div class="field"><label>Pick your avatar</label>
          <div class="picker" id="avs">${AV.map((a) => `<button class="pick" data-av="${a.id}" aria-pressed="${a.id === p.avatar}">${avSVG(a)}<span class="label">${a.f}</span></button>`).join("")}</div></div>
        <div class="field"><label>Pick your world</label>
          <div class="picker" id="ints">${Object.entries(THEMES)
            .map(
              ([k, t]) =>
                `<button class="pick" data-int="${k}" aria-pressed="${k === p.interest}"><span class="ic" style="font-size:40px">${t.icon}</span><span class="label">${esc(t.label)}</span></button>`,
            )
            .join("")}</div></div>
        <div class="field"><label>Pick your challenge level</label>
          <div class="levels" id="lvls">
            <button class="level-btn" data-lv="1" aria-pressed="true"><span class="lv">Level 1 · Support</span><span class="lv-desc">Friendly numbers, clear steps.</span></button>
            <button class="level-btn" data-lv="2" aria-pressed="false"><span class="lv">Level 2 · Enrichment</span><span class="lv-desc">Bigger numbers, compare deals.</span></button>
          </div></div>
        <div class="cta-row">
          <button class="btn primary" id="start">Start my comic ▶</button>
          <span class="hint-line">🔒 Saved only on this device. Nothing is sent anywhere.</span>
        </div>
      </div>`;
    const nm = shell.querySelector("#nm");
    nm.addEventListener("input", () => (p.name = nm.value.trim()));
    bindPicker("#avs", "av", (v) => (p.avatar = v));
    bindPicker("#ints", "int", (v) => (p.interest = v));
    bindPicker("#lvls", "lv", (v) => (p.level = +v));
    shell.querySelector("#start").addEventListener("click", () => {
      if (!p.name) {
        nm.focus();
        nm.style.borderColor = "#d9795d";
        return;
      }
      save(p);
      renderComic(p);
    });
  }
  function bindPicker(sel, attr, set) {
    shell.querySelectorAll(`${sel} [data-${attr}]`).forEach((b) =>
      b.addEventListener("click", () => {
        shell
          .querySelectorAll(`${sel} [data-${attr}]`)
          .forEach((x) => x.setAttribute("aria-pressed", "false"));
        b.setAttribute("aria-pressed", "true");
        set(b.dataset[attr]);
      }),
    );
  }

  function renderComic(p) {
    const story = buildStory(p);
    let step = 0;
    const total = story.challenges.length;
    function panel() {
      const beat = story.beats[step],
        ch = story.challenges[step];
      shell.innerHTML = `
        <div class="comic-head"><h1>${esc(story.n)}'s Quest</h1><span class="tag">${THEMES[p.interest].label} · Level ${p.level}</span></div>
        <div class="progress-wrap"><div class="progress"><i style="width:${(step / total) * 100}%"></i></div><span class="progress-label">Panel ${step + 1} of ${total}</span></div>
        <div class="panel"><div class="scene">${sceneSVG(story.t, p.avatar)}<span class="caption">${esc(beat.cap)}</span><span class="sfx">${esc(story.t.sfx)}</span></div></div>
        <div class="bubble"><span class="who">${esc(beat.who)}</span>${beat.line}</div>
        <div class="challenge"><div class="q">${ch.q}</div>
          <div class="choices">${ch.choices.map((opt, i) => `<button class="choice" data-i="${i}">${opt}</button>`).join("")}</div>
          <div class="feedback" id="fb"></div></div>`;
      const fb = shell.querySelector("#fb");
      shell.querySelectorAll(".choice").forEach((btn) =>
        btn.addEventListener("click", () => {
          const i = +btn.dataset.i;
          if (i === ch.correct) {
            btn.classList.add("correct");
            shell
              .querySelectorAll(".choice")
              .forEach((b) => (b.disabled = true));
            fb.className = "feedback good show";
            fb.innerHTML = `✅ Nice, ${esc(story.n)}! ${step + 1 < total ? "" : ""}<div class="next"><button class="btn primary" id="nx">${step + 1 < total ? "Next panel ▶" : "Finish ★"}</button></div>`;
            shell.querySelector("#nx").addEventListener("click", () => {
              step++;
              step < total ? panel() : finale();
            });
          } else {
            btn.classList.add("wrong");
            btn.disabled = true;
            fb.className = "feedback bad show";
            fb.innerHTML = `💡 Not quite — try again. <em>${esc(ch.hint)}</em>`;
          }
        }),
      );
    }
    function finale() {
      shell.innerHTML = `
        <div class="card finale">
          <div class="burst">${esc(story.t.sfx)}</div>
          ${avSVG(
            AV.find((a) => a.id === p.avatar),
            96,
          )}
          <h1>${esc(story.n)} saved the day!</h1>
          <div class="star-row">⭐⭐⭐</div>
          <p class="lede">You used ratios and unit rates like a pro at the ${esc(story.t.setting)}.</p>
          <div class="cta-row" style="justify-content:center">
            <button class="btn primary" id="again">Play another world ▶</button>
            <button class="btn" id="reset">Start over (clear my hero)</button>
          </div>
        </div>`;
      shell
        .querySelector("#again")
        .addEventListener("click", () => renderOnboard());
      shell.querySelector("#reset").addEventListener("click", () => {
        clear();
        renderOnboard();
      });
    }
    panel();
  }

  // boot
  document.getElementById("restart").addEventListener("click", () => {
    clear();
    renderOnboard();
  });
  const saved = load();
  saved && saved.name ? renderComic(saved) : renderOnboard();
})();
