/* js/units/u7/gen-integers.js */
/* Zone 1 — Thermal Deck. Lesson 7-1 Explore Integers and Their Opposites. */
(function (root) {
  'use strict';
  const RX = root.RX;
  const { G, V, shuffleOptions, NAMES, parseNum } = RX;
  const { dec, signWord } = RX.N7;
  const hl = V.hl;

  // Real-situation pools. Each entry: value -> { text, sign hint }. Values are drawn, texts are built from them.
  const SITU = [
    { kind: 'temp', pos: (n) => `a temperature of ${n}°F above zero`, neg: (n) => `a temperature of ${n}°F below zero`, zero: 'a temperature of 0°F', unit: '°F' },
    { kind: 'elev', pos: (n) => `an elevation of ${n} m above sea level`, neg: (n) => `a depth of ${n} m below sea level`, zero: 'an elevation at sea level', unit: 'm' },
    { kind: 'money', pos: (n) => `a deposit of $${n}`, neg: (n) => `a withdrawal of $${n}`, zero: 'no change in the account balance', unit: '$' },
    { kind: 'yards', pos: (n) => `a gain of ${n} yards`, neg: (n) => `a loss of ${n} yards`, zero: 'a play with no gain or loss', unit: 'yards' },
    { kind: 'floors', pos: (n) => `an elevator ${n} floors above the lobby`, neg: (n) => `an elevator ${n} floors below the lobby`, zero: 'an elevator at the lobby', unit: 'floors' },
  ];
  const situText = (s, v) => (v > 0 ? s.pos(v) : v < 0 ? s.neg(-v) : s.zero);

  // ---------- Opposite of an integer (num) ----------
  G.define('n1_opposite', (r) => {
    const mag = r.int(2, 18);
    const v = r.chance(0.6) ? -mag : mag;
    const asExpr = v < 0 && r.chance(0.5);
    const name = r.pick(NAMES);
    const prompt = asExpr
      ? `<p>${name} reads the heater display: <b>−(${dec(v)})</b>, "the opposite of ${dec(v)}."</p><p>What number is ${hl('−(' + dec(v) + ')')}?</p>`
      : `<p>The thermal sensor logs ${hl(dec(v))}. The backup sensor, mounted on the other side of the station, always logs the <b>opposite</b> number.</p><p>What is the opposite of ${hl(dec(v))}?</p>`;
    return {
      type: 'num',
      skill: 'opposites',
      lesson: '7-1',
      title: asExpr ? 'The opposite of a negative' : 'Find the opposite',
      prompt: prompt + `<p class="muted">Type a negative number with a minus sign, like -5.</p>`,
      answer: -v,
      hints: [
        'Opposites are the same distance from 0 on a number line, but on opposite sides.',
        `${dec(v)} is ${mag} units ${v < 0 ? 'left' : 'right'} of 0. Its opposite is ${mag} units on the other side.`,
        `${mag} units ${v < 0 ? 'right' : 'left'} of 0 is ${dec(-v)}.`,
      ],
      solution: `<p>${dec(v)} sits ${mag} units from 0. The opposite sits ${mag} units from 0 on the other side: <b>${dec(-v)}</b>. ${asExpr ? `So −(${dec(v)}) = ${dec(-v)}: the opposite of a negative number is positive.` : 'Taking the opposite changes only the sign, never the distance from 0.'}</p>${V.numberLine(
        {
          min: -20,
          max: 20,
          step: 1,
          labelEvery: 5,
          points: [
            { v, label: dec(v) },
            { v: -v, label: dec(-v), color: '#1FA6A2' },
          ],
          aria: `Number line showing ${dec(v)} and its opposite ${dec(-v)}`,
        },
      )}`,
      feedback: {
        correct: `Correct. ${dec(v)} and ${dec(-v)} are both ${mag} units from 0, on opposite sides.`,
        wrong(ans, d) {
          if (d.value === v) return `${dec(v)} is the number itself. Its opposite has the other sign and sits on the other side of 0.`;
          if (d.value === 0) return 'Only 0 is its own opposite. Every other number has an opposite on the other side of 0.';
          if (d.value != null && Math.abs(d.value) === mag) return `You have the right distance from 0 but the wrong sign. The opposite of a ${signWord(v)} number is ${signWord(-v)}.`;
          return `Find ${dec(v)} on a number line. Count how far it is from 0, then go that same distance the other way.`;
        },
      },
    };
  });

  // ---------- Place a number and its opposite (nl) ----------
  G.define('n1_nlOpposites', (r, o) => {
    const hard = !!o.hard;
    const mag = hard ? r.int(7, 11) : r.int(2, 9);
    const v = r.chance(0.5) ? -mag : mag;
    const s = r.pick(SITU);
    const name = r.pick(NAMES);
    const min = hard ? -12 : -10,
      max = -min;
    return {
      type: 'nl',
      skill: 'opposites',
      lesson: '7-1',
      title: hard ? 'Place the reading and its opposite' : 'Place a number and its opposite',
      prompt: hard
        ? `<p>${name} logs ${hl(situText(s, v))}. Place the integer for this reading <b>and its opposite</b> on the number line.</p>`
        : `<p>Place ${hl(dec(v))} and its opposite on the number line.</p><p class="muted">Click a tick mark to place a point. Click it again to remove it.</p>`,
      min,
      max,
      step: 1,
      labelEvery: hard ? 2 : 1,
      count: 2,
      points: [v, -v],
      hints: [
        hard
          ? `"${situText(s, v)}" is ${v < 0 ? 'below the starting point, so the integer is negative' : 'above the starting point, so the integer is positive'}: ${dec(v)}.`
          : `Start at 0. ${dec(v)} is ${mag} units to the ${v < 0 ? 'left' : 'right'}.`,
        `Opposites are the same distance from 0 on opposite sides. Count ${mag} units the other way from 0.`,
        `The two points are ${dec(v)} and ${dec(-v)}. Both are ${mag} ticks from 0.`,
      ],
      solution: `<p>${hard ? `The reading is <b>${dec(v)}</b>. ` : ''}${dec(v)} is ${mag} units ${v < 0 ? 'left' : 'right'} of 0, so its opposite ${dec(-v)} is ${mag} units ${v < 0 ? 'right' : 'left'} of 0. The two points are <b>${dec(v)}</b> and <b>${dec(-v)}</b>.</p>${V.numberLine(
        {
          min,
          max,
          step: 1,
          labelEvery: hard ? 2 : 1,
          points: [
            { v, label: dec(v) },
            { v: -v, label: dec(-v), color: '#1FA6A2' },
          ],
          segments: [
            { from: v, to: 0 },
            { from: 0, to: -v, color: '#1FA6A2' },
          ],
          aria: `Number line with ${dec(v)} and ${dec(-v)} the same distance from 0`,
        },
      )}`,
      feedback: {
        correct: `Correct. ${dec(v)} and ${dec(-v)} are mirror images across 0.`,
        wrong(ans, d) {
          const extra = d.extra || [];
          if (extra.some((x) => x === 0)) return '0 is its own opposite, but it is not the opposite of ' + dec(v) + '. Count ' + mag + ' units from 0 in each direction.';
          if (extra.some((x) => Math.abs(Math.abs(x) - mag) === 1)) return `One point is off by one tick. Count carefully: both points must be exactly ${mag} ticks from 0.`;
          if (extra.length && extra.every((x) => Math.sign(x) === Math.sign(v))) return `Both of your points are on the same side of 0. The opposite of ${dec(v)} is on the other side.`;
          return `Place ${dec(v)} first (${mag} ticks ${v < 0 ? 'left' : 'right'} of 0). Then place a point ${mag} ticks on the other side of 0.`;
        },
      },
    };
  });

  // ---------- Who is correct about the opposite of a negative? (who) ----------
  G.define('n1_whoOpposite', (r) => {
    const mag = r.int(2, 15);
    const [a, b, c] = r.pickN(NAMES, 3);
    const opts = [
      { title: a, html: `−(−${mag}) = ${mag}. The opposite of −${mag} is ${mag} units on the other side of 0.`, ok: true },
      {
        title: b,
        html: `−(−${mag}) = −${mag}. The number is already negative, so it stays negative.`,
        why: `The minus sign in front means "the opposite of." The opposite of a negative number is positive, so −(−${mag}) = ${mag}.`,
      },
      {
        title: c,
        html: `−(−${mag}) = 0. The two negative signs cancel each other out to nothing.`,
        why: `The signs do "cancel," but that makes the number positive, not zero. −(−${mag}) is ${mag} units from 0, on the positive side.`,
      },
    ];
    const sh = shuffleOptions(r, opts, 0);
    return {
      type: 'who',
      skill: 'opposites',
      lesson: '7-1',
      title: 'Who read the gauge correctly?',
      prompt: `<p>The frost gauge shows the expression ${hl('−(−' + mag + ')')}. Three navigators disagree about its value.</p><p>Who is correct?</p>`,
      options: sh.options,
      answer: sh.answer,
      layout: 'cards',
      hints: [
        'Read −(−' + mag + ') as "the opposite of negative ' + mag + '."',
        `On a number line, −${mag} is ${mag} units left of 0. Its opposite is ${mag} units right of 0.`,
        `The opposite of −${mag} is ${mag}, a positive number.`,
      ],
      solution: `<p>${a} is correct. −(−${mag}) means the opposite of −${mag}. Since −${mag} is ${mag} units left of 0, its opposite is ${mag} units right of 0: <b>${mag}</b>. The opposite of a negative number is always positive.</p>`,
      feedback: { correct: `Correct. −(−${mag}) = ${mag}. "The opposite of a negative" is a positive.` },
    };
  });

  // ---------- Sort situations: positive, negative, zero (sort) ----------
  G.define('n1_sortSign', (r) => {
    const kinds = r.pickN(SITU, 4);
    const items = [];
    const used = new Set();
    const add = (s, v) => {
      const text = situText(s, v);
      if (used.has(text)) return;
      used.add(text);
      items.push({ html: text, bin: v > 0 ? 0 : v < 0 ? 1 : 2 });
    };
    kinds.forEach((s, i) => {
      const n = r.int(3, 45);
      if (i < 2) {
        add(s, n);
        add(s, -r.int(3, 45));
      } else if (i === 2) add(s, r.chance(0.5) ? n : -n);
      else add(s, 0);
    });
    add(r.pick(SITU.filter((s) => !kinds.slice(3).includes(s))), 0);
    return {
      type: 'sort',
      skill: 'integers-context',
      lesson: '7-1',
      title: 'Sort the station log',
      prompt: `<p>The station log describes each reading in words. Sort each one by the <b>sign</b> of the integer that represents it.</p><p class="muted">Above, up, gain, and deposit point to positive. Below, down, loss, and withdrawal point to negative. The starting point itself is zero.</p>`,
      bins: ['Positive', 'Negative', 'Zero'],
      items: r.shuffle(items),
      hints: [
        'Ask: is this reading above the starting point, below it, or exactly at it?',
        'Words like "below," "loss," and "withdrawal" describe values less than 0, so they are negative.',
        'Sea level, the lobby, and "no change" are the starting point, 0. Zero is neither positive nor negative.',
      ],
      solution: `<p>Readings above the starting point (above zero, above sea level, deposits, gains) are <b>positive</b>. Readings below it (below zero, below sea level, withdrawals, losses) are <b>negative</b>. The starting point itself (sea level, the lobby, no change) is <b>zero</b>.</p>`,
      feedback: {
        correct: 'Correct. The direction word tells you the sign, and the starting point is always 0.',
        wrong(ans, d) {
          const i = d.wrong[0];
          const it = items[i];
          if (it && it.bin === 2) return `"${it.html}" is exactly at the starting point. That is 0, which is neither positive nor negative.`;
          if (it && it.bin === 1) return `"${it.html}" is below the starting point, so its integer is negative.`;
          return 'At least one item is in the wrong bin. Decide if each reading is above the starting point, below it, or at it.';
        },
      },
    };
  });

  // ---------- Match a situation to its integer (match) ----------
  G.define('n1_matchSituation', (r) => {
    const kinds = r.pickN(SITU, 3);
    const n1 = r.int(5, 40);
    let n2 = r.int(5, 40);
    while (n2 === n1) n2 = r.int(5, 40);
    // pair 0/1 are opposites in two different contexts; pair 2/3 are two more distinct values
    const vals = [n1, -n1, r.chance(0.5) ? n2 : -n2, 0];
    const left = [situText(kinds[0], vals[0]), situText(kinds[1], vals[1]), situText(kinds[2], vals[2]), situText(kinds[0], 0)];
    const rightOrder = r.shuffle([0, 1, 2, 3]);
    const right = rightOrder.map((i) => dec(vals[i]));
    return {
      type: 'match',
      skill: 'integers-context',
      lesson: '7-1',
      title: 'Match each reading to its integer',
      prompt: `<p>Match each station log entry to the integer that represents it.</p>`,
      left,
      right,
      pairs: left.map((_, i) => [i, rightOrder.indexOf(i)]),
      hints: [
        'First decide the sign: above, gain, or deposit is positive; below, loss, or withdrawal is negative.',
        `Two entries use the same number, ${n1}. One is positive and one is negative. Read the direction words.`,
        'The entry at the starting point (sea level, lobby, no change) matches 0.',
      ],
      solution: `<ul>${left.map((t, i) => `<li>${t} → <b>${dec(vals[i])}</b></li>`).join('')}</ul><p>The direction word gives the sign. The number of units gives the distance from 0.</p>`,
      feedback: {
        correct: 'Correct. Each situation has a direction (the sign) and a size (the distance from 0).',
        wrong(ans, d) {
          const i = d.wrong[0];
          return i != null && left[i]
            ? `Check "${left[i]}". Is it above the starting point, below it, or at it? Then match the sign.`
            : 'At least one match is off. Decide the sign of each entry first, then its size.';
        },
      },
    };
  });

  // ---------- What does 0 mean in this context? (mc) ----------
  G.define('n1_zeroMeaning', (r) => {
    const name = r.pick(NAMES);
    const ctx = r.pick([
      {
        setup: (v) => `${name} records an ocean depth of ${hl(dec(-v) + ' m')} and a cliff height of ${hl(v + 15 + ' m')}.`,
        q: 'What does 0 represent in this situation?',
        ok: 'Sea level, the starting point for measuring up and down.',
        wrong: [
          ['The deepest point in the ocean.', 'Depths below sea level are negative numbers, so the deepest point would be the most negative value, not 0.'],
          ['The top of the cliff.', 'The top of the cliff is a positive elevation above sea level. Zero is the level the heights are measured from.'],
          ['A place that has no elevation at all.', 'Every place has an elevation. Zero is a real elevation: exactly at sea level.'],
        ],
      },
      {
        setup: (v) => `The outdoor sensor reads ${hl(dec(-v) + '°C')} at night and ${hl(v + 2 + '°C')} at noon.`,
        q: 'What does 0°C represent?',
        ok: 'The temperature at which water freezes, the reference point for above and below.',
        wrong: [
          ['The coldest temperature possible.', 'Temperatures can go below 0°C. Those are the negative readings, like the one at night.'],
          ['No temperature at all.', 'Zero degrees is a real temperature. It is simply the point the scale is measured from.'],
          ['The temperature at which water boils.', 'Water boils at 100°C. Zero is the freezing point.'],
        ],
      },
      {
        setup: (v) => `${name}'s supply account shows a deposit of ${hl('$' + (v + 10))} and a withdrawal of ${hl('$' + v)}.`,
        q: 'What does a balance of $0 represent?',
        ok: 'The account has no money in it: the point between owing and having.',
        wrong: [
          ['The account has been closed.', 'An open account can have a balance of $0. Zero describes the amount, not whether the account exists.'],
          ['The largest withdrawal that can be made.', 'Withdrawals are shown as negative changes. Zero is the balance with nothing in it, not a size of withdrawal.'],
          ['The account owes money.', 'Owing money would be a negative balance. Zero means neither owing nor having.'],
        ],
      },
      {
        setup: (v) => `On one play the team gains ${hl(v + ' yards')}. On the next it loses ${hl(v - 1 + ' yards')}.`,
        q: 'What does 0 represent for a play?',
        ok: 'The ball ended exactly where it started: no gain and no loss.',
        wrong: [
          ['The team lost the ball.', 'Losing the ball is a different event. Zero describes yards: the ball did not move forward or back.'],
          ['The team moved as far as possible.', 'Moving far forward is a large positive gain. Zero means no movement.'],
          ['The play did not count.', 'A play with 0 yards still counts. The ball simply did not change position.'],
        ],
      },
    ]);
    const v = r.int(3, 40);
    const opts = [{ html: ctx.ok, ok: true }].concat(ctx.wrong.map(([html, why]) => ({ html, why })));
    const sh = shuffleOptions(r, opts, 0);
    return {
      type: 'mc',
      skill: 'integers-context',
      lesson: '7-1',
      title: 'What does zero mean here?',
      prompt: `<p>${ctx.setup(v)}</p><p>${ctx.q}</p>`,
      options: sh.options,
      answer: sh.answer,
      hints: [
        'Positive numbers describe one direction and negative numbers the other. Zero is the point in the middle.',
        'Zero is not "nothing" and not the lowest value. It is the reference point that the other values are measured from.',
        'Ask: what situation is exactly between the positive case and the negative case?',
      ],
      solution: `<p><b>${ctx.ok}</b> Positive values are measured up from 0, negative values down from 0. Zero is the reference point, not the smallest or largest value.</p>`,
      feedback: { correct: 'Correct. In every real situation, 0 is the reference point between the positive and negative values.' },
    };
  });

  // ---------- Write the integer for two situations (blanks) ----------
  G.define('n1_writeIntegers', (r) => {
    const [s1, s2] = r.pickN(SITU, 2);
    const a = r.int(2, 60),
      b = r.int(2, 60);
    const v1 = r.chance(0.6) ? -a : a;
    const v2 = v1 < 0 ? b : -b;
    const name = r.pick(NAMES);
    return {
      type: 'blanks',
      skill: 'integers-context',
      lesson: '7-1',
      title: 'Write each reading as an integer',
      prompt: `<p>${name} must enter two log entries as integers before the heaters restart.</p><ol><li>${hl(situText(s1, v1))}</li><li>${hl(situText(s2, v2))}</li></ol><p class="muted">Type a negative integer with a minus sign, like -7.</p>`,
      fields: [
        { label: 'Entry 1', answer: v1, width: 'sm' },
        { label: 'Entry 2', answer: v2, width: 'sm' },
      ],
      layout: 'two-col',
      hints: [
        'Decide the sign first. Above, gain, deposit: positive. Below, loss, withdrawal: negative.',
        `Entry 1 is ${v1 < 0 ? 'below the starting point, so it is negative' : 'above the starting point, so it is positive'}. Entry 2 is the other sign.`,
        `Entry 1: ${dec(v1)}. Entry 2 uses the number ${b} with a ${signWord(v2)} sign.`,
      ],
      solution: `<p>Entry 1: "${situText(s1, v1)}" → <b>${dec(v1)}</b>. Entry 2: "${situText(s2, v2)}" → <b>${dec(v2)}</b>. The word that tells direction gives the sign; the number gives the size.</p>`,
      feedback: {
        correct: `Correct. ${dec(v1)} and ${dec(v2)}: the direction word sets the sign.`,
        wrong(ans, d) {
          const vals = [v1, v2];
          const i = d.wrong[0];
          const got = parseNum(ans[i]);
          if (got != null && got === -vals[i])
            return `Entry ${i + 1} has the right size but the wrong sign. "${situText([s1, s2][i], vals[i])}" is ${vals[i] < 0 ? 'below the starting point: negative' : 'above the starting point: positive'}.`;
          return `Look again at entry ${i + 1}. The number tells the size; the direction word tells the sign.`;
        },
      },
    };
  });

  // ---------- True or false about a real-situation integer (tf) ----------
  G.define('n1_tfSituation', (r) => {
    const s = r.pick(SITU);
    const n = r.int(3, 50);
    const trueCase = r.chance(0.5);
    const negText = s.neg(n);
    const posText = s.pos(n);
    let statement, reasons, answer, text;
    if (trueCase) {
      // correct claim: a "below" situation is written as a negative
      text = negText;
      statement = `${negText.charAt(0).toUpperCase() + negText.slice(1)} is written as the integer −${n}.`;
      answer = true;
      reasons = [
        { html: `The reading is below the starting point (0), so the integer is negative.`, correct: true },
        { html: `Every real-world amount is written as a negative integer.` },
        { html: `${n} is less than 100, so it must be negative.` },
      ];
    } else {
      // incorrect claim: a "below" situation written as positive
      text = negText;
      statement = `${negText.charAt(0).toUpperCase() + negText.slice(1)} is written as the integer ${n}.`;
      answer = false;
      reasons = [
        { html: `"Below" means less than the starting point, so the integer must be negative: −${n}.`, correct: true },
        { html: `The integer should be 0 because the reading is a real amount.` },
        { html: `It should be ${n * 2}, because below counts double.` },
      ];
    }
    const sh = shuffleOptions(r, reasons, 0);
    return {
      type: 'tf',
      skill: 'integers-context',
      lesson: '7-1',
      title: 'True or false?',
      prompt: `<p>A navigator writes in the log:</p><blockquote>${hl(statement)}</blockquote><p>Is the statement true or false? Choose the best reason.</p>`,
      answer,
      reasons: sh.options,
      hints: [
        'Ask whether the reading is above or below the starting point. Below means negative.',
        `"${text}" is below the starting point. Its integer must have a negative sign.`,
        `The correct integer is −${n}. Does the statement match that?`,
      ],
      solution: `<p>"${text}" is below the starting point, so its integer is <b>−${n}</b>. The statement is <b>${answer ? 'true' : 'false'}</b>${answer ? '.' : `: it leaves off the negative sign. ${posText.charAt(0).toUpperCase() + posText.slice(1)} would be ${n}.`}</p>`,
      feedback: {
        correct: answer ? 'Correct. Below the starting point means a negative integer.' : 'Correct. Without the negative sign, the integer would describe the opposite situation.',
        wrong(ans, d) {
          if (!d.valueOk) return `Decide whether "${text}" is above or below the starting point. Below means the integer is negative.`;
          return `Your true/false answer is right. Pick the reason that talks about the reading being below 0.`;
        },
      },
    };
  });
})(typeof window !== 'undefined' ? window : globalThis);

/* js/units/u7/gen-rationals.js */
/* Zone 2 — Ice Core Lab. Lesson 7-2 Represent Rational Numbers and Their Opposites on the Number Line. */
(function (root) {
  'use strict';
  const RX = root.RX;
  const { G, V, shuffleOptions, NAMES, parseNum, near } = RX;
  const { dec, mixedHtml, mixedText, fracParts } = RX.N7;
  const hl = V.hl;
  const hlRaw = (html) => `<mark class="num">${html}</mark>`;

  const CORE = ['ice core', 'sediment core', 'snow sample', 'brine sample'];
  const nlAria = (pts) => 'Number line with points at ' + pts.map(mixedText).join(' and ');

  // Draw a non-integer value with the given step inside (-lim, lim), avoiding a set of taken values.
  const drawFrac = (r, step, lim, taken) => {
    for (let k = 0; k < 40; k++) {
      const v = Math.round(r.int(1, lim / step - 1) * step * 1000) / 1000;
      const s = r.chance(0.5) ? -v : v;
      if (Number.isInteger(s) || (taken || []).some((t) => near(t, s))) continue;
      return s;
    }
    return step;
  };

  // ---------- Place two decimals (nl) ----------
  G.define('n2_nlDecimal', (r) => {
    const a = drawFrac(r, 0.5, 4, []);
    let b = drawFrac(r, 0.5, 4, [a]);
    if (Math.sign(b) === Math.sign(a)) b = -b;
    const name = r.pick(NAMES);
    const core = r.pick(CORE);
    return {
      type: 'nl',
      skill: 'rational-nl',
      lesson: '7-2',
      title: 'Place the decimals',
      prompt: `<p>${name} labels two ${core}s by their position from the shelf line (0 m). One is at ${hl(dec(a) + ' m')} and the other at ${hl(dec(b) + ' m')}.</p><p>Place both numbers on the number line.</p><p class="muted">Each small tick is 0.5. Click a tick to place a point.</p>`,
      min: -4,
      max: 4,
      step: 0.5,
      labelEvery: 1,
      count: 2,
      points: [a, b],
      hints: [
        'Negative numbers are left of 0; positive numbers are right of 0. Each tick is one half, 0.5.',
        `${dec(a)} is between ${dec(Math.sign(a) * Math.floor(Math.abs(a)))} and ${dec(Math.sign(a) * Math.ceil(Math.abs(a)))}, exactly on the half tick.`,
        `${dec(b)} is between ${dec(Math.sign(b) * Math.floor(Math.abs(b)))} and ${dec(Math.sign(b) * Math.ceil(Math.abs(b)))}. Place it on the half tick between them.`,
      ],
      solution: `<p>${dec(a)} sits halfway between ${dec(Math.sign(a) * Math.floor(Math.abs(a)))} and ${dec(Math.sign(a) * Math.ceil(Math.abs(a)))}. ${dec(b)} sits halfway between ${dec(Math.sign(b) * Math.floor(Math.abs(b)))} and ${dec(Math.sign(b) * Math.ceil(Math.abs(b)))}. For a negative decimal, move left of 0 and count the same way you would for a positive one.</p>${V.numberLine(
        {
          min: -4,
          max: 4,
          step: 0.5,
          labelEvery: 1,
          points: [
            { v: a, label: dec(a) },
            { v: b, label: dec(b), color: '#1FA6A2' },
          ],
          aria: nlAria([a, b]),
        },
      )}`,
      feedback: {
        correct: `Correct. ${dec(a)} and ${dec(b)} are each exactly on a half tick.`,
        wrong(ans, d) {
          const extra = d.extra || [];
          if (extra.some((x) => near(x, -a) || near(x, -b))) return 'One point is on the wrong side of 0. Check the sign: negative numbers go to the left of 0.';
          if (extra.some((x) => Math.abs(Math.abs(x) - Math.abs(a)) === 0.5 || Math.abs(Math.abs(x) - Math.abs(b)) === 0.5))
            return 'One point is one tick off. Remember each tick is 0.5, so two ticks make 1.';
          return `Find the two integers each number is between, then click the half tick in the middle.`;
        },
      },
    };
  });

  // ---------- Place two or three fractions (nl, hard = 3 points incl. a mixed number) ----------
  G.define('n2_nlFraction', (r, o) => {
    const hard = !!o.hard;
    const pts = [];
    pts.push(drawFrac(r, 0.25, 3, pts));
    pts.push(drawFrac(r, 0.25, 3, pts));
    if (Math.sign(pts[1]) === Math.sign(pts[0])) pts[1] = -pts[1];
    if (hard) pts.push(drawFrac(r, 0.25, 3, pts));
    const name = r.pick(NAMES);
    const list = pts.map((v) => hlRaw(mixedHtml(v)));
    const listText = list.length === 2 ? list.join(' and ') : list.slice(0, -1).join(', ') + ', and ' + list[list.length - 1];
    const whereText = (v) => {
      const lo = Math.sign(v) * Math.floor(Math.abs(v)),
        hi = Math.sign(v) * Math.ceil(Math.abs(v));
      const p = fracParts(v);
      const quarters = (p.n * 4) / p.d;
      return `${mixedText(v)} is between ${dec(lo)} and ${dec(hi)}: ${quarters} quarter tick${quarters === 1 ? '' : 's'} past ${dec(lo)}, moving ${v < 0 ? 'left' : 'right'}`;
    };
    return {
      type: 'nl',
      skill: 'rational-nl',
      lesson: '7-2',
      title: hard ? 'Place three fractions' : 'Place the fractions',
      prompt: `<p>${name} marks ${hard ? 'three' : 'two'} ${r.pick(CORE)}s on the depth line. Their positions are ${listText}.</p><p>Place ${hard ? 'all three' : 'both'} numbers on the number line.</p><p class="muted">Each small tick is one fourth (0.25).</p>`,
      min: -3,
      max: 3,
      step: 0.25,
      labelEvery: 1,
      count: pts.length,
      points: pts,
      hints: [
        'Each space between whole numbers is split into 4 equal parts. One tick is 1/4, two ticks are 1/2, three ticks are 3/4.',
        whereText(pts[0]) + '.',
        pts
          .slice(1)
          .map((v) => whereText(v))
          .join('. ') + '.',
      ],
      solution: `<p>${pts.map((v) => `<b>${mixedHtml(v)}</b>: ${whereText(v)}.`).join(' ')} A negative fraction is placed the same distance from 0 as its positive twin, but to the left.</p>${V.numberLine({ min: -3, max: 3, step: 0.25, labelEvery: 1, points: pts.map((v, i) => ({ v, label: mixedText(v), color: ['#C8553D', '#1FA6A2', '#17324D'][i] })), aria: nlAria(pts) })}`,
      feedback: {
        correct: 'Correct. Every quarter tick is 0.25, so you can count the parts between whole numbers.',
        wrong(ans, d) {
          const extra = d.extra || [];
          if (extra.some((x) => pts.some((p) => near(x, -p)))) return 'One point is on the wrong side of 0. A negative number sits to the left of 0.';
          if (extra.some((x) => pts.some((p) => Math.sign(p) === Math.sign(x) && Math.abs(Math.floor(Math.abs(x)) - Math.floor(Math.abs(p))) === 0)))
            return 'One point is between the right whole numbers but on the wrong quarter tick. Count the ticks from the whole number closer to 0.';
          return 'Find the two whole numbers each fraction is between, then count quarter ticks from the one closer to 0.';
        },
      },
    };
  });

  // ---------- Which two integers is this number between? (cloze) ----------
  G.define('n2_betweenIntegers', (r) => {
    const w = r.int(0, 5);
    const tenths = r.pick([0.1, 0.2, 0.3, 0.4, 0.6, 0.7, 0.8, 0.9]);
    const mag = Math.round((w + tenths) * 10) / 10;
    const v = r.chance(0.65) ? -mag : mag;
    const lo = Math.floor(v),
      hi = Math.ceil(v);
    // choices: a window of integers around the value
    const choices = [];
    for (let k = lo - 2; k <= hi + 2; k++) choices.push(dec(k));
    const name = r.pick(NAMES);
    const ctx = r.pick(['temperature', 'depth reading', 'tilt reading', 'pressure change']);
    return {
      type: 'cloze',
      skill: 'rational-nl',
      lesson: '7-2',
      title: 'Between which integers?',
      prompt: `<p>${name}'s ${ctx} is ${hl(dec(v))}. The display only shows integers, so ${name} needs the two integers the reading lies between.</p><p>Complete the sentence. The integer on the left of the number line comes first.</p>`,
      template: `${dec(v)} is between {0} and {1} on the number line.`,
      choices: [choices, choices],
      answers: [choices.indexOf(dec(lo)), choices.indexOf(dec(hi))],
      hints: [
        v < 0 ? `${dec(v)} is negative, so both integers are on the left side of 0 (or one of them is 0).` : `${dec(v)} is positive, so look at the integers to the right of 0.`,
        `${dec(v)} is ${mag} units from 0. That is between ${w} and ${w + 1} units from 0.`,
        v < 0
          ? `${w} and ${w + 1} units to the left of 0 are ${dec(-w)} and ${dec(-(w + 1))}. The one farther left comes first.`
          : `The integers are ${w} and ${w + 1}. The smaller one is on the left.`,
      ],
      solution: `<p>${dec(v)} is ${mag} units ${v < 0 ? 'left' : 'right'} of 0, so it falls between <b>${dec(lo)}</b> (on the left) and <b>${dec(hi)}</b> (on the right).${v < 0 ? ` With negatives, the integer with the larger size, ${dec(lo)}, is farther left.` : ''}</p>${V.numberLine({ min: lo - 1, max: hi + 1, step: 0.1, labelEvery: 1, points: [{ v, label: dec(v) }], aria: `Number line showing ${dec(v)} between ${dec(lo)} and ${dec(hi)}` })}`,
      feedback: {
        correct: `Correct. ${dec(v)} lies between ${dec(lo)} and ${dec(hi)}.`,
        wrong(ans, d) {
          if (ans[0] === choices.indexOf(dec(hi)) && ans[1] === choices.indexOf(dec(lo)))
            return `You have the right two integers, but in the wrong order. On the number line ${dec(lo)} is to the left of ${dec(hi)}.`;
          if (v < 0 && (ans[0] === choices.indexOf(dec(-lo)) || ans[1] === choices.indexOf(dec(-hi))))
            return `Those integers are on the positive side. ${dec(v)} is negative, so the integers around it are negative too.`;
          return `${dec(v)} is ${mag} units from 0. Which two whole-number distances is that between? Then apply the sign.`;
        },
      },
    };
  });

  // ---------- Read a point on a number line (mc) ----------
  G.define('n2_readPoint', (r) => {
    const w = r.int(0, 2);
    const f = r.pick([0.25, 0.75]);
    const mag = w + f;
    const v = r.chance(0.6) ? -mag : mag;
    const sgn = Math.sign(v);
    const mirror = sgn * (w + 1 - f); // counted from the wrong whole number
    const dropped = -v; // sign dropped / wrong side
    const offTick = sgn * (mag - 0.25); // one tick short
    const opts = [
      { html: dec(v), ok: true },
      { html: dec(mirror), why: `${dec(mirror)} is counted from the wrong whole number. Start at the whole number closer to 0 and count quarter ticks away from 0.` },
      { html: dec(dropped), why: `${dec(dropped)} is the same distance from 0 but on the other side. Check which side of 0 the point is on.` },
      { html: dec(offTick), why: `${dec(offTick)} is one tick too close to 0. Each tick is 0.25, so count every tick between the whole number and the point.` },
    ];
    const sh = shuffleOptions(r, opts, 0);
    return {
      type: 'mc',
      skill: 'rational-nl',
      lesson: '7-2',
      title: 'Read the point',
      prompt: `<p>A ${r.pick(CORE)} is marked on the depth line below. Each small tick is 0.25.</p>${V.numberLine({ min: -3, max: 3, step: 0.25, labelEvery: 1, points: [{ v, label: '?' }], aria: `Number line from negative 3 to 3 with an unlabeled point between ${dec(sgn * w)} and ${dec(sgn * (w + 1))}` })}<p>Which number does the point show?</p>`,
      options: sh.options,
      answer: sh.answer,
      hints: [
        'First decide the sign: is the point left of 0 (negative) or right of 0 (positive)?',
        `The point is between ${dec(sgn * w)} and ${dec(sgn * (w + 1))}. Count the quarter ticks starting from ${dec(sgn * w)}, the whole number closer to 0.`,
        `It is ${f * 4} tick${f * 4 === 1 ? '' : 's'} past ${dec(sgn * w)}, moving ${v < 0 ? 'left' : 'right'}. That is ${mag} units from 0.`,
      ],
      solution: `<p>The point is ${v < 0 ? 'left' : 'right'} of 0, between ${dec(sgn * w)} and ${dec(sgn * (w + 1))}. It is ${f * 4} quarter tick${f * 4 === 1 ? '' : 's'} beyond ${dec(sgn * w)}, so it is ${mag} units from 0: <b>${dec(v)}</b> (${mixedHtml(v)}).</p>`,
      feedback: { correct: `Correct. The point is ${mag} units ${v < 0 ? 'left' : 'right'} of 0, so it shows ${dec(v)}.` },
    };
  });

  // ---------- Opposite of a rational number (num) ----------
  G.define('n2_oppositeRational', (r) => {
    const useFrac = r.chance(0.5);
    const v = useFrac ? drawFrac(r, 0.25, 4, []) : drawFrac(r, 0.5, 6, []);
    const name = r.pick(NAMES);
    const shown = useFrac ? mixedHtml(v) : dec(v);
    const p = fracParts(v);
    const recip = p && p.w === 0 && p.n ? Math.sign(v) * (p.d / p.n) : null;
    return {
      type: 'num',
      skill: 'rational-opposites',
      lesson: '7-2',
      title: 'Opposite of a rational number',
      prompt: `<p>${name}'s sample sits at ${hlRaw(shown)} on the depth line. A second sample sits at the <b>opposite</b> number.</p><p>What is the opposite of ${hlRaw(shown)}?</p><p class="muted">Type a decimal or a fraction like -3/4.</p>`,
      answer: -v,
      hints: [
        'The opposite of a number is the same distance from 0, on the other side. Only the sign changes.',
        `${mixedText(v)} is ${mixedText(Math.abs(v))} units ${v < 0 ? 'left' : 'right'} of 0.`,
        `Go ${mixedText(Math.abs(v))} units the other way from 0: the opposite is ${mixedText(-v)}.`,
      ],
      solution: `<p>${mixedHtml(v)} is ${mixedHtml(Math.abs(v))} units from 0. Its opposite is the same distance on the other side: <b>${mixedHtml(-v)}</b>${useFrac ? ` (${dec(-v)} as a decimal)` : ''}. Taking the opposite changes the sign and nothing else.</p>${V.numberLine(
        {
          min: -4,
          max: 4,
          step: useFrac ? 0.25 : 0.5,
          labelEvery: 1,
          points: [
            { v, label: mixedText(v) },
            { v: -v, label: mixedText(-v), color: '#1FA6A2' },
          ],
          aria: nlAria([v, -v]),
        },
      )}`,
      feedback: {
        correct: `Correct. ${mixedText(v)} and ${mixedText(-v)} are the same distance from 0 on opposite sides.`,
        wrong(ans, d) {
          if (d.value != null && near(d.value, v, 0.001)) return 'That is the number itself. The opposite has the other sign.';
          if (recip != null && d.value != null && near(d.value, recip, 0.001))
            return `You flipped the fraction. That is the reciprocal, not the opposite. The opposite keeps the same digits and changes only the sign.`;
          if (d.value != null && near(d.value, 0, 0.001)) return 'Only 0 is its own opposite. This number is not 0, so its opposite is on the other side of 0.';
          return `Keep the distance from 0 the same (${mixedText(Math.abs(v))}) and switch the sign.`;
        },
      },
    };
  });

  // ---------- Which number line shows the number and its opposite? (rep) ----------
  G.define('n2_repOpposites', (r) => {
    const w = r.int(1, 2);
    const mag = w + 0.5;
    const v = r.chance(0.5) ? -mag : mag;
    const sgn = Math.sign(-v);
    const mk = (pts, aria) => V.numberLine({ min: -3, max: 3, step: 0.5, labelEvery: 1, width: 300, points: pts.map((p, i) => ({ v: p, label: dec(p), color: i ? '#1FA6A2' : '#C8553D' })), aria });
    const opts = [
      { html: mk([v, -v], `Points at ${dec(v)} and ${dec(-v)}`), ok: true },
      {
        html: mk([v, sgn * w], `Points at ${dec(v)} and ${dec(sgn * w)}`),
        why: `The second point is ${dec(sgn * w)}, which is only ${w} units from 0. The opposite must be the same distance from 0 as ${dec(v)}: ${mag} units.`,
      },
      {
        html: mk([v, sgn * (w + 1)], `Points at ${dec(v)} and ${dec(sgn * (w + 1))}`),
        why: `The second point is ${dec(sgn * (w + 1))}, one half too far from 0. Opposites are exactly the same distance from 0.`,
      },
    ];
    const sh = shuffleOptions(r, opts, 0);
    return {
      type: 'rep',
      skill: 'rational-opposites',
      lesson: '7-2',
      title: 'Which line shows the opposites?',
      prompt: `<p>Which number line shows ${hl(dec(v))} <b>and its opposite</b>?</p><p class="muted">Each tick is 0.5.</p>`,
      options: sh.options,
      answer: sh.answer,
      layout: 'cards',
      hints: [
        'Opposites are mirror images across 0: same distance, other side.',
        `${dec(v)} is ${mag} units from 0. Look for a second point ${mag} units on the other side.`,
        `The opposite of ${dec(v)} is ${dec(-v)}. Only one line has points at both ${dec(v)} and ${dec(-v)}.`,
      ],
      solution: `<p>${dec(v)} is ${mag} units ${v < 0 ? 'left' : 'right'} of 0. Its opposite, <b>${dec(-v)}</b>, is ${mag} units ${v < 0 ? 'right' : 'left'} of 0. The other lines show a second point that is too close to or too far from 0.</p>`,
      feedback: { correct: `Correct. ${dec(v)} and ${dec(-v)} are both ${mag} units from 0.` },
    };
  });

  // ---------- Table of readings and their opposites (table) ----------
  G.define('n2_tableOpposites', (r) => {
    const vals = [];
    vals.push(drawFrac(r, 0.5, 5, vals));
    vals.push(drawFrac(r, 0.25, 4, vals));
    vals.push(drawFrac(r, 0.5, 5, vals));
    if (vals.every((v) => v < 0)) vals[1] = -vals[1];
    if (vals.every((v) => v > 0)) vals[0] = -vals[0];
    const labels = ['A', 'B', 'C'];
    const rows = [['Sample', 'Reading', 'Opposite']].concat(vals.map((v, i) => [labels[i], dec(v), `__IN:o${i}__`]));
    return {
      type: 'table',
      skill: 'rational-opposites',
      lesson: '7-2',
      title: 'Complete the opposites table',
      prompt: `<p>Each ${r.pick(CORE)} has a twin sample at the opposite position on the depth line. Complete the table.</p><p class="muted">Type decimals. Use a minus sign for negatives, like -1.5.</p>`,
      rows,
      inputs: vals.map((v, i) => ({ id: 'o' + i, answer: -v })),
      hints: [
        'The opposite of a number keeps the same digits and switches the sign.',
        `Sample A: ${dec(vals[0])} is ${dec(Math.abs(vals[0]))} units from 0, so its opposite is ${dec(-vals[0])}.`,
        `A positive reading has a negative opposite, and a negative reading has a positive opposite. Sample B: ${dec(-vals[1])}. Sample C: ${dec(-vals[2])}.`,
      ],
      solution: `<ul>${vals.map((v, i) => `<li>Sample ${labels[i]}: ${dec(v)} → <b>${dec(-v)}</b></li>`).join('')}</ul><p>Each pair is the same distance from 0 on opposite sides.</p>`,
      feedback: {
        correct: 'Correct. Opposites keep the distance from 0 and switch the sign.',
        wrong(ans, d) {
          const id = d.wrong[0];
          const i = Number(String(id).slice(1));
          const got = parseNum(ans[id]);
          if (got != null && near(got, vals[i], 0.001)) return `Sample ${labels[i]} still shows the original reading. Switch the sign to get the opposite.`;
          return `Check Sample ${labels[i]}: the opposite of ${dec(vals[i])} has the same distance from 0 (${dec(Math.abs(vals[i]))}) with the other sign.`;
        },
      },
    };
  });

  // ---------- Error: confusing the opposite with the reciprocal (error) ----------
  G.define('n2_errorReciprocal', (r) => {
    const [n, d] = r.pick([
      [3, 4],
      [1, 2],
      [2, 5],
      [1, 4],
      [3, 5],
      [5, 8],
      [1, 5],
    ]);
    const negative = r.chance(0.4);
    const v = (negative ? -1 : 1) * (n / d);
    const name = r.pick(NAMES);
    const shown = (negative ? '−' : '') + V.frac(n, d);
    const flipped = (negative ? '−' : '') + V.frac(d, n);
    const correctHtml = (negative ? '' : '−') + V.frac(n, d);
    const opts = [
      { html: `${name} flipped the fraction. That makes the reciprocal. The opposite keeps the same distance from 0 and changes the sign: ${correctHtml}.`, ok: true },
      { html: `${name} should have flipped the fraction and also changed the sign.`, why: 'Flipping is never part of finding an opposite. Only the sign changes.' },
      {
        html: `${name} is correct. The opposite of a fraction is its reciprocal.`,
        why: `The reciprocal is a different idea. ${shown} and ${flipped} are different distances from 0, so they cannot be opposites.`,
      },
      { html: `${name} should have added 1 to the fraction.`, why: 'Adding 1 moves the number, but an opposite is a reflection across 0. It never changes the distance from 0.' },
    ];
    const sh = shuffleOptions(r, opts, 0);
    return {
      type: 'error',
      skill: 'rational-opposites',
      lesson: '7-2',
      title: 'Find the mistake',
      prompt: `<p>${name} says: "The opposite of ${hlRaw(shown)} is ${hlRaw(flipped)}, because you flip the fraction."</p><p>What is the mistake?</p>`,
      work: `opposite of ${shown} &nbsp;=&nbsp; ${flipped}`,
      options: sh.options,
      answer: sh.answer,
      fix: { label: `The opposite of ${(negative ? '-' : '') + n + '/' + d} is`, answer: -v },
      hints: [
        'An opposite is the same distance from 0 on the other side. Ask: did the distance from 0 stay the same?',
        `${mixedText(v)} is ${n}/${d} of a unit from 0. ${flipped.replace(/<[^>]+>/g, '')} is a different distance from 0.`,
        `Keep ${n}/${d} and switch the sign. Type the fix as a fraction like ${(negative ? '' : '-') + n + '/' + d} or as a decimal.`,
      ],
      solution: `<p>Flipping a fraction gives its reciprocal, not its opposite. The opposite of ${shown} is the same distance from 0 with the other sign: <b>${correctHtml}</b> (${dec(-v)}).</p>`,
      feedback: {
        correct: `Correct. Opposites change the sign only. ${mixedText(v)} and ${mixedText(-v)} are both ${n}/${d} from 0.`,
        wrong(ans, d2) {
          if (!d2.mistakeOk) return (sh.options[ans.mistake] && sh.options[ans.mistake].why) || 'Think about what an opposite changes: the sign, or the fraction itself?';
          const got = parseNum(ans.fix);
          if (got != null && near(got, v, 0.001)) return 'You found the mistake. For the fix, remember the opposite has the other sign.';
          if (got != null && near(Math.abs(got), d / n, 0.001)) return 'You found the mistake, but the fix is still flipped. Keep the fraction as it is and change the sign.';
          return `You found the mistake. The fix is ${n}/${d} with a ${negative ? 'positive' : 'negative'} sign.`;
        },
      },
    };
  });
})(typeof window !== 'undefined' ? window : globalThis);

/* js/units/u7/gen-absolute.js */
/* Zone 3 — Sounding Bay. Lesson 7-3 Understand Absolute Value of Rational Numbers. */
(function (root) {
  'use strict';
  const RX = root.RX;
  const { G, V, shuffleOptions, NAMES, parseNum, near } = RX;
  const { dec, mixedText } = RX.N7;
  const hl = V.hl;

  // Real-situation pools for negative readings. Each gives a sentence for a reading of -n and the distance question.
  const ABS_CTX = [
    { read: (n) => `The depth sounder reads ${hl(dec(-n) + ' m')} for the sea floor.`, q: 'How far below the surface is the sea floor?', unit: 'm', ref: 'the surface, 0 m' },
    { read: (n) => `The outdoor thermometer reads ${hl(dec(-n) + '°C')}.`, q: 'How many degrees below 0 is the temperature?', unit: '°C', ref: '0°C' },
    { read: (n) => `A survey marker on the ice shelf is at an elevation of ${hl(dec(-n) + ' m')}.`, q: 'How far below sea level is the marker?', unit: 'm', ref: 'sea level, 0 m' },
    { read: (n) => `The station supply account shows a balance of ${hl(dec(-n) + ' dollars')}.`, q: 'How many dollars does the station owe?', unit: 'dollars', ref: 'a balance of 0 dollars' },
    { read: (n) => `A drill bit is ${hl(dec(-n) + ' m')} from the top of the ice.`, q: 'How many meters down is the drill bit?', unit: 'm', ref: 'the top of the ice, 0 m' },
  ];
  // Draw a value with magnitude in [lo, hi]; sometimes a half.
  const drawMag = (r, lo, hi, allowHalf) => (allowHalf && r.chance(0.35) ? r.int(lo, hi - 1) + 0.5 : r.int(lo, hi));
  const absLine = (pts, min, max, step, aria) =>
    V.numberLine({
      min,
      max,
      step,
      labelEvery: step < 1 ? 1 : max - min > 20 ? 5 : max - min > 12 ? 2 : 1,
      points: pts.map((p, i) => ({ v: p, label: dec(p), color: i ? '#1FA6A2' : '#C8553D' })),
      segments: pts.map((p, i) => ({ from: Math.min(0, p), to: Math.max(0, p), color: i ? '#1FA6A2' : '#C8553D' })),
      aria,
    });

  // ---------- |−7| = 7 (num) ----------
  G.define('n3_absValue', (r) => {
    const mag = drawMag(r, 2, 18, true);
    const v = r.chance(0.7) ? -mag : mag;
    const name = r.pick(NAMES);
    const bars = `|${dec(v)}|`;
    return {
      type: 'num',
      skill: 'abs-value',
      lesson: '7-3',
      title: 'Find the absolute value',
      prompt: `<p>${name} logs a sounder reading of ${hl(dec(v))}. The station computer reports the <b>absolute value</b> of every reading, written ${hl(bars)}.</p><p>What is ${hl(bars)}?</p>`,
      answer: mag,
      hints: [
        'Absolute value is the distance a number is from 0 on the number line. A distance is never negative.',
        `Find ${dec(v)} on a number line. Count the units between it and 0.`,
        `${dec(v)} is ${dec(mag)} units from 0. So ${bars} = that distance.`,
      ],
      solution: `<p>${bars} asks: how far is ${dec(v)} from 0? It is <b>${dec(mag)}</b> units away${v < 0 ? ', even though it is on the negative side' : ''}. Absolute value measures distance, so the answer is never negative.</p>${absLine([v], -20, 20, 1, `Number line showing ${dec(v)} at a distance of ${dec(mag)} from 0`)}`,
      feedback: {
        correct: `Correct. ${bars} = ${dec(mag)}: the distance from 0 is ${dec(mag)}.`,
        wrong(ans, d) {
          if (d.value != null && near(d.value, -mag, 0.001))
            return v < 0
              ? `${dec(v)} is the number itself. The absolute value bars ask for its distance from 0, and a distance is positive.`
              : `You gave the opposite of ${dec(v)}. Absolute value is the distance from 0, so it keeps ${dec(mag)} positive.`;
          if (d.value != null && near(d.value, 0, 0.001)) return `Only |0| = 0. ${dec(v)} is ${dec(mag)} units away from 0, not at 0.`;
          if (d.value != null && near(Math.abs(d.value), mag * 2, 0.001)) return `That is twice the distance. ${dec(v)} is ${dec(mag)} units from 0, counting one direction only.`;
          return `Count the units from ${dec(v)} to 0 on a number line. That count, with no sign, is the absolute value.`;
        },
      },
    };
  });

  // ---------- Absolute value in a real situation (mc) ----------
  G.define('n3_absContext', (r) => {
    const c = r.pick(ABS_CTX);
    const n = drawMag(r, 4, 60, c.unit !== 'dollars');
    const name = r.pick(NAMES);
    const opts = [
      { html: `${dec(n)} ${c.unit}`, ok: true },
      { html: `${dec(-n)} ${c.unit}`, why: `${dec(-n)} is the position of the reading. The question asks for a distance, and a distance is never negative. |${dec(-n)}| = ${dec(n)}.` },
      { html: `0 ${c.unit}`, why: `0 is the reference point (${c.ref}). The reading is ${dec(n)} units away from that point, not at it.` },
      { html: `${dec(2 * n)} ${c.unit}`, why: `${dec(2 * n)} is double the distance. From ${dec(-n)} to 0 is ${dec(n)} units in one direction.` },
    ];
    const sh = shuffleOptions(r, opts, 0);
    return {
      type: 'mc',
      skill: 'abs-value',
      lesson: '7-3',
      title: 'Distance in a real situation',
      prompt: `<p>${c.read(n)} ${name} needs the distance from ${c.ref}.</p><p>${c.q}</p>`,
      options: sh.options,
      answer: sh.answer,
      hints: [
        `The reading ${dec(-n)} tells you a position below the reference point. "How far" asks for a distance.`,
        `Distance from 0 is the absolute value: |${dec(-n)}|.`,
        `|${dec(-n)}| = ${dec(n)}. A distance has no sign.`,
      ],
      solution: `<p>The reading ${dec(-n)} means ${dec(n)} units <em>below</em> ${c.ref}. The distance is the absolute value: |${dec(-n)}| = <b>${dec(n)} ${c.unit}</b>. The negative sign shows direction (below); the absolute value shows how far.</p>`,
      feedback: { correct: `Correct. The sign tells direction. The absolute value, ${dec(n)}, tells distance.` },
    };
  });

  // ---------- True or false about absolute value (tf) ----------
  G.define('n3_tfAbs', (r) => {
    const a = drawMag(r, 2, 15, true);
    let b = drawMag(r, 2, 15, true);
    while (near(b, a)) b = drawMag(r, 2, 15, true);
    const kind = r.int(0, 3);
    let statement, answer, reasons;
    if (kind === 0) {
      statement = `|${dec(-a)}| is a negative number.`;
      answer = false;
      reasons = [
        { html: `|${dec(-a)}| is the distance from ${dec(-a)} to 0, and a distance is never negative. |${dec(-a)}| = ${dec(a)}.`, correct: true },
        { html: `The number inside the bars is negative, so the answer stays negative.` },
        { html: `Absolute value bars make every number equal to 0.` },
      ];
    } else if (kind === 1) {
      statement = `|${dec(-a)}| = |${dec(a)}|`;
      answer = true;
      reasons = [
        { html: `${dec(-a)} and ${dec(a)} are opposites. Both are ${dec(a)} units from 0, so both absolute values equal ${dec(a)}.`, correct: true },
        { html: `Any two numbers have the same absolute value.` },
        { html: `The bars cancel the numbers, so both sides equal 0.` },
      ];
    } else if (kind === 2) {
      statement = `|${dec(-a)}| = ${dec(-a)}`;
      answer = false;
      reasons = [
        { html: `|${dec(-a)}| means the distance from ${dec(-a)} to 0, which is ${dec(a)}, not ${dec(-a)}.`, correct: true },
        { html: `The statement is false because |${dec(-a)}| is ${dec(a * 2)}.` },
        { html: `Absolute value never changes a number, so it should say |${dec(-a)}| = ${dec(-a)} is true.` },
      ];
    } else {
      const big = Math.max(a, b),
        small = Math.min(a, b);
      statement = `|${dec(-big)}| > |${dec(small)}|`;
      answer = true;
      reasons = [
        { html: `|${dec(-big)}| = ${dec(big)} and |${dec(small)}| = ${dec(small)}. Since ${dec(big)} > ${dec(small)}, the statement is true.`, correct: true },
        { html: `Negative numbers always have greater absolute values than positive numbers.` },
        { html: `${dec(-big)} is less than ${dec(small)}, so its absolute value is less too.` },
      ];
    }
    const sh = shuffleOptions(r, reasons, 0);
    return {
      type: 'tf',
      skill: 'abs-value',
      lesson: '7-3',
      title: 'True or false?',
      prompt: `<p>A note is taped to the depth sounder:</p><blockquote>${hl(statement)}</blockquote><p>Is the statement true or false? Choose the best reason.</p>`,
      answer,
      reasons: sh.options,
      hints: [
        'Absolute value means distance from 0. Replace each |...| with that distance before you decide.',
        kind === 3
          ? `|${dec(-Math.max(a, b))}| = ${dec(Math.max(a, b))} and |${dec(Math.min(a, b))}| = ${dec(Math.min(a, b))}.`
          : `|${dec(-a)}| = ${dec(a)}, because ${dec(-a)} is ${dec(a)} units from 0.`,
        kind === 3
          ? `Now compare the two distances: is ${dec(Math.max(a, b))} greater than ${dec(Math.min(a, b))}?`
          : `Now reread the statement with ${dec(a)} in place of |${dec(-a)}|. Does it hold?`,
      ],
      solution: `<p>${sh.options.find((x) => x.correct).html} The statement is <b>${answer ? 'true' : 'false'}</b>.</p>`,
      feedback: {
        correct: answer ? 'Correct. Replacing each absolute value with a distance makes the statement easy to check.' : 'Correct. Absolute value is a distance, so it can never be negative.',
        wrong(ans, d) {
          if (!d.valueOk) return `Start by finding each absolute value as a distance from 0. |${dec(-a)}| is ${dec(a)}. Then decide.`;
          return 'Your true/false answer is right. Pick the reason that talks about distance from 0.';
        },
      },
    };
  });

  // ---------- Match: absolute value vs. opposite (match) ----------
  G.define('n3_matchAbs', (r) => {
    const a = r.int(2, 12);
    let b = r.int(2, 12);
    while (b === a) b = r.int(2, 12);
    let dHalf = r.int(1, 9) + 0.5;
    const left = [`|${dec(-a)}|`, `the opposite of ${dec(a)}`, `|${dec(b)}|`, `|${dec(-dHalf)}|`];
    const vals = [a, -a, b, dHalf];
    const rightOrder = r.shuffle([0, 1, 2, 3]);
    const right = rightOrder.map((i) => dec(vals[i]));
    return {
      type: 'match',
      skill: 'abs-value',
      lesson: '7-3',
      title: 'Absolute value or opposite?',
      prompt: `<p>The sounder log mixes two ideas: <b>absolute value</b> (distance from 0) and <b>opposite</b> (same distance, other side of 0). Match each expression to its value.</p>`,
      left,
      right,
      pairs: left.map((_, i) => [i, rightOrder.indexOf(i)]),
      hints: [
        'Absolute value bars |…| give a distance, which is never negative. "The opposite of" switches the sign.',
        `|${dec(-a)}| is the distance from ${dec(-a)} to 0: ${dec(a)}. The opposite of ${dec(a)} is on the other side of 0: ${dec(-a)}.`,
        `|${dec(b)}| = ${dec(b)} and |${dec(-dHalf)}| = ${dec(dHalf)}. A positive number is its own absolute value.`,
      ],
      solution: `<ul>${left.map((t, i) => `<li>${t} → <b>${dec(vals[i])}</b></li>`).join('')}</ul><p>Absolute value drops the sign because it measures distance. Taking the opposite flips the sign because it moves to the other side of 0.</p>`,
      feedback: {
        correct: 'Correct. Absolute value is a distance; the opposite is a reflection across 0.',
        wrong(ans, d) {
          const i = d.wrong[0];
          if (i === 0) return `|${dec(-a)}| asks how far ${dec(-a)} is from 0. That distance is positive.`;
          if (i === 1) return `"The opposite of ${dec(a)}" is not a distance. It is the number on the other side of 0, so it is negative.`;
          return i != null && left[i]
            ? `Check ${left[i]}. Absolute value is always the positive distance from 0.`
            : 'At least one match is off. Decide: is this a distance (absolute value) or a flip (opposite)?';
        },
      },
    };
  });

  // ---------- Total distance between points on opposite sides of 0 (num, hard = decimals) ----------
  G.define('n3_totalDistance', (r, o) => {
    const hard = !!o.hard;
    const a = hard ? drawMag(r, 2, 9, true) : r.int(2, 12);
    const b = hard ? drawMag(r, 2, 9, true) : r.int(2, 12);
    const lo = -a,
      hi = b;
    const name = r.pick(NAMES);
    const ctx = r.pick([
      { text: `A crack in the ice runs from ${hl(dec(lo) + ' m')} to ${hl(dec(hi) + ' m')} on the depth line (0 is the shelf line).`, q: 'How long is the crack, in meters?', unit: 'm' },
      { text: `Overnight the temperature at the station rose from ${hl(dec(lo) + '°C')} to ${hl(dec(hi) + '°C')}.`, q: 'How many degrees did the temperature change?', unit: '°C' },
      { text: `${name} walks along a marked line from the flag at ${hl(dec(lo))} to the flag at ${hl(dec(hi))}. Each unit is one meter.`, q: 'How far does ' + name + ' walk, in meters?', unit: 'm' },
      { text: `A cable hangs from a hook at ${hl(dec(hi) + ' m')} down to a weight at ${hl(dec(lo) + ' m')}, measured from the ice surface at 0.`, q: 'How long is the cable, in meters?', unit: 'm' },
    ]);
    const total = Math.round((a + b) * 100) / 100;
    const step = hard ? 0.5 : 1;
    const lim = hard ? 10 : 12;
    return {
      type: 'num',
      skill: 'abs-distance',
      lesson: '7-3',
      title: hard ? 'Total distance with rational numbers' : 'Total distance across zero',
      prompt: `<p>${ctx.text}</p><p>${ctx.q}</p>`,
      unit: ctx.unit,
      answer: total,
      hints: [
        'The two numbers are on opposite sides of 0. Find the distance from each one to 0, then add the two distances.',
        `|${dec(lo)}| = ${dec(a)} and |${dec(hi)}| = ${dec(b)}.`,
        `Add the two distances: ${dec(a)} + ${dec(b)}.`,
      ],
      solution: `<p>${dec(lo)} is ${dec(a)} units below 0 and ${dec(hi)} is ${dec(b)} units above 0. The total distance crosses 0, so add the absolute values: |${dec(lo)}| + |${dec(hi)}| = ${dec(a)} + ${dec(b)} = <b>${dec(total)} ${ctx.unit}</b>. You add because the path covers both pieces, one on each side of 0.</p>${absLine([lo, hi], -lim, lim, step, `Number line showing ${dec(lo)} and ${dec(hi)} with their distances to 0 marked`)}`,
      feedback: {
        correct: `Correct. ${dec(a)} + ${dec(b)} = ${dec(total)}: the two distances to 0 add up.`,
        wrong(ans, d) {
          const diff = Math.round(Math.abs(a - b) * 100) / 100;
          if (d.value != null && near(d.value, diff, 0.001) && diff !== total)
            return `You subtracted the two sizes. The points are on opposite sides of 0, so the path covers ${dec(a)} units on one side and ${dec(b)} on the other. Add them.`;
          if (d.value != null && near(d.value, -total, 0.001)) return 'The size is right, but a distance is never negative.';
          if (d.value != null && (near(d.value, a, 0.001) || near(d.value, b, 0.001))) return `That is the distance from only one point to 0. Add the other point's distance to 0 as well.`;
          return `Find how far each number is from 0 (its absolute value). Then add the two distances, because the path crosses 0.`;
        },
      },
    };
  });

  // ---------- Who found the distance correctly? (who) ----------
  G.define('n3_whoDistance', (r) => {
    const a = r.int(2, 12);
    let b = r.int(2, 12);
    while (b === a) b = r.int(2, 12);
    const [n1, n2, n3] = r.pickN(NAMES, 3);
    const thing = r.pick(['two ice markers', 'two depth flags', 'two survey stakes', 'two temperature readings']);
    const opts = [
      { title: n1, html: `|${dec(-a)}| + |${dec(b)}| = ${a} + ${b} = <b>${a + b}</b>. The points are on opposite sides of 0, so I added both distances to 0.`, ok: true },
      {
        title: n2,
        html: `${Math.max(a, b)} − ${Math.min(a, b)} = <b>${Math.abs(a - b)}</b>. I subtracted the smaller number from the bigger one.`,
        why: `Subtracting ${Math.min(a, b)} from ${Math.max(a, b)} only works when both points are on the same side of 0. Here one is negative and one is positive, so the path crosses 0 and the two distances add.`,
      },
      {
        title: n3,
        html: `${dec(-a)} and ${dec(b)} are ${a + b} apart, so the distance is <b>${dec(-(a + b))}</b> because we started at a negative number.`,
        why: `The count of ${a + b} units is right, but a distance is never negative. Starting at a negative number does not make the distance negative.`,
      },
    ];
    const sh = shuffleOptions(r, opts, 0);
    return {
      type: 'who',
      skill: 'abs-distance',
      lesson: '7-3',
      title: 'Who found the distance?',
      prompt: `<p>Three navigators find the distance between ${thing} at ${hl(dec(-a))} and ${hl(dec(b))} on a number line.</p><p>Who is correct?</p>`,
      options: sh.options,
      answer: sh.answer,
      layout: 'cards',
      hints: [
        'Sketch a number line. Mark both points. Does the path between them cross 0?',
        `${dec(-a)} is ${a} units left of 0. ${dec(b)} is ${b} units right of 0.`,
        `The path from ${dec(-a)} to ${dec(b)} covers ${a} units, then ${b} more units. Distance is positive.`,
      ],
      solution: `<p>${n1} is correct. From ${dec(-a)} to 0 is |${dec(-a)}| = ${a} units. From 0 to ${dec(b)} is |${dec(b)}| = ${b} units. The path crosses 0, so the total is ${a} + ${b} = <b>${a + b}</b>. Subtracting would only work if both points were on the same side of 0, and a distance is never negative.</p>${absLine([-a, b], -12, 12, 1, `Number line showing ${dec(-a)} and ${dec(b)} on opposite sides of 0`)}`,
      feedback: { correct: `Correct. Opposite sides of 0 means add the absolute values: ${a} + ${b} = ${a + b}.` },
    };
  });

  // ---------- Place every number with a given absolute value (nl) ----------
  G.define('n3_nlSameAbs', (r) => {
    const useHalf = r.chance(0.4);
    const k = useHalf ? r.int(1, 4) + 0.5 : r.int(2, 9);
    const name = r.pick(NAMES);
    const step = useHalf ? 0.5 : 1;
    const lim = useHalf ? 5 : 10;
    return {
      type: 'nl',
      skill: 'abs-value',
      lesson: '7-3',
      title: 'Numbers with the same absolute value',
      prompt: `<p>${name}'s sounder shows only absolute values. A reading has absolute value ${hl(dec(k))}.</p><p>Place <b>every</b> number whose absolute value is ${hl(dec(k))} on the number line.</p><p class="muted">${useHalf ? 'Each small tick is 0.5. ' : ''}Click a tick to place a point. Click it again to remove it.</p>`,
      min: -lim,
      max: lim,
      step,
      labelEvery: 1,
      count: 2,
      points: [-k, k],
      hints: [
        'Absolute value is distance from 0. Which numbers are exactly that far from 0?',
        `Start at 0 and count ${dec(k)} units to the right. Then count ${dec(k)} units to the left.`,
        `Two numbers are ${dec(k)} units from 0: one positive and one negative. They are opposites.`,
      ],
      solution: `<p>Two numbers are ${dec(k)} units from 0: <b>${dec(k)}</b> on the right and <b>${dec(-k)}</b> on the left. Both have absolute value ${dec(k)}, because absolute value measures distance, not direction. Only 0 has just one number with its absolute value.</p>${absLine([-k, k], -lim, lim, step, `Number line showing ${dec(-k)} and ${dec(k)}, both ${dec(k)} units from 0`)}`,
      feedback: {
        correct: `Correct. |${dec(-k)}| = |${dec(k)}| = ${dec(k)}. Opposites always share an absolute value.`,
        wrong(ans, d) {
          const extra = d.extra || [];
          const missing = d.missing || [];
          if (extra.some((x) => near(x, 0, 0.001))) return `|0| = 0, so 0 is not ${dec(k)} units from 0. Count ${dec(k)} units each way from 0.`;
          if (extra.some((x) => near(Math.abs(Math.abs(x) - k), step, 0.001))) return `One point is off by one tick. Each point must be exactly ${dec(k)} units from 0.`;
          if (!extra.length && missing.some((m) => m < 0)) return `You placed ${dec(k)}. There is another number ${dec(k)} units from 0, on the negative side.`;
          if (!extra.length && missing.some((m) => m > 0)) return `You placed ${dec(-k)}. There is another number ${dec(k)} units from 0, on the positive side.`;
          return `Count ${dec(k)} units to the right of 0 and ${dec(k)} units to the left of 0. Both of those numbers have absolute value ${dec(k)}.`;
        },
      },
    };
  });

  // ---------- Which is farther from 0? Explain. (cr) ----------
  G.define('n3_crFarther', (r) => {
    const name = r.pick(NAMES);
    const useDec = r.chance(0.4);
    let a = useDec ? r.int(2, 8) + 0.5 : r.int(2, 12); // magnitude of the negative number
    let b = useDec ? r.int(2, 8) + 0.5 : r.int(2, 12); // the positive number
    while (near(a, b)) b = useDec ? r.int(2, 8) + 0.5 : r.int(2, 12);
    const neg = -a;
    const farNeg = a > b;
    const far = farNeg ? neg : b;
    const close = farNeg ? b : neg;
    const ctx = r.pick([
      { what: 'two sea-floor readings', line: 'depth line' },
      { what: 'two temperature readings', line: 'thermometer' },
      { what: 'two survey flags', line: 'marked line' },
    ]);
    const opts = [
      {
        html: `${dec(far)} is farther from 0, because |${dec(far)}| = ${dec(Math.abs(far))} and |${dec(close)}| = ${dec(Math.abs(close))}, and ${dec(Math.abs(far))} > ${dec(Math.abs(close))}.`,
        ok: true,
      },
      {
        html: `${dec(b)} is farther from 0, because positive numbers are always farther from 0 than negative numbers.`,
        why: `The sign does not decide distance. ${dec(neg)} is ${dec(a)} units from 0 and ${dec(b)} is ${dec(b)} units from 0. Compare those distances.`,
      },
      {
        html: `${dec(neg)} is farther from 0, because negative numbers are less than 0, and smaller numbers are farther away.`,
        why: `"Less than" is about order on the number line, not distance from 0. ${dec(neg)} is ${dec(a)} units from 0; ${dec(b)} is ${dec(b)} units from 0. The larger absolute value is farther.`,
      },
    ];
    const sh = shuffleOptions(r, opts, 0);
    return {
      type: 'cr',
      skill: 'abs-distance',
      lesson: '7-3',
      title: 'Explain: which is farther from 0?',
      prompt: `<p>${name} compares ${ctx.what} on the ${ctx.line}: ${hl(dec(neg))} and ${hl(dec(b))}.</p><p>Which reading is farther from 0? Explain your reasoning using absolute value, then choose the correct explanation.</p>`,
      starters: [`${dec(neg)} is ___ units from 0 because …`, `The absolute value of ${dec(b)} is …`, 'The number farther from 0 is the one with …'],
      minWords: 10,
      check: { prompt: 'Which explanation is correct?', options: sh.options, answer: sh.answer },
      hints: [
        'Distance from 0 is the absolute value. Find the absolute value of each number first.',
        `|${dec(neg)}| = ${dec(a)} and |${dec(b)}| = ${dec(b)}.`,
        `Compare the distances ${dec(a)} and ${dec(b)}. The larger distance means farther from 0, no matter the sign.`,
      ],
      solution: `<p>Model: "|${dec(neg)}| = ${dec(a)} and |${dec(b)}| = ${dec(b)}. ${dec(Math.abs(far))} > ${dec(Math.abs(close))}, so <b>${dec(far)}</b> is farther from 0." The sign tells which side of 0 a number is on. Only the absolute value tells how far away it is.</p>${absLine([neg, b], useDec ? -10 : -12, useDec ? 10 : 12, useDec ? 0.5 : 1, `Number line comparing the distances of ${dec(neg)} and ${dec(b)} from 0`)}`,
      feedback: {
        correct: 'Correct. A clear explanation names both absolute values and compares them.',
        wrong(ans, d) {
          if (!d.wroteEnough) return `Write a full explanation (a few sentences). Name |${dec(neg)}| and |${dec(b)}| and compare them.`;
          return (sh.options[ans.check] && sh.options[ans.check].why) || `Compare |${dec(neg)}| = ${dec(a)} with |${dec(b)}| = ${dec(b)}.`;
        },
      },
    };
  });
})(typeof window !== 'undefined' ? window : globalThis);

/* js/units/u7/gen-compare.js */
/* Zone 4 — Windward Ridge. Lesson 7-4 Compare and Order Integers and Rational Numbers. */
(function (root) {
  'use strict';
  const RX = root.RX;
  const { G, V, shuffleOptions, NAMES, near } = RX;
  const { dec, mixedHtml, mixedText } = RX.N7;
  const hl = V.hl;

  const SENSORS = ['north tower', 'south tower', 'east ridge', 'west ridge', 'ice shelf', 'runway', 'harbor', 'summit'];
  // Draw n distinct values from a pool (with a step), rejecting duplicates.
  const drawDistinct = (r, n, make) => {
    const out = [];
    let guard = 0;
    while (out.length < n && guard++ < 200) {
      const v = make();
      if (!out.some((x) => near(x, v))) out.push(v);
    }
    return out;
  };
  const sideWord = (v) => (v < 0 ? 'left' : 'right');
  const line = (vals, min, max, step, aria) =>
    V.numberLine({
      min,
      max,
      step,
      labelEvery: step < 1 ? 1 : max - min > 16 ? 2 : 1,
      points: vals.map((v, i) => ({ v, label: mixedText(v), color: ['#C8553D', '#1FA6A2', '#17324D', '#F2A33A', '#6B7F3A'][i % 5] })),
      aria,
    });

  // ---------- Compare with < or > (cloze; hard = rational numbers, two comparisons) ----------
  G.define('n4_clozeCompare', (r, o) => {
    const hard = !!o.hard;
    const makeInt = () => (r.chance(0.65) ? -r.int(1, 12) : r.int(0, 9));
    const makeRat = () => {
      const w = r.int(0, 3);
      const f = r.pick([0.25, 0.5, 0.75, 0.2, 0.4, 0.6, 0.8]);
      const m = w + f;
      return r.chance(0.65) ? -m : m;
    };
    const pairs = [];
    const nPairs = hard ? 2 : 1;
    while (pairs.length < nPairs) {
      const [a, b] = drawDistinct(r, 2, hard ? makeRat : makeInt);
      if (hard && Math.sign(a) !== Math.sign(b) && pairs.length === 0) continue; // the first hard pair stays on one side of 0
      pairs.push([a, b]);
    }
    const name = r.pick(NAMES);
    const show = (v) => (hard && r.chance(0.5) ? mixedText(v) : dec(v));
    const shown = pairs.map(([a, b]) => [show(a), show(b)]);
    const answers = pairs.map(([a, b]) => (a < b ? 0 : 1));
    const template = pairs.map((p, i) => `${shown[i][0]} {${i}} ${shown[i][1]}`).join('     ·     ');
    const [a, b] = pairs[0];
    const explain = ([x, y]) => `${mixedText(x)} is ${x < y ? 'to the left of' : 'to the right of'} ${mixedText(y)} on the number line, so ${mixedText(x)} ${x < y ? '<' : '>'} ${mixedText(y)}`;
    const allVals = pairs.flat();
    const lim = Math.max(4, Math.ceil(Math.max(...allVals.map(Math.abs))));
    return {
      type: 'cloze',
      skill: 'compare',
      lesson: '7-4',
      title: hard ? 'Compare rational numbers' : 'Compare with < or >',
      prompt: `<p>${name} compares ${hard ? 'readings' : 'two temperature readings'} from the ridge sensors. Choose the symbol that makes each comparison true.</p><p class="muted">On a number line, the number farther left is less.</p>`,
      template,
      choices: pairs.map(() => ['<', '>']),
      answers,
      hints: [
        'Picture both numbers on a number line. The one farther to the left is less. Negative numbers are left of 0.',
        hard
          ? `${mixedText(a)} is ${mixedText(Math.abs(a))} units from 0 and ${mixedText(b)} is ${mixedText(Math.abs(b))} units from 0. ${a < 0 && b < 0 ? 'For negatives, the one farther from 0 is farther left, so it is less.' : 'Place each one on the correct side of 0 first.'}`
          : a < 0 && b < 0
            ? `Both are negative. ${dec(a)} is ${Math.abs(a)} units left of 0 and ${dec(b)} is ${Math.abs(b)} units left of 0. The one farther left is less.`
            : `${dec(Math.min(a, b))} is on the ${sideWord(Math.min(a, b))} side of 0 and ${dec(Math.max(a, b))} is ${Math.max(a, b) === 0 ? 'at 0' : 'on the ' + sideWord(Math.max(a, b)) + ' side'}. Anything left of another number is less.`,
        explain(pairs[0]) + (pairs[1] ? '. Use the same thinking for the second pair' : '') + '.',
      ],
      solution: `<p>${pairs.map((p) => explain(p)).join('. ')}. <b>${pairs.map((p) => `${mixedText(p[0])} ${p[0] < p[1] ? '<' : '>'} ${mixedText(p[1])}`).join('</b> and <b>')}</b>. The symbol opens toward the greater number.</p>${line(allVals, -lim, lim, hard ? 0.25 : 1, 'Number line showing the numbers being compared')}`,
      feedback: {
        correct: 'Correct. Left is less, right is greater, on every number line.',
        wrong(ans, d) {
          const i = (d.wrong || [0])[0] || 0;
          const [x, y] = pairs[i];
          if (x < 0 && y < 0)
            return `Both numbers are negative. ${mixedText(x)} and ${mixedText(y)}: the one farther from 0 is farther left, and farther left means less. Do not compare the sizes without the signs.`;
          if (Math.sign(x) !== Math.sign(y)) return `Every negative number is less than 0 and less than every positive number. Which of ${mixedText(x)} and ${mixedText(y)} is negative?`;
          return `Place ${mixedText(x)} and ${mixedText(y)} on a number line. The one on the left is less.`;
        },
      },
    };
  });

  // ---------- Which reading is coldest / warmest? (mc) ----------
  G.define('n4_colderMc', (r) => {
    const coldest = r.chance(0.6);
    const temps = drawDistinct(r, 4, () => (r.chance(0.7) ? -r.int(1, 20) : r.int(0, 8)));
    if (!temps.some((t) => t < 0)) temps[0] = -r.int(3, 15);
    if (!temps.some((t) => t > 0)) temps[1] = r.int(1, 8);
    const sensors = r.pickN(SENSORS, 4);
    const target = coldest ? Math.min(...temps) : Math.max(...temps);
    const absMax = temps.reduce((m, t) => (Math.abs(t) > Math.abs(m) ? t : m), temps[0]);
    const opts = temps.map((t, i) => {
      if (t === target) return { html: `${sensors[i]}: ${dec(t)}°C`, ok: true };
      let why;
      if (coldest) {
        if (t > 0) why = `${dec(t)}°C is above 0, so it is warmer than every negative reading.`;
        else if (t === 0) why = `0°C is warmer than every negative reading. Negatives are below 0.`;
        else why = `${dec(t)}°C is cold, but ${dec(target)}°C is farther left on the thermometer. The farther below 0, the colder.`;
      } else {
        if (t === absMax && t < 0) why = `${dec(t)} has the largest absolute value, but it is the farthest below 0. That makes it the coldest, not the warmest.`;
        else if (t < 0) why = `${dec(t)}°C is below 0. Any reading above it on the number line is warmer.`;
        else why = `${dec(t)}°C is warm, but ${dec(target)}°C is farther right on the number line, so it is warmer.`;
      }
      return { html: `${sensors[i]}: ${dec(t)}°C`, why };
    });
    const sh = shuffleOptions(r, opts, temps.indexOf(target));
    return {
      type: 'mc',
      skill: 'compare',
      lesson: '7-4',
      title: coldest ? 'Which sensor is coldest?' : 'Which sensor is warmest?',
      prompt: `<p>Four ridge sensors report their temperatures at the same moment.</p><p>Which sensor shows the <b>${coldest ? 'coldest' : 'warmest'}</b> temperature?</p>`,
      options: sh.options,
      answer: sh.answer,
      hints: [
        `On a thermometer, colder is lower (farther left on a number line) and warmer is higher (farther right).`,
        `Any negative temperature is colder than 0 and colder than any positive temperature. ${coldest ? 'Look only at the negative readings.' : 'Start by checking if any reading is positive.'}`,
        coldest
          ? `Among the negatives, the one with the largest absolute value is farthest below 0, so it is the coldest.`
          : `The warmest reading is farthest to the right on the number line: the greatest number.`,
      ],
      solution: `<p>Placed on a number line: ${temps
        .slice()
        .sort((x, y) => x - y)
        .map(dec)
        .join(
          ', ',
        )}. The ${coldest ? 'coldest is the least number, farthest left' : 'warmest is the greatest number, farthest right'}: <b>${dec(target)}°C</b>.${coldest && Math.abs(absMax) === Math.abs(target) ? ' For negative temperatures, a bigger absolute value means farther below 0, so colder.' : ''}</p>${line(
        temps,
        -20,
        10,
        1,
        'Number line showing the four temperatures',
      )}`,
      feedback: { correct: `Correct. ${dec(target)}°C is the ${coldest ? 'least' : 'greatest'} number, so it is the ${coldest ? 'coldest' : 'warmest'}.` },
    };
  });

  // ---------- Error: −8 > −2 because 8 > 2 (error) ----------
  G.define('n4_errorCompare', (r) => {
    const big = r.int(5, 15);
    const small = r.int(1, big - 2);
    const name = r.pick(NAMES);
    const ctx = r.pick(['temperatures', 'depth readings', 'elevation readings', 'account balances']);
    const opts = [
      {
        html: `${name} compared the absolute values ${big} and ${small} instead of the numbers. On a number line ${dec(-big)} is to the left of ${dec(-small)}, so ${dec(-big)} < ${dec(-small)}.`,
        ok: true,
      },
      {
        html: `${name} is correct. A bigger digit always means a bigger number.`,
        why: `That rule works for positive numbers only. For negatives, a bigger absolute value means farther below 0, which is less.`,
      },
      {
        html: `${name} should have written ${dec(-big)} = ${dec(-small)}, because both are negative.`,
        why: `Two different numbers are never equal. ${dec(-big)} and ${dec(-small)} are different points on the number line.`,
      },
      { html: `${name} forgot to add the two numbers first.`, why: `Comparing never requires adding. Compare positions on the number line.` },
    ];
    const sh = shuffleOptions(r, opts, 0);
    return {
      type: 'error',
      skill: 'compare',
      lesson: '7-4',
      title: 'Find the comparison mistake',
      prompt: `<p>${name} compares two ${ctx}, ${hl(dec(-big))} and ${hl(dec(-small))}, and writes:</p><p>What is the mistake?</p>`,
      work: `${dec(-big)} > ${dec(-small)}, because ${big} > ${small}.`,
      options: sh.options,
      answer: sh.answer,
      fix: { label: 'Which number is greater? Type it: ', answer: -small },
      hints: [
        'Place both numbers on a number line. Which one is farther left?',
        `${dec(-big)} is ${big} units left of 0. ${dec(-small)} is ${small} units left of 0.`,
        `${dec(-big)} is farther left, so it is less. The greater number is the one closer to 0.`,
      ],
      solution: `<p>${big} > ${small} is true, but those are the absolute values (distances from 0). The numbers themselves are negative. ${dec(-big)} is farther below 0 than ${dec(-small)}, so ${dec(-big)} is <b>less</b>: ${dec(-big)} < ${dec(-small)}. The greater number is <b>${dec(-small)}</b>, the one closer to 0.</p>${line([-big, -small], -16, 2, 1, `Number line showing ${dec(-big)} to the left of ${dec(-small)}`)}`,
      feedback: {
        correct: `Correct. For negative numbers, the one closer to 0 is greater: ${dec(-small)} > ${dec(-big)}.`,
        wrong(ans, d) {
          if (!d.mistakeOk) return (sh.options[ans.mistake] && sh.options[ans.mistake].why) || 'Think about where each number sits on a number line, not how big the digits are.';
          const got = RX.parseNum(ans.fix);
          if (got != null && got === -big) return `You found the mistake, but ${dec(-big)} is farther left on the number line, so it is the smaller number.`;
          if (got != null && got === small) return `You found the mistake. The greater number is negative: it is ${dec(-small)}, not ${small}.`;
          return `You found the mistake. Now type the greater of ${dec(-big)} and ${dec(-small)} with its minus sign.`;
        },
      },
    };
  });

  // ---------- Select all the true comparisons (ms) ----------
  G.define('n4_msTrue', (r) => {
    const makeTrue = [
      () => {
        const a = r.int(1, 9),
          b = r.int(0, 6);
        return `${dec(-a)} < ${dec(b)}`;
      },
      () => {
        const [a, b] = drawDistinct(r, 2, () => r.int(1, 12));
        return `${dec(-Math.max(a, b))} < ${dec(-Math.min(a, b))}`;
      },
      () => {
        const a = r.int(1, 12);
        return `0 > ${dec(-a)}`;
      },
      () => {
        const w = r.int(0, 3);
        return `${dec(-(w + 0.5))} > ${dec(-(w + 1))}`;
      },
      () => {
        const [a, b] = drawDistinct(r, 2, () => r.int(1, 12));
        return `${dec(-Math.min(a, b))} > ${dec(-Math.max(a, b))}`;
      },
    ];
    const makeFalse = [
      () => {
        const [a, b] = drawDistinct(r, 2, () => r.int(1, 12));
        return {
          html: `${dec(-Math.max(a, b))} > ${dec(-Math.min(a, b))}`,
          why: `${dec(-Math.max(a, b))} is farther left of 0 than ${dec(-Math.min(a, b))}, so it is less, not greater. The absolute values compare the other way.`,
        };
      },
      () => {
        const a = r.int(1, 9);
        return { html: `${dec(-a)} > 0`, why: `Every negative number is less than 0. ${dec(-a)} is ${a} units to the left of 0.` };
      },
      () => {
        const a = r.int(1, 9),
          b = r.int(1, 6);
        return { html: `${dec(-a)} > ${dec(b)}`, why: `A negative number is always less than a positive number. ${dec(-a)} is left of 0 and ${dec(b)} is right of 0.` };
      },
      () => {
        const w = r.int(0, 3);
        return { html: `${dec(-(w + 1))} > ${dec(-(w + 0.5))}`, why: `${dec(-(w + 1))} is farther from 0 on the negative side, so it is less than ${dec(-(w + 0.5))}.` };
      },
    ];
    const nTrue = r.int(2, 3);
    const trueIdx = r.pickN([0, 1, 2, 3, 4], nTrue);
    const falseIdx = r.pickN([0, 1, 2, 3], 5 - nTrue);
    const opts = [];
    const seen = new Set();
    trueIdx.forEach((i) => {
      const html = makeTrue[i]();
      if (!seen.has(html)) {
        seen.add(html);
        opts.push({ html, ok: true });
      }
    });
    falseIdx.forEach((i) => {
      const f = makeFalse[i]();
      if (!seen.has(f.html)) {
        seen.add(f.html);
        opts.push(f);
      }
    });
    const okIdx = opts.map((o2, i) => (o2.ok ? i : -1)).filter((i) => i >= 0);
    const sh = shuffleOptions(r, opts, okIdx);
    return {
      type: 'ms',
      skill: 'compare',
      lesson: '7-4',
      title: 'Which comparisons are true?',
      prompt: `<p>The wind-warning system only arms when every comparison in its settings is true. Select <b>all</b> the comparisons that are true.</p>`,
      options: sh.options,
      answers: sh.answers,
      hints: [
        'Picture each pair on a number line. The number on the left is less; the symbol opens toward the greater number.',
        'Every negative number is less than 0 and less than every positive number.',
        'When both numbers are negative, the one closer to 0 is greater. Do not compare the digits without the signs.',
      ],
      solution: `<p>True: <b>${sh.options
        .filter((o2) => o2.ok)
        .map((o2) => o2.html)
        .join('</b>, <b>')}</b>.</p><ul>${sh.options
        .filter((o2) => !o2.ok)
        .map((o2) => `<li>${o2.html} is false. ${o2.why}</li>`)
        .join('')}</ul>`,
      feedback: {
        correct: 'Correct. Left is less, right is greater. The sign matters more than the size of the digits.',
        wrong(ans, d) {
          if (d.extra && d.extra.length) return sh.options[d.extra[0]].why;
          if (d.missing && d.missing.length) return `You missed a true comparison: ${sh.options[d.missing[0]].html}. Check it on a number line.`;
          return 'Check each comparison on a number line.';
        },
      },
    };
  });

  // ---------- Order four integers (seq) ----------
  G.define('n4_seqIntegers', (r) => {
    const vals = drawDistinct(r, 4, () => (r.chance(0.7) ? -r.int(1, 15) : r.int(0, 9)));
    while (vals.filter((v) => v < 0).length < 2) {
      const v = -r.int(10, 15);
      const k = vals.findIndex((x) => x >= 0);
      if (!vals.includes(v)) vals[k] = v;
    }
    const asc = r.chance(0.6);
    const sensors = r.pickN(SENSORS, 4);
    const ctxKind = r.pick(['temp', 'elev', 'money']);
    const label = (v, i) => (ctxKind === 'temp' ? `<b>${sensors[i]}</b>: ${dec(v)}°C` : ctxKind === 'elev' ? `<b>Marker ${'ABCD'[i]}</b>: ${dec(v)} m` : `<b>Day ${i + 1}</b>: ${dec(v)} dollars`);
    const items = vals.map((v, i) => ({ html: label(v, i), rate: v }));
    const order = vals.map((_, i) => i).sort((x, y) => (asc ? vals[x] - vals[y] : vals[y] - vals[x]));
    const sorted = order.map((i) => vals[i]);
    const dirText =
      ctxKind === 'temp' ? (asc ? 'coldest (top) to warmest (bottom)' : 'warmest (top) to coldest (bottom)') : asc ? 'least (top) to greatest (bottom)' : 'greatest (top) to least (bottom)';
    return {
      type: 'seq',
      skill: 'order',
      lesson: '7-4',
      title: asc ? 'Order from least to greatest' : 'Order from greatest to least',
      prompt: `<p>${ctxKind === 'temp' ? 'Four sensors report temperatures.' : ctxKind === 'elev' ? 'Four survey markers have these elevations (0 is sea level).' : 'The supply account changed by these amounts over four days.'} Put them in order from <b>${dirText}</b>.</p>`,
      items,
      order,
      hints: [
        'Place every number on a number line. Numbers to the left are less; numbers to the right are greater.',
        `The negative numbers all come before 0 and before any positive number. ${asc ? 'The least number is the negative one farthest from 0.' : 'The greatest number is the positive one farthest from 0, or the one closest to 0 if all are negative.'}`,
        `From least to greatest the numbers are ${vals
          .slice()
          .sort((x, y) => x - y)
          .map(dec)
          .join(', ')}. ${asc ? 'That is the order from top to bottom.' : 'Reverse that for greatest to least.'}`,
      ],
      solution: `<p>On a number line the values sit at ${vals
        .slice()
        .sort((x, y) => x - y)
        .map(dec)
        .join(
          ', ',
        )}. From ${dirText}: <b>${sorted.map(dec).join(', ')}</b>. Among negatives, the one with the larger absolute value is farther left, so it is less.</p>${line(vals, -16, 10, 1, 'Number line showing the four values in order')}`,
      feedback: {
        correct: `Correct. ${sorted.map(dec).join(', ')} reads ${asc ? 'left to right' : 'right to left'} along the number line.`,
        wrong() {
          return `At least one value is out of place. Negative numbers come before positive ones, and for two negatives, the larger absolute value is the smaller number.`;
        },
      },
    };
  });

  // ---------- Order a mixed list of integers, fractions, and decimals (seq; hard = 5 close values) ----------
  G.define('n4_seqMixed', (r, o) => {
    const hard = !!o.hard;
    const pool = hard ? [-3, -2.75, -2.5, -2.25, -2, -1.75, -1.5, -1.25, -1, -0.75, -0.5, -0.25, 0, 0.25, 0.5, 0.75, 1, 1.25, 1.5] : [-3, -2.5, -2, -1.5, -1, -0.5, 0, 0.5, 1, 1.5, 2, 2.5];
    const n = hard ? 5 : 4;
    let vals = r.pickN(pool, n);
    if (!vals.some((v) => v < 0)) vals[0] = -1.5;
    if (!vals.some((v) => !Number.isInteger(v))) vals[1] = r.pick([-0.5, 0.5, -2.5]);
    vals = Array.from(new Set(vals));
    while (vals.length < n) {
      const v = r.pick(pool);
      if (!vals.includes(v)) vals.push(v);
    }
    const asc = r.chance(0.65);
    // show about half the non-integers as fractions, the rest as decimals
    const shown = vals.map((v) => (!Number.isInteger(v) && r.chance(0.5) ? mixedHtml(v) : dec(v)));
    const items = vals.map((v, i) => ({ html: shown[i], rate: v }));
    const order = vals.map((_, i) => i).sort((x, y) => (asc ? vals[x] - vals[y] : vals[y] - vals[x]));
    const sortedText = order.map((i) => mixedText(vals[i]));
    return {
      type: 'seq',
      skill: 'order',
      lesson: '7-4',
      title: hard ? 'Order five rational numbers' : 'Order the mixed readings',
      prompt: `<p>The ridge log lists readings as integers, fractions, and decimals. Put them in order from <b>${asc ? 'least (top) to greatest (bottom)' : 'greatest (top) to least (bottom)'}</b>.</p>`,
      items,
      order,
      hints: [
        'Write every number the same way, as a decimal, so you can compare. A half is 0.5, a fourth is 0.25, three fourths is 0.75.',
        `As decimals: ${vals.map(dec).join(', ')}. Now place each one on a number line.`,
        `From least to greatest: ${vals
          .slice()
          .sort((x, y) => x - y)
          .map(dec)
          .join(', ')}.${asc ? '' : ' Reverse that order.'}`,
      ],
      solution: `<p>Rewrite the fractions as decimals: ${vals.map((v, i) => (shown[i] !== dec(v) ? `${shown[i]} = ${dec(v)}` : dec(v))).join(', ')}. On a number line, from ${asc ? 'least to greatest' : 'greatest to least'}: <b>${sortedText.join(', ')}</b>. For negative numbers, the larger absolute value is farther left and therefore less.</p>${line(vals, -3, 3, 0.25, 'Number line showing the readings in order')}`,
      feedback: {
        correct: 'Correct. Changing every number to a decimal makes them easy to place on one number line.',
        wrong() {
          return 'At least one reading is out of place. Change each fraction to a decimal, then compare positions on the number line. A negative with a larger absolute value is less.';
        },
      },
    };
  });

  // ---------- Who ordered correctly? (who) ----------
  G.define('n4_whoOrder', (r) => {
    const [n1, n2, n3] = r.pickN(NAMES, 3);
    // one positive, one negative half, two negative integers, chosen so the three orderings differ
    const p = r.int(1, 4);
    const a = r.int(1, 5); // first negative integer magnitude
    const bHalf = r.pick([1.5, 2.5, 3.5, 4.5, 5.5]);
    let c = r.int(2, 9); // second negative integer magnitude
    while (c === a || near(c, bHalf)) c = r.int(2, 9);
    const vals = [p, -a, -bHalf, -c];
    const correct = vals.slice().sort((x, y) => x - y);
    const byAbs = vals.slice().sort((x, y) => Math.abs(x) - Math.abs(y)); // ordered by absolute value
    const negReversed = vals.filter((v) => v < 0).sort((x, y) => y - x); // negatives from closest to 0, then positive
    const wrong2 = negReversed.concat(vals.filter((v) => v >= 0));
    const txt = (arr) => arr.map(dec).join(', ');
    if (txt(byAbs) === txt(correct) || txt(wrong2) === txt(correct) || txt(byAbs) === txt(wrong2)) {
      // extremely unlikely with these ranges; fall back to safe values
      return G.make('n4_whoOrder', RX.R.make(r.int(1, 1e6)), {});
    }
    const opts = [
      { title: n1, html: txt(correct), ok: true },
      { title: n2, html: txt(byAbs), why: `${n2} ordered by distance from 0 (absolute value) and ignored the signs. Negative numbers are all less than positive numbers.` },
      { title: n3, html: txt(wrong2), why: `${n3} put the negatives in the wrong order. ${dec(-c)} is farther left of 0 than ${dec(-a)}, so ${dec(-c)} is the least and must come first.` },
    ];
    const sh = shuffleOptions(r, opts, 0);
    return {
      type: 'who',
      skill: 'order',
      lesson: '7-4',
      title: 'Who ordered the readings?',
      prompt: `<p>Three navigators order the readings ${hl(vals.map(dec).join(', '))} from <b>least to greatest</b>.</p><p>Who is correct?</p>`,
      options: sh.options,
      answer: sh.answer,
      layout: 'cards',
      hints: [
        'Least to greatest means left to right on a number line.',
        `All the negative numbers come first. The positive number, ${dec(p)}, is last.`,
        `Among the negatives, the one farthest from 0 is least: ${dec(correct[0])}. Then ${dec(correct[1])}, then ${dec(correct[2])}.`,
      ],
      solution: `<p>${n1} is correct: <b>${txt(correct)}</b>. Negatives come before positives. Among the negatives, the larger absolute value is farther left, so it is less. Ordering by absolute value alone, or putting the negative closest to 0 first, gives the wrong order.</p>${line(vals, -10, 5, 0.5, 'Number line showing the readings from least to greatest')}`,
      feedback: { correct: `Correct. ${txt(correct)} runs left to right along the number line.` },
    };
  });

  // ---------- Sort readings into ranges (sort) ----------
  G.define('n4_sortRange', (r) => {
    const c = r.pick([2, 3, 4, 5]);
    const kind = r.pick(['temp', 'depth']);
    const unit = kind === 'temp' ? '°C' : ' m';
    const pool = [];
    for (let v = -9; v <= 9; v += 0.5) if (Math.abs(Math.abs(v) - c) > 0.001) pool.push(v);
    const low = pool.filter((v) => v < -c),
      mid = pool.filter((v) => v > -c && v < c),
      high = pool.filter((v) => v > c);
    const chosen = r.pickN(low, 2).concat(r.pickN(mid, 2), r.pickN(high, 2));
    const binOf = (v) => (v < -c ? 0 : v < c ? 1 : 2);
    const items = r.shuffle(chosen.map((v) => ({ html: dec(v) + unit, bin: binOf(v) })));
    const bins = [`Less than ${dec(-c)}${unit}`, `Between ${dec(-c)}${unit} and ${dec(c)}${unit}`, `Greater than ${dec(c)}${unit}`];
    return {
      type: 'sort',
      skill: 'order',
      lesson: '7-4',
      title: 'Sort the readings by range',
      prompt: `<p>${kind === 'temp' ? 'The heater controller groups temperatures into three ranges.' : 'The sounder groups ice-thickness readings (0 is the shelf line) into three ranges.'} Sort each reading into its range.</p><p class="muted">"Less than ${dec(-c)}" means to the left of ${dec(-c)} on a number line.</p>`,
      bins,
      items,
      hints: [
        `Picture a number line with ${dec(-c)} and ${dec(c)} marked. Each reading falls left of ${dec(-c)}, between them, or right of ${dec(c)}.`,
        `A negative reading like ${dec(chosen[0])} is "less than ${dec(-c)}" only if it is farther from 0 than ${c} is.`,
        `Negative numbers close to 0, such as ${dec(chosen[2])}, are greater than ${dec(-c)}, so they belong in the middle range.`,
      ],
      solution: `<p>Less than ${dec(-c)}: <b>${chosen
        .filter((v) => binOf(v) === 0)
        .map(dec)
        .join(', ')}</b>. Between ${dec(-c)} and ${dec(c)}: <b>${chosen
        .filter((v) => binOf(v) === 1)
        .map(dec)
        .join(', ')}</b>. Greater than ${dec(c)}: <b>${chosen
        .filter((v) => binOf(v) === 2)
        .map(dec)
        .join(', ')}</b>. A negative number is less than ${dec(-c)} only when its absolute value is more than ${c}.</p>${line(chosen, -9, 9, 0.5, 'Number line showing the six readings')}`,
      feedback: {
        correct: 'Correct. Left of the lower boundary, between, or right of the upper boundary.',
        wrong(ans, d) {
          const i = d.wrong[0];
          const it = items[i];
          if (!it) return 'At least one reading is in the wrong range. Place it on a number line first.';
          const v = parseFloat(it.html.replace('−', '-'));
          if (v < 0 && Math.abs(v) < c) return `${it.html} is negative, but it is closer to 0 than ${dec(-c)} is. That puts it between ${dec(-c)} and ${dec(c)}.`;
          if (v < -c) return `${it.html} is farther left than ${dec(-c)} on the number line, so it is less than ${dec(-c)}.`;
          return `Check ${it.html}. Compare it with ${dec(-c)} and ${dec(c)} on a number line.`;
        },
      },
    };
  });
})(typeof window !== 'undefined' ? window : globalThis);

/* js/units/u7/gen-plane.js */
/* Zone 5 — Survey Grid. Lesson 7-5 Represent Rational Numbers on the Coordinate Plane. */
(function (root) {
  'use strict';
  const RX = root.RX;
  const { G, V, shuffleOptions, NAMES, parseNum } = RX;
  const { dec, pair, quad } = RX.N7;
  const hl = V.hl;

  const MARKERS = ['fuel cache', 'weather mast', 'ice-core site', 'radio relay', 'snow shelter', 'sled depot', 'penguin blind', 'landing flag'];
  const LIM = 5;
  const PLANE = (o) => V.graph(Object.assign({ xMin: -LIM, xMax: LIM, yMin: -LIM, yMax: LIM, size: 260 }, o));
  /** A nonzero coordinate in [-LIM, LIM]. */
  const nz = (r) => {
    const m = r.int(1, LIM);
    return r.chance(0.5) ? -m : m;
  };
  const quadName = (x, y) => {
    const q = quad(x, y);
    return q.length <= 3 ? 'Quadrant ' + q : 'the ' + q;
  };
  const moveText = (x, y) => `${Math.abs(x)} ${x < 0 ? 'left' : 'right'}, then ${Math.abs(y)} ${y < 0 ? 'down' : 'up'}`;
  const samePt = (a, b) => a[0] === b[0] && a[1] === b[1];
  /** Draw n distinct points with nonzero coordinates, no two sharing both a quadrant and a swapped twin. */
  const drawPoints = (r, n) => {
    const pts = [];
    let guard = 0;
    while (pts.length < n && guard++ < 200) {
      const p = [nz(r), nz(r)];
      if (pts.some((q) => samePt(p, q) || samePt([p[1], p[0]], q))) continue;
      pts.push(p);
    }
    return pts;
  };
  const reflect = (p, axis) => (axis === 'x' ? [p[0], -p[1]] : [-p[0], p[1]]);
  const axisRule = (axis) => (axis === 'x' ? 'Reflecting across the x-axis keeps x the same and changes the sign of y.' : 'Reflecting across the y-axis keeps y the same and changes the sign of x.');

  // ---------- Plot three markers in four quadrants (plot) ----------
  G.define('n5_plotPoints', (r) => {
    const pts = drawPoints(r, 3);
    // make sure at least two quadrants are used
    if (pts.every((p) => quad(p[0], p[1]) === quad(pts[0][0], pts[0][1]))) pts[2] = [-pts[2][0], pts[2][1]];
    const names = r.pickN(MARKERS, 3);
    const name = r.pick(NAMES);
    return {
      type: 'plot',
      skill: 'plot-points',
      lesson: '7-5',
      title: 'Plot the survey markers',
      prompt: `<p>${name} must plot three markers on the survey grid. The station is at the origin, (0, 0).</p><ul>${pts.map((p, i) => `<li>${names[i]}: ${hl(pair(p[0], p[1]))}</li>`).join('')}</ul><p>Plot all three points.</p><p class="muted">Click a grid point to place or remove a point.</p>`,
      xLabel: 'x',
      yLabel: 'y',
      xMin: -LIM,
      xMax: LIM,
      yMin: -LIM,
      yMax: LIM,
      points: pts,
      count: 3,
      hints: [
        'An ordered pair is (x, y). Start at the origin. Move left or right for x first, then up or down for y.',
        `A negative x means move left. A negative y means move down. For ${pair(pts[0][0], pts[0][1])}: ${moveText(pts[0][0], pts[0][1])}.`,
        pts
          .slice(1)
          .map((p) => `${pair(p[0], p[1])}: ${moveText(p[0], p[1])}`)
          .join('. ') + '.',
      ],
      solution: `<p>${pts.map((p, i) => `${names[i]} at <b>${pair(p[0], p[1])}</b>: ${moveText(p[0], p[1])}, so it lands in ${quadName(p[0], p[1])}.`).join(' ')} The sign of x tells left or right; the sign of y tells down or up.</p>${PLANE({ series: [{ points: pts, labels: pts.map((p) => pair(p[0], p[1])) }], aria: 'Coordinate plane with the three markers plotted' })}`,
      feedback: {
        correct: 'Correct. Left or right first for x, then up or down for y.',
        wrong(ans, d) {
          const extra = d.extra || [];
          if (extra.length) {
            const e = extra[0];
            const swapped = pts.find((p) => p[0] === e[1] && p[1] === e[0]);
            if (swapped)
              return `${pair(e[0], e[1])} has the coordinates swapped. In ${pair(swapped[0], swapped[1])}, move ${swapped[0] < 0 ? 'left' : 'right'} ${Math.abs(swapped[0])} first, then ${swapped[1] < 0 ? 'down' : 'up'} ${Math.abs(swapped[1])}.`;
            const signX = pts.find((p) => p[0] === -e[0] && p[1] === e[1]);
            if (signX) return `${pair(e[0], e[1])} is on the wrong side of the y-axis. The x-coordinate ${dec(signX[0])} means move ${signX[0] < 0 ? 'left' : 'right'}.`;
            const signY = pts.find((p) => p[0] === e[0] && p[1] === -e[1]);
            if (signY) return `${pair(e[0], e[1])} is on the wrong side of the x-axis. The y-coordinate ${dec(signY[1])} means move ${signY[1] < 0 ? 'down' : 'up'}.`;
            return `${pair(e[0], e[1])} is not one of the markers. Check each sign: negative x is left, negative y is down.`;
          }
          const m = (d.missing || [])[0];
          return m ? `You still need ${pair(m[0], m[1])}: ${moveText(m[0], m[1])}.` : 'Check each point against its ordered pair.';
        },
      },
    };
  });

  // ---------- Sort points into quadrants or onto an axis (sort) ----------
  G.define('n5_quadrantSort', (r) => {
    const pts = [];
    // one point per quadrant, one on each axis, plus one extra quadrant point
    const q1 = [r.int(1, 6), r.int(1, 6)];
    pts.push({ p: q1, bin: 0 }, { p: [-r.int(1, 6), r.int(1, 6)], bin: 1 }, { p: [-r.int(1, 6), -r.int(1, 6)], bin: 2 }, { p: [r.int(1, 6), -r.int(1, 6)], bin: 3 });
    const onX = r.chance(0.5);
    const a = r.int(1, 6) * (r.chance(0.5) ? -1 : 1);
    pts.push({ p: onX ? [a, 0] : [0, a], bin: 4 });
    const extraBin = r.int(0, 3);
    let extra;
    let guard = 0;
    do {
      const sx = extraBin === 0 || extraBin === 3 ? 1 : -1;
      const sy = extraBin <= 1 ? 1 : -1;
      extra = [sx * r.int(1, 6), sy * r.int(1, 6)];
    } while (pts.some((it) => samePt(it.p, extra)) && guard++ < 50);
    if (!pts.some((it) => samePt(it.p, extra))) pts.push({ p: extra, bin: extraBin });
    const items = r.shuffle(pts.map((it) => ({ html: pair(it.p[0], it.p[1]), bin: it.bin })));
    return {
      type: 'sort',
      skill: 'quadrants',
      lesson: '7-5',
      title: 'Sort the markers by quadrant',
      prompt: `<p>The survey grid is split into four quadrants, numbered I, II, III, and IV counterclockwise from the upper right. Sort each marker by where it sits.</p><p class="muted">A point with a 0 coordinate sits on an axis, not in a quadrant.</p>`,
      bins: ['Quadrant I', 'Quadrant II', 'Quadrant III', 'Quadrant IV', 'On an axis'],
      items,
      hints: [
        'Look at the signs. Quadrant I is (+, +). Quadrant II is (−, +). Quadrant III is (−, −). Quadrant IV is (+, −).',
        'If x is 0, the point is on the y-axis. If y is 0, the point is on the x-axis. Those points are in no quadrant.',
        `For example, ${pair(q1[0], q1[1])} has two positive coordinates, so it is in Quadrant I.`,
      ],
      solution: `<p>Signs decide the quadrant: (+, +) → I, (−, +) → II, (−, −) → III, (+, −) → IV.</p><ul>${pts.map((it) => `<li>${pair(it.p[0], it.p[1])} → <b>${it.bin === 4 ? 'on the ' + quad(it.p[0], it.p[1]) : 'Quadrant ' + quad(it.p[0], it.p[1])}</b></li>`).join('')}</ul>${PLANE(
        {
          xMin: -6,
          xMax: 6,
          yMin: -6,
          yMax: 6,
          series: [{ points: pts.map((it) => it.p), labels: pts.map((it) => pair(it.p[0], it.p[1])) }],
          aria: 'Coordinate plane showing every marker in its quadrant or on an axis',
        },
      )}`,
      feedback: {
        correct: 'Correct. The two signs name the quadrant, and a 0 puts the point on an axis.',
        wrong(ans, d) {
          const i = d.wrong[0];
          const it = items[i];
          if (!it) return 'At least one marker is in the wrong place. Check the signs of x and y.';
          if (it.bin === 4) return `${it.html} has a coordinate of 0, so it sits on an axis. Points on an axis are in no quadrant.`;
          const [x, y] = it.html.replace(/[()]/g, '').replace(/−/g, '-').split(',').map(Number);
          return `${it.html}: x is ${x < 0 ? 'negative (left)' : 'positive (right)'} and y is ${y < 0 ? 'negative (down)' : 'positive (up)'}. That is Quadrant ${quad(x, y)}.`;
        },
      },
    };
  });

  // ---------- Read the coordinates of a plotted point (blanks) ----------
  G.define('n5_readCoords', (r) => {
    const p = [nz(r), nz(r)];
    const marker = r.pick(MARKERS);
    const name = r.pick(NAMES);
    return {
      type: 'blanks',
      skill: 'plot-points',
      lesson: '7-5',
      title: 'Read the ordered pair',
      prompt: `<p>${name} spots the ${marker} on the survey grid, marked P.</p>${PLANE({ series: [{ points: [p], labels: ['P'] }], aria: `Coordinate plane with point P in Quadrant ${quad(p[0], p[1])}` })}<p>Write the ordered pair for point P.</p><p class="muted">Type a negative coordinate with a minus sign, like -3.</p>`,
      template: 'P = ({0}, {1})',
      fields: [
        { label: 'x', answer: p[0], width: 'xs' },
        { label: 'y', answer: p[1], width: 'xs' },
      ],
      hints: [
        'Start at the origin. How far left or right is P? That is x. Then how far up or down? That is y.',
        `P is ${Math.abs(p[0])} units to the ${p[0] < 0 ? 'left' : 'right'} of the y-axis, so x is ${p[0] < 0 ? 'negative' : 'positive'}.`,
        `P is ${Math.abs(p[1])} units ${p[1] < 0 ? 'below' : 'above'} the x-axis, so y is ${dec(p[1])}.`,
      ],
      solution: `<p>From the origin, P is ${moveText(p[0], p[1])}. So P = <b>${pair(p[0], p[1])}</b>. Left means a negative x; down means a negative y. P is in ${quadName(p[0], p[1])}.</p>`,
      feedback: {
        correct: `Correct. P = ${pair(p[0], p[1])}: ${moveText(p[0], p[1])}.`,
        wrong(ans, d) {
          const gx = parseNum(ans[0]),
            gy = parseNum(ans[1]);
          if (gx === p[1] && gy === p[0]) return 'You swapped the coordinates. The first number is the left-right position (x). The second is the up-down position (y).';
          if (gx === -p[0] && gy === p[1]) return `The x-coordinate has the wrong sign. P is to the ${p[0] < 0 ? 'left' : 'right'} of the y-axis, so x is ${p[0] < 0 ? 'negative' : 'positive'}.`;
          if (gx === p[0] && gy === -p[1]) return `The y-coordinate has the wrong sign. P is ${p[1] < 0 ? 'below' : 'above'} the x-axis, so y is ${p[1] < 0 ? 'negative' : 'positive'}.`;
          const i = d.wrong[0];
          return i === 0
            ? 'Check x: count the units left or right from the y-axis, and use a minus sign for left.'
            : 'Check y: count the units up or down from the x-axis, and use a minus sign for down.';
        },
      },
    };
  });

  // ---------- Which quadrant holds this point? (mc) ----------
  G.define('n5_quadrantMc', (r) => {
    const p = [nz(r), nz(r)];
    const marker = r.pick(MARKERS);
    const correct = quad(p[0], p[1]);
    const qOf = (x, y) => quad(x, y);
    const whys = {};
    whys[qOf(-p[0], p[1])] = `That is where the point would be if x had the other sign. x = ${dec(p[0])} means move ${p[0] < 0 ? 'left' : 'right'}.`;
    whys[qOf(p[0], -p[1])] = `That is where the point would be if y had the other sign. y = ${dec(p[1])} means move ${p[1] < 0 ? 'down' : 'up'}.`;
    whys[qOf(p[1], p[0])] = `That is the quadrant of ${pair(p[1], p[0])}, the swapped pair. The first coordinate is x (left-right), the second is y (up-down).`;
    whys[qOf(-p[0], -p[1])] = `That is the quadrant of ${pair(-p[0], -p[1])}, both signs flipped. Read each sign carefully.`;
    const opts = ['I', 'II', 'III', 'IV'].map((qn) =>
      qn === correct ? { html: `Quadrant ${qn}`, ok: true } : { html: `Quadrant ${qn}`, why: whys[qn] || `Quadrant ${qn} has different signs from ${pair(p[0], p[1])}.` },
    );
    const sh = shuffleOptions(r, opts, ['I', 'II', 'III', 'IV'].indexOf(correct));
    return {
      type: 'mc',
      skill: 'quadrants',
      lesson: '7-5',
      title: 'Name the quadrant',
      prompt: `<p>The ${marker} is at ${hl(pair(p[0], p[1]))} on the survey grid.</p><p>Which quadrant holds this point?</p>`,
      options: sh.options,
      answer: sh.answer,
      hints: [
        'The signs of the two coordinates decide the quadrant. Quadrant I is upper right (+, +). The numbers go counterclockwise.',
        `x = ${dec(p[0])} is ${p[0] < 0 ? 'negative, so the point is left of the y-axis' : 'positive, so the point is right of the y-axis'}. y = ${dec(p[1])} is ${p[1] < 0 ? 'negative, so it is below the x-axis' : 'positive, so it is above the x-axis'}.`,
        `${p[0] < 0 ? 'Left' : 'Right'} and ${p[1] < 0 ? 'below' : 'above'}: that corner of the plane is Quadrant ${correct}.`,
      ],
      solution: `<p>${pair(p[0], p[1])} is ${moveText(p[0], p[1])} from the origin. That is the ${p[1] < 0 ? 'lower' : 'upper'} ${p[0] < 0 ? 'left' : 'right'} region: <b>Quadrant ${correct}</b>. Sign pattern: (${p[0] < 0 ? '−' : '+'}, ${p[1] < 0 ? '−' : '+'}).</p>${PLANE({ series: [{ points: [p], labels: [pair(p[0], p[1])] }], aria: `Coordinate plane showing the point in Quadrant ${correct}` })}`,
      feedback: { correct: `Correct. (${p[0] < 0 ? '−' : '+'}, ${p[1] < 0 ? '−' : '+'}) is the sign pattern for Quadrant ${correct}.` },
    };
  });

  // ---------- Plot the reflection of a given point (plot) ----------
  G.define('n5_reflectPlot', (r) => {
    const p = [nz(r), nz(r)];
    const axis = r.pick(['x', 'y']);
    const q = reflect(p, axis);
    const marker = r.pick(MARKERS);
    const other = reflect(p, axis === 'x' ? 'y' : 'x');
    return {
      type: 'plot',
      skill: 'reflect',
      lesson: '7-5',
      title: `Reflect across the ${axis}-axis`,
      prompt: `<p>The ${marker} at ${hl(pair(p[0], p[1]))} has a mirror twin on the other side of the <b>${axis}-axis</b>. The original point is drawn in gray.</p><p>Plot the reflection of ${hl(pair(p[0], p[1]))} across the ${axis}-axis.</p>`,
      xLabel: 'x',
      yLabel: 'y',
      xMin: -LIM,
      xMax: LIM,
      yMin: -LIM,
      yMax: LIM,
      given: [p],
      givenLabels: [pair(p[0], p[1])],
      points: [q],
      count: 1,
      hints: [
        `A reflection is a mirror image. The ${axis}-axis is the mirror. The new point is the same distance from the ${axis}-axis, on the other side.`,
        axisRule(axis),
        `Start with ${pair(p[0], p[1])}. ${axis === 'x' ? `Keep x = ${dec(p[0])} and flip y to ${dec(q[1])}.` : `Keep y = ${dec(p[1])} and flip x to ${dec(q[0])}.`}`,
      ],
      solution: `<p>${pair(p[0], p[1])} is ${Math.abs(axis === 'x' ? p[1] : p[0])} units from the ${axis}-axis. Its mirror image is ${Math.abs(axis === 'x' ? p[1] : p[0])} units on the other side: <b>${pair(q[0], q[1])}</b>. ${axisRule(axis)}</p>${PLANE(
        {
          series: [
            { points: [p], color: '#5B6B7A', labels: [pair(p[0], p[1])] },
            { points: [q], labels: [pair(q[0], q[1])] },
          ],
          aria: `Coordinate plane showing ${pair(p[0], p[1])} and its reflection ${pair(q[0], q[1])} across the ${axis}-axis`,
        },
      )}`,
      feedback: {
        correct: `Correct. ${pair(q[0], q[1])} is the mirror image of ${pair(p[0], p[1])} across the ${axis}-axis.`,
        wrong(ans, d) {
          const e = (d.extra || [])[0];
          if (!e) return `Place one point: the mirror image of ${pair(p[0], p[1])} across the ${axis}-axis.`;
          if (samePt(e, other))
            return `That is the reflection across the ${axis === 'x' ? 'y' : 'x'}-axis. The mirror here is the ${axis}-axis, so ${axis === 'x' ? 'y' : 'x'} changes sign, not ${axis}.`;
          if (samePt(e, [-p[0], -p[1]])) return `You flipped both signs. Only one coordinate changes when you reflect across one axis. ${axisRule(axis)}`;
          if (samePt(e, p)) return `That is the original point. The reflection sits on the other side of the ${axis}-axis.`;
          return `${pair(e[0], e[1])} is not the mirror image. ${axisRule(axis)}`;
        },
      },
    };
  });

  // ---------- Write the reflected coordinates (blanks; hard = reflect across both axes) ----------
  G.define('n5_reflectBlanks', (r, o) => {
    const hard = !!o.hard;
    const p = [nz(r), nz(r)];
    const axis = r.pick(['x', 'y']);
    const first = reflect(p, axis);
    const q = hard ? reflect(first, axis === 'x' ? 'y' : 'x') : first;
    const second = axis === 'x' ? 'y' : 'x';
    const marker = r.pick(MARKERS);
    const name = r.pick(NAMES);
    return {
      type: 'blanks',
      skill: 'reflect',
      lesson: '7-5',
      title: hard ? 'Reflect across both axes' : `Reflect across the ${axis}-axis`,
      prompt: hard
        ? `<p>${name} reflects the ${marker} at ${hl(pair(p[0], p[1]))} across the <b>${axis}-axis</b>, then reflects the new point across the <b>${second}-axis</b>.</p><p>Write the coordinates of the final point.</p>`
        : `<p>${name} reflects the ${marker} at ${hl(pair(p[0], p[1]))} across the <b>${axis}-axis</b>.</p><p>Write the coordinates of the reflected point.</p><p class="muted">Type a negative coordinate with a minus sign, like -3.</p>`,
      template: '({0}, {1})',
      fields: [
        { label: 'x', answer: q[0], width: 'xs' },
        { label: 'y', answer: q[1], width: 'xs' },
      ],
      hints: [
        `A reflection across an axis changes the sign of one coordinate. ${axisRule(axis)}`,
        `${pair(p[0], p[1])} across the ${axis}-axis becomes ${pair(first[0], first[1])}.${hard ? ` Now reflect ${pair(first[0], first[1])} across the ${second}-axis.` : ''}`,
        hard
          ? `${axisRule(second)} So change the sign of ${second} in ${pair(first[0], first[1])}.`
          : `Only the ${axis === 'x' ? 'y' : 'x'}-coordinate changes sign. The other coordinate stays ${dec(axis === 'x' ? p[0] : p[1])}.`,
      ],
      solution: hard
        ? `<p>Across the ${axis}-axis: ${pair(p[0], p[1])} → ${pair(first[0], first[1])} (${axis === 'x' ? 'y' : 'x'} changes sign). Then across the ${second}-axis: ${pair(first[0], first[1])} → <b>${pair(q[0], q[1])}</b>. After both reflections, both signs have changed, so the final point is the opposite of the original in both coordinates.</p>`
        : `<p>${axisRule(axis)} ${pair(p[0], p[1])} → <b>${pair(q[0], q[1])}</b>. Both points are ${Math.abs(axis === 'x' ? p[1] : p[0])} units from the ${axis}-axis, on opposite sides.</p>${PLANE({
            series: [
              { points: [p], color: '#5B6B7A', labels: [pair(p[0], p[1])] },
              { points: [q], labels: [pair(q[0], q[1])] },
            ],
            aria: `Coordinate plane showing ${pair(p[0], p[1])} and its reflection ${pair(q[0], q[1])}`,
          })}`,
      feedback: {
        correct: hard
          ? `Correct. Two reflections, one across each axis, change both signs: ${pair(q[0], q[1])}.`
          : `Correct. ${pair(q[0], q[1])}: the ${axis === 'x' ? 'y' : 'x'}-coordinate changed sign.`,
        wrong(ans) {
          const gx = parseNum(ans[0]),
            gy = parseNum(ans[1]);
          if (gx === p[0] && gy === p[1])
            return hard
              ? 'That is the original point. Each reflection changes one sign, so two reflections change both.'
              : `That is the original point. Reflecting across the ${axis}-axis changes the sign of ${axis === 'x' ? 'y' : 'x'}.`;
          if (!hard && gx === -p[0] && gy === -p[1]) return `You changed both signs. Reflecting across one axis changes only one coordinate. ${axisRule(axis)}`;
          if (!hard && samePt([gx, gy], reflect(p, second)))
            return `You reflected across the ${second}-axis. The mirror here is the ${axis}-axis, so ${axis === 'x' ? 'y' : 'x'} changes sign instead.`;
          if (hard && samePt([gx, gy], first)) return `${pair(first[0], first[1])} is the point after the first reflection. Now reflect it across the ${second}-axis too.`;
          if (gx === q[1] && gy === q[0]) return 'You have the right numbers but swapped x and y. A reflection never swaps the coordinates.';
          return hard ? 'Do one reflection at a time. Each one changes the sign of exactly one coordinate.' : `Keep ${axis} the same and change the sign of the other coordinate.`;
        },
      },
    };
  });

  // ---------- Error: changed the wrong coordinate (error) ----------
  G.define('n5_reflectError', (r) => {
    const p = [nz(r), nz(r)];
    const axis = r.pick(['x', 'y']);
    const correct = reflect(p, axis);
    const wrongPt = reflect(p, axis === 'x' ? 'y' : 'x');
    const name = r.pick(NAMES);
    const changed = axis === 'x' ? 'x' : 'y'; // the coordinate the student wrongly changed
    const should = axis === 'x' ? 'y' : 'x';
    const opts = [
      {
        html: `${name} changed the sign of ${changed} instead of ${should}. The ${axis}-axis is the mirror, so the point moves ${axis === 'x' ? 'up or down' : 'left or right'} across it, and only ${should} changes sign.`,
        ok: true,
      },
      { html: `${name} should have changed the signs of both coordinates.`, why: 'Reflecting across one axis flips the point over one line, so exactly one coordinate changes sign.' },
      {
        html: `${name} is correct. Reflecting across the ${axis}-axis changes the ${changed}-coordinate.`,
        why: `Reflecting across the ${axis}-axis moves the point to the other side of that axis, which changes ${should}, not ${changed}. ${name}'s point is actually the reflection across the ${should}-axis.`,
      },
      { html: `${name} should have swapped the two coordinates.`, why: 'A reflection across an axis never swaps x and y. It changes the sign of one coordinate.' },
    ];
    const sh = shuffleOptions(r, opts, 0);
    const fixCoord = axis === 'x' ? 1 : 0;
    return {
      type: 'error',
      skill: 'reflect',
      lesson: '7-5',
      title: 'Find the reflection mistake',
      prompt: `<p>${name} reflects the point ${hl(pair(p[0], p[1]))} across the <b>${axis}-axis</b> and writes this result.</p><p>What is the mistake?</p>`,
      work: `${pair(p[0], p[1])} → ${pair(wrongPt[0], wrongPt[1])}`,
      options: sh.options,
      answer: sh.answer,
      fix: { label: `Correct ${should}-coordinate of the reflected point: `, answer: correct[fixCoord] },
      hints: [
        `The ${axis}-axis is the mirror. Picture ${pair(p[0], p[1])} flipping over the ${axis}-axis. Which direction does it move?`,
        `Flipping over the ${axis}-axis moves the point ${axis === 'x' ? 'from above to below (or below to above)' : 'from right to left (or left to right)'}. That changes the ${should}-coordinate.`,
        `${axisRule(axis)} The reflection of ${pair(p[0], p[1])} is ${pair(correct[0], correct[1])}.`,
      ],
      solution: `<p>${axisRule(axis)} ${name} changed ${changed} instead, which gives the reflection across the ${should}-axis. The correct reflection is <b>${pair(correct[0], correct[1])}</b>, so the ${should}-coordinate should be <b>${dec(correct[fixCoord])}</b>.</p>${PLANE(
        {
          series: [
            { points: [p], color: '#5B6B7A', labels: [pair(p[0], p[1])] },
            { points: [correct], labels: [pair(correct[0], correct[1])] },
            { points: [wrongPt], color: '#C8553D', labels: [pair(wrongPt[0], wrongPt[1]) + ' (wrong)'] },
          ],
          aria: `Coordinate plane showing the original point, the correct reflection, and ${name}'s incorrect point`,
        },
      )}`,
      feedback: {
        correct: `Correct. Across the ${axis}-axis, ${should} changes sign: ${pair(correct[0], correct[1])}.`,
        wrong(ans, d) {
          if (!d.mistakeOk) return (sh.options[ans.mistake] && sh.options[ans.mistake].why) || `Picture the point flipping over the ${axis}-axis. Which coordinate changes?`;
          const got = parseNum(ans.fix);
          if (got != null && got === p[fixCoord]) return `You found the mistake. For the fix, the ${should}-coordinate must change sign: it becomes ${dec(correct[fixCoord])}.`;
          return `You found the mistake. The fix is the opposite of ${dec(p[fixCoord])}.`;
        },
      },
    };
  });

  // ---------- Table of points and their reflections (table) ----------
  G.define('n5_reflectTable', (r) => {
    const axis = r.pick(['x', 'y']);
    const pts = drawPoints(r, 3);
    const refl = pts.map((p) => reflect(p, axis));
    const labels = ['A', 'B', 'C'];
    const rows = [['Marker', 'Original', 'Reflected x', 'Reflected y']].concat(pts.map((p, i) => [labels[i], pair(p[0], p[1]), `__IN:x${i}__`, `__IN:y${i}__`]));
    const inputs = [];
    refl.forEach((q, i) => {
      inputs.push({ id: 'x' + i, answer: q[0] }, { id: 'y' + i, answer: q[1] });
    });
    return {
      type: 'table',
      skill: 'reflect',
      lesson: '7-5',
      title: `Reflect three markers across the ${axis}-axis`,
      prompt: `<p>Markers A, B, and C sit at ${pts.map((p) => hl(pair(p[0], p[1]))).join(', ')}. Each has a mirror twin across the <b>${axis}-axis</b>. Complete the table with the coordinates of each reflected marker.</p><p class="muted">Type negatives with a minus sign, like -4.</p>`,
      rows,
      inputs,
      hints: [
        axisRule(axis),
        `Marker A: ${pair(pts[0][0], pts[0][1])} → keep ${axis} = ${dec(axis === 'x' ? pts[0][0] : pts[0][1])}, change the sign of ${axis === 'x' ? 'y' : 'x'}.`,
        `Marker A becomes ${pair(refl[0][0], refl[0][1])}. Do the same for B and C: one coordinate stays, the other flips sign.`,
      ],
      solution: `<ul>${pts.map((p, i) => `<li>${labels[i]}: ${pair(p[0], p[1])} → <b>${pair(refl[i][0], refl[i][1])}</b></li>`).join('')}</ul><p>${axisRule(axis)} Each marker and its twin are the same distance from the ${axis}-axis.</p>${PLANE(
        {
          series: [
            { points: pts, color: '#5B6B7A', labels: labels },
            { points: refl, labels: labels.map((l) => l + "'") },
          ],
          aria: `Coordinate plane showing markers A, B, C and their reflections across the ${axis}-axis`,
        },
      )}`,
      feedback: {
        correct: `Correct. Across the ${axis}-axis, only the ${axis === 'x' ? 'y' : 'x'}-coordinate changes sign.`,
        wrong(ans, d) {
          const id = String(d.wrong[0]);
          const i = Number(id.slice(1));
          const coord = id[0];
          const got = parseNum(ans[id]);
          const want = coord === 'x' ? refl[i][0] : refl[i][1];
          if (got != null && got === -want) {
            return coord === axis
              ? `Marker ${labels[i]}: the ${coord}-coordinate stays the same when you reflect across the ${axis}-axis. Only the other coordinate changes sign.`
              : `Marker ${labels[i]}: the ${coord}-coordinate must change sign. The point moves to the other side of the ${axis}-axis.`;
          }
          return `Check marker ${labels[i]}. ${axisRule(axis)}`;
        },
      },
    };
  });
})(typeof window !== 'undefined' ? window : globalThis);

/* js/units/u7/gen-distance.js */
/* Zone 6 — Crevasse Crossing. Lesson 7-6 Determine Distance on the Coordinate Plane. */
(function (root) {
  'use strict';
  const RX = root.RX;
  const { G, V, shuffleOptions, NAMES, parseNum, near } = RX;
  const { dec, pair } = RX.N7;
  const hl = V.hl;

  const LIM = 6;
  const PLANE = (o) => V.graph(Object.assign({ xMin: -LIM, xMax: LIM, yMin: -LIM, yMax: LIM, size: 260 }, o));
  const FLAGS = ['red flag', 'blue flag', 'yellow flag', 'green flag', 'orange flag', 'white flag'];
  const nzIn = (r, lo, hi) => {
    const m = r.int(lo, hi);
    return r.chance(0.5) ? -m : m;
  };
  /** Two distinct coordinates on one axis; `cross` forces opposite signs, `same` forces the same side. */
  const twoCoords = (r, mode) => {
    let a, b;
    let guard = 0;
    do {
      a = nzIn(r, 1, LIM);
      b = nzIn(r, 1, LIM);
      guard++;
    } while ((a === b || (mode === 'cross' && Math.sign(a) === Math.sign(b)) || (mode === 'same' && Math.sign(a) !== Math.sign(b))) && guard < 100);
    return [a, b];
  };
  const dist1 = (a, b) => Math.abs(a - b);
  /** Explanation of a one-dimensional distance between coordinates a and b. */
  const explain1 = (a, b, coordName) =>
    Math.sign(a) !== Math.sign(b)
      ? `The ${coordName}-coordinates ${dec(a)} and ${dec(b)} are on opposite sides of 0, so add the absolute values: |${dec(a)}| + |${dec(b)}| = ${Math.abs(a)} + ${Math.abs(b)} = ${dist1(a, b)}`
      : `The ${coordName}-coordinates ${dec(a)} and ${dec(b)} are on the same side of 0, so subtract the absolute values: |${dec(Math.abs(a) > Math.abs(b) ? a : b)}| − |${dec(Math.abs(a) > Math.abs(b) ? b : a)}| = ${Math.max(Math.abs(a), Math.abs(b))} − ${Math.min(Math.abs(a), Math.abs(b))} = ${dist1(a, b)}`;
  const segPlane = (p, q, extra) =>
    PLANE(
      Object.assign(
        {
          series: [{ points: [p, q], line: true, labels: [pair(p[0], p[1]), pair(q[0], q[1])] }],
          aria: `Coordinate plane showing a segment from ${pair(p[0], p[1])} to ${pair(q[0], q[1])}`,
        },
        extra || {},
      ),
    );

  // ---------- Horizontal distance (num; hard = crosses the y-axis with a word problem, no picture) ----------
  G.define('n6_distanceH', (r, o) => {
    const hard = !!o.hard;
    const [x1, x2] = twoCoords(r, hard ? 'cross' : r.pick(['cross', 'same', 'any']));
    const y = nzIn(r, 1, LIM);
    const p = [x1, y],
      q = [x2, y];
    const d = dist1(x1, x2);
    const [f1, f2] = r.pickN(FLAGS, 2);
    const name = r.pick(NAMES);
    return {
      type: 'num',
      skill: 'distance-plane',
      lesson: '7-6',
      title: hard ? 'Distance across the y-axis' : 'Distance between two markers',
      prompt: hard
        ? `<p>${name} must run a cable between the ${f1} at ${hl(pair(p[0], p[1]))} and the ${f2} at ${hl(pair(q[0], q[1]))}. Each grid unit is 1 meter.</p><p>How long is the cable, in meters?</p>`
        : `<p>The ${f1} is at ${hl(pair(p[0], p[1]))} and the ${f2} is at ${hl(pair(q[0], q[1]))}. Each grid unit is 1 meter.</p>${segPlane(p, q)}<p>How far apart are the two flags, in meters?</p>`,
      unit: 'm',
      answer: d,
      hints: [
        'Both points have the same y-coordinate, so they sit on one horizontal line. Only the x-coordinates differ.',
        Math.sign(x1) !== Math.sign(x2)
          ? `The x-coordinates ${dec(x1)} and ${dec(x2)} are on opposite sides of the y-axis. Find each one's distance from 0 and add.`
          : `The x-coordinates ${dec(x1)} and ${dec(x2)} are on the same side of the y-axis. Find each one's distance from 0 and subtract.`,
        Math.sign(x1) !== Math.sign(x2) ? `|${dec(x1)}| + |${dec(x2)}| = ${Math.abs(x1)} + ${Math.abs(x2)}.` : `${Math.max(Math.abs(x1), Math.abs(x2))} − ${Math.min(Math.abs(x1), Math.abs(x2))}.`,
      ],
      solution: `<p>The points share y = ${dec(y)}, so the distance is the gap between the x-coordinates. ${explain1(x1, x2, 'x')}. The flags are <b>${d} m</b> apart. Counting the grid squares between them gives the same answer.</p>${hard ? segPlane(p, q) : ''}`,
      feedback: {
        correct: `Correct. The distance between x = ${dec(x1)} and x = ${dec(x2)} is ${d} units.`,
        wrong(ans, d2) {
          const v = d2.value;
          const sub = Math.abs(Math.abs(x1) - Math.abs(x2)),
            add = Math.abs(x1) + Math.abs(x2);
          if (v != null && Math.sign(x1) !== Math.sign(x2) && near(v, sub, 0.001))
            return `You subtracted. The points are on opposite sides of the y-axis, so the cable covers ${Math.abs(x1)} units on one side and ${Math.abs(x2)} on the other. Add them.`;
          if (v != null && Math.sign(x1) === Math.sign(x2) && near(v, add, 0.001))
            return `You added. Both points are on the same side of the y-axis, so the distance is the difference of the two distances from 0.`;
          if (v != null && near(v, -d, 0.001)) return 'A distance is never negative.';
          if (v != null && near(v, d + 1, 0.001)) return 'One too many. Count the spaces between the points, not the points themselves.';
          if (v != null && near(v, d - 1, 0.001)) return 'One too few. Count every grid space from one point to the other.';
          if (v != null && near(v, Math.abs(y), 0.001)) return `${Math.abs(y)} is the distance from the x-axis, not between the flags. Use the x-coordinates.`;
          return `The two points share a y-coordinate. Find the distance between ${dec(x1)} and ${dec(x2)} on the x-axis.`;
        },
      },
    };
  });

  // ---------- Vertical distance (num) ----------
  G.define('n6_distanceV', (r) => {
    const [y1, y2] = twoCoords(r, r.pick(['cross', 'same', 'any']));
    const x = nzIn(r, 1, LIM);
    const p = [x, y1],
      q = [x, y2];
    const d = dist1(y1, y2);
    const ctx = r.pick([
      { a: 'drill tower', b: 'supply tent', what: 'a path' },
      { a: 'anemometer', b: 'generator shed', what: 'a power line' },
      { a: 'north marker', b: 'south marker', what: 'a rope guide' },
      { a: 'radio mast', b: 'fuel depot', what: 'a cable' },
    ]);
    return {
      type: 'num',
      skill: 'distance-plane',
      lesson: '7-6',
      title: 'Distance along a vertical line',
      prompt: `<p>The ${ctx.a} is at ${hl(pair(p[0], p[1]))} and the ${ctx.b} is at ${hl(pair(q[0], q[1]))}. Each grid unit is 1 meter. The crew needs ${ctx.what} straight between them.</p>${segPlane(p, q)}<p>How long is ${ctx.what}, in meters?</p>`,
      unit: 'm',
      answer: d,
      hints: [
        'Both points have the same x-coordinate, so they line up vertically. Only the y-coordinates differ.',
        Math.sign(y1) !== Math.sign(y2)
          ? `The y-coordinates ${dec(y1)} and ${dec(y2)} are on opposite sides of the x-axis. Add their distances from 0.`
          : `The y-coordinates ${dec(y1)} and ${dec(y2)} are on the same side of the x-axis. Subtract their distances from 0.`,
        Math.sign(y1) !== Math.sign(y2) ? `|${dec(y1)}| + |${dec(y2)}| = ${Math.abs(y1)} + ${Math.abs(y2)}.` : `${Math.max(Math.abs(y1), Math.abs(y2))} − ${Math.min(Math.abs(y1), Math.abs(y2))}.`,
      ],
      solution: `<p>The points share x = ${dec(x)}, so the distance is the gap between the y-coordinates. ${explain1(y1, y2, 'y')}. ${ctx.what.charAt(0).toUpperCase() + ctx.what.slice(1)} is <b>${d} m</b> long.</p>`,
      feedback: {
        correct: `Correct. From y = ${dec(y1)} to y = ${dec(y2)} is ${d} units.`,
        wrong(ans, d2) {
          const v = d2.value;
          const sub = Math.abs(Math.abs(y1) - Math.abs(y2)),
            add = Math.abs(y1) + Math.abs(y2);
          if (v != null && Math.sign(y1) !== Math.sign(y2) && near(v, sub, 0.001))
            return `You subtracted. The points are on opposite sides of the x-axis, so add the two distances from 0: ${Math.abs(y1)} + ${Math.abs(y2)}.`;
          if (v != null && Math.sign(y1) === Math.sign(y2) && near(v, add, 0.001))
            return `You added. Both points are on the same side of the x-axis, so subtract the smaller distance from 0 from the larger one.`;
          if (v != null && near(v, Math.abs(x), 0.001)) return `${Math.abs(x)} is the distance from the y-axis, not between the two points. Use the y-coordinates.`;
          if (v != null && (near(v, d + 1, 0.001) || near(v, d - 1, 0.001))) return 'Off by one. Count the grid spaces between the two points, not the points.';
          return `The two points share an x-coordinate. Find the distance between ${dec(y1)} and ${dec(y2)} on the y-axis.`;
        },
      },
    };
  });

  // ---------- Fill the steps: |a| + |b| = d (blanks) ----------
  G.define('n6_distanceBlanks', (r) => {
    const horizontal = r.chance(0.5);
    const [c1, c2] = twoCoords(r, 'cross');
    const other = nzIn(r, 1, LIM);
    const p = horizontal ? [c1, other] : [other, c1];
    const q = horizontal ? [c2, other] : [other, c2];
    const d = Math.abs(c1) + Math.abs(c2);
    const coordName = horizontal ? 'x' : 'y';
    const axisName = horizontal ? 'y-axis' : 'x-axis';
    const name = r.pick(NAMES);
    return {
      type: 'blanks',
      skill: 'distance-plane',
      lesson: '7-6',
      title: 'Show the distance steps',
      prompt: `<p>${name} finds the distance between ${hl(pair(p[0], p[1]))} and ${hl(pair(q[0], q[1]))}. The segment crosses the ${axisName}, so ${name} adds the two absolute values.</p>${segPlane(p, q)}<p>Complete the work.</p>`,
      template: `|${dec(c1)}| + |${dec(c2)}| = {0} + {1} = {2} units`,
      fields: [
        { label: `|${dec(c1)}|`, answer: Math.abs(c1), width: 'xs' },
        { label: `|${dec(c2)}|`, answer: Math.abs(c2), width: 'xs' },
        { label: 'distance', answer: d, width: 'xs' },
      ],
      hints: [
        `The points share a ${horizontal ? 'y' : 'x'}-coordinate, so the distance comes from the ${coordName}-coordinates ${dec(c1)} and ${dec(c2)}.`,
        `Absolute value is distance from 0: |${dec(c1)}| = ${Math.abs(c1)} and |${dec(c2)}| = ${Math.abs(c2)}.`,
        `Add the two distances because the segment crosses the ${axisName}: ${Math.abs(c1)} + ${Math.abs(c2)}.`,
      ],
      solution: `<p>|${dec(c1)}| = <b>${Math.abs(c1)}</b> and |${dec(c2)}| = <b>${Math.abs(c2)}</b>. The ${coordName}-coordinates are on opposite sides of 0, so the segment is made of two pieces, one on each side of the ${axisName}. Add them: ${Math.abs(c1)} + ${Math.abs(c2)} = <b>${d}</b> units.</p>`,
      feedback: {
        correct: `Correct. ${Math.abs(c1)} + ${Math.abs(c2)} = ${d}: one piece on each side of the ${axisName}.`,
        wrong(ans, d2) {
          const i = d2.wrong[0];
          const got = parseNum(ans[i]);
          if (i < 2 && got != null && got < 0) return 'Absolute value is a distance, so it is never negative.';
          if (i === 2 && got != null && near(got, Math.abs(Math.abs(c1) - Math.abs(c2)), 0.001)) return 'You subtracted the two distances. The segment crosses the axis, so the two pieces add.';
          if (i < 2) return `|${dec([c1, c2][i])}| asks how far ${dec([c1, c2][i])} is from 0.`;
          return `Add the two absolute values: ${Math.abs(c1)} + ${Math.abs(c2)}.`;
        },
      },
    };
  });

  // ---------- Who found the distance correctly? (who) ----------
  G.define('n6_whoDistance', (r) => {
    const horizontal = r.chance(0.5);
    const [c1, c2] = twoCoords(r, 'cross');
    const other = nzIn(r, 1, LIM);
    const p = horizontal ? [c1, other] : [other, c1];
    const q = horizontal ? [c2, other] : [other, c2];
    const d = Math.abs(c1) + Math.abs(c2);
    const sub = Math.abs(Math.abs(c1) - Math.abs(c2));
    const [n1, n2, n3] = r.pickN(NAMES, 3);
    const coordName = horizontal ? 'x' : 'y';
    const otherName = horizontal ? 'y' : 'x';
    const opts = [
      { title: n1, html: `The ${otherName}-coordinates match, so I used the ${coordName}-coordinates. |${dec(c1)}| + |${dec(c2)}| = ${Math.abs(c1)} + ${Math.abs(c2)} = <b>${d}</b>.`, ok: true },
      {
        title: n2,
        html: `I subtracted the ${coordName}-coordinates' sizes: ${Math.max(Math.abs(c1), Math.abs(c2))} − ${Math.min(Math.abs(c1), Math.abs(c2))} = <b>${sub}</b>.`,
        why: `Subtracting works only when both points are on the same side of the axis. Here ${dec(c1)} and ${dec(c2)} are on opposite sides, so the two distances from 0 add up.`,
      },
      {
        title: n3,
        html: `The ${otherName}-coordinates are the same, so I used them: the distance is <b>${Math.abs(other)}</b>.`,
        why: `${dec(other)} is the shared ${otherName}-coordinate. It tells where the line sits, not how long the segment is. Use the coordinates that differ.`,
      },
    ];
    const sh = shuffleOptions(r, opts, 0);
    return {
      type: 'who',
      skill: 'distance-plane',
      lesson: '7-6',
      title: 'Who measured the cable?',
      prompt: `<p>Three navigators find the distance between ${hl(pair(p[0], p[1]))} and ${hl(pair(q[0], q[1]))}.</p>${segPlane(p, q)}<p>Who is correct?</p>`,
      options: sh.options,
      answer: sh.answer,
      layout: 'cards',
      hints: [
        `Which coordinate is the same for both points? That one tells you the direction of the segment, not its length.`,
        `The ${coordName}-coordinates differ: ${dec(c1)} and ${dec(c2)}. They have opposite signs, so the segment crosses an axis.`,
        `Crossing an axis means adding the two distances from 0: ${Math.abs(c1)} + ${Math.abs(c2)}.`,
      ],
      solution: `<p>${n1} is correct. The ${otherName}-coordinates match, so the distance comes from the ${coordName}-coordinates. ${explain1(c1, c2, coordName)}. The distance is <b>${d}</b> units. Subtracting gives ${sub}, which is wrong because the segment crosses the axis. The shared coordinate, ${dec(other)}, is not a length at all.</p>`,
      feedback: { correct: `Correct. Opposite sides of the axis means add: ${Math.abs(c1)} + ${Math.abs(c2)} = ${d}.` },
    };
  });

  // ---------- Which route is shorter? (mc) ----------
  G.define('n6_compareMc', (r) => {
    // route A: horizontal; route B: vertical; different lengths
    let a, b, dA, dB;
    let guard = 0;
    do {
      a = twoCoords(r, 'any');
      b = twoCoords(r, 'any');
      dA = dist1(a[0], a[1]);
      dB = dist1(b[0], b[1]);
      guard++;
    } while (dA === dB && guard < 50);
    if (dA === dB) b = [b[0], b[1] === LIM ? -LIM : b[1] + 1];
    dB = dist1(b[0], b[1]);
    const yA = nzIn(r, 1, LIM),
      xB = nzIn(r, 1, LIM);
    const pA = [a[0], yA],
      qA = [a[1], yA];
    const pB = [xB, b[0]],
      qB = [xB, b[1]];
    const shorter = dA < dB ? 'A' : 'B';
    const diff = Math.abs(dA - dB);
    const opts = [
      { html: `Route ${shorter}, by ${diff} unit${diff === 1 ? '' : 's'}`, ok: true },
      { html: `Route ${shorter === 'A' ? 'B' : 'A'}, by ${diff} unit${diff === 1 ? '' : 's'}`, why: `Route A is ${dA} units and Route B is ${dB} units. The shorter one is Route ${shorter}.` },
      { html: `They are the same length`, why: `Route A is ${dA} units long and Route B is ${dB} units long. They are not equal.` },
      {
        html: `Route ${shorter}, by ${diff + 1} unit${diff + 1 === 1 ? '' : 's'}`,
        why: `Route ${shorter} is shorter, but the difference is ${dA} and ${dB}, which differ by ${diff}, not ${diff + 1}. Count the spaces between points, not the points.`,
      },
    ];
    const sh = shuffleOptions(r, opts, 0);
    return {
      type: 'mc',
      skill: 'distance-plane',
      lesson: '7-6',
      title: 'Which route is shorter?',
      prompt: `<p>Two routes cross the crevasse field. <b>Route A</b> runs from ${hl(pair(pA[0], pA[1]))} to ${hl(pair(qA[0], qA[1]))}. <b>Route B</b> runs from ${hl(pair(pB[0], pB[1]))} to ${hl(pair(qB[0], qB[1]))}.</p>${PLANE(
        {
          series: [
            { points: [pA, qA], line: true, labels: ['A', 'A'] },
            { points: [pB, qB], line: true, color: '#F2A33A', labels: ['B', 'B'] },
          ],
          aria: 'Coordinate plane showing horizontal Route A and vertical Route B',
        },
      )}<p>Which route is shorter, and by how much?</p>`,
      options: sh.options,
      answer: sh.answer,
      hints: [
        'Find each length separately. Route A is horizontal: use its x-coordinates. Route B is vertical: use its y-coordinates.',
        `Route A: ${explain1(a[0], a[1], 'x')}.`,
        `Route B: ${explain1(b[0], b[1], 'y')}. Now compare ${dA} and ${dB}.`,
      ],
      solution: `<p>Route A: ${explain1(a[0], a[1], 'x')} units. Route B: ${explain1(b[0], b[1], 'y')} units. <b>Route ${shorter}</b> is shorter by ${Math.max(dA, dB)} − ${Math.min(dA, dB)} = <b>${diff}</b> unit${diff === 1 ? '' : 's'}.</p>`,
      feedback: { correct: `Correct. Route A is ${dA} units, Route B is ${dB} units, so Route ${shorter} wins by ${diff}.` },
    };
  });

  // ---------- Order three segments by length (seq) ----------
  G.define('n6_seqRoutes', (r) => {
    const segs = [];
    const lens = new Set();
    let guard = 0;
    while (segs.length < 3 && guard++ < 100) {
      const horizontal = segs.length % 2 === 0;
      const [c1, c2] = twoCoords(r, 'any');
      const other = nzIn(r, 1, LIM);
      const len = dist1(c1, c2);
      if (lens.has(len)) continue;
      lens.add(len);
      segs.push({ p: horizontal ? [c1, other] : [other, c1], q: horizontal ? [c2, other] : [other, c2], len, horizontal });
    }
    const names = ['Cable 1', 'Cable 2', 'Cable 3'];
    const longestFirst = r.chance(0.5);
    const items = segs.map((s, i) => ({ html: `<b>${names[i]}</b>: ${pair(s.p[0], s.p[1])} to ${pair(s.q[0], s.q[1])}`, rate: s.len }));
    const order = segs.map((_, i) => i).sort((x, y) => (longestFirst ? segs[y].len - segs[x].len : segs[x].len - segs[y].len));
    return {
      type: 'seq',
      skill: 'distance-plane',
      lesson: '7-6',
      title: longestFirst ? 'Order the cables, longest first' : 'Order the cables, shortest first',
      prompt: `<p>Three cables will be cut to span the crevasse. Put them in order from <b>${longestFirst ? 'longest (top) to shortest (bottom)' : 'shortest (top) to longest (bottom)'}</b>.</p>${PLANE(
        {
          series: segs.map((s, i) => ({ points: [s.p, s.q], line: true, color: ['#1FA6A2', '#F2A33A', '#C8553D'][i], labels: [String(i + 1), ''] })),
          aria: 'Coordinate plane showing three cables as segments',
        },
      )}`,
      items,
      order,
      hints: [
        'For each cable, find which coordinate changes. A horizontal cable uses x-coordinates; a vertical one uses y-coordinates.',
        segs.map((s, i) => `${names[i]}: ${s.horizontal ? explain1(s.p[0], s.q[0], 'x') : explain1(s.p[1], s.q[1], 'y')}`).join('. ') + '.',
        `The lengths are ${segs.map((s) => s.len).join(', ')} units. ${longestFirst ? 'Largest' : 'Smallest'} goes on top.`,
      ],
      solution: `<p>${segs.map((s, i) => `${names[i]} is ${s.len} units`).join(', ')}. From ${longestFirst ? 'longest to shortest' : 'shortest to longest'}: <b>${order.map((i) => names[i]).join(', ')}</b>. When the two coordinates have opposite signs, add their absolute values; when they share a sign, subtract.</p>`,
      feedback: {
        correct: 'Correct. Find each length from the coordinates that change, then compare.',
        wrong() {
          return 'At least one cable is out of place. Find each length first: add absolute values when the segment crosses an axis, subtract when it does not.';
        },
      },
    };
  });

  // ---------- Plot the point at a given distance (plot) ----------
  G.define('n6_plotAtDistance', (r) => {
    const horizontal = r.chance(0.5);
    const start = [nzIn(r, 1, LIM - 1), nzIn(r, 1, LIM - 1)];
    const dirs = horizontal ? ['left', 'right'] : ['down', 'up'];
    // choose a distance that crosses the axis and stays on the grid
    const coord = horizontal ? start[0] : start[1];
    const dir = coord < 0 ? dirs[1] : dirs[0]; // move toward and across the axis
    const maxD = Math.abs(coord) + LIM;
    const d = r.int(Math.abs(coord) + 1, Math.min(maxD, Math.abs(coord) + 5));
    const newCoord = coord < 0 ? coord + d : coord - d;
    const target = horizontal ? [newCoord, start[1]] : [start[0], newCoord];
    const name = r.pick(NAMES);
    const flag = r.pick(FLAGS);
    return {
      type: 'plot',
      skill: 'distance-plane',
      lesson: '7-6',
      title: 'Plot the far end of the cable',
      prompt: `<p>${name} anchors a cable at the ${flag}, ${hl(pair(start[0], start[1]))}, shown in gray. The cable runs ${hl(d + ' units')} straight ${hl(dir)}.</p><p>Plot the point where the cable ends.</p>`,
      xLabel: 'x',
      yLabel: 'y',
      xMin: -LIM,
      xMax: LIM,
      yMin: -LIM,
      yMax: LIM,
      given: [start],
      givenLabels: [pair(start[0], start[1])],
      points: [target],
      count: 1,
      hints: [
        `Moving ${dir} changes only the ${horizontal ? 'x' : 'y'}-coordinate. The ${horizontal ? 'y' : 'x'}-coordinate stays ${dec(horizontal ? start[1] : start[0])}.`,
        `Start at ${dec(coord)}. Moving ${dir} by ${d} crosses 0: it takes ${Math.abs(coord)} units to reach the axis, then ${d - Math.abs(coord)} more.`,
        `${d - Math.abs(coord)} units past 0 on the ${coord < 0 ? 'positive' : 'negative'} side is ${dec(newCoord)}.`,
      ],
      solution: `<p>Moving ${dir} changes the ${horizontal ? 'x' : 'y'}-coordinate only. From ${dec(coord)}, ${Math.abs(coord)} units reach the axis and the remaining ${d - Math.abs(coord)} units go past it, to ${dec(newCoord)}. The cable ends at <b>${pair(target[0], target[1])}</b>. Check: |${dec(coord)}| + |${dec(newCoord)}| = ${Math.abs(coord)} + ${Math.abs(newCoord)} = ${d}.</p>${PLANE(
        {
          series: [
            { points: [start], color: '#5B6B7A', labels: [pair(start[0], start[1])] },
            { points: [start, target], line: true, labels: ['', pair(target[0], target[1])] },
          ],
          aria: `Coordinate plane showing the cable from ${pair(start[0], start[1])} to ${pair(target[0], target[1])}`,
        },
      )}`,
      feedback: {
        correct: `Correct. ${pair(target[0], target[1])} is exactly ${d} units ${dir} of the start.`,
        wrong(ans, d2) {
          const e = (d2.extra || [])[0];
          if (!e) return `Place one point, ${d} units ${dir} of ${pair(start[0], start[1])}.`;
          const sameLine = horizontal ? e[1] === start[1] : e[0] === start[0];
          if (!sameLine) return `Moving ${dir} keeps the ${horizontal ? 'y' : 'x'}-coordinate at ${dec(horizontal ? start[1] : start[0])}. Your point left that line.`;
          const got = horizontal ? e[0] : e[1];
          const moved = Math.abs(got - coord);
          const wrongWay = coord < 0 ? got < coord : got > coord;
          if (wrongWay)
            return `You moved the wrong way. "${dir}" means ${horizontal ? (dir === 'left' ? 'toward smaller x' : 'toward larger x') : dir === 'down' ? 'toward smaller y' : 'toward larger y'}.`;
          if (moved === d - 1 || moved === d + 1) return `Off by one. Count ${d} spaces from ${dec(coord)}, and remember the step that lands on 0 counts too.`;
          if (got === -coord) return `That is the reflection of the start, ${Math.abs(coord) * 2} units away. The cable is ${d} units long.`;
          return `From ${dec(coord)}, move ${d} units ${dir}. Count ${Math.abs(coord)} to reach 0, then ${d - Math.abs(coord)} more.`;
        },
      },
    };
  });

  // ---------- True or false: distance by subtracting (tf) ----------
  G.define('n6_tfSubtract', (r) => {
    const horizontal = r.chance(0.5);
    const cross = r.chance(0.5);
    const [c1, c2] = twoCoords(r, cross ? 'cross' : 'same');
    const other = nzIn(r, 1, LIM);
    const p = horizontal ? [c1, other] : [other, c1];
    const q = horizontal ? [c2, other] : [other, c2];
    const d = dist1(c1, c2);
    const sub = Math.abs(Math.abs(c1) - Math.abs(c2));
    const add = Math.abs(c1) + Math.abs(c2);
    const name = r.pick(NAMES);
    const coordName = horizontal ? 'x' : 'y';
    const axisName = horizontal ? 'y-axis' : 'x-axis';
    // The claim: subtract the absolute values. True when the points are on the same side; false when they cross.
    const claimValue = sub;
    const statement = `The distance from ${pair(p[0], p[1])} to ${pair(q[0], q[1])} is ${Math.max(Math.abs(c1), Math.abs(c2))} − ${Math.min(Math.abs(c1), Math.abs(c2))} = ${claimValue} units.`;
    const answer = !cross;
    const reasons = answer
      ? [
          { html: `Both ${coordName}-coordinates are on the same side of the ${axisName}, so the distance is the difference of their absolute values.`, correct: true },
          { html: `Distance is always found by subtracting the smaller number from the larger one.` },
          { html: `The points share a ${horizontal ? 'y' : 'x'}-coordinate, so any subtraction works.` },
        ]
      : [
          { html: `The ${coordName}-coordinates ${dec(c1)} and ${dec(c2)} are on opposite sides of the ${axisName}, so the distances from 0 must be added: ${add} units.`, correct: true },
          { html: `The distance should be ${sub} but written as a negative number, because one coordinate is negative.` },
          { html: `The distance should be ${Math.abs(other)}, because that is the coordinate the points share.` },
        ];
    const sh = shuffleOptions(r, reasons, 0);
    return {
      type: 'tf',
      skill: 'distance-plane',
      lesson: '7-6',
      title: 'True or false?',
      prompt: `<p>${name} writes in the cable log:</p><blockquote>${hl(statement)}</blockquote>${segPlane(p, q)}<p>Is the statement true or false? Choose the best reason.</p>`,
      answer,
      reasons: sh.options,
      hints: [
        `Look at the ${coordName}-coordinates, ${dec(c1)} and ${dec(c2)}. Are they on the same side of 0 or on opposite sides?`,
        cross ? `They have opposite signs. The segment crosses the ${axisName}, so it has a piece on each side.` : `They have the same sign. The segment stays on one side of the ${axisName}.`,
        cross
          ? `Add the distances from 0: ${Math.abs(c1)} + ${Math.abs(c2)} = ${add}. Does the statement say that?`
          : `Subtract the distances from 0: ${Math.max(Math.abs(c1), Math.abs(c2))} − ${Math.min(Math.abs(c1), Math.abs(c2))} = ${sub}. Count the grid to check.`,
      ],
      solution: `<p>${explain1(c1, c2, coordName)} units. The statement is <b>${answer ? 'true' : 'false'}</b>${answer ? '. Subtracting works because both coordinates are on the same side of the axis.' : `. The segment crosses the ${axisName}, so the two distances from 0 add instead of subtract. The real distance is ${d} units.`}</p>`,
      feedback: {
        correct: answer ? 'Correct. Same side of the axis: subtract the absolute values.' : 'Correct. Opposite sides of the axis: add the absolute values.',
        wrong(ans, d2) {
          if (!d2.valueOk) return `Check the signs of ${dec(c1)} and ${dec(c2)}. Same sign: subtract. Opposite signs: add. Then compare with the statement.`;
          return 'Your true/false answer is right. Pick the reason that talks about which side of the axis the coordinates are on.';
        },
      },
    };
  });
})(typeof window !== 'undefined' ? window : globalThis);

/* js/units/u7/gen-polygons.js */
/* Zone 7 — Station Core. Lesson 7-7 Represent Polygons on the Coordinate Plane. */
(function (root) {
  'use strict';
  const RX = root.RX;
  const { G, V, shuffleOptions, NAMES, parseNum, near } = RX;
  const { dec, pair } = RX.N7;
  const hl = V.hl;

  const LIM = 6;
  const PLANE = (o) => V.graph(Object.assign({ xMin: -LIM, xMax: LIM, yMin: -LIM, yMax: LIM, size: 260 }, o));
  const ROOMS = ['generator room', 'radio room', 'supply bay', 'greenhouse', 'bunk room', 'ice-core freezer', 'landing pad', 'fuel yard'];
  const SCALES = [
    { k: 2, u: 'm', uu: 'meters' },
    { k: 3, u: 'm', uu: 'meters' },
    { k: 4, u: 'm', uu: 'meters' },
    { k: 5, u: 'm', uu: 'meters' },
    { k: 10, u: 'ft', uu: 'feet' },
    { k: 5, u: 'ft', uu: 'feet' },
  ];
  const VN = ['A', 'B', 'C', 'D'];
  const samePt = (a, b) => a[0] === b[0] && a[1] === b[1];
  const units = (n) => `${n} unit${n === 1 ? '' : 's'}`;

  /**
   * Draw a rectangle with sides parallel to the axes. opts: {crossX, crossY, square, minSide}
   * Returns {x1,x2,y1,y2,w,h,verts} with verts A(x1,y1) B(x2,y1) C(x2,y2) D(x1,y2), counterclockwise from the lower left.
   */
  const drawRect = (r, opts) => {
    opts = opts || {};
    const minSide = opts.minSide || 2;
    let x1, x2, y1, y2;
    let guard = 0;
    do {
      x1 = r.int(-LIM, LIM - minSide);
      x2 = r.int(x1 + minSide, Math.min(LIM, x1 + 9));
      y1 = r.int(-LIM, LIM - minSide);
      y2 = opts.square ? y1 + (x2 - x1) : r.int(y1 + minSide, Math.min(LIM, y1 + 9));
      guard++;
    } while (
      guard < 200 &&
      (y2 > LIM ||
        (opts.crossX && !(x1 < 0 && x2 > 0)) ||
        (opts.crossY && !(y1 < 0 && y2 > 0)) ||
        (!opts.crossX && !opts.crossY && !(x1 < 0 && x2 > 0) && !(y1 < 0 && y2 > 0)) ||
        (!opts.square && x2 - x1 === y2 - y1))
    );
    const w = x2 - x1,
      h = y2 - y1;
    return {
      x1,
      x2,
      y1,
      y2,
      w,
      h,
      verts: [
        [x1, y1],
        [x2, y1],
        [x2, y2],
        [x1, y2],
      ],
    };
  };
  const rectPlane = (R, extra) =>
    PLANE(
      Object.assign(
        {
          series: [{ points: R.verts, polygon: true, labels: R.verts.map((p, i) => `${VN[i]} ${pair(p[0], p[1])}`) }],
          aria: `Coordinate plane showing a rectangle with vertices ${R.verts.map((p) => pair(p[0], p[1])).join(', ')}`,
        },
        extra || {},
      ),
    );
  /** One-line explanation of a side length from two coordinates a < b on one axis. */
  const sideWork = (a, b) => {
    if (a < 0 && b > 0) return `|${dec(a)}| + |${dec(b)}| = ${Math.abs(a)} + ${Math.abs(b)} = ${b - a}`;
    const big = Math.abs(a) >= Math.abs(b) ? a : b,
      small = big === a ? b : a;
    return `|${dec(big)}| − |${dec(small)}| = ${Math.abs(big)} − ${Math.abs(small)} = ${b - a}`;
  };
  const sideRule = (a, b) =>
    a < 0 && b > 0
      ? 'The coordinates have opposite signs, so the side crosses an axis: add the absolute values.'
      : a === 0 || b === 0
        ? 'One coordinate is 0, so the side starts on an axis: the length is the absolute value of the other coordinate.'
        : 'The coordinates have the same sign, so subtract the absolute values.';
  const vertList = (R) => R.verts.map((p, i) => `${VN[i]} ${hl(pair(p[0], p[1]))}`).join(', ');

  // ---------- Plot the missing vertex of a rectangle (plot; hard = two opposite corners given, plot the other two) ----------
  G.define('n7_missingVertex', (r, o) => {
    const hard = !!o.hard;
    const R = drawRect(r);
    const room = r.pick(ROOMS);
    const name = r.pick(NAMES);
    if (hard) {
      const diag = r.chance(0.5) ? [0, 2] : [1, 3];
      const given = diag.map((i) => R.verts[i]);
      const missing = R.verts.filter((_, i) => !diag.includes(i));
      return {
        type: 'plot',
        skill: 'polygons-plane',
        lesson: '7-7',
        title: 'Plot the two missing corners',
        prompt: `<p>${name} has only two opposite corners of the rectangular ${room} on the blueprint: ${hl(pair(given[0][0], given[0][1]))} and ${hl(pair(given[1][0], given[1][1]))}. They are drawn in gray. The sides of the room run straight across and straight up and down.</p><p>Plot the other two vertices of the rectangle.</p>`,
        xLabel: 'x',
        yLabel: 'y',
        xMin: -LIM,
        xMax: LIM,
        yMin: -LIM,
        yMax: LIM,
        given,
        givenLabels: given.map((p) => pair(p[0], p[1])),
        points: missing,
        count: 2,
        hints: [
          'In a rectangle with sides along the grid, each corner shares its x-coordinate with one neighbor and its y-coordinate with the other.',
          `The two given corners use x = ${dec(given[0][0])} and x = ${dec(given[1][0])}, and y = ${dec(given[0][1])} and y = ${dec(given[1][1])}. The missing corners mix those values the other way.`,
          `One missing corner is ${pair(missing[0][0], missing[0][1])}. The other uses the remaining x and y.`,
        ],
        solution: `<p>The rectangle uses only two x-values (${dec(R.x1)} and ${dec(R.x2)}) and two y-values (${dec(R.y1)} and ${dec(R.y2)}). The given corners pair them one way; the missing corners pair them the other way: <b>${pair(missing[0][0], missing[0][1])}</b> and <b>${pair(missing[1][0], missing[1][1])}</b>. Each new corner lines up with a given corner across and up or down.</p>${rectPlane(R)}`,
        feedback: {
          correct: `Correct. ${pair(missing[0][0], missing[0][1])} and ${pair(missing[1][0], missing[1][1])} complete the rectangle.`,
          wrong(ans, d) {
            const e = (d.extra || [])[0];
            if (!e) return `Place two points. Each one must line up with a given corner: same x as one, same y as the other.`;
            if (given.some((g) => samePt(g, e))) return `${pair(e[0], e[1])} is one of the corners you were given. Plot the two corners that are not drawn yet.`;
            if (missing.some((m) => m[0] === e[1] && m[1] === e[0])) return `${pair(e[0], e[1])} has x and y swapped. The x-coordinate is the left-right position, listed first.`;
            const xOk = e[0] === R.x1 || e[0] === R.x2,
              yOk = e[1] === R.y1 || e[1] === R.y2;
            if (xOk && !yOk) return `${pair(e[0], e[1])} is on the right vertical line, but its y must match one of the given corners: ${dec(R.y1)} or ${dec(R.y2)}.`;
            if (yOk && !xOk) return `${pair(e[0], e[1])} is at the right height, but its x must match one of the given corners: ${dec(R.x1)} or ${dec(R.x2)}.`;
            return `${pair(e[0], e[1])} does not line up with either given corner. A rectangle's corners share x-values in pairs and y-values in pairs.`;
          },
        },
      };
    }
    const missIdx = r.int(0, 3);
    const missing = R.verts[missIdx];
    const given = R.verts.filter((_, i) => i !== missIdx);
    const givenNames = VN.filter((_, i) => i !== missIdx);
    const sameX = given.find((g) => g[0] === missing[0]);
    const sameY = given.find((g) => g[1] === missing[1]);
    return {
      type: 'plot',
      skill: 'polygons-plane',
      lesson: '7-7',
      title: 'Plot the missing vertex',
      prompt: `<p>Three corners of the rectangular ${room} are drawn in gray: ${given.map((p, i) => `${givenNames[i]} ${hl(pair(p[0], p[1]))}`).join(', ')}.</p><p>Plot the fourth vertex, ${VN[missIdx]}, so the four points form a rectangle.</p>`,
      xLabel: 'x',
      yLabel: 'y',
      xMin: -LIM,
      xMax: LIM,
      yMin: -LIM,
      yMax: LIM,
      given,
      givenLabels: givenNames,
      points: [missing],
      count: 1,
      hints: [
        'In a rectangle, opposite sides are the same length and the corners are square. The missing corner lines up with two of the given ones.',
        `The fourth vertex sits directly ${missing[1] > sameX[1] ? 'above' : 'below'} ${pair(sameX[0], sameX[1])}, so its x-coordinate is ${dec(missing[0])}.`,
        `It also sits straight ${missing[0] > sameY[0] ? 'right' : 'left'} of ${pair(sameY[0], sameY[1])}, so its y-coordinate is ${dec(missing[1])}.`,
      ],
      solution: `<p>The fourth vertex shares an x-coordinate with ${pair(sameX[0], sameX[1])} and a y-coordinate with ${pair(sameY[0], sameY[1])}. So ${VN[missIdx]} = <b>${pair(missing[0], missing[1])}</b>. Check: the side from ${pair(sameX[0], sameX[1])} to ${VN[missIdx]} is vertical and the side from ${pair(sameY[0], sameY[1])} to ${VN[missIdx]} is horizontal, which makes a square corner.</p>${rectPlane(R)}`,
      feedback: {
        correct: `Correct. ${pair(missing[0], missing[1])} lines up with ${pair(sameX[0], sameX[1])} and with ${pair(sameY[0], sameY[1])}.`,
        wrong(ans, d) {
          const e = (d.extra || [])[0];
          if (!e) return `Place one point. It must be directly across from one corner and directly above or below another.`;
          if (given.some((g) => samePt(g, e))) return `${pair(e[0], e[1])} is already a corner. Find the corner that is not drawn yet.`;
          if (e[0] === missing[1] && e[1] === missing[0]) return 'You swapped x and y. The first coordinate is the left-right position.';
          if (e[0] === missing[0]) return `Right x, but the corner must be level with ${pair(sameY[0], sameY[1])}, so y = ${dec(missing[1])}.`;
          if (e[1] === missing[1]) return `Right y, but the corner must be straight above or below ${pair(sameX[0], sameX[1])}, so x = ${dec(missing[0])}.`;
          if (e[0] === -missing[0] || e[1] === -missing[1]) return 'Check the signs. The missing corner is on the same side of each axis as the corners it lines up with.';
          return `The fourth corner must line up with two of the given corners: one straight across, one straight up or down.`;
        },
      },
    };
  });

  // ---------- Perimeter of a rectangle from its vertices (num) ----------
  G.define('n7_perimeter', (r) => {
    const R = drawRect(r);
    const P = 2 * (R.w + R.h);
    const ctx = r.pick([
      { what: 'heating cable', verb: 'runs along every wall of' },
      { what: 'safety railing', verb: 'goes all the way around' },
      { what: 'rope line', verb: 'marks the edge of' },
      { what: 'insulation strip', verb: 'seals the border of' },
    ]);
    const room = r.pick(ROOMS);
    const name = r.pick(NAMES);
    const xCross = R.x1 < 0 && R.x2 > 0,
      yCross = R.y1 < 0 && R.y2 > 0;
    return {
      type: 'num',
      skill: 'polygons-plane',
      lesson: '7-7',
      title: 'Find the perimeter',
      prompt: `<p>On the blueprint, the ${room} is a rectangle with vertices ${vertList(R)}. Each grid unit is 1 meter. ${name} needs ${ctx.what} that ${ctx.verb} the room.</p>${rectPlane(R)}<p>What is the perimeter of the room, in meters?</p>`,
      unit: 'm',
      answer: P,
      hints: [
        'Perimeter is the distance all the way around. Find the length of one horizontal side and one vertical side from the coordinates.',
        `Side AB runs from x = ${dec(R.x1)} to x = ${dec(R.x2)}: ${sideWork(R.x1, R.x2)}. Side BC runs from y = ${dec(R.y1)} to y = ${dec(R.y2)}: ${sideWork(R.y1, R.y2)}.`,
        `Opposite sides of a rectangle are equal, so add ${R.w} + ${R.h} + ${R.w} + ${R.h}, or double ${R.w} + ${R.h}.`,
      ],
      solution: `<p>AB is horizontal: ${sideWork(R.x1, R.x2)} units. ${sideRule(R.x1, R.x2)} BC is vertical: ${sideWork(R.y1, R.y2)} units. ${sideRule(R.y1, R.y2)} Perimeter = 2 × (${R.w} + ${R.h}) = 2 × ${R.w + R.h} = <b>${P} m</b>. Counting grid squares along each wall gives the same lengths.</p>`,
      feedback: {
        correct: `Correct. 2 × (${R.w} + ${R.h}) = ${P} meters of ${ctx.what}.`,
        wrong(ans, d) {
          const v = d.value;
          if (v == null) return 'Type a number of meters.';
          if (near(v, R.w * R.h, 0.001)) return `${R.w} × ${R.h} is the area, the space inside. Perimeter adds the four side lengths.`;
          if (near(v, R.w + R.h, 0.001)) return `${R.w} + ${R.h} is only two of the four sides. A rectangle has two of each.`;
          const subW = Math.abs(Math.abs(R.x1) - Math.abs(R.x2)),
            subH = Math.abs(Math.abs(R.y1) - Math.abs(R.y2));
          if (xCross && near(v, 2 * (subW + R.h), 0.001)) return `Side AB crosses the y-axis, so its length is |${dec(R.x1)}| + |${dec(R.x2)}| = ${R.w}, not ${subW}. Add the two distances from 0.`;
          if (yCross && near(v, 2 * (R.w + subH), 0.001)) return `Side BC crosses the x-axis, so its length is |${dec(R.y1)}| + |${dec(R.y2)}| = ${R.h}, not ${subH}. Add the two distances from 0.`;
          if (near(v, P + 4, 0.001) || near(v, P + 2, 0.001)) return 'Too long by a little. Count the spaces between grid lines along each side, not the grid points.';
          if (near(v, P - 4, 0.001) || near(v, P - 2, 0.001)) return 'Too short by a little. Count every grid space from one corner to the next.';
          return `Find AB from the x-coordinates ${dec(R.x1)} and ${dec(R.x2)}, and BC from the y-coordinates ${dec(R.y1)} and ${dec(R.y2)}. Then add all four sides.`;
        },
      },
    };
  });

  // ---------- Area of a rectangle or right triangle on the plane (num) ----------
  G.define('n7_area', (r) => {
    const tri = r.chance(0.35);
    const R = drawRect(r);
    const area = tri ? (R.w * R.h) / 2 : R.w * R.h;
    const room = r.pick(ROOMS);
    const name = r.pick(NAMES);
    // right triangle: A(x1,y1) B(x2,y1) D(x1,y2) — legs along the grid
    const tv = [R.verts[0], R.verts[1], R.verts[3]];
    const tnames = ['A', 'B', 'C'];
    const shape = tri ? 'right triangle' : 'rectangle';
    const listed = tri ? tv.map((p, i) => `${tnames[i]} ${hl(pair(p[0], p[1]))}`).join(', ') : vertList(R);
    const plane = tri
      ? PLANE({
          series: [{ points: tv, polygon: true, labels: tv.map((p, i) => `${tnames[i]} ${pair(p[0], p[1])}`) }],
          aria: `Coordinate plane showing a right triangle with vertices ${tv.map((p) => pair(p[0], p[1])).join(', ')}`,
        })
      : rectPlane(R);
    const legV = tri ? 'AC' : 'BC';
    return {
      type: 'num',
      skill: 'polygons-plane',
      lesson: '7-7',
      title: tri ? 'Area of a triangular floor' : 'Area of a rectangular floor',
      prompt: `<p>${name} is ordering floor panels for the ${room}. On the blueprint it is a ${shape} with vertices ${listed}. Each grid unit is 1 meter.</p>${plane}<p>What is the area of the floor, in square meters?</p>`,
      unit: 'm²',
      answer: area,
      hints: [
        tri
          ? 'The area of a triangle is half the base times the height. The two legs along the grid are the base and the height.'
          : 'The area of a rectangle is length times width. Find both side lengths from the coordinates first.',
        `AB runs from x = ${dec(R.x1)} to x = ${dec(R.x2)}: ${sideWork(R.x1, R.x2)} units. ${legV} runs from y = ${dec(R.y1)} to y = ${dec(R.y2)}: ${sideWork(R.y1, R.y2)} units.`,
        tri ? `Multiply ${R.w} × ${R.h} = ${R.w * R.h}, then take half.` : `Multiply the two side lengths: ${R.w} × ${R.h}.`,
      ],
      solution: tri
        ? `<p>Base AB = ${sideWork(R.x1, R.x2)} units. Height AC = ${sideWork(R.y1, R.y2)} units. The legs meet at a square corner at A, so Area = ½ × ${R.w} × ${R.h} = ½ × ${R.w * R.h} = <b>${dec(area)} m²</b>. The triangle is exactly half of a ${R.w}-by-${R.h} rectangle.</p>`
        : `<p>AB = ${sideWork(R.x1, R.x2)} units. BC = ${sideWork(R.y1, R.y2)} units. Area = ${R.w} × ${R.h} = <b>${area} m²</b>. ${sideRule(R.x1, R.x2)} Each square meter is one grid square inside the figure.</p>`,
      feedback: {
        correct: tri ? `Correct. ½ × ${R.w} × ${R.h} = ${dec(area)} square meters.` : `Correct. ${R.w} × ${R.h} = ${area} square meters.`,
        wrong(ans, d) {
          const v = d.value;
          if (v == null) return 'Type a number of square meters.';
          if (tri && near(v, R.w * R.h, 0.001)) return `${R.w} × ${R.h} is the area of the whole rectangle. The triangle is half of it.`;
          if (!tri && near(v, 2 * (R.w + R.h), 0.001)) return `${2 * (R.w + R.h)} is the perimeter, the distance around. Area multiplies the two sides.`;
          if (near(v, R.w + R.h, 0.001)) return 'You added the two sides. Area multiplies them.';
          if (near(v, (tri ? 0.5 : 1) * (R.w + 1) * (R.h + 1), 0.001)) return 'Each side is one unit too long. Count the spaces between grid lines, not the grid points.';
          const subW = Math.abs(Math.abs(R.x1) - Math.abs(R.x2)),
            subH = Math.abs(Math.abs(R.y1) - Math.abs(R.y2));
          if (R.x1 < 0 && R.x2 > 0 && near(v, (tri ? 0.5 : 1) * subW * R.h, 0.001))
            return `AB crosses the y-axis, so its length is |${dec(R.x1)}| + |${dec(R.x2)}| = ${R.w}. Add the two distances from 0.`;
          if (R.y1 < 0 && R.y2 > 0 && near(v, (tri ? 0.5 : 1) * R.w * subH, 0.001))
            return `${legV} crosses the x-axis, so its length is |${dec(R.y1)}| + |${dec(R.y2)}| = ${R.h}. Add the two distances from 0.`;
          return `Find AB from the x-coordinates and ${legV} from the y-coordinates. Then ${tri ? 'multiply and take half' : 'multiply'}.`;
        },
      },
    };
  });

  // ---------- Side lengths, perimeter, and area (blanks) ----------
  G.define('n7_sideBlanks', (r) => {
    const R = drawRect(r);
    const P = 2 * (R.w + R.h),
      A = R.w * R.h;
    const room = r.pick(ROOMS);
    return {
      type: 'blanks',
      skill: 'polygons-plane',
      lesson: '7-7',
      title: 'Measure the rectangle',
      prompt: `<p>The ${room} has vertices ${vertList(R)}.</p>${rectPlane(R)}<p>Use the coordinates to find each side length. Then find the perimeter and the area.</p>`,
      template: ['Side AB = {0} units', 'Side BC = {1} units', 'Perimeter = {2} units', 'Area = {3} square units'],
      fields: [
        { label: 'AB', answer: R.w, width: 'xs' },
        { label: 'BC', answer: R.h, width: 'xs' },
        { label: 'perimeter', answer: P, width: 'xs' },
        { label: 'area', answer: A, width: 'xs' },
      ],
      hints: [
        'AB is horizontal, so use its x-coordinates. BC is vertical, so use its y-coordinates. Opposite signs: add the absolute values. Same sign: subtract.',
        `AB: ${sideWork(R.x1, R.x2)}. BC: ${sideWork(R.y1, R.y2)}.`,
        `Perimeter = 2 × (${R.w} + ${R.h}). Area = ${R.w} × ${R.h}.`,
      ],
      solution: `<p>AB: ${sideWork(R.x1, R.x2)}, so AB = <b>${R.w}</b> units. BC: ${sideWork(R.y1, R.y2)}, so BC = <b>${R.h}</b> units. Perimeter = 2 × (${R.w} + ${R.h}) = <b>${P}</b> units, the distance around. Area = ${R.w} × ${R.h} = <b>${A}</b> square units, the grid squares inside. ${sideRule(R.x1, R.x2)}</p>`,
      feedback: {
        correct: `Correct. Sides ${R.w} and ${R.h}, perimeter ${P}, area ${A}.`,
        wrong(ans, d) {
          const i = d.wrong[0];
          const got = parseNum(ans[i]);
          if (i <= 1) {
            const [a, b] = i === 0 ? [R.x1, R.x2] : [R.y1, R.y2];
            const side = i === 0 ? 'AB' : 'BC';
            if (got != null && near(got, Math.abs(a + b), 0.001) && a < 0 && b > 0)
              return `For ${side}, you subtracted. ${dec(a)} and ${dec(b)} are on opposite sides of 0, so add their distances from 0: ${Math.abs(a)} + ${Math.abs(b)}.`;
            if (got != null && near(got, Math.abs(a) + Math.abs(b), 0.001) && !(a < 0 && b > 0))
              return `For ${side}, you added. ${dec(a)} and ${dec(b)} are on the same side of 0, so subtract: ${Math.abs(b)} − ${Math.abs(a)}.`;
            if (got != null && (near(got, b - a + 1, 0.001) || near(got, b - a - 1, 0.001)))
              return `${side} is off by one. Count the spaces between grid lines from ${dec(a)} to ${dec(b)}, not the grid points.`;
            if (got != null && got < 0) return 'A length is never negative. Use absolute values.';
            return `${side} runs from ${dec(a)} to ${dec(b)} along the ${i === 0 ? 'x' : 'y'}-axis. How many units is that?`;
          }
          if (i === 2) {
            if (got != null && near(got, A, 0.001)) return `${A} is the area. Perimeter adds all four sides: ${R.w} + ${R.h} + ${R.w} + ${R.h}.`;
            if (got != null && near(got, R.w + R.h, 0.001)) return `${R.w} + ${R.h} covers only two sides. Double it for all four.`;
            return `Perimeter = 2 × (${R.w} + ${R.h}).`;
          }
          if (got != null && near(got, P, 0.001)) return `${P} is the perimeter. Area multiplies the two sides: ${R.w} × ${R.h}.`;
          if (got != null && near(got, R.w + R.h, 0.001)) return 'You added the sides. Area multiplies them.';
          return `Area = ${R.w} × ${R.h}.`;
        },
      },
    };
  });

  // ---------- Real perimeter with a scale (num; hard = real area) ----------
  G.define('n7_scalePerimeter', (r, o) => {
    const hard = !!o.hard;
    const R = drawRect(r);
    const S = r.pick(SCALES);
    const P = 2 * (R.w + R.h);
    const realP = P * S.k;
    const realA = R.w * S.k * (R.h * S.k);
    const room = r.pick(ROOMS);
    const name = r.pick(NAMES);
    const sq = S.u === 'm' ? 'm²' : 'ft²';
    return {
      type: 'num',
      skill: 'scale-design',
      lesson: '7-7',
      title: hard ? 'Real area from the blueprint' : 'Real perimeter from the blueprint',
      prompt: `<p>${name} designs the ${room} on a grid where ${hl(`1 unit = ${S.k} ${S.uu}`)}. The room has vertices ${vertList(R)}.</p>${rectPlane(R)}<p>${hard ? `What is the real area of the room, in square ${S.uu}?` : `What is the real perimeter of the room, in ${S.uu}?`}</p>`,
      unit: hard ? sq : S.u,
      answer: hard ? realA : realP,
      hints: [
        hard
          ? 'Find both side lengths in grid units, change each one to real length with the scale, then multiply.'
          : 'Find the perimeter in grid units first. Then use the scale: every grid unit stands for real length.',
        `AB = ${sideWork(R.x1, R.x2)} units and BC = ${sideWork(R.y1, R.y2)} units. In real life, AB = ${R.w} × ${S.k} = ${R.w * S.k} ${S.u} and BC = ${R.h} × ${S.k} = ${R.h * S.k} ${S.u}.`,
        hard ? `Area = ${R.w * S.k} ${S.u} × ${R.h * S.k} ${S.u}.` : `Perimeter = 2 × (${R.w * S.k} + ${R.h * S.k}) ${S.u}.`,
      ],
      solution: hard
        ? `<p>Grid lengths: AB = ${R.w} units, BC = ${R.h} units. Scale both sides: ${R.w} × ${S.k} = ${R.w * S.k} ${S.u} and ${R.h} × ${S.k} = ${R.h * S.k} ${S.u}. Real area = ${R.w * S.k} × ${R.h * S.k} = <b>${realA} ${sq}</b>. Each grid square is ${S.k} by ${S.k}, so one grid square covers ${S.k * S.k} ${sq}. That is why the grid area ${R.w * R.h} is multiplied by ${S.k} twice, not once.</p>`
        : `<p>Grid lengths: AB = ${sideWork(R.x1, R.x2)} units, BC = ${sideWork(R.y1, R.y2)} units. Grid perimeter = 2 × (${R.w} + ${R.h}) = ${P} units. Each unit is ${S.k} ${S.uu}, so the real perimeter is ${P} × ${S.k} = <b>${realP} ${S.u}</b>. Scaling the perimeter once is the same as scaling every side first.</p>`,
      feedback: {
        correct: hard ? `Correct. ${R.w * S.k} × ${R.h * S.k} = ${realA} square ${S.uu}.` : `Correct. ${P} units × ${S.k} = ${realP} ${S.uu}.`,
        wrong(ans, d) {
          const v = d.value;
          if (v == null) return 'Type a number.';
          if (hard) {
            if (near(v, R.w * R.h * S.k, 0.001)) return `You scaled the area only once. Both sides grow by ${S.k}, so the area grows by ${S.k} × ${S.k} = ${S.k * S.k}.`;
            if (near(v, R.w * R.h, 0.001)) return `${R.w * R.h} is the area in grid squares. Each grid square is really ${S.k} ${S.u} by ${S.k} ${S.u}.`;
            if (near(v, realP, 0.001)) return `${realP} is the real perimeter. Area multiplies the two real side lengths.`;
            return `Real sides: ${R.w * S.k} ${S.u} and ${R.h * S.k} ${S.u}. Multiply them.`;
          }
          if (near(v, P, 0.001)) return `${P} is the perimeter in grid units. Each unit stands for ${S.k} ${S.uu}, so multiply by ${S.k}.`;
          if (near(v, (R.w + R.h) * S.k, 0.001)) return `You scaled only two sides. A rectangle has four: 2 × (${R.w} + ${R.h}) = ${P} units first.`;
          if (near(v, R.w * R.h * S.k, 0.001) || near(v, realA, 0.001)) return 'That uses area. Perimeter is the distance around: add the four sides, then scale.';
          if (near(v, P + S.k, 0.001) || near(v, P * S.k + S.k, 0.001)) return 'Do not add the scale. Multiply every grid unit by it.';
          return `Perimeter in grid units is 2 × (${R.w} + ${R.h}) = ${P}. Multiply by the scale, ${S.k}.`;
        },
      },
    };
  });

  // ---------- Identify the polygon and its real size (mc) ----------
  G.define('n7_scaleMc', (r) => {
    const kind = r.pick(['rect', 'rect', 'square', 'tri']);
    const R = drawRect(r, { square: kind === 'square' });
    const S = r.pick(SCALES);
    const room = r.pick(ROOMS);
    const ws = R.w * S.k,
      hs = R.h * S.k;
    const tv = [R.verts[0], R.verts[1], R.verts[3]];
    const pts = kind === 'tri' ? tv : R.verts;
    const names = kind === 'tri' ? ['A', 'B', 'C'] : VN;
    const listed = pts.map((p, i) => `${names[i]} ${hl(pair(p[0], p[1]))}`).join(', ');
    let opts;
    if (kind === 'square') {
      opts = [
        { html: `A square, ${ws} ${S.u} on each side`, ok: true },
        {
          html: `A rectangle, ${ws} ${S.u} by ${(R.w + 1) * S.k} ${S.u}`,
          why: `Both sides are ${R.w} units long. Counting grid points instead of spaces makes one side a unit too long. Count spaces, so the figure is a square.`,
        },
        { html: `A square, ${R.w} ${S.u} on each side`, why: `${R.w} is the side in grid units. Each unit stands for ${S.k} ${S.uu}, so multiply by ${S.k}.` },
        { html: `A square, ${(R.w + 1) * S.k} ${S.u} on each side`, why: `That counts ${R.w + 1} grid points along a side. Count the spaces between them: ${R.w} units.` },
      ];
    } else if (kind === 'tri') {
      opts = [
        { html: `A right triangle with legs ${ws} ${S.u} and ${hs} ${S.u}`, ok: true },
        { html: `A rectangle, ${ws} ${S.u} by ${hs} ${S.u}`, why: 'Three vertices make a triangle. A rectangle needs four. The legs are the right lengths, but the shape is wrong.' },
        { html: `A right triangle with legs ${R.w} ${S.u} and ${R.h} ${S.u}`, why: `Those are grid lengths. Each unit is ${S.k} ${S.uu}, so multiply each leg by ${S.k}.` },
        { html: `A right triangle with legs ${(R.w + 1) * S.k} ${S.u} and ${(R.h + 1) * S.k} ${S.u}`, why: `Each leg is one unit too long. Count the spaces between grid lines, not the grid points.` },
      ];
    } else {
      opts = [
        { html: `A rectangle, ${ws} ${S.u} by ${hs} ${S.u}`, ok: true },
        { html: `A square, ${ws} ${S.u} on each side`, why: `AB is ${R.w} units but BC is ${R.h} units. The sides are different, so the figure is a rectangle, not a square.` },
        { html: `A rectangle, ${R.w} ${S.u} by ${R.h} ${S.u}`, why: `Those are grid lengths. Each unit stands for ${S.k} ${S.uu}, so multiply both by ${S.k}.` },
        { html: `A rectangle, ${(R.w + 1) * S.k} ${S.u} by ${(R.h + 1) * S.k} ${S.u}`, why: `Each side is one unit too long. Count the spaces between grid lines, not the grid points.` },
      ];
    }
    const sh = shuffleOptions(r, opts, 0);
    const shapeName = kind === 'square' ? 'square' : kind === 'tri' ? 'right triangle' : 'rectangle';
    return {
      type: 'mc',
      skill: 'scale-design',
      lesson: '7-7',
      title: 'What did the designer draw?',
      prompt: `<p>A blueprint uses the scale ${hl(`1 unit = ${S.k} ${S.uu}`)}. The ${room} has vertices ${listed}.</p>${PLANE({
        series: [{ points: pts, polygon: true, labels: pts.map((p, i) => `${names[i]} ${pair(p[0], p[1])}`) }],
        aria: `Coordinate plane showing a ${shapeName} with vertices ${pts.map((p) => pair(p[0], p[1])).join(', ')}`,
      })}<p>Which statement describes the real ${room}?</p>`,
      options: sh.options,
      answer: sh.answer,
      hints: [
        `Count the vertices to name the shape. Then find each side in grid units from the coordinates.`,
        `AB runs from x = ${dec(R.x1)} to x = ${dec(R.x2)}: ${sideWork(R.x1, R.x2)} units. The vertical side runs from y = ${dec(R.y1)} to y = ${dec(R.y2)}: ${sideWork(R.y1, R.y2)} units.`,
        `Multiply each grid length by ${S.k}: ${R.w} × ${S.k} and ${R.h} × ${S.k}.`,
      ],
      solution: `<p>${pts.length} vertices${kind === 'tri' ? ', with a square corner at A, make a right triangle' : kind === 'square' ? ' and four equal sides make a square' : ' with two different side lengths make a rectangle'}. Grid lengths: ${sideWork(R.x1, R.x2)} and ${sideWork(R.y1, R.y2)}. Real lengths: ${R.w} × ${S.k} = ${ws} ${S.u} and ${R.h} × ${S.k} = ${hs} ${S.u}. So the room is <b>${sh.options[sh.answer].html}</b>.</p>`,
      feedback: { correct: `Correct. ${R.w} and ${R.h} grid units become ${ws} and ${hs} ${S.uu}.` },
    };
  });

  // ---------- Error: a wrong side length leads to a wrong perimeter (error) ----------
  G.define('n7_errorPerimeter', (r) => {
    const kind = r.pick(['cross', 'offby', 'added']);
    let R = kind === 'cross' ? drawRect(r, { crossX: true }) : kind === 'added' ? drawRect(r, { crossY: true }) : drawRect(r);
    // 'cross': AB must cross the y-axis unevenly, so subtracting the absolute values gives a visible (nonzero) wrong length
    for (let tries = 0; kind === 'cross' && Math.abs(R.x1) === Math.abs(R.x2) && tries < 40; tries++) R = drawRect(r, { crossX: true });
    // 'added': put AB entirely on one side of the y-axis (both x nonzero) so "adding" the absolute values is the wrong move
    if (kind === 'added') {
      const w = r.int(2, LIM - 1);
      let x1 = r.int(1, LIM - w);
      if (r.chance(0.5)) x1 = -(x1 + w);
      R.x1 = x1;
      R.x2 = x1 + w;
      R.w = w;
      R.verts = [
        [R.x1, R.y1],
        [R.x2, R.y1],
        [R.x2, R.y2],
        [R.x1, R.y2],
      ];
    }
    const P = 2 * (R.w + R.h);
    const name = r.pick(NAMES);
    const room = r.pick(ROOMS);
    let work, wrongW, wrongH, correctOpt, dist;
    if (kind === 'cross') {
      wrongW = Math.abs(Math.abs(R.x1) - Math.abs(R.x2));
      wrongH = R.h;
      work = `AB: ${Math.max(Math.abs(R.x1), Math.abs(R.x2))} − ${Math.min(Math.abs(R.x1), Math.abs(R.x2))} = ${wrongW} units<br>BC: ${sideWork(R.y1, R.y2)} units<br>Perimeter = 2 × (${wrongW} + ${wrongH}) = ${2 * (wrongW + wrongH)} units`;
      correctOpt = `${name} subtracted the absolute values for AB, but ${dec(R.x1)} and ${dec(R.x2)} are on opposite sides of the y-axis. The side crosses the axis, so add: ${Math.abs(R.x1)} + ${Math.abs(R.x2)} = ${R.w} units.`;
      dist = [
        {
          html: `${name} should have added the x-coordinates: ${dec(R.x1)} + ${dec(R.x2)}.`,
          why: `Adding the coordinates with their signs gives ${dec(R.x1 + R.x2)}, which is not a length. Add the absolute values, the distances from 0.`,
        },
        {
          html: `The work for BC is wrong. ${name} should have subtracted the y-coordinates' absolute values.`,
          why: `BC is correct: ${sideWork(R.y1, R.y2)}. ${sideRule(R.y1, R.y2)} The mistake is in AB.`,
        },
        { html: `${name} is correct.`, why: `Look at AB on the grid: it runs from x = ${dec(R.x1)} to x = ${dec(R.x2)}, which is ${R.w} squares, not ${wrongW}.` },
      ];
    } else if (kind === 'offby') {
      wrongW = R.w + 1;
      wrongH = R.h + 1;
      work = `AB: I counted ${wrongW} grid points from A to B, so AB = ${wrongW} units<br>BC: I counted ${wrongH} grid points, so BC = ${wrongH} units<br>Perimeter = 2 × (${wrongW} + ${wrongH}) = ${2 * (wrongW + wrongH)} units`;
      correctOpt = `${name} counted grid points instead of the spaces between them. From A to B there are ${wrongW} points but only ${R.w} unit spaces. AB = ${R.w} and BC = ${R.h}.`;
      dist = [
        {
          html: `${name} should have multiplied the two sides instead of adding them.`,
          why: 'Multiplying gives the area. Perimeter is found by adding the sides, which is what the work does. The mistake is in the side lengths.',
        },
        {
          html: `${name} is correct. Counting the grid points gives the length.`,
          why: `A side from x = ${dec(R.x1)} to x = ${dec(R.x2)} is |${dec(R.x2)} − ${dec(R.x1)}| = ${R.w} units. Counting points adds one extra.`,
        },
        { html: `${name} forgot that a rectangle has four sides.`, why: 'The 2 × already counts both pairs of sides. The side lengths themselves are each one too big.' },
      ];
    } else {
      wrongW = Math.abs(R.x1 + R.x2);
      wrongH = R.h;
      work = `AB: ${Math.abs(R.x1)} + ${Math.abs(R.x2)} = ${wrongW} units<br>BC: ${sideWork(R.y1, R.y2)} units<br>Perimeter = 2 × (${wrongW} + ${wrongH}) = ${2 * (wrongW + wrongH)} units`;
      correctOpt = `${name} added the absolute values for AB, but ${dec(R.x1)} and ${dec(R.x2)} are on the same side of the y-axis. Subtract: ${Math.max(Math.abs(R.x1), Math.abs(R.x2))} − ${Math.min(Math.abs(R.x1), Math.abs(R.x2))} = ${R.w} units.`;
      dist = [
        { html: `${name} should have added the two sides only once, not doubled them.`, why: 'A rectangle has two of each side, so doubling is right. The mistake is in the length of AB.' },
        { html: `The work for BC is wrong. ${name} should have added the absolute values for BC.`, why: `BC is correct: ${sideWork(R.y1, R.y2)}. ${sideRule(R.y1, R.y2)} The mistake is in AB.` },
        {
          html: `${name} is correct.`,
          why: `Count the squares from x = ${dec(R.x1)} to x = ${dec(R.x2)} on the grid: there are ${R.w}, not ${wrongW}. Both coordinates are on the same side of the y-axis.`,
        },
      ];
    }
    const opts = [{ html: correctOpt, ok: true }].concat(dist);
    const sh = shuffleOptions(r, opts, 0);
    const wrongP = 2 * (wrongW + wrongH);
    return {
      type: 'error',
      skill: 'polygons-plane',
      lesson: '7-7',
      title: 'Find the perimeter mistake',
      prompt: `<p>${name} finds the perimeter of the ${room}, a rectangle with vertices ${vertList(R)}.</p>${rectPlane(R)}<p>What is the mistake?</p>`,
      work,
      options: sh.options,
      answer: sh.answer,
      fix: { label: 'Correct perimeter, in units: ', answer: P },
      hints: [
        'Check each side length against the grid. Count the unit spaces along AB and along BC.',
        `AB runs from x = ${dec(R.x1)} to x = ${dec(R.x2)}. ${sideRule(R.x1, R.x2)} That gives ${sideWork(R.x1, R.x2)}.`,
        `BC = ${R.h} units. With AB = ${R.w}, the perimeter is 2 × (${R.w} + ${R.h}).`,
      ],
      solution: `<p>${correctOpt} BC = ${R.h} units is right. The correct perimeter is 2 × (${R.w} + ${R.h}) = <b>${P} units</b>, not ${wrongP}.</p>`,
      feedback: {
        correct: `Correct. AB = ${R.w}, BC = ${R.h}, perimeter = ${P} units.`,
        wrong(ans, d) {
          if (!d.mistakeOk) return (sh.options[ans.mistake] && sh.options[ans.mistake].why) || `Count the grid spaces along AB. Does the work match?`;
          const got = parseNum(ans.fix);
          if (got != null && near(got, wrongP, 0.001)) return `You found the mistake, but ${wrongP} is ${name}'s wrong perimeter. Use AB = ${R.w} and BC = ${R.h}.`;
          if (got != null && near(got, R.w + R.h, 0.001)) return `You found the mistake. Now double ${R.w} + ${R.h} to count all four sides.`;
          if (got != null && near(got, R.w * R.h, 0.001)) return `You found the mistake. ${R.w * R.h} is the area; perimeter adds the sides.`;
          return `You found the mistake. The perimeter is 2 × (${R.w} + ${R.h}).`;
        },
      },
    };
  });

  // ---------- Table: grid lengths to real lengths (table) ----------
  G.define('n7_scaleTable', (r) => {
    const R = drawRect(r);
    const S = r.pick(SCALES);
    const room = r.pick(ROOMS);
    const name = r.pick(NAMES);
    const rows = [
      ['Side', 'Grid length (units)', `Real length (${S.u})`],
      ['AB', String(R.w), '__IN:r0__'],
      ['BC', String(R.h), '__IN:r1__'],
      ['CD', '__IN:g2__', '__IN:r2__'],
      ['DA', '__IN:g3__', '__IN:r3__'],
    ];
    const inputs = [
      { id: 'r0', answer: R.w * S.k },
      { id: 'r1', answer: R.h * S.k },
      { id: 'g2', answer: R.w },
      { id: 'r2', answer: R.w * S.k },
      { id: 'g3', answer: R.h },
      { id: 'r3', answer: R.h * S.k },
    ];
    return {
      type: 'table',
      skill: 'scale-design',
      lesson: '7-7',
      title: 'Complete the scale table',
      prompt: `<p>${name}'s blueprint of the ${room} uses the scale ${hl(`1 unit = ${S.k} ${S.uu}`)}. The rectangle has vertices ${vertList(R)}. Sides AB and BC are already measured in grid units.</p>${rectPlane(R)}<p>Complete the table.</p>`,
      rows,
      inputs,
      hints: [
        `Real length = grid length × ${S.k}. Opposite sides of a rectangle are equal.`,
        `AB = ${R.w} units, so in real life AB = ${R.w} × ${S.k} = ${R.w * S.k} ${S.u}. CD is opposite AB, so CD is also ${R.w} units.`,
        `DA is opposite BC, so DA = ${R.h} units. Multiply each grid length by ${S.k} for the real lengths.`,
      ],
      solution: `<ul><li>AB: ${R.w} units → ${R.w} × ${S.k} = <b>${R.w * S.k} ${S.u}</b></li><li>BC: ${R.h} units → <b>${R.h * S.k} ${S.u}</b></li><li>CD = AB = <b>${R.w}</b> units → <b>${R.w * S.k} ${S.u}</b></li><li>DA = BC = <b>${R.h}</b> units → <b>${R.h * S.k} ${S.u}</b></li></ul><p>Opposite sides of a rectangle are equal, and every grid unit stands for ${S.k} ${S.uu}. Check CD from the coordinates: ${sideWork(R.x1, R.x2)}.</p>`,
      feedback: {
        correct: `Correct. Each grid unit is ${S.k} ${S.uu}, and opposite sides match.`,
        wrong(ans, d) {
          const id = String(d.wrong[0]);
          const inp = inputs.find((x) => x.id === id);
          const got = parseNum(ans[id]);
          const side = ['AB', 'BC', 'CD', 'DA'][Number(id[1])];
          if (id[0] === 'g') {
            const other = side === 'CD' ? 'AB' : 'BC';
            if (got != null && near(got, inp.answer * S.k, 0.001))
              return `${got} is the real length. The grid-length column asks for units on the blueprint. ${side} is opposite ${other}, so it has the same grid length.`;
            return `${side} is opposite ${other} in the rectangle. Opposite sides are equal, so copy ${other}'s grid length.`;
          }
          const gridLen = inp.answer / S.k;
          if (got != null && near(got, gridLen, 0.001)) return `${got} is the grid length. Multiply by the scale, ${S.k}, to get the real length of ${side}.`;
          if (got != null && near(got, gridLen + S.k, 0.001)) return `Do not add the scale. Each of the ${gridLen} units stands for ${S.k} ${S.uu}, so multiply.`;
          return `Real length of ${side} = grid length × ${S.k}.`;
        },
      },
    };
  });
})(typeof window !== 'undefined' ? window : globalThis);

/* js/units/u7/gen-cave.js */
/* Optional zone — Ice Cave. Harder, mixed-skill challenge generators (prefix nc_). */
(function (root) {
  'use strict';
  const RX = root.RX;
  const { G, V, shuffleOptions, NAMES, parseNum, near } = RX;
  const { dec, pair, quad, mixedHtml, mixedText } = RX.N7;
  const hl = V.hl;

  const LIM = 6;
  const PLANE = (o) => V.graph(Object.assign({ xMin: -LIM, xMax: LIM, yMin: -LIM, yMax: LIM, size: 260 }, o));
  const SITES = ['ice shelter', 'crystal pool', 'fuel cache', 'radio relay', 'drill site', 'snow bridge', 'echo chamber', 'blue grotto'];
  const SCALES = [
    { k: 2, u: 'm', uu: 'meters' },
    { k: 3, u: 'm', uu: 'meters' },
    { k: 5, u: 'm', uu: 'meters' },
    { k: 10, u: 'ft', uu: 'feet' },
  ];
  const samePt = (a, b) => a[0] === b[0] && a[1] === b[1];
  const nz = (r, lo, hi) => {
    const m = r.int(lo, hi);
    return r.chance(0.5) ? -m : m;
  };
  const dist1 = (a, b) => Math.abs(a - b);
  /** Work for the distance between two coordinates on one axis (a, b any order). */
  const gapWork = (a, b, f) => {
    f = f || dec;
    const lo = Math.min(a, b),
      hi = Math.max(a, b);
    if (lo < 0 && hi > 0) return `|${f(lo)}| + |${f(hi)}| = ${f(Math.abs(lo))} + ${f(hi)} = ${f(hi - lo)}`;
    const big = Math.abs(a) >= Math.abs(b) ? a : b,
      small = big === a ? b : a;
    return `|${f(big)}| − |${f(small)}| = ${f(Math.abs(big))} − ${f(Math.abs(small))} = ${f(hi - lo)}`;
  };
  const quadName = (x, y) => {
    const q = quad(x, y);
    return q.length <= 3 ? 'Quadrant ' + q : 'the ' + q;
  };

  // ---------- Place an opposite, an absolute value, and a mixed number (nl) ----------
  G.define('nc_nlMixed', (r) => {
    const QUARTERS = [];
    for (let v = -3.75; v <= 3.75; v += 0.25) if (Math.abs(v) > 1e-9) QUARTERS.push(Math.round(v * 100) / 100);
    const nonInt = QUARTERS.filter((v) => !Number.isInteger(v));
    let a, b, c, pa, pb, pc;
    let guard = 0;
    do {
      a = r.pick(nonInt); // "the opposite of a"
      b = -Math.abs(r.pick(nonInt)); // "|b|" with b negative
      c = r.pick(nonInt); // plain mixed number
      pa = -a;
      pb = Math.abs(b);
      pc = c;
      guard++;
    } while (guard < 100 && (new Set([pa, pb, pc]).size < 3 || Math.abs(a) === Math.abs(b) || Math.abs(c) === Math.abs(a) || Math.abs(c) === Math.abs(b)));
    const pts = [pa, pb, pc];
    const name = r.pick(NAMES);
    const site = r.pick(SITES);
    const descHtml = [`the opposite of ${mixedHtml(a)}`, `|${mixedHtml(b)}|`, `${mixedHtml(c)}`];
    const descText = [`the opposite of ${mixedText(a)}`, `|${mixedText(b)}|`, mixedText(c)];
    return {
      type: 'nl',
      skill: 'rational-nl',
      lesson: 'Challenge',
      xp: 20,
      title: 'Place three cave readings',
      prompt: `<p>${name} logs three depth readings at the ${site}, measured from the cave floor line (0). They are written three different ways:</p><ul><li><b>${descHtml[0]}</b></li><li><b>${descHtml[1]}</b></li><li><b>${descHtml[2]}</b></li></ul><p>Place all three values on the number line.</p><p class="muted">Each small tick is one fourth (0.25).</p>`,
      min: -4,
      max: 4,
      step: 0.25,
      labelEvery: 1,
      count: 3,
      points: pts,
      hints: [
        'First turn each description into a single number. The opposite switches the sign. Absolute value is distance from 0, so it is never negative.',
        `The opposite of ${mixedText(a)} is ${mixedText(pa)}. |${mixedText(b)}| = ${mixedText(pb)}, because ${mixedText(b)} is ${mixedText(pb)} units from 0.`,
        `Now place ${mixedText(pa)}, ${mixedText(pb)}, and ${mixedText(c)}. Each whole-number space has 4 ticks; one tick is ¼, two ticks are ½, three ticks are ¾.`,
      ],
      solution: `<p>${descHtml[0]} = <b>${mixedHtml(pa)}</b> (switch the sign). ${descHtml[1]} = <b>${mixedHtml(pb)}</b> (distance from 0, always positive). ${descHtml[2]} is already a number: <b>${mixedHtml(pc)}</b>. Negative values go left of 0, positive values go right, and the fraction part tells how many quarter ticks past the whole number.</p>${V.numberLine(
        {
          min: -4,
          max: 4,
          step: 0.25,
          labelEvery: 1,
          points: pts.map((v, i) => ({ v, label: mixedText(v), color: ['#1FA6A2', '#F2A33A', '#17324D'][i] })),
          aria: `Number line showing ${pts.map(mixedText).join(', ')}`,
        },
      )}`,
      feedback: {
        correct: `Correct. ${pts.map(mixedText).join(', ')}: the opposite flips the sign and the absolute value drops it.`,
        wrong(ans, d) {
          const e = (d.extra || [])[0];
          if (e != null) {
            if (near(e, a, 0.01)) return `${mixedText(a)} is the original number. Its opposite is on the other side of 0: ${mixedText(pa)}.`;
            if (near(e, b, 0.01)) return `${mixedText(b)} is the number inside the bars. |${mixedText(b)}| asks how far it is from 0, which is ${mixedText(pb)}, a positive number.`;
            if (near(e, -c, 0.01)) return `${mixedText(c)} should keep its sign. Only the "opposite of" reading changes sign.`;
            return `${mixedText(e)} is not one of the three values. Rewrite each description as a number first.`;
          }
          const m = (d.missing || [])[0];
          return m != null ? `You still need ${mixedText(m)}. Count quarter ticks from the nearest whole number.` : 'Place exactly three points.';
        },
      },
    };
  });

  // ---------- Elevation table: select all true statements about distance from sea level (ms) ----------
  G.define('nc_msAbs', (r) => {
    const labels = ['A', 'B', 'C', 'D', 'E'];
    const tie = r.chance(0.5);
    let vals;
    let guard = 0;
    do {
      vals = [];
      const pool = [];
      for (let v = -18; v <= 18; v++) if (v !== 0) pool.push(v);
      while (vals.length < 5) {
        const v = r.pick(pool);
        if (!vals.includes(v)) vals.push(v);
      }
      if (tie) vals[4] = -vals[0];
      guard++;
    } while (guard < 100 && (vals.filter((v) => v < 0).length < 2 || vals.filter((v) => v > 0).length < 1 || new Set(vals).size < 5 || (!tie && new Set(vals.map(Math.abs)).size < 5)));
    const abs = vals.map(Math.abs);
    const maxAbs = Math.max(...abs);
    const farIdx = abs.indexOf(maxAbs);
    const farUnique = abs.filter((v) => v === maxAbs).length === 1;
    const minIdx = vals.indexOf(Math.min(...vals));
    const maxIdx = vals.indexOf(Math.max(...vals));
    const site = r.pick(['ice cave', 'cliff survey', 'glacier tunnel']);
    const M = (i) => `Marker ${labels[i]}`;
    const cands = [];
    if (farUnique) cands.push({ html: `${M(farIdx)} is the farthest from sea level`, ok: true });
    // "farthest" distractors only for markers whose absolute value is strictly smaller than the max (no tie ambiguity)
    if (abs[minIdx] < maxAbs)
      cands.push({
        html: `${M(minIdx)} is the farthest from sea level`,
        why: `${M(minIdx)} is the lowest, but "farthest from sea level" means the largest absolute value. |${dec(vals[minIdx])}| = ${abs[minIdx]}, and ${maxAbs} is larger.`,
      });
    if (abs[maxIdx] < maxAbs)
      cands.push({ html: `${M(maxIdx)} is the farthest from sea level`, why: `${M(maxIdx)} is the highest, not the farthest. ${M(farIdx)} is ${maxAbs} from sea level, below it.` });
    cands.push({ html: `${M(minIdx)} is the lowest marker`, ok: true });
    // |a| > |b| comparison (true) and the matching "closer" claim (false) for a pair with different absolute values
    let i1, i2;
    let g2 = 0;
    do {
      [i1, i2] = r.pickN([0, 1, 2, 3, 4], 2);
      g2++;
    } while (abs[i1] === abs[i2] && g2 < 50);
    if (abs[i1] !== abs[i2]) {
      const big = abs[i1] > abs[i2] ? i1 : i2,
        small = big === i1 ? i2 : i1;
      cands.push({ html: `|${dec(vals[big])}| > |${dec(vals[small])}|`, ok: true });
      cands.push({
        html: `${M(big)} is closer to sea level than ${M(small)}`,
        why: `Closer to sea level means a smaller absolute value. |${dec(vals[big])}| = ${abs[big]} and |${dec(vals[small])}| = ${abs[small]}, so ${M(small)} is closer.`,
      });
    }
    const tiePair = tie ? [0, 4] : null;
    if (tiePair) cands.push({ html: `${M(tiePair[0])} and ${M(tiePair[1])} are the same distance from sea level`, ok: true });
    else {
      const [j1, j2] = r.pickN([0, 1, 2, 3, 4], 2);
      cands.push({
        html: `${M(j1)} and ${M(j2)} are the same distance from sea level`,
        why: `|${dec(vals[j1])}| = ${abs[j1]} and |${dec(vals[j2])}| = ${abs[j2]}. Different absolute values mean different distances.`,
      });
    }
    // negative marker with a larger absolute value than a positive one: "is higher" is false
    const negI = vals.findIndex((v) => v < 0 && Math.abs(v) > Math.max(...vals.filter((x) => x > 0)));
    const posI = vals.findIndex((v) => v > 0);
    if (negI >= 0 && posI >= 0)
      cands.push({
        html: `${M(negI)} is higher than ${M(posI)} because ${abs[negI]} > ${abs[posI]}`,
        why: `${abs[negI]} > ${abs[posI]} compares distances from sea level, not heights. ${dec(vals[negI])} is below sea level, so it is lower than every positive elevation.`,
      });
    // dedupe and pick 5 with at least 2 true and 2 false
    const seen = new Set();
    const uniq = cands.filter((c) => (seen.has(c.html) ? false : (seen.add(c.html), true)));
    const trues = r.shuffle(uniq.filter((c) => c.ok));
    const falses = r.shuffle(uniq.filter((c) => !c.ok));
    const opts = trues.slice(0, Math.min(3, trues.length)).concat(falses.slice(0, 5 - Math.min(3, trues.length)));
    const okIdx = opts.map((o2, i) => (o2.ok ? i : -1)).filter((i) => i >= 0);
    const sh = shuffleOptions(r, opts, okIdx);
    const table = V.table([['Marker', 'Elevation (m)']].concat(vals.map((v, i) => [labels[i], dec(v)])), { cls: 'compact' });
    return {
      type: 'ms',
      skill: 'abs-distance',
      lesson: 'Challenge',
      xp: 20,
      title: 'Which statements are true?',
      prompt: `<p>Five survey markers in the ${site} have these elevations. Sea level is 0.</p>${table}<p>Select <b>all</b> the statements that are true.</p>`,
      options: sh.options,
      answers: sh.answers,
      hints: [
        'Distance from sea level is the absolute value, so drop the sign. Lowest and highest use the signed numbers on a number line.',
        `The absolute values are ${vals.map((v, i) => `${labels[i]}: ${abs[i]}`).join(', ')}.`,
        `The lowest marker is the most negative, ${M(minIdx)} at ${dec(vals[minIdx])}. The farthest from sea level has the largest absolute value, ${maxAbs}.`,
      ],
      solution: `<p>True: <b>${sh.options
        .filter((o2) => o2.ok)
        .map((o2) => o2.html)
        .join('</b>, <b>')}</b>.</p><ul>${sh.options
        .filter((o2) => !o2.ok)
        .map((o2) => `<li>${o2.html} is false. ${o2.why}</li>`)
        .join('')}</ul><p>Absolute value measures distance from 0 in either direction. The sign tells above or below; the absolute value tells how far.</p>`,
      feedback: {
        correct: 'Correct. The sign says above or below sea level; the absolute value says how far.',
        wrong(ans, d) {
          if (d.extra && d.extra.length) return sh.options[d.extra[0]].why;
          if (d.missing && d.missing.length) return `You missed a true statement: ${sh.options[d.missing[0]].html}. Check it with the absolute values.`;
          return 'Check each statement against the table, using absolute values for distance.';
        },
      },
    };
  });

  // ---------- Order markers on the axes by distance from the station (seq) ----------
  G.define('nc_seqAbs', (r) => {
    const labels = ['A', 'B', 'C', 'D'];
    let pts;
    let guard = 0;
    do {
      pts = [
        [-r.int(1, LIM), 0],
        [0, r.int(1, LIM)],
        [r.int(1, LIM), 0],
        [0, -r.int(1, LIM)],
      ];
      guard++;
    } while (guard < 100 && new Set(pts.map((p) => Math.abs(p[0]) + Math.abs(p[1]))).size < 4);
    const d = pts.map((p) => Math.abs(p[0]) + Math.abs(p[1]));
    const nearFirst = r.chance(0.5);
    const order = [0, 1, 2, 3].sort((x, y) => (nearFirst ? d[x] - d[y] : d[y] - d[x]));
    const sites = r.pickN(SITES, 4);
    const items = pts.map((p, i) => ({ html: `<b>${sites[i]}</b> ${pair(p[0], p[1])}`, rate: d[i] }));
    const where = (p) => (p[1] === 0 ? `${Math.abs(p[0])} units ${p[0] < 0 ? 'west (left)' : 'east (right)'}` : `${Math.abs(p[1])} units ${p[1] < 0 ? 'south (down)' : 'north (up)'}`);
    return {
      type: 'seq',
      skill: 'abs-value',
      lesson: 'Challenge',
      xp: 20,
      title: nearFirst ? 'Order the sites, nearest first' : 'Order the sites, farthest first',
      prompt: `<p>Four cave sites sit on the axes of the survey grid. The station is at the origin, (0, 0). Put them in order from <b>${nearFirst ? 'nearest (top) to farthest (bottom)' : 'farthest (top) to nearest (bottom)'}</b> from the station.</p>${PLANE(
        {
          series: [{ points: pts, labels: sites.map((s, i) => labels[i]) }],
          aria: `Coordinate plane with four sites on the axes: ${pts.map((p) => pair(p[0], p[1])).join(', ')}`,
        },
      )}<p class="muted">${sites.map((s, i) => `${labels[i]} = ${s}`).join(' · ')}</p>`,
      items,
      order,
      hints: [
        'A point on an axis has one coordinate equal to 0. Its distance from the origin is the absolute value of the other coordinate.',
        `For example, ${pair(pts[0][0], pts[0][1])} is |${dec(pts[0][0])}| = ${d[0]} units from the station. A negative coordinate does not mean a shorter distance.`,
        `The distances are ${pts.map((p, i) => `${labels[i]}: ${d[i]}`).join(', ')}. ${nearFirst ? 'Smallest' : 'Largest'} goes on top.`,
      ],
      solution: `<p>${pts.map((p, i) => `${sites[i]} ${pair(p[0], p[1])} is ${where(p)}, so ${d[i]} units away`).join('. ')}. From ${nearFirst ? 'nearest to farthest' : 'farthest to nearest'}: <b>${order.map((i) => sites[i]).join(', ')}</b>. Distance uses absolute value, so the direction (the sign) does not matter.</p>`,
      feedback: {
        correct: `Correct. Distances ${order.map((i) => d[i]).join(', ')}: absolute value ignores direction.`,
        wrong() {
          return 'At least one site is out of place. Find each distance as the absolute value of the nonzero coordinate. A larger negative number is farther away, not closer.';
        },
      },
    };
  });

  // ---------- Who compared two fractional-coordinate segments correctly? (who) ----------
  G.define('nc_whoFraction', (r) => {
    const FR = [0.5, 1.5, 2.5, 3.5, 1.25, 1.75, 2.25, 2.75, 0.75, 3.25];
    let ax, bx, ay, by, L1, L2;
    let guard = 0;
    do {
      ax = -r.pick(FR);
      bx = r.chance(0.5) ? r.pick(FR) : r.int(1, 4);
      ay = -(r.chance(0.5) ? r.pick(FR) : r.int(1, 4));
      by = r.pick(FR);
      L1 = Math.abs(ax) + Math.abs(bx);
      L2 = Math.abs(ay) + Math.abs(by);
      guard++;
    } while (guard < 100 && (Math.abs(L1 - L2) < 0.01 || L1 > 7 || L2 > 7 || Math.abs(Math.abs(ax) - Math.abs(bx)) < 0.01 || Math.abs(Math.abs(ay) - Math.abs(by)) < 0.01));
    const y0 = nz(r, 1, 4),
      x0 = nz(r, 1, 4);
    const p1 = [ax, y0],
      q1 = [bx, y0];
    const p2 = [x0, ay],
      q2 = [x0, by];
    const P = (p) => `(${mixedHtml(p[0])}, ${mixedHtml(p[1])})`;
    const PT = (p) => `(${mixedText(p[0])}, ${mixedText(p[1])})`;
    const longer = L1 > L2 ? 1 : 2;
    const sub1 = Math.abs(Math.abs(ax) - Math.abs(bx)),
      sub2 = Math.abs(Math.abs(ay) - Math.abs(by));
    const subLonger = sub1 > sub2 ? 1 : sub1 < sub2 ? 2 : longer === 1 ? 2 : 1;
    const posLonger = Math.abs(bx) > Math.abs(by) ? 1 : Math.abs(bx) < Math.abs(by) ? 2 : longer === 1 ? 2 : 1;
    const [n1, n2, n3] = r.pickN(NAMES, 3);
    const opts = [
      {
        title: n1,
        html: `Segment 1 crosses the y-axis: |${mixedHtml(ax)}| + |${mixedHtml(bx)}| = ${mixedHtml(L1)}. Segment 2 crosses the x-axis: |${mixedHtml(ay)}| + |${mixedHtml(by)}| = ${mixedHtml(L2)}. <b>Segment ${longer}</b> is longer.`,
        ok: true,
      },
      {
        title: n2,
        html: `Segment 1 is ${mixedHtml(sub1)} and Segment 2 is ${mixedHtml(sub2)}, so <b>Segment ${subLonger}</b> is longer.`,
        why: `${n2} subtracted the absolute values. Both segments cross an axis, so each one has a piece on each side of 0. Add the two distances from 0: ${mixedText(L1)} and ${mixedText(L2)}.`,
      },
      {
        title: n3,
        html: `Segment 1 reaches ${mixedHtml(bx)} and Segment 2 reaches ${mixedHtml(by)}, so <b>Segment ${posLonger}</b> is longer.`,
        why: `${n3} used only the positive endpoint of each segment and ignored the part on the negative side. The lengths are ${mixedText(L1)} and ${mixedText(L2)}.`,
      },
    ];
    const sh = shuffleOptions(r, opts, 0);
    return {
      type: 'who',
      skill: 'distance-plane',
      lesson: 'Challenge',
      xp: 20,
      title: 'Which rope is longer?',
      prompt: `<p>Two guide ropes are stretched across the cave grid. <b>Segment 1</b> runs from <b>${P(p1)}</b> to <b>${P(q1)}</b>. <b>Segment 2</b> runs from <b>${P(p2)}</b> to <b>${P(q2)}</b>.</p>${PLANE(
        {
          xMin: -5,
          xMax: 5,
          yMin: -5,
          yMax: 5,
          series: [
            { points: [p1, q1], line: true, labels: ['1', '1'] },
            { points: [p2, q2], line: true, color: '#F2A33A', labels: ['2', '2'] },
          ],
          aria: `Coordinate plane showing horizontal Segment 1 from ${PT(p1)} to ${PT(q1)} and vertical Segment 2 from ${PT(p2)} to ${PT(q2)}`,
        },
      )}<p>Three navigators compare the two ropes. Who is correct?</p>`,
      options: sh.options,
      answer: sh.answer,
      layout: 'cards',
      hints: [
        'Segment 1 is horizontal, so its length comes from the x-coordinates. Segment 2 is vertical, so use the y-coordinates. Fractions work the same way as integers.',
        `Segment 1: ${mixedText(ax)} and ${mixedText(bx)} have opposite signs, so add the absolute values: ${mixedText(Math.abs(ax))} + ${mixedText(bx)}.`,
        `Segment 2: ${mixedText(Math.abs(ay))} + ${mixedText(by)}. Now compare the two totals.`,
      ],
      solution: `<p>${n1} is correct. Segment 1: ${gapWork(ax, bx, mixedText)} units. Segment 2: ${gapWork(ay, by, mixedText)} units. ${mixedText(Math.max(L1, L2))} > ${mixedText(Math.min(L1, L2))}, so <b>Segment ${longer}</b> is longer by ${mixedText(Math.abs(L1 - L2))} unit${Math.abs(L1 - L2) === 1 ? '' : 's'}. Subtracting the absolute values or using only one endpoint leaves out the part of the rope on the other side of the axis.</p>`,
      feedback: { correct: `Correct. ${mixedText(L1)} and ${mixedText(L2)}: add the distances from 0 when a segment crosses an axis.` },
    };
  });

  // ---------- Two-step walk on the grid (plot) ----------
  G.define('nc_plotDouble', (r) => {
    const start = [nz(r, 1, LIM - 1), nz(r, 1, LIM - 1)];
    // each move crosses an axis and ends inside the grid
    const endX = -Math.sign(start[0]) * r.int(1, LIM);
    const endY = -Math.sign(start[1]) * r.int(1, LIM);
    const dx = Math.abs(start[0]) + Math.abs(endX),
      dy = Math.abs(start[1]) + Math.abs(endY);
    const dirX = endX > start[0] ? 'right' : 'left';
    const dirY = endY > start[1] ? 'up' : 'down';
    const horizontalFirst = r.chance(0.5);
    const end = [endX, endY];
    const mid = horizontalFirst ? [endX, start[1]] : [start[0], endY];
    const move1 = horizontalFirst ? `${dx} units ${dirX}` : `${dy} units ${dirY}`;
    const move2 = horizontalFirst ? `${dy} units ${dirY}` : `${dx} units ${dirX}`;
    const name = r.pick(NAMES);
    const [s1, s2] = r.pickN(SITES, 2);
    return {
      type: 'plot',
      skill: 'plot-points',
      lesson: 'Challenge',
      xp: 20,
      title: 'Follow the two-step route',
      prompt: `<p>${name} starts at the ${s1}, ${hl(pair(start[0], start[1]))}, shown in gray. The route to the ${s2} is: walk ${hl(move1)}, then walk ${hl(move2)}.</p><p>Plot the point where ${name} ends.</p>`,
      xLabel: 'x',
      yLabel: 'y',
      xMin: -LIM,
      xMax: LIM,
      yMin: -LIM,
      yMax: LIM,
      given: [start],
      givenLabels: [pair(start[0], start[1])],
      points: [end],
      count: 1,
      hints: [
        'Left or right changes only x. Up or down changes only y. Do one move at a time.',
        `After the first move (${move1}) ${name} is at ${pair(mid[0], mid[1])}. Moving ${dirX} from x = ${dec(start[0])} crosses the y-axis: ${Math.abs(start[0])} units to reach 0, then ${Math.abs(endX)} more.`,
        `Now the second move (${move2}) from ${pair(mid[0], mid[1])}. The y-coordinate goes from ${dec(start[1])} across the x-axis to ${dec(endY)}.`,
      ],
      solution: `<p>Start ${pair(start[0], start[1])}. ${horizontalFirst ? `Move ${dx} ${dirX}: x goes from ${dec(start[0])} to ${dec(endX)} (${Math.abs(start[0])} units to the axis, ${Math.abs(endX)} past it). Now at ${pair(mid[0], mid[1])}. Move ${dy} ${dirY}: y goes from ${dec(start[1])} to ${dec(endY)}.` : `Move ${dy} ${dirY}: y goes from ${dec(start[1])} to ${dec(endY)} (${Math.abs(start[1])} units to the axis, ${Math.abs(endY)} past it). Now at ${pair(mid[0], mid[1])}. Move ${dx} ${dirX}: x goes from ${dec(start[0])} to ${dec(endX)}.`} ${name} ends at <b>${pair(end[0], end[1])}</b>, in ${quadName(end[0], end[1])}. Check: |${dec(start[0])}| + |${dec(endX)}| = ${dx} and |${dec(start[1])}| + |${dec(endY)}| = ${dy}.</p>${PLANE(
        {
          series: [
            { points: [start], color: '#5B6B7A', labels: [pair(start[0], start[1])] },
            { points: [start, mid, end], line: true, labels: ['', pair(mid[0], mid[1]), pair(end[0], end[1])] },
          ],
          aria: `Coordinate plane showing the route from ${pair(start[0], start[1])} through ${pair(mid[0], mid[1])} to ${pair(end[0], end[1])}`,
        },
      )}`,
      feedback: {
        correct: `Correct. ${pair(end[0], end[1])}: ${dx} ${dirX} and ${dy} ${dirY} from the start, crossing both axes.`,
        wrong(ans, d) {
          const e = (d.extra || [])[0];
          if (!e) return `Place one point: the spot after both moves.`;
          if (samePt(e, mid)) return `${pair(e[0], e[1])} is where ${name} is after the first move only. Now do the second move: ${move2}.`;
          if (samePt(e, start)) return 'That is the starting point. Follow both moves.';
          if (e[0] === end[1] && e[1] === end[0]) return 'You swapped x and y. Left or right changes the first coordinate; up or down changes the second.';
          if (e[1] === endY && e[0] !== endX) {
            const wrongWay = Math.sign(e[0] - start[0]) !== Math.sign(endX - start[0]);
            return wrongWay
              ? `The y is right, but "${dirX}" means ${dirX === 'left' ? 'toward smaller x' : 'toward larger x'}.`
              : `The y is right. For x, count ${dx} spaces from ${dec(start[0])}: ${Math.abs(start[0])} to reach 0, then ${Math.abs(endX)} more.`;
          }
          if (e[0] === endX && e[1] !== endY) {
            const wrongWay = Math.sign(e[1] - start[1]) !== Math.sign(endY - start[1]);
            return wrongWay
              ? `The x is right, but "${dirY}" means ${dirY === 'down' ? 'toward smaller y' : 'toward larger y'}.`
              : `The x is right. For y, count ${dy} spaces from ${dec(start[1])}: ${Math.abs(start[1])} to reach 0, then ${Math.abs(endY)} more.`;
          }
          return `Do one move at a time. ${move1} changes ${horizontalFirst ? 'x' : 'y'} only; then ${move2} changes ${horizontalFirst ? 'y' : 'x'} only.`;
        },
      },
    };
  });

  // ---------- Error: reflected across the wrong axis, so the image landed in the wrong quadrant (error) ----------
  G.define('nc_errorQuadrant', (r) => {
    const p = [nz(r, 1, LIM), nz(r, 1, LIM)];
    const axis = r.pick(['x', 'y']);
    const should = axis === 'x' ? 'y' : 'x'; // coordinate that should change
    const correct = axis === 'x' ? [p[0], -p[1]] : [-p[0], p[1]];
    const wrongPt = axis === 'x' ? [-p[0], p[1]] : [p[0], -p[1]];
    const trueDist = 2 * Math.abs(axis === 'x' ? p[1] : p[0]);
    const wrongDist = 2 * Math.abs(axis === 'x' ? p[0] : p[1]);
    const name = r.pick(NAMES);
    const site = r.pick(SITES);
    const opts = [
      {
        html: `${name} changed the sign of ${axis} instead of ${should}. Reflecting across the ${axis}-axis moves the point ${axis === 'x' ? 'up or down' : 'left or right'}, so P′ = ${pair(correct[0], correct[1])} in ${quadName(correct[0], correct[1])}, and the distance is ${trueDist} units.`,
        ok: true,
      },
      {
        html: `${name} should have changed both signs. P′ = ${pair(-p[0], -p[1])}.`,
        why: `Reflecting across one axis flips the point over one line, so exactly one coordinate changes sign. Changing both reflects across both axes.`,
      },
      {
        html: `The reflection is right, but the distance should be ${Math.abs(axis === 'x' ? p[0] : p[1])} units, not ${wrongDist}.`,
        why: `The reflection itself is wrong. ${pair(wrongPt[0], wrongPt[1])} is the mirror image across the ${should}-axis, not the ${axis}-axis. Fix the image first, then the distance.`,
      },
      {
        html: `${name} is correct.`,
        why: `A reflection across the ${axis}-axis keeps ${axis} the same and changes the sign of ${should}. ${name} kept ${should} and changed ${axis}, so the image is on the wrong side.`,
      },
    ];
    const sh = shuffleOptions(r, opts, 0);
    return {
      type: 'error',
      skill: 'reflect',
      lesson: 'Challenge',
      xp: 20,
      title: 'Find the reflection mistake',
      prompt: `<p>Vertex P of the ${site} is at ${hl(pair(p[0], p[1]))}. ${name} reflects P across the <b>${axis}-axis</b> to get P′, then finds the distance from P to P′.</p>${PLANE({
        series: [
          { points: [p], labels: ['P'] },
          { points: [wrongPt], color: '#C8553D', labels: ['P′ (' + name + ')'] },
        ],
        aria: `Coordinate plane showing P at ${pair(p[0], p[1])} and ${name}'s point at ${pair(wrongPt[0], wrongPt[1])}`,
      })}<p>What is the mistake?</p>`,
      work: `P ${pair(p[0], p[1])} → P′ ${pair(wrongPt[0], wrongPt[1])}<br>P′ is in ${quadName(wrongPt[0], wrongPt[1])}.<br>Distance from P to P′ = |${dec(axis === 'x' ? p[0] : p[1])}| + |${dec(axis === 'x' ? -p[0] : -p[1])}| = ${wrongDist} units`,
      options: sh.options,
      answer: sh.answer,
      fix: { label: 'Correct distance from P to P′, in units: ', answer: trueDist },
      hints: [
        `The ${axis}-axis is the mirror. Picture P flipping over the ${axis}-axis. Which direction does it move?`,
        `Flipping over the ${axis}-axis moves P ${axis === 'x' ? 'from above to below (or below to above)' : 'from left to right (or right to left)'}. That changes ${should}, so P′ = ${pair(correct[0], correct[1])}.`,
        `P and P′ share ${axis} = ${dec(axis === 'x' ? p[0] : p[1])}. The distance is |${dec(axis === 'x' ? p[1] : p[0])}| + |${dec(correct[axis === 'x' ? 1 : 0])}|.`,
      ],
      solution: `<p>Reflecting across the ${axis}-axis keeps ${axis} and changes the sign of ${should}: P′ = <b>${pair(correct[0], correct[1])}</b>, in ${quadName(correct[0], correct[1])}. ${name} changed ${axis} instead, which is the reflection across the ${should}-axis. P and the correct P′ sit on one ${axis === 'x' ? 'vertical' : 'horizontal'} line on opposite sides of the ${axis}-axis, so the distance is ${gapWork(axis === 'x' ? p[1] : p[0], axis === 'x' ? correct[1] : correct[0])}: <b>${trueDist} units</b>.</p>${PLANE(
        {
          series: [
            { points: [p], labels: ['P'] },
            { points: [correct], color: '#1FA6A2', labels: ['P′'] },
            { points: [wrongPt], color: '#C8553D', labels: ['wrong'] },
          ],
          aria: `Coordinate plane showing P, the correct reflection ${pair(correct[0], correct[1])}, and the wrong point ${pair(wrongPt[0], wrongPt[1])}`,
        },
      )}`,
      feedback: {
        correct: `Correct. Across the ${axis}-axis, ${should} changes sign: P′ = ${pair(correct[0], correct[1])}, ${trueDist} units from P.`,
        wrong(ans, d) {
          if (!d.mistakeOk) return (sh.options[ans.mistake] && sh.options[ans.mistake].why) || `Picture P flipping over the ${axis}-axis. Which coordinate changes?`;
          const got = parseNum(ans.fix);
          if (got != null && near(got, wrongDist, 0.001))
            return `You found the mistake, but ${wrongDist} uses the wrong P′. The true P′ is ${pair(correct[0], correct[1])}. Add the distances of P and P′ from the ${axis}-axis.`;
          if (got != null && near(got, trueDist / 2, 0.001))
            return `You found the mistake. ${trueDist / 2} is the distance from P to the ${axis}-axis. P′ is just as far on the other side, so double it.`;
          return `You found the mistake. P and P′ = ${pair(correct[0], correct[1])} are on opposite sides of the ${axis}-axis: add |${dec(axis === 'x' ? p[1] : p[0])}| and |${dec(correct[axis === 'x' ? 1 : 0])}|.`;
        },
      },
    };
  });

  // ---------- Scaled route table with a round trip (table) ----------
  G.define('nc_scaleTable', (r) => {
    const S = r.pick(SCALES);
    // A -> B horizontal across the y-axis; B -> C vertical across the x-axis
    const A = [-r.int(1, LIM), nz(r, 1, LIM)];
    const B = [r.int(1, LIM), A[1]];
    const C = [B[0], -Math.sign(A[1]) * r.int(1, LIM)];
    const L1 = dist1(A[0], B[0]),
      L2 = dist1(B[1], C[1]);
    const total = L1 + L2;
    const roundTrip = 2 * total;
    const [sA, sB, sC] = r.pickN(SITES, 3);
    const name = r.pick(NAMES);
    const rows = [
      ['Leg', 'From', 'To', 'Grid units', `Real length (${S.u})`],
      ['A to B', `A ${pair(A[0], A[1])}`, `B ${pair(B[0], B[1])}`, '__IN:g0__', '__IN:r0__'],
      ['B to C', `B ${pair(B[0], B[1])}`, `C ${pair(C[0], C[1])}`, '__IN:g1__', '__IN:r1__'],
      ['Round trip A → C → A', '', '', '__IN:g2__', '__IN:r2__'],
    ];
    const inputs = [
      { id: 'g0', answer: L1 },
      { id: 'r0', answer: L1 * S.k },
      { id: 'g1', answer: L2 },
      { id: 'r1', answer: L2 * S.k },
      { id: 'g2', answer: roundTrip },
      { id: 'r2', answer: roundTrip * S.k },
    ];
    return {
      type: 'table',
      skill: 'scale-design',
      lesson: 'Challenge',
      xp: 20,
      title: 'Plan the scaled route',
      prompt: `<p>${name} maps a supply route on a grid where ${hl(`1 unit = ${S.k} ${S.uu}`)}. The route goes from the ${sA} at A ${hl(pair(A[0], A[1]))} to the ${sB} at B ${hl(pair(B[0], B[1]))}, then to the ${sC} at C ${hl(pair(C[0], C[1]))}. Afterward ${name} walks the same route back to A.</p>${PLANE(
        {
          series: [{ points: [A, B, C], line: true, labels: ['A', 'B', 'C'] }],
          aria: `Coordinate plane showing the route from A ${pair(A[0], A[1])} to B ${pair(B[0], B[1])} to C ${pair(C[0], C[1])}`,
        },
      )}<p>Complete the table.</p>`,
      rows,
      inputs,
      hints: [
        'A to B is horizontal, so use the x-coordinates. B to C is vertical, so use the y-coordinates. Both legs cross an axis: add the absolute values.',
        `A to B: ${gapWork(A[0], B[0])} units. B to C: ${gapWork(B[1], C[1])} units. Real length = grid units × ${S.k}.`,
        `One way is ${L1} + ${L2} = ${total} units. A round trip goes there and back, so double it, then scale.`,
      ],
      solution: `<ul><li>A to B: ${gapWork(A[0], B[0])} units → ${L1} × ${S.k} = <b>${L1 * S.k} ${S.u}</b></li><li>B to C: ${gapWork(B[1], C[1])} units → ${L2} × ${S.k} = <b>${L2 * S.k} ${S.u}</b></li><li>Round trip: 2 × (${L1} + ${L2}) = <b>${roundTrip}</b> units → ${roundTrip} × ${S.k} = <b>${roundTrip * S.k} ${S.u}</b></li></ul><p>Each leg crosses an axis, so its length is the sum of two distances from 0. The round trip covers every leg twice.</p>`,
      feedback: {
        correct: `Correct. ${total} units each way, ${roundTrip} units round trip, ${roundTrip * S.k} ${S.uu} in real life.`,
        wrong(ans, d) {
          const id = String(d.wrong[0]);
          const got = parseNum(ans[id]);
          const inp = inputs.find((x) => x.id === id);
          if (id === 'g0' || id === 'g1') {
            const [a, b] = id === 'g0' ? [A[0], B[0]] : [B[1], C[1]];
            if (got != null && near(got, Math.abs(Math.abs(a) - Math.abs(b)), 0.001))
              return `${id === 'g0' ? 'A to B' : 'B to C'} crosses an axis, so add the two distances from 0: ${Math.abs(a)} + ${Math.abs(b)}.`;
            return `${id === 'g0' ? 'A to B uses the x-coordinates' : 'B to C uses the y-coordinates'}: ${dec(a)} and ${dec(b)}. How far apart are they?`;
          }
          if (id === 'g2') {
            if (got != null && near(got, total, 0.001)) return `${total} is one way. A round trip goes to C and back to A, so double it.`;
            return `Round trip = 2 × (${L1} + ${L2}) grid units.`;
          }
          const gridLen = inp.answer / S.k;
          if (got != null && near(got, gridLen, 0.001)) return `${got} is the grid length. Multiply by ${S.k} to get real ${S.uu}.`;
          if (id === 'r2' && got != null && near(got, total * S.k, 0.001)) return `${total * S.k} ${S.u} is one way. The round trip is twice that.`;
          return `Real length = grid units × ${S.k}.`;
        },
      },
    };
  });

  // ---------- Perimeter of a four-quadrant rectangle or an L-shaped figure (num) ----------
  G.define('nc_crossPerimeter', (r) => {
    const Lshape = r.chance(0.5);
    const x1 = -r.int(2, LIM),
      x2 = r.int(2, LIM),
      y1 = -r.int(2, LIM),
      y2 = r.int(2, LIM);
    const W = x2 - x1,
      H = y2 - y1;
    const P = 2 * (W + H);
    const name = r.pick(NAMES);
    const site = r.pick(SITES);
    let verts, labels, area;
    if (Lshape) {
      const xm = r.int(x1 + 1, x2 - 1),
        ym = r.int(y1 + 1, y2 - 1);
      verts = [
        [x1, y1],
        [x2, y1],
        [x2, ym],
        [xm, ym],
        [xm, y2],
        [x1, y2],
      ];
      labels = ['A', 'B', 'C', 'D', 'E', 'F'];
      area = W * H - (x2 - xm) * (y2 - ym);
    } else {
      verts = [
        [x1, y1],
        [x2, y1],
        [x2, y2],
        [x1, y2],
      ];
      labels = ['A', 'B', 'C', 'D'];
      area = W * H;
    }
    const sideLen = (i) => {
      const p = verts[i],
        q = verts[(i + 1) % verts.length];
      return p[1] === q[1] ? dist1(p[0], q[0]) : dist1(p[1], q[1]);
    };
    const sides = verts.map((_, i) => sideLen(i));
    const sideText = verts.map((p, i) => `${labels[i]}${labels[(i + 1) % verts.length]} = ${sides[i]}`).join(', ');
    return {
      type: 'num',
      skill: 'polygons-plane',
      lesson: 'Challenge',
      xp: 20,
      title: Lshape ? 'Perimeter of an L-shaped chamber' : 'Perimeter across all four quadrants',
      prompt: `<p>The ${site} is drawn on the cave grid with vertices ${verts.map((p, i) => `${labels[i]} ${hl(pair(p[0], p[1]))}`).join(', ')}. Each grid unit is 1 meter.${Lshape ? ' The chamber is L-shaped.' : ' The chamber has one corner in every quadrant.'}</p>${PLANE(
        {
          series: [{ points: verts, polygon: true, labels: labels }],
          aria: `Coordinate plane showing ${Lshape ? 'an L-shaped figure' : 'a rectangle'} with vertices ${verts.map((p) => pair(p[0], p[1])).join(', ')}`,
        },
      )}<p>${name} needs rope to go all the way around the chamber. What is the perimeter, in meters?</p>`,
      unit: 'm',
      answer: P,
      hints: [
        'Go around the figure one side at a time. A horizontal side uses x-coordinates; a vertical side uses y-coordinates. When the two coordinates have opposite signs, add their absolute values.',
        `AB runs from x = ${dec(x1)} to x = ${dec(x2)}: ${gapWork(x1, x2)} units. ${Lshape ? 'Keep going: BC, CD, DE, EF, FA.' : `BC runs from y = ${dec(y1)} to y = ${dec(y2)}: ${gapWork(y1, y2)} units.`}`,
        `Side lengths: ${sideText}. Add them all.`,
      ],
      solution: Lshape
        ? `<p>Side lengths: ${sideText}. Perimeter = ${sides.join(' + ')} = <b>${P} m</b>. Notice that the two short horizontal sides add up to the long bottom side (${W}), and the two short vertical sides add up to the long left side (${H}). So the L-shape has the same perimeter as a rectangle that is ${W} by ${H}: 2 × (${W} + ${H}) = ${P}.</p>`
        : `<p>AB: ${gapWork(x1, x2)} units. BC: ${gapWork(y1, y2)} units. Every side crosses an axis, so each length is a sum of two distances from 0. Perimeter = 2 × (${W} + ${H}) = <b>${P} m</b>.</p>`,
      feedback: {
        correct: `Correct. ${sides.join(' + ')} = ${P} meters of rope.`,
        wrong(ans, d) {
          const v = d.value;
          if (v == null) return 'Type a number of meters.';
          if (near(v, area, 0.001)) return `${area} is the area, the number of grid squares inside. Perimeter adds the side lengths.`;
          if (near(v, W + H, 0.001)) return `${W} + ${H} is only part of the way around. Keep adding until you are back at A.`;
          const subW = Math.abs(Math.abs(x1) - Math.abs(x2)),
            subH = Math.abs(Math.abs(y1) - Math.abs(y2));
          if (near(v, 2 * (subW + subH), 0.001) || near(v, 2 * (subW + H), 0.001) || near(v, 2 * (W + subH), 0.001))
            return `At least one side crosses an axis. For AB, ${dec(x1)} and ${dec(x2)} are on opposite sides of 0, so add: ${Math.abs(x1)} + ${Math.abs(x2)} = ${W}.`;
          if (
            Lshape &&
            near(
              v,
              sides.slice(0, 4).reduce((s, x) => s + x, 0),
              0.001,
            )
          )
            return `You stopped after four sides. The L-shape has six: ${sideText}.`;
          if (near(v, P + verts.length, 0.001) || near(v, P - verts.length, 0.001)) return 'Off by one on each side. Count the spaces between grid lines, not the grid points.';
          return `Add every side: ${sideText}.`;
        },
      },
    };
  });
})(typeof window !== 'undefined' ? window : globalThis);
