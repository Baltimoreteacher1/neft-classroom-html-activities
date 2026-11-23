// WIDA hub: browse original practice by grade cluster, domain and subject; pick a support level; start a session;
// read class results from pasted evidence codes; open the class pathway and the sentence frames.
import { favoriteButton } from "../../core/actions.js";
import { h } from "../../core/dom.js";
import { SUBJECT_PROFILE, TIERS, widaClusterOf } from "../../data/taxonomy.js";
import { gradeLabel, plural } from "../../core/ui.js";
import {
  CLUSTER_LABEL,
  DOMAIN_NOTE,
  DOMAINS,
  FRAMING,
  WIDA_CLUSTERS,
  facetCounts,
  filterEntries,
  playLink,
  readFilters,
} from "./data.js";
import { evidenceSection } from "./evidence.js";
import { framesPanel } from "./frames.js";

const subjectName = (id) => SUBJECT_PROFILE[id]?.short || id;

function pills({ label, options, value, onPick }) {
  const group = h("div", { class: "st-wida-pills", role: "group", "aria-label": label });
  for (const o of options) {
    const b = h(
      "button",
      {
        class: "st-btn st-wida-pill",
        type: "button",
        "aria-pressed": String(o.id === value),
        "data-id": o.id,
      },
      o.label,
      o.count != null ? h("span", { class: "st-wida-count" }, o.count) : null,
    );
    b.addEventListener("click", () => onPick(o.id === value && o.id !== "" ? "" : o.id));
    group.append(b);
  }
  return group;
}

function card(c, { tier, shell }) {
  const start = h(
    "button",
    { class: "st-btn st-btn-primary", type: "button" },
    "Start practice",
    h("span", { class: "st-sr-only" }, `: ${c.title}`),
  );
  start.addEventListener("click", () =>
    window.open(playLink(shell, c.id, { tier }), "_blank", "noopener"),
  );
  return h(
    "li",
    { class: "st-card st-wida-card", "data-domain": c.domain },
    h(
      "h3",
      { class: "st-card-title" },
      h("a", { class: "st-card-link", href: `#/wida/${encodeURIComponent(c.id)}` }, c.title),
    ),
    h(
      "p",
      { class: "st-meta" },
      h("span", { class: "st-chip st-wida-domain-chip", "data-domain": c.domain }, c.domain),
      h("span", { class: "st-chip st-chip-plain" }, gradeLabel(c.grade)),
      h("span", { class: "st-chip st-chip-plain" }, subjectName(c.subject)),
      c.klus.map((k) => h("span", { class: "st-chip st-chip-plain" }, k)),
    ),
    c.standards.length
      ? h(
          "p",
          { class: "st-standards" },
          c.standards.slice(0, 4).map((s) => h("code", {}, s)),
        )
      : null,
    h(
      "div",
      { class: "st-row st-wida-card-actions" },
      start,
      h("a", { class: "st-btn", href: `#/wida/${encodeURIComponent(c.id)}` }, "Teacher page"),
    ),
    favoriteButton(
      { kind: "wida", id: c.id, title: c.title, grade: c.grade, subject: c.subject },
      shell,
    ),
  );
}

export function renderHub({ root, params, shell, data }) {
  const prefs = shell.prefs.getPrefs();
  const mine = prefs.grade ? widaClusterOf(prefs.grade) : "";
  const fromGrade = data.entries.some((e) => e.cluster === mine) ? mine : "";
  const f = readFilters(params, { cluster: fromGrade });
  const subjects = [...new Set(data.entries.map((e) => e.subject))].sort();

  const sync = () => {
    const q = new URLSearchParams();
    for (const [k, v] of Object.entries(f)) if (v && !(k === "tier" && v === "dev")) q.set(k, v);
    if (!f.cluster && fromGrade) q.set("cluster", "all");
    shell.replaceHash(`#/wida${q.size ? `?${q}` : ""}`);
  };

  const filters = h("section", { class: "st-wida-filters", "aria-label": "Filter practice" });
  const results = h("ul", {
    class: "st-results st-wida-results",
    "aria-label": "WIDA practice collections",
  });
  const status = h("p", { class: "st-wida-status", role: "status", "aria-live": "polite" });
  const framesHost = h("div", { class: "st-wida-frames-host" });
  let klu = "Explain";

  const paintFrames = () => {
    framesHost.replaceChildren(
      framesPanel({
        klu,
        tier: f.tier,
        shell,
        onChange: (k) => {
          klu = k;
          paintFrames();
          framesHost.querySelector("select")?.focus();
        },
      }),
    );
  };
  const paintResults = () => {
    const list = filterEntries(data.entries, f);
    results.replaceChildren(...list.map((c) => card(c, { tier: f.tier, shell })));
    status.textContent = list.length
      ? `${plural(list.length, "collection")} shown.`
      : "No collections match these filters.";
    if (!list.length) {
      const reset = h("button", { class: "st-btn", type: "button" }, "Show all collections");
      reset.addEventListener("click", () => {
        Object.assign(f, { cluster: "", domain: "", subject: "", q: "" });
        paintFilters();
        paintResults();
        sync();
      });
      results.replaceChildren(
        h(
          "li",
          { class: "st-empty" },
          h("h3", {}, "Nothing matches yet"),
          h("p", {}, "Try another grade cluster or domain. More practice is added over time."),
          h("p", { class: "st-row" }, reset),
        ),
      );
    }
    shell.announce(status.textContent);
  };
  const set = (patch) => {
    Object.assign(f, patch);
    paintFilters();
    paintResults();
    if ("tier" in patch) paintFrames();
    sync();
  };
  function paintFilters() {
    const counts = facetCounts(data.entries, f);
    const active = document.activeElement?.closest?.("[data-filter]")?.dataset.filter;
    const search = h("input", {
      id: "st-wida-q",
      type: "search",
      value: f.q,
      placeholder: "Title, standard or language use",
      autocomplete: "off",
    });
    search.addEventListener("input", () => {
      f.q = search.value.slice(0, 80);
      paintResults();
      sync();
    });
    const subj = h(
      "select",
      { id: "st-wida-subject" },
      h("option", { value: "" }, "All subjects"),
      subjects.map((s) => h("option", { value: s, selected: s === f.subject }, subjectName(s))),
    );
    subj.addEventListener("change", () => set({ subject: subj.value }));
    filters.replaceChildren(
      h(
        "div",
        { class: "st-field", "data-filter": "cluster" },
        h("span", { class: "st-legend", id: "st-wida-l1" }, "Grade cluster"),
        pills({
          label: "Grade cluster",
          value: f.cluster,
          onPick: (v) => set({ cluster: v }),
          options: [
            { id: "", label: "All" },
            ...WIDA_CLUSTERS.map((c) => ({
              id: c,
              label: CLUSTER_LABEL[c],
              count: counts.clusters[c],
            })),
          ],
        }),
      ),
      h(
        "div",
        { class: "st-field", "data-filter": "domain" },
        h("span", { class: "st-legend" }, "Domain"),
        pills({
          label: "Domain",
          value: f.domain,
          onPick: (v) => set({ domain: v }),
          options: [
            { id: "", label: "All" },
            ...DOMAINS.map((d) => ({ id: d, label: d, count: counts.domains[d] })),
          ],
        }),
      ),
      h(
        "div",
        { class: "st-field", "data-filter": "tier" },
        h("span", { class: "st-legend" }, "Support level for launch and frames"),
        pills({
          label: "Support level",
          value: f.tier,
          onPick: (v) => v && set({ tier: v }),
          options: TIERS.map((t) => ({ id: t.id, label: t.short })),
        }),
        h(
          "p",
          { class: "st-hint" },
          "Every collection has all four levels. The support level changes language help, never the task.",
        ),
      ),
      h(
        "div",
        { class: "st-wida-row2" },
        h("div", { class: "st-field" }, h("label", { for: "st-wida-subject" }, "Subject"), subj),
        h("div", { class: "st-field" }, h("label", { for: "st-wida-q" }, "Search"), search),
      ),
    );
    if (active)
      filters.querySelector(`[data-filter="${active}"] button[aria-pressed="true"]`)?.focus();
  }

  const domainGuide = h(
    "dl",
    { class: "st-wida-domain-guide" },
    DOMAINS.map((d) => [h("dt", { "data-domain": d }, d), h("dd", {}, DOMAIN_NOTE[d])]),
  );

  root.append(
    h("h1", {}, "WIDA practice"),
    h(
      "p",
      { class: "st-lede" },
      "Original practice for Listening, Speaking, Reading and Writing, written for K-8 classrooms. Pick a grade cluster and domain, choose the support level, and start a session for students.",
    ),
    h("p", { class: "st-wida-framing", role: "note" }, FRAMING),
    h(
      "p",
      { class: "st-row" },
      h("a", { class: "st-btn", href: "#/wida/path" }, "Practice path for a class"),
      h("a", { class: "st-btn", href: "#/classes" }, "My classes"),
    ),
    filters,
    status,
    results,
    h(
      "section",
      { "aria-labelledby": "st-wida-dg" },
      h("h2", { id: "st-wida-dg" }, "The four domains"),
      domainGuide,
    ),
    framesHost,
    evidenceSection({ shell, domainOf: data.index.domainOf }),
  );
  paintFilters();
  paintResults();
  paintFrames();
  if (!data.entries.length) status.textContent = "No WIDA practice is available yet.";
}
