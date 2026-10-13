/* Math Workbench — "What does this show?" for every manipulative, plus
 * challenge cards. Plain-language wording that matches the Formula & Reference
 * Bank vocabulary. Challenge cards are questions to think about; nothing here
 * states an answer. */
(function (root) {
  "use strict";
  const MWB = root.MWB;
  if (!MWB) return;
  const { h } = MWB;
  const t = MWB.t;

  /** Explanations for tools that were built before the registry existed. */
  const LEGACY = {
    numline: {
      title: "Number line",
      shows: "Numbers in order on a line. Numbers to the right are greater. The distance from 0 is the absolute value.",
      shows_es: "Números en orden en una recta. Los números de la derecha son mayores. La distancia desde 0 es el valor absoluto.",
      words: ["integer", "absolute value", "opposite", "greater than", "less than"],
      tryThis: ["Mark two numbers. Which is greater? How can you tell from the line?", "Mark a number and its opposite. What do you notice about the distances from 0?"],
    },
    coordgrid: {
      title: "Coordinate plane",
      shows: "A flat grid with two number lines that cross at the origin. Every point is an ordered pair (x, y): go across for x, then up or down for y.",
      shows_es: "Una cuadrícula con dos rectas numéricas que se cruzan en el origen. Cada punto es un par ordenado (x, y): avanza para x, luego sube o baja para y.",
      words: ["ordered pair", "x-axis", "y-axis", "origin", "quadrant"],
      tryThis: ["Describe how to get from the origin to a point, in words.", "What happens to a point if you change the sign of x? Of y?"],
    },
    angle: {
      title: "Measurable angle",
      shows: "Two rays that meet at a point called the vertex. The opening between them is the angle, measured in degrees.",
      shows_es: "Dos semirrectas que se unen en un punto llamado vértice. La abertura entre ellas es el ángulo, medido en grados.",
      words: ["angle", "degree", "vertex", "ray"],
      tryThis: ["Make an angle that is smaller than 90 degrees. Then one that is greater. What do we call each?"],
    },
    placevalue: {
      title: "Place-value chart",
      shows: "Columns that show what each digit is worth. Each place is ten times the place to its right.",
      shows_es: "Columnas que muestran cuánto vale cada dígito. Cada lugar vale diez veces el lugar de su derecha.",
      words: ["place value", "digit", "tenths", "hundredths", "decimal point"],
      tryThis: ["Build a number. Read it aloud using place value.", "What happens to each digit when you multiply by 10?"],
    },
    arraymodel: {
      title: "Array / area model",
      shows: "Rows and columns of equal squares. The number of squares is the product of the rows and the columns.",
      shows_es: "Filas y columnas de cuadrados iguales. El número de cuadrados es el producto de filas por columnas.",
      words: ["array", "factor", "product", "area", "square units"],
      tryThis: ["Write a multiplication sentence for your array.", "Split the array into two smaller arrays. How does that match the distributive property?"],
    },
    fracbar: {
      title: "Fraction bar",
      shows: "A bar cut into equal parts. The shaded parts over the total number of parts make a fraction.",
      shows_es: "Una barra cortada en partes iguales. Las partes sombreadas sobre el total de partes forman una fracción.",
      words: ["fraction", "numerator", "denominator", "equal parts"],
      tryThis: ["Shade a fraction. Say what the numerator and denominator mean here.", "Change the number of parts. How can you show an equivalent fraction?"],
    },
    dblnumline: {
      title: "Double number line",
      shows: "Two number lines side by side. Matching marks show amounts that go together in the same ratio.",
      shows_es: "Dos rectas numéricas juntas. Las marcas que coinciden muestran cantidades que van juntas en la misma razón.",
      words: ["ratio", "rate", "unit rate", "equivalent ratios"],
      tryThis: ["Label both lines. What does each mark mean?", "How do you find the value for 1 on the top line?"],
    },
    chips: {
      title: "Integer chips",
      shows: "Yellow chips are positive and red chips are negative. A positive chip and a negative chip together make zero.",
      shows_es: "Las fichas amarillas son positivas y las rojas negativas. Una ficha positiva y una negativa juntas hacen cero.",
      words: ["positive", "negative", "zero pair", "integer", "sum"],
      tryThis: ["Show an addition problem with chips. How do zero pairs help?", "Can you show the same number with more chips? Explain."],
    },
    algebra: {
      title: "Algebra tiles",
      shows: "Tiles for expressions. A square stands for 1, a bar stands for x. You can group like tiles.",
      shows_es: "Fichas para expresiones. Un cuadrado vale 1 y una barra vale x. Puedes agrupar fichas iguales.",
      words: ["variable", "coefficient", "term", "like terms", "expression"],
      tryThis: ["Build an expression. Write it in symbols.", "Group the like tiles. How does that simplify the expression?"],
    },
    baseten: {
      title: "Base-ten blocks",
      shows: "Blocks for place value: a unit, a rod of 10, a flat of 100 and a cube of 1000.",
      shows_es: "Bloques de valor posicional: una unidad, una barra de 10, una placa de 100 y un cubo de 1000.",
      words: ["place value", "ones", "tens", "hundreds", "regroup"],
      tryThis: ["Show a number with blocks. Write it as digits.", "Show the same number a different way by regrouping."],
    },
    dotplot: {
      title: "Dot plot",
      shows: "A number line where each dot is one piece of data. Stacks of dots show how often a value happens.",
      shows_es: "Una recta numérica donde cada punto es un dato. Las pilas de puntos muestran con qué frecuencia ocurre un valor.",
      words: ["data", "distribution", "cluster", "gap", "outlier", "mean", "median"],
      tryThis: ["Describe the center and the spread of the data.", "Is there a cluster, a gap or an outlier? What does it tell you?"],
    },
    boxplot: {
      title: "Box plot",
      shows: "A picture of data split into four parts: the minimum, the first quartile, the median, the third quartile and the maximum.",
      shows_es: "Un dibujo de datos en cuatro partes: el mínimo, el primer cuartil, la mediana, el tercer cuartil y el máximo.",
      words: ["median", "quartile", "interquartile range", "minimum", "maximum"],
      tryThis: ["Which part of the data is in the box? What does a long box tell you?"],
    },
    histogram: {
      title: "Histogram",
      shows: "Bars that show how many data values fall in each interval. The bars touch because the intervals are connected.",
      shows_es: "Barras que muestran cuántos datos caen en cada intervalo. Las barras se tocan porque los intervalos son continuos.",
      words: ["interval", "frequency", "distribution", "shape of data"],
      tryThis: ["Which interval has the most data? How can you tell the shape of the data?"],
    },
    ratiotable: {
      title: "Ratio table",
      shows: "Columns of equivalent ratios. When you multiply or divide a whole column by the same number, you get another equivalent ratio.",
      shows_es: "Columnas de razones equivalentes. Si multiplicas o divides una columna por el mismo número, obtienes otra razón equivalente.",
      words: ["ratio", "equivalent ratios", "multiplier", "for every"],
      tryThis: ["What do you multiply by to get from one column to the next?", "Say what the ratio means with the words for every."],
    },
    tape: {
      title: "Tape diagram",
      shows: "A strip split into equal parts. The parts show how amounts compare, or how a total is made.",
      shows_es: "Una tira dividida en partes iguales. Las partes muestran cómo se comparan las cantidades o cómo se forma un total.",
      words: ["part", "whole", "ratio", "percent", "equal parts"],
      tryThis: ["Label what the whole and each part stand for.", "Which part is the unknown? Say how you could find it."],
    },
    ineqline: {
      title: "Inequality number line",
      shows: "A number line that shows all the values that make an inequality true. An open circle leaves the number out; a closed circle includes it.",
      shows_es: "Una recta numérica que muestra todos los valores que hacen verdadera una desigualdad. Un círculo abierto excluye el número; uno cerrado lo incluye.",
      words: ["inequality", "solution", "greater than", "less than", "open circle", "closed circle"],
      tryThis: ["Pick a value on the shaded part. Does it make the inequality true?", "Describe a real situation your inequality could be about."],
    },
  };

  const defFor = (o) => {
    const d = MWB.def(o.type);
    const base = d && d.explain ? d.explain : LEGACY[o.type];
    if (!base) return null;
    const title = base.title || (d && d.label ? d.label(o) : o.type);
    return { ...base, title };
  };

  let card = null;
  let opener = null;
  const closeCard = () => {
    if (!card) return;
    card.remove();
    card = null;
    if (opener && opener.focus) opener.focus();
  };

  function openCard(o, trigger) {
    closeCard();
    const d = defFor(o);
    if (!d) return;
    opener = trigger || document.activeElement;
    let step = 0;
    const tries = d.tryThis || [];
    const shows = t(d.shows, d.shows_es);
    const read = h("p", { class: "wbx-explain-text" }, shows);
    const challenge = h("p", { class: "wbx-explain-challenge" });
    const words = h("div", { class: "wbx-row" });
    for (const w of d.words || []) {
      const chip = MWB.btn(w, t(`Say the word ${w}`, `Decir la palabra ${w}`), () => MWB.ctx.speak(w), "wbx-chip");
      words.appendChild(chip);
    }
    function showChallenge() {
      challenge.textContent = tries.length ? tries[step % tries.length] : "";
    }
    const speakBtn = MWB.btn(t("🔊 Read aloud", "🔊 Leer en voz alta"), t("Read this explanation aloud", "Leer esta explicación en voz alta"), () => MWB.ctx.speak(`${shows} ${challenge.textContent}`));
    const next = MWB.btn(t("Another question", "Otra pregunta"), t("Show another challenge question", "Mostrar otra pregunta de reto"), () => {
      step++;
      showChallenge();
    });
    const stamp = MWB.btn(t("Put it on my board", "Ponerla en mi pizarra"), t("Add this question to the board as a text box", "Añadir esta pregunta a la pizarra como cuadro de texto"), () => {
      if (challenge.textContent) MWB.ctx.makeObject("text", { text: challenge.textContent });
    });
    const close = MWB.btn("✕", t("Close", "Cerrar"), closeCard);
    card = h(
      "section",
      { class: "wbx wbx-explain", role: "dialog", "aria-label": t("What does this show?", "¿Qué muestra esto?"), tabindex: "-1" },
      h("div", { class: "wbx-head" }, h("p", { class: "wbx-title" }, `${t("What does this show?", "¿Qué muestra esto?")} · ${d.title}`), close),
      read,
      h("p", { class: "wbx-title" }, t("Words to use", "Palabras para usar")),
      words,
      h("p", { class: "wbx-title" }, t("Think about it", "Piensa en esto")),
      challenge,
      h("div", { class: "wbx-row" }, speakBtn, next, stamp),
    );
    card.addEventListener("keydown", (e) => {
      e.stopPropagation();
      if (e.key === "Escape") closeCard();
    });
    card.addEventListener("pointerdown", (e) => e.stopPropagation());
    document.body.appendChild(card);
    showChallenge();
    const el = document.querySelector(`#overlay [data-id="${o.id}"]`);
    const r = el ? el.getBoundingClientRect() : null;
    card.style.top = `${Math.max(70, Math.min(window.innerHeight - 330, (r ? r.top : 120) + 8))}px`;
    card.style.left = `${Math.max(12, Math.min(window.innerWidth - 372, (r ? r.right + 12 : 120)))}px`;
    card.focus();
  }

  MWB.on("extendMiniTools", (o, mk) => {
    if (!defFor(o)) return;
    mk("?", t("What does this show?", "¿Qué muestra esto?"), "", () => openCard(o, document.activeElement));
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && card) closeCard();
  });
  MWB.explain = { open: openCard, close: closeCard, has: (o) => !!defFor(o) };
})(window);
