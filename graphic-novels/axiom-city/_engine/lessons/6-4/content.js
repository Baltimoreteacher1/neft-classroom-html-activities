const VOLUME = {
  num: 6041,
  slug: "l64",
  title: "The Order Lock",
  unit: "Lesson 6-4 · Write and Evaluate Expressions with Exponents",
  accent: "#F2C15B",
  nextTeaser: "LESSON 6-5 — LETTERS JOIN THE LINE",
};

const BADGES = [
  { id: "g1", icon: "#sig-ops", label: "Order Keeper — Order of Operations" },
  { id: "g2", icon: "#sig-tile", label: "Line Writer — Write &amp; Evaluate" },
  { id: "g3", icon: "#sig-table", label: "Stall Keeper — Stories to Lines" },
  { id: "boss", icon: "#sig-boss", label: "Lock Breaker — Boss Gate" },
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
  /* p1 — title + the jam */
  {
    ch: "Lesson 6-4 · The Order Lock",
    html: `
  <div style="text-align:center;margin-top:8px"><div class="kicker">EduWonderLab Presents</div>
  <h2 class="splashtitle" style="margin:8px 0">THE ORDER <em>LOCK</em></h2>
  <div class="caption" style="display:inline-block">Lesson 6-4 — writing and evaluating numerical expressions with exponents. Four reader gates stand between the crew and the vault's last notch, and every one is about reading a whole line of math in the right order.</div></div>
  <div class="gn-comic">
    <div class="panel gn-panel panel3d">${globalThis.ART("p1-lock")}
      <div class="sfx" style="top:8px;right:14px">CL-CLUNK</div>
    </div>
    <div class="panel gn-panel gn-half">${globalThis.ART("p1-zara")}
      <div class="balloon" style="top:6px;left:6px;right:6px;max-width:none;--tx:46%"><span class="who">LAYLA</span>It turned one click and JAMMED. This notch isn't a single power — it's a whole line of math.</div>
    </div>
    <div class="panel gn-panel gn-half">${globalThis.ART("p1-theo")}
      <div class="balloon tail-r" style="top:6px;left:6px;right:6px;max-width:none;--tx:46%"><span class="who">ANDRE</span>Then the line has rules. You don't read math left to right like a comic. You read it by RANK.</div>
    </div>
    <div class="caption">The last notch only turns when a line of math is read in the right order. The glitch reads everything left to right, and it is about to get caught.</div>
  </div>`,
  },

  /* p2 — lesson: order of operations with powers */
  {
    ch: "Chapter 1 · Rank Order",
    html: `
  <div class="gn-comic">
    <div class="panel gn-panel panel3d">${globalThis.ART("p2-board")}
      <div class="caption loc">Andre unrolls chalk and a plan. Keiko holds the lantern. The glitch heckles from the dark.</div>
      <div class="gn-sign gn-chalk" data-gn-skip style="left:65%;top:44%">3 + 4 × 2²<br>= 3 + 4 × 4<br>= 3 + 16 = 19</div>
      <div class="balloon" style="bottom:8px;left:28%;max-width:36%;--tx:12px"><span class="who">ANDRE</span>Practice line: 3 + 4 × 2². The exponent goes first: 2² is 4. Then the multiplication: 4 × 4 is 16. Addition waits. Nineteen.</div>
    </div>
    <div class="panel gn-panel gn-third">${globalThis.ART("p2-glitch")}
      <div class="balloon" style="top:6px;left:6px;right:6px;max-width:none;--tx:46%"><span class="who">GLITCH</span>LEFT TO RIGHT!! 3 + 4 is 7, times 2 is 14, squared is 196. OBVIOUSLY.</div>
    </div>
    <div class="panel gn-panel gn-two-thirds">${globalThis.ART("p2-vex")}
      <div class="balloon vex gn-side" style="top:6px;left:6px;max-width:72%"><span class="who">VEX</span>The <b>order of operations</b>: grouping symbols first. Then exponents. Then multiplication and division, together, sweeping left to right. Then addition and subtraction, together, left to right. A line of math with no equal sign is a <b>numerical expression</b>, and to <b>evaluate</b> it is to find its one value.</div>
    </div>
    <div class="caption">Reading 3 + 4 × 2² straight left to right balloons it to 196 — exactly the kind of inflation the glitch adores. Reading it by rank keeps the number honest: 19.</div>
  </div>`,
  },

  /* p3 — GATE g1 */
  {
    ch: "Chapter 1 · Reader Gate",
    gate: "g1",
    html: `
  <div class="gn-comic">
    <div class="panel gn-panel">${globalThis.ART("p4-maya")}
      <div class="balloon" style="top:6px;right:6px;max-width:66%;--tx:10px"><span class="who">KEIKO</span>Reader — two lines, one lock. Read them by rank, not left to right.</div>
    </div>
  </div>`,
  },

  /* p4 — lesson: write the expression from a situation */
  {
    ch: "Chapter 2 · Writing the Line",
    html: `
  <div class="kicker">Chapter Two</div><h2 class="splashtitle">WRITING THE <em>LINE</em></h2>
  <div class="gn-comic">
    <div class="panel gn-panel panel3d">${globalThis.ART("p3-crates")}
      <div class="caption loc">One click down. The next notch reads a situation, and the crew has to write it as math before the lock will accept it.</div>
      <div class="gn-sign gn-chalk" data-gn-skip style="left:70%;top:30%">3 crates of 4² bolts,<br>plus 5 loose bolts</div>
    </div>
    <div class="panel gn-panel gn-half">${globalThis.ART("p3-maya")}
      <div class="balloon" style="top:6px;left:6px;right:6px;max-width:none;--tx:46%"><span class="who">KEIKO</span>Three crates, and each holds 4² bolts. So that's 3 groups of 4². Then 5 loose bolts get ADDED on the end.</div>
    </div>
    <div class="panel gn-panel gn-half">${globalThis.ART("p3-zara")}
      <div class="balloon tail-r" style="top:6px;left:6px;right:6px;max-width:none;--tx:46%"><span class="who">LAYLA</span>So the expression is 3 × 4² + 5. Evaluate it by rank: 4² = 16, then 3 × 16 = 48, then + 5 = 53 bolts.</div>
    </div>
    <div class="caption">To write an expression from a situation, say each part in order of how the story builds it: <b>3 crates of 4²</b> becomes 3 × 4², and <b>plus 5 loose</b> becomes + 5. Then evaluate it by the order of operations.</div>
  </div>`,
  },

  /* p5 — GATE g2 */
  {
    ch: "Chapter 2 · Reader Gate",
    gate: "g2",
    html: `
  <div class="gn-comic">
    <div class="panel gn-panel">${globalThis.ART("p2-vex")}
      <div class="balloon vex gn-side" style="top:6px;left:6px;max-width:60%"><span class="who">VEX</span>Write the line first. Then run it. The lock accepts only a true line with its true value.</div>
    </div>
  </div>`,
  },

  /* p6 — lesson: stories with powers and sharing */
  {
    ch: "Chapter 3 · The Market Stall",
    html: `
  <div class="kicker">Chapter Three</div><h2 class="splashtitle">THE MARKET <em>STALL</em></h2>
  <div class="gn-comic">
    <div class="panel gn-panel panel3d">${globalThis.ART("p6-market")}
      <div class="caption loc">Past the second notch: an old vault market. Every price tag is a story the crew must turn into a line of math.</div>
      <div class="gn-sign gn-chalk" data-gn-skip style="left:58%;top:36%">2 lanterns at $6<br>+ 3 gear boxes at $2³<br>= 2 × 6 + 3 × 2³</div>
      <div class="balloon" style="bottom:8px;left:6px;max-width:46%;--tx:20px"><span class="who">ANDRE</span>Each product is one part of the story: 2 × 6 = 12 and 3 × 2³ = 3 × 8 = 24. Then add them: $36.</div>
    </div>
    <div class="panel gn-panel gn-half">${globalThis.ART("p6-garden")}
      <div class="balloon" style="top:6px;left:6px;right:6px;max-width:none;--tx:46%"><span class="who">KEIKO</span>A square moss bed, 6 tiles on each side, holds 6² tiles. Two beds plus 4 spare tiles: 2 × 6² + 4 = 2 × 36 + 4 = 76.</div>
    </div>
    <div class="panel gn-panel gn-half">${globalThis.ART("p1-theo")}
      <div class="balloon tail-r" style="top:6px;left:6px;right:6px;max-width:none;--tx:46%"><span class="who">ANDRE</span>Shared by 4 gardeners? The WHOLE total gets shared, so it goes in parentheses: (2 × 6² + 4) ÷ 4 = 76 ÷ 4 = 19 each.</div>
    </div>
    <div class="caption">Story words become operations: "each" and "of" multiply, "plus" and "and" add, "a square 6 on a side" is 6², and "shared equally" divides. When a whole total is shared, wrap the total in grouping symbols first — otherwise only the last number gets divided.</div>
  </div>`,
  },

  /* p7 — GATE g3 */
  {
    ch: "Chapter 3 · Reader Gate",
    gate: "g3",
    html: `
  <div class="gn-comic">
    <div class="panel gn-panel">${globalThis.ART("p4-maya")}
      <div class="balloon" style="top:6px;right:6px;max-width:62%;--tx:10px"><span class="who">KEIKO</span>Two more price tags. Write each story as a line, then run it by rank.</div>
    </div>
  </div>`,
  },

  /* p8 — the last line */
  {
    ch: "Chapter 3 · The Last Line",
    html: `
  <div class="gn-comic">
    <div class="panel gn-panel panel3d">${globalThis.ART("p4-lock")}
      <div class="balloon" style="top:6px;left:6px;max-width:44%;--tx:30px"><span class="who">ANDRE</span>Final notch. Three locks, all read by rank. Parentheses first, then exponents.</div>
      <div class="balloon tail-r" style="bottom:8px;right:6px;max-width:44%;--tx:20px"><span class="who">GLITCH</span>LEFT TO RIGHT FOREVER!!</div>
    </div>
    <div class="caption">Boss Gate: read the last lines by rank — a grouped power, a shopping total with an exponent in it, and one lie that has to die in public.</div>
  </div>`,
  },

  /* p9 — BOSS */
  {
    ch: "Boss Gate · Break the Lock",
    gate: "boss",
    html: `
  <div class="gn-comic">
    <div class="panel gn-panel">${globalThis.ART("p4-vex")}
      <div class="balloon vex gn-side" style="top:6px;right:6px;max-width:62%"><span class="who">VEX</span>BOSS GATE. Three locks. Read each line by rank and the notch turns; read it left to right and we live in a vault now.</div>
    </div>
  </div>`,
  },

  /* p10 — victory + links */
  {
    ch: "Chapter 4 · The Lock Opens",
    html: `
  <div class="gn-comic">
    <div class="panel gn-panel panel3d">${globalThis.ART("p5-open")}
      <div class="sfx" style="top:8px;left:14px">KRRRUNNK!</div>
    </div>
    <div class="caption" style="text-align:center"><b>NEXT: ${VOLUME.nextTeaser}</b> — the doorway ahead is labelled with expressions that have letters in them.<br><a href="/graphic-novels/axiom-city/episodes/axiom-city-l6-3-the-power-dial.html">Read The Power Dial (Lesson 6-3)</a> · <a href="/graphic-novels/axiom-city/episodes/axiom-city-u6-e2-the-power-ring.html">Read the full Power Ring episode (Lessons 6-3, 6-4 and 6-5)</a></div>
  </div>`,
  },

  /* p11 — journal */
  {
    ch: "End Matter · Ada Vex's Journal",
    html: `
  <h2 class="splashtitle" style="font-size:1.4rem">ADA VEX'S <em>JOURNAL</em></h2>
  <div class="journal"><h4>Lesson 6-4 — what the order lock taught us</h4>
    <div class="jrow"><b>Order of operations.</b><span>Read math by rank, not left to right: grouping symbols, then exponents, then × and ÷ sweeping left to right together, then + and − last.</span></div>
    <div class="jrow"><b>Numerical expression.</b><span>Numbers and operations with no equal sign and no letters. To evaluate it is to find the one value it is worth.</span></div>
    <div class="jrow"><b>Writing from a situation.</b><span>Say each part of the story in order: 3 crates of 4² bolts plus 5 loose is 3 × 4² + 5 = 53.</span></div>
    <div class="jrow"><b>Sharing a total.</b><span>When a whole total is shared, put the total in grouping symbols: 5 friends share 2 boxes of 3³ gems and 6 loose gems is (2 × 3³ + 6) ÷ 5 = 60 ÷ 5 = 12 each.</span></div>
    <div class="jrow"><b>The glitch's lie.</b><span>Reading left to right inflates everything. (6 + 3) × 2² is 36, not 324, because the exponent only grips the 2.</span></div>
  </div>
  <div class="caption">"A line of math is a recipe. Follow the order and the answer never changes." — A.V.</div>`,
  },

  /* p12 — certificate */
  {
    ch: "End Matter · Certificate",
    html: `
  <div id="certificate">
    <div class="kicker">Axiom City · EduWonderLab</div>
    <h3>READER CERTIFICATE</h3>
    <p style="font:600 .9rem Georgia,serif">This certifies that</p>
    <input id="certName" maxlength="40" placeholder="write your name" aria-label="Your name for the certificate">
    <p style="font:600 .9rem Georgia,serif">completed <b>Lesson 6-4: The Order Lock</b> and proved mastery over writing numerical expressions from situations and evaluating them with the order of operations.</p>
    <div class="certbadges" id="certBadges"></div>
    <button class="gatecheck" id="printCert" style="align-self:center">PRINT CERTIFICATE</button>
  </div>
  <div class="caption" style="text-align:center">The doorway beyond is waiting at the top of the stairs.</div>`,
  },
];

const GATES = {
  g1: {
    title: "Gate 1 · Rank the Operations",
    icon: "#sig-ops",
    prompt: `The notch feeds the dial whole lines of math, and only turns when each line is read in the right ORDER. Evaluate <b>6 + 3 × 2²</b> and <b>(6 + 3) × 2²</b>.`,
    hints: [
      "Conceptual: an expression is read by RANK, not left to right — grouping symbols first, then exponents, then multiplication and division together, then addition and subtraction at the very end.",
      "Procedural: settle the parentheses, rewrite any power as its value, then do the multiplication, and add last. The two lines use the same numbers but different groupings.",
    ],
    worked: {
      steps: [
        "Andre's chalk warm-up: 3 + 4 × 2². No parentheses, so the exponent goes first: 2² = 4.",
        "The line now reads 3 + 4 × 4. Multiplication outranks addition, so 4 × 4 = 16 fires next.",
        "Add last: 3 + 16 = 19. Reading it straight left to right balloons it to 196 — glitch math.",
      ],
      q: "Evaluate 10 − 2³ ÷ 4.",
      a: "8",
    },
    render(body, api) {
      body.innerHTML = `<svg viewBox="0 0 360 120" style="width:100%;border:3px solid var(--navy);border-radius:8px;background:#0d1f33" role="img" aria-label="The order lock readout. Line A shows 6 plus 3 times 2 squared. Line B shows the quantity 6 plus 3, times 2 squared. A warning reads: read in order or do not read.">
      <rect x="26" y="14" width="308" height="34" rx="7" fill="#22456a" stroke="#1FA6A2" stroke-width="2.5"/>
      <text x="44" y="37" font-family="Consolas,monospace" font-weight="700" font-size="17" fill="#7CF2EC">A:  6 + 3 × 2²</text>
      <rect x="26" y="58" width="308" height="34" rx="7" fill="#22456a" stroke="#1FA6A2" stroke-width="2.5"/>
      <text x="44" y="81" font-family="Consolas,monospace" font-weight="700" font-size="17" fill="#7CF2EC">B:  (6 + 3) × 2²</text>
      <text x="180" y="112" text-anchor="middle" font-family="Arial" font-weight="800" font-size="11" fill="#E2674A">READ IN ORDER OR DO NOT READ</text></svg>
      <div style="${ROW}"><span style="${LBL}">A =</span><input class="numin" id="a" inputmode="numeric" aria-label="value of line A"><span style="${LBL}">B =</span><input class="numin" id="b" inputmode="numeric" aria-label="value of line B"></div>`;
      api.onCheck(() => {
        const A = body.querySelector("#a"),
          B = body.querySelector("#b"),
          a = parseFloat(A.value),
          b = parseFloat(B.value);
        A.className = "numin " + (a === 18 ? "ok" : "no");
        B.className = "numin " + (b === 36 ? "ok" : "no");
        if (a !== 18) {
          if (a === 36)
            return api.fail(
              "You added 6 + 3 first. Addition goes LAST — the exponent and the multiplication both outrank it.",
            );
          return api.fail(
            "Line A resists. Exponent first, then the multiplication, then — at the very end — the addition.",
          );
        }
        if (b !== 36) {
          if (b === 18)
            return api.fail(
              "You skipped the parentheses. In line B the grouping comes FIRST: 6 + 3 = 9, then the exponent, then the multiplication.",
            );
          if (b === 324)
            return api.fail(
              "You squared 9 × 2 = 18. The exponent grips only the 2: 9 × 2² means 9 × 4.",
            );
          return api.fail(
            "Line A glows — line B resists. Parentheses first, then the exponent, then multiply.",
          );
        }
        api.pass(
          "A = 18 and B = 36 — both lines read in perfect rank. CLICK. CLICK. The notch grinds onward!",
        );
      });
    },
  },
  g2: {
    title: "Gate 2 · Write It, Then Run It",
    icon: "#sig-tile",
    prompt: `The next plate reads: <i>"4 crates, each holding 3² bolts, plus 5 loose bolts."</i> First pick the expression that says it in symbols — then evaluate it to get the bolt count.`,
    hints: [
      "Conceptual: build the expression in the order the story builds it. '4 crates, each holding 3²' is a multiplication of 4 by the power 3². 'Plus 5 loose' is added after.",
      "Procedural: to evaluate, do the exponent first, then the multiplication, then the addition. The exponent grips only the 3.",
    ],
    worked: {
      steps: [
        "Keiko's warm-up: '3 crates of 4² bolts, plus 5 loose bolts.' Three groups of 4² is 3 × 4².",
        "Plus 5 loose bolts adds on at the end: 3 × 4² + 5.",
        "Evaluate by rank: 4² = 16, then 3 × 16 = 48, then 48 + 5 = 53.",
      ],
      q: "Evaluate 2 × 5² + 3.",
      a: "53",
    },
    render(body, api) {
      body.innerHTML = `<div style="font:600 .9rem 'Segoe UI'">Which expression says <i>"4 crates of 3² bolts, plus 5 loose"</i>?</div>
      <div class="choicebtns">
        <button class="choicebtn" data-q="ex" data-v="right" aria-pressed="false">4 × 3² + 5</button>
        <button class="choicebtn" data-q="ex" data-v="sq" aria-pressed="false">(4 × 3)² + 5</button>
        <button class="choicebtn" data-q="ex" data-v="dbl" aria-pressed="false">4 × 3 × 2 + 5</button>
        <button class="choicebtn" data-q="ex" data-v="sum" aria-pressed="false">4 + 3² + 5</button></div>
      <div style="${ROW};margin-top:6px"><span style="${LBL}">Bolts:</span><input class="numin" id="a" inputmode="numeric" aria-label="number of bolts"></div>`;
      const picks = wirePicks(body, api);
      api.onCheck(() => {
        if (!picks.ex) return api.fail("Pick the symbol expression first — then run it.");
        if (picks.ex !== "right") {
          if (picks.ex === "sq")
            return api.fail(
              "Those parentheses multiply first and then square the whole thing — that squares the number of crates too. Only the 3 per crate is squared.",
            );
          if (picks.ex === "dbl")
            return api.fail(
              "3² is not 3 × 2. The exponent counts copies of the 3 multiplied together: 3 × 3.",
            );
          return api.fail(
            "That ADDS the crates instead of multiplying: 4 crates of 3² means 4 × 3².",
          );
        }
        const A = body.querySelector("#a"),
          a = parseFloat(A.value);
        if (a === 41) {
          A.className = "numin ok";
          return api.pass(
            "4 × 3² + 5: 3² is 9, 4 × 9 is 36, plus 5 is 41. The plate sinks flush into the lock — line accepted!",
          );
        }
        A.className = "numin no";
        if (a === 149)
          return api.fail(
            "Right symbols, wrong run — that is (4 × 3)² + 5. Square only the 3, multiply by 4, then add the 5.",
          );
        if (a === 29) return api.fail("3² is 9, not 3 × 2 = 6. Square the 3 first.");
        api.fail("Exponent first, then the multiplication, then — last — the 5 loose bolts.");
      });
    },
  },
  g3: {
    title: "Gate 3 · Price the Stall",
    icon: "#sig-table",
    prompt: `Two price tags hang on the stall. Tag one: <i>"5 friends share 2 boxes of 3³ gems and 6 loose gems equally."</i> Tag two: <i>"3 square moss beds, 5 tiles on each side, minus 7 cracked tiles."</i>`,
    hints: [
      "Conceptual: when a whole total is shared, the total goes in grouping symbols so the division waits for it. A square bed 5 tiles on a side holds 5² tiles.",
      "Procedural: inside the parentheses, exponent first, then multiply, then add — then divide. For the beds: 5² first, then × 3, then − 7.",
    ],
    worked: {
      steps: [
        "Andre's warm-up: '5 friends share 3 bags of 2³ marbles and 6 loose marbles.' The whole pile is shared, so it goes in parentheses: (3 × 2³ + 6) ÷ 5.",
        "Inside, exponent first: 2³ = 8. Then 3 × 8 = 24, and 24 + 6 = 30.",
        "Now share: 30 ÷ 5 = 6 marbles each.",
      ],
      q: "Evaluate (3 × 2³ + 6) ÷ 5.",
      a: "6",
    },
    render(body, api) {
      body.innerHTML = `<div style="font:600 .9rem 'Segoe UI'">Which line says tag one?</div>
      <div class="choicebtns">
        <button class="choicebtn" data-q="ex" data-v="right" aria-pressed="false">(2 × 3³ + 6) ÷ 5</button>
        <button class="choicebtn" data-q="ex" data-v="nogroup" aria-pressed="false">2 × 3³ + 6 ÷ 5</button>
        <button class="choicebtn" data-q="ex" data-v="cube" aria-pressed="false">((2 × 3)³ + 6) ÷ 5</button>
        <button class="choicebtn" data-q="ex" data-v="sq" aria-pressed="false">(2 × 3 × 3 + 6) ÷ 5</button></div>
      <div style="display:flex;flex-direction:column;gap:10px;margin-top:6px">
      <div style="${ROW}"><span style="${LBL}">Gems each:</span><input class="numin" id="a" inputmode="decimal" aria-label="gems each friend gets"></div>
      <div style="${ROW}"><span style="${LBL}">Tag two: 3 × 5² − 7 =</span><input class="numin" id="b" inputmode="numeric" aria-label="value of 3 times 5 squared minus 7"></div></div>`;
      const picks = wirePicks(body, api);
      api.onCheck(() => {
        if (!picks.ex) return api.fail("Pick the line for tag one first — then run it.");
        if (picks.ex !== "right") {
          if (picks.ex === "nogroup")
            return api.fail(
              "Without parentheses, only the 6 loose gems get shared. The WHOLE pile is shared, so wrap the total.",
            );
          if (picks.ex === "cube")
            return api.fail(
              "That cubes the number of boxes too. Only the 3 gems-per-box is cubed: 2 × 3³.",
            );
          return api.fail("3³ is three 3s multiplied: 3 × 3 × 3, not just 3 × 3.");
        }
        const A = body.querySelector("#a"),
          a = parseFloat(A.value);
        A.className = "numin " + (a === 12 ? "ok" : "no");
        if (a !== 12) {
          if (a === 60)
            return api.fail("60 is the whole pile. The story shares it among 5 friends — divide.");
          if (a === 55.2)
            return api.fail(
              "That shares only the 6 loose gems. Finish the parentheses (60), then divide by 5.",
            );
          return api.fail("Inside first: 3³ = 27, 2 × 27 = 54, 54 + 6 = 60. Then share it by 5.");
        }
        const B = body.querySelector("#b"),
          b = parseFloat(B.value);
        B.className = "numin " + (b === 68 ? "ok" : "no");
        if (b !== 68) {
          if (b === 218)
            return api.fail(
              "That squares 3 × 5. The exponent grips only the 5: 5² = 25 tiles per bed.",
            );
          if (b === 23) return api.fail("5² is 5 × 5 = 25, not 5 × 2. Square the 5 first.");
          return api.fail("Exponent first: 5² = 25. Then 3 × 25 = 75. Then subtract the 7 cracked tiles.");
        }
        api.pass(
          "12 gems each and 68 good tiles — both tags flip to green and the third notch clicks home!",
        );
      });
    },
  },
  boss: {
    title: "BOSS GATE · Break the Lock",
    icon: "#sig-boss",
    prompt: `The glitch throws every left-to-right lie it has at the final notch. Three locks stand between the crew and the doorway:`,
    hints: [
      "Conceptual: grouping symbols are a package — finish the inside before anything else touches it. After that, exponents, then multiply and divide, then add and subtract.",
      "Procedural: Lock 1 — finish the parentheses, then divide. Lock 2 — evaluate the power, then each product, then add the three products. Lock 3 — add inside the parentheses, square that result, then subtract.",
    ],
    worked: {
      steps: [
        "Night-watch drill: (2 × 3² + 2) ÷ 4. Parentheses first, and inside them the exponent leads: 3² = 9.",
        "Inside: 2 × 9 = 18, then 18 + 2 = 20. Now the division: 20 ÷ 4 = 5.",
        "Without the parentheses the line would read 2 × 9 + 2 ÷ 4 = 18.5 — a different, wrong machine.",
      ],
      q: "Evaluate (3 × 2² + 4) ÷ 2.",
      a: "8",
    },
    render(body, api) {
      body.innerHTML = `<div style="display:flex;flex-direction:column;gap:10px">
      <div style="${ROW}"><b style="font:900 .75rem 'Arial Black'">LOCK 1</b><span style="font:600 .88rem 'Segoe UI'">(5 × 2² + 4) ÷ 8 =</span><input class="numin" id="L1" inputmode="numeric" aria-label="value of 5 times 2 squared plus 4, all divided by 8"></div>
      <div style="${ROW}"><b style="font:900 .75rem 'Arial Black'">LOCK 2</b><span style="font:600 .88rem 'Segoe UI'">Shop total: 3 × 12 + 2 × 25 + 5 × 2³ =</span><input class="numin" id="L2" inputmode="numeric" aria-label="value of 3 times 12 plus 2 times 25 plus 5 times 2 cubed"></div>
      <div style="${ROW}"><b style="font:900 .75rem 'Arial Black'">LOCK 3</b><span style="font:600 .88rem 'Segoe UI'">The glitch scrawls "(4 + 1)² − 3 = 2." The true value is</span><input class="numin" id="L3" inputmode="numeric" aria-label="value of the quantity 4 plus 1 squared, minus 3"></div></div>`;
      api.onCheck(() => {
        const e1 = body.querySelector("#L1"),
          v1 = parseFloat(e1.value);
        e1.className = "numin " + (v1 === 3 ? "ok" : "no");
        if (v1 !== 3) {
          if (v1 === 20.5)
            return api.fail(
              "Lock 1 holds. You divided only the 4 by 8 — but the parentheses are a package. Finish 5 × 2² + 4 = 24 first, then divide by 8.",
            );
          if (v1 === 13)
            return api.fail(
              "Lock 1 holds. You squared 5 × 2. The exponent grips only the 2: 5 × 2² means 5 × 4.",
            );
          return api.fail(
            "Lock 1 holds. Inside the parentheses: exponent, then multiply, then add. Then divide the result by 8.",
          );
        }
        const e2 = body.querySelector("#L2"),
          v2 = parseFloat(e2.value);
        e2.className = "numin " + (v2 === 126 ? "ok" : "no");
        if (v2 !== 126) {
          if (v2 === 5 * 8)
            return api.fail(
              "Lock 2 holds. That is just the last product. Add all three: 3 × 12, 2 × 25 and 5 × 2³.",
            );
          return api.fail(
            "Lock 2 holds. Evaluate 2³ first (that is 8), then each of the three products, then add them.",
          );
        }
        const e3 = body.querySelector("#L3"),
          v3 = parseFloat(e3.value);
        e3.className = "numin " + (v3 === 22 ? "ok" : "no");
        if (v3 !== 22) {
          if (v3 === 2)
            return api.fail(
              "Lock 3 holds. The glitch squared only the 1. The parentheses make 4 + 1 = 5 FIRST, and then the whole 5 is squared.",
            );
          if (v3 === 7)
            return api.fail(
              "Lock 3 holds. That treats the exponent 2 as × 2. Squared means 5 × 5.",
            );
          return api.fail(
            "Lock 3 holds. Parentheses first: 4 + 1 = 5. Then square it, then subtract 3.",
          );
        }
        api.pass(
          "ALL LOCKS OPEN. 3, 126 and 22 — and the glitch's 'left to right forever' burns off the wall. The last notch TURNS!",
        );
      });
    },
  },
};

const TEACHER = {
  suggested:
    "Use during or after lesson 6-4 (Write and Evaluate Numerical Expressions with Exponents) as a single focused read. Whole-class on a projector, pairs on devices, or independent practice. The book covers only this lesson: the order of operations with exponents and grouping symbols, and writing a numerical expression from a situation (including a power, and a shared total in grouping symbols). Exponent meaning belongs to lesson 6-3 (The Power Dial); expressions with letters belong to lesson 6-5. Progress saves on the device.",
  standards: [
    [
      "6.AT.5",
      "Write and evaluate numerical expressions involving whole-number exponents",
      "Gate 1, Gate 2, Gate 3, Boss",
    ],
    [
      "6.AT.6c",
      "Evaluate expressions at specific values, including expressions that arise from real-world problems",
      "Gate 2, Gate 3, Boss",
    ],
  ],
  answers: [
    [
      "Gate 1",
      "6 + 3 × 2² = 18 (trap 36: added 6 + 3 first). (6 + 3) × 2² = 36 (traps: 18 ignored the parentheses; 324 squared 9 × 2).",
    ],
    [
      "Gate 2",
      "'4 crates of 3², plus 5 loose' → 4 × 3² + 5 (distractors: (4 × 3)² + 5, 4 × 3 × 2 + 5, 4 + 3² + 5); value 4 × 9 + 5 = 41 (traps: 149 = (4 × 3)² + 5; 29 = 4 × 3 × 2 + 5).",
    ],
    [
      "Gate 3",
      "'5 friends share 2 boxes of 3³ gems and 6 loose gems' → (2 × 3³ + 6) ÷ 5 (distractors: 2 × 3³ + 6 ÷ 5, (2 × 3)³ + 6 ÷ 5, (2 × 3 × 3 + 6) ÷ 5); value 60 ÷ 5 = 12 (traps: 60 forgot to share; 55.2 shares only the 6). 3 × 5² − 7 = 68 (traps: 218 = (3 × 5)² − 7; 23 treats 5² as 5 × 2).",
    ],
    [
      "Boss",
      "Lock 1: (5 × 2² + 4) ÷ 8 = 24 ÷ 8 = 3 (traps: 20.5 ignores the parentheses; 13 squares 5 × 2). Lock 2: 3 × 12 + 2 × 25 + 5 × 2³ = 36 + 50 + 40 = 126. Lock 3: (4 + 1)² − 3 = 22 (traps: 2 squares only the 1; 7 treats 5² as 5 × 2).",
    ],
  ],
};
