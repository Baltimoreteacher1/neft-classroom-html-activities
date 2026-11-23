// Concept Builder (process-model): a simple circuit. Change the switch, the path material, the batteries and the device,
// and read the cause-and-effect sentence the model gives for energy transfer.
const fr = (ee, dev, exp, br) => ({ ee, dev, exp, br });
const start = (over = {}) => ({
  vars: { switch: "off", path: "copper", batteries: "1", device: "bulb", ...over },
  log: [],
});
const eq = (of, value) => ({ type: "equals", of, value });

const supports = (hint) => ({
  ee: {
    directions:
      "Tap a button or move the slider to change a part of the circuit. Then read the sentence that tells what happened.",
    frames: ["When I changed the ___, the ___ changed.", "The energy ___."],
    wordBank: ["circuit", "current", "energy", "conductor", "insulator"],
    oral: "Say what you will change and what you think will happen before you tap.",
    hint,
  },
  dev: {
    directions: "Change one part at a time and read what the model says.",
    frames: ["When I changed the ___, the model said ___."],
    wordBank: ["electric current", "transfer", "convert"],
  },
  exp: { frames: ["I changed the ___, so the electric current ___ and the device ___."] },
  br: {},
});

const explain = (prompt, mustMention) => ({
  prompt,
  frames: fr(
    ["I changed the ___.", "The energy went to the ___."],
    ["I changed the ___, so the current ___ and the energy ___."],
    ["When I changed the ___, the electric current ___ because ___, so the energy ___."],
    [
      "Changing the ___ changed whether the energy could be transferred along the circuit, which made the device ___.",
    ],
  ),
  mustMention,
});

export default {
  id: "g4-science-circuit-model",
  engine: "concept-builder",
  kind: "process-model",
  title: "Circuit Model: Where Does the Energy Go?",
  grade: "4",
  band: "3-5",
  subject: "science",
  lessonId: "g4-science-energy-transfer-and-circuits",
  standards: ["4-PS3-2", "4-PS3-4"],
  curriculum: {
    status: "district-referenced",
    unitId: "g4-sci-u1",
    note: "Matches the Energy Transfer & Collisions unit in the BCPSS curriculum seed. The model and tasks are original.",
  },
  vocabIds: [
    "energy-transfer",
    "electric-current",
    "circuit",
    "closed-circuit",
    "open-circuit",
    "switch",
    "conductor",
    "insulator",
    "convert",
  ],
  minutes: 18,
  intro:
    "This model shows a battery, a switch, a path and a device. Change the parts, read what the model says about the electric current, and follow the energy from the battery to the device.",
  model: {
    title: "A simple circuit",
    variables: [
      {
        id: "switch",
        label: "Switch",
        type: "toggle",
        options: [
          { id: "on", label: "Closed (on)" },
          { id: "off", label: "Open (off)" },
        ],
        start: "off",
      },
      {
        id: "path",
        label: "Material of the path",
        type: "toggle",
        options: [
          { id: "copper", label: "Copper wire" },
          { id: "foil", label: "Aluminum foil strip" },
          { id: "plastic", label: "Plastic strip" },
        ],
        start: "copper",
      },
      {
        id: "batteries",
        label: "Batteries",
        type: "slider",
        min: "1",
        max: "2",
        step: "1",
        start: "1",
        valueLabels: ["1 battery", "2 batteries"],
      },
      {
        id: "device",
        label: "Device",
        type: "toggle",
        options: [
          { id: "bulb", label: "Light bulb" },
          { id: "buzzer", label: "Buzzer" },
        ],
        start: "bulb",
      },
    ],
    outputs: [
      {
        id: "current",
        label: "Electric current",
        min: "0",
        max: "1",
        rules: [
          {
            when: [{ var: "switch", op: "eq", value: "off" }],
            value: "0",
            say: "The switch is open, so there is a gap in the circuit and no electric current can flow.",
            ruleId: "gap",
          },
          {
            when: [{ var: "path", op: "eq", value: "plastic" }],
            value: "0",
            say: "Plastic is an insulator. It blocks the electric current, so the loop is not complete.",
            ruleId: "insulator",
          },
          {
            when: [],
            value: "1",
            say: "The loop is complete and the conductor lets electric current flow from the battery all the way around.",
            ruleId: "flows",
          },
        ],
      },
      {
        id: "effect",
        label: "What the device does",
        min: "0",
        max: "3",
        rules: [
          {
            when: [{ out: "current", op: "eq", value: "0" }],
            value: "0",
            say: "No energy reaches the device, so nothing happens.",
            ruleId: "none",
          },
          {
            when: [
              { var: "device", op: "eq", value: "bulb" },
              { var: "batteries", op: "ge", value: "2" },
            ],
            value: "3",
            say: "Two batteries send more energy, so the bulb converts more of it into brighter light and more heat.",
            ruleId: "bulb-bright",
          },
          {
            when: [{ var: "device", op: "eq", value: "bulb" }],
            value: "2",
            say: "The current brings energy to the bulb, which converts it into light and heat.",
            ruleId: "bulb",
          },
          {
            when: [
              { var: "device", op: "eq", value: "buzzer" },
              { var: "batteries", op: "ge", value: "2" },
            ],
            value: "3",
            say: "Two batteries send more energy, so the buzzer converts more of it into louder sound.",
            ruleId: "buzzer-loud",
          },
          {
            when: [],
            value: "2",
            say: "The current brings energy to the buzzer, which converts it into sound and a little heat.",
            ruleId: "buzzer",
          },
        ],
      },
    ],
    stages: [
      {
        id: "stored",
        label: "Battery: energy is stored",
        detail: "The battery holds energy that can be released.",
        when: [],
      },
      {
        id: "flow",
        label: "Wire: current carries the energy",
        detail: "Electric current moves the energy along the conductor.",
        when: [{ out: "current", op: "eq", value: "1" }],
      },
      {
        id: "light",
        label: "Bulb: energy becomes light and heat",
        detail: "The bulb converts electrical energy into light and thermal energy.",
        when: [
          { out: "current", op: "eq", value: "1" },
          { var: "device", op: "eq", value: "bulb" },
        ],
      },
      {
        id: "sound",
        label: "Buzzer: energy becomes sound",
        detail: "The buzzer converts electrical energy into sound.",
        when: [
          { out: "current", op: "eq", value: "1" },
          { var: "device", op: "eq", value: "buzzer" },
        ],
      },
    ],
  },
  tasks: [
    {
      id: "t1",
      prompt:
        "A circuit is built but nothing is happening. Change one part so that energy reaches the bulb and it works.",
      goal: "The device is working",
      start: start(),
      target: start({ switch: "on" }),
      check: { type: "relation", left: "out.effect", op: "ge", right: { value: "2" } },
      hints: [
        "Read the sentence the model gives about the electric current. What is stopping it?",
        "Find the part of the circuit that opens and closes the loop.",
        "Change that part, then read what the model says about the device.",
      ],
      misconceptions: [
        {
          match: "more-batteries-fix-a-gap",
          when: { type: "all", checks: [eq("vars[switch]", "off"), eq("vars[batteries]", "2")] },
          hint: "More batteries do not help while the loop has a gap. What does the model say is wrong with the loop?",
        },
      ],
      model:
        "If a flashlight will not turn on, check whether the loop is complete. A switch that is open leaves a gap, so the electric current cannot flow. Closing the switch completes the loop and lets the energy move.",
      right:
        "That works: the loop is complete, so the electric current flows and the energy is transferred to the device.",
      supports: supports(
        "The current needs a complete loop. Which control opens or closes the loop?",
      ),
      explain: explain("What did you change, and why did that make energy reach the device?", [
        {
          id: "loop",
          label: "the loop is now complete",
          any: ["complete", "closed", "loop", "gap"],
        },
        {
          id: "current",
          label: "the electric current can flow",
          any: ["current", "flow", "energy"],
        },
      ]),
    },
    {
      id: "t2",
      prompt:
        "The circuit works with the bulb. Change the device so that the circuit converts electrical energy into a noise you can hear.",
      goal: "The circuit changes electrical energy into a noise",
      start: start({ switch: "on" }),
      target: start({ switch: "on", device: "buzzer" }),
      check: eq("stage", "sound"),
      hints: [
        "Look at the devices you can choose. Which one is made to be heard, not seen?",
        "Change only the device and keep the rest of the circuit the same.",
        "After you change it, read the last stage of the energy path in the model.",
      ],
      misconceptions: [
        {
          match: "changed-the-wrong-part",
          when: { type: "all", checks: [eq("vars[device]", "bulb"), eq("vars[batteries]", "2")] },
          hint: "Adding a battery made the same device work harder. Which part of the circuit changes the kind of energy that comes out?",
        },
      ],
      model:
        "A doorbell is a circuit with a device that changes electrical energy into sound. A lamp is a circuit with a device that changes electrical energy into light. The device decides what form of energy comes out.",
      right:
        "The energy still travels the same way, but this device converts it into a different form.",
      supports: supports("The same current can end in different devices. Which one makes a noise?"),
      explain: explain(
        "What changed about the energy at the end of the circuit, and what stayed the same along the wire?",
        [
          {
            id: "form",
            label: "the form of energy changed at the device",
            any: ["form", "convert", "change", "sound"],
          },
          {
            id: "same",
            label: "the current still carried energy along the wire",
            any: ["current", "wire", "same", "carried"],
          },
        ],
      ),
    },
    {
      id: "t3",
      prompt:
        "The switch is closed and two batteries are in, but the device stays off. Change only the material of the path so the electric current can flow.",
      goal: "Electric current flows with two batteries and the switch closed",
      start: start({ switch: "on", path: "plastic", batteries: "2" }),
      target: start({ switch: "on", path: "copper", batteries: "2" }),
      check: {
        type: "all",
        checks: [eq("out.current", "1"), eq("vars[batteries]", "2"), eq("vars[switch]", "on")],
      },
      hints: [
        "The switch is closed and there is plenty of energy, so the problem is somewhere else.",
        "Read the sentence about the electric current. It names a kind of material.",
        "Choose a material that lets electric current flow, and keep the switch and batteries as they are.",
      ],
      misconceptions: [
        {
          match: "opens-the-switch",
          when: { type: "all", checks: [eq("vars[switch]", "off"), eq("vars[path]", "copper")] },
          hint: "The switch was already closed at the start. Put it back, and look at the material of the path instead.",
        },
      ],
      model:
        "A string of lights goes dark because one cord is covered with rubber where the metal should touch. Rubber is an insulator and blocks the current. Replacing it with a metal conductor lets the current flow again.",
      right:
        "A conductor lets the electric current flow, so the energy can reach the device even though nothing else changed.",
      supports: supports(
        "Some materials block electric current. Which materials in the list let it through?",
      ),
      explain: explain(
        "Why could the current not flow before you changed the path, and why can it flow now?",
        [
          {
            id: "block",
            label: "the first material blocked the current (insulator)",
            any: ["insulator", "block", "plastic", "stop"],
          },
          {
            id: "conduct",
            label: "the new material lets current flow (conductor)",
            any: ["conductor", "metal", "let", "flow"],
          },
        ],
      ),
    },
    {
      id: "t4",
      prompt:
        "A friend says only wire can carry electric current. Test the claim. Build a working circuit that uses the strip that is not a wire.",
      goal: "A working circuit that does not use copper wire",
      start: start({ switch: "on" }),
      target: start({ switch: "on", path: "foil" }),
      check: { type: "all", checks: [eq("vars[path]", "foil"), eq("out.current", "1")] },
      hints: [
        "Look at the three materials in the list. Which one is not shaped like a wire?",
        "Think about what the strip is made of, then decide whether it is a metal.",
        "Choose the strip made of metal and read what the model says about the current.",
      ],
      misconceptions: [
        {
          match: "tries-the-insulator",
          when: { type: "all", checks: [eq("vars[path]", "plastic")] },
          hint: "Read what the model says about the current with that strip. Does it carry the energy?",
        },
      ],
      model:
        "A metal spoon is not a wire, but metals such as steel let electric current flow. That is why a spoon can complete a circuit in an experiment, while a wooden spoon cannot.",
      right:
        "The current flows through the strip even though it is not a wire. The important thing is that the material is a conductor.",
      supports: supports("Test a material that is not shaped like a wire but is made of metal."),
      justify: {
        prompt: "Which statements does your test support?",
        options: [
          {
            id: "j1",
            text: "A material that is not a wire can still carry electric current if it is a conductor.",
            ok: true,
          },
          { id: "j2", text: "Metals such as aluminum let electric current flow.", ok: true },
          {
            id: "j3",
            text: "Every shiny material carries electric current.",
            ok: false,
            hint: "You tested only one kind of material. Your test cannot say anything about every shiny thing.",
          },
          {
            id: "j4",
            text: "Plastic carries electric current as well as metal does.",
            ok: false,
            hint: "Put the plastic strip in the model and read what it says about the current.",
          },
        ],
        min: 2,
        model:
          "The test showed that a strip of foil carries the current, so the claim that only wire works is not right. It does not show that all materials work.",
      },
      explain: explain(
        "What did your test show about the claim that only wire can carry current?",
        [
          {
            id: "claim",
            label: "the claim is not right",
            any: ["not right", "wrong", "can", "also"],
          },
          {
            id: "conductor",
            label: "the material is a conductor",
            any: ["conductor", "metal", "aluminum"],
          },
        ],
      ),
    },
    {
      id: "t5",
      prompt:
        "The circuit is working with one battery. Change one part so the device transfers as much energy as this model allows.",
      goal: "The device works at its strongest in the model",
      start: start({ switch: "on" }),
      target: start({ switch: "on", batteries: "2" }),
      check: eq("out.effect", "3"),
      hints: [
        "Think about which part of the circuit is the source of the energy.",
        "Look at the slider. What can you change to send more energy around the loop?",
        "Change only that part and read how the device responds.",
      ],
      misconceptions: [
        {
          match: "changes-the-device",
          when: { type: "all", checks: [eq("vars[batteries]", "1"), eq("vars[device]", "buzzer")] },
          hint: "Switching devices changes the kind of energy that comes out, not how much energy the batteries send.",
        },
      ],
      model:
        "A toy car with fresh batteries runs faster than one with weak batteries. More energy is stored, so more energy can be transferred to the motor. The part that stores the energy sets how much there is to give.",
      right:
        "More batteries send more energy around the circuit, so the device converts more of it.",
      supports: supports(
        "The source of energy is the part that holds it. Which control changes the source?",
      ),
      justify: {
        prompt: "Which statements explain why the device works harder?",
        options: [
          {
            id: "j1",
            text: "The batteries are the source, so more batteries means more energy to transfer.",
            ok: true,
          },
          {
            id: "j2",
            text: "The energy still travels along the wire as an electric current.",
            ok: true,
          },
          {
            id: "j3",
            text: "The switch makes the energy bigger when it is closed.",
            ok: false,
            hint: "The switch only opens or closes the loop. Which part holds the energy?",
          },
          {
            id: "j4",
            text: "The device makes new energy out of nothing.",
            ok: false,
            hint: "The device converts energy it receives from the circuit.",
          },
        ],
        min: 2,
        model:
          "The batteries store the energy. More batteries store and send more energy, and the current carries it to the device, which converts it.",
      },
      explain: explain("How did changing the batteries change the energy transfer?", [
        {
          id: "source",
          label: "the batteries are the source of the energy",
          any: ["battery", "batteries", "source", "store"],
        },
        {
          id: "more",
          label: "more energy is transferred",
          any: ["more", "stronger", "brighter", "louder"],
        },
      ]),
    },
  ],
  reflection: {
    prompt:
      "Which part of the circuit stores the energy, which part carries it, and which part converts it?",
    frames: fr(
      ["The ___ stores the energy.", "The ___ carries the energy."],
      ["The ___ stores energy, the ___ carries it and the ___ converts it."],
      ["Energy is stored in the ___, carried by the ___ as ___ and converted by the ___ into ___."],
      [
        "The circuit works as a path: the ___ stores energy, the current in the ___ transfers it, and the ___ converts it into ___.",
      ],
    ),
  },
  review: { status: "authored", checks: {} },
  version: "1.0.0",
  updated: "2026-11-23",
  source: "Original - The Language Page",
};
