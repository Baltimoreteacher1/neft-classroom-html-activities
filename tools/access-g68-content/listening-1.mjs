// Grades 6-8 publisher pass, Listening batch 1 (samples that set the shape). Original EduWonderLab scripts.
export default [
  {
    id: "l-b-paint-ratios",
    level: "B",
    gw: "g6-topic",
    strand: "Math talk: ratios",
    title: "Two Paint Mixes, One Color",
    skill: "Following a math explanation about equivalent ratios",
    dir: "Listen to a math teacher compare two paint mixes. Then choose the best answer.",
    q: "Why will the two paint mixes match in color?",
    script:
      "Today we are comparing two paint mixes. Mix A uses three cups of blue paint for every two cups of white paint. Mix B uses six cups of blue paint for every four cups of white paint. At first, the numbers in Mix B look bigger, so some students think the colors will be different. But look at the relationship. If we multiply both numbers in Mix A by two, we get six and four. That means the two ratios are equivalent, and the paint colors will match. Mix B simply makes a larger batch. Remember, a ratio compares two quantities, and equivalent ratios keep the same relationship even when the amounts change.",
    opts: [
      "Both amounts in Mix A were multiplied by two, so the relationship stays the same.",
      "Mix B has more blue paint than Mix A, so the two mixes are not the same color.",
      "Both mixes use the same number of cups, so nothing about the paint can differ.",
    ],
    why: [
      "Mix B uses more of both colors, so what matters is how much blue there is compared with white, not how much blue there is alone.",
      "The teacher says Mix B uses six and four cups while Mix A uses three and two, so the totals are different even though the colors match.",
    ],
    vocab: [
      ["ratio", "a comparison of two quantities", "razón: una comparación de dos cantidades"],
      [
        "equivalent",
        "having the same value or the same relationship",
        "equivalente: que tiene el mismo valor o la misma relación",
      ],
      ["batch", "an amount made at one time", "tanda: una cantidad que se prepara de una vez"],
    ],
    frames: ["Both numbers were multiplied by ___.", "The ratios are equivalent because ___."],
    focus: ["the cups of blue and white in each mix", "the word multiply", "the word equivalent"],
    correct:
      "Yes. The teacher multiplies both numbers in Mix A by two to get Mix B, so the relationship between blue and white does not change.",
    hint: "Listen for what the teacher does to the numbers in Mix A to get the numbers in Mix B.",
    wida: ["Inform: follow a math explanation", "Notice relationship words in a ratio talk"],
    es: [
      "Seguir una explicación de matemáticas sobre razones equivalentes",
      "Escucha a un maestro de matemáticas comparar dos mezclas de pintura. Luego elige la mejor respuesta.",
    ],
  },
  {
    id: "l-c-lab-notes",
    level: "C",
    gw: "g67-load",
    strand: "Note-taking from a talk",
    type: "constructed",
    title: "Take Notes: How Heat Moves",
    skill: "Taking notes on a short science talk and summarizing them",
    dir: "Listen to the science talk. Write notes with key words under each heading. Then write a two-sentence summary.",
    q: "Take notes under the headings Conduction, Convection, and Radiation. Then summarize how heat moves in one or two sentences.",
    script:
      "Scientists describe three ways that heat moves from one place to another. The first is conduction. In conduction, heat passes through direct contact. When you hold a metal spoon in hot soup, the handle slowly gets warm because heat travels through the metal. The second is convection. Convection happens in liquids and gases. Warm water rises and cooler water sinks, so the water moves in a circle and carries heat with it. A pot of boiling water shows this clearly. The third is radiation. Radiation moves heat as invisible waves, and it does not need anything to travel through. That is how the Sun warms the Earth across empty space. In everyday life, more than one kind of heat transfer often happens at the same time.",
    focus: [
      "three kinds of heat transfer",
      "one example for each kind",
      "words that signal a new idea",
    ],
    models: {
      A: "Conduction: touch, metal spoon. Convection: liquid, water moves in a circle. Radiation: waves, Sun. Heat moves in three ways.",
      B: "Conduction: heat moves by touching, like a hot metal spoon. Convection: warm liquid rises and cool liquid sinks, like boiling water. Radiation: waves carry heat, like the Sun. Summary: Heat can move by touch, by moving liquids or gases, or by waves.",
      C: "Conduction: direct contact; metal spoon in hot soup warms the handle. Convection: liquids and gases; warm water rises, cool water sinks, circular motion carries heat. Radiation: invisible waves; needs no material; Sun warms Earth across space. Summary: Heat travels through touch, through moving fluids, and through waves that cross empty space, and these often happen together.",
    },
    criteria: [
      "I wrote key words, not full sentences, under all three headings.",
      "I included one example for each kind of heat transfer.",
      "My summary says how the three kinds are different.",
    ],
    label: "Your notes and summary",
    vocab: [
      [
        "conduction",
        "heat moving through direct contact",
        "conducción: el calor que se mueve por contacto directo",
      ],
      [
        "convection",
        "heat carried by moving liquids or gases",
        "convección: el calor que llevan los líquidos o los gases en movimiento",
      ],
      [
        "radiation",
        "heat that travels as invisible waves",
        "radiación: el calor que viaja en ondas invisibles",
      ],
    ],
    frames: [
      "Conduction happens when ___.",
      "Convection is different because ___.",
      "In summary, heat moves by ___.",
    ],
    wida: ["Inform: take notes on a science talk", "Summarize key ideas from spoken input"],
    es: [
      "Tomar apuntes de una charla de ciencias y resumirlos",
      "Escucha la charla de ciencias. Escribe apuntes con palabras clave bajo cada título. Luego escribe un resumen de dos oraciones.",
    ],
    correct:
      "Good note-taking. Strong notes use key words under each heading and keep one example for every kind of heat transfer.",
    hint: "Listen for the words first, second, and third. Each one starts a new heading.",
  },
];
