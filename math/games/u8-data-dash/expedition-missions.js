/* Wildlife Signal — mission builders, part 1 (survey, histogram, balance).
 *   survey     field tablets: only statistical questions bring back varied answers
 *   histogram  the station display: bar heights are the student's counts per interval
 *   balance    the migration beam: the fulcrum the student sets is tested against the tags
 * The math (generators, judges, misconception classifier) lives in expedition-data.js.
 */
(function () {
  "use strict";
  const X = window.EWLExpedition;
  const D = window.DD_MISSIONS;
  if (!X || !D || !D.math) return;
  const { L, fmt, fill } = D;
  const M = D.math;
  const PANEL = 0x0a1a26;
  const GOLD = 0xffd76a;
  const WARN = 0xff9a5c;
  const GOOD = 0x7ee3a0;

  /** Misconception feedback: names the error in plain words, never the answer. */
  const MSG = {
    singleAnswer: L(
      "A tablet got the SAME answer every time. That question has only one answer, so it has no variability.",
      "Una tableta recibió la MISMA respuesta cada vez. Esa pregunta tiene una sola respuesta, así que no tiene variabilidad.",
    ),
    missedVariability: L(
      "You archived a question that would collect many different answers. That kind of question is statistical.",
      "Archivaste una pregunta que recogería muchas respuestas diferentes. Ese tipo de pregunta es estadística.",
    ),
    missedData: L(
      "Your bars count {got} {who}, but the log has {n} tags. Every tag goes in exactly one bar.",
      "Tus barras cuentan {got} {who}, pero el registro tiene {n} etiquetas. Cada etiqueta va en una sola barra.",
    ),
    edgeBin: L(
      "A tag on an edge went in the bar below. An interval that starts at {edge} includes {edge}.",
      "Una etiqueta en un borde quedó en la barra de abajo. El intervalo que empieza en {edge} incluye el {edge}.",
    ),
    binCount: L(
      "The orange bars do not match the log. Recount the tags for those intervals.",
      "Las barras anaranjadas no coinciden con el registro. Vuelve a contar las etiquetas de esos intervalos.",
    ),
    unsortedMedian: L(
      "You used the middle of the log as it was recorded. Put the tags in order first, then find the middle.",
      "Usaste el centro del registro tal como se anotó. Primero ordena las etiquetas y luego busca el centro.",
    ),
    oneMiddle: L(
      "With {n} tags there are TWO middle values. The median is halfway between them.",
      "Con {n} etiquetas hay DOS valores centrales. La mediana está a mitad de camino entre ellos.",
    ),
    medianCount: L(
      "Your marker does not split the tags in half: {left} tags are below it and {right} are above it.",
      "Tu marcador no divide las etiquetas por la mitad: {left} quedan por debajo y {right} por encima.",
    ),
    whiskerEnds: L(
      "A whisker does not reach the end of the data. Whiskers go to the least and the greatest tag.",
      "Un bigote no llega al final de los datos. Los bigotes van hasta la etiqueta menor y la mayor.",
    ),
    quartileInclusive: L(
      "With {n} tags (an odd number), leave the median out of both halves. Then find the middle of each half.",
      "Con {n} etiquetas (un número impar), deja la mediana fuera de las dos mitades. Luego busca el centro de cada mitad.",
    ),
    quartileOff: L(
      "A quartile is off. Q1 is the middle of the lower half; Q3 is the middle of the upper half.",
      "Un cuartil no está bien. Q1 es el centro de la mitad inferior; Q3 es el centro de la mitad superior.",
    ),
    rangeIqrSwap: L(
      "Check which number goes where. The fence is the range (greatest − least). The core zone is the IQR (Q3 − Q1).",
      "Revisa qué número va en cada lugar. La cerca es el rango (mayor − menor). La zona central es el RIC (Q3 − Q1).",
    ),
    spreadAsValue: L(
      "A spread is a DISTANCE, not a position on the ruler. Subtract to find it.",
      "Una dispersión es una DISTANCIA, no una posición en la regla. Resta para hallarla.",
    ),
    rangeCalc: L(
      "The fence does not fit: a tag ends up outside it, or the fence runs past the last tag. Recheck greatest − least.",
      "La cerca no encaja: una etiqueta queda afuera o la cerca pasa de la última. Revisa mayor − menor.",
    ),
    iqrCalc: L(
      "The core zone does not fit the middle half of the tags. Find Q1 and Q3, then subtract.",
      "La zona central no encaja con la mitad central de las etiquetas. Halla Q1 y Q3 y luego resta.",
    ),
    meanIsMedian: L(
      "You balanced at the middle tag (the median). The mean uses the size of EVERY tag: add them all, then divide.",
      "Equilibraste en la etiqueta del centro (la mediana). La media usa el valor de TODAS: súmalas y luego divide.",
    ),
    midrange: L(
      "You balanced halfway between the least and greatest tag. The mean uses every tag, not only the two ends.",
      "Equilibraste a mitad de camino entre la menor y la mayor. La media usa todas las etiquetas, no solo los extremos.",
    ),
    meanIsMode: L(
      "You balanced at the most common tag. The mean uses every tag: add them all, then divide.",
      "Equilibraste en la etiqueta más común. La media usa todas las etiquetas: súmalas y luego divide.",
    ),
    notBalanced: L(
      "The beam tips to the {side}: the tags on that side pull harder. Add the tags and divide to find the balance point.",
      "La viga se inclina hacia la {side}: las etiquetas de ese lado pesan más. Suma y divide para hallar el punto de equilibrio.",
    ),
    signedDeviations: L(
      "A distance is never negative. Plus and minus cancel out. Use how FAR each tag is from the mean.",
      "Una distancia nunca es negativa. Los positivos y negativos se cancelan. Usa qué tan LEJOS está cada etiqueta de la media.",
    ),
    distanceOff: L(
      "A rope does not reach its tag. Each distance is how far that tag is from the mean.",
      "Una cuerda no llega a su etiqueta. Cada distancia es qué tan lejos está esa etiqueta de la media.",
    ),
    noDivide: L(
      "You added the distances. The MAD is their MEAN, so the total still needs dividing by {n}.",
      "Sumaste las distancias. La DMA es su MEDIA, así que falta dividir el total entre {n}.",
    ),
    madCalc: L(
      "Your MAD is not the mean of the distances. Add the distances, then divide by {n}.",
      "Tu DMA no es la media de las distancias. Suma las distancias y luego divide entre {n}.",
    ),
    meanOff: L(
      "The mean line is not at the balance point. Add the tags, then divide by {n}.",
      "La línea de la media no está en el punto de equilibrio. Suma las etiquetas y divide entre {n}.",
    ),
    biggerMadConsistent: L(
      "A bigger MAD means the data is MORE spread out. Consistent data stays close to its mean.",
      "Una DMA mayor significa datos MÁS dispersos. Los datos constantes se quedan cerca de su media.",
    ),
    meanWithOutlier: L(
      "The outlier at {o} pulls the mean away from most of the tags. Choose a measure the outlier cannot pull.",
      "El valor atípico {o} jala la media lejos de casi todas las etiquetas. Elige una medida que el valor atípico no pueda jalar.",
    ),
    medianSymmetric: L(
      "This data is symmetric with no outlier. Then the measure that uses the size of every tag is the usual choice.",
      "Estos datos son simétricos y sin valores atípicos. Entonces se usa la medida que usa el valor de cada etiqueta.",
    ),
    spreadMismatch: L(
      "Your spread does not match your center. Mean goes with MAD; median goes with IQR.",
      "Tu dispersión no corresponde con tu centro. La media va con la DMA; la mediana va con el RIC.",
    ),
    meanCalc: L(
      "Your beacon is not at the mean. Add all the tags, then divide by {n}.",
      "Tu baliza no está en la media. Suma todas las etiquetas y luego divide entre {n}.",
    ),
  };
  const miss = (tag, vars) => ({
    ok: false,
    misconception: tag,
    feedback: fill(MSG[tag], vars || {}),
  });

  /** A small rounded tag chip (data value), returned as a container. */
  function chip(scene, kit, x, y, w, label, color = 0x16384c) {
    const c = scene.add.container(x, y).setDepth(22);
    const bg = scene.add.graphics();
    const paint = (fillC, line, a = 1) => {
      bg.clear();
      bg.fillStyle(fillC, a).fillRoundedRect(-w / 2, -15, w, 30, 8);
      bg.lineStyle(2, line, 0.85).strokeRoundedRect(-w / 2, -15, w, 30, 8);
    };
    paint(color, 0x5fa7c4);
    const tx = scene.add
      .text(0, 0, label, { fontFamily: kit.FONT, fontSize: "17px", fontStyle: "800", color: "#ffffff" })
      .setOrigin(0.5);
    c.add([bg, tx]);
    c.paint = paint;
    c.label = tx;
    return c;
  }
  /** Number line → x. */
  const scaleX = (lo, hi, x0, x1) => (v) => x0 + ((v - lo) / (hi - lo)) * (x1 - x0);

  /* ── survey: which questions go to the field tablets (2-1) ─────────────── */
  function survey(scene, api) {
    const { kit, rng } = api;
    const g = M.genSurvey(rng, api.tier);
    const on = g.cards.map(() => false);
    let sel = 0;
    api.setBrief(
      L(
        "Only questions with MANY different answers are worth a survey. Send those to the rangers' tablets. Archive the rest.",
        "Solo vale la pena encuestar con preguntas de MUCHAS respuestas diferentes. Envía esas a las tabletas. Archiva las demás.",
      ),
    );
    const cards = g.cards.map((c, i) => {
      const x = 24 + (i % 2) * 392;
      const y = 138 + Math.floor(i / 2) * 114;
      const bg = scene.add.graphics().setDepth(21);
      const q = kit.text(x + 14, y + 12, api.t(c.q), 15, "#eaf6ff", { ox: 0, oy: 0, wrap: 258, align: "left", depth: 22 });
      const beacon = scene.add.graphics().setDepth(22);
      const state = kit.text(x + 326, y + 78, "", 12, "#cfe3ee", { depth: 22, weight: "800" });
      const strip = scene.add.graphics().setDepth(22);
      const zone = scene.add.zone(x + 190, y + 53, 380, 106).setInteractive({ useHandCursor: true }).setDepth(24);
      zone.on("pointerup", () => {
        sel = i;
        toggle();
      });
      return { x, y, bg, q, beacon, state, strip };
    });
    function draw() {
      cards.forEach((c, i) => {
        const active = i === sel;
        c.bg.clear();
        c.bg.fillStyle(PANEL, 0.92).fillRoundedRect(c.x, c.y, 380, 106, 12);
        c.bg.lineStyle(active ? 4 : 2, active ? GOLD : kit.accent, active ? 1 : 0.4);
        c.bg.strokeRoundedRect(c.x, c.y, 380, 106, 12);
        c.bg.fillStyle(0x02070c, 0.5).fillRoundedRect(c.x + 280, c.y + 8, 92, 90, 10);
        const bx = c.x + 326;
        const by = c.y + 40;
        c.beacon.clear();
        c.beacon.fillStyle(0x2a3a44, 1).fillRect(bx - 3, by, 6, 22);
        c.beacon.fillStyle(on[i] ? kit.accent : 0x4b5a66, 1).fillCircle(bx, by, 11);
        if (on[i]) {
          c.beacon.lineStyle(3, kit.accent, 0.9).beginPath();
          c.beacon.arc(bx, by, 19, -2.4, -0.74).strokePath();
          c.beacon.lineStyle(3, kit.accent, 0.5).beginPath();
          c.beacon.arc(bx, by, 27, -2.4, -0.74).strokePath();
        }
        c.state.setText(on[i] ? api.t(L("ON TABLETS", "EN TABLETAS")) : api.t(L("ARCHIVED", "ARCHIVADA")));
        c.state.setColor(on[i] ? kit.css(kit.accent) : "#8a9aa6");
      });
    }
    function toggle() {
      on[sel] = !on[sel];
      cards.forEach((c) => c.strip.clear());
      api.sfx.select();
      draw();
      api.refresh();
    }
    const move = (d) => {
      sel = (sel + d + on.length) % on.length;
      draw();
      api.refresh();
    };
    draw();
    /** Deployed tablets report back: varied bars for statistical questions, identical ones otherwise. */
    async function launch() {
      for (let i = 0; i < cards.length; i++) {
        const c = cards[i];
        c.strip.clear();
        if (!on[i]) continue;
        const stat = g.cards[i].stat;
        for (let k = 0; k < 9; k++) {
          const h = stat ? 4 + ((i * 7 + k * 5 + (k * k) % 7) % 14) : 9;
          c.strip.fillStyle(stat ? kit.accent : WARN, 0.95).fillRect(c.x + 16 + k * 14, c.y + 96 - h, 9, h);
        }
        api.sfx.tick(i * 2);
        await kit.wait(160);
      }
    }
    return {
      checkLabel: L("Launch the survey", "Lanzar la encuesta"),
      get actions() {
        return [
          { key: " ", label: L("Send / archive this card", "Enviar / archivar esta tarjeta"), run: toggle },
          { key: "ArrowRight", label: L("Next card →", "Tarjeta siguiente →"), run: () => move(1) },
          { key: "ArrowLeft", label: L("← Previous card", "← Tarjeta anterior"), run: () => move(-1) },
          { key: "ArrowDown", label: L("Card below ↓", "Tarjeta de abajo ↓"), run: () => move(2) },
          { key: "ArrowUp", label: L("Card above ↑", "Tarjeta de arriba ↑"), run: () => move(-2) },
        ];
      },
      status: () =>
        L(
          `Card ${sel + 1}: ${on[sel] ? "on the tablets" : "archived"}. Sent ${on.filter(Boolean).length} of ${on.length}.`,
          `Tarjeta ${sel + 1}: ${on[sel] ? "en las tabletas" : "archivada"}. Enviadas ${on.filter(Boolean).length} de ${on.length}.`,
        ),
      hints: [
        L(
          "A statistical question expects answers that VARY. Ask: would different animals, days or rangers give different answers?",
          "Una pregunta estadística espera respuestas que VARÍAN. Pregúntate: ¿distintos animales, días o guardabosques darían respuestas distintas?",
        ),
        L(
          `A question about ONE animal, ONE nest or ONE fixed fact has one answer. ${g.k} of these ${on.length} questions collect varied data.`,
          `Una pregunta sobre UN animal, UN nido o UN dato fijo tiene una sola respuesta. ${g.k} de estas ${on.length} preguntas recogen datos variados.`,
        ),
      ],
      async check() {
        const res = M.judgeSurvey(g, on);
        if (res.incomplete)
          return {
            ok: false,
            incomplete: true,
            feedback: L("Send at least one question to the tablets first.", "Primero envía al menos una pregunta a las tabletas."),
          };
        await launch();
        if (res.ok) {
          cards.forEach((c, i) => on[i] && kit.burst(c.x + 326, c.y + 40, kit.accent, 12));
          return { ok: true };
        }
        return miss(res.tag);
      },
      async demo() {
        for (let i = 0; i < on.length; i++) {
          sel = i;
          on[i] = g.cards[i].stat;
          draw();
          kit.floatText(cards[i].x + 326, cards[i].y + 30, api.t(on[i] ? L("varies", "varía") : L("one answer", "una respuesta")), on[i] ? "#a4dfb0" : "#ffb36b", 16);
          api.sfx.tick(i * 2);
          await kit.wait(520);
        }
        await launch();
      },
      explain: () =>
        L(
          `A statistical question expects variability. The ${g.k} questions you sent bring back many different answers to study.`,
          `Una pregunta estadística espera variabilidad. Las ${g.k} preguntas que enviaste traen muchas respuestas distintas para estudiar.`,
        ),
    };
  }

  /* ── histogram: the station display (2-2) ──────────────────────────────── */
  function histogram(scene, api) {
    const { kit, rng } = api;
    const g = M.genHistogram(rng, api.tier);
    const bars = new Array(g.nb).fill(0);
    let sel = 0;
    let marks = new Array(g.nb).fill(false);
    const who = api.t(g.ctx.who);
    api.setBrief(
      L(
        `The tag log has ${g.n} measurements. Build the station's histogram: set each bar to the number of tags in its interval.`,
        `El registro tiene ${g.n} medidas. Construye el histograma de la estación: cada barra muestra cuántas etiquetas hay en su intervalo.`,
      ),
    );
    kit.panel(24, 138, 274, 336, { fill: PANEL, alpha: 0.9 });
    kit.text(161, 156, api.t(L("TAG LOG", "REGISTRO")), 14, "#ffd76a", { weight: "800", depth: 22 });
    kit.text(161, 180, api.t(g.ctx.name), 13, "#cfe3ee", { depth: 22, wrap: 250 });
    const chips = g.data.map((v, i) => chip(scene, kit, 60 + (i % 4) * 64, 218 + Math.floor(i / 4) * 40, 56, String(v)));
    kit.text(161, 452, api.t(L(`${g.n} tags · 1 tag = 1 animal`, `${g.n} etiquetas · 1 etiqueta = 1 animal`)), 13, "#9fb7c4", { depth: 22 });
    kit.panel(310, 138, 486, 336, { fill: PANEL, alpha: 0.9 });
    const X0 = 372;
    const X1 = 780;
    const BASE = 410;
    const UNIT = 22;
    const bw = (X1 - X0) / g.nb;
    const grid = scene.add.graphics().setDepth(21);
    for (let v = 0; v <= 10; v += 2) {
      grid.lineStyle(1, 0xffffff, v ? 0.08 : 0.5).lineBetween(X0, BASE - v * UNIT, X1, BASE - v * UNIT);
      kit.text(X0 - 10, BASE - v * UNIT, String(v), 12, "#9fb7c4", { ox: 1, depth: 22 });
    }
    kit.text(X0, 156, api.t(L(`Number of ${who}`, `Número de ${who}`)), 13, "#cfe3ee", { ox: 0, depth: 22, weight: "800" });
    for (let i = 0; i < g.nb; i++)
      kit.text(X0 + (i + 0.5) * bw, BASE + 16, M.binLabel(g, i), 12, "#eaf6ff", { depth: 22, weight: "800" });
    kit.text((X0 + X1) / 2, BASE + 40, api.t(g.ctx.name), 13, "#cfe3ee", { depth: 22 });
    const barG = scene.add.graphics().setDepth(22);
    const counts = Array.from({ length: g.nb }, (_, i) => kit.text(X0 + (i + 0.5) * bw, BASE - 12, "", 15, "#ffffff", { depth: 23, weight: "900" }));
    for (let i = 0; i < g.nb; i++) {
      const z = scene.add.zone(X0 + (i + 0.5) * bw, BASE - 5 * UNIT, bw, 10 * UNIT + 24).setInteractive({ useHandCursor: true }).setDepth(24);
      const set = (p) => {
        sel = i;
        setBar(i, Phaser.Math.Clamp(Math.round((BASE - p.y) / UNIT), 0, 10));
      };
      z.on("pointerdown", set);
      z.on("pointermove", (p) => p.isDown && set(p));
    }
    function draw() {
      barG.clear();
      for (let i = 0; i < g.nb; i++) {
        const x = X0 + i * bw + 5;
        const h = bars[i] * UNIT;
        const active = i === sel;
        barG.fillStyle(active ? 0x24485c : 0x15303f, 0.6).fillRect(x, BASE - 10 * UNIT, bw - 10, 10 * UNIT);
        if (h) barG.fillStyle(marks[i] ? WARN : kit.accent, 0.95).fillRect(x, BASE - h, bw - 10, h);
        barG.lineStyle(active ? 3 : 1, active ? GOLD : 0xffffff, active ? 1 : 0.2).strokeRect(x, BASE - 10 * UNIT, bw - 10, 10 * UNIT);
        counts[i].setText(bars[i] ? String(bars[i]) : "").setY(BASE - h - 12);
      }
    }
    function setBar(i, v) {
      bars[i] = v;
      marks = new Array(g.nb).fill(false);
      api.sfx.tick(Math.min(12, v));
      draw();
      api.refresh();
    }
    const pick = (d) => {
      sel = (sel + d + g.nb) % g.nb;
      draw();
      api.refresh();
    };
    draw();
    const tallest = () => g.counts.indexOf(Math.max(...g.counts));
    return {
      checkLabel: L("Send to the display", "Enviar a la pantalla"),
      get actions() {
        return [
          { key: "ArrowUp", label: L("Bar +1", "Barra +1"), run: () => setBar(sel, Math.min(10, bars[sel] + 1)) },
          { key: "ArrowDown", label: L("Bar −1", "Barra −1"), run: () => setBar(sel, Math.max(0, bars[sel] - 1)) },
          { key: "ArrowRight", label: L("Next interval →", "Intervalo siguiente →"), run: () => pick(1) },
          { key: "ArrowLeft", label: L("← Previous interval", "← Intervalo anterior"), run: () => pick(-1) },
        ];
      },
      status: () =>
        L(
          `Interval ${M.binLabel(g, sel)}: bar ${bars[sel]}. Bars total ${M.total(bars)} of ${g.n} tags.`,
          `Intervalo ${M.binLabel(g, sel)}: barra ${bars[sel]}. Total de barras ${M.total(bars)} de ${g.n} etiquetas.`,
        ),
      hints: [
        L(
          `Count the tags inside each interval. A tag on an edge, like ${g.edgeValue}, goes in the interval that STARTS at ${g.edgeValue}.`,
          `Cuenta las etiquetas dentro de cada intervalo. Una etiqueta en un borde, como ${g.edgeValue}, va en el intervalo que EMPIEZA en ${g.edgeValue}.`,
        ),
        L(
          `Start with ${M.binLabel(g, 0)}: count the tags from ${g.lo} to ${g.lo + g.w - 1}. Set that bar, then move to the next interval. The bars must add up to ${g.n}.`,
          `Empieza con ${M.binLabel(g, 0)}: cuenta las etiquetas de ${g.lo} a ${g.lo + g.w - 1}. Ajusta esa barra y pasa al siguiente intervalo. Las barras deben sumar ${g.n}.`,
        ),
      ],
      async check() {
        const res = M.judgeHistogram(g, bars);
        if (res.incomplete)
          return {
            ok: false,
            incomplete: true,
            feedback: L("Raise the bars first: count the tags in each interval.", "Primero sube las barras: cuenta las etiquetas de cada intervalo."),
          };
        api.sfx.whoosh();
        await kit.wait(300);
        if (res.ok) {
          const t = tallest();
          kit.burst(X0 + (t + 0.5) * bw, BASE - bars[t] * UNIT, kit.accent, 26);
          kit.floatText(X0 + (t + 0.5) * bw, BASE - bars[t] * UNIT - 30, api.t(L("Rangers go here", "Los guardabosques van aquí")), "#a4dfb0", 16);
          return { ok: true };
        }
        marks = res.wrong.slice();
        draw();
        return miss(res.tag, { got: res.got, n: g.n, who, edge: g.edgeValue });
      },
      async demo() {
        bars.fill(0);
        marks = new Array(g.nb).fill(false);
        draw();
        for (let i = 0; i < g.data.length; i++) {
          const b = Math.floor((g.data[i] - g.lo) / g.w);
          sel = b;
          bars[b]++;
          chips[i].paint(0x1f5a3c, GOOD);
          draw();
          api.sfx.tick(b * 2);
          await kit.wait(200);
        }
      },
      explain: () =>
        L(
          `Each bar counts the tags in one interval. The tallest bar, ${M.binLabel(g, tallest())}, shows where most ${who} are, so the rangers go there.`,
          `Cada barra cuenta las etiquetas de un intervalo. La barra más alta, ${M.binLabel(g, tallest())}, muestra dónde están la mayoría de los ${who}; allí van los guardabosques.`,
        ),
    };
  }

  /* ── balance: the mean as the balance point of the migration beam (2-8) ── */
  function balance(scene, api) {
    const { kit, rng } = api;
    const g = M.genBalance(rng, api.tier);
    const xOf = scaleX(g.axis.lo, g.axis.hi, 100, 720);
    let f = g.axis.lo;
    let moved = false;
    api.setBrief(
      L(
        `${api.t(g.ctx.name)}: the tags sit on the beam. Slide the support to the MEAN, where the beam balances. Then release it.`,
        `${api.t(g.ctx.name)}: las etiquetas están en la viga. Mueve el soporte a la MEDIA, donde la viga se equilibra. Luego suéltala.`,
      ),
    );
    const chips = g.data.map((v, i) => chip(scene, kit, 410 + (i - (g.n - 1) / 2) * 62, 160, 54, String(v)));
    kit.panel(24, 188, 772, 286, { fill: PANEL, alpha: 0.88 });
    const BEAM_Y = 360;
    const beam = scene.add.container(xOf(f), BEAM_Y).setDepth(22);
    const beamG = scene.add.graphics();
    beam.add(beamG);
    const tickLabels = [];
    for (let v = g.axis.lo; v <= g.axis.hi; v++) {
      const t = scene.add
        .text(0, 22, String(v), { fontFamily: kit.FONT, fontSize: "13px", fontStyle: "700", color: "#cfe3ee" })
        .setOrigin(0.5);
      t.v = v;
      tickLabels.push(t);
      beam.add(t);
    }
    const stack = {};
    const dots = g.data.map((v) => {
      stack[v] = (stack[v] || 0) + 1;
      const d = scene.add.image(0, -14 - (stack[v] - 1) * 22, "ewl-dot").setDisplaySize(20, 20).setTint(kit.accent);
      d.v = v;
      beam.add(d);
      return d;
    });
    const support = scene.add.graphics().setDepth(21);
    const pins = scene.add.graphics().setDepth(23);
    const readout = kit.text(410, 452, "", 17, "#ffffff", { depth: 23, weight: "800" });
    const ground = scene.add.graphics().setDepth(20);
    ground.fillStyle(0x0d2230, 0.9).fillRoundedRect(60, 418, 700, 14, 6);
    function layout() {
      const fx = xOf(f);
      beam.x = fx;
      beam.rotation = 0;
      beamG.clear();
      beamG.fillStyle(0x6b4a2a, 1).fillRoundedRect(xOf(g.axis.lo) - fx - 14, -5, xOf(g.axis.hi) - xOf(g.axis.lo) + 28, 10, 4);
      for (let v = g.axis.lo; v <= g.axis.hi; v++) beamG.fillStyle(0xeaf6ff, 0.7).fillRect(xOf(v) - fx - 1, 5, 2, 7);
      tickLabels.forEach((t) => t.setX(xOf(t.v) - fx));
      dots.forEach((d) => d.setX(xOf(d.v) - fx));
      support.clear();
      support.fillStyle(moved ? GOLD : 0x8a9aa6, 1).fillTriangle(fx, BEAM_Y + 6, fx - 22, 418, fx + 22, 418);
      pins.clear();
      pins.fillStyle(0x8a9aa6, 1);
      [xOf(g.axis.lo) - 6, xOf(g.axis.hi) + 6].forEach((px) => pins.fillRect(px - 4, BEAM_Y + 6, 8, 412 - BEAM_Y));
      readout.setText(
        moved
          ? api.t(L(`Support at ${fmt(f)}`, `Soporte en ${fmt(f)}`))
          : api.t(L("Slide the support (← →)", "Mueve el soporte (← →)")),
      );
    }
    function setF(v) {
      const nv = Phaser.Math.Clamp(Math.round(v * 2) / 2, g.axis.lo, g.axis.hi);
      if (nv === f && moved) return;
      f = nv;
      moved = true;
      api.sfx.tick(Math.round(f) % 12);
      layout();
      api.refresh();
    }
    const zone = scene.add.zone(410, 380, 680, 120).setInteractive({ useHandCursor: true }).setDepth(24);
    const fromPointer = (p) => setF(g.axis.lo + ((p.x - xOf(g.axis.lo)) / (xOf(g.axis.hi) - xOf(g.axis.lo))) * (g.axis.hi - g.axis.lo));
    zone.on("pointerdown", fromPointer);
    zone.on("pointermove", (p) => p.isDown && fromPointer(p));
    layout();
    /** Release the pins: the beam tips by the net pull of the tags around the support. */
    async function release() {
      pins.clear();
      const t = M.torque(g, f);
      const angle = Phaser.Math.Clamp(t * 0.012, -0.22, 0.22);
      api.sfx.hum();
      kit.tween({ targets: beam, rotation: angle, duration: 700, ease: "Back.easeOut" });
      await kit.wait(760);
      if (kit.reduced()) beam.rotation = angle;
      return t;
    }
    const s = M.total(g.data);
    return {
      checkLabel: L("Release the beam", "Soltar la viga"),
      get actions() {
        return [
          { key: "ArrowRight", label: L("Support right +½", "Soporte a la derecha +½"), run: () => setF(f + 0.5) },
          { key: "ArrowLeft", label: L("Support left −½", "Soporte a la izquierda −½"), run: () => setF(f - 0.5) },
          { key: "ArrowUp", label: L("Support right +1", "Soporte a la derecha +1"), run: () => setF(f + 1) },
          { key: "ArrowDown", label: L("Support left −1", "Soporte a la izquierda −1"), run: () => setF(f - 1) },
        ];
      },
      status: () => (moved ? L(`Support at ${fmt(f)}`, `Soporte en ${fmt(f)}`) : L("Support not placed yet", "Soporte sin colocar")),
      hints: [
        L(
          "The mean is the balance point. Add all the tags, then divide the total by the number of tags.",
          "La media es el punto de equilibrio. Suma todas las etiquetas y luego divide el total entre el número de etiquetas.",
        ),
        L(
          `Start adding: ${g.data[0]} + ${g.data[1]} = ${g.data[0] + g.data[1]}. Keep going to the last tag, then divide by ${g.n}.`,
          `Empieza a sumar: ${g.data[0]} + ${g.data[1]} = ${g.data[0] + g.data[1]}. Sigue hasta la última etiqueta y luego divide entre ${g.n}.`,
        ),
      ],
      async check() {
        const res = M.judgeBalance(g, f, moved);
        if (res.incomplete)
          return {
            ok: false,
            incomplete: true,
            feedback: L("Slide the support along the beam first.", "Primero mueve el soporte a lo largo de la viga."),
          };
        const t = await release();
        if (res.ok) {
          kit.burst(xOf(f), BEAM_Y - 30, kit.accent, 24);
          kit.floatText(xOf(f), BEAM_Y - 70, api.t(L("Balanced!", "¡Equilibrada!")), "#a4dfb0", 20);
          return { ok: true };
        }
        const side = t > 0 ? L("right", "derecha") : L("left", "izquierda");
        return miss(res.tag, { side: api.t(side) });
      },
      async demo() {
        let run = 0;
        for (let i = 0; i < g.n; i++) {
          run += g.data[i];
          chips[i].paint(0x1f5a3c, GOOD);
          kit.floatText(chips[i].x, 196, i ? `+${g.data[i]} = ${run}` : String(run), "#ffd76a", 16);
          api.sfx.tick(i * 2);
          await kit.wait(380);
        }
        kit.floatText(410, 230, `${s} ÷ ${g.n} = ${fmt(g.mean)}`, "#ffd76a", 24);
        await kit.wait(700);
        const from = f;
        const steps = 8;
        for (let k = 1; k <= steps; k++) {
          f = from + ((g.mean - from) * k) / steps;
          moved = true;
          layout();
          await kit.wait(60);
        }
        f = g.mean;
        layout();
        await release();
      },
      explain: () =>
        L(
          `Mean = sum ÷ count = ${s} ÷ ${g.n} = ${fmt(g.mean)}. At the mean the distances on each side cancel, so the beam balances.`,
          `Media = suma ÷ cantidad = ${s} ÷ ${g.n} = ${fmt(g.mean)}. En la media las distancias de cada lado se cancelan y la viga se equilibra.`,
        ),
    };
  }

  window.DD_MISSIONS = Object.assign(window.DD_MISSIONS, {
    MSG,
    miss,
    chip,
    scaleX,
    PANEL,
    GOLD,
    WARN,
    GOOD,
    survey,
    histogram,
    balance,
  });
})();
