import { celebrate, el, esc, sectionHeading } from "./small-group-ui.js";

const check = (title, action, connect, frame) => ({ title, action, connect, frame });

// Every Group 2 lesson gets the check mathematicians actually use for that topic.
// These are process prompts, not answer keys: students still do and record the work.
export const MATH_CHECKS = {
  "6-13": check(
    "Prime Factor",
    "Multiply the prime factors. Confirm that the product is the original number and that every factor is prime.",
    "How does your factor check match the original number?",
    "My factors work because ___ × ___ = ___, and each factor is prime.",
  ),
  "6-7": check(
    "GCF",
    "List the factors the numbers share. Confirm that your answer is the greatest number on the shared list.",
    "What can the GCF represent in this problem?",
    "The shared factors are ___. The greatest one is ___, so ___.",
  ),
  "6-12": check(
    "LCM",
    "List multiples for both numbers. Find the first multiple that appears on both lists.",
    "What does the first shared multiple mean in this problem?",
    "The first shared multiple is ___. This means ___.",
  ),
  "2-6": check(
    "Division",
    "Multiply the quotient by the divisor, then add the remainder. The result should equal the dividend, and the remainder must be less than the divisor.",
    "What do the quotient and remainder mean here?",
    "___ × ___ + ___ = ___. The quotient means ___ and the remainder means ___.",
  ),
  "2-11": check(
    "Decimal Place-Value",
    "Estimate first. Then check that decimal points and matching place values are lined up in every step.",
    "Is your exact answer reasonable compared with your estimate?",
    "I estimated ___. My exact answer ___ is reasonable because ___.",
  ),
  "2-12": check(
    "Decimal Product",
    "Estimate with nearby whole numbers, then compare the size of your exact product with the estimate.",
    "Why is the decimal point in a reasonable place?",
    "I estimated ___ × ___ ≈ ___. My product ___ makes sense because ___.",
  ),
  "2-7": check(
    "Decimal Quotient",
    "Multiply the quotient by the original divisor. Account for any remainder and check that you return to the dividend.",
    "What does the quotient mean in the situation?",
    "___ × ___ = ___, so my quotient means ___.",
  ),
  "6-1": check(
    "Fraction-Division Model",
    "Use your model to count how many divisor-size groups fit in the dividend. Then multiply the group count by the divisor.",
    "What does one whole group look like in your model?",
    "My model shows ___ groups of ___. Multiplying back gives ___.",
  ),
  "6-9": check(
    "Whole ÷ Fraction",
    "Multiply your quotient by the fraction divisor. You should get the original whole number.",
    "What is being counted by the quotient?",
    "There are ___ groups of ___ in ___. I checked: ___ × ___ = ___.",
  ),
  "6-2": check(
    "Fraction Quotient",
    "Multiply your quotient by the original divisor and simplify. The result should equal the dividend.",
    "How does multiplying back check the division?",
    "My quotient is ___ because ___ × ___ = ___.",
  ),
  "6-10": check(
    "Mixed-Number Quotient",
    "Check each mixed number was changed to an equivalent improper fraction, then multiply the quotient by the original divisor.",
    "What quantity does the quotient describe?",
    "___ is equivalent to ___. Multiplying back gives ___, so ___.",
  ),
  "6-11": check(
    "Fraction-Division Situation",
    "Label the units in your equation. Multiply the quotient by the divisor and check that both the number and units return to the starting amount.",
    "What does the quotient mean in the story?",
    "The quotient ___ means ___. My check is ___ × ___ = ___.",
  ),
  "3-1": check(
    "Ratio Order",
    "Name both quantities and units. Check that every ratio keeps them in the same order.",
    "What comparison does your ratio describe?",
    "The ratio of ___ to ___ is ___. It compares ___ with ___.",
  ),
  "3-3": check(
    "Ratio Table",
    "Find the scale factor between rows. Confirm that both quantities were multiplied or divided by the same factor.",
    "What stays constant in every row?",
    "Both quantities change by a factor of ___. The ratio stays ___.",
  ),
  "3-4": check(
    "Ratio Graph",
    "Match each plotted point to one row of the ratio table. Check the first quantity is on the x-axis and the second is on the y-axis.",
    "What pattern do the points show?",
    "The point (___, ___) matches the table because ___. The graph shows ___.",
  ),
  "3-9": check(
    "Equivalent Ratio",
    "Use one common scale factor or compare cross products. Both parts of the ratios must agree.",
    "How do you know the two ratios describe the same comparison?",
    "Both parts scale by ___. Therefore, ___ and ___ are equivalent ratios.",
  ),
  "3-5": check(
    "Ratio Comparison",
    "Find both unit rates using the same units, then compare the two per-one values.",
    "Which option is greater or better, and what does that rate mean?",
    "___ has the ___ unit rate: ___ per ___. Therefore, ___.",
  ),
  "3-6": check(
    "Scale",
    "Identify the scale factor. Apply it to every related quantity and check the ratios remain equivalent.",
    "How did scaling change the quantities without changing the ratio?",
    "I multiplied/divided both quantities by ___. The new ratio is ___, so ___.",
  ),
  "3-7": check(
    "Unit Rate",
    "Divide to find the amount for 1 unit, then multiply the unit rate to rebuild one original pair.",
    "What does the per-one rate tell you in the situation?",
    "The unit rate is ___ per ___. Multiplying by ___ returns ___.",
  ),
  "3-2": check(
    "Unit Price",
    "Find each price for one item, then multiply the chosen unit price by its quantity to recover the listed price.",
    "Which option is the better buy, and by how much per item?",
    "___ costs $___ per ___. It is the better buy because ___.",
  ),
  "4-2": check(
    "Fraction–Decimal–Percent",
    "Convert each form to a decimal. All three decimals should be equal.",
    "How do the three forms show the same amount?",
    "___ = ___ = ___ because each equals the decimal ___.",
  ),
  "4-1": check(
    "Percent Size",
    "Compare the percent with 1% and 100%, then translate it into a decimal or a per-100 statement.",
    "What does this percent say about the size of the quantity?",
    "___% means ___ per 100, so it is ___ than one whole.",
  ),
  "4-4": check(
    "Percent-of-a-Number",
    "Use a benchmark such as 10%, 50%, or 100% to estimate, then compare your exact result with that benchmark.",
    "Why is your percent amount reasonable?",
    "___% of ___ is about ___. My exact result ___ makes sense because ___.",
  ),
  "4-5": check(
    "Percent Money",
    "Recalculate each change in order: original price, percent change, new subtotal, then tax or tip. Keep money rounded to cents.",
    "What is the final amount, and which step changed it most?",
    "First ___ changed the price to $___. Then ___ made the final total $___.",
  ),
  "3-10": check(
    "Measurement Conversion",
    "Write the conversion factor with units. Check that the old units cancel and the new units match the question.",
    "Does the converted measurement describe the same size?",
    "I used ___ per ___. The ___ units cancel, leaving ___, so ___.",
  ),
  "3-8": check(
    "Real-World Unit Rate",
    "Put every option on the same per-one basis and use the same units before comparing.",
    "Which option meets the goal best?",
    "At ___ per ___, option ___ is better because ___.",
  ),
  "5-1": check(
    "Parallelogram Area",
    "Identify a base and its perpendicular height. Check the height is not a slanted side and label the answer in square units.",
    "How would rearranging the parallelogram make a rectangle with the same area?",
    "The base is ___ and the perpendicular height is ___. A = ___ square units.",
  ),
  "5-3": check(
    "Trapezoid Area",
    "Add the parallel bases, multiply by the perpendicular height, then take half. Check the answer has square units.",
    "How does the trapezoid formula connect to a parallelogram?",
    "The parallel bases are ___ and ___. Half of their sum times ___ gives ___.",
  ),
  "5-2": check(
    "Triangle Area",
    "Double your triangle area. It should equal base × perpendicular height for the matching parallelogram or rectangle.",
    "Why is the triangle area one-half of base × height?",
    "Twice my area is ___. That equals ___ × ___, so the triangle area is ___.",
  ),
  "5-9": check(
    "Regular Polygon Area",
    "Confirm the triangles cover the polygon with no gaps or overlaps, then add all triangle areas.",
    "How does decomposing the polygon help find its total area?",
    "I made ___ triangles. Their areas sum to ___ square units.",
  ),
  "5-4": check(
    "Composite Area",
    "Check that your pieces cover the figure exactly once. Add included pieces or subtract missing pieces, with square units.",
    "Why does your decomposition match the whole figure?",
    "I split the figure into ___. Their areas ___ give a total of ___.",
  ),
  "6-3": check(
    "Exponent",
    "Expand the power as repeated multiplication, then evaluate. The number of equal factors must match the exponent.",
    "What do the base and exponent each tell you?",
    "___^___ means ___. Its value is ___.",
  ),
  "6-4": check(
    "Substitution",
    "Replace every occurrence of the variable with its value, use parentheses, and follow the order of operations.",
    "How did the expression change after substitution?",
    "After replacing ___ with ___, the expression becomes ___ and equals ___.",
  ),
  "6-5": check(
    "Expression Translation",
    "Match each phrase to an operation and each quantity to a number or variable. Read your expression back in words.",
    "Does your expression tell the same mathematical story?",
    "The phrase ___ means the operation ___. My expression ___ represents ___.",
  ),
  "6-8": check(
    "Properties",
    "Evaluate the expression before and after rewriting it with a test value. The values should match.",
    "Which property allowed the rewrite?",
    "I used the ___ property. Both forms equal ___ when ___.",
  ),
  "6-14": check(
    "Distributive Property",
    "Expand by multiplying the outside factor by every term. Then combine like terms or factor back to the original form.",
    "How do the two forms show the same value?",
    "Distributing ___ gives ___. Factoring it back gives ___.",
  ),
  "6-6": check(
    "Equivalent Expression",
    "Simplify both expressions separately. Then substitute one value for the variable and compare the results.",
    "What makes the two expressions equivalent?",
    "Both expressions simplify to ___. When ___ = ___, both equal ___.",
  ),
  "6-15": check(
    "Like Terms",
    "Group only terms with the same variable part, add their coefficients, and check unlike terms stayed separate.",
    "What was combined, and what could not be combined?",
    "I combined ___ because ___. I kept ___ separate because ___.",
  ),
  "8-1": check(
    "Equation Model",
    "Match each number, variable, and operation to the situation. Substitute the known solution to see whether the equation is true.",
    "What does the variable represent?",
    "The variable ___ represents ___. The equation matches because ___.",
  ),
  "8-2": check(
    "Equation",
    "Take your solution and substitute it into the original equation. Simplify both sides; they must be equal.",
    "What inverse operation isolated the variable?",
    "I used ___ to undo ___. When I substitute ___, both sides equal ___.",
  ),
  "8-3": check(
    "Equation",
    "Take your solution and substitute it into the original equation. Simplify both sides; they must be equal.",
    "What inverse operation isolated the variable?",
    "I used ___ to undo ___. When I substitute ___, both sides equal ___.",
  ),
  "8-4": check(
    "Inequality Model",
    "Test one value that should fit the situation and one that should not. Check the inequality sorts them correctly.",
    "What does the inequality symbol mean in this situation?",
    "___ is a solution because ___. ___ is not a solution because ___.",
  ),
  "8-5": check(
    "Inequality Graph",
    "Check the boundary point: open circle for < or >, closed circle for ≤ or ≥. Then test one shaded value.",
    "What values does the shaded ray represent?",
    "The circle is ___ because ___. The shading shows values ___.",
  ),
  "8-6": check(
    "Inequality Solution",
    "Test one point in the shaded solution set and one point outside it in the original inequality.",
    "How do the test points confirm the graph?",
    "___ makes the inequality true, while ___ makes it false. Therefore, ___.",
  ),
  "8-7": check(
    "Situation Model",
    "Check that the equation or inequality uses the story's quantities and units. Test the solution or boundary in the original situation.",
    "What does the solution or solution set mean in context?",
    "The variable represents ___. The result ___ means ___.",
  ),
  "2-1": check(
    "Statistical Question",
    "Ask whether the question expects different answers from a group or repeated measurements. If it expects variability, it is statistical.",
    "What could vary in the answers?",
    "This question is ___ because the answers could vary in ___.",
  ),
  "2-3": check(
    "Center",
    "Order the data. For the mean, check mean × number of values = total. For median and mode, recheck positions and frequencies.",
    "Which measure describes this data best?",
    "The ___ is ___ because ___. I checked it by ___.",
  ),
  "2-9": check(
    "MAD",
    "Find each distance from the mean as a nonnegative value, then average those distances. No absolute deviation should be negative.",
    "What does the MAD say about consistency?",
    "The MAD is ___. A typical value is about ___ away from the mean, so ___.",
  ),
  "2-10": check(
    "Best Measure of Center",
    "Look for skew, gaps, clusters, and outliers. Compare how the mean and median respond before choosing.",
    "Why does your chosen measure represent the data fairly?",
    "I chose the ___ because the distribution has ___.",
  ),
  "2-4": check(
    "Box Plot",
    "Order the data and verify the minimum, Q1, median, Q3, and maximum. Each mark on the plot must match that five-number summary.",
    "What does the middle 50% of the data show?",
    "The middle 50% runs from ___ to ___. This shows ___.",
  ),
  "2-2": check(
    "Histogram",
    "Confirm every data value falls into exactly one interval and that the bar frequencies add to the total number of values.",
    "Which interval is most or least common?",
    "The interval ___ has ___ values. The bars total ___ values, so ___.",
  ),
  "2-5": check(
    "Distribution Shape",
    "Trace the distribution from left to right. Locate the peak, compare the tails, and mark any clusters or gaps.",
    "Which features support your description of the shape?",
    "The distribution is ___ because it has ___.",
  ),
  "7-5": check(
    "Ordered Pair",
    "Read x first and y second. Move horizontally for x, then vertically for y, and check the point lands at both coordinates.",
    "What location does the ordered pair name?",
    "For (___, ___), I moved ___ on x and ___ on y, so ___.",
  ),
  "7-3": check(
    "Absolute Value",
    "Locate the number and zero on a number line. Count the distance; the absolute value must be nonnegative.",
    "What does the absolute value mean in this situation?",
    "___ is ___ units from zero, so |___| = ___.",
  ),
  "7-4": check(
    "Integer Order",
    "Place the integers on a number line. The number farther right is greater.",
    "How does position on the number line settle the comparison?",
    "___ is to the right of ___, so ___ > ___.",
  ),
  "7-2": check(
    "Rational Number Line",
    "Use benchmarks such as −1, 0, and 1. Convert fractions and decimals to a common form when two positions are close.",
    "Between which benchmarks does the number belong?",
    "___ is between ___ and ___ because ___.",
  ),
  "7-8": check(
    "Four-Quadrant Point",
    "Use the signs to predict the quadrant, then move x first and y second. Check the plotted point matches both signs.",
    "How do the coordinate signs identify the quadrant?",
    "The signs are (___, ___), so the point belongs in Quadrant ___.",
  ),
  "7-6": check(
    "Coordinate Distance",
    "Confirm the points share an x- or y-coordinate. Take the absolute difference of the coordinates that change.",
    "What does the distance represent on the grid?",
    "The changing coordinates are ___ and ___. Their absolute difference is ___.",
  ),
  "7-9": check(
    "Reflection",
    "Across the x-axis, change the sign of y. Across the y-axis, change the sign of x. The point and image should be equally far from the axis.",
    "Which coordinate changed, and why?",
    "Reflecting across the ___-axis changes ___ from ___ to ___.",
  ),
  "5-5": check(
    "Volume",
    "Find the cubes in one layer, multiply by the number of layers, and compare with length × width × height.",
    "What does each factor count?",
    "One layer has ___ cubes and there are ___ layers, so V = ___ cubic units.",
  ),
  "5-10": check(
    "Fractional Volume",
    "Find the base area first, then multiply by height. Estimate with nearby whole-number dimensions and use cubic units.",
    "How do the fractional edges affect the volume?",
    "The base area is ___. Multiplying by height ___ gives ___ cubic units.",
  ),
  "5-6": check(
    "Net Surface Area",
    "Match every face on the net to the solid. Find each face area once and confirm no face is missing or counted twice.",
    "How does the net account for the whole outside surface?",
    "The net has ___ faces. Their areas add to ___ square units.",
  ),
  "5-7": check(
    "Prism Surface Area",
    "Pair congruent faces, find every face area, and add each outside face exactly once in square units.",
    "Which faces make up the total surface area?",
    "The paired face areas are ___. Together they total ___ square units.",
  ),
  "5-8": check(
    "Pyramid Surface Area",
    "Find the base area and each triangular face area. Add the base and all lateral faces once, using square units.",
    "How do the base and lateral faces build the total?",
    "The base area is ___ and the lateral areas total ___. The surface area is ___.",
  ),
  // ---- Unit 1 "Math Is..." (mindset lessons still carry the deck's arithmetic) ----
  "1-1": check(
    "Estimate Check",
    "Say what you rounded and in which direction. Confirm your estimate is close to a quick exact calculation.",
    "Is your estimate high or low, and how do you know?",
    "I estimated ___ by rounding ___ to ___, so my estimate is a little ___.",
  ),
  "1-2": check(
    "Decomposition",
    "Add your parts back together. The total must rebuild the original number exactly.",
    "Do your parts rebuild the original number?",
    "I broke ___ into ___ and ___, and ___ + ___ = ___.",
  ),
  "1-3": check(
    "Units Match",
    "Check that both quantities use the same unit before you divide, and say what the quotient counts.",
    "What does your quotient count in this situation?",
    "I converted ___ to ___ so both were in ___. The quotient ___ means ___.",
  ),
  "1-4": check(
    "Dimension Check",
    "Count how many dimensions you multiplied. One gives length, two give area, three give volume — then label the unit.",
    "Why is your unit cubic rather than square here?",
    "I multiplied ___ dimensions, so the answer is ___ measured in ___.",
  ),
  "1-5": check(
    "Pattern Rule",
    "State the rule in words, then test it on a row you have not used yet.",
    "Does your rule still work on a new row?",
    "My rule is ___. Testing it on ___ gives ___, which matches.",
  ),
  "1-6": check(
    "Strategy Trace",
    "Name the first move you made and why. Confirm that each later step follows from the one before it.",
    "Which step did the real work in your solution?",
    "I started by ___ because ___. That let me ___.",
  ),

  // ---- Unit 2 ----
  "2-8": check(
    "Mean Balance",
    "Add the values and divide by how many there are. Then check the balance: the amounts above the mean must offset the amounts below it.",
    "Does your mean sit inside the range of the data?",
    "The total is ___ shared among ___ values, so the mean is ___. It balances because ___ above offsets ___ below.",
  ),

  // ---- Unit 4 ----
  "4-3": check(
    "Benchmark Percent",
    "Name the benchmark you used (50%, 25%, 10% or 1%) and say which number you rounded. Then decide whether your estimate is high or low.",
    "Which way did your rounding push the estimate?",
    "I used ___% of ___ as a benchmark, so my estimate ___ is a little ___ because I rounded ___.",
  ),

  // ---- Unit 7 ----
  "7-1": check(
    "Opposite Check",
    "Locate the number and its opposite on the number line. Confirm both sit the same distance from 0 on opposite sides.",
    "What does 0 represent in this situation?",
    "___ and ___ are both ___ units from 0, so they are opposites. Here 0 means ___.",
  ),
  "7-7": check(
    "Vertex Check",
    "Plot each vertex as (x, y) — across first, then up or down. Confirm the side lengths by subtracting the coordinates that change.",
    "Which coordinate changes along that side?",
    "The side from ___ to ___ changes only in ___, so its length is ___ − ___ = ___.",
  ),

  // ---- Unit 9 ----
  "9-1": check(
    "Which Depends",
    "Name which quantity you chose and which one responded. Confirm the dependent quantity changes when the independent one does.",
    "Which quantity does the other one depend on?",
    "___ is independent because I chose it. ___ is dependent because it changes when ___ changes.",
  ),
  "9-2": check(
    "Read the Point",
    "Read the ordered pair as (independent, dependent). Confirm the point matches the rate by checking a second point on the graph.",
    "Does that point agree with the rate you found?",
    "The point ___ means ___ of ___ gives ___. Checking ___ also gives ___.",
  ),
  "9-3": check(
    "Equation Test",
    "Substitute a pair from your table into the equation. Both sides must be equal.",
    "Does your equation hold for a second pair too?",
    "Substituting ___ gives ___ = ___, so the equation works.",
  ),
  "9-4": check(
    "Answer the Question",
    "Solve for the variable, then reread the question and check that your number answers what was actually asked.",
    "Does your solution make sense in the situation?",
    "I solved ___ = ___ and got ___. In this situation that means ___.",
  ),

  // ---- Unit 10 "Math Is..." ----
  "10-1": check(
    "Rate Scale-Up",
    "Identify the rate, then multiply by how many times it repeats. Check the unit of your answer.",
    "What does one unit of your rate stand for?",
    "The rate is ___ per ___. Over ___ that gives ___ ___.",
  ),
  "10-2": check(
    "Symmetry Test",
    "Draw the line of symmetry and check that every point on one side has a matching point the same distance on the other.",
    "How did you decide where the line goes?",
    "The line of symmetry runs ___ because ___ matches ___ across it.",
  ),
  "10-3": check(
    "Recursive Rule",
    "State how each term comes from the one before it, then use it to predict the next term and test the prediction.",
    "How does each step build on the one before?",
    "Each term is ___ the term before, so after ___ comes ___.",
  ),
  "10-4": check(
    "Ratio Simplify",
    "Write the two counts as a ratio, then divide both by the same number to simplify. Say what the simplified ratio means.",
    "What does your simplified ratio mean for the machine?",
    "The ratio ___ to ___ simplifies to ___ to ___, which means ___.",
  ),
  "10-5": check(
    "Position in a Pattern",
    "Divide the position number by the length of the pattern unit. The remainder tells you where in the unit you land.",
    "What does the remainder tell you here?",
    "___ ÷ ___ leaves a remainder of ___, so position ___ is ___.",
  ),
  "10-6": check(
    "Then and Now",
    "Show the same problem two ways — the way you would have solved it before and the way you solve it now. Confirm both give the same answer.",
    "What can you do now that you could not do before?",
    "Before I would have ___. Now I can ___, and both give ___.",
  ),
};

const fallbackCheck = check(
  "Strategy",
  "Use the inverse operation or a second representation to check each step against the original problem.",
  "What does your result mean in today's problem?",
  "I checked ___ by ___. My result means ___.",
);

export function mathCheckFor(config = {}) {
  const lessonKey = String(config.lessonId || "").match(/^\d+-\d+/)?.[0];
  return MATH_CHECKS[lessonKey] || fallbackCheck;
}

// Lower-case a check title for use mid-sentence ("use the ratio table check")
// WITHOUT flattening an acronym. Roughly a quarter of MATH_CHECKS are acronyms
// — MAD, GCF, LCM, IQR, SA — and `.toLowerCase()` turned every one of them into
// a word a student has never been taught ("use the mad check"). It also cost
// them the definition: the inline vocabulary pop-up matches acronyms
// case-sensitively, by design, so "mad" is not a term and gets no underline.
// Word-by-word, so a future mixed title like "MAD Spread" keeps the acronym and
// lowercases the rest.
export const spokenTitle = (title) =>
  String(title || "")
    .split(/(\s+)/)
    .map((word) => (/^[A-Z]{2,}$/.test(word) ? word : word.toLowerCase()))
    .join("");

function step(label) {
  const card = el("div", "card sg-apply-step");
  card.appendChild(el("div", "sg-step-lab", label));
  return card;
}

function responseBox(label, value, onInput) {
  const box = el("textarea", "sg-ta");
  box.setAttribute("aria-label", label);
  box.placeholder = label;
  box.value = value || "";
  box.oninput = () => onInput(box.value.trim());
  return box;
}

export function createMathCheckLab(config, state, onDone, store = null) {
  const topic = mathCheckFor(config);
  const section = el("section", "sg-sec sg-lab");
  section.id = "sg-prove"; // Keep the existing route anchor and saved-tab compatibility.
  section.appendChild(sectionHeading(1, "Solve · check · connect", `${topic.title} Check Lab`));
  section.appendChild(
    el(
      "p",
      null,
      `Solve one challenge, use the ${spokenTitle(topic.title)} check, then explain what your result means.`,
    ),
  );

  const cards = [];
  const unlock = (index) => cards[index]?.classList.remove("locked");
  const problem = config.practice?.extending?.[0] || config.practice?.onLevel?.[0] || {};

  const solve = step("1 · Solve today's challenge");
  solve.appendChild(
    problem.stem
      ? el("p", "sg-talk-q", esc(problem.stem))
      : el("p", "block-lab", "Solve the most challenging problem from today's lesson."),
  );
  const solveWork = responseBox(
    "Your answer and steps",
    store?.get("mathSolveWork") || state.mathSolveWork,
    (value) => {
      state.mathSolveWork = value;
      store?.set("mathSolveWork", value);
    },
  );
  const solveButton = el("button", "btn", "I've got an answer →");
  solveButton.type = "button";
  const solveStatus = el("div", "fb");
  solveStatus.setAttribute("aria-live", "polite");
  solveButton.onclick = () => {
    if (solveWork.value.trim().length < 8) {
      solveStatus.className = "fb show no";
      solveStatus.textContent = "Write your answer and at least one step first.";
      return;
    }
    solveButton.disabled = true;
    unlock(1);
    solveStatus.className = "fb show info";
    solveStatus.textContent = `Next, run the ${spokenTitle(topic.title)} check.`;
  };
  const solveRow = el("div", "row");
  solveRow.appendChild(solveButton);
  solve.append(solveWork, solveRow, solveStatus);
  section.appendChild(solve);
  cards.push(solve);

  const verify = step(`2 · Run the ${spokenTitle(topic.title)} check`);
  verify.classList.add("locked");
  verify.append(
    el("p", "sg-talk-q", esc(topic.action)),
    el("p", "sg-frame", `<b>Sentence frame:</b> ${esc(topic.frame)}`),
  );
  const checkWork = responseBox(
    "Show your math check",
    store?.get("mathCheckWork") || state.mathCheckWork,
    (value) => {
      state.mathCheckWork = value;
      store?.set("mathCheckWork", value);
    },
  );
  const checkButton = el("button", "btn", "My check matches →");
  checkButton.type = "button";
  const checkStatus = el("div", "fb");
  checkStatus.setAttribute("aria-live", "polite");
  checkButton.onclick = () => {
    if (checkWork.value.trim().length < 8) {
      checkStatus.className = "fb show no";
      checkStatus.textContent = "Show the numbers, labels, or steps you used to check your work.";
      return;
    }
    checkButton.disabled = true;
    unlock(2);
    checkStatus.className = "fb show info";
    checkStatus.textContent = "Your calculation is checked. Now connect it to the math topic.";
  };
  const checkRow = el("div", "row");
  checkRow.appendChild(checkButton);
  verify.append(checkWork, checkRow, checkStatus);
  section.appendChild(verify);
  cards.push(verify);

  const connect = step("3 · Tell what the result means");
  connect.classList.add("locked");
  connect.append(
    el("p", "sg-talk-q", esc(topic.connect)),
    el("p", "sg-frame", `<b>Sentence frame:</b> ${esc(topic.frame)}`),
  );
  const meaning = responseBox(
    "What your result means",
    store?.get("mathCheckMeaning") || state.mathCheckMeaning,
    (value) => {
      state.mathCheckMeaning = value;
      store?.set("mathCheckMeaning", value);
    },
  );
  const finish = el("button", "btn", "Finish my math check ✓");
  finish.type = "button";
  finish.disabled = meaning.value.trim().length < 8;
  meaning.addEventListener("input", () => (finish.disabled = meaning.value.trim().length < 8));
  const finishStatus = el("div", "fb");
  finishStatus.setAttribute("aria-live", "polite");
  finish.onclick = () => {
    state.mathCheckDone = true;
    store?.set("mathCheckDone", true);
    finish.disabled = true;
    finish.textContent = "Math check complete ✓";
    finishStatus.className = "fb show ok";
    finishStatus.innerHTML =
      "✅ <b>Math check complete.</b> You solved, checked, and connected your answer to today's math.";
    celebrate("✓");
    onDone?.();
  };
  const finishRow = el("div", "row");
  finishRow.appendChild(finish);
  connect.append(meaning, finishRow, finishStatus);
  section.appendChild(connect);
  cards.push(connect);

  return section;
}
