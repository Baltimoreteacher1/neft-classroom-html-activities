/* STORY · Unit 7 · Graphic Novel #2 (Enrichment) · Detective Case Files: The Equation Mysteries
   Full novel on the comic engine. Enrichment tier: layered clues, two-step
   solving + verification, optional "Captain's Challenge" bonus rounds
   (non-gating, still scored), English-only (source has no Spanish), 10-term
   codex. All math/answers/distractors/glossary carried verbatim from
   graphic-novels/unit7/graphic-novel-2.html (6.EE.7).
   New: panels, speech, GUMSHOE-voices-the-misconception (operates on ONE side
   only), vocab pop-ups. */
window.GN_STORY = {
  meta: {
    unit: 7,
    version: 2,
    level: "Enrichment",
    title: "Detective Case Files: The Equation Mysteries",
    standard: "6.EE.7",
    readingStandard: "RL.6.1",
    assessment:
      "Graphic Novel U7 #2: Detective Case Files: The Equation Mysteries",
    artBase: "../_art/unit7/",
    home: "../index.html",
  },

  cast: {
    detective: {
      name: "The Detective",
      role: "protagonist",
      color: "#ff8a3d",
      tagIcon: "🕵️",
      avatar: null,
      blurb: "You",
    },
    gumshoe: {
      name: "GUMSHOE",
      role: "companion",
      color: "#3da5ff",
      tagIcon: "🔎",
      avatar: null,
      blurb: "Rookie partner · balances only ONE side",
    },
    log: { name: "Case File", role: "narrator", color: "#3da5ff" },
  },

  cover: {
    art: "cover.png",
    alt: "A young detective stands in a cozy office at night with a board of clues and a locked evidence box",
    blurbEn:
      "<b>The Detective</b> has inherited the precinct's coldest, trickiest cases. Every locked evidence box guards an unknown quantity. Your job: <b>translate layered clues into equations</b>, <b>solve</b> them, and <b>verify</b> each answer before the lock will yield. GUMSHOE, your keen rookie partner, keeps trying to balance only ONE side &mdash; catch it. &#11088; Each act hides an <b>optional</b> Captain's Challenge: bonus glory only, skip it anytime and still solve the case.",
    blurbEs: "",
    startLabel: "Open the Case &#128373;&#65039;",
  },

  acts: [
    /* ============================ ACT 1 ============================ */
    {
      id: "act1",
      tab: "Act 1: The First Clue",
      kicker: "Act 1 · Write Equations",
      title: "The First Clue",
      advanceLabel: "File the clues &#128373;&#65039;",
      steps: [
        {
          type: "beats",
          art: "evidence-room.png",
          alt: "The detective examines a wall of clues with a magnifying glass",
          lastLabel: "Read the clue ▶",
          beats: [
            {
              who: "log",
              caption: true,
              en: "Midnight at the precinct. The coldest files in the archive land on the desk &mdash; each one an unknown waiting to be named.",
            },
            {
              who: "detective",
              en: "Words are just equations in disguise. I read the clue, name the unknown with a variable, and translate every phrase into an operation &mdash; in the right order.",
              vocab: [
                {
                  term: "variable",
                  en: "A symbol (often a letter) representing an unknown or changing quantity. In 4f + 3 = 23, f is the variable.",
                },
              ],
            },
            {
              who: "log",
              caption: true,
              en: "The hardest part of cold cases is the wording. The exact phrase &mdash; 'half of,' 'more than,' 'twice' &mdash; decides every operation and the order it belongs in.",
            },
            {
              who: "gumshoe",
              misconception: true,
              en: "Half were taken, so the rest is 2b, then subtract the 8: 2b + 8 = 30, right?",
            },
          ],
        },
        {
          type: "challenge",
          id: "1a",
          ask: {
            who: "gumshoe",
            en: "Wait &mdash; the case file reads: &ldquo;The vault held some bills. The thief took <b>half</b> of them, then a guard recovered <b>8</b>, leaving <b>30</b> in the vault.&rdquo; Let <b>b</b> = the original number of bills. Which equation models the clue, in order?",
          },
          choices: [
            {
              en: "2b + 8 = 30 (this doubles the bills).",
              correct: false,
            },
            {
              en: "b/2 + 8 = 30 (half remained, plus the 8 recovered).",
              correct: true,
            },
            {
              en: "b/2 &minus; 8 = 30 (8 was recovered, not removed).",
              correct: false,
            },
          ],
          goodEn:
            "&#9989; Precise. Half remained (b/2), the guard added 8 back, total 30: b/2 + 8 = 30. Clue modeled.",
          badEn:
            "&#10060; Track the actions in order: HALF remained (b&divide;2), then 8 were RECOVERED (added). Re-read and try again.",
          solveBeat: {
            who: "detective",
            en: "First clue modeled. Now a lab note &mdash; 'three more than four times.' Order matters here: I multiply before I add.",
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
            en: "The Detective says, &ldquo;Words are just equations in disguise.&rdquo; What does the word <b>variable</b> mean in this case file?",
          },
          hint: {
            en: "Notice how the Detective names an unknown like b or f before writing any math.",
          },
          choices: [
            {
              en: "A symbol that stands for an unknown or changing quantity.",
              correct: true,
            },
            {
              en: "The final code that opens a locked evidence box.",
              correct: false,
            },
            {
              en: "A phrase in a clue that tells you to multiply.",
              correct: false,
            },
          ],
        },
        {
          type: "comprehension",
          id: "c2",
          skill: "key_details",
          standard: "RI.6.1",
          dok: 2,
          interaction: "mc",
          passageRef: "act1.1a",
          ask: {
            who: "log",
            en: "In the vault clue, what happened to the bills <b>after</b> the thief took half of them?",
          },
          choices: [
            {
              en: "A guard recovered 8, leaving 30 in the vault.",
              correct: true,
            },
            {
              en: "The thief returned all of them the next night.",
              correct: false,
            },
            {
              en: "Another 8 bills were stolen, leaving 30.",
              correct: false,
            },
          ],
        },
        {
          type: "challenge",
          id: "1b",
          ask: {
            who: "detective",
            en: "Lab note: &ldquo;<b>Three more</b> than <b>four times</b> the number of usable fingerprints (<b>f</b>) equals <b>23</b>.&rdquo; Translate it into an equation.",
            vocab: [
              {
                term: "four times",
                en: "When translating 'three more than four times f,' multiply (4f) before adding (+3): 4f + 3.",
              },
            ],
          },
          choices: [
            {
              en: "4(f + 3) = 23 (this adds 3 first, then multiplies).",
              correct: false,
            },
            {
              en: "3f + 4 = 23 (mixed up the 3 and the 4).",
              correct: false,
            },
            {
              en: "4f + 3 = 23 (four times f, then three more).",
              correct: true,
            },
          ],
          goodEn:
            "&#9989; Exactly. 'Four times f' is 4f; 'three more' adds 3: 4f + 3 = 23. Operation order preserved.",
          badEn:
            "&#10060; 'Four times the prints' is 4f, and 'three more' adds 3 AFTER multiplying: 4f + 3. Watch the order.",
          solveArt: "write-equation.png",
          solveAlt:
            "Detective Mateo writes equations at his desk under a warm lamp",
          solveBeat: {
            who: "log",
            caption: true,
            en: "Optional: a coded confession surfaces, with the unknown on BOTH sides of the equals sign. Worth a look, Detective?",
          },
        },
        {
          type: "comprehension",
          id: "c3",
          skill: "cite_evidence",
          standard: "RL.6.1",
          dok: 3,
          interaction: "evidence",
          passageRef: "act1.1b",
          ask: {
            who: "log",
            en: "Tap the line that proves the lab note describes <b>multiplying before adding</b> (so the equation is 4f + 3, not 4(f + 3)).",
          },
          choices: [
            {
              en: "“Three more than four times the number of usable fingerprints (f) equals 23.”",
              correct: true,
            },
            {
              en: "“The thief took half of them, then a guard recovered 8.”",
              correct: false,
            },
            {
              en: "“Words are just equations in disguise.”",
              correct: false,
            },
          ],
        },
        {
          type: "challenge",
          id: "B1",
          optional: true,
          bonusTag: "⭐ Captain's Challenge",
          ask: {
            who: "log",
            en: "The Double-Cross. A coded confession says: &ldquo;<b>Twice</b> a number, <b>decreased by 7</b>, gives the <b>same result</b> as the number <b>increased by 5</b>.&rdquo; Which equation captures it?",
          },
          choices: [
            {
              en: "2n &minus; 7 = n + 5 (both sides describe the same value).",
              correct: true,
            },
            {
              en: "2n + 7 = n &minus; 5 (signs reversed).",
              correct: false,
            },
            {
              en: '2(n &minus; 7) = n + 5 ("twice a number" is 2n, not 2(n&minus;7)).',
              correct: false,
            },
          ],
          goodEn:
            "&#11088; Sharp. 'Twice a number decreased by 7' is 2n &minus; 7; 'the number increased by 5' is n + 5. So 2n &minus; 7 = n + 5 (and n = 12).",
          badEn:
            "&#10060; 'Twice a number' is 2n (not 2(n&minus;7)); 'decreased by 7' subtracts after. Compare to n + 5.",
          solveBeat: {
            who: "detective",
            en: "Confession decoded. Both clues filed &mdash; to the evidence room.",
          },
        },
      ],
    },

    /* ============================ ACT 2 ============================ */
    {
      id: "act2",
      tab: "Act 2: The Locked Boxes",
      kicker: "Act 2 · Solve Equations",
      title: "The Locked Boxes",
      advanceLabel: "Open the next case &#128273;",
      steps: [
        {
          type: "beats",
          art: "unlock-box.png",
          alt: "Detective Mateo opens a locked evidence box with golden light pouring out",
          lastLabel: "Solve box one ▶",
          beats: [
            {
              who: "log",
              caption: true,
              en: "The evidence room. Rows of locked boxes, each code equal to a hidden variable.",
            },
            {
              who: "detective",
              en: "I isolate the variable using inverse operations, then substitute my answer back to prove the lock is really open. No guesses.",
              vocab: [
                {
                  term: "inverse operations",
                  en: "The operation that reverses another. Addition/subtraction are inverses; multiplication/division are inverses.",
                },
              ],
            },
            {
              who: "log",
              caption: true,
              en: "Every lock in this room is honest: whatever you do to one side of the equation, you must do to the other, or the code never lands.",
            },
            {
              who: "gumshoe",
              misconception: true,
              en: "x / 6 = 9? I'll just add 6 to the x side: x = 15. Lock's open, surely!",
            },
          ],
        },
        {
          type: "comprehension",
          id: "c4",
          skill: "main_idea",
          standard: "RI.6.2",
          dok: 2,
          interaction: "mc",
          passageRef: "act2.beat1",
          ask: {
            who: "log",
            en: "What is the Detective's main goal in the evidence room?",
          },
          choices: [
            {
              en: "Use inverse operations to isolate each variable and verify the code that opens a locked box.",
              correct: true,
            },
            {
              en: "Translate the very first paper clue into an equation.",
              correct: false,
            },
            {
              en: "Count how many evidence boxes are stacked in the room.",
              correct: false,
            },
          ],
        },
        {
          type: "challenge",
          id: "2a",
          ask: {
            who: "gumshoe",
            en: "Hold on &mdash; the first lock opens to the value of <b>x</b>. Isolate the variable and find the code: <b>x / 6 = 9</b>. Don't lock it at x = 15!",
          },
          choices: [
            {
              en: "x = 54 (multiply both sides by 6: 9 &times; 6).",
              correct: true,
            },
            {
              en: "x = 15 (this added 6).",
              correct: false,
            },
            {
              en: "x = 1.5 (this divided 9 by 6).",
              correct: false,
            },
          ],
          goodEn:
            "&#9989; x &divide; 6 = 9, so multiply both sides by 6: x = 54. Check: 54 &divide; 6 = 9. Lock released.",
          badEn:
            "&#10060; Division by 6 is undone by MULTIPLYING both sides by 6: x = 9 &times; 6.",
          solveBeat: {
            who: "detective",
            en: "One-step lock cleared. This next box takes two moves &mdash; peel off the constant, then undo the coefficient.",
          },
        },
        {
          type: "challenge",
          id: "2b",
          ask: {
            who: "detective",
            en: "This lock needs two moves. Solve for <b>n</b>, then <b>verify</b> by substituting back: <b>3n + 5 = 26</b>.",
            vocab: [
              {
                term: "coefficient",
                en: "The number multiplying a variable. In 3n the coefficient is 3; undo it by dividing.",
              },
              {
                term: "constant",
                en: "A fixed number with no variable, such as the +5 in 3n + 5 = 26. Undo it first when solving.",
              },
            ],
          },
          choices: [
            {
              en: "n = 9 (check: 3&times;9+5 = 32, not 26).",
              correct: false,
            },
            {
              en: "n = 7 (subtract 5, then divide by 3; check: 3&times;7+5=26).",
              correct: true,
            },
            {
              en: "n = 10 (check: 3&times;10+5 = 35, not 26).",
              correct: false,
            },
          ],
          goodEn:
            "&#9989; Subtract 5 &rarr; 3n = 21; divide by 3 &rarr; n = 7. Verify: 3&times;7 + 5 = 26. Box open.",
          badEn:
            "&#10060; Two moves: first subtract the constant 5, THEN divide by the coefficient 3. Substitute to check.",
          solveBeat: {
            who: "log",
            caption: true,
            en: "Optional: a tampered file lists a 'confirmed' answer. Care to verify it by substitution before signing off?",
          },
        },
        {
          type: "challenge",
          id: "B2",
          optional: true,
          bonusTag: "⭐ Captain's Challenge",
          ask: {
            who: "log",
            en: "The Verification Trap. A tampered file claims a solution. Use substitution to find the value of <b>m</b> that <b>actually makes</b> the equation true: <b>8 = m &minus; 15</b>.",
          },
          choices: [
            {
              en: "m = 7 (check: 7 &minus; 15 = &minus;8, not 8).",
              correct: false,
            },
            {
              en: "m = 23 (check: 23 &minus; 15 = 8 &check;).",
              correct: true,
            },
            {
              en: "m = &minus;7 (check: &minus;7 &minus; 15 = &minus;22).",
              correct: false,
            },
          ],
          goodEn:
            "&#11088; Verified. 8 = m &minus; 15 means m = 23, and 23 &minus; 15 = 8 checks out. The file was honest after all.",
          badEn:
            "&#10060; Substitute each value into 8 = m &minus; 15. Only the one giving a true statement is the solution.",
          solveBeat: {
            who: "detective",
            en: "File verified. Both boxes open &mdash; the Vault Mystery is next.",
          },
        },
        {
          type: "comprehension",
          id: "c5",
          skill: "sequence",
          standard: "RI.6.3",
          dok: 3,
          interaction: "sequence",
          passageRef: "act2.2b",
          ask: {
            who: "log",
            en: "Put the Detective's steps for solving the two-step lock 3n + 5 = 26 in the correct order.",
          },
          items: [
            {
              en: "Subtract the constant 5 from both sides to get 3n = 21.",
              order: 1,
            },
            {
              en: "Divide both sides by the coefficient 3 to get n = 7.",
              order: 2,
            },
            {
              en: "Substitute n = 7 back in to verify: 3×7 + 5 = 26.",
              order: 3,
            },
          ],
        },
      ],
    },

    /* ============================ FINAL ============================ */
    {
      id: "final",
      tab: "Final Case",
      kicker: "Final Case · Boss",
      title: "The Vault Mystery",
      advanceLabel: "Crack the Vault &#127775;",
      steps: [
        {
          type: "beats",
          art: "final-case.png",
          alt: "Detective Mateo faces a giant vault door covered in locks and dials",
          lastLabel: "Enter the vault ▶",
          beats: [
            {
              who: "log",
              caption: true,
              en: "The grand vault &mdash; the case behind every case. Its lock demands the full method: write, solve, and verify in one move.",
            },
            {
              who: "detective",
              en: "Translate the clue, solve it cleanly, check it cold. One airtight line opens this door.",
              vocab: [
                {
                  term: "verify",
                  en: "Substituting your solution back into the original equation to confirm it is true before trusting it.",
                },
              ],
            },
            {
              who: "log",
              caption: true,
              en: "The vault gives no second guesses. A code is accepted only when the equation is written, solved, AND verified &mdash; all three, in order.",
            },
            {
              who: "gumshoe",
              misconception: true,
              en: "2c &minus; 12 = 30 &mdash; I'll only undo the 12 on the c side and stop: c = 9.",
            },
          ],
        },
        {
          type: "challenge",
          id: "F",
          ask: {
            who: "detective",
            en: "Careful, GUMSHOE. The master clue: &ldquo;When you take <b>twice</b> the number of stolen coins and <b>subtract 12</b>, you are left with <b>30</b>.&rdquo; Let <b>c</b> = stolen coins. Which line shows both the correct equation and the correct value of c?",
          },
          choices: [
            {
              en: "2c &minus; 12 = 30, c = 9 (equation right, but check: 2&times;9&minus;12=6).",
              correct: false,
            },
            {
              en: "2c &minus; 12 = 30, c = 21 (add 12 &rarr; 2c=42 &rarr; c=21; check: 2&times;21&minus;12=30).",
              correct: true,
            },
            {
              en: "2c + 12 = 30, c = 9 (the clue subtracts 12, not adds).",
              correct: false,
            },
          ],
          goodEn:
            "&#9989; VAULT OPEN! 2c &minus; 12 = 30 &rarr; add 12 &rarr; 2c = 42 &rarr; c = 21. Check: 2&times;21 &minus; 12 = 30. Airtight.",
          badEn:
            "&#10060; The clue subtracts 12 from TWICE the coins: 2c &minus; 12 = 30. Add 12, then divide by 2, then verify.",
          solveBeat: {
            who: "log",
            caption: true,
            en: "Optional: behind the vault sits a smaller safe. Its code must be solved and verified.",
          },
        },
        {
          type: "challenge",
          id: "BF",
          optional: true,
          bonusTag: "⭐ Captain's Final Challenge",
          ask: {
            who: "log",
            en: "The Inner Safe. Behind the vault sits a smaller safe. Its code <b>y</b> satisfies the clue below. Solve and verify: <b>y / 4 + 6 = 13</b>.",
          },
          choices: [
            {
              en: "y = 28 (subtract 6 &rarr; y/4=7 &rarr; y=28; check: 28/4+6=13).",
              correct: true,
            },
            {
              en: "y = 76 (check: 76/4+6 = 25, not 13).",
              correct: false,
            },
            {
              en: "y = 1.75 (divided too early; handle +6 first).",
              correct: false,
            },
          ],
          goodEn:
            "&#11088; y &divide; 4 + 6 = 13 &rarr; subtract 6 &rarr; y &divide; 4 = 7 &rarr; y = 28. Check: 28 &divide; 4 + 6 = 13. Inner safe cracked.",
          badEn:
            "&#10060; Undo the +6 first (subtract 6), THEN multiply by 4. Verify by substituting back.",
          solveBeat: {
            who: "detective",
            en: "Inner safe cracked. The precinct's coldest case is officially closed.",
          },
        },
        {
          type: "comprehension",
          id: "c6",
          skill: "inference",
          standard: "RL.6.1",
          dok: 3,
          interaction: "mc",
          passageRef: "final",
          ask: {
            who: "log",
            en: "Across every case, GUMSHOE balances only ONE side and lands the wrong code. What can you infer about why GUMSHOE keeps failing?",
          },
          hint: {
            en: "Recall the rule the Case File repeats about both sides of the equals sign.",
          },
          choices: [
            {
              en: "Changing only one side breaks the balance, so the equation is no longer equal and the code is wrong.",
              correct: true,
            },
            {
              en: "GUMSHOE secretly wants the vault to stay locked.",
              correct: false,
            },
            {
              en: "The clues are written in a code no one can translate.",
              correct: false,
            },
          ],
        },
        {
          type: "comprehension",
          id: "c7",
          skill: "prediction",
          standard: "RL.6.3",
          dok: 2,
          interaction: "mc",
          passageRef: "final",
          ask: {
            who: "log",
            en: "The vault is open and the cold case is closed. What will the Detective most likely do with the next file that lands on the desk?",
          },
          choices: [
            {
              en: "Translate its clues into an equation, solve it, and verify the answer &mdash; the same airtight method.",
              correct: true,
            },
            {
              en: "Re-lock the inner safe and walk away from the precinct.",
              correct: false,
            },
            {
              en: "Let GUMSHOE balance only one side from now on.",
              correct: false,
            },
          ],
        },
      ],
    },
  ],

  glossary: [
    {
      ico: "&#10067;",
      en: "Variable",
      def: "A symbol (often a letter) representing an unknown or changing quantity. In 4f + 3 = 23, f is the variable.",
    },
    {
      ico: "&#9878;&#65039;",
      en: "Equation",
      def: "A statement that two expressions are equal. A solution is any value of the variable that makes it true.",
    },
    {
      ico: "&#9881;&#65039;",
      en: "Coefficient",
      def: "The number multiplying a variable. In 3n the coefficient is 3; undo it by dividing.",
    },
    {
      ico: "&#10133;",
      en: "Constant",
      def: "A fixed number with no variable, such as the +5 in 3n + 5 = 26. Undo it first when solving.",
    },
    {
      ico: "&#128260;",
      en: "Inverse operation",
      def: "The operation that reverses another. Addition/subtraction are inverses; multiplication/division are inverses.",
    },
    {
      ico: "&#10145;&#65039;",
      en: "Order of operations",
      def: "When translating 'three more than four times f,' multiply (4f) before adding (+3): 4f + 3.",
    },
    {
      ico: "&#9878;&#65039;",
      en: "Balance / both sides",
      def: "Whatever you do to one side of an equation, do to the other, so equality is preserved.",
    },
    {
      ico: "&#128269;",
      en: "Substitution",
      def: "Replacing the variable with a value to test it. 23 &minus; 15 = 8 confirms m = 23 solves 8 = m &minus; 15.",
    },
    {
      ico: "&#9989;",
      en: "Verify / check",
      def: "Substituting your solution back into the original equation to confirm it is true before trusting it.",
    },
    {
      ico: "&#129518;",
      en: "Multi-step equation",
      def: "An equation needing more than one inverse operation to isolate the variable, e.g. 3n + 5 = 26.",
    },
  ],

  complete: {
    art: "solved.png",
    alt: "Detective Mateo celebrates with confetti as all the evidence boxes stand open",
    badge: "&#127881;&#128373;&#65039;&#11088;",
    titleEn: "Case Closed &mdash; Brilliantly Solved!",
    en: "Masterful work, Detective. You translated tangled clues into precise <b>equations</b>, <b>solved</b> one-step and multi-step locks, and <b>verified</b> every solution before trusting it. The precinct's coldest case is officially closed.",
    es: "",
    master: {
      headingEn: "Prove your rank to certify your Master Certificate!",
      promptEn:
        "Case file equation: Solve the two-step equation to isolate the variable: <strong>3x - 5 = 16</strong>.",
      promptEs: "",
      choices: [
        {
          en: "A) x = 3.6 &nbsp;(subtracted 5 instead of adding it)",
          correct: false,
        },
        { en: "B) x = 7 &nbsp;(3x = 21 &rArr; x = 7) &nbsp;✅", correct: true },
        {
          en: "C) x = 18 &nbsp;(added 5 and multiplied incorrectly)",
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
