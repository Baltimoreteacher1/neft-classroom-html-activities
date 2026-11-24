// BCPSS Writing Lab (TWR) — g8-sci-u1 · How Will It Move? Contract: ../writing-schema.mjs

export default {
  title: "Why Heavy Carts Move Slowly",
  genre: "explain",
  tip: "Have students fill in same force, more mass, so smaller acceleration on a sentence strip before they write the paragraph.",
  lessons: [
    { id: "A", title: "Balanced and unbalanced forces" },
    { id: "B", title: "Net force and acceleration" },
    { id: "C", title: "Mass and acceleration" },
    { id: "D", title: "Action-reaction pairs and collisions" },
  ],
  source: {
    title: "Devon's Cart Test",
    lesson: "C",
    text: "Devon's class tests how mass changes motion. They pull a lab cart across a smooth table with a steady net force of 2 newtons. When the cart has a mass of 1 kilogram, it accelerates at 2 meters per second squared. After the class adds blocks to reach 2 kilograms, the acceleration drops to 1 meter per second squared. The force stayed the same, but the extra mass made the cart harder to speed up. Later, Devon pushes a wall while standing on a skateboard. The wall pushes back on him with an equal force in the opposite direction, so he rolls away. This is an action-reaction pair.",
  },
  notes: [
    { sentence: "When the cart has a mass of 1 kilogram, it accelerates at 2 meters per second squared.", note: "1 kg, 2 N → a = 2 m/s²" },
    { sentence: "After the class adds blocks to reach 2 kilograms, the acceleration drops to 1 meter per second squared.", note: "2 kg, 2 N → a = 1 m/s²" },
    { sentence: "The force stayed the same, but the extra mass made the cart harder to speed up.", note: "same force + more mass → less acceleration" },
    { sentence: "The wall pushes back on him with an equal force in the opposite direction, so he rolls away.", note: "action-reaction: equal + opposite" },
  ],
  bbs: [
    {
      lesson: "C",
      kernel: "The 2-kilogram cart accelerates slowly",
      because: "it has more mass than the 1-kilogram cart.",
      but: "the net force on both carts is the same.",
      so: "it takes longer to reach a fast speed.",
    },
    {
      lesson: "A",
      kernel: "Balanced forces cancel each other",
      because: "they are equal in size and opposite in direction.",
      but: "the object can still be moving at a steady speed.",
      so: "the net force on the object is zero.",
    },
    {
      lesson: "D",
      kernel: "A student on a skateboard rolls away from a wall",
      because: "the wall pushes back on him with an equal force.",
      but: "the wall itself does not move.",
      so: "he glides backward across the pavement.",
    },
  ],
  expand: [
    {
      lesson: "B",
      kernel: "Friction slows the cart.",
      parts: { when: "after the pulling stops", how: "gradually", why: "because the surfaces resist sliding" },
      model: "After the pulling stops, friction slows the cart gradually because the surfaces resist sliding.",
    },
    {
      lesson: "C",
      kernel: "The class added blocks.",
      parts: { when: "after the first trial", where: "to the cart", why: "to test how mass changes acceleration" },
      model: "After the first trial, the class added blocks to the cart to test how mass changes acceleration.",
    },
  ],
  fragments: [
    { text: "A net force changes an object's motion.", is_sentence: true },
    { text: "Because the forces are balanced.", is_sentence: false, fix: "The cart moves at a steady speed because the forces are balanced." },
    { text: "The heavier cart accelerates more slowly.", is_sentence: true },
    { text: "Pushes back with an equal force.", is_sentence: false, fix: "The wall pushes back with an equal force." },
    { text: "When the mass doubles and the force stays the same.", is_sentence: false, fix: "The acceleration is cut in half when the mass doubles and the force stays the same." },
  ],
  appositives: [
    {
      lesson: "B",
      sentence: "Net force, ___, decides how an object's motion changes.",
      noun: "Net force",
      options: ["the total of all the forces on an object", "a force that resists sliding between surfaces", "the amount of matter in an object"],
      answer: 0,
      model: "Net force, the total of all the forces on an object, decides how an object's motion changes.",
    },
    {
      lesson: "C",
      sentence: "Mass, ___, is measured in kilograms.",
      noun: "Mass",
      options: ["a change in speed or direction over time", "the amount of matter in an object", "the total of all the forces on an object"],
      answer: 1,
      model: "Mass, the amount of matter in an object, is measured in kilograms.",
    },
    {
      lesson: "A",
      sentence: "Inertia, ___, keeps riders moving forward when a bus brakes.",
      noun: "Inertia",
      options: ["a force between touching surfaces", "two forces that are equal and opposite", "the tendency of an object to keep moving at the same speed or stay still"],
      answer: 2,
      model: "Inertia, the tendency of an object to keep moving at the same speed or stay still, keeps riders moving forward when a bus brakes.",
    },
  ],
  subordinate: [
    { lesson: "A", conjunction: "when", stem: "the cart keeps moving at a steady speed", model: "When the net force is zero, the cart keeps moving at a steady speed." },
    { lesson: "C", conjunction: "because", stem: "the same force makes it accelerate less", model: "Because the cart has more mass, the same force makes it accelerate less." },
    { lesson: "B", conjunction: "if", stem: "the cart's acceleration doubles too", model: "If the pulling force doubles and the mass stays the same, the cart's acceleration doubles too." },
  ],
  spo: {
    topic: {
      l1_2: "The same push makes a [light] cart speed up [more] than a [heavy] cart.",
      l3_4: "Because the carts have different [masses], the same net force causes [different accelerations].",
      l5_6: "As a result of [the extra mass], the same net force causes [a smaller acceleration], which explains why [a loaded cart is harder to speed up].",
    },
    starters: [
      { type: "question", text: "Why does the same push move one cart faster than another?" },
      { type: "subordinate", text: "When the mass doubles, the acceleration is cut in half." },
      { type: "statement", text: "Newton's second law links force, mass, and acceleration." },
    ],
    details: [
      { note: "net force 2 N on both carts", lesson: "B" },
      { note: "1 kg cart: a = 2 m/s²", lesson: "C" },
      { note: "2 kg cart: a = 1 m/s²", lesson: "C" },
      { note: "more mass → less acceleration", lesson: "C" },
      { note: "balanced forces: net force = 0", lesson: "A" },
      { note: "wall pushes back: equal + opposite", lesson: "D" },
    ],
    distractors: ["lab carts have four small wheels", "the class wrote the date on the data table"],
    conclusion: {
      l1_2: "So the [light] cart [speeds up] more.",
      l3_4: "As a result, the [heavier cart] speeds up more slowly because it has more [mass].",
      l5_6: "The data show that [mass and acceleration] change in [opposite directions] when the net force stays [constant].",
    },
  },
  prompt: {
    l1_2: "Look at the two carts. Write 3 sentences. Tell which cart speeds up more and why.",
    l3_4: "Explain why the 1 kg cart and the 2 kg cart have different accelerations when the same net force acts on both. Use because and as a result.",
    l5_6: "Write a paragraph that explains how mass changes acceleration, uses the numbers from the test, and mentions inertia or friction. Include an appositive and a sentence that starts with when or because.",
  },
  transitions: ["First,", "Because", "As a result,", "This causes", "Therefore,", "When", "For example,", "In conclusion,"],
  model: {
    l1_2: "Both carts get the same push. The 1 kg cart speeds up more. The 2 kg cart has more mass.",
    l3_4: "Because the carts have different masses, the same net force causes different accelerations. The net force is 2 newtons on both carts. The 1 kilogram cart accelerates at 2 meters per second squared. The 2 kilogram cart has more mass, so its acceleration is only 1 meter per second squared. As a result, the heavier cart speeds up more slowly. More mass leads to less acceleration when the force stays the same.",
    l5_6: "As a result of the extra mass, the same net force causes a smaller acceleration, which explains why a loaded cart is harder to speed up. Devon's class pulled a lab cart with a steady net force of 2 newtons. When the cart had a mass of 1 kilogram, its acceleration was 2 meters per second squared. Inertia, the tendency of an object to resist changes in motion, grew with the added blocks, so the 2 kilogram cart accelerated at only 1 meter per second squared. Because the force stayed constant, doubling the mass cut the acceleration in half. Friction between the wheels and the table then slowed both carts once the pulling stopped. The data show that mass and acceleration change in opposite directions.",
  },
  mpo: {
    thesis: "The same net force causes different accelerations because mass, balanced forces, and action-reaction pairs all change how objects move.",
    paragraphs: [
      { topic: "Balanced forces cancel, so the net force is zero and the motion does not change.", notes: ["equal + opposite = balanced", "net force = 0", "inertia: keeps steady speed"] },
      { topic: "A larger mass causes a smaller acceleration under the same net force.", notes: ["2 N on both carts", "1 kg → 2 m/s², 2 kg → 1 m/s²", "double mass → half acceleration"] },
      { topic: "Action-reaction pairs explain why objects push each other apart in collisions.", notes: ["wall pushes back = equal + opposite", "skateboard rolls away", "each object feels one force"] },
    ],
    conclusion: "Because force, mass, and acceleration are linked, scientists can predict how a cart, a skateboard, or a bus will move before it even starts.",
  },
  revise: [
    "Did I name the cause, such as more mass, and then its effect on acceleration?",
    "Did I use because, causes, or as a result in at least three sentences?",
    "Did I use the numbers 2 newtons, 1 kilogram, and 2 kilograms correctly?",
    "Did I use net force, inertia, or friction in a way that fits the data?",
  ],
};
