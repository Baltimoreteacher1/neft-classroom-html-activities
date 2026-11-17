// Downloadable Speaking/Writing Studio tasks and the simulation mission handout, as model.js documents.
// Same rules as bank activities: nothing that answers the task reaches the student file. Studio tasks keep out the
// teacher block, the stage model answers and the turn `expects` tags; the mission handout keeps out the outcome
// conditions, what each piece of evidence supports or contradicts and its strength, option replies and effects,
// and every character's interview answers. Mission text is authored in English and Spanish ([en, es]); the
// handout shows the side(s) the learner's language mode asks for.
import { asList } from "../util.js";
import { labelsFor } from "./labels.js";
import { fileSlug, finish } from "./model.js";

const EN = "en";

function sourceBlocks(src, label) {
  const out = [];
  if (src.title) out.push({ t: "label", text: src.title, lang: EN });
  if (src.kind === "audio")
    out.push({
      t: "script",
      label,
      lang: EN,
      lines: asList(src.turns).map((x) => (x.speaker ? `${x.speaker}: ${x.text}` : x.text)),
    });
  if (src.text) out.push({ t: "passage", title: "", paras: asList(src.text), lang: EN });
  if (src.table)
    out.push({
      t: "table",
      caption: src.table.caption || "",
      headers: src.table.headers || null,
      rows: src.table.rows || [],
      lang: EN,
    });
  if (src.chart)
    out.push({
      t: "table",
      lang: EN,
      caption: [src.chart.title, src.chart.unit ? `(${src.chart.unit})` : ""]
        .filter(Boolean)
        .join(" "),
      headers: null,
      rows: (src.chart.data || []).map((d) => [d.label, String(d.value)]),
    });
  return out;
}

function helpOf(task, t) {
  const g = task.stages?.guided || {};
  const bank = [...new Set([...asList(g.bank), ...asList(task.stages?.supported?.bank)])];
  const out = [];
  if (asList(g.frames).length)
    out.push({ t: "label", text: t("frames") }, { t: "list", items: asList(g.frames), lang: EN });
  if (bank.length)
    out.push({ t: "label", text: t("wordBank") }, { t: "p", text: bank.join("  ·  "), lang: EN });
  if (asList(task.vocab).length)
    out.push(
      { t: "label", text: t("words") },
      { t: "list", lang: EN, items: task.vocab.map((v) => `${v.term}: ${v.def}`) },
    );
  return out.length ? [{ t: "help", title: t("help"), note: t("helpNote"), blocks: out }] : [];
}

/** A Speaking ("speaking-task") or Writing ("writing-task") Studio task as a student document. */
export function studioTaskDocument(task, kind, { lang = "en", url = "" } = {}) {
  if (!task?.id || !task.title)
    throw new Error("studioTaskDocument: a task with an id and a title is required");
  if (!["speaking-task", "writing-task"].includes(kind))
    throw new Error(`studioTaskDocument: unknown kind "${kind}"`);
  const lab = labelsFor(lang);
  const { t } = lab;
  const speaking = kind === "speaking-task";
  const blocks = [
    { t: "h", text: t("scenario") },
    { t: "p", text: task.scenario || "", lang: EN },
  ];
  const sources = speaking ? (task.stimulus ? [task.stimulus] : []) : asList(task.sources);
  if (sources.length) {
    blocks.push({ t: "h", text: t("sources") });
    for (const s of sources)
      blocks.push(...sourceBlocks(s, `${t("recording")} · ${t("readAloud")}`));
  }
  blocks.push(
    { t: "h", text: t("task") },
    { t: "p", text: task.prompt || "", lang: EN, strong: true },
  );
  const plan = asList(task.planner).length ? task.planner : asList(task.organizer);
  if (plan.length) {
    blocks.push({ t: "h", text: speaking ? t("planning") : t("organizer") });
    for (const p of plan)
      blocks.push(
        { t: "label", text: p.label, lang: EN },
        { t: "p", text: p.hint || "", lang: EN, em: true },
        { t: "lines", n: 2 },
      );
  }
  if (speaking) {
    for (const turn of asList(task.turns))
      blocks.push(
        { t: "label", text: `${t("conversation")} (${turn.partner || ""})` },
        { t: "p", text: turn.say, lang: EN },
        { t: "label", text: t("yourReply") },
        { t: "lines", n: 2 },
      );
    const [a, b] = asList(task.targetSeconds);
    if (a && b) blocks.push({ t: "p", text: t("speakTime", { a, b }), em: true });
    blocks.push({ t: "p", text: t("sayAloud"), em: true });
  } else {
    const ex = task.expected || {};
    blocks.push({ t: "h", text: t("yourAnswer") });
    if (ex.minWords && ex.maxWords)
      blocks.push({ t: "p", text: t("wordsRange", { a: ex.minWords, b: ex.maxWords }), em: true });
    blocks.push({
      t: "lines",
      n: Math.min(24, Math.max(10, Math.round((ex.maxWords || 120) / 10))),
    });
  }
  if (asList(task.successCriteria).length)
    blocks.push(
      { t: "h", text: t("checkWork") },
      { t: "list", box: "☐", items: task.successCriteria, lang: EN },
    );
  if (!speaking && asList(task.revisionPrompts).length)
    blocks.push(
      { t: "h", text: t("revise") },
      { t: "list", items: task.revisionPrompts.map((r) => r.prompt), lang: EN },
    );
  blocks.push(...helpOf(task, t));
  return finish(lab, {
    title: task.title,
    meta: [task.contentArea, task.keyUse, task.time].filter(Boolean).join(" · "),
    url,
    blocks,
    lang,
    slug: fileSlug(task.title),
  });
}

/** One side or both of an authored [en, es] pair, for the learner's mode. */
const side = (lang) => (pair) => {
  const [en, es] = Array.isArray(pair) ? pair : [pair, ""];
  if (lang === "es" && es) return es;
  if (lang === "bi" && es && es !== en) return `${en} / ${es}`;
  return en || "";
};

/** The simulation mission handout: map, people, evidence, explanations and the tasks with answer lines. */
export function simulationDocument(def, { lang = "en", url = "" } = {}) {
  if (!def?.id || !def.title)
    throw new Error("simulationDocument: a mission with an id and a title is required");
  const lab = labelsFor(lang);
  const { t } = lab;
  const pick = side(lang);
  const cLang = lang === "es" ? "es" : EN;
  const sceneTitle = new Map(asList(def.scenes).map((s) => [s.id, pick(s.title)]));
  const blocks = [{ t: "p", text: pick(def.summary), lang: cLang, strong: true }];
  blocks.push(
    { t: "h", text: t("places") },
    {
      t: "table",
      lang: cLang,
      caption: "",
      headers: null,
      rows: asList(def.scenes).map((s) => [pick(s.title), pick(s.description)]),
    },
  );
  blocks.push({ t: "h", text: t("people") });
  blocks.push({
    t: "table",
    lang: cLang,
    caption: "",
    headers: null,
    rows: asList(def.characters).map((c) => [
      `${c.name} · ${pick(c.role)}`,
      sceneTitle.get(c.scene) || "",
      `${t("wants")}: ${pick(c.wants)}`,
    ]),
  });
  blocks.push({ t: "h", text: t("evidence") });
  for (const e of asList(def.evidence))
    blocks.push(
      { t: "label", text: `${pick(e.title)} (${t(`kind.${e.kind}`)})`, lang: cLang },
      { t: "p", text: pick(e.body), lang: cLang },
      { t: "lines", n: 1 },
    );
  if (asList(def.explanations).length)
    blocks.push(
      { t: "h", text: t("explanations") },
      { t: "list", lang: cLang, items: def.explanations.map((x) => pick(x.label)) },
    );
  blocks.push({ t: "h", text: t("tasks") });
  const evTitle = new Map(asList(def.evidence).map((e) => [e.id, pick(e.title)]));
  asList(def.tasks).forEach((task, i) => {
    blocks.push(
      { t: "label", text: `${i + 1}. ${sceneTitle.get(task.scene) || ""}` },
      { t: "p", text: pick(task.prompt), lang: cLang, strong: true },
    );
    if (task.type === "decide") {
      blocks.push({ t: "p", text: t("decideHow"), em: true });
      blocks.push(
        {
          t: "choices",
          lang: cLang,
          items: asList(task.options).map((o, j) => ({
            mark: "○",
            letter: String.fromCharCode(65 + j),
            text: pick(o.label),
            visual: "",
          })),
        },
        { t: "lines", n: 2 },
      );
    } else if (task.type === "compare") {
      blocks.push({ t: "p", text: t("compareHow"), em: true });
      blocks.push(
        {
          t: "list",
          lang: cLang,
          items: asList(task.pairs).map((p) => p.map((id) => evTitle.get(id) || id).join("  ↔  ")),
        },
        { t: "lines", n: 3 },
      );
    } else {
      if (task.type === "speak") blocks.push({ t: "p", text: t("speakHow"), em: true });
      if (task.minWords)
        blocks.push({ t: "p", text: t("minWords", { n: task.minWords }), em: true });
      blocks.push({ t: "lines", n: task.type === "speak" ? 4 : 7 });
      const help = [];
      if (asList(task.frames).length)
        help.push(
          { t: "label", text: t("frames") },
          { t: "list", lang: EN, items: task.frames.map((f) => (Array.isArray(f) ? f[0] : f)) },
        );
      if (asList(task.bank).length)
        help.push(
          { t: "label", text: t("wordBank") },
          { t: "p", text: task.bank.join("  ·  "), lang: EN },
        );
      if (help.length)
        blocks.push({ t: "help", title: t("help"), note: t("helpNote"), blocks: help });
    }
  });
  if (asList(def.vocabulary).length)
    blocks.push(
      { t: "h", text: t("words") },
      { t: "list", lang: cLang, items: def.vocabulary.map((v) => `${v.term}: ${pick(v.meaning)}`) },
    );
  return finish(lab, {
    title: pick(def.title),
    meta: t("mission"),
    url,
    blocks,
    lang,
    slug: fileSlug(side("en")(def.title)),
  });
}
