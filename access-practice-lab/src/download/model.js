// Downloadable activity: one neutral document model that both writers (Word: docx.js, print/PDF: print.js) draw.
// activityDocument(record, { band, domain, level, lang, url }) turns one bank activity into blocks:
//   { t: "h", text } · { t: "p", text, lang?, em? } · { t: "label", text } · { t: "script", label, lines, lang }
//   { t: "passage", title, paras, lang } · { t: "picture", alt, src?, scene? } · { t: "list", items, box?, lang? }
//   { t: "choices", items: [{ mark, text, visual }], lang } · { t: "lines", n } · { t: "table", caption, headers, rows }
//   { t: "help", title, note, blocks } · { t: "link", label, url } · { t: "honest", text }
// Rules it keeps:
//   - NO ANSWERS. The student document is built only from what a learner sees before answering: no answer ids, no
//     correct/feedback text, no model answers, no answer keys, no trackers. Order items start in the same shuffled
//     order as online (items.js initialOrder), never the solved order. The answer key is a separate, teacher-only
//     module (answer-key.js) that only the gated Teacher Hub imports.
//   - Interface text follows the learner's language mode; activity content keeps its authored language (lang "en").
//   - Listening scripts, the Model-Test teacher statement and, in audio-first bands (K, 1, 2-3), the directions and
//     question are labelled "for the adult to read aloud".
//   - Frames, word bank, vocabulary and hints are grouped as optional help, never mixed into the task.
import { BAND_INFO, bandLabel, bandLabelEs } from "../bands.js";
import { sceneAlt } from "../early/scenes.js";
import { initialOrder } from "../items.js";
import { taskCriteria } from "../learning.js";
import { asList, DOMAIN_META, TIERS } from "../util.js";
import { labelsFor } from "./labels.js";

const EN = "en";
const LETTER = (i) => String.fromCharCode(65 + i);
const PAPER_LINES = { A: 3, B: 5, C: 8 };

/** File-name-safe slug of a title. */
export const fileSlug = (s) =>
  String(s || "activity")
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60) || "activity";

const tierOf = (level) => TIERS[String(level || "").slice(-1)] || null;

/** "Grades 6–8 · Listening · Support: Starting" in the interface language. */
function metaLine(t, S, band, domain, level, skill) {
  const meta = DOMAIN_META[domain] || { name: domain, es: domain };
  const tier = tierOf(level);
  return [
    S(bandLabel(band), bandLabelEs(band)),
    S(meta.name, meta.es),
    tier ? `${t("support")}: ${S(tier.name, tier.es)}` : "",
    skill || "",
  ]
    .filter(Boolean)
    .join(" · ");
}

function pictureBlocks(a, t) {
  const altLabel = t("picture");
  const out = asList(a.picture).map((p) => ({ t: "picture", altLabel, alt: p.alt || "", src: p.src || "" }));
  if (a.scene) out.unshift({ t: "picture", altLabel, alt: sceneAlt(a.scene)?.[0] || "", scene: a.scene });
  return out;
}

function dataBlocks(a) {
  const out = [];
  if (a.table)
    out.push({
      t: "table",
      caption: a.table.caption || "",
      headers: a.table.headers || null,
      rows: a.table.rows || [],
    });
  if (a.chart)
    out.push({
      t: "table",
      caption: [a.chart.title, a.chart.unit ? `(${a.chart.unit})` : ""].filter(Boolean).join(" "),
      headers: null,
      rows: (a.chart.data || []).map((d) => [d.label, String(d.value)]),
    });
  return out;
}

/** The answer area for each item type, from the learner's side only. */
function responseBlocks(a, t, level, domain) {
  const opts = a.options || [];
  switch (a.type) {
    case "multipleChoice":
      return [
        { t: "label", text: t("chooseOne") },
        {
          t: "choices",
          lang: EN,
          items: opts.map((o, i) => ({
            mark: "○",
            letter: LETTER(i),
            text: o.text,
            visual: o.visual || "",
            picture: o.picture || null,
          })),
        },
      ];
    case "multiSelect":
      return [
        { t: "label", text: t("chooseAll") },
        {
          t: "choices",
          lang: EN,
          items: opts.map((o, i) => ({
            mark: "☐",
            letter: LETTER(i),
            text: o.text,
            visual: o.visual || "",
            picture: o.picture || null,
          })),
        },
      ];
    case "sort": {
      const cats = (a.categories || []).map((c) => (typeof c === "string" ? c : c.label || c.id));
      return [
        { t: "label", text: t("sortHow") },
        {
          t: "table",
          caption: "",
          headers: null,
          lang: EN,
          rows: (a.items || []).map((it) => [it.text, cats.join("   ·   ")]),
        },
      ];
    }
    case "order": {
      const byId = new Map((a.items || []).map((it) => [it.id, it]));
      return [
        { t: "label", text: t("orderHow") },
        {
          t: "list",
          lang: EN,
          box: "____",
          items: initialOrder(a).map((id) =>
            [byId.get(id)?.visual, byId.get(id)?.text].filter(Boolean).join(" "),
          ),
        },
      ];
    }
    case "cloze": {
      let n = 0;
      const choices = [];
      const sentence = (a.segments || [])
        .map((s) => {
          if (!s.blank) return s.text;
          n++;
          choices.push(`${t("choicesFor")} ${n}: ${(s.blank.options || []).join("  ·  ")}`);
          return `(${n}) ________`;
        })
        .join("");
      return [
        { t: "label", text: t("clozeHow") },
        { t: "p", text: sentence, lang: EN },
        { t: "list", items: choices, lang: EN },
      ];
    }
    case "hotText":
      return [
        { t: "label", text: t("hotHow") },
        { t: "list", lang: EN, box: "☐", items: (a.sentences || []).map((s) => s.text) },
      ];
    case "worksheet":
      return (a.sheet || []).flatMap((part) => {
        const items = asList(part.items);
        const writes = items.some((x) => /_{3,}|☐|\[draw/.test(x));
        return [
          { t: "h", text: part.heading, lang: EN },
          { t: "list", items, lang: EN },
          ...(writes ? [] : [{ t: "lines", n: 3 }]),
        ];
      });
    case "constructed": {
      const speaking = domain === "Speaking";
      const n = a.paperLines || (speaking ? 3 : PAPER_LINES[String(level).slice(-1)] || 5);
      return [
        {
          t: "label",
          text: speaking ? t("planning") : a.responseLabel || t("yourAnswer"),
          lang: a.responseLabel && !speaking ? EN : undefined,
        },
        { t: "lines", n },
        ...(speaking ? [{ t: "p", text: t("sayAloud"), em: true }] : []),
      ];
    }
    default:
      return [{ t: "lines", n: 4 }];
  }
}

function checklist(a) {
  if (!["constructed", "worksheet"].includes(a.type)) return asList(a.selfCheck);
  const own = asList(a.selfCheck).length
    ? asList(a.selfCheck)
    : asList(a.sayFor).length
      ? asList(a.sayFor)
      : asList(a.writeFor);
  return own.length ? own : taskCriteria(a);
}

function helpBlocks(a, t) {
  const out = [];
  if (asList(a.frames).length)
    out.push({ t: "label", text: t("frames") }, { t: "list", items: asList(a.frames), lang: EN });
  if (asList(a.wordBank).length)
    out.push(
      { t: "label", text: t("wordBank") },
      { t: "p", text: asList(a.wordBank).join("  ·  "), lang: EN },
    );
  if (asList(a.vocabulary).length)
    out.push(
      { t: "label", text: t("words") },
      {
        t: "list",
        lang: EN,
        items: a.vocabulary.map((v) => (Array.isArray(v) ? `${v[0]}: ${v[1] || ""}` : String(v))),
      },
    );
  if (asList(a.listenFor).length)
    out.push(
      { t: "label", text: t("listenFor") },
      { t: "list", items: asList(a.listenFor), lang: EN },
    );
  if (asList(a.readFor).length)
    out.push({ t: "label", text: t("readFor") }, { t: "list", items: asList(a.readFor), lang: EN });
  if (a.hint) out.push({ t: "label", text: t("hint") }, { t: "p", text: a.hint, lang: EN });
  return out;
}

/**
 * The student document for one bank activity. `url` is the online activity (shown as a link, and a QR in print).
 * `esDirections` (optional) is the Spanish directions line from content/es-guide.json.
 */
export function activityDocument(
  a,
  { band, domain, level, lang = "en", url = "", esDirections = "" } = {},
) {
  if (!a?.id || !a.title)
    throw new Error("activityDocument: an activity with an id and a title is required");
  const { t, S } = labelsFor(lang);
  const listening = domain === "Listening" || Boolean(a.listening);
  const audioFirst = Boolean(BAND_INFO[band]?.audioFirst);
  const blocks = [];
  if (audioFirst) blocks.push({ t: "note", text: t("audioFirst") });
  blocks.push({ t: "h", text: t("directions") }, { t: "p", text: a.directions || "", lang: EN });
  const es = lang !== "en" ? a.directionsEs || esDirections : "";
  if (es) blocks.push({ t: "p", text: es, lang: "es", em: true });
  blocks.push(...pictureBlocks(a, t));
  const script = asList(a.adminScript).length
    ? asList(a.adminScript)
    : listening
      ? asList(a.script)
      : [];
  if (script.length)
    blocks.push({
      t: "script",
      label: `${t("listenScript")} · ${t("readAloud")}`,
      lines: script,
      lang: EN,
    });
  if (!listening && asList(a.passage).length)
    blocks.push({
      t: "passage",
      title: a.passageTitle || t("read"),
      paras: asList(a.passage),
      lang: EN,
    });
  blocks.push(...dataBlocks(a));
  if (a.prompt)
    blocks.push(
      { t: "h", text: t("question") },
      { t: "p", text: a.prompt, lang: EN, strong: true },
    );
  blocks.push(...responseBlocks(a, t, level, domain));
  const checks = checklist(a);
  if (checks.length)
    blocks.push(
      { t: "h", text: domain === "Speaking" ? t("include") : t("checkWork") },
      { t: "list", box: "☐", items: checks, lang: EN },
    );
  const help = helpBlocks(a, t);
  if (help.length) blocks.push({ t: "help", title: t("help"), note: t("helpNote"), blocks: help });
  return finish(
    { t, S },
    {
      title: a.title,
      meta: metaLine(t, S, band, domain, level, a.skill),
      url,
      blocks,
      lang,
      slug: fileSlug(a.title),
    },
  );
}

/** Shared tail: the source link and the honest note; the writers add the name/date line and the QR. */
export function finish({ t }, doc) {
  const blocks = [...doc.blocks];
  if (doc.url) blocks.push({ t: "link", label: t("online"), url: doc.url });
  blocks.push({ t: "honest", text: t("honest") });
  return { ...doc, labels: { name: t("name"), date: t("date"), scan: t("scan") }, blocks };
}

/** Every piece of authored text in a document (for tests and search): titles, paragraphs, list items, cells. */
export function documentText(doc) {
  const out = [doc.title, doc.meta];
  const walk = (bs) => {
    for (const b of bs) {
      if (b.text) out.push(b.text);
      if (b.title) out.push(b.title);
      if (b.label) out.push(b.label);
      if (b.caption) out.push(b.caption);
      if (b.alt) out.push(b.alt);
      for (const x of b.lines || []) out.push(x);
      for (const x of b.paras || []) out.push(x);
      for (const x of b.items || [])
        out.push(typeof x === "string" ? x : `${x.visual || ""} ${x.text}`);
      for (const r of [b.headers || [], ...(b.rows || [])]) out.push(...r);
      if (b.blocks) walk(b.blocks);
    }
  };
  walk(doc.blocks);
  return out.filter(Boolean).join("\n");
}
