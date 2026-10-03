/* js/units/u2/gen-questions.js */
/* Zone 1 — The Tide Pools. Lesson 2-1 Understand Statistical Questions (Statistical Questions · Dot Plots and Shape). */
(function (root) {
  'use strict';
  const RX = root.RX;
  const { G, V, shuffleOptions, NAMES } = RX;
  const S = RX.STATS;
  const hl = V.hl;

  const GROUPS = ["the students in Ms. Rivera's class", 'the sixth graders at Tidewater Middle', 'the members of the surf club', 'the campers at Marsh Camp', 'the players on the kayak team'];
  // [statistical question maker, non-statistical twin] pairs on the same topic
  const TOPICS = [
    { stat: (g) => `How many minutes do ${g} spend reading each night?`, one: (g, n) => `How many minutes did ${n} spend reading last night?` },
    { stat: (g) => `How tall are ${g}?`, one: (g, n) => `How tall is ${n}?` },
    { stat: (g) => `How many pets do ${g} have?`, one: (g, n) => `How many pets does ${n} have?` },
    { stat: (g) => `What shoe sizes do ${g} wear?`, one: (g, n) => `What shoe size does ${n} wear?` },
    { stat: (g) => `How many shells did ${g} each collect at the beach?`, one: (g, n) => `How many shells did ${n} collect at the beach?` },
    { stat: (g) => `How long does it take ${g} to get to school?`, one: (g, n) => `How long does it take ${n} to get to school?` },
    { stat: (g) => `What are the ages of the dogs owned by ${g}?`, one: () => `How many days are in the month of March?` },
    { stat: (g) => `How many text messages do ${g} send in a day?`, one: () => `How many students are in the school band?` },
  ];
  const FIXED_ONE = ['What is the capital of Maryland?', 'How many legs does a crab have?', 'What time does the school day start?', 'How many days are in a week?'];

  // ---------- Sort statistical / not statistical ----------
  G.define('s1_sortStatistical', (r) => {
    const g = r.pick(GROUPS);
    const topics = r.pickN(TOPICS, 3),
      names = r.pickN(NAMES, 3);
    const items = [];
    topics.forEach((t, i) => {
      items.push({ html: t.stat(g), bin: 0 });
      items.push({ html: t.one(g, names[i]), bin: 1 });
    });
    if (r.chance(0.5)) items.push({ html: r.pick(FIXED_ONE), bin: 1 });
    return {
      type: 'sort',
      skill: 'stat-question',
      lesson: '2-1',
      title: 'Sort the questions',
      prompt: `<p>The station log lists questions about ${hl(g)}. Sort each question.</p><p class="muted">A <b>statistical question</b> is answered by collecting data that <b>varies</b>: different people give different answers. A question with one answer is not statistical.</p>`,
      bins: ['Statistical question', 'Not statistical'],
      items: r.shuffle(items),
      hints: [
        'Ask: would I need to collect answers from many people, and would those answers be different?',
        `A question about one person (like ${names[0]}) or one fact has a single answer. It is not statistical.`,
        `A question about all of ${g} expects many different answers. That variability makes it statistical.`,
      ],
      solution: `<p>Questions about <b>${g}</b> as a group expect answers that vary, so they are statistical. Questions about one person or one fact have exactly one answer, so they are not.</p>`,
      feedback: { correct: 'Correct. Statistical questions anticipate variability in the answers.' },
    };
  });

  // ---------- Which question is statistical (MC) ----------
  G.define('s1_whichStatistical', (r) => {
    const g = r.pick(GROUPS),
      [t1, t2, t3] = r.pickN(TOPICS, 3),
      [n1, n2] = r.pickN(NAMES, 2);
    const opts = [
      { html: t1.stat(g), ok: true },
      { html: t1.one(g, n1), why: `This asks about one person, ${n1}. There is only one answer, so no data varies.` },
      { html: t2.one(g, n2), why: 'This question has a single answer. A statistical question needs answers that vary from person to person.' },
      { html: r.pick(FIXED_ONE), why: 'This is a fact with exactly one correct answer. Nothing varies, so it is not statistical.' },
    ];
    const sh = shuffleOptions(r, opts, 0);
    return {
      type: 'mc',
      skill: 'stat-question',
      lesson: '2-1',
      title: 'Which question is statistical?',
      prompt: `<p>A Junior Data Surveyor wants to collect data about ${hl(g)}.</p><p>Which question is a <b>statistical question</b>?</p>`,
      options: sh.options,
      answer: sh.answer,
      hints: [
        'A statistical question is answered with data that varies. Look for a question whose answers would be different for different people.',
        'Cross out any question about one person or one fact. Those have only one answer.',
        `Only one question asks about all of ${g} and expects many different answers.`,
      ],
      solution: `<p><b>${t1.stat(g)}</b> is statistical. Each person gives a different answer, so the data varies. The other questions each have one answer.</p>`,
      feedback: { correct: 'Correct. A statistical question anticipates variability in the data.' },
    };
  });

  // ---------- True/false with reason ----------
  G.define('s1_statTF', (r) => {
    const g = r.pick(GROUPS),
      t = r.pick(TOPICS),
      n = r.pick(NAMES);
    const statTrue = r.chance(0.5);
    const q = statTrue ? t.stat(g) : t.one(g, n);
    const reasons = statTrue
      ? [
          { html: 'The answers would vary from person to person, so you must collect data.', correct: true },
          { html: 'It has exactly one answer.' },
          { html: 'It uses the word "how," and every "how" question is statistical.' },
        ]
      : [
          { html: 'It has only one answer, so there is no variability to study.', correct: true },
          { html: 'It is about a number, and numbers are always statistical.' },
          { html: 'It would take too long to answer.' },
        ];
    return {
      type: 'tf',
      skill: 'stat-question',
      lesson: '2-1',
      title: 'Statistical or not?',
      prompt: `<p>Read the question: <b>"${q}"</b></p><p>True or false: this is a statistical question.</p>`,
      answer: statTrue,
      reasons: r.shuffle(reasons),
      hints: [
        'Think about who the question is about: one person, or a whole group?',
        'If different people would give different answers, the data varies.',
        statTrue ? `Many people in ${g} would answer differently, so the data varies.` : 'There is only one answer, so no data varies.',
      ],
      solution: statTrue
        ? `<p><b>True.</b> The question is about a whole group, so the answers would be different for different people. That variability is what makes a question statistical.</p>`
        : `<p><b>False.</b> The question has exactly one answer. A statistical question must be answered by collecting data that varies.</p>`,
      feedback: {
        correct: statTrue ? 'Correct. Varying answers make it statistical.' : 'Correct. One answer means it is not statistical.',
        wrong(ans, d) {
          if (!d.valueOk)
            return statTrue
              ? 'Would everyone give the same answer? No. Different answers mean the question is statistical.'
              : 'How many different answers can this question have? Just one. That means it is not statistical.';
          return 'Your true/false choice is right. Pick the reason that talks about whether the answers vary.';
        },
      },
    };
  });

  // ---------- Write a statistical question (CR) ----------
  G.define('s1_writeStatistical', (r) => {
    const g = r.pick(GROUPS),
      topic = r.pick(['sleep', 'homework', 'lunch', 'sports', 'pets', 'screen time', 'the beach']);
    const t = r.pick(TOPICS),
      n = r.pick(NAMES);
    const sh = shuffleOptions(r, [{ html: t.stat(g), ok: true }, { html: t.one(g, n) }, { html: r.pick(FIXED_ONE) }], 0);
    return {
      type: 'cr',
      skill: 'stat-question',
      lesson: '2-1',
      title: 'Write a statistical question',
      prompt: `<p>Write a <b>statistical question</b> about ${hl(topic)} that you could ask ${hl(g)}. Then explain why the answers would vary.</p>`,
      starters: ['My question is: How many…', 'The answers would vary because…', 'Each person would answer differently because…'],
      minWords: 10,
      check: { prompt: 'Which of these is also a statistical question?', options: sh.options, answer: sh.answer },
      hints: [
        'Start with "How many…" or "How long…" and ask about everyone in the group, not one person.',
        'Then say why different people would give different answers.',
        `Example shape: "How many hours do ${g} spend on ${topic} each week?" The answers vary because each person is different.`,
      ],
      solution: `<p>A good statistical question asks about the whole group, for example "How much time do ${g} spend on ${topic} each week?" The answers vary because each person has a different schedule. In the check, <b>${t.stat(g)}</b> is statistical because many different answers are expected.</p>`,
      feedback: {
        correct: 'Correct. Your question anticipates variability, which makes it statistical.',
        wrong(ans, d) {
          if (!d.wroteEnough) return 'Write at least ten words: your question plus a sentence about why the answers vary.';
          return 'For the check, pick the question whose answers would be different for different people.';
        },
      },
    };
  });

  // ---------- Dot plot contexts ----------
  const DOTS = [
    { label: 'Crabs counted per tide pool', unit: 'crabs', thing: 'tide pools', lo: 2, hi: 9 },
    { label: 'Shells collected per student', unit: 'shells', thing: 'students', lo: 0, hi: 8 },
    { label: 'Fish per net', unit: 'fish', thing: 'nets', lo: 3, hi: 10 },
    { label: 'Hours of sun recorded per day', unit: 'hours', thing: 'days', lo: 4, hi: 12 },
    { label: 'Birds seen per walk', unit: 'birds', thing: 'walks', lo: 1, hi: 8 },
  ];

  // ---------- Read a dot plot (num) ----------
  G.define('s1_dotRead', (r) => {
    const c = r.pick(DOTS),
      n = r.int(9, 13);
    const vals = S.shaped(r, r.pick(['symmetric', 'skewed right', 'skewed left']), c.lo, c.hi, n);
    const cnt = S.counts(vals),
      keys = Object.keys(cnt)
        .map(Number)
        .sort((a, b) => a - b);
    const kind = r.pick(['total', 'atLeast', 'exact', 'lessThan']);
    const k = r.pick(keys.slice(1, -1).length ? keys.slice(1, -1) : keys);
    let ask, answer, how;
    if (kind === 'total') {
      ask = `How many ${c.thing} were surveyed in all?`;
      answer = n;
      how = `Count every dot: ${n}.`;
    } else if (kind === 'exact') {
      ask = `How many ${c.thing} had exactly ${hl(k + ' ' + c.unit)}?`;
      answer = cnt[k];
      how = `Count the dots stacked above ${k}: ${cnt[k]}.`;
    } else if (kind === 'atLeast') {
      ask = `How many ${c.thing} had ${hl(k + ' or more ' + c.unit)}?`;
      answer = vals.filter((v) => v >= k).length;
      how = `Count the dots above ${k} and every value to its right: ${answer}.`;
    } else {
      ask = `How many ${c.thing} had ${hl('fewer than ' + k + ' ' + c.unit)}?`;
      answer = vals.filter((v) => v < k).length;
      how = `Count the dots to the left of ${k} (not including ${k}): ${answer}.`;
    }
    return {
      type: 'num',
      skill: 'dot-plot',
      lesson: '2-1',
      title: 'Read the dot plot',
      prompt: `<p>The dot plot shows the number of ${c.unit} recorded for each of the ${c.thing} in a survey. Each dot is one ${c.thing.replace(/s$/, '')}.</p>${V.dotPlot({ values: vals, min: c.lo, max: c.hi, label: c.label, aria: 'Dot plot: ' + S.list(S.sorted(vals)) })}<p>${ask}</p>`,
      unit: '',
      answer,
      hints: [
        'Each dot stands for one ' + c.thing.replace(/s$/, '') + '. The number under a stack tells the value.',
        kind === 'total' ? 'Count all the dots in every stack.' : `Find ${k} on the number line first. Decide which stacks the question includes.`,
        how,
      ],
      solution: `<p>${how} The answer is <b>${answer}</b>.</p>`,
      feedback: {
        correct: 'Correct. Each dot counts once, and the number line tells its value.',
        wrong(ans, d) {
          if (kind === 'atLeast' && d.value === vals.filter((v) => v > k).length) return `${k} or more includes ${k} itself. Add the dots above ${k}.`;
          if (kind === 'lessThan' && d.value === vals.filter((v) => v <= k).length) return `Fewer than ${k} does not include ${k}. Do not count the dots above ${k}.`;
          if (kind === 'exact' && d.value === k) return `${k} is the value on the number line. The question asks how many dots are stacked above it.`;
          return 'Count dots, not numbers on the line. Each dot is one ' + c.thing.replace(/s$/, '') + '.';
        },
      },
    };
  });

  // ---------- Build a dot plot on a number line (nl) ----------
  G.define('s1_dotBuild', (r) => {
    const c = r.pick(DOTS),
      n = r.int(4, 6);
    const vals = S.data(r, n, c.lo, c.hi, true);
    const names = r.pickN(NAMES, 1)[0];
    return {
      type: 'nl',
      skill: 'dot-plot',
      lesson: '2-1',
      title: 'Place the data on the line',
      prompt: `<p>${names} recorded the number of ${c.unit} in ${n} different ${c.thing}: ${hl(S.list(vals))}.</p><p>Build the dot plot: place one point above each data value on the number line.</p>`,
      min: c.lo,
      max: c.hi,
      step: 1,
      count: n,
      points: vals.slice(),
      hints: [
        'Each data value gets exactly one point, placed above that number on the line.',
        `Start with the smallest value, ${Math.min(...vals)}, and work up to the largest, ${Math.max(...vals)}.`,
        `The points go at ${S.list(S.sorted(vals))}.`,
      ],
      solution: `<p>Put one point above each value: <b>${S.list(S.sorted(vals))}</b>. A dot plot shows every data value in its place on the number line.</p>${V.dotPlot({ values: vals, min: c.lo, max: c.hi, label: c.label })}`,
      feedback: {
        correct: 'Correct. Every data value has its own dot above its number.',
        wrong(ans, d) {
          if (d.extra && d.extra.length) return `${RX.fmt(d.extra[0])} is not one of the data values. Check the list: ${S.list(vals)}.`;
          if (d.missing && d.missing.length) return `You still need a point at ${RX.fmt(d.missing[0])}.`;
          return 'Match each point to a value in the list.';
        },
      },
    };
  });

  // ---------- Describe the shape (MC) ----------
  G.define('s1_shapeDescribe', (r) => {
    const c = r.pick(DOTS);
    let kind, vals;
    for (let t = 0; t < 50; t++) {
      kind = r.pick(['symmetric', 'skewed right', 'skewed left']);
      vals = S.shaped(r, kind, c.lo, c.hi, r.int(11, 14));
      if (S.shapeOf(vals) === kind) break;
    }
    kind = S.shapeOf(vals);
    const opts = [
      {
        html:
          kind === 'symmetric'
            ? 'Symmetric: the left and right sides look about the same.'
            : kind === 'skewed right'
              ? 'Skewed right: most values are on the left, with a tail stretching to the right.'
              : 'Skewed left: most values are on the right, with a tail stretching to the left.',
        ok: true,
      },
      kind === 'symmetric'
        ? { html: 'Skewed right: most values are on the left, with a tail to the right.', why: 'Look at both sides of the peak. They are about the same, so the plot is symmetric, not skewed.' }
        : { html: 'Symmetric: the left and right sides look about the same.', why: 'One side has a long tail and the other does not. That is skewed, not symmetric.' },
      kind === 'skewed left'
        ? {
            html: 'Skewed right: most values are on the left, with a tail to the right.',
            why: 'The tail stretches toward the smaller values on the left. "Skewed" names the side of the tail, so this is skewed left.',
          }
        : {
            html: 'Skewed left: most values are on the right, with a tail to the left.',
            why:
              kind === 'symmetric'
                ? 'The two sides balance. A skewed plot has one long tail; this plot does not.'
                : 'The tail stretches toward the larger values on the right. A skewed distribution is named for the side with the tail.',
          },
      { html: 'There is no shape because the dots are different heights.', why: 'Different stack heights are exactly what creates the shape. Look at where the data piles up and where it thins out.' },
    ];
    const sh = shuffleOptions(r, opts, 0);
    return {
      type: 'mc',
      skill: 'shape',
      lesson: '2-1',
      title: 'Describe the shape',
      prompt: `<p>The dot plot shows ${c.label.toLowerCase()}.</p>${V.dotPlot({ values: vals, min: c.lo, max: c.hi, label: c.label, aria: 'Dot plot: ' + S.list(S.sorted(vals)) })}<p>Which statement best describes the <b>shape</b> of the distribution?</p>`,
      options: sh.options,
      answer: sh.answer,
      hints: [
        'Find the tallest stack (the peak). Then compare the left side of the peak with the right side.',
        'If one side stretches out much farther than the other, that long side is the tail, and the plot is skewed toward it.',
        kind === 'symmetric' ? 'Both sides are about the same length and height. The plot is symmetric.' : `The tail stretches to the ${kind.split(' ')[1]}. The plot is ${kind}.`,
      ],
      solution: `<p>The distribution is <b>${kind}</b>. ${kind === 'symmetric' ? 'The two sides of the peak mirror each other.' : `Most values cluster on one side and a thinner tail stretches to the ${kind.split(' ')[1]}. A skewed distribution is named for the direction of its tail.`}</p>`,
      feedback: { correct: 'Correct. Shape describes where the data piles up and which way the tail points.' },
    };
  });

  // ---------- Select all true features (MS) ----------
  G.define('s1_featuresMS', (r, o) => {
    const c = r.pick(DOTS),
      hard = !!o.hard;
    let vals, cnt, keys;
    for (let t = 0; t < 60; t++) {
      vals = S.shaped(r, r.pick(['symmetric', 'skewed right', 'skewed left']), c.lo, c.hi, hard ? 14 : 11);
      cnt = S.counts(vals);
      keys = Object.keys(cnt).map(Number);
      const maxC = Math.max(...keys.map((k) => cnt[k]));
      if (keys.filter((k) => cnt[k] === maxC).length === 1) break;
    }
    const maxC = Math.max(...keys.map((k) => cnt[k]));
    const peak = keys.find((k) => cnt[k] === maxC);
    const lo = Math.min(...vals),
      hi = Math.max(...vals);
    const gaps = [];
    for (let v = lo + 1; v < hi; v++) if (!cnt[v]) gaps.push(v);
    const notPeak = keys.filter((k) => k !== peak);
    const wrongPeak = r.pick(notPeak);
    const opts = [
      { html: `The peak is at ${peak} ${c.unit}.`, ok: true },
      { html: `There are ${vals.length} data values in all.`, ok: true },
      { html: `The peak is at ${wrongPeak} ${c.unit}.`, ok: false },
      { html: `There are ${vals.length + r.pick([-2, 2, 3])} data values in all.`, ok: false },
    ];
    if (gaps.length) opts.push({ html: `There is a gap at ${gaps[0]} ${c.unit}: no ${c.thing.replace(/s$/, '')} had that value.`, ok: true });
    else opts.push({ html: `There is a gap at ${r.pick(keys.filter((k) => k > lo && k < hi).length ? keys.filter((k) => k > lo && k < hi) : keys)} ${c.unit}.`, ok: false });
    const ok = opts.map((x, i) => (x.ok ? i : -1)).filter((i) => i >= 0);
    const sh = shuffleOptions(r, opts, ok);
    return {
      type: 'ms',
      skill: 'shape',
      lesson: '2-1',
      title: hard ? 'Describe the distribution (harder)' : 'Describe the distribution',
      prompt: `<p>The dot plot shows ${c.label.toLowerCase()}.</p>${V.dotPlot({ values: vals, min: c.lo, max: c.hi, label: c.label, aria: 'Dot plot: ' + S.list(S.sorted(vals)) })}<p>Select <b>all</b> statements that are true about this distribution.</p>`,
      options: sh.options,
      answers: sh.answers,
      hints: [
        'The peak is the value with the tallest stack of dots. A gap is a value between the smallest and largest with no dots at all.',
        `Count the dots in each stack. The tallest stack has ${maxC} dots.`,
        `Total dots: ${vals.length}. Peak: ${peak}. ${gaps.length ? `Gap at ${gaps[0]}.` : 'There is no gap: every value from ' + lo + ' to ' + hi + ' has at least one dot.'}`,
      ],
      solution: `<p>The tallest stack is above <b>${peak}</b>, so that is the peak. Counting every dot gives <b>${vals.length}</b> values. ${gaps.length ? `No dots sit above <b>${gaps[0]}</b>, so there is a gap there.` : `Every value from ${lo} to ${hi} has at least one dot, so there is no gap.`}</p>`,
      feedback: {
        correct: 'Correct. Peak, gap, and total count all come straight from the stacks of dots.',
        wrong(ans, d) {
          if (d.extra && d.extra.length) {
            const t = sh.options[d.extra[0]].html;
            if (/peak/.test(t)) return 'Check the peak again. It is the value with the most dots, not the largest value.';
            if (/gap/.test(t)) return 'A gap is a value inside the data range with zero dots. Look again at that spot on the line.';
            return 'Count the dots one stack at a time and add the stacks.';
          }
          return 'You missed a true statement. Check the peak, the total count, and whether any value inside the range has no dots.';
        },
      },
    };
  });
})(typeof window !== 'undefined' ? window : globalThis);

/* js/units/u2/gen-histogram.js */
/* Zone 2 — Dune Ridge. Lesson 2-2 Represent and Describe Data in a Histogram (Building a Histogram · Describing Histogram Shape). */
(function (root) {
  'use strict';
  const RX = root.RX;
  const { G, V, shuffleOptions, NAMES } = RX;
  const S = RX.STATS;
  const hl = V.hl;

  const CTX = [
    { what: 'shells collected per student', xLabel: 'Shells collected', unit: 'shells', who: 'students' },
    { what: 'minutes each visitor spent at the tide pools', xLabel: 'Minutes at the tide pools', unit: 'minutes', who: 'visitors' },
    { what: 'wingspans of gulls in centimeters', xLabel: 'Wingspan (cm)', unit: 'cm', who: 'gulls' },
    { what: 'daily high tides in centimeters above the marker', xLabel: 'Tide height (cm)', unit: 'cm', who: 'days' },
    { what: 'points scored by each team in a beach relay', xLabel: 'Points scored', unit: 'points', who: 'teams' },
  ];
  /** Intervals of width w starting at start: [{lo,hi,label}] */
  const bins = (start, w, k) => Array.from({ length: k }, (_, i) => ({ lo: start + i * w, hi: start + (i + 1) * w - 1, label: `${start + i * w}–${start + (i + 1) * w - 1}` }));
  const binOf = (bs, v) => bs.findIndex((b) => v >= b.lo && v <= b.hi);
  const countBins = (bs, vals) => bs.map((b) => vals.filter((v) => v >= b.lo && v <= b.hi).length);
  const hist = (bs, cts, c, o) =>
    V.histogram(
      Object.assign(
        {
          bins: bs.map((b, i) => ({ label: b.label, count: cts[i] })),
          yMax: Math.max(...cts) + 1,
          xLabel: c.xLabel,
          yLabel: 'Frequency',
          width: 400,
          height: 240,
          aria: `Histogram: ${bs.map((b, i) => b.label + ' has ' + cts[i]).join(', ')}`,
        },
        o || {},
      ),
    );

  // ---------- Which interval holds the value (MC) ----------
  G.define('s2_whichBin', (r) => {
    const c = r.pick(CTX),
      w = r.pick([5, 10]),
      start = r.pick([0, 10, 20]),
      bs = bins(start, w, 4);
    // choose a boundary-ish value to force the "19 in 10–19 or 20–29?" decision
    const bi = r.int(1, 2);
    const v = r.chance(0.5) ? bs[bi].hi : bs[bi].lo;
    const edge = v === bs[bi].hi;
    const opts = [
      { html: bs[bi].label, ok: true },
      {
        html: bs[edge ? bi + 1 : bi - 1].label,
        why: edge
          ? `${bs[bi + 1].label} starts at ${bs[bi + 1].lo}. The value ${v} is less than ${bs[bi + 1].lo}, so it belongs in the interval that ends at ${v}.`
          : `${bs[bi - 1].label} ends at ${bs[bi - 1].hi}. The value ${v} is greater than ${bs[bi - 1].hi}, so it belongs in the next interval, which starts at ${v}.`,
      },
      { html: `Both ${bs[bi].label} and ${bs[edge ? bi + 1 : bi - 1].label}`, why: 'Intervals in a histogram never overlap. Every value belongs to exactly one interval.' },
      { html: bs[edge ? bi - 1 : bi + 1].label, why: `${v} is not between ${bs[edge ? bi - 1 : bi + 1].lo} and ${bs[edge ? bi - 1 : bi + 1].hi}.` },
    ];
    const sh = shuffleOptions(r, opts, 0);
    return {
      type: 'mc',
      skill: 'histogram',
      lesson: '2-2',
      title: 'Which interval?',
      prompt: `<p>A surveyor is sorting ${c.what} into these intervals: ${bs.map((b) => hl(b.label)).join(', ')}.</p><p>In which interval does the value ${hl(v + ' ' + c.unit)} belong?</p>`,
      options: sh.options,
      answer: sh.answer,
      hints: [
        'An interval like 10–19 includes 10, 19, and every whole number between them.',
        `Find the interval whose first number is at or below ${v} and whose last number is at or above ${v}.`,
        `${bs[bi].lo} ≤ ${v} ≤ ${bs[bi].hi}, so ${v} belongs in ${bs[bi].label}.`,
      ],
      solution: `<p>${v} is between ${bs[bi].lo} and ${bs[bi].hi}, including the endpoints, so it belongs in <b>${bs[bi].label}</b>. Intervals do not overlap, so a value never goes in two bars.</p>`,
      feedback: { correct: `Correct. ${v} fits inside ${bs[bi].label} and no other interval.` },
    };
  });

  // ---------- Frequency table from data (table) ----------
  G.define('s2_freqTable', (r, o) => {
    const c = r.pick(CTX),
      hard = !!o.hard,
      w = r.pick([5, 10]),
      start = r.pick([0, 10]);
    const k = hard ? 5 : 4,
      bs = bins(start, w, k);
    let vals, cts;
    for (let t = 0; t < 40; t++) {
      vals = S.data(r, hard ? 16 : 12, start, start + w * k - 1);
      cts = countBins(bs, vals);
      if (cts.every((x) => x > 0) || t > 30) break;
    }
    const shown = r.shuffle(vals.slice());
    const rows = [['Interval', 'Frequency']].concat(bs.map((b, i) => [b.label, `__IN:b${i}__`]));
    return {
      type: 'table',
      skill: 'histogram',
      lesson: '2-2',
      title: hard ? 'Build the frequency table (harder)' : 'Build the frequency table',
      prompt: `<p>Here are the ${c.what} for ${vals.length} ${c.who}:</p><p class="data-list">${hl(S.list(shown))}</p><p>Complete the frequency table. Count how many values fall in each interval.</p>`,
      rows,
      header: true,
      inputs: bs.map((b, i) => ({ id: 'b' + i, answer: cts[i] })),
      hints: [
        'Go through the list one value at a time. Decide which interval each value belongs to, and make a tally mark there.',
        `Values from ${bs[0].lo} to ${bs[0].hi} go in the first interval. ${bs[1].lo} to ${bs[1].hi} go in the second, and so on.`,
        `Check: your frequencies must add up to ${vals.length}, the number of values.`,
      ],
      solution: `<p>Sorted data: ${S.list(S.sorted(vals))}.</p><p>${bs.map((b, i) => `${b.label}: <b>${cts[i]}</b>`).join(' · ')}. The counts add to ${vals.length}, one for each value.</p>`,
      feedback: {
        correct: `Correct. The frequencies add to ${vals.length}, so every value was counted exactly once.`,
        wrong(ans, d) {
          const total = Object.values(ans)
            .map(RX.parseNum)
            .reduce((s, v) => s + (v || 0), 0);
          if (total !== vals.length) return `Your frequencies add to ${total}, but there are ${vals.length} values. A value was skipped or counted twice.`;
          const i = Number(String(d.wrong[0]).slice(1));
          return `Recount the interval ${bs[i].label}. Values equal to ${bs[i].lo} or ${bs[i].hi} belong in it too.`;
        },
      },
    };
  });

  // ---------- Overlapping-interval error (error) ----------
  G.define('s2_binError', (r) => {
    const name = r.pick(NAMES),
      c = r.pick(CTX),
      w = 10,
      start = 0,
      bad = ['0–10', '10–20', '20–30', '30–40'];
    const good = bins(start, w, 4);
    const vals = S.data(r, 10, 0, 39);
    const boundary = r.pick([10, 20, 30]);
    if (!vals.includes(boundary)) vals[r.int(0, 9)] = boundary;
    const cts = countBins(good, vals);
    const gi = binOf(good, boundary);
    const opts = [
      { html: `The intervals overlap. A value like ${boundary} fits in two intervals, so it could be counted twice.`, ok: true },
      {
        html: 'The intervals are too wide. Every histogram must use intervals of width 5.',
        why: 'Any equal width works. Width 10 is a fine choice. The problem is where the intervals start and stop.',
      },
      {
        html: 'There should be a space between the intervals so the bars do not touch.',
        why: 'Histogram bars are supposed to touch. The intervals must cover every number with no gaps and no overlaps.',
      },
      {
        html: 'There is no mistake. The intervals are fine.',
        why: `Where does ${boundary} go: ${bad[gi]} or ${bad[gi + 1] || bad[gi - 1]}? When one value fits two intervals, the intervals overlap.`,
      },
    ];
    const sh = shuffleOptions(r, opts, 0);
    return {
      type: 'error',
      skill: 'histogram',
      lesson: '2-2',
      title: 'Find the mistake',
      prompt: `<p>${name} is making a histogram of ${c.what}. The data: ${hl(S.list(S.sorted(vals)))}.</p><p>What is wrong with the intervals ${name} chose?</p>`,
      work: `Intervals: &nbsp; ${bad.join(' &nbsp;|&nbsp; ')}`,
      options: sh.options,
      answer: sh.answer,
      fix: { label: `Using the intervals ${good.map((b) => b.label).join(', ')}, how many values are in ${good[gi].label}?`, answer: cts[gi] },
      hints: [
        `Look at the value ${boundary} in the data. Which of ${name}'s intervals does it belong to?`,
        'Intervals in a histogram must not share any numbers. Each ends just before the next one begins, like 0–9 and 10–19.',
        `With the intervals ${good.map((b) => b.label).join(', ')}, count the values from ${good[gi].lo} to ${good[gi].hi}.`,
      ],
      solution: `<p>The intervals <b>overlap</b>: ${boundary} belongs to both ${bad[gi]} and ${bad[gi + 1] || bad[gi - 1]}. Correct intervals never share a value, such as ${good.map((b) => b.label).join(', ')}. With those, the interval ${good[gi].label} holds <b>${cts[gi]}</b> values.</p>`,
      feedback: {
        correct: 'Correct. Intervals must cover every value exactly once: no overlaps, no gaps.',
        wrong(ans, d) {
          if (!d.mistakeOk) return `Try placing ${boundary}. If it fits in two intervals, the intervals overlap.`;
          return `You found the mistake. Now count the values from ${good[gi].lo} through ${good[gi].hi} in the data list.`;
        },
      },
    };
  });

  // ---------- Read a histogram (num) ----------
  G.define('s2_readHist', (r) => {
    const c = r.pick(CTX),
      w = r.pick([5, 10]),
      start = r.pick([0, 10, 20]),
      bs = bins(start, w, r.pick([4, 5]));
    const cts = bs.map(() => r.int(1, 8));
    const total = S.sum(cts);
    const kind = r.pick(['total', 'atLeast', 'lessThan', 'oneBin']);
    const bi = r.int(1, bs.length - 2);
    let ask, answer, how;
    if (kind === 'total') {
      ask = `How many ${c.who} are in the data set?`;
      answer = total;
      how = `Add the heights of all the bars: ${cts.join(' + ')} = ${total}.`;
    } else if (kind === 'atLeast') {
      ask = `How many ${c.who} had ${hl(bs[bi].lo + ' or more ' + c.unit)}?`;
      answer = S.sum(cts.slice(bi));
      how = `Add the bars for ${bs
        .slice(bi)
        .map((b) => b.label)
        .join(', ')}: ${cts.slice(bi).join(' + ')} = ${answer}.`;
    } else if (kind === 'lessThan') {
      ask = `How many ${c.who} had ${hl('fewer than ' + bs[bi].lo + ' ' + c.unit)}?`;
      answer = S.sum(cts.slice(0, bi));
      how = `Add the bars to the left of ${bs[bi].lo}: ${cts.slice(0, bi).join(' + ')} = ${answer}.`;
    } else {
      ask = `How many ${c.who} had between ${hl(bs[bi].lo)} and ${hl(bs[bi].hi + ' ' + c.unit)}?`;
      answer = cts[bi];
      how = `Read the height of the ${bs[bi].label} bar: ${cts[bi]}.`;
    }
    return {
      type: 'num',
      skill: 'histogram',
      lesson: '2-2',
      title: 'Read the histogram',
      prompt: `<p>The histogram shows ${c.what}.</p>${hist(bs, cts, c)}<p>${ask}</p>`,
      unit: c.who,
      answer,
      hints: [
        'The height of each bar is the frequency: how many values fall in that interval.',
        kind === 'oneBin' ? `Find the bar labeled ${bs[bi].label} and read its height on the left axis.` : `Decide which bars the question includes, then add their heights.`,
        how,
      ],
      solution: `<p>${how} The answer is <b>${answer}</b>.</p>`,
      feedback: {
        correct: 'Correct. Bar heights are counts, and adding bars combines intervals.',
        wrong(ans, d) {
          if (kind === 'atLeast' && d.value === S.sum(cts.slice(bi + 1))) return `${bs[bi].lo} or more includes the whole ${bs[bi].label} bar. Add it in.`;
          if (kind === 'lessThan' && d.value === S.sum(cts.slice(0, bi + 1))) return `Fewer than ${bs[bi].lo} does not include the ${bs[bi].label} bar.`;
          if (kind === 'oneBin' && d.value === bs[bi].lo) return 'You read the interval label. The question asks for the bar height, which is the count.';
          return 'Read each bar height from the left axis, then combine the bars the question asks about.';
        },
      },
    };
  });

  // ---------- Shape of a histogram (MC) ----------
  G.define('s2_shapeHist', (r) => {
    const c = r.pick(CTX),
      w = 10,
      start = r.pick([0, 10]),
      bs = bins(start, w, 5);
    const kind = r.pick(['symmetric', 'skewed right', 'skewed left']);
    const base = kind === 'symmetric' ? [1, 3, 6, 3, 1] : kind === 'skewed right' ? [7, 4, 2, 1, 1] : [1, 1, 2, 4, 7];
    const cts = base.map((x) => x + r.int(0, 1));
    const txt = {
      symmetric: 'Symmetric: the bars on both sides of the tallest bar are about the same.',
      'skewed right': 'Skewed right: the tallest bars are on the left and the bars get shorter toward the right.',
      'skewed left': 'Skewed left: the tallest bars are on the right and the bars get shorter toward the left.',
    };
    const why = {
      symmetric: 'Compare the bars on each side of the tallest bar. They are nearly mirror images, so this is symmetric.',
      'skewed right': 'The tall bars are on the left and the short tail trails to the right. A skewed shape is named for the direction of its tail.',
      'skewed left': 'The tall bars are on the right and the short tail trails to the left. A skewed shape is named for the direction of its tail.',
    };
    const opts = Object.keys(txt).map((k) => (k === kind ? { html: txt[k], ok: true } : { html: txt[k], why: why[kind] }));
    opts.push({ html: 'Uniform: every bar is the same height.', why: 'The bars are clearly different heights. Uniform means flat, which this is not.' });
    const sh = shuffleOptions(r, opts, opts.findIndex((x) => x.ok));
    return {
      type: 'mc',
      skill: 'shape',
      lesson: '2-2',
      title: 'Describe the shape of the histogram',
      prompt: `<p>The histogram shows ${c.what}.</p>${hist(bs, cts, c)}<p>Which statement describes the <b>shape</b> of the distribution?</p>`,
      options: sh.options,
      answer: sh.answer,
      hints: [
        'Find the tallest bar. Then look at how the bars change to its left and to its right.',
        'If the bars get shorter in one direction only, that direction is the tail. The shape is skewed toward the tail.',
        kind === 'symmetric' ? 'The bars rise, peak in the middle, then fall the same way. Symmetric.' : `The tail trails to the ${kind.split(' ')[1]}. The shape is ${kind}.`,
      ],
      solution: `<p>The shape is <b>${kind}</b>. ${why[kind]}</p>`,
      feedback: { correct: 'Correct. Shape is read from the pattern of bar heights, and skew is named for the tail.' },
    };
  });

  // ---------- Why no gaps between bars (CR) ----------
  G.define('s2_noGapsCR', (r) => {
    const name = r.pick(NAMES),
      c = r.pick(CTX),
      w = r.pick([5, 10]),
      start = r.pick([0, 10]),
      bs = bins(start, w, 4);
    const sh = shuffleOptions(
      r,
      [
        { html: 'The intervals are next to each other with no numbers left out, so the bars touch.', ok: true },
        { html: 'The bars touch to make the graph look neater.' },
        { html: 'The data values are all the same, so the bars have to touch.' },
        { html: 'The bars touch because the frequencies are large.' },
      ],
      0,
    );
    return {
      type: 'cr',
      skill: 'histogram',
      lesson: '2-2',
      title: 'Why do the bars touch?',
      prompt: `<p>${name} made a histogram of ${c.what} using the intervals ${bs.map((b) => hl(b.label)).join(', ')}. A friend asks why the bars touch, when the bars in a bar graph have spaces between them.</p><p>Explain why a histogram has <b>no gaps</b> between its bars.</p>`,
      starters: ['The intervals in a histogram…', 'There are no gaps because every number…', 'A bar graph shows separate categories, but a histogram…'],
      minWords: 10,
      check: { prompt: 'Which statement best explains why the bars touch?', options: sh.options, answer: sh.answer },
      hints: [
        'Think about what the horizontal axis shows: separate categories, or a continuous number line?',
        `Each interval ends right where the next one begins: ${bs[0].label}, then ${bs[1].label}, then ${bs[2].label}.`,
        'Because the intervals cover every value with nothing skipped, there is nothing between the bars, so they touch.',
      ],
      solution: `<p>A histogram's horizontal axis is a number line split into intervals. The intervals ${bs.map((b) => b.label).join(', ')} sit side by side with <b>no numbers left out</b>, so the bars have nothing between them and they touch. A bar graph shows separate categories, which is why its bars have spaces.</p>`,
      feedback: {
        correct: 'Correct. Touching bars show that the intervals are continuous, with no values skipped.',
        wrong(ans, d) {
          if (!d.wroteEnough) return 'Write at least ten words. Say something about the intervals and the numbers between them.';
          return 'For the check, choose the reason that talks about the intervals covering every number.';
        },
      },
    };
  });

  // ---------- Match a frequency table to its histogram (rep) ----------
  G.define('s2_matchHist', (r) => {
    const c = r.pick(CTX),
      w = r.pick([5, 10]),
      start = r.pick([0, 10]),
      bs = bins(start, w, 4);
    let cts;
    for (let t = 0; t < 20; t++) {
      cts = bs.map(() => r.int(1, 7));
      if (new Set(cts).size >= 3) break;
    }
    const rev = cts.slice().reverse();
    const swapped = cts.slice();
    [swapped[0], swapped[1]] = [swapped[1], swapped[0]];
    const yMax = Math.max(...cts) + 1;
    const mk = (cc) => hist(bs, cc, c, { width: 230, height: 170, yMax, showCounts: false });
    const opts = [{ html: mk(cts), ok: true }];
    if (rev.join() !== cts.join()) opts.push({ html: mk(rev), why: 'This histogram has the bars in reverse order. Read the interval labels under each bar.' });
    if (swapped.join() !== cts.join() && swapped.join() !== rev.join()) opts.push({ html: mk(swapped), why: `The first two bars are swapped. The ${bs[0].label} bar should have height ${cts[0]}.` });
    if (opts.length < 3) opts.push({ html: mk(cts.map((x, i) => (i === 2 ? x + 2 : x))), why: `The ${bs[2].label} bar is too tall. The table says ${cts[2]}.` });
    const sh = shuffleOptions(r, opts, 0);
    return {
      type: 'rep',
      skill: 'histogram',
      lesson: '2-2',
      title: 'Match the table to its histogram',
      prompt: `<p>Which histogram shows the data in this frequency table of ${c.what}?</p>${V.table([['Interval', 'Frequency']].concat(bs.map((b, i) => [b.label, String(cts[i])])), { header: true, cls: 'compact' })}`,
      options: sh.options,
      answer: sh.answer,
      layout: 'cards',
      hints: [
        'Each row of the table becomes one bar. The interval is the label; the frequency is the height.',
        `The first bar, ${bs[0].label}, should reach ${cts[0]} on the vertical axis.`,
        `Check the tallest bar: it should be ${bs[cts.indexOf(Math.max(...cts))].label} with height ${Math.max(...cts)}.`,
      ],
      solution: `<p>The correct histogram has bar heights ${cts.join(', ')} for ${bs.map((b) => b.label).join(', ')}, in that order, matching the table row by row.</p>`,
      feedback: { correct: 'Correct. Each table row is one bar, in order along the number line.' },
    };
  });

  // ---------- What a histogram cannot tell you (TF) ----------
  G.define('s2_exactTF', (r) => {
    const c = r.pick(CTX),
      w = 10,
      start = r.pick([0, 10, 20]),
      bs = bins(start, w, 4);
    const cts = bs.map(() => r.int(1, 7));
    const total = S.sum(cts);
    const variant = r.pick(['max', 'median', 'count', 'bin']);
    const bi = r.int(0, 3);
    const claims = {
      max: {
        text: `From this histogram you can tell the exact largest value in the data set.`,
        answer: false,
        reason: `The histogram shows that the largest value is somewhere in ${bs[3].label}, but not which number it is.`,
      },
      median: {
        text: 'From this histogram you can find the exact median of the data.',
        answer: false,
        reason: 'A histogram groups values into intervals. You cannot see the individual values, so you cannot find the exact median.',
      },
      count: {
        text: `From this histogram you can tell that there are exactly ${total} values in the data set.`,
        answer: true,
        reason: `Adding all the bar heights gives ${cts.join(' + ')} = ${total}, the total number of values.`,
      },
      bin: {
        text: `From this histogram you can tell that exactly ${cts[bi]} values are between ${bs[bi].lo} and ${bs[bi].hi}.`,
        answer: true,
        reason: `The height of the ${bs[bi].label} bar is ${cts[bi]}, which is the count for that interval.`,
      },
    };
    const cl = claims[variant];
    const reasons = r.shuffle([
      { html: cl.reason, correct: true },
      { html: cl.answer ? 'Histograms always show every individual data value.' : 'The bars touch, so the data must be in order.' },
      { html: cl.answer ? 'The tallest bar tells you the exact values in the data.' : 'The intervals are too small to show any information.' },
    ]);
    return {
      type: 'tf',
      skill: 'histogram',
      lesson: '2-2',
      title: 'What can the histogram tell you?',
      prompt: `<p>The histogram shows ${c.what}.</p>${hist(bs, cts, c)}<p>True or false: <b>${cl.text}</b></p>`,
      answer: cl.answer,
      reasons,
      hints: [
        'A histogram shows how many values fall in each interval. It does not show the individual values.',
        'Ask: does answering this need individual values, or just the counts in the bars?',
        cl.answer ? 'Counts in bars are exactly what a histogram shows, so this can be read directly.' : 'This needs individual values, which the histogram hides inside its intervals.',
      ],
      solution: `<p><b>${cl.answer ? 'True' : 'False'}.</b> ${cl.reason}</p>`,
      feedback: {
        correct: 'Correct. Histograms show counts per interval, not individual values.',
        wrong(ans, d) {
          if (!d.valueOk)
            return cl.answer ? 'Bar heights are counts. Counts can be read exactly from the histogram.' : 'Can you see the individual data values in a histogram? No. Only counts per interval.';
          return 'Your true/false choice is right. Pick the reason that explains what a histogram shows: counts in intervals.';
        },
      },
    };
  });
})(typeof window !== 'undefined' ? window : globalThis);

/* js/units/u2/gen-median.js */
/* Zone 3 — The Middle Pier. Lesson 2-3 Describe the Data Using the Median (Finding the Median · Median of an Even Set). */
(function (root) {
  'use strict';
  const RX = root.RX;
  const { G, V, shuffleOptions, NAMES, fmt } = RX;
  const S = RX.STATS;
  const hl = V.hl;

  const CTX = [
    { what: 'tide heights in centimeters', unit: 'cm', lo: 20, hi: 60 },
    { what: 'number of boats docked each morning', unit: 'boats', lo: 4, hi: 20 },
    { what: 'water temperatures in degrees Fahrenheit', unit: '°F', lo: 55, hi: 80 },
    { what: 'minutes between waves', unit: 'minutes', lo: 2, hi: 15 },
    { what: 'crabs counted in each trap', unit: 'crabs', lo: 3, hi: 25 },
    { what: 'lengths of driftwood in inches', unit: 'inches', lo: 10, hi: 48 },
  ];
  const sortedWords = (s) => `${S.list(s)}`;

  // ---------- Median of an odd set (num) ----------
  G.define('s3_medianOdd', (r) => {
    const c = r.pick(CTX),
      n = r.pick([5, 7, 9]);
    const vals = S.data(r, n, c.lo, c.hi, true);
    const s = S.sorted(vals),
      med = S.median(vals);
    return {
      type: 'num',
      skill: 'median',
      lesson: '2-3',
      title: 'Find the median',
      prompt: `<p>A surveyor recorded ${c.what} on ${n} days: ${hl(S.list(vals))}.</p><p>What is the <b>median</b>?</p>`,
      unit: c.unit,
      answer: med,
      hints: [
        'First write the values in order from least to greatest. The median is the middle value of the ordered list.',
        `Ordered: ${sortedWords(s)}. There are ${n} values, so the middle is the ${(n + 1) / 2}th value.`,
        `Count in ${(n - 1) / 2} from each end. The value left in the middle is the median.`,
      ],
      solution: `<p>Order the data: ${sortedWords(s)}. With ${n} values, the middle value is the ${(n + 1) / 2}th one: <b>${med}</b>. Half the days were at or below ${med} and half were at or above it.</p>`,
      feedback: {
        correct: `Correct. After ordering, the middle of ${n} values is the ${(n + 1) / 2}th value, ${med}.`,
        wrong(ans, d) {
          if (d.value === vals[(n - 1) / 2]) return 'That is the middle of the list as written. The median is the middle of the list after it is ordered.';
          if (d.value != null && Math.abs(d.value - S.mean(vals)) < 0.01) return 'That is the mean (average). The median is the middle value after ordering.';
          return `Order the ${n} values from least to greatest, then find the one in the exact middle.`;
        },
      },
    };
  });

  // ---------- Error: forgot to order first (error) ----------
  G.define('s3_orderError', (r) => {
    const name = r.pick(NAMES),
      c = r.pick(CTX),
      n = r.pick([5, 7]);
    let vals, s;
    for (let t = 0; t < 50; t++) {
      vals = S.data(r, n, c.lo, c.hi, true);
      s = S.sorted(vals);
      if (vals[(n - 1) / 2] !== S.median(vals)) break;
    }
    const wrongMid = vals[(n - 1) / 2],
      med = S.median(vals);
    const opts = [
      { html: `${name} did not order the data first. The middle of the unordered list is not the median.`, ok: true },
      { html: `${name} should have added the values and divided by ${n}.`, why: 'That gives the mean, not the median. The median is the middle value of the ordered data.' },
      { html: `${name} should have chosen the largest value.`, why: 'The largest value is the maximum. The median is the middle value after ordering.' },
      { html: 'There is no mistake. The middle number of the list is always the median.', why: 'The middle of the list is only the median if the list is in order. This list is not in order.' },
    ];
    const sh = shuffleOptions(r, opts, 0);
    return {
      type: 'error',
      skill: 'median',
      lesson: '2-3',
      title: 'Find the mistake',
      prompt: `<p>${name} is finding the median of ${c.what}: ${hl(S.list(vals))}.</p><p>What mistake did ${name} make?</p>`,
      work: `"There are ${n} numbers. The middle one is <b>${wrongMid}</b>, so the median is ${wrongMid}."`,
      options: sh.options,
      answer: sh.answer,
      fix: { label: 'What is the correct median?', answer: med },
      hints: ['Is the list in order from least to greatest? Check before you look for the middle.', `Ordered: ${sortedWords(s)}.`, `Now the middle value (the ${(n + 1) / 2}th) is the median.`],
      solution: `<p>${name} picked the middle of the list as written, but the data was not in order. Ordered: ${sortedWords(s)}. The middle value is <b>${med}</b>. Ordering first is what makes the middle position mean "half below, half above."</p>`,
      feedback: {
        correct: 'Correct. Always order the data before finding the middle.',
        wrong(ans, d) {
          if (!d.mistakeOk) return `Look at the list: ${S.list(vals)}. Is it in order? What does that do to the "middle" value?`;
          return `You found the mistake. Now order the values (${sortedWords(s)}) and take the one in the middle.`;
        },
      },
    };
  });

  // ---------- Median from a dot plot (num) ----------
  G.define('s3_medianDot', (r) => {
    const c = r.pick([
      { label: 'Fish caught per trip', unit: 'fish', lo: 2, hi: 10 },
      { label: 'Shells per bucket', unit: 'shells', lo: 3, hi: 12 },
      { label: 'Gulls on the pier each hour', unit: 'gulls', lo: 0, hi: 9 },
    ]);
    const n = r.pick([7, 9, 11]);
    const vals = S.shaped(r, r.pick(['symmetric', 'skewed right', 'skewed left']), c.lo, c.hi, n);
    const s = S.sorted(vals),
      med = S.median(vals);
    return {
      type: 'num',
      skill: 'median',
      lesson: '2-3',
      title: 'Median from a dot plot',
      prompt: `<p>The dot plot shows ${c.label.toLowerCase()} for ${n} trips. Each dot is one data value.</p>${V.dotPlot({ values: vals, min: c.lo, max: c.hi, label: c.label, aria: 'Dot plot: ' + S.list(s) })}<p>What is the median?</p>`,
      unit: c.unit,
      answer: med,
      hints: [
        'A dot plot is already in order: smallest values on the left, largest on the right. Each dot is one value.',
        `There are ${n} dots. Count ${(n - 1) / 2} dots in from the left and ${(n - 1) / 2} in from the right.`,
        `The dot left in the middle (the ${(n + 1) / 2}th) sits above the median.`,
      ],
      solution: `<p>Reading the dots left to right gives the ordered data: ${S.list(s)}. The middle (${(n + 1) / 2}th) value is <b>${med}</b>.</p>`,
      feedback: {
        correct: 'Correct. A dot plot orders the data for you; count dots from both ends to the middle.',
        wrong(ans, d) {
          const keys = Object.keys(S.counts(vals)).map(Number);
          const midKey = keys.sort((a, b) => a - b)[Math.floor(keys.length / 2)];
          if (d.value === midKey && midKey !== med) return 'You found the middle number on the number line. The median is the middle dot: count dots, not tick marks.';
          const cnt = S.counts(vals);
          const mode = keys.find((k) => cnt[k] === Math.max(...keys.map((x) => cnt[x])));
          if (d.value === mode && mode !== med) return 'That is the value with the most dots (the peak). The median is the middle dot when you count from both ends.';
          return `Count the dots: ${n} in all. The median is the ${(n + 1) / 2}th dot from the left.`;
        },
      },
    };
  });

  // ---------- Who found the median correctly (who) ----------
  G.define('s3_whoMedian', (r) => {
    const [a, b] = r.pickN(NAMES, 2),
      c = r.pick(CTX),
      n = r.pick([5, 7]);
    let vals, s, med;
    for (let t = 0; t < 50; t++) {
      vals = S.data(r, n, c.lo, c.hi, true);
      s = S.sorted(vals);
      med = S.median(vals);
      if (vals[(n - 1) / 2] !== med && !Number.isInteger(S.mean(vals))) break;
    }
    const wrongKind = r.pick(['unordered', 'mean']);
    const wrongVal = wrongKind === 'unordered' ? vals[(n - 1) / 2] : RX.round(S.mean(vals), 1);
    const opts = [
      { html: `<b>${a}</b>: "I ordered the data: ${S.list(s)}. The middle value is ${med}, so the median is ${med}."`, ok: true },
      wrongKind === 'unordered'
        ? {
            html: `<b>${b}</b>: "The middle number in the list is ${wrongVal}, so the median is ${wrongVal}."`,
            why: `${b} skipped a step. The data must be in order before the middle value is the median.`,
          }
        : {
            html: `<b>${b}</b>: "I added them all and divided by ${n}. The median is about ${wrongVal}."`,
            why: `${b} found the mean, not the median. The median is the middle value of the ordered list.`,
          },
    ];
    const sh = shuffleOptions(r, opts, 0);
    return {
      type: 'who',
      skill: 'median',
      lesson: '2-3',
      title: 'Who is correct?',
      prompt: `<p>Two surveyors find the median of ${c.what}: ${hl(S.list(vals))}.</p><p>Who is correct?</p>`,
      options: sh.options,
      answer: sh.answer,
      hints: ['The median is the middle value of the data after it is put in order.', `Ordered: ${S.list(s)}.`, `The middle (${(n + 1) / 2}th) value is ${med}. Which student found that?`],
      solution: `<p><b>${a}</b> is correct. Ordered data: ${S.list(s)}. The middle value is <b>${med}</b>. ${wrongKind === 'unordered' ? `${b} used the unordered list, so the "middle" number was not the median.` : `${b} computed the mean (sum ÷ count) instead of the median.`}</p>`,
      feedback: { correct: 'Correct. Order first, then take the middle value.' },
    };
  });

  // ---------- Median of an even set (num) ----------
  G.define('s3_medianEven', (r, o) => {
    const c = r.pick(CTX),
      hard = !!o.hard,
      n = hard ? r.pick([8, 10, 12]) : r.pick([6, 8]);
    let vals, s;
    for (let t = 0; t < 50; t++) {
      vals = S.data(r, n, c.lo, c.hi, true);
      s = S.sorted(vals);
      const a = s[n / 2 - 1],
        b = s[n / 2];
      if (hard ? (a + b) % 2 === 1 : true) break;
    }
    const a = s[n / 2 - 1],
      b = s[n / 2],
      med = (a + b) / 2;
    return {
      type: 'num',
      skill: 'median',
      lesson: '2-3',
      title: hard ? 'Median of an even set (harder)' : 'Median of an even set',
      prompt: `<p>Here are ${c.what} from ${n} readings: ${hl(S.list(vals))}.</p><p>What is the median?${Number.isInteger(med) ? '' : ' Your answer may be a decimal.'}</p>`,
      unit: c.unit,
      answer: med,
      tolerance: 0.01,
      hints: [
        'Order the data first. With an even number of values, there are two middle values.',
        `Ordered: ${S.list(s)}. The two middle values are ${a} and ${b}.`,
        `The median is halfway between them: (${a} + ${b}) ÷ 2.`,
      ],
      solution: `<p>Ordered: ${S.list(s)}. There are ${n} values, so the two middle values are the ${n / 2}th and ${n / 2 + 1}th: ${a} and ${b}. The median is halfway between: (${a} + ${b}) ÷ 2 = <b>${fmt(med)}</b>.</p>`,
      feedback: {
        correct: `Correct. With an even count, the median is the average of the two middle values: ${fmt(med)}.`,
        wrong(ans, d) {
          if (d.value === a || d.value === b) return `${d.value} is one of the two middle values. With an even number of values, the median is halfway between both middle values.`;
          if (d.value === a + b) return `${a + b} is the sum of the middle two. Divide by 2 to find the number halfway between them.`;
          if (d.value === vals[n / 2 - 1] || d.value === vals[n / 2]) return 'Order the data first. Then find the two values in the middle.';
          return `Order the ${n} values. Find the two in the middle, add them, and divide by 2.`;
        },
      },
    };
  });

  // ---------- Two sets in a table (table) ----------
  G.define('s3_tableMedian', (r) => {
    const c = r.pick(CTX),
      [g1, g2] = r.pickN(['North Beach', 'South Beach', 'East Cove', 'West Point', 'Pier Side', 'Marsh Edge'], 2);
    const n1 = r.pick([5, 7]),
      n2 = r.pick([6, 8]);
    let d1, d2;
    for (let t = 0; t < 50; t++) {
      d1 = S.data(r, n1, c.lo, c.hi, true);
      d2 = S.data(r, n2, c.lo, c.hi, true);
      if (Number.isInteger(S.median(d2))) break;
    }
    const m1 = S.median(d1),
      m2 = S.median(d2);
    const s2 = S.sorted(d2);
    return {
      type: 'table',
      skill: 'median',
      lesson: '2-3',
      title: 'Median for each site',
      prompt: `<p>The table shows ${c.what} recorded at two survey sites. Find the median for each site.</p>`,
      rows: [
        ['Site', 'Data', 'Median'],
        [g1, S.list(d1), '__IN:m1__'],
        [g2, S.list(d2), '__IN:m2__'],
      ],
      header: true,
      inputs: [
        { id: 'm1', answer: m1 },
        { id: 'm2', answer: m2 },
      ],
      hints: [
        "Order each site's data separately. Then find the middle.",
        `${g1} has ${n1} values (odd): one middle value. ${g2} has ${n2} values (even): two middle values, so average them.`,
        `${g1} ordered: ${S.list(S.sorted(d1))}. ${g2} ordered: ${S.list(s2)}; the middle two are ${s2[n2 / 2 - 1]} and ${s2[n2 / 2]}.`,
      ],
      solution: `<p>${g1}: ordered ${S.list(S.sorted(d1))}, middle value <b>${m1}</b>. ${g2}: ordered ${S.list(s2)}, middle values ${s2[n2 / 2 - 1]} and ${s2[n2 / 2]}, so the median is (${s2[n2 / 2 - 1]} + ${s2[n2 / 2]}) ÷ 2 = <b>${m2}</b>.</p>`,
      feedback: {
        correct: 'Correct. Odd count: the single middle value. Even count: halfway between the two middle values.',
        wrong(ans, d) {
          if (d.wrong.includes('m2')) return `${g2} has an even number of values. Order them, find the two in the middle, and average them.`;
          return `For ${g1}, order the ${n1} values and take the ${(n1 + 1) / 2}th one.`;
        },
      },
    };
  });

  // ---------- Even median, step by step (blanks template) ----------
  G.define('s3_evenBlanks', (r) => {
    const c = r.pick(CTX),
      n = r.pick([6, 8, 10]);
    const vals = S.data(r, n, c.lo, c.hi, true),
      s = S.sorted(vals);
    const a = s[n / 2 - 1],
      b = s[n / 2],
      med = (a + b) / 2;
    return {
      type: 'blanks',
      skill: 'median',
      lesson: '2-3',
      title: 'Show the steps',
      prompt: `<p>Data (${c.what}): ${hl(S.list(vals))}.</p><p>Complete the steps to find the median.</p>`,
      fields: [
        { label: 'smaller middle value', answer: a, width: 'sm' },
        { label: 'larger middle value', answer: b, width: 'sm' },
        { label: 'median', answer: med, width: 'sm', tolerance: 0.01 },
      ],
      template: ['After ordering, the two middle values are {0} and {1}.', 'The median is halfway between them: {2}.'],
      hints: [
        'Order the data from least to greatest. Since there are ' + n + ' values, the two middle values are the ' + n / 2 + 'th and ' + (n / 2 + 1) + 'th.',
        `Ordered: ${S.list(s)}.`,
        `Middle values: ${a} and ${b}. Median = (${a} + ${b}) ÷ 2.`,
      ],
      solution: `<p>Ordered: ${S.list(s)}. The two middle values are <b>${a}</b> and <b>${b}</b>. The median is (${a} + ${b}) ÷ 2 = <b>${fmt(med)}</b>.</p>`,
      feedback: {
        correct: `Correct. The median ${fmt(med)} is exactly halfway between ${a} and ${b}.`,
        wrong(ans, d) {
          if (d.wrong.includes(0) || d.wrong.includes(1)) return `Order the data first: ${S.list(s)}. The middle two are the ${n / 2}th and ${n / 2 + 1}th values.`;
          return `Your middle values are right. The median is their average: (${a} + ${b}) ÷ 2.`;
        },
      },
    };
  });

  // ---------- Meaning of the median (MC) ----------
  G.define('s3_medianMeaning', (r) => {
    const c = r.pick(CTX),
      n = r.pick([7, 9, 11]),
      name = r.pick(NAMES);
    const vals = S.data(r, n, c.lo, c.hi, true),
      med = S.median(vals);
    const opts = [
      { html: `About half of the readings were ${med} ${c.unit} or less, and about half were ${med} ${c.unit} or more.`, ok: true },
      { html: `Most of the readings were exactly ${med} ${c.unit}.`, why: 'The median is a position in the ordered data, not the most common value. The most common value is the mode.' },
      { html: `The readings add up to ${med} ${c.unit} when divided by ${n}.`, why: 'That describes the mean (sum ÷ count), not the median.' },
      { html: `The highest reading was ${med} ${c.unit}.`, why: 'The highest reading is the maximum. The median is the middle value.' },
    ];
    const sh = shuffleOptions(r, opts, 0);
    return {
      type: 'mc',
      skill: 'median',
      lesson: '2-3',
      title: 'What does the median tell you?',
      prompt: `<p>${name} found that the median of ${n} readings of ${c.what} is ${hl(med + ' ' + c.unit)}.</p><p>What does this median tell you about the data?</p>`,
      options: sh.options,
      answer: sh.answer,
      hints: [
        'The median is the middle value of the ordered data. Think about what sits on each side of the middle.',
        'Half the values come before the middle and half come after it.',
        `So about half the readings are at or below ${med}, and about half are at or above ${med}.`,
      ],
      solution: `<p>The median splits the ordered data in half. <b>About half the readings are ${med} ${c.unit} or less, and about half are ${med} ${c.unit} or more.</b> It does not say the most common value, the total, or the largest value.</p>`,
      feedback: { correct: 'Correct. The median is the halfway point of the ordered data.' },
    };
  });
})(typeof window !== 'undefined' ? window : globalThis);

/* js/units/u2/gen-boxplot.js */
/* Zone 4 — Boxcar Harbor. Lesson 2-4 Represent and Describe Data in a Box Plot (Building a Box Plot · Comparing Box Plots).
   Quartile convention (Reveal / district): Q1 and Q3 are the medians of the lower and upper halves; when n is odd the
   median itself is left out of both halves. RX.STATS.halves implements this. */
(function (root) {
  'use strict';
  const RX = root.RX;
  const { G, V, shuffleOptions, NAMES } = RX;
  const S = RX.STATS;
  const hl = V.hl;

  const CTX = [
    { what: 'boat lengths in feet', unit: 'ft', lo: 10, hi: 40 },
    { what: 'number of passengers per ferry trip', unit: 'passengers', lo: 5, hi: 45 },
    { what: 'minutes each boat waited at the dock', unit: 'minutes', lo: 2, hi: 30 },
    { what: 'crates unloaded per boat', unit: 'crates', lo: 4, hi: 36 },
    { what: 'ages of the harbor volunteers', unit: 'years', lo: 12, hi: 40 },
  ];
  const lineFor = (f) => {
    const step = f.max - f.min > 30 ? 5 : f.max - f.min > 12 ? 2 : 1;
    const lineMin = Math.floor((f.min - 2) / step) * step,
      lineMax = Math.ceil((f.max + 2) / step) * step;
    return { lineMin: Math.max(0, lineMin), lineMax, step, labelEvery: step * (lineMax - lineMin > 40 ? 2 : 1) };
  };
  const box = (f, label, extra) => {
    const L = lineFor(f);
    return V.boxPlot(
      Object.assign(
        {
          plots: [Object.assign({ label }, f)],
          lineMin: L.lineMin,
          lineMax: L.lineMax,
          step: L.step,
          labelEvery: L.labelEvery,
          width: 460,
          aria: `Box plot: minimum ${f.min}, Q1 ${f.q1}, median ${f.med}, Q3 ${f.q3}, maximum ${f.max}`,
        },
        extra || {},
      ),
    );
  };
  const twoBox = (f1, f2, l1, l2) => {
    const allMin = Math.min(f1.min, f2.min),
      allMax = Math.max(f1.max, f2.max);
    const L = lineFor({ min: allMin, max: allMax });
    return V.boxPlot({
      plots: [Object.assign({ label: l1 }, f1), Object.assign({ label: l2 }, f2)],
      lineMin: L.lineMin,
      lineMax: L.lineMax,
      step: L.step,
      labelEvery: L.labelEvery,
      width: 480,
      aria: `${l1}: min ${f1.min}, Q1 ${f1.q1}, median ${f1.med}, Q3 ${f1.q3}, max ${f1.max}. ${l2}: min ${f2.min}, Q1 ${f2.q1}, median ${f2.med}, Q3 ${f2.q3}, max ${f2.max}.`,
    });
  };
  const halvesText = (vals) => {
    const h = S.halves(vals),
      n = vals.length;
    return `Lower half: ${S.list(h.lower)} → Q1 = ${S.median(h.lower)}. Upper half: ${S.list(h.upper)} → Q3 = ${S.median(h.upper)}.${n % 2 ? ` (The median ${S.median(vals)} is left out of both halves because there is an odd number of values.)` : ''}`;
  };

  // ---------- Five-number summary (blanks) ----------
  G.define('s4_fiveNum', (r, o) => {
    const c = r.pick(CTX),
      hard = !!o.hard,
      n = hard ? r.pick([9, 11, 12]) : r.pick([7, 8]);
    const vals = S.cleanFive(r, n, c.lo, c.hi, true),
      s = S.sorted(vals),
      f = S.fiveNum(vals);
    return {
      type: 'blanks',
      skill: 'box-plot',
      lesson: '2-4',
      title: hard ? 'Five-number summary (harder)' : 'Five-number summary',
      prompt: `<p>Data (${c.what}): ${hl(S.list(hard ? vals : s))}.</p><p>Find the five-number summary.</p>`,
      fields: [
        { label: 'Minimum', answer: f.min, width: 'sm' },
        { label: 'Q1', answer: f.q1, width: 'sm' },
        { label: 'Median', answer: f.med, width: 'sm' },
        { label: 'Q3', answer: f.q3, width: 'sm' },
        { label: 'Maximum', answer: f.max, width: 'sm' },
      ],
      hints: [
        `${hard ? 'Order the data first. ' : ''}The minimum and maximum are the smallest and largest values. The median is the middle.`,
        `Ordered: ${S.list(s)}. Median = ${f.med}. Now split the data into a lower half and an upper half${n % 2 ? ', leaving the median out' : ''}.`,
        halvesText(vals),
      ],
      solution: `<p>Ordered: ${S.list(s)}.</p><p>Minimum <b>${f.min}</b>, maximum <b>${f.max}</b>, median <b>${f.med}</b>. ${halvesText(vals)} So Q1 = <b>${f.q1}</b> and Q3 = <b>${f.q3}</b>.</p><p>As a box plot:</p>${box(f, '')}`,
      feedback: {
        correct: 'Correct. Min, Q1, median, Q3, max: the five numbers that build a box plot.',
        wrong(ans, d) {
          if (d.wrong.includes(2)) return `Start with the median. Ordered: ${S.list(s)}. The middle value is ${f.med}.`;
          if (d.wrong.includes(1) || d.wrong.includes(3))
            return `Q1 is the median of the lower half and Q3 is the median of the upper half. ${n % 2 ? 'Leave the median out of both halves because there is an odd number of values.' : 'Split the ordered data into two equal halves.'}`;
          return 'Check the minimum and maximum: the smallest and largest values in the list.';
        },
      },
    };
  });

  // ---------- Read a value from a box plot (num) ----------
  G.define('s4_readBox', (r) => {
    const c = r.pick(CTX);
    const vals = S.cleanFive(r, r.pick([7, 8, 9]), c.lo, c.hi, true),
      f = S.fiveNum(vals);
    const part = r.pick(['med', 'q1', 'q3', 'min', 'max']);
    const names = { med: 'median', q1: 'first quartile (Q1)', q3: 'third quartile (Q3)', min: 'minimum', max: 'maximum' };
    const where = { med: 'the line inside the box', q1: 'the left edge of the box', q3: 'the right edge of the box', min: 'the end of the left whisker', max: 'the end of the right whisker' };
    return {
      type: 'num',
      skill: 'box-plot',
      lesson: '2-4',
      title: 'Read the box plot',
      prompt: `<p>The box plot shows ${c.what}.</p>${box(f, '')}<p>What is the ${hl(names[part])}?</p>`,
      unit: c.unit,
      answer: f[part],
      hints: [
        'A box plot shows five numbers: minimum, Q1, median, Q3, maximum, from left to right.',
        `The ${names[part]} is ${where[part]}.`,
        `Read straight down from ${where[part]} to the number line.`,
      ],
      solution: `<p>The ${names[part]} is ${where[part]}. Reading down to the number line gives <b>${f[part]}</b>.</p>`,
      feedback: {
        correct: `Correct. The ${names[part]} is ${where[part]}.`,
        wrong(ans, d) {
          const hit = Object.keys(f).find((k) => f[k] === d.value && k !== part);
          if (hit) return `${d.value} is the ${names[hit]}. The ${names[part]} is ${where[part]}.`;
          return `Find ${where[part]} and read the value directly below it on the number line.`;
        },
      },
    };
  });

  // ---------- Quartile error: median counted in both halves (error) ----------
  G.define('s4_quartileError', (r) => {
    const name = r.pick(NAMES),
      c = r.pick(CTX),
      n = r.pick([7, 9]);
    let vals, s, f, wrongQ1;
    for (let t = 0; t < 80; t++) {
      vals = S.cleanFive(r, n, c.lo, c.hi, true);
      s = S.sorted(vals);
      f = S.fiveNum(vals);
      wrongQ1 = S.median(s.slice(0, (n + 1) / 2)); // lower half WITH the median included
      if (wrongQ1 !== f.q1) break;
    }
    const opts = [
      { html: `${name} included the median in the lower half. With an odd number of values, the median is left out of both halves.`, ok: true },
      { html: `${name} should have used the smallest value as Q1.`, why: 'The smallest value is the minimum. Q1 is the median of the lower half.' },
      { html: `${name} ordered the data wrong.`, why: `The data is in order: ${S.list(s)}. The mistake is in how the halves were made.` },
      { html: 'There is no mistake.', why: `The lower half should not contain the median ${f.med}. Including it shifts Q1.` },
    ];
    const sh = shuffleOptions(r, opts, 0);
    return {
      type: 'error',
      skill: 'box-plot',
      lesson: '2-4',
      title: 'Find the mistake',
      prompt: `<p>${name} is finding Q1 for ${c.what}: ${hl(S.list(s))} (already ordered, ${n} values, median ${f.med}).</p><p>What mistake did ${name} make?</p>`,
      work: `"Lower half: ${S.list(s.slice(0, (n + 1) / 2))}. The middle of that is <b>${wrongQ1}</b>, so Q1 = ${wrongQ1}."`,
      options: sh.options,
      answer: sh.answer,
      fix: { label: 'What is the correct Q1?', answer: f.q1 },
      hints: [
        `There are ${n} values, an odd number. The median ${f.med} is the ${(n + 1) / 2}th value.`,
        'When the count is odd, the median is not part of the lower half or the upper half.',
        `Lower half without the median: ${S.list(S.halves(vals).lower)}. Its middle is Q1.`,
      ],
      solution: `<p>${name}'s lower half included the median ${f.med}. With an odd number of values, the median is <b>excluded</b> from both halves. Lower half: ${S.list(S.halves(vals).lower)}, so Q1 = <b>${f.q1}</b>.</p>`,
      feedback: {
        correct: 'Correct. Odd count: leave the median out, then find the middle of each half.',
        wrong(ans, d) {
          if (!d.mistakeOk) return `Look at ${name}'s lower half. Does it contain the median ${f.med}? Should it?`;
          return `You found the mistake. Now use the lower half ${S.list(S.halves(vals).lower)} and take its middle value.`;
        },
      },
    };
  });

  // ---------- Match data to box plot (rep) ----------
  G.define('s4_matchBox', (r) => {
    const c = r.pick(CTX);
    const vals = S.cleanFive(r, r.pick([7, 8]), c.lo, c.hi, true),
      s = S.sorted(vals),
      f = S.fiveNum(vals);
    const bad1 = Object.assign({}, f, { med: f.q1, q1: Math.max(f.min, f.q1 - 2) }); // median at Q1 position
    const bad2 = Object.assign({}, f, { max: f.max + r.int(3, 6), q3: f.q3 + 1 }); // wrong max
    const bad3 = Object.assign({}, f, { med: f.q3, q3: Math.min(f.max, f.q3 + 2) });
    const L = lineFor({ min: f.min, max: f.max + 6 });
    const mk = (g) =>
      V.boxPlot({
        plots: [g],
        lineMin: L.lineMin,
        lineMax: L.lineMax,
        step: L.step,
        labelEvery: L.labelEvery,
        width: 300,
        aria: `Box plot: min ${g.min}, Q1 ${g.q1}, median ${g.med}, Q3 ${g.q3}, max ${g.max}`,
      });
    const opts = [
      { html: mk(f), ok: true },
      { html: mk(bad1), why: `The median line is in the wrong place. The median of the data is ${f.med}.` },
      { html: mk(bad2), why: `The right whisker reaches past ${f.max}, but the largest value in the data is ${f.max}.` },
      { html: mk(bad3), why: `The median line sits at ${f.q3}, but the middle of the ordered data is ${f.med}.` },
    ];
    const sh = shuffleOptions(r, opts, 0);
    return {
      type: 'rep',
      skill: 'box-plot',
      lesson: '2-4',
      title: 'Match the data to its box plot',
      prompt: `<p>Data (${c.what}): ${hl(S.list(s))}.</p><p>Which box plot shows this data?</p>`,
      options: sh.options,
      answer: sh.answer,
      layout: 'cards',
      hints: [
        'Find the five-number summary first: minimum, Q1, median, Q3, maximum.',
        `Minimum ${f.min} and maximum ${f.max} are the ends of the whiskers. Median ${f.med} is the line inside the box.`,
        `Q1 = ${f.q1} and Q3 = ${f.q3} are the edges of the box. Only one plot matches all five.`,
      ],
      solution: `<p>Five-number summary: min ${f.min}, Q1 ${f.q1}, median ${f.med}, Q3 ${f.q3}, max ${f.max}. The correct box plot has whiskers from ${f.min} to ${f.max}, a box from ${f.q1} to ${f.q3}, and a median line at ${f.med}.</p>`,
      feedback: { correct: 'Correct. All five numbers must match: whisker ends, box edges, and the median line.' },
    };
  });

  // ---------- Percent of data in a part of the box plot (MC) ----------
  G.define('s4_percentBox', (r) => {
    const c = r.pick(CTX);
    const vals = S.cleanFive(r, 8, c.lo, c.hi, true),
      f = S.fiveNum(vals);
    const part = r.pick(['box', 'aboveQ3', 'belowQ1', 'aboveMed', 'belowQ3']);
    const Q = {
      box: { text: `inside the box, between ${f.q1} and ${f.q3}`, pct: 50 },
      aboveQ3: { text: `greater than ${f.q3} (the right whisker)`, pct: 25 },
      belowQ1: { text: `less than ${f.q1} (the left whisker)`, pct: 25 },
      aboveMed: { text: `greater than the median, ${f.med}`, pct: 50 },
      belowQ3: { text: `less than ${f.q3}`, pct: 75 },
    }[part];
    const opts = [25, 50, 75, 100].map((p) =>
      p === Q.pct
        ? { html: `About ${p}%`, ok: true }
        : {
            html: `About ${p}%`,
            why:
              p === 100
                ? 'All of the data is 100%. Each quarter of a box plot (whisker, half-box) holds about 25% of the data.'
                : `Each section of a box plot (each whisker and each half of the box) holds about 25% of the data. Count how many sections the question covers.`,
          },
    );
    const sh = shuffleOptions(
      r,
      opts,
      opts.findIndex((x) => x.ok),
    );
    return {
      type: 'mc',
      skill: 'box-plot',
      lesson: '2-4',
      title: 'How much of the data?',
      prompt: `<p>The box plot shows ${c.what}.</p>${box(f, '')}<p>About what percent of the data values are ${hl(Q.text)}?</p>`,
      options: sh.options,
      answer: sh.answer,
      hints: [
        'The quartiles split the data into four equal parts. Each part holds about one quarter, or 25%, of the data.',
        'Count how many of the four parts the question covers: left whisker, left half of the box, right half of the box, right whisker.',
        `That region covers ${Q.pct / 25} of the 4 parts: ${Q.pct / 25} × 25%.`,
      ],
      solution: `<p>Each whisker and each half of the box holds about 25% of the data. The region ${Q.text} covers ${Q.pct / 25} of the four parts, so about <b>${Q.pct}%</b> of the data.</p>`,
      feedback: { correct: 'Correct. The box holds the middle half; each whisker holds about a quarter.' },
    };
  });

  // ---------- Compare medians of two box plots (num) ----------
  G.define('s4_compareMedian', (r) => {
    const c = r.pick(CTX),
      [l1, l2] = r.pickN(['Fleet A', 'Fleet B', 'Dock 1', 'Dock 2', 'Morning', 'Evening'], 2);
    let f1, f2;
    for (let t = 0; t < 60; t++) {
      f1 = S.fiveNum(S.cleanFive(r, 8, c.lo, c.hi, true));
      f2 = S.fiveNum(S.cleanFive(r, 8, c.lo, c.hi, true));
      if (f1.med !== f2.med) break;
    }
    const hi = f1.med > f2.med ? l1 : l2,
      lo = hi === l1 ? l2 : l1,
      diff = Math.abs(f1.med - f2.med);
    return {
      type: 'num',
      skill: 'box-plot',
      lesson: '2-4',
      title: 'Compare the medians',
      prompt: `<p>The box plots show ${c.what} for two groups.</p>${twoBox(f1, f2, l1, l2)}<p>${hi} has the greater median. <b>How much greater</b> is it than ${lo}'s median?</p>`,
      unit: c.unit,
      answer: diff,
      hints: ['The median is the line inside each box.', `${l1}'s median is ${f1.med}. ${l2}'s median is ${f2.med}.`, `Subtract: ${Math.max(f1.med, f2.med)} − ${Math.min(f1.med, f2.med)}.`],
      solution: `<p>${l1}: median ${f1.med}. ${l2}: median ${f2.med}. ${hi}'s median is greater by ${Math.max(f1.med, f2.med)} − ${Math.min(f1.med, f2.med)} = <b>${diff}</b> ${c.unit}.</p>`,
      feedback: {
        correct: `Correct. Comparing the median lines: ${hi} is ${diff} ${c.unit} higher.`,
        wrong(ans, d) {
          if (d.value === Math.abs(f1.max - f2.max)) return 'You compared the maximums (whisker ends). The median is the line inside each box.';
          if (d.value === f1.med || d.value === f2.med) return 'That is one median. The question asks for the difference between the two medians.';
          return 'Read the median line in each box, then subtract the smaller from the larger.';
        },
      },
    };
  });

  // ---------- Longer box ≠ more data (TF) ----------
  G.define('s4_lengthTF', (r) => {
    const c = r.pick(CTX),
      [l1, l2] = r.pickN(['Fleet A', 'Fleet B', 'Dock 1', 'Dock 2', 'Team Red', 'Team Blue'], 2);
    let f1, f2;
    for (let t = 0; t < 60; t++) {
      f1 = S.fiveNum(S.cleanFive(r, 8, c.lo, c.hi, true));
      f2 = S.fiveNum(S.cleanFive(r, 8, c.lo, c.hi, true));
      if (Math.abs(f1.q3 - f1.q1 - (f2.q3 - f2.q1)) >= 3) break;
    }
    const longer = f1.q3 - f1.q1 > f2.q3 - f2.q1 ? l1 : l2;
    const variant = r.pick(['moreData', 'spread']);
    const claim =
      variant === 'moreData' ? `${longer} has more data values than the other group because its box is longer.` : `The middle half of ${longer}'s data is more spread out than the other group's.`;
    const answer = variant !== 'moreData';
    const reasons = r.shuffle([
      variant === 'moreData'
        ? { html: 'The length of the box shows how spread out the middle half of the data is, not how many values there are.', correct: true }
        : { html: 'A longer box means the middle half of the data (from Q1 to Q3) covers a wider range of values.', correct: true },
      { html: 'A longer box always means more data values.' },
      { html: 'Box plots show the exact number of data values in each section.' },
    ]);
    return {
      type: 'tf',
      skill: 'box-plot',
      lesson: '2-4',
      title: 'What does a longer box mean?',
      prompt: `<p>The box plots show ${c.what} for two groups. Both groups have the same number of data values.</p>${twoBox(f1, f2, l1, l2)}<p>True or false: <b>${claim}</b></p>`,
      answer,
      reasons,
      hints: [
        'Each section of a box plot holds about a quarter of the data, no matter how long or short it is.',
        'So the length of a box shows spread (how far apart the values are), not count.',
        answer ? `${longer}'s box is longer, so its middle half is more spread out.` : 'A longer box does not mean more values. It means the middle half covers more of the number line.',
      ],
      solution: `<p><b>${answer ? 'True' : 'False'}.</b> The box runs from Q1 to Q3 and always holds about half the data. A longer box means that middle half is <b>more spread out</b>, not that there are more values. ${longer}'s box is longer, so its middle half is more spread out.</p>`,
      feedback: {
        correct: 'Correct. Box length shows spread, not how many values.',
        wrong(ans, d) {
          if (!d.valueOk) return 'Every box holds about half the data. Does a longer box change how many values it holds, or how far apart they are?';
          return 'Your true/false choice is right. Pick the reason about spread: the box covers Q1 to Q3.';
        },
      },
    };
  });

  // ---------- Table from two box plots (table) ----------
  G.define('s4_tableTwoBox', (r) => {
    const c = r.pick(CTX),
      [l1, l2] = r.pickN(['North Fleet', 'South Fleet', 'Dock A', 'Dock B', 'Week 1', 'Week 2'], 2);
    const f1 = S.fiveNum(S.cleanFive(r, 8, c.lo, c.hi, true)),
      f2 = S.fiveNum(S.cleanFive(r, 8, c.lo, c.hi, true));
    return {
      type: 'table',
      skill: 'box-plot',
      lesson: '2-4',
      title: 'Read two box plots',
      prompt: `<p>The box plots show ${c.what} for two groups. Complete the table.</p>${twoBox(f1, f2, l1, l2)}`,
      rows: [
        ['Group', 'Minimum', 'Median', 'Maximum'],
        [l1, '__IN:a1__', '__IN:a2__', '__IN:a3__'],
        [l2, '__IN:b1__', '__IN:b2__', '__IN:b3__'],
      ],
      header: true,
      inputs: [
        { id: 'a1', answer: f1.min },
        { id: 'a2', answer: f1.med },
        { id: 'a3', answer: f1.max },
        { id: 'b1', answer: f2.min },
        { id: 'b2', answer: f2.med },
        { id: 'b3', answer: f2.max },
      ],
      hints: [
        'The minimum is the left end of the whisker, the maximum is the right end, and the median is the line inside the box.',
        `${l1}: whiskers end at ${f1.min} and ${f1.max}.`,
        `${l2}: the median line is at ${f2.med}. Read each value straight down to the number line.`,
      ],
      solution: `<p>${l1}: minimum <b>${f1.min}</b>, median <b>${f1.med}</b>, maximum <b>${f1.max}</b>. ${l2}: minimum <b>${f2.min}</b>, median <b>${f2.med}</b>, maximum <b>${f2.max}</b>.</p>`,
      feedback: {
        correct: 'Correct. Whisker ends give the minimum and maximum; the inside line gives the median.',
        wrong(ans, d) {
          const k = d.wrong[0];
          const grp = k[0] === 'a' ? l1 : l2,
            col = { 1: 'minimum (left whisker end)', 2: 'median (line inside the box)', 3: 'maximum (right whisker end)' }[k[1]];
          return `Check the ${col} for ${grp}. Read straight down to the number line.`;
        },
      },
    };
  });
})(typeof window !== 'undefined' ? window : globalThis);

/* js/units/u2/gen-spread.js */
/* Zone 5 — Salt Marsh. Lesson 2-5 Describe Data by Range and Interquartile Range (Range and IQR · Comparing Variability).
   Quartile convention (Reveal / district): Q1 and Q3 are the medians of the lower and upper halves; when n is odd the
   median itself is left out of both halves (RX.STATS.halves). */
(function (root) {
  'use strict';
  const RX = root.RX;
  const { G, V, shuffleOptions, NAMES } = RX;
  const S = RX.STATS;
  const hl = V.hl;

  const CTX = [
    { what: 'heights of marsh grass in centimeters', unit: 'cm', lo: 20, hi: 70, label: 'Grass height (cm)' },
    { what: 'herons counted each morning', unit: 'herons', lo: 2, hi: 18, label: 'Herons counted' },
    { what: 'minutes the tide took to turn', unit: 'minutes', lo: 5, hi: 30, label: 'Minutes to turn' },
    { what: 'crab burrows counted in each square', unit: 'burrows', lo: 3, hi: 24, label: 'Burrows per square' },
    { what: 'millimeters of rain each week', unit: 'mm', lo: 0, hi: 40, label: 'Rain (mm)' },
  ];
  const SITES = ['North Marsh', 'South Marsh', 'Reed Bank', 'Mud Flat', 'Heron Creek', 'Cattail Cove', 'Egret Point', 'Tide Gate'];
  const lineFor = (min, max) => {
    const step = max - min > 30 ? 5 : max - min > 12 ? 2 : 1;
    const lineMin = Math.max(0, Math.floor((min - 2) / step) * step),
      lineMax = Math.ceil((max + 2) / step) * step;
    return { lineMin, lineMax, step, labelEvery: step * (lineMax - lineMin > 40 ? 2 : 1) };
  };
  const box = (plots, width) => {
    const allMin = Math.min(...plots.map((p) => p.min)),
      allMax = Math.max(...plots.map((p) => p.max));
    const L = lineFor(allMin, allMax);
    return V.boxPlot({
      plots,
      lineMin: L.lineMin,
      lineMax: L.lineMax,
      step: L.step,
      labelEvery: L.labelEvery,
      width: width || 460,
      aria: plots.map((p) => `${p.label || 'Box plot'}: min ${p.min}, Q1 ${p.q1}, median ${p.med}, Q3 ${p.q3}, max ${p.max}`).join('. '),
    });
  };
  const halvesText = (vals) => {
    const h = S.halves(vals),
      n = vals.length;
    return `Lower half: ${S.list(h.lower)} → Q1 = ${S.median(h.lower)}. Upper half: ${S.list(h.upper)} → Q3 = ${S.median(h.upper)}.${n % 2 ? ` The median ${S.median(vals)} is left out of both halves because there is an odd number of values.` : ''}`;
  };

  // ---------- Range of a data set (num) ----------
  G.define('s5_range', (r) => {
    const c = r.pick(CTX),
      n = r.pick([6, 7, 8, 9]);
    const vals = S.data(r, n, c.lo, c.hi, true),
      s = S.sorted(vals),
      mx = Math.max(...vals),
      mn = Math.min(...vals),
      rg = mx - mn;
    return {
      type: 'num',
      skill: 'range-iqr',
      lesson: '2-5',
      title: 'Find the range',
      prompt: `<p>A surveyor recorded ${c.what} on ${n} visits: ${hl(S.list(vals))}.</p><p>What is the <b>range</b> of the data?</p>`,
      unit: c.unit,
      answer: rg,
      hints: [
        'The range measures the full spread of the data: how far it is from the smallest value to the largest value.',
        `The largest value is ${mx}. The smallest value is ${mn}.`,
        `Range = maximum − minimum = ${mx} − ${mn}.`,
      ],
      solution: `<p>Ordered: ${S.list(s)}. The maximum is ${mx} and the minimum is ${mn}. Range = ${mx} − ${mn} = <b>${rg}</b> ${c.unit}. The range tells how wide the whole data set is, from end to end.</p>`,
      feedback: {
        correct: `Correct. The data stretches ${rg} ${c.unit} from the smallest value to the largest.`,
        wrong(ans, d) {
          if (d.value === mx) return `${mx} is the maximum. The range is the distance from the minimum to the maximum: subtract.`;
          if (d.value === rg + 1) return 'You counted the numbers from the minimum to the maximum. The range is a difference: subtract the minimum from the maximum.';
          if (n >= 6 && d.value === S.iqr(vals)) return 'That is the interquartile range (Q3 − Q1). The range uses the maximum and the minimum.';
          return `Find the largest value (${mx}) and the smallest value, then subtract.`;
        },
      },
    };
  });

  // ---------- Q1, Q3, IQR step by step (blanks) ----------
  G.define('s5_iqrBlanks', (r, o) => {
    const c = r.pick(CTX),
      hard = !!o.hard,
      n = hard ? r.pick([9, 10, 11]) : r.pick([7, 8]);
    const vals = S.cleanFive(r, n, c.lo, c.hi, true),
      s = S.sorted(vals),
      f = S.fiveNum(vals),
      iq = f.q3 - f.q1;
    return {
      type: 'blanks',
      skill: 'range-iqr',
      lesson: '2-5',
      title: hard ? 'Find the IQR (harder)' : 'Find the interquartile range',
      prompt: `<p>Data (${c.what}): ${hl(S.list(hard ? vals : s))}.${hard ? '' : ' The data is already in order.'}</p><p>Find the quartiles and the <b>interquartile range (IQR)</b>.</p>`,
      fields: [
        { label: 'Q1', answer: f.q1, width: 'sm' },
        { label: 'Q3', answer: f.q3, width: 'sm' },
        { label: 'IQR', answer: iq, width: 'sm' },
      ],
      template: ['The first quartile is Q1 = {0} and the third quartile is Q3 = {1}.', 'IQR = Q3 − Q1 = {2}.'],
      hints: [
        `${hard ? 'Order the data first. ' : ''}Q1 is the median of the lower half and Q3 is the median of the upper half. The IQR is Q3 − Q1.`,
        `Ordered: ${S.list(s)}. The median is ${f.med}.${n % 2 ? ' Since there are ' + n + ' values (odd), leave the median out of both halves.' : ' Split the ' + n + ' values into two halves of ' + n / 2 + '.'}`,
        halvesText(vals) + ' Now subtract Q1 from Q3.',
      ],
      solution: `<p>Ordered: ${S.list(s)}. ${halvesText(vals)} IQR = ${f.q3} − ${f.q1} = <b>${iq}</b> ${c.unit}. The IQR is the spread of the middle half of the data, so one unusually large or small value cannot stretch it.</p>`,
      feedback: {
        correct: `Correct. Q1 = ${f.q1}, Q3 = ${f.q3}, and the middle half spans ${iq} ${c.unit}.`,
        wrong(ans, d) {
          if (d.wrong.includes(0) || d.wrong.includes(1))
            return `Check the halves. ${n % 2 ? `With ${n} values, the median ${f.med} is left out, so each half has ${(n - 1) / 2} values.` : `Each half has ${n / 2} values.`} Q1 is the middle of the lower half; Q3 is the middle of the upper half.`;
          return `Your quartiles are right. IQR = Q3 − Q1 = ${f.q3} − ${f.q1}.`;
        },
      },
    };
  });

  // ---------- IQR or range from a box plot (num) ----------
  G.define('s5_iqrFromBox', (r) => {
    const c = r.pick(CTX),
      site = r.pick(SITES);
    const f = S.fiveNum(S.cleanFive(r, 8, c.lo, c.hi, true));
    const ask = r.pick(['iqr', 'iqr', 'range']);
    const iq = f.q3 - f.q1,
      rg = f.max - f.min;
    const answer = ask === 'iqr' ? iq : rg;
    return {
      type: 'num',
      skill: 'range-iqr',
      lesson: '2-5',
      title: ask === 'iqr' ? 'IQR from a box plot' : 'Range from a box plot',
      prompt: `<p>The box plot shows ${c.what} at ${site}.</p>${box([Object.assign({ label: site }, f)])}<p>What is the ${hl(ask === 'iqr' ? 'interquartile range (IQR)' : 'range')} of the data?</p>`,
      unit: c.unit,
      answer,
      hints: [
        ask === 'iqr' ? 'The IQR is the length of the box: Q3 − Q1. The box edges are the quartiles.' : 'The range is the full length of the plot, from the end of one whisker to the end of the other: maximum − minimum.',
        ask === 'iqr' ? `The left edge of the box is Q1 = ${f.q1}. The right edge is Q3 = ${f.q3}.` : `The left whisker ends at the minimum, ${f.min}. The right whisker ends at the maximum, ${f.max}.`,
        ask === 'iqr' ? `IQR = ${f.q3} − ${f.q1}.` : `Range = ${f.max} − ${f.min}.`,
      ],
      solution:
        ask === 'iqr'
          ? `<p>The box runs from Q1 = ${f.q1} to Q3 = ${f.q3}. IQR = ${f.q3} − ${f.q1} = <b>${iq}</b> ${c.unit}. On a box plot, the IQR is simply the length of the box, the spread of the middle half of the data.</p>`
          : `<p>The whiskers reach from the minimum ${f.min} to the maximum ${f.max}. Range = ${f.max} − ${f.min} = <b>${rg}</b> ${c.unit}. On a box plot, the range is the length of the whole plot.</p>`,
      feedback: {
        correct: ask === 'iqr' ? `Correct. The box is ${iq} ${c.unit} long, so the IQR is ${iq}.` : `Correct. The whole plot spans ${rg} ${c.unit}.`,
        wrong(ans, d) {
          if (ask === 'iqr' && d.value === rg) return 'That is the range (maximum − minimum). The IQR uses only the box: Q3 − Q1.';
          if (ask === 'range' && d.value === iq) return 'That is the IQR (the box). The range uses the whisker ends: maximum − minimum.';
          if (d.value === f.q3 || d.value === f.max) return `${d.value} is one end. You need the distance between two values: subtract.`;
          return ask === 'iqr' ? `Read the two box edges (${f.q1} and ${f.q3}) and subtract.` : `Read the two whisker ends (${f.min} and ${f.max}) and subtract.`;
        },
      },
    };
  });

  // ---------- Error: mixed up range and IQR, or forgot to order (error) ----------
  G.define('s5_rangeError', (r) => {
    const name = r.pick(NAMES),
      c = r.pick(CTX),
      variant = r.pick(['iqrAsRange', 'unordered']);
    let vals, s, f;
    for (let t = 0; t < 60; t++) {
      vals = S.cleanFive(r, 8, c.lo, c.hi, true);
      s = S.sorted(vals);
      f = S.fiveNum(vals);
      if (variant === 'iqrAsRange' ? f.max - f.min !== f.q3 - f.q1 : vals[7] - vals[0] !== f.max - f.min && vals[7] > vals[0]) break;
    }
    const iq = f.q3 - f.q1,
      rg = f.max - f.min;
    const work =
      variant === 'iqrAsRange'
        ? `"The largest value is ${f.max} and the smallest is ${f.min}. ${f.max} − ${f.min} = ${rg}, so the IQR is <b>${rg}</b>."`
        : `"The last value is ${vals[7]} and the first value is ${vals[0]}. ${vals[7]} − ${vals[0]} = ${vals[7] - vals[0]}, so the range is <b>${vals[7] - vals[0]}</b>."`;
    const opts =
      variant === 'iqrAsRange'
        ? [
            { html: `${name} found the range, not the IQR. The IQR is Q3 − Q1, the spread of the middle half.`, ok: true },
            { html: `${name} should have added ${f.max} and ${f.min}.`, why: 'Measures of spread are differences, not sums. The mistake is which two values were subtracted.' },
            { html: `${name} should have divided ${rg} by 2.`, why: 'Half the range is not the IQR. The IQR comes from the quartiles, Q3 − Q1.' },
            { html: 'There is no mistake. The IQR and the range are the same thing.', why: 'They are different. The range uses the maximum and minimum; the IQR uses Q3 and Q1.' },
          ]
        : [
            { html: `${name} used the first and last values in the list instead of the largest and smallest values.`, ok: true },
            { html: `${name} should have found Q3 − Q1.`, why: 'Q3 − Q1 is the IQR. The question asked for the range, which is maximum − minimum.' },
            { html: `${name} subtracted in the wrong order.`, why: `The subtraction ${vals[7]} − ${vals[0]} is fine. The problem is that ${vals[7]} and ${vals[0]} are not the maximum and minimum.` },
            { html: 'There is no mistake.', why: `The largest value in the data is ${f.max} and the smallest is ${f.min}. Neither one was used.` },
          ];
    const sh = shuffleOptions(r, opts, 0);
    return {
      type: 'error',
      skill: 'range-iqr',
      lesson: '2-5',
      title: 'Find the mistake',
      prompt: `<p>${name} is finding the ${variant === 'iqrAsRange' ? 'IQR' : 'range'} of ${c.what}: ${hl(S.list(variant === 'iqrAsRange' ? s : vals))}.</p><p>What mistake did ${name} make?</p>`,
      work,
      options: sh.options,
      answer: sh.answer,
      fix: { label: variant === 'iqrAsRange' ? 'What is the correct IQR?' : 'What is the correct range?', answer: variant === 'iqrAsRange' ? iq : rg },
      hints: [
        variant === 'iqrAsRange' ? 'The range and the IQR are different measures. Which two values does each one use?' : 'Is the list in order? The range needs the largest and smallest values, wherever they are in the list.',
        variant === 'iqrAsRange' ? `The IQR uses the quartiles. ${halvesText(vals)}` : `Ordered: ${S.list(s)}. Maximum ${f.max}, minimum ${f.min}.`,
        variant === 'iqrAsRange' ? `IQR = ${f.q3} − ${f.q1}.` : `Range = ${f.max} − ${f.min}.`,
      ],
      solution:
        variant === 'iqrAsRange'
          ? `<p>${name} subtracted the minimum from the maximum. That is the <b>range</b> (${rg}), not the IQR. ${halvesText(vals)} IQR = ${f.q3} − ${f.q1} = <b>${iq}</b>.</p>`
          : `<p>${name} used the first and last numbers in the list, but the list is not in order. Ordered: ${S.list(s)}. Range = ${f.max} − ${f.min} = <b>${rg}</b>.</p>`,
      feedback: {
        correct: variant === 'iqrAsRange' ? 'Correct. Range: max − min. IQR: Q3 − Q1. Different values, different measures.' : 'Correct. The range always uses the true maximum and minimum, not the ends of an unordered list.',
        wrong(ans, d) {
          if (!d.mistakeOk) return variant === 'iqrAsRange' ? `Look at which two values ${name} subtracted. Are ${f.max} and ${f.min} quartiles?` : `Is ${vals[7]} the largest value in the list? Is ${vals[0]} the smallest?`;
          return variant === 'iqrAsRange' ? `You found the mistake. Now compute Q3 − Q1 using the halves: ${S.list(S.halves(vals).lower)} and ${S.list(S.halves(vals).upper)}.` : `You found the mistake. Now subtract the smallest value from the largest: ${f.max} − ${f.min}.`;
        },
      },
    };
  });

  // ---------- Order data sets by range (seq) ----------
  G.define('s5_seqSpread', (r) => {
    const c = r.pick(CTX),
      k = r.pick([3, 4]),
      sites = r.pickN(SITES, k),
      asc = r.chance(0.5);
    let sets;
    for (let t = 0; t < 80; t++) {
      sets = sites.map(() => S.data(r, 5, c.lo, c.hi, true));
      const ranges = sets.map(S.range);
      if (new Set(ranges).size === k && Math.min(...ranges.slice(1).map((x, i) => Math.abs(x - ranges[i]))) >= 2) break;
    }
    const items = sets.map((d, i) => ({ html: `<b>${sites[i]}</b>: ${S.list(d)}`, rate: S.range(d) }));
    const order = items.map((_, i) => i).sort((a, b) => (asc ? items[a].rate - items[b].rate : items[b].rate - items[a].rate));
    return {
      type: 'seq',
      skill: 'range-iqr',
      lesson: '2-5',
      title: 'Order by spread',
      prompt: `<p>Each site recorded ${c.what} on 5 days. Order the sites by <b>range</b>, from ${asc ? '<b>smallest</b> range (top) to <b>largest</b> range (bottom)' : '<b>largest</b> range (top) to <b>smallest</b> range (bottom)'}.</p>`,
      items,
      order,
      hints: [
        'Find the range of each site separately: maximum − minimum.',
        `Ranges: ${sets.map((d, i) => `${sites[i]} ${Math.max(...d)} − ${Math.min(...d)}`).join('; ')}.`,
        `Ranges: ${sets.map((d, i) => `${sites[i]} ${S.range(d)}`).join(', ')}. Put the ${asc ? 'smallest' : 'largest'} at the top.`,
      ],
      solution: `<p>Ranges: ${sets.map((d, i) => `${sites[i]} = ${Math.max(...d)} − ${Math.min(...d)} = <b>${S.range(d)}</b>`).join('; ')}. From ${asc ? 'smallest to largest' : 'largest to smallest'}: <b>${order.map((i) => sites[i]).join(', ')}</b>. A bigger range means the values are more spread out.</p>`,
      feedback: {
        correct: `Correct. A larger range means more spread, and ${order.map((i) => sites[i])[0]} goes first.`,
        wrong() {
          return `Compute each range (max − min) before ordering, and check the direction: ${asc ? 'smallest' : 'largest'} range goes on top.`;
        },
      },
    };
  });

  // ---------- Compare IQRs of two box plots (mc) ----------
  G.define('s5_compareIQR', (r) => {
    const c = r.pick(CTX),
      [l1, l2] = r.pickN(SITES, 2);
    let f1, f2;
    for (let t = 0; t < 80; t++) {
      f1 = S.fiveNum(S.cleanFive(r, 8, c.lo, c.hi, true));
      f2 = S.fiveNum(S.cleanFive(r, 8, c.lo, c.hi, true));
      if (Math.abs(f1.q3 - f1.q1 - (f2.q3 - f2.q1)) >= 3 && f1.med !== f2.med) break;
    }
    const i1 = f1.q3 - f1.q1,
      i2 = f2.q3 - f2.q1;
    const tight = i1 < i2 ? l1 : l2,
      loose = tight === l1 ? l2 : l1,
      tightI = Math.min(i1, i2),
      looseI = Math.max(i1, i2);
    const higherMed = f1.med > f2.med ? l1 : l2;
    const opts = [
      { html: `${tight}, because its IQR is ${tightI}, which is smaller than ${looseI}.`, ok: true },
      { html: `${loose}, because its IQR is ${looseI}, which is larger than ${tightI}.`, why: 'A larger IQR means the middle half of the data is more spread out, so it is less consistent, not more.' },
      { html: `${higherMed}, because its median is higher.`, why: 'The median is a measure of center. Consistency is about spread, which the IQR measures.' },
      { html: 'Neither, because both sites have the same number of values.', why: 'The number of values does not tell you about spread. Compare the lengths of the boxes.' },
    ];
    const sh = shuffleOptions(r, opts, 0);
    return {
      type: 'mc',
      skill: 'range-iqr',
      lesson: '2-5',
      title: 'Which site is more consistent?',
      prompt: `<p>The box plots show ${c.what} at two sites.</p>${box([Object.assign({ label: l1 }, f1), Object.assign({ label: l2 }, f2)])}<p>Which site's middle half of data is <b>more consistent</b> (less spread out)? Use the IQR.</p>`,
      options: sh.options,
      answer: sh.answer,
      hints: [
        'The IQR is the length of the box. A shorter box means the middle half of the data is closer together.',
        `${l1}: Q1 = ${f1.q1}, Q3 = ${f1.q3}. ${l2}: Q1 = ${f2.q1}, Q3 = ${f2.q3}.`,
        `${l1} IQR = ${i1}. ${l2} IQR = ${i2}. The smaller IQR is more consistent.`,
      ],
      solution: `<p>${l1}: IQR = ${f1.q3} − ${f1.q1} = ${i1}. ${l2}: IQR = ${f2.q3} − ${f2.q1} = ${i2}. <b>${tight}</b> has the smaller IQR (${tightI}), so its middle half of data is less spread out and more consistent. The median tells where the center is, not how spread out the data is.</p>`,
      feedback: { correct: `Correct. A smaller IQR (${tightI}) means a tighter middle half.` },
    };
  });

  // ---------- Same median, different spread (cr) ----------
  G.define('s5_crVariability', (r) => {
    const c = r.pick(CTX),
      [l1, l2] = r.pickN(SITES, 2),
      n = 7;
    let d1, d2;
    for (let t = 0; t < 120; t++) {
      d1 = S.data(r, n, c.lo + 10, c.hi - 10, true);
      const raw = S.data(r, n, c.lo, c.hi, true);
      const shift = S.median(d1) - S.median(raw);
      d2 = raw.map((v) => v + shift);
      if (d2.every((v) => v >= 0) && Math.abs(S.range(d1) - S.range(d2)) >= 6 && new Set(d2).size === n) break;
    }
    const med = S.median(d1),
      r1 = S.range(d1),
      r2 = S.range(d2);
    const wide = r1 > r2 ? l1 : l2,
      narrow = wide === l1 ? l2 : l1;
    const sh = shuffleOptions(
      r,
      [
        { html: `Both sites have the same median, ${med}, but ${wide}'s data is more spread out (range ${Math.max(r1, r2)} vs. ${Math.min(r1, r2)}).`, ok: true },
        { html: `${wide} has the higher median because its range is larger.` },
        { html: 'The two data sets are exactly the same because their medians are equal.' },
        { html: `${narrow} has more data values because its range is smaller.` },
      ],
      0,
    );
    return {
      type: 'cr',
      skill: 'range-iqr',
      lesson: '2-5',
      title: 'Same center, different spread',
      prompt: `<p>Two sites recorded ${c.what} on ${n} days.</p><p><b>${l1}</b>: ${hl(S.list(S.sorted(d1)))}<br><b>${l2}</b>: ${hl(S.list(S.sorted(d2)))}</p><p>Both sites have the same median. Explain how the two data sets are <b>different</b>, using the range.</p>`,
      starters: ['Both medians are…, but…', 'The range of ' + l1 + ' is…, and the range of ' + l2 + ' is…', 'The data at … is more spread out because…'],
      minWords: 10,
      check: { prompt: 'Which statement is true?', options: sh.options, answer: sh.answer },
      hints: [
        'The median tells where the center is. The range tells how spread out the values are. Two sets can share a center but differ in spread.',
        `${l1}: range = ${Math.max(...d1)} − ${Math.min(...d1)} = ${r1}. ${l2}: range = ${Math.max(...d2)} − ${Math.min(...d2)} = ${r2}.`,
        `Both medians are ${med}. ${wide} has the larger range, so its values are more spread out.`,
      ],
      solution: `<p>Both sites have a median of <b>${med}</b> ${c.unit}, so their centers match. But ${l1} has a range of ${r1} and ${l2} has a range of ${r2}. <b>${wide}</b>'s values are much more spread out. A measure of center alone does not describe a data set; you also need a measure of spread.</p>`,
      feedback: {
        correct: 'Correct. Same median, different range: the center matches but the spread does not.',
        wrong(ans, d) {
          if (!d.wroteEnough) return 'Write at least ten words. Name both medians and compare the two ranges.';
          return 'For the check, pick the statement that says the medians are equal but the ranges are different.';
        },
      },
    };
  });

  // ---------- Range from a dot plot (num) ----------
  G.define('s5_rangeDot', (r) => {
    const c = r.pick([
      { label: 'Herons per morning', unit: 'herons', lo: 0, hi: 12 },
      { label: 'Burrows per square', unit: 'burrows', lo: 2, hi: 14 },
      { label: 'Snails per trap', unit: 'snails', lo: 1, hi: 11 },
    ]);
    const n = r.int(8, 12);
    let vals;
    for (let t = 0; t < 40; t++) {
      vals = S.shaped(r, r.pick(['symmetric', 'skewed right', 'skewed left']), c.lo, c.hi, n);
      if (S.range(vals) >= 4) break;
    }
    const mx = Math.max(...vals),
      mn = Math.min(...vals),
      rg = mx - mn,
      distinct = new Set(vals).size;
    return {
      type: 'num',
      skill: 'range-iqr',
      lesson: '2-5',
      title: 'Range from a dot plot',
      prompt: `<p>The dot plot shows ${c.label.toLowerCase()} for ${n} surveys.</p>${V.dotPlot({ values: vals, min: c.lo, max: c.hi, label: c.label, aria: 'Dot plot: ' + S.list(S.sorted(vals)) })}<p>What is the <b>range</b> of the data?</p>`,
      unit: c.unit,
      answer: rg,
      hints: [
        'The range is maximum − minimum. On a dot plot, look for the leftmost dot and the rightmost dot.',
        `The leftmost dot is at ${mn}. The rightmost dot is at ${mx}.`,
        `Range = ${mx} − ${mn}.`,
      ],
      solution: `<p>The smallest value with a dot is ${mn} and the largest is ${mx}. Range = ${mx} − ${mn} = <b>${rg}</b> ${c.unit}. Values on the number line with no dots do not count; only the dots are data.</p>`,
      feedback: {
        correct: `Correct. The dots stretch from ${mn} to ${mx}, a range of ${rg}.`,
        wrong(ans, d) {
          if (d.value === c.hi - c.lo) return 'You used the ends of the number line. The range uses the leftmost and rightmost dots, not the line itself.';
          if (d.value === distinct) return 'You counted how many different values have dots. The range is a subtraction: largest value − smallest value.';
          if (d.value === mx) return `${mx} is the largest value. Subtract the smallest value, ${mn}, to find the range.`;
          return 'Find the leftmost dot and the rightmost dot, then subtract their values.';
        },
      },
    };
  });
})(typeof window !== 'undefined' ? window : globalThis);

/* js/units/u2/gen-outliers.js */
/* Zone 6 — The Wreck. Lesson 2-6 Describe Data Using the Median: Outliers and Comparisons (Median and Outliers · Comparing Distributions).
   An outlier is judged informally here (Grade 6): a value that sits far away from the rest of the data. */
(function (root) {
  'use strict';
  const RX = root.RX;
  const { G, V, shuffleOptions, NAMES, fmt } = RX;
  const S = RX.STATS;
  const hl = V.hl;

  const CTX = [
    { what: 'barnacles counted on each hull plank', unit: 'barnacles', label: 'Barnacles per plank', lo: 3, hi: 11 },
    { what: 'coins found in each cabin', unit: 'coins', label: 'Coins per cabin', lo: 2, hi: 10 },
    { what: 'minutes each dive lasted', unit: 'minutes', label: 'Minutes per dive', lo: 6, hi: 14 },
    { what: 'fish seen on each dive', unit: 'fish', label: 'Fish per dive', lo: 4, hi: 12 },
    { what: 'rope lengths in meters', unit: 'm', label: 'Rope length (m)', lo: 5, hi: 13 },
  ];
  const LOGS = ['Captain’s log', 'First mate’s log', 'Bow team', 'Stern team', 'Dive crew A', 'Dive crew B', 'Morning dives', 'Evening dives'];
  /** n distinct cluster values in [lo, hi] plus one far value (an outlier) about 9–12 above the max or below the min. */
  function withOutlier(r, c, n) {
    const cluster = S.data(r, n - 1, c.lo, c.hi, true);
    const high = r.chance(0.65);
    const gap = r.int(9, 12);
    let out = high ? Math.max(...cluster) + gap : Math.min(...cluster) - gap;
    if (out < 0) out = Math.max(...cluster) + gap;
    return { all: r.shuffle(cluster.concat([out])), cluster, out };
  }
  const dotRange = (vals, c) => ({ min: Math.min(c.lo, Math.min(...vals)), max: Math.max(c.hi, Math.max(...vals)) });
  const dots = (vals, c, label, width) => {
    const R = dotRange(vals, c);
    return V.dotPlot({ values: vals, min: R.min, max: R.max, label: label || c.label, width: width || 480, aria: `${label || c.label} dot plot: ${S.list(S.sorted(vals))}` });
  };
  const medText = (vals) => {
    const s = S.sorted(vals),
      n = s.length;
    return n % 2 ? `ordered ${S.list(s)}, middle value ${S.median(vals)}` : `ordered ${S.list(s)}, middle values ${s[n / 2 - 1]} and ${s[n / 2]}, median ${fmt(S.median(vals))}`;
  };

  // ---------- Spot the outlier (mc) ----------
  G.define('s6_spotOutlier', (r) => {
    const c = r.pick(CTX),
      n = r.pick([8, 9, 10]);
    const d = withOutlier(r, c, n);
    const s = S.sorted(d.all),
      med = S.median(d.all);
    const high = d.out > Math.max(...d.cluster);
    const nearEnd = high ? Math.max(...d.cluster) : Math.min(...d.cluster);
    const farEnd = high ? Math.min(...d.cluster) : Math.max(...d.cluster);
    const pool = [
      { html: String(d.out), ok: true },
      { html: String(nearEnd), why: `${nearEnd} is the ${high ? 'largest' : 'smallest'} value in the main group, but it sits close to the other values. An outlier is far from the rest.` },
      { html: String(farEnd), why: `${farEnd} is at one end of the main group, but the gap between it and its neighbors is small.` },
    ];
    if (Number.isInteger(med) && med !== nearEnd && med !== farEnd && med !== d.out) pool.push({ html: String(med), why: `${med} is the median, right in the middle of the data. An outlier is far away from the middle.` });
    else pool.push({ html: 'There is no outlier.', why: `Look at the gap between ${d.out} and the next closest value. That gap is much bigger than any other gap.` });
    const sh = shuffleOptions(r, pool, 0);
    return {
      type: 'mc',
      skill: 'outliers',
      lesson: '2-6',
      title: 'Spot the outlier',
      prompt: `<p>The salvaged log lists ${c.what}. Each dot is one entry.</p>${dots(d.all, c)}<p>Data: ${hl(S.list(d.all))}. Which value is an <b>outlier</b>, a value far from the rest of the data?</p>`,
      options: sh.options,
      answer: sh.answer,
      hints: [
        'Look at the dot plot. Most of the dots sit close together in one group. An outlier is a dot with a big empty gap between it and that group.',
        `Ordered: ${S.list(s)}. Most values are between ${Math.min(...d.cluster)} and ${Math.max(...d.cluster)}.`,
        `One value is ${Math.abs(d.out - nearEnd)} away from its nearest neighbor. The gaps inside the main group are much smaller.`,
      ],
      solution: `<p>Most values cluster between ${Math.min(...d.cluster)} and ${Math.max(...d.cluster)}. The value <b>${d.out}</b> sits ${Math.abs(d.out - nearEnd)} ${c.unit} away from its nearest neighbor, far from the rest, so it is the outlier.</p>`,
      feedback: { correct: `Correct. ${d.out} is far from the main group of data.` },
    };
  });

  // ---------- Median with and without the outlier (blanks) ----------
  G.define('s6_medianWithWithout', (r) => {
    const c = r.pick(CTX),
      n = r.pick([7, 9]);
    const d = withOutlier(r, c, n);
    const withM = S.median(d.all),
      withoutM = S.median(d.cluster);
    return {
      type: 'blanks',
      skill: 'outliers',
      lesson: '2-6',
      title: 'Median with and without the outlier',
      prompt: `<p>Data (${c.what}): ${hl(S.list(d.all))}. The value ${hl(d.out)} is an outlier.</p><p>Find the median with the outlier, then the median after removing it.${Number.isInteger(withoutM) ? '' : ' A median may be a decimal.'}</p>`,
      fields: [
        { label: 'median with outlier', answer: withM, width: 'sm', tolerance: 0.01 },
        { label: 'median without outlier', answer: withoutM, width: 'sm', tolerance: 0.01 },
      ],
      template: ['With all ' + n + ' values, the median is {0}.', 'Without ' + d.out + ', the median of the remaining ' + (n - 1) + ' values is {1}.'],
      hints: [
        'Order the data each time. With an odd count, the median is the single middle value. With an even count, it is halfway between the two middle values.',
        `With the outlier: ${medText(d.all)}.`,
        `Without ${d.out}: ${medText(d.cluster)}.`,
      ],
      solution: `<p>With the outlier: ${medText(d.all)}, so the median is <b>${fmt(withM)}</b>. Without ${d.out}: ${medText(d.cluster)}, so the median is <b>${fmt(withoutM)}</b>. The median moved only ${fmt(Math.abs(withM - withoutM))} ${c.unit}, because the median depends on the middle position, not on how extreme the end values are.</p>`,
      feedback: {
        correct: `Correct. The median barely moved (${fmt(withM)} to ${fmt(withoutM)}). Outliers have little effect on the median.`,
        wrong(ans, d2) {
          if (d2.wrong.includes(0)) return `Order all ${n} values first: ${S.list(S.sorted(d.all))}. Then find the middle.`;
          return `After removing ${d.out}, there are ${n - 1} values, an even number. Average the two middle values.`;
        },
      },
    };
  });

  // ---------- Effect of removing an outlier (tf) ----------
  G.define('s6_effectTF', (r) => {
    const c = r.pick(CTX),
      n = r.pick([8, 9, 10]);
    let d, m1, m2;
    for (let t = 0; t < 60; t++) {
      d = withOutlier(r, c, n);
      m1 = S.median(d.all);
      m2 = S.median(d.cluster);
      if (Math.abs(m1 - m2) <= 1.5) break;
    }
    const r1 = S.range(d.all),
      r2 = S.range(d.cluster);
    const variant = r.pick(['medianBig', 'rangeBig', 'medianLittle']);
    const claim = {
      medianBig: { text: `Removing the outlier ${d.out} changes the median a lot.`, answer: false, reason: `The median only moves from ${fmt(m1)} to ${fmt(m2)}. The median depends on the middle position, so one far-away value barely changes it.` },
      rangeBig: { text: `Removing the outlier ${d.out} changes the range a lot.`, answer: true, reason: `The range drops from ${r1} to ${r2}. The range uses the maximum and minimum, so an outlier at one end stretches it.` },
      medianLittle: { text: `Removing the outlier ${d.out} changes the median very little.`, answer: true, reason: `The median moves from ${fmt(m1)} to ${fmt(m2)}, a change of ${fmt(Math.abs(m1 - m2))}. The middle position barely shifts when one end value is removed.` },
    }[variant];
    const reasons = r.shuffle([
      { html: claim.reason, correct: true },
      { html: variant === 'rangeBig' ? 'The range never changes when a value is removed.' : `Removing any value always changes the median by exactly that value.` },
      { html: variant === 'rangeBig' ? 'The range is the middle value, so it moves a little.' : 'The median is the largest value, so removing an outlier changes it a lot.' },
    ]);
    return {
      type: 'tf',
      skill: 'outliers',
      lesson: '2-6',
      title: 'What does the outlier change?',
      prompt: `<p>Data (${c.what}): ${hl(S.list(S.sorted(d.all)))}. The value ${hl(d.out)} is an outlier.</p><p>True or false: <b>${claim.text}</b></p>`,
      answer: claim.answer,
      reasons,
      hints: [
        'Compute the measure with all the values, then again without the outlier. Compare the two results.',
        variant === 'rangeBig' ? `With the outlier: range = ${Math.max(...d.all)} − ${Math.min(...d.all)} = ${r1}. Without it: ${Math.max(...d.cluster)} − ${Math.min(...d.cluster)} = ${r2}.` : `With the outlier: ${medText(d.all)}. Without it: ${medText(d.cluster)}.`,
        variant === 'rangeBig' ? `The range changed by ${r1 - r2}. Is that a lot?` : `The median changed by ${fmt(Math.abs(m1 - m2))}. Is that a lot?`,
      ],
      solution: `<p><b>${claim.answer ? 'True' : 'False'}.</b> ${claim.reason} In general, an outlier has a big effect on the range but a small effect on the median.</p>`,
      feedback: {
        correct: 'Correct. Outliers stretch the range but barely move the median.',
        wrong(ans, d2) {
          if (!d2.valueOk) return variant === 'rangeBig' ? `Compare the two ranges: ${r1} with the outlier, ${r2} without.` : `Compare the two medians: ${fmt(m1)} with the outlier, ${fmt(m2)} without. How far apart are they?`;
          return 'Your true/false choice is right. Pick the reason that names the two values you computed.';
        },
      },
    };
  });

  // ---------- Median and range, with and without (table) ----------
  G.define('s6_tableEffect', (r) => {
    const c = r.pick(CTX),
      n = r.pick([7, 9]);
    const d = withOutlier(r, c, n);
    const m1 = S.median(d.all),
      m2 = S.median(d.cluster),
      r1 = S.range(d.all),
      r2 = S.range(d.cluster);
    return {
      type: 'table',
      skill: 'outliers',
      lesson: '2-6',
      title: 'With and without the outlier',
      prompt: `<p>Data (${c.what}): ${hl(S.list(d.all))}. The outlier is ${hl(d.out)}.</p><p>Complete the table. Find each measure with all the data, then after removing the outlier.${Number.isInteger(m2) ? '' : ' A median may be a decimal.'}</p>`,
      rows: [
        ['', 'Median', 'Range'],
        ['With the outlier', '__IN:m1__', '__IN:r1__'],
        ['Without the outlier', '__IN:m2__', '__IN:r2__'],
      ],
      header: true,
      rowHeader: true,
      inputs: [
        { id: 'm1', answer: m1, tolerance: 0.01 },
        { id: 'r1', answer: r1 },
        { id: 'm2', answer: m2, tolerance: 0.01 },
        { id: 'r2', answer: r2 },
      ],
      hints: [
        'Order the data. Median: the middle value (or the average of the two middle values). Range: maximum − minimum.',
        `With the outlier: ${medText(d.all)}; range ${Math.max(...d.all)} − ${Math.min(...d.all)}.`,
        `Without ${d.out}: ${medText(d.cluster)}; range ${Math.max(...d.cluster)} − ${Math.min(...d.cluster)}.`,
      ],
      solution: `<p>With the outlier: median <b>${fmt(m1)}</b>, range <b>${r1}</b>. Without the outlier: median <b>${fmt(m2)}</b>, range <b>${r2}</b>. The range shrank by ${r1 - r2} but the median moved only ${fmt(Math.abs(m1 - m2))}. The outlier stretches the range because the range uses the end values; the median uses the middle position.</p>`,
      feedback: {
        correct: 'Correct. Big change in the range, small change in the median.',
        wrong(ans, d2) {
          if (d2.wrong.includes('r1') || d2.wrong.includes('r2')) return 'Check a range: subtract the smallest value from the largest value in that set.';
          if (d2.wrong.includes('m2')) return `Without ${d.out} there are ${n - 1} values, an even number. The median is halfway between the two middle values.`;
          return `Order all ${n} values: ${S.list(S.sorted(d.all))}. The median is the middle one.`;
        },
      },
    };
  });

  // ---------- Compare medians of two dot plots (num) ----------
  G.define('s6_compareDots', (r) => {
    const c = r.pick(CTX),
      [l1, l2] = r.pickN(LOGS, 2),
      n = r.pick([9, 11]);
    let d1, d2;
    for (let t = 0; t < 60; t++) {
      d1 = S.shaped(r, r.pick(['symmetric', 'skewed right']), c.lo, c.hi, n);
      d2 = S.shaped(r, r.pick(['symmetric', 'skewed left']), c.lo, c.hi, n);
      if (Math.abs(S.median(d1) - S.median(d2)) >= 2) break;
    }
    const m1 = S.median(d1),
      m2 = S.median(d2);
    const hi = m1 > m2 ? l1 : l2,
      lo = hi === l1 ? l2 : l1,
      diff = Math.abs(m1 - m2);
    return {
      type: 'num',
      skill: 'compare-dist',
      lesson: '2-6',
      title: 'Compare two dot plots',
      prompt: `<p>Two crews recorded ${c.what} on ${n} dives each.</p><p><b>${l1}</b></p>${dots(d1, c, l1, 420)}<p><b>${l2}</b></p>${dots(d2, c, l2, 420)}<p>${hi} has the greater median. <b>How much greater</b> is it than ${lo}'s median?</p>`,
      unit: c.unit,
      answer: diff,
      hints: [
        `Each plot has ${n} dots. The median is the ${(n + 1) / 2}th dot counting from the left.`,
        `${l1}: ordered ${S.list(S.sorted(d1))}, median ${m1}. ${l2}: ordered ${S.list(S.sorted(d2))}, median ${m2}.`,
        `Subtract: ${Math.max(m1, m2)} − ${Math.min(m1, m2)}.`,
      ],
      solution: `<p>${l1}: the ${(n + 1) / 2}th dot is at ${m1}. ${l2}: the ${(n + 1) / 2}th dot is at ${m2}. ${hi}'s median is greater by ${Math.max(m1, m2)} − ${Math.min(m1, m2)} = <b>${diff}</b> ${c.unit}. Comparing medians compares the typical value of each crew.</p>`,
      feedback: {
        correct: `Correct. ${hi}'s typical value is ${diff} ${c.unit} higher.`,
        wrong(ans, d) {
          if (d.value === Math.abs(Math.max(...d1) - Math.max(...d2))) return 'You compared the largest values. The median is the middle dot of each plot.';
          if (d.value === m1 || d.value === m2) return 'That is one median. The question asks for the difference between the two medians.';
          return `Count to the ${(n + 1) / 2}th dot in each plot to find each median, then subtract.`;
        },
      },
    };
  });

  // ---------- Who compared the data correctly (who) ----------
  G.define('s6_whoCompare', (r) => {
    const c = r.pick(CTX),
      [a, b] = r.pickN(NAMES, 2),
      [l1, l2] = r.pickN(LOGS, 2),
      n = 7;
    let d1, d2;
    for (let t = 0; t < 80; t++) {
      d1 = S.data(r, n, c.lo, c.hi, true);
      d2 = S.data(r, n, c.lo, c.hi, true);
      const hiMed = S.median(d1) > S.median(d2) ? d1 : d2,
        other = hiMed === d1 ? d2 : d1;
      // make the set with the greater median have the SMALLER maximum so that "largest value" reasoning fails
      if (S.median(d1) !== S.median(d2) && Math.max(...hiMed) < Math.max(...other) && S.range(d1) !== S.range(d2)) break;
    }
    const m1 = S.median(d1),
      m2 = S.median(d2);
    const hi = m1 > m2 ? l1 : l2,
      lo = hi === l1 ? l2 : l1;
    const maxHi = Math.max(...d1) > Math.max(...d2) ? l1 : l2;
    const rgHi = S.range(d1) > S.range(d2) ? l1 : l2;
    const opts = [
      { html: `<b>${a}</b>: "${hi} has the greater median, ${Math.max(m1, m2)} compared to ${Math.min(m1, m2)}. A typical value is higher for ${hi}."`, ok: true },
      { html: `<b>${b}</b>: "${maxHi} has the greater median because it has the largest single value."`, why: `One large value does not set the median. The median is the middle value after ordering, and ${lo}'s middle value is lower.` },
    ];
    if (r.chance(0.6)) opts.push({ html: `<b>${r.pickN(NAMES.filter((x) => x !== a && x !== b), 1)[0]}</b>: "${rgHi} has the greater median because its range is bigger."`, why: 'The range measures spread, not center. A wider spread does not mean a higher middle value.' });
    const sh = shuffleOptions(r, opts, 0);
    return {
      type: 'who',
      skill: 'compare-dist',
      lesson: '2-6',
      title: 'Who compared correctly?',
      prompt: `<p>Two crews recorded ${c.what}.</p><p><b>${l1}</b>: ${hl(S.list(d1))}<br><b>${l2}</b>: ${hl(S.list(d2))}</p><p>Who correctly compares the <b>medians</b>?</p>`,
      options: sh.options,
      answer: sh.answer,
      layout: 'cards',
      hints: [
        'Find each median: order the values and take the middle one. Then compare.',
        `${l1}: ordered ${S.list(S.sorted(d1))}, median ${m1}. ${l2}: ordered ${S.list(S.sorted(d2))}, median ${m2}.`,
        `${hi}'s median is greater. Which student says that, with the right reason?`,
      ],
      solution: `<p><b>${a}</b> is correct. ${l1} has median ${m1} and ${l2} has median ${m2}, so <b>${hi}</b> has the greater median. The largest single value and the range do not decide the median; only the middle of the ordered data does.</p>`,
      feedback: { correct: 'Correct. Compare medians by finding each middle value, not by looking at extremes.' },
    };
  });

  // ---------- Sort claims about two data sets (sort) ----------
  G.define('s6_sortClaims', (r) => {
    const c = r.pick(CTX),
      [l1, l2] = r.pickN(LOGS, 2),
      n = 7;
    let d1, d2;
    for (let t = 0; t < 60; t++) {
      d1 = S.data(r, n, c.lo, c.hi, true);
      d2 = S.data(r, n, c.lo, c.hi, true);
      if (S.median(d1) !== S.median(d2) && S.range(d1) !== S.range(d2) && Math.max(...d1) !== Math.max(...d2)) break;
    }
    const m1 = S.median(d1),
      m2 = S.median(d2),
      r1 = S.range(d1),
      r2 = S.range(d2);
    const medHi = m1 > m2 ? l1 : l2,
      medLo = medHi === l1 ? l2 : l1,
      rgHi = r1 > r2 ? l1 : l2,
      rgLo = rgHi === l1 ? l2 : l1;
    const items = r.shuffle([
      { html: `${medHi} has the greater median.`, bin: 0 },
      { html: `${medLo} has the greater median.`, bin: 1 },
      { html: `${rgHi}'s data is more spread out (greater range).`, bin: 0 },
      { html: `${rgLo}'s data is more spread out (greater range).`, bin: 1 },
      { html: `The median of ${l1} is ${m1}.`, bin: 0 },
      { html: `The range of ${l2} is ${r2 + r.pick([-2, 2, 3])}.`, bin: 1 },
    ]);
    return {
      type: 'sort',
      skill: 'compare-dist',
      lesson: '2-6',
      title: 'True or false claims',
      prompt: `<p>Two crews recorded ${c.what} on 7 dives.</p><p><b>${l1}</b>: ${hl(S.list(d1))}<br><b>${l2}</b>: ${hl(S.list(d2))}</p><p>Sort each claim as true or false.</p>`,
      bins: ['True', 'False'],
      items,
      hints: [
        'Order each set. Find its median (middle value) and its range (maximum − minimum).',
        `${l1}: ordered ${S.list(S.sorted(d1))}. ${l2}: ordered ${S.list(S.sorted(d2))}.`,
        `Medians: ${l1} ${m1}, ${l2} ${m2}. Ranges: ${l1} ${r1}, ${l2} ${r2}. Check each claim against these.`,
      ],
      solution: `<p>${l1}: median <b>${m1}</b>, range <b>${r1}</b>. ${l2}: median <b>${m2}</b>, range <b>${r2}</b>. So ${medHi} has the greater median, and ${rgHi}'s data is more spread out. A claim is true only if it matches these computed values.</p>`,
      feedback: {
        correct: 'Correct. Center (median) and spread (range) are separate comparisons.',
        wrong(ans, d) {
          const it = items[d.wrong[0]];
          if (it && /median/.test(it.html)) return `Check the medians: order each set and take the 4th value. ${l1} has median ${m1}; ${l2} has median ${m2}.`;
          return `Check the ranges: maximum − minimum. ${l1} has range ${r1}; ${l2} has range ${r2}.`;
        },
      },
    };
  });

  // ---------- Compare two distributions in writing (cr) ----------
  G.define('s6_crCompare', (r) => {
    const c = r.pick(CTX),
      [l1, l2] = r.pickN(LOGS, 2),
      n = 9;
    let d1, d2;
    for (let t = 0; t < 60; t++) {
      d1 = S.shaped(r, 'symmetric', c.lo, c.lo + 4, n);
      d2 = S.shaped(r, 'symmetric', c.lo, c.hi, n);
      if (S.median(d1) !== S.median(d2) && S.range(d2) - S.range(d1) >= 3) break;
    }
    const m1 = S.median(d1),
      m2 = S.median(d2),
      r1 = S.range(d1),
      r2 = S.range(d2);
    const medHi = m1 > m2 ? l1 : l2;
    const sh = shuffleOptions(
      r,
      [
        { html: `${medHi} has the greater median, and ${l2} is more spread out (range ${r2} vs. ${r1}).`, ok: true },
        { html: `${l1} is more spread out because its dots are stacked higher.` },
        { html: 'The two crews have the same median because both have 9 dives.' },
        { html: `${l2} has the greater median because it has the largest value.` },
      ],
      0,
    );
    return {
      type: 'cr',
      skill: 'compare-dist',
      lesson: '2-6',
      title: 'Compare the two crews',
      prompt: `<p>Two crews recorded ${c.what} on ${n} dives each.</p><p><b>${l1}</b></p>${dots(d1, c, l1, 420)}<p><b>${l2}</b></p>${dots(d2, c, l2, 420)}<p>Compare the two distributions. Use the <b>median</b> (center) and the <b>range</b> (spread) in your answer.</p>`,
      starters: [`The median of ${l1} is… and the median of ${l2} is…`, 'The data for … is more spread out because…', 'A typical dive for … had…'],
      minWords: 12,
      check: { prompt: 'Which comparison is correct?', options: sh.options, answer: sh.answer },
      hints: [
        'Center first: count to the 5th dot in each plot to find the median. Then spread: find each range from the leftmost dot to the rightmost dot.',
        `${l1}: median ${m1}, range ${Math.max(...d1)} − ${Math.min(...d1)} = ${r1}. ${l2}: median ${m2}, range ${Math.max(...d2)} − ${Math.min(...d2)} = ${r2}.`,
        `${medHi} has the higher center. ${l2} has the wider spread. Say both in your answer.`,
      ],
      solution: `<p>${l1}: median <b>${m1}</b>, range <b>${r1}</b>. ${l2}: median <b>${m2}</b>, range <b>${r2}</b>. <b>${medHi}</b> has the greater median, so its typical dive value is higher. <b>${l2}</b>'s values are more spread out, since its range is ${r2 - r1} larger. A good comparison names both center and spread.</p>`,
      feedback: {
        correct: 'Correct. Center and spread together describe how the two crews differ.',
        wrong(ans, d) {
          if (!d.wroteEnough) return 'Write at least twelve words. Name both medians and say which plot is more spread out.';
          return 'For the check, pick the statement that gets both the median comparison and the range comparison right.';
        },
      },
    };
  });
})(typeof window !== 'undefined' ? window : globalThis);

/* js/units/u2/gen-decimals.js */
/* Zone 7 — The Lighthouse. Lesson 2-7 Divide Decimals Using an Algorithm (Dividing a Decimal by a Whole Number · Dividing by a Decimal).
   Every quotient terminates with at most 2 decimal places: problems are built from the quotient and divisor, and the dividend is the product. */
(function (root) {
  'use strict';
  const RX = root.RX;
  const { G, V, shuffleOptions, NAMES, fmt, round, money } = RX;
  const hl = V.hl;
  const D = (x) => fmt(round(x, 3));
  const digitsOf = (x) => String(round(x, 3)).replace('.', '').replace(/^0+/, '');

  const SHARE = [
    { thing: 'liters of lamp oil', among: 'lamps', unit: 'liters' },
    { thing: 'meters of rope', among: 'equal pieces', unit: 'm' },
    { thing: 'kilograms of flour', among: 'equal sacks', unit: 'kg' },
    { thing: 'hours of watch duty', among: 'keepers', unit: 'hours' },
    { thing: 'pounds of fish', among: 'equal crates', unit: 'lb' },
  ];
  /** Decimal ÷ whole: quotient q (1 or 2 dp), divisor d whole, dividend = q × d. */
  function wholeDiv(r, hard) {
    const d = hard ? r.pick([6, 7, 8, 9, 12]) : r.pick([2, 3, 4, 5, 6, 8]);
    const q = round(r.int(1, hard ? 12 : 9) + (r.chance(0.7) ? r.int(1, 9) / 10 : r.int(1, 99) / 100), 2);
    return { d, q, dividend: round(q * d, 2) };
  }
  /** Decimal ÷ decimal: divisor with 1 dp (or 2 dp when hard), quotient integer or 1 dp, dividend = q × d. */
  function decDiv(r, hard) {
    const d = hard ? r.pick([0.25, 0.75, 1.25, 1.5, 0.05]) : r.pick([0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.2, 1.5]);
    const q = hard ? round(r.int(2, 14) + r.pick([0, 0, 0.2, 0.4, 0.6, 0.8]), 1) : round(r.int(2, 12) + (r.chance(0.4) ? r.int(1, 9) / 10 : 0), 1);
    return { d, q, dividend: round(q * d, 2), scale: String(d).split('.')[1].length === 2 ? 100 : 10 };
  }

  // ---------- Decimal ÷ whole number (num) ----------
  G.define('s7_divWhole', (r) => {
    const c = r.pick(SHARE),
      p = wholeDiv(r, false),
      name = r.pick(NAMES);
    return {
      type: 'num',
      skill: 'divide-decimals',
      lesson: '2-7',
      title: 'Share the supply',
      prompt: `<p>${name} the keeper has ${hl(D(p.dividend) + ' ' + c.thing)} to share equally among ${hl(p.d + ' ' + c.among)}.</p><p>How much does each one get? Find ${hl(D(p.dividend) + ' ÷ ' + p.d)}.</p>`,
      unit: c.unit,
      answer: p.q,
      tolerance: 0.001,
      hints: [
        'Divide as you would with whole numbers. Place the decimal point in the quotient directly above the decimal point in the dividend.',
        `Estimate first: ${D(p.dividend)} is close to ${Math.round(p.dividend)}, and ${Math.round(p.dividend)} ÷ ${p.d} is about ${D(round(Math.round(p.dividend) / p.d, 1))}. Your answer should be near that.`,
        `Divide ${digitsOf(p.dividend)} by ${p.d} as if there were no decimal point, then put the point back so the answer is close to your estimate.`,
      ],
      solution: `<p>${D(p.dividend)} ÷ ${p.d} = <b>${D(p.q)}</b> ${c.unit}. Check by multiplying: ${D(p.q)} × ${p.d} = ${D(p.dividend)}. The decimal point in the quotient sits directly above the decimal point in the dividend, which keeps the place values lined up.</p>`,
      feedback: {
        correct: `Correct. ${D(p.q)} × ${p.d} = ${D(p.dividend)}, so the quotient checks.`,
        wrong(ans, d) {
          if (d.value != null && Math.abs(d.value - p.q * 10) < 0.001) return `${D(d.value)} is ten times too big. Estimate: ${Math.round(p.dividend)} ÷ ${p.d} is about ${D(round(Math.round(p.dividend) / p.d, 1))}. Place the decimal point above the one in the dividend.`;
          if (d.value != null && Math.abs(d.value - p.q / 10) < 0.001) return `${D(d.value)} is ten times too small. Compare with the estimate ${D(round(Math.round(p.dividend) / p.d, 1))}.`;
          if (d.value != null && Math.abs(d.value - p.dividend * p.d) < 0.001) return 'You multiplied. Sharing equally means dividing the total by the number of shares.';
          return `Divide ${D(p.dividend)} by ${p.d}. Check: your answer × ${p.d} should equal ${D(p.dividend)}.`;
        },
      },
    };
  });

  // ---------- Where does the decimal point go? (mc) ----------
  G.define('s7_placePoint', (r) => {
    let p;
    for (let t = 0; t < 40; t++) {
      p = wholeDiv(r, false);
      if (!Number.isInteger(p.q) && p.q >= 1) break;
    }
    const digits = digitsOf(p.q);
    const est = round(Math.round(p.dividend) / p.d, 1);
    const cands = [p.q, round(p.q * 10, 3), round(p.q / 10, 3), round(p.q * 100, 3)];
    const seen = new Set();
    const opts = [];
    cands.forEach((v, i) => {
      const txt = D(v);
      if (seen.has(txt)) return;
      seen.add(txt);
      opts.push(
        i === 0
          ? { html: txt, ok: true }
          : {
              html: txt,
              why: `Estimate: ${D(p.dividend)} ÷ ${p.d} is about ${Math.round(p.dividend)} ÷ ${p.d} ≈ ${D(est)}. ${txt} is far from that estimate, so the decimal point is in the wrong place.`,
            },
      );
    });
    const sh = shuffleOptions(r, opts, 0);
    return {
      type: 'mc',
      skill: 'divide-decimals',
      lesson: '2-7',
      title: 'Place the decimal point',
      prompt: `<p>A keeper divided ${hl(D(p.dividend) + ' ÷ ' + p.d)} and got the digits ${hl(digits)}, but forgot to write the decimal point.</p><p>Which is the correct quotient?</p>`,
      options: sh.options,
      answer: sh.answer,
      hints: [
        'Estimate the quotient with whole numbers first. The real quotient must be close to the estimate.',
        `${D(p.dividend)} is about ${Math.round(p.dividend)}. ${Math.round(p.dividend)} ÷ ${p.d} is about ${D(est)}.`,
        `Place the decimal point in ${digits} so the number is close to ${D(est)}.`,
      ],
      solution: `<p>Estimate: ${Math.round(p.dividend)} ÷ ${p.d} ≈ ${D(est)}, so the quotient is close to ${D(est)}. Placing the point to match gives <b>${D(p.q)}</b>. Check: ${D(p.q)} × ${p.d} = ${D(p.dividend)}. In the algorithm, the decimal point in the quotient goes directly above the decimal point in the dividend.</p>`,
      feedback: { correct: `Correct. ${D(p.q)} is close to the estimate and ${D(p.q)} × ${p.d} = ${D(p.dividend)}.` },
    };
  });

  // ---------- Whole ÷ whole with a decimal quotient: annex zeros (num) ----------
  G.define('s7_annexZero', (r) => {
    const c = r.pick(SHARE);
    const d = r.pick([2, 4, 5, 8]);
    const fracs = { 2: [0.5], 4: [0.25, 0.5, 0.75], 5: [0.2, 0.4, 0.6, 0.8], 8: [0.25, 0.5, 0.75] }[d];
    const q = round(r.int(1, 9) + r.pick(fracs), 2);
    const dividend = Math.round(q * d);
    const zeros = String(q).split('.')[1].length;
    return {
      type: 'num',
      skill: 'divide-decimals',
      lesson: '2-7',
      title: 'Keep dividing',
      prompt: `<p>The keeper cuts ${hl(dividend + ' ' + c.thing)} into ${hl(d + ' ' + c.among)}.</p><p>How much is each share? Find ${hl(dividend + ' ÷ ' + d)}. Write the answer as a decimal.</p>`,
      unit: c.unit,
      answer: q,
      tolerance: 0.001,
      hints: [
        `${d} does not divide ${dividend} evenly. Write ${dividend} as ${dividend}.${'0'.repeat(zeros)} and keep dividing past the decimal point.`,
        `${dividend} ÷ ${d}: the whole-number part is ${Math.floor(q)} with ${dividend - Math.floor(q) * d} left over. Bring down a zero and divide the remainder as tenths.`,
        `Keep bringing down zeros until the remainder is 0. You will need ${zeros} decimal place${zeros > 1 ? 's' : ''}.`,
      ],
      solution: `<p>${dividend} ÷ ${d}: ${d} goes into ${dividend} ${Math.floor(q)} time${Math.floor(q) === 1 ? '' : 's'} with ${dividend - Math.floor(q) * d} left over. Annex a zero (write ${dividend} as ${dividend}.${'0'.repeat(zeros)}) and keep dividing: the quotient is <b>${D(q)}</b> ${c.unit}. Check: ${D(q)} × ${d} = ${dividend}. Annexing zeros does not change the value of ${dividend}; it only lets the division continue.</p>`,
      feedback: {
        correct: `Correct. ${D(q)} × ${d} = ${dividend}.`,
        wrong(ans, d2) {
          if (d2.value === Math.floor(q)) return `${Math.floor(q)} is only the whole-number part. There is a remainder of ${dividend - Math.floor(q) * d}. Annex a zero and keep dividing.`;
          if (d2.value != null && Math.abs(d2.value - q * 10) < 0.001) return 'Your digits are right but the decimal point is misplaced. The answer must be less than ' + (Math.floor(q) + 1) + '.';
          return `Divide ${dividend} by ${d}. When you run out of digits, write zeros after the decimal point and keep going.`;
        },
      },
    };
  });

  // ---------- Error: misplaced decimal point (error) ----------
  G.define('s7_errorPoint', (r) => {
    const name = r.pick(NAMES);
    let p;
    for (let t = 0; t < 40; t++) {
      p = wholeDiv(r, false);
      if (!Number.isInteger(p.q) && p.q >= 1) break;
    }
    const variant = r.pick(['noPoint', 'tenth']);
    const wrongQ = variant === 'noPoint' ? Number(digitsOf(p.q)) : round(p.q / 10, 3);
    const est = round(Math.round(p.dividend) / p.d, 1);
    const opts = [
      {
        html: variant === 'noPoint' ? `${name} forgot to place the decimal point. The quotient should be about ${D(est)}, so the point belongs after the ${Math.floor(p.q) < 10 ? 'first' : 'second'} digit.` : `${name} placed the decimal point one place too far left. The quotient should be about ${D(est)}.`,
        ok: true,
      },
      { html: `${name} should have multiplied ${D(p.dividend)} by ${p.d}.`, why: 'The problem is a division. The digits of the quotient are right; only the decimal point is wrong.' },
      { html: `${name} divided the digits wrong.`, why: `The digits ${digitsOf(p.q)} are correct. The mistake is where the decimal point sits.` },
      { html: 'There is no mistake.', why: `Check with an estimate: ${Math.round(p.dividend)} ÷ ${p.d} is about ${D(est)}. ${D(wrongQ)} is nowhere near that.` },
    ];
    const sh = shuffleOptions(r, opts, 0);
    return {
      type: 'error',
      skill: 'divide-decimals',
      lesson: '2-7',
      title: 'Find the mistake',
      prompt: `<p>${name} divided ${hl(D(p.dividend) + ' ÷ ' + p.d)}.</p><p>What mistake did ${name} make?</p>`,
      work: `"${D(p.dividend)} ÷ ${p.d} = <b>${D(wrongQ)}</b>"`,
      options: sh.options,
      answer: sh.answer,
      fix: { label: 'What is the correct quotient?', answer: p.q, tolerance: 0.001 },
      hints: [
        'Estimate with whole numbers. Does the answer make sense?',
        `${D(p.dividend)} is about ${Math.round(p.dividend)}, and ${Math.round(p.dividend)} ÷ ${p.d} ≈ ${D(est)}.`,
        `The digits ${digitsOf(p.q)} are right. Place the decimal point so the quotient is close to ${D(est)}, then check by multiplying by ${p.d}.`,
      ],
      solution: `<p>${name}'s digits are correct, but the decimal point is misplaced. Estimate: ${Math.round(p.dividend)} ÷ ${p.d} ≈ ${D(est)}. The correct quotient is <b>${D(p.q)}</b>, and ${D(p.q)} × ${p.d} = ${D(p.dividend)} confirms it. Always place the point in the quotient directly above the point in the dividend.</p>`,
      feedback: {
        correct: 'Correct. An estimate catches a misplaced decimal point every time.',
        wrong(ans, d) {
          if (!d.mistakeOk) return `Estimate ${Math.round(p.dividend)} ÷ ${p.d}. Is ${D(wrongQ)} anywhere close?`;
          return `You found the mistake. Now place the point in ${digitsOf(p.q)} so the quotient is near ${D(est)}.`;
        },
      },
    };
  });

  // ---------- Rewrite a decimal divisor as a whole number (blanks) ----------
  G.define('s7_rewriteBlanks', (r) => {
    const p = decDiv(r, r.chance(0.3));
    const nd = round(p.dividend * p.scale, 2),
      nv = round(p.d * p.scale, 2);
    return {
      type: 'blanks',
      skill: 'divide-decimals',
      lesson: '2-7',
      title: 'Make the divisor a whole number',
      prompt: `<p>To divide by a decimal, first change the divisor into a whole number. Complete the steps for ${hl(D(p.dividend) + ' ÷ ' + D(p.d))}.</p>`,
      fields: [
        { label: 'new dividend', answer: nd, width: 'sm', tolerance: 0.001 },
        { label: 'new divisor', answer: nv, width: 'sm', tolerance: 0.001 },
        { label: 'quotient', answer: p.q, width: 'sm', tolerance: 0.001 },
      ],
      template: [`Multiply both numbers by ${p.scale}: ${D(p.dividend)} ÷ ${D(p.d)} becomes {0} ÷ {1}.`, 'Now divide: the quotient is {2}.'],
      hints: [
        `The divisor ${D(p.d)} has ${p.scale === 100 ? 'two decimal places, so multiply by 100' : 'one decimal place, so multiply by 10'}. Multiply the dividend by the same number so the quotient stays the same.`,
        `${D(p.d)} × ${p.scale} = ${D(nv)}. ${D(p.dividend)} × ${p.scale} = ${D(nd)}.`,
        `Now divide ${D(nd)} ÷ ${D(nv)}. Check your answer by multiplying it by ${D(p.d)}.`,
      ],
      solution: `<p>Multiply both numbers by ${p.scale}: ${D(p.dividend)} ÷ ${D(p.d)} = <b>${D(nd)}</b> ÷ <b>${D(nv)}</b>. Then divide: <b>${D(p.q)}</b>. Multiplying both numbers by the same amount does not change the quotient, just as ${D(p.dividend)} ÷ ${D(p.d)} and ${D(nd)} ÷ ${D(nv)} describe the same sharing.</p>`,
      feedback: {
        correct: `Correct. ${D(nd)} ÷ ${D(nv)} = ${D(p.q)}, and ${D(p.q)} × ${D(p.d)} = ${D(p.dividend)}.`,
        wrong(ans, d) {
          if (d.wrong.includes(1)) return `Multiply the divisor ${D(p.d)} by ${p.scale} to make it a whole number.`;
          if (d.wrong.includes(0)) return `You must multiply the dividend by the same ${p.scale}: ${D(p.dividend)} × ${p.scale}.`;
          return `Your rewrite is right. Now divide ${D(nd)} by ${D(nv)}.`;
        },
      },
    };
  });

  // ---------- Decimal ÷ decimal (num) ----------
  G.define('s7_divDecimal', (r, o) => {
    const hard = !!o.hard,
      p = decDiv(r, hard);
    const ctx = r.pick([
      { text: (a, b) => `A keeper has ${a} liters of oil. Each lamp burns ${b} liters a night. How many nights of oil is that?`, unit: 'nights' },
      { text: (a, b) => `A ${a}-meter rope is cut into pieces that are each ${b} meters long. How many pieces are there?`, unit: 'pieces' },
      { text: (a, b) => `The keeper walks ${a} kilometers along the shore in laps of ${b} kilometers. How many laps is that?`, unit: 'laps' },
      { text: (a, b) => `A ${a}-kilogram sack of salt is packed into bags that hold ${b} kilograms each. How many bags are filled?`, unit: 'bags' },
    ]);
    const nd = round(p.dividend * p.scale, 2),
      nv = round(p.d * p.scale, 2);
    return {
      type: 'num',
      skill: 'divide-decimals',
      lesson: '2-7',
      title: hard ? 'Divide by a decimal (harder)' : 'Divide by a decimal',
      prompt: `<p>${ctx.text(hl(D(p.dividend)), hl(D(p.d)))}</p><p>Find ${hl(D(p.dividend) + ' ÷ ' + D(p.d))}.</p>`,
      unit: ctx.unit,
      answer: p.q,
      tolerance: 0.001,
      hints: [
        `First make the divisor a whole number: multiply both ${D(p.dividend)} and ${D(p.d)} by ${p.scale}.`,
        `That gives ${D(nd)} ÷ ${D(nv)}, the same quotient as the original problem.`,
        `Divide ${D(nd)} by ${D(nv)}. Check: the answer × ${D(p.d)} should equal ${D(p.dividend)}.`,
      ],
      solution: `<p>Multiply both numbers by ${p.scale}: ${D(p.dividend)} ÷ ${D(p.d)} = ${D(nd)} ÷ ${D(nv)} = <b>${D(p.q)}</b> ${ctx.unit}. Check: ${D(p.q)} × ${D(p.d)} = ${D(p.dividend)}. ${p.d < 1 ? 'The quotient is larger than the dividend because the divisor is less than 1: more than one group of ' + D(p.d) + ' fits in each whole.' : 'The quotient is smaller than the dividend because the divisor is greater than 1.'}</p>`,
      feedback: {
        correct: `Correct. ${D(p.q)} × ${D(p.d)} = ${D(p.dividend)}.`,
        wrong(ans, d) {
          if (d.value != null && (Math.abs(d.value - p.q / p.scale) < 0.001 || Math.abs(d.value - p.q * p.scale) < 0.001)) return `You moved the decimal point in only one of the numbers. Multiply both ${D(p.dividend)} and ${D(p.d)} by ${p.scale}.`;
          if (d.value != null && Math.abs(d.value - p.dividend * p.d) < 0.001) return 'You multiplied. The question asks how many groups fit, which is division.';
          return `Rewrite as ${D(nd)} ÷ ${D(nv)}, then divide. Check by multiplying your answer by ${D(p.d)}.`;
        },
      },
    };
  });

  // ---------- Estimate and reason about size (tf) ----------
  G.define('s7_estimateTF', (r) => {
    const variant = r.pick(['lessThanOne', 'wholeDivisor', 'half']);
    let p, claim, q, reason;
    if (variant === 'lessThanOne') {
      p = decDiv(r, false);
      while (p.d >= 1) p = decDiv(r, false);
      q = p.q;
      claim = `${D(p.dividend)} ÷ ${D(p.d)} is greater than ${D(p.dividend)}.`;
      reason = `Dividing by a number less than 1 gives a quotient larger than the dividend. ${D(p.dividend)} ÷ ${D(p.d)} = ${D(q)}, which is more than ${D(p.dividend)}.`;
    } else if (variant === 'wholeDivisor') {
      p = wholeDiv(r, false);
      q = p.q;
      claim = `${D(p.dividend)} ÷ ${p.d} is greater than ${D(p.dividend)}.`;
      reason = `Dividing by a whole number greater than 1 makes the result smaller. ${D(p.dividend)} ÷ ${p.d} = ${D(q)}, which is less than ${D(p.dividend)}.`;
    } else {
      const a = round(r.int(2, 12) + r.pick([0, 0.2, 0.4, 0.5, 0.6, 0.8]), 1);
      p = { dividend: a, d: 0.5 };
      q = round(a / 0.5, 2);
      claim = `${D(a)} ÷ 0.5 is the same as ${D(a)} × 2.`;
      reason = `Dividing by 0.5 asks how many halves fit in ${D(a)}. There are 2 halves in each whole, so the answer is ${D(a)} × 2 = ${D(q)}.`;
    }
    const answer = variant !== 'wholeDivisor';
    const reasons = r.shuffle([
      { html: reason, correct: true },
      { html: answer ? 'Division always makes a number smaller.' : 'Division always makes a number larger.' },
      { html: variant === 'half' ? 'Dividing by 0.5 is the same as dividing by 2.' : 'The decimal point does not matter when you divide.' },
    ]);
    return {
      type: 'tf',
      skill: 'divide-decimals',
      lesson: '2-7',
      title: 'Does the answer make sense?',
      prompt: `<p>True or false: <b>${claim}</b></p><p class="muted">Think about the size of the divisor before you compute.</p>`,
      answer,
      reasons,
      hints: [
        'Ask: is the divisor less than 1, equal to 1, or greater than 1? That tells you whether the quotient is bigger or smaller than the dividend.',
        variant === 'wholeDivisor' ? `${p.d} is greater than 1, so each of the ${p.d} shares is smaller than the whole.` : `${D(p.d)} is less than 1, so more than one group of ${D(p.d)} fits inside each whole.`,
        `Compute to check: ${D(p.dividend)} ÷ ${D(p.d)} = ${D(q)}.`,
      ],
      solution: `<p><b>${answer ? 'True' : 'False'}.</b> ${reason}</p>`,
      feedback: {
        correct: 'Correct. The size of the divisor tells you whether the quotient grows or shrinks.',
        wrong(ans, d) {
          if (!d.valueOk) return variant === 'wholeDivisor' ? `Sharing ${D(p.dividend)} among ${p.d} gives each share less than ${D(p.dividend)}. Compute: ${D(q)}.` : `How many groups of ${D(p.d)} fit in 1? More than one. So the quotient is bigger than the dividend.`;
          return 'Your true/false choice is right. Pick the reason that explains what dividing by this divisor does.';
        },
      },
    };
  });

  // ---------- Place-value pattern (table) ----------
  G.define('s7_tablePattern', (r) => {
    const d = r.pick([3, 4, 6, 7, 8, 9]),
      q = r.int(3, 9),
      big = q * d;
    const rows = [
      ['Expression', 'Quotient'],
      [`${big} ÷ ${d}`, String(q)],
      [`${D(big / 10)} ÷ ${d}`, '__IN:a__'],
      [`${D(big / 100)} ÷ ${d}`, '__IN:b__'],
      [`${D(big / 10)} ÷ ${D(d / 10)}`, '__IN:c__'],
    ];
    return {
      type: 'table',
      skill: 'divide-decimals',
      lesson: '2-7',
      title: 'Follow the pattern',
      prompt: `<p>The first row, ${hl(big + ' ÷ ' + d + ' = ' + q)}, is done. Use the pattern to complete the table.</p>`,
      rows,
      header: true,
      inputs: [
        { id: 'a', answer: round(q / 10, 3), tolerance: 0.0001 },
        { id: 'b', answer: round(q / 100, 3), tolerance: 0.0001 },
        { id: 'c', answer: q, tolerance: 0.001 },
      ],
      hints: [
        `${big} ÷ ${d} = ${q}. When the dividend is divided by 10 and the divisor stays the same, the quotient is also divided by 10.`,
        `${D(big / 10)} is ${big} ÷ 10, so its quotient is ${q} ÷ 10. ${D(big / 100)} is ${big} ÷ 100, so its quotient is ${q} ÷ 100.`,
        `In the last row, both numbers were divided by 10. Multiplying or dividing both numbers by the same amount keeps the quotient the same as ${big} ÷ ${d}.`,
      ],
      solution: `<p>${D(big / 10)} ÷ ${d} = <b>${D(q / 10)}</b> and ${D(big / 100)} ÷ ${d} = <b>${D(q / 100)}</b>: a smaller dividend with the same divisor gives a smaller quotient, by the same factor of 10. ${D(big / 10)} ÷ ${D(d / 10)} = <b>${q}</b>: when both numbers shrink by the same factor, the quotient does not change. That is why we can rewrite a decimal divisor as a whole number.</p>`,
      feedback: {
        correct: 'Correct. Shrink only the dividend and the quotient shrinks; shrink both and the quotient stays the same.',
        wrong(ans, d2) {
          if (d2.wrong.includes('c')) return `In the last row both numbers were divided by 10, so the quotient equals ${big} ÷ ${d}.`;
          if (d2.wrong.includes('b')) return `${D(big / 100)} is one hundredth of ${big}. Its quotient is one hundredth of ${q}.`;
          return `${D(big / 10)} is one tenth of ${big}. Its quotient is one tenth of ${q}.`;
        },
      },
    };
  });
})(typeof window !== 'undefined' ? window : globalThis);

/* js/units/u2/gen-mean.js */
/* Zone 8 — Balance Reef. Lesson 2-8 Describe Data Using the Mean (Finding the Mean · Reaching a Target Mean).
   Data sets are built with RX.STATS.withMean so every mean is a whole number by construction. */
(function (root) {
  'use strict';
  const pl = (w) => (/z$/.test(w) ? w + 'zes' : w + 's');
  const RX = root.RX;
  const { G, V, shuffleOptions, NAMES, fmt } = RX;
  const S = RX.STATS;
  const hl = V.hl;

  const CTX = [
    { what: 'sea stars counted in each tide pool', unit: 'sea stars', each: 'pool', m: [6, 14], label: 'Sea stars per pool' },
    { what: 'minutes each snorkel trip lasted', unit: 'minutes', each: 'trip', m: [18, 40], label: 'Minutes per trip' },
    { what: 'fish tagged each day', unit: 'fish', each: 'day', m: [8, 20], label: 'Fish tagged per day' },
    { what: 'coral samples collected per dive', unit: 'samples', each: 'dive', m: [5, 12], label: 'Samples per dive' },
    { what: 'gallons of water tested each morning', unit: 'gallons', each: 'morning', m: [10, 30], label: 'Gallons tested' },
  ];
  const SCORE = [
    { what: 'reef quiz scores', unit: 'points', item: 'quiz', T: [80, 92], spread: 10 },
    { what: 'points scored in beach volleyball games', unit: 'points', item: 'game', T: [15, 25], spread: 6 },
    { what: 'laps swum each practice', unit: 'laps', item: 'practice', T: [12, 24], spread: 5 },
    { what: 'minutes of kayak practice each day', unit: 'minutes', item: 'day', T: [30, 50], spread: 12 },
  ];
  const sumText = (vals) => `${vals.join(' + ')} = ${S.sum(vals)}`;

  // ---------- Find the mean (num) ----------
  G.define('s8_mean', (r) => {
    const c = r.pick(CTX),
      n = r.pick([4, 5, 6]),
      m = r.int(c.m[0], c.m[1]);
    const vals = S.withMean(r, n, m, Math.max(3, Math.floor(m / 2)));
    const total = S.sum(vals);
    return {
      type: 'num',
      skill: 'mean',
      lesson: '2-8',
      title: 'Find the mean',
      prompt: `<p>A surveyor recorded ${c.what} on ${n} visits: ${hl(S.list(vals))}.</p><p>What is the <b>mean</b>?</p>`,
      unit: c.unit,
      answer: m,
      hints: [
        'The mean is the fair share: add all the values, then divide by how many values there are.',
        `Sum: ${sumText(vals)}. There are ${n} values.`,
        `Mean = ${total} ÷ ${n}.`,
      ],
      solution: `<p>Add: ${sumText(vals)}. Divide by the number of values: ${total} ÷ ${n} = <b>${m}</b> ${c.unit}. If the ${total} ${c.unit} were shared equally among the ${n} visits, each ${c.each} would get ${m}.</p>`,
      feedback: {
        correct: `Correct. ${total} shared equally among ${n} is ${m} each.`,
        wrong(ans, d) {
          if (d.value === total) return `${total} is the sum. Divide it by ${n}, the number of values, to find the mean.`;
          if (d.value === S.median(vals) && S.median(vals) !== m) return 'That is the median (the middle value). The mean is the sum divided by the count.';
          if (d.value != null && (Math.abs(d.value - total / (n - 1)) < 0.01 || Math.abs(d.value - total / (n + 1)) < 0.01)) return `Count the values again. There are ${n} of them, so divide ${total} by ${n}.`;
          return `Add the ${n} values and divide by ${n}.`;
        },
      },
    };
  });

  // ---------- Mean step by step (blanks) ----------
  G.define('s8_meanBlanks', (r) => {
    const c = r.pick(CTX),
      n = r.pick([4, 5, 6]),
      m = r.int(c.m[0], c.m[1]);
    const vals = S.withMean(r, n, m, Math.max(3, Math.floor(m / 2)));
    const total = S.sum(vals);
    return {
      type: 'blanks',
      skill: 'mean',
      lesson: '2-8',
      title: 'Show the steps',
      prompt: `<p>Data (${c.what}): ${hl(S.list(vals))}.</p><p>Complete the steps to find the mean.</p>`,
      fields: [
        { label: 'sum', answer: total, width: 'sm' },
        { label: 'number of values', answer: n, width: 'xs' },
        { label: 'mean', answer: m, width: 'sm' },
      ],
      template: ['The sum of the values is {0}.', 'There are {1} values.', 'Mean = sum ÷ count = {2}.'],
      hints: ['Add every value to find the sum. Count how many values there are.', `Sum: ${sumText(vals)}. Count: ${n}.`, `Mean = ${total} ÷ ${n}.`],
      solution: `<p>Sum: ${sumText(vals)}. Count: <b>${n}</b>. Mean = <b>${total}</b> ÷ ${n} = <b>${m}</b> ${c.unit}. The mean balances the data: the values above ${m} are above it by exactly as much as the values below ${m} are below it.</p>`,
      feedback: {
        correct: `Correct. ${total} ÷ ${n} = ${m}.`,
        wrong(ans, d) {
          if (d.wrong.includes(0)) return `Add again carefully: ${vals.join(' + ')}.`;
          if (d.wrong.includes(1)) return `Count the values in the list: ${S.list(vals)}.`;
          return `Divide the sum ${total} by the count ${n}.`;
        },
      },
    };
  });

  // ---------- Mean from a dot plot (num) ----------
  G.define('s8_meanDot', (r) => {
    const c = r.pick([
      { label: 'Sea stars per pool', unit: 'sea stars', lo: 2, hi: 12 },
      { label: 'Fish tagged per day', unit: 'fish', lo: 3, hi: 13 },
      { label: 'Samples per dive', unit: 'samples', lo: 1, hi: 11 },
    ]);
    const n = r.pick([6, 7, 8]),
      m = r.int(c.lo + 3, c.hi - 3);
    const vals = S.withMean(r, n, m, 3);
    const total = S.sum(vals);
    const cnt = S.counts(vals),
      keys = Object.keys(cnt).map(Number);
    const mode = keys.reduce((best, k) => (cnt[k] > cnt[best] ? k : best), keys[0]);
    return {
      type: 'num',
      skill: 'mean',
      lesson: '2-8',
      title: 'Mean from a dot plot',
      prompt: `<p>The dot plot shows ${c.label.toLowerCase()} for ${n} surveys. Each dot is one survey.</p>${V.dotPlot({ values: vals, min: c.lo, max: c.hi, label: c.label, aria: 'Dot plot: ' + S.list(S.sorted(vals)) })}<p>What is the <b>mean</b>?</p>`,
      unit: c.unit,
      answer: m,
      hints: [
        'Read each dot as a data value. Then add all the values and divide by the number of dots.',
        `The values are ${S.list(S.sorted(vals))}. Sum: ${total}.`,
        `There are ${n} dots. Mean = ${total} ÷ ${n}.`,
      ],
      solution: `<p>Values from the dot plot: ${S.list(S.sorted(vals))}. Sum = ${total}. Mean = ${total} ÷ ${n} = <b>${m}</b> ${c.unit}. On the dot plot, ${m} is the balance point: the dots to the right of it balance the dots to the left.</p>`,
      feedback: {
        correct: `Correct. The dots balance at ${m}.`,
        wrong(ans, d) {
          if (d.value === mode && mode !== m) return 'That is the value with the most dots (the peak). The mean adds every value and divides by the count.';
          if (d.value === S.median(vals) && S.median(vals) !== m) return 'That is the median, the middle dot. The mean is the sum of all values divided by the number of dots.';
          if (d.value === total) return `${total} is the sum of the values. Divide by the ${n} dots.`;
          return `Add the values of all ${n} dots, then divide by ${n}.`;
        },
      },
    };
  });

  // ---------- Error: divided by the wrong count (error) ----------
  G.define('s8_errorCount', (r) => {
    const name = r.pick(NAMES),
      c = r.pick(CTX),
      n = r.pick([4, 5, 6]),
      m = r.int(c.m[0], c.m[1]);
    const vals = S.withMean(r, n, m, Math.max(3, Math.floor(m / 2)));
    const total = S.sum(vals);
    const variant = r.pick(['count', 'noDivide']);
    const wrongVal = variant === 'count' ? RX.round(total / (n - 1), 2) : total;
    const work = variant === 'count' ? `"${sumText(vals)}. ${total} ÷ ${n - 1} = <b>${fmt(wrongVal)}</b>. The mean is ${fmt(wrongVal)}."` : `"${sumText(vals)}. The mean is <b>${total}</b>."`;
    const opts =
      variant === 'count'
        ? [
            { html: `${name} divided by ${n - 1}, but there are ${n} values. The sum must be divided by the number of values.`, ok: true },
            { html: `${name} added the values wrong.`, why: `The sum ${total} is correct. The mistake is in the division step.` },
            { html: `${name} should have divided by 2.`, why: 'Dividing by 2 finds the halfway point between two numbers. The mean divides by the total number of values.' },
            { html: 'There is no mistake.', why: `Count the values: there are ${n}, not ${n - 1}. The divisor is wrong.` },
          ]
        : [
            { html: `${name} found the sum but forgot to divide by ${n}, the number of values.`, ok: true },
            { html: `${name} should have found the middle value instead.`, why: 'The middle value is the median. The question asks for the mean, which is the sum divided by the count.' },
            { html: `${name} added the values wrong.`, why: `The sum ${total} is correct. The problem is that the sum alone is not the mean.` },
            { html: 'There is no mistake.', why: `${total} is the total, bigger than every value. A mean must sit between the smallest and largest values.` },
          ];
    const sh = shuffleOptions(r, opts, 0);
    return {
      type: 'error',
      skill: 'mean',
      lesson: '2-8',
      title: 'Find the mistake',
      prompt: `<p>${name} is finding the mean of ${c.what}: ${hl(S.list(vals))}.</p><p>What mistake did ${name} make?</p>`,
      work,
      options: sh.options,
      answer: sh.answer,
      fix: { label: 'What is the correct mean?', answer: m },
      hints: [
        'The mean is the sum of the values divided by how many values there are. Check both steps.',
        `The sum ${total} is right. How many values are in the list? Count them: ${n}.`,
        `Mean = ${total} ÷ ${n}.`,
      ],
      solution: `<p>${variant === 'count' ? `${name} divided by ${n - 1}, but the list has ${n} values.` : `${name} stopped after adding. A sum is not a mean.`} Mean = ${total} ÷ ${n} = <b>${m}</b>. A mean always lands between the smallest and largest values, which is a quick way to check.</p>`,
      feedback: {
        correct: 'Correct. Sum, then divide by the number of values.',
        wrong(ans, d) {
          if (!d.mistakeOk) return `Check each step: is the sum right? Is the divisor the number of values (${n})?`;
          return `You found the mistake. Now divide ${total} by ${n}.`;
        },
      },
    };
  });

  // ---------- What the mean tells you (mc) ----------
  G.define('s8_meanMeaning', (r) => {
    const c = r.pick(CTX),
      n = r.pick([5, 6, 8]),
      m = r.int(c.m[0], c.m[1]),
      name = r.pick(NAMES);
    const total = m * n;
    const opts = [
      { html: `If the ${total} ${c.unit} were shared equally among the ${n} ${c.each}s, each would get ${m}.`, ok: true },
      { html: `Most of the ${c.each}s had exactly ${m} ${c.unit}.`, why: 'The mean does not say how often a value appears. Some values may be above the mean and some below it, with none exactly at it.' },
      { html: `Half of the ${c.each}s had ${m} ${c.unit} or less.`, why: 'That describes the median, the middle value. The mean is the fair share, which can sit above or below the middle.' },
      { html: `The total for all ${n} ${c.each}s was ${m} ${c.unit}.`, why: `The total is mean × count = ${m} × ${n} = ${total}. The mean is each ${c.each}'s fair share of that total.` },
    ];
    const sh = shuffleOptions(r, opts, 0);
    return {
      type: 'mc',
      skill: 'mean',
      lesson: '2-8',
      title: 'What does the mean tell you?',
      prompt: `<p>${name} found that the mean of ${c.what} over ${n} ${c.each}s is ${hl(m + ' ' + c.unit)}.</p><p>What does this mean tell you?</p>`,
      options: sh.options,
      answer: sh.answer,
      hints: [
        'The mean is found by adding all the values and dividing by the count. Think of it as sharing the total equally.',
        `The total must have been ${m} × ${n} = ${total} ${c.unit}.`,
        `Sharing ${total} equally among ${n} ${c.each}s gives ${m} each. That is the fair share.`,
      ],
      solution: `<p>The mean is the fair-share amount. The ${n} ${c.each}s together had ${m} × ${n} = ${total} ${c.unit}. <b>If that total were shared equally, each ${c.each} would get ${m}.</b> The mean does not tell you the most common value or the middle value.</p>`,
      feedback: { correct: 'Correct. The mean is the amount each would get if the total were shared equally.' },
    };
  });

  // ---------- Score needed for a target mean (num) ----------
  G.define('s8_targetMean', (r, o) => {
    const hard = !!o.hard,
      c = r.pick(SCORE),
      name = r.pick(NAMES),
      k = hard ? r.pick([5, 6]) : r.pick([3, 4]),
      T = r.int(c.T[0], c.T[1]);
    let have, need;
    for (let t = 0; t < 80; t++) {
      have = S.withMean(r, k, T + r.pick([-3, -2, -1, 1, 2]), c.spread).map((v) => Math.max(1, v));
      need = T * (k + 1) - S.sum(have);
      if (need > 0 && need !== T && need <= T + c.spread * 2) break;
    }
    const n = k + 1,
      total = T * n,
      sum = S.sum(have);
    return {
      type: 'num',
      skill: 'target-mean',
      lesson: '2-8',
      title: hard ? 'Reach the target mean (harder)' : 'Reach the target mean',
      prompt: `<p>${name}'s ${c.what} so far: ${hl(S.list(have))}.</p><p>${name} wants a mean of exactly ${hl(T + ' ' + c.unit)} after the next ${c.item}. What must ${name} score on that ${c.item}?</p>`,
      unit: c.unit,
      answer: need,
      hints: [
        'Work backward. A mean of ' + T + ' over ' + n + ' values means the total must be ' + T + ' × ' + n + '.',
        `Total needed: ${T} × ${n} = ${total}. Total so far: ${sumText(have)}.`,
        `The next score must make up the difference: ${total} − ${sum}.`,
      ],
      solution: `<p>For ${n} values to have a mean of ${T}, their total must be ${T} × ${n} = ${total}. So far the total is ${sum}. The next ${c.item} must be ${total} − ${sum} = <b>${need}</b> ${c.unit}. Check: (${sum} + ${need}) ÷ ${n} = ${T}.</p>`,
      feedback: {
        correct: `Correct. ${sum} + ${need} = ${total}, and ${total} ÷ ${n} = ${T}.`,
        wrong(ans, d) {
          if (d.value === T) return `Scoring ${T} does not move the mean to ${T} unless the mean is already ${T}. Find the total needed (${T} × ${n}) and compare it with the total so far.`;
          if (d.value === total) return `${total} is the total needed for all ${n} values. Subtract the ${sum} already earned.`;
          if (d.value != null && Math.abs(d.value - Math.abs(T - sum / k)) < 0.01) return 'That is the gap between the target and the current mean, not the next score. Work with totals: target × count − sum so far.';
          return `Target total: ${T} × ${n} = ${total}. Subtract the current total ${sum}.`;
        },
      },
    };
  });

  // ---------- Target mean table (table) ----------
  G.define('s8_targetTable', (r) => {
    const c = r.pick(SCORE),
      name = r.pick(NAMES),
      k = 4,
      T = r.int(c.T[0], c.T[1]);
    let have, need;
    for (let t = 0; t < 80; t++) {
      have = S.withMean(r, k, T + r.pick([-2, -1, 1, 2]), c.spread).map((v) => Math.max(1, v));
      need = T * (k + 1) - S.sum(have);
      if (need > 0 && need !== T && need <= T + c.spread * 2) break;
    }
    const n = k + 1,
      total = T * n,
      sum = S.sum(have);
    const cap = c.item.charAt(0).toUpperCase() + c.item.slice(1);
    return {
      type: 'table',
      skill: 'target-mean',
      lesson: '2-8',
      title: 'Plan the next score',
      prompt: `<p>${name} wants a mean of ${hl(T + ' ' + c.unit)} across ${n} ${pl(c.item)}. The first ${k} are done. Complete the table.</p>`,
      rows: [
        [cap, c.unit.charAt(0).toUpperCase() + c.unit.slice(1)],
        ...have.map((v, i) => [`${cap} ${i + 1}`, String(v)]),
        [`${cap} ${n}`, '__IN:need__'],
        [`Total for mean ${T}`, '__IN:total__'],
      ],
      header: true,
      inputs: [
        { id: 'total', answer: total },
        { id: 'need', answer: need },
      ],
      hints: [
        `Start with the total. A mean of ${T} over ${n} ${pl(c.item)} needs a total of ${T} × ${n}.`,
        `Total needed: ${total}. Total so far: ${sumText(have)}.`,
        `${cap} ${n} must be ${total} − ${sum}.`,
      ],
      solution: `<p>Total needed: ${T} × ${n} = <b>${total}</b>. So far: ${sum}. ${cap} ${n}: ${total} − ${sum} = <b>${need}</b> ${c.unit}. Check: (${sum} + ${need}) ÷ ${n} = ${T}.</p>`,
      feedback: {
        correct: `Correct. The total ${total} spread over ${n} ${pl(c.item)} gives a mean of ${T}.`,
        wrong(ans, d) {
          if (d.wrong.includes('total')) return `The total must be mean × count: ${T} × ${n}.`;
          return `Subtract the total so far (${sum}) from the total needed (${total}).`;
        },
      },
    };
  });

  // ---------- Who planned the target correctly (who) ----------
  G.define('s8_targetWho', (r) => {
    const c = r.pick(SCORE),
      [a, b, z] = r.pickN(NAMES, 3),
      k = r.pick([3, 4]),
      T = r.int(c.T[0], c.T[1]);
    let have, need;
    for (let t = 0; t < 80; t++) {
      have = S.withMean(r, k, T - r.pick([1, 2, 3]), c.spread).map((v) => Math.max(1, v));
      need = T * (k + 1) - S.sum(have);
      if (need > 0 && need !== T && need <= T + c.spread * 2) break;
    }
    const n = k + 1,
      total = T * n,
      sum = S.sum(have),
      curMean = RX.round(sum / k, 1);
    const opts = [
      { html: `<b>${a}</b>: "A mean of ${T} over ${n} ${pl(c.item)} needs a total of ${total}. So far I have ${sum}, so I need ${need}."`, ok: true },
      { html: `<b>${b}</b>: "I just need to score ${T} on the next ${c.item}, because the mean should be ${T}."`, why: `Scoring ${T} pulls the mean toward ${T} but does not reach it, because the first ${k} scores are below ${T}. The total matters: ${sum} + ${T} = ${sum + T}, and ${sum + T} ÷ ${n} is less than ${T}.` },
    ];
    if (r.chance(0.6)) opts.push({ html: `<b>${z}</b>: "My mean is about ${fmt(curMean)} now, so I need ${fmt(RX.round(T - curMean, 1))} more points."`, why: `The gap between two means is not a score. Work with totals: ${total} needed minus ${sum} earned.` });
    const sh = shuffleOptions(r, opts, 0);
    return {
      type: 'who',
      skill: 'target-mean',
      lesson: '2-8',
      title: 'Who has the right plan?',
      prompt: `<p>Three students have the same ${c.what} so far: ${hl(S.list(have))}. Each wants a mean of ${hl(T)} after the next ${c.item}.</p><p>Who is correct?</p>`,
      options: sh.options,
      answer: sh.answer,
      layout: 'cards',
      hints: ['Think in totals. The mean times the number of values gives the total needed.', `Total needed: ${T} × ${n} = ${total}. Total so far: ${sum}.`, `Next score needed: ${total} − ${sum}. Who says that?`],
      solution: `<p><b>${a}</b> is correct. Mean ${T} over ${n} ${pl(c.item)} needs a total of ${total}. With ${sum} so far, the next score must be ${total} − ${sum} = <b>${need}</b>. Scoring only ${T} would leave the mean below ${T}, because the earlier scores are below the target.</p>`,
      feedback: { correct: 'Correct. Target mean × count gives the total you need; subtract what you already have.' },
    };
  });
})(typeof window !== 'undefined' ? window : globalThis);

/* js/units/u2/gen-mad.js */
/* Zone 9 — The Estuary. Lesson 2-9 Describe Data by Mean Absolute Deviation (Finding the MAD · Comparing Sets with MAD).
   Sets come from RX.STATS.withMeanCleanMad: whole-number mean, MAD with at most one decimal place. */
(function (root) {
  'use strict';
  const RX = root.RX;
  const { G, V, shuffleOptions, NAMES, fmt } = RX;
  const S = RX.STATS;
  const hl = V.hl;

  const CTX = [
    { what: 'salt readings in grams per liter', unit: 'g/L', m: [12, 30] },
    { what: 'minutes between passing boats', unit: 'minutes', m: [8, 20] },
    { what: 'ducks counted at the bend', unit: 'ducks', m: [10, 24] },
    { what: 'water depth in feet at the marker', unit: 'ft', m: [6, 15] },
    { what: 'river temperature in degrees Fahrenheit', unit: '°F', m: [58, 72] },
  ];
  const SITES = ['Upper Bend', 'Lower Bend', 'Oyster Bar', 'Mouth', 'Grass Flats', 'Channel', 'Inlet', 'Boat Ramp'];
  const devs = (vals, m) => vals.map((v) => Math.abs(v - m));
  const devText = (vals, m) => vals.map((v) => `|${v} − ${m}| = ${Math.abs(v - m)}`).join(', ');
  const madOf = (vals) => RX.round(S.mad(vals), 2);

  // ---------- Distance from the mean for each value (table) ----------
  G.define('s9_deviationTable', (r) => {
    const c = r.pick(CTX),
      n = 5,
      m = r.int(c.m[0], c.m[1]);
    const vals = S.withMeanCleanMad(r, n, m, 6);
    const dv = devs(vals, m);
    return {
      type: 'table',
      skill: 'mad',
      lesson: '2-9',
      title: 'Distance from the mean',
      prompt: `<p>Data (${c.what}): ${hl(S.list(vals))}. The mean is ${hl(m)}.</p><p>Complete the table: how far is each value from the mean? Distances are always positive.</p>`,
      rows: [['Value', 'Distance from mean ' + m], ...vals.map((v, i) => [String(v), `__IN:d${i}__`])],
      header: true,
      inputs: vals.map((v, i) => ({ id: 'd' + i, answer: dv[i] })),
      hints: [
        'Distance from the mean is the difference between the value and the mean, written as a positive number.',
        `For example, ${vals[0]} is ${dv[0]} away from ${m}, whether it is above or below.`,
        `${devText(vals, m)}.`,
      ],
      solution: `<p>${devText(vals, m)}. Every distance is positive because it measures how far, not which direction. The sum of these distances is ${S.sum(dv)}, and dividing by ${n} would give the MAD, ${fmt(madOf(vals))}.</p>`,
      feedback: {
        correct: 'Correct. Distances ignore direction, so a value below the mean counts the same as one above it.',
        wrong(ans, d) {
          const i = Number(String(d.wrong[0]).slice(1));
          const v = vals[i];
          const typed = RX.parseNum(ans[d.wrong[0]]);
          if (typed != null && typed === v - m && v < m) return `${v} is below the mean, so ${v} − ${m} is negative. Distance is always positive: write ${m} − ${v}.`;
          return `For ${v}: subtract the smaller number from the larger, ${Math.max(v, m)} − ${Math.min(v, m)}.`;
        },
      },
    };
  });

  // ---------- Find the MAD (num) ----------
  G.define('s9_mad', (r, o) => {
    const hard = !!o.hard,
      c = r.pick(CTX),
      n = hard ? r.pick([6, 8]) : r.pick([4, 5]),
      m = r.int(c.m[0], c.m[1]);
    const vals = S.withMeanCleanMad(r, n, m, hard ? 8 : 5);
    const dv = devs(vals, m),
      sd = S.sum(dv),
      mad = madOf(vals);
    return {
      type: 'num',
      skill: 'mad',
      lesson: '2-9',
      title: hard ? 'Find the MAD (harder)' : 'Find the MAD',
      prompt: `<p>Readings of ${c.what}: ${hl(S.list(vals))}.${hard ? '' : ` The mean is ${hl(m)}.`}</p><p>Find the <b>mean absolute deviation (MAD)</b>.${Number.isInteger(mad) ? '' : ' Your answer may be a decimal.'}</p>`,
      unit: c.unit,
      answer: mad,
      tolerance: 0.01,
      hints: [
        `${hard ? 'First find the mean: sum ÷ count. ' : ''}Then find each value's distance from the mean (always positive), add the distances, and divide by the number of values.`,
        `Mean = ${m}. Distances: ${devText(vals, m)}.`,
        `Sum of distances: ${dv.join(' + ')} = ${sd}. MAD = ${sd} ÷ ${n}.`,
      ],
      solution: `<p>${hard ? `Mean: ${S.sum(vals)} ÷ ${n} = ${m}. ` : ''}Distances from ${m}: ${dv.join(', ')}. Sum: ${sd}. MAD = ${sd} ÷ ${n} = <b>${fmt(mad)}</b> ${c.unit}. On average, each reading is ${fmt(mad)} ${c.unit} away from the mean.</p>`,
      feedback: {
        correct: `Correct. The readings are, on average, ${fmt(mad)} ${c.unit} from the mean.`,
        wrong(ans, d) {
          if (d.value === sd) return `${sd} is the sum of the distances. Divide by ${n} to find the average distance.`;
          if (d.value === m) return `${m} is the mean. The MAD measures how far the values are from the mean, on average.`;
          if (d.value === S.range(vals)) return 'That is the range. The MAD averages every value’s distance from the mean.';
          if (d.value === 0) return 'Did you add positive and negative differences? Distances are always positive, so they cannot cancel out.';
          return `Find each distance from ${m}, add them (${sd}), and divide by ${n}.`;
        },
      },
    };
  });

  // ---------- MAD step by step (blanks) ----------
  G.define('s9_madBlanks', (r) => {
    const c = r.pick(CTX),
      n = r.pick([4, 5, 6]),
      m = r.int(c.m[0], c.m[1]);
    const vals = S.withMeanCleanMad(r, n, m, 5);
    const dv = devs(vals, m),
      sd = S.sum(dv),
      mad = madOf(vals);
    return {
      type: 'blanks',
      skill: 'mad',
      lesson: '2-9',
      title: 'Build the MAD',
      prompt: `<p>Data (${c.what}): ${hl(S.list(vals))}.</p><p>Complete the steps to find the MAD.${Number.isInteger(mad) ? '' : ' The MAD may be a decimal.'}</p>`,
      fields: [
        { label: 'mean', answer: m, width: 'sm' },
        { label: 'sum of distances', answer: sd, width: 'sm' },
        { label: 'MAD', answer: mad, width: 'sm', tolerance: 0.01 },
      ],
      template: ['Step 1: the mean is {0}.', 'Step 2: the distances from the mean add up to {1}.', `Step 3: divide by ${n} values. MAD = {2}.`],
      hints: [
        `Mean = sum ÷ count. Sum: ${vals.join(' + ')} = ${S.sum(vals)}.`,
        `Mean = ${m}. Now find each distance: ${devText(vals, m)}.`,
        `Sum of distances: ${sd}. MAD = ${sd} ÷ ${n}.`,
      ],
      solution: `<p>Mean: ${S.sum(vals)} ÷ ${n} = <b>${m}</b>. Distances from the mean: ${dv.join(', ')}, which add to <b>${sd}</b>. MAD = ${sd} ÷ ${n} = <b>${fmt(mad)}</b> ${c.unit}. The MAD is the mean of the distances, so it uses the same divide-by-count step as the mean.</p>`,
      feedback: {
        correct: `Correct. Mean ${m}, distances totaling ${sd}, MAD ${fmt(mad)}.`,
        wrong(ans, d) {
          if (d.wrong.includes(0)) return `The mean is ${vals.join(' + ')} divided by ${n}.`;
          if (d.wrong.includes(1)) return `Find how far each value is from ${m} (always positive), then add those ${n} distances.`;
          return `Divide the sum of distances, ${sd}, by ${n}.`;
        },
      },
    };
  });

  // ---------- What the MAD tells you (mc) ----------
  G.define('s9_madMeaning', (r) => {
    const c = r.pick(CTX),
      n = r.pick([5, 6, 8]),
      m = r.int(c.m[0], c.m[1]),
      name = r.pick(NAMES);
    const vals = S.withMeanCleanMad(r, n, m, 5);
    const mad = madOf(vals);
    const opts = [
      { html: `On average, each reading is about ${fmt(mad)} ${c.unit} away from the mean of ${m}.`, ok: true },
      { html: `Every reading is exactly ${fmt(mad)} ${c.unit} away from the mean.`, why: 'The MAD is an average distance. Some readings are closer to the mean and some are farther.' },
      { html: `The typical reading is ${fmt(mad)} ${c.unit}.`, why: `The typical reading is described by the mean, ${m}. The MAD describes spread, not center.` },
      { html: `The readings range from ${m - mad > 0 ? fmt(RX.round(m - mad, 2)) : 0} to ${fmt(RX.round(m + mad, 2))}.`, why: 'The MAD is not a boundary. Readings can be more than one MAD from the mean; the MAD is the average distance.' },
    ];
    const sh = shuffleOptions(r, opts, 0);
    return {
      type: 'mc',
      skill: 'mad',
      lesson: '2-9',
      title: 'What does the MAD tell you?',
      prompt: `<p>${name} measured ${c.what} ${n} times. The mean is ${hl(m + ' ' + c.unit)} and the MAD is ${hl(fmt(mad) + ' ' + c.unit)}.</p><p>What does the MAD tell you?</p>`,
      options: sh.options,
      answer: sh.answer,
      hints: [
        'MAD stands for mean absolute deviation: the mean (average) of the absolute (positive) deviations (distances) from the mean.',
        'So the MAD is an average distance, not a boundary and not a typical value.',
        `A MAD of ${fmt(mad)} says the readings sit about ${fmt(mad)} ${c.unit} from ${m}, on average.`,
      ],
      solution: `<p>The MAD is the average distance of the values from the mean. <b>On average, each reading is about ${fmt(mad)} ${c.unit} from the mean of ${m}.</b> A smaller MAD would mean the readings stay closer to the mean; a larger MAD would mean they scatter farther.</p>`,
      feedback: { correct: 'Correct. The MAD is an average distance from the mean.' },
    };
  });

  // ---------- Compare two sets with MAD (mc) ----------
  G.define('s9_compareMAD', (r) => {
    const c = r.pick(CTX),
      [l1, l2] = r.pickN(SITES, 2),
      n = 5,
      m = r.int(c.m[0], c.m[1]);
    let d1, d2;
    for (let t = 0; t < 80; t++) {
      d1 = S.withMeanCleanMad(r, n, m, 2);
      d2 = S.withMeanCleanMad(r, n, m, 7);
      if (madOf(d2) - madOf(d1) >= 1) break;
    }
    const m1 = madOf(d1),
      m2 = madOf(d2);
    const tight = m1 < m2 ? l1 : l2,
      loose = tight === l1 ? l2 : l1;
    const tightM = Math.min(m1, m2),
      looseM = Math.max(m1, m2);
    const opts = [
      { html: `${tight}, because its MAD is ${fmt(tightM)}, smaller than ${fmt(looseM)}.`, ok: true },
      { html: `${loose}, because its MAD is ${fmt(looseM)}, larger than ${fmt(tightM)}.`, why: 'A larger MAD means the readings are farther from the mean on average: less consistent, not more.' },
      { html: 'Neither, because both sites have the same mean.', why: 'Two sets can share a mean and still differ in spread. The MAD measures that spread.' },
      { html: `${loose}, because it has the largest single reading.`, why: 'One large reading does not measure consistency. The MAD uses every value’s distance from the mean.' },
    ];
    const sh = shuffleOptions(r, opts, 0);
    return {
      type: 'mc',
      skill: 'mad',
      lesson: '2-9',
      title: 'Which site is steadier?',
      prompt: `<p>Two sites recorded ${c.what} on 5 days. Both have a mean of ${hl(m)}.</p><p><b>${l1}</b>: ${hl(S.list(d1))}<br><b>${l2}</b>: ${hl(S.list(d2))}</p><p>Which site's readings are <b>more consistent</b>? Use the MAD.</p>`,
      options: sh.options,
      answer: sh.answer,
      hints: [
        'The MAD is the average distance from the mean. A smaller MAD means the values stay closer to the mean.',
        `${l1} distances from ${m}: ${devs(d1, m).join(', ')} (sum ${S.sum(devs(d1, m))}). ${l2} distances: ${devs(d2, m).join(', ')} (sum ${S.sum(devs(d2, m))}).`,
        `${l1} MAD = ${S.sum(devs(d1, m))} ÷ 5 = ${fmt(m1)}. ${l2} MAD = ${S.sum(devs(d2, m))} ÷ 5 = ${fmt(m2)}. Smaller is steadier.`,
      ],
      solution: `<p>${l1}: MAD = ${fmt(m1)}. ${l2}: MAD = ${fmt(m2)}. <b>${tight}</b> has the smaller MAD, so its readings stay closer to the mean and are more consistent. Equal means say nothing about spread; the MAD does.</p>`,
      feedback: { correct: `Correct. A MAD of ${fmt(tightM)} is tighter than ${fmt(looseM)}.` },
    };
  });

  // ---------- Order sets by MAD (seq) ----------
  G.define('s9_seqMAD', (r) => {
    const c = r.pick(CTX),
      k = 3,
      sites = r.pickN(SITES, k),
      m = r.int(c.m[0], c.m[1]),
      asc = r.chance(0.5);
    let sets, mads;
    for (let t = 0; t < 120; t++) {
      sets = [S.withMeanCleanMad(r, 4, m, 1), S.withMeanCleanMad(r, 4, m, 4), S.withMeanCleanMad(r, 4, m, 8)];
      mads = sets.map(madOf);
      if (new Set(mads).size === k && Math.min(...mads.slice(1).map((x, i) => Math.abs(x - mads[i]))) >= 0.5) break;
    }
    const items = sets.map((d, i) => ({ html: `<b>${sites[i]}</b>: ${S.list(d)}`, rate: mads[i] }));
    const order = items.map((_, i) => i).sort((a, b) => (asc ? items[a].rate - items[b].rate : items[b].rate - items[a].rate));
    return {
      type: 'seq',
      skill: 'mad',
      lesson: '2-9',
      title: 'Order by MAD',
      prompt: `<p>Three sites each recorded ${c.what} on 4 days. Every site has a mean of ${hl(m)}.</p><p>Order the sites by <b>MAD</b>, from ${asc ? '<b>smallest</b> (top) to <b>largest</b> (bottom)' : '<b>largest</b> (top) to <b>smallest</b> (bottom)'}.</p>`,
      items,
      order,
      hints: [
        `All three means are ${m}, so find each value's distance from ${m}, add the four distances, and divide by 4.`,
        `Sums of distances: ${sets.map((d, i) => `${sites[i]} ${S.sum(devs(d, m))}`).join(', ')}.`,
        `MADs: ${sets.map((d, i) => `${sites[i]} ${fmt(mads[i])}`).join(', ')}. Put the ${asc ? 'smallest' : 'largest'} on top.`,
      ],
      solution: `<p>${sets.map((d, i) => `${sites[i]}: distances ${devs(d, m).join(', ')}, MAD = ${S.sum(devs(d, m))} ÷ 4 = <b>${fmt(mads[i])}</b>`).join('; ')}. Order (${asc ? 'smallest to largest' : 'largest to smallest'}): <b>${order.map((i) => sites[i]).join(', ')}</b>. The same mean can hide very different spreads.</p>`,
      feedback: {
        correct: 'Correct. Same mean, different MADs: the MAD sorts them by spread.',
        wrong() {
          return `Compute each MAD from the distances to ${m}, then check the direction: ${asc ? 'smallest' : 'largest'} on top.`;
        },
      },
    };
  });

  // ---------- MAD true/false (tf) ----------
  G.define('s9_madTF', (r) => {
    const c = r.pick(CTX),
      [l1, l2] = r.pickN(SITES, 2),
      m = r.int(c.m[0], c.m[1]);
    let d1, d2;
    for (let t = 0; t < 80; t++) {
      d1 = S.withMeanCleanMad(r, 5, m, 2);
      d2 = S.withMeanCleanMad(r, 5, m, 7);
      if (madOf(d2) - madOf(d1) >= 1) break;
    }
    const m1 = madOf(d1),
      m2 = madOf(d2);
    const variant = r.pick(['closer', 'zero', 'spread']);
    const claim = {
      closer: { text: `${l2} has the larger MAD, so its readings are closer to the mean.`, answer: false, reason: `A larger MAD means a larger average distance from the mean. ${l2}'s readings (MAD ${fmt(m2)}) are farther from ${m} than ${l1}'s (MAD ${fmt(m1)}).` },
      zero: { text: `If every reading at a site were exactly ${m}, the MAD would be 0.`, answer: true, reason: 'Every distance from the mean would be 0, so the average distance would be 0. A MAD of 0 means no variation at all.' },
      spread: { text: `${l2}'s readings are more spread out than ${l1}'s.`, answer: true, reason: `${l2}'s MAD is ${fmt(m2)} and ${l1}'s is ${fmt(m1)}. The larger MAD shows a larger average distance from the mean.` },
    }[variant];
    const reasons = r.shuffle([
      { html: claim.reason, correct: true },
      { html: 'The MAD is always equal to the mean.' },
      { html: variant === 'zero' ? 'The MAD can never be 0.' : 'A larger MAD always means a larger mean.' },
    ]);
    return {
      type: 'tf',
      skill: 'mad',
      lesson: '2-9',
      title: 'Reasoning about MAD',
      prompt: `<p>Two sites recorded ${c.what} on 5 days. Both have a mean of ${hl(m)}.</p><p><b>${l1}</b>: ${hl(S.list(d1))} (MAD ${fmt(m1)})<br><b>${l2}</b>: ${hl(S.list(d2))} (MAD ${fmt(m2)})</p><p>True or false: <b>${claim.text}</b></p>`,
      answer: claim.answer,
      reasons,
      hints: [
        'The MAD is the average distance of the values from the mean.',
        'A small MAD: values stay close to the mean. A large MAD: values scatter farther from it.',
        variant === 'zero' ? 'If every value equals the mean, every distance is 0.' : `Compare ${fmt(m1)} and ${fmt(m2)}. Which site’s values are farther from ${m}?`,
      ],
      solution: `<p><b>${claim.answer ? 'True' : 'False'}.</b> ${claim.reason}</p>`,
      feedback: {
        correct: 'Correct. Bigger MAD, bigger spread; MAD of 0, no spread.',
        wrong(ans, d) {
          if (!d.valueOk) return variant === 'zero' ? 'Picture five readings that are all the same. How far is each from the mean?' : `Look at the distances from ${m}: ${l2}'s are larger. Does a larger MAD mean closer or farther?`;
          return 'Your true/false choice is right. Pick the reason that talks about average distance from the mean.';
        },
      },
    };
  });

  // ---------- Error in a MAD computation (error) ----------
  G.define('s9_errorMAD', (r) => {
    const name = r.pick(NAMES),
      c = r.pick(CTX),
      n = r.pick([4, 5]),
      m = r.int(c.m[0], c.m[1]);
    const vals = S.withMeanCleanMad(r, n, m, 5);
    const dv = devs(vals, m),
      sd = S.sum(dv),
      mad = madOf(vals);
    const variant = r.pick(['signed', 'noDivide']);
    const signed = vals.map((v) => v - m);
    const work =
      variant === 'signed'
        ? `"Mean = ${m}. Differences: ${signed.map((x) => (x < 0 ? '−' + Math.abs(x) : String(x))).join(', ')}. They add to 0, so 0 ÷ ${n} = 0. The MAD is <b>0</b>."`
        : `"Mean = ${m}. Distances: ${dv.join(', ')}. ${dv.join(' + ')} = ${sd}. The MAD is <b>${sd}</b>."`;
    const opts =
      variant === 'signed'
        ? [
            { html: `${name} kept the negative signs. Distances from the mean must all be positive, or they cancel out.`, ok: true },
            { html: `${name} found the mean wrong.`, why: `The mean ${m} is correct: ${vals.join(' + ')} = ${S.sum(vals)}, and ${S.sum(vals)} ÷ ${n} = ${m}.` },
            { html: `${name} should have divided by ${n - 1}.`, why: `The MAD divides by the number of values, ${n}. The problem is the signs, not the divisor.` },
            { html: 'There is no mistake. A MAD of 0 is normal.', why: 'A MAD of 0 only happens when every value equals the mean. These values are different, so the MAD cannot be 0.' },
          ]
        : [
            { html: `${name} added the distances but forgot to divide by ${n}. The MAD is the mean of the distances.`, ok: true },
            { html: `${name} should have used the range instead.`, why: 'The range is a different measure. The MAD averages the distances from the mean.' },
            { html: `${name} found the distances wrong.`, why: `The distances ${dv.join(', ')} are correct. The last step is missing.` },
            { html: 'There is no mistake.', why: `${sd} is the total of the distances. An average distance must be divided by the number of values.` },
          ];
    const sh = shuffleOptions(r, opts, 0);
    return {
      type: 'error',
      skill: 'mad',
      lesson: '2-9',
      title: 'Find the mistake',
      prompt: `<p>${name} is finding the MAD of ${c.what}: ${hl(S.list(vals))}.</p><p>What mistake did ${name} make?</p>`,
      work,
      options: sh.options,
      answer: sh.answer,
      fix: { label: 'What is the correct MAD?', answer: mad, tolerance: 0.01 },
      hints: [
        'MAD steps: find the mean, find each distance from the mean (positive), add the distances, divide by the count.',
        variant === 'signed' ? 'Distances cannot be negative. A value below the mean is still a positive distance away.' : `The sum of the distances is ${sd}. Is that an average yet?`,
        `Distances: ${dv.join(', ')}. Sum ${sd}. MAD = ${sd} ÷ ${n}.`,
      ],
      solution: `<p>${variant === 'signed' ? `${name} used signed differences, which always add to 0 around the mean. Distances must be positive: ${dv.join(', ')}.` : `${name} stopped at the sum ${sd}.`} MAD = ${sd} ÷ ${n} = <b>${fmt(mad)}</b> ${c.unit}.</p>`,
      feedback: {
        correct: 'Correct. Positive distances, then divide by the count.',
        wrong(ans, d) {
          if (!d.mistakeOk) return variant === 'signed' ? 'Can an average distance be 0 when the values are different? Look at the signs.' : `Is ${sd} an average, or a total?`;
          return `You found the mistake. Now compute ${sd} ÷ ${n}.`;
        },
      },
    };
  });
})(typeof window !== 'undefined' ? window : globalThis);

/* js/units/u2/gen-measures.js */
/* Zone 10 — Lookout Island. Lesson 2-10 Choose Appropriate Measures (Mean or Median? · Matching Center and Spread).
   Rule taught: with an outlier or a skewed shape, report the median (paired with the IQR); when the data is roughly
   symmetric with no outlier, the mean (paired with the MAD) describes the center well. */
(function (root) {
  'use strict';
  const RX = root.RX;
  const { G, V, shuffleOptions, NAMES, fmt } = RX;
  const S = RX.STATS;
  const hl = V.hl;

  const CTX = [
    { what: 'minutes visitors spent at the lookout', unit: 'minutes', lo: 10, hi: 25 },
    { what: 'ships spotted per watch', unit: 'ships', lo: 3, hi: 12 },
    { what: 'steps climbed to the lookout each day', unit: 'steps', lo: 80, hi: 120 },
    { what: 'gulls counted on the rail', unit: 'gulls', lo: 4, hi: 14 },
    { what: 'ages of the lookout volunteers', unit: 'years', lo: 20, hi: 36 },
  ];
  /** n−1 clustered distinct values plus one far-off value, chosen so the mean of all n is a whole number. */
  function withOutlierIntMean(r, n, lo, hi) {
    for (let t = 0; t < 200; t++) {
      const cluster = S.data(r, n - 1, lo, hi, true);
      const base = Math.max(...cluster) + r.int(Math.max(10, Math.round((hi - lo) * 0.6)), Math.max(16, Math.round((hi - lo) * 0.9)));
      const sum = S.sum(cluster);
      let out = base;
      while ((sum + out) % n !== 0) out++;
      const all = r.shuffle(cluster.concat([out]));
      if (Math.abs(S.mean(all) - S.median(all)) >= 1.5) return { all, cluster, out, mean: S.mean(all), median: S.median(all) };
    }
    const cluster = [lo, lo + 1, lo + 2, lo + 3],
      out = lo + 4 + (5 - ((4 * lo + 6 + lo + 4) % 5)) % 5;
    const all = cluster.concat([out]);
    return { all, cluster, out, mean: S.mean(all), median: S.median(all) };
  }
  /** Symmetric-ish set with whole-number mean and median within 1 of it. */
  function symmetricSet(r, n, m, spread) {
    for (let t = 0; t < 200; t++) {
      const v = S.withMean(r, n, m, spread);
      if (Math.abs(S.median(v) - m) <= 1 && S.range(v) <= spread * 2) return v;
    }
    return S.withMean(r, n, m, spread);
  }

  // ---------- Mean or median? (mc) ----------
  G.define('s10_chooseCenter', (r, o) => {
    const hard = !!o.hard,
      c = r.pick(CTX),
      n = r.pick([5, 6, 7]),
      skewed = r.chance(0.6);
    let vals, mean, med, out;
    if (skewed) {
      const d = withOutlierIntMean(r, n, c.lo, c.hi);
      vals = d.all;
      mean = d.mean;
      med = d.median;
      out = d.out;
    } else {
      const m = r.int(c.lo + 3, c.hi - 3);
      vals = symmetricSet(r, n, m, 3);
      mean = m;
      med = S.median(vals);
    }
    const opts = skewed
      ? [
          { html: `The median, ${fmt(med)}, because the outlier ${out} pulls the mean up to ${mean}, which is higher than most of the values.`, ok: true },
          { html: `The mean, ${mean}, because it uses every value.`, why: `The mean does use every value, and that is the problem here: the outlier ${out} drags it to ${mean}, above almost all the data.` },
          { html: `The mean, ${mean}, because it is larger.`, why: 'Bigger is not better. The best measure is the one closest to a typical value, and here that is the median.' },
          { html: `Neither. The data has no center because of the outlier.`, why: 'Every data set has a center. When there is an outlier, the median still describes a typical value well.' },
        ]
      : [
          { html: `The mean, ${mean}. The data has no outlier and is roughly symmetric, so the mean and median (${fmt(med)}) are close and either is reasonable.`, ok: true },
          { html: `The median, ${fmt(med)}, because the mean is never a good choice.`, why: 'The mean is a fine choice when the data is symmetric with no outliers. It is only misleading when extreme values pull it.' },
          { html: `The maximum, ${Math.max(...vals)}, because it is the biggest value.`, why: 'The maximum is one end of the data, not its center.' },
          { html: `The range, ${S.range(vals)}, because it uses the whole data set.`, why: 'The range measures spread, not center.' },
        ];
    const sh = shuffleOptions(r, opts, 0);
    return {
      type: 'mc',
      skill: 'choose-measure',
      lesson: '2-10',
      title: hard ? 'Mean or median? (harder)' : 'Mean or median?',
      prompt: `<p>Data (${c.what}): ${hl(S.list(vals))}.${hard ? '' : ` Mean: ${hl(mean)}. Median: ${hl(fmt(med))}.`}</p><p>Which measure of center best describes a <b>typical value</b>, and why?</p>`,
      options: sh.options,
      answer: sh.answer,
      hints: [
        'Look for an outlier: a value far from the rest. An outlier pulls the mean toward it but barely moves the median.',
        skewed ? `The value ${out} is far above the others. Mean = ${mean}, median = ${fmt(med)}. Which one sits among the typical values?` : `Ordered: ${S.list(S.sorted(vals))}. No value is far from the rest. Mean = ${mean}, median = ${fmt(med)}.`,
        skewed ? `Most values are near ${fmt(med)}, not near ${mean}. Choose the measure that is not pulled by ${out}.` : 'When there is no outlier and the shape is balanced, the mean describes the center well.',
      ],
      solution: skewed
        ? `<p>The outlier ${out} pulls the mean up to ${mean}, above ${vals.filter((v) => v < mean).length} of the ${n} values. The <b>median, ${fmt(med)}</b>, stays in the middle of the typical values, so it describes the center better. Use the median when data has an outlier or is skewed.</p>`
        : `<p>Ordered: ${S.list(S.sorted(vals))}. There is no outlier and the values are balanced around the middle. The <b>mean, ${mean}</b>, describes the center well, and it is close to the median ${fmt(med)}. Use the mean when the data is roughly symmetric with no outliers.</p>`,
      feedback: { correct: skewed ? 'Correct. An outlier drags the mean, so the median is the better choice.' : 'Correct. Symmetric data with no outlier: the mean works well.' },
    };
  });

  // ---------- Compute both and see the pull (blanks) ----------
  G.define('s10_meanVsMedian', (r) => {
    const c = r.pick(CTX),
      n = r.pick([5, 7]);
    const d = withOutlierIntMean(r, n, c.lo, c.hi);
    const s = S.sorted(d.all);
    return {
      type: 'blanks',
      skill: 'choose-measure',
      lesson: '2-10',
      title: 'Which one moved?',
      prompt: `<p>Data (${c.what}): ${hl(S.list(d.all))}.</p><p>Find the mean and the median. Then decide which one the outlier pulled.</p>`,
      fields: [
        { label: 'mean', answer: d.mean, width: 'sm' },
        { label: 'median', answer: d.median, width: 'sm', tolerance: 0.01 },
      ],
      template: ['Mean = {0}.', 'Median = {1}.'],
      hints: [
        'Mean: add all the values and divide by the count. Median: order the values and take the middle one.',
        `Sum: ${d.all.join(' + ')} = ${S.sum(d.all)}. Divide by ${n}.`,
        `Ordered: ${S.list(s)}. The middle (${(n + 1) / 2 === 2 ? '2nd' : (n + 1) / 2 === 3 ? '3rd' : (n + 1) / 2 + 'th'}) value is the median.`,
      ],
      solution: `<p>Mean = ${S.sum(d.all)} ÷ ${n} = <b>${d.mean}</b>. Ordered: ${S.list(s)}; median = <b>${fmt(d.median)}</b>. The outlier ${d.out} pulled the mean ${d.mean - d.median} above the median. Most values are near ${fmt(d.median)}, so the median describes a typical value better here.</p>`,
      feedback: {
        correct: `Correct. The outlier ${d.out} lifted the mean to ${d.mean} while the median stayed at ${fmt(d.median)}.`,
        wrong(ans, d2) {
          if (d2.wrong.includes(0)) return `Add all ${n} values (including ${d.out}) and divide by ${n}.`;
          return `Order the values: ${S.list(s)}. The median is the middle one.`;
        },
      },
    };
  });

  // ---------- Sort situations: mean or median (sort) ----------
  G.define('s10_sortSituations', (r) => {
    const ctxs = r.pickN(CTX, 4);
    const items = [];
    ctxs.forEach((c, i) => {
      if (i % 2 === 0) {
        const d = withOutlierIntMean(r, 5, c.lo, c.hi);
        items.push({ html: `${c.what}: ${S.list(S.sorted(d.all))}`, bin: 1 });
      } else {
        const v = symmetricSet(r, 5, r.int(c.lo + 3, c.hi - 3), 3);
        items.push({ html: `${c.what}: ${S.list(S.sorted(v))}`, bin: 0 });
      }
    });
    const extra = r.pick([
      { html: 'Home prices on a street where one house costs ten times the others', bin: 1 },
      { html: 'Heights of sixth graders, all within a few inches of each other', bin: 0 },
      { html: 'Daily temperatures in one week, all between 70°F and 76°F', bin: 0 },
      { html: 'Weekly allowances where one student gets far more than everyone else', bin: 1 },
    ]);
    items.push(extra);
    return {
      type: 'sort',
      skill: 'choose-measure',
      lesson: '2-10',
      title: 'Which center fits?',
      prompt: `<p>Sort each data set by the measure of center that describes it best.</p><p class="muted">Use the <b>median</b> when a value sits far from the rest (an outlier) or the data is skewed. Use the <b>mean</b> when the data is roughly symmetric with no outlier.</p>`,
      bins: ['Mean works well', 'Median is better'],
      items: r.shuffle(items),
      hints: [
        'Scan each list for a value far from the others. That is the sign that the mean will be pulled.',
        'Lists where all the values are close together have no outlier, so the mean is fine.',
        'Two of the number lists end with a value much larger than the rest. Those need the median.',
      ],
      solution: `<p>Sets with one value far above the rest are skewed by that outlier, which drags the mean away from the typical values, so the <b>median</b> is better. Sets whose values all sit close together have no outlier, so the <b>mean</b> describes them well.</p>`,
      feedback: {
        correct: 'Correct. Outlier or skew: median. Balanced with no outlier: mean.',
        wrong(ans, d) {
          const it = items[d.wrong[0]];
          if (it && it.bin === 1) return `Look again at "${RX.esc(it.html).slice(0, 40)}…". One value is far from the others, so the mean would be pulled toward it.`;
          return 'Look again at the set you placed under "median." Are all its values close together? Then the mean works.';
        },
      },
    };
  });

  // ---------- Who chose the right measure (who) ----------
  G.define('s10_whoMeasure', (r) => {
    const c = r.pick(CTX),
      [a, b, z] = r.pickN(NAMES, 3),
      n = r.pick([5, 6]);
    const d = withOutlierIntMean(r, n, c.lo, c.hi);
    const opts = [
      { html: `<b>${a}</b>: "Use the median, ${fmt(d.median)}. The value ${d.out} is an outlier that pulls the mean up to ${d.mean}."`, ok: true },
      { html: `<b>${b}</b>: "Use the mean, ${d.mean}. It is the most accurate because it uses every number."`, why: `Using every number is exactly why the mean is pulled toward ${d.out}. A mean of ${d.mean} is higher than most of the data.` },
    ];
    if (r.chance(0.6)) opts.push({ html: `<b>${z}</b>: "Use the range, ${S.range(d.all)}. It shows the whole data set."`, why: 'The range is a measure of spread. The question asks for a measure of center.' });
    const sh = shuffleOptions(r, opts, 0);
    return {
      type: 'who',
      skill: 'choose-measure',
      lesson: '2-10',
      title: 'Who chose well?',
      prompt: `<p>Data (${c.what}): ${hl(S.list(d.all))}.</p><p>Which student chose the best measure of <b>center</b> for this data?</p>`,
      options: sh.options,
      answer: sh.answer,
      layout: 'cards',
      hints: [
        'First check for an outlier. Then compare the mean and the median.',
        `Ordered: ${S.list(S.sorted(d.all))}. ${d.out} is far from the rest. Mean = ${d.mean}, median = ${fmt(d.median)}.`,
        `Which measure sits among the typical values? That is the one to report.`,
      ],
      solution: `<p><b>${a}</b> is correct. The outlier ${d.out} pulls the mean to ${d.mean}, above most of the values. The median, ${fmt(d.median)}, is a better description of a typical value. The range measures spread, not center.</p>`,
      feedback: { correct: 'Correct. With an outlier, the median is the better measure of center.' },
    };
  });

  // ---------- Match measures to values (match) ----------
  G.define('s10_matchValues', (r) => {
    const c = r.pick(CTX);
    let vals, f, mean;
    for (let t = 0; t < 3000; t++) {
      vals = S.data(r, 8, c.lo, c.lo + Math.max(24, c.hi - c.lo), true);
      f = S.fiveNum(vals);
      mean = S.mean(vals);
      const set = [mean, f.med, f.max - f.min, f.q3 - f.q1];
      if (S.isInt(mean) && S.isInt(f.med) && S.isInt(f.q1) && S.isInt(f.q3) && new Set(set).size === 4) break;
    }
    const measures = [
      { name: 'Mean', v: mean },
      { name: 'Median', v: f.med },
      { name: 'Range', v: f.max - f.min },
      { name: 'IQR', v: f.q3 - f.q1 },
    ];
    const rightOrder = r.shuffle([0, 1, 2, 3]);
    return {
      type: 'match',
      skill: 'center-spread',
      lesson: '2-10',
      title: 'Match each measure to its value',
      prompt: `<p>Data (${c.what}): ${hl(S.list(S.sorted(vals)))} (already ordered, 8 values).</p><p>Match each measure to its value.</p>`,
      left: measures.map((m) => m.name),
      right: rightOrder.map((i) => fmt(measures[i].v)),
      pairs: measures.map((_, i) => [i, rightOrder.indexOf(i)]),
      hints: [
        'Mean: sum ÷ 8. Median: halfway between the 4th and 5th values. Range: max − min. IQR: Q3 − Q1, where Q1 and Q3 are the middles of the lower and upper halves.',
        `Sum = ${S.sum(vals)}, so the mean is ${S.sum(vals)} ÷ 8. The middle two values are ${S.sorted(vals)[3]} and ${S.sorted(vals)[4]}.`,
        `Lower half: ${S.list(S.halves(vals).lower)} → Q1 = ${f.q1}. Upper half: ${S.list(S.halves(vals).upper)} → Q3 = ${f.q3}. Range = ${f.max} − ${f.min}.`,
      ],
      solution: `<p>Mean = ${S.sum(vals)} ÷ 8 = <b>${mean}</b>. Median = (${S.sorted(vals)[3]} + ${S.sorted(vals)[4]}) ÷ 2 = <b>${f.med}</b>. Range = ${f.max} − ${f.min} = <b>${f.max - f.min}</b>. IQR = ${f.q3} − ${f.q1} = <b>${f.q3 - f.q1}</b>. Mean and median measure center; range and IQR measure spread.</p>`,
      feedback: {
        correct: 'Correct. Two measures of center, two measures of spread, each with its own value.',
        wrong(ans, d) {
          const i = d.wrong[0];
          const m = measures[i];
          if (!m) return 'Check each computation again.';
          return `Recheck the ${m.name}. ${m.name === 'Mean' ? 'Add all 8 values and divide by 8.' : m.name === 'Median' ? 'Average the 4th and 5th values.' : m.name === 'Range' ? 'Subtract the minimum from the maximum.' : 'Subtract Q1 from Q3.'}`;
        },
      },
    };
  });

  // ---------- Pair center with spread (mc) ----------
  G.define('s10_pairSpread', (r) => {
    const c = r.pick(CTX),
      name = r.pick(NAMES),
      center = r.pick(['median', 'mean']);
    const vals = center === 'median' ? withOutlierIntMean(r, 6, c.lo, c.hi).all : symmetricSet(r, 6, r.int(c.lo + 3, c.hi - 3), 3);
    const want = center === 'median' ? 'IQR' : 'MAD';
    const opts = [
      {
        html: center === 'median' ? 'The interquartile range (IQR), because it is built from the quartiles, which are medians.' : 'The mean absolute deviation (MAD), because it measures distance from the mean.',
        ok: true,
      },
      {
        html: center === 'median' ? 'The mean absolute deviation (MAD), because it is the most precise.' : 'The interquartile range (IQR), because it uses the middle half.',
        why: center === 'median' ? 'The MAD is measured from the mean. When the center is the median, the matching spread is the IQR, which is also based on position in the ordered data.' : 'The IQR is based on medians (quartiles). When the center is the mean, the matching spread is the MAD, which measures distance from the mean.',
      },
      { html: 'The mode, because it is the most common value.', why: 'The mode is a kind of center, not a measure of spread.' },
      { html: 'The maximum, because it is the largest value.', why: 'The maximum is a single value, not a measure of how spread out the data is.' },
    ];
    const sh = shuffleOptions(r, opts, 0);
    return {
      type: 'mc',
      skill: 'center-spread',
      lesson: '2-10',
      title: 'Pair center with spread',
      prompt: `<p>${name} looked at ${c.what}: ${hl(S.list(vals))}.</p><p>${name} decided to report the <b>${center}</b> as the measure of center${center === 'median' ? ' because of the outlier' : ' because the data is balanced with no outlier'}. Which measure of <b>spread</b> should go with it?</p>`,
      options: sh.options,
      answer: sh.answer,
      hints: [
        'Each measure of spread is built from one measure of center. Match them by how they are computed.',
        'The IQR comes from quartiles, which are medians of the halves. The MAD is the average distance from the mean.',
        `The center is the ${center}, so the spread should be the ${want}.`,
      ],
      solution: `<p>Report the <b>${want}</b> with the ${center}. ${center === 'median' ? 'The IQR is Q3 − Q1, and the quartiles are medians of the halves, so it is not pulled by the outlier either.' : 'The MAD measures the average distance from the mean, so it belongs with the mean.'} Pair median with IQR, and mean with MAD.</p>`,
      feedback: { correct: `Correct. ${center === 'median' ? 'Median goes with IQR.' : 'Mean goes with MAD.'}` },
    };
  });

  // ---------- Fill in the report (cloze) ----------
  G.define('s10_clozeReport', (r) => {
    const c = r.pick(CTX),
      skewed = r.chance(0.6),
      n = r.pick([5, 6]);
    let vals, extra;
    if (skewed) {
      const d = withOutlierIntMean(r, n, c.lo, c.hi);
      vals = d.all;
      extra = d.out;
    } else {
      vals = symmetricSet(r, n, r.int(c.lo + 3, c.hi - 3), 3);
    }
    const s = S.sorted(vals);
    const shapeChoices = r.shuffle(['has an outlier', 'has no outlier']);
    const centerChoices = r.shuffle(['median', 'mean']);
    const spreadChoices = r.shuffle(['IQR', 'MAD', 'range']);
    return {
      type: 'cloze',
      skill: 'center-spread',
      lesson: '2-10',
      title: 'Complete the report',
      prompt: `<p>Data (${c.what}): ${hl(S.list(s))}.</p><p>Complete the surveyor's report.</p>`,
      template: `The data set {0}${skewed ? ` (the value ${extra} is far from the rest)` : ' (the values are close together)'}, so the best measure of center is the {1}, paired with the {2} as the measure of spread.`,
      choices: [shapeChoices, centerChoices, spreadChoices],
      answers: [shapeChoices.indexOf(skewed ? 'has an outlier' : 'has no outlier'), centerChoices.indexOf(skewed ? 'median' : 'mean'), spreadChoices.indexOf(skewed ? 'IQR' : 'MAD')],
      hints: [
        'Start with the shape: is any value far from the rest?',
        skewed ? `${extra} is far from the other values, so the mean would be pulled toward it. Use the median.` : 'All the values are close together with no outlier, so the mean describes the center well.',
        'Pair median with IQR, and mean with MAD.',
      ],
      solution: `<p>The data <b>${skewed ? 'has an outlier' : 'has no outlier'}</b>. ${skewed ? `The value ${extra} would pull the mean, so report the <b>median</b> with the <b>IQR</b>.` : 'The values are balanced, so report the <b>mean</b> with the <b>MAD</b>.'} Center and spread are chosen together: median with IQR, mean with MAD.</p>`,
      feedback: {
        correct: 'Correct. Shape decides the center, and the center decides the spread.',
        wrong(ans, d) {
          if (d.wrong.includes(0)) return skewed ? `Is ${extra} close to the other values? Look at the gap.` : 'Are any values far from the rest? If not, there is no outlier.';
          if (d.wrong.includes(1)) return skewed ? 'An outlier pulls the mean. Which center is not pulled?' : 'With no outlier, the mean is a good choice.';
          return 'Median pairs with IQR. Mean pairs with MAD.';
        },
      },
    };
  });

  // ---------- Explain your choice (cr) ----------
  G.define('s10_crChoose', (r) => {
    const c = r.pick(CTX),
      n = r.pick([5, 6]);
    const d = withOutlierIntMean(r, n, c.lo, c.hi);
    const sh = shuffleOptions(
      r,
      [
        { html: `The median, because the outlier ${d.out} pulls the mean to ${d.mean}, which is higher than most of the values.`, ok: true },
        { html: `The mean, because ${d.mean} is larger than ${fmt(d.median)}.` },
        { html: 'The mean, because the median only uses one value.' },
        { html: `The range, because the data is spread out.` },
      ],
      0,
    );
    return {
      type: 'cr',
      skill: 'choose-measure',
      lesson: '2-10',
      title: 'Defend your choice',
      prompt: `<p>Data (${c.what}): ${hl(S.list(d.all))}. Mean: ${hl(d.mean)}. Median: ${hl(fmt(d.median))}.</p><p>Which measure of center would you report, and <b>why</b>? Mention the outlier in your answer.</p>`,
      starters: ['I would report the … because…', `The value ${d.out} is an outlier, so…`, 'The mean is pulled… while the median…'],
      minWords: 12,
      check: { prompt: 'Which choice is best?', options: sh.options, answer: sh.answer },
      hints: [
        'Find the value that is far from the rest. Then compare the mean and the median: which one is close to most of the values?',
        `${d.out} is the outlier. The mean ${d.mean} is above ${d.all.filter((v) => v < d.mean).length} of the ${n} values. The median ${fmt(d.median)} sits in the middle of the typical values.`,
        'Say which measure you chose, name the outlier, and explain how it affects the mean.',
      ],
      solution: `<p>Report the <b>median, ${fmt(d.median)}</b>. The value ${d.out} is an outlier. It pulls the mean up to ${d.mean}, which is higher than most of the data, so the mean no longer describes a typical value. The median is not pulled by one far-off value.</p>`,
      feedback: {
        correct: 'Correct. The median resists the pull of an outlier.',
        wrong(ans, d2) {
          if (!d2.wroteEnough) return 'Write at least twelve words. Name your measure, name the outlier, and say what it does to the mean.';
          return `For the check, pick the choice that names the median and explains how ${d.out} pulls the mean.`;
        },
      },
    };
  });
})(typeof window !== 'undefined' ? window : globalThis);

/* js/units/u2/gen-cave.js */
/* Challenge zone — Tidal Grotto. Harder, mixed-skill Unit 2 problems (prefix sc_): two-set comparisons, missing values,
   five-number summaries from raw dots, decimal data, display choice, and reasoning about box plots and histograms. */
(function (root) {
  'use strict';
  const RX = root.RX;
  const { G, V, shuffleOptions, NAMES, fmt, round } = RX;
  const S = RX.STATS;
  const hl = V.hl;
  const TEAMS = ['Tide Runners', 'Salt Hawks', 'Reef Rays', 'Dune Foxes', 'Marsh Herons', 'Grotto Gulls'];

  // ---------- Missing score so two teams share a mean (num) ----------
  G.define('sc_twoGames', (r) => {
    const [tA, tB] = r.pickN(TEAMS, 2),
      m = r.int(14, 30),
      n = 5;
    let a, b, x;
    for (let t = 0; t < 80; t++) {
      a = S.withMean(r, n, m, 6);
      b = S.withMean(r, n - 1, m + r.pick([-3, -2, -1, 1, 2, 3]), 6);
      x = m * n - S.sum(b);
      if (x > 0 && x !== m && x <= m + 14 && !b.includes(x)) break;
    }
    return {
      type: 'num',
      skill: 'target-mean',
      lesson: 'Unit 2',
      title: 'Match the other team',
      prompt: `<p>The ${tA} scored ${hl(S.list(a))} points in ${n} games.</p><p>The ${tB} scored ${hl(S.list(b))} in their first ${n - 1} games. After game ${n}, the two teams had <b>exactly the same mean</b>.</p><p>How many points did the ${tB} score in game ${n}?</p>`,
      unit: 'points',
      answer: x,
      hints: [
        `Find the ${tA}'s mean first: add the ${n} scores and divide by ${n}. Then think in totals for the ${tB}.`,
        `${tA} mean: ${S.sum(a)} ÷ ${n} = ${m}. For the ${tB} to average ${m} over ${n} games, their total must be ${m} × ${n} = ${m * n}.`,
        `${tB} total so far: ${S.sum(b)}. Game ${n} must be ${m * n} − ${S.sum(b)}.`,
      ],
      solution: `<p>${tA} mean = ${S.sum(a)} ÷ ${n} = ${m}. For the ${tB} to match it, their ${n} games must total ${m} × ${n} = ${m * n}. They have ${S.sum(b)} so far, so game ${n} must be ${m * n} − ${S.sum(b)} = <b>${x}</b> points. Check: (${S.sum(b)} + ${x}) ÷ ${n} = ${m}.</p>`,
      feedback: {
        correct: `Correct. Both teams end with a total of ${m * n} and a mean of ${m}.`,
        wrong(ans, d) {
          if (d.value === m) return `${m} is the mean the ${tB} want. Scoring the mean only works if they are already at it. Work with totals.`;
          if (d.value === m * n) return `${m * n} is the total they need for all ${n} games. Subtract what they already have.`;
          return `Target total: ${m} × ${n} = ${m * n}. Subtract the ${tB}'s current total, ${S.sum(b)}.`;
        },
      },
    };
  });

  // ---------- Five-number summary from a dot plot (blanks) ----------
  G.define('sc_boxFromDots', (r) => {
    const c = r.pick([
      { label: 'Crabs per trap', unit: 'crabs', lo: 2, hi: 13 },
      { label: 'Minutes per dive', unit: 'minutes', lo: 5, hi: 16 },
      { label: 'Shells per bucket', unit: 'shells', lo: 1, hi: 12 },
    ]);
    const n = r.pick([7, 11]);
    let vals, f;
    for (let t = 0; t < 60; t++) {
      vals = S.shaped(r, r.pick(['symmetric', 'skewed right', 'skewed left']), c.lo, c.hi, n);
      f = S.fiveNum(vals);
      if (f.q1 < f.med && f.med < f.q3 && f.min < f.q1 && f.q3 < f.max) break;
    }
    const s = S.sorted(vals),
      h = S.halves(vals);
    return {
      type: 'blanks',
      skill: 'box-plot',
      lesson: 'Unit 2',
      title: 'From dots to a box plot',
      prompt: `<p>The dot plot shows ${c.label.toLowerCase()} for ${n} surveys.</p>${V.dotPlot({ values: vals, min: c.lo, max: c.hi, label: c.label, aria: 'Dot plot: ' + S.list(s) })}<p>Find the five-number summary you would use to draw a box plot of this data.</p>`,
      fields: [
        { label: 'Minimum', answer: f.min, width: 'sm' },
        { label: 'Q1', answer: f.q1, width: 'sm' },
        { label: 'Median', answer: f.med, width: 'sm' },
        { label: 'Q3', answer: f.q3, width: 'sm' },
        { label: 'Maximum', answer: f.max, width: 'sm' },
      ],
      hints: [
        `Read the dots left to right to list the ${n} values in order. Repeated dots are repeated values.`,
        `Ordered: ${S.list(s)}. The median is the ${(n + 1) / 2}th value, ${f.med}. Leave it out and split the rest into two halves of ${(n - 1) / 2}.`,
        `Lower half: ${S.list(h.lower)} → Q1 = ${f.q1}. Upper half: ${S.list(h.upper)} → Q3 = ${f.q3}.`,
      ],
      solution: `<p>Ordered data: ${S.list(s)}. Minimum <b>${f.min}</b>, maximum <b>${f.max}</b>, median <b>${f.med}</b>. Lower half ${S.list(h.lower)} → Q1 = <b>${f.q1}</b>; upper half ${S.list(h.upper)} → Q3 = <b>${f.q3}</b>. (The median is left out of both halves because ${n} is odd.)</p>${V.boxPlot({ plots: [Object.assign({ showValues: true }, f)], lineMin: c.lo, lineMax: c.hi, step: 1, width: 440, aria: `Box plot: min ${f.min}, Q1 ${f.q1}, median ${f.med}, Q3 ${f.q3}, max ${f.max}` })}`,
      feedback: {
        correct: 'Correct. A dot plot gives every value; the five-number summary condenses them into a box plot.',
        wrong(ans, d) {
          if (d.wrong.includes(2)) return `Count the dots: ${n} in all. The median is the ${(n + 1) / 2}th dot from the left.`;
          if (d.wrong.includes(1) || d.wrong.includes(3)) return `Leave the median out, then find the middle of each half. Each half has ${(n - 1) / 2} values, so its middle is the ${(n + 1) / 4}th one.`;
          return 'The minimum and maximum are the leftmost and rightmost dots.';
        },
      },
    };
  });

  // ---------- Mean of decimal data (num) ----------
  G.define('sc_decimalMean', (r) => {
    const c = r.pick([
      { what: 'masses of crabs in kilograms', unit: 'kg', m: [1.2, 3.8] },
      { what: 'kilometers kayaked each day', unit: 'km', m: [3.5, 9.5] },
      { what: 'lengths of seaweed strands in meters', unit: 'm', m: [1.5, 4.5] },
      { what: 'liters of water sampled per site', unit: 'liters', m: [2.5, 7.5] },
    ]);
    const n = r.pick([4, 5]);
    const m = round(r.int(Math.round(c.m[0] * 10), Math.round(c.m[1] * 10)) / 10, 1);
    let vals;
    for (let t = 0; t < 80; t++) {
      const dev = [];
      for (let i = 0; i < n - 1; i++) dev.push(r.int(-9, 9));
      const last = -S.sum(dev);
      if (Math.abs(last) > 9) continue;
      dev.push(last);
      vals = r.shuffle(dev.map((d) => round(m + d / 10, 1)));
      if (new Set(vals).size >= 3 && vals.every((v) => v > 0)) break;
    }
    const total = round(S.sum(vals), 1);
    const D = (x) => fmt(round(x, 2));
    return {
      type: 'num',
      skill: 'mean',
      lesson: 'Unit 2',
      title: 'Mean of decimal data',
      prompt: `<p>A surveyor recorded ${c.what}: ${hl(vals.map(D).join(', '))}.</p><p>What is the <b>mean</b>? Give your answer as a decimal.</p>`,
      unit: c.unit,
      answer: m,
      tolerance: 0.001,
      hints: [
        'Mean = sum ÷ count. Line up the decimal points when you add, then divide the decimal sum by the whole number of values.',
        `Sum: ${vals.map(D).join(' + ')} = ${D(total)}.`,
        `Mean = ${D(total)} ÷ ${n}. Place the decimal point in the quotient above the point in ${D(total)}.`,
      ],
      solution: `<p>Sum: ${vals.map(D).join(' + ')} = ${D(total)}. Mean = ${D(total)} ÷ ${n} = <b>${D(m)}</b> ${c.unit}. Check: ${D(m)} × ${n} = ${D(total)}. Finding a mean of decimal data is a decimal division: the sum divided by the count.</p>`,
      feedback: {
        correct: `Correct. ${D(total)} shared equally among ${n} is ${D(m)}.`,
        wrong(ans, d) {
          if (d.value != null && Math.abs(d.value - total) < 0.001) return `${D(total)} is the sum. Divide by ${n}.`;
          if (d.value != null && Math.abs(d.value - m * 10) < 0.001) return 'Your digits are right, but check the decimal point: the mean must be between the smallest and largest values.';
          if (d.value != null && Math.abs(d.value - S.median(vals)) < 0.001 && Math.abs(S.median(vals) - m) > 0.001) return 'That is the median. The mean adds all the values and divides by the count.';
          return `Add the ${n} values carefully (line up the decimal points), then divide by ${n}.`;
        },
      },
    };
  });

  // ---------- Which display answers the question (mc) ----------
  G.define('sc_whichDisplay', (r) => {
    const name = r.pick(NAMES);
    const Q = r.pick([
      { ask: `How many days had <b>exactly</b> ${r.int(4, 9)} ships?`, best: 'dot', why: { hist: 'A histogram groups values into intervals, so you cannot see how many had one exact value.', box: 'A box plot shows only five summary numbers. It hides the individual values.' } },
      { ask: 'Which value appears <b>most often</b>?', best: 'dot', why: { hist: 'A histogram shows which interval has the most values, not which single value.', box: 'A box plot does not show how often any value appears.' } },
      { ask: 'What are the <b>median and the quartiles</b>, read straight from the display?', best: 'box', why: { dot: 'You could count dots to find the median, but a box plot marks the median and quartiles directly.', hist: 'A histogram hides individual values inside intervals, so the exact median cannot be read.' } },
      { ask: 'About what <b>percent</b> of the values are above Q3?', best: 'box', why: { dot: 'A dot plot does not mark the quartiles. A box plot splits the data into quarters.', hist: 'A histogram shows interval counts, not quartiles.' } },
      { ask: `A set of ${r.pick([60, 80, 100])} values ranges from 0 to ${r.pick([49, 59, 79])}. Which display groups them into <b>intervals</b> so the overall shape is easy to see?`, best: 'hist', why: { dot: 'A dot plot with that many values across that wide a range would be very crowded; a histogram groups them into bars.', box: 'A box plot shows the spread in quarters but not the shape across intervals.' } },
      { ask: `How many values fall <b>between ${r.pick([10, 20])} and ${r.pick([29, 39])}</b> for a large data set?`, best: 'hist', why: { dot: 'A dot plot shows every value, which works for small sets, but a histogram counts each interval directly.', box: 'A box plot does not show counts for a chosen interval.' } },
    ]);
    const names = { dot: 'Dot plot', hist: 'Histogram', box: 'Box plot' };
    const opts = ['dot', 'hist', 'box'].map((k) => (k === Q.best ? { html: names[k], ok: true } : { html: names[k], why: Q.why[k] }));
    const sh = shuffleOptions(
      r,
      opts,
      opts.findIndex((o) => o.ok),
    );
    const because = { dot: 'a dot plot shows every single data value', hist: 'a histogram counts how many values fall in each interval', box: 'a box plot marks the minimum, Q1, median, Q3, and maximum' }[Q.best];
    return {
      type: 'mc',
      skill: 'center-spread',
      lesson: 'Unit 2',
      title: 'Choose the display',
      prompt: `<p>${name} wants to answer this question about a data set:</p><p>${hl('Question')}: ${Q.ask}</p><p>Which data display is the <b>best</b> choice?</p>`,
      options: sh.options,
      answer: sh.answer,
      hints: [
        'Think about what each display keeps and what it hides. Dot plot: every value. Histogram: counts per interval. Box plot: five summary numbers.',
        'Ask: does the question need individual values, interval counts, or the quartiles?',
        `This question needs what ${because.replace(/^a /, 'the ')} shows.`,
      ],
      solution: `<p><b>${names[Q.best]}</b>, because ${because}. ${Object.keys(Q.why)
        .map((k) => `${names[k]}: ${Q.why[k]}`)
        .join(' ')}</p>`,
      feedback: { correct: `Correct. ${names[Q.best]}: ${because}.` },
    };
  });

  // ---------- Mean and median, with and without an outlier (table) ----------
  G.define('sc_outlierBoth', (r) => {
    const c = r.pick([
      { what: 'minutes each tide-pool tour lasted', unit: 'minutes', m: [20, 35] },
      { what: 'fish counted per net', unit: 'fish', m: [8, 18] },
      { what: 'visitors per hour at the grotto', unit: 'visitors', m: [10, 24] },
    ]);
    const n = r.pick([6, 8]),
      m = r.int(c.m[0], c.m[1]);
    let cluster, out, all;
    for (let t = 0; t < 80; t++) {
      cluster = S.withMean(r, n - 1, m, 4);
      const sum = S.sum(cluster);
      out = Math.max(...cluster) + r.int(12, 20);
      while ((sum + out) % n !== 0) out++;
      all = r.shuffle(cluster.concat([out]));
      if (new Set(cluster).size >= 3) break;
    }
    const meanWith = S.mean(all),
      meanWithout = m,
      medWith = S.median(all),
      medWithout = S.median(cluster);
    return {
      type: 'table',
      skill: 'choose-measure',
      lesson: 'Unit 2',
      title: 'Which measure moved more?',
      prompt: `<p>Data (${c.what}): ${hl(S.list(all))}. The value ${hl(out)} is an outlier.</p><p>Complete the table with and without the outlier. Then notice which measure moved more.${Number.isInteger(medWith) && Number.isInteger(medWithout) ? '' : ' A median may be a decimal.'}</p>`,
      rows: [
        ['', 'Mean', 'Median'],
        ['With the outlier', '__IN:a__', '__IN:b__'],
        ['Without the outlier', '__IN:c__', '__IN:d__'],
      ],
      header: true,
      rowHeader: true,
      inputs: [
        { id: 'a', answer: meanWith },
        { id: 'b', answer: medWith, tolerance: 0.01 },
        { id: 'c', answer: meanWithout },
        { id: 'd', answer: medWithout, tolerance: 0.01 },
      ],
      hints: [
        'Mean: sum ÷ count. Median: order the values and find the middle. Do each twice: once with all the values, once without the outlier.',
        `With: sum ${S.sum(all)} ÷ ${n} = ${meanWith}; ordered ${S.list(S.sorted(all))}. Without: sum ${S.sum(cluster)} ÷ ${n - 1} = ${meanWithout}.`,
        `Medians: with the outlier, ${fmt(medWith)}; without, ${fmt(medWithout)}. Compare how far each measure moved.`,
      ],
      solution: `<p>With the outlier: mean <b>${meanWith}</b>, median <b>${fmt(medWith)}</b>. Without it: mean <b>${meanWithout}</b>, median <b>${fmt(medWithout)}</b>. The mean dropped by ${meanWith - meanWithout}; the median moved only ${fmt(Math.abs(medWith - medWithout))}. The outlier pulls the mean, which is why the median is the better center for this data.</p>`,
      feedback: {
        correct: `Correct. The mean moved ${meanWith - meanWithout}; the median barely moved.`,
        wrong(ans, d) {
          if (d.wrong.includes('a')) return `With the outlier: add all ${n} values (${S.sum(all)}) and divide by ${n}.`;
          if (d.wrong.includes('c')) return `Without ${out}: add the other ${n - 1} values (${S.sum(cluster)}) and divide by ${n - 1}.`;
          if (d.wrong.includes('b')) return `Order all ${n} values and average the two in the middle.`;
          return `Order the ${n - 1} remaining values and find the middle one.`;
        },
      },
    };
  });

  // ---------- Order by MAD when the means and ranges match (seq) ----------
  G.define('sc_seqMAD', (r) => {
    const sites = r.pickN(['Grotto Mouth', 'Deep Pool', 'Ledge', 'Back Chamber', 'Sand Shelf', 'Spring'], 4),
      m = r.int(12, 24),
      k = r.int(4, 7),
      asc = r.chance(0.5);
    // Each set: m − k, m + k (fixed range 2k) plus three values m + x, m + y, m − x − y whose distances add to s.
    const innerSums = r.pickN(Array.from({ length: k + 1 }, (_, i) => 2 * i), 4);
    const sets = innerSums.map((sm) => {
      const x = r.int(0, sm / 2),
        y = sm / 2 - x;
      return r.shuffle([m - k, m + k, m + x, m + y, m - x - y]);
    });
    const mads = sets.map((d) => round(S.mad(d), 2));
    const items = sets.map((d, i) => ({ html: `<b>${sites[i]}</b>: ${S.list(d)}`, rate: mads[i] }));
    const order = items.map((_, i) => i).sort((a, b) => (asc ? items[a].rate - items[b].rate : items[b].rate - items[a].rate));
    const dev = (d) => d.map((v) => Math.abs(v - m));
    return {
      type: 'seq',
      skill: 'mad',
      lesson: 'Unit 2',
      title: 'Same mean, same range',
      prompt: `<p>Four pools in the grotto each had 5 water readings. Every pool has a mean of ${hl(m)} <b>and</b> a range of ${hl(2 * k)}, so the range cannot tell them apart.</p><p>Order the pools by <b>MAD</b>, from ${asc ? '<b>smallest</b> (top) to <b>largest</b> (bottom)' : '<b>largest</b> (top) to <b>smallest</b> (bottom)'}.</p>`,
      items,
      order,
      hints: [
        `Every set has ${m - k} and ${m + k}, so the range is ${2 * k} for all four. Only the MAD will separate them: find each value's distance from ${m}.`,
        `Sums of distances: ${sets.map((d, i) => `${sites[i]} ${S.sum(dev(d))}`).join(', ')}.`,
        `MADs: ${sets.map((d, i) => `${sites[i]} ${fmt(mads[i])}`).join(', ')}. Put the ${asc ? 'smallest' : 'largest'} on top.`,
      ],
      solution: `<p>${sets.map((d, i) => `${sites[i]}: distances ${dev(d).join(', ')}, MAD = ${S.sum(dev(d))} ÷ 5 = <b>${fmt(mads[i])}</b>`).join('; ')}. Order: <b>${order.map((i) => sites[i]).join(', ')}</b>. The range only looks at the two end values; the MAD uses every value, so it can tell these sets apart.</p>`,
      feedback: {
        correct: 'Correct. When the range ties, the MAD still measures how the middle values cluster around the mean.',
        wrong() {
          return `Compute each MAD from the distances to ${m}, then order with the ${asc ? 'smallest' : 'largest'} on top.`;
        },
      },
    };
  });

  // ---------- Unequal interval widths (error) ----------
  G.define('sc_binWidthError', (r) => {
    const name = r.pick(NAMES),
      c = r.pick([
        { what: 'shells collected per visitor', unit: 'shells' },
        { what: 'minutes spent in the grotto', unit: 'minutes' },
        { what: 'photos taken per visitor', unit: 'photos' },
      ]);
    const vals = S.data(r, 14, 0, 39);
    const bad = r.pick([
      ['0–9', '10–14', '15–29', '30–39'],
      ['0–4', '5–19', '20–29', '30–39'],
      ['0–9', '10–19', '20–24', '25–39'],
    ]);
    const good = [0, 10, 20, 30].map((lo) => ({ lo, hi: lo + 9, label: `${lo}–${lo + 9}` }));
    const bi = r.int(1, 2);
    const cnt = vals.filter((v) => v >= good[bi].lo && v <= good[bi].hi).length;
    const opts = [
      { html: 'The intervals are not all the same width, so the bar heights cannot be compared fairly.', ok: true },
      { html: 'The intervals overlap, so some values are counted twice.', why: `No value fits two of these intervals. The problem is that the intervals have different widths.` },
      { html: 'There are gaps between the intervals, so some values are left out.', why: 'Every whole number from 0 to 39 belongs to exactly one interval. The widths are the problem.' },
      { html: 'There is no mistake. Intervals can be any size as long as they do not overlap.', why: 'Histogram intervals must be equal in width. A wider interval collects more values just because it is wider, which makes its bar misleading.' },
    ];
    const sh = shuffleOptions(r, opts, 0);
    return {
      type: 'error',
      skill: 'histogram',
      lesson: 'Unit 2',
      title: 'Find the mistake',
      prompt: `<p>${name} is making a histogram of ${c.what}. The data: ${hl(S.list(S.sorted(vals)))}.</p><p>What is wrong with ${name}'s intervals?</p>`,
      work: `Intervals: &nbsp; ${bad.join(' &nbsp;|&nbsp; ')}`,
      options: sh.options,
      answer: sh.answer,
      fix: { label: `Using equal intervals of width 10 (${good.map((b) => b.label).join(', ')}), how many values are in ${good[bi].label}?`, answer: cnt },
      hints: [
        'Count how many whole numbers each interval covers. Are the counts the same?',
        `${bad.map((b) => `${b} covers ${Number(b.split('–')[1]) - Number(b.split('–')[0]) + 1}`).join('; ')}. A histogram needs equal widths.`,
        `With ${good.map((b) => b.label).join(', ')}, count the values from ${good[bi].lo} to ${good[bi].hi}.`,
      ],
      solution: `<p>The intervals have <b>different widths</b> (${bad.map((b) => Number(b.split('–')[1]) - Number(b.split('–')[0]) + 1).join(', ')} values each). A wider interval gets a taller bar just because it is wider, so the shape of the histogram would be misleading. Using equal intervals ${good.map((b) => b.label).join(', ')}, the interval ${good[bi].label} holds <b>${cnt}</b> values.</p>`,
      feedback: {
        correct: 'Correct. Equal widths make bar heights fair to compare.',
        wrong(ans, d) {
          if (!d.mistakeOk) return 'Count the numbers in each interval, for example how many whole numbers 10–14 covers compared with 15–29.';
          return `You found the mistake. Now count the data values from ${good[bi].lo} through ${good[bi].hi}.`;
        },
      },
    };
  });

  // ---------- True statements about two box plots (ms) ----------
  G.define('sc_boxStatements', (r) => {
    const c = r.pick([
      { what: 'minutes visitors spent in the grotto', unit: 'minutes', lo: 10, hi: 45 },
      { what: 'depths of the grotto pools in inches', unit: 'inches', lo: 8, hi: 40 },
      { what: 'number of bats counted each night', unit: 'bats', lo: 5, hi: 35 },
    ]);
    const [l1, l2] = r.pickN(['Low Tide', 'High Tide', 'Morning', 'Evening', 'Spring', 'Autumn'], 2);
    let f1, f2;
    for (let t = 0; t < 80; t++) {
      f1 = S.fiveNum(S.cleanFive(r, 8, c.lo, c.hi, true));
      f2 = S.fiveNum(S.cleanFive(r, 8, c.lo, c.hi, true));
      if (f1.med !== f2.med && f1.q3 - f1.q1 !== f2.q3 - f2.q1 && f1.max - f1.min !== f2.max - f2.min) break;
    }
    const hiMed = f1.med > f2.med ? l1 : l2,
      loMed = hiMed === l1 ? l2 : l1;
    const hiIQR = f1.q3 - f1.q1 > f2.q3 - f2.q1 ? l1 : l2;
    const r2 = f2.max - f2.min;
    const rangeTrue = r.chance(0.5);
    const opts = r.shuffle([
      { html: `${hiMed} has the greater median.`, ok: true },
      { html: `${hiIQR}'s middle half of the data is more spread out (larger IQR).`, ok: true },
      { html: `About 25% of ${l1}'s values are greater than ${f1.q3}.`, ok: true },
      { html: `${loMed} has the greater median.`, ok: false },
      { html: `${hiIQR} has more data values because its box is longer.`, ok: false },
      { html: `The range of ${l2} is ${rangeTrue ? r2 : r2 + r.pick([-4, 3, 5])}.`, ok: rangeTrue },
    ]);
    const okIdx = opts.map((o, i) => (o.ok ? i : -1)).filter((i) => i >= 0);
    const sh = shuffleOptions(r, opts, okIdx);
    const allMin = Math.min(f1.min, f2.min),
      allMax = Math.max(f1.max, f2.max);
    const step = allMax - allMin > 30 ? 5 : 2;
    return {
      type: 'ms',
      skill: 'box-plot',
      lesson: 'Unit 2',
      title: 'Read both box plots',
      prompt: `<p>The box plots show ${c.what} at two times.</p>${V.boxPlot({
        plots: [Object.assign({ label: l1 }, f1), Object.assign({ label: l2 }, f2)],
        lineMin: Math.max(0, Math.floor((allMin - 2) / step) * step),
        lineMax: Math.ceil((allMax + 2) / step) * step,
        step,
        labelEvery: step,
        width: 480,
        aria: `${l1}: min ${f1.min}, Q1 ${f1.q1}, median ${f1.med}, Q3 ${f1.q3}, max ${f1.max}. ${l2}: min ${f2.min}, Q1 ${f2.q1}, median ${f2.med}, Q3 ${f2.q3}, max ${f2.max}.`,
      })}<p>Select <b>all</b> the statements that are true.</p>`,
      options: sh.options,
      answers: sh.answers,
      hints: [
        'Median: the line inside each box. IQR: the length of each box. Range: whisker end to whisker end. Each whisker and each half-box holds about 25% of the data.',
        `${l1}: min ${f1.min}, Q1 ${f1.q1}, median ${f1.med}, Q3 ${f1.q3}, max ${f1.max}. ${l2}: min ${f2.min}, Q1 ${f2.q1}, median ${f2.med}, Q3 ${f2.q3}, max ${f2.max}.`,
        `IQRs: ${l1} ${f1.q3 - f1.q1}, ${l2} ${f2.q3 - f2.q1}. Range of ${l2}: ${r2}. A longer box never means more values.`,
      ],
      solution: `<p>${l1}: median ${f1.med}, IQR ${f1.q3 - f1.q1}, range ${f1.max - f1.min}. ${l2}: median ${f2.med}, IQR ${f2.q3 - f2.q1}, range ${r2}. So <b>${hiMed}</b> has the greater median and <b>${hiIQR}</b> has the larger IQR. About 25% of ${l1}'s values lie above its Q3 of ${f1.q3}. Box length shows spread, never the number of values.</p>`,
      feedback: {
        correct: 'Correct. Center from the median line, spread from the box and whiskers, and quarters from the sections.',
        wrong(ans, d) {
          if (d.extra && d.extra.length) {
            const t = sh.options[d.extra[0]].html;
            if (/more data values/.test(t)) return 'A longer box means more spread, not more values. Every section holds about a quarter of the data.';
            if (/range/.test(t)) return `Check the range of ${l2}: ${f2.max} − ${f2.min}.`;
            return `Check the median lines: ${l1} is at ${f1.med} and ${l2} is at ${f2.med}.`;
          }
          return 'You missed a true statement. Check the medians, the box lengths, and what lies above Q3.';
        },
      },
    };
  });
})(typeof window !== 'undefined' ? window : globalThis);
