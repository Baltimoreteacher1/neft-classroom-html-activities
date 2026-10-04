/* js/units/u9/gen-variables.js */
/* Zone 1 — Signal Depot. Lesson 9-1 Explore Relationships Between Two Variables (Independent and Dependent Variables · Tables of Values). */
(function (root) {
  'use strict';
  const RX = root.RX;
  const { G, V, shuffleOptions, NAMES, parseNum } = RX;
  const { CTX, eq, yWord, yWordEs, rows, ruleWords } = RX.U9;
  const hl = V.hl;
  const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
  const story = (c, n, k, b) => (b ? c.aff(n, k, b) : c.prop(n, k));
  /** Expression text for substituting x into y = kx + b, e.g. "3 × 4 + 2". */
  const subst = (k, b, x) => `${k === 1 ? x : k + ' × ' + x}${b ? ' + ' + b : ''}`;
  const tbl = (rs) => V.table(rs, { header: false, rowHeader: true, cls: 'compact' });
  /** Keep the first option, then only options whose text is new. */
  const dedupe = (opts) => {
    const seen = new Set();
    return opts.filter((op) => {
      const t = String(op.html).replace(/<[^>]+>/g, '').trim();
      if (seen.has(t)) return false;
      seen.add(t);
      return true;
    });
  };

  // ---------- Identify independent and dependent (cloze; hard adds fixed amounts as decoys) ----------
  G.define('v1_identifyCloze', (r, o) => {
    const hard = !!o.hard;
    const c = r.pick(CTX),
      n = r.pick(NAMES);
    const k = hard ? r.int(4, 9) : r.int(2, 6);
    const b = hard ? r.int(3, 12) : r.chance(0.5) ? r.int(1, 5) : 0;
    const rateWord = `rate of ${yWord(c, k)} per ${c.one}`;
    const startWord = `starting amount of ${yWord(c, b)}`;
    const pool = hard ? [c.xw, c.yw, rateWord, startWord] : [c.xw, c.yw];
    const choices = r.shuffle(pool);
    const choices2 = r.shuffle(pool);
    const picked = (ans, i) => (Array.isArray(ans) ? [choices, choices2][i][ans[i]] : undefined);
    return {
      type: 'cloze',
      skill: 'ind-dep',
      lesson: '9-1',
      title: 'Which variable is which?',
      prompt: `<p>${story(c, n, k, b)}</p><p>Complete the sentences.</p>`,
      template: 'The independent variable is the {0}. The dependent variable is the {1}.',
      choices: [choices, choices2],
      answers: [choices.indexOf(c.xw), choices2.indexOf(c.yw)],
      hints: [
        'The independent variable is the quantity you choose or control. The dependent variable responds to that choice.' + (hard ? ' A fixed amount, like a rate, is not a variable at all.' : ''),
        `Ask: does the ${c.yw} depend on the ${c.xw}, or does the ${c.xw} depend on the ${c.yw}?`,
        `${cap(n)} decides the ${c.xw}. The ${c.yw} changes because of it, so the ${c.yw} depends on the ${c.xw}.`,
      ],
      hintEs:
        'La variable independiente es la cantidad que tú eliges o controlas. La variable dependiente responde a esa elección.' + (hard ? ' Una cantidad fija, como una tasa, no es una variable.' : ''),
      solution: `<p>The <b>${c.xw}</b> is independent: it is the input you pick. The <b>${c.yw}</b> is dependent: it is the output that responds. Change the ${c.xw} and the ${c.yw} changes.${
        hard ? ` The ${rateWord} and the ${startWord} never change, so they are constants, not variables.` : ''
      }</p>`,
      feedback: {
        correct: 'Correct. Independent = the quantity you choose. Dependent = the quantity that responds.',
        wrong(ans, d) {
          const p0 = picked(ans, 0),
            p1 = picked(ans, 1);
          if (p0 === c.yw && p1 === c.xw) return `You swapped them. The ${c.yw} depends on the ${c.xw}, so the ${c.xw} is independent.`;
          const bad = d.wrong.includes(0) ? p0 : p1;
          if (bad === rateWord) return `The ${rateWord} stays the same for every ${c.one}. It is a constant, not a variable. A variable is a quantity that changes.`;
          if (bad === startWord) return `The ${startWord} is added once and never changes. It is a constant, not a variable.`;
          return d.wrong[0] === 0
            ? `Look at the first blank. Which quantity does ${n} choose? That one is independent.`
            : 'Look at the second blank. Which quantity changes as a result of the choice? That one is dependent.';
        },
      },
    };
  });

  // ---------- Sort quantities into independent / dependent (sort; hard: four routes, pairs not listed) ----------
  G.define('v1_sortVars', (r, o) => {
    const hard = !!o.hard;
    const cs = r.pickN(CTX, hard ? 4 : 3);
    const items = [];
    cs.forEach((c) => {
      items.push({ html: cap(c.xw), bin: 0 });
      items.push({ html: cap(c.yw), bin: 1 });
    });
    const shuffled = r.shuffle(items);
    const pairs = cs.map((c) => `the ${c.yw} and the ${c.xw}`).join('; ');
    const ctxOf = (it) => cs.find((c) => cap(c.xw) === it.html || cap(c.yw) === it.html);
    return {
      type: 'sort',
      skill: 'ind-dep',
      lesson: '9-1',
      title: 'Sort the variables',
      prompt: hard
        ? '<p>Four sky-tram routes each connect two quantities, but the storm mixed all eight quantities together.</p><p>Sort each quantity. Is it an <b>independent</b> variable (one you choose) or a <b>dependent</b> variable (one that responds)?</p>'
        : `<p>Three sky-tram routes each connect two quantities: ${pairs}.</p><p>Sort each quantity. Is it the <b>independent</b> variable (the one you choose) or the <b>dependent</b> variable (the one that responds)?</p>`,
      bins: ['Independent variable', 'Dependent variable'],
      items: shuffled,
      hints: [
        hard
          ? 'First pair up the quantities that belong to the same route. Then, in each pair, ask which quantity you would decide first. That one is independent.'
          : 'For each pair, ask which quantity you would decide first. That one is independent.',
        `For example, the ${cs[0].yw} depends on the ${cs[0].xw}. You choose the ${cs[0].xw}; the ${cs[0].yw} follows.`,
        `Counts of ${cs.map((c) => c.many).join(', ')} are chosen. The amounts that result from them are dependent.`,
      ],
      hintEs: hard
        ? 'Primero junta las cantidades que son de la misma ruta. Luego, en cada pareja, pregúntate qué cantidad decidirías primero. Esa es la variable independiente.'
        : 'En cada pareja, pregúntate qué cantidad decidirías primero. Esa es la variable independiente.',
      solution: `<p>Independent: ${cs.map((c) => c.xw).join(', ')}. Dependent: ${cs.map((c) => c.yw).join(', ')}. In each pair, the second quantity is calculated from the first, so it depends on it.</p>`,
      feedback: {
        correct: 'Correct. The quantity you choose is independent; the quantity that is calculated from it is dependent.',
        wrong(ans, d) {
          if (d.wrong.length === shuffled.length) return 'You flipped every quantity. The counts you choose (stops, towers, hours, and so on) are independent; the totals that result from them are dependent.';
          const it = shuffled[d.wrong[0]],
            c = ctxOf(it);
          return it.bin === 0
            ? `"${RX.esc(it.html)}" is something you choose. The ${c.yw} is calculated from it, so "${RX.esc(it.html)}" is independent.`
            : `"${RX.esc(it.html)}" is calculated from the ${c.xw}, so it depends on it. It is dependent.`;
        },
      },
    };
  });

  // ---------- Who is correct about the dependent variable (who; hard: dependent row shown on top) ----------
  G.define('v1_whoDepends', (r, o) => {
    const hard = !!o.hard;
    const c = r.pick(CTX),
      [n0, n1, n2, n3] = r.pickN(NAMES, 4);
    const k = hard ? r.int(4, 9) : r.int(2, 5);
    const b = hard ? r.int(3, 12) : r.chance(0.5) ? r.int(1, 4) : 0;
    const t = rows(c, k, b, [1, 2, 3]);
    const shown = hard ? [t[1], t[0]] : t;
    const sh = shuffleOptions(
      r,
      [
        { title: n1, html: `The ${c.yw} is the dependent variable, because it changes when the ${c.xw} changes.`, ok: true },
        hard
          ? {
              title: n2,
              html: `The ${c.yw} is the independent variable, because it is the top row of this table of values.`,
              why: `Which row is on top does not decide anything; this table just lists the ${c.yw} first. The ${c.yw} is still calculated from the ${c.xw}, so it is dependent.`,
            }
          : {
              title: n2,
              html: `The ${c.xw} is the dependent variable, because it is the row listed first in the table of values.`,
              why: `Being listed first does not make a variable dependent. The ${c.xw} is listed first because it is the input you choose, which makes it independent.`,
            },
        {
          title: n3,
          html: `The ${c.yw} is the dependent variable, because its numbers are always larger than the numbers for the ${c.xw}.`,
          why: `${n3} names the right variable for the wrong reason. Size does not decide it: the ${c.yw} is dependent because it is calculated from the ${c.xw}.`,
        },
      ],
      0,
    );
    return {
      type: 'who',
      skill: 'ind-dep',
      lesson: '9-1',
      title: 'Who is correct?',
      prompt: `<p>${story(c, n0, k, b)}</p>${tbl(shown)}<p>${n1}, ${n2}, and ${n3} disagree about the dependent variable. Whose statement and reason are both correct?</p>`,
      options: sh.options,
      answer: sh.answer,
      hints: [
        'A dependent variable responds to another variable. It is the result.' + (hard ? ' Decide by what is calculated from what, not by the order of the rows.' : ''),
        `Which quantity is calculated from the other: the ${c.yw} or the ${c.xw}?`,
        `The ${c.yw} is found by using the ${c.xw}. Now check each reason, not just each answer.`,
      ],
      hintEs: 'Una variable dependiente responde a otra variable. Es el resultado.' + (hard ? ' Decide según qué cantidad se calcula a partir de la otra, no según el orden de las filas.' : ''),
      solution: `<p><b>${n1}</b> is correct. The ${c.yw} depends on the ${c.xw}: it changes when the ${c.xw} changes. The order of the rows in a table and the size of the numbers do not decide which variable is dependent.</p>`,
      feedback: {
        correct: 'Correct. Dependent means "responds to," not "comes first" or "has bigger numbers."',
        wrong(ans) {
          return (sh.options[ans] && sh.options[ans].why) || 'Ask which quantity is calculated from the other one.';
        },
      },
    };
  });

  // ---------- True/false about the dependent variable with a reason (tf; hard: "A depends on B" wording) ----------
  G.define('v1_tfDependent', (r, o) => {
    const hard = !!o.hard;
    const c = r.pick(CTX),
      n = r.pick(NAMES);
    const k = hard ? r.int(4, 9) : r.int(2, 5);
    const b = hard ? r.int(3, 12) : r.chance(0.5) ? r.int(1, 4) : 0;
    let truth, statement, reasons;
    if (hard) {
      const flip = r.chance(0.5);
      const A = flip ? c.xw : c.yw,
        B = flip ? c.yw : c.xw;
      truth = !flip;
      statement = `The ${A} depends on the ${B}.`;
      reasons = r.shuffle([
        { html: `True. The ${c.yw} is calculated from the ${c.xw}, so it depends on the ${c.xw}.`, correct: truth },
        { html: `False. It is the other way around: ${n} chooses the ${c.xw}, and the ${c.yw} depends on it.`, correct: !truth },
        { html: `True. The ${A} is named first in the sentence, so it is the one that depends.`, correct: false },
        { html: 'False. Two quantities that change together cannot depend on each other.', correct: false },
      ]);
    } else {
      truth = r.chance(0.5);
      const claimed = truth ? c.yw : c.xw;
      statement = `The ${claimed} is the dependent variable.`;
      reasons = r.shuffle([
        { html: `True. The ${c.yw} is calculated from the ${c.xw}, so it depends on it.`, correct: truth },
        { html: `False. The ${c.xw} is the quantity ${n} chooses, so it is independent, not dependent.`, correct: !truth },
        { html: 'True. It has the bigger numbers in the table.', correct: false },
        { html: 'False. Both quantities change, so both are independent.', correct: false },
      ]);
    }
    return {
      type: 'tf',
      skill: 'ind-dep',
      lesson: '9-1',
      title: 'Dependent or not?',
      prompt: `<p>${story(c, n, k, b)}</p><p>True or false: <b>${statement}</b></p>`,
      statement,
      answer: truth,
      reasons,
      hints: [
        'The dependent variable is the output: the quantity that responds to the other one.',
        `Which quantity does ${n} control: the ${c.xw} or the ${c.yw}?`,
        `${cap(c.xw)} is chosen (independent). ${cap(c.yw)} is the result (dependent). Now check the statement word by word.`,
      ],
      hintEs: 'La variable dependiente es la salida: la cantidad que responde a la otra.',
      solution: truth
        ? `<p><b>True.</b> The ${c.yw} depends on the ${c.xw}: ${n} chooses the ${c.xw}, and the ${c.yw} is calculated from it. Word order and the size of the numbers have nothing to do with it.</p>`
        : `<p><b>False.</b> The ${c.xw} is independent because ${n} chooses it. The ${c.yw} is the dependent variable, because it responds to that choice.</p>`,
      feedback: {
        correct: 'Correct, with the right reason. Dependent is about responding, not about word order or the size of the numbers.',
        wrong(ans, d) {
          const pick = reasons[ans && ans.reason];
          if (!d.valueOk) return `Think about which quantity responds. The ${c.yw} is found from the ${c.xw}, not the other way around. Then reread the statement.`;
          if (pick && /bigger numbers/.test(pick.html)) return 'Your true/false choice is right, but the size of the numbers never decides which variable is dependent. Pick the reason about which quantity responds.';
          if (pick && /named first/.test(pick.html)) return 'Your true/false choice is right, but word order does not decide anything. Pick the reason about which quantity is calculated from the other.';
          return 'Your true/false choice is right, but pick the reason that talks about which quantity responds to the other.';
        },
      },
    };
  });

  // ---------- Complete a table from a rule (table; hard: bigger rule, skipping x-values) ----------
  G.define('v1_tableRule', (r, o) => {
    const hard = !!o.hard;
    const k = hard ? r.int(3, 9) : r.int(2, 5);
    const kind = r.pick(['mult', 'add', 'both']);
    const b = kind === 'mult' ? 0 : hard ? r.int(4, 12) : r.int(1, 6);
    const kk = kind === 'add' ? 1 : k;
    const xs = hard ? r.pickN([2, 5, 7, 9, 10, 12], 4).sort((a, z) => a - z) : [1, 2, 3, 4];
    const E = eq(kk, b);
    const rowsT = [
      ['x', ...xs.map(String)],
      ['y', ...xs.map((x, i) => (i === 0 ? String(kk * x + b) : `__IN:y${x}__`))],
    ];
    return {
      type: 'table',
      skill: 'table-values',
      lesson: '9-1',
      title: 'Complete the table of values',
      prompt: `<p>A route rule says: <b>${E}</b>. In words: ${ruleWords(kk, b)}.</p><p>Complete the table of values.</p>`,
      rows: rowsT,
      inputs: xs.slice(1).map((x) => ({ id: 'y' + x, answer: kk * x + b })),
      rowHeader: true,
      hints: [
        `Substitute each x-value into the rule ${E} to find its y-value.` + (hard ? ' The x-values skip, so calculate each one.' : ''),
        `The first column shows x = ${xs[0]}: ${subst(kk, b, xs[0])} = ${kk * xs[0] + b}. Do the same for x = ${xs[1]}.`,
        `x = ${xs[1]}: ${subst(kk, b, xs[1])}. Then repeat for ${xs[2]} and ${xs[3]}.${hard ? ` Do not just add ${kk} from one column to the next.` : ''}`,
      ],
      hintEs: `Sustituye cada valor de x en la regla ${E} para hallar su valor de y.` + (hard ? ' Los valores de x saltan, así que calcula cada uno.' : ''),
      solution: `<p>Substitute each x into ${E}: ${xs.map((x) => `x = ${x} → y = <b>${kk * x + b}</b>`).join('; ')}. Every y-value comes from the same rule.</p>`,
      feedback: {
        correct: `Correct. Every column follows the rule ${E}.`,
        wrong(ans, d) {
          const id = d.wrong[0],
            x = Number(id.slice(1)),
            v = parseNum(ans[id]),
            i = xs.indexOf(x);
          if (b && kk > 1 && v === kk * x) return `For x = ${x}, you multiplied but forgot to add ${b}. The rule has two steps.`;
          if (kk > 1 && v === x + kk + b) return `For x = ${x}, you added ${kk} instead of multiplying by ${kk}. "${kk}x" means ${kk} times x.`;
          if (i > 0 && v === kk * xs[i - 1] + b + kk && xs[i] - xs[i - 1] > 1) return `For x = ${x}, you added ${kk} to the column before. But x jumped from ${xs[i - 1]} to ${x}, so substitute ${x} into the rule.`;
          return `For x = ${x}, substitute into ${E}: ${subst(kk, b, x)}. Multiply before you add.`;
        },
      },
    };
  });

  // ---------- Complete a table from a story (table; hard: bigger numbers, skipping inputs) ----------
  G.define('v1_tableStory', (r, o) => {
    const hard = !!o.hard;
    const c = r.pick(CTX),
      n = r.pick(NAMES);
    const k = hard ? r.int(3, 9) : r.int(2, 5);
    const b = hard ? r.int(4, 15) : r.chance(0.6) ? r.int(1, 5) : 0;
    const xs = hard
      ? r.pick([
          [0, 3, 5, 8],
          [2, 5, 7, 10],
          [1, 4, 6, 9],
        ])
      : [1, 2, 3, 4];
    const rowsT = [
      [c.xLabel, ...xs.map(String)],
      [c.yLabel, ...xs.map((x, i) => (i === 0 ? String(k * x + b) : `__IN:y${x}__`))],
    ];
    return {
      type: 'table',
      skill: 'table-values',
      lesson: '9-1',
      title: 'Build the table from the story',
      prompt: `<p>${story(c, n, k, b)}</p><p>Complete the table. The first column is done for you.</p>`,
      rows: rowsT,
      inputs: xs.slice(1).map((x) => ({ id: 'y' + x, answer: k * x + b })),
      rowHeader: true,
      hints: [
        b ? `Each ${c.one} adds ${k}. The starting ${b} is added only once, no matter how many ${c.many}.` : `Each ${c.one} adds ${k}. Multiply the number of ${c.many} by ${k}.`,
        `Check the first column: ${xs[0]} ${xs[0] === 1 ? c.one : c.many} → ${subst(k, b, xs[0])} = ${k * xs[0] + b}.`,
        `For ${xs[1]} ${c.many}: ${subst(k, b, xs[1])}. Use the same steps for ${xs[2]} and ${xs[3]}.${hard ? ' The columns skip, so do not just add ' + k + '.' : ''}`,
      ],
      hintEs: b
        ? `Cada ${c.oneEs} suma ${k}. El ${b} inicial se suma una sola vez, sin importar el número de ${c.manyEs}.`
        : `Cada ${c.oneEs} suma ${k}. Multiplica el número de ${c.manyEs} por ${k}.`,
      solution: `<p>The rule is ${eq(k, b, c.yv, c.xv)}: ${xs.map((x) => `${x} ${x === 1 ? c.one : c.many} → ${subst(k, b, x)} = <b>${k * x + b}</b>`).join('; ')}.</p>`,
      feedback: {
        correct: `Correct. The ${c.yw} is ${k} times the ${c.xw}${b ? `, plus ${b}` : ''}.`,
        wrong(ans, d) {
          const id = d.wrong[0],
            x = Number(id.slice(1)),
            v = parseNum(ans[id]),
            i = xs.indexOf(x);
          if (b && v === k * x) return `For ${x} ${c.many} you forgot the ${yWord(c, b)} that is added once. Multiply, then add ${b}.`;
          if (b && v === k * x + b * x) return `You added ${b} for every ${c.one}. The ${yWord(c, b)} is added only once.`;
          if (i > 0 && xs[i] - xs[i - 1] > 1 && v === k * xs[i - 1] + b + k) return `The ${c.xw} jumped from ${xs[i - 1]} to ${x}, not by 1. Substitute ${x} instead of adding ${k} once.`;
          return `For ${x} ${c.many}: multiply ${k} × ${x}${b ? `, then add ${b}` : ''}.`;
        },
      },
    };
  });

  // ---------- Find the mistake in a table (error; hard adds the "x skipped but y stepped by k" mistake) ----------
  G.define('v1_tableError', (r, o) => {
    const hard = !!o.hard;
    const n = r.pick(NAMES);
    const k = hard ? r.int(3, 8) : r.int(2, 5);
    const variant = r.pick(hard ? ['forgotB', 'addedK', 'stepSkip'] : ['forgotB', 'addedK']);
    const b = variant === 'addedK' ? 0 : hard ? r.int(3, 9) : r.int(1, 5);
    const xs = hard
      ? r.pick([
          [2, 4, 6],
          [3, 5, 7],
        ])
      : [1, 2, 3];
    const dx = xs[1] - xs[0];
    const bad = xs.map((x, i) => (variant === 'forgotB' ? k * x : variant === 'addedK' ? x + k : k * xs[0] + b + i * k));
    const fixX = hard ? r.int(10, 14) : 5;
    const E = eq(k, b);
    const yFix = k * fixX + b;
    const opts =
      variant === 'forgotB'
        ? [
            { html: `${n} multiplied by ${k} but forgot to add ${b}. Every y-value is ${b} too small.`, ok: true },
            { html: `${n} should have added ${k} instead of multiplying.`, why: `The rule says ${k}x, which means multiply by ${k}. Multiplying was right; the missing step is adding ${b}.` },
            { html: `${n} swapped the x-values and y-values.`, why: 'The x row is correct. Check the y-values against the rule instead.' },
            { html: `${n} multiplied by ${b} instead of ${k}.`, why: `${bad[0]} = ${k} × ${xs[0]}, so ${n} did multiply by ${k}. The problem is what comes after.` },
          ]
        : variant === 'addedK'
          ? [
              { html: `${n} added ${k} instead of multiplying by ${k}. "${k}x" means ${k} times x.`, ok: true },
              { html: `${n} multiplied by ${k} but forgot a starting value.`, why: `The rule y = ${k}x has no starting value. Look at how each y compares to its x: it is ${k} more, not ${k} times.` },
              { html: `${n} swapped the x-values and y-values.`, why: 'The x row is fine. Compare each y to the rule.' },
              { html: `${n} multiplied by ${k + 1} instead of ${k}.`, why: `${bad[0]} is not ${k + 1} × ${xs[0]}. It is ${xs[0]} + ${k}.` },
            ]
          : [
              { html: `${n} added ${k} from column to column, but x goes up by ${dx} each time, so y must go up by ${k * dx}.`, ok: true },
              {
                html: `${n} forgot to add the starting value ${b} to the y-values.`,
                why: `The first column is right: ${subst(k, b, xs[0])} = ${bad[0]}. So ${n} did include ${b}. The mistake starts in the second column.`,
              },
              { html: `${n} multiplied each x-value by ${k + 1} instead of ${k}.`, why: `Check the first column: ${subst(k, b, xs[0])} = ${bad[0]}, which matches. The jumps between columns are what is too small.` },
              { html: `${n} swapped the x-values and the y-values.`, why: 'The x row is fine. Test each y against the rule, column by column.' },
            ];
    const sh = shuffleOptions(r, opts, 0);
    const pattern = (x) => {
      const steps = (x - xs[0]) / dx;
      return Number.isInteger(steps) ? bad[0] + steps * k : null;
    };
    return {
      type: 'error',
      skill: 'table-values',
      lesson: '9-1',
      title: 'Find the mistake in the table',
      prompt: `<p>${n} was asked to make a table of values for the rule <b>${E}</b>.</p><p>Which statement describes the mistake? Then give the correct y-value for x = ${fixX}.</p>`,
      work: tbl([
        ['x', ...xs.map(String)],
        ['y', ...bad.map(String)],
      ]),
      options: sh.options,
      answer: sh.answer,
      fix: { label: `Correct y when x = ${fixX}: `, answer: yFix },
      hints: [
        `Test each column. Substitute its x-value into ${E} and compare with the table.`,
        variant === 'stepSkip'
          ? `The first column checks out. Now test x = ${xs[1]}: ${subst(k, b, xs[1])}. Does the table show that?`
          : `${E} with x = ${xs[0]} gives ${k * xs[0] + b}. The table shows ${bad[0]}. What step is wrong?`,
        `For the fix, substitute x = ${fixX}: ${subst(k, b, fixX)}.`,
      ],
      hintEs: `Prueba cada columna. Sustituye su valor de x en ${E} y compara con la tabla.`,
      solution:
        variant === 'forgotB'
          ? `<p>${n} multiplied each x by ${k} but never added ${b}. For x = ${xs[0]}, ${subst(k, b, xs[0])} = ${k * xs[0] + b}, not ${bad[0]}. The correct value for x = ${fixX} is ${subst(k, b, fixX)} = <b>${yFix}</b>.</p>`
          : variant === 'addedK'
            ? `<p>${n} added ${k} to each x instead of multiplying. For x = ${xs[0]}, ${k} × ${xs[0]} = ${k * xs[0]}, not ${bad[0]}. The correct value for x = ${fixX} is ${k} × ${fixX} = <b>${yFix}</b>.</p>`
            : `<p>The first column is right, but ${n} then added ${k} per column. The x-values go up by ${dx}, so the y-values must go up by ${k} × ${dx} = ${k * dx}. For x = ${xs[1]}, ${subst(k, b, xs[1])} = ${k * xs[1] + b}, not ${bad[1]}. The correct value for x = ${fixX} is ${subst(k, b, fixX)} = <b>${yFix}</b>.</p>`,
      feedback: {
        correct: 'Correct. Testing the columns against the rule is the fastest way to catch a table mistake.',
        wrong(ans, d) {
          if (!d.mistakeOk) return (sh.options[ans.mistake] && sh.options[ans.mistake].why) || `Substitute each x-value into the rule and compare with the table.`;
          const v = parseNum(ans.fix);
          if (variant === 'forgotB' && v === k * fixX) return `Mistake found, but your fix repeats ${n}'s mistake. Add ${b} after multiplying.`;
          if (variant === 'addedK' && v === fixX + k) return `Mistake found, but your fix adds ${k} to ${fixX}. ${k}x means ${k} × ${fixX}.`;
          if (variant === 'stepSkip' && v === pattern(fixX)) return `Mistake found, but you continued ${n}'s pattern. Substitute x = ${fixX} into ${E} instead.`;
          return `Mistake found. For the fix, substitute x = ${fixX} into ${E}: ${subst(k, b, fixX)}.`;
        },
      },
    };
  });

  // ---------- Extend the table to a new input (num; hard: table counts by 2s, far input) ----------
  G.define('v1_nextValue', (r, o) => {
    const hard = !!o.hard;
    const c = r.pick(CTX),
      n = r.pick(NAMES);
    const k = hard ? r.int(3, 8) : r.int(2, 6);
    const b = r.chance(0.6) ? r.int(1, hard ? 9 : 5) : 0;
    const xs = hard ? [2, 4, 6] : [1, 2, 3];
    const ask = hard ? r.int(12, 20) : r.int(6, 9);
    const nextX = xs[2] + (xs[1] - xs[0]);
    return {
      type: 'num',
      skill: 'table-values',
      lesson: '9-1',
      title: 'Extend the table',
      prompt: `<p>${hard ? `${n} keeps a log of a sky-tram route. The ${c.yw} follows a steady pattern.` : story(c, n, k, b)}</p>${tbl(rows(c, k, b, xs))}<p>What is the ${c.yw} for ${hl(ask + ' ' + c.many)}?</p>`,
      unit: c.money ? '' : c.yu,
      answer: k * ask + b,
      hints: [
        hard
          ? `The table skips: the ${c.xw} goes up by 2 between columns. Find how much the ${c.yw} changes for 1 ${c.one}.`
          : `Look at how the ${c.yw} changes from one column to the next. It goes up by the same amount each time.`,
        hard
          ? `Between columns the ${c.yw} goes up by ${2 * k}. That is for 2 ${c.many}, so each ${c.one} adds ${2 * k} ÷ 2 = ${k}. ${b ? `Going back from ${2 * k + b} by 2 ${c.many} gives ${b} for 0 ${c.many}.` : `Going back from ${2 * k} by 2 ${c.many} gives 0 for 0 ${c.many}.`} The rule is ${eq(k, b, c.yv, c.xv)}.`
          : `Each ${c.one} adds ${k}${b ? `, and ${b} is added once` : ''}. The rule is ${eq(k, b, c.yv, c.xv)}.`,
        `Substitute ${ask}: ${subst(k, b, ask)}.`,
      ],
      hintEs: hard
        ? `La tabla salta: ${c.xwEs} sube de 2 en 2 entre columnas. Halla cuánto cambia ${c.ywEs} por 1 ${c.oneEs}.`
        : `Mira cómo cambia ${c.ywEs} de una columna a la siguiente. Sube la misma cantidad cada vez.`,
      solution: `<p>The ${c.yw} rises by ${k} for each ${c.one}${hard ? ` (${2 * k} for every 2 ${c.many})` : ''}, so the rule is ${eq(k, b, c.yv, c.xv)}. For ${ask} ${c.many}: ${subst(k, b, ask)} = <b>${k * ask + b}</b>.</p>`,
      feedback: {
        correct: `Correct. The rule ${eq(k, b, c.yv, c.xv)} works for any number of ${c.many}, not just the ones in the table.`,
        wrong(ans, d) {
          const v = d.value;
          if (v == null) return `Type a number for the ${c.yw}.`;
          if (hard && v === 2 * k * ask + b) return `You used ${2 * k} as the amount per ${c.one}, but ${2 * k} is the jump for 2 ${c.many}. Each ${c.one} adds ${2 * k} ÷ 2.`;
          if (b && v === k * ask) return `You multiplied correctly but left out the ${yWord(c, b)} that is added once.`;
          if (v === k * nextX + b) return `${v} is the value for ${nextX} ${c.many}, the next column. The question asks about ${ask} ${c.many}.`;
          if (v === k + ask + b) return `Do not add ${k} and ${ask}. Each ${c.one} adds ${k}, so multiply ${k} by ${ask}.`;
          return `Find the rule first: how much does each ${c.one} add${b ? ', and what is added once' : ''}? Then substitute ${ask} ${c.many}.`;
        },
      },
    };
  });

  // ---------- Match rules in words to tables (match; hard: four rules, skipping x-values) ----------
  G.define('v1_matchRules', (r, o) => {
    const hard = !!o.hard;
    const k = hard ? r.int(3, 6) : r.int(2, 4);
    let b = hard ? r.int(2, 7) : r.int(2, 5);
    if (b === k) b = k + 1;
    const xs = hard
      ? r.pick([
          [2, 4, 6],
          [0, 3, 5],
          [1, 4, 7],
        ])
      : [1, 2, 3];
    const cands = [
      [k, 0],
      [1, b],
      [k, b],
      [b, k],
    ];
    const nRules = hard ? 4 : 3;
    const picked = r.shuffle(cands).slice(0, nRules);
    const left = picked.map(([kk, bb]) => cap(ruleWords(kk, bb)));
    const right = picked.map(([kk, bb]) =>
      V.table(
        [
          ['x', ...xs.map(String)],
          ['y', ...xs.map((x) => String(kk * x + bb))],
        ],
        { header: false, rowHeader: true, cls: 'mini' },
      ),
    );
    const order = r.shuffle(picked.map((_, i) => i));
    const rightShuffled = order.map((i) => right[i]);
    const pairs = picked.map((_, i) => [i, order.indexOf(i)]);
    const x0 = xs[0] === 0 ? xs[1] : xs[0];
    return {
      type: 'match',
      skill: 'rule-words',
      lesson: '9-1',
      title: 'Match each rule to its table',
      prompt: hard
        ? '<p>Four rules in words each make a different table of values. The tables skip some x-values. Match each rule to the table it produces.</p>'
        : '<p>Each rule in words makes a different table of values. Match each rule to the table it produces.</p>',
      left,
      right: rightShuffled,
      pairs,
      hints: [
        `Test one column of each table: substitute x = ${x0} into each rule.`,
        `For x = ${x0}, the rules give: ${picked.map(([kk, bb]) => `${cap(ruleWords(kk, bb))} → ${kk * x0 + bb}`).join('; ')}.`,
        'If two tables agree in one column, test another column to tell them apart.',
      ],
      hintEs: `Prueba una columna de cada tabla: sustituye x = ${x0} en cada regla.`,
      solution: `<p>Substitute each x into each rule: ${picked.map(([kk, bb]) => `<b>${cap(ruleWords(kk, bb))}</b> → ${xs.map((x) => kk * x + bb).join(', ')}`).join('; ')}.</p>`,
      feedback: {
        correct: 'Correct. Substituting one or two x-values is enough to identify a rule.',
        wrong(ans, d) {
          const i = d.wrong[0];
          const [kk, bb] = picked[i];
          const mine = (Array.isArray(ans) ? ans : []).find((p) => p[0] === i);
          if (mine && order[mine[1]] !== undefined) {
            const [k2, b2] = picked[order[mine[1]]];
            return `"${left[i]}" is matched to a table with y = ${k2 * x0 + b2} at x = ${x0}. Test the rule: ${subst(kk, bb, x0)} = ${kk * x0 + bb}. Find the table with that value, then check a second column.`;
          }
          return `Test "${left[i]}" with x = ${x0}: ${subst(kk, bb, x0)}. Find the table that gives that, then check a second column.`;
        },
      },
    };
  });

  // ---------- Use the rule for two inputs (blanks with template; hard: larger rule and inputs) ----------
  G.define('v1_blanksRule', (r, o) => {
    const hard = !!o.hard;
    const c = r.pick(CTX),
      n = r.pick(NAMES);
    const k = hard ? r.int(6, 12) : r.int(2, 6);
    const b = hard ? r.int(5, 15) : r.chance(0.6) ? r.int(1, 5) : 0;
    const [x1, x2] = r.pickN(hard ? [11, 12, 13, 14, 15, 16, 18, 20] : [4, 5, 6, 7, 8, 9], 2).sort((a, z) => a - z);
    return {
      type: 'blanks',
      skill: 'rule-words',
      lesson: '9-1',
      title: 'Use the rule',
      prompt: `<p>${story(c, n, k, b)}</p><p>Rule in words: <b>${cap(ruleWords(k, b).replace(/\bx\b/g, 'the ' + c.xw))}</b>.</p><p>Fill in the ${c.yw} for each number of ${c.many}.</p>`,
      template: `For ${x1} ${c.many}, the ${c.yw} is {0}. For ${x2} ${c.many}, the ${c.yw} is {1}.`,
      fields: [
        { label: `${x1} ${c.many}`, answer: k * x1 + b },
        { label: `${x2} ${c.many}`, answer: k * x2 + b },
      ],
      hints: [b ? 'Follow the rule in order: multiply first, then add.' : 'Follow the rule: multiply the number of ' + c.many + ' by ' + k + '.', `${x1} ${c.many}: ${subst(k, b, x1)}.`, `${x2} ${c.many}: ${subst(k, b, x2)}.`],
      hintEs: b ? 'Sigue la regla en orden: primero multiplica y después suma.' : `Sigue la regla: multiplica el número de ${c.manyEs} por ${k}.`,
      solution: `<p>The rule says to ${ruleWords(k, b).replace(/\bx\b/g, 'the ' + c.xw)}. ${x1} ${c.many}: ${subst(k, b, x1)} = <b>${k * x1 + b}</b>. ${x2} ${c.many}: ${subst(k, b, x2)} = <b>${k * x2 + b}</b>. The same steps work for any number of ${c.many}.</p>`,
      feedback: {
        correct: 'Correct. A rule in words tells you the operations and their order.',
        wrong(ans, d) {
          const i = d.wrong[0],
            x = i === 0 ? x1 : x2,
            v = parseNum(ans[i]);
          if (b && v === k * x) return `For ${x} ${c.many}, add the ${b} after multiplying.`;
          if (b && v === k * (x + b)) return `For ${x} ${c.many}, you added ${b} before multiplying. The rule multiplies first, then adds.`;
          if (v === x + k + b) return `Multiply ${k} by ${x}; do not add them.`;
          return `For ${x} ${c.many}: multiply ${k} × ${x}${b ? `, then add ${b}` : ''}.`;
        },
      },
    };
  });

  // ---------- How much does y change each time? (mc; hard: table counts by 2s) ----------
  G.define('v1_changeMc', (r, o) => {
    const hard = !!o.hard;
    const c = r.pick(CTX),
      n = r.pick(NAMES);
    const k = hard ? r.int(3, 8) : r.int(2, 5);
    let b = hard ? r.int(2, 9) : r.int(2, 6);
    if (b === k) b = k + 1;
    const xs = hard ? [2, 4, 6, 8] : [1, 2, 3, 4];
    const y = (x) => k * x + b;
    const base = hard
      ? [
          { html: `It goes up by ${k} each time.`, ok: true },
          { html: `It goes up by ${2 * k} each time.`, why: `${2 * k} is the jump between columns, but the ${c.xw} goes up by 2 there. For each 1 ${c.one}, the ${c.yw} goes up by ${2 * k} ÷ 2 = ${k}.` },
          { html: `It goes up by ${b} each time.`, why: `${b} is the starting value, the part that is added once. Find the jump between columns, then divide by how much the ${c.xw} went up.` },
          { html: `It goes up by ${y(2)} each time.`, why: `${y(2)} is the value for 2 ${c.many}, not the change. Compare two columns, then divide by how much the ${c.xw} went up.` },
        ]
      : [
          { html: `It goes up by ${k} each time.`, ok: true },
          { html: `It goes up by ${b} each time.`, why: `${b} is the starting value, the part that is added once. Subtract one ${c.yw} from the next to see the change.` },
          { html: `It goes up by ${k + b} each time.`, why: `${k + b} is the value for 1 ${c.one}, not the change. Compare two columns: ${y(2)} − ${y(1)} = ${k}.` },
          { html: 'It goes up by 1 each time.', why: `The ${c.xw} goes up by 1. The question asks how the ${c.yw} changes.` },
        ];
    const sh = shuffleOptions(r, dedupe(base), 0);
    return {
      type: 'mc',
      skill: 'rule-words',
      lesson: '9-1',
      title: 'Describe the change',
      prompt: `<p>${n} recorded the ${c.yw} for several values of the ${c.xw}. The pattern stays steady.</p>${tbl(rows(c, k, b, xs))}<p>Each time the ${c.xw} goes up by 1, how does the ${c.yw} change?</p>`,
      options: sh.options,
      answer: sh.answer,
      hints: [
        hard
          ? 'Compare two columns that are next to each other. Subtract the y-values, and notice how much x goes up between those columns.'
          : 'Compare two columns that are next to each other. Subtract the smaller y from the larger.',
        `${y(xs[1])} − ${y(xs[0])} = ? And ${y(xs[2])} − ${y(xs[1])} = ?`,
        hard ? `Both jumps are the same, but each jump covers 2 ${c.many}. Split the jump to get the change for 1 ${c.one}.` : `Both differences are the same number. That is how much the ${c.yw} changes per ${c.one}.`,
      ],
      hintEs: hard
        ? 'Compara dos columnas que estén juntas. Resta los valores de y y fíjate cuánto sube x entre esas columnas.'
        : 'Compara dos columnas que estén juntas. Resta el valor de y menor del mayor.',
      solution: `<p>From one column to the next, the ${c.yw} goes ${xs
        .slice(0, 3)
        .map(y)
        .join(', ')}: each jump is ${hard ? `${2 * k} for 2 ${c.many}, so ${2 * k} ÷ 2 = <b>${k}</b> per ${c.one}` : `<b>${k}</b>`}. That is the rate of change: ${k} per ${c.one}. The ${b} is the starting value, added only once.</p>`,
      feedback: {
        correct: `Correct. The ${c.yw} changes by ${k} for every 1 ${c.one}: that is the rate of change.`,
        wrong(ans) {
          return (sh.options[ans] && sh.options[ans].why) || 'Subtract two neighboring y-values, then think about how much x went up.';
        },
      },
    };
  });

  // ---------- Explain which variable is independent (cr; hard: dependent row on top, subtler reasons) ----------
  G.define('v1_crIndependent', (r, o) => {
    const hard = !!o.hard;
    const c = r.pick(CTX),
      n = r.pick(NAMES);
    const k = hard ? r.int(4, 9) : r.int(2, 5);
    const b = hard ? r.int(3, 12) : r.chance(0.5) ? r.int(1, 4) : 0;
    const t = rows(c, k, b, [1, 2, 3]);
    const sh = shuffleOptions(
      r,
      [
        { html: `The ${c.xw} is independent because ${n} chooses it, and the ${c.yw} is calculated from it.`, ok: true },
        hard
          ? {
              html: `The ${c.yw} is independent because it is in the top row of the table.`,
              why: `Rows can be listed in any order; this table happens to show the ${c.yw} first. What matters is that the ${c.yw} is calculated from the ${c.xw}.`,
            }
          : {
              html: `The ${c.yw} is independent because it has the larger numbers.`,
              why: 'The size of the numbers does not decide which variable is independent. What matters is which one is chosen and which one responds.',
            },
        { html: `The ${c.yw} is independent because it is what ${n} cares about most.`, why: `Caring about a quantity does not make it independent. The ${c.yw} still responds to the ${c.xw}.` },
        { html: 'Neither is independent because both numbers change.', why: 'Both do change, but one changes because of the other. The one that is chosen is independent.' },
      ],
      0,
    );
    return {
      type: 'cr',
      skill: 'ind-dep',
      lesson: '9-1',
      title: 'Explain your thinking',
      prompt: `<p>${story(c, n, k, b)}</p>${hard ? tbl([t[1], t[0]]) : ''}<p>Explain how you can tell which variable is the independent variable. Then choose the explanation that is correct.</p>`,
      starters: ['The independent variable is the one that …', `${n} chooses the …, so …`, 'The dependent variable responds to …'],
      minWords: 10,
      check: { prompt: 'Which explanation is correct?', options: sh.options, answer: sh.answer },
      hints: [
        'Independent means it does not depend on the other quantity. Someone chooses it.',
        `Who decides the ${c.xw}? Who decides the ${c.yw}? One of them is decided by the other.`,
        `${n} picks the ${c.xw}; the ${c.yw} is the result.`,
      ],
      hintEs: 'Independiente quiere decir que no depende de la otra cantidad. Alguien la elige.',
      solution: `<p>Model explanation: "The ${c.xw} is independent because ${n} decides it first. The ${c.yw} is dependent because it is calculated from the ${c.xw}; it responds to that choice."</p>`,
      feedback: {
        correct: 'Correct. Independent = chosen first; dependent = calculated from it.',
        wrong(ans, d) {
          if (!d.wroteEnough) return 'Write a full sentence or two. A sentence starter can help you begin.';
          return (sh.options[ans.check] && sh.options[ans.check].why) || 'Think about which quantity is chosen and which one responds.';
        },
      },
    };
  });
})(typeof window !== 'undefined' ? window : globalThis);

/* js/units/u9/gen-graphs.js */
/* Zone 2 — The Grid Line. Lesson 9-2 Analyze Graphs of Relationships Between Two Variables (From Table to Graph · Analyzing a Graph). */
(function (root) {
  'use strict';
  const RX = root.RX;
  const { G, V, shuffleOptions, NAMES, parseNum } = RX;
  const { CTX, eq, yWord, de, grid, rows } = RX.U9;
  const hl = V.hl;
  const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
  const story = (c, n, k, b) => (b ? c.aff(n, k, b) : c.prop(n, k));
  const pts = (k, b, xs) => xs.map((x) => [x, k * x + b]);
  const pairText = (p) => `(${p[0]}, ${p[1]})`;
  const subst = (k, b, x) => `${k === 1 ? x : k + ' × ' + x}${b ? ' + ' + b : ''}`;
  const count = (c, n) => `${n} ${n === 1 ? c.one : c.many}`;
  /** Spanish noun phrase without its article: "el número de paradas" → "número de paradas". */
  const bare = (s) => s.replace(/^(el|la) /, '');
  const tbl = (rs) => V.table(rs, { header: false, rowHeader: true, cls: 'compact' });
  /** Graph for a rule over x = xs, sized to fit yMax ≤ 24. */
  const graphFor = (c, series, xMax, yTop, size, extra) => {
    const g = grid(yTop);
    return V.graph(Object.assign({ xLabel: c.xLabel, yLabel: c.yLabel, xMax, yMax: g.yMax, yStep: g.yStep, size: size || 280, series }, extra || {}));
  };
  const scaleNote = (yTop) => {
    const s = grid(yTop).yStep;
    return s > 1 ? ` The vertical axis counts by ${s}s, so a point between two grid lines is halfway between their values.` : '';
  };

  // ---------- Ordered pairs from a table (blanks, template; hard: dependent row on top, skipping inputs) ----------
  G.define('v2_orderedPairs', (r, o) => {
    const hard = !!o.hard;
    const c = r.pick(CTX),
      n = r.pick(NAMES);
    const k = hard ? r.int(3, 6) : r.int(2, 5);
    const b = hard ? r.int(2, 6) : r.chance(0.5) ? r.int(1, 4) : 0;
    const xs = hard
      ? r.pick([
          [3, 5, 8],
          [2, 6, 9],
          [4, 7, 10],
        ])
      : r.pick([
          [1, 2, 3],
          [2, 3, 4],
          [1, 3, 5],
          [0, 2, 4],
        ]);
    const t = rows(c, k, b, xs);
    const fields = [];
    xs.forEach((x) => {
      fields.push({ label: 'x', answer: x, width: 'xs' });
      fields.push({ label: 'y', answer: k * x + b, width: 'xs' });
    });
    return {
      type: 'blanks',
      skill: 'ordered-pairs',
      lesson: '9-2',
      title: 'Write the ordered pairs',
      prompt: `<p>${story(c, n, k, b)}</p>${tbl(hard ? [t[1], t[0]] : t)}<p>Write each column of the table as an ordered pair (${c.xw}, ${c.yw}).</p>`,
      template: 'Column 1: ({0}, {1})   Column 2: ({2}, {3})   Column 3: ({4}, {5})',
      fields,
      hints: [
        'An ordered pair is (independent, dependent). The independent variable goes first.' + (hard ? ' Check which row of this table holds the independent variable.' : ''),
        `The ${c.xw} is independent, so it is the first number. Column 1 starts with ${xs[0]}.`,
        `Column 1 is (${xs[0]}, ${k * xs[0] + b}). Use the same order for the other columns.`,
      ],
      hintEs: 'Un par ordenado es (independiente, dependiente). La variable independiente va primero.' + (hard ? ' Fíjate en qué fila de esta tabla está la variable independiente.' : ''),
      solution: `<p>The ordered pairs are ${pts(k, b, xs).map(pairText).join(', ')}. The first number is always the ${c.xw} (x), and the second is the ${c.yw} (y)${hard ? ', even when a table lists the rows in the other order' : ''}.</p>`,
      feedback: {
        correct: 'Correct. Independent first, dependent second: (x, y).',
        wrong(ans, d) {
          const i = d.wrong[0],
            col = Math.floor(i / 2),
            x = xs[col],
            y = k * x + b;
          const vx = parseNum(ans[col * 2]),
            vy = parseNum(ans[col * 2 + 1]);
          if (vx === y && vy === x) return `Column ${col + 1} is reversed. The ${c.xw} goes first, then the ${c.yw}.${hard ? ' In this table the ' + c.yw + ' row is on top, but the pair still starts with the ' + c.xw + '.' : ''}`;
          return `Check column ${col + 1}: find the ${c.xw} in the "${c.xLabel}" row and write it first; the ${c.yw} from the "${c.yLabel}" row goes second.`;
        },
      },
    };
  });

  // ---------- Plot the points from a table (plot; hard: steeper rule on an axis that counts by 4s) ----------
  G.define('v2_plotTable', (r, o) => {
    const hard = !!o.hard;
    const c = r.pick(CTX),
      n = r.pick(NAMES);
    const b = hard || r.chance(0.4) ? r.int(1, 4) : 0;
    const k = hard ? r.int(3, 5) : b ? r.int(1, 4) : r.int(2, 4);
    const xs = hard ? [0, 1, 2, 3, 4] : [1, 2, 3, 4];
    const points = pts(k, b, xs);
    const g = grid(k * 4 + b);
    return {
      type: 'plot',
      skill: 'graph-plot',
      lesson: '9-2',
      title: 'Plot the points',
      prompt: `<p>${story(c, n, k, b)}</p>${tbl(rows(c, k, b, xs))}<p>Plot every column of the table as a point on the grid.</p><p class="muted">Click a grid point to place or remove a point.</p>`,
      xLabel: c.xLabel,
      yLabel: c.yLabel,
      xMax: 5,
      yMax: g.yMax,
      xStep: 1,
      yStep: g.yStep,
      points,
      count: points.length,
      hints: [
        `Each column is an ordered pair (${c.xw}, ${c.yw}). Go across for the first number, then up for the second.`,
        `The first column is (${xs[0]}, ${k * xs[0] + b}): ${xs[0]} across, ${k * xs[0] + b} up.${g.yStep > 1 ? ` The vertical axis counts by ${g.yStep}s.` : ''}`,
        `Plot ${points.map(pairText).join(', ')}. The points should line up in a straight line.`,
      ],
      hintEs: `Cada columna es un par ordenado (${bare(c.xwEs)}, ${bare(c.ywEs)}). Ve a la derecha para el primer número y luego sube para el segundo.`,
      solution: `<p>The points are ${points.map(pairText).join(', ')}. They form a straight line because the ${c.yw} rises by the same amount (${k}) for each ${c.one}.</p>${graphFor(c, [{ points, line: true }], 5, k * 4 + b, 260)}`,
      feedback: {
        correct: 'Correct. Across first (independent), then up (dependent). A steady rate always makes a straight line.',
        wrong(ans, d) {
          if (d.extra.length) {
            const p = d.extra[0];
            if (points.some((q) => q[0] === p[1] && q[1] === p[0])) return `(${p[0]}, ${p[1]}) has the coordinates reversed. Go across for the ${c.xw}, then up for the ${c.yw}.`;
            const right = points.find((q) => q[0] === p[0]);
            if (right && g.yStep > 1 && Math.abs(right[1] - p[1]) < g.yStep) return `(${p[0]}, ${p[1]}) is close but not at the right height. The vertical axis counts by ${g.yStep}s, so count carefully between the grid lines.`;
            return `(${p[0]}, ${p[1]}) is not in the table. Read the ${c.yw} for ${count(c, p[0])} from the table.`;
          }
          const m = d.missing[0];
          return `You still need the point for ${count(c, m[0])}. Find that column in the table, then go ${m[0]} across and up to its ${c.yw}.`;
        },
      },
    };
  });

  // ---------- Match the table to its graph (rep; hard: skipping x-values and a mis-spaced graph) ----------
  G.define('v2_tableToGraph', (r, o) => {
    const hard = !!o.hard;
    const c = r.pick(CTX);
    const b = hard ? r.int(1, 4) : r.chance(0.5) ? r.int(1, 4) : 0;
    let k = hard ? r.int(2, 4) : b ? r.int(1, 4) : r.int(2, 4);
    if (b && k === b) k = b === 4 ? 3 : b + 1;
    const xs = hard ? [0, 2, 4] : [1, 2, 3, 4];
    const good = pts(k, b, xs);
    let series;
    if (hard) {
      const squeezed = good.map((p, i) => [i, p[1]]);
      series = [
        { p: squeezed, why: `This graph puts the columns at 0, 1, and 2 across. The table's x-values are 0, 2, and 4, so the points must be spaced 2 apart.` },
        { p: pts(k, 0, xs), why: `This graph starts at (0, 0), but the table starts at (0, ${b}). It leaves out the starting value.` },
        { p: pts(b, k, xs), why: `This graph swaps the rate and the starting value. It starts at ${k} and rises ${b} per 1 across; the table starts at ${b} and rises ${k} per 1 across.` },
      ];
    } else {
      series = b
        ? [
            { p: pts(k, 0, xs), why: `This graph starts too low: it shows ${k} per ${c.one} with no starting value of ${b}. Check (1, ${k + b}).` },
            { p: pts(b, k, xs), why: `This graph swaps the rate and the starting value. It rises by ${b} each step; the table rises by ${k}.` },
          ]
        : [
            { p: pts(1, k, xs), why: `These points go up by only 1 each step. The table goes up by ${k} each step, because y is ${k} <b>times</b> x, not ${k} more than x.` },
            { p: pts(k + 1, 0, xs), why: `This graph rises too fast: (1, ${k + 1}) instead of (1, ${k}).` },
          ];
    }
    const yTop = Math.max(...good.map((p) => p[1]), ...series.flatMap((s) => s.p.map((p) => p[1])));
    const mk = (ps) => graphFor(c, [{ points: ps }], 5, yTop, 200);
    const sh = shuffleOptions(r, [{ html: mk(good), ok: true }, ...series.map((s) => ({ html: mk(s.p), why: s.why }))], 0);
    return {
      type: 'rep',
      skill: 'graph-plot',
      lesson: '9-2',
      title: 'Match the table to its graph',
      prompt: `<p>Which graph shows the data in the table?</p>${tbl(rows(c, k, b, xs))}`,
      options: sh.options,
      answer: sh.answer,
      layout: 'cards',
      hints: [
        'Each column is a point: across for the first row, up for the second row.' + (hard ? ' Read the x-values carefully; they skip.' : ''),
        `The first point should be ${pairText(good[0])}. Find ${good[0][0]} on the horizontal axis and check how high the point is in each graph.`,
        `Then check ${pairText(good[1])}. Only one graph has both points.`,
      ],
      hintEs: 'Cada columna es un punto: a la derecha según la primera fila y hacia arriba según la segunda fila.' + (hard ? ' Lee bien los valores de x; van saltando.' : ''),
      solution: `<p>The table gives ${good.map(pairText).join(', ')}. The correct graph has exactly those points: it starts at ${pairText(good[0])} and rises ${k} for each 1 across${hard ? `, so ${2 * k} between points that are 2 apart` : ''}.</p>`,
      feedback: {
        correct: 'Correct. Check one or two points carefully instead of judging by the general shape.',
        wrong(ans) {
          return (sh.options[ans] && sh.options[ans].why) || 'Check the first two points of the table, one at a time, on each graph.';
        },
      },
    };
  });

  // ---------- Error: dependent written first (error; hard: only one pair reversed) ----------
  G.define('v2_errorPair', (r, o) => {
    const hard = !!o.hard;
    const c = r.pick(CTX),
      n = r.pick(NAMES);
    const k = hard ? r.int(3, 7) : r.int(2, 5);
    const b = hard ? r.int(2, 9) : r.chance(0.5) ? r.int(1, 4) : 0;
    const xs = hard ? [2, 3, 5] : [1, 2, 3];
    const good = pts(k, b, xs);
    const flipI = hard ? r.int(0, 2) : -1;
    const written = good.map((p, i) => (!hard || i === flipI ? `(${p[1]}, ${p[0]})` : pairText(p))).join(', ');
    const fixX = hard ? r.int(6, 9) : 4;
    const yFix = k * fixX + b;
    const opts = hard
      ? [
          { html: `${n} reversed the pair for ${count(c, xs[flipI])}. Every pair must list the ${c.xw} first.`, ok: true },
          { html: `${n} reversed every pair. Each pair should list the ${c.xw} first.`, why: `Look again: only one pair is reversed. The other pairs already list the ${c.xw} first.` },
          {
            html: `${n} used the wrong rate. The ${c.yw} should rise by ${k + 1} each ${c.one}.`,
            why: `The values match the table: ${good.map((p) => p[1]).join(', ')}. Only the order inside one pair is wrong.`,
          },
          { html: `${n} forgot to add the starting value of ${b}.`, why: `The numbers match the table, so nothing was dropped. One pair just has its two numbers in the wrong order.` },
        ]
      : [
          { html: `${n} wrote the dependent variable first. An ordered pair is (independent, dependent), so each pair should be (${c.xw}, ${c.yw}).`, ok: true },
          {
            html: `${n} used the wrong rate. The ${c.yw} should rise by ${k + 1} each ${c.one}.`,
            why: `The values themselves are correct: ${good.map((p) => p[1]).join(', ')} match the table. Only the order inside each pair is wrong.`,
          },
          { html: `${n} should have written only the ${c.yw}, not both numbers.`, why: 'An ordered pair always has two numbers, one for each variable. The problem is the order, not the count.' },
          { html: `${n} forgot the starting value.`, why: `Look at the numbers: they match the table. ${n} did not drop anything; the two numbers in each pair are just in the wrong order.` },
        ];
    const sh = shuffleOptions(r, opts, 0);
    return {
      type: 'error',
      skill: 'ordered-pairs',
      lesson: '9-2',
      title: 'Find the mistake in the ordered pairs',
      prompt: `<p>${story(c, n, k, b)} ${n} made a table and then wrote the ordered pairs (${c.xw}, ${c.yw}).</p><p>Which statement describes the mistake? Then give the correct second number for the pair with ${fixX} ${c.many}.</p>`,
      work: `${tbl(rows(c, k, b, xs))}<p>Ordered pairs: ${written}</p>`,
      options: sh.options,
      answer: sh.answer,
      fix: { label: `Correct pair for ${fixX} ${c.many}: (${fixX}, `, answer: yFix },
      hints: [
        hard
          ? `Compare each pair ${n} wrote with its column in the table. Is the ${c.xw} always first?`
          : `Read the first pair ${n} wrote. Does its first number match the ${c.xw} row of the table?`,
        hard ? `The table's columns are ${good.map(pairText).join(', ')} in (${c.xw}, ${c.yw}) order. Which pair does not match?` : `The first column of the table is ${xs[0]} ${c.one} → ${k + b}. The pair should start with ${xs[0]}.`,
        `For the fix: ${fixX} ${c.many} → ${subst(k, b, fixX)}.`,
      ],
      hintEs: hard
        ? `Compara cada par que escribió ${n} con su columna en la tabla. ¿Siempre va primero ${c.xwEs}?`
        : `Lee el primer par que escribió ${n}. ¿Su primer número coincide con la fila ${de(c.xwEs)} de la tabla?`,
      solution: `<p>${hard ? `${n} reversed one pair: ${good[flipI][1]} and ${good[flipI][0]} are in the wrong order.` : `${n} reversed every pair.`} Ordered pairs are (independent, dependent): ${good.map(pairText).join(', ')}. For ${fixX} ${c.many}: ${subst(k, b, fixX)} = <b>${yFix}</b>, so the pair is (${fixX}, ${yFix}).</p>`,
      feedback: {
        correct: 'Correct. (6, 3) and (3, 6) are different points. The independent variable always comes first.',
        wrong(ans, d) {
          if (!d.mistakeOk) return (sh.options[ans.mistake] && sh.options[ans.mistake].why) || `Compare the first number in each pair with the ${c.xw} row of the table.`;
          const v = parseNum(ans.fix);
          if (v === fixX) return `Mistake found. ${fixX} is the first number, the ${c.xw}. The blank asks for the second number: the ${c.yw}.`;
          if (b && v === k * fixX) return `Mistake found. For the fix, you left out the starting value. Multiply, then add ${b}.`;
          return `Mistake found. For the fix, find the ${c.yw} for ${fixX} ${c.many}: multiply by ${k}${b ? `, then add ${b}` : ''}.`;
        },
      },
    };
  });

  // ---------- What does the point mean? (mc; hard: steeper graph, and half the time the point on the y-axis) ----------
  G.define('v2_pointMeaning', (r, o) => {
    const hard = !!o.hard;
    const c = r.pick(CTX),
      n = r.pick(NAMES);
    const k = hard ? r.int(4, 5) : r.int(2, 5);
    const b = hard ? r.int(1, 4) : r.chance(0.5) ? r.int(1, 4) : 0;
    const x = hard && r.chance(0.5) ? 0 : r.int(2, 4),
      y = k * x + b;
    const all = pts(k, b, [0, 1, 2, 3, 4]);
    const opts =
      x === 0
        ? [
            { html: `0 ${c.many} go with ${yWord(c, b)}: the starting value.`, ok: true },
            { html: `Each ${c.one} adds ${yWord(c, b)}.`, why: `(0, ${b}) is where the line starts, before any ${c.many}. The amount each ${c.one} adds is the rise from one point to the next: ${k}.` },
            { html: `${count(c, b)} ${b === 1 ? 'goes' : 'go'} with ${yWord(c, 0)}.`, why: `You reversed the coordinates. The first number, 0, is the ${c.xw}; the second number, ${b}, is the ${c.yw}.` },
            { html: `0 ${c.many} go with ${yWord(c, 0)}, because lines start at the origin.`, why: `Not every line starts at the origin. This one meets the vertical axis at ${b}, so 0 ${c.many} already go with ${yWord(c, b)}.` },
          ]
        : [
            { html: `${x} ${c.many} go with ${yWord(c, y)}.`, ok: true },
            { html: `${y} ${c.many} go with ${yWord(c, x)}.`, why: `You reversed the coordinates. The horizontal axis is ${c.xLabel}, so the first number, ${x}, is the ${c.xw}.` },
            { html: `Each ${c.one} goes with ${yWord(c, y)}.`, why: `${y} is the total for ${x} ${c.many}, not the amount for one ${c.one}. The amount per ${c.one} is ${k}.` },
            { html: `${x} ${c.many} go with ${yWord(c, y + k)}.`, why: `${y + k} is the value for ${x + 1} ${c.many}. Read the height of the point above ${x}, not the next point.` },
          ];
    const sh = shuffleOptions(r, opts, 0);
    return {
      type: 'mc',
      skill: 'graph-read',
      lesson: '9-2',
      title: 'What does the point mean?',
      prompt: `<p>${story(c, n, k, b)} The graph shows the relationship.</p>${graphFor(c, [{ points: all }, { points: [[x, y]], color: '#C8553D' }], 5, k * 4 + b, 270)}<p>What does the highlighted point ${hl(pairText([x, y]))} mean?</p>`,
      options: sh.options,
      answer: sh.answer,
      hints: [
        'Read the axis labels. The first number in the pair is on the horizontal axis.',
        `(${x}, ${y}): ${x} is a number of ${c.many}; ${y} is a ${c.yw}.`,
        x === 0 ? `A point with 0 ${c.many} shows the ${c.yw} before anything is counted. What do we call that value?` : `So the point pairs ${x} ${c.many} with one ${c.yw}. Which choice says that?`,
      ],
      hintEs: 'Lee los nombres de los ejes. El primer número del par está en el eje horizontal.',
      solution:
        x === 0
          ? `<p>(0, ${b}) means <b>0 ${c.many} go with ${yWord(c, b)}</b>. That is the starting value: the ${c.yw} before any ${c.many}. It is where the line meets the vertical axis.</p>`
          : `<p>(${x}, ${y}) means <b>${x} ${c.many} go with ${yWord(c, y)}</b>. Read the horizontal axis for the ${c.xw} and the vertical axis for the ${c.yw}.</p>`,
      feedback: {
        correct: 'Correct. An ordered pair reads (horizontal value, vertical value), and the axis labels tell you what each one means.',
        wrong(ans) {
          return (sh.options[ans] && sh.options[ans].why) || 'Read the first number on the horizontal axis and the second on the vertical axis.';
        },
      },
    };
  });

  // ---------- Read a value from the graph (num; hard: steeper rule, input beyond the graph) ----------
  G.define('v2_readGraph', (r, o) => {
    const hard = !!o.hard;
    const c = r.pick(CTX),
      n = r.pick(NAMES);
    const b = hard ? r.int(1, 4) : r.chance(0.5) ? r.int(1, 4) : 0;
    const k = hard ? r.int(3, 5) : b ? r.int(1, 4) : r.int(2, 4);
    const shown = pts(k, b, [0, 1, 2, 3, 4]);
    const ask = hard ? r.int(6, 9) : r.int(2, 4);
    const y = k * ask + b;
    const top = k * 4 + b;
    return {
      type: 'num',
      skill: 'graph-read',
      lesson: '9-2',
      title: 'Read the graph',
      prompt: `<p>${n} graphed the ${c.yw} for 0 to 4 ${c.many}. The pattern stays steady.</p>${graphFor(c, [{ points: shown, line: true }], 5, top, 280)}<p>What is the ${c.yw} for ${hl(ask + ' ' + c.many)}?</p>`,
      unit: c.money ? '' : c.yu,
      answer: y,
      hints: [
        hard
          ? `${ask} is past the edge of the graph. Find the pattern first: how much does y go up for each 1 across, and where does the line start?`
          : `Find ${ask} on the horizontal axis. Go straight up to the point, then read across to the vertical axis.`,
        hard
          ? `From one point to the next, the ${c.yw} goes up by ${k}. At 0 ${c.many} it is ${b}.`
          : `Each point is higher than the one before by the same amount.${b ? ` The line starts at ${b} on the vertical axis.` : ' The line starts at the origin.'}`,
        hard ? `Rule: ${eq(k, b, c.yv, c.xv)}. Substitute ${ask}: ${subst(k, b, ask)}.` : `Read the height of the point above ${ask}.${scaleNote(top) || ' Count the grid lines up from 0.'}`,
      ],
      hintEs: hard
        ? `${ask} está fuera de la gráfica. Primero halla el patrón: ¿cuánto sube y por cada 1 hacia la derecha, y dónde empieza la línea?`
        : `Busca ${ask} en el eje horizontal. Sube derecho hasta el punto y luego mira hacia la izquierda para leer el eje vertical.`,
      solution: `<p>${
        hard
          ? `The graph rises ${k} for each ${c.one} and starts at ${b}, so the rule is ${eq(k, b, c.yv, c.xv)}. For ${ask} ${c.many}: ${subst(k, b, ask)} = ${y}.`
          : `The point above ${ask} on the horizontal axis is at height ${y}.`
      } The ${c.yw} is <b>${yWord(c, y)}</b>.</p>`,
      feedback: {
        correct: hard ? 'Correct. When the input is off the graph, find the rule from the graph and substitute.' : 'Correct. Across to the input, up to the point, then across to read the output.',
        wrong(ans, d) {
          const v = d.value;
          if (v == null) return `Type a number for the ${c.yw}.`;
          if (v === ask) return `${ask} is the ${c.xw}, the input. Find the ${c.yw} that goes with it.`;
          if (b && v === k * ask) return `You left out the starting value. The graph does not start at 0; at 0 ${c.many} it is already ${b}.`;
          if (b && v === (k + b) * ask) return `You used ${k + b}, the height above 1, as the amount per ${c.one}. That height includes the starting value. The rise per ${c.one} is ${k}.`;
          if (hard && v === top + k) return `${v} is the value for 5 ${c.many}. Keep going until you reach ${ask} ${c.many}, or substitute into the rule.`;
          if (!hard && (v === k * (ask - 1) + b || v === k * (ask + 1) + b)) return `That is the height of a neighboring point. Make sure you are directly above ${ask}.`;
          return hard ? `Find the rate (rise per ${c.one}) and the starting value from the graph, then substitute ${ask}.` : `Go up from ${ask} on the horizontal axis and read the height carefully.${scaleNote(top)}`;
        },
      },
    };
  });

  // ---------- Trend statement true/false (tf; hard: points shown every 2 across) ----------
  G.define('v2_trendTf', (r, o) => {
    const hard = !!o.hard;
    const c = r.pick(CTX),
      n = r.pick(NAMES);
    const k = hard ? r.int(2, 4) : r.int(2, 4);
    let b = r.int(1, 4);
    if (b === k) b = k + 1;
    const truthy = r.chance(0.5);
    const claimed = truthy ? k : hard ? r.pick([2 * k, 2 * k, b]) : r.pick([b, k + b]);
    const xs = hard ? [0, 2, 4] : [0, 1, 2, 3, 4];
    const shown = pts(k, b, xs);
    const reasons = hard
      ? r.shuffle([
          { html: `True. Each time the ${c.xw} goes up by 1, the ${c.yw} rises by ${k}.`, correct: truthy },
          { html: truthy ? `False. The points rise ${2 * k} each time, so each 1 ${c.one} adds ${2 * k}, not ${k}.` : `False. The points are 2 apart across and rise ${2 * k} each time, so each 1 ${c.one} adds ${k}, not ${claimed}.`, correct: !truthy },
          { html: `True. The points shown rise by ${2 * k} from one to the next, so that is the change.`, correct: false },
          { html: `False. The graph starts at ${b}, so it cannot rise by a steady amount.`, correct: false },
        ])
      : r.shuffle([
          { html: `True. From each point to the next, the ${c.yw} rises by ${k}.`, correct: truthy },
          { html: truthy ? `False. From each point to the next, the ${c.yw} rises by ${k + b}, not ${k}.` : `False. From each point to the next, the ${c.yw} rises by ${k}, not ${claimed}.`, correct: !truthy },
          { html: 'True. The line goes up, so any increase is correct.', correct: false },
          { html: `False. The graph starts at ${b}, so it cannot rise by a steady amount.`, correct: false },
        ]);
    return {
      type: 'tf',
      skill: 'graph-read',
      lesson: '9-2',
      title: 'Describe the trend',
      prompt: `<p>${n} graphed the ${c.yw}${hard ? ` for 0, 2, and 4 ${c.many}` : ''}.</p>${graphFor(c, [{ points: shown, line: true }], 5, k * 4 + b, 270)}<p>True or false: <b>As the ${c.xw} increases by 1, the ${c.yw} increases by ${claimed} each time.</b></p>`,
      statement: `As the ${c.xw} increases by 1, the ${c.yw} increases by ${claimed} each time.`,
      answer: truthy,
      reasons,
      hints: [
        hard ? 'Pick two points that are next to each other. How much higher is the second one, and how far apart are they across?' : 'Pick two points that are next to each other. How much higher is the second one?',
        hard
          ? `Above 2 the point is at ${2 * k + b}. Above 4 it is at ${4 * k + b}. Subtract, then think about how many ${c.many} that covers.`
          : `Above 1 the point is at ${k + b}. Above 2 it is at ${2 * k + b}. Subtract.`,
        hard ? `${4 * k + b} − ${2 * k + b} = ${2 * k} for 2 ${c.many}. Split that to get the change for 1, then compare with the statement.` : `${2 * k + b} − ${k + b} = ${k}. Compare that with the statement.`,
      ],
      hintEs: hard
        ? 'Elige dos puntos que estén uno al lado del otro. ¿Cuánto más alto está el segundo, y cuánto se separan hacia la derecha?'
        : 'Elige dos puntos que estén uno al lado del otro. ¿Cuánto más alto está el segundo?',
      solution: truthy
        ? `<p><b>True.</b> The heights are ${shown.map((p) => p[1]).join(', ')}.${hard ? ` Each shown step covers 2 ${c.many} and rises ${2 * k}, so 1 ${c.one} adds ${k}.` : ` Each step up is ${k}.`} The ${c.yw} rises ${k} for every 1 ${c.one}.</p>`
        : `<p><b>False.</b> The heights are ${shown.map((p) => p[1]).join(', ')}.${hard ? ` Each shown step covers 2 ${c.many} and rises ${2 * k}, so 1 ${c.one} adds ${k}, not ${claimed}.` : ` Each step is ${k}, not ${claimed}.`} ${
            claimed === b ? `${b} is the starting value, where the line meets the vertical axis.` : claimed === 2 * k ? `${2 * k} is the change for 2 ${c.many}, not for 1.` : `${k + b} is the value for 1 ${c.one}, not the change between points.`
          }</p>`,
      feedback: {
        correct: 'Correct, with the right reason. The trend is the steady change in y for each 1 across.',
        wrong(ans, d) {
          const pick = reasons[ans && ans.reason];
          if (!d.valueOk) return hard ? `The points shown are 2 apart across. Find the rise between them, then split it to get the change for 1 ${c.one}.` : `Subtract the heights of two neighboring points: ${2 * k + b} − ${k + b}. That is the real step.`;
          if (pick && /from one to the next, so that is the change/.test(pick.html)) return `Your true/false choice is right, but ${2 * k} is the rise for 2 ${c.many}. Pick the reason about the change for 1 ${c.one}.`;
          return 'Your true/false choice is right, but the reason should talk about the steady change for each 1 across.';
        },
      },
    };
  });

  // ---------- Graph to table (table; hard: steeper rule, two inputs far past the graph) ----------
  G.define('v2_graphToTable', (r, o) => {
    const hard = !!o.hard;
    const c = r.pick(CTX),
      n = r.pick(NAMES);
    const b = hard ? r.int(1, 4) : r.chance(0.5) ? r.int(1, 4) : 0;
    const k = hard ? r.int(3, 5) : b ? r.int(1, 4) : r.int(2, 4);
    const shown = pts(k, b, [0, 1, 2, 3, 4]);
    const xs = hard ? [0, 2, 3, 7, 9] : [1, 2, 3, 4, 6];
    const top = k * 4 + b;
    return {
      type: 'table',
      skill: 'graph-read',
      lesson: '9-2',
      title: 'Build the table from the graph',
      prompt: `<p>${n} graphed the ${c.yw} for 0 to 4 ${c.many}. Use the graph to complete the table. ${hard ? 'The last two columns are' : 'The last column is'} beyond the graph; use the pattern.</p>${graphFor(c, [{ points: shown, line: true }], 5, top, 270)}`,
      rows: [
        [c.xLabel, ...xs.map(String)],
        [c.yLabel, ...xs.map((x) => `__IN:y${x}__`)],
      ],
      rowHeader: true,
      inputs: xs.map((x) => ({ id: 'y' + x, answer: k * x + b })),
      hints: [
        'For each number across, find the point above it and read its height on the vertical axis.',
        `Above 1 the point is at ${k + b}. Above 2 it is at ${2 * k + b}. The step is ${k}.${scaleNote(top)}`,
        hard
          ? `7 and 9 are off the graph. Use the starting value (${b}) and the step (${k}) to write the rule, then substitute 7 and 9.`
          : `6 is off the graph. Keep adding ${k} for each extra ${c.one}: after 4 (${4 * k + b}) comes 5 (${5 * k + b}), then 6.`,
      ],
      hintEs: 'Para cada número del eje horizontal, busca el punto que está encima y lee su altura en el eje vertical.',
      solution: `<p>Reading the points: ${[0, 1, 2, 3, 4].filter((x) => hard || x > 0).map((x) => `${x} → ${k * x + b}`).join(', ')}. The step is ${k} per ${c.one}${b ? ` with a starting value of ${b}` : ''}, so the rule is ${eq(k, b, c.yv, c.xv)}. ${xs
        .filter((x) => x > 4)
        .map((x) => `${x} → ${subst(k, b, x)} = <b>${k * x + b}</b>`)
        .join('; ')}.</p>`,
      feedback: {
        correct: `Correct. The graph and the table show the same rule: ${eq(k, b, c.yv, c.xv)}.`,
        wrong(ans, d) {
          const x = Number(d.wrong[0].slice(1)),
            v = parseNum(ans[d.wrong[0]]);
          if (x > 4) {
            if (b && v === k * x) return `For ${x} ${c.many} you forgot the starting value ${b}.`;
            if (v === 4 * k + b + k) return `${v} is only one step past the graph (5 ${c.many}). Keep going to ${x}, or use the rule.`;
            return `${x} is beyond the graph. Use the rule: start at ${b} and add ${k} for each ${c.one}.`;
          }
          if (v === x) return `${x} is the ${c.xw}. Read the height of the point above it for the ${c.yw}.`;
          return `Look directly above ${x} on the horizontal axis and read the height of that point.${scaleNote(top)}`;
        },
      },
    };
  });

  // ---------- Compare two lines (mc; normal: which rises faster? hard: where do they meet?) ----------
  G.define('v2_compareLines', (r, o) => {
    const hard = !!o.hard;
    const c = r.pick(CTX);
    let kSlow, kFast, bSlow, bFast, m, d;
    if (hard) {
      kSlow = r.int(1, 3);
      d = r.int(1, 2);
      kFast = kSlow + d;
      m = r.int(2, 4);
      bFast = r.int(0, 2);
      bSlow = bFast + d * m;
    } else {
      [kSlow, kFast] = r.pickN([1, 2, 3, 4], 2).sort((a, z) => a - z);
      bSlow = r.int(3, 5);
      bFast = 0;
    }
    const fastIsA = r.chance(0.5);
    const A = fastIsA ? { k: kFast, b: bFast } : { k: kSlow, b: bSlow };
    const B = fastIsA ? { k: kSlow, b: bSlow } : { k: kFast, b: bFast };
    const fast = fastIsA ? 'A' : 'B',
      slow = fastIsA ? 'B' : 'A';
    const yTop = Math.max(A.k * 4 + A.b, B.k * 4 + B.b);
    const graph = graphFor(
      c,
      [
        { points: pts(A.k, A.b, [0, 1, 2, 3, 4]), line: true, label: 'Route A', color: '#1FA6A2' },
        { points: pts(B.k, B.b, [0, 1, 2, 3, 4]), line: true, label: 'Route B', color: '#C8553D', dashed: true },
      ],
      5,
      yTop,
      300,
    );
    let opts, prompt, hints, hintEs, solution, title;
    if (hard) {
      const Y = kFast * m + bFast;
      const gap = bSlow - bFast;
      const cands = [
        { v: m, html: `At ${count(c, m)}, where both lines pass through the same point, (${m}, ${Y}).`, ok: true },
        { v: Y, html: `At ${count(c, Y)}, because both lines reach a height of ${Y} on the grid.`, why: `${Y} is the ${c.yw} where the lines meet, a height on the vertical axis. The question asks for the ${c.xw}, which you read on the horizontal axis.` },
        { v: gap, html: `At ${count(c, gap)}, because that is the gap between where the two lines start.`, why: `The starting gap, ${gap}, is measured up the vertical axis. Route ${fast} closes it by ${d} each ${c.one}, so it takes ${gap} ÷ ${d} ${c.many}.` },
        { v: m + 1, html: `At ${count(c, m + 1)}, the first place where Route ${fast} is above Route ${slow}.`, why: `At ${m + 1} ${c.many}, Route ${fast} is already ahead. The routes are equal one ${c.one} earlier, where the lines cross.` },
        { v: m - 1, html: `At ${count(c, m - 1)}, the last place where Route ${slow} is still above Route ${fast}.`, why: `At ${m - 1} ${c.many}, Route ${slow} is still ahead, so the two routes are not equal yet.` },
      ];
      const seen = new Set();
      opts = cands.filter((cd) => (seen.has(cd.v) ? false : (seen.add(cd.v), true))).slice(0, 4);
      title = 'Where do the routes meet?';
      prompt = `<p>Two sky-tram routes are graphed on the same grid. For each route, the vertical axis shows the ${c.yw}.</p>${graph}<p>For what ${c.xw} do the two routes have the <b>same</b> ${c.yw}?</p>`;
      hints = [
        'Two lines meet where they have the same y-value for the same x-value. Find where the lines cross, then read the horizontal axis.',
        `Route ${slow} starts at ${bSlow} and rises ${kSlow} per ${c.one}. Route ${fast} starts at ${bFast} and rises ${kFast} per ${c.one}. The gap at 0 is ${gap}, and it shrinks by ${d} each ${c.one}.`,
        `Divide the starting gap by how much it shrinks each ${c.one}: ${gap} ÷ ${d}. Then check that both lines give the same height there.`,
      ];
      hintEs = 'Dos líneas se encuentran donde tienen el mismo valor de y para el mismo valor de x. Busca dónde se cruzan las líneas y luego lee el eje horizontal.';
      solution = `<p>Route ${slow} starts ${gap} higher, but Route ${fast} gains ${kFast} − ${kSlow} = ${d} each ${c.one}. The gap closes after ${gap} ÷ ${d} = <b>${count(c, m)}</b>. Check: Route ${fast} gives ${subst(kFast, bFast, m)} = ${Y}; Route ${slow} gives ${subst(kSlow, bSlow, m)} = ${Y}. The lines cross at (${m}, ${Y}).</p>`;
    } else {
      opts = [
        { html: `Route ${fast}, because its line rises ${kFast} for each ${c.one} and the other rises ${kSlow}.`, ok: true },
        {
          html: `Route ${slow}, because its line starts higher, at ${bSlow} on the vertical axis, before any ${c.many}.`,
          why: `Starting higher means a bigger starting value (${bSlow}), not a faster rate. Rate is how much the line rises for each step across.`,
        },
        {
          html: `Route ${slow}, because its point above 1 ${c.one} is higher on the grid than the other route's point.`,
          why: `The height of one point mixes the starting value with the rate. Compare the <b>change</b> from one point to the next instead: Route ${slow} rises ${kSlow} each step; Route ${fast} rises ${kFast}.`,
        },
        {
          html: 'Both routes rise at the same rate, because both graphs are straight lines that never bend.',
          why: 'Straight lines mean each route has a steady rate, but the rates can be different. The steeper line rises faster.',
        },
      ];
      title = 'Which rises faster?';
      prompt = `<p>Two sky-tram routes are graphed on the same grid. For each route, the vertical axis shows the ${c.yw}.</p>${graph}<p>On which route does the ${c.yw} increase faster per ${c.one}?</p>`;
      hints = [
        `"Faster per ${c.one}" means a bigger rate of change: the bigger step up for each 1 across. Do not look at where the lines start.`,
        `Route A rises from ${A.b} to ${A.k + A.b} between 0 and 1: a step of ${A.k}. Route B rises from ${B.b} to ${B.k + B.b}: a step of ${B.k}.`,
        'Compare the two steps. The route with the bigger step has the steeper line.',
      ];
      hintEs = `"Más rápido por ${c.oneEs}" quiere decir una tasa de cambio mayor: cuánto más sube por cada 1 hacia la derecha. No mires dónde empiezan las líneas.`;
      solution = `<p>Route A rises ${A.k} per ${c.one}; Route B rises ${B.k} per ${c.one}. <b>Route ${fast}</b> increases faster. Route ${slow} starts higher (${bSlow}) but climbs more slowly: on a graph, rate is steepness, not starting height.</p>`;
    }
    const sh = shuffleOptions(r, opts, 0);
    return {
      type: 'mc',
      skill: 'compare-rates',
      lesson: '9-2',
      title,
      prompt,
      options: sh.options,
      answer: sh.answer,
      hints,
      hintEs,
      solution,
      feedback: {
        correct: hard ? 'Correct. Two lines are equal where they cross: same input, same output.' : 'Correct. Rate of change is steepness. Where a line starts is its starting value, which is a different thing.',
        wrong(ans) {
          return (sh.options[ans] && sh.options[ans].why) || (hard ? 'Find where the two lines cross, then read the horizontal axis.' : 'Compare how much each line rises for each 1 across.');
        },
      },
    };
  });

  // ---------- Choose the graph that matches a story (rep; hard: bigger start and an almost-right rate) ----------
  G.define('v2_storyToGraph', (r, o) => {
    const hard = !!o.hard;
    const c = r.pick(CTX),
      n = r.pick(NAMES);
    const k = hard ? r.int(2, 3) : r.int(1, 3);
    let b = hard ? r.int(4, 5) : r.int(2, 4);
    if (b === k) b = k + 1;
    const xs = [0, 1, 2, 3, 4];
    const yTop = Math.max(k * 4 + b, b * 4 + k, hard ? (k + 1) * 4 + b : k * 4 + k);
    const mk = (kk, bb) => graphFor(c, [{ points: pts(kk, bb, xs), line: true }], 5, yTop, 200);
    const opts = [
      { html: mk(k, b), ok: true },
      { html: mk(k, 0), why: `This graph starts at 0, but the story starts at ${b} before any ${c.many}. The point for 0 ${c.many} should be (0, ${b}).` },
      { html: mk(b, k), why: `This graph has the numbers swapped: it starts at ${k} and rises ${b} each ${c.one}. The story starts at ${b} and rises ${k} each ${c.one}.` },
    ];
    if (hard) opts.push({ html: mk(k + 1, b), why: `This graph starts at ${b}, which is right, but it rises ${k + 1} each ${c.one}. Check the second point: it should be (1, ${k + b}).` });
    const sh = shuffleOptions(r, opts, 0);
    return {
      type: 'rep',
      skill: 'graph-plot',
      lesson: '9-2',
      title: 'Match the story to its graph',
      prompt: `<p>${c.aff(n, k, b)}</p><p>Which graph shows this relationship for 0 to 4 ${c.many}?</p>`,
      options: sh.options,
      answer: sh.answer,
      layout: 'cards',
      hints: [
        `Start with 0 ${c.many}. What is the ${c.yw} before any ${c.one} is counted?`,
        `At 0 ${c.many} the ${c.yw} is ${b}, so the graph should begin at (0, ${b}) on the vertical axis.${scaleNote(yTop)}`,
        `Then each ${c.one} adds ${k}: the next point is (1, ${k + b}). Only one graph has both.`,
      ],
      hintEs: `Empieza con 0 ${c.manyEs}. ¿Cuánto es ${c.ywEs} antes de contar ${c.manyEs}?`,
      solution: `<p>The story gives ${eq(k, b, c.yv, c.xv)}: a starting value of ${b} and a rate of ${k} per ${c.one}. The correct graph starts at (0, ${b}) and rises ${k} each step: ${pts(k, b, xs).map(pairText).join(', ')}.</p>`,
      feedback: {
        correct: 'Correct. The starting value is where the line meets the vertical axis; the rate is how much it rises each step.',
        wrong(ans) {
          return (sh.options[ans] && sh.options[ans].why) || `Check two points: (0, ${b}) and (1, ${k + b}).`;
        },
      },
    };
  });

  // ---------- Order relationships by rate (seq; hard: starting values hide the rate) ----------
  G.define('v2_seqSteep', (r, o) => {
    const hard = !!o.hard;
    const c = r.pick(CTX),
      [n1, n2, n3] = r.pickN(NAMES, 3);
    const rates = r.pickN(hard ? [2, 3, 4, 5] : [2, 3, 4, 5, 6], 3);
    const bW = hard ? r.int(2, 9) : 0,
      bG = hard ? r.int(1, 4) : 0,
      bT = hard ? r.int(1, 6) : 0;
    const gx = hard ? [0, 1, 2, 3, 4] : [1, 2, 3, 4];
    const g = grid(rates[1] * 4 + bG);
    const tx = [2, 5];
    const items = [
      { html: `<b>${n1}'s route:</b> ${hard ? `starts at ${bW} ${c.yu}, then ` : ''}${rates[0]} ${c.yu} for every ${c.one}`, rate: rates[0] },
      {
        html: `<b>${n2}'s route:</b>${V.graph({ xLabel: c.xLabel, yLabel: c.yLabel, xMax: 4, yMax: g.yMax, yStep: g.yStep, size: 150, series: [{ points: pts(rates[1], bG, gx), line: true }] })}`,
        rate: rates[1],
      },
      {
        html: `<b>${n3}'s route:</b>${V.table(
          [
            [c.xLabel, ...tx.map(String)],
            [c.yLabel, ...tx.map((x) => String(rates[2] * x + bT))],
          ],
          { header: false, rowHeader: true, cls: 'mini' },
        )}`,
        rate: rates[2],
      },
    ];
    const order = [0, 1, 2].sort((a, z) => items[a].rate - items[z].rate);
    const atOne = [rates[0] + bW, rates[1] + bG, rates[2] + bT];
    const trap = [0, 1, 2].sort((a, z) => atOne[a] - atOne[z]);
    const names = [n1, n2, n3];
    return {
      type: 'seq',
      skill: 'compare-rates',
      lesson: '9-2',
      title: 'Order the routes by rate',
      prompt: `<p>Three operators describe their routes in different ways${hard ? ', and some routes do not start at zero' : ''}. Order the routes from the <b>slowest</b> rate (top) to the <b>fastest</b> rate (bottom): ${c.yu} per ${c.one}.</p>`,
      items,
      order,
      hints: [
        `Find the rate for each route: how many ${c.yu} for 1 ${c.one}.` + (hard ? ' Do not count the starting value.' : ''),
        hard
          ? `${n2}: subtract the heights of two neighboring points. ${n3}: subtract the two values and divide by 3, because the ${c.xw} goes from 2 to 5.`
          : `${n2}: read the point above 1 on the graph. ${n3}: divide ${rates[2] * 2} by 2.`,
        hard ? `${n3}: (${rates[2] * 5 + bT} − ${rates[2] * 2 + bT}) ÷ 3. Then put the smallest rate first.` : `Rates: ${n1} ${rates[0]}, ${n2} ${rates[1]}, ${n3} ${rates[2]}. Put the smallest first.`,
      ],
      hintEs: `Halla la tasa de cada ruta: el número de ${c.yuEs} por cada ${c.oneEs}.` + (hard ? ' No cuentes el valor inicial.' : ''),
      solution: hard
        ? `<p>${n1}: ${rates[0]} per ${c.one} (the ${bW} at the start is not part of the rate). ${n2}: the graph rises ${rates[1]} from one point to the next. ${n3}: (${rates[2] * 5 + bT} − ${rates[2] * 2 + bT}) ÷ 3 = ${rates[2]} per ${c.one}. Slowest to fastest: <b>${order.map((i) => names[i]).join(', ')}</b>.</p>`
        : `<p>${n1}: ${rates[0]} per ${c.one}. ${n2}: the point (1, ${rates[1]}) gives ${rates[1]} per ${c.one}. ${n3}: ${rates[2] * 2} ÷ 2 = ${rates[2]} per ${c.one}. Slowest to fastest: <b>${order.map((i) => names[i]).join(', ')}</b>.</p>`,
      feedback: {
        correct: 'Correct. Words, a graph, and a table can all show a rate. Finding the change for 1 makes them comparable.',
        wrong(ans) {
          const a = Array.isArray(ans) ? ans.join() : '';
          if (a === order.slice().reverse().join()) return 'Your order is reversed. The top should be the slowest rate, the bottom the fastest.';
          if (hard && a === trap.join() && a !== order.join()) return `You ordered the routes by their totals for 1 ${c.one}. Those totals include starting values. Compare only the change for each extra ${c.one}.`;
          return `Find each rate for 1 ${c.one}, then order from smallest to largest.${hard ? ' For the table, the ' + c.xw + ' jumps by 3, so divide the change by 3.' : ''}`;
        },
      },
    };
  });

  // ---------- Whose graph matches the table? (who; hard: three graphs, one with an almost-right rate) ----------
  G.define('v2_whoGraph', (r, o) => {
    const hard = !!o.hard;
    const c = r.pick(CTX),
      [n0, n1, n2, n3] = r.pickN(NAMES, 4);
    const k = hard ? r.int(2, 3) : r.int(1, 3);
    let b = hard ? r.int(3, 5) : r.int(2, 4);
    if (b === k) b = k + 1;
    const xs = [0, 1, 2, 3, 4];
    const yTop = hard ? (k + 1) * 4 + b : k * 4 + b;
    const mk = (kk, bb) => graphFor(c, [{ points: pts(kk, bb, xs), line: true }], 5, yTop, 210);
    const opts = [
      { title: n1, html: mk(k, b), ok: true },
      { title: n2, html: mk(k, 0), why: `${n2} started the line at (0, 0), but the table shows ${b} at 0 ${c.many}. Every point is ${b} too low.` },
    ];
    if (hard) opts.push({ title: n3, html: mk(k + 1, b), why: `${n3} started at the right height, ${b}, but the line rises ${k + 1} each ${c.one}. The table rises ${k}.` });
    const sh = shuffleOptions(r, opts, 0);
    return {
      type: 'who',
      skill: 'graph-plot',
      lesson: '9-2',
      title: 'Whose graph is correct?',
      prompt: `<p>${c.aff(n0, k, b)} ${hard ? 'Three' : 'Two'} students graphed the table.</p>${tbl(rows(c, k, b, xs))}<p>Whose graph matches the table?</p>`,
      options: sh.options,
      answer: sh.answer,
      layout: 'cards',
      hints: [
        `Check the first column: 0 ${c.many} → ${b}. Where should the first point be?`,
        `The first point is (0, ${b}): on the vertical axis at height ${b}, not at the origin.${scaleNote(yTop)}`,
        hard ? `Then check a second point, (1, ${k + b}). Only one graph has both.` : 'Only one graph starts at the right height.',
      ],
      hintEs: `Revisa la primera columna: 0 ${c.manyEs} → ${b}. ¿Dónde debe estar el primer punto?`,
      solution: `<p><b>${n1}</b> is correct. The table starts at (0, ${b}) and rises ${k} each ${c.one}. ${n2} drew a line through (0, 0), which ignores the starting value of ${b}.${hard ? ` ${n3} started at ${b} but rose ${k + 1} each ${c.one}.` : ''}</p>`,
      feedback: {
        correct: 'Correct. Not every relationship starts at (0, 0). Check the first column and a second point.',
        wrong(ans) {
          return (sh.options[ans] && sh.options[ans].why) || `Check (0, ${b}) and (1, ${k + b}) on each graph.`;
        },
      },
    };
  });
})(typeof window !== 'undefined' ? window : globalThis);

/* js/units/u9/gen-equations-lib.js */
/* Zone 3 — The Rule Works. Lesson 9-3 Write Equations to Represent Relationships Between Two Variables (Equations from Tables · Equations from Situations). */
/* Shared helpers for gen-equations.js and gen-equations-2.js (split for size). */
(function (root) {
  'use strict';
  const RX = root.RX;
  const { G, V, shuffleOptions, NAMES, parseNum } = RX;
  const { CTX, eq, yWord, de, grid, rows } = RX.U9;
  const hl = V.hl;
  const story = (c, n, k, b) => (b ? c.aff(n, k, b) : c.prop(n, k));
  const pts = (k, b, xs) => xs.map((x) => [x, k * x + b]);
  /** Plain x/y table for a rule. */
  const xyTable = (k, b, xs, cls) =>
    V.table(
      [
        ['x', ...xs.map(String)],
        ['y', ...xs.map((x) => String(k * x + b))],
      ],
      { header: false, rowHeader: true, cls: cls || 'compact' },
    );
  /** Expression text for substituting x into y = kx + b, e.g. "3 × 4 + 2". */
  const subst = (k, b, x) => `${k === 1 ? x : k + ' × ' + x}${b ? ' + ' + b : ''}`;
  /** Pick a b different from k. */
  const otherB = (r, k, lo, hi) => {
    let b = r.int(lo, hi);
    if (b === k) b = b === hi ? b - 1 : b + 1;
    return b;
  };
  /** Keep the first option, then only distractors whose text is new. */
  const dedupe = (opts) => {
    const seen = new Set();
    return opts.filter((o) => {
      const t = String(o.html)
        .replace(/<[^>]+>/g, '')
        .trim();
      if (seen.has(t)) return false;
      seen.add(t);
      return true;
    });
  };
  const uniq = (arr) => arr.filter((v, i) => arr.indexOf(v) === i);

  // ---------- Equation from a table: cloze (y = 4x vs y = x + 4; hard: x-values skip) ----------
  // ---------- Equation from a table (mc, honors hard) ----------
  // ---------- Select all tables that fit the rule (ms; hard: bigger rule and an "almost fits" table) ----------
  // ---------- Explain how to find the rate from a table (cr; hard: x-values go up by 2) ----------
  // ---------- Equation from a situation (mc, honors hard) ----------
  // ---------- Rate, starting value, equation from a situation (cloze; hard: starting value not stated) ----------
  // ---------- Error in the equation (error; hard adds "folded the one-time amount into the rate") ----------
  // ---------- Who is correct about the equation's variables (who; hard: equation written as kx + b = y) ----------
  // ---------- Match tables and situations to equations (match; hard: tables skip x-values) ----------
  // ---------- Order relationships by rate (seq; hard: every representation has a starting value) ----------
  // ---------- Complete a table from an equation (table; hard: larger rule, far-apart inputs) ----------
  // ---------- What does a number in the equation mean? (mc; hard: constant written first) ----------
  RX._lib = RX._lib || {};
  RX._lib['u9/gen-equations'] = { G, V, shuffleOptions, NAMES, parseNum, CTX, eq, yWord, de, grid, rows, hl, story, pts, xyTable, subst, otherB, dedupe, uniq };
})(typeof window !== 'undefined' ? window : globalThis);

/* js/units/u9/gen-equations.js */
/* Zone 3 — The Rule Works. Lesson 9-3 Write Equations to Represent Relationships Between Two Variables (Equations from Tables · Equations from Situations). */
(function (root) {
  'use strict';
  const RX = root.RX;
  const { G, V, shuffleOptions, NAMES, parseNum, CTX, eq, yWord, de, grid, rows, hl, story, pts, xyTable, subst, otherB, dedupe, uniq } = RX._lib['u9/gen-equations'];

  G.define('v3_clozeRule', (r, o) => {
    const hard = !!o.hard;
    const kind = r.pick(['mult', 'add', 'both']);
    const k = hard ? r.int(3, 7) : r.int(2, 6);
    const b = otherB(r, k, 2, hard ? 9 : 6);
    const kk = kind === 'add' ? 1 : k;
    const bb = kind === 'mult' ? 0 : b;
    const xs = hard
      ? r.pick([
          [1, 3, 5, 7],
          [2, 4, 6, 8],
          [0, 3, 6, 9],
        ])
      : r.pick([
          [1, 2, 3, 4],
          [0, 1, 2, 3],
          [2, 3, 4, 5],
        ]);
    const dx = xs[1] - xs[0];
    const right = eq(kk, bb);
    const eqPool = hard
      ? kind === 'mult'
        ? [eq(k, 0), eq(1, k), eq(k * dx, 0)]
        : kind === 'add'
          ? [eq(1, b), eq(b, 0), eq(dx, b)]
          : [eq(k, b), eq(b, k), eq(k * dx, b)]
      : kind === 'mult'
        ? [eq(k, 0), eq(1, k), eq(k, k)]
        : kind === 'add'
          ? [eq(1, b), eq(b, 0), eq(b, b)]
          : [eq(k, b), eq(b, k), eq(k, 0)];
    const ratePool = uniq((hard ? [kk, kk * dx, kind === 'add' ? b : k + b, b + 1] : kind === 'mult' ? [k, 1, k + 1] : kind === 'add' ? [1, b, b + 1] : [k, b, k + b]).map(String)).slice(0, 3);
    const c0 = r.shuffle(uniq(eqPool)),
      c1 = r.shuffle(ratePool);
    const y0 = kk * xs[0] + bb,
      y1 = kk * xs[1] + bb;
    return {
      type: 'cloze',
      skill: 'eq-table',
      lesson: '9-3',
      title: 'Write the rule for the table',
      prompt: `<p>This table of values follows one rule.${hard ? ' Look closely at the x-values.' : ''}</p>${xyTable(kk, bb, xs)}<p>Complete the sentences about the rule.</p>`,
      template: 'The equation is {0}. Each time x goes up by 1, y goes up by {1}.',
      choices: [c0, c1],
      answers: [c0.indexOf(right), c1.indexOf(String(kk))],
      hints: [
        'Compare each y with its x. Is y a certain number <b>times</b> x, or a certain number <b>more than</b> x?',
        `When x = ${xs[0]}, y = ${y0}. When x = ${xs[1]}, y = ${y1}. Try each equation with x = ${xs[1]}: which one gives ${y1}?`,
        hard
          ? `From one column to the next, y goes up by ${y1 - y0}, but x goes up by ${dx}. Divide to find the change for each 1.`
          : kind === 'mult'
            ? `${y1} = ${k} × ${xs[1]}, and every other column works the same way. Now subtract neighboring y-values.`
            : kind === 'add'
              ? `${y1} = ${xs[1]} + ${b}, and every other column works the same way. Now subtract neighboring y-values.`
              : `${y1} = ${k} × ${xs[1]} + ${b}. Now subtract neighboring y-values to see the steady change.`,
      ],
      hintEs: 'Compara cada y con su x. ¿Es y cierto número de <b>veces</b> x, o cierto número <b>más que</b> x?',
      solution: `<p>Test the rule on two columns: x = ${xs[0]} → ${subst(kk, bb, xs[0])} = ${y0}; x = ${xs[1]} → ${subst(kk, bb, xs[1])} = ${y1}. Both work, so the equation is <b>${right}</b>. ${
        hard
          ? `y goes up by ${y1 - y0} while x goes up by ${dx}, so for each 1, y goes up by ${y1 - y0} ÷ ${dx} = <b>${kk}</b>.`
          : kind === 'add'
            ? 'Adding the same number means y goes up by <b>1</b> each time x goes up by 1.'
            : `Multiplying by ${k} means y goes up by <b>${k}</b> each time x goes up by 1.`
      }</p>`,
      feedback: {
        correct: 'Correct. "Times" and "more than" make very different rules, and testing two columns tells them apart.',
        wrong(ans, d) {
          const pickE = Array.isArray(ans) ? c0[ans[0]] : undefined,
            pickR = Array.isArray(ans) ? Number(c1[ans[1]]) : NaN;
          if (d.wrong.includes(0)) {
            if (hard && pickE && pickE.includes(String(kk * dx)) && dx > 1)
              return `${pickE} uses the jump between columns, ${kk * dx}, but x goes up by ${dx} there, not 1. Test it with x = ${xs[1]}: it does not give ${y1}.`;
            return `Test your equation with x = ${xs[1]}. The table says y = ${y1}. Does your equation give ${y1}?`;
          }
          if (dx > 1 && pickR === kk * dx) return `${kk * dx} is the jump between columns, but x goes up by ${dx} there. Divide by ${dx} to get the change for each 1.`;
          if (pickR === b && kind !== 'add') return `${b} is the starting value, added once. The change for each 1 is the number that multiplies x.`;
          return `Subtract neighboring y-values and divide by how much x went up. That is how much y goes up for each 1.`;
        },
      },
    };
  });

  G.define('v3_mcEquation', (r, o) => {
    const hard = !!o.hard;
    const k = hard ? r.int(3, 7) : r.int(2, 5);
    const b = hard ? otherB(r, k, 2, 9) : r.chance(0.6) ? otherB(r, k, 1, 5) : 0;
    const xs = hard
      ? r.pick([
          [1, 3, 5, 7],
          [2, 4, 6, 8],
        ])
      : r.pick([
          [1, 2, 3, 4],
          [0, 1, 2, 3],
        ]);
    const dx = xs[1] - xs[0];
    const jump = k * dx;
    const base = b
      ? [
          { html: eq(k, b), ok: true },
          { html: eq(b, k), why: `This swaps the two numbers. ${b} is added once (the starting value); ${k} is the amount y changes each time x goes up by 1.` },
          { html: eq(k, 0), why: `Try x = ${xs[1]}: ${k} × ${xs[1]} = ${k * xs[1]}, but the table says ${k * xs[1] + b}. Every y is ${b} more than ${k}x, so the equation needs + ${b}.` },
          { html: eq(1, b), why: `This rule only adds ${b}, so y would go up by 1 each step. In the table, y goes up by ${jump} when x goes up by ${dx}.` },
        ]
      : [
          { html: eq(k, 0), ok: true },
          { html: eq(1, k), why: `This adds ${k} instead of multiplying. For x = ${xs[1]} it gives ${xs[1] + k}, but the table says ${k * xs[1]}.` },
          { html: eq(k, k), why: `For x = ${xs[1]} this gives ${k * xs[1] + k}, which is ${k} too many. Each y is exactly ${k} times its x, with nothing added.` },
          { html: eq(k + 1, 0), why: `Check x = ${xs[1]}: ${k + 1} × ${xs[1]} = ${(k + 1) * xs[1]}, not ${k * xs[1]}. The multiplier is ${k}.` },
        ];
    if (dx > 1) base.splice(1, 0, { html: eq(jump, b), why: `y goes up by ${jump} between columns, but x goes up by ${dx}, not 1. The rate per 1 is ${jump} ÷ ${dx} = ${k}.` });
    const opts = dedupe(base).slice(0, 4);
    const sh = shuffleOptions(r, opts, 0);
    return {
      type: 'mc',
      skill: 'eq-table',
      lesson: '9-3',
      title: 'Which equation fits the table?',
      prompt: `<p>Which equation describes the relationship between x and y in this table?</p>${xyTable(k, b, xs)}`,
      options: sh.options,
      answer: sh.answer,
      hints: [
        'Pick one column and substitute its x into each equation. Keep only the equations that give the right y.',
        `Try x = ${xs[1]}. The table says y = ${k * xs[1] + b}.${dx > 1 ? ` Remember that x goes up by ${dx} between columns, so the jump in y is not the rate per 1.` : ''}`,
        `Then check a second column, x = ${xs[2]}: y should be ${k * xs[2] + b}. Only one equation passes both tests.`,
      ],
      hintEs: 'Elige una columna y sustituye su x en cada ecuación. Quédate solo con las ecuaciones que dan la y correcta.',
      solution: `<p>Test two columns. x = ${xs[1]}: ${subst(k, b, xs[1])} = ${k * xs[1] + b}. x = ${xs[2]}: ${subst(k, b, xs[2])} = ${k * xs[2] + b}. Both match, so the equation is <b>${eq(k, b)}</b>. ${
        b ? `The rate of change is ${k} and the starting value is ${b}.` : `y is always ${k} times x, so the rate is ${k} and there is no starting value.`
      }</p>`,
      feedback: {
        correct: 'Correct. An equation has to work for every column, so testing two columns is a strong check.',
        wrong(ans) {
          return (sh.options[ans] && sh.options[ans].why) || `Substitute x = ${xs[1]} into your equation and compare with the table.`;
        },
      },
    };
  });

  G.define('v3_msTables', (r, o) => {
    const hard = !!o.hard;
    const isMult = r.chance(0.6);
    const k = hard ? r.int(4, 9) : r.int(2, 5);
    const b = otherB(r, k, hard ? 4 : 2, hard ? 9 : 6);
    const rule = isMult ? eq(k, 0) : eq(1, b);
    const kk = isMult ? k : 1,
      bb = isMult ? 0 : b;
    const fitXs = hard
      ? [
          [2, 5, 9],
          [3, 4, 8],
          [0, 6, 7],
          [1, 5, 10],
        ]
      : [
          [1, 2, 3],
          [2, 4, 5],
          [0, 3, 6],
          [1, 3, 5],
        ];
    const fitPool = fitXs.map((xs) => ({ k: kk, b: bb, xs }));
    const nonPool = isMult
      ? [
          { k: 1, b: k, xs: [1, 2, 3], why: `adds ${k} to x instead of multiplying by ${k}` },
          { k: k, b: k, xs: [1, 2, 3], why: `has ${k} added on top of ${k}x` },
          { k: k + 1, b: 0, xs: [1, 2, 3], why: `multiplies by ${k + 1}, not ${k}` },
          { k: k, b: 0, xs: [1, 2, 3], swap: true, why: `has the rows swapped: here x is ${k} times y` },
        ]
      : [
          { k: b, b: 0, xs: [1, 2, 3], why: `multiplies by ${b} instead of adding ${b}` },
          { k: 1, b: b + 1, xs: [1, 2, 3], why: `adds ${b + 1}, not ${b}` },
          { k: b, b: b, xs: [1, 2, 3], why: `multiplies by ${b} and then adds ${b}` },
          { k: 1, b: b, xs: [1, 2, 3], swap: true, why: `has the rows swapped: here x is ${b} more than y` },
        ];
    const nFit = r.int(1, 3);
    const fits = r.pickN(fitPool, nFit).map((t) => ({ ...t, ok: true }));
    const nons = hard ? [{ k: kk, b: bb, xs: [2, 3, 6], off: 1, why: 'fits the first two columns but not the last one' }, ...r.pickN(nonPool, 4 - nFit)] : r.pickN(nonPool, 5 - nFit);
    const yOf = (t, x, i) => t.k * x + t.b + (t.off && i === t.xs.length - 1 ? t.off : 0);
    const mk = (t) => {
      const xr = t.xs.map(String),
        yr = t.xs.map((x, i) => String(yOf(t, x, i)));
      return V.table(
        [
          ['x', ...(t.swap ? yr : xr)],
          ['y', ...(t.swap ? xr : yr)],
        ],
        { header: false, rowHeader: true, cls: 'mini' },
      );
    };
    const all = [...fits, ...nons].map((t) => ({ html: mk(t), ok: !!t.ok, meta: t }));
    const sh = shuffleOptions(
      r,
      all,
      all.map((t, i) => (t.ok ? i : -1)).filter((i) => i >= 0),
    );
    const ruleWords = isMult ? `y is ${k} times x` : `y is ${b} more than x`;
    const ruleEs = isMult ? `y es ${k} veces x` : `y es ${b} más que x`;
    return {
      type: 'ms',
      skill: 'eq-table',
      lesson: '9-3',
      title: 'Which tables fit the rule?',
      prompt: `<p>Select <b>every</b> table that fits the equation ${hl(rule)}. There may be more than one.</p>`,
      options: sh.options,
      answers: sh.answers,
      layout: 'cards',
      hints: [
        `${rule} means ${ruleWords}. Check every column of a table, not just the first.`,
        `For each column ask: is y equal to ${isMult ? k + ' × x' : 'x + ' + b}? If even one column fails, the table does not fit.`,
        'Watch for tables where x and y are swapped. The x row is on top.',
      ],
      hintEs: `${rule} quiere decir que ${ruleEs}. Revisa cada columna de una tabla, no solo la primera.`,
      solution: `<p>${rule} means ${ruleWords}. Table${nFit > 1 ? 's' : ''} <b>${sh.answers.map((i) => i + 1).join(', ')}</b> ${nFit > 1 ? 'fit' : 'fits'}: every y equals ${isMult ? k + ' times' : b + ' more than'} its x. The other tables each break the rule in at least one column: ${sh.options
        .filter((op) => !op.ok)
        .map((op) => `one ${op.meta.why}`)
        .join('; ')}.</p>`,
      feedback: {
        correct: 'Correct. A table fits an equation only if every single column makes the equation true.',
        wrong(ans, d) {
          if (d.extra && d.extra.length) {
            const t = sh.options[d.extra[0]].meta;
            if (t.off) {
              const last = t.xs.length - 1;
              return `Table ${d.extra[0] + 1} does not fit. Its first two columns work, but its last column has x = ${t.xs[last]} and y = ${yOf(t, t.xs[last], last)}, and ${rule} gives ${kk * t.xs[last] + bb}. Check every column.`;
            }
            const x0 = t.swap ? t.k * t.xs[0] + t.b : t.xs[0];
            const y0 = t.swap ? t.xs[0] : t.k * t.xs[0] + t.b;
            return `Table ${d.extra[0] + 1} does not fit. Its first column has x = ${x0} and y = ${y0}, but ${rule} would give y = ${kk * x0 + bb}. That table ${t.why}.`;
          }
          if (d.missing && d.missing.length)
            return `You missed a table that fits. In Table ${d.missing[0] + 1}, every y is ${isMult ? k + ' times' : b + ' more than'} its x, even though its x-values are not 1, 2, 3. Check each column.`;
          return `Test every column against ${rule}.`;
        },
      },
    };
  });

  G.define('v3_crRate', (r, o) => {
    const hard = !!o.hard;
    const c = r.pick(CTX),
      n = r.pick(NAMES);
    const k = hard ? r.int(3, 7) : r.int(2, 5);
    const b = otherB(r, k, hard ? 2 : 1, hard ? 9 : 6);
    const xs = hard ? [1, 3, 5, 7] : [1, 2, 3, 4];
    const y = (x) => k * x + b;
    const opts = hard
      ? [
          { html: `Subtract neighboring values of the ${c.yw}, then divide by 2, because the ${c.xw} goes up by 2. The rate is ${k} per ${c.one}.`, ok: true },
          {
            html: `Subtract neighboring values of the ${c.yw}: ${y(3)} − ${y(1)} = ${2 * k}. The rate is ${2 * k} per ${c.one}.`,
            why: `${2 * k} is the change for 2 ${c.many}, because the ${c.xw} goes from 1 to 3. Divide by 2 to get the change for 1 ${c.one}.`,
          },
          {
            html: `Divide the first ${c.yw} by the first ${c.xw}: ${y(1)} ÷ 1 = ${y(1)}. The rate is ${y(1)}.`,
            why: `${y(1)} is the total for 1 ${c.one}, and it includes the starting value of ${b}. The rate is the change from one value to the next, per ${c.one}.`,
          },
          { html: `The rate is ${b}, the amount that is added once at the start.`, why: `${b} is the starting value, not the rate. The rate is the steady change for each ${c.one}.` },
        ]
      : [
          { html: `Subtract one ${c.yw} from the next one. Each time the ${c.xw} goes up by 1, the ${c.yw} goes up by ${k}, so the rate is ${k} per ${c.one}.`, ok: true },
          {
            html: `Divide the first ${c.yw} by the first ${c.xw}: ${k + b} ÷ 1 = ${k + b}. The rate is ${k + b}.`,
            why: `Dividing only works when the table starts at (0, 0). Here the first value includes the starting value of ${b}, so ${k + b} is the total for 1 ${c.one}, not the rate.`,
          },
          {
            html: `The rate is the first ${c.yw} in the table, ${k + b}.`,
            why: `${k + b} is the value for 1 ${c.one}. The rate is how much that value <b>changes</b> for each extra ${c.one}: ${2 * k + b} − ${k + b} = ${k}.`,
          },
          { html: `The rate is ${b}, the amount that is added once.`, why: `${b} is the starting value, not the rate. The rate is the steady change from one column to the next, which is ${k}.` },
        ];
    const sh = shuffleOptions(r, opts, 0);
    return {
      type: 'cr',
      skill: 'eq-table',
      lesson: '9-3',
      title: 'Explain how to find the rate',
      prompt: `<p>${n} recorded the ${c.yw} in a table.</p>${V.table(rows(c, k, b, xs), { header: false, rowHeader: true, cls: 'compact' })}<p>Explain how to find the rate of change from the table. Then choose the explanation that is correct.</p>`,
      starters: ['To find the rate of change, I compare …', 'From one column to the next, the … goes up by …', 'I cannot just divide, because …'],
      minWords: 10,
      check: { prompt: 'Which explanation is correct?', options: sh.options, answer: sh.answer },
      hints: [
        'The rate of change is how much the dependent variable changes each time the independent variable goes up by 1.',
        hard
          ? `The ${c.yw} goes from ${y(1)} to ${y(3)} while the ${c.xw} goes from 1 to 3. What is the difference, and how many ${c.many} does it cover?`
          : `Look at two columns side by side. The ${c.yw} goes from ${y(1)} to ${y(2)}. What is the difference?`,
        hard
          ? `${y(3)} − ${y(1)} = ${2 * k} for 2 ${c.many}. Split it to get the change for 1 ${c.one}.`
          : `${y(2)} − ${y(1)} = ${k}, and ${y(3)} − ${y(2)} = ${k} too. A steady difference is the rate.`,
      ],
      hintEs: 'La tasa de cambio es cuánto cambia la variable dependiente cada vez que la variable independiente aumenta 1.',
      solution: hard
        ? `<p>Model explanation: "I subtract neighboring values of the ${c.yw}: ${y(3)} − ${y(1)} = ${2 * k}. That change covers 2 ${c.many}, because the ${c.xw} goes from 1 to 3. So for 1 ${c.one} the change is ${2 * k} ÷ 2 = <b>${k}</b>. I cannot divide ${y(1)} by 1, because ${y(1)} includes the starting value of ${b}."</p>`
        : `<p>Model explanation: "I subtract neighboring values of the ${c.yw}: ${y(2)} − ${y(1)} = ${k}, ${y(3)} − ${y(2)} = ${k}. The ${c.yw} goes up by <b>${k}</b> every ${c.one}, so the rate of change is ${k}. I cannot divide ${y(1)} by 1, because the ${y(1)} includes the starting value of ${b}."</p>`,
      feedback: {
        correct: 'Correct. Subtracting neighboring outputs, and dividing by the step in the input, finds the rate even when there is a starting value.',
        wrong(ans, d) {
          if (!d.wroteEnough) return 'Write a full explanation of at least ten words. A sentence starter can help.';
          return (sh.options[ans.check] && sh.options[ans.check].why) || `Subtract neighboring values of the ${c.yw} to find the steady change.`;
        },
      },
    };
  });

  G.define('v3_situationEq', (r, o) => {
    const hard = !!o.hard;
    const c = r.pick(CTX),
      n = r.pick(NAMES);
    const k = hard ? r.int(4, 9) : r.int(2, 6);
    const useB = hard || r.chance(0.6);
    const b = useB ? otherB(r, k, hard ? 5 : 1, hard ? 12 : 6) : 0;
    const E = (kk, bb) => eq(kk, bb, c.yv, c.xv);
    const base = b
      ? [
          { html: E(k, b), ok: true },
          { html: E(b, k), why: `The numbers are swapped. ${k} happens for every ${c.one}, so it multiplies ${c.xv}. ${b} happens once, so it is added.` },
          { html: E(k, 0), why: `This leaves out the ${yWord(c, b)} that is counted once, no matter how many ${c.many}. The equation needs + ${b}.` },
          { html: E(k + b, 0), why: `This adds ${k} and ${b} into one rate, as if the ${b} happened for every ${c.one}. The ${b} is counted only once.` },
        ]
      : [
          { html: E(k, 0), ok: true },
          { html: E(1, k), why: `This adds ${k} once. But each ${c.one} adds ${k}, so for ${c.xv} ${c.many} you need ${k} × ${c.xv}.` },
          { html: `${c.xv} = ${k}${c.yv}`, why: `The variables are swapped. This says the ${c.xw} is ${k} times the ${c.yw}. It is the ${c.yw} that is ${k} times the ${c.xw}.` },
          { html: E(k, k), why: `This adds an extra ${k} that the story does not mention. For 1 ${c.one} it gives ${2 * k}, but 1 ${c.one} should give ${k}.` },
        ];
    if (hard)
      base.push({
        html: `${c.yv} = ${k}(${c.xv} + ${b})`,
        why: `This multiplies the ${b} by ${k} too, as if it happened for every ${c.one}. Test 1 ${c.one}: it gives ${k * (1 + b)}, but the story gives ${k + b}.`,
      });
    const sh = shuffleOptions(r, dedupe(base), 0);
    return {
      type: 'mc',
      skill: 'eq-situation',
      lesson: '9-3',
      title: 'Write the equation for the situation',
      prompt: `<p>${story(c, n, k, b)}</p><p>Let ${hl(c.xv)} be the ${c.xw} and ${hl(c.yv)} be the ${c.yw}. Which equation represents the relationship?</p>`,
      options: sh.options,
      answer: sh.answer,
      hints: [
        `Ask two questions. What happens for <b>every</b> ${c.one}? That number multiplies ${c.xv}. What happens <b>once</b>? That number is added.`,
        `Every ${c.one} adds ${k}, so the rate part is ${k}${c.xv}.${b ? ` The ${yWord(c, b)} happens once.` : ' Nothing is added just once.'}`,
        `Test with 1 ${c.one}: the ${c.yw} should be ${yWord(c, k + b)}. Which equation gives ${k + b} when ${c.xv} = 1?`,
      ],
      hintEs: `Hazte dos preguntas. ¿Qué pasa por <b>cada</b> ${c.oneEs}? Ese número multiplica a ${c.xv}. ¿Qué pasa <b>una sola vez</b>? Ese número se suma.`,
      solution: `<p>Each ${c.one} adds ${k}, so the rate of change is ${k} and the equation has ${k}${c.xv}. ${
        b ? `The ${yWord(c, b)} is counted once, so it is the starting value and gets added.` : 'Nothing is added just once, so there is no starting value.'
      } The equation is <b>${E(k, b)}</b>. Check: 2 ${c.many} → ${subst(k, b, 2)} = ${2 * k + b}.</p>`,
      feedback: {
        correct: `Correct. "For every ${c.one}" means multiply; "once" means add.`,
        wrong(ans) {
          return (sh.options[ans] && sh.options[ans].why) || `Test 1 ${c.one} and 2 ${c.many} in your equation and in the story.`;
        },
      },
    };
  });

  G.define('v3_clozeSituation', (r, o) => {
    const hard = !!o.hard;
    const c = r.pick(CTX),
      n = r.pick(NAMES);
    const k = hard ? r.int(3, 9) : r.int(2, 6);
    const b = otherB(r, k, hard ? 2 : 1, hard ? 12 : 6);
    const E = (kk, bb) => eq(kk, bb, c.yv, c.xv);
    const c0 = r.shuffle(uniq([k, b, k + b]).map(String));
    const c1 = r.shuffle(uniq([b, k, k + b]).map(String));
    const c2 = r.shuffle(hard ? [E(k, b), E(k, k + b), E(k + b, 0)] : [E(k, b), E(b, k), E(k, 0)]);
    const text = hard ? `${n} keeps a record. For 1 ${c.one}, the ${c.yw} is ${yWord(c, k + b)}. Each extra ${c.one} adds ${yWord(c, k)}.` : c.aff(n, k, b);
    return {
      type: 'cloze',
      skill: 'eq-situation',
      lesson: '9-3',
      title: 'Build the equation',
      prompt: `<p>${text}</p><p>Let ${c.xv} be the ${c.xw} and ${c.yv} be the ${c.yw}. Complete the sentences.</p>`,
      template: `The rate of change is {0} per ${c.one}. The starting value is {1}. The equation is {2}.`,
      choices: [c0, c1, c2],
      answers: [c0.indexOf(String(k)), c1.indexOf(String(b)), c2.indexOf(E(k, b))],
      hints: [
        hard
          ? `The rate is what each extra ${c.one} adds. The starting value is the ${c.yw} for 0 ${c.many}: go back 1 ${c.one} from the value for 1.`
          : 'The rate of change is the amount that repeats for every one. The starting value is the amount that happens once, even for 0.',
        hard
          ? `Each ${c.one} adds ${k}. For 1 ${c.one} the ${c.yw} is ${k + b}, so for 0 ${c.many} it is ${k + b} − ${k}.`
          : `What is the ${c.yw} for 0 ${c.many}? That is the starting value. How much does each ${c.one} add? That is the rate.`,
        `In the equation, the rate multiplies ${c.xv} and the starting value is added.`,
      ],
      hintEs: hard
        ? `La tasa es lo que suma cada ${c.oneEs} extra. El valor inicial es ${c.ywEs} con 0 ${c.manyEs}: retrocede 1 ${c.oneEs} desde el valor para 1.`
        : 'La tasa de cambio es la cantidad que se repite por cada uno. El valor inicial es la cantidad que pasa una sola vez, incluso con 0.',
      solution: hard
        ? `<p>Each extra ${c.one} adds ${k}, so the rate of change is <b>${k}</b>. Going back 1 ${c.one} from ${k + b} gives ${k + b} − ${k} = <b>${b}</b> for 0 ${c.many}: the starting value. Rate times ${c.xv}, plus the starting value: <b>${E(k, b)}</b>. Check: 1 ${c.one} → ${subst(k, b, 1)} = ${k + b}.</p>`
        : `<p>Each ${c.one} adds ${k}, so the rate of change is <b>${k}</b>. The ${yWord(c, b)} happens once, so the starting value is <b>${b}</b>. Rate times ${c.xv}, plus the starting value: <b>${E(k, b)}</b>.</p>`,
      feedback: {
        correct: 'Correct. Rate multiplies the input; the starting value is added once.',
        wrong(ans, d) {
          const pick = (i) => (Array.isArray(ans) ? [c0, c1, c2][i][ans[i]] : undefined);
          if (d.wrong.includes(0))
            return pick(0) === String(k + b)
              ? `${k + b} is the total for 1 ${c.one}, not the change. The rate is what each extra ${c.one} adds.`
              : `The rate is what repeats for every ${c.one}. Which number in the story happens again and again?`;
          if (d.wrong.includes(1))
            return pick(1) === String(k + b)
              ? `${k + b} is the ${c.yw} for 1 ${c.one}. The starting value is for 0 ${c.many}: take away one ${c.one}'s worth.`
              : `The starting value is the ${c.yw} before any ${c.many}: the amount that happens only once.`;
          return `Put the rate in front of ${c.xv} and add the starting value. Test it with 1 ${c.one}: the ${c.yw} should be ${k + b}.`;
        },
      },
    };
  });
})(typeof window !== 'undefined' ? window : globalThis);

/* js/units/u9/gen-equations-2.js */
/* Zone 3 — The Rule Works. Lesson 9-3 Write Equations to Represent Relationships Between Two Variables (Equations from Tables · Equations from Situations). */
(function (root) {
  'use strict';
  const RX = root.RX;
  const { G, V, shuffleOptions, NAMES, parseNum, CTX, eq, yWord, de, grid, rows, hl, story, pts, xyTable, subst, otherB, dedupe, uniq } = RX._lib['u9/gen-equations'];

  G.define('v3_errorRate', (r, o) => {
    const hard = !!o.hard;
    const c = r.pick(CTX),
      n = r.pick(NAMES);
    const k = hard ? r.int(4, 9) : r.int(2, 6);
    const b = otherB(r, k, hard ? 3 : 1, hard ? 12 : 6);
    const E = (kk, bb) => eq(kk, bb, c.yv, c.xv);
    const fixX = hard ? r.int(12, 20) : r.int(5, 9);
    const variant = hard ? r.pick(['swap', 'combined']) : 'swap';
    const badK = variant === 'swap' ? b : k + b,
      badB = variant === 'swap' ? k : 0;
    const opts =
      variant === 'swap'
        ? [
            { html: `${n} used ${b} as the rate and ${k} as the starting value. Each ${c.one} adds ${k}, and ${b} is added once, so the equation should be ${E(k, b)}.`, ok: true },
            {
              html: `${n} should not have added anything. The equation should be ${E(b, 0)}.`,
              why: `The ${yWord(c, b)} really is added once, so a + part belongs in the equation. The problem is which number multiplies ${c.xv}.`,
            },
            {
              html: `${n} swapped the variables. The equation should be ${c.xv} = ${b}${c.yv} + ${k}.`,
              why: `The letters are in the right places: ${c.yv} depends on ${c.xv}. It is the two numbers that are in the wrong places.`,
            },
            {
              html: `${n} should have multiplied the two numbers: ${c.yv} = ${k * b}${c.xv}.`,
              why: `${k} and ${b} play different roles. One repeats for every ${c.one}; the other happens once. They are not multiplied together.`,
            },
          ]
        : [
            { html: `${n} folded the one-time ${b} into the rate, as if it happened for every ${c.one}. The equation should be ${E(k, b)}.`, ok: true },
            {
              html: `${n} used ${k} as the starting value. The equation should be ${E(b, k)}.`,
              why: `${k} is the amount for every ${c.one}, so it multiplies ${c.xv}. ${E(b, k)} would be wrong too: test 2 ${c.many} in it.`,
            },
            {
              html: `${n} swapped the variables. The equation should be ${c.xv} = ${k + b}${c.yv}.`,
              why: `The letters are in the right places: ${c.yv} depends on ${c.xv}. The problem is the ${k + b} in front of ${c.xv}.`,
            },
            {
              html: `${n} should have multiplied the two numbers: ${c.yv} = ${k * b}${c.xv}.`,
              why: `${k} and ${b} play different roles. One repeats for every ${c.one}; the other happens once. They are not multiplied together.`,
            },
          ];
    const sh = shuffleOptions(r, opts, 0);
    return {
      type: 'error',
      skill: 'eq-situation',
      lesson: '9-3',
      title: 'Find the mistake in the equation',
      prompt: `<p>${c.aff(n, k, b)} ${n} wrote an equation, with ${c.xv} for the ${c.xw} and ${c.yv} for the ${c.yw}.</p><p>Which statement describes the mistake? Then give the correct ${c.yw} for ${fixX} ${c.many}.</p>`,
      work: `<p>${n}'s equation: <b>${E(badK, badB)}</b></p><p>${n}'s check: 1 ${c.one} → ${subst(badK, badB, 1)} = ${k + b}. ✓</p>`,
      options: sh.options,
      answer: sh.answer,
      fix: { label: `Correct ${c.yw} for ${fixX} ${c.many}: `, answer: k * fixX + b },
      hints: [
        `${n}'s check with 1 ${c.one} worked, but one test is not enough. Try 2 ${c.many} with the story and with the equation.`,
        `Story: 2 ${c.many} → ${k} × 2 + ${b} = ${2 * k + b}. Equation: ${subst(badK, badB, 2)} = ${2 * badK + badB}. They do not match. Which number should multiply ${c.xv}?`,
        `The rate (${k}) multiplies ${c.xv}; the ${yWord(c, b)} is added once. For the fix: ${k} × ${fixX} + ${b}.`,
      ],
      hintEs: `${n} probó con 1 ${c.oneEs} y funcionó, pero una sola prueba no basta. Prueba con 2 ${c.manyEs} en la historia y en la ecuación.`,
      solution: `<p>${variant === 'swap' ? `${n} put the starting value where the rate belongs.` : `${n} added the one-time ${b} into the rate.`} The amount for <b>every</b> ${c.one} is ${k}, so it multiplies ${c.xv}; the ${yWord(c, b)} happens once, so it is added: <b>${E(k, b)}</b>. The check with 1 ${c.one} passed only because both equations give ${k + b} when ${c.xv} = 1. For ${fixX} ${c.many}: ${k} × ${fixX} + ${b} = <b>${k * fixX + b}</b>.</p>`,
      feedback: {
        correct: 'Correct. A check with x = 1 cannot tell the rate from the starting value. Always test a second value.',
        wrong(ans, d) {
          if (!d.mistakeOk)
            return (sh.options[ans.mistake] && sh.options[ans.mistake].why) || `Test 2 ${c.many} with the story and with ${n}'s equation. They disagree, so look at which number multiplies ${c.xv}.`;
          const v = parseNum(ans.fix);
          if (v === badK * fixX + badB) return `Mistake found, but you used ${n}'s equation for the fix. Use ${E(k, b)}.`;
          if (v === k * fixX) return `Mistake found. For the fix, add the ${yWord(c, b)} after multiplying.`;
          return `Mistake found. For the fix, substitute ${fixX} into ${E(k, b)}.`;
        },
      },
    };
  });

  G.define('v3_whoEquation', (r, o) => {
    const hard = !!o.hard;
    const c = r.pick(CTX),
      [n0, n1, n2, n3] = r.pickN(NAMES, 4);
    const k = hard ? r.int(4, 9) : r.int(2, 6);
    const b = hard ? otherB(r, k, 3, 12) : r.chance(0.6) ? otherB(r, k, 1, 6) : 0;
    const E = hard ? `${k}${c.xv} + ${b} = ${c.yv}` : eq(k, b, c.yv, c.xv);
    const sh = shuffleOptions(
      r,
      [
        { title: n1, html: `${c.xv} is independent: you choose the ${c.xw}, and ${c.yv} is found from it.`, ok: true },
        hard
          ? {
              title: n2,
              html: `${c.xv} is the dependent variable, because it is the letter written first in this equation.`,
              why: `Where a letter is written does not decide anything. ${E} says the same thing as ${eq(k, b, c.yv, c.xv)}. You still choose ${c.xv} and calculate ${c.yv}.`,
            }
          : {
              title: n2,
              html: `${c.yv} is the independent variable, because it is the letter written first in the equation.`,
              why: `Being written first does not make a variable independent. ${c.yv} is written alone because it is the result you are finding. It depends on ${c.xv}.`,
            },
        {
          title: n3,
          html: `${k} is the independent variable, because it is the number that never changes in the rule.`,
          why: `${k} is not a variable at all. It is the rate, a fixed number. The variables are the letters ${c.xv} and ${c.yv}.`,
        },
      ],
      0,
    );
    return {
      type: 'who',
      skill: 'eq-situation',
      lesson: '9-3',
      title: 'Who is correct?',
      prompt: `<p>${story(c, n0, k, b)} The equation is ${hl(E)}, where ${c.xv} is the ${c.xw} and ${c.yv} is the ${c.yw}.</p><p>Three students disagree about the variables. Who is correct?</p>`,
      options: sh.options,
      answer: sh.answer,
      layout: 'cards',
      hints: [
        'The independent variable is the input: the quantity you choose. The dependent variable is the output that is calculated.',
        `In ${E}, you substitute a value for one letter and calculate the other. Which letter do you substitute into?`,
        `You pick the ${c.xw} (${c.xv}) and calculate the ${c.yw} (${c.yv}). A plain number like ${k} is a constant, not a variable.`,
      ],
      hintEs: 'La variable independiente es la entrada: la cantidad que tú eliges. La variable dependiente es la salida que se calcula.',
      solution: `<p><b>${n1}</b> is correct. In ${E}, you choose a value for ${c.xv} (the ${c.xw}) and the equation gives ${c.yv} (the ${c.yw}). ${c.xv} is independent; ${c.yv} is dependent. ${
        hard ? 'The side of the equals sign a letter is on does not change its role.' : `Writing ${c.yv} first just shows that it is the result.`
      } ${k} is a constant, not a variable.</p>`,
      feedback: {
        correct: 'Correct. The variable you substitute into is independent; the one you calculate is dependent.',
        wrong(ans) {
          return (sh.options[ans] && sh.options[ans].why) || 'Ask which letter you choose a value for, and which letter you calculate.';
        },
      },
    };
  });

  G.define('v3_matchThree', (r, o) => {
    const hard = !!o.hard;
    const k = hard ? r.int(3, 5) : r.int(2, 4);
    const b = otherB(r, k, 2, hard ? 7 : 5);
    const names = r.pickN(NAMES, 2);
    const ctxs = r.pickN(CTX, 2);
    const txs = hard ? [2, 4, 7] : [1, 2, 3];
    const params = [
      [k, 0],
      [1, b],
      [k, b],
      [b, k],
    ];
    const storyIdx = r.pickN([0, 1, 2, 3], 2);
    const left = params.map(([kk, bb], i) => {
      const si = storyIdx.indexOf(i);
      if (si >= 0) {
        const c = ctxs[si];
        return `<p>${story(c, names[si], kk, bb)} <span class="muted">x = ${c.xw}, y = ${c.yw}</span></p>`;
      }
      return xyTable(kk, bb, txs, 'mini');
    });
    const right = params.map(([kk, bb]) => eq(kk, bb));
    const order = r.shuffle([0, 1, 2, 3]);
    const rightShuffled = order.map((i) => right[i]);
    const pairs = params.map((_, i) => [i, order.indexOf(i)]);
    return {
      type: 'match',
      skill: 'multi-rep',
      lesson: '9-3',
      title: 'Match each table or story to its equation',
      prompt: `<p>Each table and each story on the left is described by exactly one equation on the right.${hard ? ' The tables skip some x-values.' : ''} Match them.</p>`,
      left,
      right: rightShuffled,
      pairs,
      hints: [
        'For a table, test two columns in each equation. For a story, find what repeats (the rate) and what happens once (the starting value).',
        `The equations use the rates ${k}, 1, and ${b} and the starting values 0, ${b}, and ${k}. For x = ${txs[0]}, the equations give ${params.map(([kk, bb]) => `${eq(kk, bb)} → ${kk * txs[0] + bb}`).join('; ')}.`,
        `Two items may agree in one column. Use another column to tell them apart.`,
      ],
      hintEs: 'En una tabla, prueba dos columnas en cada ecuación. En una historia, busca lo que se repite (la tasa) y lo que pasa una sola vez (el valor inicial).',
      solution: `<p>${params.map(([kk, bb], i) => `${storyIdx.includes(i) ? 'Story' : 'Table'} ${i + 1}: rate ${kk}, starting value ${bb} → <b>${eq(kk, bb)}</b>`).join('. ')}.</p>`,
      feedback: {
        correct: 'Correct. A table, a story, and an equation can all describe the same relationship.',
        wrong(ans, d) {
          const i = d.wrong[0];
          const [kk, bb] = params[i];
          const mine = (Array.isArray(ans) ? ans : []).find((p) => p[0] === i);
          if (mine && order[mine[1]] !== undefined) {
            const [k2, b2] = params[order[mine[1]]];
            if (k2 === bb && b2 === kk) return `Item ${i + 1}: you swapped the rate and the starting value. The number that repeats for every one multiplies x; the one-time number is added.`;
          }
          return storyIdx.includes(i)
            ? `Look again at item ${i + 1}. What repeats for every one? That is the rate. What happens once? That is the starting value. Find the equation with that rate and starting value.`
            : `Look again at item ${i + 1}. Substitute two of its x-values into your equation. Both y-values must match.`;
        },
      },
    };
  });

  G.define('v3_seqRates', (r, o) => {
    const hard = !!o.hard;
    const c = r.pick(CTX),
      [n1, n2] = r.pickN(NAMES, 2);
    const rates = r.pickN(hard ? [1, 2, 3, 4, 5] : [1, 2, 3, 4, 5, 6], 4);
    const bEq = r.int(hard ? 6 : 1, hard ? 12 : 5),
      bTab = r.int(1, hard ? 9 : 4),
      bS = hard ? r.int(2, 8) : 0,
      bG = hard ? r.int(1, 4) : 0;
    const g = grid(rates[3] * 4 + bG);
    const txs = hard ? [2, 4, 6] : [1, 2, 3];
    const gx = hard ? [0, 1, 2, 3, 4] : [1, 2, 3, 4];
    const eqText = hard ? `${c.yv} = ${bEq} + ${rates[0] === 1 ? '' : rates[0]}${c.xv}` : eq(rates[0], bEq, c.yv, c.xv);
    const items = [
      { html: `<b>Equation:</b> ${eqText}`, rate: rates[0] },
      {
        html: `<b>Table:</b>${V.table(
          [
            [c.xLabel, ...txs.map(String)],
            [c.yLabel, ...txs.map((x) => String(rates[1] * x + bTab))],
          ],
          { header: false, rowHeader: true, cls: 'mini' },
        )}`,
        rate: rates[1],
      },
      { html: `<b>Story:</b> ${bS ? c.aff(n1, rates[2], bS) : c.prop(n1, rates[2])}`, rate: rates[2] },
      {
        html: `<b>Graph (${n2}'s route):</b>${V.graph({ xLabel: c.xLabel, yLabel: c.yLabel, xMax: 4, yMax: g.yMax, yStep: g.yStep, size: 150, series: [{ points: pts(rates[3], bG, gx), line: true }] })}`,
        rate: rates[3],
      },
    ];
    const desc = r.chance(0.4);
    const order = [0, 1, 2, 3].sort((a, z) => (desc ? items[z].rate - items[a].rate : items[a].rate - items[z].rate));
    const labels = ['equation', 'table', 'story', 'graph'];
    return {
      type: 'seq',
      skill: 'multi-rep',
      lesson: '9-3',
      title: 'Order by rate of change',
      prompt: `<p>Four routes are shown in four different ways${hard ? ', and every one of them has a starting value' : ''}. Order them from the ${desc ? '<b>fastest</b> rate (top) to the <b>slowest</b> rate (bottom)' : '<b>slowest</b> rate (top) to the <b>fastest</b> rate (bottom)'}: ${c.yu} per ${c.one}.</p>`,
      items,
      order,
      hints: [
        'The rate is how much y changes for each 1 of x. Ignore starting values; they do not change the rate.',
        hard
          ? `Equation: the number multiplying ${c.xv}, even though it is written second. Table: subtract neighboring values, then divide by 2 because x goes up by 2. Story: the amount per ${c.one}. Graph: the rise from one point to the next.`
          : `Equation: the number in front of ${c.xv}. Table: subtract neighboring values. Story: the amount per ${c.one}. Graph: the rise from one point to the next.`,
        `Rates: equation ${rates[0]}, table ${rates[1]}, story ${rates[2]}, graph ${rates[3]}. Put the ${desc ? 'largest' : 'smallest'} first.`,
      ],
      hintEs: 'La tasa es cuánto cambia y por cada 1 de x. No te fijes en los valores iniciales; no cambian la tasa.',
      solution: `<p>Equation: rate <b>${rates[0]}</b> (the number multiplying ${c.xv}; the ${bEq} is a starting value). Table: ${hard ? `(${rates[1] * 4 + bTab} − ${rates[1] * 2 + bTab}) ÷ 2` : `${2 * rates[1] + bTab} − ${rates[1] + bTab}`} = <b>${rates[1]}</b>. Story: <b>${rates[2]}</b> per ${c.one}. Graph: each point is ${rates[3]} higher than the one before, so <b>${rates[3]}</b>. ${desc ? 'Fastest' : 'Slowest'} to ${desc ? 'slowest' : 'fastest'}: ${order.map((i) => labels[i]).join(', ')}.</p>`,
      feedback: {
        correct: 'Correct. Every representation hides the same number: the change in y for each 1 of x.',
        wrong(ans) {
          const a = Array.isArray(ans) ? ans.join() : '';
          if (a === order.slice().reverse().join()) return `Your order is reversed. This question asks for ${desc ? 'fastest' : 'slowest'} at the top.`;
          return `Find each rate first. In the equation it is the number multiplying ${c.xv}, not the number added. In the table, subtract neighboring values${hard ? ' and divide by 2' : ''}. Then check the direction asked for.`;
        },
      },
    };
  });

  G.define('v3_tableFromEquation', (r, o) => {
    const hard = !!o.hard;
    const c = r.pick(CTX),
      n = r.pick(NAMES);
    const k = hard ? r.int(4, 9) : r.int(2, 6);
    const b = hard ? r.int(3, 12) : r.chance(0.6) ? r.int(1, 6) : 0;
    const E = eq(k, b, c.yv, c.xv);
    const xs = hard
      ? r.pick([
          [0, 3, 7, 12, 15],
          [1, 4, 9, 11, 20],
          [0, 5, 8, 13, 16],
        ])
      : r.pick([
          [0, 1, 3, 5, 8],
          [0, 2, 4, 6, 10],
          [1, 2, 5, 7, 9],
        ]);
    return {
      type: 'table',
      skill: 'multi-rep',
      lesson: '9-3',
      title: 'Build the table from the equation',
      prompt: `<p>${story(c, n, k, b)} The equation is ${hl(E)}, where ${c.xv} is the ${c.xw} and ${c.yv} is the ${c.yw}.</p><p>Complete the table. The first column is done for you.</p>`,
      rows: [
        [c.xLabel, ...xs.map(String)],
        [c.yLabel, ...xs.map((x, i) => (i === 0 ? String(k * x + b) : `__IN:y${x}__`))],
      ],
      rowHeader: true,
      inputs: xs.slice(1).map((x) => ({ id: 'y' + x, answer: k * x + b })),
      hints: [
        `Substitute each ${c.xw} for ${c.xv} in ${E}, then calculate.`,
        `The first column: ${c.xv} = ${xs[0]} → ${subst(k, b, xs[0])} = ${k * xs[0] + b}. Do the same for ${c.xv} = ${xs[1]}.`,
        `${c.xv} = ${xs[1]}: ${subst(k, b, xs[1])}. The columns skip numbers, so substitute each one; do not just add ${k}.`,
      ],
      hintEs: `En ${E}, sustituye ${c.xv} por cada valor ${de(c.xwEs)} y luego calcula.`,
      solution: `<p>Substitute into ${E}: ${xs.map((x) => `${c.xv} = ${x} → ${subst(k, b, x)} = <b>${k * x + b}</b>`).join('; ')}. The equation gives the ${c.yw} for any ${c.xw}, even ones that skip ahead.</p>`,
      feedback: {
        correct: `Correct. The equation ${E} produces every column of the table.`,
        wrong(ans, d) {
          const id = d.wrong[0],
            x = Number(id.slice(1)),
            v = parseNum(ans[id]),
            i = xs.indexOf(x);
          if (b && v === k * x) return `For ${c.xv} = ${x}, you multiplied but forgot to add ${b}.`;
          if (i > 0 && v === k * xs[i - 1] + b + k)
            return `For ${c.xv} = ${x}, you added ${k} to the column before, but the ${c.xw} jumped from ${xs[i - 1]} to ${x}. Substitute ${x} into the equation instead.`;
          if (v === x + k + b) return `For ${c.xv} = ${x}, multiply ${k} by ${x}; do not add them.`;
          return `For ${c.xv} = ${x}: ${subst(k, b, x)}. Multiply first, then add.`;
        },
      },
    };
  });

  G.define('v3_describeMc', (r, o) => {
    const hard = !!o.hard;
    const c = r.pick(CTX),
      n = r.pick(NAMES);
    const k = hard ? r.int(4, 9) : r.int(2, 6);
    const b = otherB(r, k, hard ? 3 : 1, hard ? 12 : 6);
    const E = hard ? `${c.yv} = ${b} + ${k}${c.xv}` : eq(k, b, c.yv, c.xv);
    const askK = r.chance(0.5);
    const opts = askK
      ? [
          { html: `Each ${c.one} adds ${k} to the ${c.yw}. It is the rate of change.`, ok: true },
          {
            html: `The ${c.yw} is ${k} before any ${c.many}. It is the starting value.`,
            why: `The starting value is the number that is added once: ${b}. The ${k} is multiplied by ${c.xv}, so it happens for every ${c.one}.`,
          },
          { html: `The ${c.yw} for 1 ${c.one} is ${k}.`, why: `For 1 ${c.one}, the ${c.yw} is ${k} × 1 + ${b} = ${k + b}, not ${k}. The ${k} is the <b>change</b> per ${c.one}, not the total.` },
          { html: `There are ${k} ${c.many}.`, why: `The ${c.xw} is the variable ${c.xv}, which can be any number. ${k} is a fixed number that tells how much each ${c.one} adds.` },
        ]
      : [
          { html: `The ${c.yw} is ${b} when there are 0 ${c.many}. It is the starting value.`, ok: true },
          {
            html: `Each ${c.one} adds ${b} to the ${c.yw}.`,
            why: `The amount per ${c.one} is the number multiplied by ${c.xv}, which is ${k}. The ${b} is added only once${hard ? ', even though it is written first' : ''}.`,
          },
          { html: `The ${c.yw} for 1 ${c.one} is ${b}.`, why: `For 1 ${c.one}, the ${c.yw} is ${k} × 1 + ${b} = ${k + b}. The ${b} alone is the value for 0 ${c.many}.` },
          { html: `There are ${b} ${c.many}.`, why: `The ${c.xw} is the variable ${c.xv}. The ${b} is a fixed amount that is there before any ${c.many} are counted.` },
        ];
    const sh = shuffleOptions(r, opts, 0);
    return {
      type: 'mc',
      skill: 'multi-rep',
      lesson: '9-3',
      title: 'What does the number mean?',
      prompt: `<p>${c.aff(n, k, b)} The equation is ${hl(E)}, where ${c.xv} is the ${c.xw} and ${c.yv} is the ${c.yw}.</p><p>What does the ${hl(askK ? k : b)} in the equation tell you?</p>`,
      options: sh.options,
      answer: sh.answer,
      hints: [
        hard
          ? 'The number multiplied by the variable is the rate of change, wherever it is written. The number added on its own is the starting value.'
          : 'In y = kx + b, the number multiplied by the variable is the rate of change. The number added is the starting value.',
        `Is ${askK ? k : b} multiplied by ${c.xv} or added on? ${askK ? `${k}${c.xv} means ${k} for every ${c.one}.` : `+ ${b} means ${b} is added once, no matter how many ${c.many}.`}`,
        askK
          ? `Substitute ${c.xv} = 0 and ${c.xv} = 1: the ${c.yw} goes from ${b} to ${k + b}. How much did it change?`
          : `Substitute ${c.xv} = 0: ${hard ? `${b} + ${k} × 0` : `${k} × 0 + ${b}`}. What does that value describe?`,
      ],
      hintEs: hard
        ? 'El número que multiplica a la variable es la tasa de cambio, sin importar dónde esté escrito. El número que se suma solo es el valor inicial.'
        : 'En y = kx + b, el número que multiplica a la variable es la tasa de cambio. El número que se suma es el valor inicial.',
      solution: askK
        ? `<p>In ${E}, the ${k} is multiplied by ${c.xv}, so it happens for every ${c.one}: <b>each ${c.one} adds ${k} to the ${c.yw}</b>. That is the rate of change. The ${b} is the starting value, added once.</p>`
        : `<p>In ${E}, the ${b} is added once, not multiplied. When ${c.xv} = 0, the ${c.yw} is ${k} × 0 + ${b} = ${b}. So <b>${b} is the ${c.yw} before any ${c.many}</b>: the starting value.</p>`,
      feedback: {
        correct: 'Correct. Multiplied means "for every one"; added means "once, at the start."',
        wrong(ans) {
          return (sh.options[ans] && sh.options[ans].why) || `Decide whether ${askK ? k : b} is multiplied by ${c.xv} or added on its own.`;
        },
      },
    };
  });
})(typeof window !== 'undefined' ? window : globalThis);

/* js/units/u9/gen-apply.js */
/* Zone 4 — Central Junction. Lesson 9-4 Apply Two-Variable Relationships to Solve Problems (Substitute and Solve · Working Backward to a Goal). */
(function (root) {
  'use strict';
  const RX = root.RX;
  const { G, V, shuffleOptions, NAMES, parseNum, fmt, round } = RX;
  const { CTX, eq, yWord, yWordEs, grid } = RX.U9;
  const hl = V.hl;
  const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
  /** Story for y = kx + b. Money rates that are not whole numbers print as $1.50. */
  const story = (c, n, k, b) => {
    const kk = c.money && !Number.isInteger(k) ? k.toFixed(2) : k;
    return b ? c.aff(n, kk, b) : c.prop(n, kk);
  };
  /** Contexts where a decimal rate makes sense (money, length). */
  const DEC_CTX = CTX.filter((c) => c.money || c.yu === 'meters' || c.yu === 'centimeters');
  const DEC_RATES = [1.5, 2.5, 3.5];
  /** Expression text for substituting x into y = kx + b, e.g. "3 × 4 + 2". */
  const subst = (k, b, x) => `${k === 1 ? x : fmt(k) + ' × ' + x}${b ? ' + ' + b : ''}`;
  const otherB = (r, k, lo, hi) => {
    let b = r.int(lo, hi);
    if (b === k) b = b === hi ? b - 1 : b + 1;
    return b;
  };
  const dedupe = (opts) => {
    const seen = new Set();
    return opts.filter((o) => {
      const t = String(o.html)
        .replace(/<[^>]+>/g, '')
        .trim();
      if (seen.has(t)) return false;
      seen.add(t);
      return true;
    });
  };
  const near = (a, b) => a != null && Math.abs(a - b) < 0.005;
  /** "n stop" / "n stops" */
  const count = (c, n) => `${n} ${n === 1 ? c.one : c.many}`;
  /** Tip for multiplying by a rate like 2.5. */
  const halfTip = (k, x) => (Number.isInteger(k) ? '' : ` Think of ${fmt(k)} × ${x} as ${Math.floor(k) ? `${Math.floor(k)} × ${x} plus ` : ''}half of ${x}.`);

  // ---------- Substitute into an equation (num, honors hard: bigger numbers or a decimal rate) ----------
  G.define('v4_substitute', (r, o) => {
    const hard = !!o.hard;
    const dec = hard && r.chance(0.5);
    const k = dec ? r.pick(DEC_RATES) : hard ? r.int(4, 9) : r.int(2, 6);
    const b = hard ? r.int(3, 12) : r.chance(0.6) ? r.int(1, 6) : 0;
    const x = hard ? r.int(8, 15) : r.int(3, 9);
    const E = eq(k, b);
    const kx = round(k * x, 2);
    const y = round(kx + b, 2);
    return {
      type: 'num',
      skill: 'substitute',
      lesson: '9-4',
      title: 'Substitute and evaluate',
      prompt: `<p>Use the equation ${hl(E)}.</p><p>Find the value of y when x = ${hl(x)}.</p>`,
      answer: y,
      hints: [
        'Substitute means replace the variable with the number. Replace x with its value, then follow the order of operations: multiply before you add.',
        `Replace x: y = ${subst(k, b, x)}.`,
        `Multiply ${fmt(k)} × ${x} first${b ? `, then add ${b}` : ''}.${halfTip(k, x)}`,
      ],
      hintEs: 'Sustituir quiere decir reemplazar la variable por un número. Reemplaza x por su valor y sigue el orden de las operaciones: multiplica antes de sumar.',
      solution: `<p>Substitute x = ${x} into ${E}: y = ${subst(k, b, x)} = ${b ? `${fmt(kx)} + ${b} = ` : ''}<b>${fmt(y)}</b>. The number next to x is multiplied by x; the number added stays the same.</p>`,
      feedback: {
        correct: 'Correct. Replace the variable, multiply first, then add.',
        wrong(ans, d) {
          const v = d.value;
          if (v == null) return 'Type a number for y.';
          if (b && near(v, kx)) return `You multiplied correctly but left out the + ${b}. The equation has two steps.`;
          if (near(v, k + x + b)) return `${fmt(k)}x means ${fmt(k)} times x, not ${fmt(k)} plus x. Multiply ${fmt(k)} × ${x} first.`;
          if (b && near(v, k * (x + b))) return `You added ${b} before multiplying. Multiply ${fmt(k)} × ${x} first, then add ${b}.`;
          if (!Number.isInteger(k) && near(v, Math.floor(k) * x + 0.5 + b)) return `You multiplied only the ${Math.floor(k)} by ${x} and then added 0.5 once. The 0.5 must be multiplied by ${x} too.`;
          if (v === x) return `${x} is the value of x. The question asks for y.`;
          return `Replace x with ${x}, multiply first, then add. Check your multiplication.`;
        },
      },
    };
  });

  // ---------- Write the equation from a story, then substitute (blanks; hard: rate and start found from two data points) ----------
  G.define('v4_substituteStory', (r, o) => {
    const hard = !!o.hard;
    const c = r.pick(CTX),
      n = r.pick(NAMES);
    const k = hard ? r.int(4, 9) : r.int(2, 6);
    const b = otherB(r, k, hard ? 3 : 1, hard ? 12 : 6);
    const x = hard ? r.int(10, 15) : r.int(4, 9);
    const E = eq(k, b, c.yv, c.xv);
    const y = k * x + b;
    const text = hard
      ? `${n} keeps a record. After 2 ${c.many}, the ${c.yw} is ${yWord(c, 2 * k + b)}. After 3 ${c.many}, it is ${yWord(c, 3 * k + b)}. The ${c.yw} rises by the same amount for each ${c.one}.`
      : c.aff(n, k, b);
    return {
      type: 'blanks',
      skill: 'substitute',
      lesson: '9-4',
      title: 'Write the equation, then use it',
      prompt: `<p>${text}</p><p>Let ${c.xv} be the ${c.xw} and ${c.yv} be the ${c.yw}. Write the equation, then find the ${c.yw} for ${hl(count(c, x))}.</p>`,
      template: `Equation: ${c.yv} = {0}${c.xv} + {1}.   For ${count(c, x)}, ${c.yv} = {2}.`,
      fields: [
        { label: 'rate', answer: k, width: 'xs' },
        { label: 'starting value', answer: b, width: 'xs' },
        { label: c.yw, answer: y, width: 'sm' },
      ],
      hints: [
        hard
          ? `Subtract the two totals to find how much each ${c.one} adds. That is the rate. Then go back from 2 ${c.many} to 0 ${c.many} to find the starting value.`
          : `The number that repeats for every ${c.one} multiplies ${c.xv}. The number that happens once is added.`,
        hard
          ? `${3 * k + b} − ${2 * k + b} = ${k} per ${c.one}. For 0 ${c.many}, take 2 of those away from ${2 * k + b}.`
          : `Each ${c.one} adds ${k}, and the ${yWord(c, b)} is added once. So the equation is ${c.yv} = ${k}${c.xv} + ${b}.`,
        `Substitute ${c.xv} = ${x}: ${k} × ${x} + ${b}.`,
      ],
      hintEs: hard
        ? `Resta los dos totales para hallar cuánto suma cada ${c.oneEs}. Esa es la tasa. Luego retrocede de 2 ${c.manyEs} a 0 ${c.manyEs} para hallar el valor inicial.`
        : `El número que se repite por cada ${c.oneEs} multiplica a ${c.xv}. El número que pasa una sola vez se suma.`,
      solution: `<p>${hard ? `The ${c.yw} rises ${3 * k + b} − ${2 * k + b} = ${k} per ${c.one}, and for 0 ${c.many} it is ${2 * k + b} − ${2 * k} = ${b}. ` : ''}Rate ${k} (for every ${c.one}), starting value ${b} (once): <b>${E}</b>. Then substitute ${c.xv} = ${x}: ${k} × ${x} + ${b} = ${k * x} + ${b} = <b>${y}</b>. For ${count(c, x)}, the ${c.yw} is ${yWord(c, y)}.</p>`,
      feedback: {
        correct: 'Correct. Write the rule first, then the rule does the calculating for you.',
        wrong(ans, d) {
          const i = d.wrong[0];
          const v = parseNum(ans[i]);
          if (i === 0) {
            if (v === b) return `You put the starting value in front of ${c.xv}. The number in front of ${c.xv} is the amount for every ${c.one}.`;
            if (hard && v === 2 * k + b) return `${v} is the total after 2 ${c.many}, not the amount for each ${c.one}. Subtract the two totals.`;
            return `The rate is the amount that repeats for every ${c.one}.`;
          }
          if (i === 1) {
            if (v === k) return `You put the rate in the added spot. The added number is the amount that happens once.`;
            if (hard && v === k + b) return `${v} is the ${c.yw} for 1 ${c.one}. Go back one more ${c.one} to reach 0 ${c.many}.`;
            if (hard && (v === 2 * k + b || v === 3 * k + b)) return `${v} is one of the totals. The starting value is the ${c.yw} for 0 ${c.many}: subtract the rate for each ${c.one} you go back.`;
            return `The starting value is the amount that happens once, before any ${c.many}.`;
          }
          if (v === k * x) return 'For the last blank, you forgot to add the starting value.';
          if (v === b * x + k) return `For the last blank, you used the numbers in swapped places. Multiply the rate by ${x}, then add the starting value.`;
          return `For the last blank, substitute ${x} for ${c.xv}: rate × ${x} + starting value.`;
        },
      },
    };
  });

  // ---------- Table with missing outputs and missing inputs (table; hard: bigger rule, more backward columns) ----------
  G.define('v4_tableEq', (r, o) => {
    const hard = !!o.hard;
    const c = r.pick(CTX),
      n = r.pick(NAMES);
    const k = hard ? r.int(4, 9) : r.int(2, 5);
    const b = hard ? r.int(3, 12) : r.chance(0.6) ? r.int(1, 6) : 0;
    const E = eq(k, b, c.yv, c.xv);
    const xs = hard
      ? r.pick([
          [1, 4, 7, 10, 12],
          [2, 5, 8, 11, 15],
          [0, 3, 6, 9, 13],
        ])
      : r.pick([
          [1, 3, 6, 8],
          [2, 4, 7, 10],
          [0, 5, 6, 9],
        ]);
    const modes = hard ? ['y', 'x', 'x', 'y', 'x'] : ['y', 'x', 'y', 'x'];
    const cols = xs.map((x, i) => ({ x, y: k * x + b, mode: modes[i] }));
    const undo = b ? `subtract ${b}, then divide by ${k}` : `divide by ${k}`;
    return {
      type: 'table',
      skill: 'substitute',
      lesson: '9-4',
      title: 'Fill in both directions',
      prompt: `<p>${story(c, n, k, b)} The equation is ${hl(E)}, where ${c.xv} is the ${c.xw} and ${c.yv} is the ${c.yw}.</p><p>Complete the table. Some columns give the ${c.xw}; others give the ${c.yw} and ask for the ${c.xw}.</p>`,
      rows: [
        [c.xLabel, ...cols.map((col) => (col.mode === 'x' ? `__IN:x${col.y}__` : String(col.x)))],
        [c.yLabel, ...cols.map((col) => (col.mode === 'y' ? `__IN:y${col.x}__` : String(col.y)))],
      ],
      rowHeader: true,
      inputs: cols.map((col) => (col.mode === 'y' ? { id: 'y' + col.x, answer: col.y } : { id: 'x' + col.y, answer: col.x })),
      hints: [
        `When the ${c.xw} is given, substitute it into ${E}. When the ${c.yw} is given, work backward: ${undo}.`,
        `Column 1: ${c.xv} = ${cols[0].x} → ${subst(k, b, cols[0].x)} = ${cols[0].y}. Column 2: ${c.yv} = ${cols[1].y} → ${b ? `${cols[1].y} − ${b} = ${cols[1].y - b}, then ${cols[1].y - b} ÷ ${k}` : `${cols[1].y} ÷ ${k}`}.`,
        `Check every answer by substituting it back into ${E}.`,
      ],
      hintEs: `Cuando te dan ${c.xwEs}, sustitúyelo en ${E}. Cuando te dan ${c.ywEs}, trabaja hacia atrás: ${b ? `resta ${b} y luego divide entre ${k}` : `divide entre ${k}`}.`,
      solution: `<p>${cols.map((col) => (col.mode === 'y' ? `${c.xv} = ${col.x}: ${subst(k, b, col.x)} = <b>${col.y}</b>` : `${c.yv} = ${col.y}: ${b ? `(${col.y} − ${b}) ÷ ${k}` : `${col.y} ÷ ${k}`} = <b>${col.x}</b>`)).join('; ')}. Forward, substitute and evaluate. Backward, undo the steps in reverse order.</p>`,
      feedback: {
        correct: 'Correct. The same equation works forward (find y) and backward (find x).',
        wrong(ans, d) {
          const id = d.wrong[0];
          const v = parseNum(ans[id]);
          const num = Number(id.slice(1));
          if (id[0] === 'y') {
            if (b && v === k * num) return `For ${c.xv} = ${num}, add the ${b} after multiplying.`;
            return `For ${c.xv} = ${num}, substitute: ${subst(k, b, num)}. Multiply first, then add.`;
          }
          if (v === num * k + b || v === num * k) return `The ${c.yw} ${num} is given. To find the ${c.xw}, undo the equation: ${undo}.`;
          if (b && v != null && near(v, num / k - b)) return `You divided before subtracting. Undo the + ${b} first, then divide by ${k}.`;
          if (b && v === num - b) return `${num} − ${b} = ${num - b} is a good first step. Now divide by ${k} to find the ${c.xw}.`;
          return `For ${c.yv} = ${num}: ${undo}. Then check by substituting your answer back.`;
        },
      },
    };
  });

  // ---------- Error: substitution mistake (error; hard adds a decimal-rate multiplication slip) ----------
  G.define('v4_errorSubstitute', (r, o) => {
    const hard = !!o.hard;
    const n = r.pick(NAMES);
    const variant = r.pick(hard ? ['added', 'parens', 'decimal', 'decimal'] : ['added', 'parens']);
    const k = variant === 'decimal' ? r.pick(DEC_RATES) : hard ? r.int(4, 9) : r.int(2, 6);
    const b = hard ? r.int(3, 12) : r.int(1, 6);
    const x = hard ? r.int(6, 12) : r.int(3, 8);
    const E = eq(k, b);
    const kx = round(k * x, 2);
    const y = round(kx + b, 2);
    const whole = Math.floor(k);
    const slip = whole * x + 0.5;
    const badWork =
      variant === 'added'
        ? `y = ${k} + ${x} + ${b} = ${k + x + b}`
        : variant === 'parens'
          ? `y = ${k} × (${x} + ${b}) = ${k} × ${x + b} = ${k * (x + b)}`
          : `y = ${fmt(k)} × ${x} + ${b} = ${fmt(slip)} + ${b} = ${fmt(slip + b)}`;
    const badFinal = variant === 'added' ? k + x + b : variant === 'parens' ? k * (x + b) : slip + b;
    const opts =
      variant === 'added'
        ? [
            { html: `${n} added ${k} and ${x}. The expression ${k}x means ${k} <b>times</b> x, so the first step is ${k} × ${x}.`, ok: true },
            { html: `${n} should not have added ${b}.`, why: `The + ${b} is part of the equation, so adding ${b} is correct. The mistake is in the ${k}x part.` },
            { html: `${n} substituted ${x} for the wrong variable.`, why: `${x} replaced x, which is right. The problem is treating ${k}x as ${k} + x.` },
            { html: `${n} should have divided ${x} by ${k}.`, why: `Dividing is for working backward from y. Here x is known, so you multiply: ${k} × ${x}.` },
          ]
        : variant === 'parens'
          ? [
              { html: `${n} added ${b} to x before multiplying. In ${E}, only x is multiplied by ${k}; the ${b} is added after.`, ok: true },
              { html: `${n} should have added ${b} to ${k} first.`, why: `${k} and ${b} are never combined. ${k} multiplies x; ${b} is added to the product.` },
              { html: `${n} multiplied when the equation says to add.`, why: `${k}x does mean multiply. The mistake is <b>what</b> got multiplied: x + ${b} instead of just x.` },
              { html: `${n} substituted the wrong number for x.`, why: `x = ${x} was substituted correctly. The order of the operations is the problem.` },
            ]
          : [
              { html: `${n} multiplied only the ${whole} by ${x} and then wrote 0.5 once. ${fmt(k)} × ${x} means ${whole} × ${x} plus 0.5 × ${x}.`, ok: true },
              { html: `${n} should not have added ${b} at the end.`, why: `The + ${b} is part of the equation, so adding it is right. Check the line before: ${fmt(k)} × ${x}.` },
              { html: `${n} should have added ${fmt(k)} and ${x} instead of multiplying.`, why: `${fmt(k)}x means ${fmt(k)} times x, so multiplying is right. The multiplication itself is wrong.` },
              { html: `${n} substituted the wrong number for x.`, why: `x = ${x} was substituted correctly. The product ${fmt(k)} × ${x} is the problem.` },
            ];
    const sh = shuffleOptions(r, opts, 0);
    return {
      type: 'error',
      skill: 'substitute',
      lesson: '9-4',
      title: 'Find the mistake in the substitution',
      prompt: `<p>${n} used the equation <b>${E}</b> to find y when x = ${x}.</p><p>Which statement describes the mistake? Then give the correct value of y.</p>`,
      work: `<p>${n}'s work: ${badWork}</p>`,
      options: sh.options,
      answer: sh.answer,
      fix: { label: 'Correct y: ', answer: y, tolerance: 0.005 },
      hints: [
        `Check ${n}'s work one step at a time against ${E}. Which operation does ${fmt(k)}x stand for, and what gets added?`,
        `${fmt(k)}x means ${fmt(k)} × x. Substituting x = ${x} gives ${subst(k, b, x)}. Compare that with ${n}'s first step.`,
        `Multiply ${fmt(k)} × ${x} first, then add ${b}.${halfTip(k, x)}`,
      ],
      hintEs: `Revisa el trabajo de ${n} paso por paso con ${E}. ¿Qué operación representa ${fmt(k)}x y qué se suma?`,
      solution: `<p>${
        variant === 'added' ? `${n} treated ${k}x as ${k} + x. It means ${k} times x.` : variant === 'parens' ? `${n} added ${b} to x before multiplying, but only x is multiplied by ${k}.` : `${n} multiplied only the ${whole} by ${x}. ${fmt(k)} × ${x} = ${whole} × ${x} + 0.5 × ${x} = ${whole * x} + ${fmt(0.5 * x)} = ${fmt(kx)}.`
      } Correct work: y = ${subst(k, b, x)} = ${fmt(kx)} + ${b} = <b>${fmt(y)}</b>.</p>`,
      feedback: {
        correct: 'Correct. A coefficient means multiply, and multiplication comes before the addition in y = kx + b.',
        wrong(ans, d) {
          if (!d.mistakeOk) return (sh.options[ans.mistake] && sh.options[ans.mistake].why) || `Compare ${n}'s first step with ${fmt(k)} × ${x} + ${b}.`;
          const v = parseNum(ans.fix);
          if (near(v, badFinal)) return `Mistake found, but your fix repeats ${n}'s answer. Redo the work: ${subst(k, b, x)}.`;
          if (near(v, kx)) return `Mistake found. For the fix, add the ${b} after multiplying.`;
          return `Mistake found. For the fix, multiply ${fmt(k)} × ${x} first, then add ${b}.`;
        },
      },
    };
  });

  // ---------- Work backward, one step (num; hard: decimal or large rates) ----------
  G.define('v4_backOneStep', (r, o) => {
    const hard = !!o.hard;
    const isMult = hard || r.chance(0.6);
    const dec = hard && r.chance(0.5);
    const c = r.pick(dec ? DEC_CTX : CTX),
      n = r.pick(NAMES);
    const k = dec ? r.pick([0.5, ...DEC_RATES]) : !isMult ? 1 : hard ? r.int(7, 12) : r.int(2, 6);
    const b = isMult ? 0 : r.int(2, 9);
    const x = dec ? 2 * r.int(4, 12) : hard ? r.int(12, 25) : r.int(4, 12);
    const y = round(k * x + b, 2);
    const E = eq(k, b, c.yv, c.xv);
    const divTip = k === 0.5 ? ' Dividing by 0.5 is the same as doubling.' : dec ? ` Ask: how many groups of ${fmt(k)} make ${fmt(y)}?` : '';
    return {
      type: 'num',
      skill: 'backward',
      lesson: '9-4',
      title: 'Work backward to the input',
      prompt: `<p>${story(c, n, k, b)} The equation is ${hl(E)}, where ${c.xv} is the ${c.xw} and ${c.yv} is the ${c.yw}.</p><p>The ${c.yw} is ${hl(yWord(c, y))}. What is the ${c.xw}?</p>`,
      unit: c.many,
      answer: x,
      hints: [
        `You know the output (${c.yv}) and need the input (${c.xv}). Undo the operation in the equation.`,
        isMult ? `The equation multiplies ${c.xv} by ${fmt(k)}. To undo multiplying, divide: ${fmt(y)} ÷ ${fmt(k)}.${divTip}` : `The equation adds ${b} to ${c.xv}. To undo adding, subtract: ${y} − ${b}.`,
        `Check your answer by substituting it back: ${isMult ? `${fmt(k)} × ? = ${fmt(y)}` : `? + ${b} = ${y}`}.`,
      ],
      hintEs: `Conoces la salida (${c.yv}) y necesitas la entrada (${c.xv}). Deshaz la operación de la ecuación.`,
      solution: `<p>Substitute ${c.yv} = ${fmt(y)}: ${
        isMult ? `${fmt(y)} = ${fmt(k)}${c.xv}. Divide both sides by ${fmt(k)}: ${c.xv} = ${fmt(y)} ÷ ${fmt(k)} = ` : `${y} = ${c.xv} + ${b}. Subtract ${b} from both sides: ${c.xv} = ${y} − ${b} = `
      }<b>${x}</b>. Check: ${subst(k, b, x)} = ${fmt(y)}. ✓ The ${c.xw} is ${x}.</p>`,
      feedback: {
        correct: 'Correct. Working backward means undoing: divide to undo multiplying, subtract to undo adding.',
        wrong(ans, d) {
          const v = d.value;
          if (v == null) return `Type a number of ${c.many}.`;
          if (isMult && near(v, y * k)) return `You multiplied, but ${fmt(y)} is already the output. To find the input, divide ${fmt(y)} by ${fmt(k)}.`;
          if (isMult && near(v, y - k)) return `You subtracted ${fmt(k)}, but the equation multiplies by ${fmt(k)}. Undo multiplying with division.`;
          if (!isMult && v === y + b) return `You added, but ${y} is already the output. To find the input, subtract ${b} from ${y}.`;
          if (near(v, y)) return `${fmt(y)} is the ${c.yw}, which is given. Work backward to find the ${c.xw}.`;
          return `Substitute your answer into ${E}. Does it give ${fmt(y)}? Undo the ${isMult ? 'multiplying by dividing' : 'adding by subtracting'}.`;
        },
      },
    };
  });

  // ---------- Work backward, two steps (num, honors hard) ----------
  G.define('v4_backTwoStep', (r, o) => {
    const hard = !!o.hard;
    const k = hard ? r.int(4, 9) : r.int(2, 6);
    const b = hard ? r.int(5, 15) : r.int(1, 8);
    const x = hard ? r.int(7, 15) : r.int(3, 9);
    const y = k * x + b;
    const E = hard && r.chance(0.5) ? `y = ${b} + ${k}x` : eq(k, b);
    return {
      type: 'num',
      skill: 'backward',
      lesson: '9-4',
      title: 'Undo two steps',
      prompt: `<p>Use the equation ${hl(E)}.</p><p>When y = ${hl(y)}, what is x?</p>`,
      answer: x,
      hints: [
        `To find x from y, undo the steps in reverse order. The equation multiplies x by ${k} and then adds ${b}, so first undo the adding, then undo the multiplying.`,
        `Subtract ${b} from ${y}: ${y} − ${b} = ${y - b}. That is the value of ${k}x.`,
        `Now undo the multiplying: ${y - b} ÷ ${k}.`,
      ],
      hintEs: `Para hallar x a partir de y, deshaz los pasos en orden inverso. La ecuación multiplica x por ${k} y luego suma ${b}; primero deshaz la suma y después la multiplicación.`,
      solution: `<p>${y} = ${k}x + ${b}. Subtract ${b} from both sides: ${k}x = ${y - b}. Divide both sides by ${k}: x = ${y - b} ÷ ${k} = <b>${x}</b>. Check: ${subst(k, b, x)} = ${k * x} + ${b} = ${y}. ✓ You undo the last step first, so subtracting comes before dividing.</p>`,
      feedback: {
        correct: 'Correct. Undo in reverse order: subtract the starting value, then divide by the rate.',
        wrong(ans, d) {
          const v = d.value;
          if (v == null) return 'Type a number for x.';
          if (near(v, y / k - b)) return `You divided before subtracting. The equation added ${b} last, so undo that first: ${y} − ${b}, then divide by ${k}.`;
          if (v === y - b) return `${y} − ${b} = ${y - b} is a good first step, but that is ${k}x, not x. Divide by ${k}.`;
          if (near(v, (y + b) / k)) return `You added ${b} instead of subtracting it. The equation added ${b}, so undo it by subtracting.`;
          if (near(v, (y - k) / b)) return `You mixed up the roles. ${b} was added, so subtract ${b}; ${k} multiplied x, so divide by ${k}.`;
          if (v === y) return `${y} is y. The question asks for x.`;
          return `Undo the steps in reverse: subtract ${b} first, then divide by ${k}. Check by substituting back.`;
        },
      },
    };
  });

  // ---------- Work backward in a story, scaffolded (blanks, honors hard: no equation given) ----------
  G.define('v4_backStory', (r, o) => {
    const hard = !!o.hard;
    const c = r.pick(CTX),
      n = r.pick(NAMES);
    const k = hard ? r.int(4, 9) : r.int(2, 6);
    const b = hard ? otherB(r, k, 5, 15) : otherB(r, k, 1, 8);
    const x = hard ? r.int(8, 15) : r.int(4, 9);
    const y = k * x + b;
    const E = eq(k, b, c.yv, c.xv);
    return {
      type: 'blanks',
      skill: 'backward',
      lesson: '9-4',
      title: 'Work backward to the goal',
      prompt: `<p>${c.aff(n, k, b)} ${hard ? '' : `The equation is ${hl(E)}, where ${c.xv} is the ${c.xw} and ${c.yv} is the ${c.yw}.`}</p><p>${cap(n)}'s ${c.yw} came to ${hl(yWord(c, y))}. Work backward to find the ${c.xw}.</p>`,
      template: `Undo the starting value: ${y} − {0} = {1}.   Undo the rate: divide by {2} to get {3} ${c.many}.`,
      fields: [
        { label: 'starting value', answer: b, width: 'xs' },
        { label: 'after subtracting', answer: y - b, width: 'sm' },
        { label: 'rate', answer: k, width: 'xs' },
        { label: c.xw, answer: x, width: 'sm' },
      ],
      hints: [
        `The ${hard ? 'rule' : 'equation'} did two things to the ${c.xw}: multiplied by the rate, then added the starting value. Undo them in reverse order.`,
        `The starting value is the ${yWord(c, b)} that happened once. Subtract it from ${y} first.`,
        `${y} − ${b} = ${y - b}. That is ${k} × (${c.xw}). Divide by ${k}.`,
      ],
      hintEs: `La ${hard ? 'regla' : 'ecuación'} le hizo dos cosas ${c.xwEs.replace(/^el /, 'al ')}: lo multiplicó por la tasa y luego le sumó el valor inicial. Deshazlas en orden inverso.`,
      solution: `<p>${hard ? `The story gives ${E}. ` : ''}${y} = ${k}${c.xv} + ${b}. Subtract the starting value: ${y} − ${b} = ${y - b}. Divide by the rate: ${y - b} ÷ ${k} = <b>${x}</b>. Check: ${subst(k, b, x)} = ${y}. ✓ So ${n} had ${count(c, x)}.</p>`,
      feedback: {
        correct: 'Correct. Subtract the one-time amount first, then divide by the per-one amount.',
        wrong(ans, d) {
          const i = d.wrong[0];
          const v = parseNum(ans[i]);
          if (i === 0)
            return v === k
              ? `${k} is the rate, the amount for every ${c.one}. The starting value is the amount that happened once: the ${yWord(c, b)}.`
              : `The starting value is the ${yWord(c, b)}, the part that is added once.`;
          if (i === 1) return v === y + b ? `You added ${b}. To undo adding, subtract.` : `Subtract the starting value from ${y}.`;
          if (i === 2) return v === b ? `${b} is the starting value, already undone. Divide by the rate: the amount for every ${c.one}.` : `The rate is the amount for every ${c.one}, the number that multiplies ${c.xv}.`;
          if (v === y - b) return `${y - b} is ${k} times the ${c.xw}. Divide it by ${k}.`;
          if (near(v, y / k)) return `You divided ${y} by ${k}, but ${y} still includes the starting value. Divide ${y - b} instead.`;
          return `Divide the amount after subtracting by the rate to find the ${c.xw}.`;
        },
      },
    };
  });

  // ---------- Who worked backward correctly (who; hard: three students, bigger numbers) ----------
  G.define('v4_whoBackward', (r, o) => {
    const hard = !!o.hard;
    const [n1, n2, n3] = r.pickN(NAMES, 3);
    const k = hard ? r.int(4, 9) : r.int(2, 6);
    const b = hard ? otherB(r, k, 5, 15) : r.int(1, 8);
    const x = hard ? r.int(7, 14) : r.int(3, 9);
    const y = k * x + b;
    const E = eq(k, b);
    const wrongDivText = fmt(round(y / k, 2));
    const wrongFinal = fmt(round(y / k - b, 2));
    const swapMid = y - k,
      swapFinal = fmt(round((y - k) / b, 2));
    const opts = [
      { title: n1, html: `<p>${y} = ${k}x + ${b}</p><p>${y} − ${b} = ${y - b}</p><p>${y - b} ÷ ${k} = ${x}</p><p>x = ${x}</p>`, ok: true },
      {
        title: n2,
        html: `<p>${y} = ${k}x + ${b}</p><p>${y} ÷ ${k} = ${wrongDivText}</p><p>${wrongDivText} − ${b} = ${wrongFinal}</p><p>x = ${wrongFinal}</p>`,
        why: `${n2} divided first. The equation added ${b} <b>last</b>, so undo that first by subtracting ${b}. Check: ${k} × ${wrongFinal} + ${b} is not ${y}.`,
      },
    ];
    if (hard)
      opts.push({
        title: n3,
        html: `<p>${y} = ${k}x + ${b}</p><p>${y} − ${k} = ${swapMid}</p><p>${swapMid} ÷ ${b} = ${swapFinal}</p><p>x = ${swapFinal}</p>`,
        why: `${n3} mixed up the roles of the numbers. ${b} was added, so subtract ${b}; ${k} multiplied x, so divide by ${k}.`,
      });
    const sh = shuffleOptions(r, opts, 0);
    return {
      type: 'who',
      skill: 'backward',
      lesson: '9-4',
      title: 'Who worked backward correctly?',
      prompt: `<p>${hard ? 'Three' : 'Two'} students used ${hl(E)} to find x when y = ${hl(y)}.</p><p>Whose work is correct?</p>`,
      options: sh.options,
      answer: sh.answer,
      layout: 'cards',
      hints: [
        `The equation multiplies by ${k} and then adds ${b}. Working backward undoes the steps in reverse order.`,
        `Undo the last step first. The last step was + ${b}, so start by subtracting ${b} from ${y}.`,
        `Check each answer by substituting it back into ${E}. Only one gives ${y}.`,
      ],
      hintEs: `La ecuación multiplica por ${k} y luego suma ${b}. Trabajar hacia atrás deshace los pasos en orden inverso.`,
      solution: `<p><b>${n1}</b> is correct. The equation does "multiply by ${k}, then add ${b}," so undoing goes "subtract ${b}, then divide by ${k}": ${y} − ${b} = ${y - b}, ${y - b} ÷ ${k} = ${x}. Check: ${subst(k, b, x)} = ${y}. ✓ ${n2} divided before subtracting, which treats the ${b} as if it had been multiplied too.${hard ? ` ${n3} subtracted the rate and divided by the starting value.` : ''}</p>`,
      feedback: {
        correct: 'Correct. Undo the last operation first. Substituting back is the proof.',
        wrong(ans) {
          return (sh.options[ans] && sh.options[ans].why) || `Substitute each answer back into ${E}. Only one gives ${y}.`;
        },
      },
    };
  });

  // ---------- Make a table and plot the equation (plot; hard: steeper rule on a by-4 axis) ----------
  G.define('v4_plotEquation', (r, o) => {
    const hard = !!o.hard;
    const c = r.pick(CTX),
      n = r.pick(NAMES);
    const b = hard ? r.int(1, 4) : r.chance(0.6) ? r.int(1, 4) : 0;
    const k = hard ? r.int(3, 5) : b ? r.int(1, 4) : r.int(2, 4);
    const xs = hard
      ? r.pick([
          [0, 1, 3, 4],
          [0, 2, 3, 4],
          [1, 2, 4],
        ])
      : r.pick([
          [0, 1, 2, 3, 4],
          [1, 2, 3, 4],
          [0, 2, 4],
        ]);
    const E = eq(k, b, c.yv, c.xv);
    const points = xs.map((x) => [x, k * x + b]);
    const g = grid(k * 4 + b);
    const pairText = (p) => `(${p[0]}, ${p[1]})`;
    return {
      type: 'plot',
      skill: 'substitute',
      lesson: '9-4',
      title: 'Graph the equation',
      prompt: `<p>${story(c, n, k, b)} The equation is ${hl(E)}, where ${c.xv} is the ${c.xw} and ${c.yv} is the ${c.yw}.</p><p>Make a table of values for ${c.xv} = ${xs.join(', ')}. Then plot each (${c.xv}, ${c.yv}) pair as a point.</p><p class="muted">Click a grid point to place or remove a point.</p>`,
      xLabel: c.xLabel,
      yLabel: c.yLabel,
      xMax: 5,
      yMax: g.yMax,
      xStep: 1,
      yStep: g.yStep,
      points,
      count: points.length,
      hints: [
        `Substitute each ${c.xv}-value into ${E} to get its ${c.yv}-value. Each pair (${c.xv}, ${c.yv}) is one point.`,
        `${c.xv} = ${xs[0]} → ${subst(k, b, xs[0])} = ${k * xs[0] + b}. So the first point is (${xs[0]}, ${k * xs[0] + b}): ${xs[0]} across, ${k * xs[0] + b} up.${g.yStep > 1 ? ` The vertical axis counts by ${g.yStep}s.` : ''}`,
        `The points are ${points.map(pairText).join(', ')}. They should line up in a straight line.`,
      ],
      hintEs: `Sustituye cada valor de ${c.xv} en ${E} para obtener su valor de ${c.yv}. Cada par (${c.xv}, ${c.yv}) es un punto.`,
      solution: `<p>Table: ${points.map((p) => `${c.xv} = ${p[0]} → ${c.yv} = ${p[1]}`).join('; ')}. Plot ${points.map(pairText).join(', ')}. The points lie on a straight line because the ${c.yw} rises by ${k} for every ${c.one}.</p>${V.graph({ xLabel: c.xLabel, yLabel: c.yLabel, xMax: 5, yMax: g.yMax, yStep: g.yStep, size: 260, series: [{ points, line: true }] })}`,
      feedback: {
        correct: 'Correct. Equation to table to graph: three views of one relationship.',
        wrong(ans, d) {
          if (d.extra && d.extra.length) {
            const p = d.extra[0];
            if (points.some((q) => q[0] === p[1] && q[1] === p[0])) return `(${p[0]}, ${p[1]}) has the coordinates reversed. The ${c.xw} goes across; the ${c.yw} goes up.`;
            if (b && p[1] === k * p[0]) return `(${p[0]}, ${p[1]}) forgets the starting value. For ${c.xv} = ${p[0]}, add ${b} after multiplying.`;
            if (!xs.includes(p[0])) return `The table only uses ${c.xv} = ${xs.join(', ')}. ${p[0]} is not one of them.`;
            return `(${p[0]}, ${p[1]}) is not on this graph. Substitute ${c.xv} = ${p[0]} into ${E} and check the height.${g.yStep > 1 ? ` The vertical axis counts by ${g.yStep}s.` : ''}`;
          }
          const m = d.missing[0];
          return `You still need the point for ${c.xv} = ${m[0]}. Substitute it into ${E} to find its height.`;
        },
      },
    };
  });

  // ---------- Limit or goal: greatest or least whole input (mc; hard adds "at least" goals that round up) ----------
  G.define('v4_goalCompare', (r, o) => {
    const hard = !!o.hard;
    const c = r.pick(CTX),
      n = r.pick(NAMES);
    const k = hard ? r.int(4, 9) : r.int(2, 6);
    const b = hard ? otherB(r, k, 5, 15) : r.chance(0.7) ? otherB(r, k, 1, 8) : 0;
    const x = hard ? r.int(6, 14) : r.int(4, 10);
    const rem = r.int(1, k - 1);
    const G0 = k * x + b + rem;
    const E = eq(k, b, c.yv, c.xv);
    const atLeast = hard && r.chance(0.5);
    const right = atLeast ? x + 1 : x;
    const ignoreB = atLeast ? Math.ceil(G0 / k) : Math.floor(G0 / k);
    const base = atLeast
      ? [
          { html: count(c, x + 1), ok: true },
          { html: count(c, x), why: `${count(c, x)} gives ${subst(k, b, x)} = ${k * x + b}, which is short of ${G0}. With "at least," the leftover means you round up.` },
          { html: count(c, ignoreB), why: `${ignoreB} comes from ${G0} ÷ ${k}, which ignores the ${yWord(c, b)} that is added once. Subtract ${b} first.` },
          { html: count(c, x + 2), why: `${count(c, x + 2)} reaches the goal, but so does ${count(c, x + 1)}: ${subst(k, b, x + 1)} = ${k * (x + 1) + b}. The question asks for the least number.` },
          { html: count(c, G0 - b), why: `${G0} − ${b} = ${G0 - b} is the amount still needed, not the number of ${c.many}. Divide it by ${k}.` },
        ]
      : [
          { html: count(c, x), ok: true },
          { html: count(c, x + 1), why: `${count(c, x + 1)} would make the ${c.yw} ${subst(k, b, x + 1)} = ${k * (x + 1) + b}, which is more than ${G0}. You cannot round up when there is a limit.` },
          { html: count(c, ignoreB), why: `${ignoreB} comes from ${G0} ÷ ${k}, which ignores the ${yWord(c, b)} that is added once. Subtract ${b} first.` },
          {
            html: count(c, G0 - b),
            why: b
              ? `${G0} − ${b} = ${G0 - b} is the amount left for the ${c.many}, not the number of ${c.many}. Divide it by ${k}.`
              : `${G0} is the limit on the ${c.yw}, not a number of ${c.many}. Each ${c.one} uses ${k}, so divide ${G0} by ${k}.`,
          },
          { html: count(c, x - 1), why: `${count(c, x - 1)} stays under the limit, but so does ${count(c, x)}: ${subst(k, b, x)} = ${k * x + b}. The question asks for the greatest number.` },
        ];
    const opts = dedupe(base).slice(0, 4);
    const sh = shuffleOptions(r, opts, 0);
    const undo = b ? `${G0} − ${b} = ${G0 - b}. ${G0 - b} ÷ ${k}` : `${G0} ÷ ${k}`;
    return {
      type: 'mc',
      skill: 'backward',
      lesson: '9-4',
      title: atLeast ? 'Reach the goal' : 'Stay within the limit',
      prompt: `<p>${story(c, n, k, b)} The equation is ${hl(E)}, where ${c.xv} is the ${c.xw} and ${c.yv} is the ${c.yw}.</p><p>${
        atLeast ? `${n} needs the ${c.yw} to be <b>at least</b> ${hl(yWord(c, G0))}. What is the <b>least</b> ${c.xw} that reaches the goal?` : `The ${c.yw} may not go over ${hl(yWord(c, G0))}. What is the <b>greatest</b> ${c.xw} possible?`
      }</p>`,
      options: sh.options,
      answer: sh.answer,
      hints: [
        `Work backward from ${atLeast ? 'the goal' : 'the limit'}: ${b ? `subtract the ${yWord(c, b)}, then divide by ${k}` : `divide ${G0} by ${k}`}. The answer will not come out even.`,
        `${undo} is between ${x} and ${x + 1}. Which whole number ${atLeast ? 'reaches the goal' : 'keeps the ' + c.yw + ' under the limit'}?`,
        `Check ${count(c, x)}: ${subst(k, b, x)} = ${k * x + b}. Check ${count(c, x + 1)}: ${subst(k, b, x + 1)} = ${k * (x + 1) + b}. Compare each with ${G0}.`,
      ],
      hintEs: `Trabaja hacia atrás desde ${atLeast ? 'la meta' : 'el límite'}: ${b ? `resta ${yWordEs(c, b)} y luego divide entre ${k}` : `divide ${G0} entre ${k}`}. La respuesta no dará exacta.`,
      solution: `<p>Work backward from ${G0}: ${b ? `${G0} − ${b} = ${G0 - b}, and ${G0 - b} ÷ ${k} = ${x} with ${rem} left over` : `${G0} ÷ ${k} = ${x} with ${rem} left over`}. The ${c.xw} must be a whole number. ${
        atLeast
          ? `${count(c, x)} gives only ${k * x + b}, short of ${G0}, so round <b>up</b>: <b>${count(c, right)}</b>. Check: ${subst(k, b, x + 1)} = ${k * (x + 1) + b} ≥ ${G0}.`
          : `It must keep the ${c.yw} at or under ${G0}, so round <b>down</b>: <b>${count(c, right)}</b>. Check: ${subst(k, b, x)} = ${k * x + b} ≤ ${G0}, and ${count(c, x + 1)} would be ${k * (x + 1) + b}, too much.`
      }</p>`,
      feedback: {
        correct: atLeast ? 'Correct. With a goal of "at least," the leftover means you round up. Checking both neighbors proves it.' : 'Correct. With a limit, the leftover means you round down. Checking both neighbors proves it.',
        wrong(ans) {
          return (sh.options[ans] && sh.options[ans].why) || `Work backward, then check the two whole numbers on either side.`;
        },
      },
    };
  });

  // ---------- True/false: does the plan fit the limit or reach the goal? (tf; hard: "at least" goals, bigger numbers) ----------
  G.define('v4_tfGoal', (r, o) => {
    const hard = !!o.hard;
    const c = r.pick(CTX),
      n = r.pick(NAMES);
    const k = hard ? r.int(4, 9) : r.int(2, 6);
    const b = hard ? otherB(r, k, 5, 15) : r.chance(0.6) ? otherB(r, k, 1, 8) : 0;
    const x = hard ? r.int(8, 16) : r.int(4, 10);
    const y = k * x + b;
    const truthy = r.chance(0.5);
    const E = eq(k, b, c.yv, c.xv);
    let limit, statement, reasons;
    if (hard) {
      limit = truthy ? y - r.int(0, k - 1) : y + r.int(1, k);
      statement = `${n} can reach a goal of at least ${yWord(c, limit)} with ${count(c, x)}.`;
      reasons = r.shuffle([
        { html: `True. ${subst(k, b, x)} = ${y}, and ${y} is at least ${limit}.`, correct: truthy },
        { html: `False. ${subst(k, b, x)} = ${y}, and ${y} is less than ${limit}.`, correct: !truthy },
        { html: `False. ${x} is less than ${limit}, so ${n} cannot reach the goal.`, correct: false },
        { html: `True. ${k} × ${x} = ${k * x}, and that is close enough to ${limit}.`, correct: false },
      ]);
    } else {
      limit = truthy ? y + r.int(0, k - 1) : y - r.int(1, k);
      statement = `With a limit of ${yWord(c, limit)}, ${n} can have ${count(c, x)}.`;
      reasons = r.shuffle([
        { html: `True. ${subst(k, b, x)} = ${y}, and ${y} is not more than ${limit}.`, correct: truthy },
        { html: `False. ${subst(k, b, x)} = ${y}, and ${y} is more than ${limit}.`, correct: !truthy },
        { html: `True. ${x} is less than ${limit}, so it fits.`, correct: false },
        { html: `False. ${k} × ${x} = ${k * x} is not equal to ${limit}.`, correct: false },
      ]);
    }
    return {
      type: 'tf',
      skill: 'substitute',
      lesson: '9-4',
      title: hard ? 'Does it reach the goal?' : 'Does it fit the limit?',
      prompt: `<p>${story(c, n, k, b)} The equation is ${hl(E)}, where ${c.xv} is the ${c.xw} and ${c.yv} is the ${c.yw}.</p><p>True or false: <b>${statement}</b></p>`,
      statement,
      answer: truthy,
      reasons,
      hints: [
        `Substitute ${x} into the equation to find the ${c.yw}. Then compare it with the ${hard ? 'goal' : 'limit'}.`,
        `${c.xv} = ${x}: ${subst(k, b, x)} = ?`,
        `Compare that ${c.yw} with ${limit}. ${hard ? 'Is it at least ' + limit + '?' : 'Is it more than ' + limit + ', or not?'}`,
      ],
      hintEs: `Sustituye ${x} en la ecuación para hallar ${c.ywEs}. Luego compáralo con ${hard ? 'la meta' : 'el límite'}.`,
      solution: hard
        ? `<p><b>${truthy ? 'True' : 'False'}.</b> For ${count(c, x)}, the ${c.yw} is ${subst(k, b, x)} = ${y}. Since ${y} ${truthy ? '≥' : '<'} ${limit}, ${truthy ? 'it reaches' : 'it falls short of'} the goal. Comparing ${x} with ${limit} would compare a ${c.xw} with a ${c.yw}, which means nothing.</p>`
        : `<p><b>${truthy ? 'True' : 'False'}.</b> For ${count(c, x)}, the ${c.yw} is ${subst(k, b, x)} = ${y}. Since ${y} ${truthy ? '≤' : '>'} ${limit}, ${truthy ? 'it fits' : 'it goes over'} the limit. Comparing ${x} with ${limit} would compare a ${c.xw} with a ${c.yw}, which means nothing.</p>`,
      feedback: {
        correct: 'Correct, with the right reason. Substitute first, then compare the output with the target.',
        wrong(ans, d) {
          const pick = reasons[ans && ans.reason];
          if (!d.valueOk) return `Find the ${c.yw} for ${count(c, x)} by substituting into ${E}, including the + ${b}. Then compare it with ${limit}.`;
          if (pick && new RegExp(`^(True|False)\\. ${x} is less than`).test(pick.html)) return `Your true/false choice is right, but that reason compares the ${c.xw} (${x}) with a ${c.yw}. Compare the ${c.yw} with ${limit}.`;
          return `Your true/false choice is right, but the reason should compare the full ${c.yw} (${y}) with ${limit}.`;
        },
      },
    };
  });

  // ---------- Explain working backward (cr; hard: a decimal rate) ----------
  G.define('v4_crBackward', (r, o) => {
    const hard = !!o.hard;
    const c = r.pick(hard ? DEC_CTX : CTX),
      n = r.pick(NAMES);
    const k = hard ? r.pick(DEC_RATES) : r.int(2, 6);
    const b = hard ? r.int(4, 15) : otherB(r, k, 1, 8);
    const x = hard ? 2 * r.int(3, 10) : r.int(4, 9);
    const y = round(k * x + b, 2);
    const E = eq(k, b, c.yv, c.xv);
    const K = fmt(k);
    const sh = shuffleOptions(
      r,
      [
        { html: `Subtract ${b} from ${fmt(y)}, then divide by ${K}. You undo the steps in reverse order, and the last step in the equation was adding ${b}.`, ok: true },
        {
          html: `Divide ${fmt(y)} by ${K}, then subtract ${b}. You undo the multiplying first because it comes first in the equation.`,
          why: `Undoing goes in <b>reverse</b> order. The equation multiplies and then adds, so undo the adding first: subtract ${b}, then divide.`,
        },
        { html: `Multiply ${fmt(y)} by ${K}, then add ${b}.`, why: `That is how to go from ${c.xv} to ${c.yv}. Here ${c.yv} is known and you need ${c.xv}, so you must undo: subtract, then divide.` },
        {
          html: `Subtract ${K} from ${fmt(y)}, then divide by ${b}.`,
          why: `The numbers are in the wrong roles. ${b} is what was added, so subtract ${b}. ${K} is what multiplied ${c.xv}, so divide by ${K}.`,
        },
      ],
      0,
    );
    return {
      type: 'cr',
      skill: 'backward',
      lesson: '9-4',
      title: 'Explain how to work backward',
      prompt: `<p>${story(c, n, k, b)} The equation is ${hl(E)}. ${cap(n)}'s ${c.yw} was ${hl(yWord(c, fmt(y)))}.</p><p>Explain how to find the ${c.xw} from the ${c.yw}. Then choose the explanation that is correct.</p>`,
      starters: ['The equation multiplies by … and then adds …, so to undo it I …', 'First I subtract … because …', 'Then I divide by … because …'],
      minWords: 10,
      check: { prompt: 'Which explanation is correct?', options: sh.options, answer: sh.answer },
      hints: [
        'Working backward means undoing each operation. Undo them in the reverse order from the equation.',
        `The equation says: multiply ${c.xv} by ${K}, then add ${b}. The reverse order is: undo the + ${b}, then undo the × ${K}.`,
        `Undo adding by subtracting (${fmt(y)} − ${b}). Undo multiplying by dividing (÷ ${K}).`,
      ],
      hintEs: 'Trabajar hacia atrás quiere decir deshacer cada operación. Deshazlas en el orden inverso al de la ecuación.',
      solution: `<p>Model explanation: "The equation multiplies the ${c.xw} by ${K} and then adds ${b}. To undo it, I go in reverse. First I subtract ${b}: ${fmt(y)} − ${b} = ${fmt(round(y - b, 2))}. Then I divide by ${K}: ${fmt(round(y - b, 2))} ÷ ${K} = <b>${x}</b>. I check by substituting: ${subst(k, b, x)} = ${fmt(y)}."</p>`,
      feedback: {
        correct: 'Correct. Reverse the order and reverse each operation.',
        wrong(ans, d) {
          if (!d.wroteEnough) return 'Write a full explanation of at least ten words. A sentence starter can help.';
          return (sh.options[ans.check] && sh.options[ans.check].why) || 'Undo the last step of the equation first.';
        },
      },
    };
  });
})(typeof window !== 'undefined' ? window : globalThis);

/* js/units/u9/gen-cave.js */
/* Challenge zone — The Undercity Line. Harder mixed-skill generators: decimal rates, hidden rules, break-even, solutions of two-variable equations. */
(function (root) {
  'use strict';
  const RX = root.RX;
  const { G, V, shuffleOptions, NAMES, parseNum, fmt, round, money } = RX;
  const { CTX, eq, yWord, de, grid } = RX.U9;
  const hl = V.hl;
  const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
  const subst = (k, b, x) => `${k === 1 ? x : fmt(k) + ' × ' + x}${b ? ' + ' + b : ''}`;
  const count = (c, n) => `${n} ${n === 1 ? c.one : c.many}`;
  const near = (a, b) => a != null && Math.abs(a - b) < 0.005;
  /** Contexts from the shared pool where a decimal rate makes sense. */
  const DEC_SHARED = CTX.filter((c) => c.money || ['meters', 'centimeters', 'pages'].includes(c.yu));
  /** Tip for multiplying or dividing by a decimal rate. */
  const decTip = (k) => (k % 1 === 0.5 ? `${fmt(k)} × a number is ${Math.floor(k) ? `${Math.floor(k)} times the number plus ` : ''}half of it` : `multiply the whole-number part and the decimal part separately, then add`);

  /* Contexts whose rates can be decimals. amt(v): the value in the context's units ("$1.50", "2.5 meters"). Spanish fields feed hintEs. */
  const DCTX = [
    {
      xLabel: 'Number of Stops',
      yLabel: 'Fare ($)',
      xw: 'number of stops',
      yw: 'total fare',
      one: 'stop',
      many: 'stops',
      xv: 's',
      yv: 'c',
      xwEs: 'el número de paradas',
      ywEs: 'la tarifa total',
      oneEs: 'parada',
      manyEs: 'paradas',
      amt: (v) => money(v),
      aff: (n, k, b) => `${n} rides the Undercity tram. It charges a ${money(b)} boarding fee plus ${money(k)} for every stop.`,
    },
    {
      xLabel: 'Number of Towers',
      yLabel: 'Cable (m)',
      xw: 'number of towers',
      yw: 'length of cable',
      one: 'tower',
      many: 'towers',
      xv: 't',
      yv: 'm',
      xwEs: 'el número de torres',
      ywEs: 'la longitud del cable',
      oneEs: 'torre',
      manyEs: 'torres',
      amt: (v) => `${fmt(v)} meters`,
      aff: (n, k, b) => `${n} is stringing cable on the Undercity Line. It starts with ${b} meters at the depot and needs ${fmt(k)} meters more for each tower.`,
    },
    {
      xLabel: 'Number of Weeks',
      yLabel: 'Savings ($)',
      xw: 'number of weeks',
      yw: 'total savings',
      one: 'week',
      many: 'weeks',
      xv: 'w',
      yv: 'd',
      xwEs: 'el número de semanas',
      ywEs: 'el ahorro total',
      oneEs: 'semana',
      manyEs: 'semanas',
      amt: (v) => money(v),
      aff: (n, k, b) => `${n} starts with ${money(b)} and saves ${money(k)} every week for an Undercity pass.`,
    },
    {
      xLabel: 'Number of Days',
      yLabel: 'Height (cm)',
      xw: 'number of days',
      yw: 'height of the moss',
      one: 'day',
      many: 'days',
      xv: 'd',
      yv: 'h',
      xwEs: 'el número de días',
      ywEs: 'la altura del musgo',
      oneEs: 'día',
      manyEs: 'días',
      amt: (v) => `${fmt(v)} centimeters`,
      aff: (n, k, b) => `${n} measures moss on the Undercity wall. It is ${b} centimeters tall now and grows ${fmt(k)} centimeters every day.`,
    },
  ];
  const DEC_RATES = [0.5, 1.5, 2.5];
  const DEC_RATES_HARD = [1.25, 2.75, 3.5, 4.5];

  // ---------- Write and use an equation with a decimal rate (blanks; hard: quarter rates, bigger inputs) ----------
  G.define('vc_decimalRate', (r, o) => {
    const hard = !!o.hard;
    const c = r.pick(DCTX),
      n = r.pick(NAMES);
    const k = r.pick(hard ? DEC_RATES_HARD : DEC_RATES);
    const b = hard ? r.int(5, 15) : r.int(1, 6);
    const x = hard ? r.int(6, 16) : r.int(3, 10);
    const kx = round(k * x, 2);
    const y = round(kx + b, 2);
    const E = `${c.yv} = ${fmt(k)}${c.xv} + ${b}`;
    return {
      type: 'blanks',
      skill: 'eq-situation',
      lesson: 'Challenge',
      title: 'A rate that is not a whole number',
      prompt: `<p>${c.aff(n, k, b)}</p><p>Let ${c.xv} be the ${c.xw} and ${c.yv} be the ${c.yw}. Write the equation, then find the ${c.yw} for ${hl(count(c, x))}.</p>`,
      template: `Equation: ${c.yv} = {0}${c.xv} + {1}.   For ${count(c, x)}, ${c.yv} = {2}.`,
      fields: [
        { label: 'rate', answer: k, width: 'xs' },
        { label: 'starting value', answer: b, width: 'xs' },
        { label: c.yw, answer: y, width: 'sm', tolerance: 0.005 },
      ],
      hints: [
        `The rate can be a decimal. It is still the amount for every ${c.one}, and it still multiplies ${c.xv}.`,
        `Rate ${fmt(k)}, starting value ${b}: ${E}. Now substitute ${c.xv} = ${x}.`,
        `${fmt(k)} × ${x} = ${fmt(kx)}. Then add ${b}.`,
      ],
      hintEs: `La tasa puede ser un decimal. Sigue siendo la cantidad por cada ${c.oneEs}, y sigue multiplicando a ${c.xv}.`,
      solution: `<p>Each ${c.one} adds ${c.amt(k)}, so the rate is ${fmt(k)}. The ${c.amt(b)} happens once, so the starting value is ${b}: <b>${E}</b>. For ${count(c, x)}: ${fmt(k)} × ${x} + ${b} = ${fmt(kx)} + ${b} = <b>${fmt(y)}</b>. The ${c.yw} is ${c.amt(y)}.</p>`,
      feedback: {
        correct: 'Correct. A decimal rate works exactly like a whole-number rate: multiply, then add the starting value.',
        wrong(ans, d) {
          const i = d.wrong[0];
          const v = parseNum(ans[i]);
          if (i === 0)
            return v === b
              ? `You put the starting value in the rate's place. The rate is the amount for every ${c.one}.`
              : `The rate is the decimal amount that repeats for every ${c.one}. You can type it as a decimal like 1.5 or a fraction like 3/2.`;
          if (i === 1) return v === k ? `You put the rate in the starting value's place. The starting value is the amount that happens once.` : `The starting value is the amount that happens once, before any ${c.many}.`;
          if (near(v, kx)) return `You forgot to add the starting value ${b} after multiplying.`;
          if (near(v, k + x + b)) return `${fmt(k)}${c.xv} means ${fmt(k)} times ${c.xv}. Multiply ${fmt(k)} × ${x}, then add ${b}.`;
          if (near(v, Math.floor(k) * x + (k % 1) + b)) return `You multiplied only the whole-number part of ${fmt(k)} by ${x}. The decimal part must be multiplied by ${x} too.`;
          return `For the last blank: ${fmt(k)} × ${x}, then add ${b}. Tip: ${decTip(k)}.`;
        },
      },
    };
  });

  // ---------- Find the hidden rule, then fill a missing input and output (table; hard: unevenly spaced columns) ----------
  G.define('vc_findRule', (r, o) => {
    const hard = !!o.hard;
    const c = r.pick(CTX);
    const k = hard ? r.int(3, 8) : r.int(2, 6);
    const b = hard ? r.int(2, 12) : r.int(1, 7);
    const given = hard ? [2, 4, 7] : [1, 2, 3];
    const x4 = hard ? r.int(9, 12) : r.int(5, 9),
      x5 = hard ? r.int(15, 20) : r.int(10, 14);
    const y4 = k * x4 + b,
      y5 = k * x5 + b;
    const E = eq(k, b, c.yv, c.xv);
    const gy = given.map((x) => k * x + b);
    return {
      type: 'table',
      skill: 'eq-table',
      lesson: 'Challenge',
      title: 'Find the rule, then fill both gaps',
      prompt: `<p>This table follows a rule of the form ${hl(`${c.yv} = k${c.xv} + b`)}, but the rule is not given.</p><p>Find the rule from the first three columns.${hard ? ' They are not evenly spaced.' : ''} Then fill in the missing ${c.xw} and the missing ${c.yw}.</p>`,
      rows: [
        [c.xLabel, ...given.map(String), '__IN:x__', String(x5)],
        [c.yLabel, ...gy.map(String), String(y4), '__IN:y__'],
      ],
      rowHeader: true,
      inputs: [
        { id: 'x', answer: x4 },
        { id: 'y', answer: y5 },
      ],
      hints: [
        hard
          ? `Find the rate first: the change in the ${c.yw} divided by the change in the ${c.xw}. Then find the starting value: the ${c.yw} for 0 ${c.many}.`
          : `Find the rate first: subtract neighboring ${c.yw} values. Then find the starting value: what would the ${c.yw} be for 0 ${c.many}?`,
        hard
          ? `From 2 to 4 ${c.many}, the ${c.yw} goes up by ${2 * k}, so the rate is ${2 * k} ÷ 2 = ${k}. Going back 2 ${c.many} from ${gy[0]} gives ${b}. So the rule is ${E}.`
          : `The ${c.yw} goes ${gy.join(', ')}: up by ${k} each time. Going back one step from ${k + b} gives ${b} for 0 ${c.many}. So the rule is ${E}.`,
        `Missing ${c.xw}: ${y4} − ${b} = ${y4 - b}, then ÷ ${k}. Missing ${c.yw}: ${k} × ${x5} + ${b}.`,
      ],
      hintEs: hard
        ? `Primero halla la tasa: el cambio en ${c.ywEs} dividido entre el cambio en ${c.xwEs}. Luego halla el valor inicial: ${c.ywEs} con 0 ${c.manyEs}.`
        : `Primero halla la tasa: resta valores vecinos ${de(c.ywEs)}. Luego halla el valor inicial: ¿cuánto sería ${c.ywEs} con 0 ${c.manyEs}?`,
      solution: `<p>Rate: ${hard ? `(${gy[1]} − ${gy[0]}) ÷ (4 − 2) = ${k}; check: (${gy[2]} − ${gy[1]}) ÷ (7 − 4) = ${k}` : `${gy[1]} − ${gy[0]} = ${k}`}. Starting value: ${gy[0]} − ${k} × ${given[0]} = ${b}. Rule: <b>${E}</b>. Missing ${c.xw}: ${y4} − ${b} = ${y4 - b}, and ${y4 - b} ÷ ${k} = <b>${x4}</b>. Missing ${c.yw}: ${k} × ${x5} + ${b} = <b>${y5}</b>.</p>`,
      feedback: {
        correct: 'Correct. Once the rule is known, the table can be completed in either direction.',
        wrong(ans, d) {
          const id = d.wrong[0];
          const v = parseNum(ans[id]);
          if (id === 'x') {
            if (near(v, y4 / k)) return `You divided ${y4} by ${k} without subtracting the starting value ${b} first.`;
            if (v === given[2] + 1) return `The columns do not have to go up by 1. Use the rule: the ${c.yw} ${y4} comes from some ${c.xw}. Undo + ${b}, then undo × ${k}.`;
            return `For the missing ${c.xw}, work backward from ${y4}: subtract the starting value, then divide by the rate.`;
          }
          if (v === k * x5) return `You forgot the starting value ${b}. The rule is ${E}.`;
          if (v === y4 + k) return `The ${c.xw} jumps from ${x4} to ${x5}, not by 1. Substitute ${x5} into the rule instead of adding ${k} once.`;
          if (hard && v === 2 * k * x5 + b) return `${2 * k} is the change for 2 ${c.many}. The rate for 1 ${c.one} is half of that.`;
          return `For the missing ${c.yw}, substitute ${x5} into the rule you found.`;
        },
      },
    };
  });

  // ---------- Plot an equation with spaced x-values (plot; hard: decimal rate with even inputs) ----------
  G.define('vc_graphEquation', (r, o) => {
    const hard = !!o.hard;
    const c = r.pick(hard ? DEC_SHARED : CTX);
    const k = hard ? r.pick(DEC_RATES) : r.int(1, 3);
    const xs = hard
      ? r.pick([
          [0, 2, 4, 6],
          [2, 4, 6, 8],
          [0, 4, 6, 8],
        ])
      : r.pick([
          [0, 2, 4, 6],
          [1, 3, 5, 7],
          [0, 3, 6],
        ]);
    const xTop = xs[xs.length - 1];
    // keep the largest y at or under 24 so the grid stays readable
    const b = hard ? r.int(1, Math.min(6, 24 - k * xTop)) : r.int(0, Math.min(5, 24 - k * xTop));
    const E = eq(k, b, c.yv, c.xv);
    const points = xs.map((x) => [x, round(k * x + b, 2)]);
    const top = round(k * xTop + b, 2);
    const g = grid(top);
    const pairText = (p) => `(${p[0]}, ${p[1]})`;
    return {
      type: 'plot',
      skill: 'multi-rep',
      lesson: 'Challenge',
      title: 'Graph the rule for skipped inputs',
      prompt: `<p>The Undercity signal follows ${hl(E)}, where ${c.xv} is the ${c.xw} and ${c.yv} is the ${c.yw}.</p><p>Plot the points for ${c.xv} = ${xs.join(', ')}. Read both axis scales carefully.</p><p class="muted">Click a grid point to place or remove a point.</p>`,
      xLabel: c.xLabel,
      yLabel: c.yLabel,
      xMax: 8,
      yMax: g.yMax,
      xStep: 1,
      yStep: g.yStep,
      points,
      count: points.length,
      hints: [
        `Substitute each ${c.xv}-value into ${E}. The inputs skip numbers, so calculate each one; do not just add ${fmt(k)}.`,
        `${c.xv} = ${xs[0]} → ${subst(k, b, xs[0])} = ${points[0][1]}. ${c.xv} = ${xs[1]} → ${subst(k, b, xs[1])} = ${points[1][1]}.${g.yStep > 1 ? ` The vertical axis counts by ${g.yStep}s.` : ''}`,
        `Plot ${points.map(pairText).join(', ')}.`,
      ],
      hintEs: `Sustituye cada valor de ${c.xv} en ${E}. Las entradas saltan números, así que calcula cada una; no te limites a sumar ${fmt(k)}.`,
      solution: `<p>${points.map((p) => `${c.xv} = ${p[0]} → ${c.yv} = ${p[1]}`).join('; ')}. The points ${points.map(pairText).join(', ')} lie on one straight line that rises ${fmt(k)} for each 1 across${b ? ` and meets the vertical axis at ${b} (the starting value)` : ' and passes through the origin'}.</p>${V.graph({ xLabel: c.xLabel, yLabel: c.yLabel, xMax: 8, yMax: g.yMax, yStep: g.yStep, size: 260, series: [{ points, line: true }] })}`,
      feedback: {
        correct: 'Correct. Spaced inputs still land on the same straight line.',
        wrong(ans, d) {
          if (d.extra && d.extra.length) {
            const p = d.extra[0];
            if (points.some((q) => q[0] === p[1] && q[1] === p[0])) return `(${p[0]}, ${p[1]}) has the coordinates reversed. ${c.xv} goes across; ${c.yv} goes up.`;
            if (b && near(p[1], k * p[0])) return `(${p[0]}, ${p[1]}) leaves out the + ${b}. Add the starting value after multiplying.`;
            if (!xs.includes(p[0])) return `The question uses only ${c.xv} = ${xs.join(', ')}. ${p[0]} is not one of them.`;
            return `(${p[0]}, ${p[1]}) is not on this rule. Substitute ${c.xv} = ${p[0]} into ${E} and recheck the height.`;
          }
          const m = d.missing[0];
          return `You still need the point for ${c.xv} = ${m[0]}. Substitute it into ${E} to find its height.`;
        },
      },
    };
  });

  // ---------- Select all ordered pairs that are solutions (ms; hard: bigger rule and an off-by-one pair) ----------
  G.define('vc_msSolutions', (r, o) => {
    const hard = !!o.hard;
    const k = hard ? r.int(6, 12) : r.int(2, 6),
      b = hard ? r.int(5, 20) : r.int(1, 8);
    const E = eq(k, b);
    const xs = r.pickN(hard ? [3, 4, 5, 6, 7, 8, 9] : [1, 2, 3, 4, 5, 6], 3);
    const goodXs = xs.slice(0, r.int(1, 3));
    const cands = [];
    goodXs.forEach((x) => cands.push({ p: [x, k * x + b], tag: 'ok' }));
    if (hard) cands.push({ p: [xs[2], k * xs[2] + b + 1], tag: 'off' });
    cands.push({ p: [k * xs[0] + b, xs[0]], tag: 'swap' });
    cands.push({ p: [xs[1], k * xs[1]], tag: 'noB' });
    cands.push({ p: [xs[2], xs[2] + k + b], tag: 'add' });
    cands.push({ p: [xs[1], b * xs[1] + k], tag: 'swapKB' });
    const seen = new Set();
    const uniqC = cands.filter((cd) => {
      const key = cd.p.join(',');
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
    const picked = uniqC.slice(0, 5);
    const all = picked.map((cd) => ({ html: `(${cd.p[0]}, ${cd.p[1]})`, ok: cd.p[1] === k * cd.p[0] + b, tag: cd.tag, p: cd.p }));
    const okIdx = all.map((op, i) => (op.ok ? i : -1)).filter((i) => i >= 0);
    const sh = shuffleOptions(r, all, okIdx);
    const okList = sh.answers.map((i) => sh.options[i].html);
    return {
      type: 'ms',
      skill: 'multi-rep',
      lesson: 'Challenge',
      title: 'Which pairs are solutions?',
      prompt: `<p>An ordered pair (x, y) is a <b>solution</b> of an equation if it makes the equation true.</p><p>Select <b>every</b> ordered pair that is a solution of ${hl(E)}.</p>`,
      options: sh.options,
      answers: sh.answers,
      hints: [
        'Substitute the first number for x and the second for y. The pair is a solution only if both sides come out equal.',
        `For (${all[0].p[0]}, ${all[0].p[1]}): is ${all[0].p[1]} = ${k} × ${all[0].p[0]} + ${b}? Check each pair the same way.`,
        `Watch for pairs with x and y reversed, pairs that forgot the + ${b}${hard ? ', and pairs that are off by just 1' : ''}.`,
      ],
      hintEs: 'Sustituye el primer número por x y el segundo por y. El par es una solución solo si los dos lados quedan iguales.',
      solution: `<p>Test each pair in ${E}. ${sh.options.map((op) => `(${op.p[0]}, ${op.p[1]}): ${k} × ${op.p[0]} + ${b} = ${k * op.p[0] + b}${op.ok ? ' ✓' : `, not ${op.p[1]}`}`).join('; ')}. Solutions: <b>${okList.join(', ')}</b>.</p>`,
      feedback: {
        correct: 'Correct. A solution of a two-variable equation is a pair that makes it true, and substituting is the test.',
        wrong(ans, d) {
          if (d.extra && d.extra.length) {
            const op = sh.options[d.extra[0]];
            const base = `(${op.p[0]}, ${op.p[1]}) is not a solution: ${k} × ${op.p[0]} + ${b} = ${k * op.p[0] + b}, not ${op.p[1]}.`;
            if (op.tag === 'swap') return base + ' The numbers are in reversed order; x comes first.';
            if (op.tag === 'noB') return base + ` This pair forgot the + ${b}.`;
            if (op.tag === 'add') return base + ` ${k}x means multiply, not add.`;
            if (op.tag === 'swapKB') return base + ` This pair swaps the roles of ${k} and ${b}.`;
            if (op.tag === 'off') return base + ' Close is not enough: a solution must make the equation exactly true.';
            return base;
          }
          if (d.missing && d.missing.length) {
            const op = sh.options[d.missing[0]];
            return `You missed a solution. Substitute (${op.p[0]}, ${op.p[1]}) into ${E} and check whether both sides match.`;
          }
          return `Substitute each pair into ${E}.`;
        },
      },
    };
  });

  /* Two-plan contexts for break-even and comparison problems. plan(label, k, b) describes one plan. */
  const PLANS = [
    {
      xw: 'number of stops',
      one: 'stop',
      many: 'stops',
      yw: 'cost',
      xwEs: 'el número de paradas',
      ywEs: 'el costo',
      oneEs: 'parada',
      manyEs: 'paradas',
      amt: (v) => '$' + fmt(v),
      plan: (L, k, b) => `<b>Plan ${L}:</b> ${b ? `${/^(8|11|18)$/.test(String(b)) ? 'an' : 'a'} $${b} boarding fee plus` : 'no boarding fee, just'} $${k} per stop.`,
      same: 'cost the same',
    },
    {
      xw: 'number of weeks',
      one: 'week',
      many: 'weeks',
      yw: 'savings',
      xwEs: 'el número de semanas',
      ywEs: 'el ahorro',
      oneEs: 'semana',
      manyEs: 'semanas',
      amt: (v) => '$' + fmt(v),
      plan: (L, k, b) => `<b>Saver ${L}:</b> ${b ? `starts with $${b} and` : 'starts with nothing and'} saves $${k} every week.`,
      same: 'have the same savings',
    },
    {
      xw: 'number of towers',
      one: 'tower',
      many: 'towers',
      yw: 'cable length',
      xwEs: 'el número de torres',
      ywEs: 'la longitud del cable',
      oneEs: 'torre',
      manyEs: 'torres',
      amt: (v) => fmt(v) + ' meters',
      plan: (L, k, b) => `<b>Line ${L}:</b> ${b ? `${b} meter${b === 1 ? '' : 's'} at the depot plus` : 'no cable at the depot, just'} ${k} meters per tower.`,
      same: 'use the same amount of cable',
    },
  ];

  // ---------- Break-even: where two rules give the same output (num; hard: bigger gap and rate difference) ----------
  G.define('vc_breakEven', (r, o) => {
    const hard = !!o.hard;
    const c = r.pick(PLANS);
    const n = hard ? r.int(6, 12) : r.int(3, 9);
    const dK = hard ? r.int(2, 4) : r.int(1, 2);
    const kA = hard ? r.int(3, 8) : r.int(2, 4),
      kB = kA + dK;
    const bB = hard ? r.int(2, 10) : r.int(0, 3),
      bA = bB + dK * n;
    const yAt = kA * n + bA;
    const gap = bA - bB;
    return {
      type: 'num',
      skill: 'compare-rates',
      lesson: 'Challenge',
      title: 'When are the two plans equal?',
      prompt: `<p>Two plans depend on the ${c.xw}.</p><p>${c.plan('A', kA, bA)}</p><p>${c.plan('B', kB, bB)}</p><p>For what ${c.xw} do the two plans ${c.same}?</p>`,
      unit: c.many,
      answer: n,
      hints: [
        `Write both rules with x for the ${c.xw} and y for the ${c.yw}: A is ${eq(kA, bA)}; B is ${eq(kB, bB)}. Try a few values of x in both, or think about how the gap between them changes.`,
        `At 0 ${c.many}, A is ${gap} ahead. Each ${c.one}, B gains ${kB} − ${kA} = ${dK} on A. How many ${c.many} until the gap closes?`,
        `${gap} ÷ ${dK} = ?  Check by substituting into both rules.`,
      ],
      hintEs: `Usa x para ${c.xwEs} e y para ${c.ywEs}: A es ${eq(kA, bA)}; B es ${eq(kB, bB)}. Prueba algunos valores de x en las dos reglas, o piensa en cómo cambia la diferencia entre ellas.`,
      solution: `<p>Let x be the ${c.xw} and y the ${c.yw}. A: ${eq(kA, bA)}. B: ${eq(kB, bB)}. A starts ${gap} ahead, and B closes the gap by ${dK} every ${c.one}, so they are equal after ${gap} ÷ ${dK} = <b>${n}</b> ${c.many}. Check: A gives ${kA} × ${n} + ${bA} = ${yAt}; B gives ${kB} × ${n}${bB ? ' + ' + bB : ''} = ${yAt}. ✓ Before ${n} ${c.many}, B is lower; after, A is lower.</p>`,
      feedback: {
        correct: 'Correct. The plan with the higher start is caught by the plan with the higher rate, and the gap divided by the rate difference tells when.',
        wrong(ans, d) {
          const v = d.value;
          if (v == null) return `Type a number of ${c.many}.`;
          if (v === gap) return `${gap} is the starting gap, not the answer. B gains ${dK} per ${c.one}, so divide the gap by ${dK}.`;
          if (v === yAt) return `${yAt} is the ${c.yw} when the plans are equal. The question asks for the ${c.xw} that makes them equal.`;
          if (near(v, gap / kB) || near(v, gap / kA)) return `You divided the gap by one plan's rate. The gap closes by the <b>difference</b> of the rates, ${kB} − ${kA} = ${dK}, each ${c.one}.`;
          const a = kA * v + bA,
            bval = kB * v + bB;
          return `At ${v} ${c.many}, A gives ${fmt(a)} and B gives ${fmt(bval)}. They are not equal. ${a > bval ? 'B is still catching up: try more.' : 'B has already passed A: try fewer.'}`;
        },
      },
    };
  });

  // ---------- Work backward with a decimal rate (num; hard: quarter rates) ----------
  G.define('vc_backDecimal', (r, o) => {
    const hard = !!o.hard;
    const c = r.pick(DCTX),
      n = r.pick(NAMES);
    const k = r.pick(hard ? [0.75, 1.25, 2.25, 3.75] : DEC_RATES);
    const b = hard ? r.int(5, 15) : r.int(1, 6);
    const x = hard ? 4 * r.int(2, 6) : r.int(4, 12);
    const y = round(k * x + b, 2);
    const E = `${c.yv} = ${fmt(k)}${c.xv} + ${b}`;
    const afterSub = round(y - b, 2);
    return {
      type: 'num',
      skill: 'backward',
      lesson: 'Challenge',
      title: 'Work backward through a decimal rate',
      prompt: `<p>${c.aff(n, k, b)} The equation is ${hl(E)}, where ${c.xv} is the ${c.xw} and ${c.yv} is the ${c.yw}.</p><p>${cap(n)}'s ${c.yw} came to ${hl(c.amt(y))}. What was the ${c.xw}?</p>`,
      unit: c.many,
      answer: x,
      hints: [
        `Undo the steps in reverse order: subtract the starting value first, then divide by the rate, even though the rate is a decimal.`,
        `${fmt(y)} − ${b} = ${fmt(afterSub)}. That is ${fmt(k)} times the ${c.xw}.`,
        `${fmt(afterSub)} ÷ ${fmt(k)} = ? ${k === 0.5 ? 'Dividing by 0.5 is the same as doubling.' : `Think: ${fmt(k)} × 2 = ${fmt(2 * k)}, ${fmt(k)} × 4 = ${fmt(4 * k)}, and so on.`}`,
      ],
      hintEs: 'Deshaz los pasos en orden inverso: primero resta el valor inicial y luego divide entre la tasa, aunque la tasa sea un decimal.',
      solution: `<p>${fmt(y)} = ${fmt(k)}${c.xv} + ${b}. Subtract ${b}: ${fmt(k)}${c.xv} = ${fmt(afterSub)}. Divide by ${fmt(k)}: ${c.xv} = ${fmt(afterSub)} ÷ ${fmt(k)} = <b>${x}</b>. Check: ${fmt(k)} × ${x} + ${b} = ${fmt(round(k * x, 2))} + ${b} = ${fmt(y)}. ✓ The ${c.xw} was ${x}.</p>`,
      feedback: {
        correct: 'Correct. A decimal rate does not change the plan: subtract the starting value, then divide by the rate.',
        wrong(ans, d) {
          const v = d.value;
          if (v == null) return `Type a number of ${c.many}.`;
          if (near(v, y / k - b)) return `You divided before subtracting. Undo the + ${b} first, then divide by ${fmt(k)}.`;
          if (near(v, afterSub)) return `${fmt(afterSub)} is ${fmt(k)} times the ${c.xw}. Divide by ${fmt(k)}.`;
          if (near(v, afterSub * k)) return `You multiplied by ${fmt(k)}. To undo multiplying, divide.`;
          if (near(v, y / k)) return `You divided without subtracting the starting value. Subtract ${b} first.`;
          return `Substitute your answer: ${fmt(k)} × ? + ${b} should equal ${fmt(y)}. Subtract first, then divide.`;
        },
      },
    };
  });

  // ---------- Order four plans by output at a given input (seq; hard: later input, wider table gap) ----------
  G.define('vc_seqMixed', (r, o) => {
    const hard = !!o.hard;
    const c = r.pick(PLANS);
    const n = hard ? r.int(9, 14) : r.int(5, 8);
    const ks = r.pickN([1, 2, 3, 4, 5], 4);
    const bs = [r.int(0, hard ? 20 : 9), r.int(0, hard ? 20 : 9), r.int(0, hard ? 20 : 9), 0];
    // nudge starting values until all four outputs at n are distinct
    const out = () => ks.map((k, i) => k * n + bs[i]);
    for (let guard = 0; guard < 30; guard++) {
      const tot = out();
      const dup = tot.findIndex((v, i) => tot.indexOf(v) !== i);
      if (dup < 0) break;
      // bump the earlier member of the tied pair (never the graph plan, which has no starting value)
      bs[tot.indexOf(tot[dup])] += 1;
    }
    const totals = out();
    const g = grid(ks[3] * 4);
    const tableXs = hard ? [3, 7] : [2, 4];
    const dx = tableXs[1] - tableXs[0];
    const items = [
      { html: `<b>Plan A (equation):</b> ${eq(ks[0], bs[0])}, where x is the ${c.xw}`, rate: totals[0] },
      {
        html: `<b>Plan B (table):</b>${V.table(
          [
            [cap(c.many), ...tableXs.map(String)],
            [cap(c.yw), ...tableXs.map((x) => String(ks[1] * x + bs[1]))],
          ],
          { header: false, rowHeader: true, cls: 'mini' },
        )}`,
        rate: totals[1],
      },
      { html: `<b>Plan C (words):</b> ${bs[2] ? `${c.amt(bs[2])} to start, then ` : ''}${c.amt(ks[2])} for every ${c.one}`, rate: totals[2] },
      {
        html: `<b>Plan D (graph):</b>${V.graph({ xLabel: cap(c.many), yLabel: cap(c.yw), xMax: 4, yMax: g.yMax, yStep: g.yStep, size: 150, series: [{ points: [1, 2, 3, 4].map((x) => [x, ks[3] * x]), line: true }] })}`,
        rate: totals[3],
      },
    ];
    const order = [0, 1, 2, 3].sort((a, z) => items[a].rate - items[z].rate);
    const letters = ['A', 'B', 'C', 'D'];
    const byRate = [0, 1, 2, 3].sort((a, z) => ks[a] - ks[z]);
    return {
      type: 'seq',
      skill: 'compare-rates',
      lesson: 'Challenge',
      title: `Compare the plans after ${n} ${c.many}`,
      prompt: `<p>Four plans depend on the ${c.xw}, each shown a different way.</p><p>Order the plans by their ${c.yw} after ${hl(count(c, n))}, from the <b>lowest</b> (top) to the <b>highest</b> (bottom).</p>`,
      items,
      order,
      hints: [
        `Find each plan's rule, then substitute ${n}. A rule with a bigger rate can still be lower if its starting value is small.`,
        `Plan B: the table rises ${ks[1] * dx} between ${tableXs[0]} and ${tableXs[1]} ${c.many}, so the rate is ${ks[1] * dx} ÷ ${dx} = ${ks[1]} and the start is ${bs[1]}. Plan D: the point above 1 is at ${ks[3]}, with no starting value.`,
        `Rules: A ${eq(ks[0], bs[0])}, B ${eq(ks[1], bs[1])}, C ${eq(ks[2], bs[2])}, D ${eq(ks[3], 0)}. Substitute x = ${n} into each, then order from lowest.`,
      ],
      hintEs: `Halla la regla de cada plan y luego sustituye ${n}. Una regla con una tasa mayor puede quedar más baja si su valor inicial es pequeño.`,
      solution: `<p>Rules: A is ${eq(ks[0], bs[0])}; B is ${eq(ks[1], bs[1])}; C is ${eq(ks[2], bs[2])}; D is ${eq(ks[3], 0)}. At ${n} ${c.many}: A = ${totals[0]}, B = ${totals[1]}, C = ${totals[2]}, D = ${totals[3]}. Lowest to highest: <b>${order.map((i) => letters[i]).join(', ')}</b>. The order at a different ${c.xw} could be different, because the plans have different rates.</p>`,
      feedback: {
        correct: 'Correct. To compare plans at one input, find every rule and substitute the same input into each.',
        wrong(ans) {
          const a = Array.isArray(ans) ? ans.join() : '';
          if (a === order.slice().reverse().join()) return 'Your order is reversed. Lowest goes at the top.';
          if (a === byRate.join() && a !== order.join()) return `You ordered the plans by rate alone. After ${n} ${c.many}, the starting values matter too: substitute ${n} into every rule.`;
          return `Substitute ${n} into every plan's rule. The plan with the biggest rate is not always the highest after ${n} ${c.many}; the starting values matter too.`;
        },
      },
    };
  });

  // ---------- Error: worked backward wrongly (error; hard adds "multiplied instead of dividing") ----------
  G.define('vc_errorTwoStep', (r, o) => {
    const hard = !!o.hard;
    const c = r.pick(CTX),
      n = r.pick(NAMES);
    const k = hard ? r.int(6, 12) : r.int(2, 6);
    const b = hard ? r.int(8, 20) : r.int(1, 8);
    const x = hard ? r.int(9, 20) : r.int(4, 12);
    const y = k * x + b;
    const E = eq(k, b, c.yv, c.xv);
    const variant = hard ? r.pick(['divFirst', 'mult']) : 'divFirst';
    const wrongDiv = round(y / k, 2);
    const wrongFinal = variant === 'divFirst' ? round(wrongDiv - b, 2) : (y - b) * k;
    const work =
      variant === 'divFirst'
        ? `<p>${n}'s work:</p><p>${y} ÷ ${k} = ${fmt(wrongDiv)}</p><p>${fmt(wrongDiv)} − ${b} = ${fmt(wrongFinal)}</p><p>${c.xv} = ${fmt(wrongFinal)}</p>`
        : `<p>${n}'s work:</p><p>${y} − ${b} = ${y - b}</p><p>${y - b} × ${k} = ${fmt(wrongFinal)}</p><p>${c.xv} = ${fmt(wrongFinal)}</p>`;
    const opts =
      variant === 'divFirst'
        ? [
            { html: `${n} divided before subtracting. The equation added ${b} last, so the first undo step is to subtract ${b}, then divide by ${k}.`, ok: true },
            {
              html: `${n} should have multiplied ${y} by ${k} instead of dividing.`,
              why: `The equation multiplies by ${k}, so undoing it means dividing. The division is fine; it happened at the wrong time.`,
            },
            { html: `${n} should have added ${b} instead of subtracting.`, why: `The equation adds ${b}, so undoing it means subtracting. Subtracting is right; the order is wrong.` },
            { html: `${n} forgot to subtract the starting value.`, why: `${n} did subtract ${b}, in the second line. The problem is doing it after the division instead of before.` },
          ]
        : [
            { html: `${n} multiplied by ${k} in the second step. To undo multiplying by ${k}, divide: ${y - b} ÷ ${k}.`, ok: true },
            { html: `${n} should have divided first, then subtracted.`, why: `${n}'s order was right: subtract ${b} first, because it was added last. The second step used the wrong operation.` },
            { html: `${n} should have added ${b} instead of subtracting.`, why: `The equation adds ${b}, so undoing it means subtracting. The first line is correct.` },
            { html: `${n} forgot to subtract the starting value.`, why: `${n} did subtract ${b} in the first line. Look at the second line instead.` },
          ];
    const sh = shuffleOptions(r, opts, 0);
    return {
      type: 'error',
      skill: 'backward',
      lesson: 'Challenge',
      title: 'Find the mistake in the backward work',
      prompt: `<p>The equation ${hl(E)} gives the ${c.yw} (${c.yv}) for the ${c.xw} (${c.xv}). ${n} tried to find the ${c.xw} when the ${c.yw} was ${yWord(c, y)}.</p><p>Which statement describes the mistake? Then give the correct ${c.xw}.</p>`,
      work,
      options: sh.options,
      answer: sh.answer,
      fix: { label: `Correct ${c.xw}: `, answer: x },
      hints: [
        `Check ${n}'s answer by substituting it: does ${k} × ${fmt(wrongFinal)} + ${b} equal ${y}? If not, look at each undo step.`,
        `The equation does × ${k} first and + ${b} second. To undo, reverse the order and reverse each operation.`,
        `${y} − ${b} = ${y - b}. Then ${y - b} ÷ ${k}.`,
      ],
      hintEs: `Comprueba la respuesta de ${n} sustituyéndola: ¿${k} × ${fmt(wrongFinal)} + ${b} es igual a ${y}? Si no, revisa cada paso para deshacer.`,
      solution: `<p>${variant === 'divFirst' ? `${n} undid the steps in the wrong order.` : `${n} subtracted correctly but then multiplied instead of dividing.`} The equation multiplies by ${k} and then adds ${b}, so undoing starts with the addition: ${y} − ${b} = ${y - b}, then ${y - b} ÷ ${k} = <b>${x}</b>. Check: ${subst(k, b, x)} = ${y}. ✓ ${n}'s answer fails the check: ${k} × ${fmt(wrongFinal)} + ${b} = ${fmt(round(k * wrongFinal + b, 2))}, not ${y}.</p>`,
      feedback: {
        correct: 'Correct. Reverse the order and reverse each operation when you undo, and always substitute back to check.',
        wrong(ans, d) {
          if (!d.mistakeOk) return (sh.options[ans.mistake] && sh.options[ans.mistake].why) || `Substitute ${n}'s answer back into ${E}. It does not give ${y}, so look at each step.`;
          const v = parseNum(ans.fix);
          if (v === y - b) return `Mistake found. ${y - b} is ${k} times the ${c.xw}; divide by ${k} to finish.`;
          if (near(v, wrongFinal)) return `Mistake found, but your fix repeats ${n}'s answer. Redo it: subtract ${b}, then divide by ${k}.`;
          return `Mistake found. For the fix: subtract ${b} from ${y}, then divide by ${k}.`;
        },
      },
    };
  });
})(typeof window !== 'undefined' ? window : globalThis);
