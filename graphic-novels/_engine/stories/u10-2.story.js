/* STORY · Unit 10 · Graphic Novel #2 (Enrichment) · Aquarium Architect
   Full novel on the comic engine. Enrichment tier: harder numbers, fractional
   edges, composite prisms, optional "Architect's Bonus" rounds (non-gating,
   still scored), English-only (source has no Spanish), 10-term codex.
   All math/answers/distractors/glossary carried verbatim from
   graphic-novels/unit10/graphic-novel-2.html (6.G.2).
   New: panels, speech, CORAL-voices-the-misconception, vocab pop-ups. */
window.GN_STORY = {
  meta: {
    unit: 10,
    version: 2,
    level: "Enrichment",
    title: "Aquarium Architect 🐠🌊",
    standard: "6.G.2",
    assessment: "Graphic Novel U10 #2: Aquarium Architect",
    artBase: "../_art/unit10/",
    home: "../index.html",
  },

  cast: {
    architect: {
      name: "The Architect",
      role: "protagonist",
      color: "#ff8a3d",
      tagIcon: "👷",
      avatar: null,
      blurb: "You",
    },
    coral: {
      name: "CORAL",
      role: "companion",
      color: "#3da5ff",
      tagIcon: "🐟",
      avatar: null,
      blurb: "Design AI · adds faces instead of multiplying for volume",
    },
    log: { name: "City Liaison", role: "narrator", color: "#3da5ff" },
  },

  cover: {
    art: "cover.png",
    alt: "Maya, a young aquarium architect, stands in a grand aquarium with glowing fish tanks and floating blueprints",
    blurbEn:
      "The city has commissioned a landmark aquarium, and you, Maya, are the lead architect. Every exhibit stays sealed until you certify it: the exact <b>volume</b> of water it holds (even with fractional edge lengths) and the precise <b>surface area</b> of glass — computed from a <b>net</b> — needed to enclose it. Get the engineering right and the tanks come alive. CORAL, your design AI, keeps confusing area with volume… so check every number.",
    blurbEs: "",
    startLabel: "Begin Commission 🚀",
  },

  acts: [
    /* ============================ ACT 1 ============================ */
    {
      id: "act1",
      tab: "Act 1: Volume by Design",
      kicker: "Act 1 · Volume of Prisms",
      title: "Volume by Design",
      advanceLabel: "Flood the exhibits 🐠",
      steps: [
        {
          type: "beats",
          art: "volume.png",
          alt: "Maya points at a glowing wireframe rectangular tank with dimension arrows",
          lastLabel: "Certify volume ▶",
          beats: [
            {
              who: "log",
              caption: true,
              en: "Maya, the commission is yours. No exhibit goes live until you certify its volume to the cubic foot — fractional edges and all.",
            },
            {
              who: "architect",
              en: "Understood. Volume is length × width × height — and a fractional edge is no excuse to round. I multiply the exact values.",
              vocab: [
                {
                  term: "fractional edge",
                  en: "An edge measured by a fraction or mixed number. Multiply exactly: 3½ × 2 × 4 = 7/2 × 8 = 28.",
                },
              ],
            },
            {
              who: "coral",
              misconception: true,
              en: "The mangrove pool is 3½, 2, and 4 — that's awkward, so I'll round 3½ up to 4: volume = 32 ft³.",
            },
          ],
        },
        {
          type: "challenge",
          id: "1a",
          ask: {
            who: "coral",
            en: "Stop me — don't round! The mangrove pool measures <b>3½ ft</b> long, <b>2 ft</b> wide, and <b>4 ft</b> deep. Certify its volume using V = l × w × h.",
          },
          choices: [
            {
              en: "32 ft³ &nbsp;(rounded 3½ up to 4 — don't round)",
              correct: false,
            },
            {
              en: "24 ft³ &nbsp;(used 3 for the length, dropping the ½)",
              correct: false,
            },
            {
              en: "28 ft³ &nbsp;(3½ × 2 × 4 = 7/2 × 8 = 28)",
              correct: true,
            },
          ],
          goodEn:
            "✅ Exact. 3½ × 2 × 4 = 7/2 × 8 = 28 ft³. Mangrove pool certified.",
          badEn:
            "❌ Keep the fraction. 3½ = 7/2; multiply, don't round: 7/2 × 2 × 4 = 28.",
          solveBeat: {
            who: "architect",
            en: "Mangrove pool certified. The jewel display has two fractional edges — I'll multiply the fractions carefully before simplifying.",
          },
        },
        {
          type: "challenge",
          id: "1b",
          ask: {
            who: "architect",
            en: "A compact display measures <b>2½ ft</b> × <b>1½ ft</b> × <b>2 ft</b>. Two edges are fractional. Find the exact volume. Volume = l × w × h. Multiply the fractions exactly — do not round.",
          },
          choices: [
            {
              en: "7½ ft³ &nbsp;(5/2 × 3/2 × 2 = 15/4 × 2 = 30/4 = 7½)",
              correct: true,
            },
            {
              en: "6 ft³ &nbsp;(used 2 × 1 × 2, dropping both fractions)",
              correct: false,
            },
            {
              en: "15 ft³ &nbsp;(forgot to keep the /4 from 5/2 × 3/2)",
              correct: false,
            },
          ],
          goodEn:
            "✅ 5/2 × 3/2 × 2 = 15/4 × 2 = 30/4 = 7½ ft³. Both exhibits certified! (The bonus below is optional.)",
          badEn:
            "❌ Multiply the fractions first: 5/2 × 3/2 = 15/4, then × 2 = 30/4 = 7½.",
          solveArt: "unlock.png",
          solveAlt:
            "The tank fills with sparkling water and colorful fish as Maya cheers",
          solveBeat: {
            who: "architect",
            en: "Both exhibits flooded. A donor wants a reef tank of an exact volume — time to reverse the formula.",
          },
        },
        {
          type: "challenge",
          id: "B1",
          optional: true,
          bonusTag: "⭐ Captain's Challenge",
          ask: {
            who: "log",
            en: "Optional: a donor wants a reef tank of an EXACT volume on a fixed footprint. Reverse the formula if you're up for it — entirely your call. A reef tank must hold exactly <b>90 ft³</b> of water. Its base footprint is fixed at <b>5 ft × 6 ft</b>. What height does the tank need? (Reverse the volume formula.)",
            vocab: [
              {
                term: "Reverse",
                en: "Working backward from a known volume to find a missing dimension: e.g., h = V ÷ (base area).",
              },
            ],
          },
          choices: [
            {
              en: "6 ft &nbsp;(90 ÷ 6 ignores the other base edge)",
              correct: false,
            },
            {
              en: "3 ft &nbsp;(base area = 5 × 6 = 30; h = 90 ÷ 30 = 3)",
              correct: true,
            },
            {
              en: "15 ft &nbsp;(90 ÷ 6 = 15 uses only one edge)",
              correct: false,
            },
          ],
          goodEn:
            "⭐ Sharp. Base area = 5 × 6 = 30 ft²; height = 90 ÷ 30 = 3 ft. Donor tank designed.",
          badEn:
            "❌ Use the WHOLE base: divide the volume by base area (5×6=30), not by a single edge.",
          solveBeat: {
            who: "architect",
            en: "Donor tank designed. On to the glass.",
          },
        },
      ],
    },

    /* ============================ ACT 2 ============================ */
    {
      id: "act2",
      tab: "Act 2: Glass & Nets",
      kicker: "Act 2 · Surface Area from Nets",
      title: "Glass & Nets",
      advanceLabel: "Install the glass 🧊",
      steps: [
        {
          type: "beats",
          art: "net.png",
          alt: "Maya unfolds a glass tank into a flat net of six rectangle panels",
          lastLabel: "Total the faces ▶",
          beats: [
            {
              who: "log",
              caption: true,
              en: "Volumes signed off. Now the glaziers need exact glass. Unfold each tank into its net and total every face.",
            },
            {
              who: "architect",
              en: "Surface area, not volume. I'll lay each prism flat as a net, find the area of all six faces, and sum them.",
              vocab: [
                {
                  term: "net",
                  en: "A two-dimensional pattern that folds into a solid, displaying every face laid flat — ideal for surface area.",
                },
              ],
            },
            {
              who: "coral",
              misconception: true,
              en: "The kelp tank is 6 × 4 × 3 — I'll just total one of each face: 24 + 18 + 12 = 72 ft² of glass.",
            },
          ],
        },
        {
          type: "challenge",
          id: "2a",
          ask: {
            who: "coral",
            en: "Catch me — each face has a matching pair! Unfold the kelp-forest tank (<b>6 ft × 4 ft × 3 ft</b>) into a net and sum the six face areas to order the glass. Surface area = sum of all 6 faces = 2(lw + lh + wh).",
            vocab: [
              {
                term: "Surface area",
                en: "The sum of the areas of all faces. For a box: SA = 2(lw + lh + wh), in square units (ft²).",
              },
            ],
          },
          choices: [
            {
              en: "72 ft² &nbsp;(24+18+12 — counted only one of each pair)",
              correct: false,
            },
            {
              en: "108 ft² &nbsp;(2(6×4) + 2(6×3) + 2(4×3) = 48+36+24)",
              correct: true,
            },
            {
              en: "72 ft³ &nbsp;(that is the volume, and wrong units)",
              correct: false,
            },
          ],
          goodEn:
            "✅ SA = 2(6×4) + 2(6×3) + 2(4×3) = 48+36+24 = 108 ft². Kelp tank glazed.",
          badEn:
            "❌ Each face has a matching pair. Double every distinct face: 2(24)+2(18)+2(12) = 108.",
          solveBeat: {
            who: "architect",
            en: "Kelp tank glazed. The gallery is a longer prism — same method, new dimensions. Order placed.",
          },
        },
        {
          type: "challenge",
          id: "2b",
          ask: {
            who: "architect",
            en: "The walk-through gallery tank is <b>8 ft × 3 ft × 2 ft</b>. Compute its surface area to finish the glass order. Surface area = 2(lw + lh + wh), in square feet (ft²).",
          },
          choices: [
            {
              en: "92 ft² &nbsp;(2(8×3) + 2(8×2) + 2(3×2) = 48+32+12)",
              correct: true,
            },
            {
              en: "46 ft² &nbsp;(24+16+6 — only one of each face)",
              correct: false,
            },
            {
              en: "48 ft³ &nbsp;(that is the volume, not surface area)",
              correct: false,
            },
          ],
          goodEn:
            "✅ SA = 2(8×3) + 2(8×2) + 2(3×2) = 48+32+12 = 92 ft². Glass order complete! (Bonus below is optional.)",
          badEn:
            "❌ Sum all six faces: 2(24)+2(16)+2(6) = 92 ft². Don't confuse it with volume.",
          solveBeat: {
            who: "architect",
            en: "Gallery glazed. An L-shaped touch pool is next — two fused prisms with a hidden shared face.",
          },
        },
        {
          type: "challenge",
          id: "B2",
          optional: true,
          bonusTag: "⭐ Captain's Challenge",
          ask: {
            who: "log",
            en: "Optional design flourish: an L-shaped touch pool made of two fused prisms. Remember the shared face is hidden on both. Try it if you like. A touch pool is built by fusing two prisms: a main tank <b>4 × 4 × 3 ft</b> and a viewing nook <b>2 × 2 × 3 ft</b>, joined on a shared <b>2 ft × 3 ft</b> face (so that face is hidden on BOTH prisms). What is the surface area of the composite tank?",
            vocab: [
              {
                term: "composite",
                en: "A figure made of two or more prisms. Its surface area is the sum of the parts MINUS the shared (hidden) faces.",
              },
            ],
          },
          choices: [
            {
              en: "112 ft² &nbsp;(80 + 32 — forgot to remove the hidden faces)",
              correct: false,
            },
            {
              en: "100 ft² &nbsp;(80 + 32 − 2(2×3) = 112 − 12)",
              correct: true,
            },
            {
              en: "106 ft² &nbsp;(only removed ONE shared face, not both)",
              correct: false,
            },
          ],
          goodEn:
            "⭐ Main 2(16+12+12)=80; nook 2(4+6+6)=32; remove BOTH hidden 2×3 faces: 80+32−12 = 100 ft².",
          badEn:
            "❌ The shared face is hidden on each prism, so subtract it TWICE: 80 + 32 − 2(6) = 100.",
          solveBeat: {
            who: "architect",
            en: "Touch pool fused and glazed. The Grand Ocean Hall awaits.",
          },
        },
      ],
    },

    /* ============================ FINAL ============================ */
    {
      id: "final",
      tab: "Final Build",
      kicker: "Final Build · Boss",
      title: "The Grand Ocean Hall",
      advanceLabel: "Open the aquarium 🎉",
      steps: [
        {
          type: "beats",
          art: "final.png",
          alt: "Maya stands before a huge aquarium tank under construction with scaffolding and blueprints",
          lastLabel: "Certify the hall ▶",
          beats: [
            {
              who: "log",
              caption: true,
              en: "The Grand Ocean Hall awaits final certification — one line stating both the water volume AND the glass surface area.",
            },
            {
              who: "architect",
              en: "Both quantities, no errors. Volume multiplies the three edges; surface area sums the six faces. Signing off.",
            },
            {
              who: "coral",
              misconception: true,
              en: "Starting the sign-off: volume and surface area are interchangeable, so V = 122 ft³ and SA = 84 ft² — done!",
            },
          ],
        },
        {
          type: "challenge",
          id: "F",
          ask: {
            who: "architect",
            en: "Don't swap them, CORAL. The centerpiece tank is <b>7 ft × 4 ft × 3 ft</b>. Final sign-off requires BOTH the water volume and the glass surface area on one line. Choose the fully correct certification. Volume = l × w × h (ft³). Surface area = 2(lw + lh + wh) (ft²).",
          },
          choices: [
            {
              en: "V = 84 ft³, SA = 61 ft² &nbsp;(SA only counted one of each face)",
              correct: false,
            },
            {
              en: "V = 84 ft³, SA = 122 ft² &nbsp;(V = 7×4×3; SA = 2(28+21+12) = 2(61))",
              correct: true,
            },
            {
              en: "V = 122 ft³, SA = 84 ft² &nbsp;(swapped volume and surface area)",
              correct: false,
            },
          ],
          goodEn:
            "✅ V = 7×4×3 = 84 ft³; SA = 2(28+21+12) = 2(61) = 122 ft². Grand Ocean Hall certified! (Final bonus below is optional.)",
          badEn:
            "❌ Volume multiplies the three edges (84). Surface area sums the six faces: 2(28+21+12)=122. Don't swap them.",
          solveBeat: {
            who: "architect",
            en: "Grand Ocean Hall certified. One overflow reservoir left to reverse-engineer.",
          },
        },
        {
          type: "challenge",
          id: "BF",
          optional: true,
          bonusTag: "⭐ Captain's Final Challenge",
          ask: {
            who: "log",
            en: "Optional: the hall is already certified; this is just for the trophy. Skip anytime. Behind the hall, an overflow reservoir must hold exactly <b>96 ft³</b>. Its footprint is fixed at <b>6 ft × 4 ft</b>. What height makes it hold exactly 96 ft³?",
          },
          choices: [
            {
              en: "4 ft &nbsp;(base = 6×4 = 24; h = 96 ÷ 24 = 4)",
              correct: true,
            },
            {
              en: "16 ft &nbsp;(96 ÷ 6 uses only one base edge)",
              correct: false,
            },
            {
              en: "3 ft &nbsp;(6×4×3 = 72, not 96)",
              correct: false,
            },
          ],
          goodEn:
            "⭐ Base = 6×4 = 24 ft²; height = 96 ÷ 24 = 4 ft. Reservoir designed. Trophy earned!",
          badEn:
            "❌ Divide the volume by the FULL base area (6×4=24): 96 ÷ 24 = 4 ft.",
          solveBeat: {
            who: "architect",
            en: "Reservoir designed. The aquarium is ready for its grand opening.",
          },
        },
      ],
    },
  ],

  glossary: [
    {
      ico: "📦",
      en: "Rectangular prism",
      def: "A solid with six rectangular faces and three pairs of congruent faces; modeled here as a fish tank.",
    },
    {
      ico: "💧",
      en: "Volume",
      def: "The space a solid occupies. For a rectangular prism, V = l × w × h, in cubic units (ft³).",
    },
    {
      ico: "½",
      en: "Fractional edge length",
      def: "An edge measured by a fraction or mixed number. Multiply exactly: 3½ × 2 × 4 = 7/2 × 8 = 28.",
    },
    {
      ico: "🧊",
      en: "Net",
      def: "A two-dimensional pattern that folds into a solid, displaying every face laid flat — ideal for surface area.",
    },
    {
      ico: "⬜",
      en: "Face",
      def: "A flat polygon surface of a solid. A rectangular prism has 6 faces in 3 congruent pairs.",
    },
    {
      ico: "🧊",
      en: "Surface area",
      def: "The sum of the areas of all faces. For a box: SA = 2(lw + lh + wh), in square units (ft²).",
    },
    {
      ico: "🤗",
      en: "Composite solid",
      def: "A figure made of two or more prisms. Its surface area is the sum of the parts MINUS the shared (hidden) faces.",
    },
    {
      ico: "🔄",
      en: "Reverse problem",
      def: "Working backward from a known volume to find a missing dimension: e.g., h = V ÷ (base area).",
    },
    {
      ico: "📐",
      en: "Base area",
      def: "The area of a prism's base (l × w). Volume equals base area × height, so height = V ÷ base area.",
    },
    {
      ico: "➕",
      en: "Cubic vs. square units",
      def: "Volume is measured in cubic units (ft³); surface area is measured in square units (ft²).",
    },
  ],

  complete: {
    art: "complete.png",
    alt: "Maya cuts a ribbon at the grand opening of her finished aquarium full of fish and visitors",
    badge: "🎉🐠⭐",
    titleEn: "Grand Opening — Commission Complete!",
    en: "The landmark aquarium is open, Architect. You certified every exhibit — computing exact <b>volumes</b> with fractional edge lengths and deriving <b>surface areas</b> from nets, including a composite tank — and reverse-engineered the dimensions of two reservoirs. The city has named the Ocean Hall in your honor, Maya.",
    es: "",
    master: {
      headingEn: "Prove your rank to certify your Master Certificate!",
      promptEn:
        "Surface Area: A cubical touch pool reservoir has a side length of <strong>3 feet</strong>. Find the total <strong>surface area</strong> of the closed reservoir net.",
      promptEs: "",
      choices: [
        {
          en: "A) 27 square feet &nbsp;(this is the volume, not surface area)",
          correct: false,
        },
        {
          en: "B) 54 square feet &nbsp;(6 faces × (3²) = 54) &nbsp;✅",
          correct: true,
        },
        {
          en: "C) 36 square feet &nbsp;(calculated 4 faces instead of 6)",
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
