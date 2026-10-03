/* js/units/u9/gen-variables.js */
/* Zone 1 — Signal Depot. Lesson 9-1 Explore Relationships Between Two Variables (Independent and Dependent Variables · Tables of Values). */
(function (root) {
  'use strict';
  const RX = root.RX;
  const { G, V, shuffleOptions, NAMES, parseNum } = RX;
  const { CTX, eq, yWord, rows, ruleWords } = RX.U9;
  const hl = V.hl;
  const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
  const story = (c, n, k, b) => (b ? c.aff(n, k, b) : c.prop(n, k));

  // ---------- Identify independent and dependent (cloze) ----------
  G.define('v1_identifyCloze', (r) => {
    const c = r.pick(CTX),
      n = r.pick(NAMES),
      k = r.int(2, 6),
      b = r.chance(0.5) ? r.int(1, 5) : 0;
    const choices = r.shuffle([c.xw, c.yw]);
    const choices2 = r.shuffle([c.xw, c.yw]);
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
        'The independent variable is the quantity you choose or control. The dependent variable responds to that choice.',
        `Ask: does the ${c.yw} depend on the ${c.xw}, or does the ${c.xw} depend on the ${c.yw}?`,
        `${cap(n)} decides the ${c.xw}. The ${c.yw} changes because of it, so the ${c.yw} depends on the ${c.xw}.`,
      ],
      solution: `<p>The <b>${c.xw}</b> is independent: it is the input you pick. The <b>${c.yw}</b> is dependent: it is the output that responds. Change the ${c.xw} and the ${c.yw} changes.</p>`,
      feedback: {
        correct: 'Correct. Independent = the quantity you choose. Dependent = the quantity that responds.',
        wrong(ans, d) {
          if (d.wrong.length === 2) return `You swapped them. The ${c.yw} depends on the ${c.xw}, so the ${c.xw} is independent.`;
          return d.wrong[0] === 0
            ? `Look at the first blank. Which quantity does ${n} choose? That one is independent.`
            : `Look at the second blank. Which quantity changes as a result? That one is dependent.`;
        },
      },
    };
  });

  // ---------- Sort quantities into independent / dependent (sort) ----------
  G.define('v1_sortVars', (r) => {
    const cs = r.pickN(CTX, 3);
    const items = [];
    cs.forEach((c) => {
      items.push({ html: cap(c.xw), bin: 0 });
      items.push({ html: cap(c.yw), bin: 1 });
    });
    const shuffled = r.shuffle(items);
    const pairs = cs.map((c) => `the ${c.yw} and the ${c.xw}`).join('; ');
    return {
      type: 'sort',
      skill: 'ind-dep',
      lesson: '9-1',
      title: 'Sort the variables',
      prompt: `<p>Three sky-tram routes each connect two quantities: ${pairs}.</p><p>Sort each quantity. Is it the <b>independent</b> variable (the one you choose) or the <b>dependent</b> variable (the one that responds)?</p>`,
      bins: ['Independent variable', 'Dependent variable'],
      items: shuffled,
      hints: [
        'For each pair, ask which quantity you would decide first. That one is independent.',
        `For example, the ${cs[0].yw} depends on the ${cs[0].xw}. You choose the ${cs[0].xw}; the ${cs[0].yw} follows.`,
        `Counts of ${cs.map((c) => c.many).join(', ')} are chosen. The amounts that result from them are dependent.`,
      ],
      solution: `<p>Independent: ${cs.map((c) => c.xw).join(', ')}. Dependent: ${cs.map((c) => c.yw).join(', ')}. In each pair, the second quantity is calculated from the first, so it depends on it.</p>`,
      feedback: {
        correct: 'Correct. The quantity you choose is independent; the quantity that is calculated from it is dependent.',
        wrong(ans, d) {
          const it = shuffled[d.wrong[0]];
          return it.bin === 0 ? `"${RX.esc(it.html)}" is something you choose, so it is independent.` : `"${RX.esc(it.html)}" is calculated from another quantity, so it depends on it.`;
        },
      },
    };
  });

  // ---------- Who is correct about the dependent variable (who) ----------
  G.define('v1_whoDepends', (r) => {
    const c = r.pick(CTX),
      [n0, n1, n2] = r.pickN(NAMES, 3),
      k = r.int(2, 5),
      b = r.chance(0.5) ? r.int(1, 4) : 0;
    const sh = shuffleOptions(
      r,
      [
        { title: n1, html: `The ${c.yw} is the dependent variable, because it changes when the ${c.xw} changes.`, ok: true },
        {
          title: n2,
          html: `The ${c.xw} is the dependent variable, because it is listed first in the table.`,
          why: `Being listed first does not make a variable dependent. The ${c.xw} is listed first because it is the input you choose, which makes it independent.`,
        },
      ],
      0,
    );
    return {
      type: 'who',
      skill: 'ind-dep',
      lesson: '9-1',
      title: 'Who is correct?',
      prompt: `<p>${story(c, n0, k, b)}</p>${V.table(rows(c, k, b, [1, 2, 3]), { header: false, rowHeader: true, cls: 'compact' })}<p>${n1} and ${n2} disagree about which variable is dependent. Who is correct?</p>`,
      options: sh.options,
      answer: sh.answer,
      hints: [
        'A dependent variable responds to another variable. It is the result.',
        `Which quantity is calculated from the other: the ${c.yw} or the ${c.xw}?`,
        `The ${c.yw} is found by using the ${c.xw}, so it depends on the ${c.xw}.`,
      ],
      solution: `<p><b>${n1}</b> is correct. The ${c.yw} depends on the ${c.xw}. The order in a table shows the input first, not the dependent variable first.</p>`,
      feedback: { correct: 'Correct. Dependent means "responds to," not "comes first."' },
    };
  });

  // ---------- True/false about the dependent variable with a reason (tf) ----------
  G.define('v1_tfDependent', (r) => {
    const c = r.pick(CTX),
      n = r.pick(NAMES),
      k = r.int(2, 5),
      b = r.chance(0.5) ? r.int(1, 4) : 0;
    const claimDep = r.chance(0.5);
    const claimed = claimDep ? c.yw : c.xw;
    const reasons = r.shuffle([
      { html: `True. The ${c.yw} is calculated from the ${c.xw}, so it depends on it.`, correct: claimDep },
      { html: `False. The ${c.xw} is the quantity ${n} chooses, so it is independent, not dependent.`, correct: !claimDep },
      { html: 'True. It has the bigger numbers in the table.', correct: false },
      { html: 'False. Both quantities change, so both are independent.', correct: false },
    ]);
    return {
      type: 'tf',
      skill: 'ind-dep',
      lesson: '9-1',
      title: 'Dependent or not?',
      prompt: `<p>${story(c, n, k, b)}</p><p>True or false: <b>The ${claimed} is the dependent variable.</b></p>`,
      statement: `The ${claimed} is the dependent variable.`,
      answer: claimDep,
      reasons,
      hints: [
        'The dependent variable is the output: the quantity that responds to the other one.',
        `Which quantity does ${n} control: the ${c.xw} or the ${c.yw}?`,
        `${cap(c.xw)} is chosen (independent). ${cap(c.yw)} is the result (dependent). Now check the statement.`,
      ],
      solution: claimDep
        ? `<p><b>True.</b> The ${c.yw} depends on the ${c.xw}. Big numbers have nothing to do with it; what matters is which quantity responds.</p>`
        : `<p><b>False.</b> The ${c.xw} is independent because ${n} chooses it. The dependent variable is the ${c.yw}, which responds to that choice.</p>`,
      feedback: {
        correct: 'Correct, with the right reason. Dependent is about responding, not about the size of the numbers.',
        wrong(ans, d) {
          if (!d.valueOk) return `Think about which quantity responds. The ${c.yw} is found from the ${c.xw}, not the other way around.`;
          return 'Your true/false choice is right, but pick the reason that talks about which quantity responds to the other.';
        },
      },
    };
  });

  // ---------- Complete a table from a rule (table) ----------
  G.define('v1_tableRule', (r, o) => {
    const k = r.int(2, 5);
    const kind = r.pick(['mult', 'add', 'both']);
    const b = kind === 'mult' ? 0 : r.int(1, 6);
    const kk = kind === 'add' ? 1 : k;
    const xs = o.hard ? r.pickN([2, 5, 7, 9, 10, 12], 4).sort((a, z) => a - z) : [1, 2, 3, 4];
    const rowsT = [
      ['x', ...xs.map(String)],
      ['y', ...xs.map((x, i) => (i === 0 ? String(kk * x + b) : `__IN:y${x}__`))],
    ];
    return {
      type: 'table',
      skill: 'table-values',
      lesson: '9-1',
      title: 'Complete the table of values',
      prompt: `<p>A route rule says: <b>${eq(kk, b)}</b>. In words: ${ruleWords(kk, b)}.</p><p>Complete the table of values.</p>`,
      rows: rowsT,
      inputs: xs.slice(1).map((x) => ({ id: 'y' + x, answer: kk * x + b })),
      rowHeader: true,
      hints: [
        `Substitute each x-value into the rule ${eq(kk, b)} to find its y-value.`,
        `The first column shows x = ${xs[0]}: ${kk === 1 ? '' : kk + ' × ' + xs[0] + (b ? ' + ' + b : '')}${kk === 1 ? xs[0] + ' + ' + b : ''} = ${kk * xs[0] + b}. Do the same for x = ${xs[1]}.`,
        `x = ${xs[1]}: ${kk === 1 ? xs[1] + ' + ' + b : kk + ' × ' + xs[1] + (b ? ' + ' + b : '')} = ${kk * xs[1] + b}. Repeat for ${xs[2]} and ${xs[3]}.`,
      ],
      solution: `<p>Substitute each x into ${eq(kk, b)}: ${xs.map((x) => `x = ${x} → y = <b>${kk * x + b}</b>`).join('; ')}. Every y-value comes from the same rule.</p>`,
      feedback: {
        correct: `Correct. Every column follows the rule ${eq(kk, b)}.`,
        wrong(ans, d) {
          const id = d.wrong[0],
            x = Number(id.slice(1)),
            v = parseNum(ans[id]);
          if (b && v === kk * x) return `For x = ${x}, you multiplied but forgot to add ${b}. The rule has two steps.`;
          if (kk > 1 && v === x + kk + b) return `For x = ${x}, you added ${kk} instead of multiplying by ${kk}. "${kk}x" means ${kk} times x.`;
          return `For x = ${x}: ${kk === 1 ? x + ' + ' + b : kk + ' × ' + x + (b ? ' + ' + b : '')}.`;
        },
      },
    };
  });

  // ---------- Complete a table from a story (table) ----------
  G.define('v1_tableStory', (r, o) => {
    const c = r.pick(CTX),
      n = r.pick(NAMES),
      k = r.int(2, 5),
      b = r.chance(0.6) ? r.int(1, 5) : 0;
    const xs = o.hard ? r.pickN([2, 4, 6, 8, 10, 12], 4).sort((a, z) => a - z) : [1, 2, 3, 4];
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
        b ? `Each ${c.one} adds ${k}, and the ${b} is added once no matter how many ${c.many}.` : `Each ${c.one} adds ${k}. Multiply the number of ${c.many} by ${k}.`,
        `Check the first column: ${xs[0]} ${xs[0] === 1 ? c.one : c.many} → ${k} × ${xs[0]}${b ? ' + ' + b : ''} = ${k * xs[0] + b}.`,
        `For ${xs[1]} ${c.many}: ${k} × ${xs[1]}${b ? ' + ' + b : ''} = ${k * xs[1] + b}. Use the same steps for ${xs[2]} and ${xs[3]}.`,
      ],
      solution: `<p>The rule is ${eq(k, b, c.yv, c.xv)}: ${xs.map((x) => `${x} ${x === 1 ? c.one : c.many} → ${k} × ${x}${b ? ' + ' + b : ''} = <b>${k * x + b}</b>`).join('; ')}.</p>`,
      feedback: {
        correct: `Correct. The ${c.yw} is ${k} times the ${c.xw}${b ? `, plus ${b}` : ''}.`,
        wrong(ans, d) {
          const id = d.wrong[0],
            x = Number(id.slice(1)),
            v = parseNum(ans[id]);
          if (b && v === k * x) return `For ${x} ${c.many} you forgot the ${yWord(c, b)} that is added once. Multiply, then add ${b}.`;
          if (b && v === k * x + b * x) return `You added ${b} for every ${c.one}. The ${yWord(c, b)} is added only once.`;
          return `For ${x} ${c.many}: ${k} × ${x}${b ? ' + ' + b : ''} = ${k * x + b}.`;
        },
      },
    };
  });

  // ---------- Find the mistake in a table (error) ----------
  G.define('v1_tableError', (r, o) => {
    const n = r.pick(NAMES),
      k = r.int(2, 5);
    const variant = r.pick(['forgotB', 'addedK']);
    const b = variant === 'forgotB' ? r.int(1, 5) : 0;
    const xs = o.hard ? [2, 4, 6] : [1, 2, 3];
    const bad = xs.map((x) => (variant === 'forgotB' ? k * x : x + k));
    const fixX = o.hard ? 10 : 5;
    const opts =
      variant === 'forgotB'
        ? [
            { html: `${n} multiplied by ${k} but forgot to add ${b}. Every y-value is ${b} too small.`, ok: true },
            { html: `${n} should have added ${k} instead of multiplying.`, why: `The rule says ${k}x, which means multiply by ${k}. Multiplying was right; the missing step is adding ${b}.` },
            { html: `${n} swapped the x-values and y-values.`, why: 'The x row is correct. Check the y-values against the rule instead.' },
            { html: `${n} multiplied by ${b} instead of ${k}.`, why: `${bad[0]} = ${k} × ${xs[0]}, so ${n} did multiply by ${k}. The problem is what comes after.` },
          ]
        : [
            { html: `${n} added ${k} instead of multiplying by ${k}. "${k}x" means ${k} times x.`, ok: true },
            { html: `${n} multiplied by ${k} but forgot a starting value.`, why: `The rule y = ${k}x has no starting value. Look at how each y compares to its x: it is ${k} more, not ${k} times.` },
            { html: `${n} swapped the x-values and y-values.`, why: 'The x row is fine. Compare each y to the rule.' },
            { html: `${n} multiplied by ${k + 1} instead of ${k}.`, why: `${bad[0]} is not ${k + 1} × ${xs[0]}. It is ${xs[0]} + ${k}.` },
          ];
    const sh = shuffleOptions(r, opts, 0);
    return {
      type: 'error',
      skill: 'table-values',
      lesson: '9-1',
      title: 'Find the mistake in the table',
      prompt: `<p>${n} was asked to make a table of values for the rule <b>${eq(k, b)}</b>.</p><p>Which statement describes the mistake? Then give the correct y-value for x = ${fixX}.</p>`,
      work: V.table(
        [
          ['x', ...xs.map(String)],
          ['y', ...bad.map(String)],
        ],
        { header: false, rowHeader: true, cls: 'compact' },
      ),
      options: sh.options,
      answer: sh.answer,
      fix: { label: `Correct y when x = ${fixX}: `, answer: k * fixX + b },
      hints: [
        `Test the first column. Substitute x = ${xs[0]} into ${eq(k, b)}. Do you get ${bad[0]}?`,
        `${eq(k, b)} with x = ${xs[0]} gives ${k * xs[0] + b}. The table shows ${bad[0]}. What step is wrong?`,
        `For the fix: ${k} × ${fixX}${b ? ' + ' + b : ''}.`,
      ],
      solution:
        variant === 'forgotB'
          ? `<p>${n} multiplied each x by ${k} but never added ${b}. For x = ${xs[0]}, ${k} × ${xs[0]} + ${b} = ${k * xs[0] + b}, not ${bad[0]}. The correct value for x = ${fixX} is ${k} × ${fixX} + ${b} = <b>${k * fixX + b}</b>.</p>`
          : `<p>${n} added ${k} to each x instead of multiplying. For x = ${xs[0]}, ${k} × ${xs[0]} = ${k * xs[0]}, not ${bad[0]}. The correct value for x = ${fixX} is ${k} × ${fixX} = <b>${k * fixX}</b>.</p>`,
      feedback: {
        correct: 'Correct. Testing one column against the rule is the fastest way to catch a table mistake.',
        wrong(ans, d) {
          if (!d.mistakeOk) return (sh.options[ans.mistake] && sh.options[ans.mistake].why) || `Substitute x = ${xs[0]} into the rule and compare with the table.`;
          return `Mistake found. For the fix, substitute x = ${fixX}: ${k} × ${fixX}${b ? ' + ' + b : ''}.`;
        },
      },
    };
  });

  // ---------- Extend the table to a new input (num) ----------
  G.define('v1_nextValue', (r, o) => {
    const c = r.pick(CTX),
      n = r.pick(NAMES),
      k = r.int(2, 6),
      b = r.chance(0.6) ? r.int(1, 5) : 0;
    const ask = o.hard ? r.int(12, 20) : r.int(6, 9);
    return {
      type: 'num',
      skill: 'table-values',
      lesson: '9-1',
      title: 'Extend the table',
      prompt: `<p>${story(c, n, k, b)}</p>${V.table(rows(c, k, b, [1, 2, 3]), { header: false, rowHeader: true, cls: 'compact' })}<p>What is the ${c.yw} for ${hl(ask + ' ' + c.many)}?</p>`,
      unit: c.money ? '' : c.yu,
      answer: k * ask + b,
      hints: [
        `Look at how the ${c.yw} changes from one column to the next. It goes up by the same amount each time.`,
        `Each ${c.one} adds ${k}${b ? `, and ${b} is added once` : ''}. The rule is ${eq(k, b, c.yv, c.xv)}.`,
        `Substitute ${ask}: ${k} × ${ask}${b ? ' + ' + b : ''}.`,
      ],
      solution: `<p>The ${c.yw} rises by ${k} for each ${c.one}, so the rule is ${eq(k, b, c.yv, c.xv)}. For ${ask} ${c.many}: ${k} × ${ask}${b ? ' + ' + b : ''} = <b>${k * ask + b}</b>.</p>`,
      feedback: {
        correct: `Correct. The rule ${eq(k, b, c.yv, c.xv)} works for any number of ${c.many}, not just the ones in the table.`,
        wrong(ans, d) {
          if (b && d.value === k * ask) return `You multiplied correctly but left out the ${yWord(c, b)} that is added once.`;
          if (d.value === k * 4 + b) return `${k * 4 + b} is the value for 4 ${c.many}, the next column. The question asks about ${ask} ${c.many}.`;
          if (d.value === k + ask + b) return `Do not add ${k} and ${ask}. Each ${c.one} adds ${k}, so multiply ${k} by ${ask}.`;
          return `Find the rule first: each ${c.one} adds ${k}${b ? `, plus ${b} once` : ''}. Then use ${ask} ${c.many}.`;
        },
      },
    };
  });

  // ---------- Match rules in words to tables (match) ----------
  G.define('v1_matchRules', (r) => {
    const k = r.int(2, 4);
    let b = r.int(2, 5);
    if (b === k) b = k + 1;
    const cands = [
      [k, 0],
      [1, b],
      [k, b],
      [b, k],
    ];
    const picked = r.shuffle(cands).slice(0, 3);
    const left = picked.map(([kk, bb]) => cap(ruleWords(kk, bb)));
    const right = picked.map(([kk, bb]) =>
      V.table(
        [
          ['x', '1', '2', '3'],
          ['y', String(kk + bb), String(2 * kk + bb), String(3 * kk + bb)],
        ],
        { header: false, rowHeader: true, cls: 'mini' },
      ),
    );
    const order = r.shuffle([0, 1, 2]);
    const rightShuffled = order.map((i) => right[i]);
    const pairs = picked.map((_, i) => [i, order.indexOf(i)]);
    return {
      type: 'match',
      skill: 'rule-words',
      lesson: '9-1',
      title: 'Match each rule to its table',
      prompt: '<p>Each rule in words makes a different table of values. Match each rule to the table it produces.</p>',
      left,
      right: rightShuffled,
      pairs,
      hints: [
        'Test the first column of each table: substitute x = 1 into each rule.',
        `For x = 1, the rules give: ${picked.map(([kk, bb]) => `${cap(ruleWords(kk, bb))} → ${kk + bb}`).join('; ')}.`,
        'If two tables start the same, test x = 2 to tell them apart.',
      ],
      solution: `<p>Substitute x = 1, 2, 3 into each rule: ${picked.map(([kk, bb]) => `<b>${cap(ruleWords(kk, bb))}</b> → ${kk + bb}, ${2 * kk + bb}, ${3 * kk + bb}`).join('; ')}.</p>`,
      feedback: {
        correct: 'Correct. Substituting one or two x-values is enough to identify a rule.',
        wrong(ans, d) {
          const i = d.wrong[0];
          const [kk, bb] = picked[i];
          return `Check "${left[i]}". When x = 1 it gives ${kk + bb}; when x = 2 it gives ${2 * kk + bb}. Find that table.`;
        },
      },
    };
  });

  // ---------- Use the rule for two inputs (blanks with template) ----------
  G.define('v1_blanksRule', (r) => {
    const c = r.pick(CTX),
      n = r.pick(NAMES),
      k = r.int(2, 6),
      b = r.chance(0.6) ? r.int(1, 5) : 0;
    const [x1, x2] = r.pickN([4, 5, 6, 7, 8, 9], 2).sort((a, z) => a - z);
    return {
      type: 'blanks',
      skill: 'rule-words',
      lesson: '9-1',
      title: 'Use the rule',
      prompt: `<p>${story(c, n, k, b)}</p><p>Rule in words: <b>${cap(ruleWords(k, b).replace(/x/g, c.xw))}</b>.</p><p>Fill in the ${c.yw} for each number of ${c.many}.</p>`,
      template: `For ${x1} ${c.many}, the ${c.yw} is {0}. For ${x2} ${c.many}, the ${c.yw} is {1}.`,
      fields: [
        { label: `${x1} ${c.many}`, answer: k * x1 + b },
        { label: `${x2} ${c.many}`, answer: k * x2 + b },
      ],
      hints: [`Follow the rule in order: multiply first${b ? ', then add' : ''}.`, `${x1} ${c.many}: ${k} × ${x1}${b ? ' + ' + b : ''}.`, `${x2} ${c.many}: ${k} × ${x2}${b ? ' + ' + b : ''}.`],
      solution: `<p>${x1} ${c.many}: ${k} × ${x1}${b ? ' + ' + b : ''} = <b>${k * x1 + b}</b>. ${x2} ${c.many}: ${k} × ${x2}${b ? ' + ' + b : ''} = <b>${k * x2 + b}</b>.</p>`,
      feedback: {
        correct: 'Correct. A rule in words tells you the operations and their order.',
        wrong(ans, d) {
          const i = d.wrong[0],
            x = i === 0 ? x1 : x2,
            v = parseNum(ans[i]);
          if (b && v === k * x) return `For ${x} ${c.many}, add the ${b} after multiplying.`;
          if (v === x + k + b) return `Multiply ${k} by ${x}; do not add them.`;
          return `For ${x} ${c.many}: ${k} × ${x}${b ? ' + ' + b : ''}.`;
        },
      },
    };
  });

  // ---------- How much does y change each time? (mc) ----------
  G.define('v1_changeMc', (r) => {
    const c = r.pick(CTX),
      n = r.pick(NAMES),
      k = r.int(2, 5);
    let b = r.int(2, 6);
    if (b === k) b = k + 1;
    const sh = shuffleOptions(
      r,
      [
        { html: `It goes up by ${k} each time.`, ok: true },
        { html: `It goes up by ${b} each time.`, why: `${b} is the starting value, the part that is added once. Subtract one ${c.yw} from the next to see the change.` },
        { html: `It goes up by ${k + b} each time.`, why: `${k + b} is the value for 1 ${c.one}, not the change. Compare two columns: ${2 * k + b} − ${k + b} = ${k}.` },
        { html: 'It goes up by 1 each time.', why: `The ${c.xw} goes up by 1. The question asks how the ${c.yw} changes.` },
      ],
      0,
    );
    return {
      type: 'mc',
      skill: 'rule-words',
      lesson: '9-1',
      title: 'Describe the change',
      prompt: `<p>${c.aff(n, k, b)}</p>${V.table(rows(c, k, b, [1, 2, 3, 4]), { header: false, rowHeader: true, cls: 'compact' })}<p>Each time the ${c.xw} goes up by 1, how does the ${c.yw} change?</p>`,
      options: sh.options,
      answer: sh.answer,
      hints: [
        'Compare two columns that are next to each other. Subtract the smaller y from the larger.',
        `${2 * k + b} − ${k + b} = ? And ${3 * k + b} − ${2 * k + b} = ?`,
        `Both differences are the same number. That is how much the ${c.yw} changes per ${c.one}.`,
      ],
      solution: `<p>From one column to the next, the ${c.yw} goes from ${k + b} to ${2 * k + b} to ${3 * k + b}. Each step is <b>${k}</b>. That is the rate of change: ${k} per ${c.one}. The ${b} is the starting value, added only once.</p>`,
      feedback: { correct: `Correct. The ${c.yw} changes by ${k} for every 1 ${c.one}: that is the rate of change.` },
    };
  });

  // ---------- Explain which variable is independent (cr) ----------
  G.define('v1_crIndependent', (r) => {
    const c = r.pick(CTX),
      n = r.pick(NAMES),
      k = r.int(2, 5),
      b = r.chance(0.5) ? r.int(1, 4) : 0;
    const sh = shuffleOptions(
      r,
      [
        { html: `The ${c.xw} is independent because ${n} chooses it, and the ${c.yw} is calculated from it.`, ok: true },
        {
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
      prompt: `<p>${story(c, n, k, b)}</p><p>Explain how you can tell which variable is the independent variable. Then choose the explanation that is correct.</p>`,
      starters: ['The independent variable is the one that …', `${n} chooses the …, so …`, 'The dependent variable responds to …'],
      minWords: 10,
      check: { prompt: 'Which explanation is correct?', options: sh.options, answer: sh.answer },
      hints: [
        'Independent means it does not depend on the other quantity. Someone chooses it.',
        `Who decides the ${c.xw}? Who decides the ${c.yw}? One of them is decided by the other.`,
        `${n} picks the ${c.xw}; the ${c.yw} is the result.`,
      ],
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
  const { CTX, eq, yWord, grid, rows } = RX.U9;
  const hl = V.hl;
  const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
  const story = (c, n, k, b) => (b ? c.aff(n, k, b) : c.prop(n, k));
  const pts = (k, b, xs) => xs.map((x) => [x, k * x + b]);
  const pairText = (p) => `(${p[0]}, ${p[1]})`;
  /** Graph for a rule over x = xs, sized to fit yMax ≤ 24. */
  const graphFor = (c, series, xMax, yTop, size, extra) => {
    const g = grid(yTop);
    return V.graph(Object.assign({ xLabel: c.xLabel, yLabel: c.yLabel, xMax, yMax: g.yMax, yStep: g.yStep, size: size || 280, series }, extra || {}));
  };

  // ---------- Ordered pairs from a table (blanks, template) ----------
  G.define('v2_orderedPairs', (r) => {
    const c = r.pick(CTX),
      n = r.pick(NAMES),
      k = r.int(2, 5),
      b = r.chance(0.5) ? r.int(1, 4) : 0;
    const xs = r.pick([
      [1, 2, 3],
      [2, 3, 4],
      [1, 3, 5],
      [0, 2, 4],
    ]);
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
      prompt: `<p>${story(c, n, k, b)}</p>${V.table(rows(c, k, b, xs), { header: false, rowHeader: true, cls: 'compact' })}<p>Write each column of the table as an ordered pair (${c.xw}, ${c.yw}).</p>`,
      template: 'Column 1: ({0}, {1})   Column 2: ({2}, {3})   Column 3: ({4}, {5})',
      fields,
      hints: [
        'An ordered pair is (independent, dependent). The independent variable goes first.',
        `The ${c.xw} is independent, so it is the first number. Column 1 starts with ${xs[0]}.`,
        `Column 1 is (${xs[0]}, ${k * xs[0] + b}). Use the same order for the other columns.`,
      ],
      solution: `<p>The ordered pairs are ${pts(k, b, xs).map(pairText).join(', ')}. The first number is always the ${c.xw} (x), and the second is the ${c.yw} (y).</p>`,
      feedback: {
        correct: 'Correct. Independent first, dependent second: (x, y).',
        wrong(ans, d) {
          const i = d.wrong[0],
            col = Math.floor(i / 2),
            x = xs[col],
            y = k * x + b;
          const vx = parseNum(ans[col * 2]),
            vy = parseNum(ans[col * 2 + 1]);
          if (vx === y && vy === x) return `Column ${col + 1} is reversed. The ${c.xw} (${x}) goes first, then the ${c.yw} (${y}).`;
          return `Check column ${col + 1}: the ${c.xw} is ${x} and the ${c.yw} is ${y}, so the pair is (${x}, ${y}).`;
        },
      },
    };
  });

  // ---------- Plot the points from a table (plot) ----------
  G.define('v2_plotTable', (r, o) => {
    const c = r.pick(CTX),
      n = r.pick(NAMES);
    const b = o.hard || r.chance(0.4) ? r.int(1, 4) : 0;
    const k = b ? r.int(1, 4) : r.int(2, 4);
    const xs = o.hard ? [0, 1, 2, 3, 4] : [1, 2, 3, 4];
    const points = pts(k, b, xs);
    const g = grid(k * 4 + b);
    return {
      type: 'plot',
      skill: 'graph-plot',
      lesson: '9-2',
      title: 'Plot the points',
      prompt: `<p>${story(c, n, k, b)}</p>${V.table(rows(c, k, b, xs), { header: false, rowHeader: true, cls: 'compact' })}<p>Plot every column of the table as a point on the grid.</p><p class="muted">Click a grid point to place or remove a point.</p>`,
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
      solution: `<p>The points are ${points.map(pairText).join(', ')}. They form a straight line because the ${c.yw} rises by the same amount (${k}) for each ${c.one}.</p>${graphFor(c, [{ points, line: true }], 5, k * 4 + b, 260)}`,
      feedback: {
        correct: 'Correct. Across first (independent), then up (dependent). A steady rate always makes a straight line.',
        wrong(ans, d) {
          if (d.extra.length) {
            const p = d.extra[0];
            if (points.some((q) => q[0] === p[1] && q[1] === p[0])) return `(${p[0]}, ${p[1]}) has the coordinates reversed. Go across for the ${c.xw}, then up for the ${c.yw}.`;
            return `(${p[0]}, ${p[1]}) is not in the table. For ${p[0]} ${c.many} the ${c.yw} is ${k * p[0] + b}.`;
          }
          const m = d.missing[0];
          return `You still need the point for ${m[0]} ${m[0] === 1 ? c.one : c.many}: (${m[0]}, ${m[1]}).${g.yStep > 1 ? ` Remember the vertical axis counts by ${g.yStep}s.` : ''}`;
        },
      },
    };
  });

  // ---------- Match the table to its graph (rep) ----------
  G.define('v2_tableToGraph', (r) => {
    const c = r.pick(CTX);
    const b = r.chance(0.5) ? r.int(1, 4) : 0;
    let k = b ? r.int(1, 4) : r.int(2, 4);
    if (b && k === b) k = b === 4 ? 3 : b + 1;
    const xs = [1, 2, 3, 4];
    const good = pts(k, b, xs);
    const yTop = Math.max(k * 4 + b, b ? b * 4 + k : 4 + k, b ? 0 : (k + 1) * 4);
    const mk = (series) => graphFor(c, [{ points: series }], 5, yTop, 200);
    const wrongs = b
      ? [
          { html: mk(pts(k, 0, xs)), why: `This graph starts too low: it shows ${k} per ${c.one} with no starting value of ${b}. Check (1, ${k + b}).` },
          { html: mk(pts(b, k, xs)), why: `This graph swaps the rate and the starting value. It rises by ${b} each step; the table rises by ${k}.` },
        ]
      : [
          { html: mk(pts(1, k, xs)), why: `These points go up by only 1 each step. The table goes up by ${k} each step, because y is ${k} <b>times</b> x, not ${k} more than x.` },
          { html: mk(pts(k + 1, 0, xs)), why: `This graph rises too fast: (1, ${k + 1}) instead of (1, ${k}).` },
        ];
    const sh = shuffleOptions(r, [{ html: mk(good), ok: true }, ...wrongs], 0);
    return {
      type: 'rep',
      skill: 'graph-plot',
      lesson: '9-2',
      title: 'Match the table to its graph',
      prompt: `<p>Which graph shows the data in the table?</p>${V.table(rows(c, k, b, xs), { header: false, rowHeader: true, cls: 'compact' })}`,
      options: sh.options,
      answer: sh.answer,
      layout: 'cards',
      hints: [
        'Each column is a point: across for the first row, up for the second row.',
        `The first point should be (1, ${k + b}). Find 1 on the horizontal axis and check how high the point is in each graph.`,
        `Then check (2, ${2 * k + b}). Only one graph has both points.`,
      ],
      solution: `<p>The table gives ${good.map(pairText).join(', ')}. The correct graph has those points${b ? `, starting at (1, ${k + b}) and rising ${k} each step` : `, rising ${k} each step from (1, ${k})`}.</p>`,
      feedback: { correct: 'Correct. Check one or two points carefully instead of judging by the general shape.' },
    };
  });

  // ---------- Error: dependent written first (error) ----------
  G.define('v2_errorPair', (r) => {
    const c = r.pick(CTX),
      n = r.pick(NAMES),
      k = r.int(2, 5),
      b = r.chance(0.5) ? r.int(1, 4) : 0;
    const xs = [1, 2, 3];
    const good = pts(k, b, xs);
    const written = good.map((p) => `(${p[1]}, ${p[0]})`).join(', ');
    const fixX = 4;
    const sh = shuffleOptions(
      r,
      [
        { html: `${n} wrote the dependent variable first. An ordered pair is (independent, dependent), so each pair should be (${c.xw}, ${c.yw}).`, ok: true },
        {
          html: `${n} used the wrong rate. The ${c.yw} should rise by ${k + 1} each ${c.one}.`,
          why: `The values themselves are correct: ${good.map((p) => p[1]).join(', ')} match the table. Only the order inside each pair is wrong.`,
        },
        { html: `${n} should have written only the ${c.yw}, not both numbers.`, why: 'An ordered pair always has two numbers, one for each variable. The problem is the order, not the count.' },
        { html: `${n} forgot the starting value.`, why: `Look at the numbers: they match the table. ${n} did not drop anything; the two numbers in each pair are just in the wrong order.` },
      ],
      0,
    );
    return {
      type: 'error',
      skill: 'ordered-pairs',
      lesson: '9-2',
      title: 'Find the mistake in the ordered pairs',
      prompt: `<p>${story(c, n, k, b)} ${n} made a table and then wrote the ordered pairs (${c.xw}, ${c.yw}).</p><p>Which statement describes the mistake? Then give the correct second number for the pair with ${fixX} ${c.many}.</p>`,
      work: `${V.table(rows(c, k, b, xs), { header: false, rowHeader: true, cls: 'compact' })}<p>Ordered pairs: ${written}</p>`,
      options: sh.options,
      answer: sh.answer,
      fix: { label: `Correct pair for ${fixX} ${c.many}: (${fixX}, `, answer: k * fixX + b },
      hints: [
        `Read the first pair ${n} wrote. Does its first number match the ${c.xw} column of the table?`,
        `The first column of the table is ${xs[0]} ${c.one} → ${k + b}. The pair should start with ${xs[0]}.`,
        `For the fix: ${fixX} ${c.many} → ${k} × ${fixX}${b ? ' + ' + b : ''}.`,
      ],
      solution: `<p>${n} reversed every pair. Ordered pairs are (independent, dependent): ${good.map(pairText).join(', ')}. For ${fixX} ${c.many}: ${k} × ${fixX}${b ? ' + ' + b : ''} = <b>${k * fixX + b}</b>, so the pair is (${fixX}, ${k * fixX + b}).</p>`,
      feedback: {
        correct: 'Correct. (6, 3) and (3, 6) are different points. The independent variable always comes first.',
        wrong(ans, d) {
          if (!d.mistakeOk) return (sh.options[ans.mistake] && sh.options[ans.mistake].why) || `Compare the first number in each pair with the ${c.xw} row of the table.`;
          return `Mistake found. For the fix, find the ${c.yw} for ${fixX} ${c.many}: ${k} × ${fixX}${b ? ' + ' + b : ''}.`;
        },
      },
    };
  });

  // ---------- What does the point mean? (mc) ----------
  G.define('v2_pointMeaning', (r) => {
    const c = r.pick(CTX),
      n = r.pick(NAMES),
      k = r.int(2, 5),
      b = r.chance(0.5) ? r.int(1, 4) : 0;
    const x = r.int(2, 4),
      y = k * x + b;
    const all = pts(k, b, [1, 2, 3, 4]);
    const sh = shuffleOptions(
      r,
      [
        { html: `${x} ${c.many} go with ${yWord(c, y)}.`, ok: true },
        { html: `${y} ${c.many} go with ${yWord(c, x)}.`, why: `You reversed the coordinates. The horizontal axis is ${c.xLabel}, so the first number, ${x}, is the ${c.xw}.` },
        { html: `Each ${c.one} goes with ${yWord(c, y)}.`, why: `${y} is the total for ${x} ${c.many}, not the amount for one ${c.one}. The amount per ${c.one} is ${k}.` },
        { html: `${x} ${c.many} go with ${yWord(c, k * x + b + k)}.`, why: `${k * x + b + k} is the value for ${x + 1} ${c.many}. Read the height of the point above ${x}, not the next point.` },
      ],
      0,
    );
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
        `So the point says: ${x} ${c.many} → ${yWord(c, y)}.`,
      ],
      solution: `<p>(${x}, ${y}) means <b>${x} ${c.many} go with ${yWord(c, y)}</b>. Read the horizontal axis for the ${c.xw} and the vertical axis for the ${c.yw}.</p>`,
      feedback: { correct: 'Correct. An ordered pair reads (horizontal value, vertical value), and the axis labels tell you what each one means.' },
    };
  });

  // ---------- Read a value from the graph (num) ----------
  G.define('v2_readGraph', (r, o) => {
    const c = r.pick(CTX),
      n = r.pick(NAMES),
      b = r.chance(0.5) ? r.int(1, 4) : 0;
    const k = b ? r.int(1, 4) : r.int(2, 4);
    const shown = pts(k, b, [0, 1, 2, 3, 4]);
    const ask = o.hard ? r.int(6, 8) : r.int(2, 4);
    return {
      type: 'num',
      skill: 'graph-read',
      lesson: '9-2',
      title: 'Read the graph',
      prompt: `<p>${story(c, n, k, b)} The graph shows the ${c.yw} for 0 to 4 ${c.many}.</p>${graphFor(c, [{ points: shown, line: true }], 5, k * 4 + b, 280)}<p>What is the ${c.yw} for ${hl(ask + ' ' + c.many)}?</p>`,
      unit: c.money ? '' : c.yu,
      answer: k * ask + b,
      hints: [
        ask <= 4
          ? `Find ${ask} on the horizontal axis. Go straight up to the point, then read across to the vertical axis.`
          : `${ask} is past the edge of the graph. Find the pattern first: how much does y go up for each 1 across?`,
        `From one point to the next, the ${c.yw} goes up by ${k}.${b ? ` At 0 ${c.many} it is ${b}.` : ''}`,
        ask <= 4
          ? `The point above ${ask} is at height ${k * ask + b}.${grid(k * 4 + b).yStep > 1 ? ' Count the grid lines carefully; the axis counts by ' + grid(k * 4 + b).yStep + 's.' : ''}`
          : `Rule: ${eq(k, b, c.yv, c.xv)}. Substitute ${ask}: ${k} × ${ask}${b ? ' + ' + b : ''}.`,
      ],
      solution: `<p>${ask <= 4 ? `The point above ${ask} on the horizontal axis is at height ${k * ask + b}.` : `The graph rises ${k} for each ${c.one}${b ? ` and starts at ${b}` : ''}, so the rule is ${eq(k, b, c.yv, c.xv)}. For ${ask} ${c.many}: ${k} × ${ask}${b ? ' + ' + b : ''} = ${k * ask + b}.`} The ${c.yw} is <b>${yWord(c, k * ask + b)}</b>.</p>`,
      feedback: {
        correct: 'Correct. Across to the input, up to the point, then across to read the output.',
        wrong(ans, d) {
          if (d.value === ask) return `${ask} is the ${c.xw}, the input. Read the height of the point above ${ask} for the ${c.yw}.`;
          if (b && d.value === k * ask) return `You left out the starting value. The graph does not start at 0; at 0 ${c.many} it is already ${b}.`;
          if (d.value === k * (ask - 1) + b || d.value === k * (ask + 1) + b) return `That is the height of a neighboring point. Make sure you are directly above ${ask}.`;
          return `Go up from ${ask} on the horizontal axis and read the height. The graph rises ${k} for each ${c.one}.`;
        },
      },
    };
  });

  // ---------- Trend statement true/false (tf) ----------
  G.define('v2_trendTf', (r) => {
    const c = r.pick(CTX),
      n = r.pick(NAMES),
      k = r.int(2, 4);
    let b = r.int(1, 4);
    if (b === k) b = k + 1;
    const truthy = r.chance(0.5);
    const claimed = truthy ? k : r.pick([b, k + b]);
    const shown = pts(k, b, [0, 1, 2, 3, 4]);
    const reasons = r.shuffle([
      { html: `True. From each point to the next, the ${c.yw} rises by ${k}.`, correct: truthy },
      { html: `False. From each point to the next, the ${c.yw} rises by ${k}, not ${claimed}.`, correct: !truthy },
      { html: 'True. The line goes up, so any increase is correct.', correct: false },
      { html: `False. The graph starts at ${b}, so it cannot rise by a steady amount.`, correct: false },
    ]);
    return {
      type: 'tf',
      skill: 'graph-read',
      lesson: '9-2',
      title: 'Describe the trend',
      prompt: `<p>${c.aff(n, k, b)} The graph shows the relationship.</p>${graphFor(c, [{ points: shown, line: true }], 5, k * 4 + b, 270)}<p>True or false: <b>As the ${c.xw} increases by 1, the ${c.yw} increases by ${claimed} each time.</b></p>`,
      statement: `As the ${c.xw} increases by 1, the ${c.yw} increases by ${claimed} each time.`,
      answer: truthy,
      reasons,
      hints: [
        'Pick two points that are next to each other. How much higher is the second one?',
        `Above 1 the point is at ${k + b}. Above 2 it is at ${2 * k + b}. Subtract.`,
        `${2 * k + b} − ${k + b} = ${k}. Compare that with the statement.`,
      ],
      solution: truthy
        ? `<p><b>True.</b> The heights are ${shown.map((p) => p[1]).join(', ')}. Each step up is ${k}, so the ${c.yw} rises ${k} for every 1 ${c.one}.</p>`
        : `<p><b>False.</b> The heights are ${shown.map((p) => p[1]).join(', ')}. Each step is ${k}, not ${claimed}. ${claimed === b ? `${b} is the starting value, where the line meets the vertical axis.` : `${k + b} is the value for 1 ${c.one}, not the change between points.`}</p>`,
      feedback: {
        correct: 'Correct, with the right reason. The trend is the steady step from one point to the next.',
        wrong(ans, d) {
          if (!d.valueOk) return `Subtract the heights of two neighboring points: ${2 * k + b} − ${k + b}. That is the real step.`;
          return 'Your true/false choice is right, but the reason should talk about the step from one point to the next.';
        },
      },
    };
  });

  // ---------- Graph to table (table) ----------
  G.define('v2_graphToTable', (r) => {
    const c = r.pick(CTX),
      n = r.pick(NAMES),
      b = r.chance(0.5) ? r.int(1, 4) : 0;
    const k = b ? r.int(1, 4) : r.int(2, 4);
    const shown = pts(k, b, [0, 1, 2, 3, 4]);
    const xs = [1, 2, 3, 4, 6];
    return {
      type: 'table',
      skill: 'graph-read',
      lesson: '9-2',
      title: 'Build the table from the graph',
      prompt: `<p>${story(c, n, k, b)} Use the graph to complete the table. The last column is beyond the graph; use the pattern.</p>${graphFor(c, [{ points: shown, line: true }], 5, k * 4 + b, 270)}`,
      rows: [
        [c.xLabel, ...xs.map(String)],
        [c.yLabel, ...xs.map((x) => `__IN:y${x}__`)],
      ],
      rowHeader: true,
      inputs: xs.map((x) => ({ id: 'y' + x, answer: k * x + b })),
      hints: [
        'For each number across, find the point above it and read its height on the vertical axis.',
        `Above 1 the point is at ${k + b}. Above 2 it is at ${2 * k + b}. The step is ${k}.`,
        `6 is off the graph. Keep adding ${k} for each extra ${c.one}: after 4 (${4 * k + b}) comes 5 (${5 * k + b}), then 6.`,
      ],
      solution: `<p>Reading the points: 1 → ${k + b}, 2 → ${2 * k + b}, 3 → ${3 * k + b}, 4 → ${4 * k + b}. The step is ${k} per ${c.one}${b ? ` with a starting value of ${b}` : ''}, so 6 → ${k} × 6${b ? ' + ' + b : ''} = <b>${6 * k + b}</b>.</p>`,
      feedback: {
        correct: `Correct. The graph and the table show the same rule: ${eq(k, b, c.yv, c.xv)}.`,
        wrong(ans, d) {
          const x = Number(d.wrong[0].slice(1)),
            v = parseNum(ans[d.wrong[0]]);
          if (x === 6) {
            if (b && v === 6 * k) return `For 6 ${c.many} you forgot the starting value ${b}.`;
            return `6 is beyond the graph. The step is ${k} per ${c.one}, so continue the pattern from ${4 * k + b}.`;
          }
          return `Look directly above ${x} on the horizontal axis and read the height of that point.`;
        },
      },
    };
  });

  // ---------- Compare two lines: which rises faster? (mc) ----------
  G.define('v2_compareLines', (r, o) => {
    const c = r.pick(CTX);
    const [kSlow, kFast] = r.pickN(o.hard ? [1, 2, 3, 4] : [1, 2, 3, 4], 2).sort((a, z) => a - z);
    const bSlow = r.int(3, 5),
      bFast = o.hard ? r.int(0, 1) : 0;
    const fastIsA = r.chance(0.5);
    const A = fastIsA ? { k: kFast, b: bFast } : { k: kSlow, b: bSlow };
    const B = fastIsA ? { k: kSlow, b: bSlow } : { k: kFast, b: bFast };
    const fast = fastIsA ? 'A' : 'B',
      slow = fastIsA ? 'B' : 'A';
    const yTop = Math.max(A.k * 4 + A.b, B.k * 4 + B.b);
    const sh = shuffleOptions(
      r,
      [
        { html: `Route ${fast}. Its line is steeper: the ${c.yw} rises ${kFast} for each ${c.one}, compared with ${kSlow}.`, ok: true },
        {
          html: `Route ${slow}. Its line starts higher on the vertical axis.`,
          why: `Starting higher means a bigger starting value (${bSlow}), not a faster rate. Rate is how much the line rises for each step across.`,
        },
        {
          html: `Route ${slow}. Its point above 1 ${c.one} is higher.`,
          why: `The height of one point mixes the starting value with the rate. Compare the <b>change</b> from one point to the next instead: Route ${slow} rises ${kSlow} each step; Route ${fast} rises ${kFast}.`,
        },
        {
          html: 'Both routes rise at the same rate, because both graphs are straight lines.',
          why: 'Straight lines mean each route has a steady rate, but the rates can be different. The steeper line rises faster.',
        },
      ],
      0,
    );
    return {
      type: 'mc',
      skill: 'compare-rates',
      lesson: '9-2',
      title: 'Which rises faster?',
      prompt: `<p>Two sky-tram routes are graphed on the same grid. For each route, the vertical axis shows the ${c.yw}.</p>${graphFor(
        c,
        [
          { points: pts(A.k, A.b, [0, 1, 2, 3, 4]), line: true, label: 'Route A', color: '#1FA6A2' },
          { points: pts(B.k, B.b, [0, 1, 2, 3, 4]), line: true, label: 'Route B', color: '#C8553D', dashed: true },
        ],
        5,
        yTop,
        300,
      )}<p>On which route does the ${c.yw} increase faster per ${c.one}?</p>`,
      options: sh.options,
      answer: sh.answer,
      hints: [
        '"Faster per ' + c.one + '" means a bigger rate of change: the bigger step up for each 1 across. Do not look at where the lines start.',
        `Route A rises from ${A.b} to ${A.k + A.b} between 0 and 1: a step of ${A.k}. Route B rises from ${B.b} to ${B.k + B.b}: a step of ${B.k}.`,
        `${kFast} is more than ${kSlow}, so Route ${fast} is steeper. The steeper line rises faster.`,
      ],
      solution: `<p>Route A rises ${A.k} per ${c.one}; Route B rises ${B.k} per ${c.one}. <b>Route ${fast}</b> increases faster. Route ${slow} starts higher (${bSlow}) but climbs more slowly: on a graph, rate is steepness, not starting height.</p>`,
      feedback: { correct: 'Correct. Rate of change is steepness. Where a line starts is its starting value, which is a different thing.' },
    };
  });

  // ---------- Choose the graph that matches a story (rep) ----------
  G.define('v2_storyToGraph', (r) => {
    const c = r.pick(CTX),
      n = r.pick(NAMES),
      k = r.int(1, 3);
    let b = r.int(2, 4);
    if (b === k) b = k + 1;
    const xs = [0, 1, 2, 3, 4];
    const yTop = Math.max(k * 4 + b, b * 4 + k, k * 4 + k);
    const mk = (kk, bb) => graphFor(c, [{ points: pts(kk, bb, xs), line: true }], 5, yTop, 200);
    const sh = shuffleOptions(
      r,
      [
        { html: mk(k, b), ok: true },
        { html: mk(k, 0), why: `This graph starts at 0, but the story starts at ${b} before any ${c.many}. The point for 0 ${c.many} should be (0, ${b}).` },
        { html: mk(b, k), why: `This graph has the numbers swapped: it starts at ${k} and rises ${b} each ${c.one}. The story starts at ${b} and rises ${k} each ${c.one}.` },
      ],
      0,
    );
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
        `At 0 ${c.many} the ${c.yw} is ${b}, so the graph should begin at (0, ${b}) on the vertical axis.`,
        `Then each ${c.one} adds ${k}: the next point is (1, ${k + b}). Only one graph has both.`,
      ],
      solution: `<p>The story gives ${eq(k, b, c.yv, c.xv)}: a starting value of ${b} and a rate of ${k} per ${c.one}. The correct graph starts at (0, ${b}) and rises ${k} each step: ${pts(k, b, xs).map(pairText).join(', ')}.</p>`,
      feedback: { correct: 'Correct. The starting value is where the line meets the vertical axis; the rate is how much it rises each step.' },
    };
  });

  // ---------- Order relationships by rate (seq) ----------
  G.define('v2_seqSteep', (r) => {
    const c = r.pick(CTX),
      [n1, n2, n3] = r.pickN(NAMES, 3);
    const rates = r.pickN([2, 3, 4, 5, 6], 3);
    const g = grid(rates[1] * 4);
    const items = [
      { html: `<b>${n1}'s route:</b> ${rates[0]} ${c.yu} for every ${c.one}`, rate: rates[0] },
      {
        html: `<b>${n2}'s route:</b>${V.graph({ xLabel: c.xLabel, yLabel: c.yLabel, xMax: 4, yMax: g.yMax, yStep: g.yStep, size: 150, series: [{ points: pts(rates[1], 0, [1, 2, 3, 4]), line: true }] })}`,
        rate: rates[1],
      },
      {
        html: `<b>${n3}'s route:</b>${V.table(
          [
            [c.xLabel, '2', '5'],
            [c.yLabel, String(rates[2] * 2), String(rates[2] * 5)],
          ],
          { header: false, rowHeader: true, cls: 'mini' },
        )}`,
        rate: rates[2],
      },
    ];
    const order = [0, 1, 2].sort((a, z) => items[a].rate - items[z].rate);
    return {
      type: 'seq',
      skill: 'compare-rates',
      lesson: '9-2',
      title: 'Order the routes by rate',
      prompt: `<p>Three operators describe their routes in different ways. Order the routes from the <b>slowest</b> rate (top) to the <b>fastest</b> rate (bottom): ${c.yu} per ${c.one}.</p>`,
      items,
      order,
      hints: [
        `Find the rate for each route: how many ${c.yu} for 1 ${c.one}.`,
        `${n2}: read the point above 1 on the graph. ${n3}: divide ${rates[2] * 2} by 2.`,
        `Rates: ${n1} ${rates[0]}, ${n2} ${rates[1]}, ${n3} ${rates[2]}. Put the smallest first.`,
      ],
      solution: `<p>${n1}: ${rates[0]} per ${c.one}. ${n2}: the point (1, ${rates[1]}) gives ${rates[1]} per ${c.one}. ${n3}: ${rates[2] * 2} ÷ 2 = ${rates[2]} per ${c.one}. Slowest to fastest: <b>${order.map((i) => [n1, n2, n3][i]).join(', ')}</b>.</p>`,
      feedback: {
        correct: 'Correct. Words, a graph, and a table can all show a rate. Finding the value for 1 makes them comparable.',
        wrong() {
          return `Find each rate for 1 ${c.one}, then order from smallest to largest. Check the direction: slowest first.`;
        },
      },
    };
  });

  // ---------- Whose graph matches the table? (who) ----------
  G.define('v2_whoGraph', (r) => {
    const c = r.pick(CTX),
      [n0, n1, n2] = r.pickN(NAMES, 3),
      k = r.int(1, 3);
    let b = r.int(2, 4);
    if (b === k) b = k + 1;
    const xs = [0, 1, 2, 3, 4];
    const yTop = k * 4 + b;
    const mk = (kk, bb) => graphFor(c, [{ points: pts(kk, bb, xs), line: true }], 5, yTop, 210);
    const sh = shuffleOptions(
      r,
      [
        { title: n1, html: mk(k, b), ok: true },
        { title: n2, html: mk(k, 0), why: `${n2} started the line at (0, 0), but the table shows ${b} at 0 ${c.many}. Every point is ${b} too low.` },
      ],
      0,
    );
    return {
      type: 'who',
      skill: 'graph-plot',
      lesson: '9-2',
      title: 'Whose graph is correct?',
      prompt: `<p>${c.aff(n0, k, b)} Two students graphed the table.</p>${V.table(rows(c, k, b, xs), { header: false, rowHeader: true, cls: 'compact' })}<p>Whose graph matches the table?</p>`,
      options: sh.options,
      answer: sh.answer,
      layout: 'cards',
      hints: [
        `Check the first column: 0 ${c.many} → ${b}. Where should the first point be?`,
        `The first point is (0, ${b}): on the vertical axis at height ${b}, not at the origin.`,
        'Only one graph starts at the right height.',
      ],
      solution: `<p><b>${n1}</b> is correct. The table starts at (0, ${b}) and rises ${k} each ${c.one}. ${n2} drew a line through (0, 0), which ignores the starting value of ${b}.</p>`,
      feedback: { correct: 'Correct. Not every relationship starts at (0, 0). Always check the first column of the table.' },
    };
  });
})(typeof window !== 'undefined' ? window : globalThis);

/* js/units/u9/gen-equations.js */
/* Zone 3 — The Rule Works. Lesson 9-3 Write Equations to Represent Relationships Between Two Variables (Equations from Tables · Equations from Situations). */
(function (root) {
  'use strict';
  const RX = root.RX;
  const { G, V, shuffleOptions, NAMES, parseNum } = RX;
  const { CTX, eq, yWord, grid, rows } = RX.U9;
  const hl = V.hl;
  const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
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

  // ---------- Equation from a table: cloze (y = 4x vs y = x + 4) ----------
  G.define('v3_clozeRule', (r) => {
    const kind = r.pick(['mult', 'add', 'both']);
    const k = r.int(2, 6);
    const b = otherB(r, k, 2, 6);
    const kk = kind === 'add' ? 1 : k;
    const bb = kind === 'mult' ? 0 : b;
    const xs = r.pick([
      [1, 2, 3, 4],
      [0, 1, 2, 3],
      [2, 3, 4, 5],
    ]);
    const eqs = kind === 'mult' ? [eq(k, 0), eq(1, k), eq(k, k)] : kind === 'add' ? [eq(1, b), eq(b, 0), eq(b, b)] : [eq(k, b), eq(b, k), eq(k, 0)];
    const rates = kind === 'mult' ? [k, 1, k + 1] : kind === 'add' ? [1, b, b + 1] : [k, b, k + b];
    const c0 = r.shuffle(eqs),
      c1 = r.shuffle(rates.map(String));
    const y0 = kk * xs[0] + bb,
      y1 = kk * xs[1] + bb;
    return {
      type: 'cloze',
      skill: 'eq-table',
      lesson: '9-3',
      title: 'Write the rule for the table',
      prompt: `<p>This table of values follows one rule.</p>${xyTable(kk, bb, xs)}<p>Complete the sentences about the rule.</p>`,
      template: 'The equation is {0}. Each time x goes up by 1, y goes up by {1}.',
      choices: [c0, c1],
      answers: [c0.indexOf(eqs[0]), c1.indexOf(String(rates[0]))],
      hints: [
        'Compare each y with its x. Is y a certain number <b>times</b> x, or a certain number <b>more than</b> x?',
        `When x = ${xs[0]}, y = ${y0}. When x = ${xs[1]}, y = ${y1}. Try each equation with x = ${xs[1]}: which one gives ${y1}?`,
        kind === 'mult'
          ? `${y1} = ${k} × ${xs[1]}, and every other column works the same way. From one column to the next, y goes up by ${k}.`
          : kind === 'add'
            ? `${y1} = ${xs[1]} + ${b}, and every other column works the same way. From one column to the next, y goes up by only 1.`
            : `${y1} = ${k} × ${xs[1]} + ${b}. The y-values go up by ${k} each step, and ${b} is the extra that is added once.`,
      ],
      solution: `<p>Test the rule on two columns: x = ${xs[0]} → ${subst(kk, bb, xs[0])} = ${y0}; x = ${xs[1]} → ${subst(kk, bb, xs[1])} = ${y1}. Both work, so the equation is <b>${eqs[0]}</b>. ${
        kind === 'add' ? 'Adding the same number means y goes up by <b>1</b> each time x goes up by 1.' : `Multiplying by ${k} means y goes up by <b>${k}</b> each time x goes up by 1.`
      }</p>`,
      feedback: {
        correct: 'Correct. "Times" and "more than" make very different rules, and testing two columns tells them apart.',
        wrong(ans, d) {
          if (d.wrong.includes(0)) return `Test your equation with x = ${xs[1]}. The table says y = ${y1}. Does your equation give ${y1}?`;
          return `Subtract neighboring y-values: ${y1} − ${y0}. That difference is how much y goes up each time.`;
        },
      },
    };
  });

  // ---------- Equation from a table (mc, honors hard) ----------
  G.define('v3_mcEquation', (r, o) => {
    const k = o.hard ? r.int(3, 7) : r.int(2, 5);
    const b = o.hard ? otherB(r, k, 2, 9) : r.chance(0.6) ? otherB(r, k, 1, 5) : 0;
    const xs = o.hard
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
        `Try x = ${xs[1]}. The table says y = ${k * xs[1] + b}. ${dx > 1 ? `Remember that x goes up by ${dx} between columns, so the jump in y is not the rate per 1.` : ''}`,
        `Then check a second column, x = ${xs[2]}: y should be ${k * xs[2] + b}. Only one equation passes both tests.`,
      ],
      solution: `<p>Test two columns. x = ${xs[1]}: ${subst(k, b, xs[1])} = ${k * xs[1] + b}. x = ${xs[2]}: ${subst(k, b, xs[2])} = ${k * xs[2] + b}. Both match, so the equation is <b>${eq(k, b)}</b>. ${
        b ? `The rate of change is ${k} and the starting value is ${b}.` : `y is always ${k} times x, so the rate is ${k} and there is no starting value.`
      }</p>`,
      feedback: { correct: 'Correct. An equation has to work for every column, so testing two columns is a strong check.' },
    };
  });

  // ---------- Select all tables that fit the rule (ms) ----------
  G.define('v3_msTables', (r) => {
    const isMult = r.chance(0.6);
    const k = r.int(2, 5);
    const b = otherB(r, k, 2, 6);
    const rule = isMult ? eq(k, 0) : eq(1, b);
    const kk = isMult ? k : 1,
      bb = isMult ? 0 : b;
    const fitPool = [
      [1, 2, 3],
      [2, 4, 5],
      [0, 3, 6],
      [1, 3, 5],
    ].map((xs) => ({ k: kk, b: bb, xs }));
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
    const nons = r.pickN(nonPool, 5 - nFit);
    const mk = (t) => {
      const xr = t.xs.map(String),
        yr = t.xs.map((x) => String(t.k * x + t.b));
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
      solution: `<p>${rule} means ${ruleWords}. Table${nFit > 1 ? 's' : ''} <b>${sh.answers.map((i) => i + 1).join(', ')}</b> ${nFit > 1 ? 'fit' : 'fits'}: every y equals ${isMult ? k + ' times' : b + ' more than'} its x. The other tables each break the rule in at least one column: ${sh.options
        .filter((op) => !op.ok)
        .map((op, i) => `one ${op.meta.why}`)
        .join('; ')}.</p>`,
      feedback: {
        correct: 'Correct. A table fits an equation only if every single column makes the equation true.',
        wrong(ans, d) {
          if (d.extra && d.extra.length) {
            const op = sh.options[d.extra[0]];
            const t = op.meta;
            const x0 = t.swap ? t.k * t.xs[0] + t.b : t.xs[0];
            const y0 = t.swap ? t.xs[0] : t.k * t.xs[0] + t.b;
            return `Table ${d.extra[0] + 1} does not fit. Its first column has x = ${x0} and y = ${y0}, but ${rule} would give y = ${kk * x0 + bb}. That table ${t.why}.`;
          }
          if (d.missing && d.missing.length) {
            const op = sh.options[d.missing[0]];
            return `You missed a table that fits. In Table ${d.missing[0] + 1}, every y is ${isMult ? k + ' times' : b + ' more than'} its x. Check each column.`;
          }
          return `Test every column against ${rule}.`;
        },
      },
    };
  });

  // ---------- Explain how to find the rate from a table (cr) ----------
  G.define('v3_crRate', (r) => {
    const c = r.pick(CTX),
      n = r.pick(NAMES),
      k = r.int(2, 5),
      b = otherB(r, k, 1, 6);
    const xs = [1, 2, 3, 4];
    const sh = shuffleOptions(
      r,
      [
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
      ],
      0,
    );
    return {
      type: 'cr',
      skill: 'eq-table',
      lesson: '9-3',
      title: 'Explain how to find the rate',
      prompt: `<p>${c.aff(n, k, b)}</p>${V.table(rows(c, k, b, xs), { header: false, rowHeader: true, cls: 'compact' })}<p>Explain how to find the rate of change from the table. Then choose the explanation that is correct.</p>`,
      starters: ['To find the rate of change, I compare …', 'From one column to the next, the … goes up by …', 'I cannot just divide, because …'],
      minWords: 10,
      check: { prompt: 'Which explanation is correct?', options: sh.options, answer: sh.answer },
      hints: [
        'The rate of change is how much the dependent variable changes each time the independent variable goes up by 1.',
        `Look at two columns side by side. The ${c.yw} goes from ${k + b} to ${2 * k + b}. What is the difference?`,
        `${2 * k + b} − ${k + b} = ${k}, and ${3 * k + b} − ${2 * k + b} = ${k} too. A steady difference is the rate.`,
      ],
      solution: `<p>Model explanation: "I subtract neighboring values of the ${c.yw}: ${2 * k + b} − ${k + b} = ${k}, ${3 * k + b} − ${2 * k + b} = ${k}. The ${c.yw} goes up by <b>${k}</b> every ${c.one}, so the rate of change is ${k}. I cannot divide ${k + b} by 1, because the ${k + b} includes the starting value of ${b}."</p>`,
      feedback: {
        correct: 'Correct. Subtracting neighboring outputs finds the rate even when there is a starting value.',
        wrong(ans, d) {
          if (!d.wroteEnough) return 'Write a full explanation of at least ten words. A sentence starter can help.';
          return (sh.options[ans.check] && sh.options[ans.check].why) || `Subtract neighboring values of the ${c.yw} to find the steady change.`;
        },
      },
    };
  });

  // ---------- Equation from a situation (mc, honors hard) ----------
  G.define('v3_situationEq', (r, o) => {
    const c = r.pick(CTX),
      n = r.pick(NAMES);
    const k = o.hard ? r.int(4, 9) : r.int(2, 6);
    const useB = o.hard || r.chance(0.6);
    const b = useB ? otherB(r, k, o.hard ? 5 : 1, o.hard ? 12 : 6) : 0;
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
      solution: `<p>Each ${c.one} adds ${k}, so the rate of change is ${k} and the equation has ${k}${c.xv}. ${
        b ? `The ${yWord(c, b)} is paid once, so it is the starting value and gets added.` : 'Nothing is added just once, so there is no starting value.'
      } The equation is <b>${E(k, b)}</b>. Check: 2 ${c.many} → ${subst(k, b, 2)} = ${2 * k + b}.</p>`,
      feedback: { correct: `Correct. "For every ${c.one}" means multiply; "once" means add.` },
    };
  });

  // ---------- Rate, starting value, equation from a situation (cloze) ----------
  G.define('v3_clozeSituation', (r) => {
    const c = r.pick(CTX),
      n = r.pick(NAMES),
      k = r.int(2, 6),
      b = otherB(r, k, 1, 6);
    const E = (kk, bb) => eq(kk, bb, c.yv, c.xv);
    const c0 = r.shuffle([k, b, k + b].map(String));
    const c1 = r.shuffle([b, k, k + b].map(String));
    const c2 = r.shuffle([E(k, b), E(b, k), E(k, 0)]);
    return {
      type: 'cloze',
      skill: 'eq-situation',
      lesson: '9-3',
      title: 'Build the equation',
      prompt: `<p>${c.aff(n, k, b)}</p><p>Let ${c.xv} be the ${c.xw} and ${c.yv} be the ${c.yw}. Complete the sentences.</p>`,
      template: `The rate of change is {0} per ${c.one}. The starting value is {1}. The equation is {2}.`,
      choices: [c0, c1, c2],
      answers: [c0.indexOf(String(k)), c1.indexOf(String(b)), c2.indexOf(E(k, b))],
      hints: [
        'The rate of change is the amount that repeats for every one. The starting value is the amount that happens once, even for 0.',
        `What is the ${c.yw} for 0 ${c.many}? That is the starting value. How much does each ${c.one} add? That is the rate.`,
        `Rate ${k}, starting value ${b}. In the equation, the rate multiplies ${c.xv} and the starting value is added.`,
      ],
      solution: `<p>Each ${c.one} adds ${k}, so the rate of change is <b>${k}</b>. The ${yWord(c, b)} happens once, so the starting value is <b>${b}</b>. Rate times ${c.xv}, plus the starting value: <b>${E(k, b)}</b>.</p>`,
      feedback: {
        correct: 'Correct. Rate multiplies the input; the starting value is added once.',
        wrong(ans, d) {
          if (d.wrong.includes(0)) return `The rate is what repeats for every ${c.one}. Which number in the story happens again and again?`;
          if (d.wrong.includes(1)) return `The starting value is the ${c.yw} before any ${c.many}: the amount that happens only once.`;
          return `Put the rate in front of ${c.xv} and add the starting value. Test it with 1 ${c.one}: the ${c.yw} should be ${k + b}.`;
        },
      },
    };
  });

  // ---------- Error: used the starting value as the rate (error) ----------
  G.define('v3_errorRate', (r) => {
    const c = r.pick(CTX),
      n = r.pick(NAMES),
      k = r.int(2, 6),
      b = otherB(r, k, 1, 6);
    const E = (kk, bb) => eq(kk, bb, c.yv, c.xv);
    const fixX = r.int(5, 9);
    const sh = shuffleOptions(
      r,
      [
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
      ],
      0,
    );
    return {
      type: 'error',
      skill: 'eq-situation',
      lesson: '9-3',
      title: 'Find the mistake in the equation',
      prompt: `<p>${c.aff(n, k, b)} ${n} wrote an equation, with ${c.xv} for the ${c.xw} and ${c.yv} for the ${c.yw}.</p><p>Which statement describes the mistake? Then give the correct ${c.yw} for ${fixX} ${c.many}.</p>`,
      work: `<p>${n}'s equation: <b>${E(b, k)}</b></p><p>${n}'s check: 1 ${c.one} → ${b} × 1 + ${k} = ${k + b}. ✓</p>`,
      options: sh.options,
      answer: sh.answer,
      fix: { label: `Correct ${c.yw} for ${fixX} ${c.many}: `, answer: k * fixX + b },
      hints: [
        `${n}'s check with 1 ${c.one} worked, but one test is not enough. Try 2 ${c.many} with the story and with the equation.`,
        `Story: 2 ${c.many} → ${k} × 2 + ${b} = ${2 * k + b}. Equation: ${b} × 2 + ${k} = ${2 * b + k}. They do not match. Which number should multiply ${c.xv}?`,
        `The rate (${k}) multiplies ${c.xv}; the ${yWord(c, b)} is added once. For the fix: ${k} × ${fixX} + ${b}.`,
      ],
      solution: `<p>${n} put the starting value where the rate belongs. The amount for <b>every</b> ${c.one} is ${k}, so it multiplies ${c.xv}; the ${yWord(c, b)} happens once, so it is added: <b>${E(k, b)}</b>. The check with 1 ${c.one} passed only because ${b} × 1 + ${k} and ${k} × 1 + ${b} are both ${k + b}. For ${fixX} ${c.many}: ${k} × ${fixX} + ${b} = <b>${k * fixX + b}</b>.</p>`,
      feedback: {
        correct: 'Correct. A check with x = 1 cannot tell the rate from the starting value. Always test a second value.',
        wrong(ans, d) {
          if (!d.mistakeOk)
            return (sh.options[ans.mistake] && sh.options[ans.mistake].why) || `Test 2 ${c.many} with the story and with ${n}'s equation. They disagree, so look at which number multiplies ${c.xv}.`;
          const v = parseNum(ans.fix);
          if (v === b * fixX + k) return `Mistake found, but you used ${n}'s equation for the fix. Use ${E(k, b)}: ${k} × ${fixX} + ${b}.`;
          if (v === k * fixX) return `Mistake found. For the fix, add the ${yWord(c, b)} after multiplying: ${k} × ${fixX} + ${b}.`;
          return `Mistake found. For the fix, substitute ${fixX} into ${E(k, b)}.`;
        },
      },
    };
  });

  // ---------- Who is correct about the equation's variables (who) ----------
  G.define('v3_whoEquation', (r) => {
    const c = r.pick(CTX),
      [n0, n1, n2, n3] = r.pickN(NAMES, 4),
      k = r.int(2, 6),
      b = r.chance(0.6) ? otherB(r, k, 1, 6) : 0;
    const E = eq(k, b, c.yv, c.xv);
    const sh = shuffleOptions(
      r,
      [
        { title: n1, html: `${c.xv} is the independent variable. You choose the ${c.xw}, and the ${c.yw} (${c.yv}) is calculated from it.`, ok: true },
        {
          title: n2,
          html: `${c.yv} is the independent variable because it is written first in the equation.`,
          why: `Being written first does not make a variable independent. ${c.yv} is written alone because it is the result you are finding. It depends on ${c.xv}.`,
        },
        {
          title: n3,
          html: `${k} is the independent variable because it never changes.`,
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
      prompt: `<p>${story(c, n0, k, b)} The equation is ${hl(E)}, where ${c.xv} is the ${c.xw} and ${c.yv} is the ${c.yw}.</p><p>Three students disagree about the independent variable. Who is correct?</p>`,
      options: sh.options,
      answer: sh.answer,
      layout: 'cards',
      hints: [
        'The independent variable is the input: the quantity you choose. The dependent variable is the output that is calculated.',
        `In ${E}, you substitute a value for one letter and calculate the other. Which letter do you substitute into?`,
        `You pick the ${c.xw} (${c.xv}) and calculate the ${c.yw} (${c.yv}). A plain number like ${k} is a constant, not a variable.`,
      ],
      solution: `<p><b>${n1}</b> is correct. In ${E}, you choose a value for ${c.xv} (the ${c.xw}) and the equation gives ${c.yv} (the ${c.yw}). ${c.xv} is independent; ${c.yv} is dependent. Writing ${c.yv} first just shows that it is the result. ${k} is a constant, not a variable.</p>`,
      feedback: { correct: 'Correct. The variable you substitute into is independent; the one you calculate is dependent.' },
    };
  });

  // ---------- Match tables and situations to equations (match) ----------
  G.define('v3_matchThree', (r) => {
    const k = r.int(2, 4);
    const b = otherB(r, k, 2, 5);
    const names = r.pickN(NAMES, 2);
    const ctxs = r.pickN(CTX, 2);
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
      return xyTable(kk, bb, [1, 2, 3], 'mini');
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
      prompt: '<p>Each table and each story on the left is described by exactly one equation on the right. Match them.</p>',
      left,
      right: rightShuffled,
      pairs,
      hints: [
        'For a table, test x = 1 and x = 2 in each equation. For a story, find what repeats (the rate) and what happens once (the starting value).',
        `The equations use the rates ${k}, 1, and ${b} and the starting values 0, ${b}, and ${k}. For x = 1, the equations give ${params.map(([kk, bb]) => `${eq(kk, bb)} → ${kk + bb}`).join('; ')}.`,
        'Two items may agree at x = 1. Use x = 2 to tell them apart.',
      ],
      solution: `<p>${params.map(([kk, bb], i) => `${storyIdx.includes(i) ? 'Story' : 'Table'} ${i + 1}: rate ${kk}, starting value ${bb} → <b>${eq(kk, bb)}</b>`).join('. ')}.</p>`,
      feedback: {
        correct: 'Correct. A table, a story, and an equation can all describe the same relationship.',
        wrong(ans, d) {
          const i = d.wrong[0];
          const [kk, bb] = params[i];
          return storyIdx.includes(i)
            ? `Look again at item ${i + 1}. What repeats for every one? That is the rate, ${kk}. What happens once? That is ${bb}. Find the equation with that rate and starting value.`
            : `Look again at item ${i + 1}. For x = 1 it gives ${kk + bb}, and for x = 2 it gives ${2 * kk + bb}. Which equation gives both?`;
        },
      },
    };
  });

  // ---------- Order relationships by rate (seq) ----------
  G.define('v3_seqRates', (r) => {
    const c = r.pick(CTX),
      [n1, n2] = r.pickN(NAMES, 2);
    const rates = r.pickN([1, 2, 3, 4, 5, 6], 4);
    const bEq = r.int(1, 5),
      bTab = r.int(1, 4);
    const g = grid(rates[3] * 4);
    const items = [
      { html: `<b>Equation:</b> ${eq(rates[0], bEq, c.yv, c.xv)}`, rate: rates[0] },
      {
        html: `<b>Table:</b>${V.table(
          [
            [c.xLabel, '1', '2', '3'],
            [c.yLabel, String(rates[1] + bTab), String(2 * rates[1] + bTab), String(3 * rates[1] + bTab)],
          ],
          { header: false, rowHeader: true, cls: 'mini' },
        )}`,
        rate: rates[1],
      },
      { html: `<b>Story:</b> ${c.prop(n1, rates[2])}`, rate: rates[2] },
      {
        html: `<b>Graph (${n2}'s route):</b>${V.graph({ xLabel: c.xLabel, yLabel: c.yLabel, xMax: 4, yMax: g.yMax, yStep: g.yStep, size: 150, series: [{ points: pts(rates[3], 0, [1, 2, 3, 4]), line: true }] })}`,
        rate: rates[3],
      },
    ];
    const desc = r.chance(0.4);
    const order = [0, 1, 2, 3].sort((a, z) => (desc ? items[z].rate - items[a].rate : items[a].rate - items[z].rate));
    return {
      type: 'seq',
      skill: 'multi-rep',
      lesson: '9-3',
      title: 'Order by rate of change',
      prompt: `<p>Four routes are shown in four different ways. Order them from the ${desc ? '<b>fastest</b> rate (top) to the <b>slowest</b> rate (bottom)' : '<b>slowest</b> rate (top) to the <b>fastest</b> rate (bottom)'}: ${c.yu} per ${c.one}.</p>`,
      items,
      order,
      hints: [
        'The rate is how much y changes for each 1 of x. Ignore starting values; they do not change the rate.',
        `Equation: the number in front of ${c.xv}. Table: subtract neighboring values. Story: the amount per ${c.one}. Graph: the rise from one point to the next.`,
        `Rates: equation ${rates[0]}, table ${rates[1]}, story ${rates[2]}, graph ${rates[3]}. Put the ${desc ? 'largest' : 'smallest'} first.`,
      ],
      solution: `<p>Equation: rate <b>${rates[0]}</b> (the number multiplying ${c.xv}; the + ${bEq} is a starting value). Table: ${2 * rates[1] + bTab} − ${rates[1] + bTab} = <b>${rates[1]}</b>. Story: <b>${rates[2]}</b> per ${c.one}. Graph: the point above 1 is at ${rates[3]}, so <b>${rates[3]}</b>. ${desc ? 'Fastest' : 'Slowest'} to ${desc ? 'slowest' : 'fastest'}: ${order.map((i) => ['equation', 'table', 'story', 'graph'][i]).join(', ')}.</p>`,
      feedback: {
        correct: 'Correct. Every representation hides the same number: the change in y for each 1 of x.',
        wrong() {
          return `Find each rate first. In the equation it is the number in front of ${c.xv}, not the number added. In the table, subtract neighboring values. Then check the direction asked for.`;
        },
      },
    };
  });

  // ---------- Complete a table from an equation (table) ----------
  G.define('v3_tableFromEquation', (r) => {
    const c = r.pick(CTX),
      n = r.pick(NAMES),
      k = r.int(2, 6),
      b = r.chance(0.6) ? r.int(1, 6) : 0;
    const E = eq(k, b, c.yv, c.xv);
    const xs = r.pick([
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
        `${c.xv} = ${xs[1]}: ${subst(k, b, xs[1])} = ${k * xs[1] + b}. The columns skip numbers, so substitute each one; do not just add ${k}.`,
      ],
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
          return `For ${c.xv} = ${x}: ${subst(k, b, x)}.`;
        },
      },
    };
  });

  // ---------- What does a number in the equation mean? (mc) ----------
  G.define('v3_describeMc', (r) => {
    const c = r.pick(CTX),
      n = r.pick(NAMES),
      k = r.int(2, 6),
      b = otherB(r, k, 1, 6);
    const E = eq(k, b, c.yv, c.xv);
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
          { html: `Each ${c.one} adds ${b} to the ${c.yw}.`, why: `The amount per ${c.one} is the number multiplied by ${c.xv}, which is ${k}. The ${b} is added only once.` },
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
        'In y = kx + b, the number multiplied by the variable is the rate of change. The number added is the starting value.',
        `Is ${askK ? k : b} multiplied by ${c.xv} or added on? ${askK ? `${k}${c.xv} means ${k} for every ${c.one}.` : `+ ${b} means ${b} is added once, no matter how many ${c.many}.`}`,
        askK
          ? `Substitute ${c.xv} = 0 and ${c.xv} = 1: the ${c.yw} goes from ${b} to ${k + b}. The change is ${k}.`
          : `Substitute ${c.xv} = 0: ${k} × 0 + ${b} = ${b}. That is the ${c.yw} before any ${c.many}.`,
      ],
      solution: askK
        ? `<p>In ${E}, the ${k} is multiplied by ${c.xv}, so it happens for every ${c.one}: <b>each ${c.one} adds ${k} to the ${c.yw}</b>. That is the rate of change. The ${b} is the starting value, added once.</p>`
        : `<p>In ${E}, the ${b} is added once, not multiplied. When ${c.xv} = 0, the ${c.yw} is ${k} × 0 + ${b} = ${b}. So <b>${b} is the ${c.yw} before any ${c.many}</b>: the starting value.</p>`,
      feedback: { correct: 'Correct. Multiplied means "for every one"; added means "once, at the start."' },
    };
  });
})(typeof window !== 'undefined' ? window : globalThis);

/* js/units/u9/gen-apply.js */
/* Zone 4 — Central Junction. Lesson 9-4 Apply Two-Variable Relationships to Solve Problems (Substitute and Solve · Working Backward to a Goal). */
(function (root) {
  'use strict';
  const RX = root.RX;
  const { G, V, shuffleOptions, NAMES, parseNum, fmt } = RX;
  const { CTX, eq, yWord, grid } = RX.U9;
  const hl = V.hl;
  const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
  const story = (c, n, k, b) => (b ? c.aff(n, k, b) : c.prop(n, k));
  /** Expression text for substituting x into y = kx + b, e.g. "3 × 4 + 2". */
  const subst = (k, b, x) => `${k === 1 ? x : k + ' × ' + x}${b ? ' + ' + b : ''}`;
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
  /** "n stop" / "n stops" */
  const count = (c, n) => `${n} ${n === 1 ? c.one : c.many}`;

  // ---------- Substitute into an equation (num, honors hard) ----------
  G.define('v4_substitute', (r, o) => {
    const k = o.hard ? r.int(4, 9) : r.int(2, 6);
    const b = o.hard ? r.int(3, 12) : r.chance(0.6) ? r.int(1, 6) : 0;
    const x = o.hard ? r.int(8, 15) : r.int(3, 9);
    const E = eq(k, b);
    const y = k * x + b;
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
        `Multiply first: ${k} × ${x} = ${k * x}.${b ? ` Then add ${b}.` : ' That is y.'}`,
      ],
      solution: `<p>Substitute x = ${x} into ${E}: y = ${subst(k, b, x)} = ${b ? `${k * x} + ${b} = ` : ''}<b>${y}</b>. The number next to x is multiplied by x; the number added stays the same.</p>`,
      feedback: {
        correct: 'Correct. Replace the variable, multiply first, then add.',
        wrong(ans, d) {
          const v = d.value;
          if (v == null) return 'Type a number for y.';
          if (b && v === k * x) return `You multiplied correctly but left out the + ${b}. The equation has two steps.`;
          if (v === k + x + b) return `${k}x means ${k} times x, not ${k} plus x. Multiply ${k} × ${x} first.`;
          if (b && v === k * (x + b)) return `You added ${b} before multiplying. Multiply ${k} × ${x} first, then add ${b}.`;
          if (v === x) return `${x} is the value of x. The question asks for y.`;
          return `Replace x with ${x}: ${subst(k, b, x)}. Multiply before adding.`;
        },
      },
    };
  });

  // ---------- Write the equation from a story, then substitute (blanks) ----------
  G.define('v4_substituteStory', (r) => {
    const c = r.pick(CTX),
      n = r.pick(NAMES),
      k = r.int(2, 6),
      b = otherB(r, k, 1, 6),
      x = r.int(4, 9);
    const E = eq(k, b, c.yv, c.xv);
    const y = k * x + b;
    return {
      type: 'blanks',
      skill: 'substitute',
      lesson: '9-4',
      title: 'Write the equation, then use it',
      prompt: `<p>${c.aff(n, k, b)}</p><p>Let ${c.xv} be the ${c.xw} and ${c.yv} be the ${c.yw}. Write the equation, then find the ${c.yw} for ${hl(count(c, x))}.</p>`,
      template: `Equation: ${c.yv} = {0}${c.xv} + {1}.   For ${count(c, x)}, ${c.yv} = {2}.`,
      fields: [
        { label: 'rate', answer: k, width: 'xs' },
        { label: 'starting value', answer: b, width: 'xs' },
        { label: c.yw, answer: y, width: 'sm' },
      ],
      hints: [
        `The number that repeats for every ${c.one} multiplies ${c.xv}. The number that happens once is added.`,
        `Each ${c.one} adds ${k}, and the ${yWord(c, b)} is added once. So the equation is ${c.yv} = ${k}${c.xv} + ${b}.`,
        `Substitute ${c.xv} = ${x}: ${k} × ${x} + ${b}.`,
      ],
      solution: `<p>Rate ${k} (for every ${c.one}), starting value ${b} (once): <b>${E}</b>. Then substitute ${c.xv} = ${x}: ${k} × ${x} + ${b} = ${k * x} + ${b} = <b>${y}</b>. For ${count(c, x)}, the ${c.yw} is ${yWord(c, y)}.</p>`,
      feedback: {
        correct: 'Correct. Write the rule first, then the rule does the calculating for you.',
        wrong(ans, d) {
          const i = d.wrong[0];
          const v = parseNum(ans[i]);
          if (i === 0)
            return v === b
              ? `You put the starting value in front of ${c.xv}. The number in front of ${c.xv} is the amount for every ${c.one}: ${k}.`
              : `The rate is the amount that repeats for every ${c.one}.`;
          if (i === 1)
            return v === k
              ? `You put the rate in the added spot. The added number is the ${yWord(c, b)} that happens once.`
              : `The starting value is the amount that happens once, before any ${c.many}.`;
          if (v === k * x) return `For the last blank, you forgot to add the ${b}.`;
          if (v === b * x + k) return `For the last blank, you used the numbers in swapped places. Multiply ${k} by ${x}, then add ${b}.`;
          return `For the last blank, substitute ${x} for ${c.xv}: ${k} × ${x} + ${b}.`;
        },
      },
    };
  });

  // ---------- Table with missing outputs and missing inputs (table) ----------
  G.define('v4_tableEq', (r) => {
    const c = r.pick(CTX),
      n = r.pick(NAMES),
      k = r.int(2, 5),
      b = r.chance(0.6) ? r.int(1, 6) : 0;
    const E = eq(k, b, c.yv, c.xv);
    const xs = r.pick([
      [1, 3, 6, 8],
      [2, 4, 7, 10],
      [0, 5, 6, 9],
    ]);
    const cols = xs.map((x, i) => ({ x, y: k * x + b, mode: i % 2 === 0 ? 'y' : 'x' }));
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
        `When the ${c.xw} is given, substitute it into ${E}. When the ${c.yw} is given, work backward: ${b ? `subtract ${b}, then divide by ${k}` : `divide by ${k}`}.`,
        `Column 1: ${c.xv} = ${cols[0].x} → ${subst(k, b, cols[0].x)} = ${cols[0].y}. Column 2: ${c.yv} = ${cols[1].y} → ${b ? `${cols[1].y} − ${b} = ${cols[1].y - b}, then ${cols[1].y - b} ÷ ${k}` : `${cols[1].y} ÷ ${k}`}.`,
        `Check every answer by substituting it back into ${E}.`,
      ],
      solution: `<p>${cols.map((col) => (col.mode === 'y' ? `${c.xv} = ${col.x}: ${subst(k, b, col.x)} = <b>${col.y}</b>` : `${c.yv} = ${col.y}: ${b ? `(${col.y} − ${b}) ÷ ${k}` : `${col.y} ÷ ${k}`} = <b>${col.x}</b>`)).join('; ')}. Forward, substitute and evaluate. Backward, undo the steps in reverse order.</p>`,
      feedback: {
        correct: 'Correct. The same equation works forward (find y) and backward (find x).',
        wrong(ans, d) {
          const id = d.wrong[0];
          const v = parseNum(ans[id]);
          const num = Number(id.slice(1));
          if (id[0] === 'y') {
            if (b && v === k * num) return `For ${c.xv} = ${num}, add the ${b} after multiplying.`;
            return `For ${c.xv} = ${num}, substitute: ${subst(k, b, num)}.`;
          }
          const col = cols.find((cc) => cc.y === num);
          if (v === num * k + b || v === num * k) return `The ${c.yw} ${num} is given. To find the ${c.xw}, undo the equation: ${b ? `subtract ${b}, then divide by ${k}` : `divide by ${k}`}.`;
          if (b && v === num / k - b && Number.isInteger(num / k)) return `You divided before subtracting. Undo the + ${b} first, then divide by ${k}.`;
          if (b && v === num - b) return `${num} − ${b} = ${num - b} is a good first step. Now divide by ${k} to find the ${c.xw}.`;
          return `For ${c.yv} = ${num}: ${b ? `${num} − ${b} = ${num - b}; ${num - b} ÷ ${k}` : `${num} ÷ ${k}`} = ${col.x}.`;
        },
      },
    };
  });

  // ---------- Error: substitution mistake (error) ----------
  G.define('v4_errorSubstitute', (r) => {
    const n = r.pick(NAMES),
      k = r.int(2, 6),
      b = r.int(1, 6),
      x = r.int(3, 8);
    const E = eq(k, b);
    const y = k * x + b;
    const variant = r.pick(['added', 'parens']);
    const badWork = variant === 'added' ? `y = ${k} + ${x} + ${b} = ${k + x + b}` : `y = ${k} × (${x} + ${b}) = ${k} × ${x + b} = ${k * (x + b)}`;
    const opts =
      variant === 'added'
        ? [
            { html: `${n} added ${k} and ${x}. The expression ${k}x means ${k} <b>times</b> x, so the first step is ${k} × ${x} = ${k * x}.`, ok: true },
            { html: `${n} should not have added ${b}.`, why: `The + ${b} is part of the equation, so adding ${b} is correct. The mistake is in the ${k}x part.` },
            { html: `${n} substituted ${x} for the wrong variable.`, why: `${x} replaced x, which is right. The problem is treating ${k}x as ${k} + x.` },
            { html: `${n} should have divided ${x} by ${k}.`, why: `Dividing is for working backward from y. Here x is known, so you multiply: ${k} × ${x}.` },
          ]
        : [
            { html: `${n} added ${b} to x before multiplying. In ${E}, only x is multiplied by ${k}; the ${b} is added after.`, ok: true },
            { html: `${n} should have added ${b} to ${k} first.`, why: `${k} and ${b} are never combined. ${k} multiplies x; ${b} is added to the product.` },
            { html: `${n} multiplied when the equation says to add.`, why: `${k}x does mean multiply. The mistake is <b>what</b> got multiplied: x + ${b} instead of just x.` },
            { html: `${n} substituted the wrong number for x.`, why: `x = ${x} was substituted correctly. The order of the operations is the problem.` },
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
      fix: { label: 'Correct y: ', answer: y },
      hints: [
        `Read ${E} carefully. Which operation does ${k}x stand for, and what gets added?`,
        `${k}x means ${k} × x. Substituting x = ${x} gives ${k} × ${x}${b ? ' + ' + b : ''}. Compare that with ${n}'s first line.`,
        `${k} × ${x} = ${k * x}. Then add ${b}.`,
      ],
      solution: `<p>${variant === 'added' ? `${n} treated ${k}x as ${k} + x. It means ${k} times x.` : `${n} added ${b} to x before multiplying, but only x is multiplied by ${k}.`} Correct work: y = ${subst(k, b, x)} = ${k * x} + ${b} = <b>${y}</b>.</p>`,
      feedback: {
        correct: 'Correct. A coefficient means multiply, and multiplication comes before the addition in y = kx + b.',
        wrong(ans, d) {
          if (!d.mistakeOk) return (sh.options[ans.mistake] && sh.options[ans.mistake].why) || `Compare ${n}'s first line with ${k} × ${x} + ${b}.`;
          const v = parseNum(ans.fix);
          if (v === k * x) return `Mistake found. For the fix, add the ${b} after multiplying: ${k * x} + ${b}.`;
          return `Mistake found. For the fix: ${k} × ${x} + ${b}.`;
        },
      },
    };
  });

  // ---------- Work backward, one step (num) ----------
  G.define('v4_backOneStep', (r) => {
    const c = r.pick(CTX),
      n = r.pick(NAMES);
    const isMult = r.chance(0.6);
    const k = isMult ? r.int(2, 6) : 1;
    const b = isMult ? 0 : r.int(2, 9);
    const x = r.int(4, 12);
    const y = k * x + b;
    const E = eq(k, b, c.yv, c.xv);
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
        isMult ? `The equation multiplies ${c.xv} by ${k}. To undo multiplying, divide: ${y} ÷ ${k}.` : `The equation adds ${b} to ${c.xv}. To undo adding, subtract: ${y} − ${b}.`,
        `Check your answer by substituting it back: ${isMult ? `${k} × ? = ${y}` : `? + ${b} = ${y}`}.`,
      ],
      solution: `<p>Substitute ${c.yv} = ${y}: ${isMult ? `${y} = ${k}${c.xv}. Divide both sides by ${k}: ${c.xv} = ${y} ÷ ${k} = ` : `${y} = ${c.xv} + ${b}. Subtract ${b} from both sides: ${c.xv} = ${y} − ${b} = `}<b>${x}</b>. Check: ${subst(k, b, x)} = ${y}. ✓ The ${c.xw} is ${x}.</p>`,
      feedback: {
        correct: 'Correct. Working backward means undoing: divide to undo multiplying, subtract to undo adding.',
        wrong(ans, d) {
          const v = d.value;
          if (v == null) return `Type a number of ${c.many}.`;
          if (isMult && v === y * k) return `You multiplied, but ${y} is already the output. To find the input, divide ${y} by ${k}.`;
          if (!isMult && v === y + b) return `You added, but ${y} is already the output. To find the input, subtract ${b} from ${y}.`;
          if (v === y) return `${y} is the ${c.yw}, which is given. Work backward to find the ${c.xw}.`;
          return `Substitute your answer into ${E}. Does it give ${y}? ${isMult ? `Try ${y} ÷ ${k}.` : `Try ${y} − ${b}.`}`;
        },
      },
    };
  });

  // ---------- Work backward, two steps (num, honors hard) ----------
  G.define('v4_backTwoStep', (r, o) => {
    const k = o.hard ? r.int(4, 9) : r.int(2, 6);
    const b = o.hard ? r.int(5, 15) : r.int(1, 8);
    const x = o.hard ? r.int(7, 15) : r.int(3, 9);
    const y = k * x + b;
    const E = eq(k, b);
    return {
      type: 'num',
      skill: 'backward',
      lesson: '9-4',
      title: 'Undo two steps',
      prompt: `<p>Use the equation ${hl(E)}.</p><p>When y = ${hl(y)}, what is x?</p>`,
      answer: x,
      hints: [
        'To find x from y, undo the steps in reverse order. The equation multiplies by ' + k + ' and then adds ' + b + ', so first undo the adding, then undo the multiplying.',
        `Subtract ${b} from ${y}: ${y} − ${b} = ${y - b}. That is the value of ${k}x.`,
        `Now undo the multiplying: ${y - b} ÷ ${k}.`,
      ],
      solution: `<p>${y} = ${k}x + ${b}. Subtract ${b} from both sides: ${k}x = ${y - b}. Divide both sides by ${k}: x = ${y - b} ÷ ${k} = <b>${x}</b>. Check: ${subst(k, b, x)} = ${k * x} + ${b} = ${y}. ✓ You undo the last step first, so subtracting comes before dividing.</p>`,
      feedback: {
        correct: 'Correct. Undo in reverse order: subtract the starting value, then divide by the rate.',
        wrong(ans, d) {
          const v = d.value;
          if (v == null) return 'Type a number for x.';
          if (Math.abs(v - (y / k - b)) < 0.01) return `You divided before subtracting. The equation added ${b} last, so undo that first: ${y} − ${b}, then divide by ${k}.`;
          if (v === y - b) return `${y} − ${b} = ${y - b} is a good first step, but that is ${k}x, not x. Divide by ${k}.`;
          if (Math.abs(v - (y + b) / k) < 0.01) return `You added ${b} instead of subtracting it. The equation added ${b}, so undo it by subtracting.`;
          if (v === y) return `${y} is y. The question asks for x.`;
          return `Undo the steps in reverse: ${y} − ${b} first, then divide by ${k}.`;
        },
      },
    };
  });

  // ---------- Work backward in a story, scaffolded (blanks, honors hard) ----------
  G.define('v4_backStory', (r, o) => {
    const c = r.pick(CTX),
      n = r.pick(NAMES);
    const k = o.hard ? r.int(4, 9) : r.int(2, 6);
    const b = o.hard ? otherB(r, k, 5, 15) : otherB(r, k, 1, 8);
    const x = o.hard ? r.int(8, 15) : r.int(4, 9);
    const y = k * x + b;
    const E = eq(k, b, c.yv, c.xv);
    return {
      type: 'blanks',
      skill: 'backward',
      lesson: '9-4',
      title: 'Work backward to the goal',
      prompt: `<p>${c.aff(n, k, b)} The equation is ${hl(E)}, where ${c.xv} is the ${c.xw} and ${c.yv} is the ${c.yw}.</p><p>${cap(n)}'s ${c.yw} came to ${hl(yWord(c, y))}. Work backward to find the ${c.xw}.</p>`,
      template: `Undo the starting value: ${y} − {0} = {1}.   Undo the rate: divide by {2} to get {3} ${c.many}.`,
      fields: [
        { label: 'starting value', answer: b, width: 'xs' },
        { label: 'after subtracting', answer: y - b, width: 'sm' },
        { label: 'rate', answer: k, width: 'xs' },
        { label: c.xw, answer: x, width: 'sm' },
      ],
      hints: [
        `The equation did two things to the ${c.xw}: multiplied by the rate, then added the starting value. Undo them in reverse order.`,
        `The starting value is the ${yWord(c, b)} that happened once. Subtract it from ${y} first.`,
        `${y} − ${b} = ${y - b}. That is ${k} × (${c.xw}). Divide by ${k}.`,
      ],
      solution: `<p>${y} = ${k}${c.xv} + ${b}. Subtract the starting value: ${y} − ${b} = ${y - b}. Divide by the rate: ${y - b} ÷ ${k} = <b>${x}</b>. Check: ${subst(k, b, x)} = ${y}. ✓ So ${n} had ${count(c, x)}.</p>`,
      feedback: {
        correct: 'Correct. Subtract the one-time amount first, then divide by the per-one amount.',
        wrong(ans, d) {
          const i = d.wrong[0];
          const v = parseNum(ans[i]);
          if (i === 0)
            return v === k
              ? `${k} is the rate, the amount for every ${c.one}. The starting value is the amount that happened once: the ${yWord(c, b)}.`
              : `The starting value is the ${yWord(c, b)}, the part of the equation that is added.`;
          if (i === 1) return `Subtract the starting value ${b} from ${y}.`;
          if (i === 2) return v === b ? `${b} is the starting value, already undone. Divide by the rate: the amount for every ${c.one}.` : `The rate is the number multiplied by ${c.xv} in ${E}.`;
          if (v === y - b) return `${y - b} is ${k} times the ${c.xw}. Divide it by ${k}.`;
          return `Divide ${y - b} by ${k} to find the ${c.xw}.`;
        },
      },
    };
  });

  // ---------- Who worked backward correctly (who) ----------
  G.define('v4_whoBackward', (r) => {
    const [n1, n2] = r.pickN(NAMES, 2),
      k = r.int(2, 6),
      b = r.int(1, 8),
      x = r.int(3, 9);
    const y = k * x + b;
    const E = eq(k, b);
    const wrongDiv = y / k;
    const wrongDivText = fmt(RX.round(wrongDiv, 2));
    const wrongFinal = fmt(RX.round(wrongDiv - b, 2));
    const sh = shuffleOptions(
      r,
      [
        { title: n1, html: `<p>${y} = ${k}x + ${b}</p><p>${y} − ${b} = ${y - b}</p><p>${y - b} ÷ ${k} = ${x}</p><p>x = ${x}</p>`, ok: true },
        {
          title: n2,
          html: `<p>${y} = ${k}x + ${b}</p><p>${y} ÷ ${k} = ${wrongDivText}</p><p>${wrongDivText} − ${b} = ${wrongFinal}</p><p>x = ${wrongFinal}</p>`,
          why: `${n2} divided first. The equation added ${b} <b>last</b>, so undo that first by subtracting ${b}. Check: ${k} × ${wrongFinal} + ${b} is not ${y}.`,
        },
      ],
      0,
    );
    return {
      type: 'who',
      skill: 'backward',
      lesson: '9-4',
      title: 'Who worked backward correctly?',
      prompt: `<p>Two students used ${hl(E)} to find x when y = ${hl(y)}.</p><p>Whose work is correct?</p>`,
      options: sh.options,
      answer: sh.answer,
      layout: 'cards',
      hints: [
        'The equation multiplies by ' + k + ' and then adds ' + b + '. Working backward undoes the steps in reverse order.',
        `Undo the last step first. The last step was + ${b}, so start by subtracting ${b} from ${y}.`,
        `Check each answer by substituting it back into ${E}. Only one gives ${y}.`,
      ],
      solution: `<p><b>${n1}</b> is correct. The equation does "multiply by ${k}, then add ${b}," so undoing goes "subtract ${b}, then divide by ${k}": ${y} − ${b} = ${y - b}, ${y - b} ÷ ${k} = ${x}. Check: ${subst(k, b, x)} = ${y}. ✓ ${n2} divided before subtracting, which treats the ${b} as if it had been multiplied too.</p>`,
      feedback: { correct: 'Correct. Undo the last operation first. Substituting back is the proof.' },
    };
  });

  // ---------- Make a table and plot the equation (plot) ----------
  G.define('v4_plotEquation', (r) => {
    const c = r.pick(CTX),
      n = r.pick(NAMES);
    const b = r.chance(0.6) ? r.int(1, 4) : 0;
    const k = b ? r.int(1, 4) : r.int(2, 4);
    const xs = r.pick([
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
      solution: `<p>Table: ${points.map((p) => `${c.xv} = ${p[0]} → ${c.yv} = ${p[1]}`).join('; ')}. Plot ${points.map(pairText).join(', ')}. The points lie on a straight line because the ${c.yw} rises by ${k} for every ${c.one}.</p>${V.graph({ xLabel: c.xLabel, yLabel: c.yLabel, xMax: 5, yMax: g.yMax, yStep: g.yStep, size: 260, series: [{ points, line: true }] })}`,
      feedback: {
        correct: 'Correct. Equation to table to graph: three views of one relationship.',
        wrong(ans, d) {
          if (d.extra && d.extra.length) {
            const p = d.extra[0];
            if (points.some((q) => q[0] === p[1] && q[1] === p[0])) return `(${p[0]}, ${p[1]}) has the coordinates reversed. The ${c.xw} goes across; the ${c.yw} goes up.`;
            if (b && p[1] === k * p[0]) return `(${p[0]}, ${p[1]}) forgets the starting value. For ${c.xv} = ${p[0]}, ${c.yv} = ${k} × ${p[0]} + ${b} = ${k * p[0] + b}.`;
            return `(${p[0]}, ${p[1]}) is not on this graph. For ${c.xv} = ${p[0]}, the equation gives ${c.yv} = ${k * p[0] + b}.`;
          }
          const m = d.missing[0];
          return `You still need the point for ${c.xv} = ${m[0]}. Substitute: ${subst(k, b, m[0])} = ${m[1]}, so plot (${m[0]}, ${m[1]}).`;
        },
      },
    };
  });

  // ---------- Greatest input that stays within a limit (mc) ----------
  G.define('v4_goalCompare', (r) => {
    const c = r.pick(CTX),
      n = r.pick(NAMES),
      k = r.int(2, 6),
      b = r.chance(0.7) ? otherB(r, k, 1, 8) : 0;
    const x = r.int(4, 10);
    const rem = r.int(1, k - 1);
    const G0 = k * x + b + rem;
    const E = eq(k, b, c.yv, c.xv);
    const forgot = Math.floor(G0 / k);
    const base = [
      { html: `${count(c, x)}`, ok: true },
      { html: `${count(c, x + 1)}`, why: `${count(c, x + 1)} would make the ${c.yw} ${subst(k, b, x + 1)} = ${k * (x + 1) + b}, which is more than ${G0}. You cannot round up when there is a limit.` },
      { html: `${count(c, forgot)}`, why: `${forgot} comes from ${G0} ÷ ${k}, which ignores the ${yWord(c, b)} that is added once. Subtract ${b} first.` },
      {
        html: `${count(c, G0 - b)}`,
        why: b
          ? `${G0} − ${b} = ${G0 - b} is the amount left for the ${c.many}, not the number of ${c.many}. Divide it by ${k}.`
          : `${G0} is the limit on the ${c.yw}, not a number of ${c.many}. Each ${c.one} uses ${k}, so divide ${G0} by ${k}.`,
      },
      { html: `${count(c, x - 1)}`, why: `${count(c, x - 1)} stays under the limit, but so does ${count(c, x)}: ${subst(k, b, x)} = ${k * x + b}. The question asks for the greatest number.` },
    ];
    const opts = dedupe(base).slice(0, 4);
    const sh = shuffleOptions(r, opts, 0);
    return {
      type: 'mc',
      skill: 'backward',
      lesson: '9-4',
      title: 'Stay within the limit',
      prompt: `<p>${story(c, n, k, b)} The equation is ${hl(E)}, where ${c.xv} is the ${c.xw} and ${c.yv} is the ${c.yw}.</p><p>The ${c.yw} may not go over ${hl(yWord(c, G0))}. What is the <b>greatest</b> ${c.xw} possible?</p>`,
      options: sh.options,
      answer: sh.answer,
      hints: [
        `Work backward from the limit: ${b ? `subtract the ${yWord(c, b)}, then divide by ${k}` : `divide ${G0} by ${k}`}. The answer will not come out even.`,
        `${b ? `${G0} − ${b} = ${G0 - b}. ${G0 - b} ÷ ${k}` : `${G0} ÷ ${k}`} is between ${x} and ${x + 1}. Which whole number keeps the ${c.yw} under the limit?`,
        `Check ${count(c, x)}: ${subst(k, b, x)} = ${k * x + b} (under ${G0}). Check ${count(c, x + 1)}: ${k * (x + 1) + b} (over). So the greatest is ${x}.`,
      ],
      solution: `<p>Work backward from ${G0}: ${b ? `${G0} − ${b} = ${G0 - b}, and ${G0 - b} ÷ ${k} = ${x} with ${rem} left over` : `${G0} ÷ ${k} = ${x} with ${rem} left over`}. The ${c.xw} must be a whole number that keeps the ${c.yw} at or under ${G0}, so round <b>down</b>: <b>${count(c, x)}</b>. Check: ${subst(k, b, x)} = ${k * x + b} ≤ ${G0}, and ${count(c, x + 1)} would be ${k * (x + 1) + b}, too much.</p>`,
      feedback: { correct: 'Correct. With a limit, the leftover means you round down. Checking both neighbors proves it.' },
    };
  });

  // ---------- True/false: does the plan reach the goal? (tf) ----------
  G.define('v4_tfGoal', (r) => {
    const c = r.pick(CTX),
      n = r.pick(NAMES),
      k = r.int(2, 6),
      b = r.chance(0.6) ? otherB(r, k, 1, 8) : 0;
    const x = r.int(4, 10);
    const y = k * x + b;
    const truthy = r.chance(0.5);
    const limit = truthy ? y + r.int(0, k - 1) : y - r.int(1, k);
    const E = eq(k, b, c.yv, c.xv);
    const reasons = r.shuffle([
      { html: `True. ${subst(k, b, x)} = ${y}, and ${y} is not more than ${limit}.`, correct: truthy },
      { html: `False. ${subst(k, b, x)} = ${y}, and ${y} is more than ${limit}.`, correct: !truthy },
      { html: `True. ${x} is less than ${limit}, so it fits.`, correct: false },
      { html: `False. ${k} × ${x} = ${k * x} is not equal to ${limit}.`, correct: false },
    ]);
    return {
      type: 'tf',
      skill: 'substitute',
      lesson: '9-4',
      title: 'Does it fit the limit?',
      prompt: `<p>${story(c, n, k, b)} The equation is ${hl(E)}, where ${c.xv} is the ${c.xw} and ${c.yv} is the ${c.yw}.</p><p>True or false: <b>With a limit of ${yWord(c, limit)}, ${n} can have ${count(c, x)}.</b></p>`,
      statement: `With a limit of ${yWord(c, limit)}, ${n} can have ${count(c, x)}.`,
      answer: truthy,
      reasons,
      hints: [
        `Substitute ${x} into the equation to find the ${c.yw}. Then compare it with the limit.`,
        `${c.xv} = ${x}: ${subst(k, b, x)} = ?`,
        `The ${c.yw} would be ${y}. Is ${y} more than ${limit}, or not?`,
      ],
      solution: truthy
        ? `<p><b>True.</b> For ${count(c, x)}, the ${c.yw} is ${subst(k, b, x)} = ${y}. Since ${y} ≤ ${limit}, it fits the limit. Comparing ${x} with ${limit} would compare a ${c.xw} with a ${c.yw}, which means nothing.</p>`
        : `<p><b>False.</b> For ${count(c, x)}, the ${c.yw} is ${subst(k, b, x)} = ${y}. Since ${y} > ${limit}, it goes over the limit. Comparing ${x} with ${limit} would compare a ${c.xw} with a ${c.yw}, which means nothing.</p>`,
      feedback: {
        correct: 'Correct, with the right reason. Substitute first, then compare the output with the limit.',
        wrong(ans, d) {
          if (!d.valueOk) return `Find the ${c.yw} for ${count(c, x)}: ${subst(k, b, x)} = ${y}. Compare ${y} with ${limit}.`;
          return `Your true/false choice is right, but the reason should compare the ${c.yw} (${y}) with the limit, not the ${c.xw}.`;
        },
      },
    };
  });

  // ---------- Explain working backward (cr) ----------
  G.define('v4_crBackward', (r) => {
    const c = r.pick(CTX),
      n = r.pick(NAMES),
      k = r.int(2, 6),
      b = otherB(r, k, 1, 8),
      x = r.int(4, 9);
    const y = k * x + b;
    const E = eq(k, b, c.yv, c.xv);
    const sh = shuffleOptions(
      r,
      [
        { html: `Subtract ${b} from ${y}, then divide by ${k}. You undo the steps in reverse order, and the last step in the equation was adding ${b}.`, ok: true },
        {
          html: `Divide ${y} by ${k}, then subtract ${b}. You undo the multiplying first because it comes first in the equation.`,
          why: `Undoing goes in <b>reverse</b> order. The equation multiplies and then adds, so undo the adding first: subtract ${b}, then divide.`,
        },
        { html: `Multiply ${y} by ${k}, then add ${b}.`, why: `That is how to go from ${c.xv} to ${c.yv}. Here ${c.yv} is known and you need ${c.xv}, so you must undo: subtract, then divide.` },
        {
          html: `Subtract ${k} from ${y}, then divide by ${b}.`,
          why: `The numbers are in the wrong roles. ${b} is what was added, so subtract ${b}. ${k} is what multiplied ${c.xv}, so divide by ${k}.`,
        },
      ],
      0,
    );
    return {
      type: 'cr',
      skill: 'backward',
      lesson: '9-4',
      title: 'Explain how to work backward',
      prompt: `<p>${c.aff(n, k, b)} The equation is ${hl(E)}. ${cap(n)}'s ${c.yw} was ${hl(yWord(c, y))}.</p><p>Explain how to find the ${c.xw} from the ${c.yw}. Then choose the explanation that is correct.</p>`,
      starters: ['The equation multiplies by … and then adds …, so to undo it I …', 'First I subtract … because …', 'Then I divide by … because …'],
      minWords: 10,
      check: { prompt: 'Which explanation is correct?', options: sh.options, answer: sh.answer },
      hints: [
        'Working backward means undoing each operation. Undo them in the reverse order from the equation.',
        `The equation says: multiply ${c.xv} by ${k}, then add ${b}. The reverse order is: undo the + ${b}, then undo the × ${k}.`,
        `Undo adding by subtracting (${y} − ${b}). Undo multiplying by dividing (÷ ${k}).`,
      ],
      solution: `<p>Model explanation: "The equation multiplies the ${c.xw} by ${k} and then adds ${b}. To undo it, I go in reverse. First I subtract ${b}: ${y} − ${b} = ${y - b}. Then I divide by ${k}: ${y - b} ÷ ${k} = <b>${x}</b>. I check by substituting: ${subst(k, b, x)} = ${y}."</p>`,
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
  const { CTX, eq, yWord, grid } = RX.U9;
  const hl = V.hl;
  const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
  const subst = (k, b, x) => `${k === 1 ? x : fmt(k) + ' × ' + x}${b ? ' + ' + b : ''}`;
  const count = (c, n) => `${n} ${n === 1 ? c.one : c.many}`;
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
  const near = (a, b) => Math.abs(a - b) < 0.005;

  /* Contexts whose rates can be decimals. amt(v): the value in the context's units ("$1.50", "2.5 meters"). */
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
      amt: (v) => `${fmt(v)} centimeters`,
      aff: (n, k, b) => `${n} measures moss on the Undercity wall. It is ${b} centimeters tall now and grows ${fmt(k)} centimeters every day.`,
    },
  ];
  const DEC_RATES = [0.5, 1.5, 2.5];

  // ---------- Write and use an equation with a decimal rate (blanks) ----------
  G.define('vc_decimalRate', (r) => {
    const c = r.pick(DCTX),
      n = r.pick(NAMES),
      k = r.pick(DEC_RATES),
      b = r.int(1, 6),
      x = r.int(3, 10);
    const y = round(k * x + b, 2);
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
        `${fmt(k)} × ${x} = ${fmt(round(k * x, 2))}. Then add ${b}.`,
      ],
      solution: `<p>Each ${c.one} adds ${c.amt(k)}, so the rate is ${fmt(k)}. The ${c.amt(b)} happens once, so the starting value is ${b}: <b>${E}</b>. For ${count(c, x)}: ${fmt(k)} × ${x} + ${b} = ${fmt(round(k * x, 2))} + ${b} = <b>${fmt(y)}</b>. The ${c.yw} is ${c.amt(y)}.</p>`,
      feedback: {
        correct: 'Correct. A decimal rate works exactly like a whole-number rate: multiply, then add the starting value.',
        wrong(ans, d) {
          const i = d.wrong[0];
          const v = parseNum(ans[i]);
          if (i === 0)
            return v === b
              ? `You put the starting value in the rate's place. The rate is the amount for every ${c.one}: ${fmt(k)}.`
              : `The rate is the decimal amount that repeats for every ${c.one}. You can type it as a decimal like 1.5 or a fraction like 3/2.`;
          if (i === 1) return `The starting value is the amount that happens once, before any ${c.many}.`;
          if (v != null && near(v, k * x)) return `You forgot to add the starting value ${b} after multiplying.`;
          if (v != null && near(v, k + x + b)) return `${fmt(k)}${c.xv} means ${fmt(k)} times ${c.xv}. Multiply ${fmt(k)} × ${x}, then add ${b}.`;
          return `For the last blank: ${fmt(k)} × ${x} + ${b}. Multiplying by ${fmt(k)} is the same as ${k === 0.5 ? 'taking half' : `${Math.floor(k)} times the number plus half of it`}.`;
        },
      },
    };
  });

  // ---------- Find the hidden rule, then fill a missing input and output (table) ----------
  G.define('vc_findRule', (r) => {
    const c = r.pick(CTX),
      k = r.int(2, 6),
      b = r.int(1, 7);
    const x4 = r.int(5, 9),
      x5 = r.int(10, 14);
    const y4 = k * x4 + b,
      y5 = k * x5 + b;
    const E = eq(k, b, c.yv, c.xv);
    return {
      type: 'table',
      skill: 'eq-table',
      lesson: 'Challenge',
      title: 'Find the rule, then fill both gaps',
      prompt: `<p>This table follows a rule of the form ${hl(`${c.yv} = k${c.xv} + b`)}, but the rule is not given.</p><p>Find the rule from the first three columns. Then fill in the missing ${c.xw} and the missing ${c.yw}.</p>`,
      rows: [
        [c.xLabel, '1', '2', '3', '__IN:x__', String(x5)],
        [c.yLabel, String(k + b), String(2 * k + b), String(3 * k + b), String(y4), '__IN:y__'],
      ],
      rowHeader: true,
      inputs: [
        { id: 'x', answer: x4 },
        { id: 'y', answer: y5 },
      ],
      hints: [
        `Find the rate first: subtract neighboring ${c.yw} values. Then find the starting value: what would the ${c.yw} be for 0 ${c.many}?`,
        `The ${c.yw} goes ${k + b}, ${2 * k + b}, ${3 * k + b}: up by ${k} each time. Going back one step from ${k + b} gives ${b} for 0 ${c.many}. So the rule is ${E}.`,
        `Missing ${c.xw}: ${y4} − ${b} = ${y4 - b}, then ÷ ${k}. Missing ${c.yw}: ${k} × ${x5} + ${b}.`,
      ],
      solution: `<p>Rate: ${2 * k + b} − ${k + b} = ${k}. Starting value: ${k + b} − ${k} = ${b}. Rule: <b>${E}</b>. Missing ${c.xw}: ${y4} − ${b} = ${y4 - b}, and ${y4 - b} ÷ ${k} = <b>${x4}</b>. Missing ${c.yw}: ${k} × ${x5} + ${b} = <b>${y5}</b>.</p>`,
      feedback: {
        correct: 'Correct. Once the rule is known, the table can be completed in either direction.',
        wrong(ans, d) {
          const id = d.wrong[0];
          const v = parseNum(ans[id]);
          if (id === 'x') {
            if (v === y4 / k) return `You divided ${y4} by ${k} without subtracting the starting value ${b} first.`;
            if (v === 4) return `The columns do not have to go up by 1. Use the rule: the ${c.yw} ${y4} comes from some ${c.xw}. Undo + ${b}, then undo × ${k}.`;
            return `For the missing ${c.xw}, work backward from ${y4}: subtract ${b}, then divide by ${k}.`;
          }
          if (v === k * x5) return `You forgot the starting value ${b}. The rule is ${E}.`;
          if (v === y4 + k) return `The ${c.xw} jumps from ${x4} to ${x5}, not by 1. Substitute ${x5} into the rule instead of adding ${k} once.`;
          return `For the missing ${c.yw}, substitute ${x5} into ${E}.`;
        },
      },
    };
  });

  // ---------- Plot an equation with spaced x-values (plot) ----------
  G.define('vc_graphEquation', (r) => {
    const c = r.pick(CTX),
      k = r.int(1, 3);
    const xs = r.pick([
      [0, 2, 4, 6],
      [1, 3, 5, 7],
      [0, 3, 6],
    ]);
    // keep the largest y at or under 24 so the grid stays readable
    const b = r.int(0, Math.min(5, 24 - k * xs[xs.length - 1]));
    const E = eq(k, b, c.yv, c.xv);
    const points = xs.map((x) => [x, k * x + b]);
    const top = k * xs[xs.length - 1] + b;
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
        `Substitute each ${c.xv}-value into ${E}. The inputs skip numbers, so calculate each one; do not just add ${k}.`,
        `${c.xv} = ${xs[0]} → ${subst(k, b, xs[0])} = ${k * xs[0] + b}. ${c.xv} = ${xs[1]} → ${subst(k, b, xs[1])} = ${k * xs[1] + b}.${g.yStep > 1 ? ` The vertical axis counts by ${g.yStep}s.` : ''}`,
        `Plot ${points.map(pairText).join(', ')}.`,
      ],
      solution: `<p>${points.map((p) => `${c.xv} = ${p[0]} → ${c.yv} = ${p[1]}`).join('; ')}. The points ${points.map(pairText).join(', ')} lie on one straight line that rises ${k} for each 1 across${b ? ` and meets the vertical axis at ${b} (the starting value)` : ' and passes through the origin'}.</p>${V.graph({ xLabel: c.xLabel, yLabel: c.yLabel, xMax: 8, yMax: g.yMax, yStep: g.yStep, size: 260, series: [{ points, line: true }] })}`,
      feedback: {
        correct: 'Correct. Spaced inputs still land on the same straight line.',
        wrong(ans, d) {
          if (d.extra && d.extra.length) {
            const p = d.extra[0];
            if (points.some((q) => q[0] === p[1] && q[1] === p[0])) return `(${p[0]}, ${p[1]}) has the coordinates reversed. ${c.xv} goes across; ${c.yv} goes up.`;
            if (b && p[1] === k * p[0]) return `(${p[0]}, ${p[1]}) leaves out the + ${b}. For ${c.xv} = ${p[0]}, ${c.yv} = ${k * p[0] + b}.`;
            return `(${p[0]}, ${p[1]}) is not on this rule. For ${c.xv} = ${p[0]}, ${E} gives ${c.yv} = ${k * p[0] + b}.`;
          }
          const m = d.missing[0];
          return `You still need ${c.xv} = ${m[0]}: ${subst(k, b, m[0])} = ${m[1]}, so plot (${m[0]}, ${m[1]}).`;
        },
      },
    };
  });

  // ---------- Select all ordered pairs that are solutions (ms) ----------
  G.define('vc_msSolutions', (r) => {
    const k = r.int(2, 6),
      b = r.int(1, 8);
    const E = eq(k, b);
    const xs = r.pickN([1, 2, 3, 4, 5, 6], 3);
    const goodXs = xs.slice(0, r.int(1, 3));
    const cands = [];
    goodXs.forEach((x) => cands.push({ p: [x, k * x + b], tag: 'ok' }));
    cands.push({ p: [k * xs[0] + b, xs[0]], tag: 'swap' });
    cands.push({ p: [xs[1], k * xs[1]], tag: 'noB' });
    cands.push({ p: [xs[2], xs[2] + k + b], tag: 'add' });
    cands.push({ p: [xs[1], b * xs[1] + k], tag: 'swapKB' });
    const seen = new Set();
    const uniq = cands.filter((cd) => {
      const key = cd.p.join(',');
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
    const picked = uniq.slice(0, 5);
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
        'Watch for pairs with x and y reversed, and pairs that forgot the + ' + b + '.',
      ],
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
            return base;
          }
          if (d.missing && d.missing.length) {
            const op = sh.options[d.missing[0]];
            return `You missed (${op.p[0]}, ${op.p[1]}). Check: ${k} × ${op.p[0]} + ${b} = ${op.p[1]}, so it is a solution.`;
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
      amt: (v) => '$' + fmt(v),
      plan: (L, k, b) => `<b>Plan ${L}:</b> ${b ? `${/^(8|11|18)$/.test(String(b)) ? 'an' : 'a'} $${b} boarding fee plus` : 'no boarding fee, just'} $${k} per stop.`,
      same: 'cost the same',
    },
    {
      xw: 'number of weeks',
      one: 'week',
      many: 'weeks',
      yw: 'savings',
      amt: (v) => '$' + fmt(v),
      plan: (L, k, b) => `<b>Saver ${L}:</b> ${b ? `starts with $${b} and` : 'starts with nothing and'} saves $${k} every week.`,
      same: 'have the same savings',
    },
    {
      xw: 'number of towers',
      one: 'tower',
      many: 'towers',
      yw: 'cable length',
      amt: (v) => fmt(v) + ' meters',
      plan: (L, k, b) => `<b>Line ${L}:</b> ${b ? `${b} meter${b === 1 ? '' : 's'} at the depot plus` : 'no cable at the depot, just'} ${k} meters per tower.`,
      same: 'use the same amount of cable',
    },
  ];

  // ---------- Break-even: where two rules give the same output (num) ----------
  G.define('vc_breakEven', (r) => {
    const c = r.pick(PLANS);
    const n = r.int(3, 9);
    const dK = r.int(1, 2);
    const kA = r.int(2, 4),
      kB = kA + dK;
    const bB = r.int(0, 3),
      bA = bB + dK * n;
    const yAt = kA * n + bA;
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
        `At 0 ${c.many}, A is ${bA - bB} ahead. Each ${c.one}, B gains ${kB} − ${kA} = ${dK} on A. How many ${c.many} until the gap closes?`,
        `${bA - bB} ÷ ${dK} = ?  Check by substituting into both rules.`,
      ],
      solution: `<p>Let x be the ${c.xw} and y the ${c.yw}. A: ${eq(kA, bA)}. B: ${eq(kB, bB)}. A starts ${bA - bB} ahead, and B closes the gap by ${dK} every ${c.one}, so they are equal after ${bA - bB} ÷ ${dK} = <b>${n}</b> ${c.many}. Check: A gives ${kA} × ${n} + ${bA} = ${yAt}; B gives ${kB} × ${n}${bB ? ' + ' + bB : ''} = ${yAt}. ✓ Before ${n} ${c.many}, B is lower; after, A is lower.</p>`,
      feedback: {
        correct: 'Correct. The plan with the higher start is caught by the plan with the higher rate, and the gap divided by the rate difference tells when.',
        wrong(ans, d) {
          const v = d.value;
          if (v == null) return `Type a number of ${c.many}.`;
          if (v === bA - bB) return `${bA - bB} is the starting gap, not the answer. B gains ${dK} per ${c.one}, so divide the gap by ${dK}.`;
          if (v === yAt) return `${yAt} is the ${c.yw} when the plans are equal. The question asks for the ${c.xw} that makes them equal.`;
          const a = kA * v + bA,
            bval = kB * v + bB;
          return `At ${v} ${c.many}, A gives ${fmt(a)} and B gives ${fmt(bval)}. They are not equal yet. ${a > bval ? 'B is still catching up: try more.' : 'B has already passed A: try fewer.'}`;
        },
      },
    };
  });

  // ---------- Work backward with a decimal rate (num) ----------
  G.define('vc_backDecimal', (r) => {
    const c = r.pick(DCTX),
      n = r.pick(NAMES),
      k = r.pick(DEC_RATES),
      b = r.int(1, 6),
      x = r.int(4, 12);
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
      solution: `<p>${fmt(y)} = ${fmt(k)}${c.xv} + ${b}. Subtract ${b}: ${fmt(k)}${c.xv} = ${fmt(afterSub)}. Divide by ${fmt(k)}: ${c.xv} = ${fmt(afterSub)} ÷ ${fmt(k)} = <b>${x}</b>. Check: ${fmt(k)} × ${x} + ${b} = ${fmt(round(k * x, 2))} + ${b} = ${fmt(y)}. ✓ The ${c.xw} was ${x}.</p>`,
      feedback: {
        correct: 'Correct. A decimal rate does not change the plan: subtract the starting value, then divide by the rate.',
        wrong(ans, d) {
          const v = d.value;
          if (v == null) return `Type a number of ${c.many}.`;
          if (near(v, y / k - b)) return `You divided before subtracting. Undo the + ${b} first: ${fmt(y)} − ${b} = ${fmt(afterSub)}, then divide by ${fmt(k)}.`;
          if (near(v, afterSub)) return `${fmt(afterSub)} is ${fmt(k)} times the ${c.xw}. Divide by ${fmt(k)}.`;
          if (near(v, afterSub * k)) return `You multiplied by ${fmt(k)}. To undo multiplying, divide: ${fmt(afterSub)} ÷ ${fmt(k)}.`;
          return `Substitute your answer: ${fmt(k)} × ? + ${b} should equal ${fmt(y)}. Try ${fmt(afterSub)} ÷ ${fmt(k)}.`;
        },
      },
    };
  });

  // ---------- Order four plans by output at a given input (seq) ----------
  G.define('vc_seqMixed', (r) => {
    const c = r.pick(PLANS);
    const n = r.int(5, 8);
    const ks = r.pickN([1, 2, 3, 4, 5], 4);
    const bs = [r.int(0, 9), r.int(0, 9), r.int(0, 9), 0];
    // nudge starting values until all four outputs at n are distinct
    const out = () => ks.map((k, i) => k * n + bs[i]);
    for (let guard = 0; guard < 30; guard++) {
      const o = out();
      const dup = o.findIndex((v, i) => o.indexOf(v) !== i);
      if (dup < 0) break;
      // bump the earlier member of the tied pair (never the graph plan, which has no starting value)
      bs[o.indexOf(o[dup])] += 1;
    }
    const totals = out();
    const g = grid(ks[3] * 4);
    const tableXs = [2, 4];
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
        `Plan B: the table rises ${ks[1] * 2} between ${tableXs[0]} and ${tableXs[1]} ${c.many}, so the rate is ${ks[1]} and the start is ${bs[1]}. Plan D: the point above 1 is at ${ks[3]}, with no starting value.`,
        `At ${n} ${c.many}: A = ${totals[0]}, B = ${totals[1]}, C = ${totals[2]}, D = ${totals[3]}. Order from lowest.`,
      ],
      solution: `<p>Rules: A is ${eq(ks[0], bs[0])}; B is ${eq(ks[1], bs[1])}; C is ${eq(ks[2], bs[2])}; D is ${eq(ks[3], 0)}. At ${n} ${c.many}: A = ${totals[0]}, B = ${totals[1]}, C = ${totals[2]}, D = ${totals[3]}. Lowest to highest: <b>${order.map((i) => letters[i]).join(', ')}</b>. The order at a different ${c.xw} could be different, because the plans have different rates.</p>`,
      feedback: {
        correct: 'Correct. To compare plans at one input, find every rule and substitute the same input into each.',
        wrong() {
          return `Substitute ${n} into every plan's rule. The plan with the biggest rate is not always the highest after ${n} ${c.many}; the starting values matter too.`;
        },
      },
    };
  });

  // ---------- Error: worked backward in the wrong order (error) ----------
  G.define('vc_errorTwoStep', (r) => {
    const c = r.pick(CTX),
      n = r.pick(NAMES),
      k = r.int(2, 6),
      b = r.int(1, 8),
      x = r.int(4, 12);
    const y = k * x + b;
    const E = eq(k, b, c.yv, c.xv);
    const wrongDiv = round(y / k, 2);
    const wrongFinal = round(wrongDiv - b, 2);
    const sh = shuffleOptions(
      r,
      [
        { html: `${n} divided before subtracting. The equation added ${b} last, so the first undo step is to subtract ${b}: ${y} − ${b} = ${y - b}, then ${y - b} ÷ ${k}.`, ok: true },
        {
          html: `${n} should have multiplied ${y} by ${k} instead of dividing.`,
          why: `The equation multiplies by ${k}, so undoing it means dividing. The division is fine; it happened at the wrong time.`,
        },
        { html: `${n} should have added ${b} instead of subtracting.`, why: `The equation adds ${b}, so undoing it means subtracting. Subtracting is right; the order is wrong.` },
        { html: `${n} forgot to subtract the starting value.`, why: `${n} did subtract ${b}, in the second line. The problem is doing it after the division instead of before.` },
      ],
      0,
    );
    return {
      type: 'error',
      skill: 'backward',
      lesson: 'Challenge',
      title: 'Find the mistake in the backward work',
      prompt: `<p>The equation ${hl(E)} gives the ${c.yw} (${c.yv}) for the ${c.xw} (${c.xv}). ${n} tried to find the ${c.xw} when the ${c.yw} was ${yWord(c, y)}.</p><p>Which statement describes the mistake? Then give the correct ${c.xw}.</p>`,
      work: `<p>${n}'s work:</p><p>${y} ÷ ${k} = ${fmt(wrongDiv)}</p><p>${fmt(wrongDiv)} − ${b} = ${fmt(wrongFinal)}</p><p>${c.xv} = ${fmt(wrongFinal)}</p>`,
      options: sh.options,
      answer: sh.answer,
      fix: { label: `Correct ${c.xw}: `, answer: x },
      hints: [
        `Check ${n}'s answer by substituting it: does ${k} × ${fmt(wrongFinal)} + ${b} equal ${y}? If not, look at the order of the undo steps.`,
        `The equation does × ${k} first and + ${b} second. To undo, reverse the order: deal with the + ${b} first.`,
        `${y} − ${b} = ${y - b}. Then ${y - b} ÷ ${k}.`,
      ],
      solution: `<p>${n} undid the steps in the wrong order. The equation multiplies by ${k} and then adds ${b}, so undoing starts with the addition: ${y} − ${b} = ${y - b}, then ${y - b} ÷ ${k} = <b>${x}</b>. Check: ${subst(k, b, x)} = ${y}. ✓ ${n}'s answer fails the check: ${k} × ${fmt(wrongFinal)} + ${b} = ${fmt(round(k * wrongFinal + b, 2))}, not ${y}.</p>`,
      feedback: {
        correct: 'Correct. Reverse the order when you undo, and always substitute back to check.',
        wrong(ans, d) {
          if (!d.mistakeOk) return (sh.options[ans.mistake] && sh.options[ans.mistake].why) || `Substitute ${n}'s answer back into ${E}. It does not give ${y}, so look at the order of the steps.`;
          const v = parseNum(ans.fix);
          if (v === y - b) return `Mistake found. ${y - b} is ${k} times the ${c.xw}; divide by ${k} to finish.`;
          return `Mistake found. For the fix: ${y} − ${b} = ${y - b}, then ${y - b} ÷ ${k}.`;
        },
      },
    };
  });
})(typeof window !== 'undefined' ? window : globalThis);
