// Paper-based substitutes for physical classroom materials (audit F-16, decision D3 default: classroom activities).
// An activity is rewritten ONLY when (a) every physical entry has a substitute below, (b) its title, mission and payload
// never mention a physical object (so nothing in the lesson content contradicts the new material list), and
// (c) after the phrase rewrites its materials, tip and support contain no manipulative word. Anything else stays as it
// is and is listed in the proposals file for a human decision. Everything rewritten is DRAFT (not reviewed).

export const MATERIAL_SUBSTITUTES = {
  Cubes: "Paper for drawing squares",
  Counters: "Paper for drawing dots",
  "Red and blue counters": "Paper and red and blue crayons for drawing dots",
  "Ten-sticks and cubes": "Paper for drawing tens and ones",
  "Tens rods": "Paper for drawing tens",
  "Ones cubes": "Paper for drawing ones",
  "Letter tiles": "Letter cards",
};

/** Proposed substitutes for entries that are NOT applied automatically (the lesson content relies on the object). */
export const PROPOSED_ONLY = {
  "Linking cubes":
    "Printed strip of equal squares to measure with (the measuring lesson needs a unit that can be counted)",
  "Shape blocks":
    "Printed shape cards with solid shapes drawn from two views (changes the flat-versus-solid contrast, teacher decision)",
  "Real objects": "Picture cards of everyday objects",
  "Real shapes": "Picture cards of solid shapes",
  "Solid shapes": "Picture cards of solid shapes, each labeled with its name",
  "Base-ten blocks (optional)": "Printed base-ten drawings (tens sticks and ones squares)",
  Flashlight:
    "Teacher draws a light beam on the board and students predict on paper (the see-through test needs the real light)",
  "Wax paper": "Keep: paper-like classroom material, or use a labeled picture card",
  Cardboard: "Picture card",
  "Clear plastic wrap": "Picture card",
  "Three test materials": "Three picture cards of the test materials",
  "A ball": "A paper ball (crumpled sheet) or a picture card",
  "Two rocks": "Picture cards of a rock in sun and in shade",
  "An orange": "A picture card of an orange",
  "Sunflower seeds": "Picture cards of the seed stages",
  "A jar and play coins": "A drawn jar and coin cards on paper",
  "Bee puppet": "A drawn bee on paper",
  "A small drum or an upside-down bucket": "Tap the desk; no object needed",
  "Three bins or boxes": "Three labeled sheets of paper to sort onto",
  Whistle: "Voice only",
  "Tray of soil": "Picture cards of the soil stages",
  "Cup of water": "Picture cards of the water stages",
  Spoon: "Picture card of a spoon",
  "Globe or map": "Map (printed); the globe is optional",
  "A bag with a few classroom objects": "A bag of picture cards of classroom objects",
  "A few classroom objects": "Picture cards of classroom objects",
  "Calculators (optional)": "Remove (the entry is optional and the task works by hand)",
  "Paper clips": "Drawn paper clips or picture cards",
};

/** [pattern, replacement] applied to tip/support strings of applicable activities, in order. */
export const PHRASES = [
  [/act it out with cubes/g, "draw it with squares"],
  [/act them out with cubes/g, "draw them with squares"],
  [/act out the (\w+) with cubes/g, "draw the $1 as squares"],
  [/act out the (\w+) with counters/g, "draw the $1 as dots"],
  [/build the cups with cubes/g, "draw the cups as squares"],
  [/use fingers or counters/g, "use fingers or drawn dots"],
  [/use cubes to check/g, "draw squares to check"],
  [/build one with cubes/g, "draw one with squares"],
  [/show it with counters/g, "draw it as dots"],
  [/build each number to check/g, "draw each number to check"],
  [
    /Use counters on a ten frame; children act out each step/g,
    "Draw dots on a printed ten frame; children act out each step",
  ],
  [
    /Use rods and cubes; children build each number and act out each step/g,
    "Draw tens sticks and ones squares; children draw each number and act out each step",
  ],
  [/children draw tens rods and ones cubes/g, "children draw tens sticks and ones squares"],
  [/Children may build with rods first/g, "Children may draw tens sticks first"],
  [/children build the problem with sticks first/g, "children draw the problem with sticks first"],
  [
    /let children build the number with sticks/g,
    "let children draw the number with sticks and squares",
  ],
  [
    /Children act out each step with sticks and cubes/g,
    "Children draw each step with sticks and squares",
  ],
  [/Move a cube away for each/g, "Cross out a square for each"],
  [/Move a cube for each/g, "Draw a square for each"],
  [/Build it with cubes first/g, "Draw it with squares first"],
  [
    /Build the number with counters to help you guess/g,
    "Draw the number as dots to help you guess",
  ],
  [/Build the number with counters first/g, "Draw the number as dots first"],
  [/Use counters to show/g, "Draw dots to show"],
  [/Point to the counters/g, "Point to the dots"],
  [
    /Build both numbers with rods and cubes/g,
    "Draw both numbers with tens sticks and ones squares",
  ],
  [
    /Build one number from each group with rods/g,
    "Draw one number from each group with tens sticks",
  ],
  [/Look at the rods/g, "Look at the tens sticks"],
  [/Draw the rods and cubes/g, "Draw the tens sticks and ones squares"],
  [/Show the story with sticks and cubes/g, "Draw the story with sticks and squares"],
  [/Build each clue with sticks and cubes/g, "Draw each clue with sticks and squares"],
  [/move the sticks to match/g, "draw the sticks to match"],
];

export const rewrite = (text) =>
  PHRASES.reduce((t, [from, to]) => t.replace(from, to), String(text));

export const PHYSICAL_WORDS =
  /\b(cubes?|counters?|rods?|sticks?|blocks?|flashlight|real|globe|ball|orange|rocks?|coins?|seeds?|soil|puppet|drum|bucket|whistle|wax|cardboard|plastic|objects?|tiles?|shapes?|spoon|jar|calculators?|bins?|boxes)\b/i;
export const MANIPULATIVE_LEFT = /\b(cubes?|counters?|rods?|tiles?)\b/i;
