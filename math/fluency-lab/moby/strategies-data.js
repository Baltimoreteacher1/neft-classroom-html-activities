// Strategy lessons data for all 14 fixed strategy IDs.
// Pure data: no DOM, no clock, no randomness. Every worked demonstration is mathematically verified.
import { tx, say, normalizeFact, answerOf, factText, itemOf } from "./strategies-kit.js";
import { STRATEGY_IDS } from "./fact-strategies.js";

export const STRATEGIES_DATA = Object.freeze({
  "count-on": {
    id: "count-on",
    title: tx("Count on"),
    when: tx("When adding 1, 2, or 3, or subtracting numbers close to each other."),
    grades: [1, 2],
    operations: ["+", "−"],
    modelKind: "numberline",
    examples: [
      normalizeFact("7 + 2"),
      normalizeFact("8 + 1"),
      normalizeFact("6 + 3"),
    ],
    demonstration: {
      fact: normalizeFact("7 + 2"),
      steps: [
        {
          caption: tx("Start with the larger number, 7."),
          equation: "7",
          state: { start: 7, hops: [] },
          highlight: "start",
        },
        {
          caption: tx("Count on 1 more: 7 + 1 = 8."),
          equation: "7 + 1 = 8",
          state: { start: 7, hops: [1] },
          highlight: "hop",
        },
        {
          caption: tx("Count on 1 more: 8 + 1 = 9."),
          equation: "7 + 2 = 9",
          state: { start: 7, hops: [1, 1] },
          highlight: "end",
        },
        {
          caption: tx("7 plus 2 is 9. We made 2 quick jumps!"),
          equation: "7 + 2 = 9",
          state: { start: 7, hops: [1, 1] },
          highlight: "all",
        },
      ],
    },
    tryIt: {
      fact: normalizeFact("5 + 2"),
      target: { start: 5, hops: [1, 1] },
      instruction: tx("Start at 5 on the number line and jump 2 times."),
    },
    choose: {
      question: tx("Which problem is best for the Count On strategy?"),
      options: [
        { text: "8 + 2", correct: true, reason: tx("Adding 2 is quick: start at 8 and count on 2.") },
        { text: "6 + 6", correct: false, reason: tx("Both numbers are the same, so Doubles is faster.") },
        { text: "9 × 7", correct: false, reason: tx("This is multiplication, not adding a few ones.") },
        { text: "24 ÷ 6", correct: false, reason: tx("This is division.") },
      ],
    },
    why: tx("Starting at the larger number and counting on a few ones keeps counting fast and accurate."),
    misconception: tx("Counting on from the smaller number takes extra time. Always start with the larger number!"),
  },

  doubles: {
    id: "doubles",
    title: tx("Doubles"),
    when: tx("When both addends or factors are the same number."),
    grades: [1, 3],
    operations: ["+", "×"],
    modelKind: "tenframe",
    examples: [
      normalizeFact("6 + 6"),
      normalizeFact("7 + 7"),
      normalizeFact("8 + 8"),
    ],
    demonstration: {
      fact: normalizeFact("6 + 6"),
      steps: [
        {
          caption: tx("Show the first group of 6."),
          equation: "6",
          state: { n1: 6, n2: 0 },
          highlight: "first",
        },
        {
          caption: tx("Add the exact same amount: another 6."),
          equation: "6 + 6",
          state: { n1: 6, n2: 6 },
          highlight: "second",
        },
        {
          caption: tx("Fill ten: 6 + 4 makes 10, plus 2 more is 12."),
          equation: "6 + 6 = 12",
          state: { n1: 6, n2: 6 },
          highlight: "all",
        },
        {
          caption: tx("Double 6 is 12."),
          equation: "6 + 6 = 12",
          state: { n1: 6, n2: 6 },
          highlight: "all",
        },
      ],
    },
    tryIt: {
      fact: normalizeFact("4 + 4"),
      target: { n1: 4, n2: 4 },
      instruction: tx("Place 4 counters in the top frame and 4 in the bottom frame."),
    },
    choose: {
      question: tx("Which problem is a Doubles fact?"),
      options: [
        { text: "7 + 7", correct: true, reason: tx("Both numbers are exactly 7.") },
        { text: "7 + 8", correct: false, reason: tx("The numbers are close, but not identical (Near Doubles).") },
        { text: "9 + 3", correct: false, reason: tx("The numbers are different.") },
        { text: "8 × 5", correct: false, reason: tx("This is multiplying by 5.") },
      ],
    },
    why: tx("Doubles are anchor facts that make neighboring facts easy to figure out."),
    misconception: tx("Forgetting that a double requires both parts to be identical."),
  },

  "near-doubles": {
    id: "near-doubles",
    title: tx("Near doubles"),
    when: tx("When two addends are consecutive numbers (differ by 1)."),
    grades: [1, 3],
    operations: ["+"],
    modelKind: "tenframe",
    examples: [
      normalizeFact("6 + 7"),
      normalizeFact("5 + 6"),
      normalizeFact("7 + 8"),
    ],
    demonstration: {
      fact: normalizeFact("6 + 7"),
      steps: [
        {
          caption: tx("Start with the double you know: 6 + 6 = 12."),
          equation: "6 + 6 = 12",
          state: { n1: 6, n2: 6 },
          highlight: "double",
        },
        {
          caption: tx("7 is 1 more than 6. Add 1 more counter."),
          equation: "12 + 1 = 13",
          state: { n1: 6, n2: 7 },
          highlight: "extra",
        },
        {
          caption: tx("So 6 + 7 = 13."),
          equation: "6 + 7 = 13",
          state: { n1: 6, n2: 7 },
          highlight: "all",
        },
      ],
    },
    tryIt: {
      fact: normalizeFact("4 + 5"),
      target: { n1: 4, n2: 5 },
      instruction: tx("Build 4 counters and 5 counters on the frames."),
    },
    choose: {
      question: tx("Which fact is a Near Double?"),
      options: [
        { text: "6 + 7", correct: true, reason: tx("6 and 7 differ by 1, so use double 6 plus 1.") },
        { text: "6 + 6", correct: false, reason: tx("This is an exact double.") },
        { text: "8 + 2", correct: false, reason: tx("8 and 2 make 10, not near doubles.") },
        { text: "9 × 3", correct: false, reason: tx("This is multiplication.") },
      ],
    },
    why: tx("Think of the double you know and adjust by 1."),
    misconception: tx("Subtracting 1 instead of adding 1 when using the smaller double."),
  },

  "make-ten": {
    id: "make-ten",
    title: tx("Make a ten"),
    when: tx("When an addend is close to 10 (like 8 or 9)."),
    grades: [1, 3],
    operations: ["+", "−"],
    modelKind: "tenframe",
    examples: [
      normalizeFact("8 + 5"),
      normalizeFact("9 + 4"),
      normalizeFact("8 + 7"),
    ],
    demonstration: {
      fact: normalizeFact("8 + 5"),
      steps: [
        {
          caption: tx("Place 8 in the first frame and 5 in the second."),
          equation: "8 + 5",
          state: { n1: 8, n2: 5 },
          highlight: "start",
        },
        {
          caption: tx("8 needs 2 to make a full 10. Move 2 from the 5."),
          equation: "8 + 2 = 10",
          state: { n1: 10, n2: 3 },
          highlight: "move",
        },
        {
          caption: tx("Now you have 10 and 3 left over."),
          equation: "10 + 3 = 13",
          state: { n1: 10, n2: 3 },
          highlight: "ten",
        },
        {
          caption: tx("8 + 5 is 13!"),
          equation: "8 + 5 = 13",
          state: { n1: 10, n2: 3 },
          highlight: "all",
        },
      ],
    },
    tryIt: {
      fact: normalizeFact("9 + 4"),
      target: { n1: 9, n2: 4 },
      instruction: tx("Place 9 counters in the top frame and 4 in the bottom frame."),
    },
    choose: {
      question: tx("Which problem is best for Make a Ten?"),
      options: [
        { text: "8 + 5", correct: true, reason: tx("8 is close to 10: borrow 2 from 5 to make 10 + 3 = 13.") },
        { text: "3 + 3", correct: false, reason: tx("Both numbers are small and identical (use Doubles).") },
        { text: "12 − 2", correct: false, reason: tx("This is already subtraction from 12.") },
        { text: "7 × 4", correct: false, reason: tx("This is multiplication.") },
      ],
    },
    why: tx("Ten is a friendly base in our number system; adding to ten is instant."),
    misconception: tx("Borrowing the wrong complement (e.g. pairing 8 with 3 instead of 2)."),
  },

  "break-apart": {
    id: "break-apart",
    title: tx("Break apart"),
    when: tx("When breaking a number into friendly place-value parts makes the problem easier."),
    grades: [2, 5],
    operations: ["+", "−", "×"],
    modelKind: "baseten",
    examples: [
      normalizeFact("6 × 7"),
      normalizeFact("7 × 8"),
      normalizeFact("8 × 6"),
    ],
    demonstration: {
      fact: normalizeFact("6 × 7"),
      steps: [
        {
          caption: tx("Think of 6 × 7. 7 can break into 5 + 2."),
          equation: "6 × 7 = 6 × (5 + 2)",
          state: { tens: 0, ones: 42 },
          highlight: "split",
        },
        {
          caption: tx("Multiply each part: 6 × 5 = 30."),
          equation: "6 × 5 = 30",
          state: { tens: 3, ones: 0 },
          highlight: "first",
        },
        {
          caption: tx("Multiply the other part: 6 × 2 = 12."),
          equation: "6 × 2 = 12",
          state: { tens: 4, ones: 2 },
          highlight: "second",
        },
        {
          caption: tx("Add the parts: 30 + 12 = 42."),
          equation: "30 + 12 = 42",
          state: { tens: 4, ones: 2 },
          highlight: "sum",
        },
      ],
    },
    tryIt: {
      fact: normalizeFact("6 × 7"),
      target: { tens: 4, ones: 2 },
      instruction: tx("Represent the product 42 using 4 tens and 2 ones."),
    },
    choose: {
      question: tx("How can you break apart 6 × 7 to solve it?"),
      options: [
        { text: "(6 × 5) + (6 × 2)", correct: true, reason: tx("7 breaks into 5 + 2, giving 30 + 12 = 42.") },
        { text: "(6 × 4) + (6 × 4)", correct: false, reason: tx("4 + 4 is 8, not 7.") },
        { text: "6 + 7", correct: false, reason: tx("That adds instead of multiplying.") },
        { text: "60 − 7", correct: false, reason: tx("60 is 10 × 6, not connected to 7.") },
      ],
    },
    why: tx("Breaking numbers into smaller known pieces lets you solve complex problems with simple facts."),
    misconception: tx("Breaking apart a factor and forgetting to multiply BOTH parts before adding."),
  },

  "skip-count": {
    id: "skip-count",
    title: tx("Skip-count"),
    when: tx("When multiplying by 2, 3, 4, 5, or 10."),
    grades: [2, 4],
    operations: ["×", "÷"],
    modelKind: "numberline",
    examples: [
      normalizeFact("3 × 4"),
      normalizeFact("3 × 5"),
      normalizeFact("4 × 3"),
    ],
    demonstration: {
      fact: normalizeFact("3 × 4"),
      steps: [
        {
          caption: tx("Start at 0 on the number line."),
          equation: "0",
          state: { start: 0, hops: [] },
          highlight: "zero",
        },
        {
          caption: tx("First jump of 3: reaches 3."),
          equation: "3",
          state: { start: 0, hops: [3] },
          highlight: "hop1",
        },
        {
          caption: tx("Second jump of 3: reaches 6."),
          equation: "3 + 3 = 6",
          state: { start: 0, hops: [3, 3] },
          highlight: "hop2",
        },
        {
          caption: tx("Third jump of 3: reaches 9."),
          equation: "6 + 3 = 9",
          state: { start: 0, hops: [3, 3, 3] },
          highlight: "hop3",
        },
        {
          caption: tx("Fourth jump of 3: reaches 12. 3 × 4 = 12!"),
          equation: "3 × 4 = 12",
          state: { start: 0, hops: [3, 3, 3, 3] },
          highlight: "all",
        },
      ],
    },
    tryIt: {
      fact: normalizeFact("3 × 3"),
      target: { start: 0, hops: [3, 3, 3] },
      instruction: tx("Make 3 jumps of size 3 on the number line."),
    },
    choose: {
      question: tx("Which problem is well suited for skip-counting by 3s?"),
      options: [
        { text: "3 × 4", correct: true, reason: tx("Count by 3s four times: 3, 6, 9, 12.") },
        { text: "7 × 8", correct: false, reason: tx("Neither number is 3.") },
        { text: "11 × 11", correct: false, reason: tx("Numbers are too large for simple skip counting.") },
        { text: "9 + 9", correct: false, reason: tx("This is addition (Doubles).") },
      ],
    },
    why: tx("Equal jumps on a number line directly represent repeated addition and multiplication."),
    misconception: tx("Losing track of how many jumps have been taken."),
  },

  "array-model": {
    id: "array-model",
    title: tx("Array model"),
    when: tx("When visualizing rows and columns of equal groups."),
    grades: [2, 4],
    operations: ["×", "÷"],
    modelKind: "array",
    examples: [
      normalizeFact("3 × 4"),
      normalizeFact("2 × 5"),
      normalizeFact("4 × 4"),
    ],
    demonstration: {
      fact: normalizeFact("3 × 4"),
      steps: [
        {
          caption: tx("Show 3 rows with 4 dots in each row."),
          equation: "3 × 4",
          state: { rows: 3, cols: 4 },
          highlight: "grid",
        },
        {
          caption: tx("Row 1 has 4 dots. Row 2 has 4 dots. Row 3 has 4 dots."),
          equation: "4 + 4 + 4 = 12",
          state: { rows: 3, cols: 4 },
          highlight: "rows",
        },
        {
          caption: tx("Turn the array: 4 columns of 3 is also 12!"),
          equation: "4 × 3 = 12",
          state: { rows: 3, cols: 4 },
          highlight: "cols",
        },
        {
          caption: tx("3 rows of 4 makes 12 in total."),
          equation: "3 × 4 = 12",
          state: { rows: 3, cols: 4 },
          highlight: "all",
        },
      ],
    },
    tryIt: {
      fact: normalizeFact("2 × 4"),
      target: { rows: 2, cols: 4 },
      instruction: tx("Create an array with 2 rows and 4 columns."),
    },
    choose: {
      question: tx("What does an array of 3 rows and 4 columns show?"),
      options: [
        { text: "3 × 4 = 12", correct: true, reason: tx("3 rows of 4 dots make 12 total dots.") },
        { text: "3 + 4 = 7", correct: false, reason: tx("An array multiplies rows by columns, not adds.") },
        { text: "34", correct: false, reason: tx("Digits are not joined.") },
        { text: "4 ÷ 3", correct: false, reason: tx("The total is 12, not 4.") },
      ],
    },
    why: tx("Rows and columns show that multiplication is commutative: 3 × 4 is the same total as 4 × 3."),
    misconception: tx("Confusing the number of rows with the number of columns."),
  },

  "ones-and-zeros": {
    id: "ones-and-zeros",
    title: tx("Ones and zeros"),
    when: tx("When adding 0, multiplying by 0, or multiplying/dividing by 1."),
    grades: [1, 4],
    operations: ["+", "−", "×", "÷"],
    modelKind: "groups",
    examples: [
      normalizeFact("7 + 0"),
      normalizeFact("8 × 1"),
      normalizeFact("9 × 0"),
    ],
    demonstration: {
      fact: normalizeFact("8 × 1"),
      steps: [
        {
          caption: tx("1 group of 8 items."),
          equation: "1 group of 8",
          state: { groups: 1, size: 8 },
          highlight: "group",
        },
        {
          caption: tx("Since there is only 1 group, the total is 8."),
          equation: "8 × 1 = 8",
          state: { groups: 1, size: 8 },
          highlight: "all",
        },
        {
          caption: tx("Any number multiplied by 1 is itself!"),
          equation: "n × 1 = n",
          state: { groups: 1, size: 8 },
          highlight: "all",
        },
      ],
    },
    tryIt: {
      fact: normalizeFact("6 × 1"),
      target: { groups: 1, size: 6 },
      instruction: tx("Make 1 group of 6 items."),
    },
    choose: {
      question: tx("Which problem follows the Ones and Zeros rule?"),
      options: [
        { text: "8 × 1 = 8", correct: true, reason: tx("Multiplying by 1 keeps the number unchanged.") },
        { text: "8 × 2 = 16", correct: false, reason: tx("Multiplying by 2 is doubling.") },
        { text: "7 + 6 = 13", correct: false, reason: tx("Neither number is 0 or 1.") },
        { text: "9 − 4 = 5", correct: false, reason: tx("Neither number is 0 or 1.") },
      ],
    },
    why: tx("Adding 0 changes nothing; multiplying by 1 keeps the same amount."),
    misconception: tx("Confusing 5 × 0 = 0 with 5 + 0 = 5."),
  },

  "fives-and-tens": {
    id: "fives-and-tens",
    title: tx("Fives and tens"),
    when: tx("When multiplying or dividing with 5 or 10."),
    grades: [2, 5],
    operations: ["×", "÷"],
    modelKind: "array",
    examples: [
      normalizeFact("5 × 6"),
      normalizeFact("10 × 4"),
      normalizeFact("5 × 8"),
    ],
    demonstration: {
      fact: normalizeFact("5 × 6"),
      steps: [
        {
          caption: tx("Think of 10 × 6 first: 10 × 6 = 60."),
          equation: "10 × 6 = 60",
          state: { rows: 10, cols: 6 },
          highlight: "ten",
        },
        {
          caption: tx("5 is half of 10. So 5 × 6 is half of 60."),
          equation: "Half of 60 is 30",
          state: { rows: 5, cols: 6 },
          highlight: "half",
        },
        {
          caption: tx("5 × 6 = 30."),
          equation: "5 × 6 = 30",
          state: { rows: 5, cols: 6 },
          highlight: "all",
        },
      ],
    },
    tryIt: {
      fact: normalizeFact("5 × 4"),
      target: { rows: 5, cols: 4 },
      instruction: tx("Build an array with 5 rows and 4 columns."),
    },
    choose: {
      question: tx("How can you find 5 × 8 using tens?"),
      options: [
        { text: "Find 10 × 8 = 80, then take half = 40", correct: true, reason: tx("5 is half of 10, so half of 80 is 40.") },
        { text: "Add 10 and 8", correct: false, reason: tx("That adds instead of multiplying.") },
        { text: "Multiply 8 × 8", correct: false, reason: tx("That is a square fact, not multiplying by 5.") },
        { text: "Subtract 5 from 80", correct: false, reason: tx("Half means divide by 2, not subtract 5.") },
      ],
    },
    why: tx("Multiplying by 10 shifts place value; multiplying by 5 is always half of multiplying by 10."),
    misconception: tx("Thinking numbers ending in 5 can have any last digit; multiples of 5 always end in 0 or 5."),
  },

  "nines-pattern": {
    id: "nines-pattern",
    title: tx("Nines pattern"),
    when: tx("When multiplying by 9."),
    grades: [3, 5],
    operations: ["×"],
    modelKind: "array",
    examples: [
      normalizeFact("9 × 7"),
      normalizeFact("9 × 6"),
      normalizeFact("9 × 4"),
    ],
    demonstration: {
      fact: normalizeFact("9 × 7"),
      steps: [
        {
          caption: tx("9 is 1 less than 10. Think 10 × 7 first: 70."),
          equation: "10 × 7 = 70",
          state: { rows: 10, cols: 7 },
          highlight: "ten",
        },
        {
          caption: tx("Subtract 1 group of 7: 70 − 7 = 63."),
          equation: "70 − 7 = 63",
          state: { rows: 9, cols: 7 },
          highlight: "minus",
        },
        {
          caption: tx("9 × 7 = 63. Notice: 6 + 3 = 9!"),
          equation: "9 × 7 = 63",
          state: { rows: 9, cols: 7 },
          highlight: "all",
        },
      ],
    },
    tryIt: {
      fact: normalizeFact("9 × 4"),
      target: { rows: 9, cols: 4 },
      instruction: tx("Create an array with 9 rows and 4 columns."),
    },
    choose: {
      question: tx("How can you solve 9 × 6 using the Nines Pattern?"),
      options: [
        { text: "(10 × 6) − 6 = 54", correct: true, reason: tx("10 groups of 6 minus 1 group of 6 gives 9 groups = 54.") },
        { text: "(10 × 6) − 9 = 51", correct: false, reason: tx("You subtract one group of 6, not 9.") },
        { text: "9 + 6 = 15", correct: false, reason: tx("This adds instead of multiplying.") },
        { text: "6 × 6 = 36", correct: false, reason: tx("This is a square fact, not 9 × 6.") },
      ],
    },
    why: tx("9 is one less than 10, so 9 groups is 10 groups minus 1 group."),
    misconception: tx("Subtracting 9 instead of subtracting 1 group of the other factor."),
  },

  "square-facts": {
    id: "square-facts",
    title: tx("Square facts"),
    when: tx("When multiplying a number by itself (a × a) or finding a square root."),
    grades: [3, 5],
    operations: ["×", "÷"],
    modelKind: "array",
    examples: [
      normalizeFact("6 × 6"),
      normalizeFact("7 × 7"),
      normalizeFact("8 × 8"),
    ],
    demonstration: {
      fact: normalizeFact("6 × 6"),
      steps: [
        {
          caption: tx("6 rows and 6 columns form a square array."),
          equation: "6 × 6",
          state: { rows: 6, cols: 6 },
          highlight: "shape",
        },
        {
          caption: tx("5 rows of 6 is 30, plus 1 more row of 6 is 36."),
          equation: "30 + 6 = 36",
          state: { rows: 6, cols: 6 },
          highlight: "parts",
        },
        {
          caption: tx("6 × 6 = 36. It forms a perfect square!"),
          equation: "6 × 6 = 36",
          state: { rows: 6, cols: 6 },
          highlight: "all",
        },
      ],
    },
    tryIt: {
      fact: normalizeFact("5 × 5"),
      target: { rows: 5, cols: 5 },
      instruction: tx("Build a square array with 5 rows and 5 columns."),
    },
    choose: {
      question: tx("Which fact is a Square Fact?"),
      options: [
        { text: "7 × 7 = 49", correct: true, reason: tx("7 multiplied by itself makes a square array.") },
        { text: "7 × 8 = 56", correct: false, reason: tx("The factors are different.") },
        { text: "6 × 4 = 24", correct: false, reason: tx("The factors are different.") },
        { text: "9 + 9 = 18", correct: false, reason: tx("This is addition (Doubles).") },
      ],
    },
    why: tx("Square facts form a perfect square array and serve as reliable landmarks on the multiplication table."),
    misconception: tx("Doubling the number (e.g. 6 × 2 = 12) instead of multiplying it by itself (6 × 6 = 36)."),
  },

  "fact-family": {
    id: "fact-family",
    title: tx("Fact family"),
    when: tx("When using related multiplication/division or addition/subtraction facts."),
    grades: [1, 4],
    operations: ["+", "−", "×", "÷"],
    modelKind: "partwhole",
    examples: [
      normalizeFact("24 / 6"),
      normalizeFact("13 − 8"),
      normalizeFact("36 / 9"),
    ],
    demonstration: {
      fact: normalizeFact("24 / 6"),
      steps: [
        {
          caption: tx("Think: what times 6 equals 24?"),
          equation: "? × 6 = 24",
          state: { whole: 24, part1: 6, part2: null },
          highlight: "question",
        },
        {
          caption: tx("You know 4 × 6 = 24."),
          equation: "4 × 6 = 24",
          state: { whole: 24, part1: 6, part2: 4 },
          highlight: "part",
        },
        {
          caption: tx("So 24 ÷ 6 = 4!"),
          equation: "24 ÷ 6 = 4",
          state: { whole: 24, part1: 6, part2: 4 },
          highlight: "all",
        },
      ],
    },
    tryIt: {
      fact: normalizeFact("24 / 4"),
      target: { whole: 24, part1: 4, part2: 6 },
      instruction: tx("Show the parts of the 24 family with parts 4 and 6."),
    },
    choose: {
      question: tx("Which multiplication fact helps you solve 24 ÷ 6?"),
      options: [
        { text: "4 × 6 = 24", correct: true, reason: tx("Division is the inverse of multiplication: 4 × 6 = 24 means 24 ÷ 6 = 4.") },
        { text: "24 + 6 = 30", correct: false, reason: tx("Adding does not undo division.") },
        { text: "6 × 6 = 36", correct: false, reason: tx("That uses 36, not 24.") },
        { text: "24 − 6 = 18", correct: false, reason: tx("Subtracting only once does not find equal groups.") },
      ],
    },
    why: tx("Multiplication and division undo each other; three numbers form four connected equations."),
    misconception: tx("Guessing randomly instead of using the known inverse multiplication fact."),
  },

  "half-and-double": {
    id: "half-and-double",
    title: tx("Half and double"),
    when: tx("When multiplying with an even number like 4, 8, or 12."),
    grades: [3, 6],
    operations: ["×", "÷"],
    modelKind: "array",
    examples: [
      normalizeFact("4 × 8"),
      normalizeFact("4 × 7"),
      normalizeFact("8 × 6"),
    ],
    demonstration: {
      fact: normalizeFact("4 × 8"),
      steps: [
        {
          caption: tx("Think of 4 as double 2."),
          equation: "4 × 8 = 2 × (2 × 8)",
          state: { rows: 4, cols: 8 },
          highlight: "split",
        },
        {
          caption: tx("First double 8: 2 × 8 = 16."),
          equation: "2 × 8 = 16",
          state: { rows: 2, cols: 8 },
          highlight: "first",
        },
        {
          caption: tx("Double again: double 16 is 32."),
          equation: "16 + 16 = 32",
          state: { rows: 4, cols: 8 },
          highlight: "second",
        },
        {
          caption: tx("So 4 × 8 = 32!"),
          equation: "4 × 8 = 32",
          state: { rows: 4, cols: 8 },
          highlight: "all",
        },
      ],
    },
    tryIt: {
      fact: normalizeFact("4 × 6"),
      target: { rows: 4, cols: 6 },
      instruction: tx("Create an array with 4 rows and 6 columns."),
    },
    choose: {
      question: tx("How can you solve 4 × 7 by doubling?"),
      options: [
        { text: "Double 7 is 14, and double 14 is 28", correct: true, reason: tx("Multiplying by 4 is doubling twice: 7 -> 14 -> 28.") },
        { text: "Double 7 is 14, and add 4 = 18", correct: false, reason: tx("You double again, not add 4.") },
        { text: "7 + 4 = 11", correct: false, reason: tx("This adds instead of multiplying.") },
        { text: "Half of 28 is 14", correct: false, reason: tx("That is working backwards from the answer.") },
      ],
    },
    why: tx("Multiplying by 4 is doubling twice; multiplying by 8 is doubling three times."),
    misconception: tx("Doubling only once when multiplying by 4, or doubling the wrong factor."),
  },

  distributive: {
    id: "distributive",
    title: tx("Distributive property"),
    when: tx("When multiplying with larger numbers like 11, 12, or breaking factors apart."),
    grades: [3, 6],
    operations: ["×"],
    modelKind: "array",
    examples: [
      normalizeFact("7 × 12"),
      normalizeFact("8 × 11"),
      normalizeFact("6 × 12"),
    ],
    demonstration: {
      fact: normalizeFact("7 × 12"),
      steps: [
        {
          caption: tx("Break 12 into 10 + 2."),
          equation: "7 × 12 = 7 × (10 + 2)",
          state: { rows: 7, cols: 12 },
          highlight: "break",
        },
        {
          caption: tx("Distribute 7 to 10: 7 × 10 = 70."),
          equation: "7 × 10 = 70",
          state: { rows: 7, cols: 10 },
          highlight: "ten",
        },
        {
          caption: tx("Distribute 7 to 2: 7 × 2 = 14."),
          equation: "7 × 2 = 14",
          state: { rows: 7, cols: 2 },
          highlight: "two",
        },
        {
          caption: tx("Add the parts: 70 + 14 = 84. 7 × 12 = 84!"),
          equation: "70 + 14 = 84",
          state: { rows: 7, cols: 12 },
          highlight: "all",
        },
      ],
    },
    tryIt: {
      fact: normalizeFact("6 × 12"),
      target: { rows: 6, cols: 12 },
      instruction: tx("Build an array with 6 rows and 12 columns."),
    },
    choose: {
      question: tx("How do you use the Distributive Property for 7 × 12?"),
      options: [
        { text: "(7 × 10) + (7 × 2) = 70 + 14 = 84", correct: true, reason: tx("12 splits into 10 + 2. Distribute 7 to both parts and add.") },
        { text: "(7 × 10) + 2 = 72", correct: false, reason: tx("You must multiply the 2 by 7 as well.") },
        { text: "7 + 12 = 19", correct: false, reason: tx("This adds instead of multiplying.") },
        { text: "7 × 1 = 7, 7 × 2 = 14 -> 714", correct: false, reason: tx("Place values must be added, not concatenated.") },
      ],
    },
    why: tx("The distributive property allows you to distribute multiplication across addition: a × (b + c) = a×b + a×c."),
    misconception: tx("Multiplying only one of the added terms and forgetting the second term."),
  },
});

export const getStrategy = (id) => STRATEGIES_DATA[id] || null;
export const allStrategies = () => Object.values(STRATEGIES_DATA);
