/* STORY · Unit 1 · Graphic Novel #2 (Enrichment) · Prime Station: The Factor Code
   Full novel on the comic engine. Enrichment tier: harder numbers, optional
   "Captain's Challenge" bonus rounds (non-gating, still scored), English-only
   (source has no Spanish), 11-term codex. All math/answers/distractors/glossary
   carried verbatim from graphic-novels/unit1/graphic-novel-2.html (6.NS.4).
   New: panels, speech, AXIS-voices-the-misconception, vocab pop-ups.
   Literacy layer (SP1): 7 English-only comprehension steps (c1–c7) +
   meta.readingStandard. All math/answers/glossary unchanged. */
window.GN_STORY = {
  meta: {
    unit: 1,
    version: 2,
    level: "Enrichment",
    title: "Prime Station: The Factor Code",
    standard: "6.NS.4",
    readingStandard: "RL.6.1",
    assessment: "Graphic Novel U1 #2: Prime Station: The Factor Code",
    artBase: "../_art/unit1/",
    home: "../index.html",
  },

  cast: {
    cadet: {
      name: "Cadet",
      role: "protagonist",
      color: "#ff8a3d",
      tagIcon: "🧑‍🚀",
      avatar: null,
      blurb: "You",
    },
    axis: {
      name: "AXIS",
      role: "companion",
      color: "#3da5ff",
      tagIcon: "🤖",
      avatar: null,
      blurb: "Station AI · grabs the highest powers",
    },
    log: { name: "Station AI", role: "narrator", color: "#3da5ff" },
  },

  cover: {
    art: "cover.png",
    alt: "A young space cadet on a station bridge surrounded by glowing holographic factor trees",
    blurbEn:
      "Orbital Station Kepler-9 is crippled and adrift. Every critical system is sealed behind <b>factor-encrypted</b> bulkheads. As the cadet on duty, only your command of <b>prime factorization</b> and the <b>greatest common factor</b> can bring the station back online — before life support fails. AXIS will help… but it keeps grabbing the wrong powers.",
    startLabel: "Begin Mission 🚀",
  },

  acts: [
    /* ============================ ACT 1 ============================ */
    {
      id: "act1",
      tab: "Act 1: The Locked Bay",
      kicker: "Act 1 · Lesson 1-1",
      title: "The Locked Bay",
      advanceLabel: "Breach the bay 🚀",
      steps: [
        {
          type: "beats",
          art: "airlock-locked.png",
          alt: "The cadet faces a locked airlock with a glowing orange code panel",
          lastLabel: "Check AXIS ▶",
          beats: [
            {
              who: "log",
              caption: true,
              en: "Cadet, hull integrity is failing. Each bay is sealed behind a factor-encrypted cylinder. Decrypt or we lose the deck.",
            },
            {
              who: "cadet",
              en: "Then I decompose every code into its prime factors. No composite gets past me. Patch me into the cylinder.",
              vocab: [
                {
                  term: "prime factors",
                  en: "The prime numbers that multiply to give a number. The prime factorization of 72 is 2³ × 3².",
                  es: "Los números primos que se multiplican para formar un número. 72 = 2³ × 3².",
                },
              ],
            },
            {
              who: "axis",
              misconception: true,
              en: "I've decrypted it: 72 = 2³ × 3. Sending the key!",
            },
            {
              who: "cadet",
              en: "Belay that, AXIS — a half-finished factorization is worse than none. One missing prime and the cylinder rejects us. Let me verify it properly before we transmit.",
            },
          ],
        },
        {
          type: "challenge",
          id: "1a",
          bonusTag: null,
          ask: {
            who: "cadet",
            en: "Hold AXIS back — that's short a factor. Give the <b>complete prime factorization of 72</b>, with exponents. 72 = ?",
          },
          choices: [
            {
              en: "72 = 2³ × 3",
              tree: "(missing a factor of 3)",
              correct: false,
            },
            {
              en: "72 = 2³ × 3²",
              tree: "(8 × 9 = 72)",
              correct: true,
            },
            {
              en: "72 = 2² × 3³",
              tree: "(4 × 27 = 108)",
              correct: false,
            },
          ],
          goodEn:
            "✅ Correct! 72 = 2³ × 3² = 8 × 9. Every factor is prime and the exponents are complete. Cylinder open.",
          badEn:
            "❌ That product doesn't equal 72 with only primes. Recount the powers of 2 and 3.",
          solveArt: "airlock-open.png",
          solveAlt: "The encryption cylinder unlocks with golden light",
          solveBeat: {
            who: "cadet",
            en: "Key accepted. Now the bulkhead wants a full factor tree — reduced all the way to primes. Building it.",
          },
        },
        {
          type: "comprehension",
          id: "c1",
          skill: "vocab_in_context",
          standard: "RI.6.4",
          dok: 2,
          interaction: "mc",
          passageRef: "act1.beat2",
          ask: {
            who: "log",
            en: "When the Cadet vows to <b>decompose</b> every code, the word <b>decompose</b> most nearly means to —",
          },
          choices: [
            {
              en: "break the number apart into a product of its prime factors.",
              correct: true,
            },
            {
              en: "scramble the number so the lock can no longer read it.",
              correct: false,
            },
            {
              en: "round the number to the nearest power of ten.",
              correct: false,
            },
          ],
          goodEn:
            "✅ Precisely. To <i>decompose</i> is to take apart — here, to break a number into the primes that multiply to make it.",
          badEn:
            "❌ In this context, <i>decompose</i> means to break the number down into its prime factors, not to scramble or round it.",
        },
        {
          type: "challenge",
          id: "1b",
          art: "factor-tree.png",
          alt: "A holographic factor tree for 120 branches above the open bay",
          ask: {
            who: "cadet",
            en: "Open the bay by choosing the <b>fully reduced</b> factor tree for <b>120</b> — every leaf must be prime.",
          },
          choices: [
            {
              en: "A) 120 = 2³ × 3 × 5",
              tree: "120 = 8 × 15 = (2 × 2 × 2) × (3 × 5) — every end is prime ✅",
              correct: true,
            },
            {
              en: "B) 120 = 2 × 60",
              tree: "120 = 2 × 60, but 60 is not broken down into primes",
              correct: false,
            },
            {
              en: "C) 120 = 4 × 5 × 6",
              tree: "120 = 4 × 5 × 6, but 4 and 6 are not prime",
              correct: false,
            },
          ],
          goodEn:
            "✅ Fully reduced! 120 = 2³ × 3 × 5. Every leaf is prime. BAY OPEN!",
          badEn:
            "❌ That tree still has a composite leaf. Keep splitting until every end is prime.",
          solveArt: "airlock-open.png",
          solveAlt: "The bulkhead slides open, the bay restored",
          solveBeat: {
            who: "cadet",
            en: "Bay breached. Systems coming back online.",
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
            en: "Claim: <b>a factor tree is accepted only when it is finished, not merely started.</b> Tap the line that <b>best proves</b> this claim.",
          },
          choices: [
            {
              en: "“Open the bay by choosing the fully reduced factor tree for 120 — every leaf must be prime.”",
              correct: true,
            },
            {
              en: "“A holographic factor tree for 120 branches above the open bay.”",
              correct: false,
            },
            {
              en: "“Bay breached. Systems coming back online.”",
              correct: false,
            },
          ],
          goodEn:
            "✅ Strong evidence — that line states the exact rule the bay enforces: the tree must be fully reduced, with every leaf prime.",
          badEn:
            "❌ That line only sets the scene or reacts afterward. Find the line that states the rule the tree itself must satisfy.",
        },
        {
          type: "challenge",
          id: "B1",
          optional: true,
          bonusTag: "⭐ Captain's Challenge",
          ask: {
            who: "log",
            en: "Optional: the captain's cache is nearby. Its lock only yields to a <b>perfect square</b> — every prime appears an even number of times. Care to try?",
          },
          choices: [
            {
              en: "200 = 2³ × 5²",
              tree: "(2 appears 3 times — odd)",
              correct: false,
            },
            {
              en: "324 = 2² × 3⁴",
              tree: "(all even powers → 18²)",
              correct: true,
            },
            {
              en: "150 = 2 × 3 × 5²",
              tree: "(2 and 3 appear once)",
              correct: false,
            },
          ],
          goodEn:
            "✅ 324 = 2² × 3⁴ = 18². All even exponents → a perfect square. Captain's cache unlocked!",
          badEn:
            "❌ Check the exponents — a perfect square needs every prime to an EVEN power.",
          solveBeat: {
            who: "cadet",
            en: "Cache secured. On to the engines.",
          },
        },
      ],
    },

    /* ============================ ACT 2 ============================ */
    {
      id: "act2",
      tab: "Act 2: The Twin Engines",
      kicker: "Act 2 · Lesson 1-2",
      title: "The Twin Engines",
      advanceLabel: "Engage the sync ⚡",
      steps: [
        {
          type: "beats",
          art: "twin-engines.png",
          alt: "The cadet stands between two glowing starship engines",
          lastLabel: "Check AXIS ▶",
          beats: [
            {
              who: "log",
              caption: true,
              en: "Bay clear. Critical fault: the twin drives are running at different draws and will tear the mounts apart unless you harmonize them.",
            },
            {
              who: "cadet",
              en: "Factor both draws, take the shared primes at their lowest powers — that's the GCF. That's our sync frequency.",
              vocab: [
                {
                  term: "GCF",
                  en: "Greatest Common Factor — multiply each shared prime raised to its LOWEST power. GCF(48,72) = 2³ × 3 = 24.",
                  es: "Máximo Factor Común — cada primo compartido a su MENOR potencia.",
                },
              ],
            },
            {
              who: "axis",
              misconception: true,
              en: "48 = 2⁴ × 3, 72 = 2³ × 3². Take the highest powers: 2⁴ × 3² = 144. That's the sync!",
            },
            {
              who: "log",
              caption: true,
              en: "Warning: a frequency set too high will overdrive the mounts. The sync must be the GREATEST factor the drives truly share — no more, no less.",
            },
          ],
        },
        {
          type: "challenge",
          id: "2a",
          ask: {
            who: "cadet",
            en: "Stop, AXIS — highest powers give the LCM, not the GCF. Sync them: take the <b>lowest power</b> of each shared prime. 48 = 2⁴×3, 72 = 2³×3². GCF = ?",
          },
          choices: [
            {
              en: "2⁴ × 3² = 144",
              tree: "(took highest powers — that's the LCM)",
              correct: false,
            },
            {
              en: "2³ × 3 = 24",
              tree: "(lowest power of each shared prime)",
              correct: true,
            },
            { en: "2 × 3 = 6", tree: "(not the greatest)", correct: false },
          ],
          goodEn:
            "✅ GCF(48,72) = 2³ × 3 = 24 — lowest power of each shared prime. Drives harmonized!",
          badEn:
            "❌ For the GCF, take the LOWEST power of each shared prime (highest powers give the LCM).",
          solveBeat: {
            who: "cadet",
            en: "Drives harmonized. Now I split the remaining supplies into identical kits with nothing wasted — another GCF problem.",
          },
        },
        {
          type: "comprehension",
          id: "c3",
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
              en: "Matching the drives means finding the greatest factor they share, not the largest powers AXIS can grab.",
              correct: true,
            },
            {
              en: "The station's engines are painted two different colors.",
              correct: false,
            },
            {
              en: "AXIS is the only crew member who can repair the mounts.",
              correct: false,
            },
          ],
          goodEn:
            "✅ That's the heart of it — harmonizing the drives depends on the GREATEST shared factor, the GCF.",
          badEn:
            "❌ That's a minor or invented detail. The central idea is about syncing the drives by their greatest shared factor.",
        },
        {
          type: "challenge",
          id: "2b",
          art: "common-factor.png",
          alt: "Crates of 54 oxygen cells and 90 ration packs glow between the engines",
          ask: {
            who: "cadet",
            en: "You have <b>54</b> oxygen cells and <b>90</b> ration packs. To stock identical kits with nothing left over, how many kits — and what's in each?",
          },
          choices: [
            {
              en: "18 kits — GCF(54,90)=18, so 3 cells & 5 packs each",
              correct: true,
            },
            {
              en: "9 kits — uses a common factor, but not the greatest",
              correct: false,
            },
            {
              en: "6 kits — 6 divides both, but larger kits are possible",
              correct: false,
            },
          ],
          goodEn:
            "✅ GCF(54,90) = 18 → 18 identical kits, each with 3 cells and 5 packs, nothing wasted. ENGINES SYNCED!",
          badEn:
            "❌ That's a common factor but not the GREATEST — bigger identical kits are still possible.",
          solveBeat: {
            who: "cadet",
            en: "Supplies kitted and even. The Master Door is next.",
          },
        },
        {
          type: "comprehension",
          id: "c4",
          skill: "key_details",
          standard: "RI.6.1",
          dok: 2,
          interaction: "mc",
          passageRef: "act2.2b",
          ask: {
            who: "log",
            en: "According to the supply puzzle, exactly how many <b>oxygen cells</b> and <b>ration packs</b> must the Cadet pack?",
          },
          choices: [
            {
              en: "54 oxygen cells and 90 ration packs.",
              correct: true,
            },
            {
              en: "90 oxygen cells and 54 ration packs.",
              correct: false,
            },
            {
              en: "18 oxygen cells and 18 ration packs.",
              correct: false,
            },
          ],
          goodEn:
            "✅ Exactly — 54 cells and 90 ration packs, which divide evenly into 18 identical kits.",
          badEn:
            "❌ Reread the crate counts: 54 oxygen cells and 90 ration packs. (18 is the number of kits, not the supplies.)",
        },
        {
          type: "comprehension",
          id: "c5",
          skill: "sequence",
          standard: "RI.6.3",
          dok: 2,
          interaction: "sequence",
          passageRef: "act2",
          ask: {
            who: "log",
            en: "Order the steps the Cadet followed to find the GCF that synced the drives.",
          },
          items: [
            {
              en: "Write each engine's draw as a product of primes.",
              order: 1,
            },
            {
              en: "Identify the prime factors the two draws share.",
              order: 2,
            },
            {
              en: "Multiply the LOWEST power of each shared prime to get the GCF.",
              order: 3,
            },
          ],
          goodEn:
            "✅ Factor, find what's shared, then take the lowest powers — that's the GCF procedure.",
          badEn:
            "❌ Not quite. You must factor first, then find shared primes, and only then multiply their lowest powers.",
        },
        {
          type: "challenge",
          id: "B2",
          optional: true,
          bonusTag: "⭐ Captain's Challenge",
          ask: {
            who: "log",
            en: "Optional relay puzzle: two codes are <b>relatively prime</b> if their GCF is 1 — they share no prime factors. Which pair is relatively prime?",
          },
          choices: [
            { en: "14 and 35", tree: "(both share 7)", correct: false },
            {
              en: "8 and 15",
              tree: "(2³ and 3×5 — no shared prime)",
              correct: true,
            },
            { en: "12 and 18", tree: "(share 2 and 3)", correct: false },
          ],
          goodEn:
            "✅ 8 = 2³ and 15 = 3 × 5 share no prime, so GCF = 1 — relatively prime. Relay aligned!",
          badEn:
            "❌ That pair shares a prime factor, so their GCF isn't 1. Look for a pair with nothing in common.",
          solveBeat: { who: "cadet", en: "Relay locked. To the reactor." },
        },
      ],
    },

    /* ============================ FINAL ============================ */
    {
      id: "final",
      tab: "Final Code",
      kicker: "Final Code · Boss",
      title: "The Master Door",
      advanceLabel: "Override the core 🌟",
      steps: [
        {
          type: "beats",
          art: "boss-door.png",
          alt: "A giant glowing boss door with rings of orange light",
          lastLabel: "Check AXIS ▶",
          beats: [
            {
              who: "log",
              caption: true,
              en: "Reactor core ahead — the Master Door. It will only open to a single cipher that fuses factorization and the GCF.",
            },
            {
              who: "cadet",
              en: "Both skills, one line, no mistakes. Stand by. Entering the override.",
            },
            {
              who: "axis",
              misconception: true,
              en: "Starting the GCF of 84 and 126 — that's 21, easy.",
            },
            {
              who: "log",
              caption: true,
              en: "Caution: the Master Door grants exactly one attempt. A cipher that fuses factorization and the GCF leaves no margin for a dropped prime.",
            },
          ],
        },
        {
          type: "challenge",
          id: "F",
          ask: {
            who: "cadet",
            en: "Careful, AXIS — check the shared primes again. Pick the line that is <b>fully correct</b>: the prime factorization of <b>84</b> in exponent form, and the <b>GCF of 84 and 126</b>.",
          },
          choices: [
            {
              en: "84 = 2²×3×7,&nbsp; GCF(84,126) = 21",
              tree: "(GCF is short a factor of 2)",
              correct: false,
            },
            {
              en: "84 = 2²×3×7,&nbsp; GCF(84,126) = 42",
              tree: "(2×3×7 = 42, the greatest shared factor)",
              correct: true,
            },
            {
              en: "84 = 2×3×14,&nbsp; GCF(84,126) = 42",
              tree: "(14 is not prime)",
              correct: false,
            },
          ],
          goodEn:
            "✅ OVERRIDE ACCEPTED! 84 = 2² × 3 × 7 and GCF(84,126) = 2 × 3 × 7 = 42. THE MASTER DOOR OPENS!",
          badEn:
            "❌ One part is off — 84 must be ONLY primes, and the GCF is the product of ALL shared primes (42, not 21).",
          solveBeat: {
            who: "cadet",
            en: "Core override accepted! Kepler-9 is coming fully online.",
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
            en: "AXIS insists the GCF of 84 and 126 is 21. What does its repeated error <b>reveal</b> about how AXIS reasons?",
          },
          choices: [
            {
              en: "It rushes to a shortcut and keeps dropping a shared prime, so it never collects ALL the common factors.",
              correct: true,
            },
            {
              en: "It deliberately lies to slow the Cadet down.",
              correct: false,
            },
            {
              en: "It cannot factor any number at all.",
              correct: false,
            },
          ],
          goodEn:
            "✅ Sharp inference — AXIS factors fine but grabs a fast answer, omitting a shared prime, so its GCF falls short.",
          badEn:
            "❌ The text doesn't show malice or total failure. AXIS's pattern is rushing and dropping a shared prime.",
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
            en: "Given how the Master Door punishes a single dropped prime, what should the Cadet do <b>next</b> before transmitting any combined cipher?",
          },
          choices: [
            {
              en: "Verify that EVERY shared prime is included in the GCF before sending the one-shot code.",
              correct: true,
            },
            {
              en: "Trust AXIS's first answer to save time on the single attempt.",
              correct: false,
            },
            {
              en: "Skip the GCF and send only the prime factorization of 84.",
              correct: false,
            },
          ],
          goodEn:
            "✅ Wise prediction — with one attempt, the Cadet must double-check that no shared prime is missing.",
          badEn:
            "❌ With a single attempt and a door that punishes a dropped prime, the Cadet must verify every shared prime first.",
        },
        {
          type: "challenge",
          id: "BF",
          optional: true,
          bonusTag: "⭐ Captain's Final Challenge",
          ask: {
            who: "log",
            en: "Optional: the reactor floor is 84 cm by 126 cm and must be tiled with identical square plates, as large as possible, no gaps. Side length, and how many plates?",
          },
          choices: [
            {
              en: "42 cm plates — GCF(84,126)=42, so 2 × 3 = 6 plates",
              correct: true,
            },
            {
              en: "21 cm plates — a common factor, but not the largest",
              correct: false,
            },
            { en: "42 cm plates — 12 plates fit", correct: false },
          ],
          goodEn:
            "✅ 42 cm plates (GCF = 42): 84/42 × 126/42 = 2 × 3 = 6 plates, no gaps. Reactor tessellated!",
          badEn:
            "❌ The largest square uses the GCF (42 cm); then count 2 across × 3 down = 6 plates.",
          solveBeat: {
            who: "cadet",
            en: "Reactor floor sealed. Station secure.",
          },
        },
      ],
    },
  ],

  glossary: [
    {
      ico: "🔢",
      en: "Prime number",
      es: "número primo",
      def: "An integer greater than 1 with exactly two distinct factors: 1 and itself (2, 3, 5, 7, 11…).",
    },
    {
      ico: "🧩",
      en: "Composite number",
      es: "número compuesto",
      def: "An integer greater than 1 with more than two factors; it can be factored into smaller integers.",
    },
    {
      ico: "🌳",
      en: "Prime factorization",
      es: "factorización en primos",
      def: "Expressing an integer as a product of primes; unique for every integer (Fundamental Theorem of Arithmetic). 72 = 2³×3².",
    },
    {
      ico: "🌲",
      en: "Factor tree",
      es: "árbol de factores",
      def: "A branching diagram that repeatedly splits a number into factors until every leaf is prime.",
    },
    {
      ico: "❮❯",
      en: "Exponent",
      es: "exponente",
      def: "Notation for repeated multiplication; in 2³ the exponent 3 means 2×2×2.",
    },
    {
      ico: "✖️",
      en: "Factor",
      es: "factor",
      def: "An integer that divides another evenly. The factors of 12 are 1, 2, 3, 4, 6, 12.",
    },
    {
      ico: "🤝",
      en: "Common factor",
      es: "factor común",
      def: "A factor shared by two or more numbers; found among the primes their factorizations have in common.",
    },
    {
      ico: "🏆",
      en: "GCF (Greatest Common Factor)",
      es: "Máximo Factor Común (MFC)",
      def: "The largest factor two numbers share. From factorizations, multiply each shared prime raised to its lowest power.",
    },
    {
      ico: "✅",
      en: "Divisible",
      es: "divisible",
      def: "A is divisible by B when A÷B leaves no remainder, i.e. B is a factor of A.",
    },
    {
      ico: "🪙",
      en: "Relatively prime",
      es: "primos entre sí",
      def: "Two numbers whose GCF is 1 — they share no common prime factors (e.g. 8 and 15).",
    },
    {
      ico: "⬜",
      en: "Perfect square",
      es: "cuadrado perfecto",
      def: "A number whose prime factorization has all even exponents, so it equals an integer squared. 324 = 2²×3⁴ = 18².",
    },
  ],

  complete: {
    art: "mission-complete.png",
    alt: "The cadet stands proudly on the restored station bridge with a galaxy behind",
    badge: "🎉🚀⭐",
    titleEn: "Station Restored — Mission Complete!",
    en: "Kepler-9 is fully online. You decomposed every lock into its <b>prime factors</b>, synced the engines with the <b>GCF</b>, and cracked the reactor's combined cipher. Command has logged a commendation, Captain.",
    es: "",
    master: {
      headingEn: "Prove your rank to certify your Master Certificate!",
      promptEn:
        "The final mainframe seal requires the GCF of <strong>108 and 144</strong>. Given 108 = 2² × 3³ and 144 = 2⁴ × 3², extract the lowest power of each shared prime to solve.",
      promptEs: "",
      choices: [
        {
          en: "A) 2² × 3² = 36 &nbsp;(lowest power of shared primes) &nbsp;✅",
          correct: true,
        },
        {
          en: "B) 2⁴ × 3³ = 432 &nbsp;(this is the LCM, not the GCF)",
          correct: false,
        },
        {
          en: "C) 2 × 3 = 6 &nbsp;(common factor, but not the greatest)",
          correct: false,
        },
      ],
      goodEn:
        "🏆 <b>Master Rank Certified!</b> GCF(108,144) = 2² × 3² = 36. Flawless. 🌟",
      badEn:
        "❌ For the GCF, take the LOWEST power of each shared prime: 2² × 3² = 36.",
      certifyTitle: "🏆 Master Certified: Station Restored!",
    },
  },
};
