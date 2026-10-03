/* js/units/u4/gen-percent.js */
/* Zone 1 — The Hundredth Gate. Lesson 4-1 Understand Percent (Percent Means Per Hundred · Percents Greater Than 100%). */
(function (root) {
  'use strict';
  const RX = root.RX;
  const { G, V, shuffleOptions, NAMES, simplify, round, parseNum } = RX;
  const hl = V.hl;

  const THINGS = ['lanterns', 'glass squares', 'festival tickets', 'candles', 'paper stars', 'harbor lights'];
  const PLACES = ['Harbor Street', 'the Night Market', 'Tallow Lane', 'the Festival Dock', 'Wick Alley', 'the Old Bridge'];
  const rows = (n) => Math.floor(n / 10);
  const extra = (n) => n % 10;
  const rowWords = (n) => `${rows(n)} full ${rows(n) === 1 ? 'row' : 'rows'} (${rows(n) * 10} squares) and ${extra(n)} more ${extra(n) === 1 ? 'square' : 'squares'}`;

  // ---------- Shade a 100-grid to show a percent (shade) ----------
  G.define('p1_shadeGrid', (r) => {
    const n = r.pick([r.int(11, 49), r.int(51, 89), r.int(2, 9)]);
    const form = r.pick(['percent', 'fraction', 'decimal']);
    const shown = form === 'percent' ? `${n}%` : form === 'fraction' ? `${n}/100` : `0.${n < 10 ? '0' + n : n}`;
    const shownHtml = form === 'fraction' ? V.frac(n, 100) : hl(shown);
    const place = r.pick(PLACES);
    return {
      type: 'shade',
      skill: 'percent-models',
      lesson: '4-1',
      title: 'Shade the grid',
      prompt: `<p>The gate on ${place} is a 100-grid. Each square is 1% of the gate.</p><p>Shade the grid to show ${shownHtml}${form === 'percent' ? '' : ` (that is ${hl(n + '%')} of the gate)`}.</p>`,
      cells: 100,
      count: n,
      label: shown,
      hints: [
        'Percent means per hundred. The grid has 100 squares, so each square is 1%.',
        `${shown} means ${n} out of 100. You need exactly ${n} shaded squares.`,
        `A full row is 10 squares (10%). Shade ${rowWords(n)}.`,
      ],
      solution: `<p>Percent means <b>per hundred</b>. ${shown} is ${n} out of 100, so shade <b>${n} squares</b>: ${rowWords(n)}.</p>${V.grid100({ shaded: n, aria: `${n} of 100 squares shaded` })}`,
      feedback: {
        correct: `Correct. ${n} of the 100 squares are shaded, which is exactly ${n}%.`,
        wrong(ans, d) {
          const v = d.value;
          if (v === 100 - n) return `You shaded ${v} squares, which is the part that should stay unshaded. ${n}% means ${n} squares shaded.`;
          if (v === n * 10 || v === Math.round(n / 10)) return `Each square is 1%, not 10%. ${n}% needs ${n} squares.`;
          if (v != null && Math.abs(v - n) === 10) return `You are off by one full row. Count the rows again: ${rowWords(n)}.`;
          return `You shaded ${v} squares. ${n}% means ${n} out of 100, so count to exactly ${n}.`;
        },
      },
    };
  });

  // ---------- Read a shaded 100-grid (mc) ----------
  G.define('p1_readGrid', (r) => {
    let n = r.int(11, 89);
    if (n === 50) n = 52;
    const thing = r.pick(THINGS);
    const opts = [
      { html: `${n}%`, ok: true },
      { html: `${100 - n}%`, why: `${100 - n} is the number of <b>unshaded</b> squares. The question asks about the shaded part.` },
      { html: `${round(n / 100, 2)}%`, why: `${round(n / 100, 2)} is the decimal for ${n} hundredths. A percent is the count out of 100, so it is ${n}%.` },
      { html: `${n * 10}%`, why: `Each square is 1%, not 10%. ${n} squares out of 100 is ${n}%.` },
    ];
    const sh = shuffleOptions(r, opts, 0);
    return {
      type: 'mc',
      skill: 'percent-models',
      lesson: '4-1',
      title: 'Read the grid',
      prompt: `<p>The grid shows the ${thing} on one street. The shaded squares are the ones that are lit. Each square is 1 of 100.</p>${V.grid100({ shaded: n, aria: `${n} of 100 squares shaded` })}<p>What percent of the grid is shaded?</p>`,
      options: sh.options,
      answer: sh.answer,
      hints: [
        'Count full rows first. Each full row has 10 squares, so each full row is 10%.',
        rows(n) === 0 ? `There is no full row: only ${extra(n)} ${extra(n) === 1 ? 'square is' : 'squares are'} shaded, less than one row.` : `There ${rows(n) === 1 ? 'is 1 full row' : 'are ' + rows(n) + ' full rows'} (${rows(n) * 10} squares) plus ${extra(n)} extra ${extra(n) === 1 ? 'square' : 'squares'}.`,
        `${rows(n) * 10} + ${extra(n)} = ${n} squares out of 100. Write that with a percent sign.`,
      ],
      solution: `<p>${rowWords(n)} are shaded: ${rows(n) * 10} + ${extra(n)} = ${n}. Out of 100 squares, that is <b>${n}%</b>. Percent means per hundred, so the count of shaded squares <i>is</i> the percent.</p>`,
      feedback: { correct: `Correct. ${n} shaded squares out of 100 is ${n}%.` },
    };
  });

  // ---------- Fraction, decimal, percent for a grid (blanks, hard = simplest form) ----------
  G.define('p1_threeWays', (r, o) => {
    const hard = !!o.hard;
    const n = hard ? r.pick([5, 15, 20, 25, 30, 35, 40, 45, 55, 60, 65, 70, 75, 80, 85, 90, 95]) : r.pick([r.int(11, 49), r.int(51, 89)]);
    const [sn, sd] = simplify(n, 100);
    const dec = round(n / 100, 2);
    const thing = r.pick(THINGS);
    const place = r.pick(PLACES);
    const fields = hard
      ? [
          { answer: sn, width: 'xs' },
          { answer: sd, width: 'xs' },
          { answer: dec, width: 'sm' },
          { answer: n, width: 'sm' },
        ]
      : [
          { answer: n, width: 'xs' },
          { answer: dec, width: 'sm' },
          { answer: n, width: 'sm' },
        ];
    const template = hard ? ['Fraction in simplest form: {0} / {1}', 'Decimal: {2}', 'Percent: {3}%'] : ['Fraction: {0} / 100', 'Decimal: {1}', 'Percent: {2}%'];
    return {
      type: 'blanks',
      skill: 'percent-meaning',
      lesson: '4-1',
      title: hard ? 'Three names, simplest form' : 'Write it three ways',
      prompt: `<p>On ${place}, ${hl(n)} of the 100 ${thing} are lit.</p>${hard ? '' : V.grid100({ shaded: n, size: 160, aria: `${n} of 100 squares shaded` })}<p>Write the lit part as a fraction${hard ? ' in <b>simplest form</b>' : ' with denominator 100'}, as a decimal, and as a percent.</p>`,
      template,
      fields,
      hints: [
        `${n} out of 100 is the fraction ${n}/100. Percent means per hundred, so the percent uses the same number.`,
        `${n} hundredths as a decimal is ${dec}. ${n} out of 100 as a percent is ${n}%.`,
        hard ? `To simplify ${n}/100, divide the top and bottom by ${100 / sd}: ${n} ÷ ${100 / sd} = ${sn} and 100 ÷ ${100 / sd} = ${sd}.` : `Fraction: ${n}/100. Decimal: ${dec}. Percent: ${n}%.`,
      ],
      solution: `<p>${n} out of 100 is <b>${n}/100</b>${hard ? `, which simplifies to <b>${sn}/${sd}</b> (divide both by ${100 / sd})` : ''}. ${n} hundredths is the decimal <b>${dec}</b>. Per hundred means percent, so it is <b>${n}%</b>. All three name the same number.</p>`,
      feedback: {
        correct: `Correct. ${hard ? `${sn}/${sd}` : `${n}/100`}, ${dec}, and ${n}% are three names for the same amount.`,
        wrong(ans, d) {
          const di = hard ? 2 : 1;
          const pi = hard ? 3 : 2;
          const dv = parseNum(ans[di]);
          if (d.wrong.includes(di) && dv === n) return `The decimal is not ${n}. ${n} hundredths is written 0.${n < 10 ? '0' + n : n}.`;
          if (d.wrong.includes(di) && dv != null && Math.abs(dv - n / 10) < 1e-9) return `${round(n / 10, 1)} is ${n} tenths. You need ${n} hundredths: ${dec}.`;
          if (d.wrong.includes(pi)) return `The percent is the number out of 100. ${n} out of 100 is ${n}%.`;
          if (hard && (d.wrong.includes(0) || d.wrong.includes(1))) return `Simplify ${n}/100 by dividing the top and bottom by the same number. Try ${100 / sd}.`;
          return `Start from "${n} out of 100." The fraction, decimal, and percent all come from that.`;
        },
      },
    };
  });

  // ---------- Which student explains the percent correctly? (who) ----------
  G.define('p1_whoPercent', (r) => {
    const [a, b, c] = r.pickN(NAMES, 3);
    const n = r.int(12, 88);
    const place = r.pick(PLACES);
    const opts = [
      { title: a, html: `"${n}% means ${n} out of every 100 lanterns are lit. It is a rate per 100."`, ok: true },
      { title: b, html: `"${n}% means ${n} out of every 10 lanterns are lit."`, why: `${b} compared to 10. Percent always compares to <b>100</b>: ${n} per 100.` },
      { title: c, html: `"${n}% means 100 out of every ${n} lanterns are lit."`, why: `${c} reversed the comparison. The percent (${n}) is the part, and 100 is the whole.` },
    ];
    const sh = shuffleOptions(r, opts, 0);
    return {
      type: 'who',
      skill: 'percent-meaning',
      lesson: '4-1',
      title: 'Who is correct?',
      prompt: `<p>A sign on ${place} says ${hl(n + '%')} of the lanterns are lit. Three students explain what that means. Who is correct?</p>`,
      options: sh.options,
      answer: sh.answer,
      layout: 'cards',
      hints: [
        'The word <b>percent</b> comes from "per cent," which means "per hundred."',
        `So ${n}% compares ${n} to 100, not to 10.`,
        `Read it as "${n} out of every 100." The percent is the part; 100 is the whole.`,
      ],
      solution: `<p><b>${a}</b> is correct. ${n}% is a rate per 100: ${n} out of every 100 lanterns are lit. Comparing to 10 or putting 100 first changes the meaning.</p>`,
      feedback: { correct: `Correct. A percent is always a rate per 100.` },
    };
  });

  // ---------- Percents greater than 100% with grids (num) ----------
  G.define('p1_over100', (r, o) => {
    const hard = !!o.hard;
    const full = hard ? 2 : 1;
    const m = r.pick([r.int(5, 45), r.pick([10, 20, 25, 30, 40, 50, 60, 70, 75, 80, 90])]);
    const total = full * 100 + m;
    const thing = r.pick(['lantern oil', 'festival glass', 'candle wax', 'paper for lanterns']);
    const grids =
      Array.from({ length: full }, () => V.grid100({ shaded: 100, size: 120, aria: 'A fully shaded grid, 100 percent' })).join('') +
      V.grid100({ shaded: m, size: 120, aria: `${m} of 100 squares shaded` });
    return {
      type: 'num',
      skill: 'over-100',
      lesson: '4-1',
      title: 'More than the whole',
      prompt: `<p>Each grid stands for one full order of ${thing}, which is 100%. This year the foundry ordered the shaded amount.</p><div class="viz-row">${grids}</div><p>What percent of one order did the foundry get this year? (${full === 1 ? 'One grid is' : 'Two grids are'} completely shaded, and ${m} squares of the last grid are shaded.)</p>`,
      unit: '%',
      answer: total,
      hints: [
        'A completely shaded grid is 100 out of 100, which is 100%. Count every shaded square across all the grids.',
        `${full === 1 ? 'One full grid' : 'Two full grids'} = ${full * 100}%. The last grid adds ${m} squares, which is ${m}%.`,
        `${full * 100}% + ${m}% = ?`,
      ],
      solution: `<p>${full === 1 ? 'One full grid is 100%.' : 'Two full grids are 200%.'} The partly shaded grid adds ${m}%. Total: ${full * 100} + ${m} = <b>${total}%</b>. A percent greater than 100% means <b>more than one whole</b>.</p>`,
      feedback: {
        correct: `Correct. ${total}% is more than 100%, so the foundry got more than one full order.`,
        wrong(ans, d) {
          const v = d.value;
          if (v === m) return `${m}% is only the last grid. Each full grid adds another 100%.`;
          if (v != null && Math.abs(v - total / 100) < 1e-9) return `${total / 100} is the decimal form. The question asks for a percent: ${total / 100} = ${total}%.`;
          if (v === total - 100 && full === 2) return `You counted only one of the two full grids. Each full grid is 100%.`;
          return `Count all the shaded squares: ${full * 100} from the full grid${full > 1 ? 's' : ''} plus ${m} more.`;
        },
      },
    };
  });

  // ---------- Sort values: less than, equal to, greater than 100% (sort) ----------
  G.define('p1_sortVs100', (r) => {
    const less = r.pickN(
      [
        { html: '0.8', bin: 0 },
        { html: `${r.int(51, 99)}%`, bin: 0 },
        { html: V.frac(3, 4), bin: 0 },
        { html: 'Half of the lanterns', bin: 0 },
        { html: `0.${r.int(11, 49)}`, bin: 0 },
        { html: V.frac(9, 10), bin: 0 },
      ],
      2,
    );
    const equal = r.pickN(
      [
        { html: V.frac(100, 100), bin: 1 },
        { html: '1.0', bin: 1 },
        { html: 'All of the lanterns', bin: 1 },
        { html: V.frac(4, 4), bin: 1 },
        { html: '100%', bin: 1 },
      ],
      2,
    );
    const more = r.pickN(
      [
        { html: `${r.pick([110, 125, 140, 150, 175, 200])}%`, bin: 2 },
        { html: `1.${r.int(1, 9)}`, bin: 2 },
        { html: V.frac(5, 4), bin: 2 },
        { html: V.frac(3, 2), bin: 2 },
        { html: 'Twice the lanterns', bin: 2 },
        { html: `2.${r.int(1, 5)}`, bin: 2 },
      ],
      2,
    );
    const items = r.shuffle(less.concat(equal, more));
    return {
      type: 'sort',
      skill: 'over-100',
      lesson: '4-1',
      title: 'Compare to the whole',
      prompt: `<p>The Keeper's chart compares each amount to <b>one whole</b> (100%). Sort each value.</p><p class="muted">Remember: 100% = 1 whole = 1.0 = 100/100.</p>`,
      bins: ['Less than 100%', 'Equal to 100%', 'Greater than 100%'],
      items,
      hints: [
        'Change each value to a percent. 1 whole is 100%, so a decimal of 1.0 or a fraction equal to 1 is exactly 100%.',
        'A decimal that starts with 1. or 2. is more than one whole, so it is more than 100%.',
        'A fraction whose top is bigger than its bottom is greater than 1, which is greater than 100%.',
      ],
      solution: `<p>Values less than 1 whole are less than 100% (for example 0.8 = 80%). Values equal to 1 whole are exactly 100% (1.0, 100/100, 4/4). Values more than 1 whole are more than 100% (1.5 = 150%, 5/4 = 125%).</p>`,
      feedback: {
        correct: 'Correct. Comparing every value to one whole tells you which side of 100% it lands on.',
        wrong() {
          return 'Convert each value to a percent first. Anything equal to one whole is 100%; more than a whole is over 100%.';
        },
      },
    };
  });

  // ---------- Percents less than 1% (mc) ----------
  G.define('p1_lessThan1', (r) => {
    const v = r.pick([
      { words: 'half of one square', pct: 0.5, frac: '1/2' },
      { words: 'one quarter of one square', pct: 0.25, frac: '1/4' },
      { words: 'three quarters of one square', pct: 0.75, frac: '3/4' },
      { words: 'one tenth of one square', pct: 0.1, frac: '1/10' },
    ]);
    const thing = r.pick(['lantern oil', 'the gate', 'the festival banner']);
    const opts = [
      { html: `${v.pct}%`, ok: true },
      { html: `${v.pct * 100}%`, why: `${v.pct * 100}% would be ${v.pct * 100} whole squares, not ${v.words}. One square is 1%, so part of a square is less than 1%.` },
      { html: `${v.pct * 10}%`, why: `${v.pct * 10}% is ${v.pct * 10} squares. ${v.words.charAt(0).toUpperCase() + v.words.slice(1)} is a fraction of a single 1% square.` },
      { html: `${v.pct / 10}%`, why: `${v.pct / 10}% is too small. One whole square is 1%, so ${v.frac} of a square is ${v.frac} of 1%, which is ${v.pct}%.` },
    ];
    const sh = shuffleOptions(r, opts, 0);
    return {
      type: 'mc',
      skill: 'over-100',
      lesson: '4-1',
      title: 'Less than one percent',
      prompt: `<p>On a 100-grid that stands for ${thing}, only ${hl(v.words)} is shaded. What percent is shaded?</p>`,
      options: sh.options,
      answer: sh.answer,
      hints: [
        'One square on a 100-grid is 1 out of 100, which is 1%.',
        `${v.words.charAt(0).toUpperCase() + v.words.slice(1)} is ${v.frac} of 1%.`,
        `${v.frac} of 1% is ${v.pct}%. That is less than 1%.`,
      ],
      solution: `<p>One square is 1%. ${v.words.charAt(0).toUpperCase() + v.words.slice(1)} is ${v.frac} of 1%, which is <b>${v.pct}%</b>. Percents can be less than 1 when the part is smaller than one hundredth.</p>`,
      feedback: { correct: `Correct. ${v.frac} of one square is ${v.pct}%, a percent less than 1.` },
    };
  });

  // ---------- Error: decimal greater than 1 written as a percent (error) ----------
  G.define('p1_errorOver100', (r) => {
    const name = r.pick(NAMES);
    const whole = r.int(1, 2);
    const tenths = r.int(1, 9);
    const dec = `${whole}.${tenths}`;
    const wrongPct = whole * 10 + tenths;
    const rightPct = whole * 100 + tenths * 10;
    const opts = [
      { html: `${name} moved the decimal point only one place. To write a decimal as a percent, move it two places: ${dec} = ${rightPct}%.`, ok: true },
      {
        html: `${name} should have written ${dec}%, because the number does not change.`,
        why: `A decimal and a percent are different forms. ${dec} is more than 1 whole, so it must be more than 100%.`,
      },
      { html: `${name} is correct. A percent can never be more than 100%.`, why: `Percents can be greater than 100%. ${dec} is more than 1 whole, so it is more than 100%.` },
      { html: `${name} should have divided by 100 to get ${round(Number(dec) / 100, 3)}%.`, why: 'Dividing by 100 makes the number smaller. Changing a decimal to a percent multiplies by 100.' },
    ];
    const sh = shuffleOptions(r, opts, 0);
    return {
      type: 'error',
      skill: 'over-100',
      lesson: '4-1',
      title: 'Find the mistake',
      prompt: `<p>${name} is writing the decimal ${hl(dec)} as a percent. What is the mistake?</p>`,
      work: `${dec} → move the decimal point → ${wrongPct}%`,
      options: sh.options,
      answer: sh.answer,
      fix: { label: `Write ${dec} as a percent:`, answer: rightPct },
      hints: [
        'Is 1.0 equal to 100% or 10%? Use that to test the student’s method.',
        `${dec} is more than 1 whole, so the percent must be more than 100%.`,
        `Move the decimal point two places to the right: ${dec} → ${rightPct}.`,
      ],
      solution: `<p>1 whole = 100%, so ${dec} wholes must be more than 100%. To change a decimal to a percent, multiply by 100 (move the decimal point two places right): ${dec} = <b>${rightPct}%</b>. ${name} only moved it one place.</p>`,
      feedback: {
        correct: `Correct. ${dec} = ${rightPct}%. Decimals greater than 1 become percents greater than 100.`,
        wrong(ans, d) {
          if (!d.mistakeOk) return `Test the method on 1.0. It should give 100%, not 10%. How many places should the decimal point move?`;
          const v = parseNum(ans.fix);
          if (v === wrongPct) return `${wrongPct}% is the student's wrong answer. Move the decimal point two places, not one.`;
          return `You found the mistake. Now move the decimal point in ${dec} two places to the right.`;
        },
      },
    };
  });
})(typeof window !== 'undefined' ? window : globalThis);

/* js/units/u4/gen-fdp.js */
/* Zone 2 — Exchange Square. Lesson 4-2 Relate Fractions, Decimals, and Percents (Fractions, Decimals, Percents · Compare and Order). */
(function (root) {
  'use strict';
  const RX = root.RX;
  const { G, V, shuffleOptions, NAMES, round, parseNum } = RX;
  const hl = V.hl;

  // Friendly fractions whose decimal has at most 2 places. [num, den]
  const FRIENDLY = [
    [1, 2],
    [1, 4],
    [3, 4],
    [1, 5],
    [2, 5],
    [3, 5],
    [4, 5],
    [1, 10],
    [3, 10],
    [7, 10],
    [9, 10],
    [1, 20],
    [3, 20],
    [7, 20],
    [9, 20],
    [11, 20],
    [13, 20],
    [17, 20],
    [19, 20],
    [1, 25],
    [3, 25],
    [4, 25],
    [6, 25],
    [8, 25],
    [12, 25],
    [1, 50],
    [7, 50],
    [21, 50],
    [33, 50],
  ];
  const pctOf = ([n, d]) => round((n / d) * 100, 2);
  const decOf = ([n, d]) => round(n / d, 2);
  const decStr = (x) => String(round(x, 2));
  // Pick k fractions with distinct values.
  const pickDistinct = (r, k, pool) => {
    const out = [];
    const seen = new Set();
    for (const f of r.shuffle(pool || FRIENDLY)) {
      const p = pctOf(f);
      if (seen.has(p)) continue;
      seen.add(p);
      out.push(f);
      if (out.length === k) break;
    }
    return out;
  };
  // Render a value (0..1) in a given form. form: 'f' | 'd' | 'p'
  const show = (f, form) => (form === 'f' ? V.frac(f[0], f[1]) : form === 'd' ? decStr(decOf(f)) : `${pctOf(f)}%`);
  const showText = (f, form) => (form === 'f' ? `${f[0]}/${f[1]}` : form === 'd' ? decStr(decOf(f)) : `${pctOf(f)}%`);
  const explain = (f) => `${f[0]}/${f[1]} = ${decStr(decOf(f))} = ${pctOf(f)}%`;

  // ---------- Complete the fraction–decimal–percent table (table) ----------
  G.define('p2_table', (r, o) => {
    const hard = !!o.hard;
    const fr = pickDistinct(r, hard ? 4 : 3);
    const inputs = [];
    const rows = [['Fraction', 'Decimal', 'Percent']];
    fr.forEach((f, i) => {
      const mode = hard ? r.int(0, 2) : i % 3;
      const dec = decOf(f);
      const pct = pctOf(f);
      const dId = `d${i}`;
      const pId = `p${i}`;
      if (mode === 0) {
        rows.push([V.frac(f[0], f[1]), `__IN:${dId}__`, `__IN:${pId}__`]);
        inputs.push({ id: dId, answer: dec }, { id: pId, answer: pct });
      } else if (mode === 1) {
        rows.push([V.frac(f[0], f[1]), decStr(dec), `__IN:${pId}__`]);
        inputs.push({ id: pId, answer: pct });
      } else {
        rows.push([V.frac(f[0], f[1]), `__IN:${dId}__`, `${pct}%`]);
        inputs.push({ id: dId, answer: dec });
      }
    });
    const first = fr[0];
    return {
      type: 'table',
      skill: 'fdp-convert',
      lesson: '4-2',
      title: 'Complete the exchange table',
      prompt: `<p>Every price in Exchange Square is written three ways. This table has rows for ${fr.map((f) => V.frac(f[0], f[1])).join(', ')}. Complete it. Write percents without the % sign.</p>`,
      rows,
      inputs,
      header: true,
      hints: [
        'Fraction → decimal: divide the top by the bottom, or make an equivalent fraction with denominator 100.',
        `Decimal → percent: multiply by 100 (move the decimal point two places right). For example, ${first[0]}/${first[1]} = ${decStr(decOf(first))} = ${pctOf(first)}%.`,
        `Each row: ${fr.map(explain).join('; ')}.`,
      ],
      solution: `<p>${fr.map((f) => `<b>${explain(f)}</b>`).join('<br>')}</p><p>A fraction with denominator 100 tells you the percent directly. The decimal is the same hundredths written with a point.</p>`,
      feedback: {
        correct: 'Correct. Each row names one number three ways.',
        wrong(ans, d) {
          const bad = d.wrong[0];
          const i = Number(bad.slice(1));
          const f = fr[i];
          const v = parseNum(ans[bad]);
          if (bad[0] === 'p' && v != null && Math.abs(v - decOf(f)) < 1e-9) return `${decStr(decOf(f))} is the decimal. For the percent, multiply by 100: ${pctOf(f)}.`;
          if (bad[0] === 'd' && v === pctOf(f)) return `${pctOf(f)} is the percent. For the decimal, divide by 100: ${decStr(decOf(f))}.`;
          return `Check the row for ${f[0]}/${f[1]}. Make an equivalent fraction over 100: ${f[0]}/${f[1]} = ${pctOf(f)}/100.`;
        },
      },
    };
  });

  // ---------- Match equivalent forms (match) ----------
  G.define('p2_match', (r) => {
    const fr = pickDistinct(r, 5);
    const leftForms = r.shuffle(['f', 'f', 'd', 'd', 'p']);
    const left = fr.map((f, i) => show(f, leftForms[i]));
    const rightForms = leftForms.map((lf) => (lf === 'p' ? r.pick(['f', 'd']) : lf === 'f' ? r.pick(['d', 'p']) : r.pick(['f', 'p'])));
    const rightTexts = fr.map((f, i) => show(f, rightForms[i]));
    const perm = r.shuffle(fr.map((_, i) => i));
    const right = perm.map((i) => rightTexts[i]);
    return {
      type: 'match',
      skill: 'fdp-convert',
      lesson: '4-2',
      title: 'Match the equal values',
      prompt: '<p>Each value on the left equals exactly one value on the right. Match them.</p>',
      left,
      right,
      pairs: fr.map((_, i) => [i, perm.indexOf(i)]),
      hints: [
        'Change every value to a percent first. Then matching is just finding equal percents.',
        `Fraction → percent: make the denominator 100. Decimal → percent: move the decimal point two places right.`,
        `The values are: ${fr.map(explain).join('; ')}.`,
      ],
      solution: `<p>${fr.map((f, i) => `${showText(f, leftForms[i])} = ${showText(f, rightForms[i])} (both are ${pctOf(f)}%)`).join('<br>')}</p>`,
      feedback: {
        correct: 'Correct. Turning everything into percents makes equal values easy to spot.',
        wrong() {
          return 'Write each value as a percent. Two values match only when their percents are the same.';
        },
      },
    };
  });

  // ---------- Convert one value (num): fraction→percent, decimal→percent, percent→decimal ----------
  G.define('p2_fracToPct', (r) => {
    const mode = r.pick(['fp', 'dp', 'pd', 'fp']);
    const pool =
      mode === 'fp'
        ? FRIENDLY.concat([
            [1, 8],
            [3, 8],
            [5, 8],
            [7, 8],
          ])
        : FRIENDLY;
    const f = r.pick(pool);
    const pct = round(pctOf(f), 2);
    const dec = round(f[0] / f[1], 3);
    const name = r.pick(NAMES);
    const ctx = r.pick(['of the lanterns on the bridge are lit', 'of the festival tickets are sold', 'of the oil tank is full', 'of the glass squares are blue']);
    if (mode === 'fp' || mode === 'dp') {
      const given = mode === 'fp' ? V.frac(f[0], f[1]) : hl(decStr(dec));
      const givenText = mode === 'fp' ? `${f[0]}/${f[1]}` : decStr(dec);
      const eqHundred =
        mode === 'fp' && 100 % f[1] === 0
          ? `Multiply top and bottom by ${100 / f[1]}: ${f[0]}/${f[1]} = ${(f[0] * 100) / f[1]}/100.`
          : mode === 'fp'
            ? `Divide: ${f[0]} ÷ ${f[1]} = ${dec}. Then multiply by 100.`
            : `Move the decimal point two places to the right: ${decStr(dec)} → ${pct}.`;
      return {
        type: 'num',
        skill: 'fdp-convert',
        lesson: '4-2',
        title: 'Write it as a percent',
        prompt: `<p>${name} says ${given} ${ctx}.</p><p>Write ${givenText} as a <b>percent</b>.</p>`,
        unit: '%',
        answer: pct,
        hints: ['A percent is a number out of 100. Find how many hundredths the value is.', eqHundred, `${givenText} = ${pct} hundredths = ${pct}%.`],
        solution: `<p>${eqHundred} So ${givenText} = <b>${pct}%</b>. The percent is the number of hundredths.</p>`,
        feedback: {
          correct: `Correct. ${givenText} is ${pct} out of 100, which is ${pct}%.`,
          wrong(ans, d) {
            const v = d.value;
            if (v != null && Math.abs(v - dec) < 1e-9) return `${decStr(dec)} is the decimal, not the percent. Multiply by 100 to get the percent.`;
            if (v != null && Math.abs(v - pct / 10) < 1e-9) return `You moved the decimal point only one place. Percent means per hundred, so move it two places.`;
            if (mode === 'fp' && v != null && Math.abs(v - (f[1] / f[0]) * 100) < 0.01) return `You divided bottom by top. Divide the top (${f[0]}) by the bottom (${f[1]}).`;
            return `Find how many hundredths ${givenText} is. That number is the percent.`;
          },
        },
      };
    }
    return {
      type: 'num',
      skill: 'fdp-convert',
      lesson: '4-2',
      title: 'Write it as a decimal',
      prompt: `<p>${name} says ${hl(pct + '%')} ${ctx}.</p><p>Write ${pct}% as a <b>decimal</b>.</p>`,
      answer: round(pct / 100, 2),
      hints: [
        'Percent means per hundred, so a percent is a number of hundredths.',
        `${pct}% = ${pct} hundredths = ${pct}/100.`,
        `Divide by 100: move the decimal point two places to the left. ${pct} → ${decStr(pct / 100)}.`,
      ],
      solution: `<p>${pct}% means ${pct} hundredths. ${pct} ÷ 100 = <b>${decStr(pct / 100)}</b>. Moving the decimal point two places to the left divides by 100.</p>`,
      feedback: {
        correct: `Correct. ${pct}% = ${decStr(pct / 100)}.`,
        wrong(ans, d) {
          const v = d.value;
          if (v === pct) return `${pct} is the percent. The decimal is ${pct} hundredths, so divide by 100.`;
          if (v != null && Math.abs(v - pct / 10) < 1e-9) return `You moved the decimal point only one place. ${pct}% is ${pct} hundredths, so move it two places.`;
          return `Write ${pct}% as ${pct}/100, then as a decimal.`;
        },
      },
    };
  });

  // ---------- Error: decimal ↔ percent slip (error) ----------
  G.define('p2_errorDecimal', (r) => {
    const name = r.pick(NAMES);
    const v = r.pick([
      { dec: '0.7', wrong: '7%', right: 70, note: '0.7 is 7 tenths, which is 70 hundredths' },
      { dec: '0.4', wrong: '4%', right: 40, note: '0.4 is 4 tenths, which is 40 hundredths' },
      { dec: '0.9', wrong: '9%', right: 90, note: '0.9 is 9 tenths, which is 90 hundredths' },
      { dec: '0.06', wrong: '60%', right: 6, note: '0.06 is 6 hundredths, not 60 hundredths' },
      { dec: '0.03', wrong: '30%', right: 3, note: '0.03 is 3 hundredths, not 30 hundredths' },
      { dec: '0.5', wrong: '5%', right: 50, note: '0.5 is 5 tenths, which is 50 hundredths' },
    ]);
    const opts = [
      { html: `${name} used the digits instead of the place value. ${v.note}, so ${v.dec} = ${v.right}%.`, ok: true },
      {
        html: `${name} should have written ${v.dec}% because the number stays the same.`,
        why: 'Changing a decimal to a percent multiplies by 100. The digits shift two places; the number does not stay the same.',
      },
      {
        html: `${name} is correct. You just drop the zero and the decimal point.`,
        why: `Dropping symbols is not a rule. ${v.dec} means ${v.note.split(', ')[0].replace(v.dec + ' is ', '')}. Think in hundredths.`,
      },
      {
        html: `${name} should have divided by 100 to get ${round(Number(v.dec) / 100, 4)}%.`,
        why: 'Dividing by 100 goes the wrong direction. A percent is the number of hundredths, which is the decimal times 100.',
      },
    ];
    const sh = shuffleOptions(r, opts, 0);
    return {
      type: 'error',
      skill: 'fdp-convert',
      lesson: '4-2',
      title: 'Find the mistake',
      prompt: `<p>${name} changes the decimal ${hl(v.dec)} to a percent. What is the mistake?</p>`,
      work: `${v.dec} → ${v.wrong}`,
      options: sh.options,
      answer: sh.answer,
      fix: { label: `Write ${v.dec} as a percent:`, answer: v.right },
      hints: ['Percent means hundredths. How many hundredths is the decimal?', `${v.note}.`, `${v.right} hundredths = ${v.right}%.`],
      solution: `<p>${v.note}. A percent counts hundredths, so ${v.dec} = <b>${v.right}%</b>. The quick rule is to move the decimal point two places to the right: ${v.dec} → ${v.right}.</p>`,
      feedback: {
        correct: `Correct. ${v.dec} = ${v.right}%. Think in hundredths, not digits.`,
        wrong(ans, d) {
          if (!d.mistakeOk) return `Ask: how many hundredths is ${v.dec}? That number is the percent.`;
          return `You found the mistake. Now count hundredths: ${v.note}.`;
        },
      },
    };
  });

  // ---------- Order mixed forms (seq) ----------
  G.define('p2_seq', (r, o) => {
    const hard = !!o.hard;
    const k = hard ? 5 : 4;
    const fr = pickDistinct(r, k, hard ? FRIENDLY.filter((f) => pctOf(f) >= 30 && pctOf(f) <= 70) : FRIENDLY);
    const forms = r.shuffle(['f', 'd', 'p', 'f', 'd'].slice(0, k));
    const items = fr.map((f, i) => ({ html: `<b>${show(f, forms[i])}</b>`, rate: pctOf(f) }));
    const asc = r.chance(0.6);
    const order = fr.map((_, i) => i).sort((a, b) => (asc ? items[a].rate - items[b].rate : items[b].rate - items[a].rate));
    return {
      type: 'seq',
      skill: 'fdp-compare',
      lesson: '4-2',
      title: 'Order the lanterns',
      prompt: `<p>Each lantern in the square shows how full its oil is, but each uses a different form. Order them from <b>${asc ? 'least' : 'greatest'}</b> (top) to <b>${asc ? 'greatest' : 'least'}</b> (bottom).</p>`,
      items,
      order,
      hints: [
        'You cannot compare a fraction, a decimal, and a percent directly. Change every value to the same form first.',
        'Percents are easiest: fraction → denominator 100; decimal → move the decimal point two places right.',
        `As percents: ${fr.map((f, i) => `${showText(f, forms[i])} = ${pctOf(f)}%`).join(', ')}. Now order the percents ${asc ? 'from least to greatest' : 'from greatest to least'}.`,
      ],
      solution: `<p>As percents: ${fr.map((f, i) => `${showText(f, forms[i])} = ${pctOf(f)}%`).join('; ')}. Order (${asc ? 'least to greatest' : 'greatest to least'}): <b>${order.map((i) => showText(fr[i], forms[i])).join(', ')}</b>.</p>`,
      feedback: {
        correct: 'Correct. Once every value is a percent, ordering is just comparing whole numbers.',
        wrong() {
          return `Change each value to a percent, then check the direction: ${asc ? 'least' : 'greatest'} goes on top.`;
        },
      },
    };
  });

  // ---------- Select all values greater than a target (ms) ----------
  G.define('p2_greaterThan', (r) => {
    const target = r.pick([
      [1, 2],
      [3, 5],
      [2, 5],
      [1, 4],
      [3, 4],
      [7, 10],
    ]);
    const tForm = r.pick(['f', 'd', 'p']);
    const tp = pctOf(target);
    const pool = FRIENDLY.filter((f) => pctOf(f) !== tp && Math.abs(pctOf(f) - tp) <= 40);
    const chosen = pickDistinct(r, 5, pool);
    const forms = r.shuffle(['f', 'd', 'p', 'f', 'd']);
    const greater = chosen.map((f, i) => i).filter((i) => pctOf(chosen[i]) > tp);
    if (greater.length === 0 || greater.length === 5) {
      // force at least one on each side
      const idxMax = chosen.reduce((m, f, i) => (pctOf(f) > pctOf(chosen[m]) ? i : m), 0);
      const idxMin = chosen.reduce((m, f, i) => (pctOf(f) < pctOf(chosen[m]) ? i : m), 0);
      const used = new Set(chosen.map(pctOf));
      const repl = FRIENDLY.filter((f) => !used.has(pctOf(f)) && (greater.length === 0 ? pctOf(f) > tp : pctOf(f) < tp));
      chosen[greater.length === 0 ? idxMax : idxMin] = r.pick(repl);
    }
    const options = chosen.map((f, i) => {
      const ok = pctOf(f) > tp;
      return { html: `<b>${show(f, forms[i])}</b>`, ok, why: ok ? undefined : `${showText(f, forms[i])} = ${pctOf(f)}%, which is ${pctOf(f) === tp ? 'equal to' : 'less than'} ${tp}%.` };
    });
    const okIdx = options.map((op, i) => (op.ok ? i : -1)).filter((i) => i >= 0);
    const sh = shuffleOptions(r, options, okIdx);
    return {
      type: 'ms',
      skill: 'fdp-compare',
      lesson: '4-2',
      title: 'Brighter than the benchmark',
      prompt: `<p>The Keeper's lantern is ${tForm === 'f' ? V.frac(target[0], target[1]) : hl(showText(target, tForm))} full. Select <b>all</b> the lanterns that are fuller than the Keeper's. (Which values are greater than ${showText(target, tForm)}?)</p>`,
      options: sh.options,
      answers: sh.answers,
      hints: [
        `First write the Keeper's value as a percent: ${showText(target, tForm)} = ${tp}%.`,
        'Change each option to a percent the same way.',
        `Select every option whose percent is greater than ${tp}%: ${chosen.map((f, i) => `${showText(f, forms[i])} = ${pctOf(f)}%`).join(', ')}.`,
      ],
      solution: `<p>${showText(target, tForm)} = ${tp}%. The options: ${chosen.map((f, i) => `${showText(f, forms[i])} = ${pctOf(f)}%`).join('; ')}. Greater than ${tp}%: <b>${chosen
        .filter((f) => pctOf(f) > tp)
        .map((f) => pctOf(f) + '%')
        .join(', ')}</b>.</p>`,
      feedback: {
        correct: `Correct. Every selected value is more than ${tp}%.`,
        wrong(ans, d) {
          if (d.extra && d.extra.length) return sh.options[d.extra[0]].why;
          return `You missed one. Change each value to a percent and compare it with ${tp}%.`;
        },
      },
    };
  });

  // ---------- True/false comparison with reasons (tf) ----------
  G.define('p2_tfCompare', (r) => {
    const name = r.pick(NAMES);
    const [a, b] = pickDistinct(
      r,
      2,
      FRIENDLY.filter((f) => Math.abs(pctOf(f) - 50) <= 35),
    );
    const aForm = r.pick(['d', 'f']);
    const bForm = 'p';
    const pa = pctOf(a);
    const pb = pctOf(b);
    const claimGreater = r.chance(0.5);
    const truth = claimGreater ? pa > pb : pa < pb;
    const word = claimGreater ? 'greater than' : 'less than';
    const sym = claimGreater ? '>' : '<';
    const aText = showText(a, aForm);
    const reasons = r.shuffle([
      { html: `${aText} = ${pa}%, and ${pa}% is ${pa > pb ? 'greater' : 'less'} than ${pb}%.`, correct: true },
      { html: `${aText} = ${pa}%, and ${pa}% is ${pa > pb ? 'less' : 'greater'} than ${pb}%.`, correct: false },
      { html: `A ${aForm === 'd' ? 'decimal' : 'fraction'} is always ${r.pick(['greater', 'less'])} than a percent, no matter the numbers.`, correct: false },
      {
        html: aForm === 'd' ? `${aText} has fewer digits than ${pb}%, so it must be the smaller number.` : `${a[0]} and ${a[1]} are both smaller than ${pb}, so the fraction is smaller.`,
        correct: false,
      },
    ]);
    return {
      type: 'tf',
      skill: 'fdp-compare',
      lesson: '4-2',
      title: 'True or false?',
      prompt: `<p>${name} says: "${aForm === 'f' ? V.frac(a[0], a[1]) : hl(aText)} is ${hl(word)} ${hl(pb + '%')}."</p><p>Is ${name} correct? Choose true or false and the best reason.</p>`,
      statement: `${aText} ${sym} ${pb}%`,
      answer: truth,
      reasons,
      hints: [
        'Different forms cannot be compared by their digits. Change both to percents.',
        `${aText} = ${pa}%. Now compare ${pa}% with ${pb}%.`,
        `${pa}% is ${pa > pb ? 'greater' : 'less'} than ${pb}%, so the statement is ${truth ? 'true' : 'false'}.`,
      ],
      solution: `<p>${aText} = ${pa}%. Compare: ${pa}% ${pa > pb ? '>' : '<'} ${pb}%. So "${aText} is ${word} ${pb}%" is <b>${truth ? 'true' : 'false'}</b>. Always convert to the same form before comparing.</p>`,
      feedback: {
        correct: `Correct. ${aText} = ${pa}%, so the comparison with ${pb}% is clear.`,
        wrong(ans, d) {
          if (!d.valueOk) return `Convert first: ${aText} = ${pa}%. Is ${pa}% ${word} ${pb}%?`;
          return `Your true/false is right, but the reason must compare the two values in the same form (percents).`;
        },
      },
    };
  });

  // ---------- Place values on a percent number line (nl) ----------
  G.define('p2_nlPlace', (r) => {
    const pool = FRIENDLY.filter((f) => pctOf(f) % 5 === 0);
    const fr = pickDistinct(r, 3, pool);
    const forms = r.shuffle(['f', 'd', 'p']);
    const points = fr.map((f) => pctOf(f));
    return {
      type: 'nl',
      skill: 'fdp-compare',
      lesson: '4-2',
      title: 'Place them on the percent line',
      prompt: `<p>The Keeper's measuring pole is marked in percents from 0% to 100%. Place each value on the line: ${fr.map((f, i) => (forms[i] === 'f' ? V.frac(f[0], f[1]) : hl(showText(f, forms[i])))).join(', &nbsp;')}.</p>`,
      min: 0,
      max: 100,
      step: 5,
      labelEvery: 25,
      count: 3,
      points,
      labels: fr.map((f, i) => showText(f, forms[i])),
      hints: [
        'Change each value to a percent. The line is marked every 5%, with labels at 0, 25, 50, 75, and 100.',
        `${fr.map((f, i) => `${showText(f, forms[i])} = ${pctOf(f)}%`).join('; ')}.`,
        'Click the tick that matches each percent.',
      ],
      solution: `<p>${fr.map((f, i) => `${showText(f, forms[i])} = <b>${pctOf(f)}%</b>`).join('; ')}. Each value sits at its percent on the line.</p>${V.numberLine({ min: 0, max: 100, step: 5, labelEvery: 25, points: fr.map((f) => ({ v: pctOf(f), label: `${pctOf(f)}%`, above: true })), aria: 'Percent number line with the three values placed' })}`,
      feedback: {
        correct: 'Correct. On a percent line, every form lands on its percent.',
        wrong() {
          return `Write each value as a percent first: ${fr.map((f, i) => `${showText(f, forms[i])} = ${pctOf(f)}%`).join(', ')}.`;
        },
      },
    };
  });
})(typeof window !== 'undefined' ? window : globalThis);

/* js/units/u4/gen-estimate.js */
/* Zone 3 — Lamplighter's Row. Lesson 4-3 Estimate the Percent of a Number (Estimate with Benchmarks · Estimate a Percent of a Number). */
(function (root) {
  'use strict';
  const RX = root.RX;
  const { G, V, shuffleOptions, NAMES, round, fmt, parseNum } = RX;
  const hl = V.hl;

  const BENCH = {
    1: { frac: '1/100', how: 'move the decimal point two places to the left', word: 'one hundredth' },
    10: { frac: '1/10', how: 'move the decimal point one place to the left', word: 'one tenth' },
    25: { frac: '1/4', how: 'divide by 4 (or halve twice)', word: 'one quarter' },
    50: { frac: '1/2', how: 'divide by 2', word: 'one half' },
    75: { frac: '3/4', how: 'find one quarter, then multiply by 3', word: 'three quarters' },
  };
  const CTX = [
    { what: 'lamps on the row', unit: 'lamps' },
    { what: 'lanterns in the warehouse', unit: 'lanterns' },
    { what: 'festival visitors', unit: 'visitors' },
    { what: 'candles in the crate', unit: 'candles' },
    { what: 'tickets printed', unit: 'tickets' },
    { what: 'oil jars on the shelf', unit: 'jars' },
  ];
  // A number that makes p% exact and whole.
  const niceN = (r, p, lo, hi) => {
    const m = p === 1 ? 100 : p === 10 ? 10 : p === 50 ? 2 : 4;
    return m * r.int(Math.ceil(lo / m), Math.floor(hi / m));
  };
  const of = (p, n) => round((p / 100) * n, 2);

  // ---------- Exact benchmark value (num) ----------
  G.define('p3_benchmarkOf', (r) => {
    const p = r.pick([1, 10, 25, 50, 75]);
    const n = niceN(r, p, p === 1 ? 300 : 40, p === 1 ? 2000 : 400);
    const ctx = r.pick(CTX);
    const ans = of(p, n);
    const b = BENCH[p];
    return {
      type: 'num',
      skill: 'benchmarks',
      lesson: '4-3',
      title: 'Benchmark in your head',
      prompt: `<p>There are ${hl(fmt(n) + ' ' + ctx.what)}. The lamplighter needs exactly ${hl(p + '%')} of them. How many is that?</p><p class="muted">Use the benchmark: ${p}% is ${b.word} (${b.frac}) of the whole.</p>`,
      unit: ctx.unit,
      answer: ans,
      hints: [
        `${p}% = ${b.frac}. To find ${b.word} of a number, ${b.how}.`,
        `Start with ${fmt(n)}. ${p === 75 ? `One quarter of ${fmt(n)} is ${n / 4}.` : `${b.how.charAt(0).toUpperCase() + b.how.slice(1)}.`}`,
        p === 75 ? `${n / 4} × 3 = ?` : p === 25 ? `${fmt(n)} ÷ 4 = ? (Half of ${fmt(n)} is ${n / 2}; half again.)` : p === 50 ? `${fmt(n)} ÷ 2 = ?` : `${fmt(n)} ÷ ${p === 10 ? 10 : 100} = ?`,
      ],
      solution: `<p>${p}% = ${b.frac}, so ${b.how}. ${p === 75 ? `${fmt(n)} ÷ 4 = ${n / 4}, and ${n / 4} × 3 = <b>${ans}</b>` : `${fmt(n)} ${p === 25 ? '÷ 4' : p === 50 ? '÷ 2' : p === 10 ? '÷ 10' : '÷ 100'} = <b>${ans}</b>`} ${ctx.unit}. Benchmarks let you find these percents without a calculator.</p>`,
      feedback: {
        correct: `Correct. ${p}% of ${fmt(n)} is ${ans}, because ${p}% is ${b.word}.`,
        wrong(ans2, d) {
          const v = d.value;
          if (p === 10 && v === n / 100) return `That is 1% (two places left). For 10%, move the decimal point only one place.`;
          if (p === 1 && v === n / 10) return `That is 10% (one place left). For 1%, move the decimal point two places.`;
          if (p === 25 && v === n / 2) return `${n / 2} is 50%, half of ${fmt(n)}. For 25%, halve again.`;
          if (p === 75 && v === n / 4) return `${n / 4} is only one quarter (25%). 75% is three quarters, so multiply by 3.`;
          if (p === 50 && v === n / 4) return `${n / 4} is 25%. For 50%, divide ${fmt(n)} by 2.`;
          return `${p}% is ${b.word} of the whole: ${b.how}.`;
        },
      },
    };
  });

  // ---------- Match benchmarks to mental strategies (match) ----------
  G.define('p3_matchBench', (r) => {
    const all = [
      ['10%', 'One tenth: move the decimal point one place to the left'],
      ['25%', 'One quarter: divide by 4, or halve and halve again'],
      ['50%', 'One half: divide by 2'],
      ['75%', 'Three quarters: find one quarter, then multiply by 3'],
      ['1%', 'One hundredth: move the decimal point two places to the left'],
      ['20%', 'One fifth: find 10%, then double it'],
    ];
    const terms = r.pickN(all, 5).sort((a, b) => parseFloat(a[0]) - parseFloat(b[0]));
    const perm = r.shuffle(terms.map((_, i) => i));
    return {
      type: 'match',
      skill: 'benchmarks',
      lesson: '4-3',
      title: 'Match the benchmark to its shortcut',
      prompt: '<p>Lamplighters never use a calculator. Match each benchmark percent with the mental shortcut for finding it.</p>',
      left: terms.map((t) => t[0]),
      right: perm.map((i) => terms[i][1]),
      pairs: terms.map((_, i) => [i, perm.indexOf(i)]),
      hints: [
        'Write each percent as a fraction: 10% = 1/10, 25% = 1/4, 50% = 1/2, 75% = 3/4, 1% = 1/100, 20% = 1/5.',
        'Dividing by 10 moves the decimal point one place; dividing by 100 moves it two places.',
        'Three quarters is three times one quarter. One fifth is twice one tenth.',
      ],
      solution: `<ul>${terms.map((t) => `<li><b>${t[0]}</b>: ${t[1]}</li>`).join('')}</ul>`,
      feedback: { correct: 'Correct. These shortcuts are the lamplighter’s whole toolkit.' },
    };
  });

  // ---------- Benchmarks on a double number line (dnl) ----------
  G.define('p3_dnlBench', (r) => {
    const n = 4 * r.int(8, 60);
    const ctx = r.pick(CTX);
    const vals = [0, n / 4, n / 2, (3 * n) / 4, n];
    return {
      type: 'dnl',
      skill: 'benchmarks',
      lesson: '4-3',
      title: 'Benchmarks on the number line',
      prompt: `<p>The row has ${hl(fmt(n) + ' ' + ctx.what)}, which is 100%. Fill in the amounts for 25%, 50%, and 75% on the double number line.</p>`,
      top: { label: 'Percent', values: ['0%', '25%', '50%', '75%', '100%'] },
      bottom: { label: ctx.unit.charAt(0).toUpperCase() + ctx.unit.slice(1), values: [0, null, null, null, n] },
      blanks: [
        { i: 1, answer: vals[1] },
        { i: 2, answer: vals[2] },
        { i: 3, answer: vals[3] },
      ],
      hints: [
        '50% is half of the whole. Start there: divide the total by 2.',
        `Half of ${fmt(n)} is ${n / 2}. 25% is half of that again.`,
        `25% = ${n / 4}. 75% is three quarters: ${n / 4} × 3 = ${(3 * n) / 4}.`,
      ],
      solution: `<p>50% of ${fmt(n)} = ${fmt(n)} ÷ 2 = <b>${n / 2}</b>. 25% = ${n / 2} ÷ 2 = <b>${n / 4}</b>. 75% = 3 × ${n / 4} = <b>${(3 * n) / 4}</b>. On a double number line, 100% always lines up with the whole.</p>${V.dnl({ label: 'Percent', values: ['0%', '25%', '50%', '75%', '100%'] }, { label: ctx.unit, values: vals }, { aria: `Double number line: 0, 25, 50, 75, 100 percent above 0, ${vals.join(', ')}` })}`,
      feedback: {
        correct: `Correct. Halving twice gives the quarters, and 75% is three of them.`,
        wrong() {
          return `Find 50% first (half of ${fmt(n)}), then halve again for 25%, then triple 25% for 75%.`;
        },
      },
    };
  });

  // ---------- Read a percent bar (mc) ----------
  G.define('p3_barModel', (r) => {
    const n = 10 * r.int(3, 30);
    const k = r.pick([2, 3, 4, 6, 7, 8]);
    const ctx = r.pick(CTX);
    const ans = (n * k) / 10;
    const opts = [
      { html: `${ans} ${ctx.unit}`, ok: true },
      { html: `${k} ${ctx.unit}`, why: `${k} is the number of shaded sections. Each section is 10% of ${n}, which is ${n / 10} ${ctx.unit}, not 1.` },
      { html: `${k * 10} ${ctx.unit}`, why: `${k * 10} is the <b>percent</b> shaded. The question asks for the number of ${ctx.unit}: ${k * 10}% of ${n}.` },
      { html: `${n - ans} ${ctx.unit}`, why: `${n - ans} is the unshaded part (${100 - k * 10}%). The shaded part is ${k * 10}% of ${n}.` },
      { html: `${ans + n / 10} ${ctx.unit}`, why: `${ans + n / 10} would be ${k + 1} sections. Count the shaded sections again: there are ${k}.` },
    ];
    // Drop any distractor whose value collides with an earlier option (for example when n = 100).
    const seenVals = new Set();
    const uniq = opts.filter((op) => {
      const v = parseFloat(op.html);
      if (seenVals.has(v)) return false;
      seenVals.add(v);
      return true;
    });
    const sh = shuffleOptions(r, uniq.slice(0, 4), 0);
    return {
      type: 'mc',
      skill: 'benchmarks',
      lesson: '4-3',
      title: 'Read the percent bar',
      prompt: `<p>The whole bar stands for ${hl(n + ' ' + ctx.what)} (100%). It is split into 10 equal sections, and ${hl(k)} sections are shaded.</p>${V.bar({ parts: 10, shaded: k, labels: ['0%', '10%', '20%', '30%', '40%', '50%', '60%', '70%', '80%', '90%'], aria: `Percent bar with ${k} of 10 sections shaded` })}<p>How many ${ctx.unit} does the shaded part represent?</p>`,
      options: sh.options,
      answer: sh.answer,
      hints: ['Each of the 10 sections is 10% of the whole.', `10% of ${n} is ${n / 10} ${ctx.unit}. The shaded part is ${k} sections.`, `${k} × ${n / 10} = ?`],
      solution: `<p>Each section is 10% of ${n} = ${n / 10} ${ctx.unit}. ${k} shaded sections = ${k} × ${n / 10} = <b>${ans} ${ctx.unit}</b> (${k * 10}% of ${n}).</p>`,
      feedback: { correct: `Correct. ${k} sections × ${n / 10} per section = ${ans}.` },
    };
  });

  // ---------- Estimate with a stated benchmark and friendly number (mc) ----------
  G.define('p3_estimate', (r) => {
    const p = r.pick([10, 25, 50, 75, 10, 25]);
    const near = p + r.pick([-2, -1, 1, 2]);
    const friendly = niceN(r, p, 40, 400);
    const actual = friendly + r.pick([-2, -1, 1, 2, 3]);
    const ctx = r.pick(CTX);
    const est = of(p, friendly);
    const others = [1, 10, 25, 50, 75].filter((b) => b !== p).map((b) => ({ b, v: of(b, friendly) }));
    const seenV = new Set([est]);
    const distinct = others.filter((o) => {
      if (seenV.has(o.v) || !(Number.isInteger(o.v) || o.b === 1)) return false;
      seenV.add(o.v);
      return true;
    });
    const picked = r.pickN(distinct, Math.min(3, distinct.length));
    const opts = [{ html: `about ${est}`, ok: true }].concat(
      picked.map((o) => ({ html: `about ${o.v}`, why: `${o.v} is ${o.b}% of ${friendly}. The question says to use ${p}%, because ${near}% is close to ${p}%.` })),
    );
    if (opts.length < 3) opts.push({ html: `about ${est * 10}`, why: `${est * 10} is ten times too big. ${p}% is ${BENCH[p].frac} of the whole, so the answer must be smaller than ${friendly}.` });
    const sh = shuffleOptions(r, opts, 0);
    const b = BENCH[p];
    return {
      type: 'mc',
      skill: 'estimate',
      lesson: '4-3',
      title: 'Estimate with a benchmark',
      prompt: `<p>About ${hl(near + '%')} of the ${hl(actual + ' ' + ctx.what)} need new wicks.</p><p>Estimate how many that is. Use the benchmark ${hl(p + '%')} and the friendly number ${hl(friendly)}.</p>`,
      options: sh.options,
      answer: sh.answer,
      hints: [
        `${near}% is close to ${p}%, and ${actual} is close to ${friendly}. Estimate ${p}% of ${friendly} instead.`,
        `${p}% = ${b.frac}. To find it, ${b.how}.`,
        `${p}% of ${friendly} = ${est}.`,
      ],
      solution: `<p>Replace the hard numbers with friendly ones: ${near}% → ${p}%, ${actual} → ${friendly}. ${p}% of ${friendly} = ${b.frac} of ${friendly} = <b>about ${est}</b>. An estimate is close, not exact, and it is fast.</p>`,
      feedback: { correct: `Correct. ${p}% of ${friendly} = ${est}, a close and quick estimate.` },
    };
  });

  // ---------- 1% then scale (blanks, hard = half-percent values) ----------
  G.define('p3_onePercent', (r, o) => {
    const hard = !!o.hard;
    const n = hard ? 50 * r.pick([3, 5, 7, 9, 11, 13]) : 100 * r.int(2, 12);
    const k = hard ? r.pick([3, 6, 7, 9, 12, 15]) : r.pick([2, 3, 4, 6, 7, 8, 9, 12]);
    const one = round(n / 100, 2);
    const ans = round(one * k, 2);
    const ctx = r.pick(CTX);
    return {
      type: 'blanks',
      skill: 'estimate',
      lesson: '4-3',
      title: 'Find 1%, then scale up',
      prompt: `<p>The warehouse holds ${hl(fmt(n) + ' ' + ctx.what)}. The lamplighter wants ${hl(k + '%')} of them. Use 1% as a stepping stone.</p>`,
      template: [`1% of ${fmt(n)} is {0}.`, `So ${k}% of ${fmt(n)} is {1}.`],
      fields: [
        { answer: one, width: 'sm' },
        { answer: ans, width: 'sm' },
      ],
      hints: ['1% = 1/100. To find 1% of a number, move the decimal point two places to the left.', `1% of ${fmt(n)} = ${one}. Now ${k}% is ${k} times as much as 1%.`, `${k} × ${one} = ?`],
      solution: `<p>1% of ${fmt(n)} = ${fmt(n)} ÷ 100 = <b>${one}</b>. Since ${k}% is ${k} times 1%, ${k}% of ${fmt(n)} = ${k} × ${one} = <b>${ans}</b>. Any percent can be built from 1%.</p>`,
      feedback: {
        correct: `Correct. 1% is ${one}, so ${k}% is ${k} × ${one} = ${ans}.`,
        wrong(ans2, d) {
          const v0 = parseNum(ans2[0]);
          if (d.wrong.includes(0) && v0 === n / 10) return `${n / 10} is 10% of ${fmt(n)}. For 1%, move the decimal point two places left.`;
          if (d.wrong.includes(0)) return `1% of ${fmt(n)} means ${fmt(n)} ÷ 100.`;
          const v1 = parseNum(ans2[1]);
          if (v1 != null && Math.abs(v1 - one * k * 10) < 1e-9) return `That is ${k * 10}%. For ${k}%, multiply 1% (${one}) by ${k}, not ${k * 10}.`;
          return `Your 1% is right. Multiply ${one} by ${k} to get ${k}%.`;
        },
      },
    };
  });

  // ---------- Who estimated reasonably? (who) ----------
  G.define('p3_whoEstimate', (r) => {
    const [a, b, c] = r.pickN(NAMES, 3);
    const p = r.pick([10, 25, 50, 75, 20]);
    const near = p + r.pick([-2, -1, 1, 2]);
    const friendly = p === 20 ? 10 * r.int(4, 40) : niceN(r, p, 40, 400);
    const actual = friendly + r.pick([-3, -2, -1, 1, 2, 3]);
    const est = of(p, friendly);
    const badB = p === 10 ? 50 : p === 50 ? 10 : p === 25 ? 75 : p === 75 ? 25 : 50;
    const badEst = of(badB, friendly);
    const noPct = near * actual;
    const ctx = r.pick(CTX);
    const opts = [
      { title: a, html: `"${near}% is about ${p}%, and ${actual} is about ${friendly}. ${p}% of ${friendly} is ${est}. About <b>${est}</b>."`, ok: true },
      {
        title: b,
        html: `"${near}% is about ${badB}%, and ${actual} is about ${friendly}. ${badB}% of ${friendly} is ${badEst}. About <b>${badEst}</b>."`,
        why: `${b} chose a benchmark that is far from ${near}%. ${near}% is close to ${p}%, not ${badB}%.`,
      },
      {
        title: c,
        html: `"${near} × ${actual} = ${fmt(noPct)}. About <b>${fmt(noPct)}</b>."`,
        why: `${c} multiplied by ${near} instead of ${near}%. A percent is out of 100, so the answer must be smaller than ${actual}.`,
      },
    ];
    const sh = shuffleOptions(r, opts, 0);
    return {
      type: 'who',
      skill: 'estimate',
      lesson: '4-3',
      title: 'Whose estimate is reasonable?',
      prompt: `<p>About ${hl(near + '%')} of ${hl(actual + ' ' + ctx.what)} are already lit. Three students estimate how many that is. Who made a reasonable estimate?</p>`,
      options: sh.options,
      answer: sh.answer,
      layout: 'cards',
      hints: [
        'A good estimate uses a benchmark percent that is <b>close</b> to the real percent, and a friendly number close to the real number.',
        `Which benchmark is closest to ${near}%: ${p}% or ${badB}%?`,
        `${p}% of ${friendly} = ${est}. That is a reasonable estimate for ${near}% of ${actual}.`,
      ],
      solution: `<p><b>${a}</b> is reasonable: ${near}% ≈ ${p}% and ${actual} ≈ ${friendly}, so the estimate is ${p}% of ${friendly} = ${est}. ${b} used a benchmark too far from ${near}%. ${c} forgot that a percent is out of 100, so the answer came out far too large.</p>`,
      feedback: { correct: `Correct. A reasonable estimate stays close to both the percent and the number.` },
    };
  });

  // ---------- Explain an estimation strategy (cr) ----------
  G.define('p3_crEstimate', (r) => {
    const p = r.pick([10, 25, 50, 75]);
    const near = p + r.pick([-2, -1, 1, 2]);
    const friendly = niceN(r, p, 40, 400);
    const actual = friendly + r.pick([-2, -1, 1, 2]);
    const est = of(p, friendly);
    const ctx = r.pick(CTX);
    const b = BENCH[p];
    const wrongs = [1, 10, 25, 50, 75]
      .filter((x) => x !== p)
      .map((x) => of(x, friendly))
      .filter((v) => v !== est && Number.isInteger(v));
    const picked = r.pickN(wrongs, 2);
    const checkOpts = [{ html: `about ${est}`, ok: true }].concat(
      picked.map((v) => ({ html: `about ${v}` })),
      [{ html: `about ${fmt(near * actual)}` }],
    );
    const sh = shuffleOptions(r, checkOpts, 0);
    return {
      type: 'cr',
      skill: 'estimate',
      lesson: '4-3',
      title: 'Explain your estimate',
      prompt: `<p>A lamplighter needs to know about ${hl(near + '%')} of ${hl(actual + ' ' + ctx.what)}, without a calculator.</p><p>Explain how to estimate the answer. Name the benchmark percent and the friendly number you would use.</p>`,
      starters: [`${near}% is close to the benchmark…`, `A friendly number for ${actual} is…`, 'To find that percent in my head, I…', 'So my estimate is about…'],
      minWords: 12,
      check: { prompt: 'Which estimate matches that strategy?', options: sh.options, answer: sh.answer },
      hints: [
        `Pick the benchmark closest to ${near}%. The choices are 10%, 25%, 50%, and 75%.`,
        `${near}% ≈ ${p}%. ${p}% is ${b.word}, so ${b.how}.`,
        `Use ${friendly} for ${actual}. ${p}% of ${friendly} = ${est}.`,
      ],
      solution: `<p>${near}% is close to <b>${p}%</b>, and ${actual} is close to <b>${friendly}</b>. ${p}% = ${b.frac}, so ${b.how}: ${p}% of ${friendly} = <b>about ${est}</b>. A strong explanation names the benchmark, the friendly number, and the mental step.</p>`,
      feedback: {
        correct: 'Correct. Benchmark + friendly number + mental step is the whole strategy.',
        wrong(ans, d) {
          if (!d.wroteEnough) return 'Write a little more. Name the benchmark percent, the friendly number, and how you found the percent in your head.';
          return `Check the benchmark: ${near}% is closest to ${p}%. ${p}% of ${friendly} is ${est}.`;
        },
      },
    };
  });
})(typeof window !== 'undefined' ? window : globalThis);

/* js/units/u4/gen-find.js */
/* Zone 4 — Glow Foundry. Lesson 4-4 Find and Compare with Percents (Find the Percent of a Number · Compare with Percents). */
(function (root) {
  'use strict';
  const RX = root.RX;
  const { G, V, shuffleOptions, NAMES, round, money, fmt, parseNum } = RX;
  const hl = V.hl;

  const FRAC = { 10: '1/10', 20: '1/5', 25: '1/4', 30: '3/10', 40: '2/5', 50: '1/2', 60: '3/5', 70: '7/10', 75: '3/4', 80: '4/5', 90: '9/10' };
  const CTX = [
    { what: 'lanterns in the foundry', unit: 'lanterns' },
    { what: 'glass panes in the kiln', unit: 'panes' },
    { what: 'students in the sixth grade', unit: 'students' },
    { what: 'questions on the test', unit: 'questions' },
    { what: 'seats in the theater', unit: 'seats' },
    { what: 'songs in the playlist', unit: 'songs' },
  ];
  const ITEMS = ['lantern', 'backpack', 'skateboard', 'jacket', 'board game', 'pair of headphones', 'sketchbook set'];
  const dec = (p) => String(round(p / 100, 2));
  const of = (p, n) => round((p / 100) * n, 2);
  // Whole n so that p% of n is a whole number.
  const wholeFor = (r, p, lo, hi) => {
    const g = RX.gcd(p, 100);
    const m = 100 / g;
    return m * r.int(Math.ceil(lo / m), Math.floor(hi / m));
  };

  // ---------- Fraction method (num) ----------
  G.define('p4_fractionMethod', (r) => {
    const p = r.pick([20, 25, 40, 50, 60, 75, 80, 10, 30, 70, 90]);
    const n = wholeFor(r, p, 20, 240);
    const ctx = r.pick(CTX);
    const ans = of(p, n);
    const [fn, fd] = FRAC[p].split('/').map(Number);
    return {
      type: 'num',
      skill: 'percent-of',
      lesson: '4-4',
      title: 'Use a fraction',
      prompt: `<p>${hl(p + '%')} of the ${hl(n + ' ' + ctx.what)} are finished. Use the <b>fraction</b> method to find how many that is.</p><p class="muted">Write the percent as a fraction, then multiply.</p>`,
      unit: ctx.unit,
      answer: ans,
      hints: [
        `${p}% = ${p}/100. Simplify it to a friendly fraction: ${FRAC[p]}.`,
        `Find ${FRAC[p]} of ${n}: divide ${n} by ${fd}${fn > 1 ? `, then multiply by ${fn}` : ''}.`,
        `${n} ÷ ${fd} = ${n / fd}${fn > 1 ? `, and ${n / fd} × ${fn} = ?` : '.'}`,
      ],
      solution: `<p>${p}% = ${FRAC[p]}. ${FRAC[p]} of ${n} = ${n} ÷ ${fd}${fn > 1 ? ` × ${fn}` : ''} = <b>${ans} ${ctx.unit}</b>. Writing the percent as a fraction turns the problem into dividing by ${fd}${fn > 1 ? ` and multiplying by ${fn}` : ''}.</p>`,
      feedback: {
        correct: `Correct. ${p}% of ${n} = ${FRAC[p]} × ${n} = ${ans}.`,
        wrong(a, d) {
          const v = d.value;
          if (v === n / fd && fn > 1) return `${n / fd} is only ${FRAC[p].replace(/^\d+/, '1')} of ${n}. ${FRAC[p]} means ${fn} of those parts, so multiply by ${fn}.`;
          if (v === p * n) return `You multiplied by ${p} instead of ${p}%. ${p}% is ${FRAC[p]}, which makes the answer smaller than ${n}.`;
          if (v === n - ans) return `${n - ans} is the other ${100 - p}%. The question asks for the ${p}% part.`;
          return `${p}% = ${FRAC[p]}. Divide ${n} by ${fd}${fn > 1 ? `, then multiply by ${fn}` : ''}.`;
        },
      },
    };
  });

  // ---------- Decimal method (blanks; hard = single-digit percents) ----------
  G.define('p4_decimalMethod', (r, o) => {
    const hard = !!o.hard;
    const p = hard ? r.pick([4, 5, 6, 7, 8, 9, 15, 35]) : r.pick([15, 35, 45, 55, 65, 85, 12, 24, 36, 48]);
    const n = hard ? 20 * r.int(2, 12) : wholeFor(r, p, 20, 300);
    const ans = of(p, n);
    const ctx = r.pick(CTX);
    return {
      type: 'blanks',
      skill: 'percent-of',
      lesson: '4-4',
      title: 'Use a decimal',
      prompt: `<p>${hl(p + '%')} of the ${hl(n + ' ' + ctx.what)} are new this year. Use the <b>decimal</b> method.</p>`,
      template: [`${p}% written as a decimal is {0}.`, `${p}% of ${n} = {0}? No: {1} ${ctx.unit}.`.replace('{0}? No: ', '').replace(`${p}% of ${n} = `, `So ${p}% of ${n} is `)],
      fields: [
        { answer: round(p / 100, 2), width: 'sm' },
        { answer: ans, width: 'sm' },
      ],
      hints: [
        'Percent means hundredths. Write the percent as a decimal by dividing by 100 (move the decimal point two places left).',
        `${p}% = ${dec(p)}. ${hard && p < 10 ? `Careful: ${p}% is ${p} hundredths, 0.0${p}, not 0.${p}.` : ''} Then multiply the decimal by ${n}.`,
        `${dec(p)} × ${n} = ?`,
      ],
      solution: `<p>${p}% = ${p} hundredths = <b>${dec(p)}</b>. Multiply: ${dec(p)} × ${n} = <b>${ans} ${ctx.unit}</b>. The decimal method works for any percent, even ones that are not friendly fractions.</p>`,
      feedback: {
        correct: `Correct. ${p}% = ${dec(p)}, and ${dec(p)} × ${n} = ${ans}.`,
        wrong(a, d) {
          const v0 = parseNum(a[0]);
          const v1 = parseNum(a[1]);
          if (d.wrong.includes(0) && v0 != null && Math.abs(v0 - p / 10) < 1e-9) return `${round(p / 10, 2)} is ${p} tenths, which is ${p * 10}%. ${p}% is ${p} hundredths: ${dec(p)}.`;
          if (d.wrong.includes(0) && v0 === p) return `${p} is the percent. The decimal is ${p} ÷ 100 = ${dec(p)}.`;
          if (d.wrong.includes(1) && v1 != null && Math.abs(v1 - ans * 10) < 1e-9) return `${round(ans * 10, 2)} is ${p * 10}% of ${n}. Check your decimal: ${p}% = ${dec(p)}.`;
          if (d.wrong.includes(1)) return `Multiply the decimal by the whole: ${dec(p)} × ${n}.`;
          return `Write ${p}% as hundredths: ${p} ÷ 100.`;
        },
      },
    };
  });

  // ---------- Percent of a number on a double number line (dnl) ----------
  G.define('p4_dnlFind', (r) => {
    const n = 5 * r.int(6, 60);
    const ctx = r.pick(CTX);
    const vals = [0, 1, 2, 3, 4, 5].map((i) => (n * i) / 5);
    return {
      type: 'dnl',
      skill: 'percent-of',
      lesson: '4-4',
      title: 'Use a double number line',
      prompt: `<p>There are ${hl(n + ' ' + ctx.what)}, which is 100%. The foundry sorts them in 20% batches. Fill in the missing amounts for 20%, 40%, and 80%.</p>`,
      top: { label: 'Percent', values: ['0%', '20%', '40%', '60%', '80%', '100%'] },
      bottom: { label: ctx.unit.charAt(0).toUpperCase() + ctx.unit.slice(1), values: [0, null, null, vals[3], null, n] },
      blanks: [
        { i: 1, answer: vals[1] },
        { i: 2, answer: vals[2] },
        { i: 4, answer: vals[4] },
      ],
      hints: [
        '100% lines up with the whole. 20% is one fifth of the whole, so divide by 5.',
        `20% of ${n} = ${n} ÷ 5 = ${vals[1]}. Each step to the right adds ${vals[1]}.`,
        `20% → ${vals[1]}, 40% → ${vals[1] * 2}, 60% → ${vals[3]} (given), 80% → ${vals[1] * 4}.`,
      ],
      solution: `<p>20% = 1/5, so 20% of ${n} = ${n} ÷ 5 = <b>${vals[1]}</b>. Then 40% = 2 × ${vals[1]} = <b>${vals[2]}</b> and 80% = 4 × ${vals[1]} = <b>${vals[4]}</b>. Check: 60% = 3 × ${vals[1]} = ${vals[3]}, which matches the given value.</p>${V.dnl({ label: 'Percent', values: ['0%', '20%', '40%', '60%', '80%', '100%'] }, { label: ctx.unit, values: vals }, { aria: `Double number line: 0 to 100 percent above 0 to ${n}` })}`,
      feedback: {
        correct: `Correct. Once 20% is ${vals[1]}, every tick is a multiple of it.`,
        wrong() {
          return `Start with 20%: ${n} ÷ 5 = ${vals[1]}. Then count up by ${vals[1]} for each 20%.`;
        },
      },
    };
  });

  // ---------- Error: wrote p% as 0.p (error) ----------
  G.define('p4_errorDecimal', (r) => {
    const name = r.pick(NAMES);
    const p = r.int(2, 9);
    const n = 20 * r.int(2, 10);
    const wrongDec = `0.${p}`;
    const rightDec = `0.0${p}`;
    const wrongAns = round(n * (p / 10), 2);
    const rightAns = of(p, n);
    const ctx = r.pick(CTX);
    const opts = [
      { html: `${name} wrote ${p}% as ${wrongDec}, which is ${p * 10}%. ${p}% is ${p} hundredths: ${rightDec}.`, ok: true },
      { html: `${name} should have divided ${n} by ${p}.`, why: `Dividing by ${p} gives ${round(n / p, 2)}, which is 1/${p} of ${n}, not ${p}%. ${p}% means ${p} out of 100.` },
      { html: `${name} should have multiplied ${n} by ${p}.`, why: `${n} × ${p} = ${n * p}, which is ${p * 100}% of ${n}. A percent less than 100 gives a smaller answer, not a bigger one.` },
      { html: `There is no mistake. ${wrongAns} is correct.`, why: `${wrongAns} is ${p * 10}% of ${n}. The question asks for ${p}%, which is ten times smaller.` },
    ];
    const sh = shuffleOptions(r, opts, 0);
    return {
      type: 'error',
      skill: 'percent-of',
      lesson: '4-4',
      title: 'Find the mistake',
      prompt: `<p>${name} is finding ${hl(p + '%')} of the ${hl(n + ' ' + ctx.what)}. What is the mistake?</p>`,
      work: `${p}% = ${wrongDec} &nbsp;&nbsp; ${wrongDec} × ${n} = ${wrongAns}`,
      options: sh.options,
      answer: sh.answer,
      fix: { label: `${p}% of ${n} =`, answer: rightAns },
      hints: [`Percent means hundredths. How many hundredths is ${p}%?`, `${p}% = ${p}/100 = ${rightDec}. The student wrote ${wrongDec}, which is ${p}/10 = ${p * 10}%.`, `${rightDec} × ${n} = ?`],
      solution: `<p>${p}% is ${p} hundredths, so the decimal is <b>${rightDec}</b>, not ${wrongDec} (that is ${p * 10}%). ${rightDec} × ${n} = <b>${rightAns}</b>. A quick check: 10% of ${n} is ${n / 10}, so ${p}% must be less than that.</p>`,
      feedback: {
        correct: `Correct. ${p}% = ${rightDec}, so ${p}% of ${n} = ${rightAns}.`,
        wrong(a, d) {
          if (!d.mistakeOk) return `Compare ${wrongDec} and ${rightDec}. Which one is ${p} hundredths?`;
          const v = parseNum(a.fix);
          if (v === wrongAns) return `${wrongAns} is the student's wrong answer (${p * 10}%). Use ${rightDec} × ${n}.`;
          return `You found the mistake. Now compute ${rightDec} × ${n}.`;
        },
      },
    };
  });

  // ---------- Compare two percent situations (mc; hard = discounts in dollars) ----------
  G.define('p4_compareTwo', (r, o) => {
    const hard = !!o.hard;
    const [nameA, nameB] = r.pickN(NAMES, 2);
    let pa, na, pb, nb;
    do {
      pa = r.pick(hard ? [15, 25, 30, 35, 40] : [10, 20, 25, 30, 40, 50, 60, 75]);
      pb = r.pick(hard ? [15, 25, 30, 35, 40] : [10, 20, 25, 30, 40, 50, 60, 75]);
      na = hard ? r.int(20, 90) : wholeFor(r, pa, 20, 200);
      nb = hard ? r.int(20, 90) : wholeFor(r, pb, 20, 200);
    } while (pa === pb || na === nb);
    const a = of(pa, na);
    const b = of(pb, nb);
    const equal = a === b;
    const aStr = hard ? money(a) : `${a}`;
    const bStr = hard ? money(b) : `${b}`;
    const descA = hard ? `${pa}% off a ${money(na)} ${r.pick(ITEMS)}` : `${pa}% of ${na} lanterns`;
    const descB = hard ? `${pb}% off a ${money(nb)} ${r.pick(ITEMS)}` : `${pb}% of ${nb} lanterns`;
    const opts = [
      { html: `${nameA}: ${descA} (${aStr})`, ok: !equal && a > b, why: `${descA} is ${aStr}, and ${descB} is ${bStr}. ${a > b ? '' : `${aStr} is not more than ${bStr}.`}` },
      { html: `${nameB}: ${descB} (${bStr})`, ok: !equal && b > a, why: `${descB} is ${bStr}, and ${descA} is ${aStr}. ${b > a ? '' : `${bStr} is not more than ${aStr}.`}` },
      { html: 'They are the same amount.', ok: equal, why: `They are different: ${aStr} and ${bStr}.` },
      { html: `${pa > pb ? nameA : nameB}, because ${Math.max(pa, pb)}% is the bigger percent.`, why: `A bigger percent of a smaller number can be less. Compute both: ${aStr} and ${bStr}.` },
    ];
    // if the bigger-percent person is actually right, that distractor duplicates the truth; swap its text to the bigger-number reasoning
    const biggerPctWins = !equal && (pa > pb ? a > b : b > a);
    if (biggerPctWins)
      opts[3] = {
        html: `${na > nb ? nameA : nameB}, because ${hard ? money(Math.max(na, nb)) : Math.max(na, nb)} is the bigger whole.`,
        why: `The bigger whole does not decide it. Compute both: ${aStr} and ${bStr}.`,
      };
    const correctIdx = equal ? 2 : a > b ? 0 : 1;
    const sh = shuffleOptions(r, opts, correctIdx);
    return {
      type: 'mc',
      skill: 'compare-percents',
      lesson: '4-4',
      title: hard ? 'Which discount saves more?' : 'Which is more?',
      prompt: hard
        ? `<p>${nameA} finds ${hl(descA)}. ${nameB} finds ${hl(descB)}. Who saves more money?</p>`
        : `<p>${nameA} lights ${hl(descA)}. ${nameB} lights ${hl(descB)}. Who lights more lanterns?</p>`,
      options: sh.options,
      answer: sh.answer,
      hints: [
        'You cannot compare the percents alone. Find each amount.',
        `${nameA}: ${pa}% of ${hard ? money(na) : na} = ${dec(pa)} × ${hard ? na : na} = ${aStr}.`,
        `${nameB}: ${pb}% of ${hard ? money(nb) : nb} = ${dec(pb)} × ${nb} = ${bStr}. Compare.`,
      ],
      solution: `<p>${nameA}: ${pa}% of ${hard ? money(na) : na} = <b>${aStr}</b>. ${nameB}: ${pb}% of ${hard ? money(nb) : nb} = <b>${bStr}</b>. ${equal ? 'The amounts are <b>equal</b>.' : `<b>${a > b ? nameA : nameB}</b> has more.`} A percent only tells you the rate; the whole decides the amount.</p>`,
      feedback: { correct: `Correct. ${aStr} versus ${bStr}. Always compute both amounts before comparing.` },
    };
  });

  // ---------- Test scores table (table) ----------
  G.define('p4_tableScores', (r) => {
    const names = r.pickN(NAMES, 3);
    const total = r.pick([20, 25, 40, 50]);
    const step = 100 / total; // percent per question
    const scores = r.pickN(
      Array.from({ length: Math.floor(total * 0.6) }, (_, i) => total - i),
      3,
    );
    const rows = [['Student', 'Correct', 'Total', 'Percent']];
    const inputs = [];
    names.forEach((nm, i) => {
      rows.push([nm, String(scores[i]), String(total), `__IN:s${i}__`]);
      inputs.push({ id: `s${i}`, answer: round(scores[i] * step, 2) });
    });
    return {
      type: 'table',
      skill: 'compare-percents',
      lesson: '4-4',
      title: 'Scores as percents',
      prompt: `<p>Three Keepers took the ${total}-question foundry exam. ${names[0]} got ${scores[0]} correct, ${names[1]} got ${scores[1]}, and ${names[2]} got ${scores[2]}. Write each score as a percent (no % sign).</p>`,
      rows,
      inputs,
      header: true,
      hints: [
        `A score is a fraction: correct out of ${total}. Change it to a fraction out of 100.`,
        `Each question is worth 100 ÷ ${total} = ${step}% . Multiply the number correct by ${step}.`,
        `${names[0]}: ${scores[0]} × ${step} = ${round(scores[0] * step, 2)}. Do the same for the others.`,
      ],
      solution: `<p>Each question is worth ${step}%. ${names.map((nm, i) => `${nm}: ${scores[i]}/${total} = ${scores[i]} × ${step} = <b>${round(scores[i] * step, 2)}%</b>`).join('; ')}. Scores become easy to compare once they are all out of 100.</p>`,
      feedback: {
        correct: 'Correct. Every score is now a rate per 100.',
        wrong(a, d) {
          const i = Number(d.wrong[0].slice(1));
          const v = parseNum(a[d.wrong[0]]);
          if (v === scores[i]) return `${scores[i]} is the number correct, not the percent. Multiply by ${step} to make it out of 100.`;
          if (v === total - scores[i]) return `${total - scores[i]} is the number wrong. The percent is the correct answers out of 100.`;
          return `For ${names[i]}: ${scores[i]} out of ${total}. Each question is ${step}%, so multiply ${scores[i]} × ${step}.`;
        },
      },
    };
  });

  // ---------- True/false: percent discount vs dollars off (tf) ----------
  G.define('p4_tfBetterDeal', (r) => {
    const name = r.pick(NAMES);
    const item = r.pick(ITEMS);
    const price = 4 * r.int(6, 25);
    const p = r.pick([10, 20, 25, 30, 40, 50]);
    const pctSave = of(p, price);
    let dollars = pctSave + r.pick([-6, -4, -3, 3, 4, 6]);
    if (dollars <= 0) dollars = pctSave + 3;
    const claimA = r.chance(0.5); // claim: Store A (percent) saves more
    const truth = claimA ? pctSave > dollars : dollars > pctSave;
    const reasons = r.shuffle([
      { html: `${p}% of ${money(price)} is ${money(pctSave)}. ${money(pctSave)} is ${pctSave > dollars ? 'more' : 'less'} than ${money(dollars)}.`, correct: true },
      { html: `${p}% of ${money(price)} is ${money(pctSave)}. ${money(pctSave)} is ${pctSave > dollars ? 'less' : 'more'} than ${money(dollars)}.`, correct: false },
      { html: `${p} is ${p > dollars ? 'bigger' : 'smaller'} than ${dollars}, so the ${p > dollars ? 'percent discount' : 'dollar discount'} is bigger.`, correct: false },
      { html: 'A percent off is always a better deal than dollars off.', correct: false },
    ]);
    return {
      type: 'tf',
      skill: 'compare-percents',
      lesson: '4-4',
      title: 'Which deal is better?',
      prompt: `<p>A ${item} costs ${hl(money(price))}. Store A takes ${hl(p + '% off')}. Store B takes ${hl(money(dollars) + ' off')}.</p><p>${name} says: "<b>Store ${claimA ? 'A' : 'B'}</b> saves more money." Is ${name} correct? Choose true or false and the best reason.</p>`,
      statement: `Store ${claimA ? 'A' : 'B'} saves more`,
      answer: truth,
      reasons,
      labels: ['True', 'False'],
      hints: [
        'A percent and a dollar amount cannot be compared directly. Change the percent to dollars.',
        `${p}% of ${money(price)} = ${dec(p)} × ${price} = ${money(pctSave)}.`,
        `Compare ${money(pctSave)} (Store A) with ${money(dollars)} (Store B).`,
      ],
      solution: `<p>Store A saves ${p}% of ${money(price)} = <b>${money(pctSave)}</b>. Store B saves <b>${money(dollars)}</b>. Store ${pctSave > dollars ? 'A' : 'B'} saves more, so ${name}'s claim is <b>${truth ? 'true' : 'false'}</b>. Convert the percent to an amount before comparing.</p>`,
      feedback: {
        correct: `Correct. ${money(pctSave)} versus ${money(dollars)} settles it.`,
        wrong(a, d) {
          if (!d.valueOk) return `Find the dollar value of the percent discount first: ${p}% of ${money(price)} = ${money(pctSave)}.`;
          return 'Your true/false is right, but the reason must compare the two discounts in dollars.';
        },
      },
    };
  });

  // ---------- Discount / tax / tip word problem (num, money; hard = final price) ----------
  G.define('p4_discount', (r, o) => {
    const hard = !!o.hard;
    const name = r.pick(NAMES);
    const item = r.pick(ITEMS);
    const kind = r.pick(['discount', 'tax', 'tip']);
    const price = kind === 'tip' ? r.int(20, 80) : 2 * r.int(8, 60);
    const p = kind === 'discount' ? r.pick([10, 15, 20, 25, 30, 40, 50]) : kind === 'tax' ? r.pick([5, 6, 8, 10]) : r.pick([15, 20]);
    const part = of(p, price);
    const final = kind === 'discount' ? round(price - part, 2) : round(price + part, 2);
    const base = kind === 'tip' ? `The bill at the Lantern Café is ${hl(money(price))}` : `A ${item} costs ${hl(money(price))}`;
    const line = kind === 'discount' ? `It is on sale for ${hl(p + '% off')}.` : kind === 'tax' ? `Sales tax is ${hl(p + '%')}.` : `${name} leaves a ${hl(p + '%')} tip.`;
    const partWord = kind === 'discount' ? 'the discount' : kind === 'tax' ? 'the tax' : 'the tip';
    const question = hard ? (kind === 'discount' ? 'What is the <b>sale price</b>?' : 'What is the <b>total</b> paid?') : `How much is ${partWord}?`;
    const ans = hard ? final : part;
    return {
      type: 'num',
      skill: 'compare-percents',
      lesson: '4-4',
      title: hard ? `Find the ${kind === 'discount' ? 'sale price' : 'total'}` : `Find the ${kind}`,
      prompt: `<p>${base}. ${line}</p><p>${question}</p>`,
      answer: ans,
      tolerance: 0.006,
      hints: [
        `${partWord.charAt(0).toUpperCase() + partWord.slice(1)} is ${p}% of the price. Write ${p}% as a decimal: ${dec(p)}.`,
        `${dec(p)} × ${price} = ${money(part)}. That is ${partWord}.`,
        hard
          ? kind === 'discount'
            ? `Subtract the discount from the price: ${money(price)} − ${money(part)}.`
            : `Add it to the price: ${money(price)} + ${money(part)}.`
          : `So ${partWord} is ${money(part)}.`,
      ],
      solution: `<p>${partWord.charAt(0).toUpperCase() + partWord.slice(1)} = ${p}% of ${money(price)} = ${dec(p)} × ${price} = <b>${money(part)}</b>.${hard ? ` ${kind === 'discount' ? `Sale price = ${money(price)} − ${money(part)} = <b>${money(final)}</b>.` : `Total = ${money(price)} + ${money(part)} = <b>${money(final)}</b>.`}` : ''} ${kind === 'discount' ? 'A discount is taken off the price.' : `${kind === 'tax' ? 'Tax' : 'A tip'} is added to the price.`}</p>`,
      feedback: {
        correct: hard ? `Correct. ${money(part)} ${kind === 'discount' ? 'off' : 'added'} gives ${money(final)}.` : `Correct. ${p}% of ${money(price)} is ${money(part)}.`,
        wrong(a, d) {
          const v = d.value;
          if (v == null) return `Write ${p}% as ${dec(p)} and multiply by ${price}.`;
          if (hard && Math.abs(v - part) < 0.006)
            return `${money(part)} is ${partWord}. The question asks for the ${kind === 'discount' ? 'sale price, so subtract it from' : 'total, so add it to'} ${money(price)}.`;
          if (!hard && Math.abs(v - final) < 0.006) return `${money(final)} is the ${kind === 'discount' ? 'sale price' : 'total'}. The question asks only for ${partWord}: ${money(part)}.`;
          if (Math.abs(v - price * (p / 10)) < 0.006) return `You used ${round(p / 10, 2)} for ${p}%. ${p}% is ${p} hundredths: ${dec(p)}.`;
          if (Math.abs(v - price * p) < 0.006) return `You multiplied by ${p}. ${p}% means ${p} out of 100, so multiply by ${dec(p)}.`;
          return `${partWord.charAt(0).toUpperCase() + partWord.slice(1)} = ${dec(p)} × ${money(price)}.${hard ? ` Then ${kind === 'discount' ? 'subtract from' : 'add to'} the price.` : ''}`;
        },
      },
    };
  });
})(typeof window !== 'undefined' ? window : globalThis);

/* js/units/u4/gen-whole.js */
/* Zone 5 — The Oil Reservoir. Lesson 4-5 Determine the Whole Given the Part and Percent (Find the Whole · Solve for the Whole). */
(function (root) {
  'use strict';
  const RX = root.RX;
  const { G, V, shuffleOptions, NAMES, round, money, parseNum } = RX;
  const hl = V.hl;

  const FRAC = { 10: '1/10', 20: '1/5', 25: '1/4', 30: '3/10', 40: '2/5', 50: '1/2', 60: '3/5', 75: '3/4', 80: '4/5' };
  const CTX = [
    { thing: 'lanterns on the reservoir wall', unit: 'lanterns', verb: 'lit' },
    { thing: 'oil jars in the storeroom', unit: 'jars', verb: 'full' },
    { thing: 'students in the sixth grade', unit: 'students', verb: 'in the festival choir' },
    { thing: 'seats on the lantern boat', unit: 'seats', verb: 'taken' },
    { thing: "pages in the Keeper's logbook", unit: 'pages', verb: 'filled in' },
    { thing: 'tickets for the night market', unit: 'tickets', verb: 'sold' },
  ];
  const ITEMS = ['lantern', 'backpack', 'skateboard', 'jacket', 'board game', 'pair of headphones', 'sketchbook set'];
  const dec = (p) => String(round(p / 100, 2));
  const partOf = (p, n) => round((p / 100) * n, 2);
  // Whole n in [lo, hi] such that p% of n is a whole number.
  const wholeFor = (r, p, lo, hi) => {
    const m = 100 / RX.gcd(p, 100);
    return m * r.int(Math.ceil(lo / m), Math.floor(hi / m));
  };
  const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
  const BAR_LABELS = ['0%', '10%', '20%', '30%', '40%', '50%', '60%', '70%', '80%', '90%'];

  // ---------- Tape diagram: part row and whole row (tape; hard = 10% boxes, bigger values) ----------
  G.define('p5_tape', (r, o) => {
    const hard = !!o.hard;
    const step = hard ? 10 : r.pick([10, 20, 25]);
    const nBoxes = 100 / step;
    const k = hard ? r.pick([3, 6, 7, 8, 9]) : step === 10 ? r.pick([2, 3, 4]) : r.pick([2, 3]);
    const p = k * step;
    const m = hard ? r.int(7, 25) : r.int(3, 12);
    const part = k * m;
    const whole = nBoxes * m;
    const ctx = r.pick(CTX);
    const boxWord = k === 1 ? 'box' : 'boxes';
    return {
      type: 'tape',
      skill: 'find-whole',
      lesson: '4-5',
      title: hard ? 'Find the whole (tape diagram)' : 'Find the whole with a tape diagram',
      prompt: `<p>${hl(p + '%')} of the ${ctx.thing} are ${ctx.verb}. That is ${hl(part + ' ' + ctx.unit)}.</p><p>In the tape diagram every box is ${step}%. The top row shows the ${p}% part. The bottom row shows the whole (100%). Find the value of one box, then the whole.</p>`,
      rows: [
        { label: `${p}% (part)`, boxes: k },
        { label: '100% (whole)', boxes: nBoxes },
      ],
      fields: [
        { key: 'box', label: `One box (${step}%)`, answer: m },
        { key: 'whole', label: `Whole (100%), in ${ctx.unit}`, answer: whole },
      ],
      given: { rowA: part },
      hints: [
        `All boxes are the same size. The ${p}% row has ${k} ${boxWord} and stands for ${part} ${ctx.unit}.`,
        `${part} ÷ ${k} = ${m}. One box (${step}%) is worth ${m} ${ctx.unit}.`,
        `The whole row has ${nBoxes} boxes. ${nBoxes} × ${m} = ?`,
      ],
      solution: `<p>The ${p}% row has ${k} ${boxWord} worth ${part} in all, so one box is ${part} ÷ ${k} = <b>${m}</b>. The whole (100%) is ${nBoxes} boxes: ${nBoxes} × ${m} = <b>${whole} ${ctx.unit}</b>. Check: ${p}% of ${whole} = ${part}. A tape diagram works because every box has the same value.</p>${V.tape(
        [
          { label: `${p}% (part)`, boxes: k, value: m, total: part },
          { label: '100% (whole)', boxes: nBoxes, value: m, total: whole },
        ],
        { boxW: 46, labelW: 110, aria: `Tape diagram: ${k} boxes of ${m} make ${part}; ${nBoxes} boxes of ${m} make ${whole}` },
      )}`,
      feedback: {
        correct: `Correct. One box is ${m}, so the whole is ${nBoxes} × ${m} = ${whole}.`,
        wrong(a, d) {
          const box = parseNum(a.box);
          const w = parseNum(a.whole);
          if (d.wrong.includes('box')) {
            if (box === part) return `${part} is the value of the whole ${p}% row, not of one box. Divide ${part} by the ${k} ${boxWord}.`;
            if (box === step) return `${step} is the percent one box stands for. Its value in ${ctx.unit} is ${part} ÷ ${k}.`;
            return `Start with the row you know: ${k} equal ${boxWord} make ${part}. Divide to find one box.`;
          }
          if (w === part) return `${part} is the ${p}% part. The whole is all ${nBoxes} boxes in the bottom row.`;
          if (w != null && Math.abs(w - partOf(p, part)) < 1e-9) return `You found ${p}% of ${part}. The whole is bigger than the part: multiply one box (${m}) by ${nBoxes}.`;
          return `Your box value is right. The whole row has ${nBoxes} boxes, so multiply ${m} by ${nBoxes}.`;
        },
      },
    };
  });

  // ---------- Double number line: given one percent-amount pair, find the rest including 100% (dnl) ----------
  G.define('p5_dnlWhole', (r) => {
    const step = r.pick([20, 25]);
    const n = 100 / step;
    const per = r.int(3, 15);
    const whole = per * n;
    const ctx = r.pick(CTX);
    const top = Array.from({ length: n + 1 }, (_, i) => `${i * step}%`);
    const vals = Array.from({ length: n + 1 }, (_, i) => per * i);
    const givenIdx = r.pick(step === 25 ? [2, 3] : [2, 3, 4]);
    const others = [];
    for (let i = 1; i < n; i++) if (i !== givenIdx) others.push(i);
    const blankIdx = r.pickN(others, 2).concat([n]).sort((x, y) => x - y);
    const bottom = vals.map((v, i) => (blankIdx.includes(i) ? null : v));
    const p = givenIdx * step;
    const part = vals[givenIdx];
    const label = cap(ctx.unit);
    return {
      type: 'dnl',
      skill: 'find-whole',
      lesson: '4-5',
      title: 'Find the whole on a double number line',
      prompt: `<p>${hl(p + '%')} of the ${ctx.thing} are ${ctx.verb}. That is ${hl(part + ' ' + ctx.unit)}.</p><p>Fill in the missing amounts on the double number line, including the whole at 100%.</p>`,
      top: { label: 'Percent', values: top },
      bottom: { label, values: bottom },
      blanks: blankIdx.map((i) => ({ i, answer: vals[i] })),
      hints: [
        `${p}% is ${givenIdx} jumps of ${step}%. Find the amount for one jump of ${step}% first.`,
        `${part} ÷ ${givenIdx} = ${per}. Each ${step}% is ${per} ${ctx.unit}.`,
        `Count up by ${per}: ${vals
          .slice(1)
          .map((v, i) => `${(i + 1) * step}% → ${v}`)
          .join(', ')}.`,
      ],
      solution: `<p>${p}% lines up with ${part}. Since ${p}% is ${givenIdx} × ${step}%, each ${step}% is ${part} ÷ ${givenIdx} = <b>${per}</b>. Count up by ${per}: ${blankIdx.map((i) => `${i * step}% → <b>${vals[i]}</b>`).join(', ')}. The whole (100%) is <b>${whole} ${ctx.unit}</b>, because 100% always lines up with the whole.</p>${V.dnl(
        { label: 'Percent', values: top },
        { label, values: vals },
        { aria: `Double number line: 0 to 100 percent above 0 to ${whole} ${ctx.unit}` },
      )}`,
      feedback: {
        correct: `Correct. Once ${step}% is ${per}, every tick is a multiple of ${per}, and 100% is the whole: ${whole}.`,
        wrong(a, d) {
          const last = blankIdx.indexOf(n);
          const w = parseNum(a[last]);
          if (d.wrong.length === 1 && d.wrong[0] === last && w === part) return `${part} is the ${p}% part. The whole at 100% is ${n} × ${per}.`;
          if (d.wrong.length === 1 && d.wrong[0] === last) return `100% is ${n} jumps of ${step}%, so the whole is ${n} × ${per}.`;
          return `Find one ${step}% jump first: ${part} ÷ ${givenIdx} = ${per}. Then count up by ${per} to each blank.`;
        },
      },
    };
  });

  // ---------- Equation: p% of what number is the part? (num; hard = non-benchmark percents) ----------
  G.define('p5_whole', (r, o) => {
    const hard = !!o.hard;
    const p = hard ? r.pick([5, 8, 12, 15, 35, 45, 60, 65, 85]) : r.pick([10, 20, 25, 30, 40, 50, 75, 80]);
    const whole = hard ? wholeFor(r, p, 40, 500) : wholeFor(r, p, 20, 200);
    const part = partOf(p, whole);
    const ctx = r.pick(CTX);
    const fr = FRAC[p];
    const [fn, fd] = fr ? fr.split('/').map(Number) : [0, 0];
    const d = dec(p);
    return {
      type: 'num',
      skill: 'find-whole',
      lesson: '4-5',
      title: hard ? 'Find the whole (harder percents)' : 'Find the whole',
      prompt: `<p>${hl(part + ' ' + ctx.unit)} are ${ctx.verb}. That is ${hl(p + '%')} of all the ${ctx.thing}.</p><p>How many ${ctx.thing} are there in all?</p><p class="muted">Think: ${p}% of what number is ${part}?</p>`,
      unit: ctx.unit,
      answer: whole,
      hints: [
        'You know the part and the percent. The whole (100%) is missing. To find the whole, divide the part by the percent.',
        `${p}% = ${d}${fr ? ` = ${fr}` : ''}. Divide: ${part} ÷ ${d}.${fr ? ` Or think in fractions: ${part} is ${fr} of the whole, so the whole is ${part} ÷ ${fn} × ${fd}.` : ''}`,
        `${part} ÷ ${d} = ? Check by multiplying back: ${p}% of your answer should be ${part}.`,
      ],
      solution: `<p>${p}% of the whole is ${part}. Whole = part ÷ percent: ${part} ÷ ${d} = <b>${whole} ${ctx.unit}</b>. Check: ${d} × ${whole} = ${part}. Dividing by the percent undoes the multiplying that made the part.</p>`,
      feedback: {
        correct: `Correct. ${part} ÷ ${d} = ${whole}, and ${p}% of ${whole} is ${part}.`,
        wrong(a, dd) {
          const v = dd.value;
          if (v == null) return `Write ${p}% as a decimal (${d}) and divide the part by it.`;
          if (Math.abs(v - partOf(p, part)) < 1e-9) return `You found ${p}% of ${part}, which is a smaller part. The whole is bigger than ${part}: divide, do not multiply.`;
          if (Math.abs(v - part * p) < 1e-9) return `You multiplied by ${p}. The whole is the part divided by the percent: ${part} ÷ ${d}.`;
          if (Math.abs(v - part / p) < 0.006) return `${round(part / p, 2)} is ${part} ÷ ${p}, which is only 1% of the whole. Divide by ${d}, or multiply ${round(part / p, 2)} by 100.`;
          if (v === part + p) return `Adding the percent to the part does not give the whole. ${p}% means ${part} is ${d} of the whole.`;
          if (v < part) return `The whole must be bigger than the part (${part}), because ${p}% is less than 100%.`;
          return `Divide the part by the percent: ${part} ÷ ${d}. Then check: ${p}% of your answer should be ${part}.`;
        },
      },
    };
  });

  // ---------- Error: multiplied the part by the percent instead of dividing (error) ----------
  G.define('p5_errorDivide', (r) => {
    const name = r.pick(NAMES);
    const p = r.pick([20, 25, 30, 40, 50, 60, 75, 80]);
    const whole = wholeFor(r, p, 20, 240);
    const part = partOf(p, whole);
    const d = dec(p);
    const wrongAns = partOf(p, part);
    const onePct = round(part / p, 2);
    const ctx = r.pick(CTX);
    const opts = [
      { html: `${name} multiplied. ${part} is the <b>part</b>, and the whole is unknown. To find the whole, divide the part by the percent: ${part} ÷ ${d}.`, ok: true },
      { html: `${name} should have divided ${part} by ${p}.`, why: `${part} ÷ ${p} = ${onePct} is only 1% of the whole. Dividing by ${p}% means dividing by ${d} (or multiplying ${onePct} by 100).` },
      { html: `${name} should have multiplied ${part} by ${p} instead of ${d}.`, why: `${part} × ${p} = ${part * p} is far too big. Multiplying finds a percent <b>of</b> ${part}. Here ${part} is the part, so divide.` },
      { html: `There is no mistake. The whole is ${wrongAns}.`, why: `A whole is bigger than its part. ${wrongAns} is smaller than ${part}, so it cannot be the whole.` },
    ];
    const sh = shuffleOptions(r, opts, 0);
    return {
      type: 'error',
      skill: 'find-whole',
      lesson: '4-5',
      title: 'Find the mistake',
      prompt: `<p>${hl(part + ' ' + ctx.unit)} are ${ctx.verb}, which is ${hl(p + '%')} of all the ${ctx.thing}. ${name} tries to find the total number of ${ctx.unit}. What is the mistake?</p>`,
      work: `${p}% = ${d} &nbsp;&nbsp; ${part} × ${d} = ${wrongAns} &nbsp;&nbsp; "There are ${wrongAns} ${ctx.unit} in all."`,
      options: sh.options,
      answer: sh.answer,
      fix: { label: `Total ${ctx.unit}:`, answer: whole },
      hints: [
        `Is ${part} the part or the whole? ${p}% of the total is ${part}, so ${part} is the part.`,
        `When the part is known and the whole is missing, divide: part ÷ percent. ${name} multiplied instead.`,
        `${part} ÷ ${d} = ? Check: ${d} × your answer should equal ${part}.`,
      ],
      solution: `<p>${part} is the <b>part</b> (${p}% of the whole). Multiplying ${part} × ${d} finds ${p}% of ${part}, which makes a smaller number, but the whole must be <b>bigger</b> than its part. Divide instead: ${part} ÷ ${d} = <b>${whole} ${ctx.unit}</b>. Check: ${p}% of ${whole} = ${part}.</p>`,
      feedback: {
        correct: `Correct. Part ÷ percent = whole: ${part} ÷ ${d} = ${whole}.`,
        wrong(a, dd) {
          if (!dd.mistakeOk) return `Ask: is ${part} the part or the whole? A whole must be bigger than its part, and ${wrongAns} is smaller than ${part}.`;
          const v = parseNum(a.fix);
          if (v != null && Math.abs(v - wrongAns) < 1e-9) return `${wrongAns} is ${name}'s answer, and it is too small. Divide: ${part} ÷ ${d}.`;
          if (v != null && Math.abs(v - part / p) < 0.006) return `${onePct} is ${part} ÷ ${p}, only 1% of the whole. Divide by ${d} instead.`;
          return `You found the mistake. Now divide: ${part} ÷ ${d}.`;
        },
      },
    };
  });

  // ---------- Word problems: class size, goal, original price, full tank (num) ----------
  G.define('p5_wordWhole', (r) => {
    const name = r.pick(NAMES);
    const kind = r.pick(['class', 'goal', 'sale', 'tank']);
    let p, whole, given, prompt, wholeName, isMoney, q, intro;
    if (kind === 'class') {
      p = r.pick([20, 25, 30, 40, 50, 60, 75, 80]);
      whole = wholeFor(r, p, 20, 40);
      given = partOf(p, whole);
      const act = r.pick(['walk to school', 'play an instrument', 'have a pet', 'ride the bus']);
      prompt = `<p>In ${name}'s class, ${hl(p + '%')} of the students ${act}. That is ${hl(given + ' students')}.</p><p>How many students are in the class?</p>`;
      wholeName = 'whole class';
      isMoney = false;
      q = p;
      intro = `${given} students is ${p}% of the class.`;
    } else if (kind === 'goal') {
      p = r.pick([10, 20, 25, 30, 40, 50, 60, 75, 80]);
      whole = wholeFor(r, p, 100, 1000);
      given = partOf(p, whole);
      const fund = r.pick(['Lantern Fund', 'Festival Food Drive', 'Harbor Library Drive', 'Sixth-Grade Trip Fund']);
      prompt = `<p>The ${fund} has collected ${hl(money(given))} so far. That is ${hl(p + '%')} of its goal.</p><p>What is the goal?</p>`;
      wholeName = 'goal';
      isMoney = true;
      q = p;
      intro = `${money(given)} is ${p}% of the goal.`;
    } else if (kind === 'sale') {
      p = r.pick([20, 25, 40, 50, 60, 75]);
      whole = 20 * r.int(1, 6);
      given = partOf(100 - p, whole);
      const item = r.pick(ITEMS);
      prompt = `<p>A ${item} is on sale for ${hl(p + '% off')}. ${name} pays ${hl(money(given))}.</p><p>What was the original price?</p>`;
      wholeName = 'original price';
      isMoney = true;
      q = 100 - p;
      intro = `The sale price is what is left after ${p}% is taken off: 100% − ${p}% = ${q}% of the original price. So ${money(given)} is ${q}% of the original price.`;
    } else {
      p = r.pick([10, 20, 25, 30, 40, 50, 60, 75, 80]);
      whole = wholeFor(r, p, 40, 400);
      given = partOf(p, whole);
      prompt = `<p>The reservoir gauge reads ${hl(p + '% full')}. There are ${hl(given + ' gallons')} of oil in the tank right now.</p><p>How many gallons does the tank hold when it is full?</p>`;
      wholeName = 'full tank';
      isMoney = false;
      q = p;
      intro = `${given} gallons is ${p}% of the full tank.`;
    }
    const d = dec(q);
    const gStr = isMoney ? money(given) : String(given);
    const wStr = isMoney ? money(whole) : String(whole);
    return {
      type: 'num',
      skill: 'percent-problems',
      lesson: '4-5',
      title: kind === 'sale' ? 'Find the original price' : kind === 'goal' ? 'Find the goal' : kind === 'tank' ? 'Find the full tank' : 'Find the class size',
      prompt,
      unit: kind === 'class' ? 'students' : kind === 'tank' ? 'gallons' : undefined,
      answer: whole,
      tolerance: isMoney ? 0.006 : 0.001,
      hints: [
        kind === 'sale'
          ? `${name} paid the price <b>after</b> the discount. The sale price is 100% − ${p}% = ${q}% of the original price.`
          : `${gStr} is the part. The ${wholeName} is 100%, and it is unknown. Divide the part by the percent.`,
        `${q}% = ${d}. Divide: ${gStr} ÷ ${d}.`,
        `${gStr} ÷ ${d} = ? Check: ${q}% of your answer should be ${gStr}.`,
      ],
      solution: `<p>${intro} Whole = part ÷ percent: ${gStr} ÷ ${d} = <b>${wStr}</b>. Check: ${d} × ${whole} = ${gStr}. ${kind === 'sale' ? 'Dividing by the discount percent would be wrong, because the sale price is not the discount.' : 'Dividing by the percent gives the 100% amount.'}</p>`,
      feedback: {
        correct: `Correct. ${gStr} ÷ ${d} = ${wStr}.`,
        wrong(a, dd) {
          const v = dd.value;
          if (v == null) return `Write ${q}% as ${d} and divide ${gStr} by it.`;
          if (Math.abs(v - partOf(q, given)) < 0.006) return `You found ${q}% of ${gStr}, a smaller amount. The ${wholeName} is bigger than ${gStr}: divide, do not multiply.`;
          if (kind === 'sale' && Math.abs(v - given / (p / 100)) < 0.006) return `You divided by the discount, ${p}%. ${name} paid ${100 - p}% of the price, so divide by ${d}.`;
          if (kind === 'sale' && Math.abs(v - (given + partOf(p, given))) < 0.006) return `You added ${p}% of the sale price. The discount was ${p}% of the <b>original</b> price, so divide ${gStr} by ${d} instead.`;
          if (Math.abs(v - given * q) < 0.006) return `You multiplied by ${q}. The whole is part ÷ percent: ${gStr} ÷ ${d}.`;
          if (v < given) return `The ${wholeName} must be bigger than ${gStr}, because ${gStr} is only ${q}% of it.`;
          return `Divide the part by the percent: ${gStr} ÷ ${d}. Check: ${q}% of your answer should be ${gStr}.`;
        },
      },
    };
  });

  // ---------- Sort problems: find the part vs. find the whole (sort) ----------
  G.define('p5_sortPartWhole', (r) => {
    const [n1, n2, n3] = r.pickN(NAMES, 3);
    const partPool = [
      `What is ${r.pick([20, 25, 50, 75])}% of ${r.pick([40, 60, 80, 120])}?`,
      `A ${money(4 * r.int(6, 20))} ${r.pick(ITEMS)} is ${r.pick([10, 20, 25, 30])}% off. How much is the discount?`,
      `${r.pick([15, 30, 45])}% of the ${10 * r.int(4, 12)} lanterns are red. How many lanterns are red?`,
      `Sales tax is ${r.pick([5, 6, 8])}% on a ${money(10 * r.int(2, 9))} bill. How much is the tax?`,
      `${n1} answered ${r.pick([80, 90, 95])}% of the ${r.pick([20, 40, 60])} questions correctly. How many questions is that?`,
    ];
    const wholePool = [
      `${r.int(6, 30)} is ${r.pick([20, 25, 50])}% of what number?`,
      `${r.pick([20, 25, 40, 50])}% of the class is ${r.int(5, 12)} students. How many students are in the class?`,
      `The tank is ${r.pick([25, 30, 40, 60])}% full with ${r.int(10, 60)} gallons. How many gallons does the full tank hold?`,
      `${money(4 * r.int(3, 15))} is ${r.pick([10, 20, 25, 40])}% of the goal. What is the goal?`,
      `${n2} has read ${r.int(20, 90)} pages, which is ${r.pick([25, 40, 50, 75])}% of the book. How many pages are in the book?`,
      `${n3} scored ${r.int(6, 18)} points, which was ${r.pick([20, 25, 30, 40])}% of the team's points. How many points did the team score?`,
    ];
    const items = r.shuffle(r.pickN(partPool, 3).map((html) => ({ html, bin: 0 })).concat(r.pickN(wholePool, 3).map((html) => ({ html, bin: 1 }))));
    return {
      type: 'sort',
      skill: 'part-vs-whole',
      lesson: '4-5',
      title: 'Part or whole?',
      prompt: '<p>Before solving a percent problem, decide what is missing. Sort each problem: does it ask you to find the <b>part</b> or the <b>whole</b>?</p><p class="muted">You do not need to solve them.</p>',
      bins: ['Find the part', 'Find the whole'],
      items,
      hints: [
        'Ask one question about each card: is the total (100%) given, or is the total what you need to find?',
        'If the percent and the <b>whole</b> are given, you find the part: multiply the whole by the percent.',
        'If the percent and a <b>part</b> are given, you find the whole: divide the part by the percent. Words like "of what number," "the goal," "the full tank," and "the whole class" point to a missing whole.',
      ],
      solution: `<p><b>Find the part</b> (the total is given): ${items
        .filter((it) => it.bin === 0)
        .map((it) => `"${it.html}"`)
        .join(' · ')}</p><p><b>Find the whole</b> (the total is missing): ${items
        .filter((it) => it.bin === 1)
        .map((it) => `"${it.html}"`)
        .join(' · ')}</p><p>Finding a part means multiplying by the percent. Finding the whole means dividing by the percent.</p>`,
      feedback: {
        correct: 'Correct. Spotting the missing piece tells you whether to multiply or divide.',
        wrong(a, d) {
          const it = items[d.wrong[0]];
          return `Look again at "${it.html}" ${it.bin === 0 ? 'The total is given, and the percent is taken of it. That asks for the part.' : 'The total is missing. The amount given is only a percent of it. That asks for the whole.'}`;
        },
      },
    };
  });

  // ---------- Who found the whole correctly? (who) ----------
  G.define('p5_whoWhole', (r) => {
    const [a, b, c] = r.pickN(NAMES, 3);
    const p = r.pick([20, 25, 30, 40, 50, 60, 75, 80]);
    const whole = wholeFor(r, p, 20, 200);
    const part = partOf(p, whole);
    const d = dec(p);
    const onePct = round(part / p, 2);
    const ctx = r.pick(CTX);
    const method = r.pick(p % 10 === 0 ? ['equation', 'tenPercent', 'onePercent'] : ['equation', 'onePercent']);
    const tens = p / 10;
    const aWork =
      method === 'tenPercent'
        ? `"${p}% is ${tens} tens. ${part} ÷ ${tens} = ${part / tens}, so 10% is ${part / tens}. Then 100% is 10 × ${part / tens} = <b>${whole}</b>."`
        : method === 'onePercent'
          ? `"${part} ÷ ${p} = ${onePct}, so 1% is ${onePct}. Then 100% is ${onePct} × 100 = <b>${whole}</b>."`
          : `"${p}% = ${d}. ${part} ÷ ${d} = <b>${whole}</b>. Check: ${d} × ${whole} = ${part}."`;
    const opts = [
      { title: a, html: aWork, ok: true },
      { title: b, html: `"${p}% = ${d}. ${part} × ${d} = ${partOf(p, part)}. There are <b>${partOf(p, part)}</b> ${ctx.unit} in all."`, why: `${b} multiplied, which finds ${p}% of ${part}. The whole must be bigger than the part ${part}, so divide instead.` },
      { title: c, html: `"${part} ÷ ${p} = ${onePct}. There are <b>${onePct}</b> ${ctx.unit} in all."`, why: `${c} divided by ${p} instead of by ${p}% (${d}). ${onePct} is only 1% of the whole; multiply it by 100.` },
    ];
    const sh = shuffleOptions(r, opts, 0);
    return {
      type: 'who',
      skill: 'find-whole',
      lesson: '4-5',
      title: 'Who found the whole?',
      prompt: `<p>${hl(part + ' ' + ctx.unit)} are ${ctx.verb}. That is ${hl(p + '%')} of all the ${ctx.thing}. Three students find the total. Who is correct?</p>`,
      options: sh.options,
      answer: sh.answer,
      layout: 'cards',
      hints: [
        `${part} is the part. The total (100%) is unknown and must be bigger than ${part}. Which answers are bigger than ${part}?`,
        `A quick check: ${p}% of the correct total should equal ${part}.`,
        `${d} × ${whole} = ${part}, so the total is ${whole}. Dividing the part by the percent (or scaling 1% or 10% up to 100%) gets there.`,
      ],
      solution: `<p><b>${a}</b> is correct: the whole is <b>${whole}</b>, and ${p}% of ${whole} = ${part}. ${b} multiplied, which finds a part of ${part}, not the whole. ${c} divided by ${p} instead of ${d}, which gives 1% of the whole, not 100%.</p>`,
      feedback: { correct: `Correct. The whole is ${whole}, and ${p}% of ${whole} is ${part}.` },
    };
  });

  // ---------- Explain how to find the whole from a percent bar (cr) ----------
  G.define('p5_barWhole', (r) => {
    const k = r.int(2, 8);
    const m = r.int(3, 20);
    const part = k * m;
    const whole = 10 * m;
    const p = k * 10;
    const ctx = r.pick(CTX);
    const checkOpts = [
      { html: `${whole} ${ctx.unit}`, ok: true },
      { html: `${part * 10} ${ctx.unit}` },
      { html: `${round(part * (p / 100), 2)} ${ctx.unit}` },
      { html: `${(10 - k) * m} ${ctx.unit}` },
    ];
    const sh = shuffleOptions(r, checkOpts, 0);
    return {
      type: 'cr',
      skill: 'part-vs-whole',
      lesson: '4-5',
      title: 'Explain how to find the whole',
      prompt: `<p>The percent bar stands for all the ${ctx.thing}. It has 10 equal sections, and ${hl(k)} sections are shaded. The shaded part is ${hl(part + ' ' + ctx.unit)}, which is ${hl(p + '%')} of the whole.</p>${V.bar({ parts: 10, shaded: k, labels: BAR_LABELS, aria: `Percent bar with ${k} of 10 sections shaded, ${p} percent` })}<p>Explain how to find the whole (100%). Give two ways if you can: one using the bar, and one using division.</p>`,
      starters: ['Each shaded section is 10%, so one section is worth…', 'The whole bar has 10 sections, so the whole is…', `Another way: ${part} is ${p}% of the whole, so I divide…`, 'Both ways give…'],
      minWords: 12,
      check: { prompt: `How many ${ctx.unit} are there in all?`, options: sh.options, answer: sh.answer },
      hints: [
        `The ${k} shaded sections share ${part} equally. Find what one section (10%) is worth.`,
        `${part} ÷ ${k} = ${m}. One section is ${m} ${ctx.unit}, and the whole bar has 10 sections.`,
        `10 × ${m} = the whole. Division gives the same answer: ${part} ÷ ${dec(p)}.`,
      ],
      solution: `<p><b>With the bar:</b> ${k} sections make ${part}, so one section (10%) is ${part} ÷ ${k} = ${m}. The whole bar is 10 sections: 10 × ${m} = <b>${whole} ${ctx.unit}</b>. <b>With division:</b> ${p}% = ${dec(p)}, and ${part} ÷ ${dec(p)} = <b>${whole}</b>. Both ways agree, because both undo "take ${p}% of the whole."</p>`,
      feedback: {
        correct: 'Correct. One section, then ten sections, or part ÷ percent: both reach the whole.',
        wrong(a, d) {
          if (!d.wroteEnough) return 'Write a little more. Say what one section is worth, how many sections make the whole, and what division you could use instead.';
          return `One section is ${part} ÷ ${k} = ${m}, and the whole bar has 10 sections. The whole is 10 × ${m}.`;
        },
      },
    };
  });
})(typeof window !== 'undefined' ? window : globalThis);

/* js/units/u4/gen-cave.js */
/* The Undercity — optional challenge content for Unit 4 (harder, mixed-skill percent problems). */
(function (root) {
  'use strict';
  const RX = root.RX;
  const { G, V, shuffleOptions, NAMES, round, money, parseNum } = RX;
  const hl = V.hl;

  const ITEMS = ['lantern', 'backpack', 'skateboard', 'jacket', 'board game', 'pair of headphones', 'sketchbook set', 'telescope'];
  const dec = (p) => String(round(p / 100, 2));
  const partOf = (p, n) => round((p / 100) * n, 2);
  // Whole n in [lo, hi] such that p% of n is a whole number.
  const wholeFor = (r, p, lo, hi) => {
    const m = 100 / RX.gcd(p, 100);
    return m * r.int(Math.ceil(lo / m), Math.floor(hi / m));
  };
  const nearTo = (a, b, tol) => a != null && Math.abs(a - b) < (tol || 0.006);

  // ---------- Discount, then tax on the sale price (num, money) ----------
  G.define('pc_twoStepDiscount', (r) => {
    const name = r.pick(NAMES);
    const item = r.pick(ITEMS);
    const price = 20 * r.int(1, 7);
    const d = r.pick([10, 15, 20, 25, 30, 40, 50]);
    const t = r.pick([5, 6, 8, 10]);
    const disc = partOf(d, price);
    const sale = round(price - disc, 2);
    const tax = partOf(t, sale);
    const total = round(sale + tax, 2);
    return {
      type: 'num',
      skill: 'percent-problems',
      lesson: '4-4',
      title: 'Challenge: discount, then tax',
      xp: 20,
      prompt: `<p>A ${item} costs ${hl(money(price))}. It is on sale for ${hl(d + '% off')}. Sales tax of ${hl(t + '%')} is added to the <b>sale price</b>.</p><p>How much does ${name} pay in total?</p>`,
      answer: total,
      tolerance: 0.006,
      hints: [
        'Two steps. First take the discount off the price. Then add tax to the sale price, not to the original price.',
        `Discount: ${d}% of ${money(price)} = ${dec(d)} × ${price} = ${money(disc)}. Sale price: ${money(price)} − ${money(disc)} = ${money(sale)}.`,
        `Tax: ${t}% of ${money(sale)} = ${dec(t)} × ${sale} = ${money(tax)}. Add it to ${money(sale)}.`,
      ],
      solution: `<p><b>Step 1, discount:</b> ${d}% of ${money(price)} = ${money(disc)}, so the sale price is ${money(price)} − ${money(disc)} = <b>${money(sale)}</b>. <b>Step 2, tax:</b> ${t}% of ${money(sale)} = ${money(tax)}. Total: ${money(sale)} + ${money(tax)} = <b>${money(total)}</b>. The tax is a percent of the sale price, so the two percents cannot simply be subtracted.</p>`,
      feedback: {
        correct: `Correct. ${money(sale)} after the discount, plus ${money(tax)} tax, is ${money(total)}.`,
        wrong(a, dd) {
          const v = dd.value;
          if (v == null) return `Find the sale price first (${d}% off), then add ${t}% of the sale price.`;
          if (nearTo(v, sale)) return `${money(sale)} is the sale price before tax. Add ${t}% of ${money(sale)}.`;
          if (nearTo(v, price * (1 - (d - t) / 100))) return `You took ${d}% − ${t}% = ${d - t}% off the original price. The tax is ${t}% of the <b>sale price</b> (${money(sale)}), which is a smaller amount.`;
          if (nearTo(v, price * (1 + t / 100))) return `You added tax but skipped the discount. Take ${d}% off first: ${money(sale)}.`;
          if (nearTo(v, disc)) return `${money(disc)} is the discount, not the price paid. Subtract it from ${money(price)}, then add tax.`;
          if (nearTo(v, price - disc - tax)) return `Tax is added, not subtracted. ${money(sale)} + ${money(tax)}.`;
          return `Sale price: ${money(price)} − ${money(disc)} = ${money(sale)}. Then add ${t}% of ${money(sale)}.`;
        },
      },
    };
  });

  // ---------- Percent greater than 100% on a tape diagram (tape) ----------
  G.define('pc_percentChangeTape', (r) => {
    const step = r.pick([20, 25]);
    const baseBoxes = 100 / step;
    const extra = step === 25 ? r.pick([1, 2, 3]) : r.pick([1, 2, 3, 4]);
    const pct = 100 + extra * step;
    const newBoxes = baseBoxes + extra;
    const m = r.int(4, 15);
    const base = baseBoxes * m;
    const now = newBoxes * m;
    const ctx = r.pick([
      { thing: 'lanterns hung on the Spire', then: 'last year', now: 'this year', unit: 'lanterns' },
      { thing: 'visitors at the Undercity market', then: 'last night', now: 'tonight', unit: 'visitors' },
      { thing: 'oil jars delivered', then: 'last week', now: 'this week', unit: 'jars' },
      { thing: 'glass panes in the kiln', then: 'in the morning', now: 'in the evening', unit: 'panes' },
    ]);
    const giveBase = r.chance(0.5);
    const rows = giveBase
      ? [
          { label: `${ctx.then} (100%)`, boxes: baseBoxes },
          { label: `${ctx.now} (${pct}%)`, boxes: newBoxes },
        ]
      : [
          { label: `${ctx.now} (${pct}%)`, boxes: newBoxes },
          { label: `${ctx.then} (100%)`, boxes: baseBoxes },
        ];
    const given = giveBase ? base : now;
    const target = giveBase ? now : base;
    const targetLabel = giveBase ? `${ctx.now}, in ${ctx.unit}` : `${ctx.then}, in ${ctx.unit}`;
    const givenBoxes = giveBase ? baseBoxes : newBoxes;
    const targetBoxes = giveBase ? newBoxes : baseBoxes;
    return {
      type: 'tape',
      skill: 'over-100',
      lesson: '4-1',
      title: 'Challenge: more than 100%',
      xp: 20,
      prompt: `<p>The number of ${ctx.thing} ${ctx.now} is ${hl(pct + '%')} of the number ${ctx.then}. ${giveBase ? `There were ${hl(given + ' ' + ctx.unit)} ${ctx.then}.` : `There are ${hl(given + ' ' + ctx.unit)} ${ctx.now}.`}</p><p>Every box is ${step}%. Find the value of one box, then the number of ${ctx.unit} ${giveBase ? ctx.now : ctx.then}.</p>`,
      rows,
      fields: [
        { key: 'box', label: `One box (${step}%)`, answer: m },
        { key: 'target', label: targetLabel, answer: target },
      ],
      given: { rowA: given },
      hints: [
        `${pct}% is more than one whole: 100% is ${baseBoxes} boxes and ${pct}% is ${newBoxes} boxes. The row you know has ${givenBoxes} boxes worth ${given}.`,
        `${given} ÷ ${givenBoxes} = ${m}. One box (${step}%) is ${m} ${ctx.unit}.`,
        `The other row has ${targetBoxes} boxes. ${targetBoxes} × ${m} = ?`,
      ],
      solution: `<p>${pct}% means ${newBoxes} boxes of ${step}%, while 100% is ${baseBoxes} boxes. The known row (${given}) has ${givenBoxes} boxes, so one box is ${given} ÷ ${givenBoxes} = <b>${m}</b>. The other row is ${targetBoxes} × ${m} = <b>${target} ${ctx.unit}</b>. A percent over 100 means more than the whole, so the ${pct}% row is the longer one.</p>${V.tape(
        rows.map((row) => ({ label: row.label, boxes: row.boxes, value: m, total: row.boxes * m })),
        { boxW: 46, labelW: 110, aria: `Tape diagram: ${baseBoxes} boxes of ${m} make ${base}; ${newBoxes} boxes of ${m} make ${now}` },
      )}`,
      feedback: {
        correct: `Correct. One box is ${m}, so ${ctx.then} = ${base} and ${ctx.now} = ${now}.`,
        wrong(a, d) {
          const box = parseNum(a.box);
          const tv = parseNum(a.target);
          if (d.wrong.includes('box')) {
            if (box === round(given / targetBoxes, 2)) return `You divided ${given} by ${targetBoxes}, but the row worth ${given} has ${givenBoxes} boxes.`;
            return `Use the row you know: ${givenBoxes} equal boxes make ${given}. Divide to find one box.`;
          }
          if (tv === given) return `${given} is the row you were given. Multiply one box (${m}) by the ${targetBoxes} boxes in the other row.`;
          if (giveBase && tv === partOf(pct - 100, base)) return `${partOf(pct - 100, base)} is only the extra ${pct - 100}%. ${pct}% is the whole ${base} plus that extra.`;
          if (!giveBase && tv === partOf(pct, now)) return `You found ${pct}% of ${now}, which goes the wrong way. ${now} is already the bigger ${pct}% amount; 100% is smaller.`;
          return `Your box value is right. The other row has ${targetBoxes} boxes, so multiply ${m} × ${targetBoxes}.`;
        },
      },
    };
  });

  // ---------- Order four mixed percent computations by their values (seq) ----------
  G.define('pc_threeWayOrder', (r) => {
    const makeItems = () => {
      const pA = r.pick([20, 25, 30, 40, 50, 60, 75]);
      const nA = wholeFor(r, pA, 20, 120);
      const fr = r.pick([
        [1, 4],
        [3, 4],
        [2, 5],
        [3, 5],
        [1, 5],
        [3, 10],
        [7, 10],
      ]);
      const nF = fr[1] * r.int(3, 20);
      const pW = r.pick([20, 25, 40, 50]);
      const wholeW = wholeFor(r, pW, 20, 120);
      const partW = partOf(pW, wholeW);
      const pO = r.pick([110, 120, 125, 150, 175, 200]);
      const nO = wholeFor(r, pO - 100, 8, 60);
      return [
        { html: `<b>${pA}% of ${nA}</b>`, rate: partOf(pA, nA), text: `${pA}% of ${nA} = ${partOf(pA, nA)}` },
        { html: `<b>${V.frac(fr[0], fr[1])} of ${nF}</b>`, rate: (fr[0] * nF) / fr[1], text: `${fr[0]}/${fr[1]} of ${nF} = ${(fr[0] * nF) / fr[1]}` },
        { html: `<b>the whole, if ${partW} is ${pW}% of it</b>`, rate: wholeW, text: `${partW} ÷ ${dec(pW)} = ${wholeW}` },
        { html: `<b>${pO}% of ${nO}</b>`, rate: partOf(pO, nO), text: `${pO}% of ${nO} = ${partOf(pO, nO)}` },
      ];
    };
    let items = makeItems();
    for (let guard = 0; guard < 40 && new Set(items.map((i) => i.rate)).size < 4; guard++) items = makeItems();
    items = r.shuffle(items);
    const asc = r.chance(0.5);
    const order = items.map((_, i) => i).sort((x, y) => (asc ? items[x].rate - items[y].rate : items[y].rate - items[x].rate));
    return {
      type: 'seq',
      skill: 'compare-percents',
      lesson: '4-4',
      title: 'Challenge: order the amounts',
      xp: 20,
      prompt: `<p>Four lanterns in the Undercity are labeled with a calculation instead of a number. Work out each value, then order the lanterns from <b>${asc ? 'least' : 'greatest'}</b> (top) to <b>${asc ? 'greatest' : 'least'}</b> (bottom).</p>`,
      items: items.map((i) => ({ html: i.html, rate: i.rate })),
      order,
      hints: [
        'Each label hides a number. A percent or fraction <b>of</b> a number is a part (multiply). "The whole, if … is …% of it" is a missing whole (divide). A percent over 100 gives more than the number.',
        `Values: ${items
          .slice(0, 2)
          .map((i) => i.text)
          .join('; ')}.`,
        `Values: ${items
          .slice(2)
          .map((i) => i.text)
          .join('; ')}. Now order all four ${asc ? 'from least to greatest' : 'from greatest to least'}.`,
      ],
      solution: `<p>${items.map((i) => i.text).join('; ')}. In order (${asc ? 'least to greatest' : 'greatest to least'}): <b>${order.map((i) => items[i].rate).join(', ')}</b>. Finding a part multiplies, finding a whole divides, and a percent above 100% makes the number grow.</p>`,
      feedback: {
        correct: 'Correct. Once each label becomes a number, ordering is easy.',
        wrong() {
          return `Compute every value first: ${items.map((i) => i.text).join('; ')}. Then put the ${asc ? 'least' : 'greatest'} on top.`;
        },
      },
    };
  });

  // ---------- Part / percent / whole table with one missing cell per row (table) ----------
  G.define('pc_tableMissing', (r) => {
    const labels = r.pickN(['Lanterns lit', 'Tickets sold', 'Oil jars full', 'Seats taken', 'Pages read', 'Shots made'], 3);
    const pcts = r.pickN([5, 10, 15, 20, 25, 30, 40, 45, 50, 60, 75, 80], 3);
    const data = pcts.map((p, i) => {
      const whole = wholeFor(r, p, 20, 300);
      return { label: labels[i], p, whole, part: partOf(p, whole), missing: i };
    });
    const rows = [['Situation', 'Part', 'Percent', 'Whole']];
    const inputs = [];
    data.forEach((d, i) => {
      const id = ['w', 'p', 'c'][d.missing] + i;
      if (d.missing === 0) {
        rows.push([d.label, String(d.part), `${d.p}%`, `__IN:${id}__`]);
        inputs.push({ id, answer: d.whole });
      } else if (d.missing === 1) {
        rows.push([d.label, `__IN:${id}__`, `${d.p}%`, String(d.whole)]);
        inputs.push({ id, answer: d.part });
      } else {
        rows.push([d.label, String(d.part), `__IN:${id}__`, String(d.whole)]);
        inputs.push({ id, answer: d.p });
      }
    });
    const [a, b, c] = data;
    return {
      type: 'table',
      skill: 'part-vs-whole',
      lesson: '4-5',
      title: 'Challenge: complete the table',
      xp: 20,
      prompt: `<p>Each row of the Undercity ledger is missing one value. <b>${a.label}:</b> ${a.part} is ${a.p}% of the whole. <b>${b.label}:</b> find ${b.p}% of ${b.whole}. <b>${c.label}:</b> ${c.part} out of ${c.whole}. Complete the table. Write the percent without the % sign.</p>`,
      rows,
      inputs,
      header: true,
      hints: [
        'Three relationships: part = percent × whole; whole = part ÷ percent; percent = part ÷ whole, written as a number out of 100.',
        `Row 1: ${a.part} ÷ ${dec(a.p)} = ${a.whole}. Row 2: ${dec(b.p)} × ${b.whole} = ${b.part}.`,
        `Row 3: ${c.part} out of ${c.whole}. ${c.part} ÷ ${c.whole} = ${dec(c.p)}, which is ${c.p} hundredths. Write it as a percent.`,
      ],
      solution: `<p><b>${a.label}:</b> the whole is ${a.part} ÷ ${dec(a.p)} = <b>${a.whole}</b>. <b>${b.label}:</b> the part is ${dec(b.p)} × ${b.whole} = <b>${b.part}</b>. <b>${c.label}:</b> the percent is ${c.part} ÷ ${c.whole} = ${dec(c.p)} = <b>${c.p}%</b>. The same relationship, part = percent × whole, solves every row once you know which piece is missing.</p>`,
      feedback: {
        correct: 'Correct. One relationship, three different missing pieces.',
        wrong(ans, d) {
          const bad = d.wrong[0];
          const i = Number(bad.slice(1));
          const row = data[i];
          const v = parseNum(ans[bad]);
          if (bad[0] === 'w') {
            if (nearTo(v, partOf(row.p, row.part))) return `${row.label}: you multiplied, which finds a part of ${row.part}. The whole is bigger: ${row.part} ÷ ${dec(row.p)}.`;
            return `${row.label}: the part (${row.part}) and percent (${row.p}%) are known. Whole = part ÷ percent.`;
          }
          if (bad[0] === 'p') {
            if (nearTo(v, row.whole / (row.p / 100))) return `${row.label}: you divided, which makes a bigger number. The whole (${row.whole}) is known, so the part is ${row.p}% of it: multiply by ${dec(row.p)}.`;
            return `${row.label}: the whole (${row.whole}) is known. Part = ${dec(row.p)} × ${row.whole}.`;
          }
          if (nearTo(v, round(row.part / row.whole, 2))) return `${row.label}: ${round(row.part / row.whole, 2)} is the decimal. A percent is out of 100, so multiply by 100.`;
          if (nearTo(v, row.whole - row.part)) return `${row.label}: ${row.whole - row.part} is how many are left, not a percent. Find ${row.part} out of ${row.whole} as a number out of 100.`;
          return `${row.label}: percent = part ÷ whole = ${row.part} ÷ ${row.whole}, then write the decimal as hundredths.`;
        },
      },
    };
  });

  // ---------- Double number line with two unknowns: another percent and the whole (dnl) ----------
  G.define('pc_wholeFromTwo', (r) => {
    const whole = 20 * r.int(2, 15);
    const [a, b] = r.pickN([10, 20, 25, 30, 40, 50, 60, 75], 2).sort((x, y) => x - y);
    const partA = partOf(a, whole);
    const partB = partOf(b, whole);
    const onePct = whole / 100;
    const ctx = r.pick([
      { thing: 'ember crystals in the vault', unit: 'crystals' },
      { thing: 'steps on the Undercity stair', unit: 'steps' },
      { thing: 'lanterns in the tunnel', unit: 'lanterns' },
      { thing: 'coins in the Keeper’s chest', unit: 'coins' },
    ]);
    const label = ctx.unit.charAt(0).toUpperCase() + ctx.unit.slice(1);
    return {
      type: 'dnl',
      skill: 'find-whole',
      lesson: '4-5',
      title: 'Challenge: two unknowns',
      xp: 20,
      prompt: `<p>${hl(a + '%')} of the ${ctx.thing} glow. That is ${hl(partA + ' ' + ctx.unit)}.</p><p>The double number line is not evenly spaced. Find how many ${ctx.unit} are ${b}%, and find the whole (100%).</p>`,
      top: { label: 'Percent', values: ['0%', `${a}%`, `${b}%`, '100%'] },
      bottom: { label, values: [0, partA, null, null] },
      blanks: [
        { i: 2, answer: partB },
        { i: 3, answer: whole },
      ],
      hints: [
        `The ticks are not equal jumps, so use 1% (or 10%) as a stepping stone. ${a}% is ${partA}, so 1% is ${partA} ÷ ${a}.`,
        `1% = ${onePct}. The whole is 100 × ${onePct} = ${whole}.`,
        `${b}% = ${b} × ${onePct} = ? (Or ${dec(b)} × ${whole}.)`,
      ],
      solution: `<p>${a}% is ${partA}, so 1% is ${partA} ÷ ${a} = ${onePct}. Then 100% is 100 × ${onePct} = <b>${whole} ${ctx.unit}</b>, and ${b}% is ${b} × ${onePct} = <b>${partB}</b>. Check: ${dec(b)} × ${whole} = ${partB}. Going through 1% works even when the ticks are uneven.</p>${V.dnl(
        { label: 'Percent', values: ['0%', `${a}%`, `${b}%`, '100%'] },
        { label, values: [0, partA, partB, whole] },
        { aria: `Double number line: 0, ${a}, ${b}, 100 percent above 0, ${partA}, ${partB}, ${whole}` },
      )}`,
      feedback: {
        correct: `Correct. 1% is ${onePct}, so 100% is ${whole} and ${b}% is ${partB}.`,
        wrong(ans, d) {
          const vB = parseNum(ans[0]);
          const vW = parseNum(ans[1]);
          if (d.wrong.includes(1) && vW === partA) return `${partA} is the ${a}% amount. The whole is 100%: find 1% first (${partA} ÷ ${a}), then multiply by 100.`;
          if (d.wrong.includes(1) && nearTo(vW, partOf(a, partA))) return `You multiplied ${partA} by ${dec(a)}. The whole is bigger than ${partA}: divide by ${dec(a)} instead.`;
          if (!d.wrong.includes(1) && d.wrong.includes(0) && nearTo(vB, partA + (b - a))) return `You added ${b - a} to ${partA}, but percents and amounts do not grow by the same number. ${b}% is ${dec(b)} × ${whole}.`;
          if (!d.wrong.includes(1)) return `Your whole is right. ${b}% of ${whole} = ${dec(b)} × ${whole}.`;
          return `Find 1% first: ${partA} ÷ ${a} = ${onePct}. Then 100% is ${onePct} × 100, and ${b}% is ${onePct} × ${b}.`;
        },
      },
    };
  });

  // ---------- Error: divided the sale price by the discount percent (error) ----------
  G.define('pc_errorWhole', (r) => {
    const name = r.pick(NAMES);
    const item = r.pick(ITEMS);
    const d = r.pick([20, 25, 40, 60, 75]);
    const price = 20 * r.int(1, 8);
    const sale = partOf(100 - d, price);
    const wrongAns = round(sale / (d / 100), 2);
    const opts = [
      { html: `${name} divided by the discount percent. ${money(sale)} is the price <b>after</b> ${d}% was taken off, so it is ${100 - d}% of the original. Divide by ${dec(100 - d)}.`, ok: true },
      { html: `${name} should have multiplied ${money(sale)} by ${dec(d)}.`, why: `${dec(d)} × ${sale} = ${money(partOf(d, sale))} is ${d}% of the sale price. That is not the discount (which was ${d}% of the original) and not the original price.` },
      { html: `${name} should have added ${d}% of ${money(sale)} to ${money(sale)}.`, why: `The discount was ${d}% of the <b>original</b> price, not of the sale price, so adding ${d}% of ${money(sale)} gives too little: ${money(round(sale + partOf(d, sale), 2))}.` },
      { html: `There is no mistake. The original price was ${money(wrongAns)}.`, why: `Check it: ${d}% off ${money(wrongAns)} leaves ${money(round(wrongAns * (1 - d / 100), 2))}, not ${money(sale)}. The method is wrong.` },
    ];
    const sh = shuffleOptions(r, opts, 0);
    return {
      type: 'error',
      skill: 'percent-problems',
      lesson: '4-5',
      title: 'Challenge: find the mistake',
      xp: 20,
      prompt: `<p>A ${item} is ${hl(d + '% off')}. The sale price is ${hl(money(sale))}. ${name} tries to find the original price. What is the mistake?</p>`,
      work: `${d}% = ${dec(d)} &nbsp;&nbsp; ${sale} ÷ ${dec(d)} = ${wrongAns} &nbsp;&nbsp; "The original price was ${money(wrongAns)}."`,
      options: sh.options,
      answer: sh.answer,
      fix: { label: 'Original price ($):', answer: price },
      hints: [
        `What percent of the original price did the shopper pay? The discount took ${d}% off, so 100% − ${d}% is left.`,
        `The sale price is ${100 - d}% of the original. Whole = part ÷ percent: ${money(sale)} ÷ ${dec(100 - d)}.`,
        `${sale} ÷ ${dec(100 - d)} = ? Check: ${d}% off your answer should leave ${money(sale)}.`,
      ],
      solution: `<p>${name} treated the sale price as ${d}% of the original. But ${d}% was taken <b>off</b>, so the sale price is 100% − ${d}% = ${100 - d}% of the original. Original price = ${money(sale)} ÷ ${dec(100 - d)} = <b>${money(price)}</b>. Check: ${d}% of ${money(price)} is ${money(partOf(d, price))}, and ${money(price)} − ${money(partOf(d, price))} = ${money(sale)}.</p>`,
      feedback: {
        correct: `Correct. The sale price is ${100 - d}% of the original, so ${money(sale)} ÷ ${dec(100 - d)} = ${money(price)}.`,
        wrong(a, dd) {
          if (!dd.mistakeOk) return `Which percent of the original price is the sale price: ${d}% or ${100 - d}%? Check ${name}'s answer: ${d}% off ${money(wrongAns)} is not ${money(sale)}.`;
          const v = parseNum(a.fix);
          if (nearTo(v, wrongAns)) return `${money(wrongAns)} is ${name}'s wrong answer. Divide ${money(sale)} by ${dec(100 - d)}, the percent actually paid.`;
          if (nearTo(v, sale + partOf(d, sale))) return `You added ${d}% of the sale price. The discount was ${d}% of the original. Divide ${money(sale)} by ${dec(100 - d)}.`;
          return `You found the mistake. Now divide: ${money(sale)} ÷ ${dec(100 - d)}.`;
        },
      },
    };
  });

  // ---------- Two restaurants: bill plus tax and tip, which total is more? (tf) ----------
  G.define('pc_tipTax', (r) => {
    const [nameA, nameB, judge] = r.pickN(NAMES, 3);
    const [placeA, placeB] = r.pickN(['the Harbor Café', 'the Spire Grill', 'the Ember Kitchen', 'the Night Market Noodle Bar'], 2);
    const tax = r.pick([5, 6, 8]);
    let billA, billB, tipA, tipB, totA, totB;
    do {
      billA = 4 * r.int(5, 20);
      billB = 4 * r.int(5, 20);
      tipA = r.pick([10, 15, 20, 25]);
      tipB = r.pick([10, 15, 20, 25]);
      totA = round(billA * (1 + (tax + tipA) / 100), 2);
      totB = round(billB * (1 + (tax + tipB) / 100), 2);
    } while (tipA === tipB || billA === billB || (billA > billB) === (tipA > tipB) || Math.abs(totA - totB) < 0.5);
    const claimA = r.chance(0.5);
    const truth = claimA ? totA > totB : totB > totA;
    const pA = 100 + tax + tipA;
    const pB = 100 + tax + tipB;
    const reasons = r.shuffle([
      { html: `${nameA} pays ${pA}% of ${money(billA)} = ${money(totA)}. ${nameB} pays ${pB}% of ${money(billB)} = ${money(totB)}. ${money(totA)} is ${totA > totB ? 'more' : 'less'} than ${money(totB)}.`, correct: true },
      { html: `${nameA} pays ${pA}% of ${money(billA)} = ${money(totA)}. ${nameB} pays ${pB}% of ${money(billB)} = ${money(totB)}. ${money(totA)} is ${totA > totB ? 'less' : 'more'} than ${money(totB)}.`, correct: false },
      { html: `${tipA > tipB ? nameA : nameB} leaves the bigger tip percent, so ${tipA > tipB ? nameA : nameB} always pays more.`, correct: false },
      { html: `${billA > billB ? nameA : nameB} has the bigger bill, so the tax and tip cannot change who pays more.`, correct: false },
    ]);
    return {
      type: 'tf',
      skill: 'compare-percents',
      lesson: '4-4',
      title: 'Challenge: tax and tip',
      xp: 20,
      prompt: `<p>At ${placeA}, ${nameA}'s bill is ${hl(money(billA))} plus ${hl(tax + '% tax')} and a ${hl(tipA + '% tip')}. At ${placeB}, ${nameB}'s bill is ${hl(money(billB))} plus ${hl(tax + '% tax')} and a ${hl(tipB + '% tip')}. (Tax and tip are both percents of the bill.)</p><p>${judge} says: "<b>${claimA ? nameA : nameB}</b> pays more in total." Is ${judge} correct? Choose true or false and the best reason.</p>`,
      statement: `${claimA ? nameA : nameB} pays more in total`,
      answer: truth,
      reasons,
      labels: ['True', 'False'],
      hints: [
        'Tax and tip are both added to the bill. Together with the bill (100%), the total is more than 100% of the bill.',
        `${nameA}: 100% + ${tax}% + ${tipA}% = ${pA}% of ${money(billA)} = ${dec(pA)} × ${billA} = ${money(totA)}.`,
        `${nameB}: ${pB}% of ${money(billB)} = ${dec(pB)} × ${billB} = ${money(totB)}. Compare the two totals.`,
      ],
      solution: `<p>${nameA} pays ${pA}% of ${money(billA)} = <b>${money(totA)}</b>. ${nameB} pays ${pB}% of ${money(billB)} = <b>${money(totB)}</b>. ${totA > totB ? nameA : nameB} pays more, so ${judge}'s claim is <b>${truth ? 'true' : 'false'}</b>. A bigger bill or a bigger tip percent alone does not decide it; the totals do.</p>`,
      feedback: {
        correct: `Correct. ${money(totA)} versus ${money(totB)} settles it.`,
        wrong(a, d) {
          if (!d.valueOk) return `Find both totals. Each total is (100 + ${tax} + tip)% of the bill: ${money(totA)} and ${money(totB)}.`;
          return 'Your true/false is right, but the reason must compare the two totals in dollars.';
        },
      },
    };
  });

  // ---------- Survey: find the percent given the part and the whole (who) ----------
  G.define('pc_whoSurvey', (r) => {
    const [a, b, c] = r.pickN(NAMES, 3);
    const whole = r.pick([20, 25, 40, 50, 200, 300, 400]);
    const stepFor = { 20: 1, 25: 1, 40: 2, 50: 1, 200: 2, 300: 3, 400: 4 }[whole];
    let part;
    do part = stepFor * r.int(Math.ceil(whole / stepFor / 10), Math.floor((whole / stepFor) * 0.9));
    while (part * 100 === whole * 50 || part === whole);
    const pct = (part * 100) / whole;
    const d = round(part / whole, 2);
    const ctx = r.pick([
      { who: 'students surveyed', chose: 'chose the lantern boat ride', unit: 'students' },
      { who: 'lanterns checked', chose: 'needed new wicks', unit: 'lanterns' },
      { who: 'free throws', chose: 'went in', unit: 'shots' },
      { who: 'festival visitors asked', chose: 'came from the harbor district', unit: 'visitors' },
    ]);
    const aWork =
      whole <= 50
        ? `"${part} out of ${whole}. ${whole} × ${100 / whole} = 100, so ${part} × ${100 / whole} = ${pct}. That is ${pct}/100 = <b>${pct}%</b>."`
        : `"${part} out of ${whole}. ${whole} ÷ ${whole / 100} = 100, so ${part} ÷ ${whole / 100} = ${pct}. That is ${pct}/100 = <b>${pct}%</b>."`;
    const opts = [
      { title: a, html: aWork, ok: true },
      { title: b, html: `"${part} out of ${whole}, so it is <b>${part}%</b>."`, why: `${b} used the part as the percent. A percent is out of 100, and ${whole} is not 100. ${part} out of ${whole} is ${pct} out of 100.` },
      { title: c, html: `"${part} ÷ ${whole} = ${d}, so it is <b>${d}%</b>."`, why: `${c} found the decimal ${d} but forgot to change it to a percent. ${d} is ${pct} hundredths, which is ${pct}%.` },
    ];
    const sh = shuffleOptions(r, opts, 0);
    return {
      type: 'who',
      skill: 'fdp-convert',
      lesson: '4-2',
      title: 'Challenge: what percent?',
      xp: 20,
      prompt: `<p>Of ${hl(whole + ' ' + ctx.who)}, ${hl(part)} ${ctx.chose}. Three students find what percent that is. Who is correct?</p>`,
      options: sh.options,
      answer: sh.answer,
      layout: 'cards',
      hints: [
        `Here the part (${part}) and the whole (${whole}) are known. The percent is missing: how many out of <b>100</b>?`,
        whole <= 50 ? `Make an equivalent fraction with denominator 100: multiply ${part} and ${whole} by ${100 / whole}.` : `Make an equivalent fraction with denominator 100: divide ${part} and ${whole} by ${whole / 100}.`,
        `${part}/${whole} = ${pct}/100. Or divide: ${part} ÷ ${whole} = ${d}, and ${d} = ${pct} hundredths.`,
      ],
      solution: `<p><b>${a}</b> is correct: ${part}/${whole} = ${pct}/100 = <b>${pct}%</b>. ${b} used the part as the percent, but the whole is ${whole}, not 100. ${c} stopped at the decimal ${d}; a percent is hundredths, so ${d} = ${pct}%.</p>`,
      feedback: { correct: `Correct. ${part} out of ${whole} is ${pct} out of 100, which is ${pct}%.` },
    };
  });
})(typeof window !== 'undefined' ? window : globalThis);
