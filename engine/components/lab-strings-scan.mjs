// Finds every `labT("key", "English", ...)` call in a lab's source, so the table in
// lab-strings-es.js can be checked against the labs that use it.
//
// A call is only recognised when its first two arguments are plain string
// literals. English that is built with `+` or `${}` cannot be matched to a table
// entry, so it is reported in `unreadable` rather than silently skipped: the
// interpolated parts belong in the third argument as `{name}` placeholders.

/**
 * @param {string} source
 * @returns {{ calls: { key: string, en: string, index: number }[], unreadable: number[] }}
 */
export function scanLabCalls(source) {
  const calls = [];
  const unreadable = [];
  const re = /\blabT\(/g;
  for (let m = re.exec(source); m; m = re.exec(source)) {
    // The import line and the helper's own definition are not call sites.
    const before = source.slice(Math.max(0, m.index - 20), m.index);
    if (/function\s*$/.test(before) || /import\s*\{[^}]*$/.test(before)) continue;
    let at = skipSpace(source, m.index + m[0].length);
    const key = readLiteral(source, at);
    if (!key) {
      unreadable.push(m.index);
      continue;
    }
    at = skipSpace(source, key.end);
    if (source[at] !== ",") {
      unreadable.push(m.index);
      continue;
    }
    const en = readLiteral(source, skipSpace(source, at + 1));
    if (!en) {
      unreadable.push(m.index);
      continue;
    }
    const next = source[skipSpace(source, en.end)];
    if (next !== "," && next !== ")") {
      unreadable.push(m.index);
      continue;
    }
    calls.push({ key: key.value, en: en.value, index: m.index });
  }
  return { calls, unreadable };
}

function skipSpace(s, i) {
  let at = i;
  while (at < s.length && /\s/.test(s[at])) at += 1;
  return at;
}

const ESCAPES = { n: "\n", t: "\t", r: "\r", "\\": "\\", '"': '"', "'": "'", "`": "`", "0": "\0" };

/** Reads a "…", '…' or `…` literal starting at `start`; null if it is anything else. */
function readLiteral(s, start) {
  const quote = s[start];
  if (quote !== '"' && quote !== "'" && quote !== "`") return null;
  let value = "";
  let at = start + 1;
  while (at < s.length) {
    const ch = s[at];
    if (ch === "\\") {
      const nextCh = s[at + 1];
      if (nextCh === "u" || nextCh === "x") return null; // not worth decoding; use the character itself
      value += ESCAPES[nextCh] ?? nextCh;
      at += 2;
    } else if (quote === "`" && ch === "$" && s[at + 1] === "{") {
      return null;
    } else if (ch === quote) {
      return { value, end: at + 1 };
    } else {
      value += ch;
      at += 1;
    }
  }
  return null;
}
