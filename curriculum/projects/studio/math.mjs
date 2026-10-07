/** Pure math engine shared by the studio and its independent verification. No eval or network. */
export const format = (n) => (Number.isInteger(n) ? String(n) : Number(n.toFixed(3)).toString());
export function number(value) {
  const s = String(value ?? "").trim();
  if (!s) return NaN;
  if (/^-?\d+\s+\d+\/\d+$/.test(s)) {
    const [whole, fraction] = s.split(/\s+/);
    const [n, d] = fraction.split("/").map(Number);
    return d ? Number(whole) + ((whole.startsWith("-") ? -1 : 1) * n) / d : NaN;
  }
  if (/^-?\d+(?:\.\d+)?\s*\/\s*\d+(?:\.\d+)?$/.test(s)) {
    const [n, d] = s.split("/").map(Number);
    return d ? n / d : NaN;
  }
  return /^-?(?:\d+\.?\d*|\.\d+)$/.test(s) ? Number(s) : NaN;
}
export function matches(raw, answer) {
  const value = number(raw);
  return Number.isFinite(value) && Math.abs(value - answer) <= 0.011;
}
const field = (key, label, min = 0.5, max = 1000, integer = false) => ({
  key,
  label,
  min,
  max,
  integer,
});
const check = (id, prompt, answer, unit, hint, reason) => ({
  id,
  prompt,
  answer,
  unit,
  hint,
  reason,
});
const median = (a) =>
  a.length % 2 ? a[(a.length - 1) / 2] : (a[a.length / 2 - 1] + a[a.length / 2]) / 2;
export const FAMILY = {
  division: {
    label: "Division that means something",
    standards: ["6.NOS.1", "6.NOS.2", "6.NOS.3"],
    vocab: [
      ["Quotient", "cociente", "The number of groups or the size of each group."],
      ["Remainder", "residuo", "The amount left after making whole groups."],
    ],
    fields: [
      field("a", "People or pieces to organize", 12, 999, true),
      field("b", "Capacity of one group", 2, 60, true),
      field("c", "Supply budget ($)", 10, 500),
      field("d", "Price per supply pack ($)", 0.25, 20),
      field("e", "Material length (m)", 1, 50),
      field("f", "Length of each cut piece (m)", 0.125, 5),
    ],
  },
  statistics: {
    label: "Data with an honest story",
    standards: ["6.DS.1", "6.DS.3", "6.DS.4", "6.DS.5", "6.DS.6c", "6.DS.6d"],
    vocab: [
      ["Mean", "media", "The sum shared equally among all observations."],
      ["Variation", "variación", "How the observations differ."],
    ],
    fields: [
      {
        key: "data",
        label: "Six to twelve simulated observations, separated by commas",
        text: true,
      },
    ],
  },
  ratio: {
    label: "Ratios and fair comparisons",
    standards: ["6.AT.1", "6.AT.2", "6.AT.3a"],
    vocab: [
      [
        "Equivalent",
        "equivalente",
        "Ratios formed by multiplying both quantities by the same factor.",
      ],
      ["Unit rate", "tasa unitaria", "An amount for one unit of another quantity."],
    ],
    fields: [
      field("a", "Amount A in the base ratio", 1, 40, true),
      field("b", "Amount B in the base ratio", 1, 20, true),
      field("c", "Scale factor", 2, 20, true),
      field("d", "Offer A: total cost ($)", 1, 200),
      field("e", "Offer A: quantity (same units)", 1, 100),
      field("f", "Offer B: total cost ($)", 1, 200),
      field("g", "Offer B: quantity (same units)", 1, 100),
    ],
  },
  percent: {
    label: "Make the percent visible",
    standards: ["6.AT.4", "6.AT.2"],
    vocab: [
      ["Percent", "porcentaje", "An amount for each hundred."],
      ["Base", "base", "The whole amount to which a percent applies."],
    ],
    fields: [
      field("a", "Original price ($)", 5, 200),
      field("b", "Discount (%)", 5, 75, true),
      field("c", "Simulated tax rate (%)", 0, 10),
      field("d", "Customer budget ($)", 5, 300),
    ],
  },
  area: {
    label: "Design with area and volume",
    standards: ["6.GR.1", "6.GR.2", "6.GR.4"],
    vocab: [
      [
        "Perpendicular height",
        "altura perpendicular",
        "The distance from the base at a right angle.",
      ],
      ["Net", "desarrollo plano", "The flat faces that fold into a solid."],
    ],
    fields: [
      field("a", "Rectangular floor length (m)", 2, 15),
      field("b", "Rectangular floor width (m)", 2, 12),
      field("c", "Triangular nook base (m)", 1, 10),
      field("d", "Triangular nook height (m)", 1, 8),
      field("e", "Flooring cost ($ per m²)", 1, 30),
      field("f", "Storage box length (m)", 0.5, 4),
      field("g", "Storage box width (m)", 0.5, 3),
      field("h", "Storage box height (m)", 0.5, 3),
    ],
  },
  expressions: {
    label: "Write a rule and prove it",
    standards: ["6.AT.5", "6.AT.6a", "6.AT.6c", "6.AT.7"],
    vocab: [
      ["Coefficient", "coeficiente", "A number multiplying a variable."],
      [
        "Equivalent expressions",
        "expresiones equivalentes",
        "Expressions with the same value for every allowed input.",
      ],
    ],
    fields: [
      field("a", "Multiplier for each group (a)", 1, 12, true),
      field("b", "Extra units inside each group (b)", 1, 12, true),
      field("c", "Input value (x)", 1, 30, true),
      field("d", "Bonus or setup value to square (d)", 1, 6, true),
    ],
  },
  coordinates: {
    label: "Location is not distance",
    standards: ["6.NOS.6", "6.NOS.7", "6.NOS.8", "6.NOS.9"],
    vocab: [
      ["Coordinate", "coordenada", "A number describing a position on an axis."],
      ["Absolute value", "valor absoluto", "The distance from a number to zero."],
    ],
    fields: [
      field("a", "Point A: x-coordinate", -10, 10, true),
      field("b", "Shared y-coordinate of A and B", -10, 10, true),
      field("c", "Point B: x-coordinate", -10, 10, true),
    ],
  },
  equations: {
    label: "Solve, check, and show a solution set",
    standards: ["6.AT.8", "6.AT.9"],
    vocab: [
      ["Solution", "solución", "A value that makes a statement true."],
      ["At least", "por lo menos", "The boundary value is included."],
    ],
    fields: [
      field("a", "Secret value or target (s)", 2, 30, true),
      field("b", "Amount added to the unknown (b)", 1, 20, true),
      field("c", "Multiplier of the unknown (c)", 2, 12, true),
    ],
  },
  relationships: {
    label: "One rule, three representations",
    standards: ["6.AT.11"],
    vocab: [
      ["Independent variable", "variable independiente", "The input you choose."],
      ["Dependent variable", "variable dependiente", "The output determined by the input."],
    ],
    fields: [
      field("a", "Rate per input unit (r)", 1, 30),
      field("b", "Starting amount or fixed fee (b)", 0, 100),
      field("c", "Input value to investigate (x)", 2, 20, true),
    ],
  },
  solids: {
    label: "Space inside, material outside",
    standards: ["6.GR.2", "6.GR.4"],
    vocab: [
      ["Volume", "volumen", "The space inside, measured in cubic units."],
      [
        "Surface area",
        "área de superficie",
        "The area of the outside faces, measured in square units.",
      ],
    ],
    fields: [
      field("a", "Length (model units)", 1, 12),
      field("b", "Width (model units)", 1, 12),
      field("c", "Height (model units)", 0.5, 12),
      field("d", "Material cost ($ per square unit)", 0.5, 20),
      field("e", "Minimum capacity (cubic units)", 1, 1000),
    ],
  },
  discovery: {
    label: "Notice, represent, and explain",
    standards: ["MPP.3", "MPP.4", "MPP.7"],
    vocab: [
      ["Pattern", "patrón", "A structure you can describe and continue."],
      ["Strategy", "estrategia", "A way to solve and explain a problem."],
    ],
    fields: [
      field("a", "Tiles added at each new stage", 2, 10, true),
      field("b", "Extra tiles that always stay", 1, 10, true),
      field("c", "Stage to investigate", 4, 12, true),
    ],
  },
  synthesis: {
    label: "Connect the mathematics",
    standards: ["6.GR.1", "6.AT.4", "6.AT.11"],
    vocab: [
      ["Constraint", "restricción", "A condition the design must meet."],
      ["Tradeoff", "ventaja y desventaja", "What you gain and give up when choosing a design."],
    ],
    fields: [
      field("a", "Pop-up length (m)", 2, 15),
      field("b", "Pop-up width (m)", 2, 12),
      field("c", "Material cost ($ per m²)", 1, 20),
      field("d", "Material discount (%)", 5, 50),
      field("e", "Supply cost per visitor ($)", 1, 10),
      field("f", "Number of visitors", 5, 80, true),
    ],
  },
};
export function model(project, raw) {
  const family = FAMILY[project.family];
  const errors = [];
  const v = {};
  for (const f of family.fields) {
    if (f.text) {
      const parts = String(raw[f.key] ?? "").split(",");
      const data = parts.map(number);
      if (
        data.length < 6 ||
        data.length > 12 ||
        data.some((n) => !Number.isFinite(n) || Math.abs(n) > 1000)
      )
        errors.push("Enter 6–12 numbers between −1,000 and 1,000, with a comma between each.");
      else v.data = data;
      continue;
    }
    const n = number(raw[f.key]);
    if (!Number.isFinite(n) || n < f.min || n > f.max || (f.integer && !Number.isInteger(n)))
      errors.push(
        `${f.label}: use ${f.integer ? "a whole number" : "a number"} from ${f.min} to ${f.max}.`,
      );
    else v[f.key] = n;
  }
  if (errors.length) return { errors, checks: [], visual: null };
  const { a, b, c, d, e, f, g, h } = v;
  let checks = [],
    visual,
    rule,
    decision;
  const q = (...args) => checks.push(check(...args));
  switch (project.family) {
    case "division": {
      const full = Math.floor(a / b),
        rem = a % b,
        packs = Math.floor((c + 1e-9) / d),
        pieces = Math.floor((e + 1e-9) / f);
      q(
        "groups",
        `Organize ${a} into groups holding ${b}. How many groups are needed for ALL of them?`,
        Math.ceil(a / b),
        "groups",
        "Find the whole quotient and ask whether the remainder needs another group.",
        "Every person or item must fit, including a partial final group.",
      );
      q(
        "remainder",
        "How many are in the final partial group? Enter 0 if the division is exact.",
        rem,
        "people or pieces",
        "Multiply full groups by capacity; subtract from the total.",
        "A remainder describes what is left, not an extra full group.",
      );
      q(
        "packs",
        `How many COMPLETE $${format(d)} packs fit inside $${format(c)}?`,
        packs,
        "packs",
        "Use equivalent division to remove decimals, then keep only affordable whole packs.",
        "Here the quotient rounds down because a partial pack is not sold.",
      );
      q(
        "money",
        "How much money remains after buying those complete packs?",
        c - packs * d,
        "dollars",
        "Budget − (whole packs × price).",
        "Multiplication and subtraction check your decimal division.",
      );
      q(
        "quotient",
        `What is ${format(e)} ÷ ${format(f)}? Give the exact quotient or round to hundredths.`,
        e / f,
        "piece lengths",
        "Draw equal lengths or multiply by the reciprocal.",
        "The quotient may count a fraction of a piece; the cut list can use only full pieces.",
      );
      q(
        "leftover",
        "How much material remains after cutting all the full pieces?",
        e - pieces * f,
        "meters",
        "Total length − (number of full pieces × piece length).",
        "Keep the leftover in length units.",
      );
      rule = `${a} ÷ ${b}; $${format(c)} ÷ $${format(d)}; ${format(e)} m ÷ ${format(f)} m`;
      decision =
        "Explain why seating rounds up, purchases round down, and a material quotient can be fractional.";
      visual = { type: "groups", values: [full, rem], labels: ["Full groups", "In partial group"] };
      break;
    }
    case "statistics": {
      const sorted = [...v.data].sort((x, y) => x - y),
        n = sorted.length,
        mean = sorted.reduce((x, y) => x + y, 0) / n,
        mid = Math.floor(n / 2),
        lower = sorted.slice(0, mid),
        upper = sorted.slice(n % 2 ? mid + 1 : mid),
        q1 = median(lower),
        q3 = median(upper);
      q(
        "mean",
        "What is the mean of this sample?",
        mean,
        "units",
        "Add all observations; divide by the number of observations.",
        "Every observation contributes to the mean.",
      );
      q(
        "median",
        "What is the median?",
        median(sorted),
        "units",
        "Sort first. For an even count, average the two middle observations.",
        "Use positions in the sorted list, not the middle of the range.",
      );
      q(
        "range",
        "What is the range?",
        sorted.at(-1) - sorted[0],
        "units",
        "Subtract the smallest observation from the largest.",
        "Range measures total spread.",
      );
      q(
        "mad",
        "What is the mean absolute deviation (MAD)?",
        sorted.reduce((t, x) => t + Math.abs(x - mean), 0) / n,
        "units",
        "Find each distance from the mean, add these distances, and divide by the count.",
        "Distances are nonnegative, so deviations do not cancel.",
      );
      q(
        "q1",
        "What is the first quartile (Q1)?",
        q1,
        "units",
        "Find the median of the lower half. For odd counts, leave out the overall median.",
        "Use the same quartile convention for both halves.",
      );
      q(
        "iqr",
        "What is the interquartile range (IQR)?",
        q3 - q1,
        "units",
        "Find Q3 from the upper half, then calculate Q3 − Q1.",
        "IQR describes the spread of the middle half.",
      );
      rule = `${n} simulated observations; units follow your chosen context`;
      decision =
        "Choose a useful measure of center, describe the spread, and name a limitation. A sample does not represent everyone automatically.";
      visual = { type: "dots", values: sorted, labels: [] };
      break;
    }
    case "ratio": {
      const sport = project.id === "unit-3-b";
      q(
        "scale-a",
        `Scale ${a} : ${b} by ${c}. What is the new first quantity?`,
        a * c,
        sport ? "points" : "parts of A",
        "Multiply the FIRST quantity by the scale factor.",
        "Both quantities must use the same multiplier.",
      );
      q(
        "scale-b",
        "What is the new second quantity?",
        b * c,
        sport ? "games" : "parts of B",
        "Multiply the SECOND quantity by the same factor.",
        "Adding the same number to each part does not preserve a ratio.",
      );
      q(
        "base-rate",
        `How much of A corresponds to ONE of B in ${a} : ${b}?`,
        a / b,
        "A per B",
        "Divide A by B. Write the units in that order.",
        "The order of a unit rate matters.",
      );
      q(
        "rate-a",
        sport
          ? "Player A: total points divided by games. What is the unit rate?"
          : "What is Offer A’s cost per unit?",
        d / e,
        sport ? "points/game" : "dollars/unit",
        "Divide the first offer’s total by its quantity.",
        "Compare on one common unit.",
      );
      q(
        "rate-b",
        sport ? "Player B: what is the unit rate?" : "What is Offer B’s cost per unit?",
        f / g,
        sport ? "points/game" : "dollars/unit",
        "Use the same division order for both comparisons.",
        "Total amount alone is not a fair comparison.",
      );
      q(
        "difference",
        "How far apart are the two unit rates?",
        Math.abs(d / e - f / g),
        sport ? "points/game" : "dollars/unit",
        "Subtract the smaller unit rate from the larger.",
        "State which option you recommend; context determines whether higher or lower is useful.",
      );
      rule = `${a} : ${b} → (${a} × ${c}) : (${b} × ${c})`;
      decision = sport
        ? "Compare performance per game. Explain why the constant-rate season prediction may not happen."
        : "Recommend a purchase using unit price and explain what the comparison assumes about quality and units.";
      visual = {
        type: "ratio",
        values: [a, b, a * c, b * c],
        labels: ["Base A", "Base B", "Scaled A", "Scaled B"],
      };
      break;
    }
    case "percent": {
      const discount = (a * b) / 100,
        sale = a - discount,
        tax = Math.round(((sale * c) / 100 + Number.EPSILON) * 100) / 100,
        total = Math.round((sale + tax + Number.EPSILON) * 100) / 100;
      q(
        "decimal",
        `Write ${b}% as a decimal.`,
        b / 100,
        "",
        "Percent means per hundred.",
        "Divide the percent by 100.",
      );
      q(
        "discount",
        "How many dollars does the discount remove?",
        discount,
        "dollars",
        "Multiply the original price by the decimal form of the discount.",
        "The discount amount is different from the sale price.",
      );
      q(
        "sale",
        "What is the sale price before tax?",
        sale,
        "dollars",
        "Subtract the discount amount from the original price.",
        "The remaining percent is 100% minus the discount.",
      );
      q(
        "tax",
        `Find ${c}% simulated tax on the SALE price. Round tax to cents.`,
        tax,
        "dollars",
        "The tax base in this classroom model is the discounted price.",
        "Use the stated classroom rate; it is not a claim about local tax law.",
      );
      q(
        "total",
        "What is the final receipt total? Round to cents.",
        total,
        "dollars",
        "Add the rounded tax to the sale price.",
        "A receipt must include both parts.",
      );
      q(
        "budget",
        "What is budget minus final total? A negative result means over budget.",
        d - total,
        "dollars",
        "Subtract total cost from the budget.",
        "Explain whether the design is affordable in this model.",
      );
      rule = `$${a} with ${b}% off, then ${c}% simulated tax`;
      decision =
        "Use the receipt and percent model to defend the offer; decide whether it fits the stated budget.";
      visual = { type: "percent", values: [b, 100 - b], labels: ["Discount", "Remaining price"] };
      break;
    }
    case "area": {
      const rect = a * b,
        tri = (c * d) / 2,
        volume = f * g * h,
        sa = 2 * (f * g + f * h + g * h);
      q(
        "rectangle",
        "Find the area of the rectangular main floor.",
        rect,
        "m²",
        "Multiply length by width.",
        "Area counts square units.",
      );
      q(
        "triangle",
        "Find the area of the non-overlapping triangular nook.",
        tri,
        "m²",
        "Use half of base × perpendicular height.",
        "The triangle is half of a matching parallelogram.",
      );
      q(
        "composite",
        "What is the combined floor area?",
        rect + tri,
        "m²",
        "Add the two non-overlapping areas.",
        "Do not count shared edges or count an area twice.",
      );
      q(
        "floor-cost",
        "What is the flooring cost for that combined area?",
        (rect + tri) * e,
        "dollars",
        "Multiply square meters by dollars per square meter.",
        "This estimate excludes labor and offcuts; name those limits.",
      );
      q(
        "volume",
        "Find the volume of the storage box.",
        volume,
        "m³",
        "Multiply the box’s length, width and height.",
        "Volume counts cubic units, not floor squares.",
      );
      q(
        "surface",
        "Find the total area of the CLOSED storage box net.",
        sa,
        "m²",
        "There are two faces of each size: length×width, length×height, width×height.",
        "Include all six faces.",
      );
      rule = `Floor: ${a} × ${b} + ½ × ${c} × ${d}; storage: ${f} × ${g} × ${h}`;
      decision =
        "Defend the use of space and cost. Compare floor area, storage capacity and material area without mixing units.";
      visual = { type: "area", values: [a, b, c, d], labels: [] };
      break;
    }
    case "expressions": {
      const bonus = d ** 2;
      q(
        "square",
        `Evaluate ${d}².`,
        bonus,
        "",
        "An exponent repeats multiplication of the base.",
        "Squaring is not multiplying by two.",
      );
      q(
        "inside",
        `For x = ${c}, evaluate x + ${b}.`,
        c + b,
        "units",
        "Substitute the input, then finish the parentheses.",
        "Parentheses identify the group multiplied as a whole.",
      );
      q(
        "value",
        `Evaluate ${a}(x + ${b}) + ${d}² when x = ${c}.`,
        a * (c + b) + bonus,
        "units",
        "Parentheses, exponent, multiplication, then addition.",
        "Show your order of operations.",
      );
      q(
        "coefficient",
        `Expand ${a}(x + ${b}). What is the coefficient of x?`,
        a,
        "",
        "Distribute the multiplier to each term inside the parentheses.",
        "The coefficient multiplies the variable.",
      );
      q(
        "constant",
        "After expanding the WHOLE rule and evaluating the square, what is the constant term?",
        a * b + bonus,
        "units",
        "The constant combines the distributed fixed amount and the square.",
        "Do not forget the second term inside the parentheses.",
      );
      q(
        "new-input",
        `Use the expanded form at x = ${c + 1}. What is its value?`,
        a * (c + 1 + b) + bonus,
        "units",
        "Use ax + ab + d² with the new input.",
        "A successful example checks a case; the distributive property proves equivalence for all inputs.",
      );
      rule = `${a}(x + ${b}) + ${d}² = ${a}x + ${a} × ${b} + ${d}²`;
      decision =
        "Explain why the two expressions are equivalent for all inputs, not just the tested ones.";
      visual = { type: "rule", values: [a, b, c, d], labels: [] };
      break;
    }
    case "coordinates": {
      q(
        "distance",
        `A = (${a}, ${b}) and B = (${c}, ${b}). What is their horizontal distance?`,
        Math.abs(c - a),
        "units",
        "Find the nonnegative difference of the x-coordinates; y stays the same.",
        "Distance cannot be negative.",
      );
      q(
        "a-zero",
        `How far is A’s x-coordinate, ${a}, from zero?`,
        Math.abs(a),
        "units",
        "Distance from zero is absolute value.",
        "A negative coordinate can have a large distance from zero.",
      );
      q(
        "reflect-x",
        "Reflect A across the y-axis. What is the new x-coordinate?",
        -a,
        "",
        "Across the y-axis, left and right switch.",
        "The x-coordinate changes sign.",
      );
      q(
        "reflect-y",
        "Reflect A across the x-axis. What is the new y-coordinate?",
        -b,
        "",
        "Across the x-axis, above and below switch.",
        "The y-coordinate changes sign.",
      );
      q(
        "opposite",
        "How far apart are A and its reflection across the x-axis?",
        2 * Math.abs(b),
        "units",
        "Count the distance from A to the axis, then from the axis to the reflection.",
        "The reflected point has the same x-coordinate.",
      );
      q(
        "compare",
        `Which is larger: ${a} or ${c}? Enter the larger signed number.`,
        Math.max(a, c),
        "",
        "The number farther right on a number line is larger.",
        "Order compares signed values, not their absolute values.",
      );
      rule = `A(${a}, ${b}) → B(${c}, ${b}); same y, horizontal route`;
      decision =
        "Use the map to explain why coordinate order, signed values and distances answer different questions.";
      visual = { type: "coordinates", values: [a, b, c], labels: [] };
      break;
    }
    case "equations": {
      q(
        "addition",
        `Solve x + ${b} = ${a + b}.`,
        a,
        "",
        "Undo addition by subtracting the same amount from both sides.",
        "An equation stays balanced when the same operation is applied to both sides.",
      );
      q(
        "multiplication",
        `Solve ${c}x = ${c * a}.`,
        a,
        "",
        "Divide both sides by the coefficient.",
        "Check that multiplication returns the original right-hand side.",
      );
      q(
        "substitution",
        `Substitute your solution into x + ${b}. What is the left-hand value?`,
        a + b,
        "",
        "Replace x with your proposed solution.",
        "A solution makes the two sides equal.",
      );
      q(
        "boundary",
        `The gate allows n ≥ ${a}. What is the smallest allowed WHOLE number?`,
        a,
        "",
        "“At least” includes the boundary.",
        "Draw a closed circle and shade toward greater numbers.",
      );
      q(
        "strict",
        `A second gate allows n > ${a}. What is the smallest allowed WHOLE number?`,
        a + 1,
        "",
        "“Greater than” excludes the boundary.",
        "The whole-number condition matters: real numbers have no smallest value above the boundary.",
      );
      q(
        "difference",
        `A player proposes x = ${a + 1} for ${c}x = ${c * a}. By how much does the left side exceed the right?`,
        c,
        "",
        "Substitute the proposed value before deciding if it works.",
        "A near answer is not a solution.",
      );
      rule = `x + ${b} = ${a + b}; ${c}x = ${c * a}; n ≥ ${a}`;
      decision =
        "Explain one equation solution and several inequality solutions. Use a boundary example to distinguish > from ≥.";
      visual = { type: "numberline", values: [a], labels: [] };
      break;
    }
    case "relationships": {
      q(
        "zero",
        `For y = ${a}x + ${b}, find y when x = 0.`,
        b,
        "output units",
        "Substitute zero. The variable term becomes zero.",
        "This point shows the starting value.",
      );
      q(
        "one",
        "Find y when x = 1.",
        a + b,
        "output units",
        "Use the same rule with one input unit.",
        "Label both coordinates.",
      );
      q(
        "two",
        "Find y when x = 2.",
        2 * a + b,
        "output units",
        "Multiply the rate by two, then add the starting amount.",
        "Table rows must use the same equation.",
      );
      q(
        "target",
        `Find y when x = ${c}.`,
        a * c + b,
        "output units",
        "Multiply before adding.",
        "This is a model prediction at the selected input.",
      );
      q(
        "increase",
        "How much does y increase when x increases by 1?",
        a,
        "output units",
        "Compare consecutive rows.",
        "The rate is the repeated change, not the initial amount.",
      );
      q(
        "delta",
        `How much does y change between x = 2 and x = ${c}?`,
        a * (c - 2),
        "output units",
        "Find both outputs and subtract; the fixed starting amount cancels.",
        "Compare at equal input differences.",
      );
      rule = `y = ${a}x + ${b}`;
      decision =
        "Name both variables, connect equation/table/graph, and explain whether the graph starts at the origin.";
      visual = { type: "line", values: [a, b, c], labels: [] };
      break;
    }
    case "solids": {
      const open = project.id === "unit-10-b",
        floor = a * b,
        volume = floor * c,
        sa = (open ? 1 : 2) * floor + 2 * a * c + 2 * b * c;
      q(
        "floor",
        "What is the base area?",
        floor,
        "square units",
        "Multiply length by width.",
        "This is one face, not the entire outside.",
      );
      q(
        "volume",
        "What is the interior volume of the ideal model?",
        volume,
        "cubic units",
        "Multiply base area by height.",
        "This model ignores wall thickness; say so.",
      );
      q(
        "pair",
        "What is the combined area of the two length-by-height side faces?",
        2 * a * c,
        "square units",
        "Find one length×height face, then double it.",
        "Opposite faces form equal pairs.",
      );
      q(
        "surface",
        `What is the total material area of this ${open ? "OPEN-TOP (five-face)" : "CLOSED (six-face)"} model?`,
        sa,
        "square units",
        open ? "Use one base and four side faces." : "Use two bases and four side faces.",
        "Draw the net and count the faces.",
      );
      q(
        "cost",
        "What is the model’s material cost?",
        sa * d,
        "dollars",
        "Multiply material area by cost per square unit.",
        "Capacity does not determine material cost by itself.",
      );
      q(
        "capacity",
        "What is volume minus minimum capacity? A negative number means the target is missed.",
        volume - e,
        "cubic units",
        "Compare the calculated volume with the target.",
        "A design can be calculated correctly and still fail its constraint.",
      );
      rule = `${format(a)} × ${format(b)} × ${format(c)}; ${open ? "5 faces, open top" : "6 faces, closed box"}`;
      decision =
        "Accept or revise the design using its capacity and cost. A correct calculation does not automatically make a successful design.";
      visual = { type: "box", values: [a, b, c, open ? 1 : 0], labels: [] };
      break;
    }
    case "discovery": {
      for (const [id, n] of [
        ["one", 1],
        ["two", 2],
        ["three", 3],
        ["target", c],
      ])
        q(
          id,
          `Stage ${n} has ${n} groups of ${a} tiles and ${b} extra tiles. How many tiles?`,
          n * a + b,
          "tiles",
          "Count groups first, then count the extra tiles.",
          "Explain your count with a drawing, words or an equation.",
        );
      q(
        "change",
        "How many new tiles are added from one stage to the next?",
        a,
        "tiles",
        "Compare neighboring stages and describe what changes.",
        "The extra tiles stay constant.",
      );
      q(
        "repair",
        `Someone counts stage ${c} as ${a} groups of (${c} + ${b}). How many tiles would that mistaken method count?`,
        a * (c + b),
        "tiles",
        "Calculate their interpretation, then compare it with your drawing.",
        "A convincing explanation identifies which tiles were counted too many times.",
      );
      rule = `At each stage: ${a} tiles per group, plus ${b} extra tiles`;
      decision =
        "Show two valid counting strategies. Use a drawing to explain why the extra tiles are added only once.";
      visual = { type: "pattern", values: [a, b, 3], labels: [] };
      break;
    }
    case "synthesis": {
      const area = a * b,
        subtotal = area * c,
        discount = (subtotal * d) / 100,
        materials = subtotal - discount;
      q(
        "area",
        "What is the pop-up floor area?",
        area,
        "m²",
        "Multiply length by width.",
        "Use square units.",
      );
      q(
        "subtotal",
        "What is the material cost before the discount?",
        subtotal,
        "dollars",
        "Multiply area by cost per square meter.",
        "Units help connect the geometry with the budget.",
      );
      q(
        "discount",
        `How much is the ${d}% discount?`,
        discount,
        "dollars",
        "Take the stated fraction of the material subtotal.",
        "The visitor supplies are not discounted in this model.",
      );
      q(
        "materials",
        "What is the discounted material cost?",
        materials,
        "dollars",
        "Subtract the discount from the material subtotal.",
        "This becomes the fixed amount in the total-cost rule.",
      );
      q(
        "total",
        `Each visitor needs $${e} of supplies. What is the total for ${f} visitors?`,
        materials + e * f,
        "dollars",
        "Add discounted materials and the variable visitor cost.",
        "Use y = fixed amount + rate × visitors.",
      );
      q(
        "extra",
        "How much does the cost increase for 10 additional visitors?",
        10 * e,
        "dollars",
        "The floor stays fixed; only visitor supplies increase.",
        "Separate fixed and variable quantities.",
      );
      rule = `Floor ${a} × ${b}; materials ${d}% off; total y = ${format(materials)} + ${e}x`;
      decision =
        "Defend the whole proposal using at least two connected math ideas and name one cost the model excludes.";
      visual = { type: "line", values: [e, materials, f], labels: [] };
      break;
    }
  }
  if (project.family === "ratio" && project.id === "unit-3-b")
    rule += "; performance comparisons use points per game";
  return { errors, checks, visual, rule, decision, values: v };
}
export function fieldsFor(project) {
  const fields = FAMILY[project.family].fields.map((f) => ({ ...f }));
  if (project.id === "unit-3-b")
    for (const f of fields) {
      const names = {
        a: "Base points scored",
        b: "Base games played",
        c: "Number of equal game blocks",
        d: "Player A: total points",
        e: "Player A: games",
        f: "Player B: total points",
        g: "Player B: games",
      };
      f.label = names[f.key];
    }
  return fields;
}

/** Separate-number worked examples: supports teach a strategy without filling the student's work. */
export const WORKED_EXAMPLES = {
  division:
    "52 people, 10 seats per group: 52 ÷ 10 = 5 remainder 2. Five groups seat only 50 people, so plan for 6 groups. For a $19 budget and $4 packs, 19 ÷ 4 = 4 remainder 3: buy 4 complete packs and keep $3. What the remainder means decides how you use it.",
  statistics:
    "Practice data: 2, 4, 6, 8, 10, 12. The sum is 42, so the mean is 42 ÷ 6 = 7. The middle pair is 6 and 8, so the median is 7. Distances from the mean are 5, 3, 1, 1, 3, 5; their mean is 18 ÷ 6 = 3 (the MAD).",
  ratio:
    "A recipe uses 2 cups of A for 3 cups of B. Four batches use 8 cups of A and 12 cups of B because BOTH quantities are multiplied by 4. An $18 package holding 6 equal units costs 18 ÷ 6 = $3 per unit.",
  percent:
    "For a $50 item with 10% off: 10% = 0.10, and 0.10 × 50 = $5 off. The sale price is $45. At a simulated 4% tax rate, tax is 0.04 × 45 = $1.80, so the total is $46.80.",
  area: "A 4 m by 3 m rectangle has area 12 m². A separate triangle with base 2 m and perpendicular height 3 m has area ½ × 2 × 3 = 3 m². Together, without overlap, the area is 15 m². A 2 m by 1 m by 1 m box has volume 2 m³ and surface area 2(2 + 2 + 1) = 10 m².",
  expressions:
    "For 2(x + 3) + 4² when x = 1: first 1 + 3 = 4, and 4² = 16. Then 2 × 4 + 16 = 24. Distributing gives 2x + 6 + 16 = 2x + 22, which also gives 24. The distributive property explains why both rules agree for every x.",
  coordinates:
    "A(−2, 4) and B(3, 4) share y = 4. Their horizontal distance is 2 + 3 = 5 units. Reflect A across the y-axis to get (2, 4); reflect A across the x-axis to get (−2, −4). Distances are nonnegative, even when coordinates are negative.",
  equations:
    "For x + 3 = 11, subtract 3 from both sides: x = 8. Check: 8 + 3 = 11. For 2x = 16, divide both sides by 2: x = 8. The inequality n ≥ 8 includes 8 and every greater value; n > 8 excludes 8.",
  relationships:
    "For y = 3x + 2, the starting value is 2 and the output increases by 3 for each input unit. A table contains (0, 2), (1, 5), (2, 8), (3, 11). Plot those pairs; each is a point on the same rule.",
  solids:
    "A closed 2 by 3 by 4 prism has volume 2 × 3 × 4 = 24 cubic units. Its face pairs have areas 6, 8 and 12, so surface area is 2(6 + 8 + 12) = 52 square units. Remove the 2 by 3 top and the open-top area is 52 − 6 = 46 square units.",
  discovery:
    "Suppose each stage has groups of 2 tiles and 1 extra tile. Stage 3 has 2 + 2 + 2 + 1 = 7 tiles. You can count all seven, or count three groups of two and then add the single extra tile. Both ways describe the same picture.",
  synthesis:
    "A 3 m by 2 m floor has area 6 m². At $10 per m², materials cost $60. A 10% discount removes $6, leaving $54. If visitor supplies cost $2 each, the total rule is y = 54 + 2x. For 10 visitors, the total is $74.",
};

export function workedExampleFor(project) {
  if (project.id === "unit-3-b")
    return "A player scores 6 points in 2 games (6 : 2). In 4 equal game blocks, they project to 24 points in 8 games because BOTH quantities are multiplied by 4. If Player A scores 84 points in 6 games, their rate is 84 ÷ 6 = 14 points per game.";
  return WORKED_EXAMPLES[project.family];
}
