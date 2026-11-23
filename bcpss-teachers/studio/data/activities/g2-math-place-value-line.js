// Grade 2 concept-builder: place two-digit numbers on a 0 to 100 number line using tens and ones.
// Every number is written as a string; the engine compares them exactly.
const fr = (ee, dev, exp, br = []) => ({ ee, dev, exp, br });
const line = (marks = []) => ({
  kind: "numberline",
  alt: "A number line from 0 to 100 with a tick at every ten.",
  min: 0,
  max: 100,
  step: 10,
  marks,
});

const baseModel = {
  min: "0",
  max: "100",
  step: "1",
  labelEvery: "10",
  format: "integer",
  points: [{ id: "A", label: "A" }],
};

const tiers = (ee, dev, exp, extra = {}) => ({
  ee: { ...extra.ee, frames: ee.frames, wordBank: ee.wordBank, directions: ee.directions },
  dev: { frames: dev.frames, wordBank: dev.wordBank },
  exp: { frames: exp },
  br: {},
});

export default {
  id: "g2-math-place-value-line",
  engine: "concept-builder",
  kind: "number-line",
  title: "Tens and ones on the number line",
  grade: "2",
  band: "k-2",
  subject: "math",
  lessonId: "g2-math-place-value-to-100",
  standards: ["2.NBT.A.1", "2.NBT.A.2", "1.NBT.B.2"],
  curriculum: {
    status: "standards-aligned",
    note: "Aligned to 2.NBT.A.1, 2.NBT.A.2 and 1.NBT.B.2; not mapped to a district unit sequence.",
  },
  vocabIds: ["tens", "ones", "place-value", "greater-than", "less-than"],
  minutes: 15,
  intro:
    "A number line shows where every number lives. Use the labeled tens to find a number, then count the ones. Press Check when the point is where you think it belongs.",
  model: baseModel,
  tasks: [
    {
      id: "t1",
      prompt: "Move point A to the number 47.",
      goal: "A is on 47",
      target: { points: { A: "47" }, jumps: {} },
      check: { type: "within", of: "points[A]", value: "47", tolerance: "0" },
      hints: [
        "Find the tens digit first. Go to that many tens on the line.",
        "From the last labeled tens mark, count the ones one step at a time.",
        "The ones digit tells how many small steps to take after the tens mark.",
      ],
      misconceptions: [
        {
          match: "swapped-digits",
          when: { type: "equals", of: "points[A]", value: "74" },
          hint: "That point has the digits in the other order. Check which digit is in the tens place.",
          model: "The tens digit of 47 is 4, so go to the 40 mark first. Then 7 small steps.",
        },
        {
          match: "stopped-at-tens",
          when: { type: "equals", of: "points[A]", value: "40" },
          hint: "You found the tens. The number also has ones, so keep counting from there.",
        },
        {
          match: "added-the-digits",
          when: { type: "equals", of: "points[A]", value: "11" },
          hint: "That point comes from adding the two digits. A digit in the tens place counts groups of ten.",
        },
      ],
      model:
        "47 is 4 tens and 7 ones. Go to the 40 mark first (four tens). Then count 7 more small steps: 41, 42, 43, 44, 45, 46, 47.",
      right: "Right. You went to the tens first and then counted the ones.",
      supports: tiers(
        {
          frames: ["I go to ___ tens first.", "Then I count ___ ones."],
          wordBank: ["tens", "ones", "count"],
          directions: "Find 4 tens. Then count 7 ones.",
        },
        {
          frames: ["The tens digit is ___, so I go to ___ first.", "Then I count ___ ones."],
          wordBank: ["tens", "ones", "labeled"],
        },
        ["First I went to the ___ mark because ___ tens is ___. Then I counted ___ ones."],
        { ee: { visual: line([{ at: 40, label: "40", style: "flag" }]) } },
      ),
      explain: {
        prompt: "How did you know where 47 goes on the number line?",
        frames: fr(
          ["I went to ___ first.", "Then I counted ___."],
          ["I found the tens digit ___ and went to ___. Then I counted ___ more."],
          ["I knew 47 is ___ tens and ___ ones, so I went to ___ and counted on ___."],
          ["I decomposed 47 into ___ + ___ and used the labeled tens to place the point."],
        ),
        mustMention: [
          { id: "tens", label: "the tens", any: ["ten", "40"] },
          { id: "ones", label: "the ones", any: ["one", "seven", "7"] },
        ],
        criteria: [
          { id: "c1", label: "I said the tens first." },
          { id: "c2", label: "I said how many ones I counted." },
        ],
      },
    },
    {
      id: "t2",
      prompt: "Point B shows a number with 6 tens and 3 ones. Move B to that number.",
      goal: "B is on the number with 6 tens and 3 ones",
      setup: { points: [{ id: "B", label: "B" }] },
      target: { points: { B: "63" }, jumps: {} },
      check: { type: "within", of: "points[B]", value: "63", tolerance: "0" },
      hints: [
        "Six tens is a number you can find on a labeled tens mark.",
        "After the tens mark, count on the ones.",
        "Check that the point is a little to the right of the tens mark.",
      ],
      misconceptions: [
        {
          match: "swapped-digits",
          when: { type: "equals", of: "points[B]", value: "36" },
          hint: "That point has 3 tens and 6 ones. The picture has 6 tens first.",
        },
        {
          match: "added-the-digits",
          when: { type: "equals", of: "points[B]", value: "9" },
          hint: "That point comes from adding 6 + 3. Six tens means a lot more than six.",
        },
        {
          match: "stopped-at-tens",
          when: { type: "equals", of: "points[B]", value: "60" },
          hint: "You found the tens. Do not forget the ones that come after.",
        },
      ],
      model:
        "6 tens is 60, so go to the 60 mark. Then count 3 more steps: 61, 62, 63. The number is 63.",
      supports: tiers(
        {
          frames: ["___ tens is ___.", "Then ___ more ones."],
          wordBank: ["six tens", "three ones", "60"],
          directions: "Find 6 tens. Then add 3 ones.",
        },
        {
          frames: ["___ tens is ___, and ___ more ones makes ___."],
          wordBank: ["tens", "ones", "sixty"],
        },
        ["The point is at ___ because ___ tens is ___ and the ___ ones come after."],
      ),
      explain: {
        prompt:
          "Why is the point for 6 tens and 3 ones far to the right of the point for 3 tens and 6 ones?",
        frames: fr(
          ["6 tens is more than ___.", "It is far to the ___."],
          ["6 tens is ___ and 3 tens is ___, so it is farther right."],
          [
            "The point for 6 tens and 3 ones is farther right because ___ tens is more than ___ tens.",
          ],
          [
            "Tens are worth ten each, so ___ tens and ___ ones is greater than ___ tens and ___ ones.",
          ],
        ),
        mustMention: [{ id: "tens", label: "the tens", any: ["ten", "60", "30"] }],
      },
    },
    {
      id: "t3",
      prompt: "Move point C to 28 and point D to 82. Same digits, different places.",
      goal: "C is on 28 and D is on 82",
      setup: {
        points: [
          { id: "C", label: "C" },
          { id: "D", label: "D" },
        ],
      },
      target: { points: { C: "28", D: "82" }, jumps: {} },
      check: {
        type: "all",
        checks: [
          { type: "within", of: "points[C]", value: "28", tolerance: "0" },
          { type: "within", of: "points[D]", value: "82", tolerance: "0" },
        ],
      },
      hints: [
        "Do one point at a time. Say the tens first for each number.",
        "One number has more tens than the other. That one is farther right.",
        "Check that the two points are not in the same spot.",
      ],
      misconceptions: [
        {
          match: "swapped-points",
          when: {
            type: "all",
            checks: [
              { type: "within", of: "points[C]", value: "82", tolerance: "0" },
              { type: "within", of: "points[D]", value: "28", tolerance: "0" },
            ],
          },
          hint: "Look at the labels. The two points are in each other's places.",
        },
      ],
      model:
        "28 is 2 tens and 8 ones, so C goes at 28, between 20 and 30. 82 is 8 tens and 2 ones, so D goes at 82, between 80 and 90.",
      supports: tiers(
        {
          frames: ["28 is ___ tens and ___ ones.", "82 is ___ tens and ___ ones."],
          wordBank: ["tens", "ones", "same digits"],
          directions: "Say the tens and ones for each number.",
        },
        {
          frames: ["C is ___ tens and ___ ones.", "D is ___ tens and ___ ones."],
          wordBank: ["tens", "ones", "farther right"],
        },
        ["The digits 2 and 8 are in different places, so C and D are ___ ."],
      ),
      explain: {
        prompt: "28 and 82 use the same digits. Why are the points far apart?",
        frames: fr(
          ["In 28 the 2 means ___.", "In 82 the 8 means ___."],
          ["The 8 in 82 is worth ___ and the 8 in 28 is worth ___, so they are far apart."],
          [
            "28 and 82 are far apart because the digits have different place values: ___ tens versus ___ tens.",
          ],
          [
            "Place value makes the same digit worth different amounts, so 82 is much greater than 28 because ___.",
          ],
        ),
        mustMention: [
          { id: "place", label: "place value", any: ["place", "ten", "worth", "mean"] },
        ],
      },
    },
    {
      id: "t4",
      prompt: "Move point E to any number that is greater than 63 and less than 70.",
      goal: "E is on a number between 63 and 70",
      setup: { points: [{ id: "E", label: "E" }] },
      target: { points: { E: "67" }, jumps: {} },
      check: {
        type: "all",
        checks: [
          { type: "relation", left: "points[E]", op: "gt", right: { value: "63" } },
          { type: "relation", left: "points[E]", op: "lt", right: { value: "70" } },
        ],
      },
      hints: [
        "Greater than means farther right. Find the two marks that fence in your point.",
        "The tens digit stays the same. Look at the ones.",
        "You may stop at any number that fits. Check both sides of the fence.",
      ],
      misconceptions: [
        {
          match: "equal-not-greater",
          when: { type: "equals", of: "points[E]", value: "63" },
          hint: "That number is equal to the first one, not greater. Move to the right.",
        },
        {
          match: "equal-not-less",
          when: { type: "equals", of: "points[E]", value: "70" },
          hint: "That number is equal to the second one, not less. Move a little left.",
        },
      ],
      model:
        "Numbers greater than 63 are to the right of 63. Numbers less than 70 are to the left of 70. Any number between them works, such as 64, 65, 66, 67, 68 or 69.",
      supports: tiers(
        {
          frames: ["___ is greater than 63.", "___ is less than 70."],
          wordBank: ["greater than", "less than", "between"],
          directions: "Find a number to the right of 63 and to the left of 70.",
        },
        {
          frames: ["___ is greater than 63 and less than 70 because ___."],
          wordBank: ["greater than", "less than", "right", "left"],
        },
        ["My number ___ is between 63 and 70 because it has ___ tens and more than ___ ones."],
      ),
      explain: {
        prompt: "How do you know your number is greater than 63 and less than 70?",
        frames: fr(
          ["It is right of 63.", "It is left of 70."],
          ["My number is greater than 63 because it is to the ___ of 63."],
          [
            "My number has the same ___ digit as 63 but more ___, so it is greater than 63, and it is before 70.",
          ],
          [
            "Because the tens digit is ___ for both, I compared the ones to decide that ___ is between them.",
          ],
        ),
        mustMention: [
          {
            id: "cmp",
            label: "greater or less",
            any: ["greater", "less", "right", "left", "more"],
          },
        ],
      },
    },
    {
      id: "t5",
      prompt: "Point A is at 34. Make the jump show 10 more. Where does the jump land?",
      goal: "The jump lands on 10 more than 34",
      setup: {
        points: [{ id: "A", label: "A", at: "34", fixed: true }],
        jumps: [{ id: "J", label: "10 more", from: { point: "A" }, len: "0" }],
      },
      target: { points: { A: "34" }, jumps: { J: "10" } },
      check: { type: "equals", of: "jumps[J].len", value: "10" },
      hints: [
        "More means the jump goes to the right.",
        "A ten is a whole step from one tens mark to the next.",
        "Check which digit changed when you landed. Only one digit should change.",
      ],
      misconceptions: [
        {
          match: "jumped-one",
          when: { type: "equals", of: "jumps[J].len", value: "1" },
          hint: "That jump adds one. We want a whole ten, from one tens mark to the next.",
        },
        {
          match: "jumped-left",
          when: { type: "relation", left: "jumps[J].len", op: "lt", right: { value: "0" } },
          hint: "That jump goes left. More goes to the right.",
        },
      ],
      model:
        "A ten is ten steps. Jump from 34 ten steps to the right. The tens digit goes up by one and the ones digit stays the same: 34 to 44.",
      supports: tiers(
        {
          frames: ["34 plus 10 is ___.", "The ___ digit changed."],
          wordBank: ["jump", "ten more", "tens digit", "ones digit"],
          directions: "Make the jump go right by one whole ten.",
        },
        {
          frames: ["10 more than 34 is ___.", "The tens digit went from ___ to ___."],
          wordBank: ["ten more", "tens digit"],
        },
        [
          "Ten more than 34 is ___ because the ___ digit went up by ___ and the ___ digit did not change.",
        ],
      ),
      explain: {
        prompt: "What happened to the tens digit and the ones digit when you added a ten?",
        frames: fr(
          ["The tens digit went from ___ to ___.", "The ones digit stayed ___."],
          ["When I added a ten, the ___ digit went up by one and the ___ digit stayed the same."],
          ["Adding a ten changes the ___ digit by one because ___, and the ones digit stays ___."],
          ["A ten is one group of ten, so only the tens digit changes: ___ becomes ___."],
        ),
        mustMention: [
          { id: "tens", label: "the tens digit", any: ["tens", "ten digit"] },
          { id: "ones", label: "the ones digit", any: ["ones", "same"] },
        ],
      },
    },
  ],
  reflection: {
    prompt: "What helped you place numbers on the number line? Tell about tens and ones.",
    frames: {
      ee: ["I found the ___ first.", "Then I counted ___ ones."],
      dev: ["I used the tens marks to ___.", "Then I counted ___ ones."],
      exp: ["Tens helped me find the ___, and then I counted the ___ ones."],
      br: [
        "Using place value, I placed a number by ___ and then ___, which helped me because ___.",
      ],
    },
  },
  review: { status: "authored", checks: {} },
  version: "1.0.0",
  updated: "2026-11-23",
  source: "Original - The Language Page",
};
