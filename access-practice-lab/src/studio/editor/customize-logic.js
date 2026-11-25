// Pure logic behind the Customize screens (no DOM, no network): the plain-text diff a teacher reviews before an
// assistant's suggestion is applied, which parts of a suggestion are applied, how My Activities classifies and groups
// drafts, and how the chooser filters a family's list. Kept here so it can be unit tested without a browser.

const SKIP_KEYS = new Set(["id", "type", "src", "image", "alt", "decorative"]);
const KEY_PATH = /(^|\.)(correct|answer|answers|key|accept|accepts|solution|isCorrect)(\.|\[|$)/i;

/** Every leaf value of a block as [path, text], skipping ids, types and pictures. */
export function leaves(value, prefix = "") {
  if (value == null) return [];
  if (typeof value !== "object") return [[prefix, String(value)]];
  const out = [];
  if (Array.isArray(value)) {
    value.forEach((v, i) => out.push(...leaves(v, `${prefix}[${i}]`)));
    return out;
  }
  for (const [k, v] of Object.entries(value)) {
    if (SKIP_KEYS.has(k)) continue;
    out.push(...leaves(v, prefix ? `${prefix}.${k}` : k));
  }
  return out;
}

/** Word-level diff: [{ op: "same" | "del" | "add", text }]. Plain text in, plain text out. */
export function diffWords(before, after) {
  const a = String(before ?? "")
    .split(/(\s+)/)
    .filter(Boolean);
  const b = String(after ?? "")
    .split(/(\s+)/)
    .filter(Boolean);
  const n = a.length;
  const m = b.length;
  const lcs = Array.from({ length: n + 1 }, () => new Uint16Array(m + 1));
  for (let i = n - 1; i >= 0; i--)
    for (let j = m - 1; j >= 0; j--)
      lcs[i][j] = a[i] === b[j] ? lcs[i + 1][j + 1] + 1 : Math.max(lcs[i + 1][j], lcs[i][j + 1]);
  const raw = [];
  let i = 0;
  let j = 0;
  while (i < n && j < m) {
    if (a[i] === b[j]) (raw.push({ op: "same", text: a[i] }), i++, j++);
    else if (lcs[i + 1][j] >= lcs[i][j + 1]) raw.push({ op: "del", text: a[i++] });
    else raw.push({ op: "add", text: b[j++] });
  }
  while (i < n) raw.push({ op: "del", text: a[i++] });
  while (j < m) raw.push({ op: "add", text: b[j++] });
  const merged = [];
  for (const seg of raw) {
    const last = merged[merged.length - 1];
    if (last && last.op === seg.op) last.text += seg.text;
    else merged.push({ ...seg });
  }
  return merged;
}

const sameJson = (x, y) => JSON.stringify(x) === JSON.stringify(y);

/** The first plain line of a block, enough for a teacher to recognise it. */
export function blockTitle(block) {
  if (!block) return "";
  const first = leaves(block).find(([, t]) => t && t.length > 1 && Number.isNaN(Number(t)));
  return first ? first[1].slice(0, 70) : block.type;
}

/**
 * What a suggestion would change, one entry per block (plus title/description).
 * entry: { id, kind: "changed" | "added" | "removed" | "title" | "description", title, fields: [{ path, before, after, key }], keyChanged }
 */
export function proposalChanges(base, proposed) {
  const out = [];
  for (const field of ["title", "description"])
    if ((base[field] || "") !== (proposed[field] || ""))
      out.push({
        id: `@${field}`,
        kind: field,
        title: field,
        fields: [
          { path: field, before: base[field] || "", after: proposed[field] || "", key: false },
        ],
        keyChanged: false,
      });
  const baseById = new Map(base.blocks.map((b) => [b.id, b]));
  const propById = new Map(proposed.blocks.map((b) => [b.id, b]));
  for (const b of proposed.blocks) {
    const old = baseById.get(b.id);
    if (!old) {
      out.push({
        id: b.id,
        kind: "added",
        title: blockTitle(b),
        fields: leaves(b)
          .filter(([, t]) => t)
          .map(([path, t]) => ({ path, before: "", after: t, key: KEY_PATH.test(path) })),
        keyChanged: false,
      });
    } else if (!sameJson(old, b)) {
      const before = new Map(leaves(old));
      const after = new Map(leaves(b));
      const fields = [];
      for (const path of new Set([...before.keys(), ...after.keys()])) {
        const x = before.get(path) ?? "";
        const y = after.get(path) ?? "";
        if (x !== y) fields.push({ path, before: x, after: y, key: KEY_PATH.test(path) });
      }
      if (fields.length)
        out.push({
          id: b.id,
          kind: "changed",
          title: blockTitle(old),
          fields,
          keyChanged: fields.some((f) => f.key),
        });
    }
  }
  for (const b of base.blocks)
    if (!propById.has(b.id))
      out.push({
        id: b.id,
        kind: "removed",
        title: blockTitle(b),
        fields: leaves(b)
          .filter(([, t]) => t)
          .slice(0, 6)
          .map(([path, t]) => ({ path, before: t, after: "", key: KEY_PATH.test(path) })),
        keyChanged: false,
      });
  return out;
}

/** The activity with only the chosen changes applied (`chosen` = set of entry ids). Never mutates its inputs. */
export function applyChosen(base, proposed, chosen) {
  const next = JSON.parse(JSON.stringify(base));
  if (chosen.has("@title")) next.title = proposed.title;
  if (chosen.has("@description")) next.description = proposed.description;
  const propById = new Map(proposed.blocks.map((b) => [b.id, b]));
  const baseIds = new Set(base.blocks.map((b) => b.id));
  const blocks = [];
  for (const b of base.blocks) {
    const p = propById.get(b.id);
    if (!p) {
      if (!chosen.has(b.id)) blocks.push(b);
    } else blocks.push(chosen.has(b.id) ? p : b);
  }
  proposed.blocks.forEach((b, i) => {
    if (baseIds.has(b.id) || !chosen.has(b.id)) return;
    const prev = proposed.blocks[i - 1];
    const at = prev ? blocks.findIndex((x) => x.id === prev.id) : -1;
    blocks.splice(at + 1, 0, b);
  });
  next.blocks = blocks;
  return next;
}

// ── My Activities ────────────────────────────────────────────────────────────────────────────

/**
 * Lineage `family` for activities made in the Studio itself (a draft that only records which blocks the customizer
 * added, or a version of one). Same string as STUDIO_FAMILY in core/differentiate-util.js.
 */
export const STUDIO_FAMILY = "studio";

/** True when the draft was copied from a platform activity (a real adapter family), not made in the Studio. */
export const isPlatform = (lineage) => Boolean(lineage?.family) && lineage.family !== STUDIO_FAMILY;
export const isVersion = (lineage) => Boolean(lineage?.variantOf && lineage.tier);

/** "version" (a differentiated version), "customized" (copied from a platform activity), "created" (from scratch). */
export function originOf(activity) {
  const l = activity?.lineage;
  if (!activity) return "";
  if (isVersion(l)) return "version";
  if (isPlatform(l)) return "customized";
  return "created";
}

export const ORIGIN_FILTERS = ["all", "customized", "created", "version"];

/** Does an item pass the origin filter? Items whose content is not on this device only show under "all". */
export function passesOrigin(item, filter) {
  if (filter === "all") return true;
  return originOf(item.activity) === filter;
}

/** Versions whose original is also in the list move under it. -> { top: [item], versionsOf: Map<id, [item]> } */
export function groupVariants(items) {
  const ids = new Set(items.map((i) => i.id));
  const versionsOf = new Map();
  const top = [];
  for (const it of items) {
    const parent = isVersion(it.activity?.lineage) ? it.activity.lineage.variantOf : "";
    if (parent && ids.has(parent) && parent !== it.id) {
      if (!versionsOf.has(parent)) versionsOf.set(parent, []);
      versionsOf.get(parent).push(it);
    } else top.push(it);
  }
  return { top, versionsOf };
}

// ── Chooser ──────────────────────────────────────────────────────────────────────────────────

const norm = (s) => String(s ?? "").toLowerCase();

/** Filter one family's list by grade, domain/subject and free text. Missing fields never hide an item from "all". */
export function filterSources(items, { grade = "", domain = "", text = "" } = {}) {
  const q = norm(text).trim();
  return items.filter((it) => {
    if (grade && norm(it.grade) !== norm(grade)) return false;
    if (domain && norm(it.domain || it.subject) !== norm(domain)) return false;
    return (
      !q ||
      [it.title, it.description, it.domain, it.subject, it.grade].map(norm).join(" ").includes(q)
    );
  });
}

/** The distinct values of one field, sorted (numbers first), for a filter's options. */
export function distinct(items, pick) {
  const set = new Set(
    items
      .map(pick)
      .filter((v) => v !== "" && v != null)
      .map(String),
  );
  return [...set].sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
}

// ── Language level ───────────────────────────────────────────────────────────────────────────

/** Teacher-language levels and the WIDA support bundle each one switches on (see supportsForWida in generate.js). */
export const LEVELS = [
  { id: "emerging", wida: 2 },
  { id: "developing", wida: 3 },
  { id: "expanding", wida: 4 },
  { id: "extension", wida: 5 },
];

/** Amount of support, separate from language level: which switches are on. Spanish is never touched here. */
export const SUPPORT_AMOUNTS = {
  light: { hints: true, frames: false, chunk: false, readAloud: false, visuals: false },
  standard: { hints: true, frames: true, chunk: false, readAloud: false, visuals: true },
  extra: { hints: true, frames: true, chunk: true, readAloud: true, visuals: true },
};

/** Which amount matches the current switches exactly, or "". */
export function amountOf(supports) {
  return (
    Object.entries(SUPPORT_AMOUNTS).find(([, flags]) =>
      Object.entries(flags).every(([k, v]) => Boolean(supports?.[k]) === v),
    )?.[0] || ""
  );
}

export const levelOf = (supports) => {
  const w = supports?.wida || 0;
  if (!w) return "";
  return w <= 2 ? "emerging" : w === 3 ? "developing" : w === 4 ? "expanding" : "extension";
};

/** "Emerging version of Title" for the banner, in the lab's S(en, es) form. */
export const tierSentence = (S, tierLabel, title) =>
  S(`${tierLabel.en} version of ${title}`, `Versión ${tierLabel.es} de ${title}`);
