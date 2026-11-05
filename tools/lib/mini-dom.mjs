// A tiny HTML reader for the GENERATED family pages (well-formed, ~600 KB each).
// jsdom needs about a second per page, which makes a 166-page sweep take minutes; this reads
// the same pages in tens of milliseconds. It is not a browser parser: it handles tags,
// attributes, entities, comments and raw <script>/<style>, which is all these pages use.
const VOID = new Set(
  "area base br col embed hr img input link meta param source track wbr".split(" "),
);
const RAW = new Set(["script", "style"]);
const INLINE = new Set(
  "a abbr b bdi code em i label mark s small span strong sub sup tspan u".split(" "),
);
const ENTITIES = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
  hellip: "…",
  mdash: "—",
  ndash: "–",
};

export function decode(s) {
  return s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, e) => {
    if (e[0] === "#") {
      const n = e[1].toLowerCase() === "x" ? Number.parseInt(e.slice(2), 16) : Number(e.slice(1));
      return Number.isFinite(n) ? String.fromCodePoint(n) : m;
    }
    return ENTITIES[e.toLowerCase()] ?? m;
  });
}

const TOKEN =
  /<!--[\s\S]*?-->|<!doctype[^>]*>|<\/([a-zA-Z][\w:-]*)\s*>|<([a-zA-Z][\w:-]*)((?:\s+[^\s=>/]+(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+))?)*)\s*(\/?)>|([^<]+)|</gi;
const ATTR = /([^\s=>/]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g;

function parseAttrs(src) {
  const attrs = {};
  for (const m of src.matchAll(ATTR))
    attrs[m[1].toLowerCase()] = decode(m[2] ?? m[3] ?? m[4] ?? "");
  return attrs;
}

/** Parse HTML into { tag, attrs, children, parent } nodes; text nodes are { text }. */
export function parseHtml(html) {
  const root = { tag: "#root", attrs: {}, children: [], parent: null };
  let cur = root;
  TOKEN.lastIndex = 0;
  let m = TOKEN.exec(html);
  while (m) {
    if (m[1]) {
      const tag = m[1].toLowerCase();
      for (let n = cur; n && n !== root; n = n.parent) {
        if (n.tag === tag) {
          cur = n.parent;
          break;
        }
      }
    } else if (m[2]) {
      const tag = m[2].toLowerCase();
      const el = { tag, attrs: parseAttrs(m[3] || ""), children: [], parent: cur };
      cur.children.push(el);
      if (RAW.has(tag) && !m[4]) {
        const end = html.toLowerCase().indexOf(`</${tag}`, TOKEN.lastIndex);
        const stop = end === -1 ? html.length : end;
        el.raw = html.slice(TOKEN.lastIndex, stop);
        TOKEN.lastIndex = stop;
      } else if (!VOID.has(tag) && !m[4]) cur = el;
    } else if (m[5] !== undefined) cur.children.push({ text: decode(m[5]), parent: cur });
    m = TOKEN.exec(html);
  }
  return root;
}

export const hasClass = (el, c) =>
  Boolean(el.attrs?.class) && el.attrs.class.split(/\s+/).includes(c);

/** Depth-first element walk. */
export function* walk(node) {
  for (const c of node.children || []) {
    if (c.tag) {
      yield c;
      yield* walk(c);
    }
  }
}

export const findAll = (node, pred) => [...walk(node)].filter(pred);
export const find = (node, pred) => {
  for (const el of walk(node)) if (pred(el)) return el;
  return null;
};
export const closest = (el, pred) => {
  for (let n = el.parent; n; n = n.parent) if (n.tag && pred(n)) return n;
  return null;
};

const norm = (s) => s.replace(/\s+/g, " ").trim();

/**
 * Visible text of a node. `skip(el)` drops a subtree (for example the other language).
 * Block-level boundaries become spaces so words never fuse; inline tags do not split a word.
 */
export function textOf(node, skip = () => false) {
  const parts = [];
  const visit = (n) => {
    if (n.text !== undefined) {
      parts.push(n.text);
      return;
    }
    if (n.tag === "script" || n.tag === "style" || skip(n)) return;
    const inline = INLINE.has(n.tag);
    if (!inline) parts.push(" ");
    for (const c of n.children) visit(c);
    if (!inline) parts.push(" ");
  };
  visit(node);
  return norm(parts.join(""));
}
