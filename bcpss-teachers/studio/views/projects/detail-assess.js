// Project detail, assessment and language half: rubric, supports by tier, language, reflection, and the print hand-off.
import { h } from "../../core/dom.js";
import { buildHash } from "../../core/router.js";
import { ELD_STANDARDS, TIERS } from "../../data/taxonomy.js";
import { readTier, words } from "./data.js";
import { activityButton, chip, chips, label, para, section, ul } from "./parts.js";

export function rubricSection(p) {
  const criteria = (p.rubric?.criteria || []).map((c) =>
    h(
      "article",
      { class: "st-pj-crit" },
      h("h3", {}, c.label),
      h(
        "ol",
        { class: "st-pj-levels", "aria-label": `Levels for ${c.label}, highest first` },
        [...c.levels]
          .sort((a, b) => b.score - a.score)
          .map((lv) =>
            h(
              "li",
              { "data-score": lv.score },
              h("strong", { class: "st-pj-lvl" }, `${lv.score}. ${lv.label}`),
              h("span", {}, lv.descriptor),
            ),
          ),
      ),
    ),
  );
  return section(
    "rubric",
    "Rubric",
    h(
      "p",
      { class: "st-pj-hint" },
      "Levels describe the work, not the student. Share the rubric with students before they begin.",
    ),
    h("div", { class: "st-pj-crits" }, criteria),
  );
}

/** Supports for one tier at a time. The tier lives in the address (`tier=`) so a link reopens the same level. */
export function supportsSection(p, { tier, shell }) {
  let current = readTier(tier);
  const panel = h("div", {
    class: "st-pj-tier-panel",
    role: "region",
    "aria-live": "polite",
    "aria-label": "Supports for the chosen level",
  });
  const pills = h("div", { class: "st-pj-pills", role: "group", "aria-label": "Support level" });

  const paintPanel = () => {
    const s = p.supports?.[current] || {};
    const fb = p.peerFeedback?.frames?.[current] || [];
    panel.replaceChildren(
      s.directions ? h("p", { class: "st-pj-text" }, s.directions) : null,
      label("Sentence frames"),
      s.frames?.length
        ? ul(s.frames, "st-pj-frames")
        : para(
            "No frames at this level. Students write in their own words and check the directions above.",
          ),
      label("Word bank"),
      chips(s.wordBank) || para("No word bank at this level."),
      s.oral ? [label("Say it first"), para(s.oral)] : null,
      fb.length ? [label("Peer feedback frames"), ul(fb, "st-pj-frames")] : null,
    );
  };
  const paintPills = () => {
    pills.replaceChildren(
      ...TIERS.map((t) => {
        const b = h(
          "button",
          {
            class: "st-btn st-pj-pill",
            type: "button",
            "aria-pressed": String(t.id === current),
            "data-tier": t.id,
          },
          t.short,
        );
        b.addEventListener("click", () => {
          current = t.id;
          paintPills();
          paintPanel();
          shell.replaceHash?.(
            `#/project/${encodeURIComponent(p.id)}${current === "dev" ? "" : `?tier=${current}`}`,
          );
          shell.announce(`Showing supports for ${t.label}.`);
          pills.querySelector('[aria-pressed="true"]')?.focus();
        });
        return b;
      }),
    );
  };
  paintPills();
  paintPanel();
  return section(
    "supports",
    "Supports by level",
    h(
      "p",
      { class: "st-pj-hint" },
      "The task and the rubric stay the same at every level. Supports change the language help: frames, word banks and rehearsal.",
    ),
    pills,
    panel,
  );
}

export function languageSection(p, vocab) {
  const w = p.wida || {};
  const targets = (p.languageTargets || []).map((t) =>
    h(
      "li",
      { class: "st-pj-target" },
      h("h3", {}, t.function),
      h("p", { class: "st-pj-struct" }, t.structure),
      para(t.text),
    ),
  );
  const entries = vocab.entries.map((e) =>
    h(
      "li",
      { class: "st-pj-term" },
      h("strong", {}, e.word),
      e.def ? ` ${e.def}` : "",
      e.example ? h("em", {}, ` Example: ${e.example}`) : null,
    ),
  );
  return section(
    "language",
    "Language",
    h(
      "p",
      { class: "st-meta" },
      (w.klus || []).map((k) => chip(k, { title: "WIDA Key Language Use" })),
      (w.domains || []).map((d) => chip(d)),
      (w.eld || []).map((e) => chip(e, { title: ELD_STANDARDS[e] || e })),
      w.cluster ? chip(`WIDA grade cluster ${w.cluster}`) : null,
    ),
    h(
      "p",
      { class: "st-pj-hint" },
      "WIDA-aligned original practice. Not an official WIDA or ACCESS item, and not a score.",
    ),
    label("Language targets"),
    h("ul", { class: "st-pj-targets" }, targets),
    label("Project vocabulary"),
    entries.length ? h("ul", { class: "st-pj-terms" }, entries) : chips(vocab.ids.map(words)),
    vocab.href
      ? h(
          "p",
          { class: "st-row" },
          h("a", { class: "st-btn", href: vocab.href }, "Open the vocabulary set"),
        )
      : null,
  );
}

export function reflectionSection(p) {
  const pf = p.peerFeedback || {};
  const rv = p.revision || {};
  return section(
    "reflect",
    "Feedback, revision and self-assessment",
    pf.structure?.length ? [label("Peer feedback"), ul(pf.structure)] : null,
    rv.steps?.length
      ? [
          label(`Revision${rv.when ? `: ${rv.when}` : ""}`),
          ul(rv.steps),
          rv.evidence ? para(`Evidence: ${rv.evidence}`) : null,
        ]
      : null,
    p.selfAssessment?.length ? [label("Student self-assessment"), ul(p.selfAssessment)] : null,
  );
}

/** Organizers that Resource Studio can build from a title alone are linked; the rest say why not. */
export async function handoffSection(p, ctx) {
  let templates = null;
  try {
    templates = await import("../../print/templates.js");
  } catch {
    templates = null;
  }
  const input = {
    title: p.title,
    grade: p.grade,
    subject: p.subject,
    tiers: ["dev"],
    lang: "en",
    vis: "full",
  };
  const rows = (p.organizers || []).map((o) => {
    const tpl = templates?.templateById(o.template);
    let note = "";
    if (!tpl) note = "This organizer is not in Resource Studio yet.";
    else {
      try {
        templates.buildDocument(o.template, input);
      } catch (err) {
        note = String(err?.message || "Resource Studio needs a lesson to fill this organizer.");
      }
    }
    const name = tpl?.label || words(o.template);
    const href = buildHash("/create", {
      type: o.template,
      source: "topic",
      title: p.title,
      grade: p.grade,
      subject: p.subject,
    });
    return h(
      "li",
      { class: "st-pj-org" },
      h("strong", {}, name),
      h("span", {}, ` ${o.use}`),
      note
        ? h("span", { class: "st-pj-note" }, ` ${note}`)
        : h(
            "a",
            { class: "st-btn", href },
            "Open in Resource Studio",
            h("span", { class: "st-sr-only" }, `: ${name}`),
          ),
    );
  });
  const tools = (p.tools || []).map((t) => [t, activityButton(t, ctx)]).filter(([, b]) => b);
  const print = h("button", { class: "st-btn st-btn-primary", type: "button" }, "Print this plan");
  print.addEventListener("click", () => window.print());
  return section(
    "handoff",
    "Print and Word hand-off",
    h(
      "p",
      { class: "st-pj-hint" },
      "Print this page for a planning copy. In Resource Studio, each organizer below opens with this project's title, then exports to print or Word.",
    ),
    h(
      "p",
      { class: "st-row" },
      print,
      h("a", { class: "st-btn", href: buildHash("/create") }, "Open Resource Studio"),
    ),
    rows.length
      ? [label("Organizers for this project"), h("ul", { class: "st-pj-orgs" }, rows)]
      : null,
    tools.length
      ? [
          label("Student activities"),
          h(
            "ul",
            { class: "st-pj-orgs" },
            tools.map(([t, b]) =>
              h("li", { class: "st-pj-org" }, b, t.purpose ? h("span", {}, ` ${t.purpose}`) : null),
            ),
          ),
        ]
      : null,
  );
}
