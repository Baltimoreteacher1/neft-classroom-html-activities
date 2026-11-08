// Standard-algorithm long division as plain data, shared by the guided steps (problem-bank.js, muldiv-core.js)
// and the worked picture (long-division-board.js) so the words and the bracket always agree.
// Each cycle is Divide, Multiply, Subtract, Bring down.
const fmt = (n) => Number(n).toLocaleString("en-US");

export function longDivisionWork(dividend, divisor) {
  const digits = String(dividend).split("").map(Number);
  const cycles = [];
  let current = 0;
  let started = false;
  digits.forEach((digit, index) => {
    current = current * 10 + digit;
    const last = index === digits.length - 1;
    if (!started && current < divisor && !last) return;
    started = true;
    const qDigit = Math.floor(current / divisor);
    const product = qDigit * divisor;
    const remainder = current - product;
    cycles.push({
      index,
      digit,
      current,
      qDigit,
      product,
      remainder,
      next: last ? null : digits[index + 1],
    });
    current = remainder;
  });
  return {
    dividend,
    divisor,
    digits,
    cycles,
    quotient: Math.floor(dividend / divisor),
    remainder: dividend % divisor,
  };
}

// True when the problem is past the basic facts: a quotient above 12, or something left over.
export const needsLongDivision = (dividend, divisor) =>
  Math.floor(dividend / divisor) > 12 || dividend % divisor !== 0;

function firstCycleLine({ divisor, cycles }) {
  const [first] = cycles;
  const used = first.index + 1;
  if (used === 1) return `Start on the left with the first digit, ${first.current}.`;
  const skipped = String(first.current).slice(0, -1);
  const tooSmall = used === 2 ? skipped : `${skipped.slice(0, 1)} and ${skipped}`;
  return `${divisor} does not go into ${tooSmall}, so start with the first ${used} digits: ${first.current}.`;
}

function divideLine(cycle, divisor, isFirst, work) {
  const place = `above the ${cycle.digit}`;
  const lead = isFirst ? `${firstCycleLine(work)} ` : "";
  if (cycle.qDigit === 0)
    return `${lead}Divide: ${divisor} does not fit into ${cycle.current}, so write 0 in the quotient ${place}.`;
  return `${lead}Divide: how many ${divisor}s fit into ${cycle.current} without going over? Try ${cycle.qDigit}. Write ${cycle.qDigit} in the quotient ${place}.`;
}

// ask: "quotient" (the answer is the quotient) or "remainder" (the answer is what is left over).
export function longDivisionSteps(dividend, divisor, ask = "quotient", { compact = false } = {}) {
  const work = longDivisionWork(dividend, divisor);
  const { cycles, quotient, remainder } = work;
  const steps = [
    `Set up: write ${fmt(dividend)} ÷ ${divisor} as ${divisor} ) ${fmt(dividend)}. The divisor goes outside the bracket and the dividend goes inside.`,
  ];
  if (compact) {
    // The trail shows at most four steps: one line per cycle, the later cycles sharing a line.
    const lines = cycles.map((cycle, i) => {
      const first = i === 0 ? `${firstCycleLine(work)} ` : "";
      const fits =
        cycle.qDigit === 0 ? `${divisor} does not fit, so write 0.` : `Divide: try ${cycle.qDigit}.`;
      const rest = `Multiply ${cycle.qDigit} × ${divisor}: ${cycle.product}. Subtract ${cycle.current} − ${cycle.product}: ${cycle.remainder} left.`;
      return `${first}${fits} ${rest}${cycle.next === null ? "" : ` Bring down the ${cycle.next}.`}`;
    });
    steps.push(lines[0], ...(lines.length > 2 ? [lines.slice(1).join(" Repeat: ")] : lines.slice(1)));
  } else {
    cycles.forEach((cycle, i) => {
      steps.push(divideLine(cycle, divisor, i === 0, work));
      steps.push(`Multiply: ${cycle.qDigit} × ${divisor} = ${cycle.product}`);
      steps.push(`Subtract: ${cycle.current} − ${cycle.product} = ${cycle.remainder}`);
      if (cycle.next !== null) {
        const made = cycle.remainder * 10 + cycle.next;
        steps.push(
          cycle.remainder === 0
            ? `Bring down: bring down the ${cycle.next}. The new number is ${made}.`
            : `Bring down: bring down the ${cycle.next} next to ${cycle.remainder}. That makes ${made}.`,
        );
      }
    });
  }
  const check =
    remainder === 0
      ? `${fmt(quotient)} × ${divisor} = ${fmt(dividend)}`
      : `${fmt(quotient)} × ${divisor} + ${remainder} = ${fmt(dividend)}`;
  if (remainder === 0) {
    steps.push(
      `No digits are left to bring down and the last subtraction left 0, so nothing is left over. ${fmt(dividend)} ÷ ${divisor} = ${fmt(quotient)}. Check: ${check}`,
    );
  } else {
    const result = `${fmt(dividend)} ÷ ${divisor} = ${fmt(quotient)} R ${remainder}`;
    const close =
      ask === "remainder" ? `The remainder is ${remainder}.` : `The quotient is ${fmt(quotient)}.`;
    steps.push(
      `No digits are left to bring down. The last subtraction left ${remainder}, which is less than ${divisor}, so it is the remainder. ${result}. ${close} Check: ${check}`,
    );
  }
  return steps;
}
