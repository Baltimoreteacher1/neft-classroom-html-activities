/**
 * Helpers shared by the sentinel-based HTML injectors.
 *
 * The injectors that "strip then re-append" are individually correct but fight
 * each other: each one removes its own block and re-inserts it before the last
 * </head> / </body>, so running A then B leaves A's block ahead of B's, and
 * running A again moves A's block back to the end. Two such injectors ping-pong
 * forever, rewriting the same pages on every build. The chain only looked
 * stable because package.json happens to run them in the order that lands on
 * the committed layout.
 *
 * The fix is to treat "already present and identical" as done, wherever the
 * block currently sits. Position is not part of the contract — these are
 * <link>/<script defer> tags whose behaviour does not depend on their order
 * relative to another injector's tags.
 */

/**
 * Is this exact block already in the document?
 *
 * Compares by MARKER + inner content with whitespace normalized, because the
 * strip/re-append cycle legitimately shifts indentation: what matters is
 * whether the page already loads the same asset from the same layer, not
 * whether the leading spaces match.
 *
 * @param {string} html      document source
 * @param {string} block     the full block, including its begin/end comments
 * @returns {boolean} true when an equivalent block is already present
 */
export function hasEquivalentBlock(html, block) {
  const begin = /<!--\s*([\w-]+:begin)/.exec(block)?.[1];
  const end = /<!--\s*([\w-]+:end)/.exec(block)?.[1];
  if (!begin || !end) return false;

  const existing = new RegExp(
    `<!--\\s*${begin}[\\s\\S]*?<!--\\s*${end}\\s*-->`,
    // Only the first occurrence matters: a duplicate is a separate error the
    // injectors already check for.
  ).exec(html);
  if (!existing) return false;

  return normalize(existing[0]) === normalize(block);
}

const normalize = (s) =>
  s
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .join("\n");
