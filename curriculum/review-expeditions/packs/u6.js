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
  const FRACTION_WORDS_ES = { 2: 'medios', 3: 'tercios', 4: 'cuartos', 5: 'quintos', 6: 'sextos', 8: 'octavos', 10: 'décimos', 12: 'doceavos' };
  const ONE_WORD = { 6: 'one-sixth', 8: 'one-eighth', 10: 'one-tenth', 12: 'one-twelfth' };

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
    const w = hard ? r.int(6, 12) : r.int(2, 4);
    const d = hard ? r.pick([3, 4, 5, 6, 8, 10, 12]) : r.pick([2, 3, 4, 5, 6]);
    const ans = w * d;
    const [item, unit] = r.pick(STOCK);
    const one = unit === 'feet' ? 'foot' : unit.slice(0, -1);
    const bars = Array.from(
      { length: w },
      (_, i) => `<div><div class="viz-cap">${one} ${i + 1}</div>${V.bar({ parts: d, shaded: d, width: 180, aria: `One whole cut into ${d} equal parts` })}</div>`,
    ).join('');
    return {
      type: 'num',
      skill: 'divide-whole',
      lesson: '6-1',
      title: hard ? 'How many pieces?' : 'How many fit inside?',
      prompt: hard
        ? `<p>The intake gears cut ${hl(w + ' ' + unit)} of ${item} into pieces that are each ${hl(U.fracText(1, d) + ' ' + one)} long. No stock is wasted.</p><p>Write a division expression for the situation, then find how many pieces the machine makes.</p>`
        : `<p>The intake gears cut ${hl(w + ' ' + unit)} of ${item} into pieces that are each ${hl(U.fracText(1, d) + ' ' + one)} long.</p><div class="viz-row">${bars}</div><p class="muted">Each whole ${one} is split into ${FRACTION_WORDS[d]}.</p><p>How many pieces does the machine make? Write and evaluate ${w} ÷ ${F(1, d)}.</p>`,
      unit: 'pieces',
      answer: ans,
      hints: [
        `The question asks how many ${FRACTION_WORDS[d]} are in ${w} wholes. Dividing by a fraction asks "how many of these fit inside?"`,
        `Put a 1 under the whole number so both are fractions: ${w}/1 ÷ 1/${d}. Then Keep, Change, Flip: ${w}/1 × ${d}/1.`,
        `Multiply across: ${w} × ${d}. Each whole holds ${d} pieces, and there are ${w} wholes.`,
      ],
      hintEs: `La pregunta es cuántos ${FRACTION_WORDS_ES[d]} caben en ${w} enteros. Dividir entre una fracción pregunta "¿cuántas de estas partes caben?".`,
      solution: `<p>${w} ÷ ${F(1, d)} asks how many ${FRACTION_WORDS[d]} fit in ${w}. Write ${w} as ${F(w, 1)}, then Keep, Change, Flip: ${F(w, 1)} × ${F(d, 1)} = ${F(w * d, 1)} = <b>${ans}</b>. Each whole holds ${d} ${FRACTION_WORDS[d]}, so ${w} wholes hold ${w} × ${d} = ${ans} pieces. The quotient is bigger than ${w} because each piece is smaller than 1.</p>`,
      feedback: {
        correct: `Correct. ${w} wholes, ${d} ${FRACTION_WORDS[d]} in each, make ${ans} pieces. Dividing by a unit fraction gives a bigger number.`,
        wrong(ans0, dt) {
          const v = dt.value;
          if (v != null && Math.abs(v - w / d) < 1e-6) return `You multiplied ${w} by 1/${d}. In Keep, Change, Flip, the divisor 1/${d} flips to ${d}/1 before you multiply.`;
          if (v === w + d) return `Adding ${w} and ${d} does not answer "how many pieces." Count the ${FRACTION_WORDS[d]}: each whole holds ${d} of them.`;
          if (v === d) return `${d} is the number of pieces in ONE whole. There are ${w} wholes, so multiply.`;
          if (v != null && v < w) return `Your answer is smaller than ${w}. Each piece is less than 1 ${one}, so there must be MORE than ${w} pieces.`;
          return `Think: how many ${FRACTION_WORDS[d]} are in 1 whole? Then multiply by ${w} wholes.`;
        },
      },
    };
  });

  // ---------- Keep, Change, Flip steps (cloze) ----------
  G.define('e1_kcfSteps', (r, o) => {
    const hard = !!o.hard;
    if (hard) {
      // a/b ÷ w where the product must be simplified
      const [a, b] = r.pick([
        [2, 3],
        [4, 5],
        [6, 7],
        [3, 4],
        [4, 7],
        [6, 11],
        [8, 9],
      ]);
      const w = r.pick([2, 3, 4, 6].filter((x) => gcd(a, x) > 1));
      const [sn, sd] = simplify(a, b * w);
      const stepOne = r.shuffle([`${w}/1`, `1/${w}`, `${b}/${a}`]);
      const stepTwo = r.shuffle([`1/${w}`, `${w}/1`, `${b}/${a}`]);
      const right = U.fracText(sn, sd);
      const results = r.shuffle([right, U.fracText(...simplify(a * w, b)), `${a}/${b * w}`]);
      return {
        type: 'cloze',
        skill: 'divide-whole',
        lesson: '6-1',
        title: 'Set the three steps',
        prompt: `<p>The intake plate shows ${hl(U.fracText(a, b) + ' ÷ ' + w)}. Complete the three steps. The last step must be in simplest form.</p>`,
        template: `Step 1: Put a 1 under the whole number: ${a}/${b} ÷ {0}.  Step 2: Keep, Change, Flip: ${a}/${b} × {1}.  Step 3: Multiply across and simplify: {2}.`,
        choices: [stepOne, stepTwo, results],
        answers: [stepOne.indexOf(`${w}/1`), stepTwo.indexOf(`1/${w}`), results.indexOf(right)],
        hints: [
          `Write ${w} over 1. Then keep ${a}/${b}, change ÷ to ×, and flip only the divisor.`,
          `${w}/1 flips to 1/${w}. Multiply: ${a} × 1 on top, ${b} × ${w} on the bottom.`,
          `The product is ${a}/${b * w}. Divide the top and bottom by ${gcd(a, b * w)} to simplify.`,
        ],
        hintEs: `Escribe ${w} sobre 1. Luego mantén ${a}/${b}, cambia ÷ por × e invierte solo el divisor.`,
        solution: `<p>Step 1: ${w} = ${F(w, 1)}. Step 2: Keep ${F(a, b)}, change ÷ to ×, flip ${F(w, 1)} to ${F(1, w)}. Step 3: ${F(a, b)} × ${F(1, w)} = ${F(a, b * w)} = <b>${F(sn, sd)}</b>. Dividing by ${w} makes the amount smaller, so the quotient is less than ${U.fracText(a, b)}.</p>`,
        feedback: {
          correct: `Correct. ${a}/${b} × 1/${w} = ${a}/${b * w} = ${sn}/${sd}.`,
          wrong(ans, dt) {
            if (dt.wrong.includes(0)) return `Step 1: only the whole number ${w} gets a 1 underneath. ${w}/1 still equals ${w}.`;
            if (dt.wrong.includes(1))
              return stepTwo[ans[1]] === `${b}/${a}`
                ? `Step 2: you flipped the first fraction. Keep ${a}/${b} and flip the divisor ${w}/1.`
                : `Step 2: change ÷ to × AND flip the divisor. ${w}/1 must become 1/${w}.`;
            if (results[ans[2]] === U.fracText(...simplify(a * w, b))) return `Step 3: that is ${a}/${b} × ${w}. You multiply by 1/${w}, so the denominator grows.`;
            return `Step 3: multiply across to get ${a}/${b * w}, then divide the top and bottom by the same number.`;
          },
        },
      };
    }
    const w = r.int(2, 9);
    const d = r.pick([2, 3, 4, 5, 6, 8]);
    const flipped = `${d}/1`;
    const stepOne = r.shuffle([`${w}/1`, `1/${w}`, `${w}/${d}`]);
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
      answers: [stepOne.indexOf(`${w}/1`), stepTwo.indexOf(flipped), results.indexOf(String(w * d))],
      hints: [
        'A whole number becomes a fraction when you write it over 1. Its value does not change.',
        `Keep ${w}/1. Change ÷ to ×. Flip only the second fraction: 1/${d} becomes ${d}/1.`,
        `${w}/1 × ${d}/1 = (${w} × ${d})/(1 × 1). Multiply the tops, multiply the bottoms.`,
      ],
      hintEs: 'Un número entero se convierte en fracción cuando lo escribes sobre 1. Su valor no cambia.',
      solution: `<p>Step 1: ${w} = ${F(w, 1)}. Step 2: Keep ${F(w, 1)}, change ÷ to ×, flip ${F(1, d)} to ${F(d, 1)}. Step 3: ${F(w, 1)} × ${F(d, 1)} = ${F(w * d, 1)} = <b>${w * d}</b>. Only the divisor is flipped, because dividing by a number is the same as multiplying by its reciprocal.</p>`,
      feedback: {
        correct: `Correct. Write the whole number over 1, flip only the divisor, then multiply across: ${w * d}.`,
        wrong(ans, dt) {
          if (dt.wrong.includes(0)) return `Step 1: writing ${w} over 1 keeps its value. ${w}/1 is still ${w}.`;
          if (dt.wrong.includes(1)) return `Step 2: only the second fraction flips. 1/${d} flipped is ${d}/1.`;
          if (results[ans[2]] === String(w + d)) return `Step 3: you added ${w} and ${d}. Multiply across instead: ${w} × ${d} on top, 1 × 1 on the bottom.`;
          return `Step 3: multiply straight across. ${w} × ${d} on top and 1 × 1 on the bottom.`;
        },
      },
    };
  });

  // ---------- Story: whole ÷ unit fraction (mc) ----------
  G.define('e1_storyDivide', (r, o) => {
    const hard = !!o.hard;
    const name = r.pick(NAMES);
    if (hard) {
      // Two steps: find the total, then divide by the unit fraction.
      const m = r.int(2, 4);
      const p = r.int(m === 2 ? 3 : 2, 5);
      const d = r.pick([3, 4, 5, 6, 8]);
      const t = m * p;
      const ctx = r.pick([
        [`${name} has ${m} jugs of gear oil, and each jug holds ${p} cups. Each oil can holds ${U.fracText(1, d)} cup.`, 'How many cans can be filled?', 'cans'],
        [`The Foundry has ${m} sacks of iron filings. Each sack weighs ${p} pounds. The filings are poured into bags that each hold ${U.fracText(1, d)} pound.`, 'How many bags are filled?', 'bags'],
        [`${name} works ${m} shifts of ${p} hours each. Each dial inspection takes ${U.fracText(1, d)} hour.`, `How many inspections can ${name} finish?`, 'inspections'],
        [`There are ${m} chains, and each chain is ${p} meters long. Every chain is cut into links that are ${U.fracText(1, d)} meter long.`, 'How many links are made in all?', 'links'],
      ]);
      const opts = [
        { html: `${t * d} ${ctx[2]}`, ok: true },
        { html: `${p * d} ${ctx[2]}`, why: `${p * d} is ${p} ÷ 1/${d}, the count for just ONE of the ${m} groups. Find the total first: ${m} × ${p} = ${t}.` },
        { html: `${(m + p) * d} ${ctx[2]}`, why: `You added ${m} + ${p} to find the total. There are ${m} groups of ${p}, so the total is ${m} × ${p}.` },
        {
          html: `${U.asMixed(t, d)} ${ctx[2]}`,
          why: `${U.asMixedText(t, d)} comes from multiplying ${t} × 1/${d}. Dividing by 1/${d} means multiplying by ${d}/1, so the answer is bigger than ${t}.`,
        },
      ];
      const sh = shuffleOptions(r, opts, 0);
      return {
        type: 'mc',
        skill: 'divide-whole',
        lesson: '6-1',
        title: 'Divide to solve the story',
        prompt: `<p>${ctx[0]}</p><p>${ctx[1]}</p>`,
        options: sh.options,
        answer: sh.answer,
        hints: [
          `First find the total amount: ${m} groups of ${p}. Then divide the total by 1/${d}.`,
          `The total is ${m} × ${p} = ${t}. Now ${t} ÷ 1/${d} = ${t}/1 × ${d}/1.`,
          `${t} × ${d} = ? The quotient should be larger than ${t}.`,
        ],
        hintEs: `Primero halla la cantidad total: ${m} grupos de ${p}. Luego divide el total entre 1/${d}.`,
        solution: `<p>Total: ${m} × ${p} = ${t}. Then ${t} ÷ ${F(1, d)} = ${F(t, 1)} × ${F(d, 1)} = <b>${t * d} ${ctx[2]}</b>. Each whole holds ${d} ${FRACTION_WORDS[d]}, and there are ${t} wholes in all.</p>`,
        feedback: {
          correct: `Correct. ${m} × ${p} = ${t}, and ${t} ÷ 1/${d} = ${t} × ${d} = ${t * d}.`,
          wrong: U.whyWrong(sh.options, `Find the total amount first, then divide it by 1/${d} with Keep, Change, Flip.`),
        },
      };
    }
    const w = r.int(2, 8);
    const d = r.pick([3, 4, 5, 6, 8].filter((x) => w % x !== 0));
    const ctx = r.pick([
      [`${name} has ${w} cups of oil for the gears. Each oil can holds ${U.fracText(1, d)} cup.`, 'How many cans can be filled?', 'cans'],
      [`${w === 8 ? 'An' : 'A'} ${w}-pound sack of iron filings is split into bags that each hold ${U.fracText(1, d)} pound.`, 'How many bags are filled?', 'bags'],
      [`${name} has ${w} hours to inspect dials. Each inspection takes ${U.fracText(1, d)} hour.`, `How many inspections can ${name} finish?`, 'inspections'],
      [`${w === 8 ? 'An' : 'A'} ${w}-meter chain is cut into links that are each ${U.fracText(1, d)} meter long.`, 'How many links are made?', 'links'],
    ]);
    const [a, b] = simplify(w, d);
    const opts = [
      { html: `${w * d} ${ctx[2]}`, ok: true },
      {
        html: `${F(a, b)} ${ctx[2].slice(0, -1)}`,
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
      prompt: `<p>${ctx[0]}</p><p>${ctx[1]}</p>`,
      options: sh.options,
      answer: sh.answer,
      hints: [
        `This is a division story: ${w} ÷ 1/${d}. It asks how many ${FRACTION_WORDS[d]} are in ${w} wholes.`,
        `Write ${w} as ${w}/1, then Keep, Change, Flip: ${w}/1 × ${d}/1.`,
        `${w} × ${d} = ? The quotient should be larger than ${w}.`,
      ],
      hintEs: `Este es un problema de división: ${w} ÷ 1/${d}. Pregunta cuántos ${FRACTION_WORDS_ES[d]} caben en ${w} enteros.`,
      solution: `<p>${w} ÷ ${F(1, d)} = ${F(w, 1)} × ${F(d, 1)} = <b>${w * d} ${ctx[2]}</b>. Each whole holds ${d} ${FRACTION_WORDS[d]}, and there are ${w} wholes. Dividing by a fraction less than 1 always gives a quotient bigger than the starting amount.</p>`,
      feedback: {
        correct: `Correct. ${w} ÷ 1/${d} = ${w} × ${d} = ${w * d}.`,
        wrong: U.whyWrong(sh.options, `Write ${w} ÷ 1/${d}, then Keep, Change, Flip. Ask: how many ${FRACTION_WORDS[d]} fit in ${w} wholes?`),
      },
    };
  });

  // ---------- Error: multiplied by the divisor instead of flipping (error) ----------
  G.define('e1_errorMultiply', (r, o) => {
    const hard = !!o.hard;
    const name = r.pick(NAMES);
    if (hard) {
      // Fraction ÷ whole: the student multiplied by the whole number instead of its reciprocal.
      const [a, b] = r.pick([
        [2, 3],
        [3, 4],
        [3, 5],
        [4, 5],
        [5, 6],
        [3, 8],
        [5, 8],
        [4, 7],
      ]);
      const w = r.int(2, 6);
      const [sn, sd] = simplify(a, b * w);
      const [wn, wd] = simplify(a * w, b);
      const opts = [
        { html: `${name} changed ÷ to × but kept ${w}/1. It must flip to 1/${w}, so the quotient is less than ${a}/${b}.`, ok: true },
        { html: `${name} should have flipped ${a}/${b} to ${b}/${a} and then multiplied it by ${w}/1 instead.`, why: `Only the divisor flips. ${a}/${b} is the dividend, so it stays the same.` },
        {
          html: `${name} should have multiplied both ${a} and ${b} by ${w}, making ${a * w}/${b * w} instead.`,
          why: `Multiplying the top and bottom by ${w} makes a fraction equal to ${a}/${b}. It does not divide anything.`,
        },
        { html: `The answer is correct, because dividing by a whole number always makes a fraction bigger.`, why: `Sharing ${a}/${b} into ${w} equal parts makes each part SMALLER than ${a}/${b}.` },
      ];
      const sh = shuffleOptions(r, opts, 0);
      return {
        type: 'error',
        skill: 'divide-whole',
        lesson: '6-1',
        title: 'Find the mistake',
        prompt: `<p>${name} shared ${hl(U.fracText(a, b))} of a tank of coolant equally among ${hl(w + ' machines')} and wrote this work. The gauge says something is wrong.</p><p>What went wrong?</p>`,
        work: `${F(a, b)} ÷ ${w} = ${F(a, b)} × ${F(w, 1)} = ${F(a * w, b)}${wn !== a * w ? ` = ${U.asMixed(wn, wd)}` : wn > wd ? ` = ${U.asMixed(wn, wd)}` : ''}`,
        options: sh.options,
        answer: sh.answer,
        fix: { label: 'The correct share for each machine (as a fraction) is', answer: sn / sd },
        hints: [
          `Check the size first. Sharing ${a}/${b} among ${w} equal parts makes each part smaller than ${a}/${b}.`,
          `Keep ${a}/${b}. Change ÷ to ×. Flip ${w}/1. Compare with ${name}'s second step.`,
          `${a}/${b} × 1/${w}: multiply ${a} × 1 on top and ${b} × ${w} on the bottom, then simplify.`,
        ],
        hintEs: `Revisa primero el tamaño. Repartir ${a}/${b} en ${w} partes iguales hace que cada parte sea menor que ${a}/${b}.`,
        solution: `<p>${name} changed the sign but did not flip ${w}/1. The correct work is ${F(a, b)} × ${F(1, w)} = ${F(a, b * w)}${sn !== a ? ` = ${F(sn, sd)}` : ''}, so each machine gets <b>${F(sn, sd)}</b> of a tank. ${name}'s answer was bigger than ${a}/${b}, which cannot be a fair share of ${a}/${b}.</p>`,
        feedback: {
          correct: `Correct. Change AND flip go together: ${a}/${b} × 1/${w} = ${sn}/${sd}.`,
          wrong(ans, dt) {
            if (!dt.mistakeOk) return (sh.options[ans.mistake] && sh.options[ans.mistake].why) || `Look at the second step. Was ${w}/1 flipped?`;
            const v = parseNum(ans.fix);
            if (v != null && Math.abs(v - (a * w) / b) < 1e-6) return `That repeats ${name}'s mistake. Multiply by 1/${w}, not by ${w}.`;
            return `You found the mistake. For the fix: ${a}/${b} × 1/${w}. Multiply across, then simplify.`;
          },
        },
      };
    }
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
      hintEs: `Revisa primero el tamaño de la respuesta. ${w} ÷ 1/${d} pregunta cuántos ${FRACTION_WORDS_ES[d]} caben en ${w}. ¿Debe ser mayor o menor que ${w}?`,
      solution: `<p>${name} changed the sign but kept 1/${d} instead of flipping it. The correct work is ${F(w, 1)} × ${F(d, 1)} = <b>${w * d}</b>. A quick check: ${w} wholes hold ${d} ${FRACTION_WORDS[d]} each, so the answer must be bigger than ${w}.</p>`,
      feedback: {
        correct: `Correct. Change AND flip go together. ${w} ÷ 1/${d} = ${w} × ${d} = ${w * d}.`,
        wrong(ans, dt) {
          if (!dt.mistakeOk) return (sh.options[ans.mistake] && sh.options[ans.mistake].why) || 'Look at the second step. Was the divisor flipped?';
          const v = parseNum(ans.fix);
          if (v != null && Math.abs(v - w / d) < 1e-6) return `That repeats ${name}'s answer. Flip 1/${d} to ${d}/1, then multiply.`;
          return `You found the mistake. For the fix: ${w}/1 × ${d}/1 = ${w} × ${d}.`;
        },
      },
    };
  });

  // ---------- Unit fraction ÷ whole (blanks, fraction layout) ----------
  G.define('e1_unitByWhole', (r, o) => {
    const hard = !!o.hard;
    const d = hard ? r.pick([6, 8, 10, 12]) : r.pick([2, 3, 4, 5, 6, 8]);
    const w = hard ? r.int(3, 8) : r.int(2, 6);
    const name = r.pick(NAMES);
    const amt = hard ? ONE_WORD[d] : U.fracText(1, d);
    const k = r.int(0, 2);
    const ctx = [
      `${name} has ${amt} of a jar of grease and shares it equally among ${w} gearboxes.`,
      `A strip of copper ${amt} meter long is cut into ${w} equal pieces.`,
      `${name} splits ${amt} of a pan of foundry bread into ${w} equal servings.`,
    ][k];
    const piece = ['gearbox', 'piece', 'serving'][k];
    const whole = ['a whole jar', 'a meter', 'a whole pan'][k];
    return {
      type: 'blanks',
      skill: 'divide-whole',
      lesson: '6-1',
      title: 'Divide a unit fraction by a whole number',
      prompt: hard
        ? `<p>${ctx}</p><p>What fraction of ${whole} does each ${piece} get? Write the division expression yourself, then give the answer as a fraction in simplest form.</p>`
        : `<p>${ctx}</p><p>What fraction does each ${piece} get? Write and evaluate ${hl(U.fracText(1, d) + ' ÷ ' + w)} as a fraction in simplest form.</p>`,
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
      hintEs: `Escribe el número entero sobre 1: 1/${d} ÷ ${w}/1. Repartir entre ${w} hace que cada parte sea más pequeña.`,
      solution: `<p>${F(1, d)} ÷ ${w} = ${F(1, d)} ÷ ${F(w, 1)} = ${F(1, d)} × ${F(1, w)} = <b>${F(1, d * w)}</b>. Splitting one ${FRACTION_WORDS[d].slice(0, -1)} into ${w} equal parts makes pieces that are ${d} × ${w} = ${d * w} to a whole, so each share is 1/${d * w}.</p>`,
      feedback: {
        correct: `Correct. 1/${d} × 1/${w} = 1/${d * w}. Dividing by a whole number makes the fraction smaller.`,
        wrong(ans) {
          const n = parseNum(ans[0]),
            m = parseNum(ans[1]);
          if (n != null && m && Math.abs(n / m - w / d) < 1e-9) return `${w}/${d} comes from flipping the FIRST fraction. Only the divisor flips: ${w}/1 becomes 1/${w}.`;
          if (n != null && m && Math.abs(n / m - d * w) < 1e-9) return `${d * w} is how many pieces make a whole. Each ${piece} is ONE of those pieces, so write it as a fraction: 1 over ${d} × ${w}.`;
          if (n != null && m && Math.abs(n / m - 1 / (d * w)) < 1e-9)
            return 'Your fraction is equivalent to the answer, but it is not in simplest form. Divide top and bottom by their greatest common factor.';
          if (n === 1 && m === d + w) return `Do not add the denominators. Multiply: 1/${d} × 1/${w} has a denominator of ${d} × ${w}.`;
          return `Write ${w} as ${w}/1, flip it to 1/${w}, then multiply 1/${d} × 1/${w}.`;
        },
      },
    };
  });

  // ---------- Fraction ÷ whole (blanks, fraction layout) ----------
  G.define('e1_fracByWhole', (r, o) => {
    const hard = !!o.hard;
    let a, b, w;
    if (hard) {
      // the product always needs simplifying, with larger numbers
      [a, b] = r.pick([
        [4, 5],
        [6, 7],
        [8, 9],
        [9, 10],
        [10, 11],
        [6, 11],
        [8, 13],
        [9, 13],
      ]);
      w = r.pick([2, 3, 4, 5, 6, 8].filter((x) => gcd(a, x) > 1 && x !== a));
    } else {
      [a, b] = r.pick([
        [3, 4],
        [2, 3],
        [3, 5],
        [5, 6],
        [2, 5],
        [4, 5],
        [5, 8],
        [3, 8],
      ]);
      w = r.int(2, 5);
    }
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
      prompt: hard
        ? `<p>${ctx}</p><p>How much is each part? Write a division expression and evaluate it. Give the answer as a fraction in simplest form.</p>`
        : `<p>${ctx}</p><p>How much is each part? Evaluate ${hl(U.fracText(a, b) + ' ÷ ' + w)}. Write the answer as a fraction in simplest form.</p>`,
      fields: [
        { label: 'numerator (top)', answer: sn, width: 'sm' },
        { label: 'denominator (bottom)', answer: sd, width: 'sm' },
      ],
      layout: 'fraction',
      hints: [
        `Write ${w} as ${w}/1. Then use Keep, Change, Flip.`,
        `${a}/${b} × 1/${w}. Multiply the numerators and the denominators.`,
        `Multiply ${a} × 1 for the top and ${b} × ${w} for the bottom. Then check whether the top and bottom share a factor greater than 1.`,
      ],
      hintEs: `Escribe ${w} como ${w}/1. Luego usa Mantén, Cambia, Invierte.`,
      solution: `<p>${F(a, b)} ÷ ${w} = ${F(a, b)} × ${F(1, w)} = ${F(a, b * w)}${sn !== a ? ` = <b>${F(sn, sd)}</b> after dividing top and bottom by ${gcd(a, b * w)}` : ` = <b>${F(sn, sd)}</b>`}. Each of the ${w} parts is one of ${w} equal shares of ${U.fracText(a, b)}, so the answer is smaller than ${U.fracText(a, b)}.</p>`,
      feedback: {
        correct: `Correct. ${a}/${b} × 1/${w} = ${a}/${b * w}${sn !== a ? ` = ${sn}/${sd}` : ''}. Dividing by ${w} made the fraction ${w} times smaller.`,
        wrong(ans) {
          const n = parseNum(ans[0]),
            m = parseNum(ans[1]);
          if (n != null && m && Math.abs(n / m - sn / sd) < 1e-9)
            return 'Your fraction is equivalent to the answer but not in simplest form. Divide the top and bottom by their greatest common factor.';
          if (n != null && m && Math.abs(n / m - (a * w) / b) < 1e-9) return `${n}/${m} is ${a}/${b} × ${w}. Dividing by ${w} should make the fraction smaller, so flip ${w}/1 to 1/${w}.`;
          if (n != null && m && Math.abs(n / m - (b * w) / a) < 1e-9) return `You flipped the first fraction. Only the divisor ${w}/1 flips.`;
          if (n != null && m && Math.abs(n / m - b / (a * w)) < 1e-9) return `You flipped ${a}/${b} as well as ${w}. Keep the first fraction exactly as it is.`;
          return `Keep ${a}/${b}, change to ×, flip ${w}/1 to 1/${w}. Then multiply across and simplify.`;
        },
      },
    };
  });

  // ---------- Match numbers to reciprocals (match) ----------
  G.define('e1_reciprocalMatch', (r, o) => {
    const hard = !!o.hard;
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
      hard ? 1 : 2,
    );
    if (hard) {
      // improper fractions flip to fractions less than 1
      const imp = r.pickN(
        [
          [7, 4],
          [5, 3],
          [9, 2],
          [8, 5],
          [11, 6],
          [10, 3],
          [12, 7],
        ].filter(([p, q]) => !(p === fracs[0][1] && q === fracs[0][0])),
        2,
      );
      fracs.push(...imp);
    }
    const items = [{ left: String(whole), right: F(1, whole) }, { left: F(1, unitD), right: String(unitD) }, ...fracs.map(([p, q]) => ({ left: F(p, q), right: F(q, p) }))];
    const n = items.length;
    const order = r.shuffle(items.map((_, i) => i));
    const left = items.map((it) => it.left);
    const right = order.map((i) => items[i].right);
    const pairs = items.map((it, i) => [i, order.indexOf(i)]);
    const list = [`${whole} → ${F(1, whole)}`, `${U.fracText(1, unitD)} → ${unitD}`, ...fracs.map(([p, q]) => `${U.fracText(p, q)} → ${U.fracText(q, p)}`)].join('; ');
    return {
      type: 'match',
      skill: 'divide-whole',
      lesson: '6-1',
      title: 'Match each number to its reciprocal',
      prompt: hard
        ? `<p>Before a plate can flip, the Foundry needs the <b>reciprocal</b> of each number. Match all ${n} numbers on the left to their reciprocals on the right. Some are greater than 1.</p>`
        : `<p>Before a plate can flip, the Foundry needs the <b>reciprocal</b> of each number. Match each number on the left to its reciprocal on the right.</p><p class="muted">A number times its reciprocal equals 1.</p>`,
      left,
      right,
      pairs,
      hints: [
        'To find a reciprocal, swap the numerator and denominator.',
        `A whole number sits over 1: ${whole} = ${whole}/1, so its reciprocal is 1/${whole}.`,
        `Check with multiplication: ${fracs[0][0]}/${fracs[0][1]} × ${fracs[0][1]}/${fracs[0][0]} = 1.`,
      ],
      hintEs: 'Para hallar el recíproco, intercambia el numerador y el denominador.',
      solution: `<p>Flip each number: ${list}. Each pair multiplies to <b>1</b>. A number greater than 1 has a reciprocal less than 1, and a number less than 1 has a reciprocal greater than 1.</p>`,
      feedback: {
        correct: 'Correct. Reciprocals swap top and bottom, and their product is always 1.',
        wrong(ans, dt) {
          const i = (dt.wrong || [])[0];
          if (i === 0) return `${whole} is ${whole}/1. Swap to get 1/${whole}, not another whole number.`;
          if (i === 1) return `1/${unitD} flipped is ${unitD}/1, which is the whole number ${unitD}.`;
          if (i != null && fracs[i - 2] && fracs[i - 2][0] > fracs[i - 2][1]) return `${U.fracText(...fracs[i - 2])} is greater than 1, so its reciprocal is less than 1. Swap the top and bottom.`;
          return 'Swap the numerator and denominator. The reciprocal of a fraction less than 1 is greater than 1.';
        },
      },
    };
  });

  // ---------- Who shared correctly? (who) ----------
  G.define('e1_whoShare', (r, o) => {
    const hard = !!o.hard;
    const [n1, n2, n3, n4] = r.pickN(NAMES, 4);
    const [a, b] = hard
      ? r.pick([
          [2, 3],
          [4, 5],
          [2, 5],
          [6, 7],
          [4, 7],
          [3, 4],
          [6, 11],
          [8, 9],
        ])
      : r.pick([
          [2, 3],
          [3, 4],
          [3, 5],
          [4, 5],
          [5, 6],
          [2, 5],
        ]);
    const w = hard ? r.pick([2, 3, 4, 6].filter((x) => gcd(a, x) > 1)) : r.int(2, 4);
    const [sn, sd] = simplify(a, b * w);
    const g = gcd(a, b * w);
    const thing = r.pick(['pan of brownies', 'tin of polish', 'sheet of gold leaf', 'roll of tape']);
    const opts = [
      { html: `<b>${n1}:</b> ${F(a, b)} ÷ ${w} = ${F(a, b)} × ${F(1, w)} = ${F(a, b * w)}${sn !== a ? ` = ${F(sn, sd)}` : ''}`, ok: true },
      {
        html: `<b>${n2}:</b> ${F(a, b)} ÷ ${w} = ${F(a, b)} × ${F(w, 1)} = ${F(a * w, b)}`,
        why: `${n2} multiplied by ${w} instead of dividing. Sharing among ${w} people makes each share smaller, so flip ${w}/1 to 1/${w}.`,
      },
      { html: `<b>${n3}:</b> ${F(a, b)} ÷ ${w} = ${F(b, a)} × ${F(1, w)} = ${F(b, a * w)}`, why: `${n3} flipped the first fraction. Only the divisor (${w}/1) is flipped in Keep, Change, Flip.` },
    ];
    if (hard)
      opts.push({
        html: `<b>${n4}:</b> ${F(a, b)} ÷ ${w} = ${F(a, b)} × ${F(1, w)} = ${F(a, b * w)} = ${F(a / g, b * w)}`,
        why: `${n4} divided only the numerator by ${g}. To simplify, divide the top AND the bottom by the same number.`,
      });
    const sh = shuffleOptions(r, opts, 0);
    return {
      type: 'who',
      skill: 'divide-whole',
      lesson: '6-1',
      title: 'Who shared it correctly?',
      prompt: `<p>${hard ? 'Four' : 'Three'} apprentices share ${hl(U.fracText(a, b))} of a ${thing} equally among ${hl(w + ' people')}. Each one wrote the division differently.</p><p>Who is correct${hard ? ', all the way to simplest form' : ''}?</p>`,
      options: sh.options,
      answer: sh.answer,
      layout: 'cards',
      hints: [
        `Each person gets a part of ${a}/${b}, so the answer must be smaller than ${a}/${b}.`,
        `Keep ${a}/${b}, change ÷ to ×, flip ${w}/1 to 1/${w}.`,
        `${a}/${b} × 1/${w} = ${a}/${b * w}.${hard ? ' Then check each simplification.' : ''}`,
      ],
      hintEs: `Cada persona recibe una parte de ${a}/${b}, así que la respuesta debe ser menor que ${a}/${b}.`,
      solution: `<p>${n1} is correct: ${F(a, b)} ÷ ${w} = ${F(a, b)} × ${F(1, w)} = <b>${F(sn, sd)}</b>. ${n2} multiplied instead of dividing, which made the share bigger. ${n3} flipped the wrong fraction.${hard ? ` ${n4} simplified only the top, which changes the value.` : ''}</p>`,
      feedback: {
        correct: `Correct. ${n1} kept ${a}/${b}, changed to ×, and flipped only the divisor.`,
        wrong: U.whyWrong(sh.options, `Keep ${a}/${b}, change ÷ to ×, and flip only ${w}/1. Then check each step.`),
      },
    };
  });
})(typeof window !== 'undefined' ? window : globalThis);

/* js/units/u6/gen-divide-mixed.js */
/* Zone 2 — The Cutting Floor. Lesson 6-2 Division Expressions with Fractions and Mixed Numbers. */
(function (root) {
  'use strict';
  const DEN = { 2: 'halves', 3: 'thirds', 4: 'fourths', 5: 'fifths', 6: 'sixths', 7: 'sevenths', 8: 'eighths', 9: 'ninths', 10: 'tenths', 12: 'twelfths' };
  const den = (b) => DEN[b] || b + 'ths';
  /** '1 sixth', '3 sixths', '1 half' */
  const count = (n, b) => (n === 1 ? `1 ${b === 2 ? 'half' : den(b).slice(0, -1)}` : `${n} ${den(b)}`);
  const RX = root.RX;
  const { G, V, simplify, gcd, shuffleOptions, NAMES, parseNum } = RX;
  const U = RX.U6;
  const hl = V.hl;
  const F = (a, b) => V.frac(a, b);
  const T = U.fracText;
  const MT = U.mixedText;
  /** Value typed into whole / numerator / denominator blanks (blank whole counts as 0). */
  const mixedValue = (x, y, z) => (x == null && y == null ? null : (x || 0) + (y != null && z ? y / z : 0));

  /** Draw a proper fraction a/b in lowest terms with denominator from the pool. */
  function properFrac(r, pool) {
    const b = r.pick(pool);
    const choices = [];
    for (let a = 1; a < b; a++) if (gcd(a, b) === 1) choices.push(a);
    return [r.pick(choices), b];
  }

  // ---------- Fraction ÷ fraction (blanks, fraction layout) ----------
  G.define('e2_fracByFrac', (r, o) => {
    const hard = !!o.hard;
    let a, b, c, d;
    for (let tries = 0; tries < 200; tries++) {
      if (hard) {
        // larger denominators, the product always needs simplifying, quotient may be greater than 1
        [a, b] = properFrac(r, [6, 8, 9, 10, 12]);
        [c, d] = properFrac(r, [4, 6, 8, 9, 10, 12]);
        const [, qd] = simplify(a * d, b * c);
        if (gcd(a * d, b * c) > 1 && qd !== 1 && !(a === c && b === d)) break;
      } else {
        // dividend a/b smaller than divisor c/d so the quotient is a proper fraction
        [a, b] = properFrac(r, [3, 4, 5, 6, 8]);
        [c, d] = properFrac(r, [2, 3, 4, 5, 6, 8]);
        if (a / b < c / d && !(a === 1 && c === 1)) break;
      }
    }
    if (!hard && a / b >= c / d) [a, b, c, d] = [1, 4, 2, 3];
    if (hard && (gcd(a * d, b * c) === 1 || simplify(a * d, b * c)[1] === 1)) [a, b, c, d] = [5, 6, 4, 9];
    const [sn, sd] = simplify(a * d, b * c);
    const name = r.pick(NAMES);
    return {
      type: 'blanks',
      skill: 'divide-fractions',
      lesson: '6-2',
      title: 'Divide a fraction by a fraction',
      prompt: `<p>${name} sets the cutting plate to ${hl(T(a, b) + ' ÷ ' + T(c, d))}.</p><p>Evaluate. Write the quotient as a fraction in simplest form${hard ? '. If the quotient is greater than 1, leave it as an improper fraction' : ''}.</p>`,
      fields: [
        { label: 'numerator (top)', answer: sn, width: 'sm' },
        { label: 'denominator (bottom)', answer: sd, width: 'sm' },
      ],
      layout: 'fraction',
      hints: [
        `Keep ${a}/${b}. Change ÷ to ×. Flip ${c}/${d} to its reciprocal.`,
        `${a}/${b} × ${d}/${c}. Multiply numerators, then denominators.`,
        `Multiply ${a} × ${d} for the top and ${b} × ${c} for the bottom. Then divide the top and bottom by any factor they share.`,
      ],
      hintEs: `Mantén ${a}/${b}. Cambia ÷ por ×. Invierte ${c}/${d} para usar su recíproco.`,
      solution: `<p>${F(a, b)} ÷ ${F(c, d)} = ${F(a, b)} × ${F(d, c)} = ${F(a * d, b * c)}${sn !== a * d ? ` = <b>${F(sn, sd)}</b> (divide top and bottom by ${gcd(a * d, b * c)})` : ` = <b>${F(sn, sd)}</b>`}. Dividing by ${T(c, d)} is the same as multiplying by its reciprocal ${T(d, c)}.${sn > sd ? ` The quotient is greater than 1 because ${T(c, d)} is smaller than ${T(a, b)}.` : ''}</p>`,
      feedback: {
        correct: `Correct. ${a}/${b} × ${d}/${c} = ${a * d}/${b * c}${sn !== a * d ? ` = ${sn}/${sd}` : ''}.`,
        wrong(ans) {
          const n = parseNum(ans[0]),
            m = parseNum(ans[1]);
          if (n != null && m && Math.abs(n / m - sn / sd) < 1e-9) return 'Your fraction is equivalent to the answer but not simplified. Divide top and bottom by their greatest common factor.';
          if (n != null && m && Math.abs(n / m - (a * c) / (b * d)) < 1e-9) return `${n}/${m} is ${a}/${b} × ${c}/${d}. You changed ÷ to × but did not flip ${c}/${d}.`;
          if (n != null && m && Math.abs(n / m - (b * d) / (a * c)) < 1e-9) return `You flipped both fractions. Keep ${a}/${b}; flip only the divisor ${c}/${d}.`;
          if (n != null && m && Math.abs(n / m - (b * c) / (a * d)) < 1e-9) return `That is the reciprocal of the answer. Flip ${c}/${d}, not ${a}/${b}.`;
          return `Keep ${a}/${b}, change to ×, flip ${c}/${d} to ${d}/${c}, multiply across, then simplify.`;
        },
      },
    };
  });

  // ---------- Keep, Change, Flip with two fractions (cloze) ----------
  G.define('e2_kcfCloze', (r, o) => {
    const hard = !!o.hard;
    if (hard) {
      // mixed-number dividend: rewrite first, then flip the divisor
      const w = r.int(1, 4);
      const [a, b] = properFrac(r, [3, 4, 5, 6, 8]);
      let [c, d] = properFrac(r, [3, 4, 5, 6, 8]);
      if (c === a && d === b) [c, d] = b === 4 ? [2, 3] : [3, 4];
      const n = w * b + a;
      const right = U.asMixedText(n * d, b * c);
      const improper = r.shuffle([T(n, b), T(w + a, b), T(w * a, b)].filter((v, i, arr) => arr.indexOf(v) === i));
      while (improper.length < 3) improper.push(T(n, w * b));
      const recips = r.shuffle([T(d, c), T(c, d), T(b, n)]);
      const results = [right, U.asMixedText(n * c, b * d), U.asMixedText((w + a) * d, b * c), U.asMixedText(b * c, n * d)].filter((v, i, arr) => arr.indexOf(v) === i).slice(0, 3);
      const resultsSh = r.shuffle(results);
      return {
        type: 'cloze',
        skill: 'divide-mixed',
        lesson: '6-2',
        title: 'Complete the method',
        prompt: `<p>Complete the steps to evaluate ${hl(MT(w, a, b) + ' ÷ ' + T(c, d))}. Give the quotient in simplest form.</p>`,
        template: `Rewrite ${MT(w, a, b)} as {0}. Keep it, change ÷ to ×, and flip the divisor to {1}.  Multiply across and simplify. The quotient is {2}.`,
        choices: [improper, recips, resultsSh],
        answers: [improper.indexOf(T(n, b)), recips.indexOf(T(d, c)), resultsSh.indexOf(right)],
        hints: [
          `First rewrite ${MT(w, a, b)} as an improper fraction. Then flip only the divisor.`,
          `${w} × ${b} + ${a} = ${n}, so ${MT(w, a, b)} = ${n}/${b}. The divisor ${c}/${d} flips to ${d}/${c}.`,
          `Multiply ${n} × ${d} on top and ${b} × ${c} on the bottom, then simplify.`,
        ],
        hintEs: `Primero escribe ${MT(w, a, b)} como fracción impropia. Luego invierte solo el divisor.`,
        solution: `<p>Rewrite: ${U.mixed(w, a, b)} = ${F(n, b)}. Flip the divisor: ${F(c, d)} → ${F(d, c)}. Then ${F(n, b)} × ${F(d, c)} = ${F(n * d, b * c)} = <b>${U.asMixed(n * d, b * c)}</b>.</p>`,
        feedback: {
          correct: `Correct. Rewrite, then Keep, Change, Flip: ${right}.`,
          wrong(ans, dt) {
            if (dt.wrong.includes(0)) return `Rewrite the mixed number: multiply the whole number by the denominator (${w} × ${b}), then add ${a}. The denominator stays ${b}.`;
            if (dt.wrong.includes(1)) return recips[ans[1]] === T(b, n) ? `You flipped the dividend. Keep ${n}/${b} and flip the divisor ${c}/${d}.` : `The divisor ${c}/${d} must flip to ${d}/${c}.`;
            if (resultsSh[ans[2]] === U.asMixedText(n * c, b * d)) return `That result multiplies by ${c}/${d}. Multiply by the reciprocal ${d}/${c} instead.`;
            return `Multiply ${n}/${b} × ${d}/${c} across, simplify, and write the result as a mixed number.`;
          },
        },
      };
    }
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
      hintEs: 'El recíproco de una fracción intercambia su numerador y su denominador.',
      solution: `<p>Flip the divisor: ${F(c, d)} → ${F(d, c)}. Then ${F(a, b)} × ${F(d, c)} = ${F(a * d, b * c)}${sn !== a * d ? ` = <b>${F(sn, sd)}</b>` : ` = <b>${F(sn, sd)}</b>`}. The first fraction is kept exactly as it is.</p>`,
      feedback: {
        correct: `Correct. Flip only the divisor, then multiply across: ${T(sn, sd)}.`,
        wrong(ans, dt) {
          if (dt.wrong.includes(0))
            return recips[ans[0]] === T(b, a)
              ? `You flipped the first fraction. Keep ${a}/${b}; the divisor ${c}/${d} flips to ${d}/${c}.`
              : `The reciprocal of ${c}/${d} swaps top and bottom: ${d}/${c}.`;
          if (results[ans[1]] === T(...simplify(a * c, b * d))) return `That result multiplies by ${c}/${d} without flipping it. Use ${d}/${c}.`;
          return `Multiply ${a}/${b} × ${d}/${c}: tops ${a} × ${d}, bottoms ${b} × ${c}. Then simplify.`;
        },
      },
    };
  });

  // Mixed-number sets [w, a, b, c, d, q]: (w a/b) ÷ (c/d) = q, a whole number
  const MIXED_SETS = [
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

  // ---------- Error: flipped the dividend / rewrote the mixed number wrong (error) ----------
  G.define('e2_errorFlip', (r, o) => {
    const hard = !!o.hard;
    const name = r.pick(NAMES);
    if (hard) {
      // the mixed number was rewritten by adding the whole number to the numerator
      const [w, a, b, c, d, q] = r.pick(MIXED_SETS);
      const n = w * b + a;
      const bad = w + a;
      const [wn, wd] = simplify(bad * d, b * c);
      const opts = [
        { html: `${name} rewrote ${MT(w, a, b)} as ${T(bad, b)}. It should be ${w} × ${b} + ${a} over ${b}.`, ok: true },
        {
          html: `${name} should have flipped ${T(bad, b)} instead of flipping the divisor ${T(c, d)}.`,
          why: `Flipping the divisor is correct. The first step, rewriting the mixed number, is where the error is.`,
        },
        {
          html: `${name} should have divided the whole number and the fraction by ${T(c, d)} separately.`,
          why: `Rewriting the mixed number as one improper fraction is our method. The problem is how ${name} rewrote it.`,
        },
        {
          html: `The work is correct, because ${name} kept the dividend, changed ÷ to ×, and flipped the divisor.`,
          why: `Keep, Change, Flip was done right, but the first step changed the value of ${MT(w, a, b)}. Check the improper fraction.`,
        },
      ];
      const sh = shuffleOptions(r, opts, 0);
      return {
        type: 'error',
        skill: 'divide-mixed',
        lesson: '6-2',
        title: 'Find the mistake',
        prompt: `<p>${name} evaluated ${hl(MT(w, a, b) + ' ÷ ' + T(c, d))} on the cutting floor. The blade jammed.</p><p>What is the mistake?</p>`,
        work: `${U.mixed(w, a, b)} ÷ ${F(c, d)} = ${F(bad, b)} ÷ ${F(c, d)} = ${F(bad, b)} × ${F(d, c)} = ${F(bad * d, b * c)}${wn !== bad * d || wn > wd ? ` = ${U.asMixed(wn, wd)}` : ''}`,
        options: sh.options,
        answer: sh.answer,
        fix: { label: 'The correct quotient is', answer: q },
        hints: [
          `Check the first step. Is ${MT(w, a, b)} rewritten correctly as an improper fraction?`,
          `${MT(w, a, b)} = ${w} × ${b} + ${a} over ${b}. Compare with ${name}'s ${T(bad, b)}.`,
          `Use ${n}/${b} × ${d}/${c}. Multiply across, then simplify to a whole number.`,
        ],
        hintEs: `Revisa el primer paso. ¿Está bien escrito ${MT(w, a, b)} como fracción impropia?`,
        solution: `<p>${name} added ${w} + ${a} on top. Each whole is ${b}/${b}, so ${U.mixed(w, a, b)} = ${F(w * b + a, b)}. The correct work is ${F(n, b)} × ${F(d, c)} = ${F(n * d, b * c)} = <b>${q}</b>.</p>`,
        feedback: {
          correct: `Correct. ${MT(w, a, b)} = ${n}/${b}, and ${n}/${b} × ${d}/${c} = ${q}.`,
          wrong(ans, dt) {
            if (!dt.mistakeOk) return (sh.options[ans.mistake] && sh.options[ans.mistake].why) || `Look at how ${name} rewrote the mixed number.`;
            const v = parseNum(ans.fix);
            if (v != null && Math.abs(v - wn / wd) < 1e-6) return `That repeats ${name}'s answer. Start again from ${n}/${b}.`;
            return `You found the mistake. For the fix: ${n}/${b} × ${d}/${c}. Multiply across and simplify.`;
          },
        },
      };
    }
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
      hintEs: 'Mantén, Cambia, Invierte: ¿qué fracción se queda igual y cuál se invierte?',
      solution: `<p>${name} flipped ${T(a, b)}, the dividend. The correct work is ${F(a, b)} × ${F(d, c)} = ${F(a * d, b * c)} = <b>${q}</b>. In other words, ${T(c, d)} fits into ${T(a, b)} exactly ${q} times.</p>`,
      feedback: {
        correct: `Correct. Keep the first fraction, flip only the divisor: ${T(a, b)} ÷ ${T(c, d)} = ${q}.`,
        wrong(ans, dt) {
          if (!dt.mistakeOk) return (sh.options[ans.mistake] && sh.options[ans.mistake].why) || `Look at which fraction ${name} flipped.`;
          const v = parseNum(ans.fix);
          if (v != null && Math.abs(v - wn / wd) < 1e-6) return `That repeats ${name}'s answer. Keep ${a}/${b} and flip ${c}/${d}.`;
          return `You found the mistake. For the fix: ${a}/${b} × ${d}/${c} = ${a * d}/${b * c}, which simplifies to a whole number.`;
        },
      },
    };
  });

  // ---------- Story: fraction ÷ fraction (num) ----------
  G.define('e2_storyFrac', (r, o) => {
    const hard = !!o.hard;
    const name = r.pick(NAMES);
    let a, b, c, d, q;
    if (hard) {
      // the quotient has a remainder: the question asks for FULL groups only
      for (let tries = 0; tries < 200; tries++) {
        [a, b] = properFrac(r, [4, 5, 6, 8, 9, 10, 12]);
        [c, d] = properFrac(r, [8, 9, 10, 12, 15, 16, 20]);
        q = (a * d) / (b * c);
        if (q > 2 && q < 12 && q % 1 !== 0) break;
      }
      if (!(q > 2 && q < 12 && q % 1 !== 0)) [a, b, c, d, q] = [5, 6, 2, 9, 15 / 4];
    } else {
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
      [a, b, c, d, q] = r.pick(sets);
    }
    const full = Math.floor(q + 1e-9);
    const answer = hard ? full : q;
    const [qn, qd] = simplify(a * d, b * c);
    const ctx = r.pick([
      [
        `${name} has ${T(a, b)} gallon of lamp oil. Each lamp holds ${T(c, d)} gallon.`,
        hard ? 'How many lamps can be filled all the way?' : 'How many lamps can be filled?',
        'lamps',
        'las lámparas completas',
      ],
      [
        `A strip of tin ${T(a, b)} meter long is cut into pieces each ${T(c, d)} meter long.`,
        hard ? 'How many full-length pieces are cut?' : 'How many pieces are cut?',
        'pieces',
        'las piezas completas',
      ],
      [
        `A machine runs for ${T(a, b)} hour. Each cycle takes ${T(c, d)} hour.`,
        hard ? 'How many complete cycles does it finish?' : 'How many cycles does it complete?',
        'cycles',
        'los ciclos completos',
      ],
      [
        `${name} has ${T(a, b)} pound of solder and uses ${T(c, d)} pound per joint.`,
        hard ? 'How many complete joints can be made?' : 'How many joints can be made?',
        'joints',
        'las soldaduras completas',
      ],
    ]);
    return {
      type: 'num',
      skill: 'divide-fractions',
      lesson: '6-2',
      title: 'Divide to solve the story',
      prompt: `<p>${ctx[0]}</p><p>${ctx[1]}</p>`,
      unit: ctx[2],
      answer,
      hints: [
        `The question asks how many ${T(c, d)}s fit in ${T(a, b)}. Write the division: ${a}/${b} ÷ ${c}/${d}.${hard ? ` Only complete ${ctx[2]} count.` : ''}`,
        `Keep ${a}/${b}, change to ×, flip ${c}/${d} to ${d}/${c}.`,
        hard ? `${a}/${b} × ${d}/${c} = ${a * d}/${b * c}. Write it as a mixed number, then decide what the fraction part means.` : `${a}/${b} × ${d}/${c} = ${a * d}/${b * c}. Simplify.`,
      ],
      hintEs: `La pregunta es cuántas veces cabe ${c}/${d} en ${a}/${b}. Escribe la división: ${a}/${b} ÷ ${c}/${d}.${hard ? ` Solo cuentan ${ctx[3]}.` : ''}`,
      solution: hard
        ? `<p>${F(a, b)} ÷ ${F(c, d)} = ${F(a, b)} × ${F(d, c)} = ${F(a * d, b * c)}${qn !== a * d ? ` = ${F(qn, qd)}` : ''} = ${U.asMixed(qn, qd)}. That means ${full} complete ${ctx[2]} plus part of one more. The question asks for complete ${ctx[2]}, so the answer is <b>${full} ${ctx[2]}</b>.</p>`
        : `<p>${F(a, b)} ÷ ${F(c, d)} = ${F(a, b)} × ${F(d, c)} = ${F(a * d, b * c)} = <b>${q} ${ctx[2]}</b>. Check by multiplying: ${q} × ${T(c, d)} = ${T(a, b)}.</p>`,
      feedback: {
        correct: hard ? `Correct. The quotient is ${U.asMixedText(qn, qd)}, so only ${full} complete ${ctx[2]} fit.` : `Correct. ${T(c, d)} fits into ${T(a, b)} exactly ${q} times.`,
        wrong(ans, dt) {
          const v = dt.value;
          if (v != null && Math.abs(v - (a * c) / (b * d)) < 1e-6) return `You multiplied ${a}/${b} × ${c}/${d}. "How many fit" is division: flip ${c}/${d} first.`;
          if (v != null && Math.abs(v - (b * c) / (a * d)) < 1e-6) return `That is the reciprocal of the quotient. You flipped the wrong fraction. Keep ${a}/${b} and flip ${c}/${d}.`;
          if (hard && v != null && Math.abs(v - q) < 1e-6) return `${U.asMixedText(qn, qd)} is the exact quotient. The question asks for complete ${ctx[2]} only, so drop the part of one more.`;
          if (hard && v === full + 1) return `You rounded up. There is not enough for ${full + 1} complete ${ctx[2]}; the last one is only partly filled.`;
          return hard
            ? `Write ${a}/${b} ÷ ${c}/${d}, then Keep, Change, Flip. Change the result to a mixed number and keep only the whole number part.`
            : `Write ${a}/${b} ÷ ${c}/${d}, then Keep, Change, Flip. The answer is a whole number.`;
        },
      },
    };
  });

  // ---------- Mixed number → improper fraction (blanks, fraction layout) ----------
  G.define('e2_toImproper', (r, o) => {
    const hard = !!o.hard;
    const w = hard ? r.int(6, 15) : r.int(1, 5);
    const [a, b] = properFrac(r, hard ? [7, 8, 9, 10, 12] : [2, 3, 4, 5, 6, 8]);
    const n = w * b + a;
    const name = r.pick(NAMES);
    return {
      type: 'blanks',
      skill: 'divide-mixed',
      lesson: '6-2',
      title: 'Rewrite the mixed number',
      prompt: `<p>Before the blade can flip anything, every mixed number must be rewritten as a single fraction.</p><p>${name} reads ${hl(MT(w, a, b))} on the plate. Write it as an improper fraction.</p>`,
      fields: [
        { label: 'numerator (top)', answer: n, width: 'sm' },
        { label: 'denominator (bottom)', answer: b, width: 'sm' },
      ],
      layout: 'fraction',
      hints: [
        `The denominator stays ${b}. Each whole is ${b}/${b}.`,
        `${w} wholes = ${w} × ${b} = ${w * b} ${den(b)}. Then add the extra ${count(a, b)}.`,
        `${w} × ${b} + ${a} = ? That goes on top, over ${b}.`,
      ],
      hintEs: `El denominador sigue siendo ${b}. Cada entero es ${b}/${b}.`,
      solution: `<p>${U.mixed(w, a, b)} = ${F(w * b, b)} + ${F(a, b)} = <b>${F(n, b)}</b>. Multiply the whole number by the denominator (${w} × ${b} = ${w * b}), add the numerator (${w * b} + ${a} = ${n}), and keep the denominator.</p>`,
      feedback: {
        correct: `Correct. ${w} × ${b} + ${a} = ${n}, so ${MT(w, a, b)} = ${n}/${b}.`,
        wrong(ans) {
          const t = parseNum(ans[0]),
            m = parseNum(ans[1]);
          if (t === w + a && m === b) return `You added ${w} + ${a}. The whole number ${w} is worth ${w} × ${b} = ${w * b} ${den(b)}, not ${w} ${den(b)}.`;
          if (t === w * a && m === b) return `You multiplied ${w} × ${a}. Multiply the whole number by the DENOMINATOR (${b}), then add the numerator ${a}.`;
          if (t === w * b && m === b) return `${w * b}/${b} is only the ${w} wholes. Add the ${a} extra ${den(b)} to the top.`;
          if (t === n && m !== b) return `The numerator is right. The denominator stays ${b}, because the pieces are still ${den(b)}.`;
          return `Multiply ${w} × ${b}, add ${a}, and write that over ${b}.`;
        },
      },
    };
  });

  // ---------- Mixed ÷ fraction (normal) or mixed ÷ mixed (hard), mixed-number answer (blanks, template) ----------
  G.define('e2_mixedDivide', (r, o) => {
    const hard = !!o.hard;
    // Ensure quotient is a non-whole mixed number.
    let w, a, b, v, c, d, qn, qd, mix;
    for (let tries = 0; tries < 300; tries++) {
      w = hard ? r.int(3, 9) : r.int(1, 4);
      v = hard ? r.int(1, 2) : 0;
      [a, b] = properFrac(r, hard ? [3, 4, 5, 6, 8] : [2, 3, 4]);
      [c, d] = properFrac(r, hard ? [2, 3, 4, 5, 6] : [2, 3, 4]);
      const n0 = w * b + a,
        k0 = v * d + c;
      [qn, qd] = simplify(n0 * d, b * k0);
      mix = U.toMixed(n0 * d, b * k0);
      if (qd !== 1 && mix[0] >= 1 && mix[0] <= 12 && qd <= 12) break;
    }
    const n = w * b + a;
    const k = v * d + c; // divisor as a fraction k/d
    const divText = hard ? MT(v, c, d) : T(c, d);
    const [W, N, D] = mix;
    const name = r.pick(NAMES);
    const ctx = hard
      ? `<p>${name} has ${hl(MT(w, a, b) + ' feet')} of brass ribbon. Each gear tag needs ${hl(divText + ' feet')}. Write a division expression and evaluate it to find how many tags can be cut.</p>`
      : `<p>${name} has ${hl(MT(w, a, b) + ' feet')} of brass ribbon. Each gear tag needs ${hl(T(c, d) + ' foot')}.</p><p>Evaluate ${MT(w, a, b)} ÷ ${T(c, d)} to find how many tags can be cut.</p>`;
    return {
      type: 'blanks',
      skill: 'divide-mixed',
      lesson: '6-2',
      title: hard ? 'Divide two mixed numbers' : 'Divide the ribbon',
      prompt: `${ctx}<p>Write the quotient as a mixed number in simplest form.</p>`,
      fields: [
        { label: 'whole number', answer: W, width: 'xs' },
        { label: 'numerator', answer: N, width: 'xs' },
        { label: 'denominator', answer: D, width: 'xs' },
      ],
      template: `Quotient = {0} and {1}/{2}`,
      hints: hard
        ? [
            `First rewrite BOTH mixed numbers as improper fractions: ${MT(w, a, b)} = ${n}/${b} and ${divText} = ${k}/${d}.`,
            `Keep ${n}/${b}, change ÷ to ×, flip ${k}/${d} to ${d}/${k}: ${n}/${b} × ${d}/${k}.`,
            `Multiply across, simplify, then divide the numerator by the denominator. The remainder becomes the new numerator.`,
          ]
        : [
            `First rewrite ${MT(w, a, b)} as an improper fraction: ${w} × ${b} + ${a} = ${n}, so ${n}/${b}.`,
            `Keep ${n}/${b}, change ÷ to ×, flip ${c}/${d} to ${d}/${c}: ${n}/${b} × ${d}/${c} = ${n * d}/${b * c}.`,
            `Simplify ${n * d}/${b * c} if you can. Then ask how many whole times the denominator goes into the numerator; the remainder becomes the new numerator.`,
          ],
      hintEs: hard
        ? `Primero escribe los DOS números mixtos como fracciones impropias: ${MT(w, a, b)} = ${n}/${b} y ${divText} = ${k}/${d}.`
        : `Primero escribe ${MT(w, a, b)} como fracción impropia: ${w} × ${b} + ${a} = ${n}, así que es ${n}/${b}.`,
      solution: `<p>Rewrite: ${U.mixed(w, a, b)} = ${F(n, b)}${hard ? ` and ${U.mixed(v, c, d)} = ${F(k, d)}` : ''}. Keep, Change, Flip: ${F(n, b)} × ${F(d, k)} = ${F(n * d, b * k)}${qn !== n * d ? ` = ${F(qn, qd)}` : ''} = <b>${U.mixed(W, N, D)}</b>. ${name} can cut ${W} full tags, with ${T(N, D)} of a tag's length left over.${hard ? ' Both mixed numbers are rewritten first, so only one single fraction is flipped.' : ''}</p>`,
      feedback: {
        correct: `Correct. Rewrite, flip the divisor, multiply, then convert back: ${MT(W, N, D)}.`,
        wrong(ans) {
          const x = parseNum(ans[0]),
            y = parseNum(ans[1]),
            z = parseNum(ans[2]);
          const val = mixedValue(x, y, z);
          const dividend = w + a / b,
            divisor = k / d;
          if (x === W && y != null && z && Math.abs(y / z - N / D) < 1e-9) return 'Your mixed number is equivalent to the answer, but the fraction part is not in simplest form.';
          if (val == null) return 'Fill in all three parts of the mixed number.';
          if (Math.abs(val - dividend * divisor) < 1e-6) return `You multiplied by ${divText} instead of dividing. Flip the divisor first.`;
          if (Math.abs(val - divisor / dividend) < 1e-6) return `That is the reciprocal of the answer. Keep the dividend ${n}/${b} and flip the divisor.`;
          if (!hard && Math.abs(val - ((w * d) / c + (a * d) / (b * c))) < 1e-6)
            return `You flipped and multiplied the whole number and the fraction separately. Rewrite ${MT(w, a, b)} as ${n}/${b} first, then flip only the divisor.`;
          if (hard && Math.abs(val - (w / v + a / b / (c / d))) < 1e-6) return `You divided the whole numbers and the fractions separately. Rewrite both mixed numbers as improper fractions first.`;
          if (hard && Math.abs(val - dividend / (c / d)) < 1e-6) return `You divided by only ${c}/${d} and left out the whole number ${v}. Rewrite ${divText} as ${k}/${d} before flipping.`;
          if (Math.abs(val - ((w + a) * d) / (b * k)) < 1e-6) return `Check your improper fraction: ${MT(w, a, b)} is ${w} × ${b} + ${a} = ${n} over ${b}.`;
          return hard
            ? `Rewrite ${MT(w, a, b)} as ${n}/${b} and ${divText} as ${k}/${d}. Then multiply ${n}/${b} × ${d}/${k} and convert back to a mixed number.`
            : `Rewrite ${MT(w, a, b)} as ${n}/${b}. Then ${n}/${b} × ${d}/${c}. Convert the result back to a mixed number.`;
        },
      },
    };
  });

  // ---------- Sort quotients: greater than 1 or less than 1 (sort) ----------
  G.define('e2_sortQuotient', (r, o) => {
    const hard = !!o.hard;
    const pool = [];
    const fr = hard
      ? [
          [5, 8],
          [3, 5],
          [2, 3],
          [7, 10],
          [4, 7],
          [5, 9],
          [7, 12],
          [3, 4],
          [5, 6],
          [7, 8],
        ]
      : [
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
    const want = hard ? [0, 0, 0, 0, 1, 1, 1, 1] : [0, 0, 0, 1, 1, 1];
    for (const bin of want) {
      for (let tries = 0; tries < 300; tries++) {
        const [a, b] = r.pick(fr);
        const [c, d] = r.pick(fr);
        // hard: both sides may be mixed numbers, and the two values are close together
        const wn = hard ? (r.chance(0.5) ? r.int(1, 2) : 0) : bin === 0 && r.chance(0.5) ? r.int(1, 3) : 0;
        const wd = hard && wn ? (r.chance(0.6) ? wn : 0) : 0;
        const dividend = wn + a / b,
          divisor = wd + c / d;
        if (Math.abs(dividend - divisor) < 1e-9) continue;
        if (hard && tries < 250 && Math.abs(dividend - divisor) > 0.2) continue;
        if ((dividend > divisor ? 0 : 1) !== bin) continue;
        const key = `${wn}-${a}/${b}-${wd}-${c}/${d}`;
        if (seen.has(key)) continue;
        seen.add(key);
        pool.push({ html: `${wn ? U.mixed(wn, a, b) : F(a, b)} ÷ ${wd ? U.mixed(wd, c, d) : F(c, d)}`, bin });
        break;
      }
    }
    const items = r.shuffle(pool);
    return {
      type: 'sort',
      skill: 'divide-fractions',
      lesson: '6-2',
      title: 'Estimate before you cut',
      prompt: hard
        ? `<p>A good engineer estimates first. Sort each division expression by the size of its quotient. The numbers are close, so compare the dividend (first number) with the divisor (second number) carefully. You do not need to divide.</p>`
        : `<p>A good engineer estimates first. Sort each division expression by the size of its quotient. Do not compute exactly: compare the dividend (first number) with the divisor (second number).</p>`,
      bins: ['Quotient is greater than 1', 'Quotient is less than 1'],
      items,
      hints: [
        'Ask: does the divisor fit into the dividend at least once?',
        hard
          ? 'Compare whole-number parts first. If they match, compare the fractions: rewrite them with a common denominator or compare each one to 1/2.'
          : 'If the first number is bigger than the second, the second fits in more than once, so the quotient is greater than 1.',
        'If the first number is smaller than the second, it fits in less than one time, so the quotient is less than 1.',
      ],
      hintEs: 'Pregúntate: ¿cabe el divisor en el dividendo por lo menos una vez?',
      solution: `<p>When the dividend is larger than the divisor, the quotient is greater than 1. When the dividend is smaller, the quotient is less than 1. For example, ${F(3, 4)} ÷ ${F(1, 2)} is greater than 1 because ${T(1, 2)} fits into ${T(3, 4)} one and a half times, but ${F(1, 4)} ÷ ${F(1, 2)} is less than 1 because ${T(1, 4)} is only half of ${T(1, 2)}.</p>`,
      feedback: {
        correct: 'Correct. Comparing the dividend to the divisor tells you whether the quotient is more or less than 1.',
        wrong(ans, dt) {
          const i = (dt.wrong || [])[0];
          const it = items[i];
          if (!it) return 'Compare the first number with the second number in each expression.';
          return it.bin === 0
            ? 'Look again: in at least one expression you sorted as less than 1, the first number is bigger than the second, so the divisor fits more than once.'
            : 'Look again: in at least one expression you sorted as greater than 1, the first number is smaller than the second, so the divisor fits less than once.';
        },
      },
    };
  });

  // ---------- Story with mixed numbers, whole-number quotient (mc) ----------
  G.define('e2_storyMixed', (r, o) => {
    const hard = !!o.hard;
    const name = r.pick(NAMES);
    let w, a, b, v, c, d, q;
    if (hard) {
      // mixed ÷ mixed with a whole-number quotient: dividend = q × divisor
      for (let tries = 0; tries < 200; tries++) {
        v = r.int(1, 2);
        [c, d] = properFrac(r, [2, 3, 4, 5, 6, 8]);
        q = r.int(2, 7);
        const [dn, dd] = simplify(q * (v * d + c), d);
        if (dd === 1 || dn / dd > 20) continue;
        [w, a, b] = U.toMixed(dn, dd);
        break;
      }
    } else {
      [w, a, b, c, d, q] = r.pick(MIXED_SETS);
      v = 0;
    }
    const n = w * b + a;
    const k = v * d + c;
    const divText = v ? MT(v, c, d) : T(c, d);
    const unitWord = v ? 'feet' : 'foot';
    const ctx = r.pick([
      [`A board ${MT(w, a, b)} feet long is cut into shelves that are each ${divText} ${unitWord} long.`, 'How many shelves are made?', 'shelves'],
      [`${name} has ${MT(w, a, b)} cups of resin. Each mold uses ${divText} ${v ? 'cups' : 'cup'}.`, 'How many molds can be filled?', 'molds'],
      [`A furnace burns for ${MT(w, a, b)} hours. Each batch of iron takes ${divText} ${v ? 'hours' : 'hour'}.`, 'How many batches are finished?', 'batches'],
    ]);
    const show = ([x, y]) => (y === 1 ? String(x) : U.asMixed(x, y));
    const mult = simplify(n * k, b * d);
    const opts = [
      { html: `${q} ${ctx[2]}`, ok: true },
      { html: `${show(mult)} ${ctx[2]}`, why: `That is ${MT(w, a, b)} × ${divText}. "How many fit" is division, so flip the divisor before multiplying.` },
    ];
    if (hard) {
      const wholes = simplify(w, v);
      opts.push({ html: `${show(wholes)} ${ctx[2]}`, why: `That divides only the whole numbers, ${w} ÷ ${v}. Rewrite both mixed numbers as improper fractions so the fraction parts count too.` });
      const onlyFrac = simplify(n * d, b * c);
      opts.push({ html: `${show(onlyFrac)} ${ctx[2]}`, why: `That divides by ${T(c, d)} and leaves out the whole number ${v} in the divisor. Rewrite ${divText} as ${T(k, d)} first.` });
    } else {
      const forgot = simplify(w * d, c); // divided only the whole part
      opts.push({ html: `${show(forgot)} ${ctx[2]}`, why: `That only divides the whole number ${w}. Rewrite ${MT(w, a, b)} as ${T(n, b)} first so the fraction part is included.` });
      opts.push({ html: `${q + 1} ${ctx[2]}`, why: `Check by multiplying: ${q + 1} × ${T(c, d)} is more than ${MT(w, a, b)}. There is not enough for that many.` });
    }
    // keep the options distinct
    const fallback = [
      { html: `${q + 1} ${ctx[2]}`, why: `Check by multiplying: ${q + 1} × ${divText} is more than ${MT(w, a, b)}. There is not enough for that many.` },
      { html: `${q - 1} ${ctx[2]}`, why: `Check: ${q - 1} × ${divText} leaves some left over. Recompute ${T(n, b)} × ${T(d, k)}.` },
      { html: `${q + 2} ${ctx[2]}`, why: `Check by multiplying: ${q + 2} × ${divText} is more than ${MT(w, a, b)}.` },
    ];
    for (let i = 1; i < opts.length; i++) {
      const strip = (h) => h.replace(/<[^>]+>/g, '');
      while (opts.slice(0, i).some((x) => strip(x.html) === strip(opts[i].html))) opts[i] = fallback.shift();
    }
    const sh = shuffleOptions(r, opts, 0);
    return {
      type: 'mc',
      skill: 'divide-mixed',
      lesson: '6-2',
      title: hard ? 'Divide two mixed numbers' : 'Divide with a mixed number',
      prompt: `<p>${ctx[0]}</p><p>${ctx[1]}</p>`,
      options: sh.options,
      answer: sh.answer,
      hints: [
        `Write the division: ${MT(w, a, b)} ÷ ${divText}. First rewrite ${v ? 'each mixed number' : 'the mixed number'} as an improper fraction.`,
        `${MT(w, a, b)} = ${n}/${b}${v ? ` and ${divText} = ${k}/${d}` : ''}. Then Keep, Change, Flip: ${n}/${b} × ${d}/${k}.`,
        `${n}/${b} × ${d}/${k} = ${n * d}/${b * k}. Simplify to a whole number.`,
      ],
      hintEs: v
        ? `Escribe la división: ${MT(w, a, b)} ÷ ${divText}. Primero escribe cada número mixto como fracción impropia.`
        : `Escribe la división: ${MT(w, a, b)} ÷ ${divText}. Primero escribe el número mixto como fracción impropia.`,
      solution: `<p>${U.mixed(w, a, b)} = ${F(n, b)}${v ? ` and ${U.mixed(v, c, d)} = ${F(k, d)}` : ''}. Then ${F(n, b)} ÷ ${F(k, d)} = ${F(n, b)} × ${F(d, k)} = ${F(n * d, b * k)} = <b>${q} ${ctx[2]}</b>. Check: ${q} × ${divText} = ${MT(w, a, b)}.</p>`,
      feedback: {
        correct: `Correct. Rewrite the mixed number${v ? 's' : ''} first, then Keep, Change, Flip: ${q}.`,
        wrong: U.whyWrong(sh.options, `Rewrite each mixed number as an improper fraction, then Keep, Change, Flip.`),
      },
    };
  });
})(typeof window !== 'undefined' ? window : globalThis);

/* js/units/u6/gen-exponents.js */
/* Zone 3 — The Power Dials. Lesson 6-3 Explore Numerical Expressions with Exponents. */
(function (root) {
  'use strict';
  const RX = root.RX;
  const { G, V, fmt, round, shuffleOptions, NAMES, parseNum, near } = RX;
  const U = RX.U6;
  const hl = V.hl;
  const P = U.pow; // HTML power
  const PT = U.powText; // plain-text power (unicode superscript)
  const expanded = (b, e) => Array.from({ length: e }, () => String(b)).join(' × ');
  const repeatedAdd = (b, e) => Array.from({ length: e }, () => String(b)).join(' + ');
  const pw = Math.pow;
  const dec = (x) => String(round(x, 6));

  /**
   * A power base that may be a whole number, a decimal, or a fraction.
   * kind 'int' | 'dec' use v; kind 'frac' uses a/b and is written in parentheses.
   */
  const B = {
    int: (v) => ({ kind: 'int', v, text: String(v), html: String(v), factor: String(v) }),
    dec: (v) => ({ kind: 'dec', v, text: String(v), html: String(v), factor: String(v) }),
    frac: (a, b) => ({ kind: 'frac', a, b, v: a / b, text: `(${a}/${b})`, html: `(${V.frac(a, b)})`, factor: `(${a}/${b})` }),
  };
  const bPow = (s, e) => `${s.text}${U.supText(e)}`;
  const bPowHtml = (s, e) => `${s.html}<sup>${e}</sup>`;
  const bExpanded = (s, e) => Array.from({ length: e }, () => s.factor).join(' × ');
  /** Value of a power as plain text: fraction a^e/b^e, decimal rounded, whole with commas. */
  const bValueText = (s, e) => (s.kind === 'frac' ? `${pw(s.a, e)}/${pw(s.b, e)}` : s.kind === 'dec' ? dec(pw(s.v, e)) : fmt(pw(s.v, e)));
  const bValueHtml = (s, e) => (s.kind === 'frac' ? V.frac(pw(s.a, e), pw(s.b, e)) : bValueText(s, e));
  const decPlaces = (x) => (String(x).split('.')[1] || '').length;

  const DIAL_CTX = ['the main dial', 'the furnace dial', 'the pressure dial', 'the lift dial', 'the pump dial'];

  // ---------- Repeated factors → power (blanks, template) ----------
  G.define('e3_writePower', (r, o) => {
    const hard = !!o.hard;
    const s = hard
      ? r.chance(0.5)
        ? B.dec(r.pick([0.5, 0.2, 0.3, 1.5, 2.5]))
        : B.frac(
            ...r.pick([
              [1, 2],
              [2, 3],
              [3, 4],
              [2, 5],
              [5, 6],
            ]),
          )
      : B.int(r.pick([2, 3, 4, 5, 6, 7, 8, 9, 10]));
    const e = hard ? r.int(3, 7) : r.int(2, 5);
    const name = r.pick(NAMES);
    const dial = r.pick(DIAL_CTX);
    return {
      type: 'blanks',
      skill: 'write-powers',
      lesson: '6-3',
      title: 'Write the power',
      prompt: `<p>${name} reads ${dial}: it multiplies by the same factor again and again.</p><p class="big">${hl(bExpanded(s, e))}</p><p>Write this repeated multiplication as a <b>power</b>. Enter the base and the exponent.${
        hard ? ` Type the base exactly as it repeats${s.kind === 'frac' ? ' (a fraction such as 1/2)' : ' (a decimal)'}.` : ''
      }</p>`,
      fields: [
        { label: 'base', answer: s.v, width: hard ? 'sm' : 'xs' },
        { label: 'exponent', answer: e, width: 'xs' },
      ],
      template: 'Power: base {0}, exponent {1}',
      hints: [
        'The base is the number that repeats. The exponent counts how many times it is used as a factor.',
        `The factor that repeats is ${s.factor}. Count how many times ${s.factor} is written.`,
        'Count the factors carefully. There is always one more factor than there are × signs.',
      ],
      hintEs: 'La base es el número que se repite. El exponente cuenta cuántas veces se usa como factor.',
      solution: `<p>${bExpanded(s, e)} uses ${s.factor} as a factor ${e} times. Written as a power that is <b>${bPowHtml(s, e)}</b>: the base is ${s.text.replace(/[()]/g, '')} and the exponent is ${e}. The exponent counts factors; it does not multiply the base.${
        s.kind === 'frac' ? ' The parentheses show that the whole fraction is the base.' : ''
      }</p>`,
      feedback: {
        correct: `Correct. ${bExpanded(s, e)} = ${bPow(s, e)}. The base ${s.factor} is used ${e} times.`,
        wrong(ans) {
          const x = parseNum(ans[0]),
            y = parseNum(ans[1]);
          if (x != null && near(x, e, 1e-9) && y != null && near(y, s.v, 1e-6))
            return `You swapped them. The base is the number that repeats (${s.factor}). The exponent counts how many times (${e}).`;
          if (x != null && near(x, s.v, 1e-6) && y != null && near(y, pw(s.v, e), 1e-6)) return `The exponent is a count of factors, not the value. ${s.factor} is written ${e} times.`;
          if (x != null && near(x, s.v, 1e-6) && y != null && near(y, s.v * e, 1e-6)) return `Do not multiply the base by the count. The exponent is just the count of factors.`;
          if (x != null && near(x, s.v, 1e-6) && (y === e - 1 || y === e + 1)) return `The base is right. Count the factors again: there is one more factor than there are × signs.`;
          if (s.kind === 'frac' && x != null && (x === s.a || x === s.b)) return `The whole fraction ${s.a}/${s.b} repeats, so the base is ${s.a}/${s.b}, not just one part of it.`;
          return `Which number repeats? That is the base. How many times is it written? That is the exponent.`;
        },
      },
    };
  });

  // ---------- Which expanded form matches the power? (mc) ----------
  G.define('e3_whichExpanded', (r, o) => {
    const hard = !!o.hard;
    if (hard) {
      // fraction base in parentheses: the whole fraction repeats
      const [a, b] = r.pick([
        [2, 3],
        [3, 4],
        [2, 5],
        [3, 5],
        [4, 5],
        [5, 6],
        [3, 8],
      ]);
      const e = r.int(2, 4);
      const s = B.frac(a, b);
      const opts = [
        { html: bExpanded(s, e), ok: true },
        { html: Array.from({ length: e }, () => s.factor).join(' + '), why: `A power means repeated multiplication, not repeated addition. Adding ${e} copies of ${a}/${b} is ${a}/${b} × ${e}.` },
        { html: `(${expanded(a, e)}) / ${b}`, why: `That uses only the numerator ${a} as the base. The parentheses make the whole fraction ${a}/${b} the base, so the denominator repeats too.` },
        { html: `${a} / (${expanded(b, e)})`, why: `That uses only the denominator ${b} as the base. The parentheses make the whole fraction ${a}/${b} the base, so the numerator repeats too.` },
      ];
      const sh = shuffleOptions(r, opts, 0);
      return {
        type: 'mc',
        skill: 'write-powers',
        lesson: '6-3',
        title: 'Read the power',
        prompt: `<p>A dial is labeled <span class="big">${bPowHtml(s, e)}</span>.</p><p>Which expression shows ${hl(bPow(s, e))} written as repeated multiplication?</p>`,
        options: sh.options,
        answer: sh.answer,
        hints: [
          `With parentheses, the whole fraction ${a}/${b} is the base. The exponent counts how many times it is used as a factor.`,
          `The base is ${a}/${b} and the exponent is ${e}, so ${s.factor} should appear ${e} times.`,
          `Look for ${e} copies of ${s.factor}, each joined by a multiplication sign.`,
        ],
        hintEs: `Con paréntesis, toda la fracción ${a}/${b} es la base. El exponente cuenta cuántas veces se usa como factor.`,
        solution: `<p>${bPowHtml(s, e)} means ${a}/${b} used as a factor ${e} times: <b>${bExpanded(s, e)}</b> = ${bValueHtml(s, e)}. Both the numerator and the denominator are multiplied ${e} times, because the parentheses make the whole fraction the base.</p>`,
        feedback: { correct: `Correct. ${bPow(s, e)} = ${bExpanded(s, e)}.`, wrong: U.whyWrong(sh.options, `The base is the whole fraction in parentheses. Write it as a factor ${e} times.`) },
      };
    }
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
      hintEs: 'La base es el número grande. El exponente es el número pequeño y elevado. El exponente cuenta los factores.',
      solution: `<p>${P(b, e)} means ${b} used as a factor ${e} times: <b>${expanded(b, e)}</b>. It is not ${b} × ${e}, and it is not ${b} added ${e} times. The exponent is a count of factors.</p>`,
      feedback: { correct: `Correct. ${PT(b, e)} = ${expanded(b, e)}.`, wrong: U.whyWrong(sh.options, `The base ${b} repeats; the exponent ${e} counts the factors.`) },
    };
  });

  // ---------- Match powers to expanded forms (match) ----------
  G.define('e3_matchPowers', (r, o) => {
    const hard = !!o.hard;
    let picked;
    if (hard) {
      // swapped pairs such as 2⁵ and 5² sit side by side, plus one more power
      const swaps = r.pickN(
        [
          [2, 3],
          [2, 5],
          [3, 4],
          [2, 6],
          [3, 5],
          [4, 5],
        ],
        2,
      );
      const used = new Set();
      picked = [];
      swaps.forEach(([x, y]) => {
        picked.push([x, y], [y, x]);
        used.add(x + ',' + y).add(y + ',' + x);
      });
      const extra = [
        [10, 3],
        [7, 2],
        [6, 3],
        [9, 2],
      ].filter(([x, y]) => !used.has(x + ',' + y));
      picked.push(r.pick(extra));
      picked = r.shuffle(picked);
    } else {
      const pool = [];
      for (const b of [2, 3, 4, 5, 6, 7, 10]) for (const e of [2, 3, 4]) pool.push([b, e]);
      picked = r.pickN(pool, 4);
    }
    const n = picked.length;
    const left = picked.map(([b, e]) => P(b, e));
    const order = r.shuffle(picked.map((_, i) => i));
    const right = order.map((i) => expanded(picked[i][0], picked[i][1]));
    const pairs = picked.map((_, i) => [i, order.indexOf(i)]);
    return {
      type: 'match',
      skill: 'write-powers',
      lesson: '6-3',
      title: 'Match each power to its meaning',
      prompt: hard
        ? `<p>${n} dials are labeled with powers. Some use the same two numbers in swapped places. Match each power on the left to the repeated multiplication it stands for.</p>`
        : `<p>Four dials are labeled with powers. Match each power on the left to the repeated multiplication it stands for.</p><p class="muted">Check the base first, then count the factors.</p>`,
      left,
      right,
      pairs,
      hints: [
        'The base is the number that repeats. The exponent tells how many copies are multiplied.',
        `For ${PT(picked[0][0], picked[0][1])}: the base is ${picked[0][0]}, so look for ${picked[0][0]} written ${picked[0][1]} times.`,
        hard ? `${PT(2, 5)} and ${PT(5, 2)} are different: 2 × 2 × 2 × 2 × 2 is not 5 × 5. Check which number repeats.` : 'Two powers can share a base. Count the factors to tell them apart.',
      ],
      hintEs: 'La base es el número que se repite. El exponente dice cuántas copias se multiplican.',
      solution: `<p>${picked.map(([b, e]) => `${PT(b, e)} = ${expanded(b, e)}`).join('; ')}. In every case the base is the repeated factor and the exponent is <b>how many</b> factors there are.</p>`,
      feedback: {
        correct: 'Correct. Base = the repeated factor, exponent = the number of factors.',
        wrong(ans, dt) {
          const i = (dt.wrong || [])[0];
          const [b, e] = picked[i] || picked[0];
          if (hard && picked.some(([x, y]) => x === e && y === b)) return `Look at ${PT(b, e)} again. Its base is ${b}, so ${b} repeats ${e} times. ${PT(e, b)} is the one where ${e} repeats.`;
          return `Look at ${PT(b, e)} again. Its base is ${b}, so the matching expression must multiply ${b} by itself, ${e} times.`;
        },
      },
    };
  });

  // ---------- Words for a power (cloze) ----------
  G.define('e3_powerWords', (r, o) => {
    const hard = !!o.hard;
    const b = r.pick([2, 3, 4, 5, 6, 7, 8, 9, 10]);
    let e = hard ? r.int(3, 6) : r.int(2, 4);
    if (e === b) e = e === (hard ? 6 : 4) ? e - 1 : e + 1;
    const allWords = ['squared', 'cubed', 'to the fourth power', 'to the fifth power', 'to the sixth power'];
    const wordChoices = r.shuffle(
      hard
        ? [
            U.powerWord(e),
            ...r.pickN(
              allWords.filter((w) => w !== U.powerWord(e)),
              3,
            ),
          ]
        : ['squared', 'cubed', 'to the fourth power'],
    );
    const baseChoices = r.shuffle([String(b), String(e), String(b * e)]);
    const expChoices = r.shuffle([String(e), String(b), hard ? String(e + 1) : String(pw(b, e))]);
    const val = pw(b, e);
    const valueChoices = r.shuffle([fmt(val), fmt(b * e), fmt(pw(e, b))].filter((v, i, arr) => arr.indexOf(v) === i));
    while (valueChoices.length < 3) valueChoices.push(fmt(pw(b, e - 1)));
    const name = r.pick(NAMES);
    return {
      type: 'cloze',
      skill: 'write-powers',
      lesson: '6-3',
      title: 'Say the power in words',
      prompt: `<p>${name} must read the dial <span class="big">${P(b, e)}</span> aloud to the crew${hard ? ' and report its value' : ''}.</p><p>Complete the sentence.</p>`,
      template: hard ? `${PT(b, e)} is read "${b} {0}." Its base is {1} and its exponent is {2}. Its value is {3}.` : `${PT(b, e)} is read "${b} {0}." Its base is {1} and its exponent is {2}.`,
      choices: hard ? [wordChoices, baseChoices, expChoices, valueChoices] : [wordChoices, baseChoices, expChoices],
      answers: [wordChoices.indexOf(U.powerWord(e)), baseChoices.indexOf(String(b)), expChoices.indexOf(String(e)), ...(hard ? [valueChoices.indexOf(fmt(val))] : [])],
      hints: [
        'An exponent of 2 is read "squared," an exponent of 3 is read "cubed," and other exponents are read "to the ___ power."',
        `The base is the large number, ${b}. The exponent is the small raised number.`,
        hard ? `The exponent is ${e}. For the value, multiply ${expanded(b, e)}.` : `The exponent here is ${e}, so the power is read "${b} ${U.powerWord(e)}."`,
      ],
      hintEs: 'Un exponente de 2 se lee "al cuadrado", un exponente de 3 se lee "al cubo" y los demás exponentes se leen "a la ___ potencia".',
      solution: `<p>${P(b, e)} is read "<b>${b} ${U.powerWord(e)}</b>." The base is <b>${b}</b> (the factor that repeats) and the exponent is <b>${e}</b> (how many times it repeats). Its value is ${expanded(b, e)} = ${hard ? `<b>${fmt(val)}</b>` : fmt(val)}.</p>`,
      feedback: {
        correct: `Correct. ${PT(b, e)} is "${b} ${U.powerWord(e)}," with base ${b} and exponent ${e}.`,
        wrong(ans, dt) {
          if (dt.wrong.includes(0)) return `The word depends on the exponent ${e}: 2 is "squared," 3 is "cubed," and other exponents are "to the ___ power."`;
          if (dt.wrong.includes(1)) return `The base is the big number written first: ${b}.`;
          if (dt.wrong.includes(2)) return `The exponent is the small raised number. It is a count of factors, not the value of the power.`;
          if (valueChoices[ans[3]] === fmt(b * e)) return `${fmt(b * e)} is ${b} × ${e}. The value of a power uses ${b} as a factor ${e} times.`;
          return `For the value, multiply ${b} by itself until you have ${e} factors.`;
        },
      },
    };
  });

  // ---------- Evaluate a power (num) ----------
  G.define('e3_evaluate', (r, o) => {
    const hard = !!o.hard;
    let s, e;
    if (hard) {
      // large whole-number powers, decimal bases, or fraction bases
      const kind = r.pick(['int', 'dec', 'frac']);
      if (kind === 'int') {
        const [b0, e0] = r.pick([
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
          [12, 2],
          [15, 2],
        ]);
        [s, e] = [B.int(b0), e0];
      } else if (kind === 'dec') {
        const [b0, e0] = r.pick([
          [0.5, 3],
          [0.2, 3],
          [0.3, 2],
          [0.4, 3],
          [1.5, 2],
          [1.2, 2],
          [0.1, 3],
          [2.5, 2],
        ]);
        [s, e] = [B.dec(b0), e0];
      } else {
        const [a0, b0, e0] = r.pick([
          [1, 2, 4],
          [2, 3, 3],
          [3, 4, 2],
          [2, 5, 3],
          [3, 2, 3],
          [4, 5, 2],
          [1, 3, 4],
        ]);
        [s, e] = [B.frac(a0, b0), e0];
      }
    } else {
      const b = r.pick([2, 3, 4, 5, 6, 7, 8, 9, 10]);
      s = B.int(b);
      e = b === 10 ? r.int(2, 4) : b >= 6 ? r.int(2, 3) : r.int(2, 4);
    }
    const val = s.kind === 'frac' ? pw(s.a, e) / pw(s.b, e) : round(pw(s.v, e), 6);
    const name = r.pick(NAMES);
    const dial = r.pick(DIAL_CTX);
    const ctx = r.pick([
      `${name} turns ${dial} to ${bPow(s, e)}. The dial multiplies the Foundry's power by ${s.factor}, ${e} times in a row.`,
      `A plate on ${dial} reads ${bPow(s, e)}.`,
      `${name} finds the setting ${bPow(s, e)} scratched into ${dial}.`,
    ]);
    const k = decPlaces(s.v);
    return {
      type: 'num',
      skill: 'evaluate-powers',
      lesson: '6-3',
      title: hard ? 'Find the value of a harder power' : 'Find the value of the power',
      prompt: `<p>${ctx}</p><p>What is the value of ${hl(bPow(s, e))}?${s.kind === 'frac' ? ' Write the answer as a fraction.' : s.kind === 'dec' ? ' Write the answer as a decimal.' : ''}</p>`,
      answer: val,
      tolerance: s.kind === 'int' ? undefined : 1e-6,
      hints: [
        `${bPow(s, e)} means ${s.factor} used as a factor ${e} times. Write out the factors before multiplying.`,
        `${bExpanded(s, e)}. Multiply two at a time, left to right.`,
        s.kind === 'frac'
          ? `Multiply the numerators (${s.a} used ${e} times) and the denominators (${s.b} used ${e} times).`
          : s.kind === 'dec'
            ? `Multiply as if there were no decimal points, then count: each factor has ${k} decimal place${k === 1 ? '' : 's'}, so the product has ${k * e}.`
            : e === 2
              ? `${s.v} × ${s.v} = ?`
              : `${s.v} × ${s.v} = ${s.v * s.v}. Now keep multiplying by ${s.v} until all ${e} factors are used.`,
      ],
      hintEs: `${bPow(s, e)} significa usar ${s.factor} como factor ${e} veces. Escribe los factores antes de multiplicar.`,
      solution: `<p>${bPowHtml(s, e)} = ${bExpanded(s, e)} = <b>${bValueHtml(s, e)}</b>. The exponent ${e} is a count of factors, so the value is ${s.factor} multiplied by itself ${e} times, not ${s.factor} × ${e}.${
        s.kind === 'int' && s.v === 10 ? ` A power of 10 is a 1 followed by ${e} zeros.` : ''
      }${s.kind === 'dec' && s.v < 1 ? ` A decimal less than 1 gets smaller each time you multiply by it.` : ''}${s.kind === 'frac' ? ' Both the numerator and the denominator are raised to the power.' : ''}</p>`,
      feedback: {
        correct: `Correct. ${bExpanded(s, e)} = ${bValueText(s, e)}.`,
        wrong(ans, dt) {
          const v = dt.value;
          const is = (x) => v != null && Math.abs(v - x) < 1e-6;
          if (v == null) return `Write ${s.factor} as a factor ${e} times and multiply step by step.`;
          if (is(s.v * e)) return `That multiplies the base by the exponent. Instead, use ${s.factor} as a factor ${e} times: ${bExpanded(s, e)}.`;
          if (s.kind === 'frac' && is(pw(s.a, e) / s.b)) return `You raised only the numerator. The parentheses make ${s.a}/${s.b} the base, so the denominator ${s.b} is multiplied ${e} times too.`;
          if (s.kind === 'frac' && is(s.a / pw(s.b, e))) return `You raised only the denominator. The numerator ${s.a} is also used ${e} times.`;
          if (s.kind === 'dec' && (is(val * 10) || is(val / 10) || is(val * 100)))
            return `The digits are right, but the decimal point is not. Count the decimal places: ${e} factors with ${k} place${k === 1 ? '' : 's'} each.`;
          if (s.kind === 'int' && is(pw(e, s.v))) return `You swapped the base and exponent. ${bPow(s, e)} means ${s.v} repeated ${e} times, not ${e} repeated ${s.v} times.`;
          if (s.kind === 'int' && is(s.v + e)) return `Adding ${s.v} + ${e} is not what a power means. Multiply: ${bExpanded(s, e)}.`;
          if (e > 2 && is(round(pw(s.v, e - 1), 6))) return `You stopped one factor early. ${bPow(s, e)} has ${e} factors of ${s.factor}.`;
          if (is(round(pw(s.v, e + 1), 6))) return `You multiplied one time too many. ${bPow(s, e)} has exactly ${e} factors of ${s.factor}.`;
          return `Write ${s.factor} as a factor ${e} times and multiply step by step.`;
        },
      },
    };
  });

  // ---------- Error: multiplied the base by the exponent / misplaced the decimal (error) ----------
  G.define('e3_errorTimes', (r, o) => {
    const hard = !!o.hard;
    const name = r.pick(NAMES);
    if (hard) {
      // decimal base squared: the student gave the product only one decimal place
      const d = r.int(2, 9);
      const base = d / 10;
      const right = round((d * d) / 100, 4);
      const wrongVal = round((d * d) / 10, 4);
      const opts = [
        { html: `${name} placed the decimal point wrong. Each factor has 1 decimal place, so the product needs 2.`, ok: true },
        { html: `${name} should have multiplied ${dec(base)} × 2 instead.`, why: `The exponent 2 means two factors of ${dec(base)}. It does not mean multiply by 2.` },
        { html: `${name} should have used 2 as the base and ${dec(base)} as the exponent.`, why: `The base is the big number, ${dec(base)}. The small raised 2 is the exponent.` },
        {
          html: `The work is correct. Squaring a decimal always makes it larger.`,
          why: `Squaring a decimal less than 1 makes it SMALLER. ${dec(base)} × ${dec(base)} must be less than ${dec(base)}.`,
        },
      ];
      const sh = shuffleOptions(r, opts, 0);
      return {
        type: 'error',
        skill: 'evaluate-powers',
        lesson: '6-3',
        title: 'Find the mistake',
        prompt: `<p>${name} set a dial to ${hl(dec(base) + U.supText(2))} and wrote this work. The dial did not glow.</p><p>What went wrong?</p>`,
        work: `${dec(base)}<sup>2</sup> = ${dec(base)} × ${dec(base)} = ${dec(wrongVal)}`,
        options: sh.options,
        answer: sh.answer,
        fix: { label: `The correct value of ${dec(base)}${U.supText(2)} is`, answer: right, tolerance: 1e-6 },
        hints: [
          `Estimate first. ${dec(base)} is less than 1, so ${dec(base)} × ${dec(base)} must be less than ${dec(base)}.`,
          `Multiply ${d} × ${d} as whole numbers. Then count the decimal places in the two factors.`,
          `Each factor has 1 decimal place. Place the decimal point so the product has 2 decimal places.`,
        ],
        hintEs: `Primero estima. ${dec(base)} es menor que 1, así que ${dec(base)} × ${dec(base)} debe ser menor que ${dec(base)}.`,
        solution: `<p>${d} × ${d} = ${d * d}. Each factor has 1 decimal place, so the product has 2: ${dec(base)}<sup>2</sup> = <b>${dec(right)}</b>. ${name}'s answer, ${dec(wrongVal)}, is ${wrongVal > base ? 'bigger than' : 'only one decimal place off from'} the base, which cannot be right for a decimal less than 1 times itself.</p>`,
        feedback: {
          correct: `Correct. ${dec(base)} × ${dec(base)} = ${dec(right)}. Two factors with one decimal place each give two decimal places.`,
          wrong(ans, dt) {
            if (!dt.mistakeOk) return (sh.options[ans.mistake] && sh.options[ans.mistake].why) || 'Check where the decimal point goes.';
            const v = parseNum(ans.fix);
            if (v != null && Math.abs(v - base * 2) < 1e-6) return `${dec(base * 2)} is ${dec(base)} × 2. Squaring means ${dec(base)} × ${dec(base)}.`;
            if (v != null && Math.abs(v - wrongVal) < 1e-6) return `That repeats ${name}'s answer. Count the decimal places in both factors.`;
            return `You found the mistake. For the fix: multiply ${d} × ${d}, then give the product 2 decimal places.`;
          },
        },
      };
    }
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
      hintEs: `¿Qué te dice el exponente ${e} que hagas con la base ${b}?`,
      solution: `<p>${name} treated the exponent as a factor and computed ${b} × ${e}. The exponent is a <b>count</b>: ${P(b, e)} = ${expanded(b, e)} = <b>${val}</b>.</p>`,
      feedback: {
        correct: `Correct. ${PT(b, e)} means ${expanded(b, e)} = ${val}, not ${b} × ${e}.`,
        wrong(ans, dt) {
          if (!dt.mistakeOk) return (sh.options[ans.mistake] && sh.options[ans.mistake].why) || `Compare ${b} × ${e} with what the exponent really means.`;
          const v = parseNum(ans.fix);
          if (v === b * e) return `That repeats ${name}'s answer. Use ${b} as a factor ${e} times.`;
          if (v === pw(e, b)) return `That is ${PT(e, b)}. The base is ${b}, so ${b} repeats ${e} times.`;
          return `You found the mistake. For the fix: ${expanded(b, e)} = ?`;
        },
      },
    };
  });

  // ---------- Order powers by value (seq) ----------
  G.define('e3_seqOrder', (r, o) => {
    const hard = !!o.hard;
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
    if (hard) {
      // four powers, including a swapped pair whose order is not obvious from the exponents
      const swap = r.pick([
        [
          [2, 5],
          [5, 2],
        ],
        [
          [3, 4],
          [4, 3],
        ],
        [
          [2, 3],
          [3, 2],
        ],
        [
          [3, 5],
          [5, 3],
        ],
        [
          [2, 6],
          [6, 2],
        ],
      ]);
      for (let tries = 0; tries < 80; tries++) {
        picked = [...swap, ...r.pickN(pool, 2)];
        const vals = picked.map(([b, e]) => pw(b, e));
        if (new Set(vals).size === 4 && new Set(picked.map((p) => p.join())).size === 4) break;
      }
    } else {
      for (let tries = 0; tries < 60; tries++) {
        picked = r.pickN(pool, 3);
        const vals = picked.map(([b, e]) => pw(b, e));
        if (new Set(vals).size === 3) break;
      }
    }
    picked = r.shuffle(picked);
    const n = picked.length;
    const asc = r.chance(0.5);
    const items = picked.map(([b, e]) => ({ html: `<span class="big">${P(b, e)}</span>`, rate: pw(b, e) }));
    const order = picked.map((_, i) => i).sort((x, y) => (asc ? items[x].rate - items[y].rate : items[y].rate - items[x].rate));
    return {
      type: 'seq',
      skill: 'evaluate-powers',
      lesson: '6-3',
      title: 'Order the dials by value',
      prompt: `<p>${n === 4 ? 'Four' : 'Three'} dials are labeled with powers. Order them from <b>${asc ? 'least' : 'greatest'}</b> value (top) to <b>${asc ? 'greatest' : 'least'}</b> value (bottom).</p><p class="muted">A bigger exponent does not always mean a bigger value. Find each value first.</p>`,
      items,
      order,
      hints: [
        'Find the value of each power before you compare. The exponent counts how many times the base is multiplied.',
        hard
          ? `Start with the two powers that use the same numbers: ${picked
              .filter(([b, e]) => picked.some(([x, y]) => x === e && y === b))
              .map(([b, e]) => `${PT(b, e)} = ${expanded(b, e)}`)
              .join(' and ')}.`
          : `Values: ${picked.map(([b, e]) => `${PT(b, e)} = ${pw(b, e)}`).join('; ')}.`,
        `Now compare the values and put the ${asc ? 'least' : 'greatest'} at the top.`,
      ],
      hintEs: 'Halla el valor de cada potencia antes de comparar. El exponente cuenta cuántas veces se multiplica la base.',
      solution: `<p>${picked.map(([b, e]) => `${PT(b, e)} = ${expanded(b, e)} = ${pw(b, e)}`).join('; ')}. From ${asc ? 'least to greatest' : 'greatest to least'}: <b>${order.map((i) => PT(picked[i][0], picked[i][1])).join(', ')}</b>. You cannot compare powers by looking at the exponents alone.</p>`,
      feedback: {
        correct: 'Correct. Evaluating each power first is the only safe way to compare them.',
        wrong() {
          return hard
            ? `Find each value before you compare. Watch the pair that uses the same two numbers: the larger exponent does not always win.`
            : `Find each value: ${picked.map(([b, e]) => `${PT(b, e)} = ${pw(b, e)}`).join(', ')}. Then put the ${asc ? 'least' : 'greatest'} at the top.`;
        },
      },
    };
  });

  // ---------- Squares and cubes table (table) ----------
  G.define('e3_perfectSquares', (r, o) => {
    const hard = !!o.hard;
    const start = hard ? r.int(7, 10) : r.int(2, 6);
    const ns = [start, start + 1, start + 2];
    const rows = [['n', `n${U.supText(2)} (n squared)`, `n${U.supText(3)} (n cubed)`]];
    const inputs = [];
    // Normal: in one row the square and cube are given and n is asked.
    // Hard: in one row ONLY the cube is given; find n and the square.
    const askRow = r.int(0, 2);
    ns.forEach((n, i) => {
      if (i === askRow && hard) {
        rows.push([`__IN:n${i}__`, `__IN:s${i}__`, fmt(n * n * n)]);
        inputs.push({ id: `n${i}`, answer: n }, { id: `s${i}`, answer: n * n });
      } else if (i === askRow) {
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
      prompt: hard
        ? `<p>The dial maker keeps a table of squares and cubes for the bases ${hl(ns.filter((_, i) => i !== askRow).join(' and '))} and one more base. Complete it. In one row only the cube is given: find the base <b>n</b> and its square.</p>`
        : `<p>The dial maker keeps a table of squares and cubes for the bases ${hl(ns.filter((_, i) => i !== askRow).join(' and '))} and one more base. Complete it. In one row the square and cube are given and the base <b>n</b> is missing.</p><p class="muted">n squared means n × n. n cubed means n × n × n.</p>`,
      rows,
      header: true,
      inputs,
      hints: [
        'To square a number, multiply it by itself. To cube it, multiply it by itself twice (three factors).',
        hard
          ? `For the missing base: which number used as a factor three times equals ${fmt(nAsk * nAsk * nAsk)}? The other bases in the table are a clue.`
          : `For the missing base: which number times itself equals ${nAsk * nAsk}?`,
        `${ns
          .filter((_, i) => i !== askRow)
          .map((n) => `${n} × ${n} = ${n * n}; then multiply by ${n} once more for the cube`)
          .join('. ')}.`,
      ],
      hintEs: 'Para elevar un número al cuadrado, multiplícalo por sí mismo. Para elevarlo al cubo, usa tres factores iguales.',
      solution: `<p>${ns.map((n) => `${PT(n, 2)} = ${n * n}, ${PT(n, 3)} = ${fmt(n * n * n)}`).join('; ')}. The missing base is <b>${nAsk}</b>, because ${hard ? `${nAsk} × ${nAsk} × ${nAsk} = ${fmt(nAsk * nAsk * nAsk)}` : `${nAsk} × ${nAsk} = ${nAsk * nAsk}`}. Squaring and cubing are repeated multiplication, so ${PT(nAsk, 3)} is ${nAsk} times as big as ${PT(nAsk, 2)}.</p>`,
      feedback: {
        correct: 'Correct. Square = two equal factors, cube = three equal factors.',
        wrong(ans, dt) {
          const w = (dt.wrong || [])[0] || '';
          const typed = parseNum((ans || {})[w]);
          const n = w ? (w.startsWith('n') ? nAsk : ns[Number(w.slice(1))]) : nAsk;
          if (w.startsWith('n'))
            return hard
              ? `The cube is ${fmt(nAsk * nAsk * nAsk)}. Try a base near the others in the table: which n gives n × n × n = ${fmt(nAsk * nAsk * nAsk)}?`
              : `The square is ${nAsk * nAsk}. Which number multiplied by itself gives ${nAsk * nAsk}?`;
          if (w.startsWith('s')) return typed === n * 2 ? `${n * 2} is ${n} × 2. Squaring means ${n} × ${n}.` : 'For n squared, multiply n × n. Do not multiply n × 2.';
          return typed === n * 3 ? `${n * 3} is ${n} × 3. Cubing means ${n} × ${n} × ${n}.` : 'For n cubed, multiply n × n × n. Do not multiply n × 3.';
        },
      },
    };
  });
})(typeof window !== 'undefined' ? window : globalThis);

/* js/units/u6/gen-numeric-lib.js */
/* Zone 4 — The Sequencer. Lesson 6-4 Write and Evaluate Numerical Expressions with Exponents. */
/* Shared helpers for gen-numeric.js and gen-numeric-2.js (split for size). */
(function (root) {
  'use strict';
  const RX = root.RX;
  const { G, V, shuffleOptions, NAMES, parseNum } = RX;
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
  /** Harder phrases: nested grouping, a power inside a group, or two operations on a named quantity. */
  const HARD_PHRASES = [
    (r) => {
      const k = r.int(2, 5),
        a = r.int(2, 6),
        b = r.int(2, 9);
      return {
        words: `the product of ${k} and the sum of ${a} squared and ${b}`,
        text: `${k} × (${a}${U.supText(2)} + ${b})`,
        value: k * (sq(a) + b),
        wrong: [
          { text: `${k} × ${a}${U.supText(2)} + ${b}`, why: `"The sum of ${a} squared and ${b}" is one quantity, so ${k} multiplies all of it. That needs parentheses.` },
          { text: `(${k} × ${a})${U.supText(2)} + ${b}`, why: `Only ${a} is squared. ${k} multiplies the sum after it is found.` },
          { text: `${k} × (${a} + ${b})${U.supText(2)}`, why: `Only ${a} is squared, not the whole sum of ${a} and ${b}.` },
        ],
      };
    },
    (r) => {
      const c = r.pick([2, 3, 4, 5]);
      const sum = c * r.int(1, 3) + (c === 2 ? 2 : c);
      const a = r.int(1, sum - 1),
        b = sum - a;
      return {
        words: `the square of the sum of ${a} and ${b}, divided by ${c}`,
        text: `(${a} + ${b})${U.supText(2)} ÷ ${c}`,
        value: sq(sum) / c,
        wrong: [
          { text: `${a} + ${b}${U.supText(2)} ÷ ${c}`, why: `"The square of the sum" squares the whole sum, so ${a} + ${b} needs parentheses.` },
          { text: `(${a} + ${b}) ÷ ${c}${U.supText(2)}`, why: `The sum is squared, not the divisor ${c}.` },
          { text: `${c} ÷ (${a} + ${b})${U.supText(2)}`, why: `"Divided by ${c}" means ${c} is the divisor, so it comes second.` },
        ],
      };
    },
    (r) => {
      const c = r.int(1, 5),
        diff = r.int(2, 4),
        a = c + diff,
        b = r.int(1, 7);
      return {
        words: `${b} less than the cube of the difference of ${a} and ${c}`,
        text: `(${a} − ${c})${U.supText(3)} − ${b}`,
        value: diff ** 3 - b,
        wrong: [
          { text: `${b} − (${a} − ${c})${U.supText(3)}`, why: `"${b} less than" a quantity starts with the quantity and then subtracts ${b}.` },
          { text: `${a} − ${c}${U.supText(3)} − ${b}`, why: `The whole difference is cubed, so ${a} − ${c} needs parentheses.` },
          { text: `(${a} − ${c} − ${b})${U.supText(3)}`, why: `${b} is subtracted after cubing, so it stays outside the parentheses.` },
        ],
      };
    },
    (r) => {
      const a = r.int(4, 9);
      const b = 2 * r.int(1, 6) + (sq(a) % 2);
      return {
        words: `half of the difference of ${a} squared and ${b}`,
        text: `(${a}${U.supText(2)} − ${b}) ÷ 2`,
        value: (sq(a) - b) / 2,
        wrong: [
          { text: `${a}${U.supText(2)} − ${b} ÷ 2`, why: `"Half of the difference" halves the whole difference, so ${a}${U.supText(2)} − ${b} needs parentheses.` },
          { text: `(${a} − ${b})${U.supText(2)} ÷ 2`, why: `Only ${a} is squared. The difference is found after squaring ${a}.` },
          { text: `2 × (${a}${U.supText(2)} − ${b})`, why: `"Half of" means divide by 2, not multiply by 2.` },
        ],
      };
    },
    (r) => {
      const k = r.int(2, 5),
        a = r.int(2, 9),
        b = r.int(2, 5),
        c = r.int(2, 6);
      return {
        words: `${k} times the sum of ${a} and the product of ${b} and ${c}`,
        text: `${k} × (${a} + ${b} × ${c})`,
        value: k * (a + b * c),
        wrong: [
          { text: `${k} × (${a} + ${b}) × ${c}`, why: `The sum is ${a} plus a product. ${c} belongs inside the parentheses with ${b}.` },
          { text: `${k} × ${a} + ${b} × ${c}`, why: `${k} multiplies the whole sum, so the sum needs parentheses.` },
          { text: `${k} + ${a} + ${b} × ${c}`, why: `"${k} times" means multiply by ${k}, not add ${k}.` },
        ],
      };
    },
    (r) => {
      const a = r.int(2, 4),
        b = r.int(3, 9);
      return {
        words: `the sum of ${a} cubed and ${b} squared`,
        text: `${a}${U.supText(3)} + ${b}${U.supText(2)}`,
        value: a ** 3 + sq(b),
        wrong: [
          { text: `${a} × 3 + ${b} × 2`, why: `"Cubed" and "squared" are exponents. ${a} cubed is ${a} × ${a} × ${a}, not ${a} × 3.` },
          { text: `(${a} + ${b})${U.supText(3)}`, why: `Each number gets its own exponent: ${a} is cubed and ${b} is squared, then they are added.` },
          { text: `${a}${U.supText(3)} × ${b}${U.supText(2)}`, why: `"Sum" means add the two powers, not multiply them.` },
        ],
      };
    },
  ];
  const phrase = (r, hard) => r.pick(hard ? HARD_PHRASES : PHRASES)(r);

  // ---------- Words → expression (mc) ----------
  // ---------- Match expressions to word phrases (match) ----------
  // ---------- Words → evaluate (num) ----------
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
  /** Order-of-operations expression templates: return { text, value, steps:[...], ltr (left-to-right wrong value), baseTimes (base×exponent wrong value) }. */
  function orderExpr(r, hard) {
    const a = r.int(2, 9),
      b = r.int(2, 5),
      c = r.int(2, 6),
      d = r.int(2, 5);
    const pick = r.int(0, 3);
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
    if (pick === 3) {
      // nested grouping: k × [a + (b − c)²]
      const k = r.int(2, 4),
        cc = r.int(1, 5),
        diff = r.int(2, 5),
        bb = cc + diff;
      const inner = a + sq(diff);
      return {
        text: `${k} × [${a} + (${bb} − ${cc})${U.supText(2)}]`,
        value: k * inner,
        steps: [`${bb} − ${cc} = ${diff}`, `${PT(diff, 2)} = ${sq(diff)}`, `${a} + ${sq(diff)} = ${inner}`, `${k} × ${inner} = ${k * inner}`],
        ltr: sq(k * a + bb - cc),
        baseTimes: k * (a + diff * 2),
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
  // ---------- Steps as a cloze (cloze) ----------
  // ---------- Error: wrong order or wrong power (error) ----------
  // ---------- Grouping changes the value (table) ----------
  RX._lib = RX._lib || {};
  RX._lib['u6/gen-numeric'] = { G, V, shuffleOptions, NAMES, parseNum, U, hl, PT, sq, PHRASES, HARD_PHRASES, phrase, evalText, orderExpr };
})(typeof window !== 'undefined' ? window : globalThis);

/* js/units/u6/gen-numeric.js */
/* Zone 4 — The Sequencer. Lesson 6-4 Write and Evaluate Numerical Expressions with Exponents. */
(function (root) {
  'use strict';
  const RX = root.RX;
  const { G, V, shuffleOptions, NAMES, parseNum, U, hl, PT, sq, PHRASES, HARD_PHRASES, phrase, evalText, orderExpr } = RX._lib['u6/gen-numeric'];

  G.define('e4_wordsToExpr', (r, o) => {
    const p = phrase(r, !!o.hard);
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
      hintEs: 'Busca primero las palabras clave: suma (+), diferencia (−), producto (×), cociente (÷), al cuadrado o al cubo (exponente).',
      solution: `<p>"${p.words}" is <b>${p.text}</b>. Each operation word becomes a symbol, and a quantity that is named as a whole (a sum, a difference) is grouped in parentheses. Its value is ${p.value}.</p>`,
      feedback: {
        correct: `Correct. "${p.words}" = ${p.text}.`,
        wrong: U.whyWrong(sh.options, 'Turn each operation word into a symbol, and put parentheses around any quantity the words name as a whole.'),
      },
    };
  });

  G.define('e4_exprToWords', (r, o) => {
    const hard = !!o.hard;
    let ps;
    for (let tries = 0; tries < 50; tries++) {
      ps = r.pickN(hard ? HARD_PHRASES : PHRASES, 4).map((f) => f(r));
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
      prompt: hard
        ? `<p>Four sequencer cards were separated from their expressions. Each card has more than one operation. Match each expression on the left to the words that describe it exactly.</p>`
        : `<p>Four sequencer cards were separated from their expressions. Match each expression on the left to the words that describe it.</p>`,
      left,
      right,
      pairs,
      hints: [
        'Translate the symbols: + is a sum, − is a difference, × is a product, ÷ is a quotient, a small raised 2 is "squared."',
        'Parentheses mean the words name that part as one quantity, such as "the sum of ..." or "the difference of ..."',
        `For example, ${ps[0].text} is "${ps[0].words}."`,
      ],
      hintEs: 'Traduce los símbolos: + es una suma, − es una diferencia, × es un producto, ÷ es un cociente y un 2 pequeño y elevado es "al cuadrado".',
      solution: `<p>${ps.map((p) => `${p.text} → "${p.words}"`).join('; ')}. The grouping in each expression matches the quantity that the words name as a whole.</p>`,
      feedback: {
        correct: 'Correct. Operation words map to symbols, and named quantities map to parentheses.',
        wrong(ans, dt) {
          const i = (dt.wrong || [])[0];
          const p = ps[i] || ps[0];
          return `Look at ${p.text}. ${/\(/.test(p.text) ? 'The parentheses mean the words name that part as one quantity.' : 'There are no parentheses, so the exponent or operation applies to a single number.'}`;
        },
      },
    };
  });

  G.define('e4_wordsEvaluate', (r, o) => {
    const p = phrase(r, !!o.hard);
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
      hintEs: 'Primero escribe la expresión. Cambia cada palabra de operación por un símbolo y pon entre paréntesis cada cantidad que se nombra como un todo.',
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

  G.define('e4_whoWrote', (r, o) => {
    const hard = !!o.hard;
    const p = phrase(r, hard);
    const [n1, n2, n3, n4] = r.pickN(NAMES, 4);
    const wrongs = hard ? r.shuffle(p.wrong) : r.pickN(p.wrong, 2);
    const opts = [
      { html: `<b>${n1}:</b> ${p.text}`, ok: true },
      { html: `<b>${n2}:</b> ${wrongs[0].text}`, why: wrongs[0].why },
      { html: `<b>${n3}:</b> ${wrongs[1].text}`, why: wrongs[1].why },
    ];
    if (hard) opts.push({ html: `<b>${n4}:</b> ${wrongs[2].text}`, why: wrongs[2].why });
    const sh = shuffleOptions(r, opts, 0);
    return {
      type: 'who',
      skill: 'numeric-expressions',
      lesson: '6-4',
      title: 'Who wrote the expression correctly?',
      prompt: `<p>${hard ? 'Four' : 'Three'} apprentices each wrote an expression for "<b>${p.words}</b>."</p><p>Who is correct?</p>`,
      options: sh.options,
      answer: sh.answer,
      layout: 'cards',
      hints: [
        'Read the words slowly. Which operation comes first, and which quantity is named as a whole?',
        'Check parentheses: a named sum or difference must be grouped before anything else is done to it. Check "less than": it reverses the order.',
        `The correct expression has the value ${p.value}. Evaluate each student's expression to compare.`,
      ],
      hintEs: 'Lee las palabras despacio. ¿Qué operación va primero y qué cantidad se nombra como un todo?',
      solution: `<p>${n1} is correct: "${p.words}" = <b>${p.text}</b>, which equals ${p.value}. ${n2}: ${wrongs[0].why} ${n3}: ${wrongs[1].why}${hard ? ` ${n4}: ${wrongs[2].why}` : ''}</p>`,
      feedback: {
        correct: `Correct. ${n1} grouped the quantities the way the words describe them.`,
        wrong: U.whyWrong(sh.options, 'Compare each expression with the words, one operation at a time.'),
      },
    };
  });
})(typeof window !== 'undefined' ? window : globalThis);

/* js/units/u6/gen-numeric-2.js */
/* Zone 4 — The Sequencer. Lesson 6-4 Write and Evaluate Numerical Expressions with Exponents. */
(function (root) {
  'use strict';
  const RX = root.RX;
  const { G, V, shuffleOptions, NAMES, parseNum, U, hl, PT, sq, PHRASES, HARD_PHRASES, phrase, evalText, orderExpr } = RX._lib['u6/gen-numeric'];

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
        `Order of operations: grouping symbols first${hard ? ' (work from the inside out)' : ''}, then exponents, then multiply and divide left to right, then add and subtract left to right.`,
        `Step 1: ${ex.steps[0]}. Step 2: ${ex.steps[1]}.`,
        `${ex.steps.slice(0, -1).join('. ')}. One operation remains.`,
      ],
      hintEs: `Orden de las operaciones: primero los símbolos de agrupación${hard ? ' (de adentro hacia afuera)' : ''}, luego los exponentes, luego multiplica y divide de izquierda a derecha, y al final suma y resta de izquierda a derecha.`,
      solution: `<p>${ex.text}. ${ex.steps.map((s, i) => `Step ${i + 1}: ${s}`).join('. ')}. The value is <b>${ex.value}</b>. Exponents are evaluated before multiplying, and parentheses come before everything.</p>`,
      feedback: {
        correct: `Correct. ${ex.text} = ${ex.value}.`,
        wrong(ans, dt) {
          const v = dt.value;
          if (v != null && Math.abs(v - ex.ltr) < 1e-6 && ex.ltr !== ex.value) return 'You worked left to right. Do grouping symbols first, then exponents, then × and ÷, then + and −.';
          if (v != null && Math.abs(v - ex.baseTimes) < 1e-6) return 'Check the power. An exponent counts factors: 4² is 4 × 4 = 16, not 4 × 2.';
          const last = ex.steps[ex.steps.length - 1];
          const penult = Number((ex.steps[ex.steps.length - 2].match(/= (\d+)(?!.*=)/) || [])[1]);
          if (v != null && Math.abs(v - penult) < 1e-6) return `You stopped one step early. ${last.split(' = ')[0]} still needs to be done.`;
          return `Start again: ${ex.steps[0]}. Then follow the order of operations one step at a time.`;
        },
      },
    };
  });

  G.define('e4_stepsCloze', (r, o) => {
    if (o.hard) {
      // nested grouping: k × [(a + b)² − c × d]
      const k = r.int(2, 4),
        a = r.int(1, 5),
        b = r.int(3, 6),
        c = r.int(2, 5),
        d = r.int(2, 3);
      const s1 = a + b,
        s2 = sq(s1),
        s3 = c * d,
        s4 = s2 - s3,
        val = k * s4;
      const text = `${k} × [(${a} + ${b})${U.supText(2)} − ${c} × ${d}]`;
      const uniq = (arr) => arr.filter((v, i, all) => all.indexOf(v) === i);
      const c0 = r.shuffle(uniq([String(s2), String(s1 * 2), String(sq(a) + sq(b))]));
      const c1 = r.shuffle(uniq([String(s4), String((s2 - c) * d), String(s2 - c - d)]));
      const c2 = r.shuffle(uniq([String(val), String(k * s2 - s3), String(k + s4)]));
      return {
        type: 'cloze',
        skill: 'order-ops',
        lesson: '6-4',
        title: 'Complete the steps',
        prompt: `<p>Evaluate ${hl(text)} one step at a time. Work from the innermost grouping symbols out.</p>`,
        template: `Inner parentheses: ${a} + ${b} = ${s1}, then the exponent: ${PT(s1, 2)} = {0}.  Inside the brackets, multiply before subtracting: ${s2} − ${s3} = {1}.  Last, multiply by ${k}: the value is {2}.`,
        choices: [c0, c1, c2],
        answers: [c0.indexOf(String(s2)), c1.indexOf(String(s4)), c2.indexOf(String(val))],
        hints: [
          `Start with the inner parentheses. Then finish everything inside the brackets before you multiply by ${k}.`,
          `${PT(s1, 2)} means ${s1} × ${s1}. Inside the brackets, ${c} × ${d} = ${s3} comes before the subtraction.`,
          `After the brackets give one number, multiply it by ${k}.`,
        ],
        hintEs: `Empieza por los paréntesis de adentro. Luego termina todo lo que está dentro de los corchetes antes de multiplicar por ${k}.`,
        solution: `<p>${text}: ${a} + ${b} = ${s1}; ${PT(s1, 2)} = ${s2}; ${c} × ${d} = ${s3}; ${s2} − ${s3} = ${s4}; ${k} × ${s4} = <b>${val}</b>. The brackets act like a second set of parentheses, so everything inside them is finished before multiplying by ${k}.</p>`,
        feedback: {
          correct: `Correct. Inside out: parentheses, exponent, multiply, subtract, then multiply by ${k}: ${val}.`,
          wrong(ans, dt) {
            if (dt.wrong.includes(0))
              return c0[ans[0]] === String(s1 * 2)
                ? `${PT(s1, 2)} means ${s1} × ${s1}, not ${s1} × 2.`
                : `Add inside the parentheses first, then square the sum. Do not square ${a} and ${b} separately.`;
            if (dt.wrong.includes(1))
              return c1[ans[1]] === String((s2 - c) * d) ? `You subtracted before multiplying. Inside the brackets, ${c} × ${d} comes first.` : `Inside the brackets: ${s2} − (${c} × ${d}).`;
            if (c2[ans[2]] === String(k * s2 - s3)) return `${k} multiplies the WHOLE bracket, not only ${s2}. Use the bracket's value.`;
            return `Multiply the value of the brackets by ${k}.`;
          },
        },
      };
    }
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
      hintEs: 'Los paréntesis van primero. Suma los dos números de adentro.',
      solution: `<p>${text}: parentheses give ${a} + ${b} = ${s1}; the exponent gives ${PT(s1, 2)} = ${s2}; multiplying gives ${c} × ${d} = ${s3}; subtracting last gives ${s2} − ${s3} = <b>${val}</b>. Each step follows the order of operations.</p>`,
      feedback: {
        correct: `Correct. Parentheses, exponent, multiply, then subtract: ${val}.`,
        wrong(ans, dt) {
          if (dt.wrong.includes(0))
            return c0[ans[0]] === String(a * b) ? `You multiplied ${a} × ${b}. Inside the parentheses is addition: ${a} + ${b}.` : `Inside the parentheses is addition: ${a} + ${b}.`;
          if (dt.wrong.includes(1))
            return c1[ans[1]] === String(sq(a) + sq(b))
              ? `Add first, then square the sum. Squaring ${a} and ${b} separately gives a different number.`
              : `${PT(s1, 2)} means ${s1} × ${s1}, not ${s1} × 2.`;
          if (c2[ans[2]] === String((s2 - c) * d)) return `You subtracted ${c} before multiplying. Do ${c} × ${d} first, then subtract.`;
          return `Finish with ${s2} − ${s3}. Multiplication happens before subtraction.`;
        },
      },
    };
  });

  G.define('e4_errorOrder', (r, o) => {
    const name = r.pick(NAMES);
    if (o.hard) {
      // left-to-right error: multiplied before dividing in A ÷ b × c + d²
      const b = r.int(2, 5),
        c = r.int(2, 4),
        m = r.int(2, 5),
        d = r.int(2, 5);
      const A = b * c * m;
      const text = `${A} ÷ ${b} × ${c} + ${PT(d, 2)}`;
      const val = (A / b) * c + sq(d);
      const bad = m + sq(d);
      const opts = [
        { html: `${name} multiplied ${b} × ${c} before dividing. Multiply and divide are done left to right, so ${A} ÷ ${b} comes first.`, ok: true },
        {
          html: `${name} should have squared ${d} before doing any multiplying or dividing.`,
          why: `${name} did square ${d} correctly, and that step does not change the answer here. The mistake is the order of ÷ and ×.`,
        },
        {
          html: `${name} should have added ${c} + ${PT(d, 2)} before multiplying by ${c}.`,
          why: `Addition comes after multiplication and division. Adding ${c} + ${PT(d, 2)} first would be a new mistake.`,
        },
        { html: `The work is correct, because multiplication always comes before division.`, why: `Multiplication does NOT always come first. × and ÷ have the same rank, so you work left to right.` },
      ];
      const sh = shuffleOptions(r, opts, 0);
      return {
        type: 'error',
        skill: 'order-ops',
        lesson: '6-4',
        title: 'Find the mistake',
        prompt: `<p>${name} evaluated ${hl(text)} for the sequencer. The line misfired.</p><p>What is the mistake?</p>`,
        work: `${text} = ${A} ÷ ${b * c} + ${sq(d)} = ${m} + ${sq(d)} = ${bad}`,
        options: sh.options,
        answer: sh.answer,
        fix: { label: 'The correct value is', answer: val },
        hints: [
          'Check the order. Multiply and divide have the same rank, so do them from left to right, in the order they appear.',
          `Reading left to right, ${A} ÷ ${b} comes before × ${c}.`,
          `${A} ÷ ${b} = ${A / b}. Then multiply by ${c}, and add ${PT(d, 2)} = ${sq(d)} last.`,
        ],
        hintEs: 'Revisa el orden. Multiplicar y dividir tienen el mismo nivel, así que se hacen de izquierda a derecha, en el orden en que aparecen.',
        solution: `<p>${name} multiplied ${b} × ${c} first. Working left to right: ${A} ÷ ${b} = ${A / b}, then ${A / b} × ${c} = ${(A / b) * c}, then ${(A / b) * c} + ${sq(d)} = <b>${val}</b>.</p>`,
        feedback: {
          correct: `Correct. Left to right: ${A} ÷ ${b} × ${c} = ${(A / b) * c}, plus ${sq(d)} = ${val}.`,
          wrong(ans, dt) {
            if (!dt.mistakeOk) return (sh.options[ans.mistake] && sh.options[ans.mistake].why) || 'Compare each step with the order of operations.';
            const v = parseNum(ans.fix);
            if (v === bad) return `That repeats ${name}'s answer. Divide ${A} ÷ ${b} first.`;
            if (v === (A / b) * c + d * 2) return `The order is right now, but ${PT(d, 2)} is ${d} × ${d}, not ${d} × 2.`;
            return `You found the mistake. For the fix: ${A} ÷ ${b}, then × ${c}, then add ${sq(d)}.`;
          },
        },
      };
    }
    const a = r.int(2, 9),
      b = r.int(3, 5), // b ≥ 3 so that b × 2 is never equal to b × b
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
      hintEs: 'Revisa el orden: símbolos de agrupación, exponentes, multiplicar/dividir y sumar/restar. Luego revisa cada potencia.',
      solution: `<p>${kind === 'addFirst' ? `${name} added before handling the exponent and the multiplication.` : `${name} multiplied the base by the exponent instead of squaring.`} Correct work: ${text} = ${a} + ${sq(b)} × ${c} = ${a} + ${sq(b) * c} = <b>${val}</b>.</p>`,
      feedback: {
        correct: `Correct. ${text} = ${a} + ${sq(b) * c} = ${val}.`,
        wrong(ans, dt) {
          if (!dt.mistakeOk) return (sh.options[ans.mistake] && sh.options[ans.mistake].why) || 'Compare each step with the order of operations.';
          const v = parseNum(ans.fix);
          if (v === sq(a + b) * c || v === a + b * 2 * c) return `That repeats ${name}'s answer. Square ${b} first, multiply by ${c}, then add ${a}.`;
          return `You found the mistake. For the fix: ${PT(b, 2)} = ${sq(b)}, then ${sq(b)} × ${c}, then add ${a}.`;
        },
      },
    };
  });

  G.define('e4_tableEval', (r, o) => {
    const hard = !!o.hard;
    const a = r.int(2, hard ? 5 : 6),
      b = r.int(hard ? 2 : 1, hard ? 4 : 5),
      c = hard ? r.pick([2, 3, 5].filter((x) => x !== a && x !== b)) : 2;
    // hard: three numbers, so the grouping choices multiply
    const exprs = hard
      ? [
          [`${a} + ${b} × ${PT(c, 2)}`, a + b * sq(c)],
          [`(${a} + ${b}) × ${PT(c, 2)}`, (a + b) * sq(c)],
          [`(${a} + ${b} × ${c})${U.supText(2)}`, sq(a + b * c)],
          [`${a} × (${b} + ${c})${U.supText(2)}`, a * sq(b + c)],
        ]
      : [
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
      prompt: hard
        ? `<p>Four sequencer cards use the same numbers, ${hl(a)}, ${hl(b)}, and ${hl(c)}, but group them differently. Complete the table of values.</p>`
        : `<p>Four sequencer cards use the same numbers, ${hl(a)} and ${hl(b)}, but group them differently. Complete the table of values.</p>`,
      rows,
      header: true,
      inputs,
      hints: [
        'Grouping symbols first, then exponents, then multiply, then add.',
        hard
          ? `${PT(c, 2)} = ${sq(c)}. In (${a} + ${b} × ${c})${U.supText(2)}, multiply inside the parentheses, then add, then square.`
          : `${PT(b, 2)} = ${sq(b)} and ${PT(a, 2)} = ${sq(a)}. In (${a} + ${b})${U.supText(2)}, add first and then square.`,
        `${exprs
          .slice(0, 3)
          .map(([t, v]) => `${t} = ${v}`)
          .join('; ')}. One row remains.`,
      ],
      hintEs: 'Primero los símbolos de agrupación, luego los exponentes, luego multiplica y al final suma.',
      solution: `<p>${exprs.map(([t, v]) => `${t} = <b>${v}</b>`).join('; ')}. The parentheses change which operation happens first, so the same two numbers give different values.</p>`,
      feedback: {
        correct: 'Correct. Parentheses change the order, and the order changes the value.',
        wrong(ans, dt) {
          const w = (dt.wrong || [])[0];
          const typed = parseNum((ans || {})[w]);
          if (hard) {
            if (w === 'v0')
              return typed === (a + b) * sq(c)
                ? `You added ${a} + ${b} first. Without parentheses, ${b} × ${PT(c, 2)} comes before adding.`
                : `For ${exprs[0][0]}, square ${c}, multiply by ${b}, then add ${a}.`;
            if (w === 'v1') return `For ${exprs[1][0]}, add inside the parentheses first, then multiply by ${PT(c, 2)} = ${sq(c)}.`;
            if (w === 'v2')
              return typed === sq((a + b) * c)
                ? `Inside the parentheses, multiply ${b} × ${c} before adding ${a}. Then square the result.`
                : `For ${exprs[2][0]}, find ${a} + ${b} × ${c} first (multiply, then add), then square it.`;
            return `For ${exprs[3][0]}, add ${b} + ${c}, square the sum, then multiply by ${a}.`;
          }
          if (w === 'v1')
            return typed === sq(a) + sq(b)
              ? `Add first, then square: (${a} + ${b})${U.supText(2)} is not ${PT(a, 2)} + ${PT(b, 2)}.`
              : `For (${a} + ${b})${U.supText(2)}, add inside the parentheses first, then square the sum.`;
          if (w === 'v0') return `For ${a} + ${PT(b, 2)}, square ${b} first (${b} × ${b}), then add ${a}.`;
          if (w === 'v3') return `For ${a} × ${PT(b, 2)}, square ${b} first, then multiply by ${a}.`;
          return `For ${PT(a, 2)} + ${PT(b, 2)}, square each number, then add.`;
        },
      },
    };
  });
})(typeof window !== 'undefined' ? window : globalThis);

/* js/units/u6/gen-algebraic-lib.js */
/* Zone 5 — The Expression Plates. Lesson 6-5 Write and Evaluate Algebraic Expressions. */
/* Shared helpers for gen-algebraic.js and gen-algebraic-2.js (split for size). */
(function (root) {
  'use strict';
  const RX = root.RX;
  const { G, V, round, fmt, shuffleOptions, NAMES, parseNum } = RX;
  const U = RX.U6;
  const hl = V.hl;
  const PT = U.powText;
  const VARS = ['n', 'x', 'm', 'k', 'p'];
  const sq = (x) => x * x;
  const SQ = U.supText(2);
  /** A second variable that differs from v. */
  const other = (v) => (v === 'y' ? 'x' : v === 'x' ? 'y' : 'w');

  /** Word phrases → algebraic expressions. Returns { words, text, value(x, y), wrong:[{text, why}] }. */
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
        text: `${v}${SQ} − ${c}`,
        value: (x) => sq(x) - c,
        wrong: [
          { text: `2${v} − ${c}`, why: `"The square of ${v}" is ${v} × ${v}, written ${v}², not 2${v}.` },
          { text: `(${v} − ${c})${SQ}`, why: `Only ${v} is squared. ${c} is subtracted after squaring.` },
          { text: `${c} − ${v}${SQ}`, why: `"Decreased by ${c}" means subtract ${c} from the square. The order flips.` },
        ],
      };
    },
  ];

  /** Harder phrases: nested grouping, two variables, or a squared sum. */
  const ALG_HARD = [
    (r, v) => {
      const k = r.int(2, 6),
        c = r.int(1, 6),
        d = r.int(2, 9);
      return {
        words: `${k} times the difference of a number ${v} and ${c}, plus ${d}`,
        text: `${k}(${v} − ${c}) + ${d}`,
        value: (x) => k * (x - c) + d,
        wrong: [
          { text: `${k}${v} − ${c} + ${d}`, why: `${k} multiplies the whole difference ${v} − ${c}, so the difference needs parentheses.` },
          { text: `${k}(${v} − ${c} + ${d})`, why: `${d} is added after multiplying. It belongs outside the parentheses.` },
          { text: `${k}(${c} − ${v}) + ${d}`, why: `"The difference of ${v} and ${c}" starts with ${v}: ${v} − ${c}.` },
        ],
      };
    },
    (r, v) => {
      const w = other(v);
      const c = r.int(2, 9);
      return {
        words: `${c} less than the product of a number ${v} and a number ${w}`,
        text: `${v}${w} − ${c}`,
        value: (x, y) => x * y - c,
        wrong: [
          { text: `${c} − ${v}${w}`, why: `"${c} less than" the product starts with the product and subtracts ${c}.` },
          { text: `${v} + ${w} − ${c}`, why: `"Product" means multiply ${v} and ${w}. Writing them side by side shows the multiplication.` },
          { text: `${v}(${w} − ${c})`, why: `${c} is subtracted from the whole product ${v}${w}, not from ${w} before multiplying.` },
        ],
      };
    },
    (r, v) => {
      const w = other(v);
      const k = r.int(2, 6);
      let m = r.int(2, 9);
      if (m === k) m += 1;
      return {
        words: `the sum of ${k} times a number ${v} and ${m} times a number ${w}`,
        text: `${k}${v} + ${m}${w}`,
        value: (x, y) => k * x + m * y,
        wrong: [
          { text: `${m}${v} + ${k}${w}`, why: `The coefficients are swapped. ${k} multiplies ${v}, and ${m} multiplies ${w}.` },
          { text: `${k}${v} + ${m} + ${w}`, why: `"${m} times a number ${w}" means multiply: ${m}${w}, not ${m} + ${w}.` },
          { text: `${k}(${v} + ${m}${w})`, why: `${k} multiplies only ${v}. The two products are added at the end.` },
        ],
      };
    },
    (r, v) => {
      const c = r.int(2, 9);
      return {
        words: `the square of the sum of a number ${v} and ${c}`,
        text: `(${v} + ${c})${SQ}`,
        value: (x) => sq(x + c),
        wrong: [
          { text: `${v}${SQ} + ${c}`, why: `The whole sum is squared, so ${v} + ${c} needs parentheses before the exponent.` },
          { text: `${v} + ${c}${SQ}`, why: `That squares only ${c}. "The square of the sum" squares ${v} + ${c} together.` },
          { text: `2(${v} + ${c})`, why: `Squaring means multiplying the sum by itself, not by 2.` },
        ],
      };
    },
    (r, v) => {
      const d = r.pick([2, 3, 4, 5]);
      const k = r.pick([2, 3, 4, 5, 6, 7].filter((x) => x !== d));
      return {
        words: `the quotient of ${k} times a number ${v} and ${d}`,
        text: `${k}${v} ÷ ${d}`,
        value: (x) => (k * x) / d,
        wrong: [
          { text: `${d} ÷ ${k}${v}`, why: `"The quotient of ${k}${v} and ${d}" puts ${k}${v} first. It is divided by ${d}.` },
          { text: `${k}(${v} + ${d})`, why: `"Quotient" means divide, not add.` },
          { text: `${k} ÷ ${d}${v}`, why: `${k} multiplies ${v} first. The product ${k}${v} is what gets divided by ${d}.` },
        ],
      };
    },
  ];
  const alg = (r, v, hard) => r.pick(hard ? ALG_HARD : ALG)(r, v);

  // ---------- Words → algebraic expression (mc) ----------
  // ---------- Story → expression and meaning of the parts (cloze) ----------
  const STORE = [
    { item: 'gear', unitPlural: 'gears', fee: 'delivery fee', v: 'g', es: 'los engranajes', cuantos: 'cuántos' },
    { item: 'ticket', unitPlural: 'tickets', fee: 'booking fee', v: 't', es: 'los boletos', cuantos: 'cuántos' },
    { item: 'brass rod', unitPlural: 'brass rods', fee: 'cutting fee', v: 'r', es: 'las varillas de latón', cuantos: 'cuántas' },
    { item: 'oil can', unitPlural: 'oil cans', fee: 'handling fee', v: 'c', es: 'las latas de aceite', cuantos: 'cuántas' },
  ];
  // ---------- Sort the parts of an expression (sort) ----------
  // ---------- Select every term (ms) ----------
  /** Expression for evaluating: returns { text, f(x), subStr(x), step1(x) }. hard adds a second variable or an exponent. */
  function evalExpr(r, v, hard) {
    if (!hard) {
      const k = r.int(2, 9),
        c = r.int(1, 15);
      if (r.chance(0.5))
        return {
          text: `${k}${v} + ${c}`,
          lead: `${k}${v}`,
          leadMeans: `${k} × ${v}`,
          f: (x) => k * x + c,
          sub: (x) => `${k}(${x}) + ${c}`,
          step: (x) => `${k * x} + ${c}`,
          concat: (x) => Number(String(k) + String(x)) + c,
          addInstead: (x) => k + x + c,
        };
      const cc = r.int(1, 9);
      return {
        text: `${k}${v} − ${cc}`,
        lead: `${k}${v}`,
        leadMeans: `${k} × ${v}`,
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
        text: `${k}${v}${SQ} − ${c}`,
        lead: `${k}${v}${SQ}`,
        leadMeans: `${k} × ${v} × ${v}`,
        f: (x) => k * sq(x) - c,
        sub: (x) => `${k}(${x})${SQ} − ${c}`,
        step: (x) => `${k} × ${sq(x)} − ${c}`,
        concat: (x) => sq(k * x) - c,
        addInstead: (x) => k * x * 2 - c,
      };
    const w = v === 'x' ? 'y' : 'x';
    const m = r.int(2, 6);
    return {
      text: `${k}${v} + ${m}${w}`,
      lead: `${k}${v}`,
      leadMeans: `${k} × ${v}`,
      two: w,
      f: (x, y) => k * x + m * y,
      sub: (x, y) => `${k}(${x}) + ${m}(${y})`,
      step: (x, y) => `${k * x} + ${m * y}`,
      concat: (x, y) => Number(String(k) + String(x)) + Number(String(m) + String(y)),
      addInstead: (x, y) => k + x + m + y,
      swapped: (x, y) => k * y + m * x,
    };
  }

  // ---------- Evaluate an algebraic expression (num) ----------
  // ---------- Input-output table (table) ----------
  // ---------- Error: substituted incorrectly (error) ----------
  // ---------- Evaluate with fraction or decimal values (num) ----------
  RX._lib = RX._lib || {};
  RX._lib['u6/gen-algebraic'] = { G, V, round, fmt, shuffleOptions, NAMES, parseNum, U, hl, PT, VARS, sq, SQ, other, ALG, ALG_HARD, alg, STORE, evalExpr };
})(typeof window !== 'undefined' ? window : globalThis);

/* js/units/u6/gen-algebraic.js */
/* Zone 5 — The Expression Plates. Lesson 6-5 Write and Evaluate Algebraic Expressions. */
(function (root) {
  'use strict';
  const RX = root.RX;
  const { G, V, round, fmt, shuffleOptions, NAMES, parseNum, U, hl, PT, VARS, sq, SQ, other, ALG, ALG_HARD, alg, STORE, evalExpr } = RX._lib['u6/gen-algebraic'];

  G.define('e5_wordsToAlg', (r, o) => {
    const hard = !!o.hard;
    const v = r.pick(VARS);
    const p = alg(r, v, hard);
    const name = r.pick(NAMES);
    const opts = [{ html: p.text, ok: true }].concat(p.wrong.map((w) => ({ html: w.text, why: w.why })));
    const sh = shuffleOptions(r, opts, 0);
    const twoVar = p.value.length === 2;
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
        '"Less than" and "decreased by" flip the order. "The sum of ..." or "the difference of ..." names one quantity and needs parentheses if something is done to all of it.',
        `A number written next to a variable, or next to parentheses, means multiply. The correct expression has the value ${round(p.value(3, 2), 2)} when ${v} = 3${twoVar ? ` and ${other(v)} = 2` : ''}.`,
      ],
      hintEs: `La variable ${v} representa el número desconocido. Cambia cada palabra de operación por un símbolo: más que (+), menos que (−), veces (×), cociente (÷), el cuadrado (exponente 2).`,
      solution: `<p>"${p.words}" is <b>${p.text}</b>. Writing a number next to the variable means multiplication, and the order of the words tells you the order of the operations.</p>`,
      feedback: { correct: `Correct. "${p.words}" = ${p.text}.`, wrong: U.whyWrong(sh.options, 'Turn each operation word into a symbol, and group any quantity the words name as a whole.') },
    };
  });

  G.define('e5_storyCloze', (r, o) => {
    const hard = !!o.hard;
    const name = r.pick(NAMES);
    const k = r.int(2, 9),
      f = r.int(1, 12) * (r.chance(0.5) ? 1 : 5);
    if (hard) {
      // two items, two variables, plus a one-time fee
      const [A, Bq] = r.pickN(STORE, 2);
      let m = r.int(2, 9);
      if (m === k) m = k === 9 ? 8 : k + 1;
      const right = `${k}${A.v} + ${m}${Bq.v} + ${f}`;
      const exprs = r.shuffle([right, `${k + m}(${A.v} + ${Bq.v}) + ${f}`, `${m}${A.v} + ${k}${Bq.v} + ${f}`, `${k}${A.v} + ${m}${Bq.v} + ${f}${A.v}`]);
      const coefMeans = r.shuffle([`the cost of one ${Bq.item}`, `the number of ${Bq.unitPlural}`, 'the total cost']);
      const totals = r.shuffle([String(k * 2 + m * 3 + f), String(k * 3 + m * 2 + f), String((k + m) * 5 + f)].filter((v, i, arr) => arr.indexOf(v) === i));
      while (totals.length < 3) totals.push(String(k * 2 + m * 3));
      return {
        type: 'cloze',
        skill: 'write-algebraic',
        lesson: '6-5',
        title: 'Build the expression from the story',
        prompt: `<p>${name} places one order. Each ${A.item} costs ${hl('$' + k)}, each ${Bq.item} costs ${hl('$' + m)}, and there is a one-time ${A.fee} of ${hl('$' + f)}.</p><p>Let ${A.v} be the number of ${A.unitPlural} and ${Bq.v} the number of ${Bq.unitPlural}. Complete the sentences.</p>`,
        template: `The total cost in dollars is {0}.  The coefficient ${m} stands for {1}.  For 2 ${A.unitPlural} and 3 ${Bq.unitPlural}, the total is {2} dollars.`,
        choices: [exprs, coefMeans, totals],
        answers: [exprs.indexOf(right), coefMeans.indexOf(`the cost of one ${Bq.item}`), totals.indexOf(String(k * 2 + m * 3 + f))],
        hints: [
          `Each price multiplies its own variable: ${k} goes with ${A.v} and ${m} goes with ${Bq.v}. The fee is added once.`,
          `A coefficient is the number multiplied by a variable. ${m} multiplies the number of ${Bq.unitPlural}, so it is a price.`,
          `Substitute ${A.v} = 2 and ${Bq.v} = 3. Multiply each coefficient by its value, then add the fee.`,
        ],
        hintEs: `Cada precio multiplica a su propia variable: ${k} va con ${A.v} y ${m} va con ${Bq.v}. La tarifa se suma una sola vez.`,
        solution: `<p>Total cost = <b>${right}</b>. The coefficient ${m} is <b>the cost of one ${Bq.item}</b>. For 2 ${A.unitPlural} and 3 ${Bq.unitPlural}: ${k}(2) + ${m}(3) + ${f} = ${k * 2} + ${m * 3} + ${f} = <b>${k * 2 + m * 3 + f}</b> dollars.</p>`,
        feedback: {
          correct: `Correct. ${right}: each price is a coefficient, and the fee is the constant.`,
          wrong(ans, dt) {
            if (dt.wrong.includes(0))
              return exprs[ans[0]] === `${m}${A.v} + ${k}${Bq.v} + ${f}`
                ? `The prices are on the wrong variables. ${k} is the price of a ${A.item}, so it multiplies ${A.v}.`
                : `Multiply each price by its own variable, then add the fee once.`;
            if (dt.wrong.includes(1)) return `${m} multiplies ${Bq.v}, the number of ${Bq.unitPlural}. A number multiplied by a count is the price of one.`;
            return totals[ans[2]] === String(k * 3 + m * 2 + f) ? `You swapped the values. ${A.v} = 2 and ${Bq.v} = 3.` : `Substitute: ${k}(2) + ${m}(3) + ${f}. Multiply first, then add.`;
          },
        },
      };
    }
    const ctx = r.pick(STORE);
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
        `The constant is the number that does not change when ${v} changes: the fee.`,
      ],
      hintEs: `El costo de ${ctx.es} depende de ${ctx.cuantos} se piden, así que multiplica ${k} por ${v}. La tarifa se suma una sola vez.`,
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

  G.define('e5_sortParts', (r, o) => {
    const hard = !!o.hard;
    const [v1, v2] = r.pickN(VARS, 2);
    // all numbers distinct so every item is unique
    const nums = r.pickN([2, 3, 4, 5, 6, 7, 8, 9], 2);
    const [a, b] = nums;
    const c = r.int(10, 25);
    const c2 = hard ? r.pick([11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30].filter((x) => x !== c)) : null;
    // hard: one term carries an exponent, and there are two constants
    const t1 = hard ? `${a}${v1}${SQ}` : `${a}${v1}`;
    const expr = hard ? `${t1} + ${c} + ${b}${v2} + ${c2}` : `${t1} + ${b}${v2} + ${c}`;
    const items = r.shuffle([
      { html: t1, bin: 0 },
      { html: `${b}${v2}`, bin: 0 },
      { html: String(c), bin: 1 },
      ...(hard ? [{ html: String(c2), bin: 1 }] : []),
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
        hard ? `${expr} has four terms. The ones without a letter are constants.` : `${expr} has three terms: ${a}${v1}, ${b}${v2}, and ${c}. The one without a letter is the constant.`,
        hard
          ? `In ${t1}, the coefficient is ${a} and the variable is ${v1}; the exponent 2 belongs to ${v1} only.`
          : `In ${a}${v1}, the coefficient is ${a} and the variable is ${v1}. The same idea works for ${b}${v2}.`,
      ],
      hintEs: 'Los términos son las partes separadas por + o −. Un término con una letra tiene un coeficiente (el número) y una variable (la letra).',
      solution: `<p>Terms with a variable: <b>${t1}</b> and <b>${b}${v2}</b>. Constant term${hard ? 's' : ''}: <b>${c}</b>${hard ? ` and <b>${c2}</b>` : ''}. Coefficients: <b>${a}</b> and <b>${b}</b>, the numbers multiplied by the variables. Variables: <b>${v1}</b> and <b>${v2}</b>. A constant has no variable, so it has no coefficient.${
        hard ? ` In ${t1}, the coefficient is ${a}, not ${a * a}: only ${v1} is squared.` : ''
      }</p>`,
      feedback: {
        correct: 'Correct. Terms are separated by + or −; inside a variable term, the number is the coefficient and the letter is the variable.',
        wrong(ans, dt) {
          const it = items[(dt.wrong || [])[0]];
          if (!it) return 'Split the expression at each + sign to find the terms first.';
          if (it.bin === 0) return `${it.html} is a whole term: a number times a variable. It is separated from the rest by a + sign.`;
          if (it.bin === 1) return `${it.html} stands alone with no variable, so it is a constant term.`;
          if (it.bin === 2) return `${it.html} is multiplied by a variable in one of the terms, so it is a coefficient.`;
          return `${it.html} is a letter that stands for a number: a variable.`;
        },
      },
    };
  });

  G.define('e5_selectTerms', (r, o) => {
    const hard = !!o.hard;
    const [v1, v2] = r.pickN(VARS, 2);
    let a = r.int(2, 9),
      b = r.int(2, 9),
      c = r.int(1, 9);
    if (b === a) b = a === 9 ? 8 : a + 1;
    if (c === a || c === b) c = c === 9 ? 1 : c + 1;
    if (c === a || c === b) c = c === 9 ? 1 : c + 1;
    const minus = r.chance(0.5);
    if (hard) {
      // four terms: a two-variable term, a lone variable (coefficient 1), a constant, and a variable term
      const expr = `${a}${v1}${v2} + ${v1} ${minus ? '−' : '+'} ${c} + ${b}${v2}`;
      const opts = [
        { html: `${a}${v1}${v2}`, ok: true },
        { html: v1, ok: true },
        { html: String(c), ok: true },
        { html: `${b}${v2}`, ok: true },
        { html: `${a}${v1}`, why: `${a}${v1}${v2} is ONE term: ${a} × ${v1} × ${v2}. You cannot split a product into separate terms.` },
        { html: `${v1} ${minus ? '−' : '+'} ${c}`, why: `That is two terms joined by ${minus ? '−' : '+'}. A single term has no + or − inside it.` },
      ];
      const sh = shuffleOptions(r, opts, [0, 1, 2, 3]);
      return {
        type: 'ms',
        skill: 'parts-expression',
        lesson: '6-5',
        title: 'Select every term',
        prompt: `<p>The plate reads ${hl(expr)}.</p><p>Select <b>every term</b> of the expression.</p>`,
        options: sh.options,
        answers: sh.answers,
        hints: [
          'Split the expression at each + or − sign. Each piece is one term, even a variable with no number in front of it.',
          `${expr} splits into four pieces. A product of numbers and letters, like ${a}${v1}${v2}, stays together as one term.`,
          `A coefficient alone, or a piece with a + or − inside it, is not a single term.`,
        ],
        hintEs: 'Separa la expresión en cada signo + o −. Cada parte es un término, aunque sea una variable sin número delante.',
        solution: `<p>The four terms are <b>${a}${v1}${v2}</b>, <b>${v1}</b>, <b>${c}</b>, and <b>${b}${v2}</b>. The term ${v1} has coefficient 1. ${a}${v1} is only part of the term ${a}${v1}${v2}, ${b} is a coefficient, and ${v1} ${minus ? '−' : '+'} ${c} is two terms.</p>`,
        feedback: {
          correct: `Correct. ${expr} has exactly four terms.`,
          wrong(ans, dt) {
            if (dt.extra && dt.extra.length) return sh.options[dt.extra[0]].why || 'That is not a whole term.';
            const missed = (dt.missing || []).map((i) => sh.options[i].html);
            if (missed.includes(v1)) return `A variable alone is a term too. ${v1} means 1${v1}.`;
            return `You missed a term. Split ${expr} at every + or − sign: there are four pieces.`;
          },
        },
      };
    }
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
        `A coefficient or a variable alone is only part of a term. A piece with a + inside it is two terms.`,
      ],
      hintEs: 'Separa la expresión en cada signo + o −. Cada parte es un término.',
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
})(typeof window !== 'undefined' ? window : globalThis);

/* js/units/u6/gen-algebraic-2.js */
/* Zone 5 — The Expression Plates. Lesson 6-5 Write and Evaluate Algebraic Expressions. */
(function (root) {
  'use strict';
  const RX = root.RX;
  const { G, V, round, fmt, shuffleOptions, NAMES, parseNum, U, hl, PT, VARS, sq, SQ, other, ALG, ALG_HARD, alg, STORE, evalExpr } = RX._lib['u6/gen-algebraic'];

  G.define('e5_evaluate', (r, o) => {
    const hard = !!o.hard;
    const v = r.pick(VARS);
    const ex = evalExpr(r, v, hard);
    const x = hard ? r.int(2, 9) : r.int(2, 12);
    let y = r.int(2, 9);
    if (ex.two && y === x) y = x === 9 ? 8 : x + 1;
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
        `Substitute: replace each variable with its value. Writing a number next to a variable means multiply, so ${ex.lead} means ${ex.leadMeans}.`,
        `${ex.two ? ex.sub(x, y) : ex.sub(x)}. Use parentheses when you substitute so you do not lose the multiplication.`,
        `${ex.two ? ex.step(x, y) : ex.step(x)}. One step left.`,
      ],
      hintEs: `Sustituye: cambia cada variable por su valor. Un número escrito junto a una variable significa multiplicar, así que ${ex.lead} significa ${ex.leadMeans}.`,
      solution: `<p>Substitute ${given} into ${ex.text}: ${ex.two ? ex.sub(x, y) : ex.sub(x)} = ${ex.two ? ex.step(x, y) : ex.step(x)} = <b>${val}</b>. Multiply before adding or subtracting, and evaluate any exponent first.</p>`,
      feedback: {
        correct: `Correct. ${ex.two ? ex.sub(x, y) : ex.sub(x)} = ${val}.`,
        wrong(ans, dt) {
          const w = dt.value;
          const concat = ex.two ? ex.concat(x, y) : ex.concat(x);
          const addI = ex.two ? ex.addInstead(x, y) : ex.addInstead(x);
          if (w === concat)
            return hard && !ex.two
              ? `Square only the variable: ${v}${SQ} = ${x} × ${x} = ${sq(x)}. Then multiply by the coefficient.`
              : `Writing ${x} next to the coefficient does not make a bigger number. A number beside a variable means multiply.`;
          if (w === addI) return `A coefficient multiplies the variable. ${ex.lead} means ${ex.leadMeans}, not addition.`;
          if (ex.two && w === ex.swapped(x, y)) return `You swapped the values. ${v} = ${x} goes with ${v}, and ${ex.two} = ${y} goes with ${ex.two}.`;
          return `Replace ${v} with ${x}${ex.two ? ` and ${ex.two} with ${y}` : ''}, then ${hard && !ex.two ? 'square first, then ' : ''}multiply before you add or subtract.`;
        },
      },
    };
  });

  G.define('e5_tableEval', (r, o) => {
    const hard = !!o.hard;
    const v = r.pick(VARS);
    const k = r.int(2, 8),
      c = r.int(1, 10);
    const expr = `${k}${v} + ${c}`;
    const f = (x) => k * x + c;
    const name = r.pick(NAMES);
    const start = r.int(1, 4);
    const xs = hard ? [start, start + 3, start + 5] : [start, start + 1, start + 2, start + 4];
    const back = start + r.int(7, 9); // hard: work backward from an output
    const ctx = r.pick([
      `${name} earns $${k} per gear polished plus a $${c} daily bonus, so the day's pay is ${hl(expr)} dollars for ${v} gears.`,
      `A machine uses ${k} liters of oil per hour plus ${c} liters to start, so it uses ${hl(expr)} liters in ${v} hours.`,
      `Each crate holds ${k} parts and the cart holds ${c} loose parts, so the shipment has ${hl(expr)} parts with ${v} crates.`,
    ]);
    const rows = [[v, expr]];
    const inputs = [];
    xs.forEach((x, i) => {
      rows.push([String(x), `__IN:y${i}__`]);
      inputs.push({ id: `y${i}`, answer: f(x) });
    });
    if (hard) {
      rows.push([`__IN:x0__`, String(f(back))]);
      inputs.push({ id: 'x0', answer: back });
    }
    return {
      type: 'table',
      skill: 'evaluate-algebraic',
      lesson: '6-5',
      title: 'Complete the input-output table',
      prompt: hard
        ? `<p>${ctx}</p><p>Complete the table. In the last row the value of the expression is given: find the value of ${v} that produces it.</p>`
        : `<p>${ctx}</p><p>Complete the table by evaluating the expression for each value of ${v}.</p>`,
      rows,
      header: true,
      inputs,
      hints: [
        `Substitute each value of ${v} into ${expr}. Multiply by ${k} first, then add ${c}.`,
        `For ${v} = ${xs[0]}: ${k}(${xs[0]}) + ${c} = ${k * xs[0]} + ${c}.`,
        hard
          ? `For the last row, work backward from ${f(back)}: undo the + ${c} first, then undo the × ${k}.`
          : `${xs
              .slice(0, 3)
              .map((x) => `${v} = ${x} gives ${f(x)}`)
              .join('; ')}. One row remains.`,
      ],
      hintEs: `Sustituye cada valor de ${v} en ${expr}. Primero multiplica por ${k} y luego suma ${c}.`,
      solution: `<p>${xs.map((x) => `${k}(${x}) + ${c} = <b>${f(x)}</b>`).join('; ')}.${
        hard ? ` For the last row, ${f(back)} − ${c} = ${f(back) - c} and ${f(back) - c} ÷ ${k} = <b>${back}</b>; check: ${k}(${back}) + ${c} = ${f(back)}.` : ''
      } Each time ${v} goes up by 1, the value goes up by ${k}, the coefficient, because the constant ${c} never changes.</p>`,
      feedback: {
        correct: `Correct. Multiply by ${k}, then add ${c}${hard ? '; to go backward, subtract ' + c + ' and divide by ' + k : ''}.`,
        wrong(ans, dt) {
          const id = String((dt.wrong || [])[0] || 'y0');
          const typed = parseNum((ans || {})[id]);
          if (id === 'x0') {
            if (typed === (f(back) + c) / k || typed === f(back) / k - c) return `Undo the steps in reverse order: subtract ${c} first, then divide by ${k}.`;
            return `Which value of ${v} makes ${expr} equal ${f(back)}? Subtract ${c}, then divide by ${k}.`;
          }
          const i = Number(id.slice(1)) || 0;
          const x = xs[i];
          if (typed === k + x + c) return `For ${v} = ${x}: ${k}${v} means ${k} × ${x}, not ${k} + ${x}.`;
          if (typed === k * (x + c)) return `For ${v} = ${x}: multiply ${k} × ${x} first, then add ${c}.`;
          return `For ${v} = ${x}: ${k} × ${x} = ${k * x}, then add ${c}.`;
        },
      },
    };
  });

  G.define('e5_errorSubstitute', (r, o) => {
    const hard = !!o.hard;
    const name = r.pick(NAMES);
    const v = r.pick(VARS);
    const k = r.int(2, 9),
      c = r.int(1, 9),
      x = r.int(2, 9);
    const kind = hard ? r.pick(['orderAfter', 'swapVars']) : r.pick(['concat', 'add', 'square']);
    let expr, given, work, val, okText, alt, altWhy, h2, h3, fixStep, repeat;
    let kk = 0;
    if (kind === 'square') {
      kk = r.int(2, 4);
      expr = `${kk}${v}${SQ}`;
      work = `${expr} with ${v} = ${x}: (${kk} × ${x})${SQ} = ${PT(kk * x, 2)} = ${sq(kk * x)}`;
      val = kk * sq(x);
      repeat = sq(kk * x);
      okText = `${name} multiplied before squaring. The exponent belongs only to ${v}: ${kk}${v}² means ${kk} × ${v} × ${v}.`;
      alt = `${name} should have computed ${x}² as ${x} × 2.`;
      altWhy = `${x}² means ${x} × ${x} = ${sq(x)}. The exponent is a count of factors.`;
      h2 = `Only ${v} is squared. Square ${x} first, then multiply by the coefficient.`;
      h3 = `${x}² = ${sq(x)}. Then multiply by the coefficient.`;
      fixStep = `${kk}(${x})${SQ} = ${kk} × ${sq(x)} = <b>${val}</b>`;
    } else if (kind === 'concat') {
      expr = `${k}${v} + ${c}`;
      work = `${expr} with ${v} = ${x}: ${k}${x} + ${c} = ${Number(String(k) + String(x)) + c}`;
      val = k * x + c;
      repeat = Number(String(k) + String(x)) + c;
      okText = `${name} wrote ${x} next to ${k} and read it as the number ${k}${x}. A number beside a variable means multiply: ${k}(${x}).`;
      alt = `${name} should have added ${k} + ${x}.`;
      altWhy = `${k}${v} means ${k} times ${v}, not ${k} plus ${v}.`;
      h2 = `${k}(${x}) means ${k} × ${x} = ${k * x}.`;
      h3 = `${k * x} + ${c} = ?`;
      fixStep = `${k}(${x}) + ${c} = ${k * x} + ${c} = <b>${val}</b>`;
    } else if (kind === 'add') {
      expr = `${k}${v} + ${c}`;
      work = `${expr} with ${v} = ${x}: ${k} + ${x} + ${c} = ${k + x + c}`;
      val = k * x + c;
      repeat = k + x + c;
      okText = `${name} added the coefficient instead of multiplying. ${k}${v} means ${k} × ${v}.`;
      alt = `${name} should have written ${k}${x} as one number.`;
      altWhy = `Putting ${x} beside ${k} does not make the number ${k}${x}. The coefficient multiplies the value.`;
      h2 = `${k}(${x}) means ${k} × ${x} = ${k * x}.`;
      h3 = `${k * x} + ${c} = ?`;
      fixStep = `${k}(${x}) + ${c} = ${k * x} + ${c} = <b>${val}</b>`;
    } else if (kind === 'orderAfter') {
      // c + k·v: after substituting, the student added before multiplying
      const a = r.int(3, 12);
      expr = `${a} + ${k}${v}`;
      work = `${expr} with ${v} = ${x}: ${a} + ${k}(${x}) = ${a + k} × ${x} = ${(a + k) * x}`;
      val = a + k * x;
      repeat = (a + k) * x;
      okText = `${name} added ${a} + ${k} before multiplying. ${k}(${x}) must be multiplied first, then ${a} is added.`;
      alt = `${name} should have written ${k}(${x}) as the number ${k}${x}.`;
      altWhy = `A number beside parentheses means multiply. ${k}(${x}) is ${k} × ${x}.`;
      h2 = `${a} + ${k}(${x}): multiplication comes before addition.`;
      h3 = `${k} × ${x} = ${k * x}. Then add ${a}.`;
      fixStep = `${a} + ${k}(${x}) = ${a} + ${k * x} = <b>${val}</b>`;
    } else {
      // two variables: the values were put into the wrong variables
      const w = other(v);
      let m = r.int(2, 9);
      if (m === k) m = k === 9 ? 8 : k + 1;
      let y = r.int(2, 9);
      if (y === x) y = x === 9 ? 8 : x + 1;
      expr = `${k}${v} + ${m}${w}`;
      given = `${v} = ${x} and ${w} = ${y}`;
      work = `${expr} = ${k}(${y}) + ${m}(${x}) = ${k * y} + ${m * x} = ${k * y + m * x}`;
      val = k * x + m * y;
      repeat = k * y + m * x;
      okText = `${name} put ${y} in for ${v} and ${x} in for ${w}. Each value must replace its own variable.`;
      alt = `${name} should have added the coefficients first: (${k} + ${m}) times a value.`;
      altWhy = `${k}${v} and ${m}${w} are not like terms, so their coefficients cannot be combined.`;
      h2 = `${v} = ${x}, so ${k}${v} = ${k}(${x}). ${w} = ${y}, so ${m}${w} = ${m}(${y}).`;
      h3 = `${k * x} + ${m * y} = ?`;
      fixStep = `${k}(${x}) + ${m}(${y}) = ${k * x} + ${m * y} = <b>${val}</b>`;
    }
    given = given || `${v} = ${x}`;
    const opts = [
      { html: okText, ok: true },
      { html: alt, why: altWhy },
      {
        html: `${name} used the wrong order of operations at the start.`,
        why:
          kind === 'orderAfter'
            ? `The trouble is not at the start. ${name} substituted correctly; the mistake comes in the next step.`
            : `The order is not the problem here. Look at what ${name} did with the value of ${v}.`,
      },
      { html: 'The work is correct.', why: `It is not. Substituting correctly gives ${val}.` },
    ];
    if (kind === 'orderAfter') opts[2] = { html: `${name} substituted the wrong value for ${v}.`, why: `${name} used ${v} = ${x}, which is the given value. The problem is what was done with it.` };
    if (kind === 'concat' || kind === 'add' || kind === 'square')
      opts[2] = { html: `${name} substituted the wrong value for ${v}.`, why: `${name} used ${v} = ${x}, which is the given value. The problem is what was done with it.` };
    const sh = shuffleOptions(r, opts, 0);
    return {
      type: 'error',
      skill: 'evaluate-algebraic',
      lesson: '6-5',
      title: 'Find the mistake',
      prompt: `<p>${name} evaluated ${hl(expr)} when ${hl(given)}. The machine stalled.</p><p>What is the mistake?</p>`,
      work,
      options: sh.options,
      answer: sh.answer,
      fix: { label: 'The correct value is', answer: val },
      hints: ['When you substitute, put the value in parentheses. A coefficient next to parentheses means multiply.', h2, h3],
      hintEs: 'Cuando sustituyas, pon el valor entre paréntesis. Un coeficiente junto a un paréntesis significa multiplicar.',
      solution: `<p>${okText} Correct work: ${fixStep}.</p>`,
      feedback: {
        correct: `Correct. Substituting with parentheses keeps the multiplication: the value is ${val}.`,
        wrong(ans, dt) {
          if (!dt.mistakeOk) return (sh.options[ans.mistake] && sh.options[ans.mistake].why) || `Look at how ${name} replaced ${v} with ${x}.`;
          const t = parseNum(ans.fix);
          if (t === repeat) return `That repeats ${name}'s answer. Redo the work the correct way.`;
          return `You found the mistake. For the fix: ${fixStep.replace(/<\/?b>/g, '').replace(/ = [^=]*$/, '')}.`;
        },
      },
    };
  });

  G.define('e5_fracDecimal', (r, o) => {
    const hard = !!o.hard;
    const v = r.pick(VARS);
    const name = r.pick(NAMES);
    const kind = hard ? r.pick(['fracCoef', 'decDec', 'fracValue']) : r.pick(['halfCoef', 'decimalCoef', 'divide', 'decimalValue']);
    let expr, x, xText, val, sub, step, hintA, misread;
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
      hintA = `${x} ÷ ${d} is not a whole number. Write the quotient as a decimal.`;
      misread = { v: round(d / x + c, 2), msg: `The expression divides ${v} by ${d}, so compute ${x} ÷ ${d}, not ${d} ÷ ${x}.` };
    } else if (kind === 'decimalValue') {
      const k = r.int(2, 6),
        c = r.int(1, 9);
      x = r.int(1, 9) + 0.5;
      expr = `${k}${v} + ${c}`;
      val = round(k * x + c, 2);
      sub = `${k}(${x}) + ${c}`;
      step = `${round(k * x, 2)} + ${c}`;
      hintA = `${k} × ${x}: multiply ${k} × ${Math.floor(x)} and ${k} × 0.5, then add.`;
      misread = { v: round(k * Math.floor(x) + c, 2), msg: `You dropped the 0.5. ${k} × ${x} includes ${k} × 0.5 = ${k * 0.5}.` };
    } else if (kind === 'fracCoef') {
      // a non-unit fraction coefficient, then subtract
      const [a, b] = r.pick([
        [2, 3],
        [3, 4],
        [3, 5],
        [5, 6],
        [2, 5],
      ]);
      x = b * r.int(2, 6);
      const c = r.int(1, (a * x) / b - 1);
      expr = `${U.fracText(a, b)}${v} − ${c}`;
      val = (a * x) / b - c;
      sub = `${U.fracText(a, b)}(${x}) − ${c}`;
      step = `${(a * x) / b} − ${c}`;
      hintA = `${a}/${b} of ${x}: divide ${x} by ${b}, then multiply by ${a}.`;
      misread = { v: x / b - c, msg: `${x / b} is only 1/${b} of ${x}. The coefficient is ${a}/${b}, so multiply ${x / b} by ${a}.` };
    } else if (kind === 'decDec') {
      // decimal coefficient times a decimal value
      const k = r.pick([1.5, 2.5, 0.4, 1.2, 0.6]),
        c = r.int(1, 9);
      x = r.pick([2.5, 3.5, 1.5, 4.5, 2.4]);
      expr = `${k}${v} + ${c}`;
      val = round(k * x + c, 2);
      sub = `${k}(${x}) + ${c}`;
      step = `${round(k * x, 2)} + ${c}`;
      hintA = `${k} × ${x}: multiply as whole numbers, then count the decimal places in both factors.`;
      misread = { v: round(k * x * 10 + c, 2), msg: `Check the decimal point. ${k} and ${x} each have one decimal place, so their product has two.` };
    } else {
      // fraction value for the variable
      const [a, b] = r.pick([
        [1, 2],
        [3, 4],
        [2, 3],
        [1, 4],
        [2, 5],
      ]);
      const k = b * r.int(2, 5),
        c = r.int(1, 9);
      x = a / b;
      xText = U.fracText(a, b);
      expr = `${k}${v} + ${c}`;
      val = (k * a) / b + c;
      sub = `${k}(${xText}) + ${c}`;
      step = `${(k * a) / b} + ${c}`;
      hintA = `${k} × ${xText}: divide ${k} by ${b}, then multiply by ${a}.`;
      misread = { v: k + a / b + c, msg: `${k}${v} means ${k} × ${v}. Multiply ${k} by ${xText}; do not add them.` };
    }
    xText = xText || String(x);
    const ctx = r.pick([
      `A plate reads ${hl(expr)}. Today ${hl(v + ' = ' + xText)}.`,
      `${name} must evaluate ${hl(expr)} for ${hl(v + ' = ' + xText)}.`,
      `The gauge rule is ${hl(expr)}, and the reading is ${hl(v + ' = ' + xText)}.`,
    ]);
    return {
      type: 'num',
      skill: 'evaluate-algebraic',
      lesson: '6-5',
      title: 'Evaluate with a fraction or decimal',
      prompt: `<p>${ctx}</p><p>Evaluate the expression. Write a decimal if the answer is not a whole number.</p>`,
      answer: val,
      hints: [`Substitute ${xText} for ${v}: ${sub}.`, hintA, `${step} = ?`],
      hintEs: `Sustituye ${v} por ${xText}: ${sub}.`,
      solution: `<p>${sub} = ${step} = <b>${fmt(val)}</b>. Substitution works the same with fractions and decimals: replace the variable, multiply or divide first, then ${/−/.test(expr) ? 'subtract' : 'add'}.</p>`,
      feedback: {
        correct: `Correct. ${sub} = ${fmt(val)}.`,
        wrong(ans, dt) {
          const w = dt.value;
          if (w != null && Math.abs(w - misread.v) < 1e-6) return misread.msg;
          return `Substitute ${xText} for ${v}: ${sub}. Multiply or divide first, then ${/−/.test(expr) ? 'subtract' : 'add'}.`;
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
  const U = RX.U6;
  const hl = V.hl;
  const VARS = ['x', 'n', 'm', 'k', 'y'];
  const SQ = U.supText(2);
  const distinct = (arr) => arr.filter((x, i) => arr.indexOf(x) === i);
  /** A second variable different from v. */
  const other = (v) => (v === 'y' ? 'x' : 'y');
  /** Coefficient as written in front of a variable: 1 is not written. */
  const co = (n, v) => (n === 1 ? v : `${n}${v}`);

  // ---------- Combine like terms (blanks, template) ----------
  G.define('e6_combine', (r, o) => {
    const hard = !!o.hard;
    const v = r.pick(VARS);
    const w = other(v);
    const name = r.pick(NAMES);
    let text, c, cw, d, plusAll;
    if (!hard) {
      const a = r.int(2, 9),
        b = r.int(1, 9),
        e = r.int(1, 8),
        f = r.int(1, 9);
      text = `${a}${v} + ${b} + ${co(e, v)} + ${f}`;
      c = a + e;
      d = b + f;
      plusAll = c;
    } else {
      // two variables: three v-terms (one subtracted), two w-terms, two constants (one subtracted)
      const a = r.int(3, 9),
        e = r.int(1, 5),
        sub = r.int(1, Math.min(a + e - 1, 6));
      const p = r.int(2, 7),
        q = r.int(1, 5);
      const b = r.int(6, 15),
        f = r.int(1, 5);
      text = `${a}${v} + ${p}${w} + ${b} − ${co(sub, v)} + ${co(q, w)} − ${f} + ${co(e, v)}`;
      c = a - sub + e;
      cw = p + q;
      d = b - f;
      plusAll = a + sub + e; // treated the subtracted term as added
    }
    const fields = hard
      ? [
          { label: `coefficient of ${v}`, answer: c, width: 'xs' },
          { label: `coefficient of ${w}`, answer: cw, width: 'xs' },
          { label: 'constant', answer: d, width: 'xs' },
        ]
      : [
          { label: `coefficient of ${v}`, answer: c, width: 'xs' },
          { label: 'constant', answer: d, width: 'xs' },
        ];
    return {
      type: 'blanks',
      skill: 'like-terms',
      lesson: '6-6',
      title: hard ? 'Simplify (two variables, with subtraction)' : 'Combine like terms',
      prompt: `<p>${name} sets a plate that reads ${hl(text)}. The balance hall only accepts the simplest form.</p><p>Combine like terms and write the equivalent expression.</p>`,
      fields,
      template: hard ? `Simplest form: {0}${v} + {1}${w} + {2}` : `Simplest form: {0}${v} + {1}`,
      hints: [
        hard
          ? `Like terms have exactly the same variable part. The ${v}-terms go together, the ${w}-terms go together, and the plain numbers go together.`
          : `Like terms have exactly the same variable part. The ${v}-terms go together, and the plain numbers go together.`,
        `Add or subtract the coefficients of the ${v}-terms: ${text
          .split(/\s(?=[+−])/)
          .filter((t) => t.includes(v))
          .join(' ')}. A term with no number in front has a coefficient of 1. Watch the sign in front of each term.`,
        hard ? `The ${v}-terms combine to ${c}${v}. Now combine the ${w}-terms, then the constants.` : `The ${v}-terms combine to ${c}${v}. Now combine the constants.`,
      ],
      hintEs: hard
        ? `Los términos semejantes tienen exactamente la misma parte variable. Los términos con ${v} van juntos, los términos con ${w} van juntos y los números solos van juntos.`
        : `Los términos semejantes tienen exactamente la misma parte variable. Los términos con ${v} van juntos y los números solos van juntos.`,
      solution: hard
        ? `<p>${text} = <b>${c}${v} + ${cw}${w} + ${d}</b>. The ${v}-terms combine to ${c}${v}, the ${w}-terms to ${cw}${w}, and the constants to ${d}. A ${v}-term, a ${w}-term, and a constant are <b>not</b> like terms, so they stay separate.</p>`
        : `<p>${text} = <b>${c}${v} + ${d}</b>. The ${v}-terms combine to ${c}${v} and the constants combine to ${d}. A ${v}-term and a constant are <b>not</b> like terms, so they stay separate.</p>`,
      feedback: {
        correct: hard ? `Correct. ${text} = ${c}${v} + ${cw}${w} + ${d}.` : `Correct. ${text} = ${c}${v} + ${d}.`,
        wrong(ans) {
          const x = parseNum(ans[0]);
          const yw = hard ? parseNum(ans[1]) : null;
          const y = parseNum(ans[hard ? 2 : 1]);
          if (hard && x === c + cw) return `You combined ${v}-terms with ${w}-terms. ${v} and ${w} are different variables, so those terms are not like terms.`;
          if (x === c + d || y === c + d) return `You combined a ${v}-term with a constant. A term with a variable and a plain number are unlike terms and cannot be added.`;
          if (hard && x === plusAll && plusAll !== c) return `Check the signs. One ${v}-term is subtracted, so take its coefficient away instead of adding it.`;
          if (x === c && y !== d) return `The ${v}-term is right. Recheck the constants: combine only the plain numbers, and watch for subtraction.`;
          if (y === d && x !== c) return `The constant is right. Recheck the ${v}-terms: a lone ${v} counts as 1${v}, and watch the signs.`;
          if (hard && x === c && y === d && yw !== cw) return `Recheck the ${w}-terms. A lone ${w} has a coefficient of 1.`;
          return `Group the ${v}-terms and combine their coefficients. Then group the plain numbers.`;
        },
      },
    };
  });

  // ---------- Select all equivalent expressions (ms) ----------
  G.define('e6_equivSelect', (r, o) => {
    const hard = !!o.hard;
    const v = r.pick(VARS);
    if (hard) {
      // one v-term is subtracted
      const a = r.int(5, 9),
        e = r.int(1, a - 2),
        b = r.int(2, 9);
      const c = a - e;
      const text = `${a}${v} + ${b} − ${co(e, v)}`;
      const opts = [
        { html: `${c}${v} + ${b}`, ok: true },
        { html: `${b} + ${c}${v}`, ok: true },
        { html: `${a}${v} − ${co(e, v)} + ${b}`, ok: true },
        { html: `${a + e}${v} + ${b}`, why: `The ${co(e, v)} is subtracted, so take ${e} away from ${a}. Adding it ignores the minus sign.` },
        { html: `${a}${v} + ${b - e > 0 ? b - e : b + e}`, why: `${co(e, v)} is a ${v}-term, not a constant. It combines with ${a}${v}, not with ${b}.` },
        { html: `${c + b}${v}`, why: `That combines the constant ${b} with the ${v}-terms. ${b} has no variable, so it is not a like term.` },
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
          'Two expressions are equivalent if they have the same value for every value of the variable. Combining like terms or moving a term (with its sign) keeps an expression equivalent.',
          `Combine the ${v}-terms, keeping the minus sign with ${co(e, v)}. The constant ${b} stays a constant.`,
          `Find the simplest form first. Then look for every reordering that keeps each sign with its own term.`,
        ],
        hintEs:
          'Dos expresiones son equivalentes si tienen el mismo valor para cualquier valor de la variable. Combinar términos semejantes o mover un término (con su signo) mantiene la expresión equivalente.',
        solution: `<p>${text} simplifies to <b>${c}${v} + ${b}</b>. ${b} + ${c}${v} and ${a}${v} − ${co(e, v)} + ${b} are the same terms in a different order, so they are equivalent too. ${a + e}${v} + ${b} ignores the minus sign, and ${c + b}${v} joins a constant to a ${v}-term, so neither is equivalent.</p>`,
        feedback: {
          correct: 'Correct. Moving a term with its sign, and combining like terms, both keep expressions equivalent.',
          wrong(ans, dt) {
            if (dt.extra && dt.extra.length) return sh.options[dt.extra[0]].why || 'That expression is not equivalent. Test it with a value.';
            return `You missed one. A term can move as long as its sign moves with it. Look for another form of ${c}${v} + ${b}.`;
          },
        },
      };
    }
    const a = r.int(2, 6),
      e = r.int(1, 5),
      b = r.int(2, 9);
    const c = a + e;
    const text = `${a}${v} + ${b} + ${co(e, v)}`;
    const opts = [
      { html: `${c}${v} + ${b}`, ok: true },
      { html: `${b} + ${c}${v}`, ok: true },
      { html: `${a}${v} + ${co(e, v)} + ${b}`, ok: true },
      { html: `${c + b}${v}`, why: `That combines the constant ${b} with the ${v}-terms. ${b} has no variable, so it is not a like term.` },
      { html: `${c}${v} + ${b + e}`, why: `The ${e} in ${co(e, v)} is a coefficient. It joins the other ${v}-coefficient, not the constant.` },
      { html: `${a}${v} + ${b + e}`, why: `${co(e, v)} is a ${v}-term. Its coefficient adds to ${a}, not to the constant ${b}.` },
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
        `Combine the ${v}-terms: ${a}${v} + ${co(e, v)} = ${c}${v}. The constant ${b} stays a constant.`,
        `The simplest form is ${c}${v} + ${b}. Any reordering of its terms, or of the original terms, is also equivalent.`,
      ],
      hintEs:
        'Dos expresiones son equivalentes si tienen el mismo valor para cualquier valor de la variable. Combinar términos semejantes o cambiar el orden de los términos mantiene la expresión equivalente.',
      solution: `<p>${text} simplifies to <b>${c}${v} + ${b}</b>. Writing the terms in a different order (${b} + ${c}${v}, or ${a}${v} + ${co(e, v)} + ${b}) does not change the value, so those are equivalent too. Expressions that mix the constant into the ${v}-term, such as ${c + b}${v}, are not equivalent: test ${v} = 2 to see the values differ.</p>`,
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
  G.define('e6_errorUnlike', (r, o) => {
    const hard = !!o.hard;
    const name = r.pick(NAMES);
    const v = r.pick(VARS);
    if (hard) {
      // v² and v are not like terms
      const a = r.int(2, 6),
        e = r.int(2, 7),
        b = r.int(1, 9);
      const text = `${a}${v}${SQ} + ${e}${v} + ${b}`;
      const t = 2;
      const val = a * t * t + e * t + b;
      const bad = (a + e) * t * t + b;
      const opts = [
        { html: `${name} combined ${a}${v}${SQ} and ${e}${v}. They are not like terms, because ${v}${SQ} and ${v} are different variable parts.`, ok: true },
        { html: `${name} should have combined ${e}${v} and ${b} into ${e + b}${v} instead.`, why: `${b} is a constant. A constant never combines with a ${v}-term.` },
        { html: `${name} should have multiplied the coefficients ${a} and ${e} to get ${a * e}${v}${SQ}.`, why: `Unlike terms cannot be combined at all, by adding or by multiplying.` },
        {
          html: `The work is correct, because ${a}${v}${SQ} and ${e}${v} both use the same letter ${v}.`,
          why: `Using the same letter is not enough. Like terms need the same variable part, including the exponent.`,
        },
      ];
      const sh = shuffleOptions(r, opts, 0);
      return {
        type: 'error',
        skill: 'like-terms',
        lesson: '6-6',
        title: 'Find the mistake',
        prompt: `<p>${name} simplified ${hl(text)} and the balance tipped.</p><p>What is the mistake? Then test the original expression at ${hl(v + ' = ' + t)}.</p>`,
        work: `${text} = ${a + e}${v}${SQ} + ${b}`,
        options: sh.options,
        answer: sh.answer,
        fix: { label: `The value of ${text} at ${v} = ${t} is`, answer: val },
        hints: [
          `Like terms need exactly the same variable part, including the exponent. Is ${v}${SQ} the same as ${v}?`,
          `${v}${SQ} means ${v} × ${v}. At ${v} = ${t}, ${v}${SQ} = ${t * t} but ${v} = ${t}.`,
          `Substitute ${t}: ${a}(${t * t}) + ${e}(${t}) + ${b}. Multiply, then add.`,
        ],
        hintEs: `Los términos semejantes necesitan exactamente la misma parte variable, incluido el exponente. ¿Es ${v}${SQ} lo mismo que ${v}?`,
        solution: `<p>${a}${v}${SQ} and ${e}${v} are not like terms, so ${text} is already in simplest form. At ${v} = ${t}: ${a}(${t * t}) + ${e}(${t}) + ${b} = ${a * t * t} + ${e * t} + ${b} = <b>${val}</b>. ${name}'s form gives ${bad} instead, which proves the two are not equivalent.</p>`,
        feedback: {
          correct: `Correct. ${v}${SQ} and ${v} are unlike terms, and the original has the value ${val} at ${v} = ${t}.`,
          wrong(ans, dt) {
            if (!dt.mistakeOk) return (sh.options[ans.mistake] && sh.options[ans.mistake].why) || `Compare the variable parts ${v}${SQ} and ${v}.`;
            const x = parseNum(ans.fix);
            if (x === bad) return `That is the value of ${name}'s form. Substitute into the ORIGINAL expression.`;
            if (x === a * 2 * t + e * t + b) return `${v}${SQ} at ${v} = ${t} is ${t} × ${t} = ${t * t}, not ${t} × 2.`;
            return `You found the mistake. For the value: ${a}(${t * t}) + ${e}(${t}) + ${b}.`;
          },
        },
      };
    }
    const a = r.int(2, 7),
      b = r.int(1, 9),
      e = r.pick([1, 2, 3, 4, 5, 6].filter((x) => x !== a));
    const c = a + e;
    const text = `${a}${v} + ${b} + ${co(e, v)}`;
    const opts = [
      { html: `${name} added the constant ${b} into the ${v}-terms. ${b} has no variable, so it is not a like term with ${a}${v} or ${co(e, v)}.`, ok: true },
      { html: `${name} should have multiplied the coefficients: ${a} × ${e}.`, why: `Like terms are combined by adding their coefficients, not multiplying.` },
      { html: `${name} should have written ${c}${v} + ${b}${v}.`, why: `${b} is a constant. Attaching a ${v} to it changes its value.` },
      {
        html: `The work is correct. All the terms are like terms.`,
        why: `Not all. Test ${v} = 2: ${text} gives ${2 * a + b + 2 * e}, but ${a + b + e}${v} gives ${2 * (a + b + e)}.`,
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
        `${a}${v} and ${co(e, v)} are like terms. ${b} is a constant and stays by itself.`,
        `Add only the coefficients of the ${v}-terms. Then write + ${b}.`,
      ],
      hintEs: 'Los términos semejantes deben tener exactamente la misma parte variable. ¿Qué términos tienen una variable y cuál no?',
      solution: `<p>${name} treated ${b} as if it were a ${v}-term. Only ${a}${v} and ${co(e, v)} are like terms: ${text} = <b>${c}${v} + ${b}</b>. A quick test with ${v} = 2 shows the difference: the original gives ${2 * a + b + 2 * e}, but ${a + b + e}${v} gives ${2 * (a + b + e)}.</p>`,
      feedback: {
        correct: `Correct. ${text} = ${c}${v} + ${b}. The constant stays separate.`,
        wrong(ans, dt) {
          if (!dt.mistakeOk) return (sh.options[ans.mistake] && sh.options[ans.mistake].why) || `Check which terms really have a ${v}.`;
          const x = parseNum(ans.fix);
          if (x === a + b + e) return `That repeats ${name}'s coefficient. Leave the constant ${b} out of it.`;
          if (x === a * e) return `Like terms are combined by adding coefficients, not multiplying.`;
          return `You found the mistake. For the fix: add only the coefficients of the ${v}-terms, ${a} + ${e}.`;
        },
      },
    };
  });

  // ---------- Pan balance: equivalent or not? (tf) ----------
  G.define('e6_balanceModel', (r, o) => {
    const hard = !!o.hard;
    const v = r.pick(VARS);
    const w = other(v);
    const a = r.int(1, 3),
      e = r.int(1, 2),
      b = r.int(1, 6);
    const p = hard ? r.int(1, 2) : 0; // hard: w-chips too
    const b2 = hard ? r.int(1, 4) : 0; // hard: a second constant
    const leftChips = [];
    for (let i = 0; i < a; i++) leftChips.push(v);
    leftChips.push(String(b));
    for (let i = 0; i < p; i++) leftChips.push(w);
    for (let i = 0; i < e; i++) leftChips.push(v);
    if (b2) leftChips.push(String(b2));
    const c = a + e;
    const B = b + b2;
    const leftText = leftChips.join(' + ');
    const simp = hard ? `${co(c, v)} + ${co(p, w)} + ${B}` : `${c}${v} + ${b}`;
    const equivalent = r.chance(0.5);
    const tv = 2,
      tw = 3;
    const wrongs = hard
      ? [
          { text: `${c + p}${v} + ${B}`, val: (c + p) * tv + B },
          { text: `${co(c, v)} + ${co(p, w)} + ${B + 1}`, val: c * tv + p * tw + B + 1 },
          { text: `${co(c, v)} + ${B + p}${w}`, val: c * tv + (B + p) * tw },
        ]
      : [
          { text: `${c + b}${v}`, val: (c + b) * tv },
          { text: `${c}${v} + ${b}${v}`, val: (c + b) * tv },
          { text: `${c - 1 === 0 ? '' : co(c - 1, v) + ' + '}${b + 1}`, val: (c - 1) * tv + b + 1 },
        ];
    const pickW = r.pick(wrongs);
    const rightText = equivalent ? simp : pickW.text;
    const leftVal = c * tv + (hard ? p * tw : 0) + B;
    const rightVal = equivalent ? leftVal : pickW.val;
    const test = hard ? `${v} = ${tv} and ${w} = ${tw}` : `${v} = ${tv}`;
    const svg = V.balance({ left: leftChips, right: [rightText], tilt: equivalent ? 0 : 1, aria: `Pan balance with ${leftText} on the left and ${rightText} on the right` });
    const reasons = r.shuffle([
      {
        html: equivalent
          ? `Yes. Combining the like terms on the left gives ${simp}, the same as the right. The pans match for every value${hard ? ' of each variable' : ` of ${v}`}.`
          : `No. The left side simplifies to ${simp}. Test ${test}: the left is ${leftVal} but the right is ${rightVal}.`,
        correct: true,
      },
      {
        html: equivalent
          ? `Yes. Both sides have the number ${b} in them somewhere, so they must balance.`
          : `No. The two sides look different, and expressions that look different are never equivalent.`,
        correct: false,
      },
      {
        html: equivalent ? `No. The left side has more pieces than the right side, so it must be heavier.` : `Yes. Both sides use the letter ${v} and the number ${b}, so they are the same.`,
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
        hard
          ? `First simplify the left pan by combining like terms. Count the ${v} chips and the ${w} chips separately, and add the constants.`
          : `First simplify the left pan by combining like terms. Count the ${v} chips and keep the constant separate.`,
        `The left pan is ${simp}. Compare it with the right pan.`,
        `If they look different, test a value such as ${test}: left = ${leftVal}, right = ${rightVal}.`,
      ],
      hintEs: hard
        ? `Primero simplifica el platillo de la izquierda combinando términos semejantes. Cuenta por separado las fichas de ${v} y las de ${w}, y suma las constantes.`
        : `Primero simplifica el platillo de la izquierda combinando términos semejantes. Cuenta las fichas de ${v} y deja la constante aparte.`,
      solution: `<p>The left pan simplifies to ${simp}. ${
        equivalent
          ? `That is exactly the right pan, so the expressions are <b>equivalent</b> and the balance stays level for every value.`
          : `The right pan is ${rightText}. At ${test}, the left is ${leftVal} and the right is ${rightVal}, so they are <b>not equivalent</b> and the balance tips.`
      }</p>`,
      feedback: {
        correct: equivalent
          ? 'Correct. Combining like terms shows the two pans hold the same expression.'
          : 'Correct. One test value with different results proves the expressions are not equivalent.',
        wrong(ans, d) {
          if (!d.valueOk) return `Simplify the left pan first: ${simp}. Then compare it with ${rightText}, or test ${test}.`;
          return 'Your yes/no is right, but the reason must come from combining like terms or from testing a value, not from how the sides look.';
        },
      },
    };
  });

  // ---------- Test equivalence by substitution (cloze) ----------
  G.define('e6_substituteTest', (r, o) => {
    const hard = !!o.hard;
    const v = r.pick(VARS);
    const a = r.int(2, 5),
      b = r.int(1, 6),
      k = hard ? r.int(2, 4) : 0;
    const t = r.int(2, 6);
    const equivalent = r.chance(0.5);
    // hard: distribute AND combine like terms, a(v + b) + kv
    const first = hard ? `${a}(${v} + ${b}) + ${k}${v}` : `${a}(${v} + ${b})`;
    const second = hard ? (equivalent ? `${a + k}${v} + ${a * b}` : `${a + k}${v} + ${b}`) : equivalent ? `${a}${v} + ${a * b}` : `${a}${v} + ${b}`;
    const A = a + k;
    const firstVal = a * (t + b) + k * t;
    const secondVal = equivalent ? firstVal : A * t + b;
    const firstSub = hard ? `${a}(${t} + ${b}) + ${k}(${t})` : `${a}(${t} + ${b})`;
    const c0 = r.shuffle(distinct([String(firstVal), String(a * t + b + k * t), String(a + t + b + k * t)]));
    const c1 = r.shuffle(distinct([String(secondVal), String(firstVal + (equivalent ? b : 0) + 1), String(A + t + b)]));
    const name = r.pick(NAMES);
    return {
      type: 'cloze',
      skill: 'test-equivalence',
      lesson: '6-6',
      title: 'Test with a value',
      prompt: `<p>${name} wants to know whether ${hl(first)} and ${hl(second)} are equivalent, and tests ${hl(v + ' = ' + t)}.</p><p>Complete the test.</p>`,
      template: `${first} at ${v} = ${t}: ${firstSub} = {0}.  ${second} at ${v} = ${t}: {1}.  The values are {2}, so the expressions {3}.`,
      choices: [c0, c1, ['equal', 'not equal'], ['are not equivalent', 'could be equivalent']],
      answers: [c0.indexOf(String(firstVal)), c1.indexOf(String(secondVal)), equivalent ? 0 : 1, equivalent ? 1 : 0],
      hints: [
        `Substitute ${t} for ${v} in each expression and follow the order of operations. In ${first}, add inside the parentheses first.`,
        hard
          ? `${a}(${t} + ${b}) = ${a} × ${t + b}, and ${k}(${t}) = ${k * t}. In ${second}, multiply ${A} × ${t} first, then add.`
          : `${a}(${t} + ${b}) = ${a} × ${t + b}. In ${second}, multiply ${a} × ${t} first, then add.`,
        'If one test value gives different results, the expressions are not equivalent. If it gives the same result, the test supports equivalence, and the distributive property can confirm it.',
      ],
      hintEs: `Sustituye ${v} por ${t} en cada expresión y sigue el orden de las operaciones. En ${first}, suma primero lo que está dentro de los paréntesis.`,
      solution: `<p>${first} → ${firstSub} = ${firstVal}. ${second} → ${A}(${t}) + ${equivalent ? a * b : b} = ${secondVal}. ${
        equivalent
          ? `The values are <b>equal</b>, so the expressions <b>could be equivalent</b>. They are: distributing gives ${a}${v} + ${a * b}${hard ? `, and combining ${a}${v} + ${k}${v} gives ${A}${v} + ${a * b}` : ''}.`
          : `The values are <b>not equal</b>, so the expressions <b>are not equivalent</b>. Distributing ${a} to both terms gives ${a}${v} + ${a * b}, so the constant must be ${a * b}, not ${b}.`
      }</p>`,
      feedback: {
        correct: equivalent
          ? 'Correct. Equal values support equivalence; the distributive property proves it.'
          : 'Correct. One test value with different results is enough to show the expressions are not equivalent.',
        wrong(ans, dt) {
          if (dt.wrong.includes(0))
            return c0[ans[0]] === String(a * t + b + k * t)
              ? `${a}(${t} + ${b}) means ${a} times the WHOLE sum. Add ${t} + ${b} first, then multiply.`
              : `In ${first}, add inside the parentheses first: ${t} + ${b} = ${t + b}, then multiply by ${a}.`;
          if (dt.wrong.includes(1)) return `In ${second}, multiply first: ${A} × ${t} = ${A * t}, then add the constant.`;
          if (dt.wrong.includes(3) && !dt.wrong.includes(2) && equivalent)
            return 'Equal values at one test point mean the expressions COULD be equivalent. One test cannot prove it; the properties can.';
          return `Compare ${firstVal} and ${secondVal}. Different values mean not equivalent. Equal values mean the expressions could be equivalent.`;
        },
      },
    };
  });

  // ---------- Who justified equivalence correctly? (who) ----------
  G.define('e6_whoEquivalent', (r, o) => {
    const hard = !!o.hard;
    const [n1, n2, n3, n4] = r.pickN(NAMES, 4);
    const v = r.pick(VARS);
    const a = r.int(2, 5),
      b = r.pick([1, 2, 3, 4, 5, 6].filter((x) => x !== a));
    const first = `${a}(${v} + ${b})`;
    const t = r.int(1, 4);
    if (hard) {
      // the pair IS equivalent; one apprentice trusts a single test value as proof
      const right = `${a}${v} + ${a * b}`;
      const opts = [
        { html: `<b>${n1}:</b> Equivalent. The distributive property says ${a} multiplies both ${v} and ${b}, so ${first} = ${right} for every value.`, ok: true },
        {
          html: `<b>${n2}:</b> Equivalent. I tested ${v} = ${t}, and both expressions came out to ${a * (t + b)}, so that proves it.`,
          why: `The answer is right, but one test value cannot prove equivalence. Some expressions match at one value and differ at others. A property is needed.`,
        },
        {
          html: `<b>${n3}:</b> Not equivalent. The first one has parentheses and the second one does not, so they cannot match.`,
          why: `Parentheses alone do not decide equivalence. Distributing ${a} removes the parentheses without changing the value.`,
        },
        {
          html: `<b>${n4}:</b> Not equivalent. The first one has the number ${b} in it, but the second one has ${a * b} instead.`,
          why: `${a * b} is ${a} × ${b}. Distributing ${a} to ${b} produces it, so the constants do match.`,
        },
      ];
      const sh = shuffleOptions(r, opts, 0);
      return {
        type: 'who',
        skill: 'test-equivalence',
        lesson: '6-6',
        title: 'Who justified it correctly?',
        prompt: `<p>Four apprentices decide whether ${hl(first)} and ${hl(right)} are equivalent.</p><p>Who is correct, with a reason that proves it?</p>`,
        options: sh.options,
        answer: sh.answer,
        layout: 'cards',
        hints: [
          'Equivalent expressions have the same value for every value of the variable. A test can show two expressions are NOT equivalent, but one matching test cannot prove they are.',
          `Distribute: ${a}(${v} + ${b}) = ${a} × ${v} + ${a} × ${b}.`,
          'Choose the answer that is right AND uses a property that works for every value.',
        ],
        hintEs:
          'Las expresiones equivalentes tienen el mismo valor para cualquier valor de la variable. Una prueba puede demostrar que NO son equivalentes, pero una sola prueba que coincide no demuestra que sí lo sean.',
        solution: `<p>${n1} is correct: by the distributive property, ${first} = <b>${right}</b> for every value of ${v}. ${n2} has the right answer but a single test value is not a proof. ${n3} and ${n4} judged by how the expressions look.</p>`,
        feedback: {
          correct: `Correct. ${n1} used the distributive property, which works for every value.`,
          wrong: U.whyWrong(sh.options, 'Look for a reason that works for every value of the variable.'),
        },
      };
    }
    const wrongForm = `${a}${v} + ${b}`;
    const opts = [
      {
        html: `<b>${n1}:</b> Not equivalent. At ${v} = ${t}, ${first} = ${a * (t + b)} but ${wrongForm} = ${a * t + b}. One test with different values is enough.`,
        ok: true,
      },
      {
        html: `<b>${n2}:</b> Equivalent. Both expressions contain the numbers ${a} and ${b} and the variable ${v}, and the ${a} multiplies ${v} in both, so they always have the same value.`,
        why: `Having the same numbers and letters does not make expressions equivalent. ${a} must multiply both ${v} and ${b}, so ${first} = ${a}${v} + ${a * b}.`,
      },
      {
        html: `<b>${n3}:</b> Not equivalent, because one expression is written with parentheses and the other one is not, and parentheses always change the value.`,
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
      hintEs: 'Las expresiones equivalentes tienen el mismo valor para cualquier valor de la variable. Un solo valor de prueba que da resultados distintos demuestra que no son equivalentes.',
      solution: `<p>${n1} is correct. At ${v} = ${t}, the expressions give ${a * (t + b)} and ${a * t + b}, so they are <b>not equivalent</b>. ${n2} judged by appearance; ${n3} reached the right answer with a wrong reason. The equivalent form of ${first} is ${a}${v} + ${a * b}, because ${a} multiplies both terms inside.</p>`,
      feedback: { correct: `Correct. ${n1} tested a value and compared the results.`, wrong: U.whyWrong(sh.options, 'Test a value in both expressions, or use the distributive property.') },
    };
  });

  // ---------- Match equations to the property they show (match) ----------
  G.define('e6_propertyMatch', (r, o) => {
    const hard = !!o.hard;
    const v = r.pick(VARS);
    const a = r.int(2, 9),
      b = r.int(2, 9),
      c = r.int(2, 6);
    const examples = hard
      ? [
          // the same properties in less familiar forms
          { prop: 'Commutative property', eq: r.chance(0.5) ? `${a}${v} + ${b} = ${b} + ${a}${v}` : `${v} · ${c} · ${a} = ${c} · ${v} · ${a}` },
          { prop: 'Associative property', eq: `${c}(${a}${v}) = (${c} · ${a})${v}` },
          { prop: 'Distributive property', eq: `${c}${v} + ${c * b} = ${c}(${v} + ${b})` },
          { prop: 'Identity property', eq: r.chance(0.5) ? `${a}${v} · 1 = ${a}${v}` : `0 + ${a}${v} = ${a}${v}` },
        ]
      : [
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
      prompt: hard
        ? `<p>Each equation shows two equivalent expressions, written in a less familiar way. Match each equation to the property that explains why the two sides are equivalent.</p>`
        : `<p>Each equation shows two equivalent expressions. Match each equation to the property that explains why the two sides are equivalent.</p>`,
      left,
      right,
      pairs,
      hints: [
        'Commutative: the order changes. Associative: the grouping changes. Distributive: a factor is multiplied by each term inside parentheses. Identity: adding 0 or multiplying by 1 leaves the value unchanged.',
        hard ? `In ${examples[2].eq}, read it right to left: ${c} is multiplied by each term in the parentheses.` : `In ${examples[2].eq}, the ${c} is multiplied by both ${v} and ${b}.`,
        hard
          ? `In ${examples[1].eq}, the same factors stay in the same order. Only the grouping moves.`
          : 'If the same numbers appear in a different order, think commutative. If the parentheses move, think associative.',
      ],
      hintEs:
        'Conmutativa: cambia el orden. Asociativa: cambia la agrupación. Distributiva: un factor multiplica a cada término dentro de los paréntesis. Identidad: sumar 0 o multiplicar por 1 no cambia el valor.',
      solution: `<p>${examples.map((e) => `${e.eq} → <b>${e.prop}</b>`).join('; ')}. The commutative property changes order, the associative property changes grouping, the distributive property multiplies each term inside the parentheses, and the identity property uses 0 for addition or 1 for multiplication.</p>`,
      feedback: {
        correct: 'Correct. Order, grouping, distributing, and identity: four reasons two expressions can be equivalent.',
        wrong(ans, dt) {
          const i = (dt.wrong || [])[0];
          const e = examples[i] || examples[0];
          return `Look at ${e.eq} again. ${i === 0 ? 'Only the order changed.' : i === 1 ? 'Only the grouping (parentheses) changed.' : i === 2 ? 'A factor is multiplied by each term inside the parentheses.' : 'Adding 0 or multiplying by 1 left the value unchanged.'}`;
        },
      },
    };
  });

  // ---------- Compare two expressions in a table (table) ----------
  G.define('e6_tableCompare', (r, o) => {
    const hard = !!o.hard;
    const v = r.pick(VARS);
    const a = hard ? r.int(3, 5) : r.int(2, 4),
      b = r.int(1, 5);
    const equivalent = r.chance(0.5);
    // hard: distribute, then combine with a subtracted v
    const first = hard ? `${a}(${v} + ${b}) − ${v}` : `${a}(${v} + ${b})`;
    const second = hard ? (equivalent ? `${a - 1}${v} + ${a * b}` : `${a + 1}${v} + ${a * b}`) : equivalent ? `${a}${v} + ${a * b}` : `${a}${v} + ${b}`;
    const f1 = (x) => a * (x + b) - (hard ? x : 0);
    const f2 = hard ? (x) => (equivalent ? (a - 1) * x + a * b : (a + 1) * x + a * b) : (x) => (equivalent ? a * x + a * b : a * x + b);
    const xs = hard ? [0, 2, 5] : [1, 2, 3];
    const rows = [[v, first, second]];
    const inputs = [];
    xs.forEach((x, i) => {
      rows.push([String(x), `__IN:f${i}__`, `__IN:s${i}__`]);
      inputs.push({ id: `f${i}`, answer: f1(x) }, { id: `s${i}`, answer: f2(x) });
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
        `Substitute each value of ${v} into both expressions. In ${first}, add inside the parentheses first, then multiply by ${a}${hard ? `, then subtract ${v}` : ''}.`,
        hard
          ? `Row ${v} = 0: ${first} = ${a}(${b}) − 0 = ${f1(0)}. Watch the row ${v} = 0: matching there does not prove the columns always match.`
          : `Row ${v} = 1: ${first} = ${a}(${1 + b}) = ${a * (1 + b)}; ${second} = ${a}(1) + ${equivalent ? a * b : b} = ${f2(1)}.`,
        `Keep going for the other rows, then compare the two columns row by row.`,
      ],
      hintEs: `Sustituye cada valor de ${v} en las dos expresiones. En ${first}, suma primero dentro de los paréntesis y luego multiplica por ${a}${hard ? `; después resta ${v}` : ''}.`,
      solution: `<p>${xs.map((x) => `${v} = ${x}: ${f1(x)} and ${f2(x)}`).join('; ')}. ${
        equivalent
          ? `The columns match for every value tested, which supports that the expressions are <b>equivalent</b>. The properties confirm it: ${first} = ${a}${v} + ${a * b}${hard ? ` − ${v} = ${a - 1}${v} + ${a * b}` : ''}.`
          : hard
            ? `The columns match at ${v} = 0 but differ at the other values, so the expressions are <b>not equivalent</b>. ${first} = ${a}${v} + ${a * b} − ${v} = ${a - 1}${v} + ${a * b}; subtracting ${v} lowers the coefficient.`
            : `The columns differ, so the expressions are <b>not equivalent</b>. ${first} = ${a}${v} + ${a * b}, because ${a} must multiply both terms inside the parentheses.`
      }</p>`,
      feedback: {
        correct: equivalent ? 'Correct. Matching columns support equivalence, and the properties prove it.' : 'Correct. Different values in any row show the expressions are not equivalent.',
        wrong(ans, dt) {
          const id = String((dt.wrong || [])[0] || 'f0');
          const i = Number(id.slice(1)) || 0;
          const x = xs[i];
          const typed = parseNum((ans || {})[id]);
          if (id.startsWith('f')) {
            if (typed === a * x + b - (hard ? x : 0)) return `For ${first} at ${v} = ${x}: ${a} multiplies the whole sum ${x} + ${b}, not only ${x}.`;
            return `For ${first} at ${v} = ${x}: add first, ${x} + ${b} = ${x + b}, then multiply by ${a}${hard ? `, then subtract ${x}` : ''}.`;
          }
          return `For ${second} at ${v} = ${x}: multiply the coefficient by ${x} first, then add the constant.`;
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
  const { G, V, gcd, shuffleOptions, NAMES, plural, parseNum } = RX;
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
  const gcdAll = (ns) => ns.reduce((acc, n) => gcd(acc, n));
  const lcmAll = (ns) => ns.reduce((acc, n) => lcm(acc, n));
  const mults = (n, upto) => {
    const out = [];
    for (let k = 1; n * k <= upto; k++) out.push(n * k);
    return out;
  };
  /** "both" for two numbers, "all three" for three. */
  const allWord = (ns) => (ns.length === 2 ? 'both' : 'all three');

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
  /** Three numbers ≤ hi sharing a GCF of at least 2, none a multiple of another. */
  function gcfTrio(r, hi) {
    for (let tries = 0; tries < 300; tries++) {
      const g = r.pick([2, 3, 4, 5, 6, 7, 8]);
      const ks = r.pickN([2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], 3);
      const trio = ks.map((k) => g * k).sort((x, y) => x - y);
      if (trio[2] > hi || gcdAll(trio) !== g) continue;
      if (trio.some((x, i) => trio.some((y, j) => i !== j && y % x === 0))) continue;
      return trio;
    }
    return [12, 18, 30];
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
  /** Three numbers with LCM ≤ 120, none a multiple of another, LCM smaller than the product. */
  function lcmTrio(r) {
    for (let tries = 0; tries < 400; tries++) {
      const trio = r.pickN([2, 3, 4, 5, 6, 8, 9, 10, 12, 14, 15], 3).sort((x, y) => x - y);
      if (trio.some((x, i) => trio.some((y, j) => i !== j && y % x === 0))) continue;
      const l = lcmAll(trio);
      if (l > 120 || l === trio[0] * trio[1] * trio[2]) continue;
      return trio;
    }
    return [4, 6, 10];
  }

  const STOCK_PAIRS = [
    ['bolts', 'nuts'],
    ['brass gears', 'steel gears'],
    ['copper wires', 'glass fuses'],
    ['springs', 'pins'],
    ['oil cans', 'rags'],
  ];
  const THIRD_ITEMS = ['washers', 'rivets', 'hinges', 'clamps'];
  const KIT_WORDS = ['repair kits', 'tool boxes', 'gift bags', 'crates', 'trays'];

  // ---------- Select every factor (ms) ----------
  G.define('e7_listFactors', (r, o) => {
    const hard = !!o.hard;
    const n = hard ? r.pick([64, 72, 80, 84, 90, 96, 100]) : r.pick([12, 16, 18, 20, 24, 28, 30, 32, 36, 40, 42, 45, 48, 50, 54, 56, 60]);
    const fs = factors(n).filter((k) => k !== 1 && k !== n);
    const ok = r.pickN(fs, Math.min(3, fs.length));
    const nonPool = [];
    // hard: every non-factor shares a factor with n, so "it is even" or "it ends in 5" is not enough to decide
    for (let k = 2; k < n; k++) if (n % k !== 0 && k <= n / 2 + 2 && (!hard || gcd(k, n) > 1)) nonPool.push(k);
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
        hard ? `Careful: sharing a factor with ${n} is not enough. Divide ${n} by each choice and check for a remainder.` : `All the factors of ${n}: ${list(factors(n))}.`,
      ],
      hintEs: `Un factor de ${n} divide a ${n} sin dejar residuo. Prueba cada número: ¿cabe exactamente en ${n}?`,
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
    const nums = hard ? gcfTrio(r, 72) : gcfPair(r, { minG: 2 });
    const g = gcdAll(nums);
    const common = factors(nums[0]).filter((k) => nums.every((n) => n % k === 0));
    const name = r.pick(NAMES);
    const ctx = r.pick([
      `${hard ? 'Three' : 'Two'} gears have ${hl(list(nums))} teeth. The largest tooth count a drive gear can have and still mesh with ${allWord(nums)} is their greatest common factor.`,
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
        `Work down the factors of ${nums[0]} from largest to smallest. The first one that also divides ${nums.slice(1).join(' and ')} is the GCF.`,
      ],
      hintEs: 'Haz la lista de los factores de cada número. Los factores comunes aparecen en todas las listas. El máximo común divisor (MCD) es el mayor de ellos.',
      solution: `<p>${nums.map((n) => `Factors of ${n}: ${list(factors(n))}`).join('. ')}. The common factors are ${list(common)}, so the GCF is <b>${g}</b>. It is the largest number that divides ${nums.length === 2 ? 'both' : 'all'} of them with no remainder.</p>`,
      feedback: {
        correct: `Correct. ${g} is the greatest number that divides ${list(nums)} evenly.`,
        wrong(ans, dt) {
          const v = dt.value;
          const l = lcmAll(nums);
          if (v === l) return `${l} is the least common MULTIPLE. A factor is never bigger than the numbers themselves. Look for the largest number that divides into ${list(nums)}.`;
          if (hard && v != null && v === gcd(nums[0], nums[1]) && v !== g) return `${v} divides ${nums[0]} and ${nums[1]}, but not ${nums[2]}. The GCF must divide all three numbers.`;
          if (hard && v != null && v !== g && (v === gcd(nums[1], nums[2]) || v === gcd(nums[0], nums[2])))
            return `${v} is a common factor of only two of the numbers. Check that it divides all three.`;
          if (v != null && v > 1 && v < g && common.includes(v))
            return `${v} is a common factor, but not the greatest. Is there a larger number that divides ${nums.length === 2 ? 'both' : 'all of them'}?`;
          if (v === 1) return `1 is a common factor of any numbers, but these numbers share a larger factor. List the factors of each.`;
          return `List all the factors of each number and find the largest one in every list.`;
        },
      },
    };
  });

  // ---------- GCF story: identical groups (mc) ----------
  G.define('e7_gcfStory', (r, o) => {
    const hard = !!o.hard;
    const name = r.pick(NAMES);
    const [itemA, itemB] = r.pick(STOCK_PAIRS);
    const itemC = r.pick(THIRD_ITEMS);
    const kit = r.pick(KIT_WORDS);
    let nums;
    if (hard) {
      // three kinds of items; the first two alone share a bigger factor than all three do
      for (let tries = 0; tries < 300 && !nums; tries++) {
        const t = gcfTrio(r, 72);
        if (gcd(t[0], t[1]) !== gcdAll(t) || gcd(t[1], t[2]) !== gcdAll(t)) nums = r.shuffle(t);
      }
      if (!nums) nums = [24, 36, 30];
    } else nums = gcfPair(r, { lo: 8, hi: 48, minG: 3 });
    const items = hard ? [itemA, itemB, itemC] : [itemA, itemB];
    const g = gcdAll(nums);
    const l = lcmAll(nums);
    const [a, b] = nums;
    const sum = nums.reduce((s, x) => s + x, 0);
    const opts = [{ html: `${g} ${kit}`, ok: true }];
    if (l <= 999)
      opts.push({
        html: `${l} ${kit}`,
        why: `${l} is the least common multiple. ${name} has only ${Math.min(...nums)} of one item, so there cannot be ${l} ${kit}. The number of ${kit} must divide every count.`,
      });
    if (hard) {
      const g2 = [gcd(nums[0], nums[1]), gcd(nums[1], nums[2]), gcd(nums[0], nums[2])].find((x) => x !== g);
      opts.push({ html: `${g2} ${kit}`, why: `${g2} divides two of the counts, but not all three. Every kit must get the same number of each item, so the kit count must divide ${list(nums)}.` });
    } else {
      const common = factors(a).filter((k) => b % k === 0 && k > 1 && k < g);
      if (common.length)
        opts.push({ html: `${common[common.length - 1]} ${kit}`, why: `${common[common.length - 1]} ${kit} would work, but it is not the greatest. ${g} also divides both ${a} and ${b}.` });
      else {
        const third = [b - a, g + 1, g - 1].find((x) => x > 1 && x !== g && x !== l && x !== a + b);
        opts.push({
          html: `${third} ${kit}`,
          why:
            third === b - a
              ? `${third} is the difference between the counts. The number of ${kit} must divide both ${a} and ${b} evenly.`
              : `${third} does not divide both ${a} and ${b} evenly, so the kits would not be identical.`,
        });
      }
    }
    if (hard && opts.length < 3) {
      const smaller = factors(g)
        .filter((k) => k > 1 && k < g)
        .pop();
      if (smaller) opts.push({ html: `${smaller} ${kit}`, why: `${smaller} ${kit} would work, but it is not the greatest. ${g} also divides every count.` });
    }
    opts.push({ html: `${sum} ${kit}`, why: `${sum} is the total number of items, not the number of identical ${kit}. Each kit needs a share of every kind.` });
    const sh = shuffleOptions(r, opts, 0);
    const have = items.map((it, i) => hl(nums[i] + ' ' + it));
    const each = items.map((it, i) => `${nums[i] / g} ${plural(nums[i] / g, it.replace(/s$/, ''), it)}`);
    return {
      type: 'mc',
      skill: 'gcf',
      lesson: '6-7',
      title: 'How many identical kits?',
      prompt: `<p>${name} has ${hard ? `${have[0]}, ${have[1]}, and ${have[2]}` : `${have[0]} and ${have[1]}`}. Every item must be used, and every kit must be identical.</p><p>What is the <b>greatest</b> number of identical ${kit} ${name} can make?</p>`,
      options: sh.options,
      answer: sh.answer,
      hints: [
        `The number of ${kit} must divide every count evenly, so it is a common factor of ${list(nums)}.`,
        nums.map((n) => `Factors of ${n}: ${list(factors(n))}`).join('. ') + '.',
        `Find the numbers that appear in ${hard ? 'all three lists' : 'both lists'}. "Greatest" means take the largest of those.`,
      ],
      hintEs: `El número de grupos iguales debe dividir exactamente a cada cantidad, así que es un factor común de ${list(nums)}.`,
      solution: `<p>Identical kits means the number of kits divides ${hard ? `${list(nums)}` : `both ${a} and ${b}`}. The GCF is <b>${g}</b>, so ${name} can make ${g} ${kit}, each with ${hard ? `${each[0]}, ${each[1]}, and ${each[2]}` : `${each[0]} and ${each[1]}`}. Sharing or packaging into identical groups is a GCF problem.</p>`,
      feedback: {
        correct: `Correct. ${g} kits, each with ${hard ? `${each[0]}, ${each[1]}, and ${each[2]}` : `${each[0]} and ${each[1]}`}.`,
        wrong: U.whyWrong(sh.options, `Find the greatest number that divides every count with no remainder.`),
      },
    };
  });

  // ---------- Factor pairs table (table) ----------
  G.define('e7_factorTable', (r, o) => {
    const hard = !!o.hard;
    const n = hard ? r.pick([64, 72, 80, 84, 90, 96, 100]) : r.pick([12, 18, 20, 24, 28, 30, 32, 36, 40, 42, 45, 48, 50, 54, 56, 60]);
    const fs = factors(n);
    const pairs = fs.filter((k) => k * k <= n).map((k) => [k, n / k]);
    const rows = [['First factor', 'Second factor', 'Product']];
    const inputs = [];
    pairs.forEach(([k, m], i) => {
      if (i === 0) rows.push([String(k), String(m), String(n)]);
      else if (hard && i % 2 === 0) {
        // hard: some rows give the larger factor and hide the smaller one
        rows.push([`__IN:q${i}__`, String(m), String(n)]);
        inputs.push({ id: `q${i}`, answer: k });
      } else {
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
      prompt: hard
        ? `<p>${name} lists every factor pair of ${hl(n)} to find all the gear sizes that fit. Complete the table. In some rows the first factor is missing.</p>`
        : `<p>${name} lists every factor pair of ${hl(n)} to find all the gear sizes that fit. Complete the table.</p><p class="muted">Each row shows two factors whose product is ${n}.</p>`,
      rows,
      header: true,
      inputs,
      hints: [
        `A factor pair is two numbers that multiply to ${n}. Divide ${n} by the factor you know to find its partner.`,
        `${pairs
          .slice(1, 3)
          .map(([k]) => `${n} ÷ ${k} = ?`)
          .join(' and ')}.`,
        hard
          ? `When the second factor is given, divide ${n} by it to find the first. Check every row: the two factors must multiply to ${n}.`
          : `${pairs
              .slice(1, -1)
              .map(([k, m]) => `${k} × ${m} = ${n}`)
              .join('; ')}. One pair remains.`,
      ],
      hintEs: `Un par de factores son dos números que, multiplicados, dan ${n}. Divide ${n} entre el factor que conoces para hallar su pareja.`,
      solution: `<p>${pairs.map(([k, m]) => `${k} × ${m}`).join(', ')}. The factors of ${n} are <b>${list(fs)}</b>. Pairs stop when the first factor passes the second, because the pairs would repeat.</p>`,
      feedback: {
        correct: `Correct. ${n} has ${fs.length} factors in ${pairs.length} pairs.`,
        wrong(ans, dt) {
          const id = String((dt.wrong || [])[0] || 'p1');
          const i = Number(id.slice(1)) || 1;
          const [k, m] = pairs[i] || pairs[1];
          const typed = parseNum((ans || {})[id]);
          if (id.startsWith('q')) return `The second factor is ${m}. Which number times ${m} equals ${n}? Divide: ${n} ÷ ${m}.`;
          if (typed != null && typed * k !== n && typed + k === n) return `The two numbers must MULTIPLY to ${n}, not add to ${n}. Divide: ${n} ÷ ${k}.`;
          return `Divide: ${n} ÷ ${k} = ? The two numbers in each row must multiply to ${n}.`;
        },
      },
    };
  });

  // ---------- Least common multiple (num) ----------
  G.define('e7_lcm', (r, o) => {
    const hard = !!o.hard;
    const nums = hard ? lcmTrio(r) : lcmPair(r);
    const l = lcmAll(nums);
    const g = gcdAll(nums);
    const prod = nums.reduce((p, x) => p * x, 1);
    const name = r.pick(NAMES);
    const ctx = r.pick([
      `${hard ? 'Three' : 'Two'} gears have ${hl(list(nums))} teeth. Marks on the gears line up again after a number of teeth equal to the least common multiple.`,
      `${name} needs the LCM of ${hl(list(nums))} to set the vault timer.`,
      `The vault dial reads: "Find the least common multiple of ${hl(list(nums))}."`,
    ]);
    return {
      type: 'num',
      skill: 'lcm',
      lesson: '6-7',
      title: hard ? 'LCM of three numbers' : 'Find the least common multiple',
      prompt: `<p>${ctx}</p><p>What is the LCM of ${list(nums)}?</p>`,
      answer: l,
      hints: [
        `List the multiples of each number. The LCM is the smallest number that appears in ${hard ? 'all three lists' : 'both lists'}.`,
        hard
          ? `Skip-count by the largest number, ${nums[2]}: ${nums[2]}, ${2 * nums[2]}, ${3 * nums[2]}, … Check each one: is it also a multiple of ${nums[0]} and ${nums[1]}?`
          : `Multiples of ${nums[0]}: ${list(mults(nums[0], l))}, … Multiples of ${nums[1]}: ${list(mults(nums[1], l))}, …`,
        `Which number is the first to appear in ${hard ? 'all three lists' : 'both lists'}?`,
      ],
      hintEs: 'Haz la lista de los múltiplos de cada número. El mínimo común múltiplo (mcm) es el número más pequeño que aparece en todas las listas.',
      solution: `<p>${nums.map((n) => `Multiples of ${n}: ${list(mults(n, l))}`).join('. ')}. The first number in ${hard ? 'all three lists' : 'both lists'} is <b>${l}</b>. ${
        prod === l
          ? `Here the LCM equals the product ${nums.join(' × ')}, because the numbers share no factor besides 1.`
          : `The product ${nums.join(' × ')} = ${prod} is also a common multiple, but not the least, because the numbers share factors.`
      }</p>`,
      feedback: {
        correct: `Correct. ${l} is the smallest number that is a multiple of ${list(nums)}.`,
        wrong(ans, dt) {
          const v = dt.value;
          if (v === g) return `${g} is the greatest common FACTOR. A multiple is at least as big as the numbers. List the multiples.`;
          if (v === prod && prod !== l) return `${prod} is a common multiple, but not the least. The numbers share a factor, so a smaller number is in every list.`;
          if (hard && v != null && v !== l && (v === lcm(nums[0], nums[1]) || v === lcm(nums[1], nums[2]) || v === lcm(nums[0], nums[2])))
            return `${v} is a multiple of only two of the numbers. The LCM must be a multiple of all three.`;
          if (v === nums.reduce((s, x) => s + x, 0)) return `Adding the numbers does not give a common multiple. Skip-count by each number until the lists meet.`;
          if (v != null && v > l && v % l === 0) return `${v} is a common multiple, but there is a smaller one. Look for the first match in the lists.`;
          return `List multiples of each number. The LCM is the first number in every list.`;
        },
      },
    };
  });

  // ---------- LCM story: repeating events (mc) ----------
  G.define('e7_lcmStory', (r, o) => {
    const hard = !!o.hard;
    let nums;
    if (hard) {
      for (let tries = 0; tries < 100 && !nums; tries++) {
        const t = lcmTrio(r);
        if (lcm(t[0], t[1]) !== lcmAll(t)) nums = t;
      }
      if (!nums) nums = [4, 6, 10];
    } else nums = lcmPair(r);
    const [a, b, c] = nums;
    const l = lcmAll(nums);
    const g = gcdAll(nums);
    const prod = nums.reduce((p, x) => p * x, 1);
    const sum = nums.reduce((s, x) => s + x, 0);
    const name = r.pick(NAMES);
    const ctx = hard
      ? r.pick([
          [
            `In the vault, a bell rings every ${hl(a + ' minutes')}, a light flashes every ${hl(b + ' minutes')}, and a whistle blows every ${hl(c + ' minutes')}. All three happened together at noon.`,
            'In how many minutes will all three happen together again?',
            'minutes',
          ],
          [
            `${name} oils three gears: one every ${hl(a + ' days')}, one every ${hl(b + ' days')}, and one every ${hl(c + ' days')}. All three were oiled today.`,
            'In how many days will all three be oiled on the same day again?',
            'days',
          ],
        ])
      : r.pick([
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
    const cands = hard ? [lcm(a, b), prod, sum, l * 2] : [prod !== l ? prod : l * 2, g > 1 ? g : l + Math.max(a, b), sum];
    const wrongs = distinct(cands.filter((x) => x !== l)).slice(0, 3);
    if (wrongs.length < 2) wrongs.push(l * 2);
    const whyFor = (x) => {
      if (hard && x === lcm(a, b)) return `${x} lines up the first two events, but ${x} is not a multiple of ${c}. All three must line up.`;
      if (x === prod) return `${prod} is a common multiple, but not the first time they meet. Check the smaller common multiples first.`;
      if (x === l * 2 || x === l + Math.max(a, b)) return `${x} is too late. Check the smaller multiples: they meet earlier than that.`;
      if (x === g) return `${g} is the greatest common factor. The events line up at a common MULTIPLE.`;
      return `${sum} is the sum. Adding the cycle lengths does not tell when they line up. Skip-count by each cycle length.`;
    };
    const opts = [{ html: `${l} ${ctx[2]}`, ok: true }].concat(wrongs.map((x) => ({ html: `${x} ${ctx[2]}`, why: whyFor(x) })));
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
        hard
          ? `Each event happens at multiples of its own cycle: ${list(nums)}. They all meet at a common multiple of the three.`
          : `The first event happens at multiples of ${a}. The second happens at multiples of ${b}. They meet at a common multiple.`,
        hard
          ? `Skip-count by ${c}: ${c}, ${2 * c}, ${3 * c}, … Stop at the first number that is also a multiple of ${a} and of ${b}.`
          : `Multiples of ${a}: ${a}, ${2 * a}, ${3 * a}, … Multiples of ${b}: ${b}, ${2 * b}, ${3 * b}, …`,
        `The question asks for the NEXT time, so you want the least common multiple.`,
      ],
      hintEs: hard
        ? `Cada suceso ocurre en los múltiplos de su propio ciclo: ${list(nums)}. Los tres coinciden en un múltiplo común de los tres números.`
        : `El primer suceso ocurre en los múltiplos de ${a}. El segundo ocurre en los múltiplos de ${b}. Coinciden en un múltiplo común.`,
      solution: `<p>Events that repeat line up at a common multiple. The least common multiple of ${list(nums)} is <b>${l}</b>, so they happen together again in ${l} ${ctx[2]}. Repeating-event problems are LCM problems.</p>`,
      feedback: { correct: `Correct. ${l} is the first number that is a multiple of ${list(nums)}.`, wrong: U.whyWrong(sh.options, 'Find the first number that is a multiple of every cycle length.') },
    };
  });

  // ---------- Sort: factor, multiple, or neither (sort) ----------
  G.define('e7_sortFactorMultiple', (r, o) => {
    const hard = !!o.hard;
    const n = hard ? r.pick([12, 14, 15, 16, 18, 20, 24]) : r.pick([6, 8, 9, 10, 12, 14, 15, 16, 18, 20]);
    const fs = factors(n).filter((k) => k !== n);
    const ms = (hard ? [3, 4, 5, 6, 7, 8, 9] : [2, 3, 4, 5]).map((k) => k * n);
    const neither = [];
    // hard: every "neither" number shares a factor with n (like 8 for 12), so it looks related
    for (let k = 2; k <= 3 * n; k++) if (n % k !== 0 && k % n !== 0 && (!hard || gcd(k, n) > 1)) neither.push(k);
    const per = hard ? 3 : 2;
    const items = r.shuffle(
      r
        .pickN(fs, Math.min(per, fs.length))
        .map((k) => ({ html: String(k), bin: 0 }))
        .concat(
          r.pickN(ms, per).map((k) => ({ html: String(k), bin: 1 })),
          r.pickN(neither, per).map((k) => ({ html: String(k), bin: 2 })),
        ),
    );
    return {
      type: 'sort',
      skill: 'lcm',
      lesson: '6-7',
      title: `Factor or multiple of ${n}?`,
      prompt: hard
        ? `<p>The gear ${hl(n)} is the master gear. Sort each number: is it a <b>factor</b> of ${n}, a <b>multiple</b> of ${n}, or neither? Some numbers share a factor with ${n} but are still neither.</p>`
        : `<p>The gear ${hl(n)} is the master gear. Sort each number: is it a <b>factor</b> of ${n}, a <b>multiple</b> of ${n}, or neither?</p>`,
      bins: [`Factor of ${n}`, `Multiple of ${n}`, 'Neither'],
      items,
      hints: [
        `A factor of ${n} divides ${n} evenly, so it is ${n} or smaller. A multiple of ${n} is ${n} times a whole number, so it is ${n} or larger.`,
        `Factors of ${n}: ${list(factors(n))}. Multiples of ${n}: ${n}, ${2 * n}, ${3 * n}, ${4 * n}, …`,
        hard
          ? `For a big number, divide it by ${n}: a whole-number answer means multiple. For a small number, divide ${n} by it: a whole-number answer means factor.`
          : 'If a number is not in either list, it belongs in Neither.',
      ],
      hintEs: `Un factor de ${n} divide a ${n} exactamente, así que es ${n} o menor. Un múltiplo de ${n} es ${n} por un número entero, así que es ${n} o mayor.`,
      solution: `<p>Factors of ${n}: ${list(factors(n))}. Multiples of ${n}: ${n}, ${2 * n}, ${3 * n}, ${4 * n}, ${5 * n}, … Factors divide ${n}; multiples are products of ${n}. A number that does neither goes in <b>Neither</b>, even if it shares a factor with ${n}.</p>`,
      feedback: {
        correct: `Correct. Factors go into ${n}; multiples come out of ${n}.`,
        wrong(ans, dt) {
          const it = items[(dt.wrong || [])[0]];
          if (!it) return `Check: does the number divide ${n} evenly? Is it ${n} times a whole number?`;
          if (it.bin === 0) return `${n} ÷ ${it.html} = ${n / Number(it.html)} with no remainder, so ${it.html} is a factor of ${n}.`;
          if (it.bin === 1) return `${it.html} = ${n} × ${Number(it.html) / n}, so it is a multiple of ${n}.`;
          return `${it.html} does not divide ${n} evenly, and it is not ${n} times a whole number. Sharing a factor with ${n} is not enough: it is neither.`;
        },
      },
    };
  });

  // ---------- Explain: GCF or LCM? (cr) ----------
  G.define('e7_crChoose', (r, o) => {
    const hard = !!o.hard;
    const name = r.pick(NAMES);
    const isGcf = r.chance(0.5);
    let story, a, b, question, opts;
    if (isGcf) {
      [a, b] = gcfPair(r, { lo: 8, hi: 48, minG: 3 });
      const [itemA, itemB] = r.pick(STOCK_PAIRS);
      const kit = r.pick(KIT_WORDS);
      const g = gcd(a, b);
      story = `${name} has ${a} ${itemA} and ${b} ${itemB} and wants to make the greatest number of identical ${kit} with nothing left over.`;
      if (hard) {
        // one extra step: the contents of each kit
        question = `How many ${itemA} go in each of the ${kit}?`;
        opts = [
          { html: `GCF first, then divide: ${a / g} ${itemA} in each`, ok: true },
          { html: `GCF only: ${g} ${itemA} in each`, why: `${g} is the number of ${kit}. Each kit gets ${a} ÷ ${g} of the ${itemA}.` },
          { html: `LCM first, then divide: ${lcm(a, b) / a} ${itemA} in each`, why: 'Splitting into identical groups needs a common factor, not a common multiple.' },
        ];
      } else {
        question = `What is the greatest number of identical ${kit}?`;
        opts = [
          { html: `GCF: ${g} ${kit}`, ok: true },
          { html: `LCM: ${lcm(a, b)} ${kit}`, why: 'Splitting into identical groups needs a common factor, not a common multiple.' },
          { html: `Neither: ${a + b} ${kit}`, why: 'Adding the two numbers does not model sharing or repeating.' },
        ];
      }
    } else {
      [a, b] = lcmPair(r);
      const days = r.chance(0.5);
      const unit = days ? 'days' : 'minutes';
      story = days
        ? `${name} waters one plant every ${a} days and another every ${b} days. Both were watered today.`
        : `A furnace vents every ${a} minutes and a pump cycles every ${b} minutes. Both just happened.`;
      const l = lcm(a, b);
      if (hard) {
        // one extra step: how many times the first event happens by then
        question = days
          ? `When both plants are next watered on the same day, how many times will the first plant have been watered (not counting today)?`
          : `When both next happen together, how many times will the furnace have vented (not counting now)?`;
        opts = [
          { html: `LCM first, then divide: ${l / a} times`, ok: true },
          { html: `LCM only: ${l} times`, why: `${l} is WHEN they meet, in ${unit}. The first event happens every ${a} ${unit}, so divide ${l} by ${a}.` },
          {
            html: `GCF first, then divide: ${a / gcd(a, b)} times`,
            why: 'Events that repeat line up at a common multiple, not a common factor.',
          },
        ];
      } else {
        question = `When will both happen together again?`;
        opts = [
          { html: `LCM: ${l} ${unit}`, ok: true },
          { html: `GCF: ${gcd(a, b)} ${gcd(a, b) === 1 ? unit.slice(0, -1) : unit}`, why: 'Events that repeat line up at a common multiple, not a common factor.' },
          { html: `Neither: ${a + b} ${unit}`, why: 'Adding the two numbers does not model sharing or repeating.' },
        ];
      }
    }
    // keep every choice distinct (small numbers can collide)
    const fallback = [
      { html: `Neither: ${a + b} ${isGcf ? 'in each' : 'times'}`, why: 'Adding the two numbers does not model sharing or repeating.' },
      { html: `Neither: ${a * b} ${isGcf ? 'in each' : 'times'}`, why: 'Multiplying the two numbers gives a common multiple, but not the one the question needs.' },
    ];
    for (let i = 1; i < opts.length; i++) while (opts.slice(0, i).some((x) => x.html === opts[i].html)) opts[i] = fallback.shift();
    const sh = shuffleOptions(r, opts, 0);
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
          ? `Factors of ${a}: ${list(factors(a))}. Factors of ${b}: ${list(factors(b))}. Take the greatest common one${hard ? `, then divide ${a} by it` : ''}.`
          : `Multiples of ${a}: ${a}, ${2 * a}, ${3 * a}, … Multiples of ${b}: ${b}, ${2 * b}, ${3 * b}, … Take the least common one${hard ? `, then divide it by ${a}` : ''}.`,
      ],
      hintEs:
        'Pregúntate: ¿estoy repartiendo cosas en grupos iguales (un número que divide a los dos) o estoy esperando a que sucesos que se repiten vuelvan a coincidir (un número en el que caben los dos)?',
      solution: `<p>${
        isGcf
          ? `Making identical groups with nothing left over means the group count must divide both ${a} and ${b}. That is a <b>GCF</b> problem: GCF = <b>${gcd(a, b)}</b>.${hard ? ` Each kit then gets ${a} ÷ ${gcd(a, b)} = <b>${a / gcd(a, b)}</b> of the first item.` : ''}`
          : `Repeating events line up at a time that both cycle lengths divide into. That is an <b>LCM</b> problem: LCM = <b>${lcm(a, b)}</b>.${hard ? ` By then the first event has happened ${lcm(a, b)} ÷ ${a} = <b>${lcm(a, b) / a}</b> times.` : ''}`
      } A good explanation names which number has to divide which.</p>`,
      feedback: {
        correct: isGcf ? 'Correct. Sharing into identical groups is a GCF problem.' : 'Correct. Repeating events line up at the LCM.',
        wrong(ans0, d) {
          if (!d.wroteEnough) return 'Write a few more words. Say whether you are dividing into groups or waiting for events to line up.';
          const why = sh.options[ans0.check] && sh.options[ans0.check].why;
          if (why) return `Your explanation is in. For the check: ${why}`;
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
  const U = RX.U6;
  const hl = V.hl;
  const VARS = ['x', 'n', 'm', 'k', 'y'];
  const PROPS = ['commutative', 'associative', 'distributive', 'identity'];
  /** A second variable different from v. */
  const other = (v) => (v === 'y' ? 'x' : 'y');
  /** Coefficient as written in front of a variable: 1 is not written. */
  const co = (n, v) => (n === 1 ? v : `${n}${v}`);

  // ---------- Name the property used to rewrite (cloze) ----------
  G.define('e8_propertyCloze', (r, o) => {
    const hard = !!o.hard;
    const v = r.pick(VARS);
    const a = r.int(2, 9),
      b = r.int(2, 9),
      c = r.int(2, 6);
    const cases = hard
      ? [
          // whole expressions, and the distributive property read backward
          { from: `${a}${v} + ${b} + ${c}${v}`, to: `${a}${v} + ${c}${v} + ${b}`, prop: 'commutative', op: 'addition', why: `only the order of the terms ${b} and ${c}${v} changed` },
          { from: `(${a}${v} + ${b}) + ${c}`, to: `${a}${v} + (${b} + ${c})`, prop: 'associative', op: 'addition', why: 'only the grouping of the addends changed' },
          { from: `${c}(${a}${v})`, to: `(${c} · ${a})${v}`, prop: 'associative', op: 'multiplication', why: 'only the grouping of the factors changed' },
          {
            from: `${c}${v} + ${c * b}`,
            to: `${c}(${v} + ${b})`,
            prop: 'distributive',
            op: 'multiplication over addition',
            why: `the common factor ${c} was taken out of each term (the property used backward)`,
          },
          { from: `${a}${v} · 1`, to: `${a}${v}`, prop: 'identity', op: 'multiplication', why: 'multiplying by 1 does not change a value' },
          { from: `${v} · ${a} · ${b}`, to: `${a} · ${v} · ${b}`, prop: 'commutative', op: 'multiplication', why: 'only the order of the factors changed' },
        ]
      : [
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
    const opChoices = k.prop === 'distributive' || hard ? r.shuffle(['multiplication over addition', 'addition', 'multiplication']) : r.shuffle(['addition', 'multiplication']);
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
      hintEs:
        'Conmutativa: cambia el orden. Asociativa: cambia la agrupación (los paréntesis). Distributiva: un factor multiplica a cada término dentro de los paréntesis. Identidad: sumar 0 o multiplicar por 1.',
      solution: `<p>${k.from} = ${k.to} by the <b>${k.prop} property of ${k.op}</b>, because ${k.why}. Properties let the Foundry rewrite an expression into an equivalent one.</p>`,
      feedback: {
        correct: `Correct. ${k.from} = ${k.to} is the ${k.prop} property.`,
        wrong(ans, dt) {
          if (dt.wrong.includes(0)) {
            const said = propChoices[ans[0]];
            if (said === 'commutative' && k.prop === 'associative') return `The order stayed the same; only the parentheses moved. That is grouping, not order.`;
            if (said === 'associative' && k.prop === 'commutative') return `No parentheses moved here; the terms traded places. That is order, not grouping.`;
            return `Look at what changed: ${k.why}. Which property describes that?`;
          }
          return k.prop === 'distributive'
            ? `The distributive property links two operations: multiplication over addition.`
            : `Look at the operation sign between the parts: that tells you whether it is a property of addition or multiplication.`;
        },
      },
    };
  });

  // ---------- Rewrite with a property (mc) ----------
  G.define('e8_rewriteMc', (r, o) => {
    const hard = !!o.hard;
    const v = r.pick(VARS);
    const a = r.int(2, 6),
      b = r.int(3, 9), // b >= 3 keeps a × b distinct from a + b in the distractors
      c = r.int(1, 9),
      d = r.int(2, 7);
    const kind = hard ? r.pick(['mixMul', 'loneVar']) : r.pick(['assocMul', 'commAdd', 'commMul']);
    let text, okText, wrongs, prop, h2, h3, how;
    if (kind === 'assocMul') {
      text = `${a}(${b}${v})`;
      okText = `${a * b}${v}`;
      prop = 'associative property of multiplication';
      wrongs = [
        { html: `${a + b}${v}`, why: `${a}(${b}${v}) is ${a} × ${b} × ${v}. Multiply the factors ${a} and ${b}; do not add them.` },
        { html: `${a}${v} + ${b}`, why: `There is no addition inside the parentheses. ${b}${v} is a single product, so ${a} multiplies all of it.` },
        { html: `${a * b}${v}${v}`, why: `There is only one ${v}. Regroup the factors: (${a} · ${b}) · ${v}.` },
      ];
      h2 = `Group the number factors together: (${a} · ${b}) · ${v}.`;
      h3 = `Multiply ${a} × ${b} to get the coefficient of ${v}.`;
      how = `Regroup the factors so the numbers multiply first: ${a} × ${b} = ${a * b}.`;
    } else if (kind === 'commAdd') {
      text = `${b} + ${v} + ${c}`;
      okText = `${v} + ${b + c}`;
      prop = 'commutative and associative properties of addition';
      wrongs = [
        { html: `${b + c}${v}`, why: `${b} and ${c} are added to ${v}, not multiplied. A constant cannot be combined into the coefficient.` },
        { html: `${b}${v} + ${c}`, why: `${b} + ${v} means add. Reordering does not turn addition into multiplication.` },
        { html: `${v} + ${b * c}`, why: `The constants are added, not multiplied: ${b} + ${c} = ${b + c}.` },
      ];
      h2 = `Reorder so the constants are together: ${v} + (${b} + ${c}).`;
      h3 = `Add the two constants. The ${v} stays as it is.`;
      how = `Reorder and regroup to add the constants: ${b} + ${c} = ${b + c}.`;
    } else if (kind === 'commMul') {
      text = `${v} · ${a} · ${b}`;
      okText = `${a * b}${v}`;
      prop = 'commutative and associative properties of multiplication';
      wrongs = [
        { html: `${v} + ${a * b}`, why: `The dots mean multiply. The factors can be reordered, but the operation stays multiplication.` },
        { html: `${a + b}${v}`, why: `${a} and ${b} are multiplied together: ${a} × ${b} = ${a * b}.` },
        { html: `${a}${v} + ${b}${v}`, why: `That is ${a}${v} plus ${b}${v}, which combines to ${a + b}${v}. The original is a product of three factors.` },
      ];
      h2 = `Group the number factors together: (${a} · ${b}) · ${v}.`;
      h3 = `Multiply ${a} × ${b} to get the coefficient of ${v}.`;
      how = `Reorder and regroup the factors so the numbers multiply first: ${a} × ${b} = ${a * b}.`;
    } else if (kind === 'mixMul') {
      // regroup a product, then combine like terms
      text = `${a}(${b}${v}) + ${c} + ${d}${v}`;
      okText = `${a * b + d}${v} + ${c}`;
      prop = 'associative property of multiplication, then the commutative property of addition to combine like terms';
      wrongs = [
        { html: `${a + b + d}${v} + ${c}`, why: `${a}(${b}${v}) is a product: ${a} × ${b} = ${a * b}. Multiply those factors before combining.` },
        { html: `${a * b + d + c}${v}`, why: `${c} is a constant, so it cannot join the ${v}-terms.` },
        { html: `${a * b}${v} + ${d + c}`, why: `${d}${v} is a ${v}-term. It combines with ${a * b}${v}, not with the constant ${c}.` },
      ];
      h2 = `${a}(${b}${v}) = (${a} · ${b})${v} = ${a * b}${v}. Then move ${d}${v} next to it.`;
      h3 = `Add the coefficients of the two ${v}-terms. Keep ${c} as the constant.`;
      how = `Regroup ${a}(${b}${v}) as ${a * b}${v}, then reorder and combine the ${v}-terms: ${a * b} + ${d} = ${a * b + d}.`;
    } else {
      // a lone variable counts as one of that variable
      text = `${b} + ${v} + ${c} + ${d}${v}`;
      okText = `${d + 1}${v} + ${b + c}`;
      prop = 'commutative and associative properties of addition';
      wrongs = [
        { html: `${d}${v} + ${b + c}`, why: `The lone ${v} counts as 1${v}. It combines with ${d}${v} to make ${d + 1}${v}.` },
        { html: `${b + c + d + 1}${v}`, why: `${b} and ${c} are constants, so they cannot join the ${v}-terms.` },
        { html: `${d + 1}${v} + ${b * c}`, why: `The constants are added, not multiplied: ${b} + ${c} = ${b + c}.` },
      ];
      h2 = `Reorder so like terms sit together: (${v} + ${d}${v}) + (${b} + ${c}).`;
      h3 = `A lone ${v} has a coefficient of 1. Add the ${v}-coefficients, then add the constants.`;
      how = `Reorder and regroup: ${v} + ${d}${v} = ${d + 1}${v} and ${b} + ${c} = ${b + c}.`;
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
        hard
          ? 'First multiply the number factors in each product. Then reorder so like terms sit together, and combine them. The constant stays separate.'
          : 'The commutative property lets you reorder; the associative property lets you regroup. Neither one changes the operation.',
        h2,
        h3,
      ],
      hintEs: hard
        ? 'Primero multiplica los factores numéricos de cada producto. Luego cambia el orden para juntar los términos semejantes y combínalos. La constante queda aparte.'
        : 'La propiedad conmutativa te deja cambiar el orden y la asociativa te deja cambiar la agrupación. Ninguna de las dos cambia la operación.',
      solution: `<p>${text} = <b>${okText}</b> by the ${prop}. ${how} The operations never change, only the order or grouping.</p>`,
      feedback: { correct: `Correct. ${text} = ${okText}.`, wrong: U.whyWrong(sh.options, 'Reorder and regroup without changing any operation, then combine like terms.') },
    };
  });

  // ---------- Distributive property with numbers (num) ----------
  G.define('e8_distributeNumber', (r, o) => {
    const hard = !!o.hard;
    const name = r.pick(NAMES);
    const kind = hard ? r.pick(['big', 'diff']) : r.pick(['mental', 'expand']);
    let a, b, c, text, op;
    if (kind === 'mental') {
      a = r.int(3, 9);
      const n = r.int(12, 49);
      b = Math.floor(n / 10) * 10;
      c = n % 10 || 5;
      text = `${a} × ${b + c}`;
      op = '+';
    } else if (kind === 'expand') {
      a = r.int(3, 9);
      b = r.int(2, 9);
      c = r.int(2, 9);
      text = `${a}(${b} + ${c})`;
      op = '+';
    } else if (kind === 'big') {
      // a × (100 + c)
      a = r.int(4, 9);
      b = 100;
      c = r.int(2, 9);
      text = `${a} × ${b + c}`;
      op = '+';
    } else {
      // a × (b − c) with b a friendly number
      a = r.int(4, 9);
      b = r.pick([50, 100]);
      c = r.int(1, 3);
      text = `${a} × ${b - c}`;
      op = '−';
    }
    const val = op === '+' ? a * (b + c) : a * (b - c);
    const sum = op === '+' ? b + c : b - c;
    const prompt =
      kind === 'mental'
        ? `<p>${name} must find ${hl(text)} without a calculator. Break ${b + c} into ${b} + ${c} and use the distributive property: ${a}(${b} + ${c}) = ${a} × ${b} + ${a} × ${c}.</p><p>What is ${text}?</p>`
        : kind === 'expand'
          ? `<p>${name} checks a plate that reads ${hl(text)}. Use the distributive property to find its value: multiply ${a} by each addend, then add.</p><p>What is the value of ${text}?</p>`
          : `<p>${name} must find ${hl(text)} without a calculator. Rewrite ${sum} as a sum or difference with a friendly number, then use the distributive property.</p><p>What is ${text}?</p>`;
    return {
      type: 'num',
      skill: 'properties',
      lesson: '6-8',
      title: kind === 'mental' || hard ? 'Multiply with the distributive property' : 'Distribute, then add',
      prompt,
      answer: val,
      hints: [
        `The distributive property says ${a}(${b} ${op} ${c}) = ${a} × ${b} ${op} ${a} × ${c}. Multiply ${a} by each part.`,
        `${sum} = ${b} ${op} ${c}. ${a} × ${b} = ${a * b} and ${a} × ${c} = ${a * c}.`,
        `${a * b} ${op} ${a * c} = ?`,
      ],
      hintEs: `La propiedad distributiva dice que ${a}(${b} ${op} ${c}) = ${a} × ${b} ${op} ${a} × ${c}. Multiplica ${a} por cada parte.`,
      solution: `<p>${a}(${b} ${op} ${c}) = ${a} × ${b} ${op} ${a} × ${c} = ${a * b} ${op} ${a * c} = <b>${val}</b>. Check: ${b} ${op} ${c} = ${sum} and ${a} × ${sum} = ${val}. Distributing gives the same value because ${a} multiplies every part.</p>`,
      feedback: {
        correct: `Correct. ${a} × ${b} ${op} ${a} × ${c} = ${val}.`,
        wrong(ans, dt) {
          const w = dt.value;
          if (op === '+' && w === a * b + c) return `You distributed ${a} to only one part. ${a} must multiply both ${b} and ${c}: ${a * b} + ${a * c}.`;
          if (op === '−' && w === a * b - c) return `You subtracted only ${c}. ${a} must multiply ${c} too: ${a * b} − ${a * c}.`;
          if (op === '−' && w === a * b + a * c) return `${sum} is ${b} MINUS ${c}, so subtract the second product: ${a * b} − ${a * c}.`;
          if (w === a + b + c) return `${a}(${b} + ${c}) means multiply ${a} by the sum. Do not add ${a}.`;
          if (w === a * b * c) return `Inside the parentheses is a sum, so distribute: ${a} × ${b} + ${a} × ${c}.`;
          return `Multiply ${a} by each part separately, then ${op === '+' ? 'add' : 'subtract'} the two products.`;
        },
      },
    };
  });

  // ---------- Sort: equivalent to a(x + b) or not (sort) ----------
  G.define('e8_sortEquivalent', (r, o) => {
    const hard = !!o.hard;
    const v = r.pick(VARS);
    const a = r.int(2, 6),
      b = r.int(2, 9),
      k = hard ? r.pick([2, 3, 4, 5].filter((x) => x !== a)) : 1;
    const inner = `${co(k, v)} + ${b}`;
    const text = `${a}(${inner})`;
    const f = (x) => a * (k * x + b);
    const items = hard
      ? r.shuffle([
          { html: `${a * k}${v} + ${a * b}`, bin: 0, val: f(1) },
          { html: `${a * b} + ${a * k}${v}`, bin: 0, val: f(1) },
          { html: `(${b} + ${k}${v})${a}`, bin: 0, val: f(1) },
          { html: `${a * k}${v} + ${b}`, bin: 1, val: a * k + b, why: `distributes ${a} to only the first term` },
          { html: `${a + k}${v} + ${a * b}`, bin: 1, val: a + k + a * b, why: `adds ${a} and ${k} instead of multiplying them` },
          { html: `${k}${v} + ${a * b}`, bin: 1, val: k + a * b, why: `never multiplies ${k}${v} by ${a}` },
        ])
      : r.shuffle([
          { html: `${a}${v} + ${a * b}`, bin: 0, val: f(1) },
          { html: `${a * b} + ${a}${v}`, bin: 0, val: f(1) },
          { html: `${a}(${b} + ${v})`, bin: 0, val: f(1) },
          { html: `${a}${v} + ${b}`, bin: 1, val: a + b, why: `forgot to multiply ${b} by ${a}` },
          { html: `${a + b}${v}`, bin: 1, val: a + b, why: `added ${b} to the coefficient` },
          { html: `(${a} + ${v})${b}`, bin: 1, val: (a + 1) * b, why: `multiplies ${b} by the sum instead of ${a}` },
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
        `Distribute: ${a}(${inner}) = ${a * k}${v} + ${a * b}. Reordering terms or addends keeps an expression equivalent.`,
        `Test ${v} = 1: ${text} = ${f(1)}. Any equivalent expression must also give ${f(1)}.`,
        `Evaluate each card at ${v} = 1 and compare it with ${f(1)}.`,
      ],
      hintEs: `Aplica la propiedad distributiva: ${a}(${inner}) = ${a * k}${v} + ${a * b}. Cambiar el orden de los términos o de los sumandos mantiene la expresión equivalente.`,
      solution: `<p>${text} = <b>${a * k}${v} + ${a * b}</b> by the distributive property. The other equivalent cards are the same terms in a different order. ${items
        .filter((it) => it.bin === 1)
        .map((it) => `${it.html} ${it.why} (it gives ${it.val} at ${v} = 1, not ${f(1)})`)
        .join('; ')}.</p>`,
      feedback: {
        correct: 'Correct. Distributing and reordering keep expressions equivalent; changing which numbers get multiplied does not.',
        wrong(ans, dt) {
          const it = items[(dt.wrong || [])[0]];
          if (!it) return `Distribute first: ${text} = ${a * k}${v} + ${a * b}. Then compare.`;
          if (it.bin === 0) return `${it.html} is equivalent. It is ${a * k}${v} + ${a * b} or ${text} with its parts in a different order.`;
          return `${it.html} ${it.why}. At ${v} = 1 it gives ${it.val}, but ${text} gives ${f(1)}.`;
        },
      },
    };
  });

  // ---------- Expand with the distributive property (blanks + area model) ----------
  G.define('e8_expand', (r, o) => {
    const hard = !!o.hard;
    const v = r.pick(VARS);
    const name = r.pick(NAMES);
    if (hard) {
      // a variable coefficient inside, and either a second variable or a subtraction
      const w = other(v);
      const a = r.int(3, 9),
        k = r.int(2, 5);
      const form = r.pick(['twoVar', 'minus', 'plus']);
      const m = r.int(2, 6),
        b = r.int(2, 12);
      const inner = form === 'twoVar' ? `${k}${v} + ${co(m, w)}` : `${k}${v} ${form === 'minus' ? '−' : '+'} ${b}`;
      const text = `${a}(${inner})`;
      const c1 = a * k,
        c2 = form === 'twoVar' ? a * m : a * b;
      const second = form === 'twoVar' ? `${co(m, w)}` : String(b);
      const sign = form === 'minus' ? '−' : '+';
      const tv = form === 'minus' ? b : 1; // keeps every check value positive
      return {
        type: 'blanks',
        skill: 'distributive',
        lesson: '6-8',
        title: form === 'twoVar' ? 'Expand (two variables)' : 'Expand (two coefficients)',
        prompt: `<p>${name} must expand ${hl(text)} so each part of the plate can be read.</p><p>Use the distributive property to write an equivalent expression without parentheses.</p>`,
        fields: [
          { label: `coefficient of ${v}`, answer: c1, width: 'xs' },
          { label: form === 'twoVar' ? `coefficient of ${w}` : 'constant', answer: c2, width: 'xs' },
        ],
        template: form === 'twoVar' ? `${text} = {0}${v} + {1}${w}` : `${text} = {0}${v} ${sign} {1}`,
        hints: [
          `Distribute: multiply ${a} by each term inside the parentheses. Keep the ${sign} sign between the two products.`,
          `${a} × ${k}${v} = (${a} × ${k})${v}. Multiply the numbers and keep the ${v}.`,
          `Now multiply ${a} by ${second}, then write the two products with ${sign} between them.`,
        ],
        hintEs: `Aplica la propiedad distributiva: multiplica ${a} por cada término dentro de los paréntesis. Deja el signo ${sign} entre los dos productos.`,
        solution: `<p>${text} = ${a} · ${k}${v} ${sign} ${a} · ${second} = <b>${c1}${v} ${sign} ${form === 'twoVar' ? `${c2}${w}` : c2}</b>. Check with ${v} = ${tv}${form === 'twoVar' ? ` and ${w} = 1` : ''}: ${text} = ${form === 'twoVar' ? a * (k * tv + m) : form === 'minus' ? a * (k * tv - b) : a * (k * tv + b)} and the expanded form gives ${form === 'minus' ? c1 * tv - c2 : c1 * tv + c2}.</p>`,
        feedback: {
          correct: `Correct. ${text} = ${c1}${v} ${sign} ${form === 'twoVar' ? `${c2}${w}` : c2}.`,
          wrong(ans) {
            const x = parseNum(ans[0]),
              y = parseNum(ans[1]);
            const s2 = form === 'twoVar' ? m : b;
            if (x === c1 && y === s2) return `You distributed to only one term. ${a} must also multiply ${second}.`;
            if (x === k && y === c2) return `You distributed to only one term. ${a} must also multiply ${k}${v}: ${a} × ${k}.`;
            if (x === a + k) return `${a} × ${k}${v} means multiply ${a} by ${k}, not add them.`;
            if (y === a + s2) return `Distributing means multiply. ${a} × ${s2}, not ${a} + ${s2}.`;
            return `Multiply ${a} by each term inside: ${a} × ${k}${v} and ${a} × ${second}.`;
          },
        },
      };
    }
    const a = r.int(2, 6);
    const b = r.pick([2, 3, 4, 5, 6, 7, 8, 9].filter((x) => x !== a));
    const text = `${a}(${v} + ${b})`;
    const coef = a,
      cons = a * b;
    const svg = V.areaModel({
      rows: [String(a)],
      cols: [v, String(b)],
      cells: [['', '']],
      aria: `Area model with one row labeled ${a} and columns labeled ${v} and ${b}`,
    });
    return {
      type: 'blanks',
      skill: 'distributive',
      lesson: '6-8',
      title: 'Expand the expression',
      prompt: `<p>${name} must expand ${hl(text)} so each part of the plate can be read.</p>${svg}<p>Use the distributive property to write an equivalent expression without parentheses.</p>`,
      fields: [
        { label: `coefficient of ${v}`, answer: coef, width: 'xs' },
        { label: 'constant', answer: cons, width: 'xs' },
      ],
      template: `${text} = {0}${v} + {1}`,
      hints: [
        `Distribute: multiply ${a} by each term inside the parentheses. In the area model, each rectangle is one product.`,
        `${a} × ${v} = ${coef}${v}. That fills the first rectangle.`,
        `The second rectangle is ${a} by ${b}. Multiply, then write the two products with a plus sign between them.`,
      ],
      hintEs: `Aplica la propiedad distributiva: multiplica ${a} por cada término dentro de los paréntesis. En el modelo de área, cada rectángulo es un producto.`,
      solution: `<p>${text} = ${a} · ${v} + ${a} · ${b} = <b>${coef}${v} + ${cons}</b>. The area model shows why: the big rectangle is split into two smaller ones whose areas add. Check with ${v} = 1: ${text} = ${a * (1 + b)} and ${coef}(1) + ${cons} = ${coef + cons}.</p>`,
      feedback: {
        correct: `Correct. ${text} = ${coef}${v} + ${cons}.`,
        wrong(ans) {
          const x = parseNum(ans[0]),
            y = parseNum(ans[1]);
          if (x === coef && y === b) return `You distributed to only one term. ${a} must also multiply ${b}: the second rectangle is ${a} by ${b}.`;
          if (x === 1 && y === cons) return `You distributed to only one term. ${a} must also multiply ${v}: ${a} × ${v} = ${a}${v}.`;
          if (x === a + 1 || y === a + b) return `Distributing means multiply, not add. ${a} × ${v} and ${a} × ${b}.`;
          return `Multiply ${a} by each term inside: ${a} × ${v} and ${a} × ${b}.`;
        },
      },
    };
  });

  // ---------- Factor with the GCF (blanks, template) ----------
  G.define('e8_factor', (r, o) => {
    const hard = !!o.hard;
    const v = r.pick(VARS);
    const name = r.pick(NAMES);
    if (hard) {
      // three terms: two variable terms and a constant
      const w = other(v);
      let g, p, q, s;
      for (let tries = 0; tries < 200; tries++) {
        g = r.pick([3, 4, 5, 6, 8, 9]);
        p = r.int(1, 6);
        q = r.int(1, 7);
        s = r.int(1, 9);
        if (gcd(gcd(p, q), s) === 1 && p !== q && q !== s && p !== s && g * Math.max(p, q, s) <= 72) break;
      }
      if (!(gcd(gcd(p, q), s) === 1 && p !== q && q !== s && p !== s)) [g, p, q, s] = [6, 2, 3, 5];
      const A = g * p,
        B = g * q,
        C = g * s;
      const text = `${A}${v} + ${B}${w} + ${C}`;
      const common = [];
      for (let k = 2; k < g; k++) if (g % k === 0) common.push(k);
      return {
        type: 'blanks',
        skill: 'distributive',
        lesson: '6-8',
        title: 'Factor a three-term sum',
        prompt: `<p>${name} must make the plate ${hl(text)} compact. Factor it using the <b>greatest common factor</b> of all three terms.</p><p>Write the equivalent expression as a product.</p>`,
        fields: [
          { label: 'GCF', answer: g, width: 'xs' },
          { label: `coefficient of ${v}`, answer: p, width: 'xs' },
          { label: `coefficient of ${w}`, answer: q, width: 'xs' },
          { label: 'constant', answer: s, width: 'xs' },
        ],
        template: `${text} = {0}({1}${v} + {2}${w} + {3})`,
        hints: [
          `Find the GCF of ${A}, ${B}, and ${C}. That number goes outside the parentheses.`,
          `The GCF of ${A}, ${B}, and ${C} is ${g}. Divide each of the three terms by ${g}.`,
          `Write the three quotients inside the parentheses, keeping each variable with its term. Distribute back to check.`,
        ],
        hintEs: `Halla el máximo común divisor (MCD) de ${A}, ${B} y ${C}. Ese número va fuera de los paréntesis.`,
        solution: `<p>The GCF of ${A}, ${B}, and ${C} is ${g}. Dividing each term by ${g}: ${A}${v} ÷ ${g} = ${co(p, v)}, ${B}${w} ÷ ${g} = ${co(q, w)}, and ${C} ÷ ${g} = ${s}. So ${text} = <b>${g}(${co(p, v)} + ${co(q, w)} + ${s})</b>. Check by distributing: ${g} × ${p} = ${A}, ${g} × ${q} = ${B}, ${g} × ${s} = ${C}.</p>`,
        feedback: {
          correct: `Correct. ${text} = ${g}(${co(p, v)} + ${co(q, w)} + ${s}).`,
          wrong(ans) {
            const [x, y, z, u] = ans.map(parseNum);
            if (x != null && common.includes(x) && y === A / x && z === B / x && u === C / x)
              return `${x} is a common factor, but not the greatest. The terms inside still share a factor. Use the GCF, ${g}.`;
            if (x != null && x !== g && x === gcd(A, B)) return `${x} divides ${A} and ${B}, but not ${C}. The GCF must divide all three terms.`;
            if (x === g && (y !== p || z !== q || u !== s)) return `The GCF is right. Divide EACH term by ${g}: ${A} ÷ ${g}, ${B} ÷ ${g}, and ${C} ÷ ${g}.`;
            return `Find the GCF of ${A}, ${B}, and ${C}, then divide each term by it. Distribute back to check.`;
          },
        },
      };
    }
    let g, p, q;
    for (let tries = 0; tries < 100; tries++) {
      g = r.pick([2, 3, 4, 5, 6]);
      p = r.int(1, 5);
      q = r.int(1, 6);
      if (gcd(p, q) === 1 && p !== q) break;
    }
    const A = g * p,
      B = g * q;
    const text = `${A}${v} + ${B}`;
    const common = [];
    for (let k = 2; k < g; k++) if (A % k === 0 && B % k === 0) common.push(k);
    return {
      type: 'blanks',
      skill: 'distributive',
      lesson: '6-8',
      title: 'Factor using the GCF',
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
        `Write the two quotients inside the parentheses, keeping the ${v} with its term. Distribute back to check.`,
      ],
      hintEs: `Halla el máximo común divisor (MCD) de ${A} y ${B}. Ese número va fuera de los paréntesis.`,
      solution: `<p>The GCF of ${A} and ${B} is ${g}. ${A}${v} = ${g} · ${co(p, v)} and ${B} = ${g} · ${q}, so ${text} = <b>${g}(${co(p, v)} + ${q})</b>. Check by distributing: ${g} × ${co(p, v)} = ${A}${v} and ${g} × ${q} = ${B}. Factoring is the distributive property used backward.</p>`,
      feedback: {
        correct: `Correct. ${text} = ${g}(${co(p, v)} + ${q}). Distribute back to check.`,
        wrong(ans) {
          const x = parseNum(ans[0]),
            y = parseNum(ans[1]),
            z = parseNum(ans[2]);
          if (x != null && common.includes(x) && y === A / x && z === B / x) return `${x} is a common factor, but not the greatest. ${y}${v} + ${z} still shares a factor. Use the GCF, ${g}.`;
          if (x === g && y === A && z === q) return `Divide BOTH terms by ${g}. ${A}${v} ÷ ${g} = ${co(p, v)}.`;
          if (x === g && y === p && z === B) return `Divide BOTH terms by ${g}. ${B} ÷ ${g} = ${q}.`;
          if (x === g && (y === A - g || z === B - g)) return `Factoring divides, it does not subtract. ${A} ÷ ${g} and ${B} ÷ ${g}.`;
          return `Find the GCF of ${A} and ${B}, then divide each term by it. Distribute back to check.`;
        },
      },
    };
  });

  // ---------- Perimeter expressions (ms + rectangle) ----------
  G.define('e8_perimeter', (r, o) => {
    const hard = !!o.hard;
    const v = r.pick(VARS);
    const k = r.pick([1, 2, 3]);
    const b = r.int(2, 9);
    const e = hard ? r.int(1, 6) : 0; // hard: the length is k·v + e
    const side = hard ? `${co(k, v)} + ${e}` : co(k, v);
    const sideP = hard ? `(${side})` : side;
    const svg = V.rectangle(8, 4, { w: side, h: String(b), aria: `Rectangle with length ${side} and width ${b}` });
    const name = r.pick(NAMES);
    const thing = r.pick(['brass plate', 'furnace door', 'gear housing', 'window frame']);
    const opts = hard
      ? [
          { html: `2(${side} + ${b})`, ok: true },
          { html: `${2 * k}${v} + ${2 * (e + b)}`, ok: true },
          { html: `${sideP} + ${b} + ${sideP} + ${b}`, ok: true },
          { html: `${2 * k}${v} + ${e + 2 * b}`, why: `The length ${side} appears twice, so its constant ${e} is doubled too: 2 × ${e} + 2 × ${b} = ${2 * (e + b)}.` },
          { html: `2(${side}) + ${b}`, why: `Both widths count. There are two widths of ${b}, so add ${2 * b}, not ${b}.` },
          { html: `${2 * k}${v} + ${2 * e} + ${b}`, why: `The two lengths are doubled, but there are also two widths of ${b}.` },
        ]
      : [
          { html: `2(${side} + ${b})`, ok: true },
          { html: `${2 * k}${v} + ${2 * b}`, ok: true },
          { html: `${side} + ${b} + ${side} + ${b}`, ok: true },
          { html: `${side} + ${b}`, why: `That is only two of the four sides. A rectangle has two lengths and two widths.` },
          { html: `${2 * k}${v} + ${b}`, why: `Both sides must be doubled. There are two widths of ${b}, so the constant is ${2 * b}.` },
          { html: `${k * b}${v}`, why: `${side} × ${b} is the area, not the perimeter. Perimeter adds the side lengths.` },
        ];
    const sh = shuffleOptions(r, opts, [0, 1, 2]);
    const simp = hard ? `${2 * k}${v} + ${2 * (e + b)}` : `${2 * k}${v} + ${2 * b}`;
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
        `Adding the sides: ${sideP} + ${b} + ${sideP} + ${b}. Combine like terms to simplify.`,
        `The simplified sum can also be factored with the GCF 2. Look for every form that matches the sum of the four sides.`,
      ],
      hintEs: 'El perímetro es la distancia alrededor: suma los cuatro lados. Un rectángulo tiene dos largos y dos anchos.',
      solution: `<p>Perimeter = ${sideP} + ${b} + ${sideP} + ${b} = <b>${simp}</b> = <b>2(${side} + ${b})</b>. The three correct expressions are equivalent: adding the four sides, combining like terms, and factoring out the GCF 2 all describe the same distance.${hard ? ` Every part of each length is doubled, including the ${e}.` : ` ${k * b}${v} is the area, and ${side} + ${b} is only half the perimeter.`}</p>`,
      feedback: {
        correct: 'Correct. Combining like terms and factoring produce equivalent perimeter expressions.',
        wrong(ans, dt) {
          if (dt.extra && dt.extra.length) return sh.options[dt.extra[0]].why || 'That expression does not give the perimeter.';
          return `You missed an equivalent form. Adding the four sides, the simplified sum, and the factored form with 2 all give the perimeter.`;
        },
      },
    };
  });

  // ---------- Error: distributed to one term only (error) ----------
  G.define('e8_errorExpand', (r, o) => {
    const hard = !!o.hard;
    const name = r.pick(NAMES);
    const v = r.pick(VARS);
    const a = r.int(2, 9),
      b = r.pick([2, 3, 4, 5, 6, 7, 8, 9].filter((x) => x !== a));
    const k = hard ? r.pick([2, 3, 4, 5].filter((x) => x !== a)) : 1;
    const inner = `${co(k, v)} + ${b}`;
    const text = `${a}(${inner})`;
    const kind = hard ? r.pick(['oneTerm', 'coefAdd']) : r.pick(['oneTerm', 'added']);
    const work = kind === 'oneTerm' ? `${text} = ${a * k}${v} + ${b}` : kind === 'added' ? `${text} = ${a + 1}${v} + ${a + b}` : `${text} = ${a + k}${v} + ${a * b}`;
    const wrongVal1 = kind === 'oneTerm' ? a * k + b : kind === 'added' ? a + 1 + a + b : a + k + a * b;
    const okHtml =
      kind === 'oneTerm'
        ? `${name} distributed ${a} to only the first term. ${a} must multiply both ${co(k, v)} and ${b}.`
        : kind === 'added'
          ? `${name} added ${a} to each term instead of multiplying. Distributing means ${a} × ${v} and ${a} × ${b}.`
          : `${name} added ${a} + ${k} for the coefficient. ${a} × ${k}${v} means multiply: (${a} × ${k})${v}.`;
    const opts = [
      { html: okHtml, ok: true },
      {
        html: kind === 'oneTerm' ? `${name} should have added ${a} to ${b} instead.` : `${name} should have multiplied only the first term.`,
        why: kind === 'oneTerm' ? `Distributing means multiplying, not adding. ${a} × ${b} = ${a * b}.` : `The distributive property multiplies ${a} by every term inside the parentheses.`,
      },
      {
        html: `${name} should have multiplied all three numbers together to get ${a * k * b}${v}.`,
        why: `${co(k, v)} and ${b} are added inside the parentheses, so the result keeps two terms joined by +.`,
      },
      { html: 'The work is correct.', why: `Test ${v} = 1: ${text} = ${a * (k + b)}, but the work gives ${wrongVal1}.` },
    ];
    const sh = shuffleOptions(r, opts, 0);
    const fixIsCoef = kind === 'coefAdd';
    return {
      type: 'error',
      skill: 'distributive',
      lesson: '6-8',
      title: 'Find the mistake',
      prompt: `<p>${name} expanded ${hl(text)} at the forge. The plate came out wrong.</p><p>What is the mistake?</p>`,
      work,
      options: sh.options,
      answer: sh.answer,
      fix: fixIsCoef ? { label: `The correct coefficient of ${v} is`, answer: a * k } : { label: 'The correct constant term is', answer: a * b },
      hints: [
        `Picture an area model with one row labeled ${a} and two columns labeled ${co(k, v)} and ${b}. Each rectangle is a product.`,
        fixIsCoef ? `${a} × ${k}${v}: multiply the numbers ${a} and ${k}, and keep the ${v}.` : `${a} × ${co(k, v)} = ${a * k}${v}. ${a} × ${b} = ?`,
        `Test a value. At ${v} = 1, ${text} = ${a}(${k + b}) = ${a * (k + b)}. Does the student's expression give the same?`,
      ],
      hintEs: `Imagina un modelo de área con una fila marcada ${a} y dos columnas marcadas ${co(k, v)} y ${b}. Cada rectángulo es un producto.`,
      solution: `<p>${
        kind === 'oneTerm'
          ? `${name} multiplied ${a} by ${co(k, v)} but left ${b} alone.`
          : kind === 'added'
            ? `${name} added ${a} instead of multiplying.`
            : `${name} added the factors ${a} and ${k} instead of multiplying them.`
      } The distributive property multiplies ${a} by <b>each</b> term: ${text} = <b>${a * k}${v} + ${a * b}</b>. Check at ${v} = 1: ${a * (k + b)} both ways.</p>`,
      feedback: {
        correct: `Correct. ${text} = ${a * k}${v} + ${a * b}.`,
        wrong(ans, dt) {
          if (!dt.mistakeOk) return (sh.options[ans.mistake] && sh.options[ans.mistake].why) || `Check whether ${a} was multiplied by both terms.`;
          const x = parseNum(ans.fix);
          if (!fixIsCoef && x === b) return `That is the constant ${name} wrote. ${a} must multiply ${b}.`;
          if (!fixIsCoef && x === a + b) return `Distributing multiplies: ${a} × ${b}, not ${a} + ${b}.`;
          if (fixIsCoef && x === a + k) return `That repeats ${name}'s coefficient. Multiply ${a} × ${k}.`;
          return fixIsCoef ? `You found the mistake. For the fix: ${a} × ${k}.` : `You found the mistake. For the fix: ${a} × ${b}.`;
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
  const { G, V, gcd, round, simplify, shuffleOptions, NAMES, parseNum } = RX;
  const U = RX.U6;
  const hl = V.hl;
  const F = (a, b) => V.frac(a, b);
  const T = U.fracText;
  const MT = U.mixedText;
  const PT = U.powText;
  const SQ = U.supText(2);
  const sq = (x) => x * x;
  const VARS = ['x', 'n', 'm', 'k'];
  const distinct = (arr) => arr.filter((x, i) => arr.indexOf(x) === i);
  /** Coefficient as written in front of a variable: 1 is not written. */
  const co = (n, v) => (n === 1 ? v : `${n}${v}`);

  /** Proper fraction a/b in lowest terms with denominator from the pool. */
  function properFrac(r, pool) {
    const b = r.pick(pool);
    const choices = [];
    for (let a = 1; a < b; a++) if (gcd(a, b) === 1) choices.push(a);
    return [r.pick(choices), b];
  }

  // ---------- Mixed ÷ mixed story with a mixed-number quotient (blanks, template) ----------
  G.define('ec_mixedDivideStory', (r, o) => {
    const hard = !!o.hard;
    let w1, a1, b1, w2, a2, b2, n1, n2, qn, qd, mix;
    for (let tries = 0; tries < 400; tries++) {
      w1 = hard ? r.int(6, 15) : r.int(2, 9);
      [a1, b1] = properFrac(r, hard ? [3, 4, 5, 6, 8, 10, 12] : [2, 3, 4, 5, 6, 8]);
      w2 = hard ? r.int(2, 4) : r.int(1, 3);
      [a2, b2] = properFrac(r, hard ? [3, 4, 5, 6] : [2, 3, 4]);
      n1 = w1 * b1 + a1;
      n2 = w2 * b2 + a2;
      [qn, qd] = simplify(n1 * b2, b1 * n2);
      mix = U.toMixed(n1 * b2, b1 * n2);
      if (qd !== 1 && mix[0] >= 1 && mix[0] <= 9 && qd <= (hard ? 30 : 12) && (!hard || gcd(n1 * b2, b1 * n2) > 1)) break;
    }
    const [W, N, D] = mix;
    const name = r.pick(NAMES);
    const k = r.int(0, 2);
    const ctx = [
      [`A boiler pipe ${MT(w1, a1, b1)} meters long is cut into sections each ${MT(w2, a2, b2)} meters long.`, 'How many sections is that?', 'sections'],
      [`${name} has ${MT(w1, a1, b1)} gallons of coal oil. Each burner holds ${MT(w2, a2, b2)} gallons.`, 'How many burners can be filled?', 'burners'],
      [`A vault shift lasts ${MT(w1, a1, b1)} hours. Each inspection round takes ${MT(w2, a2, b2)} hours.`, 'How many rounds fit in the shift?', 'rounds'],
    ][k];
    return {
      type: 'blanks',
      skill: 'divide-mixed',
      lesson: '6-2',
      title: 'Challenge: two mixed numbers',
      xp: 20,
      prompt: hard
        ? `<p>${ctx[0]}</p><p>${ctx[1]} Write a division expression, evaluate it, and give the quotient as a mixed number in simplest form.</p>`
        : `<p>${ctx[0]}</p><p>${ctx[1]} Evaluate ${hl(MT(w1, a1, b1) + ' ÷ ' + MT(w2, a2, b2))} and write the quotient as a mixed number in simplest form.</p>`,
      fields: [
        { label: 'whole number', answer: W, width: 'xs' },
        { label: 'numerator', answer: N, width: 'xs' },
        { label: 'denominator', answer: D, width: 'xs' },
      ],
      template: 'Quotient = {0} and {1}/{2}',
      hints: [
        `Rewrite BOTH mixed numbers as fractions first: ${MT(w1, a1, b1)} = ${n1}/${b1} and ${MT(w2, a2, b2)} = ${n2}/${b2}.`,
        `Keep ${n1}/${b1}, change ÷ to ×, flip ${n2}/${b2} to ${b2}/${n2}: ${n1}/${b1} × ${b2}/${n2} = ${n1 * b2}/${b1 * n2}.`,
        `Simplify ${n1 * b2}/${b1 * n2} if you can. Then divide the numerator by the denominator: the quotient is the whole number and the remainder is the new numerator.`,
      ],
      hintEs: `Primero escribe LOS DOS números mixtos como fracciones: ${MT(w1, a1, b1)} = ${n1}/${b1} y ${MT(w2, a2, b2)} = ${n2}/${b2}.`,
      solution: `<p>Rewrite: ${U.mixed(w1, a1, b1)} = ${F(n1, b1)} and ${U.mixed(w2, a2, b2)} = ${F(n2, b2)}. Keep, Change, Flip: ${F(n1, b1)} × ${F(b2, n2)} = ${F(n1 * b2, b1 * n2)}${qn !== n1 * b2 ? ` = ${F(qn, qd)}` : ''} = <b>${U.mixed(W, N, D)}</b>. So ${W} full ${ctx[2]}, with ${T(N, D)} of one more. Both mixed numbers must be rewritten before anything is flipped.</p>`,
      feedback: {
        correct: `Correct. Rewrite both, flip only the divisor, multiply, then convert back: ${MT(W, N, D)}.`,
        wrong(ans) {
          const x = parseNum(ans[0]),
            y = parseNum(ans[1]),
            z = parseNum(ans[2]);
          if (x === W && y != null && z && Math.abs(y / z - N / D) < 1e-9) return 'Your mixed number is equivalent to the answer, but the fraction part is not in simplest form.';
          if (x == null || y == null || !z) return 'Fill in all three parts of the mixed number.';
          const val = x + y / z;
          if (Math.abs(val - w1 / w2) < 1e-6) return `You divided only the whole numbers. Rewrite each mixed number as a single fraction first.`;
          if (Math.abs(val - (n1 / b1) * (n2 / b2)) < 1e-6) return `You multiplied instead of dividing. Flip the divisor ${n2}/${b2} to ${b2}/${n2} first.`;
          if (Math.abs(val - (n2 * b1) / (b2 * n1)) < 1e-6) return `That is the reciprocal of the answer. Keep ${n1}/${b1} and flip the divisor.`;
          if (Math.abs(val - (w1 / w2 + a1 / b1 / (a2 / b2))) < 1e-6) return `You divided the whole numbers and the fractions separately. Rewrite both mixed numbers as improper fractions first.`;
          return `Rewrite: ${n1}/${b1} ÷ ${n2}/${b2}. Then ${n1}/${b1} × ${b2}/${n2}. Convert back to a mixed number.`;
        },
      },
    };
  });

  // ---------- Multi-step numerical expression with exponents (num) ----------
  G.define('ec_powerExpression', (r, o) => {
    const hard = !!o.hard;
    const a = r.int(2, 5),
      b = r.int(1, 4),
      c = r.int(2, 4),
      d = r.int(2, 6);
    const kind = hard ? r.int(3, 4) : r.int(0, 2);
    let text, value, steps, ltr, baseTimes;
    if (kind === 0) {
      text = `(${a} + ${b})${SQ} − ${PT(c, 2)} + ${d}`;
      value = sq(a + b) - sq(c) + d;
      steps = [`${a} + ${b} = ${a + b}`, `${PT(a + b, 2)} = ${sq(a + b)} and ${PT(c, 2)} = ${sq(c)}`, `${sq(a + b)} − ${sq(c)} = ${sq(a + b) - sq(c)}`, `${sq(a + b) - sq(c)} + ${d} = ${value}`];
      ltr = sq(a + b) - sq(c) + d;
      baseTimes = (a + b) * 2 - c * 2 + d;
    } else if (kind === 1) {
      text = `${a} × (${d} − 1)${SQ} + ${PT(c, 3)}`;
      value = a * sq(d - 1) + c * c * c;
      steps = [`${d} − 1 = ${d - 1}`, `${PT(d - 1, 2)} = ${sq(d - 1)} and ${PT(c, 3)} = ${c * c * c}`, `${a} × ${sq(d - 1)} = ${a * sq(d - 1)}`, `${a * sq(d - 1)} + ${c * c * c} = ${value}`];
      ltr = sq(a * (d - 1)) + c * c * c;
      baseTimes = a * (d - 1) * 2 + c * 3;
    } else if (kind === 2) {
      // (2³ + a) ÷ b2 × c where b2 divides (8 + a)
      const base8 = 8 + a;
      const divisors = [2, 3, 4, 5, 6].filter((k) => base8 % k === 0);
      const b2 = divisors.length ? r.pick(divisors) : 1;
      text = `(${PT(2, 3)} + ${a}) ÷ ${b2} × ${c}`;
      value = (base8 / b2) * c;
      steps = [`${PT(2, 3)} = 8`, `8 + ${a} = ${base8}`, `${base8} ÷ ${b2} = ${base8 / b2} (left to right, division first)`, `${base8 / b2} × ${c} = ${value}`];
      ltr = base8 / (b2 * c);
      baseTimes = ((6 + a) / b2) * c;
    } else if (kind === 3) {
      // nested grouping: k × [(a + b)² − c³]
      const k = r.int(2, 4);
      const aa = r.int(4, 7);
      const cc = r.int(2, 3);
      const inner = sq(aa + b) - cc ** 3;
      text = `${k} × [(${aa} + ${b})${SQ} − ${PT(cc, 3)}]`;
      value = k * inner;
      steps = [`${aa} + ${b} = ${aa + b}`, `${PT(aa + b, 2)} = ${sq(aa + b)} and ${PT(cc, 3)} = ${cc ** 3}`, `${sq(aa + b)} − ${cc ** 3} = ${inner}`, `${k} × ${inner} = ${value}`];
      ltr = k * sq(aa + b) - cc ** 3;
      baseTimes = k * ((aa + b) * 2 - cc * 3);
    } else {
      // 2^e + (a × t − u)² ÷ d, with d dividing the square
      const e = r.int(3, 5);
      let t, u, inner, dd;
      for (let tries = 0; tries < 60 && !dd; tries++) {
        t = r.int(2, 4);
        u = r.int(1, 3);
        inner = a * t - u;
        dd = [2, 3, 4].filter((x) => sq(inner) % x === 0).pop();
      }
      if (!dd) [t, u, inner, dd] = [2, 2, 2 * a - 2, 4];
      const ex = `${a} × ${t} − ${u}`;
      text = `${PT(2, e)} + (${ex})${SQ} ÷ ${dd}`;
      value = 2 ** e + sq(inner) / dd;
      steps = [`${ex} = ${inner}`, `${PT(2, e)} = ${2 ** e} and ${PT(inner, 2)} = ${sq(inner)}`, `${sq(inner)} ÷ ${dd} = ${sq(inner) / dd}`, `${2 ** e} + ${sq(inner) / dd} = ${value}`];
      ltr = (2 ** e + sq(inner)) / dd;
      baseTimes = 2 * e + (inner * 2) / dd;
    }
    const name = r.pick(NAMES);
    return {
      type: 'num',
      skill: 'order-ops',
      lesson: '6-4',
      title: hard ? 'Challenge: nested groups and powers' : 'Challenge: powers in a long expression',
      xp: 20,
      prompt: `<p>The boiler gauge is set by ${hl(text)}. ${name} needs the exact value.</p><p>Evaluate the expression.</p>`,
      answer: value,
      hints: [
        `Grouping symbols first${hard ? ' (innermost first)' : ''}, then every exponent, then × and ÷ left to right, then + and − left to right.`,
        `${steps[0]}. ${steps[1]}.`,
        `${steps.slice(0, -1).join('. ')}. One step left.`,
      ],
      hintEs: `Primero los símbolos de agrupación${hard ? ' (los de más adentro primero)' : ''}, luego cada exponente, luego × y ÷ de izquierda a derecha, y al final + y − de izquierda a derecha.`,
      solution: `<p>${text}: ${steps.map((s, i) => `Step ${i + 1}: ${s}`).join('. ')}. The value is <b>${value}</b>.</p>`,
      feedback: {
        correct: `Correct. ${text} = ${value}.`,
        wrong(ans, dt) {
          const v = dt.value;
          if (v != null && Math.abs(v - baseTimes) < 1e-6) return 'Check each power. An exponent counts factors: 3² = 3 × 3, 2³ = 2 × 2 × 2.';
          if (v != null && ltr !== value && Math.abs(v - ltr) < 1e-6)
            return kind === 2
              ? 'Multiply and divide left to right: the division comes first here.'
              : kind === 3
                ? `Finish everything inside the brackets before multiplying.`
                : kind === 4
                  ? 'Divide before you add: only the squared group is divided.'
                  : 'You worked straight across. Evaluate the exponent before multiplying.';
          return `Start with ${steps[0]}, then evaluate every power before you multiply, divide, add, or subtract.`;
        },
      },
    };
  });

  // ---------- Evaluate with two variables and an exponent (num) ----------
  G.define('ec_twoVariable', (r, o) => {
    const hard = !!o.hard;
    const [v, w] = r.pickN(VARS, 2);
    const a = r.int(2, 5),
      b = r.int(2, 6);
    const x = r.int(2, 6),
      y = r.int(1, 9);
    const kind = hard ? r.pick(['nested', 'decimal']) : r.pick(['sqPlus', 'sumSq', 'minus']);
    let text,
      value,
      sub,
      step,
      wrongs,
      xv = x,
      yv = y;
    if (kind === 'sqPlus') {
      text = `${a}${v}${SQ} + ${b}${w}`;
      value = a * sq(x) + b * y;
      sub = `${a}(${x})${SQ} + ${b}(${y})`;
      step = `${a} × ${sq(x)} + ${b * y} = ${a * sq(x)} + ${b * y}`;
      wrongs = [
        [sq(a * x) + b * y, `Square only ${v}, not the coefficient: ${v}² = ${x} × ${x} = ${sq(x)}, then multiply by ${a}.`],
        [a * x * 2 + b * y, `${v}² means ${v} × ${v}, not ${v} × 2.`],
      ];
    } else if (kind === 'sumSq') {
      text = `(${v} + ${w})${SQ} − ${a}${w}`;
      value = sq(x + y) - a * y;
      sub = `(${x} + ${y})${SQ} − ${a}(${y})`;
      step = `${PT(x + y, 2)} − ${a * y} = ${sq(x + y)} − ${a * y}`;
      wrongs = [
        [sq(x) + sq(y) - a * y, `(${v} + ${w})² means add first, then square the sum. It is not ${v}² + ${w}².`],
        [(x + y) * 2 - a * y, `Squaring means multiplying the sum by itself, not by 2.`],
      ];
    } else if (kind === 'minus') {
      // b·v² − w·v, kept positive with w < b·v
      yv = Math.min(y, b * x - 1);
      text = `${b}${v}${SQ} − ${w}${v}`;
      value = b * sq(x) - yv * x;
      sub = `${b}(${x})${SQ} − (${yv})(${x})`;
      step = `${b} × ${sq(x)} − ${yv * x} = ${b * sq(x)} − ${yv * x}`;
      wrongs = [
        [b * sq(x) - (yv + x), `${w}${v} means ${w} times ${v}: ${yv} × ${x} = ${yv * x}.`],
        [sq(b * x) - yv * x, `Square only ${v}: ${x}² = ${sq(x)}. Then multiply by ${b}.`],
      ];
    } else if (kind === 'nested') {
      // a(v + w)² − vw
      yv = r.int(1, 5);
      text = `${a}(${v} + ${w})${SQ} − ${v}${w}`;
      value = a * sq(x + yv) - x * yv;
      sub = `${a}(${x} + ${yv})${SQ} − (${x})(${yv})`;
      step = `${a} × ${sq(x + yv)} − ${x * yv} = ${a * sq(x + yv)} − ${x * yv}`;
      wrongs = [
        [sq(a * (x + yv)) - x * yv, `Square the sum first, then multiply by ${a}. The exponent belongs to (${v} + ${w}) only.`],
        [a * (sq(x) + sq(yv)) - x * yv, `(${v} + ${w})² means add first, then square: (${x} + ${yv})² = ${sq(x + yv)}.`],
        [a * sq(x + yv) - (x + yv), `${v}${w} means ${v} times ${w}: ${x} × ${yv} = ${x * yv}.`],
      ];
    } else {
      // decimal value for one variable: v² + a·w with w = 1.5, 2.5, …
      yv = r.pick([0.5, 1.5, 2.5, 3.5]);
      text = `${v}${SQ} + ${a}${w}`;
      value = round(sq(x) + a * yv, 2);
      sub = `(${x})${SQ} + ${a}(${yv})`;
      step = `${sq(x)} + ${round(a * yv, 2)}`;
      wrongs = [
        [round(x * 2 + a * yv, 2), `${v}² means ${v} × ${v}: ${x} × ${x} = ${sq(x)}.`],
        [round(sq(x) + a + yv, 2), `${a}${w} means ${a} times ${w}: ${a} × ${yv} = ${round(a * yv, 2)}.`],
      ];
    }
    const name = r.pick(NAMES);
    return {
      type: 'num',
      skill: 'evaluate-algebraic',
      lesson: '6-5',
      title: hard ? 'Challenge: two variables, three steps' : 'Challenge: two variables and a power',
      xp: 20,
      prompt: `<p>The vault plate reads ${hl(text)}. For this job, ${hl(`${v} = ${xv}`)} and ${hl(`${w} = ${yv}`)}.</p><p>${name} must evaluate the expression.${kind === 'decimal' ? ' Write a decimal if the answer is not a whole number.' : ''}</p>`,
      answer: value,
      hints: [
        'Substitute each variable with its value, using parentheses. Then follow the order of operations: exponents before multiplying, multiplying before adding or subtracting.',
        `${sub}.`,
        `${step}. One step left.`,
      ],
      hintEs: 'Sustituye cada variable por su valor, usando paréntesis. Luego sigue el orden de las operaciones: los exponentes antes de multiplicar y multiplicar antes de sumar o restar.',
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
  });

  // ---------- Match four pairs of equivalent expressions (match) ----------
  G.define('ec_equivalentHard', (r, o) => {
    const hard = !!o.hard;
    const v = r.pick(VARS);
    const w = v === 'x' ? 'n' : 'x';
    let items;
    for (let tries = 0; tries < 80; tries++) {
      const a = r.int(2, 5),
        b = r.int(1, 6),
        c = r.int(2, 6),
        d = r.int(1, 5),
        e = r.int(2, 4),
        f = r.int(2, 4),
        g = r.pick([2, 3, 4, 6]),
        h = r.int(2, 5),
        k2 = r.int(1, 6),
        s = r.int(1, 5);
      items = hard
        ? [
            { left: `${a}(${v} − ${b})`, right: `${a}${v} − ${a * b}`, how: 'distribute, keeping the minus sign' },
            { left: `${c}${v} + ${d}${w} + ${e}${v}`, right: `${c + e}${v} + ${d}${w}`, how: `combine only the ${v}-terms` },
            { left: `${f}(${v} + ${b}) − ${v}`, right: `${co(f - 1, v)} + ${f * b}`, how: 'distribute, then subtract one ' + v },
            { left: `${g * h}${v} + ${g * k2}${w} + ${g * s}`, right: `${g}(${h}${v} + ${co(k2, w)} + ${s})`, how: 'factor out the GCF of all three terms' },
          ]
        : [
            { left: `${a}(${v} + ${b})`, right: `${a}${v} + ${a * b}`, how: 'distribute' },
            { left: `${c}${v} + ${d} + ${e}${v}`, right: `${c + e}${v} + ${d}`, how: `combine the ${v}-terms` },
            { left: `${f}(${v} + 1) + ${v}`, right: `${f + 1}${v} + ${f}`, how: 'distribute, then combine' },
            { left: `${g * h}${v} + ${g * k2}`, right: `${g}(${h}${v} + ${k2})`, how: 'factor out the GCF' },
          ];
      const lefts = items.map((i) => i.left),
        rights = items.map((i) => i.right);
      const gcfOk = hard ? gcd(gcd(h, k2), s) === 1 : gcd(h, k2) === 1;
      if (gcfOk && distinct(lefts).length === 4 && distinct(rights).length === 4 && !lefts.some((l) => rights.includes(l))) break;
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
      prompt: `<p>Four plates on the left were rewritten into the four plates on the right. Match each expression to its equivalent form.</p><p class="muted">Expand, combine like terms, or factor. If you are stuck, test ${v} = 2${hard ? ` and ${w} = 1` : ''} on both sides.</p>`,
      left,
      right,
      pairs,
      hints: [
        'Simplify each left-hand expression: distribute any factor over the parentheses, then combine like terms.',
        `For ${items[0].left}, ${items[0].how}. For ${items[1].left}, ${items[1].how}.`,
        `For ${items[3].left}, ${items[3].how}. Check any pair by testing a value.`,
      ],
      hintEs: 'Simplifica cada expresión de la izquierda: aplica la propiedad distributiva a los paréntesis y luego combina los términos semejantes.',
      solution: `<p>${items.map((i) => `${i.left} = ${i.right}`).join('; ')}. Expanding, combining like terms, and factoring all produce equivalent expressions, and testing a value confirms each match.</p>`,
      feedback: {
        correct: 'Correct. Each pair has the same value for every value of the variable.',
        wrong(ans, dt) {
          const i = (dt.wrong || [])[0];
          const it = items[i] || items[0];
          return `Look at ${it.left} again: ${it.how}. Test ${v} = 2 if you are unsure.`;
        },
      },
    };
  });

  // ---------- GCF and LCM of the same numbers (blanks, two-col) ----------
  G.define('ec_gcfLcmBoth', (r, o) => {
    const hard = !!o.hard;
    let nums;
    for (let tries = 0; tries < 400; tries++) {
      if (hard) {
        const g0 = r.pick([2, 3, 4, 6]);
        const ks = r.pickN([2, 3, 4, 5, 6, 7], 3).sort((x, y) => x - y);
        const t = ks.map((k) => g0 * k);
        if (gcd(gcd(t[0], t[1]), t[2]) !== g0) continue;
        if (t.some((x, i) => t.some((y, j) => i !== j && y % x === 0))) continue;
        if (U.lcm(U.lcm(t[0], t[1]), t[2]) > 180) continue;
        nums = t;
      } else {
        const a = r.int(6, 30),
          b = r.int(8, 36);
        if (a === b || a % b === 0 || b % a === 0) continue;
        if (gcd(a, b) < 2) continue;
        if (U.lcm(a, b) > 120) continue;
        nums = [a, b];
      }
      break;
    }
    if (!nums) nums = hard ? [12, 18, 30] : [12, 18];
    const g = nums.reduce((acc, n) => gcd(acc, n)),
      l = nums.reduce((acc, n) => U.lcm(acc, n));
    const name = r.pick(NAMES);
    const factorsOf = (n) => {
      const out = [];
      for (let k = 1; k <= n; k++) if (n % k === 0) out.push(k);
      return out;
    };
    const listNums = nums.join(', ');
    const big = nums[nums.length - 1];
    return {
      type: 'blanks',
      skill: 'lcm',
      lesson: '6-7',
      title: hard ? 'Challenge: GCF and LCM of three numbers' : 'Challenge: GCF and LCM together',
      xp: 20,
      prompt: `<p>${hard ? 'Three' : 'Two'} boiler gears have ${hl(listNums)} teeth. ${name} needs both numbers: the GCF sizes the shared pin, and the LCM tells when the marks line up again.</p><p>Find the GCF and the LCM of ${listNums}.</p>`,
      fields: [
        { label: 'GCF', answer: g, width: 'sm' },
        { label: 'LCM', answer: l, width: 'sm' },
      ],
      layout: 'two-col',
      hints: [
        `GCF: the largest number that divides ${hard ? 'all of them' : 'both'}. LCM: the smallest number that ${hard ? 'all of them' : 'both'} divide into. The GCF is never bigger than the numbers; the LCM is never smaller.`,
        `${nums.map((n) => `Factors of ${n}: ${factorsOf(n).join(', ')}`).join('. ')}. The GCF is the largest number in every list.`,
        `For the LCM, list multiples of ${big}: ${big}, ${2 * big}, ${3 * big}, … and stop at the first one that ${nums.slice(0, -1).join(' and ')} ${hard ? 'both divide' : 'divides'}.`,
      ],
      hintEs: 'MCD: el número más grande que divide a todos. mcm: el número más pequeño en el que caben todos. El MCD nunca es mayor que los números; el mcm nunca es menor.',
      solution: `<p>GCF: the common factors of ${listNums} are ${factorsOf(nums[0])
        .filter((k) => nums.every((n) => n % k === 0))
        .join(
          ', ',
        )}, so the GCF is <b>${g}</b>. LCM: the first common multiple is <b>${l}</b>.${hard ? '' : ` Check: ${nums[0]} × ${nums[1]} ÷ ${g} = ${(nums[0] * nums[1]) / g}, which equals the LCM, because the product counts the shared factor ${g} twice.`}</p>`,
      feedback: {
        correct: hard ? `Correct. GCF ${g}, LCM ${l}.` : `Correct. GCF ${g}, LCM ${l}. Notice ${g} × ${l} = ${nums[0]} × ${nums[1]}.`,
        wrong(ans) {
          const x = parseNum(ans[0]),
            y = parseNum(ans[1]);
          const prod = nums.reduce((p, n) => p * n, 1);
          if (x === l && y === g) return 'You swapped them. The GCF is a factor (smaller than or equal to the numbers); the LCM is a multiple (larger than or equal to them).';
          if (hard && x != null && x !== g && x === gcd(nums[0], nums[1])) return `${x} divides ${nums[0]} and ${nums[1]}, but not ${nums[2]}. The GCF must divide all three.`;
          if (hard && y != null && y !== l && y === U.lcm(nums[0], nums[1])) return `${y} is a multiple of ${nums[0]} and ${nums[1]}, but not of ${nums[2]}. The LCM must be a multiple of all three.`;
          if (x !== g && y === l) return `The LCM is right. For the GCF, find the largest number that divides ${hard ? 'all three numbers' : 'both numbers'}.`;
          if (x === g && y === prod && prod !== l) return `The GCF is right. ${prod} is a common multiple, but not the least.`;
          if (x === g && y !== l) return `The GCF is right. For the LCM, list multiples of ${big} until you reach one that the other ${hard ? 'numbers divide' : 'number divides'}.`;
          return `List the factors of each number for the GCF. List multiples for the LCM.`;
        },
      },
    };
  });

  // ---------- Factor a perimeter with the GCF (mc) ----------
  G.define('ec_perimeterFactor', (r, o) => {
    const hard = !!o.hard;
    const [v, w] = r.pickN(VARS, 2);
    let g, p, q, s;
    for (let tries = 0; tries < 100; tries++) {
      g = r.pick([2, 3, 4, 5, 6]);
      p = r.int(hard ? 2 : 1, 5);
      q = r.int(1, 5);
      s = r.int(1, 7);
      if (gcd(gcd(p, q), s) === 1 && p !== q) break;
    }
    const A = g * p,
      B = g * q,
      C = g * s;
    // hard: a four-sided hatch whose two v-sides must be combined before the GCF shows up
    let A1 = A,
      A2 = 0;
    if (hard) {
      const splits = [];
      for (let x = 1; x < A; x++) if (x % g !== 0) splits.push(x);
      A1 = splits.length ? r.pick(splits) : 1;
      A2 = A - A1;
    }
    const sides = hard ? [`${co(A1, v)}`, `${B}${w}`, `${co(A2, v)}`, String(C)] : [`${A}${v}`, `${B}${w}`, String(C)];
    const sum = hard ? sides.join(' + ') : `${A}${v} + ${B}${w} + ${C}`;
    const simp = `${A}${v} + ${B}${w} + ${C}`;
    const okText = `${g}(${co(p, v)} + ${co(q, w)} + ${s})`;
    const smaller = [];
    for (let k = 2; k < g; k++) if (A % k === 0 && B % k === 0 && C % k === 0) smaller.push(k);
    const k2 = smaller.length ? smaller[smaller.length - 1] : null;
    const opts = [
      { html: okText, ok: true },
      { html: `${g}(${co(p, v)} + ${co(q, w)}) + ${C}`, why: `${C} is also a multiple of ${g}. The GCF must be factored out of all three terms.` },
      { html: `${g}(${co(p, v)} + ${co(q, w)} + ${C})`, why: `Distribute back: ${g} × ${C} = ${g * C}, not ${C}. Divide every term by ${g}.` },
      k2
        ? { html: `${k2}(${co(A / k2, v)} + ${co(B / k2, w)} + ${C / k2})`, why: `${k2} is a common factor but not the greatest. The terms inside still share a factor of ${g / k2}.` }
        : hard
          ? { html: `${A + B + C}${v}${w}`, why: `The terms are unlike terms (${v}-terms, ${w}-terms, and a constant). They cannot be combined into a single term.` }
          : { html: `${A + B + C}${v}${w}`, why: `The three sides are unlike terms. They cannot be combined into a single term.` },
    ];
    const sh = shuffleOptions(r, opts, 0);
    const name = r.pick(NAMES);
    return {
      type: 'mc',
      skill: 'distributive',
      lesson: '6-8',
      title: hard ? 'Challenge: combine, then factor' : 'Challenge: factor a three-term sum',
      xp: 20,
      prompt: hard
        ? `<p>${name} measures a four-sided boiler hatch. Its sides are ${sides.map((x) => hl(x)).join(', ')}.</p><p>Write the perimeter, combine like terms, and factor it using the <b>greatest common factor</b>. Which expression is the result?</p>`
        : `<p>${name} measures a triangular boiler hatch. Its sides are ${hl(sides[0])}, ${hl(sides[1])}, and ${hl(sides[2])}.</p><p>The perimeter is ${sum}. Which expression is the perimeter <b>factored using the greatest common factor</b>?</p>`,
      options: sh.options,
      answer: sh.answer,
      hints: hard
        ? [
            'First add the four sides and combine like terms. Only then look for the greatest common factor.',
            `${co(A1, v)} + ${co(A2, v)} = ${A}${v}, so the perimeter is ${simp}.`,
            `Find the GCF of ${A}, ${B}, and ${C}, divide each term by it, and distribute back to check.`,
          ]
        : [
            `Find the GCF of all three coefficients: ${A}, ${B}, and ${C}.`,
            `The GCF is ${g}. Divide each term by ${g}: ${A}${v} ÷ ${g}, ${B}${w} ÷ ${g}, ${C} ÷ ${g}.`,
            `Write the three quotients inside the parentheses, then distribute ${g} back to check that you get ${sum}.`,
          ],
      hintEs: hard
        ? 'Primero suma los cuatro lados y combina los términos semejantes. Solo después busca el máximo común divisor (MCD).'
        : `Halla el máximo común divisor (MCD) de los tres coeficientes: ${A}, ${B} y ${C}.`,
      solution: `<p>${hard ? `Perimeter: ${sum} = ${simp}. ` : ''}The GCF of ${A}, ${B}, and ${C} is ${g}. Dividing each term by ${g} gives ${co(p, v)}, ${co(q, w)}, and ${s}, so the perimeter is <b>${okText}</b>. Check: ${g} × ${p} = ${A}, ${g} × ${q} = ${B}, ${g} × ${s} = ${C}. Factoring with the GCF leaves no common factor inside.</p>`,
      feedback: { correct: `Correct. ${simp} = ${okText}.`, wrong: U.whyWrong(sh.options, `Divide every term by the GCF, ${hard ? 'after combining like terms, ' : ''}and distribute back to check.`) },
    };
  });

  // ---------- Multi-step work with one wrong step (error) ----------
  G.define('ec_errorChain', (r, o) => {
    const hard = !!o.hard;
    const name = r.pick(NAMES);
    const a = r.int(2, 6),
      b = r.int(2, 4),
      c = r.int(5, 9),
      d = r.int(1, 4);
    const m = hard ? r.int(2, 4) : 1; // hard: the whole thing sits in brackets, multiplied by m
    const core = `${a} + ${PT(b, 2)} × (${c} − ${d})`;
    const text = hard ? `${m} × [${core}]` : core;
    const inner = c - d;
    const coreVal = a + sq(b) * inner;
    const value = m * coreVal;
    const kind = r.pick(['power', 'addFirst', 'parens']);
    const wrap = (s) => (hard ? `${m} × [${s}]` : s);
    const tail = (x) => (hard ? ` = ${m} × ${x} = ${m * x}` : '');
    let work, okText;
    if (kind === 'power') {
      const wv = a + b * 2 * inner;
      work = `${text} = ${wrap(`${a} + ${PT(b, 2)} × ${inner}`)} = ${wrap(`${a} + ${b * 2} × ${inner}`)} = ${wrap(`${a} + ${b * 2 * inner}`)}${hard ? tail(wv) : ` = ${wv}`}`;
      okText = `Step 2: ${name} computed ${PT(b, 2)} as ${b} × 2. The exponent means ${b} × ${b} = ${sq(b)}.`;
    } else if (kind === 'addFirst') {
      const wv = (a + sq(b)) * inner;
      work = `${text} = ${wrap(`${a} + ${PT(b, 2)} × ${inner}`)} = ${wrap(`${a} + ${sq(b)} × ${inner}`)} = ${wrap(`${a + sq(b)} × ${inner}`)}${hard ? tail(wv) : ` = ${wv}`}`;
      okText = `Step 3: ${name} added ${a} + ${sq(b)} before multiplying. Multiplication comes before addition.`;
    } else {
      const wv = a + sq(b) * c - d;
      work = `${text} = ${wrap(`${a} + ${PT(b, 2)} × ${c} − ${d}`)} = ${wrap(`${a} + ${sq(b)} × ${c} − ${d}`)} = ${wrap(`${a} + ${sq(b) * c} − ${d}`)}${hard ? tail(wv) : ` = ${wv}`}`;
      okText = `Step 1: ${name} dropped the parentheses. ${c} − ${d} must be evaluated first, as a group.`;
    }
    const fixWhy = `${c} − ${d} = ${inner}; ${PT(b, 2)} = ${sq(b)}; ${sq(b)} × ${inner} = ${sq(b) * inner}; ${a} + ${sq(b) * inner} = ${coreVal}${hard ? `; ${m} × ${coreVal} = ${value}` : ''}`;
    const others = [
      {
        k: 'power',
        html: `${name} computed ${PT(b, 2)} as ${b} × 2 instead of ${b} × ${b}.`,
        why: `In this work the power step is correct: ${PT(b, 2)} is written as ${sq(b)}. Compare each step with the order of operations.`,
      },
      {
        k: 'addFirst',
        html: `${name} added before multiplying.`,
        why: `Look at the step where ${sq(b)} is used. In this work the multiplication is done before the addition.`,
      },
      {
        k: 'parens',
        html: `${name} ignored the parentheses around ${c} − ${d}.`,
        why: `The parentheses were handled correctly: ${c} − ${d} = ${inner} in step 1.`,
      },
    ].filter((x) => x.k !== kind);
    const opts = [{ html: okText, ok: true }].concat(
      others.map((x) => ({ html: x.html, why: x.why })),
      [{ html: 'Every step is correct.', why: `The correct value is ${value}. One step breaks the order of operations.` }],
    );
    const sh = shuffleOptions(r, opts, 0);
    return {
      type: 'error',
      skill: 'order-ops',
      lesson: '6-4',
      title: 'Challenge: find the broken step',
      xp: 20,
      prompt: `<p>${name} evaluated ${hl(text)} step by step. One step is wrong.</p><p>Which step breaks the rules?</p>`,
      work,
      options: sh.options,
      answer: sh.answer,
      fix: { label: 'The correct value is', answer: value },
      hints: [
        `Check the steps in order: parentheses, then exponents, then multiplication, then addition${hard ? `. The brackets hold everything that must be finished before multiplying by ${m}` : ''}.`,
        `Step 1 should give ${c} − ${d} = ${inner}. Step 2 should give ${PT(b, 2)} = ${sq(b)}.`,
        `Then multiply ${sq(b)} × ${inner}, add ${a}${hard ? `, and multiply the result by ${m}` : ''}.`,
      ],
      hintEs: `Revisa los pasos en orden: paréntesis, luego exponentes, luego multiplicación y al final suma${hard ? `. Termina todo lo que está dentro de los corchetes antes de multiplicar por ${m}` : ''}.`,
      solution: `<p>${okText} Correct work: ${fixWhy}. The value is <b>${value}</b>.</p>`,
      feedback: {
        correct: `Correct. The right order gives ${value}.`,
        wrong(ans, dt) {
          if (!dt.mistakeOk) return (sh.options[ans.mistake] && sh.options[ans.mistake].why) || 'Redo the expression yourself, one rule at a time, and compare each step.';
          const v = parseNum(ans.fix);
          if (hard && v === coreVal) return `That is the value inside the brackets. Multiply it by ${m}.`;
          return `You found the broken step. For the fix: ${fixWhy.split(';').slice(0, 3).join(';')}, then add ${a}${hard ? ` and multiply by ${m}` : ''}.`;
        },
      },
    };
  });

  // ---------- Order expressions by value at a given x (seq) ----------
  G.define('ec_seqValues', (r, o) => {
    const hard = !!o.hard;
    const v = r.pick(VARS);
    const x = hard ? r.int(3, 6) : r.int(2, 5);
    const pool = [
      { html: `${v}${SQ}`, rate: sq(x) },
      { html: `2${v} + ${r.int(1, 4)}`, rate: null },
      { html: `${r.int(3, 5)}${v} − ${r.int(1, 3)}`, rate: null },
      { html: `${v}${U.supText(3)} ÷ ${v}`, rate: sq(x) },
      { html: `(${v} + 1)${SQ}`, rate: sq(x + 1) },
      { html: `${r.int(2, 4)}(${v} + ${r.int(1, 3)})`, rate: null },
      { html: `${r.int(10, 20)} − ${v}`, rate: null },
      ...(hard
        ? [
            { html: `${v}${SQ} − 2${v}`, rate: sq(x) - 2 * x },
            { html: `2${v}${SQ} ÷ ${v}`, rate: 2 * x },
          ]
        : []),
    ];
    // compute rates for the linear ones from their html
    const evalLinear = (html) => {
      let mm;
      if ((mm = html.match(/^2(\w) \+ (\d+)$/))) return 2 * x + Number(mm[2]);
      if ((mm = html.match(/^(\d+)(\w) − (\d+)$/))) return Number(mm[1]) * x - Number(mm[3]);
      if ((mm = html.match(/^(\d+)\((\w) \+ (\d+)\)$/))) return Number(mm[1]) * (x + Number(mm[3]));
      if ((mm = html.match(/^(\d+) − (\w)$/))) return Number(mm[1]) - x;
      return null;
    };
    pool.forEach((p) => {
      if (p.rate == null) p.rate = evalLinear(p.html);
    });
    const n = hard ? 5 : 4;
    // take plates in a random order, skipping any whose value repeats one already taken
    const items = [];
    for (const p of r.shuffle(pool)) if (items.length < n && p.rate > 0 && !items.some((i) => i.rate === p.rate)) items.push(p);
    const asc = r.chance(0.5);
    const order = items.map((_, i) => i).sort((p, q) => (asc ? items[p].rate - items[q].rate : items[q].rate - items[p].rate));
    return {
      type: 'seq',
      skill: 'evaluate-algebraic',
      lesson: '6-5',
      title: 'Challenge: order by value',
      xp: 20,
      prompt: `<p>${n === 5 ? 'Five' : 'Four'} plates must be stacked by value when ${hl(v + ' = ' + x)}. Order them from <b>${asc ? 'least' : 'greatest'}</b> value (top) to <b>${asc ? 'greatest' : 'least'}</b> value (bottom).</p>`,
      items: items.map((i) => ({ html: `<span class="big">${i.html}</span>`, rate: i.rate })),
      order,
      hints: [
        `Substitute ${x} for ${v} in each expression and evaluate it. Do not judge by how long the expression looks.`,
        `Values: ${items.map((i) => `${i.html} = ${i.rate}`).join('; ')}.`,
        `Now put the ${asc ? 'smallest' : 'largest'} value at the top and work down.`,
      ],
      hintEs: `Sustituye ${v} por ${x} en cada expresión y evalúala. No juzgues por lo larga que se ve la expresión.`,
      solution: `<p>At ${v} = ${x}: ${items.map((i) => `${i.html} = ${i.rate}`).join('; ')}. From ${asc ? 'least to greatest' : 'greatest to least'}: <b>${order.map((i) => items[i].html).join(', ')}</b>. Evaluating each expression is the only reliable way to compare them.</p>`,
      feedback: {
        correct: 'Correct. Substituting first makes the order clear.',
        wrong() {
          return `Evaluate each expression at ${v} = ${x} before you order them. Then put the ${asc ? 'least' : 'greatest'} at the top.`;
        },
      },
    };
  });
})(typeof window !== 'undefined' ? window : globalThis);
