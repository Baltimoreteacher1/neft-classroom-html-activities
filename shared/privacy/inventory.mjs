// Data inventory engine. The inventory is generated from `@data` annotations, never typed by hand:
//
//   // @data field=<what> store=device|d1|log purpose="..." retention="..." delete="..." [source=a.js,b.js] [match=<text>] [note="..."]
//
//   store=d1      field is `table.column` or `table.{col1,col2}`; every column read from the migrations
//                 must be named by exactly one annotation (the column list is explicit on purpose, so a
//                 column added later fails the drift check instead of being absorbed by a wildcard).
//   store=device  field is a browser storage key, `*` standing for generated parts (ewl_u*_l*_v2);
//                 `source` lists the files that really contain it.
//   store=log     field is a server log field; `source` lists the file that writes it and `match`
//                 is the text that must appear there.
//
// Annotations may sit in any tracked source file (next to the code that stores the data) or in
// shared/privacy/inventory-annotations/. `// @data-ignore pattern=<key> reason="..."` marks a string
// that looks like a storage key but is not one. The checks below are pure so the negative-control
// test drives the same code the gate runs.

const FIELD_ORDER = ["field", "store", "purpose", "retention", "delete"];
export const STORES = Object.freeze(["device", "d1", "log"]);
const PAIR = /(\w+)=(?:"([^"]*)"|(\S+))/g;

// An annotation is a comment whose first word is @data: `// @data ...`, `* @data ...`, `<!-- @data ...`.
// Prose that merely mentions the convention (like this file's header) does not start with it.
const ANNOTATION = /^\s*(?:\/\/+|\/?\*+|<!--)\s*@data(-ignore)?\s+(.*)$/;

export function parseAnnotationLine(line) {
  const m = ANNOTATION.exec(line);
  if (!m) return null;
  const attrs = {};
  for (const pair of m[2].matchAll(PAIR)) attrs[pair[1]] = pair[2] ?? pair[3];
  return { kind: m[1] ? "ignore" : "data", attrs };
}

/** Collect annotations from `{ path: text }`. Returns { data, ignores, errors }. */
export function collectAnnotations(files) {
  const data = [];
  const ignores = [];
  const errors = [];
  for (const [path, text] of Object.entries(files)) {
    if (!text.includes("@data")) continue;
    text.split("\n").forEach((line, i) => {
      const parsed = parseAnnotationLine(line);
      if (!parsed) return;
      const where = `${path}:${i + 1}`;
      if (parsed.kind === "ignore") {
        if (!parsed.attrs.pattern || (parsed.attrs.reason || "").length < 20)
          errors.push(`${where}: @data-ignore needs pattern= and a reason of 20+ characters`);
        else ignores.push({ ...parsed.attrs, where });
        return;
      }
      for (const key of FIELD_ORDER) {
        if (!parsed.attrs[key]) errors.push(`${where}: @data annotation is missing ${key}=`);
      }
      if (parsed.attrs.store && !STORES.includes(parsed.attrs.store))
        errors.push(`${where}: unknown store=${parsed.attrs.store}`);
      if (parsed.attrs.store && parsed.attrs.store !== "d1" && !parsed.attrs.source)
        errors.push(`${where}: store=${parsed.attrs.store} needs source=<file>`);
      if (parsed.attrs.store === "log" && !parsed.attrs.match)
        errors.push(`${where}: store=log needs match=<text that appears in the source>`);
      data.push({ ...parsed.attrs, where, path });
    });
  }
  return { data, ignores, errors };
}

/** `table.{a,b}` -> ["table.a", "table.b"]; `table.c` -> ["table.c"]. */
export function expandD1Field(field) {
  const m = /^([A-Za-z_]\w*)\.(?:\{([^}]+)\}|([A-Za-z_]\w*))$/.exec(field);
  if (!m) return null;
  return (m[2] ? m[2].split(",").map((c) => c.trim()) : [m[3]]).map((c) => `${m[1]}.${c}`);
}

const escapeRe = (s) => s.replace(/[.+?^${}()|[\]\\]/g, "\\$&");
export const globToRegExp = (glob) =>
  new RegExp(`^${glob.split("*").map(escapeRe).join("[A-Za-z0-9_.*-]*")}$`);

const KEY_RE = /(["'`])(ewl[_.](?:\$\{[^}]*\}|[A-Za-z0-9_.-])*)/g;

// A literal only counts as a storage key when its line says it is one. `ewl.lab.discount` style ids
// name activities, not storage; they are written beside `EWL.id(...)`, never beside a key or a store.
const STORAGE_LINE = /storage|getItem|setItem|removeItem|_KEY\b|\bKEY\b|STORE|PREFIX|prefix|\bkey\b|Key\b|SLOT|lsGet|lsSet/;

/** Normalised storage-key candidates in one file: `${..}` -> `*`, a trailing `_`/`.` -> `_*`/`.*`. */
export function deviceKeysIn(text) {
  const keys = new Set();
  if (!text.includes("ewl")) return keys;
  for (const line of text.split("\n")) {
    if (!line.includes("ewl") || /^\s*(\/\/|\*|\/\*)/.test(line) || !STORAGE_LINE.test(line)) continue;
    for (const m of line.matchAll(KEY_RE)) {
      let key = m[2].replace(/\$\{[^}]*\}/g, "*");
      if (/[_.]$/.test(key)) key += "*";
      keys.add(key);
    }
  }
  return keys;
}

/** Generated or non-source trees: never read, so an annotation or key there is not part of the contract. */
export const READ_SKIP =
  /^(lessons|math\/practice-studio|graphic-novels\/(axiom-city|unit\d+)|canvas-packages|reports|output|evidence|docs|db|tests?)\//;
/** Files whose string literals are not storage keys: tests, probes, and the annotations themselves. */
export const SCAN_SKIP =
  /^shared\/privacy\/inventory-annotations\/|\.test\.(m?js|cjs)$|(^|\/)(verify|validate)-[^/]*$/;

/**
 * @param files      { path: text } of every scanned source file
 * @param tables     Map from readMigrations
 * @param annotations result of collectAnnotations over `files`
 * @param readSource (path) => text or null, for `source=` checks
 */
export function checkInventory({ files, tables, annotations, readSource }) {
  const errors = [...annotations.errors];
  const d1 = annotations.data.filter((a) => a.store === "d1");
  const claimed = new Map();
  for (const a of d1) {
    const cols = expandD1Field(a.field);
    if (!cols) {
      errors.push(`${a.where}: store=d1 field must be table.column or table.{a,b}: ${a.field}`);
      continue;
    }
    for (const col of cols) {
      if (claimed.has(col)) errors.push(`${a.where}: ${col} is annotated twice (also ${claimed.get(col)})`);
      claimed.set(col, a.where);
    }
  }
  const real = new Set();
  for (const [table, { columns }] of tables) for (const c of columns) real.add(`${table}.${c}`);
  for (const col of [...real].sort())
    if (!claimed.has(col)) errors.push(`unannotated D1 column: ${col}`);
  for (const col of [...claimed.keys()].sort())
    if (!real.has(col)) errors.push(`${claimed.get(col)}: annotation names a column that does not exist: ${col}`);

  const devices = annotations.data.filter((a) => a.store === "device");
  const patterns = devices.map((a) => ({ a, re: globToRegExp(a.field) }));
  const ignored = annotations.ignores.map((i) => globToRegExp(i.pattern));
  const found = new Map();
  for (const [path, text] of Object.entries(files)) {
    if (READ_SKIP.test(path) || SCAN_SKIP.test(path)) continue;
    for (const key of deviceKeysIn(text)) {
      if (!found.has(key)) found.set(key, path);
    }
  }
  for (const [key, path] of [...found].sort()) {
    if (ignored.some((re) => re.test(key))) continue;
    if (!patterns.some((p) => p.re.test(key)))
      errors.push(`unannotated localStorage key: ${key} (first seen in ${path})`);
  }
  for (const a of annotations.data.filter((x) => x.store !== "d1")) {
    const needle = a.match || a.field.split("*")[0];
    for (const src of String(a.source || "").split(",").filter(Boolean)) {
      const text = readSource(src);
      if (text == null) errors.push(`${a.where}: source file does not exist: ${src}`);
      else if (!text.includes(needle)) errors.push(`${a.where}: ${src} no longer contains ${needle}`);
    }
  }
  const staleIgnore = annotations.ignores.filter(
    (i) => ![...found.keys()].some((k) => globToRegExp(i.pattern).test(k)),
  );
  for (const i of staleIgnore) errors.push(`${i.where}: @data-ignore matches nothing: ${i.pattern}`);
  return { errors, deviceKeysFound: found.size, d1Columns: real.size };
}

const cell = (v) => String(v ?? "").replace(/\|/g, "\\|").replace(/\n/g, " ");

export function renderMarkdown(annotations, tables) {
  const by = (store) => annotations.data.filter((a) => a.store === store);
  const row = (a, field) =>
    `| \`${cell(field)}\` | ${cell(a.purpose)}${a.note ? ` ${cell(a.note)}` : ""} | ${cell(a.retention)} | ${cell(a.delete)} |`;
  const out = [
    "<!-- GENERATED by `node tools/privacy-inventory.mjs --write` from @data annotations and the D1 migrations. Do not edit by hand. -->",
    "",
    "# Data inventory",
    "",
    "Every place this site stores data about a class or a student, generated from `@data` annotations",
    "(`shared/privacy/inventory-annotations/`) and the column lists in the D1 migrations. `--check` fails",
    "when this file is stale, when a migration column has no annotation, or when a browser storage key",
    "found in source has none. The rows say what each store holds today, including the places that hold a",
    "typed name; the never-collect list is checked separately by `tools/privacy-forbidden-scan.mjs`.",
    "",
    `D1 tables: ${tables.size}. Annotated D1 columns: ${[...tables.values()].reduce((n, t) => n + t.columns.length, 0)}. Device storage keys: ${by("device").length}. Log fields: ${by("log").length}.`,
    "",
    "## D1 (server)",
    "",
  ];
  const d1ByTable = new Map();
  for (const a of by("d1")) {
    const cols = expandD1Field(a.field) || [];
    for (const full of cols) {
      const [table, column] = full.split(".");
      if (!d1ByTable.has(table)) d1ByTable.set(table, []);
      d1ByTable.get(table).push({ a, column });
    }
  }
  for (const table of [...tables.keys()].sort()) {
    out.push(`### \`${table}\``, "", `Source: \`${tables.get(table).file}\``, "");
    out.push("| Columns | Purpose | Retention | Delete |", "| --- | --- | --- | --- |");
    const groups = new Map();
    for (const { a, column } of d1ByTable.get(table) || []) {
      if (!groups.has(a)) groups.set(a, []);
      groups.get(a).push(column);
    }
    for (const [a, cols] of groups) out.push(`${row(a, cols.join(", "))}`);
    out.push("");
  }
  for (const [title, store] of [
    ["Device storage (browser localStorage)", "device"],
    ["Server logs", "log"],
  ]) {
    out.push(`## ${title}`, "", "| Field | Purpose | Retention | Delete |", "| --- | --- | --- | --- |");
    for (const a of by(store).sort((x, y) => x.field.localeCompare(y.field))) out.push(row(a, a.field));
    out.push("");
  }
  return out.join("\n");
}
