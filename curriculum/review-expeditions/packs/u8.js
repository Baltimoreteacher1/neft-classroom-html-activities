/* js/units/u8/gen-solutions.js */
/* Zone 1 — Hall of Balance. Lesson 8-1 Understand Equations and Their Solutions. */
(function (root) {
  'use strict';
  const RX = root.RX;
  const { G, V, shuffleOptions, NAMES, money, round } = RX;
  const hl = V.hl;
  const VARS = ['x', 'n', 'm', 'y', 'k', 't'];

  /** Build a one-step equation {text, lhs(v), a, b, sol, op, kind} with whole-number solution. */
  function makeEq(r, v, kinds) {
    const kind = r.pick(kinds || ['add', 'sub', 'mul', 'div']);
    let a, sol, b;
    if (kind === 'add') {
      a = r.int(2, 15);
      sol = r.int(1, 20);
      b = sol + a;
    } else if (kind === 'sub') {
      a = r.int(2, 15);
      sol = r.int(a + 1, a + 20);
      b = sol - a;
    } else if (kind === 'mul') {
      a = r.int(2, 9);
      sol = r.int(2, 12);
      b = a * sol;
    } else {
      a = r.int(2, 9);
      sol = a * r.int(2, 12);
      b = sol / a;
    }
    const text = kind === 'add' ? `${v} + ${a} = ${b}` : kind === 'sub' ? `${v} − ${a} = ${b}` : kind === 'mul' ? `${a}${v} = ${b}` : `${v} ÷ ${a} = ${b}`;
    const lhs = (t) => (kind === 'add' ? t + a : kind === 'sub' ? t - a : kind === 'mul' ? a * t : t / a);
    const lhsStr = (t) => (kind === 'add' ? `${t} + ${a}` : kind === 'sub' ? `${t} − ${a}` : kind === 'mul' ? `${a} × ${t}` : `${t} ÷ ${a}`);
    const opName = kind === 'add' ? 'add' : kind === 'sub' ? 'subtract' : kind === 'mul' ? 'multiply by' : 'divide by';
    return { kind, a, b, sol, text, lhs, lhsStr, opName };
  }

  // ---------- Is the value a solution? (tf) ----------
  G.define('q1_isSolutionTf', (r) => {
    const v = r.pick(VARS);
    const e = makeEq(r, v);
    const isSol = r.chance(0.5);
    let test = e.sol;
    if (!isSol) {
      const alts = [e.b, e.sol + r.int(1, 3), Math.max(1, e.sol - r.int(1, 3))].filter((t) => t !== e.sol && t > 0);
      test = r.pick(alts);
    }
    const got = round(e.lhs(test), 2);
    const reasons = r.shuffle([
      { html: `${isSol ? 'Yes' : 'No'}. Substitute ${test} for ${v}: ${e.lhsStr(test)} = ${got}, which ${isSol ? 'equals' : 'is not'} ${e.b}.`, correct: true },
      { html: `${isSol ? 'No' : 'Yes'}. You can tell without substituting: ${test} is ${test < e.b ? 'smaller' : test > e.b ? 'bigger' : 'the same as'} ${e.b}.`, correct: false },
      { html: `${isSol ? 'No' : 'Yes'}. The solution has to be ${e.b}, because ${e.b} is the number alone on one side.`, correct: false },
    ]);
    return {
      type: 'tf',
      skill: 'solution-test',
      lesson: '8-1',
      title: 'Is it a solution?',
      prompt: `<p>A lock in the Hall reads ${hl(e.text)}.</p><p>Is ${hl(v + ' = ' + test)} a solution of the equation?</p>`,
      answer: isSol,
      reasons,
      labels: ['Yes, a solution', 'No, not a solution'],
      hints: [
        `A solution makes the equation true. To test a value, substitute it for ${v} and see if both sides match.`,
        `Replace ${v} with ${test}: the left side becomes ${e.lhsStr(test)}.`,
        `${e.lhsStr(test)} = ${got}. Compare ${got} with ${e.b}.`,
      ],
      solution: `<p>Substitute ${test} for ${v}: ${e.lhsStr(test)} = ${got}. The right side is ${e.b}. ${isSol ? `${got} = ${e.b}, so the equation is true and <b>${v} = ${test} is a solution</b>.` : `${got} ≠ ${e.b}, so the equation is false and <b>${v} = ${test} is not a solution</b>. The solution is ${v} = ${e.sol}.`}</p>`,
      feedback: {
        correct: `Correct. Substituting ${test} gives ${got} on the left, and ${isSol ? 'that matches' : 'that does not match'} ${e.b} on the right.`,
        wrong(ans, d) {
          if (!d.valueOk) return `Do not guess from the size of the numbers. Substitute: ${e.lhsStr(test)} = ${got}. Is that equal to ${e.b}?`;
          return `Your yes/no is right, but the reason must come from substituting ${test} and comparing both sides.`;
        },
      },
    };
  });

  // ---------- Select the solution from a set (ms) ----------
  G.define('q1_pickSolution', (r, o) => {
    const v = r.pick(VARS);
    const hard = !!o.hard;
    let e;
    if (hard) {
      const kind = r.pick(['add', 'sub', 'mul']);
      const a = kind === 'mul' ? r.int(2, 5) : r.int(2, 9) + 0.5,
        sol = kind === 'mul' ? r.int(2, 9) + 0.5 : r.int(3, 20);
      const b = round(kind === 'add' ? sol + a : kind === 'sub' ? sol - a : sol * a, 2);
      const lhs = (t) => (kind === 'add' ? t + a : kind === 'sub' ? t - a : a * t);
      const lhsStr = (t) => (kind === 'add' ? `${t} + ${a}` : kind === 'sub' ? `${t} − ${a}` : `${a} × ${t}`);
      e = { kind, a, b, sol, text: kind === 'add' ? `${v} + ${a} = ${b}` : kind === 'sub' ? `${v} − ${a} = ${b}` : `${a}${v} = ${b}`, lhs, lhsStr };
    } else e = makeEq(r, v);
    const wrongPool = [];
    const push = (val, why) => {
      if (val > 0 && val !== e.sol && !wrongPool.some((w) => w.val === val)) wrongPool.push({ val: round(val, 2), why });
    };
    if (e.kind === 'add') {
      push(e.b + e.a, `That is ${e.b} + ${e.a}. Check it: ${e.lhsStr(round(e.b + e.a, 2))} = ${round(e.b + 2 * e.a, 2)}, not ${e.b}.`);
      push(e.b, `${e.b} is the right side of the equation, not the solution. ${e.lhsStr(e.b)} = ${round(e.lhs(e.b), 2)}.`);
    }
    if (e.kind === 'sub') {
      push(e.b - e.a, `That is ${e.b} − ${e.a}. Check it: ${e.lhsStr(round(e.b - e.a, 2))} = ${round(e.b - 2 * e.a, 2)}, not ${e.b}.`);
      push(e.b, `${e.b} is the right side, not the solution. ${e.lhsStr(e.b)} = ${round(e.lhs(e.b), 2)}.`);
    }
    if (e.kind === 'mul') {
      push(round(e.b * e.a, 2), `That is ${e.b} × ${e.a}. Check it: ${e.lhsStr(round(e.b * e.a, 2))} is much bigger than ${e.b}.`);
      push(e.b - e.a, `That is ${e.b} − ${e.a}. Subtracting does not undo multiplying. ${e.lhsStr(round(e.b - e.a, 2))} = ${round(e.lhs(e.b - e.a), 2)}.`);
    }
    if (e.kind === 'div') {
      push(e.b / e.a, `That is ${e.b} ÷ ${e.a}. Check it: ${e.lhsStr(round(e.b / e.a, 2))} = ${round(e.lhs(e.b / e.a), 2)}, not ${e.b}.`);
      push(e.b + e.a, `That is ${e.b} + ${e.a}. Adding does not undo dividing. ${e.lhsStr(e.b + e.a)} = ${round(e.lhs(e.b + e.a), 2)}.`);
    }
    push(e.sol + 1, `Check it: ${e.lhsStr(round(e.sol + 1, 2))} = ${round(e.lhs(e.sol + 1), 2)}, which is not ${e.b}.`);
    push(e.sol - 1, `Check it: ${e.lhsStr(round(e.sol - 1, 2))} = ${round(e.lhs(e.sol - 1), 2)}, which is not ${e.b}.`);
    push(e.sol + 2, `Check it: ${e.lhsStr(round(e.sol + 2, 2))} = ${round(e.lhs(e.sol + 2), 2)}, which is not ${e.b}.`);
    const wrongs = wrongPool.slice(0, 4);
    const opts = [{ html: String(e.sol), ok: true }].concat(wrongs.map((w) => ({ html: String(w.val), why: w.why })));
    const sh = shuffleOptions(r, opts, [0]);
    const setText = sh.options.map((x) => x.html).join(', ');
    return {
      type: 'ms',
      skill: 'solution-test',
      lesson: '8-1',
      title: hard ? 'Find the solution (decimals)' : 'Find the solution in the set',
      prompt: `<p>Which value from the set {${setText}} is the solution of ${hl(e.text)}?</p><p class="muted">Select every value that makes the equation true.</p>`,
      options: sh.options,
      answers: sh.answers,
      hints: [
        `Substitute each value for ${v}. The solution is the one that makes both sides equal.`,
        `Try the first value: ${e.lhsStr(sh.options[0].html)} = ${round(e.lhs(Number(sh.options[0].html)), 2)}. Does it equal ${e.b}?`,
        `Keep testing. The value that gives exactly ${e.b} is the solution. Only one value in this set works.`,
      ],
      solution: `<p>Test each value. ${e.lhsStr(e.sol)} = ${e.b}, so <b>${v} = ${e.sol}</b> is the solution. ${wrongs
        .slice(0, 2)
        .map((w) => `${e.lhsStr(w.val)} = ${round(e.lhs(w.val), 2)}`)
        .join(' and ')}, so those values do not work.</p>`,
      feedback: {
        correct: `Correct. Only ${e.sol} makes ${e.text} true.`,
        wrong(ans, d) {
          if (d.extra && d.extra.length) return sh.options[d.extra[0]].why || `${sh.options[d.extra[0]].html} does not make the equation true. Substitute and check.`;
          return `You missed the solution. Substitute each value for ${v} until the left side equals ${e.b}.`;
        },
      },
    };
  });

  // ---------- Substitute and decide (cloze) ----------
  G.define('q1_substituteCloze', (r) => {
    const v = r.pick(VARS);
    const e = makeEq(r, v, ['add', 'sub', 'mul']);
    const isSol = r.chance(0.5);
    const test = isSol ? e.sol : r.pick([e.sol + 1, e.sol + 2, e.sol - 1].filter((t) => t > 0));
    const got = e.lhs(test);
    const alts = [got, got + (e.kind === 'mul' ? e.a : 1), got - 1, e.b].filter((x, i, arr) => arr.indexOf(x) === i && x > 0).slice(0, 3);
    const c0 = r.shuffle(alts.map(String));
    return {
      type: 'cloze',
      skill: 'solution-test',
      lesson: '8-1',
      title: 'Substitute to check',
      prompt: `<p>Equation: ${hl(e.text)}. Test whether ${hl(v + ' = ' + test)} is a solution. Complete the check.</p>`,
      template: `Substitute ${test} for ${v}: ${e.lhsStr(test)} = {0}. The right side is ${e.b}. The two sides are {1}, so ${v} = ${test} {2} a solution.`,
      choices: [c0, ['equal', 'not equal'], ['is', 'is not']],
      answers: [c0.indexOf(String(got)), isSol ? 0 : 1, isSol ? 0 : 1],
      hints: [
        `Substituting means replacing the variable with the number. Compute the left side with ${test} in place of ${v}.`,
        `${e.lhsStr(test)} = ${got}. Now compare it to the right side, ${e.b}.`,
        isSol ? `${got} and ${e.b} are the same, so the equation is true.` : `${got} and ${e.b} are different, so the equation is false.`,
      ],
      solution: `<p>${e.lhsStr(test)} = <b>${got}</b>. The right side is ${e.b}. The sides are <b>${isSol ? 'equal' : 'not equal'}</b>, so ${v} = ${test} <b>${isSol ? 'is' : 'is not'}</b> a solution.</p>`,
      feedback: {
        correct: `Correct. Substitute, compute, compare: ${got} ${isSol ? '=' : '≠'} ${e.b}.`,
        wrong(ans, d) {
          if (d.wrong.includes(0)) return `Recompute the left side: ${e.lhsStr(test)}.`;
          if (d.wrong.includes(1)) return `Compare the two numbers: is ${got} the same as ${e.b}?`;
          return `If the two sides are equal, the value is a solution. If they are not equal, it is not.`;
        },
      },
    };
  });

  // ---------- Pan balance to equation (mc) ----------
  G.define('q1_balanceEquation', (r) => {
    const v = r.pick(VARS);
    const a = r.int(2, 9),
      sol = r.int(2, 12),
      b = a + sol;
    const varLeft = r.chance(0.6);
    const left = varLeft ? [v, String(a)] : [String(b)];
    const right = varLeft ? [String(b)] : [v, String(a)];
    const correct = varLeft ? `${v} + ${a} = ${b}` : `${b} = ${v} + ${a}`;
    const opts = [
      { html: correct, ok: true },
      { html: varLeft ? `${v} − ${a} = ${b}` : `${b} = ${v} − ${a}`, why: `The ${v} block and the ${a} block sit together on the same pan. Weights on one pan are added, not subtracted.` },
      { html: varLeft ? `${a}${v} = ${b}` : `${b} = ${a}${v}`, why: `${a}${v} means ${a} copies of ${v}. The pan holds one ${v} block and one ${a} block, so they are added: ${v} + ${a}.` },
      { html: varLeft ? `${v} + ${b} = ${a}` : `${a} = ${v} + ${b}`, why: `The ${b} block is alone on its pan. The ${a} block shares a pan with ${v}, so ${a} is added to ${v}.` },
    ];
    const sh = shuffleOptions(r, opts, 0);
    return {
      type: 'mc',
      skill: 'write-equation',
      lesson: '8-1',
      title: 'Read the balance',
      prompt: `<p>The scale is balanced. One pan holds a block labeled ${hl(v)} and a block labeled ${hl(a)}. The other pan holds a block labeled ${hl(b)}.</p>${V.balance({ left, right, aria: `Balanced scale: ${left.join(' and ')} on the left, ${right.join(' and ')} on the right` })}<p>Which equation does the balance show?</p>`,
      options: sh.options,
      answer: sh.answer,
      hints: [
        'A balanced scale is an equation. Each pan is one side of the equals sign.',
        `Blocks on the same pan are added together. One pan has ${v} and ${a}, so that side is ${v} + ${a}.`,
        `The other pan has only ${b}. Set the two sides equal.`,
      ],
      solution: `<p>Each pan is one side of the equation. The pan with ${v} and ${a} is ${v} + ${a}. The other pan is ${b}. The scale is balanced, so <b>${correct}</b>. (The solution is ${v} = ${sol}, because ${sol} + ${a} = ${b}.)</p>`,
      feedback: { correct: `Correct. Blocks on one pan add together, and a balanced scale means the two sides are equal.` },
    };
  });

  // ---------- Write an equation for a situation (mc) ----------
  G.define('q1_writeEquation', (r, o) => {
    const name = r.pick(NAMES);
    const hard = !!o.hard;
    const d = (lo, hi) => (hard ? round(r.int(lo * 4, hi * 4) / 4, 2) : r.int(lo, hi));
    const m$ = (x) => (hard ? money(x) : '$' + x);
    const V1 = r.pick(['m', 'd', 'x']);
    const situations = [
      () => {
        const a = d(5, 30),
          b = d(5, 40);
        return {
          text: `${name} had some money. ${name} spent ${m$(a)} and has ${m$(b)} left.`,
          varDef: `${V1} = the money ${name} started with`,
          ok: `${V1} − ${a} = ${b}`,
          wrongs: [
            [`${a} − ${V1} = ${b}`, `This says ${a} minus the starting amount. ${name} started with ${V1} and the ${m$(a)} was taken from it, so ${V1} comes first: ${V1} − ${a}.`],
            [`${V1} + ${a} = ${b}`, `Spending money takes it away. The starting amount minus ${a} equals what is left, so the operation is subtraction.`],
            [`${b} − ${V1} = ${a}`, `This says the money left minus the starting amount. The starting amount ${V1} is the biggest number here, so it must come first.`],
          ],
        };
      },
      () => {
        const a = d(3, 25),
          b = d(20, 60);
        return {
          text: `${name} saved some money last month. This month ${name} saved ${m$(a)} more, for a total of ${m$(b)}.`,
          varDef: `${V1} = the money saved last month`,
          ok: `${V1} + ${a} = ${b}`,
          wrongs: [
            [`${V1} − ${a} = ${b}`, `Saving more adds to the total. The operation should be addition, not subtraction.`],
            [`${a} − ${V1} = ${b}`, `${b} is the total of both months. The two amounts are added to make ${b}.`],
            [`${V1} + ${b} = ${a}`, `${b} is the total, so it belongs alone on one side. The two parts, ${V1} and ${a}, add to ${b}.`],
          ],
        };
      },
      () => {
        const c = hard ? round(r.int(5, 12) + 0.5, 2) : r.int(3, 12),
          t = r.int(3, 9),
          T = round(c * t, 2);
        return {
          text: `Tickets to the sky-lift cost ${m$(c)} each. ${name} paid ${m$(T)} for some tickets.`,
          varDef: `${V1} = the number of tickets`,
          ok: `${c}${V1} = ${T}`,
          wrongs: [
            [`${V1} + ${c} = ${T}`, `Each ticket costs ${c}, so the cost is ${c} times the number of tickets, not ${c} plus the number.`],
            [`${V1} ÷ ${c} = ${T}`, `The total is found by multiplying the price by the number of tickets. Dividing the number of tickets by the price does not give the total paid.`],
            [`${T}${V1} = ${c}`, `${T} is the total paid. The price per ticket, ${c}, is multiplied by the number of tickets ${V1}.`],
          ],
        };
      },
      () => {
        const n = r.int(3, 8),
          s = r.int(4, 12),
          T = n * s;
        return {
          text: `${name} shared ${T} stickers equally among ${n} friends. Each friend got the same number of stickers.`,
          varDef: `${V1} = the number of stickers each friend got`,
          ok: `${n}${V1} = ${T}`,
          wrongs: [
            [`${V1} ÷ ${n} = ${T}`, `${T} is the total. ${n} friends each getting ${V1} stickers makes ${n} × ${V1} = ${T}, not ${V1} ÷ ${n}.`],
            [`${V1} + ${n} = ${T}`, `Equal groups mean multiplication. ${n} friends with ${V1} stickers each is ${n} × ${V1}.`],
            [`${V1} − ${n} = ${T}`, `Nothing is being taken away. ${n} equal groups of ${V1} make the total ${T}.`],
          ],
        };
      },
      () => {
        const a = d(2, 12),
          b = d(10, 30);
        return {
          text: `${name} biked some miles before lunch and ${a} miles after lunch. ${name} biked ${b} miles in all.`,
          varDef: `${V1} = miles biked before lunch`,
          ok: `${V1} + ${a} = ${b}`,
          wrongs: [
            [`${V1} − ${a} = ${b}`, `"In all" means the two distances are added. Subtracting ${a} would make the total smaller.`],
            [`${a}${V1} = ${b}`, `${a}${V1} means ${a} times the morning distance. The two distances are added, not multiplied.`],
            [`${b} + ${a} = ${V1}`, `${b} is the total. It should be alone on one side, with the two parts added on the other.`],
          ],
        };
      },
      () => {
        const k = r.int(3, 9),
          b = k * r.int(2, 12);
        return {
          text: `${k} times a number is ${b}.`,
          varDef: `${V1} = the number`,
          ok: `${k}${V1} = ${b}`,
          wrongs: [
            [`${V1} + ${k} = ${b}`, `"Times" means multiplication. ${k} times a number is ${k}${V1}, not ${V1} + ${k}.`],
            [`${V1} ÷ ${k} = ${b}`, `"${k} times a number" is multiplication. ${V1} ÷ ${k} would be "a number divided by ${k}".`],
            [`${k} + ${V1} = ${b}`, `"Times" is multiplication, not addition.`],
          ],
        };
      },
    ];
    const s = r.pick(situations)();
    const opts = [{ html: s.ok, ok: true }].concat(s.wrongs.map(([h, why]) => ({ html: h, why })));
    const sh = shuffleOptions(r, opts, 0);
    return {
      type: 'mc',
      skill: 'write-equation',
      lesson: '8-1',
      title: 'Write the equation',
      prompt: `<p>${s.text}</p><p>Let ${hl(s.varDef)}. Which equation represents the situation?</p>`,
      options: sh.options,
      answer: sh.answer,
      hints: [
        'Find the unknown (that is the variable), the operation the story describes, and the result.',
        `Ask: is something being added, taken away, or made into equal groups? Then ask which number is the total or result.`,
        `Put the numbers in the order the story happens. The result goes after the equals sign.`,
      ],
      solution: `<p>${s.varDef}. The story describes ${/−/.test(s.ok) ? 'something being taken away, so subtract' : /\+/.test(s.ok) ? 'two amounts being combined, so add' : 'equal groups, so multiply'}. The equation is <b>${s.ok}</b>.</p>`,
      feedback: { correct: `Correct. ${s.ok} matches the story: the variable is the unknown, and the operation matches what happened.` },
    };
  });

  // ---------- Match phrases to equations (match) ----------
  G.define('q1_matchSituations', (r) => {
    const v = r.pick(VARS);
    const a = r.int(2, 9),
      b = r.int(a + 1, 30);
    const phr = {
      add: r.pick([`${a} more than a number is ${b}`, `The sum of a number and ${a} is ${b}`, `A number increased by ${a} is ${b}`]),
      sub: r.pick([`${a} less than a number is ${b}`, `A number decreased by ${a} is ${b}`, `The difference of a number and ${a} is ${b}`]),
      mul: r.pick([`${a} times a number is ${b}`, `The product of ${a} and a number is ${b}`]),
      div: r.pick([`A number divided by ${a} is ${b}`, `The quotient of a number and ${a} is ${b}`]),
    };
    const eqs = { add: `${v} + ${a} = ${b}`, sub: `${v} − ${a} = ${b}`, mul: `${a}${v} = ${b}`, div: `${v} ÷ ${a} = ${b}` };
    const order = r.shuffle(['add', 'sub', 'mul', 'div']);
    const rightOrder = r.shuffle(['add', 'sub', 'mul', 'div']);
    const left = order.map((k) => phr[k]);
    const right = rightOrder.map((k) => eqs[k]);
    const pairs = order.map((k, i) => [i, rightOrder.indexOf(k)]);
    return {
      type: 'match',
      skill: 'write-equation',
      lesson: '8-1',
      title: 'Match words to equations',
      prompt: `<p>Match each sentence to its equation. The variable ${hl(v)} stands for "a number."</p>`,
      left,
      right,
      pairs,
      hints: [
        '"More than" and "sum" mean add. "Less than," "decreased by," and "difference" mean subtract.',
        '"Times" and "product" mean multiply. "Divided by" and "quotient" mean divide.',
        `"${phr.sub}" means ${v} − ${a} = ${b}: the ${a} is taken away from the number.`,
      ],
      solution: `<p>${phr.add} → ${eqs.add}. ${phr.sub} → ${eqs.sub}. ${phr.mul} → ${eqs.mul}. ${phr.div} → ${eqs.div}.</p>`,
      feedback: {
        correct: 'Correct. The key words tell you the operation, and "is" marks the equals sign.',
        wrong() {
          return `Look at the key word in each sentence: sum or more than → +, less than or decreased by → −, times or product → ×, divided by or quotient → ÷.`;
        },
      },
    };
  });

  // ---------- Error: equation written backwards (error) ----------
  G.define('q1_errorWrite', (r) => {
    const name = r.pick(NAMES);
    const ctx = r.pick([
      { have: 'money', unit: '$', verb: 'spent', left: 'left' },
      { have: 'stickers', unit: '', verb: 'gave away', left: 'left' },
      { have: 'minutes of screen time', unit: '', verb: 'used', left: 'left' },
      { have: 'trading cards', unit: '', verb: 'traded away', left: 'left' },
    ]);
    const a = r.int(6, 25),
      b = r.int(8, 40),
      start = a + b;
    const v = r.pick(['m', 'c', 's']);
    const u = (x) => (ctx.unit ? ctx.unit + x : String(x));
    const opts = [
      { html: `${name} wrote the numbers in the wrong order. ${name} started with ${v}, then ${ctx.verb} ${u(a)}, so the equation should be ${v} − ${a} = ${b}.`, ok: true },
      {
        html: `${name} should have used addition: ${v} + ${a} = ${b}.`,
        why: `${name} ${ctx.verb} ${u(a)}, which takes away from the starting amount. The operation is subtraction, but the order must be fixed: ${v} − ${a}.`,
      },
      {
        html: `${name} should have written ${v} − ${b} = ${a}.`,
        why: `This equation has the same solution, but it does not tell the story. The story says the starting amount minus the ${u(a)} ${ctx.verb} equals the ${u(b)} left.`,
      },
      {
        html: `The equation is correct. Subtraction can be written in either order.`,
        why: `Subtraction is not commutative: ${a} − ${v} and ${v} − ${a} are different. ${a} − ${v} = ${b} would mean a number was taken away from ${a}.`,
      },
    ];
    const sh = shuffleOptions(r, opts, 0);
    return {
      type: 'error',
      skill: 'write-equation',
      lesson: '8-1',
      title: 'Find the mistake',
      prompt: `<p>${name} had some ${ctx.have}, ${ctx.verb} ${hl(u(a))}, and has ${hl(u(b))} ${ctx.left}. ${name} let ${v} stand for the starting amount and wrote this equation.</p><p>What is wrong with ${name}'s equation?</p>`,
      work: `${a} − ${v} = ${b}`,
      options: sh.options,
      answer: sh.answer,
      fix: { label: `Correct equation: ${v} − ${a} = ${b}. Solve it: ${v} = `, answer: start },
      hints: [
        `Read the story in order: start with ${v}, then take away ${a}, and ${b} is left. Which number is subtracted from which?`,
        `${a} − ${v} says "${a} take away the starting amount." That is backwards. The starting amount comes first.`,
        `${v} − ${a} = ${b}. To find ${v}, add ${a} back: ${b} + ${a}.`,
      ],
      solution: `<p>The order is wrong. ${name} started with ${v} and ${ctx.verb} ${a}, so the equation is <b>${v} − ${a} = ${b}</b>. Subtraction order matters: ${a} − ${v} is not the same as ${v} − ${a}. Solving: ${v} = ${b} + ${a} = <b>${start}</b>. Check: ${start} − ${a} = ${b}. ✓</p>`,
      feedback: {
        correct: `Correct. In subtraction the order matters. The starting amount is written first, and the solution is ${start}.`,
        wrong(ans, d) {
          if (!d.mistakeOk) return (sh.options[ans.mistake] && sh.options[ans.mistake].why) || 'Read the story in order: start, then take away, then what is left.';
          const f = RX.parseNum(ans.fix);
          if (f === b - a || f === a - b) return `You found the mistake. For the fix: ${v} − ${a} = ${b} means ${v} is bigger than ${b}. Add ${a} to ${b}.`;
          return `You found the mistake. To solve ${v} − ${a} = ${b}, undo the subtraction: ${b} + ${a}.`;
        },
      },
    };
  });

  // ---------- Sort equations by whether a value is a solution (sort) ----------
  G.define('q1_sortSolutions', (r) => {
    const v = r.pick(VARS);
    const s = r.int(3, 12);
    const a1 = r.int(2, 9),
      a2 = r.int(1, s - 1),
      k = r.int(2, 6),
      c = r.int(2, 9);
    const yes = [`${v} + ${a1} = ${s + a1}`, `${v} − ${a2} = ${s - a2}`, `${k}${v} = ${k * s}`, `${s * c} ÷ ${v} = ${c}`];
    const no = [`${v} + ${a1} = ${s + a1 + r.pick([1, 2])}`, `${v} − ${a2} = ${s}`, `${k}${v} = ${k * s + k}`, `${v} + ${s} = ${s}`];
    const items = r.shuffle(
      r
        .pickN(yes, 3)
        .map((h) => ({ html: h, bin: 0 }))
        .concat(r.pickN(no, 3).map((h) => ({ html: h, bin: 1 }))),
    );
    return {
      type: 'sort',
      skill: 'solution-test',
      lesson: '8-1',
      title: 'Which equations does the value solve?',
      prompt: `<p>Sort each equation. Is ${hl(v + ' = ' + s)} a solution, or not?</p><p class="muted">Substitute ${s} for ${v} in each equation and check whether it is true.</p>`,
      bins: [`${v} = ${s} IS a solution`, `${v} = ${s} is NOT a solution`],
      items,
      hints: [
        `Replace ${v} with ${s} in each equation. If both sides come out equal, ${s} is a solution.`,
        `For example, in ${yes[0]}: ${s} + ${a1} = ${s + a1}. True, so it goes in the "is a solution" bin.`,
        `Watch for equations that are almost true, like ${no[1]}: ${s} − ${a2} = ${s - a2}, not ${s}.`,
      ],
      solution: `<p>Substitute ${s} for ${v}. True equations: ${items
        .filter((i) => i.bin === 0)
        .map((i) => i.html)
        .join(', ')}. False equations: ${items
        .filter((i) => i.bin === 1)
        .map((i) => i.html)
        .join(', ')}.</p>`,
      feedback: {
        correct: `Correct. A value is a solution only when substituting it makes both sides equal.`,
        wrong(ans, d) {
          const i = d.wrong[0];
          return i != null ? `Check ${items[i].html} again. Replace ${v} with ${s} and compute the left side.` : `Substitute ${s} into each equation and compare the two sides.`;
        },
      },
    };
  });
})(typeof window !== 'undefined' ? window : globalThis);

/* js/units/u8/gen-addsub.js */
/* Zone 2 — Counterweight Yard. Lesson 8-2 Write and Solve Equations Using Addition or Subtraction. */
(function (root) {
  'use strict';
  const RX = root.RX;
  const { G, V, shuffleOptions, NAMES, money, round, parseNum } = RX;
  const hl = V.hl;
  const VARS = ['x', 'n', 'm', 'w', 'c', 'p'];
  const num = (x) => (Number.isInteger(x) ? String(x) : String(round(x, 2)));

  // ---------- Pan balance: solve x + a = b (num) ----------
  G.define('q2_balanceSolve', (r, o) => {
    const v = r.pick(VARS);
    const hard = !!o.hard;
    const a = hard ? round(r.int(5, 40) / 2, 1) : r.int(2, 9);
    const sol = hard ? round(r.int(10, 60) / 2, 1) : r.int(3, 15);
    const b = round(a + sol, 2);
    const varLeft = r.chance(0.6);
    const left = varLeft ? [v, num(a)] : [num(b)];
    const right = varLeft ? [num(b)] : [v, num(a)];
    const eq = varLeft ? `${v} + ${num(a)} = ${num(b)}` : `${num(b)} = ${v} + ${num(a)}`;
    return {
      type: 'num',
      skill: 'balance-model',
      lesson: '8-2',
      title: hard ? 'Balance the scale (decimals)' : 'Balance the scale',
      prompt: `<p>The scale is balanced. One pan holds a crate labeled ${hl(v)} and a weight of ${hl(num(a))}. The other pan holds a weight of ${hl(num(b))}.</p>${V.balance({ left, right, aria: `Balanced scale showing ${eq}` })}<p>The scale shows ${hl(eq)}. What is the value of ${v}?</p>`,
      answer: sol,
      tolerance: 0.001,
      hints: [
        `To find ${v} alone, remove the ${num(a)} weight from its pan. To keep the scale balanced, remove ${num(a)} from the other pan too.`,
        `Removing a weight means subtracting: ${v} + ${num(a)} − ${num(a)} = ${num(b)} − ${num(a)}.`,
        `${num(b)} − ${num(a)} is the value of ${v}.`,
      ],
      solution: `<p>Subtract ${num(a)} from both sides so the scale stays balanced: ${v} + ${num(a)} − ${num(a)} = ${num(b)} − ${num(a)}, so <b>${v} = ${num(sol)}</b>. Check: ${num(sol)} + ${num(a)} = ${num(b)}. ✓</p>`,
      feedback: {
        correct: `Correct. Taking ${num(a)} off both pans leaves ${v} = ${num(sol)}.`,
        wrong(ans, d) {
          if (d.value != null && Math.abs(d.value - (b + a)) < 0.001)
            return `You added ${num(a)}. The ${num(a)} weight is already with ${v}. To leave ${v} alone, take ${num(a)} off both pans: subtract.`;
          if (d.value != null && Math.abs(d.value - b) < 0.001) return `${num(b)} is the whole pan, not the crate. The crate plus ${num(a)} makes ${num(b)}, so the crate is less than ${num(b)}.`;
          return `Undo "+ ${num(a)}" by subtracting ${num(a)} from both sides.`;
        },
      },
    };
  });

  // ---------- Addition equation with the inverse step (blanks) ----------
  G.define('q2_addInverse', (r, o) => {
    const v = r.pick(VARS);
    const hard = !!o.hard;
    const a = hard ? round(r.int(8, 60) / 4, 2) : r.int(3, 30);
    const sol = hard ? round(r.int(20, 160) / 4, 2) : r.int(4, 60);
    const b = round(a + sol, 2);
    const form = hard ? r.pick(['vfirst', 'afirst', 'bfirst']) : r.pick(['vfirst', 'afirst']);
    const eq = form === 'vfirst' ? `${v} + ${num(a)} = ${num(b)}` : form === 'afirst' ? `${num(a)} + ${v} = ${num(b)}` : `${num(b)} = ${v} + ${num(a)}`;
    return {
      type: 'blanks',
      skill: 'solve-add',
      lesson: '8-2',
      title: hard ? 'Solve with the inverse (decimals)' : 'Solve with the inverse operation',
      prompt: `<p>Solve ${hl(eq)}. First name the number to subtract, then give the solution.</p>`,
      template: [`${eq}`, 'Subtract {0} from both sides.', `${v} = {1}`],
      fields: [
        { answer: a, width: 'sm' },
        { answer: sol, width: 'sm' },
      ],
      hints: [
        `The inverse of adding a number is subtracting that same number. Which number is being added to ${v}?`,
        `${num(a)} is added to ${v}. Subtract ${num(a)} from both sides to keep the equation balanced.`,
        `${v} = ${num(b)} − ${num(a)}.`,
      ],
      solution: `<p>${num(a)} is added to ${v}, so subtract <b>${num(a)}</b> from both sides: ${v} + ${num(a)} − ${num(a)} = ${num(b)} − ${num(a)}. So <b>${v} = ${num(sol)}</b>. Check: ${num(sol)} + ${num(a)} = ${num(b)}. ✓</p>`,
      feedback: {
        correct: `Correct. Subtracting ${num(a)} undoes adding ${num(a)}, and ${num(b)} − ${num(a)} = ${num(sol)}.`,
        wrong(ans, d) {
          const first = parseNum(ans[0]),
            second = parseNum(ans[1]);
          if (d.wrong.includes(0) && first != null && Math.abs(first - b) < 0.001)
            return `${num(b)} is the total, not the number added to ${v}. Subtract the number that is added to the variable: ${num(a)}.`;
          if (d.wrong.includes(1) && second != null && Math.abs(second - (b + a)) < 0.001)
            return `You added ${num(a)} instead of subtracting it. Adding is the operation already in the equation; you need its inverse.`;
          if (d.wrong.includes(0)) return `Look at the number that is added to ${v}. That is the number to subtract from both sides.`;
          return `Compute ${num(b)} − ${num(a)} for the value of ${v}.`;
        },
      },
    };
  });

  // ---------- Bar model: whole and parts (num) ----------
  G.define('q2_barModel', (r) => {
    const v = r.pick(VARS);
    const name = r.pick(NAMES);
    const ctx = r.pick([
      { whole: 'minutes of practice', part: 'minutes of scales', unk: 'minutes of songs' },
      { whole: 'pages read this week', part: 'pages read on Monday', unk: 'pages read the rest of the week' },
      { whole: 'points scored', part: 'points in the first half', unk: 'points in the second half' },
      { whole: 'dollars raised', part: 'dollars from the bake sale', unk: 'dollars from the car wash' },
    ]);
    const a = r.int(6, 28),
      sol = r.int(5, 40),
      b = a + sol;
    const aFirst = r.chance(0.5);
    const parts = aFirst
      ? [
          { label: String(a), size: a },
          { label: v, size: sol, unknown: true },
        ]
      : [
          { label: v, size: sol, unknown: true },
          { label: String(a), size: a },
        ];
    const eq = aFirst ? `${a} + ${v} = ${b}` : `${v} + ${a} = ${b}`;
    return {
      type: 'num',
      skill: 'balance-model',
      lesson: '8-2',
      title: 'Read the bar model',
      prompt: `<p>${name} recorded ${hl(b + ' ' + ctx.whole)} in all. ${hl(a)} were ${ctx.part}. The rest, ${hl(v)}, were ${ctx.unk}.</p>${V.barModel({ total: String(b), parts, aria: `Bar model: a whole of ${b} split into ${a} and ${v}` })}<p>The bar model shows ${hl(eq)}. Find ${v}.</p>`,
      answer: sol,
      unit: ctx.whole.split(' ')[0],
      hints: [
        'The top bar is the whole. The two bottom bars are the parts. The parts add up to the whole.',
        `One part is ${a} and the whole is ${b}. To find the missing part, take the known part away from the whole.`,
        `${v} = ${b} − ${a}.`,
      ],
      solution: `<p>The whole is ${b} and one part is ${a}. The missing part is the whole minus the known part: ${b} − ${a} = <b>${sol}</b>. Check: ${a} + ${sol} = ${b}. ✓</p>`,
      feedback: {
        correct: `Correct. Whole − known part = missing part: ${b} − ${a} = ${sol}.`,
        wrong(ans, d) {
          if (d.value === b + a) return `You added the two numbers. ${b} is already the whole. The missing part must be smaller than the whole, so subtract.`;
          if (d.value === b) return `${b} is the whole bar, not the missing part. The missing part is what is left after ${a}.`;
          return `The two parts add to the whole. ${v} + ${a} = ${b}, so ${v} = ${b} − ${a}.`;
        },
      },
    };
  });

  // ---------- Sort equations by the inverse operation needed (sort) ----------
  G.define('q2_sortOperation', (r) => {
    const v = r.pick(VARS);
    const a1 = r.int(2, 12),
      a2 = ((a1 - 2 + r.int(1, 10)) % 11) + 2, // 2..12 and distinct from a1 so no two sort items read the same
      a3 = round(r.int(3, 19) / 2, 1),
      b1 = r.int(a1 + 1, 30),
      b2 = r.int(a2 + 1, 30),
      b3 = round(r.int(10, 40) / 2, 1);
    const sub = [`${v} + ${a1} = ${b1}`, `${b2} = ${v} + ${a2}`, `${num(a3)} + ${v} = ${num(b3)}`, `${a2} + ${v} = ${b1}`];
    const add = [`${v} − ${a1} = ${b2}`, `${v} − ${num(a3)} = ${num(b3)}`, `${b1} = ${v} − ${a2}`, `${v} − ${a2} = ${b1}`];
    const items = r.shuffle(
      r
        .pickN(sub, 3)
        .map((h) => ({ html: h, bin: 0 }))
        .concat(r.pickN(add, 3).map((h) => ({ html: h, bin: 1 }))),
    );
    return {
      type: 'sort',
      skill: 'solve-add',
      lesson: '8-2',
      title: 'Which inverse operation?',
      prompt: `<p>To solve each equation in one step, would you <b>subtract</b> from both sides or <b>add</b> to both sides? Sort the equations.</p>`,
      bins: ['Subtract from both sides', 'Add to both sides'],
      items,
      hints: [
        'Look at the operation next to the variable. Use the inverse: subtraction undoes addition, and addition undoes subtraction.',
        `If a number is added to ${v}, subtract it from both sides. If a number is subtracted from ${v}, add it to both sides.`,
        `The order does not matter: ${b2} = ${v} + ${a2} still has ${a2} added to ${v}, so you subtract.`,
      ],
      solution: `<p>Addition equations (subtract to solve): ${items
        .filter((i) => i.bin === 0)
        .map((i) => i.html)
        .join(', ')}. Subtraction equations (add to solve): ${items
        .filter((i) => i.bin === 1)
        .map((i) => i.html)
        .join(', ')}.</p>`,
      feedback: {
        correct: 'Correct. The inverse operation undoes whatever is being done to the variable.',
        wrong(ans, d) {
          const i = d.wrong[0];
          return i != null
            ? `Look again at ${items[i].html}. Is a number being added to ${v} or subtracted from it? Use the opposite.`
            : 'Match each equation to the operation that undoes the one in the equation.';
        },
      },
    };
  });

  // ---------- Subtraction equation with the inverse step (blanks) ----------
  G.define('q2_subInverse', (r, o) => {
    const v = r.pick(VARS);
    const hard = !!o.hard;
    const a = hard ? round(r.int(8, 60) / 4, 2) : r.int(3, 30);
    const b = hard ? round(r.int(20, 160) / 4, 2) : r.int(2, 60);
    const sol = round(a + b, 2);
    const eq = hard && r.chance(0.4) ? `${num(b)} = ${v} − ${num(a)}` : `${v} − ${num(a)} = ${num(b)}`;
    return {
      type: 'blanks',
      skill: 'solve-sub',
      lesson: '8-2',
      title: 'Undo the subtraction',
      prompt: `<p>Solve ${hl(eq)}. First name the number to add, then give the solution.</p>`,
      template: [`${eq}`, 'Add {0} to both sides.', `${v} = {1}`],
      fields: [
        { answer: a, width: 'sm' },
        { answer: sol, width: 'sm' },
      ],
      hints: [
        `The inverse of subtracting a number is adding that same number. Which number is subtracted from ${v}?`,
        `${num(a)} is subtracted from ${v}. Add ${num(a)} to both sides.`,
        `${v} = ${num(b)} + ${num(a)}.`,
      ],
      solution: `<p>${num(a)} is subtracted from ${v}, so add <b>${num(a)}</b> to both sides: ${v} − ${num(a)} + ${num(a)} = ${num(b)} + ${num(a)}. So <b>${v} = ${num(sol)}</b>. Check: ${num(sol)} − ${num(a)} = ${num(b)}. ✓</p>`,
      feedback: {
        correct: `Correct. Adding ${num(a)} undoes subtracting ${num(a)}, so ${v} = ${num(sol)}.`,
        wrong(ans, d) {
          const second = parseNum(ans[1]);
          if (d.wrong.includes(1) && second != null && Math.abs(second - (b - a)) < 0.001)
            return `You subtracted ${num(a)} again. The equation already subtracts ${num(a)}; to undo it, add ${num(a)}. The solution is bigger than ${num(b)}.`;
          if (d.wrong.includes(1) && second != null && Math.abs(second - (a - b)) < 0.001)
            return `You found ${num(a)} − ${num(b)}. The variable started bigger than ${num(b)}: ${v} = ${num(b)} + ${num(a)}.`;
          if (d.wrong.includes(0)) return `Look at the number subtracted from ${v}. Add that number to both sides.`;
          return `Compute ${num(b)} + ${num(a)} for the value of ${v}.`;
        },
      },
    };
  });

  // ---------- Write and solve a subtraction equation (blanks, two-col) ----------
  G.define('q2_subWord', (r) => {
    const name = r.pick(NAMES);
    const v = r.pick(['m', 's', 'c', 'd']);
    const ctx = r.pick([
      () => {
        const a = round(r.int(20, 60) / 4, 2),
          b = round(r.int(20, 120) / 4, 2);
        return {
          a,
          b,
          text: `${name} had some money. After spending ${hl(money(a))} on a sky-lift pass, ${name} has ${hl(money(b))} left.`,
          varDef: `${v} = the money ${name} started with`,
          unit: '$',
        };
      },
      () => {
        const a = r.int(8, 30),
          b = r.int(10, 45);
        return {
          a,
          b,
          text: `${name} had a stack of trading cards. After giving ${hl(a + ' cards')} to a friend, ${name} has ${hl(b + ' cards')} left.`,
          varDef: `${v} = the number of cards at the start`,
          unit: '',
        };
      },
      () => {
        const a = r.int(3, 12),
          b = r.int(5, 20);
        return {
          a,
          b,
          text: `A trail is ${v} kilometers long. ${name} has hiked ${hl(a + ' kilometers')} and has ${hl(b + ' kilometers')} left to go.`,
          varDef: `${v} = the length of the trail`,
          unit: '',
        };
      },
      () => {
        const a = round(r.int(4, 16) / 2, 1),
          b = round(r.int(10, 40) / 2, 1);
        return {
          a,
          b,
          text: `A water tank held some liters. After ${hl(num(a) + ' liters')} drained out, ${hl(num(b) + ' liters')} remain.`,
          varDef: `${v} = the liters in the tank at the start`,
          unit: '',
        };
      },
    ])();
    const sol = round(ctx.a + ctx.b, 2);
    return {
      type: 'blanks',
      skill: 'solve-sub',
      lesson: '8-2',
      title: 'Write and solve',
      prompt: `<p>${ctx.text}</p><p>Let ${hl(ctx.varDef)}. Write a subtraction equation, then solve it.</p>`,
      template: [`Equation: ${v} − {0} = {1}`, `Solution: ${v} = {2}`],
      fields: [
        { answer: ctx.a, width: 'sm' },
        { answer: ctx.b, width: 'sm' },
        { answer: sol, width: 'sm' },
      ],
      hints: [
        `The story starts with ${v}, then an amount is taken away, and an amount is left. Start − taken away = left.`,
        `${v} − ${num(ctx.a)} = ${num(ctx.b)}. To undo subtracting ${num(ctx.a)}, add ${num(ctx.a)} to both sides.`,
        `${v} = ${num(ctx.b)} + ${num(ctx.a)}.`,
      ],
      solution: `<p>Equation: <b>${v} − ${num(ctx.a)} = ${num(ctx.b)}</b>. Add ${num(ctx.a)} to both sides: ${v} = ${num(ctx.b)} + ${num(ctx.a)} = <b>${num(sol)}</b>. Check: ${num(sol)} − ${num(ctx.a)} = ${num(ctx.b)}. ✓</p>`,
      feedback: {
        correct: `Correct. ${v} − ${num(ctx.a)} = ${num(ctx.b)}, and adding ${num(ctx.a)} back gives ${num(sol)}.`,
        wrong(ans, d) {
          const third = parseNum(ans[2]);
          if (d.wrong.includes(0) || d.wrong.includes(1)) return `The amount taken away (${num(ctx.a)}) is subtracted. The amount left (${num(ctx.b)}) is the result after the equals sign.`;
          if (third != null && Math.abs(third - Math.abs(ctx.b - ctx.a)) < 0.001) return `You subtracted. The starting amount is bigger than what is left. Add ${num(ctx.a)} back to ${num(ctx.b)}.`;
          return `To undo "− ${num(ctx.a)}", add ${num(ctx.a)} to ${num(ctx.b)}.`;
        },
      },
    };
  });

  // ---------- Check a proposed solution by substituting (cloze) ----------
  G.define('q2_checkCloze', (r) => {
    const name = r.pick(NAMES);
    const v = r.pick(VARS);
    const kind = r.pick(['add', 'sub']);
    const a = r.int(3, 20),
      sol = r.int(a + 2, 45);
    const b = kind === 'add' ? sol + a : sol - a;
    const eq = kind === 'add' ? `${v} + ${a} = ${b}` : `${v} − ${a} = ${b}`;
    const right = r.chance(0.5);
    const p = right ? sol : kind === 'add' ? b + a : b - a; // the classic same-operation mistake
    const lhs = kind === 'add' ? p + a : p - a;
    const alts = r.shuffle([lhs, lhs + a, b === lhs ? lhs - a : b].filter((x, i, arr) => arr.indexOf(x) === i).map(String));
    return {
      type: 'cloze',
      skill: 'check-solution',
      lesson: '8-2',
      title: 'Check the solution',
      prompt: `<p>${name} solved ${hl(eq)} and got ${hl(v + ' = ' + p)}. Check ${name}'s answer by substituting.</p>`,
      template: `Substitute ${p} for ${v}: ${p} ${kind === 'add' ? '+' : '−'} ${a} = {0}. The right side is ${b}. So ${v} = ${p} {1}. To solve ${eq} correctly, you {2} ${a} on both sides.`,
      choices: [alts, ['is the solution', 'is not the solution'], kind === 'add' ? ['subtract', 'add'] : ['add', 'subtract']],
      answers: [alts.indexOf(String(lhs)), right ? 0 : 1, 0],
      hints: [
        `Checking means putting the answer back into the original equation. Replace ${v} with ${p} and compute the left side.`,
        `${p} ${kind === 'add' ? '+' : '−'} ${a} = ${lhs}. Compare with the right side, ${b}.`,
        right
          ? `${lhs} = ${b}, so the answer checks. ${name} used the inverse: ${kind === 'add' ? 'subtracted' : 'added'} ${a}.`
          : `${lhs} ≠ ${b}, so ${p} is not the solution. ${name} ${kind === 'add' ? 'added' : 'subtracted'} ${a} instead of using the inverse.`,
      ],
      solution: `<p>${p} ${kind === 'add' ? '+' : '−'} ${a} = <b>${lhs}</b>. The right side is ${b}, so ${v} = ${p} <b>${right ? 'is the solution' : 'is not the solution'}</b>. To solve ${eq}, <b>${kind === 'add' ? 'subtract' : 'add'}</b> ${a} on both sides${right ? '' : `, which gives ${v} = ${sol}`}.</p>`,
      feedback: {
        correct: `Correct. Substituting shows whether the equation balances, and the inverse operation (${kind === 'add' ? 'subtracting' : 'adding'} ${a}) is how you solve it.`,
        wrong(ans, d) {
          if (d.wrong.includes(0)) return `Recompute: ${p} ${kind === 'add' ? '+' : '−'} ${a}.`;
          if (d.wrong.includes(1)) return `Compare the left side you computed with ${b}. Equal means it is the solution; not equal means it is not.`;
          return `The equation ${kind === 'add' ? 'adds' : 'subtracts'} ${a}. The inverse operation is ${kind === 'add' ? 'subtraction' : 'addition'}.`;
        },
      },
    };
  });

  // ---------- Error: used the same operation instead of the inverse (error) ----------
  G.define('q2_errorInverse', (r) => {
    const name = r.pick(NAMES);
    const v = r.pick(VARS);
    const kind = r.pick(['add', 'sub']);
    const a = r.int(3, 15),
      sol = r.int(a + 1, 40);
    const b = kind === 'add' ? sol + a : sol - a;
    const eq = kind === 'add' ? `${v} + ${a} = ${b}` : `${v} − ${a} = ${b}`;
    const wrongSol = kind === 'add' ? b + a : b - a;
    const work = kind === 'add' ? `${v} + ${a} = ${b}<br>${v} + ${a} + ${a} = ${b} + ${a}<br>${v} = ${wrongSol}` : `${v} − ${a} = ${b}<br>${v} − ${a} − ${a} = ${b} − ${a}<br>${v} = ${wrongSol}`;
    const inv = kind === 'add' ? 'subtract' : 'add';
    const same = kind === 'add' ? 'added' : 'subtracted';
    const opts = [
      { html: `${name} ${same} ${a} to both sides, but the equation already ${kind === 'add' ? 'adds' : 'subtracts'} ${a}. To undo it, ${name} should ${inv} ${a} on both sides.`, ok: true },
      {
        html: `${name} should have ${same} ${a} to only one side.`,
        why: `Doing something to only one side unbalances the equation. Both sides must get the same operation. The problem is the operation chosen, not the number of sides.`,
      },
      {
        html: `${name} should have ${kind === 'add' ? 'divided' : 'multiplied'} both sides by ${a}.`,
        why: `Division and multiplication undo each other. The equation ${kind === 'add' ? 'adds' : 'subtracts'} ${a}, so its inverse is ${kind === 'add' ? 'subtraction' : 'addition'}.`,
      },
      {
        html: `There is no mistake. ${v} = ${wrongSol} is correct.`,
        why: `Check it: ${wrongSol} ${kind === 'add' ? '+' : '−'} ${a} = ${kind === 'add' ? wrongSol + a : wrongSol - a}, not ${b}. The answer does not make the equation true.`,
      },
    ];
    const sh = shuffleOptions(r, opts, 0);
    return {
      type: 'error',
      skill: kind === 'add' ? 'solve-add' : 'solve-sub',
      lesson: '8-2',
      title: 'Find the mistake',
      prompt: `<p>${name} solved ${hl(eq)} like this. What went wrong?</p>`,
      work,
      options: sh.options,
      answer: sh.answer,
      fix: { label: `Correct solution: ${v} = `, answer: sol },
      hints: [
        `Check ${name}'s answer by substituting: ${wrongSol} ${kind === 'add' ? '+' : '−'} ${a} = ? Does it equal ${b}?`,
        `The equation ${kind === 'add' ? 'adds' : 'subtracts'} ${a}. Doing the same operation again moves further from the answer. Use the inverse.`,
        `${inv === 'subtract' ? 'Subtract' : 'Add'} ${a} on both sides: ${v} = ${b} ${kind === 'add' ? '−' : '+'} ${a}.`,
      ],
      solution: `<p>${name} ${same} ${a}, the same operation that is already in the equation. The inverse undoes it: ${inv} ${a} on both sides. ${v} = ${b} ${kind === 'add' ? '−' : '+'} ${a} = <b>${sol}</b>. Check: ${sol} ${kind === 'add' ? '+' : '−'} ${a} = ${b}. ✓</p>`,
      feedback: {
        correct: `Correct. Inverse operations undo each other. ${kind === 'add' ? 'Subtracting' : 'Adding'} ${a} gives ${v} = ${sol}.`,
        wrong(ans, d) {
          if (!d.mistakeOk)
            return (
              (sh.options[ans.mistake] && sh.options[ans.mistake].why) ||
              `Substitute ${wrongSol} back into the equation. It does not work, so find the operation that undoes ${kind === 'add' ? '+' : '−'} ${a}.`
            );
          const f = parseNum(ans.fix);
          if (f === wrongSol) return `That is ${name}'s answer, which does not check. ${inv === 'subtract' ? 'Subtract' : 'Add'} ${a}: ${b} ${kind === 'add' ? '−' : '+'} ${a}.`;
          return `You found the mistake. Now ${inv} ${a}: ${v} = ${b} ${kind === 'add' ? '−' : '+'} ${a}.`;
        },
      },
    };
  });
})(typeof window !== 'undefined' ? window : globalThis);

/* js/units/u8/gen-muldiv.js */
/* Zone 3 — The Gearworks. Lesson 8-3 Write and Solve Equations Using Multiplication or Division. */
(function (root) {
  'use strict';
  const RX = root.RX;
  const { G, V, shuffleOptions, NAMES, money, round, parseNum } = RX;
  const hl = V.hl;
  const VARS = ['x', 'n', 'm', 'w', 'k', 'p'];
  const num = (x) => (Number.isInteger(x) ? String(x) : String(round(x, 2)));
  const nearTo = (v, t) => v != null && Math.abs(v - t) < 0.001;

  // ---------- Multiplication equation with the inverse step (blanks; pan balance when the coefficient is small) ----------
  G.define('q3_mulInverse', (r, o) => {
    const v = r.pick(VARS);
    const hard = !!o.hard;
    const a = hard ? r.pick([2.5, 1.5, 0.5, 4, 6, 8, 12]) : r.int(2, 12);
    const sol = hard ? round(r.int(5, 60) / 2, 1) : r.int(2, 15);
    const b = round(a * sol, 2);
    const eq = `${num(a)}${v} = ${num(b)}`;
    const showBalance = !hard && a <= 4;
    const balance = showBalance
      ? V.balance({ left: Array.from({ length: a }, () => v), right: [String(b)], aria: `Balanced scale: ${a} crates labeled ${v} on the left and a weight of ${b} on the right` })
      : '';
    return {
      type: 'blanks',
      skill: 'solve-mul',
      lesson: '8-3',
      title: hard ? 'Solve with the inverse (decimals)' : 'Solve with the inverse operation',
      prompt: showBalance
        ? `<p>The scale is balanced. One pan holds ${hl(a)} crates that each weigh ${hl(v)}. The other pan holds a weight of ${hl(num(b))}.</p>${balance}<p>The scale shows ${hl(eq)}. Name the number to divide by, then give the solution.</p>`
        : `<p>Solve ${hl(eq)}. ${num(a)}${v} means ${num(a)} × ${v}. First name the number to divide by, then give the solution.</p>`,
      template: [`${eq}`, 'Divide both sides by {0}.', `${v} = {1}`],
      fields: [
        { answer: a, width: 'sm' },
        { answer: sol, width: 'sm' },
      ],
      hints: [
        `The coefficient is the number multiplied by the variable. The inverse of multiplying by a number is dividing by that same number.`,
        `${v} is multiplied by ${num(a)}. Divide both sides by ${num(a)} to keep the equation balanced.`,
        `${v} = ${num(b)} ÷ ${num(a)}.`,
      ],
      solution: `<p>${num(a)}${v} means ${num(a)} × ${v}. Division undoes multiplication, so divide both sides by <b>${num(a)}</b>: ${num(a)}${v} ÷ ${num(a)} = ${num(b)} ÷ ${num(a)}. So <b>${v} = ${num(sol)}</b>. Check: ${num(a)} × ${num(sol)} = ${num(b)}. ✓</p>`,
      feedback: {
        correct: `Correct. Dividing by ${num(a)} undoes multiplying by ${num(a)}, and ${num(b)} ÷ ${num(a)} = ${num(sol)}.`,
        wrong(ans, d) {
          const first = parseNum(ans[0]),
            second = parseNum(ans[1]);
          if (d.wrong.includes(0) && nearTo(first, b)) return `${num(b)} is the product on the right side. Divide by the coefficient, the number multiplied by ${v}: ${num(a)}.`;
          if (d.wrong.includes(1) && nearTo(second, b * a))
            return `You multiplied ${num(b)} by ${num(a)}. The equation already multiplies by ${num(a)}; its inverse is division. ${v} = ${num(b)} ÷ ${num(a)}.`;
          if (d.wrong.includes(1) && nearTo(second, b - a)) return `You subtracted ${num(a)}. Subtraction undoes addition, not multiplication. Divide ${num(b)} by ${num(a)}.`;
          if (d.wrong.includes(0)) return `Look at the number multiplied by ${v}. That is the number to divide both sides by.`;
          return `Compute ${num(b)} ÷ ${num(a)} for the value of ${v}.`;
        },
      },
    };
  });

  // ---------- Write and solve a multiplication equation from a story (blanks) ----------
  G.define('q3_mulWord', (r) => {
    const name = r.pick(NAMES);
    const v = r.pick(['t', 'n', 'h', 'c']);
    const ctx = r.pick([
      () => {
        const a = r.pick([4, 5, 6, 8, 12]),
          sol = r.int(3, 9),
          b = a * sol;
        return {
          a,
          b,
          sol,
          text: `Tickets to the Gearworks cost ${hl(money(a))} each. ${name} paid ${hl(money(b))} in all.`,
          varDef: `${v} = the number of tickets ${name} bought`,
          unit: 'tickets',
          hint: 'price × number of tickets = total paid',
        };
      },
      () => {
        const a = r.int(3, 8),
          sol = r.int(4, 15),
          b = a * sol;
        return {
          a,
          b,
          sol,
          text: `${name} shared ${hl(b + ' gears')} equally among ${hl(a + ' apprentices')}. Each apprentice got the same number of gears.`,
          varDef: `${v} = the number of gears each apprentice got`,
          unit: 'gears',
          hint: 'number of apprentices × gears each = total gears',
        };
      },
      () => {
        const a = r.pick([3, 4, 5, 6, 8, 10, 12]),
          sol = r.int(2, 9),
          b = a * sol;
        return {
          a,
          b,
          sol,
          text: `A lift chain rises ${hl(a + ' meters')} every minute. It rose ${hl(b + ' meters')} in all.`,
          varDef: `${v} = the number of minutes the chain rose`,
          unit: 'minutes',
          hint: 'rate × time = distance',
        };
      },
      () => {
        const a = r.pick([2, 3, 4, 5, 6]),
          sol = r.int(5, 24),
          b = a * sol;
        return {
          a,
          b,
          sol,
          text: `${name} practiced the same number of minutes each day for ${hl(a + ' days')}, for a total of ${hl(b + ' minutes')}.`,
          varDef: `${v} = the minutes ${name} practiced each day`,
          unit: 'minutes',
          hint: 'days × minutes per day = total minutes',
        };
      },
      () => {
        const a = r.pick([3, 4, 6, 8]),
          sol = r.pick([1.5, 2.5, 3.5, 4.5, 5.5]),
          b = round(a * sol, 2);
        return {
          a,
          b,
          sol,
          text: `${name} bought ${hl(a + ' pounds')} of trail mix for ${hl(money(b))}. Every pound costs the same.`,
          varDef: `${v} = the cost of one pound`,
          unit: 'dollars',
          hint: 'pounds × cost per pound = total cost',
        };
      },
    ])();
    const eq = `${ctx.a}${v} = ${num(ctx.b)}`;
    return {
      type: 'blanks',
      skill: 'solve-mul',
      lesson: '8-3',
      title: 'Write and solve',
      prompt: `<p>${ctx.text}</p><p>Let ${hl(ctx.varDef)}. Complete the multiplication equation, then solve it.</p>`,
      template: [`Equation: {0}${v} = {1}`, `Solution: ${v} = {2}`],
      fields: [
        { answer: ctx.a, width: 'sm' },
        { answer: ctx.b, width: 'sm' },
        { answer: ctx.sol, width: 'sm' },
      ],
      hints: [
        `The story has equal groups: ${ctx.hint}. Equal groups mean multiplication.`,
        `The equation is ${eq}. To undo multiplying by ${ctx.a}, divide both sides by ${ctx.a}.`,
        `${v} = ${num(ctx.b)} ÷ ${ctx.a}.`,
      ],
      solution: `<p>${ctx.hint}, so the equation is <b>${eq}</b>. Divide both sides by ${ctx.a}: ${v} = ${num(ctx.b)} ÷ ${ctx.a} = <b>${num(ctx.sol)}</b> ${ctx.unit}. Check: ${ctx.a} × ${num(ctx.sol)} = ${num(ctx.b)}. ✓</p>`,
      feedback: {
        correct: `Correct. ${eq}, and dividing by ${ctx.a} gives ${num(ctx.sol)}.`,
        wrong(ans, d) {
          const third = parseNum(ans[2]);
          if (d.wrong.includes(0) || d.wrong.includes(1)) return `The known group size or number of groups (${ctx.a}) is the coefficient. The total (${num(ctx.b)}) goes after the equals sign.`;
          if (nearTo(third, ctx.b * ctx.a)) return `You multiplied. The equation already multiplies by ${ctx.a}. To find ${v}, divide: ${num(ctx.b)} ÷ ${ctx.a}.`;
          if (nearTo(third, ctx.b - ctx.a)) return `You subtracted ${ctx.a}. Subtraction undoes addition, not multiplication. Divide ${num(ctx.b)} by ${ctx.a}.`;
          return `To undo "× ${ctx.a}", divide ${num(ctx.b)} by ${ctx.a}.`;
        },
      },
    };
  });

  // ---------- Fraction coefficient: (a/b)x = c (num) ----------
  G.define('q3_fracCoef', (r) => {
    const v = r.pick(VARS);
    const [a, b] = r.pick([
      [1, 2],
      [1, 3],
      [2, 3],
      [1, 4],
      [3, 4],
      [2, 5],
      [3, 5],
      [1, 5],
    ]);
    const k = r.int(2, 8);
    const sol = b * k;
    const c = a * k;
    const words = { 2: 'half', 3: 'third', 4: 'fourth', 5: 'fifth' };
    const phrase = a === 1 ? `one-${words[b]}` : `${['', '', 'two', 'three', 'four', 'five'][a]}-${words[b]}s`;
    return {
      type: 'num',
      skill: 'solve-mul',
      lesson: '8-3',
      title: 'Fraction coefficient',
      prompt: `<p>A gear turns ${hl(phrase)} of a full rotation, which is ${hl(c + ' clicks')}. The equation ${V.frac(a, b)}${hl(v)} = ${hl(c)} models this, where ${v} is the number of clicks in a full rotation.</p><p>Solve ${V.frac(a, b)}${v} = ${c}. What is ${v}?</p>`,
      answer: sol,
      unit: 'clicks',
      hints: [
        `${a}/${b} is the coefficient of ${v}. To undo multiplying by a fraction, divide both sides by that fraction. Dividing by a fraction is the same as multiplying by its reciprocal.`,
        `The reciprocal of ${a}/${b} is ${b}/${a}. Multiply both sides by ${b}/${a}: ${v} = ${c} × ${b}/${a}.`,
        a === 1 ? `${c} × ${b} = ${c * b}. That is ${v}.` : `${c} × ${b} = ${c * b}. Then divide by ${a}.`,
      ],
      solution: `<p>Divide both sides by ${a}/${b}. Dividing by a fraction means multiplying by its reciprocal, ${b}/${a}: ${v} = ${c} × ${b}/${a} = ${c * b}/${a} = <b>${sol}</b>. Check: ${a === 1 ? `1/${b} × ${sol} = ${sol} ÷ ${b} = ${c}` : `${a}/${b} × ${sol} = ${sol} ÷ ${b} × ${a} = ${k} × ${a} = ${c}`}. ✓</p>`,
      feedback: {
        correct: `Correct. ${phrase} of ${sol} is ${c}, so ${v} = ${sol}.`,
        wrong(ans, d) {
          if (nearTo(d.value, (c * a) / b))
            return `You multiplied ${c} by ${a}/${b}. That is the operation already in the equation. The inverse is dividing by ${a}/${b}, which means multiplying by ${b}/${a}.`;
          if (nearTo(d.value, c * b)) return `${c} × ${b} = ${c * b} is a good first step, but you still need to divide by ${a}. ${v} = ${c * b} ÷ ${a}.`;
          if (nearTo(d.value, c * a)) return `You multiplied by ${a}. The reciprocal of ${a}/${b} is ${b}/${a}: multiply by ${b}, then divide by ${a}.`;
          if (nearTo(d.value, c + b) || nearTo(d.value, c - a)) return `Adding or subtracting does not undo multiplying by a fraction. Multiply ${c} by the reciprocal ${b}/${a}.`;
          return `${phrase} of ${v} is ${c}. The whole, ${v}, must be bigger than ${c}. Multiply ${c} by ${b}/${a}.`;
        },
      },
    };
  });

  // ---------- Who solved 3x = 12 correctly? (who, pan balance) ----------
  G.define('q3_whoMul', (r) => {
    const [n1, n2, n3] = r.pickN(NAMES, 3);
    const v = r.pick(VARS);
    const a = r.int(2, 4);
    const sol = r.int(3, 12);
    const b = a * sol;
    const eq = `${a}${v} = ${b}`;
    const sh = shuffleOptions(
      r,
      [
        { title: n1, html: `${a}${v} means ${a} × ${v}, so I divide both sides by ${a}.<br>${v} = ${b} ÷ ${a}<br><b>${v} = ${sol}</b>`, ok: true },
        {
          title: n2,
          html: `I subtract ${a} from both sides to get ${v} alone.<br>${v} = ${b} − ${a}<br><b>${v} = ${b - a}</b>`,
          why: `${n2} treated ${a}${v} as ${v} + ${a}. The ${a} is multiplied by ${v}, not added. Subtraction undoes addition; division undoes multiplication. Check: ${a} × ${b - a} = ${a * (b - a)}, not ${b}.`,
        },
        {
          title: n3,
          html: `To undo the ${a}, I multiply both sides by ${a}.<br>${v} = ${b} × ${a}<br><b>${v} = ${b * a}</b>`,
          why: `${n3} multiplied by ${a}, the same operation already in the equation. That moves further from the answer. Check: ${a} × ${b * a} is much bigger than ${b}.`,
        },
      ],
      0,
    );
    return {
      type: 'who',
      skill: 'solve-mul',
      lesson: '8-3',
      title: 'Who is correct?',
      prompt: `<p>The scale is balanced. One pan holds ${hl(a)} crates that each weigh ${hl(v)}. The other pan holds a weight of ${hl(b)}.</p>${V.balance({ left: Array.from({ length: a }, () => v), right: [String(b)], aria: `Balanced scale: ${a} crates labeled ${v} on the left and a weight of ${b} on the right` })}<p>Three Keepers solve ${hl(eq)}. Who is correct?</p>`,
      options: sh.options,
      answer: sh.answer,
      layout: 'cards',
      hints: [
        `${a}${v} means ${a} copies of ${v}, or ${a} × ${v}. Which operation undoes multiplying by ${a}?`,
        `On the scale, ${a} equal crates weigh ${b} together. To find one crate, split ${b} into ${a} equal parts: divide.`,
        `${b} ÷ ${a} is the weight of one crate. Check it by multiplying back.`,
      ],
      solution: `<p><b>${n1}</b> is correct. ${a}${v} is ${a} × ${v}, so dividing both sides by ${a} gives ${v} = ${b} ÷ ${a} = <b>${sol}</b>. Check: ${a} × ${sol} = ${b}. ✓ ${n2} subtracted, which undoes addition, not multiplication. ${n3} multiplied again instead of using the inverse.</p>`,
      feedback: {
        correct: `Correct. ${n1} used the inverse of multiplication: division. Each crate weighs ${sol}.`,
        wrong(ans) {
          return (sh.options[ans] && sh.options[ans].why) || `Substitute each answer into ${eq}. Only one makes ${a} × ${v} equal ${b}.`;
        },
      },
    };
  });

  // ---------- Division equation with the inverse step (blanks) ----------
  G.define('q3_divInverse', (r, o) => {
    const v = r.pick(VARS);
    const hard = !!o.hard;
    const a = hard ? r.pick([4, 5, 6, 8, 10, 12]) : r.int(2, 9);
    const b = hard ? round(r.int(5, 40) / 2, 1) : r.int(2, 12);
    const sol = round(a * b, 2);
    const eq = hard && r.chance(0.4) ? `${num(b)} = ${v} ÷ ${a}` : `${v} ÷ ${a} = ${num(b)}`;
    return {
      type: 'blanks',
      skill: 'solve-div',
      lesson: '8-3',
      title: hard ? 'Undo the division (decimals)' : 'Undo the division',
      prompt: `<p>Solve ${hl(eq)}. ${v} ÷ ${a} can also be written as the fraction ${V.frac(v, a)}. First name the number to multiply by, then give the solution.</p>`,
      template: [`${eq}`, 'Multiply both sides by {0}.', `${v} = {1}`],
      fields: [
        { answer: a, width: 'sm' },
        { answer: sol, width: 'sm' },
      ],
      hints: [
        `The inverse of dividing by a number is multiplying by that same number. Which number is ${v} divided by?`,
        `${v} is divided by ${a}. Multiply both sides by ${a} to keep the equation balanced.`,
        `${v} = ${num(b)} × ${a}.`,
      ],
      solution: `<p>${v} is divided by ${a}, so multiply both sides by <b>${a}</b>: ${v} ÷ ${a} × ${a} = ${num(b)} × ${a}. So <b>${v} = ${num(sol)}</b>. Check: ${num(sol)} ÷ ${a} = ${num(b)}. ✓</p>`,
      feedback: {
        correct: `Correct. Multiplying by ${a} undoes dividing by ${a}, so ${v} = ${num(sol)}.`,
        wrong(ans, d) {
          const first = parseNum(ans[0]),
            second = parseNum(ans[1]);
          if (d.wrong.includes(0) && nearTo(first, b)) return `${num(b)} is the quotient on the other side. Multiply by the number ${v} is divided by: ${a}.`;
          if (d.wrong.includes(1) && nearTo(second, b / a))
            return `You divided ${num(b)} by ${a} again. The equation already divides by ${a}; its inverse is multiplication. The solution is bigger than ${num(b)}.`;
          if (d.wrong.includes(1) && nearTo(second, b + a)) return `You added ${a}. Addition undoes subtraction, not division. Multiply ${num(b)} by ${a}.`;
          if (d.wrong.includes(0)) return `Look at the number ${v} is divided by. Multiply both sides by that number.`;
          return `Compute ${num(b)} × ${a} for the value of ${v}.`;
        },
      },
    };
  });

  // ---------- Division story: choose the equation, the operation, and the solution (cloze) ----------
  G.define('q3_divWord', (r) => {
    const name = r.pick(NAMES);
    const v = r.pick(['g', 'm', 'r', 'x']);
    const a = r.int(3, 9);
    const b = r.int(4, 15);
    const sol = a * b;
    const ctx = r.pick([
      { text: `${name} split a bag of ${hl(v)} marbles equally among ${hl(a + ' friends')}. Each friend got ${hl(b + ' marbles')}.`, varDef: `${v} = the number of marbles in the bag` },
      { text: `A ribbon ${hl(v)} centimeters long was cut into ${hl(a + ' equal pieces')}. Each piece is ${hl(b + ' centimeters')}.`, varDef: `${v} = the length of the whole ribbon` },
      { text: `${name} hiked a trail of ${hl(v)} miles over ${hl(a + ' days')}, going the same distance each day: ${hl(b + ' miles')}.`, varDef: `${v} = the total length of the trail` },
      { text: `${name} saved ${hl(v)} dollars and divided it into ${hl(a + ' equal payments')} of ${hl('$' + b)} each.`, varDef: `${v} = the total amount saved` },
    ]);
    const eqs = r.shuffle([`${v} ÷ ${a} = ${b}`, `${a} ÷ ${v} = ${b}`, `${a}${v} = ${b}`]);
    const sols = r.shuffle([String(sol), String(round(b / a, 2)), String(b + a)]);
    return {
      type: 'cloze',
      skill: 'solve-div',
      lesson: '8-3',
      title: 'Model and solve a division story',
      prompt: `<p>${ctx.text}</p><p>Let ${hl(ctx.varDef)}. Complete the model and solve.</p>`,
      template: `Equation: {0}. To solve, {1} both sides by ${a}. ${v} = {2}.`,
      choices: [eqs, ['multiply', 'divide'], sols],
      answers: [eqs.indexOf(`${v} ÷ ${a} = ${b}`), 0, sols.indexOf(String(sol))],
      hints: [
        `The whole amount ${v} is split into ${a} equal parts, and each part is ${b}. Splitting into equal parts is division: whole ÷ parts = each.`,
        `The equation is ${v} ÷ ${a} = ${b}. To undo dividing by ${a}, use the inverse operation.`,
        `Multiply both sides by ${a}: ${v} = ${b} × ${a}.`,
      ],
      solution: `<p>The whole is split into ${a} equal parts of ${b}, so <b>${v} ÷ ${a} = ${b}</b>. Division is undone by multiplication: <b>multiply</b> both sides by ${a}. ${v} = ${b} × ${a} = <b>${sol}</b>. Check: ${sol} ÷ ${a} = ${b}. ✓</p>`,
      feedback: {
        correct: `Correct. The whole divided into ${a} parts gives ${b} each, so the whole is ${b} × ${a} = ${sol}.`,
        wrong(ans, d) {
          if (d.wrong.includes(0)) return `The whole, ${v}, is split into ${a} equal parts. Write whole ÷ parts: ${v} ÷ ${a}. ${a} ÷ ${v} says ${a} is split into ${v} parts, which is backwards.`;
          if (d.wrong.includes(1)) return `The equation divides by ${a}. The inverse of division is multiplication.`;
          if (ans[2] === sols.indexOf(String(round(b / a, 2)))) return `You divided ${b} by ${a}. The whole must be bigger than one part. Multiply: ${b} × ${a}.`;
          return `Each of ${a} parts is ${b}, so the whole is ${a} × ${b}.`;
        },
      },
    };
  });

  // ---------- Match equations to solutions (match) ----------
  G.define('q3_matchSolutions', (r) => {
    const v = r.pick(VARS);
    const sols = r.pickN([3, 4, 5, 6, 7, 8, 9, 10, 12, 15, 16, 18, 20, 24], 4);
    const kinds = r.shuffle(['mul', 'mul', 'div', 'div']);
    const built = sols.map((s, i) => {
      const divisors = [2, 3, 4, 5, 6].filter((d) => s % d === 0 && s / d >= 2);
      if (kinds[i] === 'mul' || !divisors.length) {
        const a = r.int(2, 9);
        return { eq: `${a}${v} = ${a * s}`, sol: s, step: `${a * s} ÷ ${a}` };
      }
      const a = r.pick(divisors);
      return { eq: `${v} ÷ ${a} = ${s / a}`, sol: s, step: `${s / a} × ${a}` };
    });
    const rightOrder = r.shuffle([0, 1, 2, 3]);
    const left = built.map((x) => x.eq);
    const right = rightOrder.map((i) => `${v} = ${built[i].sol}`);
    const pairs = built.map((x, i) => [i, rightOrder.indexOf(i)]);
    return {
      type: 'match',
      skill: 'solve-div',
      lesson: '8-3',
      title: 'Match each equation to its solution',
      prompt: `<p>Four gears, four locks. Match each equation to the value of ${hl(v)} that solves it.</p>`,
      left,
      right,
      pairs,
      hints: [
        `For ${v} multiplied by a number, divide to solve. For ${v} divided by a number, multiply to solve.`,
        `For example, ${built[0].eq}: ${v} = ${built[0].step}.`,
        `Check each match by substituting the value back into its equation.`,
      ],
      solution: `<p>${built.map((x) => `${x.eq} → ${v} = ${x.step} = ${x.sol}`).join('. ')}.</p>`,
      feedback: {
        correct: 'Correct. Division undoes multiplication, and multiplication undoes division.',
        wrong(ans, d) {
          const i = d.wrong && d.wrong[0];
          return i != null
            ? `Look again at ${built[i].eq}. ${/÷/.test(built[i].eq) ? `${v} is divided, so multiply to find it: ${built[i].step}.` : `${v} is multiplied, so divide to find it: ${built[i].step}.`}`
            : 'Solve each equation with its inverse operation, then match.';
        },
      },
    };
  });

  // ---------- Error: divided when the inverse was multiplying (error) ----------
  G.define('q3_errorDiv', (r) => {
    const name = r.pick(NAMES);
    const v = r.pick(VARS);
    const kind = r.chance(0.6) ? 'div' : 'mul';
    const a = r.int(2, 8);
    let b, sol, wrongSol, work;
    if (kind === 'div') {
      b = a * r.int(2, 9);
      sol = a * b;
      wrongSol = b / a;
      work = `${v} ÷ ${a} = ${b}<br>${v} ÷ ${a} ÷ ${a} = ${b} ÷ ${a}<br>${v} = ${wrongSol}`;
    } else {
      sol = r.int(3, 12);
      b = a * sol;
      wrongSol = b * a;
      work = `${a}${v} = ${b}<br>${a}${v} × ${a} = ${b} × ${a}<br>${v} = ${wrongSol}`;
    }
    const eq = kind === 'div' ? `${v} ÷ ${a} = ${b}` : `${a}${v} = ${b}`;
    const same = kind === 'div' ? 'divided' : 'multiplied';
    const inv = kind === 'div' ? 'multiply' : 'divide';
    const checkVal = kind === 'div' ? round(wrongSol / a, 2) : a * wrongSol;
    const opts = [
      { html: `${name} ${same} by ${a}, but the equation already ${kind === 'div' ? 'divides' : 'multiplies'} by ${a}. The inverse is to ${inv} both sides by ${a}.`, ok: true },
      {
        html: `${name} should have ${kind === 'div' ? 'subtracted' : 'added'} ${a} on both sides.`,
        why: `${kind === 'div' ? 'Subtraction undoes addition' : 'Addition undoes subtraction'}, not ${kind === 'div' ? 'division' : 'multiplication'}. The equation ${kind === 'div' ? 'divides' : 'multiplies'} by ${a}, so its inverse is ${kind === 'div' ? 'multiplication' : 'division'}.`,
      },
      {
        html: `${name} should have ${same} by ${a} on only one side.`,
        why: `Doing something to one side only unbalances the equation. The problem is the operation: ${name} needed the inverse, not the same operation.`,
      },
      {
        html: `There is no mistake. ${v} = ${wrongSol} is correct.`,
        why: `Check it: ${kind === 'div' ? `${wrongSol} ÷ ${a} = ${num(checkVal)}` : `${a} × ${wrongSol} = ${checkVal}`}, not ${b}. The answer does not make the equation true.`,
      },
    ];
    const sh = shuffleOptions(r, opts, 0);
    return {
      type: 'error',
      skill: kind === 'div' ? 'solve-div' : 'solve-mul',
      lesson: '8-3',
      title: 'Find the mistake',
      prompt: `<p>${name} solved ${hl(eq)} like this. What went wrong?</p>`,
      work,
      options: sh.options,
      answer: sh.answer,
      fix: { label: `Correct solution: ${v} = `, answer: sol },
      hints: [
        `Check ${name}'s answer by substituting: ${kind === 'div' ? `${wrongSol} ÷ ${a}` : `${a} × ${wrongSol}`} = ? Does it equal ${b}?`,
        `The equation ${kind === 'div' ? 'divides' : 'multiplies'} by ${a}. Doing the same operation again moves further from the answer. Use the inverse.`,
        `${inv === 'multiply' ? 'Multiply' : 'Divide'} both sides by ${a}: ${v} = ${b} ${kind === 'div' ? '×' : '÷'} ${a}.`,
      ],
      solution: `<p>${name} ${same} by ${a}, the same operation already in the equation. The inverse undoes it: ${inv} both sides by ${a}. ${v} = ${b} ${kind === 'div' ? '×' : '÷'} ${a} = <b>${sol}</b>. Check: ${kind === 'div' ? `${sol} ÷ ${a}` : `${a} × ${sol}`} = ${b}. ✓</p>`,
      feedback: {
        correct: `Correct. ${kind === 'div' ? 'Multiplying' : 'Dividing'} by ${a} undoes ${kind === 'div' ? 'dividing' : 'multiplying'} by ${a}, so ${v} = ${sol}.`,
        wrong(ans, d) {
          if (!d.mistakeOk)
            return (
              (sh.options[ans.mistake] && sh.options[ans.mistake].why) ||
              `Substitute ${wrongSol} back into the equation. It does not work, so find the operation that undoes ${kind === 'div' ? '÷' : '×'} ${a}.`
            );
          const f = parseNum(ans.fix);
          if (f === wrongSol) return `That is ${name}'s answer, which does not check. ${inv === 'multiply' ? 'Multiply' : 'Divide'}: ${b} ${kind === 'div' ? '×' : '÷'} ${a}.`;
          return `You found the mistake. Now ${inv} by ${a}: ${v} = ${b} ${kind === 'div' ? '×' : '÷'} ${a}.`;
        },
      },
    };
  });
})(typeof window !== 'undefined' ? window : globalThis);

/* js/units/u8/gen-write-ineq.js */
/* Zone 4 — Gate of Signs. Lesson 8-4 Write and Represent Inequalities. */
(function (root) {
  'use strict';
  const RX = root.RX;
  const { G, V, shuffleOptions, NAMES } = RX;
  const hl = V.hl;
  const SYMS = ['<', '>', '≤', '≥'];
  const PHRASES = {
    '>': ['is more than', 'is greater than', 'exceeds', 'is over'],
    '<': ['is less than', 'is fewer than', 'is under', 'is below'],
    '≥': ['is at least', 'is no less than', 'is greater than or equal to', 'is a minimum of'],
    '≤': ['is at most', 'is no more than', 'is less than or equal to', 'is a maximum of'],
  };
  const MEANING = {
    '>': 'more than (the number itself is not included)',
    '<': 'less than (the number itself is not included)',
    '≥': 'at least (the number itself is included)',
    '≤': 'at most (the number itself is included)',
  };
  const incl = (s) => s === '≤' || s === '≥';
  const right = (s) => s === '>' || s === '≥';
  const strictOf = (s) => (s === '≥' ? '>' : s === '≤' ? '<' : s);
  const inclOf = (s) => (s === '>' ? '≥' : s === '<' ? '≤' : s);
  const flipOf = (s) => ({ '<': '>', '>': '<', '≤': '≥', '≥': '≤' })[s];
  const toggleIncl = (s) => (incl(s) ? strictOf(s) : inclOf(s));
  const holds = (val, s, n) => (s === '<' ? val < n : s === '>' ? val > n : s === '≤' ? val <= n : val >= n);

  /** Real situations. Each returns {text, hard, v, n, sym, what}. `hard` is a trickier wording of the same rule. */
  const SITUATIONS = [
    (r) => {
      const n = r.pick([42, 44, 48, 52, 54]);
      return {
        text: `You must be at least ${n} inches tall to ride the sky-lift.`,
        hard: `Riders shorter than ${n} inches are not allowed on the sky-lift.`,
        v: 'h',
        n,
        sym: '≥',
        what: 'the height of a rider in inches',
      };
    },
    (r) => {
      const n = r.int(8, 15);
      return { text: `The lift car holds at most ${n} people.`, hard: `The lift car has a maximum of ${n} people.`, v: 'p', n, sym: '≤', what: 'the number of people in the lift car' };
    },
    (r) => {
      const n = r.pick([20, 25, 30, 35, 40]);
      return {
        text: `More than ${n} students signed up for the Keepers club.`,
        hard: `The number of students who signed up exceeds ${n}.`,
        v: 's',
        n,
        sym: '>',
        what: 'the number of students who signed up',
      };
    },
    (r) => {
      const n = r.int(5, 12);
      return { text: `Fewer than ${n} tickets are left for the show.`, hard: `The number of tickets left is under ${n}.`, v: 't', n, sym: '<', what: 'the number of tickets left' };
    },
    (r) => {
      const n = r.pick([50, 60, 65, 70, 75]);
      return {
        text: `You need a minimum of ${n} points to pass the Keeper's exam.`,
        hard: `A score below ${n} points does not pass the Keeper's exam.`,
        v: 'k',
        n,
        sym: '≥',
        what: 'a passing score in points',
      };
    },
    (r) => {
      const n = r.pick([15, 20, 25, 30]);
      return {
        text: `${r.pick(NAMES)} can spend no more than $${n} at the market.`,
        hard: `${r.pick(NAMES)}'s spending at the market cannot go over $${n}.`,
        v: 'm',
        n,
        sym: '≤',
        what: 'the money spent in dollars',
      };
    },
    (r) => {
      const n = r.pick([20, 25, 30, 35]);
      return {
        text: `The speed limit on the bridge is ${n} miles per hour.`,
        hard: `Carts may travel up to ${n} miles per hour on the bridge.`,
        v: 'r',
        n,
        sym: '≤',
        what: 'the speed of a cart in miles per hour',
      };
    },
    (r) => {
      const n = r.int(4, 9);
      return { text: `The team needs more than ${n} players to start a game.`, hard: `A game cannot start with ${n} or fewer players.`, v: 'g', n, sym: '>', what: 'the number of players' };
    },
    (r) => {
      const n = r.pick([32, 35, 40, 45]);
      return { text: `The storage room must stay below ${n} degrees.`, hard: `The storage room must never reach ${n} degrees.`, v: 'd', n, sym: '<', what: 'the temperature in degrees' };
    },
    (r) => {
      const n = r.int(10, 14);
      return { text: `Children no older than ${n} get a free library card.`, hard: `A free library card is for ages ${n} and under.`, v: 'a', n, sym: '≤', what: 'the age of a child in years' };
    },
  ];
  const situation = (r, hard) => {
    const s = r.pick(SITUATIONS)(r);
    s.shown = hard ? s.hard : s.text;
    s.ineq = `${s.v} ${s.sym} ${s.n}`;
    return s;
  };
  const whyWrong = (s, wrongSym) => {
    if (wrongSym === toggleIncl(s.sym))
      return incl(s.sym)
        ? `This leaves out ${s.n} itself. The rule includes ${s.n} (${s.n} is allowed), so the symbol needs the "or equal to" line: ${s.sym}.`
        : `This includes ${s.n} itself, but the rule does not allow exactly ${s.n}. Use the strict symbol ${s.sym}.`;
    if (wrongSym === flipOf(s.sym))
      return `This points the wrong way. The rule says the values are ${right(s.sym) ? 'bigger' : 'smaller'} than ${s.n}, so the open side of the symbol should face ${s.v}.`;
    return `This is the wrong direction and it ${incl(s.sym) ? 'leaves out' : 'includes'} ${s.n}. Read the key words again: ${MEANING[s.sym]}.`;
  };
  const graph = (n, sym, o) => {
    o = o || {};
    const lo = o.min != null ? o.min : n <= 5 ? 0 : n - 5;
    const hi = o.max != null ? o.max : lo + 10;
    return V.numberLine({
      min: lo,
      max: hi,
      step: 1,
      width: o.width || 420,
      ray: { v: n, open: !incl(sym), dir: right(sym) ? 'right' : 'left' },
      aria: o.aria || `Number line from ${lo} to ${hi} with ${incl(sym) ? 'a closed' : 'an open'} circle at ${n} and shading to the ${right(sym) ? 'right' : 'left'}`,
    });
  };

  // ---------- Phrase to symbol (cloze) ----------
  G.define('q4_phraseCloze', (r) => {
    const s1 = situation(r, false);
    let s2 = situation(r, false);
    for (let guard = 0; guard < 6 && (s2.v === s1.v || s2.sym === s1.sym); guard++) s2 = situation(r, false);
    const testVal = s1.n;
    const isSol = holds(testVal, s1.sym, s1.n);
    return {
      type: 'cloze',
      skill: 'write-ineq',
      lesson: '8-4',
      title: 'Choose the symbol',
      prompt: `<p>Two gate rules are written in words. Choose the inequality symbol that matches each rule, then decide whether the boundary number is a solution.</p><p>Rule 1: ${hl(s1.shown)} Let ${s1.v} = ${s1.what}.</p><p>Rule 2: ${hl(s2.shown)} Let ${s2.v} = ${s2.what}.</p>`,
      template: `Rule 1: ${s1.v} {0} ${s1.n}. Rule 2: ${s2.v} {1} ${s2.n}. For Rule 1, the value ${s1.v} = ${testVal} {2} a solution.`,
      choices: [SYMS.slice(), SYMS.slice(), ['is', 'is not']],
      answers: [SYMS.indexOf(s1.sym), SYMS.indexOf(s2.sym), isSol ? 0 : 1],
      hints: [
        'Key words tell you the symbol. "At least" and "no less than" mean ≥. "At most" and "no more than" mean ≤. "More than" means >. "Fewer than" or "less than" means <.',
        `Rule 1 means ${MEANING[s1.sym]}. Rule 2 means ${MEANING[s2.sym]}.`,
        `The boundary number ${s1.n} is a solution only when the symbol has the "or equal to" line (≤ or ≥).`,
      ],
      solution: `<p>Rule 1: "${s1.shown}" means ${MEANING[s1.sym]}, so <b>${s1.ineq}</b>. Rule 2: "${s2.shown}" means ${MEANING[s2.sym]}, so <b>${s2.ineq}</b>. For Rule 1, ${s1.v} = ${s1.n} <b>${isSol ? 'is' : 'is not'}</b> a solution because ${s1.sym} ${incl(s1.sym) ? 'includes' : 'does not include'} ${s1.n}.</p>`,
      feedback: {
        correct: `Correct. The words set the direction, and "at least / at most" add the "or equal to" line.`,
        wrong(ans, d) {
          if (d.wrong.includes(0)) return `Rule 1 means ${MEANING[s1.sym]}. Does the rule include ${s1.n} itself? Which way does the symbol open?`;
          if (d.wrong.includes(1)) return `Rule 2 means ${MEANING[s2.sym]}. Does the rule include ${s2.n} itself? Which way does the symbol open?`;
          return `Look at the symbol you chose for Rule 1. Only ≤ and ≥ include the boundary number.`;
        },
      },
    };
  });

  // ---------- Match phrases to inequalities (match) ----------
  G.define('q4_matchPhrases', (r) => {
    const v = r.pick(['x', 'n', 'y', 'w']);
    const n = r.int(3, 30);
    const left = SYMS.map((s) => `A number ${r.pick(PHRASES[s])} ${n}.`);
    const rightOrder = r.shuffle([0, 1, 2, 3]);
    const rightItems = rightOrder.map((i) => `${v} ${SYMS[i]} ${n}`);
    const pairs = SYMS.map((s, i) => [i, rightOrder.indexOf(i)]);
    return {
      type: 'match',
      skill: 'write-ineq',
      lesson: '8-4',
      title: 'Match words to inequalities',
      prompt: `<p>Match each sentence to its inequality. The variable ${hl(v)} stands for "a number."</p>`,
      left,
      right: rightItems,
      pairs,
      hints: [
        'First decide the direction: bigger than the number (> or ≥) or smaller (< or ≤).',
        'Then decide whether the number itself counts. "At least," "at most," "no more than," and "no less than" include it, so they use ≤ or ≥.',
        `"${left[0]}" means ${MEANING['<']}: ${v} < ${n}.`,
      ],
      solution: `<p>${SYMS.map((s, i) => `${left[i].replace(/\.$/, '')} → ${v} ${s} ${n}.`).join(' ')}</p>`,
      feedback: {
        correct: 'Correct. Direction first, then check whether the boundary number is included.',
        wrong(ans, d) {
          const i = d.wrong && d.wrong[0];
          return i != null ? `Look again at "${left[i]}". It means ${MEANING[SYMS[i]]}.` : 'Match the direction first, then decide whether the symbol needs the "or equal to" line.';
        },
      },
    };
  });

  // ---------- Sort phrases by symbol (sort) ----------
  G.define('q4_sortPhrases', (r) => {
    const v = r.pick(['x', 'n', 't', 'c']);
    const n = r.int(5, 40);
    const extra = r.pickN(SYMS, 2);
    const items = [];
    SYMS.forEach((s) => {
      const count = 1 + extra.filter((e) => e === s).length;
      r.pickN(PHRASES[s], count).forEach((ph) => items.push({ html: `A number ${ph} ${n}.`, bin: SYMS.indexOf(s) }));
    });
    const shuffled = r.shuffle(items);
    return {
      type: 'sort',
      skill: 'write-ineq',
      lesson: '8-4',
      title: 'Sort the phrases by symbol',
      prompt: `<p>Each phrase describes a number ${hl(v)}. Sort the phrases under the inequality they match.</p>`,
      bins: SYMS.map((s) => `${v} ${s} ${n}`),
      items: shuffled,
      hints: [
        'Two questions for each phrase: Is the number bigger or smaller than the boundary? Is the boundary itself allowed?',
        '"At least" and "no less than" allow the boundary and bigger values: ≥. "At most" and "no more than" allow the boundary and smaller values: ≤.',
        '"More than," "exceeds," and "over" are strictly bigger: >. "Less than," "fewer than," "under," and "below" are strictly smaller: <.',
      ],
      solution: `<p>${SYMS.map(
        (s, bi) =>
          `${v} ${s} ${n}: ${shuffled
            .filter((it) => it.bin === bi)
            .map((it) => it.html.replace(/\.$/, ''))
            .join('; ')}`,
      ).join('. ')}.</p>`,
      feedback: {
        correct: 'Correct. The key words set both the direction and whether the boundary is included.',
        wrong(ans, d) {
          const i = d.wrong && d.wrong[0];
          return i != null ? `Look again at "${shuffled[i].html}" It means ${MEANING[SYMS[shuffled[i].bin]]}.` : 'Decide the direction first, then whether the boundary number is included.';
        },
      },
    };
  });

  // ---------- Write an inequality for a situation (mc) ----------
  G.define('q4_writeSituation', (r, o) => {
    const hard = !!o.hard;
    const s = situation(r, hard);
    const opts = [
      { html: s.ineq, ok: true },
      { html: `${s.v} ${toggleIncl(s.sym)} ${s.n}`, why: whyWrong(s, toggleIncl(s.sym)) },
      { html: `${s.v} ${flipOf(s.sym)} ${s.n}`, why: whyWrong(s, flipOf(s.sym)) },
    ];
    if (hard) opts.push({ html: `${s.v} ${toggleIncl(flipOf(s.sym))} ${s.n}`, why: whyWrong(s, toggleIncl(flipOf(s.sym))) });
    else opts.push({ html: `${s.v} = ${s.n}`, why: `An equation has one solution. This rule allows many values of ${s.v}, so it needs an inequality, not an equals sign.` });
    const sh = shuffleOptions(r, opts, 0);
    return {
      type: 'mc',
      skill: 'write-ineq',
      lesson: '8-4',
      title: hard ? 'Write the inequality (tricky words)' : 'Write the inequality',
      prompt: `<p>${hl(s.shown)}</p><p>Let ${hl(s.v + ' = ' + s.what)}. Which inequality represents the rule?</p>`,
      options: sh.options,
      answer: sh.answer,
      hints: [
        hard
          ? `Rewrite the rule in your own words first. Which values of ${s.v} are allowed: values bigger than ${s.n}, or smaller? Is ${s.n} itself allowed?`
          : `Find the key words. They tell you the direction and whether ${s.n} itself is allowed.`,
        `The allowed values are ${right(s.sym) ? 'bigger' : 'smaller'} than ${s.n}${incl(s.sym) ? ', and ' + s.n + ' itself is allowed' : ', and ' + s.n + ' itself is not allowed'}.`,
        `${right(s.sym) ? 'Bigger' : 'Smaller'} values need ${right(s.sym) ? '> or ≥' : '< or ≤'}. ${incl(s.sym) ? 'Because ' + s.n + ' is allowed, use the symbol with the "or equal to" line.' : 'Because ' + s.n + ' is not allowed, use the strict symbol.'}`,
      ],
      solution: `<p>"${s.shown}" means ${s.v} is ${MEANING[s.sym]}. So the inequality is <b>${s.ineq}</b>. ${incl(s.sym) ? `${s.n} itself is a solution.` : `${s.n} itself is not a solution.`}</p>`,
      feedback: { correct: `Correct. ${s.ineq}: the direction matches the rule, and the symbol ${incl(s.sym) ? 'includes' : 'leaves out'} ${s.n}.` },
    };
  });

  // ---------- Graph to inequality (mc) ----------
  G.define('q4_graphToIneq', (r) => {
    const v = r.pick(['x', 'n', 'y', 'm']);
    const sym = r.pick(SYMS);
    const neg = r.chance(0.3);
    const lo = neg ? -5 : r.pick([0, 0, 5, 10]);
    const n = r.int(lo + 1, lo + 9);
    const mk = (s) => `${v} ${s} ${n}`;
    const opts = [
      { html: mk(sym), ok: true },
      {
        html: mk(toggleIncl(sym)),
        why: `The circle is ${incl(sym) ? 'closed (filled in), so ' + n + ' is a solution and the symbol needs the "or equal to" line' : 'open, so ' + n + ' is not a solution and the symbol must be strict'}: ${sym}.`,
      },
      {
        html: mk(flipOf(sym)),
        why: `The shading goes to the ${right(sym) ? 'right, toward bigger numbers' : 'left, toward smaller numbers'}. So ${v} is ${right(sym) ? 'greater' : 'less'} than ${n}: ${sym}.`,
      },
      {
        html: mk(toggleIncl(flipOf(sym))),
        why: `Both parts are off. The shading goes ${right(sym) ? 'right (greater)' : 'left (less)'}, and the circle is ${incl(sym) ? 'closed (includes ' + n + ')' : 'open (does not include ' + n + ')'}.`,
      },
    ];
    const sh = shuffleOptions(r, opts, 0);
    return {
      type: 'mc',
      skill: 'represent-ineq',
      lesson: '8-4',
      title: 'Read the graph',
      prompt: `<p>A gate shows this graph. Look at the circle (open or closed) and the direction of the shading.</p>${graph(n, sym, { min: lo, max: lo + 10 })}<p>Which inequality does the graph represent?</p>`,
      options: sh.options,
      answer: sh.answer,
      hints: [
        'The circle sits on the boundary number. Shading to the right means greater than; shading to the left means less than.',
        `The boundary is ${n}. The shading goes to the ${right(sym) ? 'right' : 'left'}, so the solutions are ${right(sym) ? 'greater' : 'less'} than ${n}.`,
        `The circle is ${incl(sym) ? 'closed, so ' + n + ' is included: use the symbol with the "or equal to" line' : 'open, so ' + n + ' is not included: use the strict symbol'}.`,
      ],
      solution: `<p>The boundary is ${n}. The shading goes to the ${right(sym) ? 'right (greater than)' : 'left (less than)'}, and the circle is ${incl(sym) ? 'closed, so ' + n + ' is included' : 'open, so ' + n + ' is not included'}. The graph shows <b>${mk(sym)}</b>.</p>`,
      feedback: {
        correct: `Correct. ${right(sym) ? 'Right' : 'Left'} shading means ${right(sym) ? 'greater' : 'less'} than, and the ${incl(sym) ? 'closed' : 'open'} circle means ${n} ${incl(sym) ? 'is' : 'is not'} a solution.`,
      },
    };
  });

  // ---------- Inequality to graph (mc with graphs as options) ----------
  G.define('q4_ineqToGraph', (r) => {
    const v = r.pick(['x', 'a', 't', 'k']);
    const sym = r.pick(SYMS);
    const lo = r.pick([0, 0, 5, 10, -5]);
    const n = r.int(lo + 2, lo + 8);
    const n2 = n + r.pick([-1, 1]);
    const g = (val, s) => graph(val, s, { min: lo, max: lo + 10, width: 300 });
    const opts = [
      { html: g(n, sym), ok: true },
      {
        html: g(n, toggleIncl(sym)),
        why: `${sym} ${incl(sym) ? 'includes' : 'does not include'} ${n}, so the circle must be ${incl(sym) ? 'closed (filled in)' : 'open'}. This graph has the wrong kind of circle.`,
      },
      {
        html: g(n, flipOf(sym)),
        why: `${v} ${sym} ${n} means ${v} is ${right(sym) ? 'greater' : 'less'} than ${n}, so shade toward the ${right(sym) ? 'right (bigger numbers)' : 'left (smaller numbers)'}. This graph is shaded the wrong way.`,
      },
      { html: g(n2, sym), why: `The circle must sit on the boundary number, ${n}. This graph puts it at ${n2}.` },
    ];
    const sh = shuffleOptions(r, opts, 0);
    return {
      type: 'mc',
      skill: 'represent-ineq',
      lesson: '8-4',
      title: 'Choose the graph',
      prompt: `<p>Which graph represents ${hl(`${v} ${sym} ${n}`)}?</p>`,
      options: sh.options,
      answer: sh.answer,
      layout: 'cards',
      hints: [
        'Three things to check: where the circle is, whether it is open or closed, and which way the shading goes.',
        `The boundary is ${n}, so the circle sits at ${n}. ${sym} ${incl(sym) ? 'includes' : 'does not include'} ${n}, so the circle is ${incl(sym) ? 'closed' : 'open'}.`,
        `${v} ${sym} ${n} means ${v} is ${right(sym) ? 'greater' : 'less'} than ${n}, so the shading goes to the ${right(sym) ? 'right' : 'left'}.`,
      ],
      solution: `${g(n, sym)}<p>Put ${incl(sym) ? 'a closed' : 'an open'} circle at ${n} because ${sym} ${incl(sym) ? 'includes' : 'does not include'} the boundary. Shade to the ${right(sym) ? 'right' : 'left'} because the solutions are ${right(sym) ? 'greater' : 'less'} than ${n}.</p>`,
      feedback: { correct: `Correct. ${incl(sym) ? 'Closed' : 'Open'} circle at ${n}, shaded to the ${right(sym) ? 'right' : 'left'}.` },
    };
  });

  // ---------- Does the graph show this inequality? (tf) ----------
  G.define('q4_tfGraph', (r) => {
    const v = r.pick(['x', 'n', 'p', 'w']);
    const sym = r.pick(SYMS);
    const lo = r.pick([0, 0, 5, -5]);
    const n = r.int(lo + 2, lo + 8);
    const match = r.chance(0.5);
    const kind = match ? 'ok' : r.pick(['circle', 'dir']);
    const gsym = kind === 'ok' ? sym : kind === 'circle' ? toggleIncl(sym) : flipOf(sym);
    const reasons = r.shuffle([
      {
        html: match
          ? `True. The circle at ${n} is ${incl(sym) ? 'closed, so ' + n + ' is included' : 'open, so ' + n + ' is not included'}, and the shading goes ${right(sym) ? 'right for greater than' : 'left for less than'}.`
          : kind === 'circle'
            ? `False. The circle is ${incl(gsym) ? 'closed' : 'open'}, but ${sym} ${incl(sym) ? 'includes' : 'does not include'} ${n}, so the circle should be ${incl(sym) ? 'closed' : 'open'}.`
            : `False. The shading goes ${right(gsym) ? 'right' : 'left'}, but ${v} ${sym} ${n} means ${v} is ${right(sym) ? 'greater' : 'less'} than ${n}, so it should go ${right(sym) ? 'right' : 'left'}.`,
        correct: true,
      },
      {
        html: match ? `False. A graph of an inequality needs a circle at 0, not at ${n}.` : `True. The circle is at ${n}, and that is all that matters.`,
        correct: false,
      },
      {
        html: match ? `False. The shading should go both ways because an inequality has many solutions.` : `True. Open and closed circles mean the same thing, and either direction of shading works.`,
        correct: false,
      },
    ]);
    return {
      type: 'tf',
      skill: 'represent-ineq',
      lesson: '8-4',
      title: 'Does the graph match?',
      prompt: `<p>${r.pick(NAMES)} says, "This graph represents ${hl(`${v} ${sym} ${n}`)}."</p>${graph(n, gsym, { min: lo, max: lo + 10 })}<p>Is that true?</p>`,
      answer: match,
      reasons,
      labels: ['True', 'False'],
      hints: [
        'Check three things: the boundary number, the kind of circle, and the direction of the shading.',
        `${v} ${sym} ${n}: the circle should be ${incl(sym) ? 'closed' : 'open'} at ${n}, and the shading should go ${right(sym) ? 'right' : 'left'}.`,
        `In the graph, the circle is ${incl(gsym) ? 'closed' : 'open'} and the shading goes ${right(gsym) ? 'right' : 'left'}. Compare.`,
      ],
      solution: `<p>${v} ${sym} ${n} needs ${incl(sym) ? 'a closed' : 'an open'} circle at ${n} with shading to the ${right(sym) ? 'right' : 'left'}. The graph has ${incl(gsym) ? 'a closed' : 'an open'} circle with shading to the ${right(gsym) ? 'right' : 'left'}. So the statement is <b>${match ? 'true' : 'false'}</b>${match ? '.' : kind === 'circle' ? ': the circle is wrong.' : ': the shading direction is wrong.'}</p>`,
      feedback: {
        correct: match ? 'Correct. Boundary, circle, and direction all match.' : `Correct. The ${kind === 'circle' ? 'circle type' : 'shading direction'} does not match ${v} ${sym} ${n}.`,
        wrong(ans, d) {
          if (!d.valueOk)
            return `Compare carefully. ${v} ${sym} ${n} needs ${incl(sym) ? 'a closed' : 'an open'} circle and shading to the ${right(sym) ? 'right' : 'left'}. Does the graph have both?`;
          return 'Your true/false is right, but the reason must name the circle type and the shading direction.';
        },
      },
    };
  });

  // ---------- Error: wrong circle or wrong direction (error) ----------
  G.define('q4_errorGraph', (r) => {
    const name = r.pick(NAMES);
    const v = r.pick(['x', 'n', 'y', 't']);
    const sym = r.pick(SYMS);
    const lo = r.pick([0, 0, 5, -5]);
    const n = r.int(lo + 2, lo + 8);
    const kind = r.pick(['circle', 'dir']);
    const gsym = kind === 'circle' ? toggleIncl(sym) : flipOf(sym);
    const ineq = `${v} ${sym} ${n}`;
    const fixAns = right(sym) ? (incl(sym) ? n : n + 1) : incl(sym) ? n : n - 1;
    const opts = [
      {
        html:
          kind === 'circle'
            ? `${name} used ${incl(gsym) ? 'a closed' : 'an open'} circle. ${sym} ${incl(sym) ? 'includes' : 'does not include'} ${n}, so the circle should be ${incl(sym) ? 'closed' : 'open'}.`
            : `${name} shaded toward the ${right(gsym) ? 'right' : 'left'}. ${ineq} means ${v} is ${right(sym) ? 'greater' : 'less'} than ${n}, so the shading should go ${right(sym) ? 'right' : 'left'}.`,
        ok: true,
      },
      {
        html: kind === 'circle' ? `${name} shaded the wrong direction.` : `${name} used the wrong kind of circle.`,
        why:
          kind === 'circle'
            ? `The shading goes ${right(gsym) ? 'right' : 'left'}, which is correct for ${sym}. Look at the circle instead: is ${n} a solution of ${ineq}?`
            : `The circle is ${incl(gsym) ? 'closed' : 'open'}, which is correct for ${sym}. Look at the direction instead: are solutions bigger or smaller than ${n}?`,
      },
      { html: `${name} put the circle at the wrong number.`, why: `The circle is at ${n}, which is the boundary in ${ineq}. That part is correct.` },
      {
        html: `There is no mistake.`,
        why:
          kind === 'circle'
            ? `Test ${n}: ${ineq} is ${holds(n, sym, n) ? 'true, so ' + n + ' must be included with a closed circle' : 'false, so ' + n + ' must be left out with an open circle'}. The graph shows the opposite.`
            : `Test a value on the shaded side, like ${right(gsym) ? n + 2 : n - 2}. Does it make ${ineq} true? It does not, so the shading is on the wrong side.`,
      },
    ];
    const sh = shuffleOptions(r, opts, 0);
    const fixLabel = `${right(sym) ? 'Smallest' : 'Largest'} whole number that IS a solution of ${ineq}: `;
    return {
      type: 'error',
      skill: 'represent-ineq',
      lesson: '8-4',
      title: 'Find the mistake in the graph',
      prompt: `<p>${name} graphed ${hl(ineq)} like this. What went wrong?</p>`,
      work: graph(n, gsym, { min: lo, max: lo + 10 }),
      options: sh.options,
      answer: sh.answer,
      fix: { label: fixLabel, answer: fixAns },
      hints: [
        `Check the circle and the direction separately. ${sym} ${incl(sym) ? 'includes' : 'does not include'} ${n}; solutions are ${right(sym) ? 'greater' : 'less'} than ${n}.`,
        kind === 'circle'
          ? `The shading direction is fine. Now look at the circle: should ${n} be filled in or left open?`
          : `The circle is fine. Now look at the shading: pick a number on the shaded side and test it in ${ineq}.`,
        `For the fix, ${incl(sym) ? n + ' itself is a solution.' : n + ' is not a solution, so move one whole number ' + (right(sym) ? 'up' : 'down') + '.'}`,
      ],
      solution: `${graph(n, sym, { min: lo, max: lo + 10 })}<p>${kind === 'circle' ? `The circle is wrong. ${sym} ${incl(sym) ? 'includes' : 'does not include'} ${n}, so the circle must be ${incl(sym) ? 'closed' : 'open'}.` : `The direction is wrong. ${ineq} means ${v} is ${right(sym) ? 'greater' : 'less'} than ${n}, so shade to the ${right(sym) ? 'right' : 'left'}.`} The ${right(sym) ? 'smallest' : 'largest'} whole-number solution is <b>${fixAns}</b>.</p>`,
      feedback: {
        correct: `Correct. ${ineq}: ${incl(sym) ? 'closed' : 'open'} circle at ${n}, shaded ${right(sym) ? 'right' : 'left'}.`,
        wrong(ans, d) {
          if (!d.mistakeOk) return (sh.options[ans.mistake] && sh.options[ans.mistake].why) || `Check the circle type and the shading direction against ${ineq}.`;
          const f = RX.parseNum(ans.fix);
          if (f === n && !incl(sym))
            return `${n} is the boundary, but ${sym} does not include it. The ${right(sym) ? 'smallest' : 'largest'} whole-number solution is one step ${right(sym) ? 'above' : 'below'} ${n}.`;
          return `You found the mistake. For the fix, test whole numbers near ${n} in ${ineq}.`;
        },
      },
    };
  });
})(typeof window !== 'undefined' ? window : globalThis);

/* js/units/u8/gen-graph-ineq.js */
/* Zone 5 — The Skybridge. Lesson 8-5 Understand Inequalities and Their Solutions. */
(function (root) {
  'use strict';
  const RX = root.RX;
  const { G, V, shuffleOptions, NAMES, round } = RX;
  const hl = V.hl;
  const SYMS = ['<', '>', '≤', '≥'];
  const incl = (s) => s === '≤' || s === '≥';
  const right = (s) => s === '>' || s === '≥';
  const flipOf = (s) => ({ '<': '>', '>': '<', '≤': '≥', '≥': '≤' })[s];
  const holds = (val, s, n) => (s === '<' ? val < n : s === '>' ? val > n : s === '≤' ? val <= n : val >= n);
  const words = (s) => (s === '<' ? 'less than' : s === '>' ? 'greater than' : s === '≤' ? 'less than or equal to' : 'greater than or equal to');
  const num = (x) => (Number.isInteger(x) ? String(x) : String(round(x, 2)));
  const dirWord = (s) => (right(s) ? 'right' : 'left');
  const circleWord = (s) => (incl(s) ? 'closed' : 'open');
  const graphHints = (v, sym, n) => [
    'Three steps: put the circle on the boundary number, choose open or closed from the symbol, then shade toward the solutions.',
    `The boundary is ${num(n)}. ${sym} ${incl(sym) ? 'includes' : 'does not include'} ${num(n)}, so the circle is ${circleWord(sym)}.`,
    `${v} ${sym} ${num(n)} means ${v} is ${words(sym)} ${num(n)}. Solutions are ${right(sym) ? 'bigger' : 'smaller'}, so shade to the ${dirWord(sym)}.`,
  ];
  const graphSolution = (v, sym, n) =>
    `<p>The boundary is ${num(n)}, so the circle goes at ${num(n)}. ${sym} ${incl(sym) ? 'includes' : 'does not include'} the boundary, so the circle is <b>${circleWord(sym)}</b>. ${v} ${sym} ${num(n)} means ${v} is ${words(sym)} ${num(n)}, so shade to the <b>${dirWord(sym)}</b>. Every shaded point is a solution, so the graph shows infinitely many solutions.</p>`;
  const graphWrong = (v, sym, n) => (ans, d) => {
    if (d.openOk === false)
      return `Check the circle. ${sym} ${incl(sym) ? 'includes ' + num(n) + ', so the circle must be closed (filled in).' : 'does not include ' + num(n) + ', so the circle must be open.'}`;
    if (d.dirOk === false) return `Check the direction. ${v} ${sym} ${num(n)} means ${v} is ${words(sym)} ${num(n)}. Those values are to the ${dirWord(sym)} of ${num(n)}.`;
    return `The circle sits on the boundary number, ${num(n)}.`;
  };
  const lineFor = (r, n, o) => {
    o = o || {};
    if (o.wide) return { min: 0, max: 20, step: 1, labelEvery: 2 };
    if (n < 0 || (o.allowNeg && r.chance(0.4))) return { min: -10, max: 10, step: 1, labelEvery: 2 };
    return { min: 0, max: 10, step: 1, labelEvery: 1 };
  };

  // ---------- Graph an inequality (ineq) ----------
  G.define('q5_graphIneq', (r, o) => {
    const hard = !!o.hard;
    const v = r.pick(['x', 'n', 'y', 'm']);
    const sym = r.pick(SYMS);
    const n = hard ? r.pick([r.int(-8, 8), r.int(11, 19)]) : r.int(1, 9);
    const line = n > 10 ? lineFor(r, n, { wide: true }) : hard ? { min: -10, max: 10, step: 1, labelEvery: 2 } : lineFor(r, n);
    return Object.assign(
      {
        type: 'ineq',
        skill: 'graph-ineq',
        lesson: '8-5',
        title: hard ? 'Graph the inequality (wider line)' : 'Graph the inequality',
        prompt: `<p>Light the Skybridge: graph ${hl(`${v} ${sym} ${n}`)} on the number line.</p><p class="muted">Choose the circle type, choose the shading direction, then click the boundary point.</p>`,
        point: n,
        open: !incl(sym),
        dir: dirWord(sym),
        hints: graphHints(v, sym, n),
        solution: graphSolution(v, sym, n),
        feedback: { correct: `Correct. ${circleWord(sym)[0].toUpperCase() + circleWord(sym).slice(1)} circle at ${n}, shaded to the ${dirWord(sym)}.`, wrong: graphWrong(v, sym, n) },
      },
      line,
    );
  });

  // ---------- Graph an inequality from a situation (ineq) ----------
  G.define('q5_graphContext', (r) => {
    const name = r.pick(NAMES);
    const s = r.pick([
      () => {
        const n = r.int(4, 9);
        return { text: `A game needs more than ${n} players to start.`, v: 'p', n, sym: '>', what: 'the number of players' };
      },
      () => {
        const n = r.int(6, 9);
        return { text: `${name} needs at least ${n} hours of sleep.`, v: 'h', n, sym: '≥', what: 'hours of sleep' };
      },
      () => {
        const n = r.int(3, 9);
        return { text: `Fewer than ${n} seats are left on the lift.`, v: 's', n, sym: '<', what: 'the number of seats left' };
      },
      () => {
        const n = r.int(5, 9);
        return { text: `The lift car holds at most ${n} people.`, v: 'c', n, sym: '≤', what: 'the number of people in the car' };
      },
      () => {
        const n = r.int(2, 8);
        return { text: `${name} can spend no more than $${n} on snacks.`, v: 'm', n, sym: '≤', what: 'dollars spent on snacks' };
      },
      () => {
        const n = r.int(3, 8);
        return { text: `A rider's bag must weigh under ${n} kilograms.`, v: 'w', n, sym: '<', what: 'the weight of a bag in kilograms' };
      },
      () => {
        const n = r.int(2, 7);
        return { text: `A Keeper must have a minimum of ${n} years of training.`, v: 't', n, sym: '≥', what: 'years of training' };
      },
    ])();
    const ineq = `${s.v} ${s.sym} ${s.n}`;
    return {
      type: 'ineq',
      skill: 'graph-ineq',
      lesson: '8-5',
      title: 'Graph the situation',
      prompt: `<p>${hl(s.text)} Let ${s.v} = ${s.what}.</p><p>Write the inequality in your head, then graph it on the number line.</p>`,
      min: 0,
      max: 10,
      step: 1,
      labelEvery: 1,
      point: s.n,
      open: !incl(s.sym),
      dir: dirWord(s.sym),
      hints: [`First turn the words into symbols. "${s.text}" means ${s.v} is ${words(s.sym)} ${s.n}: ${ineq}.`].concat(graphHints(s.v, s.sym, s.n).slice(1)),
      solution: `<p>"${s.text}" means <b>${ineq}</b>.</p>` + graphSolution(s.v, s.sym, s.n),
      feedback: {
        correct: `Correct. ${ineq}: ${circleWord(s.sym)} circle at ${s.n}, shaded to the ${dirWord(s.sym)}.`,
        wrong(ans, d) {
          if (d.openOk === false) return `Is exactly ${s.n} allowed by the rule? ${incl(s.sym) ? 'Yes, so the circle is closed.' : 'No, so the circle is open.'}`;
          if (d.dirOk === false) return `Think about which values the rule allows: ${right(s.sym) ? 'bigger' : 'smaller'} than ${s.n}. Shade that way.`;
          return `The boundary number in the rule is ${s.n}. Put the circle there.`;
        },
      },
    };
  });

  // ---------- Graph with the number written first: 5 < x (ineq) ----------
  G.define('q5_graphReversed', (r) => {
    const v = r.pick(['x', 'k', 'a', 'n']);
    const sym = r.pick(SYMS);
    const n = r.int(1, 9);
    const asVar = flipOf(sym);
    return {
      type: 'ineq',
      skill: 'graph-ineq',
      lesson: '8-5',
      title: 'Graph it: the number comes first',
      prompt: `<p>This gate is written with the number first: ${hl(`${n} ${sym} ${v}`)}.</p><p>Read it carefully, then graph the solutions.</p>`,
      min: 0,
      max: 10,
      step: 1,
      labelEvery: 1,
      point: n,
      open: !incl(sym),
      dir: dirWord(asVar),
      hints: [
        `${n} ${sym} ${v} says "${n} is ${words(sym)} ${v}." Flip it so the variable comes first: ${v} ${asVar} ${n}. The open side of the symbol always faces the bigger value.`,
        `${v} ${asVar} ${n} means ${v} is ${words(asVar)} ${n}. So shade to the ${dirWord(asVar)}.`,
        `${sym} ${incl(sym) ? 'includes' : 'does not include'} ${n}, so the circle is ${circleWord(sym)}.`,
      ],
      solution:
        `<p>${n} ${sym} ${v} means the same as <b>${v} ${asVar} ${n}</b>: ${v} is ${words(asVar)} ${n}. Reading it with the variable first keeps the direction straight.</p>` +
        graphSolution(v, asVar, n),
      feedback: {
        correct: `Correct. ${n} ${sym} ${v} is ${v} ${asVar} ${n}: ${circleWord(sym)} circle at ${n}, shaded ${dirWord(asVar)}.`,
        wrong(ans, d) {
          if (d.dirOk === false)
            return `The symbol faces the other way when ${v} is first. ${n} ${sym} ${v} means ${v} is ${words(asVar)} ${n}. Test a value: is ${right(asVar) ? n + 1 : n - 1} a solution? Shade toward values like it.`;
          if (d.openOk === false)
            return `Flipping the inequality does not change whether ${n} is included. ${sym} ${incl(sym) ? 'includes' : 'does not include'} it, so the circle is ${circleWord(sym)}.`;
          return `The boundary number is ${n}. Put the circle there.`;
        },
      },
    };
  });

  // ---------- Read a graph step by step (cloze) ----------
  G.define('q5_readGraphCloze', (r) => {
    const v = r.pick(['x', 'n', 'y', 'w']);
    const sym = r.pick(SYMS);
    const neg = r.chance(0.35);
    const n = neg ? r.int(-8, 8) : r.int(1, 9);
    const lo = neg ? -10 : 0,
      hi = neg ? 10 : 10;
    const boundaryChoices = r.shuffle([String(n), String(n + 1), String(n - 1)]);
    return {
      type: 'cloze',
      skill: 'graph-ineq',
      lesson: '8-5',
      title: 'Read the graph',
      prompt: `<p>A plank of the Skybridge is lit like this. Describe the graph, then write its inequality using the variable ${hl(v)}.</p>${V.numberLine({ min: lo, max: hi, step: 1, labelEvery: neg ? 2 : 1, width: 460, ray: { v: n, open: !incl(sym), dir: dirWord(sym) }, aria: `Number line from ${lo} to ${hi} with ${incl(sym) ? 'a closed' : 'an open'} circle at ${n} shaded to the ${dirWord(sym)}` })}`,
      template: `The boundary is {0}. The circle is {1}, so the boundary {2} a solution. The shading goes to the {3}, so the inequality is ${v} {4} ${n}.`,
      choices: [boundaryChoices, ['open', 'closed'], ['is', 'is not'], ['left', 'right'], SYMS.slice()],
      answers: [boundaryChoices.indexOf(String(n)), incl(sym) ? 1 : 0, incl(sym) ? 0 : 1, right(sym) ? 1 : 0, SYMS.indexOf(sym)],
      hints: [
        'The circle marks the boundary. A closed (filled) circle means the boundary is a solution; an open circle means it is not.',
        `Shading to the right means values greater than the boundary. Shading to the left means values less than it.`,
        `Put the pieces together: ${right(sym) ? 'greater' : 'less'} than, and ${incl(sym) ? 'including' : 'not including'} the boundary, gives ${sym}.`,
      ],
      solution: `<p>The boundary is <b>${n}</b>. The circle is <b>${circleWord(sym)}</b>, so ${n} <b>${incl(sym) ? 'is' : 'is not'}</b> a solution. The shading goes to the <b>${dirWord(sym)}</b>, so ${v} is ${words(sym)} ${n}: <b>${v} ${sym} ${n}</b>.</p>`,
      feedback: {
        correct: `Correct. ${circleWord(sym)} circle at ${n}, shaded ${dirWord(sym)}: ${v} ${sym} ${n}.`,
        wrong(ans, d) {
          if (d.wrong.includes(0)) return 'The boundary is the number under the circle.';
          if (d.wrong.includes(1) || d.wrong.includes(2)) return 'A filled-in circle is closed and includes the boundary. An open circle leaves it out.';
          if (d.wrong.includes(3)) return 'Look at which side of the circle is shaded.';
          return `Combine the direction (${right(sym) ? 'greater' : 'less'} than) with the circle (${incl(sym) ? 'includes' : 'does not include'} ${n}).`;
        },
      },
    };
  });

  // ---------- Select every solution (ms) ----------
  G.define('q5_selectSolutions', (r, o) => {
    const hard = !!o.hard;
    const v = r.pick(['x', 'n', 'y', 'k']);
    const sym = r.pick(SYMS);
    const n = hard ? r.int(3, 20) : r.int(3, 15);
    const ineq = `${v} ${sym} ${n}`;
    const side = right(sym) ? 1 : -1; // where the solutions live
    const pool = hard ? [n + side * 0.5, n - side * 0.5, n + side * 2.25, n - side * 1.5, n + side * 10, n - side * 3, 0, n + 100] : [n + side, n - side, n + side * 5, n - side * 3, 0, n + 20, n + side * 2];
    const extras = pool.filter((x, i, arr) => x >= 0 && x !== n && arr.indexOf(x) === i && x !== n + side && x !== n - side);
    // Always include the boundary, one value on the solution side, one on the other side, then two more.
    const vals = [n, n + side, n - side].filter((x) => x >= 0).concat(r.pickN(extras, 2));
    const opts = vals.map((val) => {
      const ok = holds(val, sym, n);
      let why;
      if (!ok) {
        if (val === n) why = `${n} is the boundary. ${sym} is a strict symbol, so ${n} itself is not a solution: ${n} ${sym} ${n} is false.`;
        else why = `Test it: ${num(val)} ${sym} ${n} is false. ${num(val)} is ${val > n ? 'greater' : 'less'} than ${n}, but solutions must be ${words(sym)} ${n}.`;
      }
      return ok ? { html: num(val), ok: true } : { html: num(val), why };
    });
    const okIdx = opts.map((op, i) => (op.ok ? i : -1)).filter((i) => i >= 0);
    const sh = shuffleOptions(r, opts, okIdx);
    return {
      type: 'ms',
      skill: 'test-ineq',
      lesson: '8-5',
      title: hard ? 'Select every solution (decimals)' : 'Select every solution',
      prompt: `<p>Which values are solutions of ${hl(ineq)}? Select every value that makes the inequality true.</p>`,
      options: sh.options,
      answers: sh.answers,
      hints: [
        `Substitute each value for ${v}. If the inequality is true, the value is a solution. Expect more than one.`,
        `${ineq} means ${v} is ${words(sym)} ${n}. Compare each value with ${n}.`,
        `Watch the boundary: ${n} ${sym} ${n} is ${holds(n, sym, n) ? 'true, so ' + n + ' counts' : 'false, so ' + n + ' does not count'}.`,
      ],
      solution: `<p>Solutions are values ${words(sym)} ${n}: <b>${vals
        .filter((val) => holds(val, sym, n))
        .map(num)
        .join(', ')}</b>. ${vals
        .filter((val) => !holds(val, sym, n))
        .map((val) => `${num(val)} ${sym} ${n} is false`)
        .join('; ')}.</p>`,
      feedback: {
        correct: `Correct. Every value ${words(sym)} ${n} is a solution.`,
        wrong(ans, d) {
          if (d.extra && d.extra.length) return sh.options[d.extra[0]].why || `${sh.options[d.extra[0]].html} does not make ${ineq} true.`;
          if (d.missing && d.missing.length) return `You missed ${sh.options[d.missing[0]].html}. Test it: ${sh.options[d.missing[0]].html} ${sym} ${n} is true.`;
          return `Test every value against ${ineq}.`;
        },
      },
    };
  });

  // ---------- Is the value a solution? (tf) ----------
  G.define('q5_isSolutionTf', (r) => {
    const v = r.pick(['x', 'n', 'm', 't']);
    const sym = r.pick(SYMS);
    const n = r.int(2, 18);
    const kind = r.pick(['boundary', 'boundary', 'near', 'decimal']);
    const test = kind === 'boundary' ? n : kind === 'near' ? n + r.pick([-1, 1]) : round(n + r.pick([-0.5, 0.5, 0.25, -0.75]), 2);
    const isSol = holds(test, sym, n);
    const ineq = `${v} ${sym} ${n}`;
    const reasons = r.shuffle([
      {
        html: `${isSol ? 'Yes' : 'No'}. Substitute: ${num(test)} ${sym} ${n} is ${isSol ? 'true' : 'false'}${test === n ? `, because ${sym} ${incl(sym) ? 'includes' : 'does not include'} the boundary` : ''}.`,
        correct: true,
      },
      {
        html:
          test === n
            ? `${isSol ? 'No' : 'Yes'}. The boundary number is ${isSol ? 'never' : 'always'} a solution.`
            : `${isSol ? 'No' : 'Yes'}. ${Number.isInteger(test) ? 'Only the boundary number is a solution.' : 'Decimals cannot be solutions of an inequality.'}`,
        correct: false,
      },
      { html: `${isSol ? 'No' : 'Yes'}. ${num(test)} is ${test > n ? 'bigger' : test < n ? 'smaller' : 'the same'}, so it ${isSol ? 'cannot' : 'must'} work.`, correct: false },
    ]);
    return {
      type: 'tf',
      skill: 'test-ineq',
      lesson: '8-5',
      title: 'Is it a solution?',
      prompt: `<p>Is ${hl(`${v} = ${num(test)}`)} a solution of ${hl(ineq)}?</p>`,
      answer: isSol,
      reasons,
      labels: ['Yes, a solution', 'No, not a solution'],
      hints: [
        `Substitute ${num(test)} for ${v} and read the statement: ${num(test)} ${sym} ${n}. Is it true?`,
        `${sym} means ${words(sym)}. ${test === n ? `The boundary ${n} counts only if the symbol has the "or equal to" line.` : `Compare ${num(test)} with ${n}.`}`,
        `${num(test)} ${sym} ${n} is ${isSol ? 'true' : 'false'}.`,
      ],
      solution: `<p>Substitute ${num(test)} for ${v}: ${num(test)} ${sym} ${n}. ${test === n ? `${sym} ${incl(sym) ? 'includes' : 'does not include'} the boundary, so this is ${isSol ? 'true' : 'false'}.` : `${num(test)} is ${test > n ? 'greater' : 'less'} than ${n}, so this is ${isSol ? 'true' : 'false'}.`} <b>${v} = ${num(test)} ${isSol ? 'is' : 'is not'} a solution.</b></p>`,
      feedback: {
        correct: `Correct. ${num(test)} ${sym} ${n} is ${isSol ? 'true' : 'false'}.`,
        wrong(ans, d) {
          if (!d.valueOk)
            return test === n
              ? `The boundary is the tricky case. ${sym} ${incl(sym) ? 'has the "or equal to" line, so ' + n + ' counts' : 'is strict, so ' + n + ' does not count'}.`
              : `Read it as a statement: ${num(test)} ${sym} ${n}. Decide if it is true.`;
          return 'Your yes/no is right, but the reason must come from substituting and reading the statement.';
        },
      },
    };
  });

  // ---------- Explain: infinitely many solutions (cr) ----------
  G.define('q5_infiniteCr', (r) => {
    const name = r.pick(NAMES);
    const v = r.pick(['x', 'n', 'y']);
    const sym = r.pick(SYMS);
    const n = r.int(2, 12);
    const ineq = `${v} ${sym} ${n}`;
    const ex1 = right(sym) ? n + 1 : n - 1,
      ex2 = right(sym) ? n + 0.5 : n - 0.5,
      ex3 = right(sym) ? n + 100 : 0;
    const claim = r.pick([
      { text: `"${ineq} has only one solution, just like an equation."`, fix: 'only one' },
      { text: `"${ineq} has exactly ${right(sym) ? 'a few' : n} solutions: the whole numbers."`, fix: 'whole numbers' },
    ]);
    const sh = shuffleOptions(
      r,
      [
        { html: `${ineq} has infinitely many solutions. Any number ${words(sym)} ${n} works, including decimals like ${num(ex2)}, and there is no end to them.`, ok: true },
        {
          html: `${ineq} has one solution, ${n}, because that is the number in the inequality.`,
          why: `${n} is the boundary, not "the answer." An inequality compares, so every value on one side of ${n} works. ${incl(sym) ? n + ' is one solution of many.' : n + ' is not even a solution here.'}`,
        },
        {
          html: `${ineq} has only whole-number solutions, like ${num(ex1)}.`,
          why: `Decimals and fractions count too. ${num(ex2)} ${sym} ${n} is true. Between any two solutions there are more solutions.`,
        },
      ],
      0,
    );
    return {
      type: 'cr',
      skill: 'ineq-reasoning',
      lesson: '8-5',
      title: 'Explain: how many solutions?',
      prompt: `<p>${name} says: ${hl(claim.text)}</p><p>Is ${name} right? Explain how many solutions ${ineq} has, and name at least two of them. Then choose the best explanation.</p>`,
      starters: [`${name} is not right because …`, `A solution of ${ineq} is any number that …`, `Two solutions are ${num(ex1)} and …`, 'An inequality is different from an equation because …'],
      minWords: 10,
      check: { prompt: 'Which explanation is correct?', options: sh.options, answer: sh.answer },
      hints: [
        `A solution is any value that makes ${ineq} true. Test ${num(ex1)}, ${num(ex2)}, and ${num(ex3)}.`,
        `${num(ex1)} ${sym} ${n}, ${num(ex2)} ${sym} ${n}, and ${num(ex3)} ${sym} ${n} are all true. Could you ever run out of values like these?`,
        `On the graph the shading goes on forever and includes every point, not just whole numbers. That is infinitely many solutions.`,
      ],
      solution: `<p>Model: "${name} is not right. ${ineq} is true for every number ${words(sym)} ${n}. For example, ${num(ex1)}, ${num(ex2)}, and ${num(ex3)} are all solutions. The shaded part of the graph goes on without end and includes decimals, so there are infinitely many solutions. An equation like ${v} = ${n} has one solution; an inequality describes a whole range."</p>`,
      feedback: {
        correct: 'Correct. An inequality is true for a whole range of values, so it has infinitely many solutions.',
        wrong(ans, d) {
          if (!d.wroteEnough) return 'Write a few complete sentences. Name at least two solutions and say why there is no last one.';
          return (sh.options[ans.check] && sh.options[ans.check].why) || `Test several values in ${ineq}, including a decimal.`;
        },
      },
    };
  });

  // ---------- Sort values: solution or not (sort) ----------
  G.define('q5_sortValues', (r) => {
    const v = r.pick(['x', 'n', 'p', 'w']);
    const sym = r.pick(SYMS);
    const n = r.int(3, 15);
    const ineq = `${v} ${sym} ${n}`;
    const candidates = [n, n + 1, n - 1, round(n + 0.5, 1), round(n - 0.5, 1), n + 4, n - 3, 0, n * 2].filter((x, i, arr) => x >= 0 && arr.indexOf(x) === i);
    let vals = [n].concat(
      r.pickN(
        candidates.filter((x) => x !== n),
        5,
      ),
    );
    const sols = vals.filter((x) => holds(x, sym, n));
    if (sols.length === 0 || sols.length === vals.length)
      vals = [n, right(sym) ? n + 1 : n - 1, right(sym) ? n - 1 : n + 1].concat(
        r.pickN(
          candidates.filter((x) => x !== n && x !== n + 1 && x !== n - 1),
          3,
        ),
      );
    const items = r.shuffle(vals.map((x) => ({ html: num(x), bin: holds(x, sym, n) ? 0 : 1 })));
    return {
      type: 'sort',
      skill: 'test-ineq',
      lesson: '8-5',
      title: 'Solution or not?',
      prompt: `<p>Sort each value. Does it make ${hl(ineq)} true?</p>`,
      bins: [`Solution of ${ineq}`, 'Not a solution'],
      items,
      hints: [
        `Substitute each value for ${v}. If ${ineq} becomes a true statement, the value is a solution.`,
        `${ineq} means ${v} is ${words(sym)} ${n}. Values ${right(sym) ? 'bigger' : 'smaller'} than ${n} are solutions.`,
        `The boundary ${n}: ${n} ${sym} ${n} is ${holds(n, sym, n) ? 'true (the symbol includes it)' : 'false (the symbol is strict)'}.`,
      ],
      solution: `<p>Solutions of ${ineq}: <b>${items
        .filter((i) => i.bin === 0)
        .map((i) => i.html)
        .join(', ')}</b>. Not solutions: ${items
        .filter((i) => i.bin === 1)
        .map((i) => i.html)
        .join(', ')}. The boundary ${n} ${holds(n, sym, n) ? 'counts because ' + sym + ' includes it' : 'does not count because ' + sym + ' is strict'}.</p>`,
      feedback: {
        correct: `Correct. Every value ${words(sym)} ${n} is a solution, and nothing else is.`,
        wrong(ans, d) {
          const i = d.wrong && d.wrong[0];
          if (i != null && items[i].html === String(n)) return `${n} is the boundary. ${sym} ${incl(sym) ? 'includes' : 'does not include'} it.`;
          return i != null ? `Test ${items[i].html}: is ${items[i].html} ${sym} ${n} true?` : `Test each value in ${ineq}.`;
        },
      },
    };
  });
})(typeof window !== 'undefined' ? window : globalThis);

/* js/units/u8/gen-cave.js */
/* Optional zone — The Undercroft. Harder, mixed-skill challenges across Unit 8. */
(function (root) {
  'use strict';
  const RX = root.RX;
  const { G, V, shuffleOptions, NAMES, money, round, parseNum } = RX;
  const hl = V.hl;
  const SYMS = ['<', '>', '≤', '≥'];
  const incl = (s) => s === '≤' || s === '≥';
  const right = (s) => s === '>' || s === '≥';
  const flipOf = (s) => ({ '<': '>', '>': '<', '≤': '≥', '≥': '≤' })[s];
  const words = (s) => (s === '<' ? 'less than' : s === '>' ? 'greater than' : s === '≤' ? 'less than or equal to' : 'greater than or equal to');
  const holds = (val, s, n) => (s === '<' ? val < n : s === '>' ? val > n : s === '≤' ? val <= n : val >= n);
  const num = (x) => (Number.isInteger(x) ? String(x) : String(round(x, 2)));
  const nearTo = (v, t) => v != null && Math.abs(v - t) < 0.001;
  const quarter = (r, lo, hi) => round(r.int(lo * 4, hi * 4) / 4, 2);
  const XP = 20;

  // ---------- Decimal pan balance (blanks) ----------
  G.define('qc_decimalBalance', (r) => {
    const v = r.pick(['x', 'w', 'c', 'm']);
    const kind = r.chance(0.5) ? 'add' : 'mul';
    let a, sol, b, left, eq, step, inv;
    if (kind === 'add') {
      a = quarter(r, 1, 12);
      sol = quarter(r, 2, 20);
      b = round(a + sol, 2);
      left = [num(a), v]; // weight first so the SVG labels never read as one long decimal
      eq = `${num(a)} + ${v} = ${num(b)}`;
      step = 'Subtract {0} from both sides.';
      inv = 'subtract';
    } else {
      a = r.int(2, 3);
      sol = quarter(r, 2, 15);
      b = round(a * sol, 2);
      left = Array.from({ length: a }, () => v);
      eq = `${a}${v} = ${num(b)}`;
      step = 'Divide both sides by {0}.';
      inv = 'divide by';
    }
    return {
      type: 'blanks',
      skill: 'balance-model',
      lesson: 'Challenge',
      xp: XP,
      title: 'Challenge: decimal balance',
      prompt: `<p>The scale is balanced. One pan holds ${kind === 'add' ? `a crate labeled ${hl(v)} and a weight of ${hl(num(a))}` : `${hl(a)} crates that each weigh ${hl(v)}`}. The other pan holds a weight of ${hl(num(b))}.</p>${V.balance({ left, right: [num(b)], aria: `Balanced scale showing ${eq}` })}<p>The scale shows ${hl(eq)}. Name the number to ${inv}, then find ${v}.</p>`,
      template: [eq, step, `${v} = {1}`],
      fields: [
        { answer: a, width: 'sm' },
        { answer: sol, width: 'sm' },
      ],
      hints: [
        kind === 'add'
          ? `A weight of ${num(a)} sits with the crate. Remove it from both pans: subtract ${num(a)} from both sides.`
          : `${a} equal crates weigh ${num(b)} together. Split ${num(b)} into ${a} equal parts: divide both sides by ${a}.`,
        kind === 'add'
          ? `${v} = ${num(b)} − ${num(a)}. Line up the decimal points when you subtract.`
          : `${v} = ${num(b)} ÷ ${a}. Dividing a decimal by a whole number works like whole-number division; keep the decimal point in place.`,
        kind === 'add' ? `${num(b)} − ${num(a)} is the weight of the crate.` : `${num(b)} ÷ ${a} is the weight of one crate.`,
      ],
      solution: `<p>${kind === 'add' ? `Subtract <b>${num(a)}</b> from both sides: ${v} = ${num(b)} − ${num(a)} = <b>${num(sol)}</b>. Check: ${num(sol)} + ${num(a)} = ${num(b)}.` : `Divide both sides by <b>${a}</b>: ${v} = ${num(b)} ÷ ${a} = <b>${num(sol)}</b>. Check: ${a} × ${num(sol)} = ${num(b)}.`} ✓ Decimals follow the same balance rule as whole numbers.</p>`,
      feedback: {
        correct: `Correct. ${kind === 'add' ? `Subtracting ${num(a)}` : `Dividing by ${a}`} leaves ${v} = ${num(sol)}.`,
        wrong(ans, d) {
          const second = parseNum(ans[1]);
          if (d.wrong.includes(0)) return kind === 'add' ? `Subtract the weight that shares the pan with ${v}: ${num(a)}.` : `Divide by the number of crates: ${a}.`;
          if (kind === 'add' && nearTo(second, b + a)) return `You added ${num(a)}. It is already on the pan with ${v}, so take it away: subtract.`;
          if (kind === 'mul' && nearTo(second, b * a)) return `You multiplied by ${a}. The crates are already multiplied; undo with division.`;
          if (kind === 'mul' && nearTo(second, b - a)) return `You subtracted ${a}. ${a}${v} means ${a} × ${v}, so divide by ${a}.`;
          return kind === 'add' ? `Compute ${num(b)} − ${num(a)} carefully. Line up the decimal points.` : `Compute ${num(b)} ÷ ${a} carefully. Keep the decimal point in place.`;
        },
      },
    };
  });

  // ---------- Fraction-of-a-whole story (num) ----------
  G.define('qc_fracEquation', (r) => {
    const name = r.pick(NAMES);
    const [a, b] = r.pick([
      [2, 3],
      [3, 4],
      [2, 5],
      [3, 5],
      [3, 8],
      [5, 6],
      [1, 4],
    ]);
    const k = r.int(3, 12);
    const c = a * k,
      sol = b * k;
    const v = r.pick(['n', 'p', 'g', 't']);
    const ctx = r.pick([
      { text: `${hl(`${a}/${b}`)} of the apprentices passed the Keeper's exam. ${hl(c)} apprentices passed.`, what: `${v} = the total number of apprentices`, unit: 'apprentices' },
      { text: `${name} has read ${hl(`${a}/${b}`)} of a book, which is ${hl(c + ' pages')}.`, what: `${v} = the number of pages in the book`, unit: 'pages' },
      { text: `A water tank is ${hl(`${a}/${b}`)} full. It holds ${hl(c + ' liters')} right now.`, what: `${v} = the liters a full tank holds`, unit: 'liters' },
      { text: `${hl(`${a}/${b}`)} of the gears in the Undercroft are brass. There are ${hl(c + ' brass gears')}.`, what: `${v} = the total number of gears`, unit: 'gears' },
      { text: `${name} hiked ${hl(`${a}/${b}`)} of a trail, which is ${hl(c + ' kilometers')}.`, what: `${v} = the length of the whole trail in kilometers`, unit: 'kilometers' },
    ]);
    return {
      type: 'num',
      skill: 'solve-mul',
      lesson: 'Challenge',
      xp: XP,
      title: 'Challenge: fraction of a whole',
      prompt: `<p>${ctx.text}</p><p>Let ${hl(ctx.what)}. The equation ${V.frac(a, b)}${v} = ${c} models this. Solve it.</p>`,
      answer: sol,
      unit: ctx.unit,
      hints: [
        `"${a}/${b} of ${v} is ${c}" means ${a}/${b} × ${v} = ${c}. Undo multiplying by a fraction by dividing by it, which is the same as multiplying by its reciprocal.`,
        `The reciprocal of ${a}/${b} is ${b}/${a}. ${v} = ${c} × ${b}/${a}.`,
        `${c} ÷ ${a} = ${k}, so one ${a === 1 ? 'part' : `of the ${a} parts`} is ${k}. The whole has ${b} parts: ${b} × ${k}.`,
      ],
      solution: `<p>${a}/${b} of ${v} is ${c}, so ${c} is ${a} ${a === 1 ? 'part' : 'equal parts'} out of ${b}. One part is ${c} ÷ ${a} = ${k}, and the whole is ${b} parts: ${b} × ${k} = <b>${sol}</b>. Or multiply by the reciprocal: ${c} × ${b}/${a} = ${sol}. Check: ${a}/${b} × ${sol} = ${c}. ✓</p>`,
      feedback: {
        correct: `Correct. If ${a} parts make ${c}, each part is ${k}, and ${b} parts make ${sol}.`,
        wrong(ans, d) {
          if (nearTo(d.value, (c * a) / b)) return `You found ${a}/${b} of ${c}. But ${c} is already ${a}/${b} of the whole. The whole is bigger: multiply by ${b}/${a}.`;
          if (nearTo(d.value, k)) return `${k} is one part (${c} ÷ ${a}). The whole has ${b} parts, so multiply ${k} by ${b}.`;
          if (nearTo(d.value, c * b)) return `${c} × ${b} = ${c * b} is a start, but you still need to divide by ${a}.`;
          return `${c} is ${a} of ${b} equal parts. Find one part (${c} ÷ ${a}), then find all ${b} parts.`;
        },
      },
    };
  });

  // ---------- Two-step story, one-step equation: choose the amount, the equation, and solve (cloze) ----------
  G.define('qc_whichEquations', (r) => {
    const name = r.pick(NAMES);
    const v = r.pick(['t', 'p', 'c']);
    const story = r.pick([
      () => {
        const k = r.int(2, 5),
          price = quarter(r, 2, 6),
          spent = round(k * price, 2),
          bill = spent < 10 ? 10 : spent < 20 ? 20 : 50,
          change = round(bill - spent, 2);
        return {
          text: `${name} bought ${hl(k + ' tickets')} at the same price. ${name} paid with a ${hl(money(bill))} bill and got ${hl(money(change))} in change.`,
          what: `${v} = the price of one ticket`,
          stepChoices: [
            `${money(bill)} − ${money(change)} = ${money(spent)}`,
            `${money(bill)} + ${money(change)} = ${money(round(bill + change, 2))}`,
            `${money(bill)} ÷ ${k} ${bill % k ? '≈' : '='} ${money(round(bill / k, 2))}`,
          ],
          stepWhy: ['', 'Change is money given back, so it comes off the bill. Subtract to find what was spent.', `The whole bill was not spent. First take off the change to find the amount spent.`],
          eqs: [`${k}${v} = ${num(spent)}`, `${k}${v} = ${bill}`, `${v} ÷ ${k} = ${num(spent)}`],
          eqWhy: ['', `${bill} was not all spent on tickets. The tickets cost ${num(spent)} in all.`, `${k} tickets at ${v} each is ${k} × ${v}, not ${v} ÷ ${k}.`],
          amount: spent,
          k,
          sol: price,
          op: 'divide',
          wrongSols: [round(spent * k, 2), round(bill / k, 2)],
          unit: 'dollars',
        };
      },
      () => {
        const k = r.int(3, 6),
          each = r.int(4, 12),
          kept = r.int(3, 9),
          total = k * each + kept;
        return {
          text: `${name} had ${hl(total + ' marbles')}, kept ${hl(kept)}, and shared the rest equally among ${hl(k + ' friends')}.`,
          what: `${v} = the number of marbles each friend got`,
          stepChoices: [`${total} − ${kept} = ${total - kept}`, `${total} + ${kept} = ${total + kept}`, `${total} ÷ ${k} ${total % k ? '≈' : '='} ${num(round(total / k, 2))}`],
          stepWhy: ['', `${name} kept ${kept}, so those marbles were not shared. Subtract them first.`, `Not all ${total} marbles were shared. Take off the ${kept} ${name} kept first.`],
          eqs: [`${k}${v} = ${total - kept}`, `${k}${v} = ${total}`, `${v} ÷ ${k} = ${total - kept}`],
          eqWhy: ['', `The ${kept} marbles ${name} kept were not shared. Only ${total - kept} were split.`, `${k} friends with ${v} each is ${k} × ${v}, not ${v} ÷ ${k}.`],
          amount: total - kept,
          k,
          sol: each,
          op: 'divide',
          wrongSols: [(total - kept) * k, round(total / k, 2)],
          unit: 'marbles',
        };
      },
      () => {
        const k = r.int(3, 8),
          rate = r.int(4, 12),
          start = r.int(5, 20),
          end = start + k * rate;
        return {
          text: `A lift started at a height of ${hl(start + ' meters')}. It rose at a steady rate for ${hl(k + ' minutes')} and reached ${hl(end + ' meters')}.`,
          what: `${v} = the meters the lift rose each minute`,
          stepChoices: [`${end} − ${start} = ${end - start}`, `${end} + ${start} = ${end + start}`, `${end} ÷ ${k} ${end % k ? '≈' : '='} ${num(round(end / k, 2))}`],
          stepWhy: ['', `The lift did not rise ${end} meters; it started at ${start}. Subtract the starting height.`, `${end} includes the starting height. Subtract ${start} before dividing.`],
          eqs: [`${k}${v} = ${end - start}`, `${k}${v} = ${end}`, `${v} ÷ ${k} = ${end - start}`],
          eqWhy: ['', `The lift started at ${start}, so it only rose ${end - start} meters.`, `${k} minutes at ${v} meters each is ${k} × ${v}, not ${v} ÷ ${k}.`],
          amount: end - start,
          k,
          sol: rate,
          op: 'divide',
          wrongSols: [(end - start) * k, round(end / k, 2)],
          unit: 'meters per minute',
        };
      },
    ])();
    const stepIdx = r.shuffle([0, 1, 2]);
    const eqIdx = r.shuffle([0, 1, 2]);
    const solList = r.shuffle([num(story.sol)].concat(story.wrongSols.map(num).filter((x) => x !== num(story.sol))));
    return {
      type: 'cloze',
      skill: 'write-equation',
      lesson: 'Challenge',
      xp: XP,
      title: 'Challenge: two steps, one equation',
      prompt: `<p>${story.text}</p><p>Let ${hl(story.what)}. First find the amount the equation should model, then choose the one-step equation and solve it.</p>`,
      template: `Step 1: {0}. Step 2: the equation is {1}. Step 3: ${story.op} both sides by ${story.k}. ${v} = {2}.`,
      choices: [stepIdx.map((i) => story.stepChoices[i]), eqIdx.map((i) => story.eqs[i]), solList],
      answers: [stepIdx.indexOf(0), eqIdx.indexOf(0), solList.indexOf(num(story.sol))],
      hints: [
        'Not every number in the story belongs in the equation. First figure out which amount was actually split into equal parts.',
        `The amount split into ${story.k} equal parts is ${num(story.amount)}. So ${story.k}${v} = ${num(story.amount)}.`,
        `Divide both sides by ${story.k}: ${v} = ${num(story.amount)} ÷ ${story.k}.`,
      ],
      solution: `<p>Step 1: <b>${story.stepChoices[0]}</b>. That is the amount split into ${story.k} equal parts. Step 2: <b>${story.eqs[0]}</b>. Step 3: divide both sides by ${story.k}: ${v} = ${num(story.amount)} ÷ ${story.k} = <b>${num(story.sol)}</b> ${story.unit}. Check: ${story.k} × ${num(story.sol)} = ${num(story.amount)}. ✓</p>`,
      feedback: {
        correct: `Correct. Only ${num(story.amount)} was split into ${story.k} equal parts, so ${v} = ${num(story.sol)}.`,
        wrong(ans, d) {
          if (d.wrong.includes(0)) return story.stepWhy[stepIdx[ans[0]]] || 'Which amount was actually split into equal parts? Work that out first.';
          if (d.wrong.includes(1)) return story.eqWhy[eqIdx[ans[1]]] || `Use the amount from Step 1 as the total of ${story.k} equal parts.`;
          if (solList[ans[2]] === num(story.wrongSols[0])) return `You multiplied. ${story.k}${v} = ${num(story.amount)} is undone by dividing by ${story.k}.`;
          return `Divide the Step 1 amount, ${num(story.amount)}, by ${story.k}.`;
        },
      },
    };
  });

  // ---------- Table of mixed one-step equations with decimals (table) ----------
  G.define('qc_tableSolutions', (r) => {
    const v = r.pick(['x', 'n', 'y', 'm']);
    const rowsSpec = r.shuffle(['add', 'sub', 'mul', 'div']).map((kind) => {
      if (kind === 'add') {
        const a = quarter(r, 1, 10),
          sol = quarter(r, 1, 20);
        return { eq: `${v} + ${num(a)} = ${num(round(a + sol, 2))}`, inv: `Subtract ${num(a)}`, sol, step: `${num(round(a + sol, 2))} − ${num(a)}` };
      }
      if (kind === 'sub') {
        const a = quarter(r, 1, 10),
          b = quarter(r, 1, 20);
        return { eq: `${v} − ${num(a)} = ${num(b)}`, inv: `Add ${num(a)}`, sol: round(a + b, 2), step: `${num(b)} + ${num(a)}` };
      }
      if (kind === 'mul') {
        const a = r.pick([2, 4, 5, 8]),
          sol = quarter(r, 1, 12);
        return { eq: `${a}${v} = ${num(round(a * sol, 2))}`, inv: `Divide by ${a}`, sol, step: `${num(round(a * sol, 2))} ÷ ${a}` };
      }
      const a = r.int(2, 9),
        b = r.pick([1.5, 2.5, 3.5, 4.5, 6.5, 0.5]);
      return { eq: `${v} ÷ ${a} = ${num(b)}`, inv: `Multiply by ${a}`, sol: round(a * b, 2), step: `${num(b)} × ${a}` };
    });
    const rows = [['Equation', 'Inverse operation', `${v} =`]].concat(rowsSpec.map((row, i) => [row.eq, row.inv, `__IN:s${i}__`]));
    const inputs = rowsSpec.map((row, i) => ({ id: `s${i}`, answer: row.sol }));
    return {
      type: 'table',
      skill: 'check-solution',
      lesson: 'Challenge',
      xp: XP,
      title: 'Challenge: four locks, four inverses',
      prompt: `<p>Each row is a lock. The inverse operation is given. Solve every equation for ${hl(v)}.</p>`,
      rows,
      header: true,
      inputs,
      hints: [
        'Apply the inverse operation to the number on the right side of each equation. That gives the solution.',
        `Row 1: ${rowsSpec[0].step}. Row 2: ${rowsSpec[1].step}.`,
        `Row 3: ${rowsSpec[2].step}. Row 4: ${rowsSpec[3].step}. Check each by substituting.`,
      ],
      solution: `<p>${rowsSpec.map((row) => `${row.eq} → ${row.step} = <b>${num(row.sol)}</b>`).join('. ')}. Each inverse undoes the operation in its equation.</p>`,
      feedback: {
        correct: 'Correct. Four equations, four inverses, four solutions that all check.',
        wrong(ans, d) {
          const id = d.wrong && d.wrong[0];
          const i = id ? Number(id.slice(1)) : 0;
          const row = rowsSpec[i];
          const got = parseNum(ans[id]);
          if (row && /Subtract/.test(row.inv) && got != null && got > row.sol) return `Row ${i + 1}: the equation adds, so subtract. ${row.step}.`;
          if (row && /Divide/.test(row.inv) && got != null && got > row.sol) return `Row ${i + 1}: the equation multiplies, so divide. ${row.step}.`;
          return row ? `Row ${i + 1}: ${row.inv.toLowerCase()} on the right side: ${row.step}.` : 'Apply each inverse to the right side.';
        },
      },
    };
  });

  // ---------- Match graphs to inequalities, including a reversed form and a decimal boundary (match) ----------
  G.define('qc_matchGraphs', (r) => {
    const v = r.pick(['x', 'n', 'k', 'y']);
    const bounds = r.pickN([1, 2, 3, 4, 5, 6, 7, 8, 9], 4);
    const forms = r.shuffle(['gt', 'le', 'rev', 'dec']);
    const specs = forms.map((f, i) => {
      const n = bounds[i];
      if (f === 'gt') return { text: `${v} > ${n}`, n, open: true, dir: 'right', read: `${v} is greater than ${n}` };
      if (f === 'le') return { text: `${v} ≤ ${n}`, n, open: false, dir: 'left', read: `${v} is less than or equal to ${n}` };
      if (f === 'rev') {
        const s = r.pick(['<', '≥']);
        return { text: `${n} ${s} ${v}`, n, open: s === '<', dir: s === '<' ? 'right' : 'left', read: `${n} ${words(s)} ${v}, so ${v} ${flipOf(s)} ${n}` };
      }
      const b = Math.min(n, 8) + 0.5;
      const s = r.pick(['<', '≥']);
      return { text: `${v} ${s} ${num(b)}`, n: b, open: s === '<', dir: s === '<' ? 'left' : 'right', read: `${v} is ${words(s)} ${num(b)}, halfway between ${Math.floor(b)} and ${Math.ceil(b)}` };
    });
    const letters = ['A', 'B', 'C', 'D'];
    const left = specs.map(
      (s, i) =>
        `<div class="muted">Graph ${letters[i]}</div>${V.numberLine({ min: 0, max: 10, step: 1, width: 300, ray: { v: s.n, open: s.open, dir: s.dir }, aria: `Graph ${letters[i]}: number line 0 to 10 with ${s.open ? 'an open' : 'a closed'} circle at ${num(s.n)} shaded to the ${s.dir}` })}`,
    );
    const rightOrder = r.shuffle([0, 1, 2, 3]);
    const rightItems = rightOrder.map((i) => specs[i].text);
    const pairs = specs.map((s, i) => [i, rightOrder.indexOf(i)]);
    return {
      type: 'match',
      skill: 'represent-ineq',
      lesson: 'Challenge',
      xp: XP,
      title: 'Challenge: match the graphs',
      prompt: `<p>Match each graph to its inequality. Watch for an inequality written with the number first, and for a boundary between two whole numbers.</p>`,
      left,
      right: rightItems,
      pairs,
      hints: [
        'For each graph note three things: the boundary number, open or closed circle, and the shading direction.',
        'When the number comes first, flip it so the variable is first. The open side of the symbol always faces the bigger value.',
        `A boundary like ${num(specs[forms.indexOf('dec')].n)} sits halfway between two tick marks.`,
      ],
      solution: `<p>${specs.map((s, i) => `Graph ${letters[i]} → ${s.text} (${s.read}; ${s.open ? 'open' : 'closed'} circle, shaded ${s.dir})`).join('. ')}.</p>`,
      feedback: {
        correct: 'Correct. Boundary, circle, and direction identify every graph.',
        wrong(ans, d) {
          const i = d.wrong && d.wrong[0];
          return i != null
            ? `Look again at Graph ${letters[i]}: ${specs[i].open ? 'open' : 'closed'} circle at ${num(specs[i].n)}, shaded to the ${specs[i].dir}. Which inequality says that?`
            : 'Check each graph for boundary, circle type, and direction.';
        },
      },
    };
  });

  // ---------- Graph a reversed inequality with a decimal boundary (ineq, step 0.5) ----------
  G.define('qc_ineqReversed', (r) => {
    const v = r.pick(['x', 'a', 'w', 'n']);
    const sym = r.pick(SYMS);
    const n = r.int(1, 8) + 0.5;
    const asVar = flipOf(sym);
    const dir = right(asVar) ? 'right' : 'left';
    return {
      type: 'ineq',
      skill: 'graph-ineq',
      lesson: 'Challenge',
      xp: XP,
      title: 'Challenge: decimal boundary, number first',
      prompt: `<p>Graph ${hl(`${num(n)} ${sym} ${v}`)} on the number line. The tick marks are every 0.5.</p>`,
      min: 0,
      max: 10,
      step: 0.5,
      labelEvery: 1,
      point: n,
      open: !incl(sym),
      dir,
      hints: [
        `Flip it so the variable comes first: ${num(n)} ${sym} ${v} means ${v} ${asVar} ${num(n)}. The open side of the symbol still faces the same value.`,
        `${v} ${asVar} ${num(n)}: solutions are ${words(asVar)} ${num(n)}, so shade to the ${dir}. ${sym} ${incl(sym) ? 'includes' : 'does not include'} ${num(n)}, so the circle is ${incl(sym) ? 'closed' : 'open'}.`,
        `${num(n)} is halfway between ${Math.floor(n)} and ${Math.ceil(n)}. Click the small tick between them.`,
      ],
      solution: `<p>${num(n)} ${sym} ${v} is the same as <b>${v} ${asVar} ${num(n)}</b>. The boundary ${num(n)} sits halfway between ${Math.floor(n)} and ${Math.ceil(n)}. The circle is <b>${incl(sym) ? 'closed' : 'open'}</b> because ${sym} ${incl(sym) ? 'includes' : 'does not include'} the boundary, and the shading goes to the <b>${dir}</b> because ${v} is ${words(asVar)} ${num(n)}.</p>`,
      feedback: {
        correct: `Correct. ${v} ${asVar} ${num(n)}: ${incl(sym) ? 'closed' : 'open'} circle at ${num(n)}, shaded ${dir}.`,
        wrong(ans, d) {
          if (d.dirOk === false) return `Read it with the variable first: ${v} ${asVar} ${num(n)}. Test ${right(asVar) ? num(n + 1) : num(n - 1)}: it is a solution, so shade toward it.`;
          if (d.openOk === false) return `${sym} ${incl(sym) ? 'has the "or equal to" line, so the circle is closed.' : 'is strict, so the circle is open.'}`;
          return `The boundary is ${num(n)}, the tick halfway between ${Math.floor(n)} and ${Math.ceil(n)}.`;
        },
      },
    };
  });

  // ---------- Error: words turned into the wrong symbol (error) ----------
  G.define('qc_errorIneqWords', (r) => {
    const name = r.pick(NAMES);
    const s = r.pick([
      (n) => ({ text: `You must be at least ${n} inches tall to ride.`, v: 'h', n, sym: '≥', what: 'height in inches' }),
      (n) => ({ text: `The lift holds no more than ${n} people.`, v: 'p', n, sym: '≤', what: 'number of people' }),
      (n) => ({ text: `A Keeper needs a minimum of ${n} points to pass.`, v: 'k', n, sym: '≥', what: 'points scored' }),
      (n) => ({ text: `The cart may carry at most ${n} kilograms.`, v: 'w', n, sym: '≤', what: 'kilograms carried' }),
      (n) => ({ text: `More than ${n} riders are waiting.`, v: 'r', n, sym: '>', what: 'number of riders' }),
      (n) => ({ text: `Fewer than ${n} seats are open.`, v: 'c', n, sym: '<', what: 'number of open seats' }),
    ])(r.int(6, 60));
    const trap = incl(s.sym) ? r.pick(['flip', 'strict']) : 'flipIncl';
    const wrongSym = trap === 'flip' ? flipOf(s.sym) : trap === 'strict' ? (s.sym === '≥' ? '>' : '<') : flipOf(s.sym) === '>' ? '≥' : '≤';
    const wrongIneq = `${s.v} ${wrongSym} ${s.n}`;
    const okIneq = `${s.v} ${s.sym} ${s.n}`;
    const okHtml =
      trap === 'flip'
        ? `${name} pointed the symbol the wrong way. "${s.sym === '≥' ? 'At least' : 'At most'}" means ${words(s.sym)}, so the allowed values are ${right(s.sym) ? 'bigger' : 'smaller'} than ${s.n}: ${okIneq}.`
        : trap === 'strict'
          ? `${name} dropped the "or equal to" line. The rule allows exactly ${s.n}, so the symbol must include it: ${okIneq}.`
          : `${name} got both parts wrong. The values are ${right(s.sym) ? 'bigger' : 'smaller'} than ${s.n}, and exactly ${s.n} is not allowed: ${okIneq}.`;
    const fixAns = right(s.sym) ? (incl(s.sym) ? s.n : s.n + 1) : incl(s.sym) ? s.n : s.n - 1;
    const sideVal = right(s.sym) ? s.n + 5 : Math.max(0, s.n - 5);
    const opts = [
      { html: okHtml, ok: true },
      { html: `${name} should have written an equation: ${s.v} = ${s.n}.`, why: `The rule allows many values, not just one. A range of values needs an inequality.` },
      {
        html: `${name} should have put the number first: ${s.n} ${wrongSym} ${s.v}.`,
        why: `Moving the number to the front without flipping the symbol changes the meaning again. The problem is the symbol, not the order.`,
      },
      {
        html: `There is no mistake. ${wrongIneq} matches the rule.`,
        why:
          incl(wrongSym) !== incl(s.sym)
            ? `Test exactly ${s.n}. The rule ${incl(s.sym) ? 'allows' : 'does not allow'} it, but ${wrongIneq} says it ${incl(wrongSym) ? 'is' : 'is not'} a solution. They disagree.`
            : `Test ${sideVal}. The rule allows it, but ${wrongIneq} says it is not a solution. They disagree.`,
      },
    ];
    const sh = shuffleOptions(r, opts, 0);
    return {
      type: 'error',
      skill: 'write-ineq',
      lesson: 'Challenge',
      xp: XP,
      title: 'Challenge: the words trap',
      prompt: `<p>Rule: ${hl(s.text)} ${name} let ${s.v} = ${s.what} and wrote this inequality.</p><p>What went wrong?</p>`,
      work: wrongIneq,
      options: sh.options,
      answer: sh.answer,
      fix: { label: `${right(s.sym) ? 'Smallest' : 'Largest'} whole number allowed by the rule: `, answer: fixAns },
      hints: [
        `Test the boundary. Is exactly ${s.n} allowed by the rule? ${incl(s.sym) ? 'Yes' : 'No'}. Does ${wrongIneq} agree?`,
        `Test a value on each side, like ${s.n + 5} and ${Math.max(0, s.n - 5)}. The rule allows ${right(s.sym) ? s.n + 5 : Math.max(0, s.n - 5)}. Does ${wrongIneq} agree?`,
        `The rule means ${s.v} is ${words(s.sym)} ${s.n}: ${okIneq}.`,
      ],
      solution: `<p>${okHtml} Check: ${s.n} ${s.sym} ${s.n} is ${holds(s.n, s.sym, s.n) ? 'true' : 'false'}, which matches the rule. The ${right(s.sym) ? 'smallest' : 'largest'} whole number allowed is <b>${fixAns}</b>.</p>`,
      feedback: {
        correct: `Correct. "${s.text}" is ${okIneq}.`,
        wrong(ans, d) {
          if (!d.mistakeOk) return (sh.options[ans.mistake] && sh.options[ans.mistake].why) || `Test ${s.n} and a value on each side against the rule, then against ${wrongIneq}.`;
          const f = parseNum(ans.fix);
          if (f === s.n && !incl(s.sym)) return `${s.n} itself is not allowed by the rule. Move one whole number ${right(s.sym) ? 'up' : 'down'}.`;
          return `You found the mistake. Use the correct inequality ${okIneq} to find the ${right(s.sym) ? 'smallest' : 'largest'} whole number allowed.`;
        },
      },
    };
  });

  // ---------- Order inequalities by their first whole-number solution (seq) ----------
  G.define('qc_seqSolutions', (r) => {
    const v = r.pick(['x', 'n', 'y', 't']);
    const firsts = r.pickN([2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], 4);
    const forms = r.shuffle(['gt', 'ge', 'rev', 'dec']);
    const items = firsts.map((f, i) => {
      const form = forms[i];
      if (form === 'gt') return { html: `${v} > ${f - 1}`, rate: f, read: `${v} > ${f - 1}: ${f - 1} is not included, so the first whole-number solution is ${f}` };
      if (form === 'ge') return { html: `${v} ≥ ${f}`, rate: f, read: `${v} ≥ ${f}: ${f} is included, so it is the first whole-number solution` };
      if (form === 'rev') return { html: `${f - 1} < ${v}`, rate: f, read: `${f - 1} < ${v} means ${v} > ${f - 1}, so the first whole-number solution is ${f}` };
      const s = r.pick(['>', '≥']);
      return { html: `${v} ${s} ${num(f - 0.5)}`, rate: f, read: `${v} ${s} ${num(f - 0.5)}: the first whole number past ${num(f - 0.5)} is ${f}` };
    });
    const asc = r.chance(0.5);
    const order = [0, 1, 2, 3].sort((a, b) => (asc ? items[a].rate - items[b].rate : items[b].rate - items[a].rate));
    return {
      type: 'seq',
      skill: 'ineq-reasoning',
      lesson: 'Challenge',
      xp: XP,
      title: 'Challenge: compare the solution sets',
      prompt: `<p>Every inequality below is true for all large values of ${hl(v)}, but each one starts at a different place. Find the <b>smallest whole number</b> that is a solution of each. Then order the inequalities from the ${asc ? '<b>smallest</b>' : '<b>largest</b>'} first whole-number solution (top) to the ${asc ? '<b>largest</b>' : '<b>smallest</b>'} (bottom).</p>`,
      items: items.map((it) => ({ html: it.html, rate: it.rate })),
      order,
      hints: [
        'Rewrite each inequality with the variable first. Then ask: is the boundary itself a solution? If not, the first whole-number solution is the next whole number up.',
        `For a decimal boundary like ${num(firsts[forms.indexOf('dec')] - 0.5)}, the first whole-number solution is the next whole number, ${firsts[forms.indexOf('dec')]}.`,
        `First whole-number solutions: ${items.map((it) => `${it.html} → ${it.rate}`).join('; ')}. Now order them.`,
      ],
      solution: `<p>${items.map((it) => it.read).join('. ')}. From ${asc ? 'smallest to largest' : 'largest to smallest'}: <b>${order.map((i) => items[i].html).join(', ')}</b>.</p>`,
      feedback: {
        correct: 'Correct. Comparing where each solution set begins is a way of comparing the sets themselves.',
        wrong() {
          return `Find the first whole-number solution of each: ${items.map((it) => `${it.html} → ${it.rate}`).join('; ')}. Then check the direction: ${asc ? 'smallest' : 'largest'} at the top.`;
        },
      },
    };
  });
})(typeof window !== 'undefined' ? window : globalThis);
