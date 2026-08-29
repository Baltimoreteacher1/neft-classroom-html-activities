/**
 * authored-overlay.mjs — generated base + authored overlay, instead of
 * "regenerate the file and erase everything that was added to it later".
 *
 * WHY THIS EXISTS. The 204 small-group configs are GENERATED from their base
 * lesson, and they are also the file that several later, separate steps write
 * into:
 *
 *   - `tools/apply-es-translations.mjs` adds the Spanish overlay
 *     (`choicesEs`, `hintsEs`, `correctWorkEs`, …) from data/es-translations;
 *   - the alignment pass adds `launch.conceptIntro.interactiveVisual`, a
 *     lesson's explicit statement of which tool it wants.
 *
 * The generator rebuilt each config from the base and wrote it whole, so every
 * one of those layers was erased on the next run. Reproduced on `main`:
 * `--only 5-10` deleted 74 lines from `5-10-group1/config.json`, taking ten
 * Spanish arrays and the authored interactive with them. The repo's answer had
 * been a documented WORKAROUND (`--facilitation-only`, "a full run is
 * destructive") plus one bespoke preserver for vocabulary. A workaround is a
 * note asking humans to remember; this is a rule.
 *
 * THE FIRST RULE (2026-07, `mergeAuthoredOverlay`). The generator owns what it
 * emits. Anything on disk it does not emit is authored, and survives. That is
 * one sentence, it needs no list of protected key names, and it covers the next
 * authored layer nobody has written yet.
 *
 * THE RULE THAT REPLACED IT (2026-08-29, `mergeAdditive`). The first rule was
 * not enough, because authored work is not only NEW keys — it is also rewritten
 * key ideas, re-framed Spanish, renamed warmup ids that key save/resume, and
 * whole practice items the generator never produced. "The generator wins where
 * it speaks" reverted all of that on every run (docs/known-defects.md,
 * "generate-small-group-lessons.mjs reverts hand-improved content"). So for a
 * lesson that already has a committed config, THE COMMITTED FILE IS CANONICAL
 * and the generator is ADDITIVE ONLY: it never deletes, reorders, renames or
 * replaces anything the file already has; it may only add keys that are absent
 * and append items whose identity is absent. `mergeAuthoredOverlay` survives as
 * the deliberate `--replace` path, which announces what it is about to undo.
 *
 * ARRAYS ARE THE DANGEROUS PART, and merging them by index is worse than losing
 * the data: `practice.approaching[3].choicesEs` is the Spanish for ONE question,
 * and if the generator reorders or replaces items, index-wise merging silently
 * attaches the translation of one question to a different question. A student
 * then reads a correct-looking Spanish answer to a question nobody asked. So
 * elements are paired by IDENTITY (`id`, then `stem`, then `term`, then
 * `question`), never by position, and an element whose identity is not found is
 * reported as a drop rather than guessed at.
 */

/** The fields that identify "the same item" across a regeneration, in order. */
const IDENTITY_KEYS = ["id", "stem", "term", "question", "prompt", "title"];

function identityOf(node) {
  if (!node || typeof node !== "object" || Array.isArray(node)) return null;
  for (const key of IDENTITY_KEYS) {
    const value = node[key];
    if (typeof value === "string" && value.trim()) return `${key}:${value.trim()}`;
    if (typeof value === "number") return `${key}:${value}`;
  }
  return null;
}

const isPlainObject = (v) => v && typeof v === "object" && !Array.isArray(v);

/**
 * Merge the authored layer of `prior` onto freshly `generated` content.
 *
 * @param {any} generated  what the generator just built — always wins where it speaks
 * @param {any} prior      what is on disk — kept only where the generator is silent
 * @param {{ onDrop?: (path: string) => void, path?: string }} [opts]
 *        onDrop is called with the dot-path of every authored value that could
 *        NOT be carried forward, so a run reports its losses instead of making
 *        them invisible.
 */
export function mergeAuthoredOverlay(generated, prior, opts = {}) {
  const { onDrop = () => {}, path = "" } = opts;
  const at = (key) => (path ? `${path}.${key}` : String(key));

  if (prior === undefined) return generated;

  // The generator did not emit this at all — it is authored, so it survives.
  if (generated === undefined) return prior;

  if (Array.isArray(generated)) {
    if (!Array.isArray(prior)) return generated;
    const byIdentity = new Map();
    for (const item of prior) {
      const id = identityOf(item);
      if (id && !byIdentity.has(id)) byIdentity.set(id, item);
    }
    const used = new Set();
    const out = generated.map((item, i) => {
      const id = identityOf(item);
      const match = id ? byIdentity.get(id) : undefined;
      if (match === undefined) return item;
      used.add(id);
      return mergeAuthoredOverlay(item, match, { onDrop, path: `${at(i)}` });
    });
    // Authored extras on an item this run no longer produces cannot be placed.
    for (const [id, item] of byIdentity) {
      if (used.has(id)) continue;
      if (authoredKeyCount(item)) onDrop(`${path}[${id}]`);
    }
    return out;
  }

  if (isPlainObject(generated)) {
    if (!isPlainObject(prior)) return generated;
    const out = { ...generated };
    for (const [key, value] of Object.entries(prior)) {
      out[key] = mergeAuthoredOverlay(generated[key], value, { onDrop, path: at(key) });
    }
    return out;
  }

  // A scalar the generator emitted. The generator is the source of truth for it.
  return generated;
}

/**
 * Every identity signature an item answers to — `id:…`, `stem:…`, `term:…` —
 * not just the first. Pairing on the FIRST key alone is how a renamed warmup id
 * (`warmup-3-1-1` → `warmup-3-1-group1-1`, an authored rename that keys
 * save/resume) looked like a brand-new question: same stem, different id, so an
 * additive merge would have appended a duplicate. An item is "already there"
 * when ANY of its signatures is.
 */
export function signaturesOf(node) {
  if (!isPlainObject(node)) return [];
  const out = [];
  for (const key of IDENTITY_KEYS) {
    const value = node[key];
    if (typeof value === "string" && value.trim()) out.push(`${key}:${value.trim()}`);
    else if (typeof value === "number") out.push(`${key}:${value}`);
  }
  return out;
}

/**
 * The part of a generation that is the generator's OWN — not carried over from
 * the base lesson it cloned.
 *
 * Both generators start from `clone(base)`, so a generation carries every field
 * the base has gained since the variant was last written: `explore.discourse`,
 * `launch.figure`, `revealWordProblem`, a base item's new `misconceptionTags`,
 * the base's warmup questions. On 2026-08-29 a naive "add whatever is absent"
 * would have written 113 of 168 small-group configs and 36 of 36 catch-ups
 * with exactly that drift — including practice items a person had trimmed
 * from a challenge group on purpose. The committed variant is canonical for
 * what it inherits; base drift reaches it only through `--replace`.
 *
 * So: a scalar is the generator's own when it differs from the base at the
 * same path; an object is kept only where it has such children; an array the
 * base does not carry at all (`parallelPractice`, a tier the generator builds
 * from scratch) is the generator's own as a whole; an array the base DOES carry
 * contributes only the elements `isAuthoredItem` vouches for (the small-group
 * generator vouches for its authored challenge tasks and nothing else — a
 * sampled or cloned item is never an addition). Returns undefined when nothing
 * is the generator's own.
 *
 * Whether an element may then be APPENDED to an array the committed file
 * already has is `mergeAdditive`'s `mayAppend` — pass the same predicate, so a
 * whole-array key is added when the file lacks it, but a committed array only
 * ever grows by a vouched item.
 *
 * @param {any} generated
 * @param {any} baseline  the base config the generation was cloned from
 * @param {{ isAuthoredItem?: (item: object) => boolean }} [opts]
 */
export function authoredDelta(generated, baseline, opts = {}) {
  const { isAuthoredItem = () => false } = opts;
  if (Array.isArray(generated)) {
    if (!Array.isArray(baseline)) return generated;
    const items = generated.filter((item) => isPlainObject(item) && isAuthoredItem(item));
    return items.length ? items : undefined;
  }
  if (isPlainObject(generated)) {
    const base = isPlainObject(baseline) ? baseline : {};
    const out = {};
    for (const [key, value] of Object.entries(generated)) {
      const child = authoredDelta(value, base[key], opts);
      if (child !== undefined) out[key] = child;
    }
    return Object.keys(out).length ? out : undefined;
  }
  return generated === baseline ? undefined : generated;
}

/**
 * The committed file is canonical; the generator may only ADD.
 *
 * Feed it `authoredDelta(...)`, not the raw generation — see above for why a
 * cloned base field is not an addition.
 *
 * @param {any} committed  what is on disk — wins wherever it has a value
 * @param {any} generated  what the generator built — consulted only for what
 *                         the committed file lacks
 * @param {{ onAdd?: (path: string) => void, mayAppend?: (item: object) => boolean, path?: string }} [opts]
 *        onAdd is called with the dot-path of every value this merge added, so
 *        a run reports its additions instead of hiding them in a diff.
 *        mayAppend vouches for an element before it is appended to an array the
 *        committed file already has; the default vouches for nothing.
 * @returns {any} the committed value with absent keys / items appended
 *
 * Objects: every committed key is kept in committed order; a generated key the
 * file lacks is appended. Arrays: the committed array is kept whole and in
 * order; a generated element is appended only when `mayAppend` vouches for it,
 * it carries an identity, and no committed element shares any of its
 * signatures. Elements with no identity (arrays of strings — `lines`,
 * `choices`, `hints`) are never merged: the committed array is the answer.
 * Scalars: committed wins, always.
 */
export function mergeAdditive(committed, generated, opts = {}) {
  const { onAdd = () => {}, mayAppend = () => false, path = "" } = opts;
  const at = (key) => (path ? `${path}.${key}` : String(key));

  if (committed === undefined) {
    if (generated !== undefined) onAdd(path || "(root)");
    return generated;
  }
  if (generated === undefined) return committed;

  if (Array.isArray(committed)) {
    if (!Array.isArray(generated)) return committed;
    const present = new Set(committed.flatMap(signaturesOf));
    const bySignature = new Map();
    for (const item of committed) {
      for (const sig of signaturesOf(item)) if (!bySignature.has(sig)) bySignature.set(sig, item);
    }
    const out = committed.map((item) => {
      // A committed item may still be MISSING fields the generator now emits
      // (a Spanish field, a new schema key): recurse so those are added.
      const twin = generated.find((g) =>
        signaturesOf(g).some((sig) => bySignature.get(sig) === item),
      );
      return twin === undefined
        ? item
        : mergeAdditive(item, twin, { onAdd, mayAppend, path: `${at(identityOf(item) || "?")}` });
    });
    for (const item of generated) {
      const sigs = signaturesOf(item);
      if (!sigs.length || sigs.some((sig) => present.has(sig))) continue;
      if (!mayAppend(item)) continue;
      for (const sig of sigs) present.add(sig);
      onAdd(`${path}[${sigs[0]}]`);
      out.push(item);
    }
    return out;
  }

  if (isPlainObject(committed)) {
    if (!isPlainObject(generated)) return committed;
    const out = { ...committed };
    for (const [key, value] of Object.entries(generated)) {
      out[key] = mergeAdditive(committed[key], value, { onAdd, mayAppend, path: at(key) });
    }
    return out;
  }

  return committed;
}

/**
 * What writing `next` over `committed` would REMOVE or REPLACE, as dot-paths.
 *
 * `--replace` prints this per lesson before it writes, so a deliberate
 * overwrite is a decision made with the list in hand, never a surprise found in
 * a diff afterwards. Additions are not listed — they are what every run does.
 */
export function describeReplacements(committed, next, path = "") {
  const out = [];
  const at = (key) => (path ? `${path}.${key}` : String(key));
  if (committed === undefined || committed === next) return out;
  if (next === undefined) {
    out.push(`remove   ${path || "(root)"}`);
    return out;
  }

  if (Array.isArray(committed)) {
    if (!Array.isArray(next)) {
      out.push(`replace  ${path}`);
      return out;
    }
    const nextBySig = new Map();
    for (const item of next) for (const sig of signaturesOf(item)) nextBySig.set(sig, item);
    const identified = committed.filter((item) => signaturesOf(item).length);
    if (!identified.length) {
      if (JSON.stringify(committed) !== JSON.stringify(next)) out.push(`replace  ${path}`);
      return out;
    }
    for (const item of committed) {
      const sigs = signaturesOf(item);
      if (!sigs.length) continue;
      const twin = sigs.map((sig) => nextBySig.get(sig)).find((x) => x !== undefined);
      if (twin === undefined) out.push(`remove   ${path}[${sigs[0]}]`);
      else out.push(...describeReplacements(item, twin, `${path}[${sigs[0]}]`));
    }
    return out;
  }

  if (isPlainObject(committed)) {
    if (!isPlainObject(next)) {
      out.push(`replace  ${path}`);
      return out;
    }
    for (const [key, value] of Object.entries(committed)) {
      out.push(...describeReplacements(value, next[key], at(key)));
    }
    return out;
  }

  if (committed !== next) out.push(`replace  ${path}`);
  return out;
}

/** How many values an unmatched prior item was carrying, for the drop report. */
function authoredKeyCount(node) {
  if (!isPlainObject(node)) return 0;
  return Object.keys(node).length;
}

/**
 * The authored keys a merge would carry forward, as dot-paths.
 *
 * Used by the safety gate and by `--dry-run` to say what a regeneration is
 * protecting, so "the overlay survived" is a reported fact rather than a hope.
 */
export function authoredPaths(generated, prior, path = "") {
  const out = [];
  if (prior === undefined || generated === prior) return out;
  const at = (key) => (path ? `${path}.${key}` : String(key));

  if (Array.isArray(prior) && Array.isArray(generated)) {
    const byIdentity = new Map();
    for (const item of generated) {
      const id = identityOf(item);
      if (id && !byIdentity.has(id)) byIdentity.set(id, item);
    }
    for (const item of prior) {
      const id = identityOf(item);
      if (!id || !byIdentity.has(id)) continue;
      out.push(...authoredPaths(byIdentity.get(id), item, `${at(id)}`));
    }
    return out;
  }

  if (isPlainObject(prior)) {
    for (const [key, value] of Object.entries(prior)) {
      if (!isPlainObject(generated)) continue;
      if (generated[key] === undefined) out.push(at(key));
      else out.push(...authoredPaths(generated[key], value, at(key)));
    }
  }
  return out;
}
