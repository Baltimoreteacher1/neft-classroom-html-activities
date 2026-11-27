// Plain-words copy for document fitting: the goals a teacher can choose, what a fit changed, and why a request
// could not be met. Every string is { en, es }. Spanish is real but has not had a native-speaker review.

const N = (en, es) => ({ en, es });
const inch = (n) => `${Number(n.toFixed(2))} in`;
const pct = (n) => `${Math.round(n * 100)}%`;
const plural = (n, one, many) => (n === 1 ? one : many);

/** The goals, in the order the Fit panel lists them. */
export const GOAL_COPY = Object.freeze([
  { id: "one-page", label: N("Fit it on one page", "Que quepa en una página"), help: N("Tightens spacing and work space, never the reading size.", "Ajusta los espacios sin reducir el tamaño de lectura.") },
  { id: "two-pages", label: N("Fit it on two pages", "Que quepa en dos páginas"), help: N("The roomiest layout that still ends on page two.", "El diseño más amplio que aún termina en la página dos.") },
  { id: "more-workspace", label: N("Give students more room to work", "Dar más espacio para trabajar"), help: N("Bigger work boxes and writing lines at the normal text size.", "Cajas y líneas más grandes con el tamaño de texto normal.") },
  { id: "half-page", label: N("Make a half-page handout", "Hacer una hoja de media página"), help: N("One copy on the top half, with a cut line.", "Una copia en la mitad superior, con línea de corte.") },
  { id: "two-per-page", label: N("Print two copies on each page", "Imprimir dos copias por página"), help: N("Two identical halves with a cut line between them.", "Dos mitades iguales con una línea de corte entre ellas.") },
  { id: "compact-review", label: N("Make a compact review sheet", "Hacer una hoja de repaso compacta"), help: N("Dense but readable: small work boxes, choices side by side.", "Compacta pero legible: cajas pequeñas, opciones lado a lado.") },
  { id: "large-print", label: N("Large print", "Letra grande"), help: N("Bigger text and bigger answer spaces for easier reading.", "Texto y espacios de respuesta más grandes para leer mejor.") },
]);

export const goalCopy = (id) => GOAL_COPY.find((g) => g.id === id);

const pageWord = (n) => N(`${n} ${plural(n, "page", "pages")}`, `${n} ${plural(n, "página", "páginas")}`);

/** What a fit changed, compared with printing the sheet as it is. `info` = { pages, measured, standardPages }. */
export function describeFit(o, info) {
  const out = [];
  if (info.pages != null)
    out.push(
      N(
        `It prints on ${pageWord(info.pages).en}${info.measured ? "" : " (an estimate; the print preview has the final count)"}.`,
        `Se imprime en ${pageWord(info.pages).es}${info.measured ? "" : " (una estimación; la vista de impresión da el número final)"}.`,
      ),
    );
  if (o.large)
    out.push(
      N(`Text is ${o.bodyPt}pt and labels are 14pt, larger than the usual 13pt and 11pt.`, `El texto es de ${o.bodyPt} pt y las etiquetas de 14 pt, más grandes que los 13 pt y 11 pt habituales.`),
    );
  else if (o.bodyPt < 13)
    out.push(
      N(`Text is ${o.bodyPt}pt instead of 13pt. It never goes below 11pt.`, `El texto es de ${o.bodyPt} pt en lugar de 13 pt. Nunca baja de 11 pt.`),
    );
  else out.push(N("Text stays at the normal 13pt.", "El texto se mantiene en los 13 pt normales."));
  if (o.k < 1) out.push(N(`Space between questions is ${pct(o.k)} of normal.`, `El espacio entre preguntas es el ${pct(o.k)} del normal.`));
  if (o.k > 1.05) out.push(N(`Space between questions is ${pct(o.k)} of normal.`, `El espacio entre preguntas es el ${pct(o.k)} del normal.`));
  if (o.wsScale !== 1) {
    const box = 1.05 * o.wsScale * (o.workspace === "roomy" ? 1.81 : 1);
    out.push(
      o.wsScale > 1
        ? N(`Work boxes are taller (a number problem gets ${inch(box)}) and writing lines are ${inch(o.ruleIn)} apart.`, `Las cajas de trabajo son más altas (un problema numérico tiene ${inch(box)}) y las líneas de escritura están a ${inch(o.ruleIn)}.`)
        : N(`Work boxes are smaller (a number problem gets ${inch(box)}), still room for a few lines of work.`, `Las cajas de trabajo son más pequeñas (un problema numérico tiene ${inch(box)}), con espacio para unas líneas de trabajo.`),
    );
  }
  if (o.marginIn !== 0.75) out.push(N(`Page margins are ${inch(o.marginIn)}.`, `Los márgenes de página son de ${inch(o.marginIn)}.`));
  if (o.grid) out.push(N("Short answer choices sit side by side in two columns.", "Las opciones cortas van lado a lado en dos columnas."));
  if (o.columns === 2) out.push(N("Questions flow in two columns under the title.", "Las preguntas fluyen en dos columnas bajo el título."));
  if (o.copies === 2) out.push(N("Two identical copies per page, with a cut line between them.", "Dos copias idénticas por página, con una línea de corte entre ellas."));
  if (o.copies === 1) out.push(N("One copy on the top half of the page, with a cut line under it.", "Una copia en la mitad superior de la página, con una línea de corte debajo."));
  out.push(
    N(
      "Nothing was removed or reordered, and the answer key stays on the teacher copy only.",
      "No se quitó ni se reordenó nada, y la clave de respuestas queda solo en la copia del maestro.",
    ),
  );
  return out;
}

const list = (nums) => nums.join(", ");
const joinOr = (a, w) => (a.length < 2 ? a[0] : `${a.slice(0, -1).join(", ")} ${w} ${a.at(-1)}`);

/** The sentence that goes with "or remove question N yourself". */
export const removeHint = (nums, target) =>
  N(
    `remove ${plural(nums.length, "question", "questions")} ${list(nums)} yourself to fit ${target.en}`,
    `quite ${plural(nums.length, "la pregunta", "las preguntas")} ${list(nums)} usted mismo para que quepa en ${target.es}`,
  );

export const pagesTarget = (n) => N(n === 1 ? "one page" : `${pageWord(n).en}`, n === 1 ? "una página" : `${pageWord(n).es}`);

/** Why a goal could not be met, and what to do instead. `nums` = questions to remove (or null), `alt` = fallback pages. */
export function failureCopy(goal, { pages, target, needIn, halfIn, nums, altPages, altGoal }) {
  const parts = [];
  const tgt = pagesTarget(target ?? 1);
  if (goal === "half-page" || goal === "two-per-page") {
    parts.push(
      N(
        `At a readable size this sheet is about ${inch(needIn)} tall, and half a page has ${inch(halfIn)}.`,
        `Con un tamaño legible esta hoja mide unas ${inch(needIn)} de alto, y media página tiene ${inch(halfIn)}.`,
      ),
    );
  } else if (goal === "large-print") {
    parts.push(
      N(`In large print this sheet would take ${pageWord(pages).en}, which is too many to hand out comfortably.`, `En letra grande esta hoja ocuparía ${pageWord(pages).es}, demasiadas para repartir con comodidad.`),
    );
  } else {
    parts.push(
      N(
        `This sheet needs ${pageWord(pages).en} at a readable size. Fitting it on ${tgt.en} would mean text under 11pt or work boxes too small to use.`,
        `Esta hoja necesita ${pageWord(pages).es} con un tamaño legible. Para que quepa en ${tgt.es} habría que usar texto menor de 11 pt o cajas de trabajo demasiado pequeñas.`,
      ),
    );
  }
  const nextBits = [];
  if (altPages != null)
    nextBits.push(
      N(
        altGoal === "one-page" ? "it fits on one page" : `it fits on ${pageWord(altPages).en}`,
        altGoal === "one-page" ? "cabe en una página" : `cabe en ${pageWord(altPages).es}`,
      ),
    );
  if (nums?.length) nextBits.push(removeHint(nums, tgt));
  if (!nums?.length && pages > (target ?? 1) + 1 && goal !== "large-print")
    nextBits.push(N("split it into two worksheets", "dividirla en dos hojas"));
  if (nextBits.length) {
    const en = joinOr(nextBits.map((b) => b.en), "or");
    const es = joinOr(nextBits.map((b) => b.es), "o");
    parts.push(N(`Better: ${en}.`, `Mejor: ${es}.`));
  } else if (goal !== "large-print") {
    parts.push(N("Better: split it into two worksheets.", "Mejor: dividirla en dos hojas."));
  } else parts.push(N("Better: split it into two worksheets and print each in large print.", "Mejor: dividirla en dos hojas e imprimir cada una en letra grande."));
  return parts;
}
