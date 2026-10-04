/* js/units/u2/gen-questions.js */
/* Zone 1 — The Tide Pools. Lesson 2-1 Understand Statistical Questions (Statistical Questions · Dot Plots and Shape). */
(function (root) {
  'use strict';
  const RX = root.RX;
  const { G, V, shuffleOptions, NAMES } = RX;
  const S = RX.STATS;
  const hl = V.hl;

  // all: the whole group · one: a place phrase for one member ("Maya on the kayak team")
  const GROUPS = [
    { all: "the students in Ms. Rivera's class", one: "in Ms. Rivera's class" },
    { all: 'the sixth graders at Tidewater Middle', one: 'at Tidewater Middle' },
    { all: 'the members of the surf club', one: 'in the surf club' },
    { all: 'the campers at Marsh Camp', one: 'at Marsh Camp' },
    { all: 'the players on the kayak team', one: 'on the kayak team' },
  ];
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
  // Harder twins: the SAME person or place, measured many times (statistical) or once (not statistical).
  const HARD_TOPICS = [
    { stat: (n) => `How many minutes did ${n} spend reading each night last month?`, one: (n) => `How many minutes did ${n} spend reading on the night of May 3?` },
    { stat: () => 'What was the high-tide height at Tidewater Pier each day in May?', one: () => 'What was the high-tide height at Tidewater Pier on May 3?' },
    { stat: () => 'How many visitors came to the lighthouse each day this summer?', one: () => 'How many visitors came to the lighthouse on the Fourth of July?' },
    { stat: () => 'How many crabs were in each trap the crew pulled up this week?', one: () => 'How many crabs were in the first trap the crew pulled up today?' },
    { stat: (n) => `How long did each of ${n}'s bus rides to school take this month?`, one: (n) => `How long did ${n}'s bus ride to school take this morning?` },
    { stat: () => 'How many hours of sun did the station record each day in June?', one: () => 'How many hours of sun did the station record on June 21?' },
  ];
  const FIXED_ONE = ['What is the capital of Maryland?', 'How many legs does a crab have?', 'What time does the school day start?', 'How many days are in a week?'];
  const one = (n) => n.replace(/s$/, '');

  // ---------- Sort statistical / not statistical ----------
  G.define('s1_sortStatistical', (r, o) => {
    const hard = !!o.hard;
    const grp = r.pick(GROUPS),
      g = grp.all;
    const names = r.pickN(NAMES, 3);
    const items = [];
    if (hard) {
      // one ordinary pair + two "same person or place, many times vs once" pairs
      const t = r.pick(TOPICS);
      items.push({ html: t.stat(g), bin: 0, kind: 'group' }, { html: t.one(g, names[0] + ' ' + grp.one), bin: 1, kind: 'person' });
      r.pickN(HARD_TOPICS, 2).forEach((h, i) => items.push({ html: h.stat(names[i + 1]), bin: 0, kind: 'repeat' }, { html: h.one(names[i + 1]), bin: 1, kind: 'once' }));
    } else {
      r.pickN(TOPICS, 3).forEach((t, i) => items.push({ html: t.stat(g), bin: 0, kind: 'group' }, { html: t.one(g, names[i]), bin: 1, kind: 'person' }));
      if (r.chance(0.5)) items.push({ html: r.pick(FIXED_ONE), bin: 1, kind: 'fact' });
    }
    const its = r.shuffle(items);
    return {
      type: 'sort',
      skill: 'stat-question',
      lesson: '2-1',
      title: hard ? 'Sort the questions (tricky twins)' : 'Sort the questions',
      prompt: hard
        ? `<p>The station log lists pairs of questions that sound alike. Sort each question.</p><p class="muted">Watch for questions about <b>one</b> person or place. Some ask for one measurement; some ask for many measurements over time.</p>`
        : `<p>The station log lists questions about ${hl(g)}. Sort each question.</p><p class="muted">A <b>statistical question</b> is answered by collecting data that <b>varies</b>: different people give different answers. A question with one answer is not statistical.</p>`,
      bins: ['Statistical question', 'Not statistical'],
      items: its,
      hints: [
        'Ask: would I need to collect many answers, and would those answers be different?',
        hard
          ? 'A question about one person or place can still be statistical if it asks for many measurements, like "each day this month."'
          : `A question about one person (like ${names[0]}) or one fact has a single answer. It is not statistical.`,
        hard
          ? 'Look for words like "each day," "each night," or "each trap." Those questions collect many values that vary. A question about one day or one time has one value.'
          : `A question about all of ${g} expects many different answers. That variability makes it statistical.`,
      ],
      hintEs: 'Pregúntate: ¿tendría que reunir muchas respuestas, y esas respuestas serían diferentes?',
      solution: hard
        ? `<p>A question that asks for many measurements (each day, each night, each trap) collects data that varies, so it is <b>statistical</b>, even when it is about one person or one place. A question about one moment has exactly <b>one answer</b>, so it is not statistical. Questions about all of ${g} are statistical because the answers vary from person to person.</p>`
        : `<p>Questions about <b>${g}</b> as a group expect answers that vary, so they are statistical. Questions about one person or one fact have exactly one answer, so they are not.</p>`,
      feedback: {
        correct: 'Correct. Statistical questions anticipate variability in the answers.',
        wrong(ans, d) {
          const bad = (d.wrong || []).map((i) => its[i]);
          if (bad.some((x) => x.kind === 'repeat'))
            return 'One question is about a single person or place, but it asks for a value <b>each</b> day or night. Many measurements vary, so that question is statistical.';
          if (bad.some((x) => x.kind === 'once')) return 'A question about one day or one moment has a single answer, even if it sounds like a survey. It is not statistical.';
          if (bad.some((x) => x.kind === 'person')) return 'A question about one person has one answer. Nothing varies, so it is not statistical.';
          if (bad.some((x) => x.kind === 'group')) return `A question about all of ${g} gets a different answer from each person. That variability makes it statistical.`;
          return 'A fact with one correct answer is not statistical. Check the questions that have one answer.';
        },
      },
    };
  });

  // ---------- Which question is statistical (MC) ----------
  G.define('s1_whichStatistical', (r, o) => {
    const hard = !!o.hard;
    const grp = r.pick(GROUPS),
      g = grp.all,
      [n1, n2, n3] = r.pickN(NAMES, 3);
    let opts;
    if (hard) {
      const [h1, h2, h3] = r.pickN(HARD_TOPICS, 3);
      opts = [
        { html: h1.stat(n1), ok: true },
        { html: h1.one(n1), why: 'This asks about one single day or moment. There is only one value to record, so nothing varies.' },
        { html: h2.one(n2), why: 'This is one measurement at one time. A statistical question needs many measurements that vary.' },
        { html: h3.one(n3), why: 'Only one value answers this question. It sounds like data, but there is no variability.' },
      ];
    } else {
      const [t1, t2] = r.pickN(TOPICS, 2);
      opts = [
        { html: t1.stat(g), ok: true },
        { html: t1.one(g, n1 + ' ' + grp.one), why: `This asks about one person, ${n1}. There is only one answer, so no data varies.` },
        { html: t2.one(g, n2 + ' ' + grp.one), why: 'This question has a single answer. A statistical question needs answers that vary from person to person.' },
        { html: r.pick(HARD_TOPICS).one(n3), why: 'This asks for one measurement at one time. There is exactly one answer, so it is not statistical.' },
      ];
    }
    const sh = shuffleOptions(r, opts, 0);
    return {
      type: 'mc',
      skill: 'stat-question',
      lesson: '2-1',
      title: 'Which question is statistical?',
      prompt: hard
        ? `<p>A Junior Data Surveyor is planning a study. Each question below is about one person or one place.</p><p>Which question is a <b>statistical question</b>?</p>`
        : `<p>A Junior Data Surveyor wants to collect data about ${hl(g)}.</p><p>Which question is a <b>statistical question</b>?</p>`,
      options: sh.options,
      answer: sh.answer,
      hints: [
        'A statistical question is answered with data that varies. Look for a question whose answer is many different values.',
        hard ? 'Each question is about one person or place. Which one asks for a value many times, not just once?' : 'Cross out any question about one person or one moment. Those have only one answer.',
        hard ? 'Look for the word "each" with a stretch of time, such as "each day in May."' : `Only one question asks about all of ${g} and expects many different answers.`,
      ],
      hintEs: 'Una pregunta estadística se responde con datos que varían. Busca la pregunta cuya respuesta son muchos valores diferentes.',
      solution: `<p><b>${opts[0].html}</b> is statistical. ${hard ? 'It asks for a value many times, and those values will not all be the same.' : 'Each person gives a different answer, so the data varies.'} The other questions each have one answer.</p>`,
      feedback: {
        correct: 'Correct. A statistical question anticipates variability in the data.',
        wrong(a) {
          return (sh.options[a] && sh.options[a].why) || 'Find the question whose answer is a whole set of values that vary.';
        },
      },
    };
  });

  // ---------- True/false with reason ----------
  G.define('s1_statTF', (r, o) => {
    const hard = !!o.hard;
    const grp = r.pick(GROUPS),
      g = grp.all,
      n = r.pick(NAMES);
    const statTrue = r.chance(0.5);
    let q;
    if (hard) {
      const h = r.pick(HARD_TOPICS);
      q = statTrue ? h.stat(n) : h.one(n);
    } else {
      const t = r.pick(TOPICS);
      q = statTrue ? t.stat(g) : t.one(g, n);
    }
    const reasons = statTrue
      ? [
          { html: hard ? 'It asks for many measurements, and those values would not all be the same.' : 'The answers would vary from person to person, so you must collect data.', correct: true },
          { html: hard ? 'It is about one person or place, so it has exactly one answer.' : 'It has exactly one answer.' },
          { html: 'It uses the word "how," and every "how" question is statistical.' },
        ]
      : [
          { html: hard ? 'It asks for one measurement at one time, so there is no variability to study.' : 'It has only one answer, so there is no variability to study.', correct: true },
          { html: hard ? 'It is about a measurement, and measurements always vary.' : 'It is about a number, and numbers are always statistical.' },
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
        hard ? 'Count how many values the question asks for: one value, or many values over time?' : 'Think about who the question is about: one person, or a whole group?',
        hard ? 'Words like "each day" or "each night" mean many measurements. A single date or time means one measurement.' : 'If different people would give different answers, the data varies.',
        statTrue ? (hard ? 'The question asks for many values, and they would not all match.' : `Each of ${g} could give a different answer, so the data varies.`) : 'There is only one answer, so no data varies.',
      ],
      hintEs: hard
        ? 'Cuenta cuántos valores pide la pregunta: ¿un solo valor, o muchos valores a lo largo del tiempo?'
        : 'Piensa en quién trata la pregunta: ¿una sola persona o todo un grupo?',
      solution: statTrue
        ? `<p><b>True.</b> ${hard ? 'The question asks for a value many times. Those values vary, so the question is statistical, even though it is about one person or place.' : 'The question is about a whole group, so the answers would be different for different people.'} That variability is what makes a question statistical.</p>`
        : `<p><b>False.</b> The question has exactly one answer. A statistical question must be answered by collecting data that varies.</p>`,
      feedback: {
        correct: statTrue ? 'Correct. Varying answers make it statistical.' : 'Correct. One answer means it is not statistical.',
        wrong(ans, d) {
          if (!d.valueOk)
            return statTrue
              ? hard
                ? 'It is about one person or place, but it asks for many values over time. Those values vary, so it is statistical.'
                : 'Would everyone give the same answer? No. Different answers mean the question is statistical.'
              : hard
                ? 'It sounds like data collection, but it asks for one value at one time. One answer means it is not statistical.'
                : 'How many different answers can this question have? Just one. That means it is not statistical.';
          return 'Your true/false choice is right. Pick the reason that talks about whether the answers vary.';
        },
      },
    };
  });

  // ---------- Write a statistical question (CR) ----------
  G.define('s1_writeStatistical', (r, o) => {
    const hard = !!o.hard;
    const grp = r.pick(GROUPS),
      g = grp.all,
      topic = r.pick(['sleep', 'homework', 'lunch', 'sports', 'pets', 'screen time', 'the beach']);
    const n = r.pick(NAMES);
    let sh;
    if (hard) {
      const [h1, h2, h3] = r.pickN(HARD_TOPICS, 3);
      sh = shuffleOptions(r, [{ html: h1.stat(n), ok: true }, { html: h2.one(n) }, { html: h3.one(n) }], 0);
    } else {
      const t = r.pick(TOPICS);
      sh = shuffleOptions(r, [{ html: t.stat(g), ok: true }, { html: t.one(g, n) }, { html: r.pick(FIXED_ONE) }], 0);
    }
    const okText = sh.options[sh.answer].html;
    return {
      type: 'cr',
      skill: 'stat-question',
      lesson: '2-1',
      title: 'Write a statistical question',
      prompt: hard
        ? `<p>Write <b>two</b> questions about ${hl(topic)} for ${hl(n)} alone: one that is <b>statistical</b> and one that is <b>not</b>. Explain what makes them different.</p>`
        : `<p>Write a <b>statistical question</b> about ${hl(topic)} that you could ask ${hl(g)}. Then explain why the answers would vary.</p>`,
      starters: hard
        ? ['Statistical: How many … each day this month?', 'Not statistical: How many … on Monday?', 'The first question varies because…']
        : ['My question is: How many…', 'The answers would vary because…', 'Each person would answer differently because…'],
      minWords: hard ? 12 : 10,
      check: { prompt: 'Which of these is also a statistical question?', options: sh.options, answer: sh.answer },
      hints: [
        hard
          ? `A question about ${n} alone is statistical only if it asks for many values, like "each day this month."`
          : 'Start with "How many…" or "How long…" and ask about everyone in the group, not one person.',
        hard ? 'Write the second question about one single day. Then say which one collects data that varies.' : 'Then say why different people would give different answers.',
        hard
          ? `Example shape: "How many minutes did ${n} spend on ${topic} each day this month?" versus "…on Monday?"`
          : `Example shape: "How many hours do ${g} spend on ${topic} each week?" The answers vary because each person is different.`,
      ],
      hintEs: hard
        ? `Una pregunta sobre ${n} solo es estadística si pide muchos valores, como "cada día de este mes".`
        : 'Empieza con "¿Cuántos…?" o "¿Cuánto tiempo…?" y pregunta a todo el grupo, no a una sola persona.',
      solution: hard
        ? `<p>A strong answer: "How many minutes did ${n} spend on ${topic} each day this month?" is statistical because it collects about 30 values that vary. "How many minutes did ${n} spend on ${topic} on Monday?" has one answer, so it is not statistical. In the check, <b>${okText}</b> is statistical because it asks for many values.</p>`
        : `<p>A good statistical question asks about the whole group, for example "How much time do ${g} spend on ${topic} each week?" The answers vary because each person has a different schedule. In the check, <b>${okText}</b> is statistical because many different answers are expected.</p>`,
      feedback: {
        correct: 'Correct. Your question anticipates variability, which makes it statistical.',
        wrong(ans, d) {
          if (!d.wroteEnough) return hard ? 'Write both questions and one sentence that explains which one collects data that varies.' : 'Write at least ten words: your question plus a sentence about why the answers vary.';
          return hard ? 'For the check, pick the question that asks for a value many times, not once.' : 'For the check, pick the question whose answers would be different for different people.';
        },
      },
    };
  });

  // ---------- Dot plot contexts ----------
  const DOTS = [
    { label: 'Crabs counted per tide pool', unit: 'crabs', thing: 'tide pools', lo: 2, hi: 9, es: 'una poza de marea' },
    { label: 'Shells collected per student', unit: 'shells', thing: 'students', lo: 0, hi: 8, es: 'un estudiante' },
    { label: 'Fish per net', unit: 'fish', thing: 'nets', lo: 3, hi: 10, es: 'una red' },
    { label: 'Hours of sun recorded per day', unit: 'hours', thing: 'days', lo: 4, hi: 12, es: 'un día' },
    { label: 'Birds seen per walk', unit: 'birds', thing: 'walks', lo: 1, hi: 8, es: 'una caminata' },
  ];
  // Half-unit measurements for the harder build (ticks every 0.5).
  const HALF = [
    { label: 'Rain per storm (inches)', unit: 'inches of rain', thing: 'storms', lo: 0, hi: 5 },
    { label: 'Wave height (feet)', unit: 'feet', thing: 'waves', lo: 1, hi: 6 },
    { label: 'Crab shell width (inches)', unit: 'inches', thing: 'crabs', lo: 2, hi: 7 },
    { label: 'Hours of sun per day', unit: 'hours', thing: 'days', lo: 4, hi: 9 },
  ];

  // ---------- Read a dot plot (num) ----------
  G.define('s1_dotRead', (r, o) => {
    const hard = !!o.hard;
    const c = r.pick(DOTS),
      n = hard ? r.int(15, 19) : r.int(9, 13);
    const vals = S.shaped(r, r.pick(['symmetric', 'skewed right', 'skewed left']), c.lo, c.hi, n);
    const cnt = S.counts(vals),
      keys = Object.keys(cnt)
        .map(Number)
        .sort((a, b) => a - b);
    const inner = keys.slice(1, -1).length ? keys.slice(1, -1) : keys;
    const kind = hard ? r.pick(['between', 'moreVs']) : r.pick(['total', 'atLeast', 'exact', 'lessThan']);
    let k = r.pick(inner);
    const stacks = (f) => keys.filter(f).map((v) => cnt[v]);
    const addUp = (f) => stacks(f).join(' + ') || '0';
    let ask, answer, setup, last;
    let a = 0,
      b = 0,
      lo2 = 0,
      hi2 = 0;
    if (kind === 'total') {
      ask = `How many ${c.thing} were surveyed in all?`;
      answer = n;
      setup = 'Count the dots in every stack, from the left end to the right end.';
      last = `Add the heights of all the stacks: ${addUp(() => true)}.`;
    } else if (kind === 'exact') {
      ask = `How many ${c.thing} had exactly ${hl(k + ' ' + c.unit)}?`;
      answer = cnt[k];
      setup = `Find ${k} on the number line first.`;
      last = `Count only the dots in the one stack directly above ${k}. Do not count any other stack.`;
    } else if (kind === 'atLeast') {
      ask = `How many ${c.thing} had ${hl(k + ' or more ' + c.unit)}?`;
      answer = vals.filter((v) => v >= k).length;
      setup = `Find ${k} on the number line first. "${k} or more" includes ${k} and everything to its right.`;
      last = `Add the stacks at ${k} and to its right: ${addUp((v) => v >= k)}.`;
    } else if (kind === 'lessThan') {
      ask = `How many ${c.thing} had ${hl('fewer than ' + k + ' ' + c.unit)}?`;
      answer = vals.filter((v) => v < k).length;
      setup = `Find ${k} on the number line first. "Fewer than ${k}" stops before ${k}.`;
      last = `Add the stacks to the left of ${k}, leaving out ${k}: ${addUp((v) => v < k)}.`;
    } else if (kind === 'between') {
      const i = r.int(0, Math.max(0, keys.length - 3));
      lo2 = keys[i];
      hi2 = keys[Math.min(keys.length - 1, i + r.int(2, 3))];
      ask = `How many ${c.thing} had from ${hl(lo2 + ' to ' + hi2 + ' ' + c.unit)}, including both ${lo2} and ${hi2}?`;
      answer = vals.filter((v) => v >= lo2 && v <= hi2).length;
      setup = `Find ${lo2} and ${hi2} on the line. Both end stacks count.`;
      last = `Add the stacks from ${lo2} through ${hi2}: ${addUp((v) => v >= lo2 && v <= hi2)}.`;
    } else {
      // how many more had k or more than had fewer than k (or the reverse), choosing a k where the groups differ
      const diffK = inner.filter((v) => vals.filter((x) => x >= v).length !== vals.filter((x) => x < v).length);
      if (diffK.length) k = r.pick(diffK);
      a = vals.filter((v) => v >= k).length;
      b = vals.filter((v) => v < k).length;
      const big = a >= b;
      ask = big
        ? `How many more ${c.thing} had ${hl(k + ' or more ' + c.unit)} than had ${hl('fewer than ' + k)}?`
        : `How many more ${c.thing} had ${hl('fewer than ' + k + ' ' + c.unit)} than had ${hl(k + ' or more')}?`;
      answer = Math.abs(a - b);
      setup = `Make two groups: the dots at ${k} and to its right, and the dots to the left of ${k}. Count each group.`;
      last = `The first group has ${addUp((v) => v >= k)} dots and the second has ${addUp((v) => v < k)} dots. Add each group, then subtract the smaller total from the larger.`;
    }
    const each = one(c.thing);
    return {
      type: 'num',
      skill: 'dot-plot',
      lesson: '2-1',
      title: hard ? 'Read the dot plot (two steps)' : 'Read the dot plot',
      prompt: `<p>The dot plot shows the number of ${c.unit} recorded for each of the ${c.thing} in a survey. Each dot is one ${each}.</p>${V.dotPlot({ values: vals, min: c.lo, max: c.hi, label: c.label, aria: 'Dot plot: ' + S.list(S.sorted(vals)) })}<p>${ask}</p>`,
      unit: '',
      answer,
      hints: ['Each dot stands for one ' + each + '. The number under a stack tells the value.', setup, last],
      hintEs: `Cada punto representa ${c.es}. El número debajo de cada columna de puntos te dice el valor.`,
      solution: `<p>${last} The answer is <b>${answer}</b>. ${kind === 'moreVs' ? `(${a} dots at ${k} or more and ${b} dots below ${k}; the difference is ${answer}.)` : 'Each dot counts once.'}</p>`,
      feedback: {
        correct: 'Correct. Each dot counts once, and the number line tells its value.',
        wrong(ans, d) {
          const v = d.value;
          if (kind === 'atLeast' && v === vals.filter((x) => x > k).length) return `${k} or more includes ${k} itself. Add the dots above ${k} too.`;
          if (kind === 'lessThan' && v === vals.filter((x) => x <= k).length) return `Fewer than ${k} does not include ${k}. Leave out the dots above ${k}.`;
          if (kind === 'exact' && v === k) return `${k} is the value on the number line. The question asks how many dots are stacked above it.`;
          if (kind === 'between' && v === vals.filter((x) => x > lo2 && x < hi2).length) return `"Including both" means the stacks at ${lo2} and ${hi2} count too.`;
          if (kind === 'moreVs' && (v === a || v === b)) return 'That is the size of just one group. The question asks how many more, so subtract the two group counts.';
          if (kind === 'moreVs' && v === a + b) return 'You added the two groups. "How many more" means subtract the smaller count from the larger.';
          if (kind === 'total' && v === keys.length) return 'You counted the stacks. Count every dot: a stack of 3 dots is 3 data values.';
          return 'Count dots, not numbers on the line. Each dot is one ' + each + '.';
        },
      },
    };
  });

  // ---------- Build a dot plot on a number line (nl) ----------
  G.define('s1_dotBuild', (r, o) => {
    const hard = !!o.hard;
    const name = r.pick(NAMES);
    let c, vals, step, n;
    if (hard) {
      c = r.pick(HALF);
      step = 0.5;
      n = r.int(6, 7);
      const ticks = [];
      for (let v = c.lo; v <= c.hi + 1e-9; v += 0.5) ticks.push(v);
      for (let t = 0; t < 50; t++) {
        vals = r.pickN(ticks, n);
        if (vals.filter((v) => v % 1 !== 0).length >= 3) break;
      }
    } else {
      c = r.pick(DOTS);
      step = 1;
      n = r.int(4, 6);
      vals = S.data(r, n, c.lo, c.hi, true);
    }
    const sortedVals = S.sorted(vals);
    return {
      type: 'nl',
      skill: 'dot-plot',
      lesson: '2-1',
      title: hard ? 'Place the data on the line (half units)' : 'Place the data on the line',
      prompt: hard
        ? `<p>${name} measured ${n} ${c.thing}. The measurements, in ${c.unit}, are ${hl(S.list(vals))}.</p><p>Build the dot plot: place one point above each value. The tick marks go up by <b>0.5</b>, and only every whole number is labeled.</p>`
        : `<p>${name} recorded the number of ${c.unit} in ${n} different ${c.thing}: ${hl(S.list(vals))}.</p><p>Build the dot plot: place one point above each data value on the number line.</p>`,
      min: c.lo,
      max: c.hi,
      step,
      labelEvery: 1,
      count: n,
      points: vals.slice(),
      hints: [
        'Each data value gets exactly one point, placed above that number on the line.',
        hard
          ? `Each tick is worth 0.5. A value like ${RX.fmt(sortedVals.find((v) => v % 1 !== 0))} sits on the unlabeled tick halfway between two whole numbers.`
          : `Start with the smallest value, ${Math.min(...vals)}, and work up to the largest, ${Math.max(...vals)}.`,
        hard ? `Put the values in order first: ${S.list(sortedVals)}. Then place them left to right.` : `The points go at ${S.list(sortedVals)}.`,
      ],
      hintEs: 'Cada dato lleva exactamente un punto, colocado encima de ese número en la recta numérica.',
      solution: `<p>Put one point above each value: <b>${S.list(sortedVals)}</b>. A dot plot shows every data value in its place on the number line.${hard ? ' Half values sit on the unlabeled ticks between whole numbers.' : ''}</p>${V.dotPlot({ values: vals, min: c.lo, max: c.hi, step, label: c.label })}`,
      feedback: {
        correct: 'Correct. Every data value has its own dot above its number.',
        wrong(ans, d) {
          const ex = (d.extra || [])[0];
          if (ex != null && hard && vals.some((v) => Math.abs(v - ex) === 0.5))
            return `You placed a point at ${RX.fmt(ex)}, one tick away from a data value. Each tick is 0.5, so count the ticks from the nearest whole number.`;
          if (ex != null) return `${RX.fmt(ex)} is not one of the data values. Check the list: ${S.list(vals)}.`;
          if (d.missing && d.missing.length) return `You still need a point at ${RX.fmt(d.missing[0])}.`;
          return 'Place exactly one point for each value in the list.';
        },
      },
    };
  });

  // ---------- Describe the shape (MC) ----------
  G.define('s1_shapeDescribe', (r, o) => {
    const hard = !!o.hard;
    const c = r.pick(DOTS);
    let kind, vals;
    for (let t = 0; t < 50; t++) {
      kind = r.pick(['symmetric', 'skewed right', 'skewed left']);
      vals = S.shaped(r, kind, c.lo, c.hi, hard ? r.int(16, 20) : r.int(11, 14));
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
        ? { html: 'Skewed right: most values are on the left, with a tail stretching to the right.', why: 'Look at both sides of the peak. They are about the same, so the data is symmetric, not skewed.' }
        : { html: 'Symmetric: the left and right sides look about the same, like a mirror.', why: 'One side has a long tail and the other does not. That is skewed, not symmetric.' },
      kind === 'skewed left'
        ? {
            html: 'Skewed right: most values are on the left, with a tail stretching to the right.',
            why: 'The tail stretches toward the smaller values on the left. "Skewed" names the side of the tail, so this is skewed left.',
          }
        : {
            html: 'Skewed left: most values are on the right, with a tail stretching to the left.',
            why:
              kind === 'symmetric'
                ? 'The two sides balance. A skewed distribution has one long tail; this one does not.'
                : 'The tail stretches toward the larger values on the right. A skewed distribution is named for the side with the tail.',
          },
      {
        html: hard ? 'No shape: the counts go up and down, so the data has no pattern.' : 'There is no shape because the dots are different heights.',
        why: 'Different counts are exactly what creates the shape. Look at where the data piles up and where it thins out.',
      },
    ];
    const sh = shuffleOptions(r, opts, 0);
    const cnt = S.counts(vals);
    const cols = [];
    for (let v = c.lo; v <= c.hi; v++) cols.push(v);
    const display = hard
      ? V.table([[c.label.replace(/ per .*/, '')].concat(cols.map(String)), ['Number of ' + c.thing].concat(cols.map((v) => String(cnt[v] || 0)))], { header: true, cls: 'compact' })
      : V.dotPlot({ values: vals, min: c.lo, max: c.hi, label: c.label, aria: 'Dot plot: ' + S.list(S.sorted(vals)) });
    return {
      type: 'mc',
      skill: 'shape',
      lesson: '2-1',
      title: hard ? 'Describe the shape from a table' : 'Describe the shape',
      prompt: hard
        ? `<p>The table shows ${c.label.toLowerCase()} for ${vals.length} ${c.thing}. There is no plot. Picture the dot plot in your head.</p>${display}<p>Which statement best describes the <b>shape</b> of the distribution?</p>`
        : `<p>The dot plot shows ${c.label.toLowerCase()}.</p>${display}<p>Which statement best describes the <b>shape</b> of the distribution?</p>`,
      options: sh.options,
      answer: sh.answer,
      hints: [
        hard
          ? 'Each count is the height of a stack of dots. Find the biggest count (the peak), then compare the counts on each side of it.'
          : 'Find the tallest stack (the peak). Then compare the left side of the peak with the right side.',
        'If one side stretches out much farther than the other, that long side is the tail, and the data is skewed toward it.',
        kind === 'symmetric'
          ? 'Compare how fast the counts drop off on each side of the peak. Are the two sides about the same?'
          : `Look at which side of the peak has small counts stretching farther: the ${kind.split(' ')[1] === 'right' ? 'larger' : 'smaller'} values or the other side?`,
      ],
      hintEs: hard
        ? 'Cada número es la altura de una columna de puntos. Busca el número más grande (el pico) y compara los números a cada lado.'
        : 'Busca la columna más alta (el pico). Luego compara el lado izquierdo del pico con el lado derecho.',
      solution: `<p>The distribution is <b>${kind}</b>. ${kind === 'symmetric' ? 'The two sides of the peak mirror each other.' : `Most values cluster on one side and a thinner tail stretches to the ${kind.split(' ')[1]}. A skewed distribution is named for the direction of its tail.`}</p>${hard ? V.dotPlot({ values: vals, min: c.lo, max: c.hi, label: c.label }) : ''}`,
      feedback: {
        correct: 'Correct. Shape describes where the data piles up and which way the tail points.',
        wrong(a) {
          return (sh.options[a] && sh.options[a].why) || 'Find the peak, then decide which side has the long tail.';
        },
      },
    };
  });

  // ---------- Select all true features (MS) ----------
  G.define('s1_featuresMS', (r, o) => {
    const c = r.pick(DOTS),
      hard = !!o.hard;
    let vals, cnt, keys;
    for (let t = 0; t < 60; t++) {
      vals = S.shaped(r, r.pick(['symmetric', 'skewed right', 'skewed left']), c.lo, c.hi, hard ? 15 : 11);
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
    const each = one(c.thing);
    const opts = [
      { html: `The peak is at ${peak} ${c.unit}.`, ok: true, tag: 'peak' },
      { html: `There are ${vals.length} data values in all.`, ok: true, tag: 'count' },
      { html: `The peak is at ${wrongPeak} ${c.unit}.`, ok: false, tag: 'peak' },
    ];
    if (!hard) opts.push({ html: `There are ${vals.length + r.pick([-2, 2, 3])} data values in all.`, ok: false, tag: 'count' });
    if (gaps.length) opts.push({ html: `There is a gap at ${gaps[0]} ${c.unit}: no ${each} had that value.`, ok: true, tag: 'gap' });
    else opts.push({ html: `There is a gap at ${r.pick(keys.filter((k) => k > lo && k < hi).length ? keys.filter((k) => k > lo && k < hi) : keys)} ${c.unit}.`, ok: false, tag: 'gap' });
    const above = vals.filter((v) => v > peak).length,
      below = vals.filter((v) => v < peak).length;
    const things = (k) => (k === 1 ? each : c.thing);
    if (hard) {
      // Counting statements whose near-miss version also counts the peak stack.
      const aT = r.chance(0.5),
        bT = r.chance(0.5);
      const aN = aT ? above : above + maxC,
        bN = bT ? below : below + maxC;
      opts.push({ html: `Exactly ${aN} ${things(aN)} had more than ${peak} ${c.unit}.`, ok: aT, tag: 'above' });
      opts.push({ html: `Exactly ${bN} ${things(bN)} had fewer than ${peak} ${c.unit}.`, ok: bT, tag: 'below' });
    }
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
        hard
          ? `Check each statement against the stacks. "More than ${peak}" means only the stacks to the right of ${peak}; "fewer than ${peak}" means only the stacks to its left.`
          : `Add up the stacks for the total. Then look for the tallest stack, and for any value between ${lo} and ${hi} with no dots.`,
      ],
      hintEs: 'El pico es el valor con la columna de puntos más alta. Un hueco es un valor entre el menor y el mayor que no tiene ningún punto.',
      solution: `<p>The tallest stack is above <b>${peak}</b>, so that is the peak. Counting every dot gives <b>${vals.length}</b> values. ${gaps.length ? `No dots sit above <b>${gaps[0]}</b>, so there is a gap there.` : `Every value from ${lo} to ${hi} has at least one dot, so there is no gap.`}${hard ? ` Exactly <b>${above}</b> ${things(above)} had more than ${peak} and <b>${below}</b> had fewer than ${peak}. The ${maxC} dots at the peak are in neither group.` : ''}</p>`,
      feedback: {
        correct: 'Correct. Peak, gap, and total count all come straight from the stacks of dots.',
        wrong(ans, d) {
          if (d.extra && d.extra.length) {
            const t = sh.options[d.extra[0]].tag;
            if (t === 'peak') return 'Check the peak again. It is the value with the most dots, not the largest value.';
            if (t === 'gap') return 'A gap is a value inside the data with zero dots. Look again at that spot on the line.';
            if (t === 'above') return `"More than ${peak}" does not include the ${peak} stack. Count only the stacks to its right.`;
            if (t === 'below') return `"Fewer than ${peak}" does not include the ${peak} stack. Count only the stacks to its left.`;
            return 'Count the dots one stack at a time and add the stacks.';
          }
          const m = (d.missing || []).map((i) => sh.options[i].tag);
          if (m.includes('gap')) return 'You missed the gap. Look for a value between the smallest and largest with no dots.';
          if (m.includes('above') || m.includes('below')) return `Recount the dots on each side of ${peak}, leaving out the peak stack. A counting statement you skipped is true.`;
          return 'You missed a true statement. Check the peak, the total count, and whether any value inside the data has no dots.';
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
  const whyOf = (sh, a, fallback) => (sh.options[a] && sh.options[a].why) || fallback;

  // ---------- Which interval holds the value (MC) ----------
  G.define('s2_whichBin', (r, o) => {
    const hard = !!o.hard;
    const c = r.pick(CTX);
    // hard: equal but unfriendly widths (4, 6, 15, 25) that start at an unusual number
    const w = hard ? r.pick([4, 6, 15, 25]) : r.pick([5, 10]);
    const start = hard ? w * r.int(1, 3) + r.pick([1, 2, 3]) : r.pick([0, 10, 20]);
    const bs = bins(start, w, 4);
    // choose a boundary value to force the "19 in 10–19 or 20–29?" decision
    const bi = r.int(1, 2);
    const v = r.chance(0.5) ? bs[bi].hi : bs[bi].lo;
    const edge = v === bs[bi].hi;
    const nb = bs[edge ? bi + 1 : bi - 1],
      far = bs[edge ? bi - 1 : bi + 1];
    const opts = [
      { html: bs[bi].label, ok: true },
      {
        html: nb.label,
        why: edge
          ? `${nb.label} starts at ${nb.lo}. The value ${v} is less than ${nb.lo}, so it belongs in the interval that ends at ${v}.`
          : `${nb.label} ends at ${nb.hi}. The value ${v} is greater than ${nb.hi}, so it belongs in the next interval, which starts at ${v}.`,
      },
      { html: `Both ${bs[bi].label} and ${nb.label}`, why: 'Intervals in a histogram never overlap. Every value belongs to exactly one interval.' },
      { html: far.label, why: `${v} is not between ${far.lo} and ${far.hi}.` },
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
        `An interval like ${bs[0].label} includes ${bs[0].lo}, ${bs[0].hi}, and every whole number between them.`,
        `Find the interval whose first number is at or below ${v} and whose last number is at or above ${v}.`,
        `Test each interval: is its first number ≤ ${v}, and is its last number ≥ ${v}? Only one interval passes both tests.`,
      ],
      hintEs: `Un intervalo como ${bs[0].label} incluye el ${bs[0].lo}, el ${bs[0].hi} y todos los números enteros entre ellos.`,
      solution: `<p>${v} is between ${bs[bi].lo} and ${bs[bi].hi}, including the endpoints, so it belongs in <b>${bs[bi].label}</b>. Intervals do not overlap, so a value never goes in two bars.${hard ? ` Each interval here holds ${w} whole numbers, from its first number to its last.` : ''}</p>`,
      feedback: {
        correct: `Correct. ${v} fits inside ${bs[bi].label} and no other interval.`,
        wrong: (a) => whyOf(sh, a, 'Check both endpoints of each interval. A value belongs to exactly one interval.'),
      },
    };
  });

  // ---------- Frequency table from data (table) ----------
  G.define('s2_freqTable', (r, o) => {
    const c = r.pick(CTX),
      hard = !!o.hard;
    // hard: five intervals of an unfriendly width that start off a round number, with edge values forced in
    const w = hard ? r.pick([6, 8, 15]) : r.pick([5, 10]),
      start = hard ? r.pick([2, 5, 12]) : r.pick([0, 10]);
    const k = hard ? 5 : 4,
      bs = bins(start, w, k);
    let vals, cts;
    for (let t = 0; t < 40; t++) {
      vals = S.data(r, hard ? 16 : 12, start, start + w * k - 1);
      if (hard) {
        vals[0] = bs[1].lo;
        vals[1] = bs[2].hi;
        vals[2] = bs[3].lo;
      }
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
      prompt: `<p>Here are the ${c.what} for ${vals.length} ${c.who}:</p><p class="data-list">${hl(S.list(shown))}</p><p>Complete the frequency table. Count how many values fall in each interval.${hard ? ` Each interval is ${w} numbers wide.` : ''}</p>`,
      rows,
      header: true,
      inputs: bs.map((b, i) => ({ id: 'b' + i, answer: cts[i] })),
      hints: [
        'Go through the list one value at a time. Decide which interval each value belongs to, and make a tally mark there.',
        `Values from ${bs[0].lo} to ${bs[0].hi} go in the first interval. ${bs[1].lo} to ${bs[1].hi} go in the second, and so on.`,
        `Check: your frequencies must add up to ${vals.length}, the number of values.${hard ? ` Watch the edge values, like ${bs[1].lo} and ${bs[2].hi}.` : ''}`,
      ],
      hintEs: 'Revisa la lista un valor a la vez. Decide a qué intervalo pertenece cada valor y haz una marca de conteo allí.',
      solution: `<p>Sorted data: ${S.list(S.sorted(vals))}.</p><p>${bs.map((b, i) => `${b.label}: <b>${cts[i]}</b>`).join(' · ')}. The counts add to ${vals.length}, one for each value.</p>`,
      feedback: {
        correct: `Correct. The frequencies add to ${vals.length}, so every value was counted exactly once.`,
        wrong(ans, d) {
          const got = bs.map((b, i) => RX.parseNum((ans || {})['b' + i]) || 0);
          const total = S.sum(got);
          if (total !== vals.length) return `Your frequencies add to ${total}, but there are ${vals.length} values. A value was skipped or counted twice.`;
          const w0 = (d.wrong || [])[0];
          const i = Number(String(w0).slice(1));
          const edge = bs.findIndex((b, j) => j > 0 && got[j] === cts[j] - 1 && got[j - 1] === cts[j - 1] + 1);
          if (edge > 0) return `A value equal to ${bs[edge].lo} went into ${bs[edge - 1].label}. ${bs[edge - 1].label} stops at ${bs[edge - 1].hi}, so ${bs[edge].lo} belongs in ${bs[edge].label}.`;
          if (!Number.isInteger(i) || !bs[i]) return 'Recount each interval. Values equal to an interval’s first or last number belong in it.';
          return `Recount the interval ${bs[i].label}. Values equal to ${bs[i].lo} or ${bs[i].hi} belong in it too.`;
        },
      },
    };
  });

  // ---------- Interval mistake (error) ----------
  G.define('s2_binError', (r, o) => {
    const hard = !!o.hard;
    const name = r.pick(NAMES),
      c = r.pick(CTX);
    const good = bins(0, 10, 4);
    const vals = S.data(r, 10, 0, 39);
    // normal: always the overlap mistake. hard: overlap, a skipped interval, or unequal widths.
    const kind = hard ? r.pick(['overlap', 'gap', 'unequal']) : 'overlap';
    let bad, gi, boundary;
    if (kind === 'overlap') {
      bad = ['0–10', '10–20', '20–30', '30–40'];
      boundary = r.pick([10, 20, 30]);
      if (!vals.includes(boundary)) vals[r.int(0, 9)] = boundary;
      gi = binOf(good, boundary);
    } else if (kind === 'gap') {
      gi = r.int(1, 2);
      bad = good.filter((b, i) => i !== gi).map((b) => b.label);
      bad.push('40–49');
      boundary = good[gi].lo + r.int(2, 7);
      if (!vals.includes(boundary)) vals[r.int(0, 9)] = boundary;
    } else {
      bad = ['0–9', '10–14', '15–19', '20–39'];
      gi = r.int(2, 3);
      boundary = good[gi].lo + r.int(1, 8);
      if (!vals.includes(boundary)) vals[r.int(0, 9)] = boundary;
    }
    const cts = countBins(good, vals);
    const other = kind === 'overlap' ? bad[gi + 1] || bad[gi - 1] : '';
    let opts;
    if (!hard) {
      opts = [
        { html: `The intervals overlap. A value like ${boundary} fits in two intervals, so it could be counted twice.`, ok: true },
        { html: 'The intervals are too wide. Every histogram must use intervals of width 5.', why: 'Any equal width works. Width 10 is a fine choice. The problem is where the intervals start and stop.' },
        { html: 'There should be a space between the intervals so the bars do not touch.', why: 'Histogram bars are supposed to touch. The intervals must cover every number with no gaps and no overlaps.' },
        { html: 'There is no mistake. The intervals are fine.', why: `Where does ${boundary} go: ${bad[gi]} or ${other}? When one value fits two intervals, the intervals overlap.` },
      ];
    } else {
      const notIt = {
        overlap: 'Check whether any single value fits in two of the intervals.',
        gap: `Look for a stretch of numbers that has no interval at all. Where would ${boundary} go?`,
        unequal: 'Compare how many numbers each interval holds. Are they all the same width?',
      }[kind];
      opts = [
        { html: 'The intervals overlap, so a value on an edge could be counted in two bars.', ok: kind === 'overlap', why: notIt },
        { html: 'An interval is missing, so some data values would have no bar at all.', ok: kind === 'gap', why: notIt },
        { html: 'The intervals are not the same width, so a wide interval gets a tall bar just for being wide.', ok: kind === 'unequal', why: notIt },
        { html: 'There is no mistake. The intervals cover the data, so they are fine.', why: notIt },
      ];
    }
    const okIdx = opts.findIndex((x) => x.ok);
    const sh = shuffleOptions(r, opts, okIdx);
    const goodList = good.map((b) => b.label).join(', ');
    const explain = {
      overlap: `The intervals <b>overlap</b>: ${boundary} belongs to both ${bad[gi]} and ${other}.`,
      gap: `An interval is <b>missing</b>: nothing covers ${good[gi].label}, so a value like ${boundary} has no bar.`,
      unequal: `The intervals have <b>unequal widths</b>: 20–39 holds 20 numbers while 10–14 holds only 5, so the bars cannot be compared fairly.`,
    }[kind];
    return {
      type: 'error',
      skill: 'histogram',
      lesson: '2-2',
      title: 'Find the mistake',
      prompt: `<p>${name} is making a histogram of ${c.what}. The data: ${hl(S.list(S.sorted(vals)))}.</p><p>What is wrong with the intervals ${name} chose?</p>`,
      work: `Intervals: &nbsp; ${bad.join(' &nbsp;|&nbsp; ')}`,
      options: sh.options,
      answer: sh.answer,
      fix: { label: `Using the intervals ${goodList}, how many values are in ${good[gi].label}?`, answer: cts[gi] },
      hints: [
        hard ? `Check three things: does any value fit two intervals, is any value left without an interval, and are all the intervals the same width?` : `Look at the value ${boundary} in the data. Which of ${name}'s intervals does it belong to?`,
        'Good intervals are all the same width and do not share any numbers. Each ends just before the next one begins, like 0–9 and 10–19.',
        `With the intervals ${goodList}, count the values from ${good[gi].lo} to ${good[gi].hi}.`,
      ],
      hintEs: hard
        ? 'Revisa tres cosas: ¿algún valor cabe en dos intervalos?, ¿algún valor se queda sin intervalo?, ¿todos los intervalos tienen el mismo ancho?'
        : `Mira el valor ${boundary} en los datos. ¿A cuál de los intervalos de ${name} pertenece?`,
      solution: `<p>${explain} Correct intervals are equal in width and never share a value, such as ${goodList}. With those, the interval ${good[gi].label} holds <b>${cts[gi]}</b> values.</p>`,
      feedback: {
        correct: 'Correct. Intervals must be equal in width and cover every value exactly once: no overlaps, no gaps.',
        wrong(ans, d) {
          if (!d.mistakeOk) return whyOf(sh, ans && ans.mistake, `Try placing ${boundary}. Does it fit in exactly one interval?`);
          return `You found the mistake. Now count the values from ${good[gi].lo} through ${good[gi].hi} in the data list.`;
        },
      },
    };
  });

  // ---------- Read a histogram (num) ----------
  G.define('s2_readHist', (r, o) => {
    const hard = !!o.hard;
    const c = r.pick(CTX),
      w = hard ? r.pick([5, 15]) : r.pick([5, 10]),
      start = r.pick([0, 10, 20]),
      bs = bins(start, w, hard ? 5 : r.pick([4, 5]));
    let cts = bs.map(() => r.int(1, 8));
    const total = S.sum(cts);
    const kind = hard ? r.pick(['span', 'moreThan', 'notIn']) : r.pick(['total', 'atLeast', 'lessThan', 'oneBin']);
    const bi = r.int(1, bs.length - 2);
    let bj = r.pick(bs.map((b, i) => i).filter((i) => i !== bi && cts[i] !== cts[bi]));
    if (bj == null) {
      bj = bi === 1 ? 3 : 1;
      cts[bj] = cts[bi] === 8 ? 2 : cts[bi] + 2;
    }
    const T = S.sum(cts);
    let ask, answer, setup, last;
    if (kind === 'total') {
      ask = `How many ${c.who} are in the data set?`;
      answer = T;
      setup = 'Every bar counts. Read each bar height on the left axis.';
      last = `Add the heights of all the bars: ${cts.join(' + ')}.`;
    } else if (kind === 'atLeast') {
      ask = `How many ${c.who} had ${hl(bs[bi].lo + ' or more ' + c.unit)}?`;
      answer = S.sum(cts.slice(bi));
      setup = `"${bs[bi].lo} or more" starts with the ${bs[bi].label} bar and includes every bar to its right.`;
      last = `Add the bars for ${bs
        .slice(bi)
        .map((b) => b.label)
        .join(', ')}: ${cts.slice(bi).join(' + ')}.`;
    } else if (kind === 'lessThan') {
      ask = `How many ${c.who} had ${hl('fewer than ' + bs[bi].lo + ' ' + c.unit)}?`;
      answer = S.sum(cts.slice(0, bi));
      setup = `"Fewer than ${bs[bi].lo}" stops just before the ${bs[bi].label} bar.`;
      last = `Add the bars to the left of ${bs[bi].lo}: ${cts.slice(0, bi).join(' + ')}.`;
    } else if (kind === 'oneBin') {
      ask = `How many ${c.who} had from ${hl(bs[bi].lo)} to ${hl(bs[bi].hi + ' ' + c.unit)}?`;
      answer = cts[bi];
      setup = `Find the bar labeled ${bs[bi].label}.`;
      last = `Read the height of the ${bs[bi].label} bar on the left axis. The height is the count.`;
    } else if (kind === 'span') {
      const i0 = r.int(0, bs.length - 3);
      ask = `How many ${c.who} had from ${hl(bs[i0].lo)} to ${hl(bs[i0 + 2].hi + ' ' + c.unit)}?`;
      answer = cts[i0] + cts[i0 + 1] + cts[i0 + 2];
      setup = `The stretch from ${bs[i0].lo} to ${bs[i0 + 2].hi} covers three intervals: ${bs[i0].label}, ${bs[i0 + 1].label}, and ${bs[i0 + 2].label}.`;
      last = `Add those three bar heights: ${cts[i0]} + ${cts[i0 + 1]} + ${cts[i0 + 2]}.`;
    } else if (kind === 'moreThan') {
      const [a, b] = cts[bi] > cts[bj] ? [bi, bj] : [bj, bi];
      ask = `How many more ${c.who} had from ${bs[a].lo} to ${bs[a].hi} ${c.unit} than from ${bs[b].lo} to ${bs[b].hi} ${c.unit}?`;
      answer = cts[a] - cts[b];
      setup = `Read two bars: ${bs[a].label} and ${bs[b].label}.`;
      last = `The ${bs[a].label} bar is ${cts[a]} tall and the ${bs[b].label} bar is ${cts[b]} tall. Subtract the shorter from the taller.`;
    } else {
      ask = `How many ${c.who} did <b>not</b> have from ${hl(bs[bi].lo)} to ${hl(bs[bi].hi + ' ' + c.unit)}?`;
      answer = T - cts[bi];
      setup = `Find the total of all the bars, then take away the ${bs[bi].label} bar.`;
      last = `The total is ${cts.join(' + ')}. Subtract the ${bs[bi].label} bar, which is ${cts[bi]}.`;
    }
    return {
      type: 'num',
      skill: 'histogram',
      lesson: '2-2',
      title: hard ? 'Read the histogram (two steps)' : 'Read the histogram',
      prompt: `<p>The histogram shows ${c.what}.</p>${hist(bs, cts, c)}<p>${ask}</p>`,
      unit: c.who,
      answer,
      hints: ['The height of each bar is the frequency: how many values fall in that interval.', setup, last],
      hintEs: 'La altura de cada barra es la frecuencia: cuántos valores caen en ese intervalo.',
      solution: `<p>${setup} ${last} The answer is <b>${answer}</b> ${c.who}.</p>`,
      feedback: {
        correct: 'Correct. Bar heights are counts, and adding bars combines intervals.',
        wrong(ans, d) {
          const v = d.value;
          if (kind === 'atLeast' && v === S.sum(cts.slice(bi + 1))) return `${bs[bi].lo} or more includes the whole ${bs[bi].label} bar. Add it in.`;
          if (kind === 'lessThan' && v === S.sum(cts.slice(0, bi + 1))) return `Fewer than ${bs[bi].lo} does not include the ${bs[bi].label} bar.`;
          if ((kind === 'oneBin' || kind === 'notIn') && (v === bs[bi].lo || v === bs[bi].hi)) return 'You read an interval label. The question asks for a count, which is a bar height.';
          if (kind === 'notIn' && v === cts[bi]) return `That is the number who <b>did</b> fall in ${bs[bi].label}. The question asks for everyone else.`;
          if (kind === 'notIn' && v === T) return `That is every ${c.who.replace(/s$/, '')}. Take away the ${bs[bi].label} bar.`;
          if (kind === 'moreThan' && (v === cts[bi] || v === cts[bj])) return '"How many more" compares two bars. Subtract one bar height from the other.';
          if (kind === 'moreThan' && v === cts[bi] + cts[bj]) return 'You added the two bars. "How many more" means subtract.';
          if (kind === 'span' && v < answer) return 'The stretch covers three whole intervals. Make sure you added all three bars.';
          if (kind === 'total' && v === bs.length) return 'You counted the bars. Add the bar heights instead: each height is a count.';
          return 'Read each bar height from the left axis, then combine the bars the question asks about.';
        },
      },
    };
  });

  // ---------- Shape of a histogram (MC) ----------
  G.define('s2_shapeHist', (r, o) => {
    const hard = !!o.hard;
    const c = r.pick(CTX);
    const kind = r.pick(['symmetric', 'skewed right', 'skewed left']);
    let bs, cts;
    if (hard) {
      // seven narrower intervals and noisier bars; the answer must name the shape AND the peak interval
      bs = bins(r.pick([0, 10]), 5, 7);
      const base = kind === 'symmetric' ? [1, 2, 4, 7, 4, 2, 1] : kind === 'skewed right' ? [8, 6, 4, 2, 2, 1, 1] : [1, 1, 2, 2, 4, 6, 8];
      const pk = base.indexOf(Math.max(...base));
      cts = base.map((x, i) => (i === pk ? x + 1 : x + r.int(0, 1)));
    } else {
      bs = bins(r.pick([0, 10]), 10, 5);
      const base = kind === 'symmetric' ? [1, 3, 6, 3, 1] : kind === 'skewed right' ? [7, 4, 2, 1, 1] : [1, 1, 2, 4, 7];
      cts = base.map((x) => x + r.int(0, 1));
    }
    const why = {
      symmetric: 'Compare the bars on each side of the tallest bar. They are nearly mirror images, so this is symmetric.',
      'skewed right': 'The tall bars are on the left and the short tail trails to the right. A skewed shape is named for the direction of its tail.',
      'skewed left': 'The tall bars are on the right and the short tail trails to the left. A skewed shape is named for the direction of its tail.',
    };
    const peakI = cts.indexOf(Math.max(...cts));
    let opts;
    if (hard) {
      const Kind = (k) => k[0].toUpperCase() + k.slice(1);
      const wrongKind = kind === 'symmetric' ? r.pick(['skewed right', 'skewed left']) : kind === 'skewed right' ? 'skewed left' : 'skewed right';
      const farI = peakI <= 3 ? bs.length - 1 : 0;
      opts = [
        { html: `${Kind(kind)}, and the tallest bar is the ${bs[peakI].label} interval.`, ok: true },
        { html: `${Kind(kind)}, and the tallest bar is the ${bs[farI].label} interval.`, why: `The shape is right, but read the peak again. The tallest bar is not at ${bs[farI].label}.` },
        { html: `${Kind(wrongKind)}, and the tallest bar is the ${bs[peakI].label} interval.`, why: `The peak is right, but check the tail. ${why[kind]}` },
        { html: 'Uniform, because each of the seven bars covers the same width.', why: 'Equal widths are true of every histogram. Uniform would mean the bars are about the same height, and they are not.' },
      ];
    } else {
      const txt = {
        symmetric: 'Symmetric: the bars on both sides of the tallest bar are about the same.',
        'skewed right': 'Skewed right: the tallest bars are on the left and the bars get shorter toward the right.',
        'skewed left': 'Skewed left: the tallest bars are on the right and the bars get shorter toward the left.',
      };
      opts = Object.keys(txt).map((k) => (k === kind ? { html: txt[k], ok: true } : { html: txt[k], why: why[kind] }));
      opts.push({ html: 'Uniform: every bar is about the same height, so no part of the data piles up.', why: 'The bars are clearly different heights. Uniform means flat, which this is not.' });
    }
    const sh = shuffleOptions(r, opts, opts.findIndex((x) => x.ok));
    return {
      type: 'mc',
      skill: 'shape',
      lesson: '2-2',
      title: hard ? 'Describe the shape and the peak' : 'Describe the shape of the histogram',
      prompt: `<p>The histogram shows ${c.what}.</p>${hist(bs, cts, c, hard ? { width: 460 } : {})}<p>Which statement describes the <b>shape</b> of the distribution${hard ? ' and where it peaks' : ''}?</p>`,
      options: sh.options,
      answer: sh.answer,
      hints: [
        'Find the tallest bar. Then look at how the bars change to its left and to its right.',
        'If the bars get shorter in one direction only, that direction is the tail. The shape is skewed toward the tail.',
        hard
          ? `The tallest bar is ${cts[peakI]} high. Now compare the bars on its left with the bars on its right: which side trails off farther?`
          : 'Compare the two sides of the tallest bar: do they drop off the same way, or does one side trail off farther?',
      ],
      hintEs: 'Busca la barra más alta. Luego observa cómo cambian las barras a su izquierda y a su derecha.',
      solution: `<p>The shape is <b>${kind}</b>${hard ? `, and the tallest bar is <b>${bs[peakI].label}</b>` : ''}. ${why[kind]}</p>`,
      feedback: {
        correct: 'Correct. Shape is read from the pattern of bar heights, and skew is named for the tail.',
        wrong: (a) => whyOf(sh, a, 'Find the tallest bar, then see which way the shorter bars trail off.'),
      },
    };
  });

  // ---------- Why no gaps between bars / why equal widths (CR) ----------
  G.define('s2_noGapsCR', (r, o) => {
    const hard = !!o.hard;
    const name = r.pick(NAMES),
      c = r.pick(CTX),
      w = r.pick([5, 10]),
      start = r.pick([0, 10]),
      bs = bins(start, w, 4);
    if (hard) {
      // Unequal widths make one bar look like the most common interval.
      const a = start,
        L = [`${a}–${a + w - 1}`, `${a + w}–${a + 3 * w - 1}`, `${a + 3 * w}–${a + 4 * w - 1}`];
      const sh = shuffleOptions(
        r,
        [
          { html: bs.map((b) => b.label).join(', '), ok: true },
          { html: [a, a + w, a + 2 * w, a + 3 * w].map((x) => `${x}–${x + w}`).join(', '), tag: 'overlap' },
          { html: `${a}–${a + w - 1}, ${a + w}–${a + 3 * w - 1}, ${a + 3 * w}–${a + 5 * w - 1}`, tag: 'unequal' },
        ],
        0,
      );
      return {
        type: 'cr',
        skill: 'histogram',
        lesson: '2-2',
        title: 'Why must intervals be equal?',
        prompt: `<p>${name} made a histogram of ${c.what} using the intervals ${L.map(hl).join(', ')}. The middle bar is the tallest, so ${name} says, "Most of the data is in the middle interval."</p><p>Explain what is wrong with ${name}'s intervals and why it makes the claim unfair.</p>`,
        starters: ['The intervals are not…', `The middle interval holds ${2 * w} numbers, but…`, 'A fair histogram needs…'],
        minWords: 12,
        check: { prompt: `Which set of intervals would fix ${name}'s histogram?`, options: sh.options, answer: sh.answer },
        hints: [
          `Count how many whole numbers each interval holds. ${L[0]} holds ${w}. How many does ${L[1]} hold?`,
          'A wider interval collects more values just because it covers more numbers.',
          `Equal intervals of width ${w} would split ${L[1]} into two bars. Then compare the bars fairly.`,
        ],
        hintEs: `Cuenta cuántos números enteros tiene cada intervalo. ${L[0]} tiene ${w}. ¿Cuántos tiene ${L[1]}?`,
        solution: `<p>The intervals are <b>not the same width</b>: ${L[1]} holds ${2 * w} numbers while the others hold ${w}. The middle bar is tall partly because it covers twice as many numbers, so the claim is unfair. Equal intervals such as <b>${bs.map((b) => b.label).join(', ')}</b> fix it: no overlaps, no gaps, same width.</p>`,
        feedback: {
          correct: 'Correct. Equal widths let you compare bar heights fairly.',
          wrong(ans, d) {
            if (!d.wroteEnough) return 'Write at least twelve words. Say how wide each interval is and why that matters.';
            const t = sh.options[ans && ans.check] ? sh.options[ans.check].tag : '';
            if (t === 'overlap') return `Those intervals overlap: ${a + w} would fit in two of them. Each interval should end one number before the next begins.`;
            if (t === 'unequal') return 'Those intervals still have different widths, so a wide bar would still look too tall.';
            return 'For the check, choose intervals that all hold the same number of values and do not overlap.';
          },
        },
      };
    }
    const sh = shuffleOptions(
      r,
      [
        { html: 'The intervals are next to each other with no numbers left out, so the bars touch.', ok: true },
        { html: 'The bars touch to make the graph look neater and easier to color in.' },
        { html: 'The data values are all the same, so the bars have to touch.' },
        { html: 'The bars touch because the frequencies are large numbers.' },
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
        'Ask: is any number skipped between two intervals? If not, what sits between the bars?',
      ],
      hintEs: 'Piensa en lo que muestra el eje horizontal: ¿categorías separadas o una recta numérica continua?',
      solution: `<p>A histogram's horizontal axis is a number line split into intervals. The intervals ${bs.map((b) => b.label).join(', ')} sit side by side with <b>no numbers left out</b>, so the bars have nothing between them and they touch. A bar graph shows separate categories, which is why its bars have spaces.</p>`,
      feedback: {
        correct: 'Correct. Touching bars show that the intervals are continuous, with no values skipped.',
        wrong(ans, d) {
          if (!d.wroteEnough) return 'Write at least ten words. Say something about the intervals and the numbers between them.';
          return 'For the check, choose the reason that talks about the intervals covering every number. Looks and size do not decide it.';
        },
      },
    };
  });

  // ---------- Match data to its histogram (rep) ----------
  G.define('s2_matchHist', (r, o) => {
    const hard = !!o.hard;
    const c = r.pick(CTX),
      w = r.pick([5, 10]),
      start = r.pick([0, 10]),
      bs = bins(start, w, 4);
    let cts, vals, shifted;
    if (hard) {
      // Raw data instead of a frequency table; the near-miss histogram puts edge values in the wrong bar.
      for (let t = 0; t < 60; t++) {
        vals = S.data(r, 12, start, start + 4 * w - 1);
        vals[0] = bs[1].lo;
        vals[1] = bs[2].lo;
        cts = countBins(bs, vals);
        shifted = bs.map((b, i) => vals.filter((v) => (v > b.lo || (i === 0 && v === b.lo)) && v <= b.hi + (i < 3 ? 1 : 0)).length);
        if (new Set(cts).size >= 3 && shifted.join() !== cts.join()) break;
      }
    } else {
      for (let t = 0; t < 20; t++) {
        cts = bs.map(() => r.int(1, 7));
        if (new Set(cts).size >= 3) break;
      }
    }
    const rev = cts.slice().reverse();
    const swapped = cts.slice();
    [swapped[0], swapped[1]] = [swapped[1], swapped[0]];
    const yMax = Math.max(...cts, ...(shifted || [0])) + 1;
    const mk = (cc) => hist(bs, cc, c, { width: 230, height: 170, yMax, showCounts: false });
    const opts = [{ html: mk(cts), ok: true }];
    const seen = new Set([cts.join()]);
    const add = (cc, why) => {
      if (opts.length < 4 && !seen.has(cc.join())) {
        seen.add(cc.join());
        opts.push({ html: mk(cc), why });
      }
    };
    if (hard) add(shifted, `This one puts values like ${bs[1].lo} in the bar before. ${bs[1].lo} is the first number of ${bs[1].label}, so it belongs in that bar.`);
    add(rev, 'This histogram has the bars in reverse order. Read the interval labels under each bar.');
    add(swapped, `The first two bars are swapped. The ${bs[0].label} bar should have height ${cts[0]}.`);
    add(
      cts.map((x, i) => (i === 2 ? x + 2 : x)),
      `The ${bs[2].label} bar is too tall. ${hard ? 'Recount' : 'The table says'} ${hard ? 'the values in that interval.' : cts[2] + '.'}`,
    );
    const sh = shuffleOptions(r, opts, 0);
    const shownVals = hard ? r.shuffle(vals.slice()) : [];
    return {
      type: 'rep',
      skill: 'histogram',
      lesson: '2-2',
      title: hard ? 'Match the data to its histogram' : 'Match the table to its histogram',
      prompt: hard
        ? `<p>Here are the ${c.what} for ${vals.length} ${c.who}: ${hl(S.list(shownVals))}.</p><p>Which histogram, with intervals ${bs.map((b) => b.label).join(', ')}, shows this data?</p>`
        : `<p>Which histogram shows the data in this frequency table of ${c.what}?</p>${V.table([['Interval', 'Frequency']].concat(bs.map((b, i) => [b.label, String(cts[i])])), { header: true, cls: 'compact' })}`,
      options: sh.options,
      answer: sh.answer,
      layout: 'cards',
      hints: [
        hard ? 'First sort the values into the four intervals and count each one. Then find the histogram with those heights.' : 'Each row of the table becomes one bar. The interval is the label; the frequency is the height.',
        hard ? `Watch the edge values: ${bs[1].lo} belongs in ${bs[1].label}, not ${bs[0].label}.` : `The first bar, ${bs[0].label}, should reach ${cts[0]} on the vertical axis.`,
        hard ? `Check your counts: they must add to ${vals.length}. Then compare the first bar of each histogram.` : `Check the tallest bar: which interval should it be, and how high should it reach?`,
      ],
      hintEs: hard
        ? 'Primero ordena los valores en los cuatro intervalos y cuenta cuántos hay en cada uno. Luego busca el histograma con esas alturas.'
        : 'Cada fila de la tabla se convierte en una barra. El intervalo es la etiqueta; la frecuencia es la altura.',
      solution: `<p>${hard ? `Sorted data: ${S.list(S.sorted(vals))}. ` : ''}The correct histogram has bar heights ${cts.join(', ')} for ${bs.map((b) => b.label).join(', ')}, in that order${hard ? '' : ', matching the table row by row'}.</p>`,
      feedback: {
        correct: hard ? 'Correct. You sorted every value into exactly one interval.' : 'Correct. Each table row is one bar, in order along the number line.',
        wrong: (a) => whyOf(sh, a, 'Compare each bar with its interval count, one bar at a time.'),
      },
    };
  });

  // ---------- What a histogram can and cannot tell you (TF) ----------
  G.define('s2_exactTF', (r, o) => {
    const hard = !!o.hard;
    const c = r.pick(CTX),
      w = 10,
      start = r.pick([0, 10, 20]),
      bs = bins(start, w, 4);
    // the median's interval must be unambiguous (both middle positions in one bar)
    const posBin = (cts, p) => {
      let s = 0;
      for (let i = 0; i < cts.length; i++) {
        s += cts[i];
        if (p <= s) return i;
      }
      return cts.length - 1;
    };
    let cts, mb;
    for (let t = 0; t < 40; t++) {
      cts = bs.map(() => r.int(1, 7));
      const n = S.sum(cts);
      const a = posBin(cts, Math.ceil(n / 2)),
        b = posBin(cts, Math.floor(n / 2) + 1);
      mb = a;
      if (a === b) break;
    }
    const total = S.sum(cts);
    const bi = r.int(0, 3);
    const bk = r.int(1, 3);
    const variant = hard ? r.pick(['medianBin', 'lessThan', 'smallest']) : r.pick(['max', 'median', 'count', 'bin']);
    const truth = r.chance(0.5);
    const claimMb = truth ? mb : mb === 0 ? 1 : mb - 1;
    const below = S.sum(cts.slice(0, bk));
    const claimBelow = truth ? below : below + cts[bk];
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
      medianBin: {
        text: `The median of the data is somewhere in the interval ${bs[claimMb].label}.`,
        answer: claimMb === mb,
        reason: `There are ${total} values, so the middle is value number ${total % 2 ? (total + 1) / 2 : total / 2 + ' and ' + (total / 2 + 1)}. Counting up the bars (${cts.join(', ')}) reaches the middle inside ${bs[mb].label}.`,
      },
      lessThan: {
        text: `Exactly ${claimBelow} values are less than ${bs[bk].lo}.`,
        answer: claimBelow === below,
        reason: `Only the bars to the left of ${bs[bk].lo} count: ${cts.slice(0, bk).join(' + ')} = ${below}. The ${bs[bk].label} bar starts at ${bs[bk].lo}, so it is not "less than."`,
      },
      smallest: {
        text: `The smallest value in the data set is exactly ${bs[0].lo}.`,
        answer: false,
        reason: `The first bar only tells you the smallest value is somewhere from ${bs[0].lo} to ${bs[0].hi}. It could be any of those numbers.`,
      },
    };
    const cl = claims[variant];
    const reasons = r.shuffle([
      { html: cl.reason, correct: true },
      { html: cl.answer ? 'Histograms always show every individual data value.' : 'The bars touch, so the data must be in order.' },
      { html: cl.answer ? 'The tallest bar tells you the exact values in the data.' : hard ? 'The tallest bar always holds the median and the smallest value.' : 'The intervals are too small to show any information.' },
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
        hard
          ? variant === 'medianBin'
            ? `Find the position of the middle value out of ${total}. Then count up through the bars from the left until you reach it.`
            : variant === 'lessThan'
              ? `Decide which bars are completely below ${bs[bk].lo}. Does the ${bs[bk].label} bar count?`
              : 'Ask: does the first bar tell you one exact number, or only an interval?'
          : 'Ask: does answering this need individual values, or just the counts in the bars?',
        hard ? 'Counts and positions can be read from bars. Exact individual values cannot.' : 'Decide whether the claim can be answered from bar heights alone.',
      ],
      hintEs: 'Un histograma muestra cuántos valores caen en cada intervalo. No muestra los valores individuales.',
      solution: `<p><b>${cl.answer ? 'True' : 'False'}.</b> ${cl.reason}</p>`,
      feedback: {
        correct: 'Correct. Histograms show counts per interval, not individual values.',
        wrong(ans, d) {
          if (!d.valueOk) {
            if (variant === 'medianBin') return `Count up the bars to the middle position. With ${total} values, the middle sits in ${bs[mb].label}.`;
            if (variant === 'lessThan') return `"Less than ${bs[bk].lo}" leaves out the ${bs[bk].label} bar. Add only the bars to its left.`;
            if (variant === 'smallest') return `The first bar starts at ${bs[0].lo}, but the smallest value could be any number from ${bs[0].lo} to ${bs[0].hi}.`;
            return cl.answer ? 'Bar heights are counts. Counts can be read exactly from the histogram.' : 'Can you see the individual data values in a histogram? No. Only counts per interval.';
          }
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
  const ord = (k) => k + (k % 10 === 1 && k !== 11 ? 'st' : k % 10 === 2 && k !== 12 ? 'nd' : k % 10 === 3 && k !== 13 ? 'rd' : 'th');
  const whyOf = (sh, a, fallback) => (sh.options[a] && sh.options[a].why) || fallback;

  // ---------- Median of an odd set, read from points on a number line (num) ----------
  G.define('s3_medianOdd', (r, o) => {
    const hard = !!o.hard;
    // normal: whole-number readings, ticks every 1; hard: more readings at half units, ticks every 0.5
    const c = r.pick([
      { what: 'wave heights', unit: 'feet', tag: 'Wave height (feet)' },
      { what: 'tide heights', unit: 'feet', tag: 'Tide height (feet)' },
      { what: 'crab shell widths', unit: 'inches', tag: 'Shell width (inches)' },
      { what: 'rainfall amounts', unit: 'inches', tag: 'Rain (inches)' },
    ]);
    const step = hard ? 0.5 : 1;
    const n = hard ? r.pick([9, 11]) : r.pick([5, 7]);
    const min = hard ? r.int(1, 4) : r.int(0, 5) * 2,
      max = min + (hard ? 12 : 20);
    const ticks = [];
    for (let v = min + step; v < max - 1e-9; v += step) ticks.push(v);
    let vals;
    for (let t = 0; t < 60; t++) {
      vals = r.pickN(ticks, n);
      if (!hard || S.median(vals) % 1 !== 0) break;
    }
    const s = S.sorted(vals),
      med = S.median(vals),
      k = (n + 1) / 2;
    const name = r.pick(NAMES);
    return {
      type: 'num',
      skill: 'median',
      lesson: '2-3',
      title: hard ? 'Find the median (half units)' : 'Find the median',
      prompt: `<p>${name} measured ${c.what} at ${n} spots along the pier. Each point on the number line is one measurement, in ${c.unit}.</p>${V.numberLine({
        min,
        max,
        step,
        labelEvery: hard ? 2 : 5,
        width: 540,
        points: vals.map((v) => ({ v, color: '#3B6FB6' })),
        aria: `Number line from ${min} to ${max} with ${n} points at ${S.list(s)}`,
      })}<p>What is the <b>median</b> of the ${n} measurements?${hard ? ' The small ticks are every 0.5.' : ''}</p>`,
      unit: c.unit,
      answer: med,
      tolerance: 0.01,
      hints: [
        'A number line already puts the values in order, smallest on the left. The median is the middle point.',
        `There are ${n} points. Count ${(n - 1) / 2} points in from the left and ${(n - 1) / 2} in from the right.`,
        `The ${ord(k)} point from the left is the median. Read its value: each small tick is worth ${step}${hard ? ', and labels are every 2' : ', and labels are every 5'}.`,
      ],
      hintEs: 'La recta numérica ya pone los valores en orden, del menor a la izquierda al mayor a la derecha. La mediana es el punto del medio.',
      solution: `<p>Reading the points left to right gives the ordered data: ${S.list(s)}. With ${n} values, the middle is the ${ord(k)} value: <b>${fmt(med)} ${c.unit}</b>. Half the measurements are at or below it and half are at or above it.</p>`,
      feedback: {
        correct: `Correct. The middle of ${n} ordered values is the ${ord(k)} value, ${fmt(med)}.`,
        wrong(ans, d) {
          const v = d.value;
          if (v != null && Math.abs(v - (min + max) / 2) < 0.01 && Math.abs(v - med) > 0.01) return 'That is the middle of the number line, not the middle point. Count the points from each end.';
          if (v != null && (Math.abs(v - s[k - 2]) < 0.01 || Math.abs(v - s[k]) < 0.01)) return `That point is one away from the middle. With ${n} points, the median is the ${ord(k)} one from either end.`;
          if (v != null && Math.abs(Math.abs(v - med) - step) < 0.01) return `You found the right point but misread it by one tick. Each small tick is worth ${step}.`;
          return `Count to the ${ord(k)} point from the left, then read its value on the scale.`;
        },
      },
    };
  });

  // ---------- Error: forgot to order first / dropped a repeat (error) ----------
  G.define('s3_orderError', (r, o) => {
    const hard = !!o.hard;
    const name = r.pick(NAMES),
      c = r.pick(CTX);
    let n, vals, s, wrongMid, med, work, opts;
    if (hard) {
      // 8 readings with one repeat; the student writes the repeat once and takes the middle of 7.
      n = 8;
      for (let t = 0; t < 80; t++) {
        const d = S.data(r, 7, c.lo, c.hi, true);
        const ds = S.sorted(d);
        const rep = ds[r.int(1, 5)];
        vals = r.shuffle(d.concat([rep]));
        s = S.sorted(vals);
        wrongMid = ds[3];
        med = S.median(vals);
        if (Math.abs(wrongMid - med) > 0.01) break;
      }
      const ds = [...new Set(s)];
      work = `"In order: ${S.list(ds)}. There are 7 numbers, so the middle one is <b>${wrongMid}</b>. The median is ${wrongMid}."`;
      opts = [
        { html: `${name} wrote a repeated reading only once. All ${n} readings count, so there are two middle values.`, ok: true },
        { html: `${name} did not put the data in order before looking for the middle value.`, why: `${name}'s list is in order. Count how many readings ${name} wrote and how many there are.` },
        { html: `${name} should have averaged the smallest and largest readings instead.`, why: 'Averaging the two ends does not find the middle of the ordered data. The median uses the middle values.' },
        { html: 'There is no mistake. Repeated readings are only written once in a list.', why: 'Every reading is a data value, even if it repeats. Leaving one out changes the middle.' },
      ];
    } else {
      n = r.pick([5, 7]);
      for (let t = 0; t < 50; t++) {
        vals = S.data(r, n, c.lo, c.hi, true);
        s = S.sorted(vals);
        if (vals[(n - 1) / 2] !== S.median(vals)) break;
      }
      wrongMid = vals[(n - 1) / 2];
      med = S.median(vals);
      work = `"There are ${n} numbers. The middle one is <b>${wrongMid}</b>, so the median is ${wrongMid}."`;
      opts = [
        { html: `${name} did not order the data first. The middle of the unordered list is not the median.`, ok: true },
        { html: `${name} should have added the values and divided by ${n}.`, why: 'That gives the mean, not the median. The median is the middle value of the ordered data.' },
        { html: `${name} should have chosen the largest value.`, why: 'The largest value is the maximum. The median is the middle value after ordering.' },
        { html: 'There is no mistake. The middle number of the list is always the median.', why: 'The middle of the list is only the median if the list is in order. This list is not in order.' },
      ];
    }
    const sh = shuffleOptions(r, opts, 0);
    const a = s[n / 2 - 1],
      b = s[n / 2];
    return {
      type: 'error',
      skill: 'median',
      lesson: '2-3',
      title: 'Find the mistake',
      prompt: `<p>${name} is finding the median of ${c.what}: ${hl(S.list(vals))}.</p><p>What mistake did ${name} make?</p>`,
      work,
      options: sh.options,
      answer: sh.answer,
      fix: { label: 'What is the correct median?', answer: med, tolerance: 0.01 },
      hints: hard
        ? [`Count the readings in the problem, then count the numbers in ${name}'s list. Do they match?`, `In order with every reading: ${S.list(s)}.`, `There are ${n} values, so the two middle ones are ${a} and ${b}. Find the number halfway between them.`]
        : ['Is the list in order from least to greatest? Check before you look for the middle.', `Ordered: ${S.list(s)}.`, `Now find the ${ord((n + 1) / 2)} value in the ordered list.`],
      hintEs: hard
        ? `Cuenta los datos del problema y luego cuenta los números en la lista de ${name}. ¿Coinciden?`
        : '¿La lista está en orden de menor a mayor? Revísalo antes de buscar el valor del medio.',
      solution: hard
        ? `<p>${name} left out a repeated reading. With all ${n} readings in order, ${S.list(s)}, the two middle values are ${a} and ${b}, so the median is (${a} + ${b}) ÷ 2 = <b>${fmt(med)}</b>. Every reading counts, even a repeat.</p>`
        : `<p>${name} picked the middle of the list as written, but the data was not in order. Ordered: ${S.list(s)}. The middle value is <b>${med}</b>. Ordering first is what makes the middle position mean "half below, half above."</p>`,
      feedback: {
        correct: hard ? 'Correct. Every reading counts, including repeats.' : 'Correct. Always order the data before finding the middle.',
        wrong(ans, d) {
          if (!d.mistakeOk) return whyOf(sh, ans && ans.mistake, `Look at ${name}'s list and compare it with the data.`);
          const v = RX.parseNum(ans && ans.fix);
          if (v != null && Math.abs(v - wrongMid) < 0.01) return `That is ${name}'s answer. Redo it with the corrected list: ${hard ? 'all ' + n + ' readings' : 'ordered first'}.`;
          if (hard && v != null && (v === a || v === b)) return `${v} is one of the two middle values. With ${n} values, the median is halfway between ${a} and ${b}.`;
          return hard ? `You found the mistake. Now use all ${n} readings and average the two middle values.` : `You found the mistake. Now order the values (${S.list(s)}) and take the one in the middle.`;
        },
      },
    };
  });

  // ---------- Median from a dot plot (num) ----------
  G.define('s3_medianDot', (r, o) => {
    const hard = !!o.hard;
    const c = r.pick([
      { label: 'Fish caught per trip', unit: 'fish', lo: 2, hi: 10, thing: 'trips' },
      { label: 'Shells per bucket', unit: 'shells', lo: 3, hi: 12, thing: 'buckets' },
      { label: 'Gulls on the pier each hour', unit: 'gulls', lo: 0, hi: 9, thing: 'hours' },
    ]);
    // hard: an even number of dots, so the median sits between two middle dots
    let n, vals;
    for (let t = 0; t < 60; t++) {
      n = hard ? r.pick([10, 12, 14]) : r.pick([7, 9, 11]);
      vals = S.shaped(r, r.pick(['symmetric', 'skewed right', 'skewed left']), c.lo, c.hi, n);
      const sv = S.sorted(vals);
      if (!hard || sv[n / 2 - 1] !== sv[n / 2]) break;
    }
    const s = S.sorted(vals),
      med = S.median(vals);
    const a = hard ? s[n / 2 - 1] : med,
      b = hard ? s[n / 2] : med;
    return {
      type: 'num',
      skill: 'median',
      lesson: '2-3',
      title: hard ? 'Median from a dot plot (even count)' : 'Median from a dot plot',
      prompt: `<p>The dot plot shows ${c.label.toLowerCase()} for ${n} ${c.thing}. Each dot is one data value.</p>${V.dotPlot({ values: vals, min: c.lo, max: c.hi, label: c.label, aria: 'Dot plot: ' + S.list(s) })}<p>What is the median?${hard ? ' Your answer may be a decimal.' : ''}</p>`,
      unit: c.unit,
      answer: med,
      tolerance: 0.01,
      hints: [
        'A dot plot is already in order: smallest values on the left, largest on the right. Each dot is one value.',
        hard
          ? `There are ${n} dots, an even number. Count ${n / 2 - 1} dots in from each end; the next dot on each side is a middle dot.`
          : `There are ${n} dots. Count ${(n - 1) / 2} dots in from the left and ${(n - 1) / 2} in from the right.`,
        hard ? `The two middle dots are the ${ord(n / 2)} and ${ord(n / 2 + 1)} from the left. Find the number halfway between their values.` : `The dot left in the middle (the ${ord((n + 1) / 2)}) sits above the median. Read its value.`,
      ],
      hintEs: 'Un diagrama de puntos ya está en orden: los valores pequeños a la izquierda y los grandes a la derecha. Cada punto es un dato.',
      solution: hard
        ? `<p>Reading the dots left to right: ${S.list(s)}. With ${n} values, the middle two are the ${ord(n / 2)} and ${ord(n / 2 + 1)}: ${a} and ${b}. The median is (${a} + ${b}) ÷ 2 = <b>${fmt(med)}</b>.</p>`
        : `<p>Reading the dots left to right gives the ordered data: ${S.list(s)}. The middle (${ord((n + 1) / 2)}) value is <b>${med}</b>.</p>`,
      feedback: {
        correct: 'Correct. A dot plot orders the data for you; count dots from both ends to the middle.',
        wrong(ans, d) {
          const cnt = S.counts(vals);
          const keys = Object.keys(cnt)
            .map(Number)
            .sort((x, y) => x - y);
          const midKey = keys[Math.floor(keys.length / 2)];
          if (hard && (d.value === a || d.value === b)) return `${d.value} is one of the two middle dots. With ${n} dots, the median is halfway between ${a} and ${b}.`;
          if (d.value === midKey && midKey !== med) return 'You found the middle number on the number line. The median is the middle dot: count dots, not tick marks.';
          const mode = keys.find((k) => cnt[k] === Math.max(...keys.map((x) => cnt[x])));
          if (d.value === mode && mode !== med) return 'That is the value with the most dots (the peak). The median is the middle dot when you count from both ends.';
          return hard ? `Count the dots: ${n} in all. Average the ${ord(n / 2)} and ${ord(n / 2 + 1)} dots from the left.` : `Count the dots: ${n} in all. The median is the ${ord((n + 1) / 2)} dot from the left.`;
        },
      },
    };
  });

  // ---------- Who found the median correctly (who) ----------
  G.define('s3_whoMedian', (r, o) => {
    const hard = !!o.hard;
    const [a, b, cName] = r.pickN(NAMES, 3),
      c = r.pick(CTX);
    let n, vals, s, med;
    if (hard) {
      // even set: one student picks only one middle value, one averages the middle of the UNORDERED list
      n = r.pick([6, 8]);
      for (let t = 0; t < 80; t++) {
        vals = S.data(r, n, c.lo, c.hi, true);
        s = S.sorted(vals);
        med = S.median(vals);
        const um = (vals[n / 2 - 1] + vals[n / 2]) / 2;
        if (Math.abs(um - med) > 0.01 && med % 1 !== 0) break;
      }
      const m1 = s[n / 2 - 1],
        m2 = s[n / 2];
      const u1 = vals[n / 2 - 1],
        u2 = vals[n / 2];
      const opts = [
        { html: `<b>${a}</b>: "In order: ${S.list(s)}. The middle values are ${m1} and ${m2}, so the median is ${fmt(med)}."`, ok: true },
        { html: `<b>${b}</b>: "In order: ${S.list(s)}. The middle values are ${m1} and ${m2}, so the median is ${m2}."`, why: `${b} ordered correctly but stopped at one middle value. With an even count, the median is halfway between both.` },
        { html: `<b>${cName}</b>: "The middle values of the list are ${u1} and ${u2}. Halfway between is ${fmt((u1 + u2) / 2)}, so that is the median."`, why: `${cName} averaged the middle of the list as written. The data must be ordered first.` },
      ];
      const sh = shuffleOptions(r, opts, 0);
      return {
        type: 'who',
        skill: 'median',
        lesson: '2-3',
        title: 'Who is correct?',
        prompt: `<p>Three surveyors find the median of ${c.what}: ${hl(S.list(vals))}.</p><p>Who is correct?</p>`,
        options: sh.options,
        answer: sh.answer,
        layout: 'cards',
        hints: [
          'The median is the middle of the data after it is put in order. With an even count, there are two middle values.',
          `Check each student: did they order the data? Did they use both middle values?`,
          `Ordered: ${S.list(s)}. The ${ord(n / 2)} and ${ord(n / 2 + 1)} values are the middle pair. Which student found the number halfway between them?`,
        ],
        hintEs: 'La mediana es el valor del medio después de ordenar los datos. Si hay un número par de datos, hay dos valores en el medio.',
        solution: `<p><b>${a}</b> is correct. Ordered: ${S.list(s)}. The middle values are ${m1} and ${m2}, and halfway between them is <b>${fmt(med)}</b>. ${b} used only one middle value, and ${cName} did not order the data first.</p>`,
        feedback: { correct: 'Correct. Order first, then use both middle values when the count is even.', wrong: (x) => whyOf(sh, x, 'Check each student: ordered first? Used both middle values?') },
      };
    }
    n = r.pick([5, 7]);
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
            html: `<b>${b}</b>: "I looked at the data: ${S.list(vals)}. The middle number is ${wrongVal}, so the median is ${wrongVal}."`,
            why: `${b} skipped a step. The data must be in order before the middle value is the median.`,
          }
        : {
            html: `<b>${b}</b>: "I added ${S.list(vals, ' + ')} and divided by ${n}. The median is about ${wrongVal}."`,
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
      hints: ['The median is the middle value of the data after it is put in order.', 'Check each student: did they order the data, and did they find a middle value or something else?', `Order the data yourself. Which student's middle value matches yours?`],
      hintEs: 'La mediana es el valor del medio de los datos después de ponerlos en orden.',
      solution: `<p><b>${a}</b> is correct. Ordered data: ${S.list(s)}. The middle value is <b>${med}</b>. ${wrongKind === 'unordered' ? `${b} used the unordered list, so the "middle" number was not the median.` : `${b} computed the mean (sum ÷ count) instead of the median.`}</p>`,
      feedback: { correct: 'Correct. Order first, then take the middle value.', wrong: (x) => whyOf(sh, x, 'Order the data yourself, then compare.') },
    };
  });

  // ---------- Median of an even set (num) ----------
  G.define('s3_medianEven', (r, o) => {
    const c = r.pick(CTX),
      hard = !!o.hard,
      n = hard ? r.pick([10, 12]) : r.pick([6, 8]);
    let vals, s;
    for (let t = 0; t < 80; t++) {
      // hard: repeated values allowed and the two middle values differ by an odd amount (a .5 median)
      vals = S.data(r, n, c.lo, c.hi, !hard);
      s = S.sorted(vals);
      const a = s[n / 2 - 1],
        b = s[n / 2];
      if (hard ? (a + b) % 2 === 1 && new Set(vals).size < n : true) break;
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
        hard ? `Order all ${n} values, keeping repeats. The middle values are the ${ord(n / 2)} and ${ord(n / 2 + 1)}.` : `Ordered: ${S.list(s)}. The two middle values are ${a} and ${b}.`,
        hard ? `Ordered: ${S.list(s)}. Add the ${ord(n / 2)} and ${ord(n / 2 + 1)} values, then divide by 2.` : `The median is halfway between them: (${a} + ${b}) ÷ 2.`,
      ],
      hintEs: 'Primero ordena los datos. Si hay un número par de datos, hay dos valores en el medio.',
      solution: `<p>Ordered: ${S.list(s)}. There are ${n} values, so the two middle values are the ${ord(n / 2)} and ${ord(n / 2 + 1)}: ${a} and ${b}. The median is halfway between: (${a} + ${b}) ÷ 2 = <b>${fmt(med)}</b>.</p>`,
      feedback: {
        correct: `Correct. With an even count, the median is the average of the two middle values: ${fmt(med)}.`,
        wrong(ans, d) {
          if (d.value === a || d.value === b) return `${d.value} is one of the two middle values. With an even number of values, the median is halfway between both middle values.`;
          if (d.value === a + b) return `${a + b} is the sum of the middle two. Divide by 2 to find the number halfway between them.`;
          if (d.value === (vals[n / 2 - 1] + vals[n / 2]) / 2 || d.value === vals[n / 2 - 1] || d.value === vals[n / 2]) return 'Order the data first. Then find the two values in the middle.';
          const ds = [...new Set(s)];
          if (hard && ds.length % 2 === 0 && d.value === (ds[ds.length / 2 - 1] + ds[ds.length / 2]) / 2) return 'Keep the repeated values in your ordered list. Every reading counts.';
          return `Order the ${n} values. Find the two in the middle, add them, and divide by 2.`;
        },
      },
    };
  });

  // ---------- Two sets in a table (table) ----------
  G.define('s3_tableMedian', (r, o) => {
    const hard = !!o.hard;
    const c = r.pick(CTX),
      [g1, g2] = r.pickN(['North Beach', 'South Beach', 'East Cove', 'West Point', 'Pier Side', 'Marsh Edge'], 2);
    const n1 = hard ? r.pick([7, 9]) : r.pick([5, 7]),
      n2 = hard ? r.pick([8, 10]) : r.pick([6, 8]);
    let d1, d2;
    for (let t = 0; t < 80; t++) {
      d1 = S.data(r, n1, c.lo, c.hi, true);
      d2 = S.data(r, n2, c.lo, c.hi, true);
      // normal: whole-number even median; hard: a .5 median for the even site
      if (hard ? !Number.isInteger(S.median(d2)) && S.median(d2) !== S.median(d1) : Number.isInteger(S.median(d2))) break;
    }
    const m1 = S.median(d1),
      m2 = S.median(d2);
    const s2 = S.sorted(d2);
    const diff = Math.abs(m1 - m2);
    const rows = [
      ['Site', 'Data', 'Median'],
      [g1, S.list(d1), '__IN:m1__'],
      [g2, S.list(d2), '__IN:m2__'],
    ];
    if (hard) rows.push(['Difference', 'greater median − smaller median', '__IN:df__']);
    const inputs = [
      { id: 'm1', answer: m1, tolerance: 0.01 },
      { id: 'm2', answer: m2, tolerance: 0.01 },
    ];
    if (hard) inputs.push({ id: 'df', answer: diff, tolerance: 0.01 });
    return {
      type: 'table',
      skill: 'median',
      lesson: '2-3',
      title: hard ? 'Compare the site medians' : 'Median for each site',
      prompt: `<p>The table shows ${c.what} recorded at two survey sites. Find the median for each site.${hard ? ' Then find how far apart the two medians are.' : ''}</p>`,
      rows,
      header: true,
      inputs,
      hints: [
        "Order each site's data separately. Then find the middle.",
        `${g1} has ${n1} values (odd): one middle value. ${g2} has ${n2} values (even): two middle values, so average them.`,
        `${g1} ordered: ${S.list(S.sorted(d1))}. ${g2} ordered: ${S.list(s2)}. Find the middle of each list${hard ? ', then subtract the smaller median from the greater' : ''}.`,
      ],
      hintEs: 'Ordena los datos de cada lugar por separado. Luego busca el valor del medio.',
      solution: `<p>${g1}: ordered ${S.list(S.sorted(d1))}, middle value <b>${m1}</b>. ${g2}: ordered ${S.list(s2)}, middle values ${s2[n2 / 2 - 1]} and ${s2[n2 / 2]}, so the median is (${s2[n2 / 2 - 1]} + ${s2[n2 / 2]}) ÷ 2 = <b>${fmt(m2)}</b>.${hard ? ` The medians differ by ${fmt(Math.max(m1, m2))} − ${fmt(Math.min(m1, m2))} = <b>${fmt(diff)}</b>.` : ''}</p>`,
      feedback: {
        correct: 'Correct. Odd count: the single middle value. Even count: halfway between the two middle values.',
        wrong(ans, d) {
          const v2 = RX.parseNum((ans || {}).m2);
          if (d.wrong.includes('m2') && (v2 === s2[n2 / 2 - 1] || v2 === s2[n2 / 2])) return `For ${g2}, ${v2} is only one of the two middle values. Average both of them.`;
          if (d.wrong.includes('m2')) return `${g2} has an even number of values. Order them, find the two in the middle, and average them.`;
          if (d.wrong.includes('m1')) return `For ${g1}, order the ${n1} values and take the ${ord((n1 + 1) / 2)} one.`;
          return 'Both medians are right. Subtract the smaller median from the greater one.';
        },
      },
    };
  });

  // ---------- Even median, step by step (blanks template) ----------
  G.define('s3_evenBlanks', (r, o) => {
    const hard = !!o.hard;
    const c = r.pick(CTX),
      n = hard ? r.pick([8, 10]) : r.pick([6, 8, 10]);
    // hard: readings to one decimal place (tenths), so the median can reach hundredths
    let vals, s;
    for (let t = 0; t < 40; t++) {
      vals = hard ? S.data(r, n, c.lo * 10, c.hi * 10, true).map((v) => v / 10) : S.data(r, n, c.lo, c.hi, true);
      s = S.sorted(vals);
      if (!hard || s.filter((v) => v % 1 !== 0).length >= n - 2) break;
    }
    const a = s[n / 2 - 1],
      b = s[n / 2],
      med = RX.round((a + b) / 2, 2);
    return {
      type: 'blanks',
      skill: 'median',
      lesson: '2-3',
      title: hard ? 'Show the steps (decimals)' : 'Show the steps',
      prompt: `<p>Data (${c.what}): ${hl(S.list(vals))}.</p><p>Complete the steps to find the median.</p>`,
      fields: [
        { label: 'smaller middle value', answer: a, width: 'sm', tolerance: 0.001 },
        { label: 'larger middle value', answer: b, width: 'sm', tolerance: 0.001 },
        { label: 'median', answer: med, width: 'sm', tolerance: 0.01 },
      ],
      template: ['After ordering, the two middle values are {0} and {1}.', 'The median is halfway between them: {2}.'],
      hints: [
        'Order the data from least to greatest. Since there are ' + n + ' values, the two middle values are the ' + ord(n / 2) + ' and ' + ord(n / 2 + 1) + '.',
        hard ? 'Compare decimals digit by digit: whole numbers first, then tenths.' : `Ordered: ${S.list(s)}.`,
        hard ? `Ordered: ${S.list(s)}. Add the two middle values and divide by 2.` : `Middle values: ${a} and ${b}. Median = (${a} + ${b}) ÷ 2.`,
      ],
      hintEs: `Ordena los datos de menor a mayor. Como hay ${n} datos, los dos valores del medio son el ${n / 2}.º y el ${n / 2 + 1}.º.`,
      solution: `<p>Ordered: ${S.list(s)}. The two middle values are <b>${fmt(a)}</b> and <b>${fmt(b)}</b>. The median is (${fmt(a)} + ${fmt(b)}) ÷ 2 = <b>${fmt(med)}</b>.</p>`,
      feedback: {
        correct: `Correct. The median ${fmt(med)} is exactly halfway between ${fmt(a)} and ${fmt(b)}.`,
        wrong(ans, d) {
          const got = (ans || []).map(RX.parseNum);
          if (d.wrong.includes(0) || d.wrong.includes(1)) {
            if (got[0] === vals[n / 2 - 1] || got[1] === vals[n / 2]) return 'Those are the middle values of the list as written. Order the data first.';
            return `Order the data first. The middle two are the ${ord(n / 2)} and ${ord(n / 2 + 1)} values.`;
          }
          if (got[2] != null && Math.abs(got[2] - (a + b)) < 0.01) return `${fmt(a + b)} is the sum of the middle values. Divide it by 2.`;
          return `Your middle values are right. The median is their average: (${fmt(a)} + ${fmt(b)}) ÷ 2.`;
        },
      },
    };
  });

  // ---------- Meaning of the median (MC) ----------
  G.define('s3_medianMeaning', (r, o) => {
    const hard = !!o.hard;
    const c = r.pick(CTX),
      name = r.pick(NAMES);
    // hard: an even set whose median is NOT one of the readings
    let n, vals, med;
    for (let t = 0; t < 60; t++) {
      n = hard ? r.pick([8, 10]) : r.pick([7, 9, 11]);
      vals = S.data(r, n, c.lo, c.hi, true);
      med = S.median(vals);
      if (!hard || !vals.includes(med)) break;
    }
    const m = fmt(med),
      u = c.unit;
    const opts = hard
      ? [
          { html: `Half of the readings were below ${m} ${u} and half were above, even though no reading was exactly ${m}.`, ok: true },
          { html: `Since no reading was exactly ${m} ${u}, ${name} must have made a mistake finding the median.`, why: 'With an even count, the median is halfway between two readings, so it often is not a reading itself.' },
          { html: `If you add all ${n} readings and divide the total by ${n}, you get exactly ${m} ${u}.`, why: 'That describes the mean (sum ÷ count), not the median.' },
          { html: `The reading of ${m} ${u} must have come up more often than any other reading did.`, why: 'The median is a position in the ordered data, not the most common value.' },
        ]
      : [
          { html: `About half of the readings were ${m} ${u} or less, and about half were ${m} ${u} or more.`, ok: true },
          { html: `Most of the readings were exactly ${m} ${u}, so it is the value that shows up most often.`, why: 'The median is a position in the ordered data, not the most common value. The most common value is the mode.' },
          { html: `If you add all ${n} readings and divide the total by ${n}, you get exactly ${m} ${u}.`, why: 'That describes the mean (sum ÷ count), not the median.' },
          { html: `The highest reading was ${m} ${u}, and every other reading was lower than that one.`, why: 'The highest reading is the maximum. The median is the middle value.' },
        ];
    const sh = shuffleOptions(r, opts, 0);
    return {
      type: 'mc',
      skill: 'median',
      lesson: '2-3',
      title: 'What does the median tell you?',
      prompt: `<p>${name} found that the median of ${n} readings of ${c.what} is ${hl(m + ' ' + u)}.${hard ? ` None of the ${n} readings was exactly ${m}.` : ''}</p><p>What does this median tell you about the data?</p>`,
      options: sh.options,
      answer: sh.answer,
      hints: [
        'The median is the middle value of the ordered data. Think about what sits on each side of the middle.',
        hard ? `With ${n} readings (an even number), the median is halfway between the two middle readings.` : 'Half the values come before the middle and half come after it.',
        'Which statement talks about how many readings fall on each side of the median?',
      ],
      hintEs: 'La mediana es el valor del medio de los datos ordenados. Piensa en lo que queda a cada lado del medio.',
      solution: hard
        ? `<p>With ${n} readings, the median is halfway between the two middle readings, so it does not have to be a reading. <b>Half the readings are below ${m} ${u} and half are above it.</b> It is not the mean or the most common value.</p>`
        : `<p>The median splits the ordered data in half. <b>About half the readings are ${m} ${u} or less, and about half are ${m} ${u} or more.</b> It does not say the most common value, the total, or the largest value.</p>`,
      feedback: { correct: 'Correct. The median is the halfway point of the ordered data.', wrong: (x) => whyOf(sh, x, 'The median splits the ordered data into two equal halves.') },
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
  const fmt = RX.fmt;
  const ord = (k) => k + (k % 10 === 1 && k !== 11 ? 'st' : k % 10 === 2 && k !== 12 ? 'nd' : k % 10 === 3 && k !== 13 ? 'rd' : 'th');
  const whyOf = (sh, a, fallback) => (sh.options[a] && sh.options[a].why) || fallback;
  /** Halves listed without their medians (a hint that sets up the last step). */
  const halvesSetup = (vals) => {
    const h = S.halves(vals);
    return `Lower half: ${S.list(h.lower)}. Upper half: ${S.list(h.upper)}.${vals.length % 2 ? ' (The median is left out of both halves.)' : ''} Now find the middle of each half.`;
  };
  const halvesText = (vals) => {
    const h = S.halves(vals),
      n = vals.length;
    return `Lower half: ${S.list(h.lower)} → Q1 = ${fmt(S.median(h.lower))}. Upper half: ${S.list(h.upper)} → Q3 = ${fmt(S.median(h.upper))}.${n % 2 ? ` (The median ${fmt(S.median(vals))} is left out of both halves because there is an odd number of values.)` : ''}`;
  };

  // ---------- Five-number summary (blanks) ----------
  G.define('s4_fiveNum', (r, o) => {
    const c = r.pick(CTX),
      hard = !!o.hard,
      n = hard ? r.pick([9, 11, 12]) : r.pick([7, 8]);
    // hard: unordered, more values, and quartiles that may land halfway between two values
    let vals;
    for (let t = 0; t < 60; t++) {
      vals = hard ? S.data(r, n, c.lo, c.hi, true) : S.cleanFive(r, n, c.lo, c.hi, true);
      const f0 = S.fiveNum(vals);
      if (!hard || !S.isInt(f0.q1) || !S.isInt(f0.q3) || t > 50) break;
    }
    const s = S.sorted(vals),
      f = S.fiveNum(vals);
    return {
      type: 'blanks',
      skill: 'box-plot',
      lesson: '2-4',
      title: hard ? 'Five-number summary (harder)' : 'Five-number summary',
      prompt: `<p>Data (${c.what}): ${hl(S.list(hard ? vals : s))}.</p><p>Find the five-number summary.${hard ? ' A quartile may be a decimal.' : ''}</p>`,
      fields: [
        { label: 'Minimum', answer: f.min, width: 'sm' },
        { label: 'Q1', answer: f.q1, width: 'sm', tolerance: 0.01 },
        { label: 'Median', answer: f.med, width: 'sm', tolerance: 0.01 },
        { label: 'Q3', answer: f.q3, width: 'sm', tolerance: 0.01 },
        { label: 'Maximum', answer: f.max, width: 'sm' },
      ],
      hints: [
        `${hard ? 'Order the data first. ' : ''}The minimum and maximum are the smallest and largest values. The median is the middle.`,
        `Ordered: ${S.list(s)}. Find the median, then split the data into a lower half and an upper half${n % 2 ? ', leaving the median out' : ''}.`,
        halvesSetup(vals),
      ],
      hintEs: `${hard ? 'Primero ordena los datos. ' : ''}El mínimo y el máximo son el valor más pequeño y el más grande. La mediana es el valor del medio.`,
      solution: `<p>Ordered: ${S.list(s)}.</p><p>Minimum <b>${f.min}</b>, maximum <b>${f.max}</b>, median <b>${fmt(f.med)}</b>. ${halvesText(vals)} So Q1 = <b>${fmt(f.q1)}</b> and Q3 = <b>${fmt(f.q3)}</b>.</p><p>As a box plot:</p>${box(f, '')}`,
      feedback: {
        correct: 'Correct. Min, Q1, median, Q3, max: the five numbers that build a box plot.',
        wrong(ans, d) {
          const got = (ans || []).map(RX.parseNum);
          if (d.wrong.includes(2)) return `Start with the median. Order the data, then take the middle${n % 2 ? ' value' : ' two values and average them'}.`;
          if (d.wrong.includes(1) || d.wrong.includes(3)) {
            if (n % 2) {
              const incl = S.median(s.slice(0, (n + 1) / 2));
              if (got[1] != null && Math.abs(got[1] - incl) < 0.01) return `Your lower half included the median. With ${n} values (odd), leave the median out of both halves.`;
            }
            if (got[1] === f.min || got[3] === f.max) return 'Q1 and Q3 are not the ends of the data. They are the middles of the lower and upper halves.';
            return `Q1 is the median of the lower half and Q3 is the median of the upper half. ${n % 2 ? 'Leave the median out of both halves because there is an odd number of values.' : 'Split the ordered data into two equal halves.'}`;
          }
          return 'Check the minimum and maximum: the smallest and largest values in the list.';
        },
      },
    };
  });

  // ---------- Read a value from a box plot (num) ----------
  G.define('s4_readBox', (r, o) => {
    const hard = !!o.hard;
    const c = r.pick(CTX);
    const vals = S.cleanFive(r, r.pick([7, 8, 9]), c.lo, c.hi, true),
      f = S.fiveNum(vals);
    const names = { med: 'median', q1: 'first quartile (Q1)', q3: 'third quartile (Q3)', min: 'minimum', max: 'maximum' };
    const where = { med: 'the line inside the box', q1: 'the left edge of the box', q3: 'the right edge of the box', min: 'the end of the left whisker', max: 'the end of the right whisker' };
    const L = lineFor(f);
    // hard: labels only every other major tick, and the question needs two readings and a subtraction
    const plot = hard
      ? V.boxPlot({ plots: [Object.assign({ label: '' }, f)], lineMin: L.lineMin, lineMax: L.lineMax, step: L.step, labelEvery: L.labelEvery * 2, width: 460, aria: `Box plot: minimum ${f.min}, Q1 ${f.q1}, median ${f.med}, Q3 ${f.q3}, maximum ${f.max}` })
      : box(f, '');
    if (hard) {
      const pairs = [
        ['med', 'q1'],
        ['q3', 'med'],
        ['max', 'q3'],
        ['q1', 'min'],
        ['max', 'med'],
      ].filter(([a, b]) => f[a] - f[b] > 0);
      const [a, b] = r.pick(pairs);
      const answer = f[a] - f[b];
      return {
        type: 'num',
        skill: 'box-plot',
        lesson: '2-4',
        title: 'Read the box plot (two values)',
        prompt: `<p>The box plot shows ${c.what}. Only some tick marks are labeled.</p>${plot}<p>How much greater is the ${hl(names[a])} than the ${hl(names[b])}?</p>`,
        unit: c.unit,
        answer,
        hints: [
          'A box plot shows five numbers: minimum, Q1, median, Q3, maximum, from left to right.',
          `The ${names[a]} is ${where[a]}. The ${names[b]} is ${where[b]}. Each small tick is worth ${L.step}.`,
          `Read both values on the number line, then subtract the ${names[b]} from the ${names[a]}.`,
        ],
        hintEs: 'Un diagrama de caja muestra cinco números: mínimo, Q1, mediana, Q3 y máximo, de izquierda a derecha.',
        solution: `<p>The ${names[a]} is ${where[a]}: ${f[a]}. The ${names[b]} is ${where[b]}: ${f[b]}. The difference is ${f[a]} − ${f[b]} = <b>${answer}</b> ${c.unit}.</p>`,
        feedback: {
          correct: 'Correct. You read two parts of the box plot and found the distance between them.',
          wrong(ans, d) {
            if (d.value === f[a] || d.value === f[b]) return `${d.value} is one of the two values. Subtract to find how much greater the ${names[a]} is.`;
            const hit = Object.keys(f).find((k) => k !== a && k !== b && Math.abs(f[a] - f[k]) === d.value);
            if (hit) return `You subtracted the ${names[hit]}. The question compares the ${names[a]} with the ${names[b]}, which is ${where[b]}.`;
            if (Math.abs(d.value - answer) === L.step) return `Close. Recheck one reading: each small tick is worth ${L.step}.`;
            return `Read ${where[a]} and ${where[b]} on the number line, then subtract.`;
          },
        },
      };
    }
    const part = r.pick(['med', 'q1', 'q3', 'min', 'max']);
    return {
      type: 'num',
      skill: 'box-plot',
      lesson: '2-4',
      title: 'Read the box plot',
      prompt: `<p>The box plot shows ${c.what}.</p>${plot}<p>What is the ${hl(names[part])}?</p>`,
      unit: c.unit,
      answer: f[part],
      hints: [
        'A box plot shows five numbers: minimum, Q1, median, Q3, maximum, from left to right.',
        `The ${names[part]} is ${where[part]}.`,
        `Read straight down from ${where[part]} to the number line.`,
      ],
      hintEs: 'Un diagrama de caja muestra cinco números: mínimo, Q1, mediana, Q3 y máximo, de izquierda a derecha.',
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

  // ---------- Quartile error (error) ----------
  G.define('s4_quartileError', (r, o) => {
    const hard = !!o.hard;
    const name = r.pick(NAMES),
      c = r.pick(CTX);
    // normal: odd count, median wrongly kept in the lower half. hard: even count, the two middle values wrongly thrown out.
    const n = hard ? r.pick([8, 10]) : r.pick([7, 9]);
    let vals, s, f, wrongLower, wrongQ1;
    for (let t = 0; t < 80; t++) {
      vals = S.cleanFive(r, n, c.lo, c.hi, true);
      s = S.sorted(vals);
      f = S.fiveNum(vals);
      wrongLower = hard ? s.slice(0, n / 2 - 1) : s.slice(0, (n + 1) / 2);
      wrongQ1 = S.median(wrongLower);
      if (wrongQ1 !== f.q1) break;
    }
    const lower = S.halves(vals).lower;
    const opts = hard
      ? [
          { html: `${name} left out the two middle values. With an even count, the data splits into two equal halves and nothing is left out.`, ok: true },
          { html: `${name} should have included the median in the lower half.`, why: `The median ${fmt(f.med)} is not a data value here. With ${n} values, each half simply has ${n / 2} values.` },
          { html: `${name} should have used the smallest value as Q1.`, why: 'The smallest value is the minimum. Q1 is the median of the lower half.' },
          { html: 'There is no mistake. The two middle values always stay out of the halves.', why: `The two middle values belong to the halves. The lower half should have ${n / 2} values.` },
        ]
      : [
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
      prompt: `<p>${name} is finding Q1 for ${c.what}: ${hl(S.list(s))} (already ordered, ${n} values, median ${fmt(f.med)}).</p><p>What mistake did ${name} make?</p>`,
      work: `"Lower half: ${S.list(wrongLower)}. The middle of that is <b>${fmt(wrongQ1)}</b>, so Q1 = ${fmt(wrongQ1)}."`,
      options: sh.options,
      answer: sh.answer,
      fix: { label: 'What is the correct Q1?', answer: f.q1, tolerance: 0.01 },
      hints: hard
        ? [`There are ${n} values, an even number. Count the values in ${name}'s lower half.`, `With an even count, the lower half is the first ${n / 2} values. Nothing is left out.`, `Lower half: ${S.list(lower)}. Find its middle.`]
        : [`There are ${n} values, an odd number. The median ${f.med} is the ${ord((n + 1) / 2)} value.`, 'When the count is odd, the median is not part of the lower half or the upper half.', `Lower half without the median: ${S.list(lower)}. Find its middle.`],
      hintEs: hard ? `Hay ${n} datos, un número par. Cuenta los valores de la mitad inferior de ${name}.` : `Hay ${n} datos, un número impar. La mediana ${f.med} es el valor que está en el lugar ${(n + 1) / 2}.`,
      solution: hard
        ? `<p>${name} threw out the two middle values. With ${n} values, the lower half is simply the first ${n / 2}: ${S.list(lower)}, so Q1 = <b>${fmt(f.q1)}</b>.</p>`
        : `<p>${name}'s lower half included the median ${f.med}. With an odd number of values, the median is <b>excluded</b> from both halves. Lower half: ${S.list(lower)}, so Q1 = <b>${fmt(f.q1)}</b>.</p>`,
      feedback: {
        correct: hard ? 'Correct. Even count: split into two equal halves with nothing left out.' : 'Correct. Odd count: leave the median out, then find the middle of each half.',
        wrong(ans, d) {
          if (!d.mistakeOk) return whyOf(sh, ans && ans.mistake, `Count the values in ${name}'s lower half. How many should there be?`);
          const v = RX.parseNum(ans && ans.fix);
          if (v != null && Math.abs(v - wrongQ1) < 0.01) return `That is ${name}'s Q1. Use the corrected lower half: ${S.list(lower)}.`;
          return `You found the mistake. Now use the lower half ${S.list(lower)} and take its middle value.`;
        },
      },
    };
  });

  // ---------- Match data to box plot (rep) ----------
  G.define('s4_matchBox', (r, o) => {
    const hard = !!o.hard;
    const c = r.pick(CTX);
    // hard: unordered odd-size data; one near-miss plot keeps the median inside the halves
    let vals, f, inc;
    for (let t = 0; t < 80; t++) {
      vals = S.cleanFive(r, hard ? r.pick([9, 11]) : r.pick([7, 8]), c.lo, c.hi, true);
      f = S.fiveNum(vals);
      const sv = S.sorted(vals),
        h = Math.ceil(sv.length / 2);
      inc = Object.assign({}, f, { q1: S.median(sv.slice(0, h)), q3: S.median(sv.slice(sv.length - h)) });
      if (!hard || (inc.q1 !== f.q1 && inc.q3 !== f.q3)) break;
    }
    const s = S.sorted(vals);
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
    const opts = [{ html: mk(f), ok: true }];
    if (hard) opts.push({ html: mk(inc), why: `The box edges are off. With ${vals.length} values (odd), leave the median out of both halves before finding Q1 and Q3.` });
    opts.push({ html: mk(bad1), why: `The median line is in the wrong place. Find the middle of the ordered data again.` });
    opts.push({ html: mk(bad2), why: `The right whisker reaches past the largest data value. The whisker should stop at the maximum.` });
    if (!hard) opts.push({ html: mk(bad3), why: `The median line sits at the box edge from a different plot. Find the middle of the ordered data again.` });
    const sh = shuffleOptions(r, opts, 0);
    return {
      type: 'rep',
      skill: 'box-plot',
      lesson: '2-4',
      title: 'Match the data to its box plot',
      prompt: `<p>Data (${c.what}): ${hl(S.list(hard ? vals : s))}.</p><p>Which box plot shows this data?</p>`,
      options: sh.options,
      answer: sh.answer,
      layout: 'cards',
      hints: [
        'Find the five-number summary first: minimum, Q1, median, Q3, maximum.',
        hard ? `Order the ${vals.length} values. The ends of the whiskers are the smallest and largest values.` : `Minimum ${f.min} and maximum ${f.max} are the ends of the whiskers. Median ${f.med} is the line inside the box.`,
        hard ? 'Two plots may look almost the same. Check the box edges: Q1 and Q3 come from halves that leave the median out.' : 'Now find Q1 and Q3 for the box edges. Only one plot matches all five numbers.',
      ],
      hintEs: 'Primero halla el resumen de cinco números: mínimo, Q1, mediana, Q3 y máximo.',
      solution: `<p>Ordered: ${S.list(s)}. Five-number summary: min ${f.min}, Q1 ${f.q1}, median ${f.med}, Q3 ${f.q3}, max ${f.max}. The correct box plot has whiskers from ${f.min} to ${f.max}, a box from ${f.q1} to ${f.q3}, and a median line at ${f.med}.</p>`,
      feedback: { correct: 'Correct. All five numbers must match: whisker ends, box edges, and the median line.', wrong: (a) => whyOf(sh, a, 'Compare all five numbers: whisker ends, box edges, and the median line.') },
    };
  });

  // ---------- Percent (or count) of data in a part of the box plot (MC) ----------
  G.define('s4_percentBox', (r, o) => {
    const hard = !!o.hard;
    const c = r.pick(CTX);
    const vals = S.cleanFive(r, 8, c.lo, c.hi, true),
      f = S.fiveNum(vals);
    const parts = {
      box: { text: `inside the box, between ${f.q1} and ${f.q3}`, pct: 50 },
      aboveQ3: { text: `greater than ${f.q3} (the right whisker)`, pct: 25 },
      belowQ1: { text: `less than ${f.q1} (the left whisker)`, pct: 25 },
      aboveMed: { text: `greater than the median, ${f.med}`, pct: 50 },
      belowQ3: { text: `less than ${f.q3}`, pct: 75 },
      aboveQ1: { text: `greater than ${f.q1}`, pct: 75 },
      minToMed: { text: `between the minimum, ${f.min}, and the median, ${f.med}`, pct: 50 },
    };
    const part = hard ? r.pick(['aboveQ1', 'belowQ3', 'aboveQ3', 'minToMed', 'box']) : r.pick(['box', 'aboveQ3', 'belowQ1', 'aboveMed', 'belowQ3']);
    const Q = parts[part];
    // hard: the box plot summarizes N values; answer with a count, not a percent
    const N = hard ? r.pick([20, 24, 32, 40, 48, 60]) : 0;
    const val = (p) => (hard ? (N * p) / 100 : p);
    const label = (p) => (hard ? `About ${val(p)} values` : `About ${p}%`);
    const opts = [25, 50, 75, 100].map((p) =>
      p === Q.pct
        ? { html: label(p), ok: true }
        : {
            html: label(p),
            why:
              p === 100
                ? `That is ${hard ? 'all ' + N + ' values' : 'all of the data'}. Each quarter of a box plot (whisker or half-box) holds about 25% of the data.`
                : `That covers ${p / 25} of the four sections. Each whisker and each half of the box holds about 25%${hard ? `, or ${N / 4} values` : ''}. Count the sections in the region again.`,
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
      title: hard ? 'How many of the values?' : 'How much of the data?',
      prompt: hard
        ? `<p>The box plot summarizes ${hl(N + ' data values')}: ${c.what}.</p>${box(f, '')}<p>About how many of the ${N} values are ${hl(Q.text)}?</p>`
        : `<p>The box plot shows ${c.what}.</p>${box(f, '')}<p>About what percent of the data values are ${hl(Q.text)}?</p>`,
      options: sh.options,
      answer: sh.answer,
      hints: [
        'The quartiles split the data into four equal parts. Each part holds about one quarter, or 25%, of the data.',
        'Count how many of the four parts the question covers: left whisker, left half of the box, right half of the box, right whisker.',
        hard ? `One quarter of ${N} values is ${N} ÷ 4. Multiply that by the number of parts the region covers.` : 'Multiply the number of parts by 25%.',
      ],
      hintEs: 'Los cuartiles dividen los datos en cuatro partes iguales. Cada parte tiene más o menos un cuarto, o el 25%, de los datos.',
      solution: `<p>Each whisker and each half of the box holds about 25% of the data. The region ${Q.text} covers ${Q.pct / 25} of the four parts, so about <b>${Q.pct}%</b> of the data${hard ? `: ${Q.pct / 25} × (${N} ÷ 4) = <b>${val(Q.pct)} values</b>` : ''}.</p>`,
      feedback: { correct: 'Correct. The box holds the middle half; each whisker holds about a quarter.', wrong: (a) => whyOf(sh, a, 'Count the quarter-sections the region covers.') },
    };
  });

  // ---------- Compare two box plots (num) ----------
  G.define('s4_compareMedian', (r, o) => {
    const hard = !!o.hard;
    const c = r.pick(CTX),
      [l1, l2] = r.pickN(['Fleet A', 'Fleet B', 'Dock 1', 'Dock 2', 'Morning', 'Evening'], 2);
    const names = { med: 'median', q1: 'Q1', q3: 'Q3' };
    let f1, f2, A, B, ka, kb;
    for (let t = 0; t < 80; t++) {
      f1 = S.fiveNum(S.cleanFive(r, 8, c.lo, c.hi, true));
      f2 = S.fiveNum(S.cleanFive(r, 8, c.lo, c.hi, true));
      if (!hard) {
        if (f1.med !== f2.med) break;
        continue;
      }
      // hard: compare DIFFERENT parts of the two plots, e.g. one group's Q3 with the other group's median
      [ka, kb] = r.pick([
        ['q3', 'med'],
        ['med', 'q1'],
        ['q1', 'med'],
        ['q3', 'q3'],
      ]);
      [A, B] = r.chance(0.5) ? [{ f: f1, l: l1 }, { f: f2, l: l2 }] : [{ f: f2, l: l2 }, { f: f1, l: l1 }];
      if (A.f[ka] > B.f[kb]) break;
    }
    if (hard && !(A.f[ka] > B.f[kb])) {
      // fallback that is always positive: the greater Q3 against the other group's Q1
      [ka, kb] = ['q3', 'q1'];
      [A, B] = f1.q3 >= f2.q3 ? [{ f: f1, l: l1 }, { f: f2, l: l2 }] : [{ f: f2, l: l2 }, { f: f1, l: l1 }];
    }
    if (hard) {
      const answer = A.f[ka] - B.f[kb];
      return {
        type: 'num',
        skill: 'box-plot',
        lesson: '2-4',
        title: 'Compare two box plots',
        prompt: `<p>The box plots show ${c.what} for two groups.</p>${twoBox(f1, f2, l1, l2)}<p>How much greater is ${hl(A.l + "'s " + names[ka])} than ${hl(B.l + "'s " + names[kb])}?</p>`,
        unit: c.unit,
        answer,
        hints: [
          'The median is the line inside each box. Q1 is the left edge of a box and Q3 is the right edge.',
          `Find ${A.l}'s ${names[ka]} on the top or bottom plot, then ${B.l}'s ${names[kb]} on the other plot.`,
          `Read both values on the number line. Subtract ${B.l}'s ${names[kb]} from ${A.l}'s ${names[ka]}.`,
        ],
        hintEs: 'La mediana es la línea dentro de cada caja. Q1 es el borde izquierdo de la caja y Q3 es el borde derecho.',
        solution: `<p>${A.l}'s ${names[ka]} is ${A.f[ka]}. ${B.l}'s ${names[kb]} is ${B.f[kb]}. The difference is ${A.f[ka]} − ${B.f[kb]} = <b>${answer}</b> ${c.unit}.</p>`,
        feedback: {
          correct: 'Correct. You matched each feature to the right plot before subtracting.',
          wrong(ans, d) {
            if (d.value === A.f[ka] || d.value === B.f[kb]) return 'That is one of the two values. Subtract to find how much greater.';
            if (ka !== kb && d.value === A.f[ka] - B.f[ka]) return `You compared ${names[ka]} with ${names[ka]}. The question compares ${A.l}'s ${names[ka]} with ${B.l}'s ${names[kb]}.`;
            if (d.value === A.f[kb] - B.f[kb] || d.value === Math.abs(B.f[ka] - A.f[kb])) return 'Check which plot each feature comes from. Read the label at the left of each box plot.';
            return `Read ${A.l}'s ${names[ka]} and ${B.l}'s ${names[kb]}, then subtract.`;
          },
        },
      };
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
      hintEs: 'La mediana es la línea dentro de cada caja.',
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

  // ---------- Longer box or whisker ≠ more data (TF) ----------
  G.define('s4_lengthTF', (r, o) => {
    const hard = !!o.hard;
    const c = r.pick(CTX),
      [l1, l2] = r.pickN(['Fleet A', 'Fleet B', 'Dock 1', 'Dock 2', 'Team Red', 'Team Blue'], 2);
    let f1, f2;
    for (let t = 0; t < 80; t++) {
      f1 = S.fiveNum(S.cleanFive(r, 8, c.lo, c.hi, true));
      f2 = S.fiveNum(S.cleanFive(r, 8, c.lo, c.hi, true));
      const boxGap = Math.abs(f1.q3 - f1.q1 - (f2.q3 - f2.q1)) >= 3;
      if (boxGap && (!hard || Math.abs(f1.max - f1.q3 - (f1.q1 - f1.min)) >= 3)) break;
    }
    const longer = f1.q3 - f1.q1 > f2.q3 - f2.q1 ? l1 : l2;
    const rightLong = f1.max - f1.q3 > f1.q1 - f1.min;
    const variant = hard ? r.pick(['whiskerMore', 'whiskerSame']) : r.pick(['moreData', 'spread']);
    const longSide = rightLong ? 'right' : 'left',
      shortSide = rightLong ? 'left' : 'right';
    const claims = {
      moreData: { text: `${longer} has more data values than the other group because its box is longer.`, answer: false, reason: 'The length of the box shows how spread out the middle half of the data is, not how many values there are.' },
      spread: { text: `The middle half of ${longer}'s data is more spread out than the other group's.`, answer: true, reason: 'A longer box means the middle half of the data (from Q1 to Q3) covers a wider range of values.' },
      whiskerMore: { text: `${l1}'s ${longSide} whisker is longer than its ${shortSide} whisker, so more of ${l1}'s values are in the ${longSide} whisker.`, answer: false, reason: 'Each whisker holds about one quarter of the data. A longer whisker means those values are more spread out, not that there are more of them.' },
      whiskerSame: { text: `${l1}'s two whiskers have different lengths, but each one holds about the same number of values.`, answer: true, reason: 'Each whisker holds about one quarter of the data. Its length only shows how spread out that quarter is.' },
    };
    const cl = claims[variant];
    const reasons = r.shuffle([
      { html: cl.reason, correct: true },
      { html: hard ? 'A longer whisker always holds more data values than a shorter one.' : 'A longer box always means more data values.' },
      { html: 'Box plots show the exact number of data values in each section.' },
    ]);
    return {
      type: 'tf',
      skill: 'box-plot',
      lesson: '2-4',
      title: hard ? 'What does a longer whisker mean?' : 'What does a longer box mean?',
      prompt: `<p>The box plots show ${c.what} for two groups. Both groups have the same number of data values.</p>${twoBox(f1, f2, l1, l2)}<p>True or false: <b>${cl.text}</b></p>`,
      answer: cl.answer,
      reasons,
      hints: [
        'Each section of a box plot holds about a quarter of the data, no matter how long or short it is.',
        'So the length of a section shows spread (how far apart the values are), not count.',
        'Decide whether the claim is about how many values there are or about how spread out they are.',
      ],
      hintEs: 'Cada parte de un diagrama de caja tiene más o menos un cuarto de los datos, sin importar si es larga o corta.',
      solution: `<p><b>${cl.answer ? 'True' : 'False'}.</b> ${cl.reason} ${hard ? `${l1}'s ${longSide} whisker is longer, so that quarter of the data is more spread out.` : `${longer}'s box is longer, so its middle half is more spread out.`}</p>`,
      feedback: {
        correct: 'Correct. Section length shows spread, not how many values.',
        wrong(ans, d) {
          if (!d.valueOk) return 'Every section holds about a quarter of the data. Does a longer section change how many values it holds, or how far apart they are?';
          return 'Your true/false choice is right. Pick the reason about spread: each section holds about a quarter of the data.';
        },
      },
    };
  });

  // ---------- Table from two box plots (table) ----------
  G.define('s4_tableTwoBox', (r, o) => {
    const hard = !!o.hard;
    const c = r.pick(CTX),
      [l1, l2] = r.pickN(['North Fleet', 'South Fleet', 'Dock A', 'Dock B', 'Week 1', 'Week 2'], 2);
    const f1 = S.fiveNum(S.cleanFive(r, 8, c.lo, c.hi, true)),
      f2 = S.fiveNum(S.cleanFive(r, 8, c.lo, c.hi, true));
    // hard: read the box edges and median (not the whisker ends)
    const keys = hard ? ['q1', 'med', 'q3'] : ['min', 'med', 'max'];
    const head = { min: 'Minimum', med: 'Median', max: 'Maximum', q1: 'Q1', q3: 'Q3' };
    const desc = { min: 'minimum (left whisker end)', med: 'median (line inside the box)', max: 'maximum (right whisker end)', q1: 'Q1 (left edge of the box)', q3: 'Q3 (right edge of the box)' };
    return {
      type: 'table',
      skill: 'box-plot',
      lesson: '2-4',
      title: hard ? 'Read the boxes' : 'Read two box plots',
      prompt: hard
        ? `<p>The box plots show ${c.what} for two groups. Complete the table with each group's <b>quartiles and median</b>.</p>${twoBox(f1, f2, l1, l2)}`
        : `<p>The box plots show ${c.what} for two groups. Complete the table.</p>${twoBox(f1, f2, l1, l2)}`,
      rows: [['Group'].concat(keys.map((k) => head[k])), [l1].concat(keys.map((k, i) => `__IN:a${i + 1}__`)), [l2].concat(keys.map((k, i) => `__IN:b${i + 1}__`))],
      header: true,
      inputs: keys.map((k, i) => ({ id: 'a' + (i + 1), answer: f1[k] })).concat(keys.map((k, i) => ({ id: 'b' + (i + 1), answer: f2[k] }))),
      hints: [
        hard ? 'Q1 is the left edge of the box, Q3 is the right edge, and the median is the line inside the box.' : 'The minimum is the left end of the whisker, the maximum is the right end, and the median is the line inside the box.',
        hard ? `Read ${l1}'s box first: left edge, middle line, right edge.` : `${l1}: whiskers end at ${f1.min} and ${f1.max}.`,
        hard ? 'Read each edge straight down to the number line. Check that Q1 < median < Q3 for each group.' : `${l2}: the median line is at ${f2.med}. Read each value straight down to the number line.`,
      ],
      hintEs: hard
        ? 'Q1 es el borde izquierdo de la caja, Q3 es el borde derecho y la mediana es la línea dentro de la caja.'
        : 'El mínimo es el extremo izquierdo del bigote, el máximo es el extremo derecho y la mediana es la línea dentro de la caja.',
      solution: `<p>${l1}: ${keys.map((k) => `${head[k].toLowerCase().replace('q', 'Q')} <b>${f1[k]}</b>`).join(', ')}. ${l2}: ${keys.map((k) => `${head[k].toLowerCase().replace('q', 'Q')} <b>${f2[k]}</b>`).join(', ')}.</p>`,
      feedback: {
        correct: hard ? 'Correct. Box edges give Q1 and Q3; the inside line gives the median.' : 'Correct. Whisker ends give the minimum and maximum; the inside line gives the median.',
        wrong(ans, d) {
          const k = d.wrong[0];
          const grp = k[0] === 'a' ? l1 : l2,
            f = k[0] === 'a' ? f1 : f2,
            key = keys[Number(k[1]) - 1];
          const v = RX.parseNum((ans || {})[k]);
          const other = f === f1 ? f2 : f1;
          if (v != null && v === other[key] && v !== f[key]) return `That is the ${head[key]} of the other group. Read the plot labeled ${grp}.`;
          const hit = Object.keys(f).find((x) => x !== key && f[x] === v);
          if (hit) return `${v} is ${grp}'s ${desc[hit]}. The column asks for the ${desc[key]}.`;
          return `Check the ${desc[key]} for ${grp}. Read straight down to the number line.`;
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
    return `Lower half: ${S.list(h.lower)} → Q1 = ${RX.fmt(S.median(h.lower))}. Upper half: ${S.list(h.upper)} → Q3 = ${RX.fmt(S.median(h.upper))}.${n % 2 ? ` The median ${RX.fmt(S.median(vals))} is left out of both halves because there is an odd number of values.` : ''}`;
  };

  const fmt = RX.fmt;
  const whyOf = (sh, a, fallback) => (sh.options[a] && sh.options[a].why) || fallback;
  const halvesSetup = (vals) => {
    const h = S.halves(vals);
    return `Lower half: ${S.list(h.lower)}. Upper half: ${S.list(h.upper)}.${vals.length % 2 ? ' (The median is left out of both halves.)' : ''}`;
  };
  const sameOrder = (a, b) => a.length === b.length && a.every((v, i) => v === b[i]);

  // ---------- Range of a data set (num) ----------
  G.define('s5_range', (r, o) => {
    const hard = !!o.hard;
    const c = r.pick(CTX),
      n = r.pick([6, 7, 8, 9]);
    // hard: tenths data, or work backward from a given range to a missing reading
    const mode = hard ? r.pick(['decimal', 'missing']) : 'plain';
    const vals = mode === 'decimal' ? S.data(r, n, c.lo * 10, c.hi * 10, true).map((v) => v / 10) : S.data(r, n, c.lo, c.hi, true);
    const s = S.sorted(vals),
      mx = Math.max(...vals),
      mn = Math.min(...vals),
      rg = RX.round(mx - mn, 1);
    if (mode === 'missing') {
      const shown = s.slice(0, -1),
        big = r.chance(0.5);
      // the hidden reading is either the new maximum or the new minimum
      const hidden = big ? mx : mn;
      const listed = big ? shown : s.slice(1);
      const R = mx - mn;
      return {
        type: 'num',
        skill: 'range-iqr',
        lesson: '2-5',
        title: 'Find the missing value',
        prompt: `<p>A surveyor recorded ${c.what} on ${n} visits. One reading washed away. The other ${n - 1} readings are ${hl(S.list(r.shuffle(listed.slice())))}.</p><p>The range of all ${n} readings is ${hl(R + ' ' + c.unit)}, and the missing reading is the <b>${big ? 'largest' : 'smallest'}</b> one. What is the missing reading?</p>`,
        unit: c.unit,
        answer: hidden,
        hints: [
          'Range = maximum − minimum. Work backward from the range.',
          big ? `The missing reading is the maximum. The minimum is the smallest reading you can see, ${Math.min(...listed)}.` : `The missing reading is the minimum. The maximum is the largest reading you can see, ${Math.max(...listed)}.`,
          big ? `The maximum must be ${R} more than ${Math.min(...listed)}. Add.` : `The minimum must be ${R} less than ${Math.max(...listed)}. Subtract.`,
        ],
        hintEs: 'Rango = máximo − mínimo. Trabaja al revés a partir del rango.',
        solution: `<p>${big ? `Maximum − ${Math.min(...listed)} = ${R}, so the maximum is ${Math.min(...listed)} + ${R}` : `${Math.max(...listed)} − minimum = ${R}, so the minimum is ${Math.max(...listed)} − ${R}`} = <b>${hidden}</b> ${c.unit}.</p>`,
        feedback: {
          correct: 'Correct. You used the range to work backward to the missing end of the data.',
          wrong(ans, d) {
            const v = d.value;
            if (big && v === Math.max(...listed) + R) return `You added the range to the largest visible reading. The range is measured from the minimum, ${Math.min(...listed)}.`;
            if (!big && v === Math.min(...listed) - R) return `You subtracted the range from the smallest visible reading. The range is measured from the maximum, ${Math.max(...listed)}.`;
            if (v === R) return 'That is the range itself. Use it to find the missing end value.';
            return big ? 'The missing value is the maximum: add the range to the minimum.' : 'The missing value is the minimum: subtract the range from the maximum.';
          },
        },
      };
    }
    return {
      type: 'num',
      skill: 'range-iqr',
      lesson: '2-5',
      title: mode === 'decimal' ? 'Find the range (decimals)' : 'Find the range',
      prompt: `<p>A surveyor recorded ${c.what} on ${n} visits: ${hl(S.list(vals))}.</p><p>What is the <b>range</b> of the data?</p>`,
      unit: c.unit,
      answer: rg,
      tolerance: 0.01,
      hints: [
        'The range measures the full spread of the data: how far it is from the smallest value to the largest value.',
        mode === 'decimal' ? 'Compare the decimals carefully: whole-number parts first, then tenths. Find the largest and the smallest.' : `The largest value is ${mx}. The smallest value is ${mn}.`,
        mode === 'decimal' ? `The largest value is ${fmt(mx)} and the smallest is ${fmt(mn)}. Subtract, lining up the decimal points.` : `Range = maximum − minimum = ${mx} − ${mn}.`,
      ],
      hintEs: 'El rango mide cuánto se extienden todos los datos: la distancia del valor más pequeño al más grande.',
      solution: `<p>Ordered: ${S.list(s)}. The maximum is ${fmt(mx)} and the minimum is ${fmt(mn)}. Range = ${fmt(mx)} − ${fmt(mn)} = <b>${fmt(rg)}</b> ${c.unit}. The range tells how wide the whole data set is, from end to end.</p>`,
      feedback: {
        correct: `Correct. The data stretches ${fmt(rg)} ${c.unit} from the smallest value to the largest.`,
        wrong(ans, d) {
          if (d.value === mx) return `${fmt(mx)} is the maximum. The range is the distance from the minimum to the maximum: subtract.`;
          if (d.value === rg + 1) return 'You counted the numbers from the minimum to the maximum. The range is a difference: subtract the minimum from the maximum.';
          if (d.value != null && Math.abs(d.value - (vals[vals.length - 1] - vals[0])) < 0.01) return 'You used the last and first numbers in the list. The list is not in order: find the true largest and smallest values.';
          if (mode === 'plain' && n >= 6 && d.value === S.iqr(vals)) return 'That is the interquartile range (Q3 − Q1). The range uses the maximum and the minimum.';
          return 'Find the largest value and the smallest value, then subtract.';
        },
      },
    };
  });

  // ---------- Q1, Q3, IQR step by step (blanks) ----------
  G.define('s5_iqrBlanks', (r, o) => {
    const c = r.pick(CTX),
      hard = !!o.hard,
      n = hard ? r.pick([9, 10, 11, 12]) : r.pick([7, 8]);
    // hard: unordered, more values, and quartiles allowed to land between two values
    let vals;
    for (let t = 0; t < 60; t++) {
      vals = hard ? S.data(r, n, c.lo, c.hi, true) : S.cleanFive(r, n, c.lo, c.hi, true);
      const f0 = S.fiveNum(vals);
      if (!hard || !S.isInt(f0.q1) || !S.isInt(f0.q3) || t > 50) break;
    }
    const s = S.sorted(vals),
      f = S.fiveNum(vals),
      iq = f.q3 - f.q1;
    return {
      type: 'blanks',
      skill: 'range-iqr',
      lesson: '2-5',
      title: hard ? 'Find the IQR (harder)' : 'Find the interquartile range',
      prompt: `<p>Data (${c.what}): ${hl(S.list(hard ? vals : s))}.${hard ? ' A quartile may be a decimal.' : ' The data is already in order.'}</p><p>Find the quartiles and the <b>interquartile range (IQR)</b>.</p>`,
      fields: [
        { label: 'Q1', answer: f.q1, width: 'sm', tolerance: 0.01 },
        { label: 'Q3', answer: f.q3, width: 'sm', tolerance: 0.01 },
        { label: 'IQR', answer: iq, width: 'sm', tolerance: 0.01 },
      ],
      template: ['The first quartile is Q1 = {0} and the third quartile is Q3 = {1}.', 'IQR = Q3 − Q1 = {2}.'],
      hints: [
        `${hard ? 'Order the data first. ' : ''}Q1 is the median of the lower half and Q3 is the median of the upper half. The IQR is Q3 − Q1.`,
        `Ordered: ${S.list(s)}.${n % 2 ? ' Since there are ' + n + ' values (odd), leave the median out of both halves.' : ' Split the ' + n + ' values into two halves of ' + n / 2 + '.'}`,
        halvesSetup(vals) + ' Find the middle of each half, then subtract Q1 from Q3.',
      ],
      hintEs: `${hard ? 'Primero ordena los datos. ' : ''}Q1 es la mediana de la mitad inferior y Q3 es la mediana de la mitad superior. El rango intercuartil es Q3 − Q1.`,
      solution: `<p>Ordered: ${S.list(s)}. ${halvesText(vals)} IQR = ${fmt(f.q3)} − ${fmt(f.q1)} = <b>${fmt(iq)}</b> ${c.unit}. The IQR is the spread of the middle half of the data, so one unusually large or small value cannot stretch it.</p>`,
      feedback: {
        correct: `Correct. Q1 = ${fmt(f.q1)}, Q3 = ${fmt(f.q3)}, and the middle half spans ${fmt(iq)} ${c.unit}.`,
        wrong(ans, d) {
          const got = (ans || []).map(RX.parseNum);
          if (d.wrong.includes(0) || d.wrong.includes(1)) {
            if (n % 2) {
              const h = (n + 1) / 2;
              if (got[0] != null && Math.abs(got[0] - S.median(s.slice(0, h))) < 0.01 && S.median(s.slice(0, h)) !== f.q1) return `Your lower half included the median. With ${n} values, leave the median out, so each half has ${(n - 1) / 2} values.`;
            }
            if (got[0] === f.min || got[1] === f.max) return 'Q1 and Q3 are not the smallest and largest values. They are the middles of the two halves.';
            return `Check the halves. ${n % 2 ? `With ${n} values, the median is left out, so each half has ${(n - 1) / 2} values.` : `Each half has ${n / 2} values.`} Q1 is the middle of the lower half; Q3 is the middle of the upper half.`;
          }
          if (got[2] != null && Math.abs(got[2] - (f.max - f.min)) < 0.01) return 'That is the range (max − min). The IQR uses the quartiles: Q3 − Q1.';
          return `Your quartiles are right. IQR = Q3 − Q1 = ${fmt(f.q3)} − ${fmt(f.q1)}.`;
        },
      },
    };
  });

  // ---------- IQR or range from a box plot (num) ----------
  G.define('s5_iqrFromBox', (r, o) => {
    const hard = !!o.hard;
    const c = r.pick(CTX),
      site = r.pick(SITES);
    const f = S.fiveNum(S.cleanFive(r, 8, c.lo, c.hi, true));
    const iq = f.q3 - f.q1,
      rg = f.max - f.min;
    if (hard) {
      // two readings of spread, then compare them; only every other tick is labeled
      const L = lineFor(f.min, f.max);
      const plot = V.boxPlot({ plots: [Object.assign({ label: site }, f)], lineMin: L.lineMin, lineMax: L.lineMax, step: L.step, labelEvery: L.labelEvery * 2, width: 460, aria: `${site}: min ${f.min}, Q1 ${f.q1}, median ${f.med}, Q3 ${f.q3}, max ${f.max}` });
      const answer = rg - iq;
      return {
        type: 'num',
        skill: 'range-iqr',
        lesson: '2-5',
        title: 'Range versus IQR',
        prompt: `<p>The box plot shows ${c.what} at ${site}. Only some tick marks are labeled.</p>${plot}<p>How much greater is the ${hl('range')} than the ${hl('interquartile range (IQR)')}?</p>`,
        unit: c.unit,
        answer,
        hints: [
          'The range is the length of the whole plot (maximum − minimum). The IQR is the length of the box (Q3 − Q1).',
          `Read the whisker ends and the box edges. Each small tick is worth ${L.step}.`,
          'Find the range and the IQR, then subtract the IQR from the range.',
        ],
        hintEs: 'El rango es el largo de todo el diagrama (máximo − mínimo). El rango intercuartil es el largo de la caja (Q3 − Q1).',
        solution: `<p>Range = ${f.max} − ${f.min} = ${rg}. IQR = ${f.q3} − ${f.q1} = ${iq}. The range is greater by ${rg} − ${iq} = <b>${answer}</b> ${c.unit}. Together, the two whiskers add that much length to the box.</p>`,
        feedback: {
          correct: 'Correct. The whiskers account for the difference between the range and the IQR.',
          wrong(ans, d) {
            if (d.value === rg) return 'That is the range. Now find the IQR (the box length) and subtract it.';
            if (d.value === iq) return 'That is the IQR. Now find the range (the whole plot) and subtract the IQR from it.';
            if (d.value === rg + iq) return 'You added. "How much greater" means subtract the IQR from the range.';
            return `Read all four ends: whiskers ${''}and box edges. Each small tick is ${L.step}.`;
          },
        },
      };
    }
    const ask = r.pick(['iqr', 'iqr', 'range']);
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
      hintEs: ask === 'iqr' ? 'El rango intercuartil es el largo de la caja: Q3 − Q1. Los bordes de la caja son los cuartiles.' : 'El rango es el largo de todo el diagrama, de la punta de un bigote a la punta del otro: máximo − mínimo.',
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

  // ---------- Error: mixed up range and IQR, forgot to order, or kept the median in the halves (error) ----------
  G.define('s5_rangeError', (r, o) => {
    const hard = !!o.hard;
    const name = r.pick(NAMES),
      c = r.pick(CTX),
      variant = hard ? 'medianInHalves' : r.pick(['iqrAsRange', 'unordered']);
    const n = variant === 'medianInHalves' ? r.pick([9, 11]) : 8;
    let vals, s, f, wq1, wq3;
    for (let t = 0; t < 80; t++) {
      vals = S.cleanFive(r, n, c.lo, c.hi, true);
      s = S.sorted(vals);
      f = S.fiveNum(vals);
      const h = (n + 1) / 2;
      wq1 = S.median(s.slice(0, h));
      wq3 = S.median(s.slice(n - h));
      if (variant === 'medianInHalves' ? wq3 - wq1 !== f.q3 - f.q1 && S.isInt(wq1) && S.isInt(wq3) : variant === 'iqrAsRange' ? f.max - f.min !== f.q3 - f.q1 : vals[7] - vals[0] !== f.max - f.min && vals[7] > vals[0]) break;
    }
    const iq = f.q3 - f.q1,
      rg = f.max - f.min;
    const work = {
      iqrAsRange: `"The largest value is ${f.max} and the smallest is ${f.min}. ${f.max} − ${f.min} = ${rg}, so the IQR is <b>${rg}</b>."`,
      unordered: `"The last value is ${vals[7]} and the first value is ${vals[0]}. ${vals[7]} − ${vals[0]} = ${vals[7] - vals[0]}, so the range is <b>${vals[7] - vals[0]}</b>."`,
      medianInHalves: `"Lower half: ${S.list(s.slice(0, (n + 1) / 2))}, so Q1 = ${fmt(wq1)}. Upper half: ${S.list(s.slice((n - 1) / 2))}, so Q3 = ${fmt(wq3)}. IQR = ${fmt(wq3)} − ${fmt(wq1)} = <b>${fmt(wq3 - wq1)}</b>."`,
    }[variant];
    const opts = {
      iqrAsRange: [
        { html: `${name} found the range, not the IQR. The IQR is Q3 − Q1, the spread of the middle half.`, ok: true },
        { html: `${name} should have added ${f.max} and ${f.min}.`, why: 'Measures of spread are differences, not sums. The mistake is which two values were subtracted.' },
        { html: `${name} should have divided ${rg} by 2.`, why: 'Half the range is not the IQR. The IQR comes from the quartiles, Q3 − Q1.' },
        { html: 'There is no mistake. The IQR and the range are the same thing.', why: 'They are different. The range uses the maximum and minimum; the IQR uses Q3 and Q1.' },
      ],
      unordered: [
        { html: `${name} used the first and last values in the list instead of the largest and smallest values.`, ok: true },
        { html: `${name} should have found Q3 − Q1.`, why: 'Q3 − Q1 is the IQR. The question asked for the range, which is maximum − minimum.' },
        { html: `${name} subtracted in the wrong order.`, why: `The subtraction ${vals[7]} − ${vals[0]} is fine. The problem is that ${vals[7]} and ${vals[0]} are not the maximum and minimum.` },
        { html: 'There is no mistake.', why: `The largest value in the data is ${f.max} and the smallest is ${f.min}. Neither one was used.` },
      ],
      medianInHalves: [
        { html: `${name} put the median ${f.med} in both halves. With ${n} values (odd), the median belongs to neither half.`, ok: true },
        { html: `${name} found the range instead of the IQR.`, why: `${name} did subtract quartiles, not the maximum and minimum. Look at what went into each half.` },
        { html: `${name} should have subtracted Q1 − Q3.`, why: 'Q3 − Q1 is the right order, and it keeps the IQR positive. The mistake is in the halves.' },
        { html: 'There is no mistake. Each half should hold the median.', why: `With an odd count, the median is the middle value and stays out of both halves. Each half should have ${(n - 1) / 2} values.` },
      ],
    }[variant];
    const sh = shuffleOptions(r, opts, 0);
    const answer = variant === 'unordered' ? rg : iq;
    return {
      type: 'error',
      skill: 'range-iqr',
      lesson: '2-5',
      title: 'Find the mistake',
      prompt: `<p>${name} is finding the ${variant === 'unordered' ? 'range' : 'IQR'} of ${c.what}: ${hl(S.list(variant === 'unordered' ? vals : s))}.</p><p>What mistake did ${name} make?</p>`,
      work,
      options: sh.options,
      answer: sh.answer,
      fix: { label: variant === 'unordered' ? 'What is the correct range?' : 'What is the correct IQR?', answer },
      hints: {
        iqrAsRange: ['The range and the IQR are different measures. Which two values does each one use?', `The IQR uses the quartiles. ${halvesSetup(vals)}`, 'Find Q1 and Q3 from those halves, then subtract Q1 from Q3.'],
        unordered: ['Is the list in order? The range needs the largest and smallest values, wherever they are in the list.', `Ordered: ${S.list(s)}.`, 'Subtract the smallest value from the largest value.'],
        medianInHalves: [`There are ${n} values. Count the values in each of ${name}'s halves.`, `With an odd count, each half has ${(n - 1) / 2} values. ${halvesSetup(vals)}`, 'Find the middle of each half, then subtract Q1 from Q3.'],
      }[variant],
      hintEs: {
        iqrAsRange: 'El rango y el rango intercuartil son medidas diferentes. ¿Qué dos valores usa cada uno?',
        unordered: '¿La lista está en orden? El rango necesita el valor más grande y el más pequeño, estén donde estén en la lista.',
        medianInHalves: `Hay ${n} datos. Cuenta los valores en cada mitad de ${name}.`,
      }[variant],
      solution: {
        iqrAsRange: `<p>${name} subtracted the minimum from the maximum. That is the <b>range</b> (${rg}), not the IQR. ${halvesText(vals)} IQR = ${f.q3} − ${f.q1} = <b>${iq}</b>.</p>`,
        unordered: `<p>${name} used the first and last numbers in the list, but the list is not in order. Ordered: ${S.list(s)}. Range = ${f.max} − ${f.min} = <b>${rg}</b>.</p>`,
        medianInHalves: `<p>${name} kept the median ${f.med} in both halves. With ${n} values, leave it out. ${halvesText(vals)} IQR = ${f.q3} − ${f.q1} = <b>${iq}</b>.</p>`,
      }[variant],
      feedback: {
        correct: variant === 'unordered' ? 'Correct. The range always uses the true maximum and minimum, not the ends of an unordered list.' : variant === 'iqrAsRange' ? 'Correct. Range: max − min. IQR: Q3 − Q1. Different values, different measures.' : 'Correct. Odd count: the median stays out of both halves.',
        wrong(ans, d) {
          if (!d.mistakeOk) return whyOf(sh, ans && ans.mistake, `Retrace ${name}'s steps one at a time.`);
          const v = RX.parseNum(ans && ans.fix);
          if (variant === 'medianInHalves' && v != null && Math.abs(v - (wq3 - wq1)) < 0.01) return `That is ${name}'s IQR. Rebuild the halves without the median, then subtract.`;
          if (variant !== 'unordered' && v === rg) return 'That is the range. The IQR is Q3 − Q1.';
          return variant === 'unordered' ? 'You found the mistake. Now subtract the smallest value from the largest.' : 'You found the mistake. Now find Q1 and Q3 from the correct halves and subtract.';
        },
      },
    };
  });

  // ---------- Order data sets by range or IQR (seq) ----------
  G.define('s5_seqSpread', (r, o) => {
    const hard = !!o.hard;
    const c = r.pick(CTX),
      k = hard ? 3 : r.pick([3, 4]),
      sites = r.pickN(SITES, k),
      asc = r.chance(0.5);
    // hard: order by IQR, with sets chosen so the IQR order is NOT the range order
    const measure = hard ? S.iqr : S.range;
    let sets, order;
    for (let t = 0; t < 200; t++) {
      sets = sites.map(() => (hard ? S.cleanFive(r, 8, c.lo, c.hi, true) : S.data(r, 5, c.lo, c.hi, true)));
      const ms = sets.map(measure);
      const sortedM = ms.slice().sort((a, b) => a - b);
      if (new Set(ms).size !== k || Math.min(...sortedM.slice(1).map((x, i) => x - sortedM[i])) < 2) continue;
      if (hard) {
        const byR = sets.map((_, i) => i).sort((a, b) => S.range(sets[a]) - S.range(sets[b]));
        const byI = sets.map((_, i) => i).sort((a, b) => ms[a] - ms[b]);
        if (sameOrder(byR, byI)) continue;
      }
      break;
    }
    const items = sets.map((d, i) => ({ html: `<b>${sites[i]}</b>: ${S.list(hard ? S.sorted(d) : d)}`, rate: measure(d) }));
    order = items.map((_, i) => i).sort((a, b) => (asc ? items[a].rate - items[b].rate : items[b].rate - items[a].rate));
    const word = hard ? 'interquartile range (IQR)' : 'range';
    const byRange = items.map((_, i) => i).sort((a, b) => (asc ? S.range(sets[a]) - S.range(sets[b]) : S.range(sets[b]) - S.range(sets[a])));
    return {
      type: 'seq',
      skill: 'range-iqr',
      lesson: '2-5',
      title: hard ? 'Order by IQR' : 'Order by spread',
      prompt: `<p>Each site recorded ${c.what} on ${hard ? 8 : 5} days${hard ? ' (each list is in order)' : ''}. Order the sites by <b>${word}</b>, from ${asc ? '<b>smallest</b> (top) to <b>largest</b> (bottom)' : '<b>largest</b> (top) to <b>smallest</b> (bottom)'}.</p>`,
      items,
      order,
      hints: [
        hard ? 'Find the IQR of each site: split the 8 values into two halves of 4, find Q1 and Q3, then subtract.' : 'Find the range of each site separately: maximum − minimum.',
        hard ? `Do not use the range here. Sites with the widest range may have the tightest middle half.` : `Ranges: ${sets.map((d, i) => `${sites[i]} ${Math.max(...d)} − ${Math.min(...d)}`).join('; ')}.`,
        hard ? `Quartiles: ${sets.map((d, i) => `${sites[i]} Q1 = ${S.q1(d)}, Q3 = ${S.q3(d)}`).join('; ')}. Subtract, then put the ${asc ? 'smallest' : 'largest'} IQR at the top.` : `Subtract each pair, then put the ${asc ? 'smallest' : 'largest'} range at the top.`,
      ],
      hintEs: hard ? 'Halla el rango intercuartil de cada lugar: divide los 8 valores en dos mitades de 4, halla Q1 y Q3 y luego resta.' : 'Halla el rango de cada lugar por separado: máximo − mínimo.',
      solution: `<p>${hard ? 'IQRs' : 'Ranges'}: ${sets.map((d, i) => (hard ? `${sites[i]} = ${S.q3(d)} − ${S.q1(d)} = <b>${S.iqr(d)}</b>` : `${sites[i]} = ${Math.max(...d)} − ${Math.min(...d)} = <b>${S.range(d)}</b>`)).join('; ')}. From ${asc ? 'smallest to largest' : 'largest to smallest'}: <b>${order.map((i) => sites[i]).join(', ')}</b>. ${hard ? 'The IQR measures the spread of the middle half, so it can rank the sites differently than the range does.' : 'A bigger range means the values are more spread out.'}</p>`,
      feedback: {
        correct: `Correct. ${order.map((i) => sites[i])[0]} goes first.`,
        wrong(ans) {
          const a = Array.isArray(ans) ? ans : [];
          if (sameOrder(a, order.slice().reverse())) return `You have the right order but upside down. The ${asc ? 'smallest' : 'largest'} ${hard ? 'IQR' : 'range'} goes on top.`;
          if (hard && sameOrder(a, byRange)) return 'That is the order by range. This question asks for the IQR: the spread of the middle half only.';
          return `Compute each ${hard ? 'IQR (Q3 − Q1)' : 'range (max − min)'} before ordering, and check the direction: ${asc ? 'smallest' : 'largest'} on top.`;
        },
      },
    };
  });

  // ---------- Compare IQRs of two box plots (mc) ----------
  G.define('s5_compareIQR', (r, o) => {
    const hard = !!o.hard;
    const c = r.pick(CTX),
      [l1, l2] = r.pickN(SITES, 2);
    let f1, f2;
    for (let t = 0; t < 200; t++) {
      f1 = S.fiveNum(S.cleanFive(r, 8, c.lo, c.hi, true));
      f2 = S.fiveNum(S.cleanFive(r, 8, c.lo, c.hi, true));
      const i1 = f1.q3 - f1.q1,
        i2 = f2.q3 - f2.q1,
        r1 = f1.max - f1.min,
        r2 = f2.max - f2.min;
      // hard: the site with the tighter box has the WIDER whiskers (range and IQR disagree)
      if (Math.abs(i1 - i2) >= 3 && f1.med !== f2.med && (!hard || (i1 - i2) * (r1 - r2) < 0)) break;
    }
    const i1 = f1.q3 - f1.q1,
      i2 = f2.q3 - f2.q1;
    const tight = i1 < i2 ? l1 : l2,
      loose = tight === l1 ? l2 : l1,
      tightI = Math.min(i1, i2),
      looseI = Math.max(i1, i2);
    const fT = tight === l1 ? f1 : f2,
      fL = tight === l1 ? f2 : f1;
    const higherMed = f1.med > f2.med ? l1 : l2;
    const opts = [
      { html: `${tight}, because its IQR is ${tightI}, which is smaller than ${looseI}.`, ok: true },
      { html: `${loose}, because its IQR is ${looseI}, which is larger than ${tightI}.`, why: 'A larger IQR means the middle half of the data is more spread out, so it is less consistent, not more.' },
      hard
        ? { html: `${loose}, because its range is ${fL.max - fL.min}, which is smaller than ${fT.max - fT.min}.`, why: 'The range includes the whiskers. The question is about the middle half of the data, which only the IQR measures.' }
        : { html: `${higherMed}, because its median of ${Math.max(f1.med, f2.med)} is the higher one.`, why: 'The median is a measure of center. Consistency is about spread, which the IQR measures.' },
      { html: 'Neither, because both of the sites have the same number of values.', why: 'The number of values does not tell you about spread. Compare the lengths of the boxes.' },
    ];
    const sh = shuffleOptions(r, opts, 0);
    return {
      type: 'mc',
      skill: 'range-iqr',
      lesson: '2-5',
      title: 'Which site is more consistent?',
      prompt: `<p>The box plots show ${c.what} at two sites.</p>${box([Object.assign({ label: l1 }, f1), Object.assign({ label: l2 }, f2)])}<p>Which site's middle half of data is <b>more consistent</b> (less spread out)?${hard ? '' : ' Use the IQR.'}</p>`,
      options: sh.options,
      answer: sh.answer,
      hints: [
        'The IQR is the length of the box. A shorter box means the middle half of the data is closer together.',
        hard ? 'Ignore the whiskers for this question: they show the outer quarters, not the middle half.' : `${l1}: Q1 = ${f1.q1}, Q3 = ${f1.q3}. ${l2}: Q1 = ${f2.q1}, Q3 = ${f2.q3}.`,
        hard ? `Read Q1 and Q3 for each site, subtract, and compare the two IQRs.` : `Subtract to find each IQR. The smaller IQR is more consistent.`,
      ],
      hintEs: 'El rango intercuartil es el largo de la caja. Una caja más corta significa que la mitad central de los datos está más junta.',
      solution: `<p>${l1}: IQR = ${f1.q3} − ${f1.q1} = ${i1}. ${l2}: IQR = ${f2.q3} − ${f2.q1} = ${i2}. <b>${tight}</b> has the smaller IQR (${tightI}), so its middle half of data is less spread out and more consistent.${hard ? ` Its whiskers are longer, but the whiskers describe the outer quarters, not the middle half.` : ' The median tells where the center is, not how spread out the data is.'}</p>`,
      feedback: { correct: `Correct. A smaller IQR (${tightI}) means a tighter middle half.`, wrong: (a) => whyOf(sh, a, 'Compare the lengths of the two boxes.') },
    };
  });

  // ---------- Same median, different spread (cr) ----------
  G.define('s5_crVariability', (r, o) => {
    const hard = !!o.hard;
    const c = r.pick(CTX),
      [l1, l2] = r.pickN(SITES, 2),
      n = hard ? 8 : 7;
    // hard: compare with the IQR (needs quartiles), and the two RANGES are close so the range alone hides the difference
    const spread = hard ? S.iqr : S.range;
    let d1, d2;
    if (hard) {
      // Built on purpose: one set has a tight box and long whiskers, the other a wide box and short whiskers,
      // so the ranges are within 3 of each other while the IQRs differ by at least 6.
      const M = r.int(c.lo + 12, Math.max(c.lo + 12, c.hi - 12));
      const T = r.int(18, 24);
      const build = (inner, whiskerFit) => {
        const a1 = r.int(1, 2),
          a2 = a1 + inner(),
          a3 = a2 + 2,
          b2 = a1 + inner(),
          b3 = b2 + 2;
        let a4, b4;
        if (whiskerFit === 'long') {
          a4 = a3 + r.int(3, 6);
          b4 = Math.max(b3 + 2, T - a4);
        } else {
          a4 = a3 + r.int(1, 2);
          b4 = Math.max(b3 + 1, T - a4 + r.int(-1, 1));
        }
        return [M - a4, M - a3, M - a2, M - a1, M + a1, M + b2, M + b3, M + b4];
      };
      const tightSet = build(() => r.int(1, 2), 'long');
      let wideSet = build(() => r.int(5, 6), 'short');
      for (let t = 0; t < 20 && Math.abs(S.range(wideSet) - S.range(tightSet)) > 3; t++) wideSet = build(() => r.int(5, 6), 'short');
      [d1, d2] = r.chance(0.5) ? [tightSet, wideSet] : [wideSet, tightSet];
      d1 = r.shuffle(d1);
      d2 = r.shuffle(d2);
    } else {
      for (let t = 0; t < 300; t++) {
        d1 = S.data(r, n, c.lo + 10, c.hi - 10, true);
        const raw = S.data(r, n, c.lo, c.hi, true);
        const shift = S.median(d1) - S.median(raw);
        d2 = raw.map((v) => v + shift);
        if (d2.every((v) => v >= 0) && new Set(d2).size === n && Math.abs(S.range(d1) - S.range(d2)) >= 6) break;
      }
    }
    const med = S.median(d1),
      r1 = spread(d1),
      r2 = spread(d2);
    const wide = r1 > r2 ? l1 : l2,
      narrow = wide === l1 ? l2 : l1;
    const W = hard ? 'IQR' : 'range';
    const sh = shuffleOptions(
      r,
      [
        { html: `Both sites have the same median, ${fmt(med)}, but ${wide}'s ${hard ? 'middle half' : 'data'} is more spread out (${W} ${Math.max(r1, r2)} vs. ${Math.min(r1, r2)}).`, ok: true },
        { html: `${wide} has the higher median because its ${W} of ${Math.max(r1, r2)} is the larger one.` },
        { html: 'The two data sets are exactly the same because their medians are equal.' },
        { html: hard ? `The two sites vary the same amount because their ranges are close.` : `${narrow} has more data values because its range is smaller.` },
      ],
      0,
    );
    return {
      type: 'cr',
      skill: 'range-iqr',
      lesson: '2-5',
      title: hard ? 'Same center, different middle spread' : 'Same center, different spread',
      prompt: `<p>Two sites recorded ${c.what} on ${n} days.</p><p><b>${l1}</b>: ${hl(S.list(S.sorted(d1)))}<br><b>${l2}</b>: ${hl(S.list(S.sorted(d2)))}</p><p>Both sites have the same median. Explain how the two data sets are <b>different</b>, using the ${hard ? 'interquartile range (IQR)' : 'range'}.</p>`,
      starters: ['Both medians are…, but…', `The ${W} of ${l1} is…, and the ${W} of ${l2} is…`, 'The data at … is more spread out because…'],
      minWords: 10,
      check: { prompt: 'Which statement is true?', options: sh.options, answer: sh.answer },
      hints: [
        hard
          ? 'The median tells where the center is. The IQR tells how spread out the middle half is. Two sets can share a center and a similar range but differ in IQR.'
          : 'The median tells where the center is. The range tells how spread out the values are. Two sets can share a center but differ in spread.',
        hard ? `Split each list of 8 into halves of 4. Find Q1 and Q3 for ${l1}, then for ${l2}.` : `${l1}: range = ${Math.max(...d1)} − ${Math.min(...d1)}. ${l2}: range = ${Math.max(...d2)} − ${Math.min(...d2)}.`,
        hard ? `${l1}: Q1 = ${S.q1(d1)}, Q3 = ${S.q3(d1)}. ${l2}: Q1 = ${S.q1(d2)}, Q3 = ${S.q3(d2)}. Subtract each pair and compare.` : 'Subtract each pair. Which site has the larger range?',
      ],
      hintEs: hard
        ? 'La mediana dice dónde está el centro. El rango intercuartil dice qué tan dispersa está la mitad central de los datos.'
        : 'La mediana dice dónde está el centro. El rango dice qué tan dispersos están los datos. Dos conjuntos pueden tener el mismo centro y diferente dispersión.',
      solution: `<p>Both sites have a median of <b>${fmt(med)}</b> ${c.unit}, so their centers match. But ${l1} has ${hard ? 'an IQR' : 'a range'} of ${r1} and ${l2} has ${hard ? 'an IQR' : 'a range'} of ${r2}. <b>${wide}</b>'s ${hard ? 'middle half is' : 'values are'} much more spread out.${hard ? (Math.abs(S.range(d1) - S.range(d2)) <= 3 ? ` The ranges (${S.range(d1)} and ${S.range(d2)}) are close, so the range alone would hide this.` : ` The ranges are ${S.range(d1)} and ${S.range(d2)}, but the IQR focuses on the middle half.`) : ''} A measure of center alone does not describe a data set; you also need a measure of spread.</p>`,
      feedback: {
        correct: `Correct. Same median, different ${W}: the center matches but the spread does not.`,
        wrong(ans, d) {
          if (!d.wroteEnough) return `Write at least ten words. Name both medians and compare the two ${W}s.`;
          return `For the check, pick the statement that says the medians are equal but the ${W}s are different.`;
        },
      },
    };
  });

  // ---------- Range from a dot plot (num) ----------
  G.define('s5_rangeDot', (r, o) => {
    const hard = !!o.hard;
    const c = r.pick([
      { label: 'Herons per morning', unit: 'herons', lo: 0, hi: 12 },
      { label: 'Burrows per square', unit: 'burrows', lo: 2, hi: 14 },
      { label: 'Snails per trap', unit: 'snails', lo: 1, hi: 11 },
    ]);
    const h = r.pick([
      { label: 'Snail shell length (cm)', unit: 'cm', lo: 1, hi: 7 },
      { label: 'Water depth (feet)', unit: 'feet', lo: 2, hi: 8 },
      { label: 'Reed height (feet)', unit: 'feet', lo: 3, hi: 9 },
    ]);
    const C = hard ? h : c;
    const step = hard ? 0.5 : 1;
    const n = hard ? r.int(12, 15) : r.int(8, 12);
    let vals;
    for (let t = 0; t < 60; t++) {
      vals = S.shaped(r, r.pick(['symmetric', 'skewed right', 'skewed left']), C.lo / step, C.hi / step, n).map((v) => v * step);
      if (S.range(vals) >= 4 * step && (!hard || (Math.min(...vals) % 1 !== 0) !== (Math.max(...vals) % 1 !== 0))) break;
    }
    const mx = Math.max(...vals),
      mn = Math.min(...vals),
      rg = mx - mn,
      distinct = new Set(vals).size;
    return {
      type: 'num',
      skill: 'range-iqr',
      lesson: '2-5',
      title: hard ? 'Range from a dot plot (half units)' : 'Range from a dot plot',
      prompt: `<p>The dot plot shows ${C.label.toLowerCase()} for ${n} ${hard ? 'samples' : 'surveys'}.</p>${V.dotPlot({ values: vals, min: C.lo, max: C.hi, step, label: C.label, aria: 'Dot plot: ' + S.list(S.sorted(vals)) })}<p>What is the <b>range</b> of the data?${hard ? ' Your answer may be a decimal.' : ''}</p>`,
      unit: C.unit,
      answer: rg,
      tolerance: 0.01,
      hints: [
        'The range is maximum − minimum. On a dot plot, look for the leftmost dot and the rightmost dot.',
        hard ? 'The scale goes up by 0.5. Read the values under the leftmost and rightmost dots carefully.' : `The leftmost dot is at ${mn}. The rightmost dot is at ${mx}.`,
        hard ? 'Subtract the leftmost value from the rightmost value.' : `Range = ${mx} − ${mn}.`,
      ],
      hintEs: 'El rango es máximo − mínimo. En un diagrama de puntos, busca el punto que está más a la izquierda y el que está más a la derecha.',
      solution: `<p>The smallest value with a dot is ${fmt(mn)} and the largest is ${fmt(mx)}. Range = ${fmt(mx)} − ${fmt(mn)} = <b>${fmt(rg)}</b> ${C.unit}. Values on the number line with no dots do not count; only the dots are data.</p>`,
      feedback: {
        correct: `Correct. The dots stretch from ${fmt(mn)} to ${fmt(mx)}, a range of ${fmt(rg)}.`,
        wrong(ans, d) {
          if (d.value === C.hi - C.lo) return 'You used the ends of the number line. The range uses the leftmost and rightmost dots, not the line itself.';
          if (d.value === distinct) return 'You counted how many different values have dots. The range is a subtraction: largest value − smallest value.';
          if (d.value === mx) return `${fmt(mx)} is the largest value. Subtract the smallest value to find the range.`;
          if (hard && d.value != null && Math.abs(Math.abs(d.value - rg) - 0.5) < 0.01) return 'Close. One end was misread by half a unit. Each tick on this scale is 0.5.';
          if (hard && d.value === Math.round((mx - mn) / step)) return 'You counted tick marks. Each tick is 0.5, so subtract the two values instead.';
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

  const whyOf = (sh, a, fallback) => (sh.options[a] && sh.options[a].why) || fallback;
  const ord = (k) => k + (k % 10 === 1 && k !== 11 ? 'st' : k % 10 === 2 && k !== 12 ? 'nd' : k % 10 === 3 && k !== 13 ? 'rd' : 'th');
  /** Ordered list plus the step still to do (no answer). */
  const medSetup = (vals) => {
    const n = vals.length;
    return `ordered ${S.list(S.sorted(vals))}; ${n} values, so ${n % 2 ? `take the ${ord((n + 1) / 2)} value` : `average the ${ord(n / 2)} and ${ord(n / 2 + 1)} values`}`;
  };

  // ---------- Spot the outlier (mc) ----------
  G.define('s6_spotOutlier', (r, o) => {
    const hard = !!o.hard;
    const c = r.pick(CTX),
      n = r.pick([8, 9, 10]);
    let d = withOutlier(r, c, n);
    let stretch = null;
    if (hard) {
      // a "stretched" value at the OTHER end of the cluster, 3–4 away from its neighbor: a gap, but not an outlier
      const high = d.out > Math.max(...d.cluster);
      const cl = S.sorted(d.cluster);
      const gap = r.int(3, 4);
      stretch = high ? cl[0] - gap : cl[cl.length - 1] + gap;
      if (stretch < 0) stretch = cl[cl.length - 1] + gap;
      if (stretch === d.out || d.cluster.includes(stretch)) stretch = null;
      else {
        const cluster = d.cluster.concat([stretch]);
        d = { all: r.shuffle(cluster.concat([d.out])), cluster, out: d.out };
      }
    }
    const s = S.sorted(d.all),
      med = S.median(d.all);
    const high = d.out > Math.max(...d.cluster);
    const nearEnd = high ? Math.max(...d.cluster) : Math.min(...d.cluster);
    const farEnd = high ? Math.min(...d.cluster) : Math.max(...d.cluster);
    const pool = [
      { html: String(d.out), ok: true },
      { html: String(nearEnd), why: `${nearEnd} is the ${high ? 'largest' : 'smallest'} value in the main group, but it sits close to the other values. An outlier is far from the rest.` },
      stretch != null
        ? { html: String(stretch), why: `${stretch} is a little apart from its neighbors, but that gap is small compared with the gap next to ${d.out}.` }
        : { html: String(farEnd), why: `${farEnd} is at one end of the main group, but the gap between it and its neighbors is small.` },
    ];
    if (!hard && Number.isInteger(med) && med !== nearEnd && med !== farEnd && med !== d.out) pool.push({ html: String(med), why: `${med} is the median, right in the middle of the data. An outlier is far away from the middle.` });
    else pool.push({ html: 'There is no outlier.', why: `Look at the gap between ${d.out} and the next closest value. That gap is much bigger than any other gap.` });
    const sh = shuffleOptions(r, pool, 0);
    const bigGap = Math.abs(d.out - nearEnd);
    return {
      type: 'mc',
      skill: 'outliers',
      lesson: '2-6',
      title: hard ? 'Spot the outlier (no plot)' : 'Spot the outlier',
      prompt: hard
        ? `<p>The salvaged log lists ${c.what}: ${hl(S.list(d.all))}.</p><p>There is no plot this time. Which value is an <b>outlier</b>, a value far from the rest of the data?</p>`
        : `<p>The salvaged log lists ${c.what}. Each dot is one entry.</p>${dots(d.all, c)}<p>Data: ${hl(S.list(d.all))}. Which value is an <b>outlier</b>, a value far from the rest of the data?</p>`,
      options: sh.options,
      answer: sh.answer,
      hints: [
        hard
          ? 'Order the values. Then look at the gap between each pair of neighbors. An outlier sits on the far side of a gap that is much bigger than the others.'
          : 'Look at the dot plot. Most of the dots sit close together in one group. An outlier is a dot with a big empty gap between it and that group.',
        `Ordered: ${S.list(s)}.`,
        hard ? 'Two gaps stand out. Compare their sizes: which one is far bigger than every other gap?' : `Find the largest gap between neighbors. Which value is on the outside of it?`,
      ],
      hintEs: hard
        ? 'Ordena los valores. Luego mira la distancia entre cada par de vecinos. Un valor atípico está del otro lado de un hueco mucho más grande que los demás.'
        : 'Mira el diagrama de puntos. Casi todos los puntos están juntos en un grupo. Un valor atípico es un punto separado de ese grupo por un gran hueco.',
      solution: `<p>Most values cluster between ${Math.min(...d.cluster)} and ${Math.max(...d.cluster)}. The value <b>${d.out}</b> sits ${bigGap} ${c.unit} away from its nearest neighbor, far from the rest, so it is the outlier.${stretch != null ? ` The value ${stretch} is only ${Math.abs(stretch - (high ? S.sorted(d.cluster)[1] : S.sorted(d.cluster)[d.cluster.length - 2]))} away from its neighbor, so it still belongs with the group.` : ''}</p>`,
      feedback: { correct: `Correct. ${d.out} is far from the main group of data.`, wrong: (a) => whyOf(sh, a, 'Compare the gaps between neighboring values.') },
    };
  });

  // ---------- Median with and without the outlier (blanks) ----------
  G.define('s6_medianWithWithout', (r, o) => {
    const hard = !!o.hard;
    const c = r.pick(CTX),
      n = hard ? r.pick([8, 10]) : r.pick([7, 9]);
    const d = withOutlier(r, c, n);
    const withM = S.median(d.all),
      withoutM = S.median(d.cluster),
      change = Math.abs(withM - withoutM);
    const fields = [
      { label: 'median with outlier', answer: withM, width: 'sm', tolerance: 0.01 },
      { label: 'median without outlier', answer: withoutM, width: 'sm', tolerance: 0.01 },
    ];
    const template = ['With all ' + n + ' values, the median is {0}.', 'Without ' + d.out + ', the median of the remaining ' + (n - 1) + ' values is {1}.'];
    if (hard) {
      fields.push({ label: 'change in the median', answer: change, width: 'sm', tolerance: 0.01 });
      template.push('Removing the outlier changed the median by {2}.');
    }
    return {
      type: 'blanks',
      skill: 'outliers',
      lesson: '2-6',
      title: hard ? 'How much does the median move?' : 'Median with and without the outlier',
      prompt: `<p>Data (${c.what}): ${hl(S.list(d.all))}. The value ${hl(d.out)} is an outlier.</p><p>Find the median with the outlier, then the median after removing it.${hard ? ' Then find how much the median changed.' : ''}${Number.isInteger(withoutM) && Number.isInteger(withM) ? '' : ' A median may be a decimal.'}</p>`,
      fields,
      template,
      hints: [
        'Order the data each time. With an odd count, the median is the single middle value. With an even count, it is halfway between the two middle values.',
        `With the outlier: ${medSetup(d.all)}.`,
        `Without ${d.out}: ${medSetup(d.cluster)}.${hard ? ' Then subtract the smaller median from the larger.' : ''}`,
      ],
      hintEs: 'Ordena los datos cada vez. Si hay un número impar de datos, la mediana es el valor del medio. Si hay un número par, es el punto medio entre los dos valores del centro.',
      solution: `<p>With the outlier: ${medText(d.all)}, so the median is <b>${fmt(withM)}</b>. Without ${d.out}: ${medText(d.cluster)}, so the median is <b>${fmt(withoutM)}</b>. The median moved only <b>${fmt(change)}</b> ${c.unit}, because the median depends on the middle position, not on how extreme the end values are.</p>`,
      feedback: {
        correct: `Correct. The median barely moved (${fmt(withM)} to ${fmt(withoutM)}). Outliers have little effect on the median.`,
        wrong(ans, d2) {
          const got = (ans || []).map(RX.parseNum);
          if (d2.wrong.includes(0)) {
            if (got[0] === d.all[Math.floor(n / 2)] || got[0] === d.all[(n - 1) / 2]) return 'That is the middle of the list as written. Order the data first.';
            return `Order all ${n} values first, then find the middle${n % 2 ? '' : ' two values and average them'}.`;
          }
          if (d2.wrong.includes(1)) return `After removing ${d.out}, there are ${n - 1} values, an ${(n - 1) % 2 ? 'odd' : 'even'} number. ${(n - 1) % 2 ? 'Take the single middle value.' : 'Average the two middle values.'}`;
          return 'Both medians are right. Subtract the smaller one from the larger one to find the change.';
        },
      },
    };
  });

  // ---------- Effect of removing an outlier (tf) ----------
  G.define('s6_effectTF', (r, o) => {
    const hard = !!o.hard;
    const c = r.pick(CTX),
      n = hard ? r.pick([9, 11]) : r.pick([8, 9, 10]);
    let d, m1, m2, q1, q2;
    for (let t = 0; t < 80; t++) {
      d = withOutlier(r, c, n);
      m1 = S.median(d.all);
      m2 = S.median(d.cluster);
      q1 = S.iqr(d.all);
      q2 = S.iqr(d.cluster);
      if (Math.abs(m1 - m2) <= 1.5 && (!hard || Math.abs(q1 - q2) <= 2)) break;
    }
    const r1 = S.range(d.all),
      r2 = S.range(d.cluster);
    // hard: claims about the IQR, which (like the median) resists the outlier
    const variant = hard ? r.pick(['iqrLittle', 'iqrBig', 'rangeLittle']) : r.pick(['medianBig', 'rangeBig', 'medianLittle']);
    const claim = {
      medianBig: { text: `Removing the outlier ${d.out} changes the median a lot.`, answer: false, reason: `The median only moves from ${fmt(m1)} to ${fmt(m2)}. The median depends on the middle position, so one far-away value barely changes it.` },
      rangeBig: { text: `Removing the outlier ${d.out} changes the range a lot.`, answer: true, reason: `The range drops from ${r1} to ${r2}. The range uses the maximum and minimum, so an outlier at one end stretches it.` },
      medianLittle: { text: `Removing the outlier ${d.out} changes the median very little.`, answer: true, reason: `The median moves from ${fmt(m1)} to ${fmt(m2)}, a change of ${fmt(Math.abs(m1 - m2))}. The middle position barely shifts when one end value is removed.` },
      iqrLittle: { text: `Removing the outlier ${d.out} changes the IQR very little.`, answer: true, reason: `The IQR goes from ${fmt(q1)} to ${fmt(q2)}. The IQR only uses the middle half of the data, so one far-away value barely changes it.` },
      iqrBig: { text: `Removing the outlier ${d.out} changes the IQR about as much as it changes the range.`, answer: false, reason: `The range drops by ${r1 - r2}, but the IQR changes by only ${fmt(Math.abs(q1 - q2))}. The IQR ignores the end values; the range is built from them.` },
      rangeLittle: { text: `Removing the outlier ${d.out} changes the range very little, just like the median.`, answer: false, reason: `The median barely moves, but the range drops from ${r1} to ${r2}. The range is built from the end values, so the outlier stretches it.` },
    }[variant];
    const reasons = r.shuffle([
      { html: claim.reason, correct: true },
      { html: /range/.test(variant) && !hard ? 'The range never changes when a value is removed.' : 'Removing any value always changes every measure by exactly that value.' },
      { html: hard ? 'The IQR is found from the maximum and minimum, so it moves as much as the range.' : variant === 'rangeBig' ? 'The range is the middle value, so it moves a little.' : 'The median is the largest value, so removing an outlier changes it a lot.' },
    ]);
    const uses = /iqr/.test(variant);
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
        uses
          ? `With the outlier there are ${n} values (leave the median out of the halves). Without it there are ${n - 1} values. Find Q1 and Q3 each time.`
          : /range/.test(variant)
            ? `With the outlier: range = ${Math.max(...d.all)} − ${Math.min(...d.all)}. Without it: ${Math.max(...d.cluster)} − ${Math.min(...d.cluster)}.`
            : `With the outlier: ${medSetup(d.all)}. Without it: ${medSetup(d.cluster)}.`,
        uses ? 'Compare the change in the IQR with the change in the range. Which one moved more?' : 'Subtract to see how much the measure changed. Is that a lot, compared with the size of the data?',
      ],
      hintEs: 'Calcula la medida con todos los valores y luego otra vez sin el valor atípico. Compara los dos resultados.',
      solution: `<p><b>${claim.answer ? 'True' : 'False'}.</b> ${claim.reason} In general, an outlier has a big effect on the range but a small effect on the median and the IQR.</p>`,
      feedback: {
        correct: 'Correct. Outliers stretch the range but barely move the median or the IQR.',
        wrong(ans, d2) {
          if (!d2.valueOk) return uses ? `Compare: the IQR goes from ${fmt(q1)} to ${fmt(q2)}, while the range goes from ${r1} to ${r2}.` : /range/.test(variant) ? `Compare the two ranges: ${r1} with the outlier, ${r2} without.` : `Compare the two medians: ${fmt(m1)} with the outlier, ${fmt(m2)} without. How far apart are they?`;
          return 'Your true/false choice is right. Pick the reason that names the two values you computed.';
        },
      },
    };
  });

  // ---------- Median and range (and IQR), with and without (table) ----------
  G.define('s6_tableEffect', (r, o) => {
    const hard = !!o.hard;
    const c = r.pick(CTX),
      n = hard ? 9 : r.pick([7, 9]);
    const d = withOutlier(r, c, n);
    const m1 = S.median(d.all),
      m2 = S.median(d.cluster),
      r1 = S.range(d.all),
      r2 = S.range(d.cluster),
      i1 = S.iqr(d.all),
      i2 = S.iqr(d.cluster);
    const rows = hard
      ? [
          ['', 'Median', 'IQR', 'Range'],
          ['With the outlier', '__IN:m1__', '__IN:i1__', '__IN:r1__'],
          ['Without the outlier', '__IN:m2__', '__IN:i2__', '__IN:r2__'],
        ]
      : [
          ['', 'Median', 'Range'],
          ['With the outlier', '__IN:m1__', '__IN:r1__'],
          ['Without the outlier', '__IN:m2__', '__IN:r2__'],
        ];
    const inputs = [
      { id: 'm1', answer: m1, tolerance: 0.01 },
      { id: 'r1', answer: r1 },
      { id: 'm2', answer: m2, tolerance: 0.01 },
      { id: 'r2', answer: r2 },
    ];
    if (hard) inputs.push({ id: 'i1', answer: i1, tolerance: 0.01 }, { id: 'i2', answer: i2, tolerance: 0.01 });
    return {
      type: 'table',
      skill: 'outliers',
      lesson: '2-6',
      title: hard ? 'Three measures, with and without' : 'With and without the outlier',
      prompt: `<p>Data (${c.what}): ${hl(S.list(d.all))}. The outlier is ${hl(d.out)}.</p><p>Complete the table. Find each measure with all the data, then after removing the outlier.${Number.isInteger(m2) && (!hard || (Number.isInteger(i1) && Number.isInteger(i2))) ? '' : ' Some answers may be decimals.'}</p>`,
      rows,
      header: true,
      rowHeader: true,
      inputs,
      hints: [
        `Order the data. Median: the middle value (or the average of the two middle values). ${hard ? 'IQR: Q3 − Q1. ' : ''}Range: maximum − minimum.`,
        `With the outlier: ${medSetup(d.all)}; range ${Math.max(...d.all)} − ${Math.min(...d.all)}.${hard ? ` For the IQR, leave the median out: halves of ${(n - 1) / 2}.` : ''}`,
        `Without ${d.out}: ${medSetup(d.cluster)}; range ${Math.max(...d.cluster)} − ${Math.min(...d.cluster)}.${hard ? ` For the IQR, split the ${n - 1} values into halves of ${(n - 1) / 2}.` : ''}`,
      ],
      hintEs: `Ordena los datos. Mediana: el valor del medio (o el promedio de los dos valores del medio). ${hard ? 'Rango intercuartil: Q3 − Q1. ' : ''}Rango: máximo − mínimo.`,
      solution: `<p>With the outlier: median <b>${fmt(m1)}</b>, ${hard ? `IQR <b>${fmt(i1)}</b>, ` : ''}range <b>${r1}</b>. Without the outlier: median <b>${fmt(m2)}</b>, ${hard ? `IQR <b>${fmt(i2)}</b>, ` : ''}range <b>${r2}</b>. The range shrank by ${r1 - r2} but the median moved only ${fmt(Math.abs(m1 - m2))}${hard ? ` and the IQR only ${fmt(Math.abs(i1 - i2))}` : ''}. The outlier stretches the range because the range uses the end values; the median${hard ? ' and IQR use' : ' uses'} the middle of the data.</p>`,
      feedback: {
        correct: hard ? 'Correct. Big change in the range; small changes in the median and IQR.' : 'Correct. Big change in the range, small change in the median.',
        wrong(ans, d2) {
          const v = (k) => RX.parseNum((ans || {})[k]);
          if (d2.wrong.includes('r1') || d2.wrong.includes('r2')) {
            if (v('r2') === r1) return `Without the outlier, the maximum or minimum changes. Use the new largest and smallest values.`;
            return 'Check a range: subtract the smallest value from the largest value in that set.';
          }
          if (d2.wrong.includes('i1') || d2.wrong.includes('i2')) return `For each IQR, split the ordered data into halves (leave the median out when the count is odd), find Q1 and Q3, then subtract.`;
          if (d2.wrong.includes('m2')) return `Without ${d.out} there are ${n - 1} values, an ${(n - 1) % 2 ? 'odd' : 'even'} number. ${(n - 1) % 2 ? 'Take the middle value.' : 'The median is halfway between the two middle values.'}`;
          return `Order all ${n} values first. The median is the middle one.`;
        },
      },
    };
  });

  // ---------- Compare medians of two dot plots (num) ----------
  G.define('s6_compareDots', (r, o) => {
    const hard = !!o.hard;
    const c = r.pick(CTX),
      [l1, l2] = r.pickN(LOGS, 2),
      n = hard ? r.pick([10, 12]) : r.pick([9, 11]);
    let d1, d2;
    for (let t = 0; t < 80; t++) {
      d1 = S.shaped(r, r.pick(['symmetric', 'skewed right']), c.lo, c.hi, n);
      d2 = S.shaped(r, r.pick(['symmetric', 'skewed left']), c.lo, c.hi, n);
      const df = Math.abs(S.median(d1) - S.median(d2));
      // hard: even counts and a median that falls between two dots
      if (df >= 1.5 && (!hard || !S.isInt(S.median(d1)) || !S.isInt(S.median(d2)))) break;
    }
    const m1 = S.median(d1),
      m2 = S.median(d2);
    const hi = m1 > m2 ? l1 : l2,
      lo = hi === l1 ? l2 : l1,
      diff = Math.abs(m1 - m2);
    const pos = hard ? `the ${ord(n / 2)} and ${ord(n / 2 + 1)} dots` : `the ${ord((n + 1) / 2)} dot`;
    return {
      type: 'num',
      skill: 'compare-dist',
      lesson: '2-6',
      title: hard ? 'Compare two dot plots (even counts)' : 'Compare two dot plots',
      prompt: `<p>Two crews recorded ${c.what} on ${n} dives each.</p><p><b>${l1}</b></p>${dots(d1, c, l1, 420)}<p><b>${l2}</b></p>${dots(d2, c, l2, 420)}<p>${hi} has the greater median. <b>How much greater</b> is it than ${lo}'s median?${hard ? ' Your answer may be a decimal.' : ''}</p>`,
      unit: c.unit,
      answer: diff,
      tolerance: 0.01,
      hints: [
        `Each plot has ${n} dots. The median is ${hard ? 'halfway between ' + pos : pos} counting from the left.`,
        `${l1}: ordered ${S.list(S.sorted(d1))}. ${l2}: ordered ${S.list(S.sorted(d2))}.`,
        `Find each median from ${pos}, then subtract the smaller median from the larger.`,
      ],
      hintEs: `Cada diagrama tiene ${n} puntos. La mediana está ${hard ? `a la mitad entre los puntos ${n / 2}.º y ${n / 2 + 1}.º` : `en el punto ${(n + 1) / 2}.º`}, contando desde la izquierda.`,
      solution: `<p>${l1}: median ${fmt(m1)}. ${l2}: median ${fmt(m2)}. ${hi}'s median is greater by ${fmt(Math.max(m1, m2))} − ${fmt(Math.min(m1, m2))} = <b>${fmt(diff)}</b> ${c.unit}. Comparing medians compares the typical value of each crew.</p>`,
      feedback: {
        correct: `Correct. ${hi}'s typical value is ${fmt(diff)} ${c.unit} higher.`,
        wrong(ans, d) {
          if (d.value === Math.abs(Math.max(...d1) - Math.max(...d2))) return 'You compared the largest values. The median is the middle of each plot.';
          if (d.value === m1 || d.value === m2) return 'That is one median. The question asks for the difference between the two medians.';
          if (hard && d.value != null && Number.isInteger(d.value) && Math.abs(d.value - diff) === 0.5) return `Close. With ${n} dots, each median is halfway between two middle dots, so a median can end in .5.`;
          return `Find ${pos} in each plot to get each median, then subtract.`;
        },
      },
    };
  });

  // ---------- Who compared the data correctly (who) ----------
  G.define('s6_whoCompare', (r, o) => {
    const hard = !!o.hard;
    const c = r.pick(CTX),
      [a, b, e] = r.pickN(NAMES, 3),
      [l1, l2] = r.pickN(LOGS, 2),
      n = hard ? 8 : 7;
    let d1, d2;
    for (let t = 0; t < 200; t++) {
      d1 = S.data(r, n, c.lo, c.hi, true);
      d2 = S.data(r, n, c.lo, c.hi, true);
      if (hard) d2[r.int(0, n - 1)] = c.hi + r.int(8, 12); // one crew has an outlier
      const hiMed = S.median(d1) > S.median(d2) ? d1 : d2,
        other = hiMed === d1 ? d2 : d1;
      // the set with the greater median has the SMALLER maximum and SMALLER range, so "extremes" reasoning fails
      if (S.median(d1) !== S.median(d2) && Math.max(...hiMed) < Math.max(...other) && S.range(hiMed) < S.range(other) && (!hard || hiMed === d1)) break;
    }
    const m1 = S.median(d1),
      m2 = S.median(d2);
    const hi = m1 > m2 ? l1 : l2,
      lo = hi === l1 ? l2 : l1;
    const dHi = hi === l1 ? d1 : d2,
      dLo = hi === l1 ? d2 : d1;
    const opts = [
      { html: `<b>${a}</b>: "${hi} has the greater median, ${fmt(Math.max(m1, m2))} compared to ${fmt(Math.min(m1, m2))}. A typical value is higher for ${hi}."`, ok: true },
      { html: `<b>${b}</b>: "${lo} has the greater median, because its largest value, ${Math.max(...dLo)}, beats ${hi}'s largest value, ${Math.max(...dHi)}."`, why: `One large value does not set the median. The median is the middle of the ordered data, and ${lo}'s middle is lower.` },
      { html: `<b>${e}</b>: "${lo} has the greater median, because its range of ${S.range(dLo)} is bigger than ${hi}'s range of ${S.range(dHi)}."`, why: 'The range measures spread, not center. A wider spread does not mean a higher middle value.' },
    ];
    const sh = shuffleOptions(r, opts, 0);
    return {
      type: 'who',
      skill: 'compare-dist',
      lesson: '2-6',
      title: 'Who compared correctly?',
      prompt: `<p>Two crews recorded ${c.what}.${hard ? ` One crew's log includes an outlier.` : ''}</p><p><b>${l1}</b>: ${hl(S.list(d1))}<br><b>${l2}</b>: ${hl(S.list(d2))}</p><p>Who correctly compares the <b>medians</b>?</p>`,
      options: sh.options,
      answer: sh.answer,
      layout: 'cards',
      hints: [
        'Find each median: order the values and take the middle. Then compare.',
        `${l1}: ${medSetup(d1)}. ${l2}: ${medSetup(d2)}.`,
        'Which student uses the two medians? The largest value and the range do not decide the median.',
      ],
      hintEs: 'Halla cada mediana: ordena los valores y toma el del medio. Luego compáralas.',
      solution: `<p><b>${a}</b> is correct. ${l1} has median ${fmt(m1)} and ${l2} has median ${fmt(m2)}, so <b>${hi}</b> has the greater median. The largest single value and the range do not decide the median; only the middle of the ordered data does.${hard ? ' The outlier stretches the range and the maximum, but it barely moves the median.' : ''}</p>`,
      feedback: { correct: 'Correct. Compare medians by finding each middle value, not by looking at extremes.', wrong: (x) => whyOf(sh, x, 'Find both medians, then compare.') },
    };
  });

  // ---------- Sort claims about two data sets (sort) ----------
  G.define('s6_sortClaims', (r, o) => {
    const hard = !!o.hard;
    const c = r.pick(CTX),
      [l1, l2] = r.pickN(LOGS, 2),
      n = hard ? 8 : 7;
    let d1, d2;
    for (let t = 0; t < 600; t++) {
      d1 = hard ? S.cleanFive(r, n, c.lo, c.hi + 4, true) : S.data(r, n, c.lo, c.hi, true);
      d2 = hard ? S.cleanFive(r, n, c.lo, c.hi + 4, true) : S.data(r, n, c.lo, c.hi, true);
      const okBase = S.median(d1) !== S.median(d2) && S.range(d1) !== S.range(d2) && Math.max(...d1) !== Math.max(...d2);
      // hard: the set with the larger range has the SMALLER IQR
      if (okBase && (!hard || (S.iqr(d1) !== S.iqr(d2) && (S.range(d1) - S.range(d2)) * (S.iqr(d1) - S.iqr(d2)) < 0))) break;
    }
    const m1 = S.median(d1),
      m2 = S.median(d2),
      r1 = S.range(d1),
      r2 = S.range(d2),
      i1 = S.iqr(d1),
      i2 = S.iqr(d2);
    const medHi = m1 > m2 ? l1 : l2,
      medLo = medHi === l1 ? l2 : l1,
      rgHi = r1 > r2 ? l1 : l2,
      rgLo = rgHi === l1 ? l2 : l1,
      iqHi = i1 > i2 ? l1 : l2,
      iqLo = iqHi === l1 ? l2 : l1;
    const list = hard
      ? [
          { html: `${medHi} has the greater median.`, bin: 0, k: 'med' },
          { html: `${medLo} has the greater median.`, bin: 1, k: 'med' },
          { html: `${iqHi}'s middle half is more spread out (greater IQR).`, bin: 0, k: 'iqr' },
          { html: `${iqLo}'s middle half is more spread out (greater IQR).`, bin: 1, k: 'iqr' },
          rgHi !== iqHi
            ? { html: `${rgHi} has the greater range, so its middle half is also more spread out.`, bin: 1, k: 'mix' }
            : { html: `${rgLo} has the greater range.`, bin: 1, k: 'rng' },
          { html: `The IQR of ${l2} is ${fmt(i2 + r.pick([-2, 2]))}.`, bin: 1, k: 'iqr' },
        ]
      : [
          { html: `${medHi} has the greater median.`, bin: 0, k: 'med' },
          { html: `${medLo} has the greater median.`, bin: 1, k: 'med' },
          { html: `${rgHi}'s data is more spread out (greater range).`, bin: 0, k: 'rng' },
          { html: `${rgLo}'s data is more spread out (greater range).`, bin: 1, k: 'rng' },
          { html: `The median of ${l1} is ${fmt(m1)}.`, bin: 0, k: 'med' },
          { html: `The range of ${l2} is ${r2 + r.pick([-2, 2, 3])}.`, bin: 1, k: 'rng' },
        ];
    const items = r.shuffle(list);
    return {
      type: 'sort',
      skill: 'compare-dist',
      lesson: '2-6',
      title: hard ? 'True or false: center and middle spread' : 'True or false claims',
      prompt: `<p>Two crews recorded ${c.what} on ${n} dives.</p><p><b>${l1}</b>: ${hl(S.list(d1))}<br><b>${l2}</b>: ${hl(S.list(d2))}</p><p>Sort each claim as true or false.</p>`,
      bins: ['True', 'False'],
      items,
      hints: [
        hard ? 'Order each set. Find its median, its IQR (Q3 − Q1), and its range (maximum − minimum).' : 'Order each set. Find its median (middle value) and its range (maximum − minimum).',
        `${l1}: ordered ${S.list(S.sorted(d1))}. ${l2}: ordered ${S.list(S.sorted(d2))}.`,
        hard ? 'Check each claim against the measure it names. A bigger range does not have to mean a bigger IQR.' : 'Compute the two medians and the two ranges, then check each claim against them.',
      ],
      hintEs: hard ? 'Ordena cada conjunto. Halla su mediana, su rango intercuartil (Q3 − Q1) y su rango (máximo − mínimo).' : 'Ordena cada conjunto. Halla su mediana (el valor del medio) y su rango (máximo − mínimo).',
      solution: `<p>${l1}: median <b>${fmt(m1)}</b>, ${hard ? `IQR <b>${fmt(i1)}</b>, ` : ''}range <b>${r1}</b>. ${l2}: median <b>${fmt(m2)}</b>, ${hard ? `IQR <b>${fmt(i2)}</b>, ` : ''}range <b>${r2}</b>. So ${medHi} has the greater median, and ${hard ? `${iqHi}'s middle half is more spread out even though ${rgHi} has the greater range` : `${rgHi}'s data is more spread out`}. A claim is true only if it matches these computed values.</p>`,
      feedback: {
        correct: 'Correct. Center and spread are separate comparisons.',
        wrong(ans, d) {
          const it = items[d.wrong[0]];
          if (it && it.k === 'mix') return `The range and the IQR can disagree. Compare the IQRs: ${l1} ${fmt(i1)}, ${l2} ${fmt(i2)}.`;
          if (it && it.k === 'med') return `Check the medians: order each set and find the middle. ${l1} has median ${fmt(m1)}; ${l2} has median ${fmt(m2)}.`;
          if (it && it.k === 'iqr') return 'Check the IQRs: split each ordered set into halves, find Q1 and Q3, and subtract.';
          return `Check the ranges: maximum − minimum. ${l1} has range ${r1}; ${l2} has range ${r2}.`;
        },
      },
    };
  });

  // ---------- Compare two distributions in writing (cr) ----------
  G.define('s6_crCompare', (r, o) => {
    const hard = !!o.hard;
    const c = r.pick(CTX),
      [l1, l2] = r.pickN(LOGS, 2),
      n = 9;
    let d1, d2;
    for (let t = 0; t < 80; t++) {
      d1 = S.shaped(r, 'symmetric', c.lo, c.lo + 4, n);
      d2 = S.shaped(r, 'symmetric', c.lo, c.hi, n);
      if (hard) d1[0] = c.hi + r.int(5, 8); // an outlier stretches the tight crew's range
      if (S.median(d1) !== S.median(d2) && (hard ? S.iqr(d2) - S.iqr(d1) >= 2 && S.range(d1) > S.range(d2) : S.range(d2) - S.range(d1) >= 3)) break;
    }
    const m1 = S.median(d1),
      m2 = S.median(d2),
      r1 = S.range(d1),
      r2 = S.range(d2),
      i1 = S.iqr(d1),
      i2 = S.iqr(d2);
    const medHi = m1 > m2 ? l1 : l2;
    const sh = shuffleOptions(
      r,
      hard
        ? [
            { html: `${medHi} has the greater median, and ${l2}'s middle half is more spread out (IQR ${fmt(i2)} vs. ${fmt(i1)}).`, ok: true },
            { html: `${l1} is more spread out overall because its range of ${r1} is bigger, so its middle half is too.` },
            { html: `The two crews have the same center because both crews recorded ${n} dives.` },
            { html: `${l1} has the greater median because its outlier is the largest value.` },
          ]
        : [
            { html: `${medHi} has the greater median, and ${l2} is more spread out (range ${r2} vs. ${r1}).`, ok: true },
            { html: `${l1} is more spread out because its dots are stacked higher than ${l2}'s dots.` },
            { html: `The two crews have the same median because both crews recorded ${n} dives.` },
            { html: `${l2} has the greater median because it has the largest single value.` },
          ],
      0,
    );
    return {
      type: 'cr',
      skill: 'compare-dist',
      lesson: '2-6',
      title: hard ? 'Compare the crews (with an outlier)' : 'Compare the two crews',
      prompt: `<p>Two crews recorded ${c.what} on ${n} dives each.${hard ? ` ${l1}'s log has one outlier.` : ''}</p><p><b>${l1}</b></p>${dots(d1, c, l1, 420)}<p><b>${l2}</b></p>${dots(d2, c, l2, 420)}<p>Compare the two distributions. Use the <b>median</b> (center) and the <b>${hard ? 'IQR' : 'range'}</b> (spread) in your answer.${hard ? ' Explain why the range would be misleading here.' : ''}</p>`,
      starters: [`The median of ${l1} is… and the median of ${l2} is…`, hard ? 'The IQR of … is…, so its middle half…' : 'The data for … is more spread out because…', hard ? 'The range is misleading because…' : 'A typical dive for … had…'],
      minWords: 12,
      check: { prompt: 'Which comparison is correct?', options: sh.options, answer: sh.answer },
      hints: [
        hard
          ? 'Center first: the 5th dot in each plot is the median. Then spread: find each IQR from the middle half, not the range.'
          : 'Center first: count to the 5th dot in each plot to find the median. Then spread: find each range from the leftmost dot to the rightmost dot.',
        hard ? `${l1} ordered: ${S.list(S.sorted(d1))}. ${l2} ordered: ${S.list(S.sorted(d2))}. Leave the median out and find Q1 and Q3 for each.` : `${l1}: range ${Math.max(...d1)} − ${Math.min(...d1)}. ${l2}: range ${Math.max(...d2)} − ${Math.min(...d2)}.`,
        hard ? `Compare the two medians and the two IQRs. Then look at what the outlier does to ${l1}'s range.` : 'Compare the two medians and the two ranges. Say both in your answer.',
      ],
      hintEs: hard
        ? 'Primero el centro: el 5.º punto de cada diagrama es la mediana. Luego la dispersión: halla cada rango intercuartil con la mitad central, no con el rango.'
        : 'Primero el centro: cuenta hasta el 5.º punto de cada diagrama para hallar la mediana. Luego la dispersión: halla cada rango del punto de la izquierda al de la derecha.',
      solution: hard
        ? `<p>${l1}: median <b>${m1}</b>, IQR <b>${fmt(i1)}</b>, range ${r1}. ${l2}: median <b>${m2}</b>, IQR <b>${fmt(i2)}</b>, range ${r2}. <b>${medHi}</b> has the greater median. <b>${l2}</b>'s middle half is more spread out. ${l1}'s range looks bigger only because of its outlier, so the IQR gives the fairer picture of spread.</p>`
        : `<p>${l1}: median <b>${m1}</b>, range <b>${r1}</b>. ${l2}: median <b>${m2}</b>, range <b>${r2}</b>. <b>${medHi}</b> has the greater median, so its typical dive value is higher. <b>${l2}</b>'s values are more spread out, since its range is ${r2 - r1} larger. A good comparison names both center and spread.</p>`,
      feedback: {
        correct: 'Correct. Center and spread together describe how the two crews differ.',
        wrong(ans, d) {
          if (!d.wroteEnough) return hard ? `Write at least twelve words. Name both medians, both IQRs, and what the outlier does to the range.` : 'Write at least twelve words. Name both medians and say which plot is more spread out.';
          return hard ? 'For the check, pick the statement that compares the medians and the IQRs. The range is stretched by the outlier.' : 'For the check, pick the statement that gets both the median comparison and the range comparison right.';
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

  /** Hard decimal ÷ whole: two-digit divisor, two-place quotient that may be less than 1. */
  function wholeDivHard(r) {
    const d = r.pick([12, 14, 15, 16, 24, 25]);
    let q = 0;
    while (q <= 0.1) q = round(r.int(0, 6) + r.int(1, 99) / 100, 2);
    return { d, q, dividend: round(q * d, 2) };
  }
  const whyOf = (sh, a, fallback) => (sh.options[a] && sh.options[a].why) || fallback;

  // ---------- Decimal ÷ whole number (num) ----------
  G.define('s7_divWhole', (r, o) => {
    const hard = !!o.hard;
    const c = r.pick(SHARE),
      p = hard ? wholeDivHard(r) : wholeDiv(r, false),
      name = r.pick(NAMES);
    const est = round(Math.round(p.dividend) / p.d, 1);
    return {
      type: 'num',
      skill: 'divide-decimals',
      lesson: '2-7',
      title: hard ? 'Share the supply (two-digit divisor)' : 'Share the supply',
      prompt: `<p>${name} the keeper has ${hl(D(p.dividend) + ' ' + c.thing)} to share equally among ${hl(p.d + ' ' + c.among)}.</p><p>How much does each one get? Find ${hl(D(p.dividend) + ' ÷ ' + p.d)}.</p>`,
      unit: c.unit,
      answer: p.q,
      tolerance: 0.001,
      hints: [
        'Divide as you would with whole numbers. Place the decimal point in the quotient directly above the decimal point in the dividend.',
        hard
          ? `Estimate first: ${D(p.dividend)} ÷ ${p.d} is about ${D(est)}.${p.q < 1 ? ` ${p.d} does not go into the ones digit, so write 0 in the ones place of the quotient.` : ''} You may need to annex a zero to finish.`
          : `Estimate first: ${D(p.dividend)} is close to ${Math.round(p.dividend)}, and ${Math.round(p.dividend)} ÷ ${p.d} is about ${D(est)}. Your answer should be near that.`,
        `Divide ${digitsOf(p.dividend)} by ${p.d} as if there were no decimal point, then put the point back so the answer is close to your estimate.`,
      ],
      hintEs: 'Divide como lo harías con números enteros. Coloca el punto decimal del cociente justo encima del punto decimal del dividendo.',
      solution: `<p>${D(p.dividend)} ÷ ${p.d} = <b>${D(p.q)}</b> ${c.unit}. Check by multiplying: ${D(p.q)} × ${p.d} = ${D(p.dividend)}. The decimal point in the quotient sits directly above the decimal point in the dividend, which keeps the place values lined up.</p>`,
      feedback: {
        correct: `Correct. ${D(p.q)} × ${p.d} = ${D(p.dividend)}, so the quotient checks.`,
        wrong(ans, d) {
          if (d.value != null && Math.abs(d.value - p.q * 10) < 0.001) return `${D(d.value)} is ten times too big. Estimate: ${D(p.dividend)} ÷ ${p.d} is about ${D(est)}. Place the decimal point above the one in the dividend.`;
          if (d.value != null && Math.abs(d.value - p.q / 10) < 0.001) return `${D(d.value)} is ten times too small. Compare with the estimate ${D(est)}.`;
          if (d.value != null && Math.abs(d.value - p.dividend * p.d) < 0.001) return 'You multiplied. Sharing equally means dividing the total by the number of shares.';
          if (d.value != null && Math.abs(d.value - Math.floor(p.q * 10) / 10) < 0.001 && p.q * 10 % 1 !== 0) return 'You stopped too soon. There is still a remainder: annex a zero and divide once more.';
          return `Divide ${D(p.dividend)} by ${p.d}. Check: your answer × ${p.d} should equal ${D(p.dividend)}.`;
        },
      },
    };
  });

  // ---------- Where does the decimal point go? (mc) ----------
  G.define('s7_placePoint', (r, o) => {
    const hard = !!o.hard;
    let p;
    if (hard) {
      // quotient less than 1, so the estimate "round to a whole number" breaks down; check by multiplying instead
      const d = r.pick([3, 4, 6, 7, 8, 9]);
      const q = r.int(11, 99) / 100;
      p = { d, q, dividend: round(q * d, 2) };
    } else
      for (let t = 0; t < 40; t++) {
        p = wholeDiv(r, false);
        if (!Number.isInteger(p.q) && p.q >= 1) break;
      }
    const digits = digitsOf(p.q);
    const est = round(Math.round(p.dividend) / p.d, 1);
    const cands = hard ? [p.q, round(p.q / 10, 4), round(p.q * 10, 3), round(p.q * 100, 3)] : [p.q, round(p.q * 10, 3), round(p.q / 10, 3), round(p.q * 100, 3)];
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
              why: hard
                ? `Check by multiplying: ${txt} × ${p.d} = ${D(round(v * p.d, 4))}, not ${D(p.dividend)}. The decimal point is in the wrong place.`
                : `Estimate: ${D(p.dividend)} ÷ ${p.d} is about ${Math.round(p.dividend)} ÷ ${p.d} ≈ ${D(est)}. ${txt} is far from that estimate, so the decimal point is in the wrong place.`,
            },
      );
    });
    const sh = shuffleOptions(r, opts, 0);
    return {
      type: 'mc',
      skill: 'divide-decimals',
      lesson: '2-7',
      title: hard ? 'Place the decimal point (less than 1)' : 'Place the decimal point',
      prompt: `<p>A keeper divided ${hl(D(p.dividend) + ' ÷ ' + p.d)} and got the digits ${hl(digits)}, but forgot to write the decimal point${hard ? ' and any zeros in front' : ''}.</p><p>Which is the correct quotient?</p>`,
      options: sh.options,
      answer: sh.answer,
      hints: hard
        ? [
            `The dividend ${D(p.dividend)} is less than ${p.d}${p.dividend < 1 ? ', even less than 1' : ''}, so the quotient is less than 1.`,
            `${p.d} does not go into ${Math.floor(p.dividend)}, so the ones digit of the quotient is 0. Line up the point above the point in the dividend.`,
            `Test each choice: multiply it by ${p.d}. Only one gives exactly ${D(p.dividend)}.`,
          ]
        : [
            'Estimate the quotient with whole numbers first. The real quotient must be close to the estimate.',
            `${D(p.dividend)} is about ${Math.round(p.dividend)}. ${Math.round(p.dividend)} ÷ ${p.d} is about ${D(est)}.`,
            `Place the decimal point in ${digits} so the number is close to ${D(est)}.`,
          ],
      hintEs: hard ? `El dividendo ${D(p.dividend)} es menor que ${p.d}, así que el cociente es menor que 1.` : 'Primero estima el cociente con números enteros. El cociente real debe estar cerca de tu estimación.',
      solution: hard
        ? `<p>${D(p.dividend)} is less than ${p.d}, so the quotient is less than 1: write 0 in the ones place and line up the point. The quotient is <b>${D(p.q)}</b>. Check: ${D(p.q)} × ${p.d} = ${D(p.dividend)}.</p>`
        : `<p>Estimate: ${Math.round(p.dividend)} ÷ ${p.d} ≈ ${D(est)}, so the quotient is close to ${D(est)}. Placing the point to match gives <b>${D(p.q)}</b>. Check: ${D(p.q)} × ${p.d} = ${D(p.dividend)}. In the algorithm, the decimal point in the quotient goes directly above the decimal point in the dividend.</p>`,
      feedback: { correct: `Correct. ${D(p.q)} × ${p.d} = ${D(p.dividend)}.`, wrong: (a) => whyOf(sh, a, 'Multiply your choice by the divisor to check it.') },
    };
  });

  // ---------- Whole ÷ whole with a decimal quotient: annex zeros (num) ----------
  G.define('s7_annexZero', (r, o) => {
    const hard = !!o.hard;
    const c = r.pick(SHARE);
    // hard: three decimal places, or a divisor larger than the dividend (quotient less than 1)
    const d = hard ? r.pick([8, 25, 40]) : r.pick([2, 4, 5, 8]);
    const fracs = hard
      ? { 8: [0.125, 0.375, 0.625, 0.875], 25: [0.04, 0.12, 0.16, 0.28, 0.36, 0.44, 0.52, 0.64, 0.76, 0.88], 40: [0.025, 0.075, 0.175, 0.225, 0.325, 0.425, 0.575, 0.675, 0.825, 0.925] }[d]
      : { 2: [0.5], 4: [0.25, 0.5, 0.75], 5: [0.2, 0.4, 0.6, 0.8], 8: [0.25, 0.5, 0.75] }[d];
    const q = round(r.int(hard ? 0 : 1, hard ? 4 : 9) + r.pick(fracs), 3);
    const dividend = Math.round(q * d);
    const zeros = String(q).split('.')[1].length;
    const whole = Math.floor(q),
      rem = dividend - whole * d;
    return {
      type: 'num',
      skill: 'divide-decimals',
      lesson: '2-7',
      title: hard ? 'Keep dividing (more places)' : 'Keep dividing',
      prompt: `<p>The keeper cuts ${hl(dividend + ' ' + c.thing)} into ${hl(d + ' ' + c.among)}.</p><p>How much is each share? Find ${hl(dividend + ' ÷ ' + d)}. Write the answer as a decimal.</p>`,
      unit: c.unit,
      answer: q,
      tolerance: 0.0001,
      hints: [
        `${d} does not divide ${dividend} evenly. Write ${dividend} with a decimal point and zeros after it, then keep dividing past the decimal point.`,
        whole === 0
          ? `${d} is greater than ${dividend}, so the quotient starts with 0 in the ones place. Annex a zero: ${dividend}.0 is ${dividend * 10} tenths.`
          : `${dividend} ÷ ${d}: the whole-number part is ${whole} with ${rem} left over. Bring down a zero and divide the remainder as tenths.`,
        `Keep bringing down zeros until the remainder is 0. You will need ${zeros} decimal place${zeros > 1 ? 's' : ''}.`,
      ],
      hintEs: `${d} no divide a ${dividend} exactamente. Escribe ${dividend} con punto decimal y ceros después, y sigue dividiendo después del punto.`,
      solution: `<p>${dividend} ÷ ${d}: ${whole === 0 ? `${d} is greater than ${dividend}, so write 0 in the ones place.` : `${d} goes into ${dividend} ${whole} time${whole === 1 ? '' : 's'} with ${rem} left over.`} Annex zeros (write ${dividend} as ${dividend}.${'0'.repeat(zeros)}) and keep dividing: the quotient is <b>${D(q)}</b> ${c.unit}. Check: ${D(q)} × ${d} = ${dividend}. Annexing zeros does not change the value of ${dividend}; it only lets the division continue.</p>`,
      feedback: {
        correct: `Correct. ${D(q)} × ${d} = ${dividend}.`,
        wrong(ans, d2) {
          const v = d2.value;
          if (v === whole && whole > 0) return `${whole} is only the whole-number part. There is a remainder of ${rem}. Annex a zero and keep dividing.`;
          if (v != null && whole > 0 && Math.abs(v - (whole + rem / 10)) < 0.0001) return `You wrote the remainder ${rem} as a decimal. A remainder is not tenths: annex a zero and divide it by ${d}.`;
          if (v != null && Math.abs(v - q * 10) < 0.0001) return 'Your digits are right but the decimal point is misplaced. The answer must be less than ' + (whole + 1) + '.';
          if (v != null && Math.abs(v - round(d / dividend, 3)) < 0.001) return `You divided ${d} by ${dividend}. The total, ${dividend}, is the dividend: find ${dividend} ÷ ${d}.`;
          if (v != null && v < q && Math.abs(v - q) < 0.1) return 'You stopped too soon. Keep annexing zeros until the remainder is 0.';
          return `Divide ${dividend} by ${d}. When you run out of digits, write zeros after the decimal point and keep going.`;
        },
      },
    };
  });

  // ---------- Error: misplaced decimal point (error) ----------
  G.define('s7_errorPoint', (r, o) => {
    const hard = !!o.hard;
    const name = r.pick(NAMES);
    if (hard) {
      // decimal divisor: the student moved the point in only one of the two numbers
      let p;
      for (let t = 0; t < 40; t++) {
        p = decDiv(r, false);
        if (p.q >= 2) break;
      }
      const variant = r.pick(['onlyDivisor', 'onlyDividend']);
      const nd = round(p.dividend * p.scale, 2),
        nv = round(p.d * p.scale, 2);
      const wrongQ = variant === 'onlyDivisor' ? round(p.dividend / nv, 4) : round(nd / p.d, 2);
      const rewrite = variant === 'onlyDivisor' ? `${D(p.dividend)} ÷ ${D(nv)}` : `${D(nd)} ÷ ${D(p.d)}`;
      const opts = [
        {
          html:
            variant === 'onlyDivisor'
              ? `${name} multiplied the divisor by ${p.scale} but not the dividend. Both must be multiplied by ${p.scale}.`
              : `${name} multiplied the dividend by ${p.scale} but not the divisor. Both must be multiplied by ${p.scale}.`,
          ok: true,
        },
        { html: `${name} should have multiplied ${D(p.dividend)} by ${D(p.d)}.`, why: 'The problem is a division. The mistake is in how the problem was rewritten.' },
        { html: `${name} divided ${D(nv)} by ${D(nd)} by mistake.`, why: `Look at ${name}'s rewrite: ${rewrite}. The order is right; one number was not changed.` },
        { html: 'There is no mistake. Only one number needs to change.', why: `Multiplying only one number changes the quotient. ${D(wrongQ)} × ${D(p.d)} is not ${D(p.dividend)}.` },
      ];
      const sh = shuffleOptions(r, opts, 0);
      return {
        type: 'error',
        skill: 'divide-decimals',
        lesson: '2-7',
        title: 'Find the mistake (decimal divisor)',
        prompt: `<p>${name} divided ${hl(D(p.dividend) + ' ÷ ' + D(p.d))}.</p><p>What mistake did ${name} make?</p>`,
        work: `"${D(p.dividend)} ÷ ${D(p.d)} → ${rewrite} = <b>${D(wrongQ)}</b>"`,
        options: sh.options,
        answer: sh.answer,
        fix: { label: 'What is the correct quotient?', answer: p.q, tolerance: 0.001 },
        hints: [
          'To divide by a decimal, multiply the divisor AND the dividend by the same power of 10.',
          `${D(p.d)} × ${p.scale} = ${D(nv)}. What is ${D(p.dividend)} × ${p.scale}?`,
          `Rewrite the problem with both new numbers, divide, then check by multiplying your answer by ${D(p.d)}.`,
        ],
        hintEs: 'Para dividir entre un decimal, multiplica el divisor Y el dividendo por la misma potencia de 10.',
        solution: `<p>${name} changed only one number, which changes the quotient. Multiply both by ${p.scale}: ${D(p.dividend)} ÷ ${D(p.d)} = ${D(nd)} ÷ ${D(nv)} = <b>${D(p.q)}</b>. Check: ${D(p.q)} × ${D(p.d)} = ${D(p.dividend)}.</p>`,
        feedback: {
          correct: 'Correct. Multiplying both numbers by the same power of 10 keeps the quotient the same.',
          wrong(ans, d) {
            if (!d.mistakeOk) return whyOf(sh, ans && ans.mistake, `Compare ${name}'s rewrite with the original problem. Which number did not change?`);
            const v = RX.parseNum(ans && ans.fix);
            if (v != null && Math.abs(v - wrongQ) < 0.001) return `That is ${name}'s answer. Rewrite with both numbers multiplied by ${p.scale}.`;
            return `You found the mistake. Now find ${D(nd)} ÷ ${D(nv)}.`;
          },
        },
      };
    }
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
      hintEs: 'Estima con números enteros. ¿Tiene sentido la respuesta?',
      solution: `<p>${name}'s digits are correct, but the decimal point is misplaced. Estimate: ${Math.round(p.dividend)} ÷ ${p.d} ≈ ${D(est)}. The correct quotient is <b>${D(p.q)}</b>, and ${D(p.q)} × ${p.d} = ${D(p.dividend)} confirms it. Always place the point in the quotient directly above the point in the dividend.</p>`,
      feedback: {
        correct: 'Correct. An estimate catches a misplaced decimal point every time.',
        wrong(ans, d) {
          if (!d.mistakeOk) return whyOf(sh, ans && ans.mistake, `Estimate ${Math.round(p.dividend)} ÷ ${p.d}. Is ${D(wrongQ)} anywhere close?`);
          const v = RX.parseNum(ans && ans.fix);
          if (v != null && Math.abs(v - wrongQ) < 0.001) return `That is ${name}'s answer. Move the decimal point so the quotient is near ${D(est)}.`;
          return `You found the mistake. Now place the point in ${digitsOf(p.q)} so the quotient is near ${D(est)}.`;
        },
      },
    };
  });

  // ---------- Rewrite a decimal divisor as a whole number (blanks) ----------
  G.define('s7_rewriteBlanks', (r, o) => {
    const hard = !!o.hard;
    // hard: a two-place divisor (multiply by 100), often needing a zero annexed to the dividend
    const p = decDiv(r, hard);
    const nd = round(p.dividend * p.scale, 2),
      nv = round(p.d * p.scale, 2);
    return {
      type: 'blanks',
      skill: 'divide-decimals',
      lesson: '2-7',
      title: hard ? 'Make the divisor a whole number (hundredths)' : 'Make the divisor a whole number',
      prompt: `<p>To divide by a decimal, first change the divisor into a whole number. Complete the steps for ${hl(D(p.dividend) + ' ÷ ' + D(p.d))}.</p>`,
      fields: [
        { label: 'new dividend', answer: nd, width: 'sm', tolerance: 0.001 },
        { label: 'new divisor', answer: nv, width: 'sm', tolerance: 0.001 },
        { label: 'quotient', answer: p.q, width: 'sm', tolerance: 0.001 },
      ],
      template: hard ? [`Multiply both numbers by the same power of 10: ${D(p.dividend)} ÷ ${D(p.d)} becomes {0} ÷ {1}.`, 'Now divide: the quotient is {2}.'] : [`Multiply both numbers by ${p.scale}: ${D(p.dividend)} ÷ ${D(p.d)} becomes {0} ÷ {1}.`, 'Now divide: the quotient is {2}.'],
      hints: [
        hard
          ? `Count the decimal places in the divisor ${D(p.d)}. Multiply both numbers by the power of 10 that makes the divisor a whole number.`
          : `The divisor ${D(p.d)} has ${p.scale === 100 ? 'two decimal places, so multiply by 100' : 'one decimal place, so multiply by 10'}. Multiply the dividend by the same number so the quotient stays the same.`,
        hard ? `${D(p.d)} has ${p.scale === 100 ? 'two decimal places, so use 100' : 'one decimal place, so use 10'}. Annex zeros to the dividend if it runs out of places.` : `${D(p.d)} × ${p.scale} = ${D(nv)}. ${D(p.dividend)} × ${p.scale} = ${D(nd)}.`,
        hard ? `${D(p.d)} × ${p.scale} = ${D(nv)} and ${D(p.dividend)} × ${p.scale} = ${D(nd)}. Now divide.` : `Now divide ${D(nd)} ÷ ${D(nv)}. Check your answer by multiplying it by ${D(p.d)}.`,
      ],
      hintEs: hard
        ? `Cuenta los lugares decimales del divisor ${D(p.d)}. Multiplica los dos números por la potencia de 10 que convierte el divisor en un número entero.`
        : `El divisor ${D(p.d)} tiene ${p.scale === 100 ? 'dos lugares decimales, así que multiplica por 100' : 'un lugar decimal, así que multiplica por 10'}. Multiplica el dividendo por el mismo número para que el cociente no cambie.`,
      solution: `<p>Multiply both numbers by ${p.scale}: ${D(p.dividend)} ÷ ${D(p.d)} = <b>${D(nd)}</b> ÷ <b>${D(nv)}</b>. Then divide: <b>${D(p.q)}</b>. Multiplying both numbers by the same amount does not change the quotient, just as ${D(p.dividend)} ÷ ${D(p.d)} and ${D(nd)} ÷ ${D(nv)} describe the same sharing.</p>`,
      feedback: {
        correct: `Correct. ${D(nd)} ÷ ${D(nv)} = ${D(p.q)}, and ${D(p.q)} × ${D(p.d)} = ${D(p.dividend)}.`,
        wrong(ans, d) {
          const got = (ans || []).map(RX.parseNum);
          if (d.wrong.includes(1)) {
            if (p.scale === 100 && got[1] != null && Math.abs(got[1] - p.d * 10) < 0.001) return `${D(p.d)} × 10 is still a decimal. The divisor has two decimal places, so multiply by 100.`;
            return `Multiply the divisor ${D(p.d)} by ${p.scale} to make it a whole number.`;
          }
          if (d.wrong.includes(0)) {
            if (got[0] != null && Math.abs(got[0] - p.dividend) < 0.001) return `You left the dividend alone. Multiply it by the same ${p.scale} as the divisor.`;
            return `You must multiply the dividend by the same ${p.scale}: ${D(p.dividend)} × ${p.scale}.`;
          }
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
        hard ? `First make the divisor a whole number. ${D(p.d)} has ${p.scale === 100 ? 'two decimal places' : 'one decimal place'}, so multiply both numbers by the matching power of 10.` : `First make the divisor a whole number: multiply both ${D(p.dividend)} and ${D(p.d)} by ${p.scale}.`,
        `That gives ${D(nd)} ÷ ${D(nv)}, the same quotient as the original problem.`,
        `Divide ${D(nd)} by ${D(nv)}. Check: the answer × ${D(p.d)} should equal ${D(p.dividend)}.`,
      ],
      hintEs: hard
        ? `Primero convierte el divisor en un número entero. ${D(p.d)} tiene ${p.scale === 100 ? 'dos lugares decimales' : 'un lugar decimal'}, así que multiplica los dos números por la potencia de 10 que corresponde.`
        : `Primero convierte el divisor en un número entero: multiplica ${D(p.dividend)} y ${D(p.d)} por ${p.scale}.`,
      solution: `<p>Multiply both numbers by ${p.scale}: ${D(p.dividend)} ÷ ${D(p.d)} = ${D(nd)} ÷ ${D(nv)} = <b>${D(p.q)}</b> ${ctx.unit}. Check: ${D(p.q)} × ${D(p.d)} = ${D(p.dividend)}. ${p.d < 1 ? 'The quotient is larger than the dividend because the divisor is less than 1: more than one group of ' + D(p.d) + ' fits in each whole.' : 'The quotient is smaller than the dividend because the divisor is greater than 1.'}</p>`,
      feedback: {
        correct: `Correct. ${D(p.q)} × ${D(p.d)} = ${D(p.dividend)}.`,
        wrong(ans, d) {
          if (d.value != null && (Math.abs(d.value - p.q / p.scale) < 0.001 || Math.abs(d.value - p.q * p.scale) < 0.001)) return `You moved the decimal point in only one of the numbers. Multiply both ${D(p.dividend)} and ${D(p.d)} by ${p.scale}.`;
          if (p.scale === 100 && d.value != null && Math.abs(d.value - p.q / 10) < 0.001) return `${D(p.d)} has two decimal places. Multiply both numbers by 100, not 10.`;
          if (d.value != null && Math.abs(d.value - p.dividend * p.d) < 0.001) return 'You multiplied. The question asks how many groups fit, which is division.';
          return `Rewrite as ${D(nd)} ÷ ${D(nv)}, then divide. Check by multiplying your answer by ${D(p.d)}.`;
        },
      },
    };
  });

  // ---------- Estimate and reason about size (tf) ----------
  G.define('s7_estimateTF', (r, o) => {
    const hard = !!o.hard;
    const variant = hard ? r.pick(['compareDivisors', 'justOver1', 'twenty']) : r.pick(['lessThanOne', 'wholeDivisor', 'half']);
    let p, claim, q, reason, answer, kind;
    if (variant === 'lessThanOne') {
      p = decDiv(r, false);
      while (p.d >= 1) p = decDiv(r, false);
      q = p.q;
      claim = `${D(p.dividend)} ÷ ${D(p.d)} is greater than ${D(p.dividend)}.`;
      reason = `Dividing by a number less than 1 gives a quotient larger than the dividend. ${D(p.dividend)} ÷ ${D(p.d)} = ${D(q)}, which is more than ${D(p.dividend)}.`;
      answer = true;
      kind = 'small';
    } else if (variant === 'wholeDivisor') {
      p = wholeDiv(r, false);
      q = p.q;
      claim = `${D(p.dividend)} ÷ ${p.d} is greater than ${D(p.dividend)}.`;
      reason = `Dividing by a whole number greater than 1 makes the result smaller. ${D(p.dividend)} ÷ ${p.d} = ${D(q)}, which is less than ${D(p.dividend)}.`;
      answer = false;
      kind = 'big';
    } else if (variant === 'half') {
      const a = round(r.int(2, 12) + r.pick([0, 0.2, 0.4, 0.5, 0.6, 0.8]), 1);
      p = { dividend: a, d: 0.5 };
      q = round(a / 0.5, 2);
      claim = `${D(a)} ÷ 0.5 is the same as ${D(a)} × 2.`;
      reason = `Dividing by 0.5 asks how many halves fit in ${D(a)}. There are 2 halves in each whole, so the answer is ${D(a)} × 2 = ${D(q)}.`;
      answer = true;
      kind = 'small';
    } else if (variant === 'compareDivisors') {
      // the same dividend split by two decimals: the smaller divisor gives the larger quotient
      const a = r.pick([2.4, 3.6, 4.8, 7.2, 9.6]);
      const [d1, d2] = r.pick([
        [0.4, 0.8],
        [0.3, 0.6],
        [0.2, 0.6],
        [0.4, 1.2],
      ]);
      const flip = r.chance(0.5);
      p = { dividend: a, d: d1 };
      q = round(a / d1, 2);
      claim = flip ? `${D(a)} ÷ ${D(d2)} is greater than ${D(a)} ÷ ${D(d1)}.` : `${D(a)} ÷ ${D(d1)} is greater than ${D(a)} ÷ ${D(d2)}.`;
      answer = !flip;
      reason = `A smaller divisor fits more times into the same dividend. ${D(a)} ÷ ${D(d1)} = ${D(q)} and ${D(a)} ÷ ${D(d2)} = ${D(round(a / d2, 2))}, so dividing by ${D(d1)} gives the greater quotient.`;
      kind = 'compare';
    } else if (variant === 'justOver1') {
      const d = r.pick([1.2, 1.25, 1.5]);
      const qq = r.pick([4, 6, 8, 10, 12]);
      const a = round(qq * d, 2);
      p = { dividend: a, d };
      q = qq;
      claim = `${D(a)} ÷ ${D(d)} is greater than ${D(a)}, because dividing by a decimal always makes the answer bigger.`;
      answer = false;
      reason = `${D(d)} is greater than 1, so the quotient is smaller than the dividend: ${D(a)} ÷ ${D(d)} = ${D(q)}. Only divisors between 0 and 1 make the quotient bigger.`;
      kind = 'big';
    } else {
      const a = round(r.int(2, 9) + r.pick([0, 0.1, 0.3, 0.5, 0.7]), 1);
      p = { dividend: a, d: 0.05 };
      q = round(a / 0.05, 2);
      const wrongFactor = r.chance(0.5);
      claim = wrongFactor ? `${D(a)} ÷ 0.05 is the same as ${D(a)} × 5.` : `${D(a)} ÷ 0.05 is the same as ${D(a)} × 20.`;
      answer = !wrongFactor;
      reason = `There are 20 groups of 0.05 in each whole (20 × 0.05 = 1). So ${D(a)} ÷ 0.05 = ${D(a)} × 20 = ${D(q)}.`;
      kind = 'small';
    }
    const reasons = r.shuffle([
      { html: reason, correct: true },
      { html: answer ? 'Division always makes a number smaller.' : 'Division always makes a number larger.' },
      { html: variant === 'half' ? 'Dividing by 0.5 is the same as dividing by 2.' : variant === 'twenty' ? 'Dividing by 0.05 is the same as multiplying by 5, because 0.05 has a 5 in it.' : 'The decimal point does not matter when you divide.' },
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
        kind === 'big'
          ? `${D(p.d)} is greater than 1, so each share is smaller than the whole.`
          : kind === 'compare'
            ? 'The dividend is the same in both. Which divisor fits into it more times: the smaller one or the larger one?'
            : `${D(p.d)} is less than 1, so more than one group of ${D(p.d)} fits inside each whole.`,
        variant === 'twenty' ? 'How many groups of 0.05 make 1? Use that number.' : 'Compute the quotient (or quotients) to check your reasoning.',
      ],
      hintEs: 'Pregúntate: ¿el divisor es menor que 1, igual a 1 o mayor que 1? Eso te dice si el cociente es mayor o menor que el dividendo.',
      solution: `<p><b>${answer ? 'True' : 'False'}.</b> ${reason}</p>`,
      feedback: {
        correct: 'Correct. The size of the divisor tells you whether the quotient grows or shrinks.',
        wrong(ans, d) {
          if (!d.valueOk) {
            if (kind === 'big') return `${D(p.d)} is greater than 1. Sharing ${D(p.dividend)} into groups bigger than 1 gives fewer than ${D(p.dividend)} groups. Compute: ${D(q)}.`;
            if (kind === 'compare') return 'Smaller pieces fit more times. The smaller divisor gives the greater quotient.';
            if (variant === 'twenty') return 'Count the groups of 0.05 in 1 whole: 20, not 5.';
            return `How many groups of ${D(p.d)} fit in 1? More than one. So the quotient is bigger than the dividend.`;
          }
          return 'Your true/false choice is right. Pick the reason that explains what dividing by this divisor does.';
        },
      },
    };
  });

  // ---------- Place-value pattern (table) ----------
  G.define('s7_tablePattern', (r, o) => {
    const hard = !!o.hard;
    const d = r.pick([3, 4, 6, 7, 8, 9]),
      q = r.int(3, 9),
      big = q * d;
    // hard: the dividend and divisor shift by DIFFERENT powers of 10
    const spec = hard
      ? [
          { e: `${D(big / 100)} ÷ ${D(d / 10)}`, a: round(q / 10, 3), why: 'dividend ÷ 100, divisor ÷ 10' },
          { e: `${D(big / 10)} ÷ ${D(d / 100)}`, a: q * 10, why: 'dividend ÷ 10, divisor ÷ 100' },
          { e: `${D(big / 100)} ÷ ${D(d / 100)}`, a: q, why: 'both ÷ 100' },
        ]
      : [
          { e: `${D(big / 10)} ÷ ${d}`, a: round(q / 10, 3) },
          { e: `${D(big / 100)} ÷ ${d}`, a: round(q / 100, 3) },
          { e: `${D(big / 10)} ÷ ${D(d / 10)}`, a: q },
        ];
    const rows = [['Expression', 'Quotient'], [`${big} ÷ ${d}`, String(q)]].concat(spec.map((s, i) => [s.e, `__IN:${'abc'[i]}__`]));
    return {
      type: 'table',
      skill: 'divide-decimals',
      lesson: '2-7',
      title: hard ? 'Follow the pattern (mixed shifts)' : 'Follow the pattern',
      prompt: `<p>The first row, ${hl(big + ' ÷ ' + d + ' = ' + q)}, is done. Use the pattern to complete the table${hard ? ' without dividing from scratch' : ''}.</p>`,
      rows,
      header: true,
      inputs: spec.map((s, i) => ({ id: 'abc'[i], answer: s.a, tolerance: 0.0001 })),
      hints: hard
        ? [
            `Compare each row with ${big} ÷ ${d}. How did the dividend change? How did the divisor change?`,
            'Shrinking the dividend shrinks the quotient by the same factor. Shrinking the divisor makes the quotient grow by that factor.',
            'Combine the two changes for each row. If both shrink by the same factor, the quotient does not change.',
          ]
        : [
            `${big} ÷ ${d} = ${q}. When the dividend is divided by 10 and the divisor stays the same, the quotient is also divided by 10.`,
            `${D(big / 10)} is ${big} ÷ 10, so its quotient is ${q} ÷ 10. ${D(big / 100)} is ${big} ÷ 100, so its quotient is ${q} ÷ 100.`,
            `In the last row, both numbers were divided by 10. Multiplying or dividing both numbers by the same amount keeps the quotient the same as ${big} ÷ ${d}.`,
          ],
      hintEs: hard
        ? `Compara cada fila con ${big} ÷ ${d}. ¿Cómo cambió el dividendo? ¿Cómo cambió el divisor?`
        : `${big} ÷ ${d} = ${q}. Si el dividendo se divide entre 10 y el divisor no cambia, el cociente también se divide entre 10.`,
      solution: hard
        ? `<p>${spec.map((s) => `${s.e}: ${s.why}, so the quotient is <b>${D(s.a)}</b>`).join('. ')}. A smaller dividend makes the quotient smaller; a smaller divisor makes it larger; equal changes cancel out.</p>`
        : `<p>${D(big / 10)} ÷ ${d} = <b>${D(q / 10)}</b> and ${D(big / 100)} ÷ ${d} = <b>${D(q / 100)}</b>: a smaller dividend with the same divisor gives a smaller quotient, by the same factor of 10. ${D(big / 10)} ÷ ${D(d / 10)} = <b>${q}</b>: when both numbers shrink by the same factor, the quotient does not change. That is why we can rewrite a decimal divisor as a whole number.</p>`,
      feedback: {
        correct: 'Correct. Shrink only the dividend and the quotient shrinks; shrink both and the quotient stays the same.',
        wrong(ans, d2) {
          const v = (k) => RX.parseNum((ans || {})[k]);
          if (hard) {
            if (d2.wrong.includes('b') && v('b') != null && Math.abs(v('b') - q / 10) < 0.001) return `In the third row the divisor shrank more than the dividend. A smaller divisor makes the quotient larger: ${q} × 10.`;
            if (d2.wrong.includes('c')) return 'In the last row both numbers shrank by 100. Equal changes cancel, so the quotient matches the first row.';
            return 'For each row, apply both changes: the dividend change moves the quotient the same way; the divisor change moves it the opposite way.';
          }
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

  const whyOf = (sh, a, fallback) => (sh.options[a] && sh.options[a].why) || fallback;
  const dp2 = (x) => Math.abs(x * 100 - Math.round(x * 100)) < 1e-9;
  /** Data with a mean that is NOT a whole number but has at most 2 decimal places. */
  function decimalMeanData(r, n, lo, hi) {
    for (let t = 0; t < 200; t++) {
      const v = S.data(r, n, lo, hi);
      const m = S.mean(v);
      if (!Number.isInteger(m) && dp2(m) && new Set(v).size > 2) return v;
    }
    return S.data(r, n, lo, hi);
  }

  // ---------- Find the mean (num) ----------
  G.define('s8_mean', (r, o) => {
    const hard = !!o.hard;
    const c = r.pick(CTX);
    // hard: more values and a mean that is a decimal
    const n = hard ? r.pick([5, 8]) : r.pick([4, 5, 6]);
    const vals = hard ? decimalMeanData(r, n, c.m[0] - 4, c.m[1] + 6) : S.withMean(r, n, r.int(c.m[0], c.m[1]), Math.max(3, Math.floor(c.m[0] / 2)));
    const total = S.sum(vals),
      m = RX.round(total / n, 2);
    return {
      type: 'num',
      skill: 'mean',
      lesson: '2-8',
      title: hard ? 'Find the mean (decimal answer)' : 'Find the mean',
      prompt: `<p>A surveyor recorded ${c.what} on ${n} visits: ${hl(S.list(vals))}.</p><p>What is the <b>mean</b>?${hard ? ' Give your answer as a decimal.' : ''}</p>`,
      unit: c.unit,
      answer: m,
      tolerance: 0.01,
      hints: [
        'The mean is the fair share: add all the values, then divide by how many values there are.',
        `Add the ${n} values. ${hard ? 'Check your sum by adding a second time in a different order.' : `Sum: ${sumText(vals)}.`}`,
        hard ? `Divide the sum by ${n}. The division will not come out even, so annex zeros and keep dividing.` : `Mean = ${total} ÷ ${n}.`,
      ],
      hintEs: 'La media es la parte justa: suma todos los valores y luego divide entre cuántos valores hay.',
      solution: `<p>Add: ${sumText(vals)}. Divide by the number of values: ${total} ÷ ${n} = <b>${fmt(m)}</b> ${c.unit}. If the ${total} ${c.unit} were shared equally among the ${n} visits, each ${c.each} would get ${fmt(m)}.${hard ? ' A mean does not have to be one of the data values, or even a whole number.' : ''}</p>`,
      feedback: {
        correct: `Correct. ${total} shared equally among ${n} is ${fmt(m)} each.`,
        wrong(ans, d) {
          const v = d.value;
          if (v === total) return `${total} is the sum. Divide it by ${n}, the number of values, to find the mean.`;
          if (v === S.median(vals) && S.median(vals) !== m) return 'That is the median (the middle value). The mean is the sum divided by the count.';
          if (v != null && (Math.abs(v - total / (n - 1)) < 0.01 || Math.abs(v - total / (n + 1)) < 0.01)) return `Count the values again. There are ${n} of them, so divide by ${n}.`;
          if (hard && v === Math.floor(m)) return 'That is only the whole-number part. Keep dividing past the decimal point.';
          if (v != null && Math.abs(v * n - total) > 0.5 && Math.abs(v - m) < 3) return 'Your division looks close. Recheck the sum first, then divide again.';
          return `Add the ${n} values and divide by ${n}.`;
        },
      },
    };
  });

  // ---------- Mean step by step (blanks) ----------
  G.define('s8_meanBlanks', (r, o) => {
    const hard = !!o.hard;
    const c = r.pick(CTX),
      n = hard ? r.pick([4, 5]) : r.pick([4, 5, 6]),
      m = r.int(c.m[0], c.m[1]);
    // hard: measurements in tenths, so the sum and mean are decimals
    let vals;
    if (hard) {
      for (let t = 0; t < 200; t++) {
        vals = S.data(r, n, c.m[0] * 10, c.m[1] * 10).map((v) => v / 10);
        if (dp2(S.sum(vals) / n) && vals.filter((v) => v % 1 !== 0).length >= n - 1) break;
      }
    } else vals = S.withMean(r, n, m, Math.max(3, Math.floor(m / 2)));
    const total = RX.round(S.sum(vals), 2),
      mean = RX.round(total / n, 2);
    return {
      type: 'blanks',
      skill: 'mean',
      lesson: '2-8',
      title: hard ? 'Show the steps (decimals)' : 'Show the steps',
      prompt: `<p>Data (${c.what}): ${hl(S.list(vals))}.</p><p>Complete the steps to find the mean.</p>`,
      fields: [
        { label: 'sum', answer: total, width: 'sm', tolerance: 0.001 },
        { label: 'number of values', answer: n, width: 'xs' },
        { label: 'mean', answer: mean, width: 'sm', tolerance: 0.01 },
      ],
      template: ['The sum of the values is {0}.', 'There are {1} values.', 'Mean = sum ÷ count = {2}.'],
      hints: [
        'Add every value to find the sum. Count how many values there are.',
        hard ? 'Line up the decimal points to add the tenths. Then count the values.' : `Sum: ${sumText(vals)}. Count: ${n}.`,
        hard ? `Divide the sum by ${n}. Place the decimal point in the quotient above the one in the dividend.` : `Divide the sum by the count.`,
      ],
      hintEs: 'Suma todos los valores para hallar la suma. Cuenta cuántos valores hay.',
      solution: `<p>Sum: ${vals.map((v) => fmt(v)).join(' + ')} = <b>${fmt(total)}</b>. Count: <b>${n}</b>. Mean = ${fmt(total)} ÷ ${n} = <b>${fmt(mean)}</b> ${c.unit}. The mean balances the data: the values above it are above by exactly as much as the values below it are below.</p>`,
      feedback: {
        correct: `Correct. ${fmt(total)} ÷ ${n} = ${fmt(mean)}.`,
        wrong(ans, d) {
          const got = (ans || []).map(RX.parseNum);
          if (d.wrong.includes(0)) return hard ? 'Add again, lining up the decimal points so tenths add to tenths.' : `Add again carefully: ${vals.join(' + ')}.`;
          if (d.wrong.includes(1)) return `Count the values in the list: ${S.list(vals)}.`;
          if (got[2] != null && Math.abs(got[2] - got[0]) < 0.001) return 'That is the sum again. Divide the sum by the count.';
          return `Divide the sum by the count ${n}.`;
        },
      },
    };
  });

  // ---------- Mean from a dot plot (num) ----------
  G.define('s8_meanDot', (r, o) => {
    const hard = !!o.hard;
    const c = r.pick([
      { label: 'Sea stars per pool', unit: 'sea stars', lo: 2, hi: 12 },
      { label: 'Fish tagged per day', unit: 'fish', lo: 3, hi: 13 },
      { label: 'Samples per dive', unit: 'samples', lo: 1, hi: 11 },
    ]);
    // hard: 10 dots and a mean in tenths
    const n = hard ? 10 : r.pick([6, 7, 8]);
    let vals;
    if (hard) {
      for (let t = 0; t < 100; t++) {
        vals = S.shaped(r, r.pick(['symmetric', 'skewed right', 'skewed left']), c.lo, c.hi, n);
        if (!Number.isInteger(S.mean(vals))) break;
      }
    } else vals = S.withMean(r, n, r.int(c.lo + 3, c.hi - 3), 3);
    const total = S.sum(vals),
      m = RX.round(total / n, 2);
    const cnt = S.counts(vals),
      keys = Object.keys(cnt).map(Number);
    const mode = keys.reduce((best, k) => (cnt[k] > cnt[best] ? k : best), keys[0]);
    return {
      type: 'num',
      skill: 'mean',
      lesson: '2-8',
      title: hard ? 'Mean from a dot plot (decimal)' : 'Mean from a dot plot',
      prompt: `<p>The dot plot shows ${c.label.toLowerCase()} for ${n} surveys. Each dot is one survey.</p>${V.dotPlot({ values: vals, min: c.lo, max: c.hi, label: c.label, aria: 'Dot plot: ' + S.list(S.sorted(vals)) })}<p>What is the <b>mean</b>?${hard ? ' Your answer may be a decimal.' : ''}</p>`,
      unit: c.unit,
      answer: m,
      tolerance: 0.01,
      hints: [
        'Read each dot as a data value. Then add all the values and divide by the number of dots.',
        hard ? 'For a stack, multiply the value by the number of dots in it (3 dots at 5 is 5 × 3), then add the stack totals.' : `The values are ${S.list(S.sorted(vals))}. Add them.`,
        hard ? `Divide the total by ${n}, the number of dots.` : `There are ${n} dots. Divide the sum by ${n}.`,
      ],
      hintEs: 'Lee cada punto como un dato. Luego suma todos los valores y divide entre el número de puntos.',
      solution: `<p>${hard ? `Stack totals: ${keys.sort((x, y) => x - y).map((k) => `${k} × ${cnt[k]}`).join(' + ')} = ${total}` : `Values from the dot plot: ${S.list(S.sorted(vals))}. Sum = ${total}`}. Mean = ${total} ÷ ${n} = <b>${fmt(m)}</b> ${c.unit}. On the dot plot, ${fmt(m)} is the balance point: the dots to the right of it balance the dots to the left.</p>`,
      feedback: {
        correct: `Correct. The dots balance at ${fmt(m)}.`,
        wrong(ans, d) {
          const v = d.value;
          if (v === mode && mode !== m) return 'That is the value with the most dots (the peak). The mean adds every value and divides by the count.';
          if (v === S.median(vals) && S.median(vals) !== m) return 'That is the median, the middle dot. The mean is the sum of all values divided by the number of dots.';
          if (v === total) return `${total} is the sum of the values. Divide by the ${n} dots.`;
          const distinctSum = keys.reduce((s, k) => s + Number(k), 0);
          if (v != null && Math.abs(v - distinctSum / n) < 0.01) return 'You added each value only once. A stack of 3 dots means that value counts 3 times.';
          if (v != null && Math.abs(v - total / keys.length) < 0.01) return `You divided by the number of stacks. Divide by the number of dots, ${n}.`;
          return `Add the values of all ${n} dots, then divide by ${n}.`;
        },
      },
    };
  });

  // ---------- Error: divided by the wrong count (error) ----------
  G.define('s8_errorCount', (r, o) => {
    const hard = !!o.hard;
    const name = r.pick(NAMES),
      c = r.pick(CTX),
      n = hard ? r.pick([5, 6]) : r.pick([4, 5, 6]),
      m = r.int(c.m[0], c.m[1]);
    let vals = S.withMean(r, n, m, Math.max(3, Math.floor(m / 2)));
    if (hard) {
      // one visit recorded 0; the student skipped it when counting. The other n − 1 values add to m × n exactly.
      const base = Math.floor((m * n) / (n - 1)),
        extraOnes = m * n - (n - 1) * base;
      let rest = S.withMean(r, n - 1, base, Math.max(2, Math.floor(base / 3))).map((v, i) => v + (i < extraOnes ? 1 : 0));
      if (rest.some((v) => v <= 0)) rest = rest.map((v) => Math.max(1, v));
      vals = r.shuffle(rest.concat([0]));
    }
    const total = S.sum(vals),
      mean = RX.round(total / n, 2);
    const variant = hard ? 'zero' : r.pick(['count', 'noDivide']);
    const nonZero = vals.filter((v) => v !== 0);
    const wrongVal = variant === 'noDivide' ? total : RX.round(total / (n - 1), 2);
    const work = variant === 'noDivide' ? `"${sumText(vals)}. The mean is <b>${total}</b>."` : variant === 'zero' ? `"${sumText(nonZero)}. ${total} ÷ ${n - 1} = <b>${fmt(wrongVal)}</b>. The 0 doesn't count, so the mean is ${fmt(wrongVal)}."` : `"${sumText(vals)}. ${total} ÷ ${n - 1} = <b>${fmt(wrongVal)}</b>. The mean is ${fmt(wrongVal)}."`;
    const opts = {
      count: [
        { html: `${name} divided by ${n - 1}, but there are ${n} values. The sum must be divided by the number of values.`, ok: true },
        { html: `${name} added the values wrong.`, why: `The sum ${total} is correct. The mistake is in the division step.` },
        { html: `${name} should have divided by 2.`, why: 'Dividing by 2 finds the halfway point between two numbers. The mean divides by the total number of values.' },
        { html: 'There is no mistake.', why: `Count the values: there are ${n}, not ${n - 1}. The divisor is wrong.` },
      ],
      noDivide: [
        { html: `${name} found the sum but forgot to divide by ${n}, the number of values.`, ok: true },
        { html: `${name} should have found the middle value instead.`, why: 'The middle value is the median. The question asks for the mean, which is the sum divided by the count.' },
        { html: `${name} added the values wrong.`, why: `The sum ${total} is correct. The problem is that the sum alone is not the mean.` },
        { html: 'There is no mistake.', why: `${total} is the total, bigger than every value. A mean must sit between the smallest and largest values.` },
      ],
      zero: [
        { html: `${name} left the 0 out of the count. A visit with 0 is still a data value, so divide by ${n}.`, ok: true },
        { html: `${name} should have left the 0 out of the sum too.`, why: 'Adding 0 does not change the sum. The mistake is the count: the 0 is still one of the values.' },
        { html: `${name} added the values wrong.`, why: `The sum ${total} is correct. Look at the number ${name} divided by.` },
        { html: 'There is no mistake. Zeros are never part of a mean.', why: `A 0 is a real measurement. Leaving it out raises the mean above the fair share.` },
      ],
    }[variant];
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
      fix: { label: 'What is the correct mean?', answer: mean, tolerance: 0.01 },
      hints: [
        'The mean is the sum of the values divided by how many values there are. Check both steps.',
        variant === 'zero' ? `Count every value in the list, including the 0. How many are there?` : `Is the sum right? How many values are in the list? Count them.`,
        `Divide the sum by the number of values in the list.`,
      ],
      hintEs: 'La media es la suma de los valores dividida entre cuántos valores hay. Revisa los dos pasos.',
      solution: `<p>${variant === 'count' ? `${name} divided by ${n - 1}, but the list has ${n} values.` : variant === 'zero' ? `${name} skipped the 0 when counting. It is one of the ${n} values.` : `${name} stopped after adding. A sum is not a mean.`} Mean = ${total} ÷ ${n} = <b>${fmt(mean)}</b>. A mean always lands between the smallest and largest values, which is a quick way to check.</p>`,
      feedback: {
        correct: 'Correct. Sum, then divide by the number of values.',
        wrong(ans, d) {
          if (!d.mistakeOk) return whyOf(sh, ans && ans.mistake, `Check each step: is the sum right? Is the divisor the number of values (${n})?`);
          const v = RX.parseNum(ans && ans.fix);
          if (v != null && Math.abs(v - wrongVal) < 0.01) return `That is ${name}'s answer. Divide ${total} by ${n} instead.`;
          return `You found the mistake. Now divide ${total} by ${n}.`;
        },
      },
    };
  });

  // ---------- What the mean tells you (mc) ----------
  G.define('s8_meanMeaning', (r, o) => {
    const hard = !!o.hard;
    const c = r.pick(CTX),
      name = r.pick(NAMES);
    // hard: a decimal mean that no single count could equal
    const n = hard ? r.pick([4, 5, 8]) : r.pick([5, 6, 8]);
    let m = r.int(c.m[0], c.m[1]);
    if (hard) m += r.pick({ 4: [0.25, 0.5, 0.75], 5: [0.2, 0.4, 0.6, 0.8], 8: [0.25, 0.5, 0.75] }[n]);
    const total = RX.round(m * n, 2);
    const each = c.each + 's',
      u = c.unit,
      M = fmt(m);
    const opts = hard
      ? [
          { html: `If the ${total} ${u} were shared equally among the ${n} ${each}, each would get ${M}, even though no ${c.each} could really have ${M}.`, ok: true },
          { html: `At least one of the ${n} ${each} must have had exactly ${M} ${u}, or the mean could not be ${M}.`, why: `A mean can be a value that no ${c.each} had. Here a count of ${M} is not even possible.` },
          { html: `${name} made a mistake, because you cannot count ${M} ${u}, so a mean of ${M} is impossible.`, why: 'The mean is a fair share of the total, so it can be a decimal even when every count is a whole number.' },
          { html: `Half of the ${n} ${each} had ${M} ${u} or fewer, and the other half had ${M} or more of them.`, why: 'That describes the median. The mean is the fair share of the total.' },
        ]
      : [
          { html: `If the ${total} ${u} were shared equally among the ${n} ${each}, each would get ${M}.`, ok: true },
          { html: `Most of the ${n} ${each} had exactly ${M} ${u}, so ${M} is the value that shows up most.`, why: 'The mean does not say how often a value appears. Some values may be above the mean and some below it, with none exactly at it.' },
          { html: `Half of the ${n} ${each} had ${M} ${u} or less, and the other half had ${M} or more.`, why: 'That describes the median, the middle value. The mean is the fair share, which can sit above or below the middle.' },
          { html: `When you add up all ${n} ${each}, the total comes out to exactly ${M} ${u} in all.`, why: `The total is mean × count = ${M} × ${n} = ${total}. The mean is each ${c.each}'s fair share of that total.` },
        ];
    const sh = shuffleOptions(r, opts, 0);
    return {
      type: 'mc',
      skill: 'mean',
      lesson: '2-8',
      title: 'What does the mean tell you?',
      prompt: `<p>${name} found that the mean of ${c.what} over ${n} ${each} is ${hl(M + ' ' + u)}.</p><p>What does this mean tell you?</p>`,
      options: sh.options,
      answer: sh.answer,
      hints: [
        'The mean is found by adding all the values and dividing by the count. Think of it as sharing the total equally.',
        `The total must have been ${M} × ${n} = ${fmt(total)} ${u}.`,
        `Imagine sharing that total equally among the ${n} ${each}. Which statement describes that?`,
      ],
      hintEs: 'La media se halla sumando todos los valores y dividiendo entre cuántos hay. Piensa en repartir el total en partes iguales.',
      solution: `<p>The mean is the fair-share amount. The ${n} ${each} together had ${M} × ${n} = ${fmt(total)} ${u}. <b>If that total were shared equally, each ${c.each} would get ${M}.</b>${hard ? ` A fair share can be a decimal even when every real count is a whole number.` : ''} The mean does not tell you the most common value or the middle value.</p>`,
      feedback: { correct: 'Correct. The mean is the amount each would get if the total were shared equally.', wrong: (a) => whyOf(sh, a, 'Think of the mean as sharing the total equally.') },
    };
  });

  // ---------- Score needed for a target mean (num) ----------
  G.define('s8_targetMean', (r, o) => {
    const hard = !!o.hard,
      c = r.pick(SCORE),
      name = r.pick(NAMES),
      k = hard ? r.pick([4, 5]) : r.pick([3, 4]),
      T = r.int(c.T[0], c.T[1]);
    // hard: TWO more items, with the same score on each
    const extra = hard ? 2 : 1;
    let have, need, gap;
    for (let t = 0; t < 200; t++) {
      have = S.withMean(r, k, T + r.pick([-3, -2, -1, 1, 2]), c.spread).map((v) => Math.max(1, v));
      gap = T * (k + extra) - S.sum(have);
      need = gap / extra;
      if (Number.isInteger(need) && need > 0 && need !== T && need <= T + c.spread * 2) break;
    }
    const n = k + extra,
      total = T * n,
      sum = S.sum(have);
    return {
      type: 'num',
      skill: 'target-mean',
      lesson: '2-8',
      title: hard ? 'Reach the target mean (two more)' : 'Reach the target mean',
      prompt: hard
        ? `<p>${name}'s ${c.what} so far: ${hl(S.list(have))}.</p><p>${name} has <b>two</b> more ${pl(c.item)} and will score the <b>same</b> on both. What must ${name} score on each one to finish with a mean of exactly ${hl(T + ' ' + c.unit)}?</p>`
        : `<p>${name}'s ${c.what} so far: ${hl(S.list(have))}.</p><p>${name} wants a mean of exactly ${hl(T + ' ' + c.unit)} after the next ${c.item}. What must ${name} score on that ${c.item}?</p>`,
      unit: c.unit,
      answer: need,
      hints: [
        'Work backward. A mean of ' + T + ' over ' + n + ' values means the total must be ' + T + ' × ' + n + '.',
        `Total needed: ${T} × ${n} = ${total}. Total so far: ${sumText(have)}.`,
        hard ? `The last two scores together must make up ${total} − ${sum}. Split that into two equal scores.` : `The next score must make up the difference: ${total} − ${sum}.`,
      ],
      hintEs: `Trabaja al revés. Una media de ${T} con ${n} valores significa que el total debe ser ${T} × ${n}.`,
      solution: `<p>For ${n} values to have a mean of ${T}, their total must be ${T} × ${n} = ${total}. So far the total is ${sum}. ${hard ? `The last two ${pl(c.item)} must add to ${total} − ${sum} = ${gap}, so each one is ${gap} ÷ 2 = <b>${need}</b> ${c.unit}. Check: (${sum} + ${need} + ${need}) ÷ ${n} = ${T}.` : `The next ${c.item} must be ${total} − ${sum} = <b>${need}</b> ${c.unit}. Check: (${sum} + ${need}) ÷ ${n} = ${T}.`}</p>`,
      feedback: {
        correct: hard ? `Correct. ${sum} + ${need} + ${need} = ${total}, and ${total} ÷ ${n} = ${T}.` : `Correct. ${sum} + ${need} = ${total}, and ${total} ÷ ${n} = ${T}.`,
        wrong(ans, d) {
          const v = d.value;
          if (v === T) return `Scoring ${T} does not move the mean to ${T} unless the mean is already ${T}. Find the total needed (${T} × ${n}) and compare it with the total so far.`;
          if (v === total) return `${total} is the total needed for all ${n} values. Subtract the ${sum} already earned.`;
          if (hard && v === gap) return `${gap} is what the last two scores add up to. Each one is half of that.`;
          if (hard && v === T * (k + 1) - sum) return `You planned for only one more ${c.item}. There are two, so the total needed is ${T} × ${n}.`;
          if (v != null && Math.abs(v - Math.abs(T - sum / k)) < 0.01) return 'That is the gap between the target and the current mean, not the next score. Work with totals: target × count − sum so far.';
          return `Target total: ${T} × ${n} = ${total}. Subtract the current total ${sum}${hard ? ', then split it between the two scores' : ''}.`;
        },
      },
    };
  });

  // ---------- Target mean table (table) ----------
  G.define('s8_targetTable', (r, o) => {
    const hard = !!o.hard;
    const c = r.pick(SCORE),
      name = r.pick(NAMES),
      k = hard ? r.pick([4, 5, 6]) : 4,
      T = r.int(c.T[0], c.T[1]);
    let have, need;
    for (let t = 0; t < 80; t++) {
      have = S.withMean(r, k, T + r.pick([-2, -1, 1, 2]), c.spread).map((v) => Math.max(1, v));
      need = T * (k + 1) - S.sum(have);
      if (need > 0 && need !== T && need <= T + c.spread * 2 && Number.isInteger(S.mean(have))) break;
    }
    const n = k + 1,
      total = T * n,
      sum = S.sum(have),
      cur = S.mean(have);
    const cap = c.item.charAt(0).toUpperCase() + c.item.slice(1);
    if (hard) {
      // only the current MEAN is given, not the scores: rebuild the total first
      return {
        type: 'table',
        skill: 'target-mean',
        lesson: '2-8',
        title: 'Plan the next score (from a mean)',
        prompt: `<p>${name} has finished ${k} ${pl(c.item)} with a mean of ${hl(cur + ' ' + c.unit)}. ${name} wants a mean of ${hl(T + ' ' + c.unit)} after one more ${c.item}. Complete the plan.</p>`,
        rows: [
          ['Step', 'Value'],
          [`Total of the first ${k} ${pl(c.item)}`, '__IN:sum__'],
          [`Total needed for a mean of ${T} over ${n}`, '__IN:total__'],
          [`Score needed on ${c.item} ${n}`, '__IN:need__'],
        ],
        header: true,
        inputs: [
          { id: 'sum', answer: sum },
          { id: 'total', answer: total },
          { id: 'need', answer: need },
        ],
        hints: [
          'Turn each mean into a total: mean × number of values.',
          `So far: ${cur} × ${k}. Needed: ${T} × ${n}.`,
          'The next score is the difference between the two totals.',
        ],
        hintEs: 'Convierte cada media en un total: media × número de valores.',
        solution: `<p>Total so far: ${cur} × ${k} = <b>${sum}</b>. Total needed: ${T} × ${n} = <b>${total}</b>. Score needed: ${total} − ${sum} = <b>${need}</b> ${c.unit}. Check: ${total} ÷ ${n} = ${T}.</p>`,
        feedback: {
          correct: `Correct. Means become totals, and the gap between totals is the score needed.`,
          wrong(ans, d) {
            const v = (k2) => RX.parseNum((ans || {})[k2]);
            if (d.wrong.includes('sum')) return v('sum') === cur ? `${cur} is the mean. The total is mean × count: ${cur} × ${k}.` : `Total so far = mean × count = ${cur} × ${k}.`;
            if (d.wrong.includes('total')) return `The total must be target mean × count: ${T} × ${n}.`;
            if (v('need') === T) return `Scoring ${T} only works if the mean is already ${T}. Subtract the two totals.`;
            return 'Subtract the total so far from the total needed.';
          },
        },
      };
    }
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
      hintEs: `Empieza con el total. Una media de ${T} en ${n} partidos o sesiones necesita un total de ${T} × ${n}.`,
      solution: `<p>Total needed: ${T} × ${n} = <b>${total}</b>. So far: ${sum}. ${cap} ${n}: ${total} − ${sum} = <b>${need}</b> ${c.unit}. Check: (${sum} + ${need}) ÷ ${n} = ${T}.</p>`,
      feedback: {
        correct: `Correct. The total ${total} spread over ${n} ${pl(c.item)} gives a mean of ${T}.`,
        wrong(ans, d) {
          const v = (k2) => RX.parseNum((ans || {})[k2]);
          if (d.wrong.includes('total')) return `The total must be mean × count: ${T} × ${n}.`;
          if (v('need') === T) return `Scoring ${T} only works if the mean is already ${T}. Subtract the total so far from the total needed.`;
          return `Subtract the total so far (${sum}) from the total needed (${total}).`;
        },
      },
    };
  });

  // ---------- Who planned the target correctly (who) ----------
  G.define('s8_targetWho', (r, o) => {
    const hard = !!o.hard;
    const c = r.pick(SCORE),
      [a, b, z] = r.pickN(NAMES, 3),
      k = hard ? r.pick([4, 5]) : r.pick([3, 4]),
      T = r.int(c.T[0], c.T[1]);
    // hard: the current mean is ABOVE the target, so the next score must be LOWER than the target
    let have, need;
    for (let t = 0; t < 120; t++) {
      have = S.withMean(r, k, hard ? T + r.pick([1, 2, 3]) : T - r.pick([1, 2, 3]), c.spread).map((v) => Math.max(1, v));
      need = T * (k + 1) - S.sum(have);
      if (need > 0 && need !== T && need <= T + c.spread * 2) break;
    }
    const n = k + 1,
      total = T * n,
      sum = S.sum(have),
      curMean = RX.round(sum / k, 1);
    const gap = RX.round(Math.abs(T - curMean), 1);
    const opts = [
      { html: `<b>${a}</b>: "A mean of ${T} over ${n} ${pl(c.item)} needs a total of ${total}. I have ${sum}, so I need ${need}."`, ok: true },
      {
        html: `<b>${b}</b>: "The mean should be ${T}, so the next ${c.item} only has to be ${T}. That keeps everything even."`,
        why: `Scoring ${T} pulls the mean toward ${T} but does not reach it, because the first ${k} scores are ${hard ? 'above' : 'below'} ${T}. The total matters: (${sum} + ${T}) ÷ ${n} is not ${T}.`,
      },
      {
        html: `<b>${z}</b>: "My mean is about ${fmt(curMean)} now. The target is ${T}, so I need ${fmt(gap)} ${hard ? 'less' : 'more'} on the next ${c.item}."`,
        why: `The gap between two means is not a score. Work with totals: ${total} needed minus ${sum} earned.`,
      },
    ];
    const sh = shuffleOptions(r, opts, 0);
    return {
      type: 'who',
      skill: 'target-mean',
      lesson: '2-8',
      title: 'Who has the right plan?',
      prompt: `<p>Three students have the same ${c.what} so far: ${hl(S.list(have))}. Each wants a mean of ${hl(T)} after the next ${c.item}.${hard ? ' Their mean right now is above the target.' : ''}</p><p>Who is correct?</p>`,
      options: sh.options,
      answer: sh.answer,
      layout: 'cards',
      hints: ['Think in totals. The mean times the number of values gives the total needed.', `Total needed: ${T} × ${n} = ${total}. Add the scores so far.`, 'The next score is the total needed minus the total so far. Which student does that?'],
      hintEs: 'Piensa en totales. La media por el número de valores da el total que se necesita.',
      solution: `<p><b>${a}</b> is correct. Mean ${T} over ${n} ${pl(c.item)} needs a total of ${total}. With ${sum} so far, the next score must be ${total} − ${sum} = <b>${need}</b>.${hard ? ` The scores so far are above ${T}, so the next score must be below ${T} to pull the mean down to exactly ${T}.` : ` Scoring only ${T} would leave the mean below ${T}, because the earlier scores are below the target.`}</p>`,
      feedback: { correct: 'Correct. Target mean × count gives the total you need; subtract what you already have.', wrong: (x) => whyOf(sh, x, 'Work with totals, not means.') },
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
  const SITES = ['Upper Bend', 'Lower Bend', 'Oyster Bar', 'Mouth', 'Eelgrass Bed', 'Channel', 'Inlet', 'Boat Ramp'];
  const devs = (vals, m) => vals.map((v) => Math.abs(v - m));
  const devText = (vals, m) => vals.map((v) => `|${v} − ${m}| = ${Math.abs(v - m)}`).join(', ');
  const madOf = (vals) => RX.round(S.mad(vals), 2);

  const whyOf = (sh, a, fallback) => (sh.options[a] && sh.options[a].why) || fallback;
  const dp2 = (x) => Math.abs(x * 100 - Math.round(x * 100)) < 1e-9;
  /** n (even) values whose mean is m + 0.5 and whose MAD has at most 2 decimal places. */
  function halfMean(r, n, m, spread) {
    for (let t = 0; t < 300; t++) {
      const v = S.withMean(r, n, m, spread).map((x, i) => (i < n / 2 ? x + 1 : x));
      const sh = r.shuffle(v);
      if (dp2(S.mad(sh)) && S.mad(sh) > 0 && sh.every((x) => x >= 0)) return sh;
    }
    return r.shuffle(S.withMean(r, n, m, spread).map((x, i) => (i < n / 2 ? x + 1 : x)));
  }
  const dfmt = (x) => fmt(RX.round(x, 2));
  const devTextF = (vals, m) => vals.map((v) => `|${v} − ${dfmt(m)}| = ${dfmt(Math.abs(v - m))}`).join(', ');

  // ---------- Distance from the mean for each value (table) ----------
  G.define('s9_deviationTable', (r, o) => {
    const hard = !!o.hard;
    const c = r.pick(CTX);
    // hard: the mean is NOT given, and it ends in .5, so every distance is a decimal
    const n = hard ? 4 : 5,
      m0 = r.int(c.m[0], c.m[1]);
    const vals = hard ? halfMean(r, n, m0, 6) : S.withMeanCleanMad(r, n, m0, 6);
    const m = S.mean(vals);
    const dv = vals.map((v) => RX.round(Math.abs(v - m), 2));
    const rows = hard ? [['Value', 'Distance from the mean'], ['Mean of the data', '__IN:mean__'], ...vals.map((v, i) => [String(v), `__IN:d${i}__`])] : [['Value', 'Distance from mean ' + m], ...vals.map((v, i) => [String(v), `__IN:d${i}__`])];
    const inputs = vals.map((v, i) => ({ id: 'd' + i, answer: dv[i], tolerance: 0.001 }));
    if (hard) inputs.unshift({ id: 'mean', answer: m, tolerance: 0.001 });
    return {
      type: 'table',
      skill: 'mad',
      lesson: '2-9',
      title: hard ? 'Distance from the mean (find the mean first)' : 'Distance from the mean',
      prompt: hard
        ? `<p>Data (${c.what}): ${hl(S.list(vals))}.</p><p>Find the mean first. Then complete the table: how far is each value from the mean? Distances are always positive, and they may be decimals.</p>`
        : `<p>Data (${c.what}): ${hl(S.list(vals))}. The mean is ${hl(m)}.</p><p>Complete the table: how far is each value from the mean? Distances are always positive.</p>`,
      rows,
      header: true,
      inputs,
      hints: [
        'Distance from the mean is the difference between the value and the mean, written as a positive number.',
        hard ? `Mean = sum ÷ count = ${S.sum(vals)} ÷ ${n}. It will end in .5.` : `For example, ${vals[0]} is ${dv[0]} away from ${m}, whether it is above or below.`,
        hard ? 'For each value, subtract the smaller number from the larger: value and mean.' : 'For each value, subtract the smaller number from the larger one.',
      ],
      hintEs: 'La distancia a la media es la diferencia entre el dato y la media, escrita como número positivo.',
      solution: `<p>${hard ? `Mean: ${S.sum(vals)} ÷ ${n} = <b>${dfmt(m)}</b>. ` : ''}${devTextF(vals, m)}. Every distance is positive because it measures how far, not which direction. The sum of these distances is ${dfmt(S.sum(dv))}, and dividing by ${n} would give the MAD, ${dfmt(S.mad(vals))}.</p>`,
      feedback: {
        correct: 'Correct. Distances ignore direction, so a value below the mean counts the same as one above it.',
        wrong(ans, d) {
          if (d.wrong.includes('mean')) return `The mean is the sum ${S.sum(vals)} divided by ${n}. It is not a whole number here.`;
          const id = d.wrong[0];
          const i = Number(String(id).slice(1));
          const v = vals[i];
          const typed = RX.parseNum((ans || {})[id]);
          if (typed != null && Math.abs(typed - (v - m)) < 0.001 && v < m) return `${v} is below the mean, so ${v} − ${dfmt(m)} is negative. Distance is always positive: write ${dfmt(m)} − ${v}.`;
          if (hard && typed != null && Math.abs(Math.abs(typed - dv[i]) - 0.5) < 0.001) return `Off by 0.5 for ${v}. Subtract from the exact mean, ${dfmt(m)}, not a rounded one.`;
          return `For ${v}: subtract the smaller number from the larger, ${dfmt(Math.max(v, m))} − ${dfmt(Math.min(v, m))}.`;
        },
      },
    };
  });

  // ---------- Find the MAD (num) ----------
  G.define('s9_mad', (r, o) => {
    const hard = !!o.hard,
      c = r.pick(CTX),
      n = hard ? r.pick([4, 8]) : r.pick([4, 5]),
      m0 = r.int(c.m[0], c.m[1]);
    // hard: the mean is not given and ends in .5
    const vals = hard ? halfMean(r, n, m0, 7) : S.withMeanCleanMad(r, n, m0, 5);
    const m = S.mean(vals);
    const dv = vals.map((v) => RX.round(Math.abs(v - m), 2)),
      sd = RX.round(S.sum(dv), 2),
      mad = madOf(vals);
    return {
      type: 'num',
      skill: 'mad',
      lesson: '2-9',
      title: hard ? 'Find the MAD (decimal mean)' : 'Find the MAD',
      prompt: `<p>Readings of ${c.what}: ${hl(S.list(vals))}.${hard ? '' : ` The mean is ${hl(m)}.`}</p><p>Find the <b>mean absolute deviation (MAD)</b>.${Number.isInteger(mad) ? '' : ' Your answer may be a decimal.'}</p>`,
      unit: c.unit,
      answer: mad,
      tolerance: 0.01,
      hints: [
        `${hard ? 'First find the mean: sum ÷ count. ' : ''}Then find each value's distance from the mean (always positive), add the distances, and divide by the number of values.`,
        hard ? `Mean = ${S.sum(vals)} ÷ ${n}. Keep the .5: every distance will end in .5 or be a whole number.` : `Mean = ${m}. Find each distance: |value − ${m}|.`,
        hard ? `Add the ${n} distances, then divide the total by ${n}.` : `Add the ${n} distances, then divide by ${n}.`,
      ],
      hintEs: `${hard ? 'Primero halla la media: suma ÷ cantidad. ' : ''}Luego halla la distancia de cada dato a la media (siempre positiva), suma las distancias y divide entre el número de datos.`,
      solution: `<p>${hard ? `Mean: ${S.sum(vals)} ÷ ${n} = ${dfmt(m)}. ` : ''}Distances from ${dfmt(m)}: ${dv.map(dfmt).join(', ')}. Sum: ${dfmt(sd)}. MAD = ${dfmt(sd)} ÷ ${n} = <b>${fmt(mad)}</b> ${c.unit}. On average, each reading is ${fmt(mad)} ${c.unit} away from the mean.</p>`,
      feedback: {
        correct: `Correct. The readings are, on average, ${fmt(mad)} ${c.unit} from the mean.`,
        wrong(ans, d) {
          const v = d.value;
          if (v != null && Math.abs(v - sd) < 0.01) return `${dfmt(sd)} is the sum of the distances. Divide by ${n} to find the average distance.`;
          if (v != null && Math.abs(v - m) < 0.01) return `${dfmt(m)} is the mean. The MAD measures how far the values are from the mean, on average.`;
          if (v === S.range(vals)) return 'That is the range. The MAD averages every value’s distance from the mean.';
          if (v === 0) return 'Did you add positive and negative differences? Distances are always positive, so they cannot cancel out.';
          const roundedMad = (mm) => RX.round(S.sum(vals.map((x) => Math.abs(x - mm))) / n, 2);
          if (hard && v != null && [Math.floor(m), Math.ceil(m)].some((mm) => Math.abs(v - roundedMad(mm)) < 0.01)) return `You used a rounded mean. Use the exact mean, ${dfmt(m)}, for every distance.`;
          return `Find each distance from ${dfmt(m)}, add them, and divide by ${n}.`;
        },
      },
    };
  });

  // ---------- MAD step by step (blanks) ----------
  G.define('s9_madBlanks', (r, o) => {
    const hard = !!o.hard;
    const c = r.pick(CTX),
      n = hard ? 4 : r.pick([4, 5, 6]),
      m0 = r.int(c.m[0], c.m[1]);
    const vals = hard ? halfMean(r, n, m0, 5) : S.withMeanCleanMad(r, n, m0, 5);
    const m = S.mean(vals);
    const dv = vals.map((v) => RX.round(Math.abs(v - m), 2)),
      sd = RX.round(S.sum(dv), 2),
      mad = madOf(vals);
    return {
      type: 'blanks',
      skill: 'mad',
      lesson: '2-9',
      title: hard ? 'Build the MAD (decimal mean)' : 'Build the MAD',
      prompt: `<p>Data (${c.what}): ${hl(S.list(vals))}.</p><p>Complete the steps to find the MAD.${hard ? ' The mean is a decimal.' : Number.isInteger(mad) ? '' : ' The MAD may be a decimal.'}</p>`,
      fields: [
        { label: 'mean', answer: m, width: 'sm', tolerance: 0.001 },
        { label: 'sum of distances', answer: sd, width: 'sm', tolerance: 0.001 },
        { label: 'MAD', answer: mad, width: 'sm', tolerance: 0.01 },
      ],
      template: ['Step 1: the mean is {0}.', 'Step 2: the distances from the mean add up to {1}.', `Step 3: divide by ${n} values. MAD = {2}.`],
      hints: [
        `Mean = sum ÷ count. Sum: ${vals.join(' + ')} = ${S.sum(vals)}.`,
        hard ? `Mean = ${S.sum(vals)} ÷ ${n}. Now find each distance from that mean.` : `Mean = ${m}. Now find each distance: ${devTextF(vals, m)}.`,
        `Add the ${n} distances. Then divide that sum by ${n}.`,
      ],
      hintEs: `Media = suma ÷ cantidad. Suma: ${vals.join(' + ')} = ${S.sum(vals)}.`,
      solution: `<p>Mean: ${S.sum(vals)} ÷ ${n} = <b>${dfmt(m)}</b>. Distances from the mean: ${dv.map(dfmt).join(', ')}, which add to <b>${dfmt(sd)}</b>. MAD = ${dfmt(sd)} ÷ ${n} = <b>${fmt(mad)}</b> ${c.unit}. The MAD is the mean of the distances, so it uses the same divide-by-count step as the mean.</p>`,
      feedback: {
        correct: `Correct. Mean ${dfmt(m)}, distances totaling ${dfmt(sd)}, MAD ${fmt(mad)}.`,
        wrong(ans, d) {
          const got = (ans || []).map(RX.parseNum);
          if (d.wrong.includes(0)) return hard && got[0] != null && Math.abs(got[0] - Math.round(m)) < 0.6 && Math.abs(got[0] - m) > 0.01 ? `Do not round the mean. ${S.sum(vals)} ÷ ${n} is exactly ${dfmt(m)}.` : `The mean is ${vals.join(' + ')} divided by ${n}.`;
          if (d.wrong.includes(1)) return got[1] === 0 ? 'Your distances canceled to 0. Make every distance positive before adding.' : `Find how far each value is from ${dfmt(m)} (always positive), then add those ${n} distances.`;
          return `Divide the sum of distances by ${n}.`;
        },
      },
    };
  });

  // ---------- What the MAD tells you (mc) ----------
  G.define('s9_madMeaning', (r, o) => {
    const hard = !!o.hard;
    const c = r.pick(CTX),
      n = r.pick([5, 6, 8]),
      m = r.int(c.m[0], c.m[1]),
      name = r.pick(NAMES);
    const vals = S.withMeanCleanMad(r, n, m, 5);
    const mad = madOf(vals),
      M = fmt(mad),
      u = c.unit;
    if (hard) {
      // two sites with the SAME mean: interpret the difference in MAD
      const [l1, l2] = r.pickN(SITES, 2);
      let mad2 = RX.round(mad + r.pick([1.2, 1.6, 2, 2.4, 3]), 1);
      const opts = [
        { html: `${l2}'s readings are, on average, farther from the mean of ${m} than ${l1}'s readings are.`, ok: true },
        { html: `${l2}'s readings are, on average, higher than ${l1}'s, since a larger MAD means larger values.`, why: `Both sites have the same mean, ${m}. The MAD measures distance from the mean, not how big the values are.` },
        { html: `Every one of ${l2}'s readings is exactly ${fmt(RX.round(mad2 - mad, 1))} ${u} farther from ${m} than ${l1}'s are.`, why: 'The MAD is an average. Individual readings can be closer or farther than that.' },
        { html: `${l2}'s readings all fall between ${fmt(RX.round(m - mad2, 1))} and ${fmt(RX.round(m + mad2, 1))} ${u}, but ${l1}'s do not.`, why: 'The MAD is not a boundary. Some readings can sit more than one MAD from the mean.' },
      ];
      const sh = shuffleOptions(r, opts, 0);
      return {
        type: 'mc',
        skill: 'mad',
        lesson: '2-9',
        title: 'Compare two MADs',
        prompt: `<p>${name} measured ${c.what} at two sites. Both sites have a mean of ${hl(m + ' ' + u)}. ${l1} has a MAD of ${hl(M + ' ' + u)} and ${l2} has a MAD of ${hl(fmt(mad2) + ' ' + u)}.</p><p>Which conclusion is correct?</p>`,
        options: sh.options,
        answer: sh.answer,
        hints: [
          'The MAD is the average distance from the mean. It describes spread, not size.',
          'With equal means, a larger MAD says the readings scatter farther from that shared mean.',
          'Check each option: does it treat the MAD as an average distance, or as something else?',
        ],
        hintEs: 'La desviación media absoluta es la distancia promedio a la media. Describe la dispersión, no el tamaño de los datos.',
        solution: `<p>The MAD is an average distance from the mean. Both means are ${m}, and ${l2}'s MAD (${fmt(mad2)}) is larger than ${l1}'s (${M}), so <b>${l2}'s readings are, on average, farther from ${m}</b>. It says nothing about which site has bigger values, and it is not a boundary.</p>`,
        feedback: { correct: 'Correct. A larger MAD means more scatter around the mean.', wrong: (a) => whyOf(sh, a, 'The MAD is an average distance from the mean.') },
      };
    }
    const opts = [
      { html: `On average, each reading is about ${M} ${u} away from the mean of ${m}.`, ok: true },
      { html: `Every one of the ${n} readings is exactly ${M} ${u} away from the mean of ${m}.`, why: 'The MAD is an average distance. Some readings are closer to the mean and some are farther.' },
      { html: `The typical reading is ${M} ${u}, so most of the readings are close to ${M} ${u}.`, why: `The typical reading is described by the mean, ${m}. The MAD describes spread, not center.` },
      { html: `All of the readings fall between ${m - mad > 0 ? fmt(RX.round(m - mad, 2)) : 0} and ${fmt(RX.round(m + mad, 2))} ${u}, within one MAD of the mean.`, why: 'The MAD is not a boundary. Readings can be more than one MAD from the mean; the MAD is the average distance.' },
    ];
    const sh = shuffleOptions(r, opts, 0);
    return {
      type: 'mc',
      skill: 'mad',
      lesson: '2-9',
      title: 'What does the MAD tell you?',
      prompt: `<p>${name} measured ${c.what} ${n} times. The mean is ${hl(m + ' ' + u)} and the MAD is ${hl(M + ' ' + u)}.</p><p>What does the MAD tell you?</p>`,
      options: sh.options,
      answer: sh.answer,
      hints: [
        'MAD stands for mean absolute deviation: the mean (average) of the absolute (positive) deviations (distances) from the mean.',
        'So the MAD is an average distance, not a boundary and not a typical value.',
        'Which statement describes an average distance from the mean?',
      ],
      hintEs: 'DMA significa desviación media absoluta: el promedio de las distancias (siempre positivas) de los datos a la media.',
      solution: `<p>The MAD is the average distance of the values from the mean. <b>On average, each reading is about ${M} ${u} from the mean of ${m}.</b> A smaller MAD would mean the readings stay closer to the mean; a larger MAD would mean they scatter farther.</p>`,
      feedback: { correct: 'Correct. The MAD is an average distance from the mean.', wrong: (a) => whyOf(sh, a, 'The MAD is an average distance from the mean.') },
    };
  });

  // ---------- Compare two sets with MAD (mc) ----------
  G.define('s9_compareMAD', (r, o) => {
    const hard = !!o.hard;
    const c = r.pick(CTX),
      [l1, l2] = r.pickN(SITES, 2),
      n = 5;
    // hard: different means (compute each one), and the steadier site has the LARGER range
    let d1, d2, ma, mb;
    for (let t = 0; t < 400; t++) {
      ma = r.int(c.m[0], c.m[1]);
      mb = hard ? ma + r.pick([-4, -3, 3, 4]) : ma;
      d1 = S.withMeanCleanMad(r, n, ma, hard ? 6 : 2);
      d2 = S.withMeanCleanMad(r, n, mb, hard ? 6 : 7);
      const g = madOf(d2) - madOf(d1);
      if (!hard ? g >= 1 : Math.abs(g) >= 0.8 && (S.range(d1) - S.range(d2)) * (madOf(d1) - madOf(d2)) < 0 && d2.every((v) => v >= 0)) break;
    }
    const m1 = madOf(d1),
      m2 = madOf(d2);
    const tight = m1 < m2 ? l1 : l2,
      loose = tight === l1 ? l2 : l1;
    const tightM = Math.min(m1, m2),
      looseM = Math.max(m1, m2);
    const dT = tight === l1 ? d1 : d2,
      dL = tight === l1 ? d2 : d1;
    const opts = [
      { html: `${tight}, because its MAD is ${fmt(tightM)}, smaller than ${fmt(looseM)}.`, ok: true },
      { html: `${loose}, because its MAD is ${fmt(looseM)}, larger than ${fmt(tightM)}.`, why: 'A larger MAD means the readings are farther from the mean on average: less consistent, not more.' },
      hard
        ? { html: `${loose}, because its range is ${S.range(dL)}, smaller than ${S.range(dT)}.`, why: 'The range only uses the two end values. The MAD uses every value’s distance from the mean.' }
        : { html: 'Neither, because both of the sites have the same mean.', why: 'Two sets can share a mean and still differ in spread. The MAD measures that spread.' },
      Math.max(...dL) > Math.max(...dT)
        ? { html: `${loose}, because it has the largest single reading, ${Math.max(...dL)}.`, why: 'One large reading does not measure consistency. The MAD uses every value’s distance from the mean.' }
        : Math.min(...dL) < Math.min(...dT)
          ? { html: `${loose}, because it has the smallest single reading, ${Math.min(...dL)}.`, why: 'One small reading does not measure consistency. The MAD uses every value’s distance from the mean.' }
          : { html: `${loose}, because its median reading of ${fmt(S.median(dL))} is in the middle.`, why: 'The median is a center, not a measure of consistency. The MAD measures distance from the mean.' },
    ];
    const sh = shuffleOptions(r, opts, 0);
    const mm = (d) => S.mean(d);
    return {
      type: 'mc',
      skill: 'mad',
      lesson: '2-9',
      title: 'Which site is steadier?',
      prompt: hard
        ? `<p>Two sites recorded ${c.what} on 5 days. Their means are different.</p><p><b>${l1}</b>: ${hl(S.list(d1))}<br><b>${l2}</b>: ${hl(S.list(d2))}</p><p>Which site's readings are <b>more consistent</b>? Use the MAD.</p>`
        : `<p>Two sites recorded ${c.what} on 5 days. Both have a mean of ${hl(ma)}.</p><p><b>${l1}</b>: ${hl(S.list(d1))}<br><b>${l2}</b>: ${hl(S.list(d2))}</p><p>Which site's readings are <b>more consistent</b>? Use the MAD.</p>`,
      options: sh.options,
      answer: sh.answer,
      hints: [
        'The MAD is the average distance from the mean. A smaller MAD means the values stay closer to the mean.',
        hard ? `Find each site's own mean first: ${l1} ${S.sum(d1)} ÷ 5, ${l2} ${S.sum(d2)} ÷ 5.` : `${l1} distances from ${ma}: ${devs(d1, ma).join(', ')}. ${l2} distances: ${devs(d2, ma).join(', ')}.`,
        hard ? 'Find each distance from that site’s mean, add, and divide by 5. Compare the two MADs.' : 'Add each list of distances and divide by 5. The smaller MAD is steadier.',
      ],
      hintEs: 'La desviación media absoluta es la distancia promedio a la media. Una más pequeña significa que los datos se quedan más cerca de la media.',
      solution: `<p>${l1}: mean ${mm(d1)}, distances ${devs(d1, mm(d1)).join(', ')}, MAD = ${fmt(m1)}. ${l2}: mean ${mm(d2)}, distances ${devs(d2, mm(d2)).join(', ')}, MAD = ${fmt(m2)}. <b>${tight}</b> has the smaller MAD, so its readings stay closer to its mean and are more consistent.${hard ? ` Its range is larger, but the range only looks at the two end values.` : ' Equal means say nothing about spread; the MAD does.'}</p>`,
      feedback: { correct: `Correct. A MAD of ${fmt(tightM)} is tighter than ${fmt(looseM)}.`, wrong: (a) => whyOf(sh, a, 'Compute both MADs and compare.') },
    };
  });

  // ---------- Order sets by MAD (seq) ----------
  G.define('s9_seqMAD', (r, o) => {
    const hard = !!o.hard;
    const c = r.pick(CTX),
      k = 3,
      sites = r.pickN(SITES, k),
      m = r.int(c.m[0], c.m[1]),
      asc = r.chance(0.5);
    // hard: each site has its OWN mean, so every MAD starts with a new mean
    let sets, mads, means;
    for (let t = 0; t < 160; t++) {
      means = hard ? [m, m + r.pick([2, 3, 4]), m - r.pick([2, 3])] : [m, m, m];
      sets = [S.withMeanCleanMad(r, 4, means[0], 1), S.withMeanCleanMad(r, 4, means[1], 4), S.withMeanCleanMad(r, 4, means[2], 8)];
      mads = sets.map(madOf);
      const sm = mads.slice().sort((a, b) => a - b);
      if (new Set(mads).size === k && Math.min(sm[1] - sm[0], sm[2] - sm[1]) >= 0.5 && sets.every((d) => d.every((v) => v >= 0))) break;
    }
    const perm = r.shuffle([0, 1, 2]);
    sets = perm.map((i) => sets[i]);
    mads = perm.map((i) => mads[i]);
    means = perm.map((i) => means[i]);
    const items = sets.map((d, i) => ({ html: `<b>${sites[i]}</b>: ${S.list(d)}`, rate: mads[i] }));
    const order = items.map((_, i) => i).sort((a, b) => (asc ? items[a].rate - items[b].rate : items[b].rate - items[a].rate));
    const byRange = items.map((_, i) => i).sort((a, b) => (asc ? S.range(sets[a]) - S.range(sets[b]) : S.range(sets[b]) - S.range(sets[a])));
    return {
      type: 'seq',
      skill: 'mad',
      lesson: '2-9',
      title: hard ? 'Order by MAD (different means)' : 'Order by MAD',
      prompt: hard
        ? `<p>Three sites each recorded ${c.what} on 4 days. The sites have <b>different</b> means.</p><p>Order the sites by <b>MAD</b>, from ${asc ? '<b>smallest</b> (top) to <b>largest</b> (bottom)' : '<b>largest</b> (top) to <b>smallest</b> (bottom)'}.</p>`
        : `<p>Three sites each recorded ${c.what} on 4 days. Every site has a mean of ${hl(m)}.</p><p>Order the sites by <b>MAD</b>, from ${asc ? '<b>smallest</b> (top) to <b>largest</b> (bottom)' : '<b>largest</b> (top) to <b>smallest</b> (bottom)'}.</p>`,
      items,
      order,
      hints: [
        hard ? 'Find each site’s own mean first (sum ÷ 4). Then find each distance from that mean, add, and divide by 4.' : `All three means are ${m}, so find each value's distance from ${m}, add the four distances, and divide by 4.`,
        hard ? `Means: ${sets.map((d, i) => `${sites[i]} ${S.sum(d)} ÷ 4`).join(', ')}.` : `Sums of distances: ${sets.map((d, i) => `${sites[i]} ${S.sum(devs(d, m))}`).join(', ')}.`,
        `Divide each sum of distances by 4, then put the ${asc ? 'smallest' : 'largest'} MAD on top.`,
      ],
      hintEs: hard ? 'Primero halla la media de cada lugar (suma ÷ 4). Luego halla cada distancia a esa media, súmalas y divide entre 4.' : `Las tres medias son ${m}. Halla la distancia de cada dato a ${m}, suma las cuatro distancias y divide entre 4.`,
      solution: `<p>${sets.map((d, i) => `${sites[i]}: mean ${means[i]}, distances ${devs(d, means[i]).join(', ')}, MAD = ${S.sum(devs(d, means[i]))} ÷ 4 = <b>${fmt(mads[i])}</b>`).join('; ')}. Order (${asc ? 'smallest to largest' : 'largest to smallest'}): <b>${order.map((i) => sites[i]).join(', ')}</b>. ${hard ? 'Each MAD is measured from its own mean.' : 'The same mean can hide very different spreads.'}</p>`,
      feedback: {
        correct: 'Correct. The MAD sorts the sites by how far their values sit from their means.',
        wrong(ans) {
          const a = Array.isArray(ans) ? ans : [];
          const same = (x, y) => x.length === y.length && x.every((v, i) => v === y[i]);
          if (same(a, order.slice().reverse())) return `The order is right but upside down. The ${asc ? 'smallest' : 'largest'} MAD goes on top.`;
          if (same(a, byRange) && !same(byRange, order)) return 'That is the order by range. The MAD averages every distance from the mean, so it can rank the sites differently.';
          return `Compute each MAD from the distances to ${hard ? 'each site’s own mean' : m}, then check the direction: ${asc ? 'smallest' : 'largest'} on top.`;
        },
      },
    };
  });

  // ---------- MAD true/false (tf) ----------
  G.define('s9_madTF', (r, o) => {
    const hard = !!o.hard;
    const c = r.pick(CTX),
      [l1, l2] = r.pickN(SITES, 2),
      m = r.int(c.m[0], c.m[1]);
    let d1, d2;
    if (hard) {
      // built so the set with the LARGER range has the SMALLER MAD
      const [a, b] = r.pick([
        [5, 3],
        [6, 4],
        [7, 4],
        [5, 4],
      ]);
      d1 = r.shuffle([m - a, m, m, m, m + a]);
      d2 = r.shuffle([m - b, m - b, m, m + b, m + b]);
    } else
      for (let t = 0; t < 80; t++) {
        d1 = S.withMeanCleanMad(r, 5, m, 2);
        d2 = S.withMeanCleanMad(r, 5, m, 7);
        if (madOf(d2) - madOf(d1) >= 1) break;
      }
    const m1 = madOf(d1),
      m2 = madOf(d2);
    const k = r.int(2, 6);
    const variant = hard ? r.pick(['rangeVsMad', 'shift', 'double']) : r.pick(['closer', 'zero', 'spread']);
    const claim = {
      closer: { text: `${l2} has the larger MAD, so its readings are closer to the mean.`, answer: false, reason: `A larger MAD means a larger average distance from the mean. ${l2}'s readings (MAD ${fmt(m2)}) are farther from ${m} than ${l1}'s (MAD ${fmt(m1)}).` },
      zero: { text: `If every reading at a site were exactly ${m}, the MAD would be 0.`, answer: true, reason: 'Every distance from the mean would be 0, so the average distance would be 0. A MAD of 0 means no variation at all.' },
      spread: { text: `${l2}'s readings are more spread out than ${l1}'s.`, answer: true, reason: `${l2}'s MAD is ${fmt(m2)} and ${l1}'s is ${fmt(m1)}. The larger MAD shows a larger average distance from the mean.` },
      rangeVsMad: { text: `${l1} has the larger range, so ${l1} must also have the larger MAD.`, answer: false, reason: `${l1}'s range is ${S.range(d1)} but its MAD is only ${fmt(m1)}; ${l2}'s range is ${S.range(d2)} with a MAD of ${fmt(m2)}. Most of ${l1}'s readings sit right at the mean, so its average distance is small.` },
      shift: { text: `If ${k} is added to every reading at ${l1}, the MAD stays ${fmt(m1)}.`, answer: true, reason: `Adding ${k} to every reading raises the mean by ${k} too, so every distance from the mean stays the same. The MAD stays ${fmt(m1)}.` },
      double: { text: `If every reading at ${l2} is doubled, the MAD stays ${fmt(m2)}.`, answer: false, reason: `Doubling every reading doubles the mean and doubles every distance from it, so the MAD doubles to ${fmt(RX.round(m2 * 2, 2))}.` },
    }[variant];
    const reasons = r.shuffle([
      { html: claim.reason, correct: true },
      { html: 'The MAD is always equal to the mean.' },
      { html: variant === 'zero' ? 'The MAD can never be 0.' : hard ? 'The MAD only depends on the largest and smallest readings.' : 'A larger MAD always means a larger mean.' },
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
        hard ? 'The MAD uses every value. The range uses only the two end values. They can disagree.' : 'A small MAD: values stay close to the mean. A large MAD: values scatter farther from it.',
        variant === 'zero'
          ? 'Picture readings that are all the same. How far is each from the mean?'
          : variant === 'shift'
            ? 'If every reading moves up by the same amount, where does the mean go? Do the distances change?'
            : variant === 'double'
              ? 'Try it with a small example: 2 and 4 have mean 3. Double them to 4 and 8. What happens to the distances?'
              : `Compare the two MADs given, ${fmt(m1)} and ${fmt(m2)}.`,
      ],
      hintEs: 'La desviación media absoluta es la distancia promedio de los datos a la media.',
      solution: `<p><b>${claim.answer ? 'True' : 'False'}.</b> ${claim.reason}</p>`,
      feedback: {
        correct: hard ? 'Correct. The MAD measures the average distance from the mean, using every value.' : 'Correct. Bigger MAD, bigger spread; MAD of 0, no spread.',
        wrong(ans, d) {
          if (!d.valueOk) {
            if (variant === 'rangeVsMad') return `Compare the MADs given: ${l1} ${fmt(m1)}, ${l2} ${fmt(m2)}. A bigger range did not give a bigger MAD.`;
            if (variant === 'shift') return 'Adding the same amount to every value moves the mean by that amount, so each distance to the mean stays the same.';
            if (variant === 'double') return 'Doubling every value doubles each distance from the new mean, so the MAD doubles too.';
            return variant === 'zero' ? 'Picture five readings that are all the same. How far is each from the mean?' : `Look at the distances from ${m}: ${l2}'s are larger. Does a larger MAD mean closer or farther?`;
          }
          return 'Your true/false choice is right. Pick the reason that talks about distances from the mean.';
        },
      },
    };
  });

  // ---------- Error in a MAD computation (error) ----------
  G.define('s9_errorMAD', (r, o) => {
    const hard = !!o.hard;
    const name = r.pick(NAMES),
      c = r.pick(CTX),
      n = hard ? 5 : r.pick([4, 5]),
      m = r.int(c.m[0], c.m[1]);
    let vals = S.withMeanCleanMad(r, n, m, 5);
    let med = S.median(vals);
    if (hard) {
      // the student measured distances from the MEDIAN, which differs from the mean here
      for (let t = 0; t < 200; t++) {
        vals = S.withMeanCleanMad(r, n, m, 6);
        med = S.median(vals);
        const wrong = S.sum(vals.map((v) => Math.abs(v - med))) / n;
        if (med !== m && Math.abs(wrong - S.mad(vals)) > 0.01) break;
      }
    }
    const dv = devs(vals, m),
      sd = S.sum(dv),
      mad = madOf(vals);
    const variant = hard ? 'median' : r.pick(['signed', 'noDivide']);
    const signed = vals.map((v) => v - m);
    const dmed = vals.map((v) => Math.abs(v - med)),
      wrongMed = RX.round(S.sum(dmed) / n, 2);
    const work = {
      signed: `"Mean = ${m}. Differences: ${signed.map((x) => (x < 0 ? '−' + Math.abs(x) : String(x))).join(', ')}. They add to 0, so 0 ÷ ${n} = 0. The MAD is <b>0</b>."`,
      noDivide: `"Mean = ${m}. Distances: ${dv.join(', ')}. ${dv.join(' + ')} = ${sd}. The MAD is <b>${sd}</b>."`,
      median: `"The middle value is ${med}. Distances: ${dmed.join(', ')}. ${dmed.join(' + ')} = ${S.sum(dmed)}, and ${S.sum(dmed)} ÷ ${n} = <b>${fmt(wrongMed)}</b>. The MAD is ${fmt(wrongMed)}."`,
    }[variant];
    const opts = {
      signed: [
        { html: `${name} kept the negative signs. Distances from the mean must all be positive, or they cancel out.`, ok: true },
        { html: `${name} found the mean wrong.`, why: `The mean ${m} is correct: ${vals.join(' + ')} = ${S.sum(vals)}, and ${S.sum(vals)} ÷ ${n} = ${m}.` },
        { html: `${name} should have divided by ${n - 1}.`, why: `The MAD divides by the number of values, ${n}. The problem is the signs, not the divisor.` },
        { html: 'There is no mistake. A MAD of 0 is normal.', why: 'A MAD of 0 only happens when every value equals the mean. These values are different, so the MAD cannot be 0.' },
      ],
      noDivide: [
        { html: `${name} added the distances but forgot to divide by ${n}. The MAD is the mean of the distances.`, ok: true },
        { html: `${name} should have used the range instead.`, why: 'The range is a different measure. The MAD averages the distances from the mean.' },
        { html: `${name} found the distances wrong.`, why: `The distances ${dv.join(', ')} are correct. The last step is missing.` },
        { html: 'There is no mistake.', why: `${sd} is the total of the distances. An average distance must be divided by the number of values.` },
      ],
      median: [
        { html: `${name} measured the distances from the median, ${med}. The MAD measures distances from the mean, ${m}.`, ok: true },
        { html: `${name} should not have divided by ${n}.`, why: `Dividing by ${n} is right: the MAD is an average. The problem is the center ${name} measured from.` },
        { html: `${name} should have kept the negative signs.`, why: 'Distances are always positive. That part of the work is fine.' },
        { html: 'There is no mistake. The median and the mean are the same here.', why: `The mean is ${S.sum(vals)} ÷ ${n} = ${m}, and the median is ${med}. They are different.` },
      ],
    }[variant];
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
        variant === 'signed'
          ? 'Distances cannot be negative. A value below the mean is still a positive distance away.'
          : variant === 'median'
            ? `Which center did ${name} use? Find the mean: ${S.sum(vals)} ÷ ${n}.`
            : `The sum of the distances is ${sd}. Is that an average yet?`,
        variant === 'median' ? `Find each distance from ${m}, add them, then divide by ${n}.` : `Distances: ${dv.join(', ')}. Add them, then divide by ${n}.`,
      ],
      hintEs: 'Pasos para la DMA: halla la media, halla la distancia de cada dato a la media (positiva), suma las distancias y divide entre la cantidad de datos.',
      solution: `<p>${variant === 'signed' ? `${name} used signed differences, which always add to 0 around the mean. Distances must be positive: ${dv.join(', ')}.` : variant === 'median' ? `${name} used the median ${med} as the center. The MAD uses the mean, ${m}. Distances from ${m}: ${dv.join(', ')}, sum ${sd}.` : `${name} added the distances correctly but stopped at the sum ${sd}, which is a total, not an average.`} MAD = ${sd} ÷ ${n} = <b>${fmt(mad)}</b> ${c.unit}.</p>`,
      feedback: {
        correct: 'Correct. Positive distances from the mean, then divide by the count.',
        wrong(ans, d) {
          if (!d.mistakeOk) return whyOf(sh, ans && ans.mistake, variant === 'signed' ? 'Can an average distance be 0 when the values are different? Look at the signs.' : `Retrace ${name}'s steps one at a time.`);
          const v = RX.parseNum(ans && ans.fix);
          if (variant === 'median' && v != null && Math.abs(v - wrongMed) < 0.01) return `That is ${name}'s answer. Measure the distances from the mean, ${m}, instead.`;
          if (v != null && Math.abs(v - sd) < 0.01) return `${sd} is the sum of the distances. Divide by ${n}.`;
          return `You found the mistake. Now compute the distances from ${m}, add them, and divide by ${n}.`;
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

  /** Like withOutlierIntMean, but the far-off value sits BELOW the cluster (it pulls the mean down). */
  function withLowOutlierIntMean(r, n, lo, hi) {
    for (let t = 0; t < 300; t++) {
      const span = hi - lo;
      const cluster = S.data(r, n - 1, lo + Math.max(10, Math.round(span * 0.8)), hi + Math.max(10, Math.round(span * 0.8)), true);
      let out = Math.min(...cluster) - r.int(Math.max(10, Math.round(span * 0.6)), Math.max(16, Math.round(span * 0.9)));
      const sum = S.sum(cluster);
      while (out > 0 && (sum + out) % n !== 0) out--;
      if (out < 0 || (sum + out) % n !== 0) continue;
      const all = r.shuffle(cluster.concat([out]));
      if (Math.abs(S.mean(all) - S.median(all)) >= 1.5) return { all, cluster, out, mean: S.mean(all), median: S.median(all), low: true };
    }
    return Object.assign(withOutlierIntMean(r, n, lo, hi), { low: false });
  }
  const outlierSet = (r, n, c, hard) => (hard && r.chance(0.5) ? withLowOutlierIntMean(r, n, c.lo, c.hi) : Object.assign(withOutlierIntMean(r, n, c.lo, c.hi), { low: false }));
  const whyOf = (sh, a, fallback) => (sh.options[a] && sh.options[a].why) || fallback;

  // ---------- Mean or median? (mc) ----------
  G.define('s10_chooseCenter', (r, o) => {
    const hard = !!o.hard,
      c = r.pick(CTX),
      n = r.pick([5, 6, 7]),
      skewed = r.chance(0.6);
    // hard: mean and median are not given, and the outlier may be LOW (pulling the mean down)
    let vals, mean, med, out, low;
    if (skewed) {
      const d = outlierSet(r, n, c, hard);
      vals = d.all;
      mean = d.mean;
      med = d.median;
      out = d.out;
      low = d.low;
    } else {
      const m = r.int(c.lo + 3, c.hi - 3);
      vals = symmetricSet(r, n, m, 3);
      mean = m;
      med = S.median(vals);
    }
    const dir = low ? 'down' : 'up';
    const opts = skewed
      ? [
          { html: `The median, ${fmt(med)}, because the outlier ${out} pulls the mean ${dir} to ${mean}, away from most values.`, ok: true },
          { html: `The mean, ${mean}, because it is the only measure that uses every value, including ${out}.`, why: `The mean does use every value, and that is the problem here: the outlier ${out} drags it to ${mean}, ${low ? 'below' : 'above'} almost all the data.` },
          { html: `The mean, ${mean}, because the mean is always a more accurate center than the median.`, why: 'Neither measure is always better. The best measure is the one closest to a typical value, and here that is the median.' },
          { html: `Neither one, because a data set that has an outlier like ${out} has no real center.`, why: 'Every data set has a center. When there is an outlier, the median still describes a typical value well.' },
        ]
      : [
          { html: `The mean, ${mean}, because the data has no outlier and is balanced, so the mean works.`, ok: true },
          { html: `The median, ${fmt(med)}, because the mean is never a good choice when the data varies.`, why: 'The mean is a fine choice when the data is symmetric with no outliers. It is only misleading when extreme values pull it.' },
          { html: `The maximum, ${Math.max(...vals)}, because it is the biggest value, so it shows how high the data goes.`, why: 'The maximum is one end of the data, not its center.' },
          { html: `The range, ${S.range(vals)}, because it uses the whole data set, from one end all the way to the other.`, why: 'The range measures spread, not center.' },
        ];
    const sh = shuffleOptions(r, opts, 0);
    return {
      type: 'mc',
      skill: 'choose-measure',
      lesson: '2-10',
      title: hard ? 'Mean or median? (harder)' : 'Mean or median?',
      prompt: `<p>Data (${c.what}): ${hl(S.list(vals))}.${hard ? ' Find the mean and the median yourself.' : ` Mean: ${hl(mean)}. Median: ${hl(fmt(med))}.`}</p><p>Which measure of center best describes a <b>typical value</b>, and why?</p>`,
      options: sh.options,
      answer: sh.answer,
      hints: [
        'Look for an outlier: a value far from the rest. An outlier pulls the mean toward it but barely moves the median.',
        hard
          ? `Order the data: ${S.list(S.sorted(vals))}. Then find the mean (sum ÷ ${n}) and the median.`
          : skewed
            ? `The value ${out} is far from the others. Mean = ${mean}, median = ${fmt(med)}. Which one sits among the typical values?`
            : `Ordered: ${S.list(S.sorted(vals))}. No value is far from the rest. Mean = ${mean}, median = ${fmt(med)}.`,
        skewed ? 'Choose the measure that stays among the typical values, not the one the far-off value pulls.' : 'When there is no outlier and the shape is balanced, decide whether the mean is pulled at all.',
      ],
      hintEs: 'Busca un valor atípico: un dato lejos de los demás. Un valor atípico jala la media hacia él, pero casi no mueve la mediana.',
      solution: skewed
        ? `<p>The outlier ${out} pulls the mean ${dir} to ${mean}, ${low ? 'below' : 'above'} ${vals.filter((v) => (low ? v > mean : v < mean)).length} of the ${n} values. The <b>median, ${fmt(med)}</b>, stays in the middle of the typical values, so it describes the center better. Use the median when data has an outlier or is skewed.</p>`
        : `<p>Ordered: ${S.list(S.sorted(vals))}. There is no outlier and the values are balanced around the middle. The <b>mean, ${mean}</b>, describes the center well, and it is close to the median ${fmt(med)}. Use the mean when the data is roughly symmetric with no outliers.</p>`,
      feedback: { correct: skewed ? 'Correct. An outlier drags the mean, so the median is the better choice.' : 'Correct. Symmetric data with no outlier: the mean works well.', wrong: (a) => whyOf(sh, a, 'Check for an outlier, then compare the mean and the median.') },
    };
  });

  // ---------- Compute both and see the pull (blanks) ----------
  G.define('s10_meanVsMedian', (r, o) => {
    const hard = !!o.hard;
    const c = r.pick(CTX),
      n = hard ? r.pick([6, 8]) : r.pick([5, 7]);
    // hard: an even count (median between two values), possibly a low outlier, and a third step: how far the mean moved
    const d = outlierSet(r, n, c, hard);
    const s = S.sorted(d.all);
    const pull = RX.round(Math.abs(d.mean - d.median), 2);
    const fields = [
      { label: 'mean', answer: d.mean, width: 'sm' },
      { label: 'median', answer: d.median, width: 'sm', tolerance: 0.01 },
    ];
    const template = ['Mean = {0}.', 'Median = {1}.'];
    if (hard) {
      fields.push({ label: 'distance between them', answer: pull, width: 'sm', tolerance: 0.01 });
      template.push(`The outlier pulled the mean {2} away from the median.`);
    }
    const ordN = (k) => k + (k === 1 ? 'st' : k === 2 ? 'nd' : k === 3 ? 'rd' : 'th');
    return {
      type: 'blanks',
      skill: 'choose-measure',
      lesson: '2-10',
      title: hard ? 'How far did the mean move?' : 'Which one moved?',
      prompt: `<p>Data (${c.what}): ${hl(S.list(d.all))}.</p><p>Find the mean and the median.${hard ? ' Then find how far apart they are.' : ' Then decide which one the outlier pulled.'}</p>`,
      fields,
      template,
      hints: [
        'Mean: add all the values and divide by the count. Median: order the values and take the middle.',
        `Sum: ${d.all.join(' + ')} = ${S.sum(d.all)}. Divide by ${n}.`,
        n % 2 ? `Ordered: ${S.list(s)}. The middle (${ordN((n + 1) / 2)}) value is the median.` : `Ordered: ${S.list(s)}. Average the ${ordN(n / 2)} and ${ordN(n / 2 + 1)} values for the median${hard ? ', then subtract the smaller measure from the larger' : ''}.`,
      ],
      hintEs: 'Media: suma todos los valores y divide entre la cantidad de datos. Mediana: ordena los valores y toma el del medio.',
      solution: `<p>Mean = ${S.sum(d.all)} ÷ ${n} = <b>${d.mean}</b>. Ordered: ${S.list(s)}; median = <b>${fmt(d.median)}</b>. The outlier ${d.out} pulled the mean <b>${fmt(pull)}</b> ${d.low ? 'below' : 'above'} the median. Most values are near ${fmt(d.median)}, so the median describes a typical value better here.</p>`,
      feedback: {
        correct: `Correct. The outlier ${d.out} moved the mean to ${d.mean} while the median stayed at ${fmt(d.median)}.`,
        wrong(ans, d2) {
          const got = (ans || []).map(RX.parseNum);
          if (d2.wrong.includes(0)) {
            if (got[0] != null && Math.abs(got[0] - S.mean(d.cluster)) < 0.01) return `You left out the outlier. The mean uses all ${n} values, including ${d.out}.`;
            return `Add all ${n} values (including ${d.out}) and divide by ${n}.`;
          }
          if (d2.wrong.includes(1)) return got[1] === d.all[Math.floor(n / 2)] ? 'That is the middle of the list as written. Order the values first.' : `Order the values, then take the middle${n % 2 ? '' : ' two and average them'}.`;
          return 'Subtract the smaller of the mean and median from the larger.';
        },
      },
    };
  });

  // ---------- Sort situations: mean or median (sort) ----------
  G.define('s10_sortSituations', (r, o) => {
    const hard = !!o.hard;
    const ctxs = r.pickN(CTX, 4);
    const items = [];
    // hard: 7 values per set, unordered, and one outlier set has a LOW outlier
    const n = hard ? 7 : 5;
    ctxs.forEach((c, i) => {
      if (i % 2 === 0) {
        const d = hard && i === 2 ? withLowOutlierIntMean(r, n, c.lo, c.hi) : withOutlierIntMean(r, n, c.lo, c.hi);
        items.push({ html: `${c.what}: ${S.list(hard ? d.all : S.sorted(d.all))}`, bin: 1 });
      } else {
        const v = symmetricSet(r, n, r.int(c.lo + 3, c.hi - 3), 3);
        items.push({ html: `${c.what}: ${S.list(hard ? v : S.sorted(v))}`, bin: 0 });
      }
    });
    const extra = r.pick(
      hard
        ? [
            { html: 'Prices of the boats in a harbor where most boats are small and a few are very large', bin: 1 },
            { html: 'Times to swim one lap, where most swimmers are close but one stopped to rest for 5 minutes', bin: 1 },
            { html: 'Shoe sizes of a sixth-grade class, balanced around the middle size', bin: 0 },
            { html: 'Test scores that rise and fall evenly around 80, with no score far from the rest', bin: 0 },
          ]
        : [
            { html: 'Home prices on a street where one house costs ten times the others', bin: 1 },
            { html: 'Heights of sixth graders, all within a few inches of each other', bin: 0 },
            { html: 'Daily temperatures in one week, all between 70°F and 76°F', bin: 0 },
            { html: 'Weekly allowances where one student gets far more than everyone else', bin: 1 },
          ],
    );
    items.push(extra);
    const its = r.shuffle(items);
    return {
      type: 'sort',
      skill: 'choose-measure',
      lesson: '2-10',
      title: hard ? 'Which center fits? (unordered data)' : 'Which center fits?',
      prompt: hard
        ? `<p>Sort each data set by the measure of center that describes it best. The lists are not in order, and an outlier can be very small as well as very large.</p>`
        : `<p>Sort each data set by the measure of center that describes it best.</p><p class="muted">Use the <b>median</b> when a value sits far from the rest (an outlier) or the data is skewed. Use the <b>mean</b> when the data is roughly symmetric with no outlier.</p>`,
      bins: ['Mean works well', 'Median is better'],
      items: its,
      hints: [
        'Scan each list for a value far from the others. That is the sign that the mean will be pulled.',
        hard ? 'Find the smallest and largest value in each list. Is either one far from its nearest neighbor?' : 'Lists where all the values are close together have no outlier, so the mean is fine.',
        hard ? 'An outlier far below the rest pulls the mean down, just as one far above pulls it up. Both call for the median.' : 'Look for number lists that end with a value much larger than the rest. Those need the median.',
      ],
      hintEs: 'Revisa cada lista para buscar un valor lejos de los demás. Esa es la señal de que la media se va a mover.',
      solution: `<p>Sets with one value far ${hard ? 'above or below' : 'above'} the rest are skewed by that outlier, which drags the mean away from the typical values, so the <b>median</b> is better. Sets whose values all sit close together have no outlier, so the <b>mean</b> describes them well.</p>`,
      feedback: {
        correct: 'Correct. Outlier or skew: median. Balanced with no outlier: mean.',
        wrong(ans, d) {
          const it = its[d.wrong[0]];
          const short = it ? it.html.replace(/<[^>]+>/g, '').slice(0, 40) : '';
          if (it && it.bin === 1) return `Look again at "${RX.esc(short)}…". One value is far from the others, so the mean would be pulled toward it.`;
          return `Look again at "${RX.esc(short)}…". Are all its values close together? Then the mean works.`;
        },
      },
    };
  });

  // ---------- Who chose the right measure (who) ----------
  G.define('s10_whoMeasure', (r, o) => {
    const hard = !!o.hard;
    const c = r.pick(CTX),
      [a, b, z] = r.pickN(NAMES, 3),
      n = r.pick([5, 6]);
    // hard: a LOW outlier, the measures are not given, and the wrong reasons are more tempting
    const d = hard ? withLowOutlierIntMean(r, n, c.lo, c.hi) : outlierSet(r, n, c, false);
    const opts = hard
      ? [
          { html: `<b>${a}</b>: "Use the median, ${fmt(d.median)}. The small value ${d.out} pulls the mean down to ${d.mean}."`, ok: true },
          { html: `<b>${b}</b>: "Use the mean, ${d.mean}. A small outlier like ${d.out} can only pull the median, not the mean."`, why: `It is the other way around. The mean uses the size of every value, so ${d.out} drags it down to ${d.mean}. The median barely moves.` },
          { html: `<b>${z}</b>: "Use the mean, ${d.mean}, after rounding. It is close enough to every value in the data set."`, why: `The mean ${d.mean} is below most of the values. It is not close to a typical value at all.` },
        ]
      : [
          { html: `<b>${a}</b>: "Use the median, ${fmt(d.median)}. The value ${d.out} is an outlier that pulls the mean to ${d.mean}."`, ok: true },
          { html: `<b>${b}</b>: "Use the mean, ${d.mean}. It is the most accurate measure because it uses every number."`, why: `Using every number is exactly why the mean is pulled toward ${d.out}. A mean of ${d.mean} is higher than most of the data.` },
          { html: `<b>${z}</b>: "Use the range, ${S.range(d.all)}. It is the only measure that shows the whole data set."`, why: 'The range is a measure of spread. The question asks for a measure of center.' },
        ];
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
        `Ordered: ${S.list(S.sorted(d.all))}. Is any value far from the rest? Find the mean and the median.`,
        'Which measure sits among the typical values? That is the one to report.',
      ],
      hintEs: 'Primero busca un valor atípico. Luego compara la media y la mediana.',
      solution: `<p><b>${a}</b> is correct. The outlier ${d.out} pulls the mean to ${d.mean}, ${d.low ? 'below' : 'above'} most of the values. The median, ${fmt(d.median)}, is a better description of a typical value.${hard ? ' A low outlier pulls the mean down just as a high one pulls it up.' : ' The range measures spread, not center.'}</p>`,
      feedback: { correct: 'Correct. With an outlier, the median is the better measure of center.', wrong: (x) => whyOf(sh, x, 'Check which measure the outlier pulls.') },
    };
  });

  // ---------- Match measures to values (match) ----------
  G.define('s10_matchValues', (r, o) => {
    const hard = !!o.hard;
    const c = r.pick(CTX);
    let vals, f, mean, madV;
    // hard: five measures, including the MAD
    for (let t = 0; t < 4000; t++) {
      vals = hard ? S.withMeanCleanMad(r, 8, r.int(c.lo + 6, c.lo + Math.max(18, c.hi - c.lo)), 9).filter((v) => v >= 0) : S.data(r, 8, c.lo, c.lo + Math.max(24, c.hi - c.lo), true);
      if (vals.length !== 8 || new Set(vals).size !== 8) continue;
      f = S.fiveNum(vals);
      mean = S.mean(vals);
      madV = RX.round(S.mad(vals), 2);
      const set = [mean, f.med, f.max - f.min, f.q3 - f.q1].concat(hard ? [madV] : []);
      if (S.isInt(mean) && S.isInt(f.med) && S.isInt(f.q1) && S.isInt(f.q3) && new Set(set).size === set.length) break;
    }
    const measures = [
      { name: 'Mean', v: mean },
      { name: 'Median', v: f.med },
      { name: 'Range', v: f.max - f.min },
      { name: 'IQR', v: f.q3 - f.q1 },
    ];
    if (hard) measures.push({ name: 'MAD', v: madV });
    const rightOrder = r.shuffle(measures.map((_, i) => i));
    const sv = S.sorted(vals);
    return {
      type: 'match',
      skill: 'center-spread',
      lesson: '2-10',
      title: hard ? 'Match five measures' : 'Match each measure to its value',
      prompt: `<p>Data (${c.what}): ${hl(S.list(hard ? vals : sv))}${hard ? ' (8 values, not in order)' : ' (already ordered, 8 values)'}.</p><p>Match each measure to its value.</p>`,
      left: measures.map((m) => m.name),
      right: rightOrder.map((i) => fmt(measures[i].v)),
      pairs: measures.map((_, i) => [i, rightOrder.indexOf(i)]),
      hints: [
        `Mean: sum ÷ 8. Median: halfway between the 4th and 5th values. Range: max − min. IQR: Q3 − Q1.${hard ? ' MAD: average distance from the mean.' : ''}`,
        `Sum = ${S.sum(vals)}, so the mean is ${S.sum(vals)} ÷ 8.${hard ? ` Ordered: ${S.list(sv)}.` : ` The middle two values are ${sv[3]} and ${sv[4]}.`}`,
        `Lower half: ${S.list(S.halves(vals).lower)}. Upper half: ${S.list(S.halves(vals).upper)}. Find the middle of each half for Q1 and Q3.`,
      ],
      hintEs: `Media: suma ÷ 8. Mediana: punto medio entre el 4.º y el 5.º valor. Rango: máximo − mínimo. Rango intercuartil: Q3 − Q1.${hard ? ' DMA: distancia promedio a la media.' : ''}`,
      solution: `<p>Mean = ${S.sum(vals)} ÷ 8 = <b>${mean}</b>. Median = (${sv[3]} + ${sv[4]}) ÷ 2 = <b>${f.med}</b>. Range = ${f.max} − ${f.min} = <b>${f.max - f.min}</b>. IQR = ${f.q3} − ${f.q1} = <b>${f.q3 - f.q1}</b>.${hard ? ` MAD = ${S.sum(vals.map((v) => Math.abs(v - mean)))} ÷ 8 = <b>${fmt(madV)}</b>.` : ''} Mean and median measure center; range, IQR${hard ? ', and MAD' : ''} measure spread.</p>`,
      feedback: {
        correct: 'Correct. Each measure of center and spread has its own value.',
        wrong(ans, d) {
          const i = d.wrong[0];
          const m = measures[i];
          if (!m) return 'Check each computation again.';
          return `Recheck the ${m.name}. ${{ Mean: 'Add all 8 values and divide by 8.', Median: 'Order the values, then average the 4th and 5th.', Range: 'Subtract the minimum from the maximum.', IQR: 'Find Q1 and Q3 from the two halves, then subtract Q1 from Q3.', MAD: 'Find each distance from the mean, add them, and divide by 8.' }[m.name]}`;
        },
      },
    };
  });

  // ---------- Pair center with spread (mc) ----------
  G.define('s10_pairSpread', (r, o) => {
    const hard = !!o.hard;
    const c = r.pick(CTX),
      name = r.pick(NAMES),
      center = r.pick(['median', 'mean']);
    const vals = center === 'median' ? outlierSet(r, 6, c, hard).all : symmetricSet(r, 6, r.int(c.lo + 3, c.hi - 3), 3);
    const want = center === 'median' ? 'IQR' : 'MAD';
    let opts;
    if (hard) {
      // the student decides BOTH the center and the spread from the data alone
      const pairs = { median: 'the median with the IQR', mean: 'the mean with the MAD' };
      opts = [
        { html: `Report ${pairs[center]}, because the data ${center === 'median' ? 'has an outlier' : 'is balanced with no outlier'}.`, ok: true },
        { html: `Report ${pairs[center === 'median' ? 'mean' : 'median']}, because the data ${center === 'median' ? 'has an outlier' : 'is balanced with no outlier'}.`, why: center === 'median' ? 'An outlier pulls the mean, and the MAD is measured from that pulled mean. Use the median with the IQR.' : 'With no outlier, the mean works well, and the MAD goes with the mean.' },
        { html: `Report the ${center} with the ${center === 'median' ? 'MAD' : 'IQR'}, because the data ${center === 'median' ? 'has an outlier' : 'is balanced with no outlier'}.`, why: 'Mix-and-match pairs do not fit. The IQR is built from medians; the MAD is built from the mean.' },
        { html: `Report the mean with the range, because together they use every value in the set.`, why: 'The range only uses the two end values, and it is stretched by any outlier. Pair the mean with the MAD.' },
      ];
    } else
      opts = [
        {
          html: center === 'median' ? 'The IQR, because it is built from quartiles, which are the medians of the halves.' : 'The MAD, because it measures the average distance of each value from the mean.',
          ok: true,
        },
        {
          html: center === 'median' ? 'The MAD, because it is the most precise spread and it uses every value in the set.' : 'The IQR, because it uses the middle half and ignores any values at the two ends.',
          why: center === 'median' ? 'The MAD is measured from the mean. When the center is the median, the matching spread is the IQR, which is also based on position in the ordered data.' : 'The IQR is based on medians (quartiles). When the center is the mean, the matching spread is the MAD, which measures distance from the mean.',
        },
        { html: 'The mode, because it is the one value that shows up most often in the whole data set.', why: 'The mode is a kind of center, not a measure of spread.' },
        { html: 'The maximum, because it is the largest value and shows how far out the data can reach.', why: 'The maximum is a single value, not a measure of how spread out the data is.' },
      ];
    const sh = shuffleOptions(r, opts, 0);
    return {
      type: 'mc',
      skill: 'center-spread',
      lesson: '2-10',
      title: hard ? 'Choose center and spread' : 'Pair center with spread',
      prompt: hard
        ? `<p>${name} looked at ${c.what}: ${hl(S.list(vals))}.</p><p>Which <b>pair of measures</b> should ${name} report, and why?</p>`
        : `<p>${name} looked at ${c.what}: ${hl(S.list(vals))}.</p><p>${name} decided to report the <b>${center}</b> as the measure of center${center === 'median' ? ' because of the outlier' : ' because the data is balanced with no outlier'}. Which measure of <b>spread</b> should go with it?</p>`,
      options: sh.options,
      answer: sh.answer,
      hints: [
        hard ? 'First decide the center: is there an outlier? Then pick the spread that is built from that center.' : 'Each measure of spread is built from one measure of center. Match them by how they are computed.',
        'The IQR comes from quartiles, which are medians of the halves. The MAD is the average distance from the mean.',
        hard ? 'Outlier: the median and its partner. No outlier: the mean and its partner.' : `Which spread is built from the ${center}?`,
      ],
      hintEs: hard
        ? 'Primero decide el centro: ¿hay un valor atípico? Luego elige la medida de dispersión que se calcula con ese centro.'
        : 'Cada medida de dispersión se calcula con una medida de tendencia central. Emparéjalas según cómo se calculan.',
      solution: `<p>${hard ? `The data ${center === 'median' ? 'has an outlier, so the center is the median' : 'is balanced with no outlier, so the center is the mean'}. ` : ''}Report the <b>${want}</b> with the ${center}. ${center === 'median' ? 'The IQR is Q3 − Q1, and the quartiles are medians of the halves, so it is not pulled by the outlier either.' : 'The MAD measures the average distance from the mean, so it belongs with the mean.'} Pair median with IQR, and mean with MAD.</p>`,
      feedback: { correct: `Correct. ${center === 'median' ? 'Median goes with IQR.' : 'Mean goes with MAD.'}`, wrong: (a) => whyOf(sh, a, 'Pair median with IQR, and mean with MAD.') },
    };
  });

  // ---------- Fill in the report (cloze) ----------
  G.define('s10_clozeReport', (r, o) => {
    const hard = !!o.hard;
    const c = r.pick(CTX),
      skewed = r.chance(0.6),
      n = hard ? r.pick([6, 7]) : r.pick([5, 6]);
    let vals, extra;
    if (skewed) {
      const d = outlierSet(r, n, c, hard);
      vals = d.all;
      extra = d.out;
    } else {
      vals = symmetricSet(r, n, r.int(c.lo + 3, c.hi - 3), 3);
    }
    const s = S.sorted(vals);
    // hard: unordered data, no hint about which value is far away, and one more spread choice
    const shapeChoices = r.shuffle(['has an outlier', 'has no outlier']);
    const centerChoices = r.shuffle(['median', 'mean']);
    const spreadChoices = r.shuffle(hard ? ['IQR', 'MAD', 'range', 'maximum'] : ['IQR', 'MAD', 'range']);
    return {
      type: 'cloze',
      skill: 'center-spread',
      lesson: '2-10',
      title: hard ? 'Complete the report (no clues)' : 'Complete the report',
      prompt: `<p>Data (${c.what}): ${hl(S.list(hard ? vals : s))}.</p><p>Complete the surveyor's report.</p>`,
      template: hard
        ? 'The data set {0}, so the best measure of center is the {1}, paired with the {2} as the measure of spread.'
        : `The data set {0}${skewed ? ` (the value ${extra} is far from the rest)` : ' (the values are close together)'}, so the best measure of center is the {1}, paired with the {2} as the measure of spread.`,
      choices: [shapeChoices, centerChoices, spreadChoices],
      answers: [shapeChoices.indexOf(skewed ? 'has an outlier' : 'has no outlier'), centerChoices.indexOf(skewed ? 'median' : 'mean'), spreadChoices.indexOf(skewed ? 'IQR' : 'MAD')],
      hints: [
        'Start with the shape: is any value far from the rest?',
        hard ? `Order the data: ${S.list(s)}. Look at the gaps at each end.` : skewed ? `${extra} is far from the other values, so the mean would be pulled toward it.` : 'All the values are close together with no outlier, so nothing pulls the mean.',
        'Pair median with IQR, and mean with MAD.',
      ],
      hintEs: 'Empieza con la forma: ¿hay algún valor lejos de los demás?',
      solution: `<p>The data <b>${skewed ? 'has an outlier' : 'has no outlier'}</b>. ${skewed ? `The value ${extra} would pull the mean, so report the <b>median</b> with the <b>IQR</b>.` : 'The values are balanced, so report the <b>mean</b> with the <b>MAD</b>.'} Center and spread are chosen together: median with IQR, mean with MAD.</p>`,
      feedback: {
        correct: 'Correct. Shape decides the center, and the center decides the spread.',
        wrong(ans, d) {
          if (d.wrong.includes(0)) return skewed ? `Is ${extra} close to the other values? Look at the gap.` : 'Are any values far from the rest? If not, there is no outlier.';
          if (d.wrong.includes(1)) return skewed ? 'An outlier pulls the mean. Which center is not pulled?' : 'With no outlier, the mean is a good choice.';
          const pick = spreadChoices[(ans || [])[2]];
          if (pick === 'range' || pick === 'maximum') return `The ${pick} only looks at the end of the data. Median pairs with IQR; mean pairs with MAD.`;
          return 'Median pairs with IQR. Mean pairs with MAD.';
        },
      },
    };
  });

  // ---------- Explain your choice (cr) ----------
  G.define('s10_crChoose', (r, o) => {
    const hard = !!o.hard;
    const c = r.pick(CTX),
      n = r.pick([5, 6]);
    const d = outlierSet(r, n, c, hard);
    const dir = d.low ? 'down' : 'up';
    const sh = shuffleOptions(
      r,
      [
        { html: `The median, because the outlier ${d.out} pulls the mean ${dir} to ${d.mean}, ${d.low ? 'lower' : 'higher'} than most of the values.`, ok: true },
        { html: `The mean, because ${d.mean} is ${d.mean > d.median ? 'larger' : 'smaller'} than ${fmt(d.median)}.` },
        { html: 'The mean, because the median only uses one value.' },
        { html: `The range, because the data is spread out.` },
      ],
      0,
    );
    return {
      type: 'cr',
      skill: 'choose-measure',
      lesson: '2-10',
      title: hard ? 'Defend your choice (compute first)' : 'Defend your choice',
      prompt: hard
        ? `<p>Data (${c.what}): ${hl(S.list(d.all))}.</p><p>Find the mean and the median. Which would you report as the measure of center, and <b>why</b>? Use both numbers in your answer.</p>`
        : `<p>Data (${c.what}): ${hl(S.list(d.all))}. Mean: ${hl(d.mean)}. Median: ${hl(fmt(d.median))}.</p><p>Which measure of center would you report, and <b>why</b>? Mention the outlier in your answer.</p>`,
      starters: ['I would report the … because…', hard ? 'The mean is … and the median is …, so…' : `The value ${d.out} is an outlier, so…`, 'The mean is pulled… while the median…'],
      minWords: 12,
      check: { prompt: 'Which choice is best?', options: sh.options, answer: sh.answer },
      hints: [
        'Find the value that is far from the rest. Then compare the mean and the median: which one is close to most of the values?',
        hard ? `Mean: ${S.sum(d.all)} ÷ ${n}. Median: order the values and find the middle.` : `${d.out} is the outlier. Compare the mean ${d.mean} and the median ${fmt(d.median)} with the other values.`,
        'Say which measure you chose, name the outlier, and explain how it affects the mean.',
      ],
      hintEs: 'Busca el valor que está lejos de los demás. Luego compara la media y la mediana: ¿cuál está cerca de la mayoría de los valores?',
      solution: `<p>Report the <b>median, ${fmt(d.median)}</b>. The value ${d.out} is an outlier. It pulls the mean ${dir} to ${d.mean}, ${d.low ? 'lower' : 'higher'} than most of the data, so the mean no longer describes a typical value. The median is not pulled by one far-off value.</p>`,
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
   five-number summaries from raw dots, decimal data, display choice, and reasoning about box plots and histograms.
   Quartile convention (Reveal / district): when n is odd the median is left out of both halves (RX.STATS.halves). */
(function (root) {
  'use strict';
  const RX = root.RX;
  const { G, V, shuffleOptions, NAMES, fmt, round } = RX;
  const S = RX.STATS;
  const hl = V.hl;
  const TEAMS = ['Tide Runners', 'Salt Hawks', 'Reef Rays', 'Dune Foxes', 'Marsh Herons', 'Grotto Gulls'];
  const near = (a, b, tol) => a != null && b != null && Math.abs(a - b) < (tol || 0.001);
  const ord = (k) => k + (k % 10 === 1 && k !== 11 ? 'st' : k % 10 === 2 && k !== 12 ? 'nd' : k % 10 === 3 && k !== 13 ? 'rd' : 'th');
  const whyOf = (opts, i, fallback) => (opts[i] && opts[i].why) || fallback;
  const sameOrder = (a, b) => a.length === b.length && a.every((v, i) => v === b[i]);

  // ---------- Missing score so two teams share a mean (num) ----------
  G.define('sc_twoGames', (r, o) => {
    const hard = !!o.hard;
    // hard: six games, two still to play with the same score each, so the needed total must be split in two
    const [tA, tB] = r.pickN(TEAMS, 2),
      m = r.int(14, 30),
      n = hard ? 6 : 5,
      left = hard ? 2 : 1;
    let a, b, x, need;
    for (let t = 0; t < 120; t++) {
      a = S.withMean(r, n, m, 6);
      b = S.withMean(r, n - left, m + r.pick([-3, -2, -1, 1, 2, 3]), 6);
      need = m * n - S.sum(b);
      if (need % left) continue;
      x = need / left;
      if (x > 0 && x !== m && x <= m + 14 && !b.includes(x)) break;
    }
    const played = n - left;
    return {
      type: 'num',
      skill: 'target-mean',
      lesson: 'Unit 2',
      title: hard ? 'Match the other team (two games left)' : 'Match the other team',
      prompt: hard
        ? `<p>The ${tA} scored ${hl(S.list(a))} points in ${n} games.</p><p>The ${tB} scored ${hl(S.list(b))} in their first ${played} games. They scored the <b>same number of points</b> in each of their last 2 games. After game ${n}, the two teams had <b>exactly the same mean</b>.</p><p>How many points did the ${tB} score in <b>each</b> of the last 2 games?</p>`
        : `<p>The ${tA} scored ${hl(S.list(a))} points in ${n} games.</p><p>The ${tB} scored ${hl(S.list(b))} in their first ${played} games. After game ${n}, the two teams had <b>exactly the same mean</b>.</p><p>How many points did the ${tB} score in game ${n}?</p>`,
      unit: 'points',
      answer: x,
      hints: [
        `Find the ${tA}' mean first: add the ${n} scores and divide by ${n}. Then think in totals for the ${tB}.`,
        `${tA} mean: ${S.sum(a)} ÷ ${n} = ${m}. For the ${tB} to average ${m} over ${n} games, their total must be ${m} × ${n} = ${m * n}.`,
        hard
          ? `${tB} total so far: ${S.sum(b)}. Find ${m * n} − ${S.sum(b)}, the points still needed, then split them equally between the 2 games.`
          : `${tB} total so far: ${S.sum(b)}. Game ${n} must be ${m * n} − ${S.sum(b)}.`,
      ],
      hintEs: `Primero halla la media de los ${tA}: suma los ${n} puntajes y divide entre ${n}. Luego piensa en los totales de los ${tB}.`,
      solution: hard
        ? `<p>${tA} mean = ${S.sum(a)} ÷ ${n} = ${m}. For the ${tB} to match it, their ${n} games must total ${m} × ${n} = ${m * n}. They have ${S.sum(b)} so far, so the last 2 games need ${m * n} − ${S.sum(b)} = ${need} points. Split equally: ${need} ÷ 2 = <b>${x}</b> points per game. Check: (${S.sum(b)} + ${x} + ${x}) ÷ ${n} = ${m}.</p>`
        : `<p>${tA} mean = ${S.sum(a)} ÷ ${n} = ${m}. For the ${tB} to match it, their ${n} games must total ${m} × ${n} = ${m * n}. They have ${S.sum(b)} so far, so game ${n} must be ${m * n} − ${S.sum(b)} = <b>${x}</b> points. Check: (${S.sum(b)} + ${x}) ÷ ${n} = ${m}.</p>`,
      feedback: {
        correct: `Correct. Both teams end with a total of ${m * n} and a mean of ${m}.`,
        wrong(ans, d) {
          const v = d.value;
          if (v === m) return `${m} is the mean the ${tB} want. Scoring the mean only works if they are already at it. Work with totals.`;
          if (v === m * n) return `${m * n} is the total they need for all ${n} games. Subtract what they already have.`;
          if (hard && v === need) return `${need} is the points needed for both games together. Each game gets half of it.`;
          if (v != null && near(v, S.mean(b))) return `That is the ${tB}' mean so far. Find the total they need for ${n} games, then subtract their current total.`;
          return `Target total: ${m} × ${n} = ${m * n}. Subtract the ${tB}' current total, ${S.sum(b)}${hard ? ', then split what is left between 2 games' : ''}.`;
        },
      },
    };
  });

  // ---------- Five-number summary from a dot plot (blanks) ----------
  G.define('sc_boxFromDots', (r, o) => {
    const hard = !!o.hard;
    const c = r.pick([
      { label: 'Crabs per trap', unit: 'crabs', lo: 2, hi: 13 },
      { label: 'Minutes per dive', unit: 'minutes', lo: 5, hi: 16 },
      { label: 'Shells per bucket', unit: 'shells', lo: 1, hi: 12 },
    ]);
    // hard: many more dots, and an even count is possible, so the median can fall between two values
    const n = hard ? r.pick([14, 15, 18, 19]) : r.pick([7, 11]);
    let vals, f;
    for (let t = 0; t < 80; t++) {
      vals = S.shaped(r, r.pick(['symmetric', 'skewed right', 'skewed left']), c.lo, c.hi, n);
      f = S.fiveNum(vals);
      if (f.q1 < f.med && f.med < f.q3 && f.min < f.q1 && f.q3 < f.max) break;
    }
    const s = S.sorted(vals),
      h = S.halves(vals),
      hn = h.lower.length,
      even = n % 2 === 0,
      mid = (hn + 1) / 2;
    const q1Incl = even ? null : S.median(s.slice(0, (n + 1) / 2));
    return {
      type: 'blanks',
      skill: 'box-plot',
      lesson: 'Unit 2',
      title: hard ? 'From many dots to a box plot' : 'From dots to a box plot',
      prompt: hard
        ? `<p>The dot plot shows ${c.label.toLowerCase()} from a set of surveys. Count the dots yourself.</p>${V.dotPlot({ values: vals, min: c.lo, max: c.hi, label: c.label, aria: 'Dot plot: ' + S.list(s) })}<p>Find the five-number summary you would use to draw a box plot of this data. A value may be a decimal.</p>`
        : `<p>The dot plot shows ${c.label.toLowerCase()} for ${n} surveys.</p>${V.dotPlot({ values: vals, min: c.lo, max: c.hi, label: c.label, aria: 'Dot plot: ' + S.list(s) })}<p>Find the five-number summary you would use to draw a box plot of this data.</p>`,
      fields: [
        { label: 'Minimum', answer: f.min, width: 'sm' },
        { label: 'Q1', answer: f.q1, width: 'sm', tolerance: 0.01 },
        { label: 'Median', answer: f.med, width: 'sm', tolerance: 0.01 },
        { label: 'Q3', answer: f.q3, width: 'sm', tolerance: 0.01 },
        { label: 'Maximum', answer: f.max, width: 'sm' },
      ],
      hints: [
        `Read the dots left to right to list the values in order. Repeated dots are repeated values.`,
        even
          ? `There are ${n} dots (an even number). The median is the mean of the ${ord(n / 2)} and ${ord(n / 2 + 1)} values. Split the values into two halves of ${hn}.`
          : `There are ${n} dots. The median is the ${ord((n + 1) / 2)} value. Leave it out and split the rest into two halves of ${hn}.`,
        `Each half has ${hn} values, so Q1 is the ${ord(mid)} value counting from the left and Q3 is the ${ord(mid)} value counting from the right.`,
      ],
      hintEs: 'Lee los puntos de izquierda a derecha para hacer la lista de los valores en orden. Los puntos repetidos son valores repetidos.',
      solution: `<p>Ordered data (${n} values): ${S.list(s)}. Minimum <b>${f.min}</b>, maximum <b>${f.max}</b>, median <b>${fmt(f.med)}</b>. Lower half ${S.list(h.lower)} → Q1 = <b>${fmt(f.q1)}</b>; upper half ${S.list(h.upper)} → Q3 = <b>${fmt(f.q3)}</b>. ${even ? `With ${n} values (even), the halves split evenly and the median is the mean of the two middle values.` : `The median is left out of both halves because ${n} is odd.`}</p>${V.boxPlot({ plots: [Object.assign({ showValues: true }, f)], lineMin: c.lo, lineMax: c.hi, step: 1, width: 440, aria: `Box plot: min ${f.min}, Q1 ${fmt(f.q1)}, median ${fmt(f.med)}, Q3 ${fmt(f.q3)}, max ${f.max}` })}`,
      feedback: {
        correct: 'Correct. A dot plot gives every value; the five-number summary condenses them into a box plot.',
        wrong(ans, d) {
          const got = (ans || []).map(RX.parseNum);
          const w = d.wrong || [];
          if (w.includes(2)) {
            if (even && (got[2] === s[n / 2 - 1] || got[2] === s[n / 2])) return `With ${n} values there are two middle values, ${s[n / 2 - 1]} and ${s[n / 2]}. The median is their mean.`;
            return `Count the dots: ${n} in all. ${even ? `The median is between the ${ord(n / 2)} and ${ord(n / 2 + 1)} dots.` : `The median is the ${ord((n + 1) / 2)} dot from the left.`}`;
          }
          if (w.includes(1) || w.includes(3)) {
            if (!even && near(got[1], q1Incl, 0.01) && q1Incl !== f.q1) return `Your lower half included the median. With ${n} values, leave the median out, so each half has ${hn} values.`;
            if (got[1] === f.min || got[3] === f.max) return 'Q1 and Q3 are not the smallest and largest values. They are the middles of the two halves.';
            return `Find the middle of each half. Each half has ${hn} values, so its middle is the ${ord(mid)} one.`;
          }
          return 'The minimum and maximum are the leftmost and rightmost dots.';
        },
      },
    };
  });

  // ---------- Mean of decimal data (num) ----------
  G.define('sc_decimalMean', (r, o) => {
    const hard = !!o.hard;
    const c = r.pick([
      { what: 'masses of crabs in kilograms', unit: 'kg', m: [1.2, 3.8] },
      { what: 'kilometers kayaked each day', unit: 'km', m: [3.5, 9.5] },
      { what: 'lengths of seaweed strands in meters', unit: 'm', m: [1.5, 4.5] },
      { what: 'liters of water sampled per site', unit: 'liters', m: [2.5, 7.5] },
    ]);
    // hard: six values in hundredths, so the sum and the quotient both carry two decimal places
    const n = hard ? 6 : r.pick([4, 5]),
      scale = hard ? 100 : 10,
      spread = hard ? 60 : 9;
    const m = round(r.int(Math.round(c.m[0] * scale), Math.round(c.m[1] * scale)) / scale, 2);
    let vals;
    for (let t = 0; t < 120; t++) {
      const dev = [];
      for (let i = 0; i < n - 1; i++) dev.push(r.int(-spread, spread));
      const last = -S.sum(dev);
      if (Math.abs(last) > spread) continue;
      dev.push(last);
      vals = r.shuffle(dev.map((d) => round(m + d / scale, 2)));
      if (new Set(vals).size >= 3 && vals.every((v) => v > 0)) break;
    }
    const total = round(S.sum(vals), 2);
    const D = (x) => fmt(round(x, 2));
    const med = S.median(vals);
    return {
      type: 'num',
      skill: 'mean',
      lesson: 'Unit 2',
      title: hard ? 'Mean of decimal data (hundredths)' : 'Mean of decimal data',
      prompt: `<p>A surveyor recorded ${c.what}: ${hl(vals.map(D).join(', '))}.</p><p>What is the <b>mean</b>? Give your answer as a decimal${hard ? ' to the hundredths place' : ''}.</p>`,
      unit: c.unit,
      answer: m,
      tolerance: 0.001,
      hints: [
        'Mean = sum ÷ count. Line up the decimal points when you add, then divide the decimal sum by the whole number of values.',
        `Sum: ${vals.map(D).join(' + ')} = ${D(total)}.`,
        `Mean = ${D(total)} ÷ ${n}. Place the decimal point in the quotient above the point in ${D(total)}.`,
      ],
      hintEs: 'Media = suma ÷ cantidad de datos. Alinea los puntos decimales al sumar. Luego divide la suma decimal entre la cantidad de datos.',
      solution: `<p>Sum: ${vals.map(D).join(' + ')} = ${D(total)}. Mean = ${D(total)} ÷ ${n} = <b>${D(m)}</b> ${c.unit}. Check: ${D(m)} × ${n} = ${D(total)}. Finding a mean of decimal data is a decimal division: the sum divided by the count.</p>`,
      feedback: {
        correct: `Correct. ${D(total)} shared equally among ${n} is ${D(m)}.`,
        wrong(ans, d) {
          const v = d.value;
          if (near(v, total)) return `${D(total)} is the sum. Divide by ${n}.`;
          if (near(v, m * 10) || near(v, m / 10)) return 'Your digits are right, but check the decimal point: the mean must be between the smallest and largest values.';
          if (near(v, total / (n - 1), 0.01)) return `You divided by ${n - 1}. Count the values again: there are ${n}.`;
          if (near(v, med) && !near(med, m)) return 'That is the median. The mean adds all the values and divides by the count.';
          return `Add the ${n} values carefully (line up the decimal points), then divide by ${n}.`;
        },
      },
    };
  });

  // ---------- Which display answers the question (mc) ----------
  G.define('sc_whichDisplay', (r, o) => {
    const hard = !!o.hard;
    const name = r.pick(NAMES);
    const Q = r.pick([
      {
        ask: `How many days had <b>exactly</b> ${r.int(4, 9)} ships?`,
        best: 'dot',
        why: { hist: 'A histogram groups values into intervals, so you cannot see how many had one exact value.', box: 'A box plot shows only five summary numbers. It hides the individual values.' },
      },
      {
        ask: 'Which value appears <b>most often</b>?',
        best: 'dot',
        why: { hist: 'A histogram shows which interval has the most values, not which single value.', box: 'A box plot does not show how often any value appears.' },
      },
      {
        ask: 'What are the <b>median and the quartiles</b>, read straight from the display?',
        best: 'box',
        why: {
          dot: 'You could count dots to find the median, but a box plot marks the median and quartiles directly.',
          hist: 'A histogram hides individual values inside intervals, so the exact median cannot be read.',
        },
      },
      {
        ask: 'About what <b>percent</b> of the values are above Q3?',
        best: 'box',
        why: { dot: 'A dot plot does not mark the quartiles. A box plot splits the data into quarters.', hist: 'A histogram shows interval counts, not quartiles.' },
      },
      {
        ask: `A set of ${r.pick([60, 80, 100])} values ranges from 0 to ${r.pick([49, 59, 79])}. Which display groups them into <b>intervals</b> so the overall shape is easy to see?`,
        best: 'hist',
        why: {
          dot: 'A dot plot with that many values across that wide a range would be very crowded; a histogram groups them into bars.',
          box: 'A box plot shows the spread in quarters but not the shape across intervals.',
        },
      },
      {
        ask: `How many values fall <b>between ${r.pick([10, 20])} and ${r.pick([29, 39])}</b> for a large data set?`,
        best: 'hist',
        why: { dot: 'A dot plot shows every value, which works for small sets, but a histogram counts each interval directly.', box: 'A box plot does not show counts for a chosen interval.' },
      },
    ]);
    const names = { dot: 'Dot plot', hist: 'Histogram', box: 'Box plot' };
    // property phrases are kept close in length so the right option is not given away by size
    const props = { dot: 'it shows every single data value as its own dot', hist: 'it counts how many values are in each interval', box: 'it marks the minimum, Q1, median, Q3, and maximum' };
    const others = ['dot', 'hist', 'box'].filter((k) => k !== Q.best);
    let opts;
    if (hard) {
      // hard: every option pairs a display with a reason; one option names the right display for the wrong reason
      const swap = r.pick(others);
      opts = [
        { html: `${names[Q.best]}, because ${props[Q.best]}.`, ok: true },
        {
          html: `${names[Q.best]}, because ${props[swap]}.`,
          why: `${names[Q.best]} is the right display, but the reason is wrong: ${props[swap].replace(/^it /, 'a ' + names[swap].toLowerCase() + ' ')}, not a ${names[Q.best].toLowerCase()}.`,
        },
        ...others.map((k) => ({ html: `${names[k]}, because ${props[k]}.`, why: Q.why[k] })),
      ];
    } else opts = ['dot', 'hist', 'box'].map((k) => (k === Q.best ? { html: names[k], ok: true } : { html: names[k], why: Q.why[k] }));
    const sh = shuffleOptions(
      r,
      opts,
      opts.findIndex((x) => x.ok),
    );
    const because = {
      dot: 'a dot plot shows every single data value',
      hist: 'a histogram counts how many values fall in each interval',
      box: 'a box plot marks the minimum, Q1, median, Q3, and maximum',
    }[Q.best];
    return {
      type: 'mc',
      skill: 'center-spread',
      lesson: 'Unit 2',
      title: hard ? 'Choose the display and the reason' : 'Choose the display',
      prompt: `<p>${name} wants to answer this question about a data set:</p><p>${hl('Question')}: ${Q.ask}</p><p>${hard ? 'Which display is the <b>best</b> choice, and for the right reason?' : 'Which data display is the <b>best</b> choice?'}</p>`,
      options: sh.options,
      answer: sh.answer,
      hints: [
        'Think about what each display keeps and what it hides. Dot plot: every value. Histogram: counts per interval. Box plot: five summary numbers.',
        'Ask: does the question need individual values, interval counts, or the quartiles?',
        hard
          ? 'Decide which kind of information the question needs. Then check that the reason matches what that display really shows.'
          : 'Decide which kind of information the question needs, then pick the display that keeps it.',
      ],
      hintEs: 'Piensa en lo que cada gráfica muestra y lo que esconde. Diagrama de puntos: cada dato. Histograma: cuántos datos hay en cada intervalo. Diagrama de caja: cinco números del resumen.',
      solution: `<p><b>${names[Q.best]}</b>, because ${because}. ${Object.keys(Q.why)
        .map((k) => `${names[k]}: ${Q.why[k]}`)
        .join(' ')}</p>`,
      feedback: {
        correct: `Correct. ${names[Q.best]}: ${because}.`,
        wrong(ans) {
          return whyOf(sh.options, ans, 'Match the question to the display: single values (dot plot), interval counts (histogram), or quartiles (box plot).');
        },
      },
    };
  });

  // ---------- Mean and median, with and without an outlier (table) ----------
  G.define('sc_outlierBoth', (r, o) => {
    const hard = !!o.hard;
    const c = r.pick([
      { what: 'minutes each tide-pool tour lasted', unit: 'minutes', m: [20, 35] },
      { what: 'fish counted per net', unit: 'fish', m: [8, 18] },
      { what: 'visitors per hour at the grotto', unit: 'visitors', m: [10, 24] },
    ]);
    // hard: more values, decimal means, the outlier may be LOW, and a third row asks how far each measure moved
    const n = hard ? r.pick([9, 11]) : r.pick([6, 8]),
      m = r.int(c.m[0], c.m[1]);
    let cluster, out, all;
    for (let t = 0; t < 80; t++) {
      cluster = S.withMean(r, n - 1, m, 4);
      if (hard) {
        // nudge the cluster so its mean is not whole but still ends in tenths
        cluster[r.int(0, n - 2)] += r.int(1, 3);
        for (let k = 0; k < 12 && ((S.sum(cluster) * 10) % (n - 1) !== 0 || S.sum(cluster) % (n - 1) === 0); k++) cluster[k % (n - 1)] += 1;
      }
      const sum = S.sum(cluster);
      const low = hard && Math.min(...cluster) > 24 && r.chance(0.5);
      out = low ? Math.min(...cluster) - r.int(14, 20) : Math.max(...cluster) + r.int(12, 20);
      while (((sum + out) * (hard ? 10 : 1)) % n !== 0) out += low ? -1 : 1;
      all = r.shuffle(cluster.concat([out]));
      if (new Set(cluster).size >= 3 && out > 0 && (!hard || (S.sum(cluster) * 10) % (n - 1) === 0)) break;
    }
    const meanWith = round(S.mean(all), 2),
      meanWithout = round(S.mean(cluster), 2),
      medWith = S.median(all),
      medWithout = S.median(cluster);
    const dMean = round(Math.abs(meanWith - meanWithout), 2),
      dMed = round(Math.abs(medWith - medWithout), 2);
    const rows = [
      ['', 'Mean', 'Median'],
      ['With the outlier', '__IN:a__', '__IN:b__'],
      ['Without the outlier', '__IN:c__', '__IN:d__'],
    ];
    const inputs = [
      { id: 'a', answer: meanWith, tolerance: 0.01 },
      { id: 'b', answer: medWith, tolerance: 0.01 },
      { id: 'c', answer: meanWithout, tolerance: 0.01 },
      { id: 'd', answer: medWithout, tolerance: 0.01 },
    ];
    if (hard) {
      rows.push(['How much it changed', '__IN:e__', '__IN:f__']);
      inputs.push({ id: 'e', answer: dMean, tolerance: 0.01 }, { id: 'f', answer: dMed, tolerance: 0.01 });
    }
    return {
      type: 'table',
      skill: 'choose-measure',
      lesson: 'Unit 2',
      title: hard ? 'How far did each measure move?' : 'Which measure moved more?',
      prompt: hard
        ? `<p>Data (${c.what}): ${hl(S.list(all))}. One value is an outlier: find it.</p><p>Complete the table with and without the outlier, then find how much each measure changed. Means and medians may be decimals.</p>`
        : `<p>Data (${c.what}): ${hl(S.list(all))}. The value ${hl(out)} is an outlier.</p><p>Complete the table with and without the outlier. Then notice which measure moved more.${Number.isInteger(medWith) && Number.isInteger(medWithout) ? '' : ' A median may be a decimal.'}</p>`,
      rows,
      header: true,
      rowHeader: true,
      inputs,
      hints: [
        `${hard ? 'The outlier is the value far from all the others. ' : ''}Mean: sum ÷ count. Median: order the values and find the middle. Do each twice: once with all the values, once without the outlier.`,
        hard
          ? `The outlier is ${out}. With: ${S.sum(all)} ÷ ${n}; ordered ${S.list(S.sorted(all))}. Without: ${S.sum(cluster)} ÷ ${n - 1}; ordered ${S.list(S.sorted(cluster))}.`
          : `With: sum ${S.sum(all)} ÷ ${n} = ${fmt(meanWith)}; ordered ${S.list(S.sorted(all))}. Without: sum ${S.sum(cluster)} ÷ ${n - 1} = ${fmt(meanWithout)}.`,
        hard
          ? `Find each median from the ordered lists (${n % 2 ? `${n} values: the middle one; ${n - 1} values: the mean of the two middle ones` : `${n} values: the mean of the two middle ones; ${n - 1} values: the middle one`}). Then subtract to see how far each measure moved.`
          : `Medians: with the outlier, ${fmt(medWith)}; without, ${fmt(medWithout)}. Compare how far each measure moved.`,
      ],
      hintEs: `${hard ? 'El valor atípico es el que está muy lejos de los demás. ' : ''}Media: suma ÷ cantidad de datos. Mediana: ordena los valores y halla el del medio. Haz cada una dos veces: una con todos los valores y otra sin el valor atípico.`,
      solution: `<p>With the outlier ${out}: mean ${S.sum(all)} ÷ ${n} = <b>${fmt(meanWith)}</b>, median <b>${fmt(medWith)}</b>. Without it: mean ${S.sum(cluster)} ÷ ${n - 1} = <b>${fmt(meanWithout)}</b>, median <b>${fmt(medWithout)}</b>. The mean moved by <b>${fmt(dMean)}</b>; the median moved only <b>${fmt(dMed)}</b>. The outlier pulls the mean toward it, which is why the median is the better center for this data.</p>`,
      feedback: {
        correct: `Correct. The mean moved ${fmt(dMean)}; the median moved only ${fmt(dMed)}.`,
        wrong(ans, d) {
          const g = (id) => RX.parseNum((ans || {})[id]);
          const w = d.wrong || [];
          if (w.includes('a')) {
            if (near(g('a'), medWith, 0.01)) return 'That is the median. The mean adds all the values and divides by the count.';
            if (near(g('a'), S.sum(all) / (n - 1), 0.01)) return `With the outlier there are ${n} values. Divide ${S.sum(all)} by ${n}, not ${n - 1}.`;
            return `With the outlier: add all ${n} values (${S.sum(all)}) and divide by ${n}.`;
          }
          if (w.includes('c')) {
            if (near(g('c'), S.sum(cluster) / n, 0.01)) return `Without the outlier only ${n - 1} values are left. Divide by ${n - 1}.`;
            return `Without ${out}: add the other ${n - 1} values (${S.sum(cluster)}) and divide by ${n - 1}.`;
          }
          if (w.includes('b'))
            return n % 2 ? `With all ${n} values the median is the ${ord((n + 1) / 2)} value in order. Order them first.` : `Order all ${n} values and find the mean of the two in the middle.`;
          if (w.includes('d'))
            return n % 2 ? `Without the outlier there are ${n - 1} values: find the mean of the two middle values.` : `Without the outlier there are ${n - 1} values: the median is the middle one.`;
          return 'Subtract the smaller value from the larger one in each column to see how far each measure moved.';
        },
      },
    };
  });

  // ---------- Order by MAD when the means and ranges match (seq) ----------
  G.define('sc_seqMAD', (r, o) => {
    const hard = !!o.hard;
    // hard: five pools, and the shared mean and range are NOT given
    const count = hard ? 5 : 4;
    const sites = r.pickN(['Grotto Mouth', 'Deep Pool', 'Ledge', 'Back Chamber', 'Sand Shelf', 'Spring'], count),
      m = r.int(12, 24),
      k = r.int(4, 7),
      asc = r.chance(0.5);
    // Each set: m − k, m + k (fixed range 2k) plus three values m + x, m + y, m − x − y whose distances add to s.
    const innerSums = r.pickN(
      Array.from({ length: k + 1 }, (_, i) => 2 * i),
      count,
    );
    const sets = innerSums.map((sm) => {
      const x = r.int(0, sm / 2),
        y = sm / 2 - x;
      return r.shuffle([m - k, m + k, m + x, m + y, m - x - y]);
    });
    const mads = sets.map((d) => round(S.mad(d), 2));
    const items = sets.map((d, i) => ({ html: `<b>${sites[i]}</b>: ${S.list(d)}`, rate: mads[i] }));
    const order = items.map((_, i) => i).sort((a, b) => (asc ? items[a].rate - items[b].rate : items[b].rate - items[a].rate));
    const dev = (d) => d.map((v) => Math.abs(v - m));
    const dir = asc ? '<b>smallest</b> (top) to <b>largest</b> (bottom)' : '<b>largest</b> (top) to <b>smallest</b> (bottom)';
    return {
      type: 'seq',
      skill: 'mad',
      lesson: 'Unit 2',
      title: hard ? 'Five pools, one measure' : 'Same mean, same range',
      prompt: hard
        ? `<p>Five pools in the grotto each had 5 water readings.</p><p>Order the pools by <b>MAD</b>, from ${dir}. Find each mean yourself.</p>`
        : `<p>Four pools in the grotto each had 5 water readings. Every pool has a mean of ${hl(m)} <b>and</b> a range of ${hl(2 * k)}, so the range cannot tell them apart.</p><p>Order the pools by <b>MAD</b>, from ${dir}.</p>`,
      items,
      order,
      hints: [
        hard
          ? 'Find each pool’s mean first (sum ÷ 5). Then find each value’s distance from that mean, add the distances, and divide by 5.'
          : `Every set has ${m - k} and ${m + k}, so the range is ${2 * k} for all four. Only the MAD will separate them: find each value's distance from ${m}.`,
        hard
          ? `Every pool sums to ${5 * m}, so every mean is ${5 * m} ÷ 5 = ${m}. Sums of distances from ${m}: ${sets.map((d, i) => `${sites[i]} ${S.sum(dev(d))}`).join(', ')}.`
          : `Sums of distances: ${sets.map((d, i) => `${sites[i]} ${S.sum(dev(d))}`).join(', ')}.`,
        `Divide each sum of distances by 5 to get each MAD. Put the ${asc ? 'smallest' : 'largest'} on top.`,
      ],
      hintEs: hard
        ? 'Primero halla la media de cada poza (suma ÷ 5). Luego halla la distancia de cada dato a esa media, suma las distancias y divide entre 5.'
        : `Todos los grupos tienen ${m - k} y ${m + k}, así que el rango es ${2 * k} en los cuatro. Solo la desviación media absoluta los separa: halla la distancia de cada dato a ${m}.`,
      solution: `<p>${hard ? `Every pool has a mean of ${m} and a range of ${2 * k}. ` : ''}${sets.map((d, i) => `${sites[i]}: distances ${dev(d).join(', ')}, MAD = ${S.sum(dev(d))} ÷ 5 = <b>${fmt(mads[i])}</b>`).join('; ')}. Order: <b>${order.map((i) => sites[i]).join(', ')}</b>. The range only looks at the two end values; the MAD uses every value, so it can tell these sets apart.</p>`,
      feedback: {
        correct: 'Correct. When the range ties, the MAD still measures how the middle values cluster around the mean.',
        wrong(ans) {
          const a = Array.isArray(ans) ? ans : [];
          if (sameOrder(a, order.slice().reverse())) return `Your order is right but upside down. The ${asc ? 'smallest' : 'largest'} MAD goes on top.`;
          const wrongPairs = a.filter((v, i) => v !== order[i]).length;
          if (a.length === order.length && wrongPairs === 2) return 'Almost: two pools are swapped. Recheck the sums of distances for those two pools; they differ by only a little.';
          return `Compute each MAD from the distances to ${hard ? 'the mean (sum ÷ 5)' : m}, then order with the ${asc ? 'smallest' : 'largest'} on top.`;
        },
      },
    };
  });

  // ---------- Unequal interval widths (error) ----------
  G.define('sc_binWidthError', (r, o) => {
    const hard = !!o.hard;
    const name = r.pick(NAMES),
      c = r.pick([
        { what: 'shells collected per visitor', unit: 'shells' },
        { what: 'minutes spent in the grotto', unit: 'minutes' },
        { what: 'photos taken per visitor', unit: 'photos' },
      ]);
    // hard: data to 59, width-15 intervals, a two-step fix (compare the tallest and shortest bars), subtler distractors
    const top = hard ? 59 : 39,
      width = hard ? 15 : 10;
    const good = Array.from({ length: 4 }, (_, i) => ({ lo: i * width, hi: i * width + width - 1, label: `${i * width}–${i * width + width - 1}` }));
    const countIn = (vals, lo, hi) => vals.filter((v) => v >= lo && v <= hi).length;
    let vals, counts;
    for (let t = 0; t < 60; t++) {
      vals = S.data(r, hard ? 18 : 14, 0, top);
      counts = good.map((b) => countIn(vals, b.lo, b.hi));
      if (!hard || Math.max(...counts) - Math.min(...counts) > 0) break;
    }
    const bad = r.pick(
      hard
        ? [
            ['0–14', '15–24', '25–44', '45–59'],
            ['0–9', '10–29', '30–44', '45–59'],
            ['0–19', '20–29', '30–49', '50–59'],
          ]
        : [
            ['0–9', '10–14', '15–29', '30–39'],
            ['0–4', '5–19', '20–29', '30–39'],
            ['0–9', '10–19', '20–24', '25–39'],
          ],
    );
    const ends = (b) => b.split('–').map(Number);
    const widths = bad.map((b) => ends(b)[1] - ends(b)[0] + 1);
    const bi = r.int(1, 2);
    const fixAns = hard ? Math.max(...counts) - Math.min(...counts) : counts[bi];
    const opts = [
      { html: 'The intervals are not all the same width, so the bar heights cannot be compared fairly.', ok: true },
      { html: 'The intervals overlap, so some of the values would be counted twice.', why: 'No value fits two of these intervals. The problem is that the intervals have different widths.' },
      hard
        ? {
            html: 'Each interval should hold the same number of data values, so the counts are off.',
            why: 'That describes quartiles in a box plot. Histogram intervals must have equal widths; the counts in them can differ.',
          }
        : {
            html: 'There are gaps between the intervals, so some of the values are left out.',
            why: `Every whole number from 0 to ${top} belongs to exactly one interval. The widths are the problem.`,
          },
      hard
        ? {
            html: 'The first interval should start at the smallest data value instead of at 0.',
            why: 'Starting at 0 is fine. Intervals need to cover every value with equal widths, and these widths are not equal.',
          }
        : {
            html: 'There is no mistake. Intervals can be any size as long as they do not overlap.',
            why: 'Histogram intervals must be equal in width. A wider interval collects more values just because it is wider, which makes its bar misleading.',
          },
    ];
    const sh = shuffleOptions(r, opts, 0);
    return {
      type: 'error',
      skill: 'histogram',
      lesson: 'Unit 2',
      title: hard ? 'Find the mistake, then fix the histogram' : 'Find the mistake',
      prompt: `<p>${name} is making a histogram of ${c.what}. The data: ${hl(S.list(S.sorted(vals)))}.</p><p>What is wrong with ${name}'s intervals?</p>`,
      work: `Intervals: &nbsp; ${bad.join(' &nbsp;|&nbsp; ')}`,
      options: sh.options,
      answer: sh.answer,
      fix: hard
        ? { label: `Using equal intervals of width ${width} (${good.map((b) => b.label).join(', ')}), how many more values are in the tallest bar than in the shortest bar?`, answer: fixAns }
        : { label: `Using equal intervals of width ${width} (${good.map((b) => b.label).join(', ')}), how many values are in ${good[bi].label}?`, answer: fixAns },
      hints: [
        'Count how many whole numbers each interval covers. Are the counts the same?',
        `${bad.map((b, i) => `${b} covers ${widths[i]}`).join('; ')}. A histogram needs equal widths.`,
        hard
          ? `With ${good.map((b) => b.label).join(', ')}, count the values in each interval. Then subtract the smallest count from the largest.`
          : `With ${good.map((b) => b.label).join(', ')}, count the values from ${good[bi].lo} to ${good[bi].hi}.`,
      ],
      hintEs: 'Cuenta cuántos números enteros cubre cada intervalo. ¿Son iguales esas cantidades?',
      solution: `<p>The intervals have <b>different widths</b> (${widths.join(', ')} values each). A wider interval gets a taller bar just because it is wider, so the shape of the histogram would be misleading. ${
        hard
          ? `Using equal intervals ${good.map((b) => b.label).join(', ')}, the counts are ${counts.join(', ')}. The tallest bar has ${Math.max(...counts)} and the shortest has ${Math.min(...counts)}, a difference of <b>${fixAns}</b>.`
          : `Using equal intervals ${good.map((b) => b.label).join(', ')}, the interval ${good[bi].label} holds <b>${fixAns}</b> values.`
      }</p>`,
      feedback: {
        correct: 'Correct. Equal widths make bar heights fair to compare.',
        wrong(ans, d) {
          if (!d.mistakeOk) return whyOf(sh.options, (ans || {}).mistake, 'Count the numbers in each interval and compare the widths.');
          const v = RX.parseNum((ans || {}).fix);
          if (hard) {
            if (v === Math.max(...counts)) return 'That is the count in the tallest bar. Subtract the count in the shortest bar.';
            const badCounts = bad.map((b) => countIn(vals, ...ends(b)));
            if (v === Math.max(...badCounts) - Math.min(...badCounts)) return `You used ${name}'s unequal intervals. Recount with the equal intervals ${good.map((b) => b.label).join(', ')}.`;
            return 'Count the values in each equal interval, then subtract the smallest count from the largest.';
          }
          const [blo, bhi] = ends(bad[bi]);
          if (v === countIn(vals, blo, bhi) && v !== fixAns) return `You counted with ${name}'s interval ${bad[bi]}. Use the equal interval ${good[bi].label}.`;
          return `You found the mistake. Now count the data values from ${good[bi].lo} through ${good[bi].hi}, including both ends.`;
        },
      },
    };
  });

  // Statements for sc_boxStatements, each with its truth computed from the two five-number summaries.
  function boxStatementOpts(r, hard, c, l1, l2, f1, f2) {
    const iq1 = f1.q3 - f1.q1,
      iq2 = f2.q3 - f2.q1,
      r1 = f1.max - f1.min,
      r2 = f2.max - f2.min;
    const hiMed = f1.med > f2.med ? l1 : l2,
      loMed = hiMed === l1 ? l2 : l1;
    const hiIQR = iq1 > iq2 ? l1 : l2;
    const hiRange = r1 > r2 ? l1 : l2,
      loRange = hiRange === l1 ? l2 : l1;
    let opts;
    if (hard) {
      // hard: statements that compare across plots and use the quarter sections, several with "almost right" numbers
      const dq = Math.abs(iq1 - iq2);
      const dqTrue = r.chance(0.5);
      const crossTrue = f1.med > f2.q3;
      const splitTrue = hiIQR === loRange;
      opts = [
        {
          html: `${l1}'s median is greater than ${l2}'s Q3.`,
          ok: crossTrue,
          why: `${l1}'s median is ${f1.med} and ${l2}'s Q3 is ${f2.q3}.`,
          tip: `${l1}'s median, ${f1.med}, is above ${l2}'s Q3, ${f2.q3}.`,
        },
        { html: `About 75% of ${l2}'s values are at most ${f2.q3}.`, ok: true, tip: `Three quarters of the data (min to Q3) lie at or below Q3 = ${f2.q3}.` },
        { html: `About 50% of ${l1}'s values are between ${f1.q1} and ${f1.max}.`, ok: false, why: `From Q1 (${f1.q1}) to the maximum is three sections: about 75%, not 50%.` },
        {
          html: `The two IQRs differ by ${dqTrue ? dq : dq + r.pick([2, 3])} ${c.unit}.`,
          ok: dqTrue,
          why: `The IQRs are ${iq1} and ${iq2}, which differ by ${dq}.`,
          tip: `The IQRs are ${iq1} and ${iq2}: they differ by ${dq}.`,
        },
        { html: `${hiIQR} has more data values because its box is longer.`, ok: false, why: 'A longer box means more spread, not more values. Every section holds about a quarter of the data.' },
        {
          html: `${hiRange} has the greater range, but ${loRange} has the greater IQR.`,
          ok: splitTrue,
          why: `Ranges: ${l1} ${r1}, ${l2} ${r2}. IQRs: ${l1} ${iq1}, ${l2} ${iq2}. Check both parts.`,
          tip: `${hiRange} has the longer whiskers-to-whiskers span, while ${loRange} has the longer box.`,
        },
      ];
    } else {
      const rangeTrue = r.chance(0.5);
      opts = [
        { html: `${hiMed} has the greater median.`, ok: true, tip: `Compare the median lines: ${l1} ${f1.med}, ${l2} ${f2.med}.` },
        { html: `${hiIQR}'s middle half of the data is more spread out (larger IQR).`, ok: true, tip: `Compare the box lengths: ${l1} ${iq1}, ${l2} ${iq2}.` },
        { html: `About 25% of ${l1}'s values are greater than ${f1.q3}.`, ok: true, tip: 'The section above Q3 holds about a quarter of the data.' },
        { html: `${loMed} has the greater median.`, ok: false, why: `Check the median lines: ${l1} is at ${f1.med} and ${l2} is at ${f2.med}.` },
        { html: `${hiIQR} has more data values because its box is longer.`, ok: false, why: 'A longer box means more spread, not more values. Every section holds about a quarter of the data.' },
        {
          html: `The range of ${l2} is ${rangeTrue ? r2 : r2 + r.pick([-4, 3, 5])}.`,
          ok: rangeTrue,
          why: `The range of ${l2} is ${f2.max} − ${f2.min}.`,
          tip: `The range of ${l2} is ${f2.max} − ${f2.min}.`,
        },
      ];
    }
    return { opts, iq1, iq2, r1, r2, hiMed, hiIQR, hiRange };
  }

  // ---------- True statements about two box plots (ms) ----------
  G.define('sc_boxStatements', (r, o) => {
    const hard = !!o.hard;
    const c = r.pick([
      { what: 'minutes visitors spent in the grotto', unit: 'minutes', lo: 10, hi: 45 },
      { what: 'depths of the grotto pools in inches', unit: 'inches', lo: 8, hi: 40 },
      { what: 'number of bats counted each night', unit: 'bats', lo: 5, hi: 35 },
    ]);
    const [l1, l2] = r.pickN(['Low Tide', 'High Tide', 'Morning', 'Evening', 'Spring', 'Autumn'], 2);
    let f1, f2;
    for (let t = 0; t < 80; t++) {
      f1 = S.fiveNum(S.cleanFive(r, hard ? 10 : 8, c.lo, c.hi, true));
      f2 = S.fiveNum(S.cleanFive(r, hard ? 10 : 8, c.lo, c.hi, true));
      if (f1.med !== f2.med && f1.q3 - f1.q1 !== f2.q3 - f2.q1 && f1.max - f1.min !== f2.max - f2.min) break;
    }
    const { opts: built, iq1, iq2, r1, r2, hiMed, hiIQR, hiRange } = boxStatementOpts(r, hard, c, l1, l2, f1, f2);
    const opts = r.shuffle(built);
    const okIdx = opts.map((x, i) => (x.ok ? i : -1)).filter((i) => i >= 0);
    const sh = shuffleOptions(r, opts, okIdx);
    const allMin = Math.min(f1.min, f2.min),
      allMax = Math.max(f1.max, f2.max);
    const step = allMax - allMin > 30 ? 5 : 2;
    return {
      type: 'ms',
      skill: 'box-plot',
      lesson: 'Unit 2',
      title: hard ? 'Compare both box plots closely' : 'Read both box plots',
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
        hard
          ? 'Find both IQRs (Q3 − Q1) and both ranges (max − min). Count how many 25% sections each statement covers. A longer box never means more values.'
          : 'Find both IQRs (Q3 − Q1) and the range of ' + l2 + ' (max − min). A longer box never means more values.',
      ],
      hintEs:
        'Mediana: la línea dentro de cada caja. Rango intercuartil: el largo de cada caja. Rango: de la punta de un bigote a la punta del otro. Cada bigote y cada mitad de la caja tienen más o menos el 25% de los datos.',
      solution: `<p>${l1}: median ${f1.med}, IQR ${iq1}, range ${r1}. ${l2}: median ${f2.med}, IQR ${iq2}, range ${r2}. So <b>${hiMed}</b> has the greater median, <b>${hiIQR}</b> has the larger IQR, and <b>${hiRange}</b> has the greater range. True statements: ${sh.answers.map((i) => `<b>${sh.options[i].html}</b>`).join(' ')} Box length shows spread, never the number of values.</p>`,
      feedback: {
        correct: 'Correct. Center from the median line, spread from the box and whiskers, and quarters from the sections.',
        wrong(ans, d) {
          if (d.extra && d.extra.length) return `One statement you chose is false. ${whyOf(sh.options, d.extra[0], 'Check it against the five numbers of each plot.')}`;
          if (d.missing && d.missing.length) return `You missed a true statement. ${sh.options[d.missing[0]].tip || 'Check the medians, the box lengths, and the quarter sections.'}`;
          return 'Check the medians, the box lengths, and the quarter sections.';
        },
      },
    };
  });
})(typeof window !== 'undefined' ? window : globalThis);
