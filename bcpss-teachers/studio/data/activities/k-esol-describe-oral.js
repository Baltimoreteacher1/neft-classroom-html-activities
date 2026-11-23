// Early Sort (oral-describe): look at a picture, say what you see, optionally record on this device. Every way of telling is welcome. Original content.
const ic = (name, alt) => ({ kind: "icon", name, alt });
const sup = (ee, dev, exp, br) => ({ ee: { frames: ee }, dev: { frames: dev }, exp: { frames: exp }, br: br ? { frames: br } : {} });

export default {
  id: "k-esol-describe-oral",
  engine: "early-sort",
  title: "Tell about school and people",
  grade: "K",
  band: "k-2",
  subject: "esol",
  lessonId: "k-esol-describe-school-and-people",
  standards: ["ELD-SI", "SL.K.4", "SL.K.6"],
  vocabIds: ["teacher", "student", "friend", "backpack", "bus", "desk", "big", "small"],
  minutes: 8,
  intro: "Let's look at pictures and tell about them. You can use any words you know. Every way of telling is welcome.",
  grownUp: {
    ask: "Look at each picture with the child. Say a short sentence first, then wait and let the child say their own.",
    notice: "Notice the words the child uses and whether the child adds a describing word such as big or small.",
  },
  rounds: [
    {
      id: "r1",
      mode: "oral-describe",
      title: "Things at school",
      prompt: "Look at the picture. Tell what you see.",
      grownUp: {
        ask: "Point to each picture and wait. Ask: What do you see? Then say a short sentence about it.",
        notice: "Welcome any language, a point or a word. Repeat the idea back in a full English sentence.",
      },
      items: [
        {
          id: "bus",
          word: "bus",
          visual: ic("bus", "A big yellow school bus."),
          say: "I see a big bus.",
          frames: sup(["I see a ___."], ["I see a ___. It is ___."], ["I see a ___ and it is ___."], ["The ___ is ___ and ___."]),
          grownUp: { ask: "Ask: What do you see? Is it big or small?", notice: "Listen for a naming word and a describing word." },
        },
        {
          id: "class",
          word: "classroom",
          visual: {
            kind: "scene",
            bg: "room",
            alt: "A classroom with a chalkboard, a teacher, a student and two desks.",
            items: [
              { icon: "chalkboard", x: 30, y: 20, s: 120 },
              { icon: "teacher", x: 190, y: 70, s: 110 },
              { icon: "desk", x: 330, y: 180, s: 100 },
              { icon: "student", x: 330, y: 70, s: 100 },
              { icon: "desk", x: 60, y: 190, s: 100 },
            ],
          },
          say: "I see a teacher, a student and two desks in the classroom.",
          frames: sup(["I see a ___."], ["I see a ___ and a ___."], ["In the classroom I see ___, ___ and ___."], ["The classroom has ___, ___ and ___."]),
          grownUp: { ask: "Ask: Who is in the classroom? What do you see?", notice: "Count how many things the child names." },
        },
        {
          id: "bag",
          word: "backpack",
          visual: {
            kind: "scene",
            bg: "plain",
            alt: "A big backpack next to a small backpack.",
            items: [
              { icon: "backpack", x: 40, y: 30, s: 250 },
              { icon: "backpack", x: 340, y: 180, s: 90 },
            ],
          },
          say: "I see a big backpack and a small backpack.",
          frames: sup(["I see a ___."], ["I see a big ___ and a small ___."], ["There is a big ___ and a small ___."], ["The ___ is bigger than the ___."]),
          grownUp: { ask: "Ask: Which one is big? Which one is small?", notice: "Listen for big and small used about different pictures." },
        },
      ],
    },
    {
      id: "r2",
      mode: "oral-describe",
      title: "People at school",
      prompt: "Look at the people. Tell about them.",
      grownUp: {
        ask: "Ask: Who is this? What does this person do at school?",
        notice: "Listen for names of people and one thing each person does. Welcome he or she.",
      },
      items: [
        {
          id: "teacher",
          word: "teacher",
          visual: ic("teacher", "A teacher smiling."),
          say: "This is my teacher. She helps me learn.",
          frames: sup(["This is my ___."], ["This is my ___. She helps me."], ["This is my ___. She helps me ___."], ["My ___ helps me ___ because ___."]),
          grownUp: { ask: "Ask: Who is this? What does a teacher do?", notice: "Accept he or she; the focus is on telling about the person." },
        },
        {
          id: "student",
          word: "student",
          visual: ic("student", "A child with a backpack."),
          say: "This is a student. He learns at school.",
          frames: sup(["This is a ___."], ["This is a ___. He learns."], ["This is a ___. He ___ at school."], ["The ___ ___ at school because ___."]),
          grownUp: { ask: "Ask: Who is this? What does a student do?", notice: "Listen for a verb such as reads, writes or learns." },
        },
        {
          id: "friends",
          word: "friend",
          visual: {
            kind: "scene",
            bg: "field",
            alt: "Two children standing next to each other, smiling.",
            items: [
              { icon: "student", x: 100, y: 90, s: 150 },
              { icon: "student", x: 250, y: 90, s: 150 },
            ],
          },
          say: "These are my friends. We play together.",
          frames: sup(["These are my ___."], ["These are my ___. We play."], ["These are my ___. We ___ together."], ["My ___ and I ___ together because ___."]),
          grownUp: { ask: "Ask: Who are these? What do you do with your friend?", notice: "Welcome home-language words for friend and play." },
        },
      ],
    },
  ],
  supports: {
    ee: { frames: ["I see a ___.", "This is my ___."] },
    dev: { frames: ["I see a ___. It is ___."] },
    exp: { frames: ["I see ___ and ___."] },
    br: {},
  },
  reflection: {
    prompt: "Tell a grown-up one thing you told about today.",
    write: false,
    frames: {
      ee: ["I told about ___."],
      dev: ["I told about my ___. It is ___."],
      exp: ["I told about ___ and said it is ___."],
      br: ["I described ___ using the words ___ and ___."],
    },
  },
  review: { status: "authored", checks: {} },
  version: "1.0.0",
  updated: "2026-11-23",
  source: "Original - The Language Page",
};
