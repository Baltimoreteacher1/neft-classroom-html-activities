// Sentence Lab engine: parses annotated sentences, builds tiles, checks a built sentence, and describes the
// sentence "machine" (clauses and their parts). Pure logic. See src/content/craft-sentences.js for the notation.
const bi = (en, es) => ({ en, es });
const OPEN = /^([SVOMR])\[$/;
const PUNCT = /^[,.;?!]$/;

const newClause = (type) => ({ type, groups: [], conn: [] });

/** Parses "S[The/d dog/n] V[barks/v] ." into tokens, groups and clauses. Throws on a malformed sentence. */
export function parseSentence(dsl) {
  const parts = String(dsl).match(/[SVOMR]\[|\]|[^\s[\]]+/g) || [];
  const tokens = [];
  const clauses = [];
  let cur = newClause("I");
  let group = null;
  const flush = () => {
    if (cur.groups.length || cur.conn.length) clauses.push(cur);
  };
  for (const part of parts) {
    const open = OPEN.exec(part);
    if (open) {
      if (group) throw new Error(`Nested group in "${dsl}"`);
      group = { role: open[1], words: [], clause: clauses.length };
      continue;
    }
    if (part === "]") {
      if (!group) throw new Error(`Unmatched ] in "${dsl}"`);
      group.text = group.words.map((w) => w.text).join(" ");
      cur.groups.push(group);
      group = null;
      continue;
    }
    const slash = part.lastIndexOf("/");
    const text = slash > 0 ? part.slice(0, slash) : part;
    const pos = slash > 0 ? part.slice(slash + 1) : "";
    if (group) {
      const token = {
        text,
        pos,
        role: group.role,
        clause: clauses.length,
        group: cur.groups.length,
      };
      group.words.push(token);
      tokens.push(token);
      continue;
    }
    if (PUNCT.test(text)) {
      tokens.push({ text, pos: "", role: "P", clause: clauses.length });
      if (text === "," && cur.type === "D" && cur.groups.length) {
        flush();
        cur = newClause("I");
      } else if (text === ";") {
        flush();
        cur = newClause("I");
      }
      continue;
    }
    if (pos === "sc") {
      if (cur.groups.length) {
        flush();
        cur = newClause("D");
      } else cur.type = "D";
    } else if (pos === "c") {
      flush();
      cur = newClause("I");
    }
    cur.conn.push({ text, pos });
    tokens.push({ text, pos, role: "C", clause: clauses.length });
  }
  if (group) throw new Error(`Unclosed group in "${dsl}"`);
  flush();
  return { tokens, clauses, text: joinText(tokens.map((t) => t.text)) };
}

/** Joins words with spaces and attaches punctuation to the word before it. */
export const joinText = (list) =>
  list
    .join(" ")
    .replace(/\s+([,.;?!])/g, "$1")
    .replace(/\s+/g, " ")
    .trim();

/** Simple, compound, complex or compound-complex, from the parsed clauses. */
export function sentenceType(parsed) {
  const ind = parsed.clauses.filter((c) => c.type === "I" && c.groups.length).length;
  const dep =
    parsed.clauses.filter((c) => c.type === "D").length +
    parsed.clauses.reduce((n, c) => n + c.groups.filter((g) => g.role === "R").length, 0);
  if (ind > 1 && dep) return "compound-complex";
  if (ind > 1) return "compound";
  if (dep) return "complex";
  return "simple";
}
export const SENTENCE_TYPE = {
  simple: bi("simple sentence: one complete idea", "oración simple: una idea completa"),
  compound: bi(
    "compound sentence: two complete ideas joined together",
    "oración compuesta: dos ideas completas unidas",
  ),
  complex: bi(
    "complex sentence: one complete idea plus an idea that depends on it",
    "oración compleja: una idea completa más una idea que depende de ella",
  ),
  "compound-complex": bi(
    "compound-complex sentence: two complete ideas plus a dependent idea",
    "oración compuesta-compleja: dos ideas completas más una idea dependiente",
  ),
};

const JOINER = {
  and: bi("joins two ideas that add up", "une dos ideas que se suman"),
  but: bi("joins two ideas that contrast", "une dos ideas que contrastan"),
  or: bi("joins two choices", "une dos opciones"),
  so: bi("shows a result", "muestra un resultado"),
  yet: bi("joins two ideas that contrast", "une dos ideas que contrastan"),
  ";": bi("joins two closely related complete ideas", "une dos ideas completas muy relacionadas"),
  however: bi(
    "shows a contrast after a semicolon",
    "muestra un contraste después de un punto y coma",
  ),
};
const SUB = {
  because: bi("gives a reason", "da una razón"),
  although: bi("shows an unexpected contrast", "muestra un contraste inesperado"),
  when: bi("tells the time", "dice el momento"),
  whenever: bi("tells the time", "dice el momento"),
  while: bi("tells what happens at the same time", "dice qué pasa al mismo tiempo"),
  if: bi("sets a condition", "pone una condición"),
  unless: bi("sets a condition that must not happen", "pone una condición que no debe pasar"),
  after: bi("tells what came first", "dice qué pasó antes"),
  before: bi("tells what comes next", "dice qué viene después"),
  since: bi("gives a reason or a starting time", "da una razón o un tiempo de inicio"),
  once: bi("tells the time", "dice el momento"),
};
/** What a joining word does, for the machine's connector labels. */
export const joinerNote = (word, pos) =>
  (pos === "sc" ? SUB[word.toLowerCase()] : JOINER[word.toLowerCase()]) ||
  bi("joins ideas", "une ideas");

/** The machine model: one entry per clause with its slots (S, V, O, M, R) and its joining words. */
export function machineModel(parsed) {
  return parsed.clauses.map((c) => ({
    type: c.type,
    conn: c.conn,
    slots: Object.fromEntries(
      ["S", "V", "O", "M", "R"].map((role) => [
        role,
        c.groups.filter((g) => g.role === role).map((g) => g.text),
      ]),
    ),
  }));
}

/** Tiles in answer order. Early build tasks use word tiles; everything else uses phrase tiles. */
export function tilesFor(task, parsed) {
  const wordMode = task.kind === "b" && task.lv <= 2;
  const out = [];
  if (wordMode) {
    for (const t of parsed.tokens) out.push({ text: t.text, role: t.role, pos: t.pos });
    return out;
  }
  let lastGroup = null;
  // Rebuild from clauses so a group becomes one tile; connectors and punctuation stay single tiles.
  for (const t of parsed.tokens) {
    if (t.role === "C" || t.role === "P") {
      out.push({ text: t.text, role: t.role, pos: t.pos });
      lastGroup = null;
      continue;
    }
    const key = `${t.clause}:${t.group}:${t.role}`;
    if (key === lastGroup) out[out.length - 1].text += ` ${t.text}`;
    else out.push({ text: t.text, role: t.role, pos: "" });
    lastGroup = key;
  }
  return out;
}

/** Stable shuffle from a string seed (a task id), so a reload shows the same tiles. Never returns the answer order. */
export function seededShuffle(items, seed) {
  let h = 2166136261;
  for (const ch of String(seed)) h = Math.imul(h ^ ch.charCodeAt(0), 16777619) >>> 0;
  const next = () => {
    h ^= h << 13;
    h >>>= 0;
    h ^= h >>> 17;
    h ^= h << 5;
    h >>>= 0;
    return h / 4294967296;
  };
  const a = items.map((x, i) => ({ x, i }));
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(next() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  if (a.length > 1 && a.every((e, i) => e.i === i)) a.push(a.shift());
  return a.map((e) => e.x);
}

const ROLE_NAME = {
  S: bi("the subject (who or what)", "el sujeto (quién o qué)"),
  V: bi("the verb (what happens)", "el verbo (qué pasa)"),
  O: bi("the object or more (what or whom)", "el objeto o más (qué o a quién)"),
  M: bi("a detail (how, where, when, or why)", "un detalle (cómo, dónde, cuándo o por qué)"),
  R: bi("the describing clause (which one)", "la cláusula descriptiva (cuál)"),
  C: bi("a joining word", "una palabra que une"),
  P: bi("punctuation", "puntuación"),
};

/**
 * Checks tiles placed in order against a task. `placed` is a list of tile texts.
 * Returns { ok, text, hint } where hint names the kind of part that belongs at the first wrong place,
 * never the word itself.
 */
export function checkBuild(parsed, tiles, alt, placed) {
  const want = [parsed.text, ...alt];
  const text = joinText(placed);
  if (want.includes(text)) return { ok: true, text, hint: null };
  if (placed.length < tiles.length)
    return {
      ok: false,
      text,
      hint: bi(
        `Use all ${tiles.length} tiles. You have placed ${placed.length}.`,
        `Usa las ${tiles.length} fichas. Has puesto ${placed.length}.`,
      ),
    };
  const wantTiles = tiles.map((t) => t.text);
  const i = placed.findIndex((p, k) => p !== wantTiles[k]);
  if (
    placed[placed.length - 1] &&
    !/[.?!]$/.test(placed[placed.length - 1]) &&
    /[.?!]$/.test(wantTiles.at(-1))
  )
    return {
      ok: false,
      text,
      hint: bi(
        "A sentence ends with an end mark. Check the last tile.",
        "Una oración termina con un signo final. Revisa la última ficha.",
      ),
    };
  if (i < 0)
    return {
      ok: false,
      text,
      hint: bi("Check the order of the details.", "Revisa el orden de los detalles."),
    };
  const role = ROLE_NAME[tiles[i].role] || ROLE_NAME.M;
  return {
    ok: false,
    text,
    hint: bi(
      `Look at place ${i + 1}. It needs ${role.en}.`,
      `Mira el lugar ${i + 1}. Necesita ${role.es}.`,
    ),
  };
}
