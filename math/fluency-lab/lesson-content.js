const step = (prompt, answer, hint, explanation, kind = "number", choices = null) => ({ prompt, answers: [String(answer)], kind, choices, hint, explanation });
const lesson = (title, idea, model, steps) => ({ title, idea, model, steps });
const num = (value) => Number(value.toFixed(6));

// Every visual lesson uses an explicit model and checked intermediate steps.
// Variants change the quantities while keeping each model mathematically exact.
export function createLesson(skill, variant = 0) {
  const k = Math.abs(variant) % 5;
  const grade = skill.grade || 1;
  const config = skill.config;
  const gen = skill.generator;
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
      return lesson("Subtract in friendly jumps", "Take away one part at a time, then use addition to check.", { type: "numberline", start: a, jumps: [-part, -(b - part)], caption: `${a} − ${b}` }, [step(`First take away ${part} from ${a}. Where do you land?`, a - part, "Move left for subtraction.", `${a} − ${part} = ${a - part}.`), step(`Take away the remaining ${b - part}. Where do you land?`, a - b, "Continue from your first landing point.", `${a - part} − ${b - part} = ${a - b}.`), step(`Check: ${a - b} + ${b} = ?`, a, "Add back what you took away.", `You return to ${a}, so the difference is ${a - b}.`)]);
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
    return lesson("Add by place value", `Break an addend into ${placeName} and the remaining amount. Each jump keeps the total in view.`, { type: "numberline", start: a, jumps: [part, b - part], caption: `${a} + ${b}` }, [step(`How much is the ${placeName} part of ${b}?`, part, `Keep the ${placeName} and replace the smaller places with zero.`, `${b} = ${part} + ${b - part}.`), step(`Add ${part} to ${a}.`, a + part, `Add the ${placeName} first.`, `${a} + ${part} = ${a + part}.`), step(`Add the remaining ${b - part}. What is the total?`, a + b, "Continue from the last total.", `${a + part} + ${b - part} = ${a + b}.`)]);
  }
  if (["makeTarget", "missingAddend"].includes(gen)) {
    const total = gen === "makeTarget" ? config.target : 12 + k;
    const known = 7;
    return lesson("Build the missing part", "A whole is made of two parts. Tap empty spaces until the frame shows the whole.", { type: "counters", total, filled: known, target: total, caption: `${known} + □ = ${total}` }, [step("How many original dark counters did we start with?", known, "Count only the fixed, dark counters.", `The known part is ${known}.`), step(`How many counters must be added to the original ${known} to make ${total}?`, total - known, "Count your added counters, or count on from the original amount.", `${known} needs ${total - known} more.`), step(`Check the whole: ${known} + ${total - known} = ?`, total, "Combine both parts.", `Both parts make ${total}.`)]);
  }
  if (gen === "sequence") {
    const jump = config.steps[k % config.steps.length]; const start = 10 + k;
    return lesson("Follow equal jumps", "A counting pattern repeats the same change each time.", { type: "numberline", start, jumps: [jump, jump, jump], caption: "Equal jumps" }, [step(`From ${start} to ${start + jump}, how large is the jump?`, jump, "Find the difference.", `Each jump is +${jump}.`), step(`What comes after ${start + jump}?`, start + jump * 2, "Use the same jump again.", `${start + jump} + ${jump} = ${start + jump * 2}.`), step(`Continue: what comes after ${start + jump * 2}?`, start + jump * 3, "Continue from the latest number.", `The pattern reaches ${start + jump * 3}.`)]);
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
    const hour = 2 + k;
    return lesson("Travel around a clock", "Sixty minutes make one hour. Two half-hour jumps make a full hour.", { type: "clock", hour, minute: 30, caption: `${hour}:30 + 60 minutes` }, [step(`How many minutes take you from ${hour}:30 to ${hour + 1}:00?`, 30, "Half an hour remains.", "30 minutes take you to the next hour."), step("You need 60 minutes altogether. How many minutes are left?", 30, "Subtract the 30 minutes already used.", "60 − 30 = 30."), step(`What time is 60 minutes after ${hour}:30?`, `${hour + 1}:30`, "Add the remaining half hour.", `The later time is ${hour + 1}:30.`, "text")]);
  }
  if (gen === "money") {
    const q = 2 + k % 2; const d = 1 + k;
    return lesson("Count value, coin by coin", "Group equal coins and multiply by their value in cents.", { type: "coins", counts: [q, d, 1, 2], caption: "Quarter 25¢ · dime 10¢ · nickel 5¢ · penny 1¢" }, [step(`${q} quarters are how many cents?`, q * 25, "Each quarter is 25 cents.", `${q} × 25 = ${q * 25} cents.`), step(`Add ${d} dimes. How many cents so far?`, q * 25 + d * 10, "Each dime adds 10 cents.", `The running total is ${q * 25 + d * 10} cents.`), step("Add one nickel and two pennies. What is the total in cents?", q * 25 + d * 10 + 7, "A nickel is 5 cents; two pennies add 2.", `The total is ${q * 25 + d * 10 + 7} cents.`)]);
  }
  if (["fractionEquivalent", "fractionCompare", "fractionOp", "fractionOf", "probability"].includes(gen)) {
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
    const a = num(2.4 + k / 10); const mul = config.op === "mul";
    const b = mul ? 0.5 : 1.35; const subtract = config.op === "sub";
    const total = num(mul ? a * b : subtract ? a - b : a + b);
    return lesson(mul ? "Use a benchmark: one half" : "Line up equal places", mul ? "Multiplying by 0.5 finds half. Use that meaning to check the decimal position." : "Align the decimal points so ones, tenths, and hundredths match.", { type: "place", numbers: [a.toFixed(2), b.toFixed(2)], caption: `${a} ${mul ? "×" : subtract ? "−" : "+"} ${b}` }, [step(mul ? "What denominator makes 0.5 = 1/□?" : `Write ${a} in hundredths. How many hundredths?`, mul ? 2 : Math.round(a * 100), mul ? "0.5 is one half." : "Multiply the number by 100.", mul ? "0.5 = 1/2." : `${a} is ${Math.round(a * 100)} hundredths.`), step(mul ? `How much is half of ${Math.round(a * 10)} tenths, in tenths?` : `${subtract ? "Subtract" : "Add"} 135 hundredths. How many hundredths result?`, mul ? a * 5 : Math.round(total * 100), mul ? "Divide the number of tenths by 2." : "Work with the whole-number counts of hundredths.", mul ? `Half of ${Math.round(a * 10)} tenths is ${a * 5} tenths.` : `You have ${Math.round(total * 100)} hundredths.`), step("Write the final value as a decimal.", total, "Convert back to the correct place value.", `The result is ${total}.`)]);
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

export function getPublisherExplanation(skill) {
  const lesson = createLesson(skill, 0);
  const gen = skill.generator;
  const standard = skill.standard || "";
  const rule = skill.learn?.rule || "";
  const steps = skill.learn?.steps || [];
  const rawExample = skill.learn?.example || "";
  const watch = skill.learn?.watch || "";

  let problemStem = "";
  let solutionSteps = [];
  let whyItWorks = "";
  let commonMistake = {
    wrong: watch,
    fix: "Slow down, check your place value or sign, and verify using an inverse operation."
  };
  let mathTalk = [
    "To begin solving, I first noticed that...",
    "I chose this strategy because...",
    "I can justify my answer because..."
  ];

  if (gen === "fact") {
    const op = skill.config?.op || "add";
    if (op === "add") {
      problemStem = rawExample.includes("=") ? `Find the sum: ${rawExample.split("=")[0].trim()} = ?` : `Find the sum: ${rawExample}`;
      solutionSteps = [
        { label: "Step 1 · Decompose & Align", action: steps[0] || "Identify the addends and break them into place-value parts (tens and ones).", math: "Deconstruct into friendly parts" },
        { label: "Step 2 · Combine Like Units", action: steps[1] || "Add like units together. Regroup 10 units to the next place value when a column reaches 10 or more.", math: "Add place by place" },
        { label: "Step 3 · Verify with Subtraction", action: steps[2] || "Add partial sums. Check your answer: Sum − Addend = Other Addend.", math: "Check with subtraction" }
      ];
      whyItWorks = "Addition joins amounts. Place value lets us combine groups of the same size (hundreds with hundreds, tens with tens, ones with ones), regrouping when any place reaches 10.";
      commonMistake = {
        wrong: "Forgetting to record or add the regrouped ten when the ones total 10 or more.",
        fix: "Always write the regrouped 10 in the tens place and add it to the other tens."
      };
      mathTalk = [
        "I broke apart the smaller number so I could make a friendly ten.",
        "When the ones digits totaled 10 or more, I regrouped 10 ones as 1 ten.",
        "I checked my total by taking away one addend to verify the other addend."
      ];
    } else if (op === "sub") {
      problemStem = rawExample.includes("=") ? `Find the difference: ${rawExample.split("=")[0].trim()} = ?` : `Calculate: ${rawExample}`;
      solutionSteps = [
        { label: "Step 1 · Identify Whole & Part", action: steps[0] || "Start with the starting whole and identify how much is being subtracted.", math: "Whole − Part = Difference" },
        { label: "Step 2 · Subtract in Friendly Jumps", action: steps[1] || "Subtract the larger place value first, or count up from the smaller number on a number line.", math: "Friendly jumps" },
        { label: "Step 3 · Check with Addition", action: steps[2] || "Check your answer using addition: Difference + Part = Whole.", math: "Check: Diff + Part = Whole" }
      ];
      whyItWorks = "Subtraction finds the distance between two quantities or the remaining amount after removal. Addition and subtraction undo each other.";
      commonMistake = {
        wrong: "Subtracting the smaller digit from the larger digit regardless of whether it is on top or bottom.",
        fix: "Always subtract from the top number. If there are not enough ones, regroup 1 ten into 10 ones first."
      };
      mathTalk = [
        "I thought of subtraction as finding the distance between the two numbers.",
        "I jumped back in friendly chunks (tens first, then ones).",
        "I checked my difference by adding it back to the subtracted number."
      ];
    } else if (op === "mul") {
      problemStem = rawExample.includes("=") ? `Find the product: ${rawExample.split("=")[0].trim()} = ?` : `Multiply: ${rawExample}`;
      solutionSteps = [
        { label: "Step 1 · Identify Equal Groups", action: steps[0] || "Identify the number of groups and the size of each group.", math: "Factor × Factor = Product" },
        { label: "Step 2 · Decompose One Factor", action: steps[1] || "Break one factor into easier parts (e.g. tens and ones) and multiply each part.", math: "Partial Products" },
        { label: "Step 3 · Combine & Check", action: steps[2] || "Combine the partial products. Verify using the related division fact or an area model.", math: "Check with division or estimation" }
      ];
      whyItWorks = "The distributive property allows us to split a multi-digit multiplication into smaller, friendlier rectangles or groups that add up to the exact same total.";
      commonMistake = {
        wrong: "Multiplying only one part of the decomposed number and forgetting to multiply the other part.",
        fix: "Ensure every part of the split factor gets multiplied by the other factor."
      };
      mathTalk = [
        "I split one factor into friendlier numbers (like 10 and ones).",
        "An area model helps me see each partial product clearly.",
        "I know my answer makes sense because I estimated the product first."
      ];
    } else if (op === "div") {
      problemStem = rawExample.includes("=") ? `Find the quotient: ${rawExample.split("=")[0].trim()} = ?` : `Divide: ${rawExample}`;
      solutionSteps = [
        { label: "Step 1 · Think Related Multiplication", action: steps[0] || "Ask: What number times the divisor equals the dividend?", math: "Divisor × ? = Dividend" },
        { label: "Step 2 · Partition into Friendly Multiples", action: steps[1] || "Break the dividend into friendly multiples of the divisor and divide each part.", math: "Partial Quotients" },
        { label: "Step 3 · Combine & Verify", action: steps[2] || "Add the partial quotients together. Check by multiplying quotient × divisor.", math: "Check: Quotient × Divisor = Dividend" }
      ];
      whyItWorks = "Division partitions a total amount into equal groups or finds how many equal groups can be made. Partitioning into friendly multiples lets us divide in manageable pieces.";
      commonMistake = {
        wrong: "Reversing the dividend and divisor, or losing place value when writing quotient digits.",
        fix: "Keep the total (dividend) in the numerator and divide by the group size, watching place value."
      };
      mathTalk = [
        "I asked myself: how many groups of the divisor fit inside the total?",
        "I partitioned the dividend into friendly multiples I know well.",
        "I checked my quotient by multiplying it by the divisor."
      ];
    }
  } else if (gen === "compare") {
    problemStem = `Compare: ${rawExample}`;
    solutionSteps = [
      { label: "Step 1 · Align by Place Value", action: steps[0] || "Look at both numbers starting with the greatest place value.", math: "Compare greatest places" },
      { label: "Step 2 · Find the First Unequal Digit", action: steps[1] || "If the greatest places match, move one place right until the digits differ.", math: "Move right to next place" },
      { label: "Step 3 · State the Comparison", action: steps[2] || "Use >, <, or = to write the relationship. The open side faces the greater value.", math: "Write >, <, or =" }
    ];
    whyItWorks = "Place value is based on powers of ten. A single unit in a higher place value is always greater than all units in lower place values combined.";
    commonMistake = {
      wrong: "Comparing the ones place first, or assuming a longer number with larger ending digits is automatically greater.",
      fix: "Always compare from left to right, starting with the greatest place value column."
    };
    mathTalk = [
      "I started by comparing the highest place value column.",
      "Because the highest place values tied, I moved one column to the right.",
      "The symbol opens toward the greater quantity."
    ];
  } else if (gen === "fractionEquivalent" || gen === "fractionCompare" || gen === "fractionOp" || gen === "fractionOf") {
    problemStem = `Solve: ${rawExample}`;
    solutionSteps = [
      { label: "Step 1 · Inspect the Denominators", action: steps[0] || "Notice whether the pieces are the same size (common denominators).", math: "Examine piece sizes" },
      { label: "Step 2 · Rename or Scale", action: steps[1] || "Multiply or divide numerator and denominator by the same factor to create equivalent pieces.", math: "Scale numerator and denominator" },
      { label: "Step 3 · Calculate & Simplify", action: steps[2] || "Combine numerators or compare shaded lengths, keeping the denominator the same.", math: "Simplify if possible" }
    ];
    whyItWorks = "A fraction's denominator names the size of each equal slice, while the numerator counts how many slices you have. You can only combine or compare slices directly when they are the exact same size.";
    commonMistake = {
      wrong: "Adding the denominators together (e.g. 1/3 + 1/4 = 2/7).",
      fix: "Never add denominators! The denominator tells the size of the piece, not how many there are."
    };
    mathTalk = [
      "I found a common denominator so the pieces would be the exact same size.",
      "I multiplied numerator and denominator by the same number to keep the value equal.",
      "I kept the denominator the same and combined the numerators."
    ];
  } else if (gen === "solve" || gen === "one-step" || gen === "linear-equations") {
    problemStem = `Solve the equation: ${rawExample}`;
    solutionSteps = [
      { label: "Step 1 · Identify Operations", action: steps[0] || "Find what operations are being applied to the variable x.", math: "Locate variable and operations" },
      { label: "Step 2 · Apply Inverse Operations", action: steps[1] || "Undo operations in reverse order, performing the exact same action to both sides of the equals sign.", math: "Keep both sides balanced" },
      { label: "Step 3 · Substitute & Check", action: steps[2] || "Substitute your answer back into the original equation to verify both sides balance.", math: "Check: Left side = Right side" }
    ];
    whyItWorks = "An equation is like a balanced scale. Doing the exact same operation to both sides preserves equality until the variable stands alone.";
    commonMistake = {
      wrong: "Doing an operation to only one side of the equation, or using the wrong inverse operation.",
      fix: "Whatever operation you perform on one side, you MUST perform on the opposite side to maintain balance."
    };
    mathTalk = [
      "To isolate the variable, I used inverse operations.",
      "I kept the equation balanced by doing the same thing to both sides.",
      "I plugged my answer back into the original equation to prove it works."
    ];
  } else if (gen === "ratio" || gen === "unitRate" || gen === "proportion" || gen === "percent" || gen === "percentChange") {
    problemStem = `Solve: ${rawExample}`;
    solutionSteps = [
      { label: "Step 1 · Identify the Comparison", action: steps[0] || "Write down what two quantities are being compared and their units.", math: "Set up ratio or rate" },
      { label: "Step 2 · Scale by a Constant Factor", action: steps[1] || "Find the scale factor or unit rate by multiplying or dividing both quantities by the same number.", math: "Scale both terms together" },
      { label: "Step 3 · Interpret with Units", action: steps[2] || "State the final value and make sure units are clearly attached.", math: "Label with units" }
    ];
    whyItWorks = "Ratios represent multiplicative relationships. Scaling both quantities by the same non-zero factor preserves the exact same proportional relationship.";
    commonMistake = {
      wrong: "Adding the same amount to both terms instead of multiplying/dividing by a scale factor.",
      fix: "Ratios are multiplicative comparisons. Always scale using multiplication or division, never addition."
    };
    mathTalk = [
      "I set up a ratio table to track both quantities.",
      "I found the scale factor by dividing the new quantity by the original.",
      "Multiplying both quantities by the same factor kept the ratio in proportion."
    ];
  } else {
    problemStem = `Example: ${rawExample}`;
    solutionSteps = [
      { label: "Step 1 · Notice & Set Up", action: steps[0] || "Examine the problem and identify key mathematical relationships.", math: "Understand the question" },
      { label: "Step 2 · Execute Strategy", action: steps[1] || "Apply the mathematical rule carefully step-by-step.", math: "Apply strategy" },
      { label: "Step 3 · Verify & Check", action: steps[2] || "Check the result's reasonableness and justify your solution.", math: "Verify reasonableness" }
    ];
    whyItWorks = `Mathematics is built on patterns and logical structures. ${rule}`;
    commonMistake = {
      wrong: watch,
      fix: "Slow down, review the core rule, and test your solution."
    };
    mathTalk = [
      "The first thing I looked for was...",
      "This strategy helped me because...",
      "I know my answer makes sense because..."
    ];
  }

  return {
    standard,
    grade: skill.grade || 1,
    strand: skill.strand || "",
    title: skill.title || "",
    rule,
    coreConcept: rule.endsWith(".") ? rule : rule + ".",
    visualTitle: lesson.title,
    visualIdea: lesson.idea,
    anchorModel: lesson.model,
    problemStem,
    solutionSteps,
    whyItWorks,
    commonMistake,
    mathTalk,
    quickSample: lesson.steps[0] ? {
      prompt: lesson.steps[0].prompt,
      answer: lesson.steps[0].answers[0],
      hint: lesson.steps[0].hint,
      explanation: lesson.steps[0].explanation,
      kind: lesson.steps[0].kind,
      choices: lesson.steps[0].choices
    } : null
  };
}

export function getDynamicGuidedSteps(skill, item) {
  if (!item?.question) {
    return [
      { label: "Notice", copy: skill.learn?.steps?.[0] || "Examine what the question asks." },
      { label: "Plan", copy: item?.hint || "Choose a strategy." },
      { label: "Solve and check", copy: skill.learn?.steps?.[2] || "Calculate and check." }
    ];
  }

  const q = item.question.replace(/\s+/g, " ").trim();

  // Pattern 1: Addition a + b = ?
  const addMatch = q.match(/^([\d,]+)\s*\+\s*([\d,]+)\s*=\s*\?$/);
  if (addMatch) {
    const a = Number(addMatch[1].replace(/,/g, ""));
    const b = Number(addMatch[2].replace(/,/g, ""));
    if (Number.isFinite(a) && Number.isFinite(b)) {
      if (a + b <= 20) {
        const big = Math.max(a, b);
        const small = Math.min(a, b);
        const makeTen = 10 - big;
        return [
          { label: "Notice", copy: `We are joining ${a} and ${b}. Start with the larger number: ${big}.` },
          { label: "Plan", copy: makeTen > 0 && makeTen <= small ? `Break ${small} into ${makeTen} and ${small - makeTen}. Add ${big} + ${makeTen} = 10, then add the leftover ${small - makeTen}.` : `Count on ${small} from ${big}, or use a doubles fact.` },
          { label: "Solve and check", copy: `Combine to find ${a} + ${b}. Check: your sum minus ${b} should equal ${a}.` }
        ];
      }
      return [
        { label: "Notice", copy: `We are adding ${a.toLocaleString()} and ${b.toLocaleString()}. Align like place values.` },
        { label: "Plan", copy: `Add each place value. If a column totals 10 or more, regroup 10 units into the next place to the left.` },
        { label: "Solve and check", copy: `Combine all places for the total. Check your work: sum − ${b.toLocaleString()} = ${a.toLocaleString()}.` }
      ];
    }
  }

  // Pattern 2: Subtraction a − b = ?
  const subMatch = q.match(/^([\d,]+)\s*[−-]\s*([\d,]+)\s*=\s*\?$/);
  if (subMatch) {
    const a = Number(subMatch[1].replace(/,/g, ""));
    const b = Number(subMatch[2].replace(/,/g, ""));
    if (Number.isFinite(a) && Number.isFinite(b)) {
      if (a <= 20) {
        return [
          { label: "Notice", copy: `Start with the whole: ${a}. We need to take away ${b}.` },
          { label: "Plan", copy: `Think of subtraction as a missing addend: ${b} + ? = ${a}. Or jump back in friendly steps.` },
          { label: "Solve and check", copy: `Find the difference. Check: your answer + ${b} should equal ${a}.` }
        ];
      }
      return [
        { label: "Notice", copy: `Start with ${a.toLocaleString()} and subtract ${b.toLocaleString()}.` },
        { label: "Plan", copy: `Subtract friendly chunks (tens first, then ones), or count up from ${b.toLocaleString()} to ${a.toLocaleString()}.` },
        { label: "Solve and check", copy: `Find the difference. Check with addition: difference + ${b.toLocaleString()} = ${a.toLocaleString()}.` }
      ];
    }
  }

  // Pattern 3: Multiplication a × b = ?
  const mulMatch = q.match(/^([\d,]+)\s*[×*x]\s*([\d,]+)\s*=\s*\?$/);
  if (mulMatch) {
    const a = Number(mulMatch[1].replace(/,/g, ""));
    const b = Number(mulMatch[2].replace(/,/g, ""));
    if (Number.isFinite(a) && Number.isFinite(b)) {
      if (a <= 12 && b <= 12) {
        return [
          { label: "Notice", copy: `Multiplication means ${a} equal groups of ${b}.` },
          { label: "Plan", copy: `Use an anchor fact: e.g. break ${a} into friendly parts (like 5 and ${a - 5}), or use skip-counting.` },
          { label: "Solve and check", copy: `Multiply to find ${a} × ${b}. Check using division: product ÷ ${b} = ${a}.` }
        ];
      }
      const splitA = a >= 100 ? Math.floor(a / 100) * 100 : Math.floor(a / 10) * 10;
      const remA = a - splitA;
      return [
        { label: "Notice", copy: `We need ${a.toLocaleString()} × ${b.toLocaleString()}. Think of an area rectangle with width ${a.toLocaleString()} and height ${b.toLocaleString()}.` },
        { label: "Plan", copy: `Split ${a.toLocaleString()} into ${splitA.toLocaleString()} + ${remA.toLocaleString()}. Find partial products: (${splitA.toLocaleString()} × ${b.toLocaleString()}) and (${remA.toLocaleString()} × ${b.toLocaleString()}).` },
        { label: "Solve and check", copy: `Add your partial products together. Check that the answer is reasonable compared to an estimate.` }
      ];
    }
  }

  // Pattern 4: Division a ÷ b = ?
  const divMatch = q.match(/^([\d,]+)\s*[÷/]\s*([\d,]+)\s*=\s*\?$/);
  if (divMatch) {
    const a = Number(divMatch[1].replace(/,/g, ""));
    const b = Number(divMatch[2].replace(/,/g, ""));
    if (Number.isFinite(a) && Number.isFinite(b)) {
      return [
        { label: "Notice", copy: `We are dividing ${a.toLocaleString()} by ${b.toLocaleString()}. Think: ${b.toLocaleString()} × ? = ${a.toLocaleString()}.` },
        { label: "Plan", copy: a > b * 10 ? `Find friendly multiples of ${b.toLocaleString()} that fit in ${a.toLocaleString()} (like ${b * 10}, ${b * 20}, etc.) and subtract them.` : `Recall the related multiplication fact for ${b.toLocaleString()}.` },
        { label: "Solve and check", copy: `Find the quotient. Check by multiplying: your quotient × ${b.toLocaleString()} must equal ${a.toLocaleString()}.` }
      ];
    }
  }

  // Pattern 5: Missing Addend a + □ = c or a + ? = c
  const missingMatch = q.match(/^([\d,]+)\s*\+\s*[□?]\s*=\s*([\d,]+)/);
  if (missingMatch) {
    const a = Number(missingMatch[1].replace(/,/g, ""));
    const c = Number(missingMatch[2].replace(/,/g, ""));
    return [
      { label: "Notice", copy: `We know one part is ${a} and the whole is ${c}. We need the missing part.` },
      { label: "Plan", copy: `Count on from ${a} up to ${c}, or subtract the known part from the whole: ${c} − ${a}.` },
      { label: "Solve and check", copy: `Find the missing amount in the box. Check: ${a} + your answer should equal ${c}.` }
    ];
  }

  // Pattern 6: Comparison a ___ b
  const compMatch = q.match(/^([\d.,]+)\s*___\s*([\d.,]+)/);
  if (compMatch) {
    const a = compMatch[1];
    const b = compMatch[2];
    return [
      { label: "Notice", copy: `Compare ${a} and ${b}. Start by lining up equal place values from left to right.` },
      { label: "Plan", copy: `Look at the greatest place value where the digits differ. The number with more in that place is greater.` },
      { label: "Solve and check", copy: `Choose >, <, or =. The open mouth of the symbol faces the greater number.` }
    ];
  }

  // Default fallback to skill steps and item hint
  return [
    { label: "Notice", copy: skill.learn?.steps?.[0] || "Examine what the question asks." },
    { label: "Plan", copy: item.hint || skill.learn?.steps?.[1] || "Choose a strategy." },
    { label: "Solve and check", copy: skill.learn?.steps?.[2] || "Calculate and check." }
  ];
}
