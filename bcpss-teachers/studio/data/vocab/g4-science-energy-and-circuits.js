// Vocabulary for "Energy Transfer and Simple Circuits" (grade 4 science). Original wording; every picture is a visual-kit spec.
// Spanish terms are flagged verified:false until a human reviews them.

/**
 * A simple circuit drawn from primitives (also used by the lesson pack).
 * opts: open (gap in the wire with the switch lever raised), device "bulb" | "buzzer", lit (rays or sound arcs),
 * arrows (direction marks on the wire), labels (text callouts), plastic (a plastic strip in the left wire).
 */
export const circuit = (alt, opts = {}) => {
  const {
    open = false,
    device = "bulb",
    lit = !open,
    arrows = false,
    labels = true,
    longDesc,
  } = opts;
  const items = [];
  const wire = (x1, y1, x2, y2) =>
    items.push({ t: "line", x1, y1, x2, y2, stroke: "navy", sw: 5, cap: "round" });
  wire(110, 80, 214, 80);
  wire(266, 80, 390, 80);
  wire(390, 80, 390, 230);
  wire(110, 80, 110, 128);
  wire(110, 182, 110, 230);
  if (open) {
    wire(110, 230, 190, 230);
    wire(290, 230, 390, 230);
    items.push({
      t: "line",
      x1: 190,
      y1: 230,
      x2: 280,
      y2: 196,
      stroke: "coral",
      sw: 6,
      cap: "round",
    });
    items.push({ t: "circle", cx: 190, cy: 230, r: 7, fill: "paper", stroke: "navy", sw: 3 });
    items.push({ t: "circle", cx: 290, cy: 230, r: 7, fill: "paper", stroke: "navy", sw: 3 });
  } else {
    wire(110, 230, 390, 230);
    items.push({ t: "circle", cx: 190, cy: 230, r: 7, fill: "navy" });
    items.push({ t: "circle", cx: 290, cy: 230, r: 7, fill: "navy" });
  }
  items.push({
    t: "rect",
    x: 88,
    y: 128,
    w: 44,
    h: 54,
    fill: "ochre",
    stroke: "navy",
    sw: 3,
    rx: 6,
  });
  items.push({ t: "text", x: 110, y: 150, text: "+", fill: "ink", size: 20, weight: 700 });
  items.push({ t: "text", x: 110, y: 174, text: "-", fill: "ink", size: 22, weight: 700 });
  if (device === "bulb") {
    items.push({
      t: "circle",
      cx: 240,
      cy: 80,
      r: 27,
      fill: lit ? "ochre" : "paper",
      stroke: "navy",
      sw: 4,
    });
    items.push({
      t: "path",
      d: "M228 90 L234 74 L240 88 L246 74 L252 90",
      stroke: "navy",
      sw: 2.5,
      fill: "none",
    });
    if (lit) {
      for (const [x1, y1, x2, y2] of [
        [240, 40, 240, 28],
        [212, 52, 203, 43],
        [268, 52, 277, 43],
        [204, 80, 190, 80],
        [276, 80, 290, 80],
      ]) {
        items.push({ t: "line", x1, y1, x2, y2, stroke: "ochre", sw: 4, cap: "round" });
      }
    }
  } else {
    items.push({
      t: "rect",
      x: 212,
      y: 56,
      w: 56,
      h: 48,
      fill: lit ? "sky" : "paper",
      stroke: "navy",
      sw: 4,
      rx: 10,
    });
    items.push({ t: "circle", cx: 240, cy: 80, r: 9, fill: "navy" });
    if (lit) {
      items.push({
        t: "path",
        d: "M282 66 Q294 80 282 94",
        stroke: "teal",
        sw: 4,
        fill: "none",
        cap: "round",
      });
      items.push({
        t: "path",
        d: "M294 56 Q314 80 294 104",
        stroke: "teal",
        sw: 4,
        fill: "none",
        cap: "round",
      });
    }
  }
  if (arrows && !open) {
    for (const p of [
      [330, 80, 346, 80, 0],
      [390, 150, 390, 166, 1],
      [180, 230, 164, 230, 2],
      [110, 110, 110, 96, 3],
    ]) {
      const [x, y, x2, y2, k] = p;
      items.push({ t: "line", x1: x, y1: y, x2, y2, stroke: "coral", sw: 4 });
      const head = [
        [
          [346, 80],
          [336, 74],
          [336, 86],
        ],
        [
          [390, 166],
          [384, 156],
          [396, 156],
        ],
        [
          [164, 230],
          [174, 224],
          [174, 236],
        ],
        [
          [110, 96],
          [104, 106],
          [116, 106],
        ],
      ][k];
      items.push({ t: "poly", points: head, fill: "coral" });
    }
  }
  if (labels) {
    items.push({ t: "text", x: 46, y: 160, text: "battery", fill: "ink", size: 15, weight: 700 });
    items.push({
      t: "text",
      x: 240,
      y: 134,
      text: device === "bulb" ? "bulb" : "buzzer",
      fill: "ink",
      size: 15,
      weight: 700,
    });
    items.push({ t: "text", x: 240, y: 262, text: "switch", fill: "ink", size: 15, weight: 700 });
    items.push({ t: "text", x: 424, y: 160, text: "wire", fill: "ink", size: 15, weight: 700 });
  }
  return { kind: "shapes", alt, w: 480, h: 290, ...(longDesc ? { longDesc } : {}), items };
};

const tableOf = (alt, head, rows) => ({ kind: "table", alt, w: 480, h: 200, head, rows });

const entry = (e, p) => ({
  ...e,
  practice: { visualPrompt: p[0], speakWrite: p[1], retrieval: p[2] },
});

export default {
  id: "g4-science-energy-and-circuits",
  title: "Energy Transfer and Simple Circuits",
  grade: "4",
  band: "3-5",
  subject: "science",
  curriculum: {
    status: "district-referenced",
    unitId: "g4-sci-u1",
    note: "Matches the Energy Transfer & Collisions unit in the BCPSS curriculum seed (the unit lists energy moving by sound, light, heat and electric circuits). Words, pictures and examples are original; lesson order within the unit is not taken from any program sequence.",
  },
  standards: ["4-PS3-2", "4-PS3-4"],
  entries: [
    entry(
      {
        id: "energy",
        word: "energy",
        pos: "noun",
        pron: "EN-er-jee",
        def: "What makes things move, glow, get warm or make sound.",
        visual: {
          kind: "scene",
          alt: "A sun shining, a bicycle and a lightbulb, three things that glow, move or warm things up",
          bg: "plain",
          w: 480,
          h: 240,
          items: [
            { icon: "sun", x: 40, y: 40, s: 110, label: "light, warmth" },
            { icon: "bicycle", x: 190, y: 40, s: 110, label: "moves" },
            { icon: "lightbulb", x: 350, y: 40, s: 110, label: "glows" },
          ],
        },
        context: "A moving bike has energy because it can push on things it hits.",
        nonExample: "A rock sitting on the ground is not using energy to move.",
        academicSentence:
          "Energy is what makes it possible for things to change, move, light up or warm up.",
        everyday: "Like the energy from breakfast that lets you run at recess.",
        es: {
          word: "energía",
          def: "Lo que hace que las cosas se muevan, brillen, se calienten o hagan sonido.",
          verified: false,
        },
        misconception:
          "Energy is not a thing you can hold in a jar; you notice it by what it makes happen.",
        related: ["energy-transfer", "convert"],
        tier: 2,
        domains: ["Speaking", "Writing"],
        klu: "Explain",
      },
      [
        "Which pictures show something using or giving off energy?",
        "Say two things in our classroom that use energy, then write what each one does.",
        "Which word names what makes things move, glow or get warm?",
      ],
    ),
    entry(
      {
        id: "energy-transfer",
        word: "energy transfer",
        pos: "noun phrase",
        pron: "EN-er-jee TRANS-fer",
        def: "Energy moving from one place or object to another.",
        visual: {
          kind: "flow",
          alt: "Four steps in a row: battery, wire, bulb, and light and heat, with arrows showing energy moving along",
          w: 480,
          h: 200,
          steps: [
            { label: "Battery", icon: "battery" },
            { label: "Wire", icon: "arrow-right" },
            { label: "Bulb", icon: "lightbulb" },
            { label: "Room", icon: "sun" },
          ],
        },
        context: "In a flashlight, there is an energy transfer from the batteries to the bulb.",
        nonExample: "A battery sitting alone on a shelf is not an example of energy moving.",
        academicSentence: "In an energy transfer, energy leaves one place and arrives in another.",
        es: {
          word: "transferencia de energía",
          def: "La energía que pasa de un lugar u objeto a otro.",
          verified: false,
        },
        misconception:
          "Energy is not used up when it transfers; it moves to another object or changes form.",
        related: ["energy", "electric-current", "convert"],
        tier: 3,
        domains: ["Speaking", "Writing"],
        klu: "Explain",
      },
      [
        "Which picture shows energy moving from one place to another?",
        "Say where energy starts and where it goes when a doorbell rings, then write it.",
        "Which words name energy moving from one place to another?",
      ],
    ),
    entry(
      {
        id: "battery",
        word: "battery",
        pos: "noun",
        pron: "BAT-er-ee",
        def: "A small container that stores energy and can push electricity through wires.",
        visual: { kind: "icon", alt: "A small cylinder with a plus mark at one end", name: "battery" },
        context: "The flashlight needs a new battery before it will shine.",
        nonExample: "A plain rubber band does not store energy that can light a bulb.",
        academicSentence:
          "A battery stores energy and starts the electric current when a circuit is complete.",
        everyday: "Like the batteries inside a remote control or a toy car.",
        es: {
          word: "batería (pila)",
          def: "Un recipiente pequeño que guarda energía y empuja la electricidad por los cables.",
          verified: false,
        },
        misconception:
          "A battery does not make energy from nothing; it stores energy in a form that can be released.",
        related: ["electric-current", "circuit"],
        tier: 2,
        domains: ["Reading", "Speaking"],
        klu: "Inform",
      },
      [
        "Which picture shows a battery?",
        "Say one device in your home that uses a battery, then write a sentence about it.",
        "Which word names the part that stores energy in a flashlight?",
      ],
    ),
    entry(
      {
        id: "electric-current",
        word: "electric current",
        pos: "noun phrase",
        pron: "ih-LEK-trik KER-unt",
        def: "Tiny charged pieces flowing along a wire, carrying energy with them.",
        visual: circuit(
          "A complete loop of wire joining a battery, a lit bulb and a closed switch, with coral arrows showing the current moving around the loop",
          {
            arrows: true,
            labels: false,
          },
        ),
        context: "The electric current moves through the wire and reaches the bulb.",
        nonExample: "Sound traveling through air is not an electric current.",
        academicSentence:
          "An electric current carries energy from the battery along the wire to the device.",
        es: {
          word: "corriente eléctrica",
          def: "Pequeñas partículas con carga que fluyen por un cable y llevan energía.",
          verified: false,
        },
        misconception:
          "Current needs a complete path; it does not leak out of a battery into the air.",
        related: ["circuit", "battery", "conductor"],
        tier: 3,
        domains: ["Reading", "Speaking"],
        klu: "Explain",
      },
      [
        "Which picture shows an electric current moving?",
        "Say how electric current gets from a battery to a bulb, then write it in a sentence.",
        "Which words name energy flowing along a wire?",
      ],
    ),
    entry(
      {
        id: "circuit",
        word: "circuit",
        pos: "noun",
        pron: "SER-kit",
        def: "A path that electricity can follow, starting and ending at the battery.",
        visual: circuit(
          "A loop of wire connecting a battery, a lit bulb and a switch, with each part labeled",
        ),
        context: "A circuit has a battery, wires and something like a bulb that uses the energy.",
        nonExample: "A single wire that touches only one end of a battery is not a circuit.",
        academicSentence:
          "A circuit is a path for electric current, and the parts must connect in a loop.",
        es: {
          word: "circuito",
          def: "Un camino que la electricidad puede seguir, que empieza y termina en la batería.",
          verified: false,
        },
        misconception: "A circuit is a loop; one wire from the battery to the bulb is not enough.",
        related: ["closed-circuit", "open-circuit", "switch"],
        tier: 2,
        domains: ["Reading", "Speaking"],
        klu: "Inform",
      },
      [
        "Which picture shows a circuit?",
        "Draw a simple circuit and say the name of each part.",
        "Which word names a loop that electricity can follow?",
      ],
    ),
    entry(
      {
        id: "closed-circuit",
        word: "closed circuit",
        pos: "noun phrase",
        pron: "KLOHZD SER-kit",
        def: "A loop with no gaps, so electricity can flow all the way around.",
        visual: circuit(
          "A complete loop with the switch lever lying flat on both contacts and the bulb glowing with rays around it",
          { labels: false },
        ),
        context: "When the switch is on, the closed circuit lets the bulb glow.",
        nonExample: "A loop with a gap in the wire is not a closed circuit.",
        academicSentence:
          "A closed circuit lets electric current flow, so energy reaches the bulb.",
        es: {
          word: "circuito cerrado",
          def: "Un circuito sin interrupciones, por donde la electricidad puede fluir.",
          verified: false,
        },
        misconception:
          "Closed does not mean the battery is sealed; it means the path has no break.",
        related: ["open-circuit", "switch", "electric-current"],
        tier: 3,
        domains: ["Speaking", "Writing"],
        klu: "Explain",
      },
      [
        "Which picture shows a closed circuit?",
        "Say what happens to the bulb in a closed circuit and why, then write it.",
        "Which words name a loop with no gaps?",
      ],
    ),
    entry(
      {
        id: "open-circuit",
        word: "open circuit",
        pos: "noun phrase",
        pron: "OH-pun SER-kit",
        def: "A loop with a gap in it, so electricity stops.",
        visual: circuit(
          "A loop with the switch lever lifted up so there is a gap in the bottom wire, and the bulb is dark with no rays",
          { open: true, labels: false },
        ),
        context: "The flashlight went dark because there was an open circuit.",
        nonExample: "A complete loop with a glowing bulb is not an open circuit.",
        academicSentence:
          "An open circuit has a gap, so the electric current cannot flow and no energy reaches the bulb.",
        es: {
          word: "circuito abierto",
          def: "Un circuito con una interrupción, por lo que la electricidad se detiene.",
          verified: false,
        },
        misconception:
          "The gap can be tiny and still stop everything; a loose wire counts as an open circuit.",
        related: ["closed-circuit", "switch", "insulator"],
        tier: 3,
        domains: ["Speaking", "Writing"],
        klu: "Explain",
      },
      [
        "Which picture shows an open circuit?",
        "Say two reasons a flashlight might not light, then write one.",
        "Which words name a loop that has a gap in it?",
      ],
    ),
    entry(
      {
        id: "switch",
        word: "switch",
        pos: "noun",
        pron: "SWICH",
        def: "A part that opens or closes a gap in a circuit.",
        visual: circuit(
          "A loop with a lever lifted away from one contact, creating a gap in the bottom wire",
          { open: true, labels: false },
        ),
        context: "She flipped the switch and the lamp turned on.",
        nonExample: "A battery does not open or close the path.",
        academicSentence: "A switch controls a circuit by closing or opening a gap in the wire.",
        everyday: "Like the light switch on the wall of a classroom.",
        es: {
          word: "interruptor",
          def: "Una pieza que abre o cierra un espacio en un circuito.",
          verified: false,
        },
        misconception:
          "Switch also means to change one thing for another; here it is a part of a circuit.",
        related: ["circuit", "closed-circuit", "open-circuit"],
        tier: 2,
        domains: ["Reading", "Speaking"],
        klu: "Inform",
      },
      [
        "Which part of the picture is the switch?",
        "Say how a switch changes what the bulb does, then write it.",
        "Which word names the part that opens or closes the loop?",
      ],
    ),
    entry(
      {
        id: "conductor",
        word: "conductor",
        pos: "noun",
        pron: "kun-DUK-ter",
        def: "A material that lets electric current flow through it.",
        visual: tableOf(
          "A table listing three materials, copper wire, aluminum foil and a steel paper clip, each marked yes for letting current flow",
          ["Material", "Lets current flow?"],
          [
            ["Copper wire", "Yes"],
            ["Aluminum foil", "Yes"],
            ["Steel paper clip", "Yes"],
          ],
        ),
        context: "Copper wire is a good conductor, so engineers use it inside cords.",
        nonExample: "A plastic straw is not a conductor.",
        academicSentence:
          "A conductor is a material that carries electric current, so metals are used for wires.",
        es: {
          word: "conductor",
          def: "Un material que deja pasar la corriente eléctrica.",
          verified: false,
        },
        misconception:
          "Not only copper wire conducts; many metals such as aluminum and steel do too.",
        related: ["insulator", "electric-current"],
        tier: 3,
        domains: ["Reading", "Writing"],
        klu: "Inform",
      },
      [
        "Which materials in the table are conductors?",
        "Name two conductors you could test and say what you predict, then write it.",
        "Which word names a material that lets current flow through it?",
      ],
    ),
    entry(
      {
        id: "insulator",
        word: "insulator",
        pos: "noun",
        pron: "IN-suh-lay-ter",
        def: "A material that does not let electric current flow through it.",
        visual: tableOf(
          "A table listing three materials, a plastic straw, a rubber band and a dry wooden stick, each marked no for letting current flow",
          ["Material", "Lets current flow?"],
          [
            ["Plastic straw", "No"],
            ["Rubber band", "No"],
            ["Dry wooden stick", "No"],
          ],
        ),
        context: "The plastic coating on a cord is an insulator that keeps people safe.",
        nonExample: "Aluminum foil is not an insulator because current can flow through it.",
        academicSentence: "An insulator blocks electric current, so it is used to cover wires.",
        es: {
          word: "aislante",
          def: "Un material que no deja pasar la corriente eléctrica.",
          verified: false,
        },
        misconception:
          "An insulator does not store the current; it simply stops it from flowing through.",
        related: ["conductor", "open-circuit"],
        morphology: {
          parts: [
            { part: "insul-", meaning: "island, set apart" },
            { part: "-ator", meaning: "one that does" },
          ],
        },
        tier: 3,
        domains: ["Reading", "Writing"],
        klu: "Inform",
      },
      [
        "Which materials in the table are insulators?",
        "Say why a cord is covered with plastic, then write one sentence.",
        "Which word names a material that blocks current?",
      ],
    ),
    entry(
      {
        id: "convert",
        word: "convert",
        pos: "verb",
        pron: "kun-VERT",
        def: "To change energy from one form into another form.",
        visual: {
          kind: "flow",
          alt: "Three boxes in a row: electrical energy goes into a bulb, and light and heat come out",
          w: 480,
          h: 200,
          steps: [
            { label: "Electrical energy", icon: "battery" },
            { label: "Bulb", icon: "lightbulb" },
            { label: "Light and heat", icon: "sun" },
          ],
        },
        context: "A bulb can convert electrical energy into light and heat.",
        nonExample: "To carry water in a bucket is not to convert energy.",
        academicSentence:
          "A device converts energy when the energy that goes in is a different form from the energy that comes out.",
        es: {
          word: "convertir",
          def: "Cambiar la energía de una forma a otra forma.",
          verified: false,
        },
        misconception: "Energy is converted, not destroyed: the total amount stays the same.",
        related: ["energy", "energy-transfer", "thermal-energy"],
        tier: 3,
        domains: ["Speaking", "Writing"],
        klu: "Explain",
      },
      [
        "Which picture shows energy being changed into another form?",
        "Say what a buzzer converts electrical energy into, then write it.",
        "Which word means to change energy from one form into another?",
      ],
    ),
    entry(
      {
        id: "thermal-energy",
        word: "thermal energy",
        pos: "noun phrase",
        pron: "THER-mul EN-er-jee",
        def: "The energy that makes things warm or hot, also called heat.",
        visual: {
          kind: "scene",
          alt: "A glowing lightbulb beside a thermometer with its red liquid high, showing a bulb that has warmed the air near it",
          bg: "plain",
          w: 480,
          h: 240,
          items: [
            { icon: "lightbulb", x: 70, y: 40, s: 120, label: "bulb gives off heat" },
            { icon: "thermometer", x: 300, y: 40, s: 120, label: "temperature goes up" },
          ],
        },
        context: "A light bulb gives off thermal energy, so it feels warm after it has been on.",
        nonExample:
          "A cold ice cube sitting in a freezer does not give off thermal energy to your hand.",
        academicSentence:
          "Thermal energy moves from a warmer object to a cooler one, so the cooler object heats up.",
        es: {
          word: "energía térmica",
          def: "La energía que hace que las cosas estén tibias o calientes.",
          verified: false,
        },
        misconception:
          "Cold is not a kind of energy that moves; thermal energy moves from warm to cool.",
        related: ["energy-transfer", "convert"],
        tier: 3,
        domains: ["Reading", "Speaking"],
        klu: "Inform",
      },
      [
        "Which picture shows thermal energy?",
        "Say what warmed up when a bulb stayed on, then write a sentence with 'because'.",
        "Which words name the energy that makes things warm?",
      ],
    ),
  ],
  review: { status: "authored", checks: {} },
};
