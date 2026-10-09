/* js/units/u3/gen-ratios.js */
/* Zone 1 — Base Camp. Lesson 3-1 Understand Ratios. */
(function (root) {
  'use strict';
  const RX = root.RX;
  const { G, V, gcd, shuffleOptions, NAMES } = RX;
  const hl = V.hl;
  const why = (opts, i) => (opts[i] && opts[i].why) || null;

  const PAIRS = [
    ['tents', 'lanterns', 'square', 'tri', '#1FA6A2', '#F2A33A'],
    ['canoes', 'paddles', 'diamond', 'square', '#3B6FB6', '#1FA6A2'],
    ['flags', 'ropes', 'tri', 'circle', '#C8553D', '#17324D'],
    ['compasses', 'maps', 'circle', 'square', '#17324D', '#F2A33A'],
  ];
  const THIRD = [
    ['shovels', 'diamond', '#6B7F3A'],
    ['buckets', 'circle', '#8A5A2B'],
    ['whistles', 'tri', '#2F4858'],
  ];

  // ---------- Reading a ratio from a picture (MC) ----------
  G.define('r1_picture', (r, o) => {
    const hard = !!o.hard;
    const [n1, n2, k1, k2, c1, c2] = r.pick(PAIRS);
    if (!hard) {
      let a = r.int(2, 7),
        b = r.int(2, 9);
      if (b === a) b = a + 1;
      const opts = [
        { html: `${a} : ${b}`, ok: true },
        { html: `${b} : ${a}`, why: `Order matters. The question asks for ${n1} to ${n2}, so the number of ${n1} comes first.` },
        { html: `${a} : ${a + b}`, why: `${a + b} is the total of both items. That would be a part-to-whole ratio. This question compares two parts.` },
        { html: `${b} : ${a + b}`, why: `${a + b} is the total. The question compares ${n1} to ${n2}, not ${n2} to everything.` },
      ];
      const sh = shuffleOptions(r, opts, 0);
      return {
        type: 'mc',
        skill: 'ratio-language',
        lesson: '3-1',
        title: 'Read the ratio',
        prompt: `<p>The supply crate holds the items shown.</p>
        <div class="viz-row"><div><div class="viz-cap">${n1}</div>${V.icons(a, k1, c1, n1)}</div><div><div class="viz-cap">${n2}</div>${V.icons(b, k2, c2, n2)}</div></div>
        <p>What is the ratio of ${hl(n1)} to ${hl(n2)}?</p>`,
        options: sh.options,
        answer: sh.answer,
        hints: [
          'Count each kind of item. Which item does the question name first?',
          `Point to each of the ${n1} as you count them, then do the same for the ${n2}. The question names ${n1} first, so that count goes first.`,
          `Write the count of ${n1}, then a colon, then the count of ${n2}. Read it as "${n1} for every ${n2}."`,
        ],
        hintEs: 'Cuenta cada tipo de objeto. ¿Qué objeto nombra primero la pregunta? Ese número va primero en la razón.',
        solution: `<p>Count: ${a} ${n1}, ${b} ${n2}. The question says <b>${n1} to ${n2}</b>, so the ratio is <b>${a} : ${b}</b>. The order of the words tells you the order of the numbers.</p>`,
        feedback: {
          correct: `Correct. ${a} ${n1} to ${b} ${n2} is written ${a} : ${b}, in the same order as the words.`,
          wrong: (ans) => why(sh.options, ans) || `Count the ${n1} and the ${n2}, then write them in the order the question names them.`,
        },
      };
    }
    // hard: three kinds of items; the question skips the middle one or compares one part to the whole crate
    const [n3, k3, c3] = r.pick(THIRD);
    const [a, b, c] = r.pickN([2, 3, 4, 5, 6, 7], 3);
    const T = a + b + c;
    const mode = r.pick(['skip', 'whole']);
    let opts, ask, ansText, steps, stepHint;
    if (mode === 'skip') {
      ask = `${hl(n3)} to ${hl(n1)}`;
      ansText = `${c} : ${a}`;
      steps = `There are ${c} ${n3} and ${a} ${n1}. The ${n2} are not part of this comparison.`;
      stepHint = `Count only the ${n3} and the ${n1}. The ${n2} are not part of this comparison.`;
      opts = [
        { html: `${c} : ${a}`, ok: true },
        { html: `${a} : ${c}`, why: `Order matters. The question names ${n3} first, so the ${c} ${n3} come first.` },
        { html: `${c} : ${T}`, why: `${T} is every item in the crate. That is a part-to-whole ratio, but the question compares ${n3} to ${n1} only.` },
        { html: `${c} : ${b}`, why: `${b} is the number of ${n2}. The question compares ${n3} to ${n1}, so use the ${n1} count.` },
      ];
    } else {
      ask = `${hl(n2)} to <b>all the items</b> in the crate`;
      ansText = `${b} : ${T}`;
      steps = `There are ${b} ${n2}. All the items together: ${a} + ${b} + ${c}.`;
      stepHint = `Count the ${n2}. Then count every item in the crate, all three kinds together, to get the whole.`;
      opts = [
        { html: `${b} : ${T}`, ok: true },
        { html: `${b} : ${a + c}`, why: `${a + c} counts only the other items. "All the items" includes the ${n2} too, so the whole is ${T}.` },
        { html: `${T} : ${b}`, why: `Order matters. The question names ${n2} first, so ${b} comes first and the total comes second.` },
        { html: `${b} : ${a}`, why: `${a} is only the ${n1}. The question compares ${n2} to every item in the crate.` },
      ];
    }
    const sh = shuffleOptions(r, opts, 0);
    return {
      type: 'mc',
      skill: 'ratio-language',
      lesson: '3-1',
      title: 'Read the ratio',
      prompt: `<p>The supply crate holds three kinds of items.</p>
        <div class="viz-row"><div><div class="viz-cap">${n1}</div>${V.icons(a, k1, c1, n1)}</div><div><div class="viz-cap">${n2}</div>${V.icons(b, k2, c2, n2)}</div><div><div class="viz-cap">${n3}</div>${V.icons(c, k3, c3, n3)}</div></div>
        <p>What is the ratio of ${ask}?</p>`,
      options: sh.options,
      answer: sh.answer,
      hints: [
        'Decide which two amounts the question compares. Is it one part to another part, or one part to the whole crate?',
        stepHint,
        'Write the amount the question names first, then a colon, then the second amount.',
      ],
      hintEs: 'Decide qué dos cantidades compara la pregunta. ¿Es una parte con otra parte, o una parte con el total de la caja?',
      solution: `<p>${steps} The ratio of ${mode === 'skip' ? `${n3} to ${n1}` : `${n2} to all items`} is <b>${ansText}</b>. ${mode === 'skip' ? 'This is part-to-part: the third item is left out.' : `This is part-to-whole: the whole is ${a} + ${b} + ${c} = ${T}.`}</p>`,
      feedback: {
        correct: `Correct. ${ansText} compares exactly the two amounts the question names, in that order.`,
        wrong: (ans) => why(sh.options, ans) || 'Find the two amounts the question names, then write them in that order.',
      },
    };
  });

  // ---------- Sort statements: part-to-part vs part-to-whole ----------
  G.define('r1_sortLanguage', (r, o) => {
    const hard = !!o.hard;
    const a = r.int(2, 5),
      b = r.int(a + 1, 8);
    const c = hard ? r.pick([2, 3, 4, 5, 6, 7].filter((x) => x !== a && x !== b)) : 0;
    const t = a + b + c;
    const pool = hard
      ? [
          { html: `red : white = ${a} : ${c}`, bin: 0, note: 'compares red to white, two parts' },
          { html: `${a + b} red and blue beads for every ${c} white beads`, bin: 0, note: 'compares the red and blue beads to the white beads. Two groups of parts, no total' },
          { html: `For every ${2 * b} blue beads there are ${2 * c} white beads`, bin: 0, note: 'compares blue to white, two parts (scaled up)' },
          { html: `The ratio of white to red is ${c} to ${a}`, bin: 0, note: 'compares white to red, two parts' },
          { html: `${a} out of every ${t} beads are red`, bin: 1, note: `uses ${t}, the total` },
          { html: `white : all beads = ${c} : ${t}`, bin: 1, note: 'compares white to all the beads' },
          { html: `${V.frac(a + b, t)} of the beads are not white`, bin: 1, note: `uses ${t}, the total` },
          { html: `The ratio of blue beads to all beads is ${2 * b} : ${2 * t}`, bin: 1, note: 'compares blue to all the beads (scaled up)' },
        ]
      : [
          { html: `${a} red beads for every ${b} blue beads`, bin: 0, note: 'compares red to blue, two parts' },
          { html: `The ratio of blue to red is ${b} to ${a}`, bin: 0, note: 'compares blue to red, two parts' },
          { html: `For every ${b} blue beads there are ${a} red beads`, bin: 0, note: 'compares blue to red, two parts' },
          { html: `red : blue = ${a} : ${b}`, bin: 0, note: 'compares red to blue, two parts' },
          { html: `${a} of the ${t} beads are red`, bin: 1, note: `uses ${t}, the total` },
          { html: `${b} out of every ${t} beads are blue`, bin: 1, note: `uses ${t}, the total` },
          { html: `red : total = ${a} : ${t}`, bin: 1, note: 'compares red to the total' },
          { html: `${V.frac(b, t)} of the beads are blue`, bin: 1, note: `uses ${t}, the total` },
        ];
    const items = r.shuffle(
      r
        .pickN(
          pool.filter((p) => p.bin === 0),
          3,
        )
        .concat(
          r.pickN(
            pool.filter((p) => p.bin === 1),
            3,
          ),
        ),
    );
    const strip = (s) => String(s).replace(/<[^>]+>/g, '');
    return {
      type: 'sort',
      skill: 'part-whole',
      lesson: '3-1',
      title: 'Sort the ratio language',
      prompt: hard
        ? `<p>A bracelet has ${hl(a + ' red')}, ${hl(b + ' blue')}, and ${hl(c + ' white')} beads. Sort each statement.</p>
        <p class="muted">Careful: a statement can combine two colors and still compare parts.</p>`
        : `<p>A bracelet has ${hl(a + ' red')} beads and ${hl(b + ' blue')} beads (${t} beads total). Sort each statement.</p>
        <p class="muted">A <b>part-to-part</b> ratio compares two parts. A <b>part-to-whole</b> ratio compares one part to the total.</p>`,
      bins: ['Part-to-Part', 'Part-to-Whole'],
      items: items.map((it) => ({ html: it.html, bin: it.bin })),
      hints: hard
        ? [
            'Ask: does the second amount count every bead on the bracelet? Only then is it part-to-whole.',
            `The total is ${a} + ${b} + ${c} = ${t}. A statement that uses ${t} beads (or a scaled copy of it), or says "all beads", compares to the whole.`,
            `"${a + b} red and blue beads for every ${c} white beads" leaves no bead out, but it still compares one group to another group, not to the total.`,
          ]
        : [
            'Ask: does this statement compare red to blue (two parts), or one color to all the beads?',
            `The total is ${t}. Any statement that uses ${t} (or says "of the beads") is comparing to the whole.`,
            `"For every" with two colors is part-to-part. "Out of" or "of the beads" is part-to-whole.`,
          ],
      hintEs: hard
        ? 'Pregúntate: ¿la segunda cantidad cuenta todas las cuentas de la pulsera? Solo así es una razón de parte a total.'
        : 'Pregúntate: ¿esta oración compara rojo con azul (dos partes), o un color con todas las cuentas (el total)?',
      solution: hard
        ? `<p>The total is ${t} beads. Part-to-whole statements compare a part to all ${t} beads (or an equivalent, like ${2 * t}). Part-to-part statements compare one part to another part, even when a part is two colors together, such as ${a + b} red and blue beads to ${c} white beads.</p>`
        : `<p>Part-to-part statements compare red and blue directly (${a} : ${b} or ${b} : ${a}). Part-to-whole statements compare one color to all ${t} beads (${a} : ${t} or ${b} : ${t}).</p>`,
      feedback: {
        correct: 'Correct. Statements that use the total are part-to-whole; statements that compare one group of beads to another are part-to-part.',
        wrong(ans, d) {
          const it = items[(d.wrong || [])[0]];
          if (!it) return 'Check each statement: does the second amount count every bead?';
          return `Look again at "${strip(it.html)}". It ${it.note}, so it is <b>${it.bin === 0 ? 'part-to-part' : 'part-to-whole'}</b>.`;
        },
      },
    };
  });

  // ---------- Ratio from a table, simplest form (two blanks) ----------
  G.define('r1_simplest', (r, o) => {
    const hard = !!o.hard;
    const groups = r.shuffle(['Soccer Team', 'Art Club', 'Robotics Club', 'Debate Team', 'Chess Club', 'Drama Club', 'Band', 'Yearbook']).slice(0, 4);
    const basePairs = hard
      ? [
          [5, 7],
          [4, 9],
          [7, 9],
          [5, 12],
          [7, 8],
          [3, 10],
          [8, 11],
          [7, 10],
        ]
      : [
          [2, 3],
          [3, 4],
          [5, 6],
          [3, 5],
          [4, 5],
          [2, 5],
          [5, 8],
          [3, 8],
          [5, 9],
          [4, 7],
        ];
    const [p, q] = r.pick(basePairs),
      k = hard ? r.int(4, 7) : r.int(3, 8);
    const x = p * k,
      y = q * k;
    const counts = [x, y, r.int(14, 40), r.int(14, 40)];
    const order = r.shuffle([0, 1, 2, 3]);
    const rows = [['School Group', 'Number of Students']].concat(order.map((i) => [groups[i], String(counts[i])]));
    const name = r.pick(NAMES);
    // hard: part-to-whole of the two groups combined
    const top = p,
      bot = hard ? p + q : q,
      den = hard ? x + y : y;
    const ask = hard
      ? `the number of students in the ${hl(groups[0])} to the <b>total</b> number of students in the ${hl(groups[0])} and the ${hl(groups[1])} combined`
      : `the number of students in the ${hl(groups[0])} to the number of students in the ${hl(groups[1])}`;
    return {
      type: 'blanks',
      skill: 'ratio-language',
      lesson: '3-1',
      title: 'Write the ratio in simplest form',
      prompt: `<p>The table shows the number of students in groups at ${name}'s school.</p>${V.table(rows, { cls: 'compact' })}
        <p>Write the ratio of ${ask} as a fraction in <b>simplest form</b>.</p>`,
      fields: [
        { label: 'numerator (top)', answer: top, width: 'sm' },
        { label: 'denominator (bottom)', answer: bot, width: 'sm' },
      ],
      layout: 'fraction',
      hints: hard
        ? [
            `Find the two numbers in the table: ${groups[0]} = ${x}, ${groups[1]} = ${y}. The bottom of the fraction is the two groups added together.`,
            `Combined: ${x} + ${y} = ${den}. Write ${x}/${den}, then find the greatest number that divides both.`,
            `The greatest common factor of ${x} and ${den} is ${k}. Divide the top and the bottom by ${k}.`,
          ]
        : [
            `Find the two numbers in the table: ${groups[0]} = ${x}, ${groups[1]} = ${y}. The group named first goes on top.`,
            `Write ${x}/${y}. To simplify, find the greatest number that divides both ${x} and ${y}.`,
            `The greatest common factor of ${x} and ${y} is ${k}. Divide the top and the bottom by ${k}.`,
          ],
      hintEs: hard
        ? `Busca los dos números en la tabla: ${groups[0]} = ${x}, ${groups[1]} = ${y}. La parte de abajo de la fracción es la suma de los dos grupos (el total).`
        : `Busca los dos números en la tabla: ${groups[0]} = ${x}, ${groups[1]} = ${y}. El grupo que se nombra primero va arriba.`,
      solution: hard
        ? `<p>Total of the two groups: ${x} + ${y} = ${den}. ${groups[0]} : total = ${x} : ${den}. Divide both by ${k} (the greatest common factor): <b>${top}/${bot}</b>. So ${top} out of every ${bot} students in these two groups are in the ${groups[0]}.</p>`
        : `<p>${groups[0]} : ${groups[1]} = ${x} : ${y}. Divide both by ${k} (the greatest common factor): <b>${p}/${q}</b>. This means for every ${p} students in the ${groups[0]}, there are ${q} in the ${groups[1]}.</p>`,
      feedback: {
        correct: `Correct. ${x}/${den} simplifies to ${top}/${bot} because both numbers are divided by ${k}.`,
        wrong(ans) {
          const n = RX.parseNum(ans[0]),
            d = RX.parseNum(ans[1]);
          const ok = n != null && d;
          if (ok && Math.abs(n / d - top / bot) < 1e-9) return 'Your ratio is equivalent to the correct one, but it is not in simplest form yet. Divide both numbers by their greatest common factor.';
          if (hard && ok && Math.abs(n / d - p / q) < 1e-9)
            return `You compared the ${groups[0]} to the ${groups[1]}. The question asks for the ${groups[0]} compared to both groups <b>combined</b>, so the bottom is ${x} + ${y}.`;
          if (ok && Math.abs(n / d - bot / top) < 1e-9) return `You reversed the order. The question names the ${groups[0]} first, so its number goes on top.`;
          if (!hard && ok && Math.abs(n / d - p / (p + q)) < 1e-9) return `You used the total of both groups. The question compares the ${groups[0]} to the ${groups[1]}, two parts.`;
          return `Start by locating the two groups in the table: ${groups[0]} and ${groups[1]}. Then write the fraction and divide the top and bottom by their greatest common factor.`;
        },
      },
    };
  });

  // ---------- Meaning of a simplified ratio (MC) ----------
  G.define('r1_meaning', (r, o) => {
    const hard = !!o.hard;
    const [p, q] = r.pick([
      [2, 3],
      [3, 4],
      [5, 6],
      [3, 5],
      [4, 5],
      [2, 5],
      [5, 7],
    ]);
    const [g1, g2] = r.pickN(['drama club', 'chess club', 'robotics team', 'band', 'art club', 'track team'], 2);
    const s = p + q;
    const opts = hard
      ? [
          { html: `In every group of ${s} students from the two clubs, ${p} are in ${g1}.`, ok: true },
          { html: `In every group of ${s} students from the two clubs, ${q} are in ${g1}.`, why: `The order is reversed. ${p} goes with ${g1}, so ${p} of every ${s} are in ${g1}.` },
          {
            html: `${p} out of every ${q} students in the two clubs are in the ${g1}.`,
            why: `"Out of" needs the whole. ${q} is only the ${g2} part; the whole of one ratio group is ${p} + ${q} = ${s}.`,
          },
          {
            html: `The ${g1} always has exactly ${q - p} fewer students than the ${g2}.`,
            why: `The difference is not fixed. If the clubs had ${2 * p} and ${2 * q} students, the difference would be ${2 * (q - p)}.`,
          },
        ]
      : [
          { html: `For every ${p} students in ${g1}, there are ${q} students in ${g2}.`, ok: true },
          { html: `${p} out of every ${q} students are in ${g1}.`, why: `"Out of" describes part-to-whole. This ratio compares two parts: ${g1} and ${g2}.` },
          {
            html: `There are exactly ${p} students in ${g1} and ${q} in ${g2}.`,
            why: `A simplified ratio shows the relationship, not the actual counts. The real groups could be ${p * 4} and ${q * 4}, for example.`,
          },
          { html: `For every ${p} students in ${g2}, there are ${q} students in ${g1}.`, why: `The order is reversed. The ratio was ${g1} to ${g2}, so ${p} goes with ${g1}.` },
        ];
    const sh = shuffleOptions(r, opts, 0);
    return {
      type: 'mc',
      skill: 'ratio-language',
      lesson: '3-1',
      title: 'What does the ratio mean?',
      prompt: hard
        ? `<p>The ratio of students in ${hl(g1)} to students in ${hl(g2)} simplifies to ${V.frac(p, q)}.</p><p>Which statement <b>must</b> be true?</p>`
        : `<p>The ratio of students in ${hl(g1)} to students in ${hl(g2)} simplifies to ${V.frac(p, q)}.</p><p>What does this simplified ratio mean?</p>`,
      options: sh.options,
      answer: sh.answer,
      hints: hard
        ? [
            'A part-to-part ratio can tell you a part-to-whole ratio. Add the two parts to get the size of one whole ratio group.',
            `One ratio group has ${p} students in ${g1} and ${q} in ${g2}, so ${s} students in all.`,
            `Ask which statement stays true if you multiply ${p} and ${q} by any number, such as 2 or 10.`,
          ]
        : [
            'A ratio in simplest form describes a relationship that repeats. It does not tell you the exact counts.',
            `The ratio was given as ${g1} to ${g2}. The first number goes with the group named first, and the second number goes with the group named second.`,
            `Say it with "for every": for every ${p} in ${g1}, there are ___ in ${g2}.`,
          ],
      hintEs: hard
        ? 'Una razón de parte a parte también te da una razón de parte a total. Suma las dos partes para saber cuántos estudiantes hay en un grupo completo.'
        : 'Una razón en su forma más simple describe una relación que se repite. No te dice la cantidad exacta de estudiantes.',
      solution: hard
        ? `<p>One ratio group is ${p} students in ${g1} and ${q} in ${g2}: ${s} students. So <b>in every group of ${s} students, ${p} are in ${g1}</b>. This stays true for 2, 3, or 10 copies of the group. The difference between the clubs does not stay the same.</p>`
        : `<p>${p}/${q} means <b>for every ${p} students in ${g1}, there are ${q} in ${g2}</b>. The groups could be larger, but they always keep this relationship.</p>`,
      feedback: {
        correct: hard ? `Correct. ${p} : ${q} as parts means ${p} : ${s} as part to whole.` : 'Correct. A simplified ratio describes the "for every" relationship, not the exact counts.',
        wrong: (ans) => why(sh.options, ans) || 'Read each statement and test it with a scaled copy of the ratio.',
      },
    };
  });

  // ---------- Ratio with a total: find each part (blanks) ----------
  G.define('r1_totalSplit', (r, o) => {
    const hard = !!o.hard;
    const name = r.pick(NAMES);
    const item = r.pick(['beads', 'tiles', 'stones']);
    const one = item.slice(0, -1);
    const w = (n) => (n === 1 ? one : item);
    const thing = r.pick(['bracelet', 'mosaic', 'keychain']);
    if (hard) {
      // three-quantity ratio a : b : c with a total
      const [a, b, c] = r.pick([
        [1, 2, 3],
        [2, 3, 4],
        [1, 3, 4],
        [2, 3, 5],
        [3, 4, 5],
        [1, 2, 5],
        [2, 5, 3],
        [4, 1, 3],
      ]);
      const m = r.int(4, 12),
        T = (a + b + c) * m,
        S = a + b + c;
      const [c1, c2, c3] = r.pick([
        ['red', 'blue', 'white'],
        ['gold', 'silver', 'black'],
        ['green', 'white', 'orange'],
      ]);
      return {
        type: 'blanks',
        skill: 'part-whole',
        lesson: '3-1',
        title: 'Split the total three ways',
        prompt: `<p>${name}'s ${thing} uses ${c1}, ${c2}, and ${c3} ${item} in the ratio ${hl(a + ' : ' + b + ' : ' + c)}. The ${thing} uses ${hl(T + ' ' + item)} in total.</p><p>How many ${item} of each color will ${name} use?</p>`,
        fields: [
          { label: `${c1} ${item}`, answer: a * m },
          { label: `${c2} ${item}`, answer: b * m },
          { label: `${c3} ${item}`, answer: c * m },
        ],
        hints: [
          `One ratio group has ${a} + ${b} + ${c} ${item}. How many groups fit into ${T}?`,
          `One group: ${S} ${item}. ${T} ÷ ${S} = ${m} groups.`,
          `There are ${m} groups. Multiply each part of the ratio (${a}, ${b}, and ${c}) by ${m}, then check that your three counts add to ${T}.`,
        ],
        hintEs: `Un grupo de la razón tiene ${a} + ${b} + ${c} piezas. ¿Cuántos grupos caben en ${T}?`,
        solution: `<p>Each ratio group holds ${a} + ${b} + ${c} = ${S} ${item}. ${T} ÷ ${S} = ${m} groups. ${c1}: ${a} × ${m} = <b>${a * m}</b>; ${c2}: ${b} × ${m} = <b>${b * m}</b>; ${c3}: ${c} × ${m} = <b>${c * m}</b>. Check: ${a * m} + ${b * m} + ${c * m} = ${T}.</p>${V.tape(
          [
            { label: c1, boxes: a, value: m },
            { label: c2, boxes: b, value: m },
            { label: c3, boxes: c, value: m },
          ],
        )}`,
        feedback: {
          correct: `Correct. ${T} ÷ ${S} = ${m} per ratio group, so ${a * m}, ${b * m}, and ${c * m}.`,
          wrong(ans) {
            const v = ans.map((x) => RX.parseNum(x));
            if (v[0] === a && v[1] === b && v[2] === c) return `${a} : ${b} : ${c} is the ratio, not the counts. The counts must add to ${T}.`;
            if (v.every((x) => x === T / 3)) return `You split ${T} into three equal piles. The colors are not equal: the ratio says ${a} : ${b} : ${c}.`;
            if (v.every((x) => x != null) && v.some((x, i) => x === [a, b, c][i] * (T / (a + b))))
              return `Use all three parts of the ratio. One group has ${a} + ${b} + ${c} = ${S} ${item}, not ${a + b}.`;
            if (v.every((x) => x != null) && v[0] + v[1] + v[2] !== T)
              return `Your counts add to ${v[0] + v[1] + v[2]}, but the total must be ${T}. Divide ${T} by ${S} to find the size of each group.`;
            return `Think in groups: each group has ${a} ${c1}, ${b} ${c2}, and ${c} ${c3}. How many groups make ${T}? Check which color goes in which blank.`;
          },
        },
      };
    }
    const a = r.int(1, 3),
      bChoices = [2, 3, 4, 5, 6].filter((b) => b !== a && gcd(a, b) === 1);
    const b = r.pick(bChoices),
      m = r.int(3, 9),
      T = (a + b) * m;
    const [c1, c2] = r.pick([
      ['red', 'blue'],
      ['gold', 'silver'],
      ['green', 'white'],
      ['black', 'orange'],
    ]);
    return {
      type: 'blanks',
      skill: 'part-whole',
      lesson: '3-1',
      title: 'Split the total',
      prompt: `<p>${name} is making a ${thing} with ${hl(a + ' ' + c1)} ${w(a)} for every ${hl(b + ' ' + c2)} ${w(b)}. The design uses ${hl(T + ' ' + item)} in total.</p><p>How many of each color will ${name} use?</p>`,
      fields: [
        { label: `${c2} ${item}`, answer: b * m },
        { label: `${c1} ${item}`, answer: a * m },
      ],
      hints: [
        `One group of the ratio has ${a} + ${b} = ${a + b} ${item}. How many groups fit into ${T}?`,
        `${T} ÷ ${a + b} = ${m} groups. Each group has ${a} ${c1} and ${b} ${c2}.`,
        `There are ${m} groups. Multiply ${a} by ${m} for ${c1} and ${b} by ${m} for ${c2}, then check that the counts add to ${T}.`,
      ],
      hintEs: `Un grupo de la razón tiene ${a} + ${b} = ${a + b} piezas. ¿Cuántos grupos caben en ${T}?`,
      solution: `<p>Each ratio group holds ${a + b} ${item}. ${T} ÷ ${a + b} = ${m} groups. So ${c1} = ${a} × ${m} = <b>${a * m}</b> and ${c2} = ${b} × ${m} = <b>${b * m}</b>. The two parts add to ${T}.</p>${V.tape(
        [
          { label: c1, boxes: a, value: m },
          { label: c2, boxes: b, value: m },
        ],
      )}`,
      feedback: {
        correct: `Correct. ${T} ÷ ${a + b} = ${m} per ratio group, so ${a * m} ${c1} and ${b * m} ${c2}.`,
        wrong(ans) {
          const x = RX.parseNum(ans[0]),
            y = RX.parseNum(ans[1]);
          if (x === b && y === a) return `${a} : ${b} is the ratio, not the counts. The counts must add up to ${T}. Find how many ratio groups fit into ${T}.`;
          if (x === a * m && y === b * m) return 'The numbers are right but swapped. Check which color goes with which blank.';
          if (x === T / 2 && y === T / 2) return `You split ${T} in half. The colors are not equal: there are ${a} ${c1} for every ${b} ${c2}.`;
          if (x != null && y != null && x + y !== T) return `Your two counts add to ${x + y}, but the total must be ${T}. Divide ${T} by ${a + b} to find the number of ratio groups.`;
          return `Think in groups: each group has ${a} ${c1} and ${b} ${c2}. How many groups make ${T}?`;
        },
      },
    };
  });

  // ---------- Build a tape diagram (tape) ----------
  G.define('r1_tapeBuild', (r, o) => {
    const [a, b] = r.pick([
      [2, 3],
      [3, 4],
      [1, 4],
      [2, 5],
      [3, 5],
      [4, 5],
      [1, 3],
      [3, 2],
      [5, 2],
    ]);
    const hard = !!o.hard;
    const m = r.int(4, 12);
    const [i1, i2] = r.pick([
      ['peanuts', 'raisins'],
      ['oak trees', 'pine trees'],
      ['adult tickets', 'child tickets'],
      ['red tiles', 'gray tiles'],
    ]);
    const T = (a + b) * m;
    const fields = [
      { key: 'box', label: 'Value of each box', answer: m },
      { key: 'rowA', label: i1, answer: a * m },
      { key: 'rowB', label: i2, answer: b * m },
    ];
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
      type: 'tape',
      skill: 'tape',
      lesson: '3-1',
      title: 'Label the tape diagram',
      prompt,
      rows: [
        { label: i1, boxes: a },
        { label: i2, boxes: b },
      ],
      fields,
      total: hard ? null : T,
      given,
      hints: hard
        ? [
            `The ${i1} row has ${a} ${a === 1 ? 'box' : 'boxes'} and represents ${a * m}. All boxes are the same size.`,
            `${a * m} ÷ ${a} = ${m}. Each box is worth ${m}.`,
            `${i2}: ${b} boxes × ${m}. Total: add the ${i1} and the ${i2}.`,
          ]
        : [`Count all the boxes: ${a} + ${b} = ${a + b}. The total ${T} is shared equally among them.`, `${T} ÷ ${a + b} = ${m}. Each box is worth ${m}.`, `${i1}: ${a} × ${m}. ${i2}: ${b} × ${m}.`],
      hintEs: hard
        ? `La fila de ${i1} tiene ${a} ${a === 1 ? 'caja' : 'cajas'} y vale ${a * m}. Todas las cajas del diagrama de cinta tienen el mismo valor.`
        : `Cuenta todas las cajas: ${a} + ${b} = ${a + b}. El total, ${T}, se reparte en partes iguales entre las cajas.`,
      solution: `<p>Each box is worth <b>${m}</b> (${hard ? `${a * m} ÷ ${a}` : `${T} ÷ ${a + b}`}). ${i1} = ${a} × ${m} = <b>${a * m}</b>; ${i2} = ${b} × ${m} = <b>${b * m}</b>; total = <b>${T}</b>.</p>${V.tape(
        [
          { label: i1, boxes: a, value: m, total: a * m },
          { label: i2, boxes: b, value: m, total: b * m },
        ],
      )}`,
      feedback: {
        correct: `Correct. Every box in a tape diagram has the same value (${m}), so each row is boxes × ${m}.`,
        wrong(ans, d) {
          const box = RX.parseNum(ans.box);
          if (d.wrong.includes('box')) {
            if (hard && box === a * m) return `${a * m} is the whole ${i1} row, not one box. That row has ${a} boxes, so divide.`;
            if (!hard && box === T / a) return `You divided the total by ${a}, the ${i1} boxes only. The total is shared by all ${a + b} boxes.`;
            return hard ? `Start with the row you know: ${a} boxes make ${a * m}, so divide to find one box.` : `Find the box value first: the total ${T} is split equally across all ${a + b} boxes.`;
          }
          if (hard && d.wrong.includes('total') && RX.parseNum(ans.total) === b * m) return `The total is both rows together: the ${i1} plus the ${i2}.`;
          return `Your box value is right. Multiply the number of boxes in each row by ${m}.`;
        },
      },
    };
  });

  // ---------- Select all equivalent ratios (MS) ----------
  G.define('r1_equivSelect', (r, o) => {
    const hard = !!o.hard;
    const [a, b] = r.pick([
      [2, 3],
      [3, 4],
      [2, 5],
      [3, 5],
      [4, 7],
      [5, 6],
      [1, 4],
      [3, 8],
    ]);
    let opts, start, hints, hintEs, solution;
    if (hard) {
      // start from a ratio that is not in simplest form; equivalents include scaling down
      const g = r.pick([2, 3, 4]);
      const A = a * g,
        B = b * g;
      const ks = r.pickN(
        [2, 3, 5, 6, 7, 10].filter((k) => k !== g),
        2,
      );
      start = `${A} : ${B}`;
      opts = [
        { html: `${a} : ${b}`, ok: true },
        { html: `${a * ks[0]} : ${b * ks[0]}`, ok: true },
        { html: `${a * ks[1]} : ${b * ks[1]}`, ok: true },
        { html: `${A + g} : ${B + g}`, why: `${A + g} : ${B + g} adds ${g} to both parts. Adding does not keep a ratio equivalent.` },
        { html: `${a * 2} : ${b * 3}`, why: `${a * 2} : ${b * 3} multiplies the parts by different numbers (2 and 3). Both parts must use the same factor.` },
        { html: `${B} : ${A}`, why: 'Reversing the order changes the ratio.' },
      ];
      hints = [
        `First write ${A} : ${B} in simplest form. Every equivalent ratio is a multiple of that simplest form.`,
        `${A} ÷ ${g} = ${a} and ${B} ÷ ${g} = ${b}, so ${A} : ${B} = ${a} : ${b}.`,
        `Now check each option: is it ${a} × some number : ${b} × the same number?`,
      ];
      hintEs = `Primero escribe ${A} : ${B} en su forma más simple. Toda razón equivalente es un múltiplo de esa forma simple.`;
      solution = `<p>${A} : ${B} simplifies to ${a} : ${b} (divide both by ${g}). The equivalent ratios are ${a} : ${b}, ${a * ks[0]} : ${b * ks[0]} (× ${ks[0]}), and ${a * ks[1]} : ${b * ks[1]} (× ${ks[1]}). ${A + g} : ${B + g} adds, ${a * 2} : ${b * 3} uses two different factors, and ${B} : ${A} is reversed.</p>`;
    } else {
      const ks = r.pickN([2, 3, 4, 5, 6, 10], 3);
      start = `${a} : ${b}`;
      opts = [
        { html: `${a * ks[0]} : ${b * ks[0]}`, ok: true },
        { html: `${a * ks[1]} : ${b * ks[1]}`, ok: true },
        { html: `${a * ks[2]} : ${b * ks[2]}`, ok: true },
        { html: `${b} : ${a}`, why: 'Reversing the order changes the ratio.' },
        { html: `${a} : ${a + b}`, why: `${a + b} is the total, so this is a different (part-to-whole) comparison.` },
        { html: `${a + 2} : ${b + 2}`, why: 'Adding the same number to both parts does not keep a ratio equivalent. You must multiply or divide both parts by the same number.' },
      ];
      hints = [
        'Equivalent ratios come from multiplying (or dividing) both numbers by the same factor.',
        `Check each option: is the first number ${a} × something, and the second number ${b} × the same something?`,
        `${a * ks[0]} : ${b * ks[0]} works because both were multiplied by ${ks[0]}. ${a + 2} : ${b + 2} does not, because 2 was added.`,
      ];
      hintEs = 'Las razones equivalentes se forman al multiplicar (o dividir) los dos números por el mismo factor.';
      solution = `<p>Multiplying both parts of ${a} : ${b} by ${ks[0]}, ${ks[1]}, or ${ks[2]} gives the equivalent ratios. ${b} : ${a} is reversed, ${a} : ${a + b} compares to the total, and ${a + 2} : ${b + 2} was made by adding, which breaks the relationship.</p>`;
    }
    const sh = shuffleOptions(r, opts, [0, 1, 2]);
    return {
      type: 'ms',
      skill: 'equivalent',
      lesson: '3-1',
      title: 'Find every equivalent ratio',
      prompt: `<p>Select <b>all</b> ratios that are equivalent to ${hl(start)}.</p>`,
      options: sh.options,
      answers: sh.answers,
      hints,
      hintEs,
      solution,
      feedback: {
        correct: 'Correct. Every equivalent ratio multiplies or divides both parts by the same factor.',
        wrong(ans, d) {
          if (d.extra.length) return sh.options[d.extra[0]].why || 'One of your selections is not equivalent.';
          if (hard && d.missing.some((i) => sh.options[i].html === `${a} : ${b}`))
            return `You missed the simplest form. Dividing both parts of ${start} by the same number also makes an equivalent ratio.`;
          return 'You missed at least one equivalent ratio. Look for options where both parts were multiplied by the same number.';
        },
      },
    };
  });

  // ---------- Error analysis: additive thinking (error) ----------
  G.define('r1_errorAdditive', (r, o) => {
    const hard = !!o.hard;
    const name = r.pick(NAMES);
    const [a, b] = r.pick([
      [2, 5],
      [3, 4],
      [1, 3],
      [3, 7],
      [2, 3],
    ]);
    const g = hard ? r.pick([2, 3]) : 1;
    const A = a * g,
      B = b * g;
    const c = r.int(2, 4);
    const k = hard ? r.pick([4, 5, 7].filter((x) => x % g !== 0)) : r.int(3, 6);
    const opts = [
      { html: `Adding ${c} to both parts changes the relationship. To make an equivalent ratio, multiply or divide both parts by the <b>same</b> number.`, ok: true },
      {
        html: `${name} should have added ${c} only to the second number.`,
        why: 'Adding to only one part makes the ratio even more unbalanced. Adding is not the operation that keeps ratios equivalent.',
      },
      {
        html: `${name} should have subtracted ${c} from both parts instead.`,
        why: 'Subtracting the same number from both parts also changes the relationship. Multiplying or dividing keeps it the same.',
      },
      { html: `The ratio ${A} : ${B} cannot have any equivalent ratios.`, why: `Every ratio has equivalent ratios. For example, ${A * 2} : ${B * 2} is equivalent to ${A} : ${B}.` },
    ];
    const sh = shuffleOptions(r, opts, 0);
    const added = B + (a * k - A);
    return {
      type: 'error',
      skill: 'equivalent',
      lesson: '3-1',
      title: 'Find the mistake',
      prompt: `<p>${name} says: "${hl(A + ' : ' + B)} is equivalent to ${hl(A + c + ' : ' + (B + c))} because I added ${c} to both numbers."</p><p>Why is this reasoning incorrect?${hard ? ` Then fix it: find an equivalent ratio whose first number is ${a * k}.` : ''}</p>`,
      work: `${A} + ${c} = ${A + c}, &nbsp; ${B} + ${c} = ${B + c} &nbsp; so &nbsp; ${A} : ${B} = ${A + c} : ${B + c}`,
      options: sh.options,
      answer: sh.answer,
      fix: { label: `Complete an equivalent ratio: ${a * k} : `, answer: b * k },
      hints: hard
        ? [
            `Test the claim with a simple case: is 1 : 2 the same as 2 : 3? For the fix, ${a * k} is not a whole-number multiple of ${A}, so simplify ${A} : ${B} first.`,
            `${A} : ${B} = ${a} : ${b} (divide both by ${g}). Now scale ${a} : ${b} up to a first number of ${a * k}.`,
            `${a} × ${k} = ${a * k}, so multiply ${b} by ${k} as well.`,
          ]
        : [
            'Test the claim with a simple case: is 1 : 2 the same as 2 : 3? (Hint: 1 : 2 is "half"; 2 : 3 is not.)',
            `To make an equivalent ratio from ${a} : ${b}, multiply both parts by the same factor.`,
            `${a} × ${k} = ${a * k}, so multiply ${b} by ${k} as well.`,
          ],
      hintEs: hard
        ? `Prueba la idea con un caso sencillo: ¿1 : 2 es igual que 2 : 3? Para corregirlo, ${a * k} no es un múltiplo entero de ${A}, así que primero simplifica ${A} : ${B}.`
        : 'Prueba la idea con un caso sencillo: ¿1 : 2 es igual que 2 : 3? (1 : 2 es "la mitad"; 2 : 3 no lo es.)',
      solution: `<p>Adding changes the relationship: ${A} : ${B} and ${A + c} : ${B + c} do not simplify to the same ratio. Equivalent ratios come from multiplying or dividing both parts by the same factor.${hard ? ` ${A} : ${B} = ${a} : ${b} (÷ ${g}).` : ''} ${a} × ${k} = ${a * k} and ${b} × ${k} = <b>${b * k}</b>, so ${a * k} : ${b * k} is equivalent.</p>`,
      feedback: {
        correct: `Correct. Only multiplying or dividing both parts by the same number keeps a ratio equivalent. ${a * k} : ${b * k} works because ${a} : ${b} was multiplied by ${k}.`,
        wrong(ans, d) {
          if (!d.mistakeOk) return why(sh.options, ans.mistake) || 'Think about which operation keeps a ratio equivalent.';
          const f = RX.parseNum(ans.fix);
          if (f === added) return `You found the mistake, but your fix makes it again: you added ${a * k - A} to both parts. Multiply instead.`;
          if (hard && f === B * k) return `You multiplied ${B} by ${k}, but ${A} × ${k} is not ${a * k}. Simplify ${A} : ${B} to ${a} : ${b} first, then scale by ${k}.`;
          return hard
            ? `You found the mistake. For the fix, simplify ${A} : ${B} first, then find what ${a} was multiplied by to get ${a * k}.`
            : `You found the mistake. For the fix, ${a} was multiplied by ${k} to get ${a * k}, so multiply ${b} by ${k} too.`;
        },
      },
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
  const why = (opts, i) => (opts[i] && opts[i].why) || null;

  const RATE_CTX = [
    { what: 'jumping jacks', per: 'second', perLabel: 'jumping jacks per second', tmin: 12, tmax: 60, rmin: 2, rmax: 6 },
    { what: 'words', per: 'minute', perLabel: 'words per minute', tmin: 3, tmax: 9, rmin: 25, rmax: 60 },
    { what: 'liters of water', per: 'minute', perLabel: 'liters per minute', tmin: 4, tmax: 15, rmin: 3, rmax: 12 },
    { what: 'meters', per: 'second', perLabel: 'meters per second', tmin: 5, tmax: 20, rmin: 3, rmax: 9 },
    { what: 'pages', per: 'hour', perLabel: 'pages per hour', tmin: 2, tmax: 6, rmin: 14, rmax: 40 },
  ];
  const VERB = { 'jumping jacks': 'does', words: 'types', 'liters of water': 'pumps', meters: 'swims', pages: 'reads' };
  const ES_PER = { second: 'segundo', minute: 'minuto', hour: 'hora' };

  // ---------- Basic unit rate (num) ----------
  G.define('r2_unitRate', (r, o) => {
    const hard = !!o.hard;
    const c = r.pick(RATE_CTX),
      name = r.pick(NAMES);
    let rate, t;
    if (hard) {
      // a decimal unit rate (quarters or halves) over a time that does not divide evenly into a whole number
      t = r.int(Math.max(4, c.tmin), Math.max(8, c.tmax));
      rate = r.int(c.rmin * 4, c.rmax * 4) / 4;
      if (Number.isInteger(rate)) rate += 0.5;
    } else {
      rate = r.int(c.rmin, c.rmax);
      t = r.int(c.tmin, c.tmax);
    }
    const total = round(rate * t, 2);
    return {
      type: 'num',
      skill: 'unit-rate',
      lesson: '3-2',
      title: 'Write the unit rate',
      prompt: `<p>${name} ${VERB[c.what]} ${hl(total + ' ' + c.what)} in ${hl(t + ' ' + c.per + 's')}.</p><p>Write this rate as a <b>unit rate</b>.${hard ? ' The unit rate may be a decimal.' : ''}</p>`,
      unit: c.perLabel,
      answer: rate,
      hints: [
        'A unit rate tells how much for <b>1</b> unit of time. Which quantity needs to become 1?',
        `Divide the ${c.what} by the number of ${c.per}s: ${total} ÷ ${t}.`,
        hard
          ? `Divide ${total} by ${t}. It does not come out even, so keep dividing past the decimal point (write ${total} as ${total}.00).`
          : `Divide ${total} by ${t}. Your answer is the number of ${c.what} in 1 ${c.per}.`,
      ],
      hintEs: `Una tasa unitaria dice cuánto hay en <b>1</b> unidad de tiempo. ¿Qué cantidad tiene que llegar a ser 1? Aquí, el tiempo: 1 ${ES_PER[c.per]}.`,
      solution: `<p>Unit rate = ${total} ${c.what} ÷ ${t} ${c.per}s = <b>${rate} ${c.perLabel}</b>. Dividing by ${t} makes the time equal to 1 ${c.per}.${hard ? ` Check: ${rate} × ${t} = ${total}.` : ''}</p>`,
      feedback: {
        correct: `Correct. ${total} ÷ ${t} = ${rate}, so ${rate} ${c.what} happen every 1 ${c.per}.`,
        wrong(ans, d) {
          const v = d.value;
          if (v != null && Math.abs(v - t / total) < 0.01)
            return `You divided in the wrong direction. The unit rate asks for ${c.what} per 1 ${c.per}, so divide the ${c.what} (${total}) by the ${c.per}s (${t}).`;
          if (v === total) return `${total} is the total, not the amount per ${c.per}. Divide by ${t} to find the amount for 1 ${c.per}.`;
          if (v != null && Math.abs(v - total * t) < 0.01) return `You multiplied. To find the amount for 1 ${c.per}, divide ${total} by ${t}.`;
          if (v != null && Math.abs(v - (total - t)) < 0.01) return `Subtracting does not give a rate. Divide ${total} by ${t} to find the amount per 1 ${c.per}.`;
          if (hard && v != null && Math.abs(v - Math.floor(rate)) < 0.01)
            return `${Math.floor(rate)} is only the whole-number part. ${total} ÷ ${t} has a remainder, so continue the division into decimals.`;
          return `A unit rate compares the quantity to 1 ${c.per}. Divide ${total} by ${t}.`;
        },
      },
    };
  });

  // ---------- Vocabulary matching ----------
  G.define('r2_vocabMatch', (r, o) => {
    const hard = !!o.hard;
    let terms;
    if (hard) {
      // match each term to an example only: no definitions to lean on
      const [ra, rb] = r.pick([
        [3, 5],
        [2, 7],
        [4, 9],
        [5, 6],
      ]);
      const notebooks = r.int(3, 6),
        each = r.int(2, 4);
      const mph = r.int(45, 65),
        oz = r.int(15, 49);
      const [ea, eb] = r.pick([
          [2, 3],
          [3, 4],
          [2, 5],
        ]),
        ek = r.int(3, 5);
      terms = [
        ['ratio', `${ra} red marbles to ${rb} blue marbles`],
        ['rate', `${money(notebooks * each)} for ${notebooks} notebooks`],
        ['unit rate', `${mph} miles per 1 hour`],
        ['equivalent ratios', `${ea * 2} : ${eb * 2} and ${ea * ek} : ${eb * ek}`],
        ['unit price', `$0.${oz} for 1 ounce of cheese`],
      ];
    } else {
      terms = [
        ['ratio', 'A comparison of two quantities, such as 3 to 5 or 3 : 5'],
        ['rate', 'A ratio that compares two quantities with different units, such as 120 miles in 3 hours'],
        ['unit rate', 'A rate in which the second quantity is 1, such as 40 miles per 1 hour'],
        ['equivalent ratios', 'Ratios that show the same relationship, such as 2 : 3 and 6 : 9'],
        ['unit price', 'The cost for one unit of an item, such as $2.50 per pound'],
      ];
    }
    const right = r.shuffle(terms.map((t, i) => i));
    return {
      type: 'match',
      skill: 'unit-rate',
      lesson: '3-2',
      title: hard ? 'Match each term to an example' : 'Match the vocabulary',
      prompt: hard ? '<p>Match each term with an <b>example</b> of it. Each example fits exactly one term.</p>' : '<p>Match each term with its meaning.</p>',
      left: terms.map((t) => t[0]),
      right: right.map((i) => terms[i][1]),
      pairs: terms.map((t, i) => [i, right.indexOf(i)]),
      hints: [
        'A ratio compares any two quantities. A rate is a ratio with different units (miles and hours).',
        'A unit rate or unit price always has 1 as the second quantity: per 1 hour, per 1 pound. A unit price is a unit rate in dollars.',
        hard
          ? 'Equivalent ratios come in pairs that show the same relationship. A rate that is not a unit rate compares to a number other than 1.'
          : 'Equivalent ratios are made by multiplying both parts by the same number.',
      ],
      hintEs: 'Una razón compara dos cantidades cualesquiera. Una tasa es una razón con unidades diferentes (millas y horas).',
      solution: `<ul>${terms.map((t) => `<li><b>${t[0]}</b>: ${t[1]}</li>`).join('')}</ul>${hard ? '<p>The rate compares to several notebooks, not 1, so it is a rate but not a unit rate. The unit price is a unit rate that uses dollars.</p>' : ''}`,
      feedback: {
        correct: 'Correct. These five terms are the vocabulary of the whole unit.',
        wrong(ans, d) {
          const w = (d.wrong || []).map((i) => terms[i][0]);
          if (w.includes('rate') && w.includes('unit rate')) return 'Look at the second quantity. A unit rate compares to exactly 1; a rate can compare to any amount.';
          if (w.includes('unit rate') && w.includes('unit price')) return 'Both compare to 1. A unit price is the one about money: dollars for 1 item or 1 unit.';
          if (w.length) return `Check your match for "${w[0]}". Read its meaning in the Field Guide and compare it to each choice.`;
          return 'Match every term before checking.';
        },
      },
    };
  });

  // ---------- Which statements are unit rates? (MS) ----------
  G.define('r2_whichUnit', (r, o) => {
    const hard = !!o.hard;
    let opts, hints, hintEs, solution;
    if (hard) {
      const dm = r.pick([0.4, 0.5, 0.6, 0.8]),
        cup = r.pick([
          [1, 2],
          [3, 4],
          [2, 3],
        ]),
        oz = r.int(12, 45);
      const pd = r.int(6, 15),
        pw = r.int(2, 5),
        m = r.int(10, 30) * 6,
        h = r.pick([4, 5, 7]),
        e = r.pick([6, 12, 18]),
        ep = r.int(2, 6);
      opts = [
        { html: `${dm} mile per minute`, ok: true },
        { html: `${V.frac(cup[0], cup[1])} cup of flour per batch`, ok: true },
        { html: `$0.${oz} per ounce`, ok: true },
        { html: `$${pd} per ${pw} pounds`, why: `"Per ${pw} pounds" compares to ${pw}, not to 1. The word "per" alone does not make a unit rate. The unit price is ${money(pd / pw)} per pound.` },
        { html: `${m} miles in ${h} hours`, why: `${m} miles in ${h} hours compares to ${h} hours. A unit rate would be ${round(m / h, 2)} miles per 1 hour.` },
        { html: `${e} eggs for ${money(ep)}`, why: `${e} eggs for ${money(ep)} is a rate, but neither quantity is 1. The unit price would be ${money(ep / e)} per egg.` },
      ];
      hints = [
        'A unit rate compares a quantity to exactly 1 of the other unit. The first number can be a decimal or a fraction.',
        `"Per" followed by a single unit (per minute, per batch) means "for 1". "Per ${pw} pounds" means "for ${pw} pounds".`,
        `A decimal like ${dm} or a fraction like ${cup[0]}/${cup[1]} can be the amount for 1. Check the second quantity, not the first.`,
      ];
      hintEs = 'Una tasa unitaria compara una cantidad con exactamente 1 de la otra unidad. El primer número puede ser un decimal o una fracción.';
      solution = `<p>Unit rates: ${dm} mile per minute, ${cup[0]}/${cup[1]} cup per batch, and $0.${oz} per ounce. Each compares to <b>1</b> of the second unit, even though the first amount is a decimal or a fraction. "$${pd} per ${pw} pounds", "${m} miles in ${h} hours", and "${e} eggs for ${money(ep)}" compare to ${pw}, ${h}, and ${e}, so they are rates but not unit rates.</p>`;
    } else {
      const p = r.int(2, 8),
        s = r.int(45, 75),
        tx = r.int(2, 9);
      const e = r.pick([6, 12, 18]),
        ep = r.int(2, 6),
        m = r.int(100, 240),
        h = r.int(2, 5),
        pen = r.int(4, 10),
        st = r.int(2, 5);
      opts = [
        { html: `${money(p)} per pound`, ok: true },
        { html: `${s} miles per hour`, ok: true },
        { html: `${tx} texts per minute`, ok: true },
        { html: `${e} eggs for ${money(ep)}`, why: `${e} eggs for ${money(ep)} is a rate, but the second quantity is not 1. The unit price would be ${money(ep / e)} per egg.` },
        { html: `${m} miles in ${h} hours`, why: `${m} miles in ${h} hours is a rate. A unit rate would be ${round(m / h, 2)} miles per 1 hour.` },
        { html: `${pen} pencils for ${st} students`, why: `${pen} pencils for ${st} students compares to ${st}, not to 1. A unit rate would be ${round(pen / st, 2)} pencils per student.` },
      ];
      hints = [
        'A unit rate compares a quantity to exactly 1 of the other unit.',
        'The word "per" usually means "for each 1". "Per hour" = for 1 hour.',
        `"${e} eggs for ${money(ep)}" compares to ${money(ep)}, not to $1 or 1 egg, so it is a rate but not a unit rate.`,
      ];
      hintEs = 'Una tasa unitaria compara una cantidad con exactamente 1 de la otra unidad.';
      solution = `<p>Unit rates: ${money(p)} per pound, ${s} miles per hour, ${tx} texts per minute. Each compares to <b>1</b>. The others compare to ${money(ep)}, ${h} hours, and ${st} students, so they are rates but not unit rates.</p>`;
    }
    const sh = shuffleOptions(r, opts, [0, 1, 2]);
    return {
      type: 'ms',
      skill: 'unit-rate',
      lesson: '3-2',
      title: 'Spot the unit rates',
      prompt: hard ? '<p>Select <b>all</b> statements that are <b>unit rates</b>. Watch the second quantity closely.</p>' : '<p>Select <b>all</b> statements that are <b>unit rates</b>.</p>',
      options: sh.options,
      answers: sh.answers,
      hints,
      hintEs,
      solution,
      feedback: {
        correct: 'Correct. A unit rate compares to exactly 1 of the second unit. That is what makes a rate a unit rate.',
        wrong(ans, d) {
          if (d.extra.length) return sh.options[d.extra[0]].why;
          return hard
            ? 'You missed a unit rate. A decimal or fraction can still be the amount for 1: check that the second quantity is a single unit.'
            : 'You missed a unit rate. Look for "per" followed by a single unit.';
        },
      },
    };
  });

  // ---------- Which student divided correctly? (who) ----------
  G.define('r2_direction', (r, o) => {
    const hard = !!o.hard;
    const [n1, n2, n3] = r.pickN(NAMES, 3);
    let m, per, t, opts;
    if (hard) {
      // a decimal minutes-per-mile answer, and a student with the right number but the wrong unit label
      m = r.pick([2, 4, 6]);
      per = r.int(13, 23) / 2;
      if (Number.isInteger(per)) per += 0.5;
      t = per * m;
      opts = [
        { title: n1, html: `${t} ÷ ${m} = ${per}<br><b>${per} minutes per mile</b>`, ok: true },
        {
          title: n2,
          html: `${m} ÷ ${t} = ${round(m / t, 3)}<br><b>${round(m / t, 3)} minutes per mile</b>`,
          why: `${n2} divided in the wrong direction. "Minutes per mile" means minutes ÷ miles, so ${t} ÷ ${m}. (${m} ÷ ${t} gives miles per minute.)`,
        },
        {
          title: n3,
          html: `${t} ÷ ${m} = ${per}<br><b>${per} miles per minute</b>`,
          why: `${n3} divided correctly but used the wrong label. ${t} minutes ÷ ${m} miles gives minutes for each mile, not miles for each minute.`,
        },
      ];
    } else {
      m = r.int(2, 6);
      per = r.int(6, 12);
      t = m * per;
      opts = [
        { title: n1, html: `${t} ÷ ${m} = ${per}<br><b>${per} minutes per mile</b>`, ok: true },
        {
          title: n2,
          html: `${m} ÷ ${t} = ${round(m / t, 3)}<br><b>${round(m / t, 3)} minutes per mile</b>`,
          why: `${n2} divided in the wrong direction. "Minutes per mile" means minutes ÷ miles, so ${t} ÷ ${m}. (${m} ÷ ${t} would be miles per minute.)`,
        },
        { title: n3, html: `${t} − ${m} = ${t - m}<br><b>${t - m} minutes per mile</b>`, why: `${n3} subtracted. A rate is found by dividing, not subtracting.` },
      ];
    }
    const sh = shuffleOptions(r, opts, 0);
    return {
      type: 'who',
      skill: 'unit-rate',
      lesson: '3-2',
      title: 'Who is correct?',
      prompt: `<p>A runner finishes ${hl(m + ' miles')} in ${hl(t + ' minutes')}. The coach asks for the unit rate in <b>minutes per mile</b>. Three students show their work. Who is correct?</p>`,
      options: sh.options,
      answer: sh.answer,
      layout: 'cards',
      hints: [
        '"Minutes per mile" means the number of minutes for 1 mile. Which quantity should become 1?',
        `To make miles equal 1, divide both quantities by ${m}.`,
        hard ? `Look for work that divides ${t} by ${m} <b>and</b> labels the result with the unit you divided into: minutes for each mile.` : `Look for the work that divides ${t} by ${m}.`,
      ],
      hintEs: '"Minutos por milla" significa cuántos minutos se tarda en 1 milla. ¿Qué cantidad tiene que llegar a ser 1?',
      solution: `<p>Minutes per mile = ${t} minutes ÷ ${m} miles = <b>${per} minutes per mile</b>. ${n1} is correct. ${hard ? `${n2} divided the other way, and ${n3} got the right number but called it miles per minute.` : 'Dividing the other way gives miles per minute, and subtracting does not make a rate.'}</p>`,
      feedback: {
        correct: 'Correct. The unit you want "per 1" of (miles) is the one you divide by, and the label follows the same order.',
        wrong: (ans) => why(sh.options, ans) || 'Check both the division and the label. Minutes per mile = minutes ÷ miles.',
      },
    };
  });

  // ---------- Two unit prices (blanks) ----------
  G.define('r2_unitPriceTwo', (r, o) => {
    const hard = !!o.hard;
    const [s1, s2] = r.pickN(['Fresh Market', "Nature's Pantry", 'Summit Grocer', 'Trailhead Foods', 'Valley Co-op', 'Northside Market'], 2);
    const item = r.pick(['trail mix', 'granola', 'dried mango', 'almonds', 'oats']);
    let w1, w2, p1, p2, unit;
    if (hard) {
      // ounces, prices that do not divide evenly: round the unit price to the nearest cent
      unit = 'ounce';
      w1 = r.pick([12, 14, 18, 22]);
      w2 = r.pick([9, 15, 26, 30]);
      p1 = r.int(350, 899) / 100;
      p2 = r.int(350, 899) / 100;
      if (Math.abs(p1 / w1 - p2 / w2) < 0.02) p2 = round(p2 + 1.25, 2);
    } else {
      unit = 'pound';
      w1 = r.int(2, 5);
      w2 = r.pick([1.5, 2.5, 3.5]);
      const u1 = r.int(400, 800) / 100;
      let u2 = r.int(30, 80) / 10;
      if (Math.abs(u2 - u1) < 0.1) u2 += 0.5;
      p1 = round(u1 * w1, 2);
      p2 = round(u2 * w2, 2);
    }
    const a1 = round(p1 / w1, 2),
      a2 = round(p2 / w2, 2);
    return {
      type: 'blanks',
      skill: 'unit-price',
      lesson: '3-2',
      title: 'Find each unit price',
      prompt: `<p>${s1} sells a ${hl(w1 + '-' + unit)} bag of ${item} for ${hl(money(p1))}. ${s2} sells a ${hl(w2 + '-' + unit)} bag of ${item} for ${hl(money(p2))}.</p><p>What is the unit price at each store?${hard ? ' Round to the nearest cent.' : ''}</p>`,
      fields: [
        { label: `${s1}`, prefix: '$', suffix: 'per ' + unit, answer: a1, tolerance: 0.006 },
        { label: `${s2}`, prefix: '$', suffix: 'per ' + unit, answer: a2, tolerance: 0.006 },
      ],
      hints: [
        `A unit price is the cost for <b>1 ${unit}</b>. Divide the price by the number of ${unit}s.`,
        `${s1}: ${money(p1)} ÷ ${w1} ${unit}s. ${s2}: ${money(p2)} ÷ ${w2} ${unit}s.`,
        hard
          ? `${money(p1)} ÷ ${w1} = ${money(a1)} after rounding to the nearest cent. Now do the second store the same way: look at the thousandths digit to round.`
          : `${money(p1)} ÷ ${w1} = ${money(a1)}. Now do the second store the same way.`,
      ],
      hintEs: `El precio unitario es el costo de <b>1 ${unit === 'pound' ? 'libra' : 'onza'}</b>. Divide el precio entre el número de ${unit === 'pound' ? 'libras' : 'onzas'}.`,
      solution: `<p>${s1}: ${money(p1)} ÷ ${w1} = <b>${money(a1)} per ${unit}</b>.<br>${s2}: ${money(p2)} ÷ ${w2} = <b>${money(a2)} per ${unit}</b>.${hard ? '<br>Each quotient was rounded to the nearest cent (two decimal places).' : ''}</p>`,
      feedback: {
        correct: `Correct. Dividing each price by its size gives the cost of exactly 1 ${unit}.`,
        wrong(ans, d) {
          const i = d.wrong[0],
            v = RX.parseNum(ans[i]);
          const price = i === 0 ? p1 : p2,
            w = i === 0 ? w1 : w2,
            s = i === 0 ? s1 : s2,
            exact = price / w;
          if (v != null && Math.abs(v - w / price) < 0.01) return `For ${s}, you divided ${unit}s by dollars. A unit price is dollars per ${unit}, so divide ${money(price)} by ${w}.`;
          if (v != null && Math.abs(v - price * w) < 0.01) return `For ${s}, you multiplied. To find the cost of 1 ${unit}, divide ${money(price)} by ${w}.`;
          if (v != null && Math.abs(v - Math.floor(exact * 100) / 100) < 0.001 && Math.abs(v - round(exact, 2)) > 0.001)
            return `For ${s}, you cut off the extra digits instead of rounding. Look at the thousandths digit: 5 or more rounds the cents up.`;
          if (v != null && Math.abs(v - price) < 0.001) return `For ${s}, ${money(price)} is the price of the whole bag. Divide by ${w} to get the price of 1 ${unit}.`;
          return `Check ${s}: divide the price ${money(price)} by ${w} ${unit}s, and round to the nearest cent.`;
        },
      },
    };
  });

  // ---------- Better buy (MC) ----------
  G.define('r2_betterBuy', (r, o) => {
    const hard = !!o.hard;
    const stores = r.pickN(['Fresh Market', "Nature's Pantry", 'Summit Grocer', 'Trailhead Foods', 'Valley Co-op'], 3);
    const item = r.pick(['rice', 'coffee', 'pretzels', 'birdseed', 'peanuts']);
    if (hard) {
      // three stores; the cheapest bag is NOT the better buy
      const ub = r.int(200, 400) / 100;
      const us = [ub, round(ub + r.int(20, 60) / 100, 2), round(ub + r.int(70, 120) / 100, 2)];
      const ws = [r.pick([6, 7]), r.pick([3.5, 4]), r.pick([1.5, 2])];
      const ps = us.map((u, i) => round(u * ws[i], 2));
      const order = r.shuffle([0, 1, 2]); // display order of the stores
      const cheapest = ps.indexOf(Math.min(...ps)); // always the small bag (index 2), never the best buy
      const opts = [
        { html: `${stores[0]}, because its price for 1 pound is the lowest.`, ok: true },
        { html: `${stores[1]}, because its price for 1 pound is the lowest.`, why: `${stores[1]} costs ${money(us[1])} per pound. ${stores[0]} is lower at ${money(us[0])} per pound.` },
        { html: `${stores[2]}, because its price for 1 pound is the lowest.`, why: `${stores[2]} costs ${money(us[2])} per pound, the highest of the three.` },
        {
          html: `${stores[cheapest]}, because you pay the fewest dollars there.`,
          why: `${stores[cheapest]} has the cheapest bag (${money(ps[cheapest])}), but the bag is small. Compare the price for 1 pound, not the bag price.`,
        },
      ];
      const sh = shuffleOptions(r, opts, 0);
      const line = (i) => `${stores[i]}: ${hl(ws[i] + ' lb')} of ${item} for ${hl(money(ps[i]))}`;
      return {
        type: 'mc',
        skill: 'unit-price',
        lesson: '3-2',
        title: 'Which is the better buy?',
        prompt: `<p>${order.map(line).join('<br>')}</p><p>Based on unit prices, which store offers the better buy?</p>`,
        options: sh.options,
        answer: sh.answer,
        hints: [
          'Find the price for 1 pound at all three stores: price ÷ pounds. The cheapest bag is not always the better buy.',
          order.map((i) => `${stores[i]}: ${money(ps[i])} ÷ ${ws[i]}`).join('. ') + '.',
          'Round each unit price to the nearest cent, then choose the <b>lowest</b> cost per pound.',
        ],
        hintEs: 'Calcula el precio de 1 libra en las tres tiendas: precio ÷ libras. La bolsa más barata no siempre es la mejor compra.',
        solution: `<p>${order.map((i) => `${stores[i]}: ${money(ps[i])} ÷ ${ws[i]} = ${money(us[i])} per lb`).join('<br>')}</p><p><b>${stores[0]}</b> is the better buy because its unit price is the lowest, even though its bag costs the most.</p>`,
        feedback: {
          correct: `Correct. ${money(us[0])} per pound is the lowest unit price, so ${stores[0]} is the better buy even with the most expensive bag.`,
          wrong: (ans) => why(sh.options, ans) || 'Divide each price by its pounds and compare the unit prices.',
        },
      };
    }
    const [s1, s2] = stores;
    const w1 = r.int(2, 6),
      w2 = r.pick([1.5, 2.5, 3.5, 4.5]);
    const u1 = r.int(250, 700) / 100;
    let u2 = r.int(25, 70) / 10;
    if (Math.abs(u2 - u1) < 0.15) u2 = round(u1 + 0.4, 2);
    const p1 = round(u1 * w1, 2),
      p2 = round(u2 * w2, 2);
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
      type: 'mc',
      skill: 'unit-price',
      lesson: '3-2',
      title: 'Which is the better buy?',
      prompt: `<p>${s1}: ${hl(w1 + ' lb')} of ${item} for ${hl(money(p1))}<br>${s2}: ${hl(w2 + ' lb')} of ${item} for ${hl(money(p2))}</p><p>Based on unit prices, which store offers the better buy?</p>`,
      options: sh.options,
      answer: sh.answer,
      hints: [
        'Find the price for 1 pound at each store: price ÷ pounds.',
        `${s1}: ${money(p1)} ÷ ${w1} = ${money(u1)}. ${s2}: ${money(p2)} ÷ ${w2} = ${money(u2)}.`,
        'The better buy is the store with the <b>lower</b> cost per pound.',
      ],
      hintEs: 'Calcula el precio de 1 libra en cada tienda: precio ÷ libras. Ese es el precio unitario.',
      solution: `<p>${s1}: ${money(p1)} ÷ ${w1} = ${money(u1)} per lb. ${s2}: ${money(p2)} ÷ ${w2} = ${money(u2)} per lb. <b>${best === 0 ? s1 : s2}</b> is the better buy because its unit price is lower.</p>`,
      feedback: {
        correct: `Correct. ${money(Math.min(u1, u2))} per pound is lower than ${money(Math.max(u1, u2))}, so it is the better deal no matter the bag size.`,
        wrong: (ans) => why(sh.options, ans) || 'Divide each price by its pounds and compare the unit prices.',
      },
    };
  });

  // ---------- Double number line comparison (cloze) ----------
  G.define('r2_dnlCompare', (r, o) => {
    const hard = !!o.hard;
    const [A, B] = r.pickN(NAMES, 2);
    const ua = r.int(9, 16),
      hrs = hard ? r.int(6, 8) : r.int(3, 5),
      X = ua * hrs;
    const d = r.int(1, 4);
    const ub = r.chance(0.5) ? ua + d : ua - d;
    const who = ua > ub ? 0 : 1;
    // hard: B's line skips the 1-hour mark, so B's unit rate must be found by dividing too
    const step = hard ? r.pick([2, 3]) : 1;
    const ticks = [0, 1, 2, 3, 4, 5].map((i) => i * step);
    return {
      type: 'cloze',
      skill: 'dnl',
      lesson: '3-2',
      title: 'Compare with a double number line',
      prompt: `<p>${A} earns ${hl('$' + X)} in ${hl(hrs + ' hours')}. The double number line shows the amount ${B} earns.</p>${V.dnl({ label: 'Hours', values: ticks }, { label: 'Dollars', values: ticks.map((h) => h * ub) }, { aria: `${B} earns ${step * ub} dollars every ${step} hours` })}<p>Complete the sentence.</p>`,
      template: '{0} earns ${1} more per hour.',
      choices: [
        [A, B],
        ['1', '2', '3', '4'],
      ],
      answers: [who, d - 1],
      hints: hard
        ? [
            `Find each person's unit rate (dollars per 1 hour). ${B}'s line has no 1-hour mark, so divide a pair from the line.`,
            `${A}: $${X} ÷ ${hrs} hours. ${B}: $${step * ub} ÷ ${step} hours.`,
            `Compare the two unit rates and subtract the smaller from the larger.`,
          ]
        : [
            `Find each person's unit rate (dollars per 1 hour). On the double number line, look above/below the 1.`,
            `${A}: $${X} ÷ ${hrs} hours = $${ua} per hour. ${B}: the number lined up with 1 hour is $${ub}.`,
            `Compare $${ua} and $${ub}. Subtract the smaller rate from the larger one.`,
          ],
      hintEs: hard
        ? `Calcula la tasa unitaria de cada persona (dólares por 1 hora). La recta numérica doble de ${B} no muestra 1 hora, así que divide un par de valores de la recta.`
        : 'Calcula la tasa unitaria de cada persona (dólares por 1 hora). En la recta numérica doble, mira el valor que está alineado con el 1.',
      solution: `<p>${A}: $${X} ÷ ${hrs} = $${ua} per hour. ${B}: ${step > 1 ? `$${step * ub} ÷ ${step} = ` : 'the double number line shows '}$${ub} per hour. <b>${who === 0 ? A : B}</b> earns <b>$${d}</b> more per hour.</p>`,
      feedback: {
        correct: `Correct. Comparing unit rates ($${ua} and $${ub} per hour) makes the difference easy to see.`,
        wrong(ans, dd) {
          if (dd.wrong.includes(0)) {
            if (hard) return `Compare rates for the same time. $${X} is for ${hrs} hours and the line shows $${step * ub} for ${step} hours. Divide each to get dollars per 1 hour.`;
            return `Check who earns more per hour. ${A} earns $${ua} per hour; read ${B}'s rate from the 1-hour mark.`;
          }
          return `The person is right, but find the difference between the two unit rates: $${ua} and $${ub}.`;
        },
      },
    };
  });

  // ---------- Fill in a double number line ----------
  G.define('r2_dnlFill', (r, o) => {
    const hard = !!o.hard;
    const ctx = r.pick([
      { top: 'Hours', bot: 'Dollars', story: (n, v) => `A kayak rental costs $${v} for ${n} hours.`, pre: '$', es: 'hora' },
      { top: 'Hours', bot: 'Kilometers', story: (n, v) => `A hiker walks ${v} kilometers in ${n} hours.`, pre: '', es: 'hora' },
      { top: 'Minutes', bot: 'Liters', story: (n, v) => `A pump fills ${v} liters in ${n} minutes.`, pre: '', es: 'minuto' },
    ]);
    const one = ctx.top.toLowerCase().slice(0, -1);
    let rate, known, blanksAt;
    if (hard) {
      // the known pair is off the line and the unit rate is a half
      rate = r.int(6, 15) + 0.5;
      known = r.pick([6, 8]);
      blanksAt = [1, 2, 3, 4, 5];
    } else {
      rate = r.int(6, 15);
      known = r.pick([3, 4]);
      blanksAt = [1, 2, 3, 4, 5].filter((i) => i !== known).slice(0, 3);
    }
    const total = round(rate * known, 2);
    return {
      type: 'dnl',
      skill: 'dnl',
      lesson: '3-2',
      title: 'Complete the double number line',
      prompt: `<p>${ctx.story(known, total)} The rate stays the same.</p><p>Fill in the missing values on the double number line.${hard ? ' Some values may be decimals.' : ''}</p>`,
      top: { label: ctx.top, values: [0, 1, 2, 3, 4, 5] },
      bottom: { label: ctx.bot, values: [0, 1, 2, 3, 4, 5].map((i) => (blanksAt.includes(i) ? null : rate * i)) },
      blanks: blanksAt.map((i) => ({ row: 'bottom', i, answer: rate * i })),
      hints: [
        `Find the value for 1 ${one} first. You know ${known} ${ctx.top.toLowerCase()} = ${ctx.pre}${total}.`,
        `${total} ÷ ${known} = ${rate}. So each step along the line adds ${rate}.`,
        hard ? `Start at 1 → ${rate}. Keep adding ${rate} for each tick: 2, 3, 4, then 5.` : `1 → ${rate}. Keep adding ${rate} for each tick after that.`,
      ],
      hintEs: `Primero busca el valor para 1 ${ctx.es}. Sabes que ${known} ${ctx.es}s = ${ctx.pre}${total}. Divide para hallar la tasa unitaria.`,
      solution: `<p>Unit rate: ${total} ÷ ${known} = <b>${rate}</b> per 1 ${one}. Multiply: ${[1, 2, 3, 4, 5].map((i) => `${i} → ${round(rate * i, 2)}`).join(', ')}.</p>`,
      feedback: {
        correct: `Correct. Once you know the unit rate (${rate}), every tick is a multiple of it.`,
        wrong(ans) {
          const v = ans.map((x) => RX.parseNum(x));
          const firstIdx = blanksAt.indexOf(1);
          if (firstIdx >= 0 && v[firstIdx] != null && Math.abs(v[firstIdx] - total) < 0.001)
            return `${total} goes with ${known} ${ctx.top.toLowerCase()}, not with 1. Divide ${total} by ${known} to find the value for 1 ${one}.`;
          if (blanksAt.some((i, j) => v[j] != null && Math.abs(v[j] - total * i) < 0.001 && i > 1))
            return `You skip-counted by ${total}, the amount for ${known} ${ctx.top.toLowerCase()}. Each tick is 1 ${one}, so skip-count by the unit rate.`;
          if (hard && blanksAt.some((i, j) => v[j] != null && Math.abs(v[j] - Math.floor(rate) * i) < 0.001))
            return `You dropped the decimal. ${total} ÷ ${known} is not a whole number; keep the .5 in the unit rate.`;
          return `Start from the known pair: ${known} ↔ ${total}. Divide to find the value for 1, then multiply for the other ticks.`;
        },
      },
    };
  });
})(typeof window !== 'undefined' ? window : globalThis);

/* js/units/u3/gen-tables.js */
/* Zone 3 — River of Tables. Lesson 3-3 Equivalent Ratios Using Tables. */
(function (root) {
  'use strict';
  const RX = root.RX;
  const { G, V, shuffleOptions, NAMES } = RX;
  const hl = V.hl;
  const why = (opts, i) => (opts[i] && opts[i].why) || null;

  const CTX = [
    ['chocolate milk', 'white milk', 'people who prefer'],
    ['cups of flour', 'eggs', 'a recipe uses'],
    ['red paint', 'blue paint', 'a mix uses'],
    ['tents', 'campers', 'the trip plans'],
    ['laps', 'minutes', 'a swimmer does'],
    ['adult tickets', 'child tickets', 'a show sells'],
  ];
  const coprime = (r) =>
    r.pick([
      [4, 3],
      [2, 5],
      [3, 4],
      [5, 2],
      [2, 3],
      [3, 5],
      [5, 4],
      [4, 7],
      [3, 7],
    ]);

  /** Build a ratio-table question. cols: [{x, y, inX?:bool, inY?:bool}] */
  function tableQ(labels, cols, extra) {
    const inputs = [];
    const rows = [[''].concat(cols.map((c, i) => (c.inX ? `__IN:x${i}__` : String(c.x)))), [''].concat(cols.map((c, i) => (c.inY ? `__IN:y${i}__` : String(c.y))))];
    rows[0][0] = labels[0];
    rows[1][0] = labels[1];
    cols.forEach((c, i) => {
      if (c.inX) inputs.push({ id: 'x' + i, answer: c.x });
      if (c.inY) inputs.push({ id: 'y' + i, answer: c.y });
    });
    return Object.assign({ type: 'table', rows, inputs, rowHeader: true }, extra);
  }

  /** Diagnose one wrong cell of a ratio table whose columns are a : b scaled. */
  function diagCell(cols, id, raw, a, b) {
    const i = Number(id.slice(1)),
      col = cols[i],
      isTop = id[0] === 'x';
    const v = RX.parseNum(raw);
    const known = isTop ? col.y : col.x,
      base = isTop ? b : a,
      other = isTop ? a : b;
    const where = `Column ${i + 1}`;
    if (v == null) return `${where}: type a number. Find the factor ${known} ÷ ${base}, then multiply ${other} by it.`;
    if (v === known + (other - base))
      return `${where}: you kept the same difference between the two rows. Ratios grow by multiplying, not adding. Find the factor ${known} ÷ ${base}, then multiply ${other} by it.`;
    if (v === known * other) return `${where}: you multiplied ${known} by ${other}. First find the factor that takes ${base} to ${known}, then use that factor on ${other}.`;
    if (Math.abs(v - (known * base) / other) < 1e-9)
      return `${where}: you used the ratio upside down. The ${isTop ? 'top' : 'bottom'} row goes with ${other}, so multiply ${other} by ${known} ÷ ${base}.`;
    return `${where}: find the factor ${known} ÷ ${base}, then multiply ${other} by the same factor.`;
  }

  // ---------- Complete a ratio table ----------
  G.define('r3_complete', (r, o) => {
    const hard = !!o.hard;
    const [a, b] = coprime(r),
      [l1, l2] = r.pick(CTX);
    const ks = r.pickN(hard ? [3, 5, 7, 8, 9, 11, 12] : [2, 3, 4, 5, 6, 8, 10], 4).sort((x, y) => x - y);
    // hard: missing values alternate between rows, so every other column is worked backward
    const cols = ks.map((k, i) => ({ x: a * k, y: b * k, inY: !hard || i % 2 === 0, inX: hard && i % 2 === 1 }));
    return tableQ([l1, l2], cols, {
      skill: 'tables',
      lesson: '3-3',
      title: 'Complete the ratio table',
      prompt: hard
        ? `<p>For every ${hl(a + ' ' + l1)}, there are ${hl(b + ' ' + l2)}. Values are missing in <b>both</b> rows. Complete the table.</p>`
        : `<p>For every ${hl(a + ' ' + l1)}, there are ${hl(b + ' ' + l2)}. Complete the table.</p>`,
      hints: hard
        ? [
            `The ratio ${a} : ${b} is the pattern. In each column, use the number you know to find the factor, then multiply the other base number by it.`,
            `Column 2 gives the bottom: ${b * ks[1]} ÷ ${b} = ${ks[1]}. So the top is ${a} × ${ks[1]}.`,
            `For a missing bottom, divide the top by ${a}. For a missing top, divide the bottom by ${b}. Then multiply.`,
          ]
        : [
            `The ratio ${a} : ${b} is the pattern. Each column must be ${a} : ${b} multiplied by the same number.`,
            `First column: ${a} × ? = ${a * ks[0]}. The multiplier is ${ks[0]}, so the bottom is ${b} × ${ks[0]}.`,
            `Do the same for each column: find the multiplier (top ÷ ${a}), then multiply ${b} by it.`,
          ],
      hintEs: hard
        ? `La razón ${a} : ${b} es el patrón. En cada columna, usa el número que conoces para hallar el factor y multiplica el otro número de la razón por ese mismo factor.`
        : `La razón ${a} : ${b} es el patrón. Cada columna debe ser ${a} : ${b} multiplicada por el mismo número.`,
      solution: `<p>Each column uses the ratio ${a} : ${b}. ${cols
        .map((c, i) =>
          c.inX ? `${b * ks[i]} ÷ ${b} = ${ks[i]}, so the top is ${a} × ${ks[i]} = <b>${a * ks[i]}</b>` : `${a * ks[i]} ÷ ${a} = ${ks[i]}, so the bottom is ${b} × ${ks[i]} = <b>${b * ks[i]}</b>`,
        )
        .join('; ')}.</p>`,
      feedback: {
        correct: `Correct. Every column is ${a} : ${b} scaled by the same factor, so the ratios are equivalent.`,
        wrong: (ans, d) => diagCell(cols, d.wrong[0], ans[d.wrong[0]], a, b),
      },
    });
  });

  // ---------- Explain how you found a value (CR + check) ----------
  G.define('r3_explain', (r, o) => {
    const hard = !!o.hard;
    const [a, b] = coprime(r),
      [l1, l2] = r.pick(CTX);
    if (hard) {
      // bridge strategy: the given column is not the simplest form, and the target is not a whole-number multiple of it
      const g = r.pick([2, 3]);
      const k = r.pick([4, 5, 7, 8, 9].filter((x) => x % g !== 0));
      const A = a * g,
        B = b * g;
      const sh = shuffleOptions(
        r,
        [
          { html: `Divide ${A} and ${B} by ${g} to get ${a} : ${b}. Then multiply both by ${k}, so the missing value is ${b * k}.`, ok: true },
          {
            html: `Multiply ${B} by ${k}, because ${A} was multiplied by ${k} to get ${a * k}. The missing value is ${B * k}.`,
            why: `${A} × ${k} is ${A * k}, not ${a * k}. The factor from ${A} to ${a * k} is not a whole number, so build a bridge column first.`,
          },
          {
            html: `Add ${a * k - A} to ${B}, because ${A} + ${a * k - A} = ${a * k}. The missing value is ${B + a * k - A}.`,
            why: 'Ratios are multiplicative. Adding the same amount to both rows breaks the relationship.',
          },
          {
            html: `Multiply ${a * k} by ${b}, since ${b} is in the ratio. The missing value is ${a * k * b}.`,
            why: `That multiplies the wrong numbers. Find the factor that takes ${a} to ${a * k}, then apply it to ${b}.`,
          },
        ],
        0,
      );
      return {
        type: 'cr',
        skill: 'tables',
        lesson: '3-3',
        title: 'Explain your reasoning',
        prompt: `<p>The table shows equivalent ratios of ${hl(l1)} to ${hl(l2)}.</p>${V.table(
          [
            [l1, String(A), String(a * k)],
            [l2, String(B), '<b class="unknown">?</b>'],
          ],
          { header: false, rowHeader: true, cls: 'compact' },
        )}<p>${a * k} is not a whole-number multiple of ${A}. Explain how to find the missing value. Then choose the explanation that is mathematically correct.</p>`,
        starters: ['First, I made a bridge column by …', `I divided ${A} and ${B} by …`, 'Then I multiplied both numbers by …'],
        minWords: 12,
        check: { prompt: 'Which explanation is correct?', options: sh.options, answer: sh.answer },
        hints: [
          `Make a bridge column first: divide both ${A} and ${B} by the same number to get a simpler equivalent ratio.`,
          `${A} ÷ ${g} = ${a} and ${B} ÷ ${g} = ${b}. The bridge column is ${a} : ${b}.`,
          `${a} × ${k} = ${a * k}. Multiply ${b} by the same factor.`,
        ],
        hintEs: `Primero haz una columna puente: divide ${A} y ${B} entre el mismo número para obtener una razón equivalente más simple.`,
        solution: `<p>Model explanation: "${a * k} ÷ ${A} is not a whole number, so I made a bridge column. ${A} ÷ ${g} = ${a} and ${B} ÷ ${g} = ${b}. Then ${a} × ${k} = ${a * k}, so I multiply ${b} by ${k} too: ${b} × ${k} = <b>${b * k}</b>."</p>`,
        feedback: {
          correct: `Correct. The bridge column ${a} : ${b} turns a hard jump into two easy ones: ÷ ${g}, then × ${k}.`,
          wrong(ans, d) {
            if (!d.wroteEnough) return 'Write at least two full sentences. Name the bridge column and the factor you used.';
            return why(sh.options, ans.check) || 'Divide to a bridge column first, then multiply.';
          },
        },
      };
    }
    const k = r.int(4, 9);
    const sh = shuffleOptions(
      r,
      [
        { html: `Divide ${a * k} by ${a} to get ${k}, then multiply ${b} by ${k} to get ${b * k}.`, ok: true },
        {
          html: `Subtract ${Math.abs(a - b)} from ${a * k}, because ${b} is ${Math.abs(a - b)} ${a > b ? 'less' : 'more'} than ${a}.`,
          why: 'Ratios are multiplicative. Adding or subtracting a constant breaks the relationship.',
        },
        { html: `Add ${a * k - a} to ${b}, because ${a} + ${a * k - a} = ${a * k}.`, why: 'The top row was multiplied, not added to. The bottom row must be multiplied by the same factor.' },
        { html: `Multiply ${a * k} by ${b} to get ${a * k * b}.`, why: `That multiplies the wrong numbers. Find the factor that takes ${a} to ${a * k}, then apply it to ${b}.` },
      ],
      0,
    );
    return {
      type: 'cr',
      skill: 'tables',
      lesson: '3-3',
      title: 'Explain your reasoning',
      prompt: `<p>The table shows a ratio of ${hl(a + ' ' + l1)} to ${hl(b + ' ' + l2)}.</p>${V.table(
        [
          [l1, String(a), String(a * k)],
          [l2, String(b), '<b class="unknown">?</b>'],
        ],
        { header: false, rowHeader: true, cls: 'compact' },
      )}<p>Explain how to find the missing value. Then choose the explanation that is mathematically correct.</p>`,
      starters: ['First, I found the multiplier by …', `I know the ratio is ${a} : ${b}, so …`, 'Both numbers must be multiplied by …'],
      minWords: 10,
      check: { prompt: 'Which explanation is correct?', options: sh.options, answer: sh.answer },
      hints: [
        'Compare the two top numbers. What was the first multiplied by to get the second?',
        `${a} × ${k} = ${a * k}. The multiplier is ${k}.`,
        `Apply the same multiplier to the bottom: ${b} × ${k}.`,
      ],
      hintEs: 'Compara los dos números de arriba. ¿Por qué número se multiplicó el primero para obtener el segundo?',
      solution: `<p>Model explanation: "${a} was multiplied by ${k} to get ${a * k}. To keep the ratio equivalent, I multiply ${b} by the same number: ${b} × ${k} = <b>${b * k}</b>."</p>`,
      feedback: {
        correct: `Correct. Both rows are multiplied by the same factor (${k}), which is what keeps the ratios equivalent.`,
        wrong(ans, d) {
          if (!d.wroteEnough) return 'Write at least a full sentence or two. Use a sentence starter if you are stuck.';
          return why(sh.options, ans.check) || 'Think about multiplying, not adding.';
        },
      },
    };
  });

  // ---------- Two-way missing values ----------
  G.define('r3_twoWay', (r, o) => {
    const hard = !!o.hard;
    const [a, b] = coprime(r),
      [l1, l2] = r.pick(CTX);
    let cols,
      g = 1;
    if (hard) {
      // the only complete column is NOT the simplest form; other columns are not whole-number multiples of it
      g = r.pick([2, 3]);
      const ks = r.pickN(
        [1, 4, 5, 7, 8, 10].filter((k) => k % g !== 0),
        3,
      );
      const all = ks.concat([g]).sort((x, y) => x - y);
      const roles = r.shuffle(['inX', 'inY', 'inX']);
      let ri = 0;
      cols = all.map((k) => (k === g ? { x: a * k, y: b * k } : Object.assign({ x: a * k, y: b * k }, { [roles[ri++]]: true })));
    } else {
      const [k1, k2, k3] = r.pickN([2, 3, 4, 5, 6, 7, 8], 3).sort((x, y) => x - y);
      cols = [
        { x: a, y: b },
        { x: a * k1, y: b * k1, inX: true },
        { x: a * k2, y: b * k2, inY: true },
        { x: a * k3, y: b * k3, inX: true },
      ];
    }
    const full = cols.findIndex((c) => !c.inX && !c.inY);
    return tableQ([l1, l2], cols, {
      skill: 'tables',
      lesson: '3-3',
      title: 'Fill the table both ways',
      prompt: hard
        ? `<p>The table shows equivalent ratios of ${hl(l1)} to ${hl(l2)}. Only one column is complete, and it is not in simplest form. Complete the table.</p>`
        : `<p>The table shows equivalent ratios of ${hl(l1)} to ${hl(l2)}. Some values are missing in <b>both</b> rows. Complete the table.</p>`,
      hints: hard
        ? [
            `Simplify the complete column, ${a * g} : ${b * g}, to make a bridge. Then use that simplest ratio to fill every other column.`,
            `${a * g} ÷ ${g} = ${a} and ${b * g} ÷ ${g} = ${b}, so the ratio is ${a} : ${b}.`,
            `For a missing top, divide the bottom by ${b} to get the factor, then multiply ${a} by it. For a missing bottom, divide the top by ${a}.`,
          ]
        : [
            `The first column gives the base ratio ${a} : ${b}. Use whichever number is given in a column to find its multiplier.`,
            `Column 2: ${cols[1].y} ÷ ${b} = ${cols[1].y / b}, so the top is ${a} × ${cols[1].y / b}. Column 3: ${cols[2].x} ÷ ${a} = ${cols[2].x / a}.`,
            `Column 4: ${cols[3].y} ÷ ${b} = ${cols[3].y / b}, so multiply ${a} by that factor.`,
          ],
      hintEs: hard
        ? `Simplifica la columna completa, ${a * g} : ${b * g}, para hacer una columna puente. Luego usa esa razón más simple para completar las otras columnas.`
        : `La primera columna da la razón base ${a} : ${b}. En cada columna, usa el número que conoces para hallar el factor.`,
      solution: `<p>${hard ? `The complete column ${a * g} : ${b * g} simplifies to ${a} : ${b} (÷ ${g}). ` : `The base ratio is ${a} : ${b}. `}${cols
        .map((c, i) =>
          c.inX
            ? `Column ${i + 1}: ${c.y} ÷ ${b} = ${c.y / b}, top = ${a} × ${c.y / b} = <b>${c.x}</b>`
            : c.inY
              ? `Column ${i + 1}: ${c.x} ÷ ${a} = ${c.x / a}, bottom = ${b} × ${c.x / a} = <b>${c.y}</b>`
              : null,
        )
        .filter(Boolean)
        .join('. ')}.</p>`,
      feedback: {
        correct: hard
          ? 'Correct. Simplifying the complete column gave a bridge, and every other column scales from it.'
          : 'Correct. Whichever row is given, divide by the base ratio to find the multiplier, then apply it to the other row.',
        wrong(ans, d) {
          const id = d.wrong[0],
            v = RX.parseNum(ans[id]),
            c = cols[Number(id.slice(1))],
            isTop = id[0] === 'x';
          if (hard && v != null) {
            const known = isTop ? c.y : c.x,
              fullKnown = isTop ? cols[full].y : cols[full].x,
              fullOther = isTop ? cols[full].x : cols[full].y;
            if (Math.abs(v - Math.round((known / fullKnown) * fullOther)) < 1e-9 && Math.abs(v - (isTop ? c.x : c.y)) > 1e-9)
              return `Column ${Number(id.slice(1)) + 1}: it looks like you rounded a factor that is not a whole number. Simplify ${a * g} : ${b * g} to ${a} : ${b} first, then use whole-number factors.`;
          }
          return diagCell(cols, id, ans[id], a, b);
        },
      },
    });
  });

  // ---------- Table error analysis ----------
  G.define('r3_tableError', (r, o) => {
    const hard = !!o.hard;
    const name = r.pick(NAMES),
      [a, b] = r.pick([
        [2, 5],
        [3, 4],
        [1, 3],
        [2, 3],
        [3, 5],
      ]);
    const step = r.int(2, 3);
    let cols, opts, fixK, hints, hintEs, solution;
    if (hard) {
      // the first step is right (× 2); only the last column switches to adding
      cols = [
        [a, b],
        [2 * a, 2 * b],
        [2 * a + step, 2 * b + step],
      ];
      opts = [
        { html: `Column 2 is correct (both numbers × 2), but column 3 adds ${step} to both numbers of column 2. Adding breaks the ratio.`, ok: true },
        {
          html: `Column 2 is the mistake, because doubling both numbers of ${a} : ${b} changes the ratio between them.`,
          why: `Doubling both numbers is multiplying both by 2, which keeps the ratio. ${2 * a} : ${2 * b} simplifies to ${a} : ${b}.`,
        },
        {
          html: 'Every column is correct, because both rows grow from left to right each time the table moves on.',
          why: `Growing is not enough. ${2 * a + step} : ${2 * b + step} does not simplify to ${a} : ${b}.`,
        },
        {
          html: `Column 3 is the mistake, but ${name} should have added ${step} only to the bottom number of column 2.`,
          why: 'Adding to one row still breaks the ratio. The fix is to multiply both numbers by the same factor.',
        },
      ];
      fixK = r.pick([3, 5, 6]);
      hints = [
        'Test every column, not just the first two. Simplify each one and compare it with the given ratio.',
        `Column 2: ${2 * a} : ${2 * b} ÷ 2 = ${a} : ${b}. Column 3: does ${2 * a + step} : ${2 * b + step} simplify to ${a} : ${b}?`,
        `For the fix: ${a * fixK} ÷ ${a} = ${fixK}, so multiply ${b} by ${fixK}.`,
      ];
      hintEs = 'Revisa todas las columnas, no solo las dos primeras. Simplifica cada una y compárala con la razón dada.';
      solution = `<p>Column 2 doubles both numbers, so it is equivalent. Column 3 adds ${step} to both numbers of column 2, so ${2 * a + step} : ${2 * b + step} is not equivalent to ${a} : ${b}. A correct column with ${a * fixK} on top uses the factor ${fixK}: bottom = ${b} × ${fixK} = <b>${b * fixK}</b>.</p>`;
    } else {
      cols = [
        [a, b],
        [a + step, b + step],
        [a + 2 * step, b + 2 * step],
      ];
      opts = [
        { html: `${name} added ${step} to both numbers each time. Equivalent ratios come from <b>multiplying</b> both numbers by the same factor.`, ok: true },
        { html: `${name} multiplied only the top row.`, why: `Look again: each number grew by ${step}, so ${name} was adding, not multiplying.` },
        { html: `${name} should have added ${step} only to the bottom row.`, why: 'Adding to one row alone still breaks the ratio. Adding is not the right operation here.' },
        { html: `The first column ${a} : ${b} is already wrong.`, why: `${a} : ${b} is the given ratio and is fine. The mistake is in how the next columns were made.` },
      ];
      fixK = a * 2 === a + step ? 3 : 2;
      hints = [
        `Check: does ${a + step} : ${b + step} simplify to ${a} : ${b}? Try dividing.`,
        'Compare how each column was made. Was the same number added, or were both numbers multiplied?',
        `To make an equivalent ratio with ${a * fixK} on top: ${a * fixK} ÷ ${a} = ${fixK}, so multiply ${b} by ${fixK}.`,
      ];
      hintEs = `Comprueba: ¿${a + step} : ${b + step} se simplifica a ${a} : ${b}? Intenta dividir.`;
      solution = `<p>${name} added ${step} each time, so the pairs are not equivalent (${a + step}/${b + step} does not equal ${a}/${b}). A correct column with ${a * fixK} on top uses the multiplier ${fixK}: bottom = ${b} × ${fixK} = <b>${b * fixK}</b>.</p>`;
    }
    const fixX = a * fixK;
    const sh = shuffleOptions(r, opts, 0);
    return {
      type: 'error',
      skill: 'tables',
      lesson: '3-3',
      title: 'Find the mistake in the table',
      prompt: `<p>${name} was asked to make a ratio table equivalent to ${hl(a + ' : ' + b)}. Here is the table:</p>${V.table(
        [
          ['Top', ...cols.map((c) => String(c[0]))],
          ['Bottom', ...cols.map((c) => String(c[1]))],
        ],
        { header: false, rowHeader: true, cls: 'compact' },
      )}<p>Which statement describes the mistake?</p>`,
      options: sh.options,
      answer: sh.answer,
      fix: { label: `If the top is ${fixX}, the bottom should be `, answer: b * fixK },
      hints,
      hintEs,
      solution,
      feedback: {
        correct: hard
          ? 'Correct. A table can start right and go wrong later, so test every column.'
          : 'Correct. Adding the same amount to both parts is the most common ratio mistake. Multiplying both parts by the same factor is what keeps ratios equivalent.',
        wrong(ans, d) {
          if (!d.mistakeOk) return why(sh.options, ans.mistake) || 'Look at how each number changed from column to column.';
          const f = RX.parseNum(ans.fix);
          if (f === b + (fixX - a)) return `Mistake found, but your fix adds ${fixX - a} to ${b}, the same error. ${fixX} ÷ ${a} = ${fixK}, so multiply ${b} by ${fixK}.`;
          return `Mistake found. For the fix: ${fixX} ÷ ${a} = ${fixK}, so multiply ${b} by ${fixK}.`;
        },
      },
    };
  });

  // ---------- Which table shows equivalent ratios? (rep) ----------
  G.define('r3_whichTable', (r, o) => {
    const hard = !!o.hard;
    const [a, b] = coprime(r),
      [l1, l2] = r.pick(CTX);
    const mk = (pairs) =>
      V.table(
        [
          [l1, ...pairs.map((p) => String(p[0]))],
          [l2, ...pairs.map((p) => String(p[1]))],
        ],
        { header: false, rowHeader: true, cls: 'mini' },
      );
    let opts, good;
    if (hard) {
      const ks = [2, 3, 5, 8];
      good = ks.map((k) => [a * k, b * k]);
      const rev = ks.map((k) => [b * k, a * k]);
      const add = ks.map((k) => [a * k, 2 * b + (k - 2) * a]);
      const off = ks.map((k) => (k === 5 ? [a * 5, b * 6] : [a * k, b * k]));
      opts = [
        { html: mk(good), ok: true },
        { html: mk(rev), why: `This table shows ${b} ${l1} for every ${a} ${l2}. The rows are switched, so the ratio is reversed.` },
        { html: mk(add), why: `The ${l1} row is multiplied, but the ${l2} row adds the same amounts as the top row after the first column. Adding breaks the ratio.` },
        { html: mk(off), why: `Look at the column ${a * 5} : ${b * 6}. The top was multiplied by 5 but the bottom by 6, so that column does not simplify to ${a} : ${b}.` },
      ];
    } else {
      const ks = [2, 3, 4];
      good = [[a, b], ...ks.map((k) => [a * k, b * k])];
      const rev = [[b, a], ...ks.map((k) => [b * k, a * k])];
      const add = [[a, b], ...ks.map((k) => [a + k, b + k])];
      const oneRow = [[a, b], ...ks.map((k) => [a * k, b])];
      opts = [
        { html: mk(good), ok: true },
        { html: mk(rev), why: `This table shows ${b} ${l1} for every ${a} ${l2}. The rows are switched, so the ratio is reversed.` },
        { html: mk(add), why: 'In this table the same number was added to both rows. Adding does not keep ratios equivalent.' },
        { html: mk(oneRow), why: `Only the ${l1} row changes while ${l2} stays ${b}. Both quantities must be multiplied by the same factor.` },
      ];
    }
    const sh = shuffleOptions(r, opts, 0);
    return {
      type: 'rep',
      skill: 'tables',
      lesson: '3-3',
      title: 'Choose the correct table',
      prompt: hard
        ? `<p>Which table shows only ratios equivalent to ${hl(a + ' ' + l1)} to ${hl(b + ' ' + l2)}? Every column must work.</p>`
        : `<p>Which table shows ratios equivalent to ${hl(a + ' ' + l1)} to ${hl(b + ' ' + l2)}?</p>`,
      options: sh.options,
      answer: sh.answer,
      layout: 'cards',
      hints: hard
        ? [
            `Check every column of each table, not just the first one. Each column must simplify to ${a} : ${b}, with ${l1} on top.`,
            `Divide the top of each column by ${a} and the bottom by ${b}. Both answers must match in every column.`,
            `One table has a column where the top factor and bottom factor differ. Another table switches the rows. Rule those out.`,
          ]
        : [
            'In an equivalent-ratio table, every column simplifies to the same ratio.',
            `Check the second column of each table. Does it simplify to ${a} : ${b}, with ${l1} on top?`,
            `Only one table multiplies both ${a} and ${b} by 2, then 3, then 4, and keeps ${l1} in the top row.`,
          ],
      hintEs: hard
        ? `Revisa cada columna de cada tabla, no solo la primera. Cada columna debe simplificarse a ${a} : ${b}, con ${l1} arriba.`
        : 'En una tabla de razones equivalentes, cada columna se simplifica a la misma razón.',
      solution: `<p>The correct table has columns ${good.map((p) => p.join(' : ')).join(', ')}. Each is ${a} : ${b} multiplied by the same factor in both rows, with ${l1} on top. ${hard ? 'The other tables switch the rows, add instead of multiply in one row, or use different factors in one column.' : 'The other tables switch the rows, add a constant, or change only one row.'}</p>`,
      feedback: {
        correct: 'Correct. Every column in an equivalent-ratio table simplifies to the same ratio, in the same order.',
        wrong: (ans) => why(sh.options, ans) || `Test each column: divide the top by ${a} and the bottom by ${b}.`,
      },
    };
  });

  // ---------- Table word problem (num) ----------
  G.define('r3_wordProblem', (r, o) => {
    const hard = !!o.hard;
    const [a, b] = r.pick([
      [2, 3],
      [3, 4],
      [1, 2],
      [3, 2],
      [2, 5],
      [4, 3],
    ]);
    const ctx = r.pick([
      ['cups of flour', 'eggs', 'a recipe uses'],
      ['cups of water', 'scoops of mix', 'the directions call for'],
      ['liters of blue paint', 'liters of yellow paint', 'the formula mixes'],
    ]);
    const cap = ctx[2].charAt(0).toUpperCase() + ctx[2].slice(1);
    if (hard) {
      // bridge: the given column is a scaled copy; the target is not a whole-number multiple of it
      const g = r.pick([2, 3]);
      const k = r.pick([5, 7, 8, 10, 11].filter((x) => x % g !== 0));
      const A = a * g,
        B = b * g;
      return {
        type: 'num',
        skill: 'tables',
        lesson: '3-3',
        title: 'Use the table to solve',
        prompt: `<p>${cap} the amounts in the table, always in the same ratio.</p>${V.table(
          [
            [ctx[0], String(A), '?'],
            [ctx[1], String(B), String(b * k)],
          ],
          { header: false, rowHeader: true, cls: 'compact' },
        )}<p>How many ${ctx[0]} are needed for ${hl(b * k + ' ' + ctx[1])}?</p>`,
        unit: ctx[0],
        answer: a * k,
        hints: [
          `${b * k} is not a whole-number multiple of ${B}. Make a bridge column: divide both ${A} and ${B} by the same number.`,
          `${A} ÷ ${g} = ${a} and ${B} ÷ ${g} = ${b}. Now ${b * k} ÷ ${b} = ${k}.`,
          `Multiply ${a} by ${k}.`,
        ],
        hintEs: `${b * k} no es un múltiplo entero de ${B}. Haz una columna puente: divide ${A} y ${B} entre el mismo número.`,
        solution: `<p>Bridge column: ${A} ÷ ${g} = ${a} and ${B} ÷ ${g} = ${b}, so the ratio is ${a} : ${b}. Then ${b * k} ÷ ${b} = ${k}, so the ${ctx[0]} are ${a} × ${k} = <b>${a * k}</b>.</p>${V.table(
          [
            [ctx[0], String(A), String(a), String(a * k)],
            [ctx[1], String(B), String(b), String(b * k)],
          ],
          { header: false, rowHeader: true, cls: 'compact' },
        )}`,
        feedback: {
          correct: `Correct. ÷ ${g} to the bridge ${a} : ${b}, then × ${k} gives ${a * k}.`,
          wrong(ans, d) {
            const v = d.value;
            if (v === b * k + (A - B))
              return `You kept the same difference between the rows (${A} and ${B} differ by ${Math.abs(A - B)}). Ratios scale by multiplying. Build the bridge column ${a} : ${b} first.`;
            if (v === A * k) return `You multiplied ${A} by ${k}, but ${B} × ${k} is ${B * k}, not ${b * k}. Simplify to ${a} : ${b} first, then multiply by ${k}.`;
            if (v != null && v === Math.round((b * k) / B) * A) return `You rounded the factor ${b * k} ÷ ${B} to a whole number. It is not a whole number, so use the bridge column ${a} : ${b}.`;
            return `Divide ${A} and ${B} by ${g} to get a bridge column, then find the factor from ${b} to ${b * k}.`;
          },
        },
      };
    }
    const k = r.int(5, 12),
      k1 = r.int(2, 4);
    return {
      type: 'num',
      skill: 'tables',
      lesson: '3-3',
      title: 'Use the table to solve',
      prompt: `<p>${cap} ${hl(a + ' ' + ctx[0])} for every ${hl(b + ' ' + ctx[1])}.</p>${V.table(
        [
          [ctx[0], String(a), String(a * k1), '?'],
          [ctx[1], String(b), String(b * k1), String(b * k)],
        ],
        { header: false, rowHeader: true, cls: 'compact' },
      )}<p>How many ${ctx[0]} are needed for ${hl(b * k + ' ' + ctx[1])}?</p>`,
      unit: ctx[0],
      answer: a * k,
      hints: [`Which column has ${b * k} ${ctx[1]}? Find what ${b} was multiplied by to get there.`, `${b * k} ÷ ${b} = ${k}. The multiplier is ${k}.`, `Multiply ${a} by ${k}.`],
      hintEs: `¿Qué columna tiene ${b * k} ${ctx[1]}? Busca por qué número se multiplicó ${b} para llegar ahí.`,
      solution: `<p>${b * k} ÷ ${b} = ${k}, so multiply the ${ctx[0]} by ${k} too: ${a} × ${k} = <b>${a * k}</b>.</p>`,
      feedback: {
        correct: `Correct. ${b * k} is ${b} × ${k}, so the matching amount is ${a} × ${k} = ${a * k}.`,
        wrong(ans, d) {
          if (d.value === b * k + (a - b)) return 'Adding the difference between the two rows does not keep the ratio. Find the multiplier instead.';
          if (d.value === a * k1 * k) return `You multiplied the second column (${a * k1}) by ${k}. The factor ${k} takes ${b} to ${b * k}, so apply it to the first column, ${a}.`;
          if (d.value === b * k * a) return `You multiplied ${b * k} by ${a}. First find the factor: ${b * k} ÷ ${b}.`;
          return `Find the multiplier: ${b * k} ÷ ${b}. Then multiply ${a} by it.`;
        },
      },
    };
  });

  // ---------- Find the unit value first, then complete ----------
  G.define('r3_unitFirst', (r, o) => {
    const hard = !!o.hard;
    // hard: the unit rate is a decimal (x.5)
    const unit = hard ? r.int(2, 9) + 0.5 : r.int(2, 9);
    const n = hard ? r.pick([2, 4, 6]) : r.int(3, 6);
    const ctx = hard
      ? r.pick([
          ['Tickets', 'Cost ($)', 'The table shows the cost of tickets'],
          ['Pounds', 'Cost ($)', 'The table shows the price of apples by the pound'],
          ['Hours', 'Miles', 'The table shows a steady walking pace'],
        ])
      : r.pick([
          ['Tickets', 'Cost ($)', 'The table shows the cost of tickets'],
          ['Boxes', 'Granola bars', 'The table shows how many bars come in boxes'],
          ['Hours', 'Miles', 'The table shows a steady walking pace'],
        ]);
    const [t1, t2] = r.pickN(
      (hard ? [3, 5, 7, 9, 11] : [7, 8, 9, 10, 12]).filter((x) => x !== n),
      2,
    );
    const cols = [
      { x: 1, y: unit, inY: true },
      { x: n, y: unit * n },
      { x: t1, y: unit * t1, inY: true },
      { x: t2, y: unit * t2, inY: true },
    ];
    return tableQ(ctx, cols, {
      skill: 'tables',
      lesson: '3-3',
      title: 'Find the value for 1 first',
      prompt: hard ? `<p>${ctx[2]}. The value for 1 is not a whole number. Complete the table.</p>` : `<p>${ctx[2]}. Complete the table.</p>`,
      hints: [
        `You know ${n} → ${unit * n}. Find the value for 1 by dividing: ${unit * n} ÷ ${n}.`,
        hard ? `The value for 1 is ${unit}. That is the unit rate. Keep the decimal.` : `The value for 1 is ${unit}. That is the unit rate.`,
        `Multiply the unit rate by each number: ${t1} × ${unit} and ${t2} × ${unit}.`,
      ],
      hintEs: hard
        ? `Sabes que ${n} → ${unit * n}. Halla el valor para 1 dividiendo: ${unit * n} ÷ ${n}. La respuesta puede ser un decimal.`
        : `Sabes que ${n} → ${unit * n}. Halla el valor para 1 dividiendo: ${unit * n} ÷ ${n}.`,
      solution: `<p>${unit * n} ÷ ${n} = <b>${unit}</b> for 1 (the unit rate). Then ${t1} × ${unit} = <b>${unit * t1}</b> and ${t2} × ${unit} = <b>${unit * t2}</b>. Every column is the unit rate times the top number.</p>`,
      feedback: {
        correct: `Correct. Finding the value for 1 (${unit}) unlocks every other column.`,
        wrong(ans, d) {
          const id = d.wrong[0],
            v = RX.parseNum(ans[id]);
          if (id === 'y0') {
            if (v != null && Math.abs(v - n / (unit * n)) < 0.01) return `You divided ${n} by ${unit * n}. The value for 1 is the bottom number ÷ the top number: ${unit * n} ÷ ${n}.`;
            if (hard && v === Math.floor(unit)) return `${unit * n} ÷ ${n} does not come out even. Keep the decimal part of the unit rate.`;
            return `Find the value for 1 first: divide ${unit * n} by ${n}.`;
          }
          const t = cols[Number(id.slice(1))].x;
          if (v === unit * n + (t - n)) return `For ${t}, you added ${t - n} to ${unit * n}. Multiply the unit rate by ${t} instead.`;
          if (hard && v === Math.floor(unit) * t) return `For ${t}, you used a whole-number unit rate. Keep the decimal: multiply ${t} by the exact value for 1.`;
          return `For ${t}, multiply the unit rate (the value for 1) by ${t}.`;
        },
      },
    });
  });

  // ---------- True/false with justification ----------
  G.define('r3_tf', (r, o) => {
    const hard = !!o.hard;
    const [a, b] = coprime(r),
      [l1, l2] = r.pick(CTX);
    const truthy = r.chance(0.5);
    let pairs, bad;
    if (hard) {
      // no base column; the broken column uses factors 8 and 7
      pairs = truthy
        ? [3, 5, 8, 12].map((k) => [a * k, b * k])
        : [
            [a * 3, b * 3],
            [a * 5, b * 5],
            [a * 8, b * 7],
            [a * 12, b * 12],
          ];
      bad = '8 but the bottom ÷ ' + b + ' = 7';
    } else {
      pairs = truthy
        ? [[a, b], ...[2, 3, 5].map((k) => [a * k, b * k])]
        : [
            [a, b],
            [a * 2, b * 2],
            [a * 3 + 1, b * 3],
            [a * 5, b * 5],
          ];
      bad = '';
    }
    const c3 = pairs[2];
    const reasons = r.shuffle(
      hard
        ? [
            { html: `Yes. Every column simplifies to ${a} : ${b}.`, correct: truthy },
            { html: `No. The column ${c3[0]} : ${c3[1]} does not simplify to ${a} : ${b}.`, correct: !truthy },
            { html: 'Yes. The first two columns are equivalent, so the rest must be too.', correct: false },
            { html: `No. The table never shows ${a} : ${b} itself.`, correct: false },
          ]
        : [
            { html: `Yes. Every column simplifies to ${a} : ${b}.`, correct: truthy },
            { html: `No. The column ${c3[0]} : ${c3[1]} does not simplify to ${a} : ${b}.`, correct: !truthy },
            { html: 'Yes. The numbers get bigger in each column.', correct: false },
            { html: 'No. Not all of the numbers are even.', correct: false },
          ],
    );
    return {
      type: 'tf',
      skill: 'tables',
      lesson: '3-3',
      title: 'Equivalent or not?',
      prompt: `<p>Does this table show <b>equivalent ratios</b>?${hard ? ' Check every column.' : ''}</p>${V.table(
        [
          [l1, ...pairs.map((p) => String(p[0]))],
          [l2, ...pairs.map((p) => String(p[1]))],
        ],
        { header: false, rowHeader: true, cls: 'compact' },
      )}`,
      statement: 'The table shows equivalent ratios.',
      answer: truthy,
      reasons,
      labels: ['True', 'False'],
      hints: hard
        ? [
            'Simplify every column. The table does not show the simplest form, so find it from the first column.',
            `Column 1: ${pairs[0][0]} : ${pairs[0][1]} simplifies to ${a} : ${b}. Now test column 3 (${c3[0]} : ${c3[1]}): divide the top by ${a} and the bottom by ${b}.`,
            truthy ? `Every column is ${a} : ${b} times one factor in both rows, so they are all equivalent.` : `In column 3 the two factors do not match, so that pair breaks the pattern.`,
          ]
        : [
            'Check each column: divide both numbers by their greatest common factor.',
            `Column 1 is ${a} : ${b}. Does column 3 (${c3[0]} : ${c3[1]}) simplify to the same ratio?`,
            truthy
              ? `Every column is ${a} : ${b} times the same factor, so they are all equivalent.`
              : `${c3[0]} : ${c3[1]} is not ${a} : ${b} scaled by one factor, so the table is not all equivalent.`,
          ],
      hintEs: hard
        ? 'Simplifica cada columna. La tabla no muestra la forma más simple, así que hállala con la primera columna.'
        : 'Revisa cada columna: divide los dos números entre su máximo común divisor.',
      solution: truthy
        ? `<p><b>True.</b> Each column is ${a} : ${b} multiplied by the same factor in both rows (${pairs.map((p) => p[0] / a).join(', ')}).</p>`
        : hard
          ? `<p><b>False.</b> Column 3 is ${c3[0]} : ${c3[1]}. The top ÷ ${a} = ${bad}, so the factors do not match and that pair is not equivalent to ${a} : ${b}.</p>`
          : `<p><b>False.</b> Column 3 is ${c3[0]} : ${c3[1]}. ${c3[1]} ÷ ${b} = 3 but ${c3[0]} ÷ ${a} is not 3, so that pair breaks the pattern.</p>`,
      feedback: {
        correct: 'Correct, with a correct reason. Simplifying every column is the real test of equivalence.',
        wrong(ans, d) {
          if (!d.valueOk)
            return truthy
              ? `Test each column: divide the top by ${a} and the bottom by ${b}. If the two factors match in every column, the ratios are equivalent.`
              : `Test column 3: divide ${c3[0]} by ${a} and ${c3[1]} by ${b}. Do the two factors match?`;
          const rs = reasons[ans.reason];
          if (rs && /first two/.test(rs.html)) return 'Your true/false answer is right, but two good columns do not prove the rest. Pick the reason that checks every column.';
          return 'Your true/false answer is right, but choose the reason that talks about simplifying the columns.';
        },
      },
    };
  });
})(typeof window !== 'undefined' ? window : globalThis);

/* js/units/u3/gen-graphs.js */
/* Zone 4 — Signal Observatory. Lesson 3-4 Equivalent Ratios Using Graphs. */
(function (root) {
  'use strict';
  const RX = root.RX;
  const { G, V, shuffleOptions, NAMES, round } = RX;
  const hl = V.hl;
  const why = (opts, i) => (opts[i] && opts[i].why) || null;
  const GC = [
    {
      x: 'Number of Pages',
      y: 'Number of Stickers',
      one: 'page',
      many: 'pages',
      thing: 'stickers',
      es: 'calcomanías',
      esMany: 'páginas',
      story: (n, k) => `${n} puts ${k} stickers on each page of a scrapbook.`,
    },
    { x: 'Number of Days', y: 'Number of Laps', one: 'day', many: 'days', thing: 'laps', es: 'vueltas', esMany: 'días', story: (n, k) => `${n} swims ${k} laps every day.` },
    {
      x: 'Number of Packs',
      y: 'Number of Cards',
      one: 'pack',
      many: 'packs',
      thing: 'cards',
      es: 'tarjetas',
      esMany: 'paquetes',
      story: (n, k) => `${n} buys packs that each hold ${k} trading cards.`,
    },
    { x: 'Number of Hours', y: 'Miles Hiked', one: 'hour', many: 'hours', thing: 'miles', es: 'millas', esMany: 'horas', story: (n, k) => `${n} hikes ${k} miles every hour.` },
  ];
  const grid = (k, maxX) => {
    const yMax = Math.max(10, Math.ceil((k * maxX) / 2) * 2 + 2);
    return { xMax: maxX + 1, yMax, yStep: yMax > 14 ? 2 : 1, xStep: 1 };
  };
  const pairs = (pts) => pts.map((p) => `(${p[0]}, ${p[1]})`).join(', ');
  const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
  // non-unit ratio b : a (b things for every a units), with a = 2 or 3 and b not a multiple of a
  const nonUnit = (r) => {
    const a = r.pick([2, 3]);
    const b = r.pick(a === 2 ? [3, 5, 7] : [4, 5, 7]);
    return [a, b];
  };

  // ---------- Plot the points ----------
  G.define('r4_plot', (r, o) => {
    const hard = !!o.hard;
    const c = r.pick(GC),
      name = r.pick(NAMES);
    if (hard) {
      const [a, b] = nonUnit(r);
      const points = [1, 2, 3].map((m) => [a * m, b * m]);
      const yMax = Math.ceil((3 * b + 1) / 2) * 2,
        xMax = 3 * a + 1;
      return {
        type: 'plot',
        skill: 'graphs',
        lesson: '3-4',
        title: 'Plot the points',
        prompt: `<p>${name} records ${hl(b + ' ' + c.thing)} for every ${hl(a + ' ' + c.many)}. The ratio stays the same.</p><p>Plot the points that show the number of ${c.thing} for ${hl(`${a}, ${2 * a}, and ${3 * a} ${c.many}`)}.</p><p class="muted">Click a grid point to place or remove a point.</p>`,
        xLabel: c.x,
        yLabel: c.y,
        xMax,
        yMax,
        xStep: 1,
        yStep: 2,
        points,
        count: 3,
        hints: [
          `Each point is (${c.many}, ${c.thing}). The ratio gives you the first point: ${a} ${c.many} with ${b} ${c.thing}.`,
          `To get ${2 * a} ${c.many}, multiply both parts of ${a} : ${b} by 2. To get ${3 * a}, multiply both by 3.`,
          `Plot (${a}, ${b}) first. The other two points are (${2 * a}, 2 × ${b}) and (${3 * a}, 3 × ${b}). The gridlines on the vertical axis count by 2s, so odd values sit between labelled lines.`,
        ],
        hintEs: `Cada punto es (${c.esMany}, ${c.es}). La razón te da el primer par ordenado: ${a} ${c.esMany} con ${b} ${c.es}.`,
        solution: `<p>Scale ${a} : ${b} by 1, 2, and 3: ${pairs(points)}. All three points lie on one straight line through the origin (0, 0), because they are equivalent ratios.</p>${V.graph({ xLabel: c.x, yLabel: c.y, xMax, yMax, yStep: 2, size: 260, series: [{ points: [[0, 0]].concat(points), line: true }] })}`,
        feedback: {
          correct: `Correct. Every point is ${a} : ${b} scaled by the same factor, so they line up through the origin.`,
          wrong(ans, d) {
            const p = (d.extra || [])[0];
            if (p) {
              if (points.some((q) => q[0] === p[1] && q[1] === p[0])) return `(${p[0]}, ${p[1]}) has the coordinates reversed. The first number is ${c.many} (across), the second is ${c.thing} (up).`;
              if (p[1] === b * p[0]) return `(${p[0]}, ${p[1]}) uses ${b} ${c.thing} per ${c.one}. The ratio is ${b} ${c.thing} for every <b>${a}</b> ${c.many}, not for every 1.`;
              if (points.some((q) => q[0] === p[0])) return `(${p[0]}, ${p[1]}) is on the right column but at the wrong height. Multiply both parts of ${a} : ${b} by the same number.`;
              return `(${p[0]}, ${p[1]}) is not one of the asked points. Plot only ${a}, ${2 * a}, and ${3 * a} ${c.many}.`;
            }
            const m = (d.missing || [])[0];
            return m ? `You still need the point for ${m[0]} ${c.many}.` : `Scale ${a} : ${b} by 1, 2, and 3.`;
          },
        },
      };
    }
    const k = r.int(2, 4),
      n = 5;
    const g = grid(k, n);
    const points = Array.from({ length: n }, (_, i) => [i + 1, k * (i + 1)]);
    return {
      type: 'plot',
      skill: 'graphs',
      lesson: '3-4',
      title: 'Plot the points',
      prompt: `<p>${c.story(name, k)} Plot the points that show the number of ${c.thing} for ${hl('1, 2, 3, 4, and 5 ' + c.many)}.</p><p class="muted">Click a grid point to place or remove a point.</p>`,
      xLabel: c.x,
      yLabel: c.y,
      xMax: g.xMax,
      yMax: g.yMax,
      xStep: 1,
      yStep: g.yStep,
      points,
      count: n,
      hints: [
        `Each point is (${c.many}, ${c.thing}). For 1 ${c.one}, there are ${k} ${c.thing}: that is the point (1, ${k}).`,
        `Make a quick table: 1 → ${k}, 2 → ${2 * k}, 3 → ${3 * k}, 4 → ${4 * k}, 5 → ${5 * k}.`,
        `Plot (1, ${k}), (2, ${2 * k}), (3, ${3 * k}), (4, ${4 * k}), (5, ${5 * k}). The points should line up in a straight line from the origin.`,
      ],
      hintEs: `Cada punto es (${c.esMany}, ${c.es}). Para 1, hay ${k} ${c.es}: ese es el par ordenado (1, ${k}).`,
      solution: `<p>The points are ${pairs(points)}. Equivalent ratios always form a straight line that would pass through (0, 0).</p>${V.graph({ xLabel: c.x, yLabel: c.y, xMax: g.xMax, yMax: g.yMax, yStep: g.yStep, size: 260, series: [{ points, line: true }] })}`,
      feedback: {
        correct: 'Correct. The points line up because each one is the same ratio multiplied by a different factor.',
        wrong(ans, d) {
          if (d.extra.length) {
            const p = d.extra[0];
            if (points.some((q) => q[0] === p[1] && q[1] === p[0])) return `(${p[0]}, ${p[1]}) has the coordinates reversed. The first number is ${c.many} (across), the second is ${c.thing} (up).`;
            if (p[1] === k + p[0] - 1) return `(${p[0]}, ${p[1]}) adds 1 each time. The ratio multiplies: ${p[0]} ${c.many} should have ${p[0]} × ${k} ${c.thing}.`;
            return `(${p[0]}, ${p[1]}) is not on the pattern. ${p[0]} ${c.many} should have ${k * p[0]} ${c.thing}.`;
          }
          return `You still need the point for ${d.missing[0][0]} ${d.missing[0][0] === 1 ? c.one : c.many}: (${d.missing[0][0]}, ${d.missing[0][1]}).`;
        },
      },
    };
  });

  // ---------- Ordered pairs from a rate and a table ----------
  G.define('r4_orderedPairs', (r, o) => {
    const hard = !!o.hard;
    const name = r.pick(NAMES);
    const ctx = r.pick([
      ['fiber', 'grams of fiber', 'serving', 'cereal', 'gramos de fibra', 'porción'],
      ['protein', 'grams of protein', 'bar', 'snack bar', 'gramos de proteína', 'barra'],
      ['sugar', 'grams of sugar', 'cup', 'juice', 'gramos de azúcar', 'taza'],
    ]);
    const ka = r.int(2, 5);
    let kb = r.int(2, 6);
    if (kb === ka) kb = ka + 1;
    const fields = [];
    for (let i = 1; i <= 4; i++) fields.push({ label: `Brand A (${i}, `, suffix: ')', answer: ka * i, width: 'sm' });
    for (let i = 1; i <= 4; i++) fields.push({ label: `Brand B (${i}, `, suffix: ')', answer: kb * i, width: 'sm' });
    const tx = hard ? [3, 5] : [2, 3, 4];
    const aText = hard ? `Brand A has ${hl(ka * 3 + ' ' + ctx[1])} in every ${hl('3 ' + ctx[2] + 's')}` : `Brand A has ${hl(ka + ' ' + ctx[1])} per ${ctx[2]}`;
    const table = V.table([['Brand B'].concat(tx.map(() => '')), [`Number of ${ctx[2]}s`].concat(tx.map(String)), [cap(ctx[1])].concat(tx.map((x) => String(kb * x)))], {
      header: true,
      rowHeader: true,
      cls: 'compact',
    });
    return {
      type: 'blanks',
      skill: 'graphs',
      lesson: '3-4',
      title: 'Write the ordered pairs',
      prompt: `<p>${name} is comparing ${ctx[0]} in two brands of ${ctx[3]}. ${aText}. Brand B is shown in the table.</p>${table}<p>Complete the ordered pairs (${ctx[2]}s, ${ctx[1]}) for 1, 2, 3, and 4 ${ctx[2]}s of each brand.</p>`,
      fields,
      layout: 'two-col',
      groups: ['Brand A', 'Brand B'],
      hints: hard
        ? [
            `Neither brand gives the amount for 1 ${ctx[2]}. Find each unit rate first by dividing.`,
            `Brand A: ${ka * 3} ÷ 3 = ${ka} per ${ctx[2]}. Brand B: the table shows 3 ${ctx[2]}s → ${kb * 3}, so divide by 3.`,
            `Brand B pairs: (1, ${kb}), (2, ${kb * 2}), and so on. Multiply the number of ${ctx[2]}s by the unit rate.`,
          ]
        : [
            `Brand A: multiply the number of ${ctx[2]}s by ${ka}.`,
            `Brand B: the table shows 2 ${ctx[2]}s → ${kb * 2}. Divide to find 1 ${ctx[2]}: ${kb * 2} ÷ 2 = ${kb}.`,
            `Brand B pairs: (1, ${kb}), (2, ${kb * 2}), (3, ${kb * 3}), (4, ${kb * 4}).`,
          ],
      hintEs: hard
        ? `Ninguna marca da la cantidad para 1 ${ctx[5]}. Primero divide para hallar la tasa unitaria de cada marca.`
        : `Marca A: multiplica el número de cada ${ctx[5]} por ${ka}. Cada par ordenado es (${ctx[5]}, ${ctx[4]}).`,
      solution: `<p>${hard ? `Brand A: ${ka * 3} ÷ 3 = ${ka} per ${ctx[2]}. ` : ''}Brand A: (1, ${ka}), (2, ${ka * 2}), (3, ${ka * 3}), (4, ${ka * 4}). Brand B has ${kb} per ${ctx[2]} (${hard ? `${kb * 3} ÷ 3` : `${kb * 2} ÷ 2`}), so (1, ${kb}), (2, ${kb * 2}), (3, ${kb * 3}), (4, ${kb * 4}).</p>`,
      feedback: {
        correct: 'Correct. Each ordered pair is (number of servings, amount), and each brand keeps its own constant ratio.',
        wrong(ans, d) {
          const i = d.wrong[0],
            v = RX.parseNum(ans[i]);
          const brandA = i < 4,
            n = brandA ? i + 1 : i - 3,
            k = brandA ? ka : kb,
            other = brandA ? kb : ka;
          if (hard && brandA && v === ka * 3 * n) return `Brand A has ${ka * 3} per <b>3</b> ${ctx[2]}s, not per 1. Divide by 3 first to get the unit rate.`;
          if (v === other * n) return `For ${n} ${ctx[2]}${n > 1 ? 's' : ''} of Brand ${brandA ? 'A' : 'B'}, you used the other brand's rate (${other}). Each brand has its own ratio.`;
          if (v === n) return 'You wrote the first coordinate again. The second number is the amount, not the number of servings.';
          return brandA
            ? `Brand A, ${n} ${ctx[2]}${n > 1 ? 's' : ''}: find the amount for 1 ${ctx[2]}, then multiply by ${n}.`
            : `Brand B, ${n} ${ctx[2]}${n > 1 ? 's' : ''}: divide a table column to get the unit rate, then multiply by ${n}.`;
        },
      },
    };
  });

  // ---------- Read a graph and extend ----------
  G.define('r4_readGraph', (r, o) => {
    const hard = !!o.hard;
    const c = r.pick(GC);
    if (hard) {
      // y-axis counts by 5s (labels every 10), ratio b : 2 with b odd multiple of 5 → unit rate is a decimal
      const b = r.pick([5, 15, 25]);
      const points = [1, 2, 3].map((m) => [2 * m, b * m]);
      const yMax = 3 * b + 5;
      const back = r.chance(0.5);
      const m = r.pick([5, 7]),
        ask = r.pick([10, 14]);
      const answer = back ? 2 * m : (b * ask) / 2;
      const q = back ? `how many ${c.many} go with ${hl(b * m + ' ' + c.thing)}?` : `how many ${c.thing} are there for ${hl(ask + ' ' + c.many)}?`;
      return {
        type: 'num',
        skill: 'graphs',
        lesson: '3-4',
        title: 'Read the graph',
        prompt: `<p>The graph shows ${c.thing} and ${c.many}. Each gridline on the vertical axis is ${hl('5')}; only every other line is labelled.</p>${V.graph({ xLabel: c.x, yLabel: c.y, xMax: 7, yMax, yStep: 5, yLabelEvery: 10, size: 290, series: [{ points }] })}<p>At this rate, ${q}</p>`,
        unit: back ? c.many : c.thing,
        answer,
        hints: [
          'No point sits above 1, so read the first point carefully. Count the vertical gridlines by 5s.',
          `The first point is (2, ${b}): ${b} ${c.thing} for every 2 ${c.many}.`,
          back
            ? `Ask how many groups of ${b} ${c.thing} make ${b * m}. Each group goes with 2 ${c.many}, so multiply that number of groups by 2.`
            : `${ask} ${c.many} is ${ask / 2} groups of 2 ${c.many}. Multiply ${ask / 2} × ${b}.`,
        ],
        hintEs: 'Ningún punto está arriba del 1, así que lee bien el primer punto. Cuenta las líneas verticales de 5 en 5.',
        solution: back
          ? `<p>The point (2, ${b}) shows ${b} ${c.thing} for every 2 ${c.many}. ${b * m} ÷ ${b} = ${m} groups, and ${m} × 2 = <b>${answer} ${c.many}</b>.</p>`
          : `<p>The point (2, ${b}) shows ${b} ${c.thing} for every 2 ${c.many} (a unit rate of ${round(b / 2, 1)}). ${ask} ÷ 2 = ${ask / 2} groups, and ${ask / 2} × ${b} = <b>${answer}</b>.</p>`,
        feedback: {
          correct: `Correct. Reading (2, ${b}) and scaling it gives ${answer}.`,
          wrong(ans, d) {
            const v = d.value;
            if (!back && v === b * ask) return `You used ${b} per 1 ${c.one}, but (2, ${b}) means ${b} for every <b>2</b> ${c.many}. Halve it or count groups of 2.`;
            if (!back && v === 3 * b) return `${3 * b} is the last point shown (6 ${c.many}). Keep the pattern going to ${ask}.`;
            if (back && v === m) return `${m} is the number of groups of ${b}. Each group is 2 ${c.many}, so multiply by 2.`;
            if (!back && v === ((b + 5) * ask) / 2) return 'Check your reading of the first point. The gridlines count by 5s, and the point is on a line without a label.';
            return 'Read the first point (2 across), then scale that ratio to the amount the question asks about.';
          },
        },
      };
    }
    const k = r.int(2, 5),
      ask = r.pick([6, 7, 8]);
    const g = grid(k, 4);
    const points = [1, 2, 3, 4].map((x) => [x, k * x]);
    return {
      type: 'num',
      skill: 'graphs',
      lesson: '3-4',
      title: 'Read the graph',
      prompt: `<p>The graph shows the number of ${c.thing} for different numbers of ${c.many}.</p>${V.graph({ xLabel: c.x, yLabel: c.y, xMax: g.xMax, yMax: g.yMax, yStep: g.yStep, size: 280, series: [{ points }] })}<p>At this rate, how many ${c.thing} are there for ${hl(ask + ' ' + c.many)}?</p>`,
      unit: c.thing,
      answer: k * ask,
      hints: ['Find the point above 1 on the horizontal axis. Its height is the unit rate.', `The point (1, ${k}) means ${k} ${c.thing} per ${c.one}.`, `Multiply: ${ask} × ${k}.`],
      hintEs: 'Busca el punto que está arriba del 1 en el eje x. Su altura es la tasa unitaria.',
      solution: `<p>The point (1, ${k}) shows the unit rate: ${k} ${c.thing} per ${c.one}. For ${ask} ${c.many}: ${ask} × ${k} = <b>${k * ask}</b>.</p>`,
      feedback: {
        correct: `Correct. The point above 1 gives the unit rate (${k}), and ${ask} × ${k} = ${k * ask}.`,
        wrong(ans, d) {
          if (d.value === k * 4) return `${k * 4} is the value for 4 ${c.many}, the last point shown. The question asks about ${ask}. Use the unit rate to go further.`;
          if (d.value === k + ask) return `You added ${ask} to the unit rate. Equivalent ratios multiply: ${ask} ${c.many} means ${ask} groups of ${k}.`;
          return `Read the unit rate from the point above 1 (${k} per ${c.one}), then multiply by ${ask}.`;
        },
      },
    };
  });

  // ---------- Match table to graph (rep) ----------
  G.define('r4_tableToGraph', (r, o) => {
    const hard = !!o.hard;
    const c = r.pick(GC);
    let opts, xs, ys, hints, hintEs, solution, mk;
    if (hard) {
      const h = r.pick([3, 5]);
      const pts = [1, 2, 3].map((m) => [2 * m, h * m]);
      xs = pts.map((p) => p[0]);
      ys = pts.map((p) => p[1]);
      const rev = pts.map((p) => [p[1], p[0]]).filter((p) => p[0] <= 10);
      mk = (series) => V.graph({ xLabel: c.x, yLabel: c.y, xMax: 10, yMax: 16, yStep: 1, yLabelEvery: 2, size: 200, series: [{ points: series }] });
      opts = [
        { html: mk(pts), ok: true },
        { html: mk([1, 2, 3].map((m) => [m, h * m])), why: `This graph puts ${h} ${c.thing} at 1 ${c.one}. The table pairs ${h} with <b>2</b> ${c.many}.` },
        {
          html: mk([
            [2, h],
            [4, h + 2],
            [6, h + 4],
          ]),
          why: 'These points add 2 each time. The table multiplies both numbers by the same factor, so the points must line up with the origin.',
        },
        { html: mk(rev), why: 'This graph has the coordinates reversed. The horizontal axis should show the first number in each pair.' },
      ];
      hints = [
        `Each column of the table is a point: (${c.many}, ${c.thing}). The first column is 2 ${c.many}, not 1.`,
        `The first point should be (2, ${h}): 2 across, ${h} up. The vertical labels count by 2s.`,
        `Check (4, ${2 * h}) too. Only one graph has both points.`,
      ];
      hintEs = `Cada columna de la tabla es un par ordenado: (${c.esMany}, ${c.es}). La primera columna es 2 ${c.esMany}, no 1.`;
      solution = `<p>The table gives the points ${pairs(pts)}. The correct graph shows exactly those points, and they line up with the origin because each is ${2} : ${h} scaled by the same factor.</p>`;
    } else {
      const k = r.int(2, 4);
      const pts = [1, 2, 3, 4].map((x) => [x, k * x]);
      xs = pts.map((p) => p[0]);
      ys = pts.map((p) => p[1]);
      const rev = pts.map((p) => [p[1], p[0]]).filter((p) => p[0] <= 5);
      const addPts = [1, 2, 3, 4].map((x) => [x, k + (x - 1)]);
      mk = (series) => V.graph({ xLabel: c.x, yLabel: c.y, xMax: 5, yMax: 16, yStep: 2, size: 200, series: [{ points: series }] });
      opts = [
        { html: mk(pts), ok: true },
        { html: mk(rev.length ? rev : [[k, 1]]), why: 'This graph has the coordinates reversed. The horizontal axis should be the first number in each pair.' },
        { html: mk(addPts), why: 'These points go up by 1 each time instead of by the same multiple, so they do not match the table.' },
      ];
      hints = [
        `Each column of the table is a point: (${c.many}, ${c.thing}). The first number goes across, the second goes up.`,
        `The first point should be (1, ${k}): 1 across, ${k} up.`,
        `Check (2, ${2 * k}): 2 across, ${2 * k} up. Only one graph has it.`,
      ];
      hintEs = `Cada columna de la tabla es un par ordenado: (${c.esMany}, ${c.es}). El primer número va hacia la derecha y el segundo hacia arriba.`;
      solution = `<p>The table gives the points ${pairs(pts)}. The correct graph shows exactly those points in a straight line.</p>`;
    }
    const sh = shuffleOptions(r, opts, 0);
    return {
      type: 'rep',
      skill: 'graphs',
      lesson: '3-4',
      title: 'Match the table to its graph',
      prompt: `<p>Which graph shows the data in the table?</p>${V.table([[c.x].concat(xs.map(String)), [c.y].concat(ys.map(String))], { header: false, rowHeader: true, cls: 'compact' })}`,
      options: sh.options,
      answer: sh.answer,
      layout: 'cards',
      hints,
      hintEs,
      solution,
      feedback: {
        correct: 'Correct. The first number in each pair goes across; the second goes up.',
        wrong: (ans) => why(sh.options, ans) || 'Plot the first column of the table in your head, then find the graph that has it.',
      },
    };
  });

  // ---------- Compare two brands on a graph (MC) ----------
  G.define('r4_compareGraphs', (r, o) => {
    const hard = !!o.hard;
    const ctx = r.pick([
      ['fiber', 'grams of fiber', 'serving', 'gramos de fibra', 'porción'],
      ['juice', 'ounces of juice', 'bottle', 'onzas de jugo', 'botella'],
      ['protein', 'grams of protein', 'bar', 'gramos de proteína', 'barra'],
    ]);
    const yLab = cap(ctx[1]);
    if (hard) {
      // one brand shown at x = 2, 4, 6; the other at x = 3, 6. The lesser brand has the higher first point.
      const [p, q] = r.pick([
        [5, 7],
        [7, 8],
        [7, 10],
      ]);
      const greaterIsA = r.chance(0.5);
      const G2 = greaterIsA ? 'A' : 'B',
        L = greaterIsA ? 'B' : 'A';
      const ptsG = [1, 2, 3].map((m) => [2 * m, p * m]),
        ptsL = [1, 2].map((m) => [3 * m, q * m]);
      const ser = (pts, lab, col, dashed) => ({ points: [[0, 0]].concat(pts), line: true, label: 'Brand ' + lab, color: col, dashed });
      const series = greaterIsA ? [ser(ptsG, 'A', '#1FA6A2'), ser(ptsL, 'B', '#F2A33A', true)] : [ser(ptsL, 'A', '#1FA6A2'), ser(ptsG, 'B', '#F2A33A', true)];
      const opts = [
        { html: `Brand ${G2}, because at 6 ${ctx[2]}s its line is higher.`, ok: true },
        { html: `Brand ${L}, because at 6 ${ctx[2]}s its line is higher.`, why: `Read both lines at 6 ${ctx[2]}s: Brand ${G2} is at ${3 * p} and Brand ${L} is at ${2 * q}.` },
        {
          html: `Brand ${L}, because its first point is higher on the graph.`,
          why: `The first points are at different numbers of ${ctx[2]}s (2 and 3). Compare the brands at the same number of ${ctx[2]}s.`,
        },
        { html: 'They are the same, because both lines start at the origin.', why: 'Every ratio graph starts at the origin. The steeper line has the greater ratio.' },
      ];
      const sh = shuffleOptions(r, opts, 0);
      return {
        type: 'mc',
        skill: 'graphs',
        lesson: '3-4',
        title: 'Compare the graphs',
        prompt: `<p>The graph shows the ${ctx[1]} in two brands. The points are at different numbers of ${ctx[2]}s.</p>${V.graph({ xLabel: `Number of ${ctx[2]}s`, yLabel: yLab, xMax: 7, yMax: 22, yStep: 1, yLabelEvery: 2, size: 300, series })}<p>Which brand has the greater ratio of ${ctx[1]} to ${ctx[2]}s?</p>`,
        options: sh.options,
        answer: sh.answer,
        hints: [
          `The first points are at different ${ctx[2]} counts, so they cannot be compared directly. Find an x-value where both brands have a point.`,
          `Both lines have a point at 6 ${ctx[2]}s. Read the height of each one there.`,
          `At 6 ${ctx[2]}s, compare ${3 * p} and ${2 * q}. The greater value is the steeper line.`,
        ],
        hintEs: `Los primeros puntos están en distintas cantidades de ${ctx[4]}, así que no se pueden comparar directamente. Busca un valor del eje x donde las dos marcas tengan un punto.`,
        solution: `<p>At 6 ${ctx[2]}s, Brand ${G2} has ${3 * p} and Brand ${L} has ${2 * q}. <b>Brand ${G2}</b> has the greater ratio (${p} per 2 is more than ${q} per 3). Brand ${L}'s first point looks higher only because it is at 3 ${ctx[2]}s instead of 2.</p>`,
        feedback: {
          correct: 'Correct. Compare ratios at the same x-value (a common term), or compare steepness.',
          wrong: (ans) => why(sh.options, ans) || 'Compare both brands at the same number of servings.',
        },
      };
    }
    const ka = r.int(2, 5);
    let kb = r.int(2, 6);
    if (kb === ka) kb = ka + 1;
    const yMax = Math.max(ka, kb) * 4 + 2;
    const greater = ka > kb ? 'A' : 'B';
    const sh = shuffleOptions(
      r,
      [
        { html: `Brand ${greater}, because its points are higher at every number of ${ctx[2]}s.`, ok: true },
        {
          html: `Brand ${greater === 'A' ? 'B' : 'A'}, because its points are higher at every number of ${ctx[2]}s.`,
          why: `Look again at the graph. Brand ${greater}'s points are above Brand ${greater === 'A' ? 'B' : 'A'}'s at every ${ctx[2]} count.`,
        },
        { html: 'They are the same, because both graphs are straight lines.', why: 'Both are straight lines because both are ratios, but the steeper line has the greater ratio.' },
        { html: `Brand ${greater === 'A' ? 'B' : 'A'}, because its line is less steep.`, why: 'A less steep line means fewer per serving, which is the smaller ratio.' },
      ],
      0,
    );
    return {
      type: 'mc',
      skill: 'graphs',
      lesson: '3-4',
      title: 'Compare the graphs',
      prompt: `<p>The graph shows the ${ctx[1]} in two brands.</p>${V.graph({
        xLabel: `Number of ${ctx[2]}s`,
        yLabel: yLab,
        xMax: 5,
        yMax,
        yStep: yMax > 14 ? 2 : 1,
        size: 290,
        series: [
          { points: [1, 2, 3, 4].map((x) => [x, ka * x]), line: true, label: 'Brand A', color: '#1FA6A2' },
          { points: [1, 2, 3, 4].map((x) => [x, kb * x]), line: true, label: 'Brand B', color: '#F2A33A', dashed: true },
        ],
      })}<p>Which brand offers the greater ratio of ${ctx[1]} to ${ctx[2]}s?</p>`,
      options: sh.options,
      answer: sh.answer,
      hints: [
        `Compare the points above 1 ${ctx[2]}. Which brand is higher?`,
        `Brand A: ${ka} per ${ctx[2]}. Brand B: ${kb} per ${ctx[2]}.`,
        'The brand with the greater amount per serving has the greater ratio. Its line is steeper.',
      ],
      hintEs: `Compara los puntos que están arriba de 1 ${ctx[4]}. ¿Qué marca está más alta?`,
      solution: `<p>Brand A has ${ka} per ${ctx[2]}; Brand B has ${kb}. <b>Brand ${greater}</b> has the greater ratio. On a graph, the greater ratio is the steeper line, and its points are higher at every x-value.</p>`,
      feedback: {
        correct: 'Correct. The steeper line (higher at every x-value) shows the greater ratio.',
        wrong: (ans) => why(sh.options, ans) || 'Compare the heights of the two lines above 1 serving.',
      },
    };
  });

  // ---------- Meaning of a point (MC) ----------
  G.define('r4_pointMeaning', (r, o) => {
    const hard = !!o.hard;
    const c = r.pick(GC);
    if (hard) {
      // non-unit ratio: the point's meaning as a unit rate (a decimal)
      const h = r.pick([3, 5, 7]),
        x = r.pick([2, 4]),
        y = (h * x) / 2;
      const ur = round(h / 2, 2),
        inv = round(x / y, 2);
      const sh = shuffleOptions(
        r,
        [
          { html: `There are ${ur} ${c.thing} for each ${c.one}.`, ok: true },
          { html: `There are ${y} ${c.thing} for each ${c.one}.`, why: `${y} is the total for ${x} ${c.many}. Divide by ${x} to get the amount for 1 ${c.one}.` },
          { html: `There are ${inv} ${c.thing} for each ${c.one}.`, why: `You divided ${x} by ${y}, which gives ${c.many} per ${c.thing.replace(/s$/, '')}. Divide ${c.thing} by ${c.many}.` },
          { html: `There are ${x} ${c.many} for each ${y} ${c.thing}.`, why: `This statement compares the right two amounts, but it is not a unit rate: neither amount is 1. Divide ${y} by ${x}.` },
        ],
        0,
      );
      return {
        type: 'mc',
        skill: 'graphs',
        lesson: '3-4',
        title: 'What does the point tell you?',
        prompt: `<p>The graph shows ${c.thing} and ${c.many}. Every point shows the same ratio.</p>${V.graph({ xLabel: c.x, yLabel: c.y, xMax: 7, yMax: 22, yStep: 1, yLabelEvery: 2, size: 270, series: [{ points: [1, 2, 3].map((m) => [2 * m, h * m]) }, { points: [[x, y]], color: '#C8553D' }] })}<p>Use the highlighted point ${hl('(' + x + ', ' + y + ')')}. Which statement gives the <b>unit rate</b>?</p>`,
        options: sh.options,
        answer: sh.answer,
        hints: [
          'A unit rate is the amount for 1. The point shows the amount for more than 1, so you need to divide.',
          `(${x}, ${y}) means ${x} ${c.many} go with ${y} ${c.thing}.`,
          `Divide the ${c.thing} by the ${c.many}: ${y} ÷ ${x}.`,
        ],
        hintEs: 'Una tasa unitaria es la cantidad para 1. El punto muestra la cantidad para más de 1, así que tienes que dividir.',
        solution: `<p>(${x}, ${y}) means ${x} ${c.many} have ${y} ${c.thing}. The unit rate is ${y} ÷ ${x} = <b>${ur} ${c.thing} per ${c.one}</b>. A point at x = 1 would be at ${ur}, between gridlines.</p>`,
        feedback: { correct: `Correct. ${y} ÷ ${x} = ${ur} ${c.thing} for each ${c.one}.`, wrong: (ans) => why(sh.options, ans) || 'Divide the vertical value by the horizontal value.' },
      };
    }
    const k = r.int(2, 5),
      x = r.int(2, 4);
    const g = grid(k, 4);
    const sh = shuffleOptions(
      r,
      [
        { html: `${x} ${c.many} have ${k * x} ${c.thing}.`, ok: true },
        { html: `${k * x} ${c.many} have ${x} ${c.thing}.`, why: `The first coordinate is ${c.many} and the second is ${c.thing}. You reversed them.` },
        { html: `There are ${k * x} ${c.thing} for each ${c.one}.`, why: `${k * x} is the total for ${x} ${c.many}, not the amount per ${c.one}. The unit rate is ${k}.` },
        { html: `There are ${x} ${c.thing} for each ${c.one}.`, why: `${x} is the number of ${c.many}, not ${c.thing} per ${c.one}.` },
      ],
      0,
    );
    return {
      type: 'mc',
      skill: 'graphs',
      lesson: '3-4',
      title: 'What does the point mean?',
      prompt: `<p>The graph shows ${c.thing} and ${c.many}.</p>${V.graph({ xLabel: c.x, yLabel: c.y, xMax: g.xMax, yMax: g.yMax, yStep: g.yStep, size: 260, series: [{ points: [1, 2, 3, 4].map((i) => [i, k * i]) }, { points: [[x, k * x]], color: '#C8553D' }] })}<p>What does the highlighted point ${hl('(' + x + ', ' + k * x + ')')} represent?</p>`,
      options: sh.options,
      answer: sh.answer,
      hints: [
        'Read the axis labels. The first number in the pair is on the horizontal axis.',
        `Find the first number of the pair on the horizontal axis and read that axis label. Then read the vertical axis label for the second number.`,
        `So the first number tells how many ${c.many}, and the second tells how many ${c.thing}.`,
      ],
      hintEs: 'Lee los nombres de los ejes. El primer número del par ordenado está en el eje horizontal (eje x).',
      solution: `<p>(${x}, ${k * x}) means <b>${x} ${c.many} have ${k * x} ${c.thing}</b>. The unit rate is the point above 1: ${k} ${c.thing} per ${c.one}.</p>`,
      feedback: {
        correct: 'Correct. An ordered pair reads (horizontal value, vertical value), using the axis labels.',
        wrong: (ans) => why(sh.options, ans) || 'Read the axis labels, then the two numbers in order.',
      },
    };
  });

  // ---------- Graph to table ----------
  G.define('r4_graphToTable', (r, o) => {
    const hard = !!o.hard;
    const c = r.pick(GC);
    if (hard) {
      const S = r.pick([
        { k: 5, ys: 5, le: 10 },
        { k: 15, ys: 5, le: 10 },
        { k: 25, ys: 5, le: 10 },
        { k: 3, ys: 1, le: 5 },
        { k: 7, ys: 1, le: 5 },
      ]);
      const k = S.k,
        pts = [1, 2, 3].map((m) => [2 * m, k * m]);
      const yMax = Math.ceil((3 * k + 1) / S.ys) * S.ys + S.ys;
      const val = (x) => (k * x) / 2;
      const xs = [1, 2, 4, 6, 10];
      return {
        type: 'table',
        skill: 'graphs',
        lesson: '3-4',
        title: 'Build the table from the graph',
        prompt: `<p>Use the graph to complete the table. Each vertical gridline step is ${hl(S.ys)}; labels appear every ${S.le}.</p>${V.graph({ xLabel: c.x, yLabel: c.y, xMax: 7, yMax, yStep: S.ys, yLabelEvery: S.le, size: 280, series: [{ points: pts }] })}`,
        rows: [[c.x].concat(xs.map(String)), [c.y].concat(xs.map((x) => `__IN:y${x}__`))],
        rowHeader: true,
        inputs: xs.map((x) => ({ id: 'y' + x, answer: val(x) })),
        hints: [
          `Read the three points first. Count the gridlines by ${S.ys}s from the nearest label.`,
          `The point above 2 is at ${k}, so the ratio is ${k} ${c.thing} for every 2 ${c.many}.`,
          `1 is half of 2, so take half of ${k}. 10 is 5 groups of 2, so multiply ${k} by 5.`,
        ],
        hintEs: `Primero lee los tres puntos. Cuenta las líneas de ${S.ys} en ${S.ys} desde el número más cercano.`,
        solution: `<p>The points are ${pairs(pts)}, so the ratio is ${k} : 2. Half of that gives 1 → <b>${val(1)}</b>, and 5 times it gives 10 → <b>${val(10)}</b>. Table: 2 → ${val(2)}, 4 → ${val(4)}, 6 → ${val(6)}.</p>`,
        feedback: {
          correct: `Correct. Every point is (x, ${val(1)}x), so the table and graph show the same ratio.`,
          wrong(ans, d) {
            const id = d.wrong[0],
              x = Number(id.slice(1)),
              v = RX.parseNum(ans[id]);
            if (x === 1 && v === k) return `${k} goes with 2 ${c.many}, not 1. Take half of it for 1 ${c.one}.`;
            if (x === 10 && v === k * 10) return `You multiplied ${k} by 10, but ${k} is the amount for 2 ${c.many}. 10 ${c.many} is 5 groups of 2.`;
            if (x === 10 && v === val(6) + 4) return 'You added to the last value. Equivalent ratios scale by multiplying.';
            return x === 1 || x === 10 ? `${x} is not shown on the graph. Use the ratio ${k} for every 2.` : `Look above ${x} and count the gridlines by ${S.ys}s.`;
          },
        },
      };
    }
    const k = r.int(2, 5);
    const g = grid(k, 4);
    const pts = [1, 2, 3, 4].map((x) => [x, k * x]);
    return {
      type: 'table',
      skill: 'graphs',
      lesson: '3-4',
      title: 'Build the table from the graph',
      prompt: `<p>Use the graph to complete the table.</p>${V.graph({ xLabel: c.x, yLabel: c.y, xMax: g.xMax, yMax: g.yMax, yStep: g.yStep, size: 270, series: [{ points: pts }] })}`,
      rows: [
        [c.x, '1', '2', '3', '4', '6'],
        [c.y, '__IN:y1__', '__IN:y2__', '__IN:y3__', '__IN:y4__', '__IN:y6__'],
      ],
      rowHeader: true,
      inputs: [1, 2, 3, 4, 6].map((x) => ({ id: 'y' + x, answer: k * x })),
      hints: [
        'For each number across, find the point above it and read its height.',
        `Above 1 the point is at ${k}. Above 2 it is at ${2 * k}.`,
        `6 is not on the graph. Use the unit rate: 6 × ${k}.`,
      ],
      hintEs: 'Para cada número del eje x, busca el punto que está arriba y lee su altura.',
      solution: `<p>Reading up from each x-value: 1 → ${k}, 2 → ${2 * k}, 3 → ${3 * k}, 4 → ${4 * k}. For 6, extend the pattern: 6 × ${k} = <b>${6 * k}</b>.</p>`,
      feedback: {
        correct: `Correct. Every point is (x, ${k}x), so the table and graph show the same ratio.`,
        wrong(ans, d) {
          const x = Number(d.wrong[0].slice(1)),
            v = RX.parseNum(ans[d.wrong[0]]);
          if (x === 6 && v === 5 * k) return `${5 * k} would be 5 ${c.many}. The column asks for 6, so multiply 6 by ${k}.`;
          return x === 6 ? `6 is beyond the graph. Multiply 6 by the unit rate (${k}).` : `Look above ${x} on the horizontal axis and read the height of the point.`;
        },
      },
    };
  });

  // ---------- Who graphed it correctly? ----------
  G.define('r4_whoGraph', (r, o) => {
    const hard = !!o.hard;
    const c = r.pick(GC),
      [n1, n2, n3] = r.pickN(NAMES, 3);
    const mk = (series) => V.graph({ xLabel: c.x, yLabel: c.y, xMax: 10, yMax: hard ? 16 : 10, size: 210, xLabelEvery: 2, yLabelEvery: 2, series: [{ points: series }] });
    let opts, tx, ty, hints, hintEs, solution;
    if (hard) {
      const k = r.pick([3, 5]);
      const pts = [1, 2, 3].map((m) => [2 * m, k * m]);
      tx = pts.map((p) => p[0]);
      ty = pts.map((p) => p[1]);
      opts = [
        { title: n1, html: mk(pts), ok: true },
        { title: n2, html: mk([1, 2, 3].map((m) => [m, k * m])), why: `${n2} paired ${k} ${c.thing} with 1 ${c.one}. The table pairs ${k} with 2 ${c.many}, so each point is too far left.` },
        {
          title: n3,
          html: mk([
            [2, k],
            [4, k + 2],
            [6, k + 4],
          ]),
          why: `${n3} added 2 each time. ${n3}'s first point is right, but the others do not keep the ratio ${2} : ${k}.`,
        },
      ];
      hints = [
        `Check every point, not just the first one. The table starts at 2 ${c.many}, not 1.`,
        `The points should be (2, ${k}), (4, ${2 * k}), and (6, ${3 * k}).`,
        `Find 4 on the horizontal axis in each graph. Only one graph has a point at height ${2 * k} there.`,
      ];
      hintEs = `Revisa todos los puntos, no solo el primero. La tabla empieza en 2 ${c.esMany}, no en 1.`;
      solution = `<p>${n1} is correct: ${pairs(pts)}. ${n2} used ${k} per 1 ${c.one} instead of ${k} per 2. ${n3} added 2 each time, so the points stop matching the ratio.</p>`;
    } else {
      const k = r.int(2, 3);
      const pts = [1, 2, 3].map((x) => [x, k * x]);
      tx = pts.map((p) => p[0]);
      ty = pts.map((p) => p[1]);
      opts = [
        { title: n1, html: mk(pts), ok: true },
        {
          title: n2,
          html: mk(pts.map((p) => [p[1], p[0]])),
          why: `${n2} put ${c.thing} on the horizontal axis and ${c.many} on the vertical axis. The labels say the opposite, so each point is reversed.`,
        },
      ];
      hints = [`The first point should be (1, ${k}): 1 across, ${k} up.`, 'Find 1 on the horizontal axis in each graph. How high is the point there?', `Only one graph has a point at (1, ${k}).`];
      hintEs = `El primer punto debe ser (1, ${k}): 1 hacia la derecha y ${k} hacia arriba.`;
      solution = `<p>${n1} is correct: ${pairs(pts)}. ${n2} reversed the coordinates, which changes the meaning of each point.</p>`;
    }
    const sh = shuffleOptions(r, opts, 0);
    return {
      type: 'who',
      skill: 'graphs',
      lesson: '3-4',
      title: 'Whose graph is correct?',
      prompt: `<p>The table shows ${c.thing} and ${c.many}. ${hard ? 'Three' : 'Two'} students graphed it with ${c.many} on the horizontal axis.</p>${V.table([[c.x].concat(tx.map(String)), [c.y].concat(ty.map(String))], { header: false, rowHeader: true, cls: 'compact' })}<p>Whose graph is correct?</p>`,
      options: sh.options,
      answer: sh.answer,
      layout: 'cards',
      hints,
      hintEs,
      solution,
      feedback: {
        correct: 'Correct. Always read the axis labels before plotting; (x, y) means across first, then up.',
        wrong: (ans) => why(sh.options, ans) || 'Check each table column as a point on each graph.',
      },
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
  const why = (opts, i) => (opts[i] && opts[i].why) || null;
  const near = (v, x) => v != null && Math.abs(v - x) < 0.011;

  // ---------- Unit rate then solve (blanks) ----------
  G.define('r5_unitThenSolve', (r, o) => {
    const hard = !!o.hard;
    const name = r.pick(NAMES);
    // hard: the unit rate is a half-minute decimal (e.g. 8.5 minutes per mile)
    const m = hard ? r.pick([2, 4, 6]) : r.int(2, 5);
    const per = hard ? r.pick([13, 15, 17, 19, 21, 23]) / 2 : r.int(7, 12);
    const t = m * per;
    const n = hard ? r.pick([4, 6, 8, 10, 12].filter((x) => x !== m)) : r.int(m + 1, 9);
    const T = per * n;
    return {
      type: 'blanks',
      skill: 'rate-problems',
      lesson: '3-5',
      title: 'Find the rate, then use it',
      prompt: `<p>${name} runs ${hl(m + ' miles')} in ${hl(t + ' minutes')}. Complete the sentences.</p>`,
      template: ['The unit rate is {0} minutes per mile.', `At this rate, ${name} would run {1} miles in ${T} minutes.`],
      fields: [
        { answer: per, width: 'sm' },
        { answer: n, width: 'sm' },
      ],
      hints: [
        hard ? 'First find minutes per 1 mile: minutes ÷ miles. The unit rate may be a decimal.' : 'First find minutes per 1 mile: minutes ÷ miles.',
        `${t} ÷ ${m} = ${per} minutes per mile.`,
        `If each mile takes ${per} minutes, how many miles fit in ${T} minutes? Divide ${T} by ${per}.`,
      ],
      hintEs: hard ? 'Primero encuentra los minutos por 1 milla: minutos ÷ millas. La tasa unitaria puede ser un número decimal.' : 'Primero encuentra los minutos por 1 milla: minutos ÷ millas.',
      solution: `<p>Unit rate: ${t} ÷ ${m} = <b>${per} minutes per mile</b>. Each mile takes ${per} minutes, so ${T} minutes holds ${T} ÷ ${per} = <b>${n} miles</b>.</p>`,
      feedback: {
        correct: `Correct. A unit rate (${per} min per mile) lets you solve for any time or distance.`,
        wrong(ans, d) {
          if (d.wrong.includes(0)) {
            const v = RX.parseNum(ans[0]);
            if (near(v, m / t)) return `That is miles per minute. "Minutes per mile" means minutes ÷ miles: ${t} ÷ ${m}.`;
            if (hard && v === Math.floor(per)) return `Check the division: ${t} ÷ ${m} does not come out to a whole number. Keep the decimal part.`;
            return `Minutes per mile = ${t} ÷ ${m}.`;
          }
          const v = RX.parseNum(ans[1]);
          if (near(v, T * per)) return `You multiplied ${T} by ${per}. Each mile takes ${per} minutes, so divide ${T} minutes by ${per} to count the miles.`;
          if (near(v, (T / t) * per)) return 'Use the unit rate for the second blank: miles = minutes ÷ minutes per mile.';
          return `The unit rate is right. For the second blank, divide ${T} minutes by ${per} minutes per mile.`;
        },
      },
    };
  });

  // ---------- Are these rates equivalent? (tf) ----------
  G.define('r5_equivRates', (r, o) => {
    const hard = !!o.hard;
    const name = r.pick(NAMES);
    // hard: half-unit rates and a near miss that only a careful division reveals
    const rate = hard ? r.pick([13, 15, 17, 19, 21, 23]) / 2 : r.int(6, 12);
    const t1 = hard ? r.pick([12, 16, 18, 24]) : r.pick([20, 25, 30]);
    const t2 = hard ? r.pick([20, 30, 36, 40]) : r.pick([15, 20, 40].filter((x) => x !== t1));
    const equiv = r.chance(0.5);
    const c1 = rate * t1,
      c2 = equiv ? rate * t2 : rate * t2 + (hard ? r.pick([-2, 2, 3]) : r.pick([-40, 20, 30]));
    const r2 = round(c2 / t2, 2);
    const reasons = r.shuffle([
      { html: `Yes. ${c1} ÷ ${t1} = ${rate} and ${c2} ÷ ${t2} = ${r2}, so both are ${rate} calories per minute.`, correct: equiv },
      { html: `No. ${c1} ÷ ${t1} = ${rate} but ${c2} ÷ ${t2} = ${r2}, so the unit rates are different.`, correct: !equiv },
      { html: `No. ${Math.max(c1, c2)} calories is more than ${Math.min(c1, c2)} calories.`, correct: false },
      hard ? { html: 'Yes. The activity with more calories also took more minutes, so the rates balance out.', correct: false } : { html: 'Yes. Both activities are exercise.', correct: false },
    ]);
    return {
      type: 'tf',
      skill: 'compare',
      lesson: '3-5',
      title: 'Equivalent rates?',
      prompt: `<p>${name} burns ${hl(c1 + ' calories')} swimming for ${hl(t1 + ' minutes')}. Later, ${name} burns ${hl(c2 + ' calories')} biking for ${hl(t2 + ' minutes')}.</p><p>Are these two rates equivalent?</p>`,
      statement: 'The two rates are equivalent.',
      answer: equiv,
      reasons,
      labels: ['Yes, equivalent', 'No, not equivalent'],
      hints: [
        'Comparing totals does not work because the times are different. Find each unit rate (calories per minute).',
        `Swimming: ${c1} ÷ ${t1}. Biking: ${c2} ÷ ${t2}.${hard ? ' Divide carefully: the unit rates may be decimals.' : ''}`,
        'Compare the two unit rates. Equivalent rates have exactly the same unit rate.',
      ],
      hintEs: 'Comparar los totales no sirve porque los tiempos son diferentes. Encuentra cada tasa unitaria (calorías por minuto).',
      solution: `<p>Swimming: ${c1} ÷ ${t1} = ${rate} calories per minute. Biking: ${c2} ÷ ${t2} = ${r2} calories per minute. ${equiv ? '<b>Equivalent</b>: the unit rates are the same.' : `<b>Not equivalent</b>: ${rate} and ${r2} are different unit rates.`} A bigger total over more minutes tells you nothing until you divide.</p>`,
      feedback: {
        correct: 'Correct. Rates are compared with unit rates, never with totals alone.',
        wrong(ans, d) {
          if (!d.valueOk)
            return hard && !equiv
              ? `The unit rates are close, but close is not equal. Divide: ${c1} ÷ ${t1} and ${c2} ÷ ${t2}, then compare every digit.`
              : `Totals can fool you. Divide: ${c1} ÷ ${t1} and ${c2} ÷ ${t2}, then compare.`;
          return 'Your answer is right, but the reason must compare the unit rates (calories per minute).';
        },
      },
    };
  });

  // ---------- Compare rates given in different forms (who) ----------
  G.define('r5_compareMixed', (r, o) => {
    const hard = !!o.hard;
    const names = r.pickN(NAMES, 3);
    const [n1, n2, n3] = names;
    let rates, t1, t2, t3, cards;
    if (hard) {
      // close rates, no description shows the rate for 1 minute, and the question may ask for the slowest
      const lo = r.int(38, 56);
      rates = r.pickN([lo, lo + 1, lo + 2, lo + 3], 3);
      [t1, t2, t3] = r.pickN([3, 4, 5, 6, 7], 3);
      cards = [
        `Types ${rates[0] * t1} words in ${t1} minutes.`,
        V.table(
          [
            ['Minutes', String(t2), String(t2 * 2)],
            ['Words', String(rates[1] * t2), String(rates[1] * t2 * 2)],
          ],
          { header: false, rowHeader: true, cls: 'mini' },
        ),
        `In ${t3} minutes, types ${rates[2] * t3} words.`,
      ];
    } else {
      rates = r.pickN([38, 42, 45, 48, 52, 55, 60], 3);
      t1 = r.int(3, 6);
      t2 = r.int(2, 4);
      t3 = 1;
      cards = [
        `Types ${rates[0] * t1} words in ${t1} minutes.`,
        V.table(
          [
            ['Minutes', String(t2), String(t2 * 2)],
            ['Words', String(rates[1] * t2), String(rates[1] * t2 * 2)],
          ],
          { header: false, rowHeader: true, cls: 'mini' },
        ),
        `Types ${rates[2]} words per minute.`,
      ];
    }
    const slow = hard && r.chance(0.5);
    const target = slow ? Math.min(...rates) : Math.max(...rates);
    const best = rates.indexOf(target);
    const word = slow ? 'slowest' : 'fastest';
    const totals = [rates[0] * t1, rates[1] * t2 * 2, rates[2] * t3];
    const sh = shuffleOptions(
      r,
      names.map((n, i) => ({ title: n, html: cards[i], ok: i === best, why: `${n} types ${rates[i]} words per minute, which is not the ${slow ? 'least' : 'greatest'} unit rate.` })),
      best,
    );
    return {
      type: 'who',
      skill: 'compare',
      lesson: '3-5',
      title: `Who types ${word}?`,
      prompt: `<p>Three students describe their typing speed in different ways. Who types the <b>${word}</b>?</p>`,
      options: sh.options,
      answer: sh.answer,
      layout: 'cards',
      hints: [
        'Change every description into a unit rate: words per 1 minute.',
        `${n1}: ${rates[0] * t1} ÷ ${t1}. ${n2}: ${rates[1] * t2} ÷ ${t2}. ${n3}: ${hard ? `${rates[2] * t3} ÷ ${t3}` : `already ${rates[2]} per minute`}.`,
        `The ${word} typist has the ${slow ? 'least' : 'greatest'} number of words per minute. Compare your three unit rates.`,
      ],
      hintEs: 'Cambia cada descripción a una tasa unitaria: palabras por 1 minuto.',
      solution: `<p>Unit rates: ${n1}: ${rates[0] * t1} ÷ ${t1} = ${rates[0]} words per minute. ${n2}: ${rates[1] * t2} ÷ ${t2} = ${rates[1]} words per minute. ${n3}: ${rates[2]} words per minute. <b>${names[best]}</b> is ${word}.</p>`,
      feedback: {
        correct: 'Correct. Different representations become easy to compare once each is a unit rate.',
        wrong(ans) {
          const pick = sh.options[ans];
          const i = pick ? names.indexOf(pick.title) : -1;
          if (i >= 0 && totals[i] === Math.max(...totals) && i !== best) return `${names[i]} shows the most words in total, but over more minutes. Compare words per 1 minute instead.`;
          return why(sh.options, ans) || 'Find words per minute for each student, then compare.';
        },
      },
    };
  });

  // ---------- Multi-step rate problem (num) ----------
  G.define('r5_multiStep', (r, o) => {
    const hard = !!o.hard;
    const easy = [
      () => {
        const g = r.int(2, 5),
          mpg = r.int(22, 36),
          G2 = r.int(g + 2, 12);
        return {
          prompt: `<p>A van uses ${hl(g + ' gallons')} of fuel to travel ${hl(g * mpg + ' miles')}. At this rate, how far can it travel on ${hl(G2 + ' gallons')}?</p>`,
          unit: 'miles',
          answer: mpg * G2,
          u: mpg,
          uLabel: 'miles per gallon',
          first: `${g * mpg} ÷ ${g}`,
          second: `${G2} × ${mpg}`,
          traps: [[g * mpg * G2, `You multiplied the total ${g * mpg} miles by ${G2}. First find the miles for 1 gallon.`]],
        };
      },
      () => {
        const h = r.int(2, 4),
          mph = r.int(3, 6),
          D = mph * r.int(h + 2, 9);
        return {
          prompt: `<p>A hiker walks ${hl(h * mph + ' miles')} in ${hl(h + ' hours')}. At this rate, how many hours will it take to walk ${hl(D + ' miles')}?</p>`,
          unit: 'hours',
          answer: D / mph,
          u: mph,
          uLabel: 'miles per hour',
          first: `${h * mph} ÷ ${h}`,
          second: `${D} ÷ ${mph}`,
          traps: [[D * mph, `You multiplied. Each hour covers ${mph} miles, so divide ${D} miles by ${mph}.`]],
        };
      },
      () => {
        const m = r.int(3, 6),
          lpm = r.int(4, 9),
          L = lpm * r.int(m + 3, 15);
        return {
          prompt: `<p>A pump moves ${hl(m * lpm + ' liters')} in ${hl(m + ' minutes')}. How long will it take to move ${hl(L + ' liters')}?</p>`,
          unit: 'minutes',
          answer: L / lpm,
          u: lpm,
          uLabel: 'liters per minute',
          first: `${m * lpm} ÷ ${m}`,
          second: `${L} ÷ ${lpm}`,
          traps: [[L * lpm, `You multiplied. Each minute moves ${lpm} liters, so divide ${L} liters by ${lpm}.`]],
        };
      },
    ];
    const tough = [
      // decimal unit rate
      () => {
        const g = r.pick([2, 4, 6]),
          mpg = r.int(22, 35) + 0.5,
          G2 = r.pick([8, 10, 12, 14].filter((x) => x !== g));
        return {
          prompt: `<p>A van uses ${hl(g + ' gallons')} of fuel to travel ${hl(g * mpg + ' miles')}. At this rate, how far can it travel on ${hl(G2 + ' gallons')}?</p>`,
          unit: 'miles',
          answer: mpg * G2,
          u: mpg,
          uLabel: 'miles per gallon',
          first: `${g * mpg} ÷ ${g}`,
          second: `${G2} × ${mpg}`,
          traps: [
            [Math.floor(mpg) * G2, `Keep the decimal in the unit rate. ${g * mpg} ÷ ${g} is not a whole number.`],
            [g * mpg * G2, `You multiplied the total ${g * mpg} miles by ${G2}. First find the miles for 1 gallon.`],
          ],
        };
      },
      // extra step: part of the trip is already done
      () => {
        const h = r.int(2, 4),
          mph = r.int(3, 6),
          D = mph * r.int(h + 4, 11),
          done = mph * r.int(1, 3);
        return {
          prompt: `<p>A hiker walks ${hl(h * mph + ' miles')} in ${hl(h + ' hours')}. The trail is ${hl(D + ' miles')} long, and the hiker has already walked ${hl(done + ' miles')} of it. At the same rate, how many <b>more</b> hours will it take to finish?</p>`,
          unit: 'hours',
          answer: (D - done) / mph,
          u: mph,
          uLabel: 'miles per hour',
          first: `${h * mph} ÷ ${h}`,
          second: `(${D} − ${done}) ÷ ${mph}`,
          traps: [
            [D / mph, `${D / mph} hours is the time for the whole trail. ${done} miles are already done, so use only the miles that are left.`],
            [(D - done) * mph, `You multiplied. Each hour covers ${mph} miles, so divide the miles left by ${mph}.`],
          ],
        };
      },
      // extra step: the tank already holds some water
      () => {
        const m = r.int(3, 6),
          lpm = r.int(4, 9),
          L = lpm * r.int(m + 6, 18),
          S = lpm * r.int(2, 5);
        return {
          prompt: `<p>A pump moves ${hl(m * lpm + ' liters')} in ${hl(m + ' minutes')}. A ${hl(L + '-liter')} tank already holds ${hl(S + ' liters')}. How many minutes will it take to fill the tank?</p>`,
          unit: 'minutes',
          answer: (L - S) / lpm,
          u: lpm,
          uLabel: 'liters per minute',
          first: `${m * lpm} ÷ ${m}`,
          second: `(${L} − ${S}) ÷ ${lpm}`,
          traps: [
            [L / lpm, `${L / lpm} minutes would fill an empty tank. The tank already holds ${S} liters, so pump only the liters that are missing.`],
            [(L - S) * lpm, `You multiplied. Each minute moves ${lpm} liters, so divide the liters left by ${lpm}.`],
          ],
        };
      },
    ];
    const v = r.pick(hard ? tough : easy)();
    const multi = /−/.test(v.second);
    return {
      type: 'num',
      skill: 'rate-problems',
      lesson: '3-5',
      title: 'Solve with a unit rate',
      prompt: v.prompt,
      unit: v.unit,
      answer: v.answer,
      hints: [
        multi ? 'Step 1: find the unit rate. Step 2: find how much is left. Step 3: use the unit rate on what is left.' : 'Step 1: find the unit rate. Step 2: use it to answer the question.',
        `Unit rate: ${v.first} = ${v.u} ${v.uLabel}.`,
        `Now compute ${v.second}.`,
      ],
      hintEs: multi
        ? 'Paso 1: encuentra la tasa unitaria. Paso 2: encuentra cuánto falta. Paso 3: usa la tasa unitaria con lo que falta.'
        : 'Paso 1: encuentra la tasa unitaria. Paso 2: úsala para responder la pregunta.',
      solution: `<p>Unit rate: ${v.first} = ${v.u} ${v.uLabel}. Then ${v.second} = <b>${v.answer} ${v.unit}</b>. Finding the amount for 1 first makes any amount easy to scale.</p>`,
      feedback: {
        correct: `Correct. Unit rate first (${v.u} ${v.uLabel}), then scale.`,
        wrong(ans, d) {
          if (near(d.value, v.u)) return `${v.u} is the unit rate, which is a great first step. Now use it to answer the actual question.`;
          const t = v.traps.find(([x]) => near(d.value, x));
          if (t) return t[1];
          return `Find the unit rate first: ${v.first}. Then use it for the amount in the question.`;
        },
      },
    };
  });

  // ---------- Order rates shown in different representations (seq) ----------
  G.define('r5_seqRunners', (r, o) => {
    const hard = !!o.hard;
    if (hard) {
      // four hikers, half-kilometer rates, and no representation shows the 1-hour value
      const names = r.pickN(NAMES, 4);
      const rates = r.pickN([4.5, 5, 5.5, 6, 6.5, 7, 7.5, 8], 4);
      const t4 = r.pick([4, 6]);
      const items = [
        { html: `<b>${names[0]}</b>: runs ${rates[0] * 2} km in 2 hours`, rate: rates[0] },
        {
          html: `<b>${names[1]}</b>:${V.table(
            [
              ['Hours', '2', '4'],
              ['km', String(rates[1] * 2), String(rates[1] * 4)],
            ],
            { header: false, rowHeader: true, cls: 'mini' },
          )}`,
          rate: rates[1],
        },
        { html: `<b>${names[2]}</b>:${V.dnl({ label: 'Hours', values: [0, 2, 4] }, { label: 'km', values: [0, rates[2] * 2, rates[2] * 4] })}`, rate: rates[2] },
        { html: `<b>${names[3]}</b>: covers ${rates[3] * t4} km in ${t4} hours`, rate: rates[3] },
      ];
      const order = items.map((it, i) => i).sort((a, b) => items[b].rate - items[a].rate);
      return {
        type: 'seq',
        skill: 'compare',
        lesson: '3-5',
        title: 'Order from fastest to slowest',
        prompt: `<p>Four hikers' speeds are shown in different ways. Put them in order from <b>fastest</b> (top) to <b>slowest</b> (bottom).</p>`,
        items,
        order,
        hints: [
          'Find kilometers per 1 hour for each hiker. None of the pictures shows 1 hour, so divide.',
          `${names[0]}: ${rates[0] * 2} ÷ 2. ${names[1]}: ${rates[1] * 2} ÷ 2. ${names[2]}: ${rates[2] * 2} ÷ 2. ${names[3]}: ${rates[3] * t4} ÷ ${t4}.`,
          'Some unit rates are halves, like 5.5. Order the four unit rates from greatest to least.',
        ],
        hintEs: 'Encuentra los kilómetros por 1 hora de cada excursionista. Ninguna representación muestra 1 hora, así que divide.',
        solution: `<p>Unit rates: ${names.map((n, i) => `${n} = ${rates[i]}`).join(', ')} km per hour. Fastest to slowest: <b>${order.map((i) => names[i]).join(', ')}</b>.</p>`,
        feedback: {
          correct: 'Correct. Convert each representation to a unit rate, then compare.',
          wrong(ans) {
            const a = Array.isArray(ans) ? ans : [];
            if (a.length === order.length && a.every((v, i) => v === order[order.length - 1 - i]))
              return 'You ordered them from slowest to fastest. The fastest hiker (greatest km per hour) goes on top.';
            return 'At least one hiker is out of place. Divide to find km per 1 hour for each one, then compare those numbers.';
          },
        },
      };
    }
    const [n1, n2, n3] = r.pickN(NAMES, 3);
    const rates = r.pickN([4, 5, 6, 7, 8, 9], 3);
    const items = [
      { html: `<b>${n1}</b>: runs ${rates[0] * 3} km in 3 hours`, rate: rates[0] },
      {
        html: `<b>${n2}</b>:${V.table(
          [
            ['Hours', '2', '4'],
            ['km', String(rates[1] * 2), String(rates[1] * 4)],
          ],
          { header: false, rowHeader: true, cls: 'mini' },
        )}`,
        rate: rates[1],
      },
      { html: `<b>${n3}</b>:${V.dnl({ label: 'Hours', values: [0, 1, 2] }, { label: 'km', values: [0, rates[2], rates[2] * 2] })}`, rate: rates[2] },
    ];
    const order = items.map((it, i) => i).sort((a, b) => items[b].rate - items[a].rate);
    return {
      type: 'seq',
      skill: 'compare',
      lesson: '3-5',
      title: 'Order from fastest to slowest',
      prompt: `<p>Three hikers' speeds are shown in different ways. Put them in order from <b>fastest</b> (top) to <b>slowest</b> (bottom).</p>`,
      items,
      order,
      hints: [
        'Find kilometers per 1 hour for each hiker.',
        `${n1}: ${rates[0] * 3} ÷ 3 = ${rates[0]}. ${n2}: ${rates[1] * 2} ÷ 2 = ${rates[1]}. ${n3}: read the value above 1 hour: ${rates[2]}.`,
        'Fastest has the greatest unit rate. Order the three unit rates from greatest to least.',
      ],
      hintEs: 'Encuentra los kilómetros por 1 hora de cada excursionista.',
      solution: `<p>Unit rates: ${n1} = ${rates[0]}, ${n2} = ${rates[1]}, ${n3} = ${rates[2]} km per hour. Fastest to slowest: <b>${order.map((i) => [n1, n2, n3][i]).join(', ')}</b>.</p>`,
      feedback: {
        correct: 'Correct. Convert each representation to a unit rate, then compare.',
        wrong(ans) {
          const a = Array.isArray(ans) ? ans : [];
          if (a.length === order.length && a.every((v, i) => v === order[order.length - 1 - i]))
            return 'You ordered them from slowest to fastest. The fastest hiker (greatest km per hour) goes on top.';
          return 'At least one hiker is out of place. Find km per hour for each one and compare those numbers.';
        },
      },
    };
  });

  // ---------- Error: comparing totals instead of rates ----------
  G.define('r5_errorTotals', (r, o) => {
    const hard = !!o.hard;
    const name = r.pick(NAMES);
    const rA = r.int(20, 35),
      dA = r.int(4, 6);
    // hard: Store B's unit rate is a half-cup decimal, and the fix asks for the difference in unit rates
    const dB = hard ? r.pick([2, 4].filter((x) => x < dA)) : r.int(2, 3);
    const rB = hard ? rA + r.int(1, 5) + 0.5 : rA + r.int(2, 6);
    const tA = rA * dA,
      tB = rB * dB;
    const sh = shuffleOptions(
      r,
      [
        { html: `${name} compared totals, but the number of days is different. Rates must be compared using the same number of days, such as per 1 day.`, ok: true },
        { html: `${name} should have added the two totals together and then compared each total to that sum.`, why: 'Adding totals does not compare the two stores. The days are still different.' },
        { html: `${name} is correct because ${tA} is greater than ${tB}, so Store A sold more cups.`, why: `${tA} is a bigger total, but it took ${dA} days instead of ${dB}. Compare per day.` },
        { html: `${name} should have subtracted ${tB} from ${tA} to see how much faster Store A is.`, why: 'The difference in totals does not tell you which store sells faster each day.' },
      ],
      0,
    );
    const fixLabel = hard ? 'How many more cups per day does Store B sell than Store A? ' : 'Store B sells how many cups per day? ';
    const fixAns = hard ? rB - rA : rB;
    return {
      type: 'error',
      skill: 'compare',
      lesson: '3-5',
      title: 'Find the comparison mistake',
      prompt: `<p>Store A sold ${hl(tA + ' cups')} of lemonade in ${hl(dA + ' days')}. Store B sold ${hl(tB + ' cups')} in ${hl(dB + ' days')}.</p><p>${name} says: "Store A sells faster because ${tA} is more than ${tB}."</p><p>What is wrong with this reasoning?</p>`,
      work: `${tA} > ${tB}, so Store A sells faster.`,
      options: sh.options,
      answer: sh.answer,
      fix: { label: fixLabel, answer: fixAns },
      hints: [
        'The totals cover different numbers of days. Is it fair to compare them directly?',
        `Find each store's cups per day: Store A ${tA} ÷ ${dA}, Store B ${tB} ÷ ${dB}.`,
        hard ? `Store A sells ${rA} per day. Find Store B's rate (it may be a decimal), then subtract Store A's rate from it.` : `Store A sells ${rA} per day. Now divide ${tB} by ${dB} for Store B.`,
      ],
      hintEs: 'Los totales son de diferentes números de días. ¿Es justo compararlos directamente?',
      solution: `<p>Store A: ${tA} ÷ ${dA} = ${rA} cups per day. Store B: ${tB} ÷ ${dB} = ${hard ? rB : `<b>${rB}</b>`} cups per day. Store B actually sells faster${hard ? `, by ${rB} − ${rA} = <b>${fixAns}</b> cups per day` : ''}. Totals over different times cannot be compared directly.</p>`,
      feedback: {
        correct: 'Correct. When the times differ, compare unit rates, not totals.',
        wrong(ans, d) {
          if (!d.mistakeOk) return why(sh.options, ans.mistake) || 'Think about whether the days are the same.';
          const f = RX.parseNum(ans.fix);
          if (near(f, tB)) return `${tB} is Store B's total for ${dB} days. Divide by ${dB} to get cups per 1 day.`;
          if (hard && near(f, rB)) return `${rB} is Store B's rate. The question asks how many <b>more</b> per day than Store A, so subtract ${rA}.`;
          if (hard && near(f, tA - tB)) return 'That compares the totals again. Subtract the two unit rates instead.';
          if (near(f, dB / tB)) return `You divided days by cups. Cups per day means cups ÷ days: ${tB} ÷ ${dB}.`;
          return hard ? `You found the mistake. For the fix, find both unit rates (cups ÷ days), then subtract.` : `You found the mistake. For Store B's rate, divide ${tB} by ${dB}.`;
        },
      },
    };
  });

  // ---------- Constructed response: equivalent rates ----------
  G.define('r5_crEquivalent', (r, o) => {
    const hard = !!o.hard;
    const name = r.pick(NAMES);
    // hard: half-page unit rates and a near miss of one page
    const rate = hard ? r.pick([11, 13, 15, 17, 19]) / 2 : r.int(5, 9);
    const t1 = hard ? r.pick([4, 6, 8]) : r.pick([4, 5, 6]);
    const t2 = hard ? r.pick([10, 12, 14]) : r.pick([8, 10, 12]);
    const equiv = r.chance(0.5);
    const p1 = rate * t1,
      p2 = equiv ? rate * t2 : rate * t2 + (hard ? r.pick([-1, 1]) : r.pick([-t2, t2, 2 * t2]));
    const u2 = round(p2 / t2, 2);
    const opts = [
      { html: equiv ? `Yes. ${p1} ÷ ${t1} = ${rate} and ${p2} ÷ ${t2} = ${rate}. Same unit rate.` : `No. ${p1} ÷ ${t1} = ${rate} but ${p2} ÷ ${t2} ≈ ${u2}. Different unit rates.`, ok: true },
      { html: equiv ? `No. ${p2} pages is more than ${p1} pages.` : 'Yes. Both are reading, so the rates are the same.', why: 'Compare unit rates (pages per day), not totals or activities.' },
    ];
    if (hard)
      opts.push({
        html: 'Yes. Week 2 has more pages and more days, so the rates balance out.',
        why: 'More pages and more days does not mean the same rate. Divide each total by its own number of days.',
      });
    else
      opts.push({
        html: `${equiv ? 'No' : 'Yes'}. ${p1} and ${p2} are both multiples of ${rate}.`,
        why: 'Being multiples of the same number is not enough. Each total must be divided by its own number of days.',
      });
    const sh = shuffleOptions(r, opts, 0);
    return {
      type: 'cr',
      skill: 'compare',
      lesson: '3-5',
      title: 'Explain: equivalent rates?',
      prompt: `<p>${name} read ${hl(p1 + ' pages')} in ${hl(t1 + ' days')}. The next week, ${name} read ${hl(p2 + ' pages')} in ${hl(t2 + ' days')}.</p><p>Are these rates equivalent? Explain your reasoning, then choose the correct explanation.</p>`,
      starters: ['The rates are / are not equivalent because …', 'First, I found pages per day by dividing …', 'A unit rate compares to 1 day, so …'],
      minWords: 10,
      check: { prompt: 'Which explanation is correct?', options: sh.options, answer: sh.answer },
      hints: [
        hard ? 'Find pages per day for each week. The unit rates may be decimals, so divide carefully.' : 'Find pages per day for each week.',
        `Week 1: ${p1} ÷ ${t1}. Week 2: ${p2} ÷ ${t2}.`,
        'Compare the two unit rates. Equivalent rates have the same number of pages per day.',
      ],
      hintEs: hard ? 'Encuentra las páginas por día de cada semana. Las tasas unitarias pueden ser decimales, así que divide con cuidado.' : 'Encuentra las páginas por día de cada semana.',
      solution: `<p>Model: "Week 1 is ${p1} ÷ ${t1} = ${rate} pages per day. Week 2 is ${p2} ÷ ${t2} ${equiv ? '=' : '≈'} ${u2} pages per day. ${equiv ? 'The unit rates are the same, so the rates are equivalent.' : 'The unit rates are different, so the rates are not equivalent.'}"</p>`,
      feedback: {
        correct: 'Correct. A clear explanation names both unit rates and compares them.',
        wrong(ans, d) {
          if (!d.wroteEnough) return 'Write a full explanation (a few sentences). Name both unit rates.';
          return why(sh.options, ans.check) || 'Compare pages per day for each week.';
        },
      },
    };
  });

  // ---------- Tape diagram error: subtracting instead of scaling (Q12 style) ----------
  G.define('r5_tapeError', (r, o) => {
    const hard = !!o.hard;
    const name = r.pick(NAMES);
    const [a, b] = r.pick([
      [7, 4],
      [5, 3],
      [8, 5],
      [6, 4],
      [9, 5],
      [7, 3],
    ]);
    const [i1, i2] = r.pick([
      ['muffins', 'bagels'],
      ['roses', 'tulips'],
      ['hardbacks', 'paperbacks'],
      ['apples', 'pears'],
    ]);
    const k = r.int(5, 9),
      diff = a - b;
    // hard: the known amount is the smaller row, so the wrong move is adding and the fix needs ÷ b then × a
    const known = hard ? b * k : a * k;
    const kn = hard ? i2 : i1,
      un = hard ? i1 : i2;
    const knBoxes = hard ? b : a,
      unBoxes = hard ? a : b;
    const wrongAns = hard ? known + diff : known - diff;
    const verb = hard ? 'added' : 'subtracted';
    const sh = shuffleOptions(
      r,
      [
        {
          html: `${name} ${verb} ${diff}. The ratio ${a} : ${b} means every group of ${a} ${i1} goes with ${b} ${i2}, so <b>both</b> parts must be multiplied by the same number of groups.`,
          ok: true,
        },
        {
          html: hard
            ? `${name} should have added ${a} instead of ${diff}, because each group has ${a} ${i1} in it.`
            : `${name} should have subtracted ${b} instead of ${diff}, because each group has ${b} ${i2} in it.`,
          why: `${hard ? 'Adding' : 'Subtracting'} any number is the wrong operation. Ratios scale by multiplying.`,
        },
        {
          html: `${name} is correct because ${a} − ${b} = ${diff}, and that difference is the same for every group.`,
          why: `${a} − ${b} = ${diff} is true, but "${diff} more" only holds for one group. With ${known} ${kn}, there are ${k} groups.`,
        },
        {
          html: hard ? `${name} should have subtracted ${diff} from ${known}, because there are fewer ${i2}.` : `${name} should have added ${diff} to ${known}, because there are more ${i1}.`,
          why: `${hard ? 'Subtracting' : 'Adding'} is also the wrong operation. Find how many groups of the ratio fit in the given amount.`,
        },
      ],
      0,
    );
    return {
      type: 'error',
      skill: 'tape',
      lesson: '3-5',
      title: 'Tape diagram error analysis',
      xp: o.xp || 15,
      prompt: `<p>A bakery sells ${hl(i1)} and ${hl(i2)} in a ratio of ${hl(a + ' : ' + b)}. ${name} drew this tape diagram.</p>${V.tape([
        { label: i1, boxes: a },
        { label: i2, boxes: b },
      ])}<p>${name} says: "There are ${diff} more ${i1} than ${i2}, so every group has ${diff} extra ${i1}." Later the bakery has ${hl(known + ' ' + kn)}, and ${name} decides there must be ${hl(wrongAns + ' ' + un)} by ${hard ? 'adding' : 'subtracting'} ${diff}.</p><p>Why is ${name}'s reasoning incorrect?</p>`,
      work: hard ? `${known} + ${diff} = ${wrongAns} ${un}` : `${known} − ${diff} = ${wrongAns} ${un}`,
      options: sh.options,
      answer: sh.answer,
      fix: { label: `Correct number of ${un} when there are ${known} ${kn}: `, answer: unBoxes * k },
      hints: [
        `The ${kn} row has ${knBoxes} boxes and represents ${known}. What is each box worth?`,
        `${known} ÷ ${knBoxes} = ${k}. Each box stands for ${k} items.`,
        `The ${un} row has ${unBoxes} boxes. Multiply ${unBoxes} by ${k}.`,
      ],
      hintEs: `La fila de ${kn} tiene ${knBoxes} cajas y vale ${known}. ¿Cuánto vale cada caja del diagrama de cinta?`,
      solution: `<p>Each box represents ${known} ÷ ${knBoxes} = ${k}. The ${un} row has ${unBoxes} boxes, so ${unBoxes} × ${k} = <b>${unBoxes * k} ${un}</b>. ${hard ? 'Adding' : 'Subtracting'} ${diff} only works when each box equals 1. The difference grows with the number of groups: here it is ${diff} × ${k} = ${diff * k}.</p>${V.tape(
        [
          { label: i1, boxes: a, value: k, total: a * k },
          { label: i2, boxes: b, value: k, total: b * k },
        ],
      )}`,
      feedback: {
        correct: `Correct. Ratios are multiplicative. Each box is worth ${k}, so the ${un} count is ${unBoxes} × ${k} = ${unBoxes * k}.`,
        wrong(ans, d) {
          if (!d.mistakeOk) return why(sh.options, ans.mistake) || 'Think about what one box is worth.';
          const f = RX.parseNum(ans.fix);
          if (f === wrongAns) return `That is ${name}'s answer. ${hard ? 'Adding' : 'Subtracting'} ${diff} is the mistake. Find the value of one box instead.`;
          if (f === k) return `${k} is the value of one box. The ${un} row has ${unBoxes} boxes, so multiply.`;
          if (f === known * unBoxes) return `Divide first: ${known} ÷ ${knBoxes} gives the value of one box. Then multiply by ${unBoxes}.`;
          return `Right diagnosis. For the fix: ${known} ÷ ${knBoxes} = ${k} per box, then ${unBoxes} boxes × ${k}.`;
        },
      },
    };
  });
})(typeof window !== 'undefined' ? window : globalThis);

/* js/units/u3/gen-convert-lib.js */
/* Zone 6 — Surveyor's Vault. Lessons 3-6 Converting Within One System and 3-7 Converting Between Systems. */
/* Shared helpers for gen-convert.js and gen-convert-2.js (split for size). */
(function (root) {
  'use strict';
  const RX = root.RX;
  const { G, V, shuffleOptions, NAMES, round, fmt } = RX;
  const hl = V.hl;
  const why = (opts, i) => (opts[i] && opts[i].why) || null;
  const near = (v, x, tol) => v != null && Math.abs(v - x) < (tol == null ? 0.011 : tol);

  const WITHIN = [
    { from: 'feet', to: 'yards', f: 3, dir: 'div', sys: 'customary' },
    { from: 'inches', to: 'feet', f: 12, dir: 'div', sys: 'customary' },
    { from: 'yards', to: 'feet', f: 3, dir: 'mul', sys: 'customary' },
    { from: 'feet', to: 'inches', f: 12, dir: 'mul', sys: 'customary' },
    { from: 'cups', to: 'pints', f: 2, dir: 'div', sys: 'customary' },
    { from: 'quarts', to: 'cups', f: 4, dir: 'mul', sys: 'customary' },
    { from: 'gallons', to: 'quarts', f: 4, dir: 'mul', sys: 'customary' },
    { from: 'pounds', to: 'ounces', f: 16, dir: 'mul', sys: 'customary' },
    { from: 'ounces', to: 'pounds', f: 16, dir: 'div', sys: 'customary' },
    { from: 'minutes', to: 'hours', f: 60, dir: 'div', sys: 'time' },
    { from: 'hours', to: 'minutes', f: 60, dir: 'mul', sys: 'time' },
    { from: 'meters', to: 'centimeters', f: 100, dir: 'mul', sys: 'metric' },
    { from: 'centimeters', to: 'meters', f: 100, dir: 'div', sys: 'metric' },
    { from: 'kilograms', to: 'grams', f: 1000, dir: 'mul', sys: 'metric' },
    { from: 'grams', to: 'kilograms', f: 1000, dir: 'div', sys: 'metric' },
    { from: 'liters', to: 'milliliters', f: 1000, dir: 'mul', sys: 'metric' },
    { from: 'kilometers', to: 'meters', f: 1000, dir: 'mul', sys: 'metric' },
  ];
  // two-step conversions within one system (hard mode)
  const TWO = [
    { from: 'yards', via: 'feet', to: 'inches', f1: 3, f2: 12, dir: 'mul' },
    { from: 'gallons', via: 'quarts', to: 'cups', f1: 4, f2: 4, dir: 'mul' },
    { from: 'hours', via: 'minutes', to: 'seconds', f1: 60, f2: 60, dir: 'mul' },
    { from: 'kilometers', via: 'meters', to: 'centimeters', f1: 1000, f2: 100, dir: 'mul' },
    { from: 'inches', via: 'feet', to: 'yards', f1: 12, f2: 3, dir: 'div' },
    { from: 'cups', via: 'quarts', to: 'gallons', f1: 4, f2: 4, dir: 'div' },
  ];
  const BETWEEN = [
    { from: 'inches', to: 'centimeters', f: 2.54, exact: true },
    { from: 'kilograms', to: 'pounds', f: 2.2 },
    { from: 'miles', to: 'kilometers', f: 1.61 },
    { from: 'gallons', to: 'liters', f: 3.79 },
    { from: 'feet', to: 'meters', f: 0.305 },
    { from: 'ounces', to: 'grams', f: 28.35 },
  ];
  // starting values for the reverse (divide) direction of each BETWEEN row (hard mode)
  const REV_RANGE = { centimeters: [20, 90], pounds: [20, 80], kilometers: [10, 50], liters: [10, 40], meters: [10, 60], grams: [100, 500] };
  const REF = `<table class="viz-table compact ref"><tr><th>Customary ↔ Metric</th><th>Within customary</th><th>Within metric</th></tr>
    <tr><td>1 inch = 2.54 centimeters</td><td>1 foot = 12 inches</td><td>1 meter = 100 centimeters</td></tr>
    <tr><td>1 foot ≈ 0.305 meter</td><td>1 yard = 3 feet</td><td>1 kilometer = 1,000 meters</td></tr>
    <tr><td>1 mile ≈ 1.61 kilometers</td><td>1 pound = 16 ounces</td><td>1 kilogram = 1,000 grams</td></tr>
    <tr><td>1 kilogram ≈ 2.2 pounds</td><td>1 cup = 8 fluid ounces</td><td>1 liter = 1,000 milliliters</td></tr>
    <tr><td>1 ounce ≈ 28.35 grams</td><td>1 pint = 2 cups</td><td></td></tr>
    <tr><td>1 gallon ≈ 3.79 liters</td><td>1 quart = 4 cups · 1 gallon = 4 quarts</td><td></td></tr></table>`;
  RX.REFERENCE_SHEET = REF;
  const STORY = {
    feet: (n) => `A trail is ${n} long.`,
    inches: (n) => `A board is ${n} long.`,
    yards: (n) => `A field is ${n} long.`,
    cups: (n) => `A camp kitchen has ${n} of broth.`,
    quarts: (n) => `A cooler holds ${n}.`,
    gallons: (n) => `A tank holds ${n}.`,
    pounds: (n) => `A pack weighs ${n}.`,
    ounces: (n) => `A bag of trail mix weighs ${n}.`,
    minutes: (n) => `A hike lasts ${n}.`,
    hours: (n) => `A climb takes ${n}.`,
    meters: (n) => `A rope is ${n} long.`,
    centimeters: (n) => `A map is ${n} wide.`,
    kilograms: (n) => `A crate weighs ${n}.`,
    grams: (n) => `A rock sample weighs ${n}.`,
    liters: (n) => `A jug holds ${n}.`,
    kilometers: (n) => `A river section is ${n} long.`,
    miles: (n) => `A road is ${n} long.`,
  };
  const SING = {
    feet: 'foot',
    inches: 'inch',
    yards: 'yard',
    miles: 'mile',
    cups: 'cup',
    pints: 'pint',
    quarts: 'quart',
    gallons: 'gallon',
    pounds: 'pound',
    ounces: 'ounce',
    minutes: 'minute',
    hours: 'hour',
    seconds: 'second',
    meters: 'meter',
    centimeters: 'centimeter',
    kilometers: 'kilometer',
    grams: 'gram',
    kilograms: 'kilogram',
    liters: 'liter',
    milliliters: 'milliliter',
  };
  const sg = (u) => SING[u] || u;
  const ES = {
    feet: ['pie', 'pies', 'm'],
    inches: ['pulgada', 'pulgadas', 'f'],
    yards: ['yarda', 'yardas', 'f'],
    miles: ['milla', 'millas', 'f'],
    cups: ['taza', 'tazas', 'f'],
    pints: ['pinta', 'pintas', 'f'],
    quarts: ['cuarto de galón', 'cuartos de galón', 'm'],
    gallons: ['galón', 'galones', 'm'],
    pounds: ['libra', 'libras', 'f'],
    ounces: ['onza', 'onzas', 'f'],
    minutes: ['minuto', 'minutos', 'm'],
    hours: ['hora', 'horas', 'f'],
    seconds: ['segundo', 'segundos', 'm'],
    meters: ['metro', 'metros', 'm'],
    centimeters: ['centímetro', 'centímetros', 'm'],
    kilometers: ['kilómetro', 'kilómetros', 'm'],
    grams: ['gramo', 'gramos', 'm'],
    kilograms: ['kilogramo', 'kilogramos', 'm'],
    liters: ['litro', 'litros', 'm'],
    milliliters: ['mililitro', 'mililitros', 'm'],
  };
  const es = (u) => ES[u][1];
  const es1 = (u) => ES[u][0];
  const cuantos = (u) => (ES[u][2] === 'f' ? 'Cuántas' : 'Cuántos');
  const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
  // bigger and smaller unit of a one-step conversion
  const bigOf = (c) => (c.dir === 'mul' ? c.from : c.to);
  const smallOf = (c) => (c.dir === 'mul' ? c.to : c.from);

  function withinValue(r, c) {
    if (c.from === 'feet' && c.to === 'yards') return 3 * r.int(200, 900);
    if (c.dir === 'div') return c.f * r.int(c.f >= 100 ? 2 : 3, c.f >= 100 ? 9 : 12);
    return r.int(2, c.f >= 100 ? 9 : 15);
  }

  // ---------- Convert within a system (num) ----------
  // ---------- Multiply or divide? (who) ----------
  const REM = { 2: [1], 12: [3, 6, 9], 16: [4, 8, 12], 60: [15, 30, 45] };
  // ---------- Conversion ratio table ----------
  // ---------- Match equivalent measures ----------
  // ---------- Kilograms to pounds, best approximation (MC) ----------
  // ---------- Convert between systems (num) ----------
  // ---------- Two-step conversion (num) ----------
  // ---------- Sort conversions: multiply or divide ----------
  const BETWEEN_DIR = [
    { from: 'miles', to: 'kilometers', fact: '1 mile ≈ 1.61 kilometers', dir: 'mul' },
    { from: 'kilometers', to: 'miles', fact: '1 mile ≈ 1.61 kilometers', dir: 'div' },
    { from: 'kilograms', to: 'pounds', fact: '1 kilogram ≈ 2.2 pounds', dir: 'mul' },
    { from: 'pounds', to: 'kilograms', fact: '1 kilogram ≈ 2.2 pounds', dir: 'div' },
    { from: 'inches', to: 'centimeters', fact: '1 inch = 2.54 centimeters', dir: 'mul' },
    { from: 'centimeters', to: 'inches', fact: '1 inch = 2.54 centimeters', dir: 'div' },
    { from: 'gallons', to: 'liters', fact: '1 gallon ≈ 3.79 liters', dir: 'mul' },
    { from: 'liters', to: 'gallons', fact: '1 gallon ≈ 3.79 liters', dir: 'div' },
    { from: 'ounces', to: 'grams', fact: '1 ounce ≈ 28.35 grams', dir: 'mul' },
    { from: 'grams', to: 'ounces', fact: '1 ounce ≈ 28.35 grams', dir: 'div' },
  ];
  RX._lib = RX._lib || {};
  RX._lib['u3/gen-convert'] = {
    G,
    V,
    shuffleOptions,
    NAMES,
    round,
    fmt,
    hl,
    why,
    near,
    WITHIN,
    TWO,
    BETWEEN,
    REV_RANGE,
    REF,
    STORY,
    SING,
    sg,
    ES,
    es,
    es1,
    cuantos,
    cap,
    bigOf,
    smallOf,
    withinValue,
    REM,
    BETWEEN_DIR,
  };
})(typeof window !== 'undefined' ? window : globalThis);

/* js/units/u3/gen-convert.js */
/* Zone 6 — Surveyor's Vault. Lessons 3-6 Converting Within One System and 3-7 Converting Between Systems. */
(function (root) {
  'use strict';
  const RX = root.RX;
  const { G, V, shuffleOptions, NAMES, round, fmt, hl, why, near, WITHIN, TWO, BETWEEN, REV_RANGE, REF, STORY, SING, sg, ES, es, es1, cuantos, cap, bigOf, smallOf, withinValue, REM, BETWEEN_DIR } =
    RX._lib['u3/gen-convert'];

  G.define('r6_within', (r, o) => {
    const hard = !!o.hard;
    const name = r.pick(NAMES);
    if (hard) {
      // two-step conversion, often with a half-unit starting value
      const c = r.pick(TWO),
        F = c.f1 * c.f2,
        half = r.chance(0.5) ? 0.5 : 0;
      const n = c.dir === 'mul' ? r.int(2, 6) + half : F * (r.int(2, 9) + half);
      const mid = c.dir === 'mul' ? n * c.f1 : n / c.f1;
      const ans = c.dir === 'mul' ? n * F : n / F;
      const op = c.dir === 'mul' ? '×' : '÷';
      return {
        type: 'num',
        skill: 'convert-within',
        lesson: '3-6',
        title: 'Convert in two steps',
        prompt: `<p>${STORY[c.from](hl(fmt(n) + ' ' + c.from))}</p><p>How many ${hl(c.to)} is that?</p>`,
        unit: c.to,
        answer: ans,
        reference: true,
        hints: [
          `There is no single fact for ${c.from} to ${c.to}. Go through ${c.via}: first ${c.from} → ${c.via}, then ${c.via} → ${c.to}.`,
          c.dir === 'mul'
            ? `1 ${sg(c.from)} = ${fmt(c.f1)} ${c.via} and 1 ${sg(c.via)} = ${fmt(c.f2)} ${c.to}. Both steps go to smaller units, so multiply both times.`
            : `1 ${sg(c.via)} = ${fmt(c.f1)} ${c.from} and 1 ${sg(c.to)} = ${fmt(c.f2)} ${c.via}. Both steps go to bigger units, so divide both times.`,
          `Step 1: ${fmt(n)} ${op} ${fmt(c.f1)} = ${fmt(mid)} ${c.via}. Step 2: ${fmt(mid)} ${op} ${fmt(c.f2)}.`,
        ],
        hintEs: `No hay un solo dato para pasar de ${es(c.from)} a ${es(c.to)}. Pasa por ${es(c.via)}: primero ${es(c.from)} → ${es(c.via)}, y después ${es(c.via)} → ${es(c.to)}.`,
        solution: `<p>Step 1: ${fmt(n)} ${c.from} ${op} ${fmt(c.f1)} = ${fmt(mid)} ${c.via}. Step 2: ${fmt(mid)} ${c.via} ${op} ${fmt(c.f2)} = <b>${fmt(ans)} ${c.to}</b>. ${c.dir === 'mul' ? 'Each step goes to a smaller unit, so the number gets bigger.' : 'Each step goes to a bigger unit, so the number gets smaller.'} In one step: ${op} ${fmt(F)}, because 1 ${sg(c.dir === 'mul' ? c.from : c.to)} = ${fmt(F)} ${c.dir === 'mul' ? c.to : c.from}.</p>`,
        feedback: {
          correct: `Correct. ${c.from} → ${c.via} → ${c.to}: ${op} ${fmt(c.f1)}, then ${op} ${fmt(c.f2)}.`,
          wrong(a, d) {
            const v = d.value;
            if (near(v, mid)) return `${fmt(mid)} is the number of ${c.via}. That is only step 1. Now convert ${c.via} to ${c.to}.`;
            if (near(v, c.dir === 'mul' ? n * c.f2 : n / c.f2)) return `You used only the ${c.via}-to-${c.to} fact. Convert ${c.from} to ${c.via} first, then to ${c.to}.`;
            if (near(v, c.dir === 'mul' ? n / F : n * F))
              return `You went the wrong direction. ${cap(c.to)} are ${c.dir === 'mul' ? 'smaller' : 'bigger'} than ${c.from}, so the answer should be ${c.dir === 'mul' ? 'more' : 'fewer'} ${c.to}: ${c.dir === 'mul' ? 'multiply' : 'divide'} both times.`;
            return `Work in two steps through ${c.via}, and ${c.dir === 'mul' ? 'multiply' : 'divide'} each time.`;
          },
        },
      };
    }
    const c = r.pick(o.pool || WITHIN);
    const n = withinValue(r, c);
    const ans = c.dir === 'div' ? n / c.f : n * c.f;
    const story =
      c.from === 'feet' && c.to === 'yards' ? `${name} walks to the library. The library is ${hl(n.toLocaleString() + ' feet')} away.` : STORY[c.from](hl(n.toLocaleString() + ' ' + c.from));
    const big = bigOf(c),
      small = smallOf(c);
    return {
      type: 'num',
      skill: 'convert-within',
      lesson: '3-6',
      title: 'Convert the measurement',
      prompt: `<p>${story}</p><p>How many ${hl(c.to)} is that?</p>`,
      unit: c.to,
      answer: ans,
      reference: true,
      hints: [
        `How many ${small} make 1 ${sg(big)}? Check the reference sheet.`,
        c.dir === 'div'
          ? `1 ${sg(c.to)} = ${fmt(c.f)} ${c.from}. Going from a smaller unit to a bigger unit, you need fewer of them: divide.`
          : `1 ${sg(c.from)} = ${fmt(c.f)} ${c.to}. Going from a bigger unit to a smaller unit, you need more of them: multiply.`,
        c.dir === 'div' ? `${n.toLocaleString()} ÷ ${fmt(c.f)}` : `${n} × ${fmt(c.f)}`,
      ],
      hintEs: `¿${cuantos(small)} ${es(small)} hay en 1 ${es1(big)}? Revisa la hoja de referencia.`,
      solution: `<p>${c.dir === 'div' ? `${n.toLocaleString()} ${c.from} ÷ ${fmt(c.f)} = <b>${fmt(ans)} ${c.to}</b>. Bigger unit, so fewer of them: divide.` : `${n} ${c.from} × ${fmt(c.f)} = <b>${fmt(ans)} ${c.to}</b>. Smaller unit, so more of them: multiply.`}</p>`,
      feedback: {
        correct: `Correct. ${c.dir === 'div' ? 'Dividing' : 'Multiplying'} by ${fmt(c.f)} converts ${c.from} to ${c.to}.`,
        wrong(ans2, d) {
          const v = d.value;
          if (near(v, c.dir === 'div' ? n * c.f : n / c.f))
            return `You went the wrong direction. ${cap(c.to)} are ${c.dir === 'div' ? 'bigger' : 'smaller'} than ${c.from}, so you need ${c.dir === 'div' ? 'fewer' : 'more'} of them: ${c.dir === 'div' ? 'divide' : 'multiply'} by ${fmt(c.f)}.`;
          if (near(v, c.dir === 'div' ? n - c.f : n + c.f))
            return `You ${c.dir === 'div' ? 'subtracted' : 'added'} ${fmt(c.f)}. A conversion is a ratio: ${c.dir === 'div' ? 'divide' : 'multiply'} by the conversion factor.`;
          return `Use 1 ${sg(big)} = ${fmt(c.f)} ${small}. ${c.dir === 'div' ? 'Divide' : 'Multiply'} by ${fmt(c.f)}.`;
        },
      },
    };
  });

  G.define('r6_direction', (r, o) => {
    const hard = !!o.hard;
    const [n1, n2, n3] = r.pickN(NAMES, 3);
    if (hard) {
      // smaller → bigger unit with a remainder: the answer is a decimal, and the trap is writing the remainder after the point
      const c = r.pick(WITHIN.filter((w) => w.dir === 'div' && REM[w.f]));
      const k = r.int(3, 9),
        rem = r.pick(REM[c.f]),
        n = k * c.f + rem,
        ans = n / c.f;
      const sh = shuffleOptions(
        r,
        [
          { title: n1, html: `${n} ÷ ${c.f} = ${fmt(ans)}<br><b>${fmt(ans)} ${c.to}</b>`, ok: true },
          {
            title: n2,
            html: `${n} ÷ ${c.f} = ${k} R ${rem}<br><b>${k}.${rem} ${c.to}</b>`,
            why: `${n2} wrote the remainder after the decimal point. ${k} R ${rem} means ${k} ${c.to} and ${rem} ${c.from}, and ${rem} ${c.from} is ${V.frac(rem, c.f)} of a ${sg(c.to)}, not .${rem}.`,
          },
          {
            title: n3,
            html: `${n} × ${c.f} = ${fmt(n * c.f)}<br><b>${fmt(n * c.f)} ${c.to}</b>`,
            why: `${n3} multiplied. ${cap(c.to)} are bigger than ${c.from}, so there should be fewer of them: divide.`,
          },
        ],
        0,
      );
      return {
        type: 'who',
        skill: 'convert-within',
        lesson: '3-6',
        title: 'Multiply or divide?',
        prompt: `<p>Convert ${hl(n + ' ' + c.from)} to ${hl(c.to)}. Write the answer as a decimal. Three students show their work. Who is correct?</p>`,
        options: sh.options,
        answer: sh.answer,
        layout: 'cards',
        reference: true,
        hints: [
          `1 ${sg(c.to)} = ${c.f} ${c.from}. ${cap(c.to)} are bigger, so divide. The answer will not be a whole number.`,
          `${n} ÷ ${c.f} = ${k} with ${rem} ${c.from} left over. Those ${rem} ${c.from} are ${V.frac(rem, c.f)} of a ${sg(c.to)}.`,
          `Write ${V.frac(rem, c.f)} as a decimal, then add it to ${k}.`,
        ],
        hintEs: `1 ${es1(c.to)} = ${c.f} ${es(c.from)}. ${ES[c.to][2] === 'f' ? 'Las' : 'Los'} ${es(c.to)} son más grandes, así que divides. La respuesta no será un número entero.`,
        solution: `<p>${cap(c.to)} are bigger than ${c.from}, so divide: ${n} ÷ ${c.f} = ${k} R ${rem}. The remainder is ${rem} ${c.from} = ${V.frac(rem, c.f)} ${sg(c.to)} = ${fmt(rem / c.f)} ${sg(c.to)}. So ${n} ${c.from} = <b>${fmt(ans)} ${c.to}</b>. ${n1} is correct. A remainder is not the digits after the decimal point.</p>`,
        feedback: {
          correct: `Correct. ${rem} ${c.from} left over is ${V.frac(rem, c.f)} of a ${sg(c.to)}, so the answer is ${fmt(ans)}.`,
          wrong: (a) => why(sh.options, a) || 'Decide whether to multiply or divide, then turn any remainder into a fraction of the new unit.',
        },
      };
    }
    const c = r.pick(WITHIN.filter((w) => w.f <= 60)),
      n = r.int(3, 9) * (c.dir === 'div' ? c.f : 1);
    const right = c.dir === 'div' ? `${n} ÷ ${c.f} = ${n / c.f}` : `${n} × ${c.f} = ${n * c.f}`;
    const wrongDir = c.dir === 'div' ? `${n} × ${c.f} = ${n * c.f}` : `${n} ÷ ${c.f} = ${round(n / c.f, 2)}`;
    const big = bigOf(c),
      small = smallOf(c);
    const sh = shuffleOptions(
      r,
      [
        { title: n1, html: `${right}<br><b>${c.dir === 'div' ? n / c.f : n * c.f} ${c.to}</b>`, ok: true },
        {
          title: n2,
          html: `${wrongDir}<br><b>${c.dir === 'div' ? n * c.f : round(n / c.f, 2)} ${c.to}</b>`,
          why: `${n2} went the wrong direction. ${cap(c.to)} are ${c.dir === 'div' ? 'bigger' : 'smaller'} units than ${c.from}, so there should be ${c.dir === 'div' ? 'fewer' : 'more'} of them.`,
        },
        {
          title: n3,
          html: `${n} ${c.dir === 'div' ? '−' : '+'} ${c.f} = ${c.dir === 'div' ? n - c.f : n + c.f}<br><b>${c.dir === 'div' ? n - c.f : n + c.f} ${c.to}</b>`,
          why: `${n3} ${c.dir === 'div' ? 'subtracted' : 'added'}. Converting units is a ratio, so you multiply or divide by the conversion factor.`,
        },
      ],
      0,
    );
    return {
      type: 'who',
      skill: 'convert-within',
      lesson: '3-6',
      title: 'Multiply or divide?',
      prompt: `<p>Convert ${hl(n + ' ' + c.from)} to ${hl(c.to)}. Three students show their work. Who is correct?</p>`,
      options: sh.options,
      answer: sh.answer,
      layout: 'cards',
      reference: true,
      hints: [
        `Use the fact 1 ${sg(big)} = ${c.f} ${small}. Is the new unit bigger or smaller than the old one?`,
        `Are ${c.to} bigger or smaller than ${c.from}? Bigger units mean fewer of them (divide). Smaller units mean more (multiply).`,
        c.dir === 'div' ? `${cap(c.to)} are bigger, so divide ${n} by ${c.f}.` : `${cap(c.to)} are smaller, so multiply ${n} by ${c.f}.`,
      ],
      hintEs: `Usa el dato 1 ${es1(big)} = ${c.f} ${es(small)}. ¿La nueva unidad es más grande o más pequeña que la unidad original?`,
      solution: `<p>1 ${sg(big)} = ${c.f} ${small}. ${cap(c.to)} are ${c.dir === 'div' ? 'bigger' : 'smaller'} than ${c.from}, so you need ${c.dir === 'div' ? 'fewer' : 'more'} of them: <b>${c.dir === 'div' ? 'divide' : 'multiply'}</b>. ${right}, so the answer is <b>${c.dir === 'div' ? n / c.f : n * c.f} ${c.to}</b>. ${n1} is correct. Adding or subtracting the factor never converts units.</p>`,
      feedback: {
        correct: 'Correct. Bigger unit → divide; smaller unit → multiply. Never add or subtract.',
        wrong: (a) => why(sh.options, a) || 'Ask whether the new unit is bigger or smaller, then multiply or divide by the conversion factor.',
      },
    };
  });

  G.define('r6_table', (r, o) => {
    const hard = !!o.hard;
    const c = r.pick(WITHIN.filter((w) => w.dir === 'mul' && w.f <= 60));
    const From = cap(c.from),
      To = cap(c.to);
    if (hard) {
      // half-unit column, non-adjacent missing values, a big column
      const h = r.pick([1.5, 2.5, 3.5]),
        k1 = r.int(5, 8),
        k3 = r.int(12, 15);
      const inputs = [
        { id: 'y1', answer: h * c.f },
        { id: 'x1', answer: k1 },
        { id: 'y2', answer: 10 * c.f },
        { id: 'y3', answer: k3 * c.f },
      ];
      return {
        type: 'table',
        skill: 'convert-within',
        lesson: '3-6',
        title: 'Complete the conversion table',
        prompt: `<p>The table converts ${hl(c.from)} to ${hl(c.to)}. Some columns use half units. Complete it.</p>`,
        rows: [
          [From, '1', fmt(h), '__IN:x1__', '10', String(k3)],
          [To, String(c.f), '__IN:y1__', String(k1 * c.f), '__IN:y2__', '__IN:y3__'],
        ],
        rowHeader: true,
        inputs,
        hints: [
          `1 ${sg(c.from)} = ${c.f} ${c.to}. Every column keeps the ratio 1 : ${c.f}, even the half-unit column.`,
          `${From} → ${c.to}: multiply by ${c.f}. ${To} → ${c.from}: divide by ${c.f}. For ${fmt(h)}, think ${Math.floor(h)} and one half.`,
          `${fmt(h)} × ${c.f}: ${Math.floor(h)} × ${c.f} = ${Math.floor(h) * c.f}, plus half of ${c.f}. For the missing ${c.from}, divide ${k1 * c.f} by ${c.f}.`,
        ],
        hintEs: `1 ${es1(c.from)} = ${c.f} ${es(c.to)}. Cada columna mantiene la razón 1 : ${c.f}, incluso la columna con media unidad.`,
        solution: `<p>Every column is 1 : ${c.f}. ${fmt(h)} ${c.from} = ${fmt(h)} × ${c.f} = <b>${fmt(h * c.f)}</b> ${c.to}; ${k1 * c.f} ${c.to} = ${k1 * c.f} ÷ ${c.f} = <b>${k1}</b> ${c.from}; 10 ${c.from} = <b>${10 * c.f}</b> ${c.to}; ${k3} ${c.from} = <b>${k3 * c.f}</b> ${c.to}.</p>`,
        feedback: {
          correct: 'Correct. A conversion table is a ratio table: multiply by the factor one way, divide the other way.',
          wrong(ans, d) {
            const w = d.wrong || [];
            if (w.includes('x1') && near(RX.parseNum(ans.x1), k1 * c.f * c.f)) return `For the missing ${c.from}, you multiplied ${k1 * c.f} by ${c.f}. Going from ${c.to} back to ${c.from}, divide.`;
            if (w.includes('y1') && near(RX.parseNum(ans.y1), Math.floor(h) * c.f))
              return `You left out the half. ${fmt(h)} ${c.from} is ${Math.floor(h)} ${c.from} plus half a ${sg(c.from)}, and half a ${sg(c.from)} is ${fmt(c.f / 2)} ${c.to}.`;
            if (w.includes('x1')) return `For the missing ${c.from}, divide ${k1 * c.f} by ${c.f}.`;
            return `Multiply the number of ${c.from} by ${c.f} to get ${c.to}.`;
          },
        },
      };
    }
    const xs = [1, 2, 3, r.int(5, 8)];
    const inputs = [
      { id: 'y1', answer: c.f * 2 },
      { id: 'y2', answer: c.f * xs[3] },
      { id: 'x1', answer: 4 },
    ];
    return {
      type: 'table',
      skill: 'convert-within',
      lesson: '3-6',
      title: 'Complete the conversion table',
      prompt: `<p>The table converts ${hl(c.from)} to ${hl(c.to)}. Complete it.</p>`,
      rows: [
        [From, '1', '2', '3', '__IN:x1__', String(xs[3])],
        [To, String(c.f), '__IN:y1__', String(c.f * 3), String(c.f * 4), '__IN:y2__'],
      ],
      rowHeader: true,
      inputs,
      hints: [
        `1 ${sg(c.from)} = ${c.f} ${c.to}. This is a ratio table with the ratio 1 : ${c.f}.`,
        `Multiply ${c.from} by ${c.f} to get ${c.to}. Divide ${c.to} by ${c.f} to get ${c.from}.`,
        `2 × ${c.f}; ${c.f * 4} ÷ ${c.f}; ${xs[3]} × ${c.f}.`,
      ],
      hintEs: `1 ${es1(c.from)} = ${c.f} ${es(c.to)}. Esta es una tabla de razones con la razón 1 : ${c.f}.`,
      solution: `<p>Every column is 1 : ${c.f}. 2 ${c.from} = <b>${c.f * 2}</b> ${c.to}; ${c.f * 4} ${c.to} = <b>4</b> ${c.from}; ${xs[3]} ${c.from} = <b>${c.f * xs[3]}</b> ${c.to}.</p>`,
      feedback: {
        correct: 'Correct. A conversion is just a ratio table where one row is 1.',
        wrong(ans, d) {
          const w = d.wrong || [];
          if (w.includes('x1') && near(RX.parseNum(ans.x1), c.f * 4 * c.f)) return `For the missing ${c.from}, you multiplied ${c.f * 4} by ${c.f}. Going back to ${c.from}, divide.`;
          if (w.includes('x1')) return `For the missing ${c.from}, divide ${c.f * 4} by ${c.f}.`;
          if (w.includes('y1') && near(RX.parseNum(ans.y1), c.f + 1)) return `You added 1 to ${c.f}. In a ratio table, 2 ${c.from} is 2 × ${c.f} ${c.to}.`;
          return `Multiply the number of ${c.from} by ${c.f}.`;
        },
      },
    };
  });

  G.define('r6_match', (r, o) => {
    const hard = !!o.hard;
    let pairs;
    for (let tries = 0; tries < 30; tries++) {
      if (hard) {
        // two-step facts and half-unit values
        const pool = TWO.filter((t) => t.dir === 'mul' && t.f1 * t.f2 <= 3600)
          .map((t) => ({ from: t.from, to: t.to, f: t.f1 * t.f2, via: t.via }))
          .concat(WITHIN.filter((w) => w.dir === 'mul' && w.f <= 1000));
        const picks = [];
        r.shuffle(pool).forEach((c) => {
          if (picks.length < 5 && !picks.some((p) => p.from === c.from)) picks.push(c);
        });
        pairs = picks.map((c) => {
          const n = c.via ? r.int(2, 4) : r.int(1, 5) + 0.5;
          return [`${fmt(n)} ${c.from}`, `${fmt(n * c.f)} ${c.to}`, n, c];
        });
      } else {
        const picks = r.pickN(
          WITHIN.filter((w) => w.dir === 'mul'),
          5,
        );
        pairs = picks.map((c) => {
          const n = r.int(2, 6);
          return [`${n} ${c.from}`, `${(n * c.f).toLocaleString()} ${c.to}`, n, c];
        });
      }
      if (new Set(pairs.map((p) => p[0])).size === 5 && new Set(pairs.map((p) => p[1])).size === 5) break;
    }
    const right = r.shuffle(pairs.map((p, i) => i));
    const step = (p) => `${fmt(p[2])} × ${fmt(p[3].f)}${p[3].via ? ` (through ${p[3].via})` : ''}`;
    return {
      type: 'match',
      skill: 'convert-within',
      lesson: '3-6',
      title: 'Match equivalent measures',
      prompt: hard ? '<p>Match each measurement with an equivalent one. Some take two steps, and some start with a half unit.</p>' : '<p>Match each measurement with an equivalent one.</p>',
      left: pairs.map((p) => p[0]),
      right: right.map((i) => pairs[i][1]),
      pairs: pairs.map((p, i) => [i, right.indexOf(i)]),
      reference: true,
      hints: hard
        ? [
            'Use the reference sheet. When there is no single fact, convert through a middle unit (for example, yards → feet → inches).',
            `For example, ${pairs[0][0]}: multiply by ${fmt(pairs[0][3].f)}${pairs[0][3].via ? `, which is the two steps through ${pairs[0][3].via} combined` : ''}.`,
            'A half unit is half the conversion factor. For example, half a foot is 6 inches.',
          ]
        : [
            'Use the reference sheet to find how many small units are in 1 big unit.',
            `For example, ${pairs[0][0]}: multiply by the conversion factor, ${fmt(pairs[0][3].f)}.`,
            'Bigger unit to smaller unit: the number of units gets bigger. Look for the right-side number that is the left number times the factor.',
          ],
      hintEs: hard
        ? 'Usa la hoja de referencia. Si no hay un solo dato, convierte pasando por una unidad intermedia (por ejemplo, yardas → pies → pulgadas).'
        : 'Usa la hoja de referencia para ver cuántas unidades pequeñas hay en 1 unidad grande.',
      solution: `<p>Each bigger unit is multiplied by its conversion factor to get the smaller unit:</p><ul>${pairs.map((p) => `<li>${p[0]} = ${step(p)} = <b>${p[1]}</b></li>`).join('')}</ul>`,
      feedback: {
        correct: 'Correct. Each pair is the same amount measured in two units.',
        wrong(ans, d) {
          const p = pairs[(d.wrong || [])[0]];
          if (!p) return 'Match every measurement. Multiply each one by its conversion factor.';
          return `Check ${p[0]}: 1 ${sg(p[3].from)} = ${fmt(p[3].f)} ${p[3].to}${p[3].via ? ` (through ${p[3].via})` : ''}, so multiply ${fmt(p[2])} by ${fmt(p[3].f)} and find that many ${p[3].to}.`;
        },
      },
    };
  });
})(typeof window !== 'undefined' ? window : globalThis);

/* js/units/u3/gen-convert-2.js */
/* Zone 6 — Surveyor's Vault. Lessons 3-6 Converting Within One System and 3-7 Converting Between Systems. */
(function (root) {
  'use strict';
  const RX = root.RX;
  const { G, V, shuffleOptions, NAMES, round, fmt, hl, why, near, WITHIN, TWO, BETWEEN, REV_RANGE, REF, STORY, SING, sg, ES, es, es1, cuantos, cap, bigOf, smallOf, withinValue, REM, BETWEEN_DIR } =
    RX._lib['u3/gen-convert'];

  G.define('r6_kgLb', (r, o) => {
    const hard = !!o.hard;
    const name = r.pick(NAMES);
    if (hard) {
      // pounds → kilograms: divide, with a subtle wrong-factor distractor
      const W = r.int(9, 20) * 5;
      const bag = r.pick(['suitcase', 'backpack', 'equipment crate']);
      const sh = shuffleOptions(
        r,
        [
          { html: `${Math.round(W / 2.2)} kilograms`, ok: true },
          { html: `${Math.round(W * 2.2)} kilograms`, why: 'That multiplies by 2.2. A kilogram is heavier than a pound, so there are fewer kilograms: divide.' },
          { html: `${Math.round(W / 1.61)} kilograms`, why: '1.61 is the miles-to-kilometers factor. For pounds and kilograms, use 1 kilogram ≈ 2.2 pounds.' },
          { html: `${Math.round(W / 2.54)} kilograms`, why: '2.54 is the inches-to-centimeters factor. For pounds and kilograms, use 2.2.' },
        ],
        0,
      );
      return {
        type: 'mc',
        skill: 'convert-between',
        lesson: '3-7',
        title: 'Convert between systems',
        xp: o.xp,
        prompt: `<p>An airline limits each ${bag} to ${hl(W + ' pounds')}. ${name}'s scale shows only <b>kilograms</b>. Which is the best approximation of the limit in kilograms?</p><p class="muted">Use the reference sheet.</p>`,
        options: sh.options,
        answer: sh.answer,
        reference: true,
        hints: [
          'Find the kilogram-to-pound line on the reference sheet. Which unit is heavier?',
          '1 kilogram ≈ 2.2 pounds. A kilogram is heavier, so the number of kilograms will be smaller than the number of pounds.',
          `Divide ${W} by 2.2, then round to the nearest whole number.`,
        ],
        hintEs: 'Busca en la hoja de referencia la línea de kilogramos y libras. ¿Qué unidad es más pesada?',
        solution: `<p>1 kg ≈ 2.2 lb. A kilogram is heavier than a pound, so there are fewer kilograms: divide. ${W} ÷ 2.2 ≈ ${round(W / 2.2, 1)}, so the limit is about <b>${Math.round(W / 2.2)} kilograms</b>.</p>`,
        feedback: {
          correct: `Correct. ${W} ÷ 2.2 ≈ ${Math.round(W / 2.2)}. Fewer of the heavier unit, so you divide.`,
          wrong: (a) => why(sh.options, a) || 'Use 1 kilogram ≈ 2.2 pounds and decide whether to multiply or divide.',
        },
      };
    }
    const W = r.int(4, 16) * 5;
    const act = r.pick(['squats', 'deadlifts', 'bench presses']);
    const sh = shuffleOptions(
      r,
      [
        { html: `${Math.round(W * 2.2)} pounds`, ok: true },
        { html: `${Math.round(W / 2.2)} pounds`, why: 'That divides by 2.2. A kilogram is heavier than a pound, so there are more pounds: multiply.' },
        { html: `${Math.round(W * 1.61)} pounds`, why: '1.61 is the miles-to-kilometers factor, not kilograms to pounds. Check the reference sheet.' },
        { html: `${Math.round(W * 2.54)} pounds`, why: '2.54 is the inches-to-centimeters factor. For kilograms to pounds, use 2.2.' },
      ],
      0,
    );
    return {
      type: 'mc',
      skill: 'convert-between',
      lesson: '3-7',
      title: 'Convert between systems',
      xp: o.xp,
      prompt: `<p>${name} does ${act} with ${hl(W + '-kilogram')} weights. Which is the best approximation for the number of <b>pounds</b> ${name} lifts?</p><p class="muted">Use the reference sheet.</p>`,
      options: sh.options,
      answer: sh.answer,
      reference: true,
      hints: [
        'Find the kilogram-to-pound line on the reference sheet.',
        '1 kilogram ≈ 2.2 pounds. A kilogram is heavier than a pound, so the number of pounds will be bigger.',
        `Multiply ${W} by 2.2, then round to the nearest whole number.`,
      ],
      hintEs: 'Busca en la hoja de referencia la línea de kilogramos a libras.',
      solution: `<p>1 kg ≈ 2.2 lb. A kilogram is heavier than a pound, so there are more pounds: multiply. ${W} × 2.2 = ${round(W * 2.2, 1)}, so ${name} lifts about <b>${Math.round(W * 2.2)} pounds</b>.</p>`,
      feedback: {
        correct: `Correct. ${W} × 2.2 ≈ ${Math.round(W * 2.2)} pounds. Picking the right factor from the reference sheet is the key step.`,
        wrong: (a) => why(sh.options, a) || 'Use 1 kilogram ≈ 2.2 pounds from the reference sheet.',
      },
    };
  });

  G.define('r6_between', (r, o) => {
    const hard = !!o.hard;
    const c = r.pick(BETWEEN);
    if (hard) {
      // reverse direction: metric → customary, divide by the factor, round to the nearest tenth
      const [lo, hi] = REV_RANGE[c.to];
      const m = r.int(lo, hi);
      const exact = m / c.f,
        ans = round(exact, 1);
      return {
        type: 'num',
        skill: 'convert-between',
        lesson: '3-7',
        title: 'Convert between systems',
        prompt: `<p>${STORY[c.to](hl(m + ' ' + c.to))}</p><p>About how many ${hl(c.from)} is that? Round to the nearest tenth.</p>`,
        unit: c.from,
        answer: ans,
        tolerance: 0.11,
        reference: true,
        hints: [
          `The reference sheet gives 1 ${sg(c.from)} ≈ ${c.f} ${c.to}. You start in ${c.to} and need ${c.from}, so think about which way to go.`,
          `Each ${sg(c.from)} is worth ${c.f} ${c.to}. To find how many ${c.from} fit in ${m} ${c.to}, divide ${m} by ${c.f}.`,
          `Divide ${m} by ${c.f}, then round to the nearest tenth.`,
        ],
        hintEs: `La hoja de referencia dice 1 ${es1(c.from)} ≈ ${c.f} ${es(c.to)}. Empiezas en ${es(c.to)} y necesitas ${es(c.from)}: piensa si debes multiplicar o dividir.`,
        solution: `<p>1 ${sg(c.from)} ≈ ${c.f} ${c.to}. You are asking how many groups of ${c.f} ${c.to} are in ${m} ${c.to}, so divide: ${m} ÷ ${c.f} ≈ ${round(exact, 3)}, which rounds to <b>${ans} ${c.from}</b>.</p>`,
        feedback: {
          correct: `Correct. Going the other way across the reference fact means dividing by ${c.f}.`,
          wrong(a, d) {
            const v = d.value;
            if (near(v, m * c.f, 0.6)) return `You multiplied by ${c.f}. The fact is 1 ${sg(c.from)} ≈ ${c.f} ${c.to}, and you start in ${c.to}, so divide ${m} by ${c.f}.`;
            if (v != null && Math.abs(v - exact) < 1 && !near(v, ans, 0.11)) return `You divided correctly, but check the rounding: round ${round(exact, 3)} to the nearest tenth.`;
            return `Find the ${c.from}–${c.to} fact on the reference sheet. You start in ${c.to}, so divide by ${c.f}.`;
          },
        },
      };
    }
    const n = c.exact ? r.int(3, 12) : r.int(2, 9) * (c.f < 1 ? 5 : 1);
    const exact = n * c.f,
      ans = c.exact ? round(exact, 2) : round(exact, 1);
    return {
      type: 'num',
      skill: 'convert-between',
      lesson: '3-7',
      title: 'Convert between systems',
      prompt: `<p>${STORY[c.from](hl(n + ' ' + c.from))}</p><p>About how many ${hl(c.to)} is that? ${c.exact ? '' : 'Round to the nearest tenth.'}</p>`,
      unit: c.to,
      answer: ans,
      tolerance: c.exact ? 0.011 : 0.11,
      reference: true,
      hints: [
        `Find the ${c.from} ↔ ${c.to} line on the reference sheet.`,
        `1 ${sg(c.from)} ≈ ${c.f} ${c.to}. Multiply the number of ${c.from} by ${c.f}.`,
        `Multiply ${n} × ${c.f}${c.exact ? '.' : ', then round to the nearest tenth.'}`,
      ],
      hintEs: `Busca en la hoja de referencia la línea de ${es(c.from)} a ${es(c.to)}.`,
      solution: `<p>The reference sheet says 1 ${sg(c.from)} ≈ ${c.f} ${c.to}. Each of the ${n} ${c.from} is worth ${c.f} ${c.to}, so multiply: ${n} × ${c.f} = ${round(exact, 3)}${c.exact ? '' : `, which rounds to`} <b>${ans} ${c.to}</b>.</p>`,
      feedback: {
        correct: `Correct. Multiplying by the conversion factor ${c.f} changes ${c.from} to ${c.to}.`,
        wrong(ans2, d) {
          if (d.value != null && Math.abs(d.value - n / c.f) < 0.1) return `You divided. 1 ${sg(c.from)} is ${c.f} ${c.to}, so multiply ${n} by ${c.f}.`;
          if (d.value != null && Math.abs(d.value - exact) < 1) return `You multiplied correctly. Check the rounding: ${round(exact, 3)} to the nearest ${c.exact ? 'hundredth' : 'tenth'}.`;
          return `Multiply ${n} by the factor for ${c.from} to ${c.to} from the reference sheet.`;
        },
      },
    };
  });

  G.define('r6_twoStep', (r, o) => {
    const hard = !!o.hard;
    const variants = hard
      ? [
          () => {
            const k = r.int(4, 8),
              lb = 11 * k,
              kg = 5 * k,
              dose = r.pick([5, 10, 15]);
            return {
              prompt: `<p>A medicine dose is ${hl(dose + ' milligrams')} for each <b>kilogram</b> of body weight. A dog weighs ${hl(lb + ' pounds')}. How many milligrams should the dog get?</p>`,
              unit: 'milligrams',
              answer: kg * dose,
              tol: 0.5,
              s1: `${lb} pounds ÷ 2.2 = ${kg} kilograms`,
              s2q: `Multiply the weight in kilograms by ${dose} milligrams per kilogram`,
              s2: `${kg} × ${dose} = ${kg * dose} milligrams`,
              partial: kg,
              inverse: round(lb * 2.2 * dose, 1),
              skip: lb * dose,
              mPartial: 'That is the weight in kilograms. Now use the dose: milligrams for each kilogram.',
              mInverse: 'You multiplied pounds by 2.2. A kilogram is heavier than a pound, so divide pounds by 2.2 to get kilograms.',
              mSkip: 'You used the weight in pounds. The dose is per kilogram, so convert pounds to kilograms first.',
            };
          },
          () => {
            const g = r.int(2, 6);
            return {
              prompt: `<p>A water tank holds ${hl(g + ' gallons')}. A lab measures water in <b>milliliters</b>. About how many milliliters does the tank hold?</p>`,
              unit: 'milliliters',
              answer: round(g * 3790, 0),
              tol: 1,
              s1: `${g} gallons × 3.79 = ${round(g * 3.79, 2)} liters`,
              s2q: 'Convert liters to milliliters: 1 liter = 1,000 milliliters',
              s2: `${round(g * 3.79, 2)} × 1,000 = ${fmt(round(g * 3790, 0))} milliliters`,
              partial: round(g * 3.79, 2),
              inverse: round((g / 3.79) * 1000, 0),
              skip: g * 1000,
              mPartial: 'That is the number of liters. Now change liters to milliliters.',
              mInverse: 'You divided by 3.79. A gallon is bigger than a liter, so multiply gallons by 3.79.',
              mSkip: 'You skipped the gallons-to-liters step. Multiply by 3.79 first.',
            };
          },
          () => {
            const ft = r.int(4, 6),
              inch = r.int(1, 11),
              tot = ft * 12 + inch;
            return {
              prompt: `<p>A climber is ${hl(ft + ' feet ' + inch + ' inches')} tall. A metric chart shows height in <b>centimeters</b>. How tall is the climber in centimeters? Round to the nearest tenth.</p>`,
              unit: 'centimeters',
              answer: round(tot * 2.54, 1),
              tol: 0.11,
              s1: `${ft} × 12 + ${inch} = ${tot} inches`,
              s2q: 'Multiply the total inches by 2.54 and round to the nearest tenth',
              s2: `${tot} × 2.54 = ${round(tot * 2.54, 2)} centimeters`,
              partial: tot,
              inverse: round(ft * 12 * 2.54, 1),
              skip: round(tot / 2.54, 1),
              mPartial: 'That is the height in inches. Now change inches to centimeters.',
              mInverse: `You left out the ${inch} inches. Add them to the inches from the feet before converting.`,
              mSkip: 'You divided by 2.54. An inch is longer than a centimeter, so there are more centimeters: multiply the inches by 2.54.',
            };
          },
        ]
      : [
          () => {
            const x = r.int(2, 6);
            return {
              prompt: `<p>A beam is ${hl(x + ' feet')} long. A metric tape measure shows <b>centimeters</b>. How long is the beam in centimeters? <span class="muted">(Hint: feet → inches → centimeters.)</span></p>`,
              unit: 'centimeters',
              answer: round(x * 12 * 2.54, 2),
              // 1 foot ≈ 0.305 meter (also on the reference sheet) gives 30.5 per foot: accept that route too
              tol: round(x * 0.02, 2) + 0.01,
              s1: `${x} feet × 12 = ${x * 12} inches`,
              s2q: `Multiply ${x * 12} inches by 2.54`,
              s2: `${x * 12} × 2.54 = ${round(x * 12 * 2.54, 2)} centimeters`,
              partial: x * 12,
              inverse: round(x * 2.54, 2),
              skip: round((x * 12) / 2.54, 2),
              mPartial: 'That is the length in inches. Now change inches to centimeters.',
              mInverse: 'You changed feet straight to centimeters with 2.54, but 2.54 is for inches. Change feet to inches first.',
              mSkip: 'You divided the inches by 2.54. An inch is longer than a centimeter, so there are more centimeters: multiply by 2.54.',
            };
          },
          () => {
            const g = r.int(2, 5);
            return {
              prompt: `<p>A camp stove tank holds ${hl(g + ' gallons')}. Fuel is sold by the <b>liter</b>. About how many liters fill the tank? Round to the nearest tenth.</p>`,
              unit: 'liters',
              answer: round(g * 3.79, 1),
              tol: 0.11,
              s1: '1 gallon ≈ 3.79 liters',
              s2q: `Multiply ${g} by 3.79 and round to the nearest tenth`,
              s2: `${g} × 3.79 ≈ ${round(g * 3.79, 2)} liters`,
              partial: 3.79,
              inverse: round(g / 3.79, 1),
              skip: g * 4,
              mPartial: `3.79 is the liters in 1 gallon. The tank holds ${g} gallons.`,
              mInverse: 'You divided. A gallon is bigger than a liter, so there are more liters: multiply.',
              mSkip: 'You used 4, the quarts in a gallon. Use the gallons-to-liters fact: 3.79.',
            };
          },
          () => {
            const kg = r.pick([2.5, 4.5, 5, 7.5, 10]),
              c = r.int(2, 4);
            return {
              prompt: `<p>A package weighs ${hl(kg + ' kilograms')}. Shipping costs ${hl('$' + c)} per <b>pound</b>. About how much does shipping cost? Round to the nearest cent.</p>`,
              unit: 'dollars',
              answer: round(kg * 2.2 * c, 2),
              tol: 0.02,
              s1: `${kg} kg × 2.2 = ${round(kg * 2.2, 2)} pounds`,
              s2q: `Multiply the pounds by $${c} per pound`,
              s2: `${round(kg * 2.2, 2)} × $${c} = $${round(kg * 2.2 * c, 2)}`,
              partial: round(kg * 2.2, 2),
              inverse: round((kg / 2.2) * c, 2),
              skip: kg * c,
              mPartial: 'That is the weight in pounds. Now multiply by the cost per pound.',
              mInverse: 'You divided by 2.2. A kilogram is heavier than a pound, so multiply kilograms by 2.2.',
              mSkip: 'You multiplied kilograms by the price per pound. Convert kilograms to pounds first.',
            };
          },
        ];
    const v = r.pick(variants)();
    return {
      type: 'num',
      skill: 'convert-between',
      lesson: '3-7',
      title: 'Two-step conversion',
      xp: 15,
      prompt: v.prompt,
      unit: v.unit,
      answer: v.answer,
      tolerance: v.tol,
      reference: true,
      hints: [
        hard
          ? 'This takes two steps. Decide which conversion comes first, and write it down before doing the second.'
          : 'This takes two steps. Write down the first conversion before doing the second.',
        `Step 1: ${v.s1}.`,
        `Step 2: ${v.s2q}.`,
      ],
      hintEs: hard
        ? 'Este problema tiene dos pasos. Decide qué conversión va primero y escríbela antes de hacer la segunda.'
        : 'Este problema tiene dos pasos. Escribe la primera conversión antes de hacer la segunda.',
      solution: `<p>Step 1: ${v.s1}. Step 2: ${v.s2}. Answer: <b>${fmt(v.answer)} ${v.unit}</b>. Each step multiplies or divides by one ratio from the reference sheet.</p>`,
      feedback: {
        correct: 'Correct. Chaining two conversions is just multiplying or dividing by two ratios in a row.',
        wrong(a, d) {
          const x = d.value;
          if (near(x, v.partial, 0.02)) return v.mPartial;
          if (near(x, v.inverse, 0.02)) return v.mInverse;
          if (near(x, v.skip, 0.02)) return v.mSkip;
          return `Do it in two steps: ${v.s1}. Then use that result for the second step.`;
        },
      },
    };
  });

  G.define('r6_sortDir', (r, o) => {
    const hard = !!o.hard;
    let picks, items;
    if (hard) {
      // between-system conversions: multiply or divide by the reference-sheet factor
      const pick = (dir) => {
        const out = [];
        r.shuffle(BETWEEN_DIR.filter((b) => b.dir === dir)).forEach((b) => {
          if (out.length < 3 && !out.some((x) => x.fact === b.fact)) out.push(b);
        });
        return out;
      };
      // the same fact may appear in both bins: that contrast is the point
      picks = r.shuffle(pick('mul').concat(pick('div')));
      items = picks.map((c) => ({ html: `${c.from} → ${c.to} <span class="muted">(${c.fact})</span>`, bin: c.dir === 'mul' ? 0 : 1 }));
    } else {
      picks = r.shuffle(
        r
          .pickN(
            WITHIN.filter((w) => w.dir === 'mul'),
            3,
          )
          .concat(
            r.pickN(
              WITHIN.filter((w) => w.dir === 'div'),
              3,
            ),
          ),
      );
      items = picks.map((c) => ({ html: `${c.from} → ${c.to}`, bin: c.dir === 'mul' ? 0 : 1 }));
    }
    return {
      type: 'sort',
      // hard sorts between-system facts, so it is tagged with lesson 3-7 (same zone, same mission)
      skill: hard ? 'convert-between' : 'convert-within',
      lesson: hard ? '3-7' : '3-6',
      title: 'Multiply or divide?',
      prompt: hard
        ? '<p>Each conversion uses the fact shown from the reference sheet. To convert, would you <b>multiply</b> or <b>divide</b> by the number in the fact? Sort each one.</p>'
        : '<p>To convert each measurement, would you <b>multiply</b> or <b>divide</b> by the conversion factor? Sort each one.</p>',
      bins: ['Multiply', 'Divide'],
      items,
      hints: hard
        ? [
            'Look at which unit has the 1 in the fact. If you start in that unit, each one is worth the factor, so multiply.',
            'If you start in the other unit, you are finding how many groups of the factor fit, so divide.',
            `${picks[0].from} → ${picks[0].to}: the fact is ${picks[0].fact}. Do you start with the unit that has the 1?`,
          ]
        : [
            'Ask: is the new unit bigger or smaller than the old one?',
            'Going to a smaller unit means you need more of them: multiply. Going to a bigger unit means fewer: divide.',
            `${picks[0].from} → ${picks[0].to}: are ${picks[0].to} bigger or smaller than ${picks[0].from}?`,
          ],
      hintEs: hard
        ? 'Mira qué unidad tiene el 1 en el dato. Si empiezas en esa unidad, cada una vale el factor de conversión, así que multiplicas.'
        : 'Pregúntate: ¿la nueva unidad es más grande o más pequeña que la unidad original?',
      solution: hard
        ? `<p>Start in the unit that has the 1 in the fact → <b>multiply</b> by the factor. Start in the other unit → <b>divide</b>.</p><ul>${picks.map((c) => `<li>${c.from} → ${c.to} (${c.fact}): <b>${c.dir === 'mul' ? 'multiply' : 'divide'}</b></li>`).join('')}</ul>`
        : `<p>Going to a smaller unit gives more of them, so multiply. Going to a bigger unit gives fewer, so divide.</p><ul>${picks.map((c) => `<li>${c.from} → ${c.to}: <b>${c.dir === 'mul' ? 'multiply' : 'divide'}</b> by ${fmt(c.f)}</li>`).join('')}</ul>`,
      feedback: {
        correct: hard ? 'Correct. Start in the unit with the 1 → multiply; start in the other unit → divide.' : 'Correct. Smaller unit → more of them → multiply. Bigger unit → fewer → divide.',
        wrong(ans, d) {
          const c = picks[(d.wrong || [])[0]];
          if (!c) return 'Sort every conversion into Multiply or Divide.';
          if (hard)
            return `${c.from} → ${c.to}: the fact is ${c.fact}. You start in ${c.from}, which ${c.dir === 'mul' ? 'is' : 'is not'} the unit with the 1, so ${c.dir === 'mul' ? 'multiply' : 'divide'}.`;
          return `${c.from} → ${c.to}: ${c.to} are ${c.dir === 'mul' ? 'smaller' : 'bigger'} than ${c.from}, so you need ${c.dir === 'mul' ? 'more' : 'fewer'} of them.`;
        },
      },
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
  const why = (opts, i) => (opts[i] && opts[i].why) || null;

  // ---------- Unit price with mixed units (MC) ----------
  G.define('c_mixedUnits', (r, o) => {
    const hard = !!o.hard;
    // hard: ounces that are not a half-pound multiple, and Brand B in pounds + ounces
    const oz = hard ? r.pick([20, 28, 36, 44]) : r.pick([24, 32, 40, 48]);
    const lbA = oz / 16,
      uA = r.int(20, 32) / 10,
      pA = round(uA * lbA, 2);
    const lbWhole = r.pick([1, 2, 3]),
      ozB = r.pick([4, 8, 12]);
    const lbB = hard ? lbWhole + ozB / 16 : r.pick([1.5, 2.5, 3]);
    let uB = r.int(20, 32) / 10;
    if (Math.abs(uB - uA) < 0.15) uB = round(uA + 0.3, 2);
    const pB = round(uB * lbB, 2);
    const best = uA < uB ? 'A' : 'B';
    const sizeB = hard ? `${lbWhole} ${lbWhole === 1 ? 'pound' : 'pounds'} ${ozB} ounces` : `${lbB} pounds`;
    const opts = [
      { html: `Brand ${best}, at ${money(Math.min(uA, uB))} per pound`, ok: true },
      { html: `Brand ${best === 'A' ? 'B' : 'A'}, at ${money(Math.max(uA, uB))} per pound`, why: 'That is the higher unit price. The better buy is the lower price per pound.' },
      { html: `Brand A, at ${money(round(pA / oz, 2))} per pound`, why: `${money(round(pA / oz, 2))} is the price per <b>ounce</b>, not per pound. Convert ${oz} ounces to pounds first (÷ 16).` },
      hard
        ? {
            html: `Brand B, at ${money(round(pB / (lbWhole + ozB / 10), 2))} per pound`,
            why: `${lbWhole} pounds ${ozB} ounces is not ${lbWhole}.${ozB} pounds. A pound has 16 ounces, so ${ozB} ounces = ${ozB}/16 of a pound and the bag is ${lbB} pounds.`,
          }
        : { html: `Brand B, because ${money(pB)} is less than ${money(pA)}`, why: 'Comparing total prices ignores the different sizes. Compare price per pound.' },
    ];
    const sh = shuffleOptions(r, opts, 0);
    return {
      type: 'mc',
      skill: 'unit-price',
      lesson: '3-2',
      title: 'Challenge: mixed units',
      xp: 20,
      prompt: `<p>Brand A: ${hl(oz + ' ounces')} of granola for ${hl(money(pA))}.<br>Brand B: ${hl(sizeB)} of granola for ${hl(money(pB))}.</p><p>Which is the better buy, and what is its unit price <b>per pound</b>?</p>`,
      options: sh.options,
      answer: sh.answer,
      reference: true,
      hints: hard
        ? [
            'Write both sizes in pounds before you divide (16 ounces = 1 pound).',
            `Brand A: ${oz} ÷ 16 = ${lbA} pounds. Brand B: ${ozB} ounces = ${ozB} ÷ 16 = ${ozB / 16} pound, so the bag is ${lbB} pounds.`,
            `Brand A: ${money(pA)} ÷ ${lbA}. Brand B: ${money(pB)} ÷ ${lbB}. The lower result is the better buy.`,
          ]
        : [
            'The sizes use different units. Convert ounces to pounds first (16 ounces = 1 pound).',
            `${oz} ÷ 16 = ${lbA} pounds. Brand A: ${money(pA)} ÷ ${lbA}.`,
            `Brand A: ${money(uA)} per lb. Brand B: ${money(pB)} ÷ ${lbB}. Compare the two unit prices.`,
          ],
      hintEs: hard ? 'Escribe los dos tamaños en libras antes de dividir (16 onzas = 1 libra).' : 'Los tamaños usan unidades diferentes. Primero convierte las onzas a libras (16 onzas = 1 libra).',
      solution: `<p>Brand A: ${oz} oz = ${oz} ÷ 16 = ${lbA} lb, so ${money(pA)} ÷ ${lbA} = ${money(uA)} per lb. Brand B: ${hard ? `${sizeB} = ${lbB} lb, so ` : ''}${money(pB)} ÷ ${lbB} = ${money(uB)} per lb. <b>Brand ${best}</b> is the better buy at <b>${money(Math.min(uA, uB))} per pound</b>.</p>`,
      feedback: {
        correct: 'Correct. Matching the units first makes the unit prices comparable.',
        wrong: (ans) => why(sh.options, ans) || 'Convert both sizes to pounds, then divide each price by its weight.',
      },
    };
  });

  // ---------- Three-way comparison with three representations (seq) ----------
  G.define('c_threeWay', (r, o) => {
    const hard = !!o.hard;
    const names = r.pickN(NAMES, hard ? 4 : 3);
    let items,
      rates,
      misread = null,
      hints,
      hintEs,
      lines;
    if (hard) {
      // four hikers; one given as minutes per mile (a reciprocal rate), one in minutes
      rates = r.shuffle([2.5, 3, 4, 5]);
      const mpm = 60 / rates[0];
      items = [
        { html: `<b>${names[0]}</b>: walks 1 mile every ${mpm} minutes`, rate: rates[0] },
        {
          html: `<b>${names[1]}</b>:${V.graph({
            xLabel: 'Hours',
            yLabel: 'Miles',
            xMax: 4,
            yMax: 20,
            yStep: 4,
            size: 150,
            series: [
              {
                points: [
                  [2, rates[1] * 2],
                  [4, rates[1] * 4],
                ],
              },
            ],
          })}`,
          rate: rates[1],
        },
        {
          html: `<b>${names[2]}</b>:${V.table(
            [
              ['Hours', '2', '6'],
              ['Miles', String(rates[2] * 2), String(rates[2] * 6)],
            ],
            { header: false, rowHeader: true, cls: 'mini' },
          )}`,
          rate: rates[2],
        },
        { html: `<b>${names[3]}</b>: ${rates[3] * 1.5} miles in 90 minutes`, rate: rates[3] },
      ];
      const fake = rates.slice();
      fake[0] = mpm; // a student who treats minutes per mile as a speed
      misread = [0, 1, 2, 3].sort((a, b) => fake[a] - fake[b]);
      hints = [
        `Change every hiker to the same unit rate: miles per hour. ${names[0]}'s rate is minutes per mile, so it works the other way: more minutes per mile means slower.`,
        `${names[0]}: 60 minutes ÷ ${mpm} minutes per mile. ${names[1]}: read the point at 2 hours and divide by 2. ${names[2]}: ${rates[2] * 2} ÷ 2. ${names[3]}: 90 minutes = 1.5 hours, so ${rates[3] * 1.5} ÷ 1.5.`,
        'Write all four results in miles per hour, then order them from least to greatest.',
      ];
      hintEs = `Cambia a cada excursionista a la misma tasa unitaria: millas por hora. La tasa de ${names[0]} está en minutos por milla, así que funciona al revés: más minutos por milla significa más lento.`;
      lines = `${names[0]}: 60 ÷ ${mpm} = ${rates[0]} mph; ${names[1]}: ${rates[1]} mph; ${names[2]}: ${rates[2]} mph; ${names[3]}: ${rates[3] * 1.5} ÷ 1.5 = ${rates[3]} mph.`;
    } else {
      rates = r.pickN([2.5, 3, 3.5, 4, 4.5, 5], 3);
      items = [
        { html: `<b>${names[0]}</b>: ${rates[0] * 4} miles in 4 hours`, rate: rates[0] },
        {
          html: `<b>${names[1]}</b>:${V.graph({
            xLabel: 'Hours',
            yLabel: 'Miles',
            xMax: 4,
            yMax: 20,
            yStep: 4,
            size: 150,
            series: [
              {
                points: [
                  [2, rates[1] * 2],
                  [4, rates[1] * 4],
                ],
              },
            ],
          })}`,
          rate: rates[1],
        },
        {
          html: `<b>${names[2]}</b>:${V.table(
            [
              ['Hours', '2', '6'],
              ['Miles', String(rates[2] * 2), String(rates[2] * 6)],
            ],
            { header: false, rowHeader: true, cls: 'mini' },
          )}`,
          rate: rates[2],
        },
      ];
      hints = [
        'Find miles per hour for each. A unit rate can be a decimal.',
        `${names[0]}: ${rates[0] * 4} ÷ 4. ${names[1]}: read the point at 2 hours (${rates[1] * 2}) and divide by 2. ${names[2]}: ${rates[2] * 2} ÷ 2.`,
        'Write the three unit rates, then order them from least to greatest.',
      ];
      hintEs = 'Encuentra las millas por hora de cada excursionista. Una tasa unitaria puede ser un número decimal.';
      lines = `${names[0]}: ${rates[0]} mph; ${names[1]}: ${rates[1]} mph; ${names[2]}: ${rates[2]} mph.`;
    }
    const order = items.map((_, i) => i).sort((a, b) => items[a].rate - items[b].rate);
    return {
      type: 'seq',
      skill: 'compare',
      lesson: '3-5',
      title: 'Challenge: order the hikers',
      xp: 20,
      prompt: hard
        ? '<p>Order the hikers from <b>slowest</b> (top) to <b>fastest</b> (bottom). Their rates use different units, so make them match first.</p>'
        : '<p>Order the hikers from <b>slowest</b> (top) to <b>fastest</b> (bottom). Some unit rates are not whole numbers.</p>',
      items,
      order,
      hints,
      hintEs,
      solution: `<p>${lines} Slowest to fastest: <b>${order.map((i) => names[i]).join(', ')}</b>. Comparing works only when every rate uses the same units (miles per hour).</p>`,
      feedback: {
        correct: 'Correct. Once every rate is in miles per hour, the comparison is easy.',
        wrong(ans) {
          const a = Array.isArray(ans) ? ans.join() : '';
          if (a === order.slice().reverse().join()) return 'Your order is reversed. The slowest hiker (smallest miles per hour) goes at the top.';
          if (misread && a === misread.join())
            return `You treated ${names[0]}'s minutes per mile like a speed. More minutes per mile means slower: divide 60 by ${60 / rates[0]} to get miles per hour.`;
          return 'Find each unit rate in miles per hour as a decimal and compare. Slowest goes first.';
        },
      },
    };
  });

  // ---------- Ratio with a difference instead of a total (blanks) ----------
  G.define('c_difference', (r, o) => {
    const hard = !!o.hard;
    const k = r.int(4, 9);
    if (hard) {
      // three-part ratio; the difference is between the first and third parts
      const [a, b, c] = r.pick([
        [5, 3, 2],
        [6, 4, 1],
        [7, 3, 2],
        [7, 5, 3],
        [8, 3, 5],
        [6, 5, 2],
      ]);
      const diff = (a - c) * k;
      const [i1, i2, i3] = r.pick([
        ['fiction books', 'nonfiction books', 'poetry books'],
        ['red marbles', 'blue marbles', 'green marbles'],
        ['sunny days', 'cloudy days', 'rainy days'],
      ]);
      return {
        type: 'blanks',
        skill: 'tape',
        lesson: '3-1',
        title: 'Challenge: ratio with a difference',
        xp: 20,
        prompt: `<p>The ratio of ${hl(i1)} to ${hl(i2)} to ${hl(i3)} is ${hl(a + ' : ' + b + ' : ' + c)}. There are ${hl(diff + ' more')} ${i1} than ${i3}.</p>${V.tape([
          { label: i1, boxes: a },
          { label: i2, boxes: b },
          { label: i3, boxes: c },
        ])}<p>How many of each are there?</p>`,
        fields: [
          { label: i1, answer: a * k },
          { label: i2, answer: b * k },
          { label: i3, answer: c * k },
        ],
        hints: [
          `Compare only the ${i1} row and the ${i3} row. How many more boxes does the ${i1} row have? The ${i2} row is not part of the difference.`,
          `${a} − ${c} = ${a - c} extra boxes stand for ${diff}. So each box is worth ${diff} ÷ ${a - c} = ${k}.`,
          `Multiply each row's number of boxes (${a}, ${b}, and ${c}) by ${k}.`,
        ],
        hintEs: `Compara solo la fila de ${i1} y la fila de ${i3}. ¿Cuántas cajas más tiene la fila de ${i1}? La fila de ${i2} no es parte de la diferencia.`,
        solution: `<p>The ${i1} row has ${a} − ${c} = ${a - c} more boxes than the ${i3} row, and those boxes equal ${diff}. Each box is ${diff} ÷ ${a - c} = ${k}. ${i1} = ${a} × ${k} = <b>${a * k}</b>; ${i2} = ${b} × ${k} = <b>${b * k}</b>; ${i3} = ${c} × ${k} = <b>${c * k}</b>. Check: ${a * k} − ${c * k} = ${diff}.</p>`,
        feedback: {
          correct: `Correct. The ${a - c} extra boxes equal ${diff}, so each box is ${k}.`,
          wrong(ans) {
            const v = ans.map((x) => RX.parseNum(x));
            if (v[0] === a && v[1] === b && v[2] === c) return `${a} : ${b} : ${c} is the ratio, not the counts. Use the difference of ${diff} to find what one box is worth.`;
            if (a - b !== 0 && diff % (a - b) === 0 && v[0] === a * (diff / (a - b)))
              return `You used the gap between the ${i1} and ${i2} rows. The difference of ${diff} is between the ${i1} and the ${i3}: ${a} − ${c} boxes.`;
            if (v[0] === diff * a) return `${diff} is the value of all ${a - c} extra boxes, not one box. Divide ${diff} by ${a - c} first.`;
            if (v[0] != null && v[2] != null && v[0] - v[2] !== diff) return `Your ${i1} and ${i3} differ by ${v[0] - v[2]}, but they should differ by ${diff}.`;
            return `Each box = ${diff} ÷ ${a - c}. Then multiply by the number of boxes in each row.`;
          },
        },
      };
    }
    const [a, b] = r.pick([
        [5, 3],
        [7, 4],
        [8, 5],
        [9, 4],
        [6, 1],
        [7, 2],
      ]),
      diff = (a - b) * k;
    const [i1, i2] = r.pick([
      ['fiction books', 'nonfiction books'],
      ['red marbles', 'blue marbles'],
      ['sunny days', 'rainy days'],
    ]);
    return {
      type: 'blanks',
      skill: 'tape',
      lesson: '3-1',
      title: 'Challenge: ratio with a difference',
      xp: 20,
      prompt: `<p>The ratio of ${hl(i1)} to ${hl(i2)} is ${hl(a + ' : ' + b)}. There are ${hl(diff + ' more')} ${i1} than ${i2}.</p>${V.tape([
        { label: i1, boxes: a },
        { label: i2, boxes: b },
      ])}<p>How many of each are there?</p>`,
      fields: [
        { label: i1, answer: a * k },
        { label: i2, answer: b * k },
      ],
      hints: [
        `In the tape diagram, how many more boxes does the ${i1} row have? ${a} − ${b} = ${a - b}.`,
        `Those ${a - b} extra boxes represent ${diff}. So each box is worth ${diff} ÷ ${a - b} = ${k}.`,
        `${i1}: ${a} × ${k}. ${i2}: ${b} × ${k}.`,
      ],
      hintEs: `En el diagrama de cinta, ¿cuántas cajas más tiene la fila de ${i1}? ${a} − ${b} = ${a - b}.`,
      solution: `<p>The difference of ${a - b} boxes equals ${diff}, so each box is ${k}. ${i1} = ${a} × ${k} = <b>${a * k}</b>; ${i2} = ${b} × ${k} = <b>${b * k}</b>. Check: ${a * k} − ${b * k} = ${diff}.</p>`,
      feedback: {
        correct: 'Correct. A difference tells you the value of the extra boxes, which unlocks the box value.',
        wrong(ans) {
          const x = RX.parseNum(ans[0]),
            y = RX.parseNum(ans[1]);
          if (x === (diff * a) / (a + b) || y === (diff * b) / (a + b)) return `You treated ${diff} as the total. It is the difference: only the ${a - b} extra boxes equal ${diff}.`;
          if (x === diff * a && y === diff * b) return `${diff} is the value of all ${a - b} extra boxes together. Divide by ${a - b} to find one box.`;
          if (x != null && y != null && x - y !== diff) return `Your two numbers differ by ${x - y}, but the difference should be ${diff}. Use the extra ${a - b} boxes to find the box value.`;
          return `Each box = ${diff} ÷ ${a - b}. Then multiply by the number of boxes in each row.`;
        },
      },
    };
  });

  // ---------- Graph with a non-integer unit rate (num) ----------
  G.define('c_graphDecimal', (r, o) => {
    const hard = !!o.hard;
    // hard: quarter rates; the only on-grid point is at 8 scoops, and the question goes past the graph
    const rate = hard ? r.pick([1.25, 1.75, 2.25, 2.75]) : r.pick([1.5, 2.5, 3.5]);
    const ask = hard ? r.pick([6, 10, 12]) : r.pick([5, 7, 9]);
    const xs = hard ? [4, 8] : [2, 4, 6];
    const pts = xs.map((x) => [x, rate * x]);
    const rx = hard ? 8 : 2,
      ry = rate * rx,
      answer = rate * ask;
    return {
      type: 'num',
      skill: 'graphs',
      lesson: '3-4',
      title: 'Challenge: read a decimal rate',
      xp: 20,
      prompt: `<p>The graph shows cups of water per scoop of mix.</p>${V.graph({ xLabel: 'Scoops', yLabel: 'Cups of Water', xMax: 8, yMax: 24, yStep: 2, size: 280, series: [{ points: pts, line: true }] })}<p>How many cups of water are needed for ${hl(ask + ' scoops')}?</p>`,
      unit: 'cups',
      answer,
      tolerance: 0.01,
      hints: [
        hard
          ? `There is no point above 1, and the point at 4 scoops falls between gridlines. Use the point at 8 scoops: (8, ${ry}).`
          : `There is no point above 1. Use a point you can read clearly, like (2, ${ry}).`,
        `${ry} ÷ ${rx} = ${rate} cups per scoop.`,
        `Now multiply the unit rate, ${rate} cups per scoop, by ${ask} scoops.`,
      ],
      hintEs: hard
        ? `No hay un punto sobre el 1, y el punto en 4 medidas queda entre dos líneas. Usa el punto en 8 medidas: (8, ${ry}).`
        : `No hay un punto sobre el 1. Usa un punto que puedas leer bien, como (2, ${ry}).`,
      solution: `<p>(${rx}, ${ry}) gives ${ry} ÷ ${rx} = ${rate} cups per scoop (the unit rate). For ${ask} scoops: ${ask} × ${rate} = <b>${round(answer, 2)} cups</b>.${hard ? ' The graph stops at 8 scoops, but the unit rate keeps working past it.' : ''}</p>`,
      feedback: {
        correct: 'Correct. Unit rates can be decimals; reading a clear point and dividing gets you there.',
        wrong(ans, d) {
          const v = d.value;
          if (v != null && Math.abs(v - ry * ask) < 0.01) return `${ry} is the water for ${rx} scoops, not for 1 scoop. Divide ${ry} by ${rx} first to get the unit rate.`;
          if (v != null && Math.abs(v - ask / rate) < 0.01) return `You divided ${ask} by the unit rate. Cups for ${ask} scoops = scoops × cups per scoop, so multiply.`;
          if (v != null && Math.abs(v - Math.floor(rate) * ask) < 0.01) return `The unit rate is not a whole number. ${ry} ÷ ${rx} has a decimal part; keep it.`;
          return `Read the point at ${rx} scoops (${ry} cups) and divide by ${rx} to get the unit rate, then multiply by ${ask}.`;
        },
      },
    };
  });

  // ---------- Double number line with half steps (dnl) ----------
  G.define('c_dnlHalf', (r, o) => {
    const hard = !!o.hard;
    const rate = r.pick([4, 6, 8, 10]);
    const hours = [0, 0.5, 1, 1.5, 2, 2.5];
    const miles = hours.map((h) => rate * h);
    // hard: only the 1.5-hour value is given; find the unit rate yourself
    const blanksAt = hard ? [1, 2, 4, 5] : [1, 3, 5];
    return {
      type: 'dnl',
      skill: 'dnl',
      lesson: '3-2',
      title: 'Challenge: half-hour steps',
      xp: 20,
      prompt: hard
        ? `<p>A cyclist rides ${hl(rate * 1.5 + ' miles')} in ${hl('1.5 hours')} at a steady speed. Complete the double number line. The ticks are every half hour.</p>`
        : `<p>A cyclist rides ${hl(rate + ' miles')} every hour. Complete the double number line. The ticks are every half hour.</p>`,
      top: { label: 'Hours', values: hours },
      bottom: { label: 'Miles', values: miles.map((m, i) => (blanksAt.includes(i) ? null : m)) },
      blanks: blanksAt.map((i) => ({ row: 'bottom', i, answer: miles[i] })),
      hints: hard
        ? [
            '1.5 hours is three half hours. Split the distance into three equal steps to find the miles for one half hour.',
            `${rate * 1.5} ÷ 3 = ${rate / 2} miles every half hour.`,
            `Count up by ${rate / 2} from 0: one step for 0.5 hours, two steps for 1 hour, and so on.`,
          ]
        : [
            'Each tick is half an hour. Half of the unit rate goes with 0.5 hours.',
            `${rate} ÷ 2 = ${rate / 2} miles in 0.5 hour.`,
            `1.5 hours = 1 hour + 0.5 hour = ${rate} + ${rate / 2}. 2.5 hours = ${rate * 2} + ${rate / 2}.`,
          ],
      hintEs: hard
        ? '1.5 horas son tres medias horas. Divide la distancia en tres partes iguales para hallar las millas de media hora.'
        : 'Cada marca es media hora. La mitad de la tasa unitaria va con 0.5 horas.',
      solution: hard
        ? `<p>1.5 hours = 3 half hours, so each half hour is ${rate * 1.5} ÷ 3 = ${rate / 2} miles and the unit rate is ${rate} miles per hour. 0.5 h → <b>${rate / 2}</b>; 1 h → <b>${rate}</b>; 2 h → <b>${rate * 2}</b>; 2.5 h → <b>${rate * 2.5}</b>.</p>`
        : `<p>0.5 h → <b>${rate / 2}</b>; 1.5 h → <b>${rate * 1.5}</b>; 2.5 h → <b>${rate * 2.5}</b>. Each half hour adds ${rate / 2} miles, because half of the unit rate ${rate} is ${rate / 2}.</p>`,
      feedback: {
        correct: 'Correct. A double number line works with fractions of a unit too.',
        wrong(ans, d) {
          const i = (d.wrong || [])[0];
          const bi = blanksAt[i],
            v = RX.parseNum((ans || [])[i]);
          if (v != null && bi != null) {
            if (hard && bi === 2 && Math.abs(v - rate * 1.5) < 1e-9) return `${rate * 1.5} miles goes with 1.5 hours, not 1 hour. Find the miles for one half hour first.`;
            if (hard && bi === 2 && Math.abs(v - (rate * 1.5) / 2) < 1e-9) return `You split ${rate * 1.5} miles into 2 parts, but 1.5 hours is 3 half hours. Divide by 3 to get one half-hour step.`;
            if (Math.abs(v - rate * hours[bi] * 2) < 1e-9) return `At ${hours[bi]} hours you doubled instead of halving. Half an hour is half of ${rate} miles.`;
            if (Math.abs(v - (miles[bi - 1] != null ? miles[bi - 1] : -1)) < 1e-9 || Math.abs(v - (miles[bi + 1] != null ? miles[bi + 1] : -1)) < 1e-9)
              return `Your value at ${hours[bi]} hours belongs to the tick next to it. Each tick is a half hour.`;
          }
          return `Find the miles for one half hour (${hard ? `${rate * 1.5} ÷ 3` : `${rate} ÷ 2`}), then add that amount for each tick.`;
        },
      },
    };
  });

  // ---------- Two-step between systems with money (num) ----------
  G.define('c_twoStepMoney', (r, o) => {
    const hard = !!o.hard;
    // hard: distance in meters (convert to km, then to miles) and a decimal price per mile
    const km = hard ? r.pick([9.6, 12.8, 14.5, 17.6, 22.4]) : r.pick([8, 12, 16, 20]);
    const perMile = hard ? r.pick([1.75, 2.25, 2.5, 3.25]) : r.int(2, 4);
    const meters = Math.round(km * 1000);
    const miles = round(km / 1.61, 1),
      cost = round(miles * perMile, 2);
    return {
      type: 'num',
      skill: 'convert-between',
      lesson: '3-7',
      title: 'Challenge: convert, then pay',
      xp: 20,
      prompt: hard
        ? `<p>A taxi charges ${hl(money(perMile))} per <b>mile</b>. The airport is ${hl(RX.fmt(meters) + ' meters')} away.</p><p>About how much will the ride cost? Convert to kilometers, then to miles rounded to the nearest tenth, then find the cost.</p>`
        : `<p>A taxi charges ${hl('$' + perMile)} per <b>mile</b>. The airport is ${hl(km + ' kilometers')} away.</p><p>About how much will the ride cost? First convert to miles and round to the nearest tenth, then find the cost.</p>`,
      unit: 'dollars',
      answer: cost,
      tolerance: 0.3,
      reference: true,
      hints: hard
        ? [
            'Three steps: meters → kilometers (1 km = 1,000 m), kilometers → miles (1 mile ≈ 1.61 km), then miles × price per mile.',
            `${RX.fmt(meters)} ÷ 1,000 = ${km} km. ${km} ÷ 1.61 ≈ ${miles} miles.`,
            `${miles} miles × ${money(perMile)} per mile. Round to the nearest cent.`,
          ]
        : ['Step 1: kilometers → miles. 1 mile ≈ 1.61 km, so divide by 1.61.', `${km} ÷ 1.61 ≈ ${miles} miles.`, `${miles} miles × $${perMile} per mile.`],
      hintEs: hard
        ? 'Son tres pasos: metros → kilómetros (1 km = 1,000 m), kilómetros → millas (1 milla ≈ 1.61 km), y luego millas × precio por milla.'
        : 'Paso 1: kilómetros → millas. 1 milla ≈ 1.61 km, así que divide entre 1.61.',
      solution: `<p>${hard ? `${RX.fmt(meters)} m ÷ 1,000 = ${km} km. ` : ''}${km} km ÷ 1.61 ≈ ${miles} miles (a mile is longer than a kilometer, so the number of miles is smaller). ${miles} miles × ${money(perMile)} per mile ≈ <b>${money(cost)}</b>.</p>`,
      feedback: {
        correct: 'Correct. Convert first so the unit matches the rate, then multiply.',
        wrong(ans, d) {
          const v = d.value;
          if (v == null) return 'Enter the cost as a number of dollars.';
          if (Math.abs(v - km * perMile) < 0.3) return `You charged per kilometer. The rate is per mile, so convert ${km} km to miles first (÷ 1.61).`;
          if (Math.abs(v - km * 1.61 * perMile) < 0.5) return 'You multiplied by 1.61. A mile is longer than a kilometer, so there are fewer miles: divide by 1.61.';
          if (hard && Math.abs(v - (meters / 1.61) * perMile) < 1) return `${RX.fmt(meters)} is in meters. Change meters to kilometers (÷ 1,000) before changing to miles.`;
          return `Convert to miles (÷ 1.61), round to the nearest tenth, then multiply by ${money(perMile)}.`;
        },
      },
    };
  });

  // ---------- Part-to-whole table error ----------
  G.define('c_partWholeError', (r, o) => {
    const hard = !!o.hard;
    const name = r.pick(NAMES),
      ks = [1, 2, 3];
    if (hard) {
      // three colors: the "all marbles" row forgets the third color
      const [a, b, c] = r.pick([
        [2, 3, 1],
        [3, 4, 2],
        [1, 2, 3],
        [2, 5, 3],
        [3, 2, 4],
      ]);
      const t = a + b + c,
        m = r.int(4, 7);
      const sh = shuffleOptions(
        r,
        [
          { html: `${name} left out the green marbles. One group has ${a} + ${b} + ${c} = ${t} marbles, so red : all is ${a} : ${t}, not ${a} : ${a + b}.`, ok: true },
          { html: `${name} should have used red : blue = ${a} : ${b} in the table instead.`, why: `${a} : ${b} compares two parts. The question asks for red compared to <b>all</b> the marbles.` },
          {
            html: `${name}'s table is correct because ${a + b} is the number of red and blue marbles.`,
            why: `"All the marbles" includes the green ones too. The whole for one group is ${t}, not ${a + b}.`,
          },
          { html: `${name} should have used ${c} : ${t} in the table instead.`, why: `${c} : ${t} would be green to all marbles. The question asks about red.` },
        ],
        0,
      );
      return {
        type: 'error',
        skill: 'part-whole',
        lesson: '3-1',
        title: 'Challenge: part or whole?',
        xp: 20,
        prompt: `<p>A bag has red, blue, and green marbles in the ratio ${hl(a + ' : ' + b + ' : ' + c)}. ${name} was asked to make a table of the ratio of red marbles to <b>all</b> the marbles.</p>${V.table(
          [
            ['Red', ...ks.map((k) => String(a * k))],
            ['All marbles', ...ks.map((k) => String((a + b) * k))],
          ],
          { header: false, rowHeader: true, cls: 'compact' },
        )}<p>What is wrong?</p>`,
        work: `Red : all = ${a} : ${a} + ${b} = ${a} : ${a + b}`,
        options: sh.options,
        answer: sh.answer,
        fix: { label: `If there are ${a * m} red marbles, how many marbles in all? `, answer: t * m },
        hints: [
          '"All the marbles" means every color in the bag. How many marbles are in one ratio group?',
          `One group has ${a} red + ${b} blue + ${c} green = ${t} marbles. Red to all is ${a} : ${t}.`,
          `With ${a * m} red marbles there are ${a * m} ÷ ${a} = ${m} groups. Multiply the marbles in one group by ${m}.`,
        ],
        hintEs: '"Todas las canicas" significa todos los colores de la bolsa. ¿Cuántas canicas hay en un grupo de la razón?',
        solution: `<p>One ratio group has ${a} + ${b} + ${c} = ${t} marbles, so red to all marbles is ${a} : ${t}. ${name} added only red and blue. With ${a * m} red marbles there are ${m} groups, so the total is ${m} × ${t} = <b>${t * m}</b>.</p>`,
        feedback: {
          correct: 'Correct. The whole must include every part, including the third color.',
          wrong(ans, d) {
            if (!d.mistakeOk) return why(sh.options, ans.mistake) || 'Which marbles belong in "all the marbles"?';
            const f = RX.parseNum(ans.fix);
            if (f === (a + b) * m) return `That total leaves out the green marbles again. One group has ${t} marbles, not ${a + b}.`;
            if (f === (b + c) * m) return `That counts only the blue and green marbles. "All" includes the ${a * m} red ones too.`;
            return `You found the mistake. For the fix, find the number of groups (${a * m} ÷ ${a}), then multiply by ${t} marbles per group.`;
          },
        },
      };
    }
    const [a, b] = r.pick([
        [2, 3],
        [3, 5],
        [1, 4],
        [3, 4],
      ]),
      t = a + b;
    const sh = shuffleOptions(
      r,
      [
        { html: `${name} used the part-to-part ratio ${a} : ${b}. The question asks for red compared to the <b>total</b>, which is ${a} : ${t}.`, ok: true },
        { html: `${name} should have added ${a} and ${b} in every column instead of multiplying.`, why: 'The multiplying is fine. The problem is which two quantities are being compared.' },
        { html: `${name}'s table is correct.`, why: `The table compares red to blue (${a} : ${b}). "Red out of all the marbles" is red to total (${a} : ${t}).` },
        { html: `${name} should have used ${b} : ${t}.`, why: `${b} : ${t} would be blue to total. The question asks about red.` },
      ],
      0,
    );
    return {
      type: 'error',
      skill: 'part-whole',
      lesson: '3-1',
      title: 'Challenge: part or whole?',
      xp: 20,
      prompt: `<p>A bag has ${hl(a + ' red')} marbles for every ${hl(b + ' blue')} marbles. ${name} was asked to make a table of the ratio of red marbles to <b>all</b> the marbles.</p>${V.table(
        [
          ['Red', ...ks.map((k) => String(a * k))],
          ['All marbles', ...ks.map((k) => String(b * k))],
        ],
        { header: false, rowHeader: true, cls: 'compact' },
      )}<p>What is wrong?</p>`,
      work: `Red : all = ${a} : ${b}`,
      options: sh.options,
      answer: sh.answer,
      fix: { label: `If there are ${a * 4} red marbles, how many marbles in all? `, answer: t * 4 },
      hints: [
        '"All the marbles" means red + blue. What is that for one group?',
        `One group has ${a} + ${b} = ${t} marbles. Red to all is ${a} : ${t}.`,
        `With ${a * 4} red marbles there are 4 groups: 4 × ${t}.`,
      ],
      hintEs: '"Todas las canicas" significa las rojas más las azules. ¿Cuántas son en un grupo?',
      solution: `<p>Red to all marbles is ${a} : ${t}, not ${a} : ${b}. With ${a * 4} red marbles (4 groups), the total is 4 × ${t} = <b>${t * 4}</b>.</p>`,
      feedback: {
        correct: 'Correct. Always check whether a ratio compares to another part or to the whole.',
        wrong(ans, d) {
          if (!d.mistakeOk) return why(sh.options, ans.mistake) || 'Which two quantities should be compared?';
          const f = RX.parseNum(ans.fix);
          if (f === b * 4) return `${b * 4} is only the blue marbles. "In all" means red plus blue.`;
          return `Right. For the fix, each group has ${t} marbles total, and ${a * 4} red means 4 groups.`;
        },
      },
    };
  });

  // ---------- Three students, one correct (who) ----------
  G.define('c_threeStudents', (r, o) => {
    const hard = !!o.hard;
    const [n1, n2, n3] = r.pickN(NAMES, 3);
    if (hard) {
      // Job B is paid by minutes; Job B always has the higher hourly rate but the smaller total
      const ua = r.pick([12, 14, 16, 18]),
        ub = ua + r.pick([2, 4]);
      const ha = r.pick([5, 6]),
        mb = r.pick([90, 150]),
        hb = mb / 60;
      const pa = ua * ha,
        pb = ub * hb;
      const sh = shuffleOptions(
        r,
        [
          { title: n1, html: `${mb} minutes = ${hb} hours.<br>Job A: $${pa} ÷ ${ha} = $${ua}/h.<br>Job B: $${pb} ÷ ${hb} = $${ub}/h.<br><b>Job B pays more per hour.</b>`, ok: true },
          {
            title: n2,
            html: `Job A: $${pa} ÷ ${ha} = $${ua} per hour.<br>Job B: $${pb} ÷ ${mb} = $${round(pb / mb, 2)} per minute.<br><b>Job A pays more, since $${ua} is more than $${round(pb / mb, 2)}.</b>`,
            why: `${n2} compared dollars per hour with dollars per minute. Change ${mb} minutes to ${hb} hours first so both rates use the same unit.`,
          },
          {
            title: n3,
            html: `Job A pays $${pa} for ${ha} hours of work.<br>Job B pays $${pb} for ${mb} minutes of work.<br><b>Job A pays more, since $${pa} is more than $${pb}.</b>`,
            why: `${n3} compared total pay, but the amounts of time are different. Compare dollars per hour.`,
          },
        ],
        0,
      );
      return {
        type: 'who',
        skill: 'compare',
        lesson: '3-5',
        title: 'Challenge: which job pays more?',
        xp: 20,
        prompt: `<p>Job A pays ${hl('$' + pa)} for ${hl(ha + ' hours')}. Job B pays ${hl('$' + pb)} for ${hl(mb + ' minutes')}. Three students decide which job pays more <b>per hour</b>. Who is correct?</p>`,
        options: sh.options,
        answer: sh.answer,
        layout: 'cards',
        hints: [
          'Both rates must use the same time unit. Change minutes to hours before you divide (60 minutes = 1 hour).',
          `${mb} ÷ 60 = ${hb} hours. Job A: ${pa} ÷ ${ha}. Job B: ${pb} ÷ ${hb}.`,
          'Compare the two dollars-per-hour rates. Check which student did exactly that.',
        ],
        hintEs: 'Las dos tasas deben usar la misma unidad de tiempo. Cambia los minutos a horas antes de dividir (60 minutos = 1 hora).',
        solution: `<p>${mb} minutes = ${hb} hours. Job A: $${pa} ÷ ${ha} = $${ua} per hour. Job B: $${pb} ÷ ${hb} = $${ub} per hour. <b>Job B</b> pays more per hour, so <b>${n1}</b> is correct, even though Job A pays more in total.</p>`,
        feedback: {
          correct: 'Correct. Matching the time units first makes the unit rates comparable.',
          wrong: (ans) => why(sh.options, ans) || 'Change minutes to hours, then compare dollars per hour.',
        },
      };
    }
    // the better-paying job has fewer hours, so comparing totals points the wrong way
    const low = r.int(12, 18),
      high = low + r.pick([2, 3]);
    const highIsA = r.chance(0.5);
    const ua = highIsA ? high : low,
      ub = highIsA ? low : high;
    const hShort = r.int(2, 3),
      hLong = r.int(5, 6);
    const ha = highIsA ? hShort : hLong,
      hb = highIsA ? hLong : hShort;
    const pa = ua * ha,
      pb = ub * hb;
    const better = ua > ub ? 'A' : 'B',
      worse = better === 'A' ? 'B' : 'A';
    const sh = shuffleOptions(
      r,
      [
        { title: n1, html: `Job A: $${pa} ÷ ${ha} = $${ua}/h.<br>Job B: $${pb} ÷ ${hb} = $${ub}/h.<br><b>Job ${better} pays more per hour.</b>`, ok: true },
        {
          title: n2,
          html: `Job A pays $${pa} for ${ha} hours of work.<br>Job B pays $${pb} for ${hb} hours of work.<br><b>Job ${worse} pays more, since $${Math.max(pa, pb)} is more than $${Math.min(pa, pb)}.</b>`,
          why: `${n2} compared totals, but the hours are different (${ha} and ${hb}). Compare dollars per hour.`,
        },
        {
          title: n3,
          html: `Job A: ${ha} ÷ ${pa} = ${round(ha / pa, 3)}.<br>Job B: ${hb} ÷ ${pb} = ${round(hb / pb, 3)}.<br><b>Job ${worse} pays more, since its number is bigger.</b>`,
          why: `${n3} divided hours by dollars, which gives hours per dollar. Dollars per hour is dollars ÷ hours.`,
        },
      ],
      0,
    );
    return {
      type: 'who',
      skill: 'compare',
      lesson: '3-5',
      title: 'Challenge: which job pays more?',
      xp: 20,
      prompt: `<p>Job A pays ${hl('$' + pa)} for ${hl(ha + ' hours')}. Job B pays ${hl('$' + pb)} for ${hl(hb + ' hours')}. Three students decide which job pays more <b>per hour</b>. Who is correct?</p>`,
      options: sh.options,
      answer: sh.answer,
      layout: 'cards',
      hints: ['Dollars per hour means dollars ÷ hours.', `Job A: ${pa} ÷ ${ha}. Job B: ${pb} ÷ ${hb}.`, 'Compare the two dollars-per-hour rates. Check which student did exactly that.'],
      hintEs: 'Dólares por hora significa dólares ÷ horas.',
      solution: `<p>Job A: $${pa} ÷ ${ha} = $${ua} per hour. Job B: $${pb} ÷ ${hb} = $${ub} per hour. <b>Job ${better}</b> pays more per hour. <b>${n1}</b> is correct, even though Job ${worse} pays more in total.</p>`,
      feedback: {
        correct: 'Correct. The right unit rate, in the right direction, settles the comparison.',
        wrong: (ans) => why(sh.options, ans) || 'Divide dollars by hours for each job, then compare.',
      },
    };
  });
})(typeof window !== 'undefined' ? window : globalThis);
