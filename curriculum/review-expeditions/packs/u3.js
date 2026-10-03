/* js/units/u3/gen-ratios.js */
/* Zone 1 — Base Camp. Lesson 3-1 Understand Ratios. */
(function (root) {
  'use strict';
  const RX = root.RX;
  const { G, V, simplify, gcd, shuffleOptions, NAMES, esc } = RX;
  const hl = V.hl;

  const PAIRS = [
    ['tents', 'lanterns', 'square', 'tri', '#1FA6A2', '#F2A33A'],
    ['canoes', 'paddles', 'diamond', 'square', '#3B6FB6', '#1FA6A2'],
    ['flags', 'ropes', 'tri', 'circle', '#C8553D', '#17324D'],
    ['compasses', 'maps', 'circle', 'square', '#17324D', '#F2A33A'],
  ];

  // ---------- Reading a ratio from a picture (MC) ----------
  G.define('r1_picture', (r) => {
    const [n1, n2, k1, k2, c1, c2] = r.pick(PAIRS);
    let a = r.int(2, 7), b = r.int(2, 9);
    if (b === a) b = a + 1;
    const opts = [
      { html: `${a} : ${b}`, ok: true },
      { html: `${b} : ${a}`, why: `Order matters. The question asks for ${n1} to ${n2}, so the number of ${n1} comes first.` },
      { html: `${a} : ${a + b}`, why: `${a + b} is the total of both items. That would be a part-to-whole ratio. This question compares two parts.` },
      { html: `${b} : ${a + b}`, why: `${a + b} is the total. The question compares ${n1} to ${n2}, not ${n2} to everything.` },
    ];
    const sh = shuffleOptions(r, opts, 0);
    return {
      type: 'mc', skill: 'ratio-language', lesson: '3-1', title: 'Read the ratio',
      prompt: `<p>The supply crate holds the items shown.</p>
        <div class="viz-row"><div><div class="viz-cap">${n1}</div>${V.icons(a, k1, c1, n1)}</div><div><div class="viz-cap">${n2}</div>${V.icons(b, k2, c2, n2)}</div></div>
        <p>What is the ratio of ${hl(n1)} to ${hl(n2)}?</p>`,
      options: sh.options, answer: sh.answer,
      hints: [
        'Count each kind of item. Which item does the question name first?',
        `There are ${a} ${n1} and ${b} ${n2}. A ratio of ${n1} to ${n2} puts the ${n1} count first.`,
        `Write it as <b>${a} : ${b}</b>. Reading it: "${a} ${n1} for every ${b} ${n2}."`,
      ],
      solution: `<p>Count: ${a} ${n1}, ${b} ${n2}. The question says <b>${n1} to ${n2}</b>, so the ratio is <b>${a} : ${b}</b>. The order of the words tells you the order of the numbers.</p>`,
      feedback: { correct: `Correct. ${a} ${n1} to ${b} ${n2} is written ${a} : ${b}, in the same order as the words.` },
    };
  });

  // ---------- Sort statements: part-to-part vs part-to-whole ----------
  G.define('r1_sortLanguage', (r) => {
    const a = r.int(2, 5), b = r.int(a + 1, 8), t = a + b;
    const pool = [
      { html: `${a} red beads for every ${b} blue beads`, bin: 0 },
      { html: `The ratio of blue to red is ${b} to ${a}`, bin: 0 },
      { html: `For every ${b} blue beads there are ${a} red beads`, bin: 0 },
      { html: `red : blue = ${a} : ${b}`, bin: 0 },
      { html: `${a} of the ${t} beads are red`, bin: 1 },
      { html: `${b} out of every ${t} beads are blue`, bin: 1 },
      { html: `red : total = ${a} : ${t}`, bin: 1 },
      { html: `${V.frac(b, t)} of the beads are blue`, bin: 1 },
    ];
    const items = r.shuffle(r.pickN(pool.filter((p) => p.bin === 0), 3).concat(r.pickN(pool.filter((p) => p.bin === 1), 3)));
    return {
      type: 'sort', skill: 'part-whole', lesson: '3-1', title: 'Sort the ratio language',
      prompt: `<p>A bracelet has ${hl(a + ' red')} beads and ${hl(b + ' blue')} beads (${t} beads total). Sort each statement.</p>
        <p class="muted">A <b>part-to-part</b> ratio compares two parts. A <b>part-to-whole</b> ratio compares one part to the total.</p>`,
      bins: ['Part-to-Part', 'Part-to-Whole'], items,
      hints: [
        'Ask: does this statement compare red to blue (two parts), or one color to all the beads?',
        `The total is ${t}. Any statement that uses ${t} (or says "of the beads") is comparing to the whole.`,
        `"For every" with two colors is part-to-part. "Out of" or "of the beads" is part-to-whole.`,
      ],
      solution: `<p>Part-to-part statements compare red and blue directly (${a} : ${b} or ${b} : ${a}). Part-to-whole statements compare one color to all ${t} beads (${a} : ${t} or ${b} : ${t}).</p>`,
      feedback: { correct: 'Correct. Statements that use the total are part-to-whole; statements that compare the two colors are part-to-part.' },
    };
  });

  // ---------- Ratio from a table, simplest form (two blanks) ----------
  G.define('r1_simplest', (r) => {
    const groups = r.shuffle(['Soccer Team', 'Art Club', 'Robotics Club', 'Debate Team', 'Chess Club', 'Drama Club', 'Band', 'Yearbook']).slice(0, 4);
    const basePairs = [[2, 3], [3, 4], [5, 6], [3, 5], [4, 5], [2, 5], [5, 8], [3, 8], [5, 9], [4, 7]];
    const [p, q] = r.pick(basePairs), k = r.int(3, 8);
    const x = p * k, y = q * k;
    const counts = [x, y, r.int(14, 40), r.int(14, 40)];
    const order = r.shuffle([0, 1, 2, 3]);
    const rows = [['School Group', 'Number of Students']].concat(order.map((i) => [groups[i], String(counts[i])]));
    const name = r.pick(NAMES);
    return {
      type: 'blanks', skill: 'ratio-language', lesson: '3-1', title: 'Write the ratio in simplest form',
      prompt: `<p>The table shows the number of students in groups at ${name}'s school.</p>${V.table(rows, { cls: 'compact' })}
        <p>Write the ratio of the number of students in the ${hl(groups[0])} to the number of students in the ${hl(groups[1])} as a fraction in <b>simplest form</b>.</p>`,
      fields: [{ label: 'numerator (top)', answer: p, width: 'sm' }, { label: 'denominator (bottom)', answer: q, width: 'sm' }],
      layout: 'fraction',
      hints: [
        `Find the two numbers in the table: ${groups[0]} = ${x}, ${groups[1]} = ${y}. The group named first goes on top.`,
        `Write ${x}/${y}. To simplify, find the greatest number that divides both ${x} and ${y}.`,
        `Both ${x} and ${y} can be divided by ${k}: ${x} ÷ ${k} = ${p} and ${y} ÷ ${k} = ${q}.`,
      ],
      solution: `<p>${groups[0]} : ${groups[1]} = ${x} : ${y}. Divide both by ${k} (the greatest common factor): <b>${p}/${q}</b>. This means for every ${p} students in the ${groups[0]}, there are ${q} in the ${groups[1]}.</p>`,
      feedback: {
        correct: `Correct. ${x}/${y} simplifies to ${p}/${q} because both numbers are divided by ${k}.`,
        wrong(ans) {
          const n = RX.parseNum(ans[0]), d = RX.parseNum(ans[1]);
          if (n != null && d && Math.abs(n / d - p / q) < 1e-9) return `Your ratio is equivalent to the correct one, but it is not in simplest form yet. Divide both numbers by their greatest common factor.`;
          if (n != null && d && Math.abs(n / d - q / p) < 1e-9) return `You reversed the order. The question names the ${groups[0]} first, so its number goes on top.`;
          return `Start by locating the two groups in the table: ${groups[0]} and ${groups[1]}. Then write first : second and simplify.`;
        },
      },
    };
  });

  // ---------- Meaning of a simplified ratio (MC) ----------
  G.define('r1_meaning', (r) => {
    const [p, q] = r.pick([[2, 3], [3, 4], [5, 6], [3, 5], [4, 5], [2, 5], [5, 7]]);
    const [g1, g2] = r.pickN(['drama club', 'chess club', 'robotics team', 'band', 'art club', 'track team'], 2);
    const opts = [
      { html: `For every ${p} students in ${g1}, there are ${q} students in ${g2}.`, ok: true },
      { html: `${p} out of every ${q} students are in ${g1}.`, why: `"Out of" describes part-to-whole. This ratio compares two parts: ${g1} and ${g2}.` },
      { html: `There are exactly ${p} students in ${g1} and ${q} in ${g2}.`, why: `A simplified ratio shows the relationship, not the actual counts. The real groups could be ${p * 4} and ${q * 4}, for example.` },
      { html: `For every ${p} students in ${g2}, there are ${q} students in ${g1}.`, why: `The order is reversed. The ratio was ${g1} to ${g2}, so ${p} goes with ${g1}.` },
    ];
    const sh = shuffleOptions(r, opts, 0);
    return {
      type: 'mc', skill: 'ratio-language', lesson: '3-1', title: 'What does the ratio mean?',
      prompt: `<p>The ratio of students in ${hl(g1)} to students in ${hl(g2)} simplifies to ${V.frac(p, q)}.</p><p>What does this simplified ratio mean?</p>`,
      options: sh.options, answer: sh.answer,
      hints: ['A ratio in simplest form describes a relationship that repeats. It does not tell you the exact counts.', `${p} goes with ${g1} and ${q} goes with ${g2}, in that order.`, `Say it with "for every": for every ${p} in ${g1}, there are ${q} in ${g2}.`],
      solution: `<p>${p}/${q} means <b>for every ${p} students in ${g1}, there are ${q} in ${g2}</b>. The groups could be larger, but they always keep this relationship.</p>`,
      feedback: { correct: `Correct. A simplified ratio describes the "for every" relationship, not the exact counts.` },
    };
  });

  // ---------- Ratio with a total: find each part (blanks) ----------
  G.define('r1_totalSplit', (r, o) => {
    const name = r.pick(NAMES);
    const a = r.int(1, 3), bChoices = [2, 3, 4, 5, 6].filter((b) => b !== a && gcd(a, b) === 1);
    const b = r.pick(bChoices), m = r.int(3, 9), T = (a + b) * m;
    const [c1, c2] = r.pickN([['red', 'blue'], ['gold', 'silver'], ['green', 'white'], ['black', 'orange']], 1)[0];
    const item = r.pick(['beads', 'tiles', 'stones']);
    return {
      type: 'blanks', skill: 'part-whole', lesson: '3-1', title: 'Split the total',
      prompt: `<p>${name} is making a ${r.pick(['bracelet', 'mosaic', 'keychain'])} with ${hl(a + ' ' + c1)} ${item.slice(0, -1)} for every ${hl(b + ' ' + c2)} ${item}. The design uses ${hl(T + ' ' + item)} in total.</p><p>How many of each color will ${name} use?</p>`,
      fields: [{ label: `${c2} ${item}`, answer: b * m }, { label: `${c1} ${item}`, answer: a * m }],
      hints: [
        `One group of the ratio has ${a} + ${b} = ${a + b} ${item}. How many groups fit into ${T}?`,
        `${T} ÷ ${a + b} = ${m} groups. Each group has ${a} ${c1} and ${b} ${c2}.`,
        `${c1}: ${a} × ${m} = ${a * m}. ${c2}: ${b} × ${m} = ${b * m}. Check: ${a * m} + ${b * m} = ${T}.`,
      ],
      solution: `<p>Each ratio group holds ${a + b} ${item}. ${T} ÷ ${a + b} = ${m} groups. So ${c1} = ${a} × ${m} = <b>${a * m}</b> and ${c2} = ${b} × ${m} = <b>${b * m}</b>. The two parts add to ${T}.</p>${V.tape([{ label: c1, boxes: a, value: m }, { label: c2, boxes: b, value: m }])}`,
      feedback: {
        correct: `Correct. ${T} ÷ ${a + b} = ${m} per ratio group, so ${a * m} ${c1} and ${b * m} ${c2}.`,
        wrong(ans) {
          const x = RX.parseNum(ans[0]), y = RX.parseNum(ans[1]);
          if (x === b && y === a) return `${a} : ${b} is the ratio, not the counts. The counts must add up to ${T}. Find how many ratio groups fit into ${T}.`;
          if (x === a * m && y === b * m) return `The numbers are right but swapped. Check which color goes with which blank.`;
          if (x != null && y != null && x + y !== T) return `Your two counts add to ${x + y}, but the total must be ${T}. Divide ${T} by ${a + b} to find the size of each ratio group.`;
          return `Think in groups: each group has ${a} ${c1} and ${b} ${c2}. How many groups make ${T}?`;
        },
      },
    };
  });

  // ---------- Build a tape diagram (tape) ----------
  G.define('r1_tapeBuild', (r, o) => {
    const [a, b] = r.pick([[2, 3], [3, 4], [1, 4], [2, 5], [3, 5], [4, 5], [1, 3], [3, 2], [5, 2]]);
    const hard = !!o.hard;
    const m = r.int(4, 12);
    const [i1, i2] = r.pick([['peanuts', 'raisins'], ['oak trees', 'pine trees'], ['adult tickets', 'child tickets'], ['red tiles', 'gray tiles']]);
    const T = (a + b) * m;
    const fields = [{ key: 'box', label: 'Value of each box', answer: m }, { key: 'rowA', label: i1, answer: a * m }, { key: 'rowB', label: i2, answer: b * m }];
    let given, prompt;
    if (hard) {
      given = { rowA: a * m };
      prompt = `<p>The ratio of ${hl(i1)} to ${hl(i2)} is ${hl(a + ' : ' + b)}. There are ${hl(a * m + ' ' + i1)}.</p><p>Use the tape diagram to find the value of each box, then the number of ${i2} and the total.</p>`;
      fields[1] = { key: 'rowB', label: i2, answer: b * m };
      fields[2] = { key: 'total', label: 'Total', answer: T };
    } else {
      prompt = `<p>The ratio of ${hl(i1)} to ${hl(i2)} is ${hl(a + ' : ' + b)}. There are ${hl(T)} in total.</p><p>Use the tape diagram. Find the value of each box, then the number of each kind.</p>`;
    }
    return {
      type: 'tape', skill: 'tape', lesson: '3-1', title: 'Label the tape diagram',
      prompt,
      rows: [{ label: i1, boxes: a }, { label: i2, boxes: b }], fields, total: hard ? null : T, given,
      hints: hard ? [
        `The ${i1} row has ${a} boxes and represents ${a * m}. All boxes are the same size.`,
        `${a * m} ÷ ${a} = ${m}. Each box is worth ${m}.`,
        `${i2}: ${b} boxes × ${m} = ${b * m}. Total: ${a * m} + ${b * m} = ${T}.`,
      ] : [
        `Count all the boxes: ${a} + ${b} = ${a + b}. The total ${T} is shared equally among them.`,
        `${T} ÷ ${a + b} = ${m}. Each box is worth ${m}.`,
        `${i1}: ${a} × ${m} = ${a * m}. ${i2}: ${b} × ${m} = ${b * m}.`,
      ],
      solution: `<p>Each box is worth <b>${m}</b> (${hard ? `${a * m} ÷ ${a}` : `${T} ÷ ${a + b}`}). ${i1} = ${a} × ${m} = <b>${a * m}</b>; ${i2} = ${b} × ${m} = <b>${b * m}</b>; total = <b>${T}</b>.</p>${V.tape([{ label: i1, boxes: a, value: m, total: a * m }, { label: i2, boxes: b, value: m, total: b * m }])}`,
      feedback: { correct: `Correct. Every box in a tape diagram has the same value (${m}), so each row is boxes × ${m}.`,
        wrong(ans, d) {
          if (d.wrong.includes('box')) return hard ? `Start with the row you know: ${a} boxes make ${a * m}, so divide to find one box.` : `Find the box value first: the total ${T} is split equally across all ${a + b} boxes.`;
          return `Your box value is right. Multiply the number of boxes in each row by ${m}.`;
        } },
    };
  });

  // ---------- Select all equivalent ratios (MS) ----------
  G.define('r1_equivSelect', (r) => {
    const [a, b] = r.pick([[2, 3], [3, 4], [2, 5], [3, 5], [4, 7], [5, 6], [1, 4], [3, 8]]);
    const ks = r.pickN([2, 3, 4, 5, 6, 10], 3);
    const opts = [
      { html: `${a * ks[0]} : ${b * ks[0]}`, ok: true },
      { html: `${a * ks[1]} : ${b * ks[1]}`, ok: true },
      { html: `${a * ks[2]} : ${b * ks[2]}`, ok: true },
      { html: `${b} : ${a}`, why: 'Reversing the order changes the ratio.' },
      { html: `${a} : ${a + b}`, why: `${a + b} is the total, so this is a different (part-to-whole) comparison.` },
      { html: `${a + 2} : ${b + 2}`, why: 'Adding the same number to both parts does not keep a ratio equivalent. You must multiply or divide both parts by the same number.' },
    ];
    const sh = shuffleOptions(r, opts, [0, 1, 2]);
    return {
      type: 'ms', skill: 'equivalent', lesson: '3-1', title: 'Find every equivalent ratio',
      prompt: `<p>Select <b>all</b> ratios that are equivalent to ${hl(a + ' : ' + b)}.</p>`,
      options: sh.options, answers: sh.answers,
      hints: ['Equivalent ratios come from multiplying (or dividing) both numbers by the same factor.', `Check each option: is the first number ${a} × something, and the second number ${b} × the same something?`, `${a * ks[0]} : ${b * ks[0]} works because both were multiplied by ${ks[0]}. ${a + 2} : ${b + 2} does not, because 2 was added.`],
      solution: `<p>Multiplying both parts of ${a} : ${b} by ${ks[0]}, ${ks[1]}, or ${ks[2]} gives the equivalent ratios. ${b} : ${a} is reversed, ${a} : ${a + b} compares to the total, and ${a + 2} : ${b + 2} was made by adding, which breaks the relationship.</p>`,
      feedback: { correct: 'Correct. Every equivalent ratio multiplies both parts by the same factor.',
        wrong(ans, d) {
          if (d.extra.length) { const w = sh.options[d.extra[0]].why; return w || 'One of your selections is not equivalent.'; }
          return 'You missed at least one equivalent ratio. Look for options where both parts were multiplied by the same number.';
        } },
    };
  });

  // ---------- Error analysis: additive thinking (error) ----------
  G.define('r1_errorAdditive', (r) => {
    const name = r.pick(NAMES);
    const [a, b] = r.pick([[2, 5], [3, 4], [1, 3], [3, 7], [2, 3]]);
    const c = r.int(2, 4), k = r.int(3, 6);
    const opts = [
      { html: `Adding ${c} to both parts changes the relationship. To make an equivalent ratio, multiply or divide both parts by the <b>same</b> number.`, ok: true },
      { html: `${name} should have added ${c} only to the second number.`, why: 'Adding to only one part makes the ratio even more unbalanced. Adding is not the operation that keeps ratios equivalent.' },
      { html: `${name} should have subtracted ${c} from both parts instead.`, why: 'Subtracting the same number from both parts also changes the relationship. Multiplying or dividing keeps it the same.' },
      { html: `The ratio ${a} : ${b} cannot have any equivalent ratios.`, why: `Every ratio has equivalent ratios. For example, ${a * 2} : ${b * 2} is equivalent to ${a} : ${b}.` },
    ];
    const sh = shuffleOptions(r, opts, 0);
    return {
      type: 'error', skill: 'equivalent', lesson: '3-1', title: 'Find the mistake',
      prompt: `<p>${name} says: "${hl(a + ' : ' + b)} is equivalent to ${hl((a + c) + ' : ' + (b + c))} because I added ${c} to both numbers."</p><p>Why is this reasoning incorrect?</p>`,
      work: `${a} + ${c} = ${a + c}, &nbsp; ${b} + ${c} = ${b + c} &nbsp; so &nbsp; ${a} : ${b} = ${a + c} : ${b + c}`,
      options: sh.options, answer: sh.answer,
      fix: { label: `Complete an equivalent ratio: ${a * k} : `, answer: b * k },
      hints: ['Test the claim with a simple case: is 1 : 2 the same as 2 : 3? (Hint: 1 : 2 is "half"; 2 : 3 is not.)', `To make an equivalent ratio from ${a} : ${b}, multiply both parts by the same factor.`, `${a} × ${k} = ${a * k}, so multiply ${b} by ${k} as well.`],
      solution: `<p>Adding changes the relationship: ${a} : ${b} and ${a + c} : ${b + c} do not simplify to the same ratio. Equivalent ratios come from multiplying both parts by the same factor: ${a} × ${k} = ${a * k} and ${b} × ${k} = <b>${b * k}</b>, so ${a * k} : ${b * k} is equivalent.</p>`,
      feedback: { correct: `Correct. Only multiplying or dividing both parts by the same number keeps a ratio equivalent. ${a * k} : ${b * k} works because both parts were multiplied by ${k}.`,
        wrong(ans, d) { if (!d.mistakeOk) return sh.options[ans.mistake] && sh.options[ans.mistake].why || 'Think about which operation keeps a ratio equivalent.'; return `You found the mistake. For the fix, ${a} was multiplied by ${k} to get ${a * k}, so multiply ${b} by ${k} too.`; } },
    };
  });
})(typeof window !== 'undefined' ? window : globalThis);

/* js/units/u3/gen-rates.js */
/* Zone 2 — Trading Post. Lesson 3-2 Rates and Unit Rates. */
(function (root) {
  'use strict';
  const RX = root.RX;
  const { G, V, shuffleOptions, NAMES, money, round } = RX;
  const hl = V.hl;

  const RATE_CTX = [
    { what: 'jumping jacks', per: 'second', perLabel: 'jumping jacks per second', tmin: 12, tmax: 60, rmin: 2, rmax: 6 },
    { what: 'words', per: 'minute', perLabel: 'words per minute', tmin: 3, tmax: 9, rmin: 25, rmax: 60 },
    { what: 'liters of water', per: 'minute', perLabel: 'liters per minute', tmin: 4, tmax: 15, rmin: 3, rmax: 12 },
    { what: 'meters', per: 'second', perLabel: 'meters per second', tmin: 5, tmax: 20, rmin: 3, rmax: 9 },
    { what: 'pages', per: 'hour', perLabel: 'pages per hour', tmin: 2, tmax: 6, rmin: 14, rmax: 40 },
  ];
  const VERB = { 'jumping jacks': 'does', words: 'types', 'liters of water': 'pumps', meters: 'swims', pages: 'reads' };

  // ---------- Basic unit rate (num) ----------
  G.define('r2_unitRate', (r) => {
    const c = r.pick(RATE_CTX), name = r.pick(NAMES);
    const rate = r.int(c.rmin, c.rmax), t = r.int(c.tmin, c.tmax), total = rate * t;
    return {
      type: 'num', skill: 'unit-rate', lesson: '3-2', title: 'Write the unit rate',
      prompt: `<p>${name} ${VERB[c.what]} ${hl(total + ' ' + c.what)} in ${hl(t + ' ' + c.per + 's')}.</p><p>Write this rate as a <b>unit rate</b>.</p>`,
      unit: c.perLabel, answer: rate,
      hints: ['A unit rate tells how much for <b>1</b> unit of time. Which quantity needs to become 1?', `Divide the ${c.what} by the number of ${c.per}s: ${total} ÷ ${t}.`, `${total} ÷ ${t} = ${rate}. So the unit rate is ${rate} ${c.perLabel}.`],
      solution: `<p>Unit rate = ${total} ${c.what} ÷ ${t} ${c.per}s = <b>${rate} ${c.perLabel}</b>. Dividing by ${t} makes the time equal to 1 ${c.per}.</p>`,
      feedback: {
        correct: `Correct. ${total} ÷ ${t} = ${rate}, so ${rate} ${c.what} happen every 1 ${c.per}.`,
        wrong(ans, d) {
          const v = d.value;
          if (v != null && Math.abs(v - t / total) < 0.01) return `You divided in the wrong direction. The unit rate asks for ${c.what} per 1 ${c.per}, so divide the ${c.what} (${total}) by the ${c.per}s (${t}).`;
          if (v === total) return `${total} is the total, not the amount per ${c.per}. Divide by ${t} to find the amount for 1 ${c.per}.`;
          if (v === total - t) return `Subtracting does not give a rate. Divide ${total} by ${t} to find the amount per 1 ${c.per}.`;
          return `A unit rate compares the quantity to 1 ${c.per}. Divide ${total} by ${t}.`;
        },
      },
    };
  });

  // ---------- Vocabulary matching ----------
  G.define('r2_vocabMatch', (r) => {
    const terms = [
      ['ratio', 'A comparison of two quantities, such as 3 to 5 or 3 : 5'],
      ['rate', 'A ratio that compares two quantities with different units, such as 120 miles in 3 hours'],
      ['unit rate', 'A rate in which the second quantity is 1, such as 40 miles per 1 hour'],
      ['equivalent ratios', 'Ratios that show the same relationship, such as 2 : 3 and 6 : 9'],
      ['unit price', 'The cost for one unit of an item, such as $2.50 per pound'],
    ];
    const right = r.shuffle(terms.map((t, i) => i));
    return {
      type: 'match', skill: 'unit-rate', lesson: '3-2', title: 'Match the vocabulary',
      prompt: '<p>Match each term with its meaning.</p>',
      left: terms.map((t) => t[0]), right: right.map((i) => terms[i][1]),
      pairs: terms.map((t, i) => [i, right.indexOf(i)]),
      hints: ['A ratio compares any two quantities. A rate is a ratio with different units (miles and hours).', 'A unit rate or unit price always has 1 as the second quantity: per 1 hour, per 1 pound.', 'Equivalent ratios are made by multiplying both parts by the same number.'],
      solution: `<ul>${terms.map((t) => `<li><b>${t[0]}</b>: ${t[1]}</li>`).join('')}</ul>`,
      feedback: { correct: 'Correct. These five terms are the vocabulary of the whole unit.' },
    };
  });

  // ---------- Which statements are unit rates? (MS) ----------
  G.define('r2_whichUnit', (r) => {
    const p = r.int(2, 8), s = r.int(45, 75), tx = r.int(2, 9);
    const e = r.pick([6, 12, 18]), ep = r.int(2, 6), m = r.int(100, 240), h = r.int(2, 5), pen = r.int(4, 10), st = r.int(2, 5);
    const opts = [
      { html: `${money(p)} per pound`, ok: true },
      { html: `${s} miles per hour`, ok: true },
      { html: `${tx} texts per minute`, ok: true },
      { html: `${e} eggs for ${money(ep)}`, why: `${e} eggs for ${money(ep)} is a rate, but the second quantity is not 1. The unit price would be ${money(ep / e)} per egg.` },
      { html: `${m} miles in ${h} hours`, why: `${m} miles in ${h} hours is a rate. A unit rate would be ${m / h} miles per 1 hour.` },
      { html: `${pen} pencils for ${st} students`, why: `${pen} pencils for ${st} students compares to ${st}, not to 1. A unit rate would be ${pen / st} pencils per student.` },
    ];
    const sh = shuffleOptions(r, opts, [0, 1, 2]);
    return {
      type: 'ms', skill: 'unit-rate', lesson: '3-2', title: 'Spot the unit rates',
      prompt: '<p>Select <b>all</b> statements that are <b>unit rates</b>.</p>',
      options: sh.options, answers: sh.answers,
      hints: ['A unit rate compares a quantity to exactly 1 of the other unit.', 'The word "per" usually means "for each 1". "Per hour" = for 1 hour.', `"${e} eggs for ${money(ep)}" compares to ${money(ep)}, not to $1 or 1 egg, so it is a rate but not a unit rate.`],
      solution: `<p>Unit rates: ${money(p)} per pound, ${s} miles per hour, ${tx} texts per minute. Each compares to <b>1</b>. The others compare to ${money(ep)}, ${h} hours, and ${st} students, so they are rates but not unit rates.</p>`,
      feedback: { correct: 'Correct. "Per" signals a comparison to 1, which is what makes a rate a unit rate.',
        wrong(ans, d) { if (d.extra.length) return sh.options[d.extra[0]].why; return 'You missed a unit rate. Look for "per" followed by a single unit.'; } },
    };
  });

  // ---------- Which student divided correctly? (who) ----------
  G.define('r2_direction', (r) => {
    const [n1, n2, n3] = r.pickN(NAMES, 3);
    const m = r.int(2, 6), per = r.int(6, 12), t = m * per;
    const opts = [
      { title: n1, html: `${t} ÷ ${m} = ${per}<br><b>${per} minutes per mile</b>`, ok: true },
      { title: n2, html: `${m} ÷ ${t} = ${round(m / t, 3)}<br><b>${round(m / t, 3)} minutes per mile</b>`, why: `${n2} divided in the wrong direction. "Minutes per mile" means minutes ÷ miles, so ${t} ÷ ${m}. (${m} ÷ ${t} would be miles per minute.)` },
      { title: n3, html: `${t} − ${m} = ${t - m}<br><b>${t - m} minutes per mile</b>`, why: `${n3} subtracted. A rate is found by dividing, not subtracting.` },
    ];
    const sh = shuffleOptions(r, opts, 0);
    return {
      type: 'who', skill: 'unit-rate', lesson: '3-2', title: 'Who is correct?',
      prompt: `<p>A runner finishes ${hl(m + ' miles')} in ${hl(t + ' minutes')}. The coach asks for the unit rate in <b>minutes per mile</b>. Three students show their work. Who is correct?</p>`,
      options: sh.options, answer: sh.answer, layout: 'cards',
      hints: ['"Minutes per mile" means the number of minutes for 1 mile. Which quantity should become 1?', `To make miles equal 1, divide both quantities by ${m}.`, `${t} ÷ ${m} = ${per} minutes per mile.`],
      solution: `<p>Minutes per mile = ${t} minutes ÷ ${m} miles = <b>${per} minutes per mile</b>. ${n1} is correct. Dividing the other way gives miles per minute, and subtracting does not make a rate.</p>`,
      feedback: { correct: `Correct. The unit you want "per 1" of (miles) is the one you divide by.` },
    };
  });

  // ---------- Two unit prices (blanks) ----------
  G.define('r2_unitPriceTwo', (r) => {
    const [s1, s2] = r.pickN(['Fresh Market', "Nature's Pantry", 'Summit Grocer', 'Trailhead Foods', 'Valley Co-op', 'Northside Market'], 2);
    const item = r.pick(['trail mix', 'granola', 'dried mango', 'almonds', 'oats']);
    const w1 = r.int(2, 5), w2 = r.pick([1.5, 2.5, 3.5]);
    const u1 = r.int(400, 800) / 100;
    let u2 = r.int(30, 80) / 10; if (Math.abs(u2 - u1) < 0.1) u2 += 0.5;
    const p1 = round(u1 * w1, 2), p2 = round(u2 * w2, 2);
    return {
      type: 'blanks', skill: 'unit-price', lesson: '3-2', title: 'Find each unit price',
      prompt: `<p>${s1} sells a ${hl(w1 + '-pound')} bag of ${item} for ${hl(money(p1))}. ${s2} sells a ${hl(w2 + '-pound')} bag of ${item} for ${hl(money(p2))}.</p><p>What is the unit price at each store?</p>`,
      fields: [{ label: `${s1}`, prefix: '$', suffix: 'per pound', answer: round(p1 / w1, 2), tolerance: 0.006 }, { label: `${s2}`, prefix: '$', suffix: 'per pound', answer: round(p2 / w2, 2), tolerance: 0.006 }],
      hints: ['A unit price is the cost for <b>1 pound</b>. Divide the price by the number of pounds.', `${s1}: ${money(p1)} ÷ ${w1} pounds. ${s2}: ${money(p2)} ÷ ${w2} pounds.`, `${money(p1)} ÷ ${w1} = ${money(round(p1 / w1, 2))}. Now do the second store the same way.`],
      solution: `<p>${s1}: ${money(p1)} ÷ ${w1} = <b>${money(round(p1 / w1, 2))} per pound</b>.<br>${s2}: ${money(p2)} ÷ ${w2} = <b>${money(round(p2 / w2, 2))} per pound</b>.</p>`,
      feedback: { correct: `Correct. Dividing each price by its weight gives the cost of exactly 1 pound.`,
        wrong(ans, d) {
          const i = d.wrong[0], v = RX.parseNum(ans[i]);
          const price = i === 0 ? p1 : p2, w = i === 0 ? w1 : w2, s = i === 0 ? s1 : s2;
          if (v != null && Math.abs(v - w / price) < 0.01) return `For ${s}, you divided pounds by dollars. A unit price is dollars per pound, so divide ${money(price)} by ${w}.`;
          if (v != null && Math.abs(v - price * w) < 0.01) return `For ${s}, you multiplied. To find the cost of 1 pound, divide ${money(price)} by ${w}.`;
          return `Check ${s}: divide the price ${money(price)} by ${w} pounds, and round to the nearest cent.`;
        } },
    };
  });

  // ---------- Better buy (MC) ----------
  G.define('r2_betterBuy', (r) => {
    const [s1, s2] = r.pickN(['Fresh Market', "Nature's Pantry", 'Summit Grocer', 'Trailhead Foods', 'Valley Co-op'], 2);
    const item = r.pick(['rice', 'coffee', 'pretzels', 'birdseed', 'peanuts']);
    const w1 = r.int(2, 6), w2 = r.pick([1.5, 2.5, 3.5, 4.5]);
    const u1 = r.int(250, 700) / 100;
    let u2 = r.int(25, 70) / 10; if (Math.abs(u2 - u1) < 0.15) u2 = round(u1 + 0.4, 2);
    const p1 = round(u1 * w1, 2), p2 = round(u2 * w2, 2);
    const best = u1 < u2 ? 0 : 1;
    const bigger = w1 > w2 ? s1 : s2;
    const opts = [
      { html: `${s1} is the better buy because its unit price is lower.`, ok: best === 0, why: `${s1}'s unit price is ${money(u1)} per pound, which is higher than ${money(u2)}.` },
      { html: `${s2} is the better buy because its unit price is lower.`, ok: best === 1, why: `${s2}'s unit price is ${money(u2)} per pound, which is higher than ${money(u1)}.` },
      { html: `${bigger} is the better buy because you get a bigger bag.`, why: 'A bigger bag is not automatically a better deal. Compare the cost of 1 pound at each store.' },
      { html: 'Both stores are equally good buys.', why: `The unit prices are different: ${money(u1)} and ${money(u2)} per pound.` },
    ];
    const sh = shuffleOptions(r, opts, best);
    return {
      type: 'mc', skill: 'unit-price', lesson: '3-2', title: 'Which is the better buy?',
      prompt: `<p>${s1}: ${hl(w1 + ' lb')} of ${item} for ${hl(money(p1))}<br>${s2}: ${hl(w2 + ' lb')} of ${item} for ${hl(money(p2))}</p><p>Based on unit prices, which store offers the better buy?</p>`,
      options: sh.options, answer: sh.answer,
      hints: ['Find the price for 1 pound at each store: price ÷ pounds.', `${s1}: ${money(p1)} ÷ ${w1} = ${money(u1)}. ${s2}: ${money(p2)} ÷ ${w2} = ${money(u2)}.`, 'The better buy is the store with the <b>lower</b> cost per pound.'],
      solution: `<p>${s1}: ${money(p1)} ÷ ${w1} = ${money(u1)} per lb. ${s2}: ${money(p2)} ÷ ${w2} = ${money(u2)} per lb. <b>${best === 0 ? s1 : s2}</b> is the better buy because its unit price is lower.</p>`,
      feedback: { correct: `Correct. ${money(Math.min(u1, u2))} per pound is lower than ${money(Math.max(u1, u2))}, so it is the better deal no matter the bag size.` },
    };
  });

  // ---------- Double number line comparison (cloze) ----------
  G.define('r2_dnlCompare', (r) => {
    const [A, B] = r.pickN(NAMES, 2);
    const ua = r.int(9, 16), hrs = r.int(3, 5), X = ua * hrs;
    const d = r.int(1, 4);
    const ub = r.chance(0.5) ? ua + d : ua - d;
    const who = ua > ub ? 0 : 1;
    return {
      type: 'cloze', skill: 'dnl', lesson: '3-2', title: 'Compare with a double number line',
      prompt: `<p>${A} earns ${hl('$' + X)} in ${hl(hrs + ' hours')}. The double number line shows the amount ${B} earns.</p>${V.dnl({ label: 'Hours', values: [0, 1, 2, 3, 4, 5] }, { label: 'Dollars', values: [0, ub, 2 * ub, 3 * ub, 4 * ub, 5 * ub] }, { aria: `${B} earns ${ub} dollars per hour` })}<p>Complete the sentence.</p>`,
      template: '{0} earns ${1} more per hour.',
      choices: [[A, B], ['1', '2', '3', '4']], answers: [who, d - 1],
      hints: [`Find each person's unit rate (dollars per 1 hour). On the double number line, look above/below the 1.`, `${A}: $${X} ÷ ${hrs} hours = $${ua} per hour. ${B}: the number lined up with 1 hour is $${ub}.`, `Compare $${ua} and $${ub}. The difference is $${Math.abs(ua - ub)}.`],
      solution: `<p>${A}: $${X} ÷ ${hrs} = $${ua} per hour. ${B}: the double number line shows $${ub} per hour. <b>${who === 0 ? A : B}</b> earns <b>$${d}</b> more per hour.</p>`,
      feedback: { correct: `Correct. Comparing unit rates ($${ua} and $${ub} per hour) makes the difference easy to see.`,
        wrong(ans, dd) { if (dd.wrong.includes(0)) return `Check who earns more per hour. ${A} earns $${ua} per hour; read ${B}'s rate from the 1-hour mark.`; return `The person is right, but find the difference between the two unit rates: $${ua} and $${ub}.`; } },
    };
  });

  // ---------- Fill in a double number line ----------
  G.define('r2_dnlFill', (r) => {
    const ctx = r.pick([{ top: 'Hours', bot: 'Dollars', story: (n, v) => `A kayak rental costs $${v} for ${n} hours.`, pre: '$' }, { top: 'Hours', bot: 'Kilometers', story: (n, v) => `A hiker walks ${v} kilometers in ${n} hours.`, pre: '' }, { top: 'Minutes', bot: 'Liters', story: (n, v) => `A pump fills ${v} liters in ${n} minutes.`, pre: '' }]);
    const rate = r.int(6, 15), known = r.pick([3, 4]);
    const blanksAt = [1, 2, 3, 4, 5].filter((i) => i !== known).slice(0, 3);
    return {
      type: 'dnl', skill: 'dnl', lesson: '3-2', title: 'Complete the double number line',
      prompt: `<p>${ctx.story(known, rate * known)} The rate stays the same.</p><p>Fill in the missing values on the double number line.</p>`,
      top: { label: ctx.top, values: [0, 1, 2, 3, 4, 5] },
      bottom: { label: ctx.bot, values: [0, 1, 2, 3, 4, 5].map((i) => (blanksAt.includes(i) ? null : rate * i)) },
      blanks: blanksAt.map((i) => ({ row: 'bottom', i, answer: rate * i })),
      hints: [`Find the value for 1 ${ctx.top.toLowerCase().slice(0, -1)} first. You know ${known} ${ctx.top.toLowerCase()} = ${ctx.pre}${rate * known}.`, `${rate * known} ÷ ${known} = ${rate}. So each step along the line adds ${rate}.`, `1 → ${rate}, 2 → ${rate * 2}, 3 → ${rate * 3}, 4 → ${rate * 4}, 5 → ${rate * 5}.`],
      solution: `<p>Unit rate: ${rate * known} ÷ ${known} = <b>${rate}</b> per 1. Multiply: ${[1, 2, 3, 4, 5].map((i) => `${i} → ${rate * i}`).join(', ')}.</p>`,
      feedback: { correct: `Correct. Once you know the unit rate (${rate}), every tick is a multiple of it.`, wrong() { return `Start from the known pair: ${known} ↔ ${rate * known}. Divide to find the value for 1, then multiply for the other ticks.`; } },
    };
  });
})(typeof window !== 'undefined' ? window : globalThis);

/* js/units/u3/gen-tables.js */
/* Zone 3 — River of Tables. Lesson 3-3 Equivalent Ratios Using Tables. */
(function (root) {
  'use strict';
  const RX = root.RX;
  const { G, V, shuffleOptions, NAMES, gcd } = RX;
  const hl = V.hl;

  const CTX = [
    ['chocolate milk', 'white milk', 'people who prefer'], ['cups of flour', 'eggs', 'a recipe uses'], ['red paint', 'blue paint', 'a mix uses'],
    ['tents', 'campers', 'the trip plans'], ['laps', 'minutes', 'a swimmer does'], ['adult tickets', 'child tickets', 'a show sells'],
  ];
  const coprime = (r) => r.pick([[4, 3], [2, 5], [3, 4], [5, 2], [2, 3], [3, 5], [5, 4], [4, 7], [3, 7]]);

  /** Build a ratio-table question. cols: [{x, y, inX?:bool, inY?:bool}] */
  function tableQ(labels, cols, extra) {
    const inputs = [];
    const rows = [[''].concat(cols.map((c, i) => c.inX ? `__IN:x${i}__` : String(c.x))), [''].concat(cols.map((c, i) => c.inY ? `__IN:y${i}__` : String(c.y)))];
    rows[0][0] = labels[0]; rows[1][0] = labels[1];
    cols.forEach((c, i) => { if (c.inX) inputs.push({ id: 'x' + i, answer: c.x }); if (c.inY) inputs.push({ id: 'y' + i, answer: c.y }); });
    return Object.assign({ type: 'table', rows, inputs, rowHeader: true }, extra);
  }

  // ---------- Complete a ratio table (bottom row) ----------
  G.define('r3_complete', (r, o) => {
    const [a, b] = coprime(r), [l1, l2, verb] = r.pick(CTX);
    const ks = r.pickN(o.hard ? [3, 5, 7, 8, 9, 11, 12] : [2, 3, 4, 5, 6, 8, 10], 4).sort((x, y) => x - y);
    const cols = ks.map((k) => ({ x: a * k, y: b * k, inY: true }));
    return tableQ([l1, l2], cols, {
      skill: 'tables', lesson: '3-3', title: 'Complete the ratio table',
      prompt: `<p>For every ${hl(a + ' ' + l1)}, ${verb === 'people who prefer' ? 'there are' : 'there are'} ${hl(b + ' ' + l2)}. Complete the table.</p>`,
      hints: [`The ratio ${a} : ${b} is the pattern. Each column must be ${a} : ${b} multiplied by the same number.`, `First column: ${a} × ? = ${a * ks[0]}. The multiplier is ${ks[0]}, so the bottom is ${b} × ${ks[0]} = ${b * ks[0]}.`, `Do the same for each column: find the multiplier (top ÷ ${a}), then multiply ${b} by it.`],
      solution: `<p>Each column uses the ratio ${a} : ${b}. Divide the top number by ${a} to find the multiplier, then multiply ${b} by it: ${ks.map((k) => `${a * k} ÷ ${a} = ${k}, so ${b} × ${k} = <b>${b * k}</b>`).join('; ')}.</p>`,
      feedback: { correct: `Correct. Every column is ${a} : ${b} scaled by the same factor, so the ratios are equivalent.`,
        wrong(ans, d) { const id = d.wrong[0], i = Number(id.slice(1)), v = RX.parseNum(ans[id]); const k = ks[i];
          if (v != null && v === a * k - (a - b)) return `Column ${i + 1}: subtracting ${a - b} does not keep the ratio. Find what ${a} was multiplied by to get ${a * k}, then multiply ${b} by the same number.`;
          if (v != null && v === a * k + (b - a)) return `Column ${i + 1}: adding does not keep the ratio. ${a} was multiplied by ${k} to get ${a * k}, so multiply ${b} by ${k} too.`;
          return `Column ${i + 1}: ${a * k} ÷ ${a} = ${k}. Multiply ${b} by ${k}.`; } },
    });
  });

  // ---------- Explain how you found a value (CR + check) ----------
  G.define('r3_explain', (r) => {
    const [a, b] = coprime(r), [l1, l2] = r.pick(CTX), k = r.int(4, 9);
    const sh = shuffleOptions(r, [
      { html: `Divide ${a * k} by ${a} to get ${k}, then multiply ${b} by ${k} to get ${b * k}.`, ok: true },
      { html: `Subtract ${a - b > 0 ? a - b : b - a} from ${a * k}, because ${b} is ${Math.abs(a - b)} ${a > b ? 'less' : 'more'} than ${a}.`, why: 'Ratios are multiplicative. Adding or subtracting a constant breaks the relationship.' },
      { html: `Add ${a * k - a} to ${b}, because ${a} + ${a * k - a} = ${a * k}.`, why: 'The top row was multiplied, not added to. The bottom row must be multiplied by the same factor.' },
      { html: `Multiply ${a * k} by ${b} to get ${a * k * b}.`, why: `That multiplies the wrong numbers. Find the factor that takes ${a} to ${a * k}, then apply it to ${b}.` },
    ], 0);
    return {
      type: 'cr', skill: 'tables', lesson: '3-3', title: 'Explain your reasoning',
      prompt: `<p>The table shows a ratio of ${hl(a + ' ' + l1)} to ${hl(b + ' ' + l2)}.</p>${V.table([[l1, String(a), String(a * k)], [l2, String(b), '<b class="unknown">?</b>']], { header: false, rowHeader: true, cls: 'compact' })}<p>Explain how to find the missing value. Then choose the explanation that is mathematically correct.</p>`,
      starters: [`First, I found the multiplier by …`, `I know the ratio is ${a} : ${b}, so …`, `Both numbers must be multiplied by …`],
      minWords: 10,
      check: { prompt: 'Which explanation is correct?', options: sh.options, answer: sh.answer },
      hints: ['Compare the two top numbers. What was the first multiplied by to get the second?', `${a} × ${k} = ${a * k}. The multiplier is ${k}.`, `Apply the same multiplier to the bottom: ${b} × ${k} = ${b * k}.`],
      solution: `<p>Model explanation: "${a} was multiplied by ${k} to get ${a * k}. To keep the ratio equivalent, I multiply ${b} by the same number: ${b} × ${k} = <b>${b * k}</b>."</p>`,
      feedback: { correct: `Correct. Both rows are multiplied by the same factor (${k}), which is what keeps the ratios equivalent.`,
        wrong(ans, d) { if (!d.wroteEnough) return 'Write at least a full sentence or two. Use a sentence starter if you are stuck.'; return sh.options[ans.check] && sh.options[ans.check].why || 'Think about multiplying, not adding.'; } },
    };
  });

  // ---------- Two-way missing values ----------
  G.define('r3_twoWay', (r) => {
    const [a, b] = coprime(r), [l1, l2] = r.pick(CTX);
    const [k1, k2, k3] = r.pickN([2, 3, 4, 5, 6, 7, 8], 3).sort((x, y) => x - y);
    const cols = [{ x: a, y: b }, { x: a * k1, y: b * k1, inX: true }, { x: a * k2, y: b * k2, inY: true }, { x: a * k3, y: b * k3, inX: true }];
    return tableQ([l1, l2], cols, {
      skill: 'tables', lesson: '3-3', title: 'Fill the table both ways',
      prompt: `<p>The table shows equivalent ratios of ${hl(l1)} to ${hl(l2)}. Some values are missing in <b>both</b> rows. Complete the table.</p>`,
      hints: [`The first column gives the base ratio ${a} : ${b}. Use whichever number is given in a column to find its multiplier.`, `Column 2: ${b * k1} ÷ ${b} = ${k1}, so the top is ${a} × ${k1} = ${a * k1}. Column 3: ${a * k2} ÷ ${a} = ${k2}.`, `Column 4: ${b * k3} ÷ ${b} = ${k3}, so the top is ${a} × ${k3} = ${a * k3}.`],
      solution: `<p>Column 2: multiplier ${k1} → top ${a * k1}. Column 3: multiplier ${k2} → bottom ${b * k2}. Column 4: multiplier ${k3} → top ${a * k3}.</p>`,
      feedback: { correct: 'Correct. Whichever row is given, divide by the base ratio to find the multiplier, then apply it to the other row.', wrong(ans, d) { return `Check column ${Number(d.wrong[0].slice(1)) + 1}. Divide the given number by its base value (${a} or ${b}) to find the multiplier.`; } },
    });
  });

  // ---------- Table error analysis ----------
  G.define('r3_tableError', (r) => {
    const name = r.pick(NAMES), [a, b] = r.pick([[2, 5], [3, 4], [1, 3], [2, 3], [3, 5]]);
    const step = r.int(2, 3);
    const cols = [[a, b], [a + step, b + step], [a + 2 * step, b + 2 * step]];
    const sh = shuffleOptions(r, [
      { html: `${name} added ${step} to both numbers each time. Equivalent ratios come from <b>multiplying</b> both numbers by the same factor.`, ok: true },
      { html: `${name} multiplied only the top row.`, why: `Look again: each number grew by ${step}, so ${name} was adding, not multiplying.` },
      { html: `${name} should have added ${step} only to the bottom row.`, why: 'Adding to one row alone still breaks the ratio. Adding is not the right operation here.' },
      { html: `The first column ${a} : ${b} is already wrong.`, why: `${a} : ${b} is the given ratio and is fine. The mistake is in how the next columns were made.` },
    ], 0);
    const fixX = a * 2 === a + step ? a * 3 : a * 2; const fixK = fixX / a;
    return {
      type: 'error', skill: 'tables', lesson: '3-3', title: 'Find the mistake in the table',
      prompt: `<p>${name} was asked to make a ratio table equivalent to ${hl(a + ' : ' + b)}. Here is the table:</p>${V.table([['Top', ...cols.map((c) => String(c[0]))], ['Bottom', ...cols.map((c) => String(c[1]))]], { header: false, rowHeader: true, cls: 'compact' })}<p>Which statement describes the mistake?</p>`,
      options: sh.options, answer: sh.answer,
      fix: { label: `If the top is ${fixX}, the bottom should be `, answer: b * fixK },
      hints: [`Check: does ${a + step} : ${b + step} simplify to ${a} : ${b}? Try dividing.`, 'Compare how each column was made. Was the same number added, or was both numbers multiplied?', `To make an equivalent ratio with ${fixX} on top: ${fixX} ÷ ${a} = ${fixK}, so multiply ${b} by ${fixK}.`],
      solution: `<p>${name} added ${step} each time, so the pairs are not equivalent (${a + step}/${b + step} does not equal ${a}/${b}). A correct column with ${fixX} on top uses the multiplier ${fixK}: bottom = ${b} × ${fixK} = <b>${b * fixK}</b>.</p>`,
      feedback: { correct: 'Correct. Adding the same amount to both parts is the most common ratio mistake. Multiplying both parts by the same factor is what keeps ratios equivalent.',
        wrong(ans, d) { if (!d.mistakeOk) return sh.options[ans.mistake] && sh.options[ans.mistake].why || 'Look at how each number changed from column to column.'; return `Mistake found. For the fix: ${fixX} ÷ ${a} = ${fixK}, so multiply ${b} by ${fixK}.`; } },
    };
  });

  // ---------- Which table shows equivalent ratios? (rep) ----------
  G.define('r3_whichTable', (r) => {
    const [a, b] = coprime(r), [l1, l2] = r.pick(CTX);
    const ks = [2, 3, 4];
    const mk = (pairs) => V.table([[l1, ...pairs.map((p) => String(p[0]))], [l2, ...pairs.map((p) => String(p[1]))]], { header: false, rowHeader: true, cls: 'mini' });
    const good = [[a, b], ...ks.map((k) => [a * k, b * k])];
    const add = [[a, b], ...ks.map((k) => [a + k, b + k])];
    const oneRow = [[a, b], ...ks.map((k) => [a * k, b])];
    const sh = shuffleOptions(r, [
      { html: mk(good), ok: true },
      { html: mk(add), why: 'In this table the same number was added to both rows. Adding does not keep ratios equivalent.' },
      { html: mk(oneRow), why: `Only the ${l1} row changes while ${l2} stays ${b}. Both quantities must be multiplied by the same factor.` },
    ], 0);
    return {
      type: 'rep', skill: 'tables', lesson: '3-3', title: 'Choose the correct table',
      prompt: `<p>Which table shows ratios equivalent to ${hl(a + ' ' + l1)} to ${hl(b + ' ' + l2)}?</p>`,
      options: sh.options, answer: sh.answer, layout: 'cards',
      hints: ['In an equivalent-ratio table, every column simplifies to the same ratio.', `Check the second column of each table. Does it simplify to ${a} : ${b}?`, `Only one table multiplies both ${a} and ${b} by 2, then 3, then 4.`],
      solution: `<p>The correct table has columns ${good.map((p) => p.join(':')).join(', ')}. Each is ${a} : ${b} multiplied by the same factor. The other tables add a constant or change only one row.</p>`,
      feedback: { correct: 'Correct. Every column in an equivalent-ratio table simplifies to the same ratio.' },
    };
  });

  // ---------- Table word problem (num) ----------
  G.define('r3_wordProblem', (r) => {
    const [a, b] = r.pick([[2, 3], [3, 4], [1, 2], [3, 2], [2, 5], [4, 3]]);
    const ctx = r.pick([['cups of flour', 'eggs', 'a recipe uses'], ['cups of water', 'scoops of mix', 'the directions call for'], ['liters of blue paint', 'liters of yellow paint', 'the formula mixes']]);
    const k = r.int(5, 12), k1 = r.int(2, 4);
    return {
      type: 'num', skill: 'tables', lesson: '3-3', title: 'Use the table to solve',
      prompt: `<p>${ctx[2].charAt(0).toUpperCase() + ctx[2].slice(1)} ${hl(a + ' ' + ctx[0])} for every ${hl(b + ' ' + ctx[1])}.</p>${V.table([[ctx[0], String(a), String(a * k1), '?'], [ctx[1], String(b), String(b * k1), String(b * k)]], { header: false, rowHeader: true, cls: 'compact' })}<p>How many ${ctx[0]} are needed for ${hl(b * k + ' ' + ctx[1])}?</p>`,
      unit: ctx[0], answer: a * k,
      hints: [`Which column has ${b * k} ${ctx[1]}? Find what ${b} was multiplied by to get there.`, `${b * k} ÷ ${b} = ${k}. The multiplier is ${k}.`, `Multiply ${a} by ${k}.`],
      solution: `<p>${b * k} ÷ ${b} = ${k}, so multiply the ${ctx[0]} by ${k} too: ${a} × ${k} = <b>${a * k}</b>.</p>`,
      feedback: { correct: `Correct. ${b * k} is ${b} × ${k}, so the matching amount is ${a} × ${k} = ${a * k}.`, wrong(ans, d) { if (d.value === b * k + (a - b)) return 'Adding the difference between the two rows does not keep the ratio. Find the multiplier instead.'; return `Find the multiplier: ${b * k} ÷ ${b}. Then multiply ${a} by it.`; } },
    };
  });

  // ---------- Find the unit value first, then complete ----------
  G.define('r3_unitFirst', (r) => {
    const unit = r.int(2, 9), n = r.int(3, 6);
    const ctx = r.pick([['Tickets', 'Cost ($)', 'The table shows the cost of tickets'], ['Boxes', 'Granola bars', 'The table shows how many bars come in boxes'], ['Hours', 'Miles', 'The table shows a steady walking pace']]);
    const [t1, t2] = r.pickN([7, 8, 9, 10, 12].filter((x) => x !== n), 2);
    const cols = [{ x: 1, y: unit, inY: true }, { x: n, y: unit * n }, { x: t1, y: unit * t1, inY: true }, { x: t2, y: unit * t2, inY: true }];
    return tableQ(ctx, cols, {
      skill: 'tables', lesson: '3-3', title: 'Find the value for 1 first',
      prompt: `<p>${ctx[2]}. Complete the table.</p>`,
      hints: [`You know ${n} → ${unit * n}. Find the value for 1 by dividing: ${unit * n} ÷ ${n}.`, `The value for 1 is ${unit}. That is the unit rate.`, `Multiply the unit rate by each number: ${t1} × ${unit} and ${t2} × ${unit}.`],
      solution: `<p>${unit * n} ÷ ${n} = <b>${unit}</b> for 1. Then ${t1} × ${unit} = <b>${unit * t1}</b> and ${t2} × ${unit} = <b>${unit * t2}</b>.</p>`,
      feedback: { correct: `Correct. Finding the value for 1 (${unit}) unlocks every other column.`, wrong() { return `Find the value for 1 first: ${unit * n} ÷ ${n} = ${unit}. Then multiply.`; } },
    });
  });

  // ---------- True/false with justification ----------
  G.define('r3_tf', (r) => {
    const [a, b] = coprime(r), [l1, l2] = r.pick(CTX);
    const truthy = r.chance(0.5);
    const ks = [2, 3, 5];
    const pairs = truthy ? [[a, b], ...ks.map((k) => [a * k, b * k])] : [[a, b], [a * 2, b * 2], [a * 3 + 1, b * 3], [a * 5, b * 5]];
    const reasons = r.shuffle([
      { html: `Yes. Every column simplifies to ${a} : ${b}.`, correct: truthy },
      { html: `No. The column ${pairs[2][0]} : ${pairs[2][1]} does not simplify to ${a} : ${b}.`, correct: !truthy },
      { html: 'Yes. The numbers get bigger in each column.', correct: false },
      { html: 'No. Not all of the numbers are even.', correct: false },
    ]);
    return {
      type: 'tf', skill: 'tables', lesson: '3-3', title: 'Equivalent or not?',
      prompt: `<p>Does this table show <b>equivalent ratios</b>?</p>${V.table([[l1, ...pairs.map((p) => String(p[0]))], [l2, ...pairs.map((p) => String(p[1]))]], { header: false, rowHeader: true, cls: 'compact' })}`,
      statement: 'The table shows equivalent ratios.', answer: truthy, reasons, labels: ['True', 'False'],
      hints: ['Check each column: divide both numbers by their greatest common factor.', `Column 1 is ${a} : ${b}. Does column 3 (${pairs[2][0]} : ${pairs[2][1]}) simplify to the same ratio?`, truthy ? `Every column is ${a} : ${b} times the same factor, so they are all equivalent.` : `${pairs[2][0]} : ${pairs[2][1]} is not ${a} : ${b} scaled by one factor, so the table is not all equivalent.`],
      solution: truthy ? `<p><b>True.</b> Each column is ${a} : ${b} multiplied by ${ks.join(', ')}.</p>` : `<p><b>False.</b> Column 3 is ${pairs[2][0]} : ${pairs[2][1]}. ${pairs[2][1]} ÷ ${b} = 3 but ${pairs[2][0]} ÷ ${a} is not 3, so that pair breaks the pattern.</p>`,
      feedback: { correct: 'Correct, with a correct reason. Numbers growing or being even has nothing to do with equivalence. Simplifying each column is the real test.', wrong(ans, d) { if (!d.valueOk) return 'Test each column by simplifying it. Numbers getting bigger does not make ratios equivalent.'; return 'Your true/false answer is right, but choose the reason that talks about simplifying each column.'; } },
    };
  });
})(typeof window !== 'undefined' ? window : globalThis);

/* js/units/u3/gen-graphs.js */
/* Zone 4 — Signal Observatory. Lesson 3-4 Equivalent Ratios Using Graphs. */
(function (root) {
  'use strict';
  const RX = root.RX;
  const { G, V, shuffleOptions, NAMES } = RX;
  const hl = V.hl;
  const GC = [
    { x: 'Number of Pages', y: 'Number of Stickers', one: 'page', many: 'pages', thing: 'stickers', story: (n, k) => `${n} puts ${k} stickers on each page of a scrapbook.` },
    { x: 'Number of Days', y: 'Number of Laps', one: 'day', many: 'days', thing: 'laps', story: (n, k) => `${n} swims ${k} laps every day.` },
    { x: 'Number of Packs', y: 'Number of Cards', one: 'pack', many: 'packs', thing: 'cards', story: (n, k) => `${n} buys packs that each hold ${k} trading cards.` },
    { x: 'Number of Hours', y: 'Miles Hiked', one: 'hour', many: 'hours', thing: 'miles', story: (n, k) => `${n} hikes ${k} miles every hour.` },
  ];
  const grid = (k, maxX) => { const yMax = Math.max(10, Math.ceil((k * maxX) / 2) * 2 + 2); return { xMax: maxX + 1, yMax, yStep: yMax > 14 ? 2 : 1, xStep: 1 }; };

  // ---------- Plot the points ----------
  G.define('r4_plot', (r, o) => {
    const c = r.pick(GC), name = r.pick(NAMES), k = r.int(2, 4), n = 5;
    const g = grid(k, n);
    const points = Array.from({ length: n }, (_, i) => [i + 1, k * (i + 1)]);
    return {
      type: 'plot', skill: 'graphs', lesson: '3-4', title: 'Plot the points',
      prompt: `<p>${c.story(name, k)} Plot the points that show the number of ${c.thing} for ${hl('1, 2, 3, 4, and 5 ' + c.many)}.</p><p class="muted">Click a grid point to place or remove a point.</p>`,
      xLabel: c.x, yLabel: c.y, xMax: g.xMax, yMax: g.yMax, xStep: 1, yStep: g.yStep, points, count: n,
      hints: [`Each point is (${c.many}, ${c.thing}). For 1 ${c.one}, there are ${k} ${c.thing}: that is the point (1, ${k}).`, `Make a quick table: 1 → ${k}, 2 → ${2 * k}, 3 → ${3 * k}, 4 → ${4 * k}, 5 → ${5 * k}.`, `Plot (1, ${k}), (2, ${2 * k}), (3, ${3 * k}), (4, ${4 * k}), (5, ${5 * k}). The points should line up in a straight line from the origin.`],
      solution: `<p>The points are ${points.map((p) => `(${p[0]}, ${p[1]})`).join(', ')}. Equivalent ratios always form a straight line that would pass through (0, 0).</p>${V.graph({ xLabel: c.x, yLabel: c.y, xMax: g.xMax, yMax: g.yMax, yStep: g.yStep, size: 260, series: [{ points, line: true }] })}`,
      feedback: { correct: 'Correct. The points line up because each one is the same ratio multiplied by a different factor.',
        wrong(ans, d) { if (d.extra.length) { const p = d.extra[0]; if (points.some((q) => q[0] === p[1] && q[1] === p[0])) return `(${p[0]}, ${p[1]}) has the coordinates reversed. The first number is ${c.many} (across), the second is ${c.thing} (up).`; return `(${p[0]}, ${p[1]}) is not on the pattern. ${p[0]} ${c.many} should have ${k * p[0]} ${c.thing}.`; } return `You still need the point for ${d.missing[0][0]} ${d.missing[0][0] === 1 ? c.one : c.many}: (${d.missing[0][0]}, ${d.missing[0][1]}).`; } },
    };
  });

  // ---------- Ordered pairs from a rate and a table ----------
  G.define('r4_orderedPairs', (r) => {
    const name = r.pick(NAMES);
    const ctx = r.pick([['fiber', 'grams of fiber', 'serving', 'cereal'], ['protein', 'grams of protein', 'bar', 'snack bar'], ['sugar', 'grams of sugar', 'cup', 'juice']]);
    const ka = r.int(2, 5); let kb = r.int(2, 6); if (kb === ka) kb = ka + 1;
    const fields = [];
    for (let i = 1; i <= 4; i++) fields.push({ label: `Brand A (${i}, `, suffix: ')', answer: ka * i, width: 'sm' });
    for (let i = 1; i <= 4; i++) fields.push({ label: `Brand B (${i}, `, suffix: ')', answer: kb * i, width: 'sm' });
    return {
      type: 'blanks', skill: 'graphs', lesson: '3-4', title: 'Write the ordered pairs',
      prompt: `<p>${name} is comparing ${ctx[0]} in two brands of ${ctx[3]}. Brand A has ${hl(ka + ' ' + ctx[1])} per ${ctx[2]}. Brand B is shown in the table.</p>${V.table([['Brand B', '', '', ''], [`Number of ${ctx[2]}s`, '2', '3', '4'], [ctx[1].charAt(0).toUpperCase() + ctx[1].slice(1), String(kb * 2), String(kb * 3), String(kb * 4)]], { header: true, rowHeader: true, cls: 'compact' })}<p>Complete the ordered pairs (${ctx[2]}s, ${ctx[1]}) for 1, 2, 3, and 4 ${ctx[2]}s of each brand.</p>`,
      fields, layout: 'two-col', groups: ['Brand A', 'Brand B'],
      hints: [`Brand A: multiply the number of ${ctx[2]}s by ${ka}.`, `Brand B: the table shows 2 ${ctx[2]}s → ${kb * 2}. Divide to find 1 ${ctx[2]}: ${kb * 2} ÷ 2 = ${kb}.`, `Brand B pairs: (1, ${kb}), (2, ${kb * 2}), (3, ${kb * 3}), (4, ${kb * 4}).`],
      solution: `<p>Brand A: (1, ${ka}), (2, ${ka * 2}), (3, ${ka * 3}), (4, ${ka * 4}). Brand B has ${kb} per ${ctx[2]} (${kb * 2} ÷ 2), so (1, ${kb}), (2, ${kb * 2}), (3, ${kb * 3}), (4, ${kb * 4}).</p>`,
      feedback: { correct: 'Correct. Each ordered pair is (number of servings, amount), and each brand keeps its own constant ratio.', wrong(ans, d) { const i = d.wrong[0]; return i < 4 ? `Brand A, ${i + 1} ${ctx[2]}${i ? 's' : ''}: multiply ${i + 1} by ${ka}.` : `Brand B, ${i - 3} ${ctx[2]}${i - 3 > 1 ? 's' : ''}: the table shows ${kb} per ${ctx[2]}, so multiply ${i - 3} by ${kb}.`; } },
    };
  });

  // ---------- Read a graph and extend ----------
  G.define('r4_readGraph', (r) => {
    const c = r.pick(GC), k = r.int(2, 5), ask = r.pick([6, 7, 8]);
    const g = grid(k, 4);
    const points = [1, 2, 3, 4].map((x) => [x, k * x]);
    return {
      type: 'num', skill: 'graphs', lesson: '3-4', title: 'Read the graph',
      prompt: `<p>The graph shows the number of ${c.thing} for different numbers of ${c.many}.</p>${V.graph({ xLabel: c.x, yLabel: c.y, xMax: g.xMax, yMax: g.yMax, yStep: g.yStep, size: 280, series: [{ points }] })}<p>At this rate, how many ${c.thing} are there for ${hl(ask + ' ' + c.many)}?</p>`,
      unit: c.thing, answer: k * ask,
      hints: [`Find the point above 1 on the horizontal axis. Its height is the unit rate.`, `The point (1, ${k}) means ${k} ${c.thing} per ${c.one}.`, `Multiply: ${ask} × ${k}.`],
      solution: `<p>The point (1, ${k}) shows the unit rate: ${k} ${c.thing} per ${c.one}. For ${ask} ${c.many}: ${ask} × ${k} = <b>${k * ask}</b>.</p>`,
      feedback: { correct: `Correct. The point above 1 gives the unit rate (${k}), and ${ask} × ${k} = ${k * ask}.`, wrong(ans, d) { if (d.value === k * 4) return `${k * 4} is the value for 4 ${c.many}, the last point shown. The question asks about ${ask}. Use the unit rate to go further.`; return `Read the unit rate from the point above 1 (${k} per ${c.one}), then multiply by ${ask}.`; } },
    };
  });

  // ---------- Match table to graph (rep) ----------
  G.define('r4_tableToGraph', (r) => {
    const c = r.pick(GC), k = r.int(2, 4);
    const pts = [1, 2, 3, 4].map((x) => [x, k * x]);
    const rev = pts.map((p) => [p[1], p[0]]).filter((p) => p[0] <= 5);
    const addPts = [1, 2, 3, 4].map((x) => [x, k + (x - 1)]);
    const mk = (series) => V.graph({ xLabel: c.x, yLabel: c.y, xMax: 5, yMax: 16, yStep: 2, size: 200, series: [{ points: series }] });
    const sh = shuffleOptions(r, [
      { html: mk(pts), ok: true },
      { html: mk(rev.length ? rev : [[k, 1]]), why: 'This graph has the coordinates reversed. The horizontal axis should be the first number in each pair.' },
      { html: mk(addPts), why: 'These points go up by 1 each time instead of by the same multiple, so they do not match the table.' },
    ], 0);
    return {
      type: 'rep', skill: 'graphs', lesson: '3-4', title: 'Match the table to its graph',
      prompt: `<p>Which graph shows the data in the table?</p>${V.table([[c.x, '1', '2', '3', '4'], [c.y, String(k), String(2 * k), String(3 * k), String(4 * k)]], { header: false, rowHeader: true, cls: 'compact' })}`,
      options: sh.options, answer: sh.answer, layout: 'cards',
      hints: [`Each column of the table is a point: (${c.many}, ${c.thing}). The first number goes across, the second goes up.`, `The first point should be (1, ${k}): 1 across, ${k} up.`, `Check (2, ${2 * k}): 2 across, ${2 * k} up. Only one graph has it.`],
      solution: `<p>The table gives the points (1, ${k}), (2, ${2 * k}), (3, ${3 * k}), (4, ${4 * k}). The correct graph shows exactly those points in a straight line.</p>`,
      feedback: { correct: 'Correct. The first number in each pair goes across; the second goes up.' },
    };
  });

  // ---------- Compare two brands on a graph (MC) ----------
  G.define('r4_compareGraphs', (r) => {
    const ka = r.int(2, 5); let kb = r.int(2, 6); if (kb === ka) kb = ka + 1;
    const ctx = r.pick([['fiber', 'grams of fiber', 'serving'], ['juice', 'ounces of juice', 'bottle'], ['protein', 'grams of protein', 'bar']]);
    const yMax = Math.max(ka, kb) * 4 + 2;
    const greater = ka > kb ? 'A' : 'B';
    const sh = shuffleOptions(r, [
      { html: `Brand ${greater}, because its points are higher at every number of ${ctx[2]}s.`, ok: true },
      { html: `Brand ${greater === 'A' ? 'B' : 'A'}, because its points are higher at every number of ${ctx[2]}s.`, why: `Look again at the graph. Brand ${greater}'s points are above Brand ${greater === 'A' ? 'B' : 'A'}'s at every ${ctx[2]} count.` },
      { html: 'They are the same, because both graphs are straight lines.', why: 'Both are straight lines because both are ratios, but the steeper line has the greater ratio.' },
      { html: `Brand ${greater === 'A' ? 'B' : 'A'}, because its line is less steep.`, why: 'A less steep line means fewer per serving, which is the smaller ratio.' },
    ], 0);
    return {
      type: 'mc', skill: 'graphs', lesson: '3-4', title: 'Compare the graphs',
      prompt: `<p>The graph shows the ${ctx[1]} in two brands.</p>${V.graph({ xLabel: `Number of ${ctx[2]}s`, yLabel: ctx[1].charAt(0).toUpperCase() + ctx[1].slice(1), xMax: 5, yMax, yStep: yMax > 14 ? 2 : 1, size: 290, series: [{ points: [1, 2, 3, 4].map((x) => [x, ka * x]), line: true, label: 'Brand A', color: '#1FA6A2' }, { points: [1, 2, 3, 4].map((x) => [x, kb * x]), line: true, label: 'Brand B', color: '#F2A33A', dashed: true }] })}<p>Which brand offers the greater ratio of ${ctx[1]} to ${ctx[2]}s?</p>`,
      options: sh.options, answer: sh.answer,
      hints: [`Compare the points above 1 ${ctx[2]}. Which brand is higher?`, `Brand A: ${ka} per ${ctx[2]}. Brand B: ${kb} per ${ctx[2]}.`, `${Math.max(ka, kb)} is greater than ${Math.min(ka, kb)}, so Brand ${greater} has the greater ratio. Its line is steeper.`],
      solution: `<p>Brand A has ${ka} per ${ctx[2]}; Brand B has ${kb}. <b>Brand ${greater}</b> has the greater ratio. On a graph, the greater ratio is the steeper line, and its points are higher at every x-value.</p>`,
      feedback: { correct: 'Correct. The steeper line (higher at every x-value) shows the greater ratio.' },
    };
  });

  // ---------- Meaning of a point (MC) ----------
  G.define('r4_pointMeaning', (r) => {
    const c = r.pick(GC), k = r.int(2, 5), x = r.int(2, 4);
    const g = grid(k, 4);
    const sh = shuffleOptions(r, [
      { html: `${x} ${c.many} have ${k * x} ${c.thing}.`, ok: true },
      { html: `${k * x} ${c.many} have ${x} ${c.thing}.`, why: `The first coordinate is ${c.many} and the second is ${c.thing}. You reversed them.` },
      { html: `There are ${k * x} ${c.thing} for each ${c.one}.`, why: `${k * x} is the total for ${x} ${c.many}, not the amount per ${c.one}. The unit rate is ${k}.` },
      { html: `There are ${x} ${c.thing} for each ${c.one}.`, why: `${x} is the number of ${c.many}, not ${c.thing} per ${c.one}.` },
    ], 0);
    return {
      type: 'mc', skill: 'graphs', lesson: '3-4', title: 'What does the point mean?',
      prompt: `<p>The graph shows ${c.thing} and ${c.many}.</p>${V.graph({ xLabel: c.x, yLabel: c.y, xMax: g.xMax, yMax: g.yMax, yStep: g.yStep, size: 260, series: [{ points: [1, 2, 3, 4].map((i) => [i, k * i]) }, { points: [[x, k * x]], color: '#C8553D' }] })}<p>What does the highlighted point ${hl('(' + x + ', ' + k * x + ')')} represent?</p>`,
      options: sh.options, answer: sh.answer,
      hints: ['Read the axis labels. The first number in the pair is on the horizontal axis.', `(${x}, ${k * x}): ${x} is a number of ${c.many}; ${k * x} is a number of ${c.thing}.`, `So ${x} ${c.many} go with ${k * x} ${c.thing}.`],
      solution: `<p>(${x}, ${k * x}) means <b>${x} ${c.many} have ${k * x} ${c.thing}</b>. The unit rate is the point above 1: ${k} ${c.thing} per ${c.one}.</p>`,
      feedback: { correct: 'Correct. An ordered pair reads (horizontal value, vertical value), using the axis labels.' },
    };
  });

  // ---------- Graph to table ----------
  G.define('r4_graphToTable', (r) => {
    const c = r.pick(GC), k = r.int(2, 5);
    const g = grid(k, 4);
    const pts = [1, 2, 3, 4].map((x) => [x, k * x]);
    return {
      type: 'table', skill: 'graphs', lesson: '3-4', title: 'Build the table from the graph',
      prompt: `<p>Use the graph to complete the table.</p>${V.graph({ xLabel: c.x, yLabel: c.y, xMax: g.xMax, yMax: g.yMax, yStep: g.yStep, size: 270, series: [{ points: pts }] })}`,
      rows: [[c.x, '1', '2', '3', '4', '6'], [c.y, '__IN:y1__', '__IN:y2__', '__IN:y3__', '__IN:y4__', '__IN:y6__']], rowHeader: true,
      inputs: [1, 2, 3, 4, 6].map((x) => ({ id: 'y' + x, answer: k * x })),
      hints: [`For each number across, find the point above it and read its height.`, `Above 1 the point is at ${k}. Above 2 it is at ${2 * k}.`, `6 is not on the graph. Use the unit rate: 6 × ${k}.`],
      solution: `<p>Reading up from each x-value: 1 → ${k}, 2 → ${2 * k}, 3 → ${3 * k}, 4 → ${4 * k}. For 6, extend the pattern: 6 × ${k} = <b>${6 * k}</b>.</p>`,
      feedback: { correct: `Correct. Every point is (x, ${k}x), so the table and graph show the same ratio.`, wrong(ans, d) { const x = Number(d.wrong[0].slice(1)); return x === 6 ? `6 is beyond the graph. Multiply 6 by the unit rate (${k}).` : `Look above ${x} on the horizontal axis and read the height of the point.`; } },
    };
  });

  // ---------- Who graphed it correctly? ----------
  G.define('r4_whoGraph', (r) => {
    const c = r.pick(GC), [n1, n2] = r.pickN(NAMES, 2), k = r.int(2, 3);
    const pts = [1, 2, 3].map((x) => [x, k * x]);
    const rev = pts.map((p) => [p[1], p[0]]);
    const yMax = 10;
    const mk = (series) => V.graph({ xLabel: c.x, yLabel: c.y, xMax: 10, yMax, size: 210, xLabelEvery: 2, yLabelEvery: 2, series: [{ points: series }] });
    const sh = shuffleOptions(r, [
      { title: n1, html: mk(pts), ok: true },
      { title: n2, html: mk(rev), why: `${n2} put ${c.thing} on the horizontal axis and ${c.many} on the vertical axis. The labels say the opposite, so each point is reversed.` },
    ], 0);
    return {
      type: 'who', skill: 'graphs', lesson: '3-4', title: 'Whose graph is correct?',
      prompt: `<p>The table shows ${c.thing} per ${c.one}. Two students graphed it with ${c.many} on the horizontal axis.</p>${V.table([[c.x, '1', '2', '3'], [c.y, String(k), String(2 * k), String(3 * k)]], { header: false, rowHeader: true, cls: 'compact' })}<p>Whose graph is correct?</p>`,
      options: sh.options, answer: sh.answer, layout: 'cards',
      hints: [`The first point should be (1, ${k}): 1 across, ${k} up.`, 'Find 1 on the horizontal axis in each graph. How high is the point there?', `Only one graph has a point at (1, ${k}).`],
      solution: `<p>${n1} is correct: (1, ${k}), (2, ${2 * k}), (3, ${3 * k}). ${n2} reversed the coordinates, which changes the meaning of each point.</p>`,
      feedback: { correct: 'Correct. Always read the axis labels before plotting; (x, y) means across first, then up.' },
    };
  });
})(typeof window !== 'undefined' ? window : globalThis);

/* js/units/u3/gen-compare.js */
/* Zone 5 — Mountain Pass. Lesson 3-5 Comparing Ratio Relationships + rate problems (6.RP.3b). */
(function (root) {
  'use strict';
  const RX = root.RX;
  const { G, V, shuffleOptions, NAMES, round } = RX;
  const hl = V.hl;

  // ---------- Unit rate then solve (blanks) ----------
  G.define('r5_unitThenSolve', (r) => {
    const name = r.pick(NAMES), m = r.int(2, 5), per = r.int(7, 12), t = m * per, n = r.int(m + 1, 9), T = per * n;
    return {
      type: 'blanks', skill: 'rate-problems', lesson: '3-5', title: 'Find the rate, then use it',
      prompt: `<p>${name} runs ${hl(m + ' miles')} in ${hl(t + ' minutes')}. Complete the sentences.</p>`,
      template: ['The unit rate is {0} minutes per mile.', `At this rate, ${name} would run {1} miles in ${T} minutes.`],
      fields: [{ answer: per, width: 'sm' }, { answer: n, width: 'sm' }],
      hints: ['First find minutes per 1 mile: minutes ÷ miles.', `${t} ÷ ${m} = ${per} minutes per mile.`, `If each mile takes ${per} minutes, how many miles fit in ${T} minutes? ${T} ÷ ${per}.`],
      solution: `<p>Unit rate: ${t} ÷ ${m} = <b>${per} minutes per mile</b>. Then ${T} ÷ ${per} = <b>${n} miles</b> in ${T} minutes.</p>`,
      feedback: { correct: `Correct. A unit rate (${per} min per mile) lets you solve for any time or distance.`, wrong(ans, d) { if (d.wrong.includes(0)) { const v = RX.parseNum(ans[0]); if (v != null && Math.abs(v - m / t) < 0.01) return `That is miles per minute. "Minutes per mile" means minutes ÷ miles: ${t} ÷ ${m}.`; return `Minutes per mile = ${t} ÷ ${m}.`; } return `The unit rate is right. For the second blank, divide ${T} minutes by ${per} minutes per mile.`; } },
    };
  });

  // ---------- Are these rates equivalent? (tf) ----------
  G.define('r5_equivRates', (r) => {
    const name = r.pick(NAMES), rate = r.int(6, 12), t1 = r.pick([20, 25, 30]), t2 = r.pick([15, 20, 40].filter((x) => x !== t1));
    const equiv = r.chance(0.5);
    const c1 = rate * t1, c2 = equiv ? rate * t2 : rate * t2 + r.pick([-40, 20, 30]);
    const r2 = round(c2 / t2, 2);
    const reasons = r.shuffle([
      { html: `Yes. ${c1} ÷ ${t1} = ${rate} and ${c2} ÷ ${t2} = ${r2}, so both are ${rate} calories per minute.`, correct: equiv },
      { html: `No. ${c1} ÷ ${t1} = ${rate} but ${c2} ÷ ${t2} = ${r2}, so the unit rates are different.`, correct: !equiv },
      { html: `No. ${c1} calories is more than ${c2} calories.`, correct: false },
      { html: 'Yes. Both activities are exercise.', correct: false },
    ]);
    return {
      type: 'tf', skill: 'compare', lesson: '3-5', title: 'Equivalent rates?',
      prompt: `<p>${name} burns ${hl(c1 + ' calories')} swimming for ${hl(t1 + ' minutes')}. Later, ${name} burns ${hl(c2 + ' calories')} biking for ${hl(t2 + ' minutes')}.</p><p>Are these two rates equivalent?</p>`,
      statement: 'The two rates are equivalent.', answer: equiv, reasons, labels: ['Yes, equivalent', 'No, not equivalent'],
      hints: ['Comparing totals does not work because the times are different. Find each unit rate (calories per minute).', `Swimming: ${c1} ÷ ${t1} = ${rate}. Biking: ${c2} ÷ ${t2} = ${r2}.`, equiv ? 'The unit rates match, so the rates are equivalent.' : 'The unit rates are different, so the rates are not equivalent.'],
      solution: `<p>Swimming: ${c1} ÷ ${t1} = ${rate} calories per minute. Biking: ${c2} ÷ ${t2} = ${r2} calories per minute. ${equiv ? '<b>Equivalent</b>: same unit rate.' : '<b>Not equivalent</b>: different unit rates.'}</p>`,
      feedback: { correct: 'Correct. Rates are compared with unit rates, never with totals alone.', wrong(ans, d) { if (!d.valueOk) return `Totals can fool you. Divide: ${c1} ÷ ${t1} and ${c2} ÷ ${t2}, then compare.`; return 'Your answer is right, but the reason must compare the unit rates (calories per minute).'; } },
    };
  });

  // ---------- Compare rates given in different forms (MC) ----------
  G.define('r5_compareMixed', (r) => {
    const [n1, n2, n3] = r.pickN(NAMES, 3);
    const rates = r.pickN([38, 42, 45, 48, 52, 55, 60], 3);
    const t1 = r.int(3, 6), t2 = r.int(2, 4);
    const fastest = rates.indexOf(Math.max(...rates));
    const sh = shuffleOptions(r, [
      { title: n1, html: `Types ${rates[0] * t1} words in ${t1} minutes.`, ok: fastest === 0, why: `${n1} types ${rates[0]} words per minute, which is not the greatest.` },
      { title: n2, html: V.table([['Minutes', String(t2), String(t2 * 2)], ['Words', String(rates[1] * t2), String(rates[1] * t2 * 2)]], { header: false, rowHeader: true, cls: 'mini' }), ok: fastest === 1, why: `${n2} types ${rates[1]} words per minute, which is not the greatest.` },
      { title: n3, html: `Types ${rates[2]} words per minute.`, ok: fastest === 2, why: `${n3} types ${rates[2]} words per minute, which is not the greatest.` },
    ], fastest);
    return {
      type: 'who', skill: 'compare', lesson: '3-5', title: 'Who types fastest?',
      prompt: `<p>Three students describe their typing speed in different ways. Who types the <b>fastest</b>?</p>`,
      options: sh.options, answer: sh.answer, layout: 'cards',
      hints: ['Change every description into a unit rate: words per 1 minute.', `${n1}: ${rates[0] * t1} ÷ ${t1} = ${rates[0]}. ${n2}: ${rates[1] * t2} ÷ ${t2} = ${rates[1]}. ${n3}: ${rates[2]}.`, `The greatest unit rate is ${Math.max(...rates)} words per minute.`],
      solution: `<p>${n1}: ${rates[0]} wpm. ${n2}: ${rates[1]} wpm. ${n3}: ${rates[2]} wpm. <b>${[n1, n2, n3][fastest]}</b> is fastest.</p>`,
      feedback: { correct: 'Correct. Different representations become easy to compare once each is a unit rate.' },
    };
  });

  // ---------- Multi-step rate problem (num) ----------
  G.define('r5_multiStep', (r) => {
    const v = r.pick([
      () => { const g = r.int(2, 5), mpg = r.int(22, 36), G2 = r.int(g + 2, 12); return { prompt: `<p>A van uses ${hl(g + ' gallons')} of fuel to travel ${hl(g * mpg + ' miles')}. At this rate, how far can it travel on ${hl(G2 + ' gallons')}?</p>`, unit: 'miles', answer: mpg * G2, u: mpg, uLabel: 'miles per gallon', first: `${g * mpg} ÷ ${g}`, second: `${G2} × ${mpg}` }; },
      () => { const h = r.int(2, 4), mph = r.int(3, 6), D = mph * r.int(h + 2, 9); return { prompt: `<p>A hiker walks ${hl(h * mph + ' miles')} in ${hl(h + ' hours')}. At this rate, how many hours will it take to walk ${hl(D + ' miles')}?</p>`, unit: 'hours', answer: D / mph, u: mph, uLabel: 'miles per hour', first: `${h * mph} ÷ ${h}`, second: `${D} ÷ ${mph}` }; },
      () => { const m = r.int(3, 6), lpm = r.int(4, 9), L = lpm * r.int(m + 3, 15); return { prompt: `<p>A pump moves ${hl(m * lpm + ' liters')} in ${hl(m + ' minutes')}. How long will it take to move ${hl(L + ' liters')}?</p>`, unit: 'minutes', answer: L / lpm, u: lpm, uLabel: 'liters per minute', first: `${m * lpm} ÷ ${m}`, second: `${L} ÷ ${lpm}` }; },
    ])();
    return {
      type: 'num', skill: 'rate-problems', lesson: '3-5', title: 'Solve with a unit rate',
      prompt: v.prompt, unit: v.unit, answer: v.answer,
      hints: ['Step 1: find the unit rate. Step 2: use it to answer the question.', `Unit rate: ${v.first} = ${v.u} ${v.uLabel}.`, `Now: ${v.second}.`],
      solution: `<p>Unit rate: ${v.first} = ${v.u} ${v.uLabel}. Then ${v.second} = <b>${v.answer} ${v.unit}</b>.</p>`,
      feedback: { correct: `Correct. Two steps: unit rate first (${v.u} ${v.uLabel}), then scale.`, wrong(ans, d) { if (d.value === v.u) return `${v.u} is the unit rate, which is a great first step. Now use it to answer the actual question.`; return `Find the unit rate first: ${v.first}. Then use it for the amount in the question.`; } },
    };
  });

  // ---------- Order three rates shown in different representations (seq) ----------
  G.define('r5_seqRunners', (r) => {
    const [n1, n2, n3] = r.pickN(NAMES, 3);
    const rates = r.pickN([4, 5, 6, 7, 8, 9], 3);
    const items = [
      { html: `<b>${n1}</b>: runs ${rates[0] * 3} km in 3 hours`, rate: rates[0] },
      { html: `<b>${n2}</b>:${V.table([['Hours', '2', '4'], ['km', String(rates[1] * 2), String(rates[1] * 4)]], { header: false, rowHeader: true, cls: 'mini' })}`, rate: rates[1] },
      { html: `<b>${n3}</b>:${V.dnl({ label: 'Hours', values: [0, 1, 2] }, { label: 'km', values: [0, rates[2], rates[2] * 2] })}`, rate: rates[2] },
    ];
    const order = items.map((it, i) => i).sort((a, b) => items[b].rate - items[a].rate);
    return {
      type: 'seq', skill: 'compare', lesson: '3-5', title: 'Order from fastest to slowest',
      prompt: `<p>Three hikers' speeds are shown in different ways. Put them in order from <b>fastest</b> (top) to <b>slowest</b> (bottom).</p>`,
      items, order,
      hints: ['Find kilometers per 1 hour for each hiker.', `${n1}: ${rates[0] * 3} ÷ 3 = ${rates[0]}. ${n2}: ${rates[1] * 2} ÷ 2 = ${rates[1]}. ${n3}: read the value above 1 hour: ${rates[2]}.`, `Fastest has the greatest unit rate: ${Math.max(...rates)} km per hour.`],
      solution: `<p>Unit rates: ${n1} = ${rates[0]}, ${n2} = ${rates[1]}, ${n3} = ${rates[2]} km per hour. Fastest to slowest: <b>${order.map((i) => [n1, n2, n3][i]).join(', ')}</b>.</p>`,
      feedback: { correct: 'Correct. Convert each representation to a unit rate, then compare.', wrong() { return 'At least one hiker is out of place. Find km per hour for each one and compare those numbers.'; } },
    };
  });

  // ---------- Error: comparing totals instead of rates ----------
  G.define('r5_errorTotals', (r) => {
    const name = r.pick(NAMES);
    const rA = r.int(20, 35), dA = r.int(4, 6), rB = rA + r.int(2, 6), dB = r.int(2, 3);
    const tA = rA * dA, tB = rB * dB;
    const sh = shuffleOptions(r, [
      { html: `${name} compared totals, but the number of days is different. Rates must be compared using the same number of days, such as per 1 day.`, ok: true },
      { html: `${name} should have added the two totals together.`, why: 'Adding totals does not compare the two stores.' },
      { html: `${name} is correct because ${tA} is greater than ${tB}.`, why: `${tA} is a bigger total, but it took ${dA} days instead of ${dB}. Compare per day.` },
      { html: `${name} should have subtracted ${tB} from ${tA}.`, why: 'The difference in totals does not tell you which store sells faster each day.' },
    ], 0);
    return {
      type: 'error', skill: 'compare', lesson: '3-5', title: 'Find the comparison mistake',
      prompt: `<p>Store A sold ${hl(tA + ' cups')} of lemonade in ${hl(dA + ' days')}. Store B sold ${hl(tB + ' cups')} in ${hl(dB + ' days')}.</p><p>${name} says: "Store A sells faster because ${tA} is more than ${tB}."</p><p>What is wrong with this reasoning?</p>`,
      work: `${tA} > ${tB}, so Store A sells faster.`,
      options: sh.options, answer: sh.answer,
      fix: { label: 'Store B sells how many cups per day? ', answer: rB },
      hints: ['The totals cover different numbers of days. Is it fair to compare them directly?', `Find each store's cups per day: Store A ${tA} ÷ ${dA}, Store B ${tB} ÷ ${dB}.`, `Store A: ${rA} per day. Store B: ${rB} per day.`],
      solution: `<p>Store A: ${tA} ÷ ${dA} = ${rA} cups per day. Store B: ${tB} ÷ ${dB} = <b>${rB}</b> cups per day. Store B actually sells faster. Totals over different times cannot be compared directly.</p>`,
      feedback: { correct: 'Correct. When the times differ, compare unit rates, not totals.', wrong(ans, d) { if (!d.mistakeOk) return sh.options[ans.mistake] && sh.options[ans.mistake].why || 'Think about whether the days are the same.'; return `You found the mistake. For Store B's rate, divide ${tB} by ${dB}.`; } },
    };
  });

  // ---------- Constructed response: equivalent rates ----------
  G.define('r5_crEquivalent', (r) => {
    const name = r.pick(NAMES), rate = r.int(5, 9), t1 = r.pick([4, 5, 6]), t2 = r.pick([8, 10, 12].filter((x) => x !== t1 * 2 || true));
    const equiv = r.chance(0.5);
    const p1 = rate * t1, p2 = equiv ? rate * t2 : rate * t2 + r.pick([-t2, t2, 2 * t2]);
    const u2 = round(p2 / t2, 2);
    const sh = shuffleOptions(r, [
      { html: equiv ? `Yes. ${p1} ÷ ${t1} = ${rate} and ${p2} ÷ ${t2} = ${rate}. Same unit rate.` : `No. ${p1} ÷ ${t1} = ${rate} but ${p2} ÷ ${t2} = ${u2}. Different unit rates.`, ok: true },
      { html: equiv ? `No. ${p2} pages is more than ${p1} pages.` : `Yes. Both are reading, so the rates are the same.`, why: 'Compare unit rates (pages per day), not totals or activities.' },
      { html: `${equiv ? 'No' : 'Yes'}. ${p1} and ${p2} are both multiples of ${rate}.`, why: 'Being multiples of the same number is not enough. Each total must be divided by its own number of days.' },
    ], 0);
    return {
      type: 'cr', skill: 'compare', lesson: '3-5', title: 'Explain: equivalent rates?',
      prompt: `<p>${name} read ${hl(p1 + ' pages')} in ${hl(t1 + ' days')}. The next week, ${name} read ${hl(p2 + ' pages')} in ${hl(t2 + ' days')}.</p><p>Are these rates equivalent? Explain your reasoning, then choose the correct explanation.</p>`,
      starters: ['The rates are / are not equivalent because …', `First, I found pages per day by dividing …`, 'A unit rate compares to 1 day, so …'],
      minWords: 10,
      check: { prompt: 'Which explanation is correct?', options: sh.options, answer: sh.answer },
      hints: ['Find pages per day for each week.', `Week 1: ${p1} ÷ ${t1} = ${rate}. Week 2: ${p2} ÷ ${t2} = ${u2}.`, equiv ? 'The unit rates are equal, so the rates are equivalent.' : 'The unit rates differ, so the rates are not equivalent.'],
      solution: `<p>Model: "Week 1 is ${p1} ÷ ${t1} = ${rate} pages per day. Week 2 is ${p2} ÷ ${t2} = ${u2} pages per day. ${equiv ? 'The unit rates are the same, so the rates are equivalent.' : 'The unit rates are different, so the rates are not equivalent.'}"</p>`,
      feedback: { correct: 'Correct. A clear explanation names both unit rates and compares them.', wrong(ans, d) { if (!d.wroteEnough) return 'Write a full explanation (a few sentences). Name both unit rates.'; return sh.options[ans.check] && sh.options[ans.check].why || 'Compare pages per day for each week.'; } },
    };
  });

  // ---------- Tape diagram error: subtracting instead of scaling (Q12 style) ----------
  G.define('r5_tapeError', (r, o) => {
    const name = r.pick(NAMES);
    const [a, b] = r.pick([[7, 4], [5, 3], [8, 5], [6, 4], [9, 5], [7, 3]]);
    const [i1, i2] = r.pick([['muffins', 'bagels'], ['roses', 'tulips'], ['hardbacks', 'paperbacks'], ['apples', 'pears']]);
    const k = r.int(5, 9), given = a * k, diff = a - b, wrongAns = given - diff;
    const sh = shuffleOptions(r, [
      { html: `${name} subtracted ${diff}. The ratio ${a} : ${b} means every group of ${a} ${i1} goes with ${b} ${i2}, so <b>both</b> parts must be multiplied by the same number of groups.`, ok: true },
      { html: `${name} should have subtracted ${b} instead of ${diff}.`, why: 'Subtracting any number is the wrong operation. Ratios scale by multiplying.' },
      { html: `${name} is correct because ${a} − ${b} = ${diff}.`, why: `${a} − ${b} = ${diff} is true, but "${diff} more" only holds for one group. With ${given} ${i1}, there are ${k} groups.` },
      { html: `${name} should have added ${diff} to ${given}.`, why: 'Adding is also the wrong operation. Find how many groups of the ratio fit in the given amount.' },
    ], 0);
    return {
      type: 'error', skill: 'tape', lesson: '3-5', title: 'Tape diagram error analysis', xp: o.xp || 15,
      prompt: `<p>A bakery sells ${hl(i1)} and ${hl(i2)} in a ratio of ${hl(a + ' : ' + b)}. ${name} drew this tape diagram.</p>${V.tape([{ label: i1, boxes: a }, { label: i2, boxes: b }])}<p>${name} says: "There are ${diff} more ${i1} than ${i2}, so every group has ${diff} extra ${i1}." Later the bakery has ${hl(given + ' ' + i1)}, and ${name} decides there must be ${hl(wrongAns + ' ' + i2)} by subtracting ${diff}.</p><p>Why is ${name}'s reasoning incorrect?</p>`,
      work: `${given} − ${diff} = ${wrongAns} ${i2}`,
      options: sh.options, answer: sh.answer,
      fix: { label: `Correct number of ${i2} when there are ${given} ${i1}: `, answer: b * k },
      hints: [`The ${i1} row has ${a} boxes and represents ${given}. What is each box worth?`, `${given} ÷ ${a} = ${k}. Each box stands for ${k} items.`, `The ${i2} row has ${b} boxes: ${b} × ${k}.`],
      solution: `<p>Each box represents ${given} ÷ ${a} = ${k}. The ${i2} row has ${b} boxes, so ${b} × ${k} = <b>${b * k} ${i2}</b>. Subtracting ${diff} only works when each box equals 1. The difference grows with the number of groups.</p>${V.tape([{ label: i1, boxes: a, value: k, total: given }, { label: i2, boxes: b, value: k, total: b * k }])}`,
      feedback: { correct: `Correct. Ratios are multiplicative. Each box is worth ${k}, so the ${i2} count is ${b} × ${k} = ${b * k}.`, wrong(ans, d) { if (!d.mistakeOk) return sh.options[ans.mistake] && sh.options[ans.mistake].why || 'Think about what one box is worth.'; return `Right diagnosis. For the fix: ${given} ÷ ${a} = ${k} per box, then ${b} boxes × ${k}.`; } },
    };
  });
})(typeof window !== 'undefined' ? window : globalThis);

/* js/units/u3/gen-convert.js */
/* Zone 6 — Surveyor's Vault. Lessons 3-6 Converting Within One System and 3-7 Converting Between Systems. */
(function (root) {
  'use strict';
  const RX = root.RX;
  const { G, V, shuffleOptions, NAMES, round } = RX;
  const hl = V.hl;

  const WITHIN = [
    { from: 'feet', to: 'yards', f: 3, dir: 'div', sys: 'customary' }, { from: 'inches', to: 'feet', f: 12, dir: 'div', sys: 'customary' },
    { from: 'yards', to: 'feet', f: 3, dir: 'mul', sys: 'customary' }, { from: 'feet', to: 'inches', f: 12, dir: 'mul', sys: 'customary' },
    { from: 'cups', to: 'pints', f: 2, dir: 'div', sys: 'customary' }, { from: 'quarts', to: 'cups', f: 4, dir: 'mul', sys: 'customary' },
    { from: 'gallons', to: 'quarts', f: 4, dir: 'mul', sys: 'customary' }, { from: 'pounds', to: 'ounces', f: 16, dir: 'mul', sys: 'customary' },
    { from: 'ounces', to: 'pounds', f: 16, dir: 'div', sys: 'customary' }, { from: 'minutes', to: 'hours', f: 60, dir: 'div', sys: 'time' },
    { from: 'hours', to: 'minutes', f: 60, dir: 'mul', sys: 'time' }, { from: 'meters', to: 'centimeters', f: 100, dir: 'mul', sys: 'metric' },
    { from: 'centimeters', to: 'meters', f: 100, dir: 'div', sys: 'metric' }, { from: 'kilograms', to: 'grams', f: 1000, dir: 'mul', sys: 'metric' },
    { from: 'grams', to: 'kilograms', f: 1000, dir: 'div', sys: 'metric' }, { from: 'liters', to: 'milliliters', f: 1000, dir: 'mul', sys: 'metric' },
    { from: 'kilometers', to: 'meters', f: 1000, dir: 'mul', sys: 'metric' },
  ];
  const BETWEEN = [
    { from: 'inches', to: 'centimeters', f: 2.54, exact: true }, { from: 'kilograms', to: 'pounds', f: 2.2 }, { from: 'miles', to: 'kilometers', f: 1.61 },
    { from: 'gallons', to: 'liters', f: 3.79 }, { from: 'feet', to: 'meters', f: 0.305 }, { from: 'ounces', to: 'grams', f: 28.35 },
  ];
  const REF = `<table class="viz-table compact ref"><tr><th>Customary ↔ Metric</th><th>Within customary</th><th>Within metric</th></tr>
    <tr><td>1 inch = 2.54 centimeters</td><td>1 foot = 12 inches</td><td>1 meter = 100 centimeters</td></tr>
    <tr><td>1 foot ≈ 0.305 meter</td><td>1 yard = 3 feet</td><td>1 kilometer = 1,000 meters</td></tr>
    <tr><td>1 mile ≈ 1.61 kilometers</td><td>1 pound = 16 ounces</td><td>1 kilogram = 1,000 grams</td></tr>
    <tr><td>1 kilogram ≈ 2.2 pounds</td><td>1 cup = 8 fluid ounces</td><td>1 liter = 1,000 milliliters</td></tr>
    <tr><td>1 ounce ≈ 28.35 grams</td><td>1 pint = 2 cups</td><td></td></tr>
    <tr><td>1 gallon ≈ 3.79 liters</td><td>1 quart = 4 cups · 1 gallon = 4 quarts</td><td></td></tr></table>`;
  RX.REFERENCE_SHEET = REF;
  const STORY = {
    feet: (n) => `A trail is ${n} feet long.`, inches: (n) => `A board is ${n} inches long.`, yards: (n) => `A field is ${n} yards long.`, cups: (n) => `A recipe needs ${n} cups of broth.`,
    quarts: (n) => `A cooler holds ${n} quarts.`, gallons: (n) => `A tank holds ${n} gallons.`, pounds: (n) => `A pack weighs ${n} pounds.`, ounces: (n) => `A bag of trail mix weighs ${n} ounces.`,
    minutes: (n) => `A hike lasts ${n} minutes.`, hours: (n) => `A climb takes ${n} hours.`, meters: (n) => `A rope is ${n} meters long.`, centimeters: (n) => `A map is ${n} centimeters wide.`,
    kilograms: (n) => `A crate weighs ${n} kilograms.`, grams: (n) => `A rock sample weighs ${n} grams.`, liters: (n) => `A jug holds ${n} liters.`, kilometers: (n) => `A river section is ${n} kilometers long.`, miles: (n) => `A road is ${n} miles long.`,
  };

  function withinValue(r, c) {
    if (c.from === 'feet' && c.to === 'yards') return 3 * r.int(200, 900);
    if (c.dir === 'div') return c.f * r.int(c.f >= 100 ? 2 : 3, c.f >= 100 ? 9 : 12);
    return r.int(2, c.f >= 100 ? 9 : 15);
  }

  // ---------- Convert within a system (num) ----------
  G.define('r6_within', (r, o) => {
    const c = r.pick(o.pool || WITHIN);
    const n = withinValue(r, c);
    const ans = c.dir === 'div' ? n / c.f : n * c.f;
    const name = r.pick(NAMES);
    const story = c.from === 'feet' && c.to === 'yards' ? `${name} walks to the library. The library is ${hl(n.toLocaleString() + ' feet')} away.` : STORY[c.from](hl(n.toLocaleString() + ' ' + c.from));
    return {
      type: 'num', skill: 'convert-within', lesson: '3-6', title: 'Convert the measurement',
      prompt: `<p>${story}</p><p>How many ${hl(c.to)} is that?</p>`, unit: c.to, answer: ans, reference: true,
      hints: [`How many ${c.dir === 'div' ? c.to.slice(0, -1) + 's' : c.from} make 1 ${c.dir === 'div' ? c.to.slice(0, -1) : c.from.slice(0, -1)}? Check the reference sheet.`, c.dir === 'div' ? `1 ${c.to.slice(0, -1)} = ${c.f} ${c.from}. Going from a smaller unit to a bigger unit, you need fewer of them: divide.` : `1 ${c.from.slice(0, -1)} = ${c.f} ${c.to}. Going from a bigger unit to a smaller unit, you need more of them: multiply.`, c.dir === 'div' ? `${n.toLocaleString()} ÷ ${c.f}` : `${n} × ${c.f}`],
      solution: `<p>${c.dir === 'div' ? `${n.toLocaleString()} ${c.from} ÷ ${c.f} = <b>${RX.fmt(ans)} ${c.to}</b>. Bigger unit, so fewer of them: divide.` : `${n} ${c.from} × ${c.f} = <b>${RX.fmt(ans)} ${c.to}</b>. Smaller unit, so more of them: multiply.`}</p>`,
      feedback: { correct: `Correct. ${c.dir === 'div' ? 'Dividing' : 'Multiplying'} by ${c.f} converts ${c.from} to ${c.to}.`, wrong(ans2, d) { const v = d.value; if (v != null && Math.abs(v - (c.dir === 'div' ? n * c.f : n / c.f)) < 0.01) return `You went the wrong direction. ${c.to} are ${c.dir === 'div' ? 'bigger' : 'smaller'} than ${c.from}, so you need ${c.dir === 'div' ? 'fewer' : 'more'} of them: ${c.dir === 'div' ? 'divide' : 'multiply'} by ${c.f}.`; return `Use 1 ${c.dir === 'div' ? c.to.slice(0, -1) : c.from.slice(0, -1)} = ${c.f} ${c.dir === 'div' ? c.from : c.to}. ${c.dir === 'div' ? 'Divide' : 'Multiply'} by ${c.f}.`; } },
    };
  });

  // ---------- Multiply or divide? (who) ----------
  G.define('r6_direction', (r) => {
    const c = r.pick(WITHIN.filter((w) => w.f <= 60)), [n1, n2, n3] = r.pickN(NAMES, 3), n = r.int(3, 9) * (c.dir === 'div' ? c.f : 1);
    const right = c.dir === 'div' ? `${n} ÷ ${c.f} = ${n / c.f}` : `${n} × ${c.f} = ${n * c.f}`;
    const wrongDir = c.dir === 'div' ? `${n} × ${c.f} = ${n * c.f}` : `${n} ÷ ${c.f} = ${round(n / c.f, 2)}`;
    const sh = shuffleOptions(r, [
      { title: n1, html: `${right}<br><b>${c.dir === 'div' ? n / c.f : n * c.f} ${c.to}</b>`, ok: true },
      { title: n2, html: `${wrongDir}<br><b>${c.dir === 'div' ? n * c.f : round(n / c.f, 2)} ${c.to}</b>`, why: `${n2} went the wrong direction. ${c.to} are ${c.dir === 'div' ? 'bigger' : 'smaller'} units than ${c.from}, so there should be ${c.dir === 'div' ? 'fewer' : 'more'} of them.` },
      { title: n3, html: `${n} ${c.dir === 'div' ? '−' : '+'} ${c.f} = ${c.dir === 'div' ? n - c.f : n + c.f}<br><b>${c.dir === 'div' ? n - c.f : n + c.f} ${c.to}</b>`, why: `${n3} added or subtracted. Converting units is a ratio, so you multiply or divide by the conversion factor.` },
    ], 0);
    return {
      type: 'who', skill: 'convert-within', lesson: '3-6', title: 'Multiply or divide?',
      prompt: `<p>Convert ${hl(n + ' ' + c.from)} to ${hl(c.to)}. Three students show their work. Who is correct?</p>`,
      options: sh.options, answer: sh.answer, layout: 'cards', reference: true,
      hints: [`1 ${c.dir === 'div' ? c.to.slice(0, -1) : c.from.slice(0, -1)} = ${c.f} ${c.dir === 'div' ? c.from : c.to}.`, `Are ${c.to} bigger or smaller than ${c.from}? Bigger units mean fewer of them (divide). Smaller units mean more (multiply).`, right],
      solution: `<p>${right}, so <b>${c.dir === 'div' ? n / c.f : n * c.f} ${c.to}</b>. ${n1} is correct.</p>`,
      feedback: { correct: 'Correct. Bigger unit → divide; smaller unit → multiply. Never add or subtract.' },
    };
  });

  // ---------- Conversion ratio table ----------
  G.define('r6_table', (r) => {
    const c = r.pick(WITHIN.filter((w) => w.dir === 'mul' && w.f <= 60));
    const xs = [1, 2, 3, r.int(5, 8)];
    const inputs = [{ id: 'y1', answer: c.f * 2 }, { id: 'y2', answer: c.f * xs[3] }, { id: 'x1', answer: 4 }];
    return {
      type: 'table', skill: 'convert-within', lesson: '3-6', title: 'Complete the conversion table',
      prompt: `<p>The table converts ${hl(c.from)} to ${hl(c.to)}. Complete it.</p>`,
      rows: [[c.from.charAt(0).toUpperCase() + c.from.slice(1), '1', '2', '3', '__IN:x1__', String(xs[3])], [c.to.charAt(0).toUpperCase() + c.to.slice(1), String(c.f), '__IN:y1__', String(c.f * 3), String(c.f * 4), '__IN:y2__']], rowHeader: true,
      inputs,
      hints: [`1 ${c.from.slice(0, -1)} = ${c.f} ${c.to}. This is a ratio table with the ratio 1 : ${c.f}.`, `Multiply ${c.from} by ${c.f} to get ${c.to}. Divide ${c.to} by ${c.f} to get ${c.from}.`, `2 × ${c.f} = ${c.f * 2}; ${c.f * 4} ÷ ${c.f} = 4; ${xs[3]} × ${c.f} = ${c.f * xs[3]}.`],
      solution: `<p>Every column is 1 : ${c.f}. 2 ${c.from} = <b>${c.f * 2}</b> ${c.to}; ${c.f * 4} ${c.to} = <b>4</b> ${c.from}; ${xs[3]} ${c.from} = <b>${c.f * xs[3]}</b> ${c.to}.</p>`,
      feedback: { correct: 'Correct. A conversion is just a ratio table where one row is 1.', wrong(ans, d) { return d.wrong[0] === 'x1' ? `For the missing ${c.from}, divide ${c.f * 4} by ${c.f}.` : `Multiply the number of ${c.from} by ${c.f}.`; } },
    };
  });

  // ---------- Match equivalent measures ----------
  G.define('r6_match', (r) => {
    const picks = r.pickN(WITHIN.filter((w) => w.dir === 'mul'), 5);
    const pairs = picks.map((c) => { const n = r.int(2, 6); return [`${n} ${c.from}`, `${(n * c.f).toLocaleString()} ${c.to}`]; });
    const right = r.shuffle(pairs.map((p, i) => i));
    return {
      type: 'match', skill: 'convert-within', lesson: '3-6', title: 'Match equivalent measures',
      prompt: '<p>Match each measurement with an equivalent one.</p>',
      left: pairs.map((p) => p[0]), right: right.map((i) => pairs[i][1]), pairs: pairs.map((p, i) => [i, right.indexOf(i)]), reference: true,
      hints: ['Use the reference sheet to find how many small units are in 1 big unit.', `For example, ${pairs[0][0]}: multiply by the conversion factor.`, `${pairs[0][0]} = ${pairs[0][1]}.`],
      solution: `<ul>${pairs.map((p) => `<li>${p[0]} = ${p[1]}</li>`).join('')}</ul>`,
      feedback: { correct: 'Correct. Each pair is the same amount measured in two units.' },
    };
  });

  // ---------- Kilograms to pounds, best approximation (MC) ----------
  G.define('r6_kgLb', (r, o) => {
    const name = r.pick(NAMES), W = r.int(4, 16) * 5;
    const act = r.pick(['squats', 'deadlifts', 'bench presses']);
    const sh = shuffleOptions(r, [
      { html: `${Math.round(W * 2.2)} pounds`, ok: true },
      { html: `${Math.round(W / 2.2)} pounds`, why: 'That divides by 2.2. A kilogram is heavier than a pound, so there are more pounds: multiply.' },
      { html: `${Math.round(W * 1.61)} pounds`, why: '1.61 is the miles-to-kilometers factor, not kilograms to pounds. Check the reference sheet.' },
      { html: `${Math.round(W * 2.54)} pounds`, why: '2.54 is the inches-to-centimeters factor. For kilograms to pounds, use 2.2.' },
    ], 0);
    return {
      type: 'mc', skill: 'convert-between', lesson: '3-7', title: 'Convert between systems', xp: o.xp,
      prompt: `<p>${name} does ${act} with ${hl(W + '-kilogram')} weights. Which is the best approximation for the number of <b>pounds</b> ${name} lifts?</p><p class="muted">Use the reference sheet.</p>`,
      options: sh.options, answer: sh.answer, reference: true,
      hints: ['Find the kilogram-to-pound line on the reference sheet.', '1 kilogram ≈ 2.2 pounds. A kilogram is heavier than a pound, so the number of pounds will be bigger.', `${W} × 2.2 = ${round(W * 2.2, 1)}.`],
      solution: `<p>1 kg ≈ 2.2 lb, so ${W} kg ≈ ${W} × 2.2 = <b>${round(W * 2.2, 1)} pounds</b>.</p>`,
      feedback: { correct: `Correct. ${W} × 2.2 ≈ ${Math.round(W * 2.2)} pounds. Picking the right factor from the reference sheet is the key step.` },
    };
  });

  // ---------- Convert between systems (num) ----------
  G.define('r6_between', (r) => {
    const c = r.pick(BETWEEN);
    const n = c.exact ? r.int(3, 12) : r.int(2, 9) * (c.f < 1 ? 5 : 1);
    const exact = n * c.f, ans = c.exact ? round(exact, 2) : round(exact, 1);
    return {
      type: 'num', skill: 'convert-between', lesson: '3-7', title: 'Convert between systems',
      prompt: `<p>${STORY[c.from](hl(n + ' ' + c.from))}</p><p>About how many ${hl(c.to)} is that? ${c.exact ? '' : 'Round to the nearest tenth.'}</p>`,
      unit: c.to, answer: ans, tolerance: c.exact ? 0.011 : 0.11, reference: true,
      hints: [`Find the ${c.from} ↔ ${c.to} line on the reference sheet.`, `1 ${c.from.slice(0, -1)} ≈ ${c.f} ${c.to}. Multiply the number of ${c.from} by ${c.f}.`, `${n} × ${c.f} = ${round(exact, 3)}.`],
      solution: `<p>1 ${c.from.slice(0, -1)} ≈ ${c.f} ${c.to}, so ${n} × ${c.f} ≈ <b>${ans} ${c.to}</b>.</p>`,
      feedback: { correct: `Correct. Multiplying by the conversion factor ${c.f} changes ${c.from} to ${c.to}.`, wrong(ans2, d) { if (d.value != null && Math.abs(d.value - n / c.f) < 0.1) return `You divided. 1 ${c.from.slice(0, -1)} is ${c.f} ${c.to}, so multiply ${n} by ${c.f}.`; return `Multiply ${n} by the factor for ${c.from} to ${c.to} (${c.f}).`; } },
    };
  });

  // ---------- Two-step conversion (num) ----------
  G.define('r6_twoStep', (r) => {
    const v = r.pick([
      () => { const x = r.int(2, 6); return { prompt: `<p>A beam is ${hl(x + ' feet')} long. A metric tape measure shows <b>centimeters</b>. How long is the beam in centimeters? <span class="muted">(Hint: feet → inches → centimeters.)</span></p>`, unit: 'centimeters', answer: round(x * 12 * 2.54, 2), tol: 0.02, s1: `${x} feet × 12 = ${x * 12} inches`, s2: `${x * 12} × 2.54 = ${round(x * 12 * 2.54, 2)} centimeters` }; },
      () => { const g = r.int(2, 5); return { prompt: `<p>A camp stove tank holds ${hl(g + ' gallons')}. Fuel is sold by the <b>liter</b>. About how many liters fill the tank? Round to the nearest tenth.</p>`, unit: 'liters', answer: round(g * 3.79, 1), tol: 0.11, s1: `1 gallon ≈ 3.79 liters`, s2: `${g} × 3.79 ≈ ${round(g * 3.79, 2)} liters` }; },
      () => { const kg = r.pick([2.5, 4.5, 5, 7.5, 10]); const c = r.int(2, 4); return { prompt: `<p>A package weighs ${hl(kg + ' kilograms')}. Shipping costs ${hl('$' + c)} per <b>pound</b>. About how much does shipping cost? Round to the nearest cent.</p>`, unit: 'dollars', answer: round(kg * 2.2 * c, 2), tol: 0.02, s1: `${kg} kg × 2.2 = ${round(kg * 2.2, 2)} pounds`, s2: `${round(kg * 2.2, 2)} × $${c} = $${round(kg * 2.2 * c, 2)}` }; },
    ])();
    return {
      type: 'num', skill: 'convert-between', lesson: '3-7', title: 'Two-step conversion', xp: 15,
      prompt: v.prompt, unit: v.unit, answer: v.answer, tolerance: v.tol, reference: true,
      hints: ['This takes two steps. Write down the first conversion before doing the second.', `Step 1: ${v.s1}.`, `Step 2: ${v.s2}.`],
      solution: `<p>Step 1: ${v.s1}. Step 2: ${v.s2}. Answer: <b>${v.answer} ${v.unit}</b>.</p>`,
      feedback: { correct: 'Correct. Chaining two conversions is just multiplying by two ratios in a row.', wrong() { return `Do it in two steps: ${v.s1}. Then use that result for the second conversion.`; } },
    };
  });

  // ---------- Sort conversions: multiply or divide ----------
  G.define('r6_sortDir', (r) => {
    const picks = r.shuffle(r.pickN(WITHIN.filter((w) => w.dir === 'mul'), 3).concat(r.pickN(WITHIN.filter((w) => w.dir === 'div'), 3)));
    return {
      type: 'sort', skill: 'convert-within', lesson: '3-6', title: 'Multiply or divide?',
      prompt: '<p>To convert each measurement, would you <b>multiply</b> or <b>divide</b> by the conversion factor? Sort each one.</p>',
      bins: ['Multiply', 'Divide'], items: picks.map((c) => ({ html: `${c.from} → ${c.to}`, bin: c.dir === 'mul' ? 0 : 1 })),
      hints: ['Ask: is the new unit bigger or smaller than the old one?', 'Going to a smaller unit means you need more of them: multiply. Going to a bigger unit means fewer: divide.', `${picks[0].from} → ${picks[0].to}: ${picks[0].dir === 'mul' ? 'smaller unit, so multiply' : 'bigger unit, so divide'}.`],
      solution: `<ul>${picks.map((c) => `<li>${c.from} → ${c.to}: <b>${c.dir === 'mul' ? 'multiply' : 'divide'}</b> by ${c.f}</li>`).join('')}</ul>`,
      feedback: { correct: 'Correct. Smaller unit → more of them → multiply. Bigger unit → fewer → divide.', wrong(ans, d) { const c = picks[d.wrong[0]]; return `${c.from} → ${c.to}: ${c.to} are ${c.dir === 'mul' ? 'smaller' : 'bigger'} than ${c.from}, so you need ${c.dir === 'mul' ? 'more' : 'fewer'} of them.`; } },
    };
  });
})(typeof window !== 'undefined' ? window : globalThis);

/* js/units/u3/gen-cave.js */
/* Hidden Cave — optional challenge content (harder, mixed skills). */
(function (root) {
  'use strict';
  const RX = root.RX;
  const { G, V, shuffleOptions, NAMES, round, money } = RX;
  const hl = V.hl;

  // ---------- Unit price with mixed units (MC) ----------
  G.define('c_mixedUnits', (r) => {
    const oz = r.pick([24, 32, 40, 48]), lbA = oz / 16, uA = r.int(20, 32) / 10, pA = round(uA * lbA, 2);
    const lbB = r.pick([1.5, 2.5, 3]); let uB = r.int(20, 32) / 10; if (Math.abs(uB - uA) < 0.15) uB = round(uA + 0.3, 2);
    const pB = round(uB * lbB, 2);
    const best = uA < uB ? 'A' : 'B';
    const sh = shuffleOptions(r, [
      { html: `Brand ${best}, at ${money(Math.min(uA, uB))} per pound`, ok: true },
      { html: `Brand ${best === 'A' ? 'B' : 'A'}, at ${money(Math.max(uA, uB))} per pound`, why: `That is the higher unit price. The better buy is the lower price per pound.` },
      { html: `Brand A, at ${money(round(pA / oz, 2))} per pound`, why: `${money(round(pA / oz, 2))} is the price per <b>ounce</b>, not per pound. Convert ${oz} ounces to pounds first (÷ 16).` },
      { html: `Brand B, because ${pB} is less than ${pA}`, why: 'Comparing total prices ignores the different sizes. Compare price per pound.' },
    ], 0);
    return {
      type: 'mc', skill: 'unit-price', lesson: '3-2', title: 'Challenge: mixed units', xp: 20,
      prompt: `<p>Brand A: ${hl(oz + ' ounces')} of granola for ${hl(money(pA))}.<br>Brand B: ${hl(lbB + ' pounds')} of granola for ${hl(money(pB))}.</p><p>Which is the better buy, and what is its unit price <b>per pound</b>?</p>`,
      options: sh.options, answer: sh.answer, reference: true,
      hints: ['The sizes use different units. Convert ounces to pounds first (16 ounces = 1 pound).', `${oz} ÷ 16 = ${lbA} pounds. Brand A: ${money(pA)} ÷ ${lbA}.`, `Brand A: ${money(uA)} per lb. Brand B: ${money(pB)} ÷ ${lbB} = ${money(uB)} per lb.`],
      solution: `<p>Brand A: ${oz} oz = ${lbA} lb, so ${money(pA)} ÷ ${lbA} = ${money(uA)} per lb. Brand B: ${money(pB)} ÷ ${lbB} = ${money(uB)} per lb. <b>Brand ${best}</b> is the better buy.</p>`,
      feedback: { correct: 'Correct. Matching the units first makes the unit prices comparable.' },
    };
  });

  // ---------- Three-way comparison with three representations (seq) ----------
  G.define('c_threeWay', (r) => {
    const [n1, n2, n3] = r.pickN(NAMES, 3);
    const rates = r.pickN([2.5, 3, 3.5, 4, 4.5, 5], 3);
    const items = [
      { html: `<b>${n1}</b>: ${rates[0] * 4} miles in 4 hours`, rate: rates[0] },
      { html: `<b>${n2}</b>:${V.graph({ xLabel: 'Hours', yLabel: 'Miles', xMax: 4, yMax: 20, yStep: 4, size: 150, series: [{ points: [[2, rates[1] * 2], [4, rates[1] * 4]] }] })}`, rate: rates[1] },
      { html: `<b>${n3}</b>:${V.table([['Hours', '2', '6'], ['Miles', String(rates[2] * 2), String(rates[2] * 6)]], { header: false, rowHeader: true, cls: 'mini' })}`, rate: rates[2] },
    ];
    const order = [0, 1, 2].sort((a, b) => items[a].rate - items[b].rate);
    return {
      type: 'seq', skill: 'compare', lesson: '3-5', title: 'Challenge: order the hikers', xp: 20,
      prompt: `<p>Order the hikers from <b>slowest</b> (top) to <b>fastest</b> (bottom). Some unit rates are not whole numbers.</p>`,
      items, order,
      hints: ['Find miles per hour for each. A unit rate can be a decimal.', `${n1}: ${rates[0] * 4} ÷ 4 = ${rates[0]}. ${n2}: read the point at 2 hours (${rates[1] * 2}) and divide by 2. ${n3}: ${rates[2] * 2} ÷ 2.`, `Rates: ${rates.join(', ')} mph. Order from least to greatest.`],
      solution: `<p>${n1}: ${rates[0]} mph; ${n2}: ${rates[1]} mph; ${n3}: ${rates[2]} mph. Slowest to fastest: <b>${order.map((i) => [n1, n2, n3][i]).join(', ')}</b>.</p>`,
      feedback: { correct: 'Correct. Decimal unit rates compare just like whole numbers.', wrong() { return 'Find each unit rate as a decimal and compare. Check the order direction: slowest first.'; } },
    };
  });

  // ---------- Ratio with a difference instead of a total (blanks) ----------
  G.define('c_difference', (r) => {
    const [a, b] = r.pick([[5, 3], [7, 4], [8, 5], [9, 4], [6, 1], [7, 2]]), k = r.int(4, 9), diff = (a - b) * k;
    const [i1, i2] = r.pick([['fiction books', 'nonfiction books'], ['red marbles', 'blue marbles'], ['sunny days', 'rainy days']]);
    return {
      type: 'blanks', skill: 'tape', lesson: '3-1', title: 'Challenge: ratio with a difference', xp: 20,
      prompt: `<p>The ratio of ${hl(i1)} to ${hl(i2)} on a shelf is ${hl(a + ' : ' + b)}. There are ${hl(diff + ' more')} ${i1} than ${i2}.</p>${V.tape([{ label: i1, boxes: a }, { label: i2, boxes: b }])}<p>How many of each are there?</p>`,
      fields: [{ label: i1, answer: a * k }, { label: i2, answer: b * k }],
      hints: [`In the tape diagram, how many more boxes does the ${i1} row have? ${a} − ${b} = ${a - b}.`, `Those ${a - b} extra boxes represent ${diff}. So each box is worth ${diff} ÷ ${a - b} = ${k}.`, `${i1}: ${a} × ${k}. ${i2}: ${b} × ${k}.`],
      solution: `<p>The difference of ${a - b} boxes equals ${diff}, so each box is ${k}. ${i1} = ${a} × ${k} = <b>${a * k}</b>; ${i2} = ${b} × ${k} = <b>${b * k}</b>. Check: ${a * k} − ${b * k} = ${diff}.</p>`,
      feedback: { correct: 'Correct. A difference tells you the value of the extra boxes, which unlocks the box value.', wrong(ans) { const x = RX.parseNum(ans[0]), y = RX.parseNum(ans[1]); if (x != null && y != null && x - y !== diff) return `Your two numbers differ by ${x - y}, but the difference should be ${diff}. Use the extra ${a - b} boxes to find the box value.`; return `Each box = ${diff} ÷ ${a - b}. Then multiply by the number of boxes in each row.`; } },
    };
  });

  // ---------- Graph with a non-integer unit rate (num) ----------
  G.define('c_graphDecimal', (r) => {
    const half = r.pick([1.5, 2.5, 3.5]), ask = r.pick([5, 7, 9]);
    const pts = [2, 4, 6].map((x) => [x, half * x]);
    return {
      type: 'num', skill: 'graphs', lesson: '3-4', title: 'Challenge: read a decimal rate', xp: 20,
      prompt: `<p>The graph shows cups of water per scoop of mix.</p>${V.graph({ xLabel: 'Scoops', yLabel: 'Cups of Water', xMax: 8, yMax: 24, yStep: 2, size: 280, series: [{ points: pts, line: true }] })}<p>How many cups of water are needed for ${hl(ask + ' scoops')}?</p>`,
      unit: 'cups', answer: half * ask, tolerance: 0.01,
      hints: ['There is no point above 1. Use a point you can read clearly, like (2, ' + half * 2 + ').', `${half * 2} ÷ 2 = ${half} cups per scoop.`, `${ask} × ${half} = ${half * ask}.`],
      solution: `<p>(2, ${half * 2}) gives ${half * 2} ÷ 2 = ${half} cups per scoop. For ${ask} scoops: ${ask} × ${half} = <b>${half * ask} cups</b>.</p>`,
      feedback: { correct: 'Correct. Unit rates can be decimals; reading a clear point and dividing gets you there.', wrong() { return `Read the point at 2 scoops (${half * 2} cups) and divide by 2 to get the unit rate.`; } },
    };
  });

  // ---------- Double number line with half steps (dnl) ----------
  G.define('c_dnlHalf', (r) => {
    const rate = r.pick([4, 6, 8, 10]);
    const hours = [0, 0.5, 1, 1.5, 2, 2.5];
    const miles = hours.map((h) => rate * h);
    const blanksAt = [1, 3, 5];
    return {
      type: 'dnl', skill: 'dnl', lesson: '3-2', title: 'Challenge: half-hour steps', xp: 20,
      prompt: `<p>A cyclist rides ${hl(rate + ' miles')} every hour. Complete the double number line. The ticks are every half hour.</p>`,
      top: { label: 'Hours', values: hours }, bottom: { label: 'Miles', values: miles.map((m, i) => (blanksAt.includes(i) ? null : m)) },
      blanks: blanksAt.map((i) => ({ row: 'bottom', i, answer: miles[i] })),
      hints: ['Each tick is half an hour. Half of the unit rate goes with 0.5 hours.', `${rate} ÷ 2 = ${rate / 2} miles in 0.5 hour.`, `1.5 hours = 1 hour + 0.5 hour = ${rate} + ${rate / 2}. 2.5 hours = ${rate * 2} + ${rate / 2}.`],
      solution: `<p>0.5 h → ${rate / 2}; 1.5 h → ${rate * 1.5}; 2.5 h → ${rate * 2.5}. Each half hour adds ${rate / 2} miles.</p>`,
      feedback: { correct: 'Correct. A double number line works with fractions of a unit too.', wrong() { return `Half an hour is half the unit rate: ${rate / 2} miles. Add ${rate / 2} for each half-hour tick.`; } },
    };
  });

  // ---------- Two-step between systems with money (num) ----------
  G.define('c_twoStepMoney', (r) => {
    const km = r.pick([8, 12, 16, 20]), perMile = r.int(2, 4);
    const miles = round(km / 1.61, 1), cost = round(miles * perMile, 2);
    return {
      type: 'num', skill: 'convert-between', lesson: '3-7', title: 'Challenge: convert, then pay', xp: 20,
      prompt: `<p>A taxi charges ${hl('$' + perMile)} per <b>mile</b>. The airport is ${hl(km + ' kilometers')} away.</p><p>About how much will the ride cost? First convert to miles and round to the nearest tenth, then find the cost.</p>`,
      unit: 'dollars', answer: cost, tolerance: 0.3, reference: true,
      hints: ['Step 1: kilometers → miles. 1 mile ≈ 1.61 km, so divide by 1.61.', `${km} ÷ 1.61 ≈ ${miles} miles.`, `${miles} miles × $${perMile} per mile.`],
      solution: `<p>${km} ÷ 1.61 ≈ ${miles} miles. ${miles} × $${perMile} ≈ <b>$${cost}</b>.</p>`,
      feedback: { correct: 'Correct. Convert first so the unit matches the rate, then multiply.', wrong(ans, d) { if (d.value != null && Math.abs(d.value - km * perMile) < 0.01) return `You charged per kilometer. The rate is per mile, so convert ${km} km to miles first (÷ 1.61).`; return `Convert ${km} km to miles (÷ 1.61), then multiply by $${perMile}.`; } },
    };
  });

  // ---------- Part-to-whole table error ----------
  G.define('c_partWholeError', (r) => {
    const name = r.pick(NAMES), [a, b] = r.pick([[2, 3], [3, 5], [1, 4], [3, 4]]), t = a + b, ks = [1, 2, 3];
    const sh = shuffleOptions(r, [
      { html: `${name} used the part-to-part ratio ${a} : ${b}. The question asks for red compared to the <b>total</b>, which is ${a} : ${t}.`, ok: true },
      { html: `${name} should have added ${a} and ${b} in every column instead of multiplying.`, why: 'The multiplying is fine. The problem is which two quantities are being compared.' },
      { html: `${name}'s table is correct.`, why: `The table compares red to blue (${a} : ${b}). "Red out of all the marbles" is red to total (${a} : ${t}).` },
      { html: `${name} should have used ${b} : ${t}.`, why: `${b} : ${t} would be blue to total. The question asks about red.` },
    ], 0);
    return {
      type: 'error', skill: 'part-whole', lesson: '3-1', title: 'Challenge: part or whole?', xp: 20,
      prompt: `<p>A bag has ${hl(a + ' red')} marbles for every ${hl(b + ' blue')} marbles. ${name} was asked to make a table of the ratio of red marbles to <b>all</b> the marbles.</p>${V.table([['Red', ...ks.map((k) => String(a * k))], ['All marbles', ...ks.map((k) => String(b * k))]], { header: false, rowHeader: true, cls: 'compact' })}<p>What is wrong?</p>`,
      work: `Red : all = ${a} : ${b}`,
      options: sh.options, answer: sh.answer,
      fix: { label: `If there are ${a * 4} red marbles, how many marbles in all? `, answer: t * 4 },
      hints: ['"All the marbles" means red + blue. What is that for one group?', `One group has ${a} + ${b} = ${t} marbles. Red to all is ${a} : ${t}.`, `With ${a * 4} red marbles there are 4 groups: 4 × ${t}.`],
      solution: `<p>Red to all marbles is ${a} : ${t}, not ${a} : ${b}. With ${a * 4} red marbles (4 groups), the total is 4 × ${t} = <b>${t * 4}</b>.</p>`,
      feedback: { correct: 'Correct. Always check whether a ratio compares to another part or to the whole.', wrong(ans, d) { if (!d.mistakeOk) return sh.options[ans.mistake] && sh.options[ans.mistake].why || 'Which two quantities should be compared?'; return `Right. For the fix, each group has ${t} marbles total, and ${a * 4} red means 4 groups.`; } },
    };
  });

  // ---------- Three students, one correct (who) ----------
  G.define('c_threeStudents', (r) => {
    const [n1, n2, n3] = r.pickN(NAMES, 3);
    const ua = r.int(12, 18), ha = r.int(3, 5), ub = ua + r.pick([-3, -2, 2, 3]), hb = r.int(2, 6);
    const pa = ua * ha, pb = ub * hb;
    const better = ua > ub ? 'A' : 'B';
    const sh = shuffleOptions(r, [
      { title: n1, html: `Job A: $${pa} ÷ ${ha} = $${ua}/h.<br>Job B: $${pb} ÷ ${hb} = $${ub}/h.<br><b>Job ${better} pays more per hour.</b>`, ok: true },
      { title: n2, html: `Job ${pa > pb ? 'A' : 'B'} pays more because $${Math.max(pa, pb)} is more than $${Math.min(pa, pb)}.`, why: `${n2} compared totals, but the hours are different (${ha} and ${hb}). Compare dollars per hour.` },
      { title: n3, html: `Job A: ${ha} ÷ ${pa} = ${round(ha / pa, 3)}.<br>Job B: ${hb} ÷ ${pb} = ${round(hb / pb, 3)}.<br><b>Job ${ha / pa > hb / pb ? 'A' : 'B'} pays more.</b>`, why: `${n3} divided hours by dollars, which gives hours per dollar. Dollars per hour is dollars ÷ hours.` },
    ], 0);
    return {
      type: 'who', skill: 'compare', lesson: '3-5', title: 'Challenge: which job pays more?', xp: 20,
      prompt: `<p>Job A pays ${hl('$' + pa)} for ${hl(ha + ' hours')}. Job B pays ${hl('$' + pb)} for ${hl(hb + ' hours')}. Three students decide which job pays more <b>per hour</b>. Who is correct?</p>`,
      options: sh.options, answer: sh.answer, layout: 'cards',
      hints: ['Dollars per hour means dollars ÷ hours.', `Job A: ${pa} ÷ ${ha} = ${ua}. Job B: ${pb} ÷ ${hb} = ${ub}.`, `$${Math.max(ua, ub)} per hour is more, so Job ${better} pays better.`],
      solution: `<p>Job A: $${ua} per hour. Job B: $${ub} per hour. <b>Job ${better}</b> pays more per hour. ${n1} is correct.</p>`,
      feedback: { correct: 'Correct. The right unit rate, in the right direction, settles the comparison.' },
    };
  });
})(typeof window !== 'undefined' ? window : globalThis);
