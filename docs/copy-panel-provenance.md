# Copy-panel provenance audit

Read-only forensic audit of the notebook copy panels shipped in `82951ef0b` and live on production from 2026-08-18 14:14 until `c549d8437` suppressed them.

Every classification below compares two strings from the **same lesson's** `config.json`. The panel is never its own evidence: the corpus each panel is checked against is the lesson config with the `notebook` block removed.

## Totals

| Classification | Count |
| --- | ---: |
| definition:new-prose | 81 |
| definition:reworded | 131 |
| definition:verbatim-or-shortened | 208 |
| example:absent | 10 |
| example:numbers-chosen-not-from-lesson | 16 |
| example:numbers-from-lesson | 58 |
| rule:belongs-to-other-lesson | 13 |
| rule:no-source-in-lesson | 26 |
| rule:stated-in-lesson-different-wording | 34 |
| rule:verbatim-in-lesson | 11 |
| term:defined-but-never-used-in-lesson | 16 |
| term:verbatim | 420 |

## Per lesson

### 1-1 — Math is Mine

Declared vocabulary entries: 5

| Term | Term provenance | Definition provenance | Used elsewhere in lesson |
| --- | --- | --- | --- |
| doer of math | verbatim | reworded — new words: day | yes |
| math story | verbatim | reworded — new words: math, learn | yes |
| strength | verbatim | verbatim-or-shortened | yes |
| decompose | verbatim | reworded — new words: rebuil | yes |
| estimate | verbatim | verbatim-or-shortened | yes |

- **Rule:** `Total = number of groups × size per group` → **no-source-in-lesson** (words absent from the lesson: size)
- **Meaning:** Multiply groups by size to find a reasonable total.
- **Example:** `20 cars × 4 riders = 80 people` → **numbers-from-lesson**

### 1-2 — Math is Exploring and Thinking

Declared vocabulary entries: 5

| Term | Term provenance | Definition provenance | Used elsewhere in lesson |
| --- | --- | --- | --- |
| quantity | verbatim | reworded — new words: count, measur | **no** |
| relationship | verbatim | reworded — new words: number, other | yes |
| strategy | verbatim | reworded — new words: steps | yes |
| reasonable | verbatim | reworded — new words: answer | yes |
| persevere | verbatim | new-prose — new words: trying, differ, ways, stuck | **no** |

- **Rule:** `Reasonableness: Estimate ≈ Exact Answer` → **stated-in-lesson-different-wording**
- **Meaning:** Check that your solution is close to your estimate.
- **Example:** `Estimate 100 peas ≈ Exact 96 peas` → **numbers-from-lesson**

### 1-3 — Math is In My World

Declared vocabulary entries: 5

| Term | Term provenance | Definition provenance | Used elsewhere in lesson |
| --- | --- | --- | --- |
| representation | verbatim | reworded — new words: drawin, thinki | **no** |
| tape diagram | verbatim | new-prose — new words: bar, model, showin, whole, amount | yes |
| tool | verbatim | new-prose — new words: object, drawin, helps | yes |
| ordered pair | verbatim | new-prose — new words: showin, point, grid | yes |
| round trip | verbatim | new-prose — new words: travel, place, coming, again | yes |

- **Rule:** `Tape Diagram: Total ÷ Number of Equal Parts` → **stated-in-lesson-different-wording**
- **Meaning:** Divide the whole bar into equal units to solve.
- **Example:** `$24 total ÷ 3 parts = $8 per part` → **numbers-from-lesson**

### 1-4 — Math is Explaining and Sharing

Declared vocabulary entries: 5

| Term | Term provenance | Definition provenance | Used elsewhere in lesson |
| --- | --- | --- | --- |
| argument | verbatim | new-prose — new words: clear, explan, showin, why, answer, true | yes |
| conjecture | verbatim | verbatim-or-shortened | yes |
| counterexample | verbatim | reworded — new words: showin, true | yes |
| volume | verbatim | new-prose — new words: total, inside, three-, shape | yes |
| cubic unit | verbatim | reworded — new words: 1-unit | yes |

- **Rule:** `Volume = length × width × height` → **stated-in-lesson-different-wording**
- **Meaning:** Multiply the three dimensions in cubic units.
- **Example:** `8 × 3 × 10 = 240 cubic inches` → **numbers-from-lesson**

### 1-5 — Math is Finding Patterns

Declared vocabulary entries: 5

| Term | Term provenance | Definition provenance | Used elsewhere in lesson |
| --- | --- | --- | --- |
| pattern | verbatim | new-prose — new words: number, shapes, way | yes |
| pattern rule | verbatim | new-prose — new words: tellin, find, next, value | yes |
| generalization | verbatim | reworded — new words: rule, stays | yes |
| table of values | verbatim | new-prose — new words: listin, pairs, relate, number, order | yes |
| reasonableness | verbatim | reworded — new words: checki, good | yes |

- **Rule:** `Pattern Rule: Next Value = Current Value + Step` → **belongs-to-other-lesson** — the mathematics this names belongs to 2-1, 4-4, 7-9 (words absent from the lesson: curren)
- **Meaning:** Follow the constant step to find the next value.
- **Example:** `$1.00, $5.00, $10.00, $25.00` → **numbers-from-lesson**

### 1-6 — Math is Ours

Declared vocabulary entries: 5

| Term | Term provenance | Definition provenance | Used elsewhere in lesson |
| --- | --- | --- | --- |
| make sense of a problem | verbatim | reworded — new words: figuri, find | **no** |
| representation | verbatim | reworded — new words: shows, thinki | yes |
| strategy | verbatim | reworded — new words: steps, solve | yes |
| critique | verbatim | new-prose — new words: explai, helpfu, unhelp | yes |
| community agreement | verbatim | reworded — new words: classr, helps | yes |

- **Rule:** `Problem Plan: Understand → Model → Solve → Check` → **stated-in-lesson-different-wording**
- **Meaning:** Make sense of problem, draw model, solve, and check.
- **Example:** `16 wheels × 6 racks = 96 wheels` → **numbers-from-lesson**

### 2-1 — Understand Statistical Questions

Declared vocabulary entries: 7

| Term | Term provenance | Definition provenance | Used elsewhere in lesson |
| --- | --- | --- | --- |
| Statistical Questions and Data | verbatim | verbatim-or-shortened | yes |
| Statistical Question | verbatim | reworded — new words: expect | yes |
| Non-statistical Question | verbatim | reworded — new words: only, single | yes |
| Data | verbatim | reworded — new words: questi | yes |
| Variability | verbatim | reworded — new words: datase | yes |

- **Rule:** `Statistical Question: Expects varied data from people` → **stated-in-lesson-different-wording**
- **Meaning:** A question where answers differ and need data collection.
- **Example:** `"How many points does each player score per game?"` → **numbers-from-lesson**

### 2-2 — Represent and Describe Data in a Histogram

Declared vocabulary entries: 6

| Term | Term provenance | Definition provenance | Used elsewhere in lesson |
| --- | --- | --- | --- |
| Histogram | verbatim | reworded — new words: groupi, interv | yes |
| Frequency | verbatim | reworded — new words: data, happen | yes |
| Interval | verbatim | reworded — new words: data, values | yes |
| Distribution | verbatim | new-prose — new words: values, across, differ, number | yes |
| Variability | verbatim | reworded — new words: datase | **no** |

- **Rule:** `Histogram: Interval on x-axis, Frequency on y-axis` → **no-source-in-lesson** (words absent from the lesson: y-axis)
- **Meaning:** Bars touch each other and show counts for each range.
- **Example:** `Interval 10–19 has frequency 3` → **numbers-from-lesson**

### 2-3 — Describe the Data Using the Median

Declared vocabulary entries: 6

| Term | Term provenance | Definition provenance | Used elsewhere in lesson |
| --- | --- | --- | --- |
| Median | verbatim | reworded — new words: values, order | yes |
| Mode | verbatim | new-prose — new words: data, value, appear, often | yes |
| Outlier | verbatim | new-prose — new words: value, higher, lower, other, values | yes |
| Data distribution | verbatim | verbatim-or-shortened | **no** |
| Variability | verbatim | reworded — new words: datase | yes |

- **Rule:** `Median: Middle number when data is in order` → **stated-in-lesson-different-wording**
- **Meaning:** Order numbers from least to greatest and find center.
- **Example:** `In 2, 4, 4, 6, 9 the median is 4` → **numbers-from-lesson**

### 2-4 — Represent and Describe Data in a Box Plot

Declared vocabulary entries: 7

| Term | Term provenance | Definition provenance | Used elsewhere in lesson |
| --- | --- | --- | --- |
| Box Plot | verbatim | reworded — new words: showin | yes |
| Median | verbatim | reworded — new words: values, order | yes |
| Quartile | verbatim | new-prose — new words: values, ordere, parts | yes |
| Interquartile Range | verbatim | reworded — new words: betwee | yes |
| Data distribution | verbatim | verbatim-or-shortened | **no** |

- **Rule:** `Five-Number Summary: Min, Q1, Median, Q3, Max` → **verbatim-in-lesson**
- **Meaning:** The box holds the middle 50% from Q1 to Q3.
- **Example:** `Min 4, Q1 8, Median 14, Q3 22, Max 28` → **numbers-from-lesson**

### 2-5 — Describe Data by Range and Interquartile Range

Declared vocabulary entries: 6

| Term | Term provenance | Definition provenance | Used elsewhere in lesson |
| --- | --- | --- | --- |
| Range and Interquartile Range | verbatim | verbatim-or-shortened | yes |
| Range | verbatim | verbatim-or-shortened | yes |
| Quartile | verbatim | new-prose — new words: split, equal, parts | yes |
| Interquartile range | verbatim | reworded — new words: spread, betwee | yes |
| Variability | verbatim | new-prose — new words: spread, out, number, datase | yes |

- **Rule:** `Mean = Sum of all values ÷ Total count of values` → **no-source-in-lesson** (words absent from the lesson: total)
- **Meaning:** Add all data numbers and divide by how many there are.
- **Example:** `(4 + 8 + 12) ÷ 3 = 24 ÷ 3 = 8` → **numbers-chosen-not-from-lesson** (numbers absent from the lesson: 24)

### 2-6 — Divide Multi-Digit Numbers Using an Algorithm

Declared vocabulary entries: 7

| Term | Term provenance | Definition provenance | Used elsewhere in lesson |
| --- | --- | --- | --- |
| Divide Multi-Digit Numbers | verbatim | verbatim-or-shortened | yes |
| Dividend | verbatim | new-prose — new words: being, split, equal, parts | yes |
| Divisor | verbatim | reworded — new words: divide | yes |
| Quotient | verbatim | reworded — new words: divisi, proble | yes |
| Remainder | verbatim | verbatim-or-shortened | yes |

- **Rule:** `Interquartile Range: IQR = Q3 − Q1` → **belongs-to-other-lesson** — the mathematics this names belongs to 2-4, 2-5 (words absent from the lesson: interq, iqr)
- **Meaning:** Subtract the lower quartile from the upper quartile.
- **Example:** `IQR = 22 − 8 = 14` → **numbers-from-lesson**

### 2-7 — Divide Decimals Using an Algorithm

Declared vocabulary entries: 6

| Term | Term provenance | Definition provenance | Used elsewhere in lesson |
| --- | --- | --- | --- |
| Divide Decimals | verbatim | verbatim-or-shortened | yes |
| Dividend | verbatim | new-prose — new words: being, split, equal, parts | yes |
| Divisor | verbatim | reworded — new words: divide | yes |
| Quotient | verbatim | reworded — new words: divisi, proble | yes |
| Decimal division | verbatim | verbatim-or-shortened | yes |

- **Rule:** `MAD = Average distance of data values from the mean` → **no-source-in-lesson** (words absent from the lesson: averag, data, values)
- **Meaning:** Find distance from mean for each point, then average them.
- **Example:** `Distances: 2, 4, 0 → MAD = 6 ÷ 3 = 2` → **numbers-from-lesson**

### 2-8 — Describe Data Using the Mean

Declared vocabulary entries: 5

| Term | Term provenance | Definition provenance | Used elsewhere in lesson |
| --- | --- | --- | --- |
| Mean | verbatim | new-prose — new words: found, dividi, total, sum, count | yes |
| Average | verbatim | verbatim-or-shortened | yes |
| Measure of center | verbatim | verbatim-or-shortened | yes |
| Balance point | verbatim | verbatim-or-shortened | yes |
| Data set | verbatim | verbatim-or-shortened | yes |

- **Rule:** `Choose Center: Use Median with outliers, Mean when symmetric` → **belongs-to-other-lesson** — the mathematics this names belongs to 2-10 (words absent from the lesson: choose, outlie, symmet)
- **Meaning:** Outliers pull the mean, but median stays steady.
- **Example:** `Data with outlier 95: use median 12` → **numbers-chosen-not-from-lesson** (numbers absent from the lesson: 95)

### 2-9 — Describe Data by Mean Absolute Deviation

Declared vocabulary entries: 6

| Term | Term provenance | Definition provenance | Used elsewhere in lesson |
| --- | --- | --- | --- |
| Mean Absolute Deviation | verbatim | verbatim-or-shortened | yes |
| Deviation | verbatim | reworded — new words: mean | yes |
| Absolute Value | verbatim | new-prose — new words: distan, zero, line | yes |
| Spread | verbatim | verbatim-or-shortened | yes |
| Data distribution | verbatim | verbatim-or-shortened | **no** |

- **Rule:** `Data Shape: Look for peaks, clusters, gaps, and tails` → **belongs-to-other-lesson** — the mathematics this names belongs to 2-2 (words absent from the lesson: peaks, gaps, tails)
- **Meaning:** Describe where data bunches and where it spreads out.
- **Example:** `Peak on left with long tail right = skewed right` → **numbers-from-lesson**

### 2-10 — Choose Appropriate Measures

Declared vocabulary entries: 7

| Term | Term provenance | Definition provenance | Used elsewhere in lesson |
| --- | --- | --- | --- |
| Appropriate Measures of Center | verbatim | verbatim-or-shortened | **no** |
| Mean | verbatim | new-prose — new words: found, dividi, total, sum, count | yes |
| Median | verbatim | reworded — new words: values, order | yes |
| Outlier | verbatim | new-prose — new words: value, higher, lower, other, values | yes |
| Skewed | verbatim | verbatim-or-shortened | yes |

- **Rule:** `Compare Box Plots: Compare centers and IQR spreads` → **belongs-to-other-lesson** — the mathematics this names belongs to 2-4, 2-5 (words absent from the lesson: box, plots, iqr)
- **Meaning:** Look at median line position and box width.
- **Example:** `Group A median 14 > Group B median 10` → **numbers-from-lesson**

### 2-11 — Add and Subtract Decimals

Declared vocabulary entries: 6

| Term | Term provenance | Definition provenance | Used elsewhere in lesson |
| --- | --- | --- | --- |
| Add and Subtract Decimals | verbatim | verbatim-or-shortened | yes |
| Decimal | verbatim | verbatim-or-shortened | yes |
| Place value | verbatim | verbatim-or-shortened | yes |
| Tenths | verbatim | reworded — new words: point | yes |
| Hundredths | verbatim | reworded — new words: point | yes |

- **Rule:** `Dot Plot: Each dot represents one data value` → **no-source-in-lesson** (words absent from the lesson: plot, repres, data)
- **Meaning:** Dots stack up above the number line to show frequency.
- **Example:** `Three dots above 5 means 5 appears 3 times` → **numbers-from-lesson**

### 2-12 — Multiply Decimals

Declared vocabulary entries: 6

| Term | Term provenance | Definition provenance | Used elsewhere in lesson |
| --- | --- | --- | --- |
| Multiply Decimals | verbatim | verbatim-or-shortened | yes |
| Product | verbatim | verbatim-or-shortened | yes |
| Decimal point | verbatim | verbatim-or-shortened | yes |
| Estimate | verbatim | new-prose — new words: reason, enough, useful | yes |
| Place value | verbatim | verbatim-or-shortened | yes |

- **Rule:** `Complete Summary: Report Center + Spread` → **no-source-in-lesson** (words absent from the lesson: summar, report, center, spread)
- **Meaning:** Give median with IQR, or mean with MAD.
- **Example:** `Median = 15 points, IQR = 6 points` → **numbers-from-lesson**

### 3-1 — Understand Ratios

Declared vocabulary entries: 8

| Term | Term provenance | Definition provenance | Used elsewhere in lesson |
| --- | --- | --- | --- |
| Ratio | verbatim | reworded — new words: divisi | yes |
| Comparison | verbatim | verbatim-or-shortened | yes |
| Part-to-part | verbatim | verbatim-or-shortened | yes |
| Part-to-whole | verbatim | reworded — new words: group | yes |
| Colon notation | verbatim | verbatim-or-shortened | yes |

- **Rule:** `Ratio: Compare two quantities using a : b, a to b, or a/b` → **no-source-in-lesson** (words absent from the lesson: a/b)
- **Meaning:** A ratio compares part to part or part to whole.
- **Example:** `3 cups flour : 2 cups sugar` → **numbers-from-lesson**

### 3-2 — Understand Rates and Unit Rates

Declared vocabulary entries: 8

| Term | Term provenance | Definition provenance | Used elsewhere in lesson |
| --- | --- | --- | --- |
| Rate | verbatim | verbatim-or-shortened | yes |
| Unit Rate | verbatim | new-prose — new words: exactl, unit, item | yes |
| Per | verbatim | new-prose — new words: single, unit, item | yes |
| Ratio | verbatim | reworded — new words: divisi | yes |
| Unit price | verbatim | reworded — new words: single | yes |

- **Rule:** `Unit Rate = Total Quantity ÷ Number of Units` → **stated-in-lesson-different-wording**
- **Meaning:** Divide to find the rate for 1 single unit.
- **Example:** `$3 ÷ 5 games = $0.60 per game` → **numbers-from-lesson**

### 3-3 — Determine Equivalent Ratios Using Tables

Declared vocabulary entries: 6

| Term | Term provenance | Definition provenance | Used elsewhere in lesson |
| --- | --- | --- | --- |
| Ratio Tables | verbatim | verbatim-or-shortened | yes |
| Ratio table | verbatim | new-prose — new words: showin, pairs, equiva | yes |
| Equivalent ratio | verbatim | verbatim-or-shortened | yes |
| Scale factor | verbatim | verbatim-or-shortened | yes |
| Pattern | verbatim | new-prose — new words: shapes, change, predic, way | yes |

- **Rule:** `Equivalent Ratios: Multiply or divide both parts by same number` → **stated-in-lesson-different-wording**
- **Meaning:** Scale both terms by the exact same multiplier.
- **Example:** `3 : 2 = (3 × 4) : (2 × 4) = 12 : 8` → **numbers-from-lesson**

### 3-4 — Determine Equivalent Ratios Using Graphs

Declared vocabulary entries: 7

| Term | Term provenance | Definition provenance | Used elsewhere in lesson |
| --- | --- | --- | --- |
| Graph Ratio Tables | verbatim | reworded — new words: pairs | yes |
| Coordinate plane | verbatim | new-prose — new words: formed, inters, number, lines | yes |
| Ordered pair | verbatim | reworded — new words: showin, grid | yes |
| Linear pattern | verbatim | reworded — new words: grid | yes |
| Proportional | verbatim | reworded — new words: rate | yes |

- **Rule:** `Ratio Table: Each column forms an equivalent ratio` → **stated-in-lesson-different-wording**
- **Meaning:** Multiply row values by constant factor across columns.
- **Example:** `1 to 3, 2 to 6, 3 to 9` → **numbers-from-lesson**

### 3-5 — Compare Ratio Relationships

Declared vocabulary entries: 6

| Term | Term provenance | Definition provenance | Used elsewhere in lesson |
| --- | --- | --- | --- |
| Compare Ratios | verbatim | verbatim-or-shortened | yes |
| Unit rate | verbatim | new-prose — new words: exactl, unit, item | yes |
| Equivalent ratio | verbatim | reworded — new words: thing | yes |
| Compare | verbatim | verbatim-or-shortened | yes |
| Simplify | verbatim | verbatim-or-shortened | yes |

- **Rule:** `Unit Price = Total Cost ÷ Number of Items` → **stated-in-lesson-different-wording**
- **Meaning:** Find the cost of 1 item to find best deal.
- **Example:** `$12 ÷ 4 boxes = $3 per box` → **numbers-from-lesson**

### 3-6 — Ratio Reasoning: Convert Measurements within the Same System

Declared vocabulary entries: 7

| Term | Term provenance | Definition provenance | Used elsewhere in lesson |
| --- | --- | --- | --- |
| Convert Measurements within the Same System | verbatim | verbatim-or-shortened | yes |
| Conversion factor | verbatim | verbatim-or-shortened | yes |
| Unit ratio | verbatim | verbatim-or-shortened | yes |
| Convert | verbatim | verbatim-or-shortened | yes |
| Measurement system | verbatim | verbatim-or-shortened | yes |

- **Rule:** `Distance = Speed × Time` → **no-source-in-lesson** (words absent from the lesson: distan, speed)
- **Meaning:** Multiply speed by time traveled to find distance.
- **Example:** `45 miles/hour × 2 hours = 90 miles` → **numbers-chosen-not-from-lesson** (numbers absent from the lesson: 90)

### 3-7 — Ratio Reasoning: Convert Measurements Between Systems

Declared vocabulary entries: 6

| Term | Term provenance | Definition provenance | Used elsewhere in lesson |
| --- | --- | --- | --- |
| Convert Measurements Between Systems | verbatim | verbatim-or-shortened | yes |
| Conversion factor | verbatim | verbatim-or-shortened | yes |
| Customary system | verbatim | verbatim-or-shortened | **no** |
| Metric system | verbatim | verbatim-or-shortened | yes |
| Approximately | verbatim | reworded — new words: equal | yes |

- **Rule:** `Unit Conversion: Multiply by unit conversion ratio` → **stated-in-lesson-different-wording**
- **Meaning:** Multiply by conversion factor so old units cancel out.
- **Example:** `5 feet × 12 inches/foot = 60 inches` → **numbers-from-lesson**

### 3-8 — Solve Problems with Unit Rates

Declared vocabulary entries: 7

| Term | Term provenance | Definition provenance | Used elsewhere in lesson |
| --- | --- | --- | --- |
| Unit Rate Problem Solving | verbatim | verbatim-or-shortened | **no** |
| Unit Rate | verbatim | new-prose — new words: exactl, unit, item | yes |
| Better Buy | verbatim | reworded — new words: item | yes |
| Comparison | verbatim | verbatim-or-shortened | yes |
| Per Unit | verbatim | reworded — new words: item | yes |

- **Rule:** `Double Number Line: Matching quantities align vertically` → **no-source-in-lesson** (words absent from the lesson: double, align, vertic)
- **Meaning:** Equivalent ratios share the same position on both lines.
- **Example:** `2 miles aligns with 10 minutes` → **numbers-from-lesson**

### 3-9 — Equivalent Ratios

Declared vocabulary entries: 6

| Term | Term provenance | Definition provenance | Used elsewhere in lesson |
| --- | --- | --- | --- |
| Equivalent Ratios | verbatim | reworded — new words: make, exact | yes |
| Ratio | verbatim | reworded — new words: divisi | yes |
| Rate | verbatim | verbatim-or-shortened | yes |
| Proportion | verbatim | reworded — new words: equal | yes |
| Simplify | verbatim | verbatim-or-shortened | yes |

- **Rule:** `Ratio Graph: Equivalent ratios form line through (0, 0)` → **stated-in-lesson-different-wording**
- **Meaning:** Plot (x, y) pairs on coordinate plane along a straight line.
- **Example:** `(1, 3), (2, 6), (3, 9) all lie on one ray` → **numbers-from-lesson**

### 3-10 — Convert Measurement Units

Declared vocabulary entries: 8

| Term | Term provenance | Definition provenance | Used elsewhere in lesson |
| --- | --- | --- | --- |
| Convert Measurement Units | verbatim | verbatim-or-shortened | yes |
| Conversion Factor | verbatim | verbatim-or-shortened | yes |
| Unit | verbatim | verbatim-or-shortened | yes |
| Equivalent | verbatim | reworded — new words: units | yes |
| Ratio | verbatim | reworded — new words: divisi | yes |

- **Rule:** `Compare Rates: Lower unit price is better buy` → **no-source-in-lesson** (words absent from the lesson: lower, price, better, buy)
- **Meaning:** Compute unit rates for both options and compare.
- **Example:** `$0.50 per ounce is cheaper than $0.60 per ounce` → **numbers-chosen-not-from-lesson** (numbers absent from the lesson: 0.5, 0.6)

### 4-1 — Understand Percent

Declared vocabulary entries: 6

| Term | Term provenance | Definition provenance | Used elsewhere in lesson |
| --- | --- | --- | --- |
| Percent | verbatim | new-prose — new words: part, fracti, out, 100 | yes |
| Per hundred | verbatim | verbatim-or-shortened | yes |
| Decimal grid | verbatim | verbatim-or-shortened | yes |
| Part-to-whole | verbatim | verbatim-or-shortened | yes |
| Greater than 100% | verbatim | reworded — new words: whole | yes |

- **Rule:** `Percent: A part out of 100` → **stated-in-lesson-different-wording**
- **Meaning:** Write percent as fraction over 100 or decimal.
- **Example:** `35% = 35 ÷ 100 = 0.35` → **numbers-chosen-not-from-lesson** (numbers absent from the lesson: 0.35)

### 4-2 — Relate Fractions, Decimals, and Percentages

Declared vocabulary entries: 6

| Term | Term provenance | Definition provenance | Used elsewhere in lesson |
| --- | --- | --- | --- |
| Fractions, Decimals, and Percents | verbatim | reworded — new words: whole | yes |
| Percent | verbatim | new-prose — new words: part, fracti, out | yes |
| Decimal | verbatim | verbatim-or-shortened | yes |
| Equivalent | verbatim | reworded — new words: way | yes |
| Benchmark | verbatim | reworded — new words: 1/2 | yes |

- **Rule:** `Part = Percent (as decimal) × Whole Amount` → **stated-in-lesson-different-wording**
- **Meaning:** Multiply the percent decimal by the whole total.
- **Example:** `20% of 80 = 0.20 × 80 = 16` → **numbers-from-lesson**

### 4-3 — Estimate the Percent of a Number

Declared vocabulary entries: 5

| Term | Term provenance | Definition provenance | Used elsewhere in lesson |
| --- | --- | --- | --- |
| estimate | verbatim | verbatim-or-shortened | yes |
| benchmark percent | verbatim | reworded — new words: like | yes |
| compatible numbers | verbatim | verbatim-or-shortened | yes |
| double number line | verbatim | verbatim-or-shortened | yes |
| the whole | verbatim | verbatim-or-shortened | yes |

- **Rule:** `Benchmark Percents: 10% = ÷ 10, 50% = ÷ 2, 25% = ÷ 4` → **stated-in-lesson-different-wording**
- **Meaning:** Use easy landmark percents to estimate values.
- **Example:** `10% of 60 = 6, so 20% = 12` → **numbers-chosen-not-from-lesson** (numbers absent from the lesson: 12)

### 4-4 — Find and Compare with Percentages

Declared vocabulary entries: 6

| Term | Term provenance | Definition provenance | Used elsewhere in lesson |
| --- | --- | --- | --- |
| Percent of a Number | verbatim | new-prose — new words: findin, portio, out, 100, quanti | yes |
| Percent | verbatim | new-prose — new words: part, fracti, out | yes |
| Base | verbatim | new-prose — new words: bottom, side, polygo | yes |
| Part | verbatim | reworded — new words: get | yes |
| Equation | verbatim | new-prose — new words: math, showin, expres, have, value | yes |

- **Rule:** `Whole = Part ÷ Percent (as decimal)` → **stated-in-lesson-different-wording**
- **Meaning:** Divide the given part by the percent decimal.
- **Example:** `15 is 30% of Whole → 15 ÷ 0.30 = 50` → **numbers-from-lesson**

### 4-5 — Determine the Whole Given the Part and Percent

Declared vocabulary entries: 6

| Term | Term provenance | Definition provenance | Used elsewhere in lesson |
| --- | --- | --- | --- |
| Determine the Whole Given the Part and Percent | verbatim | verbatim-or-shortened | yes |
| Part | verbatim | verbatim-or-shortened | yes |
| Whole | verbatim | verbatim-or-shortened | yes |
| Double number line | verbatim | verbatim-or-shortened | yes |
| Equation | verbatim | new-prose — new words: showin, expres, have, value | yes |

- **Rule:** `Find Percent: (Part ÷ Whole) × 100%` → **stated-in-lesson-different-wording**
- **Meaning:** Divide part by whole, then multiply by 100.
- **Example:** `18 ÷ 24 = 0.75 = 75%` → **numbers-chosen-not-from-lesson** (numbers absent from the lesson: 0.75)

### 5-1 — Determine the Area of Parallelograms and Rhombuses

Declared vocabulary entries: 10

| Term | Term provenance | Definition provenance | Used elsewhere in lesson |
| --- | --- | --- | --- |
| Area of Parallelograms | verbatim | verbatim-or-shortened | yes |
| Slanted side | verbatim | reworded — new words: down | yes |
| Parallelogram | verbatim | reworded — new words: opposi, sides | yes |
| Parallel | verbatim | verbatim-or-shortened | yes |
| Base | verbatim | reworded — new words: bottom, polygo | yes |

- **Rule:** `Area of Parallelogram: A = base × height` → **stated-in-lesson-different-wording**
- **Meaning:** Multiply base by perpendicular height.
- **Example:** `8 cm × 5 cm = 40 cm²` → **numbers-from-lesson**

### 5-2 — Determine the Area of Triangles

Declared vocabulary entries: 8

| Term | Term provenance | Definition provenance | Used elsewhere in lesson |
| --- | --- | --- | --- |
| Area of a Triangle | verbatim | verbatim-or-shortened | yes |
| Base | verbatim | reworded — new words: bottom, polygo | yes |
| Height | verbatim | new-prose — new words: perpen, opposi, side | yes |
| Area | verbatim | new-prose — new words: number, square, units, coveri, surfac | yes |
| Perpendicular | verbatim | verbatim-or-shortened | yes |

- **Rule:** `Area of Triangle: A = ½ × base × height` → **stated-in-lesson-different-wording**
- **Meaning:** Multiply base by height and divide by 2.
- **Example:** `½ × 10 in × 6 in = 30 in²` → **numbers-from-lesson**

### 5-3 — Determine the Area of Trapezoids

Declared vocabulary entries: 8

| Term | Term provenance | Definition provenance | Used elsewhere in lesson |
| --- | --- | --- | --- |
| Area of Trapezoids | verbatim | verbatim-or-shortened | yes |
| Trapezoid | verbatim | reworded — new words: least, sides | yes |
| Parallel | verbatim | verbatim-or-shortened | yes |
| Base 1 (b1) | verbatim | verbatim-or-shortened | yes |
| Base 2 (b2) | verbatim | verbatim-or-shortened | yes |

- **Rule:** `Area of Trapezoid: A = ½ × (base₁ + base₂) × height` → **stated-in-lesson-different-wording**
- **Meaning:** Add the two parallel bases, multiply by height, divide by 2.
- **Example:** `½ × (6 + 10) × 4 = 32 cm²` → **numbers-from-lesson**

### 5-4 — Apply Area Concepts to Solve Problems

Declared vocabulary entries: 6

| Term | Term provenance | Definition provenance | Used elsewhere in lesson |
| --- | --- | --- | --- |
| Area of Composite Figures | verbatim | verbatim-or-shortened | yes |
| Composite Figure | verbatim | verbatim-or-shortened | yes |
| Decompose | verbatim | new-prose — new words: number, parts, rebuil | yes |
| Add | verbatim | verbatim-or-shortened | yes |
| Subtract | verbatim | verbatim-or-shortened | yes |

- **Rule:** `Composite Area = Sum of simpler polygon areas` → **stated-in-lesson-different-wording**
- **Meaning:** Decompose shape into rectangles and triangles, then add areas.
- **Example:** `Area = Rectangle (20) + Triangle (6) = 26` → **numbers-from-lesson**

### 5-5 — Determine the Volume of Rectangular Prisms

Declared vocabulary entries: 7

| Term | Term provenance | Definition provenance | Used elsewhere in lesson |
| --- | --- | --- | --- |
| Volume with Whole-Number Edges | verbatim | reworded — new words: prism | **no** |
| Volume | verbatim | new-prose — new words: total, three-, shape | yes |
| Rectangular prism | verbatim | reworded — new words: faces | yes |
| Cubic units | verbatim | new-prose — new words: unit, cubes, volume, shape | yes |
| Length, width, height | verbatim | verbatim-or-shortened | yes |

- **Rule:** `Polygon Area on Grid: Count units or use A = b × h` → **no-source-in-lesson** (words absent from the lesson: polygo, grid)
- **Meaning:** Find side lengths along grid lines, then apply area formula.
- **Example:** `Base = 6 units, Height = 4 units → Area = 24` → **numbers-from-lesson**

### 5-6 — Represent Three-Dimensional Figures in Two Dimensions

Declared vocabulary entries: 6

| Term | Term provenance | Definition provenance | Used elsewhere in lesson |
| --- | --- | --- | --- |
| Surface Area Using Nets | verbatim | verbatim-or-shortened | yes |
| Surface area | verbatim | new-prose — new words: outsid, faces, solid | yes |
| Net | verbatim | reworded — new words: patter, solid | yes |
| Face | verbatim | reworded — new words: shape | yes |
| Two-dimensional | verbatim | verbatim-or-shortened | yes |

- **Rule:** `Net: 2D flat pattern of 3D solid faces` → **stated-in-lesson-different-wording**
- **Meaning:** Unfold a 3D prism to see all its flat 2D faces.
- **Example:** `Rectangular prism unfolds into 6 rectangles` → **numbers-from-lesson**

### 5-7 — Determine Surface Area of Prisms

Declared vocabulary entries: 7

| Term | Term provenance | Definition provenance | Used elsewhere in lesson |
| --- | --- | --- | --- |
| Surface area | verbatim | new-prose — new words: outsid, faces, solid | yes |
| Rectangular prism | verbatim | reworded — new words: faces | yes |
| Triangular prism | verbatim | reworded — new words: sides | yes |
| Face | verbatim | reworded — new words: shape | yes |
| Net | verbatim | reworded — new words: patter, solid | yes |

- **Rule:** `Surface Area = Sum of areas of all outside faces` → **stated-in-lesson-different-wording**
- **Meaning:** Calculate the area of every face and add them up.
- **Example:** `2(12) + 2(15) + 2(20) = 94 cm²` → **numbers-from-lesson**

### 5-8 — Determine Surface Area of Pyramids

Declared vocabulary entries: 7

| Term | Term provenance | Definition provenance | Used elsewhere in lesson |
| --- | --- | --- | --- |
| Surface Area of Pyramids | verbatim | reworded — new words: faces | yes |
| Pyramid | verbatim | verbatim-or-shortened | yes |
| Slant height | verbatim | reworded — new words: face | yes |
| Lateral face | verbatim | verbatim-or-shortened | yes |
| Base | verbatim | reworded — new words: side, polygo | yes |

- **Rule:** `Surface Area of Triangular Prism = 2 Triangles + 3 Rectangles` → **stated-in-lesson-different-wording**
- **Meaning:** Find area of both triangular bases and three side faces.
- **Example:** `2(12) + 30 + 40 + 50 = 144 cm²` → **numbers-chosen-not-from-lesson** (numbers absent from the lesson: 50)

### 5-9 — Area of Regular Polygons

Declared vocabulary entries: 6

| Term | Term provenance | Definition provenance | Used elsewhere in lesson |
| --- | --- | --- | --- |
| Area of Regular Polygons | verbatim | verbatim-or-shortened | yes |
| Regular Polygon | verbatim | verbatim-or-shortened | yes |
| Decompose | verbatim | new-prose — new words: number, parts, rebuil | yes |
| Triangle | verbatim | new-prose — new words: three-, flat, angles | yes |
| Composite | verbatim | verbatim-or-shortened | yes |

- **Rule:** `Volume with Unit Cubes: Count 1-unit cubes inside` → **no-source-in-lesson** (words absent from the lesson: volume, cubes, 1-unit, cubes)
- **Meaning:** Count how many 1-unit cubes fill the solid box.
- **Example:** `3 layers of 12 cubes = 36 cubic units` → **numbers-from-lesson**

### 5-10 — Volume of Rectangular Prisms

Declared vocabulary entries: 6

| Term | Term provenance | Definition provenance | Used elsewhere in lesson |
| --- | --- | --- | --- |
| Volume | verbatim | new-prose — new words: total, three-, shape | yes |
| Rectangular prism | verbatim | reworded — new words: faces | yes |
| Cubic units | verbatim | new-prose — new words: unit, cubes, volume, shape | yes |
| Dimensions | verbatim | new-prose — new words: length, width, height | yes |
| Base area | verbatim | reworded — new words: face, prism | yes |

- **Rule:** `Volume of Rectangular Prism: V = length × width × height` → **stated-in-lesson-different-wording**
- **Meaning:** Multiply length by width by height in cubic units.
- **Example:** `2 ft × 1.5 ft × 1 ft = 3 cubic feet` → **numbers-from-lesson**

### 6-1 — Division Expressions with Fractions and Whole Numbers

Declared vocabulary entries: 6

| Term | Term provenance | Definition provenance | Used elsewhere in lesson |
| --- | --- | --- | --- |
| Division of Fractions | verbatim | verbatim-or-shortened | yes |
| Dividend | verbatim | new-prose — new words: being, split, equal, parts | yes |
| Divisor | verbatim | reworded — new words: divide | yes |
| Quotient | verbatim | reworded — new words: divisi, proble | yes |
| Reciprocal | verbatim | reworded — new words: flippe, down | yes |

- **Rule:** `Fraction Division: Total ÷ Portion Size = Number of Portions` → **no-source-in-lesson** (words absent from the lesson: portio, portio)
- **Meaning:** Find how many equal fraction parts fit into total.
- **Example:** `2 ÷ ¼ = 8 fourths` → **numbers-from-lesson**

### 6-2 — Division Expressions with Fractions and Mixed Numbers

Declared vocabulary entries: 8

| Term | Term provenance | Definition provenance | Used elsewhere in lesson |
| --- | --- | --- | --- |
| Dividend | verbatim | new-prose — new words: being, split, equal, parts | yes |
| Divisor | verbatim | reworded — new words: divide | yes |
| Reciprocal | verbatim | reworded — new words: flippe, down | yes |
| Quotient | verbatim | reworded — new words: divisi, proble | yes |
| Simplify | verbatim | verbatim-or-shortened | yes |

- **Rule:** `Divide Fractions: a/b ÷ c/d = a/b × d/c` → **no-source-in-lesson** (words absent from the lesson: a/b, c/d, a/b, d/c)
- **Meaning:** Multiply the first fraction by the reciprocal of the second.
- **Example:** `¾ ÷ ⅛ = ¾ × 8/1 = 6` → **numbers-from-lesson**

### 6-3 — Explore Numerical Expressions with Exponents

Declared vocabulary entries: 5

| Term | Term provenance | Definition provenance | Used elsewhere in lesson |
| --- | --- | --- | --- |
| Powers and Exponents | verbatim | verbatim-or-shortened | yes |
| Exponent | verbatim | verbatim-or-shortened | yes |
| Base | verbatim | new-prose — new words: bottom, side, polygo | yes |
| Power | verbatim | verbatim-or-shortened | yes |
| Evaluate | verbatim | verbatim-or-shortened | yes |

- **Rule:** `Mixed Number Division: Rewrite as improper fractions first` → **belongs-to-other-lesson** — the mathematics this names belongs to 6-2, 6-10, 6-11 (words absent from the lesson: divisi, improp, fracti)
- **Meaning:** Convert mixed numbers to fractions, then multiply by reciprocal.
- **Example:** `2½ ÷ ½ = 5/2 × 2/1 = 5` → **numbers-from-lesson**

### 6-4 — Write and Evaluate Numerical Expressions with Exponents

Declared vocabulary entries: 7

| Term | Term provenance | Definition provenance | Used elsewhere in lesson |
| --- | --- | --- | --- |
| Write and Evaluate Numerical Expressions with Exponents | verbatim | verbatim-or-shortened | yes |
| Numerical expression | verbatim | verbatim-or-shortened | yes |
| Evaluate | verbatim | verbatim-or-shortened | yes |
| Order of operations | verbatim | verbatim-or-shortened | yes |
| Power | verbatim | verbatim-or-shortened | yes |

- **Rule:** `Fraction Story Problem: Whole ÷ Part Size = Count` → **no-source-in-lesson** (words absent from the lesson: fracti, size)
- **Meaning:** Divide the total amount by size of one group.
- **Example:** `¾ lb ÷ ⅛ lb = 6 portions` → **numbers-from-lesson**

### 6-5 — Write and Evaluate Algebraic Expressions

Declared vocabulary entries: 8

| Term | Term provenance | Definition provenance | Used elsewhere in lesson |
| --- | --- | --- | --- |
| Write Algebraic Expressions | verbatim | verbatim-or-shortened | yes |
| Variable | verbatim | reworded — new words: repres, changi | yes |
| Algebraic Expression | verbatim | new-prose — new words: number, variab, operat, symbol | yes |
| Coefficient | verbatim | reworded — new words: multip, variab | yes |
| Constant | verbatim | new-prose — new words: whose, value, never | yes |

- **Rule:** `Add/Subtract Decimals: Line up decimal points vertically` → **no-source-in-lesson** (words absent from the lesson: add/su, decima, decima, vertic)
- **Meaning:** Align matching place values before adding or subtracting.
- **Example:** `12.45 + 3.80 = 16.25` → **numbers-chosen-not-from-lesson** (numbers absent from the lesson: 12.45, 3.8, 16.25)

### 6-6 — Identify Equivalent Algebraic Expressions

Declared vocabulary entries: 6

| Term | Term provenance | Definition provenance | Used elsewhere in lesson |
| --- | --- | --- | --- |
| Equivalent Expressions | verbatim | verbatim-or-shortened | yes |
| Equivalent | verbatim | reworded — new words: value | yes |
| Simplify | verbatim | verbatim-or-shortened | yes |
| Like Terms | verbatim | new-prose — new words: having, exact, variab | yes |
| Combine | verbatim | verbatim-or-shortened | yes |

- **Rule:** `Multiply Decimals: Count total decimal places in factors` → **no-source-in-lesson** (words absent from the lesson: decima, decima)
- **Meaning:** Multiply as whole numbers, then place decimal point in product.
- **Example:** `0.4 × 0.2 = 0.08 (2 decimal places)` → **numbers-chosen-not-from-lesson** (numbers absent from the lesson: 0.4, 0.2, 0.08)

### 6-7 — Find Factors and Multiples

Declared vocabulary entries: 7

| Term | Term provenance | Definition provenance | Used elsewhere in lesson |
| --- | --- | --- | --- |
| Find Factors and Multiples | verbatim | verbatim-or-shortened | yes |
| Factor | verbatim | verbatim-or-shortened | yes |
| Multiple | verbatim | verbatim-or-shortened | yes |
| Greatest common factor (GCF) | verbatim | verbatim-or-shortened | **no** |
| Least common multiple (LCM) | verbatim | verbatim-or-shortened | **no** |

- **Rule:** `Divide Decimal by Whole: Place decimal point straight up` → **no-source-in-lesson** (words absent from the lesson: place, point)
- **Meaning:** Align decimal point in quotient directly above dividend.
- **Example:** `14.8 ÷ 4 = 3.7` → **numbers-chosen-not-from-lesson** (numbers absent from the lesson: 14.8, 3.7)

### 6-8 — Generate Equivalent Expressions

Declared vocabulary entries: 6

| Term | Term provenance | Definition provenance | Used elsewhere in lesson |
| --- | --- | --- | --- |
| Properties of Operations | verbatim | verbatim-or-shortened | yes |
| Commutative Property | verbatim | verbatim-or-shortened | yes |
| Associative Property | verbatim | verbatim-or-shortened | yes |
| Identity Property | verbatim | reworded — new words: value | yes |
| Property | verbatim | reworded — new words: math | yes |

- **Rule:** `Divide by Decimal: Multiply divisor and dividend by power of 10` → **belongs-to-other-lesson** — the mathematics this names belongs to 2-7, 6-12 (words absent from the lesson: divide, decima, diviso, divide, power)
- **Meaning:** Shift decimal in divisor to make it a whole number.
- **Example:** `6.4 ÷ 0.2 → 64 ÷ 2 = 32` → **numbers-chosen-not-from-lesson** (numbers absent from the lesson: 6.4, 32)

### 6-9 — Divide Whole Numbers by Fractions

Declared vocabulary entries: 6

| Term | Term provenance | Definition provenance | Used elsewhere in lesson |
| --- | --- | --- | --- |
| Divide Whole Numbers by Fractions | verbatim | verbatim-or-shortened | yes |
| Whole Number | verbatim | verbatim-or-shortened | yes |
| Fraction | verbatim | reworded — new words: 3/4 | yes |
| Reciprocal | verbatim | reworded — new words: flippe, down | yes |
| Keep, Change, Flip | verbatim | verbatim-or-shortened | yes |

- **Rule:** `Greatest Common Factor: Largest factor shared by numbers` → **belongs-to-other-lesson** — the mathematics this names belongs to 6-7, 6-12 (words absent from the lesson: factor, larges, factor, shared)
- **Meaning:** Find the biggest number that divides evenly into both.
- **Example:** `Factors of 12 and 18: GCF = 6` → **numbers-from-lesson**

### 6-10 — Divide Mixed Numbers

Declared vocabulary entries: 6

| Term | Term provenance | Definition provenance | Used elsewhere in lesson |
| --- | --- | --- | --- |
| Divide Mixed Numbers | verbatim | verbatim-or-shortened | yes |
| Mixed Number | verbatim | reworded — new words: 1/3 | yes |
| Improper Fraction | verbatim | verbatim-or-shortened | yes |
| Convert | verbatim | verbatim-or-shortened | yes |
| Simplify | verbatim | verbatim-or-shortened | yes |

- **Rule:** `Least Common Multiple: Smallest multiple shared by numbers` → **no-source-in-lesson** (words absent from the lesson: least, shared)
- **Meaning:** Find the smallest positive multiple in both lists.
- **Example:** `Multiples of 4 and 6: LCM = 12` → **numbers-from-lesson**

### 6-11 — Fraction Division Problem Solving

Declared vocabulary entries: 6

| Term | Term provenance | Definition provenance | Used elsewhere in lesson |
| --- | --- | --- | --- |
| Fraction Division Problem Solving | verbatim | verbatim-or-shortened | yes |
| Model | verbatim | verbatim-or-shortened | yes |
| Equation | verbatim | new-prose — new words: expres, have, value | yes |
| Solution | verbatim | reworded — new words: value, true | yes |
| Reasonableness | verbatim | new-prose — new words: whethe, good, sense | yes |

- **Rule:** `Distributive Property: a(b + c) = ab + ac` → **no-source-in-lesson** (words absent from the lesson: distri)
- **Meaning:** Factor out the GCF from the sum of two terms.
- **Example:** `24 + 36 = 12(2 + 3)` → **numbers-from-lesson**

### 6-12 — Least Common Multiple

Declared vocabulary entries: 5

| Term | Term provenance | Definition provenance | Used elsewhere in lesson |
| --- | --- | --- | --- |
| Least Common Multiple | verbatim | reworded — new words: smalle, shared | yes |
| Multiple | verbatim | verbatim-or-shortened | yes |
| Common multiple | verbatim | verbatim-or-shortened | yes |
| Skip counting | verbatim | verbatim-or-shortened | yes |
| Prime factorization | verbatim | verbatim-or-shortened | yes |

- **Rule:** `Long Division: Divide → Multiply → Subtract → Bring Down` → **no-source-in-lesson** (words absent from the lesson: subtra, bring)
- **Meaning:** Repeat division steps for each place value digit.
- **Example:** `528 ÷ 12 = 44` → **numbers-chosen-not-from-lesson** (numbers absent from the lesson: 528)

### 6-13 — Prime Factorization

Declared vocabulary entries: 6

| Term | Term provenance | Definition provenance | Used elsewhere in lesson |
| --- | --- | --- | --- |
| Prime Factorization | verbatim | verbatim-or-shortened | yes |
| Prime number | verbatim | verbatim-or-shortened | yes |
| Composite number | verbatim | verbatim-or-shortened | yes |
| Factor | verbatim | verbatim-or-shortened | yes |
| Factor tree | verbatim | verbatim-or-shortened | yes |

- **Rule:** `Multi-Step Decimals: Follow order of operations` → **no-source-in-lesson** (words absent from the lesson: multi-, operat)
- **Meaning:** Compute parentheses first, then multiply/divide, then add/subtract.
- **Example:** `(4.5 × 2) + 1.75 = 9 + 1.75 = 10.75` → **numbers-chosen-not-from-lesson** (numbers absent from the lesson: 4.5, 1.75, 10.75)

### 6-14 — The Distributive Property

Declared vocabulary entries: 7

| Term | Term provenance | Definition provenance | Used elsewhere in lesson |
| --- | --- | --- | --- |
| The Distributive Property | verbatim | verbatim-or-shortened | yes |
| Distributive Property | verbatim | new-prose — new words: sum, addend, separa | yes |
| Factor | verbatim | verbatim-or-shortened | yes |
| Expand | verbatim | verbatim-or-shortened | yes |
| Equivalent | verbatim | reworded — new words: value | yes |

- **Rule:** `Multi-Step Fractions: Simplify before multiplying` → **belongs-to-other-lesson** — the mathematics this names belongs to 4-4, 6-11, 7-2 (words absent from the lesson: multi-, fracti)
- **Meaning:** Cancel common factors to make calculation simpler.
- **Example:** `½ + (¾ × ⅔) = ½ + ½ = 1` → **numbers-from-lesson**

### 6-15 — Simplify Algebraic Expressions

Declared vocabulary entries: 7

| Term | Term provenance | Definition provenance | Used elsewhere in lesson |
| --- | --- | --- | --- |
| Simplify Algebraic Expressions | verbatim | verbatim-or-shortened | yes |
| Like Terms | verbatim | new-prose — new words: having, exact, variab | yes |
| Combine | verbatim | verbatim-or-shortened | yes |
| Simplify | verbatim | verbatim-or-shortened | yes |
| Coefficient | verbatim | reworded — new words: multip, variab | yes |

- **Rule:** `Money Math: Add costs, subtract discount, compute change` → **belongs-to-other-lesson** — the mathematics this names belongs to 4-4, 8-2 (words absent from the lesson: money, costs, discou)
- **Meaning:** Line up decimals when adding or subtracting dollars and cents.
- **Example:** `$20.00 − $14.65 = $5.35 change` → **numbers-chosen-not-from-lesson** (numbers absent from the lesson: 14.65, 5.35)

### 7-1 — Explore Integers and Their Opposites

Declared vocabulary entries: 5

| Term | Term provenance | Definition provenance | Used elsewhere in lesson |
| --- | --- | --- | --- |
| Integer | verbatim | new-prose — new words: positi, whole, negati, whole, zero | yes |
| Opposite | verbatim | new-prose — new words: zero, opposi, sides | yes |
| Negative number | verbatim | reworded — new words: zero | yes |
| Positive number | verbatim | reworded — new words: zero | yes |
| Number line | verbatim | reworded — new words: order | yes |

- **Rule:** `Negative Numbers: Sit to the left of zero on number line` → **stated-in-lesson-different-wording**
- **Meaning:** Numbers less than zero have a minus sign.
- **Example:** `−5 is 5 units below zero` → **numbers-from-lesson**

### 7-2 — Represent Rational Numbers and Their Opposites on the Number Line

Declared vocabulary entries: 7

| Term | Term provenance | Definition provenance | Used elsewhere in lesson |
| --- | --- | --- | --- |
| Rational Numbers on the Number Line | verbatim | reworded — new words: line | yes |
| Rational number | verbatim | verbatim-or-shortened | yes |
| Fraction | verbatim | reworded — new words: 3/4 | yes |
| Decimal | verbatim | verbatim-or-shortened | yes |
| Number line | verbatim | verbatim-or-shortened | yes |

- **Rule:** `Opposites: −a and a are equal distance from zero` → **stated-in-lesson-different-wording**
- **Meaning:** Opposites sit on opposite sides of 0 on number line.
- **Example:** `Opposite of 6 is −6; opposite of −6 is 6` → **numbers-from-lesson**

### 7-3 — Understand Absolute Value of Rational Numbers

Declared vocabulary entries: 7

| Term | Term provenance | Definition provenance | Used elsewhere in lesson |
| --- | --- | --- | --- |
| Integers and Absolute Value | verbatim | verbatim-or-shortened | yes |
| Integer | verbatim | new-prose — new words: positi, negati, zero | yes |
| Positive | verbatim | verbatim-or-shortened | yes |
| Negative | verbatim | verbatim-or-shortened | yes |
| Absolute value | verbatim | new-prose — new words: distan, zero, line | yes |

- **Rule:** `Absolute Value: |a| = distance from zero` → **stated-in-lesson-different-wording**
- **Meaning:** Distance is always positive or zero, never negative.
- **Example:** `|−7| = 7 and |7| = 7` → **numbers-from-lesson**

### 7-4 — Compare and Order Integers and Rational Numbers

Declared vocabulary entries: 8

| Term | Term provenance | Definition provenance | Used elsewhere in lesson |
| --- | --- | --- | --- |
| Number line | verbatim | verbatim-or-shortened | yes |
| Compare | verbatim | verbatim-or-shortened | yes |
| Order | verbatim | verbatim-or-shortened | yes |
| Greater than | verbatim | verbatim-or-shortened | yes |
| Less than | verbatim | verbatim-or-shortened | yes |

- **Rule:** `Compare Rational Numbers: Left is less, Right is greater` → **stated-in-lesson-different-wording**
- **Meaning:** A number farther left on the number line is smaller.
- **Example:** `−7 < −5 because −7 is farther left` → **numbers-from-lesson**

### 7-5 — Represent Rational Numbers on the Coordinate Plane

Declared vocabulary entries: 7

| Term | Term provenance | Definition provenance | Used elsewhere in lesson |
| --- | --- | --- | --- |
| Graph on the Coordinate Plane | verbatim | verbatim-or-shortened | yes |
| Coordinate plane | verbatim | new-prose — new words: formed, inters, number, lines | yes |
| Ordered pair | verbatim | reworded — new words: showin, grid | yes |
| Origin | verbatim | reworded — new words: axes, cross | yes |
| Quadrant | verbatim | reworded — new words: quarte, plane | yes |

- **Rule:** `Coordinate Point: (x, y) = (horizontal, vertical)` → **stated-in-lesson-different-wording**
- **Meaning:** Move along x-axis first, then move along y-axis.
- **Example:** `(3, −4) moves 3 right, 4 down` → **numbers-from-lesson**

### 7-6 — Determine Distance on the Coordinate Plane

Declared vocabulary entries: 7

| Term | Term provenance | Definition provenance | Used elsewhere in lesson |
| --- | --- | --- | --- |
| Distance on the Coordinate Plane | verbatim | verbatim-or-shortened | yes |
| Distance | verbatim | verbatim-or-shortened | yes |
| Absolute value | verbatim | new-prose — new words: distan, zero, line | yes |
| Horizontal distance | verbatim | reworded — new words: right | yes |
| Vertical distance | verbatim | reworded — new words: down | yes |

- **Rule:** `Four Quadrants: I (+, +), II (−, +), III (−, −), IV (+, −)` → **stated-in-lesson-different-wording**
- **Meaning:** Signs of the coordinates show which quadrant point lands in.
- **Example:** `(−3, 5) is in Quadrant II` → **numbers-from-lesson**

### 7-7 — Represent Polygons on the Coordinate Plane

Declared vocabulary entries: 5

| Term | Term provenance | Definition provenance | Used elsewhere in lesson |
| --- | --- | --- | --- |
| vertex | verbatim | verbatim-or-shortened | yes |
| polygon | verbatim | verbatim-or-shortened | yes |
| perimeter | verbatim | verbatim-or-shortened | yes |
| distance between vertices | verbatim | verbatim-or-shortened | yes |
| scale | verbatim | verbatim-or-shortened | yes |

- **Rule:** `Reflection: Reflecting across an axis changes opposite coordinate sign` → **belongs-to-other-lesson** — the mathematics this names belongs to 7-6, 7-8, 7-9 (words absent from the lesson: reflec, reflec, across)
- **Meaning:** Over x-axis changes y sign; over y-axis changes x sign.
- **Example:** `(2, 3) reflected over y-axis is (−2, 3)` → **numbers-from-lesson**

### 7-8 — Ordered Pairs in All Four Quadrants

Declared vocabulary entries: 6

| Term | Term provenance | Definition provenance | Used elsewhere in lesson |
| --- | --- | --- | --- |
| Ordered Pairs in All Four Quadrants | verbatim | verbatim-or-shortened | yes |
| Quadrant | verbatim | reworded — new words: quarte, plane | yes |
| Negative coordinate | verbatim | reworded — new words: zero | yes |
| Reflection | verbatim | reworded — new words: line | yes |
| Axis | verbatim | verbatim-or-shortened | yes |

- **Rule:** `Grid Distance: |a − b| along horizontal or vertical line` → **stated-in-lesson-different-wording**
- **Meaning:** Subtract coordinates with different values and take absolute value.
- **Example:** `Distance between (−2, 4) and (5, 4) = 7 units` → **numbers-from-lesson**

### 7-9 — Reflect Points Across Axes

Declared vocabulary entries: 7

| Term | Term provenance | Definition provenance | Used elsewhere in lesson |
| --- | --- | --- | --- |
| Reflect Points Across Axes | verbatim | verbatim-or-shortened | yes |
| Reflection | verbatim | reworded — new words: line | yes |
| x-axis | verbatim | reworded — new words: grid | yes |
| y-axis | verbatim | reworded — new words: grid | yes |
| Symmetry | verbatim | verbatim-or-shortened | yes |

- **Rule:** `Coordinate Polygons: Connect vertices to find side lengths` → **no-source-in-lesson** (words absent from the lesson: polygo)
- **Meaning:** Plot (x, y) points, count grid units for sides, find area.
- **Example:** `Vertices (0,0), (6,0), (6,4), (0,4) form rectangle` → **numbers-from-lesson**

### 8-1 — Understand Equations and Their Solutions

Declared vocabulary entries: 9

| Term | Term provenance | Definition provenance | Used elsewhere in lesson |
| --- | --- | --- | --- |
| Equation | verbatim | new-prose — new words: expres, have, value | yes |
| Variable | verbatim | reworded — new words: repres, changi | yes |
| Equal sign | verbatim | reworded — new words: same | yes |
| Expression | verbatim | reworded — new words: sign | yes |
| Constant | verbatim | new-prose — new words: whose, value, never | **no** |

- **Rule:** `Equation: Left Expression = Right Expression` → **stated-in-lesson-different-wording**
- **Meaning:** An equation states that two expressions have equal value.
- **Example:** `x + 8 = 20` → **numbers-from-lesson**

### 8-2 — Write and Solve Equations Using Addition or Subtraction

Declared vocabulary entries: 7

| Term | Term provenance | Definition provenance | Used elsewhere in lesson |
| --- | --- | --- | --- |
| Solve One-Step Addition and Subtraction Equations | verbatim | verbatim-or-shortened | yes |
| Equation | verbatim | new-prose — new words: expres, have, value | yes |
| Inverse operation | verbatim | verbatim-or-shortened | yes |
| Isolate | verbatim | reworded — new words: side | yes |
| Solution | verbatim | reworded — new words: value, true | yes |

- **Rule:** `Evaluate Expression: Substitute given number for variable` → **belongs-to-other-lesson** — the mathematics this names belongs to 6-4, 6-5, 6-6 (words absent from the lesson: evalua)
- **Meaning:** Replace the letter with its value and calculate.
- **Example:** `If x = 5, then 3x + 2 = 3(5) + 2 = 17` → **numbers-chosen-not-from-lesson** (numbers absent from the lesson: 17)

### 8-3 — Write and Solve Equations Using Multiplication or Division

Declared vocabulary entries: 7

| Term | Term provenance | Definition provenance | Used elsewhere in lesson |
| --- | --- | --- | --- |
| Solve Multiplication and Division Equations | verbatim | verbatim-or-shortened | yes |
| Inverse operation | verbatim | verbatim-or-shortened | yes |
| Multiply | verbatim | verbatim-or-shortened | yes |
| Divide | verbatim | verbatim-or-shortened | yes |
| Isolate | verbatim | reworded — new words: side | yes |

- **Rule:** `Order of Operations: PEMDAS` → **no-source-in-lesson** (words absent from the lesson: pemdas)
- **Meaning:** Parentheses, Exponents, Multiply/Divide, Add/Subtract.
- **Example:** `4 + 2 × 3 = 4 + 6 = 10` → **numbers-from-lesson**

### 8-4 — Write and Represent Inequalities

Declared vocabulary entries: 7

| Term | Term provenance | Definition provenance | Used elsewhere in lesson |
| --- | --- | --- | --- |
| Write Inequalities | verbatim | verbatim-or-shortened | yes |
| Inequality | verbatim | reworded — new words: quanti | yes |
| Greater than | verbatim | verbatim-or-shortened | yes |
| Less than | verbatim | verbatim-or-shortened | yes |
| At least / At most | verbatim | verbatim-or-shortened | yes |

- **Rule:** `Combine Like Terms: Add coefficients of matching variables` → **no-source-in-lesson** (words absent from the lesson: add, coeffi)
- **Meaning:** Group terms with identical variable letters together.
- **Example:** `3x + 5x = 8x` → **numbers-from-lesson**

### 8-5 — Understand Inequalities and Their Solutions

Declared vocabulary entries: 7

| Term | Term provenance | Definition provenance | Used elsewhere in lesson |
| --- | --- | --- | --- |
| Graph Inequalities | verbatim | verbatim-or-shortened | yes |
| Number line | verbatim | verbatim-or-shortened | yes |
| Open circle | verbatim | verbatim-or-shortened | yes |
| Closed circle | verbatim | verbatim-or-shortened | yes |
| Solution set | verbatim | reworded — new words: true | yes |

- **Rule:** `Distributive Property: a(b + c) = ab + ac` → **no-source-in-lesson** (words absent from the lesson: distri, proper)
- **Meaning:** Multiply the outside number by each term inside parentheses.
- **Example:** `4(x + 3) = 4x + 12` → **numbers-from-lesson**

### 8-6 — Solve and Graph Inequalities

Declared vocabulary entries: 7

| Term | Term provenance | Definition provenance | Used elsewhere in lesson |
| --- | --- | --- | --- |
| Solve and Graph Inequalities | verbatim | verbatim-or-shortened | yes |
| Solve | verbatim | reworded — new words: true | yes |
| Graph | verbatim | verbatim-or-shortened | yes |
| Solution | verbatim | reworded — new words: value, true | yes |
| Substitute | verbatim | verbatim-or-shortened | yes |

- **Rule:** `Inverse Operations: Isolate variable with opposite operation` → **belongs-to-other-lesson** — the mathematics this names belongs to 8-2, 8-3 (words absent from the lesson: opposi)
- **Meaning:** Addition undoes subtraction; multiplication undoes division.
- **Example:** `x + 5 = 12 → x = 12 − 5 = 7` → **numbers-from-lesson**

### 8-7 — Equations and Inequalities Problem Solving

Declared vocabulary entries: 7

| Term | Term provenance | Definition provenance | Used elsewhere in lesson |
| --- | --- | --- | --- |
| Equations and Inequalities Problem Solving | verbatim | verbatim-or-shortened | yes |
| Model | verbatim | verbatim-or-shortened | yes |
| Equation | verbatim | new-prose — new words: expres, have, value | yes |
| Inequality | verbatim | reworded — new words: quanti | yes |
| Reasonableness | verbatim | new-prose — new words: whethe, good, sense | yes |

- **Rule:** `Inequality: x < a, x > a, x ≤ a, x ≥ a` → **stated-in-lesson-different-wording**
- **Meaning:** An inequality has many solutions graphed on a number line.
- **Example:** `x > 3 includes all numbers greater than 3` → **numbers-from-lesson**

### 9-1 — Explore Relationships Between Two Variables

Declared vocabulary entries: 5

| Term | Term provenance | Definition provenance | Used elsewhere in lesson |
| --- | --- | --- | --- |
| independent variable | verbatim | verbatim-or-shortened | yes |
| dependent variable | verbatim | verbatim-or-shortened | yes |
| depends on | verbatim | verbatim-or-shortened | yes |
| quantity | verbatim | reworded — new words: amount, count | yes |
| relationship | verbatim | new-prose — new words: number, connec, compar, other | yes |

- **Rule:** `Explore Relationships Between Two Variables` → **verbatim-in-lesson**
- **Meaning:** The independent variable is subject to choice. The dependent variable changes in response to it.
- **Example:** `` → **absent**

### 9-2 — Analyze Graphs of Relationships Between Two Variables

Declared vocabulary entries: 5

| Term | Term provenance | Definition provenance | Used elsewhere in lesson |
| --- | --- | --- | --- |
| graph | verbatim | verbatim-or-shortened | yes |
| table of values | verbatim | new-prose — new words: table, listin, relate, order | **no** |
| ordered pair | verbatim | reworded — new words: showin, grid | yes |
| axis | verbatim | reworded — new words: graph | yes |
| coordinates | verbatim | verbatim-or-shortened | yes |

- **Rule:** `Analyze Graphs of Relationships Between Two Variables` → **verbatim-in-lesson**
- **Meaning:** Each row of the table becomes one ordered pair — (independent variable, dependent variable) — plotted as one point on the graph.
- **Example:** `` → **absent**

### 9-3 — Write Equations to Represent Relationships Between Two Variables

Declared vocabulary entries: 5

| Term | Term provenance | Definition provenance | Used elsewhere in lesson |
| --- | --- | --- | --- |
| equation | verbatim | new-prose — new words: math, showin, expres, have, equal, value | yes |
| variable | verbatim | new-prose — new words: unknow, changi, number | yes |
| rate | verbatim | new-prose — new words: ratio, compar, differ, units | yes |
| represent | verbatim | verbatim-or-shortened | yes |
| define the variables | verbatim | verbatim-or-shortened | yes |

- **Rule:** `Write Equations to Represent Relationships Between Two Variables` → **verbatim-in-lesson**
- **Meaning:** When the total is the rate times the amount, write it as an equation: dependent variable = rate × independent variable.
- **Example:** `` → **absent**

### 9-4 — Apply Two-Variable Relationships to Solve Problems

Declared vocabulary entries: 5

| Term | Term provenance | Definition provenance | Used elsewhere in lesson |
| --- | --- | --- | --- |
| solution | verbatim | reworded — new words: number, true | yes |
| substitute | verbatim | verbatim-or-shortened | yes |
| at least | verbatim | verbatim-or-shortened | yes |
| predict | verbatim | verbatim-or-shortened | yes |
| justify | verbatim | verbatim-or-shortened | yes |

- **Rule:** `Apply Two-Variable Relationships to Solve Problems` → **verbatim-in-lesson**
- **Meaning:** Write the relationship as an equation, substitute the known value, solve for the unknown, then interpret the solution in context.
- **Example:** `` → **absent**

### 10-1 — Math is Everywhere

Declared vocabulary entries: 5

| Term | Term provenance | Definition provenance | Used elsewhere in lesson |
| --- | --- | --- | --- |
| profession | verbatim | verbatim-or-shortened | yes |
| inventory | verbatim | verbatim-or-shortened | yes |
| portion | verbatim | verbatim-or-shortened | yes |
| area | verbatim | new-prose — new words: number, units, coveri | yes |
| volume | verbatim | new-prose — new words: total, inside, three-, solid, shape | yes |

- **Rule:** `Math is Everywhere` → **verbatim-in-lesson**
- **Meaning:** People use math every day in their professions and their hobbies — and it is a good tool for solving problems around your house, too.
- **Example:** `` → **absent**

### 10-2 — Math is Beauty

Declared vocabulary entries: 5

| Term | Term provenance | Definition provenance | Used elsewhere in lesson |
| --- | --- | --- | --- |
| symmetric | verbatim | verbatim-or-shortened | yes |
| mirror image | verbatim | verbatim-or-shortened | yes |
| bilateral symmetry | verbatim | verbatim-or-shortened | yes |
| line of symmetry | verbatim | verbatim-or-shortened | yes |
| balance | verbatim | verbatim-or-shortened | yes |

- **Rule:** `Math is Beauty` → **verbatim-in-lesson**
- **Meaning:** Bilateral symmetry — two sides that are mirror images — appears throughout nature, and it shapes human creations from art to music to architecture.
- **Example:** `` → **absent**

### 10-3 — Math is Playful

Declared vocabulary entries: 5

| Term | Term provenance | Definition provenance | Used elsewhere in lesson |
| --- | --- | --- | --- |
| puzzle | verbatim | verbatim-or-shortened | yes |
| pattern | verbatim | new-prose — new words: number, shapes, way | yes |
| pattern rule | verbatim | new-prose — new words: instru, tellin, find | yes |
| predict | verbatim | verbatim-or-shortened | yes |
| organize | verbatim | verbatim-or-shortened | yes |

- **Rule:** `Math is Playful` → **verbatim-in-lesson**
- **Meaning:** We play with math by using our imagination and by looking for patterns or relationships that help us think logically — a pattern can tell us the answer to a puzzle we have not even played yet.
- **Example:** `` → **absent**

### 10-4 — Math is Ingenuity

Declared vocabulary entries: 5

| Term | Term provenance | Definition provenance | Used elsewhere in lesson |
| --- | --- | --- | --- |
| ingenuity | verbatim | verbatim-or-shortened | yes |
| rotation | verbatim | verbatim-or-shortened | yes |
| gear | verbatim | verbatim-or-shortened | yes |
| ratio | verbatim | reworded — new words: amount, divisi | yes |
| equivalent ratios | verbatim | reworded — new words: exact | yes |

- **Rule:** `Math is Ingenuity` → **verbatim-in-lesson**
- **Meaning:** With each pedal rotation, the bicycle travels the length of the perimeter of the wheel. The front wheel is large so the bicycle travels a greater distance with one pedal rotation.
- **Example:** `` → **absent**

### 10-5 — Math is Boundless

Declared vocabulary entries: 5

| Term | Term provenance | Definition provenance | Used elsewhere in lesson |
| --- | --- | --- | --- |
| repetition | verbatim | reworded — new words: times | yes |
| pattern | verbatim | new-prose — new words: number, change, predic, way | yes |
| pattern unit | verbatim | verbatim-or-shortened | yes |
| rhythm | verbatim | verbatim-or-shortened | yes |
| predictability | verbatim | verbatim-or-shortened | yes |

- **Rule:** `Math is Boundless` → **verbatim-in-lesson**
- **Meaning:** Math can be used to create beautiful designs. These designs often have repetition, patterns, and rhythm — and the pattern unit lets you predict what comes next.
- **Example:** `` → **absent**

### 10-6 — Math is Mine

Declared vocabulary entries: 5

| Term | Term provenance | Definition provenance | Used elsewhere in lesson |
| --- | --- | --- | --- |
| math biography | verbatim | verbatim-or-shortened | yes |
| reflect | verbatim | verbatim-or-shortened | yes |
| growth | verbatim | verbatim-or-shortened | yes |
| confidence | verbatim | verbatim-or-shortened | yes |
| community | verbatim | verbatim-or-shortened | yes |

- **Rule:** `Math is Mine` → **verbatim-in-lesson**
- **Meaning:** We are all doers of math and use math in our daily lives. Our math stories continue to grow and evolve as we grow and advance.
- **Example:** `` → **absent**
