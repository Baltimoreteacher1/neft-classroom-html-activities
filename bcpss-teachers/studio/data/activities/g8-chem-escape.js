// escape-challenge: five rooms that each test one idea about chemical reactions and conservation of mass (MS-PS1-2, MS-PS1-5).
// Every code piece is derived from the learner's own correct answer. Mass values use rounded atomic masses (Fe 56, Mg 24, C 12, O 16).
const sup = (ee, dev, exp) => ({
  ee: { directions: ee.d, frames: ee.f, wordBank: ee.w },
  dev: { frames: dev.f, wordBank: dev.w || [] },
  exp: { frames: exp },
  br: {},
});

export default {
  id: "g8-chem-escape",
  engine: "escape-challenge",
  title: "Escape the Reaction Lab",
  grade: "8",
  band: "6-8",
  subject: "science",
  lessonId: "g8-science-chemical-reactions-conservation-of-mass",
  standards: ["MS-PS1-2", "MS-PS1-5"],
  curriculum: {
    status: "standards-aligned",
    note: "Aligned to NGSS MS-PS1-2 and MS-PS1-5; not mapped to a district unit sequence. This activity is original practice.",
  },
  vocabIds: [
    "chemical-reaction",
    "physical-change",
    "reactant",
    "product",
    "atom",
    "conservation-of-mass",
    "closed-system",
  ],
  minutes: 30,
  intro:
    "The data cabinet in the science lab is locked, and the lab report is inside it. Solve one puzzle in each of five rooms to collect the pieces of the cabinet code.",
  story: {
    title: "The Locked Data Cabinet",
    setting:
      "A school science lab after the last bell, with a locked cabinet holding the class data log.",
    beats: [
      {
        id: "start",
        after: "start",
        text: "The class data log is locked in the cabinet, and the lab report is due tomorrow. The teacher's note says five code pieces are hidden, one in each lab area.",
      },
      {
        id: "b1",
        after: "evidence-locker",
        text: "The first piece is yours. The note points to the balance room, where a sealed jar sits on a scale with a card that has a smudged number.",
      },
      {
        id: "b2",
        after: "balance-room",
        text: "Two pieces found. The next card hangs beside a cup and a bag that both held the same reaction, but their readings were different.",
      },
      {
        id: "b3",
        after: "open-cup-vault",
        text: "Three pieces. Three data cards lie scattered on the last bench, and each one needs its explanation matched to it.",
      },
      {
        id: "b4",
        after: "match-bench",
        text: "Four pieces. Only the model board is left, where the teacher chalked a reaction and asked how many atoms are on each side.",
      },
      {
        id: "end",
        after: "end",
        text: "The cabinet opens with a click, and the class data log is safe on the shelf. The lab report will be finished tonight.",
      },
    ],
  },
  rooms: [
    {
      id: "evidence-locker",
      title: "The Evidence Locker",
      narrative:
        "Six observation cards are pinned inside the locker. The teacher wants each one sorted by whether it shows that a new substance formed.",
      gate: { needs: "chemical-versus-physical", label: "Telling chemical from physical changes" },
      puzzle: {
        type: "sort",
        prompt:
          "Sort each observation. Choose New substance formed only if the observation shows properties that differ from the starting materials.",
        bins: [
          { id: "new", label: "New substance formed" },
          { id: "same", label: "Same substance, new form" },
        ],
        cards: [
          {
            id: "c1",
            text: "Two clear liquids are mixed and a white solid forms that was not there before.",
            bin: "new",
            token: "A",
          },
          { id: "c2", text: "Ice cubes melt in a glass of warm water.", bin: "same", token: "B" },
          {
            id: "c3",
            text: "A tablet dropped in water fizzes, and bubbles of gas rise from it.",
            bin: "new",
            token: "C",
          },
          {
            id: "c4",
            text: "Sugar is stirred into water until it can no longer be seen.",
            bin: "same",
            token: "D",
          },
          {
            id: "c5",
            text: "An iron nail left in damp air becomes covered in reddish-brown flakes that crumble when rubbed.",
            bin: "new",
            token: "E",
          },
          { id: "c6", text: "A copper wire is bent into a spiral.", bin: "same", token: "F" },
        ],
        hints: [
          "For each card ask whether the end material has properties that differ from the starting material, or whether it is the same substance in a new form.",
          "Look for something that was not there before, such as a new solid or a gas coming from a liquid, or a change in how the material looks and behaves that cannot be undone by freezing or evaporating.",
          "Disappearing from view is not the same as becoming a new substance. Ask whether you could get the original material back by a simple physical step.",
        ],
        misconceptions: [
          {
            tag: "dissolving-is-a-reaction",
            has: ["c4:new"],
            hint: "When sugar dissolves, it spreads out in the water. Ask whether you could get the sugar back by letting the water evaporate.",
          },
          {
            tag: "melting-is-a-reaction",
            has: ["c2:new"],
            hint: "Melted ice is still water. Ask whether the water would be the same substance if you froze it again.",
          },
          {
            tag: "slow-change-is-physical",
            has: ["c5:same"],
            hint: "A slow change can still make new substances. Compare the flakes with the shiny metal you started with.",
          },
        ],
        model: {
          text: "Crushing a stick of chalk into powder changes its size, but it is still chalk: same substance in a new form. Dropping chalk into vinegar makes bubbles of gas, which were not there before. That shows a new substance formed.",
        },
        transfer: {
          type: "sort",
          prompt: "Sort each observation by whether it shows that a new substance formed.",
          bins: [
            { id: "new", label: "New substance formed" },
            { id: "same", label: "Same substance, new form" },
          ],
          cards: [
            { id: "t1", text: "Butter melts in a warm pan.", bin: "same", token: "R" },
            {
              id: "t2",
              text: "A match is lit and turns to black ash and smoke.",
              bin: "new",
              token: "S",
            },
            {
              id: "t3",
              text: "Salt is stirred into water and seems to disappear.",
              bin: "same",
              token: "T",
            },
            {
              id: "t4",
              text: "Cut apple slices left out turn brown and soft.",
              bin: "new",
              token: "U",
            },
          ],
          hints: [
            "Ask whether the end material has properties that differ from the starting material.",
            "Look for a change that cannot be undone by a simple physical step.",
            "Disappearing from view does not mean a new substance formed.",
          ],
        },
        why: "Melting, dissolving and bending only change form or state, so the substance is the same. New solids, gases and permanent changes in properties show that new substances formed.",
        supports: sup(
          {
            d: "For each card ask: is the substance the same, or is there something new with different properties? Put the card in the matching bin.",
            f: ["This card shows something ___.", "The substance is the ___."],
            w: ["new", "same", "gas", "solid", "melts", "dissolves"],
          },
          {
            f: ["A new substance formed because ___.", "It is the same substance because ___."],
            w: ["properties", "physical change", "chemical reaction"],
          },
          ["The observation is (not) evidence of a chemical reaction because ___."],
        ),
      },
      reveal:
        "At the back of the locker you find a brass tag stamped with a piece of the cabinet code.",
    },
    {
      id: "balance-room",
      title: "The Balance Room",
      narrative:
        "A sealed jar sits on a scale. The card beside it says 112 g of iron reacted completely with 48 g of oxygen to form only iron oxide, but the final reading is smudged.",
      gate: { needs: "mass-is-conserved", label: "Using conservation of mass in a closed system" },
      puzzle: {
        type: "numeric",
        prompt:
          "In a sealed jar, 112 g of iron reacts completely with 48 g of oxygen to form only iron oxide. What is the mass of the iron oxide, in grams?",
        answer: "160",
        calc: "112+48",
        unit: "grams",
        visual: {
          kind: "table",
          alt: "A table with columns before in grams and after in grams. Before: 112 iron plus 48 oxygen. After: a question mark for the iron oxide.",
          head: ["Before (g)", "After (g)"],
          rows: [["112 + 48", "?"]],
        },
        hints: [
          "The jar is sealed, so nothing can enter or leave. What does that tell you about the total mass before and after?",
          "Find the total mass of the substances you start with. The new substance contains all of that matter.",
          "Add the two starting masses. Check that the answer is not smaller than either one.",
        ],
        misconceptions: [
          {
            tag: "subtracts-the-masses",
            pick: "64",
            hint: "Subtracting treats the oxygen as if it were removed. In a sealed jar the oxygen joins the iron. What happens to the total?",
          },
          {
            tag: "uses-one-reactant",
            pick: "112",
            hint: "That is the mass of the iron alone. The oxygen joined the iron, so the product contains matter from both reactants.",
          },
          {
            tag: "divides-the-masses",
            pick: "7/3",
            hint: "Dividing compares the two masses. Conservation of mass asks for the total, so think about combining them.",
          },
        ],
        model: {
          text: "In a sealed bottle, 3 g of carbon reacts with 8 g of oxygen and forms only carbon dioxide. The bottle is closed, so the total mass is conserved: 3 plus 8 is 11, so the carbon dioxide has a mass of 11 grams.",
        },
        transfer: {
          type: "numeric",
          prompt:
            "In a sealed tube, 24 g of magnesium reacts completely with 16 g of oxygen to form only magnesium oxide. What is the mass of the magnesium oxide, in grams?",
          answer: "40",
          calc: "24+16",
          unit: "grams",
          hints: [
            "The tube is sealed, so think about the total mass.",
            "Find the total of the starting masses.",
            "Add the two masses and check the result is larger than either.",
          ],
        },
        why: "In a closed system no matter enters or leaves, so the total mass of the products equals the total mass of the reactants: 112 plus 48.",
        supports: sup(
          {
            d: "The jar is sealed. Add the mass of the iron and the mass of the oxygen. The new substance has all of that mass.",
            f: [
              "The iron is ___ grams and the oxygen is ___ grams.",
              "Together they make ___ grams.",
            ],
            w: ["add", "total", "sealed", "same", "grams"],
          },
          {
            f: ["The system is closed, so the total mass before is ___ g and after is ___ g."],
            w: ["conservation of mass", "closed system"],
          },
          ["Since mass is conserved, the product has a mass of ___ because ___ plus ___ is ___."],
        ),
      },
      reveal: "Beside the scale you find a second brass tag with a piece of the cabinet code.",
    },
    {
      id: "open-cup-vault",
      title: "The Open Cup Vault",
      narrative:
        "A bag and a cup hang side by side. The same amounts of baking soda and vinegar reacted in each, and both readings are on the card. The bag was sealed and puffed up.",
      gate: {
        needs: "closed-system-explanation",
        label: "Explaining why a sealed bag keeps its mass",
      },
      puzzle: {
        type: "explain",
        stem: "Claim: the sealed bag reads 150.0 g before and 150.0 g after the reaction, even though it puffed up.",
        prompt: "Choose all the statements that explain why the sealed bag kept the same mass.",
        visual: {
          kind: "table",
          alt: "A table with columns setup, before in grams and after in grams. The sealed bag reads 150.0 before and 150.0 after. The open cup reads 150.0 before and 148.6 after.",
          head: ["Setup", "Before (g)", "After (g)"],
          rows: [
            ["Sealed bag", "150.0", "150.0"],
            ["Open cup", "150.0", "148.6"],
          ],
        },
        choices: [
          "No matter could enter or leave the closed bag.",
          "The reaction made the gas disappear completely.",
          "Atoms were rearranged into new substances, and none were created or destroyed.",
          "Gas has no mass, so the puffed-up bag weighs the same as before.",
          "The balance cannot measure a bag that has been inflated.",
        ],
        answer: [0, 2],
        tokens: ["K", "G", "A", "N", "B"],
        hints: [
          "Look for statements that describe what happened to the matter in the bag, not to the balance.",
          "Two statements talk about what is conserved and why. Check whether each statement is consistent with the data for the open cup too.",
          "A statement that says matter vanishes, or that gas has no mass, cannot explain a result that is measured with a balance.",
        ],
        misconceptions: [
          {
            tag: "gas-has-no-mass",
            has: [3],
            hint: "Gas is matter, and the open cup lost mass when gas escaped. What does that tell you about the mass of a gas?",
          },
          {
            tag: "matter-vanishes",
            has: [1],
            hint: "If matter vanished, the sealed bag would lose mass too. Check what the bag reading says.",
          },
          {
            tag: "blames-the-balance",
            has: [4],
            hint: "The same balance gave a different reading for the open cup. Think about the matter instead of the instrument.",
          },
        ],
        model: {
          text: "A sealed jar holds a rusting nail and air. Its mass is the same before and after weeks of rusting. The jar is closed, so no matter came in or out, and the atoms of iron and oxygen only combined. A stretched lid would not add mass.",
        },
        transfer: {
          type: "explain",
          stem: "Claim: a sealed flask of reactants reads 80.0 g before and 80.0 g after, even though it fizzes inside.",
          prompt: "Choose all the statements that explain why the flask kept the same mass.",
          choices: [
            "No matter entered or left the closed flask.",
            "The atoms were rearranged, not created or destroyed.",
            "Fizzing means the mass must go down.",
            "Gas does not count as matter.",
          ],
          answer: [0, 1],
          tokens: ["N", "A", "F", "G"],
          hints: [
            "Look for statements about what happens to matter in a closed flask.",
            "Check each statement against the fact that a gas is matter.",
            "A statement that says fizzing must lower the mass ignores the fact that the flask is closed.",
          ],
        },
        why: "A closed system keeps all its matter, and the atoms are only rearranged, so the total mass is conserved even when a gas puffs up the bag.",
        supports: sup(
          {
            d: "Ask what matter can enter or leave a sealed bag. Then ask what happens to the atoms in a reaction. Choose the two statements that answer those questions.",
            f: ["The bag was ___.", "The atoms were ___, not destroyed."],
            w: ["closed", "sealed", "rearranged", "matter", "gas"],
          },
          {
            f: ["The mass stayed the same because ___ and ___."],
            w: ["closed system", "atoms"],
          },
          ["The mass is conserved because the system is ___ and the atoms are ___."],
        ),
      },
      reveal:
        "A flap opens in the vault door, and a third brass tag with a piece of the code drops out.",
    },
    {
      id: "match-bench",
      title: "The Match Bench",
      narrative:
        "Three data cards lie on the bench, and five explanation cards lie beside them. Find each change in mass, then match each result to the explanation that fits it. Some explanation cards will not be used.",
      gate: { needs: "open-versus-closed", label: "Connecting data to open and closed systems" },
      puzzle: {
        type: "match",
        prompt:
          "Find each change in mass (after minus before). Match each data card to the explanation that fits its change and its container.",
        lefts: [
          { id: "l1", text: "Sealed bag: 150.0 g before and 150.0 g after the reaction.", calc: "150-150" },
          { id: "l2", text: "Open cup: 150.0 g before and 148.6 g after the reaction.", calc: "148.6-150" },
          { id: "l3", text: "Steel wool heated in open air: 20.0 g before and 21.4 g after.", calc: "21.4-20" },
        ],
        rights: [
          { id: "r1", text: "No change: the system is closed, so mass is conserved.", token: "C", value: "0" },
          { id: "r2", text: "Lost 1.4 g: a gas made by the reaction escaped.", token: "O", value: "-1.4" },
          { id: "r3", text: "Gained 1.4 g: oxygen from the air joined the iron.", token: "X", value: "1.4" },
          { id: "r4", text: "Lost 1.4 g: mass was destroyed by the reaction.", token: "D", value: "-1.4" },
          { id: "r5", text: "Gained 1.4 g: the atoms became heavier.", token: "L", value: "1.4" },
        ],
        answer: { l1: "r1", l2: "r2", l3: "r3" },
        hints: [
          "Subtract the before mass from the after mass for each card. A negative result means the mass went down.",
          "Two explanation cards share a number with the right card. Decide which one gives a reason that matches the container being open or closed.",
          "No explanation card should say that mass is destroyed or that atoms change mass. Set those two aside.",
        ],
        misconceptions: [
          {
            tag: "mass-destroyed",
            has: ["l2=r4"],
            hint: "If mass were destroyed, the sealed bag would lose mass too. Where could the missing mass in an open cup have gone?",
          },
          {
            tag: "atoms-get-heavier",
            has: ["l3=r5"],
            hint: "Atoms keep their mass in a reaction. If the steel wool gained mass, something else must have joined it.",
          },
        ],
        model: {
          text: "An open pan of water boils for a while and goes from 500 g to 470 g. The change is minus 30 g. The pan is open, so a gas, water vapor, left and carried its mass away. A closed pot that keeps its steam shows no change.",
        },
        transfer: {
          type: "match",
          prompt: "Find each change in mass (after minus before). Match each data card to the explanation that fits.",
          lefts: [
            { id: "m1", text: "Sealed jar: 80.0 g before and 80.0 g after a reaction.", calc: "80-80" },
            { id: "m2", text: "Open beaker: 90.0 g before and 87.5 g after a fizzing reaction.", calc: "87.5-90" },
            { id: "m3", text: "Iron nail left in open air for weeks: 15.0 g before and 15.4 g after.", calc: "15.4-15" },
          ],
          rights: [
            { id: "n1", text: "No change: the system is closed.", token: "A", value: "0" },
            { id: "n2", text: "Lost 2.5 g: a gas escaped.", token: "B", value: "-2.5" },
            { id: "n3", text: "Gained 0.4 g: oxygen from the air joined the iron.", token: "C", value: "2/5" },
          ],
          answer: { m1: "n1", m2: "n2", m3: "n3" },
          hints: [
            "Subtract the before mass from the after mass.",
            "A lower mass in an open container means something left.",
            "A higher mass in an open container means something joined.",
          ],
        },
        why: "A closed system keeps its mass. An open system loses mass when a gas escapes and gains mass when something from the air joins the material.",
        supports: sup(
          {
            d: "Subtract the before mass from the after mass. Ask: was the container open or closed? Then match the card.",
            f: ["The mass went ___ by ___ grams.", "The container was ___."],
            w: ["open", "closed", "up", "down", "same", "gas"],
          },
          {
            f: ["Card ___ matches because the change is ___ and the system was ___."],
            w: ["open system", "closed system", "conservation of mass"],
          },
          ["The mass changed (did not change) by ___ because the system was ___ and ___."],
        ),
      },
      reveal:
        "The last card clicks into a slot in the bench, and a fourth brass tag with a piece of the code slides out.",
    },
    {
      id: "atom-board",
      title: "The Atom Board",
      narrative:
        "The model board shows the chalked reaction 4 Fe + 3 O2 becomes 2 Fe2O3. The teacher wants to know how many atoms of oxygen there are in the products.",
      gate: { needs: "count-atoms", label: "Counting atoms on both sides of a reaction" },
      puzzle: {
        type: "numeric",
        prompt:
          "The reaction is 4 Fe + 3 O2 becomes 2 Fe2O3. How many oxygen atoms are on the product side?",
        answer: "6",
        calc: "2*3",
        unit: "oxygen atoms",
        hints: [
          "A number in front of a formula tells how many molecules or units there are. A small number inside a formula tells how many atoms are in one unit.",
          "Find how many oxygen atoms are in one Fe2O3 unit, then multiply by the number of units.",
          "Check your answer by counting the oxygen atoms on the reactant side. The two counts must match.",
        ],
        misconceptions: [
          {
            tag: "reads-the-front-number-only",
            pick: "2",
            hint: "That is the number of Fe2O3 units, not the number of oxygen atoms. How many oxygen atoms does each unit contain?",
          },
          {
            tag: "ignores-the-units",
            pick: "3",
            hint: "That is the number of oxygen atoms in one Fe2O3 unit. How many units does the product side show?",
          },
          {
            tag: "adds-instead-of-multiplies",
            pick: "5",
            hint: "Adding the 2 and the 3 mixes two different counts. Think about repeated groups of the same size.",
          },
        ],
        model: {
          text: "In 2 H2O there are 2 water molecules. Each has 1 oxygen atom and 2 hydrogen atoms. So the oxygen atoms are 2 times 1, which is 2, and the hydrogen atoms are 2 times 2, which is 4.",
        },
        transfer: {
          type: "numeric",
          prompt:
            "The reaction is N2 + 3 H2 becomes 2 NH3. How many atoms in total, nitrogen and hydrogen together, are on the product side?",
          answer: "8",
          calc: "2*(1+3)",
          unit: "atoms",
          hints: [
            "Find how many atoms are in one NH3 unit.",
            "Multiply by the number of NH3 units.",
            "Count the atoms on the reactant side to check that the totals match.",
          ],
        },
        why: "Each Fe2O3 unit has 3 oxygen atoms and there are 2 units, so the products have 2 times 3 oxygen atoms. The reactant side also has 3 times 2, so the atoms are conserved.",
        supports: sup(
          {
            d: "Find how many oxygen atoms are in one Fe2O3. Then count how many Fe2O3 there are.",
            f: ["One Fe2O3 has ___ oxygen atoms.", "There are ___ Fe2O3, so ___ oxygen atoms."],
            w: ["count", "oxygen", "units", "times"],
          },
          {
            f: ["I multiplied ___ atoms by ___ units to get ___."],
            w: ["atom", "formula"],
          },
          ["The product side has ___ oxygen atoms because ___ units contain ___ each."],
        ),
      },
      reveal:
        "The board slides aside, and the fifth brass tag with the last piece of the code is stuck behind it.",
    },
  ],
  door: {
    title: "The Data Cabinet",
    prompt: "Type the code the teacher's note describes.",
    order: ["evidence-locker", "balance-room", "open-cup-vault", "match-bench", "atom-board"],
    success: "The cabinet opens. The class data log is safe, and the lab report can be finished.",
  },
  reflection: {
    prompt:
      "Which room made you think hardest about where mass goes in a reaction? What helped you decide?",
    frames: {
      ee: ["The hardest room was ___.", "It helped me to look at ___."],
      dev: ["The room that was hardest was ___ because ___.", "What helped me was ___."],
      exp: [
        "I found the ___ room hardest because ___; I decided by checking whether the system was ___.",
      ],
      br: [
        "The ___ room made me connect the data and the model of atoms because ___, and ___ helped me check my reasoning.",
      ],
    },
  },
  review: { status: "authored", checks: {} },
  version: "1.0.0",
  updated: "2026-11-23",
  source: "Original - The Language Page",
};
