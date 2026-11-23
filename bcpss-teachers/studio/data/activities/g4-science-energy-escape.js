// Escape Challenge: the science room supply cabinet is locked. Four energy and circuit rooms give the pieces of the code.
const sup = (directions, frames, wordBank) => ({
  ee: {
    directions,
    frames,
    wordBank,
    oral: "Say your idea to a partner before you answer.",
  },
  dev: {
    directions: "Think about the evidence before you decide.",
    frames: [frames[0]],
    wordBank: wordBank.slice(0, 3),
  },
  exp: { frames: [frames[0]] },
  br: {},
});

export default {
  id: "g4-science-energy-escape",
  engine: "escape-challenge",
  title: "The Supply Cabinet Code",
  grade: "4",
  band: "3-5",
  subject: "science",
  lessonId: "g4-science-energy-transfer-and-circuits",
  standards: ["4-PS3-2", "4-PS3-4"],
  curriculum: {
    status: "district-referenced",
    unitId: "g4-sci-u1",
    note: "Matches the Energy Transfer & Collisions unit in the BCPSS curriculum seed. Puzzles and story are original.",
  },
  vocabIds: ["energy-transfer", "electric-current", "circuit", "conductor", "insulator", "convert"],
  minutes: 20,
  intro:
    "The science room supply cabinet is locked just before the investigation begins. Four rooms of energy puzzles hold the pieces of the lock code. Solve each puzzle and read the pieces in the order the label gives.",
  story: {
    title: "The Supply Cabinet Code",
    setting: "The fourth-grade science room, just before the circuit investigation begins.",
    beats: [
      {
        id: "start",
        after: "start",
        text: "The class needs the cabinet for batteries and bulbs, but the combination lock will not open. A label on the door says the code is split among four stations in the room.",
      },
      {
        id: "after-bench",
        after: "bench",
        text: "The materials sort into place and a tray slides out with a small brass key. The key opens a panel that holds a diagram of an energy path.",
      },
      {
        id: "after-flow",
        after: "flow",
        text: "The diagram lights up in order, and a card drops out with the next piece. It says a dark hallway display needs a diagnosis.",
      },
      {
        id: "after-dark",
        after: "dark",
        text: "The display flickers on when the answer is right, and a latch clicks. One last station stands by the window with a row of labeled devices.",
      },
      {
        id: "end",
        after: "end",
        text: "The lock opens and the cabinet door swings wide. The class carries out the batteries and bulbs for the investigation.",
      },
    ],
  },
  rooms: [
    {
      id: "bench",
      title: "The Materials Bench",
      narrative:
        "A bench holds six test materials next to a tester made of a battery and a bulb. A card says to sort each material by whether electric current flows through it.",
      gate: { needs: "conductors-insulators", label: "Sorting conductors and insulators" },
      puzzle: {
        type: "sort",
        prompt:
          "Sort each material by whether electric current can flow through it. Use the buttons under each card to place it.",
        bins: [
          { id: "b1", label: "Conductor: current flows through" },
          { id: "b2", label: "Insulator: current is blocked" },
        ],
        cards: [
          { id: "c1", text: "copper wire", bin: "b1", token: "A" },
          { id: "c2", text: "aluminum foil", bin: "b1", token: "B" },
          { id: "c3", text: "steel paper clip", bin: "b1", token: "C" },
          { id: "c4", text: "plastic straw", bin: "b2", token: "D" },
          { id: "c5", text: "rubber eraser", bin: "b2", token: "E" },
          { id: "c6", text: "dry wooden craft stick", bin: "b2", token: "F" },
        ],
        hints: [
          "Think about what each material is made of. Metals behave differently from plastic, rubber and wood.",
          "Think about what is used to cover the outside of a cord to keep people safe from the current.",
          "Metals let current through, so the thin or bendy ones still count. The materials that cover cords block it.",
        ],
        misconceptions: [
          {
            tag: "thin-means-insulator",
            has: ["c2:b2"],
            hint: "Thin or bendy does not decide whether current flows. Think about what the material is made of.",
          },
          {
            tag: "plastic-conducts",
            has: ["c4:b1"],
            hint: "Look at the outside of a cord or a charger. What material covers it, and why?",
          },
        ],
        model: {
          text: "An iron nail lets electric current flow because iron is a metal, so it is a conductor. A glass marble blocks the current, so it is an insulator. Decide by what the material is made of, not by its shape or color.",
        },
        transfer: {
          type: "sort",
          prompt: "Sort each material by whether electric current can flow through it.",
          bins: [
            { id: "b1", label: "Conductor: current flows through" },
            { id: "b2", label: "Insulator: current is blocked" },
          ],
          cards: [
            { id: "x1", text: "iron nail", bin: "b1", token: "P" },
            { id: "x2", text: "gold ring", bin: "b1", token: "Q" },
            { id: "x3", text: "glass marble", bin: "b2", token: "R" },
            { id: "x4", text: "foam cup", bin: "b2", token: "S" },
          ],
          hints: [
            "Think about what each material is made of.",
            "Metals let current flow through them.",
            "Glass and foam do not carry current.",
          ],
        },
        why: "Metals such as copper, aluminum and steel are conductors. Plastic, rubber and dry wood are insulators.",
        supports: sup(
          "Tap a button under each material to put it in a group. Decide by what the material is made of.",
          ["___ is a conductor because it is made of ___.", "___ is an insulator because it ___."],
          ["conductor", "insulator", "metal", "blocks"],
        ),
      },
      reveal:
        "A tray slides out with a brass key and a card stamped with six letters for the code.",
    },
    {
      id: "flow",
      title: "The Energy Path",
      narrative:
        "A wall diagram shows a battery connected by a wire to a light bulb. Four cards describe what happens to the energy, but they are out of order.",
      gate: { needs: "energy-transfer-sequence", label: "Ordering an energy transfer" },
      puzzle: {
        type: "order",
        prompt: "Put the four cards in the order that energy moves from the battery to the room.",
        endLabels: { start: "first", end: "last" },
        items: [
          { id: "a", text: "The battery stores energy.", token: "G", value: "1" },
          { id: "b", text: "Electric current carries the energy along the wire.", token: "L", value: "2" },
          { id: "c", text: "The bulb converts the electrical energy.", token: "O", value: "3" },
          { id: "d", text: "Light and heat spread into the room.", token: "W", value: "4" },
        ],
        answer: ["a", "b", "c", "d"],
        hints: [
          "Start by asking where the energy is before anything moves.",
          "The energy has to travel before the bulb can use it. Which card tells how it travels?",
          "Think about what must happen inside the bulb before anything can come out of it.",
        ],
        misconceptions: [
          {
            tag: "device-before-wire",
            has: ["c>b"],
            hint: "The bulb cannot use energy that has not reached it yet. What carries the energy to the bulb?",
          },
          {
            tag: "output-before-conversion",
            has: ["d>c"],
            hint: "The room only gets light and heat after the bulb has done something with the energy. What does the bulb do first?",
          },
        ],
        model: {
          text: "In a toy car, the battery stores energy, then electric current carries it to the motor, then the motor converts it into motion, and the wheels turn. Each step passes the energy on to the next one.",
        },
        transfer: {
          type: "order",
          prompt:
            "Put the four cards in the order that energy moves from the batteries to the hallway.",
          endLabels: { start: "first", end: "last" },
          items: [
            { id: "x", text: "The batteries store energy.", token: "H", value: "1" },
            { id: "y", text: "Electric current carries the energy along the wire.", token: "A", value: "2" },
            { id: "z", text: "The buzzer converts the electrical energy.", token: "L", value: "3" },
            { id: "w", text: "Sound spreads through the air.", token: "T", value: "4" },
          ],
          answer: ["x", "y", "z", "w"],
          hints: [
            "Start with where the energy is stored.",
            "The energy must travel along the wire before the buzzer can use it.",
            "Think about what the buzzer does before the sound spreads.",
          ],
        },
        why: "Energy starts stored in the battery, travels as electric current, is converted by the bulb and ends up as light and heat in the room.",
        supports: sup(
          "Use the Move up and Move down buttons to put the cards in order.",
          ["First, ___. Next, ___.", "Then ___. Finally, ___."],
          ["first", "next", "then", "finally"],
        ),
      },
      reveal: "The diagram lights up in order, and a card with four letters drops out of the wall.",
    },
    {
      id: "dark",
      title: "The Dark Hallway",
      narrative:
        "A student tests a flashlight with new batteries and a good bulb. The switch is on, but the bulb stays dark. When she wiggles a loose spring near one battery, the bulb flickers on.",
      gate: { needs: "open-circuit-diagnosis", label: "Explaining why a circuit stops" },
      puzzle: {
        type: "choice",
        prompt: "Which explanation best fits the evidence about the flashlight?",
        choices: [
          "The loose spring left a gap, so the circuit was open until the spring touched the battery.",
          "Wiggling the spring made new energy for the bulb.",
          "The bulb only works when it is shaken.",
          "New batteries must be taken out before the bulb can work.",
        ],
        answer: 0,
        tokens: ["K", "L", "M", "N"],
        hints: [
          "Think about what the circuit needs for the electric current to flow all the way around.",
          "The flashlight lit when the spring moved. What did moving the spring change about the loop?",
          "Look for the explanation that uses the evidence and does not say energy was made from nothing.",
        ],
        misconceptions: [
          {
            tag: "energy-is-created",
            pick: 1,
            hint: "Energy is not made from nothing. The batteries already held the energy; what stopped it from reaching the bulb?",
          },
          {
            tag: "magic-shaking",
            pick: 2,
            hint: "A bulb does not need shaking to work. Think about what the shaking changed in the circuit.",
          },
        ],
        model: {
          text: "A toy robot would not move after its battery cover was put back loosely. When a child pressed the cover down, the robot moved. Pressing made the metal contact touch the battery, so the loop was closed and the current could flow.",
        },
        transfer: {
          type: "choice",
          prompt:
            "A string of lights is dark. One bulb is loose in its socket, and pushing it in makes the whole string glow. Which explanation fits the evidence?",
          choices: [
            "The loose bulb left a gap in the circuit, so the current stopped until the bulb touched.",
            "Pushing the bulb in made the lights hotter, which gave them energy.",
            "The lights only work when someone touches them.",
          ],
          answer: 0,
          tokens: ["T", "U", "V"],
          hints: [
            "Think about what the circuit needs in order for current to flow.",
            "What did pushing the bulb in change about the loop?",
            "Choose the idea that explains the evidence with a gap in the path.",
          ],
        },
        why: "A loose connection leaves a gap, and an open circuit stops the electric current, so no energy reaches the bulb.",
        supports: sup(
          "Read the evidence, then choose the explanation that fits all of it.",
          ["The evidence shows that ___.", "I think the circuit was ___ because ___."],
          ["gap", "open circuit", "closed circuit", "evidence"],
        ),
      },
      reveal:
        "The hallway display flickers on and a latch clicks, with one letter stamped on its face.",
    },
    {
      id: "device",
      title: "The Device Room",
      narrative:
        "Six devices sit on a shelf by the window. Each one is connected to a battery circuit. A label asks which form of energy each device mainly gives out when the current reaches it.",
      gate: { needs: "energy-conversion-forms", label: "Naming the energy a device gives out" },
      puzzle: {
        type: "sort",
        prompt:
          "Sort each device by the main form of energy it gives out when electric current reaches it. Use the buttons under each card.",
        bins: [
          { id: "b1", label: "Sound" },
          { id: "b2", label: "Light" },
          { id: "b3", label: "Heat" },
        ],
        cards: [
          { id: "c1", text: "doorbell chime", bin: "b1", token: "S" },
          { id: "c2", text: "car horn", bin: "b1", token: "O" },
          { id: "c3", text: "reading lamp", bin: "b2", token: "L" },
          { id: "c4", text: "flashlight", bin: "b2", token: "F" },
          { id: "c5", text: "toaster", bin: "b3", token: "T" },
          { id: "c6", text: "stove burner", bin: "b3", token: "B" },
        ],
        hints: [
          "Ask what you can notice coming out of each device: a noise, a glow or warmth.",
          "The current brings energy in. The question is about the energy that comes out.",
          "Each device is built for one main job, and the job tells you the form of energy it gives out.",
        ],
        misconceptions: [
          {
            tag: "lamp-as-heat",
            has: ["c3:b3"],
            hint: "A bulb does get warm, but ask what the lamp is built to do for the person reading.",
          },
          {
            tag: "glow-means-light",
            has: ["c5:b2"],
            hint: "Look at what the toaster is built to do to the bread, not only at how it looks inside.",
          },
        ],
        model: {
          text: "To sort a device, ask what you can notice coming out of it and what it is built to do. A hair dryer is built to warm and dry, so heat is its main output, even though it also makes noise and moves air.",
        },
        transfer: {
          type: "sort",
          prompt: "Sort each device by the main form of energy it gives out.",
          bins: [
            { id: "b1", label: "Sound" },
            { id: "b2", label: "Light" },
            { id: "b3", label: "Heat" },
          ],
          cards: [
            { id: "x1", text: "alarm buzzer", bin: "b1", token: "P" },
            { id: "x2", text: "car headlight", bin: "b2", token: "Q" },
            { id: "x3", text: "electric kettle", bin: "b3", token: "R" },
            { id: "x4", text: "space heater", bin: "b3", token: "T" },
          ],
          hints: [
            "Ask what each device is built to do.",
            "Think about what you notice coming out of it.",
            "A device can give out more than one kind of energy, but it has one main job.",
          ],
        },
        why: "A chime and a horn convert electrical energy into sound, a lamp and a flashlight into light, and a toaster and a stove burner into heat.",
        supports: sup(
          "Tap a button under each device to put it in a group. Think about what comes out of it.",
          ["The ___ converts electrical energy into ___.", "I can tell because it ___."],
          ["convert", "sound", "light", "heat"],
        ),
      },
      reveal: "The labels slide into place and the shelf opens to show a card with the last letters of the code.",
    },
  ],
  door: {
    title: "The Cabinet Lock",
    prompt: "Type the code the label describes.",
    order: ["flow", "bench", "device", "dark"],
    success: "The lock turns and the supply cabinet door opens.",
  },
  reflection: {
    prompt:
      "Which room needed you to follow energy from one place to another, and how did you do it?",
    frames: {
      ee: ["I followed the energy in the ___ room.", "The energy went from ___ to ___."],
      dev: ["In the ___ room the energy went from ___ to ___.", "I knew because ___."],
      exp: ["In the ___ room, energy was transferred from ___ to ___ by ___."],
      br: ["The ___ room showed that energy is transferred by ___ and converted by ___ into ___."],
    },
  },
  review: { status: "authored", checks: {} },
  version: "1.0.0",
  updated: "2026-11-23",
  source: "Original - The Language Page",
};
