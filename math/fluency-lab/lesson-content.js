import { baseGenerator } from "./problem-bank.js";
import { countOf, factorText, keptPrimes, primeList } from "./factor-tree.js";
import { t } from "./i18n.js";

const step = (prompt, answer, hint, explanation, kind = "number", choices = null) => ({ prompt, answers: [String(answer)], kind, choices, hint, explanation });
const lesson = (title, idea, model, steps) => ({ title, idea, model, steps });
const num = (value) => Number(value.toFixed(6));

// Every visual lesson uses an explicit model and checked intermediate steps.
// Variants change the quantities while keeping each model mathematically exact.
export function createLesson(skill, variant = 0) {
  const k = Math.abs(variant) % 5;
  const grade = Number.isInteger(skill.grade) ? skill.grade : 1;
  // A combined skill ("addsub", "muldiv") shows one operation per variant; a mixed generator teaches as its main part.
  const MIXED = { addsub: ["add", "sub"], muldiv: ["mul", "div"], rational: ["add", "sub", "mul", "div"] };
  const config = MIXED[skill.config.op] ? { ...skill.config, op: MIXED[skill.config.op][k % MIXED[skill.config.op].length] } : skill.config;
  const gen = baseGenerator(skill);
  if (gen === "countSet" || gen === "subitize") {
    const count = Math.min(skill.config.max || 6, (skill.config.min || 1) + k);
    const isSubitize = gen === "subitize";
    return lesson(
      isSubitize ? "Notice a small group" : "Count each object once",
      isSubitize ? "Look for a familiar group or parts that fit together. Counting is always a useful check." : "Match one number name to each object. The last number tells the total.",
      isSubitize ? { type: "dotpattern", dots: [[25, 25], [75, 25], [50, 50], [25, 75], [75, 75], [50, 25]].slice(0, count), pattern: "small group", caption: "Notice the parts." } : { type: "counters", total: skill.config.max || 10, filled: count, target: count, caption: `${count} counters` },
      [
        step(isSubitize ? "How many counters do you notice before counting?" : "How many counters are in the set?", count, "Look at the model. Count each counter once if you want to check.", `There are ${count} counters.`),
        step(`Can you see ${count} as smaller groups?`, count, "Name the parts, then put them together.", `The groups together still make ${count}.`),
        step("What does the last number you counted tell you?", count, "It names the whole set.", `The set has ${count} counters.`),
      ],
    );
  }
  if (gen === "pattern") {
    const units = [["●", "■"], ["▲", "●", "■"], ["●", "●", "▲"]];
    const unit = units[k % units.length];
    const values = [...unit, ...unit, "?"];
    const answer = unit[0];
    return lesson("Find the repeating part", "A repeating pattern has a unit that repeats in the same order.",
      { type: "sequence", values, caption: "Find the unit that repeats." },
      [step("Which shape starts the repeating unit?", answer, "Look for the group of shapes that repeats.", `The unit starts with ${answer}.`, "choice", ["●", "■", "▲"]), step("What comes after the repeating unit?", answer, "Say the unit again in the same order.", `The next shape is ${answer}.`, "choice", ["●", "■", "▲"]), step("What is the repeating unit?", unit.join(" "), "Name the shortest group that repeats.", `The unit is ${unit.join(" ")}.`, "text")],
    );
  }
  if (gen === "fact") {
    const op = config.op;
    if (op === "div") {
      const divisor = grade >= 4 ? 6 : 3 + k;
      const quotient = grade >= 4 ? 64 + k : 8;
      const a = grade >= 4 ? 60 : 5;
      const b = quotient - a;
      return lesson("Split a division into friendly parts", "Each part is divided by the same number. Add the partial quotients at the end.", {
        type: "partition", labels: [`${divisor * a} ÷ ${divisor}`, `${divisor * b} ÷ ${divisor}`], values: [divisor * a, divisor * b], caption: `${divisor * quotient} ÷ ${divisor}`,
      }, [step(`Start with ${divisor * a}. What is ${divisor * a} ÷ ${divisor}?`, a, `Think: ${divisor} × ? = ${divisor * a}.`, `This part contributes ${a} to the quotient.`), step(`Now divide the remaining ${divisor * b} by ${divisor}.`, b, `Use the related multiplication fact.`, `${divisor * b} ÷ ${divisor} = ${b}.`), step(`Combine both parts. What is ${divisor * quotient} ÷ ${divisor}?`, quotient, `Add your two partial quotients.`, `${a} + ${b} = ${quotient}. Check: ${quotient} × ${divisor} = ${divisor * quotient}.`)]);
    }
    if (op === "mul" && config.tens) {
      const a = 3 + (k % 5); const t = 2 + k;
      return lesson("Count in tens", "Each square is 10. Solve the basic fact first, then say the answer in tens.", { type: "array", a, b: t, split: a, unit: 10, caption: `${a} × ${t * 10}` }, [step(`Cover the zero: what is the basic fact ${a} × ${t}?`, a * t, "Count the squares in the rows, or use a fact you know.", `${a} × ${t} = ${a * t}.`), step(`Each square is 10, so ${a * t} squares are ${a * t} tens. How much is that?`, a * t * 10, `${a * t} tens means ${a * t} × 10.`, `${a * t} tens = ${a * t * 10}.`), step(`Check: what is ${a} × ${t * 10}?`, a * t * 10, "It matches the number of tens you found.", `${a} × ${t * 10} = ${a * t * 10}. The zero shows the answer is in tens.`)]);
    }
    if (op === "mul" && grade === 3) {
      const early = Math.max(...(config.factors || [9])) <= 5;
      const a = early ? [3, 4, 5, 4, 5][k] : 6 + (k % 4);
      const b = early ? 3 + k : 4 + (k % 4);
      const left = early ? 2 : 5;
      const known = early ? "two groups" : "a 5-fact";
      return lesson(early ? "See equal groups" : "Break a hard fact into easy facts", early ? "Rows are equal groups. Split the rows into smaller sets you know." : "Use a 5-fact you know, then add the leftover rows.", { type: "array", a, b, split: left, caption: `${a} × ${b}` }, [step(`The first color shows ${known}: ${left} × ${b}. How many squares?`, left * b, early ? "Skip-count by the row size, or double it." : "Count by 5s, or think of half of 10 × the row size.", `${left} rows of ${b} make ${left * b}.`), step(`The other color is ${a - left} more row${a - left === 1 ? "" : "s"} of ${b}. How many squares?`, (a - left) * b, "The row size stays the same.", `${a - left} × ${b} = ${(a - left) * b}.`), step(`Put both colors together. What is ${a} × ${b}?`, a * b, "Add the two parts.", `${left * b} + ${(a - left) * b} = ${a * b}.`)]);
    }
    if (op === "mul" && skill.id === "multiply-2digit") {
      const strategies = [
        {
          id: "halves", label: t("Split 48 into two equal groups"),
          equation: "48 × 25 = 24 × 25 + 24 × 25",
          parts: ["24 × 25 = 600", "24 × 25 = 600"], result: 1200, model: "halves",
          explanation: t("48 is 24 + 24, so the two equal areas combine to the same 48 × 25 rectangle."),
        },
        {
          id: "friendly", label: t("Use 50 groups, then remove 2"),
          equation: "48 × 25 = 50 × 25 − 2 × 25",
          parts: ["50 × 25 = 1,250", "2 × 25 = 50", "1,250 − 50 = 1,200"], result: 1200, model: "remove",
          explanation: t("48 is 50 − 2. Starting with 50 groups and removing 2 leaves exactly 48 groups of 25."),
        },
        {
          id: "quarter", label: t("Use 25 as one quarter of 100"),
          equation: "48 × 25 = 48 × 100 ÷ 4",
          parts: ["48 × 100 = 4,800", "4,800 ÷ 4 = 1,200"], result: 1200, model: "quarter",
          explanation: t("25 is one of four equal parts of 100, so one quarter of 48 × 100 is 48 × 25."),
        },
      ];
      return lesson(
        t("Compare strategies for 48 × 25"),
        t("Choose a decomposition, inspect how it changes the area, and connect each partial product to the same total."),
        { type: "strategyCompare", a: 48, b: 25, strategies, caption: t("Three equivalent ways to organize 48 groups of 25") },
        [
          step(t("If 25 is one quarter of 100, what is 24 × 25?"), 600, t("Find one quarter of 24 × 100."), t("24 × 100 = 2,400, and 2,400 ÷ 4 = 600.")),
          step(t("The other half is also 24 × 25. What is its value?"), 600, t("The two groups are equal in size."), t("The second 24 groups also make 600.")),
          step(t("Combine the two equal parts. What is 48 × 25?"), 1200, t("Add the two partial products."), t("600 + 600 = 1,200. Each strategy keeps the total area equal to 48 × 25.")),
        ],
      );
    }
    if (op === "mul") {
      const b = config.minB >= 10 ? 12 + k : grade >= 4 ? 6 + k : 4 + k;
      const a = grade >= 5 ? 124 : grade === 4 ? (config.minA >= 100 ? 124 : 24) : (config.factors?.[2] ?? 7);
      const left = a >= 100 ? 100 : a >= 20 ? 20 : a >= 10 ? 10 : Math.min(5, a);
      const right = a - left;
      return lesson("Build a product in two parts", "Split one factor. Keep the other factor the same for both parts.", { type: "array", a, b, split: left, caption: `${a} × ${b}` }, [step(`Find the first partial product: ${left} × ${b}.`, left * b, "Use the easier fact first.", `${left} groups of ${b} make ${left * b}.`), step(`Find the second partial product: ${right} × ${b}.`, right * b, "The group size stays the same.", `${right} × ${b} = ${right * b}.`), step(`Combine the two products to find ${a} × ${b}.`, a * b, "Add the partial products.", `${left * b} + ${right * b} = ${a * b}.`)]);
    }
    if (op === "sub") {
      const large = grade >= 2 && config.max > 10;
      const a = config.min >= 1000 ? 5263 + k : large ? 63 + k : config.maxResult === 20 ? 14 + k : 9;
      const b = config.min >= 1000 ? 1287 : large ? 28 : config.maxResult === 20 ? 6 + k : 4 + k % 3;
      const part = config.min >= 1000 ? 1000 : large ? 20 : config.maxResult === 20 ? a - 10 : 1;
      return lesson("Subtract by place value", "Line up the places and take away one part at a time, then use addition to check.", { type: "vertical", op: "-", terms: [String(a), String(b)], caption: `${a} − ${b}` }, [step(`First take away ${part} from ${a}. What is left?`, a - part, "Subtract the larger place first.", `${a} − ${part} = ${a - part}.`), step(`Take away the remaining ${b - part}. What is left?`, a - b, "Continue from what was left.", `${a - part} − ${b - part} = ${a - b}.`), step(`Check: ${a - b} + ${b} = ?`, a, "Add back what you took away.", `You return to ${a}, so the difference is ${a - b}.`)]);
    }
    if (grade <= 2 && config.max <= 10) {
      const a = 6 + k % 3; const b = config.maxResult === 10 ? 10 - a : 6;
      const toTen = Math.min(b, 10 - a);
      return lesson("Make a ten you can see", "Tap empty spaces to add counters. A full ten-frame is an anchor you can use.", { type: "counters", total: 20, filled: a, target: a + b, caption: `${a} + ${b}` }, [step(`How many spaces complete the first ten-frame of ${a}?`, 10 - a, "Count the empty spaces in the first frame.", `${a} + ${10 - a} = 10.`), step(`Use ${toTen} of the ${b} new counters. How many are left?`, b - toTen, "Subtract the counters you already used.", `${b} − ${toTen} = ${b - toTen}.`), step(`What is ${a} + ${b}?`, a + b, "Combine the filled frame and any leftover counters.", `${a} + ${b} = ${a + b}.`)]);
    }
    const a = config.min >= 1000 ? 2476 + k : config.min >= 100 ? 247 + k : 38 + k;
    const b = config.min >= 1000 ? 1358 : config.min >= 100 ? 135 : 27;
    const place = config.min >= 1000 ? 1000 : config.min >= 100 ? 100 : 10;
    const placeName = place === 1000 ? "thousands" : place === 100 ? "hundreds" : "tens";
    const part = Math.floor(b / place) * place;
    return lesson("Add by place value", `Break an addend into ${placeName} and the remaining amount. Then line up the places to check.`, { type: "vertical", op: "+", terms: [String(a), String(b)], caption: `${a} + ${b}` }, [step(`How much is the ${placeName} part of ${b}?`, part, `Keep the ${placeName} and replace the smaller places with zero.`, `${b} = ${part} + ${b - part}.`), step(`Add ${part} to ${a}.`, a + part, `Add the ${placeName} first.`, `${a} + ${part} = ${a + part}.`), step(`Add the remaining ${b - part}. What is the total?`, a + b, "Continue from the last total.", `${a + part} + ${b - part} = ${a + b}.`)]);
  }
  if (["makeTarget", "missingAddend"].includes(gen)) {
    const total = gen === "makeTarget" ? config.target : 12 + k;
    const known = 7;
    return lesson("Build the missing part", "A whole is made of two parts. Tap empty spaces until the frame shows the whole.", { type: "counters", total, filled: known, target: total, caption: `${known} + □ = ${total}` }, [step("How many original dark counters did we start with?", known, "Count only the fixed, dark counters.", `The known part is ${known}.`), step(`How many counters must be added to the original ${known} to make ${total}?`, total - known, "Count your added counters, or count on from the original amount.", `${known} needs ${total - known} more.`), step(`Check the whole: ${known} + ${total - known} = ?`, total, "Combine both parts.", `Both parts make ${total}.`)]);
  }
  if (gen === "sequence") {
    const jump = config.steps[k % config.steps.length]; const start = 10 + k;
    return lesson("Follow the pattern", "A counting pattern repeats the same change each time.", { type: "table", headers: ["Term", "1", "2", "3", "4"], rows: [["Value", String(start), String(start + jump), "?", "?"]], caption: "Equal changes" }, [step(`From ${start} to ${start + jump}, how large is the jump?`, jump, "Find the difference.", `Each jump is +${jump}.`), step(`What comes after ${start + jump}?`, start + jump * 2, "Use the same jump again.", `${start + jump} + ${jump} = ${start + jump * 2}.`), step(`Continue: what comes after ${start + jump * 2}?`, start + jump * 3, "Continue from the latest number.", `The pattern reaches ${start + jump * 3}.`)]);
  }
  if (["placeValue", "decimalPlace", "compare"].includes(gen)) {
    if (gen === "compare") {
      const a = grade === 1 ? 47 + k : 582 + k; const b = grade === 1 ? 39 : 579;
      const place = 10; const left = Math.floor(a / place) % 10; const right = Math.floor(b / place) % 10;
      return lesson("Compare matching places", "Compare from the left. The first unequal place decides.", { type: "place", numbers: [String(a), String(b)], caption: "Keep the same places in the same columns" }, [step(`What is the tens digit of ${a}?`, left, "The tens place is second from the right.", `${a} has ${left} tens in its tens place.`), step(`What is the tens digit of ${b}?`, right, "Find the matching place.", `${b} has ${right} tens in its tens place.`), step(`Choose the symbol: ${a} ___ ${b}`, ">", "The earlier places tie, so compare tens.", `${a} > ${b}.`, "choice", ["<", "=", ">"]) ]);
    }
    const decimal = gen === "decimalPlace";
    const n = decimal ? `4.${6 + k % 3}25` : grade === 1 ? String(63 + k) : grade === 2 ? String(472 + k) : String(347205 + k);
    const digit = decimal ? Number(n[2]) : Number(n[0]);
    const place = decimal ? 0.1 : 10 ** (n.length - 1);
    return lesson("Give every digit a place", "A digit tells how many units of its place value you have.", { type: "place", numbers: [n], caption: decimal ? "Ones · tenths · hundredths · thousandths" : "Each place to the left is ten times as large" }, [step(`What digit is in the ${decimal ? "tenths" : "leftmost"} place of ${n}?`, digit, "Read the requested column.", `The digit is ${digit}.`), step(`What is the value of that digit?`, num(digit * place), `Multiply ${digit} by ${place}.`, `${digit} × ${place} = ${num(digit * place)}.`), step(`How many ${decimal ? "tenths" : "units of the next smaller place"} equal one ${decimal ? "whole" : "unit of that place"}?`, 10, "Neighboring places have a factor of ten.", "Ten smaller units make one unit of the next larger place.")]);
  }
  if (gen === "round") {
    const n = grade >= 4 ? 3482 + k : 67 + k; const unit = grade >= 4 ? 100 : 10;
    const low = Math.floor(n / unit) * unit; const high = low + unit;
    return lesson("Choose the nearer benchmark", "Find the two multiples on either side, then compare distances. A halfway value rounds up.", { type: "numberline", start: low, jumps: [n - low, high - n], caption: `Round ${n} to the nearest ${unit}` }, [step(`What is the lower multiple of ${unit}?`, low, "Look just below the number.", `The lower benchmark is ${low}.`), step(`What is the upper multiple of ${unit}?`, high, "Move one full benchmark step higher.", `The upper benchmark is ${high}.`), step(`Round ${n} to the nearest ${unit}.`, Math.round(n / unit) * unit, "Which benchmark is closer?", `${n} rounds to ${Math.round(n / unit) * unit}.`)]);
  }
  if (gen === "evenOdd") {
    const n = 13 + k;
    return lesson("Make pairs", "Even numbers fill complete pairs. Odd numbers leave one counter without a partner.", { type: "pairs", total: n, caption: `${n} counters` }, [step(`How many complete pairs can you make from ${n}?`, Math.floor(n / 2), "Put two counters in each pair.", `There are ${Math.floor(n / 2)} complete pairs.`), step("How many counters are left without a partner?", n % 2, "Check for a single counter.", `${n % 2} counter is left over.`), step(`Is ${n} even or odd?`, n % 2 ? "odd" : "even", "Even means no leftover counter.", `${n} is ${n % 2 ? "odd" : "even"}.`, "choice", ["even", "odd"])]);
  }
  if (gen === "timeAdd") {
    if (grade === 3) {
      const startHour = 2 + k;
      const startMinute = [35, 40, 45, 50, 55][k];
      const jump = [25, 30, 35, 40, 45][k];
      const end = startHour * 60 + startMinute + jump;
      const endText = `${Math.floor(end / 60)}:${String(end % 60).padStart(2, "0")}`;
      return lesson("Count forward to find elapsed time", "Break the interval at a friendly benchmark, then combine the jumps.", { type: "clock", hour: startHour, minute: startMinute, caption: `Start at ${startHour}:${String(startMinute).padStart(2, "0")}` }, [step(`From ${startHour}:${String(startMinute).padStart(2, "0")}, how many minutes to the next hour?`, 60 - startMinute, "Count up to :00.", `The next hour is ${60 - startMinute} minutes away.`), step(`How many minutes remain in the ${jump}-minute interval?`, jump - (60 - startMinute), "Subtract the first jump from the total interval.", `${jump} − ${60 - startMinute} = ${jump - (60 - startMinute)} minutes.`), step(`What is the full elapsed time from the start to ${endText}?`, jump, "Add the two jumps.", `The interval is ${60 - startMinute} + ${jump - (60 - startMinute)} = ${jump} minutes.`)]);
    }
    const hour = 2 + k;
    return lesson("Travel around a clock", "Sixty minutes make one hour. Two half-hour jumps make a full hour.", { type: "clock", hour, minute: 30, caption: `${hour}:30 + 60 minutes` }, [step(`How many minutes take you from ${hour}:30 to ${hour + 1}:00?`, 30, "Half an hour remains.", "30 minutes take you to the next hour."), step("You need 60 minutes altogether. How many minutes are left?", 30, "Subtract the 30 minutes already used.", "60 − 30 = 30."), step(`What time is 60 minutes after ${hour}:30?`, `${hour + 1}:30`, "Add the remaining half hour.", `The later time is ${hour + 1}:30.`, "text")]);
  }
  if (gen === "money") {
    const q = 2 + k % 2; const d = 1 + k;
    return lesson("Count value, coin by coin", "Group equal coins and multiply by their value in cents.", { type: "coins", counts: [q, d, 1, 2], caption: "Quarter 25¢ · dime 10¢ · nickel 5¢ · penny 1¢" }, [step(`${q} quarters are how many cents?`, q * 25, "Each quarter is 25 cents.", `${q} × 25 = ${q * 25} cents.`), step(`Add ${d} dimes. How many cents so far?`, q * 25 + d * 10, "Each dime adds 10 cents.", `The running total is ${q * 25 + d * 10} cents.`), step("Add one nickel and two pennies. What is the total in cents?", q * 25 + d * 10 + 7, "A nickel is 5 cents; two pennies add 2.", `The total is ${q * 25 + d * 10 + 7} cents.`)]);
  }
  if (gen === "lengthMeasure") {
    const start = 2 + k % 3; const end = start + 4 + k % 2;
    return lesson("Measure the spaces between marks", "A ruler measures equal intervals. Start at zero when you can; when an object starts later, subtract the starting mark from the ending mark.", { type: "unitMeasure", start, end, unit: "cm", caption: "Count each 1-centimeter interval" }, [step(`How many equal spaces are between ${start} and ${end}?`, end - start, "Count the spaces, not the marks.", `There are ${end - start} equal spaces.`), step(`What is ${end} − ${start}?`, end - start, "Use ending mark minus starting mark.", `${end} − ${start} = ${end - start}.`), step(`How long is the strip?`, end - start, "The answer is the number of 1-centimeter spaces.", `The strip is ${end - start} centimeters long.`)]);
  }
  if (gen === "dataDisplay") {
    const rows = [["apples", "6"], ["bananas", "10"], ["oranges", "8"], ["pears", "12"]];
    return lesson("Compare the values in a data display", "Read each category and its count. Then compare the numbers to find the greatest or least value.", { type: "dataTable", headers: ["Fruit", "Votes"], rows, caption: "Class vote" }, [step("Which fruit has 10 votes?", "bananas", "Match the row with a count of 10.", "The bananas row shows 10 votes.", "text"), step("Which fruit has fewer votes: apples or oranges?", "apples", "Compare 6 and 8.", "6 is less than 8, so apples have fewer votes.", "text"), step("Which fruit received the most votes?", "pears", "Find the greatest count in the table.", "12 is greatest, so pears received the most votes.", "text")]);
  }
  if (gen === "scaleDrawing") {
    const scale = 2 + k; const drawing = 3 + k;
    return lesson("Scale every corresponding length", "A scale drawing keeps the same multiplicative relationship between the drawing and the real object.", { type: "table", headers: ["Drawing (cm)", "Real length (m)"], rows: [["1", String(scale)], [String(drawing), "?"]], caption: `1 cm represents ${scale} m` }, [step(`What real length does 1 cm represent?`, scale, "Read the scale statement.", `1 cm represents ${scale} meters.`), step(`How many equal groups of ${scale} meters match ${drawing} drawing centimeters?`, drawing, "Multiply the real length for one centimeter by the number of drawing centimeters.", `There are ${drawing} groups of ${scale} meters.`), step(`What is the real length?`, drawing * scale, "Multiply drawing length by the scale amount.", `${drawing} × ${scale} = ${drawing * scale} meters.`)]);
  }
  if (gen === "conversion") {
    const [from, to, factor] = config.conversions?.[k % (config.conversions?.length || 1)] || ["meters", "centimeters", 100];
    const amount = 3 + k;
    return lesson("Rename a measurement in a smaller unit", `One ${from.replace(/s$/, "")} equals ${factor} ${to}. Each ${from.replace(/s$/, "")} contains that many of the smaller units.`, { type: "table", headers: [from, to], rows: [["1", String(factor)], [String(amount), "?"]], caption: "Equivalent measurements" }, [step(`How many ${to} are in 1 ${from.replace(/s$/, "")}?`, factor, "Read the unit relationship.", `1 ${from.replace(/s$/, "")} = ${factor} ${to}.`), step(`How many groups of ${factor} match ${amount} ${from}?`, amount, "Use one group for each starting unit.", `${amount} ${from} is ${amount} groups of ${factor} ${to}.`), step(`How many ${to} are equivalent to ${amount} ${from}?`, amount * factor, "Multiply the amount by the conversion factor.", `${amount} × ${factor} = ${amount * factor} ${to}.`)]);
  }
  if (["fractionEquivalent", "fractionCompare", "fractionOp", "fractionOf", "probability"].includes(gen)) {
    if (gen === "fractionOp" && config.unitFractionDivision) {
      const denominator = 3 + k;
      const divisor = 2 + k;
      return lesson("Divide a unit fraction by a whole number", "Sharing one unit fraction into equal groups creates smaller equal parts.", { type: "unitFractionDivision", denominator, divisor, caption: "One unit fraction is split into equal shares" }, [step(`How many equal shares are made when one ${denominator}th is shared among ${divisor} groups?`, divisor, "The whole divisor tells how many equal shares to make.", `There are ${divisor} equal shares.`), step(`How many smaller equal parts make up the original ${denominator}th?`, divisor, "Split the one selected part into equal pieces.", `The selected ${denominator}th is split into ${divisor} smaller equal parts.`), step(`What fraction of the whole is one share?`, `1/${denominator * divisor}`, "One share is one of the newly sized parts of the whole.", `One share is 1/${denominator * divisor} of the whole.`, "fraction")]);
    }
    if (gen === "fractionEquivalent") return lesson("Split the same whole into smaller parts", "Changing the number of equal pieces does not change the shaded amount. Use the partition buttons below.", { type: "fractions", fractions: [[1, 2], [2, 4]], caption: "Equal-sized wholes · 1/2 and 2/4", interactive: true }, [step("Each half is split into 2 pieces. How many pieces fill the whole?", 4, "There are two halves, each split in two.", "2 × 2 = 4 pieces."), step("How many of those fourths match one shaded half?", 2, "Split the shaded half in two as well.", "1 × 2 = 2 shaded fourths."), step("Split each half into 3 pieces instead. What numerator makes 1/2 = □/6?", 3, "Multiply the numerator and denominator by 3.", "1/2 = 3/6.")]);
    if (gen === "fractionCompare") return lesson("Compare equal-sized wholes", "The bar lengths show the fractions on the same whole.", { type: "fractions", fractions: [[2, 3], [3, 4]], caption: "Which shaded amount reaches farther?" }, [step("Rename 2/3 in twelfths. What is the numerator?", 8, "Multiply top and bottom by 4.", "2/3 = 8/12."), step("Rename 3/4 in twelfths. What is the numerator?", 9, "Multiply top and bottom by 3.", "3/4 = 9/12."), step("Compare: 2/3 ___ 3/4", "<", "Compare 8 twelfths with 9 twelfths.", "2/3 < 3/4.", "choice", ["<", "=", ">"]) ]);
    if (gen === "fractionOf" || gen === "probability") {
      const denominator = 4 + k; const numerator = 3; const whole = denominator * 5;
      if (gen === "probability") return lesson("Count possible outcomes", "Every section is equally likely. Compare winning sections with all sections.", { type: "fractions", fractions: [[numerator, denominator]], caption: `${numerator} winning sections out of ${denominator}` }, [step("How many winning sections are there?", numerator, "Count shaded sections.", `There are ${numerator} winning sections.`), step("How many sections are possible altogether?", denominator, "Include winning and non-winning sections.", `There are ${denominator} total sections.`), step("Write the probability of winning as a fraction.", `${numerator}/${denominator}`, "Favorable outcomes go over total outcomes.", `P(win) = ${numerator}/${denominator}.`, "fraction")]);
      return lesson("Find one part, then several", "Divide the whole into equal groups before taking the required groups.", { type: "fractions", fractions: [[numerator, denominator]], caption: `${numerator}/${denominator} of ${whole}` }, [step(`Split ${whole} into ${denominator} equal parts. How much is in one part?`, 5, "Divide by the denominator.", `${whole} ÷ ${denominator} = 5.`), step(`Take ${numerator} of those parts. What amount is that?`, 15, "Multiply the amount in one part by the numerator.", "5 × 3 = 15."), step("How much of the whole remains?", whole - 15, "Subtract your selected amount from the whole.", `${whole} − 15 = ${whole - 15}.`)]);
    }
    const op = config.op;
    if (op === "mul") return lesson("Take a part of a part", "Shade 2 of 3 columns, then take 3 of 4 rows of the shaded part. The overlap is the product.", { type: "fractionGrid", cols: 3, rows: 4, selectedCols: 2, selectedRows: 3, caption: "2/3 × 3/4" }, [step("How many equal cells make the whole grid?", 12, "Multiply rows by columns.", "3 × 4 = 12 cells."), step("How many cells are in the overlap?", 6, "Count the cells in both selected rows and columns.", "2 × 3 = 6 overlapping cells."), step("What fraction of the whole is the overlap?", "1/2", "Use overlap cells over total cells; simplify if you can.", "6/12 = 1/2.", "fraction")]);
    if (op === "div") return lesson("Count how many fractional groups fit", "Division can ask how many groups of the divisor fit in the first amount.", { type: "fractions", fractions: [[3, 4], [1, 8]], caption: "3/4 ÷ 1/8" }, [step("Rename 3/4 in eighths. What is the numerator?", 6, "Split every fourth in two.", "3/4 = 6/8."), step("How many groups of 1/8 fit inside 6/8?", 6, "Count the eighth-sized groups.", "Six groups fit."), step("Check: 6 × 1/8 = what fraction?", "3/4", "Multiply 6 by 1/8.", "6/8 = 3/4, so the quotient is 6.", "fraction")]);
    const subtract = op === "sub";
    return lesson(subtract ? "Subtract equal-sized pieces" : "Combine equal-sized pieces", "Rename both fractions so each piece has the same size.", { type: "fractions", fractions: subtract ? [[3, 4], [1, 3]] : [[1, 3], [1, 4]], caption: subtract ? "3/4 − 1/3" : "1/3 + 1/4" }, [step(subtract ? "Rename 3/4 in twelfths. What is the numerator?" : "Rename 1/3 in twelfths. What is the numerator?", subtract ? 9 : 4, "Multiply both parts of the fraction by the same factor.", subtract ? "3/4 = 9/12." : "1/3 = 4/12."), step(subtract ? "Rename 1/3 in twelfths. What is the numerator?" : "Rename 1/4 in twelfths. What is the numerator?", subtract ? 4 : 3, "Use a denominator of 12.", subtract ? "1/3 = 4/12." : "1/4 = 3/12."), step(subtract ? "Find 3/4 − 1/3." : "Find 1/3 + 1/4.", subtract ? "5/12" : "7/12", "Combine the numerators; keep the size of the pieces.", subtract ? "9/12 − 4/12 = 5/12." : "4/12 + 3/12 = 7/12.", "fraction")]);
  }
  if (gen === "decimalOp") {
    if (config.op === "div") {
      const divisor = 3; const eachTenths = 12 + k; const totalTenths = divisor * eachTenths; const total = totalTenths / 10;
      return lesson("Divide tenths into equal groups", "Think in tenths: the decimal point only says what size each piece is. Share the tenths equally, then write the answer as a decimal.", { type: "place", numbers: [total.toFixed(1), String(divisor)], caption: `${total} ÷ ${divisor}` }, [step(`How many tenths are in ${total}?`, totalTenths, "Multiply the number by 10.", `${total} is ${totalTenths} tenths.`), step(`Share ${totalTenths} tenths into ${divisor} equal groups. How many tenths in each group?`, eachTenths, "Divide the count of tenths by the divisor.", `${totalTenths} ÷ ${divisor} = ${eachTenths} tenths.`), step("Write the answer as a decimal.", num(eachTenths / 10), "Tenths are one place right of the decimal point.", `${eachTenths} tenths is ${num(eachTenths / 10)}.`)]);
    }
    const a = num(2.4 + k / 10); const mul = config.op === "mul";
    const b = mul ? 0.5 : 1.35; const subtract = config.op === "sub";
    const total = num(mul ? a * b : subtract ? a - b : a + b);
    return lesson(mul ? "Use a benchmark: one half" : "Line up equal places", mul ? "Multiplying by 0.5 finds half. Use that meaning to check the decimal position." : "Align the decimal points so ones, tenths, and hundredths match.", { type: "place", numbers: [a.toFixed(2), b.toFixed(2)], caption: `${a} ${mul ? "×" : subtract ? "−" : "+"} ${b}` }, [step(mul ? "What denominator makes 0.5 = 1/□?" : `Write ${a} in hundredths. How many hundredths?`, mul ? 2 : Math.round(a * 100), mul ? "0.5 is one half." : "Multiply the number by 100.", mul ? "0.5 = 1/2." : `${a} is ${Math.round(a * 100)} hundredths.`), step(mul ? `How much is half of ${Math.round(a * 10)} tenths, in tenths?` : `${subtract ? "Subtract" : "Add"} 135 hundredths. How many hundredths result?`, mul ? a * 5 : Math.round(total * 100), mul ? "Divide the number of tenths by 2." : "Work with the whole-number counts of hundredths.", mul ? `Half of ${Math.round(a * 10)} tenths is ${a * 5} tenths.` : `You have ${Math.round(total * 100)} hundredths.`), step("Write the final value as a decimal.", total, "Convert back to the correct place value.", `The result is ${total}.`)]);
  }
  if (gen === "factorMultiple") {
    const rows = 3; const columns = 4 + k; const total = rows * columns;
    return lesson("Find factor pairs", "A factor pair multiplies to make the number. Multiples come from counting by a number.", { type: "array", a: rows, b: columns, split: rows, caption: `${rows} rows of ${columns}` }, [step("How many counters are in the array?", total, "Multiply rows by counters in a row.", `${rows} × ${columns} = ${total}.`), step(`${rows} × □ = ${total}. What is the other factor?`, columns, "Count the counters in one row.", `${rows} × ${columns} = ${total}, so ${columns} is the other factor.`), step(`Is ${rows} a factor of ${total}?`, "yes", `Does ${rows} divide ${total} evenly?`, `${total} ÷ ${rows} = ${columns} with nothing left over.`, "choice", ["yes", "no"])]);
  }
  if (gen === "gcfLcm" && config.find === "lcm") {
    const [a, b] = [[12, 18], [8, 12], [18, 24], [20, 30], [10, 12]][k];
    const [pa, pb] = [primeList(a), primeList(b)];
    const kept = keptPrimes(a, b);
    const lcm = kept.reduce((product, p) => product * p, 1);
    const primes = [...new Set([...pa, ...pb])].sort((x, y) => x - y);
    const most = (p) => Math.max(countOf(pa, p), countOf(pb, p));
    return lesson(
      "Find the LCM with prime factor trees",
      "Break each number into primes with a factor tree. The LCM keeps the larger number of copies of every prime, so both numbers divide it.",
      { type: "primeTrees", a, b, find: "lcm", caption: `Factor trees for ${a} and ${b}. Filled circles are prime.` },
      [
        step(`Which primes multiply to make ${a}? Type them with × between, like 2 × 3.`, factorText(pa), "Split the number into two factors, then keep splitting until every circle is prime.", `${a} = ${factorText(pa)}.`, "primes"),
        step(`Which primes multiply to make ${b}?`, factorText(pb), "Use a factor tree again and stop at prime circles.", `${b} = ${factorText(pb)}.`, "primes"),
        step(`Keep the larger count of each prime from the two trees, then multiply. What is the LCM of ${a} and ${b}?`, lcm, `For each prime, compare its copies in ${a} and ${b} (see the table) and keep the larger count. Then multiply the kept primes.`, `${primes.map((p) => `${p}: ${countOf(pa, p)} in ${a}, ${countOf(pb, p)} in ${b}, keep ${most(p)}`).join("; ")}. ${factorText(kept)} = ${lcm}, so the LCM is ${lcm}.`),
      ],
    );
  }
  if (gen === "gcfLcm") {
    const a = 12; const b = 18; const lcm = config.find === "lcm";
    return lesson(lcm ? "Find where multiples meet" : "Find shared factors", lcm ? "Build the two lists until the first positive match." : "A common factor must divide both numbers with no remainder.", { type: "table", headers: [lcm ? "Multiples of 12" : "Factors of 12", lcm ? "Multiples of 18" : "Factors of 18"], rows: lcm ? [[12, 18], [24, 36], [36, 54]] : [[1, 1], [2, 2], [3, 3], [4, 6], [6, 9], [12, 18]], caption: "Look for values that occur in both columns" }, [step(lcm ? "What is 12 × 3?" : "What is 12 ÷ 6?", lcm ? 36 : 2, "Use your multiplication facts.", lcm ? "12 × 3 = 36." : "12 ÷ 6 = 2."), step(lcm ? "What is 18 × 2?" : "What is 18 ÷ 6?", lcm ? 36 : 3, "Check the other number.", lcm ? "18 × 2 = 36." : "18 ÷ 6 = 3."), step(lcm ? "What is the LCM of 12 and 18?" : "What is the GCF of 12 and 18?", lcm ? 36 : 6, lcm ? "Choose the smallest positive shared multiple." : "Choose the greatest factor in both columns.", lcm ? "The first positive match is 36." : "The greatest shared factor is 6.")]);
  }
  if (["ratio", "proportion", "unitRate", "percent", "percentChange"].includes(gen)) {
    if (gen === "unitRate") {
      const rate = config.decimals ? 2.5 : 4 + k; const count = 3;
      return lesson("Scale to one unit", "Divide both quantities by the same number to get an amount per one.", { type: "table", headers: ["Items", "Total cost"], rows: [[count, rate * count], [1, "?"]], caption: "Both quantities ÷ 3" }, [step("How many items are in the original group?", count, "Read the items column.", "There are 3 items."), step(`Divide the total ${rate * count} by ${count}. What is the cost per item?`, rate, "Divide cost by item count.", `The unit rate is ${rate} per item.`), step("At the same rate, what is the total cost for 6 items?", rate * 6, "Multiply the unit rate by 6.", `${rate} × 6 = ${rate * 6}.`)]);
    }
    if (gen === "percent" || gen === "percentChange") {
      const total = 80 + k * 20; const part = total / 4;
      return lesson("Use a percent benchmark", "25% is 25 out of 100, or one fourth of the whole.", { type: "fractions", fractions: [[1, 4]], caption: `25% of ${total}` }, [step("What denominator makes 25% = 1/□?", 4, "Divide 25/100 by 25/25.", "25/100 = 1/4."), step(`What is 25% of ${total}?`, part, "Divide the whole into four equal parts.", `${total} ÷ 4 = ${part}.`), step(gen === "percentChange" ? `Reduce ${total} by 25%. What is the new amount?` : `What is 75% of ${total}?`, total - part, "Subtract the quarter from the whole.", `${total} − ${part} = ${total - part}.`)]);
    }
    const factor = 3 + k;
    return lesson("Keep a ratio in proportion", "Every quantity must use the same scale factor.", { type: "table", headers: ["First quantity", "Second quantity"], rows: [[3, 5], [3 * factor, "?"]], caption: `3:5 scaled to ${3 * factor}:?` }, [step(`What factor changes 3 into ${3 * factor}?`, factor, "Divide the new quantity by the original.", `${3 * factor} ÷ 3 = ${factor}.`), step(`Multiply 5 by the same factor. What is the missing quantity?`, 5 * factor, "Keep the comparison the same.", `5 × ${factor} = ${5 * factor}.`), step(`To scale ${3 * factor}:${5 * factor} back to 3:5, divide both quantities by what?`, factor, "Undo the multiplication on both quantities.", `Both quantities divide by ${factor}.`)]);
  }
  if (["integerOp", "absolute", "inequality"].includes(gen)) {
    const a = -8 - k; const b = 13 + k;
    if (gen === "absolute") return lesson("Measure distance from zero", "Distance counts units; it has no negative direction.", { type: "numberline", start: a, jumps: [-a], caption: `|${a}|` }, [step(`How many units from ${a} to zero?`, -a, "Count the distance along the line.", `The distance is ${-a}.`), step(`What is |${a}|?`, -a, "Use the distance you just found.", `|${a}| = ${-a}.`), step(`What is |${-a}|?`, -a, "The opposite point is just as far from zero.", `Both points are ${-a} units from zero.`)]);
    if (gen === "inequality") return lesson("Test a point on the number line", "Replace the variable and decide whether the comparison is true.", { type: "numberline", start: 2, jumps: [3, 3], caption: "Test x > 5" }, [step("Is 8 a solution to x > 5?", "yes", "Is 8 greater than 5?", "8 > 5 is true.", "choice", ["yes", "no"]), step("Is 5 a solution to x > 5?", "no", "The symbol means strictly greater than.", "5 is equal to 5, not greater.", "choice", ["yes", "no"]), step("Is 5 a solution to x ≥ 5?", "yes", "This symbol includes equality.", "5 ≥ 5 is true.", "choice", ["yes", "no"])]);
    if (config.op === "mul") return lesson("Combine size and sign", "Repeated negative changes travel left. First find the size, then decide the sign.", { type: "numberline", start: 0, jumps: [-3, -3, -3, -3], caption: "4 × (−3)" }, [step("What is the magnitude of 4 × 3?", 12, "Multiply without signs first.", "4 × 3 = 12."), step("A positive times a negative has which sign?", "negative", "The four jumps all move left.", "Different signs give a negative product.", "choice", ["positive", "negative"]), step("What is 4 × (−3)?", -12, "Use the size and sign together.", "Four jumps of −3 reach −12.")]);
    return lesson("Cross zero with signed jumps", "Start at the first integer, then move in the direction of the second.", { type: "numberline", start: a, jumps: [-a, 5], caption: `${a} + ${b}` }, [step(`How many steps right take you from ${a} to zero?`, -a, "Use the distance to zero.", `${-a} positive steps cancel ${a}.`), step(`Of the ${b} positive steps, how many remain?`, 5, "Subtract the steps used to reach zero.", `${b} − ${-a} = 5.`), step(`What is ${a} + ${b}?`, 5, "Continue 5 steps to the right of zero.", "The final position is +5.")]);
  }
  if (["solve", "evaluate", "functionRule", "system"].includes(gen)) {
    if (gen === "system") return lesson("Combine balanced equations", "Add matching sides. Opposite y terms cancel.", { type: "equations", lines: ["x + y = 10", "x − y = 2", "2x = ?"], caption: "Add both equations" }, [step("Add the right sides: 10 + 2 = ?", 12, "Combine the totals.", "The right side becomes 12."), step("Now 2x = 12. What is x?", 6, "Divide both sides by 2.", "x = 6."), step("Use x + y = 10. If x = 6, what is y?", 4, "Subtract 6 from 10.", "(6, 4) satisfies both equations.")]);
    const coefficient = config.oneStep ? 1 : 3;
    const x = 4 + k; const constant = 5; const total = coefficient * x + constant;
    if (gen === "solve") return lesson("Keep the equation balanced", "Each inverse operation acts on both sides. Your steps will turn the balance into x = a number.", { type: "equations", lines: [`${coefficient === 1 ? "x" : `${coefficient}x`} + ${constant} = ${total}`, `Subtract ${constant} on both sides`, `Divide both sides by ${coefficient}`], caption: "Both sides stay equal" }, [step(`Undo +${constant}. What is ${total} − ${constant}?`, coefficient * x, "Subtract the same constant from both sides.", `You have ${coefficient}x = ${coefficient * x}.`), step(`Divide by ${coefficient}. What is x?`, x, "Undo the multiplication.", `x = ${x}.`), step(`Check in the original equation: ${coefficient} × ${x} + ${constant} = ?`, total, "Substitute and follow the original operations.", `Both sides equal ${total}.`)]);
    return lesson("Follow the function machine", "An input travels through the operations in order. Multiplication happens before addition.", { type: "machine", input: x, multiplier: coefficient, constant, caption: `${coefficient}x + ${constant}` }, [step(`If x = ${x}, what number replaces x?`, x, "Use the given input.", `Replace x with ${x}.`), step(`Multiply the input by ${coefficient}.`, coefficient * x, "Do multiplication first.", `${coefficient} × ${x} = ${coefficient * x}.`), step(`Add ${constant}. What is the output?`, total, "Finish the second operation.", `The output is ${total}.`)]);
  }
  if (["exponent", "powerTen", "squareRoot"].includes(gen)) {
    if (gen === "powerTen") return lesson("Scale by powers of ten", "A positive exponent scales up. A negative exponent divides by a power of ten.", { type: "place", numbers: ["4.2", "42", "420"], caption: "4.2 × 10²: two factors of ten" }, [step("What is 10²?", 100, "Use two factors of 10.", "10 × 10 = 100."), step("What is 4.2 × 10²?", 420, "Multiply 4.2 by 100.", "4.2 × 100 = 420."), step("What is 4.2 × 10⁻²?", 0.042, "A negative exponent divides by 100.", "4.2 ÷ 100 = 0.042.")]);
    const n = 3 + k;
    if (gen === "squareRoot") return lesson("Find the side of a square", "The square root of an area gives the nonnegative side length.", { type: "array", a: n, b: n, split: n, caption: `${n * n} unit squares` }, [step("How many equal rows does this square have?", n, "Count the rows along one side.", `There are ${n} rows.`), step(`Check the area: ${n} × ${n} = ?`, n * n, "Multiply equal side lengths.", `The area is ${n * n}.`), step(`What is √${n * n}?`, n, "Find the nonnegative number used as both factors.", `√${n * n} = ${n}.`)]);
    return lesson("An exponent counts factors", "Multiply by the base repeatedly. The exponent does not multiply the base directly.", { type: "machine", input: n, multiplier: n, constant: 0, factorCount: 3, caption: `${n}³ = ${n} × ${n} × ${n}` }, [step(`Start with two factors: ${n} × ${n} = ?`, n * n, "Find the square first.", `${n}² = ${n * n}.`), step(`Multiply by ${n} once more. What is ${n}³?`, n ** 3, "Use the previous product as one factor.", `${n * n} × ${n} = ${n ** 3}.`), step(`How many factors of ${n} are in ${n}³?`, 3, "Read the exponent as a factor count.", `There are three factors of ${n}.`)]);
  }
  if (["slope", "transform", "association"].includes(gen)) {
    if (gen === "slope") return lesson("Measure rise and run", "Use both coordinate differences in the same order.", { type: "coordinate", points: [[1, 2], [4, 8]], caption: "From (1, 2) to (4, 8)", slope: true }, [step("Find the vertical change: 8 − 2 = ?", 6, "Compare y coordinates.", "Rise = 6."), step("Find the horizontal change: 4 − 1 = ?", 3, "Compare x coordinates in the same order.", "Run = 3."), step("What is the slope, rise ÷ run?", 2, "Divide vertical change by horizontal change.", "6 ÷ 3 = 2.")]);
    if (gen === "transform") return lesson("Reflect a point across the y-axis", "The reflected point stays equally far from the mirror line, on the other side.", { type: "coordinate", points: [[4, -2]], reflected: [-4, -2], caption: "Reflect (4, −2) across the y-axis" }, [step("Which coordinate changes sign across the y-axis?", "x", "The horizontal position switches sides.", "x changes sign; y stays the same.", "choice", ["x", "y"]), step("What is the reflected x coordinate?", -4, "Reverse the sign of 4.", "The point moves 4 units left of the y-axis."), step("Write the reflected point as (x,y).", "(-4,-2)", "Keep the original y coordinate.", "The reflected point is (−4, −2).", "text")]);
    const negative = k % 2 === 1; const points = [1, 2, 3, 4, 5].map((x) => [x, negative ? 10 - x : x + 2]);
    return lesson("Read a pattern in paired data", "Each point pairs one x value with one y value. Look at the overall direction.", { type: "coordinate", points, caption: "Paired observations; association does not establish a cause" }, [step("As x increases, does y rise or fall?", negative ? "fall" : "rise", "Read the points from left to right.", negative ? "y decreases as x increases." : "y increases as x increases.", "choice", ["rise", "fall"]), step("Which association describes the points?", negative ? "negative" : "positive", "Rising together is positive; one rising as the other falls is negative.", `The association is ${negative ? "negative" : "positive"}.`, "choice", ["positive", "negative", "none"]), step("Does this pattern alone prove that x causes y to change?", "no", "Association alone cannot establish cause.", "No. A pattern alone does not prove causation.", "choice", ["yes", "no"])]);
  }
  if (gen === "geometry" || gen === "pythagorean") {
    const shape = gen === "pythagorean" ? "rightTriangle" : config.shape;
    if (shape === "triangleArea") {
      const base = 8 + 2 * k; const height = 3 + k;
      return lesson("Use base and perpendicular height", "A triangle is half of a rectangle with the same base and height. The height meets the base at a right angle.", { type: "triangleArea", base, height, caption: "The dotted height is perpendicular to the base" }, [step(`What is base × height for base ${base} and height ${height}?`, base * height, "Multiply the two perpendicular measurements.", `${base} × ${height} = ${base * height}.`), step(`What is half of ${base * height}?`, (base * height) / 2, "A triangle uses half of the matching rectangle's area.", `${base * height} ÷ 2 = ${(base * height) / 2}.`), step(`What is the triangle's area?`, (base * height) / 2, "Write the answer in square units.", `The area is ${(base * height) / 2} square units.`)]);
    }
    if (shape === "angleRelations") {
      const known = 35 + k * 10; const total = k % 2 ? 180 : 90; const relation = total === 90 ? "complementary" : "supplementary";
      return lesson("Use the angle relationship", `${relation === "complementary" ? "Complementary angles make a right angle (90°)." : "Supplementary angles make a straight angle (180°)."} Use that total to find the missing measure.`, { type: "anglePair", relation, known, caption: "One angle measure is known; find its partner" }, [step(`What total do ${relation} angles make?`, total, "Use the definition of the relationship.", `The total is ${total}°.`), step(`What is ${total} − ${known}?`, total - known, "Subtract the known angle from the total.", `${total}° − ${known}° = ${total - known}°.`), step(`What is the other angle?`, total - known, "Check that both measures add to the relationship total.", `The other angle is ${total - known}°.`)]);
    }
    if (shape === "circle") return lesson("Square the radius", "The coefficient of π is the square of the radius.", { type: "shape", shape, a: 3 + k, caption: `Radius ${3 + k}` }, [step("If the radius is 3, what is 3²?", 9, "Multiply 3 by itself.", "3² = 9."), step(`Square the radius ${3 + k} in this circle.`, (3 + k) ** 2, "Use radius × radius.", `The coefficient of π is ${(3 + k) ** 2}.`), step(`What number multiplies π in the area?`, (3 + k) ** 2, "Use A = πr².", `A = ${(3 + k) ** 2}π.`)]);
    if (shape === "rightTriangle") return lesson("Build the square on each side", "For a right triangle, the areas of the squares on the legs add to the square on the hypotenuse.", { type: "shape", shape, a: 6, b: 8, caption: "Legs 6 and 8; hypotenuse c" }, [step("Find 6² + 8².", 100, "Square each leg before adding.", "36 + 64 = 100."), step("What is √100?", 10, "Find the positive side length.", "√100 = 10."), step("What is the hypotenuse?", 10, "The square root gives c, not c².", "c = 10 units.")]);
    const a = 4 + k; const b = 3; const height = 2;
    if (shape === "volume") return lesson("Stack equal layers", "Each layer has length × width unit cubes. Stack the layers to fill the prism.", { type: "shape", shape, a, b, height, caption: `${a} × ${b} × ${height}` }, [step("How many unit cubes fill one layer?", a * b, "Multiply length by width.", `${a} × ${b} = ${a * b}.`), step("How many layers are there?", height, "Read the prism's height.", "There are 2 layers."), step("How many unit cubes fill the prism?", a * b * height, "Multiply cubes per layer by the number of layers.", `The volume is ${a * b * height} cubic units.`)]);
    if (shape === "perimeter") return lesson("Walk around the boundary", "Perimeter measures the whole distance around a shape.", { type: "shape", shape: "rectangle", a, b, caption: "Add all four side lengths" }, [step(`What is the length of the two ${a}-unit sides together?`, 2 * a, "Add the two opposite sides.", `${a} + ${a} = ${2 * a}.`), step(`What is the length of the two ${b}-unit sides together?`, 2 * b, "Include both remaining sides.", `${b} + ${b} = ${2 * b}.`), step("What is the perimeter?", 2 * (a + b), "Combine both pairs of sides.", `The perimeter is ${2 * (a + b)} units.`)]);
    return lesson("Cover a rectangle with unit squares", "Area counts the squares inside the boundary.", { type: "array", a, b, split: a, caption: `${a} by ${b} rectangle` }, [step("How many squares are in one row?", b, "Count across the row.", `There are ${b} squares per row.`), step("How many rows are there?", a, "Count down the side.", `There are ${a} rows.`), step("What is the area?", a * b, "Multiply rows by squares in a row.", `The area is ${a * b} square units.`)]);
  }
  throw new Error(`Missing visual lesson for ${gen}`);
}

export function transferPrompt(skill) {
  const prompts = {
    fact: "Invent a short story that fits one problem you just solved. Explain what each number means.",
    fractionOp: "Sketch equal-sized wholes to explain why your fraction answer makes sense.",
    fractionEquivalent: "Show two different fraction names for the same shaded amount.",
    solve: "Explain why your last operation keeps both sides of the equation equal.",
    ratio: "Describe a recipe or mixture that could use this ratio. What changes when you double it?",
    percent: "Describe a situation where knowing 25% helps you find 75%.",
    geometry: "Find an object nearby with this shape. Explain what you would measure and which units you would use.",
    slope: "Explain what a slope of 2 would mean on a graph of distance against time.",
  };
  return prompts[skill.generator] || `Explain “${skill.learn.rule}” to someone at home. Make a new example and show how to check it.`;
}
