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
 * THE RULE. The generator owns what it emits. Anything on disk it does not emit
 * is authored, and survives. That is one sentence, it needs no list of
 * protected key names, and it covers the next authored layer nobody has written
 * yet — which is the whole point, because both losses above were layers that
 * did not exist when the generator was written.
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
