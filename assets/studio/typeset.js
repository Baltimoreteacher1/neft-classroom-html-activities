/**
 * Practice Studio typesetting (window.StudioType) — shared by the generated studios and the Unit 4 lab bench.
 *
 *   frac(html, lang)   typesets clean digit/digit fractions ("3/4") and mixed numbers ("2 1/3") in ALREADY-ESCAPED text as
 *                      stacked fractions. Each one carries screen-reader words ("three fourths", "dos tercios") and hides the
 *                      stacked glyphs from assistive technology, so a screen reader and Read aloud say the number, not
 *                      "3 slash 4". Dates (10/21/2026), decimals over digits (2.5/3) and anything that is not digit/digit
 *                      (km/h, $/lb) are left as they are.
 *   stem(en, es, esc)  splits an item's question into its setup and its ask (the last sentence) when that is unambiguous,
 *                      so the setup reads muted and the ask stands out. Anything unclear stays exactly as written.
 *
 * Pure text in, markup out; nothing here knows the answer to anything.
 */
(() => {
  const W = /** @type {any} */ (window);
  if (W.StudioType) return;

  /* ---- fractions --------------------------------------------------------------------------------------------- */
  const EN_N =
    "zero one two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen sixteen seventeen eighteen nineteen twenty".split(
      " ",
    );
  const ES_N =
    "cero un dos tres cuatro cinco seis siete ocho nueve diez once doce trece catorce quince dieciséis diecisiete dieciocho diecinueve veinte".split(
      " ",
    );
  /** @type {Record<number, [string, string]>} */
  const EN_D = {
    2: ["half", "halves"],
    3: ["third", "thirds"],
    4: ["fourth", "fourths"],
    5: ["fifth", "fifths"],
    6: ["sixth", "sixths"],
    7: ["seventh", "sevenths"],
    8: ["eighth", "eighths"],
    9: ["ninth", "ninths"],
    10: ["tenth", "tenths"],
    11: ["eleventh", "elevenths"],
    12: ["twelfth", "twelfths"],
    16: ["sixteenth", "sixteenths"],
    20: ["twentieth", "twentieths"],
    25: ["twenty-fifth", "twenty-fifths"],
    50: ["fiftieth", "fiftieths"],
    100: ["hundredth", "hundredths"],
    1000: ["thousandth", "thousandths"],
  };
  /** @type {Record<number, [string, string]>} */
  const ES_D = {
    2: ["medio", "medios"],
    3: ["tercio", "tercios"],
    4: ["cuarto", "cuartos"],
    5: ["quinto", "quintos"],
    6: ["sexto", "sextos"],
    7: ["séptimo", "séptimos"],
    8: ["octavo", "octavos"],
    9: ["noveno", "novenos"],
    10: ["décimo", "décimos"],
    11: ["onceavo", "onceavos"],
    12: ["doceavo", "doceavos"],
    100: ["centésimo", "centésimos"],
    1000: ["milésimo", "milésimos"],
  };
  const word = (/** @type {number} */ n, /** @type {boolean} */ es) =>
    n <= 20 ? (es ? ES_N : EN_N)[n] : String(n);
  /** "3/4" in words: "three fourths" / "tres cuartos"; an unnamed denominator reads "5 over 17" / "5 sobre 17". */
  function spoken(/** @type {number} */ n, /** @type {number} */ d, /** @type {boolean} */ es) {
    const names = (es ? ES_D : EN_D)[d];
    const solo = (/** @type {number} */ x) => (es && x === 1 ? "uno" : word(x, es));
    if (!names) return `${solo(n)} ${es ? "sobre" : "over"} ${solo(d)}`;
    return `${word(n, es)} ${n === 1 ? names[0] : names[1]}`;
  }
  const box = (/** @type {string} */ n, /** @type {string} */ d) =>
    `<span class="frac-v" aria-hidden="true"><span class="frac-n">${n}</span><span class="frac-d">${d}</span></span>`;

  // a whole number, a space, then digit/digit (mixed number) | digit/digit; never part of a date, a decimal or a longer run
  const FRAC = /(?<![\d./:])(?:(\d{1,4}) )?(\d{1,4})\/(\d{1,4})(?![\d/]|\.\d)/g;

  /** The words for one fraction (optionally with a whole part) in one language. */
  function say(
    /** @type {string} */ w,
    /** @type {number} */ n,
    /** @type {number} */ d,
    /** @type {boolean} */ es,
  ) {
    const whole = w && (es && w === "1" ? "uno" : word(Number(w), es));
    return `${w ? `${whole} ${es ? "y" : "and"} ` : ""}${spoken(n, d, es)}`;
  }

  /**
   * `lang` is the language of the text: "en", "es", or "both" for text with no Spanish twin (a bare number like "1/12"),
   * whose words then follow the page language (.t-en / .t-es).
   */
  function frac(/** @type {string} */ html, lang = "en") {
    return String(html).replace(
      FRAC,
      (
        /** @type {string} */ all,
        /** @type {string} */ w,
        /** @type {string} */ n,
        /** @type {string} */ d,
      ) => {
        const N = Number(n);
        const D = Number(d);
        if (!D) return all;
        const words =
          lang === "both"
            ? `<span class="t-en">${say(w, N, D, false)}</span><span class="t-es" lang="es">${say(w, N, D, true)}</span>`
            : say(w, N, D, lang === "es");
        return `<span class="frac">${w ? `<span class="frac-w" aria-hidden="true">${w}</span>` : ""}${box(n, d)}<span class="sr-only">${words}</span></span>`;
      },
    );
  }

  /* ---- context vs ask ---------------------------------------------------------------------------------------- */
  // A sentence ends at . ! ? (optionally inside a closing quote) followed by a space and a capital, ¿, ¡, a digit or a quote.
  const END = /([.!?]["'”’)]?)\s+(?=[A-ZÁÉÍÓÚÑ¿¡"“0-9(])/g;
  // never a sentence end: titles and Latin abbreviations written with a period (a unit such as "ft." that closes a
  // sentence is still an end)
  const ABBR =
    /(?:\b(?:Mr|Mrs|Ms|Dr|St|Sr|Sra|Srta|Jr|vs|etc|e\.g|i\.e|approx|aprox|a\.m|p\.m)\.)$/i;

  // The setup must be setup: a sentence in it that opens with an instruction ("Predict…", "Order them first.") is part of
  // the task, and muting it would hide a step. English and Spanish imperatives as they open sentences in the studios.
  const ORDERS =
    /^(?:Predict|Order|Estimate|Use|Find|Write|Choose|Explain|Test|Change|Set|Move|Round|Show|Draw|Plot|Compare|Check|Look|Tell|Describe|Decide|Make|Build|Put|Place|Read|Count|Add|Subtract|Multiply|Divide|Solve|Simplify|Convert|Graph|Label|Mark|Record|Shade|Give|List|Name|Fill|Complete|Think|Remember|Start|Try|Sort|Match|Type|Enter|Rewrite|Evaluate|Compute|Calculate|Determine|Identify|Classify|Split|Then|Predice|Ordena|Estima|Usa|Halla|Encuentra|Escribe|Elige|Explica|Prueba|Cambia|Mueve|Redondea|Muestra|Dibuja|Ubica|Compara|Comprueba|Revisa|Mira|Di|Describe|Decide|Haz|Construye|Pon|Coloca|Lee|Cuenta|Suma|Resta|Multiplica|Divide|Resuelve|Simplifica|Convierte|Grafica|Rotula|Marca|Anota|Sombrea|Da|Nombra|Completa|Piensa|Recuerda|Empieza|Intenta|Clasifica|Calcula|Determina|Identifica|Evalúa|Luego|Después)\b/;

  /** Sentence starts in a text (index 0 and every clean sentence end), skipping titles and abbreviations. */
  function starts(/** @type {string} */ t) {
    const at = [0];
    for (const m of t.matchAll(END)) {
      if (ABBR.test(t.slice(0, (m.index || 0) + m[1].length))) continue;
      at.push((m.index || 0) + m[0].length);
    }
    return at;
  }

  /** Where the last sentence (the ask) starts, or -1 when the text is one sentence or the split is not clean. */
  function lastSentence(/** @type {string} */ text) {
    const t = String(text || "");
    if (t.length < 40 || /\n/.test(t)) return -1;
    const at = starts(t);
    const cut = at[at.length - 1];
    if (cut < 20 || t.length - cut < 8) return -1;
    // an earlier question means the last sentence is not the only ask ("…in? Explain how you know."): leave it whole
    if (/\?/.test(t.slice(0, cut))) return -1;
    // a setup sentence that gives an instruction, or an ask that only continues one ("Then…", "(Hint…"), stays whole
    if (at.slice(0, -1).some((i) => ORDERS.test(t.slice(i).replace(/^[¿¡"“(]+/, "")))) return -1;
    if (/^(?:Then|Luego|Después|And|Y|\()/.test(t.slice(cut))) return -1;
    return cut;
  }

  /**
   * Item stem markup: setup muted, ask emphasised (EN and, stacked, ES). The Spanish line splits only when the English one
   * does, so the two never disagree about what the question is. A text that does not split cleanly is printed unchanged.
   * `esc` is the caller's HTML escaper; fractions are typeset after escaping.
   */
  function stem(
    /** @type {string} */ en,
    /** @type {string} */ es,
    /** @type {(s: any) => string} */ esc,
  ) {
    const enAt = lastSentence(en);
    const part = (/** @type {string} */ t, /** @type {string} */ lang, /** @type {number} */ at) =>
      at < 0
        ? frac(esc(t), lang)
        : `<span class="q-context">${frac(esc(t.slice(0, at).trimEnd()), lang)}</span> <span class="q-ask">${frac(esc(t.slice(at)), lang)}</span>`;
    return `${part(en, "en", enAt)}${es ? `<span class="es-text" lang="es">${part(es, "es", enAt < 0 ? -1 : lastSentence(es))}</span>` : ""}`;
  }

  W.StudioType = { frac, spoken, stem, lastSentence };
})();
