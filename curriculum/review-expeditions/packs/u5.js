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
      h = round(h0 * 1.5, 1);
      s = round(s0 * 1.5, 1);
      b = r.int(10, 20);
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
  function coachArea(p, v) {
    const A = round(p.b * p.h, 2);
    if (v == null) return `Area of a parallelogram = base × height. Use ${fmt(p.b)} and ${fmt(p.h)}.`;
    if (Math.abs(v - round(p.b * p.s, 2)) < 0.01)
      return `You multiplied by the slanted side (${fmt(p.s)}). The height is the dashed segment that makes a right angle with the base: ${fmt(p.h)} ${p.u}.`;
    if (Math.abs(v - (p.b + p.h)) < 0.01 || Math.abs(v - 2 * (p.b + p.s)) < 0.01) return 'That is adding side lengths, which gives a distance around, not the space inside. Area is base × height.';
    if (Math.abs(v - A / 2) < 0.01) return 'You halved the product. Halving is for triangles. A parallelogram is base × height with no half.';
    return `Area = base × height = ${fmt(p.b)} × ${fmt(p.h)}. Check your multiplication.`;
  }

  // ---------- Area = base × height, slanted side as a trap (num) ----------
  G.define('g1_areaBH', (r, o) => {
    const p = para(r, o);
    const A = round(p.b * p.h, 2);
    const name = r.pick(NAMES),
      obj = r.pick(OBJECTS);
    return {
      type: 'num',
      skill: 'area-parallelogram',
      lesson: '5-1',
      title: o.hard ? 'Seal of Area: parallelogram' : 'Area of a parallelogram',
      xp: o.xp,
      prompt: `<p>${name} is measuring a parallelogram-shaped ${obj}. Its base is ${hl(fmt(p.b) + ' ' + p.u)}, its height is ${hl(fmt(p.h) + ' ' + p.u)}, and its slanted side is ${fmt(p.s)} ${p.u}.</p>${paraSvg(p)}<p>What is the area of the ${obj}?</p>`,
      unit: sq(p.u),
      answer: A,
      reference: true,
      hints: [
        'Area of a parallelogram = base × height. The height is the segment that makes a right angle with the base, not the slanted side.',
        `The base is ${fmt(p.b)} ${p.u}. The height is the dashed segment, ${fmt(p.h)} ${p.u}. The slanted side (${fmt(p.s)} ${p.u}) is not used.`,
        `Multiply: ${fmt(p.b)} × ${fmt(p.h)}.`,
      ],
      solution: `<p>A = b × h = ${fmt(p.b)} × ${fmt(p.h)} = <b>${fmt(A)} ${sq(p.u)}</b>. The slanted side ${fmt(p.s)} ${p.u} is longer than the height, so using it would make the area too big. Only the perpendicular height counts.</p>`,
      feedback: { correct: `Correct. ${fmt(p.b)} × ${fmt(p.h)} = ${fmt(A)} ${sq(p.u)}. You used the perpendicular height, not the slanted side.`, wrong: (ans, d) => coachArea(p, d.value) },
    };
  });

  // ---------- Which measurement is the height? / which expression? (mc) ----------
  G.define('g1_whichHeight', (r) => {
    const p = para(r, {});
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
      return {
        type: 'mc',
        skill: 'area-parallelogram',
        lesson: '5-1',
        title: 'Find the height',
        prompt: `<p>The parallelogram below has a base of ${fmt(p.b)} ${p.u}, a slanted side of ${fmt(p.s)} ${p.u}, and a dashed segment of ${fmt(p.h)} ${p.u} that meets the base at a right angle.</p>${paraSvg(p)}<p>Which measurement is the <b>height</b> of the parallelogram?</p>`,
        options: sh.options,
        answer: sh.answer,
        hints: [
          'The height is perpendicular to the base. Perpendicular means it makes a right angle (a square corner).',
          'Look for the small square-corner mark. The segment with that mark is the height.',
          `The dashed segment with the right-angle mark measures ${fmt(p.h)} ${p.u}.`,
        ],
        solution: `<p>The height is the <b>${fmt(p.h)} ${p.u}</b> dashed segment. It meets the base at a right angle. The slanted side (${fmt(p.s)} ${p.u}) is a side of the figure, not its height.</p>`,
        feedback: { correct: 'Correct. The height always makes a right angle with the base.' },
      };
    }
    const sh = shuffleOptions(
      r,
      [
        { html: `${fmt(p.b)} × ${fmt(p.h)}`, ok: true },
        { html: `${fmt(p.b)} × ${fmt(p.s)}`, why: `${fmt(p.s)} ${p.u} is the slanted side. Area uses the perpendicular height, ${fmt(p.h)} ${p.u}.` },
        { html: `½ × ${fmt(p.b)} × ${fmt(p.h)}`, why: 'The ½ belongs to the triangle formula. A parallelogram is a full base × height.' },
        { html: `${fmt(p.b)} + ${fmt(p.h)} + ${fmt(p.b)} + ${fmt(p.h)}`, why: 'Adding sides gives perimeter (the distance around), not area (the space inside).' },
      ],
      0,
    );
    return {
      type: 'mc',
      skill: 'area-parallelogram',
      lesson: '5-1',
      title: 'Choose the expression',
      prompt: `<p>A parallelogram has base ${hl(fmt(p.b) + ' ' + p.u)}, height ${hl(fmt(p.h) + ' ' + p.u)}, and slanted side ${fmt(p.s)} ${p.u}.</p>${paraSvg(p)}<p>Which expression gives its area in ${sq(p.u)}?</p>`,
      options: sh.options,
      answer: sh.answer,
      reference: true,
      hints: ['Area of a parallelogram = base × height.', `Base = ${fmt(p.b)}. Height = the perpendicular segment = ${fmt(p.h)}.`, `Write base × height with those two numbers.`],
      solution: `<p>A = b × h = <b>${fmt(p.b)} × ${fmt(p.h)}</b> = ${fmt(round(p.b * p.h, 2))} ${sq(p.u)}. The slanted side is not part of the formula.</p>`,
      feedback: { correct: 'Correct. Base times perpendicular height, no half, no slanted side.' },
    };
  });

  // ---------- Error analysis: used the slanted side (error) ----------
  G.define('g1_errorSlant', (r) => {
    const p = para(r, {});
    const name = r.pick(NAMES),
      A = p.b * p.h,
      wrongA = p.b * p.s;
    const sh = shuffleOptions(
      r,
      [
        { html: `${name} multiplied by the slanted side. The height is the perpendicular segment, ${fmt(p.h)} ${p.u}.`, ok: true },
        {
          html: `${name} should have added the base and the side instead of multiplying.`,
          why: 'Adding gives a length, not an area. Multiplying base × height is correct; the problem is which number was used for the height.',
        },
        { html: `${name} forgot to multiply by ½.`, why: 'There is no ½ in the parallelogram formula. The ½ is for triangles.' },
        { html: `${name}'s work is correct.`, why: `${fmt(p.s)} ${p.u} is the slanted side, which is longer than the height. The answer is too big.` },
      ],
      0,
    );
    return {
      type: 'error',
      skill: 'area-parallelogram',
      lesson: '5-1',
      title: 'Find the mistake',
      prompt: `<p>${name} found the area of this parallelogram.</p>${paraSvg(p)}<p>What is wrong with ${name}'s work?</p>`,
      work: `A = b × h<br>A = ${fmt(p.b)} × ${fmt(p.s)}<br>A = ${fmt(wrongA)} ${sq(p.u)}`,
      options: sh.options,
      answer: sh.answer,
      fix: { label: `Correct area (${sq(p.u)}):`, answer: A },
      hints: [
        'Compare the numbers in the work with the labels on the figure. Which label did the student use for h?',
        `${fmt(p.s)} ${p.u} is the slanted side. The height is the dashed segment that makes a right angle with the base.`,
        `Correct area = ${fmt(p.b)} × ${fmt(p.h)}.`,
      ],
      solution: `<p>${name} used ${fmt(p.s)} ${p.u}, the slanted side, as the height. The height is ${fmt(p.h)} ${p.u}. Correct area: ${fmt(p.b)} × ${fmt(p.h)} = <b>${fmt(A)} ${sq(p.u)}</b>.</p>`,
      feedback: {
        correct: `Correct. The slanted side is never the height. ${fmt(p.b)} × ${fmt(p.h)} = ${fmt(A)} ${sq(p.u)}.`,
        wrong(ans, d) {
          if (!d.mistakeOk) return (sh.options[ans.mistake] && sh.options[ans.mistake].why) || 'Check which measurement was used for the height.';
          return `You found the mistake. For the fix, multiply the base ${fmt(p.b)} by the perpendicular height ${fmt(p.h)}.`;
        },
      },
    };
  });

  // ---------- Table of parallelograms: areas and a missing height (table) ----------
  G.define('g1_tableAreas', (r) => {
    const u = r.pick(U5.UNITS), name = r.pick(NAMES);
    const rowsData = [];
    const bases = r.pickN([5, 6, 7, 8, 9, 10, 12], 3);
    bases.forEach((b) => rowsData.push({ b, h: r.int(3, 9) }));
    const letters = ['A', 'B', 'C'];
    const rows = [['Parallelogram', `Base (${u})`, `Height (${u})`, `Area (${sq(u)})`]];
    const inputs = [];
    rowsData.forEach((d, i) => {
      if (i === 2) {
        rows.push([letters[i], String(d.b), '__IN:h2__', String(d.b * d.h)]);
        inputs.push({ id: 'h2', answer: d.h });
      } else {
        rows.push([letters[i], String(d.b), String(d.h), `__IN:a${i}__`]);
        inputs.push({ id: 'a' + i, answer: d.b * d.h });
      }
    });
    const d2 = rowsData[2];
    return {
      type: 'table',
      skill: 'area-parallelogram',
      lesson: '5-1',
      title: 'Complete the area table',
      prompt: `<p>${name} lists three parallelogram tiles, measured in ${u}. Complete the table. For tile C, the area is given and the height is missing.</p>`,
      rows,
      header: true,
      inputs,
      reference: true,
      hints: [
        'Area = base × height. To find a missing height, divide the area by the base.',
        `Tile A: ${rowsData[0].b} × ${rowsData[0].h}. Tile B: ${rowsData[1].b} × ${rowsData[1].h}.`,
        `Tile C: height = ${d2.b * d2.h} ÷ ${d2.b}.`,
      ],
      solution: `<p>A: ${rowsData[0].b} × ${rowsData[0].h} = <b>${rowsData[0].b * rowsData[0].h}</b>. B: ${rowsData[1].b} × ${rowsData[1].h} = <b>${rowsData[1].b * rowsData[1].h}</b>. C: ${d2.b * d2.h} ÷ ${d2.b} = <b>${d2.h}</b>. Multiplying finds an area; dividing the area by the base undoes it to find the height.</p>`,
      feedback: {
        correct: 'Correct. Base × height gives area, and area ÷ base gives the height back.',
        wrong(ans, d) {
          if (d.wrong.includes('h2')) return `For tile C, the area (${d2.b * d2.h}) is base × height. Divide the area by the base ${d2.b} to find the height.`;
          return 'For tiles A and B, multiply base × height.';
        },
      },
    };
  });

  // ---------- Rhombus: all sides equal, area is still base × height (num) ----------
  G.define('g1_rhombusBH', (r) => {
    const [off, h, s] = r.pick(TRIPLES);
    const u = r.pick(U5.UNITS),
      name = r.pick(NAMES);
    const ctx = r.pick(['kite', 'mosaic tile', 'window', 'sign', 'quilt patch']);
    const A = s * h;
    const svg = V.parallelogram(s, h, { base: `${s} ${u}`, height: `${h} ${u}`, side: `${s} ${u}`, offset: off, aria: `Rhombus with sides ${s} ${u} and height ${h} ${u}` });
    return {
      type: 'num',
      skill: 'area-rhombus',
      lesson: '5-1',
      title: 'Area of a rhombus',
      prompt: `<p>${name} cuts a rhombus-shaped ${ctx}. Every side is ${hl(s + ' ' + u)} long. The height is ${hl(h + ' ' + u)}.</p>${svg}<p>What is the area of the ${ctx}?</p>`,
      unit: sq(u),
      answer: A,
      reference: true,
      hints: [
        'A rhombus is a parallelogram with four equal sides. Its area is still base × height.',
        `Use one side as the base: ${s} ${u}. The height is the perpendicular segment: ${h} ${u}.`,
        `${s} × ${h}.`,
      ],
      solution: `<p>A rhombus is a parallelogram, so A = b × h = ${s} × ${h} = <b>${A} ${sq(u)}</b>. Side × side (${s * s}) would be wrong: the rhombus leans, so its height ${h} is shorter than its side.</p>`,
      feedback: {
        correct: `Correct. A rhombus is a parallelogram: ${s} × ${h} = ${A} ${sq(u)}.`,
        wrong(ans, d) {
          const v = d.value;
          if (v != null && Math.abs(v - s * s) < 0.01) return `You squared the side (${s} × ${s}). Only a square has height equal to its side. This rhombus leans, so use the height ${h} ${u}.`;
          if (v != null && Math.abs(v - 4 * s) < 0.01) return `${4 * s} is the perimeter (4 equal sides). Area is base × height.`;
          if (v != null && Math.abs(v - A / 2) < 0.01) return 'No half here. A rhombus is a parallelogram, so area = base × height.';
          return `Multiply one side (${s}) by the height (${h}).`;
        },
      },
    };
  });

  // ---------- Decompose and rearrange into a rectangle (blanks, template) ----------
  G.define('g1_decompose', (r) => {
    const u = r.pick(U5.UNITS);
    if (r.chance(0.5)) {
      const [off, h] = r.pick(TRIPLES);
      const b = r.int(h + 1, h * 2 + 2);
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
          { x: b / 2, y: 0, text: `${b} ${u}`, dy: 20 },
          { x: off, y: h / 2, text: `${h} ${u}`, anchor: 'start', dx: 8, color: C.d },
        ],
        aria: `Parallelogram with base ${b} ${u} and height ${h} ${u}, with a triangle marked on the left end`,
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
          { label: 'area', answer: b * h },
        ],
        template: `The rectangle is {0} ${u} long and {1} ${u} wide, so the area is {2} ${sq(u)}.`,
        hints: [
          'Sliding a piece does not change the area. The rectangle has the same area as the parallelogram.',
          `The rectangle's length is the base, ${b} ${u}. Its width is the height, ${h} ${u}.`,
          `${b} × ${h}.`,
        ],
        solution: `<p>The rectangle is <b>${b}</b> ${u} by <b>${h}</b> ${u}, so its area is <b>${b * h}</b> ${sq(u)}. This is why the parallelogram formula is base × height: every parallelogram can be cut and slid into a rectangle with the same base and height.</p>`,
        feedback: {
          correct: "Correct. Cutting and sliding shows why a parallelogram's area is base × height.",
          wrong(ans, d) {
            if (d.wrong.includes(0) || d.wrong.includes(1)) return `The rectangle's two dimensions are the base (${b}) and the height (${h}). The slanted side disappears when you slide the triangle.`;
            return `Area of the rectangle = ${b} × ${h}.`;
          },
        },
      };
    }
    const d1 = 2 * r.int(3, 7),
      d2 = 2 * r.int(2, 5) + (r.chance(0.5) ? 0 : 2);
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
        { label: 'area', answer: (d1 * d2) / 2 },
      ],
      template: `The rectangle is {0} ${u} by {1} ${u}, so the area of the rhombus is {2} ${sq(u)}.`,
      hints: ['Rearranging pieces does not change the total area.', `The rectangle is as wide as the rhombus: ${d1} ${u}. Its height is half of ${d2} ${u}.`, `${d1} × ${d2 / 2}.`],
      solution: `<p>The four triangles form a rectangle <b>${d1}</b> ${u} by <b>${d2 / 2}</b> ${u}. Area = ${d1} × ${d2 / 2} = <b>${(d1 * d2) / 2}</b> ${sq(u)}. Decomposing into triangles and rearranging gives the area without a new formula.</p>`,
      feedback: {
        correct: 'Correct. Decompose, rearrange, and the area stays the same.',
        wrong(ans, d) {
          const a = parseNum(ans[2]);
          if (a != null && Math.abs(a - d1 * d2) < 0.01) return `${d1} × ${d2} is the area of the big rectangle around the rhombus. The rhombus fills only half of it.`;
          if (d.wrong.includes(1)) return `The rectangle's width is half the rhombus's height: ${d2} ÷ 2.`;
          return `Rectangle: ${d1} by ${d2 / 2}. Multiply.`;
        },
      },
    };
  });

  // ---------- Select all parallelograms with a given area (ms) ----------
  G.define('g1_msArea', (r) => {
    const u = r.pick(U5.UNITS);
    const target = r.pick([24, 36, 48, 60]);
    const pairs = {
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
    }[target];
    const [p1, p2] = r.pickN(pairs, 2);
    const mini = (b, h, side) => {
      const off = side ? round(Math.sqrt(side * side - h * h), 2) : b * 0.3;
      return V.parallelogram(b, h, {
        base: `${b} ${u}`,
        height: `${h} ${u}`,
        side: side ? `${side} ${u}` : undefined,
        offset: off,
        width: 170,
        height2: 120,
        aria: `Parallelogram, base ${b} ${u}, height ${h} ${u}${side ? ', side ' + side + ' ' + u : ''}`,
      });
    };
    // trap: base × slanted side = target, but the real height is smaller
    const trapB = p1[0],
      trapS = p1[1],
      trapH = trapS - 1;
    const half = [p2[0], p2[1] / 2].every((x) => Number.isInteger(x)) ? [p2[0], p2[1] / 2] : [p2[0] / 2, p2[1]];
    const opts = [
      { html: mini(p1[0], p1[1]) + `<div class="muted">base ${p1[0]}, height ${p1[1]}</div>`, ok: true },
      { html: mini(p2[0], p2[1]) + `<div class="muted">base ${p2[0]}, height ${p2[1]}</div>`, ok: true },
      { html: mini(trapB, trapH, trapS) + `<div class="muted">base ${trapB}, side ${trapS}, height ${trapH}</div>` },
      { html: mini(half[0], half[1]) + `<div class="muted">base ${half[0]}, height ${half[1]}</div>` },
      { html: mini(p1[0] + 2, p1[1]) + `<div class="muted">base ${p1[0] + 2}, height ${p1[1]}</div>` },
    ];
    const sh = shuffleOptions(r, opts, [0, 1]);
    return {
      type: 'ms',
      skill: 'area-parallelogram',
      lesson: '5-1',
      title: `Which have an area of ${target}?`,
      prompt: `<p>Select <b>all</b> parallelograms with an area of ${hl(target + ' ' + sq(u))}. Measurements are in ${u}.</p>`,
      options: sh.options,
      answers: sh.answers,
      layout: 'cards',
      hints: [
        'For each figure, multiply base × height. Ignore any slanted side.',
        `Which pairs of numbers multiply to ${target}? ${p1[0]} × ${p1[1]} and ${p2[0]} × ${p2[1]} do.`,
        `The figure with side ${trapS} has height ${trapH}: ${trapB} × ${trapH} = ${trapB * trapH}, not ${target}.`,
      ],
      solution: `<p>Area = base × height. ${p1[0]} × ${p1[1]} = ${target} and ${p2[0]} × ${p2[1]} = ${target}. The figure labelled with a slanted side ${trapS} has area ${trapB} × ${trapH} = ${trapB * trapH}. The others give ${half[0] * half[1]} and ${(p1[0] + 2) * p1[1]}.</p>`,
      feedback: {
        correct: `Correct. Both selected figures have base × height = ${target}.`,
        wrong(ans, d) {
          if (d.extra && d.extra.length) {
            const txt = sh.options[d.extra[0]].html;
            if (/side/.test(txt)) return `One figure you chose uses its slanted side ${trapS}. Its real height is ${trapH}, so its area is ${trapB * trapH}.`;
            return 'One figure you chose has a different base × height product. Multiply again.';
          }
          return `You missed one. Look for another pair of numbers that multiply to ${target}.`;
        },
      },
    };
  });

  // ---------- True or false about rhombuses and parallelograms (tf) ----------
  G.define('g1_tfRhombus', (r) => {
    const u = r.pick(U5.UNITS),
      s = r.int(5, 9),
      b = r.int(8, 14),
      side = r.int(4, 7);
    const v = r.pick([
      {
        stmt: `A rhombus with sides of ${s} ${u} must have an area of ${s * s} ${sq(u)}.`,
        answer: false,
        reasons: [
          { html: `Only a square has a height equal to its side. A rhombus that leans has a height shorter than ${s} ${u}, so its area is less than ${s * s} ${sq(u)}.`, correct: true },
          { html: `A rhombus has four sides, so the area is 4 × ${s} = ${4 * s} ${sq(u)}.` },
          { html: `Side × side always gives the area of a figure with equal sides.` },
        ],
      },
      {
        stmt: 'A rhombus is a parallelogram, so its area is base × height.',
        answer: true,
        reasons: [
          { html: 'A rhombus has two pairs of parallel sides, which makes it a parallelogram. The formula A = b × h applies.', correct: true },
          { html: 'A rhombus has four equal sides, so its area is 4 × side.' },
          { html: 'A rhombus is half of a rectangle, so its area is ½ × base × height.' },
        ],
      },
      {
        stmt: `Two parallelograms both have base ${b} ${u} and height ${side} ${u}. One leans more than the other. They have the same area.`,
        answer: true,
        reasons: [
          { html: 'Area depends only on base and height. Leaning changes the slanted side, not the base or the perpendicular height.', correct: true },
          { html: 'The one that leans more has a longer slanted side, so it has more area.' },
          { html: 'They have the same area only if their slanted sides are also equal.' },
        ],
      },
      {
        stmt: `A parallelogram with base ${b} ${u} and slanted side ${side} ${u} has an area of ${b * side} ${sq(u)}.`,
        answer: false,
        reasons: [
          { html: 'The slanted side is not the height. The height is perpendicular to the base and is shorter, so the area is less than ' + b * side + ' ' + sq(u) + '.', correct: true },
          { html: `The area should be half of ${b * side}, because the figure leans.` },
          { html: `The area is ${2 * (b + side)} ${sq(u)}, because you add all four sides.` },
        ],
      },
    ]);
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
        'Think about the formula: base × perpendicular height. Does the statement use a true height?',
        'A slanted side is longer than the height. Only in a square or rectangle does a side equal the height.',
        v.answer ? 'The statement follows the formula, so it is true.' : 'The statement uses a side as if it were the height, so it is false.',
      ],
      solution: `<p><b>${v.answer ? 'True' : 'False'}.</b> ${reasons.find((x) => x.correct).html}</p>`,
      feedback: {
        correct: 'Correct. Area of any parallelogram, including a rhombus, is base × perpendicular height.',
        wrong(ans, d) {
          return !d.valueOk ? 'Ask: is the number used as the height really perpendicular to the base?' : 'Your true/false is right. Pick the reason that talks about the perpendicular height.';
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

  /** Draw a triangle; obtuse when o.outside (apex past the right end of the base). Labels the slanted side when o.side. */
  function tri(r, o) {
    o = o || {};
    const [dx, h, s] = r.pick(TRIPLES);
    let b;
    if (o.b) b = o.b;
    else {
      b = r.int(Math.max(4, Math.round(h * 0.7)), h * 2 + 2);
      if ((b * h) % 2) b += 1;
    }
    const outside = o.outside == null ? r.chance(0.4) : o.outside;
    const apex = outside ? b + dx : Math.max(1, b - dx);
    const u = o.u || r.pick(U5.UNITS);
    const sides = o.side ? [{ x: (b + apex) / 2, y: h / 2, text: `${s} ${u}`, anchor: 'start', dx: 10 }] : [];
    const svg = V.triangle(b, h, {
      apex,
      base: `${fmt(b)} ${u}`,
      height: `${fmt(h)} ${u}`,
      sides,
      aria: `Triangle with base ${fmt(b)} ${u} and height ${fmt(h)} ${u}${outside ? ', height drawn outside the triangle' : ''}`,
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
        { x: b / 2, y: 0, text: `${b} ${u}`, dy: 18, size: 12 },
        { x: apex, y: h / 2, text: `${h} ${u}`, anchor: 'start', dx: 6, color: C.d, size: 12 },
      ],
      width: 170,
      height: 110,
      aria: `Triangle, base ${b} ${u}, height ${h} ${u}`,
    });
  }
  function coach(t, v) {
    if (v == null) return `Area of a triangle = ½ × base × height. Use ${fmt(t.b)} and ${fmt(t.h)}.`;
    if (Math.abs(v - t.b * t.h) < 0.01) return `${fmt(t.b)} × ${fmt(t.h)} is the area of a parallelogram with this base and height. A triangle is half of that. Divide by 2.`;
    if (Math.abs(v - (t.b * t.s) / 2) < 0.01 || Math.abs(v - t.b * t.s) < 0.01)
      return `You used the slanted side (${fmt(t.s)}). The height is the dashed segment that meets the base at a right angle: ${fmt(t.h)} ${t.u}.`;
    if (Math.abs(v - (t.b + t.h)) < 0.01) return 'Adding gives a length, not an area. Multiply ½ × base × height.';
    return `½ × ${fmt(t.b)} × ${fmt(t.h)}. Multiply the base and height, then take half.`;
  }

  // ---------- Area = ½bh, including obtuse triangles (num) ----------
  G.define('g2_areaHalf', (r) => {
    const t = tri(r, { side: r.chance(0.6) });
    const name = r.pick(NAMES),
      obj = r.pick(OBJECTS);
    return {
      type: 'num',
      skill: 'area-triangle',
      lesson: '5-2',
      title: 'Area of a triangle',
      prompt: `<p>${name} is cutting a triangular ${obj}. Its base is ${hl(fmt(t.b) + ' ' + t.u)} and its height is ${hl(fmt(t.h) + ' ' + t.u)}.${t.outside ? ' The height is drawn outside the triangle because the triangle is obtuse.' : ''}</p>${t.svg}<p>What is the area of the ${obj}?</p>`,
      unit: sq(t.u),
      answer: t.A,
      reference: true,
      hints: [
        'A triangle is half of a parallelogram with the same base and height. Area = ½ × base × height.',
        `Base = ${fmt(t.b)}, height = ${fmt(t.h)}. ${t.outside ? 'Even though the height is drawn outside, it still counts as the height.' : ''}`,
        `${fmt(t.b)} × ${fmt(t.h)} = ${fmt(t.b * t.h)}. Now take half.`,
      ],
      solution: `<p>A = ½ × b × h = ½ × ${fmt(t.b)} × ${fmt(t.h)} = <b>${fmt(t.A)} ${sq(t.u)}</b>. Two copies of this triangle make a parallelogram of area ${fmt(t.b * t.h)}, so the triangle is half.${t.outside ? ' In an obtuse triangle the height falls outside the figure, but the formula is the same.' : ''}</p>`,
      feedback: { correct: `Correct. ½ × ${fmt(t.b)} × ${fmt(t.h)} = ${fmt(t.A)} ${sq(t.u)}.`, wrong: (ans, d) => coach(t, d.value) },
    };
  });

  // ---------- Fill the formula (blanks, template) ----------
  G.define('g2_blanksFormula', (r) => {
    const t = tri(r, { side: true });
    return {
      type: 'blanks',
      skill: 'area-triangle',
      lesson: '5-2',
      title: 'Fill in the formula',
      prompt: `<p>Use the formula to find the area of the triangle. Write the base first, then the height. One label on the figure is a slanted side, which the formula does not use.</p>${t.svg}`,
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
        `½ × ${fmt(t.b)} × ${fmt(t.h)} = half of ${fmt(t.b * t.h)}.`,
      ],
      solution: `<p>Area = ½ × <b>${fmt(t.b)}</b> × <b>${fmt(t.h)}</b> = <b>${fmt(t.A)}</b> ${sq(t.u)}. The slanted side (${fmt(t.s)} ${t.u}) is longer than the height and is never used in the area formula.</p>`,
      feedback: {
        correct: 'Correct. Base, perpendicular height, and the half.',
        wrong(ans, d) {
          const hv = parseNum(ans[1]);
          if (hv != null && Math.abs(hv - t.s) < 0.01) return `You used the slanted side ${fmt(t.s)} as the height. The height is the dashed segment, ${fmt(t.h)} ${t.u}.`;
          if (d.wrong.length === 1 && d.wrong[0] === 2) return `Base and height are right. Area = ½ × ${fmt(t.b)} × ${fmt(t.h)}: multiply, then halve.`;
          return `Base = ${fmt(t.b)} (the bottom side). Height = ${fmt(t.h)} (the dashed segment).`;
        },
      },
    };
  });

  // ---------- Who is correct? forgot the half vs slanted side (who) ----------
  G.define('g2_whoHalf', (r) => {
    const t = tri(r, { side: true });
    const [n1, n2, n3] = r.pickN(NAMES, 3);
    const sh = shuffleOptions(
      r,
      [
        { title: n1, html: `A = ½ × ${fmt(t.b)} × ${fmt(t.h)}<br><b>A = ${fmt(t.A)} ${sq(t.u)}</b>`, ok: true },
        {
          title: n2,
          html: `A = ${fmt(t.b)} × ${fmt(t.h)}<br><b>A = ${fmt(t.b * t.h)} ${sq(t.u)}</b>`,
          why: `${n2} forgot the ½. Base × height is the area of a parallelogram; the triangle is half of it.`,
        },
        {
          title: n3,
          html: `A = ½ × ${fmt(t.b)} × ${fmt(t.s)}<br><b>A = ${fmt(round((t.b * t.s) / 2, 2))} ${sq(t.u)}</b>`,
          why: `${n3} used the slanted side (${fmt(t.s)}) as the height. The height is the perpendicular segment, ${fmt(t.h)}.`,
        },
      ],
      0,
    );
    return {
      type: 'who',
      skill: 'area-triangle',
      lesson: '5-2',
      title: 'Who is correct?',
      prompt: `<p>Three students find the area of this triangle. Who is correct?</p>${t.svg}`,
      options: sh.options,
      answer: sh.answer,
      layout: 'cards',
      hints: [
        'Check two things in each solution: did they include the ½, and did they use the perpendicular height?',
        `The perpendicular height is ${fmt(t.h)} ${t.u}, not ${fmt(t.s)} ${t.u}.`,
        `½ × ${fmt(t.b)} × ${fmt(t.h)} = ${fmt(t.A)}.`,
      ],
      solution: `<p><b>${n1}</b> is correct: ½ × ${fmt(t.b)} × ${fmt(t.h)} = ${fmt(t.A)} ${sq(t.u)}. ${n2} forgot the ½, and ${n3} used the slanted side instead of the height.</p>`,
      feedback: { correct: `Correct. ${n1} used the half and the perpendicular height.` },
    };
  });

  // ---------- Order triangles by area (seq) ----------
  G.define('g2_seqArea', (r) => {
    const u = r.pick(U5.UNITS);
    const dims = [];
    const seen = new Set();
    while (dims.length < 3) {
      const b = r.int(4, 12),
        h = r.int(3, 9);
      const A = (b * h) / 2;
      if ((b * h) % 2 || seen.has(A)) continue;
      seen.add(A);
      dims.push({ b, h, A, outside: r.chance(0.3) });
    }
    const asc = r.chance(0.5);
    const items = dims.map((d) => ({ html: miniTri(d.b, d.h, u, d.outside) + `<div class="muted">base ${d.b} ${u}, height ${d.h} ${u}</div>`, rate: d.A }));
    const order = [0, 1, 2].sort((a, b) => (asc ? items[a].rate - items[b].rate : items[b].rate - items[a].rate));
    return {
      type: 'seq',
      skill: 'area-triangle',
      lesson: '5-2',
      title: 'Order by area',
      prompt: `<p>Order the three triangles from <b>${asc ? 'least' : 'greatest'}</b> area (top) to <b>${asc ? 'greatest' : 'least'}</b> area (bottom).</p>`,
      items,
      order,
      hints: [
        'Find each area with ½ × base × height. Do not judge by how tall or wide the picture looks.',
        `Areas: ${dims.map((d) => `½ × ${d.b} × ${d.h} = ${d.A}`).join('; ')}.`,
        `${asc ? 'Smallest' : 'Largest'} first: ${order.map((i) => dims[i].A).join(', ')}.`,
      ],
      solution: `<p>${dims.map((d) => `base ${d.b}, height ${d.h} → ${d.A} ${sq(u)}`).join('; ')}. From ${asc ? 'least to greatest' : 'greatest to least'}: <b>${order.map((i) => dims[i].A).join(', ')}</b>.</p>`,
      feedback: {
        correct: 'Correct. Computing each area beats eyeballing the pictures.',
        wrong() {
          return `Compute each area first: ${dims.map((d) => d.A).join(', ')}. Then check the direction: ${asc ? 'least' : 'greatest'} at the top.`;
        },
      },
    };
  });

  // ---------- Missing height or base from the area (num) ----------
  G.define('g2_missingHeight', (r, o) => {
    const u = r.pick(U5.UNITS);
    let b, h;
    if (o.hard) {
      b = 4 * r.int(2, 5);
      h = r.int(3, 9) + 0.5;
    } else {
      b = r.int(4, 14);
      h = r.int(3, 12);
      if ((b * h) % 2) b += 1;
    }
    const A = round((b * h) / 2, 2);
    const askHeight = o.hard ? true : r.chance(0.6);
    const want = askHeight ? h : b,
      other = askHeight ? b : h;
    const otherName = askHeight ? 'base' : 'height',
      wantName = askHeight ? 'height' : 'base';
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
      title: o.hard ? `Seal of Area: missing ${wantName}` : `Find the missing ${wantName}`,
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
      solution: `<p>A = ½ × b × h, so b × h = 2 × A = ${fmt(2 * A)}. Then ${wantName} = ${fmt(2 * A)} ÷ ${fmt(other)} = <b>${fmt(want)} ${u}</b>. Check: ½ × ${fmt(b)} × ${fmt(h)} = ${fmt(A)}.</p>`,
      feedback: {
        correct: `Correct. Doubling the area undoes the ½; dividing by the ${otherName} leaves the ${wantName}: ${fmt(want)} ${u}.`,
        wrong(ans, d) {
          const v = d.value;
          if (v != null && Math.abs(v - A / other) < 0.01)
            return `You divided the area by the ${otherName} but forgot the ½. Double the area first: 2 × ${fmt(A)} = ${fmt(2 * A)}, then divide by ${fmt(other)}.`;
          if (v != null && Math.abs(v - 2 * A) < 0.01) return `${fmt(2 * A)} is base × height. Divide by the ${otherName} ${fmt(other)} to get the ${wantName}.`;
          if (v != null && Math.abs(v - A / other / 2) < 0.01) return `You halved twice. The ½ is already in the area. Double the area, then divide by ${fmt(other)}.`;
          return `Work backward: 2 × ${fmt(A)} ÷ ${fmt(other)}.`;
        },
      },
    };
  });

  // ---------- Table with a missing area, height, and base (table) ----------
  G.define('g2_tableMissing', (r) => {
    const u = r.pick(U5.UNITS),
      name = r.pick(NAMES);
    const mk = () => {
      let b = r.int(4, 14),
        h = r.int(3, 10);
      if ((b * h) % 2) b += 1;
      return { b, h, A: (b * h) / 2 };
    };
    const d = [mk(), mk(), mk()];
    const rows = [
      ['Triangle', `Base (${u})`, `Height (${u})`, `Area (${sq(u)})`],
      ['A', String(d[0].b), String(d[0].h), '__IN:a0__'],
      ['B', String(d[1].b), '__IN:h1__', String(d[1].A)],
      ['C', '__IN:b2__', String(d[2].h), String(d[2].A)],
    ];
    return {
      type: 'table',
      skill: 'missing-measures',
      lesson: '5-2',
      title: 'Complete the triangle table',
      prompt: `<p>${name} is checking three triangular plates measured in ${u}. One number is missing from each row. Complete the table.</p>`,
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
        `A: ½ × ${d[0].b} × ${d[0].h}. B: 2 × ${d[1].A} = ${2 * d[1].A}, then ÷ ${d[1].b}.`,
        `C: 2 × ${d[2].A} = ${2 * d[2].A}, then ÷ ${d[2].h}.`,
      ],
      solution: `<p>A: ½ × ${d[0].b} × ${d[0].h} = <b>${d[0].A}</b>. B: ${2 * d[1].A} ÷ ${d[1].b} = <b>${d[1].h}</b>. C: ${2 * d[2].A} ÷ ${d[2].h} = <b>${d[2].b}</b>. Doubling the area undoes the ½ in the formula.</p>`,
      feedback: {
        correct: 'Correct. Forward: half of base × height. Backward: double the area, then divide.',
        wrong(ans, d2) {
          if (d2.wrong.includes('a0')) return `Row A: multiply ${d[0].b} × ${d[0].h}, then take half.`;
          if (d2.wrong.includes('h1')) return `Row B: 2 × ${d[1].A} = ${2 * d[1].A}. Divide by the base ${d[1].b}.`;
          return `Row C: 2 × ${d[2].A} = ${2 * d[2].A}. Divide by the height ${d[2].h}.`;
        },
      },
    };
  });

  // ---------- Error: forgot to double the area when finding the height (error) ----------
  G.define('g2_errorDouble', (r) => {
    const u = r.pick(U5.UNITS),
      name = r.pick(NAMES);
    const b = 2 * r.int(3, 8),
      h = r.int(4, 12),
      A = (b * h) / 2;
    const wrongH = A / b;
    const sh = shuffleOptions(
      r,
      [
        { html: `${name} forgot the ½ in the formula. Base × height equals 2 × ${A} = ${2 * A}, so the height is ${2 * A} ÷ ${b}.`, ok: true },
        {
          html: `${name} should have divided the area by 2 first, then divided by ${b}.`,
          why: `Dividing by 2 makes the height even smaller. The ½ in the formula means base × height is twice the area, so multiply the area by 2.`,
        },
        { html: `${name} should have multiplied ${A} × ${b}.`, why: 'Multiplying area by base gives a huge number with no meaning. Work backward from A = ½ × b × h by dividing.' },
        { html: `${name}'s work is correct.`, why: `Check it: ½ × ${b} × ${fmt(wrongH)} = ${fmt((b * wrongH) / 2)}, not ${A}. The height is too small.` },
      ],
      0,
    );
    return {
      type: 'error',
      skill: 'missing-measures',
      lesson: '5-2',
      title: 'Find the mistake',
      prompt: `<p>A triangle has an area of ${hl(A + ' ' + sq(u))} and a base of ${hl(b + ' ' + u)}. ${name} tried to find the height.</p><p>What is wrong with ${name}'s work?</p>`,
      work: `A = ½ × b × h<br>${A} = ½ × ${b} × h<br>h = ${A} ÷ ${b} = ${fmt(wrongH)} ${u}`,
      options: sh.options,
      answer: sh.answer,
      fix: { label: `Correct height (${u}):`, answer: h },
      hints: [
        `Check ${name}'s answer: does ½ × ${b} × ${fmt(wrongH)} equal ${A}?`,
        `½ × ${b} × ${fmt(wrongH)} = ${fmt((b * wrongH) / 2)}. Too small. The ½ was skipped when working backward.`,
        `Double the area: 2 × ${A} = ${2 * A}. Then ${2 * A} ÷ ${b}.`,
      ],
      solution: `<p>From A = ½ × b × h, base × height = 2 × A = ${2 * A}. So h = ${2 * A} ÷ ${b} = <b>${h} ${u}</b>. ${name} divided the area by the base without undoing the ½, which gave half the true height.</p>`,
      feedback: {
        correct: `Correct. When working backward, undo the ½ by doubling the area. h = ${2 * A} ÷ ${b} = ${h}.`,
        wrong(ans, d) {
          if (!d.mistakeOk) return (sh.options[ans.mistake] && sh.options[ans.mistake].why) || `Test the student's height in the formula: ½ × ${b} × ${fmt(wrongH)}.`;
          return `You found the mistake. For the fix: 2 × ${A} = ${2 * A}, then ÷ ${b}.`;
        },
      },
    };
  });

  // ---------- Constructed response: why the height sits outside / why the half (cr) ----------
  G.define('g2_crHeight', (r) => {
    const t = tri(r, { outside: true });
    if (r.chance(0.5)) {
      const sh = shuffleOptions(
        r,
        [
          { html: `${fmt(t.A)} ${sq(t.u)}`, ok: true },
          { html: `${fmt(t.b * t.h)} ${sq(t.u)}`, why: 'That is base × height without the ½.' },
          { html: `${fmt(t.b + t.h)} ${sq(t.u)}`, why: 'That adds the base and height.' },
        ],
        0,
      );
      return {
        type: 'cr',
        skill: 'area-triangle',
        lesson: '5-2',
        title: 'Explain the outside height',
        prompt: `<p>In this obtuse triangle, the dashed height is drawn <b>outside</b> the figure.</p>${t.svg}<p>Explain why the height is drawn there and how you would still find the area. Then answer the check question.</p>`,
        starters: ['The height must make a right angle with…', 'The dashed line is outside because…', 'To find the area, I would…'],
        minWords: 10,
        check: { prompt: `What is the area of the triangle (base ${fmt(t.b)} ${t.u}, height ${fmt(t.h)} ${t.u})?`, options: sh.options, answer: sh.answer },
        hints: [
          'The height is the perpendicular distance from the base line to the top vertex. In an obtuse triangle, the top vertex sits past the end of the base.',
          'The base line is extended so the height can meet it at a right angle. The formula does not change.',
          `Area = ½ × ${fmt(t.b)} × ${fmt(t.h)}.`,
        ],
        solution: `<p>The height is the perpendicular distance from the top vertex to the line of the base. The vertex is past the end of the base, so the base line is extended and the height lands outside. The area is still ½ × ${fmt(t.b)} × ${fmt(t.h)} = <b>${fmt(t.A)} ${sq(t.u)}</b>.</p>`,
        feedback: {
          correct: 'Correct. The height is a perpendicular distance, inside or outside, and the formula stays ½ × b × h.',
          wrong(ans, d) {
            return !d.wroteEnough ? 'Write a few more words. Mention the right angle and the extended base.' : `Your explanation is in. For the check: ½ × ${fmt(t.b)} × ${fmt(t.h)}.`;
          },
        },
      };
    }
    const P = t.b * t.h;
    const sh = shuffleOptions(
      r,
      [
        { html: `${fmt(P / 2)} ${sq(t.u)}`, ok: true },
        { html: `${fmt(P)} ${sq(t.u)}`, why: 'That is the whole parallelogram.' },
        { html: `${fmt(P * 2)} ${sq(t.u)}`, why: 'The triangle is smaller than the parallelogram, not bigger.' },
      ],
      0,
    );
    return {
      type: 'cr',
      skill: 'area-triangle',
      lesson: '5-2',
      title: 'Explain the half',
      prompt: `<p>A parallelogram has base ${hl(fmt(t.b) + ' ' + t.u)} and height ${hl(fmt(t.h) + ' ' + t.u)}, so its area is ${fmt(P)} ${sq(t.u)}. A triangle has the same base and the same height.</p><p>Explain why the triangle's area is <b>half</b> the parallelogram's area. Then answer the check question.</p>`,
      starters: ['If I cut the parallelogram along a diagonal…', 'Two copies of the triangle…', 'The triangle has the same base and height, but…'],
      minWords: 10,
      check: { prompt: "What is the triangle's area?", options: sh.options, answer: sh.answer },
      hints: [
        'Picture cutting the parallelogram along a diagonal. What two pieces do you get?',
        'The two pieces are identical triangles, each with the same base and height as the parallelogram.',
        `Half of ${fmt(P)}.`,
      ],
      solution: `<p>Cutting a parallelogram along a diagonal makes two identical triangles with the same base and height. Each is half the parallelogram, so the triangle's area is ½ × ${fmt(P)} = <b>${fmt(P / 2)} ${sq(t.u)}</b>. That is where the ½ in the formula comes from.</p>`,
      feedback: {
        correct: 'Correct. Two identical triangles make the parallelogram, so each is half.',
        wrong(ans, d) {
          return !d.wroteEnough ? 'Add a bit more. Mention the diagonal and the two identical triangles.' : `Your explanation is in. For the check: half of ${fmt(P)}.`;
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

  /** Isosceles trapezoid with whole-number pieces: rectangle b2 × h plus two triangles with base `off` and height h. */
  function isoTrap(r, o) {
    o = o || {};
    const off = r.pick([1, 2, 3, 4]);
    let h = r.int(3, 8);
    if ((off * h) % 2) h += 1; // each triangle area off*h/2 is whole
    const b2 = r.int(Math.max(3, off + 1), off + 7);
    const b1 = b2 + 2 * off;
    const u = o.u || r.pick(U5.UNITS);
    return { b1, b2, h, off, u, rect: b2 * h, tri: (off * h) / 2, A: ((b1 + b2) * h) / 2 };
  }
  /** Draw an isosceles trapezoid; o.decompose adds both dashed heights and the triangle-base label. */
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
    if (o.decompose) labels.push({ x: off / 2, y: 0, text: `${fmt(off)}`, dy: 20, size: 11 }, { x: b1 - off / 2, y: 0, text: `${fmt(off)}`, dy: 20, size: 11 });
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
  function coachFormula(t, v) {
    const { b1, b2, h, A, u } = t;
    if (v == null) return `Area of a trapezoid = ½ × (b₁ + b₂) × h. The bases are ${fmt(b1)} and ${fmt(b2)}; the height is ${fmt(h)}.`;
    if (Math.abs(v - (b1 + b2) * h) < 0.01) return `${fmt((b1 + b2) * h)} is (b₁ + b₂) × h without the ½. Take half of it.`;
    if (Math.abs(v - b1 * h) < 0.01) return `${fmt(b1 * h)} is the long base × height, the area of a parallelogram that is too big. Add both bases first, then take half.`;
    if (Math.abs(v - b2 * h) < 0.01) return `${fmt(b2 * h)} is the short base × height. That leaves out the two triangles. Add both bases first, then take half.`;
    if (Math.abs(v - (b1 + b2 + h)) < 0.01) return 'Adding the three numbers gives a length, not an area. Use ½ × (b₁ + b₂) × h.';
    if (Math.abs(v - (b1 * b2 * h) / 2) < 0.01) return `You multiplied the bases. The formula adds them: ${fmt(b1)} + ${fmt(b2)} = ${fmt(b1 + b2)}.`;
    return `½ × (${fmt(b1)} + ${fmt(b2)}) × ${fmt(h)}. Add the bases, multiply by the height, then take half. The answer is in ${sq(u)}.`;
  }

  // ---------- Decompose into a rectangle and two triangles (blanks, template) ----------
  G.define('g3_decomposeRect', (r) => {
    const t = isoTrap(r);
    const name = r.pick(NAMES),
      obj = r.pick(OBJECTS);
    return {
      type: 'blanks',
      skill: 'trapezoid-decompose',
      lesson: '5-3',
      title: 'Cut the trapezoid apart',
      prompt: `<p>${name} cuts a trapezoid-shaped ${obj} along the two dashed heights. The bases are ${hl(fmt(t.b1) + ' ' + t.u)} and ${hl(fmt(t.b2) + ' ' + t.u)}, and the height is ${hl(fmt(t.h) + ' ' + t.u)}. The pieces are a rectangle in the middle and two identical triangles, each with a base of ${fmt(t.off)} ${t.u}.</p>${isoSvg(t, { decompose: true })}<p>Find the area of each piece, then the whole figure.</p>`,
      fields: [
        { label: 'rectangle', answer: t.rect },
        { label: 'one triangle', answer: t.tri },
        { label: 'total', answer: t.A },
      ],
      template: `Rectangle: {0} ${sq(t.u)}. One triangle: {1} ${sq(t.u)}. Total area: {2} ${sq(t.u)}.`,
      reference: true,
      hints: [
        'Decompose means cut the figure into shapes you know. The rectangle is base × height. Each triangle is ½ × base × height.',
        `Rectangle: ${fmt(t.b2)} × ${fmt(t.h)}. Each triangle: ½ × ${fmt(t.off)} × ${fmt(t.h)}.`,
        `Total = rectangle + 2 triangles = ${fmt(t.rect)} + ${fmt(t.tri)} + ${fmt(t.tri)}.`,
      ],
      solution: `<p>Rectangle: ${fmt(t.b2)} × ${fmt(t.h)} = <b>${fmt(t.rect)}</b> ${sq(t.u)}. One triangle: ½ × ${fmt(t.off)} × ${fmt(t.h)} = <b>${fmt(t.tri)}</b> ${sq(t.u)}. Total: ${fmt(t.rect)} + 2 × ${fmt(t.tri)} = <b>${fmt(t.A)}</b> ${sq(t.u)}. The rectangle uses the <i>short</i> base because that is the width of the middle piece; the two triangles make up the rest of the long base.</p>`,
      feedback: {
        correct: `Correct. Rectangle ${fmt(t.rect)} plus two triangles of ${fmt(t.tri)} each is ${fmt(t.A)} ${sq(t.u)}.`,
        wrong(ans, d) {
          const rv = parseNum(ans[0]),
            tv = parseNum(ans[1]),
            tot = parseNum(ans[2]);
          if (rv != null && Math.abs(rv - t.b1 * t.h) < 0.01) return `The rectangle is only as wide as the short base, ${fmt(t.b2)} ${t.u}, not the long base. Rectangle = ${fmt(t.b2)} × ${fmt(t.h)}.`;
          if (tv != null && Math.abs(tv - t.off * t.h) < 0.01) return `Each triangle is half of ${fmt(t.off)} × ${fmt(t.h)}. Do not forget the ½.`;
          if (tot != null && Math.abs(tot - (t.rect + t.tri)) < 0.01) return 'You added only one triangle. There are two identical triangles, one on each end.';
          if (d.wrong.length === 1 && d.wrong[0] === 2) return `Rectangle and triangle are right. Total = ${fmt(t.rect)} + ${fmt(t.tri)} + ${fmt(t.tri)}.`;
          return `Rectangle: ${fmt(t.b2)} × ${fmt(t.h)}. Triangle: ½ × ${fmt(t.off)} × ${fmt(t.h)}. Then add rectangle + 2 triangles.`;
        },
      },
    };
  });

  // ---------- Which expression decomposes the trapezoid correctly? (mc) ----------
  G.define('g3_whichDecomp', (r) => {
    const t = isoTrap(r);
    const { b1, b2, h, off } = t;
    const sh = shuffleOptions(
      r,
      [
        { html: `${fmt(b2)} × ${fmt(h)} + 2 × (½ × ${fmt(off)} × ${fmt(h)})`, ok: true },
        {
          html: `${fmt(b1)} × ${fmt(h)} + 2 × (½ × ${fmt(off)} × ${fmt(h)})`,
          why: `The rectangle in the middle is only ${fmt(b2)} ${t.u} wide (the short base). Using ${fmt(b1)} counts the two corner triangles twice.`,
        },
        { html: `${fmt(b2)} × ${fmt(h)} + ½ × ${fmt(off)} × ${fmt(h)}`, why: 'This adds only one triangle. The trapezoid has a triangle on each end, so add two.' },
        { html: `${fmt(b2)} × ${fmt(h)} + 2 × (${fmt(off)} × ${fmt(h)})`, why: `${fmt(off)} × ${fmt(h)} is a rectangle, not a triangle. Each triangle is half of that: ½ × ${fmt(off)} × ${fmt(h)}.` },
      ],
      0,
    );
    return {
      type: 'mc',
      skill: 'trapezoid-decompose',
      lesson: '5-3',
      title: 'Choose the decomposition',
      prompt: `<p>The dashed heights cut this trapezoid into a rectangle and two identical triangles. The bases are ${fmt(b1)} ${t.u} and ${fmt(b2)} ${t.u}, the height is ${fmt(h)} ${t.u}, and each triangle has a base of ${fmt(off)} ${t.u}.</p>${isoSvg(t, { decompose: true })}<p>Which expression gives the area of the trapezoid in ${sq(t.u)}?</p>`,
      options: sh.options,
      answer: sh.answer,
      hints: [
        'Write one term for the rectangle (base × height) and one for the two triangles (2 × ½ × base × height).',
        `The rectangle is ${fmt(b2)} wide and ${fmt(h)} tall. Each triangle has base ${fmt(off)} and height ${fmt(h)}.`,
        `Rectangle ${fmt(b2)} × ${fmt(h)}, plus 2 × (½ × ${fmt(off)} × ${fmt(h)}).`,
      ],
      solution: `<p>Rectangle: ${fmt(b2)} × ${fmt(h)} = ${fmt(t.rect)}. Two triangles: 2 × (½ × ${fmt(off)} × ${fmt(h)}) = ${fmt(2 * t.tri)}. So the area is <b>${fmt(b2)} × ${fmt(h)} + 2 × (½ × ${fmt(off)} × ${fmt(h)})</b> = ${fmt(t.A)} ${sq(t.u)}. The short base is the rectangle's width; the long base is the short base plus the two triangle bases.</p>`,
      feedback: { correct: 'Correct. Rectangle on the short base, plus two half-base-times-height triangles.' },
    };
  });

  // ---------- Right trapezoid: rectangle + one triangle (num) ----------
  G.define('g3_rightTrap', (r) => {
    const u = r.pick(U5.UNITS),
      name = r.pick(NAMES),
      obj = r.pick(OBJECTS);
    const d = r.int(2, 6);
    let h = r.int(3, 8);
    if ((d * h) % 2) h += 1;
    const b2 = r.int(d + 1, d + 8),
      b1 = b2 + d;
    const rect = b2 * h,
      tri = (d * h) / 2,
      A = rect + tri;
    return {
      type: 'num',
      skill: 'trapezoid-decompose',
      lesson: '5-3',
      title: 'Right trapezoid',
      prompt: `<p>${name}'s ${obj} is a right trapezoid. Its bases are ${hl(fmt(b1) + ' ' + u)} and ${hl(fmt(b2) + ' ' + u)}, and its height is ${hl(fmt(h) + ' ' + u)}. The dashed height splits it into a rectangle and one triangle. The triangle's base is ${fmt(b1)} − ${fmt(b2)} = ${fmt(d)} ${u}.</p>${U5.rightTrapezoid(b1, b2, h, { u: ' ' + u })}<p>What is the area of the ${obj}?</p>`,
      unit: sq(u),
      answer: A,
      reference: true,
      hints: [
        'Find the rectangle (short base × height) and the triangle (½ × its base × height), then add.',
        `Rectangle: ${fmt(b2)} × ${fmt(h)} = ${fmt(rect)}. Triangle: ½ × ${fmt(d)} × ${fmt(h)}.`,
        `${fmt(rect)} + ${fmt(tri)}.`,
      ],
      solution: `<p>Rectangle: ${fmt(b2)} × ${fmt(h)} = ${fmt(rect)}. Triangle: ½ × ${fmt(d)} × ${fmt(h)} = ${fmt(tri)}. Area = ${fmt(rect)} + ${fmt(tri)} = <b>${fmt(A)} ${sq(u)}</b>. Check with the formula: ½ × (${fmt(b1)} + ${fmt(b2)}) × ${fmt(h)} = ${fmt(A)}. Both ways agree because the formula is just a shortcut for decomposing.</p>`,
      feedback: {
        correct: `Correct. ${fmt(rect)} + ${fmt(tri)} = ${fmt(A)} ${sq(u)}. Decomposing and the formula give the same area.`,
        wrong(ans, dd) {
          const v = dd.value;
          if (v == null) return 'Area of the rectangle plus area of the triangle.';
          if (Math.abs(v - b1 * h) < 0.01) return `${fmt(b1 * h)} treats the whole figure as a ${fmt(b1)} by ${fmt(h)} rectangle. The slanted side cuts a triangle off that rectangle.`;
          if (Math.abs(v - rect) < 0.01) return `${fmt(rect)} is just the rectangle. Add the triangle: ½ × ${fmt(d)} × ${fmt(h)}.`;
          if (Math.abs(v - (rect + d * h)) < 0.01) return `You added a ${fmt(d)} by ${fmt(h)} rectangle instead of a triangle. The triangle is half of that: ${fmt(tri)}.`;
          return coachFormula({ b1, b2, h, A, u }, v);
        },
      },
    };
  });

  // ---------- Match each piece to its area (match) ----------
  G.define('g3_matchParts', (r) => {
    const t = isoTrap(r);
    const pairs = [
      [`Rectangle (${fmt(t.b2)} × ${fmt(t.h)})`, `${fmt(t.rect)} ${sq(t.u)}`],
      [`One triangle (base ${fmt(t.off)}, height ${fmt(t.h)})`, `${fmt(t.tri)} ${sq(t.u)}`],
      ['Both triangles together', `${fmt(2 * t.tri)} ${sq(t.u)}`],
      ['The whole trapezoid', `${fmt(t.A)} ${sq(t.u)}`],
    ];
    const right = r.shuffle(pairs.map((p, i) => i));
    return {
      type: 'match',
      skill: 'trapezoid-decompose',
      lesson: '5-3',
      title: 'Match the pieces to their areas',
      prompt: `<p>This trapezoid has bases ${hl(fmt(t.b1) + ' ' + t.u)} and ${hl(fmt(t.b2) + ' ' + t.u)} and height ${hl(fmt(t.h) + ' ' + t.u)}. The dashed heights cut it into a rectangle and two identical triangles with base ${fmt(t.off)} ${t.u}.</p>${isoSvg(t, { decompose: true })}<p>Match each piece to its area.</p>`,
      left: pairs.map((p) => p[0]),
      right: right.map((i) => pairs[i][1]),
      pairs: pairs.map((p, i) => [i, right.indexOf(i)]),
      reference: true,
      hints: [
        'Rectangle = base × height. Triangle = ½ × base × height. The whole trapezoid is the rectangle plus both triangles.',
        `Rectangle: ${fmt(t.b2)} × ${fmt(t.h)}. One triangle: ½ × ${fmt(t.off)} × ${fmt(t.h)}. Both triangles: double that.`,
        `Whole trapezoid: ${fmt(t.rect)} + ${fmt(2 * t.tri)}.`,
      ],
      solution: `<ul>${pairs.map((p) => `<li>${p[0]} → <b>${p[1]}</b></li>`).join('')}</ul><p>The two triangles together equal ${fmt(t.off)} × ${fmt(t.h)}, a rectangle, which is why the whole trapezoid also equals ½ × (${fmt(t.b1)} + ${fmt(t.b2)}) × ${fmt(t.h)}.</p>`,
      feedback: {
        correct: 'Correct. Each piece has its own area, and the pieces add up to the whole.',
        wrong(ans, d) {
          if (d.wrong && d.wrong.includes(1)) return `One triangle is ½ × ${fmt(t.off)} × ${fmt(t.h)}. Both together is twice that.`;
          if (d.wrong && d.wrong.includes(0)) return `The rectangle is ${fmt(t.b2)} wide (the short base) and ${fmt(t.h)} tall.`;
          return 'Start with the rectangle and one triangle. The other two values are built from those.';
        },
      },
    };
  });

  // ---------- The formula ½(b₁ + b₂)h (num, honors hard) ----------
  G.define('g3_formula', (r, o) => {
    const u = r.pick(U5.UNITS),
      name = r.pick(NAMES),
      obj = r.pick(OBJECTS);
    let b1, b2, h;
    if (o.hard) {
      // bases sum to a multiple of 4 so a half-unit height still gives a whole area
      b2 = r.int(5, 12);
      b1 = b2 + r.pick([2, 4, 6]);
      while ((b1 + b2) % 4) b1 += 1;
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
      height: `${U5.mixed(h)} ${u}`,
      aria: `Trapezoid with bases ${fmt(b1)} ${u} and ${fmt(b2)} ${u} and height ${U5.mixed(h)} ${u}`,
    });
    return {
      type: 'num',
      skill: 'trapezoid-formula',
      lesson: '5-3',
      title: o.hard ? 'Seal of Area: trapezoid' : 'Use the trapezoid formula',
      xp: o.xp,
      prompt: `<p>${name} measures a trapezoid-shaped ${obj}. The two parallel sides, the bases, are ${hl(fmt(b1) + ' ' + u)} and ${hl(fmt(b2) + ' ' + u)}. The height is ${hl(U5.mixed(h) + ' ' + u)}.</p>${svg}<p>Use the formula A = ½ × (b₁ + b₂) × h to find the area.</p>`,
      unit: sq(u),
      answer: A,
      reference: true,
      hints: [
        'Add the two bases first. The parentheses tell you to do that before multiplying.',
        `(${fmt(b1)} + ${fmt(b2)}) = ${fmt(b1 + b2)}. Now multiply by the height ${U5.mixed(h)}${o.hard ? ' (that is ' + fmt(h) + ')' : ''}.`,
        `${fmt(b1 + b2)} × ${fmt(h)} = ${fmt((b1 + b2) * h)}. Take half.`,
      ],
      solution: `<p>A = ½ × (${fmt(b1)} + ${fmt(b2)}) × ${fmt(h)} = ½ × ${fmt(b1 + b2)} × ${fmt(h)} = ½ × ${fmt((b1 + b2) * h)} = <b>${fmt(A)} ${sq(u)}</b>. The formula averages the two bases (half their sum is ${fmt((b1 + b2) / 2)}) and multiplies by the height, like a rectangle ${fmt((b1 + b2) / 2)} by ${fmt(h)}.</p>`,
      feedback: { correct: `Correct. ½ × ${fmt(b1 + b2)} × ${fmt(h)} = ${fmt(A)} ${sq(u)}.`, wrong: (ans, d) => coachFormula(t, d.value) },
    };
  });

  // ---------- Step through the formula (blanks, template) ----------
  G.define('g3_blanksFormula', (r) => {
    const u = r.pick(U5.UNITS);
    const b2 = r.int(3, 10);
    let b1 = b2 + r.int(2, 8);
    if ((b1 + b2) % 2) b1 += 1;
    const h = r.int(3, 9);
    const sum = b1 + b2,
      half = sum / 2,
      A = half * h;
    const svg = V.trapezoid(b1, b2, h, { b1: `${b1} ${u}`, b2: `${b2} ${u}`, height: `${h} ${u}`, aria: `Trapezoid with bases ${b1} ${u} and ${b2} ${u} and height ${h} ${u}` });
    return {
      type: 'blanks',
      skill: 'trapezoid-formula',
      lesson: '5-3',
      title: 'Work the formula step by step',
      prompt: `<p>The bases of this trapezoid are ${hl(b1 + ' ' + u)} and ${hl(b2 + ' ' + u)}. The height is ${hl(h + ' ' + u)}.</p>${svg}<p>Complete each step of A = ½ × (b₁ + b₂) × h.</p>`,
      fields: [
        { label: 'sum of bases', answer: sum },
        { label: 'half the sum', answer: half },
        { label: 'height', answer: h },
        { label: 'area', answer: A },
      ],
      template: `The bases add to {0} ${u}. Half of that is {1} ${u}. Multiply by the height, {2} ${u}: A = {3} ${sq(u)}.`,
      reference: true,
      hints: ['Do the parentheses first: add the two bases. Then take half. Then multiply by the height.', `${b1} + ${b2} = ${sum}. Half of ${sum} is ${half}.`, `${half} × ${h}.`],
      solution: `<p>${b1} + ${b2} = <b>${sum}</b>. Half is <b>${half}</b>. Multiply by the height <b>${h}</b>: ${half} × ${h} = <b>${A}</b> ${sq(u)}. Half the sum of the bases is the "average base," so the trapezoid has the same area as a ${half} by ${h} rectangle.</p>`,
      feedback: {
        correct: 'Correct. Add the bases, halve, multiply by the height.',
        wrong(ans, d) {
          const s = parseNum(ans[0]),
            hv = parseNum(ans[2]);
          if (s != null && Math.abs(s - b1 * b2) < 0.01) return `The formula adds the bases, it does not multiply them: ${b1} + ${b2}.`;
          if (hv != null && Math.abs(hv - h) > 0.01) return `The height is the dashed segment that makes a right angle with the bases: ${h} ${u}.`;
          if (d.wrong.includes(1)) return `Half of ${sum} is ${sum} ÷ 2.`;
          if (d.wrong.length === 1 && d.wrong[0] === 3) return `The first three steps are right. Area = ${half} × ${h}.`;
          return `Add the bases: ${b1} + ${b2}. Take half. Multiply by ${h}.`;
        },
      },
    };
  });

  // ---------- Error: order of operations in the formula (error) ----------
  G.define('g3_errorOrder', (r) => {
    const u = r.pick(U5.UNITS),
      name = r.pick(NAMES);
    const b2 = r.int(3, 9),
      b1 = b2 + r.int(2, 7);
    let h = r.int(3, 8);
    if (((b1 + b2) * h) % 2) h += 1;
    const A = ((b1 + b2) * h) / 2;
    const variant = r.pick(['noParens', 'heightInside']);
    let work, opts;
    if (variant === 'noParens') {
      const wrong = round(b1 / 2 + b2 * h, 2);
      work = `A = ½ × (b₁ + b₂) × h<br>A = ½ × ${b1} + ${b2} × ${h}<br>A = ${fmt(b1 / 2)} + ${b2 * h}<br>A = ${fmt(wrong)} ${sq(u)}`;
      opts = [
        { html: `${name} dropped the parentheses. The bases must be added first: ${b1} + ${b2} = ${b1 + b2}, then multiply by ½ and by ${h}.`, ok: true },
        { html: `${name} should have multiplied the bases: ½ × ${b1} × ${b2} × ${h}.`, why: 'The formula adds the bases inside the parentheses. Multiplying them is a different (wrong) calculation.' },
        { html: `${name} forgot the ½ entirely.`, why: `The ½ is there in line 2 (½ × ${b1}). The problem is that it was applied to only one base because the parentheses were dropped.` },
        { html: `${name}'s work is correct.`, why: `Check: a trapezoid with bases ${b1} and ${b2} and height ${h} should be ½ × ${b1 + b2} × ${h} = ${A}, not ${fmt(wrong)}.` },
      ];
    } else {
      const wrong = round(((b1 + b2 + h) * h) / 2, 2);
      work = `A = ½ × (b₁ + b₂) × h<br>A = ½ × (${b1} + ${b2} + ${h}) × ${h}<br>A = ½ × ${b1 + b2 + h} × ${h}<br>A = ${fmt(wrong)} ${sq(u)}`;
      opts = [
        { html: `${name} added the height inside the parentheses. Only the two bases go there: (${b1} + ${b2}). The height multiplies afterward.`, ok: true },
        { html: `${name} should not have used ½.`, why: 'The ½ belongs in the trapezoid formula. The mistake is what was added inside the parentheses.' },
        { html: `${name} used the wrong height.`, why: `${h} is the height. It was used in the right place once, but it was also wrongly added to the bases.` },
        { html: `${name}'s work is correct.`, why: `Check: ½ × (${b1} + ${b2}) × ${h} = ${A}. Adding the height to the bases made the answer too big.` },
      ];
    }
    const sh = shuffleOptions(r, opts, 0);
    const svg = V.trapezoid(b1, b2, h, { b1: `${b1} ${u}`, b2: `${b2} ${u}`, height: `${h} ${u}`, width: 260, aria: `Trapezoid with bases ${b1} ${u} and ${b2} ${u} and height ${h} ${u}` });
    return {
      type: 'error',
      skill: 'trapezoid-formula',
      lesson: '5-3',
      title: 'Find the mistake',
      prompt: `<p>${name} used the formula to find the area of this trapezoid (bases ${b1} ${u} and ${b2} ${u}, height ${h} ${u}).</p>${svg}<p>What is wrong with ${name}'s work?</p>`,
      work,
      options: sh.options,
      answer: sh.answer,
      fix: { label: `Correct area (${sq(u)}):`, answer: A },
      hints: [
        'Compare line 2 of the work with the formula. What is inside the parentheses, and what happened to them?',
        `The parentheses mean: add the two bases first. ${b1} + ${b2} = ${b1 + b2}. Nothing else goes inside.`,
        `Correct: ½ × ${b1 + b2} × ${h} = half of ${(b1 + b2) * h}.`,
      ],
      solution: `<p>In the formula, the parentheses group the two bases: (b₁ + b₂). ${variant === 'noParens' ? `${name} dropped them, so the ½ was applied to only one base and the other base was multiplied by the height on its own.` : `${name} put the height inside them, so the height was counted twice.`} Correct: A = ½ × (${b1} + ${b2}) × ${h} = ½ × ${b1 + b2} × ${h} = <b>${A} ${sq(u)}</b>.</p>`,
      feedback: {
        correct: `Correct. Parentheses first: ${b1} + ${b2} = ${b1 + b2}. Then ½ × ${b1 + b2} × ${h} = ${A}.`,
        wrong(ans, d) {
          if (!d.mistakeOk) return (sh.options[ans.mistake] && sh.options[ans.mistake].why) || 'Look at what is inside the parentheses in line 2.';
          return `You found the mistake. For the fix: ½ × (${b1} + ${b2}) × ${h}.`;
        },
      },
    };
  });

  // ---------- True or false about bases and the formula (tf) ----------
  G.define('g3_tfBases', (r) => {
    const u = r.pick(U5.UNITS);
    const b2 = r.int(3, 8),
      b1 = b2 + 2 * r.int(1, 4),
      h = r.int(3, 8),
      avg = (b1 + b2) / 2,
      A = avg * h;
    const v = r.pick([
      {
        stmt: 'The bases of a trapezoid are its two parallel sides.',
        answer: true,
        reasons: [
          { html: 'The formula uses the two parallel sides as b₁ and b₂. The height is the distance between them.', correct: true },
          { html: 'The bases are the two longest sides.' },
          { html: 'The base is only the bottom side; the top is called the height.' },
        ],
      },
      {
        stmt: `Swapping the bases, using ½ × (${b2} + ${b1}) × ${h} instead of ½ × (${b1} + ${b2}) × ${h}, changes the area.`,
        answer: false,
        reasons: [
          { html: `${b1} + ${b2} and ${b2} + ${b1} are both ${b1 + b2}. The order you add in does not matter, so the area is the same either way.`, correct: true },
          { html: 'The longer base must come first or the ½ is applied to the wrong number.' },
          { html: 'Swapping the bases flips the trapezoid, so the area becomes negative.' },
        ],
      },
      {
        stmt: `A trapezoid with bases ${b1} ${u} and ${b2} ${u} and height ${h} ${u} has the same area as a rectangle that is ${avg} ${u} by ${h} ${u}.`,
        answer: true,
        reasons: [
          { html: `Half the sum of the bases is (${b1} + ${b2}) ÷ 2 = ${avg}. The formula is that "average base" times the height, exactly like a ${avg} by ${h} rectangle.`, correct: true },
          { html: `The rectangle must use the longer base, ${b1}, so it has more area than the trapezoid.` },
          { html: 'A trapezoid and a rectangle can never have the same area because their shapes are different.' },
        ],
      },
      {
        stmt: `If the slanted side of a trapezoid is ${h + 1} ${u} and its height is ${h} ${u}, you should use ${h + 1} for h in the formula.`,
        answer: false,
        reasons: [
          { html: `h is the perpendicular height, the distance straight across between the bases: ${h} ${u}. A slanted side is longer than the height and is not used.`, correct: true },
          { html: `You should use the bigger number so the area is not too small.` },
          { html: `You should add them and use ${2 * h + 1} for h.` },
        ],
      },
      {
        stmt: `Doubling the height of a trapezoid (bases ${b1} and ${b2}) doubles its area.`,
        answer: true,
        reasons: [
          { html: `Area = ½ × ${b1 + b2} × h. The height is a factor, so doubling h doubles the product: ${A} becomes ${2 * A}.`, correct: true },
          { html: 'Doubling the height makes the area four times as big.' },
          { html: 'The height does not affect the area; only the bases do.' },
        ],
      },
    ]);
    const reasons = r.shuffle(v.reasons);
    return {
      type: 'tf',
      skill: 'trapezoid-formula',
      lesson: '5-3',
      title: 'True or false?',
      prompt: `<p>Decide whether the statement is true or false, then choose the best reason.</p><p class="stmt"><b>${v.stmt}</b></p>`,
      answer: v.answer,
      reasons,
      reference: true,
      hints: [
        'Think about the formula ½ × (b₁ + b₂) × h. What are b₁, b₂, and h?',
        'The bases are the parallel sides. The height is perpendicular to them. Half the sum of the bases is the average base.',
        v.answer ? 'The statement matches the formula, so it is true.' : 'The statement goes against the formula, so it is false.',
      ],
      solution: `<p><b>${v.answer ? 'True' : 'False'}.</b> ${reasons.find((x) => x.correct).html}</p>`,
      feedback: {
        correct: 'Correct. The bases are the parallel sides, the height is perpendicular, and the formula averages the bases.',
        wrong(ans, d) {
          return !d.valueOk ? 'Test the statement against the formula with the numbers given.' : 'Your true/false is right. Choose the reason that uses the formula correctly.';
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

  // Regular polygons: side s and the height a of one center triangle (rounded like the textbook gives it).
  // Area = n × ½ × s × a. Every pair below gives an answer with at most one decimal place.
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
    },
  ];
  const POLY_OBJECTS = ['floor tile', 'paving stone', 'window', 'tabletop', 'gazebo floor', 'garden bed', 'mirror', 'patio'];
  const LOBJECTS = ['floor plan', 'deck', 'garden', 'patio', 'countertop', 'playground', 'stage', 'rug'];

  function polygon(r, o) {
    o = o || {};
    const P = o.n ? POLYS.find((p) => p.n === o.n) : r.pick(POLYS);
    const [s, a] = r.pick(P.pairs);
    const u = r.pick(U5.UNITS);
    const tri = round(0.5 * s * a, 2),
      A = round(P.n * tri, 2);
    const svg = U5.regularPolygon(P.n, {
      side: `${fmt(s)} ${u}`,
      height: `${fmt(a)} ${u}`,
      aria: `Regular ${P.name} with side ${fmt(s)} ${u}, divided into ${P.n} identical triangles; each triangle has height ${fmt(a)} ${u}`,
    });
    return { n: P.n, name: P.name, s, a, u, tri, A, svg };
  }
  function coachPolygon(p, v) {
    const { n, s, a, tri, A } = p;
    if (v == null) return `Area = ${n} × (½ × ${fmt(s)} × ${fmt(a)}). Find one triangle, then multiply by ${n}.`;
    if (Math.abs(v - tri) < 0.01) return `${fmt(tri)} is the area of just one triangle. The ${p.name} is made of ${n} of them.`;
    if (Math.abs(v - n * s * a) < 0.01) return `You forgot the ½. Each triangle is ½ × ${fmt(s)} × ${fmt(a)} = ${fmt(tri)}, not ${fmt(s * a)}.`;
    if (Math.abs(v - n * s) < 0.01) return `${n * s} is the perimeter, the distance around. Area needs ½ × base × height for each triangle.`;
    if (Math.abs(v - round(s * a, 2)) < 0.01) return `${fmt(s * a)} is side × height with no ½ and only one triangle. Each triangle is ½ × ${fmt(s)} × ${fmt(a)}; then multiply by ${n}.`;
    return `One triangle: ½ × ${fmt(s)} × ${fmt(a)} = ${fmt(tri)}. Then ${n} × ${fmt(tri)}. The answer is ${fmt(A)} only if every step is right; check your multiplication.`;
  }
  function lcoach(W, H, w1, h1, v) {
    const A = W * H - (W - w1) * (H - h1);
    if (v == null) return 'Split the figure into two rectangles, or subtract the missing corner from the big rectangle.';
    if (Math.abs(v - W * H) < 0.01) return `${W * H} is the full ${W} by ${H} rectangle. A ${W - w1} by ${H - h1} corner is missing, so subtract it.`;
    if (Math.abs(v - (W * h1 + w1 * H)) < 0.01)
      return `You counted the ${w1} by ${h1} overlap twice. The two rectangles are ${W} × ${h1} and ${w1} × ${H - h1} (or ${w1} × ${H} and ${W - w1} × ${h1}).`;
    if (Math.abs(v - W * h1) < 0.01 || Math.abs(v - w1 * H) < 0.01) return 'That is only one of the two rectangles. Add the other piece.';
    if (Math.abs(v - (W - w1) * (H - h1)) < 0.01) return `${(W - w1) * (H - h1)} is the missing corner, not the figure. Subtract it from ${W * H}.`;
    return `Try ${W} × ${H} − ${W - w1} × ${H - h1}, or add the two rectangles. The answer should be ${fmt(A)} only if each piece is right.`;
  }

  // ---------- Area of a regular polygon (num) ----------
  G.define('g4_hexagon', (r) => {
    const p = polygon(r, { n: r.chance(0.6) ? 6 : undefined });
    const name = r.pick(NAMES),
      obj = r.pick(POLY_OBJECTS);
    return {
      type: 'num',
      skill: 'regular-polygons',
      lesson: '5-4',
      title: `Area of a regular ${p.name}`,
      prompt: `<p>${name} designs a ${obj} shaped like a regular ${p.name}. Each side is ${hl(fmt(p.s) + ' ' + p.u)}. The ${p.name} is divided into ${p.n} identical triangles from its center. Each triangle has a height of ${hl(fmt(p.a) + ' ' + p.u)}.</p>${p.svg}<p>What is the area of the ${obj}?</p>`,
      unit: sq(p.u),
      answer: p.A,
      reference: true,
      hints: [
        `A regular ${p.name} is ${p.n} identical triangles. Find the area of one triangle, then multiply by ${p.n}.`,
        `One triangle: base ${fmt(p.s)}, height ${fmt(p.a)}. Area = ½ × ${fmt(p.s)} × ${fmt(p.a)}.`,
        `One triangle is ${fmt(p.tri)} ${sq(p.u)}. Multiply by ${p.n}.`,
      ],
      solution: `<p>One triangle: ½ × ${fmt(p.s)} × ${fmt(p.a)} = ${fmt(p.tri)} ${sq(p.u)}. The ${p.name} has ${p.n} identical triangles: ${p.n} × ${fmt(p.tri)} = <b>${fmt(p.A)} ${sq(p.u)}</b>. Decomposing into triangles works for any regular polygon because all its sides and angles are equal, so all the triangles match.</p>`,
      feedback: { correct: `Correct. ${p.n} triangles × ${fmt(p.tri)} ${sq(p.u)} = ${fmt(p.A)} ${sq(p.u)}.`, wrong: (ans, d) => coachPolygon(p, d.value) },
    };
  });

  // ---------- One triangle, then multiply (blanks, template) ----------
  G.define('g4_polygonBlanks', (r) => {
    const p = polygon(r);
    return {
      type: 'blanks',
      skill: 'regular-polygons',
      lesson: '5-4',
      title: 'Triangles make a polygon',
      prompt: `<p>This regular ${p.name} has sides of ${hl(fmt(p.s) + ' ' + p.u)}. It is split into identical triangles from the center, and each triangle has a height of ${hl(fmt(p.a) + ' ' + p.u)}.</p>${p.svg}<p>Complete the steps.</p>`,
      fields: [
        { label: 'one triangle', answer: p.tri },
        { label: 'number of triangles', answer: p.n, width: 'xs' },
        { label: 'total area', answer: p.A },
      ],
      template: `One triangle has an area of {0} ${sq(p.u)}. There are {1} triangles, so the ${p.name} has an area of {2} ${sq(p.u)}.`,
      reference: true,
      hints: [
        'Each triangle has the polygon side as its base and the given height. A regular polygon has as many triangles as it has sides.',
        `½ × ${fmt(p.s)} × ${fmt(p.a)} for one triangle. Count the sides of a ${p.name}.`,
        `${p.n} × ${fmt(p.tri)}.`,
      ],
      solution: `<p>One triangle: ½ × ${fmt(p.s)} × ${fmt(p.a)} = <b>${fmt(p.tri)}</b> ${sq(p.u)}. A ${p.name} has <b>${p.n}</b> sides, so ${p.n} triangles. Total: ${p.n} × ${fmt(p.tri)} = <b>${fmt(p.A)}</b> ${sq(p.u)}.</p>`,
      feedback: {
        correct: `Correct. ${p.n} sides means ${p.n} triangles, each ${fmt(p.tri)} ${sq(p.u)}.`,
        wrong(ans, d) {
          const t = parseNum(ans[0]);
          if (t != null && Math.abs(t - p.s * p.a) < 0.01) return `A triangle is half of base × height: ½ × ${fmt(p.s)} × ${fmt(p.a)}.`;
          if (d.wrong.includes(1)) return `A ${p.name} has ${p.n} sides, so it is cut into ${p.n} triangles.`;
          if (d.wrong.length === 1 && d.wrong[0] === 2) return `Multiply: ${p.n} × ${fmt(p.tri)}.`;
          return `One triangle: ½ × ${fmt(p.s)} × ${fmt(p.a)}. Then multiply by the number of sides.`;
        },
      },
    };
  });

  // ---------- Who found the polygon's area correctly? (who) ----------
  G.define('g4_whoPolygon', (r) => {
    const p = polygon(r);
    const [n1, n2, n3] = r.pickN(NAMES, 3);
    const sh = shuffleOptions(
      r,
      [
        { title: n1, html: `One triangle: ½ × ${fmt(p.s)} × ${fmt(p.a)} = ${fmt(p.tri)}<br>${p.n} × ${fmt(p.tri)} = <b>${fmt(p.A)} ${sq(p.u)}</b>`, ok: true },
        {
          title: n2,
          html: `One triangle: ${fmt(p.s)} × ${fmt(p.a)} = ${fmt(round(p.s * p.a, 2))}<br>${p.n} × ${fmt(round(p.s * p.a, 2))} = <b>${fmt(round(p.n * p.s * p.a, 2))} ${sq(p.u)}</b>`,
          why: `${n2} forgot the ½ for each triangle. Base × height is a parallelogram, not a triangle.`,
        },
        { title: n3, html: `½ × ${fmt(p.s)} × ${fmt(p.a)} = <b>${fmt(p.tri)} ${sq(p.u)}</b>`, why: `${n3} found only one triangle. The ${p.name} has ${p.n} of them.` },
      ],
      0,
    );
    return {
      type: 'who',
      skill: 'regular-polygons',
      lesson: '5-4',
      title: 'Who is correct?',
      prompt: `<p>Three students find the area of a regular ${p.name} with sides of ${fmt(p.s)} ${p.u}. Each center triangle has a height of ${fmt(p.a)} ${p.u}.</p>${p.svg}<p>Who is correct?</p>`,
      options: sh.options,
      answer: sh.answer,
      layout: 'cards',
      hints: [
        'Check two things: is each triangle ½ × base × height, and was the triangle area multiplied by the number of sides?',
        `One triangle = ½ × ${fmt(p.s)} × ${fmt(p.a)} = ${fmt(p.tri)}.`,
        `Then ${p.n} × ${fmt(p.tri)}.`,
      ],
      solution: `<p><b>${n1}</b> is correct: ${p.n} × (½ × ${fmt(p.s)} × ${fmt(p.a)}) = ${fmt(p.A)} ${sq(p.u)}. ${n2} left out the ½, and ${n3} stopped after one triangle.</p>`,
      feedback: { correct: `Correct. ${n1} used the ½ and multiplied by all ${p.n} triangles.` },
    };
  });

  // ---------- Table of polygons: triangles × one triangle = total (table) ----------
  G.define('g4_tablePolygons', (r) => {
    const u = r.pick(U5.UNITS),
      name = r.pick(NAMES);
    const picks = r.shuffle(POLYS.slice());
    const triAreas = r.pickN([6, 8, 9, 10, 12, 14, 15, 18, 20], 3);
    const rows = [['Regular polygon', 'Number of triangles', `One triangle (${sq(u)})`, `Total area (${sq(u)})`]];
    const inputs = [];
    const data = picks.map((P, i) => ({ P, tri: triAreas[i], total: P.n * triAreas[i] }));
    rows.push([cap(data[0].P.name), String(data[0].P.n), String(data[0].tri), '__IN:t0__']);
    inputs.push({ id: 't0', answer: data[0].total });
    rows.push([cap(data[1].P.name), String(data[1].P.n), '__IN:one1__', String(data[1].total)]);
    inputs.push({ id: 'one1', answer: data[1].tri });
    rows.push([cap(data[2].P.name), '__IN:n2__', String(data[2].tri), String(data[2].total)]);
    inputs.push({ id: 'n2', answer: data[2].P.n });
    return {
      type: 'table',
      skill: 'regular-polygons',
      lesson: '5-4',
      title: 'Complete the polygon table',
      prompt: `<p>${name} splits three regular polygons into identical triangles from the center. Complete the table. One number is missing from each row.</p>`,
      rows,
      header: true,
      inputs,
      hints: [
        'Total area = number of triangles × area of one triangle. A regular polygon has one triangle per side.',
        `Row 1: ${data[0].P.n} × ${data[0].tri}. Row 2: ${data[1].total} ÷ ${data[1].P.n}.`,
        `Row 3: ${data[2].total} ÷ ${data[2].tri} tells you how many triangles, which equals the number of sides.`,
      ],
      solution: `<p>${cap(data[0].P.name)}: ${data[0].P.n} × ${data[0].tri} = <b>${data[0].total}</b>. ${cap(data[1].P.name)}: ${data[1].total} ÷ ${data[1].P.n} = <b>${data[1].tri}</b>. ${cap(data[2].P.name)}: ${data[2].total} ÷ ${data[2].tri} = <b>${data[2].P.n}</b> triangles, one for each of its ${data[2].P.n} sides. Multiplying and dividing undo each other.</p>`,
      feedback: {
        correct: 'Correct. Triangles × one triangle = total, and dividing works backward.',
        wrong(ans, d) {
          if (d.wrong.includes('t0')) return `Row 1: multiply ${data[0].P.n} triangles × ${data[0].tri}.`;
          if (d.wrong.includes('one1')) return `Row 2: the total is shared by ${data[1].P.n} equal triangles. Divide ${data[1].total} by ${data[1].P.n}.`;
          return `Row 3: how many ${data[2].tri}s make ${data[2].total}? That is also the number of sides of a ${data[2].P.name}.`;
        },
      },
    };
  });
  function cap(s) {
    return s.charAt(0).toUpperCase() + s.slice(1);
  }

  // ---------- L-shaped figure (num, honors hard) ----------
  G.define('g4_lshape', (r, o) => {
    const u = r.pick(U5.UNITS),
      name = r.pick(NAMES),
      obj = r.pick(LOBJECTS);
    let W, H, w1, h1;
    if (o.hard) {
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
    const svg = U5.lshape(W, H, w1, h1, { u: ' ' + u, hard: o.hard, dash: o.hard ? undefined : r.pick(['v', 'h']) });
    const given = o.hard
      ? `The outside is ${hl(W + ' ' + u)} wide and ${hl(H + ' ' + u)} tall. The bottom step is ${hl(h1 + ' ' + u)} tall, and the top part is ${hl(w1 + ' ' + u)} wide. The two inside edges are not labeled.`
      : `All six edges are labeled.`;
    return {
      type: 'num',
      skill: 'composite-figures',
      lesson: '5-4',
      title: o.hard ? 'Seal of Space: L-shape' : 'Area of an L-shape',
      xp: o.xp,
      prompt: `<p>${name}'s ${obj} is L-shaped. ${given}</p>${svg}<p>What is the area of the ${obj}?</p>`,
      unit: sq(u),
      answer: A,
      reference: true,
      hints: [
        'Split the L into two rectangles with one straight cut, or think of it as a big rectangle with a corner missing.',
        o.hard
          ? `The missing inside edges: ${W} − ${w1} = ${W - w1} ${u} across and ${H} − ${h1} = ${H - h1} ${u} up. Big rectangle: ${W} × ${H}. Missing corner: ${W - w1} × ${H - h1}.`
          : `Cut across: a ${W} × ${h1} rectangle on the bottom and a ${w1} × ${H - h1} rectangle on top.`,
        o.hard ? `${W * H} − ${(W - w1) * (H - h1)}.` : `${W * h1} + ${w1 * (H - h1)}.`,
      ],
      solution: `<p>Add two rectangles: ${W} × ${h1} = ${W * h1} and ${w1} × ${H - h1} = ${w1 * (H - h1)}, total <b>${A} ${sq(u)}</b>. Or subtract: the full ${W} × ${H} rectangle is ${W * H}, minus the missing ${W - w1} × ${H - h1} corner (${(W - w1) * (H - h1)}) gives ${A}. Both ways work because they count the same space exactly once.</p>`,
      feedback: {
        correct: `Correct. Two rectangles (${W * h1} + ${w1 * (H - h1)}) or ${W * H} − ${(W - w1) * (H - h1)}: either way, ${A} ${sq(u)}.`,
        wrong: (ans, d) => lcoach(W, H, w1, h1, d.value),
      },
    };
  });

  // ---------- House shape: rectangle + triangle (blanks, template) ----------
  G.define('g4_house', (r) => {
    const u = r.pick(U5.UNITS),
      name = r.pick(NAMES);
    const w = 2 * r.int(3, 7),
      h = r.int(4, 9),
      t = r.int(2, 6);
    const rect = w * h,
      tri = (w * t) / 2,
      A = rect + tri;
    const ctx = r.pick(['the front of a birdhouse', 'a barn door', 'a sign shaped like a house', 'the end wall of a shed', 'a dollhouse front']);
    return {
      type: 'blanks',
      skill: 'composite-figures',
      lesson: '5-4',
      title: 'Rectangle plus triangle',
      prompt: `<p>${name} paints ${ctx}. It is a rectangle ${hl(w + ' ' + u)} wide and ${hl(h + ' ' + u)} tall with a triangle on top. The triangle's height is ${hl(t + ' ' + u)}, and its base is the top of the rectangle.</p>${U5.house(w, h, t, { u: ' ' + u })}<p>Find each part and the total.</p>`,
      fields: [
        { label: 'rectangle', answer: rect },
        { label: 'triangle', answer: tri },
        { label: 'total', answer: A },
      ],
      template: `Rectangle: {0} ${sq(u)}. Triangle: {1} ${sq(u)}. Total area: {2} ${sq(u)}.`,
      reference: true,
      hints: ['The triangle sits on the rectangle, so its base is the same as the rectangle’s width.', `Rectangle: ${w} × ${h}. Triangle: ½ × ${w} × ${t}.`, `${rect} + ${tri}.`],
      solution: `<p>Rectangle: ${w} × ${h} = <b>${rect}</b> ${sq(u)}. Triangle: ½ × ${w} × ${t} = <b>${tri}</b> ${sq(u)}. Total: ${rect} + ${tri} = <b>${A}</b> ${sq(u)}. The triangle's base is not labeled separately because it equals the width of the rectangle below it.</p>`,
      feedback: {
        correct: 'Correct. A composite figure is the sum of its parts.',
        wrong(ans, d) {
          const tv = parseNum(ans[1]);
          if (tv != null && Math.abs(tv - w * t) < 0.01) return `The triangle is half of ${w} × ${t}.`;
          if (tv != null && Math.abs(tv - (w * (h + t)) / 2) < 0.01) return `The triangle's height is only ${t} ${u}, the part above the rectangle, not the full ${h + t}.`;
          if (d.wrong.includes(0)) return `Rectangle = width × height = ${w} × ${h}.`;
          if (d.wrong.length === 1 && d.wrong[0] === 2) return `Add the parts: ${rect} + ${tri}.`;
          return `Rectangle ${w} × ${h}; triangle ½ × ${w} × ${t}; then add.`;
        },
      },
    };
  });

  // ---------- Rectangle with a rectangular cut-out: subtract (num) ----------
  G.define('g4_cutout', (r) => {
    const u = r.pick(U5.UNITS),
      name = r.pick(NAMES);
    const W = r.int(8, 16),
      H = r.int(6, 12);
    const w = r.int(2, W - 4),
      h = r.int(2, H - 3);
    const A = W * H - w * h;
    const ctx = r.pick([
      ['a picture frame', 'the opening for the photo', 'frame'],
      ['a pool deck', 'the pool', 'deck'],
      ['a courtyard', 'a fountain', 'courtyard'],
      ['a lawn', 'a flower bed', 'lawn'],
      ['a wall', 'a window', 'wall'],
      ['a quilt', 'a square hole for a patch', 'quilt'],
    ]);
    const x0 = round((W - w) / 2, 2),
      y0 = round((H - h) / 2, 2);
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
      labels: [
        { x: W / 2, y: 0, text: `${W} ${u}`, dy: 20 },
        { x: W, y: H / 2, text: `${H} ${u}`, anchor: 'start', dx: 8 },
        { x: W / 2, y: y0 + h, text: `${w} ${u}`, dy: -6, size: 11 },
        { x: x0 + w, y: H / 2, text: `${h} ${u}`, anchor: 'start', dx: 6, size: 11 },
      ],
      aria: `A ${W} by ${H} rectangle with a ${w} by ${h} rectangle removed from the middle`,
    });
    return {
      type: 'num',
      skill: 'composite-figures',
      lesson: '5-4',
      title: 'Subtract the cut-out',
      prompt: `<p>${name} is covering ${ctx[0]} that measures ${hl(W + ' ' + u)} by ${hl(H + ' ' + u)}. In the middle is ${ctx[1]}, a ${hl(w + ' ' + u)} by ${hl(h + ' ' + u)} rectangle that does not get covered.</p>${svg}<p>What is the area of the ${ctx[2]} that gets covered?</p>`,
      unit: sq(u),
      answer: A,
      reference: true,
      hints: ['When a figure has a hole, find the whole area, then subtract the hole.', `Whole: ${W} × ${H} = ${W * H}. Hole: ${w} × ${h} = ${w * h}.`, `${W * H} − ${w * h}.`],
      solution: `<p>Whole rectangle: ${W} × ${H} = ${W * H}. Cut-out: ${w} × ${h} = ${w * h}. Covered area: ${W * H} − ${w * h} = <b>${A} ${sq(u)}</b>. Subtracting works because the cut-out sits entirely inside the big rectangle.</p>`,
      feedback: {
        correct: `Correct. ${W * H} − ${w * h} = ${A} ${sq(u)}. Whole minus hole.`,
        wrong(ans, d) {
          const v = d.value;
          if (v == null) return 'Big rectangle minus the cut-out.';
          if (Math.abs(v - W * H) < 0.01) return `${W * H} is the whole rectangle. The ${w} by ${h} cut-out is not covered, so subtract ${w * h}.`;
          if (Math.abs(v - (W * H + w * h)) < 0.01) return `You added the cut-out. It is removed from the figure, so subtract: ${W * H} − ${w * h}.`;
          if (Math.abs(v - w * h) < 0.01) return `${w * h} is the hole itself. The covered part is the big rectangle minus the hole.`;
          if (Math.abs(v - (2 * (W + H) - 2 * (w + h))) < 0.01) return 'That subtracts perimeters (distances around). Area uses length × width for each rectangle.';
          return `${W} × ${H} = ${W * H}, then subtract ${w} × ${h} = ${w * h}.`;
        },
      },
    };
  });

  // ---------- Select all expressions for the L-shape's area (ms) ----------
  G.define('g4_msExpressions', (r) => {
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
      { html: `${W} × ${H}` },
      { html: `${W} × ${h1} + ${w1} × ${H}` },
    ];
    const keep = r.chance(0.5) ? [0, 1, 2, 3, 4] : r.shuffle([0, 1, 2]).slice(0, 2).concat([3, 4]);
    const chosen = keep.sort((a, b) => a - b).map((i) => opts[i]);
    const correctIdx = chosen.map((o, i) => (o.ok ? i : -1)).filter((i) => i >= 0);
    const sh = shuffleOptions(r, chosen, correctIdx);
    return {
      type: 'ms',
      skill: 'composite-figures',
      lesson: '5-4',
      title: 'Which expressions give the area?',
      prompt: `<p>This L-shaped figure is ${hl(W + ' ' + u)} wide and ${hl(H + ' ' + u)} tall. The bottom step is ${h1} ${u} tall and the top part is ${w1} ${u} wide; the inside edges are ${W - w1} ${u} and ${H - h1} ${u}.</p>${U5.lshape(W, H, w1, h1, { u: ' ' + u })}<p>Select <b>all</b> expressions that give the area of the figure in ${sq(u)}.</p>`,
      options: sh.options,
      answers: sh.answers,
      reference: true,
      hints: [
        'There is more than one correct way: cut across, cut down, or subtract the missing corner. Each correct expression must count every part exactly once.',
        `Cut across: ${W} × ${h1} (bottom) + ${w1} × ${H - h1} (top). Cut down: ${w1} × ${H} (left) + ${W - w1} × ${h1} (right). Subtract: ${W} × ${H} − ${W - w1} × ${H - h1}.`,
        `Every correct expression equals ${A}. Compute each option and compare.`,
      ],
      solution: `<p>Three expressions work: cut across, ${W} × ${h1} + ${w1} × ${H - h1}; cut down, ${w1} × ${H} + ${W - w1} × ${h1}; or subtract the corner, ${W} × ${H} − ${W - w1} × ${H - h1}. Each equals <b>${A} ${sq(u)}</b>. ${W} × ${H} ignores the missing corner, and ${W} × ${h1} + ${w1} × ${H} counts the ${w1} by ${h1} overlap twice.</p>`,
      feedback: {
        correct: `Correct. Every selected expression counts each part of the figure exactly once and equals ${A}.`,
        wrong(ans, d) {
          if (d.extra && d.extra.length) {
            const txt = sh.options[d.extra[0]].html;
            if (txt === `${W} × ${H}`) return `${W} × ${H} is the full rectangle with no corner missing. That is too big.`;
            return `${W} × ${h1} + ${w1} × ${H} overlaps: the ${w1} by ${h1} corner is inside both rectangles, so it is counted twice.`;
          }
          return `You missed one. Compute each expression; every correct one equals ${A}.`;
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

  function wholeDims(r, o) {
    o = o || {};
    const hi = o.hard ? 12 : 8;
    const l = r.int(3, hi),
      w = r.int(2, Math.min(hi, l)),
      h = r.int(2, hi);
    const u = r.pick(U5.UNITS);
    return { l, w, h, u, V: l * w * h };
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
    if (Math.abs(v - (l + w + h)) < 0.01) return 'You added the edges. Volume multiplies them: l × w × h.';
    if (Math.abs(v - 2 * (l * w + l * h + w * h)) < 0.01) return `${fmt(2 * (l * w + l * h + w * h))} is the surface area, the area of all the faces. Volume is the space inside: l × w × h.`;
    if (Math.abs(v - l * w) < 0.01 || Math.abs(v - l * h) < 0.01 || Math.abs(v - w * h) < 0.01) return 'That is the area of one face (two edges multiplied). Volume needs all three edges.';
    if (Math.abs(v - Math.floor(l) * Math.floor(w) * Math.floor(h)) < 0.01 && vol !== v)
      return 'You dropped the fraction part of an edge. Multiply with the full mixed number, or write it as a decimal first.';
    return `Multiply ${mixed(l)} × ${mixed(w)} = ${fmt(round(l * w, 2))}, then × ${mixed(h)}. Answer in ${cu(u)}.`;
  }

  // ---------- Volume = l × w × h (num) ----------
  G.define('g5_volume', (r) => {
    const d = wholeDims(r);
    const name = r.pick(NAMES),
      obj = r.pick(CONTAINERS);
    return {
      type: 'num',
      skill: 'volume',
      lesson: '5-5',
      title: 'Volume of a rectangular prism',
      prompt: `<p>${name}'s ${obj} is a rectangular prism ${hl(d.l + ' ' + d.u)} long, ${hl(d.w + ' ' + d.u)} wide, and ${hl(d.h + ' ' + d.u)} tall.</p>${prismSvg(d)}<p>How many cubic ${d.u === 'in' ? 'inches' : d.u === 'ft' ? 'feet' : d.u === 'cm' ? 'centimeters' : 'meters'} of space does it hold? Give the volume.</p>`,
      unit: cu(d.u),
      answer: d.V,
      reference: true,
      hints: ['Volume counts the unit cubes that fill the prism. V = l × w × h.', `The bottom layer has ${d.l} × ${d.w} = ${d.l * d.w} cubes. There are ${d.h} layers.`, `${d.l * d.w} × ${d.h}.`],
      solution: `<p>V = l × w × h = ${d.l} × ${d.w} × ${d.h} = <b>${d.V} ${cu(d.u)}</b>. The base holds ${d.l * d.w} unit cubes, and ${d.h} layers of them stack up to ${d.V}. The unit is cubic because each cube measures ${d.u} × ${d.u} × ${d.u}.</p>`,
      feedback: { correct: `Correct. ${d.l} × ${d.w} × ${d.h} = ${d.V} ${cu(d.u)}.`, wrong: (ans, dd) => coachVolume(d, dd.value) },
    };
  });

  // ---------- V = B × h: base area first (blanks, template) ----------
  G.define('g5_blanksBh', (r) => {
    const d = wholeDims(r);
    const B = d.l * d.w;
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
      solution: `<p>B = ${d.l} × ${d.w} = <b>${B}</b> ${sq(d.u)}. Height = <b>${d.h}</b> ${d.u}. V = ${B} × ${d.h} = <b>${d.V}</b> ${cu(d.u)}. B × h and l × w × h are the same formula: B is just l × w already multiplied.</p>`,
      feedback: {
        correct: 'Correct. Base area is in square units; multiplying by the height makes it cubic.',
        wrong(ans, dd) {
          const b = parseNum(ans[0]);
          if (b != null && Math.abs(b - (d.l + d.w)) < 0.01) return `Base area is ${d.l} × ${d.w}, not ${d.l} + ${d.w}.`;
          if (b != null && Math.abs(b - 2 * (d.l + d.w)) < 0.01) return `${2 * (d.l + d.w)} is the perimeter of the base. Area is ${d.l} × ${d.w}.`;
          if (dd.wrong.includes(1)) return `The height is the edge that goes up: ${d.h} ${d.u}.`;
          if (dd.wrong.length === 1 && dd.wrong[0] === 2) return `V = B × h = ${B} × ${d.h}.`;
          return `B = ${d.l} × ${d.w}. Then multiply by the height ${d.h}.`;
        },
      },
    };
  });

  // ---------- Which prism / which expression has this volume? (mc) ----------
  G.define('g5_whichVolume', (r) => {
    const d = wholeDims(r);
    const u = d.u;
    if (r.chance(0.5)) {
      const sh = shuffleOptions(
        r,
        [
          { html: `${d.l} × ${d.w} × ${d.h}`, ok: true },
          { html: `${d.l} + ${d.w} + ${d.h}`, why: 'Adding the edges gives a length. Volume multiplies all three edges.' },
          { html: `2 × (${d.l} × ${d.w}) + 2 × (${d.l} × ${d.h}) + 2 × (${d.w} × ${d.h})`, why: 'That is surface area, the total area of the six faces. Volume is the space inside, l × w × h.' },
          { html: `${d.l} × ${d.w}`, why: `${d.l} × ${d.w} is the area of the base only. Multiply by the height ${d.h} to fill the prism.` },
        ],
        0,
      );
      return {
        type: 'mc',
        skill: 'volume',
        lesson: '5-5',
        title: 'Choose the volume expression',
        prompt: `<p>A rectangular prism is ${hl(d.l + ' ' + u)} long, ${hl(d.w + ' ' + u)} wide, and ${hl(d.h + ' ' + u)} tall.</p>${prismSvg(d)}<p>Which expression gives its volume in ${cu(u)}?</p>`,
        options: sh.options,
        answer: sh.answer,
        reference: true,
        hints: ['Volume = length × width × height.', 'Look for the expression that multiplies all three edges and nothing else.', `${d.l} × ${d.w} × ${d.h} = ${d.V}.`],
        solution: `<p>V = l × w × h = <b>${d.l} × ${d.w} × ${d.h}</b> = ${d.V} ${cu(u)}. Adding gives a length, l × w gives one face, and 2lw + 2lh + 2wh is surface area.</p>`,
        feedback: { correct: 'Correct. Multiply all three edges for volume.' },
      };
    }
    // Which box has a volume of V?
    const target = d.V;
    const txt = (p) => `${p.l} ${u} by ${p.w} ${u} by ${p.h} ${u}`;
    const vol = (p) => p.l * p.w * p.h;
    // each distractor changes one edge by 1, so its volume is never the target
    const cands = [
      { l: d.l + 1, w: d.w, h: d.h },
      { l: d.l, w: d.w, h: d.h + 1 },
      { l: d.l, w: d.w + 1, h: d.h },
    ];
    const opts = [{ html: txt(d), ok: true }].concat(cands.map((p) => ({ html: txt(p), why: `${p.l} × ${p.w} × ${p.h} = ${vol(p)}, not ${target}. One edge is off by 1.` })));
    const sh = shuffleOptions(r, opts, 0);
    const name = r.pick(NAMES),
      obj = r.pick(CONTAINERS);
    return {
      type: 'mc',
      skill: 'volume',
      lesson: '5-5',
      title: `Which box holds ${target} ${cu(u)}?`,
      prompt: `<p>${name} needs a ${obj} that holds exactly ${hl(target + ' ' + cu(u))}. Which rectangular prism has that volume?</p>`,
      options: sh.options,
      answer: sh.answer,
      reference: true,
      hints: [
        'Multiply the three edges of each box. Only one product equals the target.',
        `Start with the first box: multiply its three numbers and compare to ${target}.`,
        `${d.l} × ${d.w} × ${d.h} = ${target}.`,
      ],
      solution: `<p><b>${txt(d)}</b>: ${d.l} × ${d.w} × ${d.h} = ${target} ${cu(u)}. The other boxes have volumes ${cands.map((p) => vol(p)).join(', ')}. Changing even one edge by 1 unit changes the volume.</p>`,
      feedback: { correct: `Correct. ${d.l} × ${d.w} × ${d.h} = ${target}.` },
    };
  });

  // ---------- Order prisms by volume (seq) ----------
  G.define('g5_seqVolume', (r) => {
    const u = r.pick(U5.UNITS);
    const dims = [];
    const seen = new Set();
    while (dims.length < 3) {
      const l = r.int(2, 8),
        w = r.int(2, 6),
        h = r.int(2, 7);
      const Vv = l * w * h;
      if (seen.has(Vv)) continue;
      seen.add(Vv);
      dims.push({ l, w, h, V: Vv });
    }
    const asc = r.chance(0.5);
    const items = dims.map((d) => ({
      html:
        V.prism({ l: d.l, w: d.w, h: d.h, width: 150, height: 105, labels: { l: String(d.l), w: String(d.w), h: String(d.h) }, aria: `Prism ${d.l} by ${d.w} by ${d.h}` }) +
        `<div class="muted">${d.l} × ${d.w} × ${d.h} ${u}</div>`,
      rate: d.V,
    }));
    const order = [0, 1, 2].sort((a, b) => (asc ? items[a].rate - items[b].rate : items[b].rate - items[a].rate));
    return {
      type: 'seq',
      skill: 'volume',
      lesson: '5-5',
      title: 'Order by volume',
      prompt: `<p>Order the three prisms from <b>${asc ? 'least' : 'greatest'}</b> volume (top) to <b>${asc ? 'greatest' : 'least'}</b> volume (bottom). Edges are in ${u}.</p>`,
      items,
      order,
      hints: [
        'Compute each volume with l × w × h. A tall prism can still hold less than a short, wide one.',
        `Volumes: ${dims.map((d) => `${d.l} × ${d.w} × ${d.h} = ${d.V}`).join('; ')}.`,
        `${asc ? 'Smallest' : 'Largest'} first: ${order.map((i) => dims[i].V).join(', ')}.`,
      ],
      solution: `<p>${dims.map((d) => `${d.l} × ${d.w} × ${d.h} = ${d.V} ${cu(u)}`).join('; ')}. From ${asc ? 'least to greatest' : 'greatest to least'}: <b>${order.map((i) => dims[i].V).join(', ')}</b>. Computing beats guessing from the picture: the drawings are not to scale with each other.</p>`,
      feedback: {
        correct: 'Correct. Multiply first, then compare.',
        wrong() {
          return `Find each volume first: ${dims.map((d) => d.V).join(', ')}. Then put the ${asc ? 'least' : 'greatest'} at the top.`;
        },
      },
    };
  });

  // ---------- Fractional edges (num, honors hard) ----------
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
      solution: `<p>V = ${mixed(d.l)} × ${mixed(d.w)} × ${mixed(d.h)} = ${fmt(d.l)} × ${fmt(d.w)} × ${fmt(d.h)} = ${fmt(lw)} × ${fmt(d.h)} = <b>${fmt(d.V)} ${cu(d.u)}</b>. A fractional edge means some unit cubes are cut, but the formula still counts the total space exactly.</p>`,
      feedback: { correct: `Correct. ${fmt(d.l)} × ${fmt(d.w)} × ${fmt(d.h)} = ${fmt(d.V)} ${cu(d.u)}.`, wrong: (ans, dd) => coachVolume(d, dd.value) },
    };
  });

  // ---------- Missing edge from the volume (num, honors hard) ----------
  G.define('g5_missingEdge', (r, o) => {
    const u = r.pick(U5.UNITS),
      name = r.pick(NAMES),
      obj = r.pick(CONTAINERS);
    let l, w, h;
    if (o.hard) {
      l = r.int(3, 9);
      w = r.int(2, 6);
      h = r.int(2, 7) + 0.5;
    } else {
      l = r.int(3, 9);
      w = r.int(2, 6);
      h = r.int(2, 9);
    }
    const Vv = round(l * w * h, 2);
    const B = l * w;
    const svg = V.prism({ l, w, h, labels: { l: `${l} ${u}`, w: `${w} ${u}`, h: `? ${u}` }, aria: `Rectangular prism ${l} ${u} long, ${w} ${u} wide, with an unknown height` });
    return {
      type: 'num',
      skill: 'fractional-edges',
      lesson: '5-5',
      title: o.hard ? 'Seal of Space: missing edge' : 'Find the missing edge',
      xp: o.xp,
      prompt: `<p>${name}'s ${obj} holds ${hl(fmt(Vv) + ' ' + cu(u))}. It is ${hl(l + ' ' + u)} long and ${hl(w + ' ' + u)} wide, but the height label is torn off.</p>${svg}<p>What is the height of the ${obj}?</p>`,
      unit: u,
      answer: h,
      reference: true,
      hints: ['V = l × w × h. You know V, l, and w. Work backward: divide the volume by the base area.', `Base area: ${l} × ${w} = ${B} ${sq(u)}.`, `${fmt(Vv)} ÷ ${B}.`],
      solution: `<p>V = B × h, so h = V ÷ B. B = ${l} × ${w} = ${B}. h = ${fmt(Vv)} ÷ ${B} = <b>${fmt(h)} ${u}</b>. Check: ${l} × ${w} × ${fmt(h)} = ${fmt(Vv)}. Dividing undoes the multiplying in the formula.</p>`,
      feedback: {
        correct: `Correct. ${fmt(Vv)} ÷ ${B} = ${fmt(h)} ${u}. Volume divided by base area gives the height.`,
        wrong(ans, dd) {
          const v = dd.value;
          if (v == null) return `Divide the volume by the base area ${l} × ${w}.`;
          if (Math.abs(v - (Vv - B)) < 0.01) return 'You subtracted the base area. The formula multiplies, so undo it by dividing: V ÷ (l × w).';
          if (Math.abs(v - Vv / l) < 0.01 || Math.abs(v - Vv / w) < 0.01) return `You divided by only one edge. Divide by both: ${fmt(Vv)} ÷ (${l} × ${w}).`;
          if (Math.abs(v - Vv * B) < 0.01) return 'Multiplying makes the number bigger. The height is smaller than the volume: divide.';
          return `h = ${fmt(Vv)} ÷ ${B}. Check by multiplying ${l} × ${w} × your answer.`;
        },
      },
    };
  });

  // ---------- Error with a mixed-number edge (error) ----------
  G.define('g5_errorMixed', (r) => {
    const u = r.pick(U5.UNITS),
      name = r.pick(NAMES);
    const a = r.int(2, 6) + 0.5,
      b = 2 * r.int(1, 4),
      c = r.int(2, 6);
    const Vv = round(a * b * c, 2);
    const variant = r.pick(['dropped', 'added']);
    let work, opts;
    if (variant === 'dropped') {
      const wrong = Math.floor(a) * b * c;
      work = `V = l × w × h<br>V = ${mixed(a)} × ${b} × ${c}<br>V = ${Math.floor(a)} × ${b} × ${c}<br>V = ${wrong} ${cu(u)}`;
      opts = [
        { html: `${name} dropped the ½ from ${mixed(a)} and multiplied ${Math.floor(a)} instead. The whole mixed number must be used: ${fmt(a)} × ${b} × ${c}.`, ok: true },
        { html: `${name} should have added the three edges.`, why: 'Volume multiplies the edges. Adding is wrong for volume. The real mistake is the missing fraction.' },
        { html: `${name} should have used ${mixed(a)} × ${b} only, since one edge is a fraction.`, why: 'A fractional edge is still an edge. All three edges are multiplied, fraction or not.' },
        { html: `${name}'s work is correct.`, why: `${Math.floor(a)} is not the same as ${mixed(a)}. Dropping the ½ makes the volume too small: the true volume is ${fmt(Vv)}.` },
      ];
    } else {
      const wrong = round(a + b + c, 2);
      work = `V = l × w × h<br>V = ${mixed(a)} + ${b} + ${c}<br>V = ${fmt(wrong)} ${cu(u)}`;
      opts = [
        { html: `${name} added the edges instead of multiplying them. V = ${mixed(a)} × ${b} × ${c}.`, ok: true },
        { html: `${name} should have changed ${mixed(a)} to ${fmt(a)} before adding.`, why: `Changing to a decimal is fine, but the operation is still wrong. Volume multiplies the edges.` },
        { html: `${name} forgot to double the answer.`, why: 'There is no doubling in the volume formula. The formula is l × w × h, a product of three edges.' },
        { html: `${name}'s work is correct.`, why: `${fmt(wrong)} is a length, not a volume. The edges must be multiplied, which gives ${fmt(Vv)} ${cu(u)}.` },
      ];
    }
    const sh = shuffleOptions(r, opts, 0);
    const svg = prismSvg({ l: a, w: b, h: c, u }, {}, { width: 260, height: 190 });
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
      hints: [
        'Compare line 2 to line 3 of the work. What changed, and should it have?',
        variant === 'dropped'
          ? `${mixed(a)} became ${Math.floor(a)}. The ½ disappeared. Half a unit of length matters: it is ${b} × ${c} ÷ 2 = ${(b * c) / 2} ${cu(u)} of volume.`
          : 'Look at the operation signs. The formula says multiply; the work adds.',
        `Correct: ${fmt(a)} × ${b} × ${c}. First ${fmt(a)} × ${b} = ${fmt(a * b)}, then × ${c}.`,
      ],
      solution: `<p>${variant === 'dropped' ? `${name} dropped the fraction and used ${Math.floor(a)} instead of ${mixed(a)}.` : `${name} added the edges instead of multiplying.`} Correct: V = ${fmt(a)} × ${b} × ${c} = ${fmt(a * b)} × ${c} = <b>${fmt(Vv)} ${cu(u)}</b>. A mixed number works in the formula just like a whole number; write it as a decimal or improper fraction and multiply.</p>`,
      feedback: {
        correct: `Correct. ${fmt(a)} × ${b} × ${c} = ${fmt(Vv)} ${cu(u)}.`,
        wrong(ans, dd) {
          if (!dd.mistakeOk) return (sh.options[ans.mistake] && sh.options[ans.mistake].why) || 'Look closely at how the mixed number was handled.';
          return `You found the mistake. For the fix: ${fmt(a)} × ${b} × ${c}.`;
        },
      },
    };
  });

  // ---------- True or false about volume (tf) ----------
  G.define('g5_tfDouble', (r) => {
    const u = r.pick(U5.UNITS);
    const l = r.int(3, 8),
      w = r.int(2, 5),
      h = r.int(2, 6),
      Vv = l * w * h;
    const a = r.int(2, 5) + 0.5,
      b = 2 * r.int(1, 4),
      c = r.int(2, 5);
    const v = r.pick([
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
        stmt: `V = B × h and V = l × w × h give different volumes for the same prism.`,
        answer: false,
        reasons: [
          { html: 'B is the area of the base, l × w. So B × h is l × w × h written in two steps. Same prism, same volume.', correct: true },
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
    ]);
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
        'Test the statement with the actual numbers. V = l × w × h.',
        'Multiply the edges before and after the change the statement describes, and compare.',
        v.answer ? 'The numbers agree with the statement, so it is true.' : 'The numbers disagree with the statement, so it is false.',
      ],
      solution: `<p><b>${v.answer ? 'True' : 'False'}.</b> ${reasons.find((x) => x.correct).html}</p>`,
      feedback: {
        correct: 'Correct. Volume is the product of three edges, measured in cubic units.',
        wrong(ans, dd) {
          return !dd.valueOk ? 'Compute the volume with the numbers given and test the claim.' : 'Your true/false is right. Choose the reason that uses l × w × h correctly.';
        },
      },
    };
  });
})(typeof window !== 'undefined' ? window : globalThis);

/* js/units/u5/gen-nets.js */
/* Zone 6 — The Gallery of Nets. Lesson 5-6 Represent Three-Dimensional Figures in Two Dimensions (drawing nets · reading nets and solids). */
(function (root) {
  'use strict';
  const RX = root.RX;
  const { G, V, shuffleOptions, NAMES, fmt, U5 } = RX;
  const hl = V.hl;
  const sq = U5.sq;

  const SOLIDS = {
    rect: { key: 'rect', name: 'rectangular prism', F: 6, E: 12, V: 8, faces: '6 rectangles in 3 matching pairs', example: 'a cereal box' },
    cube: { key: 'cube', name: 'cube', F: 6, E: 12, V: 8, faces: '6 identical squares', example: 'a number cube' },
    tri: { key: 'tri', name: 'triangular prism', F: 5, E: 9, V: 6, faces: '2 triangles and 3 rectangles', example: 'a camping tent' },
    pyr: { key: 'pyr', name: 'square pyramid', F: 5, E: 8, V: 5, faces: '1 square and 4 triangles', example: 'a monument in Egypt' },
  };
  const ORDER = ['rect', 'cube', 'tri', 'pyr'];
  // Right-triangle cross-sections for triangular prisms (legs b, h; hypotenuse s).
  const RIGHT = [
    [3, 4, 5],
    [6, 8, 10],
    [4, 3, 5],
  ];

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

  // ---------- Choose the net of a solid (rep, honors hard) ----------
  G.define('g6_chooseNet', (r, o) => {
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
      if (o.hard)
        opts.push({ html: V.pyramidNet({ b: l, slant: l, width: 170, aria: 'A square with four triangles' }), why: 'Triangles fold up to a point. This is the net of a square pyramid, not a prism.' });
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
      if (o.hard)
        opts.push({
          html: U5.blockNet(b, b, { width: 170, heightPx: 130, aria: 'Six squares in a block' }),
          why: 'These are six squares with no triangles. A square pyramid has only one square face.',
        });
    } else {
      const [b, hh, s] = r.pick(RIGHT);
      opts = [
        { html: U5.triNet(b, hh, s, hh, r.int(4, 7), { width: 170, heightPx: 130, aria: 'Three rectangles in a row with a triangle above and below' }), ok: true },
        {
          html: V.prismNet({ l, w, h, width: 170, aria: 'Six rectangles in a cross shape' }),
          why: 'All six faces are rectangles, so this folds into a rectangular prism. A triangular prism needs two triangular ends.',
        },
        {
          html: V.pyramidNet({ b: 4, slant: 4, width: 170, aria: 'A square with four triangles' }),
          why: 'Four triangles around one square fold into a square pyramid. A triangular prism has only two triangles.',
        },
      ];
      if (o.hard)
        opts.push({
          html: U5.prismNetFaces(l, w, h, { omit: 'top', width: 170, heightPx: 130, aria: 'Five rectangles' }),
          why: 'Five faces, but all are rectangles. The triangular prism has 2 triangles and 3 rectangles.',
        });
    }
    const sh = shuffleOptions(r, opts, 0);
    sh.options = sh.options.map((op, i) => Object.assign({}, op, { html: card(op.html, 'Net ' + letters[i]) }));
    const name = r.pick(NAMES);
    return {
      type: 'rep',
      skill: 'nets',
      lesson: '5-6',
      title: o.hard ? 'Seal of Surface: choose the net' : `Choose the net of a ${S.name}`,
      xp: o.xp,
      prompt: `<p>${name} wants to cut and fold a ${S.name} from one sheet of paper. A <b>net</b> is a flat pattern that folds into the solid with every face in place and no overlaps.</p><p>Which pattern is a net of a ${S.name} (${S.faces})?</p>`,
      options: sh.options,
      answer: sh.answer,
      layout: 'cards',
      hints: [
        `Count the faces in each pattern. A ${S.name} has ${S.F} faces: ${S.faces}.`,
        'Then picture folding. Every face must end up in its own spot, and no two faces can land on top of each other.',
        `Net ${letters[sh.answer]} has exactly ${S.faces}, arranged so they fold up with no overlaps.`,
      ],
      solution: `<p><b>Net ${letters[sh.answer]}</b> folds into a ${S.name}: it has ${S.faces}, and each face folds into its own position. ${sh.options
        .map((op, i) => (op.ok ? null : `Net ${letters[i]}: ${op.why}`))
        .filter(Boolean)
        .join(' ')}</p>`,
      feedback: { correct: `Correct. A ${S.name} has ${S.faces}, and this pattern folds them up with no overlaps.` },
    };
  });

  // ---------- Count faces, edges, vertices (table) ----------
  G.define('g6_countFEV', (r) => {
    const [kA, kB] = r.pickN(ORDER, 2);
    const A = SOLIDS[kA],
      B = SOLIDS[kB];
    const name = r.pick(NAMES);
    const rows = [
      ['Solid', 'Faces', 'Edges', 'Vertices'],
      [cap(A.name), String(A.F), '__IN:eA__', '__IN:vA__'],
      [cap(B.name), '__IN:fB__', String(B.E), '__IN:vB__'],
    ];
    const pics = `<div style="display:flex;gap:12px;flex-wrap:wrap;justify-content:center">${card(solidPic(kA, r, { width: 150, height: 115 }), cap(A.name))}${card(solidPic(kB, r, { width: 150, height: 115 }), cap(B.name))}</div>`;
    return {
      type: 'table',
      skill: 'solids',
      lesson: '5-6',
      title: 'Faces, edges, and vertices',
      prompt: `<p>${name} is labeling two solids. A <b>face</b> is a flat surface, an <b>edge</b> is where two faces meet, and a <b>vertex</b> is a corner where edges meet.</p>${pics}<p>Complete the table.</p>`,
      rows,
      header: true,
      inputs: [
        { id: 'eA', answer: A.E },
        { id: 'vA', answer: A.V },
        { id: 'fB', answer: B.F },
        { id: 'vB', answer: B.V },
      ],
      hints: [
        'Count carefully, including the faces and corners hidden at the back. Dashed lines show hidden edges.',
        `${cap(A.name)}: ${A.faces}. ${cap(B.name)}: ${B.faces}. Count each face once.`,
        `${cap(A.name)}: ${A.F} faces, ${A.E} edges, ${A.V} vertices. ${cap(B.name)}: ${B.F} faces, ${B.E} edges, ${B.V} vertices.`,
      ],
      solution: `<p><b>${cap(A.name)}</b>: ${A.F} faces, <b>${A.E}</b> edges, <b>${A.V}</b> vertices. <b>${cap(B.name)}</b>: <b>${B.F}</b> faces, ${B.E} edges, <b>${B.V}</b> vertices. ${fevWhy(A)} ${fevWhy(B)}</p>`,
      feedback: {
        correct: 'Correct. Faces are flat surfaces, edges are where faces meet, vertices are corners.',
        wrong(ans, d) {
          if (d.wrong.includes('fB')) return `Faces of a ${B.name}: ${B.faces}. Count them.`;
          if (d.wrong.includes('eA')) return `Edges of a ${A.name}: count the segments where two faces meet, including the hidden dashed ones. ${fevWhy(A)}`;
          if (d.wrong.includes('vA')) return `Vertices of a ${A.name}: count the corners, front and back.`;
          return `Vertices of a ${B.name}: count every corner, including hidden ones.`;
        },
      },
    };
  });
  function cap(s) {
    return s.charAt(0).toUpperCase() + s.slice(1);
  }
  function fevWhy(S) {
    if (S.key === 'rect' || S.key === 'cube') return `A ${S.name} is a box: 4 edges on top, 4 on the bottom, 4 standing up (12); 4 corners on top and 4 on the bottom (8).`;
    if (S.key === 'tri') return 'A triangular prism has 3 edges on each triangle end plus 3 edges joining them (9), and 3 corners on each end (6).';
    return 'A square pyramid has 4 edges around the square base plus 4 edges rising to the top point (8), and 4 base corners plus the apex (5).';
  }

  // ---------- Sort (sort): 2-D vs 3-D · prism vs pyramid · description to solid ----------
  G.define('g6_sort2D3D', (r) => {
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
        solution: `<p>Two-dimensional: ${items
          .filter((i) => i.bin === 0)
          .map((i) => i.html)
          .join(', ')}. Three-dimensional: ${items
          .filter((i) => i.bin === 1)
          .map((i) => i.html)
          .join(', ')}. A net is a flat pattern, so it is 2-D until it is folded.</p>`,
        feedback: {
          correct: 'Correct. Flat shapes and nets are 2-D; solids take up space and are 3-D.',
          wrong: () => 'Ask whether each item could lie flat on paper. Nets and polygons can; boxes, tents, and pyramids cannot.',
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
        solution: `<p>Prism: ${items
          .filter((i) => i.bin === 0)
          .map((i) => i.html)
          .join('; ')}. Pyramid: ${items
          .filter((i) => i.bin === 1)
          .map((i) => i.html)
          .join('; ')}.</p>`,
        feedback: {
          correct: 'Correct. Two bases and rectangular sides: prism. One base and triangles to a point: pyramid.',
          wrong: () => 'Does the clue describe two matching bases (prism) or faces that meet at one point (pyramid)?',
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
      solution: `<p>Rectangular prism: ${items
        .filter((i) => i.bin === 0)
        .map((i) => i.html)
        .join('; ')}. Triangular prism: ${items
        .filter((i) => i.bin === 1)
        .map((i) => i.html)
        .join('; ')}. Square pyramid: ${items
        .filter((i) => i.bin === 2)
        .map((i) => i.html)
        .join('; ')}.</p>`,
      feedback: {
        correct: 'Correct. The kinds of faces tell the solid apart.',
        wrong: () => 'Count the triangles in each clue: none means rectangular prism, two means triangular prism, four means square pyramid.',
      },
    };
  });

  // ---------- Match each solid to its net (match) ----------
  G.define('g6_matchNet', (r) => {
    const keys = r.shuffle(ORDER.slice());
    const right = r.shuffle(keys.map((k, i) => i));
    const nets = keys.map((k) => net(k, r, { width: 150, heightPx: 110 }));
    return {
      type: 'match',
      skill: 'nets',
      lesson: '5-6',
      title: 'Match the solid to its net',
      prompt: '<p>Match each solid to the net that folds into it. Look at the <b>kinds</b> of faces and how many there are.</p>',
      left: keys.map((k) => cap(SOLIDS[k].name)),
      right: right.map((i, pos) => card(nets[i], 'Net ' + (pos + 1))),
      pairs: keys.map((k, i) => [i, right.indexOf(i)]),
      hints: [
        'Count the triangles first: a square pyramid has 4, a triangular prism has 2, prisms with all rectangles have 0.',
        'A cube net has 6 squares that are all the same size. A rectangular prism net has rectangles of three different sizes.',
        keys.map((k, i) => `${cap(SOLIDS[k].name)} → Net ${right.indexOf(i) + 1}`).join('; ') + '.',
      ],
      solution: `<ul>${keys.map((k, i) => `<li>${cap(SOLIDS[k].name)} → <b>Net ${right.indexOf(i) + 1}</b> (${SOLIDS[k].faces})</li>`).join('')}</ul>`,
      feedback: {
        correct: 'Correct. The faces in a net are exactly the faces of the solid.',
        wrong(ans, d) {
          const bad = d.wrong && d.wrong[0];
          if (bad != null) return `Check the ${SOLIDS[keys[bad]].name}: its net must show ${SOLIDS[keys[bad]].faces}.`;
          return 'Count the triangles and squares in each net.';
        },
      },
    };
  });

  // ---------- Which solid does this net fold into? (mc) ----------
  G.define('g6_whichSolid', (r) => {
    const key = r.pick(ORDER);
    const S = SOLIDS[key];
    const others = ORDER.filter((k) => k !== key);
    const whyFor = {
      rect: 'A rectangular prism needs 6 rectangles. Count the shapes in this net again.',
      cube: 'A cube needs 6 squares that are all the same size.',
      tri: 'A triangular prism needs exactly 2 triangles and 3 rectangles.',
      pyr: 'A square pyramid needs 1 square and 4 triangles.',
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
      hints: ['Count each kind of shape in the net: how many triangles, how many rectangles or squares?', `This net has ${S.faces}.`, `${S.faces} fold into a ${S.name}, like ${S.example}.`],
      solution: `<p>The net has ${S.faces}, which are exactly the faces of a <b>${S.name}</b>. ${key === 'cube' ? 'Because every face is the same square, the box is a cube.' : key === 'rect' ? 'The rectangles come in three matching pairs: top and bottom, front and back, left and right.' : key === 'tri' ? 'The two triangles become the ends, and the three rectangles wrap around them.' : 'The square is the base, and the four triangles fold up to meet at the apex.'}</p>`,
      feedback: { correct: `Correct. ${S.faces} make a ${S.name}.` },
    };
  });

  // ---------- Read a net: area of one face, or count edges/vertices (num) ----------
  G.define('g6_netFaces', (r) => {
    const l = r.int(3, 9),
      w = r.int(2, Math.min(6, l)),
      h = r.int(2, 8);
    const u = r.pick(U5.UNITS);
    if (r.chance(0.6)) {
      const face = r.pick([
        { name: 'front', dims: [l, h], desc: 'length by height' },
        { name: 'top', dims: [l, w], desc: 'length by width' },
        { name: 'side', dims: [w, h], desc: 'width by height' },
      ]);
      const A = face.dims[0] * face.dims[1];
      const svg = V.prismNet({
        l,
        w,
        h,
        faceLabels: true,
        width: 300,
        labels: { l: `${l} ${u}`, w: `${w} ${u}`, h: `${h} ${u}` },
        aria: `Net of a rectangular prism with length ${l} ${u}, width ${w} ${u}, height ${h} ${u}, faces labeled`,
      });
      return {
        type: 'num',
        skill: 'nets',
        lesson: '5-6',
        title: 'Read the net',
        prompt: `<p>This net folds into a rectangular prism that is ${hl(l + ' ' + u)} long, ${hl(w + ' ' + u)} wide, and ${hl(h + ' ' + u)} tall. The faces are labeled.</p>${svg}<p>What is the area of the <b>${face.name}</b> face?</p>`,
        unit: sq(u),
        answer: A,
        hints: [
          `Find the face labeled "${face.name}" in the net. Which two edges of the prism are its sides?`,
          `The ${face.name} face is ${face.desc}: ${face.dims[0]} ${u} by ${face.dims[1]} ${u}.`,
          `${face.dims[0]} × ${face.dims[1]}.`,
        ],
        solution: `<p>The ${face.name} face is a ${face.dims[0]} by ${face.dims[1]} rectangle (${face.desc}). Area = ${face.dims[0]} × ${face.dims[1]} = <b>${A} ${sq(u)}</b>. The ${face.name === 'side' ? 'other side' : face.name === 'top' ? 'bottom' : 'back'} face is identical, because the faces of a rectangular prism come in matching pairs.</p>`,
        feedback: {
          correct: `Correct. The ${face.name} face is ${face.dims[0]} × ${face.dims[1]} = ${A} ${sq(u)}.`,
          wrong(ans, d) {
            const v = d.value;
            if (v == null) return `Multiply the two edges of the ${face.name} face.`;
            if (Math.abs(v - l * w * h) < 0.01) return 'That is the volume (all three edges). One face is flat: multiply only its two edges.';
            if (Math.abs(v - 2 * A) < 0.01) return `${2 * A} is two faces. The question asks for one ${face.name} face.`;
            const all = [l * h, l * w, w * h];
            if (all.some((x) => Math.abs(v - x) < 0.01)) return `That is the area of a different face. The ${face.name} face is ${face.desc}: ${face.dims[0]} by ${face.dims[1]}.`;
            return `The ${face.name} face is ${face.dims[0]} ${u} by ${face.dims[1]} ${u}. Multiply.`;
          },
        },
      };
    }
    const key = r.pick(['rect', 'tri', 'pyr']);
    const S = SOLIDS[key];
    const what = r.pick(['edges', 'vertices']);
    const ans = what === 'edges' ? S.E : S.V;
    return {
      type: 'num',
      skill: 'solids',
      lesson: '5-6',
      title: `Count the ${what}`,
      prompt: `<p>This net folds into a ${S.name}.</p>${net(key, r, { width: 260, heightPx: 170 })}<p>After it is folded, how many <b>${what}</b> does the solid have? ${what === 'edges' ? 'An edge is a segment where two faces meet.' : 'A vertex is a corner where edges meet.'}</p>`,
      answer: ans,
      hints: [
        `Picture the folded ${S.name}. ${fevWhy(S)}`,
        what === 'edges'
          ? 'Count edges around the base, then the edges going up. Hidden edges at the back still count.'
          : 'Count corners on the bottom, then corners on top. The apex of a pyramid is one vertex.',
        `A ${S.name} has ${ans} ${what}.`,
      ],
      solution: `<p>A ${S.name} has <b>${ans} ${what}</b>. ${fevWhy(S)} The folded solid has fewer edges than the net shows as separate segments because edges of the net join together when folded.</p>`,
      feedback: {
        correct: `Correct. A ${S.name} has ${S.F} faces, ${S.E} edges, and ${S.V} vertices.`,
        wrong(ans2, d) {
          const v = d.value;
          if (v === S.F) return `${S.F} is the number of faces. Count ${what} instead.`;
          if (v === (what === 'edges' ? S.V : S.E)) return `${v} is the number of ${what === 'edges' ? 'vertices (corners)' : 'edges (segments)'}. The question asks for ${what}.`;
          return `${fevWhy(S)}`;
        },
      },
    };
  });

  // ---------- True or false about nets and solids (tf) ----------
  G.define('g6_tfNet', (r) => {
    const v = r.pick([
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
    ]);
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
        'Picture the solid. Count its faces and think about what a net must show.',
        'A net shows every face once. Rectangular prism: 6 rectangles. Triangular prism: 2 triangles + 3 rectangles. Square pyramid: 1 square + 4 triangles.',
        v.answer ? 'The statement matches how nets and solids work, so it is true.' : 'The statement does not match the faces of the solid, so it is false.',
      ],
      solution: `<p><b>${v.answer ? 'True' : 'False'}.</b> ${reasons.find((x) => x.correct).html}</p>`,
      feedback: {
        correct: 'Correct. A net shows each face of the solid exactly once, arranged so it folds with no overlaps.',
        wrong(ans, d) {
          return !d.valueOk ? 'Count the faces of the solid and compare with the statement.' : 'Your true/false is right. Choose the reason that describes the faces correctly.';
        },
      },
    };
  });

  // ---------- Who counted correctly? (who) ----------
  G.define('g6_whoNet', (r) => {
    const key = r.pick(['tri', 'pyr', 'rect']);
    const S = SOLIDS[key];
    const [n1, n2, n3] = r.pickN(NAMES, 3);
    const line = (F, E, Vv) => `${F} faces, ${E} edges, ${Vv} vertices`;
    let wrongs;
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
    const sh = shuffleOptions(r, [{ title: n1, html: line(S.F, S.E, S.V), ok: true }, Object.assign({ title: n2 }, wrongs[0]), Object.assign({ title: n3 }, wrongs[1])], 0);
    return {
      type: 'who',
      skill: 'solids',
      lesson: '5-6',
      title: 'Who counted correctly?',
      prompt: `<p>Three students count the faces, edges, and vertices of a ${S.name}.</p>${solidPic(key, r, { width: 220, height: 150 })}<p>Who is correct?</p>`,
      options: sh.options,
      answer: sh.answer,
      layout: 'cards',
      hints: [`Start with faces: a ${S.name} has ${S.faces}. That rules out any count with the wrong number of faces.`, fevWhy(S), `${S.F} faces, ${S.E} edges, ${S.V} vertices.`],
      solution: `<p><b>${n1}</b> is correct: a ${S.name} has ${S.F} faces, ${S.E} edges, and ${S.V} vertices. ${fevWhy(S)} ${wrongs.map((w) => w.why).join(' ')}</p>`,
      feedback: { correct: `Correct. ${S.F} faces, ${S.E} edges, ${S.V} vertices.` },
    };
  });
})(typeof window !== 'undefined' ? window : globalThis);

/* js/units/u5/gen-surface-prism.js */
/* Zone 7 — The Cladding Workshop. Lesson 5-7 Determine Surface Area of Prisms (rectangular · triangular). */
(function (root) {
  'use strict';
  const RX = root.RX;
  const { G, V, shuffleOptions, NAMES, fmt, parseNum, U5 } = RX;
  const hl = V.hl;
  const sq = U5.sq,
    cu = U5.cu;

  const BOXES = ['gift box', 'shipping crate', 'storage chest', 'speaker cabinet', 'toy box', 'planter', 'cooler', 'display case'];
  const WEDGES = ['tent', 'doorstop', 'wedge of cheese', 'ramp', 'roof section', 'chocolate bar box', 'camping shelter'];

  function box(r, o) {
    o = o || {};
    const hi = o.hard ? 12 : 8;
    const l = r.int(3, hi),
      w = r.int(2, Math.min(l, hi - 1)),
      h = r.int(2, hi);
    const u = r.pick(U5.UNITS);
    const lw = l * w,
      lh = l * h,
      wh = w * h;
    return { l, w, h, u, lw, lh, wh, SA: 2 * (lw + lh + wh), V: l * w * h };
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
    if (Math.abs(v - b.V) < 0.01) return `${b.V} is the volume (l × w × h), the space inside. Surface area covers the outside: add the areas of the six faces.`;
    if (Math.abs(v - (b.lw + b.lh + b.wh)) < 0.01) return `${b.lw + b.lh + b.wh} counts only three faces. Each face has a matching partner on the opposite side, so double it.`;
    if (Math.abs(v - 2 * (b.lw + b.lh)) < 0.01 || Math.abs(v - 2 * (b.lw + b.wh)) < 0.01 || Math.abs(v - 2 * (b.lh + b.wh)) < 0.01)
      return 'You left out one pair of faces. There are three pairs: top/bottom, front/back, and the two sides.';
    if (Math.abs(v - 4 * (b.l + b.w + b.h)) < 0.01) return 'That adds up edge lengths. Surface area adds face areas (length × width for each face).';
    return `Faces: ${b.l} × ${b.w} = ${b.lw}, ${b.l} × ${b.h} = ${b.lh}, ${b.w} × ${b.h} = ${b.wh}. Double each and add.`;
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
  function wedge(r) {
    const right = r.chance(0.5);
    const [b, h, s] = r.pick(right ? RIGHT : ISO);
    const L = r.int(4, 12);
    const u = r.pick(U5.UNITS);
    const s1 = right ? h : s,
      s2 = s; // the two non-base sides of the triangle
    const tri = (b * h) / 2;
    const rects = L * (b + s1 + s2);
    return { right, b, h, s, s1, s2, L, u, tri, rects, SA: 2 * tri + rects, V: tri * L };
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
    if (Math.abs(v - t.V) < 0.01) return `${t.V} is the volume. Surface area adds the areas of the 5 faces.`;
    if (Math.abs(v - (t.b * t.h + t.rects)) < 0.01) return `You used ${t.b} × ${t.h} for the two triangles without the ½. Together the two triangles are 2 × ½ × ${t.b} × ${t.h} = ${2 * t.tri}.`;
    if (Math.abs(v - (t.tri + t.rects)) < 0.01) return `You counted only one triangle. A triangular prism has two triangular ends: add another ${t.tri}.`;
    if (Math.abs(v - (2 * t.tri + 3 * t.b * t.L)) < 0.01) return `The three rectangles are not all the same size. Each one is ${t.L} long but has a different width: ${sidesText(t)}.`;
    if (Math.abs(v - (2 * t.tri + t.L * (t.b + t.s1))) < 0.01 || Math.abs(v - (2 * t.tri + t.L * (t.b + t.s2))) < 0.01)
      return 'You left out one rectangle. There are three, one for each side of the triangle.';
    return `Two triangles: 2 × ½ × ${t.b} × ${t.h} = ${2 * t.tri}. Three rectangles: ${t.L} × (${t.b} + ${t.s1} + ${t.s2}) = ${t.rects}. Add.`;
  }

  // ---------- Surface area of a rectangular prism (num, honors hard) ----------
  G.define('g7_saPrism', (r, o) => {
    const b = box(r, o);
    const name = r.pick(NAMES),
      obj = r.pick(BOXES);
    const material = r.pick(['wrapping paper', 'sheet metal', 'fabric', 'paint', 'cardboard', 'copper sheeting']);
    return {
      type: 'num',
      skill: 'sa-rect-prism',
      lesson: '5-7',
      title: o.hard ? 'Seal of Surface: cover the box' : 'Surface area of a rectangular prism',
      xp: o.xp,
      prompt: `<p>${name} is covering every face of a ${obj} with ${material}. The ${obj} is ${hl(b.l + ' ' + b.u)} long, ${hl(b.w + ' ' + b.u)} wide, and ${hl(b.h + ' ' + b.u)} tall.</p>${o.hard ? boxSvg(b) : boxSvg(b, { width: 260, height: 190 }) + netSvg(b, { width: 280 })}<p>How much ${material} is needed? Find the surface area.</p>`,
      unit: sq(b.u),
      answer: b.SA,
      reference: true,
      hints: [
        'Surface area is the total area of all 6 faces. The faces come in 3 matching pairs: top and bottom, front and back, left and right.',
        `Top: ${b.l} × ${b.w} = ${b.lw}. Front: ${b.l} × ${b.h} = ${b.lh}. Side: ${b.w} × ${b.h} = ${b.wh}. Each has a twin.`,
        `2 × ${b.lw} + 2 × ${b.lh} + 2 × ${b.wh}.`,
      ],
      solution: `<p>Three pairs of faces: top and bottom 2 × (${b.l} × ${b.w}) = ${2 * b.lw}; front and back 2 × (${b.l} × ${b.h}) = ${2 * b.lh}; two sides 2 × (${b.w} × ${b.h}) = ${2 * b.wh}. SA = ${2 * b.lw} + ${2 * b.lh} + ${2 * b.wh} = <b>${b.SA} ${sq(b.u)}</b>. The net shows why: unfolded, the box is six rectangles, and surface area is their total.</p>`,
      feedback: { correct: `Correct. ${2 * b.lw} + ${2 * b.lh} + ${2 * b.wh} = ${b.SA} ${sq(b.u)}.`, wrong: (ans, d) => coachBox(b, d.value) },
    };
  });

  // ---------- Table of face pairs from the net (table) ----------
  G.define('g7_tableFaces', (r) => {
    const b = box(r);
    const name = r.pick(NAMES);
    return {
      type: 'table',
      skill: 'sa-rect-prism',
      lesson: '5-7',
      title: 'Face-by-face table',
      prompt: `<p>${name} unfolds a ${b.l} ${b.u} by ${b.w} ${b.u} by ${b.h} ${b.u} box into this net.</p>${netSvg(b)}<p>Complete the table. Each row is a <b>pair</b> of matching faces, so give the combined area of both.</p>`,
      rows: [
        ['Faces', 'Each face', `Combined area (${sq(b.u)})`],
        ['Top and bottom', `${b.l} × ${b.w}`, '__IN:tb__'],
        ['Front and back', `${b.l} × ${b.h}`, '__IN:fb__'],
        ['Two sides', `${b.w} × ${b.h}`, '__IN:lr__'],
        ['Surface area', 'sum of all six faces', '__IN:sa__'],
      ],
      header: true,
      inputs: [
        { id: 'tb', answer: 2 * b.lw },
        { id: 'fb', answer: 2 * b.lh },
        { id: 'lr', answer: 2 * b.wh },
        { id: 'sa', answer: b.SA },
      ],
      reference: true,
      hints: [
        'For each row, find one face (multiply) and double it for its twin.',
        `Top: ${b.l} × ${b.w} = ${b.lw}, doubled is ${2 * b.lw}. Front: ${b.l} × ${b.h} = ${b.lh}, doubled is ${2 * b.lh}. Side: ${b.w} × ${b.h} = ${b.wh}, doubled is ${2 * b.wh}.`,
        `Surface area = ${2 * b.lw} + ${2 * b.lh} + ${2 * b.wh}.`,
      ],
      solution: `<p>Top and bottom: 2 × ${b.lw} = <b>${2 * b.lw}</b>. Front and back: 2 × ${b.lh} = <b>${2 * b.lh}</b>. Two sides: 2 × ${b.wh} = <b>${2 * b.wh}</b>. Surface area: <b>${b.SA}</b> ${sq(b.u)}. Grouping faces in pairs is why the formula is 2lw + 2lh + 2wh.</p>`,
      feedback: {
        correct: 'Correct. Three pairs of faces, doubled and added.',
        wrong(ans, d) {
          const tb = parseNum(ans.tb);
          if (tb != null && Math.abs(tb - b.lw) < 0.01) return `Each row asks for both faces in the pair. Top is ${b.lw}; top and bottom together are ${2 * b.lw}.`;
          if (d.wrong.length === 1 && d.wrong[0] === 'sa') return `The pairs are right. Add them: ${2 * b.lw} + ${2 * b.lh} + ${2 * b.wh}.`;
          if (d.wrong.includes('fb')) return `Front and back: ${b.l} × ${b.h} = ${b.lh}, then double.`;
          if (d.wrong.includes('lr')) return `Two sides: ${b.w} × ${b.h} = ${b.wh}, then double.`;
          return 'Multiply the two edges of each face, then double for its twin.';
        },
      },
    };
  });

  // ---------- Fill the formula 2lw + 2lh + 2wh (blanks, template) ----------
  G.define('g7_blanksFormula', (r) => {
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
      solution: `<p>SA = 2 × <b>${b.lw}</b> + 2 × <b>${b.lh}</b> + 2 × <b>${b.wh}</b> = ${2 * b.lw} + ${2 * b.lh} + ${2 * b.wh} = <b>${b.SA}</b> ${sq(b.u)}. Each product is the area of one face; the 2 covers the identical face on the opposite side.</p>`,
      feedback: {
        correct: 'Correct. Three face areas, each doubled, then added.',
        wrong(ans, d) {
          if (d.wrong.length === 1 && d.wrong[0] === 3) return `The three faces are right. Double each and add: 2 × ${b.lw} + 2 × ${b.lh} + 2 × ${b.wh}.`;
          const a0 = parseNum(ans[0]);
          if (a0 != null && Math.abs(a0 - 2 * b.lw) < 0.01) return 'Write just one face in each blank; the 2 in the formula does the doubling for you.';
          return `l × w = ${b.l} × ${b.w}, l × h = ${b.l} × ${b.h}, w × h = ${b.w} × ${b.h}. Match each pair of letters to the edges.`;
        },
      },
    };
  });

  // ---------- Error: three faces only, or volume instead of surface area (error) ----------
  G.define('g7_errorThree', (r) => {
    const b = box(r);
    const name = r.pick(NAMES);
    const variant = r.pick(['three', 'volume']);
    let work, opts;
    if (variant === 'three') {
      const wrong = b.lw + b.lh + b.wh;
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
    } else {
      const wrong = b.V;
      work = `SA = l × w × h<br>SA = ${b.l} × ${b.w} × ${b.h}<br>SA = ${wrong} ${cu(b.u)}`;
      opts = [
        { html: `${name} found the volume (l × w × h), the space inside. Surface area is the total area of the six faces.`, ok: true },
        { html: `${name} should have doubled the answer: 2 × ${wrong}.`, why: 'Doubling a volume does not make a surface area. The formula itself is wrong: surface area adds face areas.' },
        { html: `${name} multiplied in the wrong order.`, why: 'Order does not matter for multiplying. The problem is that l × w × h is the volume formula, not the surface area formula.' },
        { html: `${name}'s work is correct.`, why: `The unit ${cu(b.u)} gives it away: cubic units measure volume. Surface area is in ${sq(b.u)}.` },
      ];
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
        'How many faces does a rectangular prism have? Does the work account for all of them?',
        variant === 'three'
          ? `The work has 3 face areas. A box has 6 faces in 3 pairs. Double each: 2 × ${b.lw}, 2 × ${b.lh}, 2 × ${b.wh}.`
          : `l × w × h fills the box with cubes. To cover the outside, add the areas of the faces: 2 × ${b.lw} + 2 × ${b.lh} + 2 × ${b.wh}.`,
        `${2 * b.lw} + ${2 * b.lh} + ${2 * b.wh}.`,
      ],
      solution: `<p>${variant === 'three' ? `${name} added three faces but forgot their twins.` : `${name} computed volume instead of surface area.`} Correct: SA = 2(${b.l} × ${b.w}) + 2(${b.l} × ${b.h}) + 2(${b.w} × ${b.h}) = ${2 * b.lw} + ${2 * b.lh} + ${2 * b.wh} = <b>${b.SA} ${sq(b.u)}</b>.</p>`,
      feedback: {
        correct: `Correct. Six faces in three pairs: ${b.SA} ${sq(b.u)}.`,
        wrong(ans, d) {
          if (!d.mistakeOk) return (sh.options[ans.mistake] && sh.options[ans.mistake].why) || 'Count the faces in the work and compare with the six faces of a box.';
          return `You found the mistake. For the fix: 2 × ${b.lw} + 2 × ${b.lh} + 2 × ${b.wh}.`;
        },
      },
    };
  });

  // ---------- Surface area of a triangular prism (num) ----------
  G.define('g7_triPrism', (r) => {
    const t = wedge(r);
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
        `Two triangles: 2 × (½ × ${t.b} × ${t.h}) = ${2 * t.tri}. Rectangles: ${t.L} × ${t.b}, ${t.L} × ${t.s1}, ${t.L} × ${t.s2}.`,
        `${2 * t.tri} + ${t.L * t.b} + ${t.L * t.s1} + ${t.L * t.s2}.`,
      ],
      solution: `<p>Triangles: 2 × ½ × ${t.b} × ${t.h} = ${2 * t.tri}. Rectangles: ${t.L} × ${t.b} = ${t.L * t.b}, ${t.L} × ${t.s1} = ${t.L * t.s1}, ${t.L} × ${t.s2} = ${t.L * t.s2}. SA = ${2 * t.tri} + ${t.L * t.b} + ${t.L * t.s1} + ${t.L * t.s2} = <b>${t.SA} ${sq(t.u)}</b>. The three rectangles have different widths because they wrap around the three sides of the triangle, so the slanted side ${t.s} is needed here even though it is not used for the triangle's area.</p>`,
      feedback: { correct: `Correct. 2 triangles (${2 * t.tri}) + 3 rectangles (${t.rects}) = ${t.SA} ${sq(t.u)}.`, wrong: (ans, d) => coachWedge(t, d.value) },
    };
  });

  // ---------- Triangles, rectangles, total (blanks, template) ----------
  G.define('g7_triBlanks', (r) => {
    const t = wedge(r);
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
        { label: 'two triangles', answer: 2 * t.tri },
        { label: 'three rectangles', answer: t.rects },
        { label: 'surface area', answer: t.SA },
      ],
      template: `The two triangles together have an area of {0} ${sq(t.u)}. The three rectangles together have an area of {1} ${sq(t.u)}. Surface area = {2} ${sq(t.u)}.`,
      reference: true,
      hints: [
        'Each triangle is ½ × base × height. Each rectangle is the prism length times one side of the triangle.',
        `Triangles: 2 × ½ × ${t.b} × ${t.h}. Rectangles: ${t.L} × ${t.b} + ${t.L} × ${t.s1} + ${t.L} × ${t.s2}, or ${t.L} × (${t.b} + ${t.s1} + ${t.s2}).`,
        `${2 * t.tri} + ${t.rects}.`,
      ],
      solution: `<p>Triangles: 2 × ½ × ${t.b} × ${t.h} = <b>${2 * t.tri}</b>. Rectangles: ${t.L} × (${t.b} + ${t.s1} + ${t.s2}) = ${t.L} × ${t.b + t.s1 + t.s2} = <b>${t.rects}</b>. Surface area: <b>${t.SA}</b> ${sq(t.u)}. In the net, the three rectangles line up side by side, so their total width is the perimeter of the triangle.</p>`,
      feedback: {
        correct: 'Correct. Two triangles plus three rectangles.',
        wrong(ans, d) {
          const tv = parseNum(ans[0]),
            rv = parseNum(ans[1]);
          if (tv != null && Math.abs(tv - t.tri) < 0.01) return `${t.tri} is one triangle. There are two: ${2 * t.tri}.`;
          if (tv != null && Math.abs(tv - 2 * t.b * t.h) < 0.01) return `Each triangle needs the ½: ½ × ${t.b} × ${t.h} = ${t.tri}, and two of them make ${2 * t.tri}.`;
          if (rv != null && Math.abs(rv - 3 * t.b * t.L) < 0.01) return `The rectangles have different widths: ${t.b}, ${t.s1}, and ${t.s2}. Multiply each by ${t.L}.`;
          if (d.wrong.length === 1 && d.wrong[0] === 2) return `Add: ${2 * t.tri} + ${t.rects}.`;
          return `Triangles: 2 × ½ × ${t.b} × ${t.h}. Rectangles: ${t.L} × (${t.b} + ${t.s1} + ${t.s2}).`;
        },
      },
    };
  });

  // ---------- Who found the triangular prism's surface area? (who) ----------
  G.define('g7_whoTri', (r) => {
    const t = wedge(r);
    const [n1, n2, n3] = r.pickN(NAMES, 3);
    const sh = shuffleOptions(
      r,
      [
        { title: n1, html: `2 × (½ × ${t.b} × ${t.h}) = ${2 * t.tri}<br>${t.L} × (${t.b} + ${t.s1} + ${t.s2}) = ${t.rects}<br><b>SA = ${t.SA} ${sq(t.u)}</b>`, ok: true },
        {
          title: n2,
          html: `2 × (${t.b} × ${t.h}) = ${2 * t.b * t.h}<br>${t.L} × (${t.b} + ${t.s1} + ${t.s2}) = ${t.rects}<br><b>SA = ${2 * t.b * t.h + t.rects} ${sq(t.u)}</b>`,
          why: `${n2} forgot the ½ for the triangles. ${t.b} × ${t.h} is a rectangle; each triangle is half of that.`,
        },
        {
          title: n3,
          html: `2 × (½ × ${t.b} × ${t.h}) = ${2 * t.tri}<br>3 × (${t.L} × ${t.b}) = ${3 * t.L * t.b}<br><b>SA = ${2 * t.tri + 3 * t.L * t.b} ${sq(t.u)}</b>`,
          why: `${n3} made all three rectangles ${t.L} by ${t.b}. The rectangles have different widths: ${t.b}, ${t.s1}, and ${t.s2}.`,
        },
      ],
      0,
    );
    return {
      type: 'who',
      skill: 'sa-tri-prism',
      lesson: '5-7',
      title: 'Who is correct?',
      prompt: `<p>Three students find the surface area of this triangular prism. It is ${t.L} ${t.u} long; each triangle has base ${t.b} ${t.u}, height ${t.h} ${t.u}, and sides ${sidesText(t)}.</p>${wedgeSvg(t, { width: 260, height: 190 })}<p>Who is correct?</p>`,
      options: sh.options,
      answer: sh.answer,
      layout: 'cards',
      hints: [
        'Check the triangles: did they use ½ × base × height? Check the rectangles: does each one use a different side of the triangle?',
        `Two triangles: 2 × ½ × ${t.b} × ${t.h} = ${2 * t.tri}. Three rectangles: ${t.L} × ${t.b}, ${t.L} × ${t.s1}, ${t.L} × ${t.s2}.`,
        `${2 * t.tri} + ${t.rects} = ${t.SA}.`,
      ],
      solution: `<p><b>${n1}</b> is correct: ${2 * t.tri} + ${t.rects} = ${t.SA} ${sq(t.u)}. ${n2} left out the ½ on the triangles. ${n3} used the base for every rectangle, but each rectangle wraps a different side of the triangle.</p>`,
      feedback: { correct: `Correct. ${n1} halved the triangles and used all three triangle sides for the rectangles.` },
    };
  });

  // ---------- Sort: surface area or volume? (sort) ----------
  G.define('g7_sortSAorV', (r) => {
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
    const items = r.shuffle(
      r
        .pickN(SA, 3)
        .map((t) => ({ html: t, bin: 0 }))
        .concat(r.pickN(VOL, 3).map((t) => ({ html: t, bin: 1 }))),
    );
    return {
      type: 'sort',
      skill: 'sa-rect-prism',
      lesson: '5-7',
      title: 'Surface area or volume?',
      prompt: '<p><b>Surface area</b> measures the outside of a solid: how much covers it. <b>Volume</b> measures the inside: how much fills it. Sort each item.</p>',
      bins: ['Surface area (covers)', 'Volume (fills)'],
      items,
      hints: [
        'Ask: does this cover the outside, or fill the inside?',
        'Covering uses flat material and square units. Filling uses cubes and cubic units.',
        'Paper, paint, fabric, tiles, and 2lw + 2lh + 2wh go with surface area. Water, sand, air, concrete, and l × w × h go with volume.',
      ],
      solution: `<p>Surface area: ${items
        .filter((i) => i.bin === 0)
        .map((i) => i.html)
        .join('; ')}. Volume: ${items
        .filter((i) => i.bin === 1)
        .map((i) => i.html)
        .join('; ')}. Surface area is in square units because it is area; volume is in cubic units because it counts cubes.</p>`,
      feedback: { correct: 'Correct. Covering is surface area; filling is volume.', wrong: () => 'Does the item cover the outside (surface area) or fill the inside (volume)?' },
    };
  });
})(typeof window !== 'undefined' ? window : globalThis);

/* js/units/u5/gen-surface-pyramid.js */
/* Zone 8 — The Spire. Lesson 5-8 Determine Surface Area of Pyramids (square pyramids · lateral area). */
(function (root) {
  'use strict';
  const RX = root.RX;
  const { G, V, shuffleOptions, NAMES, fmt, parseNum, U5 } = RX;
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

  function pyr(r, o) {
    o = o || {};
    const [hb, h, sl] = r.pick(TRIPLES);
    const b = 2 * hb;
    const u = r.pick(U5.UNITS);
    const base = b * b,
      tri = (b * sl) / 2,
      lat = 4 * tri;
    return { b, h, sl, u, base, tri, lat, SA: base + lat };
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
  function coachSA(p, v, withH) {
    if (v == null) return 'Surface area = square base + 4 triangles. Each triangle is ½ × base edge × slant height.';
    if (Math.abs(v - p.lat) < 0.01) return `${p.lat} is the lateral area, the four triangles only. Add the square base: ${p.base}.`;
    if (Math.abs(v - (p.base + p.tri)) < 0.01) return `You added only one triangle. There are four identical faces: 4 × ${p.tri} = ${p.lat}.`;
    if (Math.abs(v - (p.base + 2 * p.b * p.sl * 2)) < 0.01) return `You forgot the ½ in the triangle formula. Each triangle is ½ × ${p.b} × ${p.sl} = ${p.tri}.`;
    if (withH && Math.abs(v - (p.base + 2 * p.b * p.h)) < 0.01)
      return `You used the vertical height ${p.h}. The triangular faces are measured by the slant height ${p.sl}, the distance up the face itself.`;
    if (Math.abs(v - 5 * p.tri) < 0.01) return `You counted 5 triangles. The fifth face is the square base, ${p.b} × ${p.b} = ${p.base}.`;
    return `Base ${p.b} × ${p.b} = ${p.base}. Each triangle ½ × ${p.b} × ${p.sl} = ${p.tri}. SA = ${p.base} + 4 × ${p.tri}.`;
  }

  // ---------- Surface area of a square pyramid (num, honors hard) ----------
  G.define('g8_saPyramid', (r, o) => {
    const p = pyr(r, o);
    const name = r.pick(NAMES),
      obj = r.pick(OBJECTS);
    const hardText = o.hard ? ` The pyramid stands ${p.h} ${p.u} tall from the center of its base to the top.` : '';
    return {
      type: 'num',
      skill: 'sa-pyramid',
      lesson: '5-8',
      title: o.hard ? 'Seal of Surface: pyramid' : 'Surface area of a square pyramid',
      xp: o.xp,
      prompt: `<p>${name} is covering a ${obj} shaped like a square pyramid. Its base is a ${hl(p.b + ' ' + p.u)} square. Each triangular face has a slant height of ${hl(p.sl + ' ' + p.u)}.${hardText}</p>${o.hard ? pyrSvg(p) : pyrSvg(p, { extra: { width: 240, height: 190 } }) + netSvg(p, { width: 220 })}<p>What is the total surface area, including the base?</p>`,
      unit: sq(p.u),
      answer: p.SA,
      reference: true,
      hints: [
        'A square pyramid has 5 faces: 1 square base and 4 identical triangles. Add them all.' + (o.hard ? ' The triangles use the slant height, not the vertical height.' : ''),
        `Base: ${p.b} × ${p.b} = ${p.base}. One triangle: ½ × ${p.b} × ${p.sl} = ${p.tri}.`,
        `${p.base} + 4 × ${p.tri}.`,
      ],
      solution: `<p>Base: ${p.b} × ${p.b} = ${p.base}. Four triangles: 4 × (½ × ${p.b} × ${p.sl}) = 4 × ${p.tri} = ${p.lat}. SA = ${p.base} + ${p.lat} = <b>${p.SA} ${sq(p.u)}</b>. The slant height is the height of each triangular face measured along the face, so it is the h in ½bh.${o.hard ? ` The vertical height ${p.h} ${p.u} is shorter and is not part of any face.` : ''}</p>`,
      feedback: { correct: `Correct. ${p.base} + 4 × ${p.tri} = ${p.SA} ${sq(p.u)}.`, wrong: (ans, d) => coachSA(p, d.value, o.hard) },
    };
  });

  // ---------- Base, one triangle, four triangles, total (blanks, template) ----------
  G.define('g8_blanksPyr', (r) => {
    const p = pyr(r);
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
      solution: `<p>Base: ${p.b} × ${p.b} = <b>${p.base}</b>. One triangle: ½ × ${p.b} × ${p.sl} = <b>${p.tri}</b>. Four triangles: 4 × ${p.tri} = <b>${p.lat}</b>. Surface area: ${p.base} + ${p.lat} = <b>${p.SA}</b> ${sq(p.u)}. The net makes the five faces easy to see and count.</p>`,
      feedback: {
        correct: 'Correct. Square base plus four identical triangles.',
        wrong(ans, d) {
          const t = parseNum(ans[1]);
          if (t != null && Math.abs(t - p.b * p.sl) < 0.01) return `A triangle is half of base × height: ½ × ${p.b} × ${p.sl} = ${p.tri}.`;
          if (d.wrong.includes(0)) return `The base is a square with edge ${p.b}: ${p.b} × ${p.b}.`;
          if (d.wrong.includes(2) && !d.wrong.includes(1)) return `Four identical triangles: 4 × ${p.tri}.`;
          if (d.wrong.length === 1 && d.wrong[0] === 3) return `Add the base and the four triangles: ${p.base} + ${p.lat}.`;
          return `Base ${p.b} × ${p.b}; triangle ½ × ${p.b} × ${p.sl}; then × 4; then add.`;
        },
      },
    };
  });

  // ---------- Error: used the vertical height, or counted 5 triangles (error) ----------
  G.define('g8_errorSlant', (r) => {
    const p = pyr(r);
    const name = r.pick(NAMES);
    const variant = r.pick(['height', 'five']);
    let work, opts;
    if (variant === 'height') {
      const wrong = p.base + 4 * ((p.b * p.h) / 2);
      work = `Base: ${p.b} × ${p.b} = ${p.base}<br>Triangle: ½ × ${p.b} × ${p.h} = ${(p.b * p.h) / 2}<br>SA = ${p.base} + 4 × ${(p.b * p.h) / 2} = ${wrong} ${sq(p.u)}`;
      opts = [
        { html: `${name} used the vertical height ${p.h} ${p.u} for the triangles. A face's height is the slant height, ${p.sl} ${p.u}, measured along the face.`, ok: true },
        { html: `${name} forgot the ½ in the triangle formula.`, why: 'The ½ is there. The problem is which height was multiplied: the triangle faces use the slant height.' },
        { html: `${name} should have used 5 triangles.`, why: 'A square pyramid has 4 triangles and 1 square base. The count is right; the height used is wrong.' },
        { html: `${name}'s work is correct.`, why: `The vertical height ${p.h} runs through the inside of the pyramid, not along a face. The faces are taller: slant height ${p.sl}.` },
      ];
    } else {
      const wrong = 5 * p.tri;
      work = `Triangle: ½ × ${p.b} × ${p.sl} = ${p.tri}<br>5 faces<br>SA = 5 × ${p.tri} = ${wrong} ${sq(p.u)}`;
      opts = [
        { html: `${name} treated all 5 faces as triangles. The fifth face is the square base: ${p.b} × ${p.b} = ${p.base}.`, ok: true },
        { html: `${name} should have used 4 faces and stopped there.`, why: 'Four triangles give the lateral area only. The base must be added too; it is just not a triangle.' },
        {
          html: `${name} used the wrong slant height.`,
          why: `${p.sl} ${p.u} is the slant height and ½ × ${p.b} × ${p.sl} = ${p.tri} is correct for one triangle. The mistake is counting the base as a triangle.`,
        },
        { html: `${name}'s work is correct.`, why: `The base is a ${p.b} by ${p.b} square with area ${p.base}, not a triangle with area ${p.tri}.` },
      ];
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
      hints: [
        variant === 'height' ? 'Two different heights are given. Which one lies on a triangular face?' : 'A square pyramid has 5 faces. Are they all the same shape?',
        variant === 'height'
          ? `The slant height ${p.sl} ${p.u} is the height of a triangular face. The vertical height ${p.h} ${p.u} is inside the pyramid and belongs to no face.`
          : `Four faces are triangles (${p.tri} each). The fifth is the square base: ${p.b} × ${p.b} = ${p.base}.`,
        `Correct: ${p.base} + 4 × ${p.tri}.`,
      ],
      solution: `<p>${variant === 'height' ? `${name} used the vertical height. The faces are triangles whose height is the slant height ${p.sl}.` : `${name} counted the base as a fifth triangle, but it is a square.`} Correct: base ${p.b} × ${p.b} = ${p.base}; triangles 4 × (½ × ${p.b} × ${p.sl}) = ${p.lat}; SA = <b>${p.SA} ${sq(p.u)}</b>.</p>`,
      feedback: {
        correct: `Correct. ${p.base} + ${p.lat} = ${p.SA} ${sq(p.u)}.`,
        wrong(ans, d) {
          if (!d.mistakeOk) return (sh.options[ans.mistake] && sh.options[ans.mistake].why) || 'Compare the work with the five faces of the pyramid.';
          return `You found the mistake. For the fix: ${p.base} + 4 × ${p.tri}.`;
        },
      },
    };
  });

  // ---------- Table from the net (table) ----------
  G.define('g8_tableNet', (r) => {
    const p = pyr(r);
    const name = r.pick(NAMES);
    return {
      type: 'table',
      skill: 'sa-pyramid',
      lesson: '5-8',
      title: 'Faces of the net',
      prompt: `<p>${name} unfolds a square pyramid into this net. The base edge is ${hl(p.b + ' ' + p.u)} and the slant height is ${hl(p.sl + ' ' + p.u)}.</p>${netSvg(p)}<p>Complete the table.</p>`,
      rows: [
        ['Part of the net', 'How to find it', `Area (${sq(p.u)})`],
        ['Square base', `${p.b} × ${p.b}`, '__IN:base__'],
        ['One triangle', `½ × ${p.b} × ${p.sl}`, '__IN:tri__'],
        ['All four triangles', '4 × one triangle', '__IN:lat__'],
        ['Surface area', 'base + four triangles', '__IN:sa__'],
      ],
      header: true,
      inputs: [
        { id: 'base', answer: p.base },
        { id: 'tri', answer: p.tri },
        { id: 'lat', answer: p.lat },
        { id: 'sa', answer: p.SA },
      ],
      reference: true,
      hints: [
        'Work down the table. Each row uses the one above it.',
        `Base: ${p.b} × ${p.b}. One triangle: half of ${p.b} × ${p.sl} = half of ${p.b * p.sl}.`,
        `Four triangles: 4 × ${p.tri}. Surface area: ${p.base} + that.`,
      ],
      solution: `<p>Base: <b>${p.base}</b>. One triangle: <b>${p.tri}</b>. Four triangles: <b>${p.lat}</b>. Surface area: ${p.base} + ${p.lat} = <b>${p.SA}</b> ${sq(p.u)}. The four triangles are identical because the base is a square and the apex is directly above its center.</p>`,
      feedback: {
        correct: 'Correct. The net shows all five faces, and their areas add to the surface area.',
        wrong(ans, d) {
          if (d.wrong.includes('base')) return `The base is a square: ${p.b} × ${p.b}.`;
          if (d.wrong.includes('tri')) return `One triangle: ½ × ${p.b} × ${p.sl}. Multiply, then halve.`;
          if (d.wrong.includes('lat')) return `Four triangles: 4 × ${p.tri}.`;
          return `Surface area: ${p.base} + ${p.lat}.`;
        },
      },
    };
  });

  // ---------- Lateral area: the triangles only (num) ----------
  G.define('g8_lateral', (r) => {
    const p = pyr(r);
    const name = r.pick(NAMES);
    const ctx = r.pick([
      ['glass for the four sides of a pyramid-shaped skylight', 'The skylight sits on the roof, so the base is open and needs no glass.'],
      ['fabric for the sides of a pyramid tent', 'The tent has no floor, so only the four triangular sides need fabric.'],
      ['paint for the sides of a pyramid-shaped monument', 'The base rests on the ground and is not painted.'],
      ['gold leaf for the four faces of a pyramid-shaped roof', 'The roof sits on the building, so the base is not covered.'],
      ['shingles for a pyramid-shaped roof', 'The square bottom is the ceiling, so it gets no shingles.'],
    ]);
    return {
      type: 'num',
      skill: 'lateral-area',
      lesson: '5-8',
      title: 'Lateral area',
      prompt: `<p>${name} needs ${ctx[0]}. ${ctx[1]} The base is a ${hl(p.b + ' ' + p.u)} square, and the slant height is ${hl(p.sl + ' ' + p.u)}.</p>${pyrSvg(p)}<p>What is the <b>lateral area</b>, the area of the four triangular faces only?</p>`,
      unit: sq(p.u),
      answer: p.lat,
      reference: true,
      hints: ['Lateral area means the side faces only. Leave out the base.', `One triangle: ½ × ${p.b} × ${p.sl} = ${p.tri}.`, `Four identical triangles: 4 × ${p.tri}.`],
      solution: `<p>One triangular face: ½ × ${p.b} × ${p.sl} = ${p.tri}. Lateral area = 4 × ${p.tri} = <b>${p.lat} ${sq(p.u)}</b>. The base (${p.base} ${sq(p.u)}) is not included because ${ctx[1].charAt(0).toLowerCase() + ctx[1].slice(1)}</p>`,
      feedback: {
        correct: `Correct. 4 × ${p.tri} = ${p.lat} ${sq(p.u)}, sides only.`,
        wrong(ans, d) {
          const v = d.value;
          if (v == null) return `Four triangles, each ½ × ${p.b} × ${p.sl}.`;
          if (Math.abs(v - p.SA) < 0.01) return `${p.SA} includes the base. Lateral area is the four triangles only: subtract ${p.base}.`;
          if (Math.abs(v - p.tri) < 0.01) return `${p.tri} is one face. There are four: 4 × ${p.tri}.`;
          if (Math.abs(v - 4 * p.b * p.sl) < 0.01) return `You forgot the ½. Each triangle is ½ × ${p.b} × ${p.sl} = ${p.tri}.`;
          if (Math.abs(v - p.base) < 0.01) return `${p.base} is the base, which is exactly the part that is not covered.`;
          return `Lateral area = 4 × (½ × ${p.b} × ${p.sl}).`;
        },
      },
    };
  });

  // ---------- True or false about lateral area and slant height (tf) ----------
  G.define('g8_tfLateral', (r) => {
    const p = pyr(r);
    const v = r.pick([
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
    ]);
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
        v.answer ? 'The statement agrees with these facts, so it is true.' : 'The statement contradicts these facts, so it is false.',
      ],
      solution: `<p><b>${v.answer ? 'True' : 'False'}.</b> ${reasons.find((x) => x.correct).html}</p>`,
      feedback: {
        correct: 'Correct. Lateral area is the sides only; surface area adds the base.',
        wrong(ans, d) {
          return !d.valueOk
            ? 'Test the statement with the formulas: lateral area = 4 × ½ × b × slant, surface area = lateral area + b².'
            : 'Your true/false is right. Choose the reason that uses lateral area and slant height correctly.';
        },
      },
    };
  });

  // ---------- Which expression? surface or lateral (mc) ----------
  G.define('g8_whichExpr', (r) => {
    const p = pyr(r);
    const lateral = r.chance(0.5);
    const ok = lateral ? `4 × (½ × ${p.b} × ${p.sl})` : `${p.b} × ${p.b} + 4 × (½ × ${p.b} × ${p.sl})`;
    const opts = lateral
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
    const sh = shuffleOptions(r, opts, 0);
    return {
      type: 'mc',
      skill: 'lateral-area',
      lesson: '5-8',
      title: lateral ? 'Choose the lateral area expression' : 'Choose the surface area expression',
      prompt: `<p>A square pyramid has a base edge of ${hl(p.b + ' ' + p.u)} and a slant height of ${hl(p.sl + ' ' + p.u)}.</p>${pyrSvg(p, { extra: { width: 240, height: 190 } })}<p>Which expression gives its <b>${lateral ? 'lateral area' : 'total surface area'}</b> in ${sq(p.u)}?</p>`,
      options: sh.options,
      answer: sh.answer,
      reference: true,
      hints: [
        lateral ? 'Lateral area is the side faces only: four triangles, no base.' : 'Surface area is every face: the square base plus four triangles.',
        `Each triangle is ½ × ${p.b} × ${p.sl}. The base is ${p.b} × ${p.b}.`,
        lateral ? `Four triangles: 4 × (½ × ${p.b} × ${p.sl}) = ${p.lat}.` : `Base plus four triangles: ${p.base} + ${p.lat} = ${p.SA}.`,
      ],
      solution: `<p><b>${ok}</b> = ${lateral ? p.lat : p.SA} ${sq(p.u)}. ${lateral ? 'Lateral area leaves out the base and counts the four triangular faces, each ½ × base edge × slant height.' : 'Surface area adds the square base to the four triangular faces, each ½ × base edge × slant height.'}</p>`,
      feedback: { correct: lateral ? 'Correct. Four triangles, no base.' : 'Correct. Square base plus four triangles.' },
    };
  });

  // ---------- Match terms (match) ----------
  G.define('g8_matchTerms', (r) => {
    const p = pyr(r);
    let pairs;
    if (r.chance(0.5)) {
      pairs = [
        ['Slant height', 'The height of one triangular face, from the base edge up to the apex'],
        ['Lateral area', 'The area of the four triangular faces only'],
        ['Surface area', 'Lateral area plus the area of the base'],
        ['Apex', 'The point at the top where the triangular faces meet'],
      ];
    } else {
      // numeric version; the four values are distinct because slant ≠ 2 × base edge for every triple used
      pairs = [
        [`Area of the base (${p.b} × ${p.b})`, `${p.base} ${sq(p.u)}`],
        [`One triangular face (½ × ${p.b} × ${p.sl})`, `${p.tri} ${sq(p.u)}`],
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
      prompt: `<p>A square pyramid has base edge ${hl(p.b + ' ' + p.u)} and slant height ${hl(p.sl + ' ' + p.u)}.</p>${pyrSvg(p, { extra: { width: 220, height: 170 } })}<p>Match each term to its meaning or value.</p>`,
      left: pairs.map((x) => x[0]),
      right: right.map((i) => pairs[i][1]),
      pairs: pairs.map((x, i) => [i, right.indexOf(i)]),
      reference: true,
      hints: [
        'Lateral means side. The slant height belongs to a face; the apex is the top point.',
        `Base ${p.b} × ${p.b} = ${p.base}. One triangle ½ × ${p.b} × ${p.sl} = ${p.tri}.`,
        `Lateral area 4 × ${p.tri} = ${p.lat}. Surface area ${p.base} + ${p.lat} = ${p.SA}.`,
      ],
      solution: `<ul>${pairs.map((x) => `<li>${x[0]} → <b>${x[1]}</b></li>`).join('')}</ul>`,
      feedback: {
        correct: 'Correct. Lateral area is the sides; surface area adds the base; slant height measures a face.',
        wrong(ans, d) {
          const bad = d.wrong && d.wrong[0];
          if (bad != null) return `Check "${pairs[bad][0]}." ${bad === 0 ? 'Start here and build the others from it.' : 'It is built from the row above it.'}`;
          return 'Start with the base and one triangle, then build lateral area and surface area from them.';
        },
      },
    };
  });
})(typeof window !== 'undefined' ? window : globalThis);

/* js/units/u5/gen-cave.js */
/* Optional zone — The Undercroft. Harder, mixed-skill challenge generators (prefix gc_). */
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

  // ---------- Missing base of a trapezoid from its area (num) ----------
  G.define('gc_missingBase', (r) => {
    const u = r.pick(U5.UNITS),
      name = r.pick(NAMES);
    const b2 = r.int(3, 10),
      b1 = b2 + r.int(2, 9);
    let h = r.int(3, 9);
    if (((b1 + b2) * h) % 2) h += 1;
    const A = ((b1 + b2) * h) / 2;
    const askLong = r.chance(0.5);
    const known = askLong ? b2 : b1,
      want = askLong ? b1 : b2;
    const svg = V.trapezoid(b1, b2, h, {
      b1: askLong ? `? ${u}` : `${b1} ${u}`,
      b2: askLong ? `${b2} ${u}` : `? ${u}`,
      height: `${h} ${u}`,
      aria: `Trapezoid with one base ${known} ${u}, height ${h} ${u}, and an unknown base`,
    });
    const obj = r.pick(['keystone', 'garden plot', 'stage platform', 'window', 'wall panel']);
    return {
      type: 'num',
      skill: 'trapezoid-formula',
      lesson: '5-3',
      title: 'Missing base',
      prompt: `<p>${name}'s trapezoid-shaped ${obj} has an area of ${hl(A + ' ' + sq(u))} and a height of ${hl(h + ' ' + u)}. One base is ${hl(known + ' ' + u)}. The other base is unknown.</p>${svg}<p>What is the length of the unknown base?</p>`,
      unit: u,
      answer: want,
      reference: true,
      hints: [
        'Start from A = ½ × (b₁ + b₂) × h and undo each step. First undo the ½ by doubling the area.',
        `2 × ${A} = ${2 * A}. That equals (b₁ + b₂) × ${h}. Divide by the height to get the sum of the bases.`,
        `${2 * A} ÷ ${h} = ${b1 + b2}. The bases add to ${b1 + b2}; subtract the known base ${known}.`,
      ],
      solution: `<p>2 × A = ${2 * A} = (b₁ + b₂) × ${h}, so b₁ + b₂ = ${2 * A} ÷ ${h} = ${b1 + b2}. The unknown base is ${b1 + b2} − ${known} = <b>${want} ${u}</b>. Check: ½ × (${b1} + ${b2}) × ${h} = ${A}. Working backward undoes the formula one operation at a time.</p>`,
      feedback: {
        correct: `Correct. The bases add to ${b1 + b2}, so the missing one is ${want} ${u}.`,
        wrong(ans, d) {
          const v = d.value;
          if (v == null) return 'Double the area, divide by the height, then subtract the known base.';
          if (Math.abs(v - (A / h - known)) < 0.01) return `You forgot to undo the ½. Double the area first: 2 × ${A} = ${2 * A}.`;
          if (Math.abs(v - (2 * A) / h) < 0.01) return `${(2 * A) / h} is the sum of both bases. Subtract the known base ${known}.`;
          if (Math.abs(v - A / h) < 0.01) return `${fmt(A / h)} is the average of the two bases (half their sum). Double it to get the sum, then subtract ${known}.`;
          return `Sum of bases = 2 × ${A} ÷ ${h} = ${b1 + b2}. Then ${b1 + b2} − ${known}.`;
        },
      },
    };
  });

  // ---------- Trapezoid with a rectangular cut-out (num) ----------
  G.define('gc_compositeTrap', (r) => {
    const u = r.pick(U5.UNITS),
      name = r.pick(NAMES);
    const b2 = r.int(6, 10),
      b1 = b2 + 2 * r.int(1, 4),
      h = r.int(5, 9);
    if (((b1 + b2) * h) % 2) return G.make('gc_compositeTrap', r, {}); // re-draw: keep the trapezoid area whole
    const w = r.int(2, b2 - 3),
      k = r.int(2, h - 3);
    const trap = ((b1 + b2) * h) / 2,
      hole = w * k,
      A = trap - hole;
    const off = (b1 - b2) / 2;
    const x0 = (b1 - w) / 2,
      y0 = 1.5;
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
        [
          [x0, y0],
          [x0 + w, y0],
          [x0 + w, y0 + k],
          [x0, y0 + k],
        ],
      ],
      fills: [C.a, '#ffffff'],
      dashes: [[b1 - off - 0.01, 0, b1 - off - 0.01, h, C.d]],
      rightAngles: [[b1 - off - 0.01, 0, -1, 1]],
      labels: [
        { x: b1 / 2, y: 0, text: `${b1} ${u}`, dy: 20 },
        { x: b1 / 2, y: h, text: `${b2} ${u}`, dy: -8 },
        { x: b1 - off, y: h / 2, text: `${h} ${u}`, anchor: 'start', dx: 8, color: C.d },
        { x: x0 + w / 2, y: y0 + k, text: `${w} ${u}`, dy: -5, size: 11 },
        { x: x0 + w, y: y0 + k / 2, text: `${k} ${u}`, anchor: 'start', dx: 5, size: 11 },
      ],
      aria: `Trapezoid with bases ${b1} ${u} and ${b2} ${u} and height ${h} ${u}, with a ${w} by ${k} rectangle cut out of the middle`,
    });
    const ctx = r.pick([
      ['the end wall of a shed', 'a window', 'siding'],
      ['a trapezoid-shaped sign', 'a cut-out for a clock', 'paint'],
      ['a garden wall', 'a gate opening', 'stone'],
      ['a stage backdrop', 'a doorway', 'fabric'],
    ]);
    return {
      type: 'num',
      skill: 'composite-figures',
      lesson: '5-4',
      title: 'Trapezoid with a cut-out',
      prompt: `<p>${name} is covering ${ctx[0]} with ${ctx[2]}. The wall is a trapezoid with bases ${hl(b1 + ' ' + u)} and ${hl(b2 + ' ' + u)} and height ${hl(h + ' ' + u)}. In the middle is ${ctx[1]}, a ${hl(w + ' ' + u)} by ${hl(k + ' ' + u)} rectangle that is not covered.</p>${svg}<p>How much area gets covered?</p>`,
      unit: sq(u),
      answer: A,
      reference: true,
      hints: ['Find the whole trapezoid first, then subtract the rectangular hole.', `Trapezoid: ½ × (${b1} + ${b2}) × ${h} = ${trap}. Hole: ${w} × ${k} = ${hole}.`, `${trap} − ${hole}.`],
      solution: `<p>Trapezoid: ½ × (${b1} + ${b2}) × ${h} = ½ × ${b1 + b2} × ${h} = ${trap}. Cut-out: ${w} × ${k} = ${hole}. Covered area: ${trap} − ${hole} = <b>${A} ${sq(u)}</b>. Whole minus hole works for any shape of hole, as long as the hole is fully inside.</p>`,
      feedback: {
        correct: `Correct. ${trap} − ${hole} = ${A} ${sq(u)}.`,
        wrong(ans, d) {
          const v = d.value;
          if (v == null) return 'Trapezoid area minus the rectangle.';
          if (Math.abs(v - trap) < 0.01) return `${trap} is the whole trapezoid. The ${w} by ${k} opening is not covered: subtract ${hole}.`;
          if (Math.abs(v - (trap + hole)) < 0.01) return 'You added the hole. It is removed, so subtract.';
          if (Math.abs(v - ((b1 + b2) * h - hole)) < 0.01) return `You forgot the ½ in the trapezoid formula. The trapezoid is ½ × ${b1 + b2} × ${h} = ${trap}.`;
          if (Math.abs(v - (b1 * h - hole)) < 0.01) return `${b1} × ${h} is a rectangle, not the trapezoid. Use ½ × (${b1} + ${b2}) × ${h}.`;
          return `Trapezoid ${trap}, minus hole ${hole}.`;
        },
      },
    };
  });

  // ---------- Order mixed figures by area (seq) ----------
  G.define('gc_seqMixed', (r) => {
    const u = r.pick(U5.UNITS);
    let figs;
    for (let tries = 0; tries < 50; tries++) {
      const pb = r.int(4, 9),
        ph = r.int(3, 7);
      const tb = r.int(6, 12),
        th = 2 * r.int(2, 5);
      const z2 = r.int(3, 7),
        z1 = z2 + 2 * r.int(1, 3),
        zh = r.int(3, 7);
      figs = [
        { kind: 'parallelogram', html: miniPara(pb, ph, u), A: pb * ph, how: `${pb} × ${ph}` },
        { kind: 'triangle', html: miniTri(tb, th, u), A: (tb * th) / 2, how: `½ × ${tb} × ${th}` },
        { kind: 'trapezoid', html: miniTrap(z1, z2, zh, u), A: ((z1 + z2) * zh) / 2, how: `½ × (${z1} + ${z2}) × ${zh}` },
      ];
      if (new Set(figs.map((f) => f.A)).size === 3 && figs.every((f) => Number.isInteger(f.A))) break;
    }
    const asc = r.chance(0.5);
    const items = figs.map((f) => ({ html: f.html + `<div class="muted">${f.kind}</div>`, rate: f.A }));
    const order = [0, 1, 2].sort((a, b) => (asc ? items[a].rate - items[b].rate : items[b].rate - items[a].rate));
    return {
      type: 'seq',
      skill: 'composite-figures',
      lesson: '5-4',
      title: 'Order mixed figures by area',
      prompt: `<p>Order the three figures from <b>${asc ? 'least' : 'greatest'}</b> area (top) to <b>${asc ? 'greatest' : 'least'}</b> area (bottom). Each figure uses a different formula.</p>`,
      items,
      order,
      reference: true,
      hints: [
        'Parallelogram: b × h. Triangle: ½ × b × h. Trapezoid: ½ × (b₁ + b₂) × h. Compute all three before ordering.',
        `Areas: ${figs.map((f) => `${f.kind} ${f.how} = ${f.A}`).join('; ')}.`,
        `${asc ? 'Smallest' : 'Largest'} first: ${order.map((i) => figs[i].A).join(', ')}.`,
      ],
      solution: `<p>${figs.map((f) => `${f.kind}: ${f.how} = ${f.A} ${sq(u)}`).join('; ')}. From ${asc ? 'least to greatest' : 'greatest to least'}: <b>${order.map((i) => figs[i].kind + ' (' + figs[i].A + ')').join(', ')}</b>. The pictures are not to scale with each other, so only the formulas can tell.</p>`,
      feedback: {
        correct: 'Correct. Three formulas, three areas, one order.',
        wrong() {
          return `Compute first: ${figs.map((f) => `${f.kind} ${f.A}`).join(', ')}. Then put the ${asc ? 'least' : 'greatest'} at the top.`;
        },
      },
    };
  });

  // ---------- Prism built from half-unit cubes (num) ----------
  G.define('gc_volumeTwoFrac', (r) => {
    const u = r.pick(['cm', 'in']);
    const name = r.pick(NAMES);
    let n1 = r.int(2, 6),
      n2 = r.int(2, 5),
      n3 = r.int(2, 6);
    if ((n1 * n2 * n3) % 2) n1 += 1; // keep the volume to at most 2 decimals
    const cubes = n1 * n2 * n3;
    const Vv = round(cubes / 8, 2);
    const l = n1 / 2,
      w = n2 / 2,
      h = n3 / 2;
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
      title: 'Built from half-unit cubes',
      prompt: `<p>${name} builds a solid from small cubes. Each small cube has edges of ${hl('½ ' + u)}. The solid is ${hl(n1 + ' cubes')} long, ${hl(n2 + ' cubes')} wide, and ${hl(n3 + ' cubes')} tall.</p>${svg}<p>What is the volume of the solid in ${cu(u)}?</p>`,
      unit: cu(u),
      answer: Vv,
      reference: true,
      hints: [
        `Each edge of the solid is a number of cubes times ½ ${u}. Find the three edge lengths first.`,
        `Length ${n1} × ½ = ${U5.mixed(l)} ${u}. Width ${n2} × ½ = ${U5.mixed(w)} ${u}. Height ${n3} × ½ = ${U5.mixed(h)} ${u}.`,
        `V = ${fmt(l)} × ${fmt(w)} × ${fmt(h)}. (Or: ${cubes} small cubes, each ½ × ½ × ½ = ⅛ ${cu(u)}.)`,
      ],
      solution: `<p>Edges: ${U5.mixed(l)} ${u}, ${U5.mixed(w)} ${u}, ${U5.mixed(h)} ${u}. V = ${fmt(l)} × ${fmt(w)} × ${fmt(h)} = <b>${fmt(Vv)} ${cu(u)}</b>. Another way: there are ${n1} × ${n2} × ${n3} = ${cubes} small cubes, and each has volume ½ × ½ × ½ = ⅛ ${cu(u)}, so ${cubes} × ⅛ = ${fmt(Vv)}. Counting cubes only gives the volume directly when the cubes are unit cubes.</p>`,
      feedback: {
        correct: `Correct. ${fmt(l)} × ${fmt(w)} × ${fmt(h)} = ${fmt(Vv)} ${cu(u)}, or ${cubes} eighth-cubes.`,
        wrong(ans, d) {
          const v = d.value;
          if (v == null) return `Each edge is the cube count × ½ ${u}. Multiply the three edges.`;
          if (Math.abs(v - cubes) < 0.01) return `${cubes} is the number of small cubes. Each one is only ⅛ ${cu(u)} because its edges are ½ ${u}, not 1 ${u}.`;
          if (Math.abs(v - cubes / 2) < 0.01) return `You halved once, but all three edges are halved: ½ × ½ × ½ = ⅛. Divide ${cubes} by 8.`;
          if (Math.abs(v - cubes / 4) < 0.01) return `You halved twice. Length, width, and height are all in half-units, so divide ${cubes} by 8.`;
          return `Edges ${fmt(l)}, ${fmt(w)}, ${fmt(h)}. Multiply them.`;
        },
      },
    };
  });

  // ---------- Who matched cover vs fill correctly? (who) ----------
  G.define('gc_whoCoverFill', (r) => {
    const u = r.pick(U5.UNITS);
    const l = r.int(3, 8),
      w = r.int(2, 6),
      h = r.int(2, 6);
    const SA = 2 * (l * w + l * h + w * h),
      Vv = l * w * h;
    const [n1, n2, n3] = r.pickN(NAMES, 3);
    const ctx = r.pick([
      ['paint the outside', 'fill it with sand'],
      ['wrap it in paper', 'fill it with water'],
      ['cover it in tiles', 'fill it with soil'],
      ['cover it with fabric', 'fill it with packing foam'],
    ]);
    const sh = shuffleOptions(
      r,
      [
        {
          title: n1,
          html: `To ${ctx[0]}: surface area = 2(${l * w}) + 2(${l * h}) + 2(${w * h}) = <b>${SA} ${sq(u)}</b><br>To ${ctx[1]}: volume = ${l} × ${w} × ${h} = <b>${Vv} ${cu(u)}</b>`,
          ok: true,
        },
        {
          title: n2,
          html: `To ${ctx[0]}: ${l} × ${w} × ${h} = <b>${Vv} ${cu(u)}</b><br>To ${ctx[1]}: 2(${l * w}) + 2(${l * h}) + 2(${w * h}) = <b>${SA} ${sq(u)}</b>`,
          why: `${n2} swapped them. Covering the outside is surface area (${sq(u)}); filling the inside is volume (${cu(u)}).`,
        },
        {
          title: n3,
          html: `To ${ctx[0]}: ${l * w} + ${l * h} + ${w * h} = <b>${l * w + l * h + w * h} ${sq(u)}</b><br>To ${ctx[1]}: ${l} × ${w} × ${h} = <b>${Vv} ${cu(u)}</b>`,
          why: `${n3} chose the right measurements but added only three faces for the surface area. Each face has a twin: ${SA} ${sq(u)}.`,
        },
      ],
      0,
    );
    return {
      type: 'who',
      skill: 'sa-rect-prism',
      lesson: '5-7',
      title: 'Cover it or fill it?',
      prompt: `<p>A box is ${hl(l + ' ' + u)} by ${hl(w + ' ' + u)} by ${hl(h + ' ' + u)}. Three students work out how much is needed to <b>${ctx[0]}</b> and how much to <b>${ctx[1]}</b>.</p>${V.prism({ l, w, h, labels: { l: `${l} ${u}`, w: `${w} ${u}`, h: `${h} ${u}` }, width: 240, height: 180, aria: `Box ${l} by ${w} by ${h} ${u}` })}<p>Who is correct?</p>`,
      options: sh.options,
      answer: sh.answer,
      layout: 'cards',
      hints: [
        'Covering the outside uses surface area (square units). Filling the inside uses volume (cubic units).',
        `Surface area: 2(${l} × ${w}) + 2(${l} × ${h}) + 2(${w} × ${h}) = ${SA}. Volume: ${l} × ${w} × ${h} = ${Vv}.`,
        'Check that all six faces were counted and that the units match the task.',
      ],
      solution: `<p><b>${n1}</b> is correct. To ${ctx[0]} you need the surface area, ${SA} ${sq(u)}; to ${ctx[1]} you need the volume, ${Vv} ${cu(u)}. ${n2} swapped the two measurements. ${n3} forgot that every face has a matching face.</p>`,
      feedback: { correct: `Correct. Surface area covers (${SA} ${sq(u)}); volume fills (${Vv} ${cu(u)}).` },
    };
  });

  // ---------- Missing dimension from surface area: cube edge or pyramid slant (num) ----------
  G.define('gc_slantFromSA', (r) => {
    const u = r.pick(U5.UNITS),
      name = r.pick(NAMES);
    if (r.chance(0.5)) {
      const e = r.int(2, 12),
        SA = 6 * e * e;
      const obj = r.pick(['number cube', 'gift box', 'storage cube', 'puzzle cube', 'ice cube']);
      return {
        type: 'num',
        skill: 'sa-pyramid',
        lesson: '5-7',
        title: 'Edge of a cube from its surface area',
        prompt: `<p>${name} has a cube-shaped ${obj} with a surface area of ${hl(SA + ' ' + sq(u))}. All six faces are identical squares.</p>${V.prism({ l: e, w: e, h: e, labels: { l: `? ${u}`, w: '', h: '' }, width: 220, height: 170, aria: 'A cube with unknown edge length' })}<p>How long is one edge of the cube?</p>`,
        unit: u,
        answer: e,
        reference: true,
        hints: [
          'A cube has 6 identical square faces. First find the area of one face.',
          `One face: ${SA} ÷ 6 = ${e * e} ${sq(u)}.`,
          `A square face with area ${e * e} has edge × edge = ${e * e}. What number times itself is ${e * e}?`,
        ],
        solution: `<p>One face: ${SA} ÷ 6 = ${e * e} ${sq(u)}. The face is a square, so edge × edge = ${e * e}, and the edge is <b>${e} ${u}</b> because ${e} × ${e} = ${e * e}. Check: 6 × ${e * e} = ${SA}.</p>`,
        feedback: {
          correct: `Correct. ${SA} ÷ 6 = ${e * e}, and ${e} × ${e} = ${e * e}.`,
          wrong(ans, d) {
            const v = d.value;
            if (v == null) return 'Divide by 6 for one face, then find the side of that square.';
            if (Math.abs(v - e * e) < 0.01) return `${e * e} is the area of one face, not the edge. The edge is the number that multiplies by itself to give ${e * e}.`;
            if (Math.abs(v - SA / 12) < 0.01) return 'A cube has 6 faces, not 12. Divide the surface area by 6.';
            if (Math.abs(v - SA / 4) < 0.01) return 'A cube has 6 faces. Divide by 6, then find the square’s side.';
            return `One face is ${SA} ÷ 6 = ${e * e}. Find the side of a square with that area.`;
          },
        },
      };
    }
    const [hb, , sl] = r.pick([
      [3, 4, 5],
      [4, 3, 5],
      [6, 8, 10],
      [8, 6, 10],
      [5, 12, 13],
    ]);
    const b = 2 * hb,
      base = b * b,
      lat = 2 * b * sl,
      SA = base + lat;
    return {
      type: 'num',
      skill: 'sa-pyramid',
      lesson: '5-8',
      title: 'Slant height from the surface area',
      prompt: `<p>${name}'s square pyramid has a surface area of ${hl(SA + ' ' + sq(u))}. Its base is a ${hl(b + ' ' + u)} square.</p>${V.pyramid({ b, slant: sl, baseLabel: `${b} ${u}`, slantLabel: `slant ? ${u}`, width: 240, height: 190, aria: `Square pyramid with base ${b} ${u} and unknown slant height` })}<p>What is the slant height of each triangular face?</p>`,
      unit: u,
      answer: sl,
      reference: true,
      hints: [
        'Surface area = base + 4 triangles. Take away the base to find the area of the four triangles.',
        `Base: ${b} × ${b} = ${base}. Four triangles: ${SA} − ${base} = ${lat}. One triangle: ${lat} ÷ 4 = ${lat / 4}.`,
        `One triangle = ½ × ${b} × slant = ${lat / 4}. So ${b / 2} × slant = ${lat / 4}. Divide.`,
      ],
      solution: `<p>Base: ${b} × ${b} = ${base}. Lateral area: ${SA} − ${base} = ${lat}. One triangle: ${lat} ÷ 4 = ${lat / 4}. Since ½ × ${b} × slant = ${lat / 4}, slant = ${lat / 4} ÷ ${b / 2} = <b>${sl} ${u}</b>. Check: ${base} + 4 × (½ × ${b} × ${sl}) = ${SA}.</p>`,
      feedback: {
        correct: `Correct. Strip off the base, split among 4 triangles, then undo ½ × ${b}: slant = ${sl} ${u}.`,
        wrong(ans, d) {
          const v = d.value;
          if (v == null) return 'Subtract the base, divide by 4, then solve ½ × base × slant = one triangle.';
          if (Math.abs(v - lat) < 0.01) return `${lat} is the lateral area (all four triangles). Keep going: ÷ 4, then undo ½ × ${b}.`;
          if (Math.abs(v - lat / 4) < 0.01) return `${lat / 4} is the area of one triangle. Its area is ½ × ${b} × slant, so divide by ${b / 2}.`;
          if (Math.abs(v - SA / (2 * b)) < 0.01) return `You forgot to take away the base first. Lateral area = ${SA} − ${base} = ${lat}.`;
          if (Math.abs(v - lat / 4 / b) < 0.01) return `Remember the ½: one triangle = ½ × ${b} × slant = ${b / 2} × slant. Divide ${lat / 4} by ${b / 2}, not by ${b}.`;
          return `(${SA} − ${base}) ÷ 4 = ${lat / 4}, then ÷ ${b / 2}.`;
        },
      },
    };
  });

  // ---------- Error in a triangular prism net (error) ----------
  G.define('gc_errorTriNet', (r) => {
    const u = r.pick(U5.UNITS),
      name = r.pick(NAMES);
    const [b, h, s] = r.pick([
      [6, 4, 5],
      [8, 3, 5],
      [12, 8, 10],
      [10, 12, 13],
    ]);
    const L = r.int(4, 10);
    const tri = (b * h) / 2,
      rects = L * (b + 2 * s),
      SA = 2 * tri + rects;
    const variant = r.pick(['heightAsSide', 'halfRects']);
    let work, opts;
    if (variant === 'heightAsSide') {
      const wrong = 2 * tri + L * (b + 2 * h);
      work = `Triangles: 2 × (½ × ${b} × ${h}) = ${2 * tri}<br>Rectangles: ${L} × ${b} + ${L} × ${h} + ${L} × ${h} = ${L * (b + 2 * h)}<br>SA = ${wrong} ${sq(u)}`;
      opts = [
        { html: `${name} used the triangle's height (${h}) as the width of the two slanted rectangles. Those rectangles wrap the slanted sides, which are ${s} ${u}.`, ok: true },
        { html: `${name} forgot the ½ on the triangles.`, why: `The triangles are right: 2 × ½ × ${b} × ${h} = ${2 * tri}. The mistake is in the rectangles.` },
        { html: `${name} should have used only two rectangles.`, why: 'A triangular prism has three rectangular faces, one for each side of the triangle. The count is right; the widths are wrong.' },
        { html: `${name}'s work is correct.`, why: `The height ${h} is inside the triangle, not a side of it. The slanted rectangles are ${L} by ${s}.` },
      ];
    } else {
      const wrong = 2 * tri + rects / 2;
      work = `Triangles: 2 × (½ × ${b} × ${h}) = ${2 * tri}<br>Rectangles: ½ × ${L} × (${b} + ${s} + ${s}) = ${rects / 2}<br>SA = ${wrong} ${sq(u)}`;
      opts = [
        { html: `${name} put a ½ on the rectangles. Only triangles use ½ × base × height; a rectangle is length × width.`, ok: true },
        { html: `${name} should have used ½ on the triangles too.`, why: 'The ½ is already on the triangles. The extra ½ on the rectangles is the mistake.' },
        { html: `${name} used the wrong sides for the rectangles.`, why: `${b}, ${s}, and ${s} are the three sides of the triangle, so the rectangle widths are right. The ½ is the problem.` },
        { html: `${name}'s work is correct.`, why: 'The three rectangles are full rectangles. Halving them leaves half the sides uncovered.' },
      ];
    }
    const sh = shuffleOptions(r, opts, 0);
    const svg = U5.triNet(b, h, s, s, L, {
      labels: true,
      u: ' ' + u,
      width: 280,
      heightPx: 210,
      aria: `Net of a triangular prism: rectangles ${L} ${u} long with widths ${b}, ${s}, and ${s} ${u}; triangles with base ${b} ${u} and height ${h} ${u}`,
    });
    return {
      type: 'error',
      skill: 'sa-tri-prism',
      lesson: '5-7',
      title: 'Find the mistake in the net',
      prompt: `<p>${name} found the surface area of a triangular prism ${L} ${u} long. Each triangular end has base ${b} ${u}, height ${h} ${u}, and two slanted sides of ${s} ${u}.</p>${svg}<p>What is wrong with ${name}'s work?</p>`,
      work,
      options: sh.options,
      answer: sh.answer,
      fix: { label: `Correct surface area (${sq(u)}):`, answer: SA },
      hints: [
        'Check the triangles and the rectangles separately. Triangles: ½ × base × height. Rectangles: length × width, with widths equal to the triangle’s sides.',
        variant === 'heightAsSide'
          ? `The triangle's sides are ${b}, ${s}, and ${s}. The height ${h} is not a side, so no rectangle is ${L} by ${h}.`
          : `A rectangle has no ½. The three rectangles are ${L} × ${b}, ${L} × ${s}, ${L} × ${s} = ${rects}.`,
        `Correct: ${2 * tri} + ${L} × (${b} + ${s} + ${s}) = ${2 * tri} + ${rects}.`,
      ],
      solution: `<p>${variant === 'heightAsSide' ? `The two slanted rectangles are ${L} by ${s}, not ${L} by ${h}; the height is measured inside the triangle and is not one of its sides.` : `Rectangles are length × width with no ½; the ½ belongs only to the triangles.`} Correct: triangles ${2 * tri}, rectangles ${L} × (${b} + ${s} + ${s}) = ${rects}, SA = <b>${SA} ${sq(u)}</b>.</p>`,
      feedback: {
        correct: `Correct. ${2 * tri} + ${rects} = ${SA} ${sq(u)}.`,
        wrong(ans, d) {
          if (!d.mistakeOk) return (sh.options[ans.mistake] && sh.options[ans.mistake].why) || 'Check the rectangles line of the work against the net.';
          return `You found the mistake. For the fix: ${2 * tri} + ${L} × (${b} + ${s} + ${s}).`;
        },
      },
    };
  });

  // ---------- Select all figures with the same area (ms) ----------
  G.define('gc_msSameArea', (r) => {
    const u = r.pick(U5.UNITS);
    const T = r.pick([24, 36, 48, 60]);
    const paraPairs = { 24: [6, 4], 36: [9, 4], 48: [8, 6], 60: [10, 6] }[T];
    const triPairs = { 24: [8, 6], 36: [12, 6], 48: [12, 8], 60: [15, 8] }[T];
    const trapSets = { 24: [8, 4, 4], 36: [10, 8, 4], 48: [14, 10, 4], 60: [12, 8, 6] }[T];
    const trapName = `trapezoid, bases ${trapSets[0]} and ${trapSets[1]}, height ${trapSets[2]}`;
    const opts = [
      { html: miniPara(paraPairs[0], paraPairs[1], u) + `<div class="muted">parallelogram, base ${paraPairs[0]}, height ${paraPairs[1]}</div>`, ok: true },
      { html: miniTri(triPairs[0], triPairs[1], u) + `<div class="muted">triangle, base ${triPairs[0]}, height ${triPairs[1]}</div>`, ok: true },
      { html: miniTrap(trapSets[0], trapSets[1], trapSets[2], u) + `<div class="muted">${trapName}</div>`, ok: true },
      { html: miniTri(paraPairs[0], paraPairs[1], u) + `<div class="muted">triangle, base ${paraPairs[0]}, height ${paraPairs[1]}</div>` },
      { html: miniRect(paraPairs[0] + 2, paraPairs[1], u) + `<div class="muted">rectangle, ${paraPairs[0] + 2} by ${paraPairs[1]}</div>` },
    ];
    // slanted-side trap: base × slanted side = T, but the true height is shorter
    const slant = { 24: [6, 4, 3], 36: [9, 4, 3], 48: [8, 6, 5], 60: [10, 6, 5] }[T];
    opts.push({ html: miniPara(slant[0], slant[2], u, slant[1]) + `<div class="muted">parallelogram, base ${slant[0]}, side ${slant[1]}, height ${slant[2]}</div>` });
    const chosen = r
      .shuffle([0, 1, 2])
      .slice(0, 2)
      .concat(r.shuffle([3, 4, 5]).slice(0, 2))
      .sort((a, b) => a - b);
    const picked = chosen.map((i) => opts[i]);
    const correctIdx = picked.map((o, i) => (o.ok ? i : -1)).filter((i) => i >= 0);
    const sh = shuffleOptions(r, picked, correctIdx);
    const areaOf = (i) => {
      if (i === 0) return `${paraPairs[0]} × ${paraPairs[1]} = ${T}`;
      if (i === 1) return `½ × ${triPairs[0]} × ${triPairs[1]} = ${T}`;
      if (i === 2) return `½ × (${trapSets[0]} + ${trapSets[1]}) × ${trapSets[2]} = ${T}`;
      if (i === 3) return `½ × ${paraPairs[0]} × ${paraPairs[1]} = ${T / 2}`;
      if (i === 4) return `${paraPairs[0] + 2} × ${paraPairs[1]} = ${(paraPairs[0] + 2) * paraPairs[1]}`;
      return `${slant[0]} × ${slant[2]} = ${slant[0] * slant[2]} (the side ${slant[1]} is not the height)`;
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
        `Exactly ${correctIdx.length} of the figures equal ${T}.`,
      ],
      solution: `<p>${chosen.map((i) => areaOf(i)).join('; ')}. The figures that equal <b>${T} ${sq(u)}</b> are the ones to select. A triangle needs twice the base × height of a parallelogram to match its area, and a slanted side is never the height.</p>`,
      feedback: {
        correct: `Correct. Each selected figure has an area of exactly ${T} ${sq(u)} by its own formula.`,
        wrong(ans, d) {
          if (d.extra && d.extra.length) {
            const txt = sh.options[d.extra[0]].html;
            if (/side/.test(txt)) return `One figure you chose has a slanted side of ${slant[1]}. Its height is ${slant[2]}, so its area is ${slant[0]} × ${slant[2]} = ${slant[0] * slant[2]}.`;
            if (/triangle, base \d+, height \d+/.test(txt) && !new RegExp(`base ${triPairs[0]}, height ${triPairs[1]}`).test(txt))
              return `A triangle is half of base × height. ½ × ${paraPairs[0]} × ${paraPairs[1]} = ${T / 2}, not ${T}.`;
            return 'One figure you chose does not equal the target. Recompute it with its own formula.';
          }
          return `You missed one. Compute each figure's area; ${correctIdx.length} of them equal ${T}.`;
        },
      },
    };
  });
})(typeof window !== 'undefined' ? window : globalThis);
