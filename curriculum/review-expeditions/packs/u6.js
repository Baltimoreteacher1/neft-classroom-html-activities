/* js/units/u6/gen-divide-unit.js */
/* Zone 1 — The Intake Gears. Lesson 6-1 Division Expressions with Fractions and Whole Numbers. */
(function (root) {
  'use strict';
  const RX = root.RX;
  const { G, V, simplify, gcd, shuffleOptions, NAMES, parseNum } = RX;
  const U = RX.U6;
  const hl = V.hl;
  const F = (a, b) => V.frac(a, b);
  const FRACTION_WORDS = { 2: 'halves', 3: 'thirds', 4: 'fourths', 5: 'fifths', 6: 'sixths', 8: 'eighths', 10: 'tenths', 12: 'twelfths' };

  const STOCK = [
    ['brass rod', 'feet', 'rods'],
    ['copper wire', 'meters', 'spools'],
    ['steel ribbon', 'yards', 'coils'],
    ['oak plank', 'feet', 'planks'],
    ['leather belt', 'meters', 'belts'],
  ];

  // ---------- Whole ÷ unit fraction with a bar model (num) ----------
  G.define('e1_barModel', (r, o) => {
    const hard = !!o.hard;
    const w = hard ? r.int(5, 9) : r.int(2, 4);
    const d = hard ? r.pick([3, 4, 5, 6, 8]) : r.pick([2, 3, 4, 5, 6]);
    const ans = w * d;
    const [item, unit] = r.pick(STOCK);
    const bars = Array.from(
      { length: w },
      (_, i) => `<div><div class="viz-cap">${unit.slice(0, -1)} ${i + 1}</div>${V.bar({ parts: d, shaded: d, width: 180, aria: `One whole cut into ${d} equal parts` })}</div>`,
    ).join('');
    return {
      type: 'num',
      skill: 'divide-whole',
      lesson: '6-1',
      title: hard ? 'How many pieces?' : 'How many fit inside?',
      prompt: `<p>The intake gears cut ${hl(w + ' ' + unit)} of ${item} into pieces that are each ${hl(U.fracText(1, d) + ' ' + unit.slice(0, -1))} long.</p>${
        hard ? '' : `<div class="viz-row">${bars}</div><p class="muted">Each whole ${unit.slice(0, -1)} is split into ${FRACTION_WORDS[d]}.</p>`
      }<p>How many pieces does the machine make? Write and evaluate ${w} ÷ ${F(1, d)}.</p>`,
      unit: 'pieces',
      answer: ans,
      hints: [
        `The question asks how many ${FRACTION_WORDS[d]} are in ${w} wholes. Dividing by a fraction asks "how many of these fit inside?"`,
        `Put a 1 under the whole number so both are fractions: ${w}/1 ÷ 1/${d}. Then Keep, Change, Flip: ${w}/1 × ${d}/1.`,
        `Multiply across: ${w} × ${d}. Each whole holds ${d} pieces, and there are ${w} wholes.`,
      ],
      solution: `<p>${w} ÷ ${F(1, d)} asks how many ${FRACTION_WORDS[d]} fit in ${w}. Write ${w} as ${F(w, 1)}, then Keep, Change, Flip: ${F(w, 1)} × ${F(d, 1)} = ${F(w * d, 1)} = <b>${ans}</b>. Each whole holds ${d} ${FRACTION_WORDS[d]}, so ${w} wholes hold ${w} × ${d} = ${ans} pieces. The quotient is bigger than ${w} because each piece is smaller than 1.</p>`,
      feedback: {
        correct: `Correct. ${w} wholes, ${d} ${FRACTION_WORDS[d]} in each, make ${ans} pieces. Dividing by a unit fraction gives a bigger number.`,
        wrong(ans0, dt) {
          const v = dt.value;
          if (v != null && Math.abs(v - w / d) < 1e-6) return `You multiplied ${w} by 1/${d}. In Keep, Change, Flip, the divisor 1/${d} flips to ${d}/1 before you multiply.`;
          if (v === w + d) return `Adding ${w} and ${d} does not answer "how many pieces." Count the ${FRACTION_WORDS[d]}: each whole holds ${d} of them.`;
          if (v === d) return `${d} is the number of pieces in ONE whole. There are ${w} wholes, so multiply.`;
          return `Think: how many ${FRACTION_WORDS[d]} are in 1 whole? Then multiply by ${w} wholes.`;
        },
      },
    };
  });

  // ---------- Keep, Change, Flip steps (cloze) ----------
  G.define('e1_kcfSteps', (r) => {
    const w = r.int(2, 9);
    const d = r.pick([2, 3, 4, 5, 6, 8]);
    const flipped = `${d}/1`;
    const stepOne = [`${w}/1`, `1/${w}`, `${w}/${d}`];
    const stepTwo = r.shuffle([flipped, `1/${d}`, `${d}/${w}`]);
    const results = r.shuffle([String(w * d), String(w + d), U.fracText(w, d)]);
    return {
      type: 'cloze',
      skill: 'divide-whole',
      lesson: '6-1',
      title: 'Set the three steps',
      prompt: `<p>The intake plate shows ${hl(w + ' ÷ ' + U.fracText(1, d))}. Complete the three steps of the Foundry's method.</p>`,
      template: `Step 1: Put a 1 under the whole number: {0} ÷ 1/${d}.  Step 2: Keep, Change, Flip: ${w}/1 × {1}.  Step 3: Multiply across: {2}.`,
      choices: [stepOne, stepTwo, results],
      answers: [0, stepTwo.indexOf(flipped), results.indexOf(String(w * d))],
      hints: [
        'A whole number becomes a fraction when you write it over 1. Its value does not change.',
        `Keep ${w}/1. Change ÷ to ×. Flip only the second fraction: 1/${d} becomes ${d}/1.`,
        `${w}/1 × ${d}/1 = (${w} × ${d})/(1 × 1). Multiply the tops, multiply the bottoms.`,
      ],
      solution: `<p>Step 1: ${w} = ${F(w, 1)}. Step 2: Keep ${F(w, 1)}, change ÷ to ×, flip ${F(1, d)} to ${F(d, 1)}. Step 3: ${F(w, 1)} × ${F(d, 1)} = ${F(w * d, 1)} = <b>${w * d}</b>. Only the divisor is flipped, because dividing by a number is the same as multiplying by its reciprocal.</p>`,
      feedback: {
        correct: `Correct. Write the whole number over 1, flip only the divisor, then multiply across: ${w * d}.`,
        wrong(ans, dt) {
          if (dt.wrong.includes(0)) return `Step 1: writing ${w} over 1 keeps its value. ${w}/1 is still ${w}.`;
          if (dt.wrong.includes(1)) return `Step 2: only the second fraction flips. 1/${d} flipped is ${d}/1, not 1/${d}.`;
          return `Step 3: multiply straight across. ${w} × ${d} on top and 1 × 1 on the bottom.`;
        },
      },
    };
  });

  // ---------- Story: whole ÷ unit fraction (mc) ----------
  G.define('e1_storyDivide', (r) => {
    const name = r.pick(NAMES);
    const w = r.int(2, 8);
    const d = r.pick([3, 4, 5, 6, 8].filter((x) => w % x !== 0));
    const ctx = r.pick([
      [`${name} has ${w} cups of oil for the gears. Each oil can holds ${U.fracText(1, d)} cup.`, 'How many cans can be filled?', 'cans'],
      [`${w === 8 ? 'An' : 'A'} ${w}-pound sack of iron filings is split into bags that each hold ${U.fracText(1, d)} pound.`, 'How many bags are filled?', 'bags'],
      [`${name} has ${w} hours to inspect dials. Each inspection takes ${U.fracText(1, d)} hour.`, 'How many inspections can ${name} finish?', 'inspections'],
      [`${w === 8 ? 'An' : 'A'} ${w}-meter chain is cut into links that are each ${U.fracText(1, d)} meter long.`, 'How many links are made?', 'links'],
    ]);
    const [a, b] = simplify(w, d);
    const opts = [
      { html: `${w * d} ${ctx[2]}`, ok: true },
      {
        html: `${a === w && b === d ? '' : ''}${F(a, b)} ${ctx[2].slice(0, -1)}`,
        why: `${U.fracText(a, b)} comes from multiplying ${w} × 1/${d}. Dividing by 1/${d} means flipping it to ${d}/1 first. The answer must be bigger than ${w}, because each piece is smaller than one whole.`,
      },
      { html: `${w + d} ${ctx[2]}`, why: `Adding ${w} and ${d} does not model "how many 1/${d} fit in ${w}." Each whole holds ${d} of them, so multiply.` },
      { html: `${d} ${ctx[2]}`, why: `${d} is how many ${FRACTION_WORDS[d]} fit in just ONE whole. There are ${w} wholes.` },
    ];
    const sh = shuffleOptions(r, opts, 0);
    return {
      type: 'mc',
      skill: 'divide-whole',
      lesson: '6-1',
      title: 'Divide to solve the story',
      prompt: `<p>${ctx[0]}</p><p>${ctx[1].replace('${name}', name)}</p>`,
      options: sh.options,
      answer: sh.answer,
      hints: [
        `This is a division story: ${w} ÷ 1/${d}. It asks how many ${FRACTION_WORDS[d]} are in ${w} wholes.`,
        `Write ${w} as ${w}/1, then Keep, Change, Flip: ${w}/1 × ${d}/1.`,
        `${w} × ${d} = ? The quotient should be larger than ${w}.`,
      ],
      solution: `<p>${w} ÷ ${F(1, d)} = ${F(w, 1)} × ${F(d, 1)} = <b>${w * d} ${ctx[2]}</b>. Each whole holds ${d} ${FRACTION_WORDS[d]}, and there are ${w} wholes. Dividing by a fraction less than 1 always gives a quotient bigger than the starting amount.</p>`,
      feedback: { correct: `Correct. ${w} ÷ 1/${d} = ${w} × ${d} = ${w * d}.` },
    };
  });

  // ---------- Error: multiplied by the divisor instead of flipping (error) ----------
  G.define('e1_errorMultiply', (r) => {
    const name = r.pick(NAMES);
    const w = r.int(2, 9);
    const d = r.pick([2, 3, 4, 5, 6, 8]);
    const [a, b] = simplify(w, d);
    const opts = [
      { html: `${name} changed ÷ to × but did not flip the divisor. 1/${d} must become ${d}/1 before multiplying.`, ok: true },
      { html: `${name} should have flipped ${w}/1 to 1/${w} instead.`, why: `Only the divisor (the second fraction) flips. ${w}/1 is the dividend and stays as it is.` },
      { html: `${name} should have added ${w} + ${d}.`, why: `Division by a fraction is never solved by adding. The method is Keep, Change, Flip.` },
      { html: `The answer is correct. Dividing by a fraction makes the number smaller.`, why: `Dividing by a fraction less than 1 makes the quotient BIGGER. ${w} ÷ 1/${d} must be more than ${w}.` },
    ];
    const sh = shuffleOptions(r, opts, 0);
    return {
      type: 'error',
      skill: 'divide-whole',
      lesson: '6-1',
      title: 'Find the mistake',
      prompt: `<p>${name} divided ${hl(w + ' ÷ ' + U.fracText(1, d))} on the intake plate. The gears jammed.</p><p>What went wrong?</p>`,
      work: `${w} ÷ ${F(1, d)} = ${F(w, 1)} × ${F(1, d)} = ${F(w, d)}${a !== w ? ` = ${F(a, b)}` : ''}`,
      options: sh.options,
      answer: sh.answer,
      fix: { label: `The correct quotient is`, answer: w * d },
      hints: [
        `Check the size of the answer first. ${w} ÷ 1/${d} asks how many ${FRACTION_WORDS[d]} fit in ${w}. Should that be more or less than ${w}?`,
        `Keep ${w}/1. Change ÷ to ×. Flip 1/${d}. Compare with ${name}'s second step.`,
        `${w}/1 × ${d}/1 = ${w} × ${d}.`,
      ],
      solution: `<p>${name} changed the sign but kept 1/${d} instead of flipping it. The correct work is ${F(w, 1)} × ${F(d, 1)} = <b>${w * d}</b>. A quick check: ${w} wholes hold ${d} ${FRACTION_WORDS[d]} each, so the answer must be bigger than ${w}.</p>`,
      feedback: {
        correct: `Correct. Change AND flip go together. ${w} ÷ 1/${d} = ${w} × ${d} = ${w * d}.`,
        wrong(ans, dt) {
          if (!dt.mistakeOk) return (sh.options[ans.mistake] && sh.options[ans.mistake].why) || 'Look at the second step. Was the divisor flipped?';
          return `You found the mistake. For the fix: ${w}/1 × ${d}/1 = ${w} × ${d}.`;
        },
      },
    };
  });

  // ---------- Unit fraction ÷ whole (blanks, fraction layout) ----------
  G.define('e1_unitByWhole', (r) => {
    const d = r.pick([2, 3, 4, 5, 6, 8]);
    const w = r.int(2, 6);
    const name = r.pick(NAMES);
    const ctx = r.pick([
      `${name} has ${U.fracText(1, d)} of a jar of grease and shares it equally among ${w} gearboxes.`,
      `A strip of copper ${U.fracText(1, d)} meter long is cut into ${w} equal pieces.`,
      `${name} splits ${U.fracText(1, d)} of a pan of foundry bread into ${w} equal servings.`,
    ]);
    return {
      type: 'blanks',
      skill: 'divide-whole',
      lesson: '6-1',
      title: 'Divide a unit fraction by a whole number',
      prompt: `<p>${ctx}</p><p>What fraction does each ${ctx.includes('gearbox') ? 'gearbox' : ctx.includes('piece') ? 'piece' : 'serving'} get? Write and evaluate ${hl(U.fracText(1, d) + ' ÷ ' + w)} as a fraction in simplest form.</p>`,
      fields: [
        { label: 'numerator (top)', answer: 1, width: 'sm' },
        { label: 'denominator (bottom)', answer: d * w, width: 'sm' },
      ],
      layout: 'fraction',
      hints: [
        `Write the whole number over 1: 1/${d} ÷ ${w}/1. Sharing among ${w} makes each share smaller.`,
        `Keep 1/${d}. Change ÷ to ×. Flip ${w}/1 to 1/${w}.`,
        `1/${d} × 1/${w}: multiply the tops (1 × 1) and the bottoms (${d} × ${w}).`,
      ],
      solution: `<p>${F(1, d)} ÷ ${w} = ${F(1, d)} ÷ ${F(w, 1)} = ${F(1, d)} × ${F(1, w)} = <b>${F(1, d * w)}</b>. Splitting a ${FRACTION_WORDS[d].slice(0, -1)} into ${w} equal parts makes pieces that are ${d} × ${w} = ${d * w} to a whole, so each share is 1/${d * w}.</p>`,
      feedback: {
        correct: `Correct. 1/${d} × 1/${w} = 1/${d * w}. Dividing by a whole number makes the fraction smaller.`,
        wrong(ans) {
          const n = parseNum(ans[0]),
            m = parseNum(ans[1]);
          if (n != null && m && Math.abs(n / m - w / d) < 1e-9) return `${w}/${d} comes from flipping the FIRST fraction. Only the divisor flips: ${w}/1 becomes 1/${w}.`;
          if (n != null && m && Math.abs(n / m - 1 / (d * w)) < 1e-9)
            return 'Your fraction is equivalent to the answer, but it is not in simplest form. Divide top and bottom by their greatest common factor.';
          if (n === 1 && m === d + w) return `Do not add the denominators. Multiply: 1/${d} × 1/${w} has a denominator of ${d} × ${w}.`;
          return `Write ${w} as ${w}/1, flip it to 1/${w}, then multiply 1/${d} × 1/${w}.`;
        },
      },
    };
  });

  // ---------- Fraction ÷ whole (blanks, fraction layout) ----------
  G.define('e1_fracByWhole', (r) => {
    const pairs = [
      [3, 4],
      [2, 3],
      [3, 5],
      [5, 6],
      [2, 5],
      [4, 5],
      [5, 8],
      [3, 8],
    ];
    const [a, b] = r.pick(pairs);
    const w = r.int(2, 5);
    const [sn, sd] = simplify(a, b * w);
    const name = r.pick(NAMES);
    const ctx = r.pick([
      `A gear belt is ${U.fracText(a, b)} yard long. ${name} cuts it into ${w} equal pieces.`,
      `${name} pours ${U.fracText(a, b)} liter of oil equally into ${w} reservoirs.`,
      `A ${U.fracText(a, b)}-acre scrap yard is divided into ${w} equal lots.`,
    ]);
    return {
      type: 'blanks',
      skill: 'divide-whole',
      lesson: '6-1',
      title: 'Divide a fraction by a whole number',
      prompt: `<p>${ctx}</p><p>How much is each part? Evaluate ${hl(U.fracText(a, b) + ' ÷ ' + w)}. Write the answer as a fraction in simplest form.</p>`,
      fields: [
        { label: 'numerator (top)', answer: sn, width: 'sm' },
        { label: 'denominator (bottom)', answer: sd, width: 'sm' },
      ],
      layout: 'fraction',
      hints: [
        `Write ${w} as ${w}/1. Then use Keep, Change, Flip.`,
        `${a}/${b} × 1/${w}. Multiply the numerators and the denominators.`,
        `${a}/${b * w}${sn !== a ? `. Both ${a} and ${b * w} can be divided by ${gcd(a, b * w)}.` : ' is already in simplest form.'}`,
      ],
      solution: `<p>${F(a, b)} ÷ ${w} = ${F(a, b)} × ${F(1, w)} = ${F(a, b * w)}${sn !== a ? ` = <b>${F(sn, sd)}</b> after dividing top and bottom by ${gcd(a, b * w)}` : ` = <b>${F(sn, sd)}</b>`}. Each of the ${w} parts is one ${w}th of ${U.fracText(a, b)}, so the answer is smaller than ${U.fracText(a, b)}.</p>`,
      feedback: {
        correct: `Correct. ${a}/${b} × 1/${w} = ${a}/${b * w}${sn !== a ? ` = ${sn}/${sd}` : ''}. Dividing by ${w} made the fraction ${w} times smaller.`,
        wrong(ans) {
          const n = parseNum(ans[0]),
            m = parseNum(ans[1]);
          if (n != null && m && Math.abs(n / m - sn / sd) < 1e-9)
            return 'Your fraction is equivalent to the answer but not in simplest form. Divide the top and bottom by their greatest common factor.';
          if (n != null && m && Math.abs(n / m - (a * w) / b) < 1e-9) return `${a * w}/${b} is ${a}/${b} × ${w}. Dividing by ${w} should make the fraction smaller, so flip ${w}/1 to 1/${w}.`;
          if (n != null && m && Math.abs(n / m - (b * w) / a) < 1e-9) return `You flipped the first fraction. Only the divisor ${w}/1 flips.`;
          return `Keep ${a}/${b}, change to ×, flip ${w}/1 to 1/${w}. Then multiply across and simplify.`;
        },
      },
    };
  });

  // ---------- Match numbers to reciprocals (match) ----------
  G.define('e1_reciprocalMatch', (r) => {
    const whole = r.int(2, 9);
    const unitD = r.pick([2, 3, 4, 5, 6, 7, 8].filter((x) => x !== whole));
    const fracs = r.pickN(
      [
        [2, 3],
        [3, 4],
        [2, 5],
        [3, 5],
        [4, 7],
        [5, 6],
        [3, 8],
        [5, 9],
      ],
      2,
    );
    const items = [
      { left: String(whole), right: F(1, whole) },
      { left: F(1, unitD), right: String(unitD) },
      { left: F(fracs[0][0], fracs[0][1]), right: F(fracs[0][1], fracs[0][0]) },
      { left: F(fracs[1][0], fracs[1][1]), right: F(fracs[1][1], fracs[1][0]) },
    ];
    const order = r.shuffle([0, 1, 2, 3]);
    const left = items.map((it) => it.left);
    const right = order.map((i) => items[i].right);
    const pairs = items.map((it, i) => [i, order.indexOf(i)]);
    return {
      type: 'match',
      skill: 'divide-whole',
      lesson: '6-1',
      title: 'Match each number to its reciprocal',
      prompt: `<p>Before a plate can flip, the Foundry needs the <b>reciprocal</b> of each number. Match each number on the left to its reciprocal on the right.</p><p class="muted">A number times its reciprocal equals 1.</p>`,
      left,
      right,
      pairs,
      hints: [
        'To find a reciprocal, swap the numerator and denominator.',
        `A whole number sits over 1: ${whole} = ${whole}/1, so its reciprocal is 1/${whole}.`,
        `Check with multiplication: ${fracs[0][0]}/${fracs[0][1]} × ${fracs[0][1]}/${fracs[0][0]} = 1.`,
      ],
      solution: `<p>Flip each fraction: ${whole} → ${F(1, whole)}; ${U.fracText(1, unitD)} → ${unitD}; ${U.fracText(fracs[0][0], fracs[0][1])} → ${U.fracText(fracs[0][1], fracs[0][0])}; ${U.fracText(fracs[1][0], fracs[1][1])} → ${U.fracText(fracs[1][1], fracs[1][0])}. Each pair multiplies to <b>1</b>.</p>`,
      feedback: {
        correct: 'Correct. Reciprocals swap top and bottom, and their product is always 1.',
        wrong(ans, dt) {
          const i = dt.wrong[0];
          if (i === 0) return `${whole} is ${whole}/1. Swap to get 1/${whole}, not another whole number.`;
          return 'Swap the numerator and denominator. The reciprocal of a fraction less than 1 is greater than 1.';
        },
      },
    };
  });

  // ---------- Who shared correctly? (who) ----------
  G.define('e1_whoShare', (r) => {
    const [n1, n2, n3] = r.pickN(NAMES, 3);
    const [a, b] = r.pick([
      [2, 3],
      [3, 4],
      [3, 5],
      [4, 5],
      [5, 6],
      [2, 5],
    ]);
    const w = r.int(2, 4);
    const [sn, sd] = simplify(a, b * w);
    const thing = r.pick(['pan of brownies', 'tin of polish', 'sheet of gold leaf', 'roll of tape']);
    const opts = [
      { html: `<b>${n1}:</b> ${F(a, b)} ÷ ${w} = ${F(a, b)} × ${F(1, w)} = ${F(a, b * w)}${sn !== a ? ` = ${F(sn, sd)}` : ''}`, ok: true },
      {
        html: `<b>${n2}:</b> ${F(a, b)} ÷ ${w} = ${F(a, b)} × ${F(w, 1)} = ${F(a * w, b)}`,
        why: `${n2} multiplied by ${w} instead of dividing. Sharing among ${w} people makes each share smaller, so flip ${w}/1 to 1/${w}.`,
      },
      { html: `<b>${n3}:</b> ${F(a, b)} ÷ ${w} = ${F(b, a)} × ${F(1, w)} = ${F(b, a * w)}`, why: `${n3} flipped the first fraction. Only the divisor (${w}/1) is flipped in Keep, Change, Flip.` },
    ];
    const sh = shuffleOptions(r, opts, 0);
    return {
      type: 'who',
      skill: 'divide-whole',
      lesson: '6-1',
      title: 'Who shared it correctly?',
      prompt: `<p>Three apprentices share ${hl(U.fracText(a, b))} of a ${thing} equally among ${hl(w + ' people')}. Each one wrote the division differently.</p><p>Who is correct?</p>`,
      options: sh.options,
      answer: sh.answer,
      layout: 'cards',
      hints: [`Each person gets a part of ${a}/${b}, so the answer must be smaller than ${a}/${b}.`, `Keep ${a}/${b}, change ÷ to ×, flip ${w}/1 to 1/${w}.`, `${a}/${b} × 1/${w} = ${a}/${b * w}.`],
      solution: `<p>${n1} is correct: ${F(a, b)} ÷ ${w} = ${F(a, b)} × ${F(1, w)} = <b>${F(sn, sd)}</b>. ${n2} multiplied instead of dividing, which made the share bigger. ${n3} flipped the wrong fraction.</p>`,
      feedback: { correct: `Correct. ${n1} kept ${a}/${b}, changed to ×, and flipped only the divisor.` },
    };
  });
})(typeof window !== 'undefined' ? window : globalThis);

/* js/units/u6/gen-divide-mixed.js */
/* Zone 2 — The Cutting Floor. Lesson 6-2 Division Expressions with Fractions and Mixed Numbers. */
(function (root) {
  'use strict';
  const DEN = { 2: 'halves', 3: 'thirds', 4: 'fourths', 5: 'fifths', 6: 'sixths', 8: 'eighths', 10: 'tenths', 12: 'twelfths' };
  const den = (b) => DEN[b] || b + 'ths';
  const RX = root.RX;
  const { G, V, simplify, gcd, shuffleOptions, NAMES, parseNum } = RX;
  const U = RX.U6;
  const hl = V.hl;
  const F = (a, b) => V.frac(a, b);
  const T = U.fracText;

  /** Draw a proper fraction a/b in lowest terms with denominator from the pool. */
  function properFrac(r, pool) {
    const b = r.pick(pool);
    const choices = [];
    for (let a = 1; a < b; a++) if (gcd(a, b) === 1) choices.push(a);
    return [r.pick(choices), b];
  }

  // ---------- Fraction ÷ fraction, proper result (blanks, fraction layout) ----------
  G.define('e2_fracByFrac', (r) => {
    // dividend a/b smaller than divisor c/d so the quotient is a proper fraction
    let a, b, c, d;
    for (let tries = 0; tries < 50; tries++) {
      [a, b] = properFrac(r, [3, 4, 5, 6, 8]);
      [c, d] = properFrac(r, [2, 3, 4, 5, 6, 8]);
      if (a / b < c / d && !(a === 1 && c === 1)) break;
    }
    if (a / b >= c / d) {
      [a, b, c, d] = [1, 4, 2, 3];
    }
    const [sn, sd] = simplify(a * d, b * c);
    const name = r.pick(NAMES);
    return {
      type: 'blanks',
      skill: 'divide-fractions',
      lesson: '6-2',
      title: 'Divide a fraction by a fraction',
      prompt: `<p>${name} sets the cutting plate to ${hl(T(a, b) + ' ÷ ' + T(c, d))}.</p><p>Evaluate. Write the quotient as a fraction in simplest form.</p>`,
      fields: [
        { label: 'numerator (top)', answer: sn, width: 'sm' },
        { label: 'denominator (bottom)', answer: sd, width: 'sm' },
      ],
      layout: 'fraction',
      hints: [
        `Keep ${a}/${b}. Change ÷ to ×. Flip ${c}/${d} to its reciprocal.`,
        `${a}/${b} × ${d}/${c}. Multiply numerators, then denominators.`,
        `${a * d}/${b * c}${sn !== a * d ? `. Divide top and bottom by ${gcd(a * d, b * c)} to simplify.` : ' is already in simplest form.'}`,
      ],
      solution: `<p>${F(a, b)} ÷ ${F(c, d)} = ${F(a, b)} × ${F(d, c)} = ${F(a * d, b * c)}${sn !== a * d ? ` = <b>${F(sn, sd)}</b> (divide top and bottom by ${gcd(a * d, b * c)})` : ` = <b>${F(sn, sd)}</b>`}. Dividing by ${T(c, d)} is the same as multiplying by its reciprocal ${T(d, c)}.</p>`,
      feedback: {
        correct: `Correct. ${a}/${b} × ${d}/${c} = ${a * d}/${b * c}${sn !== a * d ? ` = ${sn}/${sd}` : ''}.`,
        wrong(ans) {
          const n = parseNum(ans[0]),
            m = parseNum(ans[1]);
          if (n != null && m && Math.abs(n / m - sn / sd) < 1e-9) return 'Your fraction is equivalent to the answer but not simplified. Divide top and bottom by their greatest common factor.';
          if (n != null && m && Math.abs(n / m - (a * c) / (b * d)) < 1e-9) return `${a * c}/${b * d} is ${a}/${b} × ${c}/${d}. You changed ÷ to × but did not flip ${c}/${d}.`;
          if (n != null && m && Math.abs(n / m - (b * d) / (a * c)) < 1e-9) return `You flipped the first fraction. Keep ${a}/${b}; flip only the divisor ${c}/${d}.`;
          if (n != null && m && Math.abs(n / m - (b * c) / (a * d)) < 1e-9) return `That is the reciprocal of the answer. Flip ${c}/${d}, not ${a}/${b}.`;
          return `Keep ${a}/${b}, change to ×, flip ${c}/${d} to ${d}/${c}, multiply across, then simplify.`;
        },
      },
    };
  });

  // ---------- Keep, Change, Flip with two fractions (cloze) ----------
  G.define('e2_kcfCloze', (r) => {
    const [a, b] = properFrac(r, [3, 4, 5, 6, 8]);
    let [c, d] = properFrac(r, [3, 4, 5, 6, 8]);
    if (c === a && d === b) [c, d] = b === 4 ? [2, 3] : [3, 4];
    const [sn, sd] = simplify(a * d, b * c);
    const recips = r.shuffle([T(d, c), T(c, d), T(b, a)]);
    const results = r.shuffle([T(sn, sd), T(...simplify(a * c, b * d)), T(...simplify(b * c, a * d))].filter((v, i, arr) => arr.indexOf(v) === i));
    while (results.length < 3) results.push(T(a + c, b + d));
    return {
      type: 'cloze',
      skill: 'divide-fractions',
      lesson: '6-2',
      title: 'Complete the method',
      prompt: `<p>Complete the steps to evaluate ${hl(T(a, b) + ' ÷ ' + T(c, d))}.</p>`,
      template: `Keep ${T(a, b)}, change ÷ to ×, and flip the divisor to {0}.  Then multiply across and simplify. The quotient is {1}.`,
      choices: [recips, results],
      answers: [recips.indexOf(T(d, c)), results.indexOf(T(sn, sd))],
      hints: [
        'The reciprocal of a fraction swaps its numerator and denominator.',
        `Only the second fraction, ${c}/${d}, is flipped. It becomes ${d}/${c}.`,
        `${a}/${b} × ${d}/${c} = ${a * d}/${b * c}. Simplify if you can.`,
      ],
      solution: `<p>Flip the divisor: ${F(c, d)} → ${F(d, c)}. Then ${F(a, b)} × ${F(d, c)} = ${F(a * d, b * c)}${sn !== a * d ? ` = <b>${F(sn, sd)}</b>` : ` = <b>${F(sn, sd)}</b>`}. The first fraction is kept exactly as it is.</p>`,
      feedback: {
        correct: `Correct. Flip only the divisor, then multiply across: ${T(sn, sd)}.`,
        wrong(ans, dt) {
          if (dt.wrong.includes(0)) return `The reciprocal of ${c}/${d} swaps top and bottom: ${d}/${c}. The first fraction does not flip.`;
          return `Multiply ${a}/${b} × ${d}/${c}: tops ${a} × ${d}, bottoms ${b} × ${c}. Then simplify.`;
        },
      },
    };
  });

  // ---------- Error: flipped the dividend instead of the divisor (error) ----------
  G.define('e2_errorFlip', (r) => {
    const name = r.pick(NAMES);
    // whole-number quotients so the fix is a whole number
    const sets = [
      [3, 4, 1, 8, 6],
      [2, 3, 1, 6, 4],
      [5, 6, 1, 12, 10],
      [3, 5, 3, 10, 2],
      [4, 5, 2, 15, 6],
      [1, 2, 1, 8, 4],
      [3, 4, 3, 8, 2],
      [2, 3, 2, 9, 3],
      [5, 8, 5, 16, 2],
    ];
    const [a, b, c, d, q] = r.pick(sets);
    const [wn, wd] = simplify(b * c, a * d);
    const opts = [
      { html: `${name} flipped the first fraction. Only the divisor ${T(c, d)} should be flipped, to ${T(d, c)}.`, ok: true },
      { html: `${name} should have flipped both fractions.`, why: `Flipping both fractions gives the reciprocal of the right answer. Only the divisor flips.` },
      { html: `${name} should not have changed ÷ to ×.`, why: `Changing ÷ to × is correct. The error is which fraction was flipped.` },
      {
        html: `The work is correct. Dividing fractions always gives a smaller answer.`,
        why: `Dividing by a fraction less than 1 gives a LARGER answer. ${T(a, b)} ÷ ${T(c, d)} should be more than ${T(a, b)}.`,
      },
    ];
    const sh = shuffleOptions(r, opts, 0);
    return {
      type: 'error',
      skill: 'divide-fractions',
      lesson: '6-2',
      title: 'Find the mistake',
      prompt: `<p>${name} evaluated ${hl(T(a, b) + ' ÷ ' + T(c, d))} on the cutting floor.</p><p>What is the mistake?</p>`,
      work: `${F(a, b)} ÷ ${F(c, d)} = ${F(b, a)} × ${F(c, d)} = ${F(b * c, a * d)}${wn !== b * c ? ` = ${F(wn, wd)}` : ''}`,
      options: sh.options,
      answer: sh.answer,
      fix: { label: 'The correct quotient is', answer: q },
      hints: [
        `Keep, Change, Flip: which fraction stays, and which one flips?`,
        `The first fraction ${a}/${b} is kept. The divisor ${c}/${d} flips to ${d}/${c}.`,
        `${a}/${b} × ${d}/${c} = ${a * d}/${b * c}. Simplify to a whole number.`,
      ],
      solution: `<p>${name} flipped ${T(a, b)}, the dividend. The correct work is ${F(a, b)} × ${F(d, c)} = ${F(a * d, b * c)} = <b>${q}</b>. In other words, ${T(c, d)} fits into ${T(a, b)} exactly ${q} times.</p>`,
      feedback: {
        correct: `Correct. Keep the first fraction, flip only the divisor: ${T(a, b)} ÷ ${T(c, d)} = ${q}.`,
        wrong(ans, dt) {
          if (!dt.mistakeOk) return (sh.options[ans.mistake] && sh.options[ans.mistake].why) || `Look at which fraction ${name} flipped.`;
          return `You found the mistake. For the fix: ${a}/${b} × ${d}/${c} = ${a * d}/${b * c}, which simplifies to a whole number.`;
        },
      },
    };
  });

  // ---------- Story: fraction ÷ fraction with a whole-number answer (num) ----------
  G.define('e2_storyFrac', (r) => {
    const name = r.pick(NAMES);
    const sets = [
      [3, 4, 1, 8, 6],
      [2, 3, 1, 6, 4],
      [5, 6, 1, 12, 10],
      [3, 5, 3, 10, 2],
      [4, 5, 2, 15, 6],
      [1, 2, 1, 8, 4],
      [3, 4, 3, 8, 2],
      [2, 3, 2, 9, 3],
      [5, 8, 5, 16, 2],
      [3, 4, 1, 4, 3],
      [5, 6, 1, 6, 5],
    ];
    const [a, b, c, d, q] = r.pick(sets);
    const ctx = r.pick([
      [`${name} has ${T(a, b)} gallon of lamp oil. Each lamp holds ${T(c, d)} gallon.`, 'How many lamps can be filled?', 'lamps'],
      [`A strip of tin ${T(a, b)} meter long is cut into pieces each ${T(c, d)} meter long.`, 'How many pieces are cut?', 'pieces'],
      [`A machine runs for ${T(a, b)} hour. Each cycle takes ${T(c, d)} hour.`, 'How many cycles does it complete?', 'cycles'],
      [`${name} has ${T(a, b)} pound of solder and uses ${T(c, d)} pound per joint.`, 'How many joints can be made?', 'joints'],
    ]);
    return {
      type: 'num',
      skill: 'divide-fractions',
      lesson: '6-2',
      title: 'Divide to solve the story',
      prompt: `<p>${ctx[0]}</p><p>${ctx[1]}</p>`,
      unit: ctx[2],
      answer: q,
      hints: [
        `The question asks how many ${T(c, d)}s fit in ${T(a, b)}. Write the division: ${a}/${b} ÷ ${c}/${d}.`,
        `Keep ${a}/${b}, change to ×, flip ${c}/${d} to ${d}/${c}.`,
        `${a}/${b} × ${d}/${c} = ${a * d}/${b * c}. Simplify.`,
      ],
      solution: `<p>${F(a, b)} ÷ ${F(c, d)} = ${F(a, b)} × ${F(d, c)} = ${F(a * d, b * c)} = <b>${q} ${ctx[2]}</b>. Check by multiplying: ${q} × ${T(c, d)} = ${T(a, b)}.</p>`,
      feedback: {
        correct: `Correct. ${T(c, d)} fits into ${T(a, b)} exactly ${q} times.`,
        wrong(ans, dt) {
          const v = dt.value;
          if (v != null && Math.abs(v - (a * c) / (b * d)) < 1e-6) return `You multiplied ${a}/${b} × ${c}/${d}. "How many fit" is division: flip ${c}/${d} first.`;
          if (v != null && Math.abs(v - 1 / q) < 1e-6) return `That is the reciprocal of the answer. You flipped the wrong fraction. Keep ${a}/${b} and flip ${c}/${d}.`;
          return `Write ${a}/${b} ÷ ${c}/${d}, then Keep, Change, Flip. The answer is a whole number.`;
        },
      },
    };
  });

  // ---------- Mixed number → improper fraction (blanks, fraction layout) ----------
  G.define('e2_toImproper', (r) => {
    const w = r.int(1, 5);
    const [a, b] = properFrac(r, [2, 3, 4, 5, 6, 8]);
    const n = w * b + a;
    const name = r.pick(NAMES);
    return {
      type: 'blanks',
      skill: 'divide-mixed',
      lesson: '6-2',
      title: 'Rewrite the mixed number',
      prompt: `<p>Before the blade can flip anything, every mixed number must be rewritten as a single fraction.</p><p>${name} reads ${hl(U.mixedText(w, a, b))} on the plate. Write it as an improper fraction.</p>`,
      fields: [
        { label: 'numerator (top)', answer: n, width: 'sm' },
        { label: 'denominator (bottom)', answer: b, width: 'sm' },
      ],
      layout: 'fraction',
      hints: [
        `The denominator stays ${b}. Each whole is ${b}/${b}.`,
        `${w} wholes = ${w} × ${b} = ${w * b} ${den(b)}. Then add the ${a} extra ${den(b)}.`,
        `${w} × ${b} + ${a} = ? That goes on top, over ${b}.`,
      ],
      solution: `<p>${U.mixed(w, a, b)} = ${F(w * b, b)} + ${F(a, b)} = <b>${F(n, b)}</b>. Multiply the whole number by the denominator (${w} × ${b} = ${w * b}), add the numerator (${w * b} + ${a} = ${n}), and keep the denominator.</p>`,
      feedback: {
        correct: `Correct. ${w} × ${b} + ${a} = ${n}, so ${U.mixedText(w, a, b)} = ${n}/${b}.`,
        wrong(ans) {
          const t = parseNum(ans[0]),
            m = parseNum(ans[1]);
          if (t === w + a && m === b) return `You added ${w} + ${a}. The whole number ${w} is worth ${w} × ${b} = ${w * b} ${den(b)}, not ${w} ${den(b)}.`;
          if (t === w * a && m === b) return `You multiplied ${w} × ${a}. Multiply the whole number by the DENOMINATOR (${b}), then add the numerator ${a}.`;
          if (t === n && m !== b) return `The numerator is right. The denominator stays ${b}, because the pieces are still ${den(b)}.`;
          return `Multiply ${w} × ${b}, add ${a}, and write that over ${b}.`;
        },
      },
    };
  });

  // ---------- Mixed ÷ fraction with a mixed-number answer (blanks, template) ----------
  G.define('e2_mixedDivide', (r, o) => {
    const hard = !!o.hard;
    // Ensure quotient is a non-whole mixed number.
    let w, a, b, c, d, qn, qd, mix;
    for (let tries = 0; tries < 200; tries++) {
      w = hard ? r.int(2, 6) : r.int(1, 4);
      [a, b] = properFrac(r, hard ? [3, 4, 5, 6, 8] : [2, 3, 4]);
      [c, d] = properFrac(r, hard ? [3, 4, 5, 6, 8] : [2, 3, 4]);
      const n = w * b + a;
      [qn, qd] = simplify(n * d, b * c);
      mix = U.toMixed(n * d, b * c);
      if (qd !== 1 && mix[0] >= 1 && mix[0] <= 12 && qd <= 12) break;
    }
    const n = w * b + a;
    const [W, N, D] = mix;
    const name = r.pick(NAMES);
    const ctx = hard
      ? `<p>${name} must evaluate ${hl(U.mixedText(w, a, b) + ' ÷ ' + T(c, d))} with no plate to guide the steps.</p>`
      : `<p>${name} has ${hl(U.mixedText(w, a, b) + ' feet')} of brass ribbon. Each gear tag needs ${hl(T(c, d) + ' foot')}.</p><p>Evaluate ${U.mixedText(w, a, b)} ÷ ${T(c, d)} to find how many tags can be cut.</p>`;
    return {
      type: 'blanks',
      skill: 'divide-mixed',
      lesson: '6-2',
      title: hard ? 'Divide with a mixed number' : 'Divide the ribbon',
      prompt: `${ctx}<p>Write the quotient as a mixed number in simplest form.</p>`,
      fields: [
        { label: 'whole number', answer: W, width: 'xs' },
        { label: 'numerator', answer: N, width: 'xs' },
        { label: 'denominator', answer: D, width: 'xs' },
      ],
      template: `Quotient = {0} and {1}/{2}`,
      hints: [
        `First rewrite ${U.mixedText(w, a, b)} as an improper fraction: ${w} × ${b} + ${a} = ${n}, so ${n}/${b}.`,
        `Keep ${n}/${b}, change ÷ to ×, flip ${c}/${d} to ${d}/${c}: ${n}/${b} × ${d}/${c} = ${n * d}/${b * c}.`,
        `${n * d}/${b * c}${qn !== n * d ? ` simplifies to ${qn}/${qd}` : ''}. ${qd} goes into ${qn} ${W} times with ${N} left over.`,
      ],
      solution: `<p>Rewrite: ${U.mixed(w, a, b)} = ${F(n, b)}. Keep, Change, Flip: ${F(n, b)} × ${F(d, c)} = ${F(n * d, b * c)}${qn !== n * d ? ` = ${F(qn, qd)}` : ''} = <b>${U.mixed(W, N, D)}</b>. ${hard ? 'The mixed number is rewritten first so that only a single fraction is flipped and multiplied.' : `${name} can cut ${W} full tags, with ${T(N, D)} of a tag's length left over.`}</p>`,
      feedback: {
        correct: `Correct. Rewrite, flip the divisor, multiply, then convert back: ${U.mixedText(W, N, D)}.`,
        wrong(ans) {
          const x = parseNum(ans[0]),
            y = parseNum(ans[1]),
            z = parseNum(ans[2]);
          if (x === W && y != null && z && Math.abs(y / z - N / D) < 1e-9) return 'Your mixed number is equivalent to the answer, but the fraction part is not in simplest form.';
          const wrongFlip = (w * d) / c + (a * d) / (b * c);
          if (x != null && y != null && z && Math.abs(x + y / z - (w + a / b) * (c / d)) < 1e-6) return `You multiplied by ${c}/${d} instead of dividing. Flip the divisor to ${d}/${c} first.`;
          if (x != null && y != null && z && Math.abs(x + y / z - wrongFlip) < 1e-6)
            return `You flipped and multiplied the whole number and the fraction separately. Rewrite ${U.mixedText(w, a, b)} as ${n}/${b} first, then flip only the divisor.`;
          return `Rewrite ${U.mixedText(w, a, b)} as ${n}/${b}. Then ${n}/${b} × ${d}/${c}. Convert the result back to a mixed number.`;
        },
      },
    };
  });

  // ---------- Sort quotients: greater than 1 or less than 1 (sort) ----------
  G.define('e2_sortQuotient', (r) => {
    const pool = [];
    const fr = [
      [1, 2],
      [2, 3],
      [3, 4],
      [1, 3],
      [3, 5],
      [5, 6],
      [1, 4],
      [4, 5],
      [2, 5],
      [5, 8],
    ];
    const seen = new Set();
    const want = [0, 0, 0, 1, 1, 1];
    for (const bin of want) {
      for (let tries = 0; tries < 100; tries++) {
        const [a, b] = r.pick(fr);
        const [c, d] = r.pick(fr);
        const wn = bin === 0 && r.chance(0.5) ? r.int(1, 3) : 0;
        const dividend = wn + a / b;
        if (dividend === c / d) continue;
        if ((dividend > c / d ? 0 : 1) !== bin) continue;
        const key = `${wn}-${a}/${b}-${c}/${d}`;
        if (seen.has(key)) continue;
        seen.add(key);
        pool.push({ html: `${wn ? U.mixed(wn, a, b) : F(a, b)} ÷ ${F(c, d)}`, bin });
        break;
      }
    }
    const items = r.shuffle(pool);
    return {
      type: 'sort',
      skill: 'divide-fractions',
      lesson: '6-2',
      title: 'Estimate before you cut',
      prompt: `<p>A good engineer estimates first. Sort each division expression by the size of its quotient. Do not compute exactly: compare the dividend (first number) with the divisor (second number).</p>`,
      bins: ['Quotient is greater than 1', 'Quotient is less than 1'],
      items,
      hints: [
        'Ask: does the divisor fit into the dividend at least once?',
        'If the first number is bigger than the second, the second fits in more than once, so the quotient is greater than 1.',
        'If the first number is smaller than the second, it fits in less than one time, so the quotient is less than 1.',
      ],
      solution: `<p>When the dividend is larger than the divisor, the quotient is greater than 1. When the dividend is smaller, the quotient is less than 1. For example, ${F(3, 4)} ÷ ${F(1, 2)} is greater than 1 because ${T(1, 2)} fits into ${T(3, 4)} one and a half times, but ${F(1, 4)} ÷ ${F(1, 2)} is less than 1 because ${T(1, 4)} is only half of ${T(1, 2)}.</p>`,
      feedback: {
        correct: 'Correct. Comparing the dividend to the divisor tells you whether the quotient is more or less than 1.',
        wrong(ans, dt) {
          const i = dt.wrong[0];
          const it = items[i];
          return it.bin === 0
            ? 'Look again: in this expression the first number is bigger than the second, so the divisor fits more than once. The quotient is greater than 1.'
            : 'Look again: the first number is smaller than the second, so the divisor fits less than once. The quotient is less than 1.';
        },
      },
    };
  });

  // ---------- Story with mixed numbers, whole-number quotient (mc) ----------
  G.define('e2_storyMixed', (r) => {
    const name = r.pick(NAMES);
    // [w, a, b, c, d, q]: (w a/b) ÷ (c/d) = q whole
    const sets = [
      [4, 1, 2, 3, 4, 6],
      [2, 1, 4, 3, 4, 3],
      [3, 1, 3, 2, 3, 5],
      [1, 1, 2, 3, 8, 4],
      [5, 1, 4, 3, 4, 7],
      [2, 2, 3, 2, 3, 4],
      [1, 3, 4, 1, 4, 7],
      [3, 3, 4, 3, 8, 10],
      [2, 1, 2, 5, 8, 4],
    ];
    const [w, a, b, c, d, q] = r.pick(sets);
    const n = w * b + a;
    const ctx = r.pick([
      [`A board ${U.mixedText(w, a, b)} feet long is cut into shelves that are each ${T(c, d)} foot long.`, 'How many shelves are made?', 'shelves'],
      [`${name} has ${U.mixedText(w, a, b)} cups of resin. Each mold uses ${T(c, d)} cup.`, 'How many molds can be filled?', 'molds'],
      [`A furnace burns for ${U.mixedText(w, a, b)} hours. Each batch of iron takes ${T(c, d)} hour.`, 'How many batches are finished?', 'batches'],
    ]);
    const forgot = simplify(w * d, c); // divided only the whole part
    const mult = simplify(n * c, b * d);
    const opts = [
      { html: `${q} ${ctx[2]}`, ok: true },
      { html: `${mult[1] === 1 ? mult[0] : F(mult[0], mult[1])} ${ctx[2]}`, why: `That is ${U.mixedText(w, a, b)} × ${T(c, d)}. "How many fit" is division, so flip ${T(c, d)} before multiplying.` },
      {
        html: `${forgot[1] === 1 ? forgot[0] : F(forgot[0], forgot[1])} ${ctx[2]}`,
        why: `That only divides the whole number ${w}. Rewrite ${U.mixedText(w, a, b)} as ${T(n, b)} first so the fraction part is included.`,
      },
      { html: `${q + 1} ${ctx[2]}`, why: `Check by multiplying: ${q + 1} × ${T(c, d)} is more than ${U.mixedText(w, a, b)}. There is not enough for that many.` },
    ];
    const texts = opts.map((x) => x.html);
    if (new Set(texts).size < 4) opts[2] = { html: `${q - 1} ${ctx[2]}`, why: `Check: ${q - 1} × ${T(c, d)} leaves some left over. Recompute ${T(n, b)} × ${T(d, c)}.` };
    const sh = shuffleOptions(r, opts, 0);
    return {
      type: 'mc',
      skill: 'divide-mixed',
      lesson: '6-2',
      title: 'Divide with a mixed number',
      prompt: `<p>${ctx[0]}</p><p>${ctx[1]}</p>`,
      options: sh.options,
      answer: sh.answer,
      hints: [
        `Write the division: ${U.mixedText(w, a, b)} ÷ ${T(c, d)}. First rewrite the mixed number as an improper fraction.`,
        `${U.mixedText(w, a, b)} = ${n}/${b}. Then Keep, Change, Flip: ${n}/${b} × ${d}/${c}.`,
        `${n}/${b} × ${d}/${c} = ${n * d}/${b * c}. Simplify to a whole number.`,
      ],
      solution: `<p>${U.mixed(w, a, b)} = ${F(n, b)}. Then ${F(n, b)} ÷ ${F(c, d)} = ${F(n, b)} × ${F(d, c)} = ${F(n * d, b * c)} = <b>${q} ${ctx[2]}</b>. Check: ${q} × ${T(c, d)} = ${U.mixedText(w, a, b)}.</p>`,
      feedback: { correct: `Correct. Rewrite the mixed number first, then Keep, Change, Flip: ${q}.` },
    };
  });
})(typeof window !== 'undefined' ? window : globalThis);

/* js/units/u6/gen-exponents.js */
/* Zone 3 — The Power Dials. Lesson 6-3 Explore Numerical Expressions with Exponents. */
(function (root) {
  'use strict';
  const RX = root.RX;
  const { G, V, fmt, shuffleOptions, NAMES, parseNum } = RX;
  const U = RX.U6;
  const hl = V.hl;
  const P = U.pow; // HTML power
  const PT = U.powText; // plain-text power (unicode superscript)
  const expanded = (b, e) => Array.from({ length: e }, () => String(b)).join(' × ');
  const repeatedAdd = (b, e) => Array.from({ length: e }, () => String(b)).join(' + ');
  const pw = Math.pow;

  const DIAL_CTX = ['the main dial', 'the furnace dial', 'the pressure dial', 'the lift dial', 'the pump dial'];

  // ---------- Repeated factors → power (blanks, template) ----------
  G.define('e3_writePower', (r) => {
    const b = r.pick([2, 3, 4, 5, 6, 7, 8, 9, 10]);
    const e = r.int(2, 5);
    const name = r.pick(NAMES);
    const dial = r.pick(DIAL_CTX);
    return {
      type: 'blanks',
      skill: 'write-powers',
      lesson: '6-3',
      title: 'Write the power',
      prompt: `<p>${name} reads ${dial}: it multiplies by the same factor again and again.</p><p class="big">${hl(expanded(b, e))}</p><p>Write this repeated multiplication as a <b>power</b>. Enter the base and the exponent.</p>`,
      fields: [
        { label: 'base', answer: b, width: 'xs' },
        { label: 'exponent', answer: e, width: 'xs' },
      ],
      template: 'Power: base {0}, exponent {1}',
      hints: [
        'The base is the number that repeats. The exponent counts how many times it is used as a factor.',
        `The factor that repeats is ${b}. Count how many times ${b} is written.`,
        `${b} appears ${e} times, so the exponent is ${e}. The power is ${b} raised to that exponent.`,
      ],
      solution: `<p>${expanded(b, e)} uses ${b} as a factor ${e} times. Written as a power that is <b>${P(b, e)}</b>: the base is ${b} and the exponent is ${e}. The exponent counts factors; it does not multiply the base.</p>`,
      feedback: {
        correct: `Correct. ${expanded(b, e)} = ${PT(b, e)}. The base ${b} is used ${e} times.`,
        wrong(ans) {
          const x = parseNum(ans[0]),
            y = parseNum(ans[1]);
          if (x === e && y === b) return `You swapped them. The base is the number that repeats (${b}). The exponent counts how many times (${e}).`;
          if (x === b && y === pw(b, e)) return `The exponent is a count of factors, not the value. ${b} is written ${e} times.`;
          if (x === b && y === b * e) return `Do not multiply ${b} by the count. The exponent is just the count: ${e}.`;
          return `Which number repeats? That is the base. How many times is it written? That is the exponent.`;
        },
      },
    };
  });

  // ---------- Which expanded form matches the power? (mc) ----------
  G.define('e3_whichExpanded', (r) => {
    const b = r.pick([2, 3, 4, 5, 6, 7, 8, 9]);
    let e = r.int(2, 5);
    if (e === b) e = e === 5 ? 4 : e + 1;
    const opts = [
      { html: expanded(b, e), ok: true },
      { html: `${b} × ${e}`, why: `${PT(b, e)} does not mean ${b} times ${e}. The exponent ${e} tells you to use ${b} as a factor ${e} times.` },
      { html: expanded(e, b), why: `You swapped the base and the exponent. In ${PT(b, e)}, the base ${b} is the number that repeats.` },
      { html: repeatedAdd(b, e), why: `A power means repeated multiplication, not repeated addition. ${repeatedAdd(b, e)} is ${b} × ${e}.` },
    ];
    const sh = shuffleOptions(r, opts, 0);
    return {
      type: 'mc',
      skill: 'write-powers',
      lesson: '6-3',
      title: 'Read the power',
      prompt: `<p>A dial is labeled <span class="big">${P(b, e)}</span>.</p><p>Which expression shows ${hl(PT(b, e))} written as repeated multiplication?</p>`,
      options: sh.options,
      answer: sh.answer,
      hints: [
        'The base is the big number. The exponent is the small raised number. The exponent counts factors.',
        `The base is ${b}. The exponent is ${e}, so ${b} should appear ${e} times.`,
        `Write ${b}, then × ${b}, until you have ${e} copies of ${b} joined by multiplication signs.`,
      ],
      solution: `<p>${P(b, e)} means ${b} used as a factor ${e} times: <b>${expanded(b, e)}</b>. It is not ${b} × ${e}, and it is not ${b} added ${e} times. The exponent is a count of factors.</p>`,
      feedback: { correct: `Correct. ${PT(b, e)} = ${expanded(b, e)}.` },
    };
  });

  // ---------- Match powers to expanded forms (match) ----------
  G.define('e3_matchPowers', (r) => {
    // pick 4 distinct (base, exponent) pairs with distinct expanded forms and distinct power texts
    const pool = [];
    for (const b of [2, 3, 4, 5, 6, 7, 10]) for (const e of [2, 3, 4]) pool.push([b, e]);
    const picked = r.pickN(pool, 4);
    const left = picked.map(([b, e]) => P(b, e));
    const order = r.shuffle([0, 1, 2, 3]);
    const right = order.map((i) => expanded(picked[i][0], picked[i][1]));
    const pairs = picked.map((_, i) => [i, order.indexOf(i)]);
    return {
      type: 'match',
      skill: 'write-powers',
      lesson: '6-3',
      title: 'Match each power to its meaning',
      prompt: `<p>Four dials are labeled with powers. Match each power on the left to the repeated multiplication it stands for.</p><p class="muted">Check the base first, then count the factors.</p>`,
      left,
      right,
      pairs,
      hints: [
        'The base is the number that repeats. The exponent tells how many copies are multiplied.',
        `For ${PT(picked[0][0], picked[0][1])}: the base is ${picked[0][0]}, so look for ${picked[0][0]} written ${picked[0][1]} times.`,
        'Two powers can share a base. Count the factors to tell them apart.',
      ],
      solution: `<p>${picked.map(([b, e]) => `${PT(b, e)} = ${expanded(b, e)}`).join('; ')}. In every case the base is the repeated factor and the exponent is <b>how many</b> factors there are.</p>`,
      feedback: {
        correct: 'Correct. Base = the repeated factor, exponent = the number of factors.',
        wrong(ans, dt) {
          const i = dt.wrong[0];
          const [b, e] = picked[i] || picked[0];
          return `Look at ${PT(b, e)} again. Its base is ${b}, so the matching expression must multiply ${b} by itself, ${e} times.`;
        },
      },
    };
  });

  // ---------- Words for a power (cloze) ----------
  G.define('e3_powerWords', (r) => {
    const b = r.pick([2, 3, 4, 5, 6, 7, 8, 9, 10]);
    let e = r.int(2, 4);
    if (e === b) e = e === 4 ? 3 : e + 1;
    const words = ['squared', 'cubed', 'to the fourth power'];
    const wordChoices = r.shuffle(words);
    const baseChoices = r.shuffle([String(b), String(e), String(b * e)]);
    const expChoices = r.shuffle([String(e), String(b), String(pw(b, e))]);
    const name = r.pick(NAMES);
    return {
      type: 'cloze',
      skill: 'write-powers',
      lesson: '6-3',
      title: 'Say the power in words',
      prompt: `<p>${name} must read the dial <span class="big">${P(b, e)}</span> aloud to the crew.</p><p>Complete the sentence.</p>`,
      template: `${PT(b, e)} is read "${b} {0}." Its base is {1} and its exponent is {2}.`,
      choices: [wordChoices, baseChoices, expChoices],
      answers: [wordChoices.indexOf(U.powerWord(e)), baseChoices.indexOf(String(b)), expChoices.indexOf(String(e))],
      hints: [
        'An exponent of 2 is read "squared," an exponent of 3 is read "cubed," and other exponents are read "to the ___ power."',
        `The base is the large number, ${b}. The exponent is the small raised number.`,
        `The exponent here is ${e}, so the power is read "${b} ${U.powerWord(e)}."`,
      ],
      solution: `<p>${P(b, e)} is read "<b>${b} ${U.powerWord(e)}</b>." The base is <b>${b}</b> (the factor that repeats) and the exponent is <b>${e}</b> (how many times it repeats). Its value is ${expanded(b, e)} = ${fmt(pw(b, e))}.</p>`,
      feedback: {
        correct: `Correct. ${PT(b, e)} is "${b} ${U.powerWord(e)}," with base ${b} and exponent ${e}.`,
        wrong(ans, dt) {
          if (dt.wrong.includes(0)) return `The word depends on the exponent ${e}: 2 is "squared," 3 is "cubed," 4 is "to the fourth power."`;
          if (dt.wrong.includes(1)) return `The base is the big number written first: ${b}.`;
          return `The exponent is the small raised number: ${e}. It is a count, not the value of the power.`;
        },
      },
    };
  });

  // ---------- Evaluate a power (num) ----------
  G.define('e3_evaluate', (r, o) => {
    const hard = !!o.hard;
    let b, e;
    if (hard) {
      [b, e] = r.pick([
        [2, 6],
        [2, 7],
        [3, 4],
        [4, 4],
        [5, 4],
        [6, 3],
        [7, 3],
        [8, 3],
        [9, 3],
        [10, 5],
        [10, 6],
        [12, 2],
        [15, 2],
      ]);
    } else {
      b = r.pick([2, 3, 4, 5, 6, 7, 8, 9, 10]);
      e = b === 10 ? r.int(2, 4) : b >= 6 ? r.int(2, 3) : r.int(2, 4);
    }
    const val = pw(b, e);
    const name = r.pick(NAMES);
    const dial = r.pick(DIAL_CTX);
    const ctx = r.pick([
      `${name} turns ${dial} to ${PT(b, e)}. The dial multiplies the Foundry's power by ${b}, ${e} times in a row.`,
      `A plate on ${dial} reads ${PT(b, e)}.`,
      `${name} finds the setting ${PT(b, e)} scratched into ${dial}.`,
    ]);
    return {
      type: 'num',
      skill: 'evaluate-powers',
      lesson: '6-3',
      title: hard ? 'Find the value of a large power' : 'Find the value of the power',
      prompt: `<p>${ctx}</p><p>What is the value of ${hl(PT(b, e))}?</p>`,
      answer: val,
      hints: [
        `${PT(b, e)} means ${b} used as a factor ${e} times. Write out the factors before multiplying.`,
        `${expanded(b, e)}. Multiply two at a time, left to right.`,
        e === 2 ? `${b} × ${b} = ?` : `${b} × ${b} = ${b * b}. Now keep multiplying by ${b} until all ${e} factors are used.`,
      ],
      solution: `<p>${P(b, e)} = ${expanded(b, e)} = <b>${fmt(val)}</b>. The exponent ${e} is a count of factors, so the value is ${b} multiplied by itself ${e} times, not ${b} × ${e} = ${b * e}.${
        b === 10 ? ` A power of 10 is a 1 followed by ${e} zeros.` : ''
      }</p>`,
      feedback: {
        correct: `Correct. ${expanded(b, e)} = ${fmt(val)}.`,
        wrong(ans, dt) {
          const v = dt.value;
          if (v === b * e) return `${b} × ${e} = ${b * e} multiplies the base by the exponent. Instead, use ${b} as a factor ${e} times: ${expanded(b, e)}.`;
          if (v === pw(e, b)) return `You swapped the base and exponent. ${PT(b, e)} means ${b} repeated ${e} times, not ${e} repeated ${b} times.`;
          if (v === b + e) return `Adding ${b} + ${e} is not what a power means. Multiply: ${expanded(b, e)}.`;
          if (e > 2 && v === pw(b, e - 1)) return `You stopped one factor early. ${PT(b, e)} has ${e} factors of ${b}.`;
          if (v === pw(b, e + 1)) return `You multiplied one time too many. ${PT(b, e)} has exactly ${e} factors of ${b}.`;
          return `Write ${b} as a factor ${e} times and multiply step by step.`;
        },
      },
    };
  });

  // ---------- Error: multiplied the base by the exponent (error) ----------
  G.define('e3_errorTimes', (r) => {
    const name = r.pick(NAMES);
    const b = r.pick([2, 3, 4, 5, 6, 7]);
    let e = r.int(2, 4);
    if (b === e) e = e === 4 ? 3 : e + 1;
    const val = pw(b, e);
    const opts = [
      { html: `${name} multiplied the base by the exponent. The exponent ${e} means use ${b} as a factor ${e} times: ${expanded(b, e)}.`, ok: true },
      { html: `${name} should have added ${b} + ${e}.`, why: `A power is repeated multiplication, never addition of the base and exponent.` },
      { html: `${name} should have used ${e} as the base: ${expanded(e, b)}.`, why: `The base is the big number, ${b}. The small raised number ${e} is the exponent, which counts the factors.` },
      { html: `The work is correct. ${PT(b, e)} and ${b} × ${e} mean the same thing.`, why: `They do not. ${PT(b, e)} = ${expanded(b, e)} = ${val}, but ${b} × ${e} = ${b * e}.` },
    ];
    const sh = shuffleOptions(r, opts, 0);
    return {
      type: 'error',
      skill: 'evaluate-powers',
      lesson: '6-3',
      title: 'Find the mistake',
      prompt: `<p>${name} set a dial to ${hl(PT(b, e))} and wrote this work. The dial did not glow.</p><p>What went wrong?</p>`,
      work: `${P(b, e)} = ${b} × ${e} = ${b * e}`,
      options: sh.options,
      answer: sh.answer,
      fix: { label: `The correct value of ${PT(b, e)} is`, answer: val },
      hints: [`What does the exponent ${e} tell you to do with the base ${b}?`, `The exponent counts factors. ${PT(b, e)} = ${expanded(b, e)}.`, `Multiply ${expanded(b, e)} step by step.`],
      solution: `<p>${name} treated the exponent as a factor and computed ${b} × ${e}. The exponent is a <b>count</b>: ${P(b, e)} = ${expanded(b, e)} = <b>${val}</b>.</p>`,
      feedback: {
        correct: `Correct. ${PT(b, e)} means ${expanded(b, e)} = ${val}, not ${b} × ${e}.`,
        wrong(ans, dt) {
          if (!dt.mistakeOk) return (sh.options[ans.mistake] && sh.options[ans.mistake].why) || `Compare ${b} × ${e} with what the exponent really means.`;
          return `You found the mistake. For the fix: ${expanded(b, e)} = ?`;
        },
      },
    };
  });

  // ---------- Order powers by value (seq) ----------
  G.define('e3_seqOrder', (r) => {
    const pool = [
      [2, 3],
      [2, 4],
      [2, 5],
      [2, 6],
      [3, 2],
      [3, 3],
      [3, 4],
      [4, 2],
      [4, 3],
      [5, 2],
      [5, 3],
      [6, 2],
      [7, 2],
      [10, 2],
      [8, 2],
      [9, 2],
    ];
    let picked;
    for (let tries = 0; tries < 60; tries++) {
      picked = r.pickN(pool, 3);
      const vals = picked.map(([b, e]) => pw(b, e));
      if (new Set(vals).size === 3) break;
    }
    const asc = r.chance(0.5);
    const items = picked.map(([b, e]) => ({ html: `<span class="big">${P(b, e)}</span>`, rate: pw(b, e) }));
    const order = [0, 1, 2].sort((x, y) => (asc ? items[x].rate - items[y].rate : items[y].rate - items[x].rate));
    return {
      type: 'seq',
      skill: 'evaluate-powers',
      lesson: '6-3',
      title: 'Order the dials by value',
      prompt: `<p>Three dials are labeled with powers. Order them from <b>${asc ? 'least' : 'greatest'}</b> value (top) to <b>${asc ? 'greatest' : 'least'}</b> value (bottom).</p><p class="muted">A bigger exponent does not always mean a bigger value. Find each value first.</p>`,
      items,
      order,
      hints: [
        'Find the value of each power before you compare. The exponent counts how many times the base is multiplied.',
        `Values: ${picked.map(([b, e]) => `${PT(b, e)} = ${pw(b, e)}`).join('; ')}.`,
        `${asc ? 'Smallest' : 'Largest'} first: ${order.map((i) => pw(picked[i][0], picked[i][1])).join(', ')}.`,
      ],
      solution: `<p>${picked.map(([b, e]) => `${PT(b, e)} = ${expanded(b, e)} = ${pw(b, e)}`).join('; ')}. From ${asc ? 'least to greatest' : 'greatest to least'}: <b>${order.map((i) => PT(picked[i][0], picked[i][1])).join(', ')}</b>. You cannot compare powers by looking at the exponents alone.</p>`,
      feedback: {
        correct: 'Correct. Evaluating each power first is the only safe way to compare them.',
        wrong() {
          return `Find each value: ${picked.map(([b, e]) => `${PT(b, e)} = ${pw(b, e)}`).join(', ')}. Then put the ${asc ? 'least' : 'greatest'} at the top.`;
        },
      },
    };
  });

  // ---------- Squares and cubes table (table) ----------
  G.define('e3_perfectSquares', (r) => {
    const start = r.int(2, 6);
    const ns = [start, start + 1, start + 2];
    const rows = [['n', `n${U.supText(2)} (n squared)`, `n${U.supText(3)} (n cubed)`]];
    const inputs = [];
    // In one row the square is given and n is asked; the others ask for the square and cube.
    const askRow = r.int(0, 2);
    ns.forEach((n, i) => {
      if (i === askRow) {
        rows.push([`__IN:n${i}__`, String(n * n), String(n * n * n)]);
        inputs.push({ id: `n${i}`, answer: n });
      } else {
        rows.push([String(n), `__IN:s${i}__`, `__IN:c${i}__`]);
        inputs.push({ id: `s${i}`, answer: n * n }, { id: `c${i}`, answer: n * n * n });
      }
    });
    const nAsk = ns[askRow];
    return {
      type: 'table',
      skill: 'evaluate-powers',
      lesson: '6-3',
      title: 'Complete the squares and cubes table',
      prompt: `<p>The dial maker keeps a table of squares and cubes for the bases ${hl(ns.filter((_, i) => i !== askRow).join(' and '))} and one more base. Complete it. In one row the square and cube are given and the base <b>n</b> is missing.</p><p class="muted">n squared means n × n. n cubed means n × n × n.</p>`,
      rows,
      header: true,
      inputs,
      hints: [
        'To square a number, multiply it by itself. To cube it, multiply it by itself twice (three factors).',
        `For the missing base: which number times itself equals ${nAsk * nAsk}?`,
        `${ns
          .filter((_, i) => i !== askRow)
          .map((n) => `${n} × ${n} = ${n * n} and ${n} × ${n} × ${n} = ${n * n * n}`)
          .join('; ')}.`,
      ],
      solution: `<p>${ns.map((n) => `${PT(n, 2)} = ${n * n}, ${PT(n, 3)} = ${n * n * n}`).join('; ')}. The missing base is <b>${nAsk}</b>, because ${nAsk} × ${nAsk} = ${nAsk * nAsk}. Squaring and cubing are repeated multiplication, so ${PT(nAsk, 3)} is ${nAsk} times as big as ${PT(nAsk, 2)}.</p>`,
      feedback: {
        correct: 'Correct. Square = two equal factors, cube = three equal factors.',
        wrong(ans, dt) {
          const w = dt.wrong[0] || '';
          if (w.startsWith('n')) return `The square is ${nAsk * nAsk}. Which number multiplied by itself gives ${nAsk * nAsk}?`;
          if (w.startsWith('s')) return 'For n squared, multiply n × n. Do not multiply n × 2.';
          return 'For n cubed, multiply n × n × n. Do not multiply n × 3.';
        },
      },
    };
  });
})(typeof window !== 'undefined' ? window : globalThis);

/* js/units/u6/gen-numeric.js */
/* Zone 4 — The Sequencer. Lesson 6-4 Write and Evaluate Numerical Expressions with Exponents. */
(function (root) {
  'use strict';
  const RX = root.RX;
  const { G, V, shuffleOptions, NAMES } = RX;
  const U = RX.U6;
  const hl = V.hl;
  const PT = U.powText;
  const sq = (x) => x * x;

  /**
   * Word-phrase templates. Each returns { words, text, value, wrong:[{text, why}] }.
   * text uses × ÷ − and unicode superscripts so it reads the same in prompts, options and hl().
   */
  const PHRASES = [
    (r) => {
      const k = r.int(2, 6),
        a = r.int(3, 12),
        b = r.int(2, 9);
      return {
        words: `${k} times the sum of ${a} and ${b}`,
        text: `${k} × (${a} + ${b})`,
        value: k * (a + b),
        wrong: [
          { text: `${k} × ${a} + ${b}`, why: `"The sum of ${a} and ${b}" is one quantity, so it needs parentheses. Without them, only ${a} is multiplied by ${k}.` },
          { text: `${k} + ${a} + ${b}`, why: `"Times" means multiply. ${k} multiplies the whole sum.` },
          { text: `${k} × (${a} × ${b})`, why: `"Sum" means add. The quantity inside the parentheses is ${a} + ${b}.` },
        ],
      };
    },
    (r) => {
      const a = r.int(6, 15),
        b = r.int(1, 5);
      return {
        words: `the square of the difference of ${a} and ${b}`,
        text: `(${a} − ${b})${U.supText(2)}`,
        value: sq(a - b),
        wrong: [
          { text: `${a} − ${b}${U.supText(2)}`, why: `Only ${b} is squared here. "The square of the difference" squares the whole difference, so the subtraction needs parentheses.` },
          { text: `(${a} − ${b}) × 2`, why: `Squaring means multiplying the quantity by itself, not by 2.` },
          { text: `${a}${U.supText(2)} − ${b}${U.supText(2)}`, why: `That squares each number separately. The difference is found first, then squared.` },
        ],
      };
    },
    (r) => {
      const a = r.int(2, 9),
        b = r.int(3, 20);
      return {
        words: `the sum of ${a} squared and ${b}`,
        text: `${a}${U.supText(2)} + ${b}`,
        value: sq(a) + b,
        wrong: [
          { text: `(${a} + ${b})${U.supText(2)}`, why: `Only ${a} is squared. "The sum of ${a} squared and ${b}" adds ${b} after squaring.` },
          { text: `${a} × 2 + ${b}`, why: `"${a} squared" means ${a} × ${a}, not ${a} × 2.` },
          { text: `${a}${U.supText(2)} × ${b}`, why: `"Sum" means add, not multiply.` },
        ],
      };
    },
    (r) => {
      const b = r.int(2, 6),
        c = r.int(1, 6),
        q = r.int(2, 8);
      const a = (b + c) * q;
      return {
        words: `the quotient of ${a} and the sum of ${b} and ${c}`,
        text: `${a} ÷ (${b} + ${c})`,
        value: q,
        wrong: [
          { text: `${a} ÷ ${b} + ${c}`, why: `The divisor is the whole sum ${b} + ${c}, so it needs parentheses.` },
          { text: `(${a} + ${b}) ÷ ${c}`, why: `The quotient is ${a} divided by a sum. ${a} is not part of the sum.` },
          { text: `(${b} + ${c}) ÷ ${a}`, why: `"The quotient of ${a} and ..." puts ${a} first: ${a} is divided by the sum.` },
        ],
      };
    },
    (r) => {
      const k = r.int(2, 6),
        a = r.int(3, 9),
        b = r.int(1, 7);
      return {
        words: `${b} less than the product of ${k} and ${a}`,
        text: `${k} × ${a} − ${b}`,
        value: k * a - b,
        wrong: [
          { text: `${b} − ${k} × ${a}`, why: `"${b} less than" a quantity means start with the quantity and subtract ${b}. The order flips.` },
          { text: `${k} × (${a} − ${b})`, why: `${b} is subtracted from the whole product, not from ${a} before multiplying.` },
          { text: `${k} + ${a} − ${b}`, why: `"Product" means multiply ${k} and ${a}.` },
        ],
      };
    },
    (r) => {
      const a = r.int(6, 15),
        b = r.int(1, 5);
      return {
        words: `twice the difference of ${a} and ${b}`,
        text: `2 × (${a} − ${b})`,
        value: 2 * (a - b),
        wrong: [
          { text: `2 × ${a} − ${b}`, why: `"The difference of ${a} and ${b}" is one quantity, so it needs parentheses before doubling.` },
          { text: `(${a} − ${b})${U.supText(2)}`, why: `"Twice" means multiply by 2. Squaring multiplies the quantity by itself.` },
          { text: `2 + ${a} − ${b}`, why: `"Twice" means two times, not add 2.` },
        ],
      };
    },
    (r) => {
      const a = r.int(2, 5),
        c = r.int(2, 20);
      return {
        words: `${c} more than the cube of ${a}`,
        text: `${a}${U.supText(3)} + ${c}`,
        value: a * a * a + c,
        wrong: [
          { text: `(${a} + ${c})${U.supText(3)}`, why: `Only ${a} is cubed. ${c} is added after cubing.` },
          { text: `${a} × 3 + ${c}`, why: `"The cube of ${a}" means ${a} × ${a} × ${a}, not ${a} × 3.` },
          { text: `${a}${U.supText(3)} × ${c}`, why: `"More than" means add.` },
        ],
      };
    },
  ];
  const phrase = (r) => r.pick(PHRASES)(r);

  // ---------- Words → expression (mc) ----------
  G.define('e4_wordsToExpr', (r) => {
    const p = phrase(r);
    const name = r.pick(NAMES);
    const opts = [{ html: p.text, ok: true }].concat(p.wrong.map((w) => ({ html: w.text, why: w.why })));
    const sh = shuffleOptions(r, opts, 0);
    return {
      type: 'mc',
      skill: 'numeric-expressions',
      lesson: '6-4',
      title: 'Write the expression',
      prompt: `<p>${name} reads the sequencer card: "<b>${p.words}</b>."</p><p>Which numerical expression matches the words?</p>`,
      options: sh.options,
      answer: sh.answer,
      hints: [
        'Find the key words first: sum (+), difference (−), product (×), quotient (÷), squared or cubed (exponent).',
        'A phrase like "the sum of ..." or "the difference of ..." names one quantity. If something is done to that whole quantity, it needs parentheses.',
        `The quantity named by the words is handled first. Which option groups it the way the words do? Its value is ${p.value}.`,
      ],
      solution: `<p>"${p.words}" is <b>${p.text}</b>. Each operation word becomes a symbol, and a quantity that is named as a whole (a sum, a difference) is grouped in parentheses. Its value is ${p.value}.</p>`,
      feedback: { correct: `Correct. "${p.words}" = ${p.text}.` },
    };
  });

  // ---------- Match expressions to word phrases (match) ----------
  G.define('e4_exprToWords', (r) => {
    let ps;
    for (let tries = 0; tries < 50; tries++) {
      ps = r.pickN(PHRASES, 4).map((f) => f(r));
      const texts = ps.map((p) => p.text),
        words = ps.map((p) => p.words);
      if (new Set(texts).size === 4 && new Set(words).size === 4) break;
    }
    const left = ps.map((p) => p.text);
    const order = r.shuffle([0, 1, 2, 3]);
    const right = order.map((i) => ps[i].words);
    const pairs = ps.map((_, i) => [i, order.indexOf(i)]);
    return {
      type: 'match',
      skill: 'numeric-expressions',
      lesson: '6-4',
      title: 'Match each expression to its words',
      prompt: `<p>Four sequencer cards were separated from their expressions. Match each expression on the left to the words that describe it.</p>`,
      left,
      right,
      pairs,
      hints: [
        'Translate the symbols: + is a sum, − is a difference, × is a product, ÷ is a quotient, a small raised 2 is "squared."',
        'Parentheses mean the words name that part as one quantity, such as "the sum of ..." or "the difference of ..."',
        `For example, ${ps[0].text} is "${ps[0].words}."`,
      ],
      solution: `<p>${ps.map((p) => `${p.text} → "${p.words}"`).join('; ')}. The grouping in each expression matches the quantity that the words name as a whole.</p>`,
      feedback: {
        correct: 'Correct. Operation words map to symbols, and named quantities map to parentheses.',
        wrong(ans, dt) {
          const i = dt.wrong[0];
          const p = ps[i] || ps[0];
          return `Look at ${p.text}. ${/\(/.test(p.text) ? 'The parentheses mean the words name that part as one quantity.' : 'There are no parentheses, so the exponent or operation applies to a single number.'}`;
        },
      },
    };
  });

  // ---------- Words → evaluate (num) ----------
  G.define('e4_wordsEvaluate', (r) => {
    const p = phrase(r);
    const name = r.pick(NAMES);
    const ctx = r.pick([
      `The sequencer card says the next machine fires after "<b>${p.words}</b>" seconds.`,
      `${name} hears the foreman call out "<b>${p.words}</b>."`,
      `A brass tag reads "<b>${p.words}</b>."`,
    ]);
    return {
      type: 'num',
      skill: 'numeric-expressions',
      lesson: '6-4',
      title: 'Write, then evaluate',
      prompt: `<p>${ctx}</p><p>Write the numerical expression, then find its value.</p>`,
      answer: p.value,
      hints: [
        'First write the expression. Turn each operation word into a symbol and group any named quantity in parentheses.',
        `The expression is ${p.text}.`,
        'Evaluate in order: parentheses first, then exponents, then multiply or divide, then add or subtract.',
      ],
      solution: `<p>"${p.words}" → ${p.text}. Evaluate using the order of operations: the value is <b>${p.value}</b>.</p>`,
      feedback: {
        correct: `Correct. ${p.text} = ${p.value}.`,
        wrong(ans, dt) {
          const v = dt.value;
          const hit = p.wrong.find((w) => {
            try {
              return v != null && Math.abs(v - evalText(w.text)) < 1e-6;
            } catch (e) {
              return false;
            }
          });
          if (hit) return hit.why;
          return `Write the expression first: ${p.text}. Then follow the order of operations.`;
        },
      },
    };
  });

  /** Evaluate the simple expression strings this file writes (digits, + − × ÷, parentheses, unicode superscripts). Not eval(). */
  function evalText(txt) {
    const SUPS = '⁰¹²³⁴⁵⁶⁷⁸⁹';
    let i = 0;
    const s = txt.replace(/\s+/g, '');
    const peek = () => s[i];
    const num = () => {
      let j = i;
      while (j < s.length && /[0-9.]/.test(s[j])) j++;
      const v = Number(s.slice(i, j));
      i = j;
      return v;
    };
    const atom = () => {
      let v;
      if (peek() === '(') {
        i++;
        v = expr();
        i++; // ')'
      } else v = num();
      while (i < s.length && SUPS.includes(peek())) {
        let e = 0;
        while (i < s.length && SUPS.includes(peek())) {
          e = e * 10 + SUPS.indexOf(peek());
          i++;
        }
        v = Math.pow(v, e);
      }
      return v;
    };
    const term = () => {
      let v = atom();
      while (peek() === '×' || peek() === '÷') {
        const op = s[i++];
        const w = atom();
        v = op === '×' ? v * w : v / w;
      }
      return v;
    };
    const expr = () => {
      let v = term();
      while (peek() === '+' || peek() === '−') {
        const op = s[i++];
        const w = term();
        v = op === '+' ? v + w : v - w;
      }
      return v;
    };
    return expr();
  }

  // ---------- Who wrote it correctly? (who) ----------
  G.define('e4_whoWrote', (r) => {
    const p = phrase(r);
    const [n1, n2, n3] = r.pickN(NAMES, 3);
    const wrongs = r.pickN(p.wrong, 2);
    const opts = [
      { html: `<b>${n1}:</b> ${p.text}`, ok: true },
      { html: `<b>${n2}:</b> ${wrongs[0].text}`, why: wrongs[0].why },
      { html: `<b>${n3}:</b> ${wrongs[1].text}`, why: wrongs[1].why },
    ];
    const sh = shuffleOptions(r, opts, 0);
    return {
      type: 'who',
      skill: 'numeric-expressions',
      lesson: '6-4',
      title: 'Who wrote the expression correctly?',
      prompt: `<p>Three apprentices each wrote an expression for "<b>${p.words}</b>."</p><p>Who is correct?</p>`,
      options: sh.options,
      answer: sh.answer,
      layout: 'cards',
      hints: [
        'Read the words slowly. Which operation comes first, and which quantity is named as a whole?',
        'Check parentheses: a named sum or difference must be grouped before anything else is done to it. Check "less than": it reverses the order.',
        `The correct expression has the value ${p.value}. Evaluate each student's expression to compare.`,
      ],
      solution: `<p>${n1} is correct: "${p.words}" = <b>${p.text}</b>, which equals ${p.value}. ${n2}: ${wrongs[0].why} ${n3}: ${wrongs[1].why}</p>`,
      feedback: { correct: `Correct. ${n1} grouped the quantities the way the words describe them.` },
    };
  });

  /** Order-of-operations expression templates: return { text, value, steps:[...], ltr (left-to-right wrong value), baseTimes (base×exponent wrong value) }. */
  function orderExpr(r, hard) {
    const a = r.int(2, 9),
      b = r.int(2, 5),
      c = r.int(2, 6),
      d = r.int(2, 5);
    const pick = r.int(0, hard ? 2 : 3);
    if (!hard) {
      if (pick === 0) {
        // a + b² × c
        return {
          text: `${a} + ${PT(b, 2)} × ${c}`,
          value: a + sq(b) * c,
          steps: [`${PT(b, 2)} = ${sq(b)}`, `${sq(b)} × ${c} = ${sq(b) * c}`, `${a} + ${sq(b) * c} = ${a + sq(b) * c}`],
          ltr: sq(a + b) * c,
          baseTimes: a + b * 2 * c,
        };
      }
      if (pick === 1) {
        // (a + b)² − c
        return {
          text: `(${a} + ${b})${U.supText(2)} − ${c}`,
          value: sq(a + b) - c,
          steps: [`${a} + ${b} = ${a + b}`, `${PT(a + b, 2)} = ${sq(a + b)}`, `${sq(a + b)} − ${c} = ${sq(a + b) - c}`],
          ltr: sq(a + b) - c,
          baseTimes: (a + b) * 2 - c,
        };
      }
      if (pick === 2) {
        // a × (b + c)² with small numbers
        const bb = r.int(1, 4),
          cc = r.int(1, 4),
          aa = r.int(2, 4);
        return {
          text: `${aa} × (${bb} + ${cc})${U.supText(2)}`,
          value: aa * sq(bb + cc),
          steps: [`${bb} + ${cc} = ${bb + cc}`, `${PT(bb + cc, 2)} = ${sq(bb + cc)}`, `${aa} × ${sq(bb + cc)} = ${aa * sq(bb + cc)}`],
          ltr: sq(aa * (bb + cc)),
          baseTimes: aa * (bb + cc) * 2,
        };
      }
      // a² − b × c (keep positive)
      const aa = r.int(5, 9),
        bb = r.int(2, 4),
        cc = r.int(2, 5);
      return {
        text: `${PT(aa, 2)} − ${bb} × ${cc}`,
        value: sq(aa) - bb * cc,
        steps: [`${PT(aa, 2)} = ${sq(aa)}`, `${bb} × ${cc} = ${bb * cc}`, `${sq(aa)} − ${bb * cc} = ${sq(aa) - bb * cc}`],
        ltr: (sq(aa) - bb) * cc,
        baseTimes: aa * 2 - bb * cc,
      };
    }
    if (pick === 0) {
      // a × (b + c)² − d ÷ ... keep integer: a × (b + c)² − e where e = d × 2
      const e = d * 2;
      return {
        text: `${a} × (${b} + ${c})${U.supText(2)} − ${e} ÷ 2`,
        value: a * sq(b + c) - e / 2,
        steps: [`${b} + ${c} = ${b + c}`, `${PT(b + c, 2)} = ${sq(b + c)}`, `${a} × ${sq(b + c)} = ${a * sq(b + c)} and ${e} ÷ 2 = ${e / 2}`, `${a * sq(b + c)} − ${e / 2} = ${a * sq(b + c) - e / 2}`],
        ltr: (sq(a * (b + c)) - e) / 2,
        baseTimes: a * (b + c) * 2 - e / 2,
      };
    }
    if (pick === 1) {
      // (a² − b) ÷ c + d  → choose so divisible: pick a, then c | (a² − b)
      const aa = r.int(4, 9);
      const cc = r.pick([2, 3, 4, 5]);
      let bb = (sq(aa) % cc) + cc * r.int(0, 1);
      if (bb === 0) bb = cc;
      if (bb >= sq(aa)) bb = sq(aa) % cc || cc;
      const q = (sq(aa) - bb) / cc;
      return {
        text: `(${PT(aa, 2)} − ${bb}) ÷ ${cc} + ${d}`,
        value: q + d,
        steps: [`${PT(aa, 2)} = ${sq(aa)}`, `${sq(aa)} − ${bb} = ${sq(aa) - bb}`, `${sq(aa) - bb} ÷ ${cc} = ${q}`, `${q} + ${d} = ${q + d}`],
        ltr: (sq(aa) - bb) / cc + d,
        baseTimes: (aa * 2 - bb) / cc + d,
      };
    }
    // a + (b − 1)³ × c
    const bb = r.int(3, 5);
    const cube = (bb - 1) ** 3;
    return {
      text: `${a} + (${bb} − 1)${U.supText(3)} × ${c}`,
      value: a + cube * c,
      steps: [`${bb} − 1 = ${bb - 1}`, `${PT(bb - 1, 3)} = ${cube}`, `${cube} × ${c} = ${cube * c}`, `${a} + ${cube * c} = ${a + cube * c}`],
      ltr: (a + bb - 1) ** 3 * c,
      baseTimes: a + (bb - 1) * 3 * c,
    };
  }

  // ---------- Evaluate with the order of operations (num) ----------
  G.define('e4_evalOrder', (r, o) => {
    const hard = !!o.hard;
    const ex = orderExpr(r, hard);
    const name = r.pick(NAMES);
    const ctx = r.pick([`The sequencer plate reads ${hl(ex.text)}.`, `${name} must set the firing count to the value of ${hl(ex.text)}.`, `A timing card shows ${hl(ex.text)}.`]);
    return {
      type: 'num',
      skill: 'order-ops',
      lesson: '6-4',
      title: hard ? 'Evaluate (more steps)' : 'Evaluate in the right order',
      prompt: `<p>${ctx}</p><p>Find the value of the expression.</p>`,
      answer: ex.value,
      hints: [
        'Order of operations: grouping symbols first, then exponents, then multiply and divide left to right, then add and subtract left to right.',
        `Step 1: ${ex.steps[0]}. Step 2: ${ex.steps[1]}.`,
        `${ex.steps.slice(0, -1).join('. ')}. One operation remains.`,
      ],
      solution: `<p>${ex.text}. ${ex.steps.map((s, i) => `Step ${i + 1}: ${s}`).join('. ')}. The value is <b>${ex.value}</b>. Exponents are evaluated before multiplying, and parentheses come before everything.</p>`,
      feedback: {
        correct: `Correct. ${ex.text} = ${ex.value}.`,
        wrong(ans, dt) {
          const v = dt.value;
          if (v != null && Math.abs(v - ex.ltr) < 1e-6 && ex.ltr !== ex.value) return 'You worked left to right. Do grouping symbols first, then exponents, then × and ÷, then + and −.';
          if (v != null && Math.abs(v - ex.baseTimes) < 1e-6) return 'Check the power. An exponent counts factors: 4² is 4 × 4 = 16, not 4 × 2.';
          return `Start again: ${ex.steps[0]}. Then follow the order of operations one step at a time.`;
        },
      },
    };
  });

  // ---------- Steps as a cloze (cloze) ----------
  G.define('e4_stepsCloze', (r) => {
    const a = r.int(1, 6),
      b = r.int(1, 5),
      c = r.int(2, 5),
      d = r.int(2, 4);
    const s1 = a + b,
      s2 = sq(s1),
      s3 = c * d,
      val = s2 - s3;
    const text = `(${a} + ${b})${U.supText(2)} − ${c} × ${d}`;
    const c0 = r.shuffle([String(s1), String(a * b), String(s1 + 1)].filter((v, i, arr) => arr.indexOf(v) === i));
    const c1 = r.shuffle([String(s2), String(s1 * 2), String(sq(a) + sq(b))].filter((v, i, arr) => arr.indexOf(v) === i));
    const c2 = r.shuffle([String(val), String((s2 - c) * d), String(s1 * 2 - s3)].filter((v, i, arr) => arr.indexOf(v) === i));
    return {
      type: 'cloze',
      skill: 'order-ops',
      lesson: '6-4',
      title: 'Complete the steps',
      prompt: `<p>Evaluate ${hl(text)} one step at a time. Complete each step.</p>`,
      template: `Grouping symbols first: ${a} + ${b} = {0}.  Exponent next: ${PT(s1, 2)} = {1}.  Multiply: ${c} × ${d} = ${s3}.  Subtract last: the value is {2}.`,
      choices: [c0, c1, c2],
      answers: [c0.indexOf(String(s1)), c1.indexOf(String(s2)), c2.indexOf(String(val))],
      hints: ['Parentheses come first. Add the two numbers inside.', `Then square the sum: ${s1} × ${s1}. Squaring is not the same as doubling.`, `${s2} − ${s3} is the last step.`],
      solution: `<p>${text}: parentheses give ${a} + ${b} = ${s1}; the exponent gives ${PT(s1, 2)} = ${s2}; multiplying gives ${c} × ${d} = ${s3}; subtracting last gives ${s2} − ${s3} = <b>${val}</b>. Each step follows the order of operations.</p>`,
      feedback: {
        correct: `Correct. Parentheses, exponent, multiply, then subtract: ${val}.`,
        wrong(ans, dt) {
          if (dt.wrong.includes(0)) return `Inside the parentheses is addition: ${a} + ${b}.`;
          if (dt.wrong.includes(1)) return `${PT(s1, 2)} means ${s1} × ${s1}, not ${s1} × 2.`;
          return `Finish with ${s2} − ${s3}. Multiplication happens before subtraction.`;
        },
      },
    };
  });

  // ---------- Error: wrong order or wrong power (error) ----------
  G.define('e4_errorOrder', (r) => {
    const name = r.pick(NAMES);
    const a = r.int(2, 9),
      b = r.int(2, 4),
      c = r.int(2, 5);
    const text = `${a} + ${PT(b, 2)} × ${c}`;
    const val = a + sq(b) * c;
    const kind = r.pick(['addFirst', 'baseTimes']);
    const work =
      kind === 'addFirst'
        ? `${a} + ${PT(b, 2)} × ${c} = ${PT(a + b, 2)} × ${c} = ${sq(a + b)} × ${c} = ${sq(a + b) * c}`
        : `${a} + ${PT(b, 2)} × ${c} = ${a} + ${b * 2} × ${c} = ${a} + ${b * 2 * c} = ${a + b * 2 * c}`;
    const opts = [
      {
        html:
          kind === 'addFirst'
            ? `${name} added ${a} + ${b} first. Exponents and multiplication come before addition.`
            : `${name} computed ${PT(b, 2)} as ${b} × 2. The exponent means ${b} × ${b} = ${sq(b)}.`,
        ok: true,
      },
      {
        html: kind === 'addFirst' ? `${name} computed ${PT(b, 2)} as ${b} × 2.` : `${name} added ${a} + ${b * 2} too early.`,
        why:
          kind === 'addFirst'
            ? `The power was handled correctly in the work. The mistake is the order: addition was done first.`
            : `The order of the steps is fine. The mistake is in the value of ${PT(b, 2)}.`,
      },
      { html: `${name} should have multiplied ${a} × ${c} first.`, why: `${a} and ${c} are not next to each other in the expression. Only ${PT(b, 2)} is multiplied by ${c}.` },
      { html: `The work is correct.`, why: `It is not. Following the order of operations, ${text} = ${a} + ${sq(b)} × ${c} = ${val}.` },
    ];
    const sh = shuffleOptions(r, opts, 0);
    return {
      type: 'error',
      skill: 'order-ops',
      lesson: '6-4',
      title: 'Find the mistake',
      prompt: `<p>${name} evaluated ${hl(text)} for the sequencer. The line misfired.</p><p>What is the mistake?</p>`,
      work,
      options: sh.options,
      answer: sh.answer,
      fix: { label: 'The correct value is', answer: val },
      hints: [
        'Check the order: grouping symbols, exponents, multiply/divide, add/subtract. Then check each power.',
        `There are no parentheses, so the first step is the exponent: ${PT(b, 2)} = ${b} × ${b}.`,
        `${a} + ${sq(b)} × ${c} → multiply first: ${sq(b) * c}. Then add ${a}.`,
      ],
      solution: `<p>${kind === 'addFirst' ? `${name} added before handling the exponent and the multiplication.` : `${name} multiplied the base by the exponent instead of squaring.`} Correct work: ${text} = ${a} + ${sq(b)} × ${c} = ${a} + ${sq(b) * c} = <b>${val}</b>.</p>`,
      feedback: {
        correct: `Correct. ${text} = ${a} + ${sq(b) * c} = ${val}.`,
        wrong(ans, dt) {
          if (!dt.mistakeOk) return (sh.options[ans.mistake] && sh.options[ans.mistake].why) || 'Compare each step with the order of operations.';
          return `You found the mistake. For the fix: ${PT(b, 2)} = ${sq(b)}, then ${sq(b)} × ${c}, then add ${a}.`;
        },
      },
    };
  });

  // ---------- Grouping changes the value (table) ----------
  G.define('e4_tableEval', (r) => {
    const a = r.int(2, 6),
      b = r.int(1, 5);
    const exprs = [
      [`${a} + ${PT(b, 2)}`, a + sq(b)],
      [`(${a} + ${b})${U.supText(2)}`, sq(a + b)],
      [`${PT(a, 2)} + ${PT(b, 2)}`, sq(a) + sq(b)],
      [`${a} × ${PT(b, 2)}`, a * sq(b)],
    ];
    const rows = [['Expression', 'Value']];
    const inputs = [];
    exprs.forEach(([t], i) => {
      rows.push([t, `__IN:v${i}__`]);
      inputs.push({ id: `v${i}`, answer: exprs[i][1] });
    });
    return {
      type: 'table',
      skill: 'order-ops',
      lesson: '6-4',
      title: 'Same numbers, different values',
      prompt: `<p>Four sequencer cards use the same numbers, ${hl(a)} and ${hl(b)}, but group them differently. Complete the table of values.</p>`,
      rows,
      header: true,
      inputs,
      hints: [
        'Grouping symbols first, then exponents, then multiply, then add.',
        `${PT(b, 2)} = ${sq(b)} and ${PT(a, 2)} = ${sq(a)}. In (${a} + ${b})${U.supText(2)}, add first and then square.`,
        `${exprs
          .slice(0, 3)
          .map(([t, v]) => `${t} = ${v}`)
          .join('; ')}. One row remains.`,
      ],
      solution: `<p>${exprs.map(([t, v]) => `${t} = <b>${v}</b>`).join('; ')}. The parentheses change which operation happens first, so the same two numbers give different values.</p>`,
      feedback: {
        correct: 'Correct. Parentheses change the order, and the order changes the value.',
        wrong(ans, dt) {
          const w = dt.wrong[0];
          if (w === 'v1') return `For (${a} + ${b})${U.supText(2)}, add inside the parentheses first, then square the sum.`;
          if (w === 'v0') return `For ${a} + ${PT(b, 2)}, square ${b} first (${b} × ${b}), then add ${a}.`;
          if (w === 'v3') return `For ${a} × ${PT(b, 2)}, square ${b} first, then multiply by ${a}.`;
          return `For ${PT(a, 2)} + ${PT(b, 2)}, square each number, then add.`;
        },
      },
    };
  });
})(typeof window !== 'undefined' ? window : globalThis);

/* js/units/u6/gen-algebraic.js */
/* Zone 5 — The Expression Plates. Lesson 6-5 Write and Evaluate Algebraic Expressions. */
(function (root) {
  'use strict';
  const RX = root.RX;
  const { G, V, round, fmt, shuffleOptions, NAMES, parseNum } = RX;
  const U = RX.U6;
  const hl = V.hl;
  const PT = U.powText;
  const VARS = ['n', 'x', 'm', 'k', 'p'];
  const sq = (x) => x * x;

  /** Word phrases → algebraic expressions. Returns { words, text, value(v), wrong:[{text, why}] }. */
  const ALG = [
    (r, v) => {
      const k = r.int(2, 9);
      let c = r.int(1, 12);
      if (c === k) c += 1; // keep the swapped-coefficient distractor distinct
      return {
        words: `${c} more than ${k} times a number ${v}`,
        text: `${k}${v} + ${c}`,
        value: (x) => k * x + c,
        wrong: [
          { text: `${k}(${v} + ${c})`, why: `Here ${c} is added to ${v} before multiplying. The words add ${c} to the product ${k}${v}.` },
          { text: `${c}${v} + ${k}`, why: `The coefficient of ${v} should be ${k}, because ${k} multiplies the number. ${c} is the amount added.` },
          { text: `${k}${v} − ${c}`, why: `"More than" means add, not subtract.` },
        ],
      };
    },
    (r, v) => {
      const k = r.int(2, 6),
        c = r.int(1, 9);
      return {
        words: `${c} less than ${k === 2 ? 'twice' : k + ' times'} a number ${v}`,
        text: `${k}${v} − ${c}`,
        value: (x) => k * x - c,
        wrong: [
          { text: `${c} − ${k}${v}`, why: `"${c} less than" a quantity means the quantity minus ${c}. The order flips.` },
          { text: `${k}(${v} − ${c})`, why: `${c} is subtracted from the whole product ${k}${v}, not from ${v} before multiplying.` },
          { text: `${k}${v} + ${c}`, why: `"Less than" means subtract.` },
        ],
      };
    },
    (r, v) => {
      const k = r.int(2, 6),
        c = r.int(1, 9);
      return {
        words: `${k} times the sum of a number ${v} and ${c}`,
        text: `${k}(${v} + ${c})`,
        value: (x) => k * (x + c),
        wrong: [
          { text: `${k}${v} + ${c}`, why: `"The sum of ${v} and ${c}" is one quantity. It needs parentheses so the whole sum is multiplied by ${k}.` },
          { text: `${k} + ${v} + ${c}`, why: `"Times" means multiply ${k} by the sum.` },
          { text: `${k}${v} × ${c}`, why: `"Sum" means add ${v} and ${c}.` },
        ],
      };
    },
    (r, v) => {
      const d = r.pick([2, 3, 4, 5]),
        c = r.int(1, 9);
      return {
        words: `the quotient of a number ${v} and ${d}, plus ${c}`,
        text: `${v} ÷ ${d} + ${c}`,
        value: (x) => x / d + c,
        wrong: [
          { text: `${d} ÷ ${v} + ${c}`, why: `"The quotient of ${v} and ${d}" puts ${v} first: ${v} is divided by ${d}.` },
          { text: `${v} ÷ (${d} + ${c})`, why: `${c} is added after dividing, not to the divisor.` },
          { text: `${d}${v} + ${c}`, why: `"Quotient" means divide, not multiply.` },
        ],
      };
    },
    (r, v) => {
      const c = r.int(2, 9);
      return {
        words: `the square of a number ${v}, decreased by ${c}`,
        text: `${v}${U.supText(2)} − ${c}`,
        value: (x) => sq(x) - c,
        wrong: [
          { text: `2${v} − ${c}`, why: `"The square of ${v}" is ${v} × ${v}, written ${v}², not 2${v}.` },
          { text: `(${v} − ${c})${U.supText(2)}`, why: `Only ${v} is squared. ${c} is subtracted after squaring.` },
          { text: `${c} − ${v}${U.supText(2)}`, why: `"Decreased by ${c}" means subtract ${c} from the square. The order flips.` },
        ],
      };
    },
  ];
  const alg = (r, v) => r.pick(ALG)(r, v);

  // ---------- Words → algebraic expression (mc) ----------
  G.define('e5_wordsToAlg', (r) => {
    const v = r.pick(VARS);
    const p = alg(r, v);
    const name = r.pick(NAMES);
    const opts = [{ html: p.text, ok: true }].concat(p.wrong.map((w) => ({ html: w.text, why: w.why })));
    const sh = shuffleOptions(r, opts, 0);
    return {
      type: 'mc',
      skill: 'write-algebraic',
      lesson: '6-5',
      title: 'Write the algebraic expression',
      prompt: `<p>${name} must engrave a plate for "<b>${p.words}</b>."</p><p>Which algebraic expression matches the words?</p>`,
      options: sh.options,
      answer: sh.answer,
      hints: [
        `The variable ${v} stands for the unknown number. Turn each operation word into a symbol: more than (+), less than (−), times (×), quotient (÷), square (exponent 2).`,
        '"Less than" and "decreased by" flip the order. "The sum of ..." names one quantity and needs parentheses if it is multiplied.',
        `A number written next to a variable, or next to parentheses, means multiply. The correct expression has the value ${p.value(3)} when ${v} = 3.`,
      ],
      solution: `<p>"${p.words}" is <b>${p.text}</b>. Writing a number next to the variable means multiplication, and the order of the words tells you the order of the operations.</p>`,
      feedback: { correct: `Correct. "${p.words}" = ${p.text}.` },
    };
  });

  // ---------- Story → expression and meaning of the parts (cloze) ----------
  G.define('e5_storyCloze', (r) => {
    const name = r.pick(NAMES);
    const k = r.int(2, 9),
      f = r.int(1, 12) * (r.chance(0.5) ? 1 : 5);
    const ctx = r.pick([
      { item: 'gear', unitPlural: 'gears', fee: 'delivery fee', v: 'g' },
      { item: 'ticket', unitPlural: 'tickets', fee: 'booking fee', v: 't' },
      { item: 'brass rod', unitPlural: 'brass rods', fee: 'cutting fee', v: 'r' },
      { item: 'oil can', unitPlural: 'oil cans', fee: 'handling fee', v: 'c' },
    ]);
    const v = ctx.v;
    const exprs = r.shuffle([`${k}${v} + ${f}`, `${f}${v} + ${k}`, `${k + f}${v}`]);
    const varMeans = r.shuffle([`the number of ${ctx.unitPlural}`, `the cost of one ${ctx.item}`, 'the total cost']);
    const constChoices = r.shuffle([String(f), String(k), String(k + f)]);
    return {
      type: 'cloze',
      skill: 'write-algebraic',
      lesson: '6-5',
      title: 'Build the expression from the story',
      prompt: `<p>${name} orders ${ctx.unitPlural}. Each ${ctx.item} costs ${hl('$' + k)}, and there is a one-time ${ctx.fee} of ${hl('$' + f)}.</p><p>Let ${v} be the number of ${ctx.unitPlural}. Complete the sentences.</p>`,
      template: `The total cost in dollars is {0}.  The variable ${v} stands for {1}.  The constant {2} is the ${ctx.fee}, which is paid once no matter how many ${ctx.unitPlural} are ordered.`,
      choices: [exprs, varMeans, constChoices],
      answers: [exprs.indexOf(`${k}${v} + ${f}`), varMeans.indexOf(`the number of ${ctx.unitPlural}`), constChoices.indexOf(String(f))],
      hints: [
        `The cost of the ${ctx.unitPlural} depends on how many are ordered, so multiply ${k} by ${v}. The fee is added once.`,
        `The variable is the part that can change: the number of ${ctx.unitPlural}. The coefficient ${k} is the price of one.`,
        `The constant is the number that does not change when ${v} changes: the fee of ${f} dollars.`,
      ],
      solution: `<p>Total cost = <b>${k}${v} + ${f}</b>. The variable ${v} is <b>the number of ${ctx.unitPlural}</b>, the coefficient ${k} is the cost of each one, and the constant <b>${f}</b> is the ${ctx.fee}, added once. For example, ${k}(3) + ${f} = ${k * 3 + f} dollars for 3 ${ctx.unitPlural}.</p>`,
      feedback: {
        correct: `Correct. ${k}${v} + ${f}: the coefficient is the price per ${ctx.item}, the constant is the one-time fee.`,
        wrong(ans, dt) {
          if (dt.wrong.includes(0)) return `The price per ${ctx.item} (${k}) multiplies the number of ${ctx.unitPlural}. The fee (${f}) is added once, not multiplied.`;
          if (dt.wrong.includes(1)) return `The variable is the quantity that changes from order to order: how many ${ctx.unitPlural}.`;
          return `A constant is a term with no variable. In ${k}${v} + ${f}, that is ${f}.`;
        },
      },
    };
  });

  // ---------- Sort the parts of an expression (sort) ----------
  G.define('e5_sortParts', (r) => {
    const [v1, v2] = r.pickN(VARS, 2);
    let a = r.int(2, 9),
      b = r.int(2, 9),
      c = r.int(10, 25);
    if (b === a) b = a === 9 ? 8 : a + 1;
    const expr = `${a}${v1} + ${b}${v2} + ${c}`;
    const items = r.shuffle([
      { html: `${a}${v1}`, bin: 0 },
      { html: `${b}${v2}`, bin: 0 },
      { html: String(c), bin: 1 },
      { html: String(a), bin: 2 },
      { html: String(b), bin: 2 },
      { html: v1, bin: 3 },
      { html: v2, bin: 3 },
    ]);
    return {
      type: 'sort',
      skill: 'parts-expression',
      lesson: '6-5',
      title: 'Name the parts of the plate',
      prompt: `<p>A plate reads <span class="big">${hl(expr)}</span>.</p><p>Sort each piece of the expression into the correct category.</p>`,
      bins: ['Term with a variable', 'Constant term', 'Coefficient', 'Variable'],
      items,
      hints: [
        'Terms are the parts separated by + or −. A term with a letter in it has a coefficient (the number) and a variable (the letter).',
        `${expr} has three terms: ${a}${v1}, ${b}${v2}, and ${c}. The one without a letter is the constant.`,
        `In ${a}${v1}, the coefficient is ${a} and the variable is ${v1}. The same idea works for ${b}${v2}.`,
      ],
      solution: `<p>Terms with a variable: <b>${a}${v1}</b> and <b>${b}${v2}</b>. Constant term: <b>${c}</b>. Coefficients: <b>${a}</b> and <b>${b}</b>, the numbers multiplied by the variables. Variables: <b>${v1}</b> and <b>${v2}</b>. The constant has no variable, so it has no coefficient.</p>`,
      feedback: {
        correct: 'Correct. Terms are separated by + or −; inside a variable term, the number is the coefficient and the letter is the variable.',
        wrong(ans, dt) {
          const it = items[dt.wrong[0]];
          if (!it) return 'Split the expression at each + sign to find the terms first.';
          if (it.bin === 0) return `${it.html} is a whole term: a number times a variable. It is separated from the rest by a + sign.`;
          if (it.bin === 1) return `${it.html} stands alone with no variable, so it is the constant term.`;
          if (it.bin === 2) return `${it.html} is multiplied by a variable in one of the terms, so it is a coefficient.`;
          return `${it.html} is a letter that stands for a number: a variable.`;
        },
      },
    };
  });

  // ---------- Select every term (ms) ----------
  G.define('e5_selectTerms', (r) => {
    const [v1, v2] = r.pickN(VARS, 2);
    let a = r.int(2, 9),
      b = r.int(2, 9),
      c = r.int(1, 9);
    if (b === a) b = a === 9 ? 8 : a + 1;
    if (c === a || c === b) c = c === 9 ? 1 : c + 1;
    if (c === a || c === b) c = c === 9 ? 1 : c + 1;
    const minus = r.chance(0.5);
    const expr = `${a}${v1} + ${c} ${minus ? '−' : '+'} ${b}${v2}`;
    const opts = [
      { html: `${a}${v1}`, ok: true },
      { html: String(c), ok: true },
      { html: `${b}${v2}`, ok: true },
      { html: String(a), why: `${a} is the coefficient of ${v1}, not a whole term. The term is ${a}${v1}.` },
      { html: v2, why: `${v2} is a variable inside the term ${b}${v2}. The term includes its coefficient.` },
      { html: `${a}${v1} + ${c}`, why: `That is two terms joined by +. A single term has no + or − inside it.` },
    ];
    const sh = shuffleOptions(r, opts, [0, 1, 2]);
    return {
      type: 'ms',
      skill: 'parts-expression',
      lesson: '6-5',
      title: 'Select every term',
      prompt: `<p>The plate reads ${hl(expr)}.</p><p>Select <b>every term</b> of the expression.</p><p class="muted">Terms are the parts separated by + or −.</p>`,
      options: sh.options,
      answers: sh.answers,
      hints: [
        'Split the expression at each + or − sign. Each piece is one term.',
        `${expr} splits into three pieces.`,
        `The pieces are ${a}${v1}, ${c}, and ${b}${v2}. A coefficient or a variable alone is only part of a term.`,
      ],
      solution: `<p>The three terms are <b>${a}${v1}</b>, <b>${c}</b>, and <b>${b}${v2}</b>. ${a} alone is a coefficient, ${v2} alone is a variable, and ${a}${v1} + ${c} is two terms, not one.</p>`,
      feedback: {
        correct: `Correct. ${expr} has exactly three terms.`,
        wrong(ans, dt) {
          if (dt.extra && dt.extra.length) return sh.options[dt.extra[0]].why || 'That is not a whole term.';
          return `You missed a term. Split ${expr} at every + or − sign: there are three pieces.`;
        },
      },
    };
  });

  /** Expression for evaluating: returns { text, f(x), subStr(x), step1(x) }. hard adds a second variable or an exponent. */
  function evalExpr(r, v, hard) {
    if (!hard) {
      const k = r.int(2, 9),
        c = r.int(1, 15);
      if (r.chance(0.5))
        return {
          text: `${k}${v} + ${c}`,
          f: (x) => k * x + c,
          sub: (x) => `${k}(${x}) + ${c}`,
          step: (x) => `${k * x} + ${c}`,
          concat: (x) => Number(String(k) + String(x)) + c,
          addInstead: (x) => k + x + c,
        };
      const cc = r.int(1, 9);
      return {
        text: `${k}${v} − ${cc}`,
        f: (x) => k * x - cc,
        sub: (x) => `${k}(${x}) − ${cc}`,
        step: (x) => `${k * x} − ${cc}`,
        concat: (x) => Number(String(k) + String(x)) - cc,
        addInstead: (x) => k + x - cc,
      };
    }
    const k = r.int(2, 5),
      c = r.int(1, 12);
    if (r.chance(0.5))
      return {
        text: `${k}${v}${U.supText(2)} − ${c}`,
        f: (x) => k * sq(x) - c,
        sub: (x) => `${k}(${x})${U.supText(2)} − ${c}`,
        step: (x) => `${k} × ${sq(x)} − ${c}`,
        concat: (x) => sq(k * x) - c,
        addInstead: (x) => k * x * 2 - c,
      };
    const w = v === 'x' ? 'y' : 'x';
    const m = r.int(2, 6);
    return {
      text: `${k}${v} + ${m}${w}`,
      two: w,
      f: (x, y) => k * x + m * y,
      sub: (x, y) => `${k}(${x}) + ${m}(${y})`,
      step: (x, y) => `${k * x} + ${m * y}`,
      concat: (x, y) => Number(String(k) + String(x)) + Number(String(m) + String(y)),
      addInstead: (x, y) => k + x + m + y,
    };
  }

  // ---------- Evaluate an algebraic expression (num) ----------
  G.define('e5_evaluate', (r, o) => {
    const hard = !!o.hard;
    const v = r.pick(VARS);
    const ex = evalExpr(r, v, hard);
    const x = hard ? r.int(2, 9) : r.int(2, 12);
    const y = r.int(2, 9);
    const val = ex.two ? ex.f(x, y) : ex.f(x);
    const name = r.pick(NAMES);
    const given = ex.two ? `${v} = ${x} and ${ex.two} = ${y}` : `${v} = ${x}`;
    const ctx = r.pick([
      `A plate reads ${hl(ex.text)}. For today's job, ${hl(given)}.`,
      `${name} reads the rule ${hl(ex.text)} on a machine. The setting is ${hl(given)}.`,
      `The foundry log lists the expression ${hl(ex.text)} with ${hl(given)}.`,
    ]);
    return {
      type: 'num',
      skill: 'evaluate-algebraic',
      lesson: '6-5',
      title: hard ? 'Evaluate (exponent or two variables)' : 'Evaluate the expression',
      prompt: `<p>${ctx}</p><p>Evaluate the expression.</p>`,
      answer: val,
      hints: [
        `Substitute: replace each variable with its value. Writing a number next to a variable means multiply, so ${ex.text.replace(/\s.*$/, '')} means ${ex.text.replace(/\s.*$/, '').replace(/^(\d+)/, '$1 × ')}.`,
        `${ex.two ? ex.sub(x, y) : ex.sub(x)}. Use parentheses when you substitute so you do not lose the multiplication.`,
        `${ex.two ? ex.step(x, y) : ex.step(x)}. One step left.`,
      ],
      solution: `<p>Substitute ${given} into ${ex.text}: ${ex.two ? ex.sub(x, y) : ex.sub(x)} = ${ex.two ? ex.step(x, y) : ex.step(x)} = <b>${val}</b>. Multiply before adding or subtracting, and evaluate any exponent first.</p>`,
      feedback: {
        correct: `Correct. ${ex.two ? ex.sub(x, y) : ex.sub(x)} = ${val}.`,
        wrong(ans, dt) {
          const w = dt.value;
          const concat = ex.two ? ex.concat(x, y) : ex.concat(x);
          const addI = ex.two ? ex.addInstead(x, y) : ex.addInstead(x);
          if (w === concat)
            return hard && !ex.two
              ? `Square only the variable: ${v}${U.supText(2)} = ${x} × ${x} = ${sq(x)}. Then multiply by the coefficient.`
              : `Writing ${x} next to the coefficient does not make a bigger number. A number beside a variable means multiply.`;
          if (w === addI) return `A coefficient multiplies the variable. ${ex.text.replace(/\s.*$/, '')} means multiply, not add.`;
          return `Replace ${v} with ${x}${ex.two ? ` and ${ex.two} with ${y}` : ''}, then multiply before you add or subtract.`;
        },
      },
    };
  });

  // ---------- Input-output table (table) ----------
  G.define('e5_tableEval', (r) => {
    const v = r.pick(VARS);
    const k = r.int(2, 8),
      c = r.int(1, 10);
    const expr = `${k}${v} + ${c}`;
    const name = r.pick(NAMES);
    const start = r.int(1, 4);
    const xs = [start, start + 1, start + 2, start + 4];
    const ctx = r.pick([
      `${name} earns $${k} per gear polished plus a $${c} daily bonus, so the day's pay is ${hl(expr)} dollars for ${v} gears.`,
      `A machine uses ${k} liters of oil per hour plus ${c} liters to start, so it uses ${hl(expr)} liters in ${v} hours.`,
      `Each crate holds ${k} parts and the cart holds ${c} loose parts, so the shipment has ${hl(expr)} parts with ${v} crates.`,
    ]);
    const rows = [[v, expr]];
    const inputs = [];
    xs.forEach((x, i) => {
      rows.push([String(x), `__IN:y${i}__`]);
      inputs.push({ id: `y${i}`, answer: k * x + c });
    });
    return {
      type: 'table',
      skill: 'evaluate-algebraic',
      lesson: '6-5',
      title: 'Complete the input-output table',
      prompt: `<p>${ctx}</p><p>Complete the table by evaluating the expression for each value of ${v}.</p>`,
      rows,
      header: true,
      inputs,
      hints: [
        `Substitute each value of ${v} into ${expr}. Multiply by ${k} first, then add ${c}.`,
        `For ${v} = ${xs[0]}: ${k}(${xs[0]}) + ${c} = ${k * xs[0]} + ${c}.`,
        `${xs
          .slice(0, 3)
          .map((x) => `${v} = ${x} gives ${k * x + c}`)
          .join('; ')}. One row remains.`,
      ],
      solution: `<p>${xs.map((x) => `${k}(${x}) + ${c} = <b>${k * x + c}</b>`).join('; ')}. Each time ${v} goes up by 1, the value goes up by ${k}, the coefficient, because the constant ${c} never changes.</p>`,
      feedback: {
        correct: `Correct. Multiply by ${k}, then add ${c}, for every row.`,
        wrong(ans, dt) {
          const i = Number(String(dt.wrong[0] || 'y0').slice(1)) || 0;
          const x = xs[i];
          return `For ${v} = ${x}: ${k} × ${x} = ${k * x}, then add ${c}. Do not add ${k} + ${x}.`;
        },
      },
    };
  });

  // ---------- Error: substituted incorrectly (error) ----------
  G.define('e5_errorSubstitute', (r) => {
    const name = r.pick(NAMES);
    const v = r.pick(VARS);
    const k = r.int(2, 9),
      c = r.int(1, 9),
      x = r.int(2, 9);
    const kind = r.pick(['concat', 'add', 'square']);
    let expr, work, val, okText, alt, altWhy;
    let kk = 0;
    if (kind === 'square') {
      kk = r.int(2, 4);
      expr = `${kk}${v}${U.supText(2)}`;
      work = `${expr} with ${v} = ${x}: (${kk} × ${x})${U.supText(2)} = ${PT(kk * x, 2)} = ${sq(kk * x)}`;
      val = kk * sq(x);
      okText = `${name} multiplied before squaring. The exponent belongs only to ${v}: ${kk}${v}² means ${kk} × ${v} × ${v}.`;
      alt = `${name} should have computed ${x}² as ${x} × 2.`;
      altWhy = `${x}² means ${x} × ${x} = ${sq(x)}. The exponent is a count of factors.`;
    } else if (kind === 'concat') {
      expr = `${k}${v} + ${c}`;
      work = `${expr} with ${v} = ${x}: ${k}${x} + ${c} = ${Number(String(k) + String(x)) + c}`;
      val = k * x + c;
      okText = `${name} wrote ${x} next to ${k} and read it as the number ${k}${x}. A number beside a variable means multiply: ${k}(${x}).`;
      alt = `${name} should have added ${k} + ${x}.`;
      altWhy = `${k}${v} means ${k} times ${v}, not ${k} plus ${v}.`;
    } else {
      expr = `${k}${v} + ${c}`;
      work = `${expr} with ${v} = ${x}: ${k} + ${x} + ${c} = ${k + x + c}`;
      val = k * x + c;
      okText = `${name} added the coefficient instead of multiplying. ${k}${v} means ${k} × ${v}.`;
      alt = `${name} should have written ${k}${x} as one number.`;
      altWhy = `Putting ${x} beside ${k} does not make the number ${k}${x}. The coefficient multiplies the value.`;
    }
    const opts = [
      { html: okText, ok: true },
      { html: alt, why: altWhy },
      { html: `${name} substituted the wrong value for ${v}.`, why: `${name} used ${v} = ${x}, which is the given value. The problem is what was done with it.` },
      { html: 'The work is correct.', why: `It is not. Substituting correctly gives ${val}.` },
    ];
    const sh = shuffleOptions(r, opts, 0);
    return {
      type: 'error',
      skill: 'evaluate-algebraic',
      lesson: '6-5',
      title: 'Find the mistake',
      prompt: `<p>${name} evaluated ${hl(expr)} when ${hl(v + ' = ' + x)}. The machine stalled.</p><p>What is the mistake?</p>`,
      work,
      options: sh.options,
      answer: sh.answer,
      fix: { label: 'The correct value is', answer: val },
      hints: [
        'When you substitute, put the value in parentheses. A coefficient next to parentheses means multiply.',
        kind === 'square' ? `Only ${v} is squared. Square ${x} first, then multiply by the coefficient.` : `${k}(${x}) means ${k} × ${x} = ${k * x}.`,
        kind === 'square' ? `${x}² = ${sq(x)}. Then multiply by the coefficient.` : `${k * x} + ${c} = ?`,
      ],
      solution: `<p>${okText} Correct work: ${kind === 'square' ? `${kk}(${x})${U.supText(2)} = ${kk} × ${sq(x)} = <b>${val}</b>` : `${k}(${x}) + ${c} = ${k * x} + ${c} = <b>${val}</b>`}.</p>`,
      feedback: {
        correct: `Correct. Substituting with parentheses keeps the multiplication: the value is ${val}.`,
        wrong(ans, dt) {
          if (!dt.mistakeOk) return (sh.options[ans.mistake] && sh.options[ans.mistake].why) || `Look at how ${name} replaced ${v} with ${x}.`;
          return `You found the mistake. For the fix: ${kind === 'square' ? `square ${x} first, then multiply by the coefficient.` : `${k} × ${x} + ${c}.`}`;
        },
      },
    };
  });

  // ---------- Evaluate with fraction or decimal values (num) ----------
  G.define('e5_fracDecimal', (r) => {
    const v = r.pick(VARS);
    const name = r.pick(NAMES);
    const kind = r.pick(['halfCoef', 'decimalCoef', 'divide', 'decimalValue']);
    let expr, x, val, sub, step, hintA, misread;
    if (kind === 'halfCoef') {
      const c = r.int(1, 9);
      x = 2 * r.int(2, 9);
      expr = `${U.fracText(1, 2)}${v} + ${c}`;
      val = x / 2 + c;
      sub = `${U.fracText(1, 2)}(${x}) + ${c}`;
      step = `${x / 2} + ${c}`;
      hintA = `A coefficient of 1/2 means half of ${v}. Half of ${x} is ${x / 2}.`;
      misread = { v: 2 * x + c, msg: `Multiplying by 1/2 makes a number smaller. Half of ${x} is ${x / 2}, not ${2 * x}.` };
    } else if (kind === 'decimalCoef') {
      const k = r.pick([0.5, 1.5, 2.5]),
        c = r.int(1, 9);
      x = r.int(2, 9);
      expr = `${k}${v} + ${c}`;
      val = round(k * x + c, 2);
      sub = `${k}(${x}) + ${c}`;
      step = `${round(k * x, 2)} + ${c}`;
      hintA = `${k} × ${x}: multiply as with whole numbers, then place the decimal point.`;
      misread = { v: round(k + x + c, 2), msg: `${k}${v} means ${k} times ${v}, not ${k} plus ${v}.` };
    } else if (kind === 'divide') {
      const d = r.pick([2, 4, 5]),
        c = r.int(1, 9);
      x = d * r.int(1, 6) + r.int(1, d - 1); // never a whole-number quotient
      expr = `${v} ÷ ${d} + ${c}`;
      val = round(x / d + c, 2);
      sub = `${x} ÷ ${d} + ${c}`;
      step = `${round(x / d, 2)} + ${c}`;
      hintA = `${x} ÷ ${d} is not a whole number. Write it as a decimal: ${round(x / d, 2)}.`;
      misread = { v: round(d / x + c, 2), msg: `The expression divides ${v} by ${d}, so compute ${x} ÷ ${d}, not ${d} ÷ ${x}.` };
    } else {
      const k = r.int(2, 6),
        c = r.int(1, 9);
      x = r.int(1, 9) + 0.5;
      expr = `${k}${v} + ${c}`;
      val = round(k * x + c, 2);
      sub = `${k}(${x}) + ${c}`;
      step = `${round(k * x, 2)} + ${c}`;
      hintA = `${k} × ${x}: multiply ${k} × ${Math.floor(x)} and ${k} × 0.5, then add.`;
      misread = { v: round(k * Math.floor(x) + c, 2), msg: `You dropped the 0.5. ${k} × ${x} includes ${k} × 0.5 = ${k * 0.5}.` };
    }
    const ctx = r.pick([
      `A plate reads ${hl(expr)}. Today ${hl(v + ' = ' + x)}.`,
      `${name} must evaluate ${hl(expr)} for ${hl(v + ' = ' + x)}.`,
      `The gauge rule is ${hl(expr)}, and the reading is ${hl(v + ' = ' + x)}.`,
    ]);
    return {
      type: 'num',
      skill: 'evaluate-algebraic',
      lesson: '6-5',
      title: 'Evaluate with a fraction or decimal',
      prompt: `<p>${ctx}</p><p>Evaluate the expression. Write a decimal if the answer is not a whole number.</p>`,
      answer: val,
      hints: [`Substitute ${x} for ${v}: ${sub}.`, hintA, `${step} = ?`],
      solution: `<p>${sub} = ${step} = <b>${fmt(val)}</b>. Substitution works the same with fractions and decimals: replace the variable, multiply or divide first, then add.</p>`,
      feedback: {
        correct: `Correct. ${sub} = ${fmt(val)}.`,
        wrong(ans, dt) {
          const w = dt.value;
          if (w != null && Math.abs(w - misread.v) < 1e-6) return misread.msg;
          return `Substitute ${x} for ${v}: ${sub}. Multiply or divide first, then add.`;
        },
      },
    };
  });
})(typeof window !== 'undefined' ? window : globalThis);

/* js/units/u6/gen-equivalent.js */
/* Zone 6 — The Balance Hall. Lesson 6-6 Identify Equivalent Algebraic Expressions. */
(function (root) {
  'use strict';
  const RX = root.RX;
  const { G, V, shuffleOptions, NAMES, parseNum } = RX;
  const hl = V.hl;
  const VARS = ['x', 'n', 'm', 'k', 'y'];
  const distinct = (arr) => arr.filter((x, i) => arr.indexOf(x) === i);

  // ---------- Combine like terms (blanks, template) ----------
  G.define('e6_combine', (r, o) => {
    const hard = !!o.hard;
    const v = r.pick(VARS);
    const name = r.pick(NAMES);
    let text, c, d;
    if (!hard) {
      const a = r.int(2, 9),
        b = r.int(1, 9),
        e = r.int(1, 8),
        f = r.int(1, 9);
      text = `${a}${v} + ${b} + ${e}${v} + ${f}`;
      c = a + e;
      d = b + f;
    } else {
      // three variable terms with one subtraction; constants with one subtraction; keep results positive
      const a = r.int(3, 9),
        e = r.int(1, 5),
        g = r.int(2, 6);
      const sub = r.int(1, Math.min(a + g - 1, 6));
      const b = r.int(6, 15),
        f = r.int(1, 5);
      text = `${a}${v} + ${b} − ${sub}${v} + ${g}${v} − ${f} + ${e}${v}`;
      c = a - sub + g + e;
      d = b - f;
    }
    return {
      type: 'blanks',
      skill: 'like-terms',
      lesson: '6-6',
      title: hard ? 'Simplify (with subtraction)' : 'Combine like terms',
      prompt: `<p>${name} sets a plate that reads ${hl(text)}. The balance hall only accepts the simplest form.</p><p>Combine like terms and write the equivalent expression.</p>`,
      fields: [
        { label: `coefficient of ${v}`, answer: c, width: 'xs' },
        { label: 'constant', answer: d, width: 'xs' },
      ],
      template: `Simplest form: {0}${v} + {1}`,
      hints: [
        `Like terms have exactly the same variable part. The ${v}-terms go together, and the plain numbers go together.`,
        `Add or subtract the coefficients of the ${v}-terms: ${text
          .split(/\s(?=[+−])/)
          .filter((t) => t.includes(v))
          .join(' ')}. Then combine the constants separately.`,
        `The ${v}-terms combine to ${c}${v}. Now combine the constants.`,
      ],
      solution: `<p>${text} = <b>${c}${v} + ${d}</b>. The ${v}-terms combine to ${c}${v} and the constants combine to ${d}. A ${v}-term and a constant are <b>not</b> like terms, so they stay separate.</p>`,
      feedback: {
        correct: `Correct. ${text} = ${c}${v} + ${d}.`,
        wrong(ans) {
          const x = parseNum(ans[0]),
            y = parseNum(ans[1]);
          if (x === c + d || y === c + d) return `You combined a ${v}-term with a constant. ${c}${v} and ${d} are unlike terms and cannot be added.`;
          if (x === c && y !== d) return `The ${v}-term is right. Recheck the constants: combine only the plain numbers.`;
          if (y === d && x !== c) return `The constant is right. Recheck the ${v}-terms: add or subtract their coefficients, watching the signs.`;
          return `Group the ${v}-terms and combine their coefficients. Then group the plain numbers.`;
        },
      },
    };
  });

  // ---------- Select all equivalent expressions (ms) ----------
  G.define('e6_equivSelect', (r) => {
    const v = r.pick(VARS);
    const a = r.int(2, 6),
      e = r.int(1, 5),
      b = r.int(2, 9);
    const c = a + e;
    const text = `${a}${v} + ${b} + ${e}${v}`;
    const opts = [
      { html: `${c}${v} + ${b}`, ok: true },
      { html: `${b} + ${c}${v}`, ok: true },
      { html: `${a}${v} + ${e}${v} + ${b}`, ok: true },
      { html: `${c + b}${v}`, why: `That combines the constant ${b} with the ${v}-terms. ${b} has no variable, so it is not a like term.` },
      { html: `${c}${v} + ${b + e}`, why: `The ${e} in ${e}${v} is a coefficient. It joins the other ${v}-coefficient, not the constant.` },
      { html: `${a}${v} + ${b + e}`, why: `${e}${v} is a ${v}-term. Its coefficient adds to ${a}, not to the constant ${b}.` },
    ];
    const sh = shuffleOptions(r, opts, [0, 1, 2]);
    return {
      type: 'ms',
      skill: 'like-terms',
      lesson: '6-6',
      title: 'Select every equivalent expression',
      prompt: `<p>A plate reads ${hl(text)}.</p><p>Select <b>every</b> expression that is equivalent to it.</p>`,
      options: sh.options,
      answers: sh.answers,
      hints: [
        'Two expressions are equivalent if they have the same value for every value of the variable. Combining like terms or changing the order of the terms keeps an expression equivalent.',
        `Combine the ${v}-terms: ${a}${v} + ${e}${v} = ${c}${v}. The constant ${b} stays a constant.`,
        `The simplest form is ${c}${v} + ${b}. Any reordering of its terms, or of the original terms, is also equivalent.`,
      ],
      solution: `<p>${text} simplifies to <b>${c}${v} + ${b}</b>. Writing the terms in a different order (${b} + ${c}${v}, or ${a}${v} + ${e}${v} + ${b}) does not change the value, so those are equivalent too. Expressions that mix the constant into the ${v}-term, such as ${c + b}${v}, are not equivalent: test ${v} = 1 to see the values differ.</p>`,
      feedback: {
        correct: 'Correct. Reordering terms and combining like terms both keep expressions equivalent.',
        wrong(ans, dt) {
          if (dt.extra && dt.extra.length) return sh.options[dt.extra[0]].why || 'That expression is not equivalent. Test it with a value.';
          return `You missed one. Changing the order of terms keeps an expression equivalent, so look for another form of ${c}${v} + ${b}.`;
        },
      },
    };
  });

  // ---------- Error: combined unlike terms (error) ----------
  G.define('e6_errorUnlike', (r) => {
    const name = r.pick(NAMES);
    const v = r.pick(VARS);
    const a = r.int(2, 7),
      b = r.int(1, 9),
      e = r.int(1, 6);
    const c = a + e;
    const text = `${a}${v} + ${b} + ${e}${v}`;
    const opts = [
      { html: `${name} added the constant ${b} into the ${v}-terms. ${b} has no variable, so it is not a like term with ${a}${v} or ${e}${v}.`, ok: true },
      { html: `${name} should have multiplied the coefficients: ${a} × ${e}.`, why: `Like terms are combined by adding their coefficients, not multiplying.` },
      { html: `${name} should have written ${c}${v} + ${b}${v}.`, why: `${b} is a constant. Attaching a ${v} to it changes its value.` },
      {
        html: `The work is correct. All the terms are like terms.`,
        why: `Not all. Test ${v} = 1: ${text} gives ${a + b + e}, but ${a + b + e}${v} gives ${a + b + e}. Now test ${v} = 2: ${text} gives ${2 * a + b + 2 * e}, but ${a + b + e}${v} gives ${2 * (a + b + e)}.`,
      },
    ];
    const sh = shuffleOptions(r, opts, 0);
    return {
      type: 'error',
      skill: 'like-terms',
      lesson: '6-6',
      title: 'Find the mistake',
      prompt: `<p>${name} simplified ${hl(text)} and the balance tipped.</p><p>What is the mistake?</p>`,
      work: `${text} = ${a + b + e}${v}`,
      options: sh.options,
      answer: sh.answer,
      fix: { label: `In the correct simplest form, the coefficient of ${v} is`, answer: c },
      hints: [
        'Like terms must have exactly the same variable part. Which terms have a variable, and which one does not?',
        `${a}${v} and ${e}${v} are like terms. ${b} is a constant and stays by itself.`,
        `${a}${v} + ${e}${v} = ${c}${v}. Then write + ${b}.`,
      ],
      solution: `<p>${name} treated ${b} as if it were a ${v}-term. Only ${a}${v} and ${e}${v} are like terms: ${text} = <b>${c}${v} + ${b}</b>. A quick test with ${v} = 2 shows the difference: the original gives ${2 * a + b + 2 * e}, but ${a + b + e}${v} gives ${2 * (a + b + e)}.</p>`,
      feedback: {
        correct: `Correct. ${text} = ${c}${v} + ${b}. The constant stays separate.`,
        wrong(ans, dt) {
          if (!dt.mistakeOk) return (sh.options[ans.mistake] && sh.options[ans.mistake].why) || `Check which terms really have a ${v}.`;
          return `You found the mistake. For the fix: add only the coefficients of the ${v}-terms, ${a} + ${e}.`;
        },
      },
    };
  });

  // ---------- Pan balance: equivalent or not? (tf) ----------
  G.define('e6_balanceModel', (r) => {
    const v = r.pick(VARS);
    const a = r.int(1, 3),
      e = r.int(1, 2),
      b = r.int(1, 6);
    const leftChips = [];
    for (let i = 0; i < a; i++) leftChips.push(v);
    leftChips.push(String(b));
    for (let i = 0; i < e; i++) leftChips.push(v);
    const c = a + e;
    const leftText = leftChips.join(' + ');
    const equivalent = r.chance(0.5);
    const rightText = equivalent ? `${c}${v} + ${b}` : r.pick([`${c + b}${v}`, `${c}${v} + ${b}${v}`, `${c - 1}${v} + ${b + 1}`]);
    const t = 2;
    const leftVal = c * t + b;
    const rightVal = equivalent ? leftVal : rightText === `${c + b}${v}` ? (c + b) * t : rightText === `${c}${v} + ${b}${v}` ? (c + b) * t : (c - 1) * t + b + 1;
    const svg = V.balance({ left: leftChips, right: [rightText], tilt: equivalent ? 0 : 1, aria: `Pan balance with ${leftText} on the left and ${rightText} on the right` });
    const reasons = r.shuffle([
      {
        html: equivalent
          ? `Yes. Combining the like terms on the left gives ${c}${v} + ${b}, the same as the right. The pans match for every value of ${v}.`
          : `No. The left side simplifies to ${c}${v} + ${b}. Test ${v} = ${t}: the left is ${leftVal} but the right is ${rightVal}.`,
        correct: true,
      },
      {
        html: equivalent ? `Yes. Both sides have the number ${b} in them somewhere.` : `No. The two sides look different, and expressions that look different are never equivalent.`,
        correct: false,
      },
      {
        html: equivalent ? `No. The left side has more pieces than the right side, so it must be bigger.` : `Yes. Both sides use the letter ${v} and the number ${b}, so they are the same.`,
        correct: false,
      },
    ]);
    return {
      type: 'tf',
      skill: 'like-terms',
      lesson: '6-6',
      title: 'Will the balance stay level?',
      prompt: `<p>The left pan holds ${hl(leftText)}. The right pan holds ${hl(rightText)}.</p>${svg}<p>Are the two expressions equivalent? Choose the best reason.</p>`,
      answer: equivalent,
      reasons,
      labels: ['Yes, equivalent', 'No, not equivalent'],
      hints: [
        `First simplify the left pan by combining like terms. Count the ${v} chips and keep the constant separate.`,
        `The left pan is ${c}${v} + ${b}. Compare it with the right pan.`,
        `If they look different, test a value such as ${v} = ${t}: left = ${leftVal}, right = ${rightVal}.`,
      ],
      solution: `<p>The left pan simplifies to ${c}${v} + ${b}. ${
        equivalent
          ? `That is exactly the right pan, so the expressions are <b>equivalent</b> and the balance stays level for every value of ${v}.`
          : `The right pan is ${rightText}. At ${v} = ${t}, the left is ${leftVal} and the right is ${rightVal}, so they are <b>not equivalent</b> and the balance tips.`
      }</p>`,
      feedback: {
        correct: equivalent
          ? 'Correct. Combining like terms shows the two pans hold the same expression.'
          : 'Correct. One test value with different results proves the expressions are not equivalent.',
        wrong(ans, d) {
          if (!d.valueOk) return `Simplify the left pan first: ${c}${v} + ${b}. Then compare it with ${rightText}, or test ${v} = ${t}.`;
          return 'Your yes/no is right, but the reason must come from combining like terms or from testing a value, not from how the sides look.';
        },
      },
    };
  });

  // ---------- Test equivalence by substitution (cloze) ----------
  G.define('e6_substituteTest', (r) => {
    const v = r.pick(VARS);
    const a = r.int(2, 5),
      b = r.int(1, 6);
    const t = r.int(2, 6);
    const equivalent = r.chance(0.5);
    const first = `${a}(${v} + ${b})`;
    const second = equivalent ? `${a}${v} + ${a * b}` : `${a}${v} + ${b}`;
    const firstVal = a * (t + b);
    const secondVal = equivalent ? firstVal : a * t + b;
    const c0 = r.shuffle(distinct([String(firstVal), String(a * t + b), String(a + t + b)]));
    const c1 = r.shuffle(distinct([String(secondVal), String(a * (t + b) + (equivalent ? b : 0) + 1), String(a + t + b)]));
    const name = r.pick(NAMES);
    return {
      type: 'cloze',
      skill: 'test-equivalence',
      lesson: '6-6',
      title: 'Test with a value',
      prompt: `<p>${name} wants to know whether ${hl(first)} and ${hl(second)} are equivalent, and tests ${hl(v + ' = ' + t)}.</p><p>Complete the test.</p>`,
      template: `${first} at ${v} = ${t}: ${a}(${t} + ${b}) = {0}.  ${second} at ${v} = ${t}: {1}.  The values are {2}, so the expressions {3}.`,
      choices: [c0, c1, ['equal', 'not equal'], ['are not equivalent', 'could be equivalent']],
      answers: [c0.indexOf(String(firstVal)), c1.indexOf(String(secondVal)), equivalent ? 0 : 1, equivalent ? 1 : 0],
      hints: [
        `Substitute ${t} for ${v} in each expression and follow the order of operations. In ${first}, add inside the parentheses first.`,
        `${a}(${t} + ${b}) = ${a} × ${t + b}. In ${second}, multiply ${a} × ${t} first, then add.`,
        'If one test value gives different results, the expressions are not equivalent. If it gives the same result, the test supports equivalence, and the distributive property can confirm it.',
      ],
      solution: `<p>${first} → ${a}(${t + b}) = ${firstVal}. ${second} → ${a}(${t}) + ${equivalent ? a * b : b} = ${secondVal}. ${
        equivalent
          ? `The values are <b>equal</b>, so the expressions <b>could be equivalent</b>. They are: distributing gives ${a}(${v} + ${b}) = ${a}${v} + ${a * b}.`
          : `The values are <b>not equal</b>, so the expressions <b>are not equivalent</b>. Distributing ${a} to both terms gives ${a}${v} + ${a * b}, not ${a}${v} + ${b}.`
      }</p>`,
      feedback: {
        correct: equivalent
          ? 'Correct. Equal values support equivalence; the distributive property proves it.'
          : 'Correct. One test value with different results is enough to show the expressions are not equivalent.',
        wrong(ans, dt) {
          if (dt.wrong.includes(0)) return `In ${first}, add inside the parentheses first: ${t} + ${b} = ${t + b}, then multiply by ${a}.`;
          if (dt.wrong.includes(1)) return `In ${second}, multiply first: ${a} × ${t} = ${a * t}, then add the constant.`;
          return `Compare ${firstVal} and ${secondVal}. Different values mean not equivalent. Equal values mean the expressions could be equivalent.`;
        },
      },
    };
  });

  // ---------- Who justified equivalence correctly? (who) ----------
  G.define('e6_whoEquivalent', (r) => {
    const [n1, n2, n3] = r.pickN(NAMES, 3);
    const v = r.pick(VARS);
    const a = r.int(2, 5),
      b = r.int(1, 6);
    const first = `${a}(${v} + ${b})`,
      wrongForm = `${a}${v} + ${b}`;
    const t = 1;
    const opts = [
      {
        html: `<b>${n1}:</b> Not equivalent. At ${v} = ${t}, ${first} = ${a * (t + b)} but ${wrongForm} = ${a * t + b}. One test with different values is enough.`,
        ok: true,
      },
      {
        html: `<b>${n2}:</b> Equivalent. Both expressions contain ${a}, ${v}, and ${b}, so they must have the same value.`,
        why: `Having the same numbers and letters does not make expressions equivalent. ${a} must multiply both ${v} and ${b}, so ${first} = ${a}${v} + ${a * b}.`,
      },
      {
        html: `<b>${n3}:</b> Not equivalent, because one expression has parentheses and the other does not.`,
        why: `Parentheses alone do not decide equivalence. ${a}(${v} + ${b}) and ${a}${v} + ${a * b} look different but are equivalent. Test values or use the distributive property.`,
      },
    ];
    const sh = shuffleOptions(r, opts, 0);
    return {
      type: 'who',
      skill: 'test-equivalence',
      lesson: '6-6',
      title: 'Who justified it correctly?',
      prompt: `<p>Three apprentices decide whether ${hl(first)} and ${hl(wrongForm)} are equivalent.</p><p>Who is correct, with a correct reason?</p>`,
      options: sh.options,
      answer: sh.answer,
      layout: 'cards',
      hints: [
        'Equivalent expressions have the same value for every value of the variable. A single test value that gives different results proves two expressions are not equivalent.',
        `Try ${v} = ${t}: ${first} = ${a}(${t + b}) = ${a * (t + b)}, and ${wrongForm} = ${a * t + b}.`,
        'Also check the reasoning. A reason about how the expressions look is not a mathematical reason.',
      ],
      solution: `<p>${n1} is correct. At ${v} = ${t}, the expressions give ${a * (t + b)} and ${a * t + b}, so they are <b>not equivalent</b>. ${n2} judged by appearance; ${n3} reached the right answer with a wrong reason. The equivalent form of ${first} is ${a}${v} + ${a * b}, because ${a} multiplies both terms inside.</p>`,
      feedback: { correct: `Correct. ${n1} tested a value and compared the results.` },
    };
  });

  // ---------- Match equations to the property they show (match) ----------
  G.define('e6_propertyMatch', (r) => {
    const v = r.pick(VARS);
    const a = r.int(2, 9),
      b = r.int(2, 9),
      c = r.int(2, 6);
    const examples = [
      { prop: 'Commutative property', eq: r.chance(0.5) ? `${v} + ${a} = ${a} + ${v}` : `${v} · ${a} = ${a} · ${v}` },
      { prop: 'Associative property', eq: r.chance(0.5) ? `(${v} + ${a}) + ${b} = ${v} + (${a} + ${b})` : `(${c} · ${a}) · ${v} = ${c} · (${a} · ${v})` },
      { prop: 'Distributive property', eq: `${c}(${v} + ${b}) = ${c}${v} + ${c * b}` },
      { prop: 'Identity property', eq: r.chance(0.5) ? `${v} + 0 = ${v}` : `1 · ${v} = ${v}` },
    ];
    const order = r.shuffle([0, 1, 2, 3]);
    const left = examples.map((e) => e.eq);
    const right = order.map((i) => examples[i].prop);
    const pairs = examples.map((_, i) => [i, order.indexOf(i)]);
    return {
      type: 'match',
      skill: 'test-equivalence',
      lesson: '6-6',
      title: 'Which property explains it?',
      prompt: `<p>Each equation shows two equivalent expressions. Match each equation to the property that explains why the two sides are equivalent.</p>`,
      left,
      right,
      pairs,
      hints: [
        'Commutative: the order changes. Associative: the grouping changes. Distributive: a factor is multiplied by each term inside parentheses. Identity: adding 0 or multiplying by 1 leaves the value unchanged.',
        `In ${examples[2].eq}, the ${c} is multiplied by both ${v} and ${b}.`,
        'If the same numbers appear in a different order, think commutative. If the parentheses move, think associative.',
      ],
      solution: `<p>${examples.map((e) => `${e.eq} → <b>${e.prop}</b>`).join('; ')}. The commutative property changes order, the associative property changes grouping, the distributive property multiplies each term inside the parentheses, and the identity property uses 0 for addition or 1 for multiplication.</p>`,
      feedback: {
        correct: 'Correct. Order, grouping, distributing, and identity: four reasons two expressions can be equivalent.',
        wrong(ans, dt) {
          const i = dt.wrong[0];
          const e = examples[i] || examples[0];
          return `Look at ${e.eq} again. ${i === 0 ? 'Only the order changed.' : i === 1 ? 'Only the grouping (parentheses) changed.' : i === 2 ? 'A factor was multiplied by each term inside the parentheses.' : 'Adding 0 or multiplying by 1 left the value unchanged.'}`;
        },
      },
    };
  });

  // ---------- Compare two expressions in a table (table) ----------
  G.define('e6_tableCompare', (r) => {
    const v = r.pick(VARS);
    const a = r.int(2, 4),
      b = r.int(1, 5);
    const equivalent = r.chance(0.5);
    const first = `${a}(${v} + ${b})`;
    const second = equivalent ? `${a}${v} + ${a * b}` : `${a}${v} + ${b}`;
    const xs = [1, 2, 3];
    const rows = [[v, first, second]];
    const inputs = [];
    xs.forEach((x, i) => {
      rows.push([String(x), `__IN:f${i}__`, `__IN:s${i}__`]);
      inputs.push({ id: `f${i}`, answer: a * (x + b) }, { id: `s${i}`, answer: equivalent ? a * x + a * b : a * x + b });
    });
    return {
      type: 'table',
      skill: 'test-equivalence',
      lesson: '6-6',
      title: 'Compare the expressions in a table',
      prompt: `<p>Complete the table for ${hl(first)} and ${hl(second)}. Then decide: do the two columns match for every value of ${v}?</p>`,
      rows,
      header: true,
      inputs,
      hints: [
        `Substitute each value of ${v} into both expressions. In ${first}, add inside the parentheses first, then multiply by ${a}.`,
        `Row ${v} = 1: ${first} = ${a}(${1 + b}) = ${a * (1 + b)}; ${second} = ${a}(1) + ${equivalent ? a * b : b} = ${equivalent ? a + a * b : a + b}.`,
        `Keep going for ${v} = 2 and ${v} = 3. ${equivalent ? 'The columns should match.' : 'The columns should differ in every row.'}`,
      ],
      solution: `<p>${xs.map((x) => `${v} = ${x}: ${a * (x + b)} and ${equivalent ? a * x + a * b : a * x + b}`).join('; ')}. ${
        equivalent
          ? `The columns match for every value tested, which supports that the expressions are <b>equivalent</b>. The distributive property confirms it: ${a}(${v} + ${b}) = ${a}${v} + ${a * b}.`
          : `The columns differ, so the expressions are <b>not equivalent</b>. ${first} = ${a}${v} + ${a * b}, because ${a} must multiply both terms inside the parentheses.`
      }</p>`,
      feedback: {
        correct: equivalent ? 'Correct. Matching columns support equivalence, and distributing proves it.' : 'Correct. Different columns show the expressions are not equivalent.',
        wrong(ans, dt) {
          const w = String(dt.wrong[0] || 'f0');
          const i = Number(w.slice(1)) || 0;
          const x = xs[i];
          if (w.startsWith('f')) return `For ${first} at ${v} = ${x}: add first, ${x} + ${b} = ${x + b}, then multiply by ${a}.`;
          return `For ${second} at ${v} = ${x}: multiply first, ${a} × ${x} = ${a * x}, then add ${equivalent ? a * b : b}.`;
        },
      },
    };
  });
})(typeof window !== 'undefined' ? window : globalThis);

/* js/units/u6/gen-factors.js */
/* Zone 7 — The Gear Vault. Lesson 6-7 Find Factors and Multiples. */
(function (root) {
  'use strict';
  const RX = root.RX;
  const { G, V, gcd, shuffleOptions, NAMES, plural } = RX;
  const U = RX.U6;
  const hl = V.hl;
  const lcm = U.lcm;
  const factors = (n) => {
    const out = [];
    for (let k = 1; k <= n; k++) if (n % k === 0) out.push(k);
    return out;
  };
  const list = (arr) => arr.join(', ');
  const distinct = (arr) => arr.filter((x, i) => arr.indexOf(x) === i);

  /** Pairs with an interesting GCF (greater than 1, neither number a multiple of the other unless allowed). */
  function gcfPair(r, opts) {
    const o = opts || {};
    for (let tries = 0; tries < 200; tries++) {
      const a = r.int(o.lo || 8, o.hi || 60),
        b = r.int(o.lo || 8, o.hi || 60);
      if (a === b) continue;
      const g = gcd(a, b);
      if (g < 2) continue;
      if (!o.allowMultiple && (a % b === 0 || b % a === 0)) continue;
      if (o.minG && g < o.minG) continue;
      return [Math.min(a, b), Math.max(a, b)];
    }
    return [18, 24];
  }
  /** Pairs with LCM ≤ 120 and neither a multiple of the other. */
  function lcmPair(r) {
    for (let tries = 0; tries < 300; tries++) {
      const a = r.int(2, 15),
        b = r.int(3, 20);
      if (a === b || a % b === 0 || b % a === 0) continue;
      const l = lcm(a, b);
      if (l > 120 || (l === a * b && a > 9)) continue;
      return [Math.min(a, b), Math.max(a, b)];
    }
    return [6, 8];
  }

  const STOCK_PAIRS = [
    ['bolts', 'nuts'],
    ['brass gears', 'steel gears'],
    ['copper wires', 'glass fuses'],
    ['springs', 'pins'],
    ['oil cans', 'rags'],
  ];
  const KIT_WORDS = ['repair kits', 'tool boxes', 'gift bags', 'crates', 'trays'];

  // ---------- Select every factor (ms) ----------
  G.define('e7_listFactors', (r) => {
    const n = r.pick([12, 16, 18, 20, 24, 28, 30, 32, 36, 40, 42, 45, 48, 50, 54, 56, 60]);
    const fs = factors(n).filter((k) => k !== 1 && k !== n);
    const ok = r.pickN(fs, Math.min(3, fs.length));
    const nonPool = [];
    for (let k = 2; k < n; k++) if (n % k !== 0 && k <= n / 2 + 2) nonPool.push(k);
    const bad = r.pickN(nonPool, 3);
    const opts = ok
      .map((k) => ({ html: String(k), ok: true }))
      .concat(bad.map((k) => ({ html: String(k), why: `${n} ÷ ${k} = ${Math.floor(n / k)} with a remainder of ${n % k}. A factor divides ${n} with no remainder.` })));
    const sh = shuffleOptions(
      r,
      opts,
      ok.map((_, i) => i),
    );
    const name = r.pick(NAMES);
    return {
      type: 'ms',
      skill: 'gcf',
      lesson: '6-7',
      title: 'Select every factor',
      prompt: `<p>${name} has a gear with ${hl(n + ' teeth')}. A smaller gear meshes evenly only if its tooth count is a <b>factor</b> of ${n}.</p><p>Select <b>every</b> number that is a factor of ${n}.</p>`,
      options: sh.options,
      answers: sh.answers,
      hints: [
        `A factor of ${n} divides ${n} with no remainder. Test each number: does it go into ${n} evenly?`,
        `Factor pairs multiply to ${n}. Start with 1 × ${n}, then 2 × ?, 3 × ?, and so on.`,
        `All the factors of ${n}: ${list(factors(n))}.`,
      ],
      solution: `<p>The factors of ${n} are ${list(factors(n))}. From the list, <b>${list(ok.slice().sort((x, y) => x - y))}</b> are factors. ${bad
        .slice()
        .sort((x, y) => x - y)
        .map((k) => `${n} ÷ ${k} leaves a remainder of ${n % k}`)
        .join(', ')}, so those are not factors.</p>`,
      feedback: {
        correct: `Correct. Each of those numbers divides ${n} evenly.`,
        wrong(ans, dt) {
          if (dt.extra && dt.extra.length) return sh.options[dt.extra[0]].why || `That number leaves a remainder when you divide ${n} by it.`;
          return `You missed a factor. Check each number: does ${n} divided by it come out even?`;
        },
      },
    };
  });

  // ---------- Greatest common factor (num) ----------
  G.define('e7_gcf', (r, o) => {
    const hard = !!o.hard;
    let nums;
    if (hard) {
      // three numbers sharing a GCF greater than 1
      for (let tries = 0; tries < 200; tries++) {
        const g = r.pick([2, 3, 4, 5, 6, 8]);
        const ks = r.pickN([2, 3, 4, 5, 6, 7, 8, 9, 10], 3);
        const trio = ks.map((k) => g * k).sort((x, y) => x - y);
        if (trio[2] <= 60 && gcd(gcd(trio[0], trio[1]), trio[2]) === g) {
          nums = trio;
          break;
        }
      }
      if (!nums) nums = [12, 18, 30];
    } else nums = gcfPair(r, { minG: 2 });
    const g = nums.reduce((acc, n) => gcd(acc, n));
    const common = factors(nums[0]).filter((k) => nums.every((n) => n % k === 0));
    const name = r.pick(NAMES);
    const ctx = r.pick([
      `Two gears have ${hl(list(nums))} teeth. The largest tooth count a drive gear can have and still mesh with both is their greatest common factor.`,
      `${name} must find the GCF of ${hl(list(nums))} to size a shared pin.`,
      `The vault lock opens with the greatest common factor of ${hl(list(nums))}.`,
    ]);
    return {
      type: 'num',
      skill: 'gcf',
      lesson: '6-7',
      title: hard ? 'GCF of three numbers' : 'Find the greatest common factor',
      prompt: `<p>${ctx}</p><p>What is the GCF of ${list(nums)}?</p>`,
      answer: g,
      hints: [
        'List the factors of each number. The common factors appear in every list. The GCF is the largest one.',
        nums.map((n) => `Factors of ${n}: ${list(factors(n))}`).join('. ') + '.',
        `Common factors: ${list(common)}. Which is greatest?`,
      ],
      solution: `<p>${nums.map((n) => `Factors of ${n}: ${list(factors(n))}`).join('. ')}. The common factors are ${list(common)}, so the GCF is <b>${g}</b>. It is the largest number that divides ${nums.length === 2 ? 'both' : 'all'} of them with no remainder.</p>`,
      feedback: {
        correct: `Correct. ${g} is the greatest number that divides ${list(nums)} evenly.`,
        wrong(ans, dt) {
          const v = dt.value;
          const l = nums.reduce((acc, n) => lcm(acc, n));
          if (v === l) return `${l} is the least common MULTIPLE. A factor is never bigger than the numbers themselves. Look for the largest number that divides into ${list(nums)}.`;
          if (v != null && v > 1 && v < g && common.includes(v))
            return `${v} is a common factor, but not the greatest. Is there a larger number that divides ${nums.length === 2 ? 'both' : 'all of them'}?`;
          if (v === 1) return `1 is a common factor of every pair, but these numbers share a larger factor. List the factors of each.`;
          return `List all the factors of each number and find the largest one in every list.`;
        },
      },
    };
  });

  // ---------- GCF story: identical groups (mc) ----------
  G.define('e7_gcfStory', (r) => {
    const name = r.pick(NAMES);
    const [a, b] = gcfPair(r, { lo: 8, hi: 48, minG: 3 });
    const g = gcd(a, b);
    const [itemA, itemB] = r.pick(STOCK_PAIRS);
    const kit = r.pick(KIT_WORDS);
    const common = factors(a).filter((k) => b % k === 0 && k > 1 && k < g);
    const l = lcm(a, b);
    // third distractor: a smaller common factor when one exists, else the difference (kept distinct from the other options)
    let third, thirdWhy;
    if (common.length) {
      third = common[common.length - 1];
      thirdWhy = `${third} ${kit} would work, but it is not the greatest. ${g} also divides both ${a} and ${b}.`;
    } else {
      third = [b - a, g + 1, g - 1].find((x) => x > 1 && x !== g && x !== l && x !== a + b);
      thirdWhy = third === b - a ? `${third} is the difference between the counts. The number of ${kit} must divide both ${a} and ${b} evenly.` : `${third} does not divide both ${a} and ${b} evenly, so the kits would not be identical.`;
    }
    const opts = [
      { html: `${g} ${kit}`, ok: true },
      { html: `${l} ${kit}`, why: `${l} is the least common multiple. ${name} has only ${a} ${itemA}, so there cannot be ${l} ${kit}. The number of ${kit} must divide both ${a} and ${b}.` },
      { html: `${third} ${kit}`, why: thirdWhy },
      { html: `${a + b} ${kit}`, why: `${a + b} is the total number of items, not the number of identical ${kit}. Each kit needs a share of both kinds.` },
    ];
    const sh = shuffleOptions(r, opts, 0);
    return {
      type: 'mc',
      skill: 'gcf',
      lesson: '6-7',
      title: 'How many identical kits?',
      prompt: `<p>${name} has ${hl(a + ' ' + itemA)} and ${hl(b + ' ' + itemB)}. Every item must be used, and every kit must be identical.</p><p>What is the <b>greatest</b> number of identical ${kit} ${name} can make?</p>`,
      options: sh.options,
      answer: sh.answer,
      hints: [
        `The number of ${kit} must divide ${a} evenly AND divide ${b} evenly, so it is a common factor.`,
        `Factors of ${a}: ${list(factors(a))}. Factors of ${b}: ${list(factors(b))}.`,
        `The common factors are ${list(factors(a).filter((k) => b % k === 0))}. "Greatest" means take the largest.`,
      ],
      solution: `<p>Identical kits means the number of kits divides both ${a} and ${b}. The GCF of ${a} and ${b} is <b>${g}</b>, so ${name} can make ${g} ${kit}, each with ${a / g} ${plural(a / g, itemA.replace(/s$/, ''), itemA)} and ${b / g} ${plural(b / g, itemB.replace(/s$/, ''), itemB)}. Sharing or packaging into identical groups is a GCF problem.</p>`,
      feedback: { correct: `Correct. ${g} kits, each with ${a / g} ${itemA} and ${b / g} ${itemB}.` },
    };
  });

  // ---------- Factor pairs table (table) ----------
  G.define('e7_factorTable', (r) => {
    const n = r.pick([12, 18, 20, 24, 28, 30, 32, 36, 40, 42, 45, 48, 50, 54, 56, 60]);
    const fs = factors(n);
    const pairs = fs.filter((k) => k * k <= n).map((k) => [k, n / k]);
    const rows = [['First factor', 'Second factor', 'Product']];
    const inputs = [];
    pairs.forEach(([k, m], i) => {
      if (i === 0) rows.push([String(k), String(m), String(n)]);
      else {
        rows.push([String(k), `__IN:p${i}__`, String(n)]);
        inputs.push({ id: `p${i}`, answer: m });
      }
    });
    const name = r.pick(NAMES);
    return {
      type: 'table',
      skill: 'gcf',
      lesson: '6-7',
      title: 'Complete the factor pairs',
      prompt: `<p>${name} lists every factor pair of ${hl(n)} to find all the gear sizes that fit. Complete the table.</p><p class="muted">Each row shows two factors whose product is ${n}.</p>`,
      rows,
      header: true,
      inputs,
      hints: [
        `A factor pair is two numbers that multiply to ${n}. Divide ${n} by the first factor to find its partner.`,
        `${pairs
          .slice(1, 3)
          .map(([k]) => `${n} ÷ ${k} = ?`)
          .join(' and ')}.`,
        `${pairs
          .slice(1, -1)
          .map(([k, m]) => `${k} × ${m} = ${n}`)
          .join('; ')}. One pair remains.`,
      ],
      solution: `<p>${pairs.map(([k, m]) => `${k} × <b>${m}</b>`).join(', ')}. The factors of ${n} are ${list(fs)}. Pairs stop when the first factor passes the second, because the pairs would repeat.</p>`,
      feedback: {
        correct: `Correct. ${n} has ${fs.length} factors in ${pairs.length} pairs.`,
        wrong(ans, dt) {
          const i = Number(String(dt.wrong[0] || 'p1').slice(1)) || 1;
          const k = pairs[i] ? pairs[i][0] : pairs[1][0];
          return `Divide: ${n} ÷ ${k} = ? The two numbers in each row must multiply to ${n}.`;
        },
      },
    };
  });

  // ---------- Least common multiple (num) ----------
  G.define('e7_lcm', (r) => {
    const [a, b] = lcmPair(r);
    const l = lcm(a, b);
    const g = gcd(a, b);
    const mults = (n, upto) => {
      const out = [];
      for (let k = 1; n * k <= upto; k++) out.push(n * k);
      return out;
    };
    const name = r.pick(NAMES);
    const ctx = r.pick([
      `Two gears have ${hl(a)} and ${hl(b)} teeth. Marks on both gears line up again after a number of teeth equal to the least common multiple.`,
      `${name} needs the LCM of ${hl(a)} and ${hl(b)} to set the vault timer.`,
      `The vault dial reads: "Find the least common multiple of ${hl(a)} and ${hl(b)}."`,
    ]);
    return {
      type: 'num',
      skill: 'lcm',
      lesson: '6-7',
      title: 'Find the least common multiple',
      prompt: `<p>${ctx}</p><p>What is the LCM of ${a} and ${b}?</p>`,
      answer: l,
      hints: [
        'List the multiples of each number. The LCM is the smallest number that appears in both lists.',
        `Multiples of ${a}: ${list(mults(a, l))}, … Multiples of ${b}: ${list(mults(b, l))}, …`,
        `Which number is the first to appear in both lists?`,
      ],
      solution: `<p>Multiples of ${a}: ${list(mults(a, l))}. Multiples of ${b}: ${list(mults(b, l))}. The first number in both lists is <b>${l}</b>. ${a * b === l ? `Here the LCM equals the product ${a} × ${b}, because ${a} and ${b} share no factor besides 1.` : `The product ${a} × ${b} = ${a * b} is also a common multiple, but not the least, because ${a} and ${b} share the factor ${g}.`}</p>`,
      feedback: {
        correct: `Correct. ${l} is the smallest number that is a multiple of both ${a} and ${b}.`,
        wrong(ans, dt) {
          const v = dt.value;
          if (v === g) return `${g} is the greatest common FACTOR. A multiple is at least as big as the numbers. List the multiples of ${a} and ${b}.`;
          if (v === a * b && a * b !== l) return `${a * b} is a common multiple, but not the least. ${a} and ${b} share a factor, so a smaller number is in both lists.`;
          if (v === a + b) return `Adding the numbers does not give a common multiple. Skip-count by ${a} and by ${b} until the lists meet.`;
          if (v != null && v > l && v % l === 0) return `${v} is a common multiple, but there is a smaller one. Look for the first match in the lists.`;
          return `List multiples of ${a} and of ${b}. The LCM is the first number in both lists.`;
        },
      },
    };
  });

  // ---------- LCM story: repeating events (mc) ----------
  G.define('e7_lcmStory', (r) => {
    const [a, b] = lcmPair(r);
    const l = lcm(a, b);
    const g = gcd(a, b);
    const name = r.pick(NAMES);
    const ctx = r.pick([
      [
        `A bell in the vault rings every ${hl(a + ' minutes')}. A light flashes every ${hl(b + ' minutes')}. They ring and flash together at noon.`,
        'In how many minutes will they next happen together?',
        'minutes',
      ],
      [`${name} oils one gear every ${hl(a + ' days')} and another every ${hl(b + ' days')}. Both were oiled today.`, 'In how many days will both be oiled on the same day again?', 'days'],
      [
        `Two conveyor belts restart on a cycle: one every ${hl(a + ' seconds')}, the other every ${hl(b + ' seconds')}. They just restarted together.`,
        'How many seconds until they restart together again?',
        'seconds',
      ],
    ]);
    const wrongs = distinct([a * b !== l ? a * b : l * 2, g > 1 ? g : l + Math.max(a, b), a + b].filter((x) => x !== l));
    if (wrongs.length < 2) wrongs.push(l * 2);
    const whyFor = (x) => {
      if (x === a * b) return `${a * b} is a common multiple, but not the first time they meet. Check the smaller multiples of ${a} and ${b} first.`;
      if (x === l * 2 || x === l + Math.max(a, b)) return `${x} is too late. Check the smaller multiples: they meet earlier than that.`;
      if (x === g) return `${g} is the greatest common factor. The events line up at a common MULTIPLE of ${a} and ${b}.`;
      return `${a + b} is the sum. Adding the cycle lengths does not tell when they line up. Skip-count by ${a} and by ${b}.`;
    };
    const opts = [{ html: `${l} ${ctx[2]}`, ok: true }].concat(wrongs.slice(0, 3).map((x) => ({ html: `${x} ${ctx[2]}`, why: whyFor(x) })));
    const sh = shuffleOptions(r, opts, 0);
    return {
      type: 'mc',
      skill: 'lcm',
      lesson: '6-7',
      title: 'When do they line up again?',
      prompt: `<p>${ctx[0]}</p><p>${ctx[1]}</p>`,
      options: sh.options,
      answer: sh.answer,
      hints: [
        `The first event happens at multiples of ${a}. The second happens at multiples of ${b}. They meet at a common multiple.`,
        `Multiples of ${a}: ${a}, ${2 * a}, ${3 * a}, … Multiples of ${b}: ${b}, ${2 * b}, ${3 * b}, …`,
        `The question asks for the NEXT time, so you want the least common multiple.`,
      ],
      solution: `<p>Events that repeat line up at a common multiple. The least common multiple of ${a} and ${b} is <b>${l}</b>, so they happen together again in ${l} ${ctx[2]}. Repeating-event problems are LCM problems.</p>`,
      feedback: { correct: `Correct. ${l} is the first number that is a multiple of both ${a} and ${b}.` },
    };
  });

  // ---------- Sort: factor, multiple, or neither (sort) ----------
  G.define('e7_sortFactorMultiple', (r) => {
    const n = r.pick([6, 8, 9, 10, 12, 14, 15, 16, 18, 20]);
    const fs = factors(n).filter((k) => k !== n);
    const ms = [2, 3, 4, 5].map((k) => k * n);
    const neither = [];
    for (let k = 2; k <= 3 * n; k++) if (n % k !== 0 && k % n !== 0) neither.push(k);
    const items = r.shuffle(
      r
        .pickN(fs, 2)
        .map((k) => ({ html: String(k), bin: 0 }))
        .concat(
          r.pickN(ms, 2).map((k) => ({ html: String(k), bin: 1 })),
          r.pickN(neither, 2).map((k) => ({ html: String(k), bin: 2 })),
        ),
    );
    return {
      type: 'sort',
      skill: 'lcm',
      lesson: '6-7',
      title: `Factor or multiple of ${n}?`,
      prompt: `<p>The gear ${hl(n)} is the master gear. Sort each number: is it a <b>factor</b> of ${n}, a <b>multiple</b> of ${n}, or neither?</p>`,
      bins: [`Factor of ${n}`, `Multiple of ${n}`, 'Neither'],
      items,
      hints: [
        `A factor of ${n} divides ${n} evenly, so it is ${n} or smaller. A multiple of ${n} is ${n} times a whole number, so it is ${n} or larger.`,
        `Factors of ${n}: ${list(factors(n))}. Multiples of ${n}: ${n}, ${2 * n}, ${3 * n}, ${4 * n}, …`,
        'If a number is not in either list, it belongs in Neither.',
      ],
      solution: `<p>Factors of ${n}: ${list(factors(n))}. Multiples of ${n}: ${n}, ${2 * n}, ${3 * n}, ${4 * n}, ${5 * n}, … Factors divide ${n}; multiples are products of ${n}. A number that does neither goes in <b>Neither</b>.</p>`,
      feedback: {
        correct: `Correct. Factors go into ${n}; multiples come out of ${n}.`,
        wrong(ans, dt) {
          const it = items[dt.wrong[0]];
          if (!it) return `Check: does the number divide ${n} evenly? Is it ${n} times a whole number?`;
          if (it.bin === 0) return `${n} ÷ ${it.html} = ${n / Number(it.html)} with no remainder, so ${it.html} is a factor of ${n}.`;
          if (it.bin === 1) return `${it.html} = ${n} × ${Number(it.html) / n}, so it is a multiple of ${n}.`;
          return `${it.html} does not divide ${n} evenly, and it is not ${n} times a whole number. It is neither.`;
        },
      },
    };
  });

  // ---------- Explain: GCF or LCM? (cr) ----------
  G.define('e7_crChoose', (r) => {
    const name = r.pick(NAMES);
    const isGcf = r.chance(0.5);
    let story, a, b, ans, other, unitWord;
    if (isGcf) {
      [a, b] = gcfPair(r, { lo: 8, hi: 48, minG: 3 });
      const [itemA, itemB] = r.pick(STOCK_PAIRS);
      story = `${name} has ${a} ${itemA} and ${b} ${itemB} and wants to make identical ${r.pick(KIT_WORDS)} with nothing left over.`;
      ans = gcd(a, b);
      other = lcm(a, b);
      unitWord = 'kits';
    } else {
      [a, b] = lcmPair(r);
      story = r.pick([
        `A furnace vents every ${a} minutes and a pump cycles every ${b} minutes. Both just happened.`,
        `${name} waters one plant every ${a} days and another every ${b} days. Both were watered today.`,
      ]);
      ans = lcm(a, b);
      other = gcd(a, b);
      unitWord = isGcf ? 'kits' : story.includes('days') ? 'days' : 'minutes';
    }
    const question = isGcf ? `What is the greatest number of identical kits?` : `When will both happen together again?`;
    const sh = shuffleOptions(
      r,
      [
        { html: `${isGcf ? 'GCF' : 'LCM'}: ${ans} ${unitWord}`, ok: true },
        {
          html: `${isGcf ? 'LCM' : 'GCF'}: ${other} ${unitWord}`,
          why: isGcf ? 'Splitting into identical groups needs a common factor, not a common multiple.' : 'Events that repeat line up at a common multiple, not a common factor.',
        },
        { html: `Neither: ${a + b} ${unitWord}`, why: 'Adding the two numbers does not model sharing or repeating.' },
      ],
      0,
    );
    return {
      type: 'cr',
      skill: 'lcm',
      lesson: '6-7',
      title: 'GCF or LCM? Explain',
      prompt: `<p>${story}</p><p><b>${question}</b></p><p>Explain whether this is a GCF problem or an LCM problem and why. Then answer the check question.</p>`,
      starters: ['This is a GCF problem because…', 'This is an LCM problem because…', 'The numbers must divide evenly into…', 'The events line up at a common…'],
      minWords: 10,
      check: { prompt: 'Which choice answers the question?', options: sh.options, answer: sh.answer },
      hints: [
        'Ask: am I splitting things into equal groups (a number that divides both), or waiting for repeating events to line up (a number both divide into)?',
        isGcf ? `The number of kits must divide both ${a} and ${b}. That is a common factor.` : `The meeting time is a multiple of both ${a} and ${b}. That is a common multiple.`,
        isGcf
          ? `Factors of ${a}: ${list(factors(a))}. Factors of ${b}: ${list(factors(b))}. Take the greatest common one.`
          : `Multiples of ${a}: ${a}, ${2 * a}, ${3 * a}, … Multiples of ${b}: ${b}, ${2 * b}, ${3 * b}, … Take the least common one.`,
      ],
      solution: `<p>${isGcf ? `Making identical groups with nothing left over means the group count must divide both ${a} and ${b}. That is a <b>GCF</b> problem: GCF = <b>${ans}</b>.` : `Repeating events line up at a time that both cycle lengths divide into. That is an <b>LCM</b> problem: LCM = <b>${ans}</b>.`} A good explanation names which number has to divide which.</p>`,
      feedback: {
        correct: isGcf ? 'Correct. Sharing into identical groups is a GCF problem.' : 'Correct. Repeating events line up at the LCM.',
        wrong(ans0, d) {
          if (!d.wroteEnough) return 'Write a few more words. Say whether you are dividing into groups or waiting for events to line up.';
          return isGcf
            ? `Your explanation is in. For the check: the kit count must divide both ${a} and ${b}, so use the GCF.`
            : `Your explanation is in. For the check: the meeting time is a multiple of both ${a} and ${b}, so use the LCM.`;
        },
      },
    };
  });
})(typeof window !== 'undefined' ? window : globalThis);

/* js/units/u6/gen-generate.js */
/* Zone 8 — The Forge. Lesson 6-8 Generate Equivalent Expressions. */
(function (root) {
  'use strict';
  const RX = root.RX;
  const { G, V, gcd, shuffleOptions, NAMES, parseNum } = RX;
  const hl = V.hl;
  const VARS = ['x', 'n', 'm', 'k', 'y'];
  const distinct = (arr) => arr.filter((x, i) => arr.indexOf(x) === i);
  const PROPS = ['commutative', 'associative', 'distributive', 'identity'];

  // ---------- Name the property used to rewrite (cloze) ----------
  G.define('e8_propertyCloze', (r) => {
    const v = r.pick(VARS);
    const a = r.int(2, 9),
      b = r.int(2, 9),
      c = r.int(2, 6);
    const cases = [
      { from: `${v} + ${a}`, to: `${a} + ${v}`, prop: 'commutative', op: 'addition', why: 'only the order of the two addends changed' },
      { from: `${v} · ${a}`, to: `${a}${v}`, prop: 'commutative', op: 'multiplication', why: 'only the order of the two factors changed' },
      { from: `(${v} + ${a}) + ${b}`, to: `${v} + (${a} + ${b})`, prop: 'associative', op: 'addition', why: 'only the grouping of the addends changed' },
      { from: `${c} · (${a} · ${v})`, to: `(${c} · ${a}) · ${v}`, prop: 'associative', op: 'multiplication', why: 'only the grouping of the factors changed' },
      { from: `${c}(${v} + ${b})`, to: `${c}${v} + ${c * b}`, prop: 'distributive', op: 'multiplication over addition', why: `${c} was multiplied by each term inside the parentheses` },
      { from: `${v} + 0`, to: v, prop: 'identity', op: 'addition', why: 'adding 0 does not change a value' },
      { from: `1 · ${v}`, to: v, prop: 'identity', op: 'multiplication', why: 'multiplying by 1 does not change a value' },
    ];
    const k = r.pick(cases);
    const propChoices = r.shuffle(PROPS.slice());
    const opChoices = k.prop === 'distributive' ? r.shuffle(['multiplication over addition', 'addition', 'multiplication']) : r.shuffle(['addition', 'multiplication']);
    const name = r.pick(NAMES);
    return {
      type: 'cloze',
      skill: 'properties',
      lesson: '6-8',
      title: 'Name the property',
      prompt: `<p>${name} reshapes the plate ${hl(k.from)} into ${hl(k.to)} without changing its value.</p><p>Complete the sentence.</p>`,
      template: `Rewriting ${k.from} as ${k.to} uses the {0} property of {1}.`,
      choices: [propChoices, opChoices],
      answers: [propChoices.indexOf(k.prop), opChoices.indexOf(k.op)],
      hints: [
        'Commutative: order changes. Associative: grouping (parentheses) changes. Distributive: a factor is multiplied by each term inside parentheses. Identity: adding 0 or multiplying by 1.',
        `Compare ${k.from} with ${k.to}: ${k.why}.`,
        `Which operation is involved: + or ·? That names the "property of ___" part.`,
      ],
      solution: `<p>${k.from} = ${k.to} by the <b>${k.prop} property of ${k.op}</b>, because ${k.why}. Properties let the Foundry rewrite an expression into an equivalent one.</p>`,
      feedback: {
        correct: `Correct. ${k.from} = ${k.to} is the ${k.prop} property.`,
        wrong(ans, dt) {
          if (dt.wrong.includes(0)) return `Look at what changed: ${k.why}. Which property describes that?`;
          return `Look at the operation sign between the parts: that tells you whether it is a property of addition or multiplication.`;
        },
      },
    };
  });

  // ---------- Rewrite with a property (mc) ----------
  G.define('e8_rewriteMc', (r) => {
    const v = r.pick(VARS);
    const a = r.int(2, 6),
      b = r.int(3, 9), // b >= 3 keeps a × b distinct from a + b in the distractors
      c = r.int(1, 9);
    const kind = r.pick(['assocMul', 'commAdd', 'commMul']);
    let text, okText, wrongs, prop;
    if (kind === 'assocMul') {
      text = `${a}(${b}${v})`;
      okText = `${a * b}${v}`;
      prop = 'associative property of multiplication';
      wrongs = [
        { html: `${a + b}${v}`, why: `${a}(${b}${v}) is ${a} × ${b} × ${v}. Multiply the factors ${a} and ${b}; do not add them.` },
        { html: `${a}${v} + ${b}`, why: `There is no addition inside the parentheses. ${b}${v} is a single product, so ${a} multiplies all of it.` },
        { html: `${a * b}${v}${v}`, why: `There is only one ${v}. Regroup the factors: (${a} · ${b}) · ${v}.` },
      ];
    } else if (kind === 'commAdd') {
      text = `${b} + ${v} + ${c}`;
      okText = `${v} + ${b + c}`;
      prop = 'commutative and associative properties of addition';
      wrongs = [
        { html: `${b + c}${v}`, why: `${b} and ${c} are added to ${v}, not multiplied. A constant cannot be combined into the coefficient.` },
        { html: `${b}${v} + ${c}`, why: `${b} + ${v} means add. Reordering does not turn addition into multiplication.` },
        { html: `${v} + ${b * c}`, why: `The constants are added, not multiplied: ${b} + ${c} = ${b + c}.` },
      ];
    } else {
      text = `${v} · ${a} · ${b}`;
      okText = `${a * b}${v}`;
      prop = 'commutative and associative properties of multiplication';
      wrongs = [
        { html: `${v} + ${a * b}`, why: `The dots mean multiply. The factors can be reordered, but the operation stays multiplication.` },
        { html: `${a + b}${v}`, why: `${a} and ${b} are multiplied together: ${a} × ${b} = ${a * b}.` },
        { html: `${a}${v} + ${b}${v}`, why: `That is ${a}${v} plus ${b}${v}, which combines to ${a + b}${v}. The original is a product of three factors.` },
      ];
    }
    const opts = [{ html: okText, ok: true }].concat(wrongs);
    const sh = shuffleOptions(r, opts, 0);
    return {
      type: 'mc',
      skill: 'properties',
      lesson: '6-8',
      title: 'Rewrite in simplest form',
      prompt: `<p>A plate reads ${hl(text)}. Use the properties of operations to write it in simplest form.</p><p>Which expression is equivalent?</p>`,
      options: sh.options,
      answer: sh.answer,
      hints: [
        'The commutative property lets you reorder; the associative property lets you regroup. Neither one changes the operation.',
        kind === 'commAdd' ? `Reorder so the constants are together: ${v} + (${b} + ${c}).` : `Group the number factors together: (${a} · ${b}) · ${v}.`,
        kind === 'commAdd' ? `${b} + ${c} = ${b + c}.` : `${a} × ${b} = ${a * b}, so the coefficient of ${v} is ${a * b}.`,
      ],
      solution: `<p>${text} = <b>${okText}</b> by the ${prop}. ${kind === 'commAdd' ? `Reorder and regroup to add the constants: ${b} + ${c} = ${b + c}.` : `Regroup the factors so the numbers multiply first: ${a} × ${b} = ${a * b}.`} The operation never changes, only the order or grouping.</p>`,
      feedback: { correct: `Correct. ${text} = ${okText}.` },
    };
  });

  // ---------- Distributive property with numbers (num) ----------
  G.define('e8_distributeNumber', (r) => {
    const name = r.pick(NAMES);
    const kind = r.pick(['mental', 'expand']);
    let a, b, c, text;
    if (kind === 'mental') {
      a = r.int(3, 9);
      const n = r.int(12, 49);
      b = Math.floor(n / 10) * 10;
      c = n % 10 || 5;
      text = `${a} × ${b + c}`;
    } else {
      a = r.int(3, 9);
      b = r.int(2, 9);
      c = r.int(2, 9);
      text = `${a}(${b} + ${c})`;
    }
    const val = a * (b + c);
    const prompt =
      kind === 'mental'
        ? `<p>${name} must find ${hl(text)} without a calculator. Break ${b + c} into ${b} + ${c} and use the distributive property: ${a}(${b} + ${c}) = ${a} × ${b} + ${a} × ${c}.</p><p>What is ${text}?</p>`
        : `<p>${name} checks a plate that reads ${hl(text)}. Use the distributive property to find its value: multiply ${a} by each addend, then add.</p><p>What is the value of ${text}?</p>`;
    return {
      type: 'num',
      skill: 'properties',
      lesson: '6-8',
      title: kind === 'mental' ? 'Multiply with the distributive property' : 'Distribute, then add',
      prompt,
      answer: val,
      hints: [
        `The distributive property says ${a}(${b} + ${c}) = ${a} × ${b} + ${a} × ${c}. Multiply ${a} by each part.`,
        `${a} × ${b} = ${a * b} and ${a} × ${c} = ${a * c}.`,
        `${a * b} + ${a * c} = ?`,
      ],
      solution: `<p>${a}(${b} + ${c}) = ${a} × ${b} + ${a} × ${c} = ${a * b} + ${a * c} = <b>${val}</b>. Check: ${b} + ${c} = ${b + c} and ${a} × ${b + c} = ${val}. Distributing gives the same value because ${a} multiplies every part of the sum.</p>`,
      feedback: {
        correct: `Correct. ${a} × ${b} + ${a} × ${c} = ${val}.`,
        wrong(ans, dt) {
          const w = dt.value;
          if (w === a * b + c) return `You distributed ${a} to only one term. ${a} must multiply both ${b} and ${c}: ${a * b} + ${a * c}.`;
          if (w === a + b + c) return `${a}(${b} + ${c}) means multiply ${a} by the sum. Do not add ${a}.`;
          if (w === a * b * c) return `Inside the parentheses is a sum, so distribute: ${a} × ${b} + ${a} × ${c}.`;
          return `Multiply ${a} by each addend separately, then add the two products.`;
        },
      },
    };
  });

  // ---------- Sort: equivalent to a(x + b) or not (sort) ----------
  G.define('e8_sortEquivalent', (r) => {
    const v = r.pick(VARS);
    const a = r.int(2, 6),
      b = r.int(2, 9);
    const text = `${a}(${v} + ${b})`;
    const items = r.shuffle([
      { html: `${a}${v} + ${a * b}`, bin: 0 },
      { html: `${a * b} + ${a}${v}`, bin: 0 },
      { html: `${a}(${b} + ${v})`, bin: 0 },
      { html: `${a}${v} + ${b}`, bin: 1 },
      { html: `${a + b}${v}`, bin: 1 },
      { html: `(${a} + ${v})${b}`, bin: 1 },
    ]);
    return {
      type: 'sort',
      skill: 'properties',
      lesson: '6-8',
      title: 'Equivalent or not?',
      prompt: `<p>The master plate reads ${hl(text)}. Sort each expression: is it <b>equivalent</b> to ${text} or <b>not</b>?</p><p class="muted">Use the distributive and commutative properties, or test a value of ${v}.</p>`,
      bins: [`Equivalent to ${text}`, 'Not equivalent'],
      items,
      hints: [
        `Distribute: ${a}(${v} + ${b}) = ${a}${v} + ${a * b}. Reordering terms or addends keeps an expression equivalent.`,
        `Test ${v} = 1: ${text} = ${a * (1 + b)}. Any equivalent expression must also give ${a * (1 + b)}.`,
        `${a}${v} + ${b} gives ${a + b} at ${v} = 1, and ${a + b}${v} gives ${a + b}. Neither matches ${a * (1 + b)}.`,
      ],
      solution: `<p>${text} = <b>${a}${v} + ${a * b}</b> by the distributive property; ${a * b} + ${a}${v} and ${a}(${b} + ${v}) are the same expression reordered, so they are equivalent too. ${a}${v} + ${b} distributes to only one term, ${a + b}${v} adds the constant into the coefficient, and (${a} + ${v})${b} multiplies the wrong parts. At ${v} = 1 those give ${a + b}, ${a + b}, and ${(a + 1) * b} instead of ${a * (1 + b)}.</p>`,
      feedback: {
        correct: 'Correct. Distributing and reordering keep expressions equivalent; changing which numbers get multiplied does not.',
        wrong(ans, dt) {
          const it = items[dt.wrong[0]];
          if (!it) return `Distribute first: ${text} = ${a}${v} + ${a * b}. Then compare.`;
          if (it.bin === 0) return `${it.html} is equivalent. It is ${a}${v} + ${a * b} with its parts in a different order, or ${text} with the addends swapped.`;
          if (it.html === `${a}${v} + ${b}`) return `${it.html} forgot to multiply ${b} by ${a}. The distributive property multiplies every term inside.`;
          if (it.html === `${a + b}${v}`) return `${it.html} added ${b} to the coefficient. ${b} is a constant inside the parentheses; it gets multiplied by ${a}, not added to it.`;
          return `${it.html} multiplies ${b} by the sum, not ${a}. Test ${v} = 1 to see the values differ.`;
        },
      },
    };
  });

  // ---------- Expand with the distributive property (blanks + area model) ----------
  G.define('e8_expand', (r, o) => {
    const hard = !!o.hard;
    const v = r.pick(VARS);
    const a = hard ? r.int(3, 9) : r.int(2, 6);
    const k = hard ? r.int(2, 5) : 1;
    const b = hard ? r.int(2, 12) : r.int(1, 9);
    const inner = `${k === 1 ? '' : k}${v} + ${b}`;
    const text = `${a}(${inner})`;
    const coef = a * k,
      cons = a * b;
    const svg = V.areaModel({
      rows: [String(a)],
      cols: [k === 1 ? v : `${k}${v}`, String(b)],
      cells: hard ? null : [['', '']],
      aria: `Area model with one row labeled ${a} and columns labeled ${k === 1 ? v : k + v} and ${b}`,
    });
    const name = r.pick(NAMES);
    return {
      type: 'blanks',
      skill: 'distributive',
      lesson: '6-8',
      title: hard ? 'Expand (two coefficients)' : 'Expand the expression',
      prompt: `<p>${name} must expand ${hl(text)} so each part of the plate can be read.</p>${hard ? '' : svg}<p>Use the distributive property to write an equivalent expression without parentheses.</p>`,
      fields: [
        { label: `coefficient of ${v}`, answer: coef, width: 'xs' },
        { label: 'constant', answer: cons, width: 'xs' },
      ],
      template: `${text} = {0}${v} + {1}`,
      hints: [
        `Distribute: multiply ${a} by each term inside the parentheses. ${hard ? '' : 'In the area model, each rectangle is one product.'}`,
        `${a} × ${k === 1 ? v : k + v} = ${coef}${v}. Now multiply ${a} × ${b}.`,
        `${a} × ${b} = ${cons}. Write the two products with a plus sign between them.`,
      ],
      solution: `<p>${text} = ${a} · ${k === 1 ? v : k + v} + ${a} · ${b} = <b>${coef}${v} + ${cons}</b>. ${hard ? '' : 'The area model shows why: the big rectangle is split into two smaller ones whose areas add.'} Check with ${v} = 1: ${text} = ${a * (k + b)} and ${coef}(1) + ${cons} = ${coef + cons}.</p>`,
      feedback: {
        correct: `Correct. ${text} = ${coef}${v} + ${cons}.`,
        wrong(ans) {
          const x = parseNum(ans[0]),
            y = parseNum(ans[1]);
          if (x === coef && y === b) return `You distributed to only one term. ${a} must also multiply ${b}: ${a} × ${b} = ${cons}.`;
          if (x === k && y === cons) return `You distributed to only one term. ${a} must also multiply ${k === 1 ? v : k + v}: ${coef}${v}.`;
          if (x === a + k && y === a + b) return `Distributing means multiply, not add. ${a} × ${k === 1 ? v : k + v} and ${a} × ${b}.`;
          return `Multiply ${a} by each term inside: ${a} × ${k === 1 ? v : k + v} and ${a} × ${b}.`;
        },
      },
    };
  });

  // ---------- Factor with the GCF (blanks, template) ----------
  G.define('e8_factor', (r, o) => {
    const hard = !!o.hard;
    const v = r.pick(VARS);
    let g, p, q;
    for (let tries = 0; tries < 100; tries++) {
      g = hard ? r.pick([4, 6, 8, 9, 12]) : r.pick([2, 3, 4, 5, 6]);
      p = r.int(1, hard ? 7 : 5);
      q = r.int(1, hard ? 9 : 6);
      if (gcd(p, q) === 1 && p !== q) break;
    }
    const A = g * p,
      B = g * q;
    const text = `${A}${v} + ${B}`;
    const name = r.pick(NAMES);
    const common = [];
    for (let k = 2; k < g; k++) if (A % k === 0 && B % k === 0) common.push(k);
    return {
      type: 'blanks',
      skill: 'distributive',
      lesson: '6-8',
      title: hard ? 'Factor with a larger GCF' : 'Factor using the GCF',
      prompt: `<p>${name} must make the plate ${hl(text)} compact. Factor it using the <b>greatest common factor</b> of the two terms.</p><p>Write the equivalent expression as a product.</p>`,
      fields: [
        { label: 'GCF', answer: g, width: 'xs' },
        { label: `coefficient of ${v}`, answer: p, width: 'xs' },
        { label: 'constant', answer: q, width: 'xs' },
      ],
      template: `${text} = {0}({1}${v} + {2})`,
      hints: [
        `Find the GCF of ${A} and ${B}. That number goes outside the parentheses.`,
        `The GCF of ${A} and ${B} is ${g}. Divide each term by ${g}: ${A}${v} ÷ ${g} and ${B} ÷ ${g}.`,
        `${A} ÷ ${g} = ${p} and ${B} ÷ ${g} = ${q}. Check by distributing back.`,
      ],
      solution: `<p>The GCF of ${A} and ${B} is ${g}. ${A}${v} = ${g} · ${p}${v} and ${B} = ${g} · ${q}, so ${text} = <b>${g}(${p === 1 ? '' : p}${v} + ${q})</b>. Check by distributing: ${g} × ${p}${v} = ${A}${v} and ${g} × ${q} = ${B}. Factoring is the distributive property used backward.</p>`,
      feedback: {
        correct: `Correct. ${text} = ${g}(${p === 1 ? '' : p}${v} + ${q}). Distribute back to check.`,
        wrong(ans) {
          const x = parseNum(ans[0]),
            y = parseNum(ans[1]),
            z = parseNum(ans[2]);
          if (x != null && common.includes(x) && y === A / x && z === B / x) return `${x} is a common factor, but not the greatest. ${y}${v} + ${z} still shares a factor. Use the GCF, ${g}.`;
          if (x === g && y === A && z === q) return `Divide BOTH terms by ${g}. ${A}${v} ÷ ${g} = ${p}${v}.`;
          if (x === g && y === p && z === B) return `Divide BOTH terms by ${g}. ${B} ÷ ${g} = ${q}.`;
          if (x === g && (y === A - g || z === B - g)) return `Factoring divides, it does not subtract. ${A} ÷ ${g} and ${B} ÷ ${g}.`;
          return `Find the GCF of ${A} and ${B}, then divide each term by it. Distribute back to check.`;
        },
      },
    };
  });

  // ---------- Perimeter expressions (ms + rectangle) ----------
  G.define('e8_perimeter', (r) => {
    const v = r.pick(VARS);
    const k = r.pick([1, 2, 3]);
    const b = r.int(2, 9);
    const side = k === 1 ? v : `${k}${v}`;
    const svg = V.rectangle(8, 4, { w: side, h: String(b), aria: `Rectangle with length ${side} and width ${b}` });
    const name = r.pick(NAMES);
    const thing = r.pick(['brass plate', 'furnace door', 'gear housing', 'window frame']);
    const opts = [
      { html: `2(${side} + ${b})`, ok: true },
      { html: `${2 * k}${v} + ${2 * b}`, ok: true },
      { html: `${side} + ${b} + ${side} + ${b}`, ok: true },
      { html: `${side} + ${b}`, why: `That is only two of the four sides. A rectangle has two lengths and two widths.` },
      { html: `${2 * k}${v} + ${b}`, why: `Both sides must be doubled. There are two widths of ${b}, so the constant is ${2 * b}.` },
      { html: `${k * b}${v}`, why: `${side} × ${b} is the area, not the perimeter. Perimeter adds the side lengths.` },
    ];
    const sh = shuffleOptions(r, opts, [0, 1, 2]);
    return {
      type: 'ms',
      skill: 'distributive',
      lesson: '6-8',
      title: 'Expressions for the perimeter',
      prompt: `<p>${name} measures a rectangular ${thing}. Its length is ${hl(side)} and its width is ${hl(b)}.</p>${svg}<p>Select <b>every</b> expression that gives the perimeter of the ${thing}.</p>`,
      options: sh.options,
      answers: sh.answers,
      hints: [
        'Perimeter is the distance around: add all four sides. A rectangle has two lengths and two widths.',
        `Adding the sides: ${side} + ${b} + ${side} + ${b}. Combine like terms to simplify.`,
        `${2 * k}${v} + ${2 * b} can also be factored with the GCF 2: 2(${side} + ${b}). All three forms are equivalent.`,
      ],
      solution: `<p>Perimeter = ${side} + ${b} + ${side} + ${b} = <b>${2 * k}${v} + ${2 * b}</b> = <b>2(${side} + ${b})</b>. The three correct expressions are equivalent: adding the four sides, combining like terms, and factoring out the GCF 2 all describe the same distance. ${k * b}${v} is the area, and ${side} + ${b} is only half the perimeter.</p>`,
      feedback: {
        correct: 'Correct. Combining like terms and factoring produce equivalent perimeter expressions.',
        wrong(ans, dt) {
          if (dt.extra && dt.extra.length) return sh.options[dt.extra[0]].why || 'That expression does not give the perimeter.';
          return `You missed an equivalent form. ${side} + ${b} + ${side} + ${b}, ${2 * k}${v} + ${2 * b}, and 2(${side} + ${b}) all give the perimeter.`;
        },
      },
    };
  });

  // ---------- Error: distributed to one term only (error) ----------
  G.define('e8_errorExpand', (r) => {
    const name = r.pick(NAMES);
    const v = r.pick(VARS);
    const a = r.int(2, 9),
      b = r.int(2, 9);
    const text = `${a}(${v} + ${b})`;
    const kind = r.pick(['oneTerm', 'added']);
    const work = kind === 'oneTerm' ? `${text} = ${a}${v} + ${b}` : `${text} = ${a + 1}${v} + ${a + b}`;
    const opts = [
      {
        html:
          kind === 'oneTerm'
            ? `${name} distributed ${a} to only the first term. ${a} must multiply both ${v} and ${b}.`
            : `${name} added ${a} to each term instead of multiplying. Distributing means ${a} × ${v} and ${a} × ${b}.`,
        ok: true,
      },
      {
        html: kind === 'oneTerm' ? `${name} should have added ${a} to ${b} instead.` : `${name} should have multiplied only the first term.`,
        why: kind === 'oneTerm' ? `Distributing means multiplying, not adding. ${a} × ${b} = ${a * b}.` : `The distributive property multiplies ${a} by every term inside the parentheses.`,
      },
      { html: `${name} should have written ${a}${v}${b}.`, why: `${v} and ${b} are added inside the parentheses, so the result has two terms joined by +.` },
      { html: 'The work is correct.', why: `Test ${v} = 1: ${text} = ${a * (1 + b)}, but the work gives ${kind === 'oneTerm' ? a + b : a + 1 + a + b}.` },
    ];
    const sh = shuffleOptions(r, opts, 0);
    return {
      type: 'error',
      skill: 'distributive',
      lesson: '6-8',
      title: 'Find the mistake',
      prompt: `<p>${name} expanded ${hl(text)} at the forge. The plate came out wrong.</p><p>What is the mistake?</p>`,
      work,
      options: sh.options,
      answer: sh.answer,
      fix: { label: 'The correct constant term is', answer: a * b },
      hints: [
        `Picture an area model with one row labeled ${a} and two columns labeled ${v} and ${b}. Each rectangle is a product.`,
        `${a} × ${v} = ${a}${v}. ${a} × ${b} = ?`,
        `Test a value. At ${v} = 1, ${text} = ${a}(${1 + b}) = ${a * (1 + b)}. Does the student's expression give the same?`,
      ],
      solution: `<p>${kind === 'oneTerm' ? `${name} multiplied ${a} by ${v} but left ${b} alone.` : `${name} added ${a} instead of multiplying.`} The distributive property multiplies ${a} by <b>each</b> term: ${text} = ${a}${v} + <b>${a * b}</b>. Check at ${v} = 1: ${a * (1 + b)} both ways.</p>`,
      feedback: {
        correct: `Correct. ${text} = ${a}${v} + ${a * b}.`,
        wrong(ans, dt) {
          if (!dt.mistakeOk) return (sh.options[ans.mistake] && sh.options[ans.mistake].why) || `Check whether ${a} was multiplied by both terms.`;
          return `You found the mistake. For the fix: ${a} × ${b}.`;
        },
      },
    };
  });
})(typeof window !== 'undefined' ? window : globalThis);

/* js/units/u6/gen-cave.js */
/* Optional zone — The Boiler Vaults. Harder, mixed-skill challenge generators (prefix ec_). */
(function (root) {
  'use strict';
  const RX = root.RX;
  const { G, V, gcd, simplify, shuffleOptions, NAMES, parseNum } = RX;
  const U = RX.U6;
  const hl = V.hl;
  const F = (a, b) => V.frac(a, b);
  const T = U.fracText;
  const PT = U.powText;
  const sq = (x) => x * x;
  const VARS = ['x', 'n', 'm', 'k'];
  const distinct = (arr) => arr.filter((x, i) => arr.indexOf(x) === i);

  /** Proper fraction a/b in lowest terms with denominator from the pool. */
  function properFrac(r, pool) {
    const b = r.pick(pool);
    const choices = [];
    for (let a = 1; a < b; a++) if (gcd(a, b) === 1) choices.push(a);
    return [r.pick(choices), b];
  }

  // ---------- Mixed ÷ mixed story with a mixed-number quotient (blanks, template) ----------
  G.define('ec_mixedDivideStory', (r) => {
    let w1, a1, b1, w2, a2, b2, n1, n2, qn, qd, mix;
    for (let tries = 0; tries < 300; tries++) {
      w1 = r.int(2, 9);
      [a1, b1] = properFrac(r, [2, 3, 4, 5, 6, 8]);
      w2 = r.int(1, 3);
      [a2, b2] = properFrac(r, [2, 3, 4]);
      n1 = w1 * b1 + a1;
      n2 = w2 * b2 + a2;
      [qn, qd] = simplify(n1 * b2, b1 * n2);
      mix = U.toMixed(n1 * b2, b1 * n2);
      if (qd !== 1 && mix[0] >= 1 && mix[0] <= 9 && qd <= 12) break;
    }
    const [W, N, D] = mix;
    const name = r.pick(NAMES);
    const ctx = r.pick([
      [`A boiler pipe ${U.mixedText(w1, a1, b1)} meters long is cut into sections each ${U.mixedText(w2, a2, b2)} meters long.`, 'How many sections is that?'],
      [`${name} has ${U.mixedText(w1, a1, b1)} gallons of coal oil. Each burner holds ${U.mixedText(w2, a2, b2)} gallons.`, 'How many burners can be filled?'],
      [`A vault shift lasts ${U.mixedText(w1, a1, b1)} hours. Each inspection round takes ${U.mixedText(w2, a2, b2)} hours.`, 'How many rounds fit in the shift?'],
    ]);
    return {
      type: 'blanks',
      skill: 'divide-mixed',
      lesson: '6-2',
      title: 'Challenge: two mixed numbers',
      xp: 20,
      prompt: `<p>${ctx[0]}</p><p>${ctx[1]} Evaluate ${hl(U.mixedText(w1, a1, b1) + ' ÷ ' + U.mixedText(w2, a2, b2))} and write the quotient as a mixed number in simplest form.</p>`,
      fields: [
        { label: 'whole number', answer: W, width: 'xs' },
        { label: 'numerator', answer: N, width: 'xs' },
        { label: 'denominator', answer: D, width: 'xs' },
      ],
      template: 'Quotient = {0} and {1}/{2}',
      hints: [
        `Rewrite BOTH mixed numbers as fractions first: ${U.mixedText(w1, a1, b1)} = ${n1}/${b1} and ${U.mixedText(w2, a2, b2)} = ${n2}/${b2}.`,
        `Keep ${n1}/${b1}, change ÷ to ×, flip ${n2}/${b2} to ${b2}/${n2}: ${n1}/${b1} × ${b2}/${n2} = ${n1 * b2}/${b1 * n2}.`,
        `${n1 * b2}/${b1 * n2}${qn !== n1 * b2 ? ` simplifies to ${qn}/${qd}` : ''}. ${qd} goes into ${qn} ${W} times with ${N} left over.`,
      ],
      solution: `<p>Rewrite: ${U.mixed(w1, a1, b1)} = ${F(n1, b1)} and ${U.mixed(w2, a2, b2)} = ${F(n2, b2)}. Keep, Change, Flip: ${F(n1, b1)} × ${F(b2, n2)} = ${F(n1 * b2, b1 * n2)}${qn !== n1 * b2 ? ` = ${F(qn, qd)}` : ''} = <b>${U.mixed(W, N, D)}</b>. So ${W} full ${ctx[0].includes('pipe') ? 'sections' : ctx[0].includes('burner') ? 'burners' : 'rounds'}, with ${T(N, D)} of one more. Both mixed numbers must be rewritten before anything is flipped.</p>`,
      feedback: {
        correct: `Correct. Rewrite both, flip only the divisor, multiply, then convert back: ${U.mixedText(W, N, D)}.`,
        wrong(ans) {
          const x = parseNum(ans[0]),
            y = parseNum(ans[1]),
            z = parseNum(ans[2]);
          if (x === W && y != null && z && Math.abs(y / z - N / D) < 1e-9) return 'Your mixed number is equivalent to the answer, but the fraction part is not in simplest form.';
          const wholeOnly = w1 / w2;
          if (x != null && y != null && z && Math.abs(x + y / z - wholeOnly) < 1e-6) return `You divided only the whole numbers. Rewrite each mixed number as a single fraction first.`;
          const mult = (n1 / b1) * (n2 / b2);
          if (x != null && y != null && z && Math.abs(x + y / z - mult) < 1e-6) return `You multiplied instead of dividing. Flip the divisor ${n2}/${b2} to ${b2}/${n2} first.`;
          return `Rewrite: ${n1}/${b1} ÷ ${n2}/${b2}. Then ${n1}/${b1} × ${b2}/${n2}. Convert back to a mixed number.`;
        },
      },
    };
  });

  // ---------- Multi-step numerical expression with exponents (num) ----------
  G.define('ec_powerExpression', (r) => {
    const a = r.int(2, 5),
      b = r.int(1, 4),
      c = r.int(2, 4),
      d = r.int(2, 6);
    const kind = r.int(0, 2);
    let text, value, steps, ltr, baseTimes;
    if (kind === 0) {
      // (a + b)² − c³ ÷ ... keep integer: (a + b)² − c² + d
      text = `(${a} + ${b})${U.supText(2)} − ${PT(c, 2)} + ${d}`;
      value = sq(a + b) - sq(c) + d;
      steps = [`${a} + ${b} = ${a + b}`, `${PT(a + b, 2)} = ${sq(a + b)} and ${PT(c, 2)} = ${sq(c)}`, `${sq(a + b)} − ${sq(c)} = ${sq(a + b) - sq(c)}`, `${sq(a + b) - sq(c)} + ${d} = ${value}`];
      ltr = sq(a + b) - sq(c) + d;
      baseTimes = (a + b) * 2 - c * 2 + d;
    } else if (kind === 1) {
      // a × (d − 1)² + c³
      text = `${a} × (${d} − 1)${U.supText(2)} + ${PT(c, 3)}`;
      value = a * sq(d - 1) + c * c * c;
      steps = [`${d} − 1 = ${d - 1}`, `${PT(d - 1, 2)} = ${sq(d - 1)} and ${PT(c, 3)} = ${c * c * c}`, `${a} × ${sq(d - 1)} = ${a * sq(d - 1)}`, `${a * sq(d - 1)} + ${c * c * c} = ${value}`];
      ltr = sq(a * (d - 1)) + c * c * c;
      baseTimes = a * (d - 1) * 2 + c * 3;
    } else {
      // (2³ + a) ÷ b2 × c where b2 divides (8 + a)
      const base8 = 8 + a;
      const divisors = [2, 3, 4, 5, 6].filter((k) => base8 % k === 0);
      const b2 = divisors.length ? r.pick(divisors) : 1;
      text = `(${PT(2, 3)} + ${a}) ÷ ${b2} × ${c}`;
      value = (base8 / b2) * c;
      steps = [`${PT(2, 3)} = 8`, `8 + ${a} = ${base8}`, `${base8} ÷ ${b2} = ${base8 / b2} (left to right, division first)`, `${base8 / b2} × ${c} = ${value}`];
      ltr = value;
      baseTimes = ((6 + a) / b2) * c;
    }
    const name = r.pick(NAMES);
    return {
      type: 'num',
      skill: 'order-ops',
      lesson: '6-4',
      title: 'Challenge: powers in a long expression',
      xp: 20,
      prompt: `<p>The boiler gauge is set by ${hl(text)}. ${name} needs the exact value.</p><p>Evaluate the expression.</p>`,
      answer: value,
      hints: ['Grouping symbols first, then every exponent, then × and ÷ left to right, then + and − left to right.', `${steps[0]}. ${steps[1]}.`, `${steps.slice(0, -1).join('. ')}. One step left.`],
      solution: `<p>${text}: ${steps.map((s, i) => `Step ${i + 1}: ${s}`).join('. ')}. The value is <b>${value}</b>.</p>`,
      feedback: {
        correct: `Correct. ${text} = ${value}.`,
        wrong(ans, dt) {
          const v = dt.value;
          if (v != null && Math.abs(v - baseTimes) < 1e-6) return 'Check each power. An exponent counts factors: 3² = 3 × 3, 2³ = 2 × 2 × 2.';
          if (v != null && ltr !== value && Math.abs(v - ltr) < 1e-6) return 'You worked straight across. Evaluate the exponent before multiplying.';
          return `Start with ${steps[0]}, then evaluate every power before you multiply, divide, add, or subtract.`;
        },
      },
    };
  });

  // ---------- Evaluate with two variables and an exponent (num) ----------
  G.define('ec_twoVariable', (r) => {
    const [v, w] = r.pickN(VARS, 2);
    const a = r.int(2, 5),
      b = r.int(2, 6);
    const x = r.int(2, 6),
      y = r.int(1, 9);
    const kind = r.pick(['sqPlus', 'sumSq', 'minus']);
    let text, value, sub, step, wrongs;
    if (kind === 'sqPlus') {
      text = `${a}${v}${U.supText(2)} + ${b}${w}`;
      value = a * sq(x) + b * y;
      sub = `${a}(${x})${U.supText(2)} + ${b}(${y})`;
      step = `${a} × ${sq(x)} + ${b * y} = ${a * sq(x)} + ${b * y}`;
      wrongs = [
        [sq(a * x) + b * y, `Square only ${v}, not the coefficient: ${v}² = ${x} × ${x} = ${sq(x)}, then multiply by ${a}.`],
        [a * x * 2 + b * y, `${v}² means ${v} × ${v}, not ${v} × 2.`],
      ];
    } else if (kind === 'sumSq') {
      text = `(${v} + ${w})${U.supText(2)} − ${a}${w}`;
      value = sq(x + y) - a * y;
      sub = `(${x} + ${y})${U.supText(2)} − ${a}(${y})`;
      step = `${PT(x + y, 2)} − ${a * y} = ${sq(x + y)} − ${a * y}`;
      wrongs = [
        [sq(x) + sq(y) - a * y, `(${v} + ${w})² means add first, then square the sum. It is not ${v}² + ${w}².`],
        [(x + y) * 2 - a * y, `Squaring means multiplying the sum by itself, not by 2.`],
      ];
    } else {
      // b·v² − w·v  (keep positive): choose x ≥ 2 so b x² > y x when y ≤ b x; ensure y < b*x
      const yy = Math.min(y, b * x - 1);
      text = `${b}${v}${U.supText(2)} − ${w}${v}`;
      value = b * sq(x) - yy * x;
      sub = `${b}(${x})${U.supText(2)} − (${yy})(${x})`;
      step = `${b} × ${sq(x)} − ${yy * x} = ${b * sq(x)} − ${yy * x}`;
      wrongs = [
        [b * sq(x) - (yy + x), `${w}${v} means ${w} times ${v}: ${yy} × ${x} = ${yy * x}.`],
        [sq(b * x) - yy * x, `Square only ${v}: ${x}² = ${sq(x)}. Then multiply by ${b}.`],
      ];
      return build(text, value, sub, step, wrongs, x, yy);
    }
    return build(text, value, sub, step, wrongs, x, y);

    function build(text, value, sub, step, wrongs, xv, yv) {
      const name = r.pick(NAMES);
      return {
        type: 'num',
        skill: 'evaluate-algebraic',
        lesson: '6-5',
        title: 'Challenge: two variables and a power',
        xp: 20,
        prompt: `<p>The vault plate reads ${hl(text)}. For this job, ${hl(`${v} = ${xv}`)} and ${hl(`${w} = ${yv}`)}.</p><p>${name} must evaluate the expression.</p>`,
        answer: value,
        hints: [
          'Substitute each variable with its value, using parentheses. Then follow the order of operations: exponents before multiplying, multiplying before adding or subtracting.',
          `${sub}.`,
          `${step}.`,
        ],
        solution: `<p>Substitute ${v} = ${xv} and ${w} = ${yv}: ${sub} = ${step} = <b>${value}</b>. An exponent applies only to the base it is attached to; a coefficient multiplies after the power is found.</p>`,
        feedback: {
          correct: `Correct. ${sub} = ${value}.`,
          wrong(ans, dt) {
            const got = dt.value;
            const hit = wrongs.find(([val]) => got != null && Math.abs(got - val) < 1e-6);
            if (hit) return hit[1];
            return `Substitute with parentheses: ${sub}. Evaluate the power first, then multiply, then add or subtract.`;
          },
        },
      };
    }
  });

  // ---------- Match four pairs of equivalent expressions (match) ----------
  G.define('ec_equivalentHard', (r) => {
    const v = r.pick(VARS);
    let items;
    for (let tries = 0; tries < 60; tries++) {
      const a = r.int(2, 5),
        b = r.int(1, 6),
        c = r.int(2, 6),
        d = r.int(1, 5),
        e = r.int(2, 4),
        f = r.int(1, 4),
        g = r.pick([2, 3, 4, 6]),
        h = r.int(2, 5),
        k2 = r.int(1, 6);
      items = [
        { left: `${a}(${v} + ${b})`, right: `${a}${v} + ${a * b}` }, // expand
        { left: `${c}${v} + ${d} + ${e}${v}`, right: `${c + e}${v} + ${d}` }, // combine like terms
        { left: `${f}(${v} + 1) + ${v}`, right: `${f + 1}${v} + ${f}` }, // distribute then combine
        { left: `${g * h}${v} + ${g * k2}`, right: `${g}(${h}${v} + ${k2})` }, // factor
      ];
      const lefts = items.map((i) => i.left),
        rights = items.map((i) => i.right);
      if (distinct(lefts).length === 4 && distinct(rights).length === 4 && !lefts.some((l) => rights.includes(l))) break;
    }
    const order = r.shuffle([0, 1, 2, 3]);
    const left = items.map((i) => i.left);
    const right = order.map((i) => items[i].right);
    const pairs = items.map((_, i) => [i, order.indexOf(i)]);
    return {
      type: 'match',
      skill: 'test-equivalence',
      lesson: '6-8',
      title: 'Challenge: match the equivalent expressions',
      xp: 20,
      prompt: `<p>Four plates on the left were rewritten into the four plates on the right. Match each expression to its equivalent form.</p><p class="muted">Expand, combine like terms, or factor. If you are stuck, test ${v} = 1 on both sides.</p>`,
      left,
      right,
      pairs,
      hints: [
        'Simplify each left-hand expression: distribute any factor over the parentheses, then combine like terms.',
        `For ${items[0].left}, distribute to get ${items[0].right}. For ${items[1].left}, combine the ${v}-terms.`,
        `For ${items[3].left}, factor out the GCF ${items[3].right.match(/^\d+/)[0]}. Check any pair by testing ${v} = 1.`,
      ],
      solution: `<p>${items.map((i) => `${i.left} = ${i.right}`).join('; ')}. Expanding, combining like terms, and factoring all produce equivalent expressions, and testing a value such as ${v} = 1 confirms each match.</p>`,
      feedback: {
        correct: 'Correct. Each pair has the same value for every value of the variable.',
        wrong(ans, dt) {
          const i = dt.wrong[0];
          const it = items[i] || items[0];
          return `Look at ${it.left} again. ${i === 3 ? 'Find the GCF of its two terms and factor it out.' : i === 1 ? `Combine only the ${v}-terms; the constant stays.` : 'Distribute the factor to every term inside, then combine like terms.'} Test ${v} = 1 if you are unsure.`;
        },
      },
    };
  });

  // ---------- GCF and LCM of the same pair (blanks, two-col) ----------
  G.define('ec_gcfLcmBoth', (r) => {
    let a, b;
    for (let tries = 0; tries < 300; tries++) {
      a = r.int(6, 30);
      b = r.int(8, 36);
      if (a === b || a % b === 0 || b % a === 0) continue;
      if (gcd(a, b) < 2) continue;
      if (U.lcm(a, b) > 120) continue;
      break;
    }
    const g = gcd(a, b),
      l = U.lcm(a, b);
    const name = r.pick(NAMES);
    const fa = [],
      fb = [];
    for (let k = 1; k <= a; k++) if (a % k === 0) fa.push(k);
    for (let k = 1; k <= b; k++) if (b % k === 0) fb.push(k);
    return {
      type: 'blanks',
      skill: 'lcm',
      lesson: '6-7',
      title: 'Challenge: GCF and LCM together',
      xp: 20,
      prompt: `<p>Two boiler gears have ${hl(a)} and ${hl(b)} teeth. ${name} needs both numbers: the GCF sizes the shared pin, and the LCM tells when the marks line up again.</p><p>Find the GCF and the LCM of ${a} and ${b}.</p>`,
      fields: [
        { label: 'GCF', answer: g, width: 'sm' },
        { label: 'LCM', answer: l, width: 'sm' },
      ],
      layout: 'two-col',
      hints: [
        'GCF: the largest number that divides both. LCM: the smallest number that both divide into. The GCF is never bigger than the numbers; the LCM is never smaller.',
        `Factors of ${a}: ${fa.join(', ')}. Factors of ${b}: ${fb.join(', ')}. The GCF is the largest number in both lists.`,
        `For the LCM, list multiples of ${b}: ${b}, ${2 * b}, ${3 * b}, … and stop at the first one that ${a} divides. Shortcut: ${a} × ${b} ÷ GCF.`,
      ],
      solution: `<p>GCF: the common factors of ${a} and ${b} are ${fa.filter((k) => b % k === 0).join(', ')}, so the GCF is <b>${g}</b>. LCM: the first common multiple is <b>${l}</b>. Check: ${a} × ${b} ÷ ${g} = ${(a * b) / g}, which equals the LCM, because the product counts the shared factor ${g} twice.</p>`,
      feedback: {
        correct: `Correct. GCF ${g}, LCM ${l}. Notice ${g} × ${l} = ${a} × ${b}.`,
        wrong(ans) {
          const x = parseNum(ans[0]),
            y = parseNum(ans[1]);
          if (x === l && y === g) return 'You swapped them. The GCF is a factor (smaller than or equal to the numbers); the LCM is a multiple (larger than or equal to them).';
          if (x !== g && y === l) return `The LCM is right. For the GCF, find the largest number that divides both ${a} and ${b}.`;
          if (x === g && y === a * b && a * b !== l) return `The GCF is right. ${a * b} is a common multiple, but not the least. Divide it by the GCF ${g}.`;
          if (x === g && y !== l) return `The GCF is right. For the LCM, list multiples of ${b} until you reach one that ${a} divides.`;
          return `List the factors of each number for the GCF. List multiples for the LCM.`;
        },
      },
    };
  });

  // ---------- Factor a three-term perimeter with the GCF (mc) ----------
  G.define('ec_perimeterFactor', (r) => {
    const [v, w] = r.pickN(VARS, 2);
    let g, p, q, s;
    for (let tries = 0; tries < 100; tries++) {
      g = r.pick([2, 3, 4, 5, 6]);
      p = r.int(1, 5);
      q = r.int(1, 5);
      s = r.int(1, 7);
      if (gcd(gcd(p, q), s) === 1 && p !== q) break;
    }
    const A = g * p,
      B = g * q,
      C = g * s;
    const sides = [`${A}${v}`, `${B}${w}`, String(C)];
    const sum = `${A}${v} + ${B}${w} + ${C}`;
    const okText = `${g}(${p === 1 ? '' : p}${v} + ${q === 1 ? '' : q}${w} + ${s})`;
    const smaller = [];
    for (let k = 2; k < g; k++) if (A % k === 0 && B % k === 0 && C % k === 0) smaller.push(k);
    const k2 = smaller.length ? smaller[smaller.length - 1] : null;
    const opts = [
      { html: okText, ok: true },
      { html: `${g}(${p === 1 ? '' : p}${v} + ${q === 1 ? '' : q}${w}) + ${C}`, why: `${C} is also a multiple of ${g}. The GCF must be factored out of all three terms.` },
      { html: `${g}(${p === 1 ? '' : p}${v} + ${q === 1 ? '' : q}${w} + ${C})`, why: `Distribute back: ${g} × ${C} = ${g * C}, not ${C}. Divide every term by ${g}.` },
      k2
        ? { html: `${k2}(${A / k2}${v} + ${B / k2}${w} + ${C / k2})`, why: `${k2} is a common factor but not the greatest. The terms inside still share a factor of ${g / k2}.` }
        : { html: `${A + B + C}${v}${w}`, why: `The three sides are unlike terms. They cannot be combined into a single term.` },
    ];
    const sh = shuffleOptions(r, opts, 0);
    const name = r.pick(NAMES);
    return {
      type: 'mc',
      skill: 'distributive',
      lesson: '6-8',
      title: 'Challenge: factor a three-term sum',
      xp: 20,
      prompt: `<p>${name} measures a triangular boiler hatch. Its sides are ${hl(sides[0])}, ${hl(sides[1])}, and ${hl(sides[2])}.</p><p>The perimeter is ${sum}. Which expression is the perimeter <b>factored using the greatest common factor</b>?</p>`,
      options: sh.options,
      answer: sh.answer,
      hints: [
        `Find the GCF of all three coefficients: ${A}, ${B}, and ${C}.`,
        `The GCF is ${g}. Divide each term by ${g}: ${A}${v} ÷ ${g}, ${B}${w} ÷ ${g}, ${C} ÷ ${g}.`,
        `Inside the parentheses: ${p}${v} + ${q}${w} + ${s}. Distribute ${g} back to check that you get ${sum}.`,
      ],
      solution: `<p>The GCF of ${A}, ${B}, and ${C} is ${g}. Dividing each term by ${g} gives ${p}${v}, ${q}${w}, and ${s}, so the perimeter is <b>${okText}</b>. Check: ${g} × ${p}${v} = ${A}${v}, ${g} × ${q}${w} = ${B}${w}, ${g} × ${s} = ${C}. Factoring with the GCF leaves no common factor inside.</p>`,
      feedback: { correct: `Correct. ${sum} = ${okText}.` },
    };
  });

  // ---------- Multi-step work with one wrong step (error) ----------
  G.define('ec_errorChain', (r) => {
    const name = r.pick(NAMES);
    const a = r.int(2, 6),
      b = r.int(2, 4),
      c = r.int(5, 9),
      d = r.int(1, 4);
    const text = `${a} + ${PT(b, 2)} × (${c} − ${d})`;
    const inner = c - d;
    const value = a + sq(b) * inner;
    const kind = r.pick(['power', 'addFirst', 'parens']);
    let work, okText, fixWhy;
    if (kind === 'power') {
      work = `${text} = ${a} + ${PT(b, 2)} × ${inner} = ${a} + ${b * 2} × ${inner} = ${a} + ${b * 2 * inner} = ${a + b * 2 * inner}`;
      okText = `Step 2: ${name} computed ${PT(b, 2)} as ${b} × 2. The exponent means ${b} × ${b} = ${sq(b)}.`;
    } else if (kind === 'addFirst') {
      work = `${text} = ${a} + ${PT(b, 2)} × ${inner} = ${a} + ${sq(b)} × ${inner} = ${a + sq(b)} × ${inner} = ${(a + sq(b)) * inner}`;
      okText = `Step 3: ${name} added ${a} + ${sq(b)} before multiplying. Multiplication comes before addition.`;
    } else {
      work = `${text} = ${a} + ${PT(b, 2)} × ${c} − ${d} = ${a} + ${sq(b)} × ${c} − ${d} = ${a} + ${sq(b) * c} − ${d} = ${a + sq(b) * c - d}`;
      okText = `Step 1: ${name} dropped the parentheses. ${c} − ${d} must be evaluated first, as a group.`;
    }
    fixWhy = `${c} − ${d} = ${inner}; ${PT(b, 2)} = ${sq(b)}; ${sq(b)} × ${inner} = ${sq(b) * inner}; ${a} + ${sq(b) * inner} = ${value}`;
    const others = [
      {
        k: 'power',
        html: `${name} computed ${PT(b, 2)} as ${b} × 2 instead of ${b} × ${b}.`,
        why: `In this work the power step is ${kind === 'parens' || kind === 'addFirst' ? 'correct' : 'the error, but it is described in another option'}. Compare each step with the order of operations.`,
      },
      {
        k: 'addFirst',
        html: `${name} added before multiplying.`,
        why: `Look at the step where ${sq(b)} is used. ${kind === 'addFirst' ? 'That is the error, described in another option.' : 'In this work the multiplication is done before the addition.'}`,
      },
      {
        k: 'parens',
        html: `${name} ignored the parentheses around ${c} − ${d}.`,
        why: `${kind === 'parens' ? 'That is the error, described in another option.' : `The parentheses were handled correctly: ${c} − ${d} = ${inner} in step 1.`}`,
      },
    ].filter((o) => o.k !== kind);
    const opts = [{ html: okText, ok: true }].concat(
      others.map((o) => ({ html: o.html, why: o.why })),
      [{ html: 'Every step is correct.', why: `The correct value is ${value}. One step breaks the order of operations.` }],
    );
    const sh = shuffleOptions(r, opts, 0);
    return {
      type: 'error',
      skill: 'order-ops',
      lesson: '6-4',
      title: 'Challenge: find the broken step',
      xp: 20,
      prompt: `<p>${name} evaluated ${hl(text)} in four steps. One step is wrong.</p><p>Which step breaks the rules?</p>`,
      work,
      options: sh.options,
      answer: sh.answer,
      fix: { label: 'The correct value is', answer: value },
      hints: [
        'Check the steps in order: parentheses, then exponents, then multiplication, then addition.',
        `Step 1 should give ${c} − ${d} = ${inner}. Step 2 should give ${PT(b, 2)} = ${sq(b)}.`,
        `Then ${sq(b)} × ${inner} = ${sq(b) * inner}, and finally add ${a}.`,
      ],
      solution: `<p>${okText} Correct work: ${fixWhy}. The value is <b>${value}</b>.</p>`,
      feedback: {
        correct: `Correct. The right order gives ${value}.`,
        wrong(ans, dt) {
          if (!dt.mistakeOk) return (sh.options[ans.mistake] && sh.options[ans.mistake].why) || 'Redo the expression yourself, one rule at a time, and compare each step.';
          return `You found the broken step. For the fix: ${fixWhy.split(';').slice(0, 3).join(';')}, then add ${a}.`;
        },
      },
    };
  });

  // ---------- Order expressions by value at a given x (seq) ----------
  G.define('ec_seqValues', (r) => {
    const v = r.pick(VARS);
    const x = r.int(2, 5);
    const pool = [
      { html: `${v}${U.supText(2)}`, rate: sq(x) },
      { html: `2${v} + ${r.int(1, 4)}`, rate: null },
      { html: `${r.int(3, 5)}${v} − ${r.int(1, 3)}`, rate: null },
      { html: `${v}${U.supText(3)} ÷ ${v}`, rate: sq(x) },
      { html: `(${v} + 1)${U.supText(2)}`, rate: sq(x + 1) },
      { html: `${r.int(2, 4)}(${v} + ${r.int(1, 3)})`, rate: null },
      { html: `${r.int(10, 20)} − ${v}`, rate: null },
    ];
    // compute rates for the linear ones from their html
    const evalLinear = (html) => {
      let m;
      if ((m = html.match(/^2(\w) \+ (\d+)$/))) return 2 * x + Number(m[2]);
      if ((m = html.match(/^(\d+)(\w) − (\d+)$/))) return Number(m[1]) * x - Number(m[3]);
      if ((m = html.match(/^(\d+)\((\w) \+ (\d+)\)$/))) return Number(m[1]) * (x + Number(m[3]));
      if ((m = html.match(/^(\d+) − (\w)$/))) return Number(m[1]) - x;
      return null;
    };
    pool.forEach((p) => {
      if (p.rate == null) p.rate = evalLinear(p.html);
    });
    let items;
    for (let tries = 0; tries < 80; tries++) {
      items = r.pickN(pool, 4);
      const rates = items.map((i) => i.rate);
      if (distinct(rates).length === 4 && rates.every((q) => q != null && q > 0)) break;
    }
    const asc = r.chance(0.5);
    const order = items.map((_, i) => i).sort((p, q) => (asc ? items[p].rate - items[q].rate : items[q].rate - items[p].rate));
    return {
      type: 'seq',
      skill: 'evaluate-algebraic',
      lesson: '6-5',
      title: 'Challenge: order by value',
      xp: 20,
      prompt: `<p>Four plates must be stacked by value when ${hl(v + ' = ' + x)}. Order them from <b>${asc ? 'least' : 'greatest'}</b> value (top) to <b>${asc ? 'greatest' : 'least'}</b> value (bottom).</p>`,
      items: items.map((i) => ({ html: `<span class="big">${i.html}</span>`, rate: i.rate })),
      order,
      hints: [
        `Substitute ${x} for ${v} in each expression and evaluate it. Do not judge by how long the expression looks.`,
        `Values: ${items.map((i) => `${i.html} = ${i.rate}`).join('; ')}.`,
        `${asc ? 'Smallest' : 'Largest'} first: ${order.map((i) => items[i].rate).join(', ')}.`,
      ],
      solution: `<p>At ${v} = ${x}: ${items.map((i) => `${i.html} = ${i.rate}`).join('; ')}. From ${asc ? 'least to greatest' : 'greatest to least'}: <b>${order.map((i) => items[i].html).join(', ')}</b>. Evaluating each expression is the only reliable way to compare them.</p>`,
      feedback: {
        correct: 'Correct. Substituting first makes the order clear.',
        wrong() {
          return `Evaluate each expression at ${v} = ${x}: ${items.map((i) => i.rate).join(', ')}. Then put the ${asc ? 'least' : 'greatest'} at the top.`;
        },
      },
    };
  });
})(typeof window !== 'undefined' ? window : globalThis);
