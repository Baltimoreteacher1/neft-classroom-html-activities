// Panels of the lesson view: vocabulary, differentiate (scaffold slider), activities, printables, language connection,
// teach-it-three-ways, and the all-resources drawer. Each takes the lesson context and returns a Node.
import { announce, h } from "../core/dom.js";
import { FUNCTIONS } from "../core/lens-wordlists.js";
import { analyzeLanguage, analyzeLesson } from "../core/lens.js";
import { scaffoldFor, scaffoldSlider } from "../core/scaffold.js";
import { speak } from "../core/speech.js";
import { ENGINES, TIERS, TIER_IDS } from "../data/taxonomy.js";
import { btn, chip, copyWithNotice, kvList, section, ul, visualBox } from "./lens-ui.js";

const ENGINE_LABEL = Object.fromEntries(ENGINES.map((e) => [e.id, e.label]));
const PRINT_LABEL = {
  organizer: "Graphic organizer",
  "task-cards": "Task cards",
  "exit-ticket": "Exit ticket",
  "vocab-mat": "Vocabulary mat",
};
const humanize = (s) =>
  String(s)
    .replace(/[-_]+/g, " ")
    .replace(/^./, (c) => c.toUpperCase());
const tierShort = Object.fromEntries(TIERS.map((t) => [t.id, t.short]));

export function vocabPanel(ctx) {
  const { pack, vocab } = ctx;
  const entries =
    vocab?.entries?.filter((e) => !pack.vocab?.ids?.length || pack.vocab.ids.includes(e.id)) ||
    pack.vocab?.entries ||
    [];
  const wrap = section("Visual vocabulary");
  if (!entries.length) {
    wrap.append(
      h(
        "p",
        { class: "st-ll-muted" },
        ctx.vocabError || "This lesson has no vocabulary collection attached.",
      ),
    );
    return wrap;
  }
  if (pack.vocab?.collection) {
    wrap.append(
      h(
        "p",
        {},
        h(
          "a",
          {
            class: "st-ll-link",
            href: `#/vocab/${encodeURIComponent(pack.vocab.collection)}/wall`,
          },
          "Open the full vocabulary wall",
        ),
        "  ",
        h(
          "a",
          { class: "st-ll-link", href: `#/vocab/${encodeURIComponent(pack.vocab.collection)}` },
          "Open the collection",
        ),
      ),
    );
  }
  wrap.append(
    h(
      "div",
      { class: "st-ll-wall" },
      entries.map((e) =>
        h(
          "article",
          { class: "st-ll-vcard", "data-tier": e.tier || "" },
          e.visual
            ? visualBox(e.visual)
            : h(
                "p",
                { class: "st-ll-muted" },
                e.noVisualReason ? `No picture: ${e.noVisualReason}.` : "No picture yet.",
              ),
          h("h3", { class: "st-ll-word" }, e.word),
          e.pron
            ? h("p", { class: "st-ll-muted" }, `${e.pos ? `${e.pos}, ` : ""}say it: ${e.pron}`)
            : null,
          h("p", {}, e.def),
          e.context ? h("p", { class: "st-ll-muted" }, `In a sentence: ${e.context}`) : null,
          e.es
            ? h(
                "p",
                {},
                `Spanish: ${e.es.word}`,
                " ",
                e.es.verified ? null : chip("needs review", { tone: "review" }),
              )
            : null,
          btn("Hear the word", () => speak(e.word), { small: true, title: `Hear ${e.word}` }),
        ),
      ),
    ),
  );
  return wrap;
}

export function threeWaysPanel(ctx) {
  const t = ctx.pack.threeWays;
  const wrap = section("Teach it three ways");
  if (!t)
    return (
      wrap.appendChild(h("p", { class: "st-ll-muted" }, "This lesson has no three-ways plan.")) &&
      wrap
    );
  wrap.append(
    h(
      "p",
      { class: "st-ll-muted" },
      "The same idea, reached three ways: look at it, talk about it, then use it. The learning target is the same in all three.",
    ),
    h(
      "div",
      { class: "st-ll-three" },
      h(
        "section",
        {},
        h("h3", {}, `See: ${t.see?.title || ""}`),
        t.see?.visualOrModel ? visualBox(t.see.visualOrModel) : null,
      ),
      h(
        "section",
        {},
        h("h3", {}, `Discuss: ${t.discuss?.title || ""}`),
        h("p", {}, t.discuss?.structure || ""),
        t.discuss?.frames?.length ? ul(t.discuss.frames) : null,
      ),
      h(
        "section",
        {},
        h("h3", {}, `Apply: ${t.apply?.title || ""}`),
        h("p", {}, t.apply?.task || ""),
        t.apply?.successCriteria?.length
          ? h("div", {}, h("h4", {}, "Success criteria"), ul(t.apply.successCriteria))
          : null,
      ),
    ),
  );
  if (ctx.state.teacher && t.see?.teacherNote)
    wrap.append(
      h(
        "div",
        { class: "st-ll-teacher" },
        h("h4", {}, "Teacher view: note on the See step"),
        h("p", {}, t.see.teacherNote),
      ),
    );
  return wrap;
}

export function differentiatePanel(ctx) {
  const { pack, state } = ctx;
  const items = pack.guided || [];
  const wrap = section("Differentiate with the Scaffold Slider");
  wrap.append(
    h(
      "p",
      { class: "st-ll-muted" },
      "Each language domain has its own slider. Moving one changes how students get to the task. It never changes the learning target, the question, or the answer.",
    ),
  );
  if (!items.length)
    return wrap.appendChild(h("p", {}, "This lesson has no guided items to preview.")) && wrap;
  const select = h(
    "select",
    { id: "st-ll-itempick", class: "st-ll-input" },
    items.map((it, i) =>
      h(
        "option",
        { value: String(i) },
        `Guided item ${i + 1}: ${it.prompt.slice(0, 70)}${it.prompt.length > 70 ? "..." : ""}`,
      ),
    ),
  );
  select.value = String(state.guidedIndex);
  const recommend = ctx.recommendation;
  const slider = scaffoldSlider({
    tiers: state.tiers,
    item: items[state.guidedIndex],
    target: pack.contentObjective,
    recommend,
    onChange: (tiers) => {
      state.tiers = tiers;
    },
  });
  select.addEventListener("change", () => {
    state.guidedIndex = Number(select.value);
    slider.setItem(items[state.guidedIndex]);
  });
  const classBox = ctx.classes?.length
    ? h(
        "div",
        { class: "st-ll-row" },
        h("label", { for: "st-ll-classpick" }, "Start from a class"),
        h(
          "select",
          {
            id: "st-ll-classpick",
            class: "st-ll-input",
            onchange: (e) => ctx.pickClass(e.target.value, slider),
          },
          [
            h("option", { value: "" }, "No class chosen"),
            ...ctx.classes.map((c) =>
              h("option", { value: c.id, selected: c.id === state.classId }, c.nickname),
            ),
          ],
        ),
      )
    : null;
  wrap.append(
    classBox,
    h("label", { for: "st-ll-itempick" }, "Preview with this guided item"),
    select,
    slider.el,
  );
  if (recommend) wrap.append(h("p", { class: "st-ll-muted" }, recommend.rationale));
  wrap.append(
    h(
      "p",
      { class: "st-ll-muted" },
      "Guided practice and the language connection use these settings.",
    ),
  );
  return wrap;
}

export function supportsFor(item, tiers) {
  const s = scaffoldFor(item, tiers);
  const nodes = [];
  const f = s.byId;
  if (f.directions.content.text)
    nodes.push(
      h("p", { class: "st-ll-muted" }, h("strong", {}, "Directions: "), f.directions.content.text),
    );
  if (f.oral.content.text)
    nodes.push(h("p", {}, h("strong", {}, "Say it first: "), f.oral.content.text));
  if (f.frames.content.items.length)
    nodes.push(h("div", {}, h("strong", {}, "Sentence frames"), ul(f.frames.content.items)));
  if (f.vocab.content.items.length)
    nodes.push(
      h(
        "div",
        { class: "st-ll-chips", role: "group", "aria-label": "Word bank" },
        f.vocab.content.items.map((w) =>
          h(
            "button",
            {
              type: "button",
              class: "st-ll-btn st-ll-btn-small",
              onclick: () => speak(w),
              title: `Hear ${w}`,
            },
            w,
          ),
        ),
      ),
    );
  const vis = f.visual.support.visual;
  if (vis) nodes.push(visualBox(vis));
  if (f.structure.content.text)
    nodes.push(
      h(
        "details",
        {},
        h("summary", { class: "st-ll-link" }, "Show a hint"),
        h("p", {}, f.structure.content.text),
      ),
    );
  return h("div", { class: "st-ll-supports" }, nodes);
}

export function activitiesPanel(ctx) {
  const { pack, shell, state } = ctx;
  const wrap = section("Interactive activities");
  const acts = pack.activities || [];
  if (!acts.length)
    return (
      wrap.appendChild(
        h("p", { class: "st-ll-muted" }, "This lesson has no interactive activities attached."),
      ) && wrap
    );
  wrap.append(
    h(
      "p",
      { class: "st-ll-muted" },
      "Preview an activity yourself, run it for students, project it, or copy a student link. Pick the support level first; the learning goal stays the same.",
    ),
  );
  for (const a of acts) {
    const meta = ctx.activityMeta[a.id] || {};
    const sel = h(
      "select",
      { id: `st-ll-tier-${a.id}`, class: "st-ll-input" },
      TIERS.map((t) => h("option", { value: t.id }, `${t.short} (${t.levels})`)),
    );
    sel.value = state.activityTier[a.id] || state.tiers.Writing || "dev";
    sel.addEventListener("change", () => {
      state.activityTier[a.id] = sel.value;
    });
    const open = (mode) => () => {
      if (typeof shell?.openActivity === "function")
        shell.openActivity(a.id, { tier: sel.value, mode });
      else window.open(ctx.playUrl(a.id, sel.value, mode === "projector"), "_blank", "noopener");
    };
    wrap.append(
      h(
        "article",
        { class: "st-ll-item" },
        h("p", {}, meta.title || humanize(a.id)),
        h(
          "p",
          { class: "st-ll-muted" },
          [ENGINE_LABEL[a.engine] || a.engine, meta.minutes ? `${meta.minutes} minutes` : ""]
            .filter(Boolean)
            .join(" | "),
        ),
        h("label", { for: sel.id }, "Support level"),
        sel,
        h(
          "div",
          { class: "st-ll-row", style: "margin-top:var(--s-3)" },
          btn("Preview", open("preview"), { title: `Preview ${meta.title || a.id} as a teacher` }),
          btn("Student mode", open("student"), { kind: "primary" }),
          btn("Project", open("projector")),
          btn("Copy student link", () =>
            copyWithNotice(ctx.playUrl(a.id, sel.value, false, true), "Student link"),
          ),
        ),
      ),
    );
  }
  return wrap;
}

export function printablesPanel(ctx) {
  const { pack, state } = ctx;
  const wrap = section("Printable resources");
  const ids = pack.printables || [];
  if (!ids.length)
    return (
      wrap.appendChild(
        h("p", { class: "st-ll-muted" }, "No printables are listed for this lesson."),
      ) && wrap
    );
  wrap.append(
    h(
      "p",
      { class: "st-ll-muted" },
      "Each one opens in the Resource Studio, filled from this lesson. Student copies never include answers.",
    ),
  );
  wrap.append(
    h(
      "ul",
      { class: "st-ll-reslist" },
      ids.map((p) =>
        h(
          "li",
          {},
          h(
            "a",
            {
              class: "st-ll-btn",
              href: `#/create?type=${encodeURIComponent(p)}&lesson=${encodeURIComponent(pack.id)}`,
            },
            `${PRINT_LABEL[p] || humanize(p)}: make a student copy`,
          ),
        ),
      ),
    ),
  );
  if (state.teacher && pack.answerKey)
    wrap.append(
      h(
        "div",
        { class: "st-ll-teacher" },
        h("h4", {}, "Teacher view: teacher copy"),
        h(
          "a",
          {
            class: "st-ll-btn",
            href: `#/create?type=answer-key&lesson=${encodeURIComponent(pack.id)}`,
          },
          "Make a copy with the answer key",
        ),
      ),
    );
  return wrap;
}

/** Language demands -> supports, activities that fit, and what the Lens finds in the lesson's own text. */
export function languagePanel(ctx) {
  const { pack, state } = ctx;
  const d = pack.languageDemands || {};
  const wrap = section("Lesson-to-language connection");
  wrap.append(
    h(
      "p",
      { class: "st-ll-muted" },
      "The language this lesson asks of students, with the supports that match it. The support level follows your Scaffold Slider settings.",
    ),
  );
  wrap.append(
    kvList([
      ["Language functions", (d.functions || []).join("; ")],
      ["Structures", (d.structures || []).join("; ")],
      ["Discourse", d.discourse],
      ["Possible barriers", (d.barriers || []).join("; ")],
      ["Oral rehearsal", (d.oralRehearse || []).join("; ")],
      ["Writing scaffold", d.writeScaffold],
    ]),
  );
  const found = analyzeLanguage((d.functions || []).join(". "), {});
  const matched = found.functions
    .slice(0, 2)
    .map((f) => FUNCTIONS.find((x) => x.id === f.id))
    .filter(Boolean);
  const supports = h("div", {});
  for (const f of matched) {
    const tier = state.tiers.Writing;
    supports.append(
      h(
        "div",
        { class: "st-ll-item" },
        h("p", {}, `${f.label}: frame at ${tierShort[tier]}`),
        ul(f.frames[tier]),
        h("p", { class: "st-ll-muted" }, `Oral rehearsal: students ${f.discourse}.`),
      ),
    );
  }
  if (matched.length) wrap.append(h("h3", {}, "Suggested supports"), supports);
  const engines = new Set(matched.flatMap((f) => f.engines));
  const fits = (pack.activities || []).filter((a) => engines.has(a.engine));
  if (fits.length)
    wrap.append(
      h("h3", {}, "Activities that fit this language"),
      ul(
        fits.map(
          (a) =>
            `${ctx.activityMeta[a.id]?.title || humanize(a.id)} (${ENGINE_LABEL[a.engine] || a.engine})`,
        ),
      ),
    );
  const a = analyzeLesson(pack, { terms: ctx.terms });
  const heavy = a.bySection.slice(0, 3);
  wrap.append(
    h("h3", {}, "What the Language Lens finds in the lesson text"),
    h(
      "p",
      { class: "st-ll-muted" },
      "This describes the language of the student-facing text. It does not measure how hard the idea is.",
    ),
    ul([
      `Language load: ${a.languageLoad.level}. ${a.languageLoad.drivers[0]}`,
      `Most language-heavy sections: ${heavy.map((s) => `${s.section} (${s.load})`).join(", ")}.`,
      a.detectedNotDeclared.length
        ? `Also seen in the text but not named above: ${a.detectedNotDeclared.join(", ")}.`
        : "The functions named above match what the text asks.",
    ]),
    h(
      "p",
      {},
      h(
        "a",
        { class: "st-ll-btn", href: `#/lens?lesson=${encodeURIComponent(pack.id)}` },
        "Open the full Language Lens plan",
      ),
    ),
  );
  return wrap;
}

export function resourcesDrawer(ctx, go) {
  const { pack, state } = ctx;
  const rows = [
    ["Launch", "launch"],
    ["Teach", "teach"],
    ["Guided practice", "guided"],
    ["Collaborate", "collaborate"],
    ["Independent practice", "independent"],
    ["Check and exit ticket", "check"],
    ["Extension and home language", "extend"],
    ["Teach it three ways", "threeways"],
    ["Visual vocabulary", "vocab"],
    ["Scaffold slider", "differentiate"],
    ["Interactive activities", "activities"],
    ["Printable resources", "printables"],
    ["Language connection", "language"],
  ];
  const teacherRows = state.teacher
    ? [
        ["Answer key", "check"],
        ["Teacher notes", "teach"],
      ]
    : [];
  return h(
    "details",
    { class: "st-ll-drawer st-ll-card" },
    h("summary", {}, "All resources in this lesson"),
    h(
      "ul",
      { class: "st-ll-reslist", style: "margin-top:var(--s-2)" },
      [...rows, ...teacherRows].map(([label, pane]) =>
        h(
          "li",
          {},
          btn(
            label,
            () => {
              go(pane);
              announce(`${label} opened.`);
            },
            { small: true },
          ),
        ),
      ),
    ),
    h(
      "p",
      { class: "st-ll-muted" },
      `${(pack.activities || []).length} activities, ${(pack.printables || []).length} printables, ${(pack.guided || []).length} guided items.`,
    ),
  );
}

export { TIER_IDS };
