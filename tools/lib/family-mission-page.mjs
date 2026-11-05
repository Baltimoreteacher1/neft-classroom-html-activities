// Reads one GENERATED family-practice page (lessons/<id>/homework.html) into a plain model.
// It never runs the page generator: it reads the HTML that ships, plus the sidecar and config
// that feed it. Used by scripts/build-family-mission-inventory.mjs and
// tools/validate-family-mission-content.mjs.
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { lessonPath, listLessonDirs, REPO_ROOT } from "./curriculum-source.mjs";
import { closest, decode, find, findAll, hasClass, parseHtml, textOf } from "./mini-dom.mjs";

const NOTES_DIR = join(REPO_ROOT, "data", "family-homework-notes");
const norm = (s) =>
  String(s ?? "")
    .replace(/\s+/g, " ")
    .trim();
const readJson = (p) => JSON.parse(readFileSync(p, "utf8"));
const cls = (c) => (el) => hasClass(el, c);

/** Family pages: every lessons/<id>/homework.html except generated group/catch-up variants. */
export function familyPageIds() {
  return listLessonDirs()
    .filter((d) => !/-group\d|-catch/.test(d))
    .filter((d) => existsSync(lessonPath(d, "homework.html")))
    .sort((a, b) => a.localeCompare(b, "en", { numeric: true }));
}

/** "4-1-part2" -> { baseId: "4-1", session: 2 }.  A base page is Session 1. */
export function splitId(id) {
  const m = /^(.*?)-part(\d+)$/.exec(id);
  return m ? { baseId: m[1], session: Number(m[2]) } : { baseId: id, session: 1 };
}

export function readSidecar(id) {
  const f = join(NOTES_DIR, `${id}.json`);
  return existsSync(f) ? readJson(f) : null;
}

export function readConfig(id) {
  const f = lessonPath(id, "config.json");
  return existsSync(f) ? readJson(f) : null;
}

/** English text of an element: everything except the Spanish spans. */
export const enText = (el) => textOf(el, cls("lang-es"));
/** Spanish text of an element: everything except the English spans. */
export const esText = (el) => textOf(el, cls("lang-en"));

const jsonAttr = (el, name) => {
  try {
    return JSON.parse(el?.attrs[name] || "[]");
  } catch {
    return [];
  }
};

function parseProblem(sec) {
  const tierEl = closest(sec, (n) => hasClass(n, "practice-tier"));
  let tier = "core";
  if (closest(sec, cls("more-practice"))) tier = "more";
  else if (tierEl) tier = (/practice-tier-(\w+)/.exec(tierEl.attrs.class) || [])[1] || "core";
  const stem = find(sec, cls("problem-stem"));
  const opts = find(sec, cls("mc-options"));
  const choices = opts
    ? findAll(opts, (l) => l.tag === "label" && hasClass(l, "mc-option-label")).map((l) => {
        const t = find(l, cls("choice-text")) || l;
        return {
          value: Number(find(l, (n) => n.tag === "input")?.attrs.value),
          en: enText(t),
          es: esText(t),
        };
      })
    : [];
  const coach = findAll(sec, cls("coach-step-help")).map((h) => ({ en: enText(h), es: esText(h) }));
  const keyNote = find(sec, cls("hw-answer-key-note"));
  const get = (n) => opts?.attrs[n] || "";
  return {
    id: sec.attrs.id,
    index: Number(sec.attrs.id.replace("problem_", "")),
    tier,
    type: sec.attrs["data-problem-type"],
    topic: sec.attrs["data-topic"],
    stemEn: stem ? enText(stem) : "",
    stemEs: stem ? esText(stem) : "",
    choices,
    correctValue: opts ? Number(get("data-correct")) : null,
    explanationEn: get("data-explanation"),
    explanationEs: get("data-explanation-es"),
    feedbackEn: jsonAttr(opts, "data-choice-feedback"),
    feedbackEs: jsonAttr(opts, "data-choice-feedback-es"),
    coach,
    keyEn: keyNote ? enText(keyNote) : "",
    keyEs: keyNote ? esText(keyNote) : "",
  };
}

/** Landmarks whose text is checked as one unit. */
const LANDMARKS = [
  [cls("hw-dinner-visual-body"), "dinnerVisual"],
  [cls("hw-dinner-talk"), "dinnerTalk"],
  [cls("hw-foundation-bridge"), "foundationBridge"],
  [cls("rf-visual-summary"), "reviewVisual"],
  [(n) => n.attrs.id === "hw_case", "caseFile"],
  [cls("fam-act-corner"), "familyCorner"],
  [cls("family-talk"), "familyConversation"],
  [cls("vocab-container"), "vocabulary"],
  [cls("hw-teach"), "teachIt"],
  [cls("homework-optional-extras"), "optionalExtras"],
];

const FAMGAMES = /window\.__HW_FAMGAMES__\s*=\s*(\{[\s\S]*?\});/;

function gameUnits(root) {
  const out = [];
  for (const s of findAll(root, (n) => n.tag === "script" && n.raw)) {
    const m = FAMGAMES.exec(s.raw);
    if (!m) continue;
    try {
      const g = JSON.parse(m[1]);
      for (const p of g.pairs || [])
        out.push({ field: "game.pair", en: `${p.a} ${p.b}`, es: `${p.aEs} ${p.bEs}` });
      for (const t of g.tf || [])
        out.push({
          field: "game.trueFalse",
          en: `${t.en} ${t.whyEn || ""}`,
          es: `${t.es} ${t.whyEs || ""}`,
        });
      for (const [key, rows] of Object.entries(g)) {
        if (key === "pairs" || key === "tf" || !Array.isArray(rows)) continue;
        for (const row of rows) {
          const en = Object.entries(row)
            .filter(([k, v]) => /en$/i.test(k) && typeof v === "string")
            .map(([, v]) => v);
          if (en.length) out.push({ field: `game.${key}`, en: en.join(" "), es: "" });
        }
      }
    } catch {
      /* an unparseable blob is not this gate's finding; the page tests own game wiring */
    }
  }
  for (const el of findAll(root, (n) => n.attrs["data-rounds"])) {
    for (const r of jsonAttr(el, "data-rounds")) {
      const choices = (r.choices || []).map((c) => c.text).join(" ");
      out.push({ field: "game.round", en: `${r.q || ""} ${choices} ${r.hint || ""}`, es: "" });
    }
  }
  return out;
}

/** Visible-text units (EN + ES) the contamination and bilingual checks read. */
function textUnits(root, problems) {
  const units = [];
  const seen = new Set();
  const add = (field, en, es) => {
    const key = `${field}|${en}`;
    if (!en || seen.has(key)) return;
    seen.add(key);
    units.push({ field, en, es });
  };
  for (const p of problems) {
    const f = `problem ${p.index + 1} (${p.tier})`;
    add(`${f} stem`, p.stemEn, p.stemEs);
    add(`${f} explanation`, norm(p.explanationEn), norm(p.explanationEs));
    p.feedbackEn.forEach((t, i) => add(`${f} feedback ${i}`, norm(t), norm(p.feedbackEs[i])));
    p.coach.forEach((c, i) => add(`${f} coach ${i + 1}`, c.en, c.es));
    add(`${f} answer note`, p.keyEn, p.keyEs);
  }
  for (const [match, label] of LANDMARKS) {
    for (const el of findAll(root, match)) {
      if (closest(el, cls("problem-section"))) continue;
      add(label, enText(el), esText(el));
    }
  }
  for (const panel of findAll(root, (n) => n.attrs["data-tab-panel"] === "learn")) {
    for (const card of findAll(panel, cls("learn-card"))) {
      if (LANDMARKS.some(([m]) => m(card) || find(card, m))) continue;
      const head = textOf(
        find(card, (n) => n.tag === "h2" || n.tag === "h3") || card,
        cls("lang-es"),
      );
      add(`learn card "${head.slice(0, 40)}"`, enText(card), esText(card));
    }
  }
  for (const u of gameUnits(root)) add(u.field, norm(u.en), norm(u.es));
  return units;
}

const ROUTE_RE = /one example and (\d+) problems?/i;

function routeInfo(root) {
  const buttons = findAll(root, (n) => n.tag === "button" && n.attrs["data-route-mode"]).map(
    (b) => ({
      mode: b.attrs["data-route-mode"],
      text: enText(b),
      active: hasClass(b, "is-active"),
    }),
  );
  const quick = buttons.find((b) => b.mode === "quick");
  const claimed = quick ? ROUTE_RE.exec(quick.text) : null;
  /* The mission page has no route cards: its start card says "solve N" and the practice card
     "Today's practice: N problems", and the default route is the mission. */
  const start = find(root, (n) => hasClass(n, "hw-mission-start"));
  const missionClaim = start ? /solve (\d+)/.exec(enText(start)) : null;
  const nums = (attr) =>
    findAll(root, (n) => n.attrs[attr] !== undefined).map((e) => Number(textOf(e)));
  const more = find(root, (n) => n.attrs["data-hw-quick-more-count"] !== undefined);
  return {
    buttons,
    defaultMode: buttons.find((b) => b.active)?.mode || (start ? "quick" : null),
    quickClaim: claimed ? Number(claimed[1]) : missionClaim ? Number(missionClaim[1]) : null,
    goalCounts: nums("data-hw-goal-count"),
    availCounts: nums("data-hw-goal-avail"),
    optionalMore: more ? Number(textOf(more)) || 0 : 0,
  };
}

const LINK_TAGS = new Set(["a", "link", "script", "img", "source", "iframe"]);

function linkRefs(root) {
  const refs = [];
  for (const el of findAll(root, (n) => LINK_TAGS.has(n.tag))) {
    const href = el.attrs.href ?? el.attrs.src;
    if (!href || href.startsWith("#") || /^(mailto:|tel:|data:|javascript:|sms:)/i.test(href))
      continue;
    refs.push({ href: decode(href), tag: el.tag, text: textOf(el).slice(0, 60) });
  }
  return refs;
}

/** Sibling `.lang-en` / `.lang-es` pairs: the unit every bilingual rule is built on. */
function langPairs(root) {
  const pairs = [];
  for (const en of findAll(root, cls("lang-en"))) {
    const sibs = en.parent.children.filter((c) => c.tag);
    const next = sibs[sibs.indexOf(en) + 1];
    const paired = Boolean(next && hasClass(next, "lang-es"));
    pairs.push({ en: textOf(en), es: paired ? textOf(next) : null, paired });
  }
  return pairs;
}

/** data-aria-en / data-aria-es style attribute pairs. */
function attrPairs(root) {
  const out = [];
  for (const el of findAll(root, (n) => Object.keys(n.attrs).some((k) => /-en$/.test(k)))) {
    for (const k of Object.keys(el.attrs)) {
      if (!/-en$/.test(k) || !k.startsWith("data-")) continue;
      out.push({ attr: k, en: el.attrs[k], es: el.attrs[k.replace(/-en$/, "-es")] ?? null });
    }
  }
  return out;
}

/** Whole-page model from the page's HTML. */
export function parsePage(id, html) {
  const root = parseHtml(html);
  const problems = findAll(root, (n) => n.tag === "section" && hasClass(n, "problem-section")).map(
    parseProblem,
  );
  const h1 = find(root, (n) => n.tag === "h1");
  return {
    id,
    html,
    title: h1 ? enText(h1) : "",
    topic: problems[0]?.topic || null,
    problems,
    units: textUnits(root, problems),
    route: routeInfo(root),
    links: linkRefs(root),
    langPairs: langPairs(root),
    attrPairs: attrPairs(root),
  };
}

export function loadPage(id) {
  return parsePage(id, readFileSync(lessonPath(id, "homework.html"), "utf8"));
}
