/**
 * Practice Studio language layer, part 1: the pure logic (window.StudioLangCore). No DOM, no storage, no mathematics.
 *
 *   sentences(text)            split a stem or a frame into sentences (titles and abbreviations never end one)
 *   chunk(en, es)              one line per sentence, the question line marked; Spanish pairs line by line when the counts agree
 *   tint(text)                 [{t, n}] segments: n is true for a number or a number with its unit (never an operation word)
 *   splitFrame(fr, frEs)       one part per sentence of a written-task frame, each with the job it does
 *   frameView(parts, level)    what a frame shows at support level 1..6 (see LEVELS)
 *   tilesFor(part, kw, kwEs, stem)   the tap-tap sentence tiles for one frame sentence
 *   findTerms(text, terms)     the math terms a text uses, longest first, no overlaps
 *   moves(text, terms)         which language moves a piece of writing already makes (never a grade)
 *   pickAmber(cog, seen)       the one watch-out to show now
 *   summarize(entries)         the device-local language evidence, or null until MIN_ENTRIES
 *
 * Nothing here ever highlights an operation, marks writing wrong or labels a learner. Contract: docs/audits/studio-v4/brief-x-language.md.
 */
(() => {
  const W = /** @type {any} */ (window);
  if (W.StudioLangCore) return;

  /** A stem over this many words gets the "What is this asking?" view by default. */
  const LONG_STEM = 40;
  /** The evidence card shows no figure until the device holds this many written tasks. */
  const MIN_ENTRIES = 3;

  /* ---- sentences ----------------------------------------------------------------------------------------------- */
  const END = /([.!?]["'”’)]?)\s+(?=[A-ZÁÉÍÓÚÑ¿¡"“0-9(])/g;
  const ABBR =
    /(?:\b(?:Mr|Mrs|Ms|Dr|St|Sr|Sra|Srta|Jr|vs|etc|e\.g|i\.e|approx|aprox|a\.m|p\.m)\.)$/i;
  /** @param {any} text @returns {string[]} */
  function sentences(text) {
    const t = String(text ?? "").trim();
    if (!t) return [];
    const at = [0];
    for (const m of t.matchAll(END)) {
      if (ABBR.test(t.slice(0, (m.index || 0) + m[1].length))) continue;
      at.push((m.index || 0) + m[0].length);
    }
    return at.map((s, i) => t.slice(s, at[i + 1] ?? t.length).trim()).filter(Boolean);
  }
  const wordCount = (/** @type {any} */ t) =>
    String(t ?? "")
      .trim()
      .split(/\s+/)
      .filter(Boolean).length;

  const IMPERATIVE =
    /^[¿¡"“(]*(?:Find|Write|Explain|Estimate|Calculate|Solve|Choose|Complete|Compare|Show|Tell|Order|Predict|Draw|Plot|Use|Decide|Describe|Round|Give|Name|List|Identify|Determine|Halla|Encuentra|Escribe|Explica|Estima|Calcula|Resuelve|Elige|Completa|Compara|Muestra|Di|Ordena|Predice|Dibuja|Ubica|Usa|Decide|Describe|Redondea|Da|Nombra|Enumera|Identifica|Determina)\b/;
  /** The index of the sentence that asks the question, or -1. A "?" wins; else the last sentence that opens with an instruction. */
  function askIndex(/** @type {string[]} */ sents) {
    for (let i = sents.length - 1; i >= 0; i--) if (/\?["'”’)]*$/.test(sents[i])) return i;
    for (let i = sents.length - 1; i >= 0; i--) if (IMPERATIVE.test(sents[i])) return i;
    return -1;
  }

  /**
   * @param {any} en @param {any} es
   * @returns {{lines: {en: string, es: string|null, ask: boolean}[], esAll: string}}
   */
  function chunk(en, es) {
    const a = sentences(en);
    const b = sentences(es);
    const paired = !!b.length && b.length === a.length;
    const ask = askIndex(a);
    return {
      lines: a.map((s, i) => ({ en: s, es: paired ? b[i] : null, ask: i === ask })),
      esAll: b.length && !paired ? String(es) : "",
    };
  }

  /* ---- numbers ------------------------------------------------------------------------------------------------ */
  const UNIT =
    "(?:(?:ft|yd|mi|mm|cm|km|oz|lbs?|kg|mg|mL|gal|qt|pt|mph|cups?|min|hrs?|m|g|L|sq\\.? ?(?:ft|in|cm|m))(?![\\p{L}])|in(?=[²³.,;:?!)]|\\s*$|\\s+(?:long|wide|tall|high|deep|thick|apart|by|each)\\b))";
  const NUM = new RegExp(
    `[−-]?\\$?\\d[\\d,]*(?:\\.\\d+)?(?:\\s\\d+/\\d+|/\\d+)?%?(?:\\s?${UNIT}[²³]?)?`,
    "gu",
  );
  /** Text split into plain and number segments. A number is tinted with its unit; words, signs and operations are never marked. */
  function tint(/** @type {any} */ text) {
    const t = String(text ?? "");
    /** @type {{t: string, n: boolean}[]} */
    const out = [];
    let last = 0;
    for (const m of t.matchAll(NUM)) {
      const at = m.index || 0;
      if (at > last) out.push({ t: t.slice(last, at), n: false });
      out.push({ t: m[0], n: true });
      last = at + m[0].length;
    }
    if (last < t.length) out.push({ t: t.slice(last), n: false });
    return out;
  }

  /* ---- the frame ladder ----------------------------------------------------------------------------------------- */
  /**
   * Support level (1 most .. 6 none), chosen by the student and never tied to a math pathway.
   *   1 tiles   the whole frame, one sentence at a time, with tap-tap tiles and a draw-or-label first step
   *   2 frame   the whole frame, one sentence at a time (1-2 blanks each), with tiles
   *   3 links   only the linking words and the blanks, with tiles
   *   4 starts  the first words of each sentence
   *   5 prompt  one plain prompt per sentence ("Say why.")
   *   6 none    nothing; "Show starters" restores them
   */
  const LEVELS = [
    { id: 1, key: "tiles", en: "Tiles and picture", es: "Fichas y dibujo" },
    { id: 2, key: "frame", en: "Whole frame", es: "Marco completo" },
    { id: 3, key: "links", en: "Linking words", es: "Palabras de enlace" },
    { id: 4, key: "starts", en: "Starters", es: "Comienzos" },
    { id: 5, key: "prompt", en: "Prompts", es: "Indicaciones" },
    { id: 6, key: "none", en: "No frame", es: "Sin marco" },
  ];
  const TILE_MAX_LEVEL = 3;

  /** What each sentence of a frame is for, with the plain prompt shown at level 5. */
  const FUNCTIONS = {
    reason: { en: "Say why.", es: "Di por qué." },
    math: { en: "Write the math.", es: "Escribe la operación." },
    compare: { en: "Compare.", es: "Compara." },
    mean: { en: "Say what it means.", es: "Di qué significa." },
    first: { en: "Say what you found.", es: "Di lo que encontraste." },
    detail: { en: "Add a detail.", es: "Agrega un detalle." },
  };
  /** @param {string} en @param {boolean} first */
  function fnOf(en, first) {
    const t = String(en).toLowerCase();
    if (/\bbecause\b|\bsince\b|\bso that\b|\breason\b/.test(t)) return "reason";
    if (/[=×÷+−]/.test(t)) return "math";
    if (
      /\bthan\b|\bcompare|\bdifferent\b|\bsame\b|\bmore\b|\bfewer\b|\bless\b|\bgreater\b|\bbetter\b/.test(
        t,
      )
    )
      return "compare";
    if (/\bmeans?\b|\btherefore\b|\bwhich\b|\bso\b/.test(t)) return "mean";
    return first ? "first" : "detail";
  }

  /**
   * @param {any} fr @param {any} frEs
   * @returns {{parts: {en: string, es: string|null, fn: string, blanks: number}[], esAll: string}}
   */
  function splitFrame(fr, frEs) {
    const a = sentences(fr);
    const b = sentences(frEs);
    const paired = !!b.length && b.length === a.length;
    return {
      parts: a.map((en, i) => ({
        en,
        es: paired ? b[i] : null,
        fn: fnOf(en, i === 0),
        blanks: (en.match(/_{2,}/g) || []).length,
      })),
      esAll: b.length && !paired ? String(frEs) : "",
    };
  }

  const LINKS = new Set(
    "a an and are as at because but by each every for from if in is it its not of on or per than that the then to so which with was were means equals more less fewer greater and y o pero porque como cada de del el la en es son por que si entonces para con".split(
      " ",
    ),
  );
  /** A sentence cut down to its blanks and linking words ("My … is ___ … per …"). The first word stays so the sentence still starts. */
  function linksOnly(/** @type {string} */ en) {
    const bits = en.split(/(_{2,})/);
    const out = [];
    for (const [i, bit] of bits.entries()) {
      if (/^_{2,}$/.test(bit)) {
        out.push("___");
        continue;
      }
      const w = bit.split(/\s+/).filter(Boolean);
      /** @type {string[]} */
      const kept = [];
      for (const [j, word] of w.entries()) {
        const bare = word.toLowerCase().replace(/[^\p{L}]/gu, "");
        const keep = (i === 0 && j === 0) || LINKS.has(bare) || /[.,:;?!]$/.test(word);
        if (keep) kept.push(word.replace(/^[(]+/, ""));
        else if (kept[kept.length - 1] !== "…") kept.push("…");
      }
      out.push(kept.join(" "));
    }
    return out
      .join(" ")
      .replace(/\s+([.,:;?!])/g, "$1")
      .replace(/…(?:\s…)+/g, "…")
      .replace(/\s+/g, " ")
      .trim();
  }
  /** The first words of a sentence, cut at its first blank. */
  function startsOnly(/** @type {string} */ en) {
    const head = en.split(/_{2,}/)[0].trim();
    const w = (head || en.replace(/_{2,}/g, "").trim()).split(/\s+/).filter(Boolean);
    return `${w.slice(0, 3).join(" ")} …`;
  }

  /**
   * What a frame shows at one support level: lines of {en, es, label}. Level 1-2 keep the sentence as written; 3 keeps the linking
   * words; 4 the starters; 5 a plain prompt; 6 nothing. `over` is the lesson's own text for a level, when the data gives one.
   * @param {{en: string, es: string|null, fn: string}[]} parts
   * @param {number} level
   * @param {{en: string, es?: string}|null} [over]
   */
  function frameView(parts, level, over) {
    const lv = Math.min(6, Math.max(1, Math.round(level) || 2));
    if (over?.en) return [{ en: over.en, es: over.es || null, label: null, level: lv }];
    if (lv === 6) return [];
    return parts.map((p) => {
      const label = /** @type {any} */ (FUNCTIONS)[p.fn];
      if (lv <= 2) return { en: p.en, es: p.es, label, level: lv };
      if (lv === 3)
        return { en: linksOnly(p.en), es: p.es ? linksOnly(p.es) : null, label, level: lv };
      if (lv === 4)
        return { en: startsOnly(p.en), es: p.es ? startsOnly(p.es) : null, label, level: lv };
      return { en: label.en, es: label.es, label: null, level: lv };
    });
  }

  /* ---- tiles ---------------------------------------------------------------------------------------------------- */
  const MAX_TILES = 18;
  /**
   * Tiles for one frame sentence: its fixed phrases in order, the lesson's key words (English and Spanish, translanguaging is welcome),
   * and the numbers the problem itself states. Tiles are text the student already sees; the sentence is theirs to build.
   * @returns {{id: string, t: string, kind: "frame"|"word"|"num"}[]}
   */
  function tilesFor(
    /** @type {{en: string}} */ part,
    /** @type {string[]} */ kw = [],
    /** @type {string[]} */ kwEs = [],
    /** @type {string} */ stem = "",
  ) {
    /** @type {{id: string, t: string, kind: "frame"|"word"|"num"}[]} */
    const tiles = [];
    const seen = new Set();
    const add = (/** @type {string} */ t, /** @type {"frame"|"word"|"num"} */ kind) => {
      const s = String(t || "").trim();
      const k = `${kind}|${s.toLowerCase()}`;
      if (!s || seen.has(k) || tiles.length >= MAX_TILES) return;
      seen.add(k);
      tiles.push({ id: `t${tiles.length}`, t: s, kind });
    };
    for (const f of String(part?.en || "").split(/_{2,}/)) add(f.replace(/^[\s,]+/, ""), "frame");
    for (const k of kw) add(k, "word");
    for (const k of kwEs) add(k, "word");
    for (const seg of tint(stem)) if (seg.n) add(seg.t.trim(), "num");
    return tiles;
  }

  /* ---- terms ---------------------------------------------------------------------------------------------------- */
  const reEsc = (/** @type {string} */ s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  /**
   * Which of `terms` (strings) a text uses, longest first so "rectangular prism" wins over "prism"; a plural "s"/"es" counts.
   * @returns {{term: string, at: number}[]} in order of appearance
   */
  function findTerms(/** @type {any} */ text, /** @type {string[]} */ terms) {
    const t = String(text ?? "");
    const taken = /** @type {[number, number][]} */ ([]);
    /** @type {{term: string, at: number}[]} */
    const found = [];
    const order = [...new Set(terms.filter(Boolean))].sort((a, b) => b.length - a.length);
    for (const term of order) {
      const re = new RegExp(`(?<![\\p{L}\\p{N}])${reEsc(term)}(?:es|s)?(?![\\p{L}\\p{N}])`, "iu");
      const m = re.exec(t);
      if (!m) continue;
      const [s, e] = [m.index, m.index + m[0].length];
      if (taken.some(([x, y]) => s < y && e > x)) continue;
      taken.push([s, e]);
      found.push({ term, at: s });
    }
    return found.sort((a, b) => a.at - b.at);
  }

  /* ---- moves ---------------------------------------------------------------------------------------------------- */
  const plain = (/** @type {any} */ x) =>
    ` ${String(x ?? "")
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .replace(/\s+/g, " ")} `;
  const REASON =
    / (because|since|so|therefore|which means|that is why|porque|ya que|por eso|entonces|asi que|por lo tanto|lo cual) /;
  const SEQUENCE =
    / (first|then|next|after|finally|last|primero|luego|despues|finalmente|por ultimo) /;
  const CHECK =
    / (check|checked|verify|verified|estimate|estimated|inverse|inversa|opposite|comprob\w*|verific\w*|revis\w*|estim\w*|opuest\w*) /;
  /**
   * The four language moves a piece of writing already makes: a math word, a reason, a sequence word, a way to check. English or Spanish.
   * Nothing marks the writing wrong; a missing move is simply not counted.
   */
  function moves(/** @type {any} */ text, /** @type {string[]} */ terms = []) {
    const flat = plain(text);
    return {
      term: findTerms(text, terms).length > 0,
      reason: REASON.test(flat),
      sequence: SEQUENCE.test(flat),
      check: CHECK.test(flat),
    };
  }

  /* ---- cognates ------------------------------------------------------------------------------------------------- */
  /** The one watch-out ("amber") to show now: the first one this device has not yet acknowledged. A lesson never shows two at once. */
  function pickAmber(
    /** @type {{en: string, kind: string}[]} */ cog,
    /** @type {string[]} */ seen = [],
  ) {
    return (cog || []).find((c) => c.kind === "trap" && !seen.includes(c.en)) || null;
  }

  /* ---- evidence ------------------------------------------------------------------------------------------------- */
  /**
   * @param {{moves?: Record<string, boolean>, used?: string[]}[]} entries one per written task, newest last
   * @returns {{n: number, moves: Record<string, number>, used: Record<string, number>}|null} null until MIN_ENTRIES
   */
  function summarize(entries) {
    const list = Array.isArray(entries) ? entries : [];
    if (list.length < MIN_ENTRIES) return null;
    /** @type {Record<string, number>} */
    const mv = { term: 0, reason: 0, sequence: 0, check: 0 };
    /** @type {Record<string, number>} */
    const used = {};
    for (const e of list) {
      for (const k of Object.keys(mv)) if (e.moves?.[k]) mv[k]++;
      for (const u of e.used || []) used[u] = (used[u] || 0) + 1;
    }
    return { n: list.length, moves: mv, used };
  }

  W.StudioLangCore = {
    LONG_STEM,
    MIN_ENTRIES,
    LEVELS,
    TILE_MAX_LEVEL,
    FUNCTIONS,
    sentences,
    wordCount,
    askIndex,
    chunk,
    tint,
    splitFrame,
    frameView,
    tilesFor,
    findTerms,
    moves,
    pickAmber,
    summarize,
  };
})();
