/* js/units/u8/gen-solutions.js */
/* Zone 1 — Hall of Balance. Lesson 8-1 Understand Equations and Their Solutions. */
(function (root) {
  'use strict';
  const RX = root.RX;
  const { G, V, shuffleOptions, NAMES, money, round } = RX;
  const hl = V.hl;
  const VARS = ['x', 'n', 'm', 'y', 'k', 't'];
  const n2 = (x) => round(x, 2);

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
    return finishEq(kind, a, b, sol, v, false);
  }

  /** Hard one-step equation: decimal constants or solutions, larger numbers, and sometimes the variable on the right (21.5 = x + 8). */
  function makeEqHard(r, v, kinds) {
    const kind = r.pick(kinds || ['add', 'sub', 'mul', 'div']);
    let a, sol, b;
    if (kind === 'add') {
      a = n2(r.int(21, 149) / 10);
      sol = n2(r.int(31, 260) / 10);
      b = n2(sol + a);
    } else if (kind === 'sub') {
      a = n2(r.int(21, 149) / 10);
      b = n2(r.int(31, 260) / 10);
      sol = n2(b + a);
    } else if (kind === 'mul') {
      a = r.int(3, 12);
      sol = r.int(4, 15) + 0.5;
      b = n2(a * sol);
    } else {
      a = r.int(4, 12);
      b = r.int(6, 20);
      sol = a * b;
    }
    return finishEq(kind, a, b, sol, v, r.chance(0.5));
  }

  function finishEq(kind, a, b, sol, v, flipped) {
    const lhsText = kind === 'add' ? `${v} + ${a}` : kind === 'sub' ? `${v} − ${a}` : kind === 'mul' ? `${a}${v}` : `${v} ÷ ${a}`;
    const text = flipped ? `${b} = ${lhsText}` : `${lhsText} = ${b}`;
    const lhs = (t) => n2(kind === 'add' ? t + a : kind === 'sub' ? t - a : kind === 'mul' ? a * t : t / a);
    const lhsStr = (t) => (kind === 'add' ? `${t} + ${a}` : kind === 'sub' ? `${t} − ${a}` : kind === 'mul' ? `${a} × ${t}` : `${t} ÷ ${a}`);
    const opName = kind === 'add' ? 'add' : kind === 'sub' ? 'subtract' : kind === 'mul' ? 'multiply by' : 'divide by';
    /** The value a student gets by using the SAME operation instead of the inverse (the classic slip). */
    const sameOp = kind === 'add' ? n2(b + a) : kind === 'sub' ? n2(b - a) : kind === 'mul' ? n2(b * a) : n2(b / a);
    return { kind, a, b, sol, text, lhs, lhsStr, opName, sameOp, flipped };
  }

  // ---------- Is the value a solution? (tf) ----------
  G.define('q1_isSolutionTf', (r, o) => {
    const hard = !!o.hard;
    const v = r.pick(VARS);
    const e = hard ? makeEqHard(r, v) : makeEq(r, v);
    const isSol = r.chance(0.5);
    let test = e.sol;
    if (!isSol) {
      const alts = hard
        ? [e.sameOp, n2(e.sol + 0.5), n2(e.sol - 1), n2(e.sol + 1)].filter((t) => t !== e.sol && t > 0)
        : [e.b, e.sol + r.int(1, 3), Math.max(1, e.sol - r.int(1, 3))].filter((t) => t !== e.sol && t > 0);
      // a subtraction check must not dip below zero (Grade 6 one-step equations stay non-negative)
      const safe = alts.filter((t) => e.kind !== 'sub' || t >= e.a);
      test = r.pick(safe.length ? safe : [e.sol + 1]);
    }
    const got = e.lhs(test);
    const side = e.flipped ? 'left' : 'right';
    const reasons = r.shuffle([
      { html: `${isSol ? 'Yes' : 'No'}. Substitute ${test} for ${v}: ${e.lhsStr(test)} = ${got}, which ${isSol ? 'equals' : 'is not'} ${e.b}.`, correct: true },
      { html: `${isSol ? 'No' : 'Yes'}. You can tell without substituting: ${test} is ${test < e.b ? 'smaller than' : test > e.b ? 'bigger than' : 'the same as'} ${e.b}.`, correct: false },
      { html: `${isSol ? 'No' : 'Yes'}. The solution has to be ${e.b}, because ${e.b} is the number alone on one side.`, correct: false },
    ]);
    return {
      type: 'tf',
      skill: 'solution-test',
      lesson: '8-1',
      title: hard ? 'Is it a solution? (decimals)' : 'Is it a solution?',
      prompt: `<p>A lock in the Hall reads ${hl(e.text)}.</p><p>Is ${hl(v + ' = ' + test)} a solution of the equation?</p>`,
      answer: isSol,
      reasons,
      labels: ['Yes, a solution', 'No, not a solution'],
      hints: [
        `A solution makes the equation true. To test a value, substitute it for ${v} and see if both sides match.`,
        `Replace ${v} with ${test}: the side with ${v} becomes ${e.lhsStr(test)}.`,
        `Work out ${e.lhsStr(test)}. Then compare your result with ${e.b} on the ${side} side.`,
      ],
      hintEs: `Una solución hace que la ecuación sea verdadera. Para comprobar un valor, sustitúyelo en lugar de ${v} y mira si los dos lados son iguales.`,
      solution: `<p>Substitute ${test} for ${v}: ${e.lhsStr(test)} = ${got}. The other side is ${e.b}. ${isSol ? `${got} = ${e.b}, so the equation is true and <b>${v} = ${test} is a solution</b>.` : `${got} ≠ ${e.b}, so the equation is false and <b>${v} = ${test} is not a solution</b>. The solution is ${v} = ${e.sol}.`}</p>`,
      feedback: {
        correct: `Correct. Substituting ${test} gives ${got}, and ${isSol ? 'that matches' : 'that does not match'} ${e.b} on the other side.`,
        wrong(ans, d) {
          if (!d.valueOk && ans.value === true && test === e.b)
            return `${e.b} is the number already on the other side, not the value of ${v}. Substitute ${test} for ${v} and compute ${e.lhsStr(test)} before you decide.`;
          if (!d.valueOk && ans.value === true) return `You said yes without the sides matching. Substitute ${test} for ${v}, compute ${e.lhsStr(test)}, and compare the result with ${e.b}.`;
          if (!d.valueOk) return `You said no, but substituting is the only way to know. Compute ${e.lhsStr(test)} and compare it with ${e.b}.`;
          return `Your yes/no is right, but the reason must come from substituting ${test} and comparing both sides, not from the size of the numbers.`;
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
        sol = kind === 'mul' ? r.int(2, 9) + 0.5 : kind === 'sub' ? r.int(12, 30) : r.int(3, 20);
      const b = round(kind === 'add' ? sol + a : kind === 'sub' ? sol - a : sol * a, 2);
      e = finishEq(kind, a, b, sol, v, r.chance(0.5));
    } else e = makeEq(r, v);
    const wrongPool = [];
    const push = (val, why) => {
      // skip values that would make a subtraction check negative (Grade 6 stays non-negative here)
      if (val > 0 && val !== e.sol && !(e.kind === 'sub' && val < e.a) && !wrongPool.some((w) => w.val === val)) wrongPool.push({ val: round(val, 2), why });
    };
    if (e.kind === 'add') {
      push(e.b + e.a, `That is ${e.b} + ${e.a}: you added instead of subtracting. Check it: ${e.lhsStr(round(e.b + e.a, 2))} = ${round(e.b + 2 * e.a, 2)}, not ${e.b}.`);
      push(e.b, `${e.b} is the other side of the equation, not the solution. ${e.lhsStr(e.b)} = ${round(e.lhs(e.b), 2)}.`);
    }
    if (e.kind === 'sub') {
      push(e.b - e.a, `That is ${e.b} − ${e.a}: you subtracted again instead of adding. Check it: ${e.lhsStr(round(e.b - e.a, 2))} = ${round(e.b - 2 * e.a, 2)}, not ${e.b}.`);
      push(e.b, `${e.b} is the other side, not the solution. ${e.lhsStr(e.b)} = ${round(e.lhs(e.b), 2)}.`);
    }
    if (e.kind === 'mul') {
      push(round(e.b * e.a, 2), `That is ${e.b} × ${e.a}: you multiplied again instead of dividing. Check it: ${e.lhsStr(round(e.b * e.a, 2))} is much bigger than ${e.b}.`);
      push(e.b - e.a, `That is ${e.b} − ${e.a}. Subtracting does not undo multiplying. ${e.lhsStr(round(e.b - e.a, 2))} = ${round(e.lhs(e.b - e.a), 2)}.`);
    }
    if (e.kind === 'div') {
      push(e.b / e.a, `That is ${e.b} ÷ ${e.a}: you divided again instead of multiplying. Check it: ${e.lhsStr(round(e.b / e.a, 2))} = ${round(e.lhs(e.b / e.a), 2)}, not ${e.b}.`);
      push(e.b + e.a, `That is ${e.b} + ${e.a}. Adding does not undo dividing. ${e.lhsStr(e.b + e.a)} = ${round(e.lhs(e.b + e.a), 2)}.`);
    }
    push(e.sol + 1, `Close, but check it: ${e.lhsStr(round(e.sol + 1, 2))} = ${round(e.lhs(e.sol + 1), 2)}, which is not ${e.b}.`);
    push(e.sol - 1, `Close, but check it: ${e.lhsStr(round(e.sol - 1, 2))} = ${round(e.lhs(e.sol - 1), 2)}, which is not ${e.b}.`);
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
      hintEs: `Sustituye cada valor en lugar de ${v}. La solución es el valor que hace que los dos lados sean iguales.`,
      solution: `<p>Test each value. ${e.lhsStr(e.sol)} = ${e.b}, so <b>${v} = ${e.sol}</b> is the solution. ${wrongs
        .slice(0, 2)
        .map((w) => `${e.lhsStr(w.val)} = ${round(e.lhs(w.val), 2)}`)
        .join(' and ')}, so those values do not work.</p>`,
      feedback: {
        correct: `Correct. Only ${e.sol} makes ${e.text} true.`,
        wrong(ans, d) {
          if (d.extra && d.extra.length) return sh.options[d.extra[0]].why || `${sh.options[d.extra[0]].html} does not make the equation true. Substitute and check.`;
          return `You missed the solution. Substitute each value for ${v} until the side with ${v} equals ${e.b}.`;
        },
      },
    };
  });

  // ---------- Substitute and decide (cloze) ----------
  G.define('q1_substituteCloze', (r, o) => {
    const hard = !!o.hard;
    const v = r.pick(VARS);
    const e = hard ? makeEqHard(r, v, ['add', 'sub', 'mul']) : makeEq(r, v, ['add', 'sub', 'mul']);
    const isSol = r.chance(0.5);
    const test = isSol ? e.sol : r.pick((hard ? [n2(e.sol + 0.5), n2(e.sol - 0.5), n2(e.sol + 1)] : [e.sol + 1, e.sol + 2, e.sol - 1]).filter((t) => t > 0));
    const got = e.lhs(test);
    // distractors: the same-operation slip (e.g. subtracting when the equation adds), an off-by-one, and the other side of the equation
    const slip = e.kind === 'add' ? n2(test - e.a) : e.kind === 'sub' ? n2(test + e.a) : n2(test + e.a);
    const alts = [got, slip, hard ? n2(got + 1) : got + (e.kind === 'mul' ? e.a : 1), n2(got - 1), e.b].filter((x, i, arr) => arr.indexOf(x) === i && x > 0).slice(0, hard ? 4 : 3);
    const c0 = r.shuffle(alts.map(String));
    return {
      type: 'cloze',
      skill: 'solution-test',
      lesson: '8-1',
      title: hard ? 'Substitute to check (decimals)' : 'Substitute to check',
      prompt: `<p>Equation: ${hl(e.text)}. Test whether ${hl(v + ' = ' + test)} is a solution. Complete the check.</p>`,
      template: `Substitute ${test} for ${v}: ${e.lhsStr(test)} = {0}. The other side is ${e.b}. The two sides are {1}, so ${v} = ${test} {2} a solution.`,
      choices: [c0, ['equal', 'not equal'], ['is', 'is not']],
      answers: [c0.indexOf(String(got)), isSol ? 0 : 1, isSol ? 0 : 1],
      hints: [
        `Substituting means replacing the variable with the number. Compute the side with ${v}, using ${test} in place of ${v}.`,
        `Work out ${e.lhsStr(test)}. Then compare it to the other side, ${e.b}.`,
        `If the two sides are the same number, the equation is true. If they are different, it is false.`,
      ],
      hintEs: `Sustituir significa reemplazar la variable por el número. Calcula el lado que tiene ${v}, usando ${test} en lugar de ${v}.`,
      solution: `<p>${e.lhsStr(test)} = <b>${got}</b>. The other side is ${e.b}. The sides are <b>${isSol ? 'equal' : 'not equal'}</b>, so ${v} = ${test} <b>${isSol ? 'is' : 'is not'}</b> a solution.</p>`,
      feedback: {
        correct: `Correct. Substitute, compute, compare: ${got} ${isSol ? '=' : '≠'} ${e.b}.`,
        wrong(ans, d) {
          const picked = c0[ans[0]];
          if (d.wrong.includes(0) && picked === String(e.b) && e.b !== got) return `${e.b} is the other side of the equation. The first blank asks for the value of ${e.lhsStr(test)}. Compute it.`;
          if (d.wrong.includes(0) && picked === String(slip)) return `Look at the operation sign. The equation says ${e.lhsStr(test)}, so use that operation, not its inverse.`;
          if (d.wrong.includes(0)) return `Recompute the side with ${v}: ${e.lhsStr(test)}. Line up the decimal points if there are any.`;
          if (d.wrong.includes(1)) return `Compare the two numbers: is ${got} exactly the same as ${e.b}?`;
          return `Your last choice must agree with your comparison: equal sides mean the value is a solution, unequal sides mean it is not.`;
        },
      },
    };
  });

  // ---------- Pan balance to equation (mc) ----------
  G.define('q1_balanceEquation', (r, o) => {
    const hard = !!o.hard;
    const v = r.pick(VARS);
    const varLeft = r.chance(0.6);
    let a, sol, b, varPan, otherPan, correct, opts;
    if (!hard) {
      a = r.int(2, 9);
      sol = r.int(2, 12);
      b = a + sol;
      varPan = [v, String(a)];
      otherPan = [String(b)];
      correct = varLeft ? `${v} + ${a} = ${b}` : `${b} = ${v} + ${a}`;
      opts = [
        { html: correct, ok: true },
        { html: varLeft ? `${v} − ${a} = ${b}` : `${b} = ${v} − ${a}`, why: `The ${v} block and the ${a} block sit together on the same pan. Weights on one pan are added, not subtracted.` },
        { html: varLeft ? `${a}${v} = ${b}` : `${b} = ${a}${v}`, why: `${a}${v} means ${a} copies of ${v}. The pan holds one ${v} block and one ${a} block, so they are added: ${v} + ${a}.` },
        { html: varLeft ? `${v} + ${b} = ${a}` : `${a} = ${v} + ${b}`, why: `The ${b} block is alone on its pan. The ${a} block shares a pan with ${v}, so ${a} is added to ${v}.` },
      ];
    } else {
      // hard: decimal weights, and the other pan holds TWO known blocks that must be combined
      a = r.int(2, 9) + 0.5;
      const c1 = r.int(Math.ceil(a) + 1, 15),
        c2 = r.int(2, 9) + r.pick([0.5, 0.25, 0.75]);
      b = n2(c1 + c2);
      sol = n2(b - a);
      varPan = [v, String(a)];
      otherPan = [String(c1), String(c2)];
      correct = varLeft ? `${v} + ${a} = ${n2(c1 + c2)}` : `${n2(c1 + c2)} = ${v} + ${a}`;
      opts = [
        { html: correct, ok: true },
        { html: varLeft ? `${v} = ${c1} + ${c2}` : `${c1} + ${c2} = ${v}`, why: `This leaves out the ${a} block. It sits on the same pan as ${v}, so that side is ${v} + ${a}.` },
        {
          html: varLeft ? `${v} + ${a} + ${c1} = ${c2}` : `${c2} = ${v} + ${a} + ${c1}`,
          why: `The ${c1} block is on the other pan with ${c2}. Blocks keep their own pan, so ${c1} and ${c2} are added together on one side.`,
        },
        { html: varLeft ? `${v} − ${a} = ${n2(c1 + c2)}` : `${n2(c1 + c2)} = ${v} − ${a}`, why: `The ${a} block is added to ${v} on its pan. Nothing is taken away, so the sign is +, not −.` },
      ];
    }
    const left = varLeft ? varPan : otherPan;
    const right = varLeft ? otherPan : varPan;
    const sh = shuffleOptions(r, opts, 0);
    const otherWords = otherPan.length === 2 ? `blocks labeled ${hl(otherPan[0])} and ${hl(otherPan[1])}` : `a block labeled ${hl(otherPan[0])}`;
    return {
      type: 'mc',
      skill: 'write-equation',
      lesson: '8-1',
      title: hard ? 'Read the balance (combine the blocks)' : 'Read the balance',
      prompt: `<p>The scale is balanced. One pan holds a block labeled ${hl(v)} and a block labeled ${hl(a)}. The other pan holds ${otherWords}.</p>${V.balance({ left, right, aria: `Balanced scale: ${left.join(' and ')} on the left, ${right.join(' and ')} on the right` })}<p>Which equation does the balance show?</p>`,
      options: sh.options,
      answer: sh.answer,
      hints: [
        'A balanced scale is an equation. Each pan is one side of the equals sign.',
        `Blocks on the same pan are added together. One pan has ${v} and ${a}, so that side is ${v} + ${a}.`,
        otherPan.length === 2 ? `Add the blocks on the other pan: ${otherPan[0]} + ${otherPan[1]}. Then set the two sides equal.` : `The other pan has only ${b}. Set the two sides equal.`,
      ],
      hintEs: 'Una balanza en equilibrio es una ecuación. Cada platillo es un lado del signo igual. Los bloques en el mismo platillo se suman.',
      solution: `<p>Each pan is one side of the equation. The pan with ${v} and ${a} is ${v} + ${a}. The other pan is ${otherPan.length === 2 ? `${otherPan[0]} + ${otherPan[1]} = ${b}` : b}. The scale is balanced, so <b>${correct}</b>. (The solution is ${v} = ${sol}, because ${sol} + ${a} = ${b}.)</p>`,
      feedback: {
        correct: `Correct. Blocks on one pan add together, and a balanced scale means the two sides are equal.`,
        wrong(ans) {
          const op = sh.options[ans];
          return (op && op.why) || 'Write one side for each pan. Blocks on the same pan are added.';
        },
      },
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
          text: hard ? `After spending ${m$(a)} at the market, ${name} has ${m$(b)} left.` : `${name} had some money. ${name} spent ${m$(a)} and has ${m$(b)} left.`,
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
          text: hard
            ? `${name} now has ${m$(b)} saved, after adding ${m$(a)} this month to what was saved last month.`
            : `${name} saved some money last month. This month ${name} saved ${m$(a)} more, for a total of ${m$(b)}.`,
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
        const n = hard ? r.int(6, 12) : r.int(3, 8),
          s = hard ? r.int(12, 25) : r.int(4, 12),
          T = n * s;
        return {
          text: hard
            ? `Each of ${n} friends ended up with the same number of stickers after ${name} split a pack of ${T} stickers among them.`
            : `${name} shared ${T} stickers equally among ${n} friends. Each friend got the same number of stickers.`,
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
          text: hard
            ? `${name} biked ${b} miles in all today. ${a} of those miles came after lunch. The rest came before lunch.`
            : `${name} biked some miles before lunch and ${a} miles after lunch. ${name} biked ${b} miles in all.`,
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
          b = hard ? round(k * (r.int(2, 12) + 0.5), 2) : k * r.int(2, 12);
        return {
          text: hard ? `The product of ${k} and a number is ${b}.` : `${k} times a number is ${b}.`,
          varDef: `${V1} = the number`,
          ok: `${k}${V1} = ${b}`,
          wrongs: [
            [`${V1} + ${k} = ${b}`, `"${hard ? 'Product' : 'Times'}" means multiplication. ${k} times a number is ${k}${V1}, not ${V1} + ${k}.`],
            [`${V1} ÷ ${k} = ${b}`, `"${hard ? 'The product of ' + k + ' and a number' : k + ' times a number'}" is multiplication. ${V1} ÷ ${k} would be "a number divided by ${k}".`],
            [`${k} + ${V1} = ${b}`, `"${hard ? 'Product' : 'Times'}" is multiplication, not addition. ${k} + ${V1} would be the sum.`],
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
      title: hard ? 'Write the equation (read carefully)' : 'Write the equation',
      prompt: `<p>${s.text}</p><p>Let ${hl(s.varDef)}. Which equation represents the situation?</p>`,
      options: sh.options,
      answer: sh.answer,
      hints: [
        'Find the unknown (that is the variable), the operation the story describes, and the result.',
        `Ask: is something being added, taken away, or made into equal groups? Then ask which number is the total or result.`,
        `Put the numbers in the order the story happens, even if the sentence tells the end first. The result goes alone on one side.`,
      ],
      hintEs: 'Busca lo desconocido (esa es la variable), la operación que describe la historia y el resultado.',
      solution: `<p>${s.varDef}. The story describes ${/−/.test(s.ok) ? 'something being taken away, so subtract' : /\+/.test(s.ok) ? 'two amounts being combined, so add' : 'equal groups, so multiply'}. The equation is <b>${s.ok}</b>.</p>`,
      feedback: {
        correct: `Correct. ${s.ok} matches the story: the variable is the unknown, and the operation matches what happened.`,
        wrong(ans) {
          const op = sh.options[ans];
          return (op && op.why) || 'Decide the operation from the story first, then put the result alone on one side.';
        },
      },
    };
  });

  // ---------- Match phrases to equations (match) ----------
  G.define('q1_matchSituations', (r, o) => {
    const hard = !!o.hard;
    const v = r.pick(VARS);
    const a = hard ? r.int(2, 9) + 0.5 : r.int(2, 9),
      b = hard ? r.int(12, 40) : r.int(a + 1, 30);
    const phr = hard
      ? {
          add: r.pick([`${b} is ${a} more than a number`, `${b} is the sum of a number and ${a}`]),
          sub: r.pick([`${a} less than a number is ${b}`, `${b} is ${a} less than a number`]),
          mul: r.pick([`${b} is the product of ${a} and a number`, `${a} times a number is ${b}`]),
          div: r.pick([`${b} is the quotient of a number and ${a}`, `A number divided by ${a} is ${b}`]),
        }
      : {
          add: r.pick([`${a} more than a number is ${b}`, `The sum of a number and ${a} is ${b}`, `A number increased by ${a} is ${b}`]),
          sub: r.pick([`${a} less than a number is ${b}`, `A number decreased by ${a} is ${b}`, `The difference of a number and ${a} is ${b}`]),
          mul: r.pick([`${a} times a number is ${b}`, `The product of ${a} and a number is ${b}`]),
          div: r.pick([`A number divided by ${a} is ${b}`, `The quotient of a number and ${a} is ${b}`]),
        };
    // hard: the reversed subtraction uses a bigger starting number so it stays non-negative
    const big = hard ? b + r.int(5, 20) : 0;
    if (hard) phr.rsub = r.pick([`${big} minus a number is ${b}`, `A number subtracted from ${big} is ${b}`]);
    const eqs = hard
      ? { add: `${b} = ${v} + ${a}`, sub: `${v} − ${a} = ${b}`, rsub: `${big} − ${v} = ${b}`, mul: `${a}${v} = ${b}`, div: `${v} ÷ ${a} = ${b}` }
      : { add: `${v} + ${a} = ${b}`, sub: `${v} − ${a} = ${b}`, mul: `${a}${v} = ${b}`, div: `${v} ÷ ${a} = ${b}` };
    const keys = Object.keys(eqs);
    const order = r.shuffle(keys);
    const rightOrder = r.shuffle(keys);
    const left = order.map((k) => phr[k]);
    const right = rightOrder.map((k) => eqs[k]);
    const pairs = order.map((k, i) => [i, rightOrder.indexOf(k)]);
    const coach = {
      add: `"More than" and "sum" mean add: ${eqs.add}.`,
      sub: `"${a} less than a number" starts with the number and takes ${a} away: ${v} − ${a}. The order is the reverse of the words.`,
      rsub: `"Subtracted from ${big}" or "${big} minus a number" starts at ${big}: ${big} − ${v}. That is different from ${v} − ${a}.`,
      mul: `"Times" and "product" mean multiply: ${eqs.mul}.`,
      div: `"Divided by ${a}" and "quotient of a number and ${a}" put the number first: ${v} ÷ ${a}.`,
    };
    return {
      type: 'match',
      skill: 'write-equation',
      lesson: '8-1',
      title: hard ? 'Match words to equations (watch the order)' : 'Match words to equations',
      prompt: `<p>Match each sentence to its equation. The variable ${hl(v)} stands for "a number."</p>${hard ? `<p class="muted">Five sentences, five equations. Some sentences state the result first.</p>` : ''}`,
      left,
      right,
      pairs,
      hints: [
        '"More than" and "sum" mean add. "Less than," "decreased by," and "difference" mean subtract.',
        '"Times" and "product" mean multiply. "Divided by" and "quotient" mean divide. "Is" marks the equals sign, wherever it sits.',
        hard
          ? `For subtraction, check which number comes first. "${a} less than a number" is ${v} − ${a}. "${big} minus a number" is ${big} − ${v}.`
          : `"${phr.sub}" means ${v} − ${a} = ${b}: the ${a} is taken away from the number.`,
      ],
      hintEs: '"Más que" y "suma" significan sumar. "Menos que", "disminuido en" y "diferencia" significan restar. "Es" marca el signo igual.',
      solution: `<p>${keys.map((k) => `${phr[k]} → ${eqs[k]}`).join('. ')}.</p>`,
      feedback: {
        correct: 'Correct. The key words tell you the operation, and "is" marks the equals sign.',
        wrong(ans, d) {
          const li = d.wrong && d.wrong[0];
          if (li != null && order[li]) return `Check "${left[li]}". ${coach[order[li]]}`;
          return `Look at the key word in each sentence: sum or more than → +, less than or decreased by → −, times or product → ×, divided by or quotient → ÷.`;
        },
      },
    };
  });

  // ---------- Error: equation written backwards (error) ----------
  G.define('q1_errorWrite', (r, o) => {
    const hard = !!o.hard;
    const name = r.pick(NAMES);
    const ctx = hard
      ? r.pick([
          { place: 'travel fund', verb: 'spent', money: true },
          { place: 'fare card', verb: 'used', money: true },
          { place: 'lamp', word: 'liters of oil', verb: 'burned' },
          { place: 'grain bin', word: 'kilograms of grain', verb: 'sold' },
        ])
      : r.pick([
          { have: 'money', unit: '$', verb: 'spent', left: 'left' },
          { have: 'stickers', unit: '', verb: 'gave away', left: 'left' },
          { have: 'minutes of screen time', unit: '', verb: 'used', left: 'left' },
          { have: 'trading cards', unit: '', verb: 'traded away', left: 'left' },
        ]);
    const a = hard ? (ctx.money ? round(r.int(6, 25) + r.pick([0.25, 0.5, 0.75]), 2) : round(r.int(21, 95) / 10, 1)) : r.int(6, 25),
      b = hard ? (ctx.money ? round(r.int(8, 40) + r.pick([0.1, 0.4, 0.6, 0.85]), 2) : round(r.int(31, 140) / 10, 1)) : r.int(8, 40),
      start = round(a + b, 2);
    const v = r.pick(['m', 'c', 's']);
    const u = (x) => (ctx.money ? money(x) : ctx.word ? `${x} ${ctx.word}` : ctx.unit ? ctx.unit + x : String(x));
    const opts = [
      { html: `${name} wrote the numbers in the wrong order. ${name} started with ${v}, then ${ctx.verb} ${u(a)}, so the equation should be ${v} − ${a} = ${b}.`, ok: true },
      {
        html: `${name} should have used addition, because the amount left and the amount ${ctx.verb} make the start: ${v} + ${a} = ${b}.`,
        why: `${name} ${ctx.verb} ${u(a)}, which takes away from the starting amount. The operation is subtraction, but the order must be fixed: ${v} − ${a}.`,
      },
      {
        html: `${name} should have swapped the two numbers instead, so the amount left is subtracted: ${v} − ${b} = ${a}.`,
        why: `This equation has the same solution, but it does not tell the story. The story says the starting amount minus the ${u(a)} ${ctx.verb} equals the ${u(b)} left.`,
      },
      {
        html: `The equation is correct as written, because subtraction can be written in either order.`,
        why: `Subtraction is not commutative: ${a} − ${v} and ${v} − ${a} are different. ${a} − ${v} = ${b} would mean a number was taken away from ${a}.`,
      },
    ];
    const sh = shuffleOptions(r, opts, 0);
    const story = hard
      ? `There ${ctx.money ? 'is' : 'are'} ${hl(u(b))} left in ${name}'s ${ctx.place} now. Earlier, ${name} ${ctx.verb} ${hl(u(a))} from it.`
      : `${name} had some ${ctx.have}, ${ctx.verb} ${hl(u(a))}, and has ${hl(u(b))} ${ctx.left}.`;
    return {
      type: 'error',
      skill: 'write-equation',
      lesson: '8-1',
      title: hard ? 'Find the mistake (decimals)' : 'Find the mistake',
      prompt: `<p>${story} ${name} let ${v} stand for the starting amount and wrote this equation.</p><p>What is wrong with ${name}'s equation?</p>`,
      work: `${a} − ${v} = ${b}`,
      options: sh.options,
      answer: sh.answer,
      fix: { label: `Correct equation: ${v} − ${a} = ${b}. Solve it: ${v} = `, answer: start },
      hints: [
        `Put the story in time order: start with ${v}, then take away ${a}, and ${b} is left. Which number is subtracted from which?`,
        `${a} − ${v} says "${a} take away the starting amount." That is backwards. The starting amount comes first.`,
        `${v} − ${a} = ${b}. To find ${v}, add ${a} back to ${b}.`,
      ],
      hintEs: `Pon la historia en orden: empieza con ${v}, luego quita ${a}, y quedan ${b}. ¿Qué número se resta de cuál?`,
      solution: `<p>The order is wrong. ${name} started with ${v} and ${ctx.verb} ${a}, so the equation is <b>${v} − ${a} = ${b}</b>. Subtraction order matters: ${a} − ${v} is not the same as ${v} − ${a}. Solving: ${v} = ${b} + ${a} = <b>${start}</b>. Check: ${start} − ${a} = ${b}. ✓</p>`,
      feedback: {
        correct: `Correct. In subtraction the order matters. The starting amount is written first, and the solution is ${start}.`,
        wrong(ans, d) {
          if (!d.mistakeOk) return (sh.options[ans.mistake] && sh.options[ans.mistake].why) || 'Read the story in order: start, then take away, then what is left.';
          const f = RX.parseNum(ans.fix);
          if (f != null && (RX.near(f, b - a) || RX.near(f, a - b)))
            return `You found the mistake, but for the fix you subtracted. ${v} − ${a} = ${b} means ${v} is bigger than ${b}. Undo the subtraction: add ${a} to ${b}.`;
          if (f != null && RX.near(f, b)) return `${b} is what is left, not the starting amount. Add the ${a} back on.`;
          return `You found the mistake. To solve ${v} − ${a} = ${b}, undo the subtraction: ${b} + ${a}. Line up the decimal points.`;
        },
      },
    };
  });

  // ---------- Sort equations by whether a value is a solution (sort) ----------
  G.define('q1_sortSolutions', (r, o) => {
    const hard = !!o.hard;
    const v = r.pick(VARS);
    const s = hard ? r.int(3, 12) + 0.5 : r.int(3, 12);
    const a1 = r.int(2, 9),
      a2 = r.int(1, Math.floor(s) - 1),
      k = r.int(3, 6),
      c = hard ? 2 * r.int(1, 4) : r.int(2, 9);
    // each item carries its substitution so feedback can show the student's check
    const yes = [
      { html: `${v} + ${a1} = ${n2(s + a1)}`, calc: `${s} + ${a1} = ${n2(s + a1)}` },
      { html: `${v} − ${a2} = ${n2(s - a2)}`, calc: `${s} − ${a2} = ${n2(s - a2)}` },
      { html: `${k}${v} = ${n2(k * s)}`, calc: `${k} × ${s} = ${n2(k * s)}` },
      { html: `${n2(s * c)} ÷ ${v} = ${c}`, calc: `${n2(s * c)} ÷ ${s} = ${c}` },
    ];
    const no = [
      { html: `${v} + ${a1} = ${n2(s + a1 + (hard ? 0.5 : r.pick([1, 2])))}`, calc: `${s} + ${a1} = ${n2(s + a1)}` },
      { html: `${v} − ${a2} = ${s}`, calc: `${s} − ${a2} = ${n2(s - a2)}` },
      { html: `${k}${v} = ${n2(k * s + k)}`, calc: `${k} × ${s} = ${n2(k * s)}` },
      { html: `${v} + ${s} = ${s}`, calc: `${s} + ${s} = ${n2(2 * s)}` },
    ];
    if (hard) {
      yes.push({ html: `${v} ÷ 2 = ${n2(s / 2)}`, calc: `${s} ÷ 2 = ${n2(s / 2)}` });
      no.push({ html: `2${v} = ${n2(s + 2)}`, calc: `2 × ${s} = ${n2(2 * s)} (2${v} means 2 times ${v}, not ${v} + 2)` });
    }
    const per = hard ? 4 : 3;
    const items = r.shuffle(
      r
        .pickN(yes, per)
        .map((h) => ({ html: h.html, calc: h.calc, bin: 0 }))
        .concat(r.pickN(no, per).map((h) => ({ html: h.html, calc: h.calc, bin: 1 }))),
    );
    return {
      type: 'sort',
      skill: 'solution-test',
      lesson: '8-1',
      title: hard ? 'Which equations does the value solve? (decimals)' : 'Which equations does the value solve?',
      prompt: `<p>Sort each equation. Is ${hl(v + ' = ' + s)} a solution, or not?</p><p class="muted">Substitute ${s} for ${v} in each equation and check whether it is true.</p>`,
      bins: [`${v} = ${s} IS a solution`, `${v} = ${s} is NOT a solution`],
      items: items.map((i) => ({ html: i.html, bin: i.bin })),
      hints: [
        `Replace ${v} with ${s} in each equation. If both sides come out equal, ${s} is a solution.`,
        `For example, in ${yes[0].html}: ${yes[0].calc}. True, so it goes in the "is a solution" bin.`,
        `Watch for equations that are almost true, like ${no[1].html}. Work out ${s} − ${a2} and compare it with ${s}.`,
      ],
      hintEs: `Reemplaza ${v} por ${s} en cada ecuación. Si los dos lados dan el mismo número, ${s} es una solución.`,
      solution: `<p>Substitute ${s} for ${v}. True equations: ${items
        .filter((i) => i.bin === 0)
        .map((i) => `${i.html} (${i.calc})`)
        .join(', ')}. False equations: ${items
        .filter((i) => i.bin === 1)
        .map((i) => i.html)
        .join(', ')}.</p>`,
      feedback: {
        correct: `Correct. A value is a solution only when substituting it makes both sides equal.`,
        wrong(ans, d) {
          const i = d.wrong && d.wrong[0];
          if (i == null || !items[i]) return `Substitute ${s} into each equation and compare the two sides.`;
          const it = items[i];
          return it.bin === 0
            ? `${it.html} is true for ${v} = ${s}: ${it.calc}. It belongs with the solutions.`
            : `${it.html} looks close, but substitute: ${it.calc}, which does not match the other side. It is not a solution.`;
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
      hintEs: `Para dejar ${v} solo, quita la pesa de ${num(a)} de su platillo. Para mantener la balanza en equilibrio, quita ${num(a)} del otro platillo también.`,
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
      hintEs: `La operación inversa de sumar un número es restar ese mismo número. ¿Qué número se le suma a ${v}?`,
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
  G.define('q2_barModel', (r, o) => {
    const hard = !!o.hard;
    const v = r.pick(VARS);
    const name = r.pick(NAMES);
    const ctx = hard
      ? r.pick([
          { whole: 'kilometers hiked', part: 'kilometers on the ridge trail', unk: 'kilometers on the river trail', unit: 'kilometers' },
          { whole: 'liters of water carried', part: 'liters in the first trip', unk: 'liters in the second trip', unit: 'liters' },
          { whole: 'dollars raised', part: 'dollars from the bake sale', unk: 'dollars from the car wash', unit: 'dollars' },
          { whole: 'kilograms of supplies loaded', part: 'kilograms of rope', unk: 'kilograms of tools', unit: 'kilograms' },
        ])
      : r.pick([
          { whole: 'minutes of practice', part: 'minutes of scales', unk: 'minutes of songs', unit: 'minutes' },
          { whole: 'pages read this week', part: 'pages read on Monday', unk: 'pages read the rest of the week', unit: 'pages' },
          { whole: 'points scored', part: 'points in the first half', unk: 'points in the second half', unit: 'points' },
          { whole: 'dollars raised', part: 'dollars from the bake sale', unk: 'dollars from the car wash', unit: 'dollars' },
        ]);
    const a = hard ? round(r.int(13, 60) / 2, 1) : r.int(6, 28),
      p2 = hard ? round(r.int(10, 80) / 2, 1) : r.int(5, 40),
      total = round(a + p2, 2);
    // hard: half the time the WHOLE is the unknown (a subtraction equation), and the equation is not given
    const wholeUnknown = hard && r.chance(0.5);
    const sol = wholeUnknown ? total : p2;
    const aFirst = r.chance(0.5);
    const known = { label: num(a), size: a };
    const other = wholeUnknown ? { label: num(p2), size: p2 } : { label: v, size: p2, unknown: true };
    const parts = aFirst ? [known, other] : [other, known];
    const eq = wholeUnknown ? `${v} − ${num(a)} = ${num(p2)}` : aFirst ? `${num(a)} + ${v} = ${num(total)}` : `${v} + ${num(a)} = ${num(total)}`;
    const story = wholeUnknown
      ? `${name} recorded some ${hl(ctx.whole)} in all, ${hl(v)}. Of these, ${hl(num(a))} were ${ctx.part} and ${hl(num(p2))} were ${ctx.unk}.`
      : `${name} recorded ${hl(num(total) + ' ' + ctx.whole)} in all. ${hl(num(a))} were ${ctx.part}. The rest, ${hl(v)}, were ${ctx.unk}.`;
    const ask = hard ? `<p>Write an equation for the bar model in your head, then find ${v}.</p>` : `<p>The bar model shows ${hl(eq)}. Find ${v}.</p>`;
    return {
      type: 'num',
      skill: 'balance-model',
      lesson: '8-2',
      title: hard ? (wholeUnknown ? 'Find the whole (decimals)' : 'Find the missing part (decimals)') : 'Read the bar model',
      prompt: `<p>${story}</p>${V.barModel({ total: wholeUnknown ? v : num(total), parts, aria: wholeUnknown ? `Bar model: an unknown whole ${v} split into ${num(a)} and ${num(p2)}` : `Bar model: a whole of ${num(total)} split into ${num(a)} and ${v}` })}${ask}`,
      answer: sol,
      unit: ctx.unit,
      hints: [
        'The top bar is the whole. The two bottom bars are the parts. The parts add up to the whole.',
        wholeUnknown
          ? `The whole ${v} is unknown and both parts are known: ${num(a)} and ${num(p2)}. One equation is ${eq}.`
          : `One part is ${num(a)} and the whole is ${num(total)}. To find the missing part, take the known part away from the whole.`,
        wholeUnknown ? `Undo the subtraction: add ${num(a)} to ${num(p2)}.` : `${v} = ${num(total)} − ${num(a)}.`,
      ],
      hintEs: 'La barra de arriba es el total. Las dos barras de abajo son las partes. Las partes suman el total.',
      solution: wholeUnknown
        ? `<p>The whole is unknown, so ${eq}. Add ${num(a)} to both sides: ${v} = ${num(p2)} + ${num(a)} = <b>${num(sol)}</b>. Check: ${num(sol)} − ${num(a)} = ${num(p2)}. ✓</p>`
        : `<p>The whole is ${num(total)} and one part is ${num(a)}, so ${eq}. The missing part is the whole minus the known part: ${num(total)} − ${num(a)} = <b>${num(sol)}</b>. Check: ${num(a)} + ${num(sol)} = ${num(total)}. ✓</p>`,
      feedback: {
        correct: wholeUnknown ? `Correct. The parts add to the whole: ${num(a)} + ${num(p2)} = ${num(sol)}.` : `Correct. Whole − known part = missing part: ${num(total)} − ${num(a)} = ${num(sol)}.`,
        wrong(ans, d) {
          const x = d.value;
          if (wholeUnknown) {
            if (x != null && RX.near(x, Math.abs(p2 - a))) return `You subtracted the parts. ${v} is the whole bar, so it is bigger than either part. Add the parts.`;
            return `The whole is the sum of its parts. Add ${num(a)} and ${num(p2)}, lining up the decimal points.`;
          }
          if (x != null && RX.near(x, total + a)) return `You added the two numbers. ${num(total)} is already the whole. The missing part must be smaller than the whole, so subtract.`;
          if (x != null && RX.near(x, total)) return `${num(total)} is the whole bar, not the missing part. The missing part is what is left after ${num(a)}.`;
          return `The two parts add to the whole. ${v} + ${num(a)} = ${num(total)}, so ${v} = ${num(total)} − ${num(a)}.`;
        },
      },
    };
  });

  // ---------- Sort equations by the inverse operation needed (sort) ----------
  G.define('q2_sortOperation', (r, o) => {
    const hard = !!o.hard;
    const v = r.pick(VARS);
    let items;
    if (!hard) {
      const a1 = r.int(2, 12),
        a2 = ((a1 - 2 + r.int(1, 10)) % 11) + 2, // 2..12 and distinct from a1 so no two sort items read the same
        a3 = round(r.int(3, 19) / 2, 1),
        b1 = r.int(a1 + 1, 30),
        b2 = r.int(a2 + 1, 30),
        b3 = round(r.int(10, 40) / 2, 1);
      const sub = [`${v} + ${a1} = ${b1}`, `${b2} = ${v} + ${a2}`, `${num(a3)} + ${v} = ${num(b3)}`, `${a2} + ${v} = ${b1}`];
      const add = [`${v} − ${a1} = ${b2}`, `${v} − ${num(a3)} = ${num(b3)}`, `${b1} = ${v} − ${a2}`, `${v} − ${a2} = ${b1}`];
      items = r.shuffle(
        r
          .pickN(sub, 3)
          .map((h) => ({ html: h, bin: 0 }))
          .concat(r.pickN(add, 3).map((h) => ({ html: h, bin: 1 }))),
      );
    } else {
      // hard: decimal constants, the variable on either side, and the number written before the variable
      const pool = r.shuffle([1.25, 2.5, 3.75, 4.2, 5.5, 6.8, 7.25, 8.4, 9.6, 10.5, 12.75, 14.3]);
      const ks = pool.slice(0, 8);
      const bs = ks.map((k) => round(k + r.int(6, 30) + r.pick([0, 0.5]), 2));
      const sub = [`${v} + ${ks[0]} = ${bs[0]}`, `${bs[1]} = ${v} + ${ks[1]}`, `${ks[2]} + ${v} = ${bs[2]}`, `${bs[3]} = ${ks[3]} + ${v}`];
      const add = [`${v} − ${ks[4]} = ${bs[4]}`, `${bs[5]} = ${v} − ${ks[5]}`, `${v} − ${ks[6]} = ${bs[6]}`, `${bs[7]} = ${v} − ${ks[7]}`];
      items = r.shuffle(sub.map((h) => ({ html: h, bin: 0 })).concat(add.map((h) => ({ html: h, bin: 1 }))));
    }
    return {
      type: 'sort',
      skill: 'solve-add',
      lesson: '8-2',
      title: hard ? 'Which inverse operation? (decimals)' : 'Which inverse operation?',
      prompt: `<p>To solve each equation in one step, would you <b>subtract</b> from both sides or <b>add</b> to both sides? Sort the equations.</p>${hard ? '<p class="muted">Eight equations with decimals. Read each one carefully: the variable may be on either side.</p>' : ''}`,
      bins: ['Subtract from both sides', 'Add to both sides'],
      items,
      hints: [
        'Look at the operation next to the variable. Use the inverse: subtraction undoes addition, and addition undoes subtraction.',
        `If a number is added to ${v}, subtract it from both sides. If a number is subtracted from ${v}, add it to both sides.`,
        `The side the variable is on does not matter. Find the sign right next to ${v} and use its opposite.`,
      ],
      hintEs: 'Mira la operación que está junto a la variable. Usa la operación inversa: la resta deshace la suma y la suma deshace la resta.',
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
          const i = d.wrong && d.wrong[0];
          if (i == null || !items[i]) return 'Match each equation to the operation that undoes the one in the equation.';
          const it = items[i];
          return it.bin === 0
            ? `${it.html} adds a number to ${v}${/^\S+ = /.test(it.html) ? ', even though it is written on the right side' : ''}. Adding is undone by subtracting.`
            : `${it.html} subtracts a number from ${v}. You do not subtract again: subtracting is undone by adding.`;
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
      hintEs: `La operación inversa de restar un número es sumar ese mismo número. ¿Qué número se le resta a ${v}?`,
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
  G.define('q2_subWord', (r, o) => {
    const hard = !!o.hard;
    const name = r.pick(NAMES);
    const v = r.pick(['m', 's', 'c', 'd']);
    const ctx = r.pick([
      () => {
        const a = round(r.int(20, 60) / 4, 2),
          b = round(r.int(20, 120) / 4, 2),
          extra = round(a + r.int(3, 9) + 0.5, 2);
        return {
          a,
          b,
          extra,
          text: hard
            ? `${name} now has ${hl(money(b))} left. That is after buying a sky-lift pass for ${hl(money(a))}. A full-day pass would have cost ${hl(money(extra))}.`
            : `${name} had some money. After spending ${hl(money(a))} on a sky-lift pass, ${name} has ${hl(money(b))} left.`,
          varDef: `${v} = the money ${name} started with`,
        };
      },
      () => {
        const a = hard ? r.int(28, 95) : r.int(8, 30),
          b = hard ? r.int(40, 160) : r.int(10, 45),
          extra = r.int(3, 9);
        return {
          a,
          b,
          extra,
          text: hard
            ? `${name} gave ${hl(a + ' trading cards')} to ${hl(extra + ' friends')} and still has ${hl(b + ' cards')}.`
            : `${name} had a stack of trading cards. After giving ${hl(a + ' cards')} to a friend, ${name} has ${hl(b + ' cards')} left.`,
          varDef: `${v} = the number of cards at the start`,
        };
      },
      () => {
        const a = hard ? round(r.int(25, 120) / 10, 1) : r.int(3, 12),
          b = hard ? round(r.int(30, 160) / 10, 1) : r.int(5, 20),
          extra = r.int(2, 5);
        return {
          a,
          b,
          extra,
          text: hard
            ? `A trail is ${v} kilometers long. After ${hl(extra + ' hours')}, ${name} has hiked ${hl(num(a) + ' kilometers')}. There are still ${hl(num(b) + ' kilometers')} to go.`
            : `A trail is ${v} kilometers long. ${name} has hiked ${hl(a + ' kilometers')} and has ${hl(b + ' kilometers')} left to go.`,
          varDef: `${v} = the length of the trail`,
        };
      },
      () => {
        const a = hard ? round(r.int(25, 140) / 10, 1) : round(r.int(4, 16) / 2, 1),
          b = hard ? round(r.int(40, 200) / 10, 1) : round(r.int(10, 40) / 2, 1),
          extra = r.int(2, 6);
        return {
          a,
          b,
          extra,
          text: hard
            ? `${hl(num(b) + ' liters')} remain in a water tank after ${hl(num(a) + ' liters')} drained out over ${hl(extra + ' hours')}.`
            : `A water tank held some liters. After ${hl(num(a) + ' liters')} drained out, ${hl(num(b) + ' liters')} remain.`,
          varDef: `${v} = the liters in the tank at the start`,
        };
      },
    ])();
    const sol = round(ctx.a + ctx.b, 2);
    return {
      type: 'blanks',
      skill: 'solve-sub',
      lesson: '8-2',
      title: hard ? 'Write and solve (extra information)' : 'Write and solve',
      prompt: `<p>${ctx.text}</p><p>Let ${hl(ctx.varDef)}. Write a subtraction equation, then solve it.${hard ? ' Not every number in the story belongs in the equation.' : ''}</p>`,
      template: [`Equation: ${v} − {0} = {1}`, `Solution: ${v} = {2}`],
      fields: [
        { answer: ctx.a, width: 'sm' },
        { answer: ctx.b, width: 'sm' },
        { answer: sol, width: 'sm' },
      ],
      hints: [
        `The story starts with ${v}, then an amount is taken away, and an amount is left. Start − taken away = left.`,
        `${v} − ${num(ctx.a)} = ${num(ctx.b)}. To undo subtracting ${num(ctx.a)}, add ${num(ctx.a)} to both sides.`,
        `Add ${num(ctx.a)} to ${num(ctx.b)} to find ${v}.`,
      ],
      hintEs: `La historia empieza con ${v}, luego se quita una cantidad y queda otra cantidad. Inicio − lo que se quita = lo que queda.`,
      solution: `<p>Equation: <b>${v} − ${num(ctx.a)} = ${num(ctx.b)}</b>. Add ${num(ctx.a)} to both sides: ${v} = ${num(ctx.b)} + ${num(ctx.a)} = <b>${num(sol)}</b>. Check: ${num(sol)} − ${num(ctx.a)} = ${num(ctx.b)}. ✓${hard ? ` The ${ctx.extra} in the story is extra information; it is not part of the equation.` : ''}</p>`,
      feedback: {
        correct: `Correct. ${v} − ${num(ctx.a)} = ${num(ctx.b)}, and adding ${num(ctx.a)} back gives ${num(sol)}.`,
        wrong(ans, d) {
          const first = parseNum(ans[0]),
            second = parseNum(ans[1]),
            third = parseNum(ans[2]);
          if (hard && (RX.near(first, ctx.extra) || RX.near(second, ctx.extra)))
            return `${num(ctx.extra)} is extra information. The equation only needs the amount taken away (${num(ctx.a)}) and the amount left (${num(ctx.b)}).`;
          if (RX.near(first, ctx.b) && RX.near(second, ctx.a)) return `You swapped the numbers. The amount taken away goes after the minus sign; the amount left goes after the equals sign.`;
          if (d.wrong.includes(0) || d.wrong.includes(1)) return `The amount taken away (${num(ctx.a)}) is subtracted. The amount left (${num(ctx.b)}) is the result after the equals sign.`;
          if (third != null && RX.near(third, Math.abs(ctx.b - ctx.a))) return `You subtracted. The starting amount is bigger than what is left. Add ${num(ctx.a)} back to ${num(ctx.b)}.`;
          return `To undo "− ${num(ctx.a)}", add ${num(ctx.a)} to ${num(ctx.b)}. Line up the decimal points.`;
        },
      },
    };
  });

  // ---------- Check a proposed solution by substituting (cloze) ----------
  G.define('q2_checkCloze', (r, o) => {
    const hard = !!o.hard;
    const name = r.pick(NAMES);
    const v = r.pick(VARS);
    const kind = r.pick(['add', 'sub']);
    const a = hard ? round(r.int(3, 20) + r.pick([0.25, 0.5, 0.75]), 2) : r.int(3, 20),
      // for subtraction, keep b > 2a so the same-operation slip (b − a, then − a again) never goes negative
      sol = kind === 'sub' ? round(2 * a + 1 + a + r.int(0, 25) + (hard ? r.pick([0, 0.5]) : 0), 2) : hard ? round(r.int(Math.ceil(a) + 2, 45) + r.pick([0, 0.5]), 2) : r.int(a + 2, 45);
    const b = round(kind === 'add' ? sol + a : sol - a, 2);
    const flipped = hard && r.chance(0.5);
    const lhsText = kind === 'add' ? `${v} + ${a}` : `${v} − ${a}`;
    const eq = flipped ? `${b} = ${lhsText}` : `${lhsText} = ${b}`;
    const right = r.chance(0.5);
    const p = right ? sol : round(kind === 'add' ? b + a : b - a, 2); // the classic same-operation mistake
    const lhs = round(kind === 'add' ? p + a : p - a, 2);
    const alts = r.shuffle([lhs, round(lhs + a, 2), b === lhs ? round(lhs - a, 2) : b, ...(hard ? [round(lhs + 1, 2)] : [])].filter((x, i, arr) => arr.indexOf(x) === i).map(String));
    return {
      type: 'cloze',
      skill: 'check-solution',
      lesson: '8-2',
      title: hard ? 'Check the solution (decimals)' : 'Check the solution',
      prompt: `<p>${name} solved ${hl(eq)} and got ${hl(v + ' = ' + p)}. Check ${name}'s answer by substituting.</p>`,
      template: `Substitute ${p} for ${v}: ${p} ${kind === 'add' ? '+' : '−'} ${a} = {0}. The other side is ${b}. So ${v} = ${p} {1}. To solve ${eq} correctly, you {2} ${a} on both sides.`,
      choices: [alts, ['is the solution', 'is not the solution'], kind === 'add' ? ['subtract', 'add'] : ['add', 'subtract']],
      answers: [alts.indexOf(String(lhs)), right ? 0 : 1, 0],
      hints: [
        `Checking means putting the answer back into the original equation. Replace ${v} with ${p} and compute the side with ${v}.`,
        `Work out ${p} ${kind === 'add' ? '+' : '−'} ${a}. Compare it with the other side, ${b}.`,
        `If the two sides match, the answer checks. If not, ${name} used the same operation instead of the inverse.`,
      ],
      hintEs: `Comprobar significa poner la respuesta en la ecuación original. Reemplaza ${v} por ${p} y calcula el lado que tiene ${v}.`,
      solution: `<p>${p} ${kind === 'add' ? '+' : '−'} ${a} = <b>${lhs}</b>. The other side is ${b}, so ${v} = ${p} <b>${right ? 'is the solution' : 'is not the solution'}</b>. To solve ${eq}, <b>${kind === 'add' ? 'subtract' : 'add'}</b> ${a} on both sides${right ? '' : `, which gives ${v} = ${sol}`}.</p>`,
      feedback: {
        correct: `Correct. Substituting shows whether the equation balances, and the inverse operation (${kind === 'add' ? 'subtracting' : 'adding'} ${a}) is how you solve it.`,
        wrong(ans, d) {
          const picked = alts[ans[0]];
          if (d.wrong.includes(0) && picked === String(b))
            return `${b} is the other side of the equation. The first blank is what you get when you substitute: ${p} ${kind === 'add' ? '+' : '−'} ${a}.`;
          if (d.wrong.includes(0)) return `Recompute: ${p} ${kind === 'add' ? '+' : '−'} ${a}. Line up the decimal points.`;
          if (d.wrong.includes(1)) return `Compare the left side you computed with ${b}. Equal means it is the solution; not equal means it is not.`;
          return `The equation ${kind === 'add' ? 'adds' : 'subtracts'} ${a}. To solve, use the inverse operation: ${kind === 'add' ? 'subtraction' : 'addition'}, not the same operation again.`;
        },
      },
    };
  });

  // ---------- Error: used the same operation instead of the inverse (error) ----------
  G.define('q2_errorInverse', (r, o) => {
    const hard = !!o.hard;
    const name = r.pick(NAMES);
    const v = r.pick(VARS);
    const kind = r.pick(['add', 'sub']);
    const a = hard ? round(r.int(3, 15) + r.pick([0.4, 0.5, 0.75]), 2) : r.int(3, 15),
      sol =
        kind === 'sub'
          ? round(3 * a + 1 + r.int(0, hard ? 30 : 15) + (hard ? r.pick([0.2, 0.5, 0.6]) : 0), 2)
          : hard
            ? round(r.int(Math.ceil(a) + 1, 60) + r.pick([0.2, 0.5, 0.6]), 2)
            : r.int(a + 1, 40);
    const b = round(kind === 'add' ? sol + a : sol - a, 2);
    const flipped = hard && r.chance(0.5);
    const side = kind === 'add' ? `${v} + ${a}` : `${v} − ${a}`;
    const eq = flipped ? `${b} = ${side}` : `${side} = ${b}`;
    const wrongSol = round(kind === 'add' ? b + a : b - a, 2);
    const sgn = kind === 'add' ? '+' : '−';
    const step2 = flipped ? `${b} ${sgn} ${a} = ${side} ${sgn} ${a}` : `${side} ${sgn} ${a} = ${b} ${sgn} ${a}`;
    const last = flipped ? `${wrongSol} = ${v}` : `${v} = ${wrongSol}`;
    const work = `${eq}<br>${step2}<br>${last}`;
    const inv = kind === 'add' ? 'subtract' : 'add';
    const same = kind === 'add' ? 'added' : 'subtracted';
    const opts = [
      { html: `${name} ${same} ${a} on both sides, but the equation already ${kind === 'add' ? 'adds' : 'subtracts'} ${a}. To undo it, ${name} should ${inv} ${a} on both sides.`, ok: true },
      {
        html: `${name} should have ${same} ${a} on only one side, the side with the variable.`,
        why: `Doing something to only one side unbalances the equation. Both sides must get the same operation. The problem is the operation chosen, not the number of sides.`,
      },
      {
        html: `${name} should have ${kind === 'add' ? 'divided' : 'multiplied'} both sides by ${a} to get the variable alone.`,
        why: `Division and multiplication undo each other. The equation ${kind === 'add' ? 'adds' : 'subtracts'} ${a}, so its inverse is ${kind === 'add' ? 'subtraction' : 'addition'}.`,
      },
      {
        html: `There is no mistake. ${v} = ${wrongSol} is correct, because both sides were changed the same way.`,
        why: `Check it: ${wrongSol} ${sgn} ${a} = ${round(kind === 'add' ? wrongSol + a : wrongSol - a, 2)}, not ${b}. Keeping both sides equal is not enough; the step must also undo the operation.`,
      },
    ];
    const sh = shuffleOptions(r, opts, 0);
    return {
      type: 'error',
      skill: kind === 'add' ? 'solve-add' : 'solve-sub',
      lesson: '8-2',
      title: hard ? 'Find the mistake (decimals)' : 'Find the mistake',
      prompt: `<p>${name} solved ${hl(eq)} like this. What went wrong?</p>`,
      work,
      options: sh.options,
      answer: sh.answer,
      fix: { label: `Correct solution: ${v} = `, answer: sol },
      hints: [
        `Check ${name}'s answer by substituting: ${wrongSol} ${sgn} ${a} = ? Does it equal ${b}?`,
        `The equation ${kind === 'add' ? 'adds' : 'subtracts'} ${a}. Doing the same operation again moves further from the answer. Use the inverse.`,
        `${inv === 'subtract' ? 'Subtract' : 'Add'} ${a} on both sides: ${v} = ${b} ${kind === 'add' ? '−' : '+'} ${a}.`,
      ],
      hintEs: `Comprueba la respuesta de ${name} sustituyendo: ¿${wrongSol} ${sgn} ${a} es igual a ${b}?`,
      solution: `<p>${name} ${same} ${a}, the same operation that is already in the equation. The inverse undoes it: ${inv} ${a} on both sides. ${v} = ${b} ${kind === 'add' ? '−' : '+'} ${a} = <b>${sol}</b>. Check: ${sol} ${sgn} ${a} = ${b}. ✓</p>`,
      feedback: {
        correct: `Correct. Inverse operations undo each other. ${kind === 'add' ? 'Subtracting' : 'Adding'} ${a} gives ${v} = ${sol}.`,
        wrong(ans, d) {
          if (!d.mistakeOk)
            return (sh.options[ans.mistake] && sh.options[ans.mistake].why) || `Substitute ${wrongSol} back into the equation. It does not work, so find the operation that undoes ${sgn} ${a}.`;
          const f = parseNum(ans.fix);
          if (f != null && RX.near(f, wrongSol)) return `That is ${name}'s answer, which does not check. ${inv === 'subtract' ? 'Subtract' : 'Add'} ${a}: ${b} ${kind === 'add' ? '−' : '+'} ${a}.`;
          if (f != null && RX.near(f, b)) return `${b} is the other side of the equation. You still need to ${inv} ${a}.`;
          return `You found the mistake. Now ${inv} ${a}: ${v} = ${b} ${kind === 'add' ? '−' : '+'} ${a}. Line up the decimal points.`;
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
      hintEs: `El coeficiente es el número que multiplica a la variable. La operación inversa de multiplicar por un número es dividir entre ese mismo número.`,
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
  G.define('q3_mulWord', (r, o) => {
    const hard = !!o.hard;
    const name = r.pick(NAMES);
    const v = r.pick(['t', 'n', 'h', 'c']);
    const easy = [
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
          es: 'precio × número de boletos = total pagado',
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
          es: 'número de aprendices × engranajes para cada uno = total de engranajes',
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
          es: 'tasa × tiempo = distancia',
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
          es: 'días × minutos por día = total de minutos',
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
          es: 'libras × costo por libra = costo total',
        };
      },
    ];
    // hard: decimal coefficients, the total stated first, and one number that does not belong in the equation
    const tough = [
      () => {
        const a = r.pick([6.5, 7.25, 8.75, 4.5]),
          sol = r.int(4, 12),
          b = round(a * sol, 2),
          extra = r.int(2, 5);
        return {
          a,
          b,
          sol,
          extra,
          text: `${name} paid ${hl(money(b))} in all for Gearworks tickets, using ${hl(extra + ' coupons')} that did not change the price. Each ticket costs ${hl(money(a))}.`,
          varDef: `${v} = the number of tickets ${name} bought`,
          unit: 'tickets',
          hint: 'price × number of tickets = total paid',
          es: 'precio × número de boletos = total pagado',
        };
      },
      () => {
        const a = r.pick([1.5, 2.5, 3.5]),
          sol = 2 * r.int(3, 12),
          b = round(a * sol, 2),
          extra = r.int(2, 4);
        return {
          a,
          b,
          sol,
          extra,
          text: `A lift chain rose ${hl(num(b) + ' meters')} at a steady ${hl(a + ' meters')} per minute. It has ${hl(extra + ' brakes')} along the way.`,
          varDef: `${v} = the number of minutes the chain rose`,
          unit: 'minutes',
          hint: 'rate × time = distance',
          es: 'tasa × tiempo = distancia',
        };
      },
      () => {
        const a = r.pick([2.5, 1.5, 3.5]),
          sol = round(r.int(4, 12) * 0.8, 2),
          b = round(a * sol, 2),
          extra = r.pick([3, 4, 5]);
        return {
          a,
          b,
          sol,
          extra,
          text: `${name} paid ${hl(money(b))} for ${hl(a + ' pounds')} of trail mix. A bag of ${hl(extra + ' pounds')} was on the shelf too. Every pound costs the same.`,
          varDef: `${v} = the cost of one pound`,
          unit: 'dollars',
          hint: 'pounds × cost per pound = total cost',
          es: 'libras × costo por libra = costo total',
        };
      },
      () => {
        const a = r.int(6, 12),
          sol = r.int(12, 25),
          b = a * sol,
          extra = r.int(2, 9);
        return {
          a,
          b,
          sol,
          extra,
          text: `${hl(b + ' gears')} were packed into ${hl(a + ' crates')} with the same number in each crate. ${hl(extra + ' crates')} were painted red.`,
          varDef: `${v} = the number of gears in each crate`,
          unit: 'gears',
          hint: 'number of crates × gears per crate = total gears',
          es: 'número de cajas × engranajes por caja = total de engranajes',
        };
      },
    ];
    const ctx = r.pick(hard ? tough : easy)();
    const eq = `${ctx.a}${v} = ${num(ctx.b)}`;
    return {
      type: 'blanks',
      skill: 'solve-mul',
      lesson: '8-3',
      title: hard ? 'Write and solve (decimals, extra information)' : 'Write and solve',
      prompt: `<p>${ctx.text}</p><p>Let ${hl(ctx.varDef)}. Complete the multiplication equation, then solve it.${hard ? ' Not every number in the story belongs in the equation.' : ''}</p>`,
      template: [`Equation: {0}${v} = {1}`, `Solution: ${v} = {2}`],
      fields: [
        { answer: ctx.a, width: 'sm' },
        { answer: ctx.b, width: 'sm' },
        { answer: ctx.sol, width: 'sm' },
      ],
      hints: [
        `The story has equal groups: ${ctx.hint}. Equal groups mean multiplication.`,
        `The equation is ${eq}. To undo multiplying by ${ctx.a}, divide both sides by ${ctx.a}.`,
        `Divide ${num(ctx.b)} by ${ctx.a} to find ${v}.`,
      ],
      hintEs: `La historia tiene grupos iguales: ${ctx.es}. Los grupos iguales significan multiplicación.`,
      solution: `<p>${ctx.hint}, so the equation is <b>${eq}</b>. Divide both sides by ${ctx.a}: ${v} = ${num(ctx.b)} ÷ ${ctx.a} = <b>${num(ctx.sol)}</b> ${ctx.unit}. Check: ${ctx.a} × ${num(ctx.sol)} = ${num(ctx.b)}. ✓${hard ? ` The ${ctx.extra} in the story is extra information.` : ''}</p>`,
      feedback: {
        correct: `Correct. ${eq}, and dividing by ${ctx.a} gives ${num(ctx.sol)}.`,
        wrong(ans, d) {
          const first = parseNum(ans[0]),
            second = parseNum(ans[1]),
            third = parseNum(ans[2]);
          if (hard && (nearTo(first, ctx.extra) || nearTo(second, ctx.extra)))
            return `${ctx.extra} is extra information. The equation uses only the amount per group (${ctx.a}) and the total (${num(ctx.b)}).`;
          if (nearTo(first, ctx.b) && nearTo(second, ctx.a))
            return `You swapped the numbers. The coefficient is the amount per group or the number of groups (${ctx.a}); the total (${num(ctx.b)}) goes after the equals sign.`;
          if (d.wrong.includes(0) || d.wrong.includes(1)) return `The known group size or number of groups (${ctx.a}) is the coefficient. The total (${num(ctx.b)}) goes after the equals sign.`;
          if (nearTo(third, ctx.b * ctx.a)) return `You multiplied. The equation already multiplies by ${ctx.a}. To find ${v}, divide: ${num(ctx.b)} ÷ ${ctx.a}.`;
          if (nearTo(third, ctx.b - ctx.a)) return `You subtracted ${ctx.a}. Subtraction undoes addition, not multiplication. Divide ${num(ctx.b)} by ${ctx.a}.`;
          return `To undo "× ${ctx.a}", divide ${num(ctx.b)} by ${ctx.a}. With a decimal divisor, you can multiply both numbers by 10 first.`;
        },
      },
    };
  });

  // ---------- Fraction coefficient: (a/b)x = c (num) ----------
  G.define('q3_fracCoef', (r, o) => {
    const hard = !!o.hard;
    const v = r.pick(VARS);
    const [a, b] = r.pick(
      hard
        ? [
            [2, 3],
            [3, 4],
            [3, 5],
            [4, 5],
            [5, 6],
            [3, 8],
            [5, 8],
            [2, 7],
          ]
        : [
            [1, 2],
            [1, 3],
            [2, 3],
            [1, 4],
            [3, 4],
            [2, 5],
            [3, 5],
            [1, 5],
          ],
    );
    const k = hard ? r.int(4, 15) : r.int(2, 8);
    const sol = b * k;
    const c = a * k;
    const words = { 2: 'half', 3: 'third', 4: 'fourth', 5: 'fifth', 6: 'sixth', 7: 'seventh', 8: 'eighth' };
    const phrase = a === 1 ? `one-${words[b]}` : `${['', '', 'two', 'three', 'four', 'five'][a]}-${words[b]}s`;
    const prompt = hard
      ? `<p>A gear has turned ${hl(phrase)} of a full rotation so far. That is ${hl(c + ' clicks')}. Let ${hl(v)} be the number of clicks in a full rotation.</p><p>Write a multiplication equation with a fraction coefficient and solve it. What is ${v}?</p>`
      : `<p>A gear turns ${hl(phrase)} of a full rotation, which is ${hl(c + ' clicks')}. The equation ${V.frac(a, b)}${hl(v)} = ${hl(c)} models this, where ${v} is the number of clicks in a full rotation.</p><p>Solve ${V.frac(a, b)}${v} = ${c}. What is ${v}?</p>`;
    return {
      type: 'num',
      skill: 'solve-mul',
      lesson: '8-3',
      title: hard ? 'Fraction coefficient (write it yourself)' : 'Fraction coefficient',
      prompt,
      answer: sol,
      unit: 'clicks',
      hints: [
        `${a}/${b} is the coefficient of ${v}: ${a}/${b} × ${v} = ${c}. To undo multiplying by a fraction, divide both sides by that fraction. Dividing by a fraction is the same as multiplying by its reciprocal.`,
        `The reciprocal of ${a}/${b} is ${b}/${a}. Multiply both sides by ${b}/${a}: ${v} = ${c} × ${b}/${a}.`,
        a === 1 ? `Multiply ${c} by ${b}. That is ${v}.` : `${c} × ${b} = ${c * b}. Then divide by ${a}.`,
      ],
      hintEs: `${a}/${b} es el coeficiente de ${v}: ${a}/${b} × ${v} = ${c}. Para deshacer la multiplicación por una fracción, multiplica los dos lados por su recíproco.`,
      solution: `<p>The equation is ${a}/${b} × ${v} = ${c}. Divide both sides by ${a}/${b}. Dividing by a fraction means multiplying by its reciprocal, ${b}/${a}: ${v} = ${c} × ${b}/${a} = ${c * b}/${a} = <b>${sol}</b>. Check: ${a === 1 ? `1/${b} × ${sol} = ${sol} ÷ ${b} = ${c}` : `${a}/${b} × ${sol} = ${sol} ÷ ${b} × ${a} = ${k} × ${a} = ${c}`}. ✓</p>`,
      feedback: {
        correct: `Correct. ${phrase} of ${sol} is ${c}, so ${v} = ${sol}.`,
        wrong(ans, d) {
          if (nearTo(d.value, (c * a) / b))
            return `You multiplied ${c} by ${a}/${b}. That is the operation already in the equation. The inverse is dividing by ${a}/${b}, which means multiplying by ${b}/${a}.`;
          if (a !== 1 && nearTo(d.value, c * b)) return `${c} × ${b} = ${c * b} is a good first step, but you still need to divide by ${a}. ${v} = ${c * b} ÷ ${a}.`;
          if (a !== 1 && nearTo(d.value, c * a)) return `You multiplied by ${a}. The reciprocal of ${a}/${b} is ${b}/${a}: multiply by ${b}, then divide by ${a}.`;
          if (nearTo(d.value, c / a)) return `You divided by ${a} only. That finds one-${words[b]} of the rotation. A full rotation has ${b} of those parts, so multiply by ${b} too.`;
          if (nearTo(d.value, c + b) || nearTo(d.value, c - a)) return `Adding or subtracting does not undo multiplying by a fraction. Multiply ${c} by the reciprocal ${b}/${a}.`;
          return `${phrase} of ${v} is ${c}. The whole, ${v}, must be bigger than ${c}. Multiply ${c} by ${b}/${a}.`;
        },
      },
    };
  });

  // ---------- Who solved 3x = 12 correctly? (who, pan balance) ----------
  G.define('q3_whoMul', (r, o) => {
    const hard = !!o.hard;
    const [n1, n2, n3] = r.pickN(NAMES, 3);
    const v = r.pick(VARS);
    const a = hard ? r.pick([0.5, 1.5, 2.5, 0.25]) : r.int(2, 4);
    const sol = hard ? (a === 0.25 ? 4 * r.int(3, 12) : 2 * r.int(3, 15)) : r.int(3, 12);
    const b = round(a * sol, 2);
    const eq = `${num(a)}${v} = ${num(b)}`;
    const wrongB = hard
      ? {
          title: n2,
          html: `I divide the smaller number by the bigger number.<br>${v} = ${num(a)} ÷ ${num(b)}<br><b>${v} ≈ ${num(round(a / b, 2))}</b>`,
          why: `${n2} divided in the wrong order. To undo ${num(a)} × ${v}, divide the product by the coefficient: ${num(b)} ÷ ${num(a)}. That answer is less than 1, so ${num(a)} × ${v} would be far less than ${num(b)}.`,
        }
      : {
          title: n2,
          html: `I subtract ${a} from both sides to get ${v} alone.<br>${v} = ${b} − ${a}<br><b>${v} = ${b - a}</b>`,
          why: `${n2} treated ${a}${v} as ${v} + ${a}. The ${a} is multiplied by ${v}, not added. Subtraction undoes addition; division undoes multiplication. Check: ${a} × ${b - a} = ${a * (b - a)}, not ${b}.`,
        };
    const sh = shuffleOptions(
      r,
      [
        { title: n1, html: `${num(a)}${v} means ${num(a)} × ${v}, so I divide both sides by ${num(a)}.<br>${v} = ${num(b)} ÷ ${num(a)}<br><b>${v} = ${num(sol)}</b>`, ok: true },
        wrongB,
        {
          title: n3,
          html: `To undo the ${num(a)}, I multiply both sides by ${num(a)}.<br>${v} = ${num(b)} × ${num(a)}<br><b>${v} = ${num(round(b * a, 3))}</b>`,
          why: `${n3} multiplied by ${num(a)}, the same operation already in the equation. ${hard && a < 1 ? `Multiplying by a number less than 1 makes it smaller, but it still does not undo × ${num(a)}.` : 'That moves further from the answer.'} Check: ${num(a)} × ${num(round(b * a, 3))} ≠ ${num(b)}.`,
        },
      ],
      0,
    );
    const pic = hard
      ? `<p>A row of crates, each weighing ${hl(v)} kilograms, is modeled by ${hl(eq)}.</p>`
      : `<p>The scale is balanced. One pan holds ${hl(a)} crates that each weigh ${hl(v)}. The other pan holds a weight of ${hl(b)}.</p>${V.balance({ left: Array.from({ length: a }, () => v), right: [String(b)], aria: `Balanced scale: ${a} crates labeled ${v} on the left and a weight of ${b} on the right` })}`;
    return {
      type: 'who',
      skill: 'solve-mul',
      lesson: '8-3',
      title: hard ? 'Who is correct? (decimal coefficient)' : 'Who is correct?',
      prompt: `${pic}<p>Three Keepers solve ${hl(eq)}. Who is correct?</p>`,
      options: sh.options,
      answer: sh.answer,
      layout: 'cards',
      hints: [
        `${num(a)}${v} means ${num(a)} × ${v}. Which operation undoes multiplying by ${num(a)}?`,
        hard
          ? `Divide the product by the coefficient: ${num(b)} ÷ ${num(a)}. With a decimal divisor, multiply both numbers by ${a === 0.25 ? 100 : 10} first.`
          : `On the scale, ${a} equal crates weigh ${b} together. To find one crate, split ${b} into ${a} equal parts: divide.`,
        `Check each Keeper's answer by multiplying it by ${num(a)}. Only one gives ${num(b)}.`,
      ],
      hintEs: `${num(a)}${v} significa ${num(a)} × ${v}. ¿Qué operación deshace la multiplicación por ${num(a)}?`,
      solution: `<p><b>${n1}</b> is correct. ${num(a)}${v} is ${num(a)} × ${v}, so dividing both sides by ${num(a)} gives ${v} = ${num(b)} ÷ ${num(a)} = <b>${num(sol)}</b>. Check: ${num(a)} × ${num(sol)} = ${num(b)}. ✓ ${hard ? `${n2} divided in the wrong order.` : `${n2} subtracted, which undoes addition, not multiplication.`} ${n3} multiplied again instead of using the inverse.</p>`,
      feedback: {
        correct: `Correct. ${n1} used the inverse of multiplication: division. ${v} = ${num(sol)}.`,
        wrong(ans) {
          return (sh.options[ans] && sh.options[ans].why) || `Substitute each answer into ${eq}. Only one makes ${num(a)} × ${v} equal ${num(b)}.`;
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
      hintEs: `La operación inversa de dividir entre un número es multiplicar por ese mismo número. ¿Entre qué número se divide ${v}?`,
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
  G.define('q3_divWord', (r, o) => {
    const hard = !!o.hard;
    const name = r.pick(NAMES);
    const v = r.pick(['g', 'm', 'r', 'x']);
    const a = hard ? r.int(4, 12) : r.int(3, 9);
    const b = hard ? round(r.int(3, 15) + r.pick([0.5, 0.25, 0.75]), 2) : r.int(4, 15);
    const sol = round(a * b, 2);
    const ctx = hard
      ? r.pick([
          {
            text: `Each of ${hl(a + ' equal pieces')} of a ribbon is ${hl(num(b) + ' centimeters')} long. The pieces were cut from one ribbon ${hl(v)} centimeters long.`,
            varDef: `${v} = the length of the whole ribbon`,
          },
          {
            text: `${name} hiked ${hl(num(b) + ' miles')} each day for ${hl(a + ' days')} and finished a trail of ${hl(v)} miles, going the same distance each day.`,
            varDef: `${v} = the total length of the trail`,
          },
          { text: `${hl(money(b))} is one of ${hl(a + ' equal payments')}. Together the payments add up to the ${hl(v)} dollars ${name} saved.`, varDef: `${v} = the total amount saved` },
          { text: `A tank of ${hl(v)} liters of water was poured equally into ${hl(a + ' buckets')}. Each bucket got ${hl(num(b) + ' liters')}.`, varDef: `${v} = the liters in the tank` },
        ])
      : r.pick([
          { text: `${name} split a bag of ${hl(v)} marbles equally among ${hl(a + ' friends')}. Each friend got ${hl(b + ' marbles')}.`, varDef: `${v} = the number of marbles in the bag` },
          { text: `A ribbon ${hl(v)} centimeters long was cut into ${hl(a + ' equal pieces')}. Each piece is ${hl(b + ' centimeters')}.`, varDef: `${v} = the length of the whole ribbon` },
          { text: `${name} hiked a trail of ${hl(v)} miles over ${hl(a + ' days')}, going the same distance each day: ${hl(b + ' miles')}.`, varDef: `${v} = the total length of the trail` },
          { text: `${name} saved ${hl(v)} dollars and divided it into ${hl(a + ' equal payments')} of ${hl('$' + b)} each.`, varDef: `${v} = the total amount saved` },
        ]);
    const okEq = `${v} ÷ ${a} = ${num(b)}`;
    const eqs = r.shuffle([okEq, `${a} ÷ ${v} = ${num(b)}`, `${a}${v} = ${num(b)}`, ...(hard ? [`${v} − ${a} = ${num(b)}`] : [])]);
    const quot = String(round(b / a, 2));
    const sols = r.shuffle([String(sol), quot, String(round(b + a, 2)), ...(hard ? [String(round(sol + b, 2))] : [])].filter((x, i, arr) => arr.indexOf(x) === i));
    return {
      type: 'cloze',
      skill: 'solve-div',
      lesson: '8-3',
      title: hard ? 'Model and solve a division story (decimals)' : 'Model and solve a division story',
      prompt: `<p>${ctx.text}</p><p>Let ${hl(ctx.varDef)}. Complete the model and solve.</p>`,
      template: `Equation: {0}. To solve, {1} both sides by ${a}. ${v} = {2}.`,
      choices: [eqs, ['multiply', 'divide'], sols],
      answers: [eqs.indexOf(okEq), 0, sols.indexOf(String(sol))],
      hints: [
        `The whole amount ${v} is split into ${a} equal parts, and each part is ${num(b)}. Splitting into equal parts is division: whole ÷ parts = each.`,
        `The equation is ${okEq}. To undo dividing by ${a}, use the inverse operation.`,
        `Multiply both sides by ${a}: ${v} = ${num(b)} × ${a}.`,
      ],
      hintEs: `El total ${v} se reparte en ${a} partes iguales, y cada parte es ${num(b)}. Repartir en partes iguales es dividir: total ÷ partes = cada parte.`,
      solution: `<p>The whole is split into ${a} equal parts of ${num(b)}, so <b>${okEq}</b>. Division is undone by multiplication: <b>multiply</b> both sides by ${a}. ${v} = ${num(b)} × ${a} = <b>${num(sol)}</b>. Check: ${num(sol)} ÷ ${a} = ${num(b)}. ✓</p>`,
      feedback: {
        correct: `Correct. The whole divided into ${a} parts gives ${num(b)} each, so the whole is ${num(b)} × ${a} = ${num(sol)}.`,
        wrong(ans, d) {
          if (d.wrong.includes(0)) {
            const pick = eqs[ans[0]] || '';
            if (/^\d+ ÷/.test(pick)) return `${pick} says ${a} is split into ${v} parts, which is backwards. The whole, ${v}, is split into ${a} equal parts: ${v} ÷ ${a}.`;
            if (/−/.test(pick)) return `Nothing is taken away in this story. The whole is shared into equal parts, so the operation is division: ${v} ÷ ${a}.`;
            return `${a}${v} would mean ${a} groups of the whole. Here the whole is split into ${a} parts: ${v} ÷ ${a}.`;
          }
          if (d.wrong.includes(1)) return `The equation divides by ${a}. The inverse of division is multiplication.`;
          if (sols[ans[2]] === quot) return `You divided ${num(b)} by ${a}. The whole must be bigger than one part. Multiply: ${num(b)} × ${a}.`;
          return `Each of ${a} parts is ${num(b)}, so the whole is ${a} × ${num(b)}.`;
        },
      },
    };
  });

  // ---------- Match equations to solutions (match) ----------
  G.define('q3_matchSolutions', (r, o) => {
    const hard = !!o.hard;
    const v = r.pick(VARS);
    const sols = r.pickN(hard ? [6, 8, 10, 12, 14, 16, 18, 22, 26, 30] : [3, 4, 5, 6, 7, 8, 9, 10, 12, 15, 16, 18, 20, 24], 4);
    const kinds = r.shuffle(['mul', 'mul', 'div', 'div']);
    const built = sols.map((s, i) => {
      if (hard) {
        // hard: decimal coefficients (0.5x = 7) and decimal quotients (x ÷ 4 = 3.5)
        if (kinds[i] === 'mul') {
          const a = r.pick([0.5, 1.5, 2.5, 3.5]);
          const p = round(a * s, 2);
          return { eq: `${num(a)}${v} = ${num(p)}`, sol: s, step: `${num(p)} ÷ ${num(a)}`, kind: 'mul' };
        }
        const a = r.pick([4, 8, 5].filter((d) => s % d !== 0));
        return { eq: `${v} ÷ ${a} = ${num(round(s / a, 3))}`, sol: s, step: `${num(round(s / a, 3))} × ${a}`, kind: 'div' };
      }
      const divisors = [2, 3, 4, 5, 6].filter((d) => s % d === 0 && s / d >= 2);
      if (kinds[i] === 'mul' || !divisors.length) {
        const a = r.int(2, 9);
        return { eq: `${a}${v} = ${a * s}`, sol: s, step: `${a * s} ÷ ${a}`, kind: 'mul' };
      }
      const a = r.pick(divisors);
      return { eq: `${v} ÷ ${a} = ${s / a}`, sol: s, step: `${s / a} × ${a}`, kind: 'div' };
    });
    const rightOrder = r.shuffle([0, 1, 2, 3]);
    const left = built.map((x) => x.eq);
    const right = rightOrder.map((i) => `${v} = ${built[i].sol}`);
    const pairs = built.map((x, i) => [i, rightOrder.indexOf(i)]);
    return {
      type: 'match',
      skill: 'solve-div',
      lesson: '8-3',
      title: hard ? 'Match each equation to its solution (decimals)' : 'Match each equation to its solution',
      prompt: `<p>Four gears, four locks. Match each equation to the value of ${hl(v)} that solves it.</p>${hard ? '<p class="muted">The coefficients and quotients are decimals. The solutions are whole numbers.</p>' : ''}`,
      left,
      right,
      pairs,
      hints: [
        `For ${v} multiplied by a number, divide to solve. For ${v} divided by a number, multiply to solve.`,
        `For example, ${built[0].eq}: ${v} = ${built[0].step}.`,
        `Check each match by substituting the value back into its equation.`,
      ],
      hintEs: `Si ${v} está multiplicada por un número, divide para resolver. Si ${v} está dividida entre un número, multiplica para resolver.`,
      solution: `<p>${built.map((x) => `${x.eq} → ${v} = ${x.step} = ${x.sol}`).join('. ')}.</p>`,
      feedback: {
        correct: 'Correct. Division undoes multiplication, and multiplication undoes division.',
        wrong(ans, d) {
          const i = d.wrong && d.wrong[0];
          if (i == null || !built[i]) return 'Solve each equation with its inverse operation, then match.';
          const x = built[i];
          return x.kind === 'div'
            ? `Look again at ${x.eq}. ${v} is divided, so multiply to find it: ${x.step}. The solution is bigger than the quotient.`
            : `Look again at ${x.eq}. ${v} is multiplied, so divide to find it: ${x.step}.${hard && /^0\.|^\d\.5/.test(x.eq) ? ' Dividing by a decimal less than 1 makes the answer bigger.' : ''}`;
        },
      },
    };
  });

  // ---------- Error: divided when the inverse was multiplying (error) ----------
  G.define('q3_errorDiv', (r, o) => {
    const hard = !!o.hard;
    const name = r.pick(NAMES);
    const v = r.pick(VARS);
    const kind = r.chance(0.6) ? 'div' : 'mul';
    let a, b, sol, wrongSol, work;
    if (kind === 'div') {
      a = hard ? r.pick([2, 4, 5]) : r.int(2, 8);
      // hard: a decimal quotient chosen so the student's wrong answer (b ÷ a) is exact, not rounded
      const q = hard ? round(r.int(11, 60) / 10, 1) : r.int(2, 9);
      b = round(a * q, 2);
      sol = round(a * b, 2);
      wrongSol = round(b / a, 4);
      work = `${v} ÷ ${a} = ${num(b)}<br>${v} ÷ ${a} ÷ ${a} = ${num(b)} ÷ ${a}<br>${v} = ${num(wrongSol)}`;
    } else {
      a = hard ? r.pick([1.5, 2.5, 0.5]) : r.int(2, 8);
      sol = hard ? 2 * r.int(3, 15) : r.int(3, 12);
      b = round(a * sol, 2);
      wrongSol = round(b * a, 2);
      work = `${num(a)}${v} = ${num(b)}<br>${num(a)}${v} × ${num(a)} = ${num(b)} × ${num(a)}<br>${v} = ${num(wrongSol)}`;
    }
    const eq = kind === 'div' ? `${v} ÷ ${a} = ${num(b)}` : `${num(a)}${v} = ${num(b)}`;
    const same = kind === 'div' ? 'divided' : 'multiplied';
    const inv = kind === 'div' ? 'multiply' : 'divide';
    const checkVal = kind === 'div' ? round(wrongSol / a, 3) : round(a * wrongSol, 2);
    const opts = [
      { html: `${name} ${same} by ${num(a)}, but the equation already ${kind === 'div' ? 'divides' : 'multiplies'} by ${num(a)}. The inverse is to ${inv} both sides by ${num(a)}.`, ok: true },
      {
        html: `${name} should have ${kind === 'div' ? 'subtracted' : 'added'} ${num(a)} on both sides to get the variable alone.`,
        why: `${kind === 'div' ? 'Subtraction undoes addition' : 'Addition undoes subtraction'}, not ${kind === 'div' ? 'division' : 'multiplication'}. The equation ${kind === 'div' ? 'divides' : 'multiplies'} by ${num(a)}, so its inverse is ${kind === 'div' ? 'multiplication' : 'division'}.`,
      },
      {
        html: `${name} should have ${same} by ${num(a)} on only one side, the side with the variable.`,
        why: `Doing something to one side only unbalances the equation. The problem is the operation: ${name} needed the inverse, not the same operation.`,
      },
      {
        html: `There is no mistake. ${v} = ${num(wrongSol)} is correct, since both sides were changed the same way.`,
        why: `Check it: ${kind === 'div' ? `${num(wrongSol)} ÷ ${a} ${Math.abs(checkVal - wrongSol / a) < 1e-9 ? '=' : '≈'} ${Math.abs(checkVal - wrongSol / a) < 1e-9 ? checkVal : round(wrongSol / a, 2)}` : `${num(a)} × ${num(wrongSol)} = ${num(checkVal)}`}, not ${num(b)}. The answer does not make the equation true.`,
      },
    ];
    const sh = shuffleOptions(r, opts, 0);
    return {
      type: 'error',
      skill: kind === 'div' ? 'solve-div' : 'solve-mul',
      lesson: '8-3',
      title: hard ? 'Find the mistake (decimals)' : 'Find the mistake',
      prompt: `<p>${name} solved ${hl(eq)} like this. What went wrong?</p>`,
      work,
      options: sh.options,
      answer: sh.answer,
      fix: { label: `Correct solution: ${v} = `, answer: sol },
      hints: [
        `Check ${name}'s answer by substituting: ${kind === 'div' ? `${num(wrongSol)} ÷ ${a}` : `${num(a)} × ${num(wrongSol)}`} = ? Does it equal ${num(b)}?`,
        `The equation ${kind === 'div' ? 'divides' : 'multiplies'} by ${num(a)}. Doing the same operation again moves further from the answer. Use the inverse.`,
        `${inv === 'multiply' ? 'Multiply' : 'Divide'} both sides by ${num(a)}: ${v} = ${num(b)} ${kind === 'div' ? '×' : '÷'} ${num(a)}.`,
      ],
      hintEs: `Comprueba la respuesta de ${name} sustituyendo: ¿${kind === 'div' ? `${num(wrongSol)} ÷ ${a}` : `${num(a)} × ${num(wrongSol)}`} es igual a ${num(b)}?`,
      solution: `<p>${name} ${same} by ${num(a)}, the same operation already in the equation. The inverse undoes it: ${inv} both sides by ${num(a)}. ${v} = ${num(b)} ${kind === 'div' ? '×' : '÷'} ${num(a)} = <b>${num(sol)}</b>. Check: ${kind === 'div' ? `${num(sol)} ÷ ${a}` : `${num(a)} × ${num(sol)}`} = ${num(b)}. ✓</p>`,
      feedback: {
        correct: `Correct. ${kind === 'div' ? 'Multiplying' : 'Dividing'} by ${num(a)} undoes ${kind === 'div' ? 'dividing' : 'multiplying'} by ${num(a)}, so ${v} = ${num(sol)}.`,
        wrong(ans, d) {
          if (!d.mistakeOk)
            return (
              (sh.options[ans.mistake] && sh.options[ans.mistake].why) ||
              `Substitute ${num(wrongSol)} back into the equation. It does not work, so find the operation that undoes ${kind === 'div' ? '÷' : '×'} ${num(a)}.`
            );
          const f = parseNum(ans.fix);
          if (nearTo(f, wrongSol) || nearTo(f, round(wrongSol, 2)))
            return `That is ${name}'s answer, which does not check. ${inv === 'multiply' ? 'Multiply' : 'Divide'}: ${num(b)} ${kind === 'div' ? '×' : '÷'} ${num(a)}.`;
          if (nearTo(f, b)) return `${num(b)} is the other side of the equation. You still need to ${inv} by ${num(a)}.`;
          return `You found the mistake. Now ${inv} by ${num(a)}: ${v} = ${num(b)} ${kind === 'div' ? '×' : '÷'} ${num(a)}.`;
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
      step: o.step || 1,
      labelEvery: 1,
      width: o.width || 420,
      ray: { v: n, open: !incl(sym), dir: right(sym) ? 'right' : 'left' },
      aria: o.aria || `Number line from ${lo} to ${hi} with ${incl(sym) ? 'a closed' : 'an open'} circle at ${n} and shading to the ${right(sym) ? 'right' : 'left'}`,
    });
  };
  /** The same inequality written number-first: x > 4 ⇔ 4 < x. */
  const rev = (v, sym, n) => `${n} ${flipOf(sym)} ${v}`;
  /** Hard boundary on a half-unit with a 0.5-step number line (labels on whole numbers). */
  const halfLine = (r, lows) => {
    const lo = r.pick(lows || [0, 0, 5, 10]);
    const n = r.int(lo + 2, lo + 5) + 0.5;
    return { lo, hi: lo + 8, n, step: 0.5 };
  };

  // ---------- Phrase to symbol (cloze) ----------
  G.define('q4_phraseCloze', (r, o) => {
    const hard = !!o.hard;
    const s1 = situation(r, hard);
    let s2 = situation(r, hard);
    for (let guard = 0; guard < 6 && (s2.v === s1.v || s2.sym === s1.sym); guard++) s2 = situation(r, hard);
    const testVal = s1.n;
    const isSol = holds(testVal, s1.sym, s1.n);
    return {
      type: 'cloze',
      skill: 'write-ineq',
      lesson: '8-4',
      title: hard ? 'Choose the symbol (tricky words)' : 'Choose the symbol',
      prompt: `<p>Two gate rules are written in words. Choose the inequality symbol that matches each rule, then decide whether the boundary number is a solution.</p><p>Rule 1: ${hl(s1.shown)} Let ${s1.v} = ${s1.what}.</p><p>Rule 2: ${hl(s2.shown)} Let ${s2.v} = ${s2.what}.</p>`,
      template: `Rule 1: ${s1.v} {0} ${s1.n}. Rule 2: ${s2.v} {1} ${s2.n}. For Rule 1, the value ${s1.v} = ${testVal} {2} a solution.`,
      choices: [SYMS.slice(), SYMS.slice(), ['is', 'is not']],
      answers: [SYMS.indexOf(s1.sym), SYMS.indexOf(s2.sym), isSol ? 0 : 1],
      hints: [
        hard
          ? 'These rules are written in a roundabout way. First say which values ARE allowed, in your own words. Then pick the symbol for the allowed values.'
          : 'Key words tell you the symbol. "At least" and "no less than" mean ≥. "At most" and "no more than" mean ≤. "More than" means >. "Fewer than" or "less than" means <.',
        `Rule 1 means ${MEANING[s1.sym]}. Rule 2 means ${MEANING[s2.sym]}.`,
        `The boundary number ${s1.n} is a solution only when the symbol has the "or equal to" line (≤ or ≥).`,
      ],
      hintEs: hard
        ? 'Estas reglas están escritas de forma indirecta. Primero di con tus propias palabras qué valores SÍ se permiten. Luego elige el símbolo para esos valores.'
        : 'Las palabras clave te dicen el símbolo. "Como mínimo" y "no menos de" significan ≥. "Como máximo" y "no más de" significan ≤. "Más de" significa >. "Menos de" significa <.',
      solution: `<p>Rule 1: "${s1.shown}" means ${MEANING[s1.sym]}, so <b>${s1.ineq}</b>. Rule 2: "${s2.shown}" means ${MEANING[s2.sym]}, so <b>${s2.ineq}</b>. For Rule 1, ${s1.v} = ${s1.n} <b>${isSol ? 'is' : 'is not'}</b> a solution because ${s1.sym} ${incl(s1.sym) ? 'includes' : 'does not include'} ${s1.n}.</p>`,
      feedback: {
        correct: `Correct. The words set the direction, and "at least / at most" add the "or equal to" line.`,
        wrong(ans, d) {
          const coach = (s, picked) => {
            const p = SYMS[picked];
            if (p === toggleIncl(s.sym))
              return `Right direction, but check the boundary: ${incl(s.sym) ? `${s.n} itself IS allowed, so use ${s.sym}` : `${s.n} itself is NOT allowed, so use ${s.sym}`}.`;
            if (p === flipOf(s.sym) || p === toggleIncl(flipOf(s.sym))) return `That points the wrong way. The allowed values are ${right(s.sym) ? 'bigger' : 'smaller'} than ${s.n}.`;
            return `It means ${MEANING[s.sym]}.`;
          };
          if (d.wrong.includes(0)) return `Rule 1: ${coach(s1, ans[0])}`;
          if (d.wrong.includes(1)) return `Rule 2: ${coach(s2, ans[1])}`;
          return `Look at the symbol you chose for Rule 1. Only ≤ and ≥ include the boundary number, so ${s1.n} ${isSol ? 'is' : 'is not'} a solution.`;
        },
      },
    };
  });

  // ---------- Match phrases to inequalities (match) ----------
  const REV_PHRASE = { '>': 'is less than', '<': 'is greater than', '≥': 'is less than or equal to', '≤': 'is greater than or equal to' };
  G.define('q4_matchPhrases', (r, o) => {
    const hard = !!o.hard;
    const v = r.pick(['x', 'n', 'y', 'w']);
    const n = hard ? r.int(3, 30) + 0.5 : r.int(3, 30);
    // hard: two of the four sentences put the boundary number first ("12.5 is less than a number" means x > 12.5)
    const revSet = hard ? r.pickN([0, 1, 2, 3], 2) : [];
    const left = SYMS.map((s, i) => (revSet.includes(i) ? `${n} ${REV_PHRASE[s]} a number.` : `A number ${r.pick(PHRASES[s])} ${n}.`));
    const rightOrder = r.shuffle([0, 1, 2, 3]);
    const rightItems = rightOrder.map((i) => `${v} ${SYMS[i]} ${n}`);
    const pairs = SYMS.map((s, i) => [i, rightOrder.indexOf(i)]);
    return {
      type: 'match',
      skill: 'write-ineq',
      lesson: '8-4',
      title: hard ? 'Match words to inequalities (number first)' : 'Match words to inequalities',
      prompt: `<p>Match each sentence to its inequality. The variable ${hl(v)} stands for "a number."</p>${hard ? '<p class="muted">Careful: some sentences start with the boundary number, not with "a number."</p>' : ''}`,
      left,
      right: rightItems,
      pairs,
      hints: [
        'First decide the direction: bigger than the number (> or ≥) or smaller (< or ≤).',
        'Then decide whether the number itself counts. "At least," "at most," "no more than," and "no less than" include it, so they use ≤ or ≥.',
        hard
          ? `When the number comes first, turn the sentence around. "${n} is less than a number" means the number is greater than ${n}: ${v} > ${n}.`
          : `"${left[0]}" means ${MEANING['<']}: ${v} < ${n}.`,
      ],
      hintEs: hard
        ? `Primero decide la dirección: mayor que ${n} (> o ≥) o menor (< o ≤). Si el número ${n} va primero, voltea la oración: "${n} es menor que un número" significa que el número es mayor que ${n}.`
        : 'Primero decide la dirección: mayor que el número (> o ≥) o menor (< o ≤). Luego decide si el número mismo cuenta.',
      solution: `<p>${SYMS.map((s, i) => `${left[i].replace(/\.$/, '')} → ${v} ${s} ${n}.`).join(' ')}</p>`,
      feedback: {
        correct: 'Correct. Direction first, then check whether the boundary number is included.',
        wrong(ans, d) {
          const i = d.wrong && d.wrong[0];
          if (i == null) return 'Match the direction first, then decide whether the symbol needs the "or equal to" line.';
          if (revSet.includes(i)) return `"${left[i]}" starts with ${n}. Turn it around so the number comes first: the number is ${MEANING[SYMS[i]]}. That is ${v} ${SYMS[i]} ${n}.`;
          return `Look again at "${left[i]}". It means ${MEANING[SYMS[i]]}.`;
        },
      },
    };
  });

  // ---------- Sort phrases by symbol (sort) ----------
  const HARD_PH = {
    '>': [(n) => `A number is bigger than ${n}.`, (n) => `${n} is less than a number.`, (n) => `A number is above ${n}.`],
    '<': [(n) => `${n} is greater than a number.`, (n) => `A number is smaller than ${n}.`, (n) => `A number stays below ${n}.`],
    '≥': [(n) => `A number is ${n} or more.`, (n) => `A number cannot be less than ${n}.`, (n) => `${n} is less than or equal to a number.`],
    '≤': [(n) => `A number is ${n} or less.`, (n) => `A number cannot be more than ${n}.`, (n) => `${n} is greater than or equal to a number.`],
  };
  G.define('q4_sortPhrases', (r, o) => {
    const hard = !!o.hard;
    const v = r.pick(['x', 'n', 't', 'c']);
    const n = hard ? r.int(5, 40) + 0.5 : r.int(5, 40);
    const extra = hard ? [r.pick(SYMS), r.pick(SYMS), r.pick(SYMS)] : r.pickN(SYMS, 2);
    const items = [];
    SYMS.forEach((s) => {
      const count = 1 + extra.filter((e) => e === s).length;
      if (hard) r.pickN(HARD_PH[s], Math.min(count, 3)).forEach((f) => items.push({ html: f(n), bin: SYMS.indexOf(s) }));
      else r.pickN(PHRASES[s], count).forEach((ph) => items.push({ html: `A number ${ph} ${n}.`, bin: SYMS.indexOf(s) }));
    });
    const shuffled = r.shuffle(items);
    return {
      type: 'sort',
      skill: 'write-ineq',
      lesson: '8-4',
      title: hard ? 'Sort the phrases by symbol (tricky wording)' : 'Sort the phrases by symbol',
      prompt: `<p>Each phrase describes a number ${hl(v)}. Sort the phrases under the inequality they match.</p>${hard ? '<p class="muted">Some phrases start with the boundary number. Turn those around before you sort.</p>' : ''}`,
      bins: SYMS.map((s) => `${v} ${s} ${n}`),
      items: shuffled,
      hints: [
        'Two questions for each phrase: Is the number bigger or smaller than the boundary? Is the boundary itself allowed?',
        hard
          ? '"Or more" and "cannot be less than" allow the boundary and bigger values: ≥. "Or less" and "cannot be more than" allow the boundary and smaller values: ≤.'
          : '"At least" and "no less than" allow the boundary and bigger values: ≥. "At most" and "no more than" allow the boundary and smaller values: ≤.',
        hard
          ? `When ${n} comes first, turn the sentence around: "${n} is less than a number" means the number is greater than ${n}.`
          : '"More than," "exceeds," and "over" are strictly bigger: >. "Less than," "fewer than," "under," and "below" are strictly smaller: <.',
      ],
      hintEs: 'Haz dos preguntas para cada frase: ¿El número es mayor o menor que el límite? ¿Se permite el límite?',
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
          if (i == null || !shuffled[i]) return 'Decide the direction first, then whether the boundary number is included.';
          const it = shuffled[i];
          const put = ans && ans[i] != null ? SYMS[ans[i]] : null;
          const s = SYMS[it.bin];
          if (put && put === toggleIncl(s))
            return `"${it.html}" has the right direction in ${put}, but ${incl(s) ? `${n} itself is allowed, so it needs ${s}` : `${n} itself is not allowed, so it needs ${s}`}.`;
          if (put && (put === flipOf(s) || put === toggleIncl(flipOf(s))))
            return `"${it.html}" points the other way. ${new RegExp('^' + String(n).replace('.', '\\.')).test(it.html) ? `It starts with ${n}, so turn it around: ` : ''}the number is ${MEANING[s]}.`;
          return `Look again at "${it.html}" It means ${MEANING[s]}.`;
        },
      },
    };
  });

  // ---------- Write an inequality for a situation (mc) ----------
  /** Two-condition situations: both rules must hold, so only the tighter (binding) limit matters. */
  const TWO = [
    (r) => {
      const a = r.int(10, 14),
        b = a - r.int(2, 4);
      return {
        shown: `A cart may carry no more than ${a} crates. The old bridge allows no more than ${b} crates on a cart at a time.`,
        ask: 'the number of crates on a cart that crosses the bridge',
        v: 'c',
        sym: '≤',
        n: b,
        other: a,
        why: `${a} is the cart's limit, but the bridge allows only ${b}. A cart with ${b + 1} crates obeys the cart rule and breaks the bridge rule, so the tighter limit, ${b}, decides.`,
      };
    },
    (r) => {
      const a = r.pick([40, 45, 50]),
        b = a + r.pick([10, 15, 20]);
      return {
        shown: `A Keeper needs a score of at least ${a} points to pass the trial and at least ${b} points to earn a silver seal.`,
        ask: 'a score that earns the silver seal',
        v: 'k',
        sym: '≥',
        n: b,
        other: a,
        why: `${a} is enough to pass, but not enough for the seal. A score of ${a + 1} passes the trial and still misses the seal, so the seal's limit, ${b}, decides.`,
      };
    },
    (r) => {
      const a = r.pick([12, 14, 16]),
        b = a - r.pick([2, 4]);
      return {
        shown: `Riders on the sky-lift must be older than ${b}. Riders in the front seat must be older than ${a}.`,
        ask: 'the age of a rider in the front seat',
        v: 'a',
        sym: '>',
        n: a,
        other: b,
        why: `Being older than ${b} lets you ride, but the front seat needs more. A ${a}-year-old is older than ${b} and still may not sit in front, so ${a} decides.`,
      };
    },
  ];
  G.define('q4_writeSituation', (r, o) => {
    const hard = !!o.hard;
    let opts, s;
    if (hard && r.chance(0.45)) {
      const t = r.pick(TWO)(r);
      s = { shown: t.shown, v: t.v, n: t.n, sym: t.sym, what: t.ask, ineq: `${t.v} ${t.sym} ${t.n}`, two: t };
      opts = [
        { html: s.ineq, ok: true },
        { html: `${s.v} ${s.sym} ${t.other}`, why: t.why },
        { html: `${s.v} ${toggleIncl(s.sym)} ${s.n}`, why: whyWrong(s, toggleIncl(s.sym)) },
        { html: `${s.v} ${flipOf(s.sym)} ${s.n}`, why: whyWrong(s, flipOf(s.sym)) },
      ];
    } else {
      s = situation(r, hard);
      opts = [
        { html: s.ineq, ok: true },
        { html: `${s.v} ${toggleIncl(s.sym)} ${s.n}`, why: whyWrong(s, toggleIncl(s.sym)) },
        { html: `${s.v} ${flipOf(s.sym)} ${s.n}`, why: whyWrong(s, flipOf(s.sym)) },
      ];
      if (hard) opts.push({ html: `${s.v} ${toggleIncl(flipOf(s.sym))} ${s.n}`, why: whyWrong(s, toggleIncl(flipOf(s.sym))) });
      else opts.push({ html: `${s.v} = ${s.n}`, why: `An equation has one solution. This rule allows many values of ${s.v}, so it needs an inequality, not an equals sign.` });
    }
    const sh = shuffleOptions(r, opts, 0);
    return {
      type: 'mc',
      skill: 'write-ineq',
      lesson: '8-4',
      title: s.two ? 'Write the inequality (two rules)' : hard ? 'Write the inequality (tricky words)' : 'Write the inequality',
      prompt: `<p>${hl(s.shown)}</p><p>Let ${hl(s.v + ' = ' + s.what)}. Which inequality represents ${s.two ? 'the values that follow both rules' : 'the rule'}?</p>`,
      options: sh.options,
      answer: sh.answer,
      hints: [
        s.two
          ? `Both rules must be true at once. Find which limit is tighter: a value can pass one rule and still fail the other.`
          : hard
            ? `Rewrite the rule in your own words first. Which values of ${s.v} are allowed: values bigger than ${s.n}, or smaller? Is ${s.n} itself allowed?`
            : `Find the key words. They tell you the direction and whether ${s.n} itself is allowed.`,
        `The allowed values are ${right(s.sym) ? 'bigger' : 'smaller'} than ${s.n}${incl(s.sym) ? ', and ' + s.n + ' itself is allowed' : ', and ' + s.n + ' itself is not allowed'}.`,
        `${right(s.sym) ? 'Bigger' : 'Smaller'} values need ${right(s.sym) ? '> or ≥' : '< or ≤'}. ${incl(s.sym) ? 'Because ' + s.n + ' is allowed, use the symbol with the "or equal to" line.' : 'Because ' + s.n + ' is not allowed, use the strict symbol.'}`,
      ],
      hintEs: s.two
        ? 'Las dos reglas tienen que cumplirse a la vez. Busca cuál límite es más estricto: un valor puede cumplir una regla y no cumplir la otra.'
        : hard
          ? `Primero di la regla con tus propias palabras. ¿Qué valores de ${s.v} se permiten: mayores o menores que ${s.n}? ¿Se permite ${s.n}?`
          : `Busca las palabras clave. Te dicen la dirección y si ${s.n} está permitido.`,
      solution: s.two
        ? `<p>Both rules must hold. ${s.two.why} So the inequality is <b>${s.ineq}</b>. ${incl(s.sym) ? `${s.n} itself is a solution.` : `${s.n} itself is not a solution.`}</p>`
        : `<p>"${s.shown}" means ${s.v} is ${MEANING[s.sym]}. So the inequality is <b>${s.ineq}</b>. ${incl(s.sym) ? `${s.n} itself is a solution.` : `${s.n} itself is not a solution.`}</p>`,
      feedback: {
        correct: `Correct. ${s.ineq}: the direction matches the rule, and the symbol ${incl(s.sym) ? 'includes' : 'leaves out'} ${s.n}.`,
        wrong(ans) {
          const op = sh.options[ans];
          return (op && op.why) || `Decide the direction from the words, then whether ${s.n} itself is allowed.`;
        },
      },
    };
  });

  // ---------- Graph to inequality (mc) ----------
  G.define('q4_graphToIneq', (r, o) => {
    const hard = !!o.hard;
    const v = r.pick(['x', 'n', 'y', 'm']);
    const sym = r.pick(SYMS);
    let lo, hi, n, step;
    if (hard) ({ lo, hi, n, step } = halfLine(r));
    else {
      lo = r.chance(0.3) ? -5 : r.pick([0, 0, 5, 10]);
      hi = lo + 10;
      n = r.int(lo + 1, lo + 9);
      step = 1;
    }
    const mk = (s) => `${v} ${s} ${n}`;
    const circleWhy = `The circle is ${incl(sym) ? 'closed (filled in), so ' + n + ' is a solution and the symbol needs the "or equal to" line' : 'open, so ' + n + ' is not a solution and the symbol must be strict'}.`;
    const dirWhy = `The shading goes to the ${right(sym) ? 'right, toward bigger numbers' : 'left, toward smaller numbers'}. So ${v} is ${right(sym) ? 'greater' : 'less'} than ${n}.`;
    // hard: every option is written number-first, so the student must read the symbol from the number's side
    const opts = hard
      ? [
          { html: rev(v, sym, n), ok: true },
          {
            html: `${n} ${sym} ${v}`,
            why: `${n} ${sym} ${v} says ${v} is ${right(sym) ? 'less' : 'greater'} than${incl(sym) ? ' or equal to' : ''} ${n}. When the number is written first, the symbol flips compared with ${v} ${sym} ${n}. ${dirWhy}`,
          },
          { html: rev(v, toggleIncl(sym), n), why: `This points the right way, but the circle is wrong. ${circleWhy}` },
          { html: `${n} ${toggleIncl(sym)} ${v}`, why: `Both parts are off. ${dirWhy} ${circleWhy}` },
        ]
      : [
          { html: mk(sym), ok: true },
          { html: mk(toggleIncl(sym)), why: `${circleWhy} Use ${sym}.` },
          { html: mk(flipOf(sym)), why: `${dirWhy} Use ${sym}.` },
          {
            html: mk(toggleIncl(flipOf(sym))),
            why: `Both parts are off. The shading goes ${right(sym) ? 'right (greater)' : 'left (less)'}, and the circle is ${incl(sym) ? 'closed (includes ' + n + ')' : 'open (does not include ' + n + ')'}.`,
          },
        ];
    const sh = shuffleOptions(r, opts, 0);
    const okText = hard ? rev(v, sym, n) : mk(sym);
    return {
      type: 'mc',
      skill: 'represent-ineq',
      lesson: '8-4',
      title: hard ? 'Read the graph (number first)' : 'Read the graph',
      prompt: `<p>A gate shows this graph. Look at the circle (open or closed) and the direction of the shading.</p>${graph(n, sym, { min: lo, max: hi, step })}<p>Which inequality does the graph represent?${hard ? ' Each choice is written with the number first.' : ''}</p>`,
      options: sh.options,
      answer: sh.answer,
      hints: [
        'The circle sits on the boundary number. Shading to the right means greater than; shading to the left means less than.',
        `The boundary is ${n}. The shading goes to the ${right(sym) ? 'right' : 'left'}, so the solutions are ${right(sym) ? 'greater' : 'less'} than ${n}.`,
        hard
          ? `First write it with ${v} first, then turn it around: ${v} > 3 is the same as 3 < ${v}. Check the circle for the "or equal to" line.`
          : `The circle is ${incl(sym) ? 'closed, so ' + n + ' is included: use the symbol with the "or equal to" line' : 'open, so ' + n + ' is not included: use the strict symbol'}.`,
      ],
      hintEs: 'El círculo está sobre el número del límite. Sombrear a la derecha significa mayor que; sombrear a la izquierda significa menor que.',
      solution: `<p>The boundary is ${n}. The shading goes to the ${right(sym) ? 'right (greater than)' : 'left (less than)'}, and the circle is ${incl(sym) ? 'closed, so ' + n + ' is included' : 'open, so ' + n + ' is not included'}. The graph shows ${mk(sym)}${hard ? `, which is written number-first as <b>${okText}</b>` : ''}${hard ? '' : ` <b>(${okText})</b>`}.</p>`,
      feedback: {
        correct: `Correct. ${right(sym) ? 'Right' : 'Left'} shading means ${right(sym) ? 'greater' : 'less'} than, and the ${incl(sym) ? 'closed' : 'open'} circle means ${n} ${incl(sym) ? 'is' : 'is not'} a solution.`,
        wrong(ans) {
          const op = sh.options[ans];
          return (op && op.why) || 'Read the circle and the shading separately, then pick the symbol.';
        },
      },
    };
  });

  // ---------- Inequality to graph (mc with graphs as options) ----------
  G.define('q4_ineqToGraph', (r, o) => {
    const hard = !!o.hard;
    const v = r.pick(['x', 'a', 't', 'k']);
    const sym = r.pick(SYMS);
    let lo, hi, n, step, n2;
    if (hard) {
      ({ lo, hi, n, step } = halfLine(r));
      n2 = n + r.pick([-0.5, 0.5]);
    } else {
      lo = r.pick([0, 0, 5, 10, -5]);
      hi = lo + 10;
      n = r.int(lo + 2, lo + 8);
      step = 1;
      n2 = n + r.pick([-1, 1]);
    }
    const shown = hard ? rev(v, sym, n) : `${v} ${sym} ${n}`;
    const g = (val, s) => graph(val, s, { min: lo, max: hi, step, width: 300 });
    const opts = [
      { html: g(n, sym), ok: true },
      {
        html: g(n, toggleIncl(sym)),
        why: `${shown} ${incl(sym) ? 'includes' : 'does not include'} ${n}, so the circle must be ${incl(sym) ? 'closed (filled in)' : 'open'}. This graph has the wrong kind of circle.`,
      },
      {
        html: g(n, flipOf(sym)),
        why: hard
          ? `${shown} means ${v} ${sym} ${n}: ${v} is ${right(sym) ? 'greater' : 'less'} than ${n}. This graph follows the symbol as written from the number's side, so it is shaded the wrong way.`
          : `${v} ${sym} ${n} means ${v} is ${right(sym) ? 'greater' : 'less'} than ${n}, so shade toward the ${right(sym) ? 'right (bigger numbers)' : 'left (smaller numbers)'}. This graph is shaded the wrong way.`,
      },
      { html: g(n2, sym), why: `The circle must sit on the boundary number, ${n}. This graph puts it at ${n2}.` },
    ];
    const sh = shuffleOptions(r, opts, 0);
    return {
      type: 'mc',
      skill: 'represent-ineq',
      lesson: '8-4',
      title: hard ? 'Choose the graph (number first)' : 'Choose the graph',
      prompt: `<p>Which graph represents ${hl(shown)}?</p>`,
      options: sh.options,
      answer: sh.answer,
      layout: 'cards',
      hints: [
        hard
          ? `Rewrite ${shown} with ${v} first. Then check where the circle is, whether it is open or closed, and which way the shading goes.`
          : 'Three things to check: where the circle is, whether it is open or closed, and which way the shading goes.',
        `The boundary is ${n}, so the circle sits at ${n}. ${sym} ${incl(sym) ? 'includes' : 'does not include'} ${n}, so the circle is ${incl(sym) ? 'closed' : 'open'}.`,
        `${v} ${sym} ${n} means ${v} is ${right(sym) ? 'greater' : 'less'} than ${n}, so the shading goes to the ${right(sym) ? 'right' : 'left'}.`,
      ],
      hintEs: hard
        ? `Escribe ${shown} con ${v} primero. Luego revisa dónde está el círculo, si es abierto o cerrado, y hacia dónde va el sombreado.`
        : 'Revisa tres cosas: dónde está el círculo, si es abierto o cerrado, y hacia dónde va el sombreado.',
      solution: `${g(n, sym)}<p>${hard ? `${shown} is the same as ${v} ${sym} ${n}. ` : ''}Put ${incl(sym) ? 'a closed' : 'an open'} circle at ${n} because ${sym} ${incl(sym) ? 'includes' : 'does not include'} the boundary. Shade to the ${right(sym) ? 'right' : 'left'} because the solutions are ${right(sym) ? 'greater' : 'less'} than ${n}.</p>`,
      feedback: {
        correct: `Correct. ${incl(sym) ? 'Closed' : 'Open'} circle at ${n}, shaded to the ${right(sym) ? 'right' : 'left'}.`,
        wrong(ans) {
          const op = sh.options[ans];
          return (op && op.why) || 'Check the boundary, the circle type, and the shading direction one at a time.';
        },
      },
    };
  });

  // ---------- Does the graph show this inequality? (tf) ----------
  G.define('q4_tfGraph', (r, o) => {
    const hard = !!o.hard;
    const v = r.pick(['x', 'n', 'p', 'w']);
    const sym = r.pick(SYMS);
    let lo, hi, n, step;
    if (hard) ({ lo, hi, n, step } = halfLine(r, [0, 0, 5, -5]));
    else {
      lo = r.pick([0, 0, 5, -5]);
      hi = lo + 10;
      n = r.int(lo + 2, lo + 8);
      step = 1;
    }
    const said = hard ? rev(v, sym, n) : `${v} ${sym} ${n}`;
    const match = r.chance(0.5);
    const kind = match ? 'ok' : r.pick(['circle', 'dir']);
    const gsym = kind === 'ok' ? sym : kind === 'circle' ? toggleIncl(sym) : flipOf(sym);
    const reasons = r.shuffle([
      {
        html: match
          ? `True. The circle at ${n} is ${incl(sym) ? 'closed, so ' + n + ' is included' : 'open, so ' + n + ' is not included'}, and the shading goes ${right(sym) ? 'right for greater than' : 'left for less than'}.`
          : kind === 'circle'
            ? `False. The circle is ${incl(gsym) ? 'closed' : 'open'}, but ${said} ${incl(sym) ? 'includes' : 'does not include'} ${n}, so the circle should be ${incl(sym) ? 'closed' : 'open'}.`
            : `False. The shading goes ${right(gsym) ? 'right' : 'left'}, but ${said} means ${v} is ${right(sym) ? 'greater' : 'less'} than ${n}, so it should go ${right(sym) ? 'right' : 'left'}.`,
        correct: true,
      },
      {
        html: match ? `False. A graph of an inequality needs a circle at 0, not at ${n}.` : `True. The circle is at ${n}, and that is all that matters.`,
        correct: false,
      },
      {
        html: match
          ? hard
            ? `False. The symbol in ${said} points ${right(flipOf(sym)) ? 'right' : 'left'}, so the shading must go ${right(flipOf(sym)) ? 'right' : 'left'}.`
            : `False. The shading should go both ways because an inequality has many solutions.`
          : `True. Open and closed circles mean the same thing, and either direction of shading works.`,
        correct: false,
      },
    ]);
    return {
      type: 'tf',
      skill: 'represent-ineq',
      lesson: '8-4',
      title: hard ? 'Does the graph match? (number first)' : 'Does the graph match?',
      prompt: `<p>${r.pick(NAMES)} says, "This graph represents ${hl(said)}."</p>${graph(n, gsym, { min: lo, max: hi, step })}<p>Is that true?</p>`,
      answer: match,
      reasons,
      labels: ['True', 'False'],
      hints: [
        hard
          ? `Rewrite ${said} with ${v} first. Then check the boundary number, the kind of circle, and the direction of the shading.`
          : 'Check three things: the boundary number, the kind of circle, and the direction of the shading.',
        `${v} ${sym} ${n}: the circle should be ${incl(sym) ? 'closed' : 'open'} at ${n}, and the shading should go ${right(sym) ? 'right' : 'left'}.`,
        `In the graph, the circle is ${incl(gsym) ? 'closed' : 'open'} and the shading goes ${right(gsym) ? 'right' : 'left'}. Compare.`,
      ],
      hintEs: hard
        ? `Escribe ${said} con ${v} primero. Luego revisa el número del límite, el tipo de círculo y la dirección del sombreado.`
        : 'Revisa tres cosas: el número del límite, el tipo de círculo y la dirección del sombreado.',
      solution: `<p>${hard ? `${said} is the same as ${v} ${sym} ${n}. ` : ''}${v} ${sym} ${n} needs ${incl(sym) ? 'a closed' : 'an open'} circle at ${n} with shading to the ${right(sym) ? 'right' : 'left'}. The graph has ${incl(gsym) ? 'a closed' : 'an open'} circle with shading to the ${right(gsym) ? 'right' : 'left'}. So the statement is <b>${match ? 'true' : 'false'}</b>${match ? '.' : kind === 'circle' ? ': the circle is wrong.' : ': the shading direction is wrong.'}</p>`,
      feedback: {
        correct: match ? 'Correct. Boundary, circle, and direction all match.' : `Correct. The ${kind === 'circle' ? 'circle type' : 'shading direction'} does not match ${said}.`,
        wrong(ans, d) {
          if (!d.valueOk && hard && kind !== 'circle')
            return `${said} has the number first. Read it from ${v}'s side: ${v} ${sym} ${n}, so the shading must go ${right(sym) ? 'right' : 'left'}. Then check the circle.`;
          if (!d.valueOk) return `Compare carefully. ${said} needs ${incl(sym) ? 'a closed' : 'an open'} circle and shading to the ${right(sym) ? 'right' : 'left'}. Does the graph have both?`;
          return 'Your true/false is right, but the reason must name the circle type and the shading direction.';
        },
      },
    };
  });

  // ---------- Error: wrong circle or wrong direction (error) ----------
  G.define('q4_errorGraph', (r, o) => {
    const hard = !!o.hard;
    const name = r.pick(NAMES);
    const v = r.pick(['x', 'n', 'y', 't']);
    const sym = r.pick(SYMS);
    let lo, hi, n, step;
    if (hard) ({ lo, hi, n, step } = halfLine(r, [0, 0, 5, 10]));
    else {
      lo = r.pick([0, 0, 5, -5]);
      hi = lo + 10;
      n = r.int(lo + 2, lo + 8);
      step = 1;
    }
    const kind = r.pick(['circle', 'dir']);
    const gsym = kind === 'circle' ? toggleIncl(sym) : flipOf(sym);
    const ineq = `${v} ${sym} ${n}`;
    const whole = Number.isInteger(n);
    // smallest (or largest) WHOLE-number solution; with a half-unit boundary the circle type no longer changes it
    const fixAns = right(sym) ? (whole ? (incl(sym) ? n : n + 1) : Math.ceil(n)) : whole ? (incl(sym) ? n : n - 1) : Math.floor(n);
    const g = (s) => graph(n, s, { min: lo, max: hi, step });
    const opts = [
      {
        html:
          kind === 'circle'
            ? `${name} used ${incl(gsym) ? 'a closed' : 'an open'} circle. ${sym} ${incl(sym) ? 'includes' : 'does not include'} ${n}, so the circle should be ${incl(sym) ? 'closed' : 'open'}.`
            : `${name} shaded toward the ${right(gsym) ? 'right' : 'left'}. ${ineq} means ${v} is ${right(sym) ? 'greater' : 'less'} than ${n}, so the shading should go ${right(sym) ? 'right' : 'left'}.`,
        ok: true,
      },
      {
        html: kind === 'circle' ? `${name} shaded the wrong direction, so the solutions are on the wrong side of ${n}.` : `${name} used the wrong kind of circle, so ${n} is marked the wrong way.`,
        why:
          kind === 'circle'
            ? `The shading goes ${right(gsym) ? 'right' : 'left'}, which is correct for ${sym}. Look at the circle instead: is ${n} a solution of ${ineq}?`
            : `The circle is ${incl(gsym) ? 'closed' : 'open'}, which is correct for ${sym}. Look at the direction instead: are solutions bigger or smaller than ${n}?`,
      },
      { html: `${name} put the circle at the wrong number on the line.`, why: `The circle is at ${n}, which is the boundary in ${ineq}. That part is correct.` },
      {
        html: `There is no mistake in the graph.`,
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
      title: hard ? 'Find the mistake in the graph (decimal boundary)' : 'Find the mistake in the graph',
      prompt: `<p>${name} graphed ${hl(ineq)} like this. What went wrong?</p>`,
      work: g(gsym),
      options: sh.options,
      answer: sh.answer,
      fix: { label: fixLabel, answer: fixAns },
      hints: [
        `Check the circle and the direction separately. ${sym} ${incl(sym) ? 'includes' : 'does not include'} ${n}; solutions are ${right(sym) ? 'greater' : 'less'} than ${n}.`,
        kind === 'circle'
          ? `The shading direction is fine. Now look at the circle: should ${n} be filled in or left open?`
          : `The circle is fine. Now look at the shading: pick a number on the shaded side and test it in ${ineq}.`,
        whole
          ? `For the fix, ${incl(sym) ? n + ' itself is a solution.' : n + ' is not a solution, so move one whole number ' + (right(sym) ? 'up' : 'down') + '.'}`
          : `For the fix, ${n} is not a whole number. Find the first whole number ${right(sym) ? 'above' : 'below'} ${n}.`,
      ],
      hintEs: `Revisa el círculo y la dirección por separado. ${sym} ${incl(sym) ? 'incluye' : 'no incluye'} a ${n}; las soluciones son ${right(sym) ? 'mayores' : 'menores'} que ${n}.`,
      solution: `${g(sym)}<p>${kind === 'circle' ? `The circle is wrong. ${sym} ${incl(sym) ? 'includes' : 'does not include'} ${n}, so the circle must be ${incl(sym) ? 'closed' : 'open'}.` : `The direction is wrong. ${ineq} means ${v} is ${right(sym) ? 'greater' : 'less'} than ${n}, so shade to the ${right(sym) ? 'right' : 'left'}.`} The ${right(sym) ? 'smallest' : 'largest'} whole-number solution is <b>${fixAns}</b>.</p>`,
      feedback: {
        correct: `Correct. ${ineq}: ${incl(sym) ? 'closed' : 'open'} circle at ${n}, shaded ${right(sym) ? 'right' : 'left'}.`,
        wrong(ans, d) {
          if (!d.mistakeOk) return (sh.options[ans.mistake] && sh.options[ans.mistake].why) || `Check the circle type and the shading direction against ${ineq}.`;
          const f = RX.parseNum(ans.fix);
          if (f != null && f === n && !incl(sym))
            return `${n} is the boundary, but ${sym} does not include it. The ${right(sym) ? 'smallest' : 'largest'} whole-number solution is one step ${right(sym) ? 'above' : 'below'} ${n}.`;
          if (f != null && f === n) return `${n} is not a whole number. Find the first whole number ${right(sym) ? 'above' : 'below'} it.`;
          if (f != null && f === (right(sym) ? fixAns - 1 : fixAns + 1)) return `${f} is on the wrong side of ${n}. Test it: ${v} = ${f} does not make ${ineq} true.`;
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
  const wordsEs = (s) => (s === '<' ? 'menor que' : s === '>' ? 'mayor que' : s === '≤' ? 'menor o igual que' : 'mayor o igual que');
  const num = (x) => (Number.isInteger(x) ? String(x) : String(round(x, 2)));
  const dirWord = (s) => (right(s) ? 'right' : 'left');
  const circleWord = (s) => (incl(s) ? 'closed' : 'open');
  /** The same inequality written number-first: x > 4 ⇔ 4 < x. */
  const rev = (v, sym, n) => `${num(n)} ${flipOf(sym)} ${v}`;
  const GRAPH_ES = 'Tres pasos: pon el círculo sobre el número del límite, elige círculo abierto o cerrado según el símbolo y luego sombrea hacia las soluciones.';
  const graphHints = (v, sym, n) => [
    'Three steps: put the circle on the boundary number, choose open or closed from the symbol, then shade toward the solutions.',
    `The boundary is ${num(n)}. ${sym} ${incl(sym) ? 'includes' : 'does not include'} ${num(n)}, so the circle is ${circleWord(sym)}.`,
    `${v} ${sym} ${num(n)} means ${v} is ${words(sym)} ${num(n)}. Solutions are ${right(sym) ? 'bigger' : 'smaller'}, so shade to the ${dirWord(sym)}.`,
  ];
  const graphSolution = (v, sym, n) =>
    `<p>The boundary is ${num(n)}, so the circle goes at ${num(n)}. ${sym} ${incl(sym) ? 'includes' : 'does not include'} the boundary, so the circle is <b>${circleWord(sym)}</b>. ${v} ${sym} ${num(n)} means ${v} is ${words(sym)} ${num(n)}, so shade to the <b>${dirWord(sym)}</b>. Every shaded point is a solution, so the graph shows infinitely many solutions.</p>`;
  const graphWrong = (v, sym, n) => (ans, d) => {
    if (d.pointOk === false && ans && ans.point != null)
      return `Your circle is at ${num(ans.point)}, but the boundary in ${v} ${sym} ${num(n)} is ${num(n)}. ${Number.isInteger(n) ? '' : 'It sits halfway between two whole numbers. '}Move the circle there.`;
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
  const HALF_LINE = { min: 0, max: 10, step: 0.5, labelEvery: 1 };

  // ---------- Graph an inequality (ineq) ----------
  G.define('q5_graphIneq', (r, o) => {
    const hard = !!o.hard;
    const v = r.pick(['x', 'n', 'y', 'm']);
    const sym = r.pick(SYMS);
    // hard: a negative or large boundary on a wider line, or a half-unit boundary on a 0.5-step line
    const kind = hard ? r.pick(['wide', 'half']) : 'plain';
    const n = kind === 'half' ? r.int(1, 8) + 0.5 : hard ? r.pick([r.int(-8, 8), r.int(11, 19)]) : r.int(1, 9);
    const line = kind === 'half' ? HALF_LINE : n > 10 ? lineFor(r, n, { wide: true }) : hard ? { min: -10, max: 10, step: 1, labelEvery: 2 } : lineFor(r, n);
    return Object.assign(
      {
        type: 'ineq',
        skill: 'graph-ineq',
        lesson: '8-5',
        title: kind === 'half' ? 'Graph the inequality (decimal boundary)' : hard ? 'Graph the inequality (wider line)' : 'Graph the inequality',
        prompt: `<p>Light the Skybridge: graph ${hl(`${v} ${sym} ${num(n)}`)} on the number line.</p><p class="muted">Choose the circle type, choose the shading direction, then click the boundary point.${kind === 'half' ? ' The small ticks are halves.' : ''}</p>`,
        point: n,
        open: !incl(sym),
        dir: dirWord(sym),
        hints: graphHints(v, sym, n),
        hintEs: GRAPH_ES,
        solution: graphSolution(v, sym, n),
        feedback: { correct: `Correct. ${circleWord(sym)[0].toUpperCase() + circleWord(sym).slice(1)} circle at ${num(n)}, shaded to the ${dirWord(sym)}.`, wrong: graphWrong(v, sym, n) },
      },
      line,
    );
  });

  // ---------- Graph an inequality from a situation (ineq) ----------
  G.define('q5_graphContext', (r, o) => {
    const hard = !!o.hard;
    const name = r.pick(NAMES);
    const easy = [
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
    ];
    // hard: half-unit boundaries and rules stated as what is NOT allowed
    const tough = [
      () => {
        const n = r.int(5, 8) + 0.5;
        return { text: `A bag that weighs ${n} kilograms or more is not allowed on the lift.`, v: 'w', n, sym: '<', what: 'the weight of an allowed bag in kilograms' };
      },
      () => {
        const n = r.int(6, 8) + 0.5;
        return { text: `${name} should never sleep less than ${n} hours.`, v: 'h', n, sym: '≥', what: 'hours of sleep' };
      },
      () => {
        const n = r.int(2, 7) + 0.5;
        return { text: `A cup of trail mix costs over $${n.toFixed(2)}.`, v: 'c', n, sym: '>', what: 'the cost of a cup in dollars' };
      },
      () => {
        const n = r.int(3, 8) + 0.5;
        return { text: `A rope longer than ${n} meters will not fit in the crate.`, v: 'L', n, sym: '≤', what: 'the length of a rope that fits, in meters' };
      },
    ];
    const s = r.pick(hard ? tough : easy)();
    const ineq = `${s.v} ${s.sym} ${num(s.n)}`;
    const line = hard ? HALF_LINE : { min: 0, max: 10, step: 1, labelEvery: 1 };
    return Object.assign(
      {
        type: 'ineq',
        skill: 'graph-ineq',
        lesson: '8-5',
        title: hard ? 'Graph the situation (read the rule carefully)' : 'Graph the situation',
        prompt: `<p>${hl(s.text)} Let ${s.v} = ${s.what}.</p><p>Write the inequality in your head, then graph it on the number line.${hard ? ' The small ticks are halves.' : ''}</p>`,
        point: s.n,
        open: !incl(s.sym),
        dir: dirWord(s.sym),
        hints: [
          hard
            ? `The rule tells you what is NOT allowed. Flip it to say which values ARE allowed, then write the symbol for those values.`
            : `First turn the words into symbols. "${s.text}" means ${s.v} is ${words(s.sym)} ${s.n}: ${ineq}.`,
        ].concat(graphHints(s.v, s.sym, s.n).slice(1)),
        hintEs: hard
          ? 'La regla dice lo que NO se permite. Cámbiala para decir qué valores SÍ se permiten y luego escribe el símbolo para esos valores.'
          : `Primero convierte las palabras en símbolos: ${ineq}. Luego pon el círculo en ${s.n} y sombrea hacia las soluciones.`,
        solution: `<p>"${s.text}" means <b>${ineq}</b>.</p>` + graphSolution(s.v, s.sym, s.n),
        feedback: {
          correct: `Correct. ${ineq}: ${circleWord(s.sym)} circle at ${num(s.n)}, shaded to the ${dirWord(s.sym)}.`,
          wrong(ans, d) {
            if (d.pointOk === false) return `The boundary number in the rule is ${num(s.n)}. Put the circle there.`;
            if (d.openOk === false) return `Is exactly ${num(s.n)} allowed by the rule? ${incl(s.sym) ? 'Yes, so the circle is closed.' : 'No, so the circle is open.'}`;
            if (d.dirOk === false)
              return hard
                ? `The rule names the values that are NOT allowed. The allowed values are ${right(s.sym) ? 'bigger' : 'smaller'} than ${num(s.n)}, so shade that way.`
                : `Think about which values the rule allows: ${right(s.sym) ? 'bigger' : 'smaller'} than ${s.n}. Shade that way.`;
            return `The boundary number in the rule is ${num(s.n)}. Put the circle there.`;
          },
        },
      },
      line,
    );
  });

  // ---------- Graph with the number written first: 5 < x (ineq) ----------
  G.define('q5_graphReversed', (r, o) => {
    const hard = !!o.hard;
    const v = r.pick(['x', 'k', 'a', 'n']);
    const sym = r.pick(SYMS);
    const n = hard ? r.int(1, 8) + 0.5 : r.int(1, 9);
    const asVar = flipOf(sym);
    const line = hard ? HALF_LINE : { min: 0, max: 10, step: 1, labelEvery: 1 };
    return Object.assign(
      {
        type: 'ineq',
        skill: 'graph-ineq',
        lesson: '8-5',
        title: hard ? 'Graph it: number first, decimal boundary' : 'Graph it: the number comes first',
        prompt: `<p>This gate is written with the number first: ${hl(`${num(n)} ${sym} ${v}`)}.</p><p>Read it carefully, then graph the solutions.${hard ? ' The small ticks are halves.' : ''}</p>`,
        point: n,
        open: !incl(sym),
        dir: dirWord(asVar),
        hints: [
          `${num(n)} ${sym} ${v} says "${num(n)} is ${words(sym)} ${v}." Flip it so the variable comes first: ${v} ${asVar} ${num(n)}. The open side of the symbol always faces the bigger value.`,
          `${v} ${asVar} ${num(n)} means ${v} is ${words(asVar)} ${num(n)}. So shade to the ${dirWord(asVar)}.`,
          `${sym} ${incl(sym) ? 'includes' : 'does not include'} ${num(n)}, so the circle is ${circleWord(sym)}.`,
        ],
        hintEs: `${num(n)} ${sym} ${v} dice "${num(n)} es ${wordsEs(sym)} ${v}". Voltéala para que la variable vaya primero: ${v} ${asVar} ${num(n)}. El lado abierto del símbolo siempre mira hacia el valor mayor.`,
        solution:
          `<p>${num(n)} ${sym} ${v} means the same as <b>${v} ${asVar} ${num(n)}</b>: ${v} is ${words(asVar)} ${num(n)}. Reading it with the variable first keeps the direction straight.</p>` +
          graphSolution(v, asVar, n),
        feedback: {
          correct: `Correct. ${num(n)} ${sym} ${v} is ${v} ${asVar} ${num(n)}: ${circleWord(sym)} circle at ${num(n)}, shaded ${dirWord(asVar)}.`,
          wrong(ans, d) {
            if (d.dirOk === false)
              return `You shaded the way the symbol points from ${num(n)}'s side. With ${v} first, ${num(n)} ${sym} ${v} means ${v} is ${words(asVar)} ${num(n)}. Test a value: is ${num(right(asVar) ? n + 1 : n - 1)} a solution? Shade toward values like it.`;
            if (d.openOk === false)
              return `Flipping the inequality does not change whether ${num(n)} is included. ${sym} ${incl(sym) ? 'includes' : 'does not include'} it, so the circle is ${circleWord(sym)}.`;
            return `The boundary number is ${num(n)}. Put the circle there.`;
          },
        },
      },
      line,
    );
  });

  // ---------- Read a graph step by step (cloze) ----------
  G.define('q5_readGraphCloze', (r, o) => {
    const hard = !!o.hard;
    const v = r.pick(['x', 'n', 'y', 'w']);
    const sym = r.pick(SYMS);
    const neg = !hard && r.chance(0.35);
    const n = hard ? r.int(1, 8) + 0.5 : neg ? r.int(-8, 8) : r.int(1, 9);
    const lo = neg ? -10 : 0,
      hi = 10;
    const d = hard ? 0.5 : 1;
    const boundaryChoices = r.shuffle([num(n), num(n + d), num(n - d)]);
    // hard: the last blank asks for the inequality written NUMBER-first, so the symbol must be flipped
    const lastSym = hard ? flipOf(sym) : sym;
    const last = hard ? `${num(n)} {4} ${v}` : `${v} {4} ${num(n)}`;
    return {
      type: 'cloze',
      skill: 'graph-ineq',
      lesson: '8-5',
      title: hard ? 'Read the graph (write it number-first)' : 'Read the graph',
      prompt: `<p>A plank of the Skybridge is lit like this. Describe the graph, then write its inequality using the variable ${hl(v)}${hard ? ', with the number written first' : ''}.</p>${V.numberLine({ min: lo, max: hi, step: hard ? 0.5 : 1, labelEvery: neg ? 2 : 1, width: 460, ray: { v: n, open: !incl(sym), dir: dirWord(sym) }, aria: `Number line from ${lo} to ${hi} with ${incl(sym) ? 'a closed' : 'an open'} circle at ${num(n)} shaded to the ${dirWord(sym)}` })}`,
      template: `The boundary is {0}. The circle is {1}, so the boundary {2} a solution. The shading goes to the {3}, so the inequality is ${last}.`,
      choices: [boundaryChoices, ['open', 'closed'], ['is', 'is not'], ['left', 'right'], SYMS.slice()],
      answers: [boundaryChoices.indexOf(num(n)), incl(sym) ? 1 : 0, incl(sym) ? 0 : 1, right(sym) ? 1 : 0, SYMS.indexOf(lastSym)],
      hints: [
        'The circle marks the boundary. A closed (filled) circle means the boundary is a solution; an open circle means it is not.',
        `Shading to the right means values greater than the boundary. Shading to the left means values less than it.${hard ? ' The small ticks are halves.' : ''}`,
        hard
          ? `Write it with ${v} first, then turn it around so ${num(n)} comes first. Turning it around flips the symbol: ${v} > 2 is 2 < ${v}.`
          : `Put the pieces together: ${right(sym) ? 'greater' : 'less'} than, and ${incl(sym) ? 'including' : 'not including'} the boundary, gives the symbol.`,
      ],
      hintEs: 'El círculo marca el límite. Un círculo cerrado (relleno) significa que el límite es una solución; un círculo abierto significa que no lo es.',
      solution: `<p>The boundary is <b>${num(n)}</b>. The circle is <b>${circleWord(sym)}</b>, so ${num(n)} <b>${incl(sym) ? 'is' : 'is not'}</b> a solution. The shading goes to the <b>${dirWord(sym)}</b>, so ${v} is ${words(sym)} ${num(n)}: <b>${v} ${sym} ${num(n)}</b>${hard ? `, which is written number-first as <b>${num(n)} ${lastSym} ${v}</b>` : ''}.</p>`,
      feedback: {
        correct: `Correct. ${circleWord(sym)} circle at ${num(n)}, shaded ${dirWord(sym)}: ${v} ${sym} ${num(n)}.`,
        wrong(ans, dd) {
          if (dd.wrong.includes(0)) return `The boundary is the number under the circle.${hard ? ' Count the half ticks carefully.' : ''}`;
          if (dd.wrong.includes(1) || dd.wrong.includes(2)) return 'A filled-in circle is closed and includes the boundary. An open circle leaves it out.';
          if (dd.wrong.includes(3)) return 'Look at which side of the circle is shaded.';
          if (hard && SYMS[ans[4]] === sym) return `${v} ${sym} ${num(n)} is right with ${v} first, but here ${num(n)} comes first. Turning it around flips the symbol to ${lastSym}.`;
          return `Combine the direction (${right(sym) ? 'greater' : 'less'} than) with the circle (${incl(sym) ? 'includes' : 'does not include'} ${num(n)}).`;
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
    const shown = hard && r.chance(0.5) ? rev(v, sym, n) : ineq;
    const side = right(sym) ? 1 : -1; // where the solutions live
    const pool = hard
      ? [n + side * 0.5, n - side * 0.5, n + side * 2.25, n - side * 1.5, n + side * 10, n - side * 3, 0, n + 100]
      : [n + side, n - side, n + side * 5, n - side * 3, 0, n + 20, n + side * 2];
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
      prompt: `<p>Which values are solutions of ${hl(shown)}? Select every value that makes the inequality true.</p>`,
      options: sh.options,
      answers: sh.answers,
      hints: [
        `Substitute each value for ${v}. If the inequality is true, the value is a solution. Expect more than one.`,
        `${shown === ineq ? '' : `${shown} is the same as ${ineq}. `}${ineq} means ${v} is ${words(sym)} ${n}. Compare each value with ${n}.`,
        `Watch the boundary: is ${n} ${sym} ${n} a true statement? Only ≤ and ≥ include the boundary.`,
      ],
      hintEs: `Sustituye cada valor en lugar de ${v}. Si la desigualdad es verdadera, el valor es una solución. Puede haber más de una.`,
      solution: `<p>${shown === ineq ? '' : `${shown} is the same as ${ineq}. `}Solutions are values ${words(sym)} ${n}: <b>${vals
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
          if (d.missing && d.missing.length) {
            const m = sh.options[d.missing[0]].html;
            if (Number(m) === n) return `You left out the boundary ${n}. ${sym} has the "or equal to" line, so ${n} ${sym} ${n} is true.`;
            if (!Number.isInteger(Number(m))) return `You missed ${m}. Decimals can be solutions too: ${m} ${sym} ${n} is true.`;
            return `You missed ${m}. Test it: ${m} ${sym} ${n} is true.`;
          }
          return `Test every value against ${ineq}.`;
        },
      },
    };
  });

  // ---------- Is the value a solution? (tf) ----------
  G.define('q5_isSolutionTf', (r, o) => {
    const hard = !!o.hard;
    const v = r.pick(['x', 'n', 'm', 't']);
    const sym = r.pick(SYMS);
    // hard: a decimal boundary, test values a hair away from it, and sometimes the number written first
    const n = hard ? round(r.int(2, 18) + r.pick([0.5, 0.25, 0.75]), 2) : r.int(2, 18);
    const kind = r.pick(['boundary', 'boundary', 'near', 'decimal']);
    const test = hard
      ? kind === 'boundary'
        ? n
        : kind === 'near'
          ? round(n + r.pick([-0.05, 0.05, -0.1, 0.1]), 2)
          : round(n + r.pick([-0.25, 0.25, -0.5, 0.5]), 2)
      : kind === 'boundary'
        ? n
        : kind === 'near'
          ? n + r.pick([-1, 1])
          : round(n + r.pick([-0.5, 0.5, 0.25, -0.75]), 2);
    const isSol = holds(test, sym, n);
    const ineq = `${v} ${sym} ${num(n)}`;
    const shown = hard && r.chance(0.5) ? rev(v, sym, n) : ineq;
    const reasons = r.shuffle([
      {
        html: `${isSol ? 'Yes' : 'No'}. Substitute: ${num(test)} ${sym} ${num(n)} is ${isSol ? 'true' : 'false'}${test === n ? `, because ${sym} ${incl(sym) ? 'includes' : 'does not include'} the boundary` : ''}.`,
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
    const rel = test > n ? 'greater than' : test < n ? 'less than' : 'equal to';
    return {
      type: 'tf',
      skill: 'test-ineq',
      lesson: '8-5',
      title: hard ? 'Is it a solution? (close to the boundary)' : 'Is it a solution?',
      prompt: `<p>Is ${hl(`${v} = ${num(test)}`)} a solution of ${hl(shown)}?</p>`,
      answer: isSol,
      reasons,
      labels: ['Yes, a solution', 'No, not a solution'],
      hints: [
        `${shown === ineq ? '' : `${shown} is the same as ${ineq}. `}Substitute ${num(test)} for ${v} and read the statement: ${num(test)} ${sym} ${num(n)}. Is it true?`,
        `${sym} means ${words(sym)}. ${test === n ? `The boundary ${num(n)} counts only if the symbol has the "or equal to" line.` : `Compare ${num(test)} with ${num(n)}${hard ? ' digit by digit' : ''}.`}`,
        `${num(test)} is ${rel} ${num(n)}. Does that fit "${words(sym)}"?`,
      ],
      hintEs: `Sustituye ${num(test)} en lugar de ${v} y lee la oración: ${num(test)} ${sym} ${num(n)}. ¿Es verdadera?`,
      solution: `<p>${shown === ineq ? '' : `${shown} is the same as ${ineq}. `}Substitute ${num(test)} for ${v}: ${num(test)} ${sym} ${num(n)}. ${test === n ? `${sym} ${incl(sym) ? 'includes' : 'does not include'} the boundary, so this is ${isSol ? 'true' : 'false'}.` : `${num(test)} is ${test > n ? 'greater' : 'less'} than ${num(n)}, so this is ${isSol ? 'true' : 'false'}.`} <b>${v} = ${num(test)} ${isSol ? 'is' : 'is not'} a solution.</b></p>`,
      feedback: {
        correct: `Correct. ${num(test)} ${sym} ${num(n)} is ${isSol ? 'true' : 'false'}.`,
        wrong(ans, d) {
          if (!d.valueOk && test === n)
            return `The boundary is the tricky case. ${sym} ${incl(sym) ? 'has the "or equal to" line, so ' + num(n) + ' counts' : 'is strict, so ' + num(n) + ' does not count'}.`;
          if (!d.valueOk && shown !== ineq) return `${shown} has the number first. Read it from ${v}'s side: ${ineq}. Then decide if ${num(test)} ${sym} ${num(n)} is true.`;
          if (!d.valueOk) return `Compare carefully: ${num(test)} is ${rel} ${num(n)}. Read ${num(test)} ${sym} ${num(n)} as a statement and decide if it is true.`;
          return 'Your yes/no is right, but the reason must come from substituting and reading the statement.';
        },
      },
    };
  });

  // ---------- Explain: infinitely many solutions (cr) ----------
  G.define('q5_infiniteCr', (r, o) => {
    const hard = !!o.hard;
    const name = r.pick(NAMES);
    const v = r.pick(['x', 'n', 'y']);
    // hard: strict inequalities only, and the claim is about a "first" solution next to the boundary
    const sym = hard ? r.pick(['>', '<']) : r.pick(SYMS);
    const n = r.int(2, 12);
    const ineq = `${v} ${sym} ${n}`;
    const ex1 = right(sym) ? n + 1 : n - 1,
      ex2 = right(sym) ? n + 0.5 : n - 0.5,
      ex3 = right(sym) ? n + 100 : 0;
    const near1 = right(sym) ? n + 0.1 : n - 0.1,
      near2 = right(sym) ? n + 0.01 : n - 0.01;
    const claim = hard
      ? { text: `"The ${right(sym) ? 'smallest' : 'largest'} solution of ${ineq} is ${ex1}."` }
      : r.pick([{ text: `"${ineq} has only one solution, just like an equation."` }, { text: `"${ineq} has exactly ${right(sym) ? 'a few' : n} solutions: the whole numbers."` }]);
    const opts = hard
      ? [
          {
            html: `There is no ${right(sym) ? 'smallest' : 'largest'} solution. ${num(near1)} and ${num(near2)} are solutions closer to ${n}, and you can always get closer without reaching ${n}.`,
            ok: true,
          },
          {
            html: `${name} is right, because ${ex1} is the ${right(sym) ? 'first whole number after' : 'last whole number before'} ${n} on the number line.`,
            why: `Solutions are not only whole numbers. ${num(near1)} ${sym} ${n} is true, and ${num(near1)} is closer to ${n} than ${ex1} is.`,
          },
          {
            html: `The ${right(sym) ? 'smallest' : 'largest'} solution is ${n} itself, because ${n} is the boundary number of the inequality.`,
            why: `${sym} is strict, so ${n} ${sym} ${n} is false. The boundary is not a solution here, and no solution is next to it.`,
          },
        ]
      : [
          { html: `${ineq} has infinitely many solutions. Any number ${words(sym)} ${n} works, including decimals like ${num(ex2)}, and there is no end to them.`, ok: true },
          {
            html: `${ineq} has one solution, ${n}, because that is the number in the inequality.`,
            why: `${n} is the boundary, not "the answer." An inequality compares, so every value on one side of ${n} works. ${incl(sym) ? n + ' is one solution of many.' : n + ' is not even a solution here.'}`,
          },
          {
            html: `${ineq} has only whole-number solutions, like ${num(ex1)}.`,
            why: `Decimals and fractions count too. ${num(ex2)} ${sym} ${n} is true. Between any two solutions there are more solutions.`,
          },
        ];
    const sh = shuffleOptions(r, opts, 0);
    return {
      type: 'cr',
      skill: 'ineq-reasoning',
      lesson: '8-5',
      title: hard ? 'Explain: is there a first solution?' : 'Explain: how many solutions?',
      prompt: hard
        ? `<p>${name} says: ${hl(claim.text)}</p><p>Is ${name} right? Explain, using at least two solutions of ${ineq} that are close to ${n}. Then choose the best explanation.</p>`
        : `<p>${name} says: ${hl(claim.text)}</p><p>Is ${name} right? Explain how many solutions ${ineq} has, and name at least two of them. Then choose the best explanation.</p>`,
      starters: hard
        ? [`${name} is not right because …`, `${num(near1)} is a solution because …`, `No matter how close to ${n} I pick, …`, `${n} itself is not a solution because …`]
        : [`${name} is not right because …`, `A solution of ${ineq} is any number that …`, `Two solutions are ${num(ex1)} and …`, 'An inequality is different from an equation because …'],
      minWords: 10,
      check: { prompt: 'Which explanation is correct?', options: sh.options, answer: sh.answer },
      hints: hard
        ? [
            `A solution is any value that makes ${ineq} true, including decimals. Test ${num(ex2)} and ${num(near1)}.`,
            `${num(ex2)} ${sym} ${n} and ${num(near1)} ${sym} ${n} are both true, and both are closer to ${n} than ${ex1}. Can you find one even closer?`,
            `Think about ${num(near2)}, then a number with one more zero after the decimal point. Does this ever stop?`,
          ]
        : [
            `A solution is any value that makes ${ineq} true. Test ${num(ex1)}, ${num(ex2)}, and ${num(ex3)}.`,
            `${num(ex1)} ${sym} ${n}, ${num(ex2)} ${sym} ${n}, and ${num(ex3)} ${sym} ${n} are all true. Could you ever run out of values like these?`,
            `On the graph the shading goes on forever and includes every point, not just whole numbers. That is infinitely many solutions.`,
          ],
      hintEs: hard
        ? `Una solución es cualquier valor que hace verdadera ${ineq}, también los decimales. Prueba ${num(ex2)} y ${num(near1)}.`
        : `Una solución es cualquier valor que hace verdadera ${ineq}. Prueba ${num(ex1)}, ${num(ex2)} y ${num(ex3)}.`,
      solution: hard
        ? `<p>Model: "${name} is not right. ${num(ex2)}, ${num(near1)}, and ${num(near2)} are all solutions of ${ineq}, and each is closer to ${n} than ${ex1}. I can always pick a number even closer to ${n}, so there is no ${right(sym) ? 'smallest' : 'largest'} solution. ${n} itself is not a solution because ${sym} is strict. On the graph this is the open circle at ${n}."</p>`
        : `<p>Model: "${name} is not right. ${ineq} is true for every number ${words(sym)} ${n}. For example, ${num(ex1)}, ${num(ex2)}, and ${num(ex3)} are all solutions. The shaded part of the graph goes on without end and includes decimals, so there are infinitely many solutions. An equation like ${v} = ${n} has one solution; an inequality describes a whole range."</p>`,
      feedback: {
        correct: hard
          ? `Correct. With a strict symbol there is no solution right next to ${n}: you can always get closer.`
          : 'Correct. An inequality is true for a whole range of values, so it has infinitely many solutions.',
        wrong(ans, d) {
          if (!d.wroteEnough)
            return hard
              ? `Write a few complete sentences. Name two decimal solutions close to ${n} and say why there is no ${right(sym) ? 'smallest' : 'largest'} one.`
              : 'Write a few complete sentences. Name at least two solutions and say why there is no last one.';
          return (sh.options[ans.check] && sh.options[ans.check].why) || `Test several values in ${ineq}, including a decimal.`;
        },
      },
    };
  });

  // ---------- Sort values: solution or not (sort) ----------
  G.define('q5_sortValues', (r, o) => {
    const hard = !!o.hard;
    const v = r.pick(['x', 'n', 'p', 'w']);
    const sym = r.pick(SYMS);
    // hard: a half-unit boundary, values a quarter away on each side, and sometimes the number written first
    const n = hard ? r.int(3, 15) + 0.5 : r.int(3, 15);
    const ineq = `${v} ${sym} ${num(n)}`;
    const shown = hard && r.chance(0.5) ? rev(v, sym, n) : ineq;
    const candidates = (
      hard
        ? [n, n + 0.5, n - 0.5, round(n + 0.25, 2), round(n - 0.25, 2), round(n + 0.05, 2), round(n - 0.05, 2), n + 3, n - 3, 0]
        : [n, n + 1, n - 1, round(n + 0.5, 1), round(n - 0.5, 1), n + 4, n - 3, 0, n * 2]
    ).filter((x, i, arr) => x >= 0 && arr.indexOf(x) === i);
    const near = hard ? 0.5 : 1;
    const count = hard ? 7 : 5;
    let vals = [n].concat(
      r.pickN(
        candidates.filter((x) => x !== n),
        count,
      ),
    );
    const sols = vals.filter((x) => holds(x, sym, n));
    if (sols.length === 0 || sols.length === vals.length)
      vals = [n, right(sym) ? n + near : n - near, right(sym) ? n - near : n + near].concat(
        r.pickN(
          candidates.filter((x) => x !== n && x !== n + near && x !== n - near),
          count - 2,
        ),
      );
    const items = r.shuffle(vals.map((x) => ({ html: num(x), bin: holds(x, sym, n) ? 0 : 1 })));
    return {
      type: 'sort',
      skill: 'test-ineq',
      lesson: '8-5',
      title: hard ? 'Solution or not? (decimals)' : 'Solution or not?',
      prompt: `<p>Sort each value. Does it make ${hl(shown)} true?</p>`,
      bins: [`Solution of ${shown}`, 'Not a solution'],
      items,
      hints: [
        `${shown === ineq ? '' : `${shown} is the same as ${ineq}. `}Substitute each value for ${v}. If ${ineq} becomes a true statement, the value is a solution.`,
        `${ineq} means ${v} is ${words(sym)} ${num(n)}. Values ${right(sym) ? 'bigger' : 'smaller'} than ${num(n)} are solutions.`,
        `The boundary ${num(n)}: ${num(n)} ${sym} ${num(n)} is ${holds(n, sym, n) ? 'true (the symbol includes it)' : 'false (the symbol is strict)'}.`,
      ],
      hintEs: `Sustituye cada valor en lugar de ${v}. Si ${ineq} es verdadera, el valor es una solución.`,
      solution: `<p>${shown === ineq ? '' : `${shown} is the same as ${ineq}. `}Solutions of ${ineq}: <b>${items
        .filter((i) => i.bin === 0)
        .map((i) => i.html)
        .join(', ')}</b>. Not solutions: ${items
        .filter((i) => i.bin === 1)
        .map((i) => i.html)
        .join(', ')}. The boundary ${num(n)} ${holds(n, sym, n) ? 'counts because ' + sym + ' includes it' : 'does not count because ' + sym + ' is strict'}.</p>`,
      feedback: {
        correct: `Correct. Every value ${words(sym)} ${num(n)} is a solution, and nothing else is.`,
        wrong(ans, d) {
          const i = d.wrong && d.wrong[0];
          if (i == null || !items[i]) return `Test each value in ${ineq}.`;
          const x = Number(items[i].html);
          if (x === n) return `${num(n)} is the boundary. ${sym} ${incl(sym) ? 'includes' : 'does not include'} it.`;
          if (Math.abs(x - n) < 0.3)
            return `${items[i].html} is very close to ${num(n)}. Compare digit by digit: ${items[i].html} is ${x > n ? 'greater' : 'less'} than ${num(n)}, so ${items[i].html} ${sym} ${num(n)} is ${holds(x, sym, n) ? 'true' : 'false'}.`;
          return `Test ${items[i].html}: is ${items[i].html} ${sym} ${num(n)} true?`;
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
  const cents = (r, lo, hi) => round(r.int(lo * 100, hi * 100) / 100, 2);
  const XP = 20;

  // ---------- Decimal pan balance (blanks) ----------
  G.define('qc_decimalBalance', (r, o) => {
    const hard = !!o.hard;
    const v = r.pick(['x', 'w', 'c', 'm']);
    const kind = r.chance(0.5) ? 'add' : 'mul';
    let a, sol, b, left, eq, step, inv, pic;
    if (kind === 'add') {
      // hard: hundredths that need regrouping, and the crate pan drawn on the right
      a = hard ? cents(r, 2, 15) : quarter(r, 1, 12);
      sol = hard ? cents(r, 5, 30) : quarter(r, 2, 20);
      b = round(a + sol, 2);
      left = [num(a), v]; // weight first so the SVG labels never read as one long decimal
      eq = hard ? `${num(b)} = ${num(a)} + ${v}` : `${num(a)} + ${v} = ${num(b)}`;
      step = 'Subtract {0} from both sides.';
      inv = 'subtract';
      pic = V.balance({ left: hard ? [num(b)] : left, right: hard ? left : [num(b)], aria: `Balanced scale showing ${eq}` });
    } else {
      // hard: more crates (no picture to count), so the student works from the words alone
      a = hard ? r.int(4, 8) : r.int(2, 3);
      sol = hard ? cents(r, 2, 12) : quarter(r, 2, 15);
      b = round(a * sol, 2);
      left = Array.from({ length: a }, () => v);
      eq = `${a}${v} = ${num(b)}`;
      step = 'Divide both sides by {0}.';
      inv = 'divide by';
      pic = hard ? '' : V.balance({ left, right: [num(b)], aria: `Balanced scale showing ${eq}` });
    }
    const setup =
      kind === 'add'
        ? `One pan holds a crate labeled ${hl(v)} and a weight of ${hl(num(a))}. The other pan holds a weight of ${hl(num(b))}.`
        : hard
          ? `${hl(a)} identical crates, each weighing ${hl(v)} kilograms, balance a weight of ${hl(num(b))} kilograms.`
          : `One pan holds ${hl(a)} crates that each weigh ${hl(v)}. The other pan holds a weight of ${hl(num(b))}.`;
    return {
      type: 'blanks',
      skill: 'balance-model',
      lesson: 'Challenge',
      xp: XP,
      title: hard ? 'Challenge: decimal balance (hundredths)' : 'Challenge: decimal balance',
      prompt: `<p>The scale is balanced. ${setup}</p>${pic}<p>The scale shows ${hl(eq)}. Name the number to ${inv}, then find ${v}.</p>`,
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
        kind === 'add' ? `Subtract ${num(a)} from ${num(b)} to get the weight of the crate.` : `Divide ${num(b)} by ${a} to get the weight of one crate.`,
      ],
      hintEs:
        kind === 'add'
          ? `Una pesa de ${num(a)} está junto a la caja. Quítala de los dos platillos: resta ${num(a)} de los dos lados.`
          : `${a} cajas iguales pesan ${num(b)} en total. Reparte ${num(b)} en ${a} partes iguales: divide los dos lados entre ${a}.`,
      solution: `<p>${kind === 'add' ? `Subtract <b>${num(a)}</b> from both sides: ${v} = ${num(b)} − ${num(a)} = <b>${num(sol)}</b>. Check: ${num(sol)} + ${num(a)} = ${num(b)}.` : `Divide both sides by <b>${a}</b>: ${v} = ${num(b)} ÷ ${a} = <b>${num(sol)}</b>. Check: ${a} × ${num(sol)} = ${num(b)}.`} ✓ Decimals follow the same balance rule as whole numbers.</p>`,
      feedback: {
        correct: `Correct. ${kind === 'add' ? `Subtracting ${num(a)}` : `Dividing by ${a}`} leaves ${v} = ${num(sol)}.`,
        wrong(ans, d) {
          const first = parseNum(ans[0]),
            second = parseNum(ans[1]);
          if (d.wrong.includes(0) && nearTo(first, b))
            return `${num(b)} is the other side of the scale. ${kind === 'add' ? `Subtract the weight that shares the pan with ${v}: ${num(a)}.` : `Divide by the number of crates: ${a}.`}`;
          if (d.wrong.includes(0)) return kind === 'add' ? `Subtract the weight that shares the pan with ${v}: ${num(a)}.` : `Divide by the number of crates: ${a}.`;
          if (kind === 'add' && nearTo(second, b + a)) return `You added ${num(a)}. It is already on the pan with ${v}, so take it away: subtract.`;
          if (kind === 'mul' && nearTo(second, b * a)) return `You multiplied by ${a}. The crates are already multiplied; undo with division.`;
          if (kind === 'mul' && nearTo(second, b - a)) return `You subtracted ${a}. ${a}${v} means ${a} × ${v}, so divide by ${a}.`;
          if (kind === 'add' && second != null && Math.abs(second - sol) >= 0.5 && Math.abs(second - sol) < 2)
            return `Close. Check the regrouping when you subtract the hundredths and tenths. Line up the decimal points.`;
          return kind === 'add' ? `Compute ${num(b)} − ${num(a)} carefully. Line up the decimal points.` : `Compute ${num(b)} ÷ ${a} carefully. Keep the decimal point in place.`;
        },
      },
    };
  });

  // ---------- Fraction-of-a-whole story (num) ----------
  G.define('qc_fracEquation', (r, o) => {
    const hard = !!o.hard;
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
    const k = hard ? r.int(6, 15) : r.int(3, 12);
    const c = a * k,
      sol = b * k;
    const v = r.pick(['n', 'p', 'g', 't']);
    // hard: the story gives the OTHER part, so the student must find the fraction first (b − a)/b of the whole
    const o2 = b - a;
    const known = hard ? o2 * k : c;
    const ctx = hard
      ? r.pick([
          { text: `${hl(`${a}/${b}`)} of the apprentices did not pass the Keeper's exam. ${hl(known)} apprentices passed.`, what: `${v} = the total number of apprentices`, unit: 'apprentices' },
          { text: `${name} has ${hl(`${a}/${b}`)} of a book still to read. ${name} has already read ${hl(known + ' pages')}.`, what: `${v} = the number of pages in the book`, unit: 'pages' },
          { text: `A water tank is ${hl(`${a}/${b}`)} empty. It holds ${hl(known + ' liters')} right now.`, what: `${v} = the liters a full tank holds`, unit: 'liters' },
          {
            text: `${name} still has ${hl(`${a}/${b}`)} of a trail left to hike after hiking ${hl(known + ' kilometers')}.`,
            what: `${v} = the length of the whole trail in kilometers`,
            unit: 'kilometers',
          },
        ])
      : r.pick([
          { text: `${hl(`${a}/${b}`)} of the apprentices passed the Keeper's exam. ${hl(c)} apprentices passed.`, what: `${v} = the total number of apprentices`, unit: 'apprentices' },
          { text: `${name} has read ${hl(`${a}/${b}`)} of a book, which is ${hl(c + ' pages')}.`, what: `${v} = the number of pages in the book`, unit: 'pages' },
          { text: `A water tank is ${hl(`${a}/${b}`)} full. It holds ${hl(c + ' liters')} right now.`, what: `${v} = the liters a full tank holds`, unit: 'liters' },
          { text: `${hl(`${a}/${b}`)} of the gears in the Undercroft are brass. There are ${hl(c + ' brass gears')}.`, what: `${v} = the total number of gears`, unit: 'gears' },
          { text: `${name} hiked ${hl(`${a}/${b}`)} of a trail, which is ${hl(c + ' kilometers')}.`, what: `${v} = the length of the whole trail in kilometers`, unit: 'kilometers' },
        ]);
    const fa = hard ? o2 : a; // numerator of the fraction that matches the known amount
    return {
      type: 'num',
      skill: 'solve-mul',
      lesson: 'Challenge',
      xp: XP,
      title: hard ? 'Challenge: the other part of the whole' : 'Challenge: fraction of a whole',
      prompt: hard
        ? `<p>${ctx.text}</p><p>Let ${hl(ctx.what)}. Write a one-step equation with a fraction coefficient and solve it.</p>`
        : `<p>${ctx.text}</p><p>Let ${hl(ctx.what)}. The equation ${V.frac(a, b)}${v} = ${c} models this. Solve it.</p>`,
      answer: sol,
      unit: ctx.unit,
      hints: hard
        ? [
            `The known amount is NOT the ${a}/${b} part. It is the rest: 1 − ${a}/${b} = ${o2}/${b} of the whole. So ${o2}/${b} × ${v} = ${known}.`,
            `Multiply both sides by the reciprocal ${b}/${o2}: ${v} = ${known} × ${b}/${o2}.`,
            o2 === 1 ? `${known} is one part. The whole has ${b} parts, so multiply ${known} by ${b}.` : `${known} ÷ ${o2} = ${k} is one part. The whole has ${b} parts, so multiply ${k} by ${b}.`,
          ]
        : [
            `"${a}/${b} of ${v} is ${c}" means ${a}/${b} × ${v} = ${c}. Undo multiplying by a fraction by dividing by it, which is the same as multiplying by its reciprocal.`,
            `The reciprocal of ${a}/${b} is ${b}/${a}. ${v} = ${c} × ${b}/${a}.`,
            `${c} ÷ ${a} = ${k}, so one ${a === 1 ? 'part' : `of the ${a} parts`} is ${k}. The whole has ${b} parts: multiply ${k} by ${b}.`,
          ],
      hintEs: hard
        ? `La cantidad conocida NO es la parte de ${a}/${b}. Es el resto: 1 − ${a}/${b} = ${o2}/${b} del total. Entonces ${o2}/${b} × ${v} = ${known}.`
        : `"${a}/${b} de ${v} es ${c}" significa ${a}/${b} × ${v} = ${c}. Para deshacer la multiplicación por una fracción, multiplica por su recíproco.`,
      solution: hard
        ? `<p>${a}/${b} is the other part, so the known ${known} is ${o2}/${b} of the whole: <b>${o2}/${b} × ${v} = ${known}</b>. One part is ${known} ÷ ${o2} = ${k}, and the whole is ${b} parts: ${b} × ${k} = <b>${sol}</b>. Check: ${o2}/${b} × ${sol} = ${known}. ✓</p>`
        : `<p>${a}/${b} of ${v} is ${c}, so ${c} is ${a} ${a === 1 ? 'part' : 'equal parts'} out of ${b}. One part is ${c} ÷ ${a} = ${k}, and the whole is ${b} parts: ${b} × ${k} = <b>${sol}</b>. Or multiply by the reciprocal: ${c} × ${b}/${a} = ${sol}. Check: ${a}/${b} × ${sol} = ${c}. ✓</p>`,
      feedback: {
        correct: `Correct. If ${fa} part${fa === 1 ? '' : 's'} make${fa === 1 ? 's' : ''} ${known}, each part is ${k}, and ${b} parts make ${sol}.`,
        wrong(ans, d) {
          if (hard && nearTo(d.value, (known * b) / a))
            return `You treated ${known} as the ${a}/${b} part. The story says ${a}/${b} is the OTHER part, so ${known} is ${o2}/${b} of the whole. Multiply by ${b}/${o2}.`;
          if (nearTo(d.value, (known * fa) / b)) return `You found ${fa}/${b} of ${known}. But ${known} is already ${fa}/${b} of the whole. The whole is bigger: multiply by ${b}/${fa}.`;
          if (nearTo(d.value, k)) return `${k} is one part (${known} ÷ ${fa}). The whole has ${b} parts, so multiply ${k} by ${b}.`;
          if (fa !== 1 && nearTo(d.value, known * b)) return `${known} × ${b} = ${known * b} is a start, but you still need to divide by ${fa}.`;
          return `${known} is ${fa} of ${b} equal parts. Find one part (${known} ÷ ${fa}), then find all ${b} parts.`;
        },
      },
    };
  });

  // ---------- Two-step story, one-step equation: choose the amount, the equation, and solve (cloze) ----------
  G.define('qc_whichEquations', (r, o) => {
    const hard = !!o.hard;
    const name = r.pick(NAMES);
    const v = r.pick(['t', 'p', 'c']);
    const story = r.pick([
      () => {
        // hard: more tickets, prices in cents, and a bigger bill
        const k = hard ? r.int(4, 8) : r.int(2, 5),
          price = hard ? cents(r, 3, 9) : quarter(r, 2, 6),
          spent = round(k * price, 2),
          bill = spent < 10 ? 10 : spent < 20 ? 20 : spent < 50 ? 50 : 100,
          change = round(bill - spent, 2);
        return {
          text: `${name} bought ${hl(k + ' tickets')} at the same price. ${name} paid with a ${hl(money(bill))} bill and got ${hl(money(change))} in change.`,
          what: `${v} = the price of one ticket`,
          stepChoices: [
            `${money(bill)} − ${money(change)} = ${money(spent)}`,
            `${money(bill)} + ${money(change)} = ${money(round(bill + change, 2))}`,
            `${money(bill)} ÷ ${k} ${Math.abs(round(bill / k, 2) - bill / k) > 1e-9 ? '≈' : '='} ${money(round(bill / k, 2))}`,
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
        const k = hard ? r.int(6, 12) : r.int(3, 6),
          each = hard ? r.int(12, 25) : r.int(4, 12),
          kept = hard ? r.int(7, 19) : r.int(3, 9),
          total = k * each + kept;
        return {
          text: `${name} had ${hl(total + ' marbles')}, kept ${hl(kept)}, and shared the rest equally among ${hl(k + ' friends')}.`,
          what: `${v} = the number of marbles each friend got`,
          stepChoices: [
            `${total} − ${kept} = ${total - kept}`,
            `${total} + ${kept} = ${total + kept}`,
            `${total} ÷ ${k} ${Math.abs(round(total / k, 2) - total / k) > 1e-9 ? '≈' : '='} ${num(round(total / k, 2))}`,
          ],
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
        const k = hard ? r.int(4, 9) : r.int(3, 8),
          rate = hard ? quarter(r, 3, 10) + 0 : r.int(4, 12),
          start = hard ? round(r.int(50, 200) / 10, 1) : r.int(5, 20),
          end = round(start + k * rate, 2);
        return {
          text: `A lift started at a height of ${hl(num(start) + ' meters')}. It rose at a steady rate for ${hl(k + ' minutes')} and reached ${hl(num(end) + ' meters')}.`,
          what: `${v} = the meters the lift rose each minute`,
          stepChoices: [
            `${num(end)} − ${num(start)} = ${num(round(end - start, 2))}`,
            `${num(end)} + ${num(start)} = ${num(round(end + start, 2))}`,
            `${num(end)} ÷ ${k} ${Math.abs(round(end / k, 2) - end / k) > 1e-9 ? '≈' : '='} ${num(round(end / k, 2))}`,
          ],
          stepWhy: [
            '',
            `The lift did not rise ${num(end)} meters; it started at ${num(start)}. Subtract the starting height.`,
            `${num(end)} includes the starting height. Subtract ${num(start)} before dividing.`,
          ],
          eqs: [`${k}${v} = ${num(round(end - start, 2))}`, `${k}${v} = ${num(end)}`, `${v} ÷ ${k} = ${num(round(end - start, 2))}`],
          eqWhy: ['', `The lift started at ${num(start)}, so it only rose ${num(round(end - start, 2))} meters.`, `${k} minutes at ${v} meters each is ${k} × ${v}, not ${v} ÷ ${k}.`],
          amount: round(end - start, 2),
          k,
          sol: rate,
          op: 'divide',
          wrongSols: [round((end - start) * k, 2), round(end / k, 2)],
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
      title: hard ? 'Challenge: two steps, one equation (bigger numbers)' : 'Challenge: two steps, one equation',
      prompt: `<p>${story.text}</p><p>Let ${hl(story.what)}. First find the amount the equation should model, then choose the one-step equation and solve it.</p>`,
      template: `Step 1: {0}. Step 2: the equation is {1}. Step 3: ${story.op} both sides by ${story.k}. ${v} = {2}.`,
      choices: [stepIdx.map((i) => story.stepChoices[i]), eqIdx.map((i) => story.eqs[i]), solList],
      answers: [stepIdx.indexOf(0), eqIdx.indexOf(0), solList.indexOf(num(story.sol))],
      hints: [
        'Not every number in the story belongs in the equation. First figure out which amount was actually split into equal parts.',
        `The amount split into ${story.k} equal parts is ${num(story.amount)}. So ${story.k}${v} = ${num(story.amount)}.`,
        `Divide both sides by ${story.k}: ${v} = ${num(story.amount)} ÷ ${story.k}.`,
      ],
      hintEs: 'No todos los números de la historia van en la ecuación. Primero averigua qué cantidad se repartió en partes iguales.',
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
  G.define('qc_tableSolutions', (r, o) => {
    const hard = !!o.hard;
    const v = r.pick(['x', 'n', 'y', 'm']);
    const rowsSpec = r.shuffle(['add', 'sub', 'mul', 'div']).map((kind) => {
      if (kind === 'add') {
        const a = hard ? cents(r, 1, 10) : quarter(r, 1, 10),
          sol = hard ? cents(r, 1, 20) : quarter(r, 1, 20);
        return { eq: `${v} + ${num(a)} = ${num(round(a + sol, 2))}`, inv: `Subtract ${num(a)}`, sol, step: `${num(round(a + sol, 2))} − ${num(a)}` };
      }
      if (kind === 'sub') {
        const a = hard ? cents(r, 1, 10) : quarter(r, 1, 10),
          b = hard ? cents(r, 1, 20) : quarter(r, 1, 20);
        return { eq: `${v} − ${num(a)} = ${num(b)}`, inv: `Add ${num(a)}`, sol: round(a + b, 2), step: `${num(b)} + ${num(a)}` };
      }
      if (kind === 'mul') {
        // hard: a decimal coefficient (dividing by a decimal)
        const a = hard ? r.pick([0.5, 1.5, 2.5, 0.25]) : r.pick([2, 4, 5, 8]),
          sol = hard ? r.int(2, 24) : quarter(r, 1, 12);
        return { eq: `${a}${v} = ${num(round(a * sol, 2))}`, inv: `Divide by ${a}`, sol, step: `${num(round(a * sol, 2))} ÷ ${a}` };
      }
      const a = hard ? r.int(6, 12) : r.int(2, 9),
        b = hard ? r.pick([1.25, 2.75, 3.4, 4.6, 0.75, 5.05]) : r.pick([1.5, 2.5, 3.5, 4.5, 6.5, 0.5]);
      return { eq: `${v} ÷ ${a} = ${num(b)}`, inv: `Multiply by ${a}`, sol: round(a * b, 2), step: `${num(b)} × ${a}` };
    });
    // hard: the inverse-operation column is left for the student to decide
    const rows = [['Equation', 'Inverse operation', `${v} =`]].concat(rowsSpec.map((row, i) => [row.eq, hard ? 'You decide' : row.inv, `__IN:s${i}__`]));
    const inputs = rowsSpec.map((row, i) => ({ id: `s${i}`, answer: row.sol }));
    return {
      type: 'table',
      skill: 'check-solution',
      lesson: 'Challenge',
      xp: XP,
      title: hard ? 'Challenge: four locks, choose the inverses' : 'Challenge: four locks, four inverses',
      prompt: hard
        ? `<p>Each row is a lock. Decide the inverse operation for each, then solve every equation for ${hl(v)}.</p>`
        : `<p>Each row is a lock. The inverse operation is given. Solve every equation for ${hl(v)}.</p>`,
      rows,
      header: true,
      inputs,
      hints: [
        hard
          ? 'For each row, name the operation done to the variable, then use its inverse on the number on the other side.'
          : 'Apply the inverse operation to the number on the right side of each equation. That gives the solution.',
        `Row 1: ${rowsSpec[0].step}. Row 2: ${rowsSpec[1].step}.`,
        `Row 3: ${rowsSpec[2].step}. Row 4: ${rowsSpec[3].step}. Check each by substituting.`,
      ],
      hintEs: hard
        ? 'En cada fila, nombra la operación que se le hace a la variable y usa su operación inversa con el número del otro lado.'
        : 'Aplica la operación inversa al número del otro lado de cada ecuación. Eso da la solución.',
      solution: `<p>${rowsSpec.map((row) => `${row.eq} → ${row.step} = <b>${num(row.sol)}</b>`).join('. ')}. Each inverse undoes the operation in its equation.</p>`,
      feedback: {
        correct: 'Correct. Four equations, four inverses, four solutions that all check.',
        wrong(ans, d) {
          const id = d.wrong && d.wrong[0];
          const i = id ? Number(id.slice(1)) : 0;
          const row = rowsSpec[i];
          const got = parseNum(ans[id]);
          if (row && /Subtract/.test(row.inv) && got != null && got > row.sol) return `Row ${i + 1}: the equation adds, so subtract. ${row.step}.`;
          if (row && /Add/.test(row.inv) && got != null && got < row.sol) return `Row ${i + 1}: the equation subtracts, so add it back. ${row.step}.`;
          if (row && /Divide/.test(row.inv) && got != null && nearTo(got, row.sol * Number(row.inv.split(' ').pop()) ** 2))
            return `Row ${i + 1}: you multiplied again. The equation multiplies, so divide. ${row.step}.`;
          if (row && /Divide/.test(row.inv) && got != null && got > row.sol) return `Row ${i + 1}: the equation multiplies, so divide. ${row.step}.`;
          if (row && /Multiply/.test(row.inv) && got != null && got < row.sol) return `Row ${i + 1}: you divided again. The equation divides, so multiply. ${row.step}.`;
          return row ? `Row ${i + 1}: ${row.inv.toLowerCase()} on the right side: ${row.step}.` : 'Apply each inverse to the right side.';
        },
      },
    };
  });

  // ---------- Match graphs to inequalities, including a reversed form and a decimal boundary (match) ----------
  G.define('qc_matchGraphs', (r, o) => {
    const hard = !!o.hard;
    const v = r.pick(['x', 'n', 'k', 'y']);
    let specs, step;
    if (hard) {
      // hard: two pairs of graphs share a half-unit boundary and differ only in circle or direction; half the labels are number-first
      step = 0.5;
      const [p, q] = r.pickN([1, 2, 3, 4, 5, 6, 7, 8], 2).map((x) => x + 0.5);
      specs = [];
      [p, q].forEach((b) => {
        const [s1, s2] = r.pickN(SYMS, 2);
        [s1, s2].forEach((s, j) => {
          const revForm = j === 1;
          specs.push({
            text: revForm ? `${num(b)} ${flipOf(s)} ${v}` : `${v} ${s} ${num(b)}`,
            n: b,
            open: !incl(s),
            dir: right(s) ? 'right' : 'left',
            read: revForm ? `${num(b)} ${flipOf(s)} ${v} means ${v} ${s} ${num(b)}` : `${v} is ${words(s)} ${num(b)}`,
            form: revForm ? 'rev' : 'dec',
          });
        });
      });
      specs = r.shuffle(specs);
    } else {
      step = 1;
      const bounds = r.pickN([1, 2, 3, 4, 5, 6, 7, 8, 9], 4);
      const forms = r.shuffle(['gt', 'le', 'rev', 'dec']);
      specs = forms.map((f, i) => {
        const n = bounds[i];
        if (f === 'gt') return { text: `${v} > ${n}`, n, open: true, dir: 'right', read: `${v} is greater than ${n}`, form: f };
        if (f === 'le') return { text: `${v} ≤ ${n}`, n, open: false, dir: 'left', read: `${v} is less than or equal to ${n}`, form: f };
        if (f === 'rev') {
          const s = r.pick(['<', '≥']);
          return { text: `${n} ${s} ${v}`, n, open: s === '<', dir: s === '<' ? 'right' : 'left', read: `${n} ${words(s)} ${v}, so ${v} ${flipOf(s)} ${n}`, form: f };
        }
        const b = Math.min(n, 8) + 0.5;
        const s = r.pick(['<', '≥']);
        return {
          text: `${v} ${s} ${num(b)}`,
          n: b,
          open: s === '<',
          dir: s === '<' ? 'left' : 'right',
          read: `${v} is ${words(s)} ${num(b)}, halfway between ${Math.floor(b)} and ${Math.ceil(b)}`,
          form: f,
        };
      });
    }
    const letters = ['A', 'B', 'C', 'D'];
    const left = specs.map(
      (s, i) =>
        `<div class="muted">Graph ${letters[i]}</div>${V.numberLine({ min: 0, max: 10, step, labelEvery: 1, width: 300, ray: { v: s.n, open: s.open, dir: s.dir }, aria: `Graph ${letters[i]}: number line 0 to 10 with ${s.open ? 'an open' : 'a closed'} circle at ${num(s.n)} shaded to the ${s.dir}` })}`,
    );
    const rightOrder = r.shuffle([0, 1, 2, 3]);
    const rightItems = rightOrder.map((i) => specs[i].text);
    const pairs = specs.map((s, i) => [i, rightOrder.indexOf(i)]);
    const dec = specs.find((s) => !Number.isInteger(s.n));
    return {
      type: 'match',
      skill: 'represent-ineq',
      lesson: 'Challenge',
      xp: XP,
      title: hard ? 'Challenge: match the look-alike graphs' : 'Challenge: match the graphs',
      prompt: hard
        ? `<p>Match each graph to its inequality. Two pairs of graphs share a boundary, so check the circle and the direction every time. Some inequalities are written with the number first.</p>`
        : `<p>Match each graph to its inequality. Watch for an inequality written with the number first, and for a boundary between two whole numbers.</p>`,
      left,
      right: rightItems,
      pairs,
      hints: [
        'For each graph note three things: the boundary number, open or closed circle, and the shading direction.',
        'When the number comes first, flip it so the variable is first. The open side of the symbol always faces the bigger value.',
        `A boundary like ${num(dec.n)} sits halfway between two tick marks.`,
      ],
      hintEs: 'Para cada gráfica, fíjate en tres cosas: el número del límite, si el círculo es abierto o cerrado, y la dirección del sombreado.',
      solution: `<p>${specs.map((s, i) => `Graph ${letters[i]} → ${s.text} (${s.read}; ${s.open ? 'open' : 'closed'} circle, shaded ${s.dir})`).join('. ')}.</p>`,
      feedback: {
        correct: 'Correct. Boundary, circle, and direction identify every graph.',
        wrong(ans, d) {
          const i = d.wrong && d.wrong[0];
          if (i == null || !specs[i]) return 'Check each graph for boundary, circle type, and direction.';
          const s = specs[i];
          return `Look again at Graph ${letters[i]}: ${s.open ? 'open' : 'closed'} circle at ${num(s.n)}, shaded to the ${s.dir}.${s.form === 'rev' ? ' Its inequality may be written with the number first, so flip it before you compare.' : ''} Which inequality says that?`;
        },
      },
    };
  });

  // ---------- Graph a reversed inequality with a decimal boundary (ineq, step 0.5) ----------
  const SAY = { '<': 'is less than', '>': 'is greater than', '≤': 'is less than or equal to', '≥': 'is greater than or equal to' };
  G.define('qc_ineqReversed', (r, o) => {
    const hard = !!o.hard;
    const v = r.pick(['x', 'a', 'w', 'n']);
    const sym = r.pick(SYMS);
    const n = r.int(1, 8) + 0.5;
    const asVar = flipOf(sym);
    const dir = right(asVar) ? 'right' : 'left';
    // hard: the inequality is given only in words, number first
    const shownHtml = hard ? hl(`${num(n)} ${SAY[sym]} ${v}`) : hl(`${num(n)} ${sym} ${v}`);
    return {
      type: 'ineq',
      skill: 'graph-ineq',
      lesson: 'Challenge',
      xp: XP,
      title: hard ? 'Challenge: words, number first, decimal boundary' : 'Challenge: decimal boundary, number first',
      prompt: hard
        ? `<p>A gate reads: "${shownHtml}." Write it in symbols in your head, then graph the solutions on the number line. The tick marks are every 0.5.</p>`
        : `<p>Graph ${shownHtml} on the number line. The tick marks are every 0.5.</p>`,
      min: 0,
      max: 10,
      step: 0.5,
      labelEvery: 1,
      point: n,
      open: !incl(sym),
      dir,
      hints: [
        `${hard ? `In symbols the gate says ${num(n)} ${sym} ${v}. ` : ''}Flip it so the variable comes first: ${num(n)} ${sym} ${v} means ${v} ${asVar} ${num(n)}. The open side of the symbol still faces the same value.`,
        `${v} ${asVar} ${num(n)}: solutions are ${words(asVar)} ${num(n)}, so shade to the ${dir}. ${sym} ${incl(sym) ? 'includes' : 'does not include'} ${num(n)}, so the circle is ${incl(sym) ? 'closed' : 'open'}.`,
        `${num(n)} is halfway between ${Math.floor(n)} and ${Math.ceil(n)}. Click the small tick between them.`,
      ],
      hintEs: `${hard ? `En símbolos dice ${num(n)} ${sym} ${v}. ` : ''}Voltéala para que la variable vaya primero: ${num(n)} ${sym} ${v} significa ${v} ${asVar} ${num(n)}.`,
      solution: `<p>${num(n)} ${sym} ${v} is the same as <b>${v} ${asVar} ${num(n)}</b>. The boundary ${num(n)} sits halfway between ${Math.floor(n)} and ${Math.ceil(n)}. The circle is <b>${incl(sym) ? 'closed' : 'open'}</b> because ${sym} ${incl(sym) ? 'includes' : 'does not include'} the boundary, and the shading goes to the <b>${dir}</b> because ${v} is ${words(asVar)} ${num(n)}.</p>`,
      feedback: {
        correct: `Correct. ${v} ${asVar} ${num(n)}: ${incl(sym) ? 'closed' : 'open'} circle at ${num(n)}, shaded ${dir}.`,
        wrong(ans, d) {
          if (d.pointOk === false && ans && ans.point != null && Number.isInteger(ans.point))
            return `You put the circle on a whole number. ${num(n)} is the small tick halfway between ${Math.floor(n)} and ${Math.ceil(n)}.`;
          if (d.dirOk === false)
            return `You shaded the way the words read from ${num(n)}'s side. Read it with the variable first: ${v} ${asVar} ${num(n)}. Test ${right(asVar) ? num(n + 1) : num(n - 1)}: it is a solution, so shade toward it.`;
          if (d.openOk === false)
            return `${sym} ${incl(sym) ? 'has the "or equal to" part, so the circle is closed.' : 'is strict, so the circle is open.'} Flipping the inequality does not change that.`;
          return `The boundary is ${num(n)}, the tick halfway between ${Math.floor(n)} and ${Math.ceil(n)}.`;
        },
      },
    };
  });

  // ---------- Error: words turned into the wrong symbol (error) ----------
  G.define('qc_errorIneqWords', (r, o) => {
    const hard = !!o.hard;
    const name = r.pick(NAMES);
    // hard: rules worded as what is NOT allowed, so the student must flip the words before choosing a symbol
    const pool = hard
      ? [
          (n) => ({ text: `Riders shorter than ${n} inches may not ride.`, v: 'h', n, sym: '≥', what: 'the height of a rider who may ride, in inches' }),
          (n) => ({ text: `The lift must never carry more than ${n} people.`, v: 'p', n, sym: '≤', what: 'number of people on the lift' }),
          (n) => ({ text: `A score below ${n} points does not pass.`, v: 'k', n, sym: '≥', what: 'a passing score' }),
          (n) => ({ text: `A cart carrying ${n} kilograms or more will break.`, v: 'w', n, sym: '<', what: 'kilograms a cart can safely carry' }),
          (n) => ({ text: `A game cannot start with ${n} or fewer riders.`, v: 'r', n, sym: '>', what: 'number of riders when a game starts' }),
        ]
      : [
          (n) => ({ text: `You must be at least ${n} inches tall to ride.`, v: 'h', n, sym: '≥', what: 'height in inches' }),
          (n) => ({ text: `The lift holds no more than ${n} people.`, v: 'p', n, sym: '≤', what: 'number of people' }),
          (n) => ({ text: `A Keeper needs a minimum of ${n} points to pass.`, v: 'k', n, sym: '≥', what: 'points scored' }),
          (n) => ({ text: `The cart may carry at most ${n} kilograms.`, v: 'w', n, sym: '≤', what: 'kilograms carried' }),
          (n) => ({ text: `More than ${n} riders are waiting.`, v: 'r', n, sym: '>', what: 'number of riders' }),
          (n) => ({ text: `Fewer than ${n} seats are open.`, v: 'c', n, sym: '<', what: 'number of open seats' }),
        ];
    const s = r.pick(pool)(r.int(6, 60));
    const trap = incl(s.sym) ? r.pick(['flip', 'strict']) : 'flipIncl';
    const wrongSym = trap === 'flip' ? flipOf(s.sym) : trap === 'strict' ? (s.sym === '≥' ? '>' : '<') : flipOf(s.sym) === '>' ? '≥' : '≤';
    const wrongIneq = `${s.v} ${wrongSym} ${s.n}`;
    const okIneq = `${s.v} ${s.sym} ${s.n}`;
    const okHtml =
      trap === 'flip'
        ? `${name} pointed the symbol the wrong way. The rule allows values ${right(s.sym) ? 'bigger' : 'smaller'} than ${s.n}, and ${s.n} itself, so it means ${words(s.sym)}: ${okIneq}.`
        : trap === 'strict'
          ? `${name} dropped the "or equal to" line. The rule allows exactly ${s.n}, so the symbol must include it: ${okIneq}.`
          : `${name} got both parts wrong. The values are ${right(s.sym) ? 'bigger' : 'smaller'} than ${s.n}, and exactly ${s.n} is not allowed: ${okIneq}.`;
    const fixAns = right(s.sym) ? (incl(s.sym) ? s.n : s.n + 1) : incl(s.sym) ? s.n : s.n - 1;
    const sideVal = right(s.sym) ? s.n + 5 : Math.max(0, s.n - 5);
    const opts = [
      { html: okHtml, ok: true },
      {
        html: `${name} should have written an equation instead, because the rule names one number: ${s.v} = ${s.n}.`,
        why: `The rule allows many values, not just one. A range of values needs an inequality.`,
      },
      {
        html: `${name} should have put the number first and kept the same symbol: ${s.n} ${wrongSym} ${s.v}.`,
        why: `Moving the number to the front without flipping the symbol changes the meaning again. The problem is the symbol, not the order.`,
      },
      {
        html: `There is no mistake. ${wrongIneq} matches the rule exactly as it is written.`,
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
      title: hard ? 'Challenge: the words trap (rules that say NOT)' : 'Challenge: the words trap',
      prompt: `<p>Rule: ${hl(s.text)} ${name} let ${s.v} = ${s.what} and wrote this inequality.</p><p>What went wrong?</p>`,
      work: wrongIneq,
      options: sh.options,
      answer: sh.answer,
      fix: { label: `${right(s.sym) ? 'Smallest' : 'Largest'} whole number allowed by the rule: `, answer: fixAns },
      hints: [
        `${hard ? 'First say which values ARE allowed. ' : ''}Test the boundary. Is exactly ${s.n} allowed by the rule? Does ${wrongIneq} agree?`,
        `Test a value on each side, like ${s.n + 5} and ${Math.max(0, s.n - 5)}. Which one does the rule allow? Does ${wrongIneq} agree?`,
        `Decide the direction (bigger or smaller than ${s.n}) and whether ${s.n} itself is allowed. Then pick the symbol.`,
      ],
      hintEs: `${hard ? 'Primero di qué valores SÍ se permiten. ' : ''}Prueba el límite. ¿La regla permite exactamente ${s.n}? ¿${wrongIneq} está de acuerdo?`,
      solution: `<p>${okHtml} Check: ${s.n} ${s.sym} ${s.n} is ${holds(s.n, s.sym, s.n) ? 'true' : 'false'}, which matches the rule. The ${right(s.sym) ? 'smallest' : 'largest'} whole number allowed is <b>${fixAns}</b>.</p>`,
      feedback: {
        correct: `Correct. "${s.text}" is ${okIneq}.`,
        wrong(ans, d) {
          if (!d.mistakeOk) return (sh.options[ans.mistake] && sh.options[ans.mistake].why) || `Test ${s.n} and a value on each side against the rule, then against ${wrongIneq}.`;
          const f = parseNum(ans.fix);
          if (f === s.n && !incl(s.sym)) return `${s.n} itself is not allowed by the rule. Move one whole number ${right(s.sym) ? 'up' : 'down'}.`;
          if (f != null && f === (right(s.sym) ? fixAns - 1 : fixAns + 1)) return `${f} breaks the rule. Test it against ${okIneq}.`;
          return `You found the mistake. Use the correct inequality ${okIneq} to find the ${right(s.sym) ? 'smallest' : 'largest'} whole number allowed.`;
        },
      },
    };
  });

  // ---------- Order inequalities by their first whole-number solution (seq) ----------
  G.define('qc_seqSolutions', (r, o) => {
    const hard = !!o.hard;
    const v = r.pick(['x', 'n', 'y', 't']);
    const size = hard ? 5 : 4;
    const firsts = r.pickN([2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], size);
    // hard: five forms, quarter-unit boundaries, and two number-first forms (strict and inclusive)
    const forms = r.shuffle(hard ? ['gt', 'rev2', 'rev', 'dec', 'qtr'] : ['gt', 'ge', 'rev', 'dec']);
    const items = firsts.map((f, i) => {
      const form = forms[i];
      if (form === 'gt') return { html: `${v} > ${f - 1}`, rate: f, read: `${v} > ${f - 1}: ${f - 1} is not included, so the first whole-number solution is ${f}` };
      if (form === 'ge') return { html: `${v} ≥ ${f}`, rate: f, read: `${v} ≥ ${f}: ${f} is included, so it is the first whole-number solution` };
      if (form === 'rev') return { html: `${f - 1} < ${v}`, rate: f, read: `${f - 1} < ${v} means ${v} > ${f - 1}, so the first whole-number solution is ${f}` };
      if (form === 'rev2') return { html: `${f} ≤ ${v}`, rate: f, read: `${f} ≤ ${v} means ${v} ≥ ${f}, so ${f} itself is the first whole-number solution` };
      if (form === 'qtr') {
        const b = round(f - r.pick([0.25, 0.75]), 2);
        return { html: `${num(b)} < ${v}`, rate: f, read: `${num(b)} < ${v} means ${v} > ${num(b)}, and the first whole number past ${num(b)} is ${f}` };
      }
      const s = r.pick(['>', '≥']);
      return { html: `${v} ${s} ${num(f - 0.5)}`, rate: f, read: `${v} ${s} ${num(f - 0.5)}: the first whole number past ${num(f - 0.5)} is ${f}` };
    });
    const asc = r.chance(0.5);
    const idx = Array.from({ length: size }, (_, i) => i);
    const order = idx.sort((a, b) => (asc ? items[a].rate - items[b].rate : items[b].rate - items[a].rate));
    const decI = forms.indexOf('dec');
    return {
      type: 'seq',
      skill: 'ineq-reasoning',
      lesson: 'Challenge',
      xp: XP,
      title: hard ? 'Challenge: compare five solution sets' : 'Challenge: compare the solution sets',
      prompt: `${hard ? '<p class="muted">Five inequalities. Some boundaries are quarter-units and some are written number-first.</p>' : ''}<p>Every inequality below is true for all large values of ${hl(v)}, but each one starts at a different place. Find the <b>smallest whole number</b> that is a solution of each. Then order the inequalities from the ${asc ? '<b>smallest</b>' : '<b>largest</b>'} first whole-number solution (top) to the ${asc ? '<b>largest</b>' : '<b>smallest</b>'} (bottom).</p>`,
      items: items.map((it) => ({ html: it.html, rate: it.rate })),
      order,
      hints: [
        'Rewrite each inequality with the variable first. Then ask: is the boundary itself a solution? If not, the first whole-number solution is the next whole number up.',
        `For a decimal boundary like ${num(firsts[decI] - 0.5)}, the first whole-number solution is the next whole number, ${firsts[decI]}.`,
        `Write the first whole-number solution next to each inequality, then put those numbers in order.`,
      ],
      hintEs: 'Escribe cada desigualdad con la variable primero. Luego pregúntate: ¿el límite es una solución? Si no lo es, la primera solución entera es el siguiente número entero.',
      solution: `<p>${items.map((it) => it.read).join('. ')}. From ${asc ? 'smallest to largest' : 'largest to smallest'}: <b>${order.map((i) => items[i].html).join(', ')}</b>.</p>`,
      feedback: {
        correct: 'Correct. Comparing where each solution set begins is a way of comparing the sets themselves.',
        wrong(ans) {
          const a = Array.isArray(ans) ? ans : [];
          const flipped = a.length === order.length && a.every((x, i) => x === order[order.length - 1 - i]);
          if (flipped) return `Your order is reversed. Put the ${asc ? 'smallest' : 'largest'} first whole-number solution at the top.`;
          const strict = items.find((it) => /^\S+ > /.test(it.html) || /^\S+ < \S+$/.test(it.html));
          return `Find the first whole-number solution of each.${strict ? ` For ${strict.html}, the boundary itself is not included.` : ''} Then check the direction: ${asc ? 'smallest' : 'largest'} at the top.`;
        },
      },
    };
  });
})(typeof window !== 'undefined' ? window : globalThis);
