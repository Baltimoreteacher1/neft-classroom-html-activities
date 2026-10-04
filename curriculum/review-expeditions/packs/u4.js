/* js/units/u4/gen-percent.js */
/* Zone 1 — The Hundredth Gate. Lesson 4-1 Understand Percent (Percent Means Per Hundred · Percents Greater Than 100%). */
(function (root) {
  'use strict';
  const RX = root.RX;
  const { G, V, shuffleOptions, NAMES, simplify, round, parseNum } = RX;
  const hl = V.hl;

  const THINGS = ['lanterns', 'glass squares', 'festival tickets', 'candles', 'paper stars', 'harbor lights'];
  const THINGS_ES = {
    lanterns: 'faroles',
    'glass squares': 'cuadros de vidrio',
    'festival tickets': 'boletos del festival',
    candles: 'velas',
    'paper stars': 'estrellas de papel',
    'harbor lights': 'luces del puerto',
  };
  const PLACES = ['Harbor Street', 'the Night Market', 'Tallow Lane', 'the Festival Dock', 'Wick Alley', 'the Old Bridge'];
  const rows = (n) => Math.floor(n / 10);
  const extra = (n) => n % 10;
  const rowWords = (n) => `${rows(n)} full ${rows(n) === 1 ? 'row' : 'rows'} (${rows(n) * 10} squares) and ${extra(n)} more ${extra(n) === 1 ? 'square' : 'squares'}`;
  const hundredths = (n) => `0.${n < 10 ? '0' + n : n}`;
  const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
  /** feedback.wrong for option-based questions: the chosen option's why, else a method fallback. */
  const whyOf = (options, fallback) => (ans) => (options[ans] && options[ans].why) || fallback;

  // ---------- Shade a 100-grid to show a percent (shade; hard = fraction not over 100, or tenths decimal) ----------
  G.define('p1_shadeGrid', (r, o) => {
    const hard = !!o.hard;
    const place = r.pick(PLACES);
    let n, shown, shownHtml, form, a, b, k;
    if (hard) {
      form = r.pick(['fraction', 'fraction', 'tenths']);
      if (form === 'fraction') {
        b = r.pick([4, 5, 20, 25, 50]);
        a = r.int(1, b - 1);
        if (b === 4 && a === 2) a = 3;
        if (b === 50 && a === 25) a = 27;
        k = 100 / b;
        n = a * k;
        shown = `${a}/${b}`;
        shownHtml = V.frac(a, b);
      } else {
        a = r.int(1, 9);
        if (a === 5) a = 7;
        n = a * 10;
        shown = `0.${a}`;
        shownHtml = hl(shown);
      }
    } else {
      n = r.pick([r.int(11, 49), r.int(51, 89), r.int(2, 9)]);
      form = r.pick(['percent', 'fraction', 'decimal']);
      shown = form === 'percent' ? `${n}%` : form === 'fraction' ? `${n}/100` : hundredths(n);
      shownHtml = form === 'fraction' ? V.frac(n, 100) : hl(shown);
    }
    const hints = hard
      ? form === 'fraction'
        ? [
            `Percent means per hundred. Each square is 1 of 100, so first rewrite ${shown} as a fraction with denominator 100.`,
            `100 ÷ ${b} = ${k}. Multiply the top and the bottom of ${shown} by ${k}.`,
            `${a} × ${k} squares out of 100. Shade that many squares.`,
          ]
        : [
            `Percent means per hundred. Each square is 1 of 100, so first rewrite ${shown} in hundredths.`,
            `${shown} is ${a} tenths. Each tenth is one full row of 10 squares.`,
            `Shade ${a} full rows of 10 squares.`,
          ]
      : [
          'Percent means per hundred. The grid has 100 squares, so each square is 1%.',
          `${shown} means ${n} out of 100. You need exactly ${n} shaded squares.`,
          `A full row is 10 squares (10%). Shade ${rowWords(n)}.`,
        ];
    const hintEs = hard
      ? form === 'fraction'
        ? `Porcentaje quiere decir "por cada cien". Cada cuadro es 1 de 100, así que primero escribe ${shown} como una fracción con denominador 100.`
        : `Porcentaje quiere decir "por cada cien". Cada cuadro es 1 de 100, así que primero escribe ${shown} en centésimos.`
      : 'Porcentaje quiere decir "por cada cien". La cuadrícula tiene 100 cuadros, así que cada cuadro es 1%.';
    const why = hard ? (form === 'fraction' ? `${shown} = ${n}/100` : `${shown} = ${a} tenths = ${n} hundredths`) : `${shown} is ${n} out of 100`;
    return {
      type: 'shade',
      skill: 'percent-models',
      lesson: '4-1',
      title: 'Shade the grid',
      prompt: hard
        ? `<p>The gate on ${place} is a 100-grid. Each square is 1% of the gate.</p><p>Shade the grid to show ${shownHtml} of the gate.</p>`
        : `<p>The gate on ${place} is a 100-grid. Each square is 1% of the gate.</p><p>Shade the grid to show ${shownHtml}${form === 'percent' ? '' : ` (that is ${hl(n + '%')} of the gate)`}.</p>`,
      cells: 100,
      count: n,
      label: shown,
      hints,
      hintEs,
      solution: `<p>Percent means <b>per hundred</b>. ${why}, so shade <b>${n} squares</b>: ${rowWords(n)}. That is ${n}% of the gate.</p>${V.grid100({ shaded: n, aria: `${n} of 100 squares shaded` })}`,
      feedback: {
        correct: `Correct. ${n} of the 100 squares are shaded, which is exactly ${n}%.`,
        wrong(ans, d) {
          const v = d.value;
          if (hard && form === 'fraction' && v === a) return `You shaded ${a} squares, the top of ${shown}. But ${shown} is not ${a} out of 100. Rewrite it with denominator 100 first.`;
          if (hard && form === 'fraction' && v === b) return `You shaded ${b}, the bottom of the fraction. The bottom tells how many equal parts make the whole, not how many to shade.`;
          if (hard && form === 'tenths' && v === a) return `${shown} is ${a} <b>tenths</b>, not ${a} hundredths. Each tenth is a full row of 10 squares.`;
          if (v === 100 - n) return `You shaded ${v} squares, which is the part that should stay unshaded. ${shown} means ${n} squares shaded.`;
          if (!hard && (v === n * 10 || v === Math.round(n / 10))) return `Each square is 1%, not 10%. ${n}% needs ${n} squares.`;
          if (v != null && Math.abs(v - n) === 10) return `You are off by one full row. Count the full rows again.`;
          return hard
            ? `You shaded ${v} squares. Change ${shown} to hundredths first; that number of hundredths is the number of squares.`
            : `You shaded ${v} squares. ${n}% means ${n} out of 100, so count to exactly ${n}.`;
        },
      },
    };
  });

  // ---------- Read a shaded 100-grid (mc; hard = the unshaded percent) ----------
  G.define('p1_readGrid', (r, o) => {
    const hard = !!o.hard;
    let n = r.int(11, 89);
    if (n === 50) n = 52;
    const thing = r.pick(THINGS);
    const target = hard ? 100 - n : n;
    const offRow = hard ? (target + 10 === n || target + 10 >= 100 ? target - 10 : target + 10) : null;
    const opts = hard
      ? [
          { html: `${target}% are dark`, ok: true },
          { html: `${n}% are dark`, why: `${n}% is the <b>shaded</b> part, the lanterns that are lit. The dark ones are the unshaded squares: 100 − ${n}.` },
          { html: `${round(target / 100, 2)}% are dark`, why: `${round(target / 100, 2)} is the decimal for ${target} hundredths. As a percent, ${target} out of 100 is ${target}%.` },
          { html: `${offRow}% are dark`, why: `You are off by one full row of 10. Count the unshaded squares again, or subtract the shaded count from 100.` },
        ]
      : [
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
      title: hard ? 'Read the dark part' : 'Read the grid',
      prompt: `<p>The grid shows the ${thing} on one street. The shaded squares are the ones that are lit. Each square is 1 of 100.</p>${V.grid100({ shaded: n, aria: `${n} of 100 squares shaded` })}<p>${hard ? 'What percent of the grid is <b>not</b> lit (unshaded)?' : 'What percent of the grid is shaded?'}</p>`,
      options: sh.options,
      answer: sh.answer,
      hints: hard
        ? [
            'The whole grid is 100%. The lit part and the dark part together make 100%.',
            `Count the shaded squares: ${rowWords(n)}, which is ${n} squares.`,
            `The dark part is 100 − ${n} squares. Write that with a percent sign.`,
          ]
        : [
            'Count full rows first. Each full row has 10 squares, so each full row is 10%.',
            rows(n) === 0
              ? `There is no full row: only ${extra(n)} ${extra(n) === 1 ? 'square is' : 'squares are'} shaded, less than one row.`
              : `There ${rows(n) === 1 ? 'is 1 full row' : 'are ' + rows(n) + ' full rows'} (${rows(n) * 10} squares) plus ${extra(n)} extra ${extra(n) === 1 ? 'square' : 'squares'}.`,
            `Add ${rows(n) * 10} + ${extra(n)} squares out of 100. Write the total with a percent sign.`,
          ],
      hintEs: hard
        ? 'Toda la cuadrícula es el 100%. La parte encendida y la parte oscura juntas forman el 100%.'
        : 'Cuenta primero las filas completas. Cada fila completa tiene 10 cuadros, así que cada fila completa es el 10%.',
      solution: hard
        ? `<p>${rowWords(n)} are shaded: ${n} squares are lit. The whole grid is 100 squares, so 100 − ${n} = ${target} squares are dark. That is <b>${target}%</b>. The lit percent and the dark percent always add to 100%.</p>`
        : `<p>${rowWords(n)} are shaded: ${rows(n) * 10} + ${extra(n)} = ${n}. Out of 100 squares, that is <b>${n}%</b>. Percent means per hundred, so the count of shaded squares <i>is</i> the percent.</p>`,
      feedback: {
        correct: hard ? `Correct. ${n}% lit and ${target}% dark make 100%, the whole grid.` : `Correct. ${n} shaded squares out of 100 is ${n}%.`,
        wrong: whyOf(sh.options, 'Count the squares the question asks about. Each square is 1 out of 100, which is 1%.'),
      },
    };
  });

  // ---------- Fraction, decimal, percent (blanks; hard = count out of 20/25/50/200, simplest form) ----------
  G.define('p1_threeWays', (r, o) => {
    const hard = !!o.hard;
    const thing = r.pick(THINGS);
    const place = r.pick(PLACES);
    let n, total, count;
    if (hard) {
      total = r.pick([20, 25, 50, 200]);
      do {
        count = r.int(1, total - 1);
      } while ((count * 100) % total !== 0 || count * 2 === total || (total === 200 && count % 2 === 0 && count % 10 === 0));
      n = (count * 100) / total;
    } else {
      n = r.pick([r.int(11, 49), r.int(51, 89)]);
      total = 100;
      count = n;
    }
    const [sn, sd] = simplify(count, total);
    const dec = round(n / 100, 3);
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
    const scale = 100 / total;
    return {
      type: 'blanks',
      skill: 'percent-meaning',
      lesson: '4-1',
      title: hard ? 'Three names, simplest form' : 'Write it three ways',
      prompt: hard
        ? `<p>On ${place}, ${hl(count)} of the ${total} ${thing} are lit.</p><p>Write the lit part as a fraction in <b>simplest form</b>, as a decimal, and as a percent.</p>`
        : `<p>On ${place}, ${hl(n)} of the 100 ${thing} are lit.</p>${V.grid100({ shaded: n, size: 160, aria: `${n} of 100 squares shaded` })}<p>Write the lit part as a fraction with denominator 100, as a decimal, and as a percent.</p>`,
      template,
      fields,
      hints: hard
        ? [
            `Percent means per hundred. Start with the fraction ${count}/${total}, then find an equal fraction out of 100.`,
            total === 200
              ? `${total} is twice 100, so divide the top and bottom of ${count}/${total} by 2 to get a fraction out of 100.`
              : `100 ÷ ${total} = ${scale}, so multiply the top and bottom of ${count}/${total} by ${scale} to get a fraction out of 100.`,
            `For simplest form, divide ${count} and ${total} by their greatest common factor. The hundredths fraction gives the decimal and the percent.`,
          ]
        : [
            `${n} out of 100 is the fraction ${n}/100. Percent means per hundred, so the percent uses the same number.`,
            `As a decimal, ${n} hundredths has two digits after the decimal point.`,
            `Write ${n} over 100. Then write ${n} hundredths as a decimal, and ${n} per hundred with a percent sign.`,
          ],
      hintEs: hard
        ? `Porcentaje quiere decir "por cada cien". Empieza con la fracción ${count}/${total} y busca una fracción equivalente sobre 100.`
        : `${n} de 100 es la fracción ${n}/100. Porcentaje quiere decir "por cada cien", así que el porcentaje usa el mismo número.`,
      solution: hard
        ? `<p>${count} out of ${total} is ${sn === count ? `<b>${count}/${total}</b>, already in simplest form` : `${count}/${total} = <b>${sn}/${sd}</b> in simplest form`}. As hundredths, ${count}/${total} = ${n}/100, so the decimal is <b>${dec}</b> and the percent is <b>${n}%</b>. All three name the same number.</p>`
        : `<p>${n} out of 100 is <b>${n}/100</b>. ${n} hundredths is the decimal <b>${dec}</b>. Per hundred means percent, so it is <b>${n}%</b>. All three name the same number.</p>`,
      feedback: {
        correct: `Correct. ${hard ? `${sn}/${sd}` : `${n}/100`}, ${dec}, and ${n}% are three names for the same amount.`,
        wrong(ans, d) {
          const di = hard ? 2 : 1;
          const pi = hard ? 3 : 2;
          const dv = parseNum(ans[di]);
          const pv = parseNum(ans[pi]);
          if (hard && d.wrong.includes(pi) && pv === count) return `${count} is the count out of ${total}, not out of 100. Rescale ${count}/${total} to hundredths before you write the percent.`;
          if (d.wrong.includes(di) && dv === n) return `The decimal is not ${n}. ${n} hundredths is a number less than 1.`;
          if (d.wrong.includes(di) && dv != null && Math.abs(dv - n / 10) < 1e-9) return `${round(n / 10, 1)} is ${n} tenths. You need ${n} hundredths, two places after the decimal point.`;
          if (hard && d.wrong.includes(di) && dv != null && Math.abs(dv - count / 100) < 1e-9)
            return `${dv} is ${count} hundredths, but the lit part is ${count} out of ${total}. Rescale to hundredths first.`;
          if (d.wrong.includes(pi)) return `The percent is the number out of 100. Rescale to a fraction over 100, then use its top number.`;
          if (hard && (d.wrong.includes(0) || d.wrong.includes(1)))
            return `Your fraction is not in simplest form or does not equal ${count}/${total}. Divide the top and bottom by their greatest common factor.`;
          return `Start from the fraction of lit ${thing}. The fraction, decimal, and percent all come from it.`;
        },
      },
    };
  });

  // ---------- Which student explains the percent correctly? (who; hard = over 100%) ----------
  G.define('p1_whoPercent', (r, o) => {
    const hard = !!o.hard;
    const [a, b, c, e] = r.pickN(NAMES, 4);
    const place = r.pick(PLACES);
    let n, opts, prompt, sol;
    if (hard) {
      n = r.pick([110, 120, 125, 130, 140, 150, 160, 175, 180]);
      const more = n - 100;
      opts = [
        { title: a, html: `"${n}% means ${n} lanterns this year for every 100 lanterns last year, so there are more."`, ok: true },
        {
          title: b,
          html: `"${n}% is impossible. A percent can never be more than 100%, because 100% is everything."`,
          why: `${b} thinks 100% is a limit. 100% is one whole, and an amount can be more than one whole.`,
        },
        {
          title: c,
          html: `"${n}% means ${n} lanterns this year for every 1,000 lanterns last year, so there are fewer."`,
          why: `${c} compared to 1,000. Percent always compares to <b>100</b>: ${n} per 100, which is more than the whole.`,
        },
        {
          title: e,
          html: `"${n}% means exactly ${more} more lanterns this year, no matter how many there were last year."`,
          why: `${e} treated the percent as a count. ${n}% means ${more} more <b>for every 100</b> last year, so the number added depends on last year's total.`,
        },
      ];
      prompt = `<p>The festival guide says this year ${place} has ${hl(n + '%')} of last year's lanterns. Four students explain what that means. Who is correct?</p>`;
      sol = `<p><b>${a}</b> is correct. ${n}% is a rate per 100: ${n} this year for every 100 last year. Since ${n} is more than 100, there are more lanterns than last year. A percent greater than 100% is more than one whole.</p>`;
    } else {
      n = r.int(12, 88);
      opts = [
        { title: a, html: `"${n}% means ${n} out of every 100 lanterns are lit. It is a rate per 100."`, ok: true },
        { title: b, html: `"${n}% means ${n} out of every 10 lanterns are lit. It is a rate per ten."`, why: `${b} compared to 10. Percent always compares to <b>100</b>: ${n} per 100.` },
        { title: c, html: `"${n}% means 100 out of every ${n} lanterns are lit. The ${n} is the whole."`, why: `${c} reversed the comparison. The percent (${n}) is the part, and 100 is the whole.` },
        {
          title: e,
          html: `"${n}% means exactly ${n} lanterns are lit, no matter how many lanterns there are."`,
          why: `${e} treated the percent as a count. ${n}% is a rate: ${n} <b>for every 100</b>, so the count depends on the total.`,
        },
      ];
      prompt = `<p>A sign on ${place} says ${hl(n + '%')} of the lanterns are lit. Four students explain what that means. Who is correct?</p>`;
      sol = `<p><b>${a}</b> is correct. ${n}% is a rate per 100: ${n} out of every 100 lanterns are lit. Comparing to 10, putting 100 first, or reading the percent as a plain count changes the meaning.</p>`;
    }
    const sh = shuffleOptions(r, opts, 0);
    return {
      type: 'who',
      skill: hard ? 'over-100' : 'percent-meaning',
      lesson: '4-1',
      title: 'Who is correct?',
      prompt,
      options: sh.options,
      answer: sh.answer,
      layout: 'cards',
      hints: [
        'The word <b>percent</b> comes from "per cent," which means "per hundred." A percent is a rate, not a count.',
        hard ? `So ${n}% compares ${n} to 100. Is ${n} more or less than 100?` : `So ${n}% compares ${n} to 100, not to 10.`,
        hard ? `Read it as "${n} for every 100." Decide whether that is more or less than the whole.` : `Read it as "${n} out of every 100." Find the student who says that.`,
      ],
      hintEs: 'La palabra <b>porcentaje</b> viene de "por ciento", que quiere decir "por cada cien". Un porcentaje es una tasa, no una cantidad fija.',
      solution: sol,
      feedback: {
        correct: hard ? `Correct. A percent greater than 100% means more than one whole.` : `Correct. A percent is always a rate per 100.`,
        wrong: whyOf(sh.options, 'Read the percent as "per 100" and check each student against that.'),
      },
    };
  });

  // ---------- Percents greater than 100% with grids (num; hard = how much MORE than one order) ----------
  G.define('p1_over100', (r, o) => {
    const hard = !!o.hard;
    const full = hard ? r.pick([1, 2, 2]) : 1;
    const m = hard ? r.pick([r.int(11, 49), r.int(51, 89)]) : r.pick([r.int(5, 45), r.pick([10, 20, 25, 30, 40, 50, 60, 70, 75, 80, 90])]);
    const total = full * 100 + m;
    const answer = hard ? total - 100 : total;
    const thing = r.pick(['lantern oil', 'festival glass', 'candle wax', 'paper for lanterns']);
    const grids =
      Array.from({ length: full }, () => V.grid100({ shaded: 100, size: 120, aria: 'A fully shaded grid, 100 percent' })).join('') +
      V.grid100({ shaded: m, size: 120, aria: `${m} of 100 squares shaded` });
    const gridWords = `(${full === 1 ? 'One grid is' : 'Two grids are'} completely shaded, and ${m} squares of the last grid are shaded.)`;
    return {
      type: 'num',
      skill: 'over-100',
      lesson: '4-1',
      title: hard ? 'How much more than the whole?' : 'More than the whole',
      prompt: hard
        ? `<p>Each grid stands for one full order of ${thing}, which is 100%. This year the foundry got the shaded amount.</p><div class="viz-row">${grids}</div><p>${gridWords} The foundry got how many percent <b>more</b> than one full order?</p>`
        : `<p>Each grid stands for one full order of ${thing}, which is 100%. This year the foundry ordered the shaded amount.</p><div class="viz-row">${grids}</div><p>What percent of one order did the foundry get this year? ${gridWords}</p>`,
      unit: '%',
      answer,
      hints: hard
        ? [
            'A completely shaded grid is 100%. First find the total percent across all the grids, then compare it to one order (100%).',
            `The total is ${full * 100}% + ${m}%. One full order is 100%.`,
            `Subtract: (${full * 100} + ${m}) − 100.`,
          ]
        : [
            'A completely shaded grid is 100 out of 100, which is 100%. Count every shaded square across all the grids.',
            `One full grid = 100%. The last grid adds ${m} squares, which is ${m}%.`,
            `Add 100% + ${m}%.`,
          ],
      hintEs: hard
        ? 'Una cuadrícula toda sombreada es el 100%. Primero halla el porcentaje total de todas las cuadrículas. Luego compáralo con un pedido completo (100%).'
        : 'Una cuadrícula toda sombreada es 100 de 100, o sea, el 100%. Cuenta todos los cuadros sombreados en todas las cuadrículas.',
      solution: hard
        ? `<p>${full === 1 ? 'One full grid is 100%.' : 'Two full grids are 200%.'} The partly shaded grid adds ${m}%, so the foundry got ${total}% of one order. One order is 100%, so that is ${total} − 100 = <b>${answer}%</b> more than one order.</p>`
        : `<p>One full grid is 100%. The partly shaded grid adds ${m}%. Total: 100 + ${m} = <b>${total}%</b>. A percent greater than 100% means <b>more than one whole</b>.</p>`,
      feedback: {
        correct: hard ? `Correct. ${total}% is ${answer} percentage points more than one full order (100%).` : `Correct. ${total}% is more than 100%, so the foundry got more than one full order.`,
        wrong(ans, d) {
          const v = d.value;
          if (hard && v === total) return `${total}% is the whole amount the foundry got. The question asks how much <b>more</b> than one order (100%) that is.`;
          if (hard && v === m && full === 2) return `${m}% is only the last grid. The second full grid is also more than one order: count it too.`;
          if (!hard && v === m) return `${m}% is only the last grid. Each full grid adds another 100%.`;
          if (v != null && Math.abs(v - total / 100) < 1e-9) return `${total / 100} is the decimal form. The question asks for a percent, so multiply by 100.`;
          return hard ? 'Find the total percent across the grids first. Then subtract one full order, 100%.' : `Count all the shaded squares: 100 from the full grid plus ${m} more.`;
        },
      },
    };
  });

  // ---------- Sort values: less than, equal to, greater than 100% (sort; hard = values close to 1) ----------
  G.define('p1_sortVs100', (r, o) => {
    const hard = !!o.hard;
    const TIP_DEC = 'A decimal less than 1 is less than 100%; a decimal more than 1 is more than 100%.';
    const TIP_FRAC = 'Compare the top of the fraction to the bottom. Top smaller → less than 1 whole; equal → 1 whole; bigger → more than 1 whole.';
    const TIP_PCT = 'Compare the percent directly to 100%.';
    const pool = hard
      ? [
          [
            { html: `${r.int(95, 99)}%`, bin: 0, tip: TIP_PCT },
            { html: `0.9${r.int(1, 9)}`, bin: 0, tip: TIP_DEC },
            { html: V.frac(19, 20), plain: '19/20', bin: 0, tip: TIP_FRAC },
            { html: V.frac(49, 50), plain: '49/50', bin: 0, tip: TIP_FRAC },
            { html: '99.5%', bin: 0, tip: TIP_PCT },
          ],
          [
            { html: V.frac(25, 25), plain: '25/25', bin: 1, tip: TIP_FRAC },
            { html: '1.00', bin: 1, tip: TIP_DEC },
            { html: V.frac(8, 8), plain: '8/8', bin: 1, tip: TIP_FRAC },
            { html: V.frac(10, 10), plain: '10/10', bin: 1, tip: TIP_FRAC },
          ],
          [
            { html: `10${r.int(1, 5)}%`, bin: 2, tip: TIP_PCT },
            { html: `1.0${r.int(1, 9)}`, bin: 2, tip: 'A decimal like 1.05 is a little more than 1 whole, so it is a little more than 100% (1.05 = 105%).' },
            { html: V.frac(21, 20), plain: '21/20', bin: 2, tip: TIP_FRAC },
            { html: V.frac(9, 8), plain: '9/8', bin: 2, tip: TIP_FRAC },
            { html: '100.5%', bin: 2, tip: TIP_PCT },
          ],
        ]
      : [
          [
            { html: '0.8', bin: 0, tip: TIP_DEC },
            { html: `${r.int(51, 99)}%`, bin: 0, tip: TIP_PCT },
            { html: V.frac(3, 4), plain: '3/4', bin: 0, tip: TIP_FRAC },
            { html: 'Half of the lanterns', bin: 0, tip: 'Half of something is less than all of it, so it is less than 100%.' },
            { html: `0.${r.int(11, 49)}`, bin: 0, tip: TIP_DEC },
            { html: V.frac(9, 10), plain: '9/10', bin: 0, tip: TIP_FRAC },
          ],
          [
            { html: V.frac(100, 100), plain: '100/100', bin: 1, tip: TIP_FRAC },
            { html: '1.0', bin: 1, tip: TIP_DEC },
            { html: 'All of the lanterns', bin: 1, tip: 'All of something is exactly one whole, which is 100%.' },
            { html: V.frac(4, 4), plain: '4/4', bin: 1, tip: TIP_FRAC },
            { html: '100%', bin: 1, tip: TIP_PCT },
          ],
          [
            { html: `${r.pick([110, 125, 140, 150, 175, 200])}%`, bin: 2, tip: TIP_PCT },
            { html: `1.${r.int(1, 9)}`, bin: 2, tip: TIP_DEC },
            { html: V.frac(5, 4), plain: '5/4', bin: 2, tip: TIP_FRAC },
            { html: V.frac(3, 2), plain: '3/2', bin: 2, tip: TIP_FRAC },
            { html: 'Twice the lanterns', bin: 2, tip: 'Twice something is two wholes, which is 200%.' },
            { html: `2.${r.int(1, 5)}`, bin: 2, tip: TIP_DEC },
          ],
        ];
    const items = r.shuffle(r.pickN(pool[0], 2).concat(r.pickN(pool[1], 2), r.pickN(pool[2], 2)));
    const strip = (s) =>
      String(s)
        .replace(/<[^>]+>/g, '')
        .trim();
    return {
      type: 'sort',
      skill: 'over-100',
      lesson: '4-1',
      title: hard ? 'Close to the whole' : 'Compare to the whole',
      prompt: hard
        ? `<p>The Keeper's chart compares each amount to <b>one whole</b> (100%). Every value is close to 1, so look carefully. Sort each value.</p>`
        : `<p>The Keeper's chart compares each amount to <b>one whole</b> (100%). Sort each value.</p><p class="muted">Remember: 100% = 1 whole = 1.0 = 100/100.</p>`,
      bins: ['Less than 100%', 'Equal to 100%', 'Greater than 100%'],
      items,
      hints: [
        'Change each value to a percent. 1 whole is 100%, so a decimal of 1.0 or a fraction equal to 1 is exactly 100%.',
        hard ? 'A decimal like 0.97 is just under 1 whole. A decimal like 1.03 is just over 1 whole.' : 'A decimal that starts with 1. or 2. is more than one whole, so it is more than 100%.',
        'For a fraction, compare its top to its bottom. If the top is bigger, the fraction is more than 1 whole, so it is more than 100%.',
      ],
      hintEs: 'Cambia cada valor a porcentaje. Un entero es el 100%, así que el decimal 1.0 o una fracción igual a 1 es exactamente el 100%.',
      solution: hard
        ? `<p>Compare each value to 1 whole. Just under 1 (0.97, 19/20 = 95%, 49/50 = 98%, 99.5%) is <b>less than 100%</b>. Exactly 1 (1.00, 8/8, 25/25) is <b>equal to 100%</b>. Just over 1 (1.05 = 105%, 21/20 = 105%, 9/8 = 112.5%, 100.5%) is <b>greater than 100%</b>.</p>`
        : `<p>Values less than 1 whole are less than 100% (for example 0.8 = 80%). Values equal to 1 whole are exactly 100% (1.0, 100/100, 4/4). Values more than 1 whole are more than 100% (1.5 = 150%, 5/4 = 125%).</p>`,
      feedback: {
        correct: 'Correct. Comparing every value to one whole tells you which side of 100% it lands on.',
        wrong(ans, d) {
          const bad = (d.wrong || []).map((i) => items[i]).filter(Boolean);
          if (!bad.length) return 'Convert each value to a percent first, then compare it to 100%.';
          const it = bad[0];
          const lead = `Check ${it.plain || strip(it.html)}${bad.length > 1 ? ` (and ${bad.length - 1} more)` : ''}. `;
          return lead + it.tip;
        },
      },
    };
  });

  // ---------- Percents less than 1% (mc; hard = fractions and decimals that are less than 1%) ----------
  G.define('p1_lessThan1', (r, o) => {
    const hard = !!o.hard;
    let opts, prompt, hints, hintEs, sol, correct, v;
    if (hard) {
      v = r.pick([
        { show: V.frac(1, 200), plain: '1/200', pct: 0.5, route: '1/200 = 0.5/100' },
        { show: V.frac(1, 400), plain: '1/400', pct: 0.25, route: '1/400 = 0.25/100' },
        { show: V.frac(3, 400), plain: '3/400', pct: 0.75, route: '3/400 = 0.75/100' },
        { show: V.frac(1, 1000), plain: '1/1,000', pct: 0.1, route: '1/1,000 = 0.1/100' },
        { show: hl('0.003'), plain: '0.003', pct: 0.3, route: '0.003 = 0.3 hundredths' },
        { show: hl('0.008'), plain: '0.008', pct: 0.8, route: '0.008 = 0.8 hundredths' },
        { show: hl('0.006'), plain: '0.006', pct: 0.6, route: '0.006 = 0.6 hundredths' },
      ]);
      const isDec = /^0\.0/.test(v.plain);
      opts = [
        { html: `${v.pct}%`, ok: true },
        {
          html: `${round(v.pct * 10, 2)}%`,
          why: `${round(v.pct * 10, 2)}% is ten times too big. ${isDec ? 'Moving the decimal point two places right' : 'Rewriting over 100'} gives ${v.pct}, not ${round(v.pct * 10, 2)}.`,
        },
        { html: `${round(v.pct * 100, 2)}%`, why: `${round(v.pct * 100, 2)}% would be ${round(v.pct * 100, 2)} out of 100. ${v.plain} is far less than one hundredth, so it is less than 1%.` },
        { html: `${round(v.pct / 10, 3)}%`, why: `${round(v.pct / 10, 3)}% is ten times too small. Rewrite ${v.plain} as hundredths: ${v.route}.` },
      ];
      prompt = `<p>In the lantern factory, ${v.show} of the glass panes crack in the kiln. What percent of the panes crack?</p>`;
      hints = [
        'A percent is a number of hundredths. Write the amount as "something out of 100." It may be less than 1 out of 100.',
        isDec ? `To change a decimal to a percent, move the decimal point two places to the right.` : `Divide the top and bottom of ${v.plain} so the bottom becomes 100. The top will be less than 1.`,
        isDec ? `Move the decimal point in ${v.plain} two places right, then add a percent sign.` : `Find the top number when the bottom is 100. Write it with a percent sign.`,
      ];
      hintEs = 'Un porcentaje es una cantidad de centésimos. Escribe la cantidad como "algo de cada 100". Puede ser menos de 1 de cada 100.';
      sol = `<p>Write the amount as hundredths: ${v.route}. So <b>${v.pct}%</b> of the panes crack. That is less than 1%: fewer than 1 pane in every 100.</p>`;
      correct = `Correct. ${v.plain} = ${v.pct}%, a percent less than 1.`;
    } else {
      v = r.pick([
        { words: 'half of one square', pct: 0.5, frac: '1/2' },
        { words: 'one quarter of one square', pct: 0.25, frac: '1/4' },
        { words: 'three quarters of one square', pct: 0.75, frac: '3/4' },
        { words: 'one tenth of one square', pct: 0.1, frac: '1/10' },
      ]);
      const thing = r.pick(['lantern oil', 'the gate', 'the festival banner']);
      opts = [
        { html: `${v.pct}%`, ok: true },
        { html: `${v.pct * 100}%`, why: `${v.pct * 100}% would be ${v.pct * 100} whole squares, not ${v.words}. One square is 1%, so part of a square is less than 1%.` },
        { html: `${v.pct * 10}%`, why: `${v.pct * 10}% is ${v.pct * 10} squares. ${cap(v.words)} is a fraction of a single 1% square.` },
        { html: `${v.pct / 10}%`, why: `${v.pct / 10}% is too small. One whole square is 1%, so ${v.frac} of a square is ${v.frac} of 1%.` },
      ];
      prompt = `<p>On a 100-grid that stands for ${thing}, only ${hl(v.words)} is shaded. What percent is shaded?</p>`;
      hints = ['One square on a 100-grid is 1 out of 100, which is 1%.', `${cap(v.words)} is ${v.frac} of 1%.`, `Find ${v.frac} of 1%. It will be less than 1%.`];
      hintEs = 'Un cuadro de una cuadrícula de 100 es 1 de 100, o sea, el 1%.';
      sol = `<p>One square is 1%. ${cap(v.words)} is ${v.frac} of 1%, which is <b>${v.pct}%</b>. Percents can be less than 1 when the part is smaller than one hundredth.</p>`;
      correct = `Correct. ${v.frac} of one square is ${v.pct}%, a percent less than 1.`;
    }
    const sh = shuffleOptions(r, opts, 0);
    return {
      type: 'mc',
      skill: 'over-100',
      lesson: '4-1',
      title: 'Less than one percent',
      prompt,
      options: sh.options,
      answer: sh.answer,
      hints,
      hintEs,
      solution: sol,
      feedback: { correct, wrong: whyOf(sh.options, 'One hundredth is 1%. An amount smaller than one hundredth is less than 1%.') },
    };
  });

  // ---------- Error: decimal greater than 1 written as a percent (error; hard = a zero in the tenths place) ----------
  G.define('p1_errorOver100', (r, o) => {
    const hard = !!o.hard;
    const name = r.pick(NAMES);
    const whole = r.int(1, 3);
    const d = r.int(1, 9);
    const dec = hard ? `${whole}.0${d}` : `${whole}.${d}`;
    const wrongPct = whole * 10 + d;
    const rightPct = hard ? whole * 100 + d : whole * 100 + d * 10;
    const work = hard ? `${dec} → drop the 0 and move the point → ${wrongPct}%` : `${dec} → move the decimal point → ${wrongPct}%`;
    const okHtml = hard
      ? `${name} dropped the 0 in the tenths place. Moving the point two places right keeps it: ${dec} = ${rightPct}%.`
      : `${name} moved the decimal point only one place. To write a decimal as a percent, move it two places: ${dec} = ${rightPct}%.`;
    const opts = [
      { html: okHtml, ok: true },
      {
        html: `${name} should have written ${dec}%, because the number itself does not change.`,
        why: `A decimal and a percent are different forms. ${dec} is more than 1 whole, so it must be more than 100%.`,
      },
      {
        html: `${name} is correct. A percent can never be more than 100%, so the answer must be small.`,
        why: `Percents can be greater than 100%. ${dec} is more than 1 whole, so it is more than 100%.`,
      },
      { html: `${name} should have divided by 100 to get ${round(Number(dec) / 100, 4)}%.`, why: 'Dividing by 100 makes the number smaller. Changing a decimal to a percent multiplies by 100.' },
    ];
    const sh = shuffleOptions(r, opts, 0);
    return {
      type: 'error',
      skill: 'over-100',
      lesson: '4-1',
      title: 'Find the mistake',
      prompt: `<p>${name} is writing the decimal ${hl(dec)} as a percent. What is the mistake?</p>`,
      work,
      options: sh.options,
      answer: sh.answer,
      fix: { label: `Write ${dec} as a percent:`, answer: rightPct },
      hints: [
        'Is 1.0 equal to 100% or 10%? Use that to test the student’s method.',
        `${dec} is more than ${whole} whole${whole > 1 ? 's' : ''}, so the percent must be more than ${whole * 100}%.`,
        hard ? `Multiply ${dec} by 100: move the point two places right and keep every digit, including the 0.` : `Move the decimal point two places to the right in ${dec}.`,
      ],
      hintEs: '¿1.0 es igual al 100% o al 10%? Usa eso para probar el método del estudiante.',
      solution: `<p>1 whole = 100%, so ${dec} wholes must be more than ${whole * 100}%. To change a decimal to a percent, multiply by 100 (move the decimal point two places right): ${dec} = <b>${rightPct}%</b>. ${hard ? `${name} dropped the 0 in the tenths place, which changed the value.` : `${name} only moved it one place.`}</p>`,
      feedback: {
        correct: `Correct. ${dec} = ${rightPct}%. Decimals greater than 1 become percents greater than 100.`,
        wrong(ans, dd) {
          if (!dd.mistakeOk)
            return hard
              ? `Test the method on 1.05. One whole is 100% and 5 hundredths is 5%, so 1.05 should be 105%. What did ${name} lose?`
              : `Test the method on 1.0. It should give 100%, not 10%. How many places should the decimal point move?`;
          const v = parseNum(ans.fix);
          if (v === wrongPct) return `${wrongPct}% is the student's wrong answer. ${hard ? 'Keep the 0 when you move the point.' : 'Move the decimal point two places, not one.'}`;
          if (hard && v === whole * 100 + d * 10) return `${v}% would be ${whole}.${d}. The ${d} is in the hundredths place of ${dec}, so it adds ${d}%, not ${d * 10}%.`;
          return `You found the mistake. Now multiply ${dec} by 100 to write it as a percent.`;
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
  // Hard-mode fractions: eighths, fortieths, two-hundredths, and values greater than 1. Decimals have at most 3 places.
  const HARD = [
    [1, 8],
    [3, 8],
    [5, 8],
    [7, 8],
    [1, 40],
    [3, 40],
    [7, 40],
    [9, 40],
    [11, 40],
    [13, 40],
    [1, 200],
    [3, 200],
    [5, 4],
    [3, 2],
    [6, 5],
    [7, 4],
  ];
  const pctOf = ([n, d]) => round((n / d) * 100, 2);
  const decOf = ([n, d]) => round(n / d, 3);
  const decStr = (x) => String(round(x, 3));
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
  // Pick k distinct values with at least `nHard` from HARD (the rest from `pool`).
  const pickMixed = (r, k, nHard, pool, hardPool) => {
    const h = pickDistinct(r, nHard, hardPool || HARD);
    const used = new Set(h.map(pctOf));
    const rest = pickDistinct(
      r,
      k - nHard,
      (pool || FRIENDLY).filter((f) => !used.has(pctOf(f))),
    );
    return r.shuffle(h.concat(rest));
  };
  // Render a value in a given form. form: 'f' | 'd' | 'p'
  const show = (f, form) => (form === 'f' ? V.frac(f[0], f[1]) : form === 'd' ? decStr(decOf(f)) : `${pctOf(f)}%`);
  const showText = (f, form) => (form === 'f' ? `${f[0]}/${f[1]}` : form === 'd' ? decStr(decOf(f)) : `${pctOf(f)}%`);
  const explain = (f) => `${f[0]}/${f[1]} = ${decStr(decOf(f))} = ${pctOf(f)}%`;
  const fracRoute = (f) =>
    100 % f[1] === 0 ? `multiply the top and bottom of ${f[0]}/${f[1]} by ${100 / f[1]} to get a denominator of 100` : `divide ${f[0]} ÷ ${f[1]} to get a decimal, then multiply by 100`;
  const whyOf = (options, fallback) => (ans) => (options[ans] && options[ans].why) || fallback;

  // ---------- Complete the fraction–decimal–percent table (table; hard = eighths, fortieths, over 100%) ----------
  G.define('p2_table', (r, o) => {
    const hard = !!o.hard;
    const fr = hard ? pickMixed(r, 4, 2) : pickDistinct(r, 3);
    const inputs = [];
    const rows = [['Fraction', 'Decimal', 'Percent']];
    fr.forEach((f, i) => {
      const mode = hard ? (i === 0 ? 0 : r.int(0, 2)) : i % 3;
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
    const inTable = new Set(fr.map(pctOf));
    const ex = [
      [1, 4],
      [3, 5],
      [1, 2],
      [7, 10],
      [9, 20],
    ].find((f) => !inTable.has(pctOf(f)));
    return {
      type: 'table',
      skill: 'fdp-convert',
      lesson: '4-2',
      title: hard ? 'Complete the hard exchange table' : 'Complete the exchange table',
      prompt: `<p>Every price in Exchange Square is written three ways. This table has rows for ${fr.map((f) => V.frac(f[0], f[1])).join(', ')}. Complete it. Write percents without the % sign.</p>`,
      rows,
      inputs,
      header: true,
      hints: [
        'Fraction → decimal: divide the top by the bottom, or make an equivalent fraction with denominator 100.',
        `Decimal → percent: multiply by 100 (move the decimal point two places right). For example, ${ex[0]}/${ex[1]} = ${decStr(decOf(ex))} = ${pctOf(ex)}%.`,
        hard
          ? 'When the denominator does not divide 100 (like 8 or 40), divide the top by the bottom. A fraction greater than 1 gives a decimal greater than 1 and a percent greater than 100%.'
          : 'In each row, the percent is the decimal × 100, and the decimal is the percent ÷ 100. Fill each blank from the value you are given.',
      ],
      hintEs: 'Fracción → decimal: divide el número de arriba entre el de abajo, o busca una fracción equivalente con denominador 100.',
      solution: `<p>${fr.map((f) => `<b>${explain(f)}</b>`).join('<br>')}</p><p>A fraction with denominator 100 tells you the percent directly. The decimal is the same hundredths written with a point.${hard ? ' For eighths and fortieths, divide; a fraction greater than 1 is more than 100%.' : ''}</p>`,
      feedback: {
        correct: 'Correct. Each row names one number three ways.',
        wrong(ans, d) {
          const bad = d.wrong[0];
          const i = Number(bad.slice(1));
          const f = fr[i];
          const v = parseNum(ans[bad]);
          if (bad[0] === 'p' && v != null && Math.abs(v - decOf(f)) < 1e-9)
            return `In the ${f[0]}/${f[1]} row you wrote the decimal in the percent column. Multiply the decimal by 100 for the percent.`;
          if (bad[0] === 'd' && v === pctOf(f)) return `In the ${f[0]}/${f[1]} row you wrote the percent in the decimal column. Divide the percent by 100 for the decimal.`;
          if (v != null && Math.abs(v - (bad[0] === 'p' ? (f[1] / f[0]) * 100 : f[1] / f[0])) < 0.01) return `In the ${f[0]}/${f[1]} row you divided the bottom by the top. Divide ${f[0]} by ${f[1]}.`;
          if (v != null && bad[0] === 'p' && Math.abs(v - pctOf(f) / 10) < 1e-9)
            return `In the ${f[0]}/${f[1]} row you moved the decimal point only one place. Percent means hundredths: move it two places.`;
          return `Check the row for ${f[0]}/${f[1]}: ${fracRoute(f)}.`;
        },
      },
    };
  });

  // ---------- Match equivalent forms (match; hard = eighths, fortieths, over 100%) ----------
  G.define('p2_match', (r, o) => {
    const hard = !!o.hard;
    const fr = hard ? pickMixed(r, 5, 3) : pickDistinct(r, 5);
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
      prompt: `<p>Each value on the left equals exactly one value on the right. Match them.${hard ? ' Some values are greater than 1 whole, and some have thousandths.' : ''}</p>`,
      left,
      right,
      pairs: fr.map((_, i) => [i, perm.indexOf(i)]),
      hints: [
        'Change every value to a percent first. Then matching is just finding equal percents.',
        `Fraction → percent: make the denominator 100, or divide top by bottom and multiply by 100. Decimal → percent: move the decimal point two places right.`,
        'Match the value you are surest of first. Then match the rest; each value on the right is used once.',
      ],
      hintEs: 'Primero cambia cada valor a porcentaje. Después solo tienes que buscar los porcentajes iguales.',
      solution: `<p>${fr.map((f, i) => `${showText(f, leftForms[i])} = ${showText(f, rightForms[i])} (both are ${pctOf(f)}%)`).join('<br>')}</p>`,
      feedback: {
        correct: 'Correct. Turning everything into percents makes equal values easy to spot.',
        wrong(ans, d) {
          const i = (d.wrong || [])[0];
          if (i == null) return 'Match every value. Each value on the right is used exactly once.';
          const f = fr[i];
          const form = leftForms[i];
          const tip = form === 'f' ? fracRoute(f) : form === 'd' ? `move the decimal point in ${showText(f, 'd')} two places right` : `divide ${pctOf(f)} by 100 for the decimal`;
          return `Check the match for ${showText(f, form)}. To find its percent, ${tip}. Then look for the value on the right with the same percent.`;
        },
      },
    };
  });

  // ---------- Convert one value (num): fraction→percent, decimal→percent, percent→decimal (hard = eighths, fortieths, over 100%, under 1%) ----------
  G.define('p2_fracToPct', (r, o) => {
    const hard = !!o.hard;
    const mode = r.pick(['fp', 'dp', 'pd', 'fp']);
    const pool = hard
      ? HARD
      : mode === 'fp'
        ? FRIENDLY.concat([
            [1, 8],
            [3, 8],
            [5, 8],
            [7, 8],
          ])
        : FRIENDLY;
    const f = r.pick(pool);
    const pct = pctOf(f);
    const dec = decOf(f);
    const name = r.pick(NAMES);
    const ctx = r.pick(
      f[0] > f[1]
        ? [
            (g) => `the festival used ${g} of last year’s lamp oil`,
            (g) => `this year’s lantern count is ${g} of last year’s count`,
            (g) => `the bakery sold ${g} of its usual number of festival cakes`,
          ]
        : [(g) => `${g} of the lanterns on the bridge are lit`, (g) => `${g} of the festival tickets are sold`, (g) => `the oil tank is ${g} full`, (g) => `${g} of the glass squares are blue`],
    );
    if (mode === 'fp' || mode === 'dp') {
      const given = mode === 'fp' ? V.frac(f[0], f[1]) : hl(decStr(dec));
      const givenText = mode === 'fp' ? `${f[0]}/${f[1]}` : decStr(dec);
      const by100 = mode === 'fp' && 100 % f[1] === 0;
      const setUp = by100
        ? `100 ÷ ${f[1]} = ${100 / f[1]}, so multiply the top and bottom of ${f[0]}/${f[1]} by ${100 / f[1]}.`
        : mode === 'fp'
          ? `${f[1]} does not divide 100 evenly, so divide: ${f[0]} ÷ ${f[1]} gives a decimal. Then multiply by 100.`
          : `To change a decimal to a percent, multiply by 100: move the decimal point two places to the right.`;
      const last = by100
        ? `Multiply the top: ${f[0]} × ${100 / f[1]} hundredths. That many hundredths is the percent.`
        : mode === 'fp'
          ? `Find ${f[0]} ÷ ${f[1]}, then move the decimal point two places right.`
          : `Move the decimal point in ${givenText} two places right and add a % sign.`;
      return {
        type: 'num',
        skill: 'fdp-convert',
        lesson: '4-2',
        title: 'Write it as a percent',
        prompt: `<p>${name} says ${ctx(given)}.</p><p>Write ${givenText} as a <b>percent</b>.</p>`,
        unit: '%',
        answer: pct,
        hints: ['A percent is a number out of 100. Find how many hundredths the value is.', setUp, last],
        hintEs: mode === 'fp' ? 'Un porcentaje es un número de cada 100. Busca cuántos centésimos es la fracción.' : 'Un porcentaje es un número de cada 100. Busca cuántos centésimos es el decimal.',
        solution: `<p>${by100 ? `${f[0]}/${f[1]} = ${round((f[0] * 100) / f[1], 2)}/100.` : mode === 'fp' ? `${f[0]} ÷ ${f[1]} = ${decStr(dec)}, and ${decStr(dec)} × 100 = ${pct}.` : `${givenText} × 100 = ${pct}.`} So ${givenText} = <b>${pct}%</b>. The percent is the number of hundredths.${pct > 100 ? ' It is more than 100% because the value is more than 1 whole.' : pct < 1 ? ' It is less than 1% because the value is less than one hundredth.' : ''}</p>`,
        feedback: {
          correct: `Correct. ${givenText} is ${pct} out of 100, which is ${pct}%.`,
          wrong(ans, d) {
            const v = d.value;
            if (v != null && Math.abs(v - dec) < 1e-9) return `You wrote the decimal, ${decStr(dec)}. A percent counts hundredths, so multiply by 100.`;
            if (v != null && Math.abs(v - pct / 10) < 1e-9) return `You moved the decimal point only one place. Percent means per hundred, so move it two places.`;
            if (v != null && Math.abs(v - pct * 10) < 1e-9) return `You moved the decimal point three places. Multiplying by 100 moves it exactly two places.`;
            if (mode === 'fp' && v != null && Math.abs(v - (f[1] / f[0]) * 100) < 0.01) return `You divided the bottom by the top. Divide the top (${f[0]}) by the bottom (${f[1]}).`;
            if (mode === 'fp' && v === f[0]) return `${f[0]} is just the top of the fraction. ${f[0]}/${f[1]} is not ${f[0]} out of 100 unless the bottom is 100.`;
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
      prompt: `<p>${name} says ${ctx(hl(pct + '%'))}.</p><p>Write ${pct}% as a <b>decimal</b>.</p>`,
      answer: dec,
      hints: [
        'Percent means per hundred, so a percent is a number of hundredths.',
        `${pct}% = ${pct} hundredths = ${pct}/100.`,
        `Divide ${pct} by 100: move the decimal point two places to the left.`,
      ],
      hintEs: 'Porcentaje quiere decir "por cada cien", así que un porcentaje es una cantidad de centésimos.',
      solution: `<p>${pct}% means ${pct} hundredths. ${pct} ÷ 100 = <b>${decStr(dec)}</b>. Moving the decimal point two places to the left divides by 100.${pct > 100 ? ' A percent over 100% gives a decimal greater than 1.' : ''}</p>`,
      feedback: {
        correct: `Correct. ${pct}% = ${decStr(dec)}.`,
        wrong(ans, d) {
          const v = d.value;
          if (v === pct) return `${pct} is the percent. The decimal is ${pct} hundredths, so divide by 100.`;
          if (v != null && Math.abs(v - pct / 10) < 1e-9) return `You moved the decimal point only one place. ${pct}% is ${pct} hundredths, so move it two places.`;
          if (v != null && Math.abs(v - pct / 1000) < 1e-9) return `You moved the decimal point three places. Dividing by 100 moves it exactly two places.`;
          return `Write ${pct}% as ${pct}/100, then as a decimal.`;
        },
      },
    };
  });

  // ---------- Error: decimal ↔ percent slip (error; hard = thousandths, over 1, under 1%) ----------
  G.define('p2_errorDecimal', (r, o) => {
    const hard = !!o.hard;
    const name = r.pick(NAMES);
    const v = r.pick(
      hard
        ? [
            { dec: '0.125', wrong: '125%', right: 12.5, note: '0.125 is 12.5 hundredths (125 thousandths)', slip: 'read the thousandths as if they were hundredths' },
            { dec: '0.375', wrong: '375%', right: 37.5, note: '0.375 is 37.5 hundredths (375 thousandths)', slip: 'read the thousandths as if they were hundredths' },
            { dec: '1.5', wrong: '15%', right: 150, note: '1.5 is 1 whole and 5 tenths, which is 150 hundredths', slip: 'ignored that the number is more than 1 whole' },
            { dec: '2.4', wrong: '24%', right: 240, note: '2.4 is 2 wholes and 4 tenths, which is 240 hundredths', slip: 'ignored that the number is more than 1 whole' },
            { dec: '0.005', wrong: '5%', right: 0.5, note: '0.005 is half of one hundredth (5 thousandths)', slip: 'read 5 thousandths as 5 hundredths' },
            { dec: '0.008', wrong: '8%', right: 0.8, note: '0.008 is 0.8 of one hundredth (8 thousandths)', slip: 'read 8 thousandths as 8 hundredths' },
          ]
        : [
            { dec: '0.7', wrong: '7%', right: 70, note: '0.7 is 7 tenths, which is 70 hundredths', slip: 'used the digit instead of the place value' },
            { dec: '0.4', wrong: '4%', right: 40, note: '0.4 is 4 tenths, which is 40 hundredths', slip: 'used the digit instead of the place value' },
            { dec: '0.9', wrong: '9%', right: 90, note: '0.9 is 9 tenths, which is 90 hundredths', slip: 'used the digit instead of the place value' },
            { dec: '0.06', wrong: '60%', right: 6, note: '0.06 is 6 hundredths, not 60 hundredths', slip: 'read 6 hundredths as 6 tenths' },
            { dec: '0.03', wrong: '30%', right: 3, note: '0.03 is 3 hundredths, not 30 hundredths', slip: 'read 3 hundredths as 3 tenths' },
            { dec: '0.5', wrong: '5%', right: 50, note: '0.5 is 5 tenths, which is 50 hundredths', slip: 'used the digit instead of the place value' },
          ],
    );
    const opts = [
      { html: `${name} ${v.slip}. ${v.note}, so ${v.dec} = ${v.right}%.`, ok: true },
      {
        html: `${name} should have written ${v.dec}% because the number itself stays the same.`,
        why: 'Changing a decimal to a percent multiplies by 100. The digits shift two places; the number does not stay the same.',
      },
      {
        html: `${name} is correct. You just drop the zeros and the decimal point to get the percent.`,
        why: `Dropping symbols is not a rule. Think in hundredths: ${v.note}.`,
      },
      {
        html: `${name} should have divided ${v.dec} by 100 instead, because a percent is a smaller number.`,
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
      hints: ['Percent means hundredths. How many hundredths is the decimal?', `${v.note}.`, `Write that number of hundredths with a percent sign.`],
      hintEs: 'Porcentaje quiere decir centésimos. ¿Cuántos centésimos es el decimal?',
      solution: `<p>${v.note}. A percent counts hundredths, so ${v.dec} = <b>${v.right}%</b>. The quick rule is to move the decimal point two places to the right: ${v.dec} → ${v.right}.</p>`,
      feedback: {
        correct: `Correct. ${v.dec} = ${v.right}%. Think in hundredths, not digits.`,
        wrong(ans, d) {
          if (!d.mistakeOk) return `Ask: how many hundredths is ${v.dec}? Compare that with ${v.wrong}.`;
          const fv = parseNum(ans.fix);
          if (fv != null && `${fv}%` === v.wrong) return `${v.wrong} is the student's answer. Move the decimal point exactly two places right in ${v.dec}.`;
          return `You found the mistake. Now count hundredths in ${v.dec}: move the decimal point two places right.`;
        },
      },
    };
  });

  // ---------- Order mixed forms (seq; hard = 5 close values with eighths and fortieths) ----------
  G.define('p2_seq', (r, o) => {
    const hard = !!o.hard;
    const k = hard ? 5 : 4;
    const mid = (f) => pctOf(f) >= 25 && pctOf(f) <= 75;
    const frH = hard
      ? pickMixed(
          r,
          k,
          2,
          FRIENDLY.filter(mid),
          HARD.filter((f) => pctOf(f) > 10 && pctOf(f) < 90),
        )
      : pickDistinct(r, k);
    const forms = r.shuffle(['f', 'd', 'p', 'f', 'd'].slice(0, k));
    const items = frH.map((f, i) => ({ html: `<b>${show(f, forms[i])}</b>`, rate: pctOf(f) }));
    const asc = r.chance(0.6);
    const order = frH.map((_, i) => i).sort((a, b) => (asc ? items[a].rate - items[b].rate : items[b].rate - items[a].rate));
    return {
      type: 'seq',
      skill: 'fdp-compare',
      lesson: '4-2',
      title: 'Order the lanterns',
      prompt: `<p>Each lantern in the square shows how full its oil is, but each uses a different form.${hard ? ' Some values are close together, so convert every one before you compare.' : ''} Order them from <b>${asc ? 'least' : 'greatest'}</b> (top) to <b>${asc ? 'greatest' : 'least'}</b> (bottom).</p>`,
      items,
      order,
      hints: [
        'You cannot compare a fraction, a decimal, and a percent directly. Change every value to the same form first.',
        'Percents are easiest: fraction → denominator 100 (or divide top by bottom); decimal → move the decimal point two places right.',
        `Write each value as a percent beside it. Then order the percents ${asc ? 'from least to greatest' : 'from greatest to least'}.`,
      ],
      hintEs: 'No puedes comparar directamente una fracción, un decimal y un porcentaje. Primero cambia todos los valores a la misma forma.',
      solution: `<p>As percents: ${frH.map((f, i) => `${showText(f, forms[i])} = ${pctOf(f)}%`).join('; ')}. Order (${asc ? 'least to greatest' : 'greatest to least'}): <b>${order.map((i) => showText(frH[i], forms[i])).join(', ')}</b>.</p>`,
      feedback: {
        correct: 'Correct. Once every value is a percent, ordering is just comparing numbers.',
        wrong(ans) {
          const a = Array.isArray(ans) ? ans : [];
          if (a.length === order.length && a.every((v, i) => v === order[order.length - 1 - i])) return `Your order is reversed. The ${asc ? 'least' : 'greatest'} value goes on top.`;
          const pos = a.findIndex((v, i) => v !== order[i]);
          if (pos >= 0 && a[pos] != null && frH[a[pos]]) {
            const f = frH[a[pos]];
            return `Position ${pos + 1} is not right. Check ${showText(f, forms[a[pos]])}: change it to a percent and compare it with its neighbors.`;
          }
          return `Change each value to a percent, then check the direction: ${asc ? 'least' : 'greatest'} goes on top.`;
        },
      },
    };
  });

  // ---------- Select all values greater than a target (ms; hard = eighths target, close values) ----------
  G.define('p2_greaterThan', (r, o) => {
    const hard = !!o.hard;
    const target = r.pick(
      hard
        ? [
            [3, 8],
            [5, 8],
            [9, 20],
            [13, 20],
            [7, 20],
          ]
        : [
            [1, 2],
            [3, 5],
            [2, 5],
            [1, 4],
            [3, 4],
            [7, 10],
          ],
    );
    const tForm = r.pick(['f', 'd', 'p']);
    const tp = pctOf(target);
    const band = hard ? 16 : 40;
    const all = FRIENDLY.concat(HARD);
    const pool = (hard ? all : FRIENDLY).filter((f) => pctOf(f) !== tp && Math.abs(pctOf(f) - tp) <= band);
    const chosen = pickDistinct(r, 5, pool);
    const forms = r.shuffle(['f', 'd', 'p', 'f', 'd']);
    const greater = chosen.map((f, i) => i).filter((i) => pctOf(chosen[i]) > tp);
    if (greater.length === 0 || greater.length === 5) {
      const idxMax = chosen.reduce((m, f, i) => (pctOf(f) > pctOf(chosen[m]) ? i : m), 0);
      const idxMin = chosen.reduce((m, f, i) => (pctOf(f) < pctOf(chosen[m]) ? i : m), 0);
      const used = new Set(chosen.map(pctOf));
      const repl = all.filter((f) => !used.has(pctOf(f)) && pctOf(f) <= 100 && (greater.length === 0 ? pctOf(f) > tp : pctOf(f) < tp));
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
        tForm === 'p' ? `The Keeper's value is already a percent: ${tp}%.` : `First write the Keeper's value as a percent: ${showText(target, tForm)} = ${tp}%.`,
        'Change each option to a percent the same way. For a fraction, divide the top by the bottom; for a decimal, move the point two places right.',
        `Write each option's percent next to it. Select every one that is more than ${tp}%; equal does not count.`,
      ],
      hintEs: tForm === 'p' ? `El valor del Guardián ya es un porcentaje: ${tp}%.` : `Primero escribe el valor del Guardián como porcentaje: ${showText(target, tForm)} = ${tp}%.`,
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

  // ---------- True/false comparison with reasons (tf; hard = thousandths vs a close percent) ----------
  G.define('p2_tfCompare', (r, o) => {
    const hard = !!o.hard;
    const name = r.pick(NAMES);
    let a, pb;
    if (hard) {
      a = r.pick(HARD.filter((f) => pctOf(f) % 1 !== 0 && pctOf(f) > 1 && pctOf(f) < 100));
      const pa0 = pctOf(a);
      pb = r.pick([Math.floor(pa0), Math.ceil(pa0), Math.floor(pa0) - 1, Math.ceil(pa0) + 1].filter((x) => x > 0));
    } else {
      const [x, y] = pickDistinct(
        r,
        2,
        FRIENDLY.filter((f) => Math.abs(pctOf(f) - 50) <= 35),
      );
      a = x;
      pb = pctOf(y);
    }
    const aForm = hard ? r.pick(['d', 'd', 'f']) : r.pick(['d', 'f']);
    const pa = pctOf(a);
    const claimGreater = r.chance(0.5);
    const truth = claimGreater ? pa > pb : pa < pb;
    const word = claimGreater ? 'greater than' : 'less than';
    const sym = claimGreater ? '>' : '<';
    const aText = showText(a, aForm);
    const digitsReason =
      aForm === 'd'
        ? hard
          ? `${aText} has more digits than ${pb}%, so it must be the larger number.`
          : `${aText} has fewer digits than ${pb}%, so it must be the smaller number.`
        : `${a[0]} and ${a[1]} are both smaller than ${pb}, so the fraction is smaller.`;
    const reasons = r.shuffle([
      { html: `${aText} = ${pa}%, and ${pa}% is ${pa > pb ? 'greater' : 'less'} than ${pb}%.`, correct: true },
      { html: `${aText} = ${pa}%, and ${pa}% is ${pa > pb ? 'less' : 'greater'} than ${pb}%.`, correct: false },
      { html: `A ${aForm === 'd' ? 'decimal' : 'fraction'} is always ${r.pick(['greater', 'less'])} than a percent, no matter the numbers.`, correct: false },
      { html: digitsReason, correct: false },
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
        aForm === 'd' ? `Move the decimal point in ${aText} two places right to get its percent.` : `Divide ${a[0]} ÷ ${a[1]}, then multiply by 100 to get its percent.`,
        `Compare that percent with ${pb}%. Is it ${word} ${pb}%?`,
      ],
      hintEs: 'No se pueden comparar formas distintas por sus dígitos. Cambia los dos valores a porcentaje.',
      solution: `<p>${aText} = ${pa}%. Compare: ${pa}% ${pa > pb ? '>' : '<'} ${pb}%. So "${aText} is ${word} ${pb}%" is <b>${truth ? 'true' : 'false'}</b>. Always convert to the same form before comparing.</p>`,
      feedback: {
        correct: `Correct. ${aText} = ${pa}%, so the comparison with ${pb}% is clear.`,
        wrong(ans, d) {
          if (!d.valueOk) return `Convert first, then compare. ${aText} as a percent: is it really ${word} ${pb}%?`;
          return `Your true/false is right, but the reason must compare the two values in the same form (percents). Digit counts and "always" rules do not work.`;
        },
      },
    };
  });

  // ---------- Place values on a percent number line (nl; hard = 0% to 150% with values over 100%) ----------
  G.define('p2_nlPlace', (r, o) => {
    const hard = !!o.hard;
    const OVER = [
      [5, 4],
      [3, 2],
      [6, 5],
      [7, 5],
      [11, 10],
      [13, 10],
      [23, 20],
      [27, 20],
    ];
    const pool = FRIENDLY.filter((f) => pctOf(f) % 5 === 0);
    let fr;
    if (hard) {
      const over = pickDistinct(r, r.int(1, 2), OVER);
      const used = new Set(over.map(pctOf));
      fr = r.shuffle(
        over.concat(
          pickDistinct(
            r,
            3 - over.length,
            pool.filter((f) => !used.has(pctOf(f))),
          ),
        ),
      );
    } else fr = pickDistinct(r, 3, pool);
    const forms = r.shuffle(['f', 'd', 'p']);
    const points = fr.map((f) => pctOf(f));
    const max = hard ? 150 : 100;
    const labelEvery = hard ? 50 : 25;
    return {
      type: 'nl',
      skill: 'fdp-compare',
      lesson: '4-2',
      title: 'Place them on the percent line',
      prompt: `<p>The Keeper's measuring pole is marked in percents from 0% to ${max}%. Place each value on the line: ${fr.map((f, i) => (forms[i] === 'f' ? V.frac(f[0], f[1]) : hl(showText(f, forms[i])))).join(', &nbsp;')}.</p>`,
      min: 0,
      max,
      step: 5,
      labelEvery,
      count: 3,
      points,
      labels: fr.map((f, i) => showText(f, forms[i])),
      hints: [
        `Change each value to a percent. The line is marked every 5%, with labels every ${labelEvery}%.`,
        hard ? 'A value greater than 1 whole is greater than 100%. For example, 1.2 = 120% and 6/5 = 120%.' : 'Fraction → make the denominator 100. Decimal → move the decimal point two places right.',
        'Find each percent on the line, counting by 5s from the nearest label.',
      ],
      hintEs: `Cambia cada valor a porcentaje. La recta está marcada cada 5%, con etiquetas cada ${labelEvery}%.`,
      solution: `<p>${fr.map((f, i) => `${showText(f, forms[i])} = <b>${pctOf(f)}%</b>`).join('; ')}. Each value sits at its percent on the line.</p>${V.numberLine({ min: 0, max, step: 5, labelEvery, points: fr.map((f) => ({ v: pctOf(f), label: `${pctOf(f)}%`, above: true })), aria: 'Percent number line with the three values placed' })}`,
      feedback: {
        correct: 'Correct. On a percent line, every form lands on its percent.',
        wrong(ans, d) {
          const miss = (d.missing || [])[0];
          const i = fr.findIndex((f) => pctOf(f) === miss);
          if (i < 0) return 'Place exactly one point for each value.';
          const f = fr[i];
          const tip = forms[i] === 'f' ? fracRoute(f) : forms[i] === 'd' ? `move the decimal point in ${showText(f, 'd')} two places right` : 'find that percent on the line';
          const over = pctOf(f) > 100 ? ' It is more than 1 whole, so it goes past 100%.' : '';
          return `${showText(f, forms[i])} is not placed right. To find its percent, ${tip}.${over}`;
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
    1: { frac: '1/100', how: 'move the decimal point two places to the left', word: 'one hundredth', es: 'mueve el punto decimal dos lugares a la izquierda' },
    10: { frac: '1/10', how: 'move the decimal point one place to the left', word: 'one tenth', es: 'mueve el punto decimal un lugar a la izquierda' },
    25: { frac: '1/4', how: 'divide by 4 (or halve twice)', word: 'one quarter', es: 'divide entre 4 (o saca la mitad dos veces)' },
    50: { frac: '1/2', how: 'divide by 2', word: 'one half', es: 'divide entre 2' },
    75: { frac: '3/4', how: 'find one quarter, then multiply by 3', word: 'three quarters', es: 'halla un cuarto y luego multiplícalo por 3' },
  };
  // Hard-mode percents built from benchmarks.
  const COMBO = {
    2: { how: 'find 1%, then double it', es: 'halla el 1% y luego duplícalo', step: (n) => `1% of ${fmt(n)} is ${fmt(n / 100)}` },
    3: { how: 'find 1%, then multiply by 3', es: 'halla el 1% y luego multiplícalo por 3', step: (n) => `1% of ${fmt(n)} is ${fmt(n / 100)}` },
    5: { how: 'find 10%, then take half of it', es: 'halla el 10% y luego saca la mitad', step: (n) => `10% of ${fmt(n)} is ${fmt(n / 10)}` },
    15: {
      how: 'find 10% and 5% (half of 10%), then add them',
      es: 'halla el 10% y el 5% (la mitad del 10%), y luego súmalos',
      step: (n) => `10% of ${fmt(n)} is ${fmt(n / 10)}, and 5% is half of that`,
    },
    20: { how: 'find 10%, then double it', es: 'halla el 10% y luego duplícalo', step: (n) => `10% of ${fmt(n)} is ${fmt(n / 10)}` },
    30: { how: 'find 10%, then multiply by 3', es: 'halla el 10% y luego multiplícalo por 3', step: (n) => `10% of ${fmt(n)} is ${fmt(n / 10)}` },
    40: { how: 'find 10%, then multiply by 4', es: 'halla el 10% y luego multiplícalo por 4', step: (n) => `10% of ${fmt(n)} is ${fmt(n / 10)}` },
    60: { how: 'find 50% and 10%, then add them', es: 'halla el 50% y el 10%, y luego súmalos', step: (n) => `50% of ${fmt(n)} is ${fmt(n / 2)} and 10% is ${fmt(n / 10)}` },
  };
  const howOf = (p) => (BENCH[p] || COMBO[p]).how;
  const esOf = (p) => (BENCH[p] || COMBO[p]).es;
  const CTX = [
    { what: 'lamps on the row', unit: 'lamps', act: 'need new wicks' },
    { what: 'lanterns in the warehouse', unit: 'lanterns', act: 'need new glass' },
    { what: 'festival visitors', unit: 'visitors', act: 'came from the harbor district' },
    { what: 'candles in the crate', unit: 'candles', act: 'are made of beeswax' },
    { what: 'tickets printed', unit: 'tickets', act: 'are for the night parade' },
    { what: 'oil jars on the shelf', unit: 'jars', act: 'are still sealed' },
  ];
  // A number that makes p% exact and whole.
  const niceN = (r, p, lo, hi) => {
    const m = [1, 2, 3].includes(p) ? 100 : [10, 20, 30, 40, 60].includes(p) ? 10 : p === 50 ? 2 : [5, 15].includes(p) ? 20 : 4;
    return m * r.int(Math.ceil(lo / m), Math.floor(hi / m));
  };
  const of = (p, n) => round((p / 100) * n, 2);
  // Estimation numbers: a round, compatible friendly number and a nearby real number for which it is the natural rounding.
  const friendlyFor = (r, p, lo, hi) => {
    const m = [25, 75, 5, 15].includes(p) ? 20 : 10;
    return m * r.int(Math.ceil(lo / m), Math.floor(hi / m));
  };
  const actualFor = (r, p, friendly, wide) => friendly + r.pick([25, 75, 5, 15].includes(p) ? [-2, -1, 1, 2] : wide ? [-4, -3, -2, 2, 3, 4] : [-3, -2, -1, 1, 2, 3]);
  const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
  const whyOf = (options, fallback) => (ans) => (options[ans] && options[ans].why) || fallback;

  // ---------- Exact benchmark value (num; hard = percents built from benchmarks, no benchmark given) ----------
  G.define('p3_benchmarkOf', (r, o) => {
    const hard = !!o.hard;
    const p = hard ? r.pick([2, 3, 5, 15, 20, 30, 40, 60]) : r.pick([1, 10, 25, 50, 75]);
    const n = hard ? niceN(r, p, [2, 3].includes(p) ? 300 : 60, [2, 3].includes(p) ? 2000 : 480) : niceN(r, p, p === 1 ? 300 : 40, p === 1 ? 2000 : 400);
    const ctx = r.pick(CTX);
    const ans = of(p, n);
    const b = BENCH[p];
    const c = COMBO[p];
    const hints = hard
      ? [
          `${p}% is not a single benchmark, but you can build it from benchmarks: ${c.how}.`,
          `${cap(c.step(n))}.`,
          p === 5
            ? `Halve ${fmt(n / 10)}.`
            : p === 15
              ? `Add ${fmt(n / 10)} + ${fmt(n / 20)}.`
              : p === 60
                ? `Add ${fmt(n / 2)} + ${fmt(n / 10)}.`
                : `Multiply ${fmt([2, 3].includes(p) ? n / 100 : n / 10)} × ${[2, 3].includes(p) ? p : p / 10}.`,
        ]
      : [
          `${p}% = ${b.frac}. To find ${b.word} of a number, ${b.how}.`,
          `Start with ${fmt(n)}. ${p === 75 ? `One quarter of ${fmt(n)} is ${n / 4}.` : `${cap(b.how)}.`}`,
          p === 75 ? `Multiply ${n / 4} × 3.` : p === 25 ? `Half of ${fmt(n)} is ${n / 2}. Now halve ${n / 2}.` : p === 50 ? `Divide ${fmt(n)} ÷ 2.` : `Divide ${fmt(n)} ÷ ${p === 10 ? 10 : 100}.`,
        ];
    return {
      type: 'num',
      skill: 'benchmarks',
      lesson: '4-3',
      title: hard ? 'Build it from benchmarks' : 'Benchmark in your head',
      prompt: hard
        ? `<p>There are ${hl(fmt(n) + ' ' + ctx.what)}. The lamplighter needs exactly ${hl(p + '%')} of them. Find the amount in your head by building ${p}% from benchmarks. How many is that?</p>`
        : `<p>There are ${hl(fmt(n) + ' ' + ctx.what)}. The lamplighter needs exactly ${hl(p + '%')} of them. How many is that?</p><p class="muted">Use the benchmark: ${p}% is ${b.word} (${b.frac}) of the whole.</p>`,
      unit: ctx.unit,
      answer: ans,
      hints,
      hintEs: hard
        ? `El ${p}% no es un solo porcentaje de referencia, pero puedes formarlo con porcentajes de referencia: ${c.es}.`
        : `${p}% = ${b.frac}. Para hallar ese porcentaje de un número, ${b.es}.`,
      solution: hard
        ? `<p>${cap(c.step(n))}. Build ${p}%: ${c.how}. ${p}% of ${fmt(n)} = <b>${fmt(ans)}</b> ${ctx.unit}. Check: ${p}% × ${fmt(n)} = ${p / 100} × ${fmt(n)} = ${fmt(ans)}.</p>`
        : `<p>${p}% = ${b.frac}, so ${b.how}. ${p === 75 ? `${fmt(n)} ÷ 4 = ${n / 4}, and ${n / 4} × 3 = <b>${ans}</b>` : `${fmt(n)} ${p === 25 ? '÷ 4' : p === 50 ? '÷ 2' : p === 10 ? '÷ 10' : '÷ 100'} = <b>${ans}</b>`} ${ctx.unit}. Benchmarks let you find these percents without a calculator.</p>`,
      feedback: {
        correct: hard ? `Correct. ${p}% of ${fmt(n)} is ${fmt(ans)}. You built it from benchmarks: ${c.how}.` : `Correct. ${p}% of ${fmt(n)} is ${ans}, because ${p}% is ${b.word}.`,
        wrong(ans2, d) {
          const v = d.value;
          if (hard) {
            if (v === n / 10 && p !== 10) return `${fmt(n / 10)} is only 10% of ${fmt(n)}. To get ${p}%, ${c.how}.`;
            if (v === n / 100 && p !== 1) return `${fmt(n / 100)} is only 1% of ${fmt(n)}. To get ${p}%, ${c.how}.`;
            if (p === 15 && v === n / 20) return `${fmt(n / 20)} is 5%. You still need to add 10% to get 15%.`;
            if (v != null && Math.abs(v - ans * 10) < 1e-9) return `That is ten times too big: it is ${p * 10}% of ${fmt(n)}. Check where the decimal point goes.`;
            return `Build ${p}% from benchmarks: ${c.how}.`;
          }
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

  // ---------- Match benchmarks to mental strategies (match; hard = built-up percents) ----------
  G.define('p3_matchBench', (r, o) => {
    const hard = !!o.hard;
    const all = hard
      ? [
          ['5%', 'Find 10%, then take half of it', 'Is it smaller or bigger than 10%? Half of 10% is 5%.'],
          ['15%', 'Find 10%, then add half of 10%', '15% = 10% + 5%, and 5% is half of 10%.'],
          ['20%', 'Find 10%, then double it', '20% is 2 groups of 10%.'],
          ['2%', 'Find 1%, then double it', '2% is 2 groups of 1%.'],
          ['12.5%', 'Halve, halve, and halve again (one eighth)', '12.5% = 1/8, and halving three times divides by 8.'],
          ['60%', 'Find 50%, then add 10%', '60% = 50% + 10%.'],
          ['30%', 'Find 10%, then multiply it by 3', '30% is 3 groups of 10%.'],
        ]
      : [
          ['10%', 'One tenth: move the decimal point one place to the left', '10% = 1/10, and dividing by 10 moves the point one place.'],
          ['25%', 'One quarter: divide by 4, or halve and halve again', '25% = 1/4, and halving twice divides by 4.'],
          ['50%', 'One half: divide by 2', '50% = 1/2.'],
          ['75%', 'Three quarters: find one quarter, then multiply by 3', '75% = 3/4, three groups of one quarter.'],
          ['1%', 'One hundredth: move the decimal point two places to the left', '1% = 1/100, and dividing by 100 moves the point two places.'],
          ['20%', 'One fifth: find 10%, then double it', '20% = 1/5, which is 2 groups of 10%.'],
        ];
    const terms = r.pickN(all, 5).sort((a, b) => parseFloat(a[0]) - parseFloat(b[0]));
    const perm = r.shuffle(terms.map((_, i) => i));
    return {
      type: 'match',
      skill: 'benchmarks',
      lesson: '4-3',
      title: hard ? 'Match the built-up percent' : 'Match the benchmark to its shortcut',
      prompt: hard
        ? '<p>Lamplighters build harder percents out of benchmarks. Match each percent with the mental steps that find it.</p>'
        : '<p>Lamplighters never use a calculator. Match each benchmark percent with the mental shortcut for finding it.</p>',
      left: terms.map((t) => t[0]),
      right: perm.map((i) => terms[i][1]),
      pairs: terms.map((_, i) => [i, perm.indexOf(i)]),
      hints: hard
        ? [
            'Write each percent as a sum or a multiple of the benchmarks 1%, 10%, and 50%.',
            'Half of 10% is 5%. Two groups of 10% is 20%. Two groups of 1% is 2%.',
            'Halving once gives 50%, twice gives 25%, and three times gives 12.5%. Match the rest by elimination.',
          ]
        : [
            'Write each percent as a fraction: 10% = 1/10, 25% = 1/4, 50% = 1/2, 75% = 3/4, 1% = 1/100, 20% = 1/5.',
            'Dividing by 10 moves the decimal point one place; dividing by 100 moves it two places.',
            'Three quarters is three times one quarter. One fifth is twice one tenth.',
          ],
      hintEs: hard
        ? 'Escribe cada porcentaje como una suma o un múltiplo de los porcentajes de referencia 1%, 10% y 50%.'
        : 'Escribe cada porcentaje como fracción: 10% = 1/10, 25% = 1/4, 50% = 1/2, 75% = 3/4, 1% = 1/100, 20% = 1/5.',
      solution: `<ul>${terms.map((t) => `<li><b>${t[0]}</b>: ${t[1]}. ${t[2]}</li>`).join('')}</ul>`,
      feedback: {
        correct: hard ? 'Correct. Any friendly percent can be built from 1%, 10%, and 50%.' : 'Correct. These shortcuts are the lamplighter’s whole toolkit.',
        wrong(ans, d) {
          const i = (d.wrong || [])[0];
          if (i == null) return 'Match every percent. Each shortcut is used once.';
          return `Check ${terms[i][0]}. ${terms[i][2]}`;
        },
      },
    };
  });

  // ---------- Benchmarks on a double number line (dnl; hard = tens of percents, uneven ticks) ----------
  G.define('p3_dnlBench', (r, o) => {
    const hard = !!o.hard;
    const ctx = r.pick(CTX);
    let n, pcts;
    if (hard) {
      n = 10 * r.int(12, 64);
      pcts = r.pickN([10, 20, 30, 40, 60, 70, 80, 90], 3).sort((a, b) => a - b);
    } else {
      n = 4 * r.int(8, 60);
      pcts = [25, 50, 75];
    }
    const vals = [0].concat(
      pcts.map((p) => of(p, n)),
      [n],
    );
    const top = ['0%'].concat(
      pcts.map((p) => p + '%'),
      ['100%'],
    );
    const unitLabel = cap(ctx.unit);
    return {
      type: 'dnl',
      skill: 'benchmarks',
      lesson: '4-3',
      title: 'Benchmarks on the number line',
      prompt: `<p>The row has ${hl(fmt(n) + ' ' + ctx.what)}, which is 100%. Fill in the amounts for ${pcts.map((p) => p + '%').join(', ')} on the double number line.${hard ? ' Careful: the tick marks are not evenly spaced in percent.' : ''}</p>`,
      top: { label: 'Percent', values: top },
      bottom: { label: unitLabel, values: [0, null, null, null, n] },
      blanks: pcts.map((p, i) => ({ i: i + 1, answer: of(p, n) })),
      hints: hard
        ? [
            '10% is one tenth of the whole. Find 10% first: every tick here is a whole number of 10% steps.',
            `10% of ${fmt(n)} is ${fmt(n / 10)}. ${pcts[1]}% is ${pcts[1] / 10} groups of 10%.`,
            `Multiply ${fmt(n / 10)} by ${pcts.map((p) => p / 10).join(', ')} for the three ticks.`,
          ]
        : ['50% is half of the whole. Start there: divide the total by 2.', `Half of ${fmt(n)} is ${n / 2}. 25% is half of that again.`, `75% is three quarters: multiply the 25% amount by 3.`],
      hintEs: hard ? '10% es un décimo del total. Primero halla el 10%: cada marca aquí es un número entero de pasos de 10%.' : 'El 50% es la mitad del total. Empieza ahí: divide el total entre 2.',
      solution: hard
        ? `<p>10% of ${fmt(n)} = ${fmt(n / 10)}. ${pcts.map((p) => `${p}% = ${p / 10} × ${fmt(n / 10)} = <b>${fmt(of(p, n))}</b>`).join('; ')}. On a double number line, 100% always lines up with the whole, even when the ticks are not evenly spaced.</p>${V.dnl({ label: 'Percent', values: top }, { label: ctx.unit, values: vals }, { aria: `Double number line: ${top.join(', ')} above ${vals.join(', ')}` })}`
        : `<p>50% of ${fmt(n)} = ${fmt(n)} ÷ 2 = <b>${n / 2}</b>. 25% = ${n / 2} ÷ 2 = <b>${n / 4}</b>. 75% = 3 × ${n / 4} = <b>${(3 * n) / 4}</b>. On a double number line, 100% always lines up with the whole.</p>${V.dnl({ label: 'Percent', values: top }, { label: ctx.unit, values: vals }, { aria: `Double number line: 0, 25, 50, 75, 100 percent above 0, ${vals.join(', ')}` })}`,
      feedback: {
        correct: hard ? 'Correct. Find 10% once, then every tick is a multiple of it.' : `Correct. Halving twice gives the quarters, and 75% is three of them.`,
        wrong(ans, d) {
          const i = (d.wrong || [])[0];
          if (i == null) return 'Fill in every blank tick.';
          const p = pcts[i];
          const v = parseNum(ans[i]);
          if (v === p) return `You wrote ${p}, the percent. The bottom line shows amounts of ${ctx.unit}: find ${p}% of ${fmt(n)}.`;
          if (hard && i > 0 && v != null && Math.abs(v - (of(pcts[i - 1], n) + n / 10)) < 1e-9 && p - pcts[i - 1] !== 10)
            return `The ticks are not evenly spaced. ${p}% is ${p - pcts[i - 1]}% past ${pcts[i - 1]}%, not 10% past it. Use ${p / 10} × 10%.`;
          if (!hard && p === 75 && v === n / 4) return `${v} is 25%. 75% is three times that.`;
          return hard ? `Check ${p}%: find 10% of ${fmt(n)}, then multiply by ${p / 10}.` : `Find 50% first (half of ${fmt(n)}), then halve again for 25%, then triple 25% for 75%.`;
        },
      },
    };
  });

  // ---------- Read a percent bar (mc; hard = 4, 5, or 8 sections and no labels) ----------
  G.define('p3_barModel', (r, o) => {
    const hard = !!o.hard;
    const parts = hard ? r.pick([4, 5, 8]) : 10;
    const per = 100 / parts;
    const n = parts * (hard ? r.int(5, 40) : r.int(3, 30));
    const k = hard ? r.int(2, parts - 1) : r.pick([2, 3, 4, 6, 7, 8]);
    const ctx = r.pick(CTX);
    const each = n / parts;
    const ans = each * k;
    const pctShaded = round(k * per, 1);
    const opts = [
      { html: `${fmt(ans)} ${ctx.unit}`, ok: true },
      { html: `${k} ${ctx.unit}`, why: `${k} is the number of shaded sections. Each section is ${per}% of ${n}, which is ${fmt(each)} ${ctx.unit}, not 1.` },
      { html: `${fmt(pctShaded)} ${ctx.unit}`, why: `${pctShaded} is the <b>percent</b> shaded. The question asks for the number of ${ctx.unit}: ${pctShaded}% of ${n}.` },
      { html: `${fmt(n - ans)} ${ctx.unit}`, why: `${fmt(n - ans)} is the unshaded part (${round(100 - pctShaded, 1)}%). The shaded part is ${pctShaded}% of ${n}.` },
      { html: `${fmt(ans + each)} ${ctx.unit}`, why: `${fmt(ans + each)} would be ${k + 1} sections. Count the shaded sections again: there are ${k}.` },
    ];
    if (hard) opts.push({ html: `${fmt((n * k) / 10)} ${ctx.unit}`, why: `You treated each section as 10%. This bar has ${parts} sections, so each one is 100% ÷ ${parts} = ${per}%.` });
    // Drop any distractor whose value collides with an earlier option.
    const seenVals = new Set();
    const uniq = opts.filter((op) => {
      const v = op.html;
      if (seenVals.has(v)) return false;
      seenVals.add(v);
      return true;
    });
    const sh = shuffleOptions(r, hard ? [uniq[0]].concat(r.pickN(uniq.slice(1), 3)) : uniq.slice(0, 4), 0);
    const labels = hard ? null : ['0%', '10%', '20%', '30%', '40%', '50%', '60%', '70%', '80%', '90%'];
    return {
      type: 'mc',
      skill: 'benchmarks',
      lesson: '4-3',
      title: 'Read the percent bar',
      prompt: `<p>The whole bar stands for ${hl(n + ' ' + ctx.what)} (100%). It is split into ${parts} equal sections, and ${hl(k)} sections are shaded.</p>${V.bar({ parts, shaded: k, labels, aria: `Percent bar with ${k} of ${parts} sections shaded` })}<p>How many ${ctx.unit} does the shaded part represent?</p>`,
      options: sh.options,
      answer: sh.answer,
      hints: hard
        ? [
            `The whole bar is 100%, split into ${parts} equal sections. Find what one section is worth.`,
            `One section is 1/${parts} of ${n}, so divide ${n} by ${parts}. The shaded part is ${k} sections.`,
            `Multiply the value of one section by ${k}.`,
          ]
        : ['Each of the 10 sections is 10% of the whole.', `10% of ${n} is ${n / 10} ${ctx.unit}. The shaded part is ${k} sections.`, `Multiply ${k} × ${n / 10}.`],
      hintEs: hard ? `Toda la barra es el 100%, dividida en ${parts} secciones iguales. Halla cuánto vale una sección.` : 'Cada una de las 10 secciones es el 10% del total.',
      solution: `<p>Each section is ${per}% of ${n} = ${n} ÷ ${parts} = ${fmt(each)} ${ctx.unit}. ${k} shaded sections = ${k} × ${fmt(each)} = <b>${fmt(ans)} ${ctx.unit}</b> (${pctShaded}% of ${n}).</p>`,
      feedback: { correct: `Correct. ${k} sections × ${fmt(each)} per section = ${fmt(ans)}.`, wrong: whyOf(sh.options, 'Find the value of one section first, then count the shaded sections.') },
    };
  });

  // ---------- Estimate with a benchmark and friendly number (mc; hard = choose them yourself, less friendly numbers) ----------
  G.define('p3_estimate', (r, o) => {
    const hard = !!o.hard;
    const p = r.pick([10, 25, 50, 75, 10, 25]);
    const near = p + (hard ? r.pick([-3, -2, 2, 3]) : r.pick([-2, -1, 1, 2]));
    const friendly = hard ? friendlyFor(r, p, 120, 800) : friendlyFor(r, p, 40, 400);
    const actual = actualFor(r, p, friendly, hard);
    const ctx = r.pick(CTX);
    const est = of(p, friendly);
    const others = [1, 10, 25, 50, 75].filter((b) => b !== p).map((b) => ({ b, v: of(b, friendly) }));
    const seenV = new Set([est]);
    const distinct = others.filter((x) => {
      if (seenV.has(x.v) || !(Number.isInteger(x.v) || x.b === 1)) return false;
      seenV.add(x.v);
      return true;
    });
    const picked = r.pickN(distinct, Math.min(3, distinct.length));
    let opts = [{ html: `about ${fmt(est)}`, ok: true }].concat(
      picked.map((x) => ({ html: `about ${fmt(x.v)}`, why: `${fmt(x.v)} is ${x.b}% of ${friendly}. ${near}% is close to ${p}%, not ${x.b}%.` })),
    );
    if (hard && p === 25 && !seenV.has(friendly / 2))
      opts = [opts[0], { html: `about ${fmt(friendly / 2)}`, why: `${fmt(friendly / 2)} is 50% of ${friendly}. For 25%, halve once more.` }].concat(opts.slice(1, 3));
    if (opts.length < 3) opts.push({ html: `about ${fmt(est * 10)}`, why: `${fmt(est * 10)} is ten times too big. ${p}% is ${BENCH[p].frac} of the whole, so the answer must be smaller.` });
    const sh = shuffleOptions(r, opts, 0);
    const b = BENCH[p];
    return {
      type: 'mc',
      skill: 'estimate',
      lesson: '4-3',
      title: 'Estimate with a benchmark',
      prompt: hard
        ? `<p>About ${hl(near + '%')} of the ${hl(actual + ' ' + ctx.what)} ${ctx.act}.</p><p>Estimate how many that is. Choose your own benchmark percent and friendly number.</p>`
        : `<p>About ${hl(near + '%')} of the ${hl(actual + ' ' + ctx.what)} ${ctx.act}.</p><p>Estimate how many that is. Use the benchmark ${hl(p + '%')} and the friendly number ${hl(friendly)}.</p>`,
      options: sh.options,
      answer: sh.answer,
      hints: hard
        ? [
            `Pick the benchmark (10%, 25%, 50%, or 75%) closest to ${near}%. Then round ${actual} to a nearby number that is easy to use with it.`,
            `${near}% is close to ${p}%. A friendly number near ${actual} for ${p}% is ${friendly}.`,
            `Find ${p}% of ${friendly}: ${b.how}.`,
          ]
        : [`${near}% is close to ${p}%, and ${actual} is close to ${friendly}. Estimate ${p}% of ${friendly} instead.`, `${p}% = ${b.frac}. To find it, ${b.how}.`, `Find ${b.frac} of ${friendly}.`],
      hintEs: hard
        ? `Escoge el porcentaje de referencia (10%, 25%, 50% o 75%) más cercano a ${near}%. Luego redondea ${actual} a un número cercano que sea fácil de usar.`
        : `${near}% está cerca de ${p}%, y ${actual} está cerca de ${friendly}. Estima el ${p}% de ${friendly}.`,
      solution: `<p>Replace the hard numbers with friendly ones: ${near}% → ${p}%, ${actual} → ${friendly}. ${p}% of ${friendly} = ${b.frac} of ${friendly} = <b>about ${fmt(est)}</b>. An estimate is close, not exact, and it is fast.</p>`,
      feedback: {
        correct: `Correct. ${p}% of ${friendly} = ${fmt(est)}, a close and quick estimate.`,
        wrong: whyOf(sh.options, `Use the benchmark closest to ${near}% and a friendly number close to ${actual}.`),
      },
    };
  });

  // ---------- 1% then scale (blanks; hard = half-percent values) ----------
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
      hints: [
        '1% = 1/100. To find 1% of a number, move the decimal point two places to the left.',
        `1% of ${fmt(n)} is ${fmt(n)} ÷ 100. Then ${k}% is ${k} times as much as 1%.`,
        `Multiply your 1% value by ${k}.`,
      ],
      hintEs: '1% = 1/100. Para hallar el 1% de un número, mueve el punto decimal dos lugares a la izquierda.',
      solution: `<p>1% of ${fmt(n)} = ${fmt(n)} ÷ 100 = <b>${one}</b>. Since ${k}% is ${k} times 1%, ${k}% of ${fmt(n)} = ${k} × ${one} = <b>${ans}</b>. Any percent can be built from 1%.</p>`,
      feedback: {
        correct: `Correct. 1% is ${one}, so ${k}% is ${k} × ${one} = ${ans}.`,
        wrong(ans2, d) {
          const v0 = parseNum(ans2[0]);
          if (d.wrong.includes(0) && v0 === n / 10) return `${n / 10} is 10% of ${fmt(n)}. For 1%, move the decimal point two places left.`;
          if (d.wrong.includes(0) && v0 != null && Math.abs(v0 - n / 1000) < 1e-9) return `You moved the decimal point three places. For 1%, move it exactly two places left.`;
          if (d.wrong.includes(0)) return `1% of ${fmt(n)} means ${fmt(n)} ÷ 100.`;
          const v1 = parseNum(ans2[1]);
          if (v1 != null && Math.abs(v1 - one * k * 10) < 1e-9) return `That is ${k * 10}%. For ${k}%, multiply 1% (${one}) by ${k}, not ${k * 10}.`;
          if (v1 != null && Math.abs(v1 - (one + k)) < 1e-9) return `You added ${k}. ${k}% is ${k} <b>times</b> 1%, so multiply.`;
          return `Your 1% is right. Multiply ${one} by ${k} to get ${k}%.`;
        },
      },
    };
  });

  // ---------- Who estimated reasonably? (who; hard = right benchmark, wrong mental step) ----------
  G.define('p3_whoEstimate', (r, o) => {
    const hard = !!o.hard;
    const [a, b, c] = r.pickN(NAMES, 3);
    const p = hard ? r.pick([10, 25, 75]) : r.pick([10, 25, 50, 75, 20]);
    const near = p + r.pick([-2, -1, 1, 2]);
    const friendly = hard ? (p === 25 ? 100 * r.int(2, 6) : friendlyFor(r, p, 120, 600)) : friendlyFor(r, p, 40, 400);
    const actual = actualFor(r, p, friendly, false);
    const est = of(p, friendly);
    const ctx = r.pick(CTX);
    let opts;
    if (hard) {
      const slipB =
        p === 10
          ? { v: of(1, friendly), why: `${b} moved the decimal point two places, which finds 1%. For 10%, move it one place.` }
          : { v: friendly / 2, why: `${b} halved only once, which finds 50%. For ${p === 25 ? '25%' : 'one quarter'}, halve twice.` };
      const slipC =
        p === 75
          ? { v: friendly / 4, why: `${c} found one quarter (25%) but stopped. 75% is three quarters, so multiply by 3.`, step: `one quarter of ${friendly} is ${fmt(friendly / 4)}` }
          : p === 25
            ? { v: friendly / 25, why: `${c} divided by 25. 25% means 25 per 100, which is 1/4, so divide by 4.`, step: `${p}% of ${friendly} is ${friendly} ÷ 25 = ${fmt(friendly / 25)}` }
            : { v: friendly - 10, why: `${c} subtracted 10. 10% is one tenth of the number, not 10 less than it.`, step: `${p}% of ${friendly} is ${friendly} − 10 = ${fmt(friendly - 10)}` };
      const cStep = slipC.step;
      opts = [
        { title: a, html: `"${near}% is about ${p}%, and ${actual} is about ${friendly}. ${p}% of ${friendly} is ${fmt(est)}. About <b>${fmt(est)}</b>."`, ok: true },
        { title: b, html: `"${near}% is about ${p}%, and ${actual} is about ${friendly}. ${p}% of ${friendly} is ${fmt(slipB.v)}. About <b>${fmt(slipB.v)}</b>."`, why: slipB.why },
        { title: c, html: `"${near}% is about ${p}%, and ${cStep}. About <b>${fmt(slipC.v)}</b>."`, why: slipC.why },
      ];
    } else {
      const badB = p === 10 ? 50 : p === 50 ? 10 : p === 25 ? 75 : p === 75 ? 25 : 50;
      const badEst = of(badB, friendly);
      const noPct = near * actual;
      opts = [
        { title: a, html: `"${near}% is about ${p}%, and ${actual} is about ${friendly}. ${p}% of ${friendly} is ${est}. About <b>${est}</b>."`, ok: true },
        {
          title: b,
          html: `"${near}% is about ${badB}%, and ${actual} is about ${friendly}. ${badB}% of ${friendly} is ${badEst}. About <b>${badEst}</b>."`,
          why: `${b} chose a benchmark that is far from ${near}%. ${near}% is close to ${p}%, not ${badB}%.`,
        },
        {
          title: c,
          html: `"${near}% means ${near} out of ${actual}, so I multiply ${near} × ${actual} = ${fmt(noPct)}. About <b>${fmt(noPct)}</b>."`,
          why: `${c} multiplied by ${near} instead of ${near}%. A percent is out of 100, so the answer must be smaller than ${actual}.`,
        },
      ];
    }
    const sh = shuffleOptions(r, opts, 0);
    return {
      type: 'who',
      skill: 'estimate',
      lesson: '4-3',
      title: 'Whose estimate is reasonable?',
      prompt: `<p>About ${hl(near + '%')} of the ${hl(actual + ' ' + ctx.what)} ${ctx.act}. Three students estimate how many that is. Who made a reasonable estimate?</p>`,
      options: sh.options,
      answer: sh.answer,
      layout: 'cards',
      hints: hard
        ? [
            'A good estimate rounds to a close benchmark and a friendly number, then finds the benchmark correctly in your head.',
            `All three start with ${p}%. Check each student's mental step for ${p}% of ${friendly}.`,
            `${p}% is ${BENCH[p].word}: ${BENCH[p].how}. Which student did exactly that?`,
          ]
        : [
            'A good estimate uses a benchmark percent that is <b>close</b> to the real percent, and a friendly number close to the real number.',
            `Which benchmark is closest to ${near}%?`,
            `Find ${p}% of ${friendly} yourself, then look for the student who used ${p}% and ${friendly}.`,
          ],
      hintEs: hard
        ? 'Una buena estimación redondea a un porcentaje de referencia cercano y a un número fácil. Luego calcula ese porcentaje mentalmente sin errores.'
        : 'Una buena estimación usa un porcentaje de referencia <b>cercano</b> al porcentaje real y un número fácil cercano al número real.',
      solution: hard
        ? `<p><b>${a}</b> is reasonable: ${near}% ≈ ${p}% and ${actual} ≈ ${friendly}. ${p}% is ${BENCH[p].word}, so ${BENCH[p].how}: ${p}% of ${friendly} = ${fmt(est)}. The other two chose the right benchmark but made a mistake in the mental step or skipped the rounding.</p>`
        : `<p><b>${a}</b> is reasonable: ${near}% ≈ ${p}% and ${actual} ≈ ${friendly}, so the estimate is ${p}% of ${friendly} = ${est}. ${b} used a benchmark too far from ${near}%. ${c} forgot that a percent is out of 100, so the answer came out far too large.</p>`,
      feedback: {
        correct: `Correct. A reasonable estimate stays close to both the percent and the number.`,
        wrong: whyOf(sh.options, 'Check the benchmark, the friendly number, and the mental step for each student.'),
      },
    };
  });

  // ---------- Explain an estimation strategy (cr; hard = built-up benchmarks, less friendly numbers) ----------
  G.define('p3_crEstimate', (r, o) => {
    const hard = !!o.hard;
    const p = hard ? r.pick([20, 30, 5, 15, 60]) : r.pick([10, 25, 50, 75]);
    const near = p + (hard ? r.pick([-1, 1, 2]) : r.pick([-2, -1, 1, 2]));
    const friendly = hard ? friendlyFor(r, p, 100, 600) : friendlyFor(r, p, 40, 400);
    const actual = actualFor(r, p, friendly, hard);
    const est = of(p, friendly);
    const ctx = r.pick(CTX);
    const how = howOf(p);
    const pool = hard ? [5, 10, 15, 20, 30, 50, 60] : [1, 10, 25, 50, 75];
    const wrongs = pool
      .filter((x) => x !== p)
      .map((x) => of(x, friendly))
      .filter((v) => v !== est && Number.isInteger(v));
    const picked = r.pickN(wrongs, 2);
    const checkOpts = [{ html: `about ${fmt(est)}`, ok: true }].concat(
      picked.map((v) => ({ html: `about ${fmt(v)}` })),
      [{ html: `about ${fmt(near * actual)}` }],
    );
    const sh = shuffleOptions(r, checkOpts, 0);
    return {
      type: 'cr',
      skill: 'estimate',
      lesson: '4-3',
      title: 'Explain your estimate',
      prompt: `<p>A lamplighter needs to know about ${hl(near + '%')} of ${hl(actual + ' ' + ctx.what)}, without a calculator.</p><p>Explain how to estimate the answer. Name the ${hard ? 'friendly percent' : 'benchmark percent'} and the friendly number you would use${hard ? ', and how you build that percent from 10%, 1%, or 50%' : ''}.</p>`,
      starters: [`${near}% is close to…`, `A friendly number for ${actual} is…`, 'To find that percent in my head, I…', 'So my estimate is about…'],
      minWords: 12,
      check: { prompt: 'Which estimate matches that strategy?', options: sh.options, answer: sh.answer },
      hints: hard
        ? [
            `Round ${near}% to the nearest friendly percent you can build from benchmarks (a multiple of 5%).`,
            `${near}% ≈ ${p}%, and ${actual} ≈ ${friendly}. To find ${p}%, ${how}.`,
            `Use ${friendly} for ${actual}. ${cap(how)} in your head.`,
          ]
        : [
            `Pick the benchmark closest to ${near}%. The choices are 10%, 25%, 50%, and 75%.`,
            `${near}% ≈ ${p}%. ${p}% is ${BENCH[p].word}, so ${BENCH[p].how}.`,
            `Use ${friendly} for ${actual}. Now find ${p}% of ${friendly} in your head.`,
          ],
      hintEs: hard
        ? `Redondea ${near}% al porcentaje fácil más cercano que puedas formar con porcentajes de referencia (un múltiplo de 5%).`
        : `Escoge el porcentaje de referencia más cercano a ${near}%. Las opciones son 10%, 25%, 50% y 75%.`,
      solution: `<p>${near}% is close to <b>${p}%</b>, and ${actual} is close to <b>${friendly}</b>. To find ${p}%, ${how}: ${p}% of ${friendly} = <b>about ${fmt(est)}</b>. A strong explanation names the ${hard ? 'friendly' : 'benchmark'} percent, the friendly number, and the mental step.</p>`,
      feedback: {
        correct: `Correct. ${hard ? 'Friendly percent' : 'Benchmark'} + friendly number + mental step is the whole strategy.`,
        wrong(ans, d) {
          if (!d.wroteEnough) return `Write a little more. Name the ${hard ? 'friendly' : 'benchmark'} percent, the friendly number, and how you found the percent in your head.`;
          const chosen = sh.options[ans.check];
          if (chosen && chosen.html === `about ${fmt(near * actual)}`) return `That estimate multiplies ${near} × ${actual}. A percent is out of 100, so the estimate must be smaller than ${actual}.`;
          return `Check the percent you used: ${near}% is closest to ${p}%. Then ${how}, using ${friendly}.`;
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
  // Contexts for percents greater than 100%: this year compared with last year.
  const GROW = [
    { unit: 'lanterns', verb: 'the foundry made' },
    { unit: 'glass panes', verb: 'the kiln fired' },
    { unit: 'tickets', verb: 'the festival sold' },
    { unit: 'paper stars', verb: 'the students folded' },
  ];
  const ITEMS = ['lantern', 'backpack', 'skateboard', 'jacket', 'board game', 'pair of headphones', 'sketchbook set'];
  const dec = (p) => String(round(p / 100, 4));
  const cap = (t) => t.charAt(0).toUpperCase() + t.slice(1);
  const whyOf = (options, fallback) => (ans) => (options[ans] && options[ans].why) || fallback;
  // Hard-mode fraction percents: eighths and percents over 100%.
  const FRAC_H = { 12.5: '1/8', 37.5: '3/8', 62.5: '5/8', 87.5: '7/8', 120: '6/5', 125: '5/4', 150: '3/2', 175: '7/4' };
  const of = (p, n) => round((p / 100) * n, 2);
  // Whole n so that p% of n is a whole number.
  const wholeFor = (r, p, lo, hi) => {
    const g = RX.gcd(p, 100);
    const m = 100 / g;
    return m * r.int(Math.ceil(lo / m), Math.floor(hi / m));
  };

  // ---------- Fraction method (num; hard = eighths and percents over 100%) ----------
  G.define('p4_fractionMethod', (r, o) => {
    const hard = !!o.hard;
    const p = hard ? r.pick([12.5, 37.5, 62.5, 87.5, 120, 125, 150, 175]) : r.pick([20, 25, 40, 50, 60, 75, 80, 10, 30, 70, 90]);
    const F = hard ? FRAC_H[p] : FRAC[p];
    const [fn, fd] = F.split('/').map(Number);
    const n = hard ? fd * r.int(Math.ceil(24 / fd), Math.floor(320 / fd)) : wholeFor(r, p, 20, 240);
    const ctx = r.pick(CTX);
    const ans = of(p, n);
    const unitFrac = `1/${fd}`;
    const grow = r.pick(GROW);
    return {
      type: 'num',
      skill: 'percent-of',
      lesson: '4-4',
      title: hard ? 'Use a fraction (harder percents)' : 'Use a fraction',
      prompt: hard
        ? p > 100
          ? `<p>Last year ${grow.verb} ${hl(n + ' ' + grow.unit)}. This year ${grow.verb} ${hl(p + '%')} of last year's amount. Use the <b>fraction</b> method to find how many ${grow.unit} that is this year.</p>`
          : `<p>${hl(p + '%')} of the ${hl(n + ' ' + ctx.what)} are finished. Use the <b>fraction</b> method to find how many that is.</p>`
        : `<p>${hl(p + '%')} of the ${hl(n + ' ' + ctx.what)} are finished. Use the <b>fraction</b> method to find how many that is.</p><p class="muted">Write the percent as a fraction, then multiply.</p>`,
      unit: hard && p > 100 ? grow.unit : ctx.unit,
      answer: ans,
      hints: hard
        ? [
            p > 100
              ? `${p}% is more than 100%, so the answer is more than ${n}. Write ${p}% as a fraction: ${p}/100 = ${F}.`
              : `${p}% = ${p}/100. Doubling top and bottom gives ${p * 2}/200, which simplifies to ${F}.`,
            `Find ${F} of ${n}: divide ${n} by ${fd}, then multiply by ${fn}.`,
            `${n} ÷ ${fd} = ${n / fd}. Now multiply ${n / fd} × ${fn}.`,
          ]
        : [
            `${p}% = ${p}/100. Simplify it to a friendly fraction: ${F}.`,
            `Find ${F} of ${n}: divide ${n} by ${fd}${fn > 1 ? `, then multiply by ${fn}` : ''}.`,
            fn > 1 ? `${n} ÷ ${fd} = ${n / fd}. Now multiply ${n / fd} × ${fn}.` : `Divide ${n} by ${fd}.`,
          ],
      hintEs: hard
        ? p > 100
          ? `${p}% es más que el 100%, así que la respuesta es mayor que ${n}. Escribe ${p}% como fracción: ${p}/100 = ${F}.`
          : `${p}% = ${p}/100. Si multiplicas arriba y abajo por 2 obtienes ${p * 2}/200, que se simplifica a ${F}.`
        : `${p}% = ${p}/100. Simplifícalo a una fracción fácil: ${F}.`,
      solution: `<p>${p}% = ${F}. ${F} of ${n} = ${n} ÷ ${fd}${fn > 1 ? ` × ${fn}` : ''} = <b>${fmt(ans)} ${hard && p > 100 ? grow.unit : ctx.unit}</b>. Writing the percent as a fraction turns the problem into dividing by ${fd}${fn > 1 ? ` and multiplying by ${fn}` : ''}.${p > 100 ? ` The answer is more than ${n} because ${p}% is more than the whole.` : ''}</p>`,
      feedback: {
        correct: `Correct. ${p}% of ${n} = ${F} × ${n} = ${fmt(ans)}.`,
        wrong(a, d) {
          const v = d.value;
          if (v === n / fd && fn > 1) return `${n / fd} is only ${unitFrac} of ${n}. ${F} means ${fn} of those parts, so multiply by ${fn}.`;
          if (v === p * n) return `You multiplied by ${p} instead of ${p}%. ${p}% is ${F}${p < 100 ? `, which makes the answer smaller than ${n}` : ''}.`;
          if (p < 100 && v === n - ans) return `${fmt(n - ans)} is the other ${100 - p}%. The question asks for the ${p}% part.`;
          if (p > 100 && v === round(ans - n, 2)) return `${fmt(ans - n)} is only the extra ${p - 100}%. ${p}% includes the whole ${n} plus that extra.`;
          if (v != null && Math.abs(v - (n * fd) / fn) < 0.01) return `You multiplied by ${fd}/${fn}, the fraction upside down. Use ${F}: divide by ${fd}, then multiply by ${fn}.`;
          return `${p}% = ${F}. Divide ${n} by ${fd}${fn > 1 ? `, then multiply by ${fn}` : ''}.`;
        },
      },
    };
  });

  // ---------- Decimal method (blanks; hard = single-digit, decimal, and over-100 percents) ----------
  G.define('p4_decimalMethod', (r, o) => {
    const hard = !!o.hard;
    const p = hard ? r.pick([4, 6, 7, 8, 9, 2.5, 0.5, 7.5, 125, 150]) : r.pick([15, 35, 45, 55, 65, 85, 12, 24, 36, 48]);
    const n = hard ? 40 * r.int(2, 12) : wholeFor(r, p, 20, 300);
    const ans = of(p, n);
    const ctx = r.pick(CTX);
    const d = dec(p);
    const grow = r.pick(GROW);
    const unitWord = p > 100 ? grow.unit : ctx.unit;
    const tenthsSlip = round(p / 10, 3);
    const careful =
      p < 1
        ? `Careful: ${p}% is less than 1%, so the decimal is less than 0.01.`
        : p < 10
          ? `Careful: ${p}% is less than 10%, so the decimal is less than 0.1 (there is a 0 in the tenths place).`
          : p > 100
            ? `Careful: ${p}% is more than 100%, so the decimal is more than 1.`
            : '';
    return {
      type: 'blanks',
      skill: 'percent-of',
      lesson: '4-4',
      title: 'Use a decimal',
      prompt:
        p > 100
          ? `<p>Last year ${grow.verb} ${hl(n + ' ' + grow.unit)}. This year ${grow.verb} ${hl(p + '%')} of last year's amount. Use the <b>decimal</b> method to find this year's amount.</p>`
          : `<p>${hl(p + '%')} of the ${hl(n + ' ' + ctx.what)} are new this year. Use the <b>decimal</b> method.</p>`,
      template: [`${p}% written as a decimal is {0}.`, `So ${p}% of ${n} is {1} ${unitWord}.`],
      fields: [
        { answer: round(p / 100, 4), width: 'sm' },
        { answer: ans, width: 'sm' },
      ],
      hints: [
        'Percent means hundredths. Write the percent as a decimal by dividing by 100 (move the decimal point two places left).',
        `${p}% = ${p} hundredths. ${careful} Then multiply the decimal by ${n}.`,
        `Multiply your decimal × ${n}.`,
      ],
      hintEs: 'Porcentaje quiere decir centésimos. Escribe el porcentaje como decimal dividiéndolo entre 100 (mueve el punto decimal dos lugares a la izquierda).',
      solution: `<p>${p}% = ${p} hundredths = <b>${d}</b>. Multiply: ${d} × ${n} = <b>${fmt(ans)} ${unitWord}</b>. The decimal method works for any percent, even ones that are not friendly fractions.</p>`,
      feedback: {
        correct: `Correct. ${p}% = ${d}, and ${d} × ${n} = ${fmt(ans)}.`,
        wrong(a, dd) {
          const v0 = parseNum(a[0]);
          const v1 = parseNum(a[1]);
          if (dd.wrong.includes(0) && v0 != null && Math.abs(v0 - tenthsSlip) < 1e-9)
            return `${tenthsSlip} is ${p} tenths, which is ${round(p * 10, 2)}%. Divide by 100, not 10: move the point two places.`;
          if (dd.wrong.includes(0) && v0 === p) return `${p} is the percent. The decimal is ${p} ÷ 100.`;
          if (dd.wrong.includes(0) && p > 100 && v0 != null && Math.abs(v0 - p / 1000) < 1e-9) return `${v0} is less than 1, but ${p}% is more than 100%, so its decimal must be more than 1.`;
          if (dd.wrong.includes(0)) return `Write ${p}% as hundredths: ${p} ÷ 100. Move the decimal point exactly two places left.`;
          if (dd.wrong.includes(1) && v1 != null && Math.abs(v1 - ans * 10) < 1e-9)
            return `${fmt(round(ans * 10, 2))} is ${round(p * 10, 2)}% of ${n}. Your decimal is right, so check where the point goes in the product.`;
          return `Your decimal is right. Now multiply it by the whole, ${n}.`;
        },
      },
    };
  });

  // ---------- Percent of a number on a double number line (dnl; hard = 5% step, uneven ticks, nothing else given) ----------
  G.define('p4_dnlFind', (r, o) => {
    const hard = !!o.hard;
    const ctx = r.pick(CTX);
    const unitLabel = cap(ctx.unit);
    if (hard) {
      const n = 20 * r.int(4, 30);
      const mids = r.pickN([15, 30, 35, 45, 60, 65, 85, 90], 3).sort((a, b) => a - b);
      const pcts = [5].concat(mids);
      const top = ['0%'].concat(
        pcts.map((p) => p + '%'),
        ['100%'],
      );
      const vals = [0].concat(
        pcts.map((p) => of(p, n)),
        [n],
      );
      return {
        type: 'dnl',
        skill: 'percent-of',
        lesson: '4-4',
        title: 'Use a double number line',
        prompt: `<p>There are ${hl(n + ' ' + ctx.what)}, which is 100%. Fill in the amounts for ${pcts.map((p) => p + '%').join(', ')}. The ticks are not evenly spaced, so find each one from a unit step.</p>`,
        top: { label: 'Percent', values: top },
        bottom: { label: unitLabel, values: [0, null, null, null, null, n] },
        blanks: pcts.map((p, i) => ({ i: i + 1, answer: of(p, n) })),
        hints: [
          '100% lines up with the whole. 5% is one twentieth of the whole: find 10% first, then halve it.',
          `10% of ${n} is ${n / 10}, so 5% is ${n / 20}. Every tick here is a whole number of 5% steps.`,
          `Multiply ${n / 20} by ${pcts.map((p) => p / 5).join(', ')} for the four ticks.`,
        ],
        hintEs: 'El 100% se alinea con el total. El 5% es un veinteavo del total: primero halla el 10% y luego saca la mitad.',
        solution: `<p>10% of ${n} = ${n / 10}, so 5% = <b>${n / 20}</b>. Then ${mids.map((p) => `${p}% = ${p / 5} × ${n / 20} = <b>${fmt(of(p, n))}</b>`).join('; ')}.</p>${V.dnl({ label: 'Percent', values: top }, { label: ctx.unit, values: vals }, { aria: `Double number line: ${top.join(', ')} above ${vals.join(', ')}` })}`,
        feedback: {
          correct: `Correct. Once 5% is ${n / 20}, every tick is a multiple of it.`,
          wrong(a, d) {
            const i = (d.wrong || [])[0];
            if (i == null) return 'Fill in every blank tick.';
            const p = pcts[i];
            const v = parseNum(a[i]);
            if (v === p) return `You wrote ${p}, the percent. The bottom line shows ${ctx.unit}: find ${p}% of ${n}.`;
            if (i === 0 && v === n / 10) return `${n / 10} is 10% of ${n}. 5% is half of that.`;
            if (i > 0 && v != null && Math.abs(v - (of(pcts[i - 1], n) + n / 20)) < 1e-9) return `The ticks are not evenly spaced. ${p}% is ${p / 5} steps of 5%, not one step past ${pcts[i - 1]}%.`;
            return `Check ${p}%: it is ${p / 5} groups of 5%, and 5% of ${n} is half of 10%.`;
          },
        },
      };
    }
    const n = 5 * r.int(6, 60);
    const vals = [0, 1, 2, 3, 4, 5].map((i) => (n * i) / 5);
    return {
      type: 'dnl',
      skill: 'percent-of',
      lesson: '4-4',
      title: 'Use a double number line',
      prompt: `<p>There are ${hl(n + ' ' + ctx.what)}, which is 100%. The foundry sorts them in 20% batches. Fill in the missing amounts for 20%, 40%, and 80%.</p>`,
      top: { label: 'Percent', values: ['0%', '20%', '40%', '60%', '80%', '100%'] },
      bottom: { label: unitLabel, values: [0, null, null, vals[3], null, n] },
      blanks: [
        { i: 1, answer: vals[1] },
        { i: 2, answer: vals[2] },
        { i: 4, answer: vals[4] },
      ],
      hints: [
        '100% lines up with the whole. 20% is one fifth of the whole, so divide by 5.',
        `20% of ${n} = ${n} ÷ 5 = ${vals[1]}. Each step to the right adds ${vals[1]}.`,
        `40% is 2 steps of 20% and 80% is 4 steps. Check with 60%, which is given.`,
      ],
      hintEs: 'El 100% se alinea con el total. El 20% es un quinto del total, así que divide entre 5.',
      solution: `<p>20% = 1/5, so 20% of ${n} = ${n} ÷ 5 = <b>${vals[1]}</b>. Then 40% = 2 × ${vals[1]} = <b>${vals[2]}</b> and 80% = 4 × ${vals[1]} = <b>${vals[4]}</b>. Check: 60% = 3 × ${vals[1]} = ${vals[3]}, which matches the given value.</p>${V.dnl({ label: 'Percent', values: ['0%', '20%', '40%', '60%', '80%', '100%'] }, { label: ctx.unit, values: vals }, { aria: `Double number line: 0 to 100 percent above 0 to ${n}` })}`,
      feedback: {
        correct: `Correct. Once 20% is ${vals[1]}, every tick is a multiple of it.`,
        wrong(a, d) {
          const i = (d.wrong || [])[0];
          const v = parseNum(a[i]);
          const p = [20, 40, 80][i];
          if (v === p) return `You wrote ${p}, the percent. The bottom line shows ${ctx.unit}: find ${p}% of ${n}.`;
          if (i === 0 && v === n / 10) return `${n / 10} is 10% of ${n}. 20% is one fifth, so divide by 5.`;
          if (i === 2 && v === vals[3] + vals[1] * 2) return `80% is only one step (20%) past 60%, not two.`;
          return `Start with 20%: ${n} ÷ 5. Then count up by that amount for each 20%.`;
        },
      },
    };
  });

  // ---------- Error: wrong decimal for the percent (error; hard = decimal percents and percents over 100%) ----------
  G.define('p4_errorDecimal', (r, o) => {
    const hard = !!o.hard;
    const name = r.pick(NAMES);
    const ctx = r.pick(CTX);
    let p, n, wrongDec, rightDec, slipPct, note;
    if (hard) {
      const v = r.pick([
        { p: 125, wrongDec: '0.125', rightDec: '1.25', slipPct: 12.5, note: '125% is 125 hundredths, more than 1 whole' },
        { p: 150, wrongDec: '0.15', rightDec: '1.5', slipPct: 15, note: '150% is 150 hundredths, more than 1 whole' },
        { p: 0.5, wrongDec: '0.5', rightDec: '0.005', slipPct: 50, note: '0.5% is half of one hundredth' },
        { p: 2.5, wrongDec: '0.25', rightDec: '0.025', slipPct: 25, note: '2.5% is 2.5 hundredths' },
        { p: 7.5, wrongDec: '0.75', rightDec: '0.075', slipPct: 75, note: '7.5% is 7.5 hundredths' },
      ]);
      ({ p, wrongDec, rightDec, slipPct, note } = v);
      n = 40 * r.int(2, 10);
    } else {
      p = r.int(2, 9);
      n = 20 * r.int(2, 10);
      wrongDec = `0.${p}`;
      rightDec = `0.0${p}`;
      slipPct = p * 10;
      note = `${p}% is ${p} hundredths`;
    }
    const wrongAns = round(n * Number(wrongDec), 3);
    const alt = p < 10 ? String(round(p / 1000, 5)) : String(round(p / 10, 3));
    const rightAns = of(p, n);
    const opts = [
      { html: `${name} wrote ${p}% as ${wrongDec}, which is ${slipPct}%. ${cap(note)}: ${rightDec}.`, ok: true },
      { html: `${name} should have divided ${n} by ${p} instead of multiplying by a decimal.`, why: `Dividing by ${p} finds 1/${p} of ${n}, not ${p}%. ${p}% means ${p} out of 100.` },
      hard
        ? {
            html: `${name} should have written ${p}% as ${alt} instead.`,
            why: `${alt} is ${round(Number(alt) * 100, 3)}%, not ${p}%. To change a percent to a decimal, move the point exactly two places left.`,
          }
        : {
            html: `${name} should have multiplied ${n} by ${p} instead of using a decimal.`,
            why: `${n} × ${p} is ${round(p * 100, 2)}% of ${n}. A percent is out of 100, so you multiply by ${p}/100.`,
          },
      { html: `There is no mistake. ${fmt(wrongAns)} is the correct amount for ${p}%.`, why: `${fmt(wrongAns)} is ${slipPct}% of ${n}. The question asks for ${p}%.` },
    ];
    const sh = shuffleOptions(r, opts, 0);
    return {
      type: 'error',
      skill: 'percent-of',
      lesson: '4-4',
      title: 'Find the mistake',
      prompt: `<p>${name} is finding ${hl(p + '%')} of the ${hl(n + ' ' + ctx.what)}. What is the mistake?</p>`,
      work: `${p}% = ${wrongDec} &nbsp;&nbsp; ${wrongDec} × ${n} = ${fmt(wrongAns)}`,
      options: sh.options,
      answer: sh.answer,
      fix: { label: `${p}% of ${n} =`, answer: rightAns },
      hints: [
        `Percent means hundredths. How many hundredths is ${p}%?`,
        `${p}% = ${p}/100. The student wrote ${wrongDec}, which is ${slipPct}%.`,
        `Divide ${p} by 100 to get the right decimal, then multiply it by ${n}.`,
      ],
      hintEs: `Porcentaje quiere decir centésimos. ¿Cuántos centésimos es ${p}%?`,
      solution: `<p>${cap(note)}, so the decimal is <b>${rightDec}</b>, not ${wrongDec} (that is ${slipPct}%). ${rightDec} × ${n} = <b>${fmt(rightAns)}</b>. ${p < 10 ? `A quick check: 10% of ${n} is ${n / 10}, so ${p}% must be less than that.` : `A quick check: ${p}% is more than 100%, so the answer must be more than ${n}.`}</p>`,
      feedback: {
        correct: `Correct. ${p}% = ${rightDec}, so ${p}% of ${n} = ${fmt(rightAns)}.`,
        wrong(a, d) {
          if (!d.mistakeOk) return `Compare ${wrongDec} and ${rightDec}. Which one is ${p} hundredths?`;
          const v = parseNum(a.fix);
          if (v != null && Math.abs(v - wrongAns) < 1e-9) return `${fmt(wrongAns)} is the student's answer (${slipPct}%). Use ${rightDec} × ${n}.`;
          if (v != null && Math.abs(v - rightAns * 10) < 1e-9) return `${fmt(v)} is ten times too big. Check the decimal: ${p}% = ${rightDec}.`;
          return `You found the mistake. Now multiply the correct decimal by ${n}.`;
        },
      },
    };
  });

  // ---------- Compare two percent situations (mc; hard = discounts in dollars and cents) ----------
  G.define('p4_compareTwo', (r, o) => {
    const hard = !!o.hard;
    const [nameA, nameB] = r.pickN(NAMES, 2);
    let pa, na, pb, nb;
    do {
      pa = r.pick(hard ? [15, 25, 30, 35, 40, 12, 45] : [10, 20, 25, 30, 40, 50, 60, 75]);
      pb = r.pick(hard ? [15, 25, 30, 35, 40, 12, 45] : [10, 20, 25, 30, 40, 50, 60, 75]);
      na = hard ? r.int(20, 90) : wholeFor(r, pa, 20, 200);
      nb = hard ? r.int(20, 90) : wholeFor(r, pb, 20, 200);
    } while (pa === pb || na === nb || (hard && Math.abs(of(pa, na) - of(pb, nb)) > 6));
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
      { html: `They are the same amount, so neither ${hard ? 'saves' : 'lights'} more.`, ok: equal, why: `They are different: ${aStr} and ${bStr}.` },
      { html: `${pa > pb ? nameA : nameB}, because ${Math.max(pa, pb)}% is the bigger percent.`, why: `A bigger percent of a smaller number can be less. Compute both: ${aStr} and ${bStr}.` },
    ];
    // If the bigger percent really wins, that distractor would be correct; use the bigger-whole reasoning instead.
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
        `${nameA}: ${pa}% of ${hard ? money(na) : na} = ${dec(pa)} × ${na} = ${aStr}.`,
        `${nameB}: multiply ${dec(pb)} × ${nb}. Then compare the two amounts.`,
      ],
      hintEs: 'No puedes comparar solo los porcentajes. Halla cada cantidad.',
      solution: `<p>${nameA}: ${pa}% of ${hard ? money(na) : na} = <b>${aStr}</b>. ${nameB}: ${pb}% of ${hard ? money(nb) : nb} = <b>${bStr}</b>. ${equal ? 'The amounts are <b>equal</b>.' : `<b>${a > b ? nameA : nameB}</b> has more.`} A percent only tells you the rate; the whole decides the amount.</p>`,
      feedback: { correct: `Correct. ${aStr} versus ${bStr}. Always compute both amounts before comparing.`, wrong: whyOf(sh.options, 'Find both amounts, then compare them.') },
    };
  });

  // ---------- Test scores table (table; hard = 8-, 16-, 40-, or 80-question tests) ----------
  G.define('p4_tableScores', (r, o) => {
    const hard = !!o.hard;
    const names = r.pickN(NAMES, 3);
    const total = r.pick(hard ? [8, 16, 40, 80] : [20, 25, 40, 50]);
    const step = 100 / total; // percent per question
    const lowest = hard ? Math.ceil(total * 0.4) : Math.ceil(total * 0.4) + 1;
    const scores = r.pickN(
      Array.from({ length: total - lowest + 1 }, (_, i) => total - i).filter((x) => (hard ? x !== total : true)),
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
      prompt: `<p>Three Keepers took the ${total}-question foundry exam. ${names[0]} got ${scores[0]} correct, ${names[1]} got ${scores[1]}, and ${names[2]} got ${scores[2]}. Write each score as a percent (no % sign).${hard ? ' Some percents are not whole numbers.' : ''}</p>`,
      rows,
      inputs,
      header: true,
      hints: [
        `A score is a fraction: correct out of ${total}. Change it to a fraction out of 100.`,
        `Each question is worth 100 ÷ ${total} = ${step}%. Multiply the number correct by ${step}.`,
        `Multiply each student's number correct by ${step}.${hard ? ' Keep the decimal part.' : ''}`,
      ],
      hintEs: `Una calificación es una fracción: respuestas correctas de ${total}. Cámbiala a una fracción sobre 100.`,
      solution: `<p>Each question is worth ${step}%. ${names.map((nm, i) => `${nm}: ${scores[i]}/${total} = ${scores[i]} × ${step} = <b>${round(scores[i] * step, 2)}%</b>`).join('; ')}. Scores become easy to compare once they are all out of 100.</p>`,
      feedback: {
        correct: 'Correct. Every score is now a rate per 100.',
        wrong(a, d) {
          const i = Number(d.wrong[0].slice(1));
          const v = parseNum(a[d.wrong[0]]);
          if (v === scores[i]) return `${scores[i]} is the number correct, not the percent. Multiply by ${step} to make it out of 100.`;
          if (v === total - scores[i]) return `${total - scores[i]} is the number wrong. The percent is the correct answers out of 100.`;
          if (v != null && Math.abs(v - round((total - scores[i]) * step, 2)) < 0.01) return `That is the percent ${names[i]} got <b>wrong</b>. Use the number correct, ${scores[i]}.`;
          if (v != null && Math.abs(v - round(scores[i] / total, 4)) < 0.001) return `${v} is the decimal. Multiply by 100 to write it as a percent.`;
          return `For ${names[i]}: ${scores[i]} out of ${total}. Each question is ${step}%, so multiply ${scores[i]} × ${step}.`;
        },
      },
    };
  });

  // ---------- True/false: percent discount vs dollars off (tf; hard = cents and close amounts) ----------
  G.define('p4_tfBetterDeal', (r, o) => {
    const hard = !!o.hard;
    const name = r.pick(NAMES);
    const item = r.pick(ITEMS);
    const price = hard ? r.int(31, 119) : 4 * r.int(6, 25);
    const p = hard ? r.pick([12, 15, 18, 35, 45]) : r.pick([10, 20, 25, 30, 40, 50]);
    const pctSave = of(p, price);
    let dollars;
    if (hard) dollars = round(pctSave + r.pick([-1.25, -0.75, -0.4, 0.35, 0.8, 1.5]), 2);
    else {
      dollars = pctSave + r.pick([-6, -4, -3, 3, 4, 6]);
      if (dollars <= 0) dollars = pctSave + 3;
    }
    const claimA = r.chance(0.5); // claim: Store A (percent) saves more
    const truth = claimA ? pctSave > dollars : dollars > pctSave;
    const dWhole = Math.round(dollars);
    const reasons = r.shuffle([
      { html: `${p}% of ${money(price)} is ${money(pctSave)}. ${money(pctSave)} is ${pctSave > dollars ? 'more' : 'less'} than ${money(dollars)}.`, correct: true },
      { html: `${p}% of ${money(price)} is ${money(pctSave)}. ${money(pctSave)} is ${pctSave > dollars ? 'less' : 'more'} than ${money(dollars)}.`, correct: false },
      { html: `${p} is ${p > dWhole ? 'bigger' : 'smaller'} than ${dWhole}, so the ${p > dWhole ? 'percent discount' : 'dollar discount'} is bigger.`, correct: false },
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
        `${p}% of ${money(price)} = ${dec(p)} × ${price}.${hard ? ' Round to the nearest cent.' : ''}`,
        `Compare your Store A amount with ${money(dollars)} (Store B).`,
      ],
      hintEs: 'No puedes comparar directamente un porcentaje con una cantidad de dólares. Cambia el porcentaje a dólares.',
      solution: `<p>Store A saves ${p}% of ${money(price)} = <b>${money(pctSave)}</b>. Store B saves <b>${money(dollars)}</b>. Store ${pctSave > dollars ? 'A' : 'B'} saves more, so ${name}'s claim is <b>${truth ? 'true' : 'false'}</b>. Convert the percent to an amount before comparing.</p>`,
      feedback: {
        correct: `Correct. ${money(pctSave)} versus ${money(dollars)} settles it.`,
        wrong(a, d) {
          if (!d.valueOk) return `Find the dollar value of the percent discount first (${dec(p)} × ${price}), then compare it with ${money(dollars)}.`;
          return 'Your true/false is right, but the reason must compare the two discounts in dollars, not the bare numbers.';
        },
      },
    };
  });

  // ---------- Discount / tax / tip word problem (num, money; hard = final price, or discount then tax) ----------
  G.define('p4_discount', (r, o) => {
    const hard = !!o.hard;
    const name = r.pick(NAMES);
    const item = r.pick(ITEMS);
    const kind = r.pick(hard ? ['discount', 'tax', 'tip', 'saleTax', 'saleTax'] : ['discount', 'tax', 'tip']);
    const price = kind === 'tip' ? r.int(20, 80) : 2 * r.int(8, 60);
    const p = kind === 'discount' || kind === 'saleTax' ? r.pick([10, 15, 20, 25, 30, 40, 50]) : kind === 'tax' ? r.pick([5, 6, 8, 10]) : r.pick([15, 20]);
    const t = kind === 'saleTax' ? r.pick([5, 6, 8, 10]) : 0;
    const part = of(p, price);
    const sale = round(price - part, 2);
    const taxOnSale = round((t / 100) * sale, 2);
    const final = kind === 'saleTax' ? round(sale + taxOnSale, 2) : kind === 'discount' ? sale : round(price + part, 2);
    const base = kind === 'tip' ? `The bill at the Lantern Café is ${hl(money(price))}` : `A ${item} costs ${hl(money(price))}`;
    const line =
      kind === 'saleTax'
        ? `It is on sale for ${hl(p + '% off')}. Then ${hl(t + '%')} sales tax is added to the sale price.`
        : kind === 'discount'
          ? `It is on sale for ${hl(p + '% off')}.`
          : kind === 'tax'
            ? `Sales tax is ${hl(p + '%')}.`
            : `${name} leaves a ${hl(p + '%')} tip.`;
    const partWord = kind === 'discount' || kind === 'saleTax' ? 'the discount' : kind === 'tax' ? 'the tax' : 'the tip';
    const question = hard ? (kind === 'discount' ? 'What is the <b>sale price</b>?' : 'What is the <b>total</b> paid?') : `How much is ${partWord}?`;
    const ans = hard ? final : part;
    const Part = cap(partWord);
    const hints =
      kind === 'saleTax'
        ? [
            'There are two steps. First find the sale price. Then find the tax on the <b>sale price</b> and add it.',
            `The discount is ${dec(p)} × ${price} = ${money(part)}, so the sale price is ${money(price)} − ${money(part)} = ${money(sale)}.`,
            `The tax is ${dec(t)} × ${money(sale)}. Round it to the nearest cent and add it to ${money(sale)}.`,
          ]
        : [
            `${Part} is ${p}% of the price. Write ${p}% as a decimal: ${dec(p)}.`,
            hard ? `${dec(p)} × ${price} = ${money(part)}. That is ${partWord}.` : `Multiply ${dec(p)} × ${price}.`,
            hard
              ? kind === 'discount'
                ? `Subtract the discount from the price: ${money(price)} − ${money(part)}.`
                : `Add it to the price: ${money(price)} + ${money(part)}.`
              : `Multiply ${price} by ${dec(p)} and write the result in dollars and cents.`,
          ];
    const hintEs =
      kind === 'saleTax'
        ? 'Hay dos pasos. Primero halla el precio de oferta. Después halla el impuesto sobre el <b>precio de oferta</b> y súmalo.'
        : `${kind === 'tip' ? 'La propina' : kind === 'tax' ? 'El impuesto' : 'El descuento'} es el ${p}% del precio. Escribe ${p}% como decimal: ${dec(p)}.`;
    return {
      type: 'num',
      skill: 'compare-percents',
      lesson: '4-4',
      title: hard ? `Find the ${kind === 'discount' ? 'sale price' : 'total'}` : `Find the ${kind}`,
      prompt: `<p>${base}. ${line}</p><p>${question}</p>`,
      answer: ans,
      tolerance: 0.006,
      hints,
      hintEs,
      solution:
        kind === 'saleTax'
          ? `<p>Discount = ${p}% of ${money(price)} = ${money(part)}, so the sale price is ${money(price)} − ${money(part)} = ${money(sale)}. Tax = ${t}% of ${money(sale)} = ${money(taxOnSale)}. Total = ${money(sale)} + ${money(taxOnSale)} = <b>${money(final)}</b>. The tax is figured on the sale price, because that is what you pay before tax.</p>`
          : `<p>${Part} = ${p}% of ${money(price)} = ${dec(p)} × ${price} = <b>${money(part)}</b>.${hard ? ` ${kind === 'discount' ? `Sale price = ${money(price)} − ${money(part)} = <b>${money(final)}</b>.` : `Total = ${money(price)} + ${money(part)} = <b>${money(final)}</b>.`}` : ''} ${kind === 'discount' ? 'A discount is taken off the price.' : `${kind === 'tax' ? 'Tax' : 'A tip'} is added to the price.`}</p>`,
      feedback: {
        correct:
          kind === 'saleTax'
            ? `Correct. Sale price ${money(sale)} plus ${money(taxOnSale)} tax is ${money(final)}.`
            : hard
              ? `Correct. ${money(part)} ${kind === 'discount' ? 'off' : 'added'} gives ${money(final)}.`
              : `Correct. ${p}% of ${money(price)} is ${money(part)}.`,
        wrong(a, d) {
          const v = d.value;
          if (v == null) return `Write ${p}% as ${dec(p)} and multiply by ${price}.`;
          if (kind === 'saleTax') {
            if (Math.abs(v - sale) < 0.006) return `${money(sale)} is the sale price. You still need to add the ${t}% tax on it.`;
            const taxOnPrice = round((t / 100) * price, 2);
            if (Math.abs(v - round(sale + taxOnPrice, 2)) < 0.006) return `You found the tax on the original price. Tax is added to the <b>sale</b> price, ${money(sale)}.`;
            if (Math.abs(v - round(price * (1 - (p - t) / 100), 2)) < 0.006)
              return `You combined the percents (${p}% off and ${t}% tax) on the original price. Do the steps in order: the tax is on the sale price.`;
            if (Math.abs(v - round(price + taxOnPrice, 2)) < 0.006) return `You added tax but never took off the ${p}% discount.`;
            return `First find the sale price (${money(price)} minus ${p}%). Then add ${t}% of the sale price.`;
          }
          if (hard && Math.abs(v - part) < 0.006)
            return `${money(part)} is ${partWord}. The question asks for the ${kind === 'discount' ? 'sale price, so subtract it from' : 'total, so add it to'} ${money(price)}.`;
          if (!hard && Math.abs(v - final) < 0.006) return `${money(final)} is the ${kind === 'discount' ? 'sale price' : 'total'}. The question asks only for ${partWord}.`;
          if (Math.abs(v - price * (p / 10)) < 0.006) return `You used ${round(p / 10, 2)} for ${p}%. ${p}% is ${p} hundredths: ${dec(p)}.`;
          if (Math.abs(v - price * p) < 0.006) return `You multiplied by ${p}. ${p}% means ${p} out of 100, so multiply by ${dec(p)}.`;
          if (hard && kind !== 'discount' && Math.abs(v - (price - part)) < 0.006) return `You subtracted. ${kind === 'tax' ? 'Tax' : 'A tip'} is added to the price.`;
          if (hard && kind === 'discount' && Math.abs(v - (price + part)) < 0.006) return `You added the discount. A discount is taken off the price.`;
          return `${Part} = ${dec(p)} × ${money(price)}.${hard ? ` Then ${kind === 'discount' ? 'subtract it from' : 'add it to'} the price.` : ''}`;
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
  const dec = (p) => String(round(p / 100, 4));
  const fmtN = (n) => String(round(n, 2));
  const whyOf = (options, fallback) => (ans) => (options[ans] && options[ans].why) || fallback;
  const partOf = (p, n) => round((p / 100) * n, 2);
  // Whole n in [lo, hi] such that p% of n is a whole number.
  const wholeFor = (r, p, lo, hi) => {
    const m = 100 / RX.gcd(p, 100);
    return m * r.int(Math.ceil(lo / m), Math.floor(hi / m));
  };
  const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
  const BAR_LABELS = ['0%', '10%', '20%', '30%', '40%', '50%', '60%', '70%', '80%', '90%'];

  // ---------- Tape diagram: part row and whole row (tape; hard = 10% or 12.5% boxes, bigger values) ----------
  G.define('p5_tape', (r, o) => {
    const hard = !!o.hard;
    const step = hard ? r.pick([10, 12.5, 12.5]) : r.pick([10, 20, 25]);
    const nBoxes = 100 / step;
    const k = hard ? (step === 10 ? r.pick([3, 6, 7, 9]) : r.pick([3, 5, 7])) : step === 10 ? r.pick([2, 3, 4]) : r.pick([2, 3]);
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
      prompt: hard
        ? `<p>${hl(p + '%')} of the ${ctx.thing} are ${ctx.verb}. That is ${hl(part + ' ' + ctx.unit)}.</p><p>The top row of the tape diagram shows the ${p}% part. The bottom row shows the whole (100%) in ${nBoxes} equal boxes. Find the value of one box, then the whole.</p>`
        : `<p>${hl(p + '%')} of the ${ctx.thing} are ${ctx.verb}. That is ${hl(part + ' ' + ctx.unit)}.</p><p>In the tape diagram every box is ${step}%. The top row shows the ${p}% part. The bottom row shows the whole (100%). Find the value of one box, then the whole.</p>`,
      rows: [
        { label: `${p}% (part)`, boxes: k },
        { label: '100% (whole)', boxes: nBoxes },
      ],
      fields: [
        { key: 'box', label: hard ? 'One box' : `One box (${step}%)`, answer: m },
        { key: 'whole', label: `Whole (100%), in ${ctx.unit}`, answer: whole },
      ],
      given: { rowA: part },
      hints: hard
        ? [
            `All boxes are the same size. The whole is ${nBoxes} boxes, so each box is 100% ÷ ${nBoxes} = ${step}%. The ${p}% row has ${k} boxes.`,
            `The ${k} boxes in the top row share ${part} ${ctx.unit} equally. Divide ${part} by ${k} for one box.`,
            `Multiply the value of one box by ${nBoxes}, the number of boxes in the whole.`,
          ]
        : [
            `All boxes are the same size. The ${p}% row has ${k} ${boxWord} and stands for ${part} ${ctx.unit}.`,
            `${part} ÷ ${k} = ${m}. One box (${step}%) is worth ${m} ${ctx.unit}.`,
            `The whole row has ${nBoxes} boxes. Multiply ${nBoxes} × ${m}.`,
          ],
      hintEs: hard
        ? `Todas las cajas son del mismo tamaño. El total son ${nBoxes} cajas, así que cada caja es 100% ÷ ${nBoxes} = ${step}%. La fila del ${p}% tiene ${k} cajas.`
        : `Todas las cajas son del mismo tamaño. La fila del ${p}% tiene ${k} ${k === 1 ? 'caja' : 'cajas'} y vale ${part} en total.`,
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
            if (box != null && Math.abs(box - part / nBoxes) < 1e-9) return `You divided ${part} by all ${nBoxes} boxes. Only the ${k} boxes in the top row share ${part}.`;
            return `Start with the row you know: ${k} equal ${boxWord} make ${part}. Divide to find one box.`;
          }
          if (w === part) return `${part} is the ${p}% part. The whole is all ${nBoxes} boxes in the bottom row.`;
          if (w != null && Math.abs(w - partOf(p, part)) < 1e-9) return `You found ${p}% of ${part}. The whole is bigger than the part: multiply one box by ${nBoxes}.`;
          if (w != null && Math.abs(w - m * (nBoxes - k)) < 1e-9) return `That is only the boxes that are <b>not</b> in the part. The whole is all ${nBoxes} boxes.`;
          return `Your box value is right. The whole row has ${nBoxes} boxes, so multiply ${m} by ${nBoxes}.`;
        },
      },
    };
  });

  // ---------- Double number line: given one percent-amount pair, find the rest including 100% (dnl; hard = uneven 10% ticks) ----------
  G.define('p5_dnlWhole', (r, o) => {
    const hard = !!o.hard;
    const ctx = r.pick(CTX);
    const label = cap(ctx.unit);
    if (hard) {
      const per = r.int(3, 18);
      const gp = r.pick([30, 40, 60, 70]);
      const rest = r.pickN(
        [10, 20, 30, 40, 50, 60, 70, 80, 90].filter((x) => x !== gp),
        2,
      );
      const pcts = [gp].concat(rest).sort((a, b) => a - b);
      const top = ['0%'].concat(
        pcts.map((x) => x + '%'),
        ['100%'],
      );
      const vals = [0].concat(
        pcts.map((x) => (x / 10) * per),
        [per * 10],
      );
      const gi = pcts.indexOf(gp) + 1;
      const blankIdx = [1, 2, 3, 4].filter((i) => i !== gi);
      const part = (gp / 10) * per;
      const whole = per * 10;
      return {
        type: 'dnl',
        skill: 'find-whole',
        lesson: '4-5',
        title: 'Find the whole on a double number line',
        prompt: `<p>${hl(gp + '%')} of the ${ctx.thing} are ${ctx.verb}. That is ${hl(part + ' ' + ctx.unit)}.</p><p>Fill in the missing amounts, including the whole at 100%. The ticks are not evenly spaced in percent.</p>`,
        top: { label: 'Percent', values: top },
        bottom: { label, values: vals.map((v, i) => (blankIdx.includes(i) ? null : v)) },
        blanks: blankIdx.map((i) => ({ i, answer: vals[i] })),
        hints: [
          `${gp}% is ${gp / 10} groups of 10%. Find the amount for 10% first.`,
          `Divide ${part} by ${gp / 10} to get 10%. Every tick is a whole number of 10% steps.`,
          `Multiply your 10% amount by ${blankIdx.map((i) => (i === 4 ? 10 : pcts[i - 1] / 10)).join(', ')} for the blank ticks.`,
        ],
        hintEs: `${gp}% son ${gp / 10} grupos de 10%. Primero halla la cantidad que corresponde al 10%.`,
        solution: `<p>${gp}% = ${gp / 10} × 10%, so 10% is ${part} ÷ ${gp / 10} = <b>${per}</b>. ${blankIdx.map((i) => `${top[i]} → ${i === 4 ? 10 : pcts[i - 1] / 10} × ${per} = <b>${vals[i]}</b>`).join('; ')}. The whole (100%) is <b>${whole} ${ctx.unit}</b>.</p>${V.dnl({ label: 'Percent', values: top }, { label, values: vals }, { aria: `Double number line: ${top.join(', ')} above ${vals.join(', ')}` })}`,
        feedback: {
          correct: `Correct. 10% is ${per}, so 100% is ${whole}.`,
          wrong(a, d) {
            const last = blankIdx.indexOf(4);
            const w = parseNum(a[last]);
            if (d.wrong.includes(last) && w === part) return `${part} is the ${gp}% part. The whole at 100% is 10 groups of 10%.`;
            if (d.wrong.includes(last) && w === part * 10) return `${part} is ${gp}%, not 10%. Find 10% first: ${part} ÷ ${gp / 10}.`;
            if (d.wrong.includes(last) && w != null && Math.abs(w - (part + (100 - gp))) < 1e-9)
              return `You added ${100 - gp}, the missing percent, to the amount. Percents and amounts are on different lines: find 10% first.`;
            return `Find 10% first: ${part} ÷ ${gp / 10}. Then multiply it by the number of 10% steps to each blank tick.`;
          },
        },
      };
    }
    const step = r.pick([20, 25]);
    const n = 100 / step;
    const per = r.int(3, 15);
    const whole = per * n;
    const top = Array.from({ length: n + 1 }, (_, i) => `${i * step}%`);
    const vals = Array.from({ length: n + 1 }, (_, i) => per * i);
    const givenIdx = r.pick(step === 25 ? [2, 3] : [2, 3, 4]);
    const others = [];
    for (let i = 1; i < n; i++) if (i !== givenIdx) others.push(i);
    const blankIdx = r
      .pickN(others, 2)
      .concat([n])
      .sort((x, y) => x - y);
    const bottom = vals.map((v, i) => (blankIdx.includes(i) ? null : v));
    const p = givenIdx * step;
    const part = vals[givenIdx];
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
        `Count up by ${per} from 0 to each blank tick. 100% is ${n} jumps.`,
      ],
      hintEs: `${p}% son ${givenIdx} saltos de ${step}%. Primero halla la cantidad de un salto de ${step}%.`,
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
          if (d.wrong.length === 1 && d.wrong[0] === last && w === part) return `${part} is the ${p}% part. The whole at 100% is ${n} jumps of ${per}.`;
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
      prompt: hard
        ? `<p>${hl(part + ' ' + ctx.unit)} are ${ctx.verb}. That is ${hl(p + '%')} of all the ${ctx.thing}.</p><p>How many ${ctx.thing} are there in all?</p>`
        : `<p>${hl(part + ' ' + ctx.unit)} are ${ctx.verb}. That is ${hl(p + '%')} of all the ${ctx.thing}.</p><p>How many ${ctx.thing} are there in all?</p><p class="muted">Think: ${p}% of what number is ${part}?</p>`,
      unit: ctx.unit,
      answer: whole,
      hints: [
        'You know the part and the percent. The whole (100%) is missing. To find the whole, divide the part by the percent.',
        `${p}% = ${d}${fr ? ` = ${fr}` : ''}. Divide: ${part} ÷ ${d}.${fr ? ` Or think in fractions: ${part} is ${fr} of the whole, so the whole is ${part} ÷ ${fn} × ${fd}.` : ' Or find 1% first: divide the part by ' + p + ', then multiply by 100.'}`,
        `Divide ${part} ÷ ${d}. Check by multiplying back: ${p}% of your answer should be ${part}.`,
      ],
      hintEs: 'Conoces la parte y el porcentaje. Falta el total (100%). Para hallar el total, divide la parte entre el porcentaje.',
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
          if (Math.abs(v - (part + partOf(p, part))) < 0.006) return `You added ${p}% of ${part} to ${part}. But ${part} is ${p}% of the <b>whole</b>, so divide ${part} by ${d}.`;
          if (v < part) return `The whole must be bigger than the part (${part}), because ${p}% is less than 100%.`;
          return `Divide the part by the percent: ${part} ÷ ${d}. Then check: ${p}% of your answer should be ${part}.`;
        },
      },
    };
  });

  // ---------- Error: multiplied instead of dividing, or divided by the discount (error; hard = sale price ÷ discount) ----------
  G.define('p5_errorDivide', (r, o) => {
    const hard = !!o.hard;
    const name = r.pick(NAMES);
    if (hard) {
      const off = r.pick([20, 25, 40, 60, 75, 30]);
      const keep = 100 - off;
      const whole = 20 * r.int(2, 9);
      const paid = partOf(keep, whole);
      const dOff = dec(off);
      const dKeep = dec(keep);
      const wrongAns = round(paid / (off / 100), 2);
      const item = r.pick(ITEMS);
      const opts = [
        { html: `${name} divided by the discount, ${off}%. ${money(paid)} is the price <b>after</b> the discount, which is ${keep}% of the original, so divide by ${dKeep}.`, ok: true },
        {
          html: `${name} should have multiplied ${money(paid)} × ${dOff} and then added that amount to ${money(paid)}.`,
          why: `That finds ${off}% of the <b>sale</b> price. The discount was ${off}% of the <b>original</b> price, so this undercounts it.`,
        },
        {
          html: `There is no mistake. Dividing the price paid by the discount percent always gives the original price.`,
          why: `Check it: ${off}% off ${money(wrongAns)} would leave ${money(partOf(keep, wrongAns))}, not ${money(paid)}.`,
        },
        {
          html: `${name} should have divided ${money(paid)} by ${off} instead of by ${dOff}, since ${off}% is the discount.`,
          why: `Dividing by ${off} finds 1% of something, not the original price. And ${money(paid)} is not the ${off}% part anyway.`,
        },
      ];
      const sh = shuffleOptions(r, opts, 0);
      return {
        type: 'error',
        skill: 'find-whole',
        lesson: '4-5',
        title: 'Find the mistake',
        prompt: `<p>A ${item} is on sale for ${hl(off + '% off')}. ${name} paid ${hl(money(paid))}. ${name} tries to find the original price. What is the mistake?</p>`,
        work: `${off}% = ${dOff} &nbsp;&nbsp; ${money(paid)} ÷ ${dOff} ${Math.abs(paid / (off / 100) - wrongAns) < 1e-9 ? '=' : '≈'} ${money(wrongAns)} &nbsp;&nbsp; "The original price was ${money(wrongAns)}."`,
        options: sh.options,
        answer: sh.answer,
        fix: { label: 'Original price ($):', answer: whole },
        hints: [
          `Is ${money(paid)} the discount or the price after the discount? ${name} paid what was <b>left</b> after ${off}% was taken off.`,
          `The price paid is 100% − ${off}% = ${keep}% of the original price.`,
          `Divide ${money(paid)} by ${dKeep}. Check: ${off}% off your answer should leave ${money(paid)}.`,
        ],
        hintEs: `¿${money(paid)} es el descuento o el precio después del descuento? ${name} pagó lo que <b>quedó</b> después de quitar el ${off}%.`,
        solution: `<p>${money(paid)} is what is left after ${off}% off, so it is ${keep}% of the original price. Original = ${money(paid)} ÷ ${dKeep} = <b>${money(whole)}</b>. Check: ${off}% of ${money(whole)} is ${money(partOf(off, whole))}, and ${money(whole)} − ${money(partOf(off, whole))} = ${money(paid)}. ${name} divided by ${dOff}, which treats the price paid as if it were the discount.</p>`,
        feedback: {
          correct: `Correct. ${money(paid)} is ${keep}% of the original, so ${money(paid)} ÷ ${dKeep} = ${money(whole)}.`,
          wrong(a, dd) {
            if (!dd.mistakeOk) return `Ask: what percent of the original price did ${name} actually pay? It is not ${off}%.`;
            const v = parseNum(a.fix);
            if (v != null && Math.abs(v - wrongAns) < 0.006) return `${money(wrongAns)} is ${name}'s answer. Divide by ${dKeep} (the ${keep}% that was paid), not ${dOff}.`;
            if (v != null && Math.abs(v - (paid + partOf(off, paid))) < 0.006)
              return `You added ${off}% of the sale price. The ${off}% was taken from the original price, so divide ${money(paid)} by ${dKeep}.`;
            return `You found the mistake. Now divide ${money(paid)} by ${dKeep}.`;
          },
        },
      };
    }
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
      {
        html: `${name} should have multiplied ${part} by ${p} instead of ${d}.`,
        why: `${part} × ${p} = ${part * p} is far too big. Multiplying finds a percent <b>of</b> ${part}. Here ${part} is the part, so divide.`,
      },
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
        `Divide ${part} ÷ ${d}. Check: ${d} × your answer should equal ${part}.`,
      ],
      hintEs: `¿${part} es la parte o el total? El ${p}% del total es ${part}, así que ${part} es la parte.`,
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

  // ---------- Word problems: class size, goal, original price, full tank, price before tax (num; hard = non-benchmark percents, tax included) ----------
  G.define('p5_wordWhole', (r, o) => {
    const hard = !!o.hard;
    const name = r.pick(NAMES);
    const kind = r.pick(hard ? ['class', 'goal', 'sale', 'taxIncl', 'taxIncl'] : ['class', 'goal', 'sale', 'tank']);
    let p, whole, given, prompt, wholeName, isMoney, q, intro, hint1, hint1Es;
    if (kind === 'class') {
      p = hard ? r.pick([15, 35, 45, 65, 85]) : r.pick([20, 25, 30, 40, 50, 60, 75, 80]);
      whole = wholeFor(r, p, 20, 40);
      given = partOf(p, whole);
      const act = r.pick(['walk to school', 'play an instrument', 'have a pet', 'ride the bus']);
      prompt = `<p>In ${name}'s class, ${hl(p + '%')} of the students ${act}. That is ${hl(given + ' students')}.</p><p>How many students are in the class?</p>`;
      wholeName = 'whole class';
      isMoney = false;
      q = p;
      intro = `${given} students is ${p}% of the class.`;
    } else if (kind === 'goal') {
      p = hard ? r.pick([8, 12, 15, 35, 45, 65]) : r.pick([10, 20, 25, 30, 40, 50, 60, 75, 80]);
      whole = wholeFor(r, p, 100, 1000);
      given = partOf(p, whole);
      const fund = r.pick(['Lantern Fund', 'Festival Food Drive', 'Harbor Library Drive', 'Sixth-Grade Trip Fund']);
      prompt = `<p>The ${fund} has collected ${hl(money(given))} so far. That is ${hl(p + '%')} of its goal.</p><p>What is the goal?</p>`;
      wholeName = 'goal';
      isMoney = true;
      q = p;
      intro = `${money(given)} is ${p}% of the goal.`;
    } else if (kind === 'sale') {
      p = hard ? r.pick([15, 35, 45, 30, 65]) : r.pick([20, 25, 40, 50, 60, 75]);
      whole = 20 * r.int(1, 6);
      given = partOf(100 - p, whole);
      const item = r.pick(ITEMS);
      prompt = `<p>A ${item} is on sale for ${hl(p + '% off')}. ${name} pays ${hl(money(given))}.</p><p>What was the original price?</p>`;
      wholeName = 'original price';
      isMoney = true;
      q = 100 - p;
      intro = `The sale price is what is left after ${p}% is taken off: 100% − ${p}% = ${q}% of the original price. So ${money(given)} is ${q}% of the original price.`;
    } else if (kind === 'taxIncl') {
      p = r.pick([5, 6, 8, 10]);
      whole = 10 * r.int(2, 12);
      q = 100 + p;
      given = partOf(q, whole);
      const item = r.pick(ITEMS);
      prompt = `<p>${name} paid ${hl(money(given))} for a ${item}. That total includes ${hl(p + '%')} sales tax.</p><p>What was the price <b>before</b> tax?</p>`;
      wholeName = 'price before tax';
      isMoney = true;
      intro = `The total is the price (100%) plus ${p}% tax: 100% + ${p}% = ${q}% of the price. So ${money(given)} is ${q}% of the price before tax.`;
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
    if (kind === 'sale') {
      hint1 = `${name} paid the price <b>after</b> the discount. The sale price is 100% − ${p}% = ${q}% of the original price.`;
      hint1Es = `${name} pagó el precio <b>después</b> del descuento. El precio de oferta es 100% − ${p}% = ${q}% del precio original.`;
    } else if (kind === 'taxIncl') {
      hint1 = `The total includes the tax. The price before tax is 100%, so the total is 100% + ${p}% = ${q}% of it.`;
      hint1Es = `El total incluye el impuesto. El precio antes del impuesto es el 100%, así que el total es 100% + ${p}% = ${q}% de ese precio.`;
    } else {
      hint1 = `${gStr} is the part. The ${wholeName} is 100%, and it is unknown. Divide the part by the percent.`;
      hint1Es = `${gStr} es la parte. El total es el 100% y no lo conoces. Divide la parte entre el porcentaje.`;
    }
    return {
      type: 'num',
      skill: 'percent-problems',
      lesson: '4-5',
      title:
        kind === 'sale'
          ? 'Find the original price'
          : kind === 'taxIncl'
            ? 'Find the price before tax'
            : kind === 'goal'
              ? 'Find the goal'
              : kind === 'tank'
                ? 'Find the full tank'
                : 'Find the class size',
      prompt,
      unit: kind === 'class' ? 'students' : kind === 'tank' ? 'gallons' : undefined,
      answer: whole,
      tolerance: isMoney ? 0.006 : 0.001,
      hints: [hint1, `${q}% = ${d}. Divide: ${gStr} ÷ ${d}.`, `Divide ${gStr} by ${d}. Check: ${q}% of your answer should be ${gStr}.`],
      hintEs: hint1Es,
      solution: `<p>${intro} Whole = part ÷ percent: ${gStr} ÷ ${d} = <b>${wStr}</b>. Check: ${d} × ${whole} = ${gStr}. ${kind === 'sale' ? 'Dividing by the discount percent would be wrong, because the sale price is not the discount.' : kind === 'taxIncl' ? 'Subtracting ' + p + '% of the total would be wrong, because the tax was figured on the price, not on the total.' : 'Dividing by the percent gives the 100% amount.'}</p>`,
      feedback: {
        correct: `Correct. ${gStr} ÷ ${d} = ${wStr}.`,
        wrong(a, dd) {
          const v = dd.value;
          if (v == null) return `Write ${q}% as ${d} and divide ${gStr} by it.`;
          if (Math.abs(v - partOf(q, given)) < 0.006)
            return `You found ${q}% of ${gStr}. ${kind === 'taxIncl' ? 'The price before tax is smaller than the total' : `The ${wholeName} is bigger than ${gStr}`}: divide, do not multiply.`;
          if (kind === 'sale' && Math.abs(v - given / (p / 100)) < 0.006) return `You divided by the discount, ${p}%. ${name} paid ${100 - p}% of the price, so divide by ${d}.`;
          if (kind === 'sale' && Math.abs(v - (given + partOf(p, given))) < 0.006)
            return `You added ${p}% of the sale price. The discount was ${p}% of the <b>original</b> price, so divide ${gStr} by ${d} instead.`;
          if (kind === 'taxIncl' && Math.abs(v - (given - partOf(p, given))) < 0.006)
            return `You took ${p}% of the total off. The tax was ${p}% of the <b>price</b>, not of the total, so divide ${gStr} by ${d}.`;
          if (kind === 'taxIncl' && Math.abs(v - (given - p)) < 0.006) return `You subtracted ${p} dollars. The tax is ${p}% of the price, not $${p}.`;
          if (Math.abs(v - given * q) < 0.006) return `You multiplied by ${q}. The whole is part ÷ percent: ${gStr} ÷ ${d}.`;
          if (kind !== 'taxIncl' && v < given) return `The ${wholeName} must be bigger than ${gStr}, because ${gStr} is only ${q}% of it.`;
          return `Divide the part by the percent: ${gStr} ÷ ${d}. Check: ${q}% of your answer should be ${gStr}.`;
        },
      },
    };
  });

  // ---------- Sort problems: find the part vs. find the whole (sort; hard = look-alike pairs, discounts, over 100%) ----------
  G.define('p5_sortPartWhole', (r, o) => {
    const hard = !!o.hard;
    const [n1, n2, n3] = r.pickN(NAMES, 3);
    let partPool, wholePool;
    if (hard) {
      const off = r.pick([20, 25, 30, 40]);
      const pr = 20 * r.int(2, 6);
      const grow = r.pick([110, 120, 125, 150]);
      const last = 20 * r.int(10, 30);
      partPool = [
        `A ${r.pick(ITEMS)} was ${money(pr)} and is now ${off}% off. What does it cost now?`,
        `Last year ${last} people came to the festival. This year ${grow}% as many came. How many came this year?`,
        `${n1} had ${money(4 * r.int(10, 30))} and spent ${r.pick([15, 35, 45])}% of it. How much did ${n1} spend?`,
        `A ${money(10 * r.int(3, 9))} meal gets a ${r.pick([15, 18, 20])}% tip. What is the total with the tip?`,
        `The full tank holds ${10 * r.int(20, 60)} gallons and is ${r.pick([35, 45, 65])}% full. How many gallons are in it?`,
      ];
      wholePool = [
        `A ${r.pick(ITEMS)} is ${off}% off and now costs ${money(partOf(100 - off, pr))}. What was it before the sale?`,
        `This year ${grow}% as many people came to the festival as last year: ${partOf(grow, last)} people. How many came last year?`,
        `${n2} spent ${money(r.int(6, 30))}, which was ${r.pick([15, 35, 45])}% of the money ${n2} had. How much did ${n2} have?`,
        `${n3}'s total was ${money(10.8 * r.int(2, 9))} including 8% tax. What was the price before tax?`,
        `${r.int(12, 60)} gallons is ${r.pick([35, 45, 65])}% of what the tank holds. How much does the full tank hold?`,
      ];
    } else {
      partPool = [
        `What is ${r.pick([20, 25, 50, 75])}% of ${r.pick([40, 60, 80, 120])}?`,
        `A ${money(4 * r.int(6, 20))} ${r.pick(ITEMS)} is ${r.pick([10, 20, 25, 30])}% off. How much is the discount?`,
        `${r.pick([15, 30, 45])}% of the ${10 * r.int(4, 12)} lanterns are red. How many lanterns are red?`,
        `Sales tax is ${r.pick([5, 6, 8])}% on a ${money(10 * r.int(2, 9))} bill. How much is the tax?`,
        `${n1} answered ${r.pick([80, 90, 95])}% of the ${r.pick([20, 40, 60])} questions correctly. How many questions is that?`,
      ];
      wholePool = [
        `${r.int(6, 30)} is ${r.pick([20, 25, 50])}% of what number?`,
        `${r.pick([20, 25, 40, 50])}% of the class is ${r.int(5, 12)} students. How many students are in the class?`,
        `The tank is ${r.pick([25, 30, 40, 60])}% full with ${r.int(10, 60)} gallons. How many gallons does the full tank hold?`,
        `${money(4 * r.int(3, 15))} is ${r.pick([10, 20, 25, 40])}% of the goal. What is the goal?`,
        `${n2} has read ${r.int(20, 90)} pages, which is ${r.pick([25, 40, 50, 75])}% of the book. How many pages are in the book?`,
        `${n3} scored ${r.int(6, 18)} points, which was ${r.pick([20, 25, 30, 40])}% of the team's points. How many points did the team score?`,
      ];
    }
    const items = r.shuffle(
      r
        .pickN(partPool, 3)
        .map((html) => ({ html, bin: 0 }))
        .concat(r.pickN(wholePool, 3).map((html) => ({ html, bin: 1 }))),
    );
    return {
      type: 'sort',
      skill: 'part-vs-whole',
      lesson: '4-5',
      title: 'Part or whole?',
      prompt: hard
        ? '<p>Before solving a percent problem, decide what is missing. These problems look alike, so read each one closely. Does it ask for a <b>part</b> (a percent of a known amount) or the <b>whole</b> (the 100% amount)?</p><p class="muted">You do not need to solve them.</p>'
        : '<p>Before solving a percent problem, decide what is missing. Sort each problem: does it ask you to find the <b>part</b> or the <b>whole</b>?</p><p class="muted">You do not need to solve them.</p>',
      bins: hard ? ['Find a part (100% is given)', 'Find the whole (100% is missing)'] : ['Find the part', 'Find the whole'],
      items,
      hints: [
        'Ask one question about each card: is the total (100%) given, or is the total what you need to find?',
        hard
          ? 'Find the starting amount the percent is taken of: the original price, last year, the money at first, the price before tax. Is that number given?'
          : 'If the percent and the <b>whole</b> are given, you find the part: multiply the whole by the percent.',
        hard
          ? 'If the starting amount is given, you find a part (even when the part is a sale price or a total over 100%). If the starting amount is the question, you find the whole.'
          : 'If the percent and a <b>part</b> are given, you find the whole: divide the part by the percent. Words like "of what number," "the goal," "the full tank," and "the whole class" point to a missing whole.',
      ],
      hintEs: 'Hazte una pregunta en cada tarjeta: ¿te dan el total (100%) o tienes que hallar el total?',
      solution: `<p><b>Find a part</b> (the total is given): ${items
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
          return `Look again at "${it.html}" ${it.bin === 0 ? 'The starting total (100%) is given, and the percent is taken of it. That asks for a part.' : 'The starting total (100%) is missing. The amount given is only a percent of it. That asks for the whole.'}`;
        },
      },
    };
  });

  // ---------- Who found the whole correctly? (who; hard = non-benchmark percents, add-on distractor) ----------
  G.define('p5_whoWhole', (r, o) => {
    const hard = !!o.hard;
    const [a, b, c] = r.pickN(NAMES, 3);
    const p = hard ? r.pick([15, 35, 45, 65, 85]) : r.pick([20, 25, 30, 40, 50, 60, 75, 80]);
    const whole = hard ? wholeFor(r, p, 40, 400) : wholeFor(r, p, 20, 200);
    const part = partOf(p, whole);
    const d = dec(p);
    const onePct = round(part / p, 2);
    const ctx = r.pick(CTX);
    const method = r.pick(!hard && p % 10 === 0 ? ['equation', 'tenPercent', 'onePercent'] : ['equation', 'onePercent']);
    const tens = p / 10;
    const aWork =
      method === 'tenPercent'
        ? `"${p}% is ${tens} tens. ${part} ÷ ${tens} = ${part / tens}, so 10% is ${part / tens}. Then 100% is 10 × ${part / tens} = <b>${whole}</b>."`
        : method === 'onePercent'
          ? `"${part} ÷ ${p} = ${fmtN(onePct)}, so 1% is ${fmtN(onePct)}. Then 100% is ${fmtN(onePct)} × 100 = <b>${whole}</b>."`
          : `"${p}% = ${d}. ${part} ÷ ${d} = <b>${whole}</b>. Check: ${d} × ${whole} = ${part}."`;
    const addOn = round(part + partOf(p, part), 2);
    const opts = [
      { title: a, html: aWork, ok: true },
      hard
        ? {
            title: b,
            html: `"The ${p}% is missing from ${part}, so I add ${p}% of ${part}: ${part} + ${fmtN(partOf(p, part))} = <b>${fmtN(addOn)}</b> ${ctx.unit} in all."`,
            why: `${b} added ${p}% of ${part}. But ${part} is ${p}% of the <b>whole</b>, not 100% − ${p}%. Check: ${p}% of ${fmtN(addOn)} is not ${part}.`,
          }
        : {
            title: b,
            html: `"${p}% = ${d}. ${part} × ${d} = ${fmtN(partOf(p, part))}. There are <b>${fmtN(partOf(p, part))}</b> ${ctx.unit} in all."`,
            why: `${b} multiplied, which finds ${p}% of ${part}. The whole must be bigger than the part ${part}, so divide instead.`,
          },
      {
        title: c,
        html: `"${part} ÷ ${p} = ${fmtN(onePct)}. So there are <b>${fmtN(onePct)}</b> ${ctx.unit} in all."`,
        why: `${c} divided by ${p} instead of by ${p}% (${d}). ${fmtN(onePct)} is only 1% of the whole; multiply it by 100.`,
      },
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
        `Multiply ${d} by each student's total. Only one gives back ${part}.`,
      ],
      hintEs: `${part} es la parte. El total (100%) no se conoce y tiene que ser mayor que ${part}. ¿Qué respuestas son mayores que ${part}?`,
      solution: `<p><b>${a}</b> is correct: the whole is <b>${whole}</b>, and ${p}% of ${whole} = ${part}. ${hard ? `${b} added ${p}% of ${part}, which treats ${part} as the 100% amount.` : `${b} multiplied, which finds a part of ${part}, not the whole.`} ${c} divided by ${p} instead of ${d}, which gives 1% of the whole, not 100%.</p>`,
      feedback: { correct: `Correct. The whole is ${whole}, and ${p}% of ${whole} is ${part}.`, wrong: whyOf(sh.options, `Check each total: ${p}% of the correct total equals ${part}.`) },
    };
  });

  // ---------- Explain how to find the whole from a percent bar (cr; hard = 4, 5, or 8 sections, no labels) ----------
  G.define('p5_barWhole', (r, o) => {
    const hard = !!o.hard;
    const parts = hard ? r.pick([4, 5, 8, 8]) : 10;
    const per = 100 / parts;
    const k = hard ? r.int(2, parts - 1) : r.int(2, 8);
    const m = r.int(3, 20);
    const part = k * m;
    const whole = parts * m;
    const p = k * per;
    const ctx = r.pick(CTX);
    const checkOpts = [
      { html: `${whole} ${ctx.unit}`, ok: true, tag: 'ok' },
      { html: `${part * parts} ${ctx.unit}`, tag: 'times' },
      { html: `${fmtN(part * (p / 100))} ${ctx.unit}`, tag: 'mult' },
      { html: `${(parts - k) * m} ${ctx.unit}`, tag: 'rest' },
    ].filter((x, i, arr) => arr.findIndex((y) => y.html === x.html) === i);
    const sh = shuffleOptions(r, checkOpts, 0);
    return {
      type: 'cr',
      skill: 'part-vs-whole',
      lesson: '4-5',
      title: 'Explain how to find the whole',
      prompt: hard
        ? `<p>The percent bar stands for all the ${ctx.thing}. It has ${parts} equal sections, and ${hl(k)} sections are shaded. The shaded part is ${hl(part + ' ' + ctx.unit)}, which is ${hl(p + '%')} of the whole.</p>${V.bar({ parts, shaded: k, aria: `Percent bar with ${k} of ${parts} sections shaded, ${p} percent` })}<p>Explain how to find the whole (100%). Say what percent one section is, then give two ways: one using the bar, and one using division.</p>`
        : `<p>The percent bar stands for all the ${ctx.thing}. It has 10 equal sections, and ${hl(k)} sections are shaded. The shaded part is ${hl(part + ' ' + ctx.unit)}, which is ${hl(p + '%')} of the whole.</p>${V.bar({ parts: 10, shaded: k, labels: BAR_LABELS, aria: `Percent bar with ${k} of 10 sections shaded, ${p} percent` })}<p>Explain how to find the whole (100%). Give two ways if you can: one using the bar, and one using division.</p>`,
      starters: [
        hard ? `Each section is 100% ÷ ${parts}, so one section is…` : 'Each shaded section is 10%, so one section is worth…',
        `The whole bar has ${parts} sections, so the whole is…`,
        `Another way: ${part} is ${p}% of the whole, so I divide…`,
        'Both ways give…',
      ],
      minWords: 12,
      check: { prompt: `How many ${ctx.unit} are there in all?`, options: sh.options, answer: sh.answer },
      hints: [
        `The ${k} shaded sections share ${part} equally. Find what one section (${per}%) is worth.`,
        `${part} ÷ ${k} = ${m}. One section is ${m} ${ctx.unit}, and the whole bar has ${parts} sections.`,
        `Multiply ${parts} × ${m} for the whole. Division gives the same answer: ${part} ÷ ${dec(p)}.`,
      ],
      hintEs: `Las ${k} secciones sombreadas se reparten ${part} en partes iguales. Halla cuánto vale una sección (${per}%).`,
      solution: `<p><b>With the bar:</b> ${k} sections make ${part}, so one section (${per}%) is ${part} ÷ ${k} = ${m}. The whole bar is ${parts} sections: ${parts} × ${m} = <b>${whole} ${ctx.unit}</b>. <b>With division:</b> ${p}% = ${dec(p)}, and ${part} ÷ ${dec(p)} = <b>${whole}</b>. Both ways agree, because both undo "take ${p}% of the whole."</p>`,
      feedback: {
        correct: `Correct. One section, then ${parts} sections, or part ÷ percent: both reach the whole.`,
        wrong(a, d) {
          if (!d.wroteEnough) return 'Write a little more. Say what one section is worth, how many sections make the whole, and what division you could use instead.';
          const tag = (sh.options[a.check] || {}).tag;
          if (tag === 'times') return `You multiplied the whole shaded part (${part}) by ${parts}. Only <b>one</b> section gets multiplied by ${parts}: first divide ${part} by ${k}.`;
          if (tag === 'mult') return `That is ${p}% of ${part}, which is smaller than the part. The whole must be bigger than ${part}.`;
          if (tag === 'rest') return `That is only the unshaded sections. The whole is all ${parts} sections, shaded and unshaded.`;
          return `One section is ${part} ÷ ${k}, and the whole bar has ${parts} sections.`;
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
  const dec = (p) => String(round(p / 100, 4));
  const partOf = (p, n) => round((p / 100) * n, 2);
  // Smallest whole-number multiplier m so that p% of m is a whole number (works for p like 12.5 or 150).
  const stepFor = (p) => {
    for (let m = 1; m <= 400; m++) if (Math.abs((p * m) / 100 - Math.round((p * m) / 100)) < 1e-9) return m;
    return 400;
  };
  // Whole n in [lo, hi] such that p% of n is a whole number.
  const wholeFor = (r, p, lo, hi) => {
    const m = stepFor(p);
    return m * r.int(Math.ceil(lo / m), Math.max(Math.ceil(lo / m), Math.floor(hi / m)));
  };
  const nearTo = (a, b, tol) => a != null && Math.abs(a - b) < (tol || 0.006);
  const fmtN = (n) => String(round(n, 3));
  const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
  const whyOf = (options, fallback) => (ans) => (options[ans] && options[ans].why) || fallback;

  // ---------- Discount, then tax on the sale price (num, money; hard = non-benchmark percents, cents) ----------
  G.define('pc_twoStepDiscount', (r, o) => {
    const hard = !!o.hard;
    const name = r.pick(NAMES);
    const item = r.pick(ITEMS);
    const price = hard ? r.int(24, 160) : 20 * r.int(1, 7);
    const d = hard ? r.pick([15, 35, 12, 18, 45]) : r.pick([10, 15, 20, 25, 30, 40, 50]);
    const t = hard ? r.pick([6, 7, 8]) : r.pick([5, 6, 8, 10]);
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
      prompt: `<p>A ${item} costs ${hl(money(price))}. It is on sale for ${hl(d + '% off')}. Sales tax of ${hl(t + '%')} is added to the <b>sale price</b>.</p><p>How much does ${name} pay in total?${hard ? ' Round each step to the nearest cent.' : ''}</p>`,
      answer: total,
      tolerance: 0.006,
      hints: [
        'Two steps. First take the discount off the price. Then add tax to the sale price, not to the original price.',
        `Discount: ${d}% of ${money(price)} = ${dec(d)} × ${price} = ${money(disc)}. Sale price: ${money(price)} − ${money(disc)} = ${money(sale)}.`,
        `Tax: ${t}% of ${money(sale)} = ${dec(t)} × ${sale}. Round to the cent, then add it to ${money(sale)}.`,
      ],
      hintEs: 'Son dos pasos. Primero resta el descuento del precio. Después suma el impuesto al precio de oferta, no al precio original.',
      solution: `<p><b>Step 1, discount:</b> ${d}% of ${money(price)} = ${money(disc)}, so the sale price is ${money(price)} − ${money(disc)} = <b>${money(sale)}</b>. <b>Step 2, tax:</b> ${t}% of ${money(sale)} = ${money(tax)}. Total: ${money(sale)} + ${money(tax)} = <b>${money(total)}</b>. The tax is a percent of the sale price, so the two percents cannot simply be subtracted.</p>`,
      feedback: {
        correct: `Correct. ${money(sale)} after the discount, plus ${money(tax)} tax, is ${money(total)}.`,
        wrong(a, dd) {
          const v = dd.value;
          if (v == null) return `Find the sale price first (${d}% off), then add ${t}% of the sale price.`;
          if (nearTo(v, sale)) return `${money(sale)} is the sale price before tax. Add ${t}% of ${money(sale)}.`;
          if (nearTo(v, price * (1 - (d - t) / 100), 0.02))
            return `You took ${d}% − ${t}% = ${d - t}% off the original price. The tax is ${t}% of the <b>sale price</b> (${money(sale)}), which is a smaller amount.`;
          if (nearTo(v, price * (1 + t / 100), 0.02)) return `You added tax but skipped the discount. Take ${d}% off first.`;
          if (nearTo(v, disc)) return `${money(disc)} is the discount, not the price paid. Subtract it from ${money(price)}, then add tax.`;
          if (nearTo(v, price - disc - tax)) return `Tax is added, not subtracted. Add ${money(tax)} to ${money(sale)}.`;
          return `Sale price: ${money(price)} − ${money(disc)} = ${money(sale)}. Then add ${t}% of ${money(sale)}.`;
        },
      },
    };
  });

  // ---------- Percent greater than 100% on a tape diagram (tape; hard = 12.5% boxes, box size not given) ----------
  G.define('pc_percentChangeTape', (r, o) => {
    const hard = !!o.hard;
    const step = hard ? 12.5 : r.pick([20, 25]);
    const baseBoxes = 100 / step;
    const extra = hard ? r.pick([1, 3, 5]) : step === 25 ? r.pick([1, 2, 3]) : r.pick([1, 2, 3, 4]);
    const pct = 100 + extra * step;
    const newBoxes = baseBoxes + extra;
    const m = hard ? r.int(5, 16) : r.int(4, 15);
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
      prompt: `<p>The number of ${ctx.thing} ${ctx.now} is ${hl(pct + '%')} of the number ${ctx.then}. ${giveBase ? `There were ${hl(given + ' ' + ctx.unit)} ${ctx.then}.` : `There are ${hl(given + ' ' + ctx.unit)} ${ctx.now}.`}</p><p>${hard ? `In the tape diagram, 100% is ${baseBoxes} equal boxes.` : `Every box is ${step}%.`} Find the value of one box, then the number of ${ctx.unit} ${giveBase ? ctx.now : ctx.then}.</p>`,
      rows,
      fields: [
        { key: 'box', label: hard ? 'One box' : `One box (${step}%)`, answer: m },
        { key: 'target', label: targetLabel, answer: target },
      ],
      given: { rowA: given },
      hints: [
        hard
          ? `100% is ${baseBoxes} boxes, so each box is 100% ÷ ${baseBoxes} = ${step}%. Then ${pct}% is ${newBoxes} boxes. The row you know has ${givenBoxes} boxes worth ${given}.`
          : `${pct}% is more than one whole: 100% is ${baseBoxes} boxes and ${pct}% is ${newBoxes} boxes. The row you know has ${givenBoxes} boxes worth ${given}.`,
        `Divide ${given} by ${givenBoxes} to find one box.`,
        `The other row has ${targetBoxes} boxes. Multiply one box by ${targetBoxes}.`,
      ],
      hintEs: hard
        ? `El 100% son ${baseBoxes} cajas, así que cada caja es 100% ÷ ${baseBoxes} = ${step}%. Entonces el ${pct}% son ${newBoxes} cajas. La fila que conoces tiene ${givenBoxes} cajas que valen ${given}.`
        : `${pct}% es más que un entero: el 100% son ${baseBoxes} cajas y el ${pct}% son ${newBoxes} cajas. La fila que conoces tiene ${givenBoxes} cajas que valen ${given}.`,
      solution: `<p>${pct}% means ${newBoxes} boxes of ${step}%, while 100% is ${baseBoxes} boxes. The known row (${given}) has ${givenBoxes} boxes, so one box is ${given} ÷ ${givenBoxes} = <b>${m}</b>. The other row is ${targetBoxes} × ${m} = <b>${target} ${ctx.unit}</b>. A percent over 100 means more than the whole, so the ${pct}% row is the longer one.</p>${V.tape(
        rows.map((row) => ({ label: row.label, boxes: row.boxes, value: m, total: row.boxes * m })),
        { boxW: hard ? 38 : 46, labelW: 110, aria: `Tape diagram: ${baseBoxes} boxes of ${m} make ${base}; ${newBoxes} boxes of ${m} make ${now}` },
      )}`,
      feedback: {
        correct: `Correct. One box is ${m}, so ${ctx.then} = ${base} and ${ctx.now} = ${now}.`,
        wrong(a, d) {
          const box = parseNum(a.box);
          const tv = parseNum(a.target);
          if (d.wrong.includes('box')) {
            if (box != null && nearTo(box, given / targetBoxes, 0.01)) return `You divided ${given} by ${targetBoxes}, but the row worth ${given} has ${givenBoxes} boxes.`;
            if (box === step) return `${step} is the percent one box stands for. Its value in ${ctx.unit} is ${given} ÷ ${givenBoxes}.`;
            return `Use the row you know: ${givenBoxes} equal boxes make ${given}. Divide to find one box.`;
          }
          if (tv === given) return `${given} is the row you were given. Multiply one box (${m}) by the ${targetBoxes} boxes in the other row.`;
          if (giveBase && tv === partOf(pct - 100, base)) return `${partOf(pct - 100, base)} is only the extra ${pct - 100}%. ${pct}% is the whole ${base} plus that extra.`;
          if (!giveBase && nearTo(tv, partOf(pct, now))) return `You found ${pct}% of ${now}, which goes the wrong way. ${now} is already the bigger ${pct}% amount; 100% is smaller.`;
          if (!giveBase && tv != null && nearTo(tv, now - partOf(pct - 100, now)))
            return `You took ${pct - 100}% of ${now} off. But the extra ${pct - 100}% was figured on last time's amount, not on ${now}. Use the boxes.`;
          return `Your box value is right. The other row has ${targetBoxes} boxes, so multiply ${m} × ${targetBoxes}.`;
        },
      },
    };
  });

  // ---------- Order four mixed percent computations by their values (seq; hard = non-benchmark percents and eighths) ----------
  G.define('pc_threeWayOrder', (r, o) => {
    const hard = !!o.hard;
    const makeItems = () => {
      const pA = r.pick(hard ? [15, 35, 45, 65, 12.5] : [20, 25, 30, 40, 50, 60, 75]);
      const nA = wholeFor(r, pA, 20, 120);
      const fr = r.pick(
        hard
          ? [
              [3, 8],
              [5, 8],
              [7, 8],
              [2, 3],
              [5, 6],
            ]
          : [
              [1, 4],
              [3, 4],
              [2, 5],
              [3, 5],
              [1, 5],
              [3, 10],
              [7, 10],
            ],
      );
      const nF = fr[1] * r.int(3, 20);
      const pW = r.pick(hard ? [15, 35, 60, 12.5] : [20, 25, 40, 50]);
      const wholeW = wholeFor(r, pW, 20, 120);
      const partW = partOf(pW, wholeW);
      const pO = r.pick(hard ? [115, 135, 145, 160, 112.5] : [110, 120, 125, 150, 175, 200]);
      const nO = wholeFor(r, pO, 8, 60);
      return [
        { html: `<b>${pA}% of ${nA}</b>`, rate: partOf(pA, nA), text: `${pA}% of ${nA} = ${partOf(pA, nA)}`, how: `multiply ${nA} × ${dec(pA)}` },
        {
          html: `<b>${V.frac(fr[0], fr[1])} of ${nF}</b>`,
          rate: (fr[0] * nF) / fr[1],
          text: `${fr[0]}/${fr[1]} of ${nF} = ${(fr[0] * nF) / fr[1]}`,
          how: `divide ${nF} by ${fr[1]}, then multiply by ${fr[0]}`,
        },
        { html: `<b>the whole, if ${partW} is ${pW}% of it</b>`, rate: wholeW, text: `${partW} ÷ ${dec(pW)} = ${wholeW}`, how: `divide ${partW} by ${dec(pW)}` },
        { html: `<b>${pO}% of ${nO}</b>`, rate: partOf(pO, nO), text: `${pO}% of ${nO} = ${partOf(pO, nO)}`, how: `multiply ${nO} × ${dec(pO)}` },
      ];
    };
    let items = makeItems();
    for (let guard = 0; guard < 60 && new Set(items.map((i) => i.rate)).size < 4; guard++) items = makeItems();
    items = r.shuffle(items);
    const asc = r.chance(0.5);
    const order = items.map((_, i) => i).sort((x, y) => (asc ? items[x].rate - items[y].rate : items[y].rate - items[x].rate));
    return {
      type: 'seq',
      skill: 'compare-percents',
      lesson: '4-4',
      title: 'Challenge: order the amounts',
      xp: 20,
      prompt: `<p>Four lanterns in the Undercity are labeled with a calculation instead of a number. Work out each value, then order the lanterns from <b>${asc ? 'least' : 'greatest'}</b> (top) to <b>${asc ? 'greatest' : 'least'}</b> (bottom).${hard ? ' The percents are not friendly, so compute carefully.' : ''}</p>`,
      items: items.map((i) => ({ html: i.html, rate: i.rate })),
      order,
      hints: [
        'Each label hides a number. A percent or fraction <b>of</b> a number is a part (multiply). "The whole, if … is …% of it" is a missing whole (divide). A percent over 100 gives more than the number.',
        `To find each value: ${items.map((i) => i.how).join('; ')}.`,
        `Write the four values next to the lanterns. Then order them ${asc ? 'from least to greatest' : 'from greatest to least'}.`,
      ],
      hintEs:
        'Cada etiqueta esconde un número. Un porcentaje o una fracción <b>de</b> un número es una parte (multiplica). "El total, si … es el …% de él" es un total que falta (divide). Un porcentaje mayor que 100 da más que el número.',
      solution: `<p>${items.map((i) => i.text).join('; ')}. In order (${asc ? 'least to greatest' : 'greatest to least'}): <b>${order.map((i) => items[i].rate).join(', ')}</b>. Finding a part multiplies, finding a whole divides, and a percent above 100% makes the number grow.</p>`,
      feedback: {
        correct: 'Correct. Once each label becomes a number, ordering is easy.',
        wrong(ans) {
          const a = Array.isArray(ans) ? ans : [];
          if (a.length === order.length && a.every((v, i) => v === order[order.length - 1 - i])) return `Your order is reversed. The ${asc ? 'least' : 'greatest'} value goes on top.`;
          const wi = items.findIndex((it) => /the whole, if/.test(it.html));
          if (a.length === order.length && a.indexOf(wi) !== order.indexOf(wi))
            return `Check the "whole" lantern. To find a whole you divide by the percent, so the whole is bigger than the part it names.`;
          const pos = a.findIndex((v, i) => v !== order[i]);
          if (pos >= 0 && items[a[pos]]) return `Position ${pos + 1} is not right. Recompute that lantern: ${items[a[pos]].how}.`;
          return `Compute every value first, then put the ${asc ? 'least' : 'greatest'} on top.`;
        },
      },
    };
  });

  // ---------- Part / percent / whole table with one missing cell per row (table; hard = decimal and over-100 percents) ----------
  G.define('pc_tableMissing', (r, o) => {
    const hard = !!o.hard;
    const labels = r.pickN(['Lanterns lit', 'Tickets sold', 'Oil jars full', 'Seats taken', 'Pages read', 'Shots made'], 3);
    const pcts = r.pickN(hard ? [12.5, 37.5, 62.5, 2.5, 7.5, 35, 45, 65, 120, 150] : [5, 10, 15, 20, 25, 30, 40, 45, 50, 60, 75, 80], 3);
    const data = pcts.map((p, i) => {
      const whole = wholeFor(r, p, 20, 400);
      return { label: p > 100 ? labels[i].replace(/ (lit|sold|full|taken|read|made)$/, ' this year vs. last') : labels[i], p, whole, part: partOf(p, whole), missing: i };
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
      prompt: `<p>Each row of the Undercity ledger is missing one value. <b>${a.label}:</b> ${a.part} is ${a.p}% of the whole. <b>${b.label}:</b> find ${b.p}% of ${b.whole}. <b>${c.label}:</b> ${c.part} compared with ${c.whole}. Complete the table. Write the percent without the % sign.</p>`,
      rows,
      inputs,
      header: true,
      hints: [
        'Three relationships: part = percent × whole; whole = part ÷ percent; percent = part ÷ whole, written as a number out of 100.',
        `Row 1: divide ${a.part} by ${dec(a.p)}. Row 2: multiply ${dec(b.p)} × ${b.whole}.`,
        `Row 3: divide ${c.part} ÷ ${c.whole} to get a decimal. Multiply that decimal by 100 for the percent.`,
      ],
      hintEs: 'Tres relaciones: parte = porcentaje × total; total = parte ÷ porcentaje; porcentaje = parte ÷ total, escrito como un número de cada 100.',
      solution: `<p><b>${a.label}:</b> the whole is ${a.part} ÷ ${dec(a.p)} = <b>${a.whole}</b>. <b>${b.label}:</b> the part is ${dec(b.p)} × ${b.whole} = <b>${b.part}</b>. <b>${c.label}:</b> the percent is ${c.part} ÷ ${c.whole} = ${dec(c.p)} = <b>${c.p}%</b>. The same relationship, part = percent × whole, solves every row once you know which piece is missing.</p>`,
      feedback: {
        correct: 'Correct. One relationship, three different missing pieces.',
        wrong(ans, d) {
          const bad = d.wrong[0];
          const i = Number(bad.slice(1));
          const row = data[i];
          const v = parseNum(ans[bad]);
          if (bad[0] === 'w') {
            if (nearTo(v, partOf(row.p, row.part))) return `${row.label}: you multiplied, which finds ${row.p}% of ${row.part}. To find the whole, divide: ${row.part} ÷ ${dec(row.p)}.`;
            return `${row.label}: the part (${row.part}) and percent (${row.p}%) are known. Whole = part ÷ percent.`;
          }
          if (bad[0] === 'p') {
            if (nearTo(v, row.whole / (row.p / 100))) return `${row.label}: you divided. The whole (${row.whole}) is known, so the part is ${row.p}% of it: multiply by ${dec(row.p)}.`;
            return `${row.label}: the whole (${row.whole}) is known. Part = ${dec(row.p)} × ${row.whole}.`;
          }
          if (nearTo(v, round(row.part / row.whole, 4), 0.0001)) return `${row.label}: ${fmtN(row.part / row.whole)} is the decimal. A percent is out of 100, so multiply by 100.`;
          if (nearTo(v, row.whole - row.part)) return `${row.label}: ${row.whole - row.part} is a difference, not a percent. Find ${row.part} out of ${row.whole} as a number out of 100.`;
          if (nearTo(v, (row.whole / row.part) * 100, 0.01)) return `${row.label}: you divided the whole by the part. Percent = part ÷ whole, then × 100.`;
          return `${row.label}: percent = part ÷ whole = ${row.part} ÷ ${row.whole}, then write the decimal as hundredths.`;
        },
      },
    };
  });

  // ---------- Double number line with two unknowns: another percent and the whole (dnl; hard = non-benchmark percents) ----------
  G.define('pc_wholeFromTwo', (r, o) => {
    const hard = !!o.hard;
    const whole = hard ? 40 * r.int(1, 10) : 20 * r.int(2, 15);
    const [a, b] = r.pickN(hard ? [15, 35, 45, 65, 85, 12.5, 37.5, 62.5] : [10, 20, 25, 30, 40, 50, 60, 75], 2).sort((x, y) => x - y);
    const partA = partOf(a, whole);
    const partB = partOf(b, whole);
    const onePct = round(whole / 100, 2);
    const ctx = r.pick([
      { thing: 'ember crystals in the vault', unit: 'crystals' },
      { thing: 'steps on the Undercity stair', unit: 'steps' },
      { thing: 'lanterns in the tunnel', unit: 'lanterns' },
      { thing: 'coins in the Keeper’s chest', unit: 'coins' },
    ]);
    const label = cap(ctx.unit);
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
        `The ticks are not equal jumps, so use 1% as a stepping stone. ${a}% is ${partA}, so 1% is ${partA} ÷ ${a}.`,
        `1% = ${onePct}. The whole is 100 times 1%.`,
        `Multiply 1% (${onePct}) by 100 for the whole and by ${b} for ${b}%.`,
      ],
      hintEs: `Las marcas no tienen saltos iguales, así que usa el 1% como paso intermedio. El ${a}% es ${partA}, así que el 1% es ${partA} ÷ ${a}.`,
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
          if (d.wrong.includes(1) && nearTo(vW, partA + (100 - a))) return `You added ${100 - a} to ${partA}. Percents and amounts do not grow by the same number. Find 1% first.`;
          if (!d.wrong.includes(1) && d.wrong.includes(0) && nearTo(vB, partA + (b - a)))
            return `You added ${b - a} to ${partA}, but percents and amounts do not grow by the same number. Use 1% × ${b}.`;
          if (!d.wrong.includes(1)) return `Your whole is right. ${b}% of ${whole} = ${dec(b)} × ${whole}.`;
          return `Find 1% first: ${partA} ÷ ${a}. Then multiply by 100 for the whole and by ${b} for ${b}%.`;
        },
      },
    };
  });

  // ---------- Error: wrong percent used to find a whole (error; hard = total that already includes tax) ----------
  G.define('pc_errorWhole', (r, o) => {
    const hard = !!o.hard;
    const name = r.pick(NAMES);
    const item = r.pick(ITEMS);
    if (hard) {
      const t = r.pick([5, 6, 8, 10]);
      const price = 10 * r.int(2, 12);
      const total = partOf(100 + t, price);
      const taxOnTotal = partOf(t, total);
      const wrongAns = round(total - taxOnTotal, 2);
      const dT = dec(100 + t);
      const opts = [
        { html: `${name} took ${t}% of the total off. The tax was ${t}% of the <b>price</b>, so the total is ${100 + t}% of the price. Divide by ${dT}.`, ok: true },
        {
          html: `${name} should have subtracted ${money(t)} from ${money(total)}, because the tax rate is ${t}%.`,
          why: `${t}% is not ${t} dollars. The tax is ${t}% of the price, so it depends on the price.`,
        },
        {
          html: `${name} should have divided ${money(total)} by ${dec(t)} to undo the ${t}% tax that was added.`,
          why: `${money(total)} ÷ ${dec(t)} is far bigger than the total. The total is ${100 + t}% of the price, not ${t}%.`,
        },
        {
          html: `There is no mistake. Taking ${t}% off the total always undoes adding ${t}% tax.`,
          why: `Check it: ${t}% tax on ${money(wrongAns)} gives ${money(round(wrongAns + partOf(t, wrongAns), 2))}, not ${money(total)}. Taking a percent off a bigger number removes too much.`,
        },
      ];
      const sh = shuffleOptions(r, opts, 0);
      return {
        type: 'error',
        skill: 'percent-problems',
        lesson: '4-5',
        title: 'Challenge: find the mistake',
        xp: 20,
        prompt: `<p>${name} paid ${hl(money(total))} for a ${item}. That total includes ${hl(t + '%')} sales tax. ${name} tries to find the price before tax. What is the mistake?</p>`,
        work: `${t}% of ${money(total)} ≈ ${money(taxOnTotal)} &nbsp;&nbsp; ${money(total)} − ${money(taxOnTotal)} = ${money(wrongAns)} &nbsp;&nbsp; "The price was ${money(wrongAns)}."`,
        options: sh.options,
        answer: sh.answer,
        fix: { label: 'Price before tax ($):', answer: price },
        hints: [
          `The tax was figured on the price, not on the total. The price is 100%, so the total is 100% + ${t}% = ${100 + t}% of the price.`,
          `Whole = part ÷ percent. The total is the part here: ${money(total)} ÷ ${dT}.`,
          `Divide ${money(total)} by ${dT}. Check: ${t}% tax on your answer should bring it back to ${money(total)}.`,
        ],
        hintEs: `El impuesto se calculó sobre el precio, no sobre el total. El precio es el 100%, así que el total es 100% + ${t}% = ${100 + t}% del precio.`,
        solution: `<p>The total is ${100 + t}% of the price, because ${t}% tax was added to 100% of the price. Price = ${money(total)} ÷ ${dT} = <b>${money(price)}</b>. Check: ${t}% of ${money(price)} is ${money(partOf(t, price))}, and ${money(price)} + ${money(partOf(t, price))} = ${money(total)}. ${name} took ${t}% of the bigger number (the total), which removes too much.</p>`,
        feedback: {
          correct: `Correct. The total is ${100 + t}% of the price, so ${money(total)} ÷ ${dT} = ${money(price)}.`,
          wrong(a, dd) {
            if (!dd.mistakeOk) return `Test ${name}'s answer: add ${t}% tax to ${money(wrongAns)}. Do you get back ${money(total)}?`;
            const v = parseNum(a.fix);
            if (nearTo(v, wrongAns)) return `${money(wrongAns)} is ${name}'s answer. Divide ${money(total)} by ${dT} instead.`;
            if (nearTo(v, total - t)) return `You subtracted ${t} dollars. Divide ${money(total)} by ${dT}.`;
            return `You found the mistake. Now divide ${money(total)} by ${dT}.`;
          },
        },
      };
    }
    const d = r.pick([20, 25, 40, 60, 75]);
    const price = 20 * r.int(1, 8);
    const sale = partOf(100 - d, price);
    const wrongAns = round(sale / (d / 100), 2);
    const opts = [
      { html: `${name} divided by the discount percent. ${money(sale)} is the price <b>after</b> ${d}% was taken off, so it is ${100 - d}% of the original. Divide by ${dec(100 - d)}.`, ok: true },
      {
        html: `${name} should have multiplied ${money(sale)} by ${dec(d)}.`,
        why: `${dec(d)} × ${sale} = ${money(partOf(d, sale))} is ${d}% of the sale price. That is not the discount (which was ${d}% of the original) and not the original price.`,
      },
      {
        html: `${name} should have added ${d}% of ${money(sale)} to ${money(sale)}.`,
        why: `The discount was ${d}% of the <b>original</b> price, not of the sale price, so adding ${d}% of ${money(sale)} gives too little: ${money(round(sale + partOf(d, sale), 2))}.`,
      },
      {
        html: `There is no mistake. The original price was ${money(wrongAns)}.`,
        why: `Check it: ${d}% off ${money(wrongAns)} leaves ${money(round(wrongAns * (1 - d / 100), 2))}, not ${money(sale)}. The method is wrong.`,
      },
    ];
    const sh = shuffleOptions(r, opts, 0);
    return {
      type: 'error',
      skill: 'percent-problems',
      lesson: '4-5',
      title: 'Challenge: find the mistake',
      xp: 20,
      prompt: `<p>A ${item} is ${hl(d + '% off')}. The sale price is ${hl(money(sale))}. ${name} tries to find the original price. What is the mistake?</p>`,
      work: `${d}% = ${dec(d)} &nbsp;&nbsp; ${sale} ÷ ${dec(d)} ${Math.abs(sale / (d / 100) - wrongAns) < 1e-9 ? '=' : '≈'} ${wrongAns} &nbsp;&nbsp; "The original price was ${money(wrongAns)}."`,
      options: sh.options,
      answer: sh.answer,
      fix: { label: 'Original price ($):', answer: price },
      hints: [
        `What percent of the original price did the shopper pay? The discount took ${d}% off, so 100% − ${d}% is left.`,
        `The sale price is ${100 - d}% of the original. Whole = part ÷ percent: ${money(sale)} ÷ ${dec(100 - d)}.`,
        `Divide ${sale} by ${dec(100 - d)}. Check: ${d}% off your answer should leave ${money(sale)}.`,
      ],
      hintEs: `¿Qué porcentaje del precio original pagó el cliente? El descuento quitó el ${d}%, así que queda 100% − ${d}%.`,
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

  // ---------- Two restaurants: bill plus tax and tip, which total is more? (tf; hard = close totals, odd tips) ----------
  G.define('pc_tipTax', (r, o) => {
    const hard = !!o.hard;
    const [nameA, nameB, judge] = r.pickN(NAMES, 3);
    const [placeA, placeB] = r.pickN(['the Harbor Café', 'the Spire Grill', 'the Ember Kitchen', 'the Night Market Noodle Bar'], 2);
    const tax = hard ? r.pick([6, 7, 8]) : r.pick([5, 6, 8]);
    let billA, billB, tipA, tipB, totA, totB;
    do {
      billA = hard ? r.int(18, 75) : 4 * r.int(5, 20);
      billB = hard ? r.int(18, 75) : 4 * r.int(5, 20);
      tipA = r.pick(hard ? [12, 15, 18, 22, 25] : [10, 15, 20, 25]);
      tipB = r.pick(hard ? [12, 15, 18, 22, 25] : [10, 15, 20, 25]);
      totA = round(billA * (1 + (tax + tipA) / 100), 2);
      totB = round(billB * (1 + (tax + tipB) / 100), 2);
    } while (tipA === tipB || billA === billB || billA > billB === tipA > tipB || Math.abs(totA - totB) < (hard ? 0.1 : 0.5) || (hard && Math.abs(totA - totB) > 3));
    const claimA = r.chance(0.5);
    const truth = claimA ? totA > totB : totB > totA;
    const pA = 100 + tax + tipA;
    const pB = 100 + tax + tipB;
    const reasons = r.shuffle([
      {
        html: `${nameA} pays ${pA}% of ${money(billA)} = ${money(totA)}. ${nameB} pays ${pB}% of ${money(billB)} = ${money(totB)}. ${money(totA)} is ${totA > totB ? 'more' : 'less'} than ${money(totB)}.`,
        correct: true,
      },
      {
        html: `${nameA} pays ${pA}% of ${money(billA)} = ${money(totA)}. ${nameB} pays ${pB}% of ${money(billB)} = ${money(totB)}. ${money(totA)} is ${totA > totB ? 'less' : 'more'} than ${money(totB)}.`,
        correct: false,
      },
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
        `${nameA}: 100% + ${tax}% + ${tipA}% = ${pA}% of ${money(billA)}. Multiply ${dec(pA)} × ${billA}.`,
        `${nameB}: ${pB}% of ${money(billB)}. Multiply ${dec(pB)} × ${billB}, then compare the two totals.`,
      ],
      hintEs: 'El impuesto y la propina se suman a la cuenta. Junto con la cuenta (100%), el total es más del 100% de la cuenta.',
      solution: `<p>${nameA} pays ${pA}% of ${money(billA)} = <b>${money(totA)}</b>. ${nameB} pays ${pB}% of ${money(billB)} = <b>${money(totB)}</b>. ${totA > totB ? nameA : nameB} pays more, so ${judge}'s claim is <b>${truth ? 'true' : 'false'}</b>. A bigger bill or a bigger tip percent alone does not decide it; the totals do.</p>`,
      feedback: {
        correct: `Correct. ${money(totA)} versus ${money(totB)} settles it.`,
        wrong(a, d) {
          if (!d.valueOk) return `Find both totals. Each total is (100 + ${tax} + tip)% of the bill. Then compare them${hard ? '; they are close, so keep the cents' : ''}.`;
          return 'Your true/false is right, but the reason must compare the two totals in dollars. A bigger bill or a bigger tip percent alone does not decide it.';
        },
      },
    };
  });

  // ---------- Survey: find the percent given the part and the whole (who; hard = eighths and non-friendly wholes) ----------
  G.define('pc_whoSurvey', (r, o) => {
    const hard = !!o.hard;
    const [a, b, c, e] = r.pickN(NAMES, 4);
    const whole = r.pick(hard ? [8, 16, 40, 80, 125, 250] : [20, 25, 40, 50, 200, 300, 400]);
    const step = hard ? 1 : { 20: 1, 25: 1, 40: 2, 50: 1, 200: 2, 300: 3, 400: 4 }[whole];
    let part;
    do part = step * r.int(Math.max(1, Math.ceil(whole / step / 10)), Math.floor((whole / step) * 0.9));
    while (part * 100 === whole * 50 || part === whole || (hard && Number.isInteger((part * 100) / whole) && whole <= 16));
    const pct = round((part * 100) / whole, 2);
    const d = round(part / whole, 4);
    const flip = round((whole / part) * 100, 1);
    const ctx = r.pick([
      { who: 'students surveyed', chose: 'chose the lantern boat ride', unit: 'students' },
      { who: 'lanterns checked', chose: 'needed new wicks', unit: 'lanterns' },
      { who: 'free throws', chose: 'went in', unit: 'shots' },
      { who: 'festival visitors asked', chose: 'came from the harbor district', unit: 'visitors' },
    ]);
    const scale = 100 / whole;
    const aWork =
      whole <= 50
        ? `"${part} out of ${whole}. ${whole} × ${scale} = 100, so ${part} × ${scale} = ${pct}. That is <b>${pct}%</b>."`
        : whole % 100 === 0
          ? `"${part} out of ${whole}. ${whole} ÷ ${whole / 100} = 100, so ${part} ÷ ${whole / 100} = ${pct}. That is <b>${pct}%</b>."`
          : `"${part} ÷ ${whole} = ${d}, which is ${pct} hundredths. That is <b>${pct}%</b>."`;
    const opts = [
      { title: a, html: aWork, ok: true },
      {
        title: b,
        html: `"The part is ${part}, and a percent is just the part, so ${part} out of ${whole} is <b>${part}%</b>."`,
        why: `${b} used the part as the percent. A percent is out of 100, and ${whole} is not 100. ${part} out of ${whole} is ${pct} out of 100.`,
      },
      {
        title: c,
        html: `"I divide the part by the whole, ${part} ÷ ${whole} = ${d}, and that decimal is the answer: <b>${d}%</b>."`,
        why: `${c} found the decimal ${d} but forgot to change it to a percent. ${d} is ${pct} hundredths, which is ${pct}%.`,
      },
      {
        title: e,
        html: `"I divide the whole by the part, ${whole} ÷ ${part}, then multiply by 100 to get <b>${flip}%</b>."`,
        why: `${e} divided the whole by the part, which is upside down. Percent = part ÷ whole × 100. A part smaller than the whole gives less than 100%.`,
      },
    ];
    const sh = shuffleOptions(r, opts, 0);
    return {
      type: 'who',
      skill: 'fdp-convert',
      lesson: '4-2',
      title: 'Challenge: what percent?',
      xp: 20,
      prompt: `<p>Of ${hl(whole + ' ' + ctx.who)}, ${hl(part)} ${ctx.chose}. Four students find what percent that is. Who is correct?</p>`,
      options: sh.options,
      answer: sh.answer,
      layout: 'cards',
      hints: [
        `Here the part (${part}) and the whole (${whole}) are known. The percent is missing: how many out of <b>100</b>?`,
        whole <= 50
          ? `Make an equivalent fraction with denominator 100: multiply ${part} and ${whole} by ${scale}.`
          : whole % 100 === 0
            ? `Make an equivalent fraction with denominator 100: divide ${part} and ${whole} by ${whole / 100}.`
            : `Divide the part by the whole to get a decimal, then write that decimal as hundredths.`,
        `Divide ${part} ÷ ${whole}, then multiply the decimal by 100. Which student did that?`,
      ],
      hintEs: `Aquí conoces la parte (${part}) y el total (${whole}). Falta el porcentaje: ¿cuántos de cada <b>100</b>?`,
      solution: `<p><b>${a}</b> is correct: ${part}/${whole} = ${pct}/100 = <b>${pct}%</b>. ${b} used the part as the percent, but the whole is ${whole}, not 100. ${c} stopped at the decimal ${d}; a percent is hundredths, so ${d} = ${pct}%. ${e} divided the whole by the part, which turns the fraction upside down.</p>`,
      feedback: { correct: `Correct. ${part} out of ${whole} is ${pct} out of 100, which is ${pct}%.`, wrong: whyOf(sh.options, 'Percent = part ÷ whole, written as hundredths.') },
    };
  });
})(typeof window !== 'undefined' ? window : globalThis);
