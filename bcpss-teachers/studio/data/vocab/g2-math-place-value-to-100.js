// Grade 2 math: words for tens and ones in two-digit numbers and for comparing them. Picture first.
const ROD_W = 18;
const ROD_H = 130;
// Base-ten blocks drawn from shapes: `t` ten-rods, then `o` unit squares stacked three wide, bottom aligned.
function blocks(t, o, x0 = 40, y0 = 60, sc = 1) {
  const rw = ROD_W * sc;
  const rh = ROD_H * sc;
  const gap = 5 * sc;
  const out = [];
  for (let i = 0; i < t; i++) {
    const x = x0 + i * (rw + gap);
    out.push({ t: "rect", x, y: y0, w: rw, h: rh, fill: "teal", stroke: "ink", sw: 2 });
    for (let k = 1; k < 10; k++)
      out.push({
        t: "line",
        x1: x,
        y1: y0 + (k * rh) / 10,
        x2: x + rw,
        y2: y0 + (k * rh) / 10,
        sw: 1,
      });
  }
  const ox = x0 + t * (rw + gap) + (t ? 14 * sc : 0);
  for (let j = 0; j < o; j++)
    out.push({
      t: "rect",
      x: ox + (j % 3) * (rw + gap),
      y: y0 + rh - rw - Math.floor(j / 3) * (rw + gap),
      w: rw,
      h: rw,
      fill: "ochre",
      stroke: "ink",
      sw: 2,
    });
  return out;
}
const txt = (text, x, y, size = 36, anchor = "middle") => ({
  t: "text",
  text,
  x,
  y,
  size,
  weight: 700,
  anchor,
});
const shapes = (alt, items) => ({ kind: "shapes", alt, w: 480, h: 280, items });
const flat = (x, y, s) => [
  { t: "rect", x, y, w: s, h: s, fill: "sky", stroke: "ink", sw: 3 },
  ...Array.from({ length: 9 }, (_, k) => ({
    t: "line",
    x1: x + ((k + 1) * s) / 10,
    y1: y,
    x2: x + ((k + 1) * s) / 10,
    y2: y + s,
    sw: 1,
  })),
  ...Array.from({ length: 9 }, (_, k) => ({
    t: "line",
    x1: x,
    y1: y + ((k + 1) * s) / 10,
    x2: x + s,
    y2: y + ((k + 1) * s) / 10,
    sw: 1,
  })),
];
const box = (x, y, w, h) => ({
  t: "rect",
  x,
  y,
  w,
  h,
  rx: 12,
  fill: "surface",
  stroke: "ink",
  sw: 3,
});

export default {
  id: "g2-math-place-value-to-100",
  title: "Place value to 100",
  grade: "2",
  band: "k-2",
  subject: "math",
  curriculum: {
    status: "standards-aligned",
    note: "Aligned to 2.NBT.A.1, 2.NBT.A.2 and 1.NBT.B.2; not mapped to a district unit sequence.",
  },
  standards: ["2.NBT.A.1", "2.NBT.A.2", "1.NBT.B.2"],
  entries: [
    {
      id: "digit",
      word: "digit",
      pos: "noun",
      pron: "DIJ-it",
      def: "One of the number symbols 0 to 9. A number is written with one or more digits.",
      visual: shapes("The number 47 written with two digits: a 4 and a 7, each in its own box.", [
        box(130, 70, 100, 120),
        box(250, 70, 100, 120),
        txt("4", 180, 150, 90),
        txt("7", 300, 150, 90),
        txt("digit", 180, 225, 26),
        txt("digit", 300, 225, 26),
      ]),
      context: "The number 47 has two digits, 4 and 7.",
      nonExample: "47 is not a digit. It is a number made from two digits.",
      academicSentence: "The number 47 is written with the digits 4 and 7.",
      everyday: "Like the numbers on a phone keypad: each button is one digit.",
      es: { word: "dígito", def: "Uno de los símbolos de número del 0 al 9.", verified: true },
      morphology: { parts: [{ part: "digit", meaning: "from a Latin word for finger" }] },
      related: ["place value", "two-digit number", "ones", "tens"],
      misconception:
        "Students use digit and number as the same word. A number can have several digits, and each digit has a value that depends on its place.",
      practice: {
        visualPrompt: "Point to each digit in 47. How many digits are there?",
        speakWrite: "Write a number with two digits. Say: My number has the digits ___ and ___.",
        retrieval: "What is the difference between a digit and a number?",
      },
      tier: 2,
      domains: ["Speaking", "Writing"],
      klu: "Inform",
    },
    {
      id: "ones",
      word: "ones",
      pos: "noun",
      pron: "WUNZ",
      def: "Single units. The digit on the right in a two-digit number tells how many ones.",
      visual: shapes(
        "Seven single unit squares arranged in rows of three with the words 7 ones above them.",
        [txt("7 ones", 240, 60, 36), ...blocks(0, 7, 175, 90, 1.2)],
      ),
      context: "In 47, the 7 means 7 ones.",
      nonExample: "A rod is not a one. A rod is a ten, made of ten ones joined together.",
      academicSentence: "The digit on the right tells how many ones there are.",
      everyday: "Like single pennies, each worth one cent.",
      es: {
        word: "unidades",
        def: "Unidades sueltas. El dígito de la derecha dice cuántas unidades hay.",
        verified: true,
      },
      related: ["tens", "digit", "place value"],
      misconception:
        "Students say the 7 in 47 means 'seven' without saying what it is seven of. Insist on '7 ones'.",
      practice: {
        visualPrompt: "How many ones do you see?",
        speakWrite: "Say: In the number 36, the 6 means ___ ones.",
        retrieval: "Which digit tells how many ones: the left digit or the right digit?",
      },
      tier: 2,
      domains: ["Speaking", "Writing"],
      klu: "Explain",
    },
    {
      id: "tens",
      word: "tens",
      pos: "noun",
      pron: "TENZ",
      def: "Groups of ten ones. The digit on the left in a two-digit number tells how many tens.",
      visual: shapes(
        "Four ten-rods standing side by side with the words 4 tens above them. Each rod is ten connected units.",
        [txt("4 tens", 240, 60, 36), ...blocks(4, 0, 170, 85, 1.2)],
      ),
      context: "In 47, the 4 means 4 tens, which is 40.",
      nonExample: "The 4 in 47 does not mean 4 ones. It means 4 tens.",
      academicSentence: "The digit on the left tells how many tens there are.",
      everyday: "Like dimes: each dime is worth ten cents.",
      es: {
        word: "decenas",
        def: "Grupos de diez unidades. El dígito de la izquierda dice cuántas decenas hay.",
        verified: true,
      },
      related: ["ones", "hundred", "place value"],
      misconception:
        "Students read the 4 in 47 as 4 and not 40. Show four rods and count by tens: 10, 20, 30, 40.",
      practice: {
        visualPrompt: "Count the rods by tens. How many tens? What number is that?",
        speakWrite: "Say: In the number 52, the 5 means ___ tens, which is ___.",
        retrieval: "How many ones are in one ten?",
      },
      tier: 2,
      domains: ["Speaking", "Writing"],
      klu: "Explain",
    },
    {
      id: "place-value",
      word: "place value",
      pos: "noun",
      pron: "PLAYSS VAL-yoo",
      def: "The value of a digit depends on its place in the number.",
      visual: shapes(
        "The number 47 with base-ten blocks. Four ten-rods sit under the word tens and seven unit squares sit under the word ones.",
        [
          txt("tens", 110, 40, 28),
          txt("ones", 300, 40, 28),
          ...blocks(4, 7, 50, 60, 1),
          txt("4", 110, 262, 40),
          txt("7", 300, 262, 40),
        ],
      ),
      context: "In 47, the 4 is in the tens place and the 7 is in the ones place.",
      nonExample:
        "The 4 in 47 and the 4 in 74 have different place values. One means 40 and the other means 4.",
      academicSentence: "The same digit can mean different amounts in different places.",
      everyday: "Like a coin: the same picture on a dime and a penny is worth different amounts.",
      es: {
        word: "valor posicional",
        def: "El valor de un dígito depende del lugar donde está en el número.",
        verified: true,
      },
      related: ["digit", "tens", "ones"],
      misconception:
        "Students think a digit always means its own number. In 47 and 74 the digits 4 and 7 swap places and mean very different amounts.",
      practice: {
        visualPrompt: "Compare the 4 in 47 and the 4 in 74. Which is worth more?",
        speakWrite: "Say: In 74 the 7 is in the ___ place, so it means ___.",
        retrieval: "Why is 74 greater than 47 when they use the same digits?",
      },
      tier: 2,
      domains: ["Speaking", "Writing"],
      klu: "Explain",
    },
    {
      id: "two-digit-number",
      word: "two-digit number",
      pos: "noun",
      pron: "TOO DIJ-it NUM-ber",
      def: "A number written with two digits, from 10 to 99.",
      visual: shapes(
        "The number 63 in large print, with the words 6 tens and 3 ones below it and matching base-ten blocks.",
        [
          txt("63", 240, 60, 52),
          ...blocks(6, 3, 130, 105, 0.8),
          txt("6 tens and 3 ones", 240, 240, 24),
        ],
      ),
      context: "63 is a two-digit number with 6 tens and 3 ones.",
      nonExample:
        "8 is not a two-digit number because it has only one digit. 100 has three digits.",
      academicSentence: "A two-digit number has a tens digit and a ones digit.",
      everyday: "Like a house number such as 24 or a page number such as 58.",
      es: {
        word: "número de dos dígitos",
        def: "Un número que se escribe con dos dígitos, del 10 al 99.",
        verified: true,
      },
      related: ["digit", "tens", "ones"],
      misconception:
        "Students think the numbers between 10 and 99 are 'bigger digits' rather than tens and ones. Always say both parts.",
      practice: {
        visualPrompt: "Point to the tens digit and the ones digit in 63.",
        speakWrite: "Write any two-digit number. Say: ___ has ___ tens and ___ ones.",
        retrieval: "What are the two parts of every two-digit number?",
      },
      tier: 2,
      domains: ["Speaking", "Writing"],
      klu: "Inform",
    },
    {
      id: "hundred",
      word: "hundred",
      pos: "noun",
      pron: "HUN-drid",
      def: "Ten tens. One hundred is the same as 100 ones.",
      visual: shapes("A flat of one hundred squares equals ten ten-rods side by side.", [
        ...flat(26, 70, 130),
        txt("=", 190, 150, 54),
        ...blocks(10, 0, 235, 70, 1),
      ]),
      context: "Ten tens make one hundred.",
      nonExample: "Nine tens is 90, not a hundred. One more ten is needed.",
      academicSentence: "One hundred is a bundle of ten tens.",
      everyday: "Like a roll of 100 stickers, or ten rows of ten.",
      es: {
        word: "centena",
        def: "Diez decenas. Una centena es igual a 100 unidades.",
        verified: false,
      },
      related: ["tens", "ones", "place value"],
      misconception:
        "Students say 100 is 'ten ones more than 90'. The 100 is ten tens: one more ten after 90.",
      practice: {
        visualPrompt: "How many tens fit in the big square?",
        speakWrite: "Say: ___ tens make one hundred.",
        retrieval: "What number do you get when you count ten tens?",
      },
      tier: 2,
      domains: ["Speaking", "Writing"],
      klu: "Explain",
    },
    {
      id: "expanded-form",
      word: "expanded form",
      pos: "noun",
      pron: "ik-SPAN-did FORM",
      def: "A number written as the sum of its tens and ones, like 50 + 2.",
      visual: shapes(
        "The number 52 is shown as 50 plus 2 with five ten-rods and two unit squares.",
        [txt("52 = 50 + 2", 240, 55, 44), ...blocks(5, 2, 120, 80, 1)],
      ),
      context: "The expanded form of 52 is 50 + 2.",
      nonExample: "5 + 2 is not the expanded form of 52. It leaves out that the 5 means 5 tens.",
      academicSentence: "I write the number as the tens plus the ones.",
      everyday: "Like counting your money by dimes first and then pennies.",
      es: {
        word: "forma desarrollada",
        def: "Un número escrito como la suma de sus decenas y unidades.",
        verified: false,
      },
      related: ["place value", "tens", "ones"],
      misconception:
        "Students write 5 + 2 for 52 because they add the digits. Each digit must be written with its value: 50 + 2.",
      practice: {
        visualPrompt: "Find the 50 and the 2 in the picture.",
        speakWrite: "Say and write the expanded form of 36: ___ + ___.",
        retrieval: "What is the expanded form of 74?",
      },
      tier: 3,
      domains: ["Speaking", "Writing"],
      klu: "Explain",
    },
    {
      id: "base-ten-blocks",
      word: "base-ten blocks",
      pos: "noun",
      pron: "BAYSS-TEN BLOKS",
      def: "Math pieces that show ones, tens and hundreds: a small cube, a rod and a flat.",
      visual: shapes(
        "Three base-ten pieces: one small square for 1, one long rod for 10 and one large flat for 100.",
        [
          { t: "rect", x: 40, y: 150, w: 26, h: 26, fill: "ochre", stroke: "ink", sw: 2 },
          txt("1", 53, 215, 30),
          ...blocks(1, 0, 150, 70, 1)
            .map((s) => (s.t === "rect" ? { ...s, w: 26 } : s))
            .map((s) => (s.t === "line" ? { ...s, x2: 176 } : s)),
          txt("10", 163, 238, 30),
          ...flat(260, 70, 130),
          txt("100", 325, 238, 30),
        ],
      ),
      context: "I use base-ten blocks, a rod and 3 small cubes, to show 13.",
      nonExample:
        "Plastic building bricks are not base-ten blocks. Their sizes do not show 1, 10 and 100.",
      academicSentence: "Base-ten blocks show the value of each digit.",
      everyday: "Like coins: a penny, a dime and a one-dollar bill stand for 1, 10 and 100 cents.",
      es: {
        word: "bloques de base diez",
        def: "Piezas que muestran unidades, decenas y centenas.",
        verified: true,
      },
      related: ["ones", "tens", "hundred"],
      misconception:
        "Students count a rod as one thing and say 'one' for it. A rod is worth ten because it is ten ones joined.",
      practice: {
        visualPrompt: "Which piece is worth 1? Which is worth 10?",
        speakWrite: "Say: A rod is worth ___. A flat is worth ___.",
        retrieval: "How many ones are in a rod?",
      },
      tier: 2,
      domains: ["Speaking", "Writing"],
      klu: "Inform",
    },
    {
      id: "compare",
      word: "compare",
      pos: "verb",
      pron: "kum-PAIR",
      def: "To look at two numbers and tell how they are alike or different, especially which is greater.",
      visual: shapes(
        "Two numbers, 38 and 52, shown with base-ten blocks side by side so they can be compared.",
        [
          txt("38", 120, 50, 40),
          ...blocks(3, 8, 40, 70, 0.8),
          { t: "line", x1: 240, y1: 40, x2: 240, y2: 250, sw: 3, dash: "6 6" },
          txt("52", 360, 50, 40),
          ...blocks(5, 2, 290, 70, 0.8),
        ],
      ),
      context: "We compare 38 and 52 by looking at the tens first.",
      nonExample:
        "Adding 38 and 52 is not comparing them. Comparing tells which is greater or less.",
      academicSentence: "I compare two numbers by looking at the tens first.",
      everyday: "Like comparing how many stickers you and a friend have.",
      es: {
        word: "comparar",
        def: "Mirar dos números y decir cuál es mayor o menor.",
        verified: true,
      },
      related: ["greater than", "less than", "equal to"],
      misconception:
        "Students compare ones digits first or add the digits. Start with the tens place, then use the ones only if the tens are equal.",
      practice: {
        visualPrompt: "Compare the two groups of blocks. Which has more tens?",
        speakWrite: "Compare 48 and 39. Say: ___ is greater because ___.",
        retrieval: "Which place do we look at first when we compare two-digit numbers?",
      },
      tier: 2,
      domains: ["Speaking", "Writing"],
      klu: "Explain",
    },
    {
      id: "greater-than",
      word: "greater than",
      pos: "adjective phrase",
      pron: "GRAY-ter THAN",
      def: "Larger in amount. The symbol > opens toward the greater number.",
      visual: shapes(
        "The comparison 52 greater than 38, written as 52 > 38 with blocks: five tens and two ones next to three tens and eight ones.",
        [
          txt("52 > 38", 240, 50, 46),
          ...blocks(5, 2, 40, 85, 0.75),
          ...blocks(3, 8, 290, 85, 0.75),
        ],
      ),
      context: "52 is greater than 38 because 5 tens is more than 3 tens.",
      nonExample: "38 is not greater than 52. Three tens is fewer than five tens.",
      academicSentence: "52 is greater than 38 because it has more tens.",
      everyday: "Like saying the taller tower has more blocks.",
      es: {
        word: "mayor que",
        def: "Más grande en cantidad. El símbolo > se abre hacia el número mayor.",
        verified: true,
      },
      related: ["less than", "equal to", "compare"],
      misconception:
        "Students mix up the symbols > and <. The wide open side faces the greater number, like a hungry mouth.",
      practice: {
        visualPrompt: "Which side has more tens? Which way does the symbol open?",
        speakWrite: "Say and write: 67 is greater than 59 because ___.",
        retrieval: "Which symbol means greater than?",
      },
      tier: 2,
      domains: ["Speaking", "Writing"],
      klu: "Explain",
    },
    {
      id: "less-than",
      word: "less than",
      pos: "adjective phrase",
      pron: "LESS THAN",
      def: "Smaller in amount. The symbol < opens toward the greater number.",
      visual: shapes(
        "The comparison 38 less than 52, written as 38 < 52 with blocks: three tens and eight ones next to five tens and two ones.",
        [
          txt("38 < 52", 240, 50, 46),
          ...blocks(3, 8, 40, 85, 0.75),
          ...blocks(5, 2, 290, 85, 0.75),
        ],
      ),
      context: "38 is less than 52 because 3 tens is less than 5 tens.",
      nonExample: "52 is not less than 38. Five tens is more than three tens.",
      academicSentence: "38 is less than 52 because it has fewer tens.",
      everyday: "Like saying the shorter tower has fewer blocks.",
      es: {
        word: "menor que",
        def: "Más pequeño en cantidad. El símbolo < se abre hacia el número mayor.",
        verified: true,
      },
      related: ["greater than", "equal to", "compare"],
      misconception:
        "Students read < as greater than because the 38 comes first. The symbol always opens toward the greater number, whichever side it is on.",
      practice: {
        visualPrompt: "Which side has fewer tens? Which way does the symbol point?",
        speakWrite: "Say and write: 41 is less than 65 because ___.",
        retrieval: "Which number does the wide side of < face?",
      },
      tier: 2,
      domains: ["Speaking", "Writing"],
      klu: "Explain",
    },
    {
      id: "equal-to",
      word: "equal to",
      pos: "adjective phrase",
      pron: "EE-kwul TOO",
      def: "The same amount. The symbol = goes between two numbers that are the same.",
      visual: shapes(
        "The numbers 25 equals 25, shown with two matching groups of base-ten blocks: two tens and five ones on each side.",
        [
          txt("25 = 25", 240, 50, 46),
          ...blocks(2, 5, 70, 85, 0.75),
          ...blocks(2, 5, 300, 85, 0.75),
        ],
      ),
      context: "20 + 5 is equal to 25.",
      nonExample:
        "25 and 52 use the same digits but are not equal. The digits are in different places.",
      academicSentence: "Two numbers are equal when they have the same tens and the same ones.",
      everyday: "Like two plates that each have the same number of crackers.",
      es: {
        word: "igual a",
        def: "La misma cantidad. El símbolo = va entre dos números iguales.",
        verified: true,
      },
      related: ["greater than", "less than", "compare"],
      misconception:
        "Students think the equal sign means 'the answer comes next'. It means both sides have the same value.",
      practice: {
        visualPrompt: "Do both sides have the same tens and the same ones?",
        speakWrite: "Say: 40 + 3 is equal to ___.",
        retrieval: "What does the equal sign tell us about the two sides?",
      },
      tier: 2,
      domains: ["Speaking", "Writing"],
      klu: "Explain",
    },
  ],
  review: { status: "authored", checks: {} },
};
