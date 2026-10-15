/**
 * Practice Studio generators: statistics (Unit 2, lessons 2-1 to 2-10).
 *
 *   dotplotRead histogramRead medianFind meanFind meanMissing rangeIqr boxplotRead madCalc chooseMeasure
 *
 * Conventions, so that no item is ambiguous:
 *  - Quartiles follow Grade 6 / Reveal Math: Q1 is the median of the lower half and Q3 the median of the upper
 *    half; the overall median is LEFT OUT of both halves when the count is odd. Odd-count stems say so up
 *    front and every explanation repeats it.
 *  - Every wrong choice is a named misconception: item.tag[i] (multiple choice) or fw[i].tag (typed answer),
 *    with f / fEs feedback that explains the slip and never prints the key. The feedback lives once, in SLIP.
 *  - check(item) re-derives the key from item.meta by a different route than make() used (counting ranks
 *    instead of sorting, balancing deviations instead of dividing, filtering instead of a frequency table).
 *  - Histogram bins are labelled with whole numbers: {from: 20, to: 29} is the interval "20-29".
 *  - Figure specs carry optional Es siblings (labelEs, xlabelEs, ylabelEs) for the Spanish studio.
 *  - Multiple choice items with words in their choices also carry cEs (Spanish choices), aligned with c.
 */
(() => {
  const W = /** @type {any} */ (window);
  const G = W.StudioGen;
  const f = G.fmt;

  /* ---- arithmetic: make() side ---------------------------------------------------------------- */
  const sum = (a) => a.reduce((s, v) => s + v, 0);
  const asc = (a) => a.slice().sort((x, y) => x - y);
  const near = (x, y) => Math.abs(x - y) < 1e-9;
  const mean = (a) => sum(a) / a.length;
  /** Median of an ASCENDING array. */
  const midOf = (s) => {
    const h = s.length >> 1;
    return s.length % 2 ? s[h] : (s[h - 1] + s[h]) / 2;
  };
  /** Five-number summary, Grade 6 convention: the median is left out of both halves when the count is odd. */
  const five = (a) => {
    const s = asc(a);
    const h = s.length >> 1;
    return {
      min: s[0],
      q1: midOf(s.slice(0, h)),
      med: midOf(s),
      q3: midOf(s.slice(s.length % 2 ? h + 1 : h)),
      max: s[s.length - 1],
    };
  };
  /** The same summary the common wrong way: the median kept inside both halves. */
  const fiveKept = (a) => {
    const s = asc(a);
    const h = s.length >> 1;
    const odd = s.length % 2;
    return { q1: midOf(s.slice(0, h + odd)), q3: midOf(s.slice(h)) };
  };
  const list = (a) => a.map((v) => f(v)).join(", ");
  const pair = (en, es) => [en, es];
  const cat = (...ps) => [ps.map((p) => p[0]).join(" "), ps.map((p) => p[1]).join(" ")];
  /** "3, 5, 7 and 9" / "3, 5, 7 y 9" */
  const andL = (a) => {
    const t = a.map((v) => f(v));
    const last = t.pop();
    return t.length
      ? pair(`${t.join(", ")} and ${last}`, `${t.join(", ")} y ${last}`)
      : pair(last, last);
  };
  /** "1 dot" / "3 dots" in both languages. */
  const dotsN = (n) =>
    pair(`${n} ${n === 1 ? "dot" : "dots"}`, `${n} ${n === 1 ? "punto" : "puntos"}`);
  const dN = (n) => dotsN(n)[0];
  const dNs = (n) => dotsN(n)[1];
  const up = (t) => t.replace(/^\S/, (ch) => ch.toUpperCase());
  const upP = (p) => pair(up(p[0]), up(p[1]));
  const pick2 = (rng, a, n) => rng.shuffle(a).slice(0, n);
  const freqOf = (a, v) => a.filter((x) => x === v).length;
  /** Terminates in at most one decimal place, so it reads cleanly in a Grade 6 answer. */
  const tidy = (x) => near(Math.round(x * 10) / 10, x);

  /* ---- arithmetic: check() side. Different routes: rank selection by counting, no sorting ---------- */
  const below = (a, v) => a.filter((x) => x < v).length;
  const upTo = (a, v) => a.filter((x) => x <= v).length;
  /** k-th smallest (1-based) found by counting how many values sit below and at-or-below each candidate. */
  const kth = (a, k) => a.find((v) => below(a, v) < k && k <= upTo(a, v));
  const medC = (a) => {
    const n = a.length;
    return n % 2 ? kth(a, (n + 1) / 2) : (kth(a, n / 2) + kth(a, n / 2 + 1)) / 2;
  };
  /** Five-number summary by rank counting: lower half = ranks 1..h, upper half = ranks n-h+1..n. */
  const fiveC = (a) => {
    const n = a.length;
    const h = n >> 1;
    const mid = (lo, c) =>
      c % 2 ? kth(a, lo + (c - 1) / 2) : (kth(a, lo + c / 2 - 1) + kth(a, lo + c / 2)) / 2;
    return {
      min: Math.min(...a),
      q1: mid(1, h),
      med: medC(a),
      q3: mid(n - h + 1, h),
      max: Math.max(...a),
    };
  };
  /** Mean by balancing: the number m with zero total signed distance, found by walking from the lowest value. */
  const meanC = (a) => {
    let m = Math.min(...a);
    const n = a.length;
    let gap = a.reduce((s, x) => s + (x - m), 0);
    m += gap / n;
    gap = a.reduce((s, x) => s + (x - m), 0);
    return Math.abs(gap) < 1e-7 ? m : Number.NaN;
  };
  /** MAD in whole-number arithmetic: (1/n^2) * sum |n*x - total|, no division until the very end. */
  const madC = (a) => {
    const n = a.length;
    const total = a.reduce((s, x) => s + x, 0);
    return a.reduce((s, x) => s + Math.abs(n * x - total), 0) / (n * n);
  };
  /** Value the student sees as the key, so check() compares what was shown. */
  const keyOf = (it) => (it.k === "mc" ? it.c[it.a] : it.a);
  const verdict = (it, want, what) =>
    near(G.value(keyOf(it)), want) || `${what}: key says ${keyOf(it)} but the data give ${f(want)}`;
  const verdictText = (it, want, what) =>
    keyOf(it) === want || `${what}: key says "${keyOf(it)}" but the data give "${want}"`;

  /** Retry until ok(candidate); never throws (returns the last candidate if nothing passes). */
  const until = (gen, ok, tries = 400) => {
    let c = gen();
    for (let i = 1; i < tries && !ok(c); i++) c = gen();
    return c;
  };

  /* ---- named slips: feedback is written once, here. It explains the mistake and never prints the key. -- */
  const SLIP = {
    // reading counts and values
    "stat-frequency-vs-value": pair(
      "That is a number from the axis, not a count. Count the dots (or see how tall the bar is).",
      "Ese es un número del eje, no una cantidad. Cuenta los puntos (o fíjate qué tan alta es la barra).",
    ),
    "stat-value-vs-frequency": pair(
      "That is a count (how many). The question asks for a value from the axis.",
      "Esa es una cantidad (cuántos). La pregunta pide un valor del eje.",
    ),
    "stat-wrong-column": pair(
      "That is the stack or bar next to the one you need. Check the number under it.",
      "Esa es la pila o barra de al lado. Revisa el número que está debajo.",
    ),
    "stat-counted-all": pair(
      "That counts everything. Count only the part the question asks about.",
      "Eso cuenta todo. Cuenta solo la parte que pide la pregunta.",
    ),
    "stat-miscount": pair(
      "Close. Count again and touch each dot or bar once.",
      "Casi. Cuenta otra vez y toca cada punto o barra una sola vez.",
    ),
    "stat-boundary-included": pair(
      'This includes the number itself. "More than" and "fewer than" leave it out.',
      'Esto incluye al número mismo. "Más de" y "menos de" no lo incluyen.',
    ),
    "stat-boundary-left-out": pair(
      'This leaves out the number itself. "At least" and "at most" keep it.',
      'Esto deja fuera al número mismo. "Al menos" y "como máximo" sí lo incluyen.',
    ),
    "stat-wrong-direction": pair(
      "That counts the other side. Check which way the words point.",
      "Eso cuenta el otro lado. Fíjate hacia dónde apuntan las palabras.",
    ),
    "stat-one-stack-only": pair(
      "That is only one stack or bar. The question asks about the whole group.",
      "Esa es solo una pila o barra. La pregunta se refiere a todo el grupo.",
    ),
    "stat-added-not-subtracted": pair(
      '"How many more" asks for a difference. Subtract the two counts.',
      '"Cuántos más" pide una diferencia. Resta las dos cantidades.',
    ),
    "stat-axis-sum": pair(
      "That adds each number on the axis only once. A stack of 3 dots counts its number 3 times.",
      "Eso suma una sola vez cada número del eje. Una pila de 3 puntos cuenta su número 3 veces.",
    ),
    "stat-stack-left-out": pair(
      "One stack is missing from your total. Include every stack.",
      "Falta una pila en tu total. Incluye todas las pilas.",
    ),
    "stat-tie-not-most": pair(
      "That only ties the tallest stack. To be the only most common value, a stack must be taller.",
      "Eso solo empata con la pila más alta. Para ser el único valor más común, la pila debe ser más alta.",
    ),
    "stat-one-more-only": pair(
      "One more dot only works if the stack is already tied for tallest. Compare it with the tallest stack first.",
      "Un punto más solo sirve si la pila ya empata como la más alta. Primero compárala con la pila más alta.",
    ),
    "stat-current-not-needed": pair(
      "That is how many dots the stack has now, not how many to add.",
      "Esa es la cantidad de puntos que tiene ahora la pila, no cuántos agregar.",
    ),
    "stat-ticks-not-values": pair(
      "That counts every number on the axis. Only numbers that have dots are in the data.",
      "Eso cuenta todos los números del eje. Solo los números que tienen puntos están en los datos.",
    ),
    "stat-empty-not-used": pair(
      "That counts the numbers with no dots. The question asks about the ones with dots.",
      "Eso cuenta los números sin puntos. La pregunta se refiere a los que sí tienen puntos.",
    ),
    "stat-greatest-not-most": pair(
      "That is the greatest value, at the right end. Most common means the stack with the most dots.",
      "Ese es el valor mayor, en el extremo derecho. Más común significa la pila con más puntos.",
    ),
    "stat-middle-not-most": pair(
      "That is the middle of the axis. The most common value can be anywhere on the axis.",
      "Ese es el centro del eje. El valor más común puede estar en cualquier lugar del eje.",
    ),
    "stat-least-not-most": pair(
      "That is the least value, at the left end. Look for the tallest stack instead.",
      "Ese es el valor menor, en el extremo izquierdo. Busca más bien la pila más alta.",
    ),
    "stat-stacks-not-dots": pair(
      "That counts the stacks. Each dot is one more in the total.",
      "Eso cuenta las pilas. Cada punto es uno más en el total.",
    ),
    "stat-swapped-value-count": pair(
      "This swaps the value and the count. The number under a stack is the value, and the dots tell how many.",
      "Esto cambia de lugar el valor y la cantidad. El número debajo de una pila es el valor y los puntos dicen cuántos hay.",
    ),
    "stat-value-not-count": pair(
      'That compares the numbers on the axis. "More" compares how many, the height of the stacks.',
      'Eso compara los números del eje. "Más" compara cuántos hay, la altura de las pilas.',
    ),
    // histograms
    "stat-one-bar-only": pair(
      "That is only one bar. The question asks about more than one bar.",
      "Esa es solo una barra. La pregunta se refiere a más de una barra.",
    ),
    "stat-bars-not-values": pair(
      "That counts the bars. Each bar stands for several values, so add the heights of the bars.",
      "Eso cuenta las barras. Cada barra representa varios valores, así que suma las alturas.",
    ),
    "stat-extra-bar": pair(
      "That includes a bar that is outside the group the question names.",
      "Eso incluye una barra que está fuera del grupo que nombra la pregunta.",
    ),
    "stat-bar-left-out": pair(
      "A bar is missing from your total. Add every bar.",
      "Falta una barra en tu total. Suma todas las barras.",
    ),
    "stat-bin-is-one-value": pair(
      "A bar covers a whole interval, so a histogram cannot tell you the exact values inside it.",
      "Una barra cubre un intervalo completo, así que un histograma no dice los valores exactos que hay dentro.",
    ),
    "stat-tall-means-big": pair(
      "The tallest bar shows where the most values are, not where the greatest values are.",
      "La barra más alta muestra dónde hay más valores, no dónde están los valores mayores.",
    ),
    "stat-shortest-not-tallest": pair(
      "That is the shortest bar. The tallest bar has the most values.",
      "Esa es la barra más baja. La barra más alta tiene más valores.",
    ),
    "stat-count-not-percent": pair(
      "That is a number of values. A percent compares that number with the total, out of 100.",
      "Esa es una cantidad de valores. Un porcentaje compara esa cantidad con el total, sobre 100.",
    ),
    "stat-percent-no-100": pair(
      "That is the part written as a decimal. Multiply by 100 to write it as a percent.",
      "Esa es la parte escrita como decimal. Multiplica por 100 para escribirla como porcentaje.",
    ),
    "stat-complement-missed": pair(
      "That is the percent that ARE in the group. The question asks about all the rest.",
      "Ese es el porcentaje que SÍ está en el grupo. La pregunta se refiere a todo lo demás.",
    ),
    "stat-histogram-bin-misread": pair(
      "Check the two ends of the interval. Only values from the first end to the last end are inside it.",
      "Revisa los dos extremos del intervalo. Solo los valores desde el primer extremo hasta el último están dentro.",
    ),
    // median
    "stat-no-order": pair(
      "The numbers were not in order yet. Put them in order first, then find the middle.",
      "Los números todavía no estaban en orden. Ordénalos primero y luego busca el del medio.",
    ),
    "stat-mean-vs-median": pair(
      "That is the mean, the total shared equally. The median is the middle number of the ordered list.",
      "Esa es la media, el total repartido en partes iguales. La mediana es el número del medio de la lista ordenada.",
    ),
    "stat-mode-vs-median": pair(
      "That is the mode, the number that appears most. The median is the middle number.",
      "Esa es la moda, el número que aparece más veces. La mediana es el número del medio.",
    ),
    "stat-midrange": pair(
      "That is halfway between the least and greatest numbers. The median is the middle of the ordered list.",
      "Eso está a la mitad entre el menor y el mayor. La mediana es el medio de la lista ordenada.",
    ),
    "stat-position-not-value": pair(
      "That is the place of the middle number in the list, not the number itself.",
      "Ese es el lugar del número del medio en la lista, no el número mismo.",
    ),
    "stat-one-middle": pair(
      "With an even count there are two middle numbers. The median is the number halfway between them.",
      "Con una cantidad par hay dos números del medio. La mediana es el número que está a la mitad entre ellos.",
    ),
    "stat-sum-not-halved": pair(
      "You added the two middle numbers. Divide that by 2 to find the number halfway between them.",
      "Sumaste los dos números del medio. Divide eso entre 2 para hallar el número que está a la mitad entre ellos.",
    ),
    "stat-distinct-only": pair(
      "A repeated number counts every time it appears. Do not skip the repeats.",
      "Un número repetido cuenta cada vez que aparece. No omitas los repetidos.",
    ),
    "stat-axis-middle": pair(
      "That is the middle of the axis. The median is the middle of the data, so count the dots.",
      "Ese es el medio del eje. La mediana es el medio de los datos, así que cuenta los puntos.",
    ),
    "stat-table-middle-row": pair(
      "That is the middle row of the table. Each row stands for several values, so count them.",
      "Esa es la fila del medio de la tabla. Cada fila representa varios valores, así que cuéntalos.",
    ),
    "stat-median-of-counts": pair(
      "Those are counts, not data values. The median is one of the values.",
      "Esas son cantidades, no valores de los datos. La mediana es uno de los valores.",
    ),
    "stat-median-unchanged": pair(
      "A new value changes how many numbers there are, so the middle moves. Order the new list and find its middle.",
      "Un valor nuevo cambia cuántos números hay, así que el medio se mueve. Ordena la lista nueva y busca su medio.",
    ),
    "stat-averaged-with-new-value": pair(
      "The new median is not halfway between the old median and the new value. Order the new list and find its middle.",
      "La nueva mediana no está a la mitad entre la mediana anterior y el valor nuevo. Ordena la lista nueva y busca su medio.",
    ),
    "stat-median-as-mode": pair(
      "That describes the mode, the value that appears most. The median is the middle value.",
      "Eso describe la moda, el valor que aparece más veces. La mediana es el valor del medio.",
    ),
    "stat-median-as-mean": pair(
      "That treats the median like the mean. The median tells where the middle is, not what the total is.",
      "Eso trata la mediana como si fuera la media. La mediana dice dónde está el medio, no cuánto suma el total.",
    ),
    "stat-median-as-midrange": pair(
      "The median is the middle of the ordered list, not the point halfway between the least and the greatest.",
      "La mediana es el medio de la lista ordenada, no el punto a la mitad entre el menor y el mayor.",
    ),
    "stat-median-as-position": pair(
      "The list was not in order. The middle place in an unordered list is not the median.",
      "La lista no estaba en orden. El lugar del medio en una lista desordenada no es la mediana.",
    ),
    // mean
    "stat-summed-instead-of-averaged": pair(
      "That is the total. Divide it by how many numbers there are.",
      "Ese es el total. Divídelo entre cuántos números hay.",
    ),
    "stat-wrong-divisor": pair(
      "Divide by how many numbers there are. Count them carefully.",
      "Divide entre la cantidad de números que hay. Cuéntalos con cuidado.",
    ),
    "stat-median-for-mean": pair(
      "That is the median, the middle number. The mean is the total shared equally.",
      "Esa es la mediana, el número del medio. La media es el total repartido en partes iguales.",
    ),
    "stat-greatest-not-mean": pair(
      "That is the greatest number. The mean is what each would be if everything were shared equally.",
      "Ese es el número mayor. La media es lo que sería cada uno si todo se repartiera en partes iguales.",
    ),
    "stat-zero-left-out": pair(
      "A zero is still a value. Count it when you divide.",
      "Un cero también es un valor. Cuéntalo cuando dividas.",
    ),
    "stat-mean-of-axis": pair(
      "That averages the numbers on the axis once each. A stack with more dots counts more times.",
      "Eso promedia una sola vez cada número del eje. Una pila con más puntos cuenta más veces.",
    ),
    "stat-divided-not-multiplied": pair(
      "The mean is the total shared equally, so the total is the mean times the count. Multiply instead.",
      "La media es el total repartido en partes iguales, así que el total es la media por la cantidad. Multiplica.",
    ),
    "stat-added-mean-count": pair(
      "Adding the mean and the count does not give the total. Multiply them.",
      "Sumar la media y la cantidad no da el total. Multiplícalas.",
    ),
    "stat-mean-as-total": pair(
      "That is the mean, not the total. Multiply the mean by how many values there are.",
      "Esa es la media, no el total. Multiplica la media por la cantidad de valores.",
    ),
    "stat-averaged-the-means": pair(
      "The groups are different sizes, so you cannot just average the two means. Find each group's total first.",
      "Los grupos tienen tamaños distintos, así que no basta promediar las dos medias. Halla primero el total de cada grupo.",
    ),
    "stat-target-not-total": pair(
      "A target mean is not a target total. Multiply the target mean by how many values there will be.",
      "Una media objetivo no es un total objetivo. Multiplica la media objetivo por la cantidad de valores que habrá.",
    ),
    "stat-wrong-total": pair(
      "Check how many values there will be after the new one. Use that count to find the target total.",
      "Fíjate en cuántos valores habrá con el nuevo. Usa esa cantidad para hallar el total objetivo.",
    ),
    "stat-mean-as-missing": pair(
      "That is the target mean, not the missing value. The missing value is what makes the total reach the target.",
      "Esa es la media objetivo, no el valor que falta. El valor que falta es el que hace que el total llegue a la meta.",
    ),
    "stat-average-of-known": pair(
      "That is the mean of the numbers you already know. The missing number has to make the whole total reach the target.",
      "Esa es la media de los números que ya conoces. El número que falta debe hacer que todo el total llegue a la meta.",
    ),
    "stat-change-added-to-mean": pair(
      "The mean changed, but the new value changed the total by more than that. Compare the old total with the new total.",
      "La media cambió, pero el valor nuevo cambió el total más que eso. Compara el total anterior con el nuevo.",
    ),
    "stat-mean-unchanged": pair(
      "A new value changes the total and the count, so the mean can change. Find the new total and divide again.",
      "Un valor nuevo cambia el total y la cantidad, así que la media puede cambiar. Halla el nuevo total y divide otra vez.",
    ),
    "stat-gave-the-mean": pair(
      "That is the amount every pile will have at the end, not how many must be moved.",
      "Esa es la cantidad que tendrá cada pila al final, no cuántas hay que mover.",
    ),
    "stat-gap-to-smallest": pair(
      "That is the gap between the biggest and smallest piles. Everyone ends at the mean, not at the smallest pile.",
      "Esa es la diferencia entre la pila mayor y la menor. Todos terminan en la media, no en la pila menor.",
    ),
    "stat-removed-vs-mean": pair(
      "Removing a value changes the total and the count. Compare the old total with the new total.",
      "Quitar un valor cambia el total y la cantidad. Compara el total anterior con el nuevo.",
    ),
    "stat-equal-split-missed": pair(
      "Two numbers share what is left. Divide the leftover total between them.",
      "Dos números se reparten lo que queda. Divide el total restante entre ellos.",
    ),
    // range, quartiles, IQR
    "stat-range-for-iqr": pair(
      "That is the range (greatest − least). The IQR is Q3 − Q1, the spread of the middle half.",
      "Ese es el rango (mayor − menor). El RIC es Q3 − Q1, la dispersión de la mitad central.",
    ),
    "stat-iqr-for-range": pair(
      "That is the IQR, the spread of the middle half. The range is the greatest value minus the least.",
      "Ese es el RIC, la dispersión de la mitad central. El rango es el valor mayor menos el menor.",
    ),
    "stat-median-in-halves": pair(
      "When the count is odd, the median is left out of both halves. Keeping it in moves the middle of each half.",
      "Cuando la cantidad es impar, la mediana no forma parte de ninguna mitad. Si la incluyes, el medio de cada mitad se mueve.",
    ),
    "stat-edge-of-half": pair(
      "Q1 and Q3 are the middle of each half, not the number next to the median.",
      "Q1 y Q3 son el medio de cada mitad, no el número que está junto a la mediana.",
    ),
    "stat-quartile-as-median": pair(
      "That is the median of the whole list. Q1 is the median of the lower half only (Q3, the upper half).",
      "Esa es la mediana de toda la lista. Q1 es la mediana de la mitad inferior solamente (Q3, la mitad superior).",
    ),
    "stat-quartile-sum": pair(
      "The IQR is a distance, so subtract: Q3 − Q1.",
      "El RIC es una distancia, así que resta: Q3 − Q1.",
    ),
    "stat-end-of-list": pair(
      "The list was not in order. The least and greatest values are not always at the ends of the list.",
      "La lista no estaba en orden. El valor menor y el mayor no siempre están en los extremos de la lista.",
    ),
    "stat-greatest-as-range": pair(
      "That is the greatest value. The range is the greatest value minus the least.",
      "Ese es el valor mayor. El rango es el valor mayor menos el menor.",
    ),
    "stat-least-plus-greatest": pair(
      "The range is a distance, so subtract: greatest − least.",
      "El rango es una distancia, así que resta: mayor − menor.",
    ),
    "stat-q3-as-iqr": pair(
      "That is Q3 itself. The IQR is Q3 minus Q1.",
      "Ese es Q3 mismo. El RIC es Q3 menos Q1.",
    ),
    "stat-median-as-iqr": pair(
      "That is the median, a center. The IQR is a spread: Q3 − Q1.",
      "Esa es la mediana, un centro. El RIC es una dispersión: Q3 − Q1.",
    ),
    "stat-compared-by-range": pair(
      "You compared the ranges only. The IQR describes the middle half, and it can order the data sets differently.",
      "Solo comparaste los rangos. El RIC describe la mitad central y puede ordenar los conjuntos de datos de otra manera.",
    ),
    "stat-compared-by-center": pair(
      "The medians tell the centers, not the spread. Compare the IQRs to compare the spread.",
      "Las medianas dicen los centros, no la dispersión. Compara los RIC para comparar la dispersión.",
    ),
    "stat-same-center-same-spread": pair(
      "Data sets with the same median can still be spread out differently. Compare the IQRs.",
      "Conjuntos de datos con la misma mediana pueden estar distribuidos de manera distinta. Compara los RIC.",
    ),
    // box plots
    "stat-box-edge-extreme": pair(
      "That is the edge of the box, a quartile. The least and greatest values are at the ends of the whiskers.",
      "Ese es el borde de la caja, un cuartil. El valor menor y el mayor están en los extremos de los bigotes.",
    ),
    "stat-whisker-for-box": pair(
      "That is the end of a whisker. The edges of the box are the quartiles.",
      "Ese es el extremo de un bigote. Los bordes de la caja son los cuartiles.",
    ),
    "stat-length-for-data": pair(
      "Each section holds the same share of the data, no matter how long it looks. Length shows spread, not how many values.",
      "Cada sección tiene la misma parte de los datos, sin importar qué tan larga se vea. La longitud muestra dispersión, no cuántos valores hay.",
    ),
    "stat-thirds": pair(
      "A box plot splits the data into four equal parts, not three.",
      "Un diagrama de caja divide los datos en cuatro partes iguales, no en tres.",
    ),
    "stat-one-section": pair(
      "That is the share in just one section. Check how many sections the question covers.",
      "Esa es la parte de una sola sección. Fíjate cuántas secciones abarca la pregunta.",
    ),
    "stat-median-as-center": pair(
      "That is the middle of the whole plot. The median is the line inside the box.",
      "Ese es el medio de toda la gráfica. La mediana es la línea dentro de la caja.",
    ),
    "stat-percent-as-count": pair(
      "That is a percent used as a number of values. Find that share of the total number of values.",
      "Ese es un porcentaje usado como cantidad de valores. Halla esa parte del total de valores.",
    ),
    "stat-whole-as-part": pair(
      "That is the total number of values. The question asks about only part of them.",
      "Esa es la cantidad total de valores. La pregunta se refiere solo a una parte.",
    ),
    "stat-longer-whisker-bigger": pair(
      "A longer whisker shows a larger spread in that section. It does not mean the section holds more values.",
      "Un bigote más largo muestra más dispersión en esa sección. No significa que tenga más valores.",
    ),
    "stat-higher-reach-higher-center": pair(
      "How far a whisker reaches does not tell the median. Compare the lines inside the boxes.",
      "Qué tan lejos llega un bigote no dice la mediana. Compara las líneas dentro de las cajas.",
    ),
    "stat-box-for-range": pair(
      "The box shows only the middle half. The range runs from the end of one whisker to the end of the other.",
      "La caja muestra solo la mitad central. El rango va desde el extremo de un bigote hasta el extremo del otro.",
    ),
    "stat-reach-for-box": pair(
      "How far the whiskers reach does not tell you how long the box is. The box runs only from Q1 to Q3.",
      "Qué tan lejos llegan los bigotes no dice qué tan larga es la caja. La caja va solo de Q1 a Q3.",
    ),
    "stat-box-for-reach": pair(
      "The box shows only the middle half. How far the plot stretches from end to end is measured from one whisker to the other.",
      "La caja muestra solo la mitad central. Cuánto se extiende el diagrama de un extremo al otro se mide de un bigote al otro.",
    ),
    "stat-median-for-quartile": pair(
      "A higher median does not mean more of the data is above a given value. Look at Q1 to see where the lowest quarter ends.",
      "Una mediana más alta no significa que más datos estén sobre cierto valor. Mira Q1 para ver dónde termina el cuarto inferior.",
    ),
    "stat-least-for-quartile": pair(
      "The least value says where the data start, not where the lowest quarter ends. Look at Q1.",
      "El valor menor dice dónde empiezan los datos, no dónde termina el cuarto inferior. Mira Q1.",
    ),
    // MAD
    "stat-signed-deviations": pair(
      "Distances are never negative. Use the absolute value of each difference, then average.",
      "Las distancias nunca son negativas. Usa el valor absoluto de cada diferencia y luego promedia.",
    ),
    "stat-distances-not-averaged": pair(
      "That is the sum of the distances. Divide by how many values there are to get the average distance.",
      "Esa es la suma de las distancias. Divide entre la cantidad de valores para obtener la distancia promedio.",
    ),
    "stat-deviation-from-median": pair(
      "Deviations are measured from the mean, not the median.",
      "Las desviaciones se miden desde la media, no desde la mediana.",
    ),
    "stat-center-vs-spread": pair(
      "That is a measure of center. The question asks how spread out the data are.",
      "Esa es una medida de centro. La pregunta pide qué tan dispersos están los datos.",
    ),
    "stat-value-not-distance": pair(
      "That is the value itself. A deviation is how far the value is from the mean.",
      "Ese es el valor mismo. Una desviación es qué tan lejos está el valor de la media.",
    ),
    "stat-bigger-mean-more-spread": pair(
      "The size of the mean does not show the spread. Compare the MADs.",
      "El tamaño de la media no muestra la dispersión. Compara las DMA.",
    ),
    "stat-same-mean-same-spread": pair(
      "Two data sets can have the same mean and different spread. Compare the MADs.",
      "Dos conjuntos de datos pueden tener la misma media y distinta dispersión. Compara las DMA.",
    ),
    "stat-range-for-mad": pair(
      "The range uses only the two end values. The MAD uses every value's distance from the mean.",
      "El rango usa solo los dos valores de los extremos. La DMA usa la distancia de cada valor a la media.",
    ),
    "stat-mad-as-total-distance": pair(
      "That adds the distances but does not average them. Divide by how many values there are.",
      "Eso suma las distancias pero no las promedia. Divide entre la cantidad de valores.",
    ),
    // choosing measures
    "stat-mean-skewed-by-outlier": pair(
      "An outlier pulls the mean toward it. The median stays near the middle of most of the data.",
      "Un valor atípico jala la media hacia él. La mediana se queda cerca del medio de la mayoría de los datos.",
    ),
    "stat-mode-for-center": pair(
      "The mode is only the most common value. It does not show the middle of the data.",
      "La moda es solo el valor más común. No muestra el medio de los datos.",
    ),
    "stat-range-for-center": pair(
      "The range is a measure of spread, not of center.",
      "El rango es una medida de dispersión, no de centro.",
    ),
    "stat-pairing-mixup": pair(
      "Pair the mean with the MAD, and the median with the IQR. Each pair uses the same kind of center.",
      "Empareja la media con la DMA, y la mediana con el RIC. Cada pareja usa el mismo tipo de centro.",
    ),
    "stat-mean-always": pair(
      "Using every value does not make the mean best. One far-away value can pull it away from where most of the data are.",
      "Usar todos los valores no hace que la media sea la mejor. Un valor muy lejano puede jalarla lejos de donde está la mayoría de los datos.",
    ),
    "stat-range-with-outlier": pair(
      "The range depends on the two end values, so an outlier changes it a lot. The IQR ignores the ends.",
      "El rango depende de los dos valores de los extremos, así que un valor atípico lo cambia mucho. El RIC ignora los extremos.",
    ),
    "stat-mad-with-outlier": pair(
      "The MAD uses the mean, and an outlier pulls the mean away. Use the median and IQR for data with an outlier.",
      "La DMA usa la media y un valor atípico la aleja. Usa la mediana y el RIC cuando hay un valor atípico.",
    ),
    "stat-median-no-reason": pair(
      "Compare the data: with no outlier and a balanced shape, the mean describes the center well, so a reason about outliers does not fit.",
      "Compara los datos: sin valor atípico y con forma balanceada, la media describe bien el centro, así que una razón sobre valores atípicos no encaja.",
    ),
    "stat-both-change-same": pair(
      "The two measures do not respond equally. An outlier changes the mean much more than the median.",
      "Las dos medidas no responden igual. Un valor atípico cambia la media mucho más que la mediana.",
    ),
    "stat-median-moves-most": pair(
      "It is the other way round. The median depends on the middle of the list, so one far-away value hardly moves it.",
      "Es al revés. La mediana depende del medio de la lista, así que un valor lejano casi no la mueve.",
    ),
    "stat-neither-changes": pair(
      "A new value changes the total and the count, so the mean moves. Work out both measures before and after.",
      "Un valor nuevo cambia el total y la cantidad, así que la media se mueve. Calcula las dos medidas antes y después.",
    ),
    "stat-outlier-wrong-value": pair(
      "That value is close to the rest. The outlier is the one far away from all the others.",
      "Ese valor está cerca de los demás. El valor atípico es el que está lejos de todos los otros.",
    ),
    "stat-reason-mismatch": pair(
      "The measure fits, but this reason does not describe the data. Check whether the data have an outlier.",
      "La medida sirve, pero esta razón no describe los datos. Fíjate si los datos tienen un valor atípico.",
    ),
    "stat-slip": pair(
      "Check each step against the question, then try another choice.",
      "Revisa cada paso con la pregunta y prueba otra opción.",
    ),
  };

  /* ---- item builders -------------------------------------------------------------------------- */
  /**
   * Candidate wrong answer: [value, tag, [feedbackEn, feedbackEs]]. The feedback comes from SLIP unless the
   * caller passes a specific one (en, es) that names the numbers in this problem.
   */
  const bad = (v, tag, en, es) => {
    const fb = en ? pair(en, es) : SLIP[tag];
    if (!fb) throw new Error(`stats: no feedback written for ${tag}`);
    return [typeof v === "number" ? f(v) : v, tag, fb];
  };
  const enOf = (v) => (Array.isArray(v) ? v[0] : v);
  const esOf = (v) => (Array.isArray(v) ? v[1] : v);

  /**
   * Multiple choice from bilingual parts. o.q/o.x are [en, es]; o.h is [[en, es], ...]; o.right is a string or
   * [en, es]; o.wrong is [[value | [en, es], tag, [fEn, fEs]], ...] best first. Adds item.tag and, when a
   * choice has words, item.cEs.
   */
  const MC = (rng, o) => {
    const key = (v) => String(enOf(v)).trim().toLowerCase();
    const tags = new Map();
    const spa = new Map([[String(enOf(o.right)), String(esOf(o.right))]]);
    const wrong = [];
    for (const [v, tag, fb] of o.wrong) {
      if (tags.has(key(v)) || key(v) === key(o.right)) continue;
      tags.set(key(v), tag);
      spa.set(String(enOf(v)), String(esOf(v)));
      wrong.push({ v: String(enOf(v)), f: fb[0], fEs: fb[1] });
    }
    // numeric key with too few distinct slips: pad with near misses so there are always four choices
    const rn = Number(enOf(o.right));
    if (wrong.length < 3 && Number.isFinite(rn) && String(enOf(o.right)).trim() !== "") {
      for (const k of [1, -1, 2, -2, 3, -3, 4, 5]) {
        const cand = f(rn + k);
        if (wrong.length >= 3) break;
        if (rn + k < 0 && rn >= 0) continue;
        if (tags.has(key(cand)) || key(cand) === key(o.right)) continue;
        tags.set(key(cand), "stat-miscount");
        spa.set(cand, cand);
        wrong.push({ v: cand, f: SLIP["stat-miscount"][0], fEs: SLIP["stat-miscount"][1] });
      }
    }
    const it = G.mc(rng, {
      q: o.q[0],
      qEs: o.q[1],
      right: { v: String(enOf(o.right)) },
      wrong,
      x: o.x[0],
      xEs: o.x[1],
      h: o.h.map((h) => h[0]),
      hEs: o.h.map((h) => h[1]),
      viz: o.viz,
      meta: o.meta,
    });
    it.tag = it.c.map((c, i) =>
      i === it.a ? "" : tags.get(c.trim().toLowerCase()) || "stat-slip",
    );
    const cEs = it.c.map((c) => spa.get(c) ?? c);
    if (cEs.some((c, i) => c !== it.c[i])) it.cEs = cEs;
    return it;
  };

  /** Typed answer from bilingual parts. o.fw is [[value, tag, [fEn, fEs]], ...]. */
  const NUM = (o) => {
    const av = G.value(o.a);
    const fw = [];
    for (const [v, tag, fb] of o.fw || []) {
      const n = G.value(v);
      if (!Number.isFinite(n) || near(n, av) || fw.some((w) => near(G.value(w.v), n))) continue;
      fw.push({ v: String(v), tag, f: fb[0], fEs: fb[1] });
    }
    if (fw.length < 2 && Number.isFinite(av)) {
      for (const k of [1, -1, 2, -2]) {
        if (fw.length >= 2) break;
        if (av + k < 0 && av >= 0) continue;
        if (fw.some((w) => near(G.value(w.v), av + k))) continue;
        fw.push({
          v: f(av + k),
          tag: "stat-miscount",
          f: SLIP["stat-miscount"][0],
          fEs: SLIP["stat-miscount"][1],
        });
      }
    }
    return G.num({
      q: o.q[0],
      qEs: o.q[1],
      a: String(o.a),
      unit: o.unit,
      tol: o.tol,
      fw,
      x: o.x[0],
      xEs: o.x[1],
      h: o.h.map((h) => h[0]),
      hEs: o.h.map((h) => h[1]),
      viz: o.viz,
      meta: o.meta,
    });
  };

  /** One item, multiple choice or typed, from the same list of candidate slips. */
  const ask = (rng, asMc, o) =>
    asMc
      ? MC(rng, { ...o, right: o.right ?? String(o.a), wrong: o.cands })
      : NUM({ ...o, fw: o.cands });

  /* ---- data helpers --------------------------------------------------------------------------- */
  /** Values for context c: n whole numbers from a random window of the range, triangular around its middle. */
  const drawVals = (rng, c, n, w) => {
    const room = Math.floor((c.hi - c.lo) / c.st) + 1;
    const width = Math.min(room, w);
    const lo = c.lo + c.st * rng.int(0, room - width);
    return Array.from(
      { length: n },
      () => lo + c.st * Math.floor(((rng.next() + rng.next()) / 2) * width),
    );
  };
  /** n whole numbers in [lo, hi] with mean exactly m (integer), at least 3 different values, spread about sp. */
  const withMean = (rng, n, m, sp, lo, hi) =>
    until(
      () => {
        const v = Array.from({ length: n }, () =>
          Math.max(lo, Math.min(hi, m + Math.round((rng.next() + rng.next() - 1) * sp))),
        );
        let diff = m * n - sum(v);
        for (let i = 0; diff !== 0 && i < 500; i++) {
          const j = rng.int(0, n - 1);
          const s = Math.sign(diff);
          if (v[j] + s >= lo && v[j] + s <= hi) {
            v[j] += s;
            diff -= s;
          }
        }
        return diff === 0 ? v : null;
      },
      (v) => v && new Set(v).size >= 3,
    ) ||
    (() => {
      const off = [];
      for (let k = 1; off.length + 1 < n; k++) off.push(-k, k);
      if (off.length < n) off.push(0);
      return off.map((d) => m + d);
    })();
  /** A shuffle that is not already ascending and, optionally, whose middle place differs from `not`. */
  const scramble = (rng, a, not) => {
    const mid = a.length >> 1;
    return until(
      () => rng.shuffle(a),
      (s) => s.some((v, i) => v !== asc(a)[i]) && (not === undefined || s[mid] !== not),
    );
  };

  /* ---- data contexts: who the numbers are about, in both languages ------------------------------ */
  const U = (s, p, sEs, pEs) => (v) => [`${v} ${v === 1 ? s : p}`, `${v} ${v === 1 ? sEs : pEs}`];
  const STUDENTS = [
    ["student", "students"],
    ["estudiante", "estudiantes", "m"],
  ];
  /**
   * lo..hi / st: realistic value range and granularity. cnt: counts (say "fewer than"). verb + val(v) build
   * "have 3 pets" / "tienen 3 mascotas". tot(n): the "in all" question, only where a total means something.
   */
  const CTX = [
    {
      id: "pets",
      lo: 0,
      hi: 6,
      st: 1,
      cnt: 1,
      who: STUDENTS,
      intro: (n) =>
        pair(
          `${n} students told how many pets they have at home`,
          `${n} estudiantes dijeron cuántas mascotas tienen en casa`,
        ),
      axis: pair("Number of pets", "Número de mascotas"),
      verb: pair("have", "tienen"),
      verb1: pair("has", "tiene"),
      val: U("pet", "pets", "mascota", "mascotas"),
      what: pair("number of pets", "el número de mascotas"),
      tot: (n) =>
        pair(
          `How many pets do the ${n} students have in all?`,
          `¿Cuántas mascotas tienen en total los ${n} estudiantes?`,
        ),
    },
    {
      id: "books",
      lo: 0,
      hi: 9,
      st: 1,
      cnt: 1,
      who: STUDENTS,
      intro: (n) =>
        pair(
          `${n} students counted the books they read last month`,
          `${n} estudiantes contaron los libros que leyeron el mes pasado`,
        ),
      axis: pair("Books read last month", "Libros leídos el mes pasado"),
      verb: pair("read", "leyeron"),
      verb1: pair("read", "leyó"),
      val: U("book", "books", "libro", "libros"),
      what: pair("number of books", "la cantidad de libros"),
      tot: (n) =>
        pair(
          `How many books did the ${n} students read in all?`,
          `¿Cuántos libros leyeron en total los ${n} estudiantes?`,
        ),
    },
    {
      id: "sleep",
      lo: 6,
      hi: 11,
      st: 1,
      who: STUDENTS,
      intro: (n) =>
        pair(
          `${n} students wrote how many hours they slept last night`,
          `${n} estudiantes anotaron cuántas horas durmieron anoche`,
        ),
      axis: pair("Hours of sleep", "Horas de sueño"),
      verb: pair("slept", "durmieron"),
      verb1: pair("slept", "durmió"),
      val: U("hour", "hours", "hora", "horas"),
      what: pair("number of hours slept", "la cantidad de horas de sueño"),
      tot: (n) =>
        pair(
          `How many hours did the ${n} students sleep in all?`,
          `¿Cuántas horas durmieron en total los ${n} estudiantes?`,
        ),
    },
    {
      id: "quiz",
      lo: 8,
      hi: 20,
      st: 1,
      cnt: 1,
      who: STUDENTS,
      intro: (n) =>
        pair(
          `${n} students took a 20-point quiz`,
          `${n} estudiantes hicieron una prueba corta de 20 puntos`,
        ),
      axis: pair("Quiz score (out of 20)", "Puntaje de la prueba (de 20)"),
      verb: pair("scored", "obtuvieron"),
      verb1: pair("scored", "obtuvo"),
      val: U("point", "points", "punto", "puntos"),
      what: pair("quiz score", "el puntaje de la prueba"),
    },
    {
      id: "shoe",
      lo: 5,
      hi: 10,
      st: 1,
      who: STUDENTS,
      intro: (n) =>
        pair(
          `${n} students shared their shoe sizes`,
          `${n} estudiantes compartieron su talla de zapato`,
        ),
      axis: pair("Shoe size", "Talla de zapato"),
      verb: pair("wear", "usan"),
      verb1: pair("wears", "usa"),
      val: (v) => pair(`size ${v}`, `talla ${v}`),
      pr: (m, v) =>
        ({
          eq: pair(`size ${v}`, `talla ${v}`),
          gt: pair(`a size bigger than ${v}`, `una talla mayor que ${v}`),
          lt: pair(`a size smaller than ${v}`, `una talla menor que ${v}`),
          ge: pair(`size ${v} or bigger`, `talla ${v} o más`),
          le: pair(`size ${v} or smaller`, `talla ${v} o menos`),
        })[m],
      what: pair("shoe size", "la talla de zapato"),
    },
    {
      id: "plant",
      lo: 8,
      hi: 30,
      st: 1,
      who: [
        ["plant", "plants"],
        ["planta", "plantas", "f"],
      ],
      intro: (n) =>
        pair(
          `${n} bean plants were measured after three weeks`,
          `Se midieron ${n} plantas de frijol después de tres semanas`,
        ),
      axis: pair("Plant height (cm)", "Altura de la planta (cm)"),
      verb: pair("are", "miden"),
      verb1: pair("is", "mide"),
      val: (v) => pair(`${v} cm tall`, `${v} cm`),
      what: pair("plant height", "la altura de la planta"),
    },
    {
      id: "practice",
      lo: 10,
      hi: 60,
      st: 5,
      who: STUDENTS,
      intro: (n) =>
        pair(
          `${n} band students wrote how long they practiced last night`,
          `${n} estudiantes de la banda anotaron cuánto tiempo practicaron anoche`,
        ),
      axis: pair("Minutes practiced", "Minutos de práctica"),
      verb: pair("practiced", "practicaron"),
      verb1: pair("practiced", "practicó"),
      val: U("minute", "minutes", "minuto", "minutos"),
      what: pair("practice time", "el tiempo de práctica"),
      tot: (n) =>
        pair(
          `How many minutes did the ${n} students practice in all?`,
          `¿Cuántos minutos practicaron en total los ${n} estudiantes?`,
        ),
    },
    {
      id: "points",
      lo: 6,
      hi: 30,
      st: 1,
      cnt: 1,
      who: [
        ["game", "games"],
        ["partido", "partidos", "m"],
      ],
      intro: (n) =>
        pair(
          `A basketball team's points were recorded for ${n} games`,
          `Se anotaron los puntos de un equipo de baloncesto en ${n} partidos`,
        ),
      axis: pair("Points scored", "Puntos anotados"),
      verb: pair("had", "tuvieron"),
      verb1: pair("had", "tuvo"),
      val: U("point", "points", "punto", "puntos"),
      what: pair("number of points", "la cantidad de puntos"),
      tot: (n) =>
        pair(
          `How many points did the team score in all ${n} games?`,
          `¿Cuántos puntos anotó el equipo en total en los ${n} partidos?`,
        ),
    },
    {
      id: "laps",
      lo: 4,
      hi: 14,
      st: 1,
      cnt: 1,
      who: STUDENTS,
      intro: (n) =>
        pair(
          `${n} students ran laps in gym class`,
          `${n} estudiantes corrieron vueltas en la clase de educación física`,
        ),
      axis: pair("Laps run", "Vueltas corridas"),
      verb: pair("ran", "corrieron"),
      verb1: pair("ran", "corrió"),
      val: U("lap", "laps", "vuelta", "vueltas"),
      what: pair("number of laps", "la cantidad de vueltas"),
      tot: (n) =>
        pair(
          `How many laps did the ${n} students run in all?`,
          `¿Cuántas vueltas corrieron en total los ${n} estudiantes?`,
        ),
    },
    {
      id: "commute",
      lo: 5,
      hi: 40,
      st: 5,
      who: STUDENTS,
      intro: (n) =>
        pair(
          `${n} students told how many minutes it takes them to get to school`,
          `${n} estudiantes dijeron cuántos minutos tardan en llegar a la escuela`,
        ),
      axis: pair("Minutes to get to school", "Minutos para llegar a la escuela"),
      verb: pair("travel", "tardan"),
      verb1: pair("travels", "tarda"),
      val: U("minute", "minutes", "minuto", "minutos"),
      what: pair("travel time", "el tiempo de viaje"),
    },
  ];

  const CMP = {
    eq: pair("exactly", "exactamente"),
    gt: pair("more than", "más de"),
    lt: pair("fewer than", "menos de"),
    ge: pair("at least", "al menos"),
    le: pair("at most", "como máximo"),
  };
  /** "more than" / "less than" wording for a comparison in context c. */
  const cmpWord = (c, cmp) => (cmp === "lt" && !c.cnt ? pair("less than", "menos de") : CMP[cmp]);
  /** "have more than 3 pets" / "tienen más de 3 mascotas"; one = true gives the singular verb ("has"). */
  const pred = (c, cmp, v, one) => {
    const vb = one ? c.verb1 : c.verb;
    if (c.pr) {
      const r = c.pr(cmp, v);
      return pair(`${vb[0]} ${r[0]}`, `${vb[1]} ${r[1]}`);
    }
    const [ve, vs] = c.val(v);
    const w = cmpWord(c, cmp);
    return pair(`${vb[0]} ${w[0]} ${ve}`, `${vb[1]} ${w[1]} ${vs}`);
  };
  /** "How many students have exactly 3 pets?" */
  const cuantos = (c, more) =>
    `¿${c.who[1][2] === "f" ? "Cuántas" : "Cuántos"} ${c.who[1][1]}${more ? " más" : ""}`;
  const hm = (c, p, more) =>
    pair(`How many${more ? " more" : ""} ${c.who[0][1]} ${p[0]}?`, `${cuantos(c, more)} ${p[1]}?`);
  /** "1 student has exactly 3 pets." / "4 students have exactly 3 pets." (noun and verb agree with n) */
  const sentence = (n, c, cmp, v) => {
    const one = n === 1;
    const p = pred(c, cmp, v, one);
    return pair(`${n} ${c.who[0][one ? 0 : 1]} ${p[0]}.`, `${n} ${c.who[1][one ? 0 : 1]} ${p[1]}.`);
  };
  /** The quartile convention, said once so every item words it the same way. */
  const QNOTE = pair(
    "When the count is odd, leave the median out of both halves.",
    "Cuando la cantidad es impar, la mediana no forma parte de ninguna mitad.",
  );
  const QNOTE_X = pair(
    "Q1 is the median of the lower half and Q3 is the median of the upper half. When the count is odd, the median is left out of both halves.",
    "Q1 es la mediana de la mitad inferior y Q3 es la mediana de la mitad superior. Cuando la cantidad es impar, la mediana no forma parte de ninguna mitad.",
  );

  /* ======================================================================================== */
  /* dotplotRead: read counts, the most common value, how many are above / below                  */
  /* ======================================================================================== */

  /** Stack heights for k columns: one clear peak, both end columns used, tallest stack <= 6. */
  const pile = (rng, k, lo, hi, gap) =>
    until(
      () => {
        const p = rng.chance(0.2) ? rng.pick([0, k - 1]) : rng.int(1, k - 2);
        const pk = rng.int(3, 6);
        return Array.from({ length: k }, (_, i) =>
          i === p
            ? pk
            : Math.max(
                i === 0 || i === k - 1 ? 1 : 0,
                Math.min(pk - 1, pk - Math.abs(i - p) * rng.int(1, 2) - rng.int(0, 1)),
              ),
        );
      },
      (c) => {
        const n = sum(c);
        const top = Math.max(...c);
        return (
          n >= lo &&
          n <= hi &&
          c.filter((x) => x === top).length === 1 &&
          (!gap || c.slice(1, -1).some((x) => x === 0))
        );
      },
    );

  const dotViz = (c, data, min, max) => ({
    t: "dots",
    data,
    min,
    max,
    step: c.st,
    label: c.axis[0],
    labelEs: c.axis[1],
  });
  const dotSetup = (rng, level, gap) => {
    const c = rng.pick(CTX);
    const room = Math.floor((c.hi - c.lo) / c.st) + 1;
    const k = Math.min(room, rng.int([5, 6, 6, 7][level - 1], [6, 7, 8, 8][level - 1]));
    const counts = pile(rng, k, [8, 10, 11, 12][level - 1], [12, 14, 16, 18][level - 1], gap);
    const base = c.lo + c.st * rng.int(0, room - k);
    const at = (i) => base + i * c.st;
    const data = counts.flatMap((n, i) => Array(n).fill(at(i)));
    return {
      c,
      k,
      counts,
      at,
      data,
      n: data.length,
      top: Math.max(...counts),
      onAxis: (v) => v >= base && v <= at(k - 1) && (v - base) % c.st === 0,
      viz: dotViz(c, data, base, at(k - 1)),
    };
  };
  const dotLead = (c, n) => {
    const [ie, is] = c.intro(n);
    return pair(
      `${ie}. Each dot is one ${c.who[0][0]}.`,
      `${is}. Cada punto es ${c.who[1][2] === "f" ? "una" : "un"} ${c.who[1][0]}.`,
    );
  };
  const mostCommonQ = (c) =>
    pair(`Which ${c.what[0]} is the most common?`, `¿Cuál es ${c.what[1]} más común?`);
  /** The columns a comparison picks out. */
  const colsFor = (cmp, j, k) =>
    Array.from({ length: k }, (_, i) => i).filter(
      (i) => ({ gt: i > j, ge: i >= j, lt: i < j, le: i <= j, eq: i === j })[cmp],
    );
  const FLIP = { gt: "ge", ge: "gt", lt: "le", le: "lt" };
  const OPP = { gt: "lt", ge: "le", lt: "gt", le: "ge" };
  const cmpHint = (cmp, v) =>
    ({
      gt: pair(
        `Look at the stacks to the right of ${v}. The stack at ${v} itself is not counted.`,
        `Mira las pilas a la derecha del ${v}. La pila del ${v} no se cuenta.`,
      ),
      ge: pair(
        `Look at the stack at ${v} and every stack to its right.`,
        `Mira la pila del ${v} y todas las pilas a su derecha.`,
      ),
      lt: pair(
        `Look at the stacks to the left of ${v}. The stack at ${v} itself is not counted.`,
        `Mira las pilas a la izquierda del ${v}. La pila del ${v} no se cuenta.`,
      ),
      le: pair(
        `Look at the stack at ${v} and every stack to its left.`,
        `Mira la pila del ${v} y todas las pilas a su izquierda.`,
      ),
    })[cmp];

  /** Statements for the "which is true?" item. Each has a spec so check() can judge it again from the data. */
  const dotStatements = (rng, s) => {
    const { c, counts, k, n, top, at } = s;
    const cols = counts.map((_, i) => i);
    const peak = counts.indexOf(top);
    const j = rng.pick(cols.filter((i) => counts[i] >= 1 && i !== peak));
    const g = rng.pick(cols.slice(1, -1).filter((i) => counts[i] >= 1));
    const gtN = sum(colsFor("gt", g, k).map((i) => counts[i]));
    const geN = sum(colsFor("ge", g, k).map((i) => counts[i]));
    const ltN = sum(colsFor("lt", g, k).map((i) => counts[i]));
    const nb = counts[j + 1] ?? counts[j - 1];
    const [lo, hi] = until(
      () => pick2(rng, cols, 2).sort((a, b) => a - b),
      ([a, b]) => counts[a] > counts[b],
    );
    const cnt = (v) => s.data.filter((d) => d === v).length;
    const holds = (sp) =>
      ({
        count: () => cnt(sp.v) === sp.claim,
        swap: () => cnt(sp.at) === sp.claim,
        total: () => s.data.length === sp.claim,
        mode: () => sp.claim === at(peak),
        gt: () => s.data.filter((d) => d > sp.v).length === sp.claim,
        cmp: () => cnt(sp.a) > cnt(sp.b),
      })[sp.fam]();
    const T = (t, spec, why) => ({ t, spec, why });
    const F = (t, spec, tag, fb) => ({ t, spec, tag, fb });
    const sc = sentence(counts[j], c, "eq", at(j));
    const sg = sentence(gtN, c, "gt", at(g));
    const sgf = sentence(geN, c, "gt", at(g));
    const sw = sentence(at(j), c, "eq", counts[j]);
    const mkCmp = (a, b) =>
      pair(
        `More ${c.who[0][1]} ${c.verb[0]} ${c.val(a)[0]} than ${c.val(b)[0]}.`,
        `Más ${c.who[1][1]} ${c.verb[1]} ${c.val(a)[1]} que ${c.val(b)[1]}.`,
      );
    const trues = [
      T(
        sc,
        { fam: "count", v: at(j), claim: counts[j] },
        pair(
          `The stack above ${at(j)} has ${dN(counts[j])}.`,
          `La pila sobre el ${at(j)} tiene ${dNs(counts[j])}.`,
        ),
      ),
      T(
        pair(`There are ${n} ${c.who[0][1]} in all.`, `Hay ${n} ${c.who[1][1]} en total.`),
        { fam: "total", claim: n },
        pair(
          `Each dot is one ${c.who[0][0]}: ${counts.join(" + ")} = ${n}.`,
          `Cada punto es ${c.who[1][2] === "f" ? "una" : "un"} ${c.who[1][0]}: ${counts.join(" + ")} = ${n}.`,
        ),
      ),
      T(
        pair(`The most common value is ${f(at(peak))}.`, `El valor más común es ${f(at(peak))}.`),
        { fam: "mode", claim: at(peak) },
        pair(
          `The tallest stack, with ${top} dots, is above ${f(at(peak))}.`,
          `La pila más alta, con ${top} puntos, está sobre el ${f(at(peak))}.`,
        ),
      ),
      T(
        sg,
        { fam: "gt", v: at(g), claim: gtN },
        pair(
          `The stacks to the right of ${at(g)} have ${dN(gtN)} in all.`,
          `Las pilas a la derecha del ${at(g)} tienen ${dNs(gtN)} en total.`,
        ),
      ),
      T(
        mkCmp(at(lo), at(hi)),
        { fam: "cmp", a: at(lo), b: at(hi) },
        pair(
          `The stack at ${at(lo)} has ${dN(counts[lo])} and the stack at ${at(hi)} has ${dN(counts[hi])}.`,
          `La pila del ${at(lo)} tiene ${dNs(counts[lo])} y la del ${at(hi)} tiene ${dNs(counts[hi])}.`,
        ),
      ),
    ];
    const falses = [
      F(sw, { fam: "swap", at: counts[j], claim: at(j) }, "stat-swapped-value-count"),
      F(
        pair(`There are ${k} ${c.who[0][1]} in all.`, `Hay ${k} ${c.who[1][1]} en total.`),
        { fam: "total", claim: k },
        "stat-stacks-not-dots",
      ),
      F(
        pair(`The most common value is ${top}.`, `El valor más común es ${top}.`),
        { fam: "mode", claim: top },
        "stat-value-vs-frequency",
      ),
      F(sgf, { fam: "gt", v: at(g), claim: geN }, "stat-boundary-included"),
      F(sentence(nb, c, "eq", at(j)), { fam: "count", v: at(j), claim: nb }, "stat-wrong-column"),
      F(sentence(ltN, c, "gt", at(g)), { fam: "gt", v: at(g), claim: ltN }, "stat-wrong-direction"),
      F(mkCmp(at(hi), at(lo)), { fam: "cmp", a: at(hi), b: at(lo) }, "stat-value-not-count"),
    ];
    return {
      trues: trues.filter((t) => holds(t.spec)),
      falses: falses.filter(
        (x) =>
          !holds(x.spec) &&
          (x.spec.fam === "swap"
            ? s.onAxis(x.spec.at)
            : x.spec.fam === "mode"
              ? s.onAxis(x.spec.claim)
              : true),
      ),
    };
  };

  G.register("dotplotRead", {
    title: "Read a dot plot",
    titleEs: "Leer un diagrama de puntos",
    levels: 4,
    make(rng, level) {
      const s = dotSetup(rng, level, level === 4 && rng.chance(0.4));
      const { c, counts, k, n, data, viz, top, at } = s;
      const lead = dotLead(c, n);
      const metaOf = (kind, extra) => ({ kind, data, ...extra });
      const peak = counts.indexOf(top);
      const cols = counts.map((_, i) => i);

      /* L1: recognise -- read one stack, or name the most common value */
      if (level === 1) {
        if (rng.chance(0.5)) {
          const j = rng.pick(cols.filter((i) => counts[i] >= 2));
          const v = at(j);
          const cnt = counts[j];
          return MC(rng, {
            q: cat(lead, hm(c, pred(c, "eq", v))),
            right: String(cnt),
            wrong: [
              bad(v, "stat-frequency-vs-value"),
              ...[counts[j - 1], counts[j + 1]]
                .filter((x) => x !== undefined)
                .map((x) => bad(x, "stat-wrong-column")),
              bad(n, "stat-counted-all"),
              bad(cnt + 1, "stat-miscount"),
              bad(cnt - 1, "stat-miscount"),
              bad(top, "stat-wrong-column"),
              bad(cnt + 2, "stat-miscount"),
            ],
            x: pair(
              `Count the dots above ${v}. There are ${cnt}, so ${sentence(cnt, c, "eq", v)[0]}`,
              `Cuenta los puntos sobre el ${v}. Hay ${cnt}, así que ${sentence(cnt, c, "eq", v)[1]}`,
            ),
            h: [
              pair(
                "Find the number on the axis, then look straight up from it.",
                "Busca el número en el eje y mira hacia arriba desde él.",
              ),
              pair(
                "Each dot stands for one value. The stack above the number shows how many.",
                "Cada punto representa un valor. La pila sobre el número muestra cuántos hay.",
              ),
              pair(
                "Count the dots in that stack one at a time. Do not count the number on the axis.",
                "Cuenta los puntos de esa pila uno por uno. No cuentes el número del eje.",
              ),
            ],
            viz,
            meta: metaOf("count", { v }),
          });
        }
        const m = at(peak);
        return MC(rng, {
          q: cat(lead, mostCommonQ(c)),
          right: f(m),
          wrong: [
            ...(s.onAxis(top) ? [bad(top, "stat-value-vs-frequency")] : []),
            bad(at(k - 1), "stat-greatest-not-most"),
            bad(at(k >> 1), "stat-middle-not-most"),
            bad(at(0), "stat-least-not-most"),
            bad(at(Math.max(0, peak - 1)), "stat-wrong-column"),
            bad(at(Math.min(k - 1, peak + 1)), "stat-wrong-column"),
          ],
          x: pair(
            `The tallest stack, with ${top} dots, is above ${f(m)}. The most common value is ${f(m)}.`,
            `La pila más alta, con ${top} puntos, está sobre el ${f(m)}. El valor más común es ${f(m)}.`,
          ),
          h: [
            pair(
              "The most common value is the one that shows up the most times.",
              "El valor más común es el que aparece más veces.",
            ),
            pair(
              "On a dot plot, the value that shows up the most has the tallest stack of dots.",
              "En un diagrama de puntos, el valor que aparece más veces tiene la pila de puntos más alta.",
            ),
            pair(
              "Find the tallest stack, then read the number under it. The height of the stack is not the answer.",
              "Busca la pila más alta y lee el número que está debajo. La altura de la pila no es la respuesta.",
            ),
          ],
          viz,
          meta: metaOf("mode", {}),
        });
      }

      /* L2: grade level -- "more than", "at least", "fewer than", "at most" */
      if (level === 2) {
        const cmp = rng.pick(["gt", "ge", "lt", "le"]);
        const j = rng.int(1, k - 2);
        const v = at(j);
        const want = colsFor(cmp, j, k);
        const right = sum(want.map((i) => counts[i]));
        const total = (key) => sum(colsFor(key, j, k).map((i) => counts[i]));
        const next = cmp === "gt" || cmp === "ge" ? counts[j + 1] : counts[j - 1];
        const parts = want.map((i) => counts[i]);
        return ask(rng, rng.chance(0.55), {
          q: cat(lead, hm(c, pred(c, cmp, v))),
          a: right,
          cands: [
            bad(
              total(FLIP[cmp]),
              cmp === "gt" || cmp === "lt" ? "stat-boundary-included" : "stat-boundary-left-out",
            ),
            bad(total(OPP[cmp]), "stat-wrong-direction"),
            bad(next, "stat-one-stack-only"),
            bad(n, "stat-counted-all"),
            bad(counts[j], "stat-wrong-column"),
          ],
          x: pair(
            `Count the dots in the stacks the question asks about: ${parts.join(" + ")} = ${right}. So ${sentence(right, c, cmp, v)[0]}`,
            `Cuenta los puntos de las pilas que pide la pregunta: ${parts.join(" + ")} = ${right}. Así que ${sentence(right, c, cmp, v)[1]}`,
          ),
          h: [
            cmpHint(cmp, v),
            pair(
              "Count the dots in each of those stacks.",
              "Cuenta los puntos de cada una de esas pilas.",
            ),
            pair(
              "Start at the first stack in the group, then add the next stack. Stop when you reach the end of the group.",
              "Empieza con la primera pila del grupo y suma la siguiente. Detente cuando llegues al final del grupo.",
            ),
          ],
          viz,
          meta: metaOf("cmp", { cmp, v }),
        });
      }

      /* L3: multi-step -- compare two stacks, go past the most common value, or total the data */
      if (level === 3) {
        const kind = rng.pick(c.tot ? ["diff", "above", "total", "total"] : ["diff", "above"]);
        if (kind === "diff") {
          const [a, b] = until(
            () => pick2(rng, cols, 2),
            ([i, j]) => counts[i] > counts[j] && counts[j] >= 1,
          );
          const d = counts[a] - counts[b];
          return NUM({
            q: cat(
              lead,
              pair(
                `How many more ${c.who[0][1]} ${c.verb[0]} ${c.val(at(a))[0]} than ${c.val(at(b))[0]}?`,
                `${cuantos(c, true)} ${c.verb[1]} ${c.val(at(a))[1]} que ${c.val(at(b))[1]}?`,
              ),
            ),
            a: d,
            fw: [
              bad(counts[a] + counts[b], "stat-added-not-subtracted"),
              bad(Math.abs(at(a) - at(b)), "stat-frequency-vs-value"),
              bad(counts[a], "stat-one-stack-only"),
              bad(d + 1, "stat-miscount"),
            ],
            x: pair(
              `There are ${dotsN(counts[a])[0]} above ${at(a)} and ${dotsN(counts[b])[0]} above ${at(b)}. ${counts[a]} − ${counts[b]} = ${d}.`,
              `Hay ${dotsN(counts[a])[1]} sobre el ${at(a)} y ${dotsN(counts[b])[1]} sobre el ${at(b)}. ${counts[a]} − ${counts[b]} = ${d}.`,
            ),
            h: [
              pair(
                '"How many more" is a comparison. You will subtract.',
                '"Cuántos más" es una comparación. Vas a restar.',
              ),
              pair(
                "Count the dots in the first stack, then in the second stack.",
                "Cuenta los puntos de la primera pila y luego los de la segunda.",
              ),
              pair(
                "Write the two counts. Take the smaller count away from the larger count.",
                "Escribe las dos cantidades. Réstale la menor a la mayor.",
              ),
            ],
            viz,
            meta: metaOf("diff", { v: at(a), w: at(b) }),
          });
        }
        if (kind === "above") {
          const m = at(peak);
          const rightParts = counts.slice(peak + 1).filter((x) => x > 0);
          const right = sum(rightParts);
          return NUM({
            q: cat(
              lead,
              pair(
                `Find the most common value. How many ${c.who[0][1]} have a greater value than that?`,
                `Halla el valor más común. ${cuantos(c)} tienen un valor mayor que ese?`,
              ),
            ),
            a: right,
            fw: [
              bad(right + top, "stat-boundary-included"),
              bad(sum(counts.slice(0, peak)), "stat-wrong-direction"),
              bad(data.filter((d) => d > top).length, "stat-value-vs-frequency"),
              bad(counts[peak + 1] ?? 0, "stat-one-stack-only"),
            ],
            x: pair(
              `The tallest stack is above ${f(m)}, so the most common value is ${f(m)}. Count the dots to its right: ${rightParts.length > 1 ? `${rightParts.join(" + ")} = ` : ""}${right}.`,
              `La pila más alta está sobre el ${f(m)}, así que el valor más común es ${f(m)}. Cuenta los puntos a su derecha: ${rightParts.length > 1 ? `${rightParts.join(" + ")} = ` : ""}${right}.`,
            ),
            h: [
              pair(
                "Step 1: find the most common value. It has the tallest stack.",
                "Paso 1: halla el valor más común. Tiene la pila más alta.",
              ),
              pair(
                "Step 2: greater values are to the right of it on the axis.",
                "Paso 2: los valores mayores están a su derecha en el eje.",
              ),
              pair(
                "Count the dots in every stack to the right of the tallest stack. Do not count the tallest stack itself.",
                "Cuenta los puntos de todas las pilas a la derecha de la más alta. No cuentes la pila más alta.",
              ),
            ],
            viz,
            meta: metaOf("above", {}),
          });
        }
        const total = sum(data);
        const used = cols.filter((i) => counts[i]);
        return NUM({
          q: cat(lead, c.tot(n)),
          a: total,
          fw: [
            bad(sum(used.map((i) => at(i))), "stat-axis-sum"),
            bad(
              n,
              "stat-frequency-vs-value",
              `That is how many ${c.who[0][1]} there are, not the total of their values.`,
              `Eso es cuántos hay, no el total de sus valores.`,
            ),
            bad(total - at(k - 1) * counts[k - 1], "stat-stack-left-out"),
          ],
          x: pair(
            `Each dot is one value, so multiply each number by the dots above it and add: ${used.map((i) => `${f(at(i))} × ${counts[i]}`).join(" + ")} = ${f(total)}.`,
            `Cada punto es un valor, así que multiplica cada número por los puntos que tiene encima y suma: ${used.map((i) => `${f(at(i))} × ${counts[i]}`).join(" + ")} = ${f(total)}.`,
          ),
          h: [
            pair(
              "Each dot is one value. Three dots above a 2 mean 2 + 2 + 2.",
              "Cada punto es un valor. Tres puntos sobre un 2 significan 2 + 2 + 2.",
            ),
            pair(
              "For each stack, multiply the number on the axis by the number of dots above it.",
              "En cada pila, multiplica el número del eje por la cantidad de puntos que tiene encima.",
            ),
            pair(
              "Do the first stack, then the next one. When every stack is done, add the products.",
              "Haz la primera pila y luego la siguiente. Cuando termines todas las pilas, suma los productos.",
            ),
          ],
          viz,
          meta: metaOf("total", {}),
        });
      }

      /* L4: reverse and trap problems */
      const gapped = counts.slice(1, -1).some((x) => x === 0);
      const kind = rng.pick(
        gapped ? ["distinct", "statement", "add"] : ["statement", "add", "add"],
      );
      if (kind === "add") {
        const j = rng.pick(cols.filter((i) => counts[i] >= 1 && counts[i] < top));
        const v = at(j);
        const ans = top - counts[j] + 1;
        return NUM({
          q: cat(
            lead,
            pair(
              `More data are collected. How many more dots would have to be added above ${f(v)} so that ${f(v)} is the only most common value, with no tie?`,
              `Se reúnen más datos. ¿Cuántos puntos más habría que agregar sobre el ${f(v)} para que ${f(v)} sea el único valor más común, sin empate?`,
            ),
          ),
          a: ans,
          fw: [
            bad(top - counts[j], "stat-tie-not-most"),
            bad(
              top,
              "stat-value-vs-frequency",
              "That is the size of the tallest stack, not how many dots to add.",
              "Ese es el tamaño de la pila más alta, no cuántos puntos agregar.",
            ),
            bad(1, "stat-one-more-only"),
            bad(counts[j], "stat-current-not-needed"),
          ],
          x: pair(
            `The tallest stack has ${top} dots and the stack at ${f(v)} has ${dN(counts[j])}. Adding ${dN(top - counts[j])} only ties it, so add one more: ${ans}.`,
            `La pila más alta tiene ${top} puntos y la del ${f(v)} tiene ${dNs(counts[j])}. Agregar ${dNs(top - counts[j])} solo empata, así que se agrega uno más: ${ans}.`,
          ),
          h: [
            pair(
              "To be the only most common value, a stack must be taller than every other stack.",
              "Para ser el único valor más común, una pila debe ser más alta que todas las demás.",
            ),
            pair(
              "Find the tallest stack. Then count the dots in the stack you want to make taller.",
              "Busca la pila más alta. Luego cuenta los puntos de la pila que quieres hacer más alta.",
            ),
            pair(
              "First make the two stacks the same height. A tie is not enough, so think about one more dot.",
              "Primero haz que las dos pilas tengan la misma altura. Un empate no basta, así que piensa en un punto más.",
            ),
          ],
          viz,
          meta: metaOf("add", { v }),
        });
      }
      if (kind === "distinct") {
        const right = counts.filter((x) => x > 0).length;
        return MC(rng, {
          q: cat(
            lead,
            pair(
              `The axis shows ${k} numbers, but not every number has dots. How many different values are in the data?`,
              `El eje muestra ${k} números, pero no todos tienen puntos. ¿Cuántos valores diferentes hay en los datos?`,
            ),
          ),
          right: String(right),
          wrong: [
            bad(k, "stat-ticks-not-values"),
            bad(
              n,
              "stat-counted-all",
              "That counts every dot. Several dots can show the same value, and a value is counted once.",
              "Eso cuenta todos los puntos. Varios puntos pueden mostrar el mismo valor, y un valor se cuenta una sola vez.",
            ),
            bad(k - right, "stat-empty-not-used"),
            bad(right + 1, "stat-miscount"),
          ],
          x: pair(
            `Count the stacks, not the dots. ${right} numbers have dots, so there are ${right} different values.`,
            `Cuenta las pilas, no los puntos. ${right} números tienen puntos, así que hay ${right} valores diferentes.`,
          ),
          h: [
            pair(
              "A value is different from another value when its number is not the same.",
              "Un valor es diferente de otro cuando su número no es el mismo.",
            ),
            pair(
              "Each stack of dots shows one value. A number with no dots is not in the data.",
              "Cada pila de puntos muestra un valor. Un número sin puntos no está en los datos.",
            ),
            pair(
              "Go along the axis and count only the numbers that have a stack of dots above them.",
              "Recorre el eje y cuenta solo los números que tienen una pila de puntos encima.",
            ),
          ],
          viz,
          meta: metaOf("distinct", {}),
        });
      }
      /* statements: exactly one is true; each false one is a named slip */
      const { trues, falses } = dotStatements(rng, s);
      const t1 = rng.pick(trues);
      const rest = rng.shuffle(falses);
      const f3 = [
        ...rest.filter((x) => x.spec.fam !== t1.spec.fam),
        ...rest.filter((x) => x.spec.fam === t1.spec.fam),
      ].slice(0, 3);
      const it = MC(rng, {
        q: cat(lead, pair("Which statement is true?", "¿Qué enunciado es verdadero?")),
        right: t1.t,
        wrong: f3.map((x) => bad(x.t, x.tag)),
        x: pair(
          `${t1.why[0]} So this statement is true.`,
          `${t1.why[1]} Así que este enunciado es verdadero.`,
        ),
        h: [
          pair(
            "Test one statement at a time. Find the stack it talks about.",
            "Prueba un enunciado a la vez. Busca la pila de la que habla.",
          ),
          pair(
            "Remember: the number under a stack is the value, and the number of dots is how many.",
            "Recuerda: el número debajo de una pila es el valor y la cantidad de puntos es cuántos hay.",
          ),
          pair(
            "Count the dots for any stack a statement mentions. Cross out statements that do not match your count.",
            "Cuenta los puntos de cada pila que mencione un enunciado. Tacha los que no coincidan con tu conteo.",
          ),
        ],
        viz,
        meta: metaOf("stmt", {}),
      });
      const specs = new Map([
        [t1.t[0], t1.spec],
        ...f3.map((x) => /** @type {[any, any]} */ ([x.t[0], x.spec])),
      ]);
      it.meta.specs = it.c.map((txt) => specs.get(txt));
      return it;
    },
    check(it) {
      const m = it.meta;
      const d = m.data;
      const cnt = (x) => d.filter((v) => v === x).length;
      const distinct = [...new Set(d)];
      const topCount = Math.max(...distinct.map(cnt));
      const modeOf = distinct.find((v) => cnt(v) === topCount);
      switch (m.kind) {
        case "count":
          return verdict(it, cnt(m.v), "count at value");
        case "mode":
          return verdict(it, modeOf, "most common value");
        case "cmp": {
          const test = {
            gt: (x) => x > m.v,
            ge: (x) => x >= m.v,
            lt: (x) => x < m.v,
            le: (x) => x <= m.v,
          }[m.cmp];
          return verdict(it, d.filter(test).length, "comparison count");
        }
        case "diff":
          return verdict(it, cnt(m.v) - cnt(m.w), "difference of two stacks");
        case "above":
          return verdict(
            it,
            d.filter((v) => v > modeOf).length,
            "dots above the most common value",
          );
        case "total":
          return verdict(
            it,
            distinct.reduce((s, v) => s + v * cnt(v), 0),
            "total of the data",
          );
        case "add": {
          const rival = Math.max(...distinct.filter((v) => v !== m.v).map(cnt));
          return verdict(it, rival - cnt(m.v) + 1, "dots to add");
        }
        case "distinct":
          return verdict(it, distinct.length, "different values");
        case "stmt": {
          const truth = m.specs.map((sp) => {
            if (sp.fam === "count") return cnt(sp.v) === sp.claim;
            if (sp.fam === "swap") return cnt(sp.at) === sp.claim;
            if (sp.fam === "total") return d.length === sp.claim;
            if (sp.fam === "mode")
              return distinct.every((v) => v === sp.claim || cnt(v) < cnt(sp.claim));
            if (sp.fam === "gt") return d.filter((v) => v > sp.v).length === sp.claim;
            return cnt(sp.a) > cnt(sp.b);
          });
          const trues = truth.filter(Boolean).length;
          if (trues !== 1) return `${trues} statements are true, expected exactly 1`;
          return truth[it.a] || "the keyed statement is not the true one";
        }
        default:
          return `unknown kind ${m.kind}`;
      }
    },
  });

  /* ======================================================================================== */
  /* histogramRead: bar heights, totals, "at least", the median interval, what a histogram hides  */
  /* ======================================================================================== */

  /** Value and range phrases for a measure: "30 points" / "from 30 to 39 points". */
  const unitFns = (uEn, uEs, tEn = "", tEs = "") => ({
    val: (v) => pair(`${v} ${uEn}${tEn}`, `${v} ${uEs}${tEs}`),
    rg: (a, b) => pair(`from ${a} to ${b} ${uEn}${tEn}`, `de ${a} a ${b} ${uEs}${tEs}`),
  });
  /** start / w: first interval and its width. kMin..kMax: how many bars. */
  const HIST = [
    {
      id: "score",
      start: 20,
      w: 5,
      kMin: 5,
      kMax: 6,
      cnt: 1,
      who: STUDENTS,
      intro: (n) =>
        pair(
          `${n} students took a 50-point test`,
          `${n} estudiantes hicieron un examen de 50 puntos`,
        ),
      axis: pair("Test score (points)", "Puntaje del examen (puntos)"),
      verb: pair("scored", "obtuvieron"),
      verb1: pair("scored", "obtuvo"),
      ...unitFns("points", "puntos"),
    },
    {
      id: "homework",
      start: 0,
      w: 15,
      kMin: 4,
      kMax: 5,
      who: STUDENTS,
      intro: (n) =>
        pair(
          `${n} students timed their homework last night`,
          `${n} estudiantes midieron el tiempo de su tarea anoche`,
        ),
      axis: pair("Minutes on homework", "Minutos de tarea"),
      verb: pair("spent", "dedicaron"),
      verb1: pair("spent", "dedicó"),
      ...unitFns("minutes", "minutos", " on homework", " a la tarea"),
    },
    {
      id: "plant",
      start: 10,
      w: 10,
      kMin: 4,
      kMax: 5,
      who: [
        ["plant", "plants"],
        ["planta", "plantas", "f"],
      ],
      intro: (n) =>
        pair(
          `${n} sunflower plants were measured in a school garden`,
          `Se midieron ${n} girasoles en el huerto de la escuela`,
        ),
      axis: pair("Plant height (cm)", "Altura de la planta (cm)"),
      verb: pair("are", "miden"),
      verb1: pair("is", "mide"),
      ...unitFns("cm", "cm", " tall", ""),
    },
    {
      id: "points",
      start: 40,
      w: 10,
      kMin: 4,
      kMax: 5,
      cnt: 1,
      who: [
        ["game", "games"],
        ["partido", "partidos", "m"],
      ],
      intro: (n) =>
        pair(
          `A basketball team's points were recorded for ${n} games`,
          `Se anotaron los puntos de un equipo de baloncesto en ${n} partidos`,
        ),
      axis: pair("Points scored", "Puntos anotados"),
      verb: pair("had", "tuvieron"),
      verb1: pair("had", "tuvo"),
      ...unitFns("points", "puntos"),
    },
    {
      id: "commute",
      start: 0,
      w: 10,
      kMin: 4,
      kMax: 5,
      who: STUDENTS,
      intro: (n) =>
        pair(
          `${n} students told how many minutes it takes them to get to school`,
          `${n} estudiantes dijeron cuántos minutos tardan en llegar a la escuela`,
        ),
      axis: pair("Minutes to get to school", "Minutos para llegar a la escuela"),
      verb: pair("travel", "tardan"),
      verb1: pair("travels", "tarda"),
      ...unitFns("minutes", "minutos"),
    },
    {
      id: "plane",
      start: 10,
      w: 10,
      kMin: 4,
      kMax: 5,
      who: [
        ["paper plane", "paper planes"],
        ["avión de papel", "aviones de papel", "m"],
      ],
      intro: (n) =>
        pair(
          `${n} paper planes were test-flown in the gym`,
          `Se probaron ${n} aviones de papel en el gimnasio`,
        ),
      axis: pair("Distance flown (feet)", "Distancia recorrida (pies)"),
      verb: pair("flew", "recorrieron"),
      verb1: pair("flew", "recorrió"),
      ...unitFns("feet", "pies"),
    },
  ];
  // the predicate builder reads c.val(v); histogram contexts already carry it
  const hrange = (h, a, b, one) => {
    const [re, rs] = h.rg(a, b);
    const vb = one ? h.verb1 : h.verb;
    return pair(`${vb[0]} ${re}`, `${vb[1]} ${rs}`);
  };

  /** Bar heights for k bars adding to `total`: one unique peak, every bar used (an inner bar may be 0 if gap). */
  const barCounts = (rng, k, total, gap) =>
    until(
      () => {
        const p = rng.int(0, k - 1);
        const slope = 0.45 + rng.next() * 0.5;
        const w = Array.from(
          { length: k },
          (_, i) => slope ** Math.abs(i - p) * (0.8 + rng.next() * 0.4),
        );
        const ws = sum(w);
        const c = w.map((x) => Math.max(1, Math.round((x / ws) * total)));
        for (let guard = 0; sum(c) !== total && guard < 200; guard++) {
          const i = rng.int(0, k - 1);
          const d = sum(c) < total ? 1 : -1;
          if (c[i] + d >= 1) c[i] += d;
        }
        if (gap) c[rng.int(1, k - 2)] = 0;
        return c;
      },
      (c) => {
        const top = Math.max(...c);
        return (
          sum(c) === total &&
          top <= 20 &&
          c.filter((x) => x === top).length === 1 &&
          (!gap || sum(c) === total)
        );
      },
    );

  const histSetup = (rng, total, gap) => {
    const h = rng.pick(HIST);
    const k = rng.int(h.kMin, h.kMax);
    const counts = barCounts(rng, k, total, gap);
    const bins = counts.map((n, i) => ({
      from: h.start + i * h.w,
      to: h.start + i * h.w + h.w - 1,
      n,
    }));
    const N = sum(counts);
    const top = Math.max(...counts);
    return {
      h,
      k,
      counts,
      bins,
      N,
      top,
      peak: counts.indexOf(top),
      lab: bins.map((b) => `${b.from}–${b.to}`),
      viz: {
        t: "hist",
        bins,
        xlabel: h.axis[0],
        xlabelEs: h.axis[1],
        ylabel: `Number of ${h.who[0][1]}`,
        ylabelEs: `Número de ${h.who[1][1]}`,
      },
    };
  };
  const histLead = (h, n) => {
    const [ie, is] = h.intro(n);
    return pair(
      `${ie}. The histogram shows how many are in each interval.`,
      `${is}. El histograma muestra cuántos hay en cada intervalo.`,
    );
  };
  /** Pull the bars [i, j] out of the counts. */
  const span = (counts, i, j) => sum(counts.slice(i, j + 1));

  G.register("histogramRead", {
    title: "Read a histogram",
    titleEs: "Leer un histograma",
    levels: 4,
    make(rng, level) {
      const kind4 = level === 4 ? rng.pick(["claim", "tie", "complement"]) : "";
      const kind3 = level === 3 ? rng.pick(["percent", "diff"]) : "";
      const total =
        kind3 === "percent" || kind4 === "complement" ? rng.pick([20, 25, 50]) : rng.int(20, 36);
      const s = until(
        () => histSetup(rng, total, false),
        (x) => x.N === total,
      );
      const { h, k, counts, bins, N, top, peak, lab, viz } = s;
      const lead = histLead(h, N);
      const metaOf = (kind, extra) => ({ kind, bins, ...extra });
      const hmI = (j) => hm(h, hrange(h, bins[j].from, bins[j].to));
      const lastUsed = counts.length - 1 - [...counts].reverse().findIndex((x) => x > 0);

      /* L1: recognise -- read one bar, or name the tallest bar */
      if (level === 1) {
        if (rng.chance(0.5)) {
          const j = rng.int(0, k - 1);
          const cnt = counts[j];
          return MC(rng, {
            q: cat(lead, hmI(j)),
            right: String(cnt),
            wrong: [
              bad(bins[j].from, "stat-frequency-vs-value"),
              ...[counts[j - 1], counts[j + 1]]
                .filter((x) => x !== undefined)
                .map((x) => bad(x, "stat-wrong-column")),
              bad(N, "stat-counted-all"),
              bad(cnt + 1, "stat-miscount"),
              bad(top, "stat-wrong-column"),
              bad(cnt - 1, "stat-miscount"),
              bad(cnt + 2, "stat-miscount"),
            ],
            x: pair(
              `The bar for ${lab[j]} is ${cnt} tall. That means ${cnt} ${h.who[0][cnt === 1 ? 0 : 1]} are in that interval.`,
              `La barra de ${lab[j]} mide ${cnt} de alto. Eso significa que hay ${cnt} ${h.who[1][cnt === 1 ? 0 : 1]} en ese intervalo.`,
            ),
            h: [
              pair(
                "Find the bar for the interval in the question. Look at its two numbers under the bar.",
                "Busca la barra del intervalo de la pregunta. Mira sus dos números debajo de la barra.",
              ),
              pair(
                "The height of the bar tells how many. Follow the top of the bar across to the side scale.",
                "La altura de la barra dice cuántos hay. Sigue la parte de arriba de la barra hasta la escala del lado.",
              ),
              pair(
                "Read the number on the side scale. Do not read the numbers under the bar; those name the interval.",
                "Lee el número de la escala del lado. No leas los números debajo de la barra; esos nombran el intervalo.",
              ),
            ],
            viz,
            meta: metaOf("bar", { from: bins[j].from }),
          });
        }
        return MC(rng, {
          q: cat(
            lead,
            pair(
              `Which interval has the most ${h.who[0][1]}?`,
              `¿Qué intervalo tiene más ${h.who[1][1]}?`,
            ),
          ),
          right: lab[peak],
          wrong: [
            bad(
              String(top),
              "stat-value-vs-frequency",
              "That is how tall the tallest bar is. The question asks for the interval under it.",
              "Eso es qué tan alta es la barra más alta. La pregunta pide el intervalo que está debajo.",
            ),
            bad(lab[counts.indexOf(Math.min(...counts))], "stat-shortest-not-tallest"),
            ...[lab[peak - 1], lab[peak + 1]]
              .filter(Boolean)
              .map((x) => bad(x, "stat-wrong-column")),
            bad(lab[0], "stat-wrong-column"),
            bad(lab[k - 1], "stat-wrong-column"),
          ],
          x: pair(
            `The tallest bar is ${top} tall and sits over ${lab[peak]}. That interval has the most ${h.who[0][1]}.`,
            `La barra más alta mide ${top} y está sobre ${lab[peak]}. Ese intervalo tiene más ${h.who[1][1]}.`,
          ),
          h: [
            pair(
              "The interval with the most is the one with the tallest bar.",
              "El intervalo con más es el que tiene la barra más alta.",
            ),
            pair(
              "Find the tallest bar. Then read the two numbers under it.",
              "Busca la barra más alta. Luego lee los dos números que tiene debajo.",
            ),
            pair(
              "The answer is an interval (two numbers), not the height of the bar.",
              "La respuesta es un intervalo (dos números), no la altura de la barra.",
            ),
          ],
          viz,
          meta: metaOf("peak", {}),
        });
      }

      /* L2: grade level -- add bars: the total, "at least", "fewer than", or a span of two or three bars */
      if (level === 2) {
        const kind = rng.pick(["total", "split", "split", "span"]);
        if (kind === "total") {
          return ask(rng, rng.chance(0.4), {
            q: cat(
              lead,
              pair(
                `How many ${h.who[0][1]} are shown in all?`,
                `¿Cuántos ${h.who[1][1]} se muestran en total?`,
              ),
            ),
            a: N,
            cands: [
              bad(top, "stat-one-bar-only"),
              bad(k, "stat-bars-not-values"),
              bad(N - counts[k - 1], "stat-bar-left-out"),
              bad(N - counts[0], "stat-bar-left-out"),
              bad(N + 1, "stat-miscount"),
              bad(N - 1, "stat-miscount"),
            ],
            x: pair(
              `Each bar tells how many are in its interval. Add every bar: ${counts.join(" + ")} = ${N}.`,
              `Cada barra dice cuántos hay en su intervalo. Suma todas las barras: ${counts.join(" + ")} = ${N}.`,
            ),
            h: [
              pair(
                "Every value falls in exactly one interval, so every bar counts.",
                "Cada valor cae en un solo intervalo, así que cuenta cada barra.",
              ),
              pair(
                "Read the height of each bar from the side scale.",
                "Lee la altura de cada barra en la escala del lado.",
              ),
              pair(
                "Write the height of the first bar, then add the next bar, and keep going to the last bar.",
                "Escribe la altura de la primera barra, suma la siguiente y sigue hasta la última barra.",
              ),
            ],
            viz,
            meta: metaOf("total", {}),
          });
        }
        if (kind === "split") {
          const cmp = rng.pick(["ge", "lt"]);
          const j = rng.int(1, k - 1);
          const X = bins[j].from;
          const right = cmp === "ge" ? span(counts, j, k - 1) : span(counts, 0, j - 1);
          const other = cmp === "ge" ? span(counts, 0, j - 1) : span(counts, j, k - 1);
          const extra = cmp === "ge" ? right + counts[j - 1] : right + counts[j];
          const parts = cmp === "ge" ? counts.slice(j) : counts.slice(0, j);
          return ask(rng, rng.chance(0.55), {
            q: cat(lead, hm(h, pred(h, cmp, X))),
            a: right,
            cands: [
              bad(
                extra,
                "stat-extra-bar",
                `This adds the bar next to the group. ${cmp === "ge" ? '"At least"' : '"Fewer than"'} ${X} stops at the edge of an interval.`,
                `Esto suma la barra que está junto al grupo. ${cmp === "ge" ? '"Al menos"' : '"Menos de"'} ${X} se detiene en el borde de un intervalo.`,
              ),
              bad(other, "stat-wrong-direction"),
              bad(cmp === "ge" ? counts[j] : counts[j - 1], "stat-one-bar-only"),
              bad(N, "stat-counted-all"),
            ],
            x: pair(
              `${cmp === "ge" ? `The intervals from ${X} on` : `The intervals below ${X}`} are ${parts.length > 1 ? parts.length : "one"} bar${parts.length > 1 ? "s" : ""}: ${parts.join(" + ")}${parts.length > 1 ? ` = ${right}` : ""}. So ${sentence(right, h, cmp, X)[0]}`,
              `${cmp === "ge" ? `Los intervalos desde ${X}` : `Los intervalos menores que ${X}`} son ${parts.length > 1 ? parts.length : "una"} barra${parts.length > 1 ? "s" : ""}: ${parts.join(" + ")}${parts.length > 1 ? ` = ${right}` : ""}. Así que ${sentence(right, h, cmp, X)[1]}`,
            ),
            h: [
              pair(
                `Find ${X} on the scale under the bars. It is where one interval ends and the next begins.`,
                `Busca el ${X} en la escala debajo de las barras. Ahí termina un intervalo y empieza el siguiente.`,
              ),
              pair(
                cmp === "ge"
                  ? "Take the bar that starts at that number and every bar to its right."
                  : "Take every bar to the left of the bar that starts at that number.",
                cmp === "ge"
                  ? "Toma la barra que empieza en ese número y todas las barras a su derecha."
                  : "Toma todas las barras a la izquierda de la barra que empieza en ese número.",
              ),
              pair(
                "Read each of those bars from the side scale, then add the heights.",
                "Lee cada una de esas barras en la escala del lado y luego suma las alturas.",
              ),
            ],
            viz,
            meta: metaOf("split", { cmp, X }),
          });
        }
        const m = rng.int(2, Math.min(3, k - 1));
        const i = rng.int(0, k - m);
        const j = i + m - 1;
        const a = bins[i].from;
        const b = bins[j].to;
        const right = span(counts, i, j);
        return ask(rng, rng.chance(0.55), {
          q: cat(lead, hm(h, hrange(h, a, b))),
          a: right,
          cands: [
            bad(counts[i], "stat-one-bar-only"),
            bad(counts[j], "stat-one-bar-only"),
            bad(right + (counts[j + 1] ?? counts[i - 1] ?? 0), "stat-extra-bar"),
            bad(N, "stat-counted-all"),
            bad(m, "stat-bars-not-values"),
          ],
          x: pair(
            `${a} to ${b} covers ${m} bars (${lab.slice(i, j + 1).join(", ")}). Add them: ${counts.slice(i, j + 1).join(" + ")} = ${right}.`,
            `De ${a} a ${b} hay ${m} barras (${lab.slice(i, j + 1).join(", ")}). Súmalas: ${counts.slice(i, j + 1).join(" + ")} = ${right}.`,
          ),
          h: [
            pair(
              `Find which bars sit between ${a} and ${b}. This range covers more than one interval.`,
              `Busca qué barras están entre ${a} y ${b}. Este rango cubre más de un intervalo.`,
            ),
            pair(
              "Read the height of each of those bars.",
              "Lee la altura de cada una de esas barras.",
            ),
            pair(
              "Add the heights of those bars only. Leave out the bars outside the range.",
              "Suma solo las alturas de esas barras. Deja fuera las barras que quedan fuera del rango.",
            ),
          ],
          viz,
          meta: metaOf("span", { a, b }),
        });
      }

      /* L3: multi-step -- percent of the data, difference of two bars (the median is lesson 2-3) */
      if (level === 3) {
        const kind = kind3;
        if (kind === "diff") {
          const lo = counts.indexOf(Math.min(...counts));
          const d = top - counts[lo];
          return NUM({
            q: cat(
              lead,
              pair(
                `How many more ${h.who[0][1]} are in the ${lab[peak]} interval than in the ${lab[lo]} interval?`,
                `¿Cuántos ${h.who[1][1]} más hay en el intervalo ${lab[peak]} que en el intervalo ${lab[lo]}?`,
              ),
            ),
            a: d,
            fw: [
              bad(top + counts[lo], "stat-added-not-subtracted"),
              bad(top, "stat-one-bar-only"),
              bad(Math.abs(bins[peak].from - bins[lo].from), "stat-frequency-vs-value"),
              bad(d + 1, "stat-miscount"),
            ],
            x: pair(
              `The ${lab[peak]} bar is ${top} tall and the ${lab[lo]} bar is ${counts[lo]} tall. ${top} − ${counts[lo]} = ${d}.`,
              `La barra ${lab[peak]} mide ${top} y la barra ${lab[lo]} mide ${counts[lo]}. ${top} − ${counts[lo]} = ${d}.`,
            ),
            h: [
              pair(
                '"How many more" is a comparison. You will subtract.',
                '"Cuántos más" es una comparación. Vas a restar.',
              ),
              pair(
                "Read the height of each of the two bars from the side scale.",
                "Lee la altura de cada una de las dos barras en la escala del lado.",
              ),
              pair(
                "Take the smaller height away from the larger height.",
                "Réstale la altura menor a la mayor.",
              ),
            ],
            viz,
            meta: metaOf("diff", {}),
          });
        }
        const cmp = rng.pick(["ge", "lt"]);
        const j = rng.int(1, k - 1);
        const X = bins[j].from;
        const part = cmp === "ge" ? span(counts, j, k - 1) : span(counts, 0, j - 1);
        const pct = (part / N) * 100;
        const pctOk = Number.isInteger(pct);
        return NUM({
          q: cat(
            lead,
            pair(
              `What percent of the ${h.who[0][1]} ${pred(h, cmp, X)[0]}?`,
              `¿Qué porcentaje de ${h.who[1][1]} ${pred(h, cmp, X)[1]}?`,
            ),
          ),
          a: f(pctOk ? pct : Math.round(pct * 10) / 10),
          unit: "%",
          fw: [
            bad(part, "stat-count-not-percent"),
            bad(f(part / N, 3), "stat-percent-no-100"),
            bad(((cmp === "ge" ? k - j : j) / k) * 100, "stat-bars-not-values"),
            bad(100 - pct, "stat-wrong-direction"),
          ],
          x: pair(
            `${part} of the ${N} ${h.who[0][1]} fit. ${part} ÷ ${N} = ${f(part / N, 3)}, which is ${f(pct)}%.`,
            `${part} de los ${N} ${h.who[1][1]} cumplen. ${part} ÷ ${N} = ${f(part / N, 3)}, que es ${f(pct)}%.`,
          ),
          h: [
            pair(
              "A percent compares a part with the whole, out of 100.",
              "Un porcentaje compara una parte con el todo, sobre 100.",
            ),
            pair(
              "First add the bars that fit to find the part. The whole is the total of all the bars.",
              "Primero suma las barras que cumplen para hallar la parte. El todo es el total de todas las barras.",
            ),
            pair(
              "Divide the part by the whole, then multiply by 100.",
              "Divide la parte entre el todo y luego multiplica por 100.",
            ),
          ],
          viz,
          meta: metaOf("percent", { cmp, X }),
        });
      }

      /* L4: what a histogram can and cannot tell you, a reverse count, and a two-step percent */
      const kind = kind4;
      if (kind === "tie") {
        const j = rng.pick(counts.map((_, i) => i).filter((i) => i !== peak));
        const ans = top - counts[j] + 1;
        return NUM({
          q: cat(
            lead,
            pair(
              `More ${h.who[0][1]} are added to the data. How many would have to be added to the ${lab[j]} interval so that its bar is the only tallest bar, with no tie?`,
              `Se agregan más ${h.who[1][1]} a los datos. ¿Cuántos habría que agregar al intervalo ${lab[j]} para que su barra sea la única más alta, sin empate?`,
            ),
          ),
          a: ans,
          fw: [
            bad(
              top - counts[j],
              "stat-tie-not-most",
              "That only ties the tallest bar. To be the only tallest bar, it must be taller.",
              "Eso solo empata con la barra más alta. Para ser la única más alta, debe ser más alta.",
            ),
            bad(
              top,
              "stat-value-vs-frequency",
              "That is the height of the tallest bar, not how many to add.",
              "Esa es la altura de la barra más alta, no cuántos agregar.",
            ),
            bad(
              1,
              "stat-one-more-only",
              "One more only works if that bar is already tied for tallest. Compare it with the tallest bar first.",
              "Uno más solo sirve si esa barra ya empata como la más alta. Primero compárala con la barra más alta.",
            ),
            bad(
              counts[j],
              "stat-current-not-needed",
              "That is how tall the bar is now, not how many to add.",
              "Esa es la altura actual de la barra, no cuántos agregar.",
            ),
          ],
          x: pair(
            `The tallest bar is ${top} and the ${lab[j]} bar is ${counts[j]}. Adding ${top - counts[j]} only ties it, so add one more: ${ans}.`,
            `La barra más alta mide ${top} y la barra ${lab[j]} mide ${counts[j]}. Agregar ${top - counts[j]} solo empata, así que se agrega uno más: ${ans}.`,
          ),
          h: [
            pair(
              "To be the only tallest bar, it must be taller than every other bar.",
              "Para ser la única más alta, debe ser más alta que todas las demás.",
            ),
            pair(
              "Compare the bar you want to grow with the tallest bar now.",
              "Compara la barra que quieres hacer crecer con la barra más alta ahora.",
            ),
            pair(
              "First make the two bars the same height. A tie is not enough, so think about one more.",
              "Primero haz que las dos barras tengan la misma altura. Un empate no basta, así que piensa en uno más.",
            ),
          ],
          viz,
          meta: metaOf("tie", { j }),
        });
      }
      if (kind === "complement") {
        const j = rng.int(0, k - 1);
        const part = N - counts[j];
        const pct = (part / N) * 100;
        const fine = Number.isInteger(pct);
        return NUM({
          q: cat(
            lead,
            pair(
              `What percent of the ${h.who[0][1]} are NOT in the ${lab[j]} interval?`,
              `¿Qué porcentaje de ${h.who[1][1]} NO está en el intervalo ${lab[j]}?`,
            ),
          ),
          a: f(fine ? pct : Math.round(pct * 10) / 10),
          unit: "%",
          fw: [
            bad((counts[j] / N) * 100, "stat-complement-missed"),
            bad(part, "stat-count-not-percent"),
            bad(counts[j], "stat-count-not-percent"),
            bad(f(part / N, 3), "stat-percent-no-100"),
          ],
          x: pair(
            `${counts[j]} of the ${N} are in the ${lab[j]} interval, so ${N} − ${counts[j]} = ${part} are not. ${part} ÷ ${N} = ${f(part / N, 3)}, which is ${f(pct)}%.`,
            `${counts[j]} de los ${N} están en el intervalo ${lab[j]}, así que ${N} − ${counts[j]} = ${part} no lo están. ${part} ÷ ${N} = ${f(part / N, 3)}, que es ${f(pct)}%.`,
          ),
          h: [
            pair(
              '"Not in" means all the others. You can add the other bars, or take this bar away from the total.',
              '"No está en" significa todos los demás. Puedes sumar las otras barras o restarle esta barra al total.',
            ),
            pair(
              "Find how many are not in the interval. The whole is still the total of all the bars.",
              "Halla cuántos no están en el intervalo. El todo sigue siendo el total de todas las barras.",
            ),
            pair(
              "Divide that number by the total, then multiply by 100.",
              "Divide ese número entre el total y luego multiplica por 100.",
            ),
          ],
          viz,
          meta: metaOf("complement", { j }),
        });
      }
      /* "Which statement can you tell is true?" -- one is sure, three are slips about what a bar means */
      const m = 2;
      const i = rng.int(0, k - m);
      const spanN = span(counts, i, i + m - 1);
      const inside = bins[peak].from + 2;
      const specs = {
        sure: {
          fam: "span",
          a: bins[i].from,
          b: bins[i + m - 1].to,
          claim: spanN,
        },
        exact: { fam: "exact", from: bins[peak].from, v: inside, claim: top },
        tall: { fam: "tall", claim: lab[peak] },
        bars: { fam: "bars", claim: k },
        one: { fam: "one", claim: top },
      };
      const texts = {
        sure: pair("", ""),
        exact: pair(
          `Exactly ${top} ${h.who[0][1]} ${pred(h, "eq", inside)[0]}.`,
          `Exactamente ${top} ${h.who[1][1]} ${pred(h, "eq", inside)[1]}.`,
        ),
        tall: pair(
          `The greatest value is in the ${lab[peak]} interval, because that bar is the tallest.`,
          `El valor mayor está en el intervalo ${lab[peak]}, porque esa barra es la más alta.`,
        ),
        bars: pair(`There are ${k} ${h.who[0][1]} in all.`, `Hay ${k} ${h.who[1][1]} en total.`),
        one: pair(`There are ${top} ${h.who[0][1]} in all.`, `Hay ${top} ${h.who[1][1]} en total.`),
      };
      texts.sure = pair(
        `${spanN} ${h.who[0][spanN === 1 ? 0 : 1]} ${hrange(h, bins[i].from, bins[i + m - 1].to, spanN === 1)[0]}.`,
        `${spanN} ${h.who[1][spanN === 1 ? 0 : 1]} ${hrange(h, bins[i].from, bins[i + m - 1].to, spanN === 1)[1]}.`,
      );
      const peakIsLast = peak === lastUsed;
      const falseSet = rng
        .shuffle([
          ["exact", "stat-bin-is-one-value"],
          ["bars", "stat-bars-not-values"],
          ["one", "stat-one-bar-only"],
          ...(peakIsLast ? [] : [["tall", "stat-tall-means-big"]]),
        ])
        .slice(0, 3);
      const it = MC(rng, {
        q: cat(
          lead,
          pair(
            "Which statement can you be sure is true from the histogram?",
            "¿Qué enunciado puedes asegurar que es verdadero con el histograma?",
          ),
        ),
        right: texts.sure,
        wrong: falseSet.map(([key, tag]) => bad(texts[key], tag)),
        x: pair(
          `The ${lab[i]} and ${lab[i + 1]} bars together hold ${counts[i]} + ${counts[i + 1]} = ${spanN}. A bar covers a whole interval, so the exact values inside it are not shown.`,
          `Las barras ${lab[i]} y ${lab[i + 1]} juntas tienen ${counts[i]} + ${counts[i + 1]} = ${spanN}. Una barra cubre un intervalo completo, así que no se muestran los valores exactos que hay dentro.`,
        ),
        h: [
          pair(
            "A histogram groups values into intervals. Ask what each bar really tells you.",
            "Un histograma agrupa los valores en intervalos. Pregúntate qué te dice realmente cada barra.",
          ),
          pair(
            "A bar tells how many values are in its interval. It does not tell the exact values.",
            "Una barra dice cuántos valores hay en su intervalo. No dice los valores exactos.",
          ),
          pair(
            "Test each statement. Keep the one you can check by reading bar heights alone.",
            "Prueba cada enunciado. Quédate con el que puedes comprobar solo leyendo las alturas de las barras.",
          ),
        ],
        viz,
        meta: metaOf("claim", {}),
      });
      const byText = new Map([
        [texts.sure[0], specs.sure],
        ...falseSet.map(([key]) => /** @type {[any, any]} */ ([texts[key][0], specs[key]])),
      ]);
      it.meta.specs = it.c.map((t) => byText.get(t));
      return it;
    },
    check(it) {
      const m = it.meta;
      const bins = m.bins;
      const inBins = (p) => bins.filter(p).reduce((s, b) => s + b.n, 0);
      const all = inBins(() => true);
      const label = (b) => `${b.from}–${b.to}`;
      switch (m.kind) {
        case "bar":
          return verdict(it, bins.find((b) => b.from === m.from).n, "bar height");
        case "peak": {
          const best = bins.reduce((a, b) => (b.n > a.n ? b : a));
          return verdictText(it, label(best), "tallest interval");
        }
        case "total":
          return verdict(it, all, "total of the bars");
        case "split":
          return verdict(
            it,
            m.cmp === "ge" ? inBins((b) => b.from >= m.X) : inBins((b) => b.to < m.X),
            "bars at least / fewer than",
          );
        case "span":
          return verdict(
            it,
            inBins((b) => b.from >= m.a && b.to <= m.b),
            "span of bars",
          );
        case "diff": {
          const ns = bins.map((b) => b.n);
          return verdict(it, Math.max(...ns) - Math.min(...ns), "tallest minus shortest");
        }
        case "percent": {
          const part = m.cmp === "ge" ? inBins((b) => b.from >= m.X) : inBins((b) => b.to < m.X);
          return verdict(it, (100 * part) / all, "percent");
        }
        case "tie": {
          const rival = Math.max(...bins.filter((_, i) => i !== m.j).map((b) => b.n));
          return verdict(it, rival - bins[m.j].n + 1, "bars to tie and beat");
        }
        case "complement":
          return verdict(it, (100 * (all - bins[m.j].n)) / all, "percent not in the interval");
        case "claim": {
          const ns = bins.map((b) => b.n);
          const lastNonEmpty = ns.map((n, i) => (n > 0 ? i : -1)).reduce((a, b) => Math.max(a, b));
          const truth = m.specs.map((sp) => {
            if (sp.fam === "span")
              return inBins((b) => b.from >= sp.a && b.to <= sp.b) === sp.claim;
            if (sp.fam === "exact") return bins[0].to - bins[0].from === 0;
            if (sp.fam === "tall") return label(bins[lastNonEmpty]) === sp.claim;
            return bins.length === all;
          });
          const trues = truth.filter(Boolean).length;
          if (trues !== 1) return `${trues} statements are guaranteed, expected exactly 1`;
          return truth[it.a] || "the keyed statement is not the guaranteed one";
        }
        default:
          return `unknown kind ${m.kind}`;
      }
    },
  });

  /* ======================================================================================== */
  /* medianFind                                                                                   */
  /* ======================================================================================== */

  /** "7 students told how many pets they have at home (in order): 0, 1, 2." */
  const ctxList = (c, vals, ordered) => {
    const [ie, is] = c.intro(vals.length);
    return pair(
      `${ie}${ordered ? ", in order from least to greatest" : ""}: ${list(vals)}.`,
      `${is}${ordered ? ", en orden de menor a mayor" : ""}: ${list(vals)}.`,
    );
  };
  /** A list with a median that is not the mean, and (even counts) two different middle values. */
  const medList = (rng, c, n) =>
    until(
      () => drawVals(rng, c, n, 11),
      (v) => {
        const s = asc(v);
        return (
          new Set(v).size >= Math.min(n - 1, 5) &&
          !near(mean(v), midOf(s)) &&
          (n % 2 === 1 || s[n / 2 - 1] !== s[n / 2])
        );
      },
    );
  const medHints = (even) => [
    pair(
      "The median is the middle number when the list is in order.",
      "La mediana es el número del medio cuando la lista está en orden.",
    ),
    pair(
      even
        ? "Put the numbers in order. With an even count there are two middle numbers; the median is halfway between them."
        : "Put the numbers in order from least to greatest, then find the middle place.",
      even
        ? "Ordena los números. Con una cantidad par hay dos números del medio; la mediana está a la mitad entre ellos."
        : "Ordena los números de menor a mayor y busca el lugar del medio.",
    ),
    pair(
      even
        ? "Cross off one number from each end, again and again, until two numbers are left."
        : "Cross off one number from each end, again and again, until one number is left.",
      even
        ? "Tacha un número de cada extremo, una y otra vez, hasta que queden dos números."
        : "Tacha un número de cada extremo, una y otra vez, hasta que quede un número.",
    ),
  ];
  const medX = (s, med) => {
    const n = s.length;
    return pair(
      n % 2
        ? `In order: ${list(s)}. The middle number is the median: ${f(med)}.`
        : `In order: ${list(s)}. The two middle numbers are ${f(s[n / 2 - 1])} and ${f(s[n / 2])}. Halfway between them is ${f(med)}.`,
      n % 2
        ? `En orden: ${list(s)}. El número del medio es la mediana: ${f(med)}.`
        : `En orden: ${list(s)}. Los dos números del medio son ${f(s[n / 2 - 1])} y ${f(s[n / 2])}. A la mitad entre ellos está ${f(med)}.`,
    );
  };
  const modeOfList = (a) => {
    const top = Math.max(...a.map((v) => freqOf(a, v)));
    const ms = [...new Set(a)].filter((v) => freqOf(a, v) === top);
    return top > 1 && ms.length === 1 ? ms[0] : null;
  };

  G.register("medianFind", {
    title: "Find the median",
    titleEs: "Hallar la mediana",
    levels: 4,
    make(rng, level) {
      const c = rng.pick(CTX);
      const meta = (kind, extra) => ({ kind, ...extra });

      /* L1: an ordered list with an odd count -- recognise the middle */
      if (level === 1) {
        const n = rng.pick([5, 7]);
        const v = asc(medList(rng, c, n));
        const med = midOf(v);
        const mo = modeOfList(v);
        return MC(rng, {
          q: cat(ctxList(c, v, true), pair("What is the median?", "¿Cuál es la mediana?")),
          right: f(med),
          wrong: [
            bad(f(mean(v), 1), "stat-mean-vs-median"),
            ...(mo !== null ? [bad(mo, "stat-mode-vs-median")] : []),
            bad((n + 1) / 2, "stat-position-not-value"),
            bad((v[0] + v[n - 1]) / 2, "stat-midrange"),
            bad(
              v[n - 1],
              "stat-midrange",
              "That is the greatest number. The median is the one in the middle of the list.",
              "Ese es el número mayor. La mediana es la que está en el medio de la lista.",
            ),
          ],
          x: medX(v, med),
          h: medHints(false),
          meta: meta("list", { data: v }),
        });
      }

      /* L2: an unordered list, odd or even count */
      if (level === 2) {
        const n = rng.pick([5, 6, 7, 8, 9]);
        const v = until(
          () => medList(rng, c, n),
          (x) => !near(midOf(x), midOf(asc(x))),
        );
        const s = asc(v);
        const med = midOf(s);
        const u = until(
          () => rng.shuffle(v),
          (x) => !near(midOf(x), med),
        );
        const h2 = n >> 1;
        return ask(rng, rng.chance(0.5), {
          q: cat(ctxList(c, u, false), pair("What is the median?", "¿Cuál es la mediana?")),
          a: f(med),
          cands: [
            bad(f(midOf(u)), "stat-no-order"),
            bad(f(mean(v), 1), "stat-mean-vs-median"),
            ...(n % 2 === 0
              ? [
                  bad(s[h2 - 1], "stat-one-middle"),
                  bad(s[h2], "stat-one-middle"),
                  bad(s[h2 - 1] + s[h2], "stat-sum-not-halved"),
                ]
              : []),
            bad((s[0] + s[n - 1]) / 2, "stat-midrange"),
          ],
          x: medX(s, med),
          h: medHints(n % 2 === 0),
          meta: meta("list", { data: u }),
        });
      }

      /* L3: unusual forms -- a dot plot, a frequency table, or a list with many repeats */
      if (level === 3) {
        const form = rng.pick(["dots", "table", "repeats"]);
        if (form === "repeats") {
          const n = rng.pick([9, 11, 13]);
          const v = until(
            () => drawVals(rng, c, n, 6),
            (x) => {
              const s = asc(x);
              const d = [...new Set(x)];
              return (
                d.length >= 4 &&
                n - d.length >= 3 &&
                !near(midOf(s), midOf(asc(d))) &&
                !near(mean(x), midOf(s))
              );
            },
          );
          const s = asc(v);
          const med = midOf(s);
          const u = scramble(rng, v, med);
          return MC(rng, {
            q: cat(ctxList(c, u, false), pair("What is the median?", "¿Cuál es la mediana?")),
            right: f(med),
            wrong: [
              bad(midOf(asc([...new Set(v)])), "stat-distinct-only"),
              bad(f(midOf(u)), "stat-no-order"),
              bad(f(mean(v), 1), "stat-mean-vs-median"),
              bad(modeOfList(v) ?? s[0], "stat-mode-vs-median"),
              bad((s[0] + s[n - 1]) / 2, "stat-midrange"),
            ],
            x: medX(s, med),
            h: medHints(false),
            meta: meta("list", { data: u }),
          });
        }
        const st = until(
          () => dotSetup(rng, 3, false),
          (x) => !near(midOf(x.data), mean(x.data)),
        );
        const { counts, data, at, k, top } = st;
        const med = midOf(data);
        const table = form === "table";
        const viz = table
          ? {
              t: "table",
              hd: [st.c.axis[0], "Frequency"],
              rows: counts.map((n, i) => [String(at(i)), String(n)]),
            }
          : st.viz;
        const lead = table
          ? pair(
              `${st.c.intro(data.length)[0]}. The table shows how many gave each answer.`,
              `${st.c.intro(data.length)[1]}. La tabla muestra cuántos dieron cada respuesta.`,
            )
          : dotLead(st.c, data.length);
        return ask(rng, form === "dots" && rng.chance(0.5), {
          q: cat(
            lead,
            pair(
              "What is the median of all the values?",
              "¿Cuál es la mediana de todos los valores?",
            ),
          ),
          a: f(med),
          cands: [
            table
              ? bad(midOf(counts.map((_, i) => at(i))), "stat-table-middle-row")
              : bad(at(k >> 1), "stat-axis-middle"),
            bad(at(counts.indexOf(top)), "stat-mode-vs-median"),
            bad(f(mean(data), 1), "stat-mean-vs-median"),
            table
              ? bad(midOf(asc(counts)), "stat-median-of-counts")
              : bad((at(0) + at(k - 1)) / 2, "stat-midrange"),
          ],
          x: pair(
            `There are ${data.length} values in all. Count up from the least. ${medX(data, med)[0]}`,
            `Hay ${data.length} valores en total. Cuenta desde el menor. ${medX(data, med)[1]}`,
          ),
          h: [
            pair(
              `Add up the ${table ? "frequencies" : "dots"} to find how many values there are. The median is in the middle of them.`,
              `Suma ${table ? "las frecuencias" : "los puntos"} para saber cuántos valores hay. La mediana está en el medio de ellos.`,
            ),
            pair(
              "Find the middle place (or the two middle places if the count is even).",
              "Halla el lugar del medio (o los dos lugares del medio si la cantidad es par).",
            ),
            pair(
              `Count up from the least value, ${table ? "row by row" : "stack by stack"}, until you reach the middle place.`,
              `Cuenta desde el valor menor, ${table ? "fila por fila" : "pila por pila"}, hasta llegar al lugar del medio.`,
            ),
          ],
          viz,
          meta: meta("list", { data }),
        });
      }

      /* L4: reverse and what-if -- find a missing number, or add a value and find the new median */
      if (rng.chance(0.5)) {
        const even = rng.chance(0.5);
        const step = () => rng.int(2, 5);
        const known = until(
          () => {
            const start = rng.int(6, 30);
            const ks = [start];
            for (let i = 1; i < (even ? 5 : 4); i++) ks.push(ks[i - 1] + step());
            return ks;
          },
          (ks) => (even ? ks[3] - ks[1] >= 3 : ks[2] - ks[1] >= 2),
        );
        const lowK = even ? known[1] : known[1];
        const highK = even ? known[3] : known[2];
        const x = even
          ? until(
              () => rng.int(lowK + 1, highK - 1),
              (v) => v !== known[2],
            )
          : rng.int(lowK + 1, highK - 1);
        const med = even ? (x + known[2]) / 2 : x;
        const u = rng.shuffle(known);
        const total = known.length + 1;
        return NUM({
          q: pair(
            `The median of ${total} numbers is ${f(med)}. ${total - 1} of the numbers are ${andL(u)[0]}. What is the missing number?`,
            `La mediana de ${total} números es ${f(med)}. ${total - 1} de los números son ${andL(u)[1]}. ¿Cuál es el número que falta?`,
          ),
          a: x,
          fw: [
            bad(f(mean(known), 1), "stat-average-of-known"),
            even
              ? bad(
                  med,
                  "stat-mean-as-missing",
                  "That is the median of the whole list, not the missing number. The missing number is one of the two middle numbers.",
                  "Esa es la mediana de toda la lista, no el número que falta. El número que falta es uno de los dos números del medio.",
                )
              : bad(
                  known[2],
                  "stat-wrong-column",
                  "That is a number you already know. The missing number goes in the middle place.",
                  "Ese es un número que ya conoces. El número que falta va en el lugar del medio.",
                ),
            bad(
              med * 2 - known[3],
              "stat-wrong-middle",
              "Check which two numbers are in the middle places once the missing number is in order.",
              "Fíjate cuáles dos números quedan en los lugares del medio cuando el número que falta está en orden.",
            ),
          ],
          x: pair(
            even
              ? `${total} numbers: the median is halfway between the 3rd and 4th numbers. ${f(med)} is between ${f(known[1])} and ${f(known[3])}, so the missing number is one of the two middle numbers, next to ${f(known[2])}. The two middle numbers add to 2 × ${f(med)} = ${f(2 * med)}, so the missing number is ${f(2 * med)} − ${f(known[2])} = ${x}.`
              : `${total} numbers: the median is the 3rd number. ${f(med)} falls between ${f(known[1])} and ${f(known[2])}, so the missing number must be the middle one. It is ${x}.`,
            even
              ? `${total} números: la mediana está a la mitad entre el 3.º y el 4.º. ${f(med)} está entre ${f(known[1])} y ${f(known[3])}, así que el número que falta es uno de los dos del medio, junto a ${f(known[2])}. Los dos números del medio suman 2 × ${f(med)} = ${f(2 * med)}, así que el que falta es ${f(2 * med)} − ${f(known[2])} = ${x}.`
              : `${total} números: la mediana es el 3.er número. ${f(med)} está entre ${f(known[1])} y ${f(known[2])}, así que el número que falta debe ser el del medio. Es ${x}.`,
          ),
          h: [
            pair(
              "Think about where the missing number goes when the list is in order.",
              "Piensa dónde va el número que falta cuando la lista está en orden.",
            ),
            pair(
              even
                ? "With 6 numbers the median is halfway between the 3rd and 4th numbers. Which of those could the missing number be?"
                : "With 5 numbers the median is the 3rd number. Is the median one of the numbers you were given?",
              even
                ? "Con 6 números la mediana está a la mitad entre el 3.º y el 4.º. ¿Cuál de ellos podría ser el número que falta?"
                : "Con 5 números la mediana es el 3.er número. ¿La mediana es uno de los números que te dieron?",
            ),
            pair(
              even
                ? "The two middle numbers add up to twice the median. One of them is already in the list."
                : "Put the numbers you know in order and see which place the median belongs in.",
              even
                ? "Los dos números del medio suman el doble de la mediana. Uno de ellos ya está en la lista."
                : "Ordena los números que conoces y mira en qué lugar encaja la mediana.",
            ),
          ],
          meta: meta("missing", { known, med }),
        });
      }
      const n = rng.pick([5, 6, 7]);
      const v = medList(rng, c, n);
      const s = asc(v);
      const extreme = rng.chance(0.5)
        ? s[n - 1] + rng.int(15, 30)
        : Math.max(1, s[0] - rng.int(5, 12));
      const all = asc([...v, extreme]);
      const nm = midOf(all);
      const om = midOf(s);
      const h2 = all.length >> 1;
      const odd2 = all.length % 2;
      return NUM({
        q: cat(
          ctxList(c, rng.shuffle(v), false),
          pair(
            `A new value of ${extreme} is added to the list. What is the new median?`,
            `Se agrega un valor nuevo de ${extreme} a la lista. ¿Cuál es la nueva mediana?`,
          ),
        ),
        a: f(nm),
        fw: [
          bad(f(om), "stat-median-unchanged"),
          bad(f((om + extreme) / 2), "stat-averaged-with-new-value"),
          ...(odd2 ? [] : [bad(all[h2 - 1], "stat-one-middle"), bad(all[h2], "stat-one-middle")]),
          bad(f(mean(all), 1), "stat-mean-vs-median"),
        ],
        x: pair(
          `With the new value the ordered list is ${list(all)}. ${odd2 ? `The middle number is the median: ${f(nm)}.` : `The two middle numbers are ${f(all[h2 - 1])} and ${f(all[h2])}, so the median is ${f(nm)}.`}`,
          `Con el valor nuevo la lista ordenada es ${list(all)}. ${odd2 ? `El número del medio es la mediana: ${f(nm)}.` : `Los dos números del medio son ${f(all[h2 - 1])} y ${f(all[h2])}, así que la mediana es ${f(nm)}.`}`,
        ),
        h: [
          pair(
            "Adding a value changes how many numbers there are, so the middle place moves.",
            "Agregar un valor cambia cuántos números hay, así que el lugar del medio se mueve.",
          ),
          pair(
            "Put the new value in its place in the ordered list.",
            "Coloca el valor nuevo en su lugar en la lista ordenada.",
          ),
          pair(
            "Count the numbers again and find the middle of the new list.",
            "Cuenta otra vez los números y busca el medio de la lista nueva.",
          ),
        ],
        meta: meta("added", { data: v, extreme }),
      });
    },
    check(it) {
      const m = it.meta;
      if (m.kind === "list") return verdict(it, medC(m.data), "median");
      if (m.kind === "added")
        return verdict(it, medC([...m.data, m.extreme]), "median after adding");
      // missing number: the key must work, and no other number (to the nearest half) may
      const ok = (x) => near(medC([...m.known, x]), m.med);
      const hits = [];
      for (let x = 0; x <= 80; x += 0.5) if (ok(x)) hits.push(x);
      if (hits.length !== 1) return `${hits.length} numbers fit, expected 1`;
      return (
        near(G.value(keyOf(it)), hits[0]) || `key says ${keyOf(it)} but the only fit is ${hits[0]}`
      );
    },
  });

  /* ======================================================================================== */
  /* meanFind, meanMissing                                                                        */
  /* ======================================================================================== */

  /** Fair-share stories. g: gender of the thing in Spanish. */
  const SHARE = [
    { hold: ["friends", "amigos"], thing: ["stickers", "calcomanías"], g: "f" },
    { hold: ["cousins", "primos"], thing: ["marbles", "canicas"], g: "f" },
    {
      hold: ["campers", "campistas"],
      thing: ["granola bars", "barras de granola"],
      g: "f",
    },
    {
      hold: ["classmates", "compañeros"],
      thing: ["trading cards", "tarjetas coleccionables"],
      g: "f",
    },
    { hold: ["neighbors", "vecinos"], thing: ["pencils", "lápices"], g: "m" },
    {
      hold: ["teammates", "compañeros de equipo"],
      thing: ["cookies", "galletas"],
      g: "f",
    },
  ];
  /** Running stories: intro sentence, unit, the repeated observation (sing, plural, ES article), usual range. */
  const MSTORY = [
    {
      intro: pair("Jada kept track of her piano practice.", "Jada anotó su práctica de piano."),
      unit: pair("minutes", "minutos"),
      obs: [
        ["day", "days"],
        ["día", "días", "el"],
      ],
      lo: 15,
      hi: 45,
    },
    {
      intro: pair(
        "A basketball team kept track of its scoring.",
        "Un equipo de baloncesto anotó sus puntos.",
      ),
      unit: pair("points", "puntos"),
      obs: [
        ["game", "games"],
        ["partido", "partidos", "el"],
      ],
      lo: 8,
      hi: 30,
    },
    {
      intro: pair("A class kept a reading log.", "Una clase llevó un registro de lectura."),
      unit: pair("books", "libros"),
      obs: [
        ["month", "months"],
        ["mes", "meses", "el"],
      ],
      lo: 5,
      hi: 20,
    },
    {
      intro: pair(
        "A weather station recorded the rain.",
        "Una estación meteorológica registró la lluvia.",
      ),
      unit: pair("mm of rain", "mm de lluvia"),
      obs: [
        ["month", "months"],
        ["mes", "meses", "el"],
      ],
      lo: 20,
      hi: 90,
    },
    {
      intro: pair("Marcus saved money from his allowance.", "Marcus ahorró dinero de su mesada."),
      unit: pair("dollars", "dólares"),
      obs: [
        ["week", "weeks"],
        ["semana", "semanas", "la"],
      ],
      lo: 5,
      hi: 30,
    },
    {
      intro: pair("Mei ran laps at track practice.", "Mei corrió vueltas en el entrenamiento."),
      unit: pair("laps", "vueltas"),
      obs: [
        ["practice", "practices"],
        ["entrenamiento", "entrenamientos", "el"],
      ],
      lo: 6,
      hi: 16,
    },
  ];
  const sHold = (sh, n, l) =>
    pair(
      `${n} ${sh.hold[0]} have ${andL(l)[0]} ${sh.thing[0]}.`,
      `${n} ${sh.hold[1]} tienen ${andL(l)[1]} ${sh.thing[1]}.`,
    );
  const meanSupport = [
    pair(
      "The mean is the total shared out equally.",
      "La media es el total repartido en partes iguales.",
    ),
    pair(
      "Add all the numbers to get the total, and count how many numbers there are.",
      "Suma todos los números para obtener el total y cuenta cuántos números hay.",
    ),
    pair(
      "Divide the total by how many numbers there are.",
      "Divide el total entre cuántos números hay.",
    ),
  ];

  G.register("meanFind", {
    title: "Find the mean",
    titleEs: "Hallar la media",
    levels: 4,
    make(rng, level) {
      const c = rng.pick(CTX);
      const meta = (kind, extra) => ({ kind, ...extra });
      const clean = (n, lo, hi, sp) => {
        const m = rng.int(lo + Math.min(2, (hi - lo) >> 2), hi - Math.min(2, (hi - lo) >> 2));
        return until(
          () => withMean(rng, n, m, sp, lo, hi),
          (v) => !near(midOf(asc(v)), m),
        );
      };
      const xMean = (v) =>
        pair(
          `Total: ${v.join(" + ")} = ${sum(v)}. There are ${v.length} numbers: ${sum(v)} ÷ ${v.length} = ${f(mean(v))}.`,
          `Total: ${v.join(" + ")} = ${sum(v)}. Hay ${v.length} números: ${sum(v)} ÷ ${v.length} = ${f(mean(v))}.`,
        );

      /* L1: the mean of a short list */
      if (level === 1) {
        const n = rng.pick([4, 5]);
        const v = clean(n, c.lo, c.hi, 3);
        const m = mean(v);
        const t = sum(v);
        const opts = [
          bad(t, "stat-summed-instead-of-averaged"),
          bad(midOf(asc(v)), "stat-median-for-mean"),
          ...[n - 1, n + 1].filter((d) => tidy(t / d)).map((d) => bad(t / d, "stat-wrong-divisor")),
          bad(Math.max(...v), "stat-greatest-not-mean"),
          bad(m + 1, "stat-miscount"),
        ];
        return MC(rng, {
          q: cat(ctxList(c, v, false), pair("What is the mean?", "¿Cuál es la media?")),
          right: f(m),
          wrong: opts,
          x: xMean(v),
          h: meanSupport,
          meta: meta("list", { data: v }),
        });
      }

      /* L2: shared equally */
      if (level === 2) {
        const sh = rng.pick(SHARE);
        const n = rng.int(3, 5);
        const v = until(
          () => clean(n, 2, 14, 4),
          () => true,
        );
        const m = mean(v);
        const q = cat(
          sHold(sh, n, v),
          pair(
            `They put them all together and share them equally. How many ${sh.thing[0]} does each one get?`,
            `Los juntan todos y los reparten en partes iguales. ¿${sh.g === "f" ? "Cuántas" : "Cuántos"} ${sh.thing[1]} recibe cada uno?`,
          ),
        );
        return ask(rng, rng.chance(0.5), {
          q,
          a: m,
          cands: [
            bad(sum(v), "stat-summed-instead-of-averaged"),
            bad(midOf(asc(v)), "stat-median-for-mean"),
            bad(Math.max(...v), "stat-greatest-not-mean"),
            ...[n - 1, n + 1]
              .filter((d) => tidy(sum(v) / d))
              .map((d) => bad(sum(v) / d, "stat-wrong-divisor")),
            bad(m + 1, "stat-miscount"),
          ],
          x: pair(
            `Put everything together: ${v.join(" + ")} = ${sum(v)}. Share it among ${n}: ${sum(v)} ÷ ${n} = ${m}.`,
            `Júntalo todo: ${v.join(" + ")} = ${sum(v)}. Repártelo entre ${n}: ${sum(v)} ÷ ${n} = ${m}.`,
          ),
          h: [
            pair(
              "Sharing equally means every one ends with the same amount.",
              "Repartir en partes iguales significa que todos terminan con la misma cantidad.",
            ),
            pair(
              "First put everything into one pile. How many are in the pile?",
              "Primero junta todo en una sola pila. ¿Cuántos hay en la pila?",
            ),
            pair(
              "Deal the pile out to the people one at a time. Divide the pile by the number of people.",
              "Reparte la pila entre las personas. Divide la pila entre el número de personas.",
            ),
          ],
          meta: meta("list", { data: v }),
        });
      }

      /* L3: a dot plot, or a list with zeros in it */
      if (level === 3) {
        if (rng.chance(0.5)) {
          const cc = rng.pick(CTX.filter((x) => x.st === 1 && x.hi - x.lo >= 5));
          const n = rng.int(10, 14);
          const m = rng.int(cc.lo + 2, cc.hi - 2);
          const v = asc(
            until(
              () => withMean(rng, n, m, 2, cc.lo, cc.hi),
              (x) =>
                Math.max(...x) - Math.min(...x) >= 3 &&
                Math.max(...x.map((y) => freqOf(x, y))) <= 7,
            ),
          );
          const used = [...new Set(v)];
          return NUM({
            q: cat(
              dotLead(cc, n),
              pair("What is the mean of the data?", "¿Cuál es la media de los datos?"),
            ),
            a: m,
            fw: [
              bad(f(mean(used), 1), "stat-mean-of-axis"),
              bad(midOf(v), "stat-median-for-mean"),
              bad(sum(v), "stat-summed-instead-of-averaged"),
              bad(
                f(sum(v) / used.length, 1),
                "stat-wrong-divisor",
                "You divided by the number of different values. Divide by the number of dots.",
                "Dividiste entre la cantidad de valores diferentes. Divide entre la cantidad de puntos.",
              ),
            ],
            x: pair(
              `Each dot is one value. Total: ${used.map((u) => `${u} × ${freqOf(v, u)}`).join(" + ")} = ${sum(v)}. There are ${n} dots: ${sum(v)} ÷ ${n} = ${m}.`,
              `Cada punto es un valor. Total: ${used.map((u) => `${u} × ${freqOf(v, u)}`).join(" + ")} = ${sum(v)}. Hay ${n} puntos: ${sum(v)} ÷ ${n} = ${m}.`,
            ),
            h: [
              pair(
                "Each dot is one value, and the mean uses every dot.",
                "Cada punto es un valor y la media usa todos los puntos.",
              ),
              pair(
                "Find the total: multiply each number by its dots, then add. Count all the dots.",
                "Halla el total: multiplica cada número por sus puntos y suma. Cuenta todos los puntos.",
              ),
              pair(
                "Divide the total by the number of dots, not by the number of columns.",
                "Divide el total entre la cantidad de puntos, no entre la cantidad de columnas.",
              ),
            ],
            viz: dotViz(cc, v, Math.min(...v), Math.max(...v)),
            meta: meta("list", { data: v }),
          });
        }
        const cc = rng.pick(CTX.filter((x) => x.lo === 0));
        const n = rng.pick([5, 6]);
        const m = rng.int(2, Math.max(3, cc.hi - 3));
        const v = until(
          () => withMean(rng, n, m, 3, 0, cc.hi),
          (x) => freqOf(x, 0) >= 1 && new Set(x).size >= 3 && !near(midOf(asc(x)), m),
        );
        const nz = v.filter((x) => x > 0).length;
        const u = rng.shuffle(v);
        return ask(rng, rng.chance(0.5), {
          q: cat(ctxList(cc, u, false), pair("What is the mean?", "¿Cuál es la media?")),
          a: m,
          cands: [
            bad(f(sum(v) / nz, 1), "stat-zero-left-out"),
            bad(sum(v), "stat-summed-instead-of-averaged"),
            bad(midOf(asc(v)), "stat-median-for-mean"),
            bad(f(sum(v) / (n + 1), 1), "stat-wrong-divisor"),
            bad(m + 1, "stat-miscount"),
          ],
          x: pair(
            `Total: ${v.join(" + ")} = ${sum(v)}. A zero is still a value, so there are ${n} numbers: ${sum(v)} ÷ ${n} = ${m}.`,
            `Total: ${v.join(" + ")} = ${sum(v)}. Un cero también es un valor, así que hay ${n} números: ${sum(v)} ÷ ${n} = ${m}.`,
          ),
          h: [
            pair(
              "Count every value, including the zeros.",
              "Cuenta todos los valores, incluidos los ceros.",
            ),
            pair(
              "Add the numbers for the total. Count how many numbers there are, zeros too.",
              "Suma los números para el total. Cuenta cuántos números hay, ceros incluidos.",
            ),
            pair("Divide the total by that count.", "Divide el total entre esa cantidad."),
          ],
          meta: meta("list", { data: v }),
        });
      }

      /* L4: totals from a mean, two groups, a value added */
      const st = rng.pick(MSTORY);
      const [o1, op] = st.obs[0];
      const [o1e, ope, art] = st.obs[1];
      const kind = rng.pick(["total", "groups", "added"]);
      if (kind === "total") {
        const n = rng.int(4, 12);
        const m = rng.int(Math.ceil(st.lo / 2), st.hi);
        return NUM({
          q: cat(
            st.intro,
            pair(
              `Over ${n} ${op}, the mean was ${m} ${st.unit[0]} per ${o1}. How many ${st.unit[0]} was that in all?`,
              `En ${n} ${ope}, la media fue de ${m} ${st.unit[1]} por ${o1e}. ¿Cuántos ${st.unit[1]} fueron en total?`,
            ),
          ),
          a: m * n,
          fw: [
            bad(f(m / n, 1), "stat-divided-not-multiplied"),
            bad(m + n, "stat-added-mean-count"),
            bad(m, "stat-mean-as-total"),
          ],
          x: pair(
            `The mean is the total shared equally, so total = mean × count = ${m} × ${n} = ${m * n}.`,
            `La media es el total repartido en partes iguales, así que total = media × cantidad = ${m} × ${n} = ${m * n}.`,
          ),
          h: [
            pair(
              "The mean is the total shared out equally over every one.",
              "La media es el total repartido en partes iguales entre todos.",
            ),
            pair(
              "Working backward: if the total is shared among the count, the total is the mean times the count.",
              "Al revés: si el total se reparte entre la cantidad, el total es la media por la cantidad.",
            ),
            pair(
              "Multiply the mean by how many there are.",
              "Multiplica la media por cuántos hay.",
            ),
          ],
          meta: meta("total", { m, n }),
        });
      }
      if (kind === "groups") {
        const fitsB = (x, y, a) =>
          Array.from({ length: st.hi - st.lo + 1 }, (_, i) => st.lo + i).filter(
            (b) => b !== a && (x * a + y * b) % (x + y) === 0,
          );
        const [n1, n2, m1] = until(
          () => [rng.int(2, 6), rng.int(2, 6), rng.int(st.lo, st.hi)],
          ([x, y, a]) => x !== y && fitsB(x, y, a).length > 0,
          1000,
        );
        const m2 = rng.pick(fitsB(n1, n2, m1));
        const ans = (n1 * m1 + n2 * m2) / (n1 + n2);
        return NUM({
          q: pair(
            `Group A has ${n1} students with a mean of ${m1} ${st.unit[0]}. Group B has ${n2} students with a mean of ${m2} ${st.unit[0]}. What is the mean for all ${n1 + n2} students together?`,
            `El grupo A tiene ${n1} estudiantes con una media de ${m1} ${st.unit[1]}. El grupo B tiene ${n2} estudiantes con una media de ${m2} ${st.unit[1]}. ¿Cuál es la media de los ${n1 + n2} estudiantes juntos?`,
          ),
          a: ans,
          fw: [
            bad(f((m1 + m2) / 2, 2), "stat-averaged-the-means"),
            bad(n1 * m1 + n2 * m2, "stat-summed-instead-of-averaged"),
            bad(m1 + m2, "stat-summed-instead-of-averaged"),
          ],
          x: pair(
            `Group A total: ${n1} × ${m1} = ${n1 * m1}. Group B total: ${n2} × ${m2} = ${n2 * m2}. Together: ${n1 * m1 + n2 * m2} ÷ ${n1 + n2} = ${ans}.`,
            `Total del grupo A: ${n1} × ${m1} = ${n1 * m1}. Total del grupo B: ${n2} × ${m2} = ${n2 * m2}. Juntos: ${n1 * m1 + n2 * m2} ÷ ${n1 + n2} = ${ans}.`,
          ),
          h: [
            pair(
              "The groups are different sizes, so a group with more students counts for more.",
              "Los grupos tienen tamaños distintos, así que un grupo con más estudiantes cuenta más.",
            ),
            pair(
              "Find each group's total: mean × number of students.",
              "Halla el total de cada grupo: media × cantidad de estudiantes.",
            ),
            pair(
              "Add the two totals, then divide by all the students.",
              "Suma los dos totales y divide entre todos los estudiantes.",
            ),
          ],
          meta: meta("groups", { n1, m1, n2, m2 }),
        });
      }
      const n = rng.int(4, 8);
      const m = rng.int(st.lo, st.hi - 2);
      const nv = until(
        () => rng.int(st.hi + 4, st.hi + 30),
        (x) => (n * m + x) % (n + 1) === 0,
      );
      const ans = (n * m + nv) / (n + 1);
      return NUM({
        q: cat(
          st.intro,
          pair(
            `Over ${n} ${op}, the mean was ${m} ${st.unit[0]} per ${o1}. On the next ${o1} it was ${nv} ${st.unit[0]}. What is the new mean for all ${n + 1} ${op}?`,
            `En ${n} ${ope}, la media fue de ${m} ${st.unit[1]} por ${o1e}. En ${art === "la" ? "la siguiente" : "el siguiente"} ${o1e} fue ${nv} ${st.unit[1]}. ¿Cuál es la nueva media de los ${n + 1} ${ope}?`,
          ),
        ),
        a: ans,
        fw: [
          bad(f((m + nv) / 2, 2), "stat-averaged-the-means"),
          bad(m, "stat-mean-unchanged"),
          bad(n * m + nv, "stat-summed-instead-of-averaged"),
          bad(f((n * m + nv) / n, 1), "stat-wrong-divisor"),
        ],
        x: pair(
          `Old total: ${n} × ${m} = ${n * m}. New total: ${n * m} + ${nv} = ${n * m + nv}. Now there are ${n + 1}: ${n * m + nv} ÷ ${n + 1} = ${ans}.`,
          `Total anterior: ${n} × ${m} = ${n * m}. Total nuevo: ${n * m} + ${nv} = ${n * m + nv}. Ahora hay ${n + 1}: ${n * m + nv} ÷ ${n + 1} = ${ans}.`,
        ),
        h: [
          pair(
            "A new value changes both the total and the count.",
            "Un valor nuevo cambia el total y la cantidad.",
          ),
          pair(
            "Use the old mean and count to find the old total.",
            "Usa la media y la cantidad anteriores para hallar el total anterior.",
          ),
          pair(
            "Add the new value to the old total, then divide by the new count.",
            "Suma el valor nuevo al total anterior y divide entre la nueva cantidad.",
          ),
        ],
        meta: meta("added", { n, m, nv }),
      });
    },
    check(it) {
      const m = it.meta;
      switch (m.kind) {
        case "list":
          return verdict(it, meanC(m.data), "mean");
        case "total":
          return verdict(it, meanC(Array(m.n).fill(m.m)) * m.n, "total from mean");
        case "groups":
          return verdict(
            it,
            meanC([...Array(m.n1).fill(m.m1), ...Array(m.n2).fill(m.m2)]),
            "combined mean",
          );
        default:
          return verdict(it, meanC([...Array(m.n).fill(m.m), m.nv]), "mean after adding");
      }
    },
  });

  G.register("meanMissing", {
    title: "Find the missing value",
    titleEs: "Hallar el valor que falta",
    levels: 4,
    make(rng, level) {
      const meta = (kind, extra) => ({ kind, ...extra });
      const st = rng.pick(MSTORY);
      const [o1, op] = st.obs[0];
      const [o1e, ope, art] = st.obs[1];
      const nthEs = (n) => `${art} ${o1e} ${n}`;
      const supp = [
        pair(
          "The mean tells the total: total = mean × how many numbers.",
          "La media indica el total: total = media × cuántos números hay.",
        ),
        pair(
          "Find the total the numbers must reach. Then add up the numbers you know.",
          "Halla el total que deben alcanzar los números. Luego suma los que conoces.",
        ),
        pair(
          "The missing number is the target total minus the total you already have.",
          "El número que falta es el total objetivo menos el total que ya tienes.",
        ),
      ];
      const slips = (known, t, n) => [
        bad(t, "stat-mean-as-missing"),
        bad(f(mean(known), 1), "stat-average-of-known"),
        bad(t * (n - 1) - sum(known), "stat-wrong-total"),
        bad(t * n, "stat-summed-instead-of-averaged"),
      ];

      /* L1: one missing number among three or four */
      if (level === 1) {
        const n = rng.pick([3, 4]);
        const t = rng.int(6, 20);
        const known = until(
          () => Array.from({ length: n - 1 }, () => rng.int(Math.max(1, t - 6), t + 6)),
          (v) => t * n - sum(v) >= 1 && t * n - sum(v) <= t + 10 && t * n - sum(v) !== t,
        );
        const x = t * n - sum(known);
        return MC(rng, {
          q: pair(
            `The mean of ${n} numbers is ${t}. ${n - 1} of the numbers are ${andL(known)[0]}. What is the other number?`,
            `La media de ${n} números es ${t}. ${n - 1} de los números son ${andL(known)[1]}. ¿Cuál es el otro número?`,
          ),
          right: String(x),
          wrong: slips(known, t, n),
          x: pair(
            `Total needed: ${n} × ${t} = ${t * n}. Known total: ${known.join(" + ")} = ${sum(known)}. Missing: ${t * n} − ${sum(known)} = ${x}.`,
            `Total necesario: ${n} × ${t} = ${t * n}. Total conocido: ${known.join(" + ")} = ${sum(known)}. Falta: ${t * n} − ${sum(known)} = ${x}.`,
          ),
          h: supp,
          meta: meta("missing", { known, t }),
        });
      }

      /* L2: a goal story, or evening out piles */
      if (level === 2) {
        if (rng.chance(0.35)) {
          const sh = rng.pick(SHARE);
          const n = rng.int(3, 5);
          const v = until(
            () => withMean(rng, n, rng.int(5, 12), 4, 2, 18),
            (x) => Math.max(...x) > mean(x) + 1,
          );
          const m = mean(v);
          const mx = Math.max(...v);
          return ask(rng, true, {
            q: cat(
              sHold(sh, n, v),
              pair(
                `The one with the most gives some away so that everyone has the same number. How many ${sh.thing[0]} does that one give away?`,
                `El que tiene más regala algunos para que todos tengan la misma cantidad. ¿${sh.g === "f" ? "Cuántas" : "Cuántos"} ${sh.thing[1]} regala?`,
              ),
            ),
            a: mx - m,
            cands: [
              bad(m, "stat-gave-the-mean"),
              bad(mx - Math.min(...v), "stat-gap-to-smallest"),
              bad(
                sum(v) - mx,
                "stat-others-total",
                "That is how many the others have together. The one with the most only gives away what is above the equal share.",
                "Eso es cuántos tienen los demás juntos. El que tiene más solo regala lo que está por encima de la parte igual.",
              ),
              bad(
                mx,
                "stat-keeps-share",
                "That is how many the biggest pile has now. It keeps the equal share.",
                "Eso es lo que tiene ahora la pila mayor. Se queda con la parte igual.",
              ),
            ],
            x: pair(
              `Equal share: ${sum(v)} ÷ ${n} = ${m}. The biggest has ${mx}, so it gives away ${mx} − ${m} = ${mx - m}.`,
              `Parte igual: ${sum(v)} ÷ ${n} = ${m}. El mayor tiene ${mx}, así que regala ${mx} − ${m} = ${mx - m}.`,
            ),
            h: [
              pair(
                "When everyone has the same amount, each has the mean.",
                "Cuando todos tienen la misma cantidad, cada uno tiene la media.",
              ),
              pair(
                "Find the mean of all the amounts first.",
                "Primero halla la media de todas las cantidades.",
              ),
              pair(
                "The one with the most ends with the mean. How much is above the mean?",
                "El que tiene más termina con la media. ¿Cuánto hay por encima de la media?",
              ),
            ],
            meta: meta("giveaway", { data: v }),
          });
        }
        const n = rng.int(3, 5);
        const t = rng.int(st.lo + 2, st.hi - 2);
        const known = until(
          () => Array.from({ length: n }, () => rng.int(st.lo, st.hi)),
          (v) => t * (n + 1) - sum(v) >= st.lo - 2 && t * (n + 1) - sum(v) <= st.hi + 8,
        );
        const need = t * (n + 1) - sum(known);
        return NUM({
          q: cat(
            st.intro,
            pair(
              `The first ${n} ${op} were ${andL(known)[0]} ${st.unit[0]}. How many ${st.unit[0]} are needed on ${o1} ${n + 1} for a mean of ${t} ${st.unit[0]} over all ${n + 1} ${op}?`,
              `Los primeros ${n} ${ope} fueron ${andL(known)[1]} ${st.unit[1]}. ¿Cuántos ${st.unit[1]} se necesitan en ${nthEs(n + 1)} para tener una media de ${t} ${st.unit[1]} en los ${n + 1} ${ope}?`,
            ),
          ),
          a: need,
          fw: slips(known, t, n + 1),
          x: pair(
            `Total needed: ${n + 1} × ${t} = ${t * (n + 1)}. Total so far: ${known.join(" + ")} = ${sum(known)}. Needed: ${t * (n + 1)} − ${sum(known)} = ${need}.`,
            `Total necesario: ${n + 1} × ${t} = ${t * (n + 1)}. Total hasta ahora: ${known.join(" + ")} = ${sum(known)}. Se necesita: ${t * (n + 1)} − ${sum(known)} = ${need}.`,
          ),
          h: supp,
          meta: meta("missing", { known, t }),
        });
      }

      /* L3: only the earlier mean is known */
      if (level === 3) {
        const n = rng.int(4, 8);
        const m = rng.int(st.lo, st.hi - 2);
        const t = m + rng.int(1, 3);
        const need = t * (n + 1) - m * n;
        return NUM({
          q: cat(
            st.intro,
            pair(
              `After ${n} ${op}, the mean was ${m} ${st.unit[0]} per ${o1}. How many ${st.unit[0]} are needed on ${o1} ${n + 1} to raise the mean to ${t} ${st.unit[0]}?`,
              `Después de ${n} ${ope}, la media era de ${m} ${st.unit[1]} por ${o1e}. ¿Cuántos ${st.unit[1]} se necesitan en ${nthEs(n + 1)} para subir la media a ${t} ${st.unit[1]}?`,
            ),
          ),
          a: need,
          fw: [
            bad(t, "stat-mean-as-missing"),
            bad(m + (t - m), "stat-mean-as-missing"),
            bad(t * n - m * n, "stat-wrong-total"),
            bad(need - (t - m), "stat-change-added-to-mean"),
          ],
          x: pair(
            `Old total: ${n} × ${m} = ${n * m}. New total needed: ${n + 1} × ${t} = ${t * (n + 1)}. Needed: ${t * (n + 1)} − ${n * m} = ${need}.`,
            `Total anterior: ${n} × ${m} = ${n * m}. Total nuevo necesario: ${n + 1} × ${t} = ${t * (n + 1)}. Se necesita: ${t * (n + 1)} − ${n * m} = ${need}.`,
          ),
          h: [
            pair(
              "You do not know the single numbers, but you can find their total from the mean.",
              "No conoces los números uno por uno, pero puedes hallar su total con la media.",
            ),
            pair(
              "Find the old total and the new total needed. Count one more number in the new total.",
              "Halla el total anterior y el nuevo total necesario. Cuenta un número más en el total nuevo.",
            ),
            pair(
              "The difference between the two totals is the number you need.",
              "La diferencia entre los dos totales es el número que necesitas.",
            ),
          ],
          meta: meta("prev", { n, m, t }),
        });
      }

      /* L4: two equal missing numbers, or a value taken away */
      if (rng.chance(0.5)) {
        const m = rng.int(8, 20);
        const known = until(
          () => Array.from({ length: 3 }, () => rng.int(Math.max(1, m - 8), m + 8)),
          (v) => (5 * m - sum(v)) % 2 === 0 && (5 * m - sum(v)) / 2 >= 2,
        );
        const kn = known;
        const xx = (5 * m - sum(known)) / 2;
        return NUM({
          q: pair(
            `The mean of 5 numbers is ${m}. Three of the numbers are ${andL(kn)[0]}. The other two numbers are equal. What is each of them?`,
            `La media de 5 números es ${m}. Tres de los números son ${andL(kn)[1]}. Los otros dos números son iguales. ¿Cuánto vale cada uno?`,
          ),
          a: xx,
          fw: [
            bad(5 * m - sum(kn), "stat-equal-split-missed"),
            bad(m, "stat-mean-as-missing"),
            bad(f(mean(kn), 1), "stat-average-of-known"),
          ],
          x: pair(
            `Total: 5 × ${m} = ${5 * m}. Known: ${kn.join(" + ")} = ${sum(kn)}. The two equal numbers share ${5 * m - sum(kn)}, so each is ${5 * m - sum(kn)} ÷ 2 = ${xx}.`,
            `Total: 5 × ${m} = ${5 * m}. Conocidos: ${kn.join(" + ")} = ${sum(kn)}. Los dos números iguales se reparten ${5 * m - sum(kn)}, así que cada uno es ${5 * m - sum(kn)} ÷ 2 = ${xx}.`,
          ),
          h: supp
            .slice(0, 2)
            .concat([
              pair(
                "What is left after the known numbers? Split it between the two equal numbers.",
                "¿Qué queda después de los números conocidos? Repártelo entre los dos números iguales.",
              ),
            ]),
          meta: meta("twoeq", { known: kn, m }),
        });
      }
      const n = rng.int(5, 8);
      const m2 = rng.int(st.lo, st.hi - 3);
      const gone2 = [0, 1, 2, 3, 4, 5, 6, 7, 8]
        .map((d) => m2 + 3 + d)
        .find((g) => (m2 * (n - 1) + g) % n === 0);
      const m1 = (m2 * (n - 1) + gone2) / n;
      return NUM({
        q: cat(
          st.intro,
          pair(
            `The mean of ${n} ${op} was ${m1} ${st.unit[0]}. When one ${o1} is taken out, the mean of the other ${n - 1} is ${m2} ${st.unit[0]}. How many ${st.unit[0]} were in the ${o1} that was taken out?`,
            `La media de ${n} ${ope} era ${m1} ${st.unit[1]}. Al quitar un ${o1e}, la media de los otros ${n - 1} es ${m2} ${st.unit[1]}. ¿Cuántos ${st.unit[1]} había en el ${o1e} que se quitó?`,
          ),
        ),
        a: gone2,
        fw: [
          bad(m1, "stat-mean-as-missing"),
          bad(m2, "stat-mean-as-missing"),
          bad(m1 - m2, "stat-removed-vs-mean"),
        ],
        x: pair(
          `Total before: ${n} × ${m1} = ${n * m1}. Total after: ${n - 1} × ${m2} = ${(n - 1) * m2}. The one taken out: ${n * m1} − ${(n - 1) * m2} = ${gone2}.`,
          `Total antes: ${n} × ${m1} = ${n * m1}. Total después: ${n - 1} × ${m2} = ${(n - 1) * m2}. El que se quitó: ${n * m1} − ${(n - 1) * m2} = ${gone2}.`,
        ),
        h: [
          pair(
            "Taking one value out lowers the total by exactly that value.",
            "Quitar un valor baja el total exactamente en ese valor.",
          ),
          pair(
            "Find the total before and the total after, using mean × count each time.",
            "Halla el total antes y el total después, usando media × cantidad cada vez.",
          ),
          pair(
            "Subtract the new total from the old total.",
            "Resta el total nuevo del total anterior.",
          ),
        ],
        meta: meta("removed", { n, m1, m2 }),
      });
    },
    check(it) {
      const m = it.meta;
      const find = (build, t) => {
        const hits = [];
        for (let x = -50; x <= 400; x++) if (near(meanC(build(x)), t)) hits.push(x);
        return hits;
      };
      let hits;
      switch (m.kind) {
        case "missing":
          hits = find((x) => [...m.known, x], m.t);
          break;
        case "prev":
          hits = find((x) => [...Array(m.n).fill(m.m), x], m.t);
          break;
        case "twoeq":
          hits = find((x) => [...m.known, x, x], m.m);
          break;
        case "removed":
          hits = find((x) => [...Array(m.n - 1).fill(m.m2), x], m.m1);
          break;
        default:
          return verdict(it, Math.max(...m.data) - meanC(m.data), "amount given away");
      }
      if (hits.length !== 1) return `${hits.length} numbers fit, expected 1`;
      return verdict(it, hits[0], "missing number");
    },
  });

  /* ======================================================================================== */
  /* rangeIqr, boxplotRead                                                                        */
  /* ======================================================================================== */

  /** Pairs of data sets to compare, and subjects for box plots. */
  const DUO = [pair("Class A", "la clase A"), pair("Class B", "la clase B")];
  const NAMES = [
    [pair("Class A", "la clase A"), pair("Class B", "la clase B")],
    [pair("the Hawk team", "el equipo Halcón"), pair("the Owl team", "el equipo Búho")],
    [pair("Room 1", "el salón 1"), pair("Room 2", "el salón 2")],
    [pair("the Red team", "el equipo Rojo"), pair("the Blue team", "el equipo Azul")],
    [
      pair("the morning group", "el grupo de la mañana"),
      pair("the afternoon group", "el grupo de la tarde"),
    ],
    [pair("Garden A", "el huerto A"), pair("Garden B", "el huerto B")],
  ];
  void DUO;
  /** What a box plot is about: desc for the stem, label for the axis, usual range and step. */
  const BOXCTX = [
    {
      desc: pair("the quiz scores of a class", "los puntajes de una prueba corta de una clase"),
      label: pair("Quiz score", "Puntaje de la prueba"),
      lo: 20,
      hi: 100,
      st: 5,
    },
    {
      desc: pair("minutes of homework for a class", "los minutos de tarea de una clase"),
      label: pair("Minutes of homework", "Minutos de tarea"),
      lo: 0,
      hi: 90,
      st: 5,
    },
    {
      desc: pair(
        "the points a team scored in its games",
        "los puntos que anotó un equipo en sus partidos",
      ),
      label: pair("Points scored", "Puntos anotados"),
      lo: 20,
      hi: 100,
      st: 5,
    },
    {
      desc: pair("the heights of sunflower plants", "las alturas de unos girasoles"),
      label: pair("Height (cm)", "Altura (cm)"),
      lo: 10,
      hi: 90,
      st: 5,
    },
    {
      desc: pair(
        "the minutes students read last night",
        "los minutos que leyeron los estudiantes anoche",
      ),
      label: pair("Minutes read", "Minutos de lectura"),
      lo: 0,
      hi: 60,
      st: 5,
    },
    {
      desc: pair(
        "the distances paper planes flew",
        "las distancias que recorrieron unos aviones de papel",
      ),
      label: pair("Distance (feet)", "Distancia (pies)"),
      lo: 10,
      hi: 70,
      st: 5,
    },
  ];

  /** Five-number summary on a grid of `st`, every gap at least one step (so values sit on tick marks). */
  const boxPlot = (rng, bc, gaps) => {
    const [g1, g2, g3, g4] = gaps;
    const total = (g1 + g2 + g3 + g4) * bc.st;
    const min =
      bc.lo + bc.st * rng.int(0, Math.max(0, Math.floor((bc.hi - bc.lo - total) / bc.st)));
    return {
      min,
      q1: min + g1 * bc.st,
      med: min + (g1 + g2) * bc.st,
      q3: min + (g1 + g2 + g3) * bc.st,
      max: min + total,
    };
  };
  const boxScale = (bc, plots) => ({
    min: Math.max(0, Math.min(...plots.map((p) => p.min)) - bc.st),
    max: Math.max(...plots.map((p) => p.max)) + bc.st,
    step: bc.st * 2,
  });
  const boxViz = (bc, plots, labels) =>
    labels
      ? {
          t: "box",
          plots: plots.map((p, i) => ({ label: labels[i][0], ...p })),
          scale: boxScale(bc, plots),
          label: bc.label[0],
          labelEs: bc.label[1],
        }
      : {
          t: "box",
          ...plots[0],
          scale: boxScale(bc, plots),
          label: bc.label[0],
          labelEs: bc.label[1],
        };
  const rGaps = (rng, lo, hi) => [rng.int(lo, hi), rng.int(1, 3), rng.int(1, 3), rng.int(lo, hi)];

  const QNAME = {
    min: pair("least value (minimum)", "valor menor (mínimo)"),
    q1: pair("first quartile (Q1)", "primer cuartil (Q1)"),
    med: pair("median", "mediana"),
    q3: pair("third quartile (Q3)", "tercer cuartil (Q3)"),
    max: pair("greatest value (maximum)", "valor mayor (máximo)"),
  };

  G.register("rangeIqr", {
    title: "Range and interquartile range",
    titleEs: "Rango y rango intercuartílico",
    levels: 4,
    make(rng, level) {
      const c = rng.pick(CTX);
      const meta = (kind, extra) => ({ kind, ...extra });
      const spreadList = (n) =>
        until(
          () => drawVals(rng, c, n, c.st === 1 ? 14 : 8),
          (v) => {
            const q = five(v);
            const kept = fiveKept(v);
            return (
              q.q3 - q.q1 >= 2 &&
              q.max - q.min > q.q3 - q.q1 + 1 &&
              (n % 2 === 0 || (!near(kept.q1, q.q1) && !near(kept.q3, q.q3))) &&
              new Set(v).size >= 6
            );
          },
        );
      const note = (n) => (n % 2 ? [` ${QNOTE[0]}`, ` ${QNOTE[1]}`] : ["", ""]);
      const qHints = (what) => [
        pair("Put the numbers in order first.", "Primero ordena los números."),
        pair(
          `${what}. Split the ordered list at the median into a lower half and an upper half.`,
          `${what}. Divide la lista ordenada en la mediana en una mitad inferior y una mitad superior.`,
        ),
        pair(
          "Find the median of the half you need: the middle number, or halfway between the two middle numbers.",
          "Halla la mediana de la mitad que necesitas: el número del medio, o el punto a la mitad entre los dos del medio.",
        ),
      ];

      /* L1: range from an ordered list */
      if (level === 1) {
        const n = rng.int(5, 8);
        const v = asc(drawVals(rng, c, n, 12));
        const r = v[n - 1] - v[0];
        const q = five(v);
        return MC(rng, {
          q: cat(ctxList(c, v, true), pair("What is the range?", "¿Cuál es el rango?")),
          right: String(r),
          wrong: [
            bad(v[n - 1], "stat-greatest-as-range"),
            bad(v[n - 1] + v[0], "stat-least-plus-greatest"),
            bad(q.q3 - q.q1, "stat-iqr-for-range"),
            bad(
              v[1] - v[0],
              "stat-gap-not-range",
              "That is the gap between the two least numbers. The range goes from the least to the greatest.",
              "Esa es la diferencia entre los dos números menores. El rango va del menor al mayor.",
            ),
            bad(r + 1, "stat-miscount"),
          ],
          x: pair(
            `Range = greatest − least = ${v[n - 1]} − ${v[0]} = ${r}.`,
            `Rango = mayor − menor = ${v[n - 1]} − ${v[0]} = ${r}.`,
          ),
          h: [
            pair(
              "The range shows how far the data stretches from one end to the other.",
              "El rango muestra cuánto se extienden los datos de un extremo al otro.",
            ),
            pair(
              "Find the least number and the greatest number. The list is in order, so they are at the ends.",
              "Busca el número menor y el mayor. La lista está en orden, así que están en los extremos.",
            ),
            pair("Subtract the least from the greatest.", "Resta el menor del mayor."),
          ],
          meta: meta("range", { data: v }),
        });
      }

      /* L2: Q1, Q3 or IQR from an ordered list */
      if (level === 2) {
        const n = rng.pick([8, 9, 10, 11, 12]);
        const v = asc(spreadList(n));
        const q = five(v);
        const kp = fiveKept(v);
        const h = n >> 1;
        const which = rng.pick(["q1", "q3", "iqr"]);
        const ans = which === "iqr" ? q.q3 - q.q1 : q[which];
        const nm =
          which === "iqr"
            ? pair("the interquartile range (IQR)", "el rango intercuartílico (RIC)")
            : which === "q1"
              ? pair("Q1", "Q1")
              : pair("Q3", "Q3");
        const lower = v.slice(0, h);
        const upper = v.slice(n % 2 ? h + 1 : h);
        return NUM({
          q: cat(
            ctxList(c, v, true),
            pair(`Find ${nm[0]}.${note(n)[0]}`, `Halla ${nm[1]}.${note(n)[1]}`),
          ),
          a: f(ans),
          fw:
            which === "iqr"
              ? [
                  bad(q.max - q.min, "stat-range-for-iqr"),
                  bad(q.q1 + q.q3, "stat-quartile-sum"),
                  bad(q.q3, "stat-q3-as-iqr"),
                  bad(kp.q3 - kp.q1, "stat-median-in-halves"),
                  bad(q.med, "stat-median-as-iqr"),
                ]
              : [
                  bad(q.med, "stat-quartile-as-median"),
                  bad(which === "q1" ? lower[lower.length - 1] : upper[0], "stat-edge-of-half"),
                  bad(which === "q1" ? kp.q1 : kp.q3, "stat-median-in-halves"),
                  bad(
                    which === "q1" ? q.min : q.max,
                    "stat-box-edge-extreme",
                    "That is the " +
                      (which === "q1" ? "least" : "greatest") +
                      " value. A quartile is the middle of a half.",
                    "Ese es el valor " +
                      (which === "q1" ? "menor" : "mayor") +
                      ". Un cuartil es el medio de una mitad.",
                  ),
                ],
          x: pair(
            `${QNOTE_X[0]} Lower half: ${list(lower)}, so Q1 = ${f(q.q1)}. Upper half: ${list(upper)}, so Q3 = ${f(q.q3)}.${which === "iqr" ? ` IQR = Q3 − Q1 = ${f(q.q3)} − ${f(q.q1)} = ${f(ans)}.` : ""}`,
            `${QNOTE_X[1]} Mitad inferior: ${list(lower)}, así que Q1 = ${f(q.q1)}. Mitad superior: ${list(upper)}, así que Q3 = ${f(q.q3)}.${which === "iqr" ? ` RIC = Q3 − Q1 = ${f(q.q3)} − ${f(q.q1)} = ${f(ans)}.` : ""}`,
          ),
          h: qHints(
            which === "iqr"
              ? "The IQR is Q3 − Q1"
              : which === "q1"
                ? "Q1 is the median of the lower half"
                : "Q3 is the median of the upper half",
          ),
          meta: meta("quart", { data: v, which }),
        });
      }

      /* L3: from an unordered list or from a box plot, range and IQR together */
      if (level === 3) {
        const pairTxt = (r, i) => pair(`Range ${f(r)}, IQR ${f(i)}`, `Rango ${f(r)}, RIC ${f(i)}`);
        if (rng.chance(0.5)) {
          const bc = rng.pick(BOXCTX);
          const p = boxPlot(rng, bc, rGaps(rng, 1, 4));
          const r = p.max - p.min;
          const i = p.q3 - p.q1;
          if (r === i) p.max += bc.st;
          const R = p.max - p.min;
          return MC(rng, {
            q: pair(
              `The box plot shows ${bc.desc[0]}. What are the range and the IQR?`,
              `El diagrama de caja muestra ${bc.desc[1]}. ¿Cuáles son el rango y el RIC?`,
            ),
            right: pairTxt(R, i),
            wrong: [
              bad(pairTxt(i, R), "stat-range-for-iqr"),
              bad(
                pairTxt(R, p.med - p.min),
                "stat-wrong-iqr",
                "Check the IQR: it runs from Q1 to Q3, the two edges of the box.",
                "Revisa el RIC: va de Q1 a Q3, los dos bordes de la caja.",
              ),
              bad(pairTxt(R, p.q3), "stat-q3-as-iqr"),
              bad(pairTxt(p.max, i), "stat-greatest-as-range"),
              bad(
                pairTxt(R, p.max - p.q1),
                "stat-wrong-iqr",
                "Check the IQR: it runs from Q1 to Q3, the two edges of the box.",
                "Revisa el RIC: va de Q1 a Q3, los dos bordes de la caja.",
              ),
            ],
            x: pair(
              `Range = greatest − least = ${p.max} − ${p.min} = ${R}. IQR = Q3 − Q1 = ${p.q3} − ${p.q1} = ${i}.`,
              `Rango = mayor − menor = ${p.max} − ${p.min} = ${R}. RIC = Q3 − Q1 = ${p.q3} − ${p.q1} = ${i}.`,
            ),
            h: [
              pair(
                "The range uses the ends of the whiskers. The IQR uses the edges of the box.",
                "El rango usa los extremos de los bigotes. El RIC usa los bordes de la caja.",
              ),
              pair(
                "Read the five numbers from the scale: least, Q1, median, Q3, greatest.",
                "Lee los cinco números en la escala: menor, Q1, mediana, Q3, mayor.",
              ),
              pair(
                "Subtract for the range. Then subtract again for the IQR.",
                "Resta para el rango. Luego resta otra vez para el RIC.",
              ),
            ],
            viz: boxViz(bc, [p]),
            meta: meta("box", { plot: p }),
          });
        }
        const n = rng.pick([9, 10, 11, 12, 13]);
        const v = spreadList(n);
        const q = five(v);
        const kp = fiveKept(v);
        const u = scramble(rng, v);
        const asPair = rng.chance(0.5);
        return ask(rng, asPair, {
          q: cat(
            ctxList(c, u, false),
            pair(
              asPair
                ? `What are the range and the IQR?${note(n)[0]}`
                : `Find the interquartile range (IQR).${note(n)[0]}`,
              asPair
                ? `¿Cuáles son el rango y el RIC?${note(n)[1]}`
                : `Halla el rango intercuartílico (RIC).${note(n)[1]}`,
            ),
          ),
          right: asPair ? pairTxt(q.max - q.min, q.q3 - q.q1) : undefined,
          a: f(q.q3 - q.q1),
          cands: asPair
            ? [
                bad(pairTxt(q.q3 - q.q1, q.max - q.min), "stat-range-for-iqr"),
                bad(
                  pairTxt(Math.max(...u.slice(0, 2)) - Math.min(u[0], u[n - 1]), q.q3 - q.q1),
                  "stat-end-of-list",
                ),
                bad(pairTxt(q.max - q.min, kp.q3 - kp.q1), "stat-median-in-halves"),
                bad(pairTxt(q.max - q.min, q.q3 + q.q1), "stat-quartile-sum"),
                bad(pairTxt(q.max - q.min, q.med), "stat-median-as-iqr"),
              ]
            : [
                bad(q.max - q.min, "stat-range-for-iqr"),
                bad(q.q1 + q.q3, "stat-quartile-sum"),
                bad(kp.q3 - kp.q1, "stat-median-in-halves"),
                bad(u[n - 1] - u[0], "stat-end-of-list"),
              ],
          x: pair(
            `In order: ${list(asc(v))}. ${QNOTE_X[0]} Q1 = ${f(q.q1)}, Q3 = ${f(q.q3)}, so IQR = ${f(q.q3 - q.q1)}. Range = ${f(q.max)} − ${f(q.min)} = ${f(q.max - q.min)}.`,
            `En orden: ${list(asc(v))}. ${QNOTE_X[1]} Q1 = ${f(q.q1)}, Q3 = ${f(q.q3)}, así que RIC = ${f(q.q3 - q.q1)}. Rango = ${f(q.max)} − ${f(q.min)} = ${f(q.max - q.min)}.`,
          ),
          h: qHints("Q1 is the median of the lower half and Q3 the median of the upper half"),
          meta: meta("listBoth", { data: u }),
        });
      }

      /* L4: compare two data sets -- the bigger range is not always the bigger IQR */
      const [A, B] = rng.pick(NAMES);
      const pairLists = until(
        () => {
          const ctr = rng.int(35, 75);
          const tight = Array.from({ length: 10 }, (_, i) => ctr + (i % 5) - 2 + rng.int(-1, 1));
          tight[0] = ctr - rng.int(14, 22);
          tight[9] = ctr + rng.int(14, 22);
          const wide = Array.from({ length: 10 }, () => ctr + rng.int(-10, 10));
          return [tight, wide];
        },
        ([a, b]) => {
          const qa = five(a);
          const qb = five(b);
          return qa.max - qa.min > qb.max - qb.min + 2 && qa.q3 - qa.q1 + 3 <= qb.q3 - qb.q1;
        },
      );
      const swap = rng.chance(0.5);
      const [da, db] = swap ? [pairLists[1], pairLists[0]] : pairLists;
      const qa = five(da);
      const qb = five(db);
      const W = qa.max - qa.min > qb.max - qb.min ? [A, "A"] : [B, "B"];
      const V = W[1] === "A" ? [B, "B"] : [A, "A"];
      const sp = {
        T: [
          ["range", W[1]],
          ["iqr", V[1]],
        ],
        F1: [["iqr", W[1]]],
        F2: [["range", V[1]]],
        F3: [
          ["iqr", W[1]],
          ["range", W[1]],
        ],
      };
      const sentences = {
        T: pair(
          `${W[0][0]} has the greater range, but ${V[0][0]} has the greater IQR.`,
          `${W[0][1]} tiene el mayor rango, pero ${V[0][1]} tiene el mayor RIC.`,
        ),
        F1: pair(
          `${W[0][0]} has the greater IQR, because its range is greater.`,
          `${W[0][1]} tiene el mayor RIC, porque su rango es mayor.`,
        ),
        F2: pair(
          `${V[0][0]} has the greater range, because its box is wider.`,
          `${V[0][1]} tiene el mayor rango, porque su caja es más ancha.`,
        ),
        F3: pair(
          `${W[0][0]} is more spread out in every way.`,
          `${W[0][1]} está más dispersa en todos los sentidos.`,
        ),
      };
      for (const k of Object.keys(sentences)) sentences[k] = upP(sentences[k]);
      const cap = (p) =>
        pair(
          p[0].replace(/^./, (s) => s.toUpperCase()),
          p[1].replace(/^./, (s) => s.toUpperCase()),
        );
      void cap;
      const it = MC(rng, {
        q: pair(
          `Scores for ${A[0]}: ${list(da)}. Scores for ${B[0]}: ${list(db)}. Which statement is true?`,
          `Puntajes de ${A[1]}: ${list(da)}. Puntajes de ${B[1]}: ${list(db)}. ¿Qué enunciado es verdadero?`,
        ),
        right: sentences.T,
        wrong: [
          bad(sentences.F1, "stat-compared-by-range"),
          bad(sentences.F2, "stat-box-for-range"),
          bad(
            sentences.F3,
            "stat-compared-by-range",
            "A greater range does not make a data set more spread out in every way. The IQR can say the opposite.",
            "Un rango mayor no hace que los datos estén más dispersos en todos los sentidos. El RIC puede decir lo contrario.",
          ),
        ],
        x: pair(
          `${up(A[0])}: range ${f(qa.max - qa.min)}, IQR ${f(qa.q3 - qa.q1)}. ${up(B[0])}: range ${f(qb.max - qb.min)}, IQR ${f(qb.q3 - qb.q1)}. Each list has an even count, so the halves are the 5 lowest and 5 highest values.`,
          `${A[1][0].toUpperCase() + A[1].slice(1)}: rango ${f(qa.max - qa.min)}, RIC ${f(qa.q3 - qa.q1)}. ${B[1][0].toUpperCase() + B[1].slice(1)}: rango ${f(qb.max - qb.min)}, RIC ${f(qb.q3 - qb.q1)}. Cada lista tiene una cantidad par, así que las mitades son los 5 valores menores y los 5 mayores.`,
        ),
        h: [
          pair(
            "Find the range and the IQR of each data set. Do not compare the range alone.",
            "Halla el rango y el RIC de cada conjunto de datos. No compares solo el rango.",
          ),
          pair(
            "Order each list. Each has 10 numbers, so the halves are the lowest 5 and the highest 5.",
            "Ordena cada lista. Cada una tiene 10 números, así que las mitades son los 5 menores y los 5 mayores.",
          ),
          pair(
            "Q1 and Q3 are the middles of those halves. Subtract for the IQR.",
            "Q1 y Q3 son los medios de esas mitades. Resta para el RIC.",
          ),
        ],
        meta: meta("compare", { a: da, b: db }),
      });
      it.x = up(it.x);
      it.xEs = up(it.xEs);
      const byText = new Map([
        [sentences.T[0], sp.T],
        [sentences.F1[0], sp.F1],
        [sentences.F2[0], sp.F2],
        [sentences.F3[0], sp.F3],
      ]);
      it.meta.specs = it.c.map((t) => byText.get(t));
      return it;
    },
    check(it) {
      const m = it.meta;
      const ends = (a) => Math.max(...a) - Math.min(...a);
      switch (m.kind) {
        case "range":
          return verdict(it, ends(m.data), "range");
        case "quart": {
          const q = fiveC(m.data);
          return verdict(it, m.which === "iqr" ? q.q3 - q.q1 : q[m.which], m.which);
        }
        case "box":
          return verdictText(
            it,
            `Range ${f(m.plot.max - m.plot.min)}, IQR ${f(m.plot.q3 - m.plot.q1)}`,
            "box range and IQR",
          );
        case "listBoth": {
          const q = fiveC(m.data);
          return it.k === "mc"
            ? verdictText(it, `Range ${f(q.max - q.min)}, IQR ${f(q.q3 - q.q1)}`, "range and IQR")
            : verdict(it, q.q3 - q.q1, "IQR");
        }
        default: {
          const info = { A: fiveC(m.a), B: fiveC(m.b) };
          const val = {
            range: (k) => info[k].max - info[k].min,
            iqr: (k) => info[k].q3 - info[k].q1,
          };
          const truth = m.specs.map((claims) =>
            claims.every(([what, who]) => val[what](who) > val[what](who === "A" ? "B" : "A")),
          );
          const n = truth.filter(Boolean).length;
          if (n !== 1) return `${n} statements are true, expected exactly 1`;
          return truth[it.a] || "the keyed statement is not the true one";
        }
      }
    },
  });

  G.register("boxplotRead", {
    title: "Read a box plot",
    titleEs: "Leer un diagrama de caja",
    levels: 4,
    make(rng, level) {
      const bc = rng.pick(BOXCTX);
      const meta = (kind, extra) => ({ kind, ...extra });
      const plot = boxPlot(rng, bc, rGaps(rng, 1, 4));
      const q = plot;
      const viz = boxViz(bc, [plot]);
      const lead = pair(
        `The box plot shows ${bc.desc[0]}.`,
        `El diagrama de caja muestra ${bc.desc[1]}.`,
      );
      const SECTION = {
        iqr: { t: pair("between Q1 and Q3", "entre Q1 y Q3"), pct: 50 },
        below: {
          t: pair("at or below the median", "en la mediana o por debajo de ella"),
          pct: 50,
        },
        above: {
          t: pair("at or above the median", "en la mediana o por encima de ella"),
          pct: 50,
        },
        top: { t: pair("at or above Q3", "en Q3 o por encima de él"), pct: 25 },
        bottom: {
          t: pair("at or below Q1", "en Q1 o por debajo de él"),
          pct: 25,
        },
        upto: { t: pair("at or below Q3", "en Q3 o por debajo de él"), pct: 75 },
      };
      const secLen = {
        iqr: (q.q3 - q.q1) / (q.max - q.min),
        below: (q.med - q.min) / (q.max - q.min),
        above: (q.max - q.med) / (q.max - q.min),
        top: (q.max - q.q3) / (q.max - q.min),
        bottom: (q.q1 - q.min) / (q.max - q.min),
        upto: (q.q3 - q.min) / (q.max - q.min),
      };

      /* L1: read one number off the plot */
      if (level === 1) {
        const key = rng.pick(["min", "q1", "med", "q3", "max"]);
        const others = ["min", "q1", "med", "q3", "max"].filter((k) => k !== key);
        const tagFor = (k) =>
          key === "med"
            ? "stat-quartile-as-median"
            : key === "min" || key === "max"
              ? k === "q1" || k === "q3"
                ? "stat-box-edge-extreme"
                : "stat-wrong-part"
              : k === "min" || k === "max"
                ? "stat-whisker-for-box"
                : "stat-wrong-part";
        const fb = (k) =>
          key === "med"
            ? pair(
                `That is ${QNAME[k][0]}, ${k === "min" || k === "max" ? "the end of a whisker" : "an edge of the box"}. The median is the line inside the box.`,
                `Ese es el ${QNAME[k][1]}, ${k === "min" || k === "max" ? "el extremo de un bigote" : "un borde de la caja"}. La mediana es la línea dentro de la caja.`,
              )
            : pair(
                `That is the ${QNAME[k][0]}. Find the ${QNAME[key][0]} on the plot.`,
                `Ese es el ${QNAME[k][1]}. Busca el ${QNAME[key][1]} en la gráfica.`,
              );
        return MC(rng, {
          q: cat(lead, pair(`What is the ${QNAME[key][0]}?`, `¿Cuál es el ${QNAME[key][1]}?`)),
          right: String(plot[key]),
          wrong: [
            ...others.map((k) => bad(plot[k], tagFor(k), fb(k)[0], fb(k)[1])),
            ...(key === "med" ? [bad((q.min + q.max) / 2, "stat-median-as-center")] : []),
          ],
          x: pair(
            `Line up the ${QNAME[key][0]} with the scale: ${plot[key]}.`,
            `Alinea el ${QNAME[key][1]} con la escala: ${plot[key]}.`,
          ),
          h: [
            pair(
              "A box plot shows five numbers: least, Q1, median, Q3, greatest.",
              "Un diagrama de caja muestra cinco números: menor, Q1, mediana, Q3, mayor.",
            ),
            pair(
              "The ends of the whiskers are the least and greatest values. The box runs from Q1 to Q3 with the median line inside.",
              "Los extremos de los bigotes son el valor menor y el mayor. La caja va de Q1 a Q3 con la línea de la mediana adentro.",
            ),
            pair(
              "Find that part of the plot, then look straight down to the number on the scale.",
              "Busca esa parte de la gráfica y mira hacia abajo hasta el número de la escala.",
            ),
          ],
          viz,
          meta: meta("read", { plot, key }),
        });
      }

      /* L2: what share of the data is in a section (the range and IQR are lesson 2-5) */
      if (level === 2) {
        const key = rng.pick(Object.keys(SECTION));
        const pct = SECTION[key].pct;
        const lenPct = Math.round((secLen[key] * 100) / 5) * 5;
        return MC(rng, {
          q: cat(
            lead,
            pair(
              `About what percent of the data is ${SECTION[key].t[0]}?`,
              `¿Aproximadamente qué porcentaje de los datos está ${SECTION[key].t[1]}?`,
            ),
          ),
          right: `${pct}%`,
          wrong: [
            bad(`${lenPct}%`, "stat-length-for-data"),
            bad(pct === 25 ? "50%" : "25%", "stat-one-section"),
            bad("33%", "stat-thirds"),
            bad(
              "75%",
              "stat-wrong-quarters",
              "Count the quarters of the data the question covers. Each section is one quarter or a group of quarters.",
              "Cuenta los cuartos de los datos que abarca la pregunta. Cada sección es un cuarto o un grupo de cuartos.",
            ),
            bad("100%", "stat-whole-as-part"),
          ],
          x: pair(
            `A box plot splits the data into four equal parts, each with 25% of the values, however long it looks. ${SECTION[key].t[0].replace(/^./, (s) => s.toUpperCase())} covers ${pct / 25} of the 4 parts: ${pct}%.`,
            `Un diagrama de caja divide los datos en cuatro partes iguales, cada una con el 25% de los valores, sin importar qué tan larga se vea. ${SECTION[key].t[1].replace(/^./, (s) => s.toUpperCase())} abarca ${pct / 25} de las 4 partes: ${pct}%.`,
          ),
          h: [
            pair(
              "The two whiskers and the two halves of the box each hold the same share of the data.",
              "Los dos bigotes y las dos mitades de la caja tienen cada uno la misma parte de los datos.",
            ),
            pair(
              "Each of the four parts holds the same share of the data. A longer part does not hold more.",
              "Cada una de las cuatro partes tiene la misma porción de los datos. Una parte más larga no tiene más.",
            ),
            pair(
              "Find the share of one part (100% split four ways). Then count how many parts the question covers, and multiply.",
              "Halla la parte de una sección (100% repartido en cuatro). Luego cuenta cuántas secciones abarca la pregunta y multiplica.",
            ),
          ],
          viz,
          meta: meta("pct", { plot, key, pct }),
        });
      }

      /* L3: how many values, from a count that splits evenly into quarters */
      if (level === 3) {
        const n = rng.pick([12, 16, 20, 24, 28, 32, 36, 40, 44, 48, 52, 56, 60, 64]);
        const key = rng.pick(["iqr", "above", "top", "bottom", "upto"]);
        const ans = (n * SECTION[key].pct) / 100;
        return NUM({
          q: cat(
            lead,
            pair(
              `There are ${n} values in the data set. About how many of them are ${SECTION[key].t[0]}?`,
              `Hay ${n} valores en el conjunto de datos. ¿Aproximadamente cuántos están ${SECTION[key].t[1]}?`,
            ),
          ),
          a: ans,
          fw: [
            bad(SECTION[key].pct, "stat-percent-as-count"),
            bad(n, "stat-whole-as-part"),
            bad(n / 4 === ans ? n / 2 : n / 4, "stat-one-section"),
            bad(f(n / 3, 1), "stat-thirds"),
          ],
          x: pair(
            `Each part of the plot holds a quarter of the values: ${n} ÷ 4 = ${n / 4}. ${SECTION[key].t[0].replace(/^./, (s) => s.toUpperCase())} covers ${SECTION[key].pct / 25} of the 4 parts: ${ans}.`,
            `Cada parte de la gráfica tiene un cuarto de los valores: ${n} ÷ 4 = ${n / 4}. ${SECTION[key].t[1].replace(/^./, (s) => s.toUpperCase())} abarca ${SECTION[key].pct / 25} de las 4 partes: ${ans}.`,
          ),
          h: [
            pair(
              "Each of the four parts of a box plot holds the same number of values.",
              "Cada una de las cuatro partes de un diagrama de caja tiene la misma cantidad de valores.",
            ),
            pair(
              "Find how many values are in one part.",
              "Halla cuántos valores hay en una parte.",
            ),
            pair(
              "Count how many parts the question covers, then multiply.",
              "Cuenta cuántas partes abarca la pregunta y multiplica.",
            ),
          ],
          viz,
          meta: meta("count", { n, key, pct: SECTION[key].pct }),
        });
      }

      /* L4: two box plots */
      const [A, B] = rng.pick(NAMES);
      const st = bc.st;
      const sm = (g) => [rng.int(1, 2) * st, rng.int(1, 2) * st, rng.int(1, 2) * st, g * st];
      void sm;
      const wide = until(
        () => {
          const w = { bx: rng.int(1, 2), wh: rng.int(3, 4) };
          const v = { bx: rng.int(3, 4), wh: rng.int(1, 2) };
          return { w, v, gap: rng.int(2, 4) };
        },
        (x) => x.w.bx * 2 < x.v.bx * 2 && x.w.wh * 2 + x.w.bx * 2 > x.v.wh * 2 + x.v.bx * 2 + 1,
      );
      const mk = (spec, lowShift) => {
        const half = spec.bx;
        const g = [spec.wh, half, half, spec.wh];
        const base = boxPlot(rng, { ...bc, lo: bc.lo + lowShift * st, hi: 100 }, g);
        return base;
      };
      const pw0 = mk(wide.w, 0);
      const pv0 = mk(wide.v, 0);
      const shiftV = pw0.med + wide.gap * st - pv0.med;
      const pv = {
        min: pv0.min + shiftV,
        q1: pv0.q1 + shiftV,
        med: pv0.med + shiftV,
        q3: pv0.q3 + shiftV,
        max: pv0.max + shiftV,
      };
      const pw = pw0;
      const wFirst = rng.chance(0.5);
      const names = wFirst ? [A, B] : [B, A];
      const plots = wFirst ? [pw, pv] : [pv, pw];
      const W = names[wFirst ? 0 : 1];
      const V = names[wFirst ? 1 : 0];
      const wk = wFirst ? "A" : "B";
      const vk = wFirst ? "B" : "A";
      const sentences = {
        T: pair(
          `${V[0]} has the higher median and the longer box, but ${W[0]} stretches farther from one end of its whiskers to the other.`,
          `${V[1]} tiene la mediana más alta y la caja más larga, pero ${W[1]} se extiende más de un extremo de sus bigotes al otro.`,
        ),
        F1: pair(
          `${W[0]} has the higher median, because its whisker reaches farther.`,
          `${W[1]} tiene la mediana más alta, porque su bigote llega más lejos.`,
        ),
        F2: pair(
          `${W[0]} has the longer box, because its whiskers stretch farther.`,
          `${W[1]} tiene la caja más larga, porque sus bigotes se extienden más.`,
        ),
        F3: pair(
          `${V[0]} stretches farther from end to end, because its box is longer.`,
          `${V[1]} se extiende más de un extremo al otro, porque su caja es más larga.`,
        ),
      };
      for (const k of Object.keys(sentences)) sentences[k] = upP(sentences[k]);
      const specs = {
        T: [
          ["med", vk],
          ["iqr", vk],
          ["range", wk],
        ],
        F1: [["med", wk]],
        F2: [["iqr", wk]],
        F3: [["range", vk]],
      };
      const it = MC(rng, {
        q: pair(
          `The two box plots show "${bc.label[0]}" for ${names[0][0]} and ${names[1][0]}. Which statement is true?`,
          `Los dos diagramas de caja muestran "${bc.label[1]}" de ${names[0][1]} y ${names[1][1]}. ¿Qué enunciado es verdadero?`,
        ),
        right: sentences.T,
        wrong: [
          bad(sentences.F1, "stat-higher-reach-higher-center"),
          bad(sentences.F2, "stat-reach-for-box"),
          bad(sentences.F3, "stat-box-for-reach"),
        ],
        x: pair(
          `Median: the line inside the box. Length of the box: from Q1 to Q3. Whole length: whisker end to whisker end. ${V[0]} is higher in the middle and has the longer box; ${W[0]} stretches farther from end to end.`,
          `Mediana: la línea dentro de la caja. Longitud de la caja: de Q1 a Q3. Longitud total: de un extremo del bigote al otro. ${V[1]} está más alta en el medio y tiene la caja más larga; ${W[1]} se extiende más de un extremo al otro.`,
        ),
        h: [
          pair(
            "Compare one thing at a time: the median line, the length of the box, and the length from end to end.",
            "Compara una cosa a la vez: la línea de la mediana, la longitud de la caja y la longitud de un extremo al otro.",
          ),
          pair(
            "The median is the line inside the box, not the end of a whisker.",
            "La mediana es la línea dentro de la caja, no el extremo de un bigote.",
          ),
          pair(
            "The box runs from Q1 to Q3. The whole length includes the whiskers.",
            "La caja va de Q1 a Q3. La longitud total incluye los bigotes.",
          ),
        ],
        viz: boxViz(bc, plots, names),
        meta: meta("compare", { plots: { A: plots[0], B: plots[1] } }),
      });
      it.x = up(it.x);
      it.xEs = up(it.xEs);
      const byText = new Map(Object.keys(sentences).map((k) => [sentences[k][0], specs[k]]));
      it.meta.specs = it.c.map((t) => byText.get(t));
      return it;
    },
    check(it) {
      const m = it.meta;
      const ends = (p) => p.max - p.min;
      const box = (p) => p.q3 - p.q1;
      if (m.kind === "read") return verdict(it, m.plot[m.key], "value read from plot");
      if (m.kind === "spread")
        return verdict(it, m.iqr ? box(m.plot) : ends(m.plot), m.iqr ? "IQR" : "range");
      if (m.kind === "pct") {
        // the plot splits the data into quarters, so a section holds (quarters it covers) x 25 percent
        const quarters = {
          iqr: 2,
          below: 2,
          above: 2,
          top: 1,
          bottom: 1,
          upto: 3,
        }[m.key];
        return verdict(it, quarters * 25, "percent of the data");
      }
      if (m.kind === "count") return verdict(it, (m.n / 4) * (m.pct / 25), "number of values");
      const val = {
        range: (k) => ends(m.plots[k]),
        iqr: (k) => box(m.plots[k]),
        med: (k) => m.plots[k].med,
      };
      const truth = m.specs.map((claims) =>
        claims.every(([w, who]) => val[w](who) > val[w](who === "A" ? "B" : "A")),
      );
      const n = truth.filter(Boolean).length;
      if (n !== 1) return `${n} statements are true, expected exactly 1`;
      return truth[it.a] || "the keyed statement is not the true one";
    },
  });

  /* ======================================================================================== */
  /* madCalc, chooseMeasure                                                                       */
  /* ======================================================================================== */

  const distances = (a, m) => a.map((x) => Math.abs(x - m));
  const mad = (a) => mean(distances(a, mean(a)));

  G.register("madCalc", {
    title: "Mean absolute deviation",
    titleEs: "Desviación absoluta media",
    levels: 4,
    make(rng, level) {
      const c = rng.pick(CTX.filter((x) => x.hi - x.lo >= 9));
      const meta = (kind, extra) => ({ kind, ...extra });
      /** n whole numbers with a whole-number mean and a MAD that ends within one decimal place. */
      const set = (n, sp, m0) =>
        until(
          () => {
            const m = m0 ?? rng.int(c.lo + 3, c.hi - 3);
            return withMean(rng, n, m, sp, c.lo, c.hi);
          },
          (v) => tidy(mad(v)) && mad(v) > 0 && !near(mad(v), Math.round(mad(v)) + 2),
        );
      const steps = (v) => {
        const m = mean(v);
        const d = distances(v, m);
        return pair(
          `Step 1, the mean: ${v.join(" + ")} = ${sum(v)}, and ${sum(v)} ÷ ${v.length} = ${f(m)}. Step 2, the distance of each value from the mean: ${d.join(", ")}. Step 3, add the distances: ${d.join(" + ")} = ${f(sum(d))}. Step 4, divide by ${v.length}: ${f(sum(d))} ÷ ${v.length} = ${f(mad(v))}.`,
          `Paso 1, la media: ${v.join(" + ")} = ${sum(v)}, y ${sum(v)} ÷ ${v.length} = ${f(m)}. Paso 2, la distancia de cada valor a la media: ${d.join(", ")}. Paso 3, suma las distancias: ${d.join(" + ")} = ${f(sum(d))}. Paso 4, divide entre ${v.length}: ${f(sum(d))} ÷ ${v.length} = ${f(mad(v))}.`,
        );
      };
      const madHints = [
        pair(
          "The MAD is the average distance of the values from the mean. Start with the mean.",
          "La DMA es la distancia promedio de los valores a la media. Empieza con la media.",
        ),
        pair(
          "Find how far each value is from the mean. Distances are never negative.",
          "Halla qué tan lejos está cada valor de la media. Las distancias nunca son negativas.",
        ),
        pair(
          "Add the distances, then divide by how many values there are.",
          "Suma las distancias y divide entre cuántos valores hay.",
        ),
      ];

      /* L1: only the first step, the mean */
      if (level === 1) {
        const n = rng.int(4, 6);
        const v = set(n, 3);
        const m = mean(v);
        return MC(rng, {
          q: cat(
            ctxList(c, v, false),
            pair(
              "To find the MAD, the first step is the mean. What is the mean of these values?",
              "Para hallar la DMA, el primer paso es la media. ¿Cuál es la media de estos valores?",
            ),
          ),
          right: f(m),
          wrong: [
            bad(sum(v), "stat-summed-instead-of-averaged"),
            bad(midOf(asc(v)), "stat-median-for-mean"),
            bad(f(mad(v), 1), "stat-center-vs-spread"),
            bad(Math.max(...v), "stat-greatest-not-mean"),
            bad(m + 1, "stat-miscount"),
          ],
          x: pair(
            `Total: ${v.join(" + ")} = ${sum(v)}. ${sum(v)} ÷ ${n} = ${f(m)}.`,
            `Total: ${v.join(" + ")} = ${sum(v)}. ${sum(v)} ÷ ${n} = ${f(m)}.`,
          ),
          h: meanSupport,
          meta: meta("mean", { data: v }),
        });
      }

      /* L2: the distances from the mean */
      if (level === 2) {
        const n = rng.int(4, 5);
        const v = rng.shuffle(set(n, 3));
        const m = mean(v);
        const d = distances(v, m);
        const lead = cat(
          ctxList(c, v, false),
          pair(`The mean is ${f(m)}.`, `La media es ${f(m)}.`),
        );
        if (rng.chance(0.5)) {
          const signed = v.map((x) => x - m);
          const med = midOf(asc(v));
          return MC(rng, {
            q: cat(
              lead,
              pair(
                "Which list shows how far each value is from the mean?",
                "¿Qué lista muestra qué tan lejos está cada valor de la media?",
              ),
            ),
            right: list(d),
            wrong: [
              bad(list(signed), "stat-signed-deviations"),
              bad(list(distances(v, med)), "stat-deviation-from-median"),
              bad(list(v), "stat-value-not-distance"),
              bad(list(d.map((x) => x + 1)), "stat-miscount"),
            ],
            x: pair(
              `Distance = how far the value is from ${f(m)}, ignoring the sign: ${v.map((x, i) => `|${x} − ${f(m)}| = ${d[i]}`).join(", ")}.`,
              `Distancia = qué tan lejos está el valor de ${f(m)}, sin importar el signo: ${v.map((x, i) => `|${x} − ${f(m)}| = ${d[i]}`).join(", ")}.`,
            ),
            h: [
              pair(
                "A distance tells how far apart two numbers are, so it is never negative.",
                "Una distancia dice qué tan separados están dos números, así que nunca es negativa.",
              ),
              pair(
                "For each value, subtract the mean and drop any minus sign.",
                "En cada valor, resta la media y quita el signo menos si lo hay.",
              ),
              pair(
                "Do the first value and check which list starts with that distance.",
                "Haz el primer valor y revisa qué lista empieza con esa distancia.",
              ),
            ],
            meta: meta("dist", { data: v }),
          });
        }
        return NUM({
          q: cat(
            lead,
            pair(
              "Find how far each value is from the mean. What is the sum of those distances?",
              "Halla qué tan lejos está cada valor de la media. ¿Cuál es la suma de esas distancias?",
            ),
          ),
          a: sum(d),
          fw: [
            bad(0, "stat-signed-deviations"),
            bad(
              f(mad(v), 1),
              "stat-mad-as-total-distance",
              "That is the average distance. The question asks for the sum of the distances.",
              "Esa es la distancia promedio. La pregunta pide la suma de las distancias.",
            ),
            bad(sum(v), "stat-value-not-distance"),
          ],
          x: pair(
            `Distances: ${d.join(", ")}. Sum: ${d.join(" + ")} = ${sum(d)}.`,
            `Distancias: ${d.join(", ")}. Suma: ${d.join(" + ")} = ${sum(d)}.`,
          ),
          h: [
            pair(
              "Subtract the mean from each value and ignore the sign.",
              "Resta la media a cada valor e ignora el signo.",
            ),
            pair(
              "Write all the distances in a list.",
              "Escribe todas las distancias en una lista.",
            ),
            pair("Add the distances.", "Suma las distancias."),
          ],
          meta: meta("distSum", { data: v }),
        });
      }

      /* L3: the whole MAD */
      if (level === 3) {
        const n = rng.int(5, 8);
        const v = rng.shuffle(set(n, 4));
        const m = mean(v);
        const d = distances(v, m);
        return NUM({
          q: cat(
            ctxList(c, v, false),
            pair(
              "Find the mean absolute deviation (MAD).",
              "Halla la desviación absoluta media (DMA).",
            ),
          ),
          a: f(mad(v)),
          fw: [
            bad(0, "stat-signed-deviations"),
            bad(sum(d), "stat-distances-not-averaged"),
            bad(f(sum(d) / (n - 1), 1), "stat-wrong-divisor"),
            bad(m, "stat-center-vs-spread"),
            bad(Math.max(...v) - Math.min(...v), "stat-range-for-mad"),
            bad(f(mean(distances(v, midOf(asc(v)))), 1), "stat-deviation-from-median"),
          ],
          x: steps(v),
          h: madHints,
          meta: meta("mad", { data: v }),
        });
      }

      /* L4: compare two data sets with the same mean */
      const [A, B] = rng.pick(NAMES);
      const n = 5;
      const m = rng.int(c.lo + 4, c.hi - 4);
      const [va, vb] = until(
        () => {
          const t = withMean(rng, n, m, 1, c.lo, c.hi);
          const w = withMean(rng, n, m, 5, c.lo, c.hi);
          return rng.chance(0.5) ? [t, w] : [w, t];
        },
        ([a, b]) => tidy(mad(a)) && tidy(mad(b)) && Math.abs(mad(a) - mad(b)) >= 1,
      );
      const spread = rng.chance(0.5);
      const aBigger = mad(va) > mad(vb);
      const pickA = spread ? aBigger : !aBigger;
      const [Rt, Wr] = (pickA ? [A, B] : [B, A]).map(upP);
      return MC(rng, {
        q: cat(
          pair(
            `${A[0].replace(/^./, (s) => s.toUpperCase())}: ${list(va)}. ${B[0].replace(/^./, (s) => s.toUpperCase())}: ${list(vb)}. Both have a mean of ${m}.`,
            `${A[1].replace(/^./, (s) => s.toUpperCase())}: ${list(va)}. ${B[1].replace(/^./, (s) => s.toUpperCase())}: ${list(vb)}. Las dos tienen una media de ${m}.`,
          ),
          pair(
            spread
              ? "Which has scores that are more spread out?"
              : "Which has scores that are more consistent?",
            spread
              ? "¿Cuál tiene puntajes más dispersos?"
              : "¿Cuál tiene puntajes más consistentes?",
          ),
        ),
        right: Rt,
        wrong: [
          bad(
            Wr,
            "stat-compared-by-range",
            "Compare the MADs. The set with the smaller MAD has values closer to the mean.",
            "Compara las DMA. El conjunto con la DMA menor tiene valores más cerca de la media.",
          ),
          bad(
            pair("They are equally spread out", "Están igual de dispersos"),
            "stat-same-mean-same-spread",
          ),
          bad(
            pair("It cannot be told", "No se puede saber"),
            "stat-no-comparison",
            "You have all the values, so you can find each MAD and compare.",
            "Tienes todos los valores, así que puedes hallar cada DMA y compararlas.",
          ),
        ],
        x: pair(
          `${A[0].replace(/^./, (s) => s.toUpperCase())} has a MAD of ${f(mad(va))} and ${B[0]} has a MAD of ${f(mad(vb))}. A bigger MAD means more spread out; a smaller MAD means more consistent.`,
          `${A[1].replace(/^./, (s) => s.toUpperCase())} tiene una DMA de ${f(mad(va))} y ${B[1]} tiene una DMA de ${f(mad(vb))}. Una DMA mayor significa más dispersión; una DMA menor significa más consistencia.`,
        ),
        h: [
          pair(
            "The means are the same, so compare how far the values are from that mean.",
            "Las medias son iguales, así que compara qué tan lejos están los valores de esa media.",
          ),
          pair(
            "Find the MAD of each set: distances from the mean, added, then divided by how many.",
            "Halla la DMA de cada conjunto: distancias a la media, sumadas y divididas entre cuántas hay.",
          ),
          pair(
            "A smaller MAD means the values stay closer to the mean.",
            "Una DMA menor significa que los valores se quedan más cerca de la media.",
          ),
        ],
        meta: meta("compare", { a: va, b: vb, spread, names: [up(A[0]), up(B[0])] }),
      });
    },
    check(it) {
      const m = it.meta;
      switch (m.kind) {
        case "mean":
          return verdict(it, meanC(m.data), "mean");
        case "dist": {
          const mu = meanC(m.data);
          return verdictText(it, list(m.data.map((x) => Math.abs(x - mu))), "distances");
        }
        case "distSum":
          return verdict(it, madC(m.data) * m.data.length, "sum of distances");
        case "mad":
          return verdict(it, madC(m.data), "MAD");
        default: {
          const aBig = madC(m.a) > madC(m.b);
          const want = m.spread === aBig ? m.names[0] : m.names[1];
          return verdictText(it, want, "which set");
        }
      }
    },
  });

  /* ---- chooseMeasure ---------------------------------------------------------------------- */
  const OUT = [
    {
      intro: (n) =>
        pair(
          `The weekly allowances (in dollars) of ${n} students`,
          `Las mesadas semanales (en dólares) de ${n} estudiantes`,
        ),
      lo: 5,
      hi: 14,
      dir: 1,
      jump: [55, 90],
    },
    {
      intro: (n) =>
        pair(
          `The minutes ${n} students spent on screens yesterday`,
          `Los minutos que ${n} estudiantes pasaron ante pantallas ayer`,
        ),
      lo: 60,
      hi: 130,
      dir: 1,
      jump: [250, 330],
    },
    {
      intro: (n) =>
        pair(
          `The points a player scored in ${n} games`,
          `Los puntos que anotó un jugador en ${n} partidos`,
        ),
      lo: 8,
      hi: 18,
      dir: 1,
      jump: [25, 40],
    },
    {
      intro: (n) =>
        pair(
          `The text messages ${n} students sent today`,
          `Los mensajes de texto que enviaron ${n} estudiantes hoy`,
        ),
      lo: 10,
      hi: 28,
      dir: 1,
      jump: [70, 110],
    },
    {
      intro: (n) =>
        pair(
          `The prices (in thousands of dollars) of ${n} homes on one street`,
          `Los precios (en miles de dólares) de ${n} casas de una calle`,
        ),
      lo: 180,
      hi: 230,
      dir: 1,
      jump: [600, 900],
    },
    {
      intro: (n) =>
        pair(
          `The scores of ${n} students on a 20-point quiz`,
          `Los puntajes de ${n} estudiantes en una prueba corta de 20 puntos`,
        ),
      lo: 15,
      hi: 19,
      dir: -1,
      jump: [11, 13],
    },
  ];
  const fence = (a) => {
    const q = fiveC(a);
    const i = q.q3 - q.q1;
    return {
      q,
      i,
      out: a.filter((x) => x > q.q3 + 1.5 * i || x < q.q1 - 1.5 * i),
      far: a.filter((x) => x > q.q3 + 3 * i || x < q.q1 - 3 * i),
    };
  };
  /** n values: n-1 close together plus one far-away value; optionally the mean is a whole number. */
  const outlierSet = (rng, o, n, whole) =>
    until(
      () => {
        const base = Array.from(
          { length: n - 1 },
          () => o.lo + Math.floor(((rng.next() + rng.next()) / 2) * (o.hi - o.lo + 1)),
        );
        const room = [];
        for (let j = o.jump[0]; j <= o.jump[1]; j++) {
          const val = o.dir > 0 ? o.hi + j : o.lo - j;
          if (val >= 0 && (!whole || (sum(base) + val) % n === 0)) room.push(val);
        }
        return room.length ? rng.shuffle([...base, rng.pick(room)]) : null;
      },
      (v) => {
        if (!v) return false;
        const fe = fence(v);
        return (
          fe.i >= 2 &&
          fe.far.length === 1 &&
          fe.out.length === 1 &&
          !near(mean(v), midOf(asc(v))) &&
          new Set(v).size >= n - 3
        );
      },
    );
  const symmetricSet = (rng, o, n) =>
    until(
      () => {
        const mid = Math.round((o.lo + o.hi) / 2);
        const d = Math.max(2, Math.round((o.hi - o.lo) / 3));
        const offs = Array.from({ length: (n - 1) / 2 }, () => rng.int(1, d));
        return rng.shuffle([mid, ...offs.map((x) => mid + x), ...offs.map((x) => mid - x)]);
      },
      (v) => {
        const fe = fence(v);
        return fe.i >= 2 && fe.out.length === 0 && new Set(v).size >= n - 2;
      },
    );
  const listIntro = (o, v) =>
    pair(`${o.intro(v.length)[0]}: ${list(v)}.`, `${o.intro(v.length)[1]}: ${list(v)}.`);

  G.register("chooseMeasure", {
    title: "Choose the best measure",
    titleEs: "Elegir la mejor medida",
    levels: 4,
    make(rng, level) {
      const o = rng.pick(level === 2 ? OUT.filter((x) => x.dir > 0) : OUT);
      const meta = (kind, extra) => ({ kind, ...extra });
      const why = pair(
        "An outlier pulls the mean toward it, but the median stays near the middle of most of the data. When there is an outlier, use the median and the IQR. When the data is balanced with no outlier, use the mean and the MAD.",
        "Un valor atípico jala la media hacia él, pero la mediana se queda cerca del medio de la mayoría de los datos. Cuando hay un valor atípico, usa la mediana y el RIC. Cuando los datos están balanceados y no hay valor atípico, usa la media y la DMA.",
      );

      /* L1: spot the outlier, or name the center that is not fooled by it */
      if (level === 1) {
        const n = rng.pick([6, 7]);
        const v = outlierSet(rng, o, n, false);
        const out = fence(v).far[0];
        const rest = asc(v.filter((x) => x !== out));
        if (rng.chance(0.5)) {
          return MC(rng, {
            q: cat(
              listIntro(o, v),
              pair("Which value is the outlier?", "¿Cuál valor es el valor atípico?"),
            ),
            right: String(out),
            wrong: [
              bad(rest[rest.length - 1], "stat-outlier-wrong-value"),
              bad(rest[0], "stat-outlier-wrong-value"),
              bad(rest[rest.length >> 1], "stat-outlier-wrong-value"),
              bad(f(mean(v), 1), "stat-mean-skewed-by-outlier"),
            ],
            x: pair(
              `${out} is far from all the others, which sit between ${rest[0]} and ${rest[rest.length - 1]}. That one value is the outlier.`,
              `${out} está lejos de todos los demás, que están entre ${rest[0]} y ${rest[rest.length - 1]}. Ese único valor es el valor atípico.`,
            ),
            h: [
              pair(
                "An outlier is a value that is much bigger or much smaller than the rest.",
                "Un valor atípico es un valor mucho mayor o mucho menor que los demás.",
              ),
              pair(
                "Put the values in order and look for a big gap.",
                "Ordena los valores y busca un hueco grande.",
              ),
              pair(
                "Most values are close together. Which one is far from them?",
                "La mayoría de los valores están cerca. ¿Cuál está lejos de ellos?",
              ),
            ],
            meta: meta("outlier", { data: v }),
          });
        }
        return MC(rng, {
          q: cat(
            listIntro(o, v),
            pair(
              "One value is far from the rest. Which measure of center best shows a typical value?",
              "Un valor está lejos de los demás. ¿Qué medida de centro muestra mejor un valor típico?",
            ),
          ),
          right: pair("Median", "Mediana"),
          wrong: [
            bad(pair("Mean", "Media"), "stat-mean-skewed-by-outlier"),
            bad(pair("Range", "Rango"), "stat-range-for-center"),
            bad(
              pair("Greatest value", "Valor mayor"),
              "stat-mode-for-center",
              "That is one value, and it is the outlier. A typical value should come from the middle of the data.",
              "Ese es un solo valor, y es el valor atípico. Un valor típico debe salir del medio de los datos.",
            ),
          ],
          x: pair(
            `The mean is pulled toward ${out}. ${why[0]}`,
            `La media es jalada hacia ${out}. ${why[1]}`,
          ),
          h: [
            pair(
              "Think about which measure moves most when one value is very far away.",
              "Piensa qué medida se mueve más cuando un valor está muy lejos.",
            ),
            pair(
              "The range is a measure of spread, not center. That leaves the mean, the median and the greatest value.",
              "El rango es una medida de dispersión, no de centro. Quedan la media, la mediana y el valor mayor.",
            ),
            pair(
              "Which measure ignores how far away the outlier is and only uses the middle?",
              "¿Qué medida ignora qué tan lejos está el valor atípico y solo usa el medio?",
            ),
          ],
          meta: meta("center", { data: v }),
        });
      }

      /* L2: what an outlier does to the mean and to the median */
      if (level === 2) {
        const n = rng.pick([5, 7]);
        const m = Math.round((o.lo + o.hi) / 2);
        const base = until(
          () => withMean(rng, n, m, 4, o.lo, o.hi),
          (v) => {
            const s = asc(v);
            return s[n >> 1] !== s[(n >> 1) + 1] && new Set(v).size >= n - 3;
          },
        );
        const nv = until(
          () => o.hi + rng.int(o.jump[0], o.jump[1]),
          (x) => (sum(base) + x) % (n + 1) === 0,
        );
        const all = [...base, nv];
        const dMean = mean(all) - mean(base);
        const dMed = midOf(asc(all)) - midOf(asc(base));
        const lead = cat(
          listIntro(o, base),
          pair(`A new value of ${nv} is added.`, `Se agrega un valor nuevo de ${nv}.`),
        );
        const hintsL2 = [
          pair(
            "Work out the mean and the median of the list before the new value.",
            "Calcula la media y la mediana de la lista antes del valor nuevo.",
          ),
          pair(
            "Then work out both again with the new value in the list.",
            "Luego calcula las dos otra vez con el valor nuevo en la lista.",
          ),
          pair("Compare how much each one moved.", "Compara cuánto se movió cada una."),
        ];
        if (rng.chance(0.5)) {
          return MC(rng, {
            q: cat(
              lead,
              pair(
                "What happens to the mean and the median?",
                "¿Qué pasa con la media y la mediana?",
              ),
            ),
            right: pair(
              "The mean goes up a lot; the median goes up only a little.",
              "La media sube mucho; la mediana sube solo un poco.",
            ),
            wrong: [
              bad(
                pair(
                  "The mean and the median go up by the same amount.",
                  "La media y la mediana suben la misma cantidad.",
                ),
                "stat-both-change-same",
              ),
              bad(
                pair("The median goes up more than the mean.", "La mediana sube más que la media."),
                "stat-median-moves-most",
              ),
              bad(
                pair(
                  "Neither the mean nor the median changes.",
                  "Ni la media ni la mediana cambian.",
                ),
                "stat-neither-changes",
              ),
            ],
            x: pair(
              `Before: mean ${f(mean(base))}, median ${f(midOf(asc(base)))}. After: mean ${f(mean(all))}, median ${f(midOf(asc(all)))}. The mean rose by ${f(dMean)} but the median by only ${f(dMed)}.`,
              `Antes: media ${f(mean(base))}, mediana ${f(midOf(asc(base)))}. Después: media ${f(mean(all))}, mediana ${f(midOf(asc(all)))}. La media subió ${f(dMean)} pero la mediana solo ${f(dMed)}.`,
            ),
            h: hintsL2,
            meta: meta("effect", { base, nv, mode: "statement" }),
          });
        }
        return NUM({
          q: cat(lead, pair("By how much does the mean go up?", "¿Cuánto sube la media?")),
          a: f(dMean),
          fw: [
            bad(
              nv,
              "stat-new-value-not-change",
              "That is the new value itself. The mean moves by much less, because the new total is shared among all the values.",
              "Ese es el valor nuevo. La media se mueve mucho menos, porque el total nuevo se reparte entre todos los valores.",
            ),
            bad(f(dMed), "stat-both-change-same"),
            bad(
              f(mean(all)),
              "stat-new-mean-not-change",
              "That is the new mean. The question asks how much the mean went up.",
              "Esa es la nueva media. La pregunta pide cuánto subió la media.",
            ),
          ],
          x: pair(
            `Old mean: ${sum(base)} ÷ ${n} = ${f(mean(base))}. New mean: ${sum(all)} ÷ ${n + 1} = ${f(mean(all))}. Increase: ${f(mean(all))} − ${f(mean(base))} = ${f(dMean)}.`,
            `Media anterior: ${sum(base)} ÷ ${n} = ${f(mean(base))}. Media nueva: ${sum(all)} ÷ ${n + 1} = ${f(mean(all))}. Aumento: ${f(mean(all))} − ${f(mean(base))} = ${f(dMean)}.`,
          ),
          h: hintsL2,
          meta: meta("effect", { base, nv, mode: "amount" }),
        });
      }

      /* L3: pick the center AND the spread that go together */
      if (level === 3) {
        const n = rng.pick([7, 9]);
        const skew = rng.chance(0.5);
        const v = skew ? outlierSet(rng, o, n, false) : symmetricSet(rng, o, n);
        const MM = pair("Mean and MAD", "Media y DMA");
        const MI = pair("Median and IQR", "Mediana y RIC");
        return MC(rng, {
          q: cat(
            listIntro(o, v),
            pair(
              "Which measure of center and which measure of spread describe this data set best?",
              "¿Qué medida de centro y qué medida de dispersión describen mejor este conjunto de datos?",
            ),
          ),
          right: skew ? MI : MM,
          wrong: skew
            ? [
                bad(MM, "stat-mean-skewed-by-outlier"),
                bad(pair("Mean and IQR", "Media y RIC"), "stat-pairing-mixup"),
                bad(pair("Median and MAD", "Mediana y DMA"), "stat-pairing-mixup"),
              ]
            : [
                bad(pair("Mean and IQR", "Media y RIC"), "stat-pairing-mixup"),
                bad(pair("Median and MAD", "Mediana y DMA"), "stat-pairing-mixup"),
                bad(pair("Mode and range", "Moda y rango"), "stat-range-for-center"),
              ],
          x: skew
            ? pair(
                `${fence(v).far[0]} is an outlier. ${why[0]}`,
                `${fence(v).far[0]} es un valor atípico. ${why[1]}`,
              )
            : pair(
                `The values are balanced around the middle with no outlier. ${why[0]}`,
                `Los valores están balanceados alrededor del medio y no hay valor atípico. ${why[1]}`,
              ),
          h: [
            pair(
              "First decide: does the data set have an outlier, or is it balanced?",
              "Primero decide: ¿el conjunto de datos tiene un valor atípico o está balanceado?",
            ),
            pair(
              "The mean goes with the MAD, because both use the mean. The median goes with the IQR, because both use the order of the data.",
              "La media va con la DMA, porque las dos usan la media. La mediana va con el RIC, porque las dos usan el orden de los datos.",
            ),
            pair(
              "An outlier ruins the mean and the MAD. Pick the pair that matches your decision.",
              "Un valor atípico arruina la media y la DMA. Elige la pareja que corresponde a tu decisión.",
            ),
          ],
          meta: meta("pair", { data: v }),
        });
      }

      /* L4: the best summary of a situation, with its value */
      const n = rng.pick([7, 8, 9]);
      const v = outlierSet(rng, o, n, true);
      const s = asc(v);
      const med = midOf(s);
      const mo = modeOfList(v);
      const lastWrong =
        mo !== null
          ? [`${pair("Mode", "Moda")[0]}, ${mo}`, `${pair("Mode", "Moda")[1]}, ${mo}`]
          : [
              `Middle of the range, ${f((s[0] + s[n - 1]) / 2)}`,
              `Mitad del rango, ${f((s[0] + s[n - 1]) / 2)}`,
            ];
      return MC(rng, {
        q: cat(
          listIntro(o, rng.shuffle(v)),
          pair(
            "Which summary best describes a typical value in this situation?",
            "¿Qué resumen describe mejor un valor típico en esta situación?",
          ),
        ),
        right: pair(`Median, ${f(med)}`, `Mediana, ${f(med)}`),
        wrong: [
          bad(pair(`Mean, ${f(mean(v))}`, `Media, ${f(mean(v))}`), "stat-mean-skewed-by-outlier"),
          bad(
            pair(`Range, ${f(s[n - 1] - s[0])}`, `Rango, ${f(s[n - 1] - s[0])}`),
            "stat-range-for-center",
          ),
          bad(lastWrong, mo !== null ? "stat-mode-for-center" : "stat-midrange"),
        ],
        x: pair(
          `The outlier pulls the mean to ${f(mean(v))}, which is not near most of the values. The median, ${f(med)}, is the middle of the ordered data (${list(s)}), so it describes a typical value better.`,
          `El valor atípico jala la media hasta ${f(mean(v))}, que no está cerca de la mayoría de los valores. La mediana, ${f(med)}, es el medio de los datos ordenados (${list(s)}), así que describe mejor un valor típico.`,
        ),
        h: [
          pair(
            "Look for a value that is far from the rest. Is there an outlier?",
            "Busca un valor que esté lejos de los demás. ¿Hay un valor atípico?",
          ),
          pair(
            "Work out the mean and the median. Which one is close to most of the values?",
            "Calcula la media y la mediana. ¿Cuál está cerca de la mayoría de los valores?",
          ),
          pair(
            "The range is a spread, not a center. The measure you want ignores how far the outlier is.",
            "El rango es una dispersión, no un centro. La medida que buscas ignora qué tan lejos está el valor atípico.",
          ),
        ],
        meta: meta("summary", { data: v }),
      });
    },
    check(it) {
      const m = it.meta;
      const fe = m.data ? fence(m.data) : null;
      switch (m.kind) {
        case "outlier":
          return verdict(it, fe.far[0], "outlier");
        case "center":
          return fe.far.length === 1
            ? verdictText(it, "Median", "best center with an outlier")
            : "no outlier in the data";
        case "pair":
          return verdictText(
            it,
            fe.out.length ? "Median and IQR" : "Mean and MAD",
            "pair of measures",
          );
        case "summary":
          return fe.far.length === 1
            ? verdictText(it, `Median, ${f(medC(m.data))}`, "best summary")
            : "no outlier in the data";
        default: {
          const all = [...m.base, m.nv];
          const dMean = meanC(all) - meanC(m.base);
          const dMed = medC(all) - medC(m.base);
          if (m.mode === "amount") return verdict(it, dMean, "increase in the mean");
          const truth = [
            dMean > dMed && dMed > 0,
            near(dMean, dMed),
            dMed > dMean,
            dMean === 0 && dMed === 0,
          ];
          const label = {
            "The mean goes up a lot; the median goes up only a little.": 0,
            "The mean and the median go up by the same amount.": 1,
            "The median goes up more than the mean.": 2,
            "Neither the mean nor the median changes.": 3,
          };
          const k = label[it.c[it.a]];
          return k !== undefined && truth[k] && truth.filter(Boolean).length === 1
            ? true
            : "the keyed statement is not the one true statement";
        }
      }
    },
  });
})();
