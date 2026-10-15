/**
 * Practice Studio activity: dotbalance (lessons 2-8, 2-9, 2-10).
 *
 * A dot plot whose dots the student drags (or nudges with arrow keys). A triangle sits under the beam at the mean,
 * a diamond marks the median, and the readouts update live. The task states CONDITIONS on the final dot
 * positions (many solutions exist), so grade() checks the conditions, never one fixed answer.
 * Goals: mean | median | spread (MAD) | outlier. Level 4 also asks the student to tap the best explanation.
 * Text is stored as "English|Spanish" pairs. Contract: docs/specs/practice-studio-v2.md section 5.
 */
(() => {
  const W = /** @type {any} */ (window);
  const A = W.StudioAct;
  const G = W.StudioGen;
  const EPS = 1e-6;
  const f2 = (n) => G.fmt(n, 2);
  const num = (n) => f2(n).replace("-", "−");
  const sum = (d) => d.reduce((a, b) => a + b, 0);
  const medianOf = (d) => {
    const s = d.slice().sort((a, b) => a - b);
    const m = s.length >> 1;
    return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
  };
  const stats = (d) => {
    const mean = sum(d) / d.length;
    const mad = d.reduce((a, v) => a + Math.abs(v - mean), 0) / d.length;
    const median = medianOf(d);
    return { mean, median, gap: mean - median, range: Math.max(...d) - Math.min(...d), mad };
  };
  const HOLD = {
    "=": (a, v) => Math.abs(a - v) < EPS,
    ">": (a, v) => a > v + EPS,
    ">=": (a, v) => a >= v - EPS,
    "<": (a, v) => a < v - EPS,
    "<=": (a, v) => a <= v + EPS,
  };
  /** A condition on the final dots: measure m, comparison op, value v; keep marks "stays the same". */
  const cd = (m, op, v, keep) => (keep ? { m, op, v, keep: true } : { m, op, v });
  const moved = (spec, d) => d.filter((v, i) => Math.abs(v - spec.model.start[i]) > EPS).length;
  const measure = (spec, d, c) => (c.m === "moved" ? moved(spec, d) : stats(d)[c.m]);

  /* ---- words: every pair is "English|Spanish" --------------------------------------------------- */
  const NAME = {
    mean: "mean|la media|Mean|Media",
    median: "median|la mediana|Median|Mediana",
    range: "range|el rango|Range|Rango",
    mad: "MAD|la DAM|MAD|DAM",
    gap: "mean − median|media − mediana|Mean − median|Media − mediana",
    moved: "dots moved|puntos movidos|Dots moved|Puntos movidos",
  };
  const OPS = {
    ">": "is above|sea mayor que|above|más de",
    ">=": "is at least|sea al menos|at least|al menos",
    "<": "is below|sea menor que|below|menos de",
    "<=": "is at most|sea como máximo|at most|como máximo",
  };
  const clause = (c) => {
    const [en, es] = NAME[c.m].split("|");
    const v = num(c.v);
    const [oe, os] = c.op === "=" ? [] : OPS[c.op].split("|");
    if (c.m === "moved") return ["you move only one dot", "muevas solo un punto"];
    if (c.m === "gap" && c.op === "=")
      return ["the mean equals the median", "la media sea igual a la mediana"];
    if (c.m === "gap") {
      const [e, s] = c.op === ">=" ? ["more", "más"] : ["less", "menos"];
      return [
        `the mean is at least ${num(Math.abs(c.v))} ${e} than the median`,
        `la media sea al menos ${num(Math.abs(c.v))} ${s} que la mediana`,
      ];
    }
    if (c.op !== "=") return [`the ${en} ${oe} ${v}`, `${es} ${os} ${v}`];
    return c.keep
      ? [`the ${en} stays ${v}`, `${es} siga siendo ${v}`]
      : [`the ${en} is ${v}`, `${es} sea ${v}`];
  };
  const joinList = (a, and) => {
    const oxford = and === "and" && a.length > 2 ? "," : "";
    return a.length < 2 ? a.join("") : `${a.slice(0, -1).join(", ")}${oxford} ${and} ${a.at(-1)}`;
  };
  /** Short goal tag on a readout chip. */
  const tag = (c) => {
    const v = num(c.v);
    if (c.m === "gap" && c.op === "=") return ["equal", "igual"];
    if (c.op === "=") return c.keep ? [`keep ${v}`, `mantén ${v}`] : [`goal ${v}`, `meta ${v}`];
    const [, , e, s] = OPS[c.op].split("|");
    return [`${e} ${v}`, `${s} ${v}`];
  };

  const CTX = [
    "books|libros|Each dot is one student. It shows how many books the student read this month.|Cada punto es un estudiante. Muestra cuántos libros leyó este mes.",
    "points|puntos|Each dot is one game. It shows how many points the team scored.|Cada punto es un juego. Muestra cuántos puntos anotó el equipo.",
    "minutes|minutos|Each dot is one day. It shows the minutes Maya practiced piano.|Cada punto es un día. Muestra los minutos que Maya practicó piano.",
    "cm|cm|Each dot is one bean plant. It shows the height of the plant.|Cada punto es una planta de frijol. Muestra la altura de la planta.",
    "goals|goles|Each dot is one player. It shows how many goals the player scored this season.|Cada punto es un jugador. Muestra cuántos goles anotó esta temporada.",
    "dollars|dólares|Each dot is one lemonade stand. It shows the dollars the stand earned.|Cada punto es un puesto de limonada. Muestra los dólares que ganó.",
    "laps|vueltas|Each dot is one runner. It shows how many laps the runner ran in gym class.|Cada punto es un corredor. Muestra cuántas vueltas corrió en educación física.",
    "pages|páginas|Each dot is one student. It shows how many pages the student read last night.|Cada punto es un estudiante. Muestra cuántas páginas leyó anoche.",
  ];
  /** Hint ladders. The last hint never says where a dot goes. */
  const HINTS = {
    mean: [
      "The mean is the balance point, so the triangle slides when you move a dot. It is also the total of the dots divided by the number of dots.|La media es el punto de equilibrio, así que el triángulo se desliza cuando mueves un punto. También es la suma de los puntos dividida entre la cantidad de puntos.",
      "Moving one dot one step to the right raises the total by one step. Count how many steps the total has to change.|Mover un punto un paso a la derecha sube la suma un paso. Cuenta cuántos pasos tiene que cambiar la suma.",
      "Work out the total you need, compare it with the total you have now, and move dots that many steps in all.|Calcula la suma que necesitas, compárala con la que tienes y mueve los puntos esa cantidad de pasos en total.",
    ],
    median: [
      "The median is the middle dot when the dots are in order. Count in from both ends to find it.|La mediana es el punto del medio cuando los puntos están en orden. Cuenta desde ambos extremos para encontrarla.",
      "Moving a dot farther in the same direction does not change the median. Only a dot that crosses the middle can.|Mover un punto más lejos en la misma dirección no cambia la mediana. Solo un punto que cruza el medio la cambia.",
      "Think about which dots control the median and which dots only change the mean.|Piensa qué puntos controlan la mediana y cuáles solo cambian la media.",
    ],
    spread: [
      "MAD is the mean absolute deviation: the average distance of the dots from the mean.|La DAM es la desviación absoluta media: la distancia promedio de los puntos a la media.",
      "Dots far from the mean make the MAD bigger. Dots close to the mean make it smaller.|Los puntos lejos de la media aumentan la DAM. Los puntos cerca de la media la reducen.",
      "Look at the bars under the beam: each one is a dot's distance from the triangle.|Mira las barras debajo de la viga: cada una es la distancia de un punto al triángulo.",
    ],
    outlier: [
      "An outlier is a dot far from the others. Watch what it does to the mean and to the median.|Un valor atípico es un punto lejos de los demás. Mira qué le hace a la media y a la mediana.",
      "The mean uses every dot's distance, so it chases the outlier. The median only cares about the middle.|La media usa la distancia de cada punto, así que sigue al valor atípico. La mediana solo mira el medio.",
      "Slide the dot a little at a time and watch the triangle and the diamond.|Desliza el punto poco a poco y mira el triángulo y el rombo.",
    ],
  };
  const KEEP_HINT = {
    range:
      "Leave the lowest and highest dots alone. Move only the dots between them.|No muevas el punto más bajo ni el más alto. Mueve solo los que están entre ellos.",
    median:
      "The median is the middle dot. A dot can move without changing it if it stays on the same side of the middle.|La mediana es el punto del medio. Un punto puede moverse sin cambiarla si se queda del mismo lado del medio.",
    mean: "To keep the mean in place, when one dot moves left by some steps, another must move right by the same number.|Para mantener la media, si un punto se mueve a la izquierda unos pasos, otro debe moverse a la derecha la misma cantidad.",
  };
  const EXPLAIN = {
    mean: "With {n} dots, a mean of {T} means the total is {T} × {n} = {S}. The triangle is the balance point: the dots on its left and right are the same total distance away.|Con {n} puntos, una media de {T} significa que la suma es {T} × {n} = {S}. El triángulo es el punto de equilibrio: los puntos a su izquierda y a su derecha están a la misma distancia total.",
    median:
      "The median is the middle dot when the dots are in order, so it changes only when a dot moves past the middle. The mean uses every dot, so a far-away dot changes it a lot.|La mediana es el punto del medio cuando los puntos están en orden, así que solo cambia cuando un punto pasa el medio. La media usa todos los puntos, así que un punto lejano la cambia mucho.",
    spread:
      "The MAD is the average distance of the dots from the mean. Dots closer to the mean shrink it and dots farther away grow it. Moving two dots in opposite directions can keep the mean in place.|La DAM es la distancia promedio de los puntos a la media. Los puntos más cerca la reducen y los más lejos la aumentan. Mover dos puntos en direcciones opuestas puede mantener la media.",
    outlier:
      "An outlier pulls the mean toward it, but the median hardly moves. When data has an outlier, the median is usually the better description of a typical value.|Un valor atípico atrae a la media, pero la mediana casi no se mueve. Si los datos tienen un valor atípico, la mediana suele describir mejor un valor típico.",
  };
  /** Level 4 reasoning: "question", the right option, then two wrong options "text|textEs|why it fails|why (Spanish)". */
  const WHY = {
    mean: [
      "Why does the triangle sit at the mean?|¿Por qué el triángulo está en la media?",
      "The distances of the dots on the left add up to the same as the distances of the dots on the right.|Las distancias de los puntos de la izquierda suman lo mismo que las de los puntos de la derecha.",
      "Half of the dots are on each side of it.|La mitad de los puntos está a cada lado.|That describes the median, the middle dot. The mean balances total distance, not the number of dots.|Eso describe la mediana, el punto del medio. La media equilibra la distancia total, no la cantidad de puntos.",
      "It sits on the dot that appears most often.|Está sobre el punto que más se repite.|That is the mode. The mean depends on how far every dot is from the balance point.|Eso es la moda. La media depende de qué tan lejos está cada punto del punto de equilibrio.",
    ],
    median: [
      "You raised the highest dot a lot. Why did the median stay put?|Subiste mucho el punto más alto. ¿Por qué la mediana no se movió?",
      "The median is set by the middle dot, so a far-away dot does not change it.|La mediana depende del punto del medio, así que un punto lejano no la cambia.",
      "The median is the average of all the dots, but a high dot is too far to count.|La mediana es el promedio de todos los puntos, pero un punto alto está muy lejos para contar.|That describes the mean. The median does not use the distance of every dot at all.|Eso describe la media. La mediana no usa la distancia de cada punto.",
      "The median only changes when the lowest dot moves.|La mediana solo cambia cuando se mueve el punto más bajo.|Any dot that moves past the middle changes the median, not only the lowest one.|Cualquier punto que pasa el medio cambia la mediana, no solo el más bajo.",
    ],
    spread: [
      "Why does the MAD change when dots move away from the triangle?|¿Por qué cambia la DAM cuando los puntos se alejan del triángulo?",
      "MAD is the average distance of the dots from the mean, and those distances changed.|La DAM es la distancia promedio de los puntos a la media, y esas distancias cambiaron.",
      "MAD is the distance from the lowest dot to the highest dot.|La DAM es la distancia del punto más bajo al más alto.|That is the range. MAD looks at every dot's distance from the mean.|Eso es el rango. La DAM mira la distancia de cada punto a la media.",
      "MAD is the mean, so it grows when the dots move right.|La DAM es la media, así que sube cuando los puntos se mueven a la derecha.|The mean did not have to move. MAD measures how spread out the dots are, not where they are.|La media no tenía que moverse. La DAM mide qué tan dispersos están los puntos, no dónde están.",
    ],
    outlier: [
      "One dot is far from the others. Which measure better shows a typical value?|Un punto está lejos de los demás. ¿Qué medida muestra mejor un valor típico?",
      "The median, because the far-away dot barely moves it.|La mediana, porque el punto lejano casi no la mueve.",
      "The mean, because it uses every dot and treats them all fairly.|La media, porque usa todos los puntos y los trata a todos igual.|Using every dot is the problem here: the outlier pulls the mean toward itself.|Usar todos los puntos es el problema: el valor atípico atrae a la media.",
      "Neither one, because they are always equal.|Ninguna, porque siempre son iguales.|You just saw them pull apart. They are equal only for some data.|Acabas de verlas separarse. Son iguales solo con algunos datos.",
    ],
  };
  /** Feedback when a condition fails: explains the likely mistake, never a position. {v} value, {t} target. */
  const MSG = {
    "mean-low":
      "The mean is {v}, which is too low. Moving dots to the right raises the total, and the balance point moves right with it.|La media es {v}, que es muy baja. Si mueves puntos a la derecha, la suma sube y el punto de equilibrio se mueve a la derecha.",
    "mean-high":
      "The mean is {v}, which is too high. Moving dots to the left lowers the total, and the balance point moves left with it.|La media es {v}, que es muy alta. Si mueves puntos a la izquierda, la suma baja y el punto de equilibrio se mueve a la izquierda.",
    "mean-changed":
      "The mean moved to {v}, but it has to stay {t}. When one dot moves left by some steps, another dot has to move right by the same number of steps.|La media cambió a {v}, pero tiene que seguir siendo {t}. Si un punto se mueve a la izquierda unos pasos, otro tiene que moverse a la derecha la misma cantidad.",
    median:
      "The median is {v}. It is the middle dot when the dots are in order, so it only changes when a dot crosses the middle. Check which dots are on each side.|La mediana es {v}. Es el punto del medio cuando los puntos están en orden, así que solo cambia cuando un punto cruza el medio. Fíjate qué puntos están a cada lado.",
    "median-changed":
      "The median changed to {v}, but it has to stay {t}. Move dots only on the same side of the middle so none of them crosses it.|La mediana cambió a {v}, pero tiene que seguir siendo {t}. Mueve puntos solo del mismo lado del medio para que ninguno lo cruce.",
    "range-changed":
      "The range is now {v}, but it has to stay {t}. The range is the highest dot minus the lowest dot, so leave those two where they were and move the dots between them.|El rango ahora es {v}, pero tiene que seguir siendo {t}. El rango es el punto más alto menos el más bajo, así que deja esos dos donde estaban y mueve los de en medio.",
    "mad-low":
      "The MAD is {v}, which is too small. MAD is the average distance of the dots from the mean, so dots farther from the triangle make it grow.|La DAM es {v}, que es muy pequeña. La DAM es la distancia promedio de los puntos a la media, así que los puntos más lejos del triángulo la aumentan.",
    "mad-high":
      "The MAD is {v}, which is too big. Dots closer to the triangle make every distance shorter, so the MAD shrinks.|La DAM es {v}, que es muy grande. Los puntos más cerca del triángulo acortan cada distancia, así que la DAM se reduce.",
    "gap-eq":
      "The mean is {a} and the median is {b}, so they are not equal yet. Think about which dot is pulling the mean away from the middle.|La media es {a} y la mediana es {b}, así que todavía no son iguales. Piensa qué punto aleja a la media del medio.",
    "moved-too-many":
      "You moved {v} dots, but this task allows only {t}. Press Start over or put the extra dots back where they began.|Moviste {v} puntos, pero esta tarea permite solo {t}. Pulsa Empezar de nuevo o devuelve los puntos extra a su lugar.",
    locked:
      "Only the gold dot can move. Put the locked dots back where they were.|Solo el punto dorado se puede mover. Devuelve los puntos bloqueados a su lugar.",
    invalid:
      "Something is off with the dots. Press Start over and try again.|Algo no está bien con los puntos. Pulsa Empezar de nuevo e inténtalo otra vez.",
    "why-missing":
      "The dots are right. Now tap the sentence that explains what you saw.|Los puntos están bien. Ahora toca la oración que explica lo que viste.",
  };
  const fill = (s, o) => s.replace(/\{(\w+)\}/g, (_, k) => o[k]).split("|");
  const no = (tg, o = {}) => {
    const [say, sayEs] = fill(MSG[tg] || MSG.median, o);
    return { ok: false, tag: tg, say, sayEs };
  };

  /* ---- building a puzzle -------------------------------------------------------------------------- */
  const LEVELS = [
    null,
    { n: 5, lo: 0, hi: 10, step: 1 },
    { n: 6, lo: 0, hi: 10, step: 1 },
    { n: 7, lo: 0, hi: 12, step: 1 },
    { n: 8, lo: 0, hi: 12, step: 0.5 },
  ];
  const clampTo = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  const order = (d) => d.map((_, i) => i).sort((a, b) => d[a] - d[b] || a - b);
  /** n values on the step grid, a little clustered so the plot looks like real data. */
  const randData = (rng, P) => {
    const k = Math.round((P.hi - P.lo) / P.step);
    return Array.from({ length: P.n }, () => {
      return P.lo + Math.round((rng.int(0, k) + rng.int(0, k)) / 2) * P.step;
    });
  };
  /** Which dots may move, and between which values, so the chosen measures cannot change. */
  const room = (d, keep, P) => {
    const ord = order(d);
    const n = d.length;
    const bnd = d.map(() => [P.lo, P.hi]);
    let free = ord.slice();
    if (keep.range) {
      free = free.filter((i) => i !== ord[0] && i !== ord[n - 1]);
      for (const i of free) bnd[i] = [d[ord[0]], d[ord[n - 1]]];
    }
    if (keep.median) {
      const mid = n % 2 ? [ord[n >> 1]] : [ord[n / 2 - 1], ord[n / 2]];
      free = free.filter((i) => !mid.includes(i));
      for (const i of free) {
        const lowSide = ord.indexOf(i) < ord.indexOf(mid[0]);
        if (lowSide) bnd[i][1] = Math.min(bnd[i][1], d[mid[0]]);
        else bnd[i][0] = Math.max(bnd[i][0], d[mid.at(-1)]);
      }
    }
    return { free, bnd };
  };
  /** Shift the dots at idx by whole steps, at random, until their total is `goal`; null if they run out of room. */
  const fit = (rng, d, idx, goal, bnd, step) => {
    const out = d.slice();
    for (let g = 0; g < 600; g++) {
      const need = goal - sum(out);
      if (Math.abs(need) < EPS) return out;
      const s = need > 0 ? step : -step;
      const ok = idx.filter((i) => out[i] + s >= bnd[i][0] - EPS && out[i] + s <= bnd[i][1] + EPS);
      if (!ok.length) return null;
      out[rng.pick(ok)] += s;
    }
    return null;
  };
  /** Every single-dot move whose result satisfies test(). */
  const oneMoves = (d, P, test) => {
    const out = [];
    const k = Math.round((P.hi - P.lo) / P.step);
    for (let i = 0; i < d.length; i++) {
      for (let j = 0; j <= k; j++) {
        const e = d.slice();
        e[i] = P.lo + j * P.step;
        if (Math.abs(e[i] - d[i]) > EPS && test(e)) out.push({ i, v: e[i] });
      }
    }
    return out;
  };

  const meanPuzzle = (rng, lv, P) => {
    const keep = { range: lv % 2 === 0, median: lv >= 3 };
    const u = P.step === 1 ? 1 : 0.5;
    for (let t = 0; t < 500; t++) {
      const start = randData(rng, P);
      const s = stats(start);
      const T = Math.round((s.mean + (rng.chance(0.5) ? 1 : -1) * (1 + rng.next() * 1.5)) / u) * u;
      const { free, bnd } = room(start, keep, P);
      const sol = free.length > 1 && fit(rng, start, free, P.n * T, bnd, P.step);
      if (!sol || Math.abs(T - s.mean) < 0.75 || T < P.lo + 2 || T > P.hi - 2) continue;
      if (keep.range && s.range < (P.hi - P.lo) / 2) continue;
      const conds = [cd("mean", "=", T)];
      if (keep.range) conds.push(cd("range", "=", s.range, 1));
      if (keep.median) conds.push(cd("median", "=", s.median, 1));
      return { start, sol, conds, T };
    }
    throw new Error("dotbalance: no mean puzzle");
  };

  /** Median M, mean above K. Fixing only the median dot drops the mean to K or below, so another dot must rise. */
  const skewMedian = (rng, P) => {
    const M = rng.int(3, 5);
    const low = [0, 1, 2].map(() => rng.int(0, M));
    const up = [0, 1, 2].map(() => rng.int(M + 4, P.hi));
    const sol = rng.shuffle([...low, M, ...up]);
    const K = Math.floor(sum(sol) / P.n);
    const e = sum(sol) - P.n * K;
    const ord = order(sol);
    const start = sol.slice();
    start[ord[3]] = M + rng.int(3, 5);
    start[ord[6]] -= e + rng.int(0, 1);
    const naive = start.slice();
    naive[ord[3]] = M;
    const ok = e >= 1 && e <= 3 && K > M && stats(start).mean > K && stats(naive).mean <= K;
    return ok ? { start, sol, conds: [cd("median", "=", M), cd("mean", ">", K)], T: M } : null;
  };
  const medianPuzzle = (rng, lv, P) => {
    for (let t = 0; t < 600; t++) {
      if (lv === 3) {
        const r = skewMedian(rng, P);
        if (r) return r;
        continue;
      }
      const base = randData(rng, P);
      const s = stats(base);
      const ord = order(base);
      const mid = P.n % 2 ? [ord[P.n >> 1]] : [ord[P.n / 2 - 1], ord[P.n / 2]];
      const conds = [cd("median", "=", s.median)];
      let sol = base;
      if (lv === 4) {
        const T = Math.round(s.mean * 2) / 2;
        const { free, bnd } = room(base, { median: true }, P);
        sol = fit(rng, base, free, P.n * T, bnd, P.step);
        conds.push(cd("mean", "=", T));
      }
      if (lv === 2) conds.push(cd("range", "=", s.range, 1));
      if (!sol) continue;
      const start = sol.slice();
      const dir = rng.chance(0.5) ? 1 : -1;
      const [lo, hi] = lv === 2 ? [Math.min(...base), Math.max(...base)] : [P.lo, P.hi];
      for (const i of mid) start[i] = clampTo(start[i] + dir * rng.int(2, 4), lo, hi);
      const same = Math.abs(medianOf(start) - s.median) < EPS;
      if (same || (lv === 2 && stats(start).range !== s.range)) continue;
      return { start, sol, conds, T: s.median };
    }
    throw new Error("dotbalance: no median puzzle");
  };

  /** Pairs of dots at T plus and minus each width: the mean is T however wide the pairs are. */
  const around = (rng, T, widths) => rng.shuffle(widths.flatMap((w) => [T + w, T - w]));
  const spreadPuzzle = (rng, lv, P) => {
    for (let t = 0; t < 800; t++) {
      const T = lv === 4 ? rng.int(5, 7) : rng.int(4, 6);
      const w = () => rng.int(2, 4);
      let start;
      let sol;
      let X;
      let conds;
      if (lv === 1) {
        sol = Array.from({ length: P.n }, () => T + rng.int(-1, 1));
        start = Array.from({ length: P.n }, () => T + rng.pick([-1, 1]) * w());
        X = Math.ceil(stats(sol).mad * 2) / 2;
        conds = [cd("mad", "<=", X)];
      } else if (lv === 2) {
        start = around(rng, T, [rng.int(0, 2), rng.int(0, 2), 0]);
        sol = around(rng, T, [w(), w(), w()]);
        X = Math.floor(stats(sol).mad * 2) / 2;
        conds = [cd("mean", "=", T, 1), cd("mad", ">=", X)];
      } else if (lv === 3) {
        const dev = Array.from({ length: P.n - 1 }, () => rng.int(-4, 4));
        const near = Array.from({ length: P.n - 1 }, () => rng.int(-1, 1));
        sol = [...dev, -sum(dev)].map((x) => T + x);
        start = [...near, -sum(near)].map((x) => T + x);
        X = stats(sol).mad;
        if (X % 1 || X < 1 || X > 3 || [...sol, ...start].some((v) => v < P.lo || v > P.hi))
          continue;
        conds = [cd("mean", "=", T, 1), cd("mad", "=", X)];
      } else {
        const lowE = T - rng.int(3, 5);
        const highE = T + rng.int(3, 5);
        const bnd = Array.from({ length: P.n }, () => [lowE, highE]);
        const inner = Array.from({ length: P.n - 2 }, (_, i) => i + 1);
        const make = (f) => fit(rng, [lowE, ...inner.map(f), highE], inner, P.n * T, bnd, P.step);
        sol = make(() => T);
        start = make((i) => (i % 2 ? highE : lowE));
        if (!sol || !start) continue;
        X = Math.ceil(stats(sol).mad * 2) / 2;
        conds = [cd("mean", "=", T, 1), cd("range", "=", highE - lowE, 1), cd("mad", "<=", X)];
      }
      if (Math.abs(stats(start).mad - X) < 0.7) continue;
      return { start, sol, conds, T: X };
    }
    throw new Error("dotbalance: no spread puzzle");
  };

  /** Outlier: move the far dot until the mean equals the median. Level 1 locks the others; later levels allow ONE move. */
  const outlierPuzzle = (rng, lv, P) => {
    for (let t = 0; t < 1500; t++) {
      const c = rng.int(3, P.hi - 3);
      const base = Array.from({ length: P.n - 1 }, () => clampTo(c + rng.int(-3, 3), P.lo, P.hi));
      const far = rng.int(P.hi - 2, P.hi);
      const start = rng.shuffle([...base, far]);
      const out = start.indexOf(far);
      const hits = oneMoves(start, P, (e) => Math.abs(stats(e).gap) < EPS);
      const hit = hits.find((h) => h.i === out);
      if (!hit || Math.abs(stats(start).gap) < 1 || hits.length > 6) continue;
      const fl = rng.chance(0.5) ? (v) => P.lo + P.hi - v : (v) => v;
      const sol = start.map((v, i) => fl(i === out ? hit.v : v));
      const conds = lv === 1 ? [cd("gap", "=", 0)] : [cd("gap", "=", 0), cd("moved", "<=", 1)];
      const locked = lv === 1 ? start.map((_, i) => i).filter((i) => i !== out) : [];
      return { start: start.map(fl), sol, conds, locked, free: out, T: 0 };
    }
    throw new Error("dotbalance: no outlier puzzle");
  };

  const BUILD = {
    mean: meanPuzzle,
    median: medianPuzzle,
    spread: spreadPuzzle,
    outlier: outlierPuzzle,
  };
  const SHOW = {
    mean: ["mean"],
    median: ["median", "mean"],
    spread: ["mean", "mad"],
    outlier: ["mean", "median"],
  };
  const SHOW_ORDER = ["mean", "median", "gap", "range", "mad", "moved"];

  /* ---- grading ----------------------------------------------------------------------------------- */
  const tagOf = (c, val) => {
    if (c.m === "moved") return "moved-too-many";
    if (c.keep) return `${c.m}-changed`;
    if (c.m === "gap") return "gap-eq";
    const low = c.op === "=" ? val < c.v : c.op[0] === ">";
    return `${c.m}-${low ? "low" : "high"}`;
  };
  const grade = (spec, state) => {
    const M = spec.model;
    const d = state && Array.isArray(state.dots) ? state.dots : [];
    const onGrid = (v) => {
      const k = (v - M.lo) / M.step;
      return (
        Number.isFinite(v) &&
        v >= M.lo - EPS &&
        v <= M.hi + EPS &&
        Math.abs(k - Math.round(k)) < EPS
      );
    };
    if (d.length !== M.start.length || !d.every(onGrid)) return no("invalid");
    if (M.locked.some((i) => Math.abs(d[i] - M.start[i]) > EPS)) return no("locked");
    const st = stats(d);
    for (const c of spec.conds) {
      const val = measure(spec, d, c);
      if (!HOLD[c.op](val, c.v))
        return no(tagOf(c, val), { v: f2(val), t: f2(c.v), a: f2(st.mean), b: f2(st.median) });
    }
    if (spec.why) {
      const o = spec.why.opts[state.why];
      if (!o) return no("why-missing");
      if (state.why !== spec.why.a)
        return { ok: false, tag: `why-${o.id}`, say: o.f, sayEs: o.fEs };
    }
    return { ok: true };
  };

  A.register("dotbalance", {
    title: "Balance the dots",
    titleEs: "Equilibra los puntos",
    levels: 4,
    make(rng, level, params) {
      const goal =
        params.goal ||
        (level < 3 ? "mean" : level === 3 ? "median" : rng.pick(["spread", "outlier"]));
      const P = LEVELS[level];
      const pz = /** @type {any} */ (BUILD[goal](rng, level, P));
      const [unit, unitEs, cap, capEs] = rng.pick(CTX).split("|");
      const cl = pz.conds.map(clause);
      const lock = pz.locked?.length
        ? ["Only the gold dot can move. ", "Solo el punto dorado se puede mover. "]
        : ["", ""];
      const hints = HINTS[goal].map((s) => s.split("|"));
      for (const m of ["range", "mean", "median"]) {
        const kept = pz.conds.some((c) => c.m === m && c.keep);
        if (!kept) continue;
        const [e, s] = KEEP_HINT[m].split("|");
        hints[1] = [`${hints[1][0]} ${e}`, `${hints[1][1]} ${s}`];
      }
      const vars = { n: P.n, T: f2(pz.T), S: f2(pz.T * P.n) };
      const [x, xEs] = fill(EXPLAIN[goal], vars);
      let why;
      if (level === 4) {
        const w = WHY[goal];
        const opts = rng.shuffle([w[1], w[2], w[3]].map((s, k) => ({ id: k, s }))).map((o) => {
          const [t, tEs, f = "", fEs = ""] = o.s.split("|");
          return { id: o.id, t, tEs, f, fEs };
        });
        const [q, qEs] = w[0].split("|");
        why = { q, qEs, opts, a: opts.findIndex((o) => o.id === 0) };
      }
      const shown = new Set([...SHOW[goal], ...pz.conds.map((c) => c.m)]);
      return {
        q: `${cap} ${lock[0]}Move the dots so that ${joinList(
          cl.map((c) => c[0]),
          "and",
        )}.`,
        qEs: `${capEs} ${lock[1]}Mueve los puntos para que ${joinList(
          cl.map((c) => c[1]),
          "y",
        )}.`,
        x,
        xEs,
        h: hints.map((h) => h[0]),
        hEs: hints.map((h) => h[1]),
        goal,
        model: {
          ...P,
          start: pz.start,
          locked: pz.locked || [],
          free: pz.locked?.length ? pz.free : -1,
          show: SHOW_ORDER.filter((m) => shown.has(m)),
          dist: goal === "spread" || (goal === "mean" && level === 4),
          cap,
          capEs,
          unit,
          unitEs,
        },
        conds: pz.conds,
        sol: pz.sol,
        why,
      };
    },
    solution: (spec) => ({ dots: spec.sol.slice(), why: spec.why ? spec.why.a : null }),
    wrong(spec, rng) {
      const M = spec.model;
      const right = spec.why ? spec.why.a : null;
      const out = [];
      const add = (s) => grade(spec, s).ok || out.push(s);
      add({ dots: M.start.slice(), why: right });
      if (spec.why) add({ dots: spec.sol.slice(), why: (right + 1 + rng.int(0, 1)) % 3 });
      if (spec.why) add({ dots: spec.sol.slice(), why: null });
      const free = spec.sol.map((_, i) => i).filter((i) => !M.locked.includes(i));
      for (let t = 0; t < 60 && out.length < 4; t++) {
        const dots = spec.sol.slice();
        const i = rng.pick(free);
        dots[i] = clampTo(
          dots[i] + (rng.chance(0.5) ? 1 : -1) * M.step * rng.int(1, 3),
          M.lo,
          M.hi,
        );
        add({ dots, why: right });
      }
      return out;
    },
    grade,
    mount: (host, spec, api) => mountDots(host, spec, api),
  });

  /* ---- the widget ---------------------------------------------------------------------------------- */
  const CSS = `
.db-root{display:grid;gap:12px;color:var(--ink,#1B2733);font:inherit}
.db-cap{margin:0;font-size:.92rem;opacity:.85}
.db-stage{background:var(--surface,#fff);border:2px solid var(--border,#D5DCE5);border-radius:var(--radius-md,14px);padding:6px 2px 2px;overflow:hidden}
.db-svg{display:block;width:100%;height:auto;touch-action:pan-y;user-select:none;-webkit-user-select:none}
.db-beam{fill:var(--brand,#2C4A68)}
.db-tick{fill:var(--surface,#fff);font:700 13px system-ui,sans-serif;text-anchor:middle}
.db-minor{stroke:var(--surface,#fff);stroke-width:2;opacity:.7}
.db-gm{stroke:var(--ink,#1B2733);stroke-width:2;stroke-dasharray:2 4;opacity:.55}
.db-gd{stroke:var(--brand,#2C4A68);stroke-width:2;stroke-dasharray:6 4;opacity:.7}
.db-ful path{fill:var(--ink,#1B2733)}
.db-med path{fill:var(--surface,#fff);stroke:var(--brand,#2C4A68);stroke-width:3}
.db-lab{fill:var(--ink,#1B2733);font:700 13px system-ui,sans-serif}
.db-dot{cursor:grab;outline:none}
.db-fill{fill:var(--sun,#F0BD4F);stroke:var(--ink,#1B2733);stroke-width:2}
.db-ring{fill:none;stroke:var(--brand,#2C4A68);stroke-width:4;opacity:0}
.db-dot.is-sel .db-ring{opacity:1}
.db-dot:focus-visible .db-ring{opacity:1;stroke:var(--ink,#1B2733);stroke-dasharray:5 3}
.db-dot.is-lock{cursor:not-allowed}
.db-dot.is-lock .db-fill{fill:var(--surface,#fff);stroke-dasharray:4 3}
.db-dot.is-lock .db-lock{display:block}
.db-lock{display:none;fill:none;stroke:var(--ink,#1B2733);stroke-width:2}
.db-dot.is-free .db-fill{stroke-width:3.5}
.db-bar{stroke:var(--brand,#2C4A68);stroke-width:4;stroke-linecap:round}
.db-dm{fill:var(--sun,#F0BD4F);stroke:var(--ink,#1B2733);stroke-width:1.5}
.db-dl{fill:var(--ink,#1B2733);font:600 11px system-ui,sans-serif}
.db-axis{margin:0;text-align:center;font-size:.85rem;opacity:.8}
.db-pad{display:flex;flex-wrap:wrap;align-items:center;justify-content:center;gap:10px}
.db-sel{min-width:9.5em;text-align:center;font-weight:700}
.db-btn{appearance:none;font:inherit;font-weight:800;cursor:pointer;min-height:48px;min-width:48px;padding:6px 16px;border-radius:var(--radius-md,14px);border:2px solid var(--brand,#2C4A68);border-bottom-width:4px;background:var(--surface,#fff);color:var(--ink,#1B2733)}
.db-btn:hover:not(:disabled){background:var(--brand-tint,#E5ECF3)}
.db-btn:disabled{opacity:.45;cursor:not-allowed}
.db-go .es-text{color:inherit}
.db-go{background:var(--brand,#2C4A68);color:var(--surface,#fff)}
.db-go:hover:not(:disabled){background:var(--brand,#2C4A68);filter:brightness(1.12)}
.db-btn:focus-visible,.db-opt:focus-visible{outline:4px solid var(--sun,#F0BD4F);outline-offset:2px}
.db-chips{display:flex;flex-wrap:wrap;gap:8px}
.db-chip{flex:1 1 7.5em;display:grid;gap:1px;padding:8px 12px;border:2px solid var(--brand-line,#BBCADA);border-radius:var(--radius-md,14px);background:var(--brand-tint,#E5ECF3)}
.db-chip b{font-size:.82rem}
.db-chip output{font-size:1.45rem;font-weight:800;line-height:1.1}
.db-chip small{font-size:.78rem;opacity:.85}
.db-chip.is-ok{border-color:var(--ok,#0A7D4B);box-shadow:inset 0 0 0 1px var(--ok,#0A7D4B)}
.db-chip.is-ok small::before{content:"\\2713 ";color:var(--ok,#0A7D4B);font-weight:800}
.db-why{border:2px solid var(--border,#D5DCE5);border-radius:var(--radius-md,14px);padding:10px 12px;display:grid;gap:8px}
.db-why legend{font-weight:800;padding:0 6px}
.db-opts{display:grid;gap:8px}
.db-opt{appearance:none;font:inherit;text-align:left;cursor:pointer;min-height:48px;padding:8px 12px;border-radius:var(--radius-md,14px);border:2px solid var(--border,#D5DCE5);background:var(--surface,#fff);color:var(--ink,#1B2733)}
.db-opt[aria-checked="true"]{border-color:var(--brand,#2C4A68);background:var(--brand-tint,#E5ECF3);font-weight:700}
.db-act{display:flex;flex-wrap:wrap;gap:10px}
.db-dist{margin:0;font-size:.9rem}
.is-ro .db-dot{cursor:default}
@media (prefers-reduced-motion:no-preference){.db-ful,.db-med,.db-gm,.db-gd,.db-dot{transition:transform .18s ease}.db-dot.is-drag{transition:none}}
@media (forced-colors:active){.db-beam,.db-fill{fill:Highlight}.db-tick{fill:HighlightText}.db-btn,.db-chip,.db-opt{border-color:ButtonText}}
`;

  function mountDots(host, spec, api) {
    A.css("dotbalance", CSS);
    const M = spec.model;
    const n = M.start.length;
    const ro = !!api.solved;
    const L = (en, es) => (api.es?.() ? es : en);
    const B = (en, es) => A.t(en, es);
    const h = (tg, cls = "", html = "", at = {}) => /** @type {any} */ (A.el(tg, cls, html, at));
    const S = (tg, at = {}, parent = null) => {
      const e = /** @type {any} */ (document.createElementNS("http://www.w3.org/2000/svg", tg));
      for (const k of Object.keys(at)) e.setAttribute(k, String(at[k]));
      parent?.append(e);
      return e;
    };
    const saved = api.restore?.dots?.length === n ? api.restore : null;
    let dots = saved ? saved.dots.slice() : M.start.slice();
    let why = Number.isInteger(saved?.why) ? saved.why : null;
    const locked = new Set(M.locked);
    let sel = Math.max(
      0,
      dots.findIndex((_, i) => !locked.has(i)),
    );
    const seq = dots.map((_, i) => i);
    let tick = n;
    let drag = -1;
    const state = () => ({ dots: dots.slice(), why });
    const condBy = {};
    for (const c of spec.conds) condBy[c.m] = c;

    host.textContent = "";
    const root = h("div", `db-root${ro ? " is-ro" : ""}`);
    const stage = h("div", "db-stage");
    host.append(root);
    root.append(stage);
    root.append(
      h(
        "p",
        "db-axis",
        B(`Dots are measured in ${M.unit}.`, `Los puntos se miden en ${M.unitEs}.`),
      ),
    );

    /* geometry: the SVG is built at its real pixel width so touch targets stay real pixels */
    const R = 11;
    const PADX = 26;
    const ROWS = n > 6 ? 5 : 4;
    const GAP = 24;
    const Y_BEAM = 44 + ROWS * GAP + 8;
    let svg = null;
    let W0 = 0;
    let refs = {};
    const X = (v) => PADX + ((v - M.lo) / (M.hi - M.lo)) * (W0 - 2 * PADX);
    const vAt = (px) => M.lo + ((px - PADX) / (W0 - 2 * PADX)) * (M.hi - M.lo);
    const build = () => {
      W0 = Math.max(300, Math.round(stage.clientWidth || host.clientWidth || 600));
      const H = Y_BEAM + 78 + (M.dist ? n * 17 + 12 : 0);
      stage.textContent = "";
      svg = S(
        "svg",
        { class: "db-svg", viewBox: `0 0 ${W0} ${H}`, width: W0, height: H, role: "group" },
        stage,
      );
      svg.setAttribute(
        "aria-label",
        L("Dot plot with a balance beam", "Diagrama de puntos con una viga de equilibrio"),
      );
      S("rect", { class: "db-beam", x: 6, y: Y_BEAM, width: W0 - 12, height: 26, rx: 8 }, svg);
      for (let j = 0; j <= Math.round((M.hi - M.lo) / M.step); j++) {
        const v = M.lo + j * M.step;
        if (Number.isInteger(v))
          S("text", { class: "db-tick", x: X(v), y: Y_BEAM + 18 }, svg).textContent = String(v);
        else
          S("line", { class: "db-minor", x1: X(v), x2: X(v), y1: Y_BEAM + 2, y2: Y_BEAM + 8 }, svg);
      }
      refs = { dot: [], pos: [] };
      refs.gm = S("line", { class: "db-gm", x1: 0, x2: 0, y1: 30, y2: Y_BEAM }, svg);
      refs.gd = S("line", { class: "db-gd", x1: 0, x2: 0, y1: 30, y2: Y_BEAM }, svg);
      refs.med = S("g", { class: "db-med" }, svg);
      S("path", { d: "M0,-8 L8,0 L0,8 L-8,0 Z" }, refs.med);
      refs.medT = S("text", { class: "db-lab", y: -14 }, refs.med);
      refs.ful = S("g", { class: "db-ful" }, svg);
      S("path", { d: `M0,${Y_BEAM + 27} L15,${Y_BEAM + 53} L-15,${Y_BEAM + 53} Z` }, refs.ful);
      refs.fulT = S("text", { class: "db-lab", y: Y_BEAM + 72 }, refs.ful);
      refs.dist = S("g", {}, svg);
      dots.forEach((_, i) => {
        const g = S(
          "g",
          { class: `db-dot${locked.has(i) ? " is-lock" : ""}${M.free === i ? " is-free" : ""}` },
          svg,
        );
        S("circle", { class: "db-ring", r: R + 5 }, g);
        S("circle", { class: "db-fill", r: R }, g);
        S(
          "path",
          { class: "db-lock", d: "M-3,-1 V-3 A3,3 0 0 1 3,-3 V-1 M-4.5,-1 H4.5 V5 H-4.5 Z" },
          g,
        );
        const live = !ro && !locked.has(i);
        g.setAttribute("role", live ? "slider" : "img");
        if (live) {
          const at = {
            tabindex: 0,
            "aria-orientation": "horizontal",
            "aria-valuemin": M.lo,
            "aria-valuemax": M.hi,
          };
          for (const k of Object.keys(at)) g.setAttribute(k, String(at[k]));
          g.addEventListener("keydown", (e) => key(i, e));
          g.addEventListener("focus", () => {
            sel = i;
            paint();
          });
        }
        refs.dot.push(g);
      });
      paint();
    };

    /* readouts and controls */
    const chips = h("div", "db-chips");
    const chipEl = {};
    for (const m of M.show) {
      const [, , en, es] = NAME[m].split("|");
      chipEl[m] = h("div", "db-chip", `<b>${B(en, es)}</b><output></output><small></small>`);
      chips.append(chipEl[m]);
    }
    const pad = h("div", "db-pad");
    const left = h("button", "db-btn", "◀", { type: "button" });
    const right = h("button", "db-btn", "▶", { type: "button" });
    const selTxt = h("span", "db-sel");
    const distNote = h("p", "db-dist");
    pad.append(left, selTxt, right);
    root.append(pad, chips, distNote);

    const setDot = (i, v) => {
      const nv = clampTo(M.lo + Math.round((v - M.lo) / M.step) * M.step, M.lo, M.hi);
      if (locked.has(i) || Math.abs(nv - dots[i]) < EPS) return false;
      dots[i] = nv;
      return true;
    };
    const commit = (i) => {
      const st = stats(dots);
      seq[i] = ++tick;
      paint();
      api.change?.(state());
      api.say?.(
        L(
          `Dot ${i + 1} is at ${f2(dots[i])}. Mean ${f2(st.mean)}. Median ${f2(st.median)}.`,
          `El punto ${i + 1} está en ${f2(dots[i])}. Media ${f2(st.mean)}. Mediana ${f2(st.median)}.`,
        ),
      );
    };
    const nudge = (i, v) => setDot(i, v) && commit(i);
    const key = (i, e) => {
      const s = M.step;
      const to = {
        ArrowLeft: dots[i] - s,
        ArrowDown: dots[i] - s,
        ArrowRight: dots[i] + s,
        ArrowUp: dots[i] + s,
        Home: M.lo,
        End: M.hi,
        PageDown: dots[i] - 4 * s,
        PageUp: dots[i] + 4 * s,
      }[e.key];
      if (to === undefined) return;
      e.preventDefault();
      nudge(i, to);
    };
    left.addEventListener("click", () => nudge(sel, dots[sel] - M.step));
    right.addEventListener("click", () => nudge(sel, dots[sel] + M.step));

    /* pointer: grab the nearest dot, drag to snap; tapping the beam sends the selected dot there */
    const pointer = (e) => {
      const r = svg.getBoundingClientRect();
      return { x: e.clientX - r.left, y: e.clientY - r.top };
    };
    const nearest = (p) => {
      let best = -1;
      let bd = 30;
      dots.forEach((_, i) => {
        const d = Math.hypot(refs.pos[i].x - p.x, refs.pos[i].y - p.y);
        if (d < bd || (d === bd && best >= 0 && seq[i] > seq[best])) [best, bd] = [i, d];
      });
      return best;
    };
    if (!ro) {
      stage.addEventListener("pointerdown", (e) => {
        const p = pointer(e);
        const i = nearest(p);
        if (i >= 0 && locked.has(i))
          return api.say?.(L("That dot is locked.", "Ese punto está bloqueado."));
        if (i >= 0) {
          [sel, drag] = [i, i];
          refs.dot[i].classList.add("is-drag");
          stage.setPointerCapture?.(e.pointerId);
          paint();
        } else if (p.y > Y_BEAM - 8 && p.y < Y_BEAM + 34) nudge(sel, vAt(p.x));
      });
      stage.addEventListener(
        "pointermove",
        (e) => drag >= 0 && setDot(drag, vAt(pointer(e).x)) && paint(),
      );
      const end = () => {
        if (drag < 0) return;
        const i = drag;
        drag = -1;
        refs.dot[i].classList.remove("is-drag");
        commit(i);
      };
      stage.addEventListener("pointerup", end);
      stage.addEventListener("pointercancel", end);
    }

    /* painting: positions, labels, readouts */
    const paint = () => {
      const st = stats(dots);
      const count = {};
      for (const v of dots) count[v] = (count[v] || 0) + 1;
      const gap = (ROWS * GAP) / Math.max(ROWS, ...Object.values(count));
      const level = {};
      for (const i of dots.map((_, k) => k).sort((a, b) => seq[a] - seq[b])) {
        const k = (level[dots[i]] = (level[dots[i]] ?? -1) + 1);
        const p = { x: X(dots[i]), y: i === drag ? 30 : Y_BEAM - 4 - R - k * gap };
        refs.pos[i] = p;
        const g = refs.dot[i];
        g.style.transform = `translate(${p.x}px,${p.y}px)`;
        g.classList.toggle("is-sel", i === sel && !ro);
        const name = L(`Dot ${i + 1} of ${n}`, `Punto ${i + 1} de ${n}`);
        const lk = locked.has(i) ? L(", locked", ", bloqueado") : "";
        g.setAttribute(
          "aria-label",
          g.getAttribute("role") === "slider" ? name : `${name}, ${f2(dots[i])}${lk}`,
        );
        g.setAttribute("aria-valuenow", String(dots[i]));
        g.setAttribute("aria-valuetext", f2(dots[i]));
      }
      const anchor = (x) => (x < 60 ? "start" : x > W0 - 60 ? "end" : "middle");
      const [mx, dx] = [X(st.mean), X(st.median)];
      refs.ful.style.transform = `translateX(${mx}px)`;
      refs.gm.style.transform = `translateX(${mx}px)`;
      refs.fulT.textContent = `${L("mean", "media")} ${f2(st.mean)}`;
      refs.fulT.setAttribute("text-anchor", anchor(mx));
      refs.med.style.transform = `translate(${dx}px,26px)`;
      refs.gd.style.transform = `translateX(${dx}px)`;
      refs.medT.textContent = `${L("median", "mediana")} ${f2(st.median)}`;
      refs.medT.setAttribute("text-anchor", anchor(dx));
      for (const m of M.show) {
        const c = condBy[m];
        const val = m === "moved" ? moved(spec, dots) : st[m];
        const el = chipEl[m];
        el.querySelector("output").textContent = m === "moved" ? `${val} / ${c.v}` : num(val);
        const t = c ? tag(c) : null;
        el.querySelector("small").innerHTML = t ? B(t[0], t[1]) : "";
        el.classList.toggle("is-ok", !!c && HOLD[c.op](val, c.v));
      }
      selTxt.textContent = L(
        `Dot ${sel + 1}: ${f2(dots[sel])}`,
        `Punto ${sel + 1}: ${f2(dots[sel])}`,
      );
      left.setAttribute(
        "aria-label",
        L(`Move dot ${sel + 1} left`, `Mover el punto ${sel + 1} a la izquierda`),
      );
      right.setAttribute(
        "aria-label",
        L(`Move dot ${sel + 1} right`, `Mover el punto ${sel + 1} a la derecha`),
      );
      left.disabled = ro || locked.has(sel) || dots[sel] <= M.lo + EPS;
      right.disabled = ro || locked.has(sel) || dots[sel] >= M.hi - EPS;
      if (M.dist) paintDist(st);
    };
    /** Distance of every dot from the mean: the balance idea, and the MAD arithmetic. */
    const paintDist = (st) => {
      refs.dist.textContent = "";
      let lt = 0;
      let rt = 0;
      const rows = dots.map((_, i) => i).sort((a, b) => dots[a] - dots[b]);
      rows.forEach((i, r) => {
        const [v, y] = [dots[i], Y_BEAM + 94 + r * 17];
        const d = Math.abs(v - st.mean);
        if (v < st.mean) lt += d;
        else rt += d;
        S("line", { class: "db-bar", x1: X(st.mean), x2: X(v), y1: y, y2: y }, refs.dist);
        S("circle", { class: "db-dm", cx: X(v), cy: y, r: 5 }, refs.dist);
        const at = {
          class: "db-dl",
          x: X(v) + (v < st.mean ? -9 : 9),
          y: y + 4,
          "text-anchor": v < st.mean ? "end" : "start",
        };
        S("text", at, refs.dist).textContent = f2(d);
      });
      const [a, b, t] = [f2(lt), f2(rt), f2(lt + rt)];
      distNote.innerHTML = B(
        `Distance left of the mean: ${a}. Right of the mean: ${b}. All distances add to ${t}, and ${t} ÷ ${n} dots = ${f2((lt + rt) / n)}.`,
        `Distancia a la izquierda de la media: ${a}. A la derecha: ${b}. Todas suman ${t}, y ${t} ÷ ${n} puntos = ${f2((lt + rt) / n)}.`,
      );
    };

    /* level 4 reasoning */
    if (spec.why) {
      const box = h("fieldset", "db-why");
      const group = h("div", "db-opts", "", {
        role: "radiogroup",
        "aria-label": L("Explanations", "Explicaciones"),
      });
      box.append(h("legend", "", B(spec.why.q, spec.why.qEs)), group);
      spec.why.opts.forEach((o, i) => {
        const b = h("button", "db-opt", B(o.t, o.tEs), {
          type: "button",
          role: "radio",
          "aria-checked": String(why === i),
        });
        b.disabled = ro;
        b.addEventListener("click", () => {
          why = i;
          [...group.children].forEach((x, j) => x.setAttribute("aria-checked", String(j === i)));
          api.change?.(state());
        });
        group.append(b);
      });
      root.append(box);
    }

    if (!ro) {
      const act = h("div", "db-act");
      const check = h("button", "db-btn db-go", B("Check", "Revisar"), { type: "button" });
      const hint = h("button", "db-btn", B("Hint", "Pista"), { type: "button" });
      const reset = h("button", "db-btn", B("Start over", "Empezar de nuevo"), { type: "button" });
      check.addEventListener("click", () => api.submit?.(state()));
      hint.addEventListener("click", () => api.hint?.());
      reset.addEventListener("click", () => {
        dots = M.start.slice();
        why = null;
        for (const b of host.querySelectorAll(".db-opt")) b.setAttribute("aria-checked", "false");
        paint();
        api.change?.(state());
        api.say?.(L("Dots are back where they started.", "Los puntos volvieron a su lugar."));
      });
      act.append(check, hint, reset);
      root.append(act);
    }

    build();
    if (typeof W.ResizeObserver === "function") {
      new W.ResizeObserver(() => {
        const w = Math.round(stage.clientWidth);
        if (w && Math.abs(w - W0) > 6 && host.isConnected) build();
      }).observe(stage);
    }
  }
})();
