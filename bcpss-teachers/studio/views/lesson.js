// #/lesson/<id>: a flagship lesson pack as one calm sequence. Left rail of phases, one main pane, six top-level actions,
// teacher view behind a toggle (never rendered in student, share or projector views), scaffold slider, projector mode.
import { announce, h } from "../core/dom.js";
import { termsFromCollection } from "../core/lensdata.js";
import { recommendTiersFromClass, resolveTiers } from "../core/scaffold.js";
import { ELD_STANDARDS, SUBJECT_PROFILE, TIERS } from "../data/taxonomy.js";
import {
  activitiesPanel,
  differentiatePanel,
  languagePanel,
  printablesPanel,
  resourcesDrawer,
  supportsFor,
  threeWaysPanel,
  vocabPanel,
} from "./lesson-panels.js";
import {
  btn,
  chip,
  ensureCss,
  getCatalog,
  idFrom,
  optional,
  section,
  stateBox,
  ul,
  visualBox,
} from "./lens-ui.js";

const PHASES = [
  ["launch", "Launch"],
  ["teach", "Teach"],
  ["guided", "Guided practice"],
  ["collaborate", "Collaborate"],
  ["independent", "Independent practice"],
  ["check", "Check / Exit"],
  ["extend", "Extend"],
];
const ACTIONS = [
  [
    "Teach the Lesson",
    "launch",
    ["launch", "teach", "guided", "collaborate", "independent", "extend", "threeways", "language"],
  ],
  ["Visual Vocabulary", "vocab", ["vocab"]],
  ["Differentiate", "differentiate", ["differentiate"]],
  ["Interactive Activities", "activities", ["activities"]],
  ["Printable Resources", "printables", ["printables"]],
  ["Check Understanding", "check", ["check"]],
];
const paragraphs = (v) => (Array.isArray(v) ? v : v ? [v] : []);

function teacherBlock(ctx, title, ...kids) {
  const body = kids.flat().filter(Boolean);
  if (!ctx.state.teacher || !body.length) return null;
  return h("div", { class: "st-ll-teacher" }, h("h4", {}, `Teacher view: ${title}`), ...body);
}

function itemCard(ctx, item, i, { supports = false, choices = false, showAnswer = true } = {}) {
  const t = ctx.state.teacher;
  return h(
    "article",
    { class: "st-ll-item" },
    h("p", {}, `${i + 1}. ${item.prompt}`),
    choices && item.choices ? ul(item.choices) : null,
    supports ? supportsFor(item, ctx.state.tiers) : null,
    t && showAnswer && item.answer != null
      ? h(
          "div",
          { class: "st-ll-teacher" },
          h("h4", {}, "Teacher view: answer"),
          h("p", {}, String(item.answer)),
          item.explain ? h("p", { class: "st-ll-muted" }, item.explain) : null,
          ctx.pack.answerKey?.items?.[item.id]
            ? h(
                "p",
                { class: "st-ll-muted" },
                `Worked answer: ${ctx.pack.answerKey.items[item.id]}`,
              )
            : null,
        )
      : null,
  );
}

const PANES = {
  launch(ctx) {
    const l = ctx.pack.launch || {};
    return section(
      `Launch: ${l.title || ""}`,
      l.visual ? visualBox(l.visual) : null,
      ul(l.prompts || []),
      teacherBlock(ctx, "launch note", l.teacherNote && h("p", {}, l.teacherNote)),
    );
  },
  teach(ctx) {
    const t = ctx.pack.teach || {};
    const n = ctx.pack.teacherNotes || {};
    return section(
      "Teach",
      paragraphs(t.model).map((p) => h("p", {}, p)),
      t.moves?.length ? h("div", {}, h("h3", {}, "Teaching moves"), ul(t.moves)) : null,
      teacherBlock(
        ctx,
        "pacing and misconceptions",
        n.pacing && h("p", {}, `Pacing: ${n.pacing}`),
        n.misconceptions?.length && ul(n.misconceptions),
        n.differentiation && h("p", {}, n.differentiation),
      ),
    );
  },
  guided(ctx) {
    const tiers = ctx.state.tiers;
    const sum = TIERS.filter((t) => Object.values(tiers).includes(t.id))
      .map((t) => t.short)
      .join(", ");
    return section(
      "Guided practice",
      h(
        "p",
        { class: "st-ll-muted" },
        `Supports shown: ${sum}. Change them under Differentiate; the questions stay the same.`,
      ),
      (ctx.pack.guided || []).map((g, i) => itemCard(ctx, g, i, { supports: true })),
    );
  },
  collaborate(ctx) {
    const c = ctx.pack.collaborate || {};
    return section(
      `Collaborate: ${c.title || ""}`,
      h("p", {}, c.task),
      c.roles?.length ? h("p", {}, h("strong", {}, "Roles: "), c.roles.join(", ")) : null,
      (c.discussionCards || []).map((d) =>
        h(
          "article",
          { class: "st-ll-item" },
          h("p", {}, d.prompt),
          d.frame ? h("p", { class: "st-ll-muted" }, `Frame: ${d.frame}`) : null,
        ),
      ),
    );
  },
  independent: (ctx) =>
    section(
      "Independent practice",
      (ctx.pack.independent?.items || []).map((it, i) => itemCard(ctx, it, i, { choices: true })),
    ),
  check(ctx) {
    const p = ctx.pack;
    return section(
      "Check understanding",
      h("h3", {}, "Quick check"),
      (p.formative?.items || []).map((it, i) => itemCard(ctx, it, i)),
      h("h3", {}, "Exit ticket"),
      h("p", {}, p.exitTicket?.prompt),
      (p.exitTicket?.items || []).map((it, i) => itemCard(ctx, it, i)),
      p.exitTicket?.successCriteria?.length
        ? h("div", {}, h("h3", {}, "Success criteria"), ul(p.exitTicket.successCriteria))
        : null,
      teacherBlock(ctx, "answer key notes", p.answerKey?.notes && h("p", {}, p.answerKey.notes)),
    );
  },
  extend(ctx) {
    const { extension: e, homeLanguage: hl } = ctx.pack;
    const es = hl?.es;
    return section(
      "Extend",
      e
        ? h("div", {}, h("h3", {}, e.title), h("p", {}, e.task))
        : h("p", { class: "st-ll-muted" }, "No extension is listed."),
      es
        ? h(
            "div",
            {},
            h("h3", {}, "Home language: Spanish"),
            h("p", {}, es.objective),
            es.vocab?.length
              ? ul(
                  es.vocab.map((v) =>
                    h(
                      "span",
                      {},
                      `${v.en}: ${v.es} `,
                      v.verified ? null : chip("needs review", { tone: "review" }),
                    ),
                  ),
                )
              : null,
            es.familyPrompt ? h("p", {}, es.familyPrompt) : null,
          )
        : null,
    );
  },
  threeways: threeWaysPanel,
  vocab: vocabPanel,
  differentiate: differentiatePanel,
  activities: activitiesPanel,
  printables: printablesPanel,
  language: languagePanel,
};

function curriculumLabel(c = {}) {
  if (c.status === "district-referenced")
    return `District-referenced${c.program ? `: ${c.program}` : ""}`;
  return "Standards-aligned (not tied to a district unit)";
}

function header(ctx) {
  const { pack: p } = ctx;
  const subj = SUBJECT_PROFILE[p.subject]?.short || p.subject;
  const review = p.review?.status !== "approved";
  return h(
    "header",
    {},
    h("p", { class: "st-ll-crumbs" }, h("a", { href: "#/find" }, "Find my lesson"), " / ", subj),
    h("h1", {}, p.title),
    p.subtitle ? h("p", { class: "st-ll-muted" }, p.subtitle) : null,
    h(
      "div",
      { class: "st-ll-chips" },
      chip(p.grade === "K" ? "Kindergarten" : `Grade ${p.grade}`),
      chip(subj),
      p.duration ? chip(`${p.duration} minutes`) : null,
      chip(curriculumLabel(p.curriculum), { title: p.curriculum?.note }),
      review
        ? chip("Teacher review recommended", {
            tone: "review",
            title: "Checked by automated tests only. A teacher has not yet reviewed this resource.",
          })
        : chip("Reviewed", { tone: "ok" }),
      (p.wida?.klus || []).map((k) => chip(k, { title: "WIDA Key Language Use" })),
      (p.wida?.domains || []).map((d) => chip(d, { domain: d })),
      (p.wida?.eld || []).map((e) => chip(e, { title: ELD_STANDARDS[e] || e })),
    ),
    h(
      "div",
      { class: "st-ll-chips", "aria-label": "Standards" },
      (p.standards || []).map((s) => chip(s, { title: ctx.stdText[s] || s })),
    ),
    p.curriculum?.note ? h("p", { class: "st-ll-muted" }, p.curriculum.note) : null,
    h(
      "div",
      { class: "st-ll-banner", role: "note" },
      h("p", {}, h("strong", {}, "Content objective: "), p.contentObjective),
      h("p", {}, h("strong", {}, "Language objective: "), p.languageObjective),
    ),
  );
}

async function actionBar(ctx) {
  const lib = await optional("../core/library.js");
  const pack = ctx.pack;
  const ref = {
    kind: "lesson",
    id: pack.id,
    title: pack.title,
    grade: pack.grade,
    subject: pack.subject,
  };
  const row = h("div", { class: "st-ll-toolbar", role: "toolbar", "aria-label": "Lesson actions" });
  const mod = await optional("../core/actions.js");
  const make = mod?.actionBar || mod?.renderActionBar || mod?.createActionBar;
  if (typeof make === "function") {
    try {
      const el = await make({
        ...ref,
        resource: ref,
        shell: ctx.shell,
        onProjector: () => ctx.toggleProjector(),
      });
      if (el?.nodeType) return el;
    } catch {
      /* use the built-in bar */
    }
  }
  if (lib?.toggleFavorite) {
    const fav = btn(
      "Save to favorites",
      () => {
        const on = lib.toggleFavorite(ref);
        fav.setAttribute("aria-pressed", String(on));
        announce(on ? "Saved to favorites." : "Removed from favorites.");
      },
      { pressed: lib.isFavorite(ref) },
    );
    row.append(fav);
  }
  row.append(
    h(
      "a",
      { class: "st-ll-btn", href: `#/create?lesson=${encodeURIComponent(pack.id)}` },
      "Print or export",
    ),
    btn("Projector", () => ctx.toggleProjector(), { pressed: ctx.state.projector }),
  );
  return row;
}

export async function render({ root, params = {}, shell }) {
  ensureCss();
  const id = idFrom(params);
  const catalog = await getCatalog(shell);
  let pack;
  try {
    pack = await catalog.lesson(id);
  } catch (err) {
    const retry = () => render({ root, params, shell });
    root.replaceChildren(
      stateBox({
        title: "This lesson did not load",
        message: err?.message?.includes("No lesson")
          ? `There is no lesson called "${id}".`
          : "The lesson could not be loaded. Check your connection and try again.",
        retry,
        role: "alert",
      }),
    );
    return undefined;
  }
  shell?.setTitle?.(pack.title);
  const [std, vocab, classesMod, lib] = await Promise.all([
    Promise.resolve(catalog.standards?.()).catch(() => []),
    pack.vocab?.collection
      ? catalog.vocab(pack.vocab.collection).catch(() => null)
      : Promise.resolve(null),
    optional("../core/classes.js"),
    optional("../core/library.js"),
  ]);
  const metas = await Promise.all(
    (pack.activities || []).map((a) => Promise.resolve(catalog.activity?.(a.id)).catch(() => null)),
  );
  const classes = classesMod?.listClasses?.() || [];
  const studentView = ["student", "share"].includes(params.view);
  const state = {
    pane: PANES[params.pane] ? params.pane : "launch",
    teacher: false,
    projector: params.projector === "1" || shell?.prefs?.get?.()?.projector === true,
    tiers: resolveTiers("dev"),
    guidedIndex: 0,
    activityTier: {},
    classId: "",
  };
  const ctx = {
    pack,
    shell,
    state,
    classes,
    vocab,
    stdText: Object.fromEntries((std || []).map((s) => [s.code, s.text])),
    vocabError:
      pack.vocab?.collection && !vocab ? "The vocabulary collection could not be loaded." : "",
    activityMeta: Object.fromEntries((pack.activities || []).map((a, i) => [a.id, metas[i] || {}])),
    terms: vocab ? termsFromCollection(vocab, pack.vocab?.ids) : [],
    recommendation: null,
    playUrl: (aid, tier, projector, absolute) =>
      lib?.playUrl
        ? lib.playUrl(aid, {
            tier,
            lessonId: pack.id,
            projector,
            origin: absolute ? location.origin : "",
          })
        : `/bcpss-teachers/studio/play/#a=${encodeURIComponent(aid)}&t=${tier}&l=${encodeURIComponent(pack.id)}`,
    pickClass(cid, slider) {
      state.classId = cid;
      const cls = classes.find((c) => c.id === cid);
      ctx.recommendation = cls ? recommendTiersFromClass(cls) : null;
      if (ctx.recommendation) {
        slider.setTiers(ctx.recommendation.perDomain);
        state.tiers = ctx.recommendation.perDomain;
        announce(ctx.recommendation.rationale);
      }
      paint();
    },
    toggleProjector() {
      state.projector = !state.projector;
      if (state.projector) state.teacher = false;
      shell?.prefs?.set?.({ projector: state.projector });
      paint();
    },
  };
  if (params.class && classesMod?.getClass?.(params.class)) {
    state.classId = params.class;
    ctx.recommendation = recommendTiersFromClass(classesMod.getClass(params.class));
    state.tiers = ctx.recommendation.perDomain;
  }
  lib?.addRecent?.({
    kind: "lesson",
    id: pack.id,
    title: pack.title,
    grade: pack.grade,
    subject: pack.subject,
  });

  const wrap = h("div", { class: "st-ll" });
  const bar = await actionBar(ctx);
  const go = (pane) => {
    state.pane = pane;
    paint();
    wrap.querySelector(".st-ll-pane")?.focus({ preventScroll: false });
  };
  const rail = () => {
    const idx = PHASES.findIndex(([k]) => k === state.pane);
    const item = ([k, label], i) =>
      h(
        "li",
        {},
        h(
          "button",
          {
            type: "button",
            class: "st-ll-btn st-ll-railbtn",
            "aria-current": k === state.pane ? (idx >= 0 ? "step" : "page") : false,
            onclick: () => go(k),
          },
          h("span", { class: "st-ll-railnum", "aria-hidden": "true" }, String(i + 1)),
          label,
        ),
      );
    return h(
      "nav",
      { class: "st-ll-rail", "aria-label": "Lesson sequence" },
      h("h2", {}, "Lesson sequence"),
      h("ol", {}, PHASES.map(item)),
      h("h2", {}, "Also in this lesson"),
      h(
        "ul",
        {},
        [
          ["threeways", "Teach it three ways"],
          ["language", "Language connection"],
        ].map(([k, label]) =>
          h(
            "li",
            {},
            h(
              "button",
              {
                type: "button",
                class: "st-ll-btn st-ll-railbtn",
                "aria-current": k === state.pane ? "page" : false,
                onclick: () => go(k),
              },
              label,
            ),
          ),
        ),
      ),
    );
  };
  const paint = () => {
    wrap.classList.toggle("st-ll-projector", state.projector);
    const teacherOk = !studentView && !state.projector;
    const actionButtons = h(
      "div",
      { class: "st-ll-actions", role: "group", "aria-label": "Lesson actions" },
      ACTIONS.map(([label, pane, panes]) =>
        btn(label, () => go(pane), { pressed: panes.includes(state.pane) }),
      ),
    );
    const idx = PHASES.findIndex(([k]) => k === state.pane);
    const step =
      idx >= 0
        ? h(
            "div",
            { class: "st-ll-steps" },
            btn("Previous", () => go(PHASES[idx - 1][0]), { disabled: idx === 0 }),
            btn(
              idx === PHASES.length - 1 ? "Back to launch" : `Next: ${PHASES[idx + 1][1]}`,
              () => go(PHASES[(idx + 1) % PHASES.length][0]),
              { kind: "primary" },
            ),
          )
        : null;
    const pane = h(
      "div",
      { class: "st-ll-pane", tabindex: "-1", "aria-label": "Lesson content" },
      PANES[state.pane](ctx),
      step,
    );
    wrap.replaceChildren(
      header(ctx),
      bar,
      h(
        "div",
        { class: "st-ll-toolbar" },
        teacherOk
          ? btn(
              state.teacher ? "Hide teacher view" : "Show teacher view",
              () => {
                state.teacher = !state.teacher;
                paint();
                announce(
                  state.teacher
                    ? "Teacher view on. Answers and notes are visible."
                    : "Teacher view off.",
                );
              },
              {
                pressed: state.teacher,
                title: "Answers and teacher notes appear only in teacher view",
              },
            )
          : null,
        state.projector ? btn("Exit projector mode", () => ctx.toggleProjector()) : null,
        teacherOk
          ? h(
              "span",
              { class: "st-ll-muted" },
              "Answers and notes stay hidden until you turn on teacher view.",
            )
          : null,
      ),
      actionButtons,
      h("div", { class: "st-ll-body" }, state.projector ? null : rail(), pane),
      state.projector ? null : resourcesDrawer(ctx, go),
    );
  };
  paint();
  root.replaceChildren(wrap);
  return () => wrap.remove();
}
