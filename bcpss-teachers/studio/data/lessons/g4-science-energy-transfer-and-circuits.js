// Lesson pack: Energy Transfer and Simple Circuits (grade 4 science). Original text and tasks; every science claim is a grade 4 standard idea.
import { circuit } from "../vocab/g4-science-energy-and-circuits.js";

const fr = (ee, dev, exp, br = []) => ({ ee, dev, exp, br });

const lit = circuit(
  "A complete loop of wire joining a battery, a glowing bulb and a closed switch, with coral arrows showing the electric current moving around the loop",
  { arrows: true },
);
const dark = circuit(
  "A loop with the switch lever lifted up so there is a gap in the bottom wire, and the bulb dark with no rays",
  { open: true },
);
const buzz = circuit(
  "A complete loop of wire joining a battery, a buzzer with sound arcs beside it and a closed switch",
  { device: "buzzer" },
);

export default {
  id: "g4-science-energy-transfer-and-circuits",
  kind: "lesson",
  title: "Energy Transfer and Simple Circuits",
  subtitle:
    "Follow energy from a battery through a circuit, test conductors and insulators, and design a device that converts energy",
  grade: "4",
  band: "3-5",
  subject: "science",
  duration: 55,
  curriculum: {
    status: "district-referenced",
    unitId: "g4-sci-u1",
    program: "BCPSS SABES 5E Science",
    note: "Matches the Energy Transfer & Collisions unit in the BCPSS curriculum seed (the unit lists energy moving by sound, light, heat and electric circuits; its seed standards include 4-PS3-2 and 4-PS3-4). Text, investigation and tasks are original; the order of lessons within the unit is not taken from any program sequence.",
  },
  standards: ["4-PS3-2", "4-PS3-4"],
  wida: {
    eld: ["ELD-SC"],
    klus: ["Explain", "Inform"],
    domains: ["Speaking", "Writing", "Reading"],
    cluster: "4-5",
  },
  contentObjective:
    "I can explain how a simple circuit transfers energy from a battery to a bulb or buzzer, and use evidence from a test to show why a gap or an insulator stops the transfer.",
  languageObjective:
    "I can explain how energy moves in a circuit by using 'first, next, then, finally' and 'because the circuit is open' or 'because the material is an insulator'.",
  languageDemands: {
    functions: [
      "sequence a process",
      "explain cause and effect",
      "support a claim with evidence from a test",
    ],
    structures: [
      "First, the ___ stores energy. Next, the ___ carries it. Then the ___ converts it.",
      "The bulb did not light because ___.",
      "My evidence is that ___, so I think ___.",
    ],
    discourse:
      "Two-turn partner explanation (claim, then evidence), then a written explanation of one test result using 'because'.",
    barriers: [
      "'current' also means happening now, and 'charge' is also a price",
      "'conductor' also names a person who leads a band or checks train tickets",
      "'switch' also means to change one thing for another, and 'closed switch' means the circuit is on, which feels backwards",
      "'circuit' sounds like a race track, and 'open' and 'closed' reverse the everyday idea of an open door",
      "'transfer' and 'convert' both describe change but mean moving versus changing form",
    ],
    oralRehearse: [
      "The battery stores energy, the current carries it along the wire, and the bulb converts it into light and heat.",
      "The bulb did not light because the circuit was open, so the current could not flow.",
    ],
    writeScaffold:
      "In my test, ___ made the bulb light and ___ did not. My evidence is that ___. I think the ___ is a conductor because ___.",
  },
  vocab: {
    collection: "g4-science-energy-and-circuits",
    ids: [
      "energy",
      "energy-transfer",
      "battery",
      "electric-current",
      "circuit",
      "closed-circuit",
      "open-circuit",
      "switch",
      "conductor",
      "insulator",
      "convert",
      "thermal-energy",
    ],
  },
  launch: {
    title: "Notice and Wonder: the dark bulb",
    visual: dark,
    prompts: [
      "What do you notice about this picture? Which parts can you name?",
      "What do you wonder about why the bulb is dark?",
      "What could you change so the bulb would light up? What would stay the same?",
    ],
    teacherNote:
      "Show the picture without the word 'circuit' first. Take two noticings (for example 'the switch is up' or 'there is a space in the wire') and one wondering. Record the students' own words for the gap; they become the first entries on the energy chart. Ask students to predict what would happen to the bulb if the lever touched both dots. Collect predictions in a quick tally and revisit them at the end of the lesson. Do not give the word 'open circuit' yet.",
  },
  teach: {
    model: [
      "Energy is what makes things move, glow, get warm or make sound. Energy can also move from one place to another. This is called energy transfer. Energy can be transferred by sound, by light, by heat and by electric current.",
      "A circuit is a path that electric current can follow. A simple circuit has a battery, wires and a device, such as a bulb or a buzzer, joined in one loop. The battery stores energy. When the loop is complete, electric current carries that energy along the wires to the device. This is a closed circuit.",
      "If the loop has a gap, the electric current stops and the device does nothing. This is an open circuit. A switch works by closing or opening a gap in the loop. Closed means the circuit is on; open means it is off. The current is not used up as it goes around. It carries energy to the device, and the device uses the energy.",
      "A conductor is a material that lets electric current flow through it. Metals such as copper, aluminum and steel are conductors, so they are used for wires. An insulator is a material that does not let current flow. Plastic, rubber and dry wood are insulators, so they cover wires to keep people safe. A material in the path decides whether the circuit can transfer energy.",
      "A device converts energy when the energy that goes in is a different form from the energy that comes out. A bulb converts electrical energy into light and heat, so it feels warm. A buzzer converts electrical energy into sound. A battery stores energy; it does not make energy from nothing. Engineers design devices by choosing the parts that convert energy into the form they need.",
    ],
    moves: [
      "Say it in sequence every time: 'First the battery stores energy. Next the current carries it. Then the device converts it.' Have students echo and use gestures: hands cupped for store, sweeping motion for carry, a twist for convert.",
      "Always draw the loop. Trace the path of the current with a finger from the battery, along the wire, through the device and back. Ask 'Is the path complete anywhere there is a gap?'",
      "Ask for evidence before explanations: 'What did you see? Which part of the test shows that?' Keep a two-column chart with 'what we saw' and 'what it tells us'.",
      "Say 'closed means on' and 'open means off' together with a door that is shut or has a gap. Keep the words near the picture of each.",
      "Plant a wrong idea on purpose, such as 'the battery makes energy' or 'current is used up', and let students test it with the evidence.",
      "Use full sentences for explanations: 'The bulb did not light because ___'. Reject a bare 'it is broken'.",
    ],
  },
  guided: [
    {
      id: "g1",
      type: "choice",
      prompt:
        "A battery, a bulb and a switch are connected in a loop by copper wires. The switch is closed. What will happen to the bulb?",
      choices: [
        "It will light, because the circuit is complete and electric current can flow.",
        "It will stay dark, because a closed switch stops the current.",
        "It will light only if the switch is open.",
        "It will stay dark, because the battery cannot send energy through copper.",
      ],
      answer: 0,
      hint: "Trace the loop with your finger. Is there a gap anywhere, and does copper let current through?",
      supports: {
        ee: {
          frames: ["The loop is ___.", "The current can ___."],
          wordBank: ["complete", "closed", "current", "flow", "bulb"],
          visual: lit,
          oral: "Point to the battery, then follow the wire with your finger back to the battery.",
        },
        dev: {
          frames: ["The bulb will light because the circuit is ___ and ___."],
          wordBank: ["closed circuit", "electric current"],
        },
        exp: { frames: ["The bulb will ___ because ___, so energy ___."] },
        br: {},
      },
    },
    {
      id: "g2",
      type: "choice",
      prompt:
        "A student replaces one copper wire with a plastic straw cut to the same length. The bulb goes dark. Which statement is the best explanation?",
      choices: [
        "Plastic is an insulator, so it blocks the electric current and the circuit cannot transfer energy.",
        "Plastic is a conductor, but the straw is too short.",
        "The straw makes the battery run out of energy.",
        "Copper is the only material that can carry electric current.",
      ],
      answer: 0,
      hint: "Think about what plastic is used for on the outside of cords. What does that tell you about how it treats current?",
      supports: {
        ee: {
          frames: ["Plastic is an ___.", "The current is ___."],
          wordBank: ["insulator", "conductor", "blocks", "path"],
        },
        dev: {
          frames: ["The bulb went dark because ___ is an ___, so the current ___."],
          wordBank: ["insulator", "block", "transfer"],
        },
        exp: { frames: ["The evidence is that ___, so I think ___ because ___."] },
        br: {},
      },
    },
    {
      id: "g3",
      type: "short",
      prompt:
        "A doorbell uses a battery and a buzzer. Put the steps in order using first, next, then and finally: start with the battery and end with your ears.",
      answer:
        "First the battery stores energy. Next electric current carries the energy along the wire. Then the buzzer converts the electrical energy into sound. Finally the sound travels through the air to your ears.",
      hint: "Ask where the energy is first, how it travels, what the buzzer does, and how the result reaches you.",
      supports: {
        ee: {
          frames: [
            "First, the ___ stores energy.",
            "Next, the ___ carries it.",
            "Then, the ___ makes ___.",
          ],
          wordBank: ["battery", "current", "buzzer", "sound", "ears"],
        },
        dev: {
          frames: ["First, ___. Next, ___. Then, ___. Finally, ___."],
          wordBank: ["stores", "carries", "converts", "travels"],
        },
        exp: { frames: ["The energy starts ___ and ends as ___ because ___."] },
        br: {},
      },
    },
    {
      id: "g4",
      type: "short",
      prompt:
        "A bulb in a working circuit feels warm after it has been on for a few minutes. What form of energy is the warmth, and where did that energy come from?",
      answer:
        "The warmth is thermal energy, or heat. It came from the electrical energy the bulb received from the battery; the bulb converted some of it into heat as well as light.",
      hint: "Think about what the bulb receives and what it gives out. The bulb gives out more than one thing.",
      supports: {
        ee: {
          frames: ["The warm bulb gives off ___.", "The energy came from the ___."],
          wordBank: ["thermal energy", "heat", "battery", "light"],
        },
        dev: {
          frames: ["The bulb converts ___ energy into ___ and ___."],
          wordBank: ["convert", "thermal energy", "electrical energy"],
        },
        exp: { frames: ["The warmth is ___ energy, which came from ___ because ___."] },
        br: {},
      },
    },
    {
      id: "g5",
      type: "choice",
      prompt:
        "A group tests four materials in a circuit. The bulb lights with the aluminum foil and with the iron nail. It stays dark with the plastic straw and with the rubber eraser. Which claim does the evidence support?",
      choices: [
        "The foil and the nail are conductors, and the straw and the eraser are insulators.",
        "All metals make the bulb light.",
        "Only shiny materials can be conductors.",
        "The straw and the eraser are broken.",
      ],
      answer: 0,
      hint: "Which claim talks only about the four materials that were tested?",
      supports: {
        ee: {
          frames: ["The bulb lit with the ___ and the ___.", "The bulb stayed dark with the ___."],
          wordBank: ["conductor", "insulator", "evidence", "tested"],
        },
        dev: {
          frames: ["The evidence shows that ___ is a conductor because ___."],
          wordBank: ["evidence", "claim", "tested"],
        },
        exp: { frames: ["My claim is ___, and my evidence is that ___."] },
        br: {},
      },
    },
  ],
  collaborate: {
    title: "Investigation: light it, then break it",
    task: "Each pair gets one battery in a holder, one small bulb in a holder, three wires with clips, and five test materials (copper wire, aluminum foil strip, steel paper clip, plastic straw, rubber band). Use only the batteries from the kit and never a wall outlet. Partner A builds a circuit that lights the bulb. Partner B records the test materials in a two-column table: predict first, then test each one in the path and record whether the bulb lit. Then they take the circuit apart one connection at a time and record which gap turns the bulb off. Together they write one sentence about which materials are conductors and one sentence about what a gap does.",
    roles: ["Circuit builder", "Recorder"],
    discussionCards: [
      {
        prompt:
          "Which materials did you predict would let the bulb light, and what did your test show?",
        frame: "I predicted ___ would ___, and the test showed ___.",
      },
      {
        prompt: "What happened when you made a gap in the circuit, and why?",
        frame: "When I made a gap, the bulb ___ because the electric current could not ___.",
      },
      {
        prompt:
          "How do you know the energy was transferred? Name the starting place and the ending place.",
        frame: "The energy went from the ___ to the ___ through the ___.",
      },
    ],
  },
  threeWays: {
    see: {
      title: "See it: energy moving around the loop",
      visualOrModel: lit,
      teacherNote:
        "Place this picture beside the dark-bulb picture from the launch. Ask students to find the difference (the switch lever and the gap) and say what it did. Then trace the coral arrows with a finger and ask where the energy starts (the battery) and where it ends (the bulb). Show the buzzer circuit beside it and ask what is the same and what is different.",
    },
    discuss: {
      title: "Say it: claim, evidence and reasoning",
      structure:
        "Turn and talk. Partner 1 makes a claim about a circuit, gives one piece of evidence from the test, and explains why the evidence supports the claim. Partner 2 asks 'How do you know?' and restates the reasoning. Swap.",
      frames: [
        "My claim is that ___.",
        "How do you know?",
        "My evidence is that ___, because ___.",
        "So you are saying that ___.",
      ],
    },
    apply: {
      title: "Design it: a classroom doorbell",
      task: "Your team has a battery, wires, a switch (a clothespin with two foil strips) and a buzzer. Design a circuit for a doorbell that sounds only when the button is pressed. Draw your circuit and label the battery, wires, switch and buzzer. Predict what will happen when the switch is open and when it is pressed. Build and test it. If it does not work, use the evidence to find the gap or the insulator and fix it. Then write the energy path using first, next, then and finally.",
      successCriteria: [
        "My drawing shows a complete loop with every part labeled.",
        "I predict and then record what happens when the switch is open and when it is closed.",
        "I name the energy that is stored, the energy that is carried and the energy that comes out.",
        "I use evidence from my test to explain one change I made.",
      ],
    },
  },
  activities: [
    { engine: "concept-builder", id: "g4-science-circuit-model" },
    { engine: "escape-challenge", id: "g4-science-energy-escape" },
    { engine: "vocab-quest", id: "g4-science-energy-words-quest" },
  ],
  independent: {
    items: [
      {
        id: "i1",
        type: "choice",
        prompt: "Which of these is a conductor of electric current?",
        choices: ["aluminum foil", "plastic spoon", "rubber glove", "dry wooden stick"],
        answer: 0,
        explain:
          "Aluminum is a metal, and metals let electric current flow. Plastic, rubber and dry wood are insulators.",
      },
      {
        id: "i2",
        type: "choice",
        prompt:
          "A flashlight does not light. The batteries are new and the bulb is good. What should you check first?",
        choices: [
          "Whether every part touches the next so that the loop is complete",
          "Whether the room is warm",
          "Whether the flashlight is heavy",
          "Whether the batteries are the same color",
        ],
        answer: 0,
        explain:
          "A gap or a loose connection makes an open circuit, which stops the current even when the parts are good.",
      },
      {
        id: "i3",
        type: "short",
        prompt:
          "A toy car runs on a battery and a motor. Describe the energy transfer: where does the energy start, how does it move, and what form does it become?",
        answer:
          "The energy starts stored in the battery, moves as an electric current through the wires to the motor, and the motor converts it into motion (and a little heat).",
        explain:
          "The path is battery, then wire (electric current), then motor, which converts electrical energy into motion.",
      },
      {
        id: "i4",
        type: "choice",
        prompt: "A switch is open. What does the open switch do to the circuit?",
        choices: [
          "It makes a gap, so electric current cannot flow.",
          "It makes more electric current flow.",
          "It stores extra energy.",
          "It turns the bulb into a conductor.",
        ],
        answer: 0,
        explain:
          "An open switch leaves a gap in the loop, which makes an open circuit and stops the current.",
      },
      {
        id: "i5",
        type: "choice",
        prompt: "Which device changes electrical energy mainly into sound?",
        choices: ["buzzer", "lamp", "toaster", "battery"],
        answer: 0,
        explain:
          "A buzzer converts electrical energy into sound. A lamp makes light and a toaster makes heat. A battery stores energy.",
      },
      {
        id: "i6",
        type: "short",
        prompt:
          "A classmate says 'A battery makes energy.' Use what you know about batteries and circuits to correct the statement.",
        answer:
          "A battery does not make energy from nothing. It stores energy and lets it go when the circuit is complete, and the energy is transferred to a device that converts it into another form.",
        explain:
          "A battery stores energy; the current carries it to the device, which converts it.",
      },
      {
        id: "i7",
        type: "short",
        prompt:
          "Explain why a circuit with a plastic strip in the path will not light a bulb even when the switch is closed and the batteries are new.",
        answer:
          "Plastic is an insulator, so it blocks the electric current. The loop is not complete for the current, so no energy is transferred to the bulb.",
        explain:
          "A closed switch and good batteries are not enough if an insulator blocks the path.",
      },
    ],
  },
  formative: {
    items: [
      {
        id: "f1",
        type: "choice",
        prompt: "What does a bulb convert electrical energy into?",
        choices: ["light and heat", "sound only", "chemical energy", "motion only"],
        answer: 0,
        explain:
          "A bulb gives off light, and it also gets warm, so it converts electrical energy into light and heat.",
      },
      {
        id: "f2",
        type: "choice",
        prompt: "Which statement describes a closed circuit?",
        choices: [
          "A loop with no gaps, so electric current can flow all the way around",
          "A loop with a gap that stops the electric current",
          "A battery with no wires attached",
          "A bulb that has burned out",
        ],
        answer: 0,
        explain:
          "In a closed circuit the loop is complete, so the current can carry energy to the device.",
      },
      {
        id: "f3",
        type: "short",
        prompt: "Name one conductor and one insulator, and say how you know which is which.",
        answer:
          "Copper wire is a conductor and a plastic straw is an insulator. I know because the bulb lights when copper is in the path and stays dark when plastic is in the path.",
        explain: "Evidence from a test shows which materials let current flow.",
      },
    ],
  },
  exitTicket: {
    prompt: "Show what you can explain about energy and circuits.",
    items: [
      {
        id: "e1",
        type: "choice",
        prompt: "Which statement describes an open circuit?",
        choices: [
          "A loop with a gap, so no electric current flows",
          "A loop with no gaps, so electric current flows",
          "A bulb that gives off heat",
          "A battery that stores energy",
        ],
        answer: 0,
        explain: "An open circuit has a gap, so the electric current stops.",
      },
      {
        id: "e2",
        type: "choice",
        prompt:
          "A circuit with a battery, wires and a buzzer is complete. What does the buzzer do with the energy?",
        choices: [
          "It converts electrical energy into sound.",
          "It stores the energy for later.",
          "It makes new energy.",
          "It blocks the energy.",
        ],
        answer: 0,
        explain:
          "The buzzer receives electrical energy through the current and converts it into sound.",
      },
      {
        id: "e3",
        type: "short",
        prompt:
          "Describe a circuit that makes a buzzer sound. Name the parts and use first, next and then to tell how the energy moves.",
        answer:
          "The circuit has a battery, wires, a switch and a buzzer in a closed loop. First the battery stores energy. Next the electric current carries it along the wires. Then the buzzer converts the electrical energy into sound.",
        explain:
          "A complete loop with a battery, a path of conductors and a buzzer transfers and converts the energy.",
      },
    ],
    successCriteria: [
      "I named the parts of a complete circuit.",
      "I told how the energy moves and changes form.",
      "I used first, next and then, or because, in my explanation.",
    ],
  },
  answerKey: {
    notes:
      "Accept any answer that follows the evidence. For the short answers (g3, g4, i3, i6, i7, f3, e3) look for the idea: the battery stores energy, the electric current carries it along a conductor, the device converts it into another form, and a gap or an insulator stops the transfer. Do not require exact wording. Do not accept 'the battery makes energy' or 'the current is used up'. For g5 the evidence supports a claim about the four tested materials only; it does not prove anything about all metals.",
    items: {
      g1: "It will light, because the circuit is complete and electric current can flow.",
      g2: "Plastic is an insulator, so it blocks the electric current and the circuit cannot transfer energy.",
      g3: "First the battery stores energy. Next electric current carries it along the wire. Then the buzzer converts it into sound. Finally the sound travels through the air to your ears.",
      g4: "Thermal energy (heat). The bulb converts some of the electrical energy from the battery into heat as well as light.",
      g5: "The foil and the nail are conductors, and the straw and the eraser are insulators. The evidence is about the four materials tested.",
      i1: "Aluminum foil. Metals are conductors.",
      i2: "Check that every part touches the next so the loop is complete. A gap makes an open circuit.",
      i3: "The energy is stored in the battery, moves as electric current through the wires to the motor, and the motor converts it into motion and a little heat.",
      i4: "It makes a gap, so electric current cannot flow.",
      i5: "A buzzer converts electrical energy mainly into sound.",
      i6: "A battery stores energy and releases it when the circuit is complete. It does not make energy from nothing.",
      i7: "Plastic is an insulator, so it blocks the current even if the switch is closed and the batteries are new.",
      f1: "Light and heat.",
      f2: "A loop with no gaps, so electric current can flow all the way around.",
      f3: "Example: copper wire is a conductor and a plastic straw is an insulator, because the bulb lit with one and stayed dark with the other.",
      e1: "A loop with a gap, so no electric current flows.",
      e2: "It converts electrical energy into sound.",
      e3: "A closed loop with a battery, wires, a switch and a buzzer: the battery stores energy, the current carries it, and the buzzer converts it into sound.",
    },
  },
  extension: {
    title: "Why do cords have two parts?",
    task: "Look at a picture of a cord such as a phone charger cable (do not open a real cord). The inside is made of metal and the outside is covered with plastic or rubber. Explain why each material is the right choice, using the words conductor and insulator. Then predict what would go wrong if the cord were covered with metal instead, and write a sentence that uses 'because'.",
  },
  homeLanguage: {
    es: {
      objective:
        "Puedo explicar cómo un circuito sencillo transfiere energía de una batería a un foco o a un timbre.",
      vocab: [
        { en: "energy", es: "energía", verified: false },
        { en: "battery", es: "batería (pila)", verified: false },
        { en: "circuit", es: "circuito", verified: false },
        { en: "electric current", es: "corriente eléctrica", verified: false },
        { en: "conductor", es: "conductor", verified: false },
        { en: "insulator", es: "aislante", verified: false },
      ],
      familyPrompt:
        "Busquen en casa un aparato que funcione con pilas, como un control remoto o una linterna. Digan de dónde viene la energía y qué forma de energía sale del aparato: luz, sonido o movimiento. Nunca prueben nada con los enchufes de la pared.",
    },
  },
  printables: ["organizer", "task-cards", "exit-ticket", "vocab-mat"],
  teacherNotes: {
    pacing:
      "Launch 6 minutes. Teach and guided practice 15. Hands-on investigation or the circuit model 18 (the circuit model first, the escape challenge the next day). Exit ticket 7. Closing claim-and-evidence share 4. If time is short, run the circuit model and move the investigation or the escape challenge to the next day.",
    safety:
      "Use only 1.5 volt batteries from the kit with small flashlight bulbs or buzzers. Never connect anything to a wall outlet and never use a battery that is hot, leaking or damaged. Do not connect a wire directly from one end of a battery to the other, because the wire and the battery can get hot. Collect and count all batteries at the end of the lesson.",
    misconceptions: [
      "The battery makes energy: students say batteries create energy. Say that a battery stores energy and releases it when the circuit is complete.",
      "Current is used up: students think less current comes back to the battery than left it. Say the current carries energy around the loop, and the device uses the energy, not the current.",
      "One wire is enough: students try to light a bulb with one wire from the battery. Have them trace the loop and find where the path stops.",
      "Closed means off: students think a closed switch keeps the current in. Practice 'closed means on' with a door that is shut and a path that is complete.",
      "Only wires conduct: students believe only copper wire carries current. Test foil, a paper clip and a nail.",
      "All shiny things conduct, or all metals conduct the same: students over-generalize from one or two tests. Ask which materials the evidence actually covers.",
    ],
    differentiation:
      "Entering and Emerging learners use the frames, the word banks, gestures and the circuit pictures, point to parts while speaking, and keep the same tasks and answers as every other tier. Expanding and Bridging learners justify claims with evidence and critique a wrong explanation in complete sentences. Never reduce the science; reduce only the language load.",
    languageNotes:
      "Teach 'store', 'carry' and 'convert' with gestures before the written words. Name the two meanings of 'current', 'conductor' and 'switch' on the chart. Practice 'closed means on, open means off' while holding a door. Pair 'insulator' with a picture of a cord's plastic cover.",
  },
  review: { status: "authored", checks: {} },
  version: "1.0.0",
  updated: "2026-11-23",
  source: "Original - The Language Page",
};
