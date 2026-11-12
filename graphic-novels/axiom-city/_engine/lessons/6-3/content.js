const VOLUME = {
  num: 6031,
  slug: "l63",
  title: "The Power Dial",
  unit: "Lesson 6-3 · Exponents",
  accent: "#F2C15B",
  nextTeaser: "LESSON 6-4 — THE ORDER LOCK",
};

const BADGES = [
  { id: "g1", icon: "#sig-pow", label: "Power Reader — Base &amp; Exponent" },
  { id: "g2", icon: "#sig-tile", label: "Power Evaluator — Squared &amp; Cubed" },
  { id: "boss", icon: "#sig-boss", label: "Dial Turner — Boss Gate" },
];

function mkfeed(el, msg, ok) {
  el.textContent = msg;
  el.className = "gatefeedback " + (ok ? "good" : "bad");
}

/* two-or-more choice groups per gate: one pick per group, data-q names the group */
function wirePicks(body, api) {
  const picks = {};
  body.querySelectorAll("[data-q]").forEach((b) =>
    b.addEventListener("click", () => {
      body
        .querySelectorAll(`[data-q="${b.dataset.q}"]`)
        .forEach((x) => x.setAttribute("aria-pressed", "false"));
      b.setAttribute("aria-pressed", "true");
      picks[b.dataset.q] = b.dataset.v;
      api.sound("blip");
    }),
  );
  return picks;
}
const LBL = "font:900 1.05rem 'Arial Black',Arial;color:var(--navy)";
const ROW = "display:flex;align-items:center;gap:10px;flex-wrap:wrap";

const PAGES = [
  /* p1 — title + the problem */
  {
    ch: "Lesson 6-3 · The Power Dial",
    html: `
  <div style="text-align:center;margin-top:8px"><div class="kicker">EduWonderLab Presents</div>
  <h2 class="splashtitle" style="margin:8px 0">THE POWER <em>DIAL</em></h2>
  <div class="caption" style="display:inline-block">Lesson 6-3 — exponents. Three reader gates stand between the crew and the vault's second ring, and every one is about powers: the base, the exponent and repeated multiplication. Nothing else.</div></div>
  <div class="gn-comic">
    <div class="panel gn-panel panel3d">${globalThis.ART("p1-ring")}
      <div class="sfx" style="top:8px;left:14px">SKRRT!</div>
      <div class="gn-sign gn-scrawl" data-gn-skip style="left:76%;top:44%">3⁴ = 12!!</div>
    </div>
    <div class="panel gn-panel gn-half">${globalThis.ART("p1-dev")}
      <div class="balloon" style="top:6px;left:6px;right:6px;max-width:none;--tx:46%"><span class="who">MATEO</span>Ring two: a giant dial made of powers. Little numbers riding on bigger numbers. I have a lot of questions.</div>
    </div>
    <div class="panel gn-panel gn-half">${globalThis.ART("p1-theo")}
      <div class="balloon tail-r" style="top:6px;left:6px;right:6px;max-width:none;--tx:46%"><span class="who">ANDRE</span>The glitch just chalked "3⁴ = 12" on a notch. The notch went dark. It's feeding the dial wrong answers.</div>
    </div>
    <div class="caption">Each notch on the dial shows a <b>power</b> — a small expression like 3⁴ or 7³ — and only glows when it is given its true value. The glitch has one trick, and it is about to get caught.</div>
  </div>`,
  },

  /* p2 — lesson: reading a power */
  {
    ch: "Chapter 1 · Reading Powers",
    html: `
  <div class="gn-comic">
    <div class="panel gn-panel panel3d">${globalThis.ART("p2-board")}
      <div class="caption loc">Andre unrolls chalk and a plan. Mateo holds the lantern. The glitch heckles from the dark.</div>
      <div class="gn-sign gn-chalk" data-gn-skip style="left:65%;top:44%">3⁴ = 3 × 3 × 3 × 3<br>= 81</div>
      <div class="balloon" style="bottom:8px;left:28%;max-width:36%;--tx:12px"><span class="who">ANDRE</span>Practice chip: 3⁴. Base 3, exponent 4 — so four 3s multiplied together. Eighty-one.</div>
    </div>
    <div class="panel gn-panel gn-third">${globalThis.ART("p2-glitch")}
      <div class="balloon" style="top:6px;left:6px;right:6px;max-width:none;--tx:46%"><span class="who">GLITCH</span>WRONG. three times four!! TWELVE. tiny number. very efficient.</div>
    </div>
    <div class="panel gn-panel gn-two-thirds">${globalThis.ART("p2-vex")}
      <div class="balloon vex gn-side" style="top:6px;left:6px;max-width:72%"><span class="who">VEX</span>A <b>power</b> has two parts: the <b>base</b> — the number being copied — and the <b>exponent</b> — how many copies get multiplied. That is <b>repeated multiplication</b>. Writing every copy out, 3 × 3 × 3 × 3, is the <b>expanded form</b>. The glitch just did base times exponent. That is not a thing.</div>
    </div>
    <div class="caption">Say 3⁴ "three to the fourth power." The exponent counts factors, not a multiplication partner: 3 × 3 × 3 × 3 = 81, while the glitch's 3 × 4 = 12 is nowhere near it.</div>
  </div>`,
  },

  /* p3 — GATE g1 */
  {
    ch: "Chapter 1 · Reader Gate",
    gate: "g1",
    html: `
  <div class="gn-comic">
    <div class="panel gn-panel">${globalThis.ART("p4-dev")}
      <div class="balloon" style="top:6px;right:6px;max-width:66%;--tx:10px"><span class="who">MATEO</span>Reader — two notches need reading before they can be fed. Name the parts of one, then write the other the short way.</div>
    </div>
  </div>`,
  },

  /* p4 — lesson: evaluating, squared, cubed */
  {
    ch: "Chapter 2 · Squares and Cubes",
    html: `
  <div class="kicker">Chapter Two</div><h2 class="splashtitle">SQUARES &amp; <em>CUBES</em></h2>
  <div class="gn-comic">
    <div class="panel gn-panel panel3d">${globalThis.ART("p3-tiles")}
      <div class="caption loc">Two clicks later the dial wants VALUES. Layla spots two props the vault keeps for exactly this.</div>
    </div>
    <div class="panel gn-panel gn-half">${globalThis.ART("p3-zara")}
      <div class="balloon" style="top:6px;left:6px;right:6px;max-width:none;--tx:46%"><span class="who">LAYLA</span>A square tile five long and five wide holds 5 × 5 little squares. That is why 5² is said "five squared" — 25.</div>
    </div>
    <div class="panel gn-panel gn-half">${globalThis.ART("p3-maya")}
      <div class="balloon tail-r" style="top:6px;left:6px;right:6px;max-width:none;--tx:46%"><span class="who">KEIKO</span>And a cube crate, three by three by three, holds 3 × 3 × 3 blocks. So 3³ is "three cubed" — 27.</div>
    </div>
    <div class="caption"><b>Evaluate</b> a power by multiplying it all the way out. Keep a running product: 2⁴ is 2 × 2 = 4, × 2 = 8, × 2 = 16. <b>Squared</b> means an exponent of 2; <b>cubed</b> means an exponent of 3.</div>
  </div>`,
  },

  /* p5 — GATE g2 */
  {
    ch: "Chapter 2 · Reader Gate",
    gate: "g2",
    html: `
  <div class="gn-comic">
    <div class="panel gn-panel">${globalThis.ART("p2-vex")}
      <div class="balloon vex gn-side" style="top:6px;left:6px;max-width:60%"><span class="who">VEX</span>Three notches, three true values. Multiply each one all the way out.</div>
    </div>
  </div>`,
  },

  /* p6 — glitch counterattack: the swap */
  {
    ch: "Chapter 3 · The Swap",
    html: `
  <div class="kicker">Chapter Three</div><h2 class="splashtitle">THE <em>SWAP</em></h2>
  <div class="gn-comic">
    <div class="panel gn-panel panel3d">${globalThis.ART("p4-swap")}
      <div class="caption loc">The glitch has a new trick: two brass plaques, and a very proud grin.</div>
      <div class="balloon" style="top:8px;left:6px;max-width:42%;--tx:30px"><span class="who">GLITCH</span>2⁵ and 5²! Same two numbers! SAME ANSWER! I am a genius!</div>
    </div>
    <div class="caption">The glitch claims that swapping the base and the exponent makes no difference. Reader, you are about to find out whether 2⁵ and 5² are twins.</div>
  </div>`,
  },

  /* p7 — BOSS */
  {
    ch: "Boss Gate · Turn the Dial",
    gate: "boss",
    html: `
  <div class="gn-comic">
    <div class="panel gn-panel">${globalThis.ART("p4-vex")}
      <div class="balloon vex gn-side" style="top:6px;right:6px;max-width:62%"><span class="who">VEX</span>BOSS GATE. Three locks. Feed the dial the truth and it turns; feed it glitch math and we live in a vault now.</div>
    </div>
  </div>`,
  },

  /* p8 — victory + link onward */
  {
    ch: "Chapter 4 · The Dial Turns",
    html: `
  <div class="gn-comic">
    <div class="panel gn-panel panel3d">${globalThis.ART("p5-turn")}
      <div class="sfx" style="top:8px;left:14px">KRRRUNNK!</div>
    </div>
    <div class="caption" style="text-align:center"><b>NEXT: ${VOLUME.nextTeaser}</b> — the dial's last notch reads whole lines of math, and it only turns when they are read in the right order.<br><a href="/graphic-novels/axiom-city/episodes/axiom-city-l6-4-the-order-lock.html">Read The Order Lock (Lesson 6-4)</a> · <a href="/graphic-novels/axiom-city/episodes/axiom-city-u6-e2-the-power-ring.html">Read the full Power Ring episode (Lessons 6-3, 6-4 and 6-5)</a></div>
  </div>`,
  },

  /* p9 — journal */
  {
    ch: "End Matter · Ada Vex's Journal",
    html: `
  <h2 class="splashtitle" style="font-size:1.4rem">ADA VEX'S <em>JOURNAL</em></h2>
  <div class="journal"><h4>Lesson 6-3 — what the power dial taught us</h4>
    <div class="jrow"><b>Power.</b><span>A base and an exponent. The base is the number being copied; the exponent counts the copies being MULTIPLIED. 3⁴ = 3 × 3 × 3 × 3 = 81 — never 3 × 4.</span></div>
    <div class="jrow"><b>Expanded form.</b><span>Writing every copy of the base with × between them: 7³ = 7 × 7 × 7. Repeated multiplication is what a power means.</span></div>
    <div class="jrow"><b>Squared &amp; cubed.</b><span>An exponent of 2 is "squared" and an exponent of 3 is "cubed" — a square tile and a cube crate. 5² = 25 and 3³ = 27.</span></div>
    <div class="jrow"><b>Base and exponent are not twins.</b><span>2⁵ = 32 but 5² = 25. Swapping them changes the number, because the base is what gets copied.</span></div>
  </div>
  <div class="caption">"A power is a promise of repeated multiplication. Keep count, and nothing can inflate on you." — A.V.</div>`,
  },

  /* p10 — certificate */
  {
    ch: "End Matter · Certificate",
    html: `
  <div id="certificate">
    <div class="kicker">Axiom City · EduWonderLab</div>
    <h3>READER CERTIFICATE</h3>
    <p style="font:600 .9rem Georgia,serif">This certifies that</p>
    <input id="certName" maxlength="40" placeholder="write your name" aria-label="Your name for the certificate">
    <p style="font:600 .9rem Georgia,serif">completed <b>Lesson 6-3: The Power Dial</b> and proved mastery over reading, writing and evaluating powers.</p>
    <div class="certbadges" id="certBadges"></div>
    <button class="gatecheck" id="printCert" style="align-self:center">PRINT CERTIFICATE</button>
  </div>
  <div class="caption" style="text-align:center">Lesson 6-4 — The Order Lock — is waiting at the next notch.</div>`,
  },
];

const GATES = {
  g1: {
    title: "Gate 1 · Read the Dial",
    icon: "#sig-pow",
    prompt: `Two notches need reading. The first shows the power <b>4⁵</b>. The second is a row of three 7s: <b>7 × 7 × 7</b>.`,
    hints: [
      "Conceptual: in a power, the big number is the BASE — what gets copied. The small raised number is the EXPONENT — how many copies get multiplied.",
      "Procedural: for the row of 7s, name the number being copied, then count how many 7s there are. That count goes up high.",
    ],
    worked: {
      steps: [
        "Andre's practice chip: 3⁴. The 3 is the base, the raised 4 is the exponent.",
        "The exponent says four 3s are multiplied: 3 × 3 × 3 × 3. That row of copies is the expanded form.",
        "Going the other way works too: a row of four 3s is written 3⁴ — base 3, exponent 4.",
      ],
      q: "Write 5 × 5 × 5 × 5 as a power. What is the exponent?",
      a: "4",
    },
    render(body, api) {
      body.innerHTML = `<div style="font:600 .9rem 'Segoe UI'">In <b>4⁵</b>, which number is the <b>exponent</b>?</div>
      <div class="choicebtns">
        <button class="choicebtn" data-q="exp" data-v="4" aria-pressed="false">4</button>
        <button class="choicebtn" data-q="exp" data-v="5" aria-pressed="false">5</button>
        <button class="choicebtn" data-q="exp" data-v="20" aria-pressed="false">20</button>
        <button class="choicebtn" data-q="exp" data-v="9" aria-pressed="false">9</button></div>
      <div style="font:600 .9rem 'Segoe UI';margin-top:8px">Which power says <b>7 × 7 × 7</b>?</div>
      <div class="choicebtns">
        <button class="choicebtn" data-q="pow" data-v="right" aria-pressed="false">7³</button>
        <button class="choicebtn" data-q="pow" data-v="swap" aria-pressed="false">3⁷</button>
        <button class="choicebtn" data-q="pow" data-v="times" aria-pressed="false">7 × 3</button>
        <button class="choicebtn" data-q="pow" data-v="count" aria-pressed="false">7²</button></div>`;
      const picks = wirePicks(body, api);
      api.onCheck(() => {
        if (!picks.exp || !picks.pow)
          return api.fail("Answer both notches — pick the exponent, then pick the power.");
        if (picks.exp !== "5") {
          if (picks.exp === "4")
            return api.fail(
              "4 is the BASE — the number being copied. The exponent is the small raised number.",
            );
          if (picks.exp === "20")
            return api.fail(
              "20 is 4 × 5 — the glitch's move. An exponent is a count of copies, never a multiplication partner.",
            );
          return api.fail(
            "9 is 4 + 5, but a power is not an addition. Find the small number raised up high.",
          );
        }
        if (picks.pow !== "right") {
          if (picks.pow === "swap")
            return api.fail(
              "3⁷ would be seven 3s. Here the 7 is what gets copied — it is the base — and it appears three times.",
            );
          if (picks.pow === "times")
            return api.fail(
              "7 × 3 is the glitch's favorite. A power writes the repeated factor once, with a count raised beside it.",
            );
          return api.fail("7² is only two 7s. Count the 7s in the row: there are three.");
        }
        api.pass(
          "Exponent 5, and 7 × 7 × 7 = 7³ — both notches flare cyan. The dial grinds one click!",
        );
      });
    },
  },
  g2: {
    title: "Gate 2 · Feed the Notches",
    icon: "#sig-tile",
    prompt: `Three dark notches want their true values: <b>2⁵</b>, <b>six squared</b> (6²) and <b>four cubed</b> (4³). Multiply each one all the way out.`,
    hints: [
      "Conceptual: evaluate a power by writing out the copies and multiplying. Squared means two copies; cubed means three copies.",
      "Procedural: keep a running product — multiply the first two copies, then multiply that result by the next copy, and keep going until the copies run out.",
    ],
    worked: {
      steps: [
        "Mateo's practice chip: 2⁴. The base is 2 and there are four copies: 2 × 2 × 2 × 2.",
        "Keep a running product: 2 × 2 = 4, then 4 × 2 = 8, then 8 × 2 = 16.",
        "So 2⁴ = 16. Not 2 × 4 = 8 — that is the glitch's number.",
      ],
      q: "What is 2⁴?",
      a: "16",
    },
    render(body, api) {
      body.innerHTML = `<div style="display:flex;flex-direction:column;gap:10px">
      <div style="${ROW}"><span style="${LBL}">2⁵ =</span><input class="numin" id="a" inputmode="numeric" aria-label="value of 2 to the 5th power"></div>
      <div style="${ROW}"><span style="${LBL}">6² =</span><input class="numin" id="b" inputmode="numeric" aria-label="value of 6 squared"></div>
      <div style="${ROW}"><span style="${LBL}">4³ =</span><input class="numin" id="c" inputmode="numeric" aria-label="value of 4 cubed"></div></div>`;
      api.onCheck(() => {
        const A = body.querySelector("#a"),
          B = body.querySelector("#b"),
          C = body.querySelector("#c");
        const a = parseFloat(A.value),
          b = parseFloat(B.value),
          c = parseFloat(C.value);
        A.className = "numin " + (a === 32 ? "ok" : "no");
        B.className = "numin " + (b === 36 ? "ok" : "no");
        C.className = "numin " + (c === 64 ? "ok" : "no");
        if (a !== 32) {
          if (a === 10)
            return api.fail(
              "That's 2 × 5 — the glitch's signature move. 2⁵ is five 2s multiplied: 2 × 2 × 2 × 2 × 2.",
            );
          if (a === 25)
            return api.fail(
              "That's 5² — base and exponent swapped. In 2⁵ the 2 is the base being copied.",
            );
          return api.fail(
            "Notch I stays dark. Write five 2s with × between them and keep a running product.",
          );
        }
        if (b !== 36) {
          if (b === 12)
            return api.fail("That's 6 × 2. Squared means two copies of 6 MULTIPLIED: 6 × 6.");
          return api.fail("Notch II stays dark. Six squared is 6 × 6.");
        }
        if (c !== 64) {
          if (c === 12)
            return api.fail(
              "That's 4 × 3. Cubed means three copies of 4 multiplied together: 4 × 4 × 4.",
            );
          if (c === 81)
            return api.fail(
              "That's 3⁴ — the base and exponent traded places. Four cubed is three 4s: 4 × 4 = 16, then 16 × 4.",
            );
          return api.fail(
            "Notch III stays dark. Four cubed is 4 × 4 × 4 — keep a running product.",
          );
        }
        api.pass(
          "2⁵ = 32, 6² = 36 and 4³ = 64 — all three notches blaze gold and the glitch's smears burn off!",
        );
      });
    },
  },
  boss: {
    title: "BOSS GATE · Turn the Dial",
    icon: "#sig-boss",
    prompt: `The glitch throws everything it has at the final alignment. Three locks stand between the crew and the second ring:`,
    hints: [
      "Conceptual: swapping the base and the exponent builds a different power. The base is what gets copied; the exponent only counts the copies.",
      "Procedural: Lock 1 — multiply three 6s with a running product. Lock 2 — evaluate BOTH powers before comparing. Lock 3 — eight squared is two 8s multiplied.",
    ],
    worked: {
      steps: [
        "Night-watch drill: which is greater, 3⁴ or 4³? Evaluate both first.",
        "3⁴ = 3 × 3 × 3 × 3 = 81. And 4³ = 4 × 4 × 4 = 64.",
        "81 is greater than 64, so 3⁴ wins — the two powers are not twins, even though they use the same two numbers.",
      ],
      q: "What is 3⁴ − 4³?",
      a: "17",
    },
    render(body, api) {
      body.innerHTML = `<div style="display:flex;flex-direction:column;gap:10px">
      <div style="${ROW}"><b style="font:900 .75rem 'Arial Black'">LOCK 1</b><span style="font:600 .88rem 'Segoe UI'">The core: 6³ =</span><input class="numin" id="L1" inputmode="numeric" aria-label="value of 6 cubed"></div>
      <div><b style="font:900 .75rem 'Arial Black'">LOCK 2</b><div style="font:600 .88rem 'Segoe UI';margin:4px 0">The glitch says 2⁵ and 5² are twins. Which is greater?</div>
        <div class="choicebtns">
          <button class="choicebtn" data-q="cmp" data-v="a" aria-pressed="false">2⁵ is greater</button>
          <button class="choicebtn" data-q="cmp" data-v="b" aria-pressed="false">5² is greater</button>
          <button class="choicebtn" data-q="cmp" data-v="eq" aria-pressed="false">They are equal — swapping changes nothing</button></div></div>
      <div style="${ROW}"><b style="font:900 .75rem 'Arial Black'">LOCK 3</b><span style="font:600 .88rem 'Segoe UI'">The glitch scrawls "8² = 16." The true value is</span><input class="numin" id="L3" inputmode="numeric" aria-label="value of 8 squared"></div></div>`;
      const picks = wirePicks(body, api);
      api.onCheck(() => {
        const e1 = body.querySelector("#L1"),
          v1 = parseFloat(e1.value);
        e1.className = "numin " + (v1 === 216 ? "ok" : "no");
        if (v1 !== 216) {
          if (v1 === 18)
            return api.fail(
              "Lock 1 holds. That's 6 × 3 — glitch math. Cubed means three 6s multiplied: 6 × 6 × 6.",
            );
          if (v1 === 36)
            return api.fail("Lock 1 holds. 36 is 6 × 6 — only two copies. A cube needs a third 6.");
          return api.fail("Lock 1 holds. 6 × 6 = 36, then 36 × 6.");
        }
        if (!picks.cmp)
          return api.fail("Lock 2 waits. Evaluate both powers, then pick the greater one.");
        if (picks.cmp !== "a") {
          if (picks.cmp === "eq")
            return api.fail(
              "Lock 2 holds. 2⁵ is 32 and 5² is 25 — same numbers, different powers. The base is what gets copied.",
            );
          return api.fail(
            "Lock 2 holds. 5² is only 5 × 5 = 25. Evaluate 2⁵ — five 2s — and compare.",
          );
        }
        const e3 = body.querySelector("#L3"),
          v3 = parseFloat(e3.value);
        e3.className = "numin " + (v3 === 64 ? "ok" : "no");
        if (v3 !== 64) {
          if (v3 === 16)
            return api.fail(
              "Lock 3 holds. 16 is 8 × 2 — the glitch's lie again. Squared means 8 × 8.",
            );
          return api.fail("Lock 3 holds. Eight squared is two 8s multiplied together.");
        }
        api.pass(
          "ALL LOCKS OPEN. 6³ = 216, 2⁵ beats 5², and 8² = 64 — the glitch's lies burn off the wall. The dial TURNS!",
        );
      });
    },
  },
};

const TEACHER = {
  suggested:
    "Use during or after lesson 6-3 (Explore Numerical Expressions with Exponents) as a single focused read. Whole-class on a projector, pairs on devices, or independent practice. The book covers only this lesson: base, exponent, power, repeated multiplication, expanded form, squared and cubed. Order of operations belongs to lesson 6-4 (The Order Lock). Progress saves on the device.",
  standards: [
    [
      "6.AT.5",
      "Write and evaluate numerical expressions involving whole-number exponents",
      "Gate 1, Gate 2, Boss",
    ],
  ],
  answers: [
    [
      "Gate 1",
      "The exponent of 4⁵ is 5 (traps: 4 is the base; 20 is 4 × 5; 9 is 4 + 5). 7 × 7 × 7 = 7³ (traps: 3⁷ swaps base and exponent; 7 × 3 is the glitch's move; 7² is only two copies).",
    ],
    [
      "Gate 2",
      "2⁵ = 32 (traps: 10 = 2 × 5; 25 = 5²). 6² = 36 (trap: 12 = 6 × 2). 4³ = 64 (traps: 12 = 4 × 3; 81 = 3⁴).",
    ],
    [
      "Boss",
      "Lock 1: 6³ = 216 (traps: 18 = 6 × 3; 36 = 6²). Lock 2: 2⁵ = 32 is greater than 5² = 25. Lock 3: 8² = 64 (trap: 16 = 8 × 2).",
    ],
  ],
};
