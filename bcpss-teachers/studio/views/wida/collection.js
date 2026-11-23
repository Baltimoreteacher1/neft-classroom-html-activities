// One WIDA practice collection, teacher page: launch (with supports or independent), in-page teacher preview,
// tasks with supports at the chosen level, teacher guide and the frames for its language use.
import { renderActionBar } from "../../core/actions.js";
import { h } from "../../core/dom.js";
import { gradeLabel } from "../../core/ui.js";
import { SUBJECT_PROFILE, TIERS } from "../../data/taxonomy.js";
import { answerText } from "../../engines/wida/check.js";
import { FRAMING, playLink, tierShort } from "./data.js";
import { evidenceSection } from "./evidence.js";
import { framesPanel } from "./frames.js";

const TYPE_LABEL = {
  "listen-select": "Listen and choose",
  "listen-sequence": "Listen and order",
  "listen-label": "Listen and label",
  "listen-notes": "Listen and take notes",
  "speak-describe": "Describe aloud",
  "speak-explain": "Explain aloud",
  "speak-compare": "Compare aloud",
  "speak-argue": "Argue aloud",
  "read-select": "Read and choose",
  "read-evidence": "Read and find evidence",
  "read-sort": "Read and sort",
  "read-multitext": "Compare two texts",
  "write-expand": "Expand a sentence",
  "write-explain": "Write an explanation",
  "write-paragraph": "Write a paragraph",
  "write-revise": "Write and revise",
};

const list = (items, cls) =>
  items?.length
    ? h(
        "ul",
        { class: cls },
        items.map((x) => h("li", {}, x)),
      )
    : null;

function supportBlock(s) {
  if (!s) return null;
  const parts = [
    s.directions ? h("p", {}, s.directions) : null,
    s.oral ? h("p", {}, h("strong", {}, "Say it first: "), s.oral) : null,
    s.frames?.length
      ? h(
          "ul",
          { class: "st-wida-frame-list", "aria-label": "Sentence frames" },
          s.frames.map((f) => h("li", {}, f)),
        )
      : null,
    s.wordBank?.length
      ? h(
          "p",
          { class: "st-wida-connectors" },
          s.wordBank.map((w) => h("span", { class: "st-chip st-chip-plain" }, w)),
        )
      : null,
    s.hint ? h("p", { class: "st-hint" }, s.hint) : null,
  ].filter(Boolean);
  return parts.length
    ? h("div", { class: "st-wida-support" }, parts)
    : h(
        "p",
        { class: "st-hint" },
        "No added supports at this level. Students work from the prompt alone.",
      );
}

async function visualNode(spec) {
  const box = h("figure", { class: "st-wida-visual" });
  try {
    const { renderVisual } = await import("../../core/visuals.js");
    box.innerHTML = renderVisual(spec);
  } catch {
    box.append(h("figcaption", {}, `Picture: ${spec.alt}`));
  }
  return box;
}

function taskItem(t, i, tier) {
  const answer = (() => {
    try {
      return answerText(t);
    } catch {
      return "";
    }
  })();
  const li = h(
    "li",
    { class: "st-card st-wida-task" },
    h("h3", {}, `${i + 1}. ${t.title}`),
    h(
      "p",
      { class: "st-meta" },
      h("span", { class: "st-chip" }, TYPE_LABEL[t.type] || t.type),
      t.klu ? h("span", { class: "st-chip st-chip-plain" }, t.klu) : null,
    ),
    h("p", {}, t.prompt),
    h("h4", {}, `Supports at ${tierShort(tier)}`),
    supportBlock(t.supports?.[tier]),
  );
  if (t.visual) visualNode(t.visual).then((n) => li.querySelector("p:nth-of-type(2)")?.after(n));
  const notes = [
    t.audio?.transcript
      ? h("div", {}, h("h4", {}, "Audio transcript"), h("p", {}, t.audio.transcript))
      : null,
    answer ? h("div", {}, h("h4", {}, "Answer"), h("p", {}, answer)) : null,
    t.explain ? h("div", {}, h("h4", {}, "Why"), h("p", {}, t.explain)) : null,
    t.teacherNote ? h("div", {}, h("h4", {}, "Teacher note"), h("p", {}, t.teacherNote)) : null,
  ].filter(Boolean);
  if (notes.length)
    li.append(
      h(
        "details",
        { class: "st-wida-teacher" },
        h("summary", {}, "Teacher box: transcript and answers"),
        ...notes,
      ),
    );
  return li;
}

function guide(g) {
  if (!g) return null;
  const sec = (title, body) =>
    body ? h("section", { class: "st-wida-guide-part" }, h("h3", {}, title), body) : null;
  return h(
    "section",
    { "aria-labelledby": "st-wida-guide-h" },
    h("h2", { id: "st-wida-guide-h" }, "Teacher guide"),
    g.purpose ? h("p", {}, g.purpose) : null,
    h(
      "div",
      { class: "st-wida-guide" },
      sec("Language focus", list(g.languageFocus)),
      sec("Before", list(g.before)),
      sec("During", list(g.during)),
      sec("After", list(g.after)),
      sec(
        "Common challenges",
        g.commonChallenges?.length
          ? h(
              "ul",
              {},
              g.commonChallenges.map((c) => h("li", {}, h("strong", {}, c.challenge), " ", c.move)),
            )
          : null,
      ),
      sec(
        "By support level",
        g.differentiation
          ? h(
              "ul",
              {},
              TIERS.map((t) =>
                h("li", {}, h("strong", {}, `${t.short}: `), g.differentiation[t.id] || ""),
              ),
            )
          : null,
      ),
      sec("Independent practice", g.independentPractice ? h("p", {}, g.independentPractice) : null),
      sec(
        "Feedback sheet",
        g.feedbackRubric
          ? h(
              "ul",
              {},
              g.feedbackRubric.criteria.map((c) =>
                h("li", {}, h("strong", {}, `${c.label}: `), c.lookFor, " Next step: ", c.nextStep),
              ),
            )
          : null,
      ),
    ),
  );
}

export function renderCollection({ root, params, shell, collection: c, data }) {
  let tier = ["ee", "dev", "exp", "br"].includes(params.tier) ? params.tier : "dev";
  let previewCtx = null;
  const tierHost = h("div", {
    class: "st-wida-pills",
    role: "group",
    "aria-label": "Support level",
  });
  const launch = h("div", { class: "st-row st-wida-launch" });
  const supportsHost = h("div", {});
  const tasksHost = h("ol", { class: "st-wida-tasks" });
  const framesHost = h("div", {});
  const previewHost = h("section", {
    class: "st-wida-preview",
    "aria-label": "Teacher preview",
    hidden: true,
  });
  const klu = c.klus?.[0] || "Explain";

  const paintLaunch = () => {
    const open = (independent) =>
      window.open(
        playLink(shell, c.id, { tier, independent, lessonId: c.lessonId }),
        "_blank",
        "noopener",
      );
    const withSupports = h(
      "button",
      { class: "st-btn st-btn-primary", type: "button" },
      `Start with supports (${tierShort(tier)})`,
    );
    withSupports.addEventListener("click", () => open(false));
    const independent = h(
      "button",
      { class: "st-btn", type: "button" },
      "Start independent practice",
    );
    independent.addEventListener("click", () => open(true));
    const preview = h(
      "button",
      { class: "st-btn", type: "button", "aria-expanded": String(!previewHost.hidden) },
      previewHost.hidden ? "Preview here as a teacher" : "Close preview",
    );
    preview.addEventListener("click", async () => {
      if (!previewHost.hidden) {
        previewHost.hidden = true;
        previewHost.replaceChildren();
        previewCtx = null;
        paintLaunch();
        return;
      }
      previewHost.hidden = false;
      previewHost.replaceChildren(h("p", { role: "status" }, "Loading preview"));
      try {
        const { mountActivity } = await import("../../engines/engine-core.js");
        const mount = h("div", { class: "st-wida-mount" });
        previewHost.replaceChildren(
          h(
            "p",
            { class: "st-hint" },
            "Teacher preview. Nothing is recorded and no evidence code is made.",
          ),
          mount,
        );
        previewCtx = await mountActivity({
          root: mount,
          activity: c,
          tier,
          mode: "preview",
          lessonId: c.lessonId,
        });
        shell.announce("Teacher preview opened.");
      } catch (err) {
        console.warn("[studio] wida preview failed", err);
        previewHost.replaceChildren(
          h(
            "p",
            { class: "st-error", role: "alert" },
            "The preview could not start. Try again, or use Start with supports to open the student view.",
          ),
        );
      }
      paintLaunch();
    });
    launch.replaceChildren(withSupports, independent, preview);
  };

  const paintTier = () => {
    tierHost.replaceChildren(
      ...TIERS.map((t) => {
        const b = h(
          "button",
          {
            class: "st-btn st-wida-pill",
            type: "button",
            "aria-pressed": String(t.id === tier),
            title: t.levels,
          },
          t.short,
        );
        b.addEventListener("click", () => {
          tier = t.id;
          paintTier();
          paintBody();
          previewCtx?.setTier(tier);
          shell.replaceHash(
            `#/wida/${encodeURIComponent(c.id)}${tier === "dev" ? "" : `?tier=${tier}`}`,
          );
          tierHost.querySelector('[aria-pressed="true"]')?.focus();
        });
        return b;
      }),
    );
  };
  const paintBody = () => {
    paintLaunch();
    supportsHost.replaceChildren(
      h("h2", {}, `Supports for the whole collection at ${tierShort(tier)}`),
      supportBlock(c.supports?.[tier]),
    );
    tasksHost.replaceChildren(...c.tasks.map((t, i) => taskItem(t, i, tier)));
    framesHost.replaceChildren(framesPanel({ klu, tier, shell }));
  };

  root.append(
    h("p", {}, h("a", { href: "#/wida" }, "All WIDA practice")),
    h("h1", {}, c.title),
    h(
      "p",
      { class: "st-meta" },
      h("span", { class: "st-chip st-wida-domain-chip", "data-domain": c.domain }, c.domain),
      h("span", { class: "st-chip st-chip-plain" }, gradeLabel(c.grade)),
      h("span", { class: "st-chip st-chip-plain" }, SUBJECT_PROFILE[c.subject]?.short || c.subject),
      c.klus.map((k) => h("span", { class: "st-chip st-chip-plain" }, k)),
      c.minutes
        ? h("span", { class: "st-chip st-chip-plain" }, `About ${c.minutes} min, untimed`)
        : null,
      h("span", { class: "st-chip st-chip-plain" }, "Teacher review recommended"),
    ),
    c.intro ? h("p", { class: "st-lede" }, c.intro) : null,
    h("p", { class: "st-wida-framing", role: "note" }, FRAMING),
    h(
      "div",
      { class: "st-field" },
      h("span", { class: "st-legend" }, "Support level"),
      tierHost,
      h(
        "p",
        { class: "st-hint" },
        "Supports change language access, never the task or the answer.",
      ),
    ),
    launch,
    renderActionBar(
      { kind: "wida", id: c.id, title: c.title, grade: c.grade, subject: c.subject },
      shell,
      { activityId: c.id, tier, lessonId: c.lessonId },
    ),
    previewHost,
    h(
      "section",
      { "aria-labelledby": "st-wida-sc-h" },
      h("h2", { id: "st-wida-sc-h" }, "Success criteria"),
      list(c.successCriteria),
    ),
    supportsHost,
    c.standards?.length
      ? h(
          "p",
          { class: "st-standards" },
          h("strong", {}, "Standards: "),
          c.standards.map((s) => h("code", {}, s)),
        )
      : null,
    h(
      "section",
      { "aria-labelledby": "st-wida-tasks-h" },
      h("h2", { id: "st-wida-tasks-h" }, `Tasks (${c.tasks.length})`),
      tasksHost,
    ),
    guide(c.teacherGuide),
    framesHost,
    evidenceSection({ shell, domainOf: data.index.domainOf }),
    c.curriculum?.note ? h("p", { class: "st-hint" }, c.curriculum.note) : null,
    h("p", { class: "st-wida-disclaimer" }, c.scoring?.note || ""),
  );
  paintTier();
  paintBody();
  return () => {
    previewCtx = null;
  };
}
