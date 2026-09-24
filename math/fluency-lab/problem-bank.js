const whole = new Intl.NumberFormat("en-US", { maximumFractionDigits: 6 });

const randInt = (min, max, rng = Math.random) =>
  Math.floor(rng() * (max - min + 1)) + min;
const pick = (items, rng = Math.random) => items[randInt(0, items.length - 1, rng)];
const gcd = (a, b) => {
  let x = Math.abs(a);
  let y = Math.abs(b);
  while (y) [x, y] = [y, x % y];
  return x || 1;
};
const lcm = (a, b) => Math.abs(a * b) / gcd(a, b);
const fraction = (n, d) => {
  const sign = d < 0 ? -1 : 1;
  const divisor = gcd(n, d);
  return [sign * (n / divisor), Math.abs(d / divisor)];
};
const fractionText = (n, d) => {
  const [sn, sd] = fraction(n, d);
  return sd === 1 ? String(sn) : `${sn}/${sd}`;
};
const decimalText = (value, places = 3) =>
  Number(value.toFixed(places)).toString();
const timeText = (minutes) => {
  const normalized = ((minutes % 720) + 720) % 720;
  const hour = Math.floor(normalized / 60) || 12;
  return `${hour}:${String(normalized % 60).padStart(2, "0")}`;
};

function problem(question, answer, options = {}) {
  const answers = Array.isArray(answer) ? answer.map(String) : [String(answer)];
  return {
    question,
    answers,
    displayAnswer: options.displayAnswer || answers[0],
    hint: options.hint || "Name the operation, then solve one careful step.",
    explanation: options.explanation || `The answer is ${options.displayAnswer || answers[0]}.`,
    kind: options.kind || "number",
    choices: options.choices || null,
    unit: options.unit || "",
  };
}

const FACT_SYMBOL = { add: "+", sub: "−", mul: "×", div: "÷" };

const generators = {
  fact(config, rng) {
    const op = config.op || "add";
    const min = config.min ?? 0;
    const max = config.max ?? 10;
    let a;
    let b;
    let answer;
    if (op === "add") {
      a = randInt(min, max, rng);
      b = randInt(min, Math.max(min, (config.maxResult ?? max * 2) - a), rng);
      answer = a + b;
    } else if (op === "sub") {
      answer = randInt(min, max, rng);
      b = randInt(min, max, rng);
      a = answer + b;
      if (config.maxResult) a = Math.min(a, config.maxResult);
      answer = a - b;
    } else if (op === "mul") {
      const pool = config.factors || null;
      a = pool ? pick(pool, rng) : randInt(config.minA ?? min, config.maxA ?? max, rng);
      b = randInt(config.minB ?? min, config.maxB ?? max, rng);
      answer = a * b;
    } else {
      b = randInt(config.minDivisor ?? 1, config.maxDivisor ?? max, rng);
      answer = randInt(config.minQuotient ?? 1, config.maxQuotient ?? max, rng);
      a = b * answer;
    }
    const symbol = FACT_SYMBOL[op];
    return problem(`${whole.format(a)} ${symbol} ${whole.format(b)} = ?`, answer, {
      hint:
        op === "add"
          ? "Combine the two amounts. You can make a ten first."
          : op === "sub"
            ? "Find the difference. Count up or subtract in parts."
            : op === "mul"
              ? "Think in equal groups or use a fact you already know."
              : "Ask: what number times the divisor makes the dividend?",
      explanation: `${whole.format(a)} ${symbol} ${whole.format(b)} = ${whole.format(answer)}.`,
    });
  },

  compare(config, rng) {
    const max = config.max ?? 100;
    let a = randInt(config.min ?? 0, max, rng);
    let b = randInt(config.min ?? 0, max, rng);
    if (config.noEqual && a === b) b = b === max ? b - 1 : b + 1;
    const answer = a === b ? "=" : a > b ? ">" : "<";
    return problem(`${whole.format(a)} ___ ${whole.format(b)}`, answer, {
      kind: "choice",
      choices: ["<", "=", ">"],
      hint: "Compare the greatest place value first.",
      explanation: `${whole.format(a)} ${answer} ${whole.format(b)}.`,
    });
  },

  missingAddend(config, rng) {
    const total = randInt(config.minTotal ?? 5, config.maxTotal ?? 20, rng);
    const known = randInt(0, total, rng);
    const answer = total - known;
    return problem(`${known} + □ = ${total}. What belongs in the box?`, answer, {
      hint: `Count on from ${known} until you reach ${total}.`,
      explanation: `${known} + ${answer} = ${total}.`,
    });
  },

  makeTarget(config, rng) {
    const target = config.target ?? 10;
    const known = randInt(0, target, rng);
    const answer = target - known;
    return problem(`${known} + ? = ${target}`, answer, {
      hint: `Picture a ${target}-frame. How many spaces are still empty?`,
      explanation: `${known} needs ${answer} more to make ${target}.`,
    });
  },

  placeValue(config, rng) {
    const max = config.max ?? 999;
    const min = config.min ?? 10;
    const places = (config.places || [1, 10, 100]).filter((place) => place <= max);
    const place = pick(places, rng);
    const n = randInt(Math.max(min, place), max, rng);
    const digit = Math.floor(n / place) % 10;
    const placeName = { 1: "ones", 10: "tens", 100: "hundreds", 1000: "thousands", 10000: "ten-thousands", 100000: "hundred-thousands" }[place];
    const askValue = config.askValue ?? rng() > 0.5;
    return problem(
      askValue
        ? `What is the value of the ${digit} in ${whole.format(n)}?`
        : `What digit is in the ${placeName} place of ${whole.format(n)}?`,
      askValue ? digit * place : digit,
      {
        hint: `Find the ${placeName} place before answering.`,
        explanation: `The ${placeName} digit is ${digit}, so its value is ${whole.format(digit * place)}.`,
      },
    );
  },

  sequence(config, rng) {
    const step = pick(config.steps || [2, 5, 10], rng);
    const start = randInt(config.minStart ?? 0, config.maxStart ?? 50, rng);
    const terms = [start, start + step, start + step * 2, start + step * 3];
    return problem(`${terms.join(", ")}, ___`, start + step * 4, {
      hint: `The pattern changes by ${step} each time.`,
      explanation: `Add ${step} to ${terms[3]} to get ${start + step * 4}.`,
    });
  },

  round(config, rng) {
    const place = pick(config.places || [10, 100], rng);
    const n = randInt(place, config.max ?? place * 100, rng);
    const answer = Math.round(n / place) * place;
    const placeName = { 10: "nearest ten", 100: "nearest hundred", 1000: "nearest thousand" }[place];
    return problem(`Round ${whole.format(n)} to the ${placeName}.`, answer, {
      hint: `Look at the digit immediately to the right of the ${placeName.replace("nearest ", "")} place.`,
      explanation: `${whole.format(n)} rounds to ${whole.format(answer)}.`,
    });
  },

  evenOdd(config, rng) {
    const n = randInt(config.min ?? 1, config.max ?? 200, rng);
    const answer = n % 2 === 0 ? "even" : "odd";
    return problem(`Is ${n} even or odd?`, answer, {
      kind: "choice",
      choices: ["even", "odd"],
      hint: "Even numbers can be split into pairs with none left over.",
      explanation: `${n} is ${answer}.`,
    });
  },

  timeAdd(config, rng) {
    const start = randInt(1, 11, rng) * 60 + pick([0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50], rng);
    const elapsed = pick(config.elapsed || [15, 20, 25, 30, 35, 45, 60], rng);
    return problem(`What time is ${elapsed} minutes after ${timeText(start)}?`, timeText(start + elapsed), {
      kind: "text",
      hint: "Add the minutes first. Regroup 60 minutes as 1 hour if needed.",
      explanation: `${elapsed} minutes after ${timeText(start)} is ${timeText(start + elapsed)}.`,
    });
  },

  money(config, rng) {
    const quarters = randInt(0, config.maxCoins ?? 4, rng);
    const dimes = randInt(0, config.maxCoins ?? 4, rng);
    const nickels = randInt(0, config.maxCoins ?? 4, rng);
    const pennies = randInt(0, 9, rng);
    const answer = quarters * 25 + dimes * 10 + nickels * 5 + pennies;
    return problem(
      `${quarters} quarters + ${dimes} dimes + ${nickels} nickels + ${pennies} pennies = how many cents?`,
      answer,
      {
        hint: "Use 25¢, 10¢, 5¢, and 1¢, then add the values.",
        explanation: `${quarters * 25} + ${dimes * 10} + ${nickels * 5} + ${pennies} = ${answer} cents.`,
        unit: "¢",
      },
    );
  },

  fractionEquivalent(config, rng) {
    const d = randInt(2, config.maxDenominator ?? 12, rng);
    const n = randInt(1, d - 1, rng);
    const factor = randInt(2, config.maxFactor ?? 6, rng);
    const hideNumerator = rng() > 0.5;
    const question = hideNumerator
      ? `${n}/${d} = □/${d * factor}`
      : `${n}/${d} = ${n * factor}/□`;
    const answer = hideNumerator ? n * factor : d * factor;
    return problem(question, answer, {
      hint: `The known part was multiplied by ${factor}. Multiply the other part by the same number.`,
      explanation: `${n}/${d} × ${factor}/${factor} = ${n * factor}/${d * factor}.`,
    });
  },

  fractionCompare(config, rng) {
    const maxD = config.maxDenominator ?? 12;
    const d1 = randInt(2, maxD, rng);
    const d2 = randInt(2, maxD, rng);
    const n1 = randInt(1, d1, rng);
    const n2 = randInt(1, d2, rng);
    const left = n1 / d1;
    const right = n2 / d2;
    const answer = Math.abs(left - right) < 1e-9 ? "=" : left > right ? ">" : "<";
    return problem(`${n1}/${d1} ___ ${n2}/${d2}`, answer, {
      kind: "choice",
      choices: ["<", "=", ">"],
      hint: "Use a common denominator, a benchmark, or cross products.",
      explanation: `${n1} × ${d2} = ${n1 * d2} and ${n2} × ${d1} = ${n2 * d1}, so ${n1}/${d1} ${answer} ${n2}/${d2}.`,
    });
  },

  fractionOp(config, rng) {
    const op = config.op || "add";
    let d1 = randInt(2, config.maxDenominator ?? 12, rng);
    let d2 = config.likeDenominators ? d1 : randInt(2, config.maxDenominator ?? 12, rng);
    let n1 = randInt(1, d1 - 1, rng);
    let n2 = randInt(1, d2 - 1, rng);
    let n;
    let d;
    if (op === "add") {
      n = n1 * d2 + n2 * d1;
      d = d1 * d2;
    } else if (op === "sub") {
      if (n1 / d1 < n2 / d2) {
        [n1, n2] = [n2, n1];
        [d1, d2] = [d2, d1];
      }
      n = n1 * d2 - n2 * d1;
      d = d1 * d2;
    } else if (op === "mul") {
      n = n1 * n2;
      d = d1 * d2;
    } else {
      n = n1 * d2;
      d = d1 * n2;
    }
    const answer = fractionText(n, d);
    const symbol = FACT_SYMBOL[op];
    return problem(`${n1}/${d1} ${symbol} ${n2}/${d2} = ?`, answer, {
      kind: "fraction",
      hint:
        op === "add" || op === "sub"
          ? "Rename the fractions with a common denominator before combining them."
          : op === "mul"
            ? "Multiply numerators, multiply denominators, then simplify."
            : "Keep the first fraction, multiply by the reciprocal of the second, then simplify.",
      explanation: `${n1}/${d1} ${symbol} ${n2}/${d2} = ${answer}.`,
    });
  },

  fractionOf(config, rng) {
    const d = randInt(2, config.maxDenominator ?? 10, rng);
    const n = randInt(1, d - 1, rng);
    const groups = randInt(2, config.maxGroups ?? 12, rng);
    const wholeAmount = d * groups;
    const answer = n * groups;
    return problem(`What is ${n}/${d} of ${wholeAmount}?`, answer, {
      hint: `First find 1/${d} of ${wholeAmount}, then take ${n} of those parts.`,
      explanation: `${wholeAmount} ÷ ${d} = ${groups}; ${groups} × ${n} = ${answer}.`,
    });
  },

  decimalPlace(config, rng) {
    const places = config.places ?? 2;
    const scale = 10 ** places;
    const n = randInt(1, scale * 10 - 1, rng) / scale;
    const place = randInt(1, places, rng);
    const digit = Math.floor(n * 10 ** place) % 10;
    const names = ["tenths", "hundredths", "thousandths"];
    return problem(`What digit is in the ${names[place - 1]} place of ${n.toFixed(places)}?`, digit, {
      hint: "The first digit after the decimal is tenths, then hundredths, then thousandths.",
      explanation: `The digit in the ${names[place - 1]} place is ${digit}.`,
    });
  },

  decimalOp(config, rng) {
    const op = config.op || "add";
    const places = config.places ?? 2;
    const scale = 10 ** places;
    let a;
    let b;
    let answer;
    if (op === "add" || op === "sub") {
      a = randInt(1, config.maxScaled ?? scale * 100, rng) / scale;
      b = randInt(1, config.maxScaled ?? scale * 50, rng) / scale;
      if (op === "sub" && b > a) [a, b] = [b, a];
      answer = op === "add" ? a + b : a - b;
    } else if (op === "mul") {
      a = randInt(1, config.maxA ?? 99, rng) / 10;
      b = randInt(1, config.maxB ?? 99, rng) / 10;
      answer = a * b;
    } else {
      b = randInt(2, config.maxDivisor ?? 12, rng) / (config.decimalDivisor ? 10 : 1);
      answer = randInt(1, config.maxQuotient ?? 20, rng) / (config.decimalQuotient ? 10 : 1);
      a = b * answer;
    }
    const symbol = FACT_SYMBOL[op];
    const shownA = decimalText(a, 4);
    const shownB = decimalText(b, 4);
    const shownAnswer = decimalText(answer, 6);
    return problem(`${shownA} ${symbol} ${shownB} = ?`, shownAnswer, {
      hint:
        op === "add" || op === "sub"
          ? "Line up the decimal points and work by place value."
          : op === "mul"
            ? "Multiply as whole numbers, then place the decimal using the total decimal places."
            : "Make the divisor a whole number by moving both decimal points the same distance.",
      explanation: `${shownA} ${symbol} ${shownB} = ${shownAnswer}.`,
    });
  },

  gcfLcm(config, rng) {
    const a = randInt(2, config.max ?? 36, rng);
    let b = randInt(2, config.max ?? 36, rng);
    if (a === b) b += 1;
    const find = config.find || "gcf";
    const answer = find === "gcf" ? gcd(a, b) : lcm(a, b);
    return problem(`Find the ${find.toUpperCase()} of ${a} and ${b}.`, answer, {
      hint: find === "gcf" ? "List factor pairs and find the greatest shared factor." : "List multiples until both lists meet.",
      explanation: `The ${find.toUpperCase()} of ${a} and ${b} is ${answer}.`,
    });
  },

  ratio(config, rng) {
    const a = randInt(1, config.maxPart ?? 12, rng);
    const b = randInt(1, config.maxPart ?? 12, rng);
    const factor = randInt(2, config.maxFactor ?? 8, rng);
    const hideSecond = rng() > 0.5;
    const question = hideSecond ? `${a}:${b} = ${a * factor}:□` : `${a}:${b} = □:${b * factor}`;
    const answer = hideSecond ? b * factor : a * factor;
    return problem(question, answer, {
      hint: `One quantity was multiplied by ${factor}. Use the same scale factor on the other quantity.`,
      explanation: `${a}:${b} scaled by ×${factor} is ${a * factor}:${b * factor}.`,
    });
  },

  unitRate(config, rng) {
    const count = randInt(2, config.maxCount ?? 12, rng);
    const rate = randInt(2, config.maxRate ?? 25, rng) / (config.decimals ? 10 : 1);
    const total = count * rate;
    return problem(`${whole.format(total)} for ${count} items. How much for 1 item?`, decimalText(rate, 2), {
      hint: `Divide the total by ${count}.`,
      explanation: `${whole.format(total)} ÷ ${count} = ${decimalText(rate, 2)} per item.`,
    });
  },

  percent(config, rng) {
    const percent = pick(config.percents || [10, 20, 25, 50, 75], rng);
    const baseUnit = 100 / gcd(percent, 100);
    const wholeAmount = baseUnit * randInt(2, config.maxMultiplier ?? 15, rng);
    const answer = (wholeAmount * percent) / 100;
    return problem(`What is ${percent}% of ${wholeAmount}?`, decimalText(answer, 2), {
      hint: "Rewrite the percent as a fraction or decimal, then multiply.",
      explanation: `${percent}% of ${wholeAmount} is ${answer}.`,
    });
  },

  percentChange(config, rng) {
    const percent = pick(config.percents || [10, 20, 25, 50], rng);
    const baseUnit = 100 / gcd(percent, 100);
    const original = baseUnit * randInt(2, config.maxMultiplier ?? 20, rng);
    const decrease = config.type !== "increase";
    const change = (original * percent) / 100;
    const answer = decrease ? original - change : original + change;
    return problem(
      `${whole.format(original)} with a ${percent}% ${decrease ? "decrease" : "increase"} equals what?`,
      decimalText(answer, 2),
      {
        hint: `Find ${percent}% of ${original}, then ${decrease ? "subtract" : "add"} that change.`,
        explanation: `${percent}% of ${original} is ${change}; the new amount is ${answer}.`,
      },
    );
  },

  integerOp(config, rng) {
    const op = config.op || pick(["add", "sub", "mul"], rng);
    let a = randInt(config.min ?? -20, config.max ?? 20, rng);
    let b = randInt(config.min ?? -20, config.max ?? 20, rng);
    if (op === "div") {
      b = pick([-10, -9, -8, -7, -6, -5, -4, -3, -2, 2, 3, 4, 5, 6, 7, 8, 9, 10], rng);
      const q = randInt(-10, 10, rng);
      a = b * q;
    }
    const answer = op === "add" ? a + b : op === "sub" ? a - b : op === "mul" ? a * b : a / b;
    const symbol = FACT_SYMBOL[op];
    return problem(`${a} ${symbol} (${b}) = ?`, answer, {
      hint: op === "add" || op === "sub" ? "Use a number line and pay attention to direction." : "Find the size first, then use the sign rules.",
      explanation: `${a} ${symbol} (${b}) = ${answer}.`,
    });
  },

  absolute(config, rng) {
    const n = randInt(config.min ?? -50, config.max ?? 50, rng);
    return problem(`|${n}| = ?`, Math.abs(n), {
      hint: "Absolute value is distance from zero, so it is never negative.",
      explanation: `${n} is ${Math.abs(n)} units from zero.`,
    });
  },

  orderOps(config, rng) {
    const a = randInt(2, 12, rng);
    const b = randInt(2, 12, rng);
    const c = randInt(2, 9, rng);
    const grouped = rng() > 0.5;
    const answer = grouped ? (a + b) * c : a + b * c;
    return problem(grouped ? `(${a} + ${b}) × ${c} = ?` : `${a} + ${b} × ${c} = ?`, answer, {
      hint: "Do grouping symbols first, then multiplication or division, then addition or subtraction.",
      explanation: grouped ? `Add first: ${a + b} × ${c} = ${answer}.` : `Multiply first: ${a} + ${b * c} = ${answer}.`,
    });
  },

  evaluate(config, rng) {
    const x = randInt(config.minX ?? -5, config.maxX ?? 12, rng);
    const a = randInt(2, config.maxCoefficient ?? 9, rng);
    const b = randInt(-9, 12, rng);
    const answer = a * x + b;
    return problem(`Evaluate ${a}x ${b < 0 ? "−" : "+"} ${Math.abs(b)} when x = ${x}.`, answer, {
      hint: `Replace x with ${x}, then multiply before adding or subtracting.`,
      explanation: `${a}(${x}) ${b < 0 ? "−" : "+"} ${Math.abs(b)} = ${answer}.`,
    });
  },

  solve(config, rng) {
    const x = randInt(config.minX ?? -10, config.maxX ?? 20, rng);
    const a = config.oneStep ? 1 : randInt(2, config.maxCoefficient ?? 9, rng);
    const b = randInt(-12, 15, rng);
    const c = a * x + b;
    return problem(`${a === 1 ? "x" : `${a}x`} ${b < 0 ? "−" : "+"} ${Math.abs(b)} = ${c}. Find x.`, x, {
      hint: `Undo ${b < 0 ? `subtracting ${Math.abs(b)}` : `adding ${b}`} first${a === 1 ? "." : `, then divide by ${a}.`}`,
      explanation: `The value x = ${x} makes both sides equal ${c}.`,
    });
  },

  inequality(config, rng) {
    const boundary = randInt(-10, 20, rng);
    const test = randInt(-10, 20, rng);
    const symbol = pick([">", "<", "≥", "≤"], rng);
    const trueValue = symbol === ">" ? test > boundary : symbol === "<" ? test < boundary : symbol === "≥" ? test >= boundary : test <= boundary;
    return problem(`Is ${test} a solution to x ${symbol} ${boundary}?`, trueValue ? "yes" : "no", {
      kind: "choice",
      choices: ["yes", "no"],
      hint: `Replace x with ${test} and read the comparison.`,
      explanation: `${test} ${symbol} ${boundary} is ${trueValue ? "true" : "false"}.`,
    });
  },

  exponent(config, rng) {
    const base = randInt(config.minBase ?? 2, config.maxBase ?? 10, rng);
    const exponent = randInt(2, config.maxExponent ?? 4, rng);
    const answer = base ** exponent;
    return problem(`${base}^${exponent} = ?`, answer, {
      hint: `Multiply ${base} by itself ${exponent} times.`,
      explanation: `${base}^${exponent} = ${Array(exponent).fill(base).join(" × ")} = ${answer}.`,
    });
  },

  powerTen(config, rng) {
    const coefficient = randInt(1, 99, rng) / 10;
    const power = randInt(config.minPower ?? -3, config.maxPower ?? 5, rng);
    const answer = coefficient * 10 ** power;
    return problem(`${decimalText(coefficient, 1)} × 10^${power} = ?`, decimalText(answer, 8), {
      hint: `A power of 10 moves the decimal ${Math.abs(power)} places ${power >= 0 ? "right" : "left"}.`,
      explanation: `${decimalText(coefficient, 1)} × 10^${power} = ${decimalText(answer, 8)}.`,
    });
  },

  squareRoot(config, rng) {
    const root = randInt(2, config.maxRoot ?? 20, rng);
    return problem(`√${root * root} = ?`, root, {
      hint: "Find the positive number that multiplies by itself to make the radicand.",
      explanation: `${root} × ${root} = ${root * root}, so √${root * root} = ${root}.`,
    });
  },

  slope(config, rng) {
    const x1 = randInt(-5, 4, rng);
    const run = pick([1, 2, 3, 4], rng);
    const slope = pick([-3, -2, -1, 1, 2, 3], rng);
    const y1 = randInt(-8, 8, rng);
    const x2 = x1 + run;
    const y2 = y1 + slope * run;
    return problem(`Find the slope through (${x1}, ${y1}) and (${x2}, ${y2}).`, slope, {
      hint: "Slope = change in y ÷ change in x.",
      explanation: `(${y2} − ${y1}) ÷ (${x2} − ${x1}) = ${slope}.`,
    });
  },

  functionRule(config, rng) {
    const x = randInt(-5, 10, rng);
    const m = randInt(-4, 5, rng) || 2;
    const b = randInt(-8, 8, rng);
    const y = m * x + b;
    return problem(`If y = ${m}x ${b < 0 ? "−" : "+"} ${Math.abs(b)}, find y when x = ${x}.`, y, {
      hint: `Substitute ${x} for x, multiply, then combine the constant.`,
      explanation: `y = ${m}(${x}) ${b < 0 ? "−" : "+"} ${Math.abs(b)} = ${y}.`,
    });
  },

  system(config, rng) {
    const x = randInt(-6, 10, rng);
    const y = randInt(-6, 10, rng);
    const sum = x + y;
    const difference = x - y;
    return problem(`x + y = ${sum} and x − y = ${difference}. Find x.`, x, {
      hint: "Add the equations. The y terms cancel, leaving 2x.",
      explanation: `Adding gives 2x = ${sum + difference}, so x = ${x}.`,
    });
  },

  coordinate(config, rng) {
    let x = randInt(-9, 9, rng);
    let y = randInt(-9, 9, rng);
    if (x === 0) x = 1;
    if (y === 0) y = -1;
    const answer = x > 0 && y > 0 ? "I" : x < 0 && y > 0 ? "II" : x < 0 && y < 0 ? "III" : "IV";
    return problem(`Which quadrant contains (${x}, ${y})?`, answer, {
      kind: "choice",
      choices: ["I", "II", "III", "IV"],
      hint: "Read x first (left/right), then y (down/up).",
      explanation: `(${x}, ${y}) is in Quadrant ${answer}.`,
    });
  },

  transform(config, rng) {
    const x = randInt(-8, 8, rng) || 3;
    const y = randInt(-8, 8, rng) || -2;
    const axis = pick(["x-axis", "y-axis", "origin"], rng);
    const result = axis === "x-axis" ? [x, -y] : axis === "y-axis" ? [-x, y] : [-x, -y];
    return problem(`Reflect (${x}, ${y}) across the ${axis}.`, `(${result[0]},${result[1]})`, {
      kind: "text",
      displayAnswer: `(${result[0]}, ${result[1]})`,
      hint: axis === "x-axis" ? "Keep x; change the sign of y." : axis === "y-axis" ? "Change the sign of x; keep y." : "Change both signs.",
      explanation: `The image is (${result[0]}, ${result[1]}).`,
    });
  },

  geometry(config, rng) {
    const shape = config.shape || "rectangleArea";
    const a = randInt(2, config.max ?? 20, rng);
    const b = randInt(2, config.max ?? 20, rng);
    const c = randInt(2, config.max ?? 12, rng);
    if (shape === "rectangleArea")
      return problem(`Area of a rectangle with length ${a} and width ${b}?`, a * b, { hint: "Area = length × width.", explanation: `${a} × ${b} = ${a * b} square units.`, unit: "square units" });
    if (shape === "perimeter")
      return problem(`Perimeter of a rectangle with length ${a} and width ${b}?`, 2 * (a + b), { hint: "Add all four sides, or use 2(length + width).", explanation: `2(${a} + ${b}) = ${2 * (a + b)} units.`, unit: "units" });
    if (shape === "triangleArea") {
      const base = a % 2 === 0 ? a : a + 1;
      return problem(`Area of a triangle with base ${base} and height ${b}?`, (base * b) / 2, { hint: "Area = 1/2 × base × height.", explanation: `1/2 × ${base} × ${b} = ${(base * b) / 2} square units.`, unit: "square units" });
    }
    if (shape === "volume")
      return problem(`Volume of a rectangular prism: ${a} × ${b} × ${c}?`, a * b * c, { hint: "Volume = length × width × height.", explanation: `${a} × ${b} × ${c} = ${a * b * c} cubic units.`, unit: "cubic units" });
    if (shape === "circle") {
      const radius = randInt(1, 12, rng);
      const answer = radius * radius;
      return problem(`A circle has radius ${radius}. What number multiplies π to give its area?`, answer, { hint: "Area = πr². Square the radius.", explanation: `r² = ${radius}² = ${answer}, so the area is ${answer}π.`, unit: "π square units" });
    }
    const leg = randInt(2, 12, rng);
    const target = config.target || 180;
    const answer = target - leg;
    return problem(`Two angles total ${target}°. One angle is ${leg}°. Find the other.`, answer, { hint: `Subtract the known angle from ${target}°.`, explanation: `${target} − ${leg} = ${answer}°.`, unit: "°" });
  },

  conversion(config, rng) {
    const conversions = config.conversions || [
      ["feet", "inches", 12],
      ["yards", "feet", 3],
      ["hours", "minutes", 60],
      ["kilograms", "grams", 1000],
      ["meters", "centimeters", 100],
    ];
    const [from, to, factor] = pick(conversions, rng);
    const amount = randInt(2, config.maxAmount ?? 12, rng);
    return problem(`${amount} ${from} = how many ${to}?`, amount * factor, {
      hint: `Each ${from.replace(/s$/, "")} has ${factor} ${to}. Multiply.`,
      explanation: `${amount} × ${factor} = ${amount * factor} ${to}.`,
      unit: to,
    });
  },

  stats(config, rng) {
    const type = config.type || pick(["mean", "median", "range"], rng);
    if (type === "mean") {
      const mean = randInt(3, 20, rng);
      const d1 = randInt(1, 5, rng);
      const d2 = randInt(1, 5, rng);
      const values = [mean - d1, mean + d1, mean - d2, mean + d2];
      return problem(`Find the mean: ${values.join(", ")}.`, mean, { hint: "Add the values, then divide by how many values there are.", explanation: `The sum is ${mean * 4}; ${mean * 4} ÷ 4 = ${mean}.` });
    }
    if (type === "median") {
      const values = Array.from({ length: 5 }, () => randInt(1, 30, rng)).sort((a, b) => a - b);
      return problem(`Find the median: ${values.join(", ")}.`, values[2], { hint: "Put values in order and choose the middle one.", explanation: `${values[2]} is the middle value.` });
    }
    const values = Array.from({ length: 5 }, () => randInt(1, 40, rng));
    const answer = Math.max(...values) - Math.min(...values);
    return problem(`Find the range: ${values.join(", ")}.`, answer, { hint: "Range = greatest value − least value.", explanation: `${Math.max(...values)} − ${Math.min(...values)} = ${answer}.` });
  },

  association(_config, rng) {
    const type = pick(["positive", "negative", "none"], rng);
    const xValues = [1, 2, 3, 4, 5];
    const start = randInt(4, 18, rng);
    const step = randInt(2, 5, rng);
    const yValues =
      type === "positive"
        ? xValues.map((x) => start + step * x)
        : type === "negative"
          ? xValues.map((x) => start + step * (6 - x))
          : [start + step * 2, start, start + step * 3, start + step, start + step * 2];
    return problem(
      `A data table has x-values ${xValues.join(", ")} and y-values ${yValues.join(", ")}. Which association best describes the data?`,
      type,
      {
        kind: "choice",
        choices: ["positive", "negative", "none"],
        hint: "Read the pairs from left to right. Notice whether y generally rises, generally falls, or has no steady direction as x increases.",
        explanation:
          type === "positive"
            ? "As x increases, y increases, so the association is positive."
            : type === "negative"
              ? "As x increases, y decreases, so the association is negative."
              : "As x increases, y moves up and down without a steady direction, so there is no association.",
      },
    );
  },

  probability(config, rng) {
    const total = randInt(4, config.maxTotal ?? 20, rng);
    const favorable = randInt(1, total - 1, rng);
    const answer = fractionText(favorable, total);
    return problem(`${favorable} of ${total} equal sections are winning sections. What is P(win)?`, answer, {
      kind: "fraction",
      hint: "Probability = favorable outcomes ÷ total outcomes.",
      explanation: `P(win) = ${favorable}/${total} = ${answer}.`,
    });
  },

  proportion(config, rng) {
    const a = randInt(1, 12, rng);
    const b = randInt(2, 12, rng);
    const factor = randInt(2, 9, rng);
    return problem(`${a}/${b} = x/${b * factor}. Find x.`, a * factor, {
      hint: `The denominator was multiplied by ${factor}; multiply the numerator by ${factor}, too.`,
      explanation: `x = ${a} × ${factor} = ${a * factor}.`,
    });
  },

  pythagorean(config, rng) {
    const triples = [[3, 4, 5], [5, 12, 13], [6, 8, 10], [8, 15, 17], [9, 12, 15]];
    const [a, b, c] = pick(triples, rng);
    return problem(`A right triangle has legs ${a} and ${b}. Find the hypotenuse.`, c, {
      hint: "Use a² + b² = c², then take the square root.",
      explanation: `${a}² + ${b}² = ${a * a + b * b}; √${a * a + b * b} = ${c}.`,
    });
  },
};

const L = (rule, steps, example, watch) => ({ rule, steps, example, watch });
const S = (id, title, strand, generator, config, standard, learn) => ({
  id,
  title,
  strand,
  generator,
  config,
  standard,
  learn,
});

export const GRADES = [
  {
    grade: 1,
    color: "#d14f7a",
    label: "Grade 1",
    promise: "Build number sense and make addition and subtraction feel familiar.",
    skills: [
      S("count-patterns", "Count by 1s, 2s, 5s, and 10s", "Counting", "sequence", { steps: [1, 2, 5, 10], maxStart: 100 }, "1.NBT.A.1", L("A counting pattern changes by the same amount each time.", ["Say the numbers aloud.", "Notice what changes and what stays the same.", "Add the step one more time."], "35, 40, 45, 50 → 55", "Do not restart at 1; continue from the last number.")),
      S("compare-100", "Compare numbers within 100", "Place value", "compare", { max: 100 }, "1.NBT.B.3", L("Compare tens first. Compare ones only when the tens match.", ["Find the tens digit.", "Choose the number with more tens.", "If tied, compare ones."], "47 > 39 because 4 tens is more than 3 tens.", "A longer-looking numeral is not automatically greater.")),
      S("tens-ones", "Tens and ones", "Place value", "placeValue", { min: 10, max: 120, places: [1, 10] }, "1.NBT.B.2", L("Two-digit numbers are made of tens and ones.", ["Read the number.", "Point to the tens and ones places.", "Name the digit or its value."], "63 has 6 tens and 3 ones.", "The digit 6 in 63 means 60, not 6.")),
      S("add-10", "Addition facts within 10", "Addition", "fact", { op: "add", max: 10, maxResult: 10 }, "1.OA.C.6", L("Addition joins amounts.", ["Start with the larger addend.", "Count on the smaller addend.", "Check with a ten-frame or fingers."], "6 + 3 = 9", "Count on; do not recount the first group.")),
      S("subtract-10", "Subtraction facts within 10", "Subtraction", "fact", { op: "sub", max: 10, maxResult: 10 }, "1.OA.C.6", L("Subtraction finds what remains or the difference.", ["Start at the whole.", "Take away or count up.", "Check by adding back."], "9 − 4 = 5 because 5 + 4 = 9.", "Keep track of how many you remove.")),
      S("make-10", "Make 10", "Addition", "makeTarget", { target: 10 }, "1.OA.B.4", L("Partners of 10 help with many later facts.", ["Picture a ten-frame.", "Count the filled spaces.", "Count the empty spaces."], "7 needs 3 more to make 10.", "The two partners must total exactly 10.")),
      S("add-20", "Addition facts within 20", "Addition", "fact", { op: "add", max: 10, maxResult: 20 }, "1.OA.C.6", L("Use known facts and make-ten strategies.", ["Break an addend to make 10.", "Add the leftover part.", "Check by counting on."], "8 + 6 = 8 + 2 + 4 = 14", "Do not lose the leftover part after making 10.")),
      S("subtract-20", "Subtraction facts within 20", "Subtraction", "fact", { op: "sub", max: 10, maxResult: 20 }, "1.OA.C.6", L("Think of subtraction as take-away or a missing addend.", ["Ask what plus the smaller number makes the larger.", "Count up in useful jumps.", "Check with addition."], "14 − 8 = 6 because 8 + 6 = 14.", "The answer is the difference, not the number counted to.")),
      S("missing-addend", "Find the missing addend", "Addition", "missingAddend", { maxTotal: 20 }, "1.OA.D.8", L("A missing-addend equation asks for the unknown part.", ["Start at the known part.", "Count on to the total.", "The count-on amount is the missing part."], "7 + □ = 12, so □ = 5.", "Do not add the total and the known part.")),
      S("time", "Tell time and find later times", "Measurement", "timeAdd", { elapsed: [30, 60] }, "1.MD.B.3", L("A clock groups 60 minutes into each hour.", ["Read the hour.", "Read the minutes.", "Add the elapsed minutes."], "30 minutes after 2:00 is 2:30.", "When minutes reach 60, move to the next hour.")),
    ],
  },
  {
    grade: 2,
    color: "#c5672f",
    label: "Grade 2",
    promise: "Strengthen place value and calculate confidently within 1,000.",
    skills: [
      S("facts-20", "Addition facts within 20", "Fluency", "fact", { op: "add", max: 10, maxResult: 20 }, "2.OA.B.2", L("Use fact families, doubles, and make-ten facts.", ["Look for a fact you know.", "Adjust from that fact.", "Check with subtraction."], "8 + 7 is one less than 8 + 8, so it is 15.", "Efficient strategies are better than counting every object.")),
      S("sub-facts-20", "Subtraction facts within 20", "Fluency", "fact", { op: "sub", max: 10, maxResult: 20 }, "2.OA.B.2", L("Addition and subtraction facts belong to the same family.", ["Turn subtraction into a missing-addend question.", "Use a known addition fact.", "Check by adding."], "15 − 7 = 8 because 7 + 8 = 15.", "Use the whole as the starting number.")),
      S("place-1000", "Place value to 1,000", "Place value", "placeValue", { min: 100, max: 999, places: [1, 10, 100] }, "2.NBT.A.1", L("Three-digit numbers are hundreds, tens, and ones.", ["Read from the greatest place.", "Locate the requested digit.", "Multiply the digit by its place value when asked for value."], "The 4 in 472 has a value of 400.", "A digit and its value are different ideas.")),
      S("compare-1000", "Compare three-digit numbers", "Place value", "compare", { min: 100, max: 999 }, "2.NBT.A.4", L("Compare hundreds, then tens, then ones.", ["Start with hundreds.", "Move right only when digits tie.", "Choose <, =, or >."], "582 > 579 because 8 tens is more than 7 tens.", "Do not compare only the ones digits.")),
      S("skip-count", "Skip-count patterns", "Counting", "sequence", { steps: [2, 5, 10, 100], maxStart: 500 }, "2.NBT.A.2", L("Skip-counting repeatedly adds the same amount.", ["Name the step.", "Add it to the last term.", "Check that each jump matches."], "125, 225, 325, 425 → 525", "A 100-step changes the hundreds place, not the ones.")),
      S("add-100", "Add within 100", "Addition", "fact", { op: "add", max: 50, maxResult: 100 }, "2.NBT.B.5", L("Add tens and ones by place value.", ["Break apart tens and ones.", "Combine like places.", "Regroup 10 ones as 1 ten when needed."], "38 + 27 = 30 + 20 + 8 + 7 = 65", "Regrouping changes the form, not the value.")),
      S("subtract-100", "Subtract within 100", "Subtraction", "fact", { op: "sub", max: 50, maxResult: 100 }, "2.NBT.B.5", L("Subtract by place value or count up by friendly jumps.", ["Choose a strategy.", "Regroup if there are not enough ones.", "Check with addition."], "63 − 28 = 35", "When regrouping, 1 ten becomes 10 ones.")),
      S("add-1000", "Add within 1,000", "Addition", "fact", { op: "add", min: 100, max: 499, maxResult: 999 }, "2.NBT.B.7", L("Line up equal place values before adding.", ["Add ones.", "Add tens and regroup if needed.", "Add hundreds and check reasonableness."], "247 + 135 = 382", "Misaligned digits change the value of the numbers.")),
      S("even-odd", "Even and odd numbers", "Number sense", "evenOdd", { max: 200 }, "2.OA.C.3", L("Even numbers form pairs with none left over.", ["Look at the ones digit.", "0, 2, 4, 6, and 8 are even endings.", "Other endings are odd."], "146 is even because it ends in 6.", "Only the ones digit decides even or odd.")),
      S("coins", "Count mixed coins", "Money", "money", { maxCoins: 4 }, "2.MD.C.8", L("Count coins by their values, not by the number of coins.", ["Count quarters first.", "Add dimes and nickels.", "Add pennies last."], "2 quarters + 1 dime = 60 cents.", "Four coins do not necessarily equal four cents.")),
    ],
  },
  {
    grade: 3,
    color: "#8f6a1e",
    label: "Grade 3",
    promise: "Master multiplication and division while growing fraction and measurement sense.",
    skills: [
      S("mul-0-5", "Multiplication facts ×0–5", "Multiplication", "fact", { op: "mul", factors: [0, 1, 2, 3, 4, 5], maxB: 12 }, "3.OA.C.7", L("Multiplication describes equal groups.", ["Name the number of groups.", "Use skip-counting, an array, or a known fact.", "Check with repeated addition."], "4 × 6 means 4 groups of 6, which is 24.", "The factors can switch order without changing the product.")),
      S("mul-6-9", "Multiplication facts ×6–9", "Multiplication", "fact", { op: "mul", factors: [6, 7, 8, 9], maxB: 12 }, "3.OA.C.7", L("Break harder facts into easier facts.", ["Use a 5-fact or 10-fact.", "Add or subtract one group.", "Check with the related division fact."], "7 × 8 = 5 × 8 + 2 × 8 = 56", "Keep the group size the same when decomposing.")),
      S("mul-10-12", "Multiplication facts ×10–12", "Multiplication", "fact", { op: "mul", factors: [10, 11, 12], maxB: 12 }, "3.OA.C.7", L("Use place-value patterns and break-apart strategies.", ["Use ×10 as an anchor.", "Add one or two more groups.", "Check the product's size."], "12 × 7 = 10 × 7 + 2 × 7 = 84", "Multiplying by 10 adds place value; it is not just writing a random zero.")),
      S("division-facts", "Division facts", "Division", "fact", { op: "div", maxDivisor: 12, maxQuotient: 12 }, "3.OA.C.7", L("Division asks how many equal groups or how many in each group.", ["Identify divisor and dividend.", "Recall the related multiplication fact.", "Check by multiplying quotient × divisor."], "56 ÷ 7 = 8 because 7 × 8 = 56.", "Do not reverse the dividend and divisor.")),
      S("add-sub-1000", "Add within 1,000", "Operations", "fact", { op: "add", min: 100, max: 499, maxResult: 999 }, "3.NBT.A.2", L("Add equal place values and regroup when a place reaches 10.", ["Line up ones, tens, and hundreds.", "Add from right to left.", "Estimate to check."], "368 + 247 = 615", "A carried ten belongs in the next place to the left.")),
      S("round", "Round to tens and hundreds", "Place value", "round", { places: [10, 100], max: 999 }, "3.NBT.A.1", L("Rounding names the closest benchmark number.", ["Find the rounding place.", "Check the digit to its right.", "Keep or increase, then replace later digits with zeros."], "347 rounds to 300 to the nearest hundred.", "A 5 rounds up because it is halfway to the next benchmark.")),
      S("fraction-equivalence", "Equivalent fractions", "Fractions", "fractionEquivalent", { maxDenominator: 10, maxFactor: 5 }, "3.NF.A.3", L("Equivalent fractions name the same amount with different-sized parts.", ["Choose one scale factor.", "Multiply numerator and denominator by it.", "Check with a model or cross products."], "2/3 = 4/6 by multiplying both parts by 2.", "Never scale only the numerator or only the denominator.")),
      S("fraction-compare", "Compare fractions", "Fractions", "fractionCompare", { maxDenominator: 10 }, "3.NF.A.3", L("Compare fractions using common parts, benchmarks, or cross products.", ["Notice whether denominators or numerators match.", "Choose a comparison strategy.", "State <, =, or >."], "3/4 > 2/3 because 9/12 > 8/12.", "A larger denominator means smaller pieces when numerators match.")),
      S("area", "Rectangle area", "Geometry", "geometry", { shape: "rectangleArea", max: 15 }, "3.MD.C.7", L("Area counts square units covering a surface.", ["Identify length and width.", "Multiply the side lengths.", "Label square units."], "A 7 by 4 rectangle has area 28 square units.", "Area uses multiplication; perimeter adds side lengths.")),
      S("perimeter", "Rectangle perimeter", "Geometry", "geometry", { shape: "perimeter", max: 20 }, "3.MD.D.8", L("Perimeter is the distance around a shape.", ["List every outside side.", "Add the side lengths.", "Label linear units."], "A 7 by 4 rectangle has perimeter 22 units.", "Do not multiply length × width when finding perimeter.")),
    ],
  },
  {
    grade: 4,
    color: "#328364",
    label: "Grade 4",
    promise: "Use place value, multi-digit operations, factors, and fractions with accuracy.",
    skills: [
      S("place-million", "Place value to 1,000,000", "Place value", "placeValue", { min: 1000, max: 999999, places: [1, 10, 100, 1000, 10000, 100000] }, "4.NBT.A.1", L("Each place is ten times the place to its right.", ["Read the number by periods.", "Locate the requested digit.", "Connect digit, place, and value."], "The 7 in 472,000 has value 70,000.", "Zeros hold places even when they have no value.")),
      S("round-large", "Round multi-digit numbers", "Place value", "round", { places: [10, 100, 1000], max: 999999 }, "4.NBT.A.3", L("Round to the nearest named place using the next digit.", ["Underline the rounding place.", "Look one digit right.", "Round and replace later digits with zeros."], "48,729 rounds to 49,000 to the nearest thousand.", "Only one digit decides whether to round up or down.")),
      S("add-large", "Multi-digit addition", "Operations", "fact", { op: "add", min: 1000, max: 49999, maxResult: 99999 }, "4.NBT.B.4", L("The standard algorithm combines equal place values.", ["Align digits by place.", "Add from ones leftward.", "Regroup and estimate-check."], "23,487 + 5,906 = 29,393", "Commas do not determine alignment; place values do.")),
      S("subtract-large", "Multi-digit subtraction", "Operations", "fact", { op: "sub", min: 1000, max: 50000, maxResult: 99999 }, "4.NBT.B.4", L("Regroup one unit from the next place when needed.", ["Align place values.", "Regroup across zeros carefully.", "Subtract and check with addition."], "8,000 − 2,675 = 5,325", "When regrouping, reduce the place you borrowed from.")),
      S("multiply-1digit", "Multiply by one digit", "Multiplication", "fact", { op: "mul", minA: 100, maxA: 999, minB: 2, maxB: 9 }, "4.NBT.B.5", L("Use place value and partial products.", ["Multiply each place by the one-digit factor.", "Regroup as needed.", "Add partial products or use the standard algorithm."], "326 × 4 = 1,304", "Regrouped tens must be added to the next partial product.")),
      S("multiply-2digit", "Multiply two-digit numbers", "Multiplication", "fact", { op: "mul", minA: 10, maxA: 99, minB: 10, maxB: 99 }, "4.NBT.B.5", L("Break one factor into tens and ones.", ["Multiply by the ones part.", "Multiply by the tens part.", "Add the partial products."], "23 × 14 = 23 × 10 + 23 × 4 = 322", "The tens partial product is ten times its digit product.")),
      S("division", "Whole-number division", "Division", "fact", { op: "div", maxDivisor: 12, maxQuotient: 99 }, "4.NBT.B.6", L("Division undoes multiplication.", ["Estimate the quotient.", "Use multiplication facts for each place.", "Multiply to check."], "384 ÷ 6 = 64 because 64 × 6 = 384.", "A quotient digit must match its place value.")),
      S("factors", "Factors and multiples", "Number theory", "gcfLcm", { find: "gcf", max: 50 }, "4.OA.B.4", L("Factors divide a number evenly; multiples come from repeated multiplication.", ["List factor pairs.", "Circle shared factors.", "Choose the greatest one when finding GCF."], "Factors shared by 18 and 24 include 1, 2, 3, and 6; GCF = 6.", "A factor is not the same as a multiple.")),
      S("fraction-equiv", "Generate equivalent fractions", "Fractions", "fractionEquivalent", { maxDenominator: 12, maxFactor: 8 }, "4.NF.A.1", L("Scale numerator and denominator by the same nonzero number.", ["Find the scale factor.", "Apply it to both parts.", "Check that the value stayed equal."], "3/5 = 12/20 using ×4.", "Adding the same number to both parts does not preserve a fraction.")),
      S("fraction-compare", "Compare fractions", "Fractions", "fractionCompare", { maxDenominator: 12 }, "4.NF.A.2", L("Fractions need a common whole before they can be compared.", ["Use a benchmark or common denominator.", "Compare equal-sized parts.", "Write the correct symbol."], "5/8 > 3/5 because 25/40 > 24/40.", "Do not compare denominators by themselves.")),
    ],
  },
  {
    grade: 5,
    color: "#267f9e",
    label: "Grade 5",
    promise: "Become fluent with decimals, fractions, multi-digit operations, and volume.",
    skills: [
      S("multiply-whole", "Multi-digit multiplication", "Operations", "fact", { op: "mul", minA: 100, maxA: 999, minB: 10, maxB: 99 }, "5.NBT.B.5", L("Partial products show why the standard algorithm works.", ["Decompose a factor by place value.", "Find each partial product.", "Add and estimate-check."], "214 × 36 = 214 × 30 + 214 × 6 = 7,704", "Each partial product needs the correct place value.")),
      S("divide-whole", "Whole-number division", "Operations", "fact", { op: "div", maxDivisor: 24, maxQuotient: 200 }, "5.NBT.B.6", L("Division partitions a dividend into equal groups.", ["Estimate each quotient digit.", "Multiply and subtract.", "Bring down the next place and repeat."], "936 ÷ 12 = 78", "Check that divisor × quotient equals the dividend.")),
      S("decimal-place", "Decimal place value", "Decimals", "decimalPlace", { places: 3 }, "5.NBT.A.3", L("Decimal places name parts of one: tenths, hundredths, thousandths.", ["Start immediately right of the decimal.", "Move one place at a time.", "Name the digit and place."], "In 4.307, the 7 is in the thousandths place.", "Zeros inside a decimal hold important places.")),
      S("decimal-add", "Add decimals", "Decimals", "decimalOp", { op: "add", places: 2 }, "5.NBT.B.7", L("Line up decimal points so equal place values combine.", ["Write numbers vertically.", "Add placeholder zeros if helpful.", "Add and bring the decimal straight down."], "4.8 + 2.35 = 7.15", "Do not line up the final digits instead of the decimal points.")),
      S("decimal-sub", "Subtract decimals", "Decimals", "decimalOp", { op: "sub", places: 2 }, "5.NBT.B.7", L("Subtract decimals by place value.", ["Align decimal points.", "Add placeholder zeros.", "Regroup and subtract."], "9.2 − 3.47 = 5.73", "A placeholder zero can make regrouping visible.")),
      S("decimal-mul", "Multiply decimals", "Decimals", "decimalOp", { op: "mul" }, "5.NBT.B.7", L("The product's decimal place follows the size and place values of the factors.", ["Estimate the product.", "Multiply as whole numbers.", "Place the decimal and compare with the estimate."], "2.4 × 0.5 = 1.2", "Count decimal places only after understanding the product's size.")),
      S("fraction-add", "Add and subtract fractions", "Fractions", "fractionOp", { op: "add", maxDenominator: 12 }, "5.NF.A.1", L("Fractions can combine only after their parts are the same size.", ["Find a common denominator.", "Rename both fractions.", "Combine numerators and simplify."], "1/3 + 1/4 = 4/12 + 3/12 = 7/12", "Never add the denominators.")),
      S("fraction-mul", "Multiply fractions", "Fractions", "fractionOp", { op: "mul", maxDenominator: 12 }, "5.NF.B.4", L("Multiplying fractions finds a part of a part.", ["Multiply numerators.", "Multiply denominators.", "Simplify, or cross-cancel first."], "2/3 × 3/5 = 6/15 = 2/5", "Multiplication does not require common denominators.")),
      S("fraction-of", "Find a fraction of a whole", "Fractions", "fractionOf", { maxDenominator: 10 }, "5.NF.B.4", L("Find one equal part, then take the needed number of parts.", ["Divide the whole by the denominator.", "Multiply by the numerator.", "Check the answer is reasonable."], "3/4 of 20: 20 ÷ 4 × 3 = 15", "The denominator tells how many equal parts.")),
      S("volume", "Rectangular prism volume", "Geometry", "geometry", { shape: "volume", max: 15 }, "5.MD.C.5", L("Volume counts unit cubes filling a solid.", ["Find the base area.", "Multiply by the height.", "Label cubic units."], "4 × 3 × 8 = 96 cubic units.", "Volume uses three dimensions and cubic units.")),
    ],
  },
  {
    grade: 6,
    color: "#3c6fb6",
    label: "Grade 6",
    promise: "Connect arithmetic fluency to ratios, equations, integers, geometry, and data.",
    skills: [
      S("gcf", "Greatest common factor", "Number system", "gcfLcm", { find: "gcf", max: 60 }, "6.NS.B.4", L("The GCF is the greatest factor shared by two numbers.", ["List factors or use prime factorization.", "Identify shared factors.", "Choose the greatest shared factor."], "GCF(24, 36) = 12", "Do not choose the greatest factor from only one number.")),
      S("lcm", "Least common multiple", "Number system", "gcfLcm", { find: "lcm", max: 24 }, "6.NS.B.4", L("The LCM is the first positive multiple shared by both numbers.", ["List multiples or use prime factors.", "Find the first common value.", "Check both numbers divide it evenly."], "LCM(6, 8) = 24", "A common multiple must be divisible by both numbers.")),
      S("divide-fractions", "Divide fractions", "Number system", "fractionOp", { op: "div", maxDenominator: 10 }, "6.NS.A.1", L("Dividing by a fraction is multiplying by its reciprocal.", ["Keep the first fraction.", "Change division to multiplication and flip the second fraction.", "Multiply and simplify."], "2/3 ÷ 4/5 = 2/3 × 5/4 = 5/6", "Flip only the divisor, not both fractions.")),
      S("decimal-ops", "Decimal multiplication", "Number system", "decimalOp", { op: "mul" }, "6.NS.B.3", L("Estimate, multiply, and place the decimal by value.", ["Estimate the size.", "Multiply as whole numbers.", "Place the decimal so the result matches the estimate."], "3.2 × 1.5 = 4.8", "A product can be smaller when a factor is less than 1.")),
      S("ratios", "Equivalent ratios", "Ratios", "ratio", { maxPart: 12, maxFactor: 9 }, "6.RP.A.1", L("Equivalent ratios scale both quantities by the same factor.", ["Find the scale factor.", "Multiply or divide both quantities.", "Check the comparison stayed the same."], "3:5 scaled by 4 is 12:20.", "Adding the same amount to both terms does not preserve the ratio.")),
      S("unit-rates", "Unit rates", "Ratios", "unitRate", { maxCount: 12, maxRate: 25 }, "6.RP.A.2", L("A unit rate tells the amount for exactly one unit.", ["Write the rate as a division.", "Divide by the number of units.", "Label per 1."], "72 miles in 3 hours is 24 miles per hour.", "Keep units attached so the rate is not reversed.")),
      S("percent", "Percent of a number", "Ratios", "percent", {}, "6.RP.A.3", L("Percent means per 100.", ["Rewrite the percent as a decimal or fraction.", "Multiply by the whole.", "Check against useful benchmarks."], "25% of 60 = 1/4 of 60 = 15", "Use the original whole as the base.")),
      S("evaluate", "Evaluate expressions", "Expressions", "evaluate", {}, "6.EE.A.2", L("Evaluation replaces a variable with its given value.", ["Substitute using parentheses.", "Follow order of operations.", "Simplify carefully."], "3x + 2 when x = 4 is 3(4) + 2 = 14.", "Substitution changes the variable, not the operation signs.")),
      S("one-step", "Solve one-step equations", "Equations", "solve", { oneStep: true }, "6.EE.B.7", L("An equation stays balanced when the same operation is used on both sides.", ["Identify the operation on x.", "Use its inverse on both sides.", "Substitute to check."], "x + 7 = 19, so x = 12.", "The goal is to isolate the variable, not move symbols without meaning.")),
      S("integers", "Absolute value of integers", "Number system", "absolute", { min: -100, max: 100 }, "6.NS.C.7", L("Absolute value is a number's distance from zero.", ["Locate the number relative to zero.", "Count the distance.", "Write the distance as nonnegative."], "|−18| = 18", "Absolute value is not the same as making every number positive in an equation.")),
    ],
  },
  {
    grade: 7,
    color: "#6657b8",
    label: "Grade 7",
    promise: "Build speed and precision with rational numbers, proportions, equations, and probability.",
    skills: [
      S("integer-add", "Add and subtract integers", "Rational numbers", "integerOp", { op: "add", min: -30, max: 30 }, "7.NS.A.1", L("Integer addition combines direction and distance.", ["Use a number line or sign strategy.", "Combine or compare absolute values.", "Keep the sign that matches the direction."], "−8 + 13 = 5", "Different signs mean find a difference, not always add absolute values.")),
      S("integer-mul", "Multiply and divide integers", "Rational numbers", "integerOp", { op: "mul", min: -12, max: 12 }, "7.NS.A.2", L("Multiply magnitudes, then determine the sign.", ["Multiply absolute values.", "Same signs give positive; different signs give negative.", "Check with a pattern."], "−6 × 4 = −24", "Sign rules come after finding the magnitude.")),
      S("fraction-ops", "Operations with rational numbers", "Rational numbers", "fractionOp", { op: "sub", maxDenominator: 12 }, "7.NS.A.3", L("Rational-number operations follow fraction rules and integer sign rules.", ["Find common denominators for addition or subtraction.", "Apply signs carefully.", "Simplify the result."], "5/6 − 1/4 = 10/12 − 3/12 = 7/12", "Subtracting a negative changes the operation to addition.")),
      S("proportions", "Solve proportions", "Proportions", "proportion", {}, "7.RP.A.2", L("A proportion states that two ratios are equal.", ["Find a scale factor or use cross products.", "Solve for the unknown.", "Check both ratios have the same value."], "3/4 = x/20, so x = 15.", "Match corresponding quantities in the same positions.")),
      S("unit-rate", "Unit rates with decimals", "Proportions", "unitRate", { decimals: true, maxCount: 15, maxRate: 99 }, "7.RP.A.1", L("Complex unit rates still mean an amount per one.", ["Write the two quantities as a quotient.", "Divide accurately.", "Label both units."], "$7.50 for 3 pounds is $2.50 per pound.", "Decide which quantity should be per one before dividing.")),
      S("percent-change", "Discounts and percent change", "Percents", "percentChange", {}, "7.RP.A.3", L("A percent change is a portion of the original amount.", ["Find the change amount.", "Add for increase or subtract for decrease.", "Check the direction of change."], "$80 with 25% off is $60.", "The final amount is not the same as the discount amount.")),
      S("equations", "Two-step equations", "Equations", "solve", {}, "7.EE.B.4", L("Undo operations in reverse order while keeping the equation balanced.", ["Undo addition or subtraction.", "Undo multiplication or division.", "Substitute to verify."], "3x + 5 = 20 → 3x = 15 → x = 5", "Perform each inverse operation on both sides.")),
      S("inequalities", "Test inequality solutions", "Equations", "inequality", {}, "7.EE.B.4", L("A solution makes an inequality statement true.", ["Substitute the test value.", "Compare the two sides.", "Answer yes or no."], "8 is a solution to x > 5 because 8 > 5.", "The open side of the symbol faces the greater value.")),
      S("circle-area", "Circle area fluency", "Geometry", "geometry", { shape: "circle" }, "7.G.B.4", L("A circle's area is π times the square of its radius.", ["Identify the radius.", "Square the radius.", "Multiply by π or leave the answer in terms of π."], "r = 6 gives A = 36π.", "Square the radius, not πr.")),
      S("probability", "Simple probability", "Statistics", "probability", { maxTotal: 24 }, "7.SP.C.7", L("Probability compares favorable outcomes with all possible outcomes.", ["Count favorable outcomes.", "Count total outcomes.", "Write and simplify the fraction."], "3 winning sections out of 8 gives P(win) = 3/8.", "The denominator counts all equally likely outcomes.")),
    ],
  },
  {
    grade: 8,
    color: "#88518e",
    label: "Grade 8",
    promise: "Practice the essential moves behind exponents, linear relationships, systems, and geometry.",
    skills: [
      S("exponents", "Evaluate integer exponents", "Exponents", "exponent", { maxBase: 12, maxExponent: 4 }, "8.EE.A.1", L("An exponent tells how many times the base is used as a factor.", ["Write repeated multiplication.", "Multiply one factor at a time.", "Check the result's size."], "3⁴ = 3 × 3 × 3 × 3 = 81", "3⁴ is not 3 × 4.")),
      S("powers-ten", "Powers of ten", "Scientific notation", "powerTen", { minPower: -3, maxPower: 6 }, "8.EE.A.3", L("Powers of ten shift place value.", ["Read the exponent's sign and size.", "Move the decimal the stated places.", "Fill empty places with zeros."], "4.2 × 10³ = 4,200", "A negative exponent makes a value smaller, not negative.")),
      S("square-roots", "Perfect square roots", "Real numbers", "squareRoot", { maxRoot: 25 }, "8.NS.A.2", L("A square root undoes squaring.", ["Recall nearby perfect squares.", "Find the positive factor used twice.", "Check by squaring."], "√144 = 12 because 12² = 144.", "The principal square root is nonnegative.")),
      S("linear-equations", "Solve linear equations", "Equations", "solve", { maxCoefficient: 12, minX: -12, maxX: 20 }, "8.EE.C.7", L("Solve by creating equivalent equations until the variable is isolated.", ["Simplify each side if needed.", "Undo the constant term.", "Undo the coefficient and check."], "4x − 7 = 21 → 4x = 28 → x = 7", "Keep both sides balanced at every step.")),
      S("slope", "Find slope from two points", "Linear relationships", "slope", {}, "8.EE.B.6", L("Slope is vertical change divided by horizontal change.", ["Subtract y-values in one order.", "Subtract x-values in the same order.", "Simplify rise/run."], "From (1, 2) to (4, 8), slope = 6/3 = 2.", "Mixing subtraction orders changes the sign incorrectly.")),
      S("functions", "Evaluate linear functions", "Functions", "functionRule", {}, "8.F.A.1", L("A function gives exactly one output for each input.", ["Substitute the input for x.", "Multiply by the rate of change.", "Add the starting value."], "For y = 3x + 2 and x = 4, y = 14.", "The input replaces x everywhere it appears.")),
      S("systems", "Solve simple systems", "Systems", "system", {}, "8.EE.C.8", L("A system solution makes both equations true.", ["Add or subtract equations to eliminate a variable.", "Solve the remaining equation.", "Substitute to find or check the other variable."], "x + y = 10 and x − y = 2 gives 2x = 12, so x = 6.", "A solution is an ordered pair, not two unrelated answers.")),
      S("transformations", "Coordinate reflections", "Geometry", "transform", {}, "8.G.A.3", L("A reflection flips a point across a line while keeping equal distance.", ["Identify the mirror line.", "Keep the coordinate parallel to the line.", "Change the sign of the perpendicular coordinate."], "Across the y-axis, (4, −2) becomes (−4, −2).", "Reflecting across the x-axis changes y, not x.")),
      S("pythagorean", "Pythagorean theorem", "Geometry", "pythagorean", {}, "8.G.B.7", L("In a right triangle, the legs satisfy a² + b² = c².", ["Square both leg lengths.", "Add the squares.", "Take the square root for the hypotenuse."], "Legs 6 and 8 give c² = 36 + 64 = 100, so c = 10.", "The hypotenuse is opposite the right angle and is the longest side.")),
      S("association", "Identify bivariate association", "Data", "association", {}, "8.SP.A.1", L("Bivariate data show how two variables may change together.", ["Read each ordered pair from left to right.", "Track what y does as x increases.", "Classify the overall direction as positive, negative, or none."], "When x increases from 1 to 5 while y increases from 4 to 12, the association is positive.", "Association describes an overall pattern; it does not prove that one variable caused the other.")),
    ],
  },
];

export const ALL_SKILLS = GRADES.flatMap((grade) =>
  grade.skills.map((skill) => ({ ...skill, grade: grade.grade, gradeLabel: grade.label, color: grade.color })),
);

export function getGrade(grade) {
  return GRADES.find((item) => item.grade === Number(grade)) || GRADES[0];
}

export function getSkill(grade, skillId) {
  return getGrade(grade).skills.find((skill) => skill.id === skillId) || null;
}

export function generateProblem(skill, rng = Math.random) {
  const generator = generators[skill.generator];
  if (!generator) throw new Error(`Unknown fluency generator: ${skill.generator}`);
  return generator(skill.config || {}, rng);
}

const compact = (value) => String(value).trim().toLowerCase().replace(/\s+/g, "");
const parseFraction = (value) => {
  const cleaned = compact(value).replace("−", "-");
  if (cleaned.includes("/")) {
    const [n, d] = cleaned.split("/").map(Number);
    return Number.isFinite(n) && Number.isFinite(d) && d !== 0 ? n / d : NaN;
  }
  const number = Number(cleaned.replace(/,/g, ""));
  return Number.isFinite(number) ? number : NaN;
};

export function validateAnswer(value, item) {
  const submitted = compact(value).replace("−", "-");
  if (!submitted) return false;
  if (item.kind === "fraction") {
    const candidate = parseFraction(submitted);
    return item.answers.some((answer) => Math.abs(candidate - parseFraction(answer)) < 1e-8);
  }
  if (item.kind === "number") {
    const candidate = Number(submitted.replace(/,/g, ""));
    return Number.isFinite(candidate) && item.answers.some((answer) => Math.abs(candidate - Number(compact(answer))) < 1e-8);
  }
  return item.answers.some((answer) => compact(answer).replace(/\s+/g, "") === submitted);
}

export function seededRandom(seed) {
  let value = seed >>> 0;
  return () => {
    value += 0x6d2b79f5;
    let t = value;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
