// Kindergarten early-sort: compare a group with a reference group by matching one to one, and decide
// whether it has more, fewer or the same. Some "fewer" groups are spread wide on purpose so children
// must match or count instead of judging by how much space a group takes.
// Pictures are read at about 190 pixels wide, so the reference stars sit on top and the compared group below,
// in rows of five with large icons. `spread` places the lower group far apart on purpose.
const REF_ICON = "star";
function compare(ref, n, icon, { spread = false, alt }) {
  const top = Array.from({ length: ref }, (_, i) => ({
    icon: REF_ICON,
    x: 5 + (i % 5) * 58,
    y: 4 + Math.floor(i / 5) * 54,
    s: 50,
  }));
  const yb = ref > 5 ? 130 : 78;
  const spots = [
    [4, yb + 8],
    [124, yb + 52],
    [244, yb + 6],
    [64, yb + 56],
    [190, yb + 60],
  ];
  const bottom = Array.from({ length: n }, (_, i) =>
    spread
      ? { icon, x: spots[i][0], y: spots[i][1], s: 50 }
      : { icon, x: 5 + (i % 5) * 58, y: yb + 4 + Math.floor(i / 5) * 54, s: 50 },
  );
  const h = yb + 130;
  return {
    kind: "scene",
    bg: "plain",
    alt,
    w: 300,
    h,
    items: [{ t: "line", x1: 6, y1: yb - 6, x2: 294, y2: yb - 6, sw: 3, dash: "6 6" }, ...top, ...bottom],
  };
}

const catVisuals = {
  more: { kind: "icon", name: "plus", alt: "A plus sign for the group that has extras" },
  fewer: { kind: "icon", name: "minus", alt: "A minus sign for the group that runs out" },
  same: {
    kind: "shapes",
    alt: "An equal sign for two groups that match with nothing left over",
    w: 480,
    h: 280,
    items: [
      { t: "rect", x: 110, y: 90, w: 260, h: 34, rx: 10, fill: "teal", stroke: "ink", sw: 3 },
      { t: "rect", x: 110, y: 160, w: 260, h: 34, rx: 10, fill: "teal", stroke: "ink", sw: 3 },
    ],
  },
};

const hintsFor = {
  extras: [
    "Match one star with one animal. Do it in your mind.",
    "Look for animals with no star partner.",
    "Does the right side have extras, or does it run out?",
  ],
  runout: [
    "Match one star with one animal. Do it in your mind.",
    "Look for stars with no animal partner.",
    "Does the right side have extras, or does it run out?",
  ],
  match: [
    "Match one star with one animal, all the way down.",
    "Check both sides at the end. Does anything have no partner?",
    "If every one has a partner, what does that tell you?",
  ],
};

const mc = {
  space: {
    tag: "judged-by-space",
    hint: "Try another spot. Spread out is not the same as extras. Match each animal with a star.",
  },
  extras: {
    tag: "counted-extras-as-equal",
    hint: "Try another spot. Look for animals left over without a star partner.",
  },
  short: {
    tag: "judged-by-space",
    hint: "Try another spot. Tight and close does not mean extras. Match them one to one.",
  },
  leftover: {
    tag: "ignored-leftovers",
    hint: "Try another spot. Check the stars. Does one side have things with no partner?",
  },
};

const it = (id, word, visual, category, hints, misconceptions, model) => ({
  id,
  word,
  visual,
  category,
  say: word,
  hints,
  misconceptions,
  model,
});

const cats = [
  { id: "more", label: "more", visual: catVisuals.more, say: "more than the stars" },
  { id: "fewer", label: "fewer", visual: catVisuals.fewer, say: "fewer than the stars" },
  { id: "same", label: "the same", visual: catVisuals.same, say: "the same as the stars" },
];

const round1 = [
  it(
    "a-more-8",
    "group of rabbits",
    compare(5, 8, "rabbit", { alt: "Top, five stars. Below, eight rabbits in two rows." }),
    "more",
    hintsFor.extras,
    [
      { pick: "same", tag: "ignored-leftovers", hint: mc.leftover.hint },
      {
        pick: "fewer",
        tag: "reversed-comparison",
        hint: "Try another spot. Look at which side still has things after matching ends.",
      },
    ],
    "Match each star with a rabbit. After five matches, three rabbits are left over. The rabbits have extras.",
  ),
  it(
    "a-more-7",
    "group of snails",
    compare(5, 7, "snail", { alt: "Top, five stars. Below, seven snails in two rows." }),
    "more",
    hintsFor.extras,
    [
      { pick: "same", tag: "ignored-leftovers", hint: mc.leftover.hint },
      {
        pick: "fewer",
        tag: "reversed-comparison",
        hint: "Try another spot. Look at which side still has things after matching ends.",
      },
    ],
    "Match each star with a snail. After five matches, two snails are left over. The snails have extras.",
  ),
  it(
    "a-fewer-3",
    "group of ducks",
    compare(5, 3, "duck", {
      spread: true,
      alt: "Top, five stars close together. Below, three ducks spread far apart across the space.",
    }),
    "fewer",
    hintsFor.runout,
    [
      { pick: "more", tag: mc.space.tag, hint: mc.space.hint },
      { pick: "same", tag: "ignored-leftovers", hint: mc.leftover.hint },
    ],
    "Match each duck with a star. After three matches, two stars are left over. The ducks run out first, so there are fewer ducks, even though they are spread out.",
  ),
  it(
    "a-fewer-2",
    "group of bees",
    compare(5, 2, "bee", { alt: "Top, five stars. Below, two bees." }),
    "fewer",
    hintsFor.runout,
    [
      { pick: "more", tag: mc.space.tag, hint: mc.space.hint },
      { pick: "same", tag: "ignored-leftovers", hint: mc.leftover.hint },
    ],
    "Match each bee with a star. After two matches, three stars are left over. The bees run out first, so there are fewer bees.",
  ),
  it(
    "a-same-5",
    "group of frogs",
    compare(5, 5, "frog", { alt: "Top, five stars. Below, five frogs." }),
    "same",
    hintsFor.match,
    [
      {
        pick: "more",
        tag: mc.extras.tag,
        hint: "Try another spot. Match all the way down. Is anything left on the right side?",
      },
      {
        pick: "fewer",
        tag: mc.extras.tag,
        hint: "Try another spot. Match all the way down. Is anything left on the left side?",
      },
    ],
    "Match each star with a frog. Every star has a frog partner and nothing is left. They are the same.",
  ),
  it(
    "a-same-5b",
    "group of fish",
    compare(5, 5, "fish", {
      spread: true,
      alt: "Top, five stars close together. Below, five fish spread far apart.",
    }),
    "same",
    hintsFor.match,
    [
      { pick: "more", tag: mc.space.tag, hint: mc.space.hint },
      {
        pick: "fewer",
        tag: mc.extras.tag,
        hint: "Try another spot. Match all the way down. Is anything left on the left side?",
      },
    ],
    "Match each star with a fish. Every star has a fish partner and nothing is left, even though the fish are spread out. They are the same.",
  ),
];

const round2 = [
  it(
    "b-more-10",
    "group of cows",
    compare(8, 10, "cow", { alt: "Top, eight stars in two rows. Below, ten cows in two rows." }),
    "more",
    hintsFor.extras,
    [
      { pick: "same", tag: "ignored-leftovers", hint: mc.leftover.hint },
      {
        pick: "fewer",
        tag: "reversed-comparison",
        hint: "Try another spot. Look at which side still has things after matching ends.",
      },
    ],
    "Match each star with a cow. After eight matches, two cows are left over. The cows have extras.",
  ),
  it(
    "b-more-9",
    "group of ants",
    compare(8, 9, "ant", { alt: "Top, eight stars in two rows. Below, nine ants in two rows." }),
    "more",
    hintsFor.extras,
    [
      { pick: "same", tag: "ignored-leftovers", hint: mc.leftover.hint },
      {
        pick: "fewer",
        tag: "reversed-comparison",
        hint: "Try another spot. Look at which side still has things after matching ends.",
      },
    ],
    "Match each star with an ant. After eight matches, one ant is left over. The ants have one extra, so they have more.",
  ),
  it(
    "b-fewer-6",
    "group of horses",
    compare(8, 6, "horse", {
      alt: "Top, eight stars in two rows. Below, six horses in two rows.",
    }),
    "fewer",
    hintsFor.runout,
    [
      { pick: "more", tag: mc.short.tag, hint: mc.short.hint },
      { pick: "same", tag: "ignored-leftovers", hint: mc.leftover.hint },
    ],
    "Match each horse with a star. After six matches, two stars are left over. The horses run out first, so there are fewer horses.",
  ),
  it(
    "b-fewer-4",
    "group of turtles",
    compare(8, 4, "turtle", { alt: "Top, eight stars in two rows. Below, four turtles." }),
    "fewer",
    hintsFor.runout,
    [
      { pick: "more", tag: mc.short.tag, hint: mc.short.hint },
      { pick: "same", tag: "ignored-leftovers", hint: mc.leftover.hint },
    ],
    "Match each turtle with a star. After four matches, four stars are left over. The turtles run out first, so there are fewer turtles.",
  ),
  it(
    "b-same-8",
    "group of birds",
    compare(8, 8, "bird", {
      alt: "Top, eight stars in two rows. Below, eight birds in two rows.",
    }),
    "same",
    hintsFor.match,
    [
      {
        pick: "more",
        tag: mc.extras.tag,
        hint: "Try another spot. Match all the way down. Is anything left on the right side?",
      },
      {
        pick: "fewer",
        tag: mc.extras.tag,
        hint: "Try another spot. Match all the way down. Is anything left on the left side?",
      },
    ],
    "Match each star with a bird. Every star has a bird partner and nothing is left. They are the same.",
  ),
  it(
    "b-same-8b",
    "group of pigs",
    compare(8, 8, "pig", { alt: "Top, eight stars in two rows. Below, eight pigs in two rows." }),
    "same",
    hintsFor.match,
    [
      {
        pick: "more",
        tag: mc.extras.tag,
        hint: "Try another spot. Match all the way down. Is anything left on the right side?",
      },
      {
        pick: "fewer",
        tag: mc.extras.tag,
        hint: "Try another spot. Match all the way down. Is anything left on the left side?",
      },
    ],
    "Match each star with a pig. Every star has a pig partner and nothing is left. They are the same.",
  ),
];

// A misconception hint replaces the model text on the third miss unless it carries its own `model`, so each one repeats the item's model.
const withModels = (items) =>
  items.map((i) => ({ ...i, misconceptions: (i.misconceptions || []).map((m) => ({ ...m, model: m.model ?? i.model })) }));

// Round 2 reuses the same three homes under their own ids (ids are unique across rounds).
const cats2 = cats.map((c) => ({ ...c, id: `${c.id}2` }));
const round2b = withModels(round2).map((i) => ({
  ...i,
  category: `${i.category}2`,
  misconceptions: i.misconceptions.map((m) => ({ ...m, pick: `${m.pick}2` })),
}));

export default {
  id: "k-math-more-fewer-same-sort",
  engine: "early-sort",
  title: "More, fewer or the same?",
  grade: "K",
  band: "k-2",
  subject: "math",
  lessonId: "k-math-count-and-compare-to-10",
  standards: ["K.CC.C.6", "K.CC.B.5"],
  minutes: 10,
  intro: "Let's compare groups. Match each star with an animal and see what happens.",
  grownUp: {
    ask: "Ask: How do you know? Listen for matching one to one, or counting both groups and comparing the numbers.",
    notice:
      "Notice whether the child judges by how much space a group covers. Spread-out groups can have fewer. Prompt matching or counting.",
  },
  supports: {
    ee: {
      frames: ["The animals have ___.", "___ than the stars."],
      oral: "Match one star to one animal. Show me with your fingers.",
    },
    dev: { frames: ["There are ___ animals than stars.", "I matched and ___."] },
    exp: { frames: ["There are ___ animals than stars because after matching, ___."] },
    br: {},
  },
  rounds: [
    {
      id: "r1",
      mode: "picture-sort",
      title: "Compare to the stars",
      grownUp: { ask: "Ask: Which animals have no star partner? Which stars have no animal partner?" },
      prompt: "Compare the animals to the stars above. Where does the group go?",
      categories: cats,
      items: withModels(round1),
    },
    {
      id: "r2",
      mode: "picture-sort",
      title: "A bigger group of stars",
      grownUp: { ask: "Ask: How can you tell without counting every one?" },
      prompt: "Compare the animals to the stars above again. Where does the group go?",
      categories: cats2,
      items: withModels(round2b),
    },
  ],
  reflection: {
    prompt: "Tell a grown-up how you can tell which group has more.",
    frames: {
      ee: ["I match one to one.", "This group has ___."],
      dev: ["I match one and one. ___ has extras.", "This group has more than that group."],
      exp: ["I match one to one, and the group with extras has more."],
      br: ["To compare two groups I ___, and the group with ___ has more."],
    },
  },
  review: { status: "authored", checks: {} },
  version: "1.0.0",
  updated: "2026-11-23",
  source: "Original - The Language Page",
};
