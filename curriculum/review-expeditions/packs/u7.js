/* js/units/u7/gen-integers.js */
/* Zone 1 — Thermal Deck. Lesson 7-1 Explore Integers and Their Opposites. */
(function (root) {
  'use strict';
  const RX = root.RX;
  const { G, V, shuffleOptions, NAMES, parseNum } = RX;
  const { dec, signWord } = RX.N7;
  const hl = V.hl;

  // Real-situation pools. Each entry: value -> text. Values are drawn, texts are built from them.
  const SITU = [
    { kind: 'temp', pos: (n) => `a temperature of ${n}°F above zero`, neg: (n) => `a temperature of ${n}°F below zero`, zero: 'a temperature of 0°F', unit: '°F' },
    { kind: 'elev', pos: (n) => `an elevation of ${n} m above sea level`, neg: (n) => `a depth of ${n} m below sea level`, zero: 'an elevation at sea level', unit: 'm' },
    { kind: 'money', pos: (n) => `a deposit of $${n}`, neg: (n) => `a withdrawal of $${n}`, zero: 'no change in the account balance', unit: '$' },
    { kind: 'yards', pos: (n) => `a gain of ${n} yards`, neg: (n) => `a loss of ${n} yards`, zero: 'a play with no gain or loss', unit: 'yards' },
    { kind: 'floors', pos: (n) => `an elevator ${n} floors above the lobby`, neg: (n) => `an elevator ${n} floors below the lobby`, zero: 'an elevator at the lobby', unit: 'floors' },
  ];
  // Level 2 pool: the direction is carried by less familiar words (before/after, debt/profit, dive/climb, rise/drop) or an unusual starting point.
  const SITU_HARD = [
    { kind: 'launch', pos: (n) => `${n} seconds after the weather balloon launch`, neg: (n) => `${n} seconds before the weather balloon launch`, zero: 'the exact moment of the launch' },
    { kind: 'debt', pos: (n) => `a profit of $${n} at the supply store`, neg: (n) => `a debt of $${n} at the supply store`, zero: 'breaking even at the supply store' },
    { kind: 'dive', pos: (n) => `a climb of ${n} m up the ice wall from the surface`, neg: (n) => `a dive of ${n} m under the ice from the surface`, zero: 'staying at the surface of the ice' },
    { kind: 'snow', pos: (n) => `a snow depth ${n} cm above the yearly average`, neg: (n) => `a snow depth ${n} cm below the yearly average`, zero: 'a snow depth exactly at the yearly average' },
    { kind: 'change', pos: (n) => `a rise of ${n}°F since sunrise`, neg: (n) => `a drop of ${n}°F since sunrise`, zero: 'no change in temperature since sunrise' },
    { kind: 'years', pos: (n) => `${n} years after the station opened`, neg: (n) => `${n} years before the station opened`, zero: 'the year the station opened' },
  ];
  const situText = (s, v) => (v > 0 ? s.pos(v) : v < 0 ? s.neg(-v) : s.zero);
  const cap = (t) => t.charAt(0).toUpperCase() + t.slice(1);
  const whyOf = (opts) => (ans) => (opts[ans] && opts[ans].why) || 'Not that one. Decide which side of 0 each value is on, and how far from 0 it is.';

  // ---------- Opposite of an integer (num) ----------
  G.define('n1_opposite', (r, o) => {
    const hard = !!o.hard;
    const name = r.pick(NAMES);
    const form = hard ? r.pick(['triple', 'chain', 'picture']) : r.pick(['plain', 'context', 'picture']);
    let mag, start, answer, prompt, title, hint2, hint3, why, hintEs;
    let nlMin = -10,
      nlMax = 10,
      nlLabel = 2;
    if (form === 'picture') {
      // The starting value is only drawn, never printed, so the answer cannot be read off the text.
      if (hard) {
        nlMin = -20;
        nlMax = 20;
        nlLabel = 5;
        mag = r.pick([11, 12, 13, 14, 16, 17, 18, 19]);
      } else mag = r.pick([3, 5, 7, 9]);
      start = r.chance(0.6) ? -mag : mag;
      answer = -start;
      title = 'Read the gauge, then find the opposite';
      prompt = `<p>${name} checks the frost gauge. The needle is at point <b>A</b>. Point <b>B</b> (not shown) is the <b>opposite</b> of A.</p>${V.numberLine({
        min: nlMin,
        max: nlMax,
        step: 1,
        labelEvery: nlLabel,
        points: [{ v: start, label: 'A', above: true }],
        aria: `Number line from ${nlMin} to ${nlMax}, labeled every ${nlLabel}, with point A at ${start}`,
      })}<p>What number is point B?</p>`;
      hint2 = `Read A first. It is ${mag} ticks ${start < 0 ? 'left' : 'right'} of 0${hard ? ', so count past the labeled tick carefully' : ''}.`;
      hint3 = `Start at 0 and count the same number of ticks to the ${start < 0 ? 'right' : 'left'}. The tick where you stop is B.`;
      why = `A is at ${dec(start)}. B is the same distance from 0 on the other side, so B = <b>${dec(answer)}</b>.`;
    } else if (form === 'plain') {
      mag = r.int(2, 18);
      start = mag;
      answer = -mag;
      title = 'Find the opposite';
      prompt = `<p>The thermal sensor logs ${hl(dec(start))}. The backup sensor, mounted on the other side of the station, always logs the <b>opposite</b> number.</p><p>What does the backup sensor log?</p>`;
      hint2 = `${start} is ${mag} units right of 0. Its opposite is ${mag} units on the other side of 0.`;
      hint3 = `Count ${mag} units to the left of 0. Write that number with its sign.`;
      why = `${start} is ${mag} units right of 0. The opposite is ${mag} units left of 0: <b>${dec(answer)}</b>.`;
    } else if (form === 'context') {
      const s = r.pick(SITU);
      mag = r.int(4, 30);
      start = mag;
      answer = -mag;
      title = 'The opposite situation';
      prompt = `<p>${name} logs ${hl(s.pos(mag))} as the integer ${mag}.</p><p>The next entry is the <b>opposite</b> situation. What integer represents it?</p>`;
      hint2 = `${mag} is ${mag} units above (right of) 0. The opposite situation is the same size in the other direction.`;
      hint3 = `The opposite situation is ${s.neg(mag)}. Write the integer for it, sign first.`;
      why = `The opposite of ${s.pos(mag)} is ${s.neg(mag)}, which is <b>${dec(answer)}</b>.`;
    } else if (form === 'triple') {
      mag = r.int(12, 60);
      start = -mag;
      answer = -mag;
      title = 'Three opposites in a row';
      prompt = `<p>The heater display shows ${hl('−(−(−' + mag + '))')}.</p><p>What single integer does the display stand for?</p>`;
      hint2 = `Work from the inside out. −(−${mag}) is the opposite of −${mag}. Then take the opposite of that result.`;
      hint3 = `−(−${mag}) is positive. Now take the opposite one more time.`;
      why = `−(−${mag}) = ${mag}, and the opposite of ${mag} is <b>${dec(answer)}</b>. Three opposites change the sign three times, so the result is negative.`;
    } else {
      const s = r.pick(SITU_HARD);
      mag = r.int(12, 60);
      start = -mag;
      answer = -mag;
      title = 'A chain of opposites';
      prompt = `<p>Reading A is ${hl(s.neg(mag))}. Reading B is the <b>opposite</b> of A. Reading C is the <b>opposite</b> of B.</p><p>What integer represents reading C?</p>`;
      hint2 = `First write A as an integer: "${s.neg(mag)}" is below the starting point. Then B is its opposite.`;
      hint3 = `B is positive. C is the opposite of B.`;
      why = `A = −${mag}, B = ${mag}, and C = <b>${dec(answer)}</b>. The opposite of the opposite of a number is the number itself.`;
    }
    const twoSteps = form === 'triple' || form === 'chain';
    const hint1 = twoSteps
      ? 'Each "opposite" moves a number to the other side of 0 and keeps its distance from 0. Count how many times the sign changes.'
      : 'Opposites are the same distance from 0 on a number line, but on opposite sides.';
    hintEs = twoSteps
      ? 'Cada "opuesto" pasa el número al otro lado del 0 y mantiene su distancia al 0. Cuenta cuántas veces cambia el signo.'
      : 'Los números opuestos están a la misma distancia del 0 en la recta numérica, pero en lados contrarios.';
    return {
      type: 'num',
      skill: 'opposites',
      lesson: '7-1',
      title,
      prompt: prompt + `<p class="muted">Type a negative number with a minus sign, like -1.</p>`,
      answer,
      hints: [hint1, hint2, hint3],
      hintEs,
      solution: `<p>${why} Taking the opposite changes the sign, never the distance from 0.</p>${V.numberLine({
        min: -Math.max(20, Math.ceil(mag / 10) * 10),
        max: Math.max(20, Math.ceil(mag / 10) * 10),
        step: mag > 20 ? 5 : 1,
        labelEvery: mag > 20 ? 10 : 5,
        points: [
          { v: -answer, label: dec(-answer) },
          { v: answer, label: dec(answer), color: '#1FA6A2' },
        ],
        aria: `Number line showing ${dec(-answer)} and its opposite ${dec(answer)}`,
      })}`,
      feedback: {
        correct: `Correct. ${dec(-answer)} and ${dec(answer)} are both ${mag} units from 0, on opposite sides.`,
        wrong(ans, d) {
          const x = d.value;
          if (x == null) return 'Type one integer. Use a minus sign for a negative number, like -1.';
          if (x === 0) return 'Only 0 is its own opposite. Every other number has an opposite on the other side of 0.';
          if (x === -answer) {
            if (twoSteps) return 'You have the right distance from 0, but the sign is off. Count the sign changes one at a time: each "opposite" flips the sign once.';
            if (form === 'picture') return 'That is where point A is. B is the opposite of A, so it is on the other side of 0.';
            return 'That is the number you started with. Its opposite has the other sign and sits on the other side of 0.';
          }
          if (Math.abs(Math.abs(x) - mag) === 1)
            return form === 'picture' ? `You are one tick off. Find A again by counting from the nearest labeled tick, then count the same distance on the other side of 0.` : `You are one unit off. The opposite is exactly ${mag} units from 0, the same distance as the starting number.`;
          return form === 'picture' ? 'Read A from the labeled ticks first. Then count the same number of ticks on the other side of 0.' : 'Find the starting number on a number line. Count how far it is from 0, then go that same distance the other way.';
        },
      },
    };
  });

  // ---------- Place a number and its opposite (nl) ----------
  G.define('n1_nlOpposites', (r, o) => {
    const hard = !!o.hard;
    const mag = hard ? r.int(5, 11) : r.int(2, 9);
    const v = r.chance(0.5) ? -mag : mag;
    const s = hard ? r.pick(SITU_HARD) : r.pick(SITU);
    const name = r.pick(NAMES);
    const min = hard ? -12 : -10,
      max = -min;
    const le = hard ? 4 : 1;
    const dir = v < 0 ? 'left' : 'right';
    return {
      type: 'nl',
      skill: 'opposites',
      lesson: '7-1',
      title: hard ? 'Place the reading and its opposite' : 'Place a number and its opposite',
      prompt: hard
        ? `<p>${name} logs ${hl(situText(s, v))}. Place the integer for this reading <b>and its opposite</b> on the number line.</p><p class="muted">Only every fourth tick is labeled. Count the ticks.</p>`
        : `<p>Place ${hl(dec(v))} and its opposite on the number line.</p><p class="muted">Click a tick mark to place a point. Click it again to remove it.</p>`,
      min,
      max,
      step: 1,
      labelEvery: le,
      count: 2,
      points: [v, -v],
      hints: [
        hard ? `Decide the sign first: is this reading ${v < 0 ? 'before or below' : 'after or above'} the starting point? That side of 0 is ${v < 0 ? 'negative' : 'positive'}.` : `Start at 0. ${dec(v)} is ${mag} units to the ${dir}.`,
        `The reading is ${dec(v)}. Opposites are the same distance from 0 on opposite sides, so the second point is also ${mag} units from 0.`,
        `Place ${dec(v)} first, ${mag} ticks ${dir} of 0. Then count ${mag} ticks the other way from 0.`,
      ],
      hintEs: hard
        ? `Primero decide el signo: ¿esta lectura está ${v < 0 ? 'antes o por debajo' : 'después o por encima'} del punto de partida? Ese lado del 0 es ${v < 0 ? 'negativo' : 'positivo'}.`
        : `Empieza en 0. ${dec(v)} está ${mag} unidades a la ${v < 0 ? 'izquierda' : 'derecha'}.`,
      solution: `<p>${hard ? `"${cap(situText(s, v))}" is ${v < 0 ? 'below' : 'above'} the starting point, so the reading is <b>${dec(v)}</b>. ` : ''}${dec(v)} is ${mag} units ${dir} of 0, so its opposite ${dec(-v)} is ${mag} units ${v < 0 ? 'right' : 'left'} of 0. The two points are <b>${dec(v)}</b> and <b>${dec(-v)}</b>.</p>${V.numberLine({
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
      })}`,
      feedback: {
        correct: `Correct. ${dec(v)} and ${dec(-v)} are mirror images across 0.`,
        wrong(ans, d) {
          const extra = d.extra || [];
          if (extra.some((x) => x === 0)) return '0 is its own opposite, but it is not the opposite of this reading. Count the same number of ticks from 0 in each direction.';
          if (extra.some((x) => Math.abs(Math.abs(x) - mag) === 1)) return `One point is off by one tick. Count carefully: both points must be exactly ${mag} ticks from 0.`;
          if (extra.length && extra.every((x) => Math.sign(x) === Math.sign(v))) return `Both of your points are on the same side of 0. The opposite of ${dec(v)} is on the other side.`;
          if (hard && extra.length && extra.some((x) => Math.abs(x) !== mag)) return `Check the size of the reading. The number in the words tells how many ticks from 0, and the direction word tells which side.`;
          return `Place ${dec(v)} first (${mag} ticks ${dir} of 0). Then place a point ${mag} ticks on the other side of 0.`;
        },
      },
    };
  });

  // ---------- Who is correct about the opposite of a negative? (who) ----------
  G.define('n1_whoOpposite', (r, o) => {
    const hard = !!o.hard;
    const mag = hard ? r.int(16, 75) : r.int(2, 15);
    const [a, b, c] = r.pickN(NAMES, 3);
    const expr = hard ? `−(−(−${mag}))` : `−(−${mag})`;
    const val = hard ? -mag : mag;
    const opts = hard
      ? [
          { title: a, html: `${expr} = −${mag}. Each opposite flips the sign: three flips end negative.`, ok: true },
          {
            title: b,
            html: `${expr} = ${mag}. Two negative signs make a positive, so it ends positive.`,
            why: `There are three negative signs, not two. −(−${mag}) = ${mag}, and the opposite of ${mag} is −${mag}.`,
          },
          {
            title: c,
            html: `${expr} = −${mag * 3}. Three negative signs mean three groups of ${mag}.`,
            why: `Taking an opposite never changes the distance from 0. The result is still ${mag} units from 0; only the sign can change.`,
          },
        ]
      : [
          { title: a, html: `${expr} = ${mag}. The opposite of −${mag} is ${mag} units on the other side of 0.`, ok: true },
          {
            title: b,
            html: `${expr} = −${mag}. The number is already negative, so it has to stay negative.`,
            why: `The minus sign in front means "the opposite of." The opposite of a negative number is positive, so −(−${mag}) = ${mag}.`,
          },
          {
            title: c,
            html: `${expr} = 0. The two negative signs cancel each other out to nothing.`,
            why: `The signs do "cancel," but that makes the number positive, not zero. −(−${mag}) is ${mag} units from 0, on the positive side.`,
          },
        ];
    const sh = shuffleOptions(r, opts, 0);
    return {
      type: 'who',
      skill: 'opposites',
      lesson: '7-1',
      title: 'Who read the gauge correctly?',
      prompt: `<p>The frost gauge shows the expression ${hl(expr)}. Three navigators disagree about its value.</p><p>Who is correct?</p>`,
      options: sh.options,
      answer: sh.answer,
      layout: 'cards',
      hints: hard
        ? [
            `Work from the inside out. Read −(−${mag}) as "the opposite of negative ${mag}."`,
            `−(−${mag}) is ${mag}. The outside minus sign asks for the opposite of that result.`,
            `Count the sign flips: three. An odd number of flips ends on the negative side, still ${mag} units from 0.`,
          ]
        : ['Read −(−' + mag + ') as "the opposite of negative ' + mag + '."', `On a number line, −${mag} is ${mag} units left of 0. Its opposite is ${mag} units right of 0.`, `Which side of 0 is the opposite of a negative number on? Pick the claim that says so.`],
      hintEs: hard ? `Trabaja de adentro hacia afuera. Lee −(−${mag}) como "el opuesto de menos ${mag}".` : `Lee −(−${mag}) como "el opuesto de menos ${mag}".`,
      solution: hard
        ? `<p>${a} is correct. −(−${mag}) = ${mag}, and the opposite of ${mag} is <b>−${mag}</b>. Each opposite flips the sign but keeps the distance from 0, so three flips land on the negative side.</p>`
        : `<p>${a} is correct. −(−${mag}) means the opposite of −${mag}. Since −${mag} is ${mag} units left of 0, its opposite is ${mag} units right of 0: <b>${mag}</b>. The opposite of a negative number is always positive.</p>`,
      feedback: { correct: `Correct. ${expr} = ${dec(val)}.`, wrong: whyOf(sh.options) },
    };
  });

  // ---------- Sort situations: positive, negative, zero (sort) ----------
  G.define('n1_sortSign', (r, o) => {
    const hard = !!o.hard;
    const pool = hard ? SITU_HARD : SITU;
    const kinds = r.pickN(pool, hard ? 5 : 4);
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
      } else if (i === kinds.length - 1) add(s, 0);
      else add(s, r.chance(0.5) ? n : -n);
    });
    add(r.pick(pool.filter((s) => !kinds.slice(-1).includes(s))), 0);
    const shuffled = r.shuffle(items);
    return {
      type: 'sort',
      skill: 'integers-context',
      lesson: '7-1',
      title: hard ? 'Sort the expedition log' : 'Sort the station log',
      prompt: hard
        ? `<p>The expedition log describes each event in words. Sort each one by the <b>sign</b> of the integer that represents it.</p>`
        : `<p>The station log describes each reading in words. Sort each one by the <b>sign</b> of the integer that represents it.</p><p class="muted">Above, up, gain, and deposit point to positive. Below, down, loss, and withdrawal point to negative. The starting point itself is zero.</p>`,
      bins: ['Positive', 'Negative', 'Zero'],
      items: shuffled,
      hints: [
        'Ask: is this reading above the starting point, below it, or exactly at it?',
        hard ? 'Before, under, debt, dive, and drop describe values less than the starting point, so they are negative.' : 'Words like "below," "loss," and "withdrawal" describe values less than 0, so they are negative.',
        hard ? 'The launch moment, the yearly average, breaking even, the surface, and "no change" are starting points: 0. Zero is neither positive nor negative.' : 'Sea level, the lobby, and "no change" are the starting point, 0. Zero is neither positive nor negative.',
      ],
      hintEs: 'Pregúntate: ¿esta lectura está por encima del punto de partida, por debajo o justo en él?',
      solution: hard
        ? `<p>Events after or above the starting point (after the launch, above the average, profit, climbing, a rise) are <b>positive</b>. Events before, under, or below it (before the launch, below the average, debt, diving, a drop) are <b>negative</b>. The starting point itself is <b>zero</b>.</p>`
        : `<p>Readings above the starting point (above zero, above sea level, deposits, gains) are <b>positive</b>. Readings below it (below zero, below sea level, withdrawals, losses) are <b>negative</b>. The starting point itself (sea level, the lobby, no change) is <b>zero</b>.</p>`,
      feedback: {
        correct: 'Correct. The direction word tells you the sign, and the starting point is always 0.',
        wrong(ans, d) {
          const i = (d.wrong || [])[0];
          const it = shuffled[i];
          if (!it) return 'At least one item is in the wrong bin. Decide if each reading is above the starting point, below it, or at it.';
          const put = ans && ans[i];
          if (it.bin === 2) return `"${it.html}" is exactly at the starting point. That is 0, which is neither positive nor negative.`;
          if (put === 2) return `"${it.html}" has a size, so it is not 0. Decide which direction from the starting point it goes.`;
          if (it.bin === 1) return `"${it.html}" goes below (or before) the starting point, so its integer is negative.`;
          return `"${it.html}" goes above (or after) the starting point, so its integer is positive.`;
        },
      },
    };
  });

  // ---------- Match a situation to its integer (match) ----------
  G.define('n1_matchSituation', (r, o) => {
    const hard = !!o.hard;
    const pool = hard ? SITU_HARD : SITU;
    const kinds = r.pickN(pool, 4);
    const n1 = r.int(5, 40);
    let n2 = r.int(5, 40);
    while (n2 === n1) n2 = r.int(5, 40);
    // Normal: a pair of opposites, one more value, and 0. Hard: two pairs of opposites in four different contexts.
    const vals = hard ? [n1, -n1, n2, -n2] : [n1, -n1, r.chance(0.5) ? n2 : -n2, 0];
    const left = hard ? vals.map((v, i) => situText(kinds[i], v)) : [situText(kinds[0], vals[0]), situText(kinds[1], vals[1]), situText(kinds[2], vals[2]), situText(kinds[0], 0)];
    const rightOrder = r.shuffle([0, 1, 2, 3]);
    const right = rightOrder.map((i) => dec(vals[i]));
    return {
      type: 'match',
      skill: 'integers-context',
      lesson: '7-1',
      title: 'Match each reading to its integer',
      prompt: hard ? `<p>Match each expedition log entry to the integer that represents it. Two pairs of entries use the same numbers, so read every direction word.</p>` : `<p>Match each station log entry to the integer that represents it.</p>`,
      left,
      right,
      pairs: left.map((_, i) => [i, rightOrder.indexOf(i)]),
      hints: [
        hard ? 'Decide the sign first. After, above, profit, climb, and rise are positive. Before, under, debt, dive, and drop are negative.' : 'First decide the sign: above, gain, or deposit is positive; below, loss, or withdrawal is negative.',
        hard ? `Two entries use ${n1} and two use ${n2}. In each pair, one is positive and one is negative.` : `Two entries use the same number, ${n1}. One is positive and one is negative. Read the direction words.`,
        hard ? 'Match the two negative entries first, then the two positive ones.' : 'The entry at the starting point (sea level, lobby, no change) matches 0.',
      ],
      hintEs: hard
        ? 'Primero decide el signo. Después, por encima, ganancia, subida y aumento son positivos. Antes, por debajo, deuda, inmersión y bajada son negativos.'
        : 'Primero decide el signo: por encima, ganancia o depósito es positivo; por debajo, pérdida o retiro es negativo.',
      solution: `<ul>${left.map((t, i) => `<li>${t} → <b>${dec(vals[i])}</b></li>`).join('')}</ul><p>The direction word gives the sign. The number of units gives the distance from 0.</p>`,
      feedback: {
        correct: 'Correct. Each situation has a direction (the sign) and a size (the distance from 0).',
        wrong(ans, d) {
          const i = (d.wrong || [])[0];
          if (i == null || !left[i]) return 'At least one match is off. Decide the sign of each entry first, then its size.';
          const got = (ans || []).find((p) => p[0] === i);
          const gotVal = got ? vals[rightOrder[got[1]]] : null;
          if (gotVal != null && gotVal === -vals[i]) return `"${left[i]}" has the right size but the wrong sign. Is it above or below the starting point?`;
          return `Check "${left[i]}". Is it above the starting point, below it, or at it? Then match the sign and the size.`;
        },
      },
    };
  });

  // ---------- What does 0 (or a negative value) mean in this context? (mc) ----------
  G.define('n1_zeroMeaning', (r, o) => {
    const hard = !!o.hard;
    const name = r.pick(NAMES);
    const v = r.int(3, 40);
    const ctx = r.pick([
      {
        setup: `${name} records an ocean depth of ${hl(dec(-v) + ' m')} and a cliff height of ${hl(v + 15 + ' m')}.`,
        q: 'What does 0 represent in this situation?',
        ok: 'Sea level, where heights and depths start.',
        wrong: [
          ['The deepest point in the ocean below the station.', 'Depths below sea level are negative numbers, so the deepest point would be the most negative value, not 0.'],
          ['The very top of the cliff above the sea.', 'The top of the cliff is a positive elevation above sea level. Zero is the level the heights are measured from.'],
          ['A spot on Earth that has no elevation at all.', 'Every place has an elevation. Zero is a real elevation: exactly at sea level.'],
        ],
        hq: `What does the integer ${hl('−' + (v + 4))} represent in this situation?`,
        hok: `A depth of ${v + 4} m below sea level.`,
        hwrong: [
          [`A height of ${v + 4} m above sea level.`, `A negative sign means below the starting point. ${v + 4} m above sea level would be +${v + 4}.`],
          [`A depth of ${v + 4} m below the cliff top.`, 'The integers are measured from sea level (0), not from the top of the cliff.'],
          [`A distance of ${v + 4} m from the ocean floor.`, 'The value is measured from sea level, not from the floor. The minus sign means below sea level.'],
        ],
      },
      {
        setup: `The outdoor sensor reads ${hl(dec(-v) + '°C')} at night and ${hl(v + 2 + '°C')} at noon.`,
        q: 'What does 0°C represent?',
        ok: 'The temperature at which water freezes.',
        wrong: [
          ['The coldest temperature that is possible.', 'Temperatures can go below 0°C. Those are the negative readings, like the one at night.'],
          ['A moment when there is no temperature.', 'Zero degrees is a real temperature. It is simply the point the scale is measured from.'],
          ['The point where water boils into steam.', 'Water boils at 100°C. Zero is the freezing point.'],
        ],
        hq: `What does a reading of ${hl('−' + (v + 4) + '°C')} represent?`,
        hok: `${v + 4} degrees below the freezing point of water.`,
        hwrong: [
          [`${v + 4} degrees above the freezing point of water.`, `The negative sign means below 0°C, the freezing point. Above would be +${v + 4}°C.`],
          [`${v + 4} degrees colder than the noon reading.`, 'The reading is measured from 0°C, not from another reading.'],
          [`${v + 4} degrees below the point where water boils.`, 'On the Celsius scale, 0°C is where water freezes, not where it boils.'],
        ],
      },
      {
        setup: `${name}'s supply account shows a deposit of ${hl('$' + (v + 10))} and a withdrawal of ${hl('$' + v)}.`,
        q: 'What does a balance of $0 represent?',
        ok: 'Nothing in the account and nothing owed.',
        wrong: [
          ['The account has been closed by the bank.', 'An open account can have a balance of $0. Zero describes the amount, not whether the account exists.'],
          ['The largest withdrawal the bank will allow.', 'Withdrawals are shown as negative changes. Zero is the balance with nothing in it, not a size of withdrawal.'],
          ['The account owes the bank some money now.', 'Owing money would be a negative balance. Zero means neither owing nor having.'],
        ],
        hq: `What does a change of ${hl('−$' + (v + 4))} represent in the account?`,
        hok: `A withdrawal of $${v + 4} from the account.`,
        hwrong: [
          [`A deposit of $${v + 4} put into the account.`, `A deposit adds money, so it is positive: +${v + 4}. The negative sign means money taken out.`],
          [`A balance of exactly $${v + 4} left over.`, 'The value is a change, not what is left. The minus sign means money went out.'],
          [`A withdrawal of $${v + 4} times two dollars.`, 'The number tells the size of the change. Nothing is doubled; the sign shows the direction.'],
        ],
      },
      {
        setup: `On one play the team gains ${hl(v + ' yards')}. On the next it loses ${hl(v - 1 + ' yards')}.`,
        q: 'What does 0 represent for a play?',
        ok: 'The ball ended right where it started.',
        wrong: [
          ['The team lost the ball to the other team.', 'Losing the ball is a different event. Zero describes yards: the ball did not move forward or back.'],
          ['The team moved the ball as far as possible.', 'Moving far forward is a large positive gain. Zero means no movement.'],
          ['The play did not count toward the score.', 'A play with 0 yards still counts. The ball simply did not change position.'],
        ],
        hq: `What does the integer ${hl('−' + (v + 4))} represent for a play?`,
        hok: `A loss of ${v + 4} yards on the play.`,
        hwrong: [
          [`A gain of ${v + 4} yards on the play.`, `A gain moves the ball forward, which is positive: +${v + 4}. The negative sign means a loss.`],
          [`A play that ended ${v + 4} yards from the goal line.`, 'Yards in a play are measured from where the play started, not from the goal line.'],
          [`A play where ${v + 4} players lost their places.`, 'The integer counts yards, not players. The sign shows the direction the ball moved.'],
        ],
      },
    ]);
    const okText = hard ? ctx.hok : ctx.ok;
    const wrongs = hard ? ctx.hwrong : ctx.wrong;
    const opts = [{ html: okText, ok: true }].concat(wrongs.map(([html, why]) => ({ html, why })));
    const sh = shuffleOptions(r, opts, 0);
    return {
      type: 'mc',
      skill: 'integers-context',
      lesson: '7-1',
      title: hard ? 'What does this integer mean?' : 'What does zero mean here?',
      prompt: `<p>${ctx.setup}</p><p>${hard ? ctx.hq : ctx.q}</p>`,
      options: sh.options,
      answer: sh.answer,
      hints: [
        hard ? 'An integer in a real situation tells two things: a direction from 0 (the sign) and a size (the distance from 0).' : 'Positive numbers describe one direction and negative numbers the other. Zero is the point in the middle.',
        hard ? 'First name what 0 stands for here. Then the negative sign means the direction below or less than that point.' : 'Zero is not "nothing" and not the lowest value. It is the reference point that the other values are measured from.',
        hard ? 'Pick the choice with the right size, the right direction, and the right starting point.' : 'Ask: what situation is exactly between the positive case and the negative case?',
      ],
      hintEs: hard
        ? 'Un número entero en una situación real dice dos cosas: una dirección desde el 0 (el signo) y un tamaño (la distancia al 0).'
        : 'Los números positivos indican una dirección y los negativos, la contraria. El cero es el punto del medio.',
      solution: hard
        ? `<p><b>${okText}</b> The sign shows the direction from the starting point (0), and the number shows how far from 0.</p>`
        : `<p><b>${okText}</b> Positive values are measured up from 0, negative values down from 0. Zero is the reference point, not the smallest or largest value.</p>`,
      feedback: { correct: hard ? 'Correct. The sign gives the direction from 0, and the number gives the distance.' : 'Correct. In every real situation, 0 is the reference point between the positive and negative values.', wrong: whyOf(sh.options) },
    };
  });

  // ---------- Write the integer for two (or three) situations (blanks) ----------
  G.define('n1_writeIntegers', (r, o) => {
    const hard = !!o.hard;
    const name = r.pick(NAMES);
    const sits = hard ? r.pickN(SITU_HARD, 3) : r.pickN(SITU, 2);
    const a = r.int(2, 60),
      b = r.int(2, 60);
    const v1 = r.chance(0.6) ? -a : a;
    const v2 = v1 < 0 ? b : -b;
    const vals = hard ? r.shuffle([v1, v2, 0]) : [v1, v2];
    const texts = vals.map((v, i) => situText(sits[i], v));
    return {
      type: 'blanks',
      skill: 'integers-context',
      lesson: '7-1',
      title: hard ? 'Write each event as an integer' : 'Write each reading as an integer',
      prompt: `<p>${name} must enter ${hard ? 'three' : 'two'} log entries as integers before the heaters restart.</p><ol>${texts.map((t) => `<li>${hl(t)}</li>`).join('')}</ol><p class="muted">Type a negative integer with a minus sign, like -1.</p>`,
      fields: vals.map((v, i) => ({ label: 'Entry ' + (i + 1), answer: v, width: 'sm' })),
      layout: 'two-col',
      hints: [
        hard ? 'Decide the sign first. After, above, profit, climb, rise: positive. Before, under, debt, dive, drop: negative. A starting point: 0.' : 'Decide the sign first. Above, gain, deposit: positive. Below, loss, withdrawal: negative.',
        texts.map((t, i) => `Entry ${i + 1} is ${vals[i] < 0 ? 'below the starting point (negative)' : vals[i] > 0 ? 'above the starting point (positive)' : 'the starting point itself'}`).join('. ') + '.',
        'Now write each size from the words with the sign you chose. The starting point needs no sign.',
      ],
      hintEs: hard
        ? 'Primero decide el signo. Después, por encima, ganancia, subida, aumento: positivo. Antes, por debajo, deuda, inmersión, bajada: negativo. Un punto de partida: 0.'
        : 'Primero decide el signo. Por encima, ganancia, depósito: positivo. Por debajo, pérdida, retiro: negativo.',
      solution: `<p>${texts.map((t, i) => `Entry ${i + 1}: "${t}" → <b>${dec(vals[i])}</b>.`).join(' ')} The word that tells direction gives the sign; the number gives the size.</p>`,
      feedback: {
        correct: `Correct. ${vals.map(dec).join(', ')}: the direction word sets the sign.`,
        wrong(ans, d) {
          const i = (d.wrong || [])[0];
          if (i == null) return 'Check each entry: the number tells the size and the direction word tells the sign.';
          const got = parseNum(ans[i]);
          if (vals[i] === 0) return `Entry ${i + 1} is the starting point itself, so its integer is 0.`;
          if (got === 0) return `Entry ${i + 1} has a size, so it is not 0. Use the number in the words with the right sign.`;
          if (got != null && got === -vals[i]) return `Entry ${i + 1} has the right size but the wrong sign. "${texts[i]}" is ${vals[i] < 0 ? 'below the starting point: negative' : 'above the starting point: positive'}.`;
          return `Look again at entry ${i + 1}. The number tells the size; the direction word tells the sign.`;
        },
      },
    };
  });

  // ---------- True or false about a real-situation integer (tf) ----------
  G.define('n1_tfSituation', (r, o) => {
    const hard = !!o.hard;
    const s = hard ? r.pick(SITU_HARD) : r.pick(SITU);
    const n = r.int(3, 50);
    const variant = r.int(0, 2);
    const negText = s.neg(n);
    const posText = s.pos(n);
    let statement, reasons, answer, hints, hintEs, solution;
    if (!hard) {
      const trueCase = variant !== 0;
      statement = `${cap(negText)} is written as the integer ${trueCase ? '−' : ''}${n}.`;
      answer = trueCase;
      reasons = trueCase
        ? [
            { html: `The reading is below the starting point (0), so the integer is negative.`, correct: true },
            { html: `Every real-world amount is written as a negative integer.` },
            { html: `${n} is less than 100, so it must be negative.` },
          ]
        : [
            { html: `"Below" means less than the starting point, so the integer must be negative: −${n}.`, correct: true },
            { html: `The integer should be 0 because the reading is a real amount.` },
            { html: `It is correct as written: amounts in real life are never negative.` },
          ];
      hints = ['Ask whether the reading is above or below the starting point. Below means negative.', `"${negText}" is below the starting point. Its integer must have a negative sign.`, `Compare the integer in the statement with the sign you just decided on.`];
      hintEs = 'Pregúntate si la lectura está por encima o por debajo del punto de partida. Por debajo significa negativo.';
      solution = `<p>"${negText}" is below the starting point, so its integer is <b>−${n}</b>. The statement is <b>${answer ? 'true' : 'false'}</b>${answer ? '.' : `: it leaves off the negative sign. ${cap(posText)} would be ${n}.`}</p>`;
    } else {
      // Level 2: a claim about the OPPOSITE situation and its integer.
      const claims = [
        { claim: `The opposite of ${negText} is ${posText}, written as the integer ${n}.`, truth: true },
        { claim: `The opposite of ${negText} is ${posText}, written as the integer −${n}.`, truth: false, err: 'sign' },
        { claim: `The opposite of ${negText} is ${s.zero}, written as the integer 0.`, truth: false, err: 'zero' },
      ];
      const c = claims[variant];
      statement = c.claim;
      answer = c.truth;
      reasons = c.truth
        ? [
            { html: `The reading is −${n}. Its opposite is the same size in the other direction: ${n}.`, correct: true },
            { html: `The opposite of every situation is the starting point, 0.` },
            { html: `Both situations are ${n} units from 0, so both must be written as −${n}.` },
          ]
        : c.err === 'sign'
          ? [
              { html: `The opposite situation is above the starting point, so its integer is positive, ${n}, not −${n}.`, correct: true },
              { html: `The opposite situation is right, and it keeps the same sign as the original.` },
              { html: `The opposite of every situation is the starting point, 0.` },
            ]
          : [
              { html: `The starting point is 0, which is its own opposite. The opposite of −${n} is ${n}, not 0.`, correct: true },
              { html: `It is true: going back to the start always cancels any reading.` },
              { html: `It should be −${n} because the opposite keeps the sign.` },
            ];
      hints = [
        `First write the original situation as an integer. Then its opposite is the same distance from 0 on the other side.`,
        `"${negText}" is −${n}. Its opposite is the same size, ${n} units, in the other direction.`,
        `Check both parts of the claim: does it name the right situation, and the right integer?`,
      ];
      hintEs = 'Primero escribe la situación original como un número entero. Su opuesto está a la misma distancia del 0, en el otro lado.';
      solution = `<p>"${negText}" is −${n}. Its opposite is "${posText}", which is <b>${n}</b>. The statement is <b>${answer ? 'true' : 'false'}</b>.${answer ? '' : c.err === 'sign' ? ' It names the right situation but gives it the wrong sign.' : ' The starting point (0) is not the opposite of −' + n + '.'}</p>`;
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
      hints,
      hintEs,
      solution,
      feedback: {
        correct: answer ? 'Correct. The direction from the starting point sets the sign.' : 'Correct. The sign must match the direction from the starting point.',
        wrong(ans, d) {
          if (!d.valueOk) return hard ? `Write "${negText}" as an integer first. Its opposite is the same size with the other sign. Does the claim match?` : `Decide whether "${negText}" is above or below the starting point. Below means the integer is negative.`;
          return `Your true/false answer is right. Now pick the reason that explains the sign using the starting point, 0.`;
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
  const { dec, mixedHtml, mixedText, fracParts, improperParts, improperText, improperHtml, typedMixed } = RX.N7;
  const hl = V.hl;
  const hlRaw = (html) => `<mark class="num">${html}</mark>`;

  const CORE = ['ice core', 'sediment core', 'snow sample', 'brine sample'];
  const nlAria = (pts) => 'Number line with points at ' + pts.map(mixedText).join(' and ');
  const whyOf = (opts) => (ans) => (opts[ans] && opts[ans].why) || 'Not that one. Check the sign first, then count the ticks from the whole number closer to 0.';
  const whole = (v) => Math.floor(Math.abs(v) + 1e-9);
  const lowInt = (v) => Math.sign(v) * whole(v); // the whole number on the 0 side
  const highInt = (v) => Math.sign(v) * (whole(v) + 1); // the whole number on the far side
  const listOf = (items) => (items.length === 2 ? items.join(' and ') : items.slice(0, -1).join(', ') + ', and ' + items[items.length - 1]);

  // Draw a non-integer value with the given step inside (-lim, lim), avoiding a set of taken values.
  const drawFrac = (r, step, lim, taken) => {
    for (let k = 0; k < 40; k++) {
      const v = Math.round(r.int(1, Math.round(lim / step) - 1) * step * 1000) / 1000;
      const s = r.chance(0.5) ? -v : v;
      if (Number.isInteger(s) || (taken || []).some((t) => near(t, s) || near(t, -s))) continue;
      return s;
    }
    return step;
  };
  // Make sure a list holds at least one negative and one positive value.
  const mixSigns = (vals) => {
    if (vals.every((v) => v < 0)) vals[vals.length - 1] = -vals[vals.length - 1];
    if (vals.every((v) => v > 0)) vals[0] = -vals[0];
    return vals;
  };

  // ---------- Place decimals (nl). Hard: tenths on a line ticked in fifths, three points. ----------
  G.define('n2_nlDecimal', (r, o) => {
    const hard = !!o.hard;
    const step = hard ? 0.2 : 0.5;
    const pts = [];
    pts.push(drawFrac(r, step, 4, pts));
    pts.push(drawFrac(r, step, 4, pts));
    if (hard) pts.push(drawFrac(r, step, 4, pts));
    mixSigns(pts);
    const name = r.pick(NAMES);
    const core = r.pick(CORE);
    const listed = listOf(pts.map((v) => hl(dec(v) + ' m')));
    const where = (v) => `${dec(v)} is between ${dec(lowInt(v))} and ${dec(highInt(v))}`;
    return {
      type: 'nl',
      skill: 'rational-nl',
      lesson: '7-2',
      title: hard ? 'Place the tenths' : 'Place the decimals',
      prompt: `<p>${name} labels ${hard ? 'three' : 'two'} ${core}s by their position from the shelf line (0 m): ${listed}.</p><p>Place ${hard ? 'all three numbers' : 'both numbers'} on the number line.</p><p class="muted">${hard ? 'The ticks split each unit into equal parts. Count them before you place a point.' : 'Each small tick is 0.5. Click a tick to place a point.'}</p>`,
      min: -4,
      max: 4,
      step,
      labelEvery: 1,
      count: pts.length,
      points: pts,
      hints: [
        hard ? 'Count the spaces between 0 and 1. There are 5 equal spaces, so each tick is 1/5, or 0.2.' : 'Negative numbers are left of 0; positive numbers are right of 0. Each tick is one half, 0.5.',
        where(pts[0]) + (hard ? `. Its decimal part is ${dec(Math.abs(pts[0]) - whole(pts[0]))}, which is ${Math.round((Math.abs(pts[0]) - whole(pts[0])) / 0.2)} ticks of 0.2.` : ', exactly on the half tick.'),
        pts
          .slice(1)
          .map((v) => where(v))
          .join('. ') + '. Count ticks from the whole number closer to 0.',
      ],
      hintEs: hard
        ? 'Cuenta los espacios entre 0 y 1. Hay 5 espacios iguales, así que cada marca vale 1/5, o sea 0.2.'
        : 'Los números negativos van a la izquierda del 0 y los positivos, a la derecha. Cada marca vale un medio, 0.5.',
      solution: `<p>${pts.map((v) => `${where(v)}: <b>${Math.round((Math.abs(v) - whole(v)) / step)} tick${Math.round((Math.abs(v) - whole(v)) / step) === 1 ? '' : 's'}</b> past ${dec(lowInt(v))}, moving ${v < 0 ? 'left' : 'right'}.`).join(' ')} For a negative decimal, move left of 0 and count the same way you would for a positive one.</p>${V.numberLine({
        min: -4,
        max: 4,
        step,
        labelEvery: 1,
        points: pts.map((v, i) => ({ v, label: dec(v), color: ['#C8553D', '#1FA6A2', '#17324D'][i] })),
        aria: nlAria(pts),
      })}`,
      feedback: {
        correct: `Correct. Each point sits exactly on its ${hard ? 'tick of 0.2' : 'half tick'}.`,
        wrong(ans, d) {
          const extra = d.extra || [];
          if (extra.some((x) => pts.some((p) => near(x, -p)))) return 'One point is on the wrong side of 0. Check the sign: negative numbers go to the left of 0.';
          if (hard && extra.some((x) => pts.some((p) => Math.sign(p) === Math.sign(x) && near(Math.abs(x), whole(p) + 2 * (Math.abs(p) - whole(p))))))
            return 'You counted each tick as 0.1. There are only 5 spaces in each unit, so each tick is 0.2. For example, 0.4 is 2 ticks, not 4.';
          if (extra.some((x) => pts.some((p) => Math.sign(p) === Math.sign(x) && near(Math.abs(x), whole(p) + 1 - (Math.abs(p) - whole(p))))))
            return 'One point is counted from the wrong whole number. Start at the whole number closer to 0 and count away from 0.';
          if (extra.some((x) => pts.some((p) => near(Math.abs(x - p), step)))) return `One point is one tick off. Each tick is ${dec(step)}, so count every tick between the whole number and the point.`;
          return `Find the two integers each number is between, then count ticks of ${dec(step)} from the one closer to 0.`;
        },
      },
    };
  });

  // ---------- Place fractions (nl). Hard: three points written three ways, only even numbers labeled. ----------
  G.define('n2_nlFraction', (r, o) => {
    const hard = !!o.hard;
    const lim = hard ? 4 : 3;
    const pts = [];
    pts.push(drawFrac(r, 0.25, lim, pts));
    pts.push(drawFrac(r, 0.25, lim, pts));
    if (hard) {
      let v = drawFrac(r, 0.25, lim, pts);
      for (let k = 0; k < 20 && whole(v) < 1; k++) v = drawFrac(r, 0.25, lim, pts);
      pts.push(v);
    }
    mixSigns(pts);
    // Hard: the last point is shown as an improper fraction, one as a decimal, one as a mixed number.
    const forms = hard ? r.shuffle(['mixed', 'dec']).concat(['improper']) : ['mixed', 'mixed'];
    const show = (v, f) => (f === 'improper' ? improperHtml(v) : f === 'dec' ? dec(v) : mixedHtml(v));
    const name = r.pick(NAMES);
    const listText = listOf(pts.map((v, i) => hlRaw(show(v, forms[i]))));
    const quartersPast = (v) => Math.round((Math.abs(v) - whole(v)) * 4);
    const whereText = (v) => {
      const q = quartersPast(v);
      return `${mixedText(v)} is between ${dec(lowInt(v))} and ${dec(highInt(v))}: ${q} quarter tick${q === 1 ? '' : 's'} past ${dec(lowInt(v))}, moving ${v < 0 ? 'left' : 'right'}`;
    };
    const imp = improperParts(pts[2] || pts[0]);
    return {
      type: 'nl',
      skill: 'rational-nl',
      lesson: '7-2',
      title: hard ? 'Place three rational numbers' : 'Place the fractions',
      prompt: `<p>${name} marks ${hard ? 'three' : 'two'} ${r.pick(CORE)}s on the depth line. Their positions are ${listText}.</p><p>Place ${hard ? 'all three' : 'both'} numbers on the number line.</p><p class="muted">${hard ? 'Each small tick is one fourth. Only the even whole numbers are labeled.' : 'Each small tick is one fourth (0.25).'}</p>`,
      min: -lim,
      max: lim,
      step: 0.25,
      labelEvery: hard ? 2 : 1,
      count: pts.length,
      points: pts,
      hints: hard
        ? [
            'Write every number as a mixed number first. Then find the whole numbers it is between.',
            `${improperText(pts[2])} means ${imp.n} ÷ ${imp.d}. ${imp.n} ÷ ${imp.d} is ${whole(pts[2])} with ${imp.n - whole(pts[2]) * imp.d} left over, so it is ${mixedText(pts[2])}.`,
            pts.map((v) => whereText(v)).join('. ') + '.',
          ]
        : ['Each space between whole numbers is split into 4 equal parts. One tick is 1/4, two ticks are 1/2, three ticks are 3/4.', whereText(pts[0]) + '.', whereText(pts[1]) + '.'],
      hintEs: hard
        ? 'Primero escribe cada número como número mixto. Luego busca entre qué números enteros está.'
        : 'Cada espacio entre números enteros está dividido en 4 partes iguales. Una marca es 1/4, dos marcas son 1/2 y tres marcas son 3/4.',
      solution: `<p>${hard ? `First, ${improperText(pts[2])} = ${mixedText(pts[2])}. ` : ''}${pts.map((v) => `<b>${mixedHtml(v)}</b>: ${whereText(v)}.`).join(' ')} A negative fraction is placed the same distance from 0 as its positive twin, but to the left.</p>${V.numberLine({ min: -lim, max: lim, step: 0.25, labelEvery: 1, points: pts.map((v, i) => ({ v, label: mixedText(v), color: ['#C8553D', '#1FA6A2', '#17324D'][i] })), aria: nlAria(pts) })}`,
      feedback: {
        correct: 'Correct. Every quarter tick is 0.25, so you can count the parts between whole numbers.',
        wrong(ans, d) {
          const extra = d.extra || [];
          if (extra.some((x) => pts.some((p) => near(x, -p)))) return 'One point is on the wrong side of 0. A negative number sits to the left of 0.';
          if (hard && extra.some((x) => pts.some((p) => near(Math.abs(x - p), 1)))) return 'One point is exactly one whole unit off. Only even numbers are labeled, so find the odd whole numbers between the labels before you count quarter ticks.';
          if (hard && !extra.some((x) => near(Math.abs(x), Math.abs(pts[2]))) && (d.missing || []).some((m) => near(m, pts[2])))
            return `Check ${improperText(pts[2])}. Divide ${imp.n} by ${imp.d} to get a mixed number before you place it.`;
          if (extra.some((x) => pts.some((p) => Math.sign(p) === Math.sign(x) && whole(x) === whole(p))))
            return 'One point is between the right whole numbers but on the wrong quarter tick. Count the ticks from the whole number closer to 0.';
          return 'Find the two whole numbers each number is between, then count quarter ticks from the one closer to 0.';
        },
      },
    };
  });

  // ---------- Which two integers is this number between? (cloze). Hard: an improper fraction. ----------
  G.define('n2_betweenIntegers', (r, o) => {
    const hard = !!o.hard;
    let v, shownText, mag, w, hint2, mixedShown = '';
    if (hard) {
      const d = r.pick([3, 4, 5, 6, 8]);
      w = r.int(1, 8);
      const rem = r.int(1, d - 1);
      const n = w * d + rem;
      const neg = r.chance(0.7);
      v = (neg ? -1 : 1) * (n / d);
      mag = n / d;
      shownText = (neg ? '−' : '') + n + '/' + d;
      hint2 = `${n} ÷ ${d} is ${w} with ${rem} left over, so ${n}/${d} is ${w} ${rem}/${d}. The number is between ${w} and ${w + 1} units from 0.`;
      mixedShown = (neg ? '−' : '') + w + ' ' + rem + '/' + d;
    } else {
      w = r.int(0, 5);
      const tenths = r.pick([0.1, 0.2, 0.3, 0.4, 0.6, 0.7, 0.8, 0.9]);
      mag = Math.round((w + tenths) * 10) / 10;
      v = r.chance(0.65) ? -mag : mag;
      shownText = dec(v);
      hint2 = `${shownText} is ${dec(mag)} units from 0. That is between ${w} and ${w + 1} units from 0.`;
    }
    const lo = Math.floor(v),
      hi = Math.ceil(v);
    const choices = [];
    for (let k = lo - 2; k <= hi + 2; k++) choices.push(dec(k));
    const name = r.pick(NAMES);
    const ctx = r.pick(['temperature', 'depth reading', 'tilt reading', 'pressure change']);
    return {
      type: 'cloze',
      skill: 'rational-nl',
      lesson: '7-2',
      title: hard ? 'Between which integers? (fractions)' : 'Between which integers?',
      prompt: `<p>${name}'s ${ctx} is ${hl(shownText)}. The display only shows integers, so ${name} needs the two integers the reading lies between.</p><p>Complete the sentence. The integer on the left of the number line comes first.</p>`,
      template: `${shownText} is between {0} and {1} on the number line.`,
      choices: [choices, choices],
      answers: [choices.indexOf(dec(lo)), choices.indexOf(dec(hi))],
      hints: [
        hard ? 'Change the improper fraction to a mixed number by dividing. The whole-number part tells you where to look.' : v < 0 ? `${shownText} is negative, so both integers are on the left side of 0 (or one of them is 0).` : `${shownText} is positive, so look at the integers to the right of 0.`,
        hint2,
        v < 0 ? `${w} and ${w + 1} units to the left of 0 are ${dec(-w)} and ${dec(-(w + 1))}. Which of them is farther left?` : `The integers are ${w} and ${w + 1} units right of 0. Put the smaller one first.`,
      ],
      hintEs: hard
        ? 'Cambia la fracción impropia a número mixto dividiendo. La parte entera te dice dónde buscar.'
        : v < 0
          ? `${shownText} es negativo, así que los dos números enteros están a la izquierda del 0 (o uno de ellos es el 0).`
          : `${shownText} es positivo, así que busca los números enteros a la derecha del 0.`,
      solution: `<p>${hard ? `${shownText} = ${mixedShown}. ` : ''}${shownText} is ${hard ? 'between ' + w + ' and ' + (w + 1) : dec(mag)} units ${v < 0 ? 'left' : 'right'} of 0, so it falls between <b>${dec(lo)}</b> (on the left) and <b>${dec(hi)}</b> (on the right).${v < 0 ? ` With negatives, the integer with the larger size, ${dec(lo)}, is farther left.` : ''}</p>${hard ? '' : V.numberLine({ min: lo - 1, max: hi + 1, step: 0.1, labelEvery: 1, points: [{ v, label: dec(v) }], aria: `Number line showing ${dec(v)} between ${dec(lo)} and ${dec(hi)}` })}`,
      feedback: {
        correct: `Correct. ${shownText} lies between ${dec(lo)} and ${dec(hi)}.`,
        wrong(ans, d) {
          const pick = (i) => (ans[i] >= 0 ? Number(choices[ans[i]].replace('−', '-')) : null);
          const a0 = pick(0),
            a1 = pick(1);
          if (a0 === hi && a1 === lo) return `You have the right two integers, but in the wrong order. On the number line ${dec(lo)} is to the left of ${dec(hi)}.`;
          if (v < 0 && a0 != null && a1 != null && (a0 >= 0 || a1 > 0) && hi !== 0) return `Those integers are on the positive side. ${shownText} is negative, so the integers around it are negative too.`;
          if (a0 != null && a1 != null && Math.abs(a1 - a0) === 1 && (a0 === lo - 1 || a0 === hi)) return hard ? `Your integers are one step off. ${shownText} is ${mixedShown}, so it is between ${w} and ${w + 1} units from 0.` : `Your integers are one step off. ${shownText} is between ${w} and ${w + 1} units from 0.`;
          if (a0 != null && a1 != null && Math.abs(a1 - a0) !== 1) return 'The two integers must be next to each other on the number line, one on each side of the number.';
          return hard ? 'Divide the numerator by the denominator to find the whole-number part, then apply the sign.' : `${shownText} is ${dec(mag)} units from 0. Which two whole-number distances is that between? Then apply the sign.`;
        },
      },
    };
  });

  // ---------- Read a point on a number line (mc). Hard: ticks in fifths, unlabeled spacing. ----------
  G.define('n2_readPoint', (r, o) => {
    const hard = !!o.hard;
    const step = hard ? 0.2 : 0.25;
    const w = r.int(0, 2);
    const k = hard ? r.int(1, 4) : r.pick([1, 3]);
    const f = Math.round(k * step * 100) / 100;
    const mag = w + f;
    const v = r.chance(0.6) ? -mag : mag;
    const sgn = Math.sign(v);
    const mirror = sgn * (w + 1 - f); // counted from the wrong whole number
    const dropped = -v; // wrong side of 0
    const opts = [
      { html: dec(v), ok: true },
      { html: dec(mirror), why: `${dec(mirror)} is counted from the wrong whole number. Start at the whole number closer to 0 and count ticks away from 0.` },
      { html: dec(dropped), why: `${dec(dropped)} is the same distance from 0 but on the other side. Check which side of 0 the point is on.` },
    ];
    if (hard) {
      const tenths = sgn * (w + Math.round(k * 0.1 * 10) / 10);
      opts.push({ html: dec(tenths), why: `${dec(tenths)} treats each tick as 0.1. Count the spaces between two whole numbers: there are 5, so each tick is 0.2.` });
    } else {
      const offTick = sgn * (mag - 0.25);
      opts.push({ html: dec(offTick), why: `${dec(offTick)} is one tick too close to 0. Each tick is 0.25, so count every tick between the whole number and the point.` });
    }
    const sh = shuffleOptions(r, opts, 0);
    return {
      type: 'mc',
      skill: 'rational-nl',
      lesson: '7-2',
      title: hard ? 'Read the point (fifths)' : 'Read the point',
      prompt: `<p>A ${r.pick(CORE)} is marked on the depth line below. ${hard ? 'The ticks split each unit into equal parts.' : 'Each small tick is 0.25.'}</p>${V.numberLine({ min: -3, max: 3, step, labelEvery: 1, points: [{ v, label: '?' }], aria: `Number line from negative 3 to 3 with an unlabeled point between ${dec(sgn * w)} and ${dec(sgn * (w + 1))}` })}<p>Which number does the point show?</p>`,
      options: sh.options,
      answer: sh.answer,
      hints: [
        hard ? 'First count the spaces between two labeled whole numbers. That tells you how much each tick is worth.' : 'First decide the sign: is the point left of 0 (negative) or right of 0 (positive)?',
        `The point is ${v < 0 ? 'left' : 'right'} of 0, between ${dec(sgn * w)} and ${dec(sgn * (w + 1))}. Count the ticks starting from ${dec(sgn * w)}, the whole number closer to 0.${hard ? ' Each tick is 0.2.' : ''}`,
        `It is ${k} tick${k === 1 ? '' : 's'} past ${dec(sgn * w)}, moving ${v < 0 ? 'left' : 'right'}. Multiply ${k} by ${dec(step)} and add it to ${w}, then apply the sign.`,
      ],
      hintEs: hard
        ? 'Primero cuenta los espacios entre dos números enteros con nombre. Así sabes cuánto vale cada marca.'
        : 'Primero decide el signo: ¿el punto está a la izquierda del 0 (negativo) o a la derecha (positivo)?',
      solution: `<p>The point is ${v < 0 ? 'left' : 'right'} of 0, between ${dec(sgn * w)} and ${dec(sgn * (w + 1))}. ${hard ? 'There are 5 spaces in each unit, so each tick is 0.2. ' : ''}It is ${k} tick${k === 1 ? '' : 's'} beyond ${dec(sgn * w)}, so it is ${dec(mag)} units from 0: <b>${dec(v)}</b> (${mixedHtml(v)}).</p>`,
      feedback: { correct: `Correct. The point is ${dec(mag)} units ${v < 0 ? 'left' : 'right'} of 0, so it shows ${dec(v)}.`, wrong: whyOf(sh.options) },
    };
  });

  // ---------- Opposite of a rational number (num). Hard: the opposite of an improper fraction written as an expression. ----------
  G.define('n2_oppositeRational', (r, o) => {
    const hard = !!o.hard;
    const useFrac = hard || r.chance(0.5);
    let v = useFrac ? drawFrac(r, 0.25, 4, []) : drawFrac(r, 0.5, 6, []);
    if (hard) for (let k = 0; k < 20 && whole(v) < 1; k++) v = drawFrac(r, 0.25, 4, []);
    const name = r.pick(NAMES);
    const shown = hard ? improperHtml(v) : useFrac ? mixedHtml(v) : dec(v);
    const shownText = hard ? improperText(v) : mixedText(v);
    const p = fracParts(v);
    const recip = p && p.n ? Math.sign(v) * (improperParts(v).d / improperParts(v).n) : null;
    const typo = typedMixed(-v);
    const answer = -v;
    return {
      type: 'num',
      skill: 'rational-opposites',
      lesson: '7-2',
      title: hard ? 'The opposite of an improper fraction' : 'Opposite of a rational number',
      prompt: hard
        ? `<p>${name}'s sample sits at ${hlRaw(shown)} on the depth line. The control panel asks for ${hlRaw('−(' + shown + ')')}.</p><p>What number is ${hlRaw('−(' + shown + ')')}?</p><p class="muted">Type a decimal or an improper fraction like -7/4.</p>`
        : `<p>${name}'s sample sits at ${hlRaw(shown)} on the depth line. A second sample sits at the <b>opposite</b> number.</p><p>What is the opposite of ${hlRaw(shown)}?</p><p class="muted">Type a decimal or a fraction like -3/4.</p>`,
      answer,
      hints: [
        hard ? 'The minus sign in front of the parentheses means "the opposite of." The opposite has the same distance from 0 and the other sign.' : 'The opposite of a number is the same distance from 0, on the other side. Only the sign changes.',
        hard ? `${shownText} is ${mixedText(v)}, which is ${mixedText(Math.abs(v))} units ${v < 0 ? 'left' : 'right'} of 0.` : `${shownText} is ${mixedText(Math.abs(v))} units ${v < 0 ? 'left' : 'right'} of 0.`,
        `Go the same distance the other way from 0 and give the number the ${v < 0 ? 'positive' : 'negative'} sign.`,
      ],
      hintEs: hard
        ? 'El signo menos delante del paréntesis significa "el opuesto de". El opuesto está a la misma distancia del 0 y tiene el otro signo.'
        : 'El opuesto de un número está a la misma distancia del 0, en el otro lado. Solo cambia el signo.',
      solution: `<p>${hard ? `${shownText} = ${mixedText(v)}. ` : ''}${mixedHtml(v)} is ${mixedHtml(Math.abs(v))} units from 0. Its opposite is the same distance on the other side: <b>${mixedHtml(answer)}</b>${useFrac ? ` (${hard ? improperText(answer) + ' or ' : ''}${dec(answer)} as a decimal)` : ''}. Taking the opposite changes the sign and nothing else.</p>${V.numberLine({
        min: -4,
        max: 4,
        step: useFrac ? 0.25 : 0.5,
        labelEvery: 1,
        points: [
          { v, label: mixedText(v) },
          { v: answer, label: mixedText(answer), color: '#1FA6A2' },
        ],
        aria: nlAria([v, answer]),
      })}`,
      feedback: {
        correct: `Correct. ${mixedText(v)} and ${mixedText(answer)} are the same distance from 0 on opposite sides.`,
        wrong(ans, d) {
          const x = d.value;
          if (x == null) return 'Type one number: a decimal like -2.75 or a fraction like -11/4.';
          if (near(x, v, 0.001)) return 'That is the number itself. The opposite has the other sign.';
          if (recip != null && (near(x, recip, 0.001) || near(x, -recip, 0.001))) return `You flipped the fraction. That is the reciprocal, not the opposite. The opposite keeps the same digits and changes only the sign.`;
          if (typo != null && near(x, typo, 0.001)) return 'It looks like you typed a mixed number with a space, which the panel reads as a different number. Type a decimal or an improper fraction instead.';
          if (near(x, 0, 0.001)) return 'Only 0 is its own opposite. This number is not 0, so its opposite is on the other side of 0.';
          if (near(Math.abs(x), Math.abs(v), 0.001)) return 'Right distance from 0, wrong sign. The opposite must be on the other side of 0 from the original number.';
          return `Keep the distance from 0 the same (${mixedText(Math.abs(v))}) and switch the sign.`;
        },
      },
    };
  });

  // ---------- Which number line shows the number and its opposite? (rep). Hard: quarter ticks, points unlabeled. ----------
  G.define('n2_repOpposites', (r, o) => {
    const hard = !!o.hard;
    const w = r.int(1, 2);
    const f = hard ? r.pick([0.25, 0.75]) : 0.5;
    const mag = w + f;
    const v = r.chance(0.5) ? -mag : mag;
    const sgn = Math.sign(-v);
    const step = hard ? 0.25 : 0.5;
    const mk = (pts, aria) => V.numberLine({ min: -3, max: 3, step, labelEvery: 1, width: 300, points: pts.map((p, i) => ({ v: p, label: hard ? (i ? 'Q' : 'P') : dec(p), color: i ? '#1FA6A2' : '#C8553D' })), aria });
    const opts = hard
      ? [
          { html: mk([v, -v], `P at ${dec(v)} and Q at ${dec(-v)}`), ok: true },
          { html: mk([v, sgn * (w + 1 - f)], `P at ${dec(v)} and Q at ${dec(sgn * (w + 1 - f))}`), why: `Q is at ${dec(sgn * (w + 1 - f))}: the quarter ticks were counted from ${dec(sgn * (w + 1))} instead of from ${dec(sgn * w)}, the whole number closer to 0.` },
          { html: mk([v, sgn * (mag - 0.25)], `P at ${dec(v)} and Q at ${dec(sgn * (mag - 0.25))}`), why: `Q is at ${dec(sgn * (mag - 0.25))}, one quarter tick closer to 0 than P. Opposites are exactly the same distance from 0.` },
        ]
      : [
          { html: mk([v, -v], `Points at ${dec(v)} and ${dec(-v)}`), ok: true },
          { html: mk([v, sgn * w], `Points at ${dec(v)} and ${dec(sgn * w)}`), why: `The second point is ${dec(sgn * w)}, which is only ${w} units from 0. The opposite must be the same distance from 0 as ${dec(v)}: ${mag} units.` },
          { html: mk([v, sgn * (w + 1)], `Points at ${dec(v)} and ${dec(sgn * (w + 1))}`), why: `The second point is ${dec(sgn * (w + 1))}, one half too far from 0. Opposites are exactly the same distance from 0.` },
        ];
    const sh = shuffleOptions(r, opts, 0);
    return {
      type: 'rep',
      skill: 'rational-opposites',
      lesson: '7-2',
      title: 'Which line shows the opposites?',
      prompt: hard
        ? `<p>On each line, point P is ${hlRaw(mixedHtml(v))}. Which line also shows point Q at <b>the opposite</b> of P?</p><p class="muted">Each tick is one fourth. The points are not labeled with numbers.</p>`
        : `<p>Which number line shows ${hl(dec(v))} <b>and its opposite</b>?</p><p class="muted">Each tick is 0.5.</p>`,
      options: sh.options,
      answer: sh.answer,
      layout: 'cards',
      hints: [
        'Opposites are mirror images across 0: same distance, other side.',
        `${mixedText(v)} is ${mixedText(mag)} units from 0${hard ? `, which is ${w * 4 + f * 4} quarter ticks` : ''}. Look for a second point the same distance on the other side.`,
        hard ? `On each line, count the quarter ticks from 0 to Q. Pick the line where the count matches P's count of ${w * 4 + f * 4}.` : `Only one line has a second point exactly ${mag} units on the other side of 0.`,
      ],
      hintEs: 'Los opuestos son como reflejos en un espejo en el 0: la misma distancia, pero en el otro lado.',
      solution: `<p>${mixedHtml(v)} is ${mixedHtml(mag)} units ${v < 0 ? 'left' : 'right'} of 0. Its opposite, <b>${mixedHtml(-v)}</b>, is ${mixedHtml(mag)} units ${v < 0 ? 'right' : 'left'} of 0. The other lines show a second point that is too close to or too far from 0.</p>`,
      feedback: { correct: `Correct. ${mixedText(v)} and ${mixedText(-v)} are both ${mixedText(mag)} units from 0.`, wrong: whyOf(sh.options) },
    };
  });

  // ---------- Table of readings and their opposites (table). Hard: mixed forms, four rows, one row worked backward. ----------
  G.define('n2_tableOpposites', (r, o) => {
    const hard = !!o.hard;
    const vals = [];
    vals.push(drawFrac(r, 0.5, 5, vals));
    vals.push(drawFrac(r, 0.25, 4, vals));
    vals.push(drawFrac(r, 0.5, 5, vals));
    if (hard) vals.push(drawFrac(r, 0.25, 4, vals));
    mixSigns(vals);
    const labels = ['A', 'B', 'C', 'D'];
    // Hard: fraction-valued rows are shown as mixed numbers or improper fractions; one row gives the opposite and asks for the reading.
    const back = hard ? r.int(0, vals.length - 1) : -1;
    const showCell = (v, i) => (hard && fracParts(v).d === 4 ? (i % 2 ? improperHtml(v) : mixedHtml(v)) : dec(v));
    const rows = [['Sample', 'Reading', 'Opposite']].concat(vals.map((v, i) => (i === back ? [labels[i], `__IN:o${i}__`, showCell(-v, i)] : [labels[i], showCell(v, i), `__IN:o${i}__`])));
    const answers = vals.map((v, i) => (i === back ? v : -v));
    return {
      type: 'table',
      skill: 'rational-opposites',
      lesson: '7-2',
      title: hard ? 'Complete the opposites table (mixed forms)' : 'Complete the opposites table',
      prompt: hard
        ? `<p>Each ${r.pick(CORE)} has a twin sample at the opposite position on the depth line. Complete the table. One row gives the <b>opposite</b> and is missing the reading.</p><p class="muted">Type decimals or fractions like -11/4. Use a minus sign for negatives.</p>`
        : `<p>Each ${r.pick(CORE)} has a twin sample at the opposite position on the depth line. Complete the table.</p><p class="muted">Type decimals. Use a minus sign for negatives, like -1.5.</p>`,
      rows,
      inputs: answers.map((a, i) => ({ id: 'o' + i, answer: a })),
      hints: [
        'The opposite of a number keeps the same digits and switches the sign.',
        hard ? `Row ${labels[back]} works backward: the reading is the opposite of its opposite, so switch the sign of the number in the Opposite column.` : `Sample A: ${dec(vals[0])} is ${dec(Math.abs(vals[0]))} units from 0, so its opposite is ${dec(Math.abs(vals[0]))} units from 0 on the other side.`,
        'A positive reading has a negative opposite, and a negative reading has a positive opposite. Fill in each row by switching the sign.',
      ],
      hintEs: 'El opuesto de un número tiene los mismos dígitos y el signo contrario.',
      solution: `<ul>${vals.map((v, i) => `<li>Sample ${labels[i]}: reading ${mixedHtml(v)} → opposite ${mixedHtml(-v)} &nbsp;(<b>${i === back ? dec(v) : dec(-v)}</b> goes in the table)</li>`).join('')}</ul><p>Each pair is the same distance from 0 on opposite sides.${hard ? ' Working backward is the same move: the opposite of the opposite is the original reading.' : ''}</p>`,
      feedback: {
        correct: 'Correct. Opposites keep the distance from 0 and switch the sign.',
        wrong(ans, d) {
          const id = (d.wrong || [])[0];
          if (id == null) return 'Check each row: keep the distance from 0 and switch the sign.';
          const i = Number(String(id).slice(1));
          const got = parseNum(ans[id]);
          const given = i === back ? -vals[i] : vals[i];
          if (got != null && near(got, given, 0.001)) return `Sample ${labels[i]}: you copied the number that is already in the row. Switch its sign.`;
          if (got != null && typedMixed(answers[i]) != null && near(got, typedMixed(answers[i]), 0.001)) return `Sample ${labels[i]}: a mixed number typed with a space is read as a different number. Type a decimal or an improper fraction instead.`;
          if (got != null && fracParts(answers[i]) && improperParts(answers[i]) && near(Math.abs(got), improperParts(answers[i]).d / improperParts(answers[i]).n, 0.001)) return `Sample ${labels[i]}: you flipped the fraction. The opposite keeps the fraction and changes only the sign.`;
          return `Check Sample ${labels[i]}: the missing number has the same distance from 0 (${mixedText(Math.abs(vals[i]))}) with the other sign.`;
        },
      },
    };
  });

  // ---------- Error: confusing the opposite with the reciprocal (error). Hard: a mixed number flipped as an improper fraction. ----------
  G.define('n2_errorReciprocal', (r, o) => {
    const hard = !!o.hard;
    const [n0, d] = r.pick([
      [3, 4],
      [1, 2],
      [2, 5],
      [1, 4],
      [3, 5],
      [5, 8],
      [1, 5],
    ]);
    const w = hard ? r.int(1, 3) : 0;
    const n = w * d + n0; // improper numerator
    const negative = hard ? r.chance(0.7) : r.chance(0.4);
    const v = (negative ? -1 : 1) * (n / d);
    const name = r.pick(NAMES);
    const sgnTxt = negative ? '−' : '';
    const shown = hard ? sgnTxt + w + V.frac(n0, d) : sgnTxt + V.frac(n, d);
    const flipped = hard ? (negative ? '' : '−') + V.frac(d, n) : sgnTxt + V.frac(d, n);
    const correctHtml = hard ? (negative ? '' : '−') + w + V.frac(n0, d) : (negative ? '' : '−') + V.frac(n, d);
    // Plain-text forms for hints and feedback (V.frac is HTML and cannot be stripped to text).
    const shownTxt = hard ? sgnTxt + w + ' ' + n0 + '/' + d : sgnTxt + n + '/' + d;
    const flippedTxt = (hard ? (negative ? '' : '−') : sgnTxt) + d + '/' + n;
    const correctTxt = hard ? (negative ? '' : '−') + w + ' ' + n0 + '/' + d : (negative ? '' : '−') + n + '/' + d;
    const opts = hard
      ? [
          { html: `Changing the sign was right, but flipping ${n}/${d} made a reciprocal, not an opposite.`, ok: true },
          { html: `${name} should have flipped the fraction but kept the original sign of the number.`, why: 'Flipping is never part of finding an opposite. The sign is the only thing that changes.' },
          { html: `${name} is correct. An opposite means flip the fraction and change the sign.`, why: `Flipping changes the distance from 0. ${shownTxt} is more than ${w} units from 0, but ${flippedTxt} is less than 1 unit from 0, so they cannot be opposites.` },
          { html: `${name} should have changed the sign of the whole number ${w} only, not the fraction.`, why: `A mixed number is one number. Its sign belongs to the whole thing, so the opposite of ${shownTxt} is ${correctTxt}.` },
        ]
      : [
          { html: `${name} flipped the fraction, which gives the reciprocal. An opposite only changes the sign.`, ok: true },
          { html: `${name} should have flipped the fraction and also changed its sign to the other side.`, why: 'Flipping is never part of finding an opposite. Only the sign changes.' },
          { html: `${name} is correct, because the opposite of a fraction is always its reciprocal.`, why: `The reciprocal is a different idea. ${shownTxt} and ${flippedTxt} are different distances from 0, so they cannot be opposites.` },
          { html: `${name} should have added 1 to the fraction so that it crosses over to the other side of 0.`, why: 'Adding 1 moves the number, but an opposite is a reflection across 0. It never changes the distance from 0.' },
        ];
    const sh = shuffleOptions(r, opts, 0);
    const fixHint = improperText(-v).replace('−', '-');
    return {
      type: 'error',
      skill: 'rational-opposites',
      lesson: '7-2',
      title: 'Find the mistake',
      prompt: hard
        ? `<p>${name} says: "The opposite of ${hlRaw(shown)} is ${hlRaw(flipped)}. I wrote it as ${sgnTxt}${V.frac(n, d)}, flipped it, and changed the sign."</p><p>What is the mistake?</p>`
        : `<p>${name} says: "The opposite of ${hlRaw(shown)} is ${hlRaw(flipped)}, because you flip the fraction."</p><p>What is the mistake?</p>`,
      work: hard ? `opposite of ${shown} &nbsp;=&nbsp; opposite of ${sgnTxt}${V.frac(n, d)} &nbsp;=&nbsp; ${flipped}` : `opposite of ${shown} &nbsp;=&nbsp; ${flipped}`,
      options: sh.options,
      answer: sh.answer,
      fix: { label: `The opposite of ${shownTxt} is`, answer: -v },
      hints: [
        'An opposite is the same distance from 0 on the other side. Ask: did the distance from 0 stay the same?',
        `${shownTxt} is ${hard ? 'more than ' + w + ' units' : n + '/' + d + ' of a unit'} from 0. ${flippedTxt} is ${hard ? 'less than 1 unit' : 'a different distance'} from 0.`,
        `Keep the same distance from 0 and switch the sign. Type the fix as an improper fraction (like ${fixHint.startsWith('-') ? '-7/4' : '7/4'}) or as a decimal.`,
      ],
      hintEs: 'Un opuesto está a la misma distancia del 0, en el otro lado. Pregúntate: ¿la distancia al 0 sigue siendo la misma?',
      solution: `<p>Flipping a fraction gives its reciprocal, not its opposite. The opposite of ${shown} is the same distance from 0 with the other sign: <b>${correctHtml}</b> (${improperText(-v)}, or ${dec(-v)}).</p>`,
      feedback: {
        correct: `Correct. Opposites change the sign only. ${mixedText(v)} and ${mixedText(-v)} are the same distance from 0.`,
        wrong(ans, d2) {
          if (!d2.mistakeOk) return (sh.options[ans.mistake] && sh.options[ans.mistake].why) || 'Think about what an opposite changes: the sign, or the fraction itself?';
          const got = parseNum(ans.fix);
          if (got != null && near(got, v, 0.001)) return 'You found the mistake. For the fix, remember the opposite has the other sign.';
          if (got != null && near(Math.abs(got), d / n, 0.001)) return 'You found the mistake, but the fix is still flipped. Keep the fraction as it is and change the sign.';
          if (got != null && typedMixed(-v) != null && near(got, typedMixed(-v), 0.001)) return 'You found the mistake. Type the fix as an improper fraction or a decimal; a mixed number with a space is read as a different number.';
          return `You found the mistake. The fix is the same distance from 0 as ${shownTxt}, with a ${negative ? 'positive' : 'negative'} sign.`;
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
  const { G, V, shuffleOptions, NAMES, near } = RX;
  const { dec, mixedText, mixedHtml, improperText, typedMixed } = RX.N7;
  const hl = V.hl;
  const hlRaw = (html) => `<mark class="num">${html}</mark>`;
  const r2 = (x) => Math.round(x * 100) / 100;
  const whyOf = (opts) => (ans) => (opts[ans] && opts[ans].why) || 'Not that one. Absolute value is the distance from 0, and a distance is never negative.';

  // Real-situation pools for negative readings. Each gives a sentence for a reading of -n and the distance question.
  const ABS_CTX = [
    { read: (n) => `The depth sounder reads ${hl(dec(-n) + ' m')} for the sea floor.`, q: 'How far below the surface is the sea floor?', unit: 'm', ref: 'the surface, 0 m', two: (a, b) => `The depth sounder reads ${hl(dec(-a) + ' m')} for the sea floor at site A and ${hl(dec(-b) + ' m')} at site B.`, hq: 'How much deeper is the sea floor at site A than at site B?', deeper: 'deeper' },
    { read: (n) => `The outdoor thermometer reads ${hl(dec(-n) + '°C')}.`, q: 'How many degrees below 0 is the temperature?', unit: '°C', ref: '0°C', two: (a, b) => `The outdoor thermometer reads ${hl(dec(-a) + '°C')} at midnight and ${hl(dec(-b) + '°C')} at dawn.`, hq: 'How many degrees colder was it at midnight than at dawn?', deeper: 'colder' },
    { read: (n) => `A survey marker on the ice shelf is at an elevation of ${hl(dec(-n) + ' m')}.`, q: 'How far below sea level is the marker?', unit: 'm', ref: 'sea level, 0 m', two: (a, b) => `Survey marker A is at an elevation of ${hl(dec(-a) + ' m')} and marker B is at ${hl(dec(-b) + ' m')}.`, hq: 'How much lower is marker A than marker B?', deeper: 'lower' },
    { read: (n) => `The station supply account shows a balance of ${hl(dec(-n) + ' dollars')}.`, q: 'How many dollars does the station owe?', unit: 'dollars', ref: 'a balance of 0 dollars', two: (a, b) => `The station supply account showed a balance of ${hl(dec(-a) + ' dollars')} in March and ${hl(dec(-b) + ' dollars')} in April.`, hq: 'How many more dollars did the station owe in March than in April?', deeper: 'more in debt' },
    { read: (n) => `A drill bit is ${hl(dec(-n) + ' m')} from the top of the ice.`, q: 'How many meters down is the drill bit?', unit: 'm', ref: 'the top of the ice, 0 m', two: (a, b) => `Drill bit A is at ${hl(dec(-a) + ' m')} and drill bit B is at ${hl(dec(-b) + ' m')}, measured from the top of the ice.`, hq: 'How much deeper is drill bit A than drill bit B?', deeper: 'deeper' },
  ];
  // Draw a value with magnitude in [lo, hi]; sometimes a half.
  const drawMag = (r, lo, hi, allowHalf) => (allowHalf && r.chance(0.35) ? r.int(lo, hi - 1) + 0.5 : r.int(lo, hi));
  // Level 2: a magnitude with a quarter, half, or three-quarter part.
  const drawQuarter = (r, lo, hi) => r.int(lo, hi) + r.pick([0.25, 0.5, 0.75]);
  const absLine = (pts, min, max, step, aria) =>
    V.numberLine({
      min,
      max,
      step,
      labelEvery: step < 1 ? 1 : max - min > 20 ? 5 : max - min > 12 ? 2 : 1,
      points: pts.map((p, i) => ({ v: p, label: mixedText(p), color: i ? '#1FA6A2' : '#C8553D' })),
      segments: pts.map((p, i) => ({ from: Math.min(0, p), to: Math.max(0, p), color: i ? '#1FA6A2' : '#C8553D' })),
      aria,
    });

  // ---------- Absolute value (num). Forms avoid printing the answer: read it off a gauge, the opposite of an absolute value, or work backward. ----------
  G.define('n3_absValue', (r, o) => {
    const hard = !!o.hard;
    const name = r.pick(NAMES);
    const form = r.pick(hard ? ['negAbs', 'picture', 'backward'] : ['negAbs', 'picture', 'backward']);
    const mag = hard ? (form === 'picture' ? r.int(1, 3) + r.pick([0.25, 0.75]) : drawQuarter(r, 1, 9)) : form === 'picture' ? r.pick([3, 5, 7, 9, 11, 13]) : drawMag(r, 2, 18, true);
    const show = (v) => (hard ? mixedHtml(v) : dec(v));
    const showT = (v) => (hard ? mixedText(v) : dec(v));
    let prompt, answer, title, h2, h3, sol;
    if (form === 'negAbs') {
      const inner = r.chance(0.6) ? -mag : mag;
      const expr = `−|${show(inner)}|`;
      answer = -mag;
      title = 'The opposite of an absolute value';
      prompt = `<p>The station computer stores every depth as ${hlRaw(expr)}: the <b>opposite</b> of the absolute value of the reading.</p><p>What number is ${hlRaw(expr)}?</p>`;
      h2 = `Work inside the bars first. |${showT(inner)}| is the distance from ${showT(inner)} to 0.`;
      h3 = `|${showT(inner)}| is ${showT(mag)}. The minus sign outside the bars asks for the opposite of that distance.`;
      sol = `|${show(inner)}| = ${show(mag)}, because ${show(inner)} is ${show(mag)} units from 0. The minus sign outside the bars takes the opposite: −|${show(inner)}| = <b>${show(-mag)}</b>. The bars come first, then the sign outside.`;
    } else if (form === 'picture') {
      const v = r.chance(0.7) ? -mag : mag;
      const lim = hard ? 4 : 15;
      answer = mag;
      title = 'Read the absolute value off the gauge';
      prompt = `<p>${name}'s sounder needle stops at point <b>P</b>. The display reports the <b>absolute value</b> of the reading, |P|.</p>${V.numberLine({
        min: -lim,
        max: lim,
        step: hard ? 0.25 : 1,
        labelEvery: hard ? 1 : 5,
        points: [{ v, label: 'P', above: true }],
        aria: `Number line from ${-lim} to ${lim} with point P at ${mixedText(v)}`,
      })}<p>What number does the display report?</p>`;
      h2 = hard
        ? `Find P. It is ${v < 0 ? 'left' : 'right'} of 0, between ${dec(Math.sign(v) * Math.floor(mag))} and ${dec(Math.sign(v) * Math.ceil(mag))}.`
        : `Find P. It is ${v < 0 ? 'left' : 'right'} of 0. Only every fifth tick is labeled, so count ticks from the nearest label.`;
      h3 = `Count the ${hard ? 'quarter ' : ''}ticks from P back to 0. That count of units, with no sign, is |P|.`;
      sol = `P is at ${show(v)}, which is ${show(mag)} units from 0. So |P| = <b>${show(mag)}</b>${hard ? ` (${dec(mag)})` : ''}. Absolute value measures distance, so it is never negative.`;
    } else {
      const ctx = r.pick([
        { what: 'a sea-floor reading', side: 'below the surface' },
        { what: 'a temperature', side: 'below 0°C' },
        { what: 'an account change', side: 'a withdrawal, not a deposit' },
      ]);
      answer = -mag;
      title = 'Work backward from the absolute value';
      prompt = `<p>${name} knows that ${ctx.what} has an absolute value of ${hlRaw(show(mag))}, and that it is ${ctx.side}.</p><p>What was the reading?</p>`;
      h2 = `Two numbers have absolute value ${showT(mag)}: one on each side of 0. The words tell you which side.`;
      h3 = `"${cap(ctx.side)}" means the reading is less than 0. Choose the number ${showT(mag)} units from 0 on that side.`;
      sol = `Both ${show(mag)} and ${show(-mag)} have absolute value ${show(mag)}. The reading is ${ctx.side}, so it is negative: <b>${show(-mag)}</b>.`;
    }
    return {
      type: 'num',
      skill: 'abs-value',
      lesson: '7-3',
      title,
      prompt: prompt + `<p class="muted">Use a minus sign for a negative number, like -1.${hard ? ' Type fractions as improper fractions, like 7/4.' : ''}</p>`,
      answer,
      hints: ['Absolute value is the distance a number is from 0 on the number line. A distance is never negative.', h2, h3],
      hintEs: 'El valor absoluto es la distancia de un número al 0 en la recta numérica. Una distancia nunca es negativa.',
      solution: `<p>${sol}</p>`,
      feedback: {
        correct: `Correct. ${form === 'negAbs' ? 'The bars give the distance; the sign outside takes its opposite.' : form === 'picture' ? 'Absolute value is the distance from 0.' : 'The absolute value gives the distance; the words give the side of 0.'}`,
        wrong(ans, d) {
          const x = d.value;
          if (x == null) return 'Type one number. Use a minus sign for a negative number.';
          if (typedMixed(answer) != null && near(x, typedMixed(answer), 0.001)) return 'A mixed number typed with a space is read as a different number. Type a decimal or an improper fraction instead.';
          if (near(x, -answer, 0.001)) {
            if (form === 'negAbs') return 'You found the absolute value, but the minus sign outside the bars still applies. Take the opposite of the distance.';
            if (form === 'picture') return 'P is on the negative side, but |P| is a distance. A distance is never negative.';
            return 'That number has the right absolute value but is on the wrong side of 0. Reread the words that tell the direction.';
          }
          if (near(x, 0, 0.001)) return 'Only |0| = 0. This reading is not at 0, so its distance from 0 is not 0.';
          if (near(Math.abs(x), mag * 2, 0.001)) return `That is twice the distance. Count from the point to 0 in one direction only.`;
          if (form === 'picture' && near(Math.abs(Math.abs(x) - mag), hard ? 0.25 : 1, 0.001)) return 'You are one tick off. Count the ticks from P to 0 again, starting at the nearest labeled number.';
          return 'Find the distance from 0 first (the absolute value). Then decide whether any sign outside the bars or in the words changes it.';
        },
      },
    };
    function cap(t) {
      return t.charAt(0).toUpperCase() + t.slice(1);
    }
  });

  // ---------- Absolute value in a real situation (mc). Hard: how much deeper/colder one negative reading is than another. ----------
  G.define('n3_absContext', (r, o) => {
    const hard = !!o.hard;
    const c = r.pick(ABS_CTX);
    const name = r.pick(NAMES);
    let opts, prompt, hints, hintEs, solution, correct;
    if (!hard) {
      const n = drawMag(r, 4, 60, c.unit !== 'dollars');
      opts = [
        { html: `${dec(n)} ${c.unit}`, ok: true },
        { html: `${dec(-n)} ${c.unit}`, why: `${dec(-n)} is the position of the reading. The question asks for a distance, and a distance is never negative. |${dec(-n)}| = ${dec(n)}.` },
        { html: `0 ${c.unit}`, why: `0 is the reference point (${c.ref}). The reading is ${dec(n)} units away from that point, not at it.` },
        { html: `${dec(2 * n)} ${c.unit}`, why: `${dec(2 * n)} is double the distance. From ${dec(-n)} to 0 is ${dec(n)} units in one direction.` },
      ];
      prompt = `<p>${c.read(n)} ${name} needs the distance from ${c.ref}.</p><p>${c.q}</p>`;
      hints = [`The reading ${dec(-n)} tells you a position below the reference point. "How far" asks for a distance.`, `Distance from 0 is the absolute value: |${dec(-n)}|.`, `Find |${dec(-n)}|. The sign shows direction only, so leave it off.`];
      hintEs = `La lectura ${dec(-n)} indica una posición por debajo del punto de referencia. "¿A qué distancia?" pide una distancia.`;
      solution = `<p>The reading ${dec(-n)} means ${dec(n)} units <em>below</em> ${c.ref}. The distance is the absolute value: |${dec(-n)}| = <b>${dec(n)} ${c.unit}</b>. The negative sign shows direction (below); the absolute value shows how far.</p>`;
      correct = `Correct. The sign tells direction. The absolute value, ${dec(n)}, tells distance.`;
    } else {
      const a = c.unit === 'dollars' ? r.int(30, 90) + r.pick([0.25, 0.5, 0.75]) : drawQuarter(r, 12, 40);
      let b = c.unit === 'dollars' ? r.int(5, 25) + r.pick([0.25, 0.5, 0.75]) : drawQuarter(r, 3, 10);
      const diff = r2(a - b),
        sum = r2(a + b);
      const fmtU = (x) => dec(x) + ' ' + c.unit;
      opts = [
        { html: fmtU(diff), ok: true },
        { html: fmtU(sum), why: `${fmtU(sum)} adds the two distances. Both readings are on the same side of 0, so the gap between them is the difference of their absolute values.` },
        { html: fmtU(-diff), why: `The size is right, but "how much ${c.deeper}" asks for a distance, which is never negative.` },
        { html: fmtU(a), why: `${fmtU(a)} is the distance of the first reading from 0. The question asks how far apart the two readings are.` },
      ];
      prompt = `<p>${c.two(a, b)}</p><p>${c.hq}</p>`;
      hints = [
        'Both readings are negative, so both are on the same side of 0. Find each distance from 0 with absolute value.',
        `|${dec(-a)}| = ${dec(a)} and |${dec(-b)}| = ${dec(b)}.`,
        `Both distances are measured from the same 0 in the same direction. Subtract the smaller distance from the larger one.`,
      ];
      hintEs = 'Las dos lecturas son negativas, así que están del mismo lado del 0. Halla la distancia de cada una al 0 con el valor absoluto.';
      solution = `<p>|${dec(-a)}| = ${dec(a)} and |${dec(-b)}| = ${dec(b)}. Both are below ${c.ref}, so the difference is ${dec(a)} − ${dec(b)} = <b>${fmtU(diff)}</b>. Same side of 0: subtract the absolute values. Opposite sides of 0: add them.</p>`;
      correct = `Correct. Same side of 0, so subtract the absolute values: ${dec(a)} − ${dec(b)} = ${dec(diff)}.`;
    }
    const sh = shuffleOptions(r, opts, 0);
    return {
      type: 'mc',
      skill: 'abs-value',
      lesson: '7-3',
      title: hard ? 'Compare two distances' : 'Distance in a real situation',
      prompt,
      options: sh.options,
      answer: sh.answer,
      hints,
      hintEs,
      solution,
      feedback: { correct, wrong: whyOf(sh.options) },
    };
  });

  // ---------- True or false about absolute value (tf). Hard: fractions and the subtler claims. ----------
  G.define('n3_tfAbs', (r, o) => {
    const hard = !!o.hard;
    const a = hard ? drawQuarter(r, 2, 9) : drawMag(r, 2, 15, true);
    let b = hard ? drawQuarter(r, 1, 9) : drawMag(r, 2, 15, true);
    while (near(b, a)) b = hard ? drawQuarter(r, 1, 9) : drawMag(r, 2, 15, true);
    const big = Math.max(a, b),
      small = Math.min(a, b);
    const kind = r.int(0, 3);
    const T = hard ? mixedText : dec;
    let statement, answer, reasons, h2, h3;
    if (!hard) {
      if (kind === 0) {
        statement = `|${dec(-a)}| is a negative number.`;
        answer = false;
        reasons = [
          { html: `|${dec(-a)}| is the distance from ${dec(-a)} to 0, and a distance is never negative.`, correct: true },
          { html: `The number inside the bars is negative, so the answer stays negative.` },
          { html: `Absolute value bars make every number equal to 0.` },
        ];
      } else if (kind === 1) {
        statement = `|${dec(-a)}| = |${dec(a)}|`;
        answer = true;
        reasons = [
          { html: `${dec(-a)} and ${dec(a)} are opposites. Both are the same distance from 0, so their absolute values are equal.`, correct: true },
          { html: `Any two numbers have the same absolute value.` },
          { html: `The bars cancel the numbers, so both sides equal 0.` },
        ];
      } else if (kind === 2) {
        statement = `|${dec(-a)}| = ${dec(-a)}`;
        answer = false;
        reasons = [
          { html: `|${dec(-a)}| means the distance from ${dec(-a)} to 0, and that distance is positive, not ${dec(-a)}.`, correct: true },
          { html: `The statement is false because |${dec(-a)}| is ${dec(a * 2)}.` },
          { html: `Absolute value never changes a number, so the statement is true.` },
        ];
      } else {
        statement = `|${dec(-big)}| > |${dec(small)}|`;
        answer = true;
        reasons = [
          { html: `|${dec(-big)}| is ${dec(big)} units and |${dec(small)}| is ${dec(small)} units. The first distance is greater.`, correct: true },
          { html: `Negative numbers always have greater absolute values than positive numbers.` },
          { html: `${dec(-big)} is less than ${dec(small)}, so its absolute value is less too.` },
        ];
      }
      h2 = kind === 3 ? `Find |${dec(-big)}| and |${dec(small)}| as distances from 0.` : `Find |${dec(-a)}|: how many units is ${dec(-a)} from 0?`;
      h3 = kind === 3 ? 'Now compare the two distances. Which one is greater?' : `Now reread the statement with that distance in place of |${dec(-a)}|. Does it hold?`;
    } else {
      if (kind === 0) {
        statement = `|−${T(big)}| < |−${T(small)}|`;
        answer = false;
        reasons = [
          { html: `−${T(big)} is less than −${T(small)}, but it is farther from 0. Its absolute value is greater, not less.`, correct: true },
          { html: `It is true, because −${T(big)} < −${T(small)} on the number line.` },
          { html: `It is true, because the bars do not change negative numbers.` },
        ];
      } else if (kind === 1) {
        statement = `If |n| = ${T(a)}, then n must be ${T(a)}.`;
        answer = false;
        reasons = [
          { html: `n could be ${T(a)} or −${T(a)}. Both numbers are ${T(a)} units from 0.`, correct: true },
          { html: `It is true, because absolute value is never negative, so n is never negative.` },
          { html: `It is false, because n must be −${T(a)}.` },
        ];
      } else if (kind === 2) {
        statement = `−|−${T(a)}| = −${T(a)}`;
        answer = true;
        reasons = [
          { html: `|−${T(a)}| = ${T(a)}, and the minus sign outside the bars gives its opposite, −${T(a)}.`, correct: true },
          { html: `It is false, because an absolute value can never be negative.` },
          { html: `It is true, because the bars do nothing to a negative number.` },
        ];
      } else {
        statement = `|${T(small)}| > |−${T(big)}|`;
        answer = false;
        reasons = [
          { html: `|${T(small)}| = ${T(small)} and |−${T(big)}| = ${T(big)}. ${T(small)} is the smaller distance.`, correct: true },
          { html: `It is true, because a positive number is always greater than a negative one.` },
          { html: `It is true, because absolute value bars reverse the order of numbers.` },
        ];
      }
      h2 = kind === 1 ? `Which numbers are exactly ${T(a)} units from 0? There may be more than one.` : `Replace each |…| with a distance from 0. Do the bars first, then any sign outside them.`;
      h3 = kind === 1 ? 'Check whether the claim lists every number with that absolute value.' : 'Compare the statement with your distances. Watch for an order on the number line that is not the same as an order of distances.';
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
      hints: ['Absolute value means distance from 0. Replace each |...| with that distance before you decide.', h2, h3],
      hintEs: 'El valor absoluto significa distancia al 0. Cambia cada |...| por esa distancia antes de decidir.',
      solution: `<p>${sh.options.find((x) => x.correct).html} The statement is <b>${answer ? 'true' : 'false'}</b>.</p>`,
      feedback: {
        correct: answer ? 'Correct. Replacing each absolute value with a distance makes the statement easy to check.' : 'Correct. Absolute value is a distance from 0, not a position on the number line.',
        wrong(ans, d) {
          if (!d.valueOk) return hard && kind === 0 ? 'Being less on the number line is not the same as being closer to 0. Compare the distances from 0.' : hard && kind === 1 ? 'Think of a number line: how many points are that far from 0?' : 'Start by finding each absolute value as a distance from 0. Then decide.';
          return 'Your true/false answer is right. Pick the reason that talks about distance from 0.';
        },
      },
    };
  });

  // ---------- Match: absolute value vs. opposite (match). Hard: four values that share two sizes, with signs outside the bars. ----------
  G.define('n3_matchAbs', (r, o) => {
    const hard = !!o.hard;
    let left, vals;
    if (hard) {
      const a = drawQuarter(r, 1, 8);
      let b = drawQuarter(r, 1, 8);
      while (near(a, b)) b = drawQuarter(r, 1, 8);
      left = [`−|−${mixedText(a)}|`, `|−${mixedText(a)}|`, `the opposite of −${mixedText(b)}`, `−|${mixedText(b)}|`];
      vals = [-a, a, b, -b];
    } else {
      const a = r.int(2, 12);
      let b = r.int(2, 12);
      while (b === a) b = r.int(2, 12);
      const dHalf = r.int(1, 9) + 0.5;
      left = [`|${dec(-a)}|`, `the opposite of ${dec(a)}`, `|${dec(b)}|`, `|${dec(-dHalf)}|`];
      vals = [a, -a, b, dHalf];
    }
    const rightOrder = r.shuffle([0, 1, 2, 3]);
    const right = rightOrder.map((i) => (hard ? mixedText(vals[i]) : dec(vals[i])));
    return {
      type: 'match',
      skill: 'abs-value',
      lesson: '7-3',
      title: 'Absolute value or opposite?',
      prompt: hard
        ? `<p>The sounder log mixes <b>absolute value</b> (distance from 0) and <b>opposite</b> (same distance, other side of 0). Some entries use both. Match each expression to its value.</p>`
        : `<p>The sounder log mixes two ideas: <b>absolute value</b> (distance from 0) and <b>opposite</b> (same distance, other side of 0). Match each expression to its value.</p>`,
      left,
      right,
      pairs: left.map((_, i) => [i, rightOrder.indexOf(i)]),
      hints: [
        'Absolute value bars |…| give a distance, which is never negative. "The opposite of" switches the sign.',
        hard ? 'Do the bars first. Then a minus sign outside the bars takes the opposite of that distance.' : `|${dec(-vals[0])}| is the distance from ${dec(-vals[0])} to 0. "The opposite of" a positive number is on the negative side of 0.`,
        hard ? 'Two values are negative and two are positive. Decide the sign of each expression first, then its size.' : 'A positive number is its own absolute value. A negative number’s absolute value drops the sign.',
      ],
      hintEs: 'Las barras de valor absoluto |…| dan una distancia, que nunca es negativa. "El opuesto de" cambia el signo.',
      solution: `<ul>${left.map((t, i) => `<li>${t} → <b>${hard ? mixedText(vals[i]) : dec(vals[i])}</b></li>`).join('')}</ul><p>Absolute value drops the sign because it measures distance. Taking the opposite flips the sign because it moves to the other side of 0.${hard ? ' A minus sign outside the bars makes the result negative.' : ''}</p>`,
      feedback: {
        correct: 'Correct. Absolute value is a distance; the opposite is a reflection across 0.',
        wrong(ans, d) {
          const i = (d.wrong || [])[0];
          if (i == null || !left[i]) return 'At least one match is off. Decide: is this a distance (absolute value) or a flip (opposite)?';
          const got = (ans || []).find((p) => p[0] === i);
          const gotVal = got ? vals[rightOrder[got[1]]] : null;
          if (gotVal != null && near(gotVal, -vals[i])) {
            if (/^−\|/.test(left[i])) return `${left[i]} has a minus sign outside the bars. Find the distance first, then take its opposite: the result is negative.`;
            if (/^\|/.test(left[i])) return `${left[i]} is a distance, so it is positive even when the number inside is negative.`;
            return `"${left[i]}" is not a distance. It is the number on the other side of 0, so check its sign.`;
          }
          return `Check ${left[i]}. Find the distance from 0 first, then apply any sign outside the bars.`;
        },
      },
    };
  });

  // ---------- Total distance between points on opposite sides of 0 (num). Hard: one mixed number, one decimal. ----------
  G.define('n3_totalDistance', (r, o) => {
    const hard = !!o.hard;
    const a = hard ? drawQuarter(r, 1, 8) : r.int(2, 12);
    let b = hard ? r.int(1, 8) + r.pick([0.25, 0.5, 0.75]) : r.int(2, 12);
    const lo = -a,
      hi = b;
    // Hard: the negative end is written as a mixed number and the positive end as a decimal.
    const loT = hard ? mixedHtml(lo) : dec(lo);
    const hiT = dec(hi);
    const name = r.pick(NAMES);
    const ctx = r.pick([
      { text: `A crack in the ice runs from ${hlRaw(loT + ' m')} to ${hl(hiT + ' m')} on the depth line (0 is the shelf line).`, q: 'How long is the crack, in meters?', unit: 'm' },
      { text: `Overnight the temperature at the station rose from ${hlRaw(loT + '°C')} to ${hl(hiT + '°C')}.`, q: 'How many degrees did the temperature change?', unit: '°C' },
      { text: `${name} walks along a marked line from the flag at ${hlRaw(loT)} to the flag at ${hl(hiT)}. Each unit is one meter.`, q: 'How far does ' + name + ' walk, in meters?', unit: 'm' },
      { text: `A cable hangs from a hook at ${hl(hiT + ' m')} down to a weight at ${hlRaw(loT + ' m')}, measured from the ice surface at 0.`, q: 'How long is the cable, in meters?', unit: 'm' },
    ]);
    const total = r2(a + b);
    const lim = hard ? 10 : 12;
    return {
      type: 'num',
      skill: 'abs-distance',
      lesson: '7-3',
      title: hard ? 'Total distance with rational numbers' : 'Total distance across zero',
      prompt: `<p>${ctx.text}</p><p>${ctx.q}</p>${hard ? '<p class="muted">Type a decimal.</p>' : ''}`,
      unit: ctx.unit,
      answer: total,
      hints: [
        'The two numbers are on opposite sides of 0. Find the distance from each one to 0, then add the two distances.',
        hard ? `|${mixedText(lo)}| = ${mixedText(a)} = ${dec(a)} and |${hiT}| = ${hiT}. Write both as decimals before you add.` : `|${dec(lo)}| = ${dec(a)} and |${dec(hi)}| = ${dec(b)}.`,
        `Add the two distances: ${dec(a)} + ${dec(b)}.`,
      ],
      hintEs: 'Los dos números están en lados opuestos del 0. Halla la distancia de cada uno al 0 y luego suma las dos distancias.',
      solution: `<p>${hard ? `${mixedText(lo)} = ${dec(lo)}. ` : ''}${dec(lo)} is ${dec(a)} units below 0 and ${dec(hi)} is ${dec(b)} units above 0. The total distance crosses 0, so add the absolute values: |${dec(lo)}| + |${dec(hi)}| = ${dec(a)} + ${dec(b)} = <b>${dec(total)} ${ctx.unit}</b>. You add because the path covers both pieces, one on each side of 0.</p>${absLine([lo, hi], -lim, lim, 1, `Number line showing ${dec(lo)} and ${dec(hi)} with their distances to 0 marked`)}`,
      feedback: {
        correct: `Correct. ${dec(a)} + ${dec(b)} = ${dec(total)}: the two distances to 0 add up.`,
        wrong(ans, d) {
          const diff = r2(Math.abs(a - b));
          const x = d.value;
          if (x == null) return 'Type one number for the distance.';
          if (near(x, diff, 0.001) && diff !== total) return `You subtracted the two sizes. The points are on opposite sides of 0, so the path covers ${dec(a)} units on one side and ${dec(b)} on the other. Add them.`;
          if (near(x, -total, 0.001)) return 'The size is right, but a distance is never negative.';
          if (near(x, a, 0.001) || near(x, b, 0.001)) return `That is the distance from only one point to 0. Add the other point's distance to 0 as well.`;
          if (hard && near(Math.abs(x - total), 0.5, 0.001)) return `Check the fraction part. ${mixedText(a)} is ${dec(a)} as a decimal: ${mixedText(a - Math.floor(a))} = ${dec(a - Math.floor(a))}.`;
          return `Find how far each number is from 0 (its absolute value). Then add the two distances, because the path crosses 0.`;
        },
      },
    };
  });

  // ---------- Who found the distance correctly? (who). Hard: both points on the same side of 0. ----------
  G.define('n3_whoDistance', (r, o) => {
    const hard = !!o.hard;
    const [n1, n2, n3] = r.pickN(NAMES, 3);
    const thing = r.pick(['two ice markers', 'two depth flags', 'two survey stakes', 'two temperature readings']);
    let opts, A, B, total, hints, hintEs, solution, lineArgs;
    if (!hard) {
      const a = r.int(2, 12);
      let b = r.int(2, 12);
      while (b === a) b = r.int(2, 12);
      A = -a;
      B = b;
      total = a + b;
      opts = [
        { title: n1, html: `I added the distances to 0: |${dec(-a)}| + |${dec(b)}| = ${a} + ${b} = <b>${a + b}</b>, since the path crosses 0.`, ok: true },
        {
          title: n2,
          html: `I subtracted the smaller size from the bigger one: ${Math.max(a, b)} − ${Math.min(a, b)} = <b>${Math.abs(a - b)}</b> units apart.`,
          why: `Subtracting only works when both points are on the same side of 0. Here one is negative and one is positive, so the path crosses 0 and the two distances add.`,
        },
        {
          title: n3,
          html: `I counted ${a + b} units, but we started at a negative number, so the distance is <b>${dec(-(a + b))}</b>.`,
          why: `The count of ${a + b} units is right, but a distance is never negative. Starting at a negative number does not make the distance negative.`,
        },
      ];
      hints = ['Sketch a number line. Mark both points. Does the path between them cross 0?', `${dec(-a)} is ${a} units left of 0. ${dec(b)} is ${b} units right of 0.`, `The path covers the piece on the left of 0 and then the piece on the right of 0. Distance is positive.`];
      hintEs = 'Dibuja una recta numérica. Marca los dos puntos. ¿El camino entre ellos cruza el 0?';
      solution = `<p>${n1} is correct. From ${dec(-a)} to 0 is |${dec(-a)}| = ${a} units. From 0 to ${dec(b)} is |${dec(b)}| = ${b} units. The path crosses 0, so the total is ${a} + ${b} = <b>${total}</b>. Subtracting would only work if both points were on the same side of 0, and a distance is never negative.</p>`;
      lineArgs = [-12, 12, 1];
    } else {
      const a = drawQuarter(r, 6, 11);
      const b = drawQuarter(r, 1, 4);
      A = -a;
      B = -b;
      total = r2(a - b);
      opts = [
        { title: n1, html: `Both are left of 0, so I subtracted the distances: ${dec(a)} − ${dec(b)} = <b>${dec(total)}</b> units apart.`, ok: true },
        {
          title: n2,
          html: `To find distance you add absolute values: |${dec(-a)}| + |${dec(-b)}| = <b>${dec(r2(a + b))}</b> units apart.`,
          why: `Adding absolute values only works when the points are on opposite sides of 0. Both points here are negative, so the shorter distance to 0 is already inside the longer one: subtract.`,
        },
        {
          title: n3,
          html: `I subtracted in order: ${dec(-a)} is the smaller number, so the distance is <b>${dec(-total)}</b> units apart.`,
          why: `The size ${dec(total)} is right, but a distance is never negative. Distance is the absolute value of the difference.`,
        },
      ];
      hints = [
        'Sketch both points. Are they on the same side of 0 or on opposite sides?',
        `${dec(-a)} is ${dec(a)} units left of 0 and ${dec(-b)} is ${dec(b)} units left of 0. Both pieces start at 0 and go the same way.`,
        'The shorter piece lies inside the longer one. Subtract the smaller distance from the larger one; the result is positive.',
      ];
      hintEs = 'Dibuja los dos puntos. ¿Están del mismo lado del 0 o en lados opuestos?';
      solution = `<p>${n1} is correct. Both points are on the negative side of 0. ${dec(-a)} is ${dec(a)} units from 0 and ${dec(-b)} is ${dec(b)} units from 0, so the gap is ${dec(a)} − ${dec(b)} = <b>${dec(total)}</b>. Same side of 0: subtract the absolute values. Opposite sides: add them.</p>`;
      lineArgs = [-12, 0, 1];
    }
    const sh = shuffleOptions(r, opts, 0);
    return {
      type: 'who',
      skill: 'abs-distance',
      lesson: '7-3',
      title: 'Who found the distance?',
      prompt: `<p>Three navigators find the distance between ${thing} at ${hl(dec(A))} and ${hl(dec(B))} on a number line.</p><p>Who is correct?</p>`,
      options: sh.options,
      answer: sh.answer,
      layout: 'cards',
      hints,
      hintEs,
      solution: solution + absLine([A, B], lineArgs[0], lineArgs[1], lineArgs[2], `Number line showing ${dec(A)} and ${dec(B)}`),
      feedback: { correct: hard ? `Correct. Same side of 0 means subtract the absolute values: ${dec(total)}.` : `Correct. Opposite sides of 0 means add the absolute values: ${total}.`, wrong: whyOf(sh.options) },
    };
  });

  // ---------- Place every number with a given absolute value (nl). Hard: the absolute value is an improper fraction, quarter ticks. ----------
  G.define('n3_nlSameAbs', (r, o) => {
    const hard = !!o.hard;
    const useHalf = !hard && r.chance(0.4);
    const k = hard ? r.int(1, 3) + r.pick([0.25, 0.75]) : useHalf ? r.int(1, 4) + 0.5 : r.int(2, 9);
    const name = r.pick(NAMES);
    const step = hard ? 0.25 : useHalf ? 0.5 : 1;
    const lim = hard ? 4 : useHalf ? 5 : 10;
    const kShown = hard ? hl(improperText(k)) : hl(dec(k));
    return {
      type: 'nl',
      skill: 'abs-value',
      lesson: '7-3',
      title: 'Numbers with the same absolute value',
      prompt: `<p>${name}'s sounder shows only absolute values. A reading has absolute value ${kShown}.</p><p>Place <b>every</b> number whose absolute value is ${kShown} on the number line.</p><p class="muted">${hard ? 'Each small tick is one fourth. ' : useHalf ? 'Each small tick is 0.5. ' : ''}Click a tick to place a point. Click it again to remove it.</p>`,
      min: -lim,
      max: lim,
      step,
      labelEvery: 1,
      count: 2,
      points: [-k, k],
      hints: [
        'Absolute value is distance from 0. Which numbers are exactly that far from 0?',
        hard ? `${improperText(k)} = ${mixedText(k)}. Start at 0 and count ${Math.round(k * 4)} quarter ticks to the right, then ${Math.round(k * 4)} to the left.` : `Start at 0 and count ${dec(k)} units to the right. Then count ${dec(k)} units to the left.`,
        'Two numbers are that far from 0: one positive and one negative. They are opposites.',
      ],
      hintEs: hard ? 'El valor absoluto es la distancia al 0. Primero escribe la fracción impropia como número mixto. ¿Qué números están a esa distancia del 0?' : 'El valor absoluto es la distancia al 0. ¿Qué números están exactamente a esa distancia del 0?',
      solution: `<p>${hard ? `${improperText(k)} = ${mixedText(k)}. ` : ''}Two numbers are ${mixedText(k)} units from 0: <b>${mixedText(k)}</b> on the right and <b>${mixedText(-k)}</b> on the left. Both have absolute value ${mixedText(k)}, because absolute value measures distance, not direction. Only 0 has just one number with its absolute value.</p>${absLine([-k, k], -lim, lim, step, `Number line showing ${mixedText(-k)} and ${mixedText(k)}, both ${mixedText(k)} units from 0`)}`,
      feedback: {
        correct: `Correct. |${mixedText(-k)}| = |${mixedText(k)}| = ${mixedText(k)}. Opposites always share an absolute value.`,
        wrong(ans, d) {
          const extra = d.extra || [];
          const missing = d.missing || [];
          if (extra.some((x) => near(x, 0, 0.001))) return `|0| = 0, so 0 is not the right distance from 0. Count the same distance each way from 0.`;
          if (hard && extra.some((x) => near(Math.abs(x), Math.floor(k) + (1 - (k - Math.floor(k))), 0.001))) return 'One point is counted from the wrong whole number. Start at the whole number closer to 0 and count quarter ticks away from 0.';
          if (extra.some((x) => near(Math.abs(Math.abs(x) - k), step, 0.001))) return `One point is off by one tick. Each point must be exactly ${mixedText(k)} units from 0.`;
          if (!extra.length && missing.some((m) => m < 0)) return `You placed the positive number. There is another number the same distance from 0, on the negative side.`;
          if (!extra.length && missing.some((m) => m > 0)) return `You placed the negative number. There is another number the same distance from 0, on the positive side.`;
          return `Count ${mixedText(k)} units to the right of 0 and ${mixedText(k)} units to the left of 0. Both of those numbers have that absolute value.`;
        },
      },
    };
  });

  // ---------- Which is farther from 0? Explain. (cr). Hard: a negative mixed number against a close positive decimal. ----------
  G.define('n3_crFarther', (r, o) => {
    const hard = !!o.hard;
    const name = r.pick(NAMES);
    const useDec = !hard && r.chance(0.4);
    let a, b;
    if (hard) {
      a = drawQuarter(r, 2, 7); // magnitude of the negative mixed number
      b = r2(a + r.pick([-0.3, -0.2, -0.1, 0.1, 0.2, 0.15, -0.15])); // a close decimal
    } else {
      a = useDec ? r.int(2, 8) + 0.5 : r.int(2, 12);
      b = useDec ? r.int(2, 8) + 0.5 : r.int(2, 12);
      while (near(a, b)) b = useDec ? r.int(2, 8) + 0.5 : r.int(2, 12);
    }
    const neg = -a;
    const negT = hard ? mixedText(neg) : dec(neg);
    const negH = hard ? mixedHtml(neg) : dec(neg);
    const farNeg = a > b;
    const farT = farNeg ? negT : dec(b);
    const ctx = r.pick([
      { what: 'two sea-floor readings', line: 'depth line' },
      { what: 'two temperature readings', line: 'thermometer' },
      { what: 'two survey flags', line: 'marked line' },
    ]);
    const opts = [
      { html: `${farT} is farther from 0, because |${negT}| = ${dec(a)} and |${dec(b)}| = ${dec(b)}, and ${dec(Math.max(a, b))} > ${dec(Math.min(a, b))}.`, ok: true },
      { html: `${dec(b)} is farther from 0, because positive numbers are always farther from 0 than negative numbers.`, why: `The sign does not decide distance. ${negT} is ${dec(a)} units from 0 and ${dec(b)} is ${dec(b)} units from 0. Compare those distances.` },
      {
        html: `${negT} is farther from 0, because negative numbers are less than 0, and smaller numbers are farther away.`,
        why: `"Less than" is about order on the number line, not distance from 0. ${negT} is ${dec(a)} units from 0; ${dec(b)} is ${dec(b)} units from 0. The larger absolute value is farther.`,
      },
    ];
    const sh = shuffleOptions(r, opts, 0);
    return {
      type: 'cr',
      skill: 'abs-distance',
      lesson: '7-3',
      title: 'Explain: which is farther from 0?',
      prompt: `<p>${name} compares ${ctx.what} on the ${ctx.line}: ${hlRaw(negH)} and ${hl(dec(b))}.</p><p>Which reading is farther from 0? Explain your reasoning using absolute value, then choose the correct explanation.</p>`,
      starters: [`${negT} is ___ units from 0 because …`, `The absolute value of ${dec(b)} is …`, 'The number farther from 0 is the one with …'],
      minWords: 10,
      check: { prompt: 'Which explanation is correct?', options: sh.options, answer: sh.answer },
      hints: [
        'Distance from 0 is the absolute value. Find the absolute value of each number first.',
        hard ? `|${negT}| = ${mixedText(a)}. Write it as a decimal so you can compare it with ${dec(b)}.` : `Find |${dec(neg)}| and |${dec(b)}| as distances from 0.`,
        'Compare the two distances. The larger distance means farther from 0, no matter the sign.',
      ],
      hintEs: hard ? 'La distancia al 0 es el valor absoluto. Halla el valor absoluto de cada número y escribe los dos como decimales para compararlos.' : 'La distancia al 0 es el valor absoluto. Primero halla el valor absoluto de cada número.',
      solution: `<p>Model: "|${negT}| = ${dec(a)} and |${dec(b)}| = ${dec(b)}. ${dec(Math.max(a, b))} > ${dec(Math.min(a, b))}, so <b>${farT}</b> is farther from 0." The sign tells which side of 0 a number is on. Only the absolute value tells how far away it is.</p>${absLine([neg, b], -10, 10, hard || useDec ? 0.5 : 1, `Number line comparing the distances of ${negT} and ${dec(b)} from 0`)}`,
      feedback: {
        correct: 'Correct. A clear explanation names both absolute values and compares them.',
        wrong(ans, d) {
          if (!d.wroteEnough) return `Write a full explanation (a few sentences). Name |${negT}| and |${dec(b)}| and compare them.`;
          return (sh.options[ans.check] && sh.options[ans.check].why) || `Compare the two absolute values as distances from 0.`;
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
  const hlRaw = (html) => `<mark class="num">${html}</mark>`;
  const whyOf = (opts) => (ans) => (opts[ans] && opts[ans].why) || 'Not that one. Place each number on a number line: left is less, right is greater.';

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
      labelEvery: step < 1 ? 1 : max - min > 30 ? 10 : max - min > 16 ? 2 : 1,
      points: vals.map((v, i) => ({ v, label: mixedText(v), color: ['#C8553D', '#1FA6A2', '#17324D', '#F2A33A', '#6B7F3A'][i % 5] })),
      aria,
    });
  /**
   * Diagnose a wrong ordering. vals: the item values; order: the correct index order; ans: the student's index order.
   * Recognises a reversed order, ordering by absolute value, and negatives ordered closest-to-0 first.
   */
  const seqWhy = (vals, order, ans, asc, show) => {
    const same = (a, b) => a.length === b.length && a.every((x, i) => x === b[i]);
    const idx = vals.map((_, i) => i);
    const dir = (cmp) => (asc ? cmp : (x, y) => cmp(y, x));
    if (!Array.isArray(ans) || ans.length !== order.length) return 'Put every reading in the list before you check.';
    if (same(ans, order.slice().reverse())) return `Your order is exactly backward. The list asks for ${asc ? 'least first' : 'greatest first'}.`;
    const byAbs = idx.slice().sort(dir((x, y) => Math.abs(vals[x]) - Math.abs(vals[y])));
    if (same(ans, byAbs)) return 'You ordered by distance from 0 (absolute value) and ignored the signs. Every negative number is less than every positive number.';
    const negFlip = idx.slice().sort(dir((x, y) => (vals[x] < 0 && vals[y] < 0 ? Math.abs(vals[x]) - Math.abs(vals[y]) : vals[x] - vals[y])));
    if (same(ans, negFlip)) return 'The negatives are in the wrong order. For two negative numbers, the one farther from 0 is farther left, so it is less.';
    const k = ans.findIndex((x, i) => x !== order[i]);
    return `The first ${k} reading${k === 1 ? ' is' : 's are'} in the right place. Look again at ${show(ans[k])}: find it on a number line and compare it with its neighbors.`;
  };

  // ---------- Compare with < or > (cloze; hard = close rational numbers, two comparisons) ----------
  G.define('n4_clozeCompare', (r, o) => {
    const hard = !!o.hard;
    const makeInt = () => (r.chance(0.65) ? -r.int(1, 12) : r.int(0, 9));
    const pairs = [];
    if (hard) {
      // Pair 1: two negatives with the same whole-number part, one a fraction and one a decimal (e.g. −2¾ and −2.6).
      const w = r.int(0, 4);
      const fa = r.pick([0.25, 0.5, 0.75]);
      const fb = r.pick([0.2, 0.3, 0.4, 0.6, 0.7, 0.8]);
      pairs.push(r.shuffle([-(w + fa), -(w + fb)]));
      // Pair 2: a negative fraction against a negative or positive decimal with a different whole part.
      const a = -(r.int(0, 3) + r.pick([0.25, 0.5, 0.75]));
      let b = r.chance(0.5) ? -(r.int(0, 3) + r.pick([0.2, 0.4, 0.6, 0.8])) : r.pick([0.2, 0.4, 0.6, 0.8]);
      pairs.push(r.shuffle([a, b]));
    } else pairs.push(drawDistinct(r, 2, makeInt));
    const name = r.pick(NAMES);
    // Hard: quarters show as fractions, tenths as decimals, so every comparison mixes forms.
    const showOf = (v) => (hard && [0.25, 0.5, 0.75].some((f) => near(Math.abs(v) % 1, f)) ? mixedText(v) : dec(v));
    const shown = pairs.map(([a, b]) => [showOf(a), showOf(b)]);
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
      prompt: `<p>${name} compares ${hard ? 'readings' : 'two temperature readings'} from the ridge sensors. Choose the symbol that makes each comparison true.</p>${hard ? '' : '<p class="muted">On a number line, the number farther left is less.</p>'}`,
      template,
      choices: pairs.map(() => ['<', '>']),
      answers,
      hints: [
        hard ? 'Write each number as a decimal first. Then picture both on a number line: the one farther left is less.' : 'Picture both numbers on a number line. The one farther to the left is less. Negative numbers are left of 0.',
        hard
          ? `As decimals, the first pair is ${dec(a)} and ${dec(b)}. Both are negative, so the one farther from 0 is farther left.`
          : a < 0 && b < 0
            ? `Both are negative. ${dec(a)} is ${Math.abs(a)} units left of 0 and ${dec(b)} is ${Math.abs(b)} units left of 0. The one farther left is less.`
            : `${dec(Math.min(a, b))} is on the ${sideWord(Math.min(a, b))} side of 0 and ${dec(Math.max(a, b))} is ${Math.max(a, b) === 0 ? 'at 0' : 'on the ' + sideWord(Math.max(a, b)) + ' side'}. Anything left of another number is less.`,
        `Decide which number in ${hard ? 'each' : 'the'} pair is farther left. The symbol opens toward the other, greater number.`,
      ],
      hintEs: hard
        ? 'Primero escribe cada número como decimal. Luego imagina los dos en la recta numérica: el que está más a la izquierda es el menor.'
        : 'Imagina los dos números en una recta numérica. El que está más a la izquierda es el menor. Los números negativos están a la izquierda del 0.',
      solution: `<p>${pairs.map((p) => explain(p)).join('. ')}. <b>${pairs.map((p) => `${mixedText(p[0])} ${p[0] < p[1] ? '<' : '>'} ${mixedText(p[1])}`).join('</b> and <b>')}</b>. The symbol opens toward the greater number.</p>${line(allVals, -lim, lim, hard ? 0.5 : 1, 'Number line showing the numbers being compared')}`,
      feedback: {
        correct: 'Correct. Left is less, right is greater, on every number line.',
        wrong(ans, d) {
          const i = (d.wrong || [0])[0] || 0;
          const [x, y] = pairs[i];
          if (x < 0 && y < 0)
            return `Both numbers are negative. ${shown[i][0]} and ${shown[i][1]}: the one farther from 0 is farther left, and farther left means less. Do not compare the sizes without the signs.${hard ? ' Write both as decimals to see which is farther from 0.' : ''}`;
          if (Math.sign(x) !== Math.sign(y)) return `Every negative number is less than 0 and less than every positive number. Which of ${shown[i][0]} and ${shown[i][1]} is negative?`;
          return `Place ${shown[i][0]} and ${shown[i][1]} on a number line. The one on the left is less.`;
        },
      },
    };
  });

  // ---------- Which reading is coldest / warmest? (mc). Hard: close rational temperatures in mixed forms. ----------
  G.define('n4_colderMc', (r, o) => {
    const hard = !!o.hard;
    const coldest = r.chance(0.6);
    let temps;
    if (hard) {
      // Four readings packed within about one degree of each other, mostly negative.
      const base = r.int(3, 14);
      const offs = r.pickN([0, 0.25, 0.4, 0.5, 0.6, 0.75, 0.8, 1], 4);
      temps = offs.map((f) => -(base + f));
      if (!coldest) temps[r.int(0, 3)] = -(base - 1 + r.pick([0.25, 0.5, 0.75])); // one reading a bit closer to 0
    } else {
      temps = drawDistinct(r, 4, () => (r.chance(0.7) ? -r.int(1, 20) : r.int(0, 8)));
      if (!temps.some((t) => t < 0)) temps[0] = -r.int(3, 15);
      if (!temps.some((t) => t > 0)) temps[1] = r.int(1, 8);
    }
    const show = (t) => (hard && [0.25, 0.5, 0.75].some((f) => near(Math.abs(t) % 1, f)) ? mixedText(t) : dec(t));
    const sensors = r.pickN(SENSORS, 4);
    const target = coldest ? Math.min(...temps) : Math.max(...temps);
    const absMax = temps.reduce((m, t) => (Math.abs(t) > Math.abs(m) ? t : m), temps[0]);
    const opts = temps.map((t, i) => {
      if (t === target) return { html: `${sensors[i]}: ${show(t)}°C`, ok: true };
      let why;
      if (coldest) {
        if (t > 0) why = `${dec(t)}°C is above 0, so it is warmer than every negative reading.`;
        else if (t === 0) why = `0°C is warmer than every negative reading. Negatives are below 0.`;
        else why = `${show(t)}°C is cold, but ${show(target)}°C is farther left on the thermometer. The farther below 0, the colder.`;
      } else {
        if (t === absMax && t < 0) why = `${show(t)} has the largest absolute value, but it is the farthest below 0. That makes it the coldest, not the warmest.`;
        else if (t < 0) why = `${show(t)}°C is below 0. ${show(target)}°C is closer to 0 (farther right), so it is warmer.`;
        else why = `${dec(t)}°C is warm, but ${dec(target)}°C is farther right on the number line, so it is warmer.`;
      }
      return { html: `${sensors[i]}: ${show(t)}°C`, why };
    });
    const sh = shuffleOptions(r, opts, temps.indexOf(target));
    return {
      type: 'mc',
      skill: 'compare',
      lesson: '7-4',
      title: coldest ? 'Which sensor is coldest?' : 'Which sensor is warmest?',
      prompt: `<p>Four ridge sensors report their temperatures at the same moment.${hard ? ' The readings are very close, so compare carefully.' : ''}</p><p>Which sensor shows the <b>${coldest ? 'coldest' : 'warmest'}</b> temperature?</p>`,
      options: sh.options,
      answer: sh.answer,
      hints: [
        `On a thermometer, colder is lower (farther left on a number line) and warmer is higher (farther right).`,
        hard ? `Write every reading as a decimal: ${temps.map(dec).join(', ')}. All are negative, so compare their distances from 0.` : `Any negative temperature is colder than 0 and colder than any positive temperature. ${coldest ? 'Look only at the negative readings.' : 'Start by checking if any reading is positive.'}`,
        coldest ? `Among the negatives, the one with the largest absolute value is farthest below 0, so it is the coldest.` : `The warmest reading is farthest to the right on the number line: the greatest number.`,
      ],
      hintEs: 'En un termómetro, más frío es más abajo (más a la izquierda en la recta numérica) y más caliente es más arriba (más a la derecha).',
      solution: `<p>Placed on a number line: ${temps
        .slice()
        .sort((x, y) => x - y)
        .map(dec)
        .join(', ')}. The ${coldest ? 'coldest is the least number, farthest left' : 'warmest is the greatest number, farthest right'}: <b>${show(target)}°C</b>.${coldest ? ' For negative temperatures, a bigger absolute value means farther below 0, so colder.' : ''}</p>${hard ? line(temps, -Math.ceil(Math.abs(Math.min(...temps))) - 1, Math.min(0, -Math.floor(Math.abs(Math.max(...temps))) + 1), 0.25, 'Number line showing the four temperatures') : line(temps, -20, 10, 1, 'Number line showing the four temperatures')}`,
      feedback: { correct: `Correct. ${show(target)}°C is the ${coldest ? 'least' : 'greatest'} number, so it is the ${coldest ? 'coldest' : 'warmest'}.`, wrong: whyOf(sh.options) },
    };
  });

  // ---------- Error: −8 > −2 because 8 > 2 (error). Hard: the same mistake with a fraction and a decimal. ----------
  G.define('n4_errorCompare', (r, o) => {
    const hard = !!o.hard;
    let big, small;
    if (hard) {
      const w = r.int(0, 5);
      big = w + r.pick([0.75, 0.8, 0.6]);
      small = w + r.pick([0.25, 0.5, 0.4]);
    } else {
      big = r.int(5, 15);
      small = r.int(1, big - 2);
    }
    // Hard: the negative with the larger size is shown as a fraction when it can be.
    const bigT = hard && [0.75].some((f) => near(big % 1, f)) ? mixedText(-big) : dec(-big);
    const smallT = hard && [0.25, 0.5].some((f) => near(small % 1, f)) ? mixedText(-small) : dec(-small);
    const bigAbsT = bigT.replace('−', '');
    const smallAbsT = smallT.replace('−', '');
    const name = r.pick(NAMES);
    const ctx = r.pick(['temperatures', 'depth readings', 'elevation readings', 'account balances']);
    const opts = [
      { html: `${name} compared the absolute values ${bigAbsT} and ${smallAbsT} instead of the numbers. ${bigT} is farther left, so ${bigT} < ${smallT}.`, ok: true },
      { html: `${name} is correct. A number with bigger digits is always the bigger number, even when it is negative.`, why: `That rule works for positive numbers only. For negatives, a bigger absolute value means farther below 0, which is less.` },
      { html: `${name} should have written ${bigT} = ${smallT}, because both of these readings are negative.`, why: `Two different numbers are never equal. ${bigT} and ${smallT} are different points on the number line.` },
      { html: `${name} forgot to add the two numbers together first, before comparing them.`, why: `Comparing never requires adding. Compare positions on the number line.` },
    ];
    const sh = shuffleOptions(r, opts, 0);
    return {
      type: 'error',
      skill: 'compare',
      lesson: '7-4',
      title: 'Find the comparison mistake',
      prompt: `<p>${name} compares two ${ctx}, ${hl(bigT)} and ${hl(smallT)}, and writes:</p><p>What is the mistake?</p>`,
      work: `${bigT} > ${smallT}, because ${bigAbsT} > ${smallAbsT}.`,
      options: sh.options,
      answer: sh.answer,
      fix: { label: hard ? 'Which number is greater? Type it as a decimal: ' : 'Which number is greater? Type it: ', answer: -small },
      hints: [
        'Place both numbers on a number line. Which one is farther left?',
        hard ? `As decimals, ${bigT} = ${dec(-big)} and ${smallT} = ${dec(-small)}. ${dec(-big)} is ${dec(big)} units left of 0; ${dec(-small)} is ${dec(small)} units left of 0.` : `${dec(-big)} is ${big} units left of 0. ${dec(-small)} is ${small} units left of 0.`,
        'The number farther left is less. The greater number is the one closer to 0.',
      ],
      hintEs: 'Coloca los dos números en una recta numérica. ¿Cuál está más a la izquierda?',
      solution: `<p>${bigAbsT} > ${smallAbsT} is true, but those are the absolute values (distances from 0). The numbers themselves are negative. ${bigT} is farther below 0 than ${smallT}, so ${bigT} is <b>less</b>: ${bigT} < ${smallT}. The greater number is <b>${smallT}</b>${hard ? ` (${dec(-small)})` : ''}, the one closer to 0.</p>${line([-big, -small], hard ? -Math.ceil(big) - 1 : -16, hard ? 1 : 2, hard ? 0.1 : 1, `Number line showing ${dec(-big)} to the left of ${dec(-small)}`)}`,
      feedback: {
        correct: `Correct. For negative numbers, the one closer to 0 is greater: ${smallT} > ${bigT}.`,
        wrong(ans, d) {
          if (!d.mistakeOk) return (sh.options[ans.mistake] && sh.options[ans.mistake].why) || 'Think about where each number sits on a number line, not how big the digits are.';
          const got = RX.parseNum(ans.fix);
          if (got != null && near(got, -big, 0.001)) return `You found the mistake, but ${bigT} is farther left on the number line, so it is the smaller number.`;
          if (got != null && (near(got, small, 0.001) || near(got, big, 0.001))) return `You found the mistake. The greater number is still negative: type it with its minus sign.`;
          return `You found the mistake. Now type the greater of the two numbers with its minus sign.`;
        },
      },
    };
  });

  // ---------- Select all the true comparisons (ms). Hard: fractions, decimals, and absolute-value comparisons. ----------
  G.define('n4_msTrue', (r, o) => {
    const hard = !!o.hard;
    const q4 = () => r.pick([0.25, 0.5, 0.75]);
    const makeTrue = hard
      ? [
          () => {
            const w = r.int(0, 3);
            return `${mixedHtml(-(w + 0.75))} < ${dec(-(w + 0.5))}`;
          },
          () => {
            const w = r.int(0, 3);
            return `${dec(-(w + 0.6))} > ${mixedHtml(-(w + 0.75))}`;
          },
          () => {
            const [a, b] = drawDistinct(r, 2, () => r.int(2, 12));
            return `|${dec(-Math.max(a, b))}| > |${dec(Math.min(a, b))}|`;
          },
          () => {
            const a = r.int(1, 4) + q4();
            return `${mixedHtml(-a)} < ${dec(r.pick([0.2, 0.4, 0.6]))}`;
          },
          () => {
            const a = r.int(2, 9);
            return `|${dec(-a)}| > ${dec(-a - 3)}`;
          },
        ]
      : [
          () => `${dec(-r.int(1, 9))} < ${dec(r.int(0, 6))}`,
          () => {
            const [a, b] = drawDistinct(r, 2, () => r.int(1, 12));
            return `${dec(-Math.max(a, b))} < ${dec(-Math.min(a, b))}`;
          },
          () => `0 > ${dec(-r.int(1, 12))}`,
          () => {
            const w = r.int(0, 3);
            return `${dec(-(w + 0.5))} > ${dec(-(w + 1))}`;
          },
          () => {
            const [a, b] = drawDistinct(r, 2, () => r.int(1, 12));
            return `${dec(-Math.min(a, b))} > ${dec(-Math.max(a, b))}`;
          },
        ];
    const makeFalse = hard
      ? [
          () => {
            const w = r.int(0, 3);
            return { html: `${mixedHtml(-(w + 0.75))} > ${dec(-(w + 0.5))}`, why: `${mixedText(-(w + 0.75))} = ${dec(-(w + 0.75))}, which is farther left of 0 than ${dec(-(w + 0.5))}. So it is less, not greater.` };
          },
          () => {
            const [a, b] = drawDistinct(r, 2, () => r.int(2, 12));
            return { html: `|${dec(-Math.max(a, b))}| < |${dec(Math.min(a, b))}|`, why: `|${dec(-Math.max(a, b))}| = ${Math.max(a, b)}, which is greater than ${Math.min(a, b)}. Compare the distances, not the signs.` };
          },
          () => {
            const w = r.int(1, 3);
            return { html: `${dec(-(w + 0.2))} < ${mixedHtml(-(w + 0.5))}`, why: `${mixedText(-(w + 0.5))} = ${dec(-(w + 0.5))}, which is farther left than ${dec(-(w + 0.2))}. So ${dec(-(w + 0.2))} is the greater number.` };
          },
          () => {
            const a = r.int(2, 9);
            return { html: `|${dec(-a)}| < 0`, why: `An absolute value is a distance from 0, so it is never less than 0. |${dec(-a)}| = ${a}.` };
          },
        ]
      : [
          () => {
            const [a, b] = drawDistinct(r, 2, () => r.int(1, 12));
            return { html: `${dec(-Math.max(a, b))} > ${dec(-Math.min(a, b))}`, why: `${dec(-Math.max(a, b))} is farther left of 0 than ${dec(-Math.min(a, b))}, so it is less, not greater. The absolute values compare the other way.` };
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
    const key = (h) => h.replace(/<[^>]+>/g, '');
    trueIdx.forEach((i) => {
      const html = makeTrue[i]();
      if (!seen.has(key(html))) {
        seen.add(key(html));
        opts.push({ html, ok: true });
      }
    });
    falseIdx.forEach((i) => {
      const f = makeFalse[i]();
      if (!seen.has(key(f.html))) {
        seen.add(key(f.html));
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
      prompt: `<p>The wind-warning system only arms when every comparison in its settings is true. Select <b>all</b> the comparisons that are true.</p>${hard ? '<p class="muted">Some comparisons use absolute value. Find each absolute value first.</p>' : ''}`,
      options: sh.options,
      answers: sh.answers,
      hints: [
        hard ? 'Write fractions as decimals and replace each |…| with its distance from 0. Then compare positions on a number line.' : 'Picture each pair on a number line. The number on the left is less; the symbol opens toward the greater number.',
        'Every negative number is less than 0 and less than every positive number.',
        'When both numbers are negative, the one closer to 0 is greater. Do not compare the digits without the signs.',
      ],
      hintEs: hard
        ? 'Escribe las fracciones como decimales y cambia cada |…| por su distancia al 0. Luego compara las posiciones en la recta numérica.'
        : 'Imagina cada par en una recta numérica. El número de la izquierda es el menor; el símbolo se abre hacia el número mayor.',
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

  // ---------- Order four (hard: five) integers (seq) ----------
  G.define('n4_seqIntegers', (r, o) => {
    const hard = !!o.hard;
    const n = hard ? 5 : 4;
    let vals;
    if (hard) {
      // Two negatives that differ by 1 or 2, a third negative, 0 or a positive, and a value written as an opposite or absolute value.
      const m = r.int(12, 35);
      vals = [-m, -(m + r.pick([1, 2])), -r.int(2, 9), r.int(0, 20), r.int(3, 30) * (r.chance(0.5) ? 1 : -1)];
      vals = Array.from(new Set(vals));
      while (vals.length < 5) {
        const v = r.int(-40, 30);
        if (!vals.includes(v)) vals.push(v);
      }
    } else {
      vals = drawDistinct(r, 4, () => (r.chance(0.7) ? -r.int(1, 15) : r.int(0, 9)));
      while (vals.filter((v) => v < 0).length < 2) {
        const v = -r.int(10, 15);
        const k = vals.findIndex((x) => x >= 0);
        if (!vals.includes(v)) vals[k] = v;
      }
    }
    const asc = r.chance(0.6);
    const sensors = r.pickN(SENSORS, n);
    const ctxKind = r.pick(['temp', 'elev', 'money']);
    const u = ctxKind === 'temp' ? '°C' : ctxKind === 'elev' ? ' m' : ' dollars';
    // Hard: the last value is written as an opposite or an absolute value expression.
    const exprAt = hard ? 4 : -1;
    const valText = (v, i) => (i === exprAt ? (v >= 0 ? `−(${dec(-v)})` : `−|${dec(v)}|`) : dec(v));
    const uFor = (v) => (ctxKind === 'money' && Math.abs(v) === 1 ? ' dollar' : u);
    const label = (v, i) => (ctxKind === 'temp' ? `<b>${sensors[i]}</b>: ${valText(v, i)}${u}` : ctxKind === 'elev' ? `<b>Marker ${'ABCDE'[i]}</b>: ${valText(v, i)}${u}` : `<b>Day ${i + 1}</b>: ${valText(v, i)}${uFor(v)}`);
    const items = vals.map((v, i) => ({ html: label(v, i), rate: v }));
    const order = vals.map((_, i) => i).sort((x, y) => (asc ? vals[x] - vals[y] : vals[y] - vals[x]));
    const sorted = order.map((i) => vals[i]);
    const dirText = ctxKind === 'temp' ? (asc ? 'coldest (top) to warmest (bottom)' : 'warmest (top) to coldest (bottom)') : asc ? 'least (top) to greatest (bottom)' : 'greatest (top) to least (bottom)';
    const lo = Math.min(...vals, 0),
      hi = Math.max(...vals, 0);
    const lim = hard ? [Math.floor(lo / 10) * 10, Math.ceil(hi / 10) * 10 || 10, 1] : [-16, 10, 1];
    return {
      type: 'seq',
      skill: 'order',
      lesson: '7-4',
      title: asc ? 'Order from least to greatest' : 'Order from greatest to least',
      prompt: `<p>${ctxKind === 'temp' ? `${n === 5 ? 'Five' : 'Four'} sensors report temperatures.` : ctxKind === 'elev' ? `${n === 5 ? 'Five' : 'Four'} survey markers have these elevations (0 is sea level).` : `The supply account changed by these amounts over ${n === 5 ? 'five' : 'four'} days.`} Put them in order from <b>${dirText}</b>.</p>${hard ? '<p class="muted">One value is written as an expression. Find its value first.</p>' : ''}`,
      items,
      order,
      hints: [
        hard ? `First find the value of ${valText(vals[exprAt], exprAt)}. Then place every number on a number line: left is less, right is greater.` : 'Place every number on a number line. Numbers to the left are less; numbers to the right are greater.',
        `The negative numbers all come before 0 and before any positive number. ${asc ? 'The least number is the negative one farthest from 0.' : 'The greatest number is the positive one farthest from 0, or the one closest to 0 if all are negative.'}`,
        `Start with ${asc ? 'the least' : 'the greatest'}, ${dec(sorted[0])}, and keep moving ${asc ? 'right' : 'left'} along the number line.${hard ? ` Watch the two negatives that are close together: ${dec(-Math.max(...vals.slice(0, 2).map(Math.abs)))} is farther from 0.` : ''}`,
      ],
      hintEs: hard ? 'Primero halla el valor de la expresión. Luego coloca cada número en la recta numérica: a la izquierda es menor, a la derecha es mayor.' : 'Coloca cada número en una recta numérica. Los números de la izquierda son menores y los de la derecha son mayores.',
      solution: `<p>${hard ? `${valText(vals[exprAt], exprAt)} = ${dec(vals[exprAt])}. ` : ''}On a number line the values sit at ${vals
        .slice()
        .sort((x, y) => x - y)
        .map(dec)
        .join(', ')}. From ${dirText}: <b>${sorted.map(dec).join(', ')}</b>. Among negatives, the one with the larger absolute value is farther left, so it is less.</p>${line(vals, lim[0], lim[1], lim[2] * (lim[1] - lim[0] > 40 ? 5 : 1), 'Number line showing the values in order')}`,
      feedback: {
        correct: `Correct. ${sorted.map(dec).join(', ')} reads ${asc ? 'left to right' : 'right to left'} along the number line.`,
        wrong(ans) {
          return seqWhy(vals, order, ans, asc, (i) => valText(vals[i], i) + u);
        },
      },
    };
  });

  // ---------- Order a mixed list of integers, fractions, and decimals (seq; hard = 5 close values) ----------
  G.define('n4_seqMixed', (r, o) => {
    const hard = !!o.hard;
    const pool = hard ? [-3, -2.75, -2.6, -2.5, -2.25, -2, -1.8, -1.75, -1.5, -1.25, -1, -0.75, -0.6, -0.5, -0.25, 0, 0.25, 0.4, 0.5, 0.75, 1, 1.25, 1.5] : [-3, -2.5, -2, -1.5, -1, -0.5, 0, 0.5, 1, 1.5, 2, 2.5];
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
    // show about half the quarter/half values as fractions, the rest as decimals
    const shown = vals.map((v) => (!Number.isInteger(v) && [0.25, 0.5, 0.75].some((f) => near(Math.abs(v) % 1, f)) && r.chance(0.5) ? mixedHtml(v) : dec(v)));
    const items = vals.map((v, i) => ({ html: shown[i], rate: v }));
    const order = vals.map((_, i) => i).sort((x, y) => (asc ? vals[x] - vals[y] : vals[y] - vals[x]));
    const sortedText = order.map((i) => mixedText(vals[i]));
    const least = Math.min(...vals),
      most = Math.max(...vals);
    return {
      type: 'seq',
      skill: 'order',
      lesson: '7-4',
      title: hard ? 'Order five rational numbers' : 'Order the mixed readings',
      prompt: `<p>The ridge log lists ${n === 5 ? 'five' : 'four'} readings as integers, fractions, and decimals. Put them in order from <b>${asc ? 'least (top) to greatest (bottom)' : 'greatest (top) to least (bottom)'}</b>.</p>`,
      items,
      order,
      hints: [
        'Write every number the same way, as a decimal, so you can compare. A half is 0.5, a fourth is 0.25, three fourths is 0.75.',
        `As decimals: ${vals.map(dec).join(', ')}. Now place each one on a number line.`,
        `The least is ${dec(least)} and the greatest is ${dec(most)}. Place the others between them, left to right${asc ? '' : ', then read the list from the right end'}.`,
      ],
      hintEs: 'Escribe todos los números de la misma forma, como decimales, para poder compararlos. Un medio es 0.5, un cuarto es 0.25 y tres cuartos es 0.75.',
      solution: `<p>Rewrite the fractions as decimals: ${vals.map((v, i) => (shown[i] !== dec(v) ? `${shown[i]} = ${dec(v)}` : dec(v))).join(', ')}. On a number line, from ${asc ? 'least to greatest' : 'greatest to least'}: <b>${sortedText.join(', ')}</b>. For negative numbers, the larger absolute value is farther left and therefore less.</p>${line(vals, -3, 3, hard ? 0.2 : 0.25, 'Number line showing the readings in order')}`,
      feedback: {
        correct: 'Correct. Changing every number to a decimal makes them easy to place on one number line.',
        wrong(ans) {
          return seqWhy(vals, order, ans, asc, (i) => mixedText(vals[i]));
        },
      },
    };
  });

  // ---------- Who ordered correctly? (who). Hard: rational values in mixed forms, greatest to least. ----------
  G.define('n4_whoOrder', (r, o) => {
    const hard = !!o.hard;
    const [n1, n2, n3] = r.pickN(NAMES, 3);
    let vals;
    if (hard) {
      const w = r.int(1, 3);
      vals = [r.pick([0.25, 0.5, 0.75, 1.5]), -(w + 0.25), -(w + 0.6), -(r.int(w + 1, 5) + 0.5)];
    } else {
      const p = r.int(1, 4);
      const a = r.int(1, 5);
      const bHalf = r.pick([1.5, 2.5, 3.5, 4.5, 5.5]);
      let c = r.int(2, 9);
      while (c === a || near(c, bHalf)) c = r.int(2, 9);
      vals = [p, -a, -bHalf, -c];
    }
    const asc = !hard;
    const cmp = asc ? (x, y) => x - y : (x, y) => y - x;
    const show = (v) => (hard && [0.25, 0.5, 0.75].some((f) => near(Math.abs(v) % 1, f)) ? mixedText(v) : dec(v));
    const correct = vals.slice().sort(cmp);
    const byAbs = vals.slice().sort((x, y) => (asc ? Math.abs(x) - Math.abs(y) : Math.abs(y) - Math.abs(x)));
    const negs = vals.filter((v) => v < 0).sort((x, y) => (asc ? y - x : x - y));
    const pos = vals.filter((v) => v >= 0);
    const wrong2 = asc ? negs.concat(pos) : pos.concat(negs);
    const txt = (arr) => arr.map(show).join(', ');
    if (txt(byAbs) === txt(correct) || txt(wrong2) === txt(correct) || txt(byAbs) === txt(wrong2)) {
      return G.make('n4_whoOrder', RX.R.make(r.int(1, 1e6)), o);
    }
    const least = Math.min(...vals);
    const closeNeg = Math.max(...vals.filter((v) => v < 0));
    const opts = [
      { title: n1, html: txt(correct), ok: true },
      { title: n2, html: txt(byAbs), why: `${n2} ordered by distance from 0 (absolute value) and ignored the signs. Negative numbers are all less than positive numbers.` },
      { title: n3, html: txt(wrong2), why: `${n3} put the negatives in the wrong order. ${show(least)} is farther left of 0 than ${show(closeNeg)}, so ${show(least)} is the least.` },
    ];
    const sh = shuffleOptions(r, opts, 0);
    const dirWords = asc ? 'least to greatest' : 'greatest to least';
    return {
      type: 'who',
      skill: 'order',
      lesson: '7-4',
      title: 'Who ordered the readings?',
      prompt: `<p>Three navigators order the readings ${hl(vals.map(show).join(', '))} from <b>${dirWords}</b>.</p><p>Who is correct?</p>`,
      options: sh.options,
      answer: sh.answer,
      layout: 'cards',
      hints: [
        asc ? 'Least to greatest means left to right on a number line.' : 'Greatest to least means right to left on a number line. Write any fractions as decimals first.',
        asc ? `All the negative numbers come first. The positive number is last.` : `The positive number is first. All the negative numbers come after it.`,
        `Among the negatives, the one farthest from 0 is least. Check where each navigator put ${show(least)}.`,
      ],
      hintEs: asc ? 'De menor a mayor significa de izquierda a derecha en la recta numérica.' : 'De mayor a menor significa de derecha a izquierda en la recta numérica. Primero escribe las fracciones como decimales.',
      solution: `<p>${n1} is correct: <b>${txt(correct)}</b>.${hard ? ` As decimals: ${correct.map(dec).join(', ')}.` : ''} Negatives are less than positives. Among the negatives, the larger absolute value is farther left, so it is less. Ordering by absolute value alone, or flipping the order of the negatives, gives the wrong order.</p>${line(vals, -6, 3, 0.5, 'Number line showing the readings in order')}`,
      feedback: { correct: `Correct. ${txt(correct)} runs ${asc ? 'left to right' : 'right to left'} along the number line.`, wrong: whyOf(sh.options) },
    };
  });

  // ---------- Sort readings into ranges (sort). Hard: fraction boundaries and readings close to them. ----------
  G.define('n4_sortRange', (r, o) => {
    const hard = !!o.hard;
    const c = hard ? r.pick([1.5, 2.25, 2.5, 3.75]) : r.pick([2, 3, 4, 5]);
    const kind = r.pick(['temp', 'depth']);
    const unit = kind === 'temp' ? '°C' : ' m';
    const step = hard ? 0.25 : 0.5;
    const pool = [];
    for (let v = -6; v <= 6 + 1e-9; v += step) {
      const x = Math.round(v * 100) / 100;
      if (Math.abs(Math.abs(x) - c) > 0.001 && (!hard || Math.abs(Math.abs(x) - c) <= 1.5)) pool.push(x);
    }
    const low = pool.filter((v) => v < -c),
      mid = pool.filter((v) => v > -c && v < c),
      high = pool.filter((v) => v > c);
    const chosen = r.pickN(low, 2).concat(r.pickN(mid, 2), r.pickN(high, 2));
    // Hard: make sure a negative close to the boundary sits in the middle bin (the usual mistake).
    if (hard && !chosen.slice(2, 4).some((v) => v < 0)) chosen[2] = -(c - 0.25);
    const binOf = (v) => (v < -c ? 0 : v < c ? 1 : 2);
    const showV = (v) => (hard && [0.25, 0.75].some((f) => near(Math.abs(v) % 1, f)) ? mixedText(v) : dec(v));
    const cT = hard ? mixedText(c) : dec(c);
    const ncT = hard ? mixedText(-c) : dec(-c);
    const items = r.shuffle(Array.from(new Set(chosen)).map((v) => ({ html: showV(v) + unit, bin: binOf(v), v })));
    const bins = [`Less than ${ncT}${unit}`, `Between ${ncT}${unit} and ${cT}${unit}`, `Greater than ${cT}${unit}`];
    return {
      type: 'sort',
      skill: 'order',
      lesson: '7-4',
      title: 'Sort the readings by range',
      prompt: `<p>${kind === 'temp' ? 'The heater controller groups temperatures into three ranges.' : 'The sounder groups ice-thickness readings (0 is the shelf line) into three ranges.'} Sort each reading into its range.</p>${hard ? '' : `<p class="muted">"Less than ${ncT}" means to the left of ${ncT} on a number line.</p>`}`,
      bins,
      items: items.map(({ html, bin }) => ({ html, bin })),
      hints: [
        `Picture a number line with ${ncT} and ${cT} marked. Each reading falls left of ${ncT}, between them, or right of ${cT}.`,
        hard ? `Write the boundaries as decimals: ${dec(-c)} and ${dec(c)}. A negative reading is less than ${dec(-c)} only if it is farther from 0 than ${dec(c)}.` : `A negative reading is "less than ${ncT}" only if it is farther from 0 than ${c} is.`,
        `Negative numbers close to 0 are greater than ${ncT}, so they belong in the middle range.`,
      ],
      hintEs: `Imagina una recta numérica con ${ncT} y ${cT} marcados. Cada lectura queda a la izquierda de ${ncT}, entre los dos, o a la derecha de ${cT}.`,
      solution: `<p>Less than ${ncT}: <b>${chosen
        .filter((v) => binOf(v) === 0)
        .map(showV)
        .join(', ')}</b>. Between ${ncT} and ${cT}: <b>${chosen
        .filter((v) => binOf(v) === 1)
        .map(showV)
        .join(', ')}</b>. Greater than ${cT}: <b>${chosen
        .filter((v) => binOf(v) === 2)
        .map(showV)
        .join(', ')}</b>. A negative number is less than ${ncT} only when its absolute value is more than ${cT}.</p>${line(chosen, -6, 6, 0.5, 'Number line showing the six readings')}`,
      feedback: {
        correct: 'Correct. Left of the lower boundary, between, or right of the upper boundary.',
        wrong(ans, d) {
          const i = (d.wrong || [])[0];
          const it = items[i];
          if (!it) return 'At least one reading is in the wrong range. Place it on a number line first.';
          const v = it.v;
          if (v < 0 && Math.abs(v) < c) return `${it.html} is negative, but it is closer to 0 than ${ncT} is. That puts it between ${ncT} and ${cT}.`;
          if (v < -c) return `${it.html} is farther left than ${ncT} on the number line, so it is less than ${ncT}.`;
          if (v > c) return `${it.html} is to the right of ${cT}, so it is greater than ${cT}.`;
          return `${it.html} is between ${ncT} and ${cT}. Compare it with both boundaries on a number line.`;
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
  const { G, V, shuffleOptions, NAMES, parseNum, near } = RX;
  const { dec, pair, quad, mixedText } = RX.N7;
  const hl = V.hl;
  const whyOf = (opts) => (ans) => (opts[ans] && opts[ans].why) || 'Not that one. Read the sign of x (left or right) and the sign of y (down or up).';

  const MARKERS = ['fuel cache', 'weather mast', 'ice-core site', 'radio relay', 'snow shelter', 'sled depot', 'penguin blind', 'landing flag'];
  const LIM = 5;
  const HLIM = 8; // Level 2 grids
  const PLANE = (o) => V.graph(Object.assign({ xMin: -LIM, xMax: LIM, yMin: -LIM, yMax: LIM, size: 260 }, o));
  /** A nonzero coordinate in [-lim, lim]. */
  const nz = (r, lim) => {
    const m = r.int(1, lim || LIM);
    return r.chance(0.5) ? -m : m;
  };
  /** Level 2: a nonzero rational coordinate with a half or quarter part. */
  const nzR = (r) => {
    const m = r.int(0, 6) + r.pick([0.5, 0.25, 0.75, 0.5]);
    return r.chance(0.5) ? -m : m;
  };
  /** Ordered pair with fractions shown as mixed numbers (−2 1/4) when they are quarters. */
  const pairM = (x, y) => `(${mixedText(x)}, ${mixedText(y)})`;
  const quadName = (x, y) => {
    const q = quad(x, y);
    return q.length <= 3 ? 'Quadrant ' + q : 'the ' + q;
  };
  const moveText = (x, y) => `${mixedText(Math.abs(x))} ${x < 0 ? 'left' : 'right'}, then ${mixedText(Math.abs(y))} ${y < 0 ? 'down' : 'up'}`;
  const samePt = (a, b) => a[0] === b[0] && a[1] === b[1];
  /** Draw n distinct points with nonzero coordinates, no two sharing both a quadrant and a swapped twin. */
  const drawPoints = (r, n, lim) => {
    const pts = [];
    let guard = 0;
    while (pts.length < n && guard++ < 200) {
      const p = [nz(r, lim), nz(r, lim)];
      if (pts.some((q) => samePt(p, q) || samePt([p[1], p[0]], q))) continue;
      pts.push(p);
    }
    return pts;
  };
  const reflect = (p, axis) => (axis === 'x' ? [p[0], -p[1]] : [-p[0], p[1]]);
  const axisRule = (axis) => (axis === 'x' ? 'Reflecting across the x-axis keeps x the same and changes the sign of y.' : 'Reflecting across the y-axis keeps y the same and changes the sign of x.');
  const axisRuleEs = (axis) => (axis === 'x' ? 'Al reflejar sobre el eje x, x queda igual y cambia el signo de y.' : 'Al reflejar sobre el eje y, y queda igual y cambia el signo de x.');

  // ---------- Plot markers in four quadrants (plot). Hard: four markers on a larger grid, one on an axis. ----------
  G.define('n5_plotPoints', (r, o) => {
    const hard = !!o.hard;
    const lim = hard ? HLIM : LIM;
    const pts = drawPoints(r, 3, lim);
    if (pts.every((p) => quad(p[0], p[1]) === quad(pts[0][0], pts[0][1]))) pts[2] = [-pts[2][0], pts[2][1]];
    if (hard) {
      let ax;
      do ax = r.chance(0.5) ? [0, nz(r, lim)] : [nz(r, lim), 0];
      while (pts.some((p) => samePt(p, ax)));
      pts.splice(r.int(0, 3), 0, ax);
    }
    const n = pts.length;
    const names = r.pickN(MARKERS, n);
    const name = r.pick(NAMES);
    return {
      type: 'plot',
      skill: 'plot-points',
      lesson: '7-5',
      title: hard ? 'Plot four survey markers' : 'Plot the survey markers',
      prompt: `<p>${name} must plot ${hard ? 'four' : 'three'} markers on the survey grid. The station is at the origin, (0, 0).</p><ul>${pts.map((p, i) => `<li>${names[i]}: ${hl(pair(p[0], p[1]))}</li>`).join('')}</ul><p>Plot all ${hard ? 'four' : 'three'} points.</p>${hard ? '' : '<p class="muted">Click a grid point to place or remove a point.</p>'}`,
      xLabel: 'x',
      yLabel: 'y',
      xMin: -lim,
      xMax: lim,
      yMin: -lim,
      yMax: lim,
      points: pts,
      count: n,
      hints: [
        'An ordered pair is (x, y). Start at the origin. Move left or right for x first, then up or down for y.',
        `A negative x means move left. A negative y means move down. For ${pair(pts[0][0], pts[0][1])}: ${moveText(pts[0][0], pts[0][1])}.`,
        hard ? 'A 0 coordinate means no move in that direction, so that point lands on an axis, not in a quadrant.' : 'Plot the other two the same way: x first, then y. Check each sign before you click.',
      ],
      hintEs: 'Un par ordenado es (x, y). Empieza en el origen. Primero muévete a la izquierda o a la derecha según x; luego arriba o abajo según y.',
      solution: `<p>${pts.map((p, i) => `${names[i]} at <b>${pair(p[0], p[1])}</b>: ${moveText(p[0], p[1])}, so it lands ${quad(p[0], p[1]).length <= 3 ? 'in ' : 'on '}${quadName(p[0], p[1])}.`).join(' ')} The sign of x tells left or right; the sign of y tells down or up.</p>${PLANE({ xMin: -lim, xMax: lim, yMin: -lim, yMax: lim, series: [{ points: pts, labels: pts.map((p) => pair(p[0], p[1])) }], aria: 'Coordinate plane with the markers plotted' })}`,
      feedback: {
        correct: 'Correct. Left or right first for x, then up or down for y.',
        wrong(ans, d) {
          const extra = d.extra || [];
          if (extra.length) {
            const e = extra[0];
            const swapped = pts.find((p) => p[0] === e[1] && p[1] === e[0]);
            if (swapped) return `${pair(e[0], e[1])} has the coordinates swapped. In ${pair(swapped[0], swapped[1])}, the first number (x) moves left or right and the second (y) moves up or down.`;
            const signX = pts.find((p) => p[0] === -e[0] && p[1] === e[1] && p[0] !== 0);
            if (signX) return `${pair(e[0], e[1])} is on the wrong side of the y-axis. The x-coordinate ${dec(signX[0])} means move ${signX[0] < 0 ? 'left' : 'right'}.`;
            const signY = pts.find((p) => p[0] === e[0] && p[1] === -e[1] && p[1] !== 0);
            if (signY) return `${pair(e[0], e[1])} is on the wrong side of the x-axis. The y-coordinate ${dec(signY[1])} means move ${signY[1] < 0 ? 'down' : 'up'}.`;
            return `${pair(e[0], e[1])} is not one of the markers. Check each sign: negative x is left, negative y is down.`;
          }
          const m = (d.missing || [])[0];
          return m ? `You still need ${pair(m[0], m[1])}. Start at the origin and move x first, then y.` : 'Check each point against its ordered pair.';
        },
      },
    };
  });

  // ---------- Sort points into quadrants or onto an axis (sort). Hard: rational coordinates, seven items. ----------
  G.define('n5_quadrantSort', (r, o) => {
    const hard = !!o.hard;
    const c = hard ? () => Math.abs(nzR(r)) : () => r.int(1, 6);
    const pts = [];
    pts.push({ p: [c(), c()], bin: 0 }, { p: [-c(), c()], bin: 1 }, { p: [-c(), -c()], bin: 2 }, { p: [c(), -c()], bin: 3 });
    const a = c() * (r.chance(0.5) ? -1 : 1);
    pts.push(r.chance(0.5) ? { p: [a, 0], bin: 4 } : { p: [0, a], bin: 4 });
    const extras = hard ? 2 : 1;
    for (let k = 0; k < extras; k++) {
      const extraBin = hard && k === 1 ? 4 : r.int(0, 3);
      let extra;
      let guard = 0;
      do {
        if (extraBin === 4) extra = r.chance(0.5) ? [0, -c()] : [-c(), 0];
        else {
          const sx = extraBin === 0 || extraBin === 3 ? 1 : -1;
          const sy = extraBin <= 1 ? 1 : -1;
          extra = [sx * c(), sy * c()];
        }
      } while (pts.some((it) => samePt(it.p, extra)) && guard++ < 50);
      if (!pts.some((it) => samePt(it.p, extra))) pts.push({ p: extra, bin: extraBin });
    }
    const show = (p) => (hard ? pairM(p[0], p[1]) : pair(p[0], p[1]));
    const items = r.shuffle(pts.map((it) => ({ html: show(it.p), bin: it.bin, p: it.p })));
    return {
      type: 'sort',
      skill: 'quadrants',
      lesson: '7-5',
      title: hard ? 'Sort the markers (rational coordinates)' : 'Sort the markers by quadrant',
      prompt: hard
        ? `<p>The survey grid is split into four quadrants, numbered I, II, III, and IV counterclockwise from the upper right. These markers have fraction and decimal coordinates. Sort each marker by where it sits.</p>`
        : `<p>The survey grid is split into four quadrants, numbered I, II, III, and IV counterclockwise from the upper right. Sort each marker by where it sits.</p><p class="muted">A point with a 0 coordinate sits on an axis, not in a quadrant.</p>`,
      bins: ['Quadrant I', 'Quadrant II', 'Quadrant III', 'Quadrant IV', 'On an axis'],
      items: items.map(({ html, bin }) => ({ html, bin })),
      hints: [
        'Look at the signs. Quadrant I is (+, +). Quadrant II is (−, +). Quadrant III is (−, −). Quadrant IV is (+, −).',
        'If x is 0, the point is on the y-axis. If y is 0, the point is on the x-axis. Those points are in no quadrant.',
        hard ? 'The size of a fraction does not matter here. Only the signs (and any 0) decide where the point sits.' : `For example, a point with two positive coordinates is in Quadrant I. Check the signs of every pair the same way.`,
      ],
      hintEs: 'Fíjate en los signos. El cuadrante I es (+, +). El cuadrante II es (−, +). El cuadrante III es (−, −). El cuadrante IV es (+, −).',
      solution: `<p>Signs decide the quadrant: (+, +) → I, (−, +) → II, (−, −) → III, (+, −) → IV.</p><ul>${pts.map((it) => `<li>${show(it.p)} → <b>${it.bin === 4 ? 'on the ' + quad(it.p[0], it.p[1]) : 'Quadrant ' + quad(it.p[0], it.p[1])}</b></li>`).join('')}</ul>${PLANE({
        xMin: -7,
        xMax: 7,
        yMin: -7,
        yMax: 7,
        series: [{ points: pts.map((it) => it.p), labels: pts.map((it) => show(it.p)) }],
        aria: 'Coordinate plane showing every marker in its quadrant or on an axis',
      })}`,
      feedback: {
        correct: 'Correct. The two signs name the quadrant, and a 0 puts the point on an axis.',
        wrong(ans, d) {
          const i = (d.wrong || [])[0];
          const it = items[i];
          if (!it) return 'At least one marker is in the wrong place. Check the signs of x and y.';
          const [x, y] = it.p;
          if (it.bin === 4) return `${it.html} has a coordinate of 0, so it sits on an axis. Points on an axis are in no quadrant.`;
          if (ans && ans[i] != null && ans[i] !== 4 && quad(y, x) === ['I', 'II', 'III', 'IV'][ans[i]]) return `${it.html}: you read the signs in the wrong order. The first coordinate (x) is left or right; the second (y) is up or down.`;
          return `${it.html}: x is ${x < 0 ? 'negative (left)' : 'positive (right)'} and y is ${y < 0 ? 'negative (down)' : 'positive (up)'}. Which quadrant has that sign pattern?`;
        },
      },
    };
  });

  // ---------- Read the coordinates of plotted points (blanks). Hard: two points on a larger grid labeled every 2, one on an axis. ----------
  G.define('n5_readCoords', (r, o) => {
    const hard = !!o.hard;
    const marker = r.pick(MARKERS);
    const name = r.pick(NAMES);
    if (!hard) {
      const p = [nz(r), nz(r)];
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
          `P is ${Math.abs(p[1])} units ${p[1] < 0 ? 'below' : 'above'} the x-axis, so y is ${p[1] < 0 ? 'negative' : 'positive'}. Write both numbers with their signs.`,
        ],
        hintEs: 'Empieza en el origen. ¿Qué tan lejos a la izquierda o a la derecha está P? Eso es x. Luego, ¿qué tan arriba o abajo? Eso es y.',
        solution: `<p>From the origin, P is ${moveText(p[0], p[1])}. So P = <b>${pair(p[0], p[1])}</b>. Left means a negative x; down means a negative y. P is in ${quadName(p[0], p[1])}.</p>`,
        feedback: {
          correct: `Correct. P = ${pair(p[0], p[1])}: ${moveText(p[0], p[1])}.`,
          wrong(ans, d) {
            const gx = parseNum(ans[0]),
              gy = parseNum(ans[1]);
            if (gx === p[1] && gy === p[0]) return 'You swapped the coordinates. The first number is the left-right position (x). The second is the up-down position (y).';
            if (gx === -p[0] && gy === p[1]) return `The x-coordinate has the wrong sign. P is to the ${p[0] < 0 ? 'left' : 'right'} of the y-axis, so x is ${p[0] < 0 ? 'negative' : 'positive'}.`;
            if (gx === p[0] && gy === -p[1]) return `The y-coordinate has the wrong sign. P is ${p[1] < 0 ? 'below' : 'above'} the x-axis, so y is ${p[1] < 0 ? 'negative' : 'positive'}.`;
            const i = (d.wrong || [])[0];
            return i === 0 ? 'Check x: count the units left or right from the y-axis, and use a minus sign for left.' : 'Check y: count the units up or down from the x-axis, and use a minus sign for down.';
          },
        },
      };
    }
    // Hard: P in a quadrant with odd coordinates (between labels), Q on an axis.
    const odd = () => r.pick([1, 3, 5, 7]) * (r.chance(0.5) ? -1 : 1);
    const p = [odd(), odd()];
    const qv = r.int(2, HLIM) * (r.chance(0.5) ? -1 : 1);
    const q = r.chance(0.5) ? [qv, 0] : [0, qv];
    const vals = [p[0], p[1], q[0], q[1]];
    return {
      type: 'blanks',
      skill: 'plot-points',
      lesson: '7-5',
      title: 'Read two ordered pairs',
      prompt: `<p>${name} spots the ${marker} (P) and a flag (Q) on the survey grid. Only every second grid line is labeled.</p>${PLANE({ xMin: -HLIM, xMax: HLIM, yMin: -HLIM, yMax: HLIM, xLabelEvery: 2, yLabelEvery: 2, size: 300, series: [{ points: [p, q], labels: ['P', 'Q'] }], aria: `Coordinate plane from negative 8 to 8 with point P at ${pair(p[0], p[1])} and point Q at ${pair(q[0], q[1])}` })}<p>Write the ordered pairs for P and Q.</p>`,
      template: 'P = ({0}, {1})   and   Q = ({2}, {3})',
      fields: [
        { label: 'P x', answer: p[0], width: 'xs' },
        { label: 'P y', answer: p[1], width: 'xs' },
        { label: 'Q x', answer: q[0], width: 'xs' },
        { label: 'Q y', answer: q[1], width: 'xs' },
      ],
      hints: [
        'Only even numbers are labeled. A point between two labeled lines is on the odd number between them.',
        `P is between the labels ${dec(Math.sign(p[0]) * (Math.abs(p[0]) - 1))} and ${dec(Math.sign(p[0]) * (Math.abs(p[0]) + 1))} across, so its x-coordinate is the odd number between them.`,
        `Q sits on ${q[0] === 0 ? 'the y-axis, so one coordinate is 0' : 'the x-axis, so one coordinate is 0'}. Read its other coordinate from the labels.`,
      ],
      hintEs: 'Solo los números pares tienen etiqueta. Un punto entre dos líneas con etiqueta está en el número impar que hay entre ellas.',
      solution: `<p>P is ${moveText(p[0], p[1])} from the origin: <b>P = ${pair(p[0], p[1])}</b>. Q is on the ${quad(q[0], q[1])}: <b>Q = ${pair(q[0], q[1])}</b>. A point on the ${quad(q[0], q[1])} has ${q[0] === 0 ? 'x' : 'y'} = 0.</p>`,
      feedback: {
        correct: `Correct. P = ${pair(p[0], p[1])} and Q = ${pair(q[0], q[1])}.`,
        wrong(ans, d) {
          const g = (ans || []).map(parseNum);
          if (g[0] === p[1] && g[1] === p[0]) return 'P: you swapped the coordinates. The first number is the left-right position (x).';
          if (g[2] === q[1] && g[3] === q[0]) return 'Q: you swapped the coordinates. A point on the x-axis has y = 0; a point on the y-axis has x = 0.';
          const w = d.wrong || [];
          if (w.some((i) => i < 2 && g[i] != null && Math.abs(Math.abs(g[i]) - Math.abs(vals[i])) === 1)) return 'P is one unit off. Count from the nearest labeled line: P sits on the odd number between two labels.';
          if (w.some((i) => g[i] != null && near(g[i], -vals[i], 0.001) && vals[i] !== 0)) return 'A sign is off. Left of the y-axis or below the x-axis means negative.';
          return w[0] < 2 ? 'Check P: count from the origin, left or right first, then up or down.' : 'Check Q: it is on an axis, so one coordinate is 0.';
        },
      },
    };
  });

  // ---------- Which quadrant holds this point? (mc). Hard: rational coordinates after a reflection. ----------
  G.define('n5_quadrantMc', (r, o) => {
    const hard = !!o.hard;
    const p = hard ? [nzR(r), nzR(r)] : [nz(r), nz(r)];
    const axis = r.pick(['x', 'y']);
    const t = hard ? reflect(p, axis) : p; // the point whose quadrant is asked for
    const marker = r.pick(MARKERS);
    const correct = quad(t[0], t[1]);
    const show = (x, y) => (hard ? pairM(x, y) : pair(x, y));
    const whys = {};
    if (hard) {
      whys[quad(p[0], p[1])] = `That is the quadrant of the original point. The reflection moves it to the other side of the ${axis}-axis.`;
      const other = reflect(p, axis === 'x' ? 'y' : 'x');
      whys[quad(other[0], other[1])] = `That is where the point lands if you reflect across the ${axis === 'x' ? 'y' : 'x'}-axis. ${axisRule(axis)}`;
      whys[quad(-p[0], -p[1])] = `That changes both signs. Reflecting across one axis changes only one sign.`;
    } else {
      whys[quad(-p[0], p[1])] = `That is where the point would be if x had the other sign. x = ${dec(p[0])} means move ${p[0] < 0 ? 'left' : 'right'}.`;
      whys[quad(p[0], -p[1])] = `That is where the point would be if y had the other sign. y = ${dec(p[1])} means move ${p[1] < 0 ? 'down' : 'up'}.`;
      whys[quad(p[1], p[0])] = `That is the quadrant of ${pair(p[1], p[0])}, the swapped pair. The first coordinate is x (left-right), the second is y (up-down).`;
      whys[quad(-p[0], -p[1])] = `That is the quadrant of ${pair(-p[0], -p[1])}, both signs flipped. Read each sign carefully.`;
    }
    const opts = ['I', 'II', 'III', 'IV'].map((qn) => (qn === correct ? { html: `Quadrant ${qn}`, ok: true } : { html: `Quadrant ${qn}`, why: whys[qn] || `Quadrant ${qn} has a different sign pattern.` }));
    const sh = shuffleOptions(r, opts, ['I', 'II', 'III', 'IV'].indexOf(correct));
    return {
      type: 'mc',
      skill: 'quadrants',
      lesson: '7-5',
      title: hard ? 'Quadrant after a reflection' : 'Name the quadrant',
      prompt: hard
        ? `<p>The ${marker} is at ${hl(show(p[0], p[1]))} on the survey grid. Its mirror twin is the reflection across the <b>${axis}-axis</b>.</p><p>Which quadrant holds the mirror twin?</p>`
        : `<p>The ${marker} is at ${hl(pair(p[0], p[1]))} on the survey grid.</p><p>Which quadrant holds this point?</p>`,
      options: sh.options,
      answer: sh.answer,
      hints: hard
        ? [`First find the twin. ${axisRule(axis)}`, `The twin is ${show(t[0], t[1])}. Now look only at its signs.`, `x is ${t[0] < 0 ? 'negative (left)' : 'positive (right)'} and y is ${t[1] < 0 ? 'negative (down)' : 'positive (up)'}. Which quadrant has that sign pattern?`]
        : [
            'The signs of the two coordinates decide the quadrant. Quadrant I is upper right (+, +). The numbers go counterclockwise.',
            `x = ${dec(p[0])} is ${p[0] < 0 ? 'negative, so the point is left of the y-axis' : 'positive, so the point is right of the y-axis'}. y = ${dec(p[1])} is ${p[1] < 0 ? 'negative, so it is below the x-axis' : 'positive, so it is above the x-axis'}.`,
            `Find the corner of the plane that is ${p[0] < 0 ? 'left' : 'right'} and ${p[1] < 0 ? 'below' : 'above'}. Count I, II, III, IV counterclockwise from the upper right.`,
          ],
      hintEs: hard ? `Primero halla el punto reflejado. ${axisRuleEs(axis)}` : 'Los signos de las dos coordenadas deciden el cuadrante. El cuadrante I está arriba a la derecha (+, +). Los números van en sentido contrario a las agujas del reloj.',
      solution: `<p>${hard ? `${axisRule(axis)} ${show(p[0], p[1])} → ${show(t[0], t[1])}. ` : ''}${show(t[0], t[1])} is ${moveText(t[0], t[1])} from the origin. That is the ${t[1] < 0 ? 'lower' : 'upper'} ${t[0] < 0 ? 'left' : 'right'} region: <b>Quadrant ${correct}</b>. Sign pattern: (${t[0] < 0 ? '−' : '+'}, ${t[1] < 0 ? '−' : '+'}).</p>`,
      feedback: { correct: `Correct. (${t[0] < 0 ? '−' : '+'}, ${t[1] < 0 ? '−' : '+'}) is the sign pattern for Quadrant ${correct}.`, wrong: whyOf(sh.options) },
    };
  });

  // ---------- Plot the reflection of a given point (plot). Hard: plot both mirror twins on a larger grid. ----------
  G.define('n5_reflectPlot', (r, o) => {
    const hard = !!o.hard;
    const lim = hard ? HLIM : LIM;
    const p = [nz(r, lim), nz(r, lim)];
    const axis = r.pick(['x', 'y']);
    const q = reflect(p, axis);
    const marker = r.pick(MARKERS);
    const other = reflect(p, axis === 'x' ? 'y' : 'x');
    const targets = hard ? [q, other] : [q];
    return {
      type: 'plot',
      skill: 'reflect',
      lesson: '7-5',
      title: hard ? 'Reflect across each axis' : `Reflect across the ${axis}-axis`,
      prompt: hard
        ? `<p>The ${marker} at ${hl(pair(p[0], p[1]))} has two mirror twins: one across the <b>x-axis</b> and one across the <b>y-axis</b>. The original point is drawn in gray.</p><p>Plot both mirror twins.</p>`
        : `<p>The ${marker} at ${hl(pair(p[0], p[1]))} has a mirror twin on the other side of the <b>${axis}-axis</b>. The original point is drawn in gray.</p><p>Plot the reflection of ${hl(pair(p[0], p[1]))} across the ${axis}-axis.</p>`,
      xLabel: 'x',
      yLabel: 'y',
      xMin: -lim,
      xMax: lim,
      yMin: -lim,
      yMax: lim,
      given: [p],
      givenLabels: [pair(p[0], p[1])],
      points: targets,
      count: targets.length,
      hints: hard
        ? ['A reflection is a mirror image. Each axis is a mirror. Each twin is the same distance from its mirror, on the other side.', `${axisRule('x')} ${axisRule('y')}`, `For the x-axis twin, keep x = ${dec(p[0])}. For the y-axis twin, keep y = ${dec(p[1])}. Change the sign of the other coordinate each time.`]
        : [`A reflection is a mirror image. The ${axis}-axis is the mirror. The new point is the same distance from the ${axis}-axis, on the other side.`, axisRule(axis), `Start with ${pair(p[0], p[1])}. ${axis === 'x' ? `Keep x = ${dec(p[0])} and change the sign of y.` : `Keep y = ${dec(p[1])} and change the sign of x.`}`],
      hintEs: hard ? 'Una reflexión es como un reflejo en un espejo. Cada eje es un espejo. Cada punto reflejado está a la misma distancia de su espejo, pero del otro lado.' : `Una reflexión es como un reflejo en un espejo. El eje ${axis} es el espejo. El punto nuevo está a la misma distancia del eje ${axis}, pero del otro lado.`,
      solution: hard
        ? `<p>Across the x-axis: ${pair(p[0], p[1])} → <b>${pair(...reflect(p, 'x'))}</b> (y changes sign). Across the y-axis: ${pair(p[0], p[1])} → <b>${pair(...reflect(p, 'y'))}</b> (x changes sign). Each twin changes exactly one sign.</p>` +
          PLANE({ xMin: -lim, xMax: lim, yMin: -lim, yMax: lim, series: [{ points: [p], color: '#5B6B7A', labels: [pair(p[0], p[1])] }, { points: targets, labels: targets.map((t) => pair(t[0], t[1])) }], aria: `Coordinate plane showing ${pair(p[0], p[1])} and both of its reflections` })
        : `<p>${pair(p[0], p[1])} is ${Math.abs(axis === 'x' ? p[1] : p[0])} units from the ${axis}-axis. Its mirror image is ${Math.abs(axis === 'x' ? p[1] : p[0])} units on the other side: <b>${pair(q[0], q[1])}</b>. ${axisRule(axis)}</p>${PLANE({
            series: [
              { points: [p], color: '#5B6B7A', labels: [pair(p[0], p[1])] },
              { points: [q], labels: [pair(q[0], q[1])] },
            ],
            aria: `Coordinate plane showing ${pair(p[0], p[1])} and its reflection ${pair(q[0], q[1])} across the ${axis}-axis`,
          })}`,
      feedback: {
        correct: hard ? `Correct. ${pair(...reflect(p, 'x'))} and ${pair(...reflect(p, 'y'))} are the mirror twins across the x-axis and the y-axis.` : `Correct. ${pair(q[0], q[1])} is the mirror image of ${pair(p[0], p[1])} across the ${axis}-axis.`,
        wrong(ans, d) {
          const e = (d.extra || [])[0];
          if (!e) return hard ? 'Place two points: one mirror twin across each axis.' : `Place one point: the mirror image of ${pair(p[0], p[1])} across the ${axis}-axis.`;
          if (samePt(e, [-p[0], -p[1]])) return hard ? `${pair(e[0], e[1])} changes both signs. That is a reflection across both axes, one after the other. Each twin here changes only one sign.` : `You flipped both signs. Only one coordinate changes when you reflect across one axis. ${axisRule(axis)}`;
          if (samePt(e, p)) return `That is the original point. A reflection sits on the other side of the mirror axis.`;
          if (samePt(e, [p[1], p[0]]) || samePt(e, [-p[1], p[0]]) || samePt(e, [p[1], -p[0]])) return 'A reflection never swaps x and y. Keep each coordinate in its place and change one sign.';
          if (!hard && samePt(e, other)) return `That is the reflection across the ${axis === 'x' ? 'y' : 'x'}-axis. The mirror here is the ${axis}-axis, so ${axis === 'x' ? 'y' : 'x'} changes sign, not ${axis}.`;
          return `${pair(e[0], e[1])} is not a mirror image. ${hard ? axisRule('x') + ' ' + axisRule('y') : axisRule(axis)}`;
        },
      },
    };
  });

  // ---------- Write the reflected coordinates (blanks; hard = rational point reflected across both axes) ----------
  G.define('n5_reflectBlanks', (r, o) => {
    const hard = !!o.hard;
    const p = hard ? [nzR(r), nzR(r)] : [nz(r), nz(r)];
    const axis = r.pick(['x', 'y']);
    const first = reflect(p, axis);
    const second = axis === 'x' ? 'y' : 'x';
    const q = hard ? reflect(first, second) : first;
    const marker = r.pick(MARKERS);
    const name = r.pick(NAMES);
    const show = (x, y) => (hard ? pairM(x, y) : pair(x, y));
    return {
      type: 'blanks',
      skill: 'reflect',
      lesson: '7-5',
      title: hard ? 'Reflect across both axes' : `Reflect across the ${axis}-axis`,
      prompt: hard
        ? `<p>${name} reflects the ${marker} at ${hl(show(p[0], p[1]))} across the <b>${axis}-axis</b>, then reflects the new point across the <b>${second}-axis</b>.</p><p>Write the coordinates of the final point.</p><p class="muted">Type decimals or fractions like -9/4.</p>`
        : `<p>${name} reflects the ${marker} at ${hl(pair(p[0], p[1]))} across the <b>${axis}-axis</b>.</p><p>Write the coordinates of the reflected point.</p><p class="muted">Type a negative coordinate with a minus sign, like -3.</p>`,
      template: '({0}, {1})',
      fields: [
        { label: 'x', answer: q[0], width: 'xs' },
        { label: 'y', answer: q[1], width: 'xs' },
      ],
      hints: [
        `A reflection across an axis changes the sign of one coordinate. ${axisRule(axis)}`,
        hard ? `After the first reflection, ${show(p[0], p[1])} becomes ${show(first[0], first[1])}. Now reflect that point across the ${second}-axis.` : `Across the ${axis}-axis, ${dec(axis === 'x' ? p[0] : p[1])} stays as the ${axis}-coordinate.`,
        hard ? `${axisRule(second)} Change the sign of ${second} in ${show(first[0], first[1])}.` : `Only the ${axis === 'x' ? 'y' : 'x'}-coordinate changes sign. Write the opposite of ${dec(axis === 'x' ? p[1] : p[0])}.`,
      ],
      hintEs: `Una reflexión sobre un eje cambia el signo de una coordenada. ${axisRuleEs(axis)}`,
      solution: hard
        ? `<p>Across the ${axis}-axis: ${show(p[0], p[1])} → ${show(first[0], first[1])} (${axis === 'x' ? 'y' : 'x'} changes sign). Then across the ${second}-axis: ${show(first[0], first[1])} → <b>${show(q[0], q[1])}</b> = (${dec(q[0])}, ${dec(q[1])}). After both reflections, both signs have changed.</p>`
        : `<p>${axisRule(axis)} ${pair(p[0], p[1])} → <b>${pair(q[0], q[1])}</b>. Both points are ${Math.abs(axis === 'x' ? p[1] : p[0])} units from the ${axis}-axis, on opposite sides.</p>${PLANE({
            series: [
              { points: [p], color: '#5B6B7A', labels: [pair(p[0], p[1])] },
              { points: [q], labels: [pair(q[0], q[1])] },
            ],
            aria: `Coordinate plane showing ${pair(p[0], p[1])} and its reflection ${pair(q[0], q[1])}`,
          })}`,
      feedback: {
        correct: hard ? `Correct. Two reflections, one across each axis, change both signs: ${show(q[0], q[1])}.` : `Correct. ${pair(q[0], q[1])}: the ${axis === 'x' ? 'y' : 'x'}-coordinate changed sign.`,
        wrong(ans) {
          const gx = parseNum(ans[0]),
            gy = parseNum(ans[1]);
          const is = (pt) => gx != null && gy != null && near(gx, pt[0], 0.001) && near(gy, pt[1], 0.001);
          if (is(p)) return hard ? 'That is the original point. Each reflection changes one sign, so two reflections change both.' : `That is the original point. Reflecting across the ${axis}-axis changes the sign of ${axis === 'x' ? 'y' : 'x'}.`;
          if (!hard && is([-p[0], -p[1]])) return `You changed both signs. Reflecting across one axis changes only one coordinate. ${axisRule(axis)}`;
          if (!hard && is(reflect(p, second))) return `You reflected across the ${second}-axis. The mirror here is the ${axis}-axis, so ${axis === 'x' ? 'y' : 'x'} changes sign instead.`;
          if (hard && is(first)) return `${show(first[0], first[1])} is the point after the first reflection. Now reflect it across the ${second}-axis too.`;
          if (hard && is(reflect(p, second))) return `That is only the second reflection. Do the ${axis}-axis reflection first, then the ${second}-axis reflection.`;
          if (is([q[1], q[0]])) return 'You have the right numbers but swapped x and y. A reflection never swaps the coordinates.';
          if (hard && (gx != null && RX.N7.typedMixed(q[0]) != null && near(gx, RX.N7.typedMixed(q[0]), 0.001))) return 'A mixed number typed with a space is read as a different number. Type a decimal or an improper fraction.';
          return hard ? 'Do one reflection at a time. Each one changes the sign of exactly one coordinate.' : `Keep ${axis} the same and change the sign of the other coordinate.`;
        },
      },
    };
  });

  // ---------- Error: changed the wrong coordinate (error). Hard: a two-step reflection where step 2 undoes step 1. ----------
  G.define('n5_reflectError', (r, o) => {
    const hard = !!o.hard;
    const p = [nz(r), nz(r)];
    const axis = r.pick(['x', 'y']);
    const second = axis === 'x' ? 'y' : 'x';
    const name = r.pick(NAMES);
    if (hard) {
      const step1 = reflect(p, axis);
      const correct = reflect(step1, second);
      const wrongPt = reflect(step1, axis); // reflected across the same axis again: back to the start
      const fixCoord = second === 'y' ? 0 : 1; // reflecting across the y-axis changes x
      const opts = [
        { html: `Step 2 reflects across the ${axis}-axis again, which undoes step 1. Step 2 should change the sign of ${second === 'y' ? 'x' : 'y'}.`, ok: true },
        { html: `Step 1 is wrong. Reflecting across the ${axis}-axis should change the sign of ${axis}, not the other coordinate.`, why: `Step 1 is right. Across the ${axis}-axis, ${axis} stays the same and the other coordinate changes sign.` },
        { html: `${name} is correct. Reflecting across two axes always brings a point back to where it started.`, why: `Reflecting across the same axis twice brings it back. Reflecting across the x-axis and then the y-axis changes both signs.` },
        { html: `${name} should have swapped the two coordinates in step 2 instead of changing a sign.`, why: 'A reflection across an axis never swaps x and y. It changes the sign of one coordinate.' },
      ];
      const sh = shuffleOptions(r, opts, 0);
      return {
        type: 'error',
        skill: 'reflect',
        lesson: '7-5',
        title: 'Find the two-step reflection mistake',
        prompt: `<p>${name} reflects ${hl(pair(p[0], p[1]))} across the <b>${axis}-axis</b>, then reflects the result across the <b>${second}-axis</b>. Here is the work.</p><p>What is the mistake?</p>`,
        work: `Step 1 (${axis}-axis): ${pair(p[0], p[1])} → ${pair(step1[0], step1[1])}<br>Step 2 (${second}-axis): ${pair(step1[0], step1[1])} → ${pair(wrongPt[0], wrongPt[1])}`,
        options: sh.options,
        answer: sh.answer,
        fix: { label: `Correct ${fixCoord === 0 ? 'x' : 'y'}-coordinate of the final point: `, answer: correct[fixCoord] },
        hints: [`Check each step on its own. ${axisRule(axis)}`, `Step 1 is ${pair(step1[0], step1[1])}. In step 2 the mirror is the ${second}-axis. ${axisRule(second)}`, `Look at step 2: which coordinate changed, and which one should have changed?`],
        hintEs: `Revisa cada paso por separado. ${axisRuleEs(axis)}`,
        solution: `<p>Step 1 is right: ${pair(step1[0], step1[1])}. In step 2, ${name} changed the same coordinate again, which is a second reflection across the ${axis}-axis and lands back on the start. ${axisRule(second)} The final point is <b>${pair(correct[0], correct[1])}</b>, so its ${fixCoord === 0 ? 'x' : 'y'}-coordinate is <b>${dec(correct[fixCoord])}</b>.</p>`,
        feedback: {
          correct: `Correct. After reflecting across both axes, both signs change: ${pair(correct[0], correct[1])}.`,
          wrong(ans, d) {
            if (!d.mistakeOk) return (sh.options[ans.mistake] && sh.options[ans.mistake].why) || 'Check step 2 against the rule for its axis.';
            const got = parseNum(ans.fix);
            if (got != null && got === p[fixCoord]) return 'You found the mistake. That coordinate is still the original one. Across the second axis, it must change sign.';
            return `You found the mistake. In step 2, change the sign of ${fixCoord === 0 ? 'x' : 'y'} in ${pair(step1[0], step1[1])}.`;
          },
        },
      };
    }
    const correct = reflect(p, axis);
    const wrongPt = reflect(p, second);
    const changed = axis === 'x' ? 'x' : 'y'; // the coordinate the student wrongly changed
    const should = second;
    const opts = [
      { html: `${name} changed ${changed} instead of ${should}. Across the ${axis}-axis the point moves ${axis === 'x' ? 'up or down' : 'left or right'}, so ${should} changes sign.`, ok: true },
      { html: `${name} should have changed the signs of both coordinates, since a reflection flips the whole point.`, why: 'Reflecting across one axis flips the point over one line, so exactly one coordinate changes sign.' },
      { html: `${name} is correct. Reflecting across the ${axis}-axis always changes the sign of the ${changed}-coordinate.`, why: `Reflecting across the ${axis}-axis moves the point to the other side of that axis, which changes ${should}, not ${changed}. ${name}'s point is actually the reflection across the ${should}-axis.` },
      { html: `${name} should have swapped the two coordinates, because a mirror image reverses the pair.`, why: 'A reflection across an axis never swaps x and y. It changes the sign of one coordinate.' },
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
        `${axisRule(axis)} Write the opposite of ${dec(p[fixCoord])} for the fix.`,
      ],
      hintEs: `El eje ${axis} es el espejo. Imagina que el punto ${pair(p[0], p[1])} se refleja sobre el eje ${axis}. ¿Hacia dónde se mueve?`,
      solution: `<p>${axisRule(axis)} ${name} changed ${changed} instead, which gives the reflection across the ${should}-axis. The correct reflection is <b>${pair(correct[0], correct[1])}</b>, so the ${should}-coordinate should be <b>${dec(correct[fixCoord])}</b>.</p>${PLANE({
        series: [
          { points: [p], color: '#5B6B7A', labels: [pair(p[0], p[1])] },
          { points: [correct], labels: [pair(correct[0], correct[1])] },
          { points: [wrongPt], color: '#C8553D', labels: [pair(wrongPt[0], wrongPt[1]) + ' (wrong)'] },
        ],
        aria: `Coordinate plane showing the original point, the correct reflection, and ${name}'s incorrect point`,
      })}`,
      feedback: {
        correct: `Correct. Across the ${axis}-axis, ${should} changes sign: ${pair(correct[0], correct[1])}.`,
        wrong(ans, d) {
          if (!d.mistakeOk) return (sh.options[ans.mistake] && sh.options[ans.mistake].why) || `Picture the point flipping over the ${axis}-axis. Which coordinate changes?`;
          const got = parseNum(ans.fix);
          if (got != null && got === p[fixCoord]) return `You found the mistake. For the fix, the ${should}-coordinate must change sign.`;
          return `You found the mistake. The fix is the opposite of ${dec(p[fixCoord])}.`;
        },
      },
    };
  });

  // ---------- Table of points and their reflections (table). Hard: rational coordinates and one row worked backward. ----------
  G.define('n5_reflectTable', (r, o) => {
    const hard = !!o.hard;
    const axis = r.pick(['x', 'y']);
    const pts = hard ? [0, 1, 2].map(() => [nzR(r), nzR(r)]) : drawPoints(r, 3);
    const refl = pts.map((p) => reflect(p, axis));
    const labels = ['A', 'B', 'C'];
    const back = hard ? r.int(0, 2) : -1; // this row gives the reflection and asks for the original
    const show = (p) => (hard ? `(${dec(p[0])}, ${dec(p[1])})` : pair(p[0], p[1]));
    const rows = [['Marker', back >= 0 ? 'Known point' : 'Original', 'Missing x', 'Missing y']].concat(pts.map((p, i) => [labels[i] + (i === back ? ' (twin given)' : ''), show(i === back ? refl[i] : p), `__IN:x${i}__`, `__IN:y${i}__`]));
    const want = pts.map((p, i) => (i === back ? p : refl[i]));
    const inputs = [];
    want.forEach((q, i) => inputs.push({ id: 'x' + i, answer: q[0] }, { id: 'y' + i, answer: q[1] }));
    return {
      type: 'table',
      skill: 'reflect',
      lesson: '7-5',
      title: hard ? `Mirror twins across the ${axis}-axis` : `Reflect three markers across the ${axis}-axis`,
      prompt: hard
        ? `<p>Markers A, B, and C each have a mirror twin across the <b>${axis}-axis</b>. For two markers the table gives the original, so write the twin. For marker ${labels[back]} the table gives the <b>twin</b>, so write the original.</p><p class="muted">Type decimals. Use a minus sign for negatives.</p>`
        : `<p>Markers A, B, and C sit at ${pts.map((p) => hl(pair(p[0], p[1]))).join(', ')}. Each has a mirror twin across the <b>${axis}-axis</b>. Complete the table with the coordinates of each reflected marker.</p><p class="muted">Type negatives with a minus sign, like -4.</p>`,
      rows: hard ? rows : [['Marker', 'Original', 'Reflected x', 'Reflected y']].concat(pts.map((p, i) => [labels[i], pair(p[0], p[1]), `__IN:x${i}__`, `__IN:y${i}__`])),
      inputs,
      hints: [
        axisRule(axis),
        hard ? `Reflecting the twin across the ${axis}-axis gives back the original, so marker ${labels[back]} uses the same rule.` : `Marker A: ${pair(pts[0][0], pts[0][1])} → keep ${axis} = ${dec(axis === 'x' ? pts[0][0] : pts[0][1])}, change the sign of ${axis === 'x' ? 'y' : 'x'}.`,
        'In every row, one coordinate stays the same and the other is written with the opposite sign.',
      ],
      hintEs: axisRuleEs(axis),
      solution: `<ul>${pts.map((p, i) => `<li>${labels[i]}: ${show(p)} ↔ ${show(refl[i])}${i === back ? ' (the original is the missing point)' : ''} → <b>${show(want[i])}</b></li>`).join('')}</ul><p>${axisRule(axis)} Each marker and its twin are the same distance from the ${axis}-axis.${hard ? ' Reflecting twice across the same axis returns to the start, which is why the backward row uses the same rule.' : ''}</p>${hard ? '' : PLANE({ series: [{ points: pts, color: '#5B6B7A', labels: labels }, { points: refl, labels: labels.map((l) => l + "'") }], aria: `Coordinate plane showing markers A, B, C and their reflections across the ${axis}-axis` })}`,
      feedback: {
        correct: `Correct. Across the ${axis}-axis, only the ${axis === 'x' ? 'y' : 'x'}-coordinate changes sign.`,
        wrong(ans, d) {
          const id = String((d.wrong || [])[0]);
          const i = Number(id.slice(1));
          const coord = id[0];
          const got = parseNum(ans[id]);
          const target = coord === 'x' ? want[i][0] : want[i][1];
          if (got != null && near(got, -target, 0.001)) {
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
  const r2 = (x) => Math.round(x * 100) / 100;
  const whyOf = (opts) => (ans) => (opts[ans] && opts[ans].why) || 'Not that one. Use the coordinates that differ. Opposite sides of an axis: add the absolute values. Same side: subtract.';

  const LIM = 6;
  const HLIM = 8;
  const PLANE = (o) => V.graph(Object.assign({ xMin: -LIM, xMax: LIM, yMin: -LIM, yMax: LIM, size: 260 }, o));
  const FLAGS = ['red flag', 'blue flag', 'yellow flag', 'green flag', 'orange flag', 'white flag'];
  const nzIn = (r, lo, hi) => {
    const m = r.int(lo, hi);
    return r.chance(0.5) ? -m : m;
  };
  /** Two distinct coordinates on one axis; `cross` forces opposite signs, `same` forces the same side. `rat` allows halves and quarters. */
  const twoCoords = (r, mode, rat) => {
    let a, b;
    let guard = 0;
    const draw = () => (rat ? (r.int(0, 6) + r.pick([0.5, 0.25, 0.75, 0])) * (r.chance(0.5) ? -1 : 1) || 1.5 : nzIn(r, 1, LIM));
    do {
      a = draw();
      b = draw();
      guard++;
    } while ((near(a, b) || (mode === 'cross' && Math.sign(a) === Math.sign(b)) || (mode === 'same' && Math.sign(a) !== Math.sign(b))) && guard < 100);
    return [a, b];
  };
  const dist1 = (a, b) => r2(Math.abs(a - b));
  const A = (v) => dec(Math.abs(v));
  /** Explanation of a one-dimensional distance between coordinates a and b. */
  const explain1 = (a, b, coordName) =>
    Math.sign(a) !== Math.sign(b)
      ? `The ${coordName}-coordinates ${dec(a)} and ${dec(b)} are on opposite sides of 0, so add the absolute values: |${dec(a)}| + |${dec(b)}| = ${A(a)} + ${A(b)} = ${dec(dist1(a, b))}`
      : `The ${coordName}-coordinates ${dec(a)} and ${dec(b)} are on the same side of 0, so subtract the absolute values: |${dec(Math.abs(a) > Math.abs(b) ? a : b)}| − |${dec(Math.abs(a) > Math.abs(b) ? b : a)}| = ${dec(Math.max(Math.abs(a), Math.abs(b)))} − ${dec(Math.min(Math.abs(a), Math.abs(b)))} = ${dec(dist1(a, b))}`;
  const setUp = (a, b) => (Math.sign(a) !== Math.sign(b) ? `|${dec(a)}| + |${dec(b)}| = ${A(a)} + ${A(b)}` : `${dec(Math.max(Math.abs(a), Math.abs(b)))} − ${dec(Math.min(Math.abs(a), Math.abs(b)))}`);
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
  /** Diagnose a one-dimensional distance answer v for coordinates a, b with the other (shared) coordinate `other`. */
  const distWhy = (v, a, b, other, axisName, sharedName) => {
    const d = dist1(a, b);
    const sub = r2(Math.abs(Math.abs(a) - Math.abs(b))),
      add = r2(Math.abs(a) + Math.abs(b));
    if (v == null) return 'Type one number for the distance.';
    if (Math.sign(a) !== Math.sign(b) && near(v, sub, 0.001)) return `You subtracted. The points are on opposite sides of the ${axisName}, so the segment has a piece on each side. Add the two distances from 0.`;
    if (Math.sign(a) === Math.sign(b) && near(v, add, 0.001)) return `You added. Both points are on the same side of the ${axisName}, so the shorter distance from 0 is inside the longer one. Subtract.`;
    if (near(v, -d, 0.001)) return 'A distance is never negative.';
    if (near(Math.abs(v - d), 1, 0.001)) return 'Off by one. Count the grid spaces between the points, not the points themselves.';
    if (near(v, Math.abs(other), 0.001)) return `${A(other)} comes from the shared ${sharedName}-coordinate. That tells where the line sits, not how long the segment is.`;
    return null;
  };

  // ---------- Horizontal distance (num; hard = rational x-coordinates across the y-axis, no picture) ----------
  G.define('n6_distanceH', (r, o) => {
    const hard = !!o.hard;
    const [x1, x2] = twoCoords(r, hard ? 'cross' : r.pick(['cross', 'same', 'any']), hard);
    const y = nzIn(r, 1, LIM);
    const p = [x1, y],
      q = [x2, y];
    const d = dist1(x1, x2);
    const [f1, f2] = r.pickN(FLAGS, 2);
    const name = r.pick(NAMES);
    const cross = Math.sign(x1) !== Math.sign(x2);
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
        cross ? `The x-coordinates ${dec(x1)} and ${dec(x2)} are on opposite sides of the y-axis. Find each one's distance from 0 and add.` : `The x-coordinates ${dec(x1)} and ${dec(x2)} are on the same side of the y-axis. Find each one's distance from 0 and subtract.`,
        setUp(x1, x2) + '.',
      ],
      hintEs: 'Los dos puntos tienen la misma coordenada y, así que están en la misma recta horizontal. Solo cambian las coordenadas x.',
      solution: `<p>The points share y = ${dec(y)}, so the distance is the gap between the x-coordinates. ${explain1(x1, x2, 'x')}. The flags are <b>${dec(d)} m</b> apart.${hard ? '' : ' Counting the grid squares between them gives the same answer.'}</p>${hard ? '' : ''}`,
      feedback: {
        correct: `Correct. The distance between x = ${dec(x1)} and x = ${dec(x2)} is ${dec(d)} units.`,
        wrong(ans, d2) {
          return distWhy(d2.value, x1, x2, y, 'y-axis', 'y') || `The two points share a y-coordinate. Find the distance between ${dec(x1)} and ${dec(x2)} on the x-axis.`;
        },
      },
    };
  });

  // ---------- Vertical distance (num; hard = rational y-coordinates, no picture) ----------
  G.define('n6_distanceV', (r, o) => {
    const hard = !!o.hard;
    const [y1, y2] = twoCoords(r, r.pick(['cross', 'same', 'any']), hard);
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
    const cross = Math.sign(y1) !== Math.sign(y2);
    return {
      type: 'num',
      skill: 'distance-plane',
      lesson: '7-6',
      title: hard ? 'Vertical distance with rational coordinates' : 'Distance along a vertical line',
      prompt: `<p>The ${ctx.a} is at ${hl(pair(p[0], p[1]))} and the ${ctx.b} is at ${hl(pair(q[0], q[1]))}. Each grid unit is 1 meter. The crew needs ${ctx.what} straight between them.</p>${hard ? '' : segPlane(p, q)}<p>How long is ${ctx.what}, in meters?</p>`,
      unit: 'm',
      answer: d,
      hints: [
        'Both points have the same x-coordinate, so they line up vertically. Only the y-coordinates differ.',
        cross ? `The y-coordinates ${dec(y1)} and ${dec(y2)} are on opposite sides of the x-axis. Add their distances from 0.` : `The y-coordinates ${dec(y1)} and ${dec(y2)} are on the same side of the x-axis. Subtract their distances from 0.`,
        setUp(y1, y2) + '.',
      ],
      hintEs: 'Los dos puntos tienen la misma coordenada x, así que están alineados verticalmente. Solo cambian las coordenadas y.',
      solution: `<p>The points share x = ${dec(x)}, so the distance is the gap between the y-coordinates. ${explain1(y1, y2, 'y')}. ${ctx.what.charAt(0).toUpperCase() + ctx.what.slice(1)} is <b>${dec(d)} m</b> long.</p>`,
      feedback: {
        correct: `Correct. From y = ${dec(y1)} to y = ${dec(y2)} is ${dec(d)} units.`,
        wrong(ans, d2) {
          return distWhy(d2.value, y1, y2, x, 'x-axis', 'x') || `The two points share an x-coordinate. Find the distance between ${dec(y1)} and ${dec(y2)} on the y-axis.`;
        },
      },
    };
  });

  // ---------- Fill the steps (blanks). Hard: rational coordinates, and the student decides whether to add or subtract. ----------
  G.define('n6_distanceBlanks', (r, o) => {
    const hard = !!o.hard;
    const horizontal = r.chance(0.5);
    const [c1, c2] = twoCoords(r, hard ? r.pick(['cross', 'same']) : 'cross', hard);
    const other = nzIn(r, 1, LIM);
    const p = horizontal ? [c1, other] : [other, c1];
    const q = horizontal ? [c2, other] : [other, c2];
    const d = dist1(c1, c2);
    const cross = Math.sign(c1) !== Math.sign(c2);
    const coordName = horizontal ? 'x' : 'y';
    const axisName = horizontal ? 'y-axis' : 'x-axis';
    const name = r.pick(NAMES);
    return {
      type: 'blanks',
      skill: 'distance-plane',
      lesson: '7-6',
      title: hard ? 'Show the distance steps (you choose)' : 'Show the distance steps',
      prompt: hard
        ? `<p>${name} finds the distance between ${hl(pair(p[0], p[1]))} and ${hl(pair(q[0], q[1]))}. First find each absolute value. Then decide whether to add or subtract them.</p><p class="muted">Type decimals.</p>`
        : `<p>${name} finds the distance between ${hl(pair(p[0], p[1]))} and ${hl(pair(q[0], q[1]))}. The segment crosses the ${axisName}, so ${name} adds the two absolute values.</p>${segPlane(p, q)}<p>Complete the work.</p>`,
      template: hard ? `|${dec(c1)}| = {0}     |${dec(c2)}| = {1}     distance = {2} units` : `|${dec(c1)}| + |${dec(c2)}| = {0} + {1} = {2} units`,
      fields: [
        { label: `|${dec(c1)}|`, answer: Math.abs(c1), width: 'xs' },
        { label: `|${dec(c2)}|`, answer: Math.abs(c2), width: 'xs' },
        { label: 'distance', answer: d, width: 'xs' },
      ],
      hints: [
        `The points share a ${horizontal ? 'y' : 'x'}-coordinate, so the distance comes from the ${coordName}-coordinates ${dec(c1)} and ${dec(c2)}.`,
        `Absolute value is distance from 0. ${hard ? (cross ? `${dec(c1)} and ${dec(c2)} have opposite signs, so the segment crosses the ${axisName}.` : `${dec(c1)} and ${dec(c2)} have the same sign, so the segment stays on one side of the ${axisName}.`) : `Find |${dec(c1)}| and |${dec(c2)}|.`}`,
        hard ? (cross ? 'Crossing an axis: add the two absolute values.' : 'Same side of the axis: subtract the smaller absolute value from the larger one.') : `Add the two distances because the segment crosses the ${axisName}.`,
      ],
      hintEs: `Los puntos tienen la misma coordenada ${horizontal ? 'y' : 'x'}, así que la distancia sale de las coordenadas ${coordName}: ${dec(c1)} y ${dec(c2)}.`,
      solution: `<p>|${dec(c1)}| = <b>${A(c1)}</b> and |${dec(c2)}| = <b>${A(c2)}</b>. ${cross ? `The ${coordName}-coordinates are on opposite sides of 0, so the segment is made of two pieces, one on each side of the ${axisName}. Add them: ${A(c1)} + ${A(c2)}` : `Both ${coordName}-coordinates are on the same side of 0, so subtract: ${dec(Math.max(Math.abs(c1), Math.abs(c2)))} − ${dec(Math.min(Math.abs(c1), Math.abs(c2)))}`} = <b>${dec(d)}</b> units.</p>`,
      feedback: {
        correct: cross ? `Correct. ${A(c1)} + ${A(c2)} = ${dec(d)}: one piece on each side of the ${axisName}.` : `Correct. ${dec(Math.max(Math.abs(c1), Math.abs(c2)))} − ${dec(Math.min(Math.abs(c1), Math.abs(c2)))} = ${dec(d)}: both points are on the same side.`,
        wrong(ans, d2) {
          const i = (d2.wrong || [])[0];
          const got = parseNum(ans[i]);
          if (i < 2 && got != null && got < 0) return 'Absolute value is a distance, so it is never negative.';
          if (i === 2) {
            const why = distWhy(got, c1, c2, other, axisName, horizontal ? 'y' : 'x');
            if (why) return why;
            return cross ? 'Add the two absolute values.' : 'Subtract the smaller absolute value from the larger one.';
          }
          return `|${dec([c1, c2][i])}| asks how far ${dec([c1, c2][i])} is from 0.`;
        },
      },
    };
  });

  // ---------- Who found the distance correctly? (who). Hard: rational coordinates on the same side of the axis. ----------
  G.define('n6_whoDistance', (r, o) => {
    const hard = !!o.hard;
    const horizontal = r.chance(0.5);
    const [c1, c2] = twoCoords(r, hard ? 'same' : 'cross', hard);
    const other = nzIn(r, 1, LIM);
    const p = horizontal ? [c1, other] : [other, c1];
    const q = horizontal ? [c2, other] : [other, c2];
    const d = dist1(c1, c2);
    const sub = r2(Math.abs(Math.abs(c1) - Math.abs(c2)));
    const add = r2(Math.abs(c1) + Math.abs(c2));
    const big = dec(Math.max(Math.abs(c1), Math.abs(c2))),
      small = dec(Math.min(Math.abs(c1), Math.abs(c2)));
    const [n1, n2, n3] = r.pickN(NAMES, 3);
    const coordName = horizontal ? 'x' : 'y';
    const otherName = horizontal ? 'y' : 'x';
    const opts = hard
      ? [
          { title: n1, html: `Same sign, so I subtracted the sizes: ${big} − ${small} = <b>${dec(d)}</b>.`, ok: true },
          { title: n2, html: `Distance means adding absolute values: ${A(c1)} + ${A(c2)} = <b>${dec(add)}</b>.`, why: `Adding works only when the points are on opposite sides of the axis. Here both ${coordName}-coordinates have the same sign, so the shorter distance from 0 lies inside the longer one. Subtract.` },
          { title: n3, html: `The matching ${otherName}-values give it: the distance is <b>${A(other)}</b> units.`, why: `${dec(other)} is the shared ${otherName}-coordinate. It tells where the line sits, not how long the segment is. Use the coordinates that differ.` },
        ]
      : [
          { title: n1, html: `Opposite signs, so I added the sizes: ${A(c1)} + ${A(c2)} = <b>${dec(d)}</b>.`, ok: true },
          { title: n2, html: `I subtracted the sizes of the ${coordName}-values: ${big} − ${small} = <b>${dec(sub)}</b>.`, why: `Subtracting works only when both points are on the same side of the axis. Here ${dec(c1)} and ${dec(c2)} are on opposite sides, so the two distances from 0 add up.` },
          { title: n3, html: `The ${otherName}-values match, so the distance is <b>${A(other)}</b> units.`, why: `${dec(other)} is the shared ${otherName}-coordinate. It tells where the line sits, not how long the segment is. Use the coordinates that differ.` },
        ];
    const sh = shuffleOptions(r, opts, 0);
    return {
      type: 'who',
      skill: 'distance-plane',
      lesson: '7-6',
      title: 'Who measured the cable?',
      prompt: `<p>Three navigators find the distance between ${hl(pair(p[0], p[1]))} and ${hl(pair(q[0], q[1]))}.</p>${hard ? '' : segPlane(p, q)}<p>Who is correct?</p>`,
      options: sh.options,
      answer: sh.answer,
      layout: 'cards',
      hints: [
        `Which coordinate is the same for both points? That one tells you the direction of the segment, not its length.`,
        `The ${coordName}-coordinates differ: ${dec(c1)} and ${dec(c2)}. ${hard ? 'They have the same sign, so the segment stays on one side of the axis.' : 'They have opposite signs, so the segment crosses an axis.'}`,
        hard ? 'Staying on one side means subtracting the two distances from 0.' : 'Crossing an axis means adding the two distances from 0.',
      ],
      hintEs: '¿Qué coordenada es igual en los dos puntos? Esa coordenada indica la dirección del segmento, no su longitud.',
      solution: `<p>${n1} is correct. The ${otherName}-coordinates match, so the distance comes from the ${coordName}-coordinates. ${explain1(c1, c2, coordName)}. The distance is <b>${dec(d)}</b> units. The shared coordinate, ${dec(other)}, is not a length at all.</p>${hard ? '' : ''}`,
      feedback: { correct: hard ? `Correct. Same side of the axis means subtract: ${dec(d)}.` : `Correct. Opposite sides of the axis means add: ${A(c1)} + ${A(c2)} = ${dec(d)}.`, wrong: whyOf(sh.options) },
    };
  });

  // ---------- Which route is shorter? (mc). Hard: rational coordinates, no picture. ----------
  G.define('n6_compareMc', (r, o) => {
    const hard = !!o.hard;
    let a, b, dA, dB;
    let guard = 0;
    do {
      a = twoCoords(r, hard ? 'cross' : 'any', hard);
      b = twoCoords(r, 'any', hard);
      dA = dist1(a[0], a[1]);
      dB = dist1(b[0], b[1]);
      guard++;
    } while ((near(dA, dB) || (hard && Math.abs(dA - dB) > 3)) && guard < 80);
    if (near(dA, dB)) b = [b[0], b[1] === LIM ? -LIM : b[1] + 1];
    dB = dist1(b[0], b[1]);
    const yA = nzIn(r, 1, LIM),
      xB = nzIn(r, 1, LIM);
    const pA = [a[0], yA],
      qA = [a[1], yA];
    const pB = [xB, b[0]],
      qB = [xB, b[1]];
    const shorter = dA < dB ? 'A' : 'B';
    const diff = r2(Math.abs(dA - dB));
    const naiveA = r2(Math.abs(Math.abs(a[0]) - Math.abs(a[1])));
    const u = (n) => `${dec(n)} unit${n === 1 ? '' : 's'}`;
    const opts = [
      { html: `Route ${shorter} is shorter, by ${u(diff)}`, ok: true },
      { html: `Route ${shorter === 'A' ? 'B' : 'A'} is shorter, by ${u(diff)}`, why: `Route A is ${dec(dA)} units and Route B is ${dec(dB)} units. The shorter one is Route ${shorter}.` },
      { html: `The two routes are the same length`, why: `Route A is ${dec(dA)} units long and Route B is ${dec(dB)} units long. They are not equal.` },
      hard && !near(naiveA, dA)
        ? { html: `Route ${naiveA < dB ? 'A' : 'B'} is shorter, by ${u(r2(Math.abs(dB - naiveA)))}`, why: `That treats Route A as ${dec(naiveA)} units by subtracting. Route A crosses the y-axis, so its two pieces add: ${dec(dA)} units.` }
        : { html: `Route ${shorter} is shorter, by ${u(r2(diff + 1))}`, why: `Route ${shorter} is shorter, but ${dec(dA)} and ${dec(dB)} differ by ${dec(diff)}, not ${dec(r2(diff + 1))}. Count the spaces between points, not the points.` },
    ];
    // Keep option texts distinct (the subtraction trap can collide with another option).
    const seen = new Set();
    const finalOpts = opts.filter((x) => (seen.has(x.html) ? false : (seen.add(x.html), true)));
    if (finalOpts.length < 4) finalOpts.push({ html: `Route ${shorter} is shorter, by ${u(r2(diff + 2))}`, why: `${dec(dA)} and ${dec(dB)} differ by ${dec(diff)}. Find each length, then subtract them.` });
    const sh = shuffleOptions(r, finalOpts, 0);
    return {
      type: 'mc',
      skill: 'distance-plane',
      lesson: '7-6',
      title: 'Which route is shorter?',
      prompt: `<p>Two routes cross the crevasse field. <b>Route A</b> runs from ${hl(pair(pA[0], pA[1]))} to ${hl(pair(qA[0], qA[1]))}. <b>Route B</b> runs from ${hl(pair(pB[0], pB[1]))} to ${hl(pair(qB[0], qB[1]))}.</p>${
        hard
          ? ''
          : PLANE({
              series: [
                { points: [pA, qA], line: true, labels: ['A', 'A'] },
                { points: [pB, qB], line: true, color: '#F2A33A', labels: ['B', 'B'] },
              ],
              aria: 'Coordinate plane showing horizontal Route A and vertical Route B',
            })
      }<p>Which route is shorter, and by how much?</p>`,
      options: sh.options,
      answer: sh.answer,
      hints: [
        'Find each length separately. Route A is horizontal: use its x-coordinates. Route B is vertical: use its y-coordinates.',
        `Route A: ${setUp(a[0], a[1])}.`,
        `Route B: ${setUp(b[0], b[1])}. Then subtract the shorter length from the longer one.`,
      ],
      hintEs: 'Halla cada longitud por separado. La ruta A es horizontal: usa sus coordenadas x. La ruta B es vertical: usa sus coordenadas y.',
      solution: `<p>Route A: ${explain1(a[0], a[1], 'x')} units. Route B: ${explain1(b[0], b[1], 'y')} units. <b>Route ${shorter}</b> is shorter by ${dec(Math.max(dA, dB))} − ${dec(Math.min(dA, dB))} = <b>${dec(diff)}</b> unit${diff === 1 ? '' : 's'}.</p>`,
      feedback: { correct: `Correct. Route A is ${dec(dA)} units, Route B is ${dec(dB)} units, so Route ${shorter} wins by ${dec(diff)}.`, wrong: whyOf(sh.options) },
    };
  });

  // ---------- Order segments by length (seq). Hard: four cables, rational coordinates, lengths close together. ----------
  G.define('n6_seqRoutes', (r, o) => {
    const hard = !!o.hard;
    const n = hard ? 4 : 3;
    const segs = [];
    const lens = [];
    let guard = 0;
    while (segs.length < n && guard++ < 300) {
      const horizontal = segs.length % 2 === 0;
      const [c1, c2] = twoCoords(r, hard && segs.length < 2 ? 'cross' : 'any', hard);
      const other = nzIn(r, 1, LIM);
      const len = dist1(c1, c2);
      if (lens.some((l) => near(l, len))) continue;
      if (hard && lens.length && Math.max(...lens.concat(len)) - Math.min(...lens.concat(len)) > 4) continue;
      lens.push(len);
      segs.push({ p: horizontal ? [c1, other] : [other, c1], q: horizontal ? [c2, other] : [other, c2], len, horizontal, c1, c2 });
    }
    const names = ['Cable 1', 'Cable 2', 'Cable 3', 'Cable 4'];
    const longestFirst = r.chance(0.5);
    const items = segs.map((s, i) => ({ html: `<b>${names[i]}</b>: ${pair(s.p[0], s.p[1])} to ${pair(s.q[0], s.q[1])}`, rate: s.len }));
    const cmp = (lenOf) => (x, y) => (longestFirst ? lenOf(y) - lenOf(x) : lenOf(x) - lenOf(y));
    const order = segs.map((_, i) => i).sort(cmp((i) => segs[i].len));
    const naive = (s) => r2(Math.abs(Math.abs(s.c1) - Math.abs(s.c2)));
    return {
      type: 'seq',
      skill: 'distance-plane',
      lesson: '7-6',
      title: longestFirst ? 'Order the cables, longest first' : 'Order the cables, shortest first',
      prompt: `<p>${hard ? 'Four' : 'Three'} cables will be cut to span the crevasse. Put them in order from <b>${longestFirst ? 'longest (top) to shortest (bottom)' : 'shortest (top) to longest (bottom)'}</b>.</p>${
        hard
          ? ''
          : PLANE({
              series: segs.map((s, i) => ({ points: [s.p, s.q], line: true, color: ['#1FA6A2', '#F2A33A', '#C8553D'][i], labels: [String(i + 1), ''] })),
              aria: 'Coordinate plane showing three cables as segments',
            })
      }`,
      items,
      order,
      hints: [
        'For each cable, find which coordinate changes. A horizontal cable uses x-coordinates; a vertical one uses y-coordinates.',
        `${names[0]}: ${segs[0].horizontal ? explain1(segs[0].p[0], segs[0].q[0], 'x') : explain1(segs[0].p[1], segs[0].q[1], 'y')}.`,
        `Find the other lengths the same way: add when a cable crosses an axis, subtract when it does not. ${longestFirst ? 'Largest' : 'Smallest'} goes on top.`,
      ],
      hintEs: 'Para cada cable, busca qué coordenada cambia. Un cable horizontal usa las coordenadas x; uno vertical usa las coordenadas y.',
      solution: `<p>${segs.map((s, i) => `${names[i]} is ${dec(s.len)} units`).join(', ')}. From ${longestFirst ? 'longest to shortest' : 'shortest to longest'}: <b>${order.map((i) => names[i]).join(', ')}</b>. When the two coordinates have opposite signs, add their absolute values; when they share a sign, subtract.</p>`,
      feedback: {
        correct: 'Correct. Find each length from the coordinates that change, then compare.',
        wrong(ans) {
          const same = (a, b) => Array.isArray(a) && a.length === b.length && a.every((x, i) => x === b[i]);
          if (same(ans, order.slice().reverse())) return `Your order is backward. The list asks for ${longestFirst ? 'the longest' : 'the shortest'} cable on top.`;
          const naiveOrder = segs.map((_, i) => i).sort(cmp((i) => naive(segs[i])));
          if (segs.some((s) => Math.sign(s.c1) !== Math.sign(s.c2)) && same(ans, naiveOrder)) return 'You subtracted for every cable. A cable that crosses an axis has a piece on each side, so add its two absolute values.';
          return 'At least one cable is out of place. Find each length first: add absolute values when the segment crosses an axis, subtract when it does not.';
        },
      },
    };
  });

  // ---------- Plot the point at a given distance (plot). Hard: plot BOTH points at that distance on a larger grid. ----------
  G.define('n6_plotAtDistance', (r, o) => {
    const hard = !!o.hard;
    const lim = hard ? HLIM : LIM;
    const horizontal = r.chance(0.5);
    const start = hard ? [nzIn(r, 1, 3), nzIn(r, 1, 3)] : [nzIn(r, 1, LIM - 1), nzIn(r, 1, LIM - 1)];
    const dirs = horizontal ? ['left', 'right'] : ['down', 'up'];
    const coord = horizontal ? start[0] : start[1];
    const dir = coord < 0 ? dirs[1] : dirs[0]; // toward and across the axis
    const d = hard ? r.int(Math.abs(coord) + 1, lim - Math.abs(coord)) : r.int(Math.abs(coord) + 1, Math.min(Math.abs(coord) + LIM, Math.abs(coord) + 5));
    const newCoord = coord < 0 ? coord + d : coord - d;
    const awayCoord = coord < 0 ? coord - d : coord + d;
    const at = (c) => (horizontal ? [c, start[1]] : [start[0], c]);
    const target = at(newCoord);
    const targets = hard ? [target, at(awayCoord)] : [target];
    const name = r.pick(NAMES);
    const flag = r.pick(FLAGS);
    const fixed = dec(horizontal ? start[1] : start[0]);
    return {
      type: 'plot',
      skill: 'distance-plane',
      lesson: '7-6',
      title: hard ? 'Plot both cable ends' : 'Plot the far end of the cable',
      prompt: hard
        ? `<p>${name} anchors a cable at the ${flag}, ${hl(pair(start[0], start[1]))}, shown in gray. The cable is ${hl(d + ' units')} long and runs straight ${horizontal ? 'left or right' : 'up or down'}.</p><p>Plot <b>both</b> points where the cable could end.</p>`
        : `<p>${name} anchors a cable at the ${flag}, ${hl(pair(start[0], start[1]))}, shown in gray. The cable runs ${hl(d + ' units')} straight ${hl(dir)}.</p><p>Plot the point where the cable ends.</p>`,
      xLabel: 'x',
      yLabel: 'y',
      xMin: -lim,
      xMax: lim,
      yMin: -lim,
      yMax: lim,
      given: [start],
      givenLabels: [pair(start[0], start[1])],
      points: targets,
      count: targets.length,
      hints: hard
        ? [
            `Moving ${horizontal ? 'left or right' : 'up or down'} changes only the ${horizontal ? 'x' : 'y'}-coordinate. The ${horizontal ? 'y' : 'x'}-coordinate stays ${fixed}.`,
            `One end is ${d} units ${dirs[1]} and the other is ${d} units ${dirs[0]}. One of them crosses the axis.`,
            `Toward the axis: ${Math.abs(coord)} units reach 0, then ${d - Math.abs(coord)} more. Away from the axis: just count ${d} more units from ${dec(coord)}.`,
          ]
        : [
            `Moving ${dir} changes only the ${horizontal ? 'x' : 'y'}-coordinate. The ${horizontal ? 'y' : 'x'}-coordinate stays ${fixed}.`,
            `Start at ${dec(coord)}. Moving ${dir} by ${d} crosses 0: it takes ${Math.abs(coord)} units to reach the axis, then ${d - Math.abs(coord)} more.`,
            `Count ${d - Math.abs(coord)} units past 0 on the ${coord < 0 ? 'positive' : 'negative'} side.`,
          ],
      hintEs: `Moverse ${horizontal ? 'a la izquierda o a la derecha' : 'hacia arriba o hacia abajo'} solo cambia la coordenada ${horizontal ? 'x' : 'y'}. La coordenada ${horizontal ? 'y' : 'x'} se queda en ${fixed}.`,
      solution: `<p>Moving ${horizontal ? 'left or right' : 'up or down'} changes the ${horizontal ? 'x' : 'y'}-coordinate only. Toward the axis: from ${dec(coord)}, ${Math.abs(coord)} units reach the axis and the remaining ${d - Math.abs(coord)} units go past it, to ${dec(newCoord)}: <b>${pair(target[0], target[1])}</b>. Check: |${dec(coord)}| + |${dec(newCoord)}| = ${Math.abs(coord)} + ${Math.abs(newCoord)} = ${d}.${hard ? ` Away from the axis: ${Math.abs(coord)} + ${d} = ${Math.abs(awayCoord)} units from 0, so <b>${pair(...at(awayCoord))}</b>.` : ''}</p>${PLANE({
        xMin: -lim,
        xMax: lim,
        yMin: -lim,
        yMax: lim,
        series: [
          { points: [start], color: '#5B6B7A', labels: [pair(start[0], start[1])] },
          { points: [start, target], line: true, labels: ['', pair(target[0], target[1])] },
        ].concat(hard ? [{ points: [start, at(awayCoord)], line: true, color: '#F2A33A', labels: ['', pair(...at(awayCoord))] }] : []),
        aria: `Coordinate plane showing the cable from ${pair(start[0], start[1])}`,
      })}`,
      feedback: {
        correct: hard ? `Correct. Both ends are exactly ${d} units from the start.` : `Correct. ${pair(target[0], target[1])} is exactly ${d} units ${dir} of the start.`,
        wrong(ans, d2) {
          const e = (d2.extra || [])[0];
          if (!e) return hard ? `Place two points, each ${d} units from ${pair(start[0], start[1])}: one on each side of it.` : `Place one point, ${d} units ${dir} of ${pair(start[0], start[1])}.`;
          const sameLine = horizontal ? e[1] === start[1] : e[0] === start[0];
          if (!sameLine) return `The cable runs straight, so the ${horizontal ? 'y' : 'x'}-coordinate stays ${fixed}. Your point left that line.`;
          const got = horizontal ? e[0] : e[1];
          const moved = Math.abs(got - coord);
          if (!hard && (coord < 0 ? got < coord : got > coord)) return `You moved the wrong way. "${dir}" means ${horizontal ? (dir === 'left' ? 'toward smaller x' : 'toward larger x') : dir === 'down' ? 'toward smaller y' : 'toward larger y'}.`;
          if (moved === d - 1 || moved === d + 1) return `Off by one. Count ${d} spaces from ${dec(coord)}, and remember the step that lands on 0 counts too.`;
          if (got === -coord) return `That is the reflection of the start, ${Math.abs(coord) * 2} units away. The cable is ${d} units long.`;
          if (Math.abs(got) === d) return `You counted ${d} units from 0 instead of from the start at ${dec(coord)}. Start counting at the anchor.`;
          return `From ${dec(coord)}, count ${d} units along the line. Toward the axis: ${Math.abs(coord)} to reach 0, then ${d - Math.abs(coord)} more.`;
        },
      },
    };
  });

  // ---------- True or false: add or subtract? (tf). Hard: rational coordinates and an "add" claim. ----------
  G.define('n6_tfSubtract', (r, o) => {
    const hard = !!o.hard;
    const horizontal = r.chance(0.5);
    const cross = r.chance(0.5);
    const [c1, c2] = twoCoords(r, cross ? 'cross' : 'same', hard);
    const other = nzIn(r, 1, LIM);
    const p = horizontal ? [c1, other] : [other, c1];
    const q = horizontal ? [c2, other] : [other, c2];
    const d = dist1(c1, c2);
    const sub = r2(Math.abs(Math.abs(c1) - Math.abs(c2)));
    const add = r2(Math.abs(c1) + Math.abs(c2));
    const big = dec(Math.max(Math.abs(c1), Math.abs(c2))),
      small = dec(Math.min(Math.abs(c1), Math.abs(c2)));
    const name = r.pick(NAMES);
    const coordName = horizontal ? 'x' : 'y';
    const axisName = horizontal ? 'y-axis' : 'x-axis';
    // Normal: the claim always subtracts. Hard: the claim adds or subtracts at random.
    const claimAdds = hard && r.chance(0.5);
    const statement = claimAdds
      ? `The distance from ${pair(p[0], p[1])} to ${pair(q[0], q[1])} is ${A(c1)} + ${A(c2)} = ${dec(add)} units.`
      : `The distance from ${pair(p[0], p[1])} to ${pair(q[0], q[1])} is ${big} − ${small} = ${dec(sub)} units.`;
    const answer = claimAdds ? cross : !cross;
    const reasons = answer
      ? [
          { html: cross ? `The ${coordName}-coordinates are on opposite sides of the ${axisName}, so the two distances from 0 add.` : `Both ${coordName}-coordinates are on the same side of the ${axisName}, so the distance is the difference of their absolute values.`, correct: true },
          { html: `Distance is always found by ${claimAdds ? 'adding the two coordinates' : 'subtracting the smaller number from the larger one'}.` },
          { html: `The points share a ${horizontal ? 'y' : 'x'}-coordinate, so any method gives the same distance.` },
        ]
      : [
          { html: cross ? `The ${coordName}-coordinates ${dec(c1)} and ${dec(c2)} are on opposite sides of the ${axisName}, so the distances from 0 must be added.` : `Both ${coordName}-coordinates are on the same side of the ${axisName}, so the distances from 0 must be subtracted.`, correct: true },
          { html: `The distance should be ${dec(claimAdds ? add : sub)} but written as a negative number, because one coordinate is negative.` },
          { html: `The distance should be ${A(other)}, because that is the coordinate the points share.` },
        ];
    const sh = shuffleOptions(r, reasons, 0);
    return {
      type: 'tf',
      skill: 'distance-plane',
      lesson: '7-6',
      title: 'True or false?',
      prompt: `<p>${name} writes in the cable log:</p><blockquote>${hl(statement)}</blockquote>${hard ? '' : segPlane(p, q)}<p>Is the statement true or false? Choose the best reason.</p>`,
      answer,
      reasons: sh.options,
      hints: [
        `Look at the ${coordName}-coordinates, ${dec(c1)} and ${dec(c2)}. Are they on the same side of 0 or on opposite sides?`,
        cross ? `They have opposite signs. The segment crosses the ${axisName}, so it has a piece on each side.` : `They have the same sign. The segment stays on one side of the ${axisName}.`,
        cross ? `So the two distances from 0 should be added. Does the statement do that?` : `So the smaller distance from 0 should be subtracted from the larger one. Does the statement do that?`,
      ],
      hintEs: `Mira las coordenadas ${coordName}: ${dec(c1)} y ${dec(c2)}. ¿Están del mismo lado del 0 o en lados opuestos?`,
      solution: `<p>${explain1(c1, c2, coordName)} units. The statement is <b>${answer ? 'true' : 'false'}</b>${answer ? '.' : `. The real distance is ${dec(d)} units.`} Same side of an axis: subtract the absolute values. Opposite sides: add them.</p>`,
      feedback: {
        correct: cross ? 'Correct. Opposite sides of the axis: add the absolute values.' : 'Correct. Same side of the axis: subtract the absolute values.',
        wrong(ans, d2) {
          if (!d2.valueOk) return `Check the signs of ${dec(c1)} and ${dec(c2)}. Same sign: subtract. Opposite signs: add. Then compare with the statement.`;
          return 'Your true/false answer is right. Pick the reason that talks about which side of the axis the coordinates are on.';
        },
      },
    };
  });
})(typeof window !== 'undefined' ? window : globalThis);

/* js/units/u7/gen-polygons-lib.js */
/* Zone 7 — Station Core. Lesson 7-7 Represent Polygons on the Coordinate Plane. */
/* Shared helpers for gen-polygons.js and gen-polygons-2.js (split for size). */
(function (root) {
  'use strict';
  const RX = root.RX;
  const { G, V, shuffleOptions, NAMES, parseNum, near } = RX;
  const { dec, pair } = RX.N7;
  const hl = V.hl;

  const LIM = 6;
  const HLIM = 8; // Level 2 grids
  const PLANE = (o) => V.graph(Object.assign({ xMin: -LIM, xMax: LIM, yMin: -LIM, yMax: LIM, size: 260 }, o));
  const lim2 = (lim) => ({ xMin: -lim, xMax: lim, yMin: -lim, yMax: lim });
  const ROOMS = ['generator room', 'radio room', 'supply bay', 'greenhouse', 'bunk room', 'ice-core freezer', 'landing pad', 'fuel yard'];
  const SCALES = [
    { k: 2, u: 'm', uu: 'meters' },
    { k: 3, u: 'm', uu: 'meters' },
    { k: 4, u: 'm', uu: 'meters' },
    { k: 5, u: 'm', uu: 'meters' },
    { k: 10, u: 'ft', uu: 'feet' },
    { k: 5, u: 'ft', uu: 'feet' },
  ];
  /** Level 2 scales: half units, so real lengths and areas are decimals. */
  const HSCALES = [
    { k: 1.5, u: 'm', uu: 'meters' },
    { k: 2.5, u: 'm', uu: 'meters' },
    { k: 0.5, u: 'm', uu: 'meters' },
    { k: 1.5, u: 'ft', uu: 'feet' },
    { k: 2.5, u: 'ft', uu: 'feet' },
  ];
  const VN = ['A', 'B', 'C', 'D'];
  const LN = ['A', 'B', 'C', 'D', 'E', 'F'];
  const samePt = (a, b) => a[0] === b[0] && a[1] === b[1];
  const sqOf = (S) => (S.u === 'm' ? 'm²' : 'ft²');

  /**
   * Draw a rectangle with sides parallel to the axes. opts: {crossX, crossY, square, minSide, maxSide, lim}
   * Returns {x1,x2,y1,y2,w,h,verts} with verts A(x1,y1) B(x2,y1) C(x2,y2) D(x1,y2), counterclockwise from the lower left.
   */
  const drawRect = (r, opts) => {
    opts = opts || {};
    const lim = opts.lim || LIM;
    const minSide = opts.minSide || 2;
    const maxSide = opts.maxSide || 9;
    let x1, x2, y1, y2;
    let guard = 0;
    do {
      x1 = r.int(-lim, lim - minSide);
      x2 = r.int(x1 + minSide, Math.min(lim, x1 + maxSide));
      y1 = r.int(-lim, lim - minSide);
      y2 = opts.square ? y1 + (x2 - x1) : r.int(y1 + minSide, Math.min(lim, y1 + maxSide));
      guard++;
    } while (
      guard < 200 &&
      (y2 > lim ||
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
  /** Level 2 rectangle: crosses both axes, so its vertices sit in all four quadrants of a ±8 grid. */
  const hardRect = (r) => drawRect(r, { lim: HLIM, crossX: true, crossY: true, minSide: 3, maxSide: 12 });

  /**
   * Level 2 L-shape: a rectangle crossing both axes with one corner cut out (nw by nh).
   * Returns {B, pts (6 vertices A–F, counterclockwise), sides [{name, horiz, a, b, len, inner}], nw, nh, P, area}.
   */
  const drawL = (r) => {
    const B = drawRect(r, { lim: HLIM, crossX: true, crossY: true, minSide: 4, maxSide: 12 });
    const c = r.int(0, 3);
    const nw = r.int(1, B.w - 2),
      nh = r.int(1, B.h - 2);
    const P = B.verts[c],
      prev = B.verts[(c + 3) % 4],
      next = B.verts[(c + 1) % 4];
    const ix = P[0] === B.x2 ? P[0] - nw : P[0] + nw;
    const iy = P[1] === B.y2 ? P[1] - nh : P[1] + nh;
    const edgePt = (Q) => (Q[0] === P[0] ? [P[0], iy] : [ix, P[1]]);
    const pts = [];
    B.verts.forEach((v, i) => {
      if (i === c) pts.push(edgePt(prev), [ix, iy], edgePt(next));
      else pts.push(v);
    });
    const inner = [ix, iy];
    const sides = pts.map((p, i) => {
      const q = pts[(i + 1) % 6];
      const horiz = p[1] === q[1];
      const k = horiz ? 0 : 1;
      const a = Math.min(p[k], q[k]),
        b = Math.max(p[k], q[k]);
      return { name: LN[i] + LN[(i + 1) % 6], horiz, a, b, len: b - a, inner: samePt(p, inner) || samePt(q, inner) };
    });
    return { B, pts, sides, nw, nh, P: sides.reduce((s, x) => s + x.len, 0), area: B.w * B.h - nw * nh };
  };
  const lList = (L) => L.pts.map((p, i) => `${LN[i]} ${hl(pair(p[0], p[1]))}`).join(', ');
  const lPlane = (L) =>
    PLANE(
      Object.assign(lim2(HLIM), {
        series: [{ points: L.pts, polygon: true, labels: L.pts.map((p, i) => `${LN[i]} ${pair(p[0], p[1])}`) }],
        aria: `Coordinate plane showing an L-shaped polygon with vertices ${L.pts.map((p) => pair(p[0], p[1])).join(', ')}`,
      }),
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
  /** Length of a side when the absolute values are subtracted (the wrong move across an axis). */
  const subLen = (a, b) => Math.abs(Math.abs(a) - Math.abs(b));
  /** Diagnose a wrong side length typed for a side from a to b; null when no pattern matches. */
  const sideDiag = (got, a, b, side) => {
    if (got == null) return null;
    const cross = a < 0 && b > 0;
    if (cross && near(got, subLen(a, b), 0.001))
      return `For ${side}, you subtracted. ${dec(a)} and ${dec(b)} are on opposite sides of 0, so add their distances from 0: ${Math.abs(a)} + ${Math.abs(b)}.`;
    if (!cross && a !== 0 && b !== 0 && near(got, Math.abs(a) + Math.abs(b), 0.001))
      return `For ${side}, you added. ${dec(a)} and ${dec(b)} are on the same side of 0, so subtract: ${Math.max(Math.abs(a), Math.abs(b))} − ${Math.min(Math.abs(a), Math.abs(b))}.`;
    if (near(got, b - a + 1, 0.001) || near(got, b - a - 1, 0.001)) return `${side} is off by one. Count the spaces between grid lines from ${dec(a)} to ${dec(b)}, not the grid points.`;
    if (got < 0) return 'A length is never negative. Use absolute values.';
    return null;
  };
  /** Diagnose a wrong perimeter of an L-shape. */
  const lPerimWrong = (v, L, u) => {
    if (near(v, L.area, 0.001)) return `${L.area} is the area, the space inside. Perimeter adds the six side lengths.`;
    if (near(v, L.B.w * L.B.h, 0.001)) return 'That is the area of the large rectangle around the L. Perimeter is the distance around the edge.';
    if (near(v, L.B.w + L.B.h, 0.001)) return 'That is only half of the way around. Keep adding sides until you are back at the start.';
    const skipped = L.sides.find((s) => near(v, L.P - s.len, 0.001));
    if (skipped) return `You left out one side. An L-shaped room has six sides. Check ${skipped.name}.`;
    const crossed = L.sides.find((s) => s.a < 0 && s.b > 0 && near(v, L.P - s.len + subLen(s.a, s.b), 0.001));
    if (crossed) return `${crossed.name} crosses an axis, so its length is |${dec(crossed.a)}| + |${dec(crossed.b)}|. Add the two distances from 0.`;
    return `Find all six sides from the coordinates (${L.sides.map((s) => s.name).join(', ')}), then add them${u ? ' to get ' + u : ''}.`;
  };

  // ---------- Plot the missing vertex of a rectangle (plot). Hard: two given corners plus an area or perimeter clue, or two opposite corners, on a ±8 grid. ----------
  // ---------- Perimeter of a rectangle from its vertices (num). Hard: an L-shaped room with six sides across all four quadrants. ----------
  // ---------- Area of a rectangle or right triangle on the plane (num). Hard: area of an L-shaped floor (subtract or split). ----------
  // ---------- Side lengths, perimeter, and area (blanks). Hard: the two inside sides, perimeter, and area of an L-shape. ----------
  // ---------- Real perimeter with a scale (num). Hard: real area with a half-unit scale, on a ±8 grid. ----------
  // ---------- Identify the polygon and its real size (mc). Hard: real sides AND real area with a half-unit scale. ----------
  /** Level 2 error item: an L-shaped room where one side is left out or one axis-crossing side is subtracted. */
  const errorPerimeterL = (r) => {
    const L = drawL(r);
    const name = r.pick(NAMES);
    const room = r.pick(ROOMS);
    const crossing = L.sides.filter((s) => s.a < 0 && s.b > 0 && Math.abs(s.a) !== Math.abs(s.b));
    const kind = crossing.length && r.chance(0.5) ? 'cross' : 'skip';
    const bad = kind === 'cross' ? r.pick(crossing) : r.pick(L.sides.filter((s) => s.inner));
    const badLen = kind === 'cross' ? subLen(bad.a, bad.b) : 0;
    const shown = L.sides.filter((s) => kind === 'cross' || s !== bad);
    const lenOf = (s) => (s === bad ? badLen : s.len);
    const wrongP = shown.reduce((t, s) => t + lenOf(s), 0);
    const lineFor = (s) =>
      s === bad ? `${s.name}: ${Math.max(Math.abs(s.a), Math.abs(s.b))} − ${Math.min(Math.abs(s.a), Math.abs(s.b))} = ${badLen} units` : `${s.name}: ${sideWork(s.a, s.b)} units`;
    const work = shown.map(lineFor).join('<br>') + `<br>Perimeter = ${shown.map(lenOf).join(' + ')} = ${wrongP} units`;
    const other = r.pick(L.sides.filter((s) => s !== bad));
    const otherCross = other.a < 0 && other.b > 0;
    const ax = (s) => (s.horiz ? 'x' : 'y');
    const correctOpt =
      kind === 'cross'
        ? `${name} subtracted for ${bad.name}, but ${dec(bad.a)} and ${dec(bad.b)} are on opposite sides of the ${bad.horiz ? 'y' : 'x'}-axis. Add the distances from 0 instead.`
        : `${name} left out side ${bad.name}. The L-shaped room has six sides, but only five side lengths are added in the work.`;
    const dist = [
      {
        html: `The work for ${other.name} is wrong. ${name} should have ${otherCross ? 'subtracted' : 'added'} the absolute values of its ${ax(other)}-coordinates.`,
        why: `${other.name} is correct: ${sideWork(other.a, other.b)}. ${sideRule(other.a, other.b)} The mistake is somewhere else.`,
      },
      {
        html: `${name} should have subtracted the two short sides at the inside corner, because they cut into the room.`,
        why: 'The inside-corner sides are part of the edge of the room, so they belong in the perimeter. Subtracting them makes the total too small.',
      },
      {
        html: `${name} is correct. Every side length matches the coordinates, and the total is right.`,
        why:
          kind === 'cross'
            ? `Count the squares along ${bad.name} on the grid: there are ${bad.len}, not ${badLen}.`
            : `Count the sides in the work. An L-shape has six: ${L.sides.map((s) => s.name).join(', ')}.`,
      },
    ];
    const sh = shuffleOptions(r, [{ html: correctOpt, ok: true }].concat(dist), 0);
    return {
      type: 'error',
      skill: 'polygons-plane',
      lesson: '7-7',
      title: 'Find the L-shape perimeter mistake',
      prompt: `<p>${name} finds the perimeter of the L-shaped ${room}, with vertices ${lList(L)}.</p>${lPlane(L)}<p>What is the mistake?</p>`,
      work,
      options: sh.options,
      answer: sh.answer,
      fix: { label: 'Correct perimeter, in units: ', answer: L.P },
      hints: [
        'An L-shaped room has six sides. Check that every side is in the work and that each length matches the coordinates.',
        kind === 'cross'
          ? `Check ${bad.name}: it runs from ${ax(bad)} = ${dec(bad.a)} to ${ax(bad)} = ${dec(bad.b)}. ${sideRule(bad.a, bad.b)}`
          : `Count the sides in the work. The six sides are ${L.sides.map((s) => s.name).join(', ')}. ${bad.name} runs from ${ax(bad)} = ${dec(bad.a)} to ${ax(bad)} = ${dec(bad.b)}.`,
        `With every side correct, the perimeter is ${L.sides.map((s) => s.len).join(' + ')}. Add them.`,
      ],
      hintEs: 'Un cuarto en forma de L tiene seis lados. Revisa que cada lado esté en el trabajo y que cada longitud coincida con las coordenadas.',
      solution: `<p>${correctOpt} ${bad.name} = ${sideWork(bad.a, bad.b)} units. The six sides are ${L.sides.map((s) => s.len).join(' + ')} = <b>${L.P} units</b>, not ${wrongP}. Check: the perimeter of an L matches the large rectangle around it, 2 × (${L.B.w} + ${L.B.h}) = ${L.P}.</p>`,
      feedback: {
        correct: `Correct. With ${bad.name} = ${bad.len}, the perimeter is ${L.P} units.`,
        wrong(ans, d) {
          if (!d.mistakeOk) return (sh.options[ans.mistake] && sh.options[ans.mistake].why) || 'Check each side against the grid, and count the sides.';
          const got = parseNum(ans.fix);
          if (got != null && near(got, wrongP, 0.001)) return `You found the mistake, but ${wrongP} is ${name}'s wrong total. Fix ${bad.name} and add all six sides.`;
          if (got != null) {
            const msg = lPerimWrong(got, L, '');
            if (!/^Find all six/.test(msg)) return 'You found the mistake. ' + msg;
          }
          return `You found the mistake. Now add all six correct side lengths.`;
        },
      },
    };
  };

  // ---------- Error: a wrong side length leads to a wrong perimeter (error). Hard: an L-shaped room. ----------
  // ---------- Table: grid lengths to real lengths (table). Hard: half-unit scale, find every grid length and the perimeter too. ----------
  RX._lib = RX._lib || {};
  RX._lib['u7/gen-polygons'] = {
    G,
    V,
    shuffleOptions,
    NAMES,
    parseNum,
    near,
    dec,
    pair,
    hl,
    LIM,
    HLIM,
    PLANE,
    lim2,
    ROOMS,
    SCALES,
    HSCALES,
    VN,
    LN,
    samePt,
    sqOf,
    drawRect,
    rectPlane,
    hardRect,
    drawL,
    lList,
    lPlane,
    sideWork,
    sideRule,
    vertList,
    subLen,
    sideDiag,
    lPerimWrong,
    errorPerimeterL,
  };
})(typeof window !== 'undefined' ? window : globalThis);

/* js/units/u7/gen-polygons.js */
/* Zone 7 — Station Core. Lesson 7-7 Represent Polygons on the Coordinate Plane. */
(function (root) {
  'use strict';
  const RX = root.RX;
  const {
    G,
    V,
    shuffleOptions,
    NAMES,
    parseNum,
    near,
    dec,
    pair,
    hl,
    LIM,
    HLIM,
    PLANE,
    lim2,
    ROOMS,
    SCALES,
    HSCALES,
    VN,
    LN,
    samePt,
    sqOf,
    drawRect,
    rectPlane,
    hardRect,
    drawL,
    lList,
    lPlane,
    sideWork,
    sideRule,
    vertList,
    subLen,
    sideDiag,
    lPerimWrong,
    errorPerimeterL,
  } = RX._lib['u7/gen-polygons'];

  G.define('n7_missingVertex', (r, o) => {
    const hard = !!o.hard;
    const room = r.pick(ROOMS);
    const name = r.pick(NAMES);
    if (hard && r.chance(0.65)) {
      const R = hardRect(r);
      const s = r.int(0, 3);
      const gi = [s, (s + 1) % 4],
        mi = [(s + 2) % 4, (s + 3) % 4];
      const given = gi.map((i) => R.verts[i]);
      const missing = mi.map((i) => R.verts[i]);
      const horiz = s % 2 === 0;
      const Lg = horiz ? R.w : R.h,
        M = horiz ? R.h : R.w;
      const dir = ['above', 'to the left of', 'below', 'to the right of'][s];
      const move = ['up', 'left', 'down', 'right'][s];
      const isArea = r.chance(0.5);
      const clueVal = isArea ? Lg * M : 2 * (Lg + M);
      const gName = VN[gi[0]] + VN[gi[1]];
      const ga = horiz ? Math.min(given[0][0], given[1][0]) : Math.min(given[0][1], given[1][1]);
      const gb = horiz ? Math.max(given[0][0], given[1][0]) : Math.max(given[0][1], given[1][1]);
      const ax = horiz ? 'x' : 'y';
      return {
        type: 'plot',
        skill: 'polygons-plane',
        lesson: '7-7',
        title: 'Rebuild the room from a clue',
        prompt: `<p>${name} knows two corners of the rectangular ${room}: ${VN[gi[0]]} ${hl(pair(given[0][0], given[0][1]))} and ${VN[gi[1]]} ${hl(pair(given[1][0], given[1][1]))}. They are drawn in gray. The room lies ${dir} side ${gName}, and its ${isArea ? 'area' : 'perimeter'} is ${hl(clueVal + (isArea ? ' square units' : ' units'))}.</p><p>Plot the other two vertices, ${VN[mi[0]]} and ${VN[mi[1]]}.</p>`,
        xLabel: 'x',
        yLabel: 'y',
        xMin: -HLIM,
        xMax: HLIM,
        yMin: -HLIM,
        yMax: HLIM,
        given,
        givenLabels: gi.map((i) => VN[i]),
        points: missing,
        count: 2,
        hints: [
          `First find the length of side ${gName} from its coordinates. Then use the ${isArea ? 'area' : 'perimeter'} to find the length of the other side.`,
          `${gName} runs from ${ax} = ${dec(ga)} to ${ax} = ${dec(gb)}: ${sideWork(ga, gb)} units. ${isArea ? `The area is ${Lg} × (other side) = ${clueVal}.` : `Half the perimeter is ${clueVal} ÷ 2 = ${clueVal / 2}, and that is ${Lg} + (other side).`}`,
          `Find the other side: ${isArea ? `${clueVal} ÷ ${Lg}` : `${clueVal / 2} − ${Lg}`}. Then move that many units ${move} from ${VN[gi[0]]} and from ${VN[gi[1]]}.`,
        ],
        hintEs: `Primero halla la longitud del lado ${gName} con sus coordenadas. Luego usa ${isArea ? 'el área' : 'el perímetro'} para hallar la longitud del otro lado.`,
        solution: `<p>${gName} = ${sideWork(ga, gb)} units. ${isArea ? `Area = ${Lg} × other side = ${clueVal}, so the other side is ${clueVal} ÷ ${Lg} = ${M} units.` : `Perimeter = 2 × (${Lg} + other side) = ${clueVal}, so ${Lg} + other side = ${clueVal / 2} and the other side is ${clueVal / 2} − ${Lg} = ${M} units.`} The room lies ${dir} ${gName}, so move ${M} units ${move} from each given corner: <b>${VN[mi[0]]} ${pair(missing[0][0], missing[0][1])}</b> and <b>${VN[mi[1]]} ${pair(missing[1][0], missing[1][1])}</b>.</p>${rectPlane(R, lim2(HLIM))}`,
        feedback: {
          correct: `Correct. The other side is ${M} units, so ${VN[mi[0]]} ${pair(missing[0][0], missing[0][1])} and ${VN[mi[1]]} ${pair(missing[1][0], missing[1][1])} complete the room.`,
          wrong(ans, d) {
            const e = (d.extra || [])[0];
            if (!e) return `Place two points, one straight ${move} from each given corner.`;
            if (given.some((g) => samePt(g, e))) return `${pair(e[0], e[1])} is a corner you were given. Plot the two corners that are not drawn yet.`;
            const lined = horiz ? given.some((g) => g[0] === e[0]) : given.some((g) => g[1] === e[1]);
            if (!lined) return `${pair(e[0], e[1])} is not straight ${move} from ${VN[gi[0]]} or ${VN[gi[1]]}. Each missing corner shares ${horiz ? 'an x' : 'a y'}-coordinate with a given corner.`;
            const dd = horiz ? e[1] - given[0][1] : e[0] - given[0][0];
            const want = [M, -M, -M, M][s];
            if (dd === -want) return `That point is on the wrong side of ${gName}. The room lies ${dir} side ${gName}.`;
            const ad = Math.abs(dd);
            if (isArea) return `Your point makes the other side ${ad} units long. Then the area would be ${Lg} × ${ad} = ${Lg * ad}, not ${clueVal}. Divide the area by ${Lg}.`;
            if (ad === clueVal - Lg) return `You subtracted ${Lg} from the whole perimeter. The perimeter counts each side twice, so halve it first.`;
            return `Your point makes the other side ${ad} units long. Then the perimeter would be 2 × (${Lg} + ${ad}) = ${2 * (Lg + ad)}, not ${clueVal}. Half the perimeter is one ${Lg}-unit side plus one other side.`;
          },
        },
      };
    }
    const R = hard ? hardRect(r) : drawRect(r);
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
        xMin: -HLIM,
        xMax: HLIM,
        yMin: -HLIM,
        yMax: HLIM,
        given,
        givenLabels: given.map((p) => pair(p[0], p[1])),
        points: missing,
        count: 2,
        hints: [
          'In a rectangle with sides along the grid, each corner shares its x-coordinate with one neighbor and its y-coordinate with the other.',
          `The two given corners use x = ${dec(given[0][0])} and x = ${dec(given[1][0])}, and y = ${dec(given[0][1])} and y = ${dec(given[1][1])}. The missing corners mix those values the other way.`,
          `Pair the x-coordinate of ${pair(given[0][0], given[0][1])} with the y-coordinate of ${pair(given[1][0], given[1][1])} for one corner. Swap the roles for the other.`,
        ],
        hintEs: 'En un rectángulo con lados sobre la cuadrícula, cada esquina comparte su coordenada x con una esquina vecina y su coordenada y con la otra.',
        solution: `<p>The rectangle uses only two x-values (${dec(R.x1)} and ${dec(R.x2)}) and two y-values (${dec(R.y1)} and ${dec(R.y2)}). The given corners pair them one way; the missing corners pair them the other way: <b>${pair(missing[0][0], missing[0][1])}</b> and <b>${pair(missing[1][0], missing[1][1])}</b>. Each new corner lines up with a given corner across and up or down.</p>${rectPlane(R, lim2(HLIM))}`,
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
      hintEs: 'En un rectángulo, los lados opuestos miden lo mismo y las esquinas son ángulos rectos. El vértice que falta se alinea con dos de los vértices dados.',
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

  G.define('n7_perimeter', (r, o) => {
    const hard = !!o.hard;
    const ctx = r.pick([
      { what: 'heating cable', verb: 'runs along every wall of' },
      { what: 'safety railing', verb: 'goes all the way around' },
      { what: 'rope line', verb: 'marks the edge of' },
      { what: 'insulation strip', verb: 'seals the border of' },
    ]);
    const room = r.pick(ROOMS);
    const name = r.pick(NAMES);
    if (hard) {
      const L = drawL(r);
      const inner = L.sides.filter((s) => s.inner);
      return {
        type: 'num',
        skill: 'polygons-plane',
        lesson: '7-7',
        title: 'Perimeter of an L-shaped room',
        prompt: `<p>On the blueprint, the ${room} is an L-shaped polygon with vertices ${lList(L)}. Each grid unit is 1 meter. ${name} needs ${ctx.what} that ${ctx.verb} the room.</p>${lPlane(L)}<p>What is the perimeter of the room, in meters?</p>`,
        unit: 'm',
        answer: L.P,
        hints: [
          'This L-shaped room has six sides. Find each side from the coordinates: a horizontal side uses the x-coordinates, a vertical side uses the y-coordinates.',
          `Start with the two short sides at the inside corner. ${inner.map((s) => `${s.name}: ${sideWork(s.a, s.b)}`).join('. ')}. Find the other four sides the same way.`,
          `The six sides are ${L.sides.map((s) => s.len).join(', ')} units. Add them.`,
        ],
        hintEs: 'Este cuarto en forma de L tiene seis lados. Halla cada lado con las coordenadas: un lado horizontal usa las coordenadas x y un lado vertical usa las coordenadas y.',
        solution: `<p>${L.sides.map((s) => `${s.name}: ${sideWork(s.a, s.b)}`).join('. ')}. Perimeter = ${L.sides.map((s) => s.len).join(' + ')} = <b>${L.P} m</b>. Check: the cut-out corner moves two sides inward but does not change their total, so the perimeter matches the large rectangle around the L: 2 × (${L.B.w} + ${L.B.h}) = ${L.P}.</p>`,
        feedback: {
          correct: `Correct. The six sides add to ${L.P} meters of ${ctx.what}.`,
          wrong(ans, d) {
            if (d.value == null) return 'Type a number of meters.';
            return lPerimWrong(d.value, L, 'meters');
          },
        },
      };
    }
    const R = drawRect(r);
    const P = 2 * (R.w + R.h);
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
      hintEs: 'El perímetro es la distancia alrededor de la figura. Halla la longitud de un lado horizontal y de un lado vertical con las coordenadas.',
      solution: `<p>AB is horizontal: ${sideWork(R.x1, R.x2)} units. ${sideRule(R.x1, R.x2)} BC is vertical: ${sideWork(R.y1, R.y2)} units. ${sideRule(R.y1, R.y2)} Perimeter = 2 × (${R.w} + ${R.h}) = 2 × ${R.w + R.h} = <b>${P} m</b>. Counting grid squares along each wall gives the same lengths.</p>`,
      feedback: {
        correct: `Correct. 2 × (${R.w} + ${R.h}) = ${P} meters of ${ctx.what}.`,
        wrong(ans, d) {
          const v = d.value;
          if (v == null) return 'Type a number of meters.';
          if (near(v, R.w * R.h, 0.001)) return `${R.w} × ${R.h} is the area, the space inside. Perimeter adds the four side lengths.`;
          if (near(v, R.w + R.h, 0.001)) return `${R.w} + ${R.h} is only two of the four sides. A rectangle has two of each.`;
          const subW = subLen(R.x1, R.x2),
            subH = subLen(R.y1, R.y2);
          if (xCross && near(v, 2 * (subW + R.h), 0.001)) return `Side AB crosses the y-axis, so its length is |${dec(R.x1)}| + |${dec(R.x2)}| = ${R.w}, not ${subW}. Add the two distances from 0.`;
          if (yCross && near(v, 2 * (R.w + subH), 0.001)) return `Side BC crosses the x-axis, so its length is |${dec(R.y1)}| + |${dec(R.y2)}| = ${R.h}, not ${subH}. Add the two distances from 0.`;
          if (near(v, P + 4, 0.001) || near(v, P + 2, 0.001)) return 'Too long by a little. Count the spaces between grid lines along each side, not the grid points.';
          if (near(v, P - 4, 0.001) || near(v, P - 2, 0.001)) return 'Too short by a little. Count every grid space from one corner to the next.';
          return `Find AB from the x-coordinates ${dec(R.x1)} and ${dec(R.x2)}, and BC from the y-coordinates ${dec(R.y1)} and ${dec(R.y2)}. Then add all four sides.`;
        },
      },
    };
  });

  G.define('n7_area', (r, o) => {
    const hard = !!o.hard;
    const room = r.pick(ROOMS);
    const name = r.pick(NAMES);
    if (hard) {
      const L = drawL(r);
      const { B, nw, nh } = L;
      const big = B.w * B.h,
        cut = nw * nh;
      return {
        type: 'num',
        skill: 'polygons-plane',
        lesson: '7-7',
        title: 'Area of an L-shaped floor',
        prompt: `<p>${name} is ordering floor panels for the L-shaped ${room}. On the blueprint it has vertices ${lList(L)}. Each grid unit is 1 meter.</p>${lPlane(L)}<p>What is the area of the floor, in square meters?</p>`,
        unit: 'm²',
        answer: L.area,
        hints: [
          'Split the L into two rectangles, or find the area of the large rectangle around it and subtract the missing corner.',
          `The large rectangle runs from x = ${dec(B.x1)} to x = ${dec(B.x2)} (${sideWork(B.x1, B.x2)}) and from y = ${dec(B.y1)} to y = ${dec(B.y2)} (${sideWork(B.y1, B.y2)}). The missing corner is ${nw} units wide and ${nh} units tall.`,
          `Find ${B.w} × ${B.h} and ${nw} × ${nh}. Then subtract the corner from the large rectangle.`,
        ],
        hintEs: 'Divide la L en dos rectángulos, o halla el área del rectángulo grande que la rodea y réstale la esquina que falta.',
        solution: `<p>Large rectangle: ${B.w} × ${B.h} = ${big} m². Missing corner: ${nw} × ${nh} = ${cut} m². Area = ${big} − ${cut} = <b>${L.area} m²</b>. Splitting works too: a ${B.w}-by-${B.h - nh} rectangle (${B.w * (B.h - nh)} m²) plus a ${B.w - nw}-by-${nh} rectangle (${(B.w - nw) * nh} m²) = ${L.area} m².</p>`,
        feedback: {
          correct: `Correct. ${big} − ${cut} = ${L.area} square meters.`,
          wrong(ans, d) {
            const v = d.value;
            if (v == null) return 'Type a number of square meters.';
            if (near(v, big, 0.001)) return `${big} is the large rectangle. The L is missing a ${nw}-by-${nh} corner, so subtract it.`;
            if (near(v, big + cut, 0.001)) return 'You added the missing corner. It is not part of the floor, so subtract it.';
            if (near(v, cut, 0.001)) return 'That is only the missing corner. Find the large rectangle and take the corner away.';
            if (near(v, L.P, 0.001)) return `${L.P} is the perimeter, the distance around. Area counts the grid squares inside.`;
            if (near(v, subLen(B.x1, B.x2) * B.h - cut, 0.001) || near(v, B.w * subLen(B.y1, B.y2) - cut, 0.001))
              return 'One side of the large rectangle crosses an axis. Add the two distances from 0 for that side, do not subtract.';
            return `Find the large rectangle (${B.w} by ${B.h}) and the missing corner (${nw} by ${nh}). Area = large rectangle − corner.`;
          },
        },
      };
    }
    const tri = r.chance(0.35);
    const R = drawRect(r);
    const area = tri ? (R.w * R.h) / 2 : R.w * R.h;
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
      hintEs: tri
        ? 'El área de un triángulo es la mitad de la base por la altura. Los dos lados sobre la cuadrícula son la base y la altura.'
        : 'El área de un rectángulo es el largo por el ancho. Primero halla las longitudes de los dos lados con las coordenadas.',
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
          const subW = subLen(R.x1, R.x2),
            subH = subLen(R.y1, R.y2);
          if (R.x1 < 0 && R.x2 > 0 && near(v, (tri ? 0.5 : 1) * subW * R.h, 0.001))
            return `AB crosses the y-axis, so its length is |${dec(R.x1)}| + |${dec(R.x2)}| = ${R.w}. Add the two distances from 0.`;
          if (R.y1 < 0 && R.y2 > 0 && near(v, (tri ? 0.5 : 1) * R.w * subH, 0.001))
            return `${legV} crosses the x-axis, so its length is |${dec(R.y1)}| + |${dec(R.y2)}| = ${R.h}. Add the two distances from 0.`;
          return `Find AB from the x-coordinates and ${legV} from the y-coordinates. Then ${tri ? 'multiply and take half' : 'multiply'}.`;
        },
      },
    };
  });

  G.define('n7_sideBlanks', (r, o) => {
    const hard = !!o.hard;
    const room = r.pick(ROOMS);
    if (hard) {
      const L = drawL(r);
      const [s1, s2] = L.sides.filter((s) => s.inner);
      const axisOf = (s) => (s.horiz ? 'x' : 'y');
      const big = L.B.w * L.B.h;
      return {
        type: 'blanks',
        skill: 'polygons-plane',
        lesson: '7-7',
        title: 'Measure the L-shaped room',
        prompt: `<p>The ${room} is an L-shaped polygon with vertices ${lList(L)}.</p>${lPlane(L)}<p>Use the coordinates to find the two sides at the inside corner. Then find the perimeter and the area.</p>`,
        template: [`Side ${s1.name} = {0} units`, `Side ${s2.name} = {1} units`, 'Perimeter = {2} units', 'Area = {3} square units'],
        fields: [
          { label: s1.name, answer: s1.len, width: 'xs' },
          { label: s2.name, answer: s2.len, width: 'xs' },
          { label: 'perimeter', answer: L.P, width: 'xs' },
          { label: 'area', answer: L.area, width: 'xs' },
        ],
        hints: [
          `${s1.name} is ${s1.horiz ? 'horizontal, so use its x-coordinates' : 'vertical, so use its y-coordinates'}. ${s2.name} is ${s2.horiz ? 'horizontal, so use its x-coordinates' : 'vertical, so use its y-coordinates'}. The perimeter adds all six sides. The area is the large rectangle minus the missing corner.`,
          `${s1.name} runs from ${axisOf(s1)} = ${dec(s1.a)} to ${axisOf(s1)} = ${dec(s1.b)}. ${s2.name} runs from ${axisOf(s2)} = ${dec(s2.a)} to ${axisOf(s2)} = ${dec(s2.b)}. The large rectangle around the L is ${L.B.w} by ${L.B.h} units.`,
          `Perimeter: add all six side lengths. Area: ${L.B.w} × ${L.B.h} minus the missing corner, which measures ${s1.name} by ${s2.name}.`,
        ],
        hintEs: `${s1.name} es ${s1.horiz ? 'horizontal, así que usa sus coordenadas x' : 'vertical, así que usa sus coordenadas y'}. ${s2.name} es ${s2.horiz ? 'horizontal, así que usa sus coordenadas x' : 'vertical, así que usa sus coordenadas y'}. El perímetro suma los seis lados. El área es el rectángulo grande menos la esquina que falta.`,
        solution: `<p>${s1.name}: ${sideWork(s1.a, s1.b)}, so ${s1.name} = <b>${s1.len}</b> units. ${s2.name}: ${sideWork(s2.a, s2.b)}, so ${s2.name} = <b>${s2.len}</b> units. Perimeter = ${L.sides.map((s) => s.len).join(' + ')} = <b>${L.P}</b> units. Area = ${L.B.w} × ${L.B.h} − ${s1.len} × ${s2.len} = ${big} − ${s1.len * s2.len} = <b>${L.area}</b> square units. The two inside sides are exactly the size of the missing corner.</p>`,
        feedback: {
          correct: `Correct. Inside sides ${s1.len} and ${s2.len}, perimeter ${L.P}, area ${L.area}.`,
          wrong(ans, d) {
            const i = d.wrong[0];
            const got = parseNum(ans[i]);
            if (i <= 1) {
              const s = i === 0 ? s1 : s2;
              return sideDiag(got, s.a, s.b, s.name) || `${s.name} runs from ${dec(s.a)} to ${dec(s.b)} along the ${axisOf(s)}-axis. How many units is that?`;
            }
            if (got == null) return 'Type a number.';
            if (i === 2) return near(got, L.area, 0.001) ? `${L.area} is the area. Perimeter adds the six side lengths.` : lPerimWrong(got, L, '');
            if (near(got, big, 0.001)) return `${big} is the large rectangle. Subtract the missing ${s1.len}-by-${s2.len} corner.`;
            if (near(got, L.P, 0.001)) return `${L.P} is the perimeter. Area counts the squares inside.`;
            if (near(got, big + s1.len * s2.len, 0.001)) return 'You added the missing corner. Subtract it instead.';
            return `Area = ${L.B.w} × ${L.B.h} − ${s1.name} × ${s2.name}.`;
          },
        },
      };
    }
    const R = drawRect(r);
    const P = 2 * (R.w + R.h),
      A = R.w * R.h;
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
      hintEs: 'AB es horizontal, así que usa sus coordenadas x. BC es vertical, así que usa sus coordenadas y. Signos opuestos: suma los valores absolutos. Mismo signo: réstalos.',
      solution: `<p>AB: ${sideWork(R.x1, R.x2)}, so AB = <b>${R.w}</b> units. BC: ${sideWork(R.y1, R.y2)}, so BC = <b>${R.h}</b> units. Perimeter = 2 × (${R.w} + ${R.h}) = <b>${P}</b> units, the distance around. Area = ${R.w} × ${R.h} = <b>${A}</b> square units, the grid squares inside. ${sideRule(R.x1, R.x2)}</p>`,
      feedback: {
        correct: `Correct. Sides ${R.w} and ${R.h}, perimeter ${P}, area ${A}.`,
        wrong(ans, d) {
          const i = d.wrong[0];
          const got = parseNum(ans[i]);
          if (i <= 1) {
            const [a, b] = i === 0 ? [R.x1, R.x2] : [R.y1, R.y2];
            const side = i === 0 ? 'AB' : 'BC';
            return sideDiag(got, a, b, side) || `${side} runs from ${dec(a)} to ${dec(b)} along the ${i === 0 ? 'x' : 'y'}-axis. How many units is that?`;
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
})(typeof window !== 'undefined' ? window : globalThis);

/* js/units/u7/gen-polygons-2.js */
/* Zone 7 — Station Core. Lesson 7-7 Represent Polygons on the Coordinate Plane. */
(function (root) {
  'use strict';
  const RX = root.RX;
  const {
    G,
    V,
    shuffleOptions,
    NAMES,
    parseNum,
    near,
    dec,
    pair,
    hl,
    LIM,
    HLIM,
    PLANE,
    lim2,
    ROOMS,
    SCALES,
    HSCALES,
    VN,
    LN,
    samePt,
    sqOf,
    drawRect,
    rectPlane,
    hardRect,
    drawL,
    lList,
    lPlane,
    sideWork,
    sideRule,
    vertList,
    subLen,
    sideDiag,
    lPerimWrong,
    errorPerimeterL,
  } = RX._lib['u7/gen-polygons'];

  G.define('n7_scalePerimeter', (r, o) => {
    const hard = !!o.hard;
    const R = hard ? hardRect(r) : drawRect(r);
    const S = r.pick(hard ? HSCALES : SCALES);
    const P = 2 * (R.w + R.h);
    const ws = R.w * S.k,
      hs = R.h * S.k;
    const realP = P * S.k;
    const realA = ws * hs;
    const room = r.pick(ROOMS);
    const name = r.pick(NAMES);
    const sq = sqOf(S);
    const k = dec(S.k);
    return {
      type: 'num',
      skill: 'scale-design',
      lesson: '7-7',
      title: hard ? 'Real area from the blueprint' : 'Real perimeter from the blueprint',
      prompt: `<p>${name} designs the ${room} on a grid where ${hl(`1 unit = ${k} ${S.uu}`)}. The room has vertices ${vertList(R)}.</p>${rectPlane(R, hard ? lim2(HLIM) : null)}<p>${hard ? `What is the real area of the room, in square ${S.uu}?` : `What is the real perimeter of the room, in ${S.uu}?`}</p>`,
      unit: hard ? sq : S.u,
      answer: hard ? realA : realP,
      hints: [
        hard
          ? 'Find both side lengths in grid units, change each one to real length with the scale, then multiply.'
          : 'Find the perimeter in grid units first. Then use the scale: every grid unit stands for real length.',
        `AB = ${sideWork(R.x1, R.x2)} units and BC = ${sideWork(R.y1, R.y2)} units. In real life, AB = ${R.w} × ${k} = ${dec(ws)} ${S.u} and BC = ${R.h} × ${k} = ${dec(hs)} ${S.u}.`,
        hard ? `Area = ${dec(ws)} ${S.u} × ${dec(hs)} ${S.u}.` : `Perimeter = 2 × (${ws} + ${hs}) ${S.u}.`,
      ],
      hintEs: hard
        ? 'Halla los dos lados en unidades de la cuadrícula, convierte cada uno a longitud real con la escala y luego multiplícalos.'
        : 'Primero halla el perímetro en unidades de la cuadrícula. Luego usa la escala: cada unidad de la cuadrícula representa una longitud real.',
      solution: hard
        ? `<p>Grid lengths: AB = ${sideWork(R.x1, R.x2)} units, BC = ${sideWork(R.y1, R.y2)} units. Scale both sides: ${R.w} × ${k} = ${dec(ws)} ${S.u} and ${R.h} × ${k} = ${dec(hs)} ${S.u}. Real area = ${dec(ws)} × ${dec(hs)} = <b>${dec(realA)} ${sq}</b>. Each grid square is ${k} by ${k}, so one grid square covers ${dec(S.k * S.k)} ${sq}. That is why the grid area ${R.w * R.h} is multiplied by ${k} twice, not once.</p>`
        : `<p>Grid lengths: AB = ${sideWork(R.x1, R.x2)} units, BC = ${sideWork(R.y1, R.y2)} units. Grid perimeter = 2 × (${R.w} + ${R.h}) = ${P} units. Each unit is ${S.k} ${S.uu}, so the real perimeter is ${P} × ${S.k} = <b>${realP} ${S.u}</b>. Scaling the perimeter once is the same as scaling every side first.</p>`,
      feedback: {
        correct: hard ? `Correct. ${dec(ws)} × ${dec(hs)} = ${dec(realA)} square ${S.uu}.` : `Correct. ${P} units × ${S.k} = ${realP} ${S.uu}.`,
        wrong(ans, d) {
          const v = d.value;
          if (v == null) return 'Type a number.';
          if (hard) {
            if (near(v, R.w * R.h * S.k, 0.001)) return `You scaled the area only once. Both sides change by ${k}, so the area changes by ${k} × ${k} = ${dec(S.k * S.k)}.`;
            if (near(v, R.w * R.h, 0.001)) return `${R.w * R.h} is the area in grid squares. Each grid square is really ${k} ${S.u} by ${k} ${S.u}.`;
            if (near(v, realP, 0.001)) return `${dec(realP)} is the real perimeter. Area multiplies the two real side lengths.`;
            if (near(v, subLen(R.x1, R.x2) * S.k * hs, 0.001) || near(v, ws * subLen(R.y1, R.y2) * S.k, 0.001))
              return 'A side crosses an axis. For that side, add the two distances from 0 instead of subtracting.';
            return `Change each side to real length with the scale, ${k} ${S.u} per unit. Then multiply the two real lengths.`;
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

  G.define('n7_scaleMc', (r, o) => {
    const hard = !!o.hard;
    const kind = hard ? 'rect' : r.pick(['rect', 'rect', 'square', 'tri']);
    const R = hard ? hardRect(r) : drawRect(r, { square: kind === 'square' });
    const S = r.pick(hard ? HSCALES : SCALES);
    const room = r.pick(ROOMS);
    const ws = R.w * S.k,
      hs = R.h * S.k;
    const k = dec(S.k);
    const tv = [R.verts[0], R.verts[1], R.verts[3]];
    const pts = kind === 'tri' ? tv : R.verts;
    const names = kind === 'tri' ? ['A', 'B', 'C'] : VN;
    const listed = pts.map((p, i) => `${names[i]} ${hl(pair(p[0], p[1]))}`).join(', ');
    let opts;
    if (hard) {
      const sq = sqOf(S);
      const line = (a, b, ar) => `A rectangle, ${dec(a)} ${S.u} by ${dec(b)} ${S.u}, with a real area of ${dec(ar)} ${sq}`;
      const correct = line(ws, hs, ws * hs);
      const pool = [
        { html: line(ws, hs, R.w * R.h * S.k), why: `The sides are right, but the area was scaled only once. Each grid square is ${k} by ${k}, so multiply the two real sides.` },
        { html: line(ws, hs, 2 * (ws + hs)), why: 'The sides are right, but that number is the real perimeter, the distance around. Area multiplies the two real sides.' },
        { html: line((R.w + 1) * S.k, (R.h + 1) * S.k, (R.w + 1) * (R.h + 1) * S.k * S.k), why: 'Each side is one unit too long. Count the spaces between grid lines, not the grid points.' },
        { html: line(R.w, R.h, R.w * R.h), why: `Those are grid lengths and grid squares. Each unit stands for ${k} ${S.uu}, so scale both sides first.` },
      ].filter((x) => x.html !== correct);
      opts = [{ html: correct, ok: true }].concat(r.shuffle(pool).slice(0, 3));
    } else if (kind === 'square') {
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
    const plane = PLANE(
      Object.assign(hard ? lim2(HLIM) : {}, {
        series: [{ points: pts, polygon: true, labels: pts.map((p, i) => `${names[i]} ${pair(p[0], p[1])}`) }],
        aria: `Coordinate plane showing a ${shapeName} with vertices ${pts.map((p) => pair(p[0], p[1])).join(', ')}`,
      }),
    );
    return {
      type: 'mc',
      skill: 'scale-design',
      lesson: '7-7',
      title: hard ? 'Real size and real area' : 'What did the designer draw?',
      prompt: `<p>A blueprint uses the scale ${hl(`1 unit = ${k} ${S.uu}`)}. The ${room} has vertices ${listed}.</p>${plane}<p>Which statement describes the real ${room}?</p>`,
      options: sh.options,
      answer: sh.answer,
      hints: [
        hard
          ? 'Find each side in grid units from the coordinates. Change both to real lengths with the scale. Then multiply the real lengths for the area.'
          : `Count the vertices to name the shape. Then find each side in grid units from the coordinates.`,
        `AB runs from x = ${dec(R.x1)} to x = ${dec(R.x2)}: ${sideWork(R.x1, R.x2)} units. The vertical side runs from y = ${dec(R.y1)} to y = ${dec(R.y2)}: ${sideWork(R.y1, R.y2)} units.`,
        hard
          ? `Real sides: ${R.w} × ${k} and ${R.h} × ${k}. Then multiply those two real lengths and find the option that matches both.`
          : `Multiply each grid length by ${S.k}: ${R.w} × ${S.k} and ${R.h} × ${S.k}.`,
      ],
      hintEs: hard
        ? 'Halla cada lado en unidades de la cuadrícula con las coordenadas. Convierte los dos a longitudes reales con la escala. Luego multiplica las longitudes reales para hallar el área.'
        : 'Cuenta los vértices para nombrar la figura. Luego halla cada lado en unidades de la cuadrícula con las coordenadas.',
      solution: hard
        ? `<p>Grid lengths: ${sideWork(R.x1, R.x2)} and ${sideWork(R.y1, R.y2)}. Real lengths: ${R.w} × ${k} = ${dec(ws)} ${S.u} and ${R.h} × ${k} = ${dec(hs)} ${S.u}. Real area = ${dec(ws)} × ${dec(hs)} = ${dec(ws * hs)} ${sqOf(S)}. So the room is <b>${sh.options[sh.answer].html}</b>. The area uses the scale twice because both sides are scaled.</p>`
        : `<p>${pts.length} vertices${kind === 'tri' ? ', with a square corner at A, make a right triangle' : kind === 'square' ? ' and four equal sides make a square' : ' with two different side lengths make a rectangle'}. Grid lengths: ${sideWork(R.x1, R.x2)} and ${sideWork(R.y1, R.y2)}. Real lengths: ${R.w} × ${S.k} = ${ws} ${S.u} and ${R.h} × ${S.k} = ${hs} ${S.u}. So the room is <b>${sh.options[sh.answer].html}</b>.</p>`,
      feedback: {
        correct: hard ? `Correct. ${dec(ws)} by ${dec(hs)} ${S.u} covers ${dec(ws * hs)} ${sqOf(S)}.` : `Correct. ${R.w} and ${R.h} grid units become ${ws} and ${hs} ${S.uu}.`,
        wrong: (ans) => (sh.options[ans] && sh.options[ans].why) || 'Not that one. Find each side in grid units, then multiply by the scale.',
      },
    };
  });

  G.define('n7_errorPerimeter', (r, o) => {
    if (o.hard) return errorPerimeterL(r);
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
      wrongW = subLen(R.x1, R.x2);
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
      hintEs: 'Revisa la longitud de cada lado con la cuadrícula. Cuenta los espacios de una unidad a lo largo de AB y de BC.',
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

  G.define('n7_scaleTable', (r, o) => {
    const hard = !!o.hard;
    const R = hard ? hardRect(r) : drawRect(r);
    const S = r.pick(hard ? HSCALES : SCALES);
    const room = r.pick(ROOMS);
    const name = r.pick(NAMES);
    const k = dec(S.k);
    const P = 2 * (R.w + R.h);
    if (hard) {
      const inputs = [
        { id: 'g0', answer: R.w },
        { id: 'r0', answer: R.w * S.k },
        { id: 'g1', answer: R.h },
        { id: 'r1', answer: R.h * S.k },
        { id: 'gp', answer: P },
        { id: 'rp', answer: P * S.k },
      ];
      const ends = { 0: [R.x1, R.x2, 'AB'], 1: [R.y1, R.y2, 'BC'] };
      return {
        type: 'table',
        skill: 'scale-design',
        lesson: '7-7',
        title: 'Scale table with a half-unit scale',
        prompt: `<p>${name}'s blueprint of the ${room} uses the scale ${hl(`1 unit = ${k} ${S.uu}`)}. The rectangle has vertices ${vertList(R)}.</p>${rectPlane(R, lim2(HLIM))}<p>Find each grid length from the coordinates. Then complete the real column.</p>`,
        rows: [
          ['Measure', 'Grid (units)', `Real (${S.u})`],
          ['Side AB', '__IN:g0__', '__IN:r0__'],
          ['Side BC', '__IN:g1__', '__IN:r1__'],
          ['Perimeter', '__IN:gp__', '__IN:rp__'],
        ],
        inputs,
        hints: [
          `First find each grid length from the coordinates. Then real length = grid length × ${k}.`,
          `AB runs from x = ${dec(R.x1)} to x = ${dec(R.x2)}: ${sideWork(R.x1, R.x2)}. BC runs from y = ${dec(R.y1)} to y = ${dec(R.y2)}: ${sideWork(R.y1, R.y2)}.`,
          `Grid perimeter = 2 × (${R.w} + ${R.h}). Multiply each grid value by ${k} for the real column.`,
        ],
        hintEs: `Primero halla cada longitud en la cuadrícula con las coordenadas. Luego, longitud real = longitud en la cuadrícula × ${k}.`,
        solution: `<ul><li>AB: ${sideWork(R.x1, R.x2)} → <b>${R.w}</b> units → ${R.w} × ${k} = <b>${dec(R.w * S.k)} ${S.u}</b></li><li>BC: ${sideWork(R.y1, R.y2)} → <b>${R.h}</b> units → ${R.h} × ${k} = <b>${dec(R.h * S.k)} ${S.u}</b></li><li>Perimeter: 2 × (${R.w} + ${R.h}) = <b>${P}</b> units → ${P} × ${k} = <b>${dec(P * S.k)} ${S.u}</b></li></ul><p>Every grid unit stands for ${k} ${S.uu}, so every length, including the perimeter, is multiplied by ${k} once.</p>`,
        feedback: {
          correct: `Correct. Each grid unit is ${k} ${S.uu}, so every grid length is multiplied by ${k}.`,
          wrong(ans, d) {
            const id = String(d.wrong[0]);
            const inp = inputs.find((x) => x.id === id);
            const got = parseNum(ans[id]);
            if (got == null) return 'Type a number in each box.';
            if (id === 'g0' || id === 'g1') {
              const [a, b, side] = ends[id[1]];
              if (near(got, inp.answer * S.k, 0.001)) return `${dec(got)} is the real length. The grid column asks for units on the blueprint.`;
              return sideDiag(got, a, b, side) || `${side} runs from ${dec(a)} to ${dec(b)}. Count the units between them.`;
            }
            if (id === 'gp') {
              if (near(got, R.w + R.h, 0.001)) return `${R.w} + ${R.h} covers only two sides. Double it for all four.`;
              if (near(got, R.w * R.h, 0.001)) return `${R.w * R.h} is the area. Perimeter adds the four sides.`;
              return `Grid perimeter = 2 × (AB + BC).`;
            }
            const gridLen = inp.answer / S.k;
            if (near(got, gridLen, 0.001)) return `${dec(got)} is the grid length. Multiply by the scale, ${k}, for the real length.`;
            if (near(got, gridLen + S.k, 0.001)) return `Do not add the scale. Each of the ${gridLen} units stands for ${k} ${S.uu}, so multiply.`;
            if (id === 'rp' && near(got, (R.w + R.h) * S.k, 0.001)) return 'That scales only two sides. Scale the whole grid perimeter.';
            if (id === 'rp' && near(got, R.w * R.h * S.k * S.k, 0.001)) return 'That is the real area. Perimeter is the distance around.';
            return `Real value = grid value × ${k}.`;
          },
        },
      };
    }
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
      hintEs: `Longitud real = longitud en la cuadrícula × ${S.k}. Los lados opuestos de un rectángulo son iguales.`,
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

/* js/units/u7/gen-cave-lib.js */
/* Optional zone — Ice Cave. Harder, mixed-skill challenge generators (prefix nc_).
   Every generator honors o.hard (Level 2): eighths and improper fractions, mixed number forms, work-backward routes,
   two-step reflections, extra legs with decimal scales, and U-shaped figures with a scale. */
/* Shared helpers for gen-cave.js and gen-cave-2.js (split for size). */
(function (root) {
  'use strict';
  const RX = root.RX;
  const { G, V, shuffleOptions, NAMES, parseNum, near } = RX;
  const { dec, pair, quad, mixedHtml, mixedText, improperHtml, improperText } = RX.N7;
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
  const SCALES_HARD = [
    { k: 2.5, u: 'm', uu: 'meters' },
    { k: 25, u: 'm', uu: 'meters' },
    { k: 50, u: 'ft', uu: 'feet' },
    { k: 0.5, u: 'km', uu: 'kilometers' },
  ];
  const r3 = (x) => Math.round(x * 1000) / 1000;
  const samePt = (a, b) => a[0] === b[0] && a[1] === b[1];
  const nz = (r, lo, hi) => {
    const m = r.int(lo, hi);
    return r.chance(0.5) ? -m : m;
  };
  const dist1 = (a, b) => r3(Math.abs(a - b));
  /** Work for the distance between two coordinates on one axis (a, b any order). */
  const gapWork = (a, b, f) => {
    f = f || dec;
    const lo = Math.min(a, b),
      hi = Math.max(a, b);
    if (lo < 0 && hi > 0) return `|${f(lo)}| + |${f(hi)}| = ${f(Math.abs(lo))} + ${f(hi)} = ${f(r3(hi - lo))}`;
    const big = Math.abs(a) >= Math.abs(b) ? a : b,
      small = big === a ? b : a;
    return `|${f(big)}| − |${f(small)}| = ${f(Math.abs(big))} − ${f(Math.abs(small))} = ${f(r3(hi - lo))}`;
  };
  const quadName = (x, y) => {
    const q = quad(x, y);
    return q.length <= 3 ? 'Quadrant ' + q : 'the ' + q;
  };

  // ---------- Place an opposite, an absolute value, and a mixed number (nl). Hard: four readings in eighths, one is −|c|, one is an improper fraction. ----------
  // ---------- Elevation table: select all true statements about distance from sea level (ms). Hard: quarter values in mixed forms, plus a two-negatives comparison. ----------
  // ---------- Order markers on the axes by distance from the station (seq). Hard: five sites, mixed-number coordinates, no picture. ----------
  // ---------- Who compared two fractional-coordinate segments correctly? (who). Hard: one segment crosses an axis, the other stays on one side; four navigators; no picture. ----------
  // ---------- Two-step walk on the grid (plot). Hard: work backward from the end point on a larger grid. ----------
  // ---------- Error: reflected across the wrong axis, so the image landed in the wrong quadrant (error).
  //            Hard: two reflections (across one axis, then the other) with half-unit coordinates. The final point is right by luck; P′ is wrong. ----------
  const errorQuadrantHard = (r) => {
    const mag = () => (r.int(1, 5) + r.pick([0, 0.5])) * (r.chance(0.5) ? -1 : 1);
    let p;
    let guard = 0;
    do {
      p = [mag(), mag()];
      guard++;
    } while (guard < 50 && (Math.abs(p[0]) === Math.abs(p[1]) || (Number.isInteger(p[0]) && Number.isInteger(p[1]))));
    const first = r.pick(['x', 'y']);
    const second = first === 'x' ? 'y' : 'x';
    const flip = (q, c) => (c === 'x' ? [-q[0], q[1]] : [q[0], -q[1]]); // change the sign of coordinate c
    const P1 = flip(p, second); // across the first axis, the OTHER coordinate changes
    const P2 = flip(P1, first);
    const N1 = flip(p, first); // the student changes the coordinate named by the axis
    const N2 = flip(N1, second); // ...and lands on P2 by luck
    const ci = first === 'x' ? 1 : 0; // index that truly changes in step 1
    const trueDist = r3(2 * Math.abs(p[ci]));
    const wrongDist = r3(2 * Math.abs(p[1 - ci]));
    const mixDist = r3(Math.abs(p[0]) + Math.abs(p[1]));
    const PP = (q) => pair(q[0], q[1]);
    const name = r.pick(NAMES);
    const site = r.pick(SITES);
    const line = first === 'x' ? 'vertical' : 'horizontal';
    const opts = [
      {
        html: `In each step ${name} changed the sign of the coordinate named by the axis. Across the ${first}-axis, ${second} changes, so P′ = ${PP(P1)}. P″ is right only by luck, and P to P′ is ${trueDist} units.`,
        ok: true,
      },
      {
        html: `${name} is correct. P″ = ${PP(N2)} is exactly where two reflections, one across each axis, should land, so every step of the work is right.`,
        why: `P″ is right, but only by luck. ${name}'s P′ = ${PP(N1)} is the reflection across the ${second}-axis, not the ${first}-axis, so the P-to-P′ distance is wrong too.`,
      },
      {
        html: `${name} should have changed both signs in each step, so P′ = ${PP([-p[0], -p[1]])} and then P″ = ${PP(p)}, back where P started.`,
        why: 'Reflecting across one axis flips the point over one line, so exactly one coordinate changes sign in each step.',
      },
      {
        html: `Step 1 is right. Only the distance is wrong: it should be |${dec(p[0])}| + |${dec(p[1])}| = ${mixDist} units, using both coordinates of P.`,
        why: `Step 1 is not right: across the ${first}-axis, ${first} stays the same and ${second} changes. Also, P and P′ lie on one ${line} line, so the distance uses only the coordinate that changed.`,
      },
    ];
    const sh = shuffleOptions(r, opts, 0);
    return {
      type: 'error',
      skill: 'reflect',
      lesson: 'Challenge',
      xp: 20,
      title: 'Find the hidden reflection mistake',
      prompt: `<p>Vertex P of the ${site} is at ${hl(PP(p))}. ${name} reflects P across the <b>${first}-axis</b> to get P′, then reflects P′ across the <b>${second}-axis</b> to get P″. Then ${name} finds the distance from P to P′.</p>${PLANE(
        {
          series: [
            { points: [p], labels: ['P'] },
            { points: [N1, N2], color: '#C8553D', labels: ['P′ (' + name + ')', 'P″ (' + name + ')'] },
          ],
          aria: `Coordinate plane showing P at ${PP(p)}, ${name}'s P′ at ${PP(N1)}, and ${name}'s P″ at ${PP(N2)}`,
        },
      )}<p>What is the mistake?</p>`,
      work: `P ${PP(p)} → across the ${first}-axis → P′ ${PP(N1)}<br>P′ ${PP(N1)} → across the ${second}-axis → P″ ${PP(N2)}<br>P″ is in ${quadName(N2[0], N2[1])}.<br>Distance from P to P′ = |${dec(p[1 - ci])}| + |${dec(N1[1 - ci])}| = ${wrongDist} units`,
      options: sh.options,
      answer: sh.answer,
      fix: { label: 'Correct distance from P to P′, in units: ', answer: trueDist },
      hints: [
        'A reflection across the x-axis flips the point up or down, so only y changes sign. A reflection across the y-axis flips it left or right, so only x changes sign. Check each step on its own.',
        `Step 1 reflects P across the ${first}-axis, so ${second} changes sign: P′ = ${PP(P1)}. Compare that with ${name}'s P′.`,
        `P and P′ share ${first} = ${dec(p[1 - ci])} and sit on opposite sides of the ${first}-axis. The distance is |${dec(p[ci])}| + |${dec(P1[ci])}|.`,
      ],
      hintEs:
        'Una reflexión sobre el eje x voltea el punto hacia arriba o hacia abajo, así que solo cambia el signo de y. Una reflexión sobre el eje y lo voltea a la izquierda o a la derecha, así que solo cambia el signo de x. Revisa cada paso por separado.',
      solution: `<p>Across the ${first}-axis, ${first} stays and ${second} changes sign: P′ = <b>${PP(P1)}</b>. Across the ${second}-axis, ${first} changes sign: P″ = ${PP(P2)}. ${name} changed the coordinate named by the axis each time. The two swaps cancel out, so ${name}'s P″ is right, but ${name}'s P′ = ${PP(N1)} is wrong. P and the true P′ are on one ${line} line on opposite sides of the ${first}-axis: ${gapWork(p[ci], P1[ci])}, so the distance is <b>${trueDist} units</b>.</p>${PLANE(
        {
          series: [
            { points: [p], labels: ['P'] },
            { points: [P1, P2], color: '#1FA6A2', labels: ['P′', 'P″'] },
            { points: [N1], color: '#C8553D', labels: ['wrong P′'] },
          ],
          aria: `Coordinate plane showing P, the correct P′ ${PP(P1)}, P″ ${PP(P2)}, and the wrong P′ ${PP(N1)}`,
        },
      )}`,
      feedback: {
        correct: `Correct. Across the ${first}-axis, ${second} changes sign: P′ = ${PP(P1)}, ${trueDist} units from P. A right final answer can hide a wrong step.`,
        wrong(ans, d) {
          if (!d.mistakeOk) return (sh.options[ans.mistake] && sh.options[ans.mistake].why) || `Check step 1 by itself. Across the ${first}-axis, which coordinate changes?`;
          const got = parseNum(ans.fix);
          if (got != null && near(got, wrongDist, 0.001)) return `You found the mistake, but ${wrongDist} uses ${name}'s P′. Use the true P′ = ${PP(P1)}.`;
          if (got != null && near(got, trueDist / 2, 0.001))
            return `You found the mistake. ${dec(trueDist / 2)} is the distance from P to the ${first}-axis. P′ is just as far on the other side, so double it.`;
          if (got != null && near(got, mixDist, 0.001)) return `You found the mistake. P and P′ are on one ${line} line, so use only the ${second}-coordinates: |${dec(p[ci])}| + |${dec(P1[ci])}|.`;
          return `You found the mistake. P and P′ = ${PP(P1)} are on opposite sides of the ${first}-axis: add |${dec(p[ci])}| and |${dec(P1[ci])}|.`;
        },
      },
    };
  };
  // ---------- Scaled route table with a round trip (table). Hard: a third leg that stays on one side (subtract) and a decimal or larger scale. ----------
  // ---------- Perimeter of a four-quadrant rectangle or an L-shaped figure (num). Hard: a U-shaped figure (eight sides) on a scaled grid. ----------
  RX._lib = RX._lib || {};
  RX._lib['u7/gen-cave'] = {
    G,
    V,
    shuffleOptions,
    NAMES,
    parseNum,
    near,
    dec,
    pair,
    quad,
    mixedHtml,
    mixedText,
    improperHtml,
    improperText,
    hl,
    LIM,
    PLANE,
    SITES,
    SCALES,
    SCALES_HARD,
    r3,
    samePt,
    nz,
    dist1,
    gapWork,
    quadName,
    errorQuadrantHard,
  };
})(typeof window !== 'undefined' ? window : globalThis);

/* js/units/u7/gen-cave.js */
/* Optional zone — Ice Cave. Harder, mixed-skill challenge generators (prefix nc_).
   Every generator honors o.hard (Level 2): eighths and improper fractions, mixed number forms, work-backward routes,
   two-step reflections, extra legs with decimal scales, and U-shaped figures with a scale. */
(function (root) {
  'use strict';
  const RX = root.RX;
  const {
    G,
    V,
    shuffleOptions,
    NAMES,
    parseNum,
    near,
    dec,
    pair,
    quad,
    mixedHtml,
    mixedText,
    improperHtml,
    improperText,
    hl,
    LIM,
    PLANE,
    SITES,
    SCALES,
    SCALES_HARD,
    r3,
    samePt,
    nz,
    dist1,
    gapWork,
    quadName,
    errorQuadrantHard,
  } = RX._lib['u7/gen-cave'];

  G.define('nc_nlMixed', (r, o) => {
    const hard = !!o.hard;
    // normal: quarters on −4..4 (32 ticks); hard: odd eighths on −2..2 (32 ticks)
    const span = hard ? 2 : 4,
      den = hard ? 8 : 4,
      step = 1 / den;
    const nonInt = [];
    for (let k = -(span * den - 1); k <= span * den - 1; k++) if (k % den !== 0 && (!hard || k % 2 !== 0)) nonInt.push(k / den);
    let a, b, c, d, pts, mags;
    let guard = 0;
    do {
      a = r.pick(nonInt); // "the opposite of a"
      b = -Math.abs(r.pick(nonInt)); // "|b|" with b negative
      c = r.pick(nonInt); // normal: plain mixed number; hard: "−|c|"
      d = hard ? r.pick(nonInt) : null; // hard: written as an improper fraction (kept above 1 in size)
      pts = hard ? [-a, Math.abs(b), -Math.abs(c), d] : [-a, Math.abs(b), c];
      mags = (hard ? [a, b, c, d] : [a, b, c]).map(Math.abs);
      guard++;
    } while (guard < 100 && (new Set(pts).size < pts.length || new Set(mags).size < mags.length || (hard && Math.abs(d) < 1)));
    const T = mixedText;
    const name = r.pick(NAMES);
    const site = r.pick(SITES);
    const descHtml = hard
      ? [`the opposite of ${mixedHtml(a)}`, `|${mixedHtml(b)}|`, `−|${mixedHtml(c)}|`, improperHtml(d)]
      : [`the opposite of ${mixedHtml(a)}`, `|${mixedHtml(b)}|`, `${mixedHtml(c)}`];
    const why = hard
      ? ['switch the sign', 'distance from 0, always positive', 'find the distance from 0, then take its opposite', `${improperText(d)} is ${T(d)} as a mixed number`]
      : ['switch the sign', 'distance from 0, always positive', 'already a number'];
    const colors = ['#1FA6A2', '#F2A33A', '#17324D', '#C8553D'];
    const n = pts.length;
    return {
      type: 'nl',
      skill: 'rational-nl',
      lesson: 'Challenge',
      xp: 20,
      title: hard ? 'Place four cave readings' : 'Place three cave readings',
      prompt: `<p>${name} logs ${hard ? 'four' : 'three'} depth readings at the ${site}, measured from the cave floor line (0). They are written ${hard ? 'four' : 'three'} different ways:</p><ul>${descHtml.map((s) => `<li><b>${s}</b></li>`).join('')}</ul><p>Place all ${hard ? 'four' : 'three'} values on the number line.</p><p class="muted">${hard ? 'Each small tick is one eighth (0.125).' : 'Each small tick is one fourth (0.25).'}</p>`,
      min: -span,
      max: span,
      step,
      labelEvery: 1,
      count: n,
      points: pts,
      hints: [
        hard
          ? 'First turn each description into a single number. The opposite switches the sign. Absolute value is distance from 0, so it is never negative. A minus sign outside the bars, like −|x|, takes the opposite of that distance.'
          : 'First turn each description into a single number. The opposite switches the sign. Absolute value is distance from 0, so it is never negative.',
        hard
          ? `The opposite of ${T(a)} is ${T(-a)}. |${T(b)}| = ${T(Math.abs(b))}. −|${T(c)}| = −${T(Math.abs(c))}. ${improperText(d)} = ${T(d)}.`
          : `The opposite of ${T(a)} is ${T(-a)}. |${T(b)}| = ${T(Math.abs(b))}, because ${T(b)} is ${T(Math.abs(b))} units from 0.`,
        hard
          ? 'Each whole-number space has 8 ticks, so one tick is 1/8 and two ticks are 1/4. Start at the whole number, then count eighth ticks away from 0.'
          : 'Each whole-number space has 4 ticks: one tick is ¼, two ticks are ½, three ticks are ¾. Start at the whole number, then count ticks away from 0.',
      ],
      hintEs: hard
        ? 'Primero convierte cada descripción en un solo número. El opuesto cambia el signo. El valor absoluto es la distancia al 0, así que nunca es negativo. Un signo menos fuera de las barras, como −|x|, toma el opuesto de esa distancia.'
        : 'Primero convierte cada descripción en un solo número. El opuesto cambia el signo. El valor absoluto es la distancia al 0, así que nunca es negativo.',
      solution: `<p>${descHtml.map((s, i) => `${s} = <b>${mixedHtml(pts[i])}</b> (${why[i]})`).join('. ')}. Negative values go left of 0, positive values go right, and the fraction part tells how many ${hard ? 'eighth' : 'quarter'} ticks past the whole number.</p>${V.numberLine(
        {
          min: -span,
          max: span,
          step,
          labelEvery: 1,
          points: pts.map((v, i) => ({ v, label: T(v), color: colors[i] })),
          aria: `Number line showing ${pts.map(T).join(', ')}`,
        },
      )}`,
      feedback: {
        correct: `Correct. ${pts.map(T).join(', ')}: the opposite flips the sign and the absolute value drops it.`,
        wrong(ans, dd) {
          const e = (dd.extra || [])[0];
          const m = (dd.missing || [])[0];
          if (e != null) {
            if (near(e, a, 0.01)) return `${T(a)} is the original number. Its opposite is on the other side of 0.`;
            if (near(e, b, 0.01)) return `${T(b)} is the number inside the bars. |${T(b)}| asks how far it is from 0, and a distance is positive.`;
            if (!hard && near(e, -c, 0.01)) return `${T(c)} should keep its sign. Only the "opposite of" reading changes sign.`;
            if (hard && near(e, Math.abs(c), 0.01)) return `You found |${T(c)}| = ${T(Math.abs(c))}, but the minus sign outside the bars still applies. Take the opposite of that distance.`;
            if (hard && near(e, -d, 0.01)) return `${improperText(d)} keeps its sign. Rewrite it as a mixed number, but do not change which side of 0 it is on.`;
            if (m != null && near(Math.abs(e - m), step, 0.001))
              return `You are one tick away from a reading. Each tick is ${hard ? '1/8' : '1/4'}, so count the ticks again from the nearest whole number.`;
            return `${T(e)} is not one of the readings. Rewrite each description as one number first.`;
          }
          return m != null ? `You still need ${T(m)}. Count ${hard ? 'eighth' : 'quarter'} ticks from the nearest whole number.` : `Place exactly ${n} points.`;
        },
      },
    };
  });

  G.define('nc_msAbs', (r, o) => {
    const hard = !!o.hard;
    const labels = ['A', 'B', 'C', 'D', 'E'];
    const tie = r.chance(0.5);
    let vals;
    let guard = 0;
    do {
      vals = [];
      if (hard) {
        while (vals.length < 5) {
          const v = (r.int(1, 14) + r.pick([0.25, 0.5, 0.75])) * (r.chance(0.5) ? -1 : 1);
          if (!vals.includes(v)) vals.push(v);
        }
      } else {
        const pool = [];
        for (let v = -18; v <= 18; v++) if (v !== 0) pool.push(v);
        while (vals.length < 5) {
          const v = r.pick(pool);
          if (!vals.includes(v)) vals.push(v);
        }
      }
      if (tie) vals[4] = -vals[0];
      guard++;
    } while (guard < 100 && (vals.filter((v) => v < 0).length < 2 || vals.filter((v) => v > 0).length < 1 || new Set(vals).size < 5 || (!tie && new Set(vals.map(Math.abs)).size < 5)));
    // hard: two markers are written as mixed numbers (a tied pair is always written in different forms)
    const mixedAt = new Set(hard ? (tie ? [4, r.pick([1, 2, 3])] : r.pickN([0, 1, 2, 3, 4], 2)) : []);
    const F = (i, v) => (mixedAt.has(i) ? mixedHtml(v) : dec(v));
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
        why: `${M(minIdx)} is the lowest, but "farthest from sea level" means the largest absolute value. |${F(minIdx, vals[minIdx])}| = ${F(minIdx, abs[minIdx])}, and ${F(farIdx, maxAbs)} is larger.`,
      });
    if (abs[maxIdx] < maxAbs)
      cands.push({ html: `${M(maxIdx)} is the farthest from sea level`, why: `${M(maxIdx)} is the highest, not the farthest. ${M(farIdx)} is ${F(farIdx, maxAbs)} from sea level, below it.` });
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
      cands.push({ html: `|${F(big, vals[big])}| > |${F(small, vals[small])}|`, ok: true });
      cands.push({
        html: `${M(big)} is closer to sea level than ${M(small)}`,
        why: `Closer to sea level means a smaller absolute value. |${F(big, vals[big])}| = ${F(big, abs[big])} and |${F(small, vals[small])}| = ${F(small, abs[small])}, so ${M(small)} is closer.`,
      });
    }
    const tiePair = tie ? [0, 4] : null;
    if (tiePair) cands.push({ html: `${M(tiePair[0])} and ${M(tiePair[1])} are the same distance from sea level`, ok: true });
    else {
      const [j1, j2] = r.pickN([0, 1, 2, 3, 4], 2);
      cands.push({
        html: `${M(j1)} and ${M(j2)} are the same distance from sea level`,
        why: `|${F(j1, vals[j1])}| = ${F(j1, abs[j1])} and |${F(j2, vals[j2])}| = ${F(j2, abs[j2])}. Different absolute values mean different distances.`,
      });
    }
    // negative marker with a larger absolute value than a positive one: "is higher" is false
    const negI = vals.findIndex((v) => v < 0 && Math.abs(v) > Math.max(...vals.filter((x) => x > 0)));
    const posI = vals.findIndex((v) => v > 0);
    if (negI >= 0 && posI >= 0)
      cands.push({
        html: `${M(negI)} is higher than ${M(posI)} because ${F(negI, abs[negI])} > ${F(posI, abs[posI])}`,
        why: `${F(negI, abs[negI])} > ${F(posI, abs[posI])} compares distances from sea level, not heights. ${F(negI, vals[negI])} is below sea level, so it is lower than every positive elevation.`,
      });
    // hard: two negative markers. The one farther from 0 is lower (the next misconception up: "3 < 7, so −3 < −7").
    if (hard) {
      const negs = vals.map((v, i) => i).filter((i) => vals[i] < 0);
      const [u, w] = r.pickN(negs, 2);
      const lo = vals[u] < vals[w] ? u : w,
        hi = lo === u ? w : u;
      cands.push({ html: `${M(lo)} is lower than ${M(hi)}`, ok: true });
      cands.push({
        html: `${M(hi)} is lower than ${M(lo)} because ${F(hi, abs[hi])} < ${F(lo, abs[lo])}`,
        why: `For two negative numbers, the one farther from 0 is lower. ${F(lo, vals[lo])} is ${F(lo, abs[lo])} below sea level and ${F(hi, vals[hi])} is only ${F(hi, abs[hi])} below, so ${M(lo)} is lower.`,
      });
    }
    // dedupe and pick 5 with at least 2 true and 2 false
    const seen = new Set();
    const uniq = cands.filter((c) => (seen.has(c.html) ? false : (seen.add(c.html), true)));
    const trues = r.shuffle(uniq.filter((c) => c.ok));
    const falses = r.shuffle(uniq.filter((c) => !c.ok));
    const opts = trues.slice(0, Math.min(3, trues.length)).concat(falses.slice(0, 5 - Math.min(3, trues.length)));
    const okIdx = opts.map((o2, i) => (o2.ok ? i : -1)).filter((i) => i >= 0);
    const sh = shuffleOptions(r, opts, okIdx);
    const table = V.table([['Marker', 'Elevation (m)']].concat(vals.map((v, i) => [labels[i], F(i, v)])), { cls: 'compact' });
    return {
      type: 'ms',
      skill: 'abs-distance',
      lesson: 'Challenge',
      xp: 20,
      title: 'Which statements are true?',
      prompt: `<p>Five survey markers in the ${site} have these elevations. Sea level is 0.</p>${table}${hard ? '<p class="muted">Some elevations are decimals and some are mixed numbers. Compare them carefully.</p>' : ''}<p>Select <b>all</b> the statements that are true.</p>`,
      options: sh.options,
      answers: sh.answers,
      hints: [
        'Distance from sea level is the absolute value, so drop the sign. Lowest and highest use the signed numbers on a number line.',
        `The absolute values are ${vals.map((v, i) => `${labels[i]}: ${F(i, abs[i])}`).join(', ')}.`,
        `The lowest marker has the most negative elevation. The farthest from sea level has the largest absolute value, ${F(farIdx, maxAbs)}. Test each statement against these two ideas.`,
      ],
      hintEs: 'La distancia al nivel del mar es el valor absoluto, así que quita el signo. Para saber cuál está más bajo o más alto, usa los números con signo en la recta numérica.',
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

  G.define('nc_seqAbs', (r, o) => {
    const hard = !!o.hard;
    const n = hard ? 5 : 4;
    const labels = ['A', 'B', 'C', 'D', 'E'];
    const distOf = (p) => r3(Math.abs(p[0]) + Math.abs(p[1]));
    let pts;
    let guard = 0;
    do {
      if (hard) {
        pts = [];
        for (let i = 0; i < 5; i++) {
          const m = (r.int(0, 5) + r.pick([0.25, 0.5, 0.75])) * (r.chance(0.5) ? -1 : 1);
          pts.push(r.chance(0.5) ? [m, 0] : [0, m]);
        }
      } else {
        pts = [
          [-r.int(1, LIM), 0],
          [0, r.int(1, LIM)],
          [r.int(1, LIM), 0],
          [0, -r.int(1, LIM)],
        ];
      }
      guard++;
    } while (guard < 100 && (new Set(pts.map(distOf)).size < n || (hard && pts.filter((p) => p[0] + p[1] < 0).length < 2)));
    const d = pts.map(distOf);
    const C = hard ? mixedHtml : dec;
    const CT = hard ? mixedText : dec;
    const P = (p) => `(${C(p[0])}, ${C(p[1])})`;
    const PT = (p) => `(${CT(p[0])}, ${CT(p[1])})`;
    const coord = (p) => (p[0] !== 0 ? p[0] : p[1]); // the nonzero coordinate
    const nearFirst = r.chance(0.5);
    const idx = [...Array(n).keys()];
    const order = idx.slice().sort((x, y) => (nearFirst ? d[x] - d[y] : d[y] - d[x]));
    const sites = r.pickN(SITES, n);
    const items = pts.map((p, i) => ({ html: `<b>${sites[i]}</b> ${P(p)}`, rate: d[i] }));
    const where = (p) => (p[1] === 0 ? `${CT(Math.abs(p[0]))} units ${p[0] < 0 ? 'west (left)' : 'east (right)'}` : `${CT(Math.abs(p[1]))} units ${p[1] < 0 ? 'south (down)' : 'north (up)'}`);
    const p0 = pts[0];
    return {
      type: 'seq',
      skill: 'abs-value',
      lesson: 'Challenge',
      xp: 20,
      title: nearFirst ? 'Order the sites, nearest first' : 'Order the sites, farthest first',
      prompt: hard
        ? `<p>Five cave sites sit on the axes of the survey grid. The station is at the origin, (0, 0). There is no map this time: use the coordinates on each card. Put the sites in order from <b>${nearFirst ? 'nearest (top) to farthest (bottom)' : 'farthest (top) to nearest (bottom)'}</b> from the station.</p>`
        : `<p>Four cave sites sit on the axes of the survey grid. The station is at the origin, (0, 0). Put them in order from <b>${nearFirst ? 'nearest (top) to farthest (bottom)' : 'farthest (top) to nearest (bottom)'}</b> from the station.</p>${PLANE(
            {
              series: [{ points: pts, labels: sites.map((s, i) => labels[i]) }],
              aria: `Coordinate plane with four sites on the axes: ${pts.map((p) => pair(p[0], p[1])).join(', ')}`,
            },
          )}<p class="muted">${sites.map((s, i) => `${labels[i]} = ${s}`).join(' · ')}</p>`,
      items,
      order,
      hints: [
        'A point on an axis has one coordinate equal to 0. Its distance from the origin is the absolute value of the other coordinate.',
        `For example, ${PT(p0)} is |${CT(coord(p0))}| = ${CT(d[0])} units from the station. A negative coordinate does not mean a shorter distance.`,
        `The distances are ${pts.map((p, i) => `${sites[i]}: ${CT(d[i])}`).join(', ')}. ${nearFirst ? 'Smallest' : 'Largest'} goes on top.`,
      ],
      hintEs: 'Un punto sobre un eje tiene una coordenada igual a 0. Su distancia al origen es el valor absoluto de la otra coordenada.',
      solution: `<p>${pts.map((p, i) => `${sites[i]} ${P(p)} is ${where(p)}, so ${CT(d[i])} units away`).join('. ')}. From ${nearFirst ? 'nearest to farthest' : 'farthest to nearest'}: <b>${order.map((i) => sites[i]).join(', ')}</b>. Distance uses absolute value, so the direction (the sign) does not matter.</p>`,
      feedback: {
        correct: `Correct. Distances ${order.map((i) => CT(d[i])).join(', ')}: absolute value ignores direction.`,
        wrong(ans) {
          const a = (Array.isArray(ans) ? ans : []).join();
          if (a === order.slice().reverse().join()) return `Your order is backward. The ${nearFirst ? 'nearest' : 'farthest'} site goes on top.`;
          const s = pts.map(coord);
          if (new Set(s).size === n) {
            const bySigned = idx.slice().sort((x, y) => s[x] - s[y]);
            if (a === bySigned.join() || a === bySigned.slice().reverse().join())
              return 'You ordered the signed coordinates, as on a number line. Distance from the station is the absolute value, so a negative coordinate far from 0 is far away.';
          }
          return 'At least one site is out of place. Find each distance as the absolute value of the nonzero coordinate. A larger negative number is farther away, not closer.';
        },
      },
    };
  });

  G.define('nc_whoFraction', (r, o) => {
    const hard = !!o.hard;
    const FR = [0.5, 1.5, 2.5, 3.5, 1.25, 1.75, 2.25, 2.75, 0.75, 3.25];
    const FRH = [0.5, 0.75, 1.25, 1.375, 1.75, 2.125, 2.25, 2.625, 2.75, 3.25, 3.5, 3.875];
    let ax, bx, ay, by, L1, L2;
    let guard = 0;
    do {
      if (hard) {
        ax = -r.pick(FRH);
        bx = r.pick(FRH);
        const s = r.chance(0.5) ? -1 : 1;
        ay = s * r.pick(FRH);
        by = s * r.pick(FRH);
      } else {
        ax = -r.pick(FR);
        bx = r.chance(0.5) ? r.pick(FR) : r.int(1, 4);
        ay = -(r.chance(0.5) ? r.pick(FR) : r.int(1, 4));
        by = r.pick(FR);
      }
      L1 = dist1(ax, bx);
      L2 = dist1(ay, by);
      guard++;
    } while (guard < 100 && (Math.abs(L1 - L2) < 0.01 || L1 > 7 || L2 > 7 || Math.abs(Math.abs(ax) - Math.abs(bx)) < 0.01 || Math.abs(Math.abs(ay) - Math.abs(by)) < 0.01));
    const y0 = nz(r, 1, 4),
      x0 = nz(r, 1, 4);
    const p1 = [ax, y0],
      q1 = [bx, y0];
    const p2 = [x0, ay],
      q2 = [x0, by];
    const H = mixedHtml,
      T = mixedText;
    const P = (p) => `(${H(p[0])}, ${H(p[1])})`;
    const PT = (p) => `(${T(p[0])}, ${T(p[1])})`;
    const longer = L1 > L2 ? 1 : 2;
    /** Work a navigator writes for one segment: add or subtract the absolute values of its two ends. */
    const addW = (a, b) => ({ html: `|${H(a)}| + |${H(b)}| = ${H(r3(Math.abs(a) + Math.abs(b)))}`, v: r3(Math.abs(a) + Math.abs(b)) });
    const subW = (a, b) => {
      const big = Math.abs(a) >= Math.abs(b) ? a : b,
        small = big === a ? b : a;
      const v = r3(Math.abs(big) - Math.abs(small));
      return { html: `|${H(big)}| − |${H(small)}| = ${H(v)}`, v };
    };
    const endW = (b) => ({ html: `end only, |${H(b)}| = ${H(Math.abs(b))}`, v: Math.abs(b) });
    const concl = (v1, v2) => (v1 > v2 ? '<b>Segment 1</b> is longer' : v1 < v2 ? '<b>Segment 2</b> is longer' : 'the two segments are <b>the same length</b>');
    const card = (w1, w2) => `Segment 1: ${w1.html}. Segment 2: ${w2.html}. So ${concl(w1.v, w2.v)}.`;
    const names = r.pickN(NAMES, hard ? 4 : 3);
    const ok1 = addW(ax, bx),
      ok2 = hard ? subW(ay, by) : addW(ay, by);
    const opts = [{ title: names[0], html: card(ok1, ok2), ok: true }];
    if (hard) {
      const side = ay < 0 ? 'negative' : 'positive';
      opts.push(
        {
          title: names[1],
          html: card(addW(ax, bx), addW(ay, by)),
          why: `${names[1]} added for both segments. Segment 2 stays on one side of the x-axis (both y-coordinates are ${side}), so its length is the difference of the two distances from 0: ${T(L2)}, not ${T(r3(Math.abs(ay) + Math.abs(by)))}.`,
        },
        {
          title: names[2],
          html: card(subW(ax, bx), subW(ay, by)),
          why: `${names[2]} subtracted for both segments. Segment 1 crosses the y-axis (${T(ax)} is negative and ${T(bx)} is positive), so it has a piece on each side of 0. Add the two distances: ${T(L1)}.`,
        },
        {
          title: names[3],
          html: card(subW(ax, bx), addW(ay, by)),
          why: `${names[3]} switched the two rules. Segment 1 crosses an axis, so add. Segment 2 stays on one side of an axis, so subtract.`,
        },
      );
    } else {
      opts.push(
        {
          title: names[1],
          html: card(subW(ax, bx), subW(ay, by)),
          why: `${names[1]} subtracted the absolute values. Both segments cross an axis, so each one has a piece on each side of 0. Add the two distances from 0: ${T(L1)} and ${T(L2)}.`,
        },
        {
          title: names[2],
          html: card(endW(bx), endW(by)),
          why: `${names[2]} used only the positive endpoint of each segment and ignored the part on the negative side. The lengths are ${T(L1)} and ${T(L2)}.`,
        },
      );
    }
    const sh = shuffleOptions(r, opts, 0);
    return {
      type: 'who',
      skill: 'distance-plane',
      lesson: 'Challenge',
      xp: 20,
      title: 'Which rope is longer?',
      prompt: `<p>Two guide ropes are stretched across the cave grid. <b>Segment 1</b> runs from <b>${P(p1)}</b> to <b>${P(q1)}</b>. <b>Segment 2</b> runs from <b>${P(p2)}</b> to <b>${P(q2)}</b>.</p>${
        hard
          ? ''
          : PLANE({
              xMin: -5,
              xMax: 5,
              yMin: -5,
              yMax: 5,
              series: [
                { points: [p1, q1], line: true, labels: ['1', '1'] },
                { points: [p2, q2], line: true, color: '#F2A33A', labels: ['2', '2'] },
              ],
              aria: `Coordinate plane showing horizontal Segment 1 from ${PT(p1)} to ${PT(q1)} and vertical Segment 2 from ${PT(p2)} to ${PT(q2)}`,
            })
      }<p>${hard ? 'Four navigators compare the two ropes without a map.' : 'Three navigators compare the two ropes.'} Who is correct?</p>`,
      options: sh.options,
      answer: sh.answer,
      layout: 'cards',
      hints: hard
        ? [
            'Segment 1 is horizontal, so use its x-coordinates. Segment 2 is vertical, so use its y-coordinates. First check each segment: does it cross an axis, or stay on one side?',
            `Segment 1: ${T(ax)} and ${T(bx)} have opposite signs, so add the absolute values. Segment 2: ${T(ay)} and ${T(by)} have the same sign, so subtract the smaller absolute value from the larger.`,
            `Segment 1: ${T(Math.abs(ax))} + ${T(bx)}. Segment 2: ${T(Math.max(Math.abs(ay), Math.abs(by)))} − ${T(Math.min(Math.abs(ay), Math.abs(by)))}. Use a common denominator, then compare the two lengths.`,
          ]
        : [
            'Segment 1 is horizontal, so its length comes from the x-coordinates. Segment 2 is vertical, so use the y-coordinates. Fractions work the same way as integers.',
            `Segment 1: ${T(ax)} and ${T(bx)} have opposite signs, so add the absolute values: ${T(Math.abs(ax))} + ${T(bx)}.`,
            `Segment 2: ${T(Math.abs(ay))} + ${T(by)}. Now compare the two totals.`,
          ],
      hintEs: hard
        ? 'El segmento 1 es horizontal, así que usa sus coordenadas x. El segmento 2 es vertical, así que usa sus coordenadas y. Primero revisa cada segmento: ¿cruza un eje o se queda de un solo lado?'
        : 'El segmento 1 es horizontal, así que su longitud sale de las coordenadas x. El segmento 2 es vertical, así que usa las coordenadas y. Las fracciones funcionan igual que los números enteros.',
      solution: `<p>${names[0]} is correct. Segment 1: ${gapWork(ax, bx, T)} units. Segment 2: ${gapWork(ay, by, T)} units. ${T(Math.max(L1, L2))} > ${T(Math.min(L1, L2))}, so <b>Segment ${longer}</b> is longer by ${T(r3(Math.abs(L1 - L2)))} unit${Math.abs(L1 - L2) === 1 ? '' : 's'}. ${
        hard
          ? 'A segment that crosses an axis has a piece on each side of 0, so add the distances from 0. A segment that stays on one side overlaps itself from 0, so subtract.'
          : 'Subtracting the absolute values or using only one endpoint leaves out the part of the rope on the other side of the axis.'
      }</p>`,
      feedback: {
        correct: `Correct. ${T(L1)} and ${T(L2)}: ${hard ? 'add when a segment crosses an axis, subtract when it stays on one side' : 'add the distances from 0 when a segment crosses an axis'}.`,
        wrong(ans) {
          const op = sh.options[ans];
          return (op && op.why) || 'Check each segment: if its two ends are on opposite sides of 0, add the distances from 0; if they are on the same side, subtract.';
        },
      },
    };
  });
})(typeof window !== 'undefined' ? window : globalThis);

/* js/units/u7/gen-cave-2.js */
/* Optional zone — Ice Cave. Harder, mixed-skill challenge generators (prefix nc_).
   Every generator honors o.hard (Level 2): eighths and improper fractions, mixed number forms, work-backward routes,
   two-step reflections, extra legs with decimal scales, and U-shaped figures with a scale. */
(function (root) {
  'use strict';
  const RX = root.RX;
  const {
    G,
    V,
    shuffleOptions,
    NAMES,
    parseNum,
    near,
    dec,
    pair,
    quad,
    mixedHtml,
    mixedText,
    improperHtml,
    improperText,
    hl,
    LIM,
    PLANE,
    SITES,
    SCALES,
    SCALES_HARD,
    r3,
    samePt,
    nz,
    dist1,
    gapWork,
    quadName,
    errorQuadrantHard,
  } = RX._lib['u7/gen-cave'];

  G.define('nc_plotDouble', (r, o) => {
    const hard = !!o.hard;
    const lim = hard ? 8 : LIM;
    const start = [nz(r, 1, lim - 1), nz(r, 1, lim - 1)];
    // each move crosses an axis and ends inside the grid
    const endX = -Math.sign(start[0]) * r.int(1, lim);
    const endY = -Math.sign(start[1]) * r.int(1, lim);
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
    const P = (p) => pair(p[0], p[1]);
    const UNDO = { left: 'right', right: 'left', up: 'down', down: 'up' };
    const ux = UNDO[dirX],
      uy = UNDO[dirY];
    const undo2 = horizontalFirst ? `${dy} units ${uy}` : `${dx} units ${ux}`; // undoes move 2 (done first when working backward)
    const undo1 = horizontalFirst ? `${dx} units ${ux}` : `${dy} units ${uy}`; // undoes move 1
    const fwd = [end[0] + (endX - start[0]), end[1] + (endY - start[1])]; // the moves walked forward again from the end
    const grid = (o2) => V.graph(Object.assign({ xMin: -lim, xMax: lim, yMin: -lim, yMax: lim, size: 260 }, o2));
    const target = hard ? start : end;
    const given = hard ? end : start;
    const route = grid({
      series: [
        { points: [given], color: '#5B6B7A', labels: [P(given)] },
        { points: [start, mid, end], line: true, labels: [hard ? P(start) : '', P(mid), hard ? '' : P(end)] },
      ],
      aria: `Coordinate plane showing the route from ${P(start)} through ${P(mid)} to ${P(end)}`,
    });
    const crossX = `${Math.abs(start[0])} units to reach the y-axis, then ${Math.abs(endX)} more`;
    const crossY = `${Math.abs(start[1])} units to reach the x-axis, then ${Math.abs(endY)} more`;
    return {
      type: 'plot',
      skill: 'plot-points',
      lesson: 'Challenge',
      xp: 20,
      title: hard ? 'Work the route backward' : 'Follow the two-step route',
      prompt: hard
        ? `<p>${name} walked from the ${s1} to the ${s2}. The route was: walk ${hl(move1)}, then walk ${hl(move2)}. ${name} ended at the ${s2}, ${hl(P(end))}, shown in gray.</p><p>Plot the ${s1}, where ${name} started.</p>`
        : `<p>${name} starts at the ${s1}, ${hl(P(start))}, shown in gray. The route to the ${s2} is: walk ${hl(move1)}, then walk ${hl(move2)}.</p><p>Plot the point where ${name} ends.</p>`,
      xLabel: 'x',
      yLabel: 'y',
      xMin: -lim,
      xMax: lim,
      yMin: -lim,
      yMax: lim,
      given: [given],
      givenLabels: [P(given)],
      points: [target],
      count: 1,
      hints: hard
        ? [
            'Work backward. Undo the last move first, then the first move. To undo a move, go the same number of units in the opposite direction.',
            `Undo "${move2}": from ${P(end)}, go ${undo2}. That puts you at ${P(mid)}.`,
            `Now undo "${move1}": from ${P(mid)}, go ${undo1}. Count to the ${horizontalFirst ? 'y' : 'x'}-axis first, then keep counting past it.`,
          ]
        : [
            'Left or right changes only x. Up or down changes only y. Do one move at a time.',
            `After the first move (${move1}) ${name} is at ${P(mid)}. ${horizontalFirst ? `Moving ${dirX} from x = ${dec(start[0])} crosses the y-axis: ${crossX}.` : `Moving ${dirY} from y = ${dec(start[1])} crosses the x-axis: ${crossY}.`}`,
            `Now do the second move (${move2}) from ${P(mid)}. ${horizontalFirst ? `Count ${Math.abs(start[1])} spaces ${dirY} to reach the x-axis, then keep counting.` : `Count ${Math.abs(start[0])} spaces ${dirX} to reach the y-axis, then keep counting.`}`,
          ],
      hintEs: hard
        ? 'Trabaja hacia atrás. Deshaz primero el último movimiento y después el primero. Para deshacer un movimiento, avanza el mismo número de unidades en la dirección opuesta.'
        : 'Moverse a la izquierda o a la derecha cambia solo x. Moverse hacia arriba o hacia abajo cambia solo y. Haz un movimiento a la vez.',
      solution: hard
        ? `<p>Work backward from the end, ${P(end)}. Undo "${move2}" by going ${undo2}: now at ${P(mid)}. Undo "${move1}" by going ${undo1}: ${name} started at <b>${P(start)}</b>, in ${quadName(start[0], start[1])}. Check by walking forward: from ${P(start)}, ${move1} reaches ${P(mid)}, and ${move2} reaches ${P(end)}.</p>${route}`
        : `<p>Start ${P(start)}. ${horizontalFirst ? `Move ${dx} ${dirX}: x goes from ${dec(start[0])} to ${dec(endX)} (${Math.abs(start[0])} units to the axis, ${Math.abs(endX)} past it). Now at ${P(mid)}. Move ${dy} ${dirY}: y goes from ${dec(start[1])} to ${dec(endY)}.` : `Move ${dy} ${dirY}: y goes from ${dec(start[1])} to ${dec(endY)} (${Math.abs(start[1])} units to the axis, ${Math.abs(endY)} past it). Now at ${P(mid)}. Move ${dx} ${dirX}: x goes from ${dec(start[0])} to ${dec(endX)}.`} ${name} ends at <b>${P(end)}</b>, in ${quadName(end[0], end[1])}. Check: |${dec(start[0])}| + |${dec(endX)}| = ${dx} and |${dec(start[1])}| + |${dec(endY)}| = ${dy}.</p>${route}`,
      feedback: {
        correct: hard
          ? `Correct. ${P(start)}: undoing ${undo2} and then ${undo1} from the end brings ${name} back to the start.`
          : `Correct. ${P(end)}: ${dx} ${dirX} and ${dy} ${dirY} from the start, crossing both axes.`,
        wrong(ans, d) {
          const e = (d.extra || [])[0];
          if (!e) return hard ? 'Place one point: the starting spot.' : 'Place one point: the spot after both moves.';
          if (hard) {
            if (samePt(e, mid)) return `${P(e)} is where you are after undoing only the last move. Now undo "${move1}" too.`;
            if (samePt(e, end)) return 'That is the end point. Undo both moves to find where the walk started.';
            if (samePt(e, fwd)) return `You walked the moves forward from the end. To work backward, go the opposite way: ${ux} instead of ${dirX}, ${uy} instead of ${dirY}.`;
            if (e[0] === start[1] && e[1] === start[0]) return 'You swapped x and y. Left or right changes the first coordinate; up or down changes the second.';
            if (e[1] === start[1] && e[0] !== start[0]) return `The y is right. For x, undo "${dx} units ${dirX}" by going ${dx} units ${ux} from x = ${dec(endX)}, crossing the y-axis.`;
            if (e[0] === start[0] && e[1] !== start[1]) return `The x is right. For y, undo "${dy} units ${dirY}" by going ${dy} units ${uy} from y = ${dec(endY)}, crossing the x-axis.`;
            return 'Undo one move at a time, last move first, and go the opposite direction each time.';
          }
          if (samePt(e, mid)) return `${P(e)} is where ${name} is after the first move only. Now do the second move: ${move2}.`;
          if (samePt(e, start)) return 'That is the starting point. Follow both moves.';
          if (e[0] === end[1] && e[1] === end[0]) return 'You swapped x and y. Left or right changes the first coordinate; up or down changes the second.';
          if (e[1] === endY && e[0] !== endX) {
            const wrongWay = Math.sign(e[0] - start[0]) !== Math.sign(endX - start[0]);
            return wrongWay
              ? `The y is right, but "${dirX}" means ${dirX === 'left' ? 'toward smaller x' : 'toward larger x'}.`
              : `The y is right. For x, count ${dx} spaces from ${dec(start[0])}: ${Math.abs(start[0])} to reach 0, then the rest.`;
          }
          if (e[0] === endX && e[1] !== endY) {
            const wrongWay = Math.sign(e[1] - start[1]) !== Math.sign(endY - start[1]);
            return wrongWay
              ? `The x is right, but "${dirY}" means ${dirY === 'down' ? 'toward smaller y' : 'toward larger y'}.`
              : `The x is right. For y, count ${dy} spaces from ${dec(start[1])}: ${Math.abs(start[1])} to reach 0, then the rest.`;
          }
          return `Do one move at a time. ${move1} changes ${horizontalFirst ? 'x' : 'y'} only; then ${move2} changes ${horizontalFirst ? 'y' : 'x'} only.`;
        },
      },
    };
  });

  G.define('nc_errorQuadrant', (r, o) => {
    if (o.hard) return errorQuadrantHard(r);
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
      hintEs: `El eje ${axis} es el espejo. Imagina que P se voltea sobre el eje ${axis}. ¿Hacia dónde se mueve?`,
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

  G.define('nc_scaleTable', (r, o) => {
    const hard = !!o.hard;
    const S = r.pick(hard ? SCALES_HARD : SCALES);
    // A -> B horizontal across the y-axis; B -> C vertical across the x-axis; hard: C -> D horizontal, same side of the y-axis
    const A = [-r.int(1, LIM), nz(r, 1, LIM)];
    const B = [r.int(1, LIM), A[1]];
    const C = [B[0], -Math.sign(A[1]) * r.int(1, LIM)];
    let D = null;
    if (hard) {
      let x;
      do {
        x = r.int(1, LIM);
      } while (x === B[0]);
      D = [x, C[1]];
    }
    const legs = [
      { n: 'A to B', f: 'A', t: 'B', P: A, Q: B, a: A[0], b: B[0], c: 'x' },
      { n: 'B to C', f: 'B', t: 'C', P: B, Q: C, a: B[1], b: C[1], c: 'y' },
    ];
    if (hard) legs.push({ n: 'C to D', f: 'C', t: 'D', P: C, Q: D, a: C[0], b: D[0], c: 'x' });
    const nL = legs.length;
    const Ls = legs.map((l) => dist1(l.a, l.b));
    const total = Ls.reduce((s, x) => s + x, 0);
    const roundTrip = 2 * total;
    const sc = (v) => r3(v * S.k);
    const k = dec(S.k);
    const last = hard ? 'D' : 'C';
    const sites = r.pickN(SITES, nL + 1);
    const pts = [A, B, C].concat(hard ? [D] : []);
    const ptNames = ['A', 'B', 'C', 'D'];
    const name = r.pick(NAMES);
    const rows = [['Leg', 'From', 'To', 'Grid units', `Real length (${S.u})`]]
      .concat(legs.map((l, i) => [l.n, `${l.f} ${pair(l.P[0], l.P[1])}`, `${l.t} ${pair(l.Q[0], l.Q[1])}`, `__IN:g${i}__`, `__IN:r${i}__`]))
      .concat([[`Round trip A → ${last} → A`, '', '', `__IN:g${nL}__`, `__IN:r${nL}__`]]);
    const inputs = [];
    legs.forEach((l, i) => inputs.push({ id: 'g' + i, answer: Ls[i] }, { id: 'r' + i, answer: sc(Ls[i]) }));
    inputs.push({ id: 'g' + nL, answer: roundTrip }, { id: 'r' + nL, answer: sc(roundTrip) });
    const routeText = pts.map((p, i) => `${i ? 'to ' : 'from '}the ${sites[i]} at ${ptNames[i]} ${hl(pair(p[0], p[1]))}`).join(', then ');
    return {
      type: 'table',
      skill: 'scale-design',
      lesson: 'Challenge',
      xp: 20,
      title: hard ? 'Plan the three-leg scaled route' : 'Plan the scaled route',
      prompt: `<p>${name} maps a supply route on a grid where ${hl(`1 unit = ${k} ${S.uu}`)}. The route goes ${routeText}. Afterward ${name} walks the same route back to A.</p>${PLANE({
        series: [{ points: pts, line: true, labels: ptNames.slice(0, pts.length) }],
        aria: `Coordinate plane showing the route ${pts.map((p, i) => `${ptNames[i]} ${pair(p[0], p[1])}`).join(' to ')}`,
      })}<p>Complete the table.</p>`,
      rows,
      inputs,
      hints: [
        hard
          ? 'A to B and C to D are horizontal, so use the x-coordinates. B to C is vertical, so use the y-coordinates. If a leg crosses an axis, add the absolute values. If it stays on one side, subtract them.'
          : 'A to B is horizontal, so use the x-coordinates. B to C is vertical, so use the y-coordinates. Both legs cross an axis: add the absolute values.',
        `${legs.map((l) => `${l.n}: ${gapWork(l.a, l.b)} units`).join('. ')}. Real length = grid units × ${k}.`,
        `One way is ${Ls.join(' + ')} = ${total} units. A round trip goes there and back, so double it, then scale.`,
      ],
      hintEs: hard
        ? 'De A a B y de C a D son tramos horizontales, así que usa las coordenadas x. De B a C es vertical, así que usa las coordenadas y. Si un tramo cruza un eje, suma los valores absolutos. Si se queda de un solo lado, réstalos.'
        : 'De A a B es horizontal, así que usa las coordenadas x. De B a C es vertical, así que usa las coordenadas y. Los dos tramos cruzan un eje: suma los valores absolutos.',
      solution: `<ul>${legs.map((l, i) => `<li>${l.n}: ${gapWork(l.a, l.b)} units → ${Ls[i]} × ${k} = <b>${dec(sc(Ls[i]))} ${S.u}</b></li>`).join('')}<li>Round trip: 2 × (${Ls.join(' + ')}) = <b>${roundTrip}</b> units → ${roundTrip} × ${k} = <b>${dec(sc(roundTrip))} ${S.u}</b></li></ul><p>${
        hard
          ? 'A to B and B to C cross an axis, so each is a sum of two distances from 0. C to D stays on one side of the y-axis, so it is a difference.'
          : 'Each leg crosses an axis, so its length is the sum of two distances from 0.'
      } The round trip covers every leg twice.</p>`,
      feedback: {
        correct: `Correct. ${total} units each way, ${roundTrip} units round trip, ${dec(sc(roundTrip))} ${S.uu} in real life.`,
        wrong(ans, d) {
          if (!d.wrong || !d.wrong.length) return 'Check every cell in the table.';
          const id = String(d.wrong[0]);
          const got = parseNum(ans[id]);
          const i = Number(id.slice(1));
          if (id[0] === 'g' && i < nL) {
            const l = legs[i];
            const cross = Math.sign(l.a) !== Math.sign(l.b);
            if (got != null && cross && near(got, Math.abs(Math.abs(l.a) - Math.abs(l.b)), 0.001))
              return `${l.n} crosses an axis, so add the two distances from 0: ${Math.abs(l.a)} + ${Math.abs(l.b)}.`;
            if (got != null && !cross && near(got, Math.abs(l.a) + Math.abs(l.b), 0.001))
              return `${l.n} stays on one side of the y-axis, so the shorter distance from 0 is inside the longer one. Subtract: ${Math.max(Math.abs(l.a), Math.abs(l.b))} − ${Math.min(Math.abs(l.a), Math.abs(l.b))}.`;
            return `${l.n} uses the ${l.c}-coordinates: ${dec(l.a)} and ${dec(l.b)}. How far apart are they?`;
          }
          if (id === 'g' + nL) {
            if (got != null && near(got, total, 0.001)) return `${total} is one way. A round trip goes to ${last} and back to A, so double it.`;
            return `Round trip = 2 × (${Ls.join(' + ')}) grid units.`;
          }
          const gridLen = i < nL ? Ls[i] : roundTrip;
          if (got != null && near(got, gridLen, 0.001)) return `${dec(got)} is the grid length. Multiply by ${k} to get real ${S.uu}.`;
          if (got != null && near(got, r3(gridLen / S.k), 0.001)) return `You divided by ${k}. Each grid unit stands for ${k} ${S.uu}, so multiply.`;
          if (i === nL && got != null && near(got, sc(total), 0.001)) return `${dec(sc(total))} ${S.u} is one way. The round trip is twice that.`;
          return `Real length = grid units × ${k}.`;
        },
      },
    };
  });

  G.define('nc_crossPerimeter', (r, o) => {
    const hard = !!o.hard;
    const Lshape = !hard && r.chance(0.5);
    const x1 = -r.int(2, LIM),
      x2 = r.int(2, LIM),
      y1 = -r.int(2, LIM),
      y2 = r.int(2, LIM);
    const W = x2 - x1,
      H = y2 - y1;
    const k = hard ? r.pick([2, 3, 5]) : 1;
    const name = r.pick(NAMES);
    const site = r.pick(SITES);
    let verts,
      labels,
      area,
      notch = 0;
    if (hard) {
      const xa = r.int(x1 + 1, x2 - 2),
        xb = r.int(xa + 1, x2 - 1),
        ym = r.int(y1 + 1, y2 - 1);
      verts = [
        [x1, y1],
        [x2, y1],
        [x2, y2],
        [xb, y2],
        [xb, ym],
        [xa, ym],
        [xa, y2],
        [x1, y2],
      ];
      labels = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
      notch = y2 - ym;
      area = W * H - (xb - xa) * notch;
    } else if (Lshape) {
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
    const Pg = sides.reduce((s, x) => s + x, 0); // perimeter in grid units
    const P = Pg * k;
    const sideText = verts.map((p, i) => `${labels[i]}${labels[(i + 1) % verts.length]} = ${sides[i]}`).join(', ');
    const shapeNote = hard ? ' The chamber is U-shaped: a notch is cut into its top side.' : Lshape ? ' The chamber is L-shaped.' : ' The chamber has one corner in every quadrant.';
    return {
      type: 'num',
      skill: 'polygons-plane',
      lesson: 'Challenge',
      xp: 20,
      title: hard ? 'Perimeter of a U-shaped chamber' : Lshape ? 'Perimeter of an L-shaped chamber' : 'Perimeter across all four quadrants',
      prompt: `<p>The ${site} is drawn on the cave grid with vertices ${verts.map((p, i) => `${labels[i]} ${hl(pair(p[0], p[1]))}`).join(', ')}. Each grid unit is ${hard ? hl(`${k} meters`) : '1 meter'}.${shapeNote}</p>${PLANE(
        {
          series: [{ points: verts, polygon: true, labels: labels }],
          aria: `Coordinate plane showing ${hard ? 'a U-shaped figure' : Lshape ? 'an L-shaped figure' : 'a rectangle'} with vertices ${verts.map((p) => pair(p[0], p[1])).join(', ')}`,
        },
      )}<p>${name} needs rope to go all the way around the chamber. What is the perimeter, in meters?</p>`,
      unit: 'm',
      answer: P,
      hints: [
        hard
          ? 'Go around the figure one side at a time. A horizontal side uses x-coordinates; a vertical side uses y-coordinates. When the two coordinates have opposite signs, add their absolute values. At the end, change grid units to meters.'
          : 'Go around the figure one side at a time. A horizontal side uses x-coordinates; a vertical side uses y-coordinates. When the two coordinates have opposite signs, add their absolute values.',
        `AB runs from x = ${dec(x1)} to x = ${dec(x2)}: ${gapWork(x1, x2)} units. ${hard ? 'Keep going around all eight sides: BC, CD, DE, EF, FG, GH, HA.' : Lshape ? 'Keep going: BC, CD, DE, EF, FA.' : `BC runs from y = ${dec(y1)} to y = ${dec(y2)}: ${gapWork(y1, y2)} units.`}`,
        hard ? `Side lengths in grid units: ${sideText}. Add them, then multiply the total by ${k}.` : `Side lengths: ${sideText}. Add them all.`,
      ],
      hintEs: hard
        ? 'Recorre la figura un lado a la vez. Un lado horizontal usa las coordenadas x; un lado vertical usa las coordenadas y. Si las dos coordenadas tienen signos opuestos, suma sus valores absolutos. Al final, cambia las unidades de la cuadrícula a metros.'
        : 'Recorre la figura un lado a la vez. Un lado horizontal usa las coordenadas x; un lado vertical usa las coordenadas y. Si las dos coordenadas tienen signos opuestos, suma sus valores absolutos.',
      solution: hard
        ? `<p>Side lengths in grid units: ${sideText}. Perimeter = ${sides.join(' + ')} = ${Pg} grid units. Each unit is ${k} m, so ${Pg} × ${k} = <b>${P} m</b>. Check: the three top pieces CD, EF, and GH add up to the full width (${W}), so the U-shape is a ${W}-by-${H} rectangle plus the two inner notch sides DE and FG: 2 × (${W} + ${H}) + 2 × ${notch} = ${Pg}.</p>`
        : Lshape
          ? `<p>Side lengths: ${sideText}. Perimeter = ${sides.join(' + ')} = <b>${P} m</b>. Notice that the two short horizontal sides add up to the long bottom side (${W}), and the two short vertical sides add up to the long left side (${H}). So the L-shape has the same perimeter as a rectangle that is ${W} by ${H}: 2 × (${W} + ${H}) = ${P}.</p>`
          : `<p>AB: ${gapWork(x1, x2)} units. BC: ${gapWork(y1, y2)} units. Every side crosses an axis, so each length is a sum of two distances from 0. Perimeter = 2 × (${W} + ${H}) = <b>${P} m</b>.</p>`,
      feedback: {
        correct: hard ? `Correct. ${Pg} grid units × ${k} = ${P} meters of rope.` : `Correct. ${sides.join(' + ')} = ${P} meters of rope.`,
        wrong(ans, d) {
          const v = d.value;
          if (v == null) return 'Type a number of meters.';
          if (hard && near(v, Pg, 0.001)) return `${Pg} is the perimeter in grid units. Each grid unit is ${k} meters, so multiply.`;
          if (hard && near(v, 2 * (W + H) * k, 0.001)) return `That is the perimeter of the whole rectangle. The notch adds two inner sides, DE and FG, that the rectangle does not have.`;
          if (hard && near(v, 2 * (W + H), 0.001)) return 'That is the rectangle around the U in grid units. Add the two inner notch sides, then multiply by the scale.';
          if (near(v, area, 0.001) || near(v, area * k, 0.001) || near(v, area * k * k, 0.001)) return `That is the area, the space inside. Perimeter adds the side lengths.`;
          if (!hard && near(v, W + H, 0.001)) return `${W} + ${H} is only part of the way around. Keep adding until you are back at A.`;
          const subW = Math.abs(Math.abs(x1) - Math.abs(x2)),
            subH = Math.abs(Math.abs(y1) - Math.abs(y2));
          const base = 2 * (W + H) + 2 * notch;
          if (near(v, k * (base - 2 * (W - subW)), 0.001) || near(v, k * (base - 2 * (H - subH)), 0.001) || near(v, k * (base - 2 * (W - subW) - 2 * (H - subH)), 0.001))
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
          if (near(v, (Pg + verts.length) * k, 0.001) || near(v, (Pg - verts.length) * k, 0.001)) return 'Off by one on each side. Count the spaces between grid lines, not the grid points.';
          return hard ? `Add all eight sides (${sideText}), then multiply by ${k}.` : `Add every side: ${sideText}.`;
        },
      },
    };
  });
})(typeof window !== 'undefined' ? window : globalThis);
