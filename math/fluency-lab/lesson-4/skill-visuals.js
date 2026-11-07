// One source of truth: which interactive graphic (graphics/registry.js GRAPHIC_KINDS) and which animation
// (ANIMATION_KINDS) each of the 96 skills uses in its mini-lesson, and why. "-" means none, and the reason says what
// the lesson shows instead (the exact model already drawn by visual-lab.js / trail-pictures.js, or a step-through).
// Row: grade:id | graphic | animation | reason
import { STRAND_SKILLS } from "../strand-skills.js";

const STRAND_ROWS = STRAND_SKILLS.map((d) => `${d.grade}:${d.id}|${d.visual.join("|")}`).join("\n");
const ROWS = `
0:count-forward|number-line|-|Counting on is moving one step along a line.
0:count-cardinality|-|-|Counters on a ten-frame show one-to-one counting exactly; a line would hide it.
0:subitize|-|-|The dot arrangement itself is the model; nothing to build.
0:compare-20|number-line|-|Later on the line means more.
0:compose-10|-|-|The ten-frame counters show the two parts of ten directly.
0:add-sub-5|number-line|-|Joining and taking away are hops forward and back.
0:story-add-sub-10|number-line|-|A story becomes a start, a hop and a landing spot.
0:patterns|-|-|The repeating unit is a row of shapes; a graphic adds nothing.
1:count-patterns|number-line|-|A counting pattern is equal hops on a line.
1:compare-100|place-value|-|Tens are compared before ones, which blocks show side by side.
1:tens-ones|place-value|-|Tens and ones blocks are the place-value model.
1:add-10|number-line|-|Count on from the bigger number.
1:subtract-10|number-line|-|Count back from the whole.
1:make-10|-|-|Ten-frame counters show which parts make ten.
1:add-20|number-line|regrouping|Making a ten first is trading ones to fill a ten.
1:subtract-20|number-line|-|Count back through ten; a trade animation would not match the strategy.
1:missing-addend|number-line|-|The missing part is the hop from the part to the whole.
1:time|number-line|-|Time to the hour and half hour is hops on a time line.
1:measure-length|number-line|-|A ruler is a number line of equal units.
2:facts-20|number-line|-|Doubles and make-a-ten are hops from a known fact.
2:sub-facts-20|number-line|-|Subtraction facts are hops back or a gap between two numbers.
2:place-1000|place-value|-|Hundreds, tens and ones blocks.
2:compare-1000|place-value|-|Hundreds are compared first.
2:skip-count|number-line|-|Skip counting is equal hops on a line.
2:add-100|place-value|regrouping|Ten ones trade for a ten when a column fills.
2:subtract-100|place-value|regrouping|A ten trades for ten ones when a column is short.
2:add-1000|place-value|regrouping|Columns trade up when they reach ten.
2:even-odd|array|-|Pairs in two columns show a leftover or none.
2:coins|-|-|Coin values are counted from greatest to least in the coin counter, which has no match in the graphic set.
2:interpret-data|stats-display|-|A picture graph or bar graph is the stats display.
3:mul-0-5|array|multiplication-grouping|Equal groups are the rows of an array.
3:mul-6-9|array|area-decomposition|A hard fact splits into two easier facts inside one array.
3:mul-10-12|area-model|-|Tens times a fact is a rectangle of tens.
3:division-facts|array|multiplication-grouping|Dividing finds the rows or the row size of equal groups.
3:add-sub-1000|place-value|regrouping|Trade between places when adding or subtracting.
3:round|number-line|-|Rounding finds the nearer mark on a line.
3:fraction-equivalence|fraction-model|fraction-equivalence|Same amount, different-size pieces.
3:fraction-compare|fraction-model|-|Bars of the same whole show which is more.
3:area|area-model|-|Area is rows of unit squares.
3:perimeter|geometry|-|Perimeter is the walk around a labeled shape.
3:elapsed-time|number-line|-|Elapsed time is a jump from start to end on a time line.
4:place-million|place-value|-|Each place is ten times the one to its right.
4:round-large|number-line|-|Rounding finds the nearer round number on a line.
4:add-large|place-value|regrouping|Columns trade up when they reach ten.
4:subtract-large|place-value|regrouping|A place trades from its left neighbor when it is short.
4:multiply-1digit|area-model|area-decomposition|Each place of the factor is its own part of the rectangle.
4:multiply-2digit|area-model|area-decomposition|Four partial products fill one rectangle.
4:division|area-model|-|Division finds the missing side of a rectangle.
4:factors|array|-|Each factor pair is a rectangle that holds the number.
4:fraction-equiv|fraction-model|fraction-equivalence|Same amount, different-size pieces.
4:fraction-compare|fraction-model|-|Bars of the same whole show which is more.
4:unit-conversion|double-number-line|-|One amount with two unit scales on matching lines.
5:multiply-whole|area-model|area-decomposition|Partial products fill one rectangle.
5:divide-whole|area-model|-|Division finds the missing side of a rectangle.
5:decimal-place|decimal-percent|-|Tenths and hundredths on a hundred grid.
5:decimal-add|decimal-percent|-|Hundredths grids join and trade.
5:decimal-sub|decimal-percent|-|Hundredths grids take away.
5:decimal-mul|area-model|-|A decimal product is the area of a rectangle of parts.
5:fraction-add|fraction-model|fraction-addition|Pieces must match in size before they are joined.
5:fraction-mul|area-model|-|A part of a part is the overlap in a rectangle.
5:fraction-of|fraction-model|-|Split into equal parts and take some.
5:volume|solids-nets|-|Unit cubes fill a solid in layers.
5:unit-fraction-division|number-line|-|How many unit pieces fit is counted along a line.
6:gcf|-|-|Factor lists are exact in the lists model; an array does not show a shared factor.
6:lcm|number-line|-|Multiples of two numbers are marks on two lines that meet.
6:divide-fractions|fraction-model|-|How many of one fraction fit in another.
6:decimal-ops|decimal-percent|-|Decimal parts on a grid back up the estimate.
6:ratios|ratio-table|ratio-scaling|Multiply both quantities by the same number.
6:unit-rates|double-number-line|ratio-scaling|One unit sits at 1 on the second line.
6:percent|decimal-percent|-|Percent is a part out of a hundred.
6:evaluate|-|-|Substituting is symbolic; the step-through shows each replacement.
6:one-step|-|-|The balanced-equation steps are shown as a step-through; no balance in the graphic set.
6:integers|number-line|-|Absolute value is distance from zero; quadrants use the plane in the step-through.
6:triangle-area|geometry|area-decomposition|A triangle is half of a rectangle.
6:multi-digit-division|area-model|-|Division finds the missing side of a rectangle.
6:order-rational|number-line|-|Numbers further left on the line are less.
6:percent-whole|double-number-line|-|The part sits at its percent; 100 percent is the whole.
6:equivalent-expressions|area-model|-|An area model splits a product into parts that add up.
6:write-inequalities|number-line|-|The shaded part of the line shows every solution.
6:data-displays|stats-display|-|Dots and bars show how many values are at each number or interval.
6:center-spread|stats-display|-|The center and the spread are marked on the data display.
6:surface-area-nets|solids-nets|-|The net lays every face flat so each one is counted once.
6:volume-fractional|solids-nets|-|Layers of unit cubes fill the prism, including fractional cubes.
7:integer-add|number-line|-|The sign is the direction and the number is the distance.
7:integer-mul|number-line|-|Repeated hops in a direction show the sign.
7:fraction-ops|number-line|-|Rational numbers are points on a line.
7:proportions|ratio-table|ratio-scaling|Equal ratios share one multiplier.
7:unit-rate|double-number-line|ratio-scaling|The rate is the value at one on the second line.
7:percent-change|double-number-line|-|A percent change is a part of the original on a line.
7:equations|-|-|The undo steps are shown as a step-through; no balance in the graphic set.
7:inequalities|number-line|-|Solutions are the points the shading covers.
7:circle-area|geometry|-|Radius and area on a labeled circle.
7:probability|stats-display|-|Outcomes and favorable outcomes are counted in a display.
7:scale-drawing|ratio-table|ratio-scaling|Drawing length and real length scale together.
8:exponents|-|-|Repeated multiplication is shown by the chain model in the worked example.
8:powers-ten|place-value|-|A power of ten moves digits across places.
8:square-roots|area-model|-|A square root is the side of a square of that area.
8:linear-equations|-|-|The same step on both sides is shown as a step-through; no balance in the graphic set.
8:slope|coordinate-grid|coordinate-movement|Slope is rise over run between two points.
8:functions|coordinate-grid|-|Input and output pairs plot as points.
8:systems|coordinate-grid|-|The solution is where two lines cross.
8:angle-relations|geometry|-|Angles are measured and labeled on a figure.
8:transformations|coordinate-grid|transformation|A reflection moves a point across a line on the plane.
8:pythagorean|geometry|-|Legs and hypotenuse on a labeled right triangle.
8:association|stats-display|-|A scatter plot shows how two sets of data relate.
`;

export const SKILL_VISUALS = Object.fromEntries(
  `${ROWS.trim()}\n${STRAND_ROWS}`
    .trim()
    .split("\n")
    .map((row) => {
      const [key, graphic, animation, reason] = row.split("|");
      return [key, { graphic: graphic === "-" ? null : graphic, animation: animation === "-" ? null : animation, reason }];
    }),
);

const NONE = { graphic: null, animation: null, reason: "" };
export const visualsFor = (skill) => SKILL_VISUALS[`${skill.grade}:${skill.id}`] || NONE;
