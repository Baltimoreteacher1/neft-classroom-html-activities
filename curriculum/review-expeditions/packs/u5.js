/* js/units/u5/gen-parallelogram.js */
/* Zone 1 — The Tiled Atrium. Lesson 5-1 Determine the Area of Parallelograms and Rhombuses. */
(function (root) {
  'use strict';
  const RX = root.RX;
  const { G, V, shuffleOptions, NAMES, round, fmt, parseNum, U5 } = RX;
  const hl = V.hl;
  const C = V.COLORS;
  const sq = U5.sq;

  // Honest slanted sides: (offset, height, slanted side) are Pythagorean triples, so the drawing matches the labels.
  const TRIPLES = [
    [3, 4, 5],
    [4, 3, 5],
    [6, 8, 10],
    [8, 6, 10],
    [5, 12, 13],
  ];
  const OBJECTS = ['floor tile', 'garden bed', 'parking space', 'stained-glass pane', 'banner', 'ramp panel', 'roof shingle', 'window pane'];

  function para(r, o) {
    const [off, h0, s0] = r.pick(TRIPLES);
    let h = h0,
      s = s0,
      b;
    if (o && o.hard) {
      // hard: half-unit height and slanted side, and often a half-unit base
      h = round(h0 * 1.5, 1);
      s = round(s0 * 1.5, 1);
      b = r.int(10, 20) + (Number.isInteger(h) || r.chance(0.5) ? 0.5 : 0);
    } else b = r.int(Math.max(4, h), h * 2 + 2);
    const u = r.pick(U5.UNITS);
    return { b, h, s, off: o && o.hard ? off * 1.5 : off, u };
  }
  function paraSvg(p, extra) {
    return V.parallelogram(
      p.b,
      p.h,
      Object.assign(
        {
          base: fmt(p.b) + ' ' + p.u,
          height: fmt(p.h) + ' ' + p.u,
          side: fmt(p.s) + ' ' + p.u,
          offset: p.off,
          aria: `Parallelogram with base ${fmt(p.b)} ${p.u}, height ${fmt(p.h)} ${p.u}, and slanted side ${fmt(p.s)} ${p.u}`,
        },
        extra || {},
      ),
    );
  }
  const near = (v, x) => v != null && Math.abs(v - x) < 0.01;
  function coachArea(p, v) {
    const A = round(p.b * p.h, 2);
    if (v == null) return 'Area of a parallelogram = base × height. Enter one number.';
    if (near(v, round(p.b * p.s, 2)))
      return `You multiplied by the slanted side (${fmt(p.s)}). The height is the dashed segment that makes a right angle with the base: ${fmt(p.h)} ${p.u}.`;
    if (near(v, p.b + p.h) || near(v, 2 * (p.b + p.s))) return 'That is adding side lengths, which gives a distance around, not the space inside. Area is base × height.';
    if (near(v, A / 2)) return 'You halved the product. Halving is for triangles. A parallelogram is base × height with no half.';
    if (near(v, Math.floor(p.b) * Math.floor(p.h)) || near(v, Math.floor(p.b) * p.h) || near(v, p.b * Math.floor(p.h)))
      return 'It looks like a half unit was dropped. Multiply the full decimal measurements, for example 4.5 is 4 and one half.';
    return `Area = base × height = ${fmt(p.b)} × ${fmt(p.h)}. Check your multiplication.`;
  }

  // ---------- Area = base × height, slanted side as a trap (num) ----------
  G.define('g1_areaBH', (r, o) => {
    const hard = !!o.hard;
    const p = para(r, o);
    const A = round(p.b * p.h, 2);
    const name = r.pick(NAMES),
      obj = r.pick(OBJECTS);
    const given = hard
      ? `Its base is ${fmt(p.b)} ${p.u}, its slanted side is ${fmt(p.s)} ${p.u}, and the height drawn to the base is ${fmt(p.h)} ${p.u}.`
      : `Its base is ${hl(fmt(p.b) + ' ' + p.u)}, its height is ${hl(fmt(p.h) + ' ' + p.u)}, and its slanted side is ${fmt(p.s)} ${p.u}.`;
    return {
      type: 'num',
      skill: 'area-parallelogram',
      lesson: '5-1',
      title: hard ? 'Seal of Area: parallelogram' : 'Area of a parallelogram',
      xp: o.xp,
      prompt: `<p>${name} is measuring a parallelogram-shaped ${obj}. ${given}</p>${paraSvg(p)}<p>What is the area of the ${obj}?</p>`,
      unit: sq(p.u),
      answer: A,
      reference: true,
      hints: [
        'Area of a parallelogram = base × height. The height is the segment that makes a right angle with the base, not the slanted side.',
        `The base is ${fmt(p.b)} ${p.u}. The height is the dashed segment, ${fmt(p.h)} ${p.u}. The slanted side (${fmt(p.s)} ${p.u}) is not used.`,
        `Multiply: ${fmt(p.b)} × ${fmt(p.h)}.`,
      ],
      hintEs: 'Área de un paralelogramo = base × altura. La altura es el segmento que forma un ángulo recto con la base, no el lado inclinado.',
      solution: `<p>A = b × h = ${fmt(p.b)} × ${fmt(p.h)} = <b>${fmt(A)} ${sq(p.u)}</b>. The slanted side ${fmt(p.s)} ${p.u} is longer than the height, so using it would make the area too big. Only the perpendicular height counts.</p>`,
      feedback: { correct: `Correct. ${fmt(p.b)} × ${fmt(p.h)} = ${fmt(A)} ${sq(p.u)}. You used the perpendicular height, not the slanted side.`, wrong: (ans, d) => coachArea(p, d.value) },
    };
  });

  // ---------- Which measurement is the height? / which expression? (mc) ----------
  G.define('g1_whichHeight', (r, o) => {
    const hard = !!o.hard;
    const p = para(r, o);
    const pickWhy = (sh, fallback) => (ans) => (sh.options[ans] && sh.options[ans].why) || fallback;
    if (r.chance(0.5)) {
      const sh = shuffleOptions(
        r,
        [
          { html: `${fmt(p.h)} ${p.u}, the dashed segment`, ok: true },
          { html: `${fmt(p.s)} ${p.u}, the slanted side`, why: 'The slanted side leans. The height must make a right angle with the base, so it is shorter than the slanted side.' },
          { html: `${fmt(p.b)} ${p.u}, the bottom side`, why: 'The bottom side is the base. The height is measured straight up from the base to the opposite side.' },
          { html: `${fmt(p.b + p.s)} ${p.u}, the base plus the slanted side`, why: 'Adding two sides does not give a height. The height is a single perpendicular distance.' },
        ],
        0,
      );
      const desc = hard
        ? `The parallelogram below is labelled with three measurements: ${fmt(p.b)} ${p.u}, ${fmt(p.s)} ${p.u}, and ${fmt(p.h)} ${p.u}. Use the right-angle mark to decide.`
        : `The parallelogram below has a base of ${fmt(p.b)} ${p.u}, a slanted side of ${fmt(p.s)} ${p.u}, and a dashed segment of ${fmt(p.h)} ${p.u} that meets the base at a right angle.`;
      return {
        type: 'mc',
        skill: 'area-parallelogram',
        lesson: '5-1',
        title: 'Find the height',
        prompt: `<p>${desc}</p>${paraSvg(p)}<p>Which measurement is the <b>height</b> of the parallelogram?</p>`,
        options: sh.options,
        answer: sh.answer,
        hints: [
          'The height is perpendicular to the base. Perpendicular means it makes a right angle (a square corner).',
          'Look for the small square-corner mark. The segment with that mark is the height.',
          'Find the segment with the square-corner mark and read its label.',
        ],
        hintEs: 'La altura es perpendicular a la base. Perpendicular quiere decir que forma un ángulo recto (una esquina cuadrada).',
        solution: `<p>The height is the <b>${fmt(p.h)} ${p.u}</b> dashed segment. It meets the base at a right angle. The slanted side (${fmt(p.s)} ${p.u}) is a side of the figure, not its height.</p>`,
        feedback: { correct: 'Correct. The height always makes a right angle with the base.', wrong: pickWhy(sh, 'Look for the segment with the right-angle mark.') },
      };
    }
    const sh = shuffleOptions(
      r,
      [
        { html: `${fmt(p.b)} × ${fmt(p.h)}`, ok: true },
        { html: `${fmt(p.b)} × ${fmt(p.s)}`, why: `${fmt(p.s)} ${p.u} is the slanted side. Area uses the perpendicular height, ${fmt(p.h)} ${p.u}.` },
        { html: `½ × ${fmt(p.b)} × ${fmt(p.h)}`, why: 'The ½ belongs to the triangle formula. A parallelogram is a full base × height.' },
        hard
          ? {
              html: `${fmt(p.s)} × ${fmt(p.h)}`,
              why: `The height ${fmt(p.h)} is perpendicular to the ${fmt(p.b)} ${p.u} base, not to the slanted side. A base and its height must go together.`,
            }
          : { html: `${fmt(p.b)} + ${fmt(p.h)} + ${fmt(p.b)} + ${fmt(p.h)}`, why: 'Adding sides gives perimeter (the distance around), not area (the space inside).' },
      ],
      0,
    );
    return {
      type: 'mc',
      skill: 'area-parallelogram',
      lesson: '5-1',
      title: 'Choose the expression',
      prompt: hard
        ? `<p>A parallelogram has a base of ${fmt(p.b)} ${p.u} and a slanted side of ${fmt(p.s)} ${p.u}. The dashed height drawn to the base is ${fmt(p.h)} ${p.u}.</p>${paraSvg(p)}<p>Which expression gives its area in ${sq(p.u)}?</p>`
        : `<p>A parallelogram has base ${hl(fmt(p.b) + ' ' + p.u)}, height ${hl(fmt(p.h) + ' ' + p.u)}, and slanted side ${fmt(p.s)} ${p.u}.</p>${paraSvg(p)}<p>Which expression gives its area in ${sq(p.u)}?</p>`,
      options: sh.options,
      answer: sh.answer,
      reference: true,
      hints: ['Area of a parallelogram = base × height.', `The height must meet the base at a right angle. The slanted side is not the height. Find the segment drawn perpendicular to the base.`, `Write base × height with those two numbers.`],
      hintEs: 'Área de un paralelogramo = base × altura.',
      solution: `<p>A = b × h = <b>${fmt(p.b)} × ${fmt(p.h)}</b> = ${fmt(round(p.b * p.h, 2))} ${sq(p.u)}. The slanted side is not part of the formula, and the height must be the one drawn to the base you use.</p>`,
      feedback: { correct: 'Correct. Base times perpendicular height, no half, no slanted side.', wrong: pickWhy(sh, 'Use base × the height drawn to that base.') },
    };
  });

  // ---------- Error analysis: used the slanted side / used the triangle half (error) ----------
  G.define('g1_errorSlant', (r, o) => {
    const hard = !!o.hard;
    const p = para(r, o);
    const kind = hard ? r.pick(['slant', 'half']) : 'slant';
    const name = r.pick(NAMES),
      A = round(p.b * p.h, 2),
      wrongA = kind === 'slant' ? round(p.b * p.s, 2) : round((p.b * p.h) / 2, 2);
    const opts =
      kind === 'slant'
        ? [
            { html: `${name} multiplied by the slanted side. The height is the perpendicular segment, ${fmt(p.h)} ${p.u}.`, ok: true },
            {
              html: `${name} should have added the base and the side instead of multiplying.`,
              why: 'Adding gives a length, not an area. Multiplying base × height is correct; the problem is which number was used for the height.',
            },
            { html: `${name} forgot to multiply by ½.`, why: 'There is no ½ in the parallelogram formula. The ½ is for triangles.' },
            { html: `${name}'s work is correct.`, why: `${fmt(p.s)} ${p.u} is the slanted side, which is longer than the height. The answer is too big.` },
          ]
        : [
            { html: `${name} used the triangle formula. A parallelogram has no ½, so the area is the full base × height.`, ok: true },
            { html: `${name} used the slanted side instead of the height.`, why: `${name} used ${fmt(p.h)} ${p.u}, which is the perpendicular height. The height is right; the ½ is the problem.` },
            { html: `${name} should have multiplied by 2 at the end and then by ½ again.`, why: 'Extra steps do not fix it. Simply leave out the ½: a parallelogram is base × height.' },
            { html: `${name}'s work is correct.`, why: `Two copies of a triangle make a parallelogram, so a parallelogram is twice ½ × b × h. ${name}'s answer is only half.` },
          ];
    const sh = shuffleOptions(r, opts, 0);
    const work =
      kind === 'slant'
        ? `A = b × h<br>A = ${fmt(p.b)} × ${fmt(p.s)}<br>A = ${fmt(wrongA)} ${sq(p.u)}`
        : `A = ½ × b × h<br>A = ½ × ${fmt(p.b)} × ${fmt(p.h)}<br>A = ${fmt(wrongA)} ${sq(p.u)}`;
    return {
      type: 'error',
      skill: 'area-parallelogram',
      lesson: '5-1',
      title: 'Find the mistake',
      prompt: `<p>${name} found the area of this parallelogram.</p>${paraSvg(p)}<p>What is wrong with ${name}'s work?</p>`,
      work,
      options: sh.options,
      answer: sh.answer,
      fix: { label: `Correct area (${sq(p.u)}):`, answer: A },
      hints:
        kind === 'slant'
          ? [
              'Compare the numbers in the work with the labels on the figure. Which label did the student use for h?',
              `${fmt(p.s)} ${p.u} is the slanted side. The height is the dashed segment that makes a right angle with the base.`,
              `Correct area = ${fmt(p.b)} × ${fmt(p.h)}.`,
            ]
          : [
              'Compare the formula the student wrote with the formula for the area of a parallelogram.',
              `The base ${fmt(p.b)} and the height ${fmt(p.h)} are the right numbers. Look at the first line of the work.`,
              `Correct area = ${fmt(p.b)} × ${fmt(p.h)}, with no ½.`,
            ],
      hintEs:
        kind === 'slant'
          ? 'Compara los números del trabajo con las medidas de la figura. ¿Qué medida usó como altura h?'
          : 'Compara la fórmula que escribió con la fórmula del área de un paralelogramo.',
      solution:
        kind === 'slant'
          ? `<p>${name} used ${fmt(p.s)} ${p.u}, the slanted side, as the height. The height is ${fmt(p.h)} ${p.u}. Correct area: ${fmt(p.b)} × ${fmt(p.h)} = <b>${fmt(A)} ${sq(p.u)}</b>.</p>`
          : `<p>${name} used ½ × b × h, which is the triangle formula. A parallelogram is two of those triangles, so A = b × h = ${fmt(p.b)} × ${fmt(p.h)} = <b>${fmt(A)} ${sq(p.u)}</b>.</p>`,
      feedback: {
        correct: `Correct. A parallelogram is base × perpendicular height: ${fmt(p.b)} × ${fmt(p.h)} = ${fmt(A)} ${sq(p.u)}.`,
        wrong(ans, d) {
          if (!d.mistakeOk) return (sh.options[ans.mistake] && sh.options[ans.mistake].why) || 'Check which formula and which measurements were used.';
          const v = parseNum(ans.fix);
          if (near(v, wrongA)) return `That is ${name}'s answer again. Correct the mistake you found, then multiply.`;
          if (near(v, round(p.b * p.s, 2))) return `That uses the slanted side ${fmt(p.s)}. Use the height ${fmt(p.h)}.`;
          if (near(v, A / 2)) return 'You kept the ½. A parallelogram has no ½.';
          return `You found the mistake. For the fix, multiply the base ${fmt(p.b)} by the perpendicular height ${fmt(p.h)}.`;
        },
      },
    };
  });

  // ---------- Table of parallelograms: areas and missing dimensions (table) ----------
  G.define('g1_tableAreas', (r, o) => {
    const hard = !!o.hard;
    const u = r.pick(U5.UNITS),
      name = r.pick(NAMES);
    const rows = [['Parallelogram', `Base (${u})`, `Height (${u})`, `Area (${sq(u)})`]];
    let d, inputs, missing;
    if (hard) {
      // A: half-unit height; B: base missing (half-unit); C: height missing (half-unit)
      d = [
        { b: r.int(5, 12), h: r.int(3, 9) + 0.5 },
        { b: r.int(6, 12) + 0.5, h: 2 * r.int(2, 4) },
        { b: 2 * r.int(3, 6), h: r.int(3, 9) + 0.5 },
      ];
      d.forEach((x) => (x.A = round(x.b * x.h, 2)));
      rows.push(['A', fmt(d[0].b), fmt(d[0].h), '__IN:a0__'], ['B', '__IN:b1__', fmt(d[1].h), fmt(d[1].A)], ['C', fmt(d[2].b), '__IN:h2__', fmt(d[2].A)]);
      inputs = [
        { id: 'a0', answer: d[0].A },
        { id: 'b1', answer: d[1].b },
        { id: 'h2', answer: d[2].h },
      ];
      missing = { b1: [d[1], 'base', d[1].h], h2: [d[2], 'height', d[2].b] };
    } else {
      const bases = r.pickN([5, 6, 7, 8, 9, 10, 12], 3);
      d = bases.map((b) => ({ b, h: r.int(3, 9) }));
      d.forEach((x) => (x.A = x.b * x.h));
      rows.push(['A', String(d[0].b), String(d[0].h), '__IN:a0__'], ['B', String(d[1].b), String(d[1].h), '__IN:a1__'], ['C', String(d[2].b), '__IN:h2__', String(d[2].A)]);
      inputs = [
        { id: 'a0', answer: d[0].A },
        { id: 'a1', answer: d[1].A },
        { id: 'h2', answer: d[2].h },
      ];
      missing = { h2: [d[2], 'height', d[2].b] };
    }
    const backSteps = Object.entries(missing)
      .map(([id, [x, what, known]]) => `${id === 'b1' ? 'B' : 'C'}: ${what} = ${fmt(x.A)} ÷ ${fmt(known)}`)
      .join('. ');
    return {
      type: 'table',
      skill: 'area-parallelogram',
      lesson: '5-1',
      title: 'Complete the area table',
      prompt: hard
        ? `<p>${name} lists three parallelogram tiles, measured in ${u}. Complete the table. Tile A needs its area. Tile B is missing its base, and tile C is missing its height.</p>`
        : `<p>${name} lists three parallelogram tiles, measured in ${u}. Complete the table. For tile C, the area is given and the height is missing.</p>`,
      rows,
      header: true,
      inputs,
      reference: true,
      hints: [
        hard ? 'Area = base × height. To find a missing base or height, divide the area by the measurement you know.' : 'Area = base × height. To find a missing height, divide the area by the base.',
        hard ? `Tile A: ${fmt(d[0].b)} × ${fmt(d[0].h)}.` : `Tile A: ${d[0].b} × ${d[0].h}. Tile B: ${d[1].b} × ${d[1].h}.`,
        `Tile ${backSteps}.`,
      ],
      hintEs: hard
        ? 'Área = base × altura. Para hallar una base o una altura que falta, divide el área entre la medida que conoces.'
        : 'Área = base × altura. Para hallar una altura que falta, divide el área entre la base.',
      solution: hard
        ? `<p>A: ${fmt(d[0].b)} × ${fmt(d[0].h)} = <b>${fmt(d[0].A)}</b>. B: ${fmt(d[1].A)} ÷ ${fmt(d[1].h)} = <b>${fmt(d[1].b)}</b>. C: ${fmt(d[2].A)} ÷ ${fmt(d[2].b)} = <b>${fmt(d[2].h)}</b>. Multiplying finds an area; dividing the area by the measurement you know undoes it.</p>`
        : `<p>A: ${d[0].b} × ${d[0].h} = <b>${d[0].A}</b>. B: ${d[1].b} × ${d[1].h} = <b>${d[1].A}</b>. C: ${d[2].A} ÷ ${d[2].b} = <b>${d[2].h}</b>. Multiplying finds an area; dividing the area by the base undoes it to find the height.</p>`,
      feedback: {
        correct: 'Correct. Base × height gives area, and area ÷ one dimension gives the other back.',
        wrong(ans, dd) {
          for (const id of Object.keys(missing)) {
            if (!dd.wrong.includes(id)) continue;
            const [x, what, known] = missing[id];
            const v = parseNum(ans[id]);
            if (near(v, x.A * known)) return `For tile ${id === 'b1' ? 'B' : 'C'}, you multiplied the area by ${fmt(known)}. The ${what} is missing, so divide: area ÷ ${fmt(known)}.`;
            if (near(v, x.A / known / 2)) return `For tile ${id === 'b1' ? 'B' : 'C'}, there is no ½ to undo. Just divide the area by ${fmt(known)}.`;
            return `For tile ${id === 'b1' ? 'B' : 'C'}, the area (${fmt(x.A)}) is base × height. Divide it by ${fmt(known)} to find the ${what}.`;
          }
          const v = parseNum(ans.a0);
          if (dd.wrong.includes('a0') && near(v, d[0].b + d[0].h)) return 'For tile A, you added base and height. Area means multiply base × height.';
          if (dd.wrong.includes('a0') && near(v, d[0].A / 2)) return 'For tile A, no half: a parallelogram is base × height.';
          return 'For the tiles with base and height given, multiply base × height.';
        },
      },
    };
  });

  // ---------- Rhombus: all sides equal, area is still base × height (num) ----------
  G.define('g1_rhombusBH', (r, o) => {
    const hard = !!o.hard;
    const [off0, h0, s0] = r.pick(TRIPLES);
    const k = hard ? r.pick([1.5, 2.5]) : 1;
    const off = off0 * k,
      h = round(h0 * k, 1),
      s = round(s0 * k, 1);
    const P = round(4 * s, 1);
    const u = r.pick(U5.UNITS),
      name = r.pick(NAMES);
    const ctx = r.pick(['kite', 'mosaic tile', 'window', 'sign', 'quilt patch']);
    const A = round(s * h, 2);
    const svg = V.parallelogram(s, h, {
      base: hard ? `side ? ${u}` : `${fmt(s)} ${u}`,
      height: `${fmt(h)} ${u}`,
      side: hard ? undefined : `${fmt(s)} ${u}`,
      offset: off,
      aria: hard ? `Rhombus with unknown side and height ${fmt(h)} ${u}` : `Rhombus with sides ${fmt(s)} ${u} and height ${fmt(h)} ${u}`,
    });
    return {
      type: 'num',
      skill: 'area-rhombus',
      lesson: '5-1',
      title: 'Area of a rhombus',
      prompt: hard
        ? `<p>${name} cuts a rhombus-shaped ${ctx}. The distance around the ${ctx} (its perimeter) is ${fmt(P)} ${u}. The height is ${fmt(h)} ${u}.</p>${svg}<p>What is the area of the ${ctx}?</p>`
        : `<p>${name} cuts a rhombus-shaped ${ctx}. Every side is ${hl(fmt(s) + ' ' + u)} long. The height is ${hl(fmt(h) + ' ' + u)}.</p>${svg}<p>What is the area of the ${ctx}?</p>`,
      unit: sq(u),
      answer: A,
      reference: true,
      hints: hard
        ? [
            'A rhombus has four equal sides, so one side = perimeter ÷ 4. Then use area = base × height.',
            `One side = ${fmt(P)} ÷ 4 = ${fmt(s)} ${u}. Use that side as the base. The height is ${fmt(h)} ${u}.`,
            `Multiply: ${fmt(s)} × ${fmt(h)}.`,
          ]
        : [
            'A rhombus is a parallelogram with four equal sides. Its area is still base × height.',
            `Use one side as the base: ${fmt(s)} ${u}. The height is the perpendicular segment: ${fmt(h)} ${u}.`,
            `Multiply: ${fmt(s)} × ${fmt(h)}.`,
          ],
      hintEs: hard
        ? 'Un rombo tiene cuatro lados iguales, así que un lado = perímetro ÷ 4. Después usa área = base × altura.'
        : 'Un rombo es un paralelogramo con cuatro lados iguales. Su área también es base × altura.',
      solution: `<p>${hard ? `Each side is ${fmt(P)} ÷ 4 = ${fmt(s)} ${u}. ` : ''}A rhombus is a parallelogram, so A = b × h = ${fmt(s)} × ${fmt(h)} = <b>${fmt(A)} ${sq(u)}</b>. Side × side (${fmt(round(s * s, 2))}) would be wrong: the rhombus leans, so its height ${fmt(h)} is shorter than its side.</p>`,
      feedback: {
        correct: `Correct. A rhombus is a parallelogram: ${fmt(s)} × ${fmt(h)} = ${fmt(A)} ${sq(u)}.`,
        wrong(ans, d) {
          const v = d.value;
          if (near(v, P * h)) return `You multiplied the whole perimeter by the height. The base is only one side: ${fmt(P)} ÷ 4.`;
          if (near(v, s * s)) return `You squared the side (${fmt(s)} × ${fmt(s)}). Only a square has height equal to its side. This rhombus leans, so use the height ${fmt(h)} ${u}.`;
          if (near(v, 4 * s)) return `${fmt(4 * s)} is the perimeter (4 equal sides). Area is base × height.`;
          if (near(v, A / 2)) return 'No half here. A rhombus is a parallelogram, so area = base × height.';
          return hard ? 'Find one side from the perimeter first, then multiply that side by the height.' : 'Multiply one side (the base) by the perpendicular height.';
        },
      },
    };
  });

  // ---------- Decompose and rearrange into a rectangle (blanks, template) ----------
  G.define('g1_decompose', (r, o) => {
    const hard = !!o.hard;
    const u = r.pick(U5.UNITS);
    if (r.chance(0.5)) {
      const [off0, h0] = r.pick(TRIPLES);
      const off = hard ? off0 * 1.5 : off0,
        h = hard ? round(h0 * 1.5, 1) : h0;
      const b = r.int(h0 + 1, h0 * 2 + 2) + (hard ? 0.5 : 0);
      const A = round(b * h, 2);
      const svg = V.figure({
        pts: [
          [0, 0],
          [b, 0],
          [b + off, h],
          [off, h],
        ],
        dashes: [[off, 0, off, h, C.d]],
        rightAngles: [[off, 0, 1, 1]],
        labels: [
          { x: b / 2, y: 0, text: `${fmt(b)} ${u}`, dy: 20 },
          { x: off, y: h / 2, text: `${fmt(h)} ${u}`, anchor: 'start', dx: 8, color: C.d },
        ],
        aria: `Parallelogram with base ${fmt(b)} ${u} and height ${fmt(h)} ${u}, with a triangle marked on the left end`,
      });
      return {
        type: 'blanks',
        skill: 'area-rhombus',
        lesson: '5-1',
        title: 'Cut and slide',
        prompt: `<p>Cut the triangle off the left end of this parallelogram along the dashed height. Slide it to the right end. The pieces form a rectangle.</p>${svg}<p>Complete the sentence.</p>`,
        fields: [
          { label: 'length', answer: b },
          { label: 'width', answer: h },
          { label: 'area', answer: A },
        ],
        template: `The rectangle is {0} ${u} long and {1} ${u} wide, so the area is {2} ${sq(u)}.`,
        hints: [
          'Sliding a piece does not change the area. The rectangle has the same area as the parallelogram.',
          `The rectangle's length is the base, ${fmt(b)} ${u}. Its width is the height, ${fmt(h)} ${u}.`,
          `Multiply the length by the width: ${fmt(b)} × ${fmt(h)}.`,
        ],
        hintEs: 'Mover una pieza no cambia el área. El rectángulo tiene la misma área que el paralelogramo.',
        solution: `<p>The rectangle is <b>${fmt(b)}</b> ${u} by <b>${fmt(h)}</b> ${u}, so its area is <b>${fmt(A)}</b> ${sq(u)}. This is why the parallelogram formula is base × height: every parallelogram can be cut and slid into a rectangle with the same base and height.</p>`,
        feedback: {
          correct: "Correct. Cutting and sliding shows why a parallelogram's area is base × height.",
          wrong(ans, d) {
            const a = parseNum(ans[2]);
            if (d.wrong.includes(0) || d.wrong.includes(1)) return `The rectangle's two dimensions are the base (${fmt(b)}) and the height (${fmt(h)}). The slanted side disappears when you slide the triangle.`;
            if (near(a, b + h) || near(a, 2 * (b + h))) return 'You added the sides. Area of a rectangle is length × width.';
            if (near(a, A / 2)) return 'No half: the rectangle uses all of the parallelogram. Multiply length × width.';
            return 'Area of the rectangle = length × width. Check your multiplication.';
          },
        },
      };
    }
    const d1 = hard ? r.int(7, 15) : 2 * r.int(3, 7),
      d2 = hard ? 2 * r.int(2, 5) + 1 : 2 * r.int(2, 5) + (r.chance(0.5) ? 0 : 2);
    const A = round((d1 * d2) / 2, 2);
    const svg = V.figure({
      pts: [
        [0, d2 / 2],
        [d1 / 2, 0],
        [d1, d2 / 2],
        [d1 / 2, d2],
      ],
      dashes: [
        [0, d2 / 2, d1, d2 / 2, C.d],
        [d1 / 2, 0, d1 / 2, d2, C.d],
      ],
      rightAngles: [[d1 / 2, d2 / 2, 1, 1]],
      labels: [
        { x: d1 / 2, y: 0, text: `${d1} ${u}`, dy: 20 },
        { x: d1, y: d2 / 2, text: `${d2} ${u}`, anchor: 'start', dx: 8 },
      ],
      aria: `Rhombus with diagonals ${d1} ${u} across and ${d2} ${u} tall, cut into four right triangles`,
    });
    return {
      type: 'blanks',
      skill: 'area-rhombus',
      lesson: '5-1',
      title: 'Four triangles make a rectangle',
      prompt: `<p>The diagonals cut this rhombus into four identical right triangles. The rhombus is ${hl(d1 + ' ' + u)} across and ${hl(d2 + ' ' + u)} tall.</p>${svg}<p>Rearrange the four triangles into one rectangle. The rectangle keeps the full width, and its height is half the rhombus's height. Complete the sentence.</p>`,
      fields: [
        { label: 'length', answer: d1 },
        { label: 'width', answer: d2 / 2 },
        { label: 'area', answer: A },
      ],
      template: `The rectangle is {0} ${u} by {1} ${u}, so the area of the rhombus is {2} ${sq(u)}.`,
      hints: [
        'Rearranging pieces does not change the total area.',
        `The rectangle is as wide as the rhombus: ${d1} ${u}. Its height is half of ${d2} ${u}.`,
        `Multiply the rectangle's length by its width: ${d1} × ${fmt(d2 / 2)}.`,
      ],
      hintEs: 'Reordenar las piezas no cambia el área total.',
      solution: `<p>The four triangles form a rectangle <b>${d1}</b> ${u} by <b>${fmt(d2 / 2)}</b> ${u}. Area = ${d1} × ${fmt(d2 / 2)} = <b>${fmt(A)}</b> ${sq(u)}. Decomposing into triangles and rearranging gives the area without a new formula.</p>`,
      feedback: {
        correct: 'Correct. Decompose, rearrange, and the area stays the same.',
        wrong(ans, d) {
          const a = parseNum(ans[2]);
          if (near(a, d1 * d2)) return `${d1} × ${d2} is the area of the big rectangle around the rhombus. The rhombus fills only half of it.`;
          if (d.wrong.includes(1)) return `The rectangle's width is half the rhombus's height: ${d2} ÷ 2.`;
          if (d.wrong.includes(0)) return `The rectangle keeps the full width of the rhombus.`;
          return 'Multiply the rectangle’s length by its width.';
        },
      },
    };
  });

  // ---------- Select all parallelograms with a given area (ms) ----------
  G.define('g1_msArea', (r, o) => {
    const hard = !!o.hard;
    const u = r.pick(U5.UNITS);
    const table = hard
      ? {
          18: [
            [4.5, 4],
            [6, 3],
            [7.5, 2.4],
          ],
          30: [
            [7.5, 4],
            [12, 2.5],
            [6, 5],
          ],
          45: [
            [7.5, 6],
            [9, 5],
            [12.5, 3.6],
          ],
          42: [
            [10.5, 4],
            [7, 6],
            [8.4, 5],
          ],
        }
      : {
          24: [
            [6, 4],
            [8, 3],
            [12, 2],
          ],
          36: [
            [9, 4],
            [6, 6],
            [12, 3],
          ],
          48: [
            [8, 6],
            [12, 4],
            [16, 3],
          ],
          60: [
            [10, 6],
            [12, 5],
            [15, 4],
          ],
        };
    const target = Number(r.pick(Object.keys(table)));
    const [p1, p2] = r.pickN(table[target], 2);
    const mini = (b, h, side) => {
      const off = side ? round(Math.sqrt(side * side - h * h), 2) : b * 0.3;
      return V.parallelogram(b, h, {
        base: `${fmt(b)} ${u}`,
        height: `${fmt(h)} ${u}`,
        side: side ? `${fmt(side)} ${u}` : undefined,
        offset: off,
        width: 170,
        height2: 120,
        aria: `Parallelogram, base ${fmt(b)} ${u}, height ${fmt(h)} ${u}${side ? ', side ' + fmt(side) + ' ' + u : ''}`,
      });
    };
    // trap: base × slanted side = target, but the real height is smaller
    const trapB = p1[0],
      trapS = p1[1],
      trapH = round(trapS - 1, 1);
    const half = [p2[0], p2[1] / 2].every((x) => Number.isInteger(x)) ? [p2[0], p2[1] / 2] : [round(p2[0] / 2, 2), p2[1]];
    const bump = hard ? 0.5 : 2;
    const opts = [
      { html: mini(p1[0], p1[1]) + `<div class="muted">base ${fmt(p1[0])}, height ${fmt(p1[1])}</div>`, ok: true },
      { html: mini(p2[0], p2[1]) + `<div class="muted">base ${fmt(p2[0])}, height ${fmt(p2[1])}</div>`, ok: true },
      { html: mini(trapB, trapH, trapS) + `<div class="muted">base ${fmt(trapB)}, side ${fmt(trapS)}, height ${fmt(trapH)}</div>` },
      { html: mini(half[0], half[1]) + `<div class="muted">base ${fmt(half[0])}, height ${fmt(half[1])}</div>` },
      { html: mini(p1[0] + bump, p1[1]) + `<div class="muted">base ${fmt(p1[0] + bump)}, height ${fmt(p1[1])}</div>` },
    ];
    const sh = shuffleOptions(r, opts, [0, 1]);
    const ar = (b, h) => fmt(round(b * h, 2));
    return {
      type: 'ms',
      skill: 'area-parallelogram',
      lesson: '5-1',
      title: `Which have an area of ${target}?`,
      prompt: `<p>Select <b>all</b> parallelograms with an area of ${hl(target + ' ' + sq(u))}. Measurements are in ${u}.${hard ? ' Some measurements are decimals.' : ''}</p>`,
      options: sh.options,
      answers: sh.answers,
      layout: 'cards',
      hints: [
        'For each figure, multiply base × height. Ignore any slanted side.',
        `Which pairs of numbers multiply to ${target}? ${fmt(p1[0])} × ${fmt(p1[1])} and ${fmt(p2[0])} × ${fmt(p2[1])} do.`,
        `The figure with side ${fmt(trapS)} has height ${fmt(trapH)}. Multiply ${fmt(trapB)} × ${fmt(trapH)} and compare with ${target}.`,
      ],
      hintEs: 'Para cada figura, multiplica base × altura. No uses ningún lado inclinado.',
      solution: `<p>Area = base × height. ${fmt(p1[0])} × ${fmt(p1[1])} = ${target} and ${fmt(p2[0])} × ${fmt(p2[1])} = ${target}. The figure labelled with a slanted side ${fmt(trapS)} has area ${fmt(trapB)} × ${fmt(trapH)} = ${ar(trapB, trapH)}. The others give ${ar(half[0], half[1])} and ${ar(p1[0] + bump, p1[1])}.</p>`,
      feedback: {
        correct: `Correct. Both selected figures have base × height = ${target}.`,
        wrong(ans, d) {
          if (d.extra && d.extra.length) {
            const txt = sh.options[d.extra[0]].html;
            if (/side/.test(txt)) return `One figure you chose uses its slanted side ${fmt(trapS)}. Its real height is ${fmt(trapH)}, so its area is ${ar(trapB, trapH)}.`;
            if (txt.includes(`base ${fmt(half[0])}, height ${fmt(half[1])}`)) return `One figure you chose has area ${ar(half[0], half[1])}, only half of ${target}. Multiply base × height again.`;
            return `One figure you chose is close but not equal: ${ar(p1[0] + bump, p1[1])}, not ${target}. Multiply carefully.`;
          }
          return `You missed one. Look for another pair of numbers that multiply to ${target}.`;
        },
      },
    };
  });

  // ---------- True or false about rhombuses and parallelograms (tf) ----------
  G.define('g1_tfRhombus', (r, o) => {
    const hard = !!o.hard;
    const u = r.pick(U5.UNITS),
      s = r.int(5, 9),
      b = r.int(8, 14),
      side = r.int(4, 7);
    let v;
    if (hard) {
      const hs = r.int(5, 9) + 0.5,
        hh = round(hs - r.int(1, 3) + (r.chance(0.5) ? 0.5 : 0), 1),
        hb = r.int(6, 12),
        h2 = r.int(3, 7) + 0.5;
      v = r.pick([
        {
          stmt: `A parallelogram has base ${hb} ${u} and height ${fmt(h2)} ${u}. If the base becomes ${2 * hb} ${u} and the height stays ${fmt(h2)} ${u}, the area doubles.`,
          answer: true,
          coach: 'Area = base × height. Only one factor doubled, so the product doubles too.',
          h3: `Compare ${hb} × ${fmt(h2)} with ${2 * hb} × ${fmt(h2)}. How many times as large is the second product?`,
          reasons: [
            { html: 'Area = base × height. The base is 2 times as long and the height is the same, so the product is 2 times as large.', correct: true },
            { html: 'Doubling one side of a figure always makes its area 4 times as large.' },
            { html: 'The area stays the same because the height did not change.' },
          ],
        },
        {
          stmt: `A parallelogram has base ${hb} ${u} and height ${fmt(h2)} ${u}. If the base and the height both double, the area doubles too.`,
          answer: false,
          coach: 'Both factors doubled. Doubling twice makes the product 2 × 2 times as large, not 2 times.',
          h3: `Compare ${hb} × ${fmt(h2)} with ${2 * hb} × ${fmt(2 * h2)}. How many times as large is the second product?`,
          reasons: [
            { html: 'Both factors double, so the area becomes 2 × 2 = 4 times as large, not 2 times.', correct: true },
            { html: 'The area doubles because each measurement doubled.' },
            { html: 'The area stays the same because the shape did not change.' },
          ],
        },
        {
          stmt: `A square and a rhombus both have sides of ${fmt(hs)} ${u}. The rhombus leans, so its height is ${fmt(hh)} ${u}. The rhombus has the greater area.`,
          answer: false,
          coach: 'Compare side × side for the square with side × height for the rhombus. The leaning rhombus has the shorter height.',
          h3: `Compare ${fmt(hs)} × ${fmt(hs)} with ${fmt(hs)} × ${fmt(hh)}. Which is greater?`,
          reasons: [
            { html: `The rhombus's height (${fmt(hh)} ${u}) is less than its side, so side × height is less than the square's side × side.`, correct: true },
            { html: 'Leaning stretches a figure, so it covers more space.' },
            { html: 'Figures with equal side lengths always have equal areas.' },
          ],
        },
        {
          stmt: `A rhombus with sides of ${fmt(hs)} ${u} and height ${fmt(hh)} ${u} has the same area as a ${fmt(hs)} ${u} by ${fmt(hh)} ${u} rectangle.`,
          answer: true,
          coach: 'Cut a triangle off one end of the rhombus and slide it to the other end. What shape do you get?',
          h3: `Both areas are ${fmt(hs)} × ${fmt(hh)}. Decide whether they match.`,
          reasons: [
            { html: `Cut the triangle off one end of the rhombus and slide it: you get a ${fmt(hs)} by ${fmt(hh)} rectangle with the same area.`, correct: true },
            { html: `The rhombus has more area because all four of its sides are ${fmt(hs)} ${u}.` },
            { html: 'A rectangle always has more area because its corners are square.' },
          ],
        },
      ]);
    } else {
      v = r.pick([
        {
          stmt: `A rhombus with sides of ${s} ${u} must have an area of ${s * s} ${sq(u)}.`,
          answer: false,
          coach: `Is the side of a leaning rhombus the same as its height? Only a square has height equal to its side.`,
          h3: 'The statement uses a side as if it were the height. Decide if that is allowed.',
          reasons: [
            { html: `Only a square has a height equal to its side. A rhombus that leans has a height shorter than ${s} ${u}, so its area is less than ${s * s} ${sq(u)}.`, correct: true },
            { html: `A rhombus has four sides, so the area is 4 × ${s} = ${4 * s} ${sq(u)}.` },
            { html: `Side × side always gives the area of a figure with equal sides.` },
          ],
        },
        {
          stmt: 'A rhombus is a parallelogram, so its area is base × height.',
          answer: true,
          coach: 'A rhombus has two pairs of parallel sides. What does that make it?',
          h3: 'Check: does a rhombus have two pairs of parallel sides? If so, the parallelogram formula applies.',
          reasons: [
            { html: 'A rhombus has two pairs of parallel sides, which makes it a parallelogram. The formula A = b × h applies.', correct: true },
            { html: 'A rhombus has four equal sides, so its area is 4 × side.' },
            { html: 'A rhombus is half of a rectangle, so its area is ½ × base × height.' },
          ],
        },
        {
          stmt: `Two parallelograms both have base ${b} ${u} and height ${side} ${u}. One leans more than the other. They have the same area.`,
          answer: true,
          coach: 'Area uses only the base and the perpendicular height. Did either of those change?',
          h3: `Both areas are ${b} × ${side}. Decide whether they match.`,
          reasons: [
            { html: 'Area depends only on base and height. Leaning changes the slanted side, not the base or the perpendicular height.', correct: true },
            { html: 'The one that leans more has a longer slanted side, so it has more area.' },
            { html: 'They have the same area only if their slanted sides are also equal.' },
          ],
        },
        {
          stmt: `A parallelogram with base ${b} ${u} and slanted side ${side} ${u} has an area of ${b * side} ${sq(u)}.`,
          answer: false,
          coach: 'The statement multiplies by the slanted side. Is the slanted side the height?',
          h3: 'The statement uses the slanted side as if it were the height. Decide if that is allowed.',
          reasons: [
            { html: 'The slanted side is not the height. The height is perpendicular to the base and is shorter, so the area is less than ' + b * side + ' ' + sq(u) + '.', correct: true },
            { html: `The area should be half of ${b * side}, because the figure leans.` },
            { html: `The area is ${2 * (b + side)} ${sq(u)}, because you add all four sides.` },
          ],
        },
      ]);
    }
    const reasons = r.shuffle(v.reasons);
    return {
      type: 'tf',
      skill: 'area-rhombus',
      lesson: '5-1',
      title: 'True or false?',
      prompt: `<p>Decide whether the statement is true or false, then choose the best reason.</p><p class="stmt"><b>${v.stmt}</b></p>`,
      answer: v.answer,
      reasons,
      hints: [
        hard ? 'Use A = base × perpendicular height. Test the statement with the numbers given.' : 'Think about the formula: base × perpendicular height. Does the statement use a true height?',
        'A slanted side is longer than the height. Only in a square or rectangle does a side equal the height.',
        v.h3,
      ],
      hintEs: hard
        ? 'Usa A = base × altura perpendicular. Comprueba el enunciado con los números que te dan.'
        : 'Piensa en la fórmula: base × altura perpendicular. ¿El enunciado usa una altura verdadera?',
      solution: `<p><b>${v.answer ? 'True' : 'False'}.</b> ${reasons.find((x) => x.correct).html}</p>`,
      feedback: {
        correct: 'Correct. Area of any parallelogram, including a rhombus, is base × perpendicular height.',
        wrong(ans, d) {
          return !d.valueOk ? v.coach : 'Your true/false is right. Pick the reason that explains it with base × perpendicular height.';
        },
      },
    };
  });
})(typeof window !== 'undefined' ? window : globalThis);

/* js/units/u5/gen-triangle.js */
/* Zone 2 — The Drafting Hall. Lesson 5-2 Determine the Area of Triangles. */
(function (root) {
  'use strict';
  const RX = root.RX;
  const { G, V, shuffleOptions, NAMES, round, fmt, parseNum, U5 } = RX;
  const hl = V.hl;
  const C = V.COLORS;
  const sq = U5.sq;

  // (horizontal run, height, slanted side) Pythagorean triples keep drawings honest.
  const TRIPLES = [
    [3, 4, 5],
    [4, 3, 5],
    [6, 8, 10],
    [8, 6, 10],
    [5, 12, 13],
  ];
  const OBJECTS = ['sail', 'gusset plate', 'pennant', 'garden bed', 'roof truss', 'ramp side', 'tent flap', 'warning sign'];

  /** Draw a triangle; obtuse when o.outside (apex past the right end of the base). Labels the slanted side when o.side.
   *  o.hard: half-unit measurements (height × 1.5, and a half-unit base whenever the height is whole), so ½bh needs care. */
  function tri(r, o) {
    o = o || {};
    const [dx0, h0, s0] = r.pick(TRIPLES);
    const k = o.hard ? 1.5 : 1;
    const dx = dx0 * k,
      h = round(h0 * k, 1),
      s = round(s0 * k, 1);
    let b;
    if (o.b) b = o.b;
    else if (o.hard) b = r.int(Math.max(6, Math.round(h * 0.7)), Math.round(h * 2) + 2) + (Number.isInteger(h) ? 0.5 : 0);
    else {
      b = r.int(Math.max(4, Math.round(h * 0.7)), h * 2 + 2);
      if ((b * h) % 2) b += 1;
    }
    const outside = o.outside == null ? r.chance(0.4) : o.outside;
    const apex = outside ? b + dx : Math.max(1, b - dx);
    const u = o.u || r.pick(U5.UNITS);
    const sides = o.side ? [{ x: (b + apex) / 2, y: h / 2, text: `${fmt(s)} ${u}`, anchor: 'start', dx: 10 }] : [];
    const svg = V.triangle(b, h, {
      apex,
      base: `${fmt(b)} ${u}`,
      height: `${fmt(h)} ${u}`,
      sides,
      aria: `Triangle with base ${fmt(b)} ${u} and height ${fmt(h)} ${u}${o.side ? `, slanted side ${fmt(s)} ${u}` : ''}${outside ? ', height drawn outside the triangle' : ''}`,
    });
    return { b, h, s, u, outside, svg, A: round((b * h) / 2, 2) };
  }
  function miniTri(b, h, u, outside) {
    const apex = outside ? b + Math.round(h * 0.6) : b * 0.35;
    return V.figure({
      pts: [
        [0, 0],
        [b, 0],
        [apex, h],
      ],
      extraPts: outside ? [[apex, 0]] : [],
      dashes: [[apex, 0, apex, h, C.d]].concat(outside ? [[b, 0, apex, 0, C.axis]] : []),
      rightAngles: [[apex, 0, apex < b / 2 ? 1 : -1, 1]],
      labels: [
        { x: b / 2, y: 0, text: `${fmt(b)} ${u}`, dy: 18, size: 12 },
        { x: apex, y: h / 2, text: `${fmt(h)} ${u}`, anchor: 'start', dx: 6, color: C.d, size: 12 },
      ],
      width: 170,
      height: 110,
      aria: `Triangle, base ${fmt(b)} ${u}, height ${fmt(h)} ${u}`,
    });
  }
  const near = (v, x) => v != null && Math.abs(v - x) < 0.01;
  function coach(t, v) {
    if (v == null) return 'Area of a triangle = ½ × base × height. Enter one number.';
    if (near(v, t.b * t.h)) return `${fmt(t.b)} × ${fmt(t.h)} is the area of a parallelogram with this base and height. A triangle is half of that. Divide by 2.`;
    if (near(v, (t.b * t.s) / 2) || near(v, t.b * t.s))
      return `You used the slanted side (${fmt(t.s)}). The height is the dashed segment that meets the base at a right angle: ${fmt(t.h)} ${t.u}.`;
    if (near(v, t.b + t.h) || near(v, (t.b + t.h) / 2)) return 'Adding gives a length, not an area. Multiply ½ × base × height.';
    if (near(v, t.A / 2)) return 'You halved twice. Take half of base × height only once.';
    if (near(v, (Math.floor(t.b) * Math.floor(t.h)) / 2) || near(v, (Math.floor(t.b) * t.h) / 2) || near(v, (t.b * Math.floor(t.h)) / 2))
      return 'A half unit was dropped. Multiply the full decimal measurements, then take half.';
    return 'Multiply the base by the height, then take half. Check your multiplication.';
  }

  // ---------- Area = ½bh, including obtuse triangles (num) ----------
  G.define('g2_areaHalf', (r, o) => {
    const hard = !!o.hard;
    const t = tri(r, { side: hard || r.chance(0.6), hard });
    const name = r.pick(NAMES),
      obj = r.pick(OBJECTS);
    const given = hard
      ? `It is labelled with its base, its slanted side, and its height: ${fmt(t.b)} ${t.u}, ${fmt(t.s)} ${t.u}, and ${fmt(t.h)} ${t.u}.`
      : `Its base is ${hl(fmt(t.b) + ' ' + t.u)} and its height is ${hl(fmt(t.h) + ' ' + t.u)}.`;
    return {
      type: 'num',
      skill: 'area-triangle',
      lesson: '5-2',
      title: 'Area of a triangle',
      prompt: `<p>${name} is cutting a triangular ${obj}. ${given}${t.outside ? ' The height is drawn outside the triangle because the triangle is obtuse.' : ''}</p>${t.svg}<p>What is the area of the ${obj}?</p>`,
      unit: sq(t.u),
      answer: t.A,
      reference: true,
      hints: [
        'A triangle is half of a parallelogram with the same base and height. Area = ½ × base × height.',
        `Base = ${fmt(t.b)}, height = ${fmt(t.h)} (the dashed segment with the right-angle mark). ${t.outside ? 'Even though the height is drawn outside, it still counts as the height.' : ''}`,
        `${fmt(t.b)} × ${fmt(t.h)} = ${fmt(round(t.b * t.h, 2))}. Now take half.`,
      ],
      hintEs: 'Un triángulo es la mitad de un paralelogramo con la misma base y la misma altura. Área = ½ × base × altura.',
      solution: `<p>A = ½ × b × h = ½ × ${fmt(t.b)} × ${fmt(t.h)} = <b>${fmt(t.A)} ${sq(t.u)}</b>. Two copies of this triangle make a parallelogram of area ${fmt(round(t.b * t.h, 2))}, so the triangle is half.${t.outside ? ' In an obtuse triangle the height falls outside the figure, but the formula is the same.' : ''}</p>`,
      feedback: { correct: `Correct. ½ × ${fmt(t.b)} × ${fmt(t.h)} = ${fmt(t.A)} ${sq(t.u)}.`, wrong: (ans, d) => coach(t, d.value) },
    };
  });

  // ---------- Fill the formula (blanks, template) ----------
  G.define('g2_blanksFormula', (r, o) => {
    const hard = !!o.hard;
    const t = tri(r, { side: true, hard });
    return {
      type: 'blanks',
      skill: 'area-triangle',
      lesson: '5-2',
      title: 'Fill in the formula',
      prompt: hard
        ? `<p>Use the formula to find the area of the triangle. Write the base first, then the height. The figure has three labels: ${fmt(t.b)} ${t.u}, ${fmt(t.s)} ${t.u}, and ${fmt(t.h)} ${t.u}.</p>${t.svg}`
        : `<p>Use the formula to find the area of the triangle. Write the base first, then the height. One label on the figure is a slanted side, which the formula does not use.</p>${t.svg}`,
      fields: [
        { label: 'base', answer: t.b },
        { label: 'height', answer: t.h },
        { label: 'area', answer: t.A },
      ],
      template: `Area = ½ × base × height = ½ × {0} × {1} = {2} ${sq(t.u)}`,
      reference: true,
      hints: [
        'The base is the bottom side. The height is the dashed segment with the right-angle mark.',
        `Base = ${fmt(t.b)} ${t.u}, height = ${fmt(t.h)} ${t.u}. The ${fmt(t.s)} ${t.u} side is slanted; skip it.`,
        `½ × ${fmt(t.b)} × ${fmt(t.h)} = half of ${fmt(round(t.b * t.h, 2))}.`,
      ],
      hintEs: 'La base es el lado de abajo. La altura es el segmento punteado con la marca de ángulo recto.',
      solution: `<p>Area = ½ × <b>${fmt(t.b)}</b> × <b>${fmt(t.h)}</b> = <b>${fmt(t.A)}</b> ${sq(t.u)}. The slanted side (${fmt(t.s)} ${t.u}) is longer than the height and is never used in the area formula.</p>`,
      feedback: {
        correct: 'Correct. Base, perpendicular height, and the half.',
        wrong(ans, d) {
          const hv = parseNum(ans[1]),
            av = parseNum(ans[2]);
          if (near(hv, t.s)) return `You used the slanted side ${fmt(t.s)} as the height. The height is the dashed segment, ${fmt(t.h)} ${t.u}.`;
          if (d.wrong.length === 1 && d.wrong[0] === 2) {
            if (near(av, t.b * t.h)) return `You forgot the ½. ${fmt(t.b)} × ${fmt(t.h)} is a whole parallelogram; take half of it.`;
            return `Base and height are right. Area = ½ × ${fmt(t.b)} × ${fmt(t.h)}: multiply, then halve.`;
          }
          return 'The base is the bottom side. The height is the dashed segment with the right-angle mark.';
        },
      },
    };
  });

  // ---------- Who is correct? forgot the half vs slanted side (who) ----------
  G.define('g2_whoHalf', (r, o) => {
    const hard = !!o.hard;
    const t = tri(r, { side: true, hard });
    const [n1, n2, n3, n4] = r.pickN(NAMES, 4);
    const cards = [
      { title: n1, html: `A = ½ × ${fmt(t.b)} × ${fmt(t.h)}<br><b>A = ${fmt(t.A)} ${sq(t.u)}</b>`, ok: true },
      {
        title: n2,
        html: `A = ${fmt(t.b)} × ${fmt(t.h)}<br><b>A = ${fmt(round(t.b * t.h, 2))} ${sq(t.u)}</b>`,
        why: `${n2} forgot the ½. Base × height is the area of a parallelogram; the triangle is half of it.`,
      },
      {
        title: n3,
        html: `A = ½ × ${fmt(t.b)} × ${fmt(t.s)}<br><b>A = ${fmt(round((t.b * t.s) / 2, 2))} ${sq(t.u)}</b>`,
        why: `${n3} used the slanted side (${fmt(t.s)}) as the height. The height is the perpendicular segment, ${fmt(t.h)}.`,
      },
    ];
    if (hard)
      cards.push({
        title: n4,
        html: `A = ½ × ${fmt(t.b)} × ${fmt(t.h)} ÷ 2<br><b>A = ${fmt(round(t.A / 2, 2))} ${sq(t.u)}</b>`,
        why: `${n4} took half twice. The ½ in the formula is the only halving step.`,
      });
    const sh = shuffleOptions(r, cards, 0);
    return {
      type: 'who',
      skill: 'area-triangle',
      lesson: '5-2',
      title: 'Who is correct?',
      prompt: `<p>${hard ? 'Four' : 'Three'} students find the area of this triangle. Who is correct?</p>${t.svg}`,
      options: sh.options,
      answer: sh.answer,
      layout: 'cards',
      hints: [
        'Check two things in each solution: did they include the ½, and did they use the perpendicular height?',
        `The perpendicular height is ${fmt(t.h)} ${t.u}, not ${fmt(t.s)} ${t.u}.`,
        `Find ½ × ${fmt(t.b)} × ${fmt(t.h)}, then look for the student whose work and answer match it.`,
      ],
      hintEs: 'Revisa dos cosas en cada solución: ¿incluyeron el ½? ¿Usaron la altura perpendicular?',
      solution: `<p><b>${n1}</b> is correct: ½ × ${fmt(t.b)} × ${fmt(t.h)} = ${fmt(t.A)} ${sq(t.u)}. ${n2} forgot the ½, and ${n3} used the slanted side instead of the height.${hard ? ` ${n4} halved twice.` : ''}</p>`,
      feedback: {
        correct: `Correct. ${n1} used the half and the perpendicular height.`,
        wrong: (ans) => (sh.options[ans] && sh.options[ans].why) || 'Check each student for the ½ and the perpendicular height.',
      },
    };
  });

  // ---------- Order triangles by area (seq) ----------
  G.define('g2_seqArea', (r, o) => {
    const hard = !!o.hard;
    const u = r.pick(U5.UNITS);
    const n = hard ? 4 : 3;
    const dims = [];
    const seen = new Set();
    while (dims.length < n) {
      // hard: half-unit bases, and four triangles whose areas are close together
      const b = hard ? r.int(5, 11) + 0.5 : r.int(4, 12),
        h = hard ? 2 * r.int(2, 5) : r.int(3, 9);
      const A = round((b * h) / 2, 2);
      if ((!hard && (b * h) % 2) || seen.has(A)) continue;
      seen.add(A);
      dims.push({ b, h, A, outside: r.chance(0.3) });
    }
    const asc = r.chance(0.5);
    const idx = dims.map((d, i) => i);
    const items = dims.map((d) => ({ html: miniTri(d.b, d.h, u, d.outside) + `<div class="muted">base ${fmt(d.b)} ${u}, height ${fmt(d.h)} ${u}</div>`, rate: d.A }));
    const order = idx.slice().sort((a, b) => (asc ? items[a].rate - items[b].rate : items[b].rate - items[a].rate));
    const byKey = (key) => idx.slice().sort((a, b) => (asc ? dims[a][key] - dims[b][key] : dims[b][key] - dims[a][key])).join();
    return {
      type: 'seq',
      skill: 'area-triangle',
      lesson: '5-2',
      title: 'Order by area',
      prompt: `<p>Order the ${hard ? 'four' : 'three'} triangles from <b>${asc ? 'least' : 'greatest'}</b> area (top) to <b>${asc ? 'greatest' : 'least'}</b> area (bottom).</p>`,
      items,
      order,
      hints: [
        'Find each area with ½ × base × height. Do not judge by how tall or wide the picture looks.',
        `Set up each area: ${dims.map((d) => `½ × ${fmt(d.b)} × ${fmt(d.h)}`).join('; ')}.`,
        `Compute each product and halve it, then put the ${asc ? 'smallest' : 'largest'} area at the top.`,
      ],
      hintEs: 'Halla el área de cada triángulo con ½ × base × altura. No decidas por lo alto o lo ancho que se ve el dibujo.',
      solution: `<p>${dims.map((d) => `base ${fmt(d.b)}, height ${fmt(d.h)} → ${fmt(d.A)} ${sq(u)}`).join('; ')}. From ${asc ? 'least to greatest' : 'greatest to least'}: <b>${order.map((i) => fmt(dims[i].A)).join(', ')}</b>.</p>`,
      feedback: {
        correct: 'Correct. Computing each area beats eyeballing the pictures.',
        wrong(ans) {
          const a = Array.isArray(ans) ? ans.join() : '';
          if (a === order.slice().reverse().join()) return `Your order is reversed. The ${asc ? 'least' : 'greatest'} area goes at the top.`;
          if (a === byKey('b') && a !== order.join()) return 'You ordered by the base alone. Area depends on both base and height: ½ × base × height.';
          if (a === byKey('h') && a !== order.join()) return 'You ordered by the height alone. Area depends on both base and height: ½ × base × height.';
          return `Compute ½ × base × height for each triangle, then order the areas with the ${asc ? 'least' : 'greatest'} at the top.`;
        },
      },
    };
  });

  // ---------- Missing height or base from the area (num) ----------
  G.define('g2_missingHeight', (r, o) => {
    const hard = !!o.hard;
    const u = r.pick(U5.UNITS);
    let b, h;
    if (hard) {
      b = 4 * r.int(2, 5);
      h = r.int(3, 9) + 0.5;
    } else {
      b = r.int(4, 14);
      h = r.int(3, 12);
      if ((b * h) % 2) b += 1;
    }
    const A = round((b * h) / 2, 2);
    const askHeight = hard ? true : r.chance(0.6);
    const want = askHeight ? h : b,
      other = askHeight ? b : h;
    const otherName = askHeight ? 'base' : 'height',
      wantName = askHeight ? 'height' : 'base';
    const otherEs = askHeight ? 'la base' : 'la altura';
    const name = r.pick(NAMES),
      obj = r.pick(OBJECTS);
    const svg = V.triangle(b, h, {
      apex: b * 0.4,
      base: askHeight ? `${fmt(b)} ${u}` : `? ${u}`,
      height: askHeight ? `? ${u}` : `${fmt(h)} ${u}`,
      aria: `Triangle with ${otherName} ${fmt(other)} ${u} and unknown ${wantName}`,
    });
    return {
      type: 'num',
      skill: 'missing-measures',
      lesson: '5-2',
      title: hard ? `Seal of Area: missing ${wantName}` : `Find the missing ${wantName}`,
      xp: o.xp,
      prompt: `<p>${name}'s triangular ${obj} has an area of ${hl(fmt(A) + ' ' + sq(u))}. Its ${otherName} is ${hl(fmt(other) + ' ' + u)}.</p>${svg}<p>What is the ${wantName} of the ${obj}?</p>`,
      unit: u,
      answer: want,
      reference: true,
      hints: [
        `Start from A = ½ × b × h. You know A and the ${otherName}. Work backward.`,
        `Undo the ½ first: 2 × ${fmt(A)} = ${fmt(2 * A)}. That equals base × height.`,
        `${fmt(2 * A)} ÷ ${fmt(other)}.`,
      ],
      hintEs: `Empieza con A = ½ × b × h. Conoces A y ${otherEs}. Trabaja hacia atrás.`,
      solution: `<p>A = ½ × b × h, so b × h = 2 × A = ${fmt(2 * A)}. Then ${wantName} = ${fmt(2 * A)} ÷ ${fmt(other)} = <b>${fmt(want)} ${u}</b>. Check: ½ × ${fmt(b)} × ${fmt(h)} = ${fmt(A)}.</p>`,
      feedback: {
        correct: `Correct. Doubling the area undoes the ½; dividing by the ${otherName} leaves the ${wantName}: ${fmt(want)} ${u}.`,
        wrong(ans, d) {
          const v = d.value;
          if (near(v, A / other))
            return `You divided the area by the ${otherName} but forgot the ½. Double the area first: 2 × ${fmt(A)} = ${fmt(2 * A)}, then divide by ${fmt(other)}.`;
          if (near(v, 2 * A)) return `${fmt(2 * A)} is base × height. Divide by the ${otherName} ${fmt(other)} to get the ${wantName}.`;
          if (near(v, A / other / 2)) return `You halved twice. The ½ is already in the area. Double the area, then divide by ${fmt(other)}.`;
          if (near(v, A * other) || near(v, (A * other) / 2)) return `You multiplied by the ${otherName}. The ${wantName} is missing, so work backward with division.`;
          return `Work backward: double the area, then divide by the ${otherName}.`;
        },
      },
    };
  });

  // ---------- Table with a missing area, height, and base (table) ----------
  G.define('g2_tableMissing', (r, o) => {
    const hard = !!o.hard;
    const u = r.pick(U5.UNITS),
      name = r.pick(NAMES);
    // hard: one measurement in each row is a half unit (the missing height and missing base are decimals)
    const mk = (half) => {
      if (hard) {
        const even = 2 * r.int(2, 7),
          odd = r.int(3, 11) + 0.5;
        const [b, h] = half === 'b' ? [odd, even] : [even, odd];
        return { b, h, A: round((b * h) / 2, 2) };
      }
      let b = r.int(4, 14),
        h = r.int(3, 10);
      if ((b * h) % 2) b += 1;
      return { b, h, A: (b * h) / 2 };
    };
    const d = [mk('b'), mk('h'), mk('b')];
    const rows = [
      ['Triangle', `Base (${u})`, `Height (${u})`, `Area (${sq(u)})`],
      ['A', fmt(d[0].b), fmt(d[0].h), '__IN:a0__'],
      ['B', fmt(d[1].b), '__IN:h1__', fmt(d[1].A)],
      ['C', '__IN:b2__', fmt(d[2].h), fmt(d[2].A)],
    ];
    return {
      type: 'table',
      skill: 'missing-measures',
      lesson: '5-2',
      title: 'Complete the triangle table',
      prompt: `<p>${name} is checking three triangular plates measured in ${u}. One number is missing from each row.${hard ? ' Some answers are not whole numbers.' : ''} Complete the table.</p>`,
      rows,
      header: true,
      inputs: [
        { id: 'a0', answer: d[0].A },
        { id: 'h1', answer: d[1].h },
        { id: 'b2', answer: d[2].b },
      ],
      reference: true,
      hints: [
        'Row A: A = ½ × b × h. Rows B and C: double the area, then divide by the measurement you know.',
        `A: ½ × ${fmt(d[0].b)} × ${fmt(d[0].h)}. B: 2 × ${fmt(d[1].A)} = ${fmt(2 * d[1].A)}, then ÷ ${fmt(d[1].b)}.`,
        `C: 2 × ${fmt(d[2].A)} = ${fmt(2 * d[2].A)}, then ÷ ${fmt(d[2].h)}.`,
      ],
      hintEs: 'Fila A: A = ½ × b × h. Filas B y C: duplica el área y luego divide entre la medida que conoces.',
      solution: `<p>A: ½ × ${fmt(d[0].b)} × ${fmt(d[0].h)} = <b>${fmt(d[0].A)}</b>. B: ${fmt(2 * d[1].A)} ÷ ${fmt(d[1].b)} = <b>${fmt(d[1].h)}</b>. C: ${fmt(2 * d[2].A)} ÷ ${fmt(d[2].h)} = <b>${fmt(d[2].b)}</b>. Doubling the area undoes the ½ in the formula.</p>`,
      feedback: {
        correct: 'Correct. Forward: half of base × height. Backward: double the area, then divide.',
        wrong(ans, d2) {
          const val = (id) => parseNum(ans[id]);
          if (d2.wrong.includes('a0')) {
            if (near(val('a0'), d[0].b * d[0].h)) return `Row A: you forgot the ½. ${fmt(d[0].b)} × ${fmt(d[0].h)} is a parallelogram; the triangle is half.`;
            return `Row A: multiply ${fmt(d[0].b)} × ${fmt(d[0].h)}, then take half.`;
          }
          for (const [id, row, known, what] of [
            ['h1', d[1], d[1].b, 'base'],
            ['b2', d[2], d[2].h, 'height'],
          ]) {
            if (!d2.wrong.includes(id)) continue;
            const v = val(id),
              R = id === 'h1' ? 'B' : 'C';
            if (near(v, row.A / known)) return `Row ${R}: you divided the area by the ${what} but did not undo the ½. Double ${fmt(row.A)} first.`;
            if (near(v, 2 * row.A)) return `Row ${R}: ${fmt(2 * row.A)} is base × height. Now divide by the ${what} ${fmt(known)}.`;
            return `Row ${R}: 2 × ${fmt(row.A)} = ${fmt(2 * row.A)}. Divide by the ${what} ${fmt(known)}.`;
          }
          return 'Forward: half of base × height. Backward: double the area, then divide.';
        },
      },
    };
  });

  // ---------- Error: forgot to double / halved instead of doubled when finding the height (error) ----------
  G.define('g2_errorDouble', (r, o) => {
    const hard = !!o.hard;
    const u = r.pick(U5.UNITS),
      name = r.pick(NAMES);
    const b = hard ? 2 * r.int(3, 7) + 1 : 2 * r.int(3, 8),
      h = r.int(4, 12),
      A = round((b * h) / 2, 2);
    const kind = hard ? r.pick(['forgot', 'halved']) : 'forgot';
    const wrongH = kind === 'forgot' ? round(A / b, 2) : round(A / 2 / b, 2);
    const check = round((b * wrongH) / 2, 2);
    const opts =
      kind === 'forgot'
        ? [
            { html: `${name} forgot the ½ in the formula. Base × height equals 2 × ${fmt(A)} = ${fmt(2 * A)}, so the height is ${fmt(2 * A)} ÷ ${b}.`, ok: true },
            {
              html: `${name} should have divided the area by 2 first, then divided by ${b}.`,
              why: `Dividing by 2 makes the height even smaller. The ½ in the formula means base × height is twice the area, so multiply the area by 2.`,
            },
            { html: `${name} should have multiplied ${fmt(A)} × ${b}.`, why: 'Multiplying area by base gives a huge number with no meaning. Work backward from A = ½ × b × h by dividing.' },
            { html: `${name}'s work is correct.`, why: `Check it: ½ × ${b} × ${fmt(wrongH)} = ${fmt(check)}, not ${fmt(A)}. The height is too small.` },
          ]
        : [
            { html: `${name} undid the ½ the wrong way. Base × height is twice the area, so multiply by 2: 2 × ${fmt(A)} = ${fmt(2 * A)}, then ÷ ${b}.`, ok: true },
            { html: `${name} forgot about the ½ completely.`, why: `${name} did deal with the ½, by dividing by 2. The problem is the direction: undoing × ½ means multiplying by 2.` },
            { html: `${name} should have divided ${b} by ${fmt(A)}.`, why: 'Dividing the base by the area flips the division. Divide base × height by the base.' },
            { html: `${name}'s work is correct.`, why: `Check it: ½ × ${b} × ${fmt(wrongH)} = ${fmt(check)}, not ${fmt(A)}. The height is far too small.` },
          ];
    const sh = shuffleOptions(r, opts, 0);
    const work =
      kind === 'forgot'
        ? `A = ½ × b × h<br>${fmt(A)} = ½ × ${b} × h<br>h = ${fmt(A)} ÷ ${b} = ${fmt(wrongH)} ${u}`
        : `A = ½ × b × h<br>${fmt(A)} = ½ × ${b} × h<br>${fmt(A)} ÷ 2 = ${fmt(round(A / 2, 2))}<br>h = ${fmt(round(A / 2, 2))} ÷ ${b} = ${fmt(wrongH)} ${u}`;
    return {
      type: 'error',
      skill: 'missing-measures',
      lesson: '5-2',
      title: 'Find the mistake',
      prompt: `<p>A triangle has an area of ${hl(fmt(A) + ' ' + sq(u))} and a base of ${hl(b + ' ' + u)}. ${name} tried to find the height.</p><p>What is wrong with ${name}'s work?</p>`,
      work,
      options: sh.options,
      answer: sh.answer,
      fix: { label: `Correct height (${u}):`, answer: h },
      hints: [
        `Check ${name}'s answer: does ½ × ${b} × ${fmt(wrongH)} equal ${fmt(A)}?`,
        `½ × ${b} × ${fmt(wrongH)} = ${fmt(check)}. Too small. The ½ was not undone correctly when working backward.`,
        `Double the area: 2 × ${fmt(A)} = ${fmt(2 * A)}. Then ${fmt(2 * A)} ÷ ${b}.`,
      ],
      hintEs: `Revisa la respuesta de ${name}: ¿½ × ${b} × ${fmt(wrongH)} es igual a ${fmt(A)}?`,
      solution: `<p>From A = ½ × b × h, base × height = 2 × A = ${fmt(2 * A)}. So h = ${fmt(2 * A)} ÷ ${b} = <b>${h} ${u}</b>. ${kind === 'forgot' ? `${name} divided the area by the base without undoing the ½, which gave half the true height.` : `${name} divided the area by 2 instead of multiplying by 2, which gave a quarter of the true height.`}</p>`,
      feedback: {
        correct: `Correct. When working backward, undo the ½ by doubling the area. h = ${fmt(2 * A)} ÷ ${b} = ${h}.`,
        wrong(ans, d) {
          if (!d.mistakeOk) return (sh.options[ans.mistake] && sh.options[ans.mistake].why) || `Test the student's height in the formula: ½ × ${b} × ${fmt(wrongH)}.`;
          const v = parseNum(ans.fix);
          if (near(v, wrongH)) return `That is ${name}'s height again. Fix the mistake: double the area, then divide by ${b}.`;
          if (near(v, 2 * A)) return `${fmt(2 * A)} is base × height. Now divide by the base ${b}.`;
          if (near(v, A / b)) return 'You divided the area by the base without doubling it first.';
          return `You found the mistake. For the fix, double the area, then divide by the base ${b}.`;
        },
      },
    };
  });

  // ---------- Constructed response: why the height sits outside / why the half (cr) ----------
  G.define('g2_crHeight', (r, o) => {
    const hard = !!o.hard;
    const t = tri(r, { outside: true, side: hard, hard });
    const checkWrong = (sh) => (ans, d) => {
      if (!d.wroteEnough) return null;
      return (sh.options[ans.check] && sh.options[ans.check].why) || null;
    };
    if (r.chance(0.5)) {
      const sh = shuffleOptions(
        r,
        [
          { html: `${fmt(t.A)} ${sq(t.u)}`, ok: true },
          { html: `${fmt(round(t.b * t.h, 2))} ${sq(t.u)}`, why: 'That is base × height without the ½.' },
          hard
            ? { html: `${fmt(round((t.b * t.s) / 2, 2))} ${sq(t.u)}`, why: `That uses the slanted side ${fmt(t.s)} instead of the dashed height.` }
            : { html: `${fmt(t.b + t.h)} ${sq(t.u)}`, why: 'That adds the base and height.' },
        ],
        0,
      );
      const cw = checkWrong(sh);
      return {
        type: 'cr',
        skill: 'area-triangle',
        lesson: '5-2',
        title: 'Explain the outside height',
        prompt: `<p>In this obtuse triangle, the dashed height is drawn <b>outside</b> the figure.${hard ? ' The figure also shows a slanted side.' : ''}</p>${t.svg}<p>Explain why the height is drawn there and how you would still find the area. Then answer the check question.</p>`,
        starters: ['The height must make a right angle with…', 'The dashed line is outside because…', 'To find the area, I would…'],
        minWords: hard ? 12 : 10,
        check: {
          prompt: hard
            ? `What is the area of the triangle (base ${fmt(t.b)} ${t.u}, slanted side ${fmt(t.s)} ${t.u}, height ${fmt(t.h)} ${t.u})?`
            : `What is the area of the triangle (base ${fmt(t.b)} ${t.u}, height ${fmt(t.h)} ${t.u})?`,
          options: sh.options,
          answer: sh.answer,
        },
        hints: [
          'The height is the perpendicular distance from the base line to the top vertex. In an obtuse triangle, the top vertex sits past the end of the base.',
          'The base line is extended so the height can meet it at a right angle. The formula does not change.',
          `Area = ½ × ${fmt(t.b)} × ${fmt(t.h)}.`,
        ],
        hintEs: 'La altura es la distancia perpendicular desde la línea de la base hasta el vértice de arriba. En un triángulo obtusángulo, ese vértice queda más allá del extremo de la base.',
        solution: `<p>The height is the perpendicular distance from the top vertex to the line of the base. The vertex is past the end of the base, so the base line is extended and the height lands outside. The area is still ½ × ${fmt(t.b)} × ${fmt(t.h)} = <b>${fmt(t.A)} ${sq(t.u)}</b>.</p>`,
        feedback: {
          correct: 'Correct. The height is a perpendicular distance, inside or outside, and the formula stays ½ × b × h.',
          wrong(ans, d) {
            if (!d.wroteEnough) return 'Write a few more words. Mention the right angle and the extended base.';
            return cw(ans, d) || 'Your explanation is in. For the check, use ½ × base × the dashed height.';
          },
        },
      };
    }
    const P = round(t.b * t.h, 2);
    const sh = shuffleOptions(
      r,
      [
        { html: `${fmt(round(P / 2, 2))} ${sq(t.u)}`, ok: true },
        { html: `${fmt(P)} ${sq(t.u)}`, why: 'That is the whole parallelogram.' },
        { html: `${fmt(P * 2)} ${sq(t.u)}`, why: 'The triangle is smaller than the parallelogram, not bigger.' },
      ],
      0,
    );
    const cw = checkWrong(sh);
    return {
      type: 'cr',
      skill: 'area-triangle',
      lesson: '5-2',
      title: 'Explain the half',
      prompt: `<p>A parallelogram has base ${hl(fmt(t.b) + ' ' + t.u)} and height ${hl(fmt(t.h) + ' ' + t.u)}, so its area is ${fmt(P)} ${sq(t.u)}. A triangle has the same base and the same height.</p><p>Explain why the triangle's area is <b>half</b> the parallelogram's area.${hard ? ' Use the words <i>diagonal</i> and <i>identical</i>.' : ''} Then answer the check question.</p>`,
      starters: ['If I cut the parallelogram along a diagonal…', 'Two copies of the triangle…', 'The triangle has the same base and height, but…'],
      minWords: hard ? 12 : 10,
      check: { prompt: "What is the triangle's area?", options: sh.options, answer: sh.answer },
      hints: [
        'Picture cutting the parallelogram along a diagonal. What two pieces do you get?',
        'The two pieces are identical triangles, each with the same base and height as the parallelogram.',
        `Take half of ${fmt(P)}.`,
      ],
      hintEs: 'Imagina que cortas el paralelogramo por una diagonal. ¿Qué dos piezas obtienes?',
      solution: `<p>Cutting a parallelogram along a diagonal makes two identical triangles with the same base and height. Each is half the parallelogram, so the triangle's area is ½ × ${fmt(P)} = <b>${fmt(round(P / 2, 2))} ${sq(t.u)}</b>. That is where the ½ in the formula comes from.</p>`,
      feedback: {
        correct: 'Correct. Two identical triangles make the parallelogram, so each is half.',
        wrong(ans, d) {
          if (!d.wroteEnough) return 'Add a bit more. Mention the diagonal and the two identical triangles.';
          return cw(ans, d) || 'Your explanation is in. For the check, the triangle is half of the parallelogram.';
        },
      },
    };
  });
})(typeof window !== 'undefined' ? window : globalThis);

/* js/units/u5/gen-trapezoid.js */
/* Zone 3 — The Keystone Bridge. Lesson 5-3 Determine the Area of Trapezoids. */
(function (root) {
  'use strict';
  const RX = root.RX;
  const { G, V, shuffleOptions, NAMES, round, fmt, parseNum, U5 } = RX;
  const hl = V.hl;
  const C = V.COLORS;
  const sq = U5.sq;

  const OBJECTS = ['bridge stone', 'garden plot', 'window pane', 'ramp side', 'lampshade panel', 'flower bed', 'roof panel', 'sign board'];
  const near = (a, b) => a != null && Math.abs(a - b) < 0.01;

  /**
   * Isosceles trapezoid: rectangle b2 × h plus two triangles with base `off` and height h.
   * Easy: whole numbers. Hard: half-unit short base and triangle bases (every area stays ≤ 2 decimals).
   */
  function isoTrap(r, o) {
    o = o || {};
    let off, h, b2;
    if (o.hard) {
      off = r.pick([1.5, 2.5, 3.5]);
      h = 2 * r.int(2, 5);
      b2 = r.int(5, 12) + 0.5;
    } else {
      off = r.pick([1, 2, 3, 4]);
      h = r.int(3, 8);
      if ((off * h) % 2) h += 1; // each triangle area off*h/2 is whole
      b2 = r.int(Math.max(3, off + 1), off + 7);
    }
    const b1 = round(b2 + 2 * off, 2);
    const u = o.u || r.pick(U5.UNITS);
    return { b1, b2, h, off, u, rect: round(b2 * h, 2), tri: round((off * h) / 2, 2), A: round(((b1 + b2) * h) / 2, 2) };
  }
  /** Draw an isosceles trapezoid; o.decompose adds both dashed heights; o.noOff hides the triangle-base labels. */
  function isoSvg(t, o) {
    o = o || {};
    const { b1, b2, h, off, u } = t;
    const hx = o.decompose ? off : off + b2 / 2;
    const dashes = o.decompose
      ? [
          [off, 0, off, h, C.d],
          [b1 - off, 0, b1 - off, h, C.d],
        ]
      : [[hx, 0, hx, h, C.d]];
    const labels = [
      { x: b1 / 2, y: 0, text: `${fmt(b1)} ${u}`, dy: 20 },
      { x: b1 / 2, y: h, text: `${fmt(b2)} ${u}`, dy: -8 },
      { x: hx, y: h / 2, text: `${fmt(h)} ${u}`, anchor: 'start', dx: 8, color: C.d },
    ];
    if (o.decompose && !o.noOff) labels.push({ x: off / 2, y: 0, text: `${fmt(off)}`, dy: 20, size: 11 }, { x: b1 - off / 2, y: 0, text: `${fmt(off)}`, dy: 20, size: 11 });
    return V.figure({
      pts: [
        [0, 0],
        [b1, 0],
        [b1 - off, h],
        [off, h],
      ],
      dashes,
      rightAngles: o.decompose
        ? [
            [off, 0, 1, 1],
            [b1 - off, 0, -1, 1],
          ]
        : [[hx, 0, 1, 1]],
      labels,
      width: o.width,
      aria: `Trapezoid with bases ${fmt(b1)} ${u} and ${fmt(b2)} ${u} and height ${fmt(h)} ${u}${o.decompose ? ', cut by two dashed heights into a rectangle and two triangles' : ''}`,
    });
  }
  /** Right trapezoid with the dashed height; o.slant labels the slanted side too (a distractor). */
  function rightTrapSvg(b1, b2, h, u, slant) {
    const labels = [
      { x: b1 / 2, y: 0, text: `${fmt(b1)} ${u}`, dy: 20 },
      { x: b2 / 2, y: h, text: `${fmt(b2)} ${u}`, dy: -8 },
      { x: b2, y: h / 2, text: `${fmt(h)} ${u}`, anchor: 'end', dx: -8, color: C.d },
      { x: 0, y: h / 2, text: `${fmt(h)} ${u}`, anchor: 'end', dx: -8 },
    ];
    if (slant) labels.push({ x: (b1 + b2) / 2, y: h / 2, text: `${fmt(slant)} ${u}`, anchor: 'start', dx: 10 });
    return V.figure({
      pts: [
        [0, 0],
        [b1, 0],
        [b2, h],
        [0, h],
      ],
      dashes: [[b2, 0, b2, h, C.d]],
      rightAngles: [
        [b2, 0, -1, 1],
        [0, 0, 1, 1],
      ],
      labels,
      aria: `Right trapezoid with bases ${fmt(b1)} ${u} and ${fmt(b2)} ${u}, height ${fmt(h)} ${u}${slant ? `, and slanted side ${fmt(slant)} ${u}` : ''}`,
    });
  }
  function coachFormula(t, v) {
    const { b1, b2, h, A, u, s } = t;
    if (v == null) return `Area of a trapezoid = ½ × (b₁ + b₂) × h. Add the bases, multiply by the height, then take half.`;
    if (s && near(v, ((b1 + b2) * s) / 2)) return `You used the slanted side (${fmt(s)}) as h. The height is the dashed segment that meets the bases at a right angle.`;
    if (near(v, (b1 + b2) * h)) return `${fmt(round((b1 + b2) * h, 2))} is (b₁ + b₂) × h without the ½. Take half of it.`;
    if (near(v, b1 * h)) return `${fmt(round(b1 * h, 2))} is the long base × height, the area of a rectangle that is too big. Add both bases first, then take half.`;
    if (near(v, b2 * h)) return `${fmt(round(b2 * h, 2))} is the short base × height. That leaves out the triangles. Add both bases first, then take half.`;
    if (near(v, b1 + b2 + h)) return 'Adding the three numbers gives a length, not an area. Use ½ × (b₁ + b₂) × h.';
    if (near(v, (b1 * b2 * h) / 2)) return `You multiplied the bases. The formula adds them: ${fmt(b1)} + ${fmt(b2)}.`;
    if (near(v, b1 / 2 + b2 * h)) return 'You dropped the parentheses, so the ½ touched only one base. Add the two bases first.';
    if (near(v, A / 2)) return 'You took half twice. The ½ is used one time only.';
    return `Use ½ × (b₁ + b₂) × h: add ${fmt(b1)} and ${fmt(b2)}, multiply by ${fmt(h)}, then take half. The answer is in ${sq(u)}.`;
  }

  // ---------- Decompose into a rectangle and two triangles (blanks, template) ----------
  G.define('g3_decomposeRect', (r, o) => {
    const hard = !!(o && o.hard);
    const t = isoTrap(r, { hard });
    const name = r.pick(NAMES),
      obj = r.pick(OBJECTS);
    const offLine = hard
      ? `The two triangles are identical. Their bases are <b>not</b> labelled: work them out from the two bases.`
      : `The pieces are a rectangle in the middle and two identical triangles, each with a base of ${fmt(t.off)} ${t.u}.`;
    return {
      type: 'blanks',
      skill: 'trapezoid-decompose',
      lesson: '5-3',
      title: hard ? 'Cut the stone: find the hidden pieces' : 'Cut the trapezoid apart',
      xp: o.xp,
      prompt: `<p>${name} cuts a trapezoid-shaped ${obj} along the two dashed heights into a rectangle in the middle and a triangle on each end. The bases are ${hl(fmt(t.b1) + ' ' + t.u)} and ${hl(fmt(t.b2) + ' ' + t.u)}, and the height is ${hl(fmt(t.h) + ' ' + t.u)}. ${offLine}</p>${isoSvg(t, { decompose: true, noOff: hard })}<p>Find the area of each piece, then the whole figure.</p>`,
      fields: [
        { label: 'rectangle', answer: t.rect },
        { label: 'one triangle', answer: t.tri },
        { label: 'total', answer: t.A },
      ],
      template: `Rectangle: {0} ${sq(t.u)}. One triangle: {1} ${sq(t.u)}. Total area: {2} ${sq(t.u)}.`,
      reference: true,
      hints: [
        hard
          ? 'Decompose means cut the figure into shapes you know. Each triangle base is half of what is left when you take the short base away from the long base.'
          : 'Decompose means cut the figure into shapes you know. The rectangle is base × height. Each triangle is ½ × base × height.',
        hard
          ? `Triangle base: (${fmt(t.b1)} − ${fmt(t.b2)}) ÷ 2 = ${fmt(t.off)}. Rectangle: ${fmt(t.b2)} × ${fmt(t.h)}. Each triangle: ½ × ${fmt(t.off)} × ${fmt(t.h)}.`
          : `Rectangle: ${fmt(t.b2)} × ${fmt(t.h)}. Each triangle: ½ × ${fmt(t.off)} × ${fmt(t.h)}.`,
        `Total = rectangle + 2 triangles = ${fmt(t.rect)} + ${fmt(t.tri)} + ${fmt(t.tri)}.`,
      ],
      hintEs: hard
        ? 'Descomponer quiere decir cortar la figura en formas que conoces. La base de cada triángulo es la mitad de lo que queda cuando le quitas la base corta a la base larga.'
        : 'Descomponer quiere decir cortar la figura en formas que conoces. El rectángulo es base × altura. Cada triángulo es ½ × base × altura.',
      solution: `<p>${hard ? `Each triangle base: (${fmt(t.b1)} − ${fmt(t.b2)}) ÷ 2 = ${fmt(t.off)} ${t.u}. ` : ''}Rectangle: ${fmt(t.b2)} × ${fmt(t.h)} = <b>${fmt(t.rect)}</b> ${sq(t.u)}. One triangle: ½ × ${fmt(t.off)} × ${fmt(t.h)} = <b>${fmt(t.tri)}</b> ${sq(t.u)}. Total: ${fmt(t.rect)} + 2 × ${fmt(t.tri)} = <b>${fmt(t.A)}</b> ${sq(t.u)}. The rectangle uses the <i>short</i> base because that is the width of the middle piece; the two triangles make up the rest of the long base.</p>`,
      feedback: {
        correct: `Correct. Rectangle ${fmt(t.rect)} plus two triangles of ${fmt(t.tri)} each is ${fmt(t.A)} ${sq(t.u)}.`,
        wrong(ans, d) {
          const rv = parseNum(ans[0]),
            tv = parseNum(ans[1]),
            tot = parseNum(ans[2]);
          if (near(rv, t.b1 * t.h)) return `The rectangle is only as wide as the short base, ${fmt(t.b2)} ${t.u}, not the long base.`;
          if (near(tv, t.off * t.h)) return `Each triangle is half of ${fmt(t.off)} × ${fmt(t.h)}. Do not forget the ½.`;
          if (near(tv, ((t.b1 - t.b2) * t.h) / 2)) return `You used ${fmt(round(t.b1 - t.b2, 2))} as one triangle's base. That length is shared by <b>both</b> triangles, so each base is half of it.`;
          if (near(tot, t.rect + t.tri)) return 'You added only one triangle. There are two identical triangles, one on each end.';
          if (d.wrong.length === 1 && d.wrong[0] === 2) return 'The rectangle and the triangle are right. Total = rectangle + triangle + triangle.';
          return 'Rectangle = short base × height. Triangle = ½ × triangle base × height. Then add the rectangle and both triangles.';
        },
      },
    };
  });

  // ---------- Which expression decomposes the trapezoid correctly? (mc) ----------
  G.define('g3_whichDecomp', (r, o) => {
    const hard = !!(o && o.hard);
    const t = isoTrap(r, { hard });
    const { b1, b2, h, off } = t;
    const dd = round(b1 - b2, 2);
    const opts = [
      { html: `${fmt(b2)} × ${fmt(h)} + 2 × (½ × ${fmt(off)} × ${fmt(h)})`, ok: true },
      {
        html: `${fmt(b1)} × ${fmt(h)} + 2 × (½ × ${fmt(off)} × ${fmt(h)})`,
        why: `The rectangle in the middle is only ${fmt(b2)} ${t.u} wide (the short base). Using ${fmt(b1)} counts the two corner triangles twice.`,
      },
      hard
        ? {
            html: `${fmt(b2)} × ${fmt(h)} + 2 × (½ × ${fmt(dd)} × ${fmt(h)})`,
            why: `${fmt(b1)} − ${fmt(b2)} = ${fmt(dd)} is the extra length shared by both triangles. Each triangle gets half of it, ${fmt(off)} ${t.u}.`,
          }
        : { html: `${fmt(b2)} × ${fmt(h)} + ½ × ${fmt(off)} × ${fmt(h)}`, why: 'This adds only one triangle. The trapezoid has a triangle on each end, so add two.' },
      { html: `${fmt(b2)} × ${fmt(h)} + 2 × (${fmt(off)} × ${fmt(h)})`, why: `${fmt(off)} × ${fmt(h)} is a rectangle, not a triangle. Each triangle is half of that: ½ × ${fmt(off)} × ${fmt(h)}.` },
    ];
    const sh = shuffleOptions(r, opts, 0);
    const given = hard ? 'The triangle bases are not labelled.' : `Each triangle has a base of ${fmt(off)} ${t.u}.`;
    return {
      type: 'mc',
      skill: 'trapezoid-decompose',
      lesson: '5-3',
      title: 'Choose the decomposition',
      prompt: `<p>The dashed heights cut this trapezoid into a rectangle and two identical triangles. The bases are ${fmt(b1)} ${t.u} and ${fmt(b2)} ${t.u}, and the height is ${fmt(h)} ${t.u}. ${given}</p>${isoSvg(t, { decompose: true, noOff: hard })}<p>Which expression gives the area of the trapezoid in ${sq(t.u)}?</p>`,
      options: sh.options,
      answer: sh.answer,
      hints: [
        'Write one term for the rectangle (base × height) and one for the two triangles (2 × ½ × base × height).',
        hard
          ? `The rectangle is ${fmt(b2)} wide and ${fmt(h)} tall. The two triangle bases share ${fmt(b1)} − ${fmt(b2)} = ${fmt(dd)}, so each is ${fmt(off)}.`
          : `The rectangle is ${fmt(b2)} wide and ${fmt(h)} tall. Each triangle has base ${fmt(off)} and height ${fmt(h)}.`,
        `Look for: rectangle ${fmt(b2)} × ${fmt(h)}, plus two triangles that each use base ${fmt(off)} and a ½.`,
      ],
      hintEs: 'Escribe un término para el rectángulo (base × altura) y otro para los dos triángulos (2 × ½ × base × altura).',
      solution: `<p>Rectangle: ${fmt(b2)} × ${fmt(h)} = ${fmt(t.rect)}. Two triangles: 2 × (½ × ${fmt(off)} × ${fmt(h)}) = ${fmt(round(2 * t.tri, 2))}. So the area is <b>${fmt(b2)} × ${fmt(h)} + 2 × (½ × ${fmt(off)} × ${fmt(h)})</b> = ${fmt(t.A)} ${sq(t.u)}. The short base is the rectangle's width; the long base is the short base plus the two triangle bases.</p>`,
      feedback: {
        correct: 'Correct. Rectangle on the short base, plus two half-base-times-height triangles.',
        wrong: (ans) => (sh.options[ans] && sh.options[ans].why) || 'Check each term: the rectangle uses the short base, and each triangle needs its own base and a ½.',
      },
    };
  });

  // ---------- Right trapezoid: rectangle + one triangle (num) ----------
  const TRIPLES = [
    [3, 4, 5],
    [4, 3, 5],
    [6, 8, 10],
    [8, 6, 10],
  ];
  G.define('g3_rightTrap', (r, o) => {
    const hard = !!(o && o.hard);
    const u = r.pick(U5.UNITS),
      name = r.pick(NAMES),
      obj = r.pick(OBJECTS);
    let d, h, s, b2;
    if (hard) {
      // the slanted side is labelled too (a distractor), and the triangle's base is not given
      const k = r.pick([1, 1.5]);
      const tr = r.pick(TRIPLES);
      d = tr[0] * k;
      h = tr[1] * k;
      s = tr[2] * k;
      b2 = r.int(Math.ceil(d) + 2, Math.ceil(d) + 9) + (k === 1 ? 0.5 : 0);
    } else {
      d = r.int(2, 6);
      h = r.int(3, 8);
      if ((d * h) % 2) h += 1;
      b2 = r.int(d + 1, d + 8);
    }
    const b1 = round(b2 + d, 2);
    const rect = round(b2 * h, 2),
      tri = round((d * h) / 2, 2),
      A = round(rect + tri, 2);
    const fig = hard ? rightTrapSvg(b1, b2, h, u, s) : U5.rightTrapezoid(b1, b2, h, { u: ' ' + u });
    const words = hard
      ? `Its bases are ${hl(fmt(b1) + ' ' + u)} and ${hl(fmt(b2) + ' ' + u)}, its height is ${hl(fmt(h) + ' ' + u)}, and its slanted side is ${fmt(s)} ${u}. The dashed height splits it into a rectangle and one triangle.`
      : `Its bases are ${hl(fmt(b1) + ' ' + u)} and ${hl(fmt(b2) + ' ' + u)}, and its height is ${hl(fmt(h) + ' ' + u)}. The dashed height splits it into a rectangle and one triangle. The triangle's base is ${fmt(b1)} − ${fmt(b2)} = ${fmt(d)} ${u}.`;
    return {
      type: 'num',
      skill: 'trapezoid-decompose',
      lesson: '5-3',
      title: hard ? 'Right trapezoid with a slanted side' : 'Right trapezoid',
      xp: o.xp,
      prompt: `<p>${name}'s ${obj} is a right trapezoid. ${words}</p>${fig}<p>What is the area of the ${obj}?</p>`,
      unit: sq(u),
      answer: A,
      reference: true,
      hints: [
        hard
          ? 'Find the rectangle (short base × height) and the triangle (½ × its base × height), then add. The slanted side is not a height, so it is not used.'
          : 'Find the rectangle (short base × height) and the triangle (½ × its base × height), then add.',
        hard
          ? `Triangle base: ${fmt(b1)} − ${fmt(b2)} = ${fmt(d)}. Rectangle: ${fmt(b2)} × ${fmt(h)} = ${fmt(rect)}. Triangle: ½ × ${fmt(d)} × ${fmt(h)}.`
          : `Rectangle: ${fmt(b2)} × ${fmt(h)} = ${fmt(rect)}. Triangle: ½ × ${fmt(d)} × ${fmt(h)}.`,
        `Add the rectangle ${fmt(rect)} and the triangle ½ × ${fmt(d)} × ${fmt(h)}.`,
      ],
      hintEs: hard
        ? 'Halla el rectángulo (base corta × altura) y el triángulo (½ × su base × altura). Luego suma. El lado inclinado no es una altura, así que no se usa.'
        : 'Halla el rectángulo (base corta × altura) y el triángulo (½ × su base × altura). Luego suma.',
      solution: `<p>${hard ? `The triangle's base is ${fmt(b1)} − ${fmt(b2)} = ${fmt(d)}. ` : ''}Rectangle: ${fmt(b2)} × ${fmt(h)} = ${fmt(rect)}. Triangle: ½ × ${fmt(d)} × ${fmt(h)} = ${fmt(tri)}. Area = ${fmt(rect)} + ${fmt(tri)} = <b>${fmt(A)} ${sq(u)}</b>. Check with the formula: ½ × (${fmt(b1)} + ${fmt(b2)}) × ${fmt(h)} = ${fmt(A)}. ${hard ? `The slanted side ${fmt(s)} ${u} is the triangle's longest side, not a height.` : 'Both ways agree because the formula is just a shortcut for decomposing.'}</p>`,
      feedback: {
        correct: `Correct. ${fmt(rect)} + ${fmt(tri)} = ${fmt(A)} ${sq(u)}. Decomposing and the formula give the same area.`,
        wrong(ans, dd) {
          const v = dd.value;
          if (v == null) return 'Area of the rectangle plus area of the triangle.';
          if (near(v, b1 * h)) return `${fmt(round(b1 * h, 2))} treats the whole figure as a ${fmt(b1)} by ${fmt(h)} rectangle. The slanted side cuts a triangle off that rectangle.`;
          if (near(v, rect)) return `${fmt(rect)} is just the rectangle. Add the triangle on the end.`;
          if (near(v, rect + d * h)) return `You added a ${fmt(d)} by ${fmt(h)} rectangle instead of a triangle. The triangle is half of that.`;
          if (s && near(v, b2 * h + (d * s) / 2)) return `For the triangle you used the slanted side ${fmt(s)}. A triangle's height must be perpendicular to its base: use ${fmt(h)}.`;
          return coachFormula({ b1, b2, h, A, u, s }, v);
        },
      },
    };
  });

  // ---------- Match each piece to its area (match) ----------
  G.define('g3_matchParts', (r, o) => {
    const hard = !!(o && o.hard);
    const t = isoTrap(r, { hard });
    const pairs = [
      [`Rectangle (${fmt(t.b2)} × ${fmt(t.h)})`, `${fmt(t.rect)} ${sq(t.u)}`],
      [hard ? 'One end triangle' : `One triangle (base ${fmt(t.off)}, height ${fmt(t.h)})`, `${fmt(t.tri)} ${sq(t.u)}`],
      ['Both triangles together', `${fmt(round(2 * t.tri, 2))} ${sq(t.u)}`],
      ['The whole trapezoid', `${fmt(t.A)} ${sq(t.u)}`],
    ];
    const right = r.shuffle(pairs.map((p, i) => i));
    const given = hard ? 'The triangle bases are not labelled.' : `The triangles each have base ${fmt(t.off)} ${t.u}.`;
    return {
      type: 'match',
      skill: 'trapezoid-decompose',
      lesson: '5-3',
      title: 'Match the pieces to their areas',
      prompt: `<p>This trapezoid has bases ${hl(fmt(t.b1) + ' ' + t.u)} and ${hl(fmt(t.b2) + ' ' + t.u)} and height ${hl(fmt(t.h) + ' ' + t.u)}. The dashed heights cut it into a rectangle and two identical triangles. ${given}</p>${isoSvg(t, { decompose: true, noOff: hard })}<p>Match each piece to its area.</p>`,
      left: pairs.map((p) => p[0]),
      right: right.map((i) => pairs[i][1]),
      pairs: pairs.map((p, i) => [i, right.indexOf(i)]),
      reference: true,
      hints: [
        'Rectangle = base × height. Triangle = ½ × base × height. The whole trapezoid is the rectangle plus both triangles.',
        `${hard ? `Each triangle base: (${fmt(t.b1)} − ${fmt(t.b2)}) ÷ 2 = ${fmt(t.off)}. ` : ''}Rectangle: ${fmt(t.b2)} × ${fmt(t.h)}. One triangle: ½ × ${fmt(t.off)} × ${fmt(t.h)}. Both triangles: double that.`,
        `Whole trapezoid: the rectangle plus both triangles.`,
      ],
      hintEs: 'Rectángulo = base × altura. Triángulo = ½ × base × altura. El trapecio entero es el rectángulo más los dos triángulos.',
      solution: `<ul>${pairs.map((p) => `<li>${p[0]} → <b>${p[1]}</b></li>`).join('')}</ul><p>The two triangles together equal ${fmt(t.off)} × ${fmt(t.h)}, a rectangle, which is why the whole trapezoid also equals ½ × (${fmt(t.b1)} + ${fmt(t.b2)}) × ${fmt(t.h)}.</p>`,
      feedback: {
        correct: 'Correct. Each piece has its own area, and the pieces add up to the whole.',
        wrong(ans, d) {
          const w = d.wrong || [];
          if (w.includes(1) && w.includes(2)) return 'You swapped one triangle and both triangles. Both triangles together is twice one triangle.';
          if (w.includes(0) && w.includes(3)) return 'You swapped the rectangle and the whole trapezoid. The whole is the biggest: rectangle plus both triangles.';
          if (w.includes(1)) return `One triangle is ½ × ${fmt(t.off)} × ${fmt(t.h)}. Both together is twice that.`;
          if (w.includes(0)) return `The rectangle is ${fmt(t.b2)} wide (the short base) and ${fmt(t.h)} tall.`;
          return 'Start with the rectangle and one triangle. The other two values are built from those.';
        },
      },
    };
  });

  // ---------- The formula ½(b₁ + b₂)h (num, honors hard) ----------
  G.define('g3_formula', (r, o) => {
    const hard = !!(o && o.hard);
    const u = r.pick(U5.UNITS),
      name = r.pick(NAMES),
      obj = r.pick(OBJECTS);
    let b1, b2, h;
    if (hard) {
      // decimal bases and a half-unit height; the bases always add to a whole number
      b2 = r.int(5, 12) + 0.5;
      b1 = b2 + r.int(3, 8);
      h = r.int(4, 9) + 0.5;
    } else {
      b2 = r.int(3, 9);
      b1 = b2 + r.int(2, 7);
      h = r.int(3, 9);
      if (((b1 + b2) * h) % 2) h += 1;
    }
    const A = round(((b1 + b2) * h) / 2, 2);
    const t = { b1, b2, h, A, u };
    const svg = V.trapezoid(b1, b2, h, {
      b1: `${fmt(b1)} ${u}`,
      b2: `${fmt(b2)} ${u}`,
      height: `${fmt(h)} ${u}`,
      aria: `Trapezoid with bases ${fmt(b1)} ${u} and ${fmt(b2)} ${u} and height ${fmt(h)} ${u}`,
    });
    return {
      type: 'num',
      skill: 'trapezoid-formula',
      lesson: '5-3',
      title: hard ? 'Seal of Area: trapezoid' : 'Use the trapezoid formula',
      xp: o.xp,
      prompt: `<p>${name} measures a trapezoid-shaped ${obj}. The two parallel sides, the bases, are ${hl(fmt(b1) + ' ' + u)} and ${hl(fmt(b2) + ' ' + u)}. The height is ${hl(fmt(h) + ' ' + u)}.</p>${svg}<p>Use the formula A = ½ × (b₁ + b₂) × h to find the area.${hard ? ' Give your answer as a decimal if needed.' : ''}</p>`,
      unit: sq(u),
      answer: A,
      reference: true,
      hints: [
        'Add the two bases first. The parentheses tell you to do that before multiplying.',
        `(${fmt(b1)} + ${fmt(b2)}) = ${fmt(b1 + b2)}. Now multiply by the height ${fmt(h)}.`,
        `${fmt(b1 + b2)} × ${fmt(h)} = ${fmt(round((b1 + b2) * h, 2))}. Take half.`,
      ],
      hintEs: 'Primero suma las dos bases. Los paréntesis te dicen que hagas eso antes de multiplicar.',
      solution: `<p>A = ½ × (${fmt(b1)} + ${fmt(b2)}) × ${fmt(h)} = ½ × ${fmt(b1 + b2)} × ${fmt(h)} = ½ × ${fmt(round((b1 + b2) * h, 2))} = <b>${fmt(A)} ${sq(u)}</b>. The formula averages the two bases (half their sum is ${fmt((b1 + b2) / 2)}) and multiplies by the height, like a rectangle ${fmt((b1 + b2) / 2)} by ${fmt(h)}.</p>`,
      feedback: { correct: `Correct. ½ × ${fmt(b1 + b2)} × ${fmt(h)} = ${fmt(A)} ${sq(u)}.`, wrong: (ans, d) => coachFormula(t, d.value) },
    };
  });

  // ---------- Step through the formula (blanks, template) ----------
  G.define('g3_blanksFormula', (r, o) => {
    const hard = !!(o && o.hard);
    const u = r.pick(U5.UNITS);
    let b1, b2, h;
    if (hard) {
      // half-unit bases: the sum can be odd, so half the sum is a decimal
      b2 = r.int(6, 14) + 0.5;
      b1 = b2 + r.int(3, 9);
      h = r.int(4, 12);
    } else {
      b2 = r.int(3, 10);
      b1 = b2 + r.int(2, 8);
      if ((b1 + b2) % 2) b1 += 1;
      h = r.int(3, 9);
    }
    const sum = round(b1 + b2, 2),
      half = round(sum / 2, 2),
      A = round(half * h, 2);
    const svg = V.trapezoid(b1, b2, h, { b1: `${fmt(b1)} ${u}`, b2: `${fmt(b2)} ${u}`, height: `${h} ${u}`, aria: `Trapezoid with bases ${fmt(b1)} ${u} and ${fmt(b2)} ${u} and height ${h} ${u}` });
    return {
      type: 'blanks',
      skill: 'trapezoid-formula',
      lesson: '5-3',
      title: 'Work the formula step by step',
      prompt: `<p>The bases of this trapezoid are ${hl(fmt(b1) + ' ' + u)} and ${hl(fmt(b2) + ' ' + u)}. The height is ${hl(h + ' ' + u)}.</p>${svg}<p>Complete each step of A = ½ × (b₁ + b₂) × h.</p>`,
      fields: [
        { label: 'sum of bases', answer: sum },
        { label: 'half the sum', answer: half },
        { label: 'height', answer: h },
        { label: 'area', answer: A },
      ],
      template: `The bases add to {0} ${u}. Half of that is {1} ${u}. Multiply by the height, {2} ${u}: A = {3} ${sq(u)}.`,
      reference: true,
      hints: [
        'Do the parentheses first: add the two bases. Then take half. Then multiply by the height.',
        `${fmt(b1)} + ${fmt(b2)} = ${fmt(sum)}. Half of ${fmt(sum)} is ${fmt(half)}.`,
        `Multiply ${fmt(half)} × ${h}.`,
      ],
      hintEs: 'Haz primero los paréntesis: suma las dos bases. Luego toma la mitad. Luego multiplica por la altura.',
      solution: `<p>${fmt(b1)} + ${fmt(b2)} = <b>${fmt(sum)}</b>. Half is <b>${fmt(half)}</b>. Multiply by the height <b>${h}</b>: ${fmt(half)} × ${h} = <b>${fmt(A)}</b> ${sq(u)}. Half the sum of the bases is the "average base," so the trapezoid has the same area as a ${fmt(half)} by ${h} rectangle.</p>`,
      feedback: {
        correct: 'Correct. Add the bases, halve, multiply by the height.',
        wrong(ans, d) {
          const s = parseNum(ans[0]),
            hv = parseNum(ans[2]),
            a = parseNum(ans[3]);
          if (near(s, b1 * b2)) return `The formula adds the bases, it does not multiply them: ${fmt(b1)} + ${fmt(b2)}.`;
          if (hv != null && !near(hv, h)) return `The height is the dashed segment that makes a right angle with the bases: ${h} ${u}.`;
          if (near(a, sum * h)) return 'Your area is the sum of the bases times the height. You skipped the ½: use half the sum.';
          if (d.wrong.includes(1)) return `Half of ${fmt(sum)} is ${fmt(sum)} ÷ 2.`;
          if (d.wrong.length === 1 && d.wrong[0] === 3) return 'The first three steps are right. Multiply half the sum by the height.';
          return 'Add the bases, take half, then multiply by the height.';
        },
      },
    };
  });

  // ---------- Error: order of operations in the formula (error) ----------
  G.define('g3_errorOrder', (r, o) => {
    const hard = !!(o && o.hard);
    const u = r.pick(U5.UNITS),
      name = r.pick(NAMES);
    let b1, b2, h;
    if (hard) {
      b2 = r.int(4, 11) + 0.5;
      b1 = b2 + r.int(3, 8);
      h = 2 * r.int(2, 6);
    } else {
      b2 = r.int(3, 9);
      b1 = b2 + r.int(2, 7);
      h = r.int(3, 8);
      if (((b1 + b2) * h) % 2) h += 1;
    }
    const S = round(b1 + b2, 2);
    const A = round((S * h) / 2, 2);
    const variant = r.pick(hard ? ['noParens', 'heightInside', 'halfTwice'] : ['noParens', 'heightInside']);
    let work, opts, wrongA;
    if (variant === 'noParens') {
      wrongA = round(b1 / 2 + b2 * h, 2);
      work = `A = ½ × (b₁ + b₂) × h<br>A = ½ × ${fmt(b1)} + ${fmt(b2)} × ${h}<br>A = ${fmt(round(b1 / 2, 2))} + ${fmt(round(b2 * h, 2))}<br>A = ${fmt(wrongA)} ${sq(u)}`;
      opts = [
        { html: `${name} dropped the parentheses, so the ½ touched only ${fmt(b1)}. The bases must be added first: ${fmt(b1)} + ${fmt(b2)} = ${fmt(S)}.`, ok: true },
        { html: `${name} should have multiplied the two bases together: ½ × ${fmt(b1)} × ${fmt(b2)} × ${h}.`, why: 'The formula adds the bases inside the parentheses. Multiplying them is a different (wrong) calculation.' },
        { html: `${name} forgot to use the ½ from the trapezoid formula anywhere in the work.`, why: `The ½ is there in line 2 (½ × ${fmt(b1)}). The problem is that it was applied to only one base because the parentheses were dropped.` },
        { html: `${name}'s work is correct, and the trapezoid's area is ${fmt(wrongA)} ${sq(u)}.`, why: `Check: bases ${fmt(b1)} and ${fmt(b2)} with height ${h} give ½ × ${fmt(S)} × ${h}, not ${fmt(wrongA)}.` },
      ];
    } else if (variant === 'heightInside') {
      wrongA = round(((S + h) * h) / 2, 2);
      work = `A = ½ × (b₁ + b₂) × h<br>A = ½ × (${fmt(b1)} + ${fmt(b2)} + ${h}) × ${h}<br>A = ½ × ${fmt(round(S + h, 2))} × ${h}<br>A = ${fmt(wrongA)} ${sq(u)}`;
      opts = [
        { html: `${name} added the height inside the parentheses. Only the two bases go there: (${fmt(b1)} + ${fmt(b2)}).`, ok: true },
        { html: `${name} should not have used the ½, since a trapezoid is not a triangle.`, why: 'The ½ belongs in the trapezoid formula. The mistake is what was added inside the parentheses.' },
        { html: `${name} used the wrong measurement for the height of the trapezoid.`, why: `${h} is the height. It was used in the right place once, but it was also wrongly added to the bases.` },
        { html: `${name}'s work is correct, and the trapezoid's area is ${fmt(wrongA)} ${sq(u)}.`, why: `Check: ½ × (${fmt(b1)} + ${fmt(b2)}) × ${h} is smaller. Adding the height to the bases made the answer too big.` },
      ];
    } else {
      wrongA = round((S * h) / 4, 2);
      work = `A = ½ × (b₁ + b₂) × h<br>A = ½ × (${fmt(b1)} + ${fmt(b2)}) ÷ 2 × ${h}<br>A = ½ × ${fmt(round(S / 2, 2))} × ${h}<br>A = ${fmt(wrongA)} ${sq(u)}`;
      opts = [
        { html: `${name} halved twice: once by dividing the sum by 2 and again with the ½. Use the ½ only once.`, ok: true },
        { html: `${name} should have multiplied the two bases instead of adding them together.`, why: 'Adding the bases is right. The mistake is taking half two times.' },
        { html: `${name} should have doubled the height instead of halving the sum of the bases.`, why: 'Nothing in the formula doubles. The formula takes half one time; the work takes half twice.' },
        { html: `${name}'s work is correct, and the trapezoid's area is ${fmt(wrongA)} ${sq(u)}.`, why: `The work divides by 2 and also multiplies by ½, so the answer is only a quarter of ${fmt(S)} × ${h}. That is too small.` },
      ];
    }
    const sh = shuffleOptions(r, opts, 0);
    const svg = V.trapezoid(b1, b2, h, { b1: `${fmt(b1)} ${u}`, b2: `${fmt(b2)} ${u}`, height: `${h} ${u}`, width: 260, aria: `Trapezoid with bases ${fmt(b1)} ${u} and ${fmt(b2)} ${u} and height ${h} ${u}` });
    const what = { noParens: `${name} dropped them, so the ½ was applied to only one base and the other base was multiplied by the height on its own.`, heightInside: `${name} put the height inside them, so the height was counted twice.`, halfTwice: `${name} added the bases correctly but then took half twice, which gives only a quarter.` }[variant];
    return {
      type: 'error',
      skill: 'trapezoid-formula',
      lesson: '5-3',
      title: 'Find the mistake',
      prompt: `<p>${name} used the formula to find the area of this trapezoid (bases ${fmt(b1)} ${u} and ${fmt(b2)} ${u}, height ${h} ${u}).</p>${svg}<p>What is wrong with ${name}'s work?</p>`,
      work,
      options: sh.options,
      answer: sh.answer,
      fix: { label: `Correct area (${sq(u)}):`, answer: A },
      hints: [
        'Compare line 2 of the work with the formula. What is inside the parentheses, and how many times is half taken?',
        `The parentheses mean: add the two bases first. ${fmt(b1)} + ${fmt(b2)} = ${fmt(S)}. Nothing else goes inside, and the ½ is used once.`,
        `Correct: ½ × ${fmt(S)} × ${h}, which is half of ${fmt(round(S * h, 2))}.`,
      ],
      hintEs: 'Compara la línea 2 del trabajo con la fórmula. ¿Qué hay dentro de los paréntesis y cuántas veces se toma la mitad?',
      solution: `<p>In the formula, the parentheses group the two bases: (b₁ + b₂). ${what} Correct: A = ½ × (${fmt(b1)} + ${fmt(b2)}) × ${h} = ½ × ${fmt(S)} × ${h} = <b>${fmt(A)} ${sq(u)}</b>.</p>`,
      feedback: {
        correct: `Correct. Parentheses first: ${fmt(b1)} + ${fmt(b2)} = ${fmt(S)}. Then ½ × ${fmt(S)} × ${h} = ${fmt(A)}.`,
        wrong(ans, d) {
          if (!d.mistakeOk) return (sh.options[ans.mistake] && sh.options[ans.mistake].why) || 'Look at what is inside the parentheses in line 2.';
          const f = parseNum(ans.fix);
          if (near(f, wrongA)) return `You found the mistake, but your fix repeats ${name}'s answer. Redo it: ½ × (${fmt(b1)} + ${fmt(b2)}) × ${h}.`;
          if (near(f, S * h)) return 'Your fix forgot the ½. Take half of (sum of bases × height).';
          return `You found the mistake. For the fix: ½ × (${fmt(b1)} + ${fmt(b2)}) × ${h}.`;
        },
      },
    };
  });

  // ---------- True or false about bases and the formula (tf) ----------
  G.define('g3_tfBases', (r, o) => {
    const hard = !!(o && o.hard);
    const u = r.pick(U5.UNITS);
    const b2 = r.int(3, 8),
      b1 = b2 + 2 * r.int(1, 4),
      h = r.int(3, 8),
      avg = (b1 + b2) / 2,
      A = avg * h;
    const easy = [
      {
        stmt: 'The bases of a trapezoid are its two parallel sides.',
        answer: true,
        coach: 'Look at which sides the formula calls b₁ and b₂: the two sides that never meet.',
        reasons: [
          { html: 'The formula uses the two parallel sides as b₁ and b₂. The height is the distance between them.', correct: true },
          { html: 'The bases are the two longest sides.' },
          { html: 'The base is only the bottom side; the top is called the height.' },
        ],
      },
      {
        stmt: `Swapping the bases, using ½ × (${b2} + ${b1}) × ${h} instead of ½ × (${b1} + ${b2}) × ${h}, changes the area.`,
        answer: false,
        coach: `Work out ${b2} + ${b1} and ${b1} + ${b2}. Are they different?`,
        reasons: [
          { html: `${b1} + ${b2} and ${b2} + ${b1} are both ${b1 + b2}. The order you add in does not matter, so the area is the same either way.`, correct: true },
          { html: 'The longer base must come first or the ½ is applied to the wrong number.' },
          { html: 'Swapping the bases flips the trapezoid, so the area becomes negative.' },
        ],
      },
      {
        stmt: `A trapezoid with bases ${b1} ${u} and ${b2} ${u} and height ${h} ${u} has the same area as a rectangle that is ${avg} ${u} by ${h} ${u}.`,
        answer: true,
        coach: `Find both areas: ½ × (${b1} + ${b2}) × ${h} and ${avg} × ${h}. Compare.`,
        reasons: [
          { html: `Half the sum of the bases is (${b1} + ${b2}) ÷ 2 = ${avg}. The formula is that "average base" times the height, exactly like a ${avg} by ${h} rectangle.`, correct: true },
          { html: `The rectangle must use the longer base, ${b1}, so it has more area than the trapezoid.` },
          { html: 'A trapezoid and a rectangle can never have the same area because their shapes are different.' },
        ],
      },
      {
        stmt: `If the slanted side of a trapezoid is ${h + 1} ${u} and its height is ${h} ${u}, you should use ${h + 1} for h in the formula.`,
        answer: false,
        coach: 'h in the formula must make a right angle with the bases. Does a slanted side do that?',
        reasons: [
          { html: `h is the perpendicular height, the distance straight across between the bases: ${h} ${u}. A slanted side is longer than the height and is not used.`, correct: true },
          { html: `You should use the bigger number so the area is not too small.` },
          { html: `You should add them and use ${2 * h + 1} for h.` },
        ],
      },
      {
        stmt: `Doubling the height of a trapezoid (bases ${b1} and ${b2}) doubles its area.`,
        answer: true,
        coach: `Try it: find ½ × ${b1 + b2} × ${h}, then ½ × ${b1 + b2} × ${2 * h}.`,
        reasons: [
          { html: `Area = ½ × ${b1 + b2} × h. The height is a factor, so doubling h doubles the product: ${A} becomes ${2 * A}.`, correct: true },
          { html: 'Doubling the height makes the area four times as big.' },
          { html: 'The height does not affect the area; only the bases do.' },
        ],
      },
    ];
    // Hard: statements need a short calculation or a comparison of two trapezoids, and they use half-unit bases.
    const c1 = b1 + 0.5,
      c2 = b2 - 0.5,
      dB = r.int(1, 3);
    const hardPool = [
      {
        stmt: `A trapezoid with bases ${fmt(c1)} ${u} and ${fmt(c2)} ${u} has the same area as a trapezoid with bases ${b1} ${u} and ${b2} ${u}, if both are ${h} ${u} tall.`,
        answer: true,
        coach: `Add each pair of bases: ${fmt(c1)} + ${fmt(c2)} and ${b1} + ${b2}. The formula only uses the sum.`,
        reasons: [
          { html: `Both pairs of bases add to ${b1 + b2}. The formula uses only the sum of the bases and the height, so the areas are equal.`, correct: true },
          { html: `The trapezoid with the ${fmt(c1)} ${u} base is longer, so it has more area.` },
          { html: 'Two trapezoids can only have the same area if they have exactly the same bases.' },
        ],
      },
      {
        stmt: `A trapezoid with bases ${b1} ${u} and ${b2} ${u} and height ${h} ${u} has the same area as a parallelogram with base ${b1 + b2} ${u} and height ${h} ${u}.`,
        answer: false,
        coach: `Compare ½ × ${b1 + b2} × ${h} with ${b1 + b2} × ${h}. One has a ½.`,
        reasons: [
          { html: `Two copies of the trapezoid make that ${b1 + b2} by ${h} parallelogram. One trapezoid is only half of it: ${A} ${sq(u)}, not ${2 * A} ${sq(u)}.`, correct: true },
          { html: 'They are equal because both figures use the same numbers.' },
          { html: 'The parallelogram is smaller because it has a slanted side.' },
        ],
      },
      {
        stmt: `If both bases of a trapezoid ${h} ${u} tall grow by ${dB} ${u}, its area grows by ${dB * h} ${sq(u)}.`,
        answer: true,
        coach: `The sum of the bases grows by ${dB} + ${dB}. Find ½ × that × ${h}.`,
        reasons: [
          { html: `The sum of the bases grows by ${2 * dB}. ½ × ${2 * dB} × ${h} = ${dB * h}, so the area grows by ${dB * h} ${sq(u)}.`, correct: true },
          { html: `The area grows by ${2 * dB * h} ${sq(u)}, because each base adds ${dB} × ${h}.` },
          { html: `The area grows by only ${dB} ${sq(u)}, because each base grew by ${dB}.` },
        ],
      },
      {
        stmt: `Halving the height of a trapezoid and doubling both of its bases keeps the area the same.`,
        answer: true,
        coach: `Try it with bases ${b1} and ${b2}, height ${2 * h}: then bases ${2 * b1} and ${2 * b2}, height ${h}.`,
        reasons: [
          { html: 'Doubling both bases doubles their sum. Halving the height halves the product. Doubling then halving leaves the area unchanged.', correct: true },
          { html: 'The area doubles, because two numbers doubled and only one was halved.' },
          { html: 'The area is halved, because the height matters more than the bases.' },
        ],
      },
    ];
    const v = r.pick(hard ? hardPool : easy);
    const reasons = r.shuffle(v.reasons);
    return {
      type: 'tf',
      skill: 'trapezoid-formula',
      lesson: '5-3',
      title: hard ? 'True or false? Test the formula' : 'True or false?',
      prompt: `<p>Decide whether the statement is true or false, then choose the best reason.</p><p class="stmt"><b>${v.stmt}</b></p>`,
      answer: v.answer,
      reasons,
      reference: true,
      hints: [
        'Think about the formula ½ × (b₁ + b₂) × h. What are b₁, b₂, and h?',
        hard ? v.coach : 'The bases are the parallel sides. The height is perpendicular to them. Half the sum of the bases is the average base.',
        v.answer ? 'Test it with the numbers: the statement matches the formula, so it is true.' : 'Test it with the numbers: the statement goes against the formula, so it is false.',
      ],
      hintEs: 'Piensa en la fórmula ½ × (b₁ + b₂) × h. ¿Qué son b₁, b₂ y h?',
      solution: `<p><b>${v.answer ? 'True' : 'False'}.</b> ${reasons.find((x) => x.correct).html}</p>`,
      feedback: {
        correct: 'Correct. The bases are the parallel sides, the height is perpendicular, and the formula averages the bases.',
        wrong(ans, d) {
          if (!d.valueOk) return `Test the statement with numbers before deciding. ${v.coach}`;
          return 'Your true/false is right. Choose the reason that uses the formula correctly with these numbers.';
        },
      },
    };
  });
})(typeof window !== 'undefined' ? window : globalThis);

/* js/units/u5/gen-composite.js */
/* Zone 4 — The Mosaic Court. Lesson 5-4 Apply Area Concepts to Solve Problems (regular polygons · composite figures). */
(function (root) {
  'use strict';
  const RX = root.RX;
  const { G, V, shuffleOptions, NAMES, round, fmt, parseNum, U5 } = RX;
  const hl = V.hl;
  const C = V.COLORS;
  const sq = U5.sq;
  const near = (a, b) => a != null && Math.abs(a - b) < 0.01;

  // Regular polygons: side s and the height a of one center triangle (rounded like the textbook gives it).
  // Area = n × ½ × s × a. Every pair below gives an answer with at most two decimal places.
  // `hard` pairs are larger, less friendly measurements.
  const POLYS = [
    {
      n: 6,
      name: 'hexagon',
      pairs: [
        [4, 3.5],
        [6, 5.2],
        [8, 6.9],
        [10, 8.7],
        [12, 10.4],
        [5, 4.3],
        [7, 6.1],
      ],
      hard: [
        [9, 7.8],
        [11, 9.5],
        [14, 12.1],
        [15, 13],
      ],
    },
    {
      n: 8,
      name: 'octagon',
      pairs: [
        [4, 4.8],
        [5, 6],
        [6, 7.2],
        [10, 12.1],
        [8, 9.7],
      ],
      hard: [
        [7, 8.5],
        [9, 10.9],
        [12, 14.5],
      ],
    },
    {
      n: 5,
      name: 'pentagon',
      pairs: [
        [5, 3.4],
        [10, 6.9],
        [6, 4.1],
        [8, 5.5],
      ],
      hard: [
        [7, 4.8],
        [9, 6.2],
        [12, 8.3],
      ],
    },
  ];
  const ES_NAME = { hexagon: 'hexágono', octagon: 'octágono', pentagon: 'pentágono' };
  const POLY_OBJECTS = ['floor tile', 'paving stone', 'window', 'tabletop', 'gazebo floor', 'garden bed', 'mirror', 'patio'];
  const LOBJECTS = ['floor plan', 'deck', 'garden', 'patio', 'countertop', 'playground', 'stage', 'rug'];

  /** o.hard: bigger, less friendly measurements plus the center-to-corner distance R (a distractor). */
  function polygon(r, o) {
    o = o || {};
    const P = o.n ? POLYS.find((p) => p.n === o.n) : r.pick(POLYS);
    const [s, a] = r.pick(o.hard ? P.hard : P.pairs);
    const u = r.pick(U5.UNITS);
    const tri = round(0.5 * s * a, 2),
      A = round(P.n * tri, 2);
    const R = round(s / (2 * Math.sin(Math.PI / P.n)), 1);
    const svg = U5.regularPolygon(P.n, {
      side: o.noSide ? '' : `${fmt(s)} ${u}`,
      height: `${fmt(a)} ${u}`,
      aria: `Regular ${P.name}${o.noSide ? '' : ` with side ${fmt(s)} ${u}`}, divided into ${P.n} identical triangles; each triangle has height ${fmt(a)} ${u}`,
    });
    return { n: P.n, name: P.name, es: ES_NAME[P.name], s, a, u, tri, A, R, svg };
  }
  function coachPolygon(p, v) {
    const { n, s, a, tri, R } = p;
    if (v == null) return `Find the area of one triangle (½ × base × height), then multiply by the number of triangles.`;
    if (near(v, tri)) return `${fmt(tri)} is the area of just one triangle. The ${p.name} is made of ${n} of them.`;
    if (near(v, n * s * a)) return `You forgot the ½. Each triangle is ½ × ${fmt(s)} × ${fmt(a)}, not ${fmt(round(s * a, 2))}.`;
    if (R && near(v, (n * s * R) / 2)) return `You used ${fmt(R)}, the distance from the center to a corner. That segment slants; the triangle's height is the dashed segment that meets the side at a right angle.`;
    if (near(v, n * s)) return `${fmt(n * s)} is the perimeter, the distance around. Area needs ½ × base × height for each triangle.`;
    if (near(v, s * a)) return `${fmt(round(s * a, 2))} is side × height with no ½ and only one triangle. Find one triangle, then multiply by ${n}.`;
    if (near(v, (n * s * s) / 2)) return `You used the side ${fmt(s)} as the triangle's height. The height is the dashed segment from the center: ${fmt(a)}.`;
    return `One triangle: ½ × ${fmt(s)} × ${fmt(a)}. Then multiply by ${n}, one triangle for each side. Check your multiplication.`;
  }
  function lcoach(W, H, w1, h1, v) {
    if (v == null) return 'Split the figure into two rectangles, or subtract the missing corner from the big rectangle.';
    if (near(v, W * H)) return `${W * H} is the full ${W} by ${H} rectangle. A corner is missing, so subtract it.`;
    if (near(v, W * h1 + w1 * H)) return `You counted the ${w1} by ${h1} overlap twice. Use one straight cut so the two rectangles do not share any space.`;
    if (near(v, W * h1) || near(v, w1 * H)) return 'That is only one of the two rectangles. Add the other piece.';
    if (near(v, (W - w1) * (H - h1))) return `${(W - w1) * (H - h1)} is the missing corner, not the figure. Subtract it from ${W * H}.`;
    if (near(v, W * H - w1 * h1)) return `You subtracted a ${w1} by ${h1} corner. The missing corner is ${W - w1} by ${H - h1}: find those inside edges first.`;
    if (near(v, 2 * (W + H))) return 'That is the perimeter, the distance around. Area counts square units inside.';
    return 'Add two rectangles from one straight cut, or subtract the missing corner from the big rectangle. Check each multiplication.';
  }

  // ---------- Area of a regular polygon (num) ----------
  G.define('g4_hexagon', (r, o) => {
    const hard = !!(o && o.hard);
    const p = polygon(r, { n: r.chance(0.6) ? 6 : undefined, hard });
    const name = r.pick(NAMES),
      obj = r.pick(POLY_OBJECTS);
    const given = hard
      ? `Each side is ${hl(fmt(p.s) + ' ' + p.u)}. From the center, each corner is ${fmt(p.R)} ${p.u} away, and the dashed height from the center to a side is ${hl(fmt(p.a) + ' ' + p.u)}.`
      : `Each side is ${hl(fmt(p.s) + ' ' + p.u)}. The ${p.name} is divided into ${p.n} identical triangles from its center. Each triangle has a height of ${hl(fmt(p.a) + ' ' + p.u)}.`;
    return {
      type: 'num',
      skill: 'regular-polygons',
      lesson: '5-4',
      title: hard ? `Regular ${p.name}: choose the right height` : `Area of a regular ${p.name}`,
      xp: o.xp,
      prompt: `<p>${name} designs a ${obj} shaped like a regular ${p.name}. ${given}</p>${p.svg}<p>What is the area of the ${obj}?</p>`,
      unit: sq(p.u),
      answer: p.A,
      reference: true,
      hints: [
        hard
          ? `Split the regular ${p.name} into identical triangles from the center, one per side. Each triangle's height must meet the side at a right angle, so the center-to-corner distance is not used.`
          : `A regular ${p.name} is ${p.n} identical triangles. Find the area of one triangle, then multiply by ${p.n}.`,
        `One triangle: base ${fmt(p.s)}, height ${fmt(p.a)}. Area = ½ × ${fmt(p.s)} × ${fmt(p.a)}.`,
        `One triangle is ${fmt(p.tri)} ${sq(p.u)}. Multiply by ${p.n}.`,
      ],
      hintEs: hard
        ? `Divide el ${p.es} regular en triángulos iguales desde el centro, uno por cada lado. La altura de cada triángulo forma un ángulo recto con el lado, así que la distancia del centro a una esquina no se usa.`
        : `Un ${p.es} regular está formado por ${p.n} triángulos iguales. Halla el área de un triángulo y luego multiplícala por ${p.n}.`,
      solution: `<p>One triangle: ½ × ${fmt(p.s)} × ${fmt(p.a)} = ${fmt(p.tri)} ${sq(p.u)}. The ${p.name} has ${p.n} identical triangles: ${p.n} × ${fmt(p.tri)} = <b>${fmt(p.A)} ${sq(p.u)}</b>. ${hard ? `The ${fmt(p.R)} ${p.u} center-to-corner distance is a slanted side of each triangle, not its height. ` : ''}Decomposing into triangles works for any regular polygon because all its sides and angles are equal, so all the triangles match.</p>`,
      feedback: { correct: `Correct. ${p.n} triangles × ${fmt(p.tri)} ${sq(p.u)} = ${fmt(p.A)} ${sq(p.u)}.`, wrong: (ans, d) => coachPolygon(hard ? p : Object.assign({}, p, { R: 0 }), d.value) },
    };
  });

  // ---------- One triangle, then multiply (blanks, template) ----------
  G.define('g4_polygonBlanks', (r, o) => {
    const hard = !!(o && o.hard);
    const p = polygon(r, { hard, noSide: hard });
    const P = p.n * p.s;
    const given = hard
      ? `The perimeter of this regular ${p.name} is ${hl(fmt(P) + ' ' + p.u)}. It is split into identical triangles from the center, and each triangle has a height of ${hl(fmt(p.a) + ' ' + p.u)}. The side length is not labeled.`
      : `This regular ${p.name} has sides of ${hl(fmt(p.s) + ' ' + p.u)}. It is split into identical triangles from the center, and each triangle has a height of ${hl(fmt(p.a) + ' ' + p.u)}.`;
    return {
      type: 'blanks',
      skill: 'regular-polygons',
      lesson: '5-4',
      title: hard ? 'From perimeter to area' : 'Triangles make a polygon',
      prompt: `<p>${given}</p>${p.svg}<p>Complete the steps.</p>`,
      fields: [
        { label: 'one triangle', answer: p.tri },
        { label: 'number of triangles', answer: p.n, width: 'xs' },
        { label: 'total area', answer: p.A },
      ],
      template: `One triangle has an area of {0} ${sq(p.u)}. There are {1} triangles, so the ${p.name} has an area of {2} ${sq(p.u)}.`,
      reference: true,
      hints: [
        hard
          ? 'Each triangle has one side of the polygon as its base. A regular polygon has equal sides, so one side is the perimeter divided by the number of sides.'
          : 'Each triangle has the polygon side as its base and the given height. A regular polygon has as many triangles as it has sides.',
        hard
          ? `A ${p.name} has ${p.n} sides, so one side is ${fmt(P)} ÷ ${p.n}. One triangle: ½ × side × ${fmt(p.a)}.`
          : `½ × ${fmt(p.s)} × ${fmt(p.a)} for one triangle. Count the sides of a ${p.name}.`,
        `Multiply the number of triangles by the area of one triangle.`,
      ],
      hintEs: hard
        ? 'Cada triángulo tiene un lado del polígono como base. Un polígono regular tiene lados iguales, así que un lado es el perímetro dividido entre el número de lados.'
        : 'Cada triángulo tiene como base un lado del polígono y la altura dada. Un polígono regular tiene tantos triángulos como lados.',
      solution: `<p>${hard ? `Side: ${fmt(P)} ÷ ${p.n} = ${fmt(p.s)} ${p.u}. ` : ''}One triangle: ½ × ${fmt(p.s)} × ${fmt(p.a)} = <b>${fmt(p.tri)}</b> ${sq(p.u)}. A ${p.name} has <b>${p.n}</b> sides, so ${p.n} triangles. Total: ${p.n} × ${fmt(p.tri)} = <b>${fmt(p.A)}</b> ${sq(p.u)}.</p>`,
      feedback: {
        correct: `Correct. ${p.n} sides means ${p.n} triangles, each ${fmt(p.tri)} ${sq(p.u)}.`,
        wrong(ans, d) {
          const t = parseNum(ans[0]);
          if (near(t, p.s * p.a)) return `A triangle is half of base × height: ½ × ${fmt(p.s)} × ${fmt(p.a)}.`;
          if (hard && near(t, 0.5 * P * p.a)) return `You used the whole perimeter (${fmt(P)}) as one triangle's base. Each triangle's base is only one side: ${fmt(P)} ÷ ${p.n}.`;
          if (d.wrong.includes(1)) return `Count the sides of a ${p.name}: one triangle for each side.`;
          if (d.wrong.length === 1 && d.wrong[0] === 2) return 'Multiply the number of triangles by your one-triangle area.';
          return 'Find one triangle (½ × side × height), then multiply by the number of sides.';
        },
      },
    };
  });

  // ---------- Who found the polygon's area correctly? (who) ----------
  G.define('g4_whoPolygon', (r, o) => {
    const hard = !!(o && o.hard);
    const p = polygon(r, { hard });
    const [n1, n2, n3, n4] = r.pickN(NAMES, 4);
    const noHalf = round(p.s * p.a, 2),
      sideH = round(0.5 * p.s * p.s, 2),
      rH = round(0.5 * p.s * p.R, 2);
    // Every card shows the same two-step layout, and the wrong cards are written out at least as fully as the right one.
    const opts = [
      { title: n1, html: `One triangle: ½ × ${fmt(p.s)} × ${fmt(p.a)} = ${fmt(p.tri)}<br>Area: ${p.n} × ${fmt(p.tri)} = <b>${fmt(p.A)} ${sq(p.u)}</b>`, ok: true },
      {
        title: n2,
        html: `One triangle: ${fmt(p.s)} × ${fmt(p.a)} = ${fmt(noHalf)}<br>All ${p.n} triangles: ${p.n} × ${fmt(noHalf)} = <b>${fmt(round(p.n * noHalf, 2))} ${sq(p.u)}</b>`,
        why: `${n2} forgot the ½ for each triangle. Base × height is a parallelogram, not a triangle.`,
      },
      {
        title: n3,
        html: `One triangle: ½ × ${fmt(p.s)} × ${fmt(p.a)} = ${fmt(p.tri)}<br>The ${p.name}'s area is that one triangle: <b>${fmt(p.tri)} ${sq(p.u)}</b>`,
        why: `${n3} found only one triangle. The ${p.name} has ${p.n} of them.`,
      },
    ];
    if (hard)
      opts.push({
        title: n4,
        html: `One triangle: ½ × ${fmt(p.s)} × ${fmt(p.R)} = ${fmt(rH)}<br>All ${p.n} triangles: ${p.n} × ${fmt(rH)} = <b>${fmt(round(p.n * rH, 2))} ${sq(p.u)}</b>`,
        why: `${n4} used ${fmt(p.R)}, the center-to-corner distance. That segment slants, so it is not the triangle's height.`,
      });
    else
      opts.push({
        title: n4,
        html: `One triangle: ½ × ${fmt(p.s)} × ${fmt(p.s)} = ${fmt(sideH)}<br>All ${p.n} triangles: ${p.n} × ${fmt(sideH)} = <b>${fmt(round(p.n * sideH, 2))} ${sq(p.u)}</b>`,
        why: `${n4} used the side ${fmt(p.s)} as the height. The height is the dashed segment from the center, ${fmt(p.a)}.`,
      });
    const sh = shuffleOptions(r, opts, 0);
    const extra = hard ? ` Each corner is ${fmt(p.R)} ${p.u} from the center.` : '';
    return {
      type: 'who',
      skill: 'regular-polygons',
      lesson: '5-4',
      title: 'Who is correct?',
      prompt: `<p>Four students find the area of a regular ${p.name} with sides of ${fmt(p.s)} ${p.u}. Each center triangle has a height of ${fmt(p.a)} ${p.u}.${extra}</p>${p.svg}<p>Who is correct?</p>`,
      options: sh.options,
      answer: sh.answer,
      layout: 'cards',
      hints: [
        'Check three things: is each triangle ½ × base × height, is the height the segment that meets the side at a right angle, and was the triangle area multiplied by the number of sides?',
        `One triangle = ½ × ${fmt(p.s)} × ${fmt(p.a)} = ${fmt(p.tri)}.`,
        `Look for the card that multiplies ${fmt(p.tri)} by ${p.n}.`,
      ],
      hintEs: 'Revisa tres cosas: ¿cada triángulo es ½ × base × altura?, ¿la altura forma un ángulo recto con el lado?, ¿se multiplicó el área del triángulo por el número de lados?',
      solution: `<p><b>${n1}</b> is correct: ${p.n} × (½ × ${fmt(p.s)} × ${fmt(p.a)}) = ${fmt(p.A)} ${sq(p.u)}. ${n2} left out the ½, ${n3} stopped after one triangle, and ${n4} ${hard ? 'used the slanted center-to-corner distance' : 'used the side'} as the height.</p>`,
      feedback: {
        correct: `Correct. ${n1} used the ½, the true height, and all ${p.n} triangles.`,
        wrong: (ans) => (sh.options[ans] && sh.options[ans].why) || 'Check each card for the ½, the right height, and the number of triangles.',
      },
    };
  });

  // ---------- Table of polygons: triangles × one triangle = total (table) ----------
  G.define('g4_tablePolygons', (r, o) => {
    const hard = !!(o && o.hard);
    const u = r.pick(U5.UNITS),
      name = r.pick(NAMES);
    const picks = r.shuffle(POLYS.slice());
    const triAreas = r.pickN(hard ? [7.5, 10.5, 12.5, 13.5, 16.5, 22.5, 24.5, 30.5] : [6, 8, 9, 10, 12, 14, 15, 18, 20], 3);
    const rows = [['Regular polygon', 'Number of triangles', `One triangle (${sq(u)})`, `Total area (${sq(u)})`]];
    const inputs = [];
    const data = picks.map((P, i) => ({ P, tri: triAreas[i], total: round(P.n * triAreas[i], 2) }));
    rows.push([cap(data[0].P.name), String(data[0].P.n), fmt(data[0].tri), '__IN:t0__']);
    inputs.push({ id: 't0', answer: data[0].total });
    rows.push([cap(data[1].P.name), String(data[1].P.n), '__IN:one1__', fmt(data[1].total)]);
    inputs.push({ id: 'one1', answer: data[1].tri });
    rows.push([cap(data[2].P.name), '__IN:n2__', fmt(data[2].tri), fmt(data[2].total)]);
    inputs.push({ id: 'n2', answer: data[2].P.n });
    return {
      type: 'table',
      skill: 'regular-polygons',
      lesson: '5-4',
      title: hard ? 'Complete the polygon table (decimals)' : 'Complete the polygon table',
      prompt: `<p>${name} splits three regular polygons into identical triangles from the center. Complete the table. One number is missing from each row.${hard ? ' Some areas are decimals.' : ''}</p>`,
      rows,
      header: true,
      inputs,
      hints: [
        'Total area = number of triangles × area of one triangle. A regular polygon has one triangle per side.',
        `Row 1: ${data[0].P.n} × ${fmt(data[0].tri)}. Row 2: ${fmt(data[1].total)} ÷ ${data[1].P.n}.`,
        `Row 3: ${fmt(data[2].total)} ÷ ${fmt(data[2].tri)} tells you how many triangles, which equals the number of sides.`,
      ],
      hintEs: 'Área total = número de triángulos × área de un triángulo. Un polígono regular tiene un triángulo por cada lado.',
      solution: `<p>${cap(data[0].P.name)}: ${data[0].P.n} × ${fmt(data[0].tri)} = <b>${fmt(data[0].total)}</b>. ${cap(data[1].P.name)}: ${fmt(data[1].total)} ÷ ${data[1].P.n} = <b>${fmt(data[1].tri)}</b>. ${cap(data[2].P.name)}: ${fmt(data[2].total)} ÷ ${fmt(data[2].tri)} = <b>${data[2].P.n}</b> triangles, one for each of its ${data[2].P.n} sides. Multiplying and dividing undo each other.</p>`,
      feedback: {
        correct: 'Correct. Triangles × one triangle = total, and dividing works backward.',
        wrong(ans, d) {
          const one = parseNum(ans.one1),
            t0 = parseNum(ans.t0);
          if (d.wrong.includes('one1') && near(one, data[1].total * data[1].P.n)) return `Row 2: you multiplied. The total is already known, so divide it by ${data[1].P.n} to share it among the triangles.`;
          if (d.wrong.includes('t0') && near(t0, data[0].P.n + data[0].tri)) return 'Row 1: you added. The total is the number of triangles <b>times</b> one triangle.';
          if (d.wrong.includes('t0')) return `Row 1: multiply ${data[0].P.n} triangles × ${fmt(data[0].tri)}.`;
          if (d.wrong.includes('one1')) return `Row 2: the total is shared by ${data[1].P.n} equal triangles. Divide the total by ${data[1].P.n}.`;
          return `Row 3: how many triangles of ${fmt(data[2].tri)} make the total? That is also the number of sides of a ${data[2].P.name}.`;
        },
      },
    };
  });
  function cap(s) {
    return s.charAt(0).toUpperCase() + s.slice(1);
  }

  // ---------- L-shaped figure (num, honors hard) ----------
  G.define('g4_lshape', (r, o) => {
    const hard = !!(o && o.hard);
    const u = r.pick(U5.UNITS),
      name = r.pick(NAMES),
      obj = r.pick(LOBJECTS);
    let W, H, w1, h1;
    if (hard) {
      W = r.int(14, 24);
      H = r.int(10, 18);
      w1 = r.int(4, W - 5);
      h1 = r.int(3, H - 4);
    } else {
      W = r.int(8, 14);
      H = r.int(6, 12);
      w1 = r.int(3, W - 3);
      h1 = r.int(2, H - 3);
    }
    const A = W * H - (W - w1) * (H - h1);
    const svg = U5.lshape(W, H, w1, h1, { u: ' ' + u, hard, dash: hard ? undefined : r.pick(['v', 'h']) });
    const given = hard
      ? `The outside is ${hl(W + ' ' + u)} wide and ${hl(H + ' ' + u)} tall. The bottom step is ${hl(h1 + ' ' + u)} tall, and the top part is ${hl(w1 + ' ' + u)} wide. The two inside edges are not labeled.`
      : `All six edges are labeled.`;
    return {
      type: 'num',
      skill: 'composite-figures',
      lesson: '5-4',
      title: hard ? 'Seal of Space: L-shape' : 'Area of an L-shape',
      xp: o.xp,
      prompt: `<p>${name}'s ${obj} is L-shaped. ${given}</p>${svg}<p>What is the area of the ${obj}?</p>`,
      unit: sq(u),
      answer: A,
      reference: true,
      hints: [
        'Split the L into two rectangles with one straight cut, or think of it as a big rectangle with a corner missing.',
        hard
          ? `The missing inside edges: ${W} − ${w1} = ${W - w1} ${u} across and ${H} − ${h1} = ${H - h1} ${u} up. Big rectangle: ${W} × ${H}. Missing corner: ${W - w1} × ${H - h1}.`
          : `Cut across: a ${W} × ${h1} rectangle on the bottom and a ${w1} × ${H - h1} rectangle on top.`,
        hard ? `Subtract: ${W * H} − ${(W - w1) * (H - h1)}.` : `Add: ${W * h1} + ${w1 * (H - h1)}.`,
      ],
      hintEs: 'Divide la L en dos rectángulos con un solo corte recto, o piensa en ella como un rectángulo grande al que le falta una esquina.',
      solution: `<p>Add two rectangles: ${W} × ${h1} = ${W * h1} and ${w1} × ${H - h1} = ${w1 * (H - h1)}, total <b>${A} ${sq(u)}</b>. Or subtract: the full ${W} × ${H} rectangle is ${W * H}, minus the missing ${W - w1} × ${H - h1} corner (${(W - w1) * (H - h1)}) gives ${A}. Both ways work because they count the same space exactly once.</p>`,
      feedback: {
        correct: `Correct. Two rectangles (${W * h1} + ${w1 * (H - h1)}) or ${W * H} − ${(W - w1) * (H - h1)}: either way, ${A} ${sq(u)}.`,
        wrong: (ans, d) => lcoach(W, H, w1, h1, d.value),
      },
    };
  });

  // ---------- House shape: rectangle + triangle (blanks, template) ----------
  G.define('g4_house', (r, o) => {
    const hard = !!(o && o.hard);
    const u = r.pick(U5.UNITS),
      name = r.pick(NAMES);
    // hard: an odd width (so the triangle base is not even) and the TOTAL height is given, so the triangle's height must be found first
    const w = hard ? 2 * r.int(4, 9) + 1 : 2 * r.int(3, 7),
      h = r.int(4, 9),
      t = hard ? 2 * r.int(1, 3) : r.int(2, 6);
    const T = h + t;
    const rect = w * h,
      tri = round((w * t) / 2, 2),
      A = round(rect + tri, 2);
    const ctx = r.pick(['the front of a birdhouse', 'a barn door', 'a sign shaped like a house', 'the end wall of a shed', 'a dollhouse front']);
    const svg = hard
      ? V.figure({
          pts: [
            [0, 0],
            [w, 0],
            [w, h],
            [w / 2, T],
            [0, h],
          ],
          dashes: [
            [0, h, w, h],
            [w / 2, 0, w / 2, T, C.d],
          ],
          rightAngles: [[w / 2, 0, 1, 1]],
          labels: [
            { x: w / 2, y: 0, text: `${fmt(w)} ${u}`, dy: 20 },
            { x: w, y: h / 2, text: `${fmt(h)} ${u}`, anchor: 'start', dx: 8 },
            { x: w / 2, y: T / 2, text: `${fmt(T)} ${u}`, anchor: 'start', dx: 8, color: C.d },
          ],
          aria: `House-shaped figure: a ${fmt(w)} by ${fmt(h)} rectangle with a triangle on top; the whole figure is ${fmt(T)} tall`,
        })
      : U5.house(w, h, t, { u: ' ' + u });
    const given = hard
      ? `It is a rectangle ${hl(fmt(w) + ' ' + u)} wide and ${hl(h + ' ' + u)} tall with a triangle on top. From the bottom to the peak, the whole shape is ${hl(T + ' ' + u)} tall.`
      : `It is a rectangle ${hl(w + ' ' + u)} wide and ${hl(h + ' ' + u)} tall with a triangle on top. The triangle's height is ${hl(t + ' ' + u)}, and its base is the top of the rectangle.`;
    return {
      type: 'blanks',
      skill: 'composite-figures',
      lesson: '5-4',
      title: hard ? 'Rectangle plus triangle: find the roof height' : 'Rectangle plus triangle',
      prompt: `<p>${name} paints ${ctx}. ${given}</p>${svg}<p>Find each part and the total.</p>`,
      fields: [
        { label: 'rectangle', answer: rect },
        { label: 'triangle', answer: tri },
        { label: 'total', answer: A },
      ],
      template: `Rectangle: {0} ${sq(u)}. Triangle: {1} ${sq(u)}. Total area: {2} ${sq(u)}.`,
      reference: true,
      hints: [
        hard
          ? 'The triangle sits on the rectangle, so its base is the rectangle’s width. Its height is only the part of the total height above the rectangle.'
          : 'The triangle sits on the rectangle, so its base is the same as the rectangle’s width.',
        hard ? `Triangle height: ${T} − ${h} = ${t}. Rectangle: ${fmt(w)} × ${h}. Triangle: ½ × ${fmt(w)} × ${t}.` : `Rectangle: ${w} × ${h}. Triangle: ½ × ${w} × ${t}.`,
        `Add the rectangle and the triangle: ${fmt(rect)} + ${fmt(tri)}.`,
      ],
      hintEs: hard
        ? 'El triángulo está encima del rectángulo, así que su base es el ancho del rectángulo. Su altura es solo la parte de la altura total que queda arriba del rectángulo.'
        : 'El triángulo está encima del rectángulo, así que su base es igual al ancho del rectángulo.',
      solution: `<p>${hard ? `Triangle height: ${T} − ${h} = ${t} ${u}. ` : ''}Rectangle: ${fmt(w)} × ${h} = <b>${fmt(rect)}</b> ${sq(u)}. Triangle: ½ × ${fmt(w)} × ${t} = <b>${fmt(tri)}</b> ${sq(u)}. Total: ${fmt(rect)} + ${fmt(tri)} = <b>${fmt(A)}</b> ${sq(u)}. The triangle's base is not labeled separately because it equals the width of the rectangle below it.</p>`,
      feedback: {
        correct: 'Correct. A composite figure is the sum of its parts.',
        wrong(ans, d) {
          const tv = parseNum(ans[1]);
          if (near(tv, w * t)) return `The triangle is half of ${fmt(w)} × ${t}. Do not forget the ½.`;
          if (near(tv, (w * T) / 2)) return `The triangle's height is only the part above the rectangle, ${T} − ${h}, not the full ${T}.`;
          if (hard && near(parseNum(ans[0]), w * T)) return `The rectangle stops at ${h} ${u}. ${T} ${u} is the height of the whole shape, including the roof.`;
          if (d.wrong.includes(0)) return 'Rectangle = width × height of the rectangle part only.';
          if (d.wrong.length === 1 && d.wrong[0] === 2) return 'Your parts are right. Add the rectangle and the triangle.';
          return 'Rectangle = width × height; triangle = ½ × width × roof height; then add.';
        },
      },
    };
  });

  // ---------- Rectangle with a rectangular cut-out: subtract (num) ----------
  G.define('g4_cutout', (r, o) => {
    const hard = !!(o && o.hard);
    const u = r.pick(U5.UNITS),
      name = r.pick(NAMES);
    const ctx = r.pick([
      ['a picture frame', 'the opening for the photo', 'frame'],
      ['a pool deck', 'the pool', 'deck'],
      ['a courtyard', 'a fountain', 'courtyard'],
      ['a lawn', 'a flower bed', 'lawn'],
      ['a wall', 'a window', 'wall'],
      ['a quilt', 'a square hole for a patch', 'quilt'],
    ]);
    let W, H, w, h, b;
    if (hard) {
      // the hole is described by an even border width (a half unit is possible), so its size must be worked out first
      b = r.pick([1, 1.5, 2, 2.5, 3]);
      W = r.int(10, 18);
      H = r.int(8, 14);
      w = W - 2 * b;
      h = H - 2 * b;
    } else {
      W = r.int(8, 16);
      H = r.int(6, 12);
      w = r.int(2, W - 4);
      h = r.int(2, H - 3);
    }
    const A = round(W * H - w * h, 2);
    const x0 = round((W - w) / 2, 2),
      y0 = round((H - h) / 2, 2);
    const labels = [
      { x: W / 2, y: 0, text: `${W} ${u}`, dy: 20 },
      { x: W, y: H / 2, text: `${H} ${u}`, anchor: 'start', dx: 8 },
    ];
    if (hard) labels.push({ x: x0 / 2, y: H / 2, text: `${fmt(b)}`, size: 11, dy: -4 });
    else labels.push({ x: W / 2, y: y0 + h, text: `${w} ${u}`, dy: -6, size: 11 }, { x: x0 + w, y: H / 2, text: `${h} ${u}`, anchor: 'start', dx: 6, size: 11 });
    const svg = V.figure({
      pts: [
        [0, 0],
        [W, 0],
        [W, H],
        [0, H],
      ],
      polys: [
        [
          [0, 0],
          [W, 0],
          [W, H],
          [0, H],
        ],
        [
          [x0, y0],
          [x0 + w, y0],
          [x0 + w, y0 + h],
          [x0, y0 + h],
        ],
      ],
      fills: [C.a, '#ffffff'],
      dashes: hard ? [[0, H / 2, x0, H / 2, C.d]] : [],
      labels,
      aria: hard ? `A ${W} by ${H} rectangle with a rectangle removed from the middle, leaving a border ${fmt(b)} wide on every side` : `A ${W} by ${H} rectangle with a ${w} by ${h} rectangle removed from the middle`,
    });
    const given = hard
      ? `In the middle is ${ctx[1]}, which does not get covered. It leaves an even border ${hl(fmt(b) + ' ' + u)} wide on all four sides.`
      : `In the middle is ${ctx[1]}, a ${hl(w + ' ' + u)} by ${hl(h + ' ' + u)} rectangle that does not get covered.`;
    return {
      type: 'num',
      skill: 'composite-figures',
      lesson: '5-4',
      title: hard ? 'Subtract the cut-out: find its size first' : 'Subtract the cut-out',
      xp: o.xp,
      prompt: `<p>${name} is covering ${ctx[0]} that measures ${hl(W + ' ' + u)} by ${hl(H + ' ' + u)}. ${given}</p>${svg}<p>What is the area of the ${ctx[2]} that gets covered?</p>`,
      unit: sq(u),
      answer: A,
      reference: true,
      hints: [
        hard
          ? 'When a figure has a hole, find the whole area, then subtract the hole. The border is on both sides, so the hole is shorter by two border widths each way.'
          : 'When a figure has a hole, find the whole area, then subtract the hole.',
        hard
          ? `Hole: (${W} − 2 × ${fmt(b)}) by (${H} − 2 × ${fmt(b)}) = ${fmt(w)} by ${fmt(h)}. Whole: ${W} × ${H} = ${W * H}. Hole: ${fmt(w)} × ${fmt(h)} = ${fmt(w * h)}.`
          : `Whole: ${W} × ${H} = ${W * H}. Hole: ${w} × ${h} = ${w * h}.`,
        `Subtract: ${W * H} − ${fmt(w * h)}.`,
      ],
      hintEs: hard
        ? 'Cuando una figura tiene un hueco, halla el área total y luego réstale el hueco. El borde está en los dos lados, así que el hueco mide dos anchos de borde menos en cada dirección.'
        : 'Cuando una figura tiene un hueco, halla el área total y luego réstale el hueco.',
      solution: `<p>${hard ? `The hole is ${W} − ${fmt(2 * b)} = ${fmt(w)} by ${H} − ${fmt(2 * b)} = ${fmt(h)}. ` : ''}Whole rectangle: ${W} × ${H} = ${W * H}. Cut-out: ${fmt(w)} × ${fmt(h)} = ${fmt(w * h)}. Covered area: ${W * H} − ${fmt(w * h)} = <b>${fmt(A)} ${sq(u)}</b>. Subtracting works because the cut-out sits entirely inside the big rectangle.</p>`,
      feedback: {
        correct: `Correct. ${W * H} − ${fmt(w * h)} = ${fmt(A)} ${sq(u)}. Whole minus hole.`,
        wrong(ans, d) {
          const v = d.value;
          if (v == null) return 'Big rectangle minus the cut-out.';
          if (near(v, W * H)) return `${W * H} is the whole rectangle. The cut-out is not covered, so subtract it.`;
          if (near(v, W * H + w * h)) return 'You added the cut-out. It is removed from the figure, so subtract it.';
          if (near(v, w * h)) return `${fmt(w * h)} is the hole itself. The covered part is the big rectangle minus the hole.`;
          if (hard && near(v, W * H - (W - b) * (H - b))) return `The border is on <b>both</b> sides. The hole is ${W} − 2 × ${fmt(b)} wide, not ${W} − ${fmt(b)}.`;
          if (near(v, 2 * (W + H) - 2 * (w + h))) return 'That subtracts perimeters (distances around). Area uses length × width for each rectangle.';
          return 'Find the area of the whole rectangle, then subtract the area of the cut-out.';
        },
      },
    };
  });

  // ---------- Select all expressions for the L-shape's area (ms) ----------
  G.define('g4_msExpressions', (r, o) => {
    const hard = !!(o && o.hard);
    const u = r.pick(U5.UNITS);
    const W = r.int(8, 14),
      H = r.int(6, 12),
      w1 = r.int(3, W - 3),
      h1 = r.int(2, H - 3);
    const A = W * H - (W - w1) * (H - h1);
    const opts = [
      { html: `${W} × ${h1} + ${w1} × ${H - h1}`, ok: true },
      { html: `${w1} × ${H} + ${W - w1} × ${h1}`, ok: true },
      { html: `${W} × ${H} − ${W - w1} × ${H - h1}`, ok: true },
      // hard swaps the obvious "whole rectangle" distractor for a subtler wrong corner
      hard ? { html: `${W} × ${H} − ${w1} × ${h1}` } : { html: `${W} × ${H}` },
      { html: `${W} × ${h1} + ${w1} × ${H}` },
    ];
    const keep = r.chance(0.5) ? [0, 1, 2, 3, 4] : r.shuffle([0, 1, 2]).slice(0, 2).concat([3, 4]);
    const chosen = keep.sort((a, b) => a - b).map((i) => opts[i]);
    const correctIdx = chosen.map((x, i) => (x.ok ? i : -1)).filter((i) => i >= 0);
    const sh = shuffleOptions(r, chosen, correctIdx);
    const given = hard
      ? `The bottom step is ${h1} ${u} tall and the top part is ${w1} ${u} wide. The inside edges are not labeled.`
      : `The bottom step is ${h1} ${u} tall and the top part is ${w1} ${u} wide; the inside edges are ${W - w1} ${u} and ${H - h1} ${u}.`;
    return {
      type: 'ms',
      skill: 'composite-figures',
      lesson: '5-4',
      title: 'Which expressions give the area?',
      prompt: `<p>This L-shaped figure is ${hl(W + ' ' + u)} wide and ${hl(H + ' ' + u)} tall. ${given}</p>${U5.lshape(W, H, w1, h1, { u: ' ' + u, hard })}<p>Select <b>all</b> expressions that give the area of the figure in ${sq(u)}.</p>`,
      options: sh.options,
      answers: sh.answers,
      reference: true,
      hints: [
        'There is more than one correct way: cut across, cut down, or subtract the missing corner. Each correct expression must count every part exactly once.',
        `${hard ? `Inside edges: ${W} − ${w1} = ${W - w1} and ${H} − ${h1} = ${H - h1}. ` : ''}Cut across: ${W} × ${h1} (bottom) + ${w1} × ${H - h1} (top). Cut down: ${w1} × ${H} (left) + ${W - w1} × ${h1} (right). Subtract: ${W} × ${H} − ${W - w1} × ${H - h1}.`,
        'Compute each option. The correct ones all give the same number.',
      ],
      hintEs: 'Hay más de una manera correcta: cortar a lo ancho, cortar a lo alto o restar la esquina que falta. Cada expresión correcta cuenta cada parte una sola vez.',
      solution: `<p>Three expressions work: cut across, ${W} × ${h1} + ${w1} × ${H - h1}; cut down, ${w1} × ${H} + ${W - w1} × ${h1}; or subtract the corner, ${W} × ${H} − ${W - w1} × ${H - h1}. Each equals <b>${A} ${sq(u)}</b>. ${hard ? `${W} × ${H} − ${w1} × ${h1} subtracts a corner of the wrong size` : `${W} × ${H} ignores the missing corner`}, and ${W} × ${h1} + ${w1} × ${H} counts the ${w1} by ${h1} overlap twice.</p>`,
      feedback: {
        correct: `Correct. Every selected expression counts each part of the figure exactly once and equals ${A}.`,
        wrong(ans, d) {
          if (d.extra && d.extra.length) {
            const txt = sh.options[d.extra[0]].html;
            if (txt === `${W} × ${H}`) return `${W} × ${H} is the full rectangle with no corner missing. That is too big.`;
            if (txt === `${W} × ${H} − ${w1} × ${h1}`) return `That subtracts a ${w1} by ${h1} corner. The missing corner is ${W - w1} by ${H - h1}: find the inside edges first.`;
            return `${W} × ${h1} + ${w1} × ${H} overlaps: the ${w1} by ${h1} corner is inside both rectangles, so it is counted twice.`;
          }
          return 'You missed one. There can be up to three correct ways: cut across, cut down, or subtract the corner. Check each one.';
        },
      },
    };
  });
})(typeof window !== 'undefined' ? window : globalThis);

/* js/units/u5/gen-volume.js */
/* Zone 5 — The Cistern. Lesson 5-5 Determine the Volume of Rectangular Prisms (whole edges · missing and fractional edges). */
(function (root) {
  'use strict';
  const RX = root.RX;
  const { G, V, shuffleOptions, NAMES, round, fmt, parseNum, U5 } = RX;
  const hl = V.hl;
  const sq = U5.sq,
    cu = U5.cu,
    mixed = U5.mixed;

  const CONTAINERS = ['storage tank', 'toy chest', 'aquarium', 'shipping crate', 'planter box', 'sandbox', 'cooler', 'gift box', 'water trough', 'cereal box'];
  const UNIT_WORD = { in: 'inches', ft: 'feet', cm: 'centimeters', m: 'meters' };
  const near = (a, b) => a != null && Math.abs(a - b) < 0.01;

  function wholeDims(r, o) {
    o = o || {};
    const hi = o.hard ? 12 : 8;
    const l = r.int(3, hi),
      w = r.int(2, Math.min(hi, l)),
      h = r.int(2, hi);
    const u = r.pick(U5.UNITS);
    return { l, w, h, u, V: l * w * h };
  }
  /** Hard dimensions: two whole edges and one half-unit edge (the volume has at most one decimal place). */
  function halfDims(r) {
    const u = r.pick(U5.UNITS);
    const l = r.int(6, 14),
      w = r.int(3, 9),
      h = r.int(2, 8) + 0.5;
    return { l, w, h, u, V: round(l * w * h, 2) };
  }
  function prismSvg(d, labels, extra) {
    labels = labels || {};
    return V.prism(
      Object.assign(
        {
          l: d.l,
          w: d.w,
          h: d.h,
          labels: { l: labels.l || `${mixed(d.l)} ${d.u}`, w: labels.w || `${mixed(d.w)} ${d.u}`, h: labels.h || `${mixed(d.h)} ${d.u}` },
          aria: `Rectangular prism ${labels.l || mixed(d.l) + ' ' + d.u} long, ${labels.w || mixed(d.w) + ' ' + d.u} wide, and ${labels.h || mixed(d.h) + ' ' + d.u} tall`,
        },
        extra || {},
      ),
    );
  }
  /** Dimensions with halves/quarters, in quarter-units, chosen so the volume has at most two decimal places. */
  function fracDims(r, o) {
    o = o || {};
    const u = r.pick(U5.UNITS);
    for (let tries = 0; tries < 200; tries++) {
      const nFrac = o.hard ? 2 : 1;
      const dims = [];
      for (let i = 0; i < 3; i++) {
        if (i < nFrac)
          dims.push(4 * r.int(1, o.hard ? 6 : 5) + r.pick(o.hard ? [1, 2, 3] : [2, 2, 1, 3])); // quarters
        else dims.push(4 * r.int(2, o.hard ? 10 : 8));
      }
      const prod = dims[0] * dims[1] * dims[2];
      if (prod % 16 !== 0) continue;
      const vals = r.shuffle(dims).map((q) => q / 4);
      const Vv = round(prod / 64, 2);
      if (!Number.isInteger(Vv * 100)) continue;
      return { l: vals[0], w: vals[1], h: vals[2], u, V: Vv };
    }
    return { l: 4.5, w: 2, h: 3, u, V: 27 };
  }
  function coachVolume(d, v) {
    const { l, w, h, V: vol, u } = d;
    if (v == null) return `Volume = length × width × height. Multiply all three edges: ${mixed(l)} × ${mixed(w)} × ${mixed(h)}.`;
    if (near(v, l + w + h)) return 'You added the edges. Volume multiplies them: l × w × h.';
    if (near(v, 2 * (l * w + l * h + w * h))) return `${fmt(round(2 * (l * w + l * h + w * h), 2))} is the surface area, the area of all the faces. Volume is the space inside: l × w × h.`;
    if (near(v, l * w) || near(v, l * h) || near(v, w * h)) return 'That is the area of one face (two edges multiplied). Volume needs all three edges.';
    if (near(v, Math.floor(l) * Math.floor(w) * Math.floor(h)) && !near(v, vol)) return 'You dropped the fraction part of an edge. Multiply with the full mixed number, or write it as a decimal first.';
    if (near(v, vol / 2) || near(v, vol * 2)) return 'Your answer is off by a factor of 2. Check the half-unit edge: 8½ is 8.5, so multiply by 8.5, not by 8 or 17.';
    return `Multiply two edges first, then multiply that product by the third edge. Answer in ${cu(u)}.`;
  }

  // ---------- Volume = l × w × h (num, hard: a half-unit edge and larger edges) ----------
  G.define('g5_volume', (r, o) => {
    const hard = !!(o && o.hard);
    const d = hard ? halfDims(r) : wholeDims(r);
    const name = r.pick(NAMES),
      obj = r.pick(CONTAINERS);
    const B = d.l * d.w;
    return {
      type: 'num',
      skill: 'volume',
      lesson: '5-5',
      title: 'Volume of a rectangular prism',
      xp: o && o.xp,
      prompt: `<p>${name}'s ${obj} is a rectangular prism ${hl(mixed(d.l) + ' ' + d.u)} long, ${hl(mixed(d.w) + ' ' + d.u)} wide, and ${hl(mixed(d.h) + ' ' + d.u)} tall.</p>${prismSvg(d)}<p>How many cubic ${UNIT_WORD[d.u]} of space does it hold? Give the volume${hard ? ' as a decimal or a fraction' : ''}.</p>`,
      unit: cu(d.u),
      answer: d.V,
      reference: true,
      hints: [
        hard ? 'Volume counts the unit cubes that fill the prism. V = l × w × h. Write the mixed number as a decimal first.' : 'Volume counts the unit cubes that fill the prism. V = l × w × h.',
        hard
          ? `The base is ${d.l} × ${d.w} = ${B} ${sq(d.u)}. The height ${mixed(d.h)} is ${fmt(d.h)}, so there are ${fmt(d.h)} layers of ${B} cubes.`
          : `The bottom layer has ${d.l} × ${d.w} = ${B} cubes. There are ${d.h} layers.`,
        `${B} × ${fmt(d.h)}.`,
      ],
      hintEs: hard
        ? 'El volumen cuenta los cubos unitarios que llenan el prisma. V = l × a × h (largo × ancho × altura). Primero escribe el número mixto como decimal.'
        : 'El volumen cuenta los cubos unitarios que llenan el prisma. V = l × a × h (largo × ancho × altura).',
      solution: `<p>V = l × w × h = ${mixed(d.l)} × ${mixed(d.w)} × ${mixed(d.h)} = ${B} × ${fmt(d.h)} = <b>${fmt(d.V)} ${cu(d.u)}</b>. The base holds ${B} unit cubes, and ${fmt(d.h)} layers of them stack up to ${fmt(d.V)}. The unit is cubic because each cube measures ${d.u} × ${d.u} × ${d.u}.</p>`,
      feedback: { correct: `Correct. ${mixed(d.l)} × ${mixed(d.w)} × ${mixed(d.h)} = ${fmt(d.V)} ${cu(d.u)}.`, wrong: (ans, dd) => coachVolume(d, dd.value) },
    };
  });

  // ---------- V = B × h: base area first (blanks; hard: work backward from V and h to B and a missing edge) ----------
  G.define('g5_blanksBh', (r, o) => {
    const hard = !!(o && o.hard);
    const d = wholeDims(r, { hard });
    const B = d.l * d.w;
    if (hard) {
      return {
        type: 'blanks',
        skill: 'volume',
        lesson: '5-5',
        title: 'Base area times height, backward',
        prompt: `<p>V = B × h, where B is the area of the base. A rectangular prism holds ${hl(d.V + ' ' + cu(d.u))} and is ${hl(d.h + ' ' + d.u)} tall. Its base is ${hl(d.l + ' ' + d.u)} long, but the width of the base is missing.</p>${prismSvg(d, { w: `? ${d.u}` })}<p>Work backward to complete the steps.</p>`,
        fields: [
          { label: 'base area B', answer: B },
          { label: 'width', answer: d.w },
        ],
        template: `B = V ÷ h, so B = {0} ${sq(d.u)}. The base is ${d.l} ${d.u} long, so its width is {1} ${d.u}.`,
        reference: true,
        hints: [
          'V = B × h. Undo the multiplying: divide the volume by the height to get the base area B. Then B = length × width.',
          `B = ${d.V} ÷ ${d.h}. Then width = B ÷ ${d.l}.`,
          `Find ${d.V} ÷ ${d.h} first. Then divide that base area by ${d.l}.`,
        ],
        hintEs: 'V = B × h. Haz la operación inversa: divide el volumen entre la altura para hallar el área de la base B. Después, B = largo × ancho.',
        solution: `<p>B = V ÷ h = ${d.V} ÷ ${d.h} = <b>${B}</b> ${sq(d.u)}. The base is a rectangle, so width = B ÷ length = ${B} ÷ ${d.l} = <b>${d.w}</b> ${d.u}. Check: ${d.l} × ${d.w} × ${d.h} = ${d.V} ${cu(d.u)}.</p>`,
        feedback: {
          correct: 'Correct. Dividing by the height gives the base area; dividing the base area by the length gives the width.',
          wrong(ans, dd) {
            const b = parseNum(ans[0]),
              w = parseNum(ans[1]);
            if (near(b, d.V * d.h)) return 'You multiplied the volume by the height. Undo V = B × h by dividing: V ÷ h.';
            if (near(b, d.V - d.h)) return 'You subtracted the height. The formula multiplies, so undo it by dividing: V ÷ h.';
            if (near(b, d.V / d.l)) return `You divided by the length. B is the base area, so divide the volume by the height ${d.h}.`;
            if (!dd.wrong.includes(0) && near(w, B - d.l)) return `You subtracted the length from B. The base area is length × width, so divide: B ÷ ${d.l}.`;
            if (!dd.wrong.includes(0)) return `Your base area is right. The width is the number that multiplies with ${d.l} to give B.`;
            return 'Undo V = B × h: divide the volume by the height to get B, then divide B by the length.';
          },
        },
      };
    }
    return {
      type: 'blanks',
      skill: 'volume',
      lesson: '5-5',
      title: 'Base area times height',
      prompt: `<p>Another way to write the volume formula is V = B × h, where B is the area of the base. This prism is ${hl(d.l + ' ' + d.u)} by ${hl(d.w + ' ' + d.u)} on the bottom and ${hl(d.h + ' ' + d.u)} tall.</p>${prismSvg(d)}<p>Complete the steps.</p>`,
      fields: [
        { label: 'base area B', answer: B },
        { label: 'height', answer: d.h },
        { label: 'volume', answer: d.V },
      ],
      template: `The base is a ${d.l} by ${d.w} rectangle, so B = {0} ${sq(d.u)}. The height is {1} ${d.u}. V = B × h = {2} ${cu(d.u)}.`,
      reference: true,
      hints: [
        'B is the area of the bottom rectangle: length × width. Then multiply by how tall the prism is.',
        `B = ${d.l} × ${d.w}. The height is the vertical edge, ${d.h} ${d.u}.`,
        `V = ${B} × ${d.h}.`,
      ],
      hintEs: 'B es el área del rectángulo de abajo (la base): largo × ancho. Después, multiplica por la altura del prisma.',
      solution: `<p>B = ${d.l} × ${d.w} = <b>${B}</b> ${sq(d.u)}. Height = <b>${d.h}</b> ${d.u}. V = ${B} × ${d.h} = <b>${d.V}</b> ${cu(d.u)}. B × h and l × w × h are the same formula: B is just l × w already multiplied.</p>`,
      feedback: {
        correct: 'Correct. Base area is in square units; multiplying by the height makes it cubic.',
        wrong(ans, dd) {
          const b = parseNum(ans[0]);
          if (near(b, d.l + d.w)) return `Base area is ${d.l} × ${d.w}, not ${d.l} + ${d.w}.`;
          if (near(b, 2 * (d.l + d.w))) return `${2 * (d.l + d.w)} is the perimeter of the base. Area is ${d.l} × ${d.w}.`;
          if (dd.wrong.includes(1)) return `The height is the edge that goes up: ${d.h} ${d.u}.`;
          if (dd.wrong.length === 1 && dd.wrong[0] === 2) return `V = B × h = ${B} × ${d.h}.`;
          return `B = ${d.l} × ${d.w}. Then multiply by the height ${d.h}.`;
        },
      },
    };
  });

  // ---------- Which prism / which expression has this volume? (mc; hard: fractional edge, subtler distractors) ----------
  G.define('g5_whichVolume', (r, o) => {
    const hard = !!(o && o.hard);
    const d = hard ? halfDims(r) : wholeDims(r);
    const u = d.u;
    const L = mixed(d.l),
      W = mixed(d.w),
      H = mixed(d.h);
    const whyOf = (sh) => (ans) => (sh.options[ans] && sh.options[ans].why) || 'Volume multiplies all three edges: l × w × h.';
    if (r.chance(0.5)) {
      const opts = hard
        ? [
            { html: `(${d.l} × ${d.w}) × ${H}`, ok: true },
            { html: `½ × ${d.l} × ${d.w} × ${H}`, why: 'The ½ belongs to triangles. A rectangular prism fills the whole box: l × w × h with no half.' },
            { html: `(${d.l} × ${d.w}) + ${H}`, why: `${d.l} × ${d.w} is the base area. Adding the height does not stack layers; multiply by the height ${H}.` },
            { html: `${d.l} × ${d.w} × ${Math.floor(d.h)}`, why: `That drops the ½ from ${H}. The height is ${fmt(d.h)}, so the half layer must be counted too.` },
          ]
        : [
            { html: `${d.l} × ${d.w} × ${d.h}`, ok: true },
            { html: `${d.l} + ${d.w} + ${d.h}`, why: 'Adding the edges gives a length. Volume multiplies all three edges.' },
            { html: `2 × (${d.l} × ${d.w}) + 2 × (${d.l} × ${d.h}) + 2 × (${d.w} × ${d.h})`, why: 'That is surface area, the total area of the six faces. Volume is the space inside, l × w × h.' },
            { html: `${d.l} × ${d.w}`, why: `${d.l} × ${d.w} is the area of the base only. Multiply by the height ${d.h} to fill the prism.` },
          ];
      const sh = shuffleOptions(r, opts, 0);
      return {
        type: 'mc',
        skill: 'volume',
        lesson: '5-5',
        title: 'Choose the volume expression',
        prompt: `<p>A rectangular prism is ${hl(L + ' ' + u)} long, ${hl(W + ' ' + u)} wide, and ${hl(H + ' ' + u)} tall.</p>${prismSvg(d)}<p>Which expression gives its volume in ${cu(u)}?</p>`,
        options: sh.options,
        answer: sh.answer,
        reference: true,
        hints: [
          'Volume = length × width × height.',
          hard ? 'Look for the expression that multiplies the base area by the full height, including the fraction.' : 'Look for the expression that multiplies all three edges and nothing else.',
          'Check each option: does it multiply exactly the three edges, with nothing added and nothing left out?',
        ],
        hintEs: 'Volumen = largo × ancho × altura.',
        solution: `<p>V = l × w × h = <b>${sh.options[sh.answer].html}</b> = ${fmt(d.V)} ${cu(u)}. ${hard ? 'A ½ in front is for triangles, adding the height does not stack layers, and dropping the fraction leaves out half a layer.' : 'Adding gives a length, l × w gives one face, and 2lw + 2lh + 2wh is surface area.'}</p>`,
        feedback: { correct: 'Correct. Multiply all three edges for volume.', wrong: whyOf(sh) },
      };
    }
    // Which box has a volume of V?
    const target = d.V;
    const txt = (p) => `${mixed(p.l)} ${u} by ${mixed(p.w)} ${u} by ${mixed(p.h)} ${u}`;
    const vol = (p) => round(p.l * p.w * p.h, 2);
    let cands;
    if (hard) {
      // subtler: same edge sum, same base, or a swapped half — volumes are close to the target but never equal
      cands = [
        { l: d.l + 1, w: d.w - 1, h: d.h, tag: 'same sum' },
        { l: d.l, w: d.w, h: d.h + 1, tag: 'same base' },
        { l: d.l + 0.5, w: d.w, h: d.h - 0.5, tag: 'moved half' },
        { l: d.l, w: d.w + 1, h: d.h - 1, tag: 'same sum' },
      ].filter((p) => p.w >= 1 && p.h > 0 && vol(p) !== target);
      cands = r.pickN(cands, 3);
    } else {
      cands = [
        { l: d.l + 1, w: d.w, h: d.h },
        { l: d.l, w: d.w, h: d.h + 1 },
        { l: d.l, w: d.w + 1, h: d.h },
      ];
    }
    const whyBox = (p) =>
      p.tag === 'same sum'
        ? `${fmt(p.l)} × ${fmt(p.w)} × ${fmt(p.h)} = ${fmt(vol(p))}, not ${fmt(target)}. Its edges add to the same total, but volume depends on the product, not the sum.`
        : p.tag === 'moved half'
          ? `${fmt(p.l)} × ${fmt(p.w)} × ${fmt(p.h)} = ${fmt(vol(p))}, not ${fmt(target)}. Moving a half from one edge to another changes the product.`
          : `${fmt(p.l)} × ${fmt(p.w)} × ${fmt(p.h)} = ${fmt(vol(p))}, not ${fmt(target)}. One edge is off by 1.`;
    const opts = [{ html: txt(d), ok: true }].concat(cands.map((p) => ({ html: txt(p), why: whyBox(p) })));
    const sh = shuffleOptions(r, opts, 0);
    const name = r.pick(NAMES),
      obj = r.pick(CONTAINERS);
    return {
      type: 'mc',
      skill: 'volume',
      lesson: '5-5',
      title: `Which box holds ${fmt(target)} ${cu(u)}?`,
      prompt: `<p>${name} needs a ${obj} that holds exactly ${hl(fmt(target) + ' ' + cu(u))}. Which rectangular prism has that volume?</p>`,
      options: sh.options,
      answer: sh.answer,
      reference: true,
      hints: [
        'Multiply the three edges of each box. Only one product equals the target.',
        `Start with the first box: multiply its three numbers and compare to ${fmt(target)}.`,
        hard ? 'Two boxes can have edges with the same sum but different products. Compute every product before you choose.' : 'Keep going until you find the product that matches exactly.',
      ],
      hintEs: 'Multiplica las tres aristas de cada caja. Solo un producto es igual al volumen que buscas.',
      solution: `<p><b>${txt(d)}</b>: ${fmt(d.l)} × ${fmt(d.w)} × ${fmt(d.h)} = ${fmt(target)} ${cu(u)}. The other boxes have volumes ${cands.map((p) => fmt(vol(p))).join(', ')}. Changing even one edge changes the volume.</p>`,
      feedback: { correct: `Correct. ${fmt(d.l)} × ${fmt(d.w)} × ${fmt(d.h)} = ${fmt(target)}.`, wrong: whyOf(sh) },
    };
  });

  // ---------- Order prisms by volume (seq; hard: four prisms with half-unit edges and close volumes) ----------
  G.define('g5_seqVolume', (r, o) => {
    const hard = !!(o && o.hard);
    const u = r.pick(U5.UNITS);
    const dims = [];
    const seen = new Set();
    const n = hard ? 4 : 3;
    let guard = 0;
    while (dims.length < n && guard++ < 500) {
      const l = r.int(2, 8),
        w = r.int(2, 6),
        h = hard ? r.int(2, 6) + 0.5 : r.int(2, 7);
      const Vv = round(l * w * h, 2);
      if (seen.has(Vv)) continue;
      if (hard && dims.length && Math.min(...dims.map((x) => Math.abs(x.V - Vv))) > 40) continue; // keep volumes close
      seen.add(Vv);
      dims.push({ l, w, h, V: Vv });
    }
    const asc = r.chance(0.5);
    const items = dims.map((d) => ({
      html:
        V.prism({ l: d.l, w: d.w, h: d.h, width: 150, height: 105, labels: { l: mixed(d.l), w: mixed(d.w), h: mixed(d.h) }, aria: `Prism ${mixed(d.l)} by ${mixed(d.w)} by ${mixed(d.h)}` }) +
        `<div class="muted">${mixed(d.l)} × ${mixed(d.w)} × ${mixed(d.h)} ${u}</div>`,
      rate: d.V,
    }));
    const order = dims.map((x, i) => i).sort((a, b) => (asc ? items[a].rate - items[b].rate : items[b].rate - items[a].rate));
    const list = dims.map((d) => `${mixed(d.l)} × ${mixed(d.w)} × ${mixed(d.h)} = ${fmt(d.V)}`).join('; ');
    return {
      type: 'seq',
      skill: 'volume',
      lesson: '5-5',
      title: 'Order by volume',
      prompt: `<p>Order the ${n === 4 ? 'four' : 'three'} prisms from <b>${asc ? 'least' : 'greatest'}</b> volume (top) to <b>${asc ? 'greatest' : 'least'}</b> volume (bottom). Edges are in ${u}.</p>`,
      items,
      order,
      hints: [
        'Compute each volume with l × w × h. A tall prism can still hold less than a short, wide one.',
        hard ? `Write each half as .5 first. Start with the first prism: ${mixed(dims[0].l)} × ${mixed(dims[0].w)} × ${mixed(dims[0].h)}.` : `Volumes: ${list}.`,
        hard ? 'Find all four volumes, then compare them. Some are close, so compare the decimals carefully.' : `Now put the ${asc ? 'smallest' : 'largest'} volume at the top.`,
      ],
      hintEs: 'Calcula cada volumen con l × a × h (largo × ancho × altura). Un prisma alto puede tener menos volumen que uno bajo y ancho.',
      solution: `<p>${dims.map((d) => `${mixed(d.l)} × ${mixed(d.w)} × ${mixed(d.h)} = ${fmt(d.V)} ${cu(u)}`).join('; ')}. From ${asc ? 'least to greatest' : 'greatest to least'}: <b>${order.map((i) => fmt(dims[i].V)).join(', ')}</b>. Computing beats guessing from the picture: the drawings are not to scale with each other.</p>`,
      feedback: {
        correct: 'Correct. Multiply first, then compare.',
        wrong() {
          return `Find each volume first with l × w × h${hard ? ', using .5 for each half' : ''}. Then put the ${asc ? 'least' : 'greatest'} at the top. Do not judge by how tall the drawing looks.`;
        },
      },
    };
  });

  // ---------- Fractional edges (num, honors hard: two quarter/half edges) ----------
  G.define('g5_fractional', (r, o) => {
    const d = fracDims(r, o);
    const name = r.pick(NAMES),
      obj = r.pick(CONTAINERS);
    const dec = (x) => (Number.isInteger(x) ? String(x) : `${mixed(x)} = ${fmt(x)}`);
    const lw = round(d.l * d.w, 4);
    return {
      type: 'num',
      skill: 'fractional-edges',
      lesson: '5-5',
      title: o.hard ? 'Seal of Space: fractional edges' : 'Volume with a fractional edge',
      xp: o.xp,
      prompt: `<p>${name} measures a ${obj}. It is ${hl(mixed(d.l) + ' ' + d.u)} long, ${hl(mixed(d.w) + ' ' + d.u)} wide, and ${hl(mixed(d.h) + ' ' + d.u)} tall.</p>${prismSvg(d)}<p>What is its volume? You may answer as a decimal or a fraction.</p>`,
      unit: cu(d.u),
      answer: d.V,
      reference: true,
      hints: [
        'The formula does not change for fractions: V = l × w × h. Write each mixed number as a decimal or improper fraction first.',
        `${[d.l, d.w, d.h].map(dec).join('; ')}. Multiply two edges first.`,
        `${fmt(d.l)} × ${fmt(d.w)} = ${fmt(lw)}. Now multiply by ${fmt(d.h)}.`,
      ],
      hintEs: 'La fórmula no cambia con fracciones: V = l × a × h. Primero escribe cada número mixto como decimal o como fracción impropia.',
      solution: `<p>V = ${mixed(d.l)} × ${mixed(d.w)} × ${mixed(d.h)} = ${fmt(d.l)} × ${fmt(d.w)} × ${fmt(d.h)} = ${fmt(lw)} × ${fmt(d.h)} = <b>${fmt(d.V)} ${cu(d.u)}</b>. A fractional edge means some unit cubes are cut, but the formula still counts the total space exactly.</p>`,
      feedback: { correct: `Correct. ${fmt(d.l)} × ${fmt(d.w)} × ${fmt(d.h)} = ${fmt(d.V)} ${cu(d.u)}.`, wrong: (ans, dd) => coachVolume(d, dd.value) },
    };
  });

  // ---------- Missing edge from the volume (num, honors hard: mixed-number length and a half-unit answer) ----------
  G.define('g5_missingEdge', (r, o) => {
    const hard = !!(o && o.hard);
    const u = r.pick(U5.UNITS),
      name = r.pick(NAMES),
      obj = r.pick(CONTAINERS);
    let l, w, h;
    if (hard) {
      l = r.int(3, 8) + 0.5;
      w = 2 * r.int(1, 4);
      h = r.int(2, 7) + 0.5;
    } else {
      l = r.int(3, 9);
      w = r.int(2, 6);
      h = r.int(2, 9);
    }
    const Vv = round(l * w * h, 2);
    const B = round(l * w, 2);
    const svg = V.prism({ l, w, h, labels: { l: `${mixed(l)} ${u}`, w: `${w} ${u}`, h: `? ${u}` }, aria: `Rectangular prism ${mixed(l)} ${u} long, ${w} ${u} wide, with an unknown height` });
    return {
      type: 'num',
      skill: 'fractional-edges',
      lesson: '5-5',
      title: hard ? 'Seal of Space: missing edge' : 'Find the missing edge',
      xp: o.xp,
      prompt: `<p>${name}'s ${obj} holds ${hl(fmt(Vv) + ' ' + cu(u))}. It is ${hl(mixed(l) + ' ' + u)} long and ${hl(w + ' ' + u)} wide, but the height label is torn off.</p>${svg}<p>What is the height of the ${obj}?${hard ? ' You may answer as a decimal or a fraction.' : ''}</p>`,
      unit: u,
      answer: h,
      reference: true,
      hints: [
        'V = l × w × h. You know V, l, and w. Work backward: divide the volume by the base area.',
        hard ? `Base area: ${mixed(l)} × ${w} = ${fmt(l)} × ${w} = ${fmt(B)} ${sq(u)}.` : `Base area: ${l} × ${w} = ${B} ${sq(u)}.`,
        `${fmt(Vv)} ÷ ${fmt(B)}.`,
      ],
      hintEs: 'V = l × a × h. Ya sabes V, l y a. Trabaja hacia atrás: divide el volumen entre el área de la base.',
      solution: `<p>V = B × h, so h = V ÷ B. B = ${mixed(l)} × ${w} = ${fmt(B)}. h = ${fmt(Vv)} ÷ ${fmt(B)} = <b>${fmt(h)} ${u}</b>. Check: ${fmt(l)} × ${w} × ${fmt(h)} = ${fmt(Vv)}. Dividing undoes the multiplying in the formula.</p>`,
      feedback: {
        correct: `Correct. ${fmt(Vv)} ÷ ${fmt(B)} = ${fmt(h)} ${u}. Volume divided by base area gives the height.`,
        wrong(ans, dd) {
          const v = dd.value;
          if (v == null) return `Divide the volume by the base area ${mixed(l)} × ${w}.`;
          if (near(v, Vv - B)) return 'You subtracted the base area. The formula multiplies, so undo it by dividing: V ÷ (l × w).';
          if (near(v, Vv / l) || near(v, Vv / w)) return `You divided by only one edge. Divide by both: ${fmt(Vv)} ÷ (${fmt(l)} × ${w}).`;
          if (near(v, Vv * B)) return 'Multiplying makes the number bigger. The height is smaller than the volume: divide.';
          if (hard && near(v, Vv / (Math.floor(l) * w))) return `You used ${Math.floor(l)} for the length and dropped the ½. The length is ${fmt(l)}, so the base area is ${fmt(l)} × ${w}.`;
          if (hard && near(v, Math.floor(h))) return 'Close, but the division does not come out even. Keep the remainder as a half: the height is not a whole number.';
          return 'Divide the volume by the base area (length × width). Check by multiplying length × width × your answer.';
        },
      },
    };
  });

  // ---------- Error with a mixed-number edge (error; hard: quarter edges and a partial-product mistake) ----------
  G.define('g5_errorMixed', (r, o) => {
    const hard = !!(o && o.hard);
    const u = r.pick(U5.UNITS),
      name = r.pick(NAMES);
    const frac = hard ? r.pick([0.25, 0.75]) : 0.5;
    const a = r.int(2, 6) + frac,
      b = hard ? 4 * r.int(1, 2) : 2 * r.int(1, 4),
      c = r.int(2, 6);
    const fr = mixed(frac);
    const Vv = round(a * b * c, 2);
    const variant = hard ? r.pick(['partial', 'dropped']) : r.pick(['dropped', 'added']);
    let work, opts, wrongV;
    if (variant === 'dropped') {
      wrongV = Math.floor(a) * b * c;
      work = `V = l × w × h<br>V = ${mixed(a)} × ${b} × ${c}<br>V = ${Math.floor(a)} × ${b} × ${c}<br>V = ${wrongV} ${cu(u)}`;
      opts = [
        { html: `${name} dropped the ${fr} from ${mixed(a)} and multiplied ${Math.floor(a)} instead. The whole mixed number must be used: ${fmt(a)} × ${b} × ${c}.`, ok: true },
        { html: `${name} should have added the three edges, because one of the edges is a mixed number and not a whole number.`, why: 'Volume multiplies the edges, fraction or not. The real mistake is the missing fraction.' },
        { html: `${name} should have used ${mixed(a)} × ${b} only, since one edge is a fraction and the third edge does not count.`, why: 'A fractional edge is still an edge. All three edges are multiplied, fraction or not.' },
        { html: `${name}'s work is correct, because rounding ${mixed(a)} down to ${Math.floor(a)} is allowed in volume.`, why: `${Math.floor(a)} is not the same as ${mixed(a)}. Dropping the ${fr} makes the volume too small: the true volume is ${fmt(Vv)}.` },
      ];
    } else if (variant === 'added') {
      wrongV = round(a + b + c, 2);
      work = `V = l × w × h<br>V = ${mixed(a)} + ${b} + ${c}<br>V = ${fmt(wrongV)} ${cu(u)}`;
      opts = [
        { html: `${name} added the edges instead of multiplying them. V = ${mixed(a)} × ${b} × ${c}.`, ok: true },
        { html: `${name} should have changed ${mixed(a)} to ${fmt(a)} before adding.`, why: `Changing to a decimal is fine, but the operation is still wrong. Volume multiplies the edges.` },
        { html: `${name} forgot to double the answer at the end.`, why: 'There is no doubling in the volume formula. The formula is l × w × h, a product of three edges.' },
        { html: `${name}'s work is correct as written.`, why: `${fmt(wrongV)} is a length, not a volume. The edges must be multiplied, which gives ${fmt(Vv)} ${cu(u)}.` },
      ];
    } else {
      // partial: multiplied only the whole part by b, then tacked the fraction back on
      const ab = Math.floor(a) * b + frac;
      wrongV = round(ab * c, 2);
      work = `V = l × w × h<br>V = ${mixed(a)} × ${b} × ${c}<br>${mixed(a)} × ${b} = ${Math.floor(a) * b}${fr}<br>V = ${mixed(ab)} × ${c} = ${fmt(wrongV)} ${cu(u)}`;
      opts = [
        { html: `${name} multiplied only the whole number ${Math.floor(a)} by ${b} and did not multiply the ${fr} by ${b}. ${mixed(a)} × ${b} is ${fmt(a * b)}.`, ok: true },
        { html: `${name} should have multiplied the ${fr} by ${c} too, so only the last line needs a change.`, why: `The last line is fine for the number it was given. The mistake is earlier: ${mixed(a)} × ${b} is not ${Math.floor(a) * b}${fr}.` },
        { html: `${name} should have rounded ${mixed(a)} to ${Math.ceil(a)} before multiplying the edges together.`, why: 'Rounding changes the edge length, so the volume would be wrong. Use the exact mixed number.' },
        { html: `${name}'s work is correct, because the fraction part of an edge is kept as it is.`, why: `Every part of ${mixed(a)} must be multiplied by ${b}, including the ${fr}: ${fr} × ${b} = ${fmt(frac * b)}.` },
      ];
    }
    const sh = shuffleOptions(r, opts, 0);
    const svg = prismSvg({ l: a, w: b, h: c, u }, {}, { width: 260, height: 190 });
    const hint2 = {
      dropped: `${mixed(a)} became ${Math.floor(a)}. The ${fr} disappeared. That ${fr} of a unit matters: it is ${fr} × ${b} × ${c} = ${fmt(frac * b * c)} ${cu(u)} of volume.`,
      added: 'Look at the operation signs. The formula says multiply; the work adds.',
      partial: `Split ${mixed(a)} into ${Math.floor(a)} + ${fr}. Both parts must be multiplied by ${b}: ${Math.floor(a)} × ${b} and ${fr} × ${b}.`,
    }[variant];
    const hint1 = 'Compare each line of the work with the line above it. Where does the work stop following the formula?';
    return {
      type: 'error',
      skill: 'fractional-edges',
      lesson: '5-5',
      title: 'Find the mistake',
      prompt: `<p>${name} found the volume of a prism that is ${mixed(a)} ${u} by ${b} ${u} by ${c} ${u}.</p>${svg}<p>What is wrong with ${name}'s work?</p>`,
      work,
      options: sh.options,
      answer: sh.answer,
      fix: { label: `Correct volume (${cu(u)}):`, answer: Vv },
      hints: [hint1, hint2, `Correct: ${fmt(a)} × ${b} × ${c}. First find ${fmt(a)} × ${b}, then multiply by ${c}.`],
      hintEs: 'Compara cada línea del trabajo con la línea de arriba. ¿Dónde deja de seguir la fórmula?',
      solution: `<p>${
        variant === 'dropped'
          ? `${name} dropped the fraction and used ${Math.floor(a)} instead of ${mixed(a)}.`
          : variant === 'added'
            ? `${name} added the edges instead of multiplying.`
            : `${name} multiplied only the whole part: ${mixed(a)} × ${b} = ${Math.floor(a) * b} + ${fmt(frac * b)} = ${fmt(a * b)}, not ${Math.floor(a) * b}${fr}.`
      } Correct: V = ${fmt(a)} × ${b} × ${c} = ${fmt(a * b)} × ${c} = <b>${fmt(Vv)} ${cu(u)}</b>. A mixed number works in the formula just like a whole number; write it as a decimal or improper fraction and multiply.</p>`,
      feedback: {
        correct: `Correct. ${fmt(a)} × ${b} × ${c} = ${fmt(Vv)} ${cu(u)}.`,
        wrong(ans, dd) {
          if (!dd.mistakeOk) return (sh.options[ans.mistake] && sh.options[ans.mistake].why) || 'Look closely at how the mixed number was handled.';
          const f = parseNum(ans.fix);
          if (near(f, wrongV)) return `That is ${name}'s answer again. Redo the multiplication with the full ${mixed(a)}.`;
          if (near(f, Math.floor(a) * b * c)) return `You dropped the ${fr} too. Use ${fmt(a)} for the edge, not ${Math.floor(a)}.`;
          return `You found the mistake. For the fix, multiply ${fmt(a)} × ${b} first, then multiply by ${c}.`;
        },
      },
    };
  });

  // ---------- True or false about volume (tf; hard: scaling two edges, cubes with fractional edges) ----------
  G.define('g5_tfDouble', (r, o) => {
    const hard = !!(o && o.hard);
    const u = r.pick(U5.UNITS);
    const l = 2 * r.int(2, 4),
      w = r.int(2, 5),
      h = r.int(2, 6),
      Vv = l * w * h;
    const a = r.int(2, 5) + 0.5,
      b = 2 * r.int(1, 4),
      c = r.int(2, 5);
    const pool = hard
      ? [
          {
            stmt: `Halving the length and doubling the width of a ${l} by ${w} by ${h} ${u} prism leaves its volume unchanged.`,
            answer: true,
            reasons: [
              { html: `${l / 2} × ${2 * w} × ${h} = ${Vv}, the same as ${l} × ${w} × ${h}. Multiplying by ½ and by 2 cancel out.`, correct: true },
              { html: 'The prism changes shape, so its volume must change too.' },
              { html: 'Halving one edge and doubling another makes the volume 1½ times as big.' },
            ],
          },
          {
            stmt: `A cube with edges of ½ ${u} has a volume of ½ ${cu(u)}.`,
            answer: false,
            reasons: [
              { html: `V = ½ × ½ × ½ = ⅛ ${cu(u)} = 0.125 ${cu(u)}. Multiplying fractions less than 1 makes the product smaller.`, correct: true },
              { html: `V = ½ + ½ + ½ = 1½ ${cu(u)}.` },
              { html: 'All edges are ½, so the volume is ½ as well.' },
            ],
          },
          {
            stmt: `Tripling the height and halving the length of a ${l} by ${w} by ${h} ${u} prism makes its volume 1½ times as big.`,
            answer: true,
            reasons: [
              { html: `${l / 2} × ${w} × ${3 * h} = ${1.5 * Vv}, and ${Vv} × 1½ = ${1.5 * Vv}. The volume is multiplied by 3 × ½ = 1½.`, correct: true },
              { html: 'Tripling one edge and halving another gives 3 − ½ = 2½ times the volume.' },
              { html: 'The volume triples, because the height is the edge that matters most.' },
            ],
          },
          {
            stmt: `A ${mixed(a)} by ${b} by ${c} ${u} prism holds more than a ${Math.floor(a)} by ${b} by ${c} ${u} prism, but less than a ${Math.ceil(a)} by ${b} by ${c} ${u} prism.`,
            answer: true,
            reasons: [
              { html: `${Math.floor(a) * b * c} < ${fmt(a * b * c)} < ${Math.ceil(a) * b * c}. Its length is between ${Math.floor(a)} and ${Math.ceil(a)}, so its volume is between theirs.`, correct: true },
              { html: 'A fractional edge cannot be compared with whole-number edges.' },
              { html: `It holds exactly as much as the ${Math.ceil(a)} by ${b} by ${c} prism, because ${mixed(a)} rounds up to ${Math.ceil(a)}.` },
            ],
          },
        ]
      : [
          {
            stmt: `Doubling the height of a ${l} by ${w} by ${h} ${u} prism doubles its volume.`,
            answer: true,
            reasons: [
              { html: `V = ${l} × ${w} × ${h} = ${Vv}. With height ${2 * h}: ${l} × ${w} × ${2 * h} = ${2 * Vv}. Doubling one factor doubles the product.`, correct: true },
              { html: 'Doubling the height doubles each of the three edges, so the volume is 8 times as big.' },
              { html: 'Height does not affect volume; only the base does.' },
            ],
          },
          {
            stmt: `Doubling all three edges of a ${l} by ${w} by ${h} ${u} prism doubles its volume.`,
            answer: false,
            reasons: [
              { html: `Each of the three factors doubles, so the volume is 2 × 2 × 2 = 8 times as big: ${Vv} becomes ${8 * Vv} ${cu(u)}.`, correct: true },
              { html: 'Doubling three edges triples the volume, because there are three edges.' },
              { html: 'Doubling the edges does not change the volume; only the shape changes.' },
            ],
          },
          {
            stmt: `A prism with a fractional edge, such as ${mixed(a)} ${u} by ${b} ${u} by ${c} ${u}, can have a whole-number volume.`,
            answer: true,
            reasons: [
              { html: `${fmt(a)} × ${b} × ${c} = ${fmt(a * b * c)}. Multiplying the half by an even edge removes the fraction.`, correct: true },
              { html: 'A fractional edge always gives a fractional volume.' },
              { html: 'Prisms cannot have fractional edges, so the volume is always whole.' },
            ],
          },
          {
            stmt: `V = B × h and V = l × w × h give different volumes for the same ${l} by ${w} by ${h} ${u} prism.`,
            answer: false,
            reasons: [
              { html: `B is the area of the base, ${l} × ${w} = ${l * w}. So B × h = ${l * w} × ${h} is l × w × h written in two steps. Same prism, same volume.`, correct: true },
              { html: 'B × h is for triangular prisms, so it gives a smaller answer.' },
              { html: 'B × h gives a square-unit answer and l × w × h gives a cubic-unit answer.' },
            ],
          },
          {
            stmt: `The volume of a ${l} ${u} by ${w} ${u} by ${h} ${u} prism is ${Vv} ${sq(u)}.`,
            answer: false,
            reasons: [
              { html: `The number ${Vv} is right, but volume is measured in cubic units: ${Vv} ${cu(u)}. Square units measure area.`, correct: true },
              { html: `The volume should be ${l + w + h} ${sq(u)}.` },
              { html: 'Volume has no unit because it counts cubes.' },
            ],
          },
        ];
    const v = r.pick(pool);
    const reasons = r.shuffle(v.reasons);
    return {
      type: 'tf',
      skill: 'fractional-edges',
      lesson: '5-5',
      title: 'True or false?',
      prompt: `<p>Decide whether the statement is true or false, then choose the best reason.</p><p class="stmt"><b>${v.stmt}</b></p>`,
      answer: v.answer,
      reasons,
      reference: true,
      hints: [
        hard ? 'Test the statement with the actual numbers. V = l × w × h. Think about what each change multiplies the volume by.' : 'Test the statement with the actual numbers. V = l × w × h.',
        'Multiply the edges before and after the change the statement describes, and compare.',
        'Compare the two volumes you found with what the statement claims. Then pick the reason that matches your numbers.',
      ],
      hintEs: hard
        ? 'Prueba la afirmación con los números reales. V = l × a × h. Piensa por cuánto multiplica el volumen cada cambio.'
        : 'Prueba la afirmación con los números reales. V = l × a × h.',
      solution: `<p><b>${v.answer ? 'True' : 'False'}.</b> ${reasons.find((x) => x.correct).html}</p>`,
      feedback: {
        correct: 'Correct. Volume is the product of three edges, measured in cubic units.',
        wrong(ans, dd) {
          if (!dd.valueOk) return v.answer ? 'The statement is actually true. Compute the volume before and after with the numbers given.' : 'Look again: compute the volume with the numbers given. The numbers do not match the claim.';
          return 'Your true/false is right. Choose the reason that uses l × w × h correctly with these numbers.';
        },
      },
    };
  });
})(typeof window !== 'undefined' ? window : globalThis);

/* js/units/u5/gen-nets-lib.js */
/* Zone 6 — The Gallery of Nets. Lesson 5-6 Represent Three-Dimensional Figures in Two Dimensions (drawing nets · reading nets and solids). */
/* Shared helpers for gen-nets.js and gen-nets-2.js (split for size). */
(function (root) {
  'use strict';
  const RX = root.RX;
  const { G, V, shuffleOptions, NAMES, fmt, round, U5 } = RX;
  const hl = V.hl;
  const sq = U5.sq;
  const C = V.COLORS;

  const SOLIDS = {
    rect: { key: 'rect', name: 'rectangular prism', es: 'prisma rectangular', F: 6, E: 12, V: 8, faces: '6 rectangles in 3 matching pairs', example: 'a cereal box' },
    cube: { key: 'cube', name: 'cube', es: 'cubo', F: 6, E: 12, V: 8, faces: '6 identical squares', example: 'a number cube' },
    tri: { key: 'tri', name: 'triangular prism', es: 'prisma triangular', F: 5, E: 9, V: 6, faces: '2 triangles and 3 rectangles', example: 'a camping tent' },
    pyr: { key: 'pyr', name: 'square pyramid', es: 'pirámide cuadrangular', F: 5, E: 8, V: 5, faces: '1 square and 4 triangles', example: 'a monument in Egypt' },
    tripyr: { key: 'tripyr', name: 'triangular pyramid', es: 'pirámide triangular', F: 4, E: 6, V: 4, faces: '4 triangles', example: 'a four-sided die' },
  };
  const ORDER = ['rect', 'cube', 'tri', 'pyr'];
  /** Less familiar solids for hard mode: prisms and pyramids with an n-sided base. */
  const BASE = { 3: 'triangle', 5: 'pentagon', 6: 'hexagon' };
  const ADJ = { 3: 'triangular', 5: 'pentagonal', 6: 'hexagonal' };
  function nSolid(kind, n) {
    const isPrism = kind === 'prism';
    return {
      key: kind + n,
      kind,
      n,
      name: `${ADJ[n]} ${kind}`,
      F: isPrism ? n + 2 : n + 1,
      E: isPrism ? 3 * n : 2 * n,
      V: isPrism ? 2 * n : n + 1,
      faces: isPrism ? `2 ${BASE[n]}s and ${n} rectangles` : n === 3 ? '4 triangles' : `1 ${BASE[n]} and ${n} triangles`,
      why: isPrism
        ? `A ${ADJ[n]} prism has ${n} edges on each ${BASE[n]} base plus ${n} edges joining them (${3 * n}), and ${n} corners on each base (${2 * n}).`
        : `A ${ADJ[n]} pyramid has ${n} edges around the base plus ${n} edges rising to the apex (${2 * n}), and ${n} base corners plus the apex (${n + 1}).`,
    };
  }
  const HARD_SOLIDS = [nSolid('prism', 5), nSolid('prism', 6), nSolid('pyramid', 3), nSolid('pyramid', 5), nSolid('pyramid', 6)];
  // Right-triangle cross-sections for triangular prisms (legs b, h; hypotenuse s).
  const RIGHT = [
    [3, 4, 5],
    [6, 8, 10],
    [4, 3, 5],
  ];

  /** Net of a triangular pyramid: one large triangle split into four. */
  function tetraNet(o) {
    o = o || {};
    const t = 1.732;
    const polys = [
      [
        [0, 0],
        [2, 0],
        [1, t],
      ],
      [
        [2, 0],
        [4, 0],
        [3, t],
      ],
      [
        [1, t],
        [3, t],
        [2, 2 * t],
      ],
      [
        [2, 0],
        [3, t],
        [1, t],
      ],
    ];
    return V.figure({
      pts: polys[3],
      extraPts: polys.flat(),
      polys,
      fills: [C.a, C.a, C.a, C.b],
      width: o.width,
      height: o.heightPx,
      aria: o.aria || 'Four triangles: one large triangle split into four smaller ones',
    });
  }
  /** Look-alike rectangular-prism net: four sides in a row with two flaps on the top edge and none on the bottom. Does not fold closed. */
  function twoTopsNet(l, w, h, o) {
    o = o || {};
    const r = (x, y, ww, hh) => [
      [x, y],
      [x + ww, y],
      [x + ww, y + hh],
      [x, y + hh],
    ];
    const polys = [r(0, 0, w, h), r(w, 0, l, h), r(w + l, 0, w, h), r(2 * w + l, 0, l, h), r(w, h, l, w), r(2 * w + l, h, l, w)];
    return V.figure({
      pts: polys[1],
      extraPts: polys.flat(),
      polys,
      fills: [C.c, C.a, C.c, C.a, C.b, C.b],
      width: o.width,
      height: o.heightPx,
      aria: o.aria || 'Six rectangles: four in a row with two rectangles above it',
    });
  }
  /** Look-alike triangular-prism net: both triangles fold onto the same end. */
  function sameEndTriNet(b, h, s1, s2, L, o) {
    o = o || {};
    const r = (x0, ww) => [
      [x0, 0],
      [x0 + ww, 0],
      [x0 + ww, L],
      [x0, L],
    ];
    const polys = [
      r(0, b),
      r(b, s1),
      r(b + s1, s2),
      [
        [0, L],
        [b, L],
        [b / 2, L + h],
      ],
      [
        [b + s1, L],
        [b + s1 + s2, L],
        [b + s1 + s2 / 2, L + h],
      ],
    ];
    return V.figure({
      pts: polys[0],
      extraPts: polys.flat(),
      polys,
      fills: [C.b, C.c, C.c, C.a, C.a],
      width: o.width,
      height: o.heightPx,
      aria: o.aria || 'Three rectangles in a row with two triangles, both above the row',
    });
  }

  /** Small net for a solid key. */
  function net(key, r, o) {
    o = o || {};
    const w = o.width || 170;
    if (key === 'rect') {
      const l = r.int(3, 5),
        wd = r.int(1, 2),
        h = r.int(2, 3);
      return V.prismNet({ l, w: wd, h, width: w, aria: `Net of a rectangular prism: six rectangles in a cross shape, ${l} by ${wd} by ${h}` });
    }
    if (key === 'cube') {
      const e = r.int(2, 4);
      return V.prismNet({ l: e, w: e, h: e, width: w, aria: `Net of a cube: six ${e} by ${e} squares in a cross shape` });
    }
    if (key === 'tri') {
      const [b, h, s] = r.pick(RIGHT);
      return U5.triNet(b, h, s, h, r.int(4, 7), { width: w, heightPx: o.heightPx || 130, aria: 'Net of a triangular prism: three rectangles in a row with a triangle above and below the first one' });
    }
    if (key === 'tripyr') return tetraNet({ width: w, heightPx: o.heightPx || 130, aria: 'Net of four triangles: one large triangle split into four smaller ones' });
    const b = r.int(3, 6);
    return V.pyramidNet({ b, slant: r.int(Math.ceil(b / 2) + 1, b + 1), width: w, aria: `Net of a square pyramid: a ${b} by ${b} square with a triangle on each side` });
  }
  /** Small solid picture for a solid key. */
  function solidPic(key, r, o) {
    o = o || {};
    const w = o.width || 170,
      hpx = o.height || 130;
    if (key === 'rect') return V.prism({ l: r.int(3, 5), w: r.int(1, 2), h: r.int(2, 3), width: w, height: hpx, labels: { l: '', w: '', h: '' }, aria: 'A rectangular prism' });
    if (key === 'cube') return V.prism({ l: 2, w: 2, h: 2, width: w, height: hpx, labels: { l: '', w: '', h: '' }, aria: 'A cube' });
    if (key === 'tri') {
      const [b, h] = r.pick(RIGHT);
      return V.triPrism({ b, h, len: r.int(4, 7), right: true, width: w, height: hpx, labels: { b: '', h: '', len: '' }, aria: 'A triangular prism' });
    }
    return V.pyramid({ b: 4, slant: 4, width: w, height: hpx, baseLabel: '', slantLabel: '', aria: 'A square pyramid' });
  }
  const card = (svg, caption) => `<div style="text-align:center">${svg}<div class="muted">${caption}</div></div>`;
  const whyOf = (opts, fallback) => (ans) => (opts[ans] && opts[ans].why) || fallback;

  // ---------- Choose the net of a solid (rep, honors hard: look-alike nets that do not fold closed) ----------
  function esFaces(key) {
    return { rect: '6 rectángulos en 3 pares iguales', cube: '6 cuadrados idénticos', tri: '2 triángulos y 3 rectángulos', pyr: '1 cuadrado y 4 triángulos', tripyr: '4 triángulos' }[key];
  }

  // ---------- Count faces, edges, vertices (table; hard: unfamiliar prisms and pyramids, described in words) ----------
  function cap(s) {
    return s.charAt(0).toUpperCase() + s.slice(1);
  }
  function fevWhy(S) {
    if (S.key === 'rect' || S.key === 'cube') return `A ${S.name} is a box: 4 edges on top, 4 on the bottom, 4 standing up (12); 4 corners on top and 4 on the bottom (8).`;
    if (S.key === 'tri') return 'A triangular prism has 3 edges on each triangle end plus 3 edges joining them (9), and 3 corners on each end (6).';
    if (S.key === 'tripyr') return 'A triangular pyramid has 3 edges around the base plus 3 edges rising to the top point (6), and 3 base corners plus the apex (4).';
    return 'A square pyramid has 4 edges around the square base plus 4 edges rising to the top point (8), and 4 base corners plus the apex (5).';
  }

  // ---------- Sort (sort): 2-D vs 3-D · prism vs pyramid · description to solid (hard: unfamiliar solids by counts) ----------
  // ---------- Match each solid to its net (match; hard: adds a triangular pyramid and near-cube boxes) ----------
  // ---------- Which solid does this net fold into? (mc; hard: adds the triangular pyramid as net and option) ----------
  // ---------- Read a net: area of one face, or count edges/vertices (num; hard: half-unit edges, unfamiliar nets in words) ----------
  // ---------- True or false about nets and solids (tf; hard: unfamiliar solids and subtler claims) ----------
  // ---------- Who counted correctly? (who; hard: unfamiliar solids, described in words) ----------
  RX._lib = RX._lib || {};
  RX._lib['u5/gen-nets'] = {
    G,
    V,
    shuffleOptions,
    NAMES,
    fmt,
    round,
    U5,
    hl,
    sq,
    C,
    SOLIDS,
    ORDER,
    BASE,
    ADJ,
    nSolid,
    HARD_SOLIDS,
    RIGHT,
    tetraNet,
    twoTopsNet,
    sameEndTriNet,
    net,
    solidPic,
    card,
    whyOf,
    esFaces,
    cap,
    fevWhy,
  };
})(typeof window !== 'undefined' ? window : globalThis);

/* js/units/u5/gen-nets.js */
/* Zone 6 — The Gallery of Nets. Lesson 5-6 Represent Three-Dimensional Figures in Two Dimensions (drawing nets · reading nets and solids). */
(function (root) {
  'use strict';
  const RX = root.RX;
  const {
    G,
    V,
    shuffleOptions,
    NAMES,
    fmt,
    round,
    U5,
    hl,
    sq,
    C,
    SOLIDS,
    ORDER,
    BASE,
    ADJ,
    nSolid,
    HARD_SOLIDS,
    RIGHT,
    tetraNet,
    twoTopsNet,
    sameEndTriNet,
    net,
    solidPic,
    card,
    whyOf,
    esFaces,
    cap,
    fevWhy,
  } = RX._lib['u5/gen-nets'];

  G.define('g6_chooseNet', (r, o) => {
    const hard = !!(o && o.hard);
    const key = r.pick(['rect', 'pyr', 'tri']);
    const S = SOLIDS[key];
    const l = r.int(3, 5),
      w = r.int(1, 2),
      h = r.int(2, 3);
    const letters = ['A', 'B', 'C', 'D'];
    let opts;
    if (key === 'rect') {
      opts = [
        { html: V.prismNet({ l, w, h, width: 170, aria: 'Six rectangles in a cross shape' }), ok: true },
        {
          html: U5.prismNetFaces(l, w, h, { omit: 'bottom', width: 170, heightPx: 130, aria: 'Five rectangles' }),
          why: 'Count the faces: only 5. A rectangular prism has 6 faces, so this folds into an open box with no bottom.',
        },
        {
          html: U5.blockNet(l, w, { width: 170, heightPx: 130 }),
          why: 'Six rectangles, but packed in a 2 by 3 block. Try folding it: the faces overlap and two sides stay open. The rectangles must be arranged so each folds into a different face.',
        },
      ];
      if (hard)
        opts.push({
          html: twoTopsNet(l, w, h, { width: 170, heightPx: 130 }),
          why: 'Six rectangles, but both flaps sit on the top edge of the row. When folded, both cover the top and the bottom stays open. One flap must go above the row and one below.',
        });
    } else if (key === 'pyr') {
      const b = r.int(3, 6);
      opts = [
        { html: V.pyramidNet({ b, slant: b, width: 170, aria: 'A square with a triangle on each side' }), ok: true },
        {
          html: V.prismNet({ l, w, h, width: 170, aria: 'Six rectangles in a cross shape' }),
          why: 'Six rectangles fold into a box (a rectangular prism). A pyramid needs triangles that meet at a point.',
        },
        {
          html: U5.triNet(3, 4, 5, 4, 5, { width: 170, heightPx: 130, aria: 'Three rectangles with two triangles' }),
          why: 'Two triangles and three rectangles fold into a triangular prism. A square pyramid has one square and four triangles.',
        },
      ];
      if (hard)
        opts.push({
          html: tetraNet({ width: 170, heightPx: 130 }),
          why: 'Four triangles do fold up to a point, but with no square there is no square base. This is the net of a triangular pyramid.',
        });
    } else {
      const [b, hh, s] = r.pick(RIGHT);
      const L = r.int(4, 7);
      opts = [
        { html: U5.triNet(b, hh, s, hh, L, { width: 170, heightPx: 130, aria: 'Three rectangles in a row with a triangle above and below' }), ok: true },
        {
          html: V.prismNet({ l, w, h, width: 170, aria: 'Six rectangles in a cross shape' }),
          why: 'All six faces are rectangles, so this folds into a rectangular prism. A triangular prism needs two triangular ends.',
        },
        {
          html: V.pyramidNet({ b: 4, slant: 4, width: 170, aria: 'A square with four triangles' }),
          why: 'Four triangles around one square fold into a square pyramid. A triangular prism has only two triangles.',
        },
      ];
      if (hard)
        opts.push({
          html: sameEndTriNet(b, hh, s, hh, L, { width: 170, heightPx: 130 }),
          why: 'It has the right faces, 2 triangles and 3 rectangles, but both triangles sit on the same end. When folded they overlap, and the other end stays open.',
        });
    }
    const sh = shuffleOptions(r, opts, 0);
    sh.options = sh.options.map((op, i) => Object.assign({}, op, { html: card(op.html, 'Net ' + letters[i]) }));
    const name = r.pick(NAMES);
    return {
      type: 'rep',
      skill: 'nets',
      lesson: '5-6',
      title: hard ? 'Seal of Surface: choose the net' : `Choose the net of a ${S.name}`,
      xp: o.xp,
      prompt: `<p>${name} wants to cut and fold a ${S.name} from one sheet of paper. A <b>net</b> is a flat pattern that folds into the solid with every face in place and no overlaps.</p><p>Which pattern is a net of a ${S.name} (${S.faces})?</p>`,
      options: sh.options,
      answer: sh.answer,
      layout: 'cards',
      hints: [
        `Count the faces in each pattern. A ${S.name} has ${S.F} faces: ${S.faces}.`,
        hard
          ? 'More than one pattern has the right faces. Picture folding each one: every face must land in its own spot, with no two faces on top of each other.'
          : 'Then picture folding. Every face must end up in its own spot, and no two faces can land on top of each other.',
        'Cross out each pattern with the wrong faces or with two faces that land on the same spot. One pattern is left.',
      ],
      hintEs: `Cuenta las caras de cada plantilla. El cuerpo que buscas (${S.es}) tiene ${S.F} caras: ${esFaces(S.key)}.`,
      solution: `<p><b>Net ${letters[sh.answer]}</b> folds into a ${S.name}: it has ${S.faces}, and each face folds into its own position. ${sh.options
        .map((op, i) => (op.ok ? null : `Net ${letters[i]}: ${op.why}`))
        .filter(Boolean)
        .join(' ')}</p>`,
      feedback: { correct: `Correct. A ${S.name} has ${S.faces}, and this pattern folds them up with no overlaps.`, wrong: whyOf(sh.options, 'Count the faces, then picture folding each pattern.') },
    };
  });
  G.define('g6_countFEV', (r, o) => {
    const hard = !!(o && o.hard);
    const name = r.pick(NAMES);
    let A, B, pics, why;
    if (hard) {
      [A, B] = r.pickN(HARD_SOLIDS, 2);
      pics = `<ul><li><b>${cap(A.name)}</b>: ${A.faces}.</li><li><b>${cap(B.name)}</b>: ${B.faces}.</li></ul>`;
      why = (S) => S.why;
    } else {
      const [kA, kB] = r.pickN(ORDER, 2);
      A = SOLIDS[kA];
      B = SOLIDS[kB];
      pics = `<div style="display:flex;gap:12px;flex-wrap:wrap;justify-content:center">${card(solidPic(kA, r, { width: 150, height: 115 }), cap(A.name))}${card(solidPic(kB, r, { width: 150, height: 115 }), cap(B.name))}</div>`;
      why = fevWhy;
    }
    const rows = [
      ['Solid', 'Faces', 'Edges', 'Vertices'],
      [cap(A.name), String(A.F), '__IN:eA__', '__IN:vA__'],
      [cap(B.name), '__IN:fB__', String(B.E), '__IN:vB__'],
    ];
    return {
      type: 'table',
      skill: 'solids',
      lesson: '5-6',
      title: 'Faces, edges, and vertices',
      prompt: hard
        ? `<p>${name} is describing two solids with no pictures. A <b>face</b> is a flat surface, an <b>edge</b> is where two faces meet, and a <b>vertex</b> is a corner where edges meet.</p>${pics}<p>Picture each solid and complete the table.</p>`
        : `<p>${name} is labeling two solids. A <b>face</b> is a flat surface, an <b>edge</b> is where two faces meet, and a <b>vertex</b> is a corner where edges meet.</p>${pics}<p>Complete the table.</p>`,
      rows,
      header: true,
      inputs: [
        { id: 'eA', answer: A.E },
        { id: 'vA', answer: A.V },
        { id: 'fB', answer: B.F },
        { id: 'vB', answer: B.V },
      ],
      hints: hard
        ? [
            'A prism has two matching bases joined by rectangles. A pyramid has one base and triangles that meet at one point (the apex).',
            'Prism with an n-sided base: n edges on each base plus n joining edges, and n corners on each base. Pyramid with an n-sided base: n base edges plus n edges to the apex, and n base corners plus the apex.',
            `${cap(A.name)}: the base has ${A.n} sides. ${cap(B.name)}: the base has ${B.n} sides. Use those numbers in the patterns.`,
          ]
        : [
            'Count carefully, including the faces and corners hidden at the back. Dashed lines show hidden edges.',
            `${cap(A.name)}: ${A.faces}. ${cap(B.name)}: ${B.faces}. Count each face once.`,
            `${cap(A.name)}: start with the edges around one base, then add the rest. ${cap(B.name)}: count the faces one shape at a time.`,
          ],
      hintEs: hard
        ? 'Un prisma tiene dos bases iguales unidas por rectángulos. Una pirámide tiene una base y triángulos que se juntan en un punto (el vértice superior).'
        : 'Cuenta con cuidado, también las caras y los vértices que están escondidos atrás. Las líneas punteadas muestran las aristas escondidas.',
      solution: `<p><b>${cap(A.name)}</b>: ${A.F} faces, <b>${A.E}</b> edges, <b>${A.V}</b> vertices. <b>${cap(B.name)}</b>: <b>${B.F}</b> faces, ${B.E} edges, <b>${B.V}</b> vertices. ${why(A)} ${why(B)}</p>`,
      feedback: {
        correct: 'Correct. Faces are flat surfaces, edges are where faces meet, vertices are corners.',
        wrong(ans, d) {
          const n = (id) => Number(ans && ans[id]);
          if (d.wrong.includes('eA') && n('eA') === A.V) return `For the ${A.name} you wrote the vertex count as the edges. Edges are segments where faces meet; vertices are corners.`;
          if (d.wrong.includes('vA') && n('vA') === A.E) return `For the ${A.name} you wrote the edge count as the vertices. Count corners, not segments.`;
          if (d.wrong.includes('vB') && B.kind === 'pyramid' && n('vB') === B.n) return `You missed the apex of the ${B.name}. Its base has ${B.n} corners, and the top point is one more vertex.`;
          if (d.wrong.includes('vB') && B.key === 'pyr' && n('vB') === 4) return 'You missed the apex of the square pyramid. The top point is a vertex too.';
          if (d.wrong.includes('fB')) return `Faces of a ${B.name}: ${B.faces}. Count each one, including the base${B.kind === 'prism' || /prism/.test(B.name) ? 's' : ''}.`;
          if (d.wrong.includes('eA')) return `Edges of a ${A.name}: count the segments where two faces meet, including hidden ones. Start with the edges around one base.`;
          if (d.wrong.includes('vA')) return `Vertices of a ${A.name}: count the corners, top and bottom.`;
          return `Vertices of a ${B.name}: count every corner, including hidden ones.`;
        },
      },
    };
  });
  G.define('g6_sort2D3D', (r, o) => {
    const hard = !!(o && o.hard);
    const listBin = (items, bin) =>
      items
        .filter((i) => i.bin === bin)
        .map((i) => i.html)
        .join('; ');
    if (hard) {
      const prism = [
        '7 faces, 15 edges, 10 vertices',
        '8 faces, 18 edges, 12 vertices',
        'two hexagon bases joined by 6 rectangles',
        'the net has 2 pentagons and 5 rectangles',
        'it has twice as many vertices as its base has corners',
        'every face that is not a base is a rectangle',
      ];
      const pyr = [
        '6 faces, 10 edges, 6 vertices',
        '7 faces, 12 edges, 7 vertices',
        '4 faces, all of them triangles',
        'a hexagon base with 6 triangles meeting at a point',
        'it has the same number of faces as vertices',
        'the net is a pentagon with a triangle on each side',
      ];
      const items = r.shuffle(
        r
          .pickN(prism, 3)
          .map((t) => ({ html: t, bin: 0 }))
          .concat(r.pickN(pyr, 3).map((t) => ({ html: t, bin: 1 }))),
      );
      return {
        type: 'sort',
        skill: 'solids',
        lesson: '5-6',
        title: 'Prism or pyramid? Read the counts',
        prompt:
          '<p>Each clue describes a prism or a pyramid, but the base is not always a square or rectangle. A <b>prism</b> has two matching bases joined by rectangles. A <b>pyramid</b> has one base, and triangles meet at a point. Sort each clue.</p>',
        bins: ['Prism', 'Pyramid'],
        items,
        hints: [
          'For a base with n sides: a prism has 3n edges and 2n vertices; a pyramid has 2n edges and n + 1 vertices.',
          'Test the counts. If the vertices are twice a base count, it is a prism. If faces equal vertices, it is a pyramid.',
          'Example: 7 faces, 15 edges, 10 vertices. 10 = 2 × 5 and 15 = 3 × 5, so decide which solid that pattern fits.',
        ],
        hintEs: 'Si la base tiene n lados: un prisma tiene 3n aristas y 2n vértices; una pirámide tiene 2n aristas y n + 1 vértices.',
        solution: `<p>Prism: ${listBin(items, 0)}. Pyramid: ${listBin(items, 1)}. A prism with an n-sided base has n + 2 faces, 3n edges, and 2n vertices. A pyramid with an n-sided base has n + 1 faces, 2n edges, and n + 1 vertices.</p>`,
        feedback: {
          correct: 'Correct. The counts follow a pattern: prisms have 2n vertices, pyramids have n + 1.',
          wrong: (ans, d) => {
            const bad = items[d.wrong && d.wrong[0]];
            if (bad && /faces,/.test(bad.html))
              return `Check "${bad.html}". Find the number of sides of the base, then test the prism pattern (3n edges, 2n vertices) and the pyramid pattern (2n edges, n + 1 vertices).`;
            if (bad) return `Check "${bad.html}". Does it describe two matching bases (prism) or triangles meeting at one point (pyramid)?`;
            return 'Test each clue against the prism and pyramid patterns.';
          },
        },
      };
    }
    const variant = r.pick(['dim', 'prismPyr', 'solid']);
    if (variant === 'dim') {
      const flat = ['rectangle', 'triangle', 'trapezoid', 'regular hexagon', 'parallelogram', 'the net of a cube', 'a square drawn on paper', 'a circle'];
      const solid = ['rectangular prism', 'square pyramid', 'cube', 'triangular prism', 'a cereal box', 'a brick', 'a tent', 'a number cube'];
      const items = r.shuffle(
        r
          .pickN(flat, 3)
          .map((t) => ({ html: t, bin: 0 }))
          .concat(r.pickN(solid, 3).map((t) => ({ html: t, bin: 1 }))),
      );
      return {
        type: 'sort',
        skill: 'solids',
        lesson: '5-6',
        title: 'Flat or solid?',
        prompt: '<p>A <b>two-dimensional</b> figure is flat: it has length and width but no thickness. A <b>three-dimensional</b> figure is a solid: it takes up space. Sort each item.</p>',
        bins: ['Two-dimensional (flat)', 'Three-dimensional (solid)'],
        items,
        hints: [
          'Ask: could this lie completely flat on a sheet of paper? If yes, it is two-dimensional.',
          'A net is flat, even though it folds into a solid. A box, tent, or pyramid takes up space.',
          'Polygons (rectangle, triangle, hexagon) and nets are 2-D. Prisms, pyramids, cubes, and real objects like boxes are 3-D.',
        ],
        hintEs: 'Pregúntate: ¿esto puede quedar completamente plano sobre una hoja de papel? Si la respuesta es sí, es bidimensional.',
        solution: `<p>Two-dimensional: ${listBin(items, 0)}. Three-dimensional: ${listBin(items, 1)}. A net is a flat pattern, so it is 2-D until it is folded.</p>`,
        feedback: {
          correct: 'Correct. Flat shapes and nets are 2-D; solids take up space and are 3-D.',
          wrong: (ans, d) => {
            const bad = items[d.wrong && d.wrong[0]];
            if (bad && /net/.test(bad.html)) return 'A net folds into a solid, but the net itself is flat. It is two-dimensional.';
            if (bad && bad.bin === 1) return `"${bad.html}" takes up space; it cannot lie flat on paper. It is three-dimensional.`;
            return 'Ask whether each item could lie flat on paper. Nets and polygons can; boxes, tents, and pyramids cannot.';
          },
        },
      };
    }
    if (variant === 'prismPyr') {
      const prism = [
        'two identical parallel bases',
        'all side faces are rectangles',
        'a cereal box',
        'a tent with triangular ends',
        '6 faces, 12 edges, 8 vertices',
        'the net has 3 rectangles between 2 triangles',
      ];
      const pyr = [
        'side faces meet at one point (the apex)',
        'one base only',
        '5 faces, 8 edges, 5 vertices',
        'all side faces are triangles',
        'the net is a square with 4 triangles',
        'a monument in Egypt',
      ];
      const items = r.shuffle(
        r
          .pickN(prism, 3)
          .map((t) => ({ html: t, bin: 0 }))
          .concat(r.pickN(pyr, 3).map((t) => ({ html: t, bin: 1 }))),
      );
      return {
        type: 'sort',
        skill: 'solids',
        lesson: '5-6',
        title: 'Prism or pyramid?',
        prompt: '<p>A <b>prism</b> has two identical parallel bases joined by rectangles. A <b>pyramid</b> has one base, and its triangular faces meet at a point. Sort each clue.</p>',
        bins: ['Prism', 'Pyramid'],
        items,
        hints: [
          'Prisms have two bases and rectangular sides. Pyramids have one base and triangular sides that meet at a point.',
          'A rectangular prism has 6 faces, 12 edges, 8 vertices. A square pyramid has 5 faces, 8 edges, 5 vertices.',
          'Boxes and tents are prisms. Anything with an apex (a top point) is a pyramid.',
        ],
        hintEs: 'Los prismas tienen dos bases y caras laterales rectangulares. Las pirámides tienen una base y caras laterales triangulares que se juntan en un punto.',
        solution: `<p>Prism: ${listBin(items, 0)}. Pyramid: ${listBin(items, 1)}. Two matching bases joined by rectangles make a prism; one base with triangles meeting at the apex makes a pyramid.</p>`,
        feedback: {
          correct: 'Correct. Two bases and rectangular sides: prism. One base and triangles to a point: pyramid.',
          wrong: (ans, d) => {
            const bad = items[d.wrong && d.wrong[0]];
            if (bad && /triangular ends|2 triangles/.test(bad.html)) return 'Having triangles does not make it a pyramid. A tent has two triangle bases joined by rectangles, so it is a prism.';
            return 'Does the clue describe two matching bases (prism) or faces that meet at one point (pyramid)?';
          },
        },
      };
    }
    const clues = {
      rect: ['6 rectangular faces', '12 edges and 8 vertices', 'the net is 6 rectangles in 3 matching pairs', 'V = l × w × h'],
      tri: ['2 triangular faces and 3 rectangular faces', '9 edges and 6 vertices', 'the net has 3 rectangles between 2 triangles'],
      pyr: ['1 square face and 4 triangular faces', '8 edges and 5 vertices', 'the net is a square with 4 triangles around it', 'the triangles meet at an apex'],
    };
    const items = r.shuffle(
      r
        .pickN(clues.rect, 2)
        .map((t) => ({ html: t, bin: 0 }))
        .concat(
          r.pickN(clues.tri, 2).map((t) => ({ html: t, bin: 1 })),
          r.pickN(clues.pyr, 2).map((t) => ({ html: t, bin: 2 })),
        ),
    );
    return {
      type: 'sort',
      skill: 'solids',
      lesson: '5-6',
      title: 'Which solid is described?',
      prompt: '<p>Each clue describes one solid. Sort the clues under the correct solid.</p>',
      bins: ['Rectangular prism', 'Triangular prism', 'Square pyramid'],
      items,
      hints: [
        'Think about the faces of each solid: all rectangles, triangles plus rectangles, or triangles plus one square.',
        'Rectangular prism: 6 faces, 12 edges, 8 vertices. Triangular prism: 5, 9, 6. Square pyramid: 5, 8, 5.',
        'Only the pyramid has an apex. Only the triangular prism has exactly 2 triangles.',
      ],
      hintEs: 'Piensa en las caras de cada cuerpo: todas rectángulos, triángulos y rectángulos, o triángulos y un cuadrado.',
      solution: `<p>Rectangular prism: ${listBin(items, 0)}. Triangular prism: ${listBin(items, 1)}. Square pyramid: ${listBin(items, 2)}.</p>`,
      feedback: {
        correct: 'Correct. The kinds of faces tell the solid apart.',
        wrong: (ans, d) => {
          const bad = items[d.wrong && d.wrong[0]];
          if (bad && /edges/.test(bad.html)) return `Check "${bad.html}". Rectangular prism: 12 edges, 8 vertices. Triangular prism: 9 and 6. Square pyramid: 8 and 5.`;
          return 'Count the triangles in each clue: none means rectangular prism, two means triangular prism, four means square pyramid.';
        },
      },
    };
  });

  G.define('g6_matchNet', (r, o) => {
    const hard = !!(o && o.hard);
    const keys = r.shuffle(hard ? ORDER.concat('tripyr') : ORDER.slice());
    const right = r.shuffle(keys.map((k, i) => i));
    const nets = keys.map((k) => {
      if (hard && k === 'rect') {
        const e = r.int(3, 4);
        return V.prismNet({ l: e + 1, w: e, h: e, width: 150, aria: `Net of a box: rectangles ${e + 1} by ${e} and ${e} by ${e}` });
      }
      return net(k, r, { width: 150, heightPx: 110 });
    });
    return {
      type: 'match',
      skill: 'nets',
      lesson: '5-6',
      title: 'Match the solid to its net',
      prompt: hard
        ? '<p>Match each solid to the net that folds into it. Two nets are almost the same, and two have only triangles, so check the <b>kinds</b>, the <b>number</b>, and the <b>sizes</b> of the faces.</p>'
        : '<p>Match each solid to the net that folds into it. Look at the <b>kinds</b> of faces and how many there are.</p>',
      left: keys.map((k) => cap(SOLIDS[k].name)),
      right: right.map((i, pos) => card(nets[i], 'Net ' + (pos + 1))),
      pairs: keys.map((k, i) => [i, right.indexOf(i)]),
      hints: [
        hard
          ? 'Count the triangles first: a square pyramid has 4 triangles and a square, a triangular pyramid has 4 triangles and nothing else, a triangular prism has 2.'
          : 'Count the triangles first: a square pyramid has 4, a triangular prism has 2, prisms with all rectangles have 0.',
        hard
          ? 'A cube net has 6 squares that are all exactly the same size. If some faces are a little longer, it is a rectangular prism.'
          : 'A cube net has 6 squares that are all the same size. A rectangular prism net has rectangles of three different sizes.',
        'Match the nets you are sure of first, then use the faces of the ones that are left.',
      ],
      hintEs: hard
        ? 'Cuenta primero los triángulos: una pirámide cuadrangular tiene 4 triángulos y un cuadrado, una pirámide triangular tiene solo 4 triángulos y un prisma triangular tiene 2.'
        : 'Cuenta primero los triángulos: una pirámide cuadrangular tiene 4, un prisma triangular tiene 2 y los prismas con solo rectángulos tienen 0.',
      solution: `<ul>${keys.map((k, i) => `<li>${cap(SOLIDS[k].name)} → <b>Net ${right.indexOf(i) + 1}</b> (${SOLIDS[k].faces})</li>`).join('')}</ul><p>The faces in a net are exactly the faces of the solid, so the kinds and sizes of faces decide the match.</p>`,
      feedback: {
        correct: 'Correct. The faces in a net are exactly the faces of the solid.',
        wrong(ans, d) {
          const bad = d.wrong && d.wrong.map((i) => keys[i]);
          if (bad && bad.includes('cube') && bad.includes('rect'))
            return 'You switched the cube and the rectangular prism. A cube net has 6 identical squares; the box net has some longer rectangles.';
          if (bad && bad.includes('pyr') && bad.includes('tripyr'))
            return 'You switched the two pyramids. The square pyramid net has a square in the middle; the triangular pyramid net is only triangles.';
          if (bad && bad.length) return `Check the ${SOLIDS[bad[0]].name}: its net must show ${SOLIDS[bad[0]].faces}.`;
          return 'Count the triangles and squares in each net.';
        },
      },
    };
  });
})(typeof window !== 'undefined' ? window : globalThis);

/* js/units/u5/gen-nets-2.js */
/* Zone 6 — The Gallery of Nets. Lesson 5-6 Represent Three-Dimensional Figures in Two Dimensions (drawing nets · reading nets and solids). */
(function (root) {
  'use strict';
  const RX = root.RX;
  const {
    G,
    V,
    shuffleOptions,
    NAMES,
    fmt,
    round,
    U5,
    hl,
    sq,
    C,
    SOLIDS,
    ORDER,
    BASE,
    ADJ,
    nSolid,
    HARD_SOLIDS,
    RIGHT,
    tetraNet,
    twoTopsNet,
    sameEndTriNet,
    net,
    solidPic,
    card,
    whyOf,
    esFaces,
    cap,
    fevWhy,
  } = RX._lib['u5/gen-nets'];

  G.define('g6_whichSolid', (r, o) => {
    const hard = !!(o && o.hard);
    const pool = hard ? ORDER.concat('tripyr') : ORDER;
    const key = r.pick(hard ? ['tripyr', 'pyr', 'tri', 'rect', 'tripyr'] : ORDER);
    const S = SOLIDS[key];
    const others = pool.filter((k) => k !== key);
    const whyFor = {
      rect: 'A rectangular prism needs 6 rectangles.',
      cube: 'A cube needs 6 squares that are all the same size.',
      tri: 'A triangular prism needs exactly 2 triangles and 3 rectangles.',
      pyr: 'A square pyramid needs 1 square and 4 triangles.',
      tripyr: 'A triangular pyramid needs 4 triangles and nothing else.',
    };
    const opts = [{ html: cap(S.name), ok: true }].concat(others.map((k) => ({ html: cap(SOLIDS[k].name), why: `${whyFor[k]} This net has ${S.faces}.` })));
    const sh = shuffleOptions(r, opts, 0);
    return {
      type: 'mc',
      skill: 'nets',
      lesson: '5-6',
      title: 'Fold it back',
      prompt: `<p>Imagine folding this net along its edges.</p>${net(key, r, { width: 260, heightPx: 170 })}<p>Which solid does it make?</p>`,
      options: sh.options,
      answer: sh.answer,
      hints: [
        'Count each kind of shape in the net: how many triangles, how many rectangles or squares?',
        `This net has ${S.faces}.`,
        'Now find the solid whose faces are exactly those shapes, no more and no fewer.',
      ],
      hintEs: 'Cuenta cada tipo de figura en la red (plantilla): ¿cuántos triángulos y cuántos rectángulos o cuadrados hay?',
      solution: `<p>The net has ${S.faces}, which are exactly the faces of a <b>${S.name}</b>, like ${S.example}. ${
        key === 'cube'
          ? 'Because every face is the same square, the box is a cube.'
          : key === 'rect'
            ? 'The rectangles come in three matching pairs: top and bottom, front and back, left and right.'
            : key === 'tri'
              ? 'The two triangles become the ends, and the three rectangles wrap around them.'
              : key === 'tripyr'
                ? 'One triangle is the base, and the other three fold up to meet at the apex.'
                : 'The square is the base, and the four triangles fold up to meet at the apex.'
      }</p>`,
      feedback: { correct: `Correct. ${S.faces} make a ${S.name}.`, wrong: whyOf(sh.options, 'Count the triangles and rectangles in the net, then match them to a solid.') },
    };
  });

  G.define('g6_netFaces', (r, o) => {
    const hard = !!(o && o.hard);
    const l = r.int(3, 9),
      w = r.int(2, Math.min(6, l)),
      h = hard ? r.int(2, 7) + 0.5 : r.int(2, 8);
    const u = r.pick(U5.UNITS);
    if (r.chance(0.6)) {
      const face = r.pick([
        { name: 'front', dims: [l, h], desc: 'length by height' },
        { name: 'top', dims: hard ? [w, h] : [l, w], desc: hard ? 'width by height' : 'length by width', hardName: 'side' },
        { name: 'side', dims: [w, h], desc: 'width by height' },
      ]);
      if (hard && face.hardName) face.name = face.hardName;
      const A = round(face.dims[0] * face.dims[1], 2);
      const H = U5.mixed(h);
      const svg = V.prismNet({
        l,
        w,
        h,
        faceLabels: true,
        width: 300,
        labels: { l: `${l} ${u}`, w: `${w} ${u}`, h: `${H} ${u}` },
        aria: `Net of a rectangular prism with length ${l} ${u}, width ${w} ${u}, height ${H} ${u}, faces labeled`,
      });
      const pair = face.name === 'side' ? 'other side' : face.name === 'top' ? 'bottom' : 'back';
      return {
        type: 'num',
        skill: 'nets',
        lesson: '5-6',
        title: 'Read the net',
        prompt: `<p>This net folds into a rectangular prism that is ${hl(l + ' ' + u)} long, ${hl(w + ' ' + u)} wide, and ${hl(H + ' ' + u)} tall. The faces are labeled.</p>${svg}<p>What is the area of ${hard ? `the <b>${face.name}</b> face and its matching <b>${pair}</b> face together` : `the <b>${face.name}</b> face`}?</p>`,
        unit: sq(u),
        answer: hard ? round(2 * A, 2) : A,
        hints: [
          `Find the face labeled "${face.name}" in the net. Which two edges of the prism are its sides?`,
          `The ${face.name} face is ${face.desc}: ${fmt(face.dims[0])} ${u} by ${fmt(face.dims[1])} ${u}.${hard ? ` The ${pair} face is the same size.` : ''}`,
          hard ? `One face: ${fmt(face.dims[0])} × ${fmt(face.dims[1])} = ${fmt(A)}. Now double it for the pair.` : `${face.dims[0]} × ${face.dims[1]}.`,
        ],
        hintEs: `Busca en la red (plantilla) la cara rotulada "${face.name}" (${{ front: 'frente', top: 'arriba', side: 'lado' }[face.name]}). ¿Qué dos aristas del prisma son sus lados?`,
        solution: `<p>The ${face.name} face is a ${fmt(face.dims[0])} by ${fmt(face.dims[1])} rectangle (${face.desc}). Area = ${fmt(face.dims[0])} × ${fmt(face.dims[1])} = ${hard ? fmt(A) : `<b>${A} ${sq(u)}</b>`} ${hard ? sq(u) : ''}. The ${pair} face is identical, because the faces of a rectangular prism come in matching pairs.${hard ? ` Together: 2 × ${fmt(A)} = <b>${fmt(2 * A)} ${sq(u)}</b>.` : ''}</p>`,
        feedback: {
          correct: hard ? `Correct. Two matching faces: 2 × ${fmt(A)} = ${fmt(2 * A)} ${sq(u)}.` : `Correct. The ${face.name} face is ${face.dims[0]} × ${face.dims[1]} = ${A} ${sq(u)}.`,
          wrong(ans, d) {
            const v = d.value;
            if (v == null) return `Multiply the two edges of the ${face.name} face.`;
            if (Math.abs(v - l * w * h) < 0.01) return 'That is the volume (all three edges). One face is flat: multiply only its two edges.';
            if (hard && Math.abs(v - A) < 0.01) return `That is one ${face.name} face. The question asks for the ${face.name} face and the ${pair} face together.`;
            if (!hard && Math.abs(v - 2 * A) < 0.01) return `${2 * A} is two faces. The question asks for one ${face.name} face.`;
            if (hard && Math.abs(v - 2 * face.dims[0] * Math.floor(h)) < 0.01) return `You dropped the ½ from the height ${H}. Use ${fmt(h)} when you multiply.`;
            const all = [l * h, l * w, w * h];
            if (all.some((x) => Math.abs(v - x) < 0.01 || Math.abs(v - 2 * x) < 0.01)) return `That is the area of a different face. The ${face.name} face is ${face.desc}.`;
            return `Find the two edges of the ${face.name} face in the net and multiply them${hard ? ', then double for the matching face' : ''}.`;
          },
        },
      };
    }
    const what = r.pick(['edges', 'vertices']);
    if (hard) {
      const S = r.pick(HARD_SOLIDS);
      const ans = what === 'edges' ? S.E : S.V;
      return {
        type: 'num',
        skill: 'solids',
        lesson: '5-6',
        title: `Count the ${what}`,
        prompt: `<p>A net is made of <b>${S.faces}</b>. It folds into a ${S.name}.</p><p>After it is folded, how many <b>${what}</b> does the solid have? ${what === 'edges' ? 'An edge is a segment where two faces meet.' : 'A vertex is a corner where edges meet.'}</p>`,
        answer: ans,
        hints: [
          `Picture the folded ${S.name}. ${S.kind === 'prism' ? 'It has two matching bases joined by rectangles.' : 'It has one base, and the triangles meet at the apex.'}`,
          what === 'edges'
            ? `Count the edges around ${S.kind === 'prism' ? 'each base' : 'the base'}, then the edges ${S.kind === 'prism' ? 'joining the two bases' : 'rising to the apex'}. The base has ${S.n} sides.`
            : `Count the corners of ${S.kind === 'prism' ? 'each base' : 'the base'}${S.kind === 'prism' ? '' : ', then add the apex'}. The base has ${S.n} corners.`,
          what === 'edges' ? (S.kind === 'prism' ? `Add ${S.n} + ${S.n} + ${S.n}.` : `Add ${S.n} + ${S.n}.`) : S.kind === 'prism' ? `Add ${S.n} + ${S.n}.` : `Add ${S.n} + 1.`,
        ],
        hintEs:
          S.kind === 'prism'
            ? 'Imagina el prisma ya doblado. Tiene dos bases iguales unidas por rectángulos.'
            : 'Imagina la pirámide ya doblada. Tiene una base, y los triángulos se juntan en el vértice de arriba.',
        solution: `<p>A ${S.name} has <b>${ans} ${what}</b>. ${S.why} The net shows more separate segments than that, because edges of the net join together when it is folded.</p>`,
        feedback: {
          correct: `Correct. A ${S.name} has ${S.F} faces, ${S.E} edges, and ${S.V} vertices.`,
          wrong(ans2, d) {
            const v = d.value;
            if (v === S.F) return `${S.F} is the number of faces. Count ${what} instead.`;
            if (v === (what === 'edges' ? S.V : S.E)) return `${v} is the number of ${what === 'edges' ? 'vertices (corners)' : 'edges (segments)'}. The question asks for ${what}.`;
            if (what === 'vertices' && S.kind === 'pyramid' && v === S.n) return 'You counted the base corners but missed the apex, the top point where the triangles meet.';
            if (what === 'edges' && S.kind === 'prism' && v === 2 * S.n) return 'You counted the edges around both bases but missed the edges that join the two bases.';
            return `Count by parts: the edges or corners of the base first, then the rest. The base has ${S.n} sides.`;
          },
        },
      };
    }
    const key = r.pick(['rect', 'tri', 'pyr']);
    const S = SOLIDS[key];
    const ans = what === 'edges' ? S.E : S.V;
    return {
      type: 'num',
      skill: 'solids',
      lesson: '5-6',
      title: `Count the ${what}`,
      prompt: `<p>This net folds into a ${S.name}.</p>${net(key, r, { width: 260, heightPx: 170 })}<p>After it is folded, how many <b>${what}</b> does the solid have? ${what === 'edges' ? 'An edge is a segment where two faces meet.' : 'A vertex is a corner where edges meet.'}</p>`,
      answer: ans,
      hints: [
        `Picture the folded ${S.name}. It has ${S.faces}.`,
        what === 'edges'
          ? 'Count edges around the base, then the edges going up. Hidden edges at the back still count.'
          : 'Count corners on the bottom, then corners on top. The apex of a pyramid is one vertex.',
        `Add the ${what} on the bottom to the ${what} ${key === 'pyr' ? 'that lead to the top' : 'above it'}.`,
      ],
      hintEs: `Imagina el cuerpo geométrico ya doblado (${S.es}). Tiene ${esFaces(key)}.`,
      solution: `<p>A ${S.name} has <b>${ans} ${what}</b>. ${fevWhy(S)} The folded solid has fewer edges than the net shows as separate segments because edges of the net join together when folded.</p>`,
      feedback: {
        correct: `Correct. A ${S.name} has ${S.F} faces, ${S.E} edges, and ${S.V} vertices.`,
        wrong(ans2, d) {
          const v = d.value;
          if (v === S.F) return `${S.F} is the number of faces. Count ${what} instead.`;
          if (v === (what === 'edges' ? S.V : S.E)) return `${v} is the number of ${what === 'edges' ? 'vertices (corners)' : 'edges (segments)'}. The question asks for ${what}.`;
          if (key === 'pyr' && what === 'vertices' && v === 4) return 'You counted the 4 base corners but missed the apex, the top point.';
          return what === 'edges'
            ? 'Count the edges around the base, then the edges going up. Each edge is shared by two faces, so count it once.'
            : 'Count the corners on the bottom, then the corners on top.';
        },
      },
    };
  });

  G.define('g6_tfNet', (r, o) => {
    const hard = !!(o && o.hard);
    const pool = hard
      ? [
          {
            stmt: 'A pentagonal prism has 15 edges.',
            answer: true,
            reasons: [
              { html: 'Each pentagon base has 5 edges, and 5 more edges join the two bases: 5 + 5 + 5 = 15.', correct: true },
              { html: 'A prism always has 12 edges, like a box.' },
              { html: 'A pentagonal prism has 10 edges, 5 on each base.' },
            ],
          },
          {
            stmt: 'Every pyramid has the same number of faces as vertices.',
            answer: true,
            reasons: [
              { html: 'A pyramid with an n-sided base has n triangles plus the base (n + 1 faces) and n base corners plus the apex (n + 1 vertices).', correct: true },
              { html: 'Only a square pyramid works: 5 faces and 5 vertices. Other pyramids do not match.' },
              { html: 'Faces and vertices are the same thing on a pyramid, so the counts must match.' },
            ],
          },
          {
            stmt: 'A net made of 4 triangles and nothing else can fold into a closed solid.',
            answer: true,
            reasons: [
              { html: 'Four triangles fold into a triangular pyramid: one triangle is the base and the other three meet at the apex.', correct: true },
              { html: 'Every solid needs at least one rectangle or square for its base.' },
              { html: 'Four triangles fold into a square pyramid.' },
            ],
          },
          {
            stmt: 'A hexagonal pyramid has 12 vertices.',
            answer: false,
            reasons: [
              { html: 'It has 6 base corners plus the apex: 7 vertices. The number 12 is its edge count (6 around the base and 6 up to the apex).', correct: true },
              { html: 'It has 6 vertices, one for each side of the hexagon.' },
              { html: 'It has 14 vertices: 6 on the base, 6 on the triangles, and 2 at the top.' },
            ],
          },
          {
            stmt: 'A net with 2 triangles and 2 rectangles folds into a triangular prism.',
            answer: false,
            reasons: [
              { html: 'Each side of the triangle needs its own rectangle, so a triangular prism has 3 rectangles. With only 2, one side stays open.', correct: true },
              { html: 'A triangular prism has 2 triangles and 2 rectangles, so the net works.' },
              { html: 'It folds into a triangular pyramid instead.' },
            ],
          },
          {
            stmt: 'Two different-looking nets can fold into the same cube.',
            answer: true,
            reasons: [
              { html: 'Six squares can be arranged in many ways that still fold closed. A cube has 11 different nets.', correct: true },
              { html: 'Each solid has exactly one net, so the nets must look the same.' },
              { html: 'Only nets in the shape of a cross can fold into a cube.' },
            ],
          },
        ]
      : [
          {
            stmt: 'Every net of a rectangular prism has exactly 6 rectangles.',
            answer: true,
            reasons: [
              { html: 'A net shows every face of the solid exactly once, and a rectangular prism has 6 rectangular faces.', correct: true },
              { html: 'A net can have any number of rectangles as long as it folds.' },
              { html: 'Nets of a rectangular prism have 4 rectangles; the top and bottom are added later.' },
            ],
          },
          {
            stmt: 'Any arrangement of 6 rectangles is a net of a rectangular prism.',
            answer: false,
            reasons: [
              { html: 'The rectangles must be arranged so that each folds into a different face with no overlaps. A 2 by 3 block of rectangles has 6 faces but does not close up.', correct: true },
              { html: 'A net needs at least 8 rectangles.' },
              { html: 'A rectangular prism net must include triangles for the corners.' },
            ],
          },
          {
            stmt: 'A net of a square pyramid has 1 square and 4 triangles.',
            answer: true,
            reasons: [
              { html: 'A square pyramid has a square base and 4 triangular faces that meet at the apex. The net shows each of those 5 faces once.', correct: true },
              { html: 'A square pyramid has 4 squares and 1 triangle.' },
              { html: 'A square pyramid net has 5 triangles, one for each face.' },
            ],
          },
          {
            stmt: 'A triangular prism has 3 triangular faces.',
            answer: false,
            reasons: [
              { html: 'A triangular prism has 2 triangular faces (the two ends) and 3 rectangular faces joining them. The "3" in its description counts the rectangles.', correct: true },
              { html: 'A triangular prism has 4 triangular faces.' },
              { html: 'A triangular prism has no triangular faces; it is named for its shape from the side.' },
            ],
          },
          {
            stmt: 'A cube and a rectangular prism have the same number of faces, edges, and vertices.',
            answer: true,
            reasons: [
              { html: 'A cube is a rectangular prism whose faces are all squares. Both have 6 faces, 12 edges, and 8 vertices.', correct: true },
              { html: 'A cube has fewer edges because its faces are all the same.' },
              { html: 'A cube has 8 faces, one for each corner.' },
            ],
          },
          {
            stmt: 'When a net is folded into a solid, two edges of the net can join to make one edge of the solid.',
            answer: true,
            reasons: [
              { html: 'Folding brings separate edges of the net together. A rectangular prism net shows 14 outside segments, but the folded box has only 12 edges.', correct: true },
              { html: 'Every segment on a net stays a separate edge after folding.' },
              { html: 'Folding a net doubles the number of edges.' },
            ],
          },
        ];
    const v = r.pick(pool);
    const reasons = r.shuffle(v.reasons);
    return {
      type: 'tf',
      skill: 'nets',
      lesson: '5-6',
      title: 'True or false?',
      prompt: `<p>Decide whether the statement is true or false, then choose the best reason.</p><p class="stmt"><b>${v.stmt}</b></p>`,
      answer: v.answer,
      reasons,
      hints: [
        hard
          ? 'Picture the solid. Count its faces, edges, and vertices one part at a time: the base first, then the rest.'
          : 'Picture the solid. Count its faces and think about what a net must show.',
        hard
          ? 'Base with n sides. Prism: n + 2 faces, 3n edges, 2n vertices. Pyramid: n + 1 faces, 2n edges, n + 1 vertices.'
          : 'A net shows every face once. Rectangular prism: 6 rectangles. Triangular prism: 2 triangles + 3 rectangles. Square pyramid: 1 square + 4 triangles.',
        'Compare your count with the number in the statement. Then choose the reason that explains the count.',
      ],
      hintEs: hard
        ? 'Imagina el cuerpo geométrico. Cuenta sus caras, aristas y vértices por partes: primero la base y después lo demás.'
        : 'Imagina el cuerpo geométrico. Cuenta sus caras y piensa en lo que debe mostrar una red (plantilla).',
      solution: `<p><b>${v.answer ? 'True' : 'False'}.</b> ${reasons.find((x) => x.correct).html}</p>`,
      feedback: {
        correct: 'Correct. A net shows each face of the solid exactly once, arranged so it folds with no overlaps.',
        wrong(ans, d) {
          if (!d.valueOk)
            return v.answer
              ? 'The statement is actually true. Count the faces, edges, or vertices yourself and compare.'
              : 'Look again: count the parts of the solid yourself. Your count will not match the statement.';
          return 'Your true/false is right. Choose the reason that describes the faces, edges, or vertices correctly.';
        },
      },
    };
  });

  G.define('g6_whoNet', (r, o) => {
    const hard = !!(o && o.hard);
    const [n1, n2, n3] = r.pickN(NAMES, 3);
    const line = (F, E, Vv) => `${F} faces, ${E} edges, ${Vv} vertices`;
    let S, wrongs, pic, why;
    if (hard) {
      S = r.pick(HARD_SOLIDS);
      const n = S.n;
      pic = `<p class="stmt">${cap(S.name)}: ${S.faces}.</p>`;
      why = S.why;
      wrongs =
        S.kind === 'prism'
          ? [
              { html: line(S.F, 2 * n, S.V), why: `${n2} counted only the edges around the two bases (${2 * n}). The ${n} edges joining the bases count too.` },
              { html: line(S.F, S.V, S.E), why: `${n3} swapped edges and vertices. There are ${S.E} edges (segments) and ${S.V} corners.` },
            ]
          : [
              { html: line(S.F, S.E, n), why: `${n2} forgot the apex. ${n} base corners plus the top point make ${S.V} vertices.` },
              { html: line(n, S.E, S.V), why: `${n3} counted only the triangles. The base is a face too: ${S.F} faces.` },
            ];
    } else {
      const key = r.pick(['tri', 'pyr', 'rect']);
      S = SOLIDS[key];
      pic = solidPic(key, r, { width: 220, height: 150 });
      why = fevWhy(S);
      if (key === 'tri') {
        wrongs = [
          { html: line(6, 9, 6), why: `${n2} counted 6 faces, perhaps counting a triangle twice. A triangular prism has 2 triangles and 3 rectangles: 5 faces.` },
          { html: line(5, 6, 9), why: `${n3} swapped edges and vertices. There are 9 edges (3 on each triangle plus 3 joining them) and 6 corners.` },
        ];
      } else if (key === 'pyr') {
        wrongs = [
          { html: line(4, 8, 5), why: `${n2} forgot the base. The 4 triangles plus the square base make 5 faces.` },
          { html: line(5, 8, 4), why: `${n3} forgot the apex, the top point where the triangles meet. 4 base corners plus the apex make 5 vertices.` },
        ];
      } else {
        wrongs = [
          { html: line(6, 8, 12), why: `${n2} swapped edges and vertices. A box has 12 edges and 8 corners.` },
          { html: line(4, 12, 8), why: `${n3} counted only the 4 side faces. The top and bottom are faces too: 6 faces.` },
        ];
      }
    }
    const sh = shuffleOptions(r, [{ title: n1, html: line(S.F, S.E, S.V), ok: true }, Object.assign({ title: n2 }, wrongs[0]), Object.assign({ title: n3 }, wrongs[1])], 0);
    return {
      type: 'who',
      skill: 'solids',
      lesson: '5-6',
      title: 'Who counted correctly?',
      prompt: `<p>Three students count the faces, edges, and vertices of a ${S.name}.</p>${pic}<p>Who is correct?</p>`,
      options: sh.options,
      answer: sh.answer,
      layout: 'cards',
      hints: [
        `Start with faces: a ${S.name} has ${S.faces}. That rules out any count with the wrong number of faces.`,
        hard ? `The base has ${S.n} sides. Count the edges and corners of the base first, then the rest.` : why,
        'Check the edges and the vertices of each remaining answer. Only one student has all three counts right.',
      ],
      hintEs: hard
        ? `Empieza por las caras: este cuerpo tiene ${S.F} caras. Así descartas cualquier conteo con otro número de caras.`
        : `Empieza por las caras: este cuerpo (${S.es}) tiene ${esFaces(S.key)}. Así descartas cualquier conteo con otro número de caras.`,
      solution: `<p><b>${n1}</b> is correct: a ${S.name} has ${S.F} faces, ${S.E} edges, and ${S.V} vertices. ${why} ${wrongs.map((w) => w.why).join(' ')}</p>`,
      feedback: { correct: `Correct. ${S.F} faces, ${S.E} edges, ${S.V} vertices.`, wrong: whyOf(sh.options, 'Count the faces first, then the edges and vertices of the base and the rest.') },
    };
  });
})(typeof window !== 'undefined' ? window : globalThis);

/* js/units/u5/gen-surface-prism.js */
/* Zone 7 — The Cladding Workshop. Lesson 5-7 Determine Surface Area of Prisms (rectangular · triangular). */
(function (root) {
  'use strict';
  const RX = root.RX;
  const { G, V, shuffleOptions, NAMES, round, parseNum, U5 } = RX;
  const hl = V.hl;
  const sq = U5.sq,
    cu = U5.cu;
  const near = (a, b) => a != null && Math.abs(a - b) < 0.01;

  const BOXES = ['gift box', 'shipping crate', 'storage chest', 'speaker cabinet', 'toy box', 'planter', 'cooler', 'display case'];
  const WEDGES = ['tent', 'doorstop', 'wedge of cheese', 'ramp', 'roof section', 'chocolate bar box', 'camping shelter'];

  /** Rectangular prism. o.hard: bigger edges and (unless o.half === false) one edge that ends in a half unit. */
  function box(r, o) {
    o = o || {};
    const hard = !!o.hard;
    const hi = hard ? 12 : 8;
    let l = r.int(3, hi),
      w = r.int(2, Math.min(l, hi - 1)),
      h = r.int(2, hi);
    if (hard && o.half !== false) {
      const k = r.int(0, 2);
      if (k === 0) l += 0.5;
      else if (k === 1) w += 0.5;
      else h += 0.5;
    }
    const u = r.pick(U5.UNITS);
    const lw = round(l * w, 2),
      lh = round(l * h, 2),
      wh = round(w * h, 2);
    return { l, w, h, u, lw, lh, wh, SA: round(2 * (lw + lh + wh), 2), V: round(l * w * h, 2), half: hard && o.half !== false };
  }
  function boxSvg(b, extra) {
    return V.prism(
      Object.assign(
        { l: b.l, w: b.w, h: b.h, labels: { l: `${b.l} ${b.u}`, w: `${b.w} ${b.u}`, h: `${b.h} ${b.u}` }, aria: `Rectangular prism ${b.l} ${b.u} long, ${b.w} ${b.u} wide, ${b.h} ${b.u} tall` },
        extra || {},
      ),
    );
  }
  function netSvg(b, extra) {
    return V.prismNet(
      Object.assign(
        {
          l: b.l,
          w: b.w,
          h: b.h,
          faceLabels: true,
          width: 300,
          labels: { l: `${b.l} ${b.u}`, w: `${b.w} ${b.u}`, h: `${b.h} ${b.u}` },
          aria: `Net of the prism: six rectangles labeled top, bottom, front, back, and two sides`,
        },
        extra || {},
      ),
    );
  }
  function coachBox(b, v) {
    if (v == null) return 'Surface area = the total area of all six faces. Find the three different faces, double each, and add.';
    if (near(v, b.V)) return `${b.V} is the volume (l × w × h), the space inside. Surface area covers the outside: add the areas of the six faces.`;
    if (near(v, b.lw + b.lh + b.wh)) return `${round(b.lw + b.lh + b.wh, 2)} counts only three faces. Each face has a matching partner on the opposite side, so double it.`;
    if (near(v, 2 * (b.lw + b.lh)) || near(v, 2 * (b.lw + b.wh)) || near(v, 2 * (b.lh + b.wh)))
      return 'You left out one pair of faces. There are three pairs: top/bottom, front/back, and the two sides.';
    if (near(v, 2 * b.lw + 2 * b.lh + b.wh) || near(v, 2 * b.lw + b.lh + 2 * b.wh) || near(v, b.lw + 2 * b.lh + 2 * b.wh))
      return 'Five faces are counted. One face is missing its twin: every face area must be doubled.';
    if (near(v, 4 * (b.l + b.w + b.h))) return 'That adds up edge lengths. Surface area adds face areas (length × width for each face).';
    return 'Find the three different faces (l × w, l × h, w × h). Double each one for its twin, then add the three doubled areas.';
  }

  // Triangular prisms. iso: base b, height h, equal sides s (b/2, h, s is a Pythagorean triple). right: legs b, h, hypotenuse s.
  const ISO = [
    [6, 4, 5],
    [8, 3, 5],
    [12, 8, 10],
    [16, 6, 10],
    [10, 12, 13],
  ];
  const RIGHT = [
    [3, 4, 5],
    [6, 8, 10],
    [5, 12, 13],
  ];
  /** hard: every triangle measure × 1.5 (half units) and a prism length that ends in .5. */
  function wedge(r, hard) {
    const right = r.chance(0.5);
    const k = hard ? 1.5 : 1;
    const [b, h, s] = r.pick(right ? RIGHT : ISO).map((x) => x * k);
    const L = hard ? r.int(4, 10) + 0.5 : r.int(4, 12);
    const u = r.pick(U5.UNITS);
    const s1 = right ? h : s,
      s2 = s; // the two non-base sides of the triangle
    const tri = round((b * h) / 2, 2);
    const rb = round(L * b, 2),
      r1 = round(L * s1, 2),
      r2 = round(L * s2, 2);
    const rects = round(rb + r1 + r2, 2);
    return { right, b, h, s, s1, s2, L, u, tri, rb, r1, r2, rects, per: round(b + s1 + s2, 2), SA: round(2 * tri + rects, 2), V: round(tri * L, 2), hard };
  }
  function wedgeSvg(t, extra) {
    const lb = { b: `${t.b} ${t.u}`, h: `${t.h} ${t.u}`, len: `${t.L} ${t.u}`, s1: `${t.s} ${t.u}` };
    if (!t.right) lb.s2 = `${t.s} ${t.u}`;
    return V.triPrism(
      Object.assign(
        {
          b: t.b,
          h: t.h,
          len: t.L,
          right: t.right,
          labels: lb,
          width: 300,
          aria: `Triangular prism ${t.L} ${t.u} long. Each triangular end has base ${t.b} ${t.u}, height ${t.h} ${t.u}, and ${t.right ? 'hypotenuse' : 'two equal sides of'} ${t.s} ${t.u}`,
        },
        extra || {},
      ),
    );
  }
  function sidesText(t) {
    return t.right ? `${t.b} ${t.u}, ${t.h} ${t.u}, and ${t.s} ${t.u}` : `${t.b} ${t.u}, ${t.s} ${t.u}, and ${t.s} ${t.u}`;
  }
  function coachWedge(t, v) {
    if (v == null) return 'Surface area = 2 triangles + 3 rectangles. Each rectangle is the prism length times one side of the triangle.';
    if (near(v, t.V)) return `${t.V} is the volume. Surface area adds the areas of the 5 faces.`;
    if (near(v, t.b * t.h + t.rects)) return `You used ${t.b} × ${t.h} for the two triangles without the ½. Together the two triangles are 2 × ½ × ${t.b} × ${t.h}.`;
    if (near(v, t.tri + t.rects)) return `You counted only one triangle. A triangular prism has two triangular ends.`;
    if (near(v, 2 * t.tri + 3 * t.rb)) return `The three rectangles are not all the same size. Each one is ${t.L} long but has a different width: ${sidesText(t)}.`;
    if (!t.right && near(v, t.b * t.s + t.rects)) return `You used the slanted side ${t.s} as the triangle's height. The height ${t.h} is the dashed segment, perpendicular to the base.`;
    if (near(v, 2 * t.tri + t.rb + t.r1) || near(v, 2 * t.tri + t.rb + t.r2) || near(v, 2 * t.tri + t.r1 + t.r2))
      return 'You left out one rectangle. There are three, one for each side of the triangle.';
    return 'Find the two triangles (½ × base × height each) and the three rectangles (length × each side of the triangle). Then add all five faces.';
  }

  // ---------- Surface area of a rectangular prism (num, honors hard) ----------
  G.define('g7_saPrism', (r, o) => {
    const hard = !!(o && o.hard);
    const b = box(r, { hard });
    const name = r.pick(NAMES),
      obj = r.pick(BOXES);
    const material = r.pick(['wrapping paper', 'sheet metal', 'fabric', 'paint', 'cardboard', 'copper sheeting']);
    return {
      type: 'num',
      skill: 'sa-rect-prism',
      lesson: '5-7',
      title: hard ? 'Seal of Surface: cover the box' : 'Surface area of a rectangular prism',
      xp: o.xp,
      prompt: `<p>${name} is covering every face of a ${obj} with ${material}. The ${obj} is ${hl(b.l + ' ' + b.u)} long, ${hl(b.w + ' ' + b.u)} wide, and ${hl(b.h + ' ' + b.u)} tall.</p>${hard ? boxSvg(b) : boxSvg(b, { width: 260, height: 190 }) + netSvg(b, { width: 280 })}<p>How much ${material} is needed? Find the surface area.</p>`,
      unit: sq(b.u),
      answer: b.SA,
      reference: true,
      hints: [
        'Surface area is the total area of all 6 faces. The faces come in 3 matching pairs: top and bottom, front and back, left and right.' +
          (hard ? ' One edge is a half unit, so multiply carefully.' : ''),
        `Top: ${b.l} × ${b.w} = ${b.lw}. Front: ${b.l} × ${b.h} = ${b.lh}. Side: ${b.w} × ${b.h} = ${b.wh}. Each has a twin.`,
        `2 × ${b.lw} + 2 × ${b.lh} + 2 × ${b.wh}.`,
      ],
      hintEs:
        'El área total (área de la superficie) es la suma de las áreas de las 6 caras. Las caras vienen en 3 pares iguales: arriba y abajo, frente y atrás, izquierda y derecha.' +
        (hard ? ' Una arista termina en media unidad (.5), así que multiplica con cuidado.' : ''),
      solution: `<p>Three pairs of faces: top and bottom 2 × (${b.l} × ${b.w}) = ${round(2 * b.lw, 2)}; front and back 2 × (${b.l} × ${b.h}) = ${round(2 * b.lh, 2)}; two sides 2 × (${b.w} × ${b.h}) = ${round(2 * b.wh, 2)}. SA = ${round(2 * b.lw, 2)} + ${round(2 * b.lh, 2)} + ${round(2 * b.wh, 2)} = <b>${b.SA} ${sq(b.u)}</b>. Unfolded, the box is six rectangles, and surface area is their total.</p>`,
      feedback: { correct: `Correct. ${round(2 * b.lw, 2)} + ${round(2 * b.lh, 2)} + ${round(2 * b.wh, 2)} = ${b.SA} ${sq(b.u)}.`, wrong: (ans, d) => coachBox(b, d.value) },
    };
  });

  // ---------- Table of face pairs from the net (table; hard: find each face too, half-unit edge) ----------
  G.define('g7_tableFaces', (r, o) => {
    const hard = !!(o && o.hard);
    const b = box(r, { hard });
    const name = r.pick(NAMES);
    const rows = hard
      ? [
          ['Faces', `Area of one face (${sq(b.u)})`, `Combined area (${sq(b.u)})`],
          ['Top and bottom', '__IN:tb1__', '__IN:tb__'],
          ['Front and back', '__IN:fb1__', '__IN:fb__'],
          ['Two sides', '__IN:lr1__', '__IN:lr__'],
          ['Surface area', 'sum of all six faces', '__IN:sa__'],
        ]
      : [
          ['Faces', 'Each face', `Combined area (${sq(b.u)})`],
          ['Top and bottom', `${b.l} × ${b.w}`, '__IN:tb__'],
          ['Front and back', `${b.l} × ${b.h}`, '__IN:fb__'],
          ['Two sides', `${b.w} × ${b.h}`, '__IN:lr__'],
          ['Surface area', 'sum of all six faces', '__IN:sa__'],
        ];
    const inputs = [
      { id: 'tb', answer: round(2 * b.lw, 2) },
      { id: 'fb', answer: round(2 * b.lh, 2) },
      { id: 'lr', answer: round(2 * b.wh, 2) },
      { id: 'sa', answer: b.SA },
    ];
    if (hard) inputs.unshift({ id: 'tb1', answer: b.lw }, { id: 'fb1', answer: b.lh }, { id: 'lr1', answer: b.wh });
    return {
      type: 'table',
      skill: 'sa-rect-prism',
      lesson: '5-7',
      title: 'Face-by-face table',
      prompt: `<p>${name} unfolds a ${b.l} ${b.u} by ${b.w} ${b.u} by ${b.h} ${b.u} box into this net.</p>${netSvg(b)}<p>Complete the table. ${hard ? 'First find the area of one face in each pair, then the combined area of both faces.' : 'Each row is a <b>pair</b> of matching faces, so give the combined area of both.'}</p>`,
      rows,
      header: true,
      inputs,
      reference: true,
      hints: [
        hard
          ? 'Decide which two edges make each face: top uses length and width, front uses length and height, a side uses width and height. Multiply, then double for the twin.'
          : 'For each row, find one face (multiply) and double it for its twin.',
        `Top: ${b.l} × ${b.w} = ${b.lw}, doubled is ${round(2 * b.lw, 2)}. Front: ${b.l} × ${b.h} = ${b.lh}, doubled is ${round(2 * b.lh, 2)}. Side: ${b.w} × ${b.h} = ${b.wh}, doubled is ${round(2 * b.wh, 2)}.`,
        `Surface area = ${round(2 * b.lw, 2)} + ${round(2 * b.lh, 2)} + ${round(2 * b.wh, 2)}.`,
      ],
      hintEs: hard
        ? 'Decide qué dos aristas forman cada cara: la de arriba usa el largo y el ancho, la del frente usa el largo y la altura, una cara lateral usa el ancho y la altura. Multiplica y luego duplica por su cara gemela.'
        : 'En cada fila, halla el área de una cara (multiplica) y duplícala por su cara gemela.',
      solution: `<p>Top and bottom: 2 × ${b.lw} = <b>${round(2 * b.lw, 2)}</b>. Front and back: 2 × ${b.lh} = <b>${round(2 * b.lh, 2)}</b>. Two sides: 2 × ${b.wh} = <b>${round(2 * b.wh, 2)}</b>. Surface area: <b>${b.SA}</b> ${sq(b.u)}. Grouping faces in pairs is why the formula is 2lw + 2lh + 2wh.</p>`,
      feedback: {
        correct: 'Correct. Three pairs of faces, doubled and added.',
        wrong(ans, d) {
          const tb = parseNum(ans.tb),
            sa = parseNum(ans.sa);
          if (near(tb, b.lw)) return `Each "combined" cell asks for both faces in the pair. One top face is ${b.lw}; add its twin, the bottom.`;
          if (near(sa, b.lw + b.lh + b.wh)) return 'Your surface area adds one face from each pair. Add the combined areas, which already include both twins.';
          if (near(sa, b.V)) return 'That surface area is the volume (l × w × h). Add the face areas instead.';
          if (hard && (d.wrong.includes('tb1') || d.wrong.includes('fb1') || d.wrong.includes('lr1')))
            return 'Check the one-face areas. Top uses length × width, front uses length × height, a side uses width × height. With a half-unit edge, multiply carefully.';
          if (d.wrong.length === 1 && d.wrong[0] === 'sa') return 'The pairs are right. Now add the three combined areas.';
          if (d.wrong.includes('fb')) return `Front and back: multiply ${b.l} × ${b.h}, then double.`;
          if (d.wrong.includes('lr')) return `Two sides: multiply ${b.w} × ${b.h}, then double.`;
          return 'Multiply the two edges of each face, then double for its twin.';
        },
      },
    };
  });

  // ---------- Fill the formula 2lw + 2lh + 2wh (blanks; hard: work backward from SA to the height) ----------
  G.define('g7_blanksFormula', (r, o) => {
    const hard = !!(o && o.hard);
    if (hard) {
      const b = box(r, { hard: true, half: false });
      const two = round(2 * b.lw, 2),
        lat = round(b.SA - two, 2),
        P = 2 * (b.l + b.w);
      const svg = V.prism({ l: b.l, w: b.w, h: b.h, labels: { l: `${b.l} ${b.u}`, w: `${b.w} ${b.u}`, h: '? ' + b.u }, width: 260, height: 190, aria: `Rectangular prism ${b.l} ${b.u} long and ${b.w} ${b.u} wide with an unknown height` });
      return {
        type: 'blanks',
        skill: 'sa-rect-prism',
        lesson: '5-7',
        title: 'Work backward to the height',
        prompt: `<p>A rectangular prism is ${hl(b.l + ' ' + b.u)} long and ${hl(b.w + ' ' + b.u)} wide. Its surface area is ${hl(b.SA + ' ' + sq(b.u))}. The height is missing.</p>${svg}<p>Use SA = 2(l × w) + 2(l × h) + 2(w × h) backward. Complete each step.</p>`,
        fields: [
          { label: 'top and bottom', answer: two },
          { label: 'four side faces', answer: lat },
          { label: 'perimeter of the base', answer: P },
          { label: 'height', answer: b.h },
        ],
        template: `Top and bottom together: {0} ${sq(b.u)}. The four side faces together: {1} ${sq(b.u)}. The side faces wrap around a base perimeter of {2} ${b.u}. Height: {3} ${b.u}.`,
        reference: true,
        hints: [
          'Work backward. Take the top and bottom away from the surface area. What is left covers the four side faces, which wrap all the way around the base.',
          `Top and bottom: 2 × ${b.l} × ${b.w} = ${two}. Side faces: ${b.SA} − ${two} = ${lat}. Base perimeter: 2 × (${b.l} + ${b.w}) = ${P}.`,
          `The side faces form one long rectangle, ${P} ${b.u} wide. Height = ${lat} ÷ ${P}.`,
        ],
        hintEs:
          'Trabaja hacia atrás. Quita la cara de arriba y la de abajo del área total. Lo que queda cubre las cuatro caras laterales, que rodean toda la base.',
        solution: `<p>Top and bottom: 2 × ${b.l} × ${b.w} = <b>${two}</b>. Side faces: ${b.SA} − ${two} = <b>${lat}</b>. Unrolled, the four side faces make one rectangle whose width is the base perimeter, 2 × (${b.l} + ${b.w}) = <b>${P}</b>, and whose height is the prism's height. Height = ${lat} ÷ ${P} = <b>${b.h}</b> ${b.u}.</p>`,
        feedback: {
          correct: 'Correct. Subtract the bases, then divide the side area by the base perimeter.',
          wrong(ans, d) {
            const a0 = parseNum(ans[0]),
              a1 = parseNum(ans[1]),
              a2 = parseNum(ans[2]),
              a3 = parseNum(ans[3]);
            if (near(a0, b.lw) || near(a1, b.SA - b.lw)) return 'There are two bases, a top and a bottom. Subtract both from the surface area.';
            if (near(a2, b.l + b.w) || near(a3, lat / (b.l + b.w))) return 'The side faces wrap the whole way around the base, so use the full perimeter: 2 × (length + width).';
            if (near(a3, b.SA / (b.l * b.w))) return 'Dividing the surface area by the base area works for volume, not surface area. Subtract the two bases first.';
            if (d.wrong.length === 1 && d.wrong[0] === 3) return 'The first three steps are right. Divide the side-face area by the base perimeter.';
            return 'Steps: double the base area, subtract it from SA, find the base perimeter, then divide.';
          },
        },
      };
    }
    const b = box(r);
    return {
      type: 'blanks',
      skill: 'sa-rect-prism',
      lesson: '5-7',
      title: 'Use the surface area formula',
      prompt: `<p>A rectangular prism is ${hl(b.l + ' ' + b.u)} long, ${hl(b.w + ' ' + b.u)} wide, and ${hl(b.h + ' ' + b.u)} tall.</p>${boxSvg(b, { width: 260, height: 190 })}<p>Complete the formula SA = 2(l × w) + 2(l × h) + 2(w × h).</p>`,
      fields: [
        { label: 'l × w', answer: b.lw },
        { label: 'l × h', answer: b.lh },
        { label: 'w × h', answer: b.wh },
        { label: 'surface area', answer: b.SA },
      ],
      template: `SA = 2 × {0} + 2 × {1} + 2 × {2} = {3} ${sq(b.u)}`,
      reference: true,
      hints: [
        'Each product in the formula is one face: l × w is the top, l × h is the front, w × h is a side. The 2s are for the matching faces.',
        `l × w = ${b.l} × ${b.w}. l × h = ${b.l} × ${b.h}. w × h = ${b.w} × ${b.h}.`,
        `2 × ${b.lw} + 2 × ${b.lh} + 2 × ${b.wh}.`,
      ],
      hintEs: 'Cada producto de la fórmula es una cara: l × w es la cara de arriba, l × h es el frente y w × h es una cara lateral. Los 2 son por las caras iguales.',
      solution: `<p>SA = 2 × <b>${b.lw}</b> + 2 × <b>${b.lh}</b> + 2 × <b>${b.wh}</b> = ${2 * b.lw} + ${2 * b.lh} + ${2 * b.wh} = <b>${b.SA}</b> ${sq(b.u)}. Each product is the area of one face; the 2 covers the identical face on the opposite side.</p>`,
      feedback: {
        correct: 'Correct. Three face areas, each doubled, then added.',
        wrong(ans, d) {
          const a0 = parseNum(ans[0]),
            a3 = parseNum(ans[3]);
          if (d.wrong.length === 1 && d.wrong[0] === 3) {
            if (near(a3, b.lw + b.lh + b.wh)) return 'You added the three faces once each. The formula doubles each one first.';
            if (near(a3, b.V)) return 'That total is the volume, l × w × h. Surface area doubles each face and adds.';
            return 'The three faces are right. Double each and add.';
          }
          if (near(a0, 2 * b.lw)) return 'Write just one face in each blank; the 2 in the formula does the doubling for you.';
          return 'Match each pair of letters to the edges: l is the length, w is the width, h is the height. Multiply the two edges in each blank.';
        },
      },
    };
  });

  // ---------- Error: three faces only, volume, or (hard) a subtler slip (error) ----------
  G.define('g7_errorThree', (r, o) => {
    const hard = !!(o && o.hard);
    const b = box(r, { hard });
    const name = r.pick(NAMES);
    const variant = hard ? r.pick(['onePair', 'repeat']) : r.pick(['three', 'volume']);
    let work, opts, hint2;
    if (variant === 'three') {
      const wrong = round(b.lw + b.lh + b.wh, 2);
      work = `SA = (${b.l} × ${b.w}) + (${b.l} × ${b.h}) + (${b.w} × ${b.h})<br>SA = ${b.lw} + ${b.lh} + ${b.wh}<br>SA = ${wrong} ${sq(b.u)}`;
      opts = [
        { html: `${name} found only three faces. Each face has an identical twin on the opposite side, so each area must be doubled.`, ok: true },
        {
          html: `${name} should have multiplied the three areas instead of adding.`,
          why: 'Surface area adds face areas. Multiplying them has no meaning here. The real problem is the missing faces.',
        },
        {
          html: `${name} used the wrong edges for the faces.`,
          why: `The three products are right: ${b.l} × ${b.w}, ${b.l} × ${b.h}, ${b.w} × ${b.h} are the three different faces. They just each need a partner.`,
        },
        { html: `${name}'s work is correct.`, why: `A box has 6 faces, not 3. ${wrong} is only half the surface area.` },
      ];
      hint2 = `The work has 3 face areas. A box has 6 faces in 3 pairs. Double each: 2 × ${b.lw}, 2 × ${b.lh}, 2 × ${b.wh}.`;
    } else if (variant === 'volume') {
      work = `SA = l × w × h<br>SA = ${b.l} × ${b.w} × ${b.h}<br>SA = ${b.V} ${cu(b.u)}`;
      opts = [
        { html: `${name} found the volume (l × w × h), the space inside. Surface area is the total area of the six faces.`, ok: true },
        { html: `${name} should have doubled the answer: 2 × ${b.V}.`, why: 'Doubling a volume does not make a surface area. The formula itself is wrong: surface area adds face areas.' },
        { html: `${name} multiplied in the wrong order.`, why: 'Order does not matter for multiplying. The problem is that l × w × h is the volume formula, not the surface area formula.' },
        { html: `${name}'s work is correct.`, why: `The unit ${cu(b.u)} gives it away: cubic units measure volume. Surface area is in ${sq(b.u)}.` },
      ];
      hint2 = `l × w × h fills the box with cubes. To cover the outside, add the areas of the faces: 2 × ${b.lw} + 2 × ${b.lh} + 2 × ${b.wh}.`;
    } else if (variant === 'onePair') {
      const wrong = round(2 * b.lw + 2 * b.lh + b.wh, 2);
      work = `SA = 2(${b.l} × ${b.w}) + 2(${b.l} × ${b.h}) + (${b.w} × ${b.h})<br>SA = ${round(2 * b.lw, 2)} + ${round(2 * b.lh, 2)} + ${b.wh}<br>SA = ${wrong} ${sq(b.u)}`;
      opts = [
        { html: `${name} counted only one of the two side faces. The side face ${b.w} × ${b.h} has a twin, so it must be doubled too.`, ok: true },
        { html: `${name} used the length ${b.l} in two different face areas, so one face is counted twice.`, why: `Length really is an edge of both the top (${b.l} × ${b.w}) and the front (${b.l} × ${b.h}). Those are two different faces.` },
        { html: `${name} should have multiplied by 6 because a box has six faces.`, why: 'The six faces are not all the same size. Only matching pairs are equal, so double each of the three different faces.' },
        { html: `${name}'s work is correct because every face was included.`, why: `Only five faces are in the work: the last term ${b.w} × ${b.h} is not doubled.` },
      ];
      hint2 = `Count the faces in the work: 2 + 2 + 1 = 5. A box has 6. Which term is not doubled?`;
    } else {
      const wrong = round(2 * b.lw + 4 * b.lh, 2);
      work = `SA = 2(${b.l} × ${b.w}) + 2(${b.l} × ${b.h}) + 2(${b.l} × ${b.h})<br>SA = ${round(2 * b.lw, 2)} + ${round(2 * b.lh, 2)} + ${round(2 * b.lh, 2)}<br>SA = ${wrong} ${sq(b.u)}`;
      opts = [
        { html: `${name} used the front face ${b.l} × ${b.h} twice and never found the side faces, which are ${b.w} × ${b.h}.`, ok: true },
        { html: `${name} forgot to double the top and bottom faces before adding.`, why: `The top and bottom are doubled: 2(${b.l} × ${b.w}). The problem is in the last term.` },
        { html: `${name} should have used ${b.l} × ${b.w} × ${b.h} for the last term instead.`, why: 'l × w × h is the volume of the whole box. No face of the box has three edges multiplied together.' },
        { html: `${name}'s work is correct because it has six faces in three pairs.`, why: `It has six terms, but two pairs are the same front-and-back faces. The sides, ${b.w} by ${b.h}, are missing.` },
      ];
      hint2 = `The three different faces are l × w, l × h, and w × h. Compare each term in the work with this list.`;
    }
    const sh = shuffleOptions(r, opts, 0);
    return {
      type: 'error',
      skill: 'sa-rect-prism',
      lesson: '5-7',
      title: 'Find the mistake',
      prompt: `<p>${name} found the surface area of a ${b.l} ${b.u} by ${b.w} ${b.u} by ${b.h} ${b.u} box.</p>${boxSvg(b, { width: 240, height: 180 })}<p>What is wrong with ${name}'s work?</p>`,
      work,
      options: sh.options,
      answer: sh.answer,
      fix: { label: `Correct surface area (${sq(b.u)}):`, answer: b.SA },
      hints: [
        'How many faces does a rectangular prism have? Does the work account for all of them, with the right edges?',
        hint2,
        `${round(2 * b.lw, 2)} + ${round(2 * b.lh, 2)} + ${round(2 * b.wh, 2)}.`,
      ],
      hintEs: '¿Cuántas caras tiene un prisma rectangular? ¿El trabajo incluye todas las caras, con las aristas correctas?',
      solution: `<p>${{ three: `${name} added three faces but forgot their twins.`, volume: `${name} computed volume instead of surface area.`, onePair: `${name} did not double the side face, so only five faces were counted.`, repeat: `${name} used the front face twice and left out the two side faces.` }[variant]} Correct: SA = 2(${b.l} × ${b.w}) + 2(${b.l} × ${b.h}) + 2(${b.w} × ${b.h}) = ${round(2 * b.lw, 2)} + ${round(2 * b.lh, 2)} + ${round(2 * b.wh, 2)} = <b>${b.SA} ${sq(b.u)}</b>.</p>`,
      feedback: {
        correct: `Correct. Six faces in three pairs: ${b.SA} ${sq(b.u)}.`,
        wrong(ans, d) {
          if (!d.mistakeOk) return (sh.options[ans.mistake] && sh.options[ans.mistake].why) || 'Count the faces in the work and compare with the six faces of a box.';
          const f = parseNum(ans.fix);
          if (near(f, b.lw + b.lh + b.wh)) return 'You found the mistake, but the fix adds each face only once. Double each of the three faces.';
          if (near(f, b.V)) return 'You found the mistake, but the fix is the volume. Add the six face areas.';
          return 'You found the mistake. For the fix, double each of the three different faces and add.';
        },
      },
    };
  });

  // ---------- Surface area of a triangular prism (num; hard: half-unit measures) ----------
  G.define('g7_triPrism', (r, o) => {
    const hard = !!(o && o.hard);
    const t = wedge(r, hard);
    const name = r.pick(NAMES),
      obj = r.pick(WEDGES);
    return {
      type: 'num',
      skill: 'sa-tri-prism',
      lesson: '5-7',
      title: 'Surface area of a triangular prism',
      prompt: `<p>${name}'s ${obj} is a triangular prism ${hl(t.L + ' ' + t.u)} long. Each triangular end has a base of ${hl(t.b + ' ' + t.u)} and a height of ${hl(t.h + ' ' + t.u)}. The three sides of the triangle are ${sidesText(t)}.</p>${wedgeSvg(t)}<p>What is the surface area of the ${obj}?</p>`,
      unit: sq(t.u),
      answer: t.SA,
      reference: true,
      hints: [
        'A triangular prism has 5 faces: 2 triangles (the ends) and 3 rectangles. Each rectangle is the prism length times one side of the triangle.',
        `Two triangles: 2 × (½ × ${t.b} × ${t.h}) = ${round(2 * t.tri, 2)}. Rectangles: ${t.L} × ${t.b}, ${t.L} × ${t.s1}, ${t.L} × ${t.s2}.`,
        `${round(2 * t.tri, 2)} + ${t.rb} + ${t.r1} + ${t.r2}.`,
      ],
      hintEs: 'Un prisma triangular tiene 5 caras: 2 triángulos (los extremos) y 3 rectángulos. Cada rectángulo es el largo del prisma por un lado del triángulo.',
      solution: `<p>Triangles: 2 × ½ × ${t.b} × ${t.h} = ${round(2 * t.tri, 2)}. Rectangles: ${t.L} × ${t.b} = ${t.rb}, ${t.L} × ${t.s1} = ${t.r1}, ${t.L} × ${t.s2} = ${t.r2}. SA = ${round(2 * t.tri, 2)} + ${t.rb} + ${t.r1} + ${t.r2} = <b>${t.SA} ${sq(t.u)}</b>. The three rectangles have different widths because they wrap around the three sides of the triangle, so the slanted side ${t.s} is needed here even though it is not used for the triangle's area.</p>`,
      feedback: { correct: `Correct. 2 triangles (${round(2 * t.tri, 2)}) + 3 rectangles (${t.rects}) = ${t.SA} ${sq(t.u)}.`, wrong: (ans, d) => coachWedge(t, d.value) },
    };
  });

  // ---------- Triangles, rectangles, total (blanks, template; hard: half-unit measures) ----------
  G.define('g7_triBlanks', (r, o) => {
    const hard = !!(o && o.hard);
    const t = wedge(r, hard);
    const netSvg2 = U5.triNet(t.b, t.h, t.s1, t.s2, t.L, {
      labels: true,
      u: ' ' + t.u,
      width: 300,
      heightPx: 230,
      aria: `Net of the triangular prism: three rectangles ${t.L} ${t.u} long with widths ${t.b}, ${t.s1}, and ${t.s2} ${t.u}, and two triangles with base ${t.b} ${t.u} and height ${t.h} ${t.u}`,
    });
    return {
      type: 'blanks',
      skill: 'sa-tri-prism',
      lesson: '5-7',
      title: 'Net of a triangular prism',
      prompt: `<p>This net folds into a triangular prism ${hl(t.L + ' ' + t.u)} long. The triangles have base ${hl(t.b + ' ' + t.u)} and height ${hl(t.h + ' ' + t.u)}; their sides are ${sidesText(t)}.</p>${netSvg2}<p>Complete the steps.</p>`,
      fields: [
        { label: 'two triangles', answer: round(2 * t.tri, 2) },
        { label: 'three rectangles', answer: t.rects },
        { label: 'surface area', answer: t.SA },
      ],
      template: `The two triangles together have an area of {0} ${sq(t.u)}. The three rectangles together have an area of {1} ${sq(t.u)}. Surface area = {2} ${sq(t.u)}.`,
      reference: true,
      hints: [
        'Each triangle is ½ × base × height. Each rectangle is the prism length times one side of the triangle.',
        `Triangles: 2 × ½ × ${t.b} × ${t.h}. Rectangles: ${t.L} × ${t.b} + ${t.L} × ${t.s1} + ${t.L} × ${t.s2}, or ${t.L} × (${t.b} + ${t.s1} + ${t.s2}).`,
        `${round(2 * t.tri, 2)} + ${t.rects}.`,
      ],
      hintEs: 'Cada triángulo es ½ × base × altura. Cada rectángulo es el largo del prisma por un lado del triángulo.',
      solution: `<p>Triangles: 2 × ½ × ${t.b} × ${t.h} = <b>${round(2 * t.tri, 2)}</b>. Rectangles: ${t.L} × (${t.b} + ${t.s1} + ${t.s2}) = ${t.L} × ${t.per} = <b>${t.rects}</b>. Surface area: <b>${t.SA}</b> ${sq(t.u)}. In the net, the three rectangles line up side by side, so their total width is the perimeter of the triangle.</p>`,
      feedback: {
        correct: 'Correct. Two triangles plus three rectangles.',
        wrong(ans, d) {
          const tv = parseNum(ans[0]),
            rv = parseNum(ans[1]);
          if (near(tv, t.tri)) return `${t.tri} is one triangle. The prism has two triangular ends.`;
          if (near(tv, 2 * t.b * t.h)) return `Each triangle needs the ½: ½ × ${t.b} × ${t.h}. Then double for the two ends.`;
          if (!t.right && near(tv, t.b * t.s)) return `You used the slanted side ${t.s} as the triangle's height. Use the perpendicular height ${t.h}.`;
          if (near(rv, 3 * t.rb)) return `The rectangles have different widths: ${t.b}, ${t.s1}, and ${t.s2}. Multiply each by ${t.L}.`;
          if (d.wrong.length === 1 && d.wrong[0] === 2) return 'The two parts are right. Add the triangles and the rectangles.';
          return `Triangles: 2 × ½ × ${t.b} × ${t.h}. Rectangles: ${t.L} × (${t.b} + ${t.s1} + ${t.s2}).`;
        },
      },
    };
  });

  // ---------- Who found the triangular prism's surface area? (who; hard: half-unit measures and a fourth student) ----------
  G.define('g7_whoTri', (r, o) => {
    const hard = !!(o && o.hard);
    const t = wedge(r, hard);
    const [n1, n2, n3, n4] = r.pickN(NAMES, 4);
    const slantTri = round((t.b * t.s) / 2, 2);
    const opts = [
      { title: n1, html: `2 × (½ × ${t.b} × ${t.h}) = ${round(2 * t.tri, 2)}<br>${t.L} × (${t.b} + ${t.s1} + ${t.s2}) = ${t.rects}<br><b>SA = ${t.SA} ${sq(t.u)}</b>`, ok: true },
      {
        title: n2,
        html: `2 × (½ × ${t.b} × ${t.s}) = ${round(2 * slantTri, 2)}<br>${t.L} × (${t.b} + ${t.s1} + ${t.s2}) = ${t.rects}<br><b>SA = ${round(2 * slantTri + t.rects, 2)} ${sq(t.u)}</b>`,
        why: `${n2} used the slanted side ${t.s} as the triangle's height. The height ${t.h} is the one that meets the base at a right angle.`,
      },
      {
        title: n3,
        html: `2 × (½ × ${t.b} × ${t.h}) = ${round(2 * t.tri, 2)}<br>${t.L} × (${t.b} + ${t.b} + ${t.b}) = ${round(3 * t.rb, 2)}<br><b>SA = ${round(2 * t.tri + 3 * t.rb, 2)} ${sq(t.u)}</b>`,
        why: `${n3} made all three rectangles ${t.L} by ${t.b}. The rectangles have different widths: ${t.b}, ${t.s1}, and ${t.s2}.`,
      },
    ];
    if (hard)
      opts.push({
        title: n4,
        html: `1 × (½ × ${t.b} × ${t.h}) = ${t.tri}<br>${t.L} × (${t.b} + ${t.s1} + ${t.s2}) = ${t.rects}<br><b>SA = ${round(t.tri + t.rects, 2)} ${sq(t.u)}</b>`,
        why: `${n4} counted only one triangular end. A prism has two identical triangles, one at each end.`,
      });
    const sh = shuffleOptions(r, opts, 0);
    return {
      type: 'who',
      skill: 'sa-tri-prism',
      lesson: '5-7',
      title: 'Who is correct?',
      prompt: `<p>${hard ? 'Four' : 'Three'} students find the surface area of this triangular prism. It is ${t.L} ${t.u} long; each triangle has base ${t.b} ${t.u}, height ${t.h} ${t.u}, and sides ${sidesText(t)}.</p>${wedgeSvg(t, { width: 260, height: 190 })}<p>Who is correct?</p>`,
      options: sh.options,
      answer: sh.answer,
      layout: 'cards',
      hints: [
        'Check the triangles: did they use ½ × base × perpendicular height, for both ends? Check the rectangles: does each one use a different side of the triangle?',
        `Two triangles: 2 × ½ × ${t.b} × ${t.h}. Three rectangles: ${t.L} × ${t.b}, ${t.L} × ${t.s1}, ${t.L} × ${t.s2}.`,
        `Add ${round(2 * t.tri, 2)} + ${t.rects}, then find the student whose total matches.`,
      ],
      hintEs:
        'Revisa los triángulos: ¿usaron ½ × base × altura (la altura perpendicular) para los dos extremos? Revisa los rectángulos: ¿cada uno usa un lado diferente del triángulo?',
      solution: `<p><b>${n1}</b> is correct: ${round(2 * t.tri, 2)} + ${t.rects} = ${t.SA} ${sq(t.u)}. ${n2} used the slanted side as the triangle's height. ${n3} used the base for every rectangle, but each rectangle wraps a different side of the triangle.${hard ? ` ${n4} counted only one triangular end.` : ''}</p>`,
      feedback: {
        correct: `Correct. ${n1} used the perpendicular height for both triangles and all three triangle sides for the rectangles.`,
        wrong: (ans) => (sh.options[ans] && sh.options[ans].why) || 'Check each student: two triangles with the perpendicular height, and three rectangles with three different widths.',
      },
    };
  });

  // ---------- Sort: surface area or volume? (sort; hard: subtler items, 8 of them) ----------
  G.define('g7_sortSAorV', (r, o) => {
    const hard = !!(o && o.hard);
    const SA = [
      'wrapping paper to cover a gift box',
      'paint for the outside of a shed',
      'cardboard to build a box',
      'fabric to cover a cushion',
      'tiles to cover the walls and floor of a room',
      'measured in square units',
      '2lw + 2lh + 2wh',
      'the total area of all the faces',
      'frosting to cover a cake',
    ];
    const VOL = [
      'water to fill an aquarium',
      'sand to fill a sandbox',
      'air inside a tent',
      'concrete to pour a solid step',
      'cereal inside a box',
      'measured in cubic units',
      'l × w × h',
      'the number of unit cubes that fit inside',
      'soil to fill a planter',
    ];
    const SA_HARD = [
      'glass for the bottom and four sides of an open fish tank',
      'square stickers to cover every face of a cube',
      'an answer written in ft²',
      'adding the areas of the six rectangles in a net',
      'shingles for the two slanted faces of a roof',
      'plastic wrap that just covers a box of crackers',
      'canvas for the five faces of a tent, floor included',
    ];
    const VOL_HARD = [
      'how many 1-inch cubes pack a jewelry box',
      'an answer written in ft³',
      'B × h, the base area times the height',
      'gravel to fill a garden bed 2 feet deep',
      'packing peanuts to fill a shipping crate',
      'how much water a swimming pool holds',
      'ice that freezes solid inside an ice-cube tray',
    ];
    const k = hard ? 4 : 3;
    const items = r.shuffle(
      r
        .pickN(hard ? SA_HARD : SA, k)
        .map((t) => ({ html: t, bin: 0 }))
        .concat(r.pickN(hard ? VOL_HARD : VOL, k).map((t) => ({ html: t, bin: 1 }))),
    );
    return {
      type: 'sort',
      skill: 'sa-rect-prism',
      lesson: '5-7',
      title: 'Surface area or volume?',
      prompt:
        '<p><b>Surface area</b> measures the outside of a solid: how much covers it. <b>Volume</b> measures the inside: how much fills it. Sort each item.</p>' +
        (hard ? '<p>Read closely: some of the eight items name only a unit or a formula, and some cover only part of a solid.</p>' : ''),
      bins: ['Surface area (covers)', 'Volume (fills)'],
      items,
      hints: [
        'Ask: does this cover the outside, or fill the inside?',
        'Covering uses flat material and square units. Filling uses cubes and cubic units.',
        hard
          ? 'Watch the units: ² means square units (covering), ³ means cubic units (filling). Stickers, glass, and shingles cover; cubes, gravel, and water fill.'
          : 'Paper, paint, fabric, tiles, and 2lw + 2lh + 2wh go with surface area. Water, sand, air, concrete, and l × w × h go with volume.',
      ],
      hintEs: 'Pregúntate: ¿esto cubre el exterior o llena el interior?',
      solution: `<p>Surface area: ${items
        .filter((i) => i.bin === 0)
        .map((i) => i.html)
        .join('; ')}. Volume: ${items
        .filter((i) => i.bin === 1)
        .map((i) => i.html)
        .join('; ')}. Surface area is in square units because it is area; volume is in cubic units because it counts cubes.</p>`,
      feedback: {
        correct: 'Correct. Covering is surface area; filling is volume.',
        wrong(ans, d) {
          const i = d.wrong && d.wrong[0];
          if (i == null || !items[i]) return 'Does each item cover the outside (surface area) or fill the inside (volume)?';
          return items[i].bin === 0
            ? `"${items[i].html}" covers the outside with flat material, so it is surface area, measured in square units.`
            : `"${items[i].html}" fills the space inside, so it is volume, measured in cubic units.`;
        },
      },
    };
  });
})(typeof window !== 'undefined' ? window : globalThis);

/* js/units/u5/gen-surface-pyramid.js */
/* Zone 8 — The Spire. Lesson 5-8 Determine Surface Area of Pyramids (square pyramids · lateral area). */
(function (root) {
  'use strict';
  const RX = root.RX;
  const { G, V, shuffleOptions, NAMES, round, parseNum, U5 } = RX;
  const near = (a, b) => a != null && Math.abs(a - b) < 0.01;
  const hl = V.hl;
  const sq = U5.sq;

  // (half base, vertical height, slant height) Pythagorean triples keep every drawing honest: slant > height.
  const TRIPLES = [
    [3, 4, 5],
    [4, 3, 5],
    [6, 8, 10],
    [8, 6, 10],
    [5, 12, 13],
    [12, 5, 13],
  ];
  const OBJECTS = ['glass roof', 'tent', 'paperweight', 'monument model', 'skylight', 'garden lantern', 'museum roof', 'birdhouse roof'];

  /** Square pyramid. o.hard (unless o.half === false): every measure × 1.5, so edges and slant heights land on half units. */
  function pyr(r, o) {
    o = o || {};
    const half = !!o.hard && o.half !== false;
    const k = half ? 1.5 : 1;
    const [hb, h, sl] = r.pick(half ? TRIPLES.slice(0, 5) : TRIPLES).map((x) => x * k);
    const b = 2 * hb;
    const u = r.pick(U5.UNITS);
    const base = round(b * b, 2),
      tri = round((b * sl) / 2, 2),
      lat = round(4 * tri, 2);
    return { b, h, sl, u, base, tri, lat, SA: round(base + lat, 2) };
  }
  function pyrSvg(p, o) {
    o = o || {};
    return V.pyramid(
      Object.assign(
        {
          b: p.b,
          slant: p.sl,
          baseLabel: `${p.b} ${p.u}`,
          slantLabel: `${o.slantWord || 'slant'} ${p.sl} ${p.u}`,
          aria: `Square pyramid with base edge ${p.b} ${p.u} and slant height ${p.sl} ${p.u}`,
        },
        o.extra || {},
      ),
    );
  }
  function netSvg(p, extra) {
    return V.pyramidNet(
      Object.assign(
        {
          b: p.b,
          slant: p.sl,
          baseLabel: `${p.b} ${p.u}`,
          slantLabel: `${p.sl} ${p.u}`,
          width: 260,
          aria: `Net of the pyramid: a ${p.b} by ${p.b} square with four triangles of slant height ${p.sl} ${p.u}`,
        },
        extra || {},
      ),
    );
  }
  function coachSA(p, v, o) {
    o = o || {};
    if (v == null) return 'Surface area = square base + 4 triangles. Each triangle is ½ × base edge × slant height.';
    if (near(v, p.lat)) return `${p.lat} is the lateral area, the four triangles only. The square base is a face too.`;
    if (near(v, p.base + p.tri)) return 'You added only one triangle. There are four identical triangular faces.';
    if (near(v, p.base + 4 * p.b * p.sl)) return `You forgot the ½ in the triangle formula. Each triangle is ½ × ${p.b} × ${p.sl}.`;
    if (o.withH && near(v, p.base + 2 * p.b * p.h))
      return `You used the vertical height ${p.h}. The triangular faces are measured by the slant height ${p.sl}, the distance up the face itself.`;
    if (o.areaGiven && near(v, p.base + 2 * p.base * p.sl)) return `You used the base area ${p.base} as if it were the base edge. Find the edge first: which number times itself makes ${p.base}?`;
    if (near(v, 5 * p.tri)) return `You counted 5 triangles. The fifth face is the square base, ${p.b} × ${p.b}.`;
    if (near(v, 4 * p.b + p.lat)) return `You used 4 × ${p.b}, the distance around the base. The base face needs its area: ${p.b} × ${p.b}.`;
    return 'Find the square base (edge × edge) and one triangle (½ × edge × slant height). Then add the base and four triangles.';
  }

  // ---------- Surface area of a square pyramid (num; hard: vertical-height distractor with half units, or base area given) ----------
  G.define('g8_saPyramid', (r, o) => {
    const hard = !!(o && o.hard);
    const mode = hard ? r.pick(['height', 'area']) : 'plain';
    const p = pyr(r, { hard, half: mode !== 'area' });
    const name = r.pick(NAMES),
      obj = r.pick(OBJECTS);
    const baseText =
      mode === 'area'
        ? `Its square base has an area of ${hl(p.base + ' ' + sq(p.u))}.`
        : `Its base is a ${hl(p.b + ' ' + p.u)} square.`;
    const hText = mode === 'height' ? ` The pyramid stands ${p.h} ${p.u} tall from the center of its base to the top.` : '';
    const svg =
      mode === 'plain'
        ? pyrSvg(p, { extra: { width: 240, height: 190 } }) + netSvg(p, { width: 220 })
        : pyrSvg(p, mode === 'area' ? { extra: { baseLabel: `base area ${p.base} ${sq(p.u)}`, aria: `Square pyramid with base area ${p.base} ${sq(p.u)} and slant height ${p.sl} ${p.u}` } } : {});
    const h1 = {
      plain: ['A square pyramid has 5 faces: 1 square base and 4 identical triangles. Add them all.', 'Una pirámide cuadrada tiene 5 caras: 1 base cuadrada y 4 triángulos iguales. Súmalas todas.'],
      height: [
        'A square pyramid has 5 faces: 1 square base and 4 identical triangles. Add them all. The triangles use the slant height, not the vertical height.',
        'Una pirámide cuadrada tiene 5 caras: 1 base cuadrada y 4 triángulos iguales. Súmalas todas. Los triángulos usan la altura inclinada, no la altura vertical.',
      ],
      area: [
        `The base area is given, but each triangle needs the base edge. Which number times itself makes ${p.base}? Then add the base and the 4 triangles.`,
        `El área de la base ya está dada, pero cada triángulo necesita la arista de la base. ¿Qué número multiplicado por sí mismo da ${p.base}? Luego suma la base y los 4 triángulos.`,
      ],
    }[mode];
    return {
      type: 'num',
      skill: 'sa-pyramid',
      lesson: '5-8',
      title: hard ? 'Seal of Surface: pyramid' : 'Surface area of a square pyramid',
      xp: o.xp,
      prompt: `<p>${name} is covering a ${obj} shaped like a square pyramid. ${baseText} Each triangular face has a slant height of ${hl(p.sl + ' ' + p.u)}.${hText}</p>${svg}<p>What is the total surface area, including the base?</p>`,
      unit: sq(p.u),
      answer: p.SA,
      reference: true,
      hints: [
        h1[0],
        mode === 'area'
          ? `${p.b} × ${p.b} = ${p.base}, so the base edge is ${p.b} ${p.u}. One triangle: ½ × ${p.b} × ${p.sl} = ${p.tri}.`
          : `Base: ${p.b} × ${p.b} = ${p.base}. One triangle: ½ × ${p.b} × ${p.sl} = ${p.tri}.`,
        `${p.base} + 4 × ${p.tri}.`,
      ],
      hintEs: h1[1],
      solution: `<p>${mode === 'area' ? `The base edge is ${p.b} ${p.u}, because ${p.b} × ${p.b} = ${p.base}. ` : `Base: ${p.b} × ${p.b} = ${p.base}. `}Four triangles: 4 × (½ × ${p.b} × ${p.sl}) = 4 × ${p.tri} = ${p.lat}. SA = ${p.base} + ${p.lat} = <b>${p.SA} ${sq(p.u)}</b>. The slant height is the height of each triangular face measured along the face, so it is the h in ½bh.${mode === 'height' ? ` The vertical height ${p.h} ${p.u} is shorter and is not part of any face.` : ''}</p>`,
      feedback: { correct: `Correct. ${p.base} + 4 × ${p.tri} = ${p.SA} ${sq(p.u)}.`, wrong: (ans, d) => coachSA(p, d.value, { withH: mode === 'height', areaGiven: mode === 'area' }) },
    };
  });

  // ---------- Base, one triangle, four triangles, total (blanks; hard: work backward from SA to the slant height) ----------
  G.define('g8_blanksPyr', (r, o) => {
    const hard = !!(o && o.hard);
    const p = pyr(r);
    if (hard) {
      return {
        type: 'blanks',
        skill: 'sa-pyramid',
        lesson: '5-8',
        title: 'Work backward to the slant height',
        prompt: `<p>A square pyramid has a base edge of ${hl(p.b + ' ' + p.u)} and a surface area of ${hl(p.SA + ' ' + sq(p.u))}. The slant height is missing.</p>${netSvg(p, { slantLabel: '? ' + p.u, aria: `Net of a square pyramid with base edge ${p.b} ${p.u} and an unknown slant height` })}<p>Work backward. Complete the steps.</p>`,
        fields: [
          { label: 'base', answer: p.base },
          { label: 'four triangles', answer: p.lat },
          { label: 'one triangle', answer: p.tri },
          { label: 'slant height', answer: p.sl },
        ],
        template: `Base: {0} ${sq(p.u)}. Four triangles together: {1} ${sq(p.u)}. One triangle: {2} ${sq(p.u)}. Slant height: {3} ${p.u}.`,
        reference: true,
        hints: [
          'Work backward. Take the base away from the surface area to get the four triangles. Split that into one triangle, then undo ½ × base edge × slant height.',
          `Base: ${p.b} × ${p.b} = ${p.base}. Four triangles: ${p.SA} − ${p.base} = ${p.lat}. One triangle: ${p.lat} ÷ 4 = ${p.tri}.`,
          `½ × ${p.b} × slant = ${p.tri}. Double ${p.tri}, then divide by ${p.b}.`,
        ],
        hintEs:
          'Trabaja hacia atrás. Resta la base del área total para obtener los cuatro triángulos. Divide eso para hallar un triángulo y luego deshaz ½ × arista de la base × altura inclinada.',
        solution: `<p>Base: ${p.b} × ${p.b} = <b>${p.base}</b>. Four triangles: ${p.SA} − ${p.base} = <b>${p.lat}</b>. One triangle: ${p.lat} ÷ 4 = <b>${p.tri}</b>. Since ½ × ${p.b} × slant = ${p.tri}, the slant height is 2 × ${p.tri} ÷ ${p.b} = <b>${p.sl}</b> ${p.u}. Each step undoes one step of the surface area formula.</p>`,
        feedback: {
          correct: 'Correct. Subtract the base, split into four, then undo the ½ × base.',
          wrong(ans, d) {
            const a1 = parseNum(ans[1]),
              a2 = parseNum(ans[2]),
              a3 = parseNum(ans[3]);
            if (near(a1, p.SA)) return 'The four triangles do not include the base. Subtract the base from the surface area.';
            if (near(a2, p.lat / 2) || near(a2, p.SA / 4)) return 'One triangle is the four-triangle area divided by 4, after the base is removed.';
            if (near(a3, p.tri / p.b)) return 'You divided by the base edge but did not undo the ½. Double the triangle area first, then divide by the edge.';
            if (near(a3, p.lat / p.b) || near(a3, (2 * p.lat) / p.b)) return 'Use one triangle, not all four, when you undo ½ × base × slant height.';
            if (d.wrong.includes(0)) return 'The base is a square: multiply the edge by itself.';
            return 'Steps: base = edge × edge; four triangles = SA − base; one triangle = that ÷ 4; slant = 2 × triangle ÷ edge.';
          },
        },
      };
    }
    return {
      type: 'blanks',
      skill: 'sa-pyramid',
      lesson: '5-8',
      title: 'Build the surface area step by step',
      prompt: `<p>This net folds into a square pyramid. The base edge is ${hl(p.b + ' ' + p.u)} and the slant height is ${hl(p.sl + ' ' + p.u)}.</p>${netSvg(p)}<p>Complete the steps.</p>`,
      fields: [
        { label: 'base', answer: p.base },
        { label: 'one triangle', answer: p.tri },
        { label: 'four triangles', answer: p.lat },
        { label: 'surface area', answer: p.SA },
      ],
      template: `Base: {0} ${sq(p.u)}. One triangle: {1} ${sq(p.u)}. Four triangles: {2} ${sq(p.u)}. Surface area: {3} ${sq(p.u)}.`,
      reference: true,
      hints: [
        'The base is a square: edge × edge. Each triangle is ½ × base edge × slant height.',
        `Base: ${p.b} × ${p.b}. One triangle: ½ × ${p.b} × ${p.sl}.`,
        `Four triangles: 4 × ${p.tri}. Then add the base.`,
      ],
      hintEs: 'La base es un cuadrado: arista × arista. Cada triángulo es ½ × arista de la base × altura inclinada.',
      solution: `<p>Base: ${p.b} × ${p.b} = <b>${p.base}</b>. One triangle: ½ × ${p.b} × ${p.sl} = <b>${p.tri}</b>. Four triangles: 4 × ${p.tri} = <b>${p.lat}</b>. Surface area: ${p.base} + ${p.lat} = <b>${p.SA}</b> ${sq(p.u)}. The net makes the five faces easy to see and count.</p>`,
      feedback: {
        correct: 'Correct. Square base plus four identical triangles.',
        wrong(ans, d) {
          const b0 = parseNum(ans[0]),
            t = parseNum(ans[1]);
          if (near(b0, 4 * p.b)) return `${4 * p.b} is the distance around the base. The base face needs its area: edge × edge.`;
          if (near(t, p.b * p.sl)) return `A triangle is half of base × height: take half of ${p.b} × ${p.sl}.`;
          if (d.wrong.includes(0)) return `The base is a square with edge ${p.b}: multiply ${p.b} × ${p.b}.`;
          if (d.wrong.includes(2) && !d.wrong.includes(1)) return 'The pyramid has four identical triangles: multiply one triangle by 4.';
          if (d.wrong.length === 1 && d.wrong[0] === 3) return 'Add the base and the four triangles.';
          return 'Base: edge × edge. Triangle: ½ × edge × slant height. Then × 4, then add the base.';
        },
      },
    };
  });

  // ---------- Error: vertical height, 5 triangles, or (hard) lateral area only, with half units (error) ----------
  G.define('g8_errorSlant', (r, o) => {
    const hard = !!(o && o.hard);
    const p = pyr(r, { hard });
    const name = r.pick(NAMES);
    const variant = hard ? r.pick(['height', 'lateral']) : r.pick(['height', 'five']);
    const hTri = round((p.b * p.h) / 2, 2);
    let work, opts, hint1, hint1Es, hint2, sol;
    if (variant === 'height') {
      work = `Base: ${p.b} × ${p.b} = ${p.base}<br>Triangle: ½ × ${p.b} × ${p.h} = ${hTri}<br>SA = ${p.base} + 4 × ${hTri} = ${round(p.base + 4 * hTri, 2)} ${sq(p.u)}`;
      opts = [
        { html: `${name} used the vertical height ${p.h} ${p.u} for the triangles. A face's height is the slant height, ${p.sl} ${p.u}, measured along the face.`, ok: true },
        { html: `${name} forgot the ½ in the triangle formula.`, why: 'The ½ is there. The problem is which height was multiplied: the triangle faces use the slant height.' },
        { html: `${name} should have used 5 triangles.`, why: 'A square pyramid has 4 triangles and 1 square base. The count is right; the height used is wrong.' },
        { html: `${name}'s work is correct.`, why: `The vertical height ${p.h} runs through the inside of the pyramid, not along a face. The faces are taller: slant height ${p.sl}.` },
      ];
      hint1 = 'Two different heights are given. Which one lies on a triangular face?';
      hint1Es = 'Te dan dos alturas diferentes. ¿Cuál de ellas está sobre una cara triangular?';
      hint2 = `The slant height ${p.sl} ${p.u} is the height of a triangular face. The vertical height ${p.h} ${p.u} is inside the pyramid and belongs to no face.`;
      sol = `${name} used the vertical height. The faces are triangles whose height is the slant height ${p.sl}.`;
    } else if (variant === 'five') {
      work = `Triangle: ½ × ${p.b} × ${p.sl} = ${p.tri}<br>5 faces<br>SA = 5 × ${p.tri} = ${round(5 * p.tri, 2)} ${sq(p.u)}`;
      opts = [
        { html: `${name} treated all 5 faces as triangles. The fifth face is the square base: ${p.b} × ${p.b} = ${p.base}.`, ok: true },
        { html: `${name} should have used 4 faces and stopped there.`, why: 'Four triangles give the lateral area only. The base must be added too; it is just not a triangle.' },
        {
          html: `${name} used the wrong slant height.`,
          why: `${p.sl} ${p.u} is the slant height and ½ × ${p.b} × ${p.sl} = ${p.tri} is correct for one triangle. The mistake is counting the base as a triangle.`,
        },
        { html: `${name}'s work is correct.`, why: `The base is a ${p.b} by ${p.b} square with area ${p.base}, not a triangle with area ${p.tri}.` },
      ];
      hint1 = 'A square pyramid has 5 faces. Are they all the same shape?';
      hint1Es = 'Una pirámide cuadrada tiene 5 caras. ¿Todas tienen la misma forma?';
      hint2 = `Four faces are triangles (${p.tri} each). The fifth is the square base: ${p.b} × ${p.b} = ${p.base}.`;
      sol = `${name} counted the base as a fifth triangle, but it is a square.`;
    } else {
      work = `Triangle: ½ × ${p.b} × ${p.sl} = ${p.tri}<br>Four triangles: 4 × ${p.tri} = ${p.lat}<br>SA = ${p.lat} ${sq(p.u)}`;
      opts = [
        { html: `${name} found only the lateral area. The square base, ${p.b} × ${p.b}, is a face too and must be added.`, ok: true },
        { html: `${name} should have used the vertical height ${p.h} ${p.u} for the triangles.`, why: `The slant height ${p.sl} is the right height for a triangular face. The vertical height is inside the pyramid.` },
        { html: `${name} should have multiplied one triangle by 5, not 4.`, why: 'Only 4 faces are triangles. The fifth face is a square, so it needs its own area.' },
        { html: `${name}'s work is correct because all four faces were counted.`, why: `A square pyramid has five faces. The work leaves out the ${p.b} by ${p.b} base.` },
      ];
      hint1 = 'Surface area covers every face. Does the work include all five faces?';
      hint1Es = 'El área total cubre todas las caras. ¿El trabajo incluye las cinco caras?';
      hint2 = `The work has the four triangles (${p.lat}). The square base, ${p.b} × ${p.b}, is missing.`;
      sol = `${name} found the lateral area and stopped. Surface area also includes the square base.`;
    }
    const sh = shuffleOptions(r, opts, 0);
    const svg =
      variant === 'height'
        ? V.pyramid({
            b: p.b,
            slant: p.sl,
            baseLabel: `${p.b} ${p.u}`,
            slantLabel: `slant ${p.sl} ${p.u}`,
            width: 240,
            height: 190,
            aria: `Square pyramid with base ${p.b} ${p.u}, slant height ${p.sl} ${p.u}, and vertical height ${p.h} ${p.u}`,
          })
        : netSvg(p, { width: 220 });
    return {
      type: 'error',
      skill: 'sa-pyramid',
      lesson: '5-8',
      title: 'Find the mistake',
      prompt: `<p>${name} found the surface area of a square pyramid with base edge ${p.b} ${p.u} and slant height ${p.sl} ${p.u}.${variant === 'height' ? ` The pyramid's vertical height, from the center of the base straight up to the top, is ${p.h} ${p.u}.` : ''}</p>${svg}<p>What is wrong with ${name}'s work?</p>`,
      work,
      options: sh.options,
      answer: sh.answer,
      fix: { label: `Correct surface area (${sq(p.u)}):`, answer: p.SA },
      hints: [hint1, hint2, `Correct: ${p.base} + 4 × ${p.tri}.`],
      hintEs: hint1Es,
      solution: `<p>${sol} Correct: base ${p.b} × ${p.b} = ${p.base}; triangles 4 × (½ × ${p.b} × ${p.sl}) = ${p.lat}; SA = <b>${p.SA} ${sq(p.u)}</b>.</p>`,
      feedback: {
        correct: `Correct. ${p.base} + ${p.lat} = ${p.SA} ${sq(p.u)}.`,
        wrong(ans, d) {
          if (!d.mistakeOk) return (sh.options[ans.mistake] && sh.options[ans.mistake].why) || 'Compare the work with the five faces of the pyramid.';
          const f = parseNum(ans.fix);
          if (near(f, p.lat)) return 'You found the mistake, but the fix is still only the four triangles. Add the square base.';
          if (near(f, p.base + 4 * hTri)) return 'You found the mistake, but the fix still uses the vertical height. Use the slant height for each triangle.';
          return 'You found the mistake. For the fix, add the square base and four triangles that use the slant height.';
        },
      },
    };
  });

  // ---------- Table from the net (table; hard: base area given, find the edge first) ----------
  G.define('g8_tableNet', (r, o) => {
    const hard = !!(o && o.hard);
    const p = pyr(r);
    const name = r.pick(NAMES);
    const rows = hard
      ? [
          ['Part of the net', 'How to find it', 'Value'],
          [`Base edge (${p.u})`, `which number × itself = ${p.base}?`, '__IN:edge__'],
          [`One triangle (${sq(p.u)})`, '½ × base edge × slant height', '__IN:tri__'],
          [`All four triangles (${sq(p.u)})`, '4 × one triangle', '__IN:lat__'],
          [`Surface area (${sq(p.u)})`, 'base + four triangles', '__IN:sa__'],
        ]
      : [
          ['Part of the net', 'How to find it', `Area (${sq(p.u)})`],
          ['Square base', `${p.b} × ${p.b}`, '__IN:base__'],
          ['One triangle', `½ × ${p.b} × ${p.sl}`, '__IN:tri__'],
          ['All four triangles', '4 × one triangle', '__IN:lat__'],
          ['Surface area', 'base + four triangles', '__IN:sa__'],
        ];
    const inputs = [
      hard ? { id: 'edge', answer: p.b } : { id: 'base', answer: p.base },
      { id: 'tri', answer: p.tri },
      { id: 'lat', answer: p.lat },
      { id: 'sa', answer: p.SA },
    ];
    const svg = hard
      ? netSvg(p, { baseLabel: `area ${p.base} ${sq(p.u)}`, aria: `Net of a square pyramid: a square base with area ${p.base} ${sq(p.u)} and four triangles with slant height ${p.sl} ${p.u}` })
      : netSvg(p);
    return {
      type: 'table',
      skill: 'sa-pyramid',
      lesson: '5-8',
      title: 'Faces of the net',
      prompt: hard
        ? `<p>${name} unfolds a square pyramid into this net. The square base has an area of ${hl(p.base + ' ' + sq(p.u))}, and the slant height is ${hl(p.sl + ' ' + p.u)}. The base edge is not labeled.</p>${svg}<p>Complete the table.</p>`
        : `<p>${name} unfolds a square pyramid into this net. The base edge is ${hl(p.b + ' ' + p.u)} and the slant height is ${hl(p.sl + ' ' + p.u)}.</p>${svg}<p>Complete the table.</p>`,
      rows,
      header: true,
      inputs,
      reference: true,
      hints: [
        hard
          ? 'Start with the base edge: the base is a square, so its area is edge × edge. Then work down the table; each row uses the one above it.'
          : 'Work down the table. Each row uses the one above it.',
        hard ? `${p.b} × ${p.b} = ${p.base}. One triangle: half of ${p.b} × ${p.sl}.` : `Base: ${p.b} × ${p.b}. One triangle: half of ${p.b} × ${p.sl} = half of ${p.b * p.sl}.`,
        `Four triangles: 4 × ${p.tri}. Surface area: ${p.base} + that.`,
      ],
      hintEs: hard
        ? 'Empieza con la arista de la base: la base es un cuadrado, así que su área es arista × arista. Luego baja por la tabla; cada fila usa la de arriba.'
        : 'Baja por la tabla. Cada fila usa el resultado de la fila de arriba.',
      solution: `<p>${hard ? `Base edge: <b>${p.b}</b>, because ${p.b} × ${p.b} = ${p.base}.` : `Base: <b>${p.base}</b>.`} One triangle: ½ × ${p.b} × ${p.sl} = <b>${p.tri}</b>. Four triangles: <b>${p.lat}</b>. Surface area: ${p.base} + ${p.lat} = <b>${p.SA}</b> ${sq(p.u)}. The four triangles are identical because the base is a square and the apex is directly above its center.</p>`,
      feedback: {
        correct: 'Correct. The net shows all five faces, and their areas add to the surface area.',
        wrong(ans, d) {
          const e = parseNum(ans.edge),
            t = parseNum(ans.tri),
            sa = parseNum(ans.sa);
          if (hard && near(e, p.base / 4)) return `The base edge is not the area ÷ 4. Find the number that times itself makes ${p.base}.`;
          if (hard && near(e, p.base / 2)) return `The base edge is not half the area. Find the number that times itself makes ${p.base}.`;
          if (d.wrong.includes('base')) return `The base is a square: ${p.b} × ${p.b}.`;
          if (d.wrong.includes('edge')) return `Which whole number times itself makes ${p.base}? That is the base edge.`;
          if (near(t, p.b * p.sl)) return 'One triangle needs the ½: half of base edge × slant height.';
          if (d.wrong.includes('tri')) return `One triangle: ½ × ${p.b} × ${p.sl}. Multiply, then halve.`;
          if (d.wrong.includes('lat')) return 'Four identical triangles: multiply one triangle by 4.';
          if (near(sa, p.lat)) return 'The surface area also includes the square base. Add it to the four triangles.';
          return 'Surface area: add the base area and the four triangles.';
        },
      },
    };
  });

  // ---------- Lateral area: the triangles only (num; hard: base area given plus a vertical-height distractor) ----------
  G.define('g8_lateral', (r, o) => {
    const hard = !!(o && o.hard);
    const p = pyr(r);
    const name = r.pick(NAMES);
    const ctx = r.pick([
      ['glass for the four sides of a pyramid-shaped skylight', 'The skylight sits on the roof, so the base is open and needs no glass.'],
      ['fabric for the sides of a pyramid tent', 'The tent has no floor, so only the four triangular sides need fabric.'],
      ['paint for the sides of a pyramid-shaped monument', 'The base rests on the ground and is not painted.'],
      ['gold leaf for the four faces of a pyramid-shaped roof', 'The roof sits on the building, so the base is not covered.'],
      ['shingles for a pyramid-shaped roof', 'The square bottom is the ceiling, so it gets no shingles.'],
    ]);
    const measures = hard
      ? `The square base has an area of ${hl(p.base + ' ' + sq(p.u))}. The slant height is ${hl(p.sl + ' ' + p.u)}, and the vertical height from the center of the base to the top is ${p.h} ${p.u}.`
      : `The base is a ${hl(p.b + ' ' + p.u)} square, and the slant height is ${hl(p.sl + ' ' + p.u)}.`;
    const svg = hard ? pyrSvg(p, { extra: { baseLabel: `base area ${p.base} ${sq(p.u)}`, aria: `Square pyramid with base area ${p.base} ${sq(p.u)} and slant height ${p.sl} ${p.u}` } }) : pyrSvg(p);
    return {
      type: 'num',
      skill: 'lateral-area',
      lesson: '5-8',
      title: 'Lateral area',
      prompt: `<p>${name} needs ${ctx[0]}. ${ctx[1]} ${measures}</p>${svg}<p>What is the <b>lateral area</b>, the area of the four triangular faces only?</p>`,
      unit: sq(p.u),
      answer: p.lat,
      reference: true,
      hints: hard
        ? [
            `Lateral area means the side faces only. Each triangle needs the base edge: find the number that times itself makes ${p.base}. Use the slant height, not the vertical height.`,
            `${p.b} × ${p.b} = ${p.base}, so the edge is ${p.b}. One triangle: ½ × ${p.b} × ${p.sl} = ${p.tri}.`,
            `Four identical triangles: 4 × ${p.tri}.`,
          ]
        : ['Lateral area means the side faces only. Leave out the base.', `One triangle: ½ × ${p.b} × ${p.sl} = ${p.tri}.`, `Four identical triangles: 4 × ${p.tri}.`],
      hintEs: hard
        ? `El área lateral es solo de las caras laterales. Cada triángulo necesita la arista de la base: busca el número que multiplicado por sí mismo da ${p.base}. Usa la altura inclinada, no la altura vertical.`
        : 'El área lateral es solo de las caras laterales. No incluyas la base.',
      solution: `<p>${hard ? `The base edge is ${p.b}, because ${p.b} × ${p.b} = ${p.base}. ` : ''}One triangular face: ½ × ${p.b} × ${p.sl} = ${p.tri}. Lateral area = 4 × ${p.tri} = <b>${p.lat} ${sq(p.u)}</b>. The base (${p.base} ${sq(p.u)}) is not included because ${ctx[1].charAt(0).toLowerCase() + ctx[1].slice(1)}</p>`,
      feedback: {
        correct: `Correct. 4 × ${p.tri} = ${p.lat} ${sq(p.u)}, sides only.`,
        wrong(ans, d) {
          const v = d.value;
          if (v == null) return 'Lateral area is four triangles, each ½ × base edge × slant height.';
          if (near(v, p.SA)) return 'That includes the base. Lateral area is the four triangles only.';
          if (near(v, p.tri)) return `${p.tri} is one face. There are four identical triangular faces.`;
          if (near(v, 4 * p.b * p.sl)) return `You forgot the ½. Each triangle is half of ${p.b} × ${p.sl}.`;
          if (near(v, 2 * p.b * p.h)) return `You used the vertical height ${p.h}. A triangular face is measured by its slant height, ${p.sl}.`;
          if (hard && near(v, 2 * p.base * p.sl)) return `You used the base area ${p.base} as the edge. The edge is the number that times itself makes ${p.base}.`;
          if (near(v, p.base)) return `${p.base} is the base, which is exactly the part that is not covered.`;
          return 'Lateral area = 4 × (½ × base edge × slant height).';
        },
      },
    };
  });

  // ---------- True or false about lateral area and slant height (tf; hard: subtler claims) ----------
  G.define('g8_tfLateral', (r, o) => {
    const hard = !!(o && o.hard);
    const p = pyr(r);
    const SA2 = round(p.sl * p.sl + 2 * p.b * p.sl, 2);
    const dblSA = round(4 * p.base + 2 * p.lat, 2);
    const easy = [
      {
        stmt: 'The lateral area of a pyramid includes the base.',
        answer: false,
        reasons: [
          { html: 'Lateral means "side." Lateral area counts only the side faces (the triangles). Surface area is lateral area plus the base.', correct: true },
          { html: 'Lateral area includes the base because the base is the largest face.' },
          { html: 'Lateral area is another name for surface area.' },
        ],
      },
      {
        stmt: `A square pyramid with base edge ${p.b} ${p.u} and slant height ${p.sl} ${p.u} has a lateral area of ${p.lat} ${sq(p.u)}.`,
        answer: true,
        reasons: [
          { html: `One triangle is ½ × ${p.b} × ${p.sl} = ${p.tri}, and the four identical triangles give 4 × ${p.tri} = ${p.lat}.`, correct: true },
          { html: `The lateral area should be ${p.b} × ${p.sl} = ${p.b * p.sl}, one face without the ½.` },
          { html: `The lateral area should include the base: ${p.SA}.` },
        ],
      },
      {
        stmt: 'Surface area of a pyramid = lateral area + area of the base.',
        answer: true,
        reasons: [
          { html: 'Surface area is the total of all faces. The lateral area covers the side faces; adding the base covers everything.', correct: true },
          { html: 'Surface area is lateral area × 2, because every face has a matching face.' },
          { html: 'Surface area equals lateral area; the base is never counted.' },
        ],
      },
      {
        stmt: `The slant height of a pyramid is shorter than its vertical height.`,
        answer: false,
        reasons: [
          {
            html: 'The slant height runs up the face from the base edge to the apex. It is the longest side of a right triangle whose other sides are the vertical height and half the base, so it is longer.',
            correct: true,
          },
          { html: 'The slant height is shorter because it leans.' },
          { html: 'The slant height and the vertical height are always equal.' },
        ],
      },
      {
        stmt: `Doubling the slant height of a square pyramid (keeping the base ${p.b} ${p.u}) doubles its lateral area.`,
        answer: true,
        reasons: [
          { html: `Lateral area = 4 × ½ × ${p.b} × slant = ${2 * p.b} × slant. The slant height is a factor, so doubling it doubles the lateral area: ${p.lat} becomes ${2 * p.lat}.`, correct: true },
          { html: 'Doubling the slant height makes the lateral area four times as big.' },
          { html: 'The slant height does not affect lateral area; only the base edge does.' },
        ],
      },
    ];
    const tough = [
      {
        stmt: `A square pyramid has base edge ${p.b} ${p.u} and vertical height ${p.h} ${p.u}. Its lateral area is 4 × ½ × ${p.b} × ${p.h} = ${2 * p.b * p.h} ${sq(p.u)}.`,
        answer: false,
        reasons: [
          { html: `The faces are measured by the slant height, which is longer than the vertical height ${p.h}. Using ${p.h} makes the lateral area too small.`, correct: true },
          { html: `The work is right except that it should include the base, ${p.base} ${sq(p.u)}.` },
          { html: 'The work should not use ½, because the faces of a pyramid are not triangles.' },
        ],
      },
      {
        stmt: `Two square pyramids both have a lateral area of ${p.lat} ${sq(p.u)}. One has base edge ${p.b} and slant height ${p.sl}; the other has base edge ${p.sl} and slant height ${p.b}. They have the same surface area.`,
        answer: false,
        reasons: [
          { html: `The lateral areas match, but the bases do not: ${p.b} × ${p.b} = ${p.base} and ${p.sl} × ${p.sl} = ${round(p.sl * p.sl, 2)}. So the surface areas are ${p.SA} and ${SA2}.`, correct: true },
          { html: 'Equal lateral areas always mean equal surface areas, because the base is not part of surface area.' },
          { html: 'They have the same surface area because they use the same two numbers.' },
        ],
      },
      {
        stmt: `Doubling the base edge of a square pyramid (keeping the slant height ${p.sl} ${p.u}) doubles its surface area.`,
        answer: false,
        reasons: [
          { html: `The four triangles double, but the square base becomes 4 times as big. Surface area goes from ${p.SA} to ${dblSA} ${sq(p.u)}, which is more than double.`, correct: true },
          { html: 'Every face doubles, so the total doubles.' },
          { html: 'Only the base changes; the triangles stay the same size.' },
        ],
      },
      {
        stmt: `A square pyramid with base edge ${p.b} ${p.u} has a surface area of ${p.SA} ${sq(p.u)}. Its lateral area is ${p.SA} − ${p.base} = ${p.lat} ${sq(p.u)}.`,
        answer: true,
        reasons: [
          { html: `Surface area = lateral area + base, so lateral area = surface area − base. The base is ${p.b} × ${p.b} = ${p.base}.`, correct: true },
          { html: `It is true because the lateral area is always the surface area minus 4 × ${p.b}.` },
          { html: `It is true because the lateral area is always half of the surface area.` },
        ],
      },
    ];
    const v = r.pick(hard ? tough : easy);
    const reasons = r.shuffle(v.reasons);
    return {
      type: 'tf',
      skill: 'lateral-area',
      lesson: '5-8',
      title: 'True or false?',
      prompt: `<p>Decide whether the statement is true or false, then choose the best reason.</p><p class="stmt"><b>${v.stmt}</b></p>`,
      answer: v.answer,
      reasons,
      reference: true,
      hints: [
        'Lateral area = the four triangles. Surface area = lateral area + base. Each triangle = ½ × base edge × slant height.',
        `With base ${p.b} and slant ${p.sl}: one triangle ${p.tri}, lateral area ${p.lat}, base ${p.base}, surface area ${p.SA}.`,
        hard ? 'Test the statement with these numbers. Does each part use the slant height and the right faces?' : v.answer ? 'The statement agrees with these facts, so it is true.' : 'The statement contradicts these facts, so it is false.',
      ],
      hintEs: 'Área lateral = los cuatro triángulos. Área total = área lateral + base. Cada triángulo = ½ × arista de la base × altura inclinada.',
      solution: `<p><b>${v.answer ? 'True' : 'False'}.</b> ${reasons.find((x) => x.correct).html}</p>`,
      feedback: {
        correct: 'Correct. Lateral area is the sides only; surface area adds the base.',
        wrong(ans, d) {
          if (!d.valueOk)
            return v.answer
              ? 'Check the numbers again: the statement does follow the formulas lateral area = 4 × ½ × b × slant and surface area = lateral area + b².'
              : 'Test the statement with the formulas: lateral area = 4 × ½ × b × slant, surface area = lateral area + b². One part does not hold.';
          return 'Your true/false is right. Choose the reason that uses lateral area, the base, and the slant height correctly.';
        },
      },
    };
  });

  // ---------- Which expression? surface or lateral (mc; hard: half units and a vertical-height trap) ----------
  G.define('g8_whichExpr', (r, o) => {
    const hard = !!(o && o.hard);
    const p = pyr(r, { hard });
    const lateral = r.chance(0.5);
    const ok = lateral ? `4 × (½ × ${p.b} × ${p.sl})` : `${p.b} × ${p.b} + 4 × (½ × ${p.b} × ${p.sl})`;
    let opts = lateral
      ? [
          { html: ok, ok: true },
          { html: `${p.b} × ${p.b} + 4 × (½ × ${p.b} × ${p.sl})`, why: 'That includes the base. Lateral area is the four triangles only.' },
          { html: `4 × (${p.b} × ${p.sl})`, why: 'Each face is a triangle, so it needs the ½. Without it, each face is doubled.' },
          { html: `½ × ${p.b} × ${p.sl}`, why: 'That is one triangle. The lateral area has four of them.' },
        ]
      : [
          { html: ok, ok: true },
          { html: `4 × (½ × ${p.b} × ${p.sl})`, why: 'That is the lateral area, the four triangles only. Surface area also includes the square base.' },
          { html: `${p.b} × ${p.b} + 4 × (${p.b} × ${p.sl})`, why: 'The triangles need the ½. Each face is ½ × base × slant height.' },
          { html: `5 × (½ × ${p.b} × ${p.sl})`, why: 'This counts five triangles. The fifth face is a square, not a triangle.' },
        ];
    if (hard) {
      opts = lateral
        ? [
            opts[0],
            opts[1],
            { html: `4 × (½ × ${p.b} × ${p.h})`, why: `${p.h} is the vertical height, inside the pyramid. Each triangular face uses the slant height ${p.sl}.` },
            { html: `2 × (½ × ${p.b} × ${p.sl})`, why: 'A square pyramid has four triangular faces, not two.' },
          ]
        : [
            opts[0],
            { html: `${p.b} × ${p.b} + 4 × (½ × ${p.b} × ${p.h})`, why: `${p.h} is the vertical height, inside the pyramid. Each triangular face uses the slant height ${p.sl}.` },
            { html: `4 × ${p.b} + 4 × (½ × ${p.b} × ${p.sl})`, why: `4 × ${p.b} is the distance around the base. The base face needs its area, ${p.b} × ${p.b}.` },
            opts[1],
          ];
    }
    const sh = shuffleOptions(r, opts, 0);
    return {
      type: 'mc',
      skill: 'lateral-area',
      lesson: '5-8',
      title: lateral ? 'Choose the lateral area expression' : 'Choose the surface area expression',
      prompt: `<p>A square pyramid has a base edge of ${hl(p.b + ' ' + p.u)} and a slant height of ${hl(p.sl + ' ' + p.u)}.${hard ? ` Its vertical height is ${p.h} ${p.u}.` : ''}</p>${pyrSvg(p, { extra: { width: 240, height: 190 } })}<p>Which expression gives its <b>${lateral ? 'lateral area' : 'total surface area'}</b> in ${sq(p.u)}?</p>`,
      options: sh.options,
      answer: sh.answer,
      reference: true,
      hints: [
        lateral ? 'Lateral area is the side faces only: four triangles, no base.' : 'Surface area is every face: the square base plus four triangles.',
        `Each triangle is ½ × ${p.b} × ${p.sl}, using the slant height. The base is ${p.b} × ${p.b}.`,
        lateral ? 'Look for four triangles with the slant height and no base.' : 'Look for the base area plus four triangles with the slant height.',
      ],
      hintEs: lateral ? 'El área lateral es solo de las caras laterales: cuatro triángulos, sin la base.' : 'El área total incluye todas las caras: la base cuadrada más cuatro triángulos.',
      solution: `<p><b>${ok}</b> = ${lateral ? p.lat : p.SA} ${sq(p.u)}. ${lateral ? 'Lateral area leaves out the base and counts the four triangular faces, each ½ × base edge × slant height.' : 'Surface area adds the square base to the four triangular faces, each ½ × base edge × slant height.'}</p>`,
      feedback: {
        correct: lateral ? 'Correct. Four triangles, no base.' : 'Correct. Square base plus four triangles.',
        wrong: (ans) => (sh.options[ans] && sh.options[ans].why) || (lateral ? 'Lateral area: four triangles with the slant height, no base.' : 'Surface area: the base area plus four triangles with the slant height.'),
      },
    };
  });

  // ---------- Match terms (match; hard: always numbers, half units, vertical height as a distractor) ----------
  G.define('g8_matchTerms', (r, o) => {
    const hard = !!(o && o.hard);
    const p = pyr(r, { hard });
    let pairs;
    if (!hard && r.chance(0.5)) {
      pairs = [
        ['Slant height', 'The height of one triangular face, from the base edge up to the apex'],
        ['Lateral area', 'The area of the four triangular faces only'],
        ['Surface area', 'Lateral area plus the area of the base'],
        ['Apex', 'The point at the top where the triangular faces meet'],
      ];
    } else {
      // numeric version; the four values are distinct because slant ≠ 2 × base edge and base edge ≠ slant ÷ 2 for every triple used
      pairs = [
        [hard ? 'Area of the base' : `Area of the base (${p.b} × ${p.b})`, `${p.base} ${sq(p.u)}`],
        [hard ? 'One triangular face' : `One triangular face (½ × ${p.b} × ${p.sl})`, `${p.tri} ${sq(p.u)}`],
        ['Lateral area (4 triangles)', `${p.lat} ${sq(p.u)}`],
        ['Total surface area', `${p.SA} ${sq(p.u)}`],
      ];
    }
    const right = r.shuffle(pairs.map((x, i) => i));
    return {
      type: 'match',
      skill: 'lateral-area',
      lesson: '5-8',
      title: 'Match the pyramid terms',
      prompt: `<p>A square pyramid has base edge ${hl(p.b + ' ' + p.u)} and slant height ${hl(p.sl + ' ' + p.u)}.${hard ? ` Its vertical height is ${p.h} ${p.u}.` : ''}</p>${pyrSvg(p, { extra: { width: 220, height: 170 } })}<p>Match each ${hard ? 'measure to its value. Work out each value yourself first.' : 'term to its meaning or value.'}</p>`,
      left: pairs.map((x) => x[0]),
      right: right.map((i) => pairs[i][1]),
      pairs: pairs.map((x, i) => [i, right.indexOf(i)]),
      reference: true,
      hints: [
        hard
          ? 'Find the base (edge × edge) and one face (½ × edge × slant height) first. The vertical height is not used for any face.'
          : 'Lateral means side. The slant height belongs to a face; the apex is the top point.',
        `Base ${p.b} × ${p.b} = ${p.base}. One triangle ½ × ${p.b} × ${p.sl} = ${p.tri}.`,
        `Lateral area: 4 × ${p.tri}. Surface area: ${p.base} + the lateral area.`,
      ],
      hintEs: hard
        ? 'Primero halla la base (arista × arista) y una cara (½ × arista × altura inclinada). La altura vertical no se usa para ninguna cara.'
        : 'Lateral quiere decir "del lado". La altura inclinada pertenece a una cara; el vértice de arriba (ápice) es el punto más alto.',
      solution: `<ul>${pairs.map((x) => `<li>${x[0]} → <b>${x[1]}</b></li>`).join('')}</ul><p>Lateral area counts the four triangles; surface area adds the base to them.</p>`,
      feedback: {
        correct: 'Correct. Lateral area is the sides; surface area adds the base; slant height measures a face.',
        wrong(ans, d) {
          const bad = d.wrong && d.wrong[0];
          if (bad == null) return 'Start with the base and one triangle, then build lateral area and surface area from them.';
          if (pairs[bad][0] === 'Lateral area (4 triangles)') return 'Lateral area is the four triangles together, with no base. Multiply one face by 4.';
          if (pairs[bad][0] === 'Total surface area') return 'Total surface area is the largest value: the base plus all four triangles.';
          if (/^One triangular/.test(pairs[bad][0])) return 'One face is ½ × base edge × slant height, the smallest triangle value.';
          return `Check "${pairs[bad][0]}." ${bad === 0 ? 'Start here and build the others from it.' : 'It is built from the row above it.'}`;
        },
      },
    };
  });
})(typeof window !== 'undefined' ? window : globalThis);

/* js/units/u5/gen-cave-lib.js */
/* Optional zone — The Undercroft. Harder, mixed-skill challenge generators (prefix gc_). */
/* Shared helpers for gen-cave.js and gen-cave-2.js (split for size). */
(function (root) {
  'use strict';
  const RX = root.RX;
  const { G, V, shuffleOptions, NAMES, round, fmt, parseNum, U5 } = RX;
  const hl = V.hl;
  const C = V.COLORS;
  const sq = U5.sq,
    cu = U5.cu;

  // ---------- Mini figures (160 × 110) for seq / ms items ----------
  const MINI = { width: 160, height: 110 };
  function miniPara(b, h, u, side) {
    const off = side ? Math.sqrt(side * side - h * h) : b * 0.3;
    const hx = off + b * 0.55;
    return V.figure(
      Object.assign(
        {
          pts: [
            [0, 0],
            [b, 0],
            [b + off, h],
            [off, h],
          ],
          dashes: [[hx, 0, hx, h, C.d]],
          rightAngles: [[hx, 0, 1, 1]],
          labels: [
            { x: b / 2, y: 0, text: `${fmt(b)} ${u}`, dy: 18, size: 12 },
            { x: hx, y: h / 2, text: `${fmt(h)} ${u}`, anchor: 'start', dx: 6, color: C.d, size: 12 },
          ].concat(side ? [{ x: off / 2, y: h / 2, text: `${fmt(side)} ${u}`, anchor: 'end', dx: -6, size: 12 }] : []),
          aria: `Parallelogram, base ${fmt(b)} ${u}, height ${fmt(h)} ${u}${side ? ', slanted side ' + fmt(side) + ' ' + u : ''}`,
        },
        MINI,
      ),
    );
  }
  function miniTri(b, h, u) {
    const apex = b * 0.35;
    return V.figure(
      Object.assign(
        {
          pts: [
            [0, 0],
            [b, 0],
            [apex, h],
          ],
          dashes: [[apex, 0, apex, h, C.d]],
          rightAngles: [[apex, 0, 1, 1]],
          labels: [
            { x: b / 2, y: 0, text: `${fmt(b)} ${u}`, dy: 18, size: 12 },
            { x: apex, y: h / 2, text: `${fmt(h)} ${u}`, anchor: 'start', dx: 6, color: C.d, size: 12 },
          ],
          aria: `Triangle, base ${fmt(b)} ${u}, height ${fmt(h)} ${u}`,
        },
        MINI,
      ),
    );
  }
  function miniTrap(b1, b2, h, u) {
    const off = (b1 - b2) / 2,
      hx = off + b2 * 0.5;
    return V.figure(
      Object.assign(
        {
          pts: [
            [0, 0],
            [b1, 0],
            [b1 - off, h],
            [off, h],
          ],
          dashes: [[hx, 0, hx, h, C.d]],
          rightAngles: [[hx, 0, 1, 1]],
          labels: [
            { x: b1 / 2, y: 0, text: `${fmt(b1)} ${u}`, dy: 18, size: 12 },
            { x: b1 / 2, y: h, text: `${fmt(b2)} ${u}`, dy: -6, size: 12 },
            { x: hx, y: h / 2, text: `${fmt(h)} ${u}`, anchor: 'start', dx: 6, color: C.d, size: 12 },
          ],
          aria: `Trapezoid, bases ${fmt(b1)} ${u} and ${fmt(b2)} ${u}, height ${fmt(h)} ${u}`,
        },
        MINI,
      ),
    );
  }
  function miniRect(w, h, u) {
    return V.figure(
      Object.assign(
        {
          pts: [
            [0, 0],
            [w, 0],
            [w, h],
            [0, h],
          ],
          labels: [
            { x: w / 2, y: 0, text: `${fmt(w)} ${u}`, dy: 18, size: 12 },
            { x: w, y: h / 2, text: `${fmt(h)} ${u}`, anchor: 'start', dx: 6, size: 12 },
          ],
          aria: `Rectangle, ${fmt(w)} ${u} by ${fmt(h)} ${u}`,
        },
        MINI,
      ),
    );
  }

  const near2 = (a, b) => a != null && Math.abs(a - b) < 0.01;

  // ---------- Missing base of a trapezoid from its area (num) ----------
  // Hard: half-unit bases (decimal answer) and a slanted leg in the prompt as a distractor.
  // ---------- Trapezoid with a cut-out (num) ----------
  // Hard: a half-unit top base and a triangular cut-out (the hole needs its own ½).
  // ---------- Order mixed figures by area (seq) ----------
  // Hard: four figures, a half-unit triangle area, and a parallelogram that shows its slanted side as a trap.
  // ---------- Prism built from small cubes (num) ----------
  // Normal: ½-unit cubes. Hard: ¼-unit cubes (each cube is 1/64 of a cubic unit).
  // ---------- Who matched cover vs fill correctly? (who) ----------
  // Hard: an open-top box (5 faces to cover) with a half-unit length; a 4th student covers all 6 faces.
  // ---------- Missing dimension from surface area: cube edge or pyramid slant (num) ----------
  // Hard: cube edge is a half unit; pyramid gives the base AREA (not the edge) and has a half-unit slant height.
  // ---------- Error in a triangular prism net (error) ----------
  // Hard: a scalene triangle (two different slanted sides) and a third, subtler mistake (one slanted side used twice).
  // ---------- Select all figures with the same area (ms) ----------
  // Hard: half-unit measurements and targets that are not benchmark numbers.
  RX._lib = RX._lib || {};
  RX._lib['u5/gen-cave'] = { G, V, shuffleOptions, NAMES, round, fmt, parseNum, U5, hl, C, sq, cu, MINI, miniPara, miniTri, miniTrap, miniRect, near2 };
})(typeof window !== 'undefined' ? window : globalThis);

/* js/units/u5/gen-cave.js */
/* Optional zone — The Undercroft. Harder, mixed-skill challenge generators (prefix gc_). */
(function (root) {
  'use strict';
  const RX = root.RX;
  const { G, V, shuffleOptions, NAMES, round, fmt, parseNum, U5, hl, C, sq, cu, MINI, miniPara, miniTri, miniTrap, miniRect, near2 } = RX._lib['u5/gen-cave'];

  G.define('gc_missingBase', (r, o) => {
    const hard = !!(o && o.hard);
    const u = r.pick(U5.UNITS),
      name = r.pick(NAMES);
    let b2, b1, h;
    if (hard) {
      b2 = r.int(4, 11) + 0.5;
      b1 = b2 + 2 * r.int(2, 5);
      h = r.int(3, 9);
    } else {
      b2 = r.int(3, 10);
      b1 = b2 + r.int(2, 9);
      h = r.int(3, 9);
      if (((b1 + b2) * h) % 2) h += 1;
    }
    const sum = b1 + b2;
    const A = round((sum * h) / 2, 2);
    const leg = round(Math.sqrt(((b1 - b2) / 2) ** 2 + h * h), 1);
    const askLong = r.chance(0.5);
    const known = askLong ? b2 : b1,
      want = askLong ? b1 : b2;
    const svg = V.trapezoid(b1, b2, h, {
      b1: askLong ? `? ${u}` : `${fmt(b1)} ${u}`,
      b2: askLong ? `${fmt(b2)} ${u}` : `? ${u}`,
      height: `${h} ${u}`,
      aria: `Trapezoid with one base ${fmt(known)} ${u}, height ${h} ${u}, and an unknown base`,
    });
    const obj = r.pick(['keystone', 'garden plot', 'stage platform', 'window', 'wall panel']);
    const legTxt = hard ? ` Each slanted side is ${fmt(leg)} ${u} long.` : '';
    return {
      type: 'num',
      skill: 'trapezoid-formula',
      lesson: '5-3',
      title: hard ? 'Missing base (half units)' : 'Missing base',
      prompt: `<p>${name}'s trapezoid-shaped ${obj} has an area of ${hl(fmt(A) + ' ' + sq(u))} and a height of ${hl(h + ' ' + u)}. One base is ${hl(fmt(known) + ' ' + u)}. The other base is unknown.${legTxt}</p>${svg}<p>What is the length of the unknown base?</p>`,
      unit: u,
      answer: want,
      reference: true,
      hints: [
        'Start from A = ½ × (b₁ + b₂) × h and undo each step. First undo the ½ by doubling the area.' + (hard ? ' The slanted side is not the height, so it is not used.' : ''),
        `2 × ${fmt(A)} = ${fmt(2 * A)}. That equals (b₁ + b₂) × ${h}. Divide by the height to get the sum of the bases.`,
        `${fmt(2 * A)} ÷ ${h} = ${fmt(sum)}. The bases add to ${fmt(sum)}; now subtract the known base ${fmt(known)}.`,
      ],
      hintEs: 'Empieza con A = ½ × (b₁ + b₂) × h y deshaz cada paso. Primero deshaz el ½: multiplica el área por 2.' + (hard ? ' El lado inclinado no es la altura, así que no lo uses.' : ''),
      solution: `<p>2 × A = ${fmt(2 * A)} = (b₁ + b₂) × ${h}, so b₁ + b₂ = ${fmt(2 * A)} ÷ ${h} = ${fmt(sum)}. The unknown base is ${fmt(sum)} − ${fmt(known)} = <b>${fmt(want)} ${u}</b>. Check: ½ × (${fmt(b1)} + ${fmt(b2)}) × ${h} = ${fmt(A)}.${hard ? ` The slanted side (${fmt(leg)} ${u}) plays no part: the formula uses the perpendicular height.` : ''} Working backward undoes the formula one operation at a time.</p>`,
      feedback: {
        correct: `Correct. The bases add to ${fmt(sum)}, so the missing one is ${fmt(want)} ${u}.`,
        wrong(ans, d) {
          const v = d.value;
          if (v == null) return 'Double the area, divide by the height, then subtract the known base.';
          if (near2(v, A / h - known)) return `You forgot to undo the ½. Double the area first: 2 × ${fmt(A)} = ${fmt(2 * A)}.`;
          if (near2(v, sum)) return `${fmt(sum)} is the sum of both bases. Subtract the known base ${fmt(known)}.`;
          if (near2(v, A / h)) return `${fmt(A / h)} is the average of the two bases (half their sum). Double it to get the sum, then subtract ${fmt(known)}.`;
          if (hard && near2(v, (2 * A) / leg - known)) return `You divided by the slanted side (${fmt(leg)}). The formula uses the height, ${h} ${u}, which meets the bases at a right angle.`;
          return 'Undo the formula in order: double the area, divide by the height, then subtract the base you know.';
        },
      },
    };
  });

  G.define('gc_compositeTrap', (r, o) => {
    const hard = !!(o && o.hard);
    const u = r.pick(U5.UNITS),
      name = r.pick(NAMES);
    let b2, b1, h;
    for (let t = 0; t < 40; t++) {
      b2 = r.int(6, 10) + (hard ? 0.5 : 0);
      b1 = b2 + 2 * r.int(1, 4);
      h = r.int(5, 9);
      if (hard || ((b1 + b2) * h) % 2 === 0) break;
    }
    const w = r.int(2, Math.floor(b2) - 3),
      k = r.int(2, h - 3);
    const trap = round(((b1 + b2) * h) / 2, 2),
      hole = round(hard ? (w * k) / 2 : w * k, 2),
      A = round(trap - hole, 2);
    const off = (b1 - b2) / 2;
    const x0 = (b1 - w) / 2,
      y0 = 1.5;
    const holePoly = hard
      ? [
          [x0, y0],
          [x0 + w, y0],
          [x0 + w / 2, y0 + k],
        ]
      : [
          [x0, y0],
          [x0 + w, y0],
          [x0 + w, y0 + k],
          [x0, y0 + k],
        ];
    const svg = V.figure({
      pts: [
        [0, 0],
        [b1, 0],
        [b1 - off, h],
        [off, h],
      ],
      polys: [
        [
          [0, 0],
          [b1, 0],
          [b1 - off, h],
          [off, h],
        ],
        holePoly,
      ],
      fills: [C.a, '#ffffff'],
      dashes: [[b1 - off - 0.01, 0, b1 - off - 0.01, h, C.d]].concat(hard ? [[x0 + w / 2, y0, x0 + w / 2, y0 + k, C.d]] : []),
      rightAngles: [[b1 - off - 0.01, 0, -1, 1]],
      labels: [
        { x: b1 / 2, y: 0, text: `${fmt(b1)} ${u}`, dy: 20 },
        { x: b1 / 2, y: h, text: `${fmt(b2)} ${u}`, dy: -8 },
        { x: b1 - off, y: h / 2, text: `${h} ${u}`, anchor: 'start', dx: 8, color: C.d },
        hard ? { x: x0 + w / 2, y: y0, text: `${w} ${u}`, dy: 14, size: 11 } : { x: x0 + w / 2, y: y0 + k, text: `${w} ${u}`, dy: -5, size: 11 },
        hard ? { x: x0 + w / 2, y: y0 + k / 2, text: `${k} ${u}`, anchor: 'start', dx: 5, size: 11, color: C.d } : { x: x0 + w, y: y0 + k / 2, text: `${k} ${u}`, anchor: 'start', dx: 5, size: 11 },
      ],
      aria: `Trapezoid with bases ${fmt(b1)} ${u} and ${fmt(b2)} ${u} and height ${h} ${u}, with a ${hard ? `triangle of base ${w} and height ${k}` : `${w} by ${k} rectangle`} cut out of the middle`,
    });
    const ctx = r.pick([
      ['the end wall of a shed', 'a window', 'siding'],
      ['a trapezoid-shaped sign', 'a cut-out for a clock', 'paint'],
      ['a garden wall', 'a gate opening', 'stone'],
      ['a stage backdrop', 'a doorway', 'fabric'],
    ]);
    const holeTxt = hard ? `a triangle with base ${hl(w + ' ' + u)} and height ${hl(k + ' ' + u)}` : `a ${hl(w + ' ' + u)} by ${hl(k + ' ' + u)} rectangle`;
    const holeHow = hard ? `½ × ${w} × ${k}` : `${w} × ${k}`;
    return {
      type: 'num',
      skill: 'composite-figures',
      lesson: '5-4',
      title: hard ? 'Trapezoid with a triangular cut-out' : 'Trapezoid with a cut-out',
      prompt: `<p>${name} is covering ${ctx[0]} with ${ctx[2]}. The wall is a trapezoid with bases ${hl(fmt(b1) + ' ' + u)} and ${hl(fmt(b2) + ' ' + u)} and height ${hl(h + ' ' + u)}. In the middle is ${ctx[1]}, ${holeTxt}, that is not covered.</p>${svg}<p>How much area gets covered?</p>`,
      unit: sq(u),
      answer: A,
      reference: true,
      hints: [
        `Find the whole trapezoid first, then subtract the ${hard ? 'triangular' : 'rectangular'} hole.`,
        `Trapezoid: ½ × (${fmt(b1)} + ${fmt(b2)}) × ${h} = ${fmt(trap)}. Hole: ${holeHow} = ${fmt(hole)}.`,
        `Now subtract the hole from the trapezoid: ${fmt(trap)} − ${fmt(hole)}.`,
      ],
      hintEs: `Primero halla el área del trapecio completo. Después resta el hueco ${hard ? 'triangular' : 'rectangular'}.`,
      solution: `<p>Trapezoid: ½ × (${fmt(b1)} + ${fmt(b2)}) × ${h} = ½ × ${fmt(b1 + b2)} × ${h} = ${fmt(trap)}. Cut-out: ${holeHow} = ${fmt(hole)}. Covered area: ${fmt(trap)} − ${fmt(hole)} = <b>${fmt(A)} ${sq(u)}</b>. Whole minus hole works for any shape of hole, as long as the hole is fully inside.</p>`,
      feedback: {
        correct: `Correct. ${fmt(trap)} − ${fmt(hole)} = ${fmt(A)} ${sq(u)}.`,
        wrong(ans, d) {
          const v = d.value;
          if (v == null) return 'Trapezoid area minus the area of the hole.';
          if (near2(v, trap)) return `${fmt(trap)} is the whole trapezoid. The opening is not covered: subtract its area.`;
          if (near2(v, trap + hole)) return 'You added the hole. It is removed, so subtract.';
          if (hard && near2(v, trap - w * k)) return `The hole is a triangle, so it needs its own ½: ½ × ${w} × ${k}, not ${w} × ${k}.`;
          if (near2(v, (b1 + b2) * h - hole)) return `You forgot the ½ in the trapezoid formula. Use ½ × (b₁ + b₂) × h.`;
          if (near2(v, b1 * h - hole)) return `${fmt(b1)} × ${h} is a rectangle, not the trapezoid. Use ½ × (${fmt(b1)} + ${fmt(b2)}) × ${h}.`;
          return 'Find the trapezoid with ½ × (b₁ + b₂) × h, find the hole with its own formula, then subtract.';
        },
      },
    };
  });

  G.define('gc_seqMixed', (r, o) => {
    const hard = !!(o && o.hard);
    const u = r.pick(U5.UNITS);
    let figs;
    for (let tries = 0; tries < 80; tries++) {
      const pb = r.int(4, 9),
        ph = r.int(3, 7);
      const tb = hard ? 2 * r.int(3, 6) + 1 : r.int(6, 12),
        th = hard ? 2 * r.int(2, 4) + 1 : 2 * r.int(2, 5);
      const z2 = r.int(3, 7),
        z1 = z2 + 2 * r.int(1, 3),
        zh = r.int(3, 7);
      figs = [
        { kind: 'parallelogram', html: miniPara(pb, ph, u), A: pb * ph, alt: pb * ph, how: `${pb} × ${ph}` },
        { kind: 'triangle', html: miniTri(tb, th, u), A: (tb * th) / 2, alt: (tb * th) / 2, how: `½ × ${tb} × ${th}` },
        { kind: 'trapezoid', html: miniTrap(z1, z2, zh, u), A: ((z1 + z2) * zh) / 2, alt: ((z1 + z2) * zh) / 2, how: `½ × (${z1} + ${z2}) × ${zh}` },
      ];
      if (hard) {
        const [sh, ss] = r.pick([
          [4, 5],
          [3, 5],
          [6, 10],
          [8, 10],
        ]);
        const sb = r.int(4, 8);
        figs.push({ kind: 'slanted parallelogram', html: miniPara(sb, sh, u, ss), A: sb * sh, alt: sb * ss, how: `${sb} × ${sh}` });
      }
      const As = figs.map((f) => f.A);
      const alts = figs.map((f) => f.alt);
      if (new Set(As).size === figs.length && (!hard || new Set(alts).size === figs.length) && figs.every((f) => Number.isInteger(f.A * 2))) {
        // hard: the slanted-side trap must actually change the order
        if (!hard) break;
        const o1 = figs
          .map((_, i) => i)
          .sort((a, b) => As[a] - As[b])
          .join();
        const o2 = figs
          .map((_, i) => i)
          .sort((a, b) => alts[a] - alts[b])
          .join();
        if (o1 !== o2) break;
      }
    }
    const n = figs.length;
    const asc = r.chance(0.5);
    const items = figs.map((f) => ({ html: f.html + `<div class="muted">${f.kind}</div>`, rate: f.A }));
    const idx = figs.map((_, i) => i);
    const order = idx.slice().sort((a, b) => (asc ? items[a].rate - items[b].rate : items[b].rate - items[a].rate));
    const slantOrder = idx.slice().sort((a, b) => (asc ? figs[a].alt - figs[b].alt : figs[b].alt - figs[a].alt));
    const shuffledList = r.shuffle(idx.slice());
    return {
      type: 'seq',
      skill: 'composite-figures',
      lesson: '5-4',
      title: hard ? 'Order four figures by area' : 'Order mixed figures by area',
      prompt: `<p>Order the ${n === 4 ? 'four' : 'three'} figures from <b>${asc ? 'least' : 'greatest'}</b> area (top) to <b>${asc ? 'greatest' : 'least'}</b> area (bottom). Each kind of figure uses its own formula.${hard ? ' Watch for a slanted side that is not a height.' : ''}</p>`,
      items,
      order,
      reference: true,
      hints: [
        'Parallelogram: b × h. Triangle: ½ × b × h. Trapezoid: ½ × (b₁ + b₂) × h. Compute every area before ordering.' + (hard ? ' Use the dashed height, never the slanted side.' : ''),
        `Areas: ${shuffledList.map((i) => `${figs[i].kind} ${figs[i].how} = ${fmt(figs[i].A)}`).join('; ')}.`,
        `Now compare those ${n} areas and put the ${asc ? 'least' : 'greatest'} one at the top.`,
      ],
      hintEs: 'Paralelogramo: b × h. Triángulo: ½ × b × h. Trapecio: ½ × (b₁ + b₂) × h. Calcula todas las áreas antes de ordenar.' + (hard ? ' Usa la altura punteada, nunca el lado inclinado.' : ''),
      solution: `<p>${figs.map((f) => `${f.kind}: ${f.how} = ${fmt(f.A)} ${sq(u)}`).join('; ')}. From ${asc ? 'least to greatest' : 'greatest to least'}: <b>${order.map((i) => figs[i].kind + ' (' + fmt(figs[i].A) + ')').join(', ')}</b>. The pictures are not to scale with each other, so only the formulas can tell.</p>`,
      feedback: {
        correct: 'Correct. Compute each area with its own formula, then compare.',
        wrong(ans) {
          const a = Array.isArray(ans) ? ans.join() : '';
          if (a === order.slice().reverse().join()) return `Your order is exactly backward. The ${asc ? 'least' : 'greatest'} area goes at the top.`;
          if (hard && a === slantOrder.join()) return 'You used the slanted side of one parallelogram as its height. Its area is base × the dashed height, which is smaller.';
          return `Compute each area with its own formula first (remember the ½ for triangles and trapezoids). Then put the ${asc ? 'least' : 'greatest'} at the top.`;
        },
      },
    };
  });

  G.define('gc_volumeTwoFrac', (r, o) => {
    const hard = !!(o && o.hard);
    const u = r.pick(['cm', 'in']);
    const name = r.pick(NAMES);
    const k = hard ? 4 : 2; // cubes per unit along an edge
    let n1, n2, n3;
    if (hard) {
      do {
        n1 = r.int(3, 12);
        n2 = r.int(2, 8);
        n3 = r.int(2, 8);
      } while ((n1 * n2 * n3) % 16);
    } else {
      n1 = r.int(2, 6);
      n2 = r.int(2, 5);
      n3 = r.int(2, 6);
      if ((n1 * n2 * n3) % 2) n1 += 1; // keep the volume to at most 2 decimals
    }
    const cubes = n1 * n2 * n3;
    const per = k * k * k;
    const Vv = round(cubes / per, 2);
    const l = n1 / k,
      w = n2 / k,
      h = n3 / k;
    const e = hard ? '¼' : '½';
    const eNum = hard ? 0.25 : 0.5;
    const one = hard ? '1/64' : '⅛';
    const svg = V.prism({
      l: n1,
      w: n2,
      h: n3,
      labels: { l: `${n1} cubes`, w: `${n2} cubes`, h: `${n3} cubes` },
      aria: `Prism built from small cubes: ${n1} cubes long, ${n2} cubes wide, ${n3} cubes tall`,
    });
    return {
      type: 'num',
      skill: 'fractional-edges',
      lesson: '5-5',
      title: hard ? 'Built from quarter-unit cubes' : 'Built from half-unit cubes',
      prompt: `<p>${name} builds a solid from small cubes. Each small cube has edges of ${hl(e + ' ' + u)}. The solid is ${hl(n1 + ' cubes')} long, ${hl(n2 + ' cubes')} wide, and ${hl(n3 + ' cubes')} tall.</p>${svg}<p>What is the volume of the solid in ${cu(u)}?</p>`,
      unit: cu(u),
      answer: Vv,
      reference: true,
      hints: [
        `Each edge of the solid is a number of cubes times ${e} ${u}. Find the three edge lengths first.`,
        `Length ${n1} × ${e} = ${U5.mixed(l)} ${u}. Width ${n2} × ${e} = ${U5.mixed(w)} ${u}. Height ${n3} × ${e} = ${U5.mixed(h)} ${u}.`,
        `Now multiply the three edges: ${fmt(l)} × ${fmt(w)} × ${fmt(h)}. (Or: ${cubes} small cubes, each ${e} × ${e} × ${e} = ${one} ${cu(u)}.)`,
      ],
      hintEs: `Cada arista del sólido es un número de cubos por ${e} ${u}. Primero halla la longitud de las tres aristas.`,
      solution: `<p>Edges: ${U5.mixed(l)} ${u}, ${U5.mixed(w)} ${u}, ${U5.mixed(h)} ${u}. V = ${fmt(l)} × ${fmt(w)} × ${fmt(h)} = <b>${fmt(Vv)} ${cu(u)}</b>. Another way: there are ${n1} × ${n2} × ${n3} = ${cubes} small cubes, and each has volume ${e} × ${e} × ${e} = ${one} ${cu(u)}, so ${cubes} ÷ ${per} = ${fmt(Vv)}. Counting cubes only gives the volume directly when the cubes are unit cubes.</p>`,
      feedback: {
        correct: `Correct. ${fmt(l)} × ${fmt(w)} × ${fmt(h)} = ${fmt(Vv)} ${cu(u)}, or ${cubes} cubes of ${one} ${cu(u)} each.`,
        wrong(ans, d) {
          const v = d.value;
          if (v == null) return `Each edge is the cube count × ${e} ${u}. Multiply the three edges.`;
          if (near2(v, cubes)) return `${cubes} is the number of small cubes. Each one is only ${one} ${cu(u)} because its edges are ${e} ${u}, not 1 ${u}.`;
          if (near2(v, cubes * eNum)) return `You scaled only one edge by ${e}. All three edges are in ${e}-units, so each cube is ${e} × ${e} × ${e} = ${one} ${cu(u)}.`;
          if (near2(v, cubes * eNum * eNum)) return `You scaled two edges by ${e} but not the third. Length, width, and height are all in ${e}-units.`;
          if (hard && near2(v, round(cubes / 8, 2))) return 'You treated the cubes as ½-unit cubes. These edges are ¼ unit, so 4 cubes make 1 unit along each edge.';
          return `Turn each cube count into a length (× ${e}), then multiply the three lengths.`;
        },
      },
    };
  });
})(typeof window !== 'undefined' ? window : globalThis);

/* js/units/u5/gen-cave-2.js */
/* Optional zone — The Undercroft. Harder, mixed-skill challenge generators (prefix gc_). */
(function (root) {
  'use strict';
  const RX = root.RX;
  const { G, V, shuffleOptions, NAMES, round, fmt, parseNum, U5, hl, C, sq, cu, MINI, miniPara, miniTri, miniTrap, miniRect, near2 } = RX._lib['u5/gen-cave'];

  G.define('gc_whoCoverFill', (r, o) => {
    const hard = !!(o && o.hard);
    const u = r.pick(U5.UNITS);
    const l = r.int(3, 8) + (hard ? 0.5 : 0),
      w = r.int(2, 6),
      h = r.int(2, 6);
    const lw = round(l * w, 2),
      lh = round(l * h, 2),
      wh = w * h;
    const SA6 = round(2 * (lw + lh + wh), 2);
    const SA = hard ? round(lw + 2 * lh + 2 * wh, 2) : SA6;
    const Vv = round(l * w * h, 2);
    const [n1, n2, n3, n4] = r.pickN(NAMES, 4);
    const ctx = r.pick([
      ['paint the outside', 'fill it with sand'],
      ['line the outside with paper', 'fill it with water'],
      ['cover the outside in tiles', 'fill it with soil'],
      ['cover the outside with fabric', 'fill it with packing foam'],
    ]);
    const saRight = hard ? `${fmt(lw)} + 2(${fmt(lh)}) + 2(${wh})` : `2(${fmt(lw)}) + 2(${fmt(lh)}) + 2(${wh})`;
    const volStr = `${fmt(l)} × ${w} × ${h}`;
    const card = (a, b) => `To ${ctx[0]}: ${a}<br>To ${ctx[1]}: ${b}`;
    const opts = [
      { title: n1, html: card(`surface area = ${saRight} = <b>${fmt(SA)} ${sq(u)}</b>`, `volume = ${volStr} = <b>${fmt(Vv)} ${cu(u)}</b>`), ok: true },
      {
        title: n2,
        html: card(`volume = ${volStr} = <b>${fmt(Vv)} ${cu(u)}</b>`, `surface area = ${saRight} = <b>${fmt(SA)} ${sq(u)}</b>`),
        why: `${n2} swapped them. Covering the outside is surface area (${sq(u)}); filling the inside is volume (${cu(u)}).`,
      },
      {
        title: n3,
        html: card(`surface area = ${fmt(lw)} + ${fmt(lh)} + ${wh} = <b>${fmt(round(lw + lh + wh, 2))} ${sq(u)}</b>`, `volume = ${volStr} = <b>${fmt(Vv)} ${cu(u)}</b>`),
        why: `${n3} chose the right measurements but counted only three faces. The front, back, and ${hard ? 'side' : 'top-bottom'} faces come in matching pairs.`,
      },
    ];
    if (hard)
      opts.push({
        title: n4,
        html: card(`surface area = 2(${fmt(lw)}) + 2(${fmt(lh)}) + 2(${wh}) = <b>${fmt(SA6)} ${sq(u)}</b>`, `volume = ${volStr} = <b>${fmt(Vv)} ${cu(u)}</b>`),
        why: `${n4} covered all six faces, but the box has no lid. Only one ${fmt(l)} by ${w} face (the bottom) gets covered.`,
      });
    const sh = shuffleOptions(r, opts, 0);
    const lidTxt = hard ? ' The box is <b>open on top</b> (it has no lid).' : '';
    return {
      type: 'who',
      skill: 'sa-rect-prism',
      lesson: '5-7',
      title: hard ? 'Cover the open box or fill it?' : 'Cover it or fill it?',
      prompt: `<p>A box is ${hl(fmt(l) + ' ' + u)} long, ${hl(w + ' ' + u)} wide, and ${hl(h + ' ' + u)} tall.${lidTxt} ${hard ? 'Four' : 'Three'} students work out how much is needed to <b>${ctx[0]}</b> and how much to <b>${ctx[1]}</b>.</p>${V.prism({ l, w, h, labels: { l: `${fmt(l)} ${u}`, w: `${w} ${u}`, h: `${h} ${u}` }, width: 240, height: 180, aria: `Box ${fmt(l)} by ${w} by ${h} ${u}${hard ? ', open on top' : ''}` })}<p>Who is correct?</p>`,
      options: sh.options,
      answer: sh.answer,
      layout: 'cards',
      hints: [
        'Covering the outside uses surface area (square units). Filling the inside uses volume (cubic units).' + (hard ? ' An open box has only 5 faces to cover.' : ''),
        `Surface area: ${saRight} = ${fmt(SA)}. Volume: ${volStr} = ${fmt(Vv)}.`,
        hard ? 'Check each card: are the faces counted right for a box with no lid, and do the units match the task?' : 'Check that all six faces were counted and that the units match the task.',
      ],
      hintEs:
        'Para cubrir el exterior usas el área total (unidades cuadradas). Para llenar el interior usas el volumen (unidades cúbicas).' +
        (hard ? ' Una caja abierta solo tiene 5 caras para cubrir.' : ''),
      solution: `<p><b>${n1}</b> is correct. To ${ctx[0]} you need the surface area, ${fmt(SA)} ${sq(u)}; to ${ctx[1]} you need the volume, ${fmt(Vv)} ${cu(u)}. ${n2} swapped the two measurements. ${n3} forgot that the faces come in matching pairs.${hard ? ` ${n4} covered a lid the box does not have.` : ''}</p>`,
      feedback: {
        correct: `Correct. Surface area covers (${fmt(SA)} ${sq(u)}); volume fills (${fmt(Vv)} ${cu(u)}).`,
        wrong(ans) {
          const op = sh.options[ans];
          return (op && op.why) || 'Match each task to its measure: cover → surface area, fill → volume. Then check the face count.';
        },
      },
    };
  });

  G.define('gc_slantFromSA', (r, o) => {
    const hard = !!(o && o.hard);
    const u = r.pick(U5.UNITS),
      name = r.pick(NAMES);
    if (r.chance(0.5)) {
      const e = r.int(2, hard ? 9 : 12) + (hard ? 0.5 : 0),
        face = round(e * e, 2),
        SA = round(6 * face, 2);
      const obj = r.pick(['wooden block', 'gift box', 'storage crate', 'puzzle box', 'ice block']);
      return {
        type: 'num',
        skill: 'sa-pyramid',
        lesson: '5-7',
        title: 'Edge of a cube from its surface area',
        prompt: `<p>${name} has a cube-shaped ${obj} with a surface area of ${hl(fmt(SA) + ' ' + sq(u))}. All six faces are identical squares.</p>${V.prism({ l: e, w: e, h: e, labels: { l: `? ${u}`, w: '', h: '' }, width: 220, height: 170, aria: 'A cube with unknown edge length' })}<p>How long is one edge of the cube?</p>`,
        unit: u,
        answer: e,
        reference: true,
        hints: [
          'A cube has 6 identical square faces. First find the area of one face.',
          `One face: ${fmt(SA)} ÷ 6 = ${fmt(face)} ${sq(u)}.`,
          `A square face with area ${fmt(face)} has edge × edge = ${fmt(face)}. What number times itself is ${fmt(face)}?` + (hard ? ' (It is not a whole number: try numbers ending in .5.)' : ''),
        ],
        hintEs: 'Un cubo tiene 6 caras cuadradas iguales. Primero halla el área de una cara.',
        solution: `<p>One face: ${fmt(SA)} ÷ 6 = ${fmt(face)} ${sq(u)}. The face is a square, so edge × edge = ${fmt(face)}, and the edge is <b>${fmt(e)} ${u}</b> because ${fmt(e)} × ${fmt(e)} = ${fmt(face)}. Check: 6 × ${fmt(face)} = ${fmt(SA)}.</p>`,
        feedback: {
          correct: `Correct. ${fmt(SA)} ÷ 6 = ${fmt(face)}, and ${fmt(e)} × ${fmt(e)} = ${fmt(face)}.`,
          wrong(ans, d) {
            const v = d.value;
            if (v == null) return 'Divide by 6 for one face, then find the side of that square.';
            if (near2(v, face)) return `${fmt(face)} is the area of one face, not the edge. The edge is the number that multiplies by itself to give ${fmt(face)}.`;
            if (near2(v, face / 2)) return 'You halved the face area. The edge is the number that times itself gives the face area, not half of it.';
            if (near2(v, SA / 12) || near2(v, SA / 4)) return 'A cube has 6 faces. Divide the surface area by 6, then find the side of that square.';
            return 'Divide the surface area by 6 to get one square face. Then find the number that times itself gives that area.';
          },
        },
      };
    }
    let b, sl;
    if (hard) {
      b = 2 * r.int(2, 6);
      sl = r.int(b / 2 + 1, b / 2 + 7) + 0.5;
    } else {
      const [hb, , s0] = r.pick([
        [3, 4, 5],
        [4, 3, 5],
        [6, 8, 10],
        [8, 6, 10],
        [5, 12, 13],
      ]);
      b = 2 * hb;
      sl = s0;
    }
    const base = b * b,
      lat = round(2 * b * sl, 2),
      SA = round(base + lat, 2),
      tri = round(lat / 4, 2);
    const baseTxt = hard ? `Its square base has an area of ${hl(base + ' ' + sq(u))}.` : `Its base is a ${hl(b + ' ' + u)} square.`;
    return {
      type: 'num',
      skill: 'sa-pyramid',
      lesson: '5-8',
      title: 'Slant height from the surface area',
      prompt: `<p>${name}'s square pyramid has a surface area of ${hl(fmt(SA) + ' ' + sq(u))}. ${baseTxt}</p>${V.pyramid({ b, slant: sl, baseLabel: hard ? `base area ${base} ${sq(u)}` : `${b} ${u}`, slantLabel: `slant ? ${u}`, width: 240, height: 190, aria: `Square pyramid with ${hard ? 'base area ' + base + ' ' + sq(u) : 'base ' + b + ' ' + u} and unknown slant height` })}<p>What is the slant height of each triangular face?</p>`,
      unit: u,
      answer: sl,
      reference: true,
      hints: [
        'Surface area = base + 4 triangles. Take away the base to find the area of the four triangles.' + (hard ? ' You will also need the base edge: what number times itself is the base area?' : ''),
        `Base: ${hard ? base : `${b} × ${b} = ${base}`}. Four triangles: ${fmt(SA)} − ${base} = ${fmt(lat)}. One triangle: ${fmt(lat)} ÷ 4 = ${fmt(tri)}.${hard ? ` The base edge is ${b} ${u}, because ${b} × ${b} = ${base}.` : ''}`,
        `One triangle = ½ × ${b} × slant = ${fmt(tri)}. So ${b / 2} × slant = ${fmt(tri)}. Now divide ${fmt(tri)} by ${b / 2}.`,
      ],
      hintEs:
        'Área total = base + 4 triángulos. Resta la base para hallar el área de los cuatro triángulos.' +
        (hard ? ' También necesitas la arista de la base: ¿qué número multiplicado por sí mismo da el área de la base?' : ''),
      solution: `<p>Base: ${base}${hard ? `, so the base edge is ${b} (${b} × ${b} = ${base})` : ''}. Lateral area: ${fmt(SA)} − ${base} = ${fmt(lat)}. One triangle: ${fmt(lat)} ÷ 4 = ${fmt(tri)}. Since ½ × ${b} × slant = ${fmt(tri)}, slant = ${fmt(tri)} ÷ ${b / 2} = <b>${fmt(sl)} ${u}</b>. Check: ${base} + 4 × (½ × ${b} × ${fmt(sl)}) = ${fmt(SA)}.</p>`,
      feedback: {
        correct: `Correct. Strip off the base, split among 4 triangles, then undo ½ × ${b}: slant = ${fmt(sl)} ${u}.`,
        wrong(ans, d) {
          const v = d.value;
          if (v == null) return 'Subtract the base, divide by 4, then solve ½ × base × slant = one triangle.';
          if (near2(v, lat)) return `${fmt(lat)} is the lateral area (all four triangles). Keep going: ÷ 4, then undo ½ × base edge.`;
          if (near2(v, tri)) return `${fmt(tri)} is the area of one triangle. Its area is ½ × ${b} × slant, so divide by ${b / 2}.`;
          if (near2(v, SA / (2 * b))) return `You forgot to take away the base first. Lateral area = ${fmt(SA)} − ${base}.`;
          if (near2(v, tri / b)) return `Remember the ½: one triangle = ½ × ${b} × slant = ${b / 2} × slant. Divide by ${b / 2}, not by ${b}.`;
          if (hard && near2(v, tri / (base / 2))) return `${base} is the base AREA. The triangle's base is the edge of the square, ${b} ${u}.`;
          return 'Take away the base, divide by 4 for one triangle, then undo ½ × base edge.';
        },
      },
    };
  });

  G.define('gc_errorTriNet', (r, o) => {
    const hard = !!(o && o.hard);
    const u = r.pick(U5.UNITS),
      name = r.pick(NAMES);
    const [b, h, s1, s2] = hard
      ? r.pick([
          [14, 12, 13, 15],
          [21, 12, 13, 20],
          [25, 12, 15, 20],
          [21, 8, 10, 17],
        ])
      : r.pick([
          [6, 4, 5, 5],
          [8, 3, 5, 5],
          [12, 8, 10, 10],
          [10, 12, 13, 13],
        ]);
    const L = r.int(4, 10);
    const tri = (b * h) / 2,
      rects = L * (b + s1 + s2),
      SA = 2 * tri + rects;
    const variant = r.pick(hard ? ['heightAsSide', 'halfRects', 'sameSide'] : ['heightAsSide', 'halfRects']);
    const sides = s1 === s2 ? `two slanted sides of ${s1} ${u}` : `slanted sides of ${s1} ${u} and ${s2} ${u}`;
    let work, opts, wrongSA, hint2, solWhy;
    if (variant === 'heightAsSide') {
      wrongSA = 2 * tri + L * (b + 2 * h);
      work = `Triangles: 2 × (½ × ${b} × ${h}) = ${2 * tri}<br>Rectangles: ${L} × ${b} + ${L} × ${h} + ${L} × ${h} = ${L * (b + 2 * h)}<br>SA = ${wrongSA} ${sq(u)}`;
      opts = [
        { html: `${name} used the triangle's height (${h}) as the width of the two slanted rectangles instead of the slanted sides.`, ok: true },
        { html: `${name} forgot the ½ when finding the area of the two triangles.`, why: `The triangles are right: 2 × ½ × ${b} × ${h} = ${2 * tri}. The mistake is in the rectangles.` },
        {
          html: `${name} should have used only two rectangles in the net, not three.`,
          why: 'A triangular prism has three rectangular faces, one for each side of the triangle. The count is right; the widths are wrong.',
        },
        {
          html: `${name}'s work is correct, and the total surface area is right.`,
          why: `The height ${h} is inside the triangle, not a side of it. The slanted rectangles are ${L} by ${s1} and ${L} by ${s2}.`,
        },
      ];
      hint2 = `The triangle's sides are ${b}, ${s1}, and ${s2}. The height ${h} is not a side, so no rectangle is ${L} by ${h}.`;
      solWhy = `The slanted rectangles are ${L} by ${s1} and ${L} by ${s2}, not ${L} by ${h}; the height is measured inside the triangle and is not one of its sides.`;
    } else if (variant === 'halfRects') {
      wrongSA = 2 * tri + rects / 2;
      work = `Triangles: 2 × (½ × ${b} × ${h}) = ${2 * tri}<br>Rectangles: ½ × ${L} × (${b} + ${s1} + ${s2}) = ${fmt(rects / 2)}<br>SA = ${fmt(wrongSA)} ${sq(u)}`;
      opts = [
        { html: `${name} put a ½ on the rectangles. Only triangles use ½; a rectangle is length × width.`, ok: true },
        { html: `${name} should have put a ½ on the triangles as well as the rectangles.`, why: 'The ½ is already on the triangles. The extra ½ on the rectangles is the mistake.' },
        {
          html: `${name} used the wrong side lengths for the widths of the rectangles.`,
          why: `${b}, ${s1}, and ${s2} are the three sides of the triangle, so the rectangle widths are right. The ½ is the problem.`,
        },
        { html: `${name}'s work is correct, and the total surface area is right.`, why: 'The three rectangles are full rectangles. Halving them leaves half the sides uncovered.' },
      ];
      hint2 = `A rectangle has no ½. The three rectangles are ${L} × ${b}, ${L} × ${s1}, and ${L} × ${s2}.`;
      solWhy = 'Rectangles are length × width with no ½; the ½ belongs only to the triangles.';
    } else {
      wrongSA = 2 * tri + L * (b + 2 * s1);
      work = `Triangles: 2 × (½ × ${b} × ${h}) = ${2 * tri}<br>Rectangles: ${L} × ${b} + ${L} × ${s1} + ${L} × ${s1} = ${L * (b + 2 * s1)}<br>SA = ${wrongSA} ${sq(u)}`;
      opts = [
        { html: `${name} used the ${s1} ${u} side twice. The two slanted sides are different, so one rectangle is ${L} by ${s2}.`, ok: true },
        { html: `${name} used the triangle's height instead of a slanted side for one rectangle.`, why: `The height ${h} does not appear in the rectangles line. The repeated ${s1} is the problem.` },
        { html: `${name} forgot the ½ when finding the area of the two triangles.`, why: `2 × ½ × ${b} × ${h} = ${2 * tri} is right. Check the rectangles.` },
        { html: `${name}'s work is correct, and the total surface area is right.`, why: `The triangle's sides are ${b}, ${s1}, and ${s2}. Each side gets its own rectangle.` },
      ];
      hint2 = `The triangle's three sides are ${b}, ${s1}, and ${s2}. Each side wraps one rectangle, so the widths must be those three numbers.`;
      solWhy = `The triangle is not isosceles: its slanted sides are ${s1} and ${s2}, so the rectangles are ${L} by ${b}, ${L} by ${s1}, and ${L} by ${s2}.`;
    }
    const sh = shuffleOptions(r, opts, 0);
    const svg = U5.triNet(b, h, s1, s2, L, {
      labels: true,
      u: ' ' + u,
      width: 280,
      heightPx: 210,
      aria: `Net of a triangular prism: rectangles ${L} ${u} long with widths ${b}, ${s1}, and ${s2} ${u}; triangles with base ${b} ${u} and height ${h} ${u}`,
    });
    return {
      type: 'error',
      skill: 'sa-tri-prism',
      lesson: '5-7',
      title: 'Find the mistake in the net',
      prompt: `<p>${name} found the surface area of a triangular prism ${L} ${u} long. Each triangular end has base ${b} ${u}, height ${h} ${u}, and ${sides}.</p>${svg}<p>What is wrong with ${name}'s work?</p>`,
      work,
      options: sh.options,
      answer: sh.answer,
      fix: { label: `Correct surface area (${sq(u)}):`, answer: SA },
      hints: [
        'Check the triangles and the rectangles separately. Triangles: ½ × base × height. Rectangles: length × width, with widths equal to the triangle’s sides.',
        hint2,
        `Correct: ${2 * tri} + ${L} × (${b} + ${s1} + ${s2}). Add the triangles and the rectangles.`,
      ],
      hintEs: 'Revisa los triángulos y los rectángulos por separado. Triángulos: ½ × base × altura. Rectángulos: largo × ancho, y los anchos son los lados del triángulo.',
      solution: `<p>${solWhy} Correct: triangles ${2 * tri}, rectangles ${L} × (${b} + ${s1} + ${s2}) = ${rects}, SA = <b>${SA} ${sq(u)}</b>.</p>`,
      feedback: {
        correct: `Correct. ${2 * tri} + ${rects} = ${SA} ${sq(u)}.`,
        wrong(ans, d) {
          if (!d.mistakeOk) return (sh.options[ans.mistake] && sh.options[ans.mistake].why) || 'Check the rectangles line of the work against the net.';
          const f = parseNum(ans.fix);
          if (near2(f, wrongSA)) return `You found the mistake but kept ${name}'s total. Redo the rectangles with widths ${b}, ${s1}, and ${s2}.`;
          if (near2(f, rects)) return `${rects} is only the three rectangles. Add the two triangles (${2 * tri}).`;
          if (near2(f, tri + rects)) return 'There are two triangular ends. Count both triangles.';
          return `You found the mistake. For the fix, add the two triangles to the three rectangles ${L} by ${b}, ${s1}, and ${s2}.`;
        },
      },
    };
  });

  G.define('gc_msSameArea', (r, o) => {
    const hard = !!(o && o.hard);
    const u = r.pick(U5.UNITS);
    // per target: parallelogram [b,h], triangle [b,h], trapezoid [b1,b2,h], slanted trap [base, side, true height]
    const SETS = hard
      ? {
          30: { p: [7.5, 4], t: [12, 5], z: [9, 6, 4], s: [7.5, 4, 3] },
          42: { p: [10.5, 4], t: [14, 6], z: [8.5, 5.5, 6], s: [10.5, 4, 3] },
          45: { p: [7.5, 6], t: [15, 6], z: [11.5, 3.5, 6], s: [7.5, 6, 4.5] },
          54: { p: [13.5, 4], t: [12, 9], z: [10.5, 7.5, 6], s: [13.5, 4, 3] },
        }
      : {
          24: { p: [6, 4], t: [8, 6], z: [8, 4, 4], s: [6, 4, 3] },
          36: { p: [9, 4], t: [12, 6], z: [10, 8, 4], s: [9, 4, 3] },
          48: { p: [8, 6], t: [12, 8], z: [14, 10, 4], s: [8, 6, 5] },
          60: { p: [10, 6], t: [15, 8], z: [12, 8, 6], s: [10, 6, 5] },
        };
    const T = Number(r.pick(Object.keys(SETS)));
    const S = SETS[T];
    const [pb, ph] = S.p,
      [tb, th] = S.t,
      [z1, z2, zh] = S.z,
      [sb, ss, sh0] = S.s;
    const opts = [
      { tag: 'para', html: miniPara(pb, ph, u) + `<div class="muted">parallelogram, base ${fmt(pb)}, height ${fmt(ph)}</div>`, ok: true },
      { tag: 'tri', html: miniTri(tb, th, u) + `<div class="muted">triangle, base ${fmt(tb)}, height ${fmt(th)}</div>`, ok: true },
      { tag: 'trap', html: miniTrap(z1, z2, zh, u) + `<div class="muted">trapezoid, bases ${fmt(z1)} and ${fmt(z2)}, height ${fmt(zh)}</div>`, ok: true },
      { tag: 'halfTri', html: miniTri(pb, ph, u) + `<div class="muted">triangle, base ${fmt(pb)}, height ${fmt(ph)}</div>` },
      { tag: 'rect', html: miniRect(pb + 2, ph, u) + `<div class="muted">rectangle, ${fmt(pb + 2)} by ${fmt(ph)}</div>` },
      // slanted-side trap: base × slanted side = T, but the true height is shorter
      { tag: 'slant', html: miniPara(sb, sh0, u, ss) + `<div class="muted">parallelogram, base ${fmt(sb)}, side ${fmt(ss)}, height ${fmt(sh0)}</div>` },
    ];
    const chosen = r
      .shuffle([0, 1, 2])
      .slice(0, 2)
      .concat(r.shuffle([3, 4, 5]).slice(0, 2))
      .sort((a, b) => a - b);
    const picked = chosen.map((i) => opts[i]);
    const correctIdx = picked.map((op, i) => (op.ok ? i : -1)).filter((i) => i >= 0);
    const sh = shuffleOptions(r, picked, correctIdx);
    const areaOf = (i) => {
      if (i === 0) return `${fmt(pb)} × ${fmt(ph)} = ${T}`;
      if (i === 1) return `½ × ${fmt(tb)} × ${fmt(th)} = ${T}`;
      if (i === 2) return `½ × (${fmt(z1)} + ${fmt(z2)}) × ${fmt(zh)} = ${T}`;
      if (i === 3) return `½ × ${fmt(pb)} × ${fmt(ph)} = ${fmt(T / 2)}`;
      if (i === 4) return `${fmt(pb + 2)} × ${fmt(ph)} = ${fmt(round((pb + 2) * ph, 2))}`;
      return `${fmt(sb)} × ${fmt(sh0)} = ${fmt(round(sb * sh0, 2))} (the side ${fmt(ss)} is not the height)`;
    };
    return {
      type: 'ms',
      skill: 'composite-figures',
      lesson: '5-4',
      title: `Which figures have an area of ${T}?`,
      prompt: `<p>Select <b>all</b> figures with an area of exactly ${hl(T + ' ' + sq(u))}. Measurements are in ${u}. Different shapes use different formulas.</p>`,
      options: sh.options,
      answers: sh.answers,
      layout: 'cards',
      reference: true,
      hints: [
        'Use the right formula for each shape: parallelogram b × h, triangle ½ × b × h, trapezoid ½ × (b₁ + b₂) × h, rectangle l × w.',
        `Compute every figure: ${chosen.map(areaOf).join('; ')}.`,
        `Exactly ${correctIdx.length} of the figures equal ${T}. Select those.`,
      ],
      hintEs: 'Usa la fórmula correcta para cada figura: paralelogramo b × h, triángulo ½ × b × h, trapecio ½ × (b₁ + b₂) × h, rectángulo l × a.',
      solution: `<p>${chosen.map((i) => areaOf(i)).join('; ')}. The figures that equal <b>${T} ${sq(u)}</b> are the ones to select. A triangle needs twice the base × height of a parallelogram to match its area, and a slanted side is never the height.</p>`,
      feedback: {
        correct: `Correct. Each selected figure has an area of exactly ${T} ${sq(u)} by its own formula.`,
        wrong(ans, d) {
          if (d.extra && d.extra.length) {
            const tag = sh.options[d.extra[0]].tag;
            if (tag === 'slant') return `One figure you chose has a slanted side of ${fmt(ss)}. Its height is ${fmt(sh0)}, so its area is ${fmt(sb)} × ${fmt(sh0)}, not ${T}.`;
            if (tag === 'halfTri') return `A triangle is half of base × height. That triangle has the same base and height as a ${T} parallelogram, so it is only half as big.`;
            if (tag === 'rect') return 'Recheck the rectangle: length × width does not give the target for those numbers.';
            return 'One figure you chose does not equal the target. Recompute it with its own formula.';
          }
          const miss = d.missing && d.missing.length ? sh.options[d.missing[0]].tag : '';
          if (miss === 'tri') return 'You missed a triangle. Remember: ½ × base × height. A triangle with a larger base or height can still match the target.';
          if (miss === 'trap') return 'You missed the trapezoid. Add the two bases, multiply by the height, then take half.';
          return `You missed one. Compute each figure's area; ${correctIdx.length} of them equal ${T}.`;
        },
      },
    };
  });
})(typeof window !== 'undefined' ? window : globalThis);
