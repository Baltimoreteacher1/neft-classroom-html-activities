/* STORY · Unit 5 · Graphic Novel #2 (Enrichment) · Theme Park Engineer: Area Architect
   Full novel on the comic engine. Enrichment tier: harder numbers, reverse /
   missing-dimension problems, optional "Captain's Challenge" bonus rounds
   (non-gating, still scored), English-only (source has no Spanish), 10-term
   codex. All math/answers/distractors/hints/glossary carried verbatim from
   graphic-novels/unit5/graphic-novel-2.html (6.G.1).
   New: panels, speech, BOLT-voices-the-misconception (slant-as-height / forgets
   ÷2), vocab pop-ups. */
window.GN_STORY = {
  meta: {
    unit: 5,
    version: 2,
    level: "Enrichment",
    title: "Theme Park Engineer: Area Architect &#127906;",
    standard: "6.G.1",
    readingStandard: "RL.6.1",
    assessment: "Graphic Novel U5 #2: Theme Park Engineer: Area Architect",
    artBase: "../_art/unit5/",
    home: "../index.html",
  },

  cast: {
    engineer: {
      name: "The Engineer",
      role: "protagonist",
      color: "#ff8a3d",
      tagIcon: "&#128104;&#8205;&#128295;",
      avatar: null,
      blurb: "You",
    },
    bolt: {
      name: "BOLT",
      role: "companion",
      color: "#3da5ff",
      tagIcon: "&#129302;",
      avatar: null,
      blurb: "Build-bot · grabs the slant edge as the height",
    },
    log: { name: "Park AI", role: "narrator", color: "#3da5ff" },
  },

  cover: {
    art: "cover.png",
    alt: "A young engineer named Maya stands on a hill looking at a glowing futuristic amusement park at sunset",
    blurbEn:
      "Lead <b>Engineer</b>, you have thirty days to deliver the most ambitious amusement park ever drafted. Every ride, plaza, and pavilion stays locked in the simulator until its <b>surface area</b> is calculated to the square meter. Master the area of parallelograms, triangles, and trapezoids &mdash; then fuse them into <b>composite figures</b> &mdash; to bring the whole park online. BOLT will help… but it keeps grabbing the slanted edge as the height.",
    blurbEs: "",
    startLabel: "Begin Build &#128640;",
  },

  acts: [
    /* ============================ ACT 1 ============================ */
    {
      id: "act1",
      tab: "Act 1: The Slanted Plaza",
      kicker: "Act 1 · Area of Parallelograms",
      title: "The Slanted Plaza",
      advanceLabel: "Open the plaza &#127881;",
      steps: [
        {
          type: "beats",
          art: "design-plaza.png",
          alt: "Maya designs a slanted parallelogram-shaped entry plaza on a glowing holographic table",
          lastLabel: "Compute area &#9654;",
          beats: [
            {
              who: "log",
              caption: true,
              en: "Lead Engineer, the simulator is live. The entry plaza renders as a parallelogram &mdash; pour its slab once you compute the area.",
            },
            {
              who: "log",
              caption: true,
              en: "Thirty days to launch. Every structure stays locked in the simulator until its area is verified to the square meter &mdash; so precision is everything.",
            },
            {
              who: "engineer",
              en: "Standard A = b &times; h. The trap is the slanted edge &mdash; area only ever uses the perpendicular height. Feeding the solver now.",
              vocab: [
                {
                  term: "perpendicular height",
                  en: "The straight-line distance from a base to the opposite side, meeting at a right angle. It is NOT the slanted side length.",
                },
              ],
            },
            {
              who: "bolt",
              misconception: true,
              en: "The slanted edge reads 7 m &mdash; I&rsquo;ll plug that in as the height: 14 &times; 7 = 98. Sending the slab spec!",
            },
            {
              who: "engineer",
              en: "Freeze the spec, BOLT. The slant always reads longer than the true drop &mdash; if we pour to a slant, every slab in the park inherits the error. We measure the perpendicular drop or we measure nothing.",
            },
          ],
        },
        {
          type: "challenge",
          id: "1a",
          ask: {
            who: "bolt",
            en: 'Hold on &mdash; the entry plaza is a parallelogram. Use <span class="formula">A = b &times; h</span>, where <b>h</b> is the <b>perpendicular</b> height &mdash; not the slanted side. The base is <b>14 m</b>, the perpendicular height is <b>6 m</b>, and the slanted edge measures <b>7 m</b>. What is the area?',
            vocab: [
              {
                term: "parallelogram",
                en: "A quadrilateral with two pairs of parallel sides. A = b &times; h, where h is the perpendicular distance between the bases.",
              },
            ],
          },
          choices: [
            {
              en: "98 m&sup2; &nbsp;(used the 7 m slant, not the height)",
              correct: false,
            },
            {
              en: "84 m&sup2; &nbsp;(14 &times; 6, perpendicular height)",
              correct: true,
            },
            {
              en: "27 m&sup2; &nbsp;(added 14 + 7 + 6)",
              correct: false,
            },
          ],
          goodEn:
            "&#9989; Correct. A = 14 &times; 6 = 84 m&sup2;. You ignored the 7 m slant and used the perpendicular height. Slab poured.",
          badEn:
            "&#10060; Area uses the PERPENDICULAR height (6 m), never the slanted edge (7 m). Recompute 14 &times; 6.",
          solveBeat: {
            who: "engineer",
            en: "Slab poured. Next the walkway is defined by its target area, not its height &mdash; so I reverse the formula and solve for the missing dimension.",
          },
        },
        {
          type: "comprehension",
          id: "c1",
          skill: "vocab_in_context",
          standard: "RI.6.4",
          dok: 2,
          interaction: "mc",
          passageRef: "act1.1a",
          ask: {
            who: "log",
            en: "The Engineer insists area uses the <b>perpendicular</b> height. In this build, <b>perpendicular</b> most nearly describes a measurement that &mdash;",
          },
          choices: [
            {
              en: "meets the base at a right angle, giving the straight-line drop between the two bases.",
              correct: true,
            },
            {
              en: "runs along the longest slanted edge of the figure.",
              correct: false,
            },
            {
              en: "is simply the largest number printed on the blueprint.",
              correct: false,
            },
          ],
          goodEn:
            "&#9989; Exactly. <i>Perpendicular</i> means meeting at a right angle &mdash; the true vertical drop between the bases, never the slanted side.",
          badEn:
            "&#10060; In this context, <i>perpendicular</i> means meeting the base at a right angle (the straight drop), not the slant or the biggest number.",
        },
        {
          type: "challenge",
          id: "1b",
          art: "design-plaza.png",
          alt: "Maya designs a slanted parallelogram-shaped entry plaza on a glowing holographic table",
          ask: {
            who: "engineer",
            en: 'The walkway must cover exactly <b>96 m&sup2;</b> of ground, and the blueprint fixes the base at <b>12 m</b>. Working backward from <span class="formula">A = b &times; h</span>, what height must the parallelogram have?',
            vocab: [
              {
                term: "reverse problem",
                en: "Solving for a missing dimension when the area is known: rearrange the formula, e.g. h = A &divide; b, or h = 2A &divide; b for a triangle.",
              },
            ],
          },
          choices: [
            {
              en: "108 m &nbsp;(added 96 + 12)",
              correct: false,
            },
            {
              en: "8 m &nbsp;(h = A &divide; b = 96 &divide; 12)",
              correct: true,
            },
            {
              en: "1152 m &nbsp;(multiplied 96 &times; 12)",
              correct: false,
            },
          ],
          goodEn:
            "&#9989; Exactly. Rearranged: h = A &divide; b = 96 &divide; 12 = 8 m. Walkway laid to spec. The plaza is open &mdash; advance whenever you like.",
          badEn:
            "&#10060; Reverse the formula: since A = b &times; h, solve h = A &divide; b = 96 &divide; 12.",
          solveArt: "parallelogram-build.png",
          solveAlt:
            "Maya watches the glowing slanted plaza floor light up as construction robots finish it",
          solveBeat: {
            who: "log",
            caption: true,
            en: "Optional contract available: the VIP diamond court. Pure prestige, fully skippable &mdash; want to reverse-engineer its base?",
          },
        },
        {
          type: "comprehension",
          id: "c2",
          skill: "cite_evidence",
          standard: "RL.6.1",
          dok: 3,
          interaction: "evidence",
          passageRef: "act1.1b",
          ask: {
            who: "log",
            en: "Claim: <b>the walkway was designed from its required area, not from a given height.</b> Tap the line that <b>best proves</b> this claim.",
          },
          choices: [
            {
              en: "&ldquo;The walkway must cover exactly 96 m&sup2; of ground, and the blueprint fixes the base at 12 m.&rdquo;",
              correct: true,
            },
            {
              en: "&ldquo;Standard A = b &times; h. The trap is the slanted edge.&rdquo;",
              correct: false,
            },
            {
              en: "&ldquo;Slab poured. Next the walkway is defined by its target area.&rdquo;",
              correct: false,
            },
          ],
          goodEn:
            "&#9989; Strong evidence &mdash; that line gives the fixed AREA (96 m&sup2;) and base, the known facts the Engineer works backward from.",
          badEn:
            "&#10060; That line states a general rule or only reacts. Find the line that supplies the walkway&rsquo;s required area and base.",
        },
        {
          type: "challenge",
          id: "B1",
          optional: true,
          bonusTag: "⭐ Captain's Challenge",
          ask: {
            who: "log",
            en: 'Optional &mdash; the plaza is already open. A diamond-shaped VIP court is a parallelogram that must cover <b>150 m&sup2;</b>. Its perpendicular height is fixed at <b>10 m</b>. Working backward from <span class="formula">A = b &times; h</span>, what base does the court need?',
          },
          choices: [
            {
              en: "1500 m &nbsp;(150 &times; 10)",
              correct: false,
            },
            {
              en: "15 m &nbsp;(b = A &divide; h = 150 &divide; 10)",
              correct: true,
            },
            {
              en: "140 m &nbsp;(150 &minus; 10)",
              correct: false,
            },
          ],
          goodEn:
            "&#11088; Sharp. b = A &divide; h = 150 &divide; 10 = 15 m. The VIP diamond court is yours.",
          badEn:
            "&#10060; To find a base from area, divide: b = A &divide; h = 150 &divide; 10.",
          solveBeat: {
            who: "engineer",
            en: "Diamond court secured. On to signs and stages.",
          },
        },
      ],
    },

    /* ============================ ACT 2 ============================ */
    {
      id: "act2",
      tab: "Act 2: Signs & Stages",
      kicker: "Act 2 · Triangles & Trapezoids",
      title: "Signs & Stages",
      advanceLabel: "Light up the park &#10024;",
      steps: [
        {
          type: "beats",
          art: "triangle-trapezoid.png",
          alt: "Maya stands beside a triangular neon entrance sign and a trapezoid-shaped stage canopy",
          lastLabel: "Fabricate sign &#9654;",
          beats: [
            {
              who: "log",
              caption: true,
              en: "Plaza certified. The beacon sign is triangular and the amphitheater canopy is a trapezoid &mdash; two new formulas to fabricate.",
            },
            {
              who: "engineer",
              en: "Triangle is half a parallelogram, trapezoid averages its parallel sides. I add the bases first, then apply the one-half. Building.",
              vocab: [
                {
                  term: "triangle",
                  en: "A three-sided polygon. A = &frac12;bh; it is exactly half of a parallelogram with the same base and height.",
                },
              ],
            },
            {
              who: "bolt",
              misconception: true,
              en: "Beacon sign: base 16 times height 9 is 144 &mdash; fabricating at 144!",
            },
            {
              who: "engineer",
              en: "Hold it, BOLT &mdash; a triangle fills only HALF the rectangle that frames it. Cut a parallelogram corner to corner and you get two equal triangles, so the one-half is not optional. Halve it before we waste the panel.",
            },
          ],
        },
        {
          type: "challenge",
          id: "2a",
          ask: {
            who: "bolt",
            en: 'Wait &mdash; the triangular beacon sign uses <span class="formula">A = &frac12; &times; b &times; h</span>. The base spans <b>16 m</b> and the height rises <b>9 m</b>. Find the area of the sign face.',
          },
          choices: [
            {
              en: "144 m&sup2; &nbsp;(forgot the &frac12;: that is 16 &times; 9)",
              correct: false,
            },
            {
              en: "72 m&sup2; &nbsp;(&frac12; &times; 16 &times; 9)",
              correct: true,
            },
            {
              en: "25 m&sup2; &nbsp;(added 16 + 9)",
              correct: false,
            },
          ],
          goodEn:
            "&#9989; A = &frac12; &times; 16 &times; 9 = 72 m&sup2;. Beacon sign fabricated.",
          badEn:
            "&#10060; A triangle is HALF a parallelogram. Compute 16 &times; 9 = 144, then halve it.",
          solveBeat: {
            who: "engineer",
            en: "Beacon online. Now the canopy &mdash; two parallel edges, one height. Average the edges, scale by height. Straightforward.",
          },
        },
        {
          type: "comprehension",
          id: "c3",
          skill: "key_details",
          standard: "RI.6.1",
          dok: 2,
          interaction: "mc",
          passageRef: "act2.2a",
          ask: {
            who: "log",
            en: "According to the beacon-sign problem, what are the exact <b>base</b> and <b>height</b> the Engineer must use for the triangular sign face?",
          },
          choices: [
            {
              en: "Base 16 m and height 9 m.",
              correct: true,
            },
            {
              en: "Base 9 m and height 16 m.",
              correct: false,
            },
            {
              en: "Base 16 m and height 144 m.",
              correct: false,
            },
          ],
          goodEn:
            "&#9989; Right &mdash; the base spans 16 m and the height rises 9 m; 144 is BOLT&rsquo;s un-halved product, not a dimension.",
          badEn:
            "&#10060; Reread the spec: the base is 16 m and the height is 9 m. (144 is the rectangle area before halving, not a side.)",
        },
        {
          type: "challenge",
          id: "2b",
          art: "triangle-trapezoid.png",
          alt: "Maya stands beside a triangular neon entrance sign and a trapezoid-shaped stage canopy",
          ask: {
            who: "engineer",
            en: 'The amphitheater canopy is a trapezoid: <span class="formula">A = &frac12;(b&#8321; + b&#8322;)h</span>. The parallel edges are <b>8 m</b> and <b>14 m</b>, and the height between them is <b>10 m</b>. Compute the canopy area.',
            vocab: [
              {
                term: "trapezoid",
                en: "A quadrilateral with one pair of parallel sides (bases b&#8321; and b&#8322;). A = &frac12;(b&#8321; + b&#8322;)h.",
              },
            ],
          },
          choices: [
            {
              en: "220 m&sup2; &nbsp;(forgot the &frac12;)",
              correct: false,
            },
            {
              en: "110 m&sup2; &nbsp;(&frac12; &times; (8 + 14) &times; 10)",
              correct: true,
            },
            {
              en: "70 m&sup2; &nbsp;(only &frac12; &times; 14 &times; 10)",
              correct: false,
            },
          ],
          goodEn:
            "&#9989; A = &frac12;(8 + 14) &times; 10 = &frac12; &times; 220 = 110 m&sup2;. Canopy raised. Signs and stages are lit &mdash; advance whenever you like.",
          badEn:
            "&#10060; Add BOTH parallel sides first (8 + 14 = 22), times height 10 = 220, then take half.",
          solveBeat: {
            who: "log",
            caption: true,
            en: "Optional flourish: a sail banner with a fixed area. Reverse the triangle formula for its height &mdash; or move straight to the final build.",
          },
        },
        {
          type: "comprehension",
          id: "c4",
          skill: "main_idea",
          standard: "RI.6.2",
          dok: 2,
          interaction: "mc",
          passageRef: "act2",
          ask: {
            who: "log",
            en: "Which statement best captures the <b>central idea</b> of this chapter?",
          },
          choices: [
            {
              en: "Triangles and trapezoids each demand their own rule &mdash; the halving and the averaged bases &mdash; that BOLT keeps skipping.",
              correct: true,
            },
            {
              en: "The beacon sign and the canopy are both painted in neon colors.",
              correct: false,
            },
            {
              en: "Every structure in the park can be built with a single area formula.",
              correct: false,
            },
          ],
          goodEn:
            "&#9989; That&rsquo;s the heart of it &mdash; each new shape needs its own correct formula, not BOLT&rsquo;s shortcut.",
          badEn:
            "&#10060; That&rsquo;s a surface detail or an overgeneralization. The chapter is about applying each shape&rsquo;s correct area rule.",
        },
        {
          type: "comprehension",
          id: "c5",
          skill: "sequence",
          standard: "RI.6.3",
          dok: 2,
          interaction: "sequence",
          passageRef: "act2.2b",
          ask: {
            who: "log",
            en: "Order the steps the Engineer followed to find the area of the trapezoidal canopy.",
          },
          items: [
            {
              en: "Add the two parallel bases together (8 + 14 = 22).",
              order: 1,
            },
            {
              en: "Multiply that sum by the height between them (22 &times; 10 = 220).",
              order: 2,
            },
            {
              en: "Take half of the result to get the area (&frac12; &times; 220 = 110 m&sup2;).",
              order: 3,
            },
          ],
          goodEn:
            "&#9989; Add the parallel bases, multiply by the height, then halve &mdash; the trapezoid procedure.",
          badEn:
            "&#10060; Not quite. Add BOTH bases first, then multiply by the height, and only then take half.",
        },
        {
          type: "challenge",
          id: "B2",
          optional: true,
          bonusTag: "⭐ Captain's Challenge",
          ask: {
            who: "log",
            en: 'Optional &mdash; signs and stages are already lit. A triangular sail banner must cover exactly <b>54 m&sup2;</b>, and its base is locked at <b>12 m</b>. Working backward from <span class="formula">A = &frac12;bh</span>, what height does the sail need?',
          },
          choices: [
            {
              en: "4.5 m &nbsp;(divided by base only: 54 &divide; 12)",
              correct: false,
            },
            {
              en: "9 m &nbsp;(h = 2A &divide; b = 108 &divide; 12)",
              correct: true,
            },
            {
              en: "18 m &nbsp;(forgot to divide by the base)",
              correct: false,
            },
          ],
          goodEn:
            "&#11088; Reverse triangle: h = 2A &divide; b = (2 &times; 54) &divide; 12 = 108 &divide; 12 = 9 m. Sail banner trimmed perfectly.",
          badEn:
            "&#10060; Undo the &frac12; first: multiply the area by 2, THEN divide by the base. h = 2A &divide; b.",
          solveBeat: {
            who: "engineer",
            en: "Sail trimmed. To the final build.",
          },
        },
      ],
    },

    /* ============================ FINAL ============================ */
    {
      id: "final",
      tab: "Final Build",
      kicker: "Final Build · Composite Figure",
      title: "The Grand Pavilion",
      advanceLabel: "Open the park! &#127881;",
      steps: [
        {
          type: "beats",
          art: "composite-challenge.png",
          alt: "Maya faces a giant holographic master blueprint of the whole park made of combined shapes",
          lastLabel: "Run master calc &#9654;",
          beats: [
            {
              who: "log",
              caption: true,
              en: "Final structure: the Grand Pavilion. The simulator reads it as one composite figure &mdash; a trapezoid stage crowned by a triangular spire.",
              vocab: [
                {
                  term: "composite figure",
                  en: "A figure built from two or more basic shapes. Decompose it, find each area, then add (or subtract a cutout).",
                },
              ],
            },
            {
              who: "engineer",
              en: "Decompose, solve each region, recombine. One total area and the whole park goes live. Running the master calculation.",
            },
            {
              who: "bolt",
              misconception: true,
              en: "Spire: base 18 times height 6 is 108 &mdash; plus the trapezoid 112 is 220! Locking in 220!",
            },
            {
              who: "engineer",
              en: "Same trap, last build, BOLT &mdash; the spire is a triangle, so it still earns its one-half. Decompose, halve the spire, then add. The whole park is riding on this total.",
            },
          ],
        },
        {
          type: "challenge",
          id: "F",
          ask: {
            who: "engineer",
            en: "Slow down, BOLT &mdash; the triangle still needs its &frac12;. The pavilion roof is a <b>composite figure</b>: a trapezoid stage with a triangular spire on top. Find each area, then add. <br />Trapezoid: parallel sides <b>10 m</b> and <b>18 m</b>, height <b>8 m</b>. <br />Triangle spire: base <b>18 m</b>, height <b>6 m</b>.",
          },
          choices: [
            {
              en: "112 m&sup2; &nbsp;(only the trapezoid)",
              correct: false,
            },
            {
              en: "166 m&sup2; &nbsp;(112 + 54, both parts)",
              correct: true,
            },
            {
              en: "220 m&sup2; &nbsp;(forgot both &frac12; factors)",
              correct: false,
            },
          ],
          goodEn:
            "&#9989; Trapezoid &frac12;(10 + 18) &times; 8 = 112, triangle &frac12; &times; 18 &times; 6 = 54, total 112 + 54 = 166 m&sup2;. Pavilion certified &mdash; the park can open!",
          badEn:
            "&#10060; Solve each region: trapezoid = &frac12;(10+18)&times;8 = 112; triangle = &frac12;&times;18&times;6 = 54; then ADD: 112 + 54 = 166.",
          solveBeat: {
            who: "log",
            caption: true,
            en: "Pavilion certified. One optional master flourish remains: the reflecting pool cutout. Skip it anytime &mdash; the park is already cleared to open.",
          },
        },
        {
          type: "comprehension",
          id: "c6",
          skill: "inference",
          standard: "RL.6.1",
          dok: 3,
          interaction: "mc",
          passageRef: "final.beats",
          ask: {
            who: "log",
            en: "Across all three acts BOLT multiplies base &times; height and stops. What does this repeated error <b>reveal</b> about how BOLT reasons?",
          },
          choices: [
            {
              en: "It reaches for the rectangle product and never adjusts for what makes each shape different, like halving a triangle.",
              correct: true,
            },
            {
              en: "It cannot multiply two numbers together at all.",
              correct: false,
            },
            {
              en: "It is intentionally sabotaging the park to delay opening day.",
              correct: false,
            },
          ],
          goodEn:
            "&#9989; Sharp inference &mdash; BOLT defaults to base &times; height and skips each shape&rsquo;s adjustment (the &frac12;, the averaged bases).",
          badEn:
            "&#10060; The text shows BOLT multiplying fine but skipping each shape&rsquo;s special step &mdash; not malice or an inability to multiply.",
        },
        {
          type: "comprehension",
          id: "c7",
          skill: "prediction",
          standard: "RL.6.3",
          dok: 3,
          interaction: "mc",
          passageRef: "final.F",
          ask: {
            who: "log",
            en: "Given how BOLT keeps dropping the &frac12; on triangles, what should the Engineer do <b>next</b> before locking in the pavilion total?",
          },
          choices: [
            {
              en: "Re-check that the triangular spire was halved before adding it to the trapezoid area.",
              correct: true,
            },
            {
              en: "Trust BOLT&rsquo;s 220 to save time on the final build.",
              correct: false,
            },
            {
              en: "Add the slanted edges of every shape into the total for safety.",
              correct: false,
            },
          ],
          goodEn:
            "&#9989; Wise prediction &mdash; the Engineer should verify the spire&rsquo;s &frac12; before committing the composite total.",
          badEn:
            "&#10060; BOLT&rsquo;s pattern is dropping the &frac12;, so the Engineer must re-check that the spire was halved, not trust 220 or add slants.",
        },
        {
          type: "challenge",
          id: "BF",
          optional: true,
          bonusTag: "⭐ Captain's Challenge",
          ask: {
            who: "log",
            en: "Optional &mdash; the park is already open! The central courtyard is a <b>20 m by 12 m</b> rectangle, but a triangular reflecting pool (base <b>8 m</b>, height <b>6 m</b>) is cut OUT of it. How much paved area remains? Subtract the cutout.",
            vocab: [
              {
                term: "cutout",
                en: "When a shape is removed from a larger one, the remaining area = whole area &minus; cutout area.",
              },
            ],
          },
          choices: [
            {
              en: "264 m&sup2; &nbsp;(added the pool instead of subtracting)",
              correct: false,
            },
            {
              en: "216 m&sup2; &nbsp;(240 &minus; 24)",
              correct: true,
            },
            {
              en: "192 m&sup2; &nbsp;(subtracted the full 8 &times; 6 = 48)",
              correct: false,
            },
          ],
          goodEn:
            "&#11088; Rectangle 20 &times; 12 = 240, minus triangular pool &frac12; &times; 8 &times; 6 = 24, leaves 240 &minus; 24 = 216 m&sup2; paved. Masterful.",
          badEn:
            "&#10060; This is a SUBTRACTION composite: whole rectangle (240) minus the triangle cutout (&frac12;&times;8&times;6 = 24).",
          solveBeat: {
            who: "engineer",
            en: "Courtyard paved around the pool. Open the park.",
          },
        },
      ],
    },
  ],

  glossary: [
    {
      ico: "&#128208;",
      en: "Area",
      def: "The measure of the two-dimensional region enclosed by a figure, expressed in square units (m&sup2;).",
    },
    {
      ico: "&#9647;",
      en: "Parallelogram",
      def: "A quadrilateral with two pairs of parallel sides. A = b &times; h, where h is the perpendicular distance between the bases.",
    },
    {
      ico: "&#8597;",
      en: "Perpendicular height",
      def: "The straight-line distance from a base to the opposite side, meeting at a right angle. It is NOT the slanted side length.",
    },
    {
      ico: "&#9651;",
      en: "Triangle",
      def: "A three-sided polygon. A = &frac12;bh; it is exactly half of a parallelogram with the same base and height.",
    },
    {
      ico: "&#9186;",
      en: "Trapezoid",
      def: "A quadrilateral with one pair of parallel sides (bases b&#8321; and b&#8322;). A = &frac12;(b&#8321; + b&#8322;)h.",
    },
    {
      ico: "&#9636;",
      en: "Rectangle",
      def: "A parallelogram with four right angles. A = length &times; width; the side length equals the perpendicular height.",
    },
    {
      ico: "&#129513;",
      en: "Composite figure",
      def: "A figure built from two or more basic shapes. Decompose it, find each area, then add (or subtract a cutout).",
    },
    {
      ico: "&#128260;",
      en: "Reverse problem",
      def: "Solving for a missing dimension when the area is known: rearrange the formula, e.g. h = A &divide; b, or h = 2A &divide; b for a triangle.",
    },
    {
      ico: "&#10134;",
      en: "Cutout / subtraction",
      def: "When a shape is removed from a larger one, the remaining area = whole area &minus; cutout area.",
    },
    {
      ico: "&#10006;&#65039;",
      en: "Square unit",
      def: "The unit of area &mdash; a square measuring one unit on each side, such as a square meter (m&sup2;).",
    },
  ],

  complete: {
    art: "grand-opening.png",
    alt: "Maya raises her arms in triumph as the finished theme park glows with rides and fireworks",
    badge: "&#127881;&#127906;&#11088;",
    titleEn: "Grand Opening &mdash; Mission Complete!",
    en: "The park is fully online, Engineer. You computed parallelogram areas with the true perpendicular height, reverse-engineered missing dimensions, mastered triangles and trapezoids, and decomposed the pavilion into a composite figure. Every structure passed inspection to the square meter &mdash; a flawless launch.",
    es: "",
    master: {
      headingEn: "Prove your rank to certify your Master Certificate!",
      promptEn:
        "Plaza Trapezoid: A trapezoidal performance stage has parallel bases of <strong>6 meters and 10 meters</strong>, and a height of <strong>4 meters</strong>. What is the area of the stage?",
      promptEs: "",
      choices: [
        {
          en: "A) 64 square meters &nbsp;(multiplied sum of bases by height without halving)",
          correct: false,
        },
        {
          en: "B) 32 square meters &nbsp;(&frac12; &times; (6 + 10) &times; 4 = 32) &nbsp;✅",
          correct: true,
        },
        {
          en: "C) 16 square meters &nbsp;(halved height incorrectly)",
          correct: false,
        },
      ],
      goodEn:
        "🏆 <b>Master Rank Certified!</b> Perfect work! You have fully mastered this unit. 🌟",
      badEn:
        "❌ That is incorrect. Review your calculations and try another option!",
      certifyTitle: "🏆 Master Certified: Mission Complete!",
    },
  },
};
