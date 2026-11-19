// Class intelligence panel: the ONE intelligence view of the Teacher Hub's "Review Student Progress" task (and the
// Data Studio's practice-evidence companion). Per WIDA domain it shows what students did, a strength seen in their own
// words, the single next teaching move and a one-click assign; above them, the one move to start with and the students
// to check in with. It follows the hub's grade band and reads only what the hub already holds (see model.js).
import { el } from "../../access-practice-lab/src/class/dom.js";
import { makeI18n } from "../../access-practice-lab/src/i18n.js";
import { BASE } from "../../access-practice-lab/src/util.js";
import { readRoster } from "../roster-store.js";
import {
  SAMPLE_ID,
  assignSpec,
  defaultSource,
  listSources,
  loadSource,
  previewPicks,
} from "./data.js";
import { buildInsight } from "./model.js";
import { copy } from "./wording.js";

const MAX_CHECKINS = 5;
const ICON = {
  Listening: "listening",
  Speaking: "speaking",
  Reading: "reading",
  Writing: "writing",
};
const ACTIVITY_LINKS = {
  evidence: "#classEvidence",
  review: "#accReview",
  live: "#liveClass",
  studio: "/access-teacher/predictive/",
};

// Kept across re-renders: the hub rebuilds its command center on every band or tab change.
const ui = { sourceId: null, lang: "", sample: false, notes: {}, busy: "" };

const urlLang = () => {
  const l = new URLSearchParams(location.search).get("lang");
  return l === "es" || l === "bi" ? l : "en";
};

const icon = (name) => {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("class", "ico");
  svg.setAttribute("aria-hidden", "true");
  svg.setAttribute("focusable", "false");
  const use = document.createElementNS("http://www.w3.org/2000/svg", "use");
  use.setAttribute("href", `${BASE}/pictures/ui-icons.svg#${name}`);
  svg.append(use);
  return svg;
};

/**
 * Mount the panel. `band` is the hub's grade band; `onBand(band)` lets the empty state switch it.
 * Resolves after the first render (tests await it).
 */
export async function mountClassIntelligence(root, { band = "6-8", onBand = null } = {}) {
  if (!ui.lang) ui.lang = urlLang();
  const roster = readRoster();
  const live = el("p", { class: "visually-hidden", role: "status", "aria-live": "polite" });
  let sources = listSources(roster);
  if (ui.sample) sources = [{ id: SAMPLE_ID, kind: "sample" }, ...sources];
  let source = sources.find((s) => s.id === ui.sourceId) || defaultSource(sources);
  ui.sourceId = source?.id || null;
  let focusAfter = "";

  const I = () => makeI18n(ui.lang, "en");
  const sourceLabel = (s, c) =>
    s.kind === "live"
      ? s.title
      : s.kind === "sample"
        ? c.sample.split(".")[0]
        : s.section
          ? c.sources.section(s.section)
          : c.sources.roster;

  async function render(force = false) {
    const c = copy(I().S);
    root.lang = ui.lang === "es" ? "es" : "en";
    root.replaceChildren(el("p", { class: "fine", role: "status" }, c.loading));
    const data = await loadSource(source, { roster, force });
    const insight = buildInsight({
      members: data.members,
      roster: data.roster,
      band: source?.id === SAMPLE_ID ? null : band,
      assignBand: band,
      now: data.now,
    });
    const nodes = [live, header(c)];
    if (!source) nodes.push(emptyStart(c));
    else if (source.kind === "live" && data.members && !data.members.length)
      nodes.push(emptyCard(c.empty.noStudents, c.empty.shareCode, ACTIVITY_LINKS.live));
    else if (!insight.students) nodes.push(noBand(c, data.roster));
    else nodes.push(...(await body(c, insight, data)));
    nodes.push(footer(c));
    root.replaceChildren(...nodes);
    live.textContent = insight.students ? c.summary(insight) : "";
    if (focusAfter) root.querySelector(`[data-assign="${focusAfter}"]`)?.focus();
    focusAfter = "";
  }

  function header(c) {
    const choices = sources.map((s) =>
      el("option", { value: s.id, selected: s.id === source?.id }, sourceLabel(s, c)),
    );
    return el(
      "div",
      { class: "ti-head" },
      el("h3", { id: "tiTitle", tabindex: "-1" }, c.title),
      el("p", { class: "fine" }, c.lead),
      el(
        "div",
        { class: "ti-controls" },
        sources.length
          ? el(
              "label",
              { class: "ti-field", for: "tiSource" },
              el("span", {}, c.classLabel),
              el("select", { id: "tiSource", "data-ti": "source" }, choices),
            )
          : "",
        el(
          "div",
          { class: "ti-lang", role: "group", "aria-label": c.langName },
          ["en", "es"].map((m) =>
            el(
              "button",
              {
                type: "button",
                class: "ti-btn",
                "data-ti-lang": m,
                "aria-pressed": String(ui.lang === m),
                lang: m,
              },
              m === "en" ? "English" : "Español",
            ),
          ),
        ),
        source
          ? el("button", { type: "button", class: "ti-btn", "data-ti": "refresh" }, c.refresh)
          : "",
      ),
      ui.sample && source?.id === SAMPLE_ID
        ? el(
            "p",
            { class: "ti-sample" },
            c.sample,
            " ",
            el("button", { type: "button", class: "ti-link", "data-ti": "leave-sample" }, c.exit),
          )
        : "",
    );
  }

  const emptyCard = (text, label, href) =>
    el(
      "div",
      { class: "ti-empty" },
      el("p", {}, text),
      el("a", { class: "btn btn-primary", href }, label),
    );

  const emptyStart = (c) =>
    el(
      "div",
      { class: "ti-empty" },
      el("h4", {}, c.empty.noneTitle),
      el(
        "ul",
        { class: "ti-actions" },
        el(
          "li",
          {},
          el("a", { class: "btn btn-primary", href: ACTIVITY_LINKS.live }, c.empty.create),
        ),
        el("li", {}, el("a", { class: "btn", href: ACTIVITY_LINKS.evidence }, c.empty.passport)),
        el(
          "li",
          {},
          el("button", { type: "button", class: "btn", "data-ti": "sample" }, c.empty.sample),
        ),
      ),
    );

  function noBand(c, students) {
    const bands = [...new Set(students.map((s) => s.band).filter(Boolean))];
    return el(
      "div",
      { class: "ti-empty" },
      el("p", {}, bands.length ? c.empty.noBand(bands) : c.empty.noStudents),
      onBand && bands.length
        ? el(
            "ul",
            { class: "ti-actions" },
            bands.map((b) =>
              el("li", {}, el("button", { type: "button", class: "btn", "data-ti-band": b }, b)),
            ),
          )
        : "",
    );
  }

  async function body(c, insight, data) {
    const out = [];
    if (data.error) out.push(el("p", { class: "ti-note", role: "status" }, c.empty.offline));
    else if (source.kind === "live" && data.roster.length && !insight.shared)
      out.push(el("p", { class: "ti-note" }, c.empty.noMatch));
    const picks = {};
    await Promise.all(
      insight.domains.map(async (card) => {
        picks[card.domain] = await previewPicks(data.assignments, card.assign);
      }),
    );
    const topCard = insight.top;
    if (topCard) out.push(hero(c, topCard, picks[topCard.domain]));
    out.push(
      el(
        "div",
        { class: "ti-grid" },
        insight.domains.map((card) => domainCard(c, card, picks[card.domain], card === topCard)),
      ),
    );
    out.push(checkIns(c, insight.checkIns));
    return out;
  }

  function assignControls(c, card, picks, primary) {
    const note = ui.notes[card.domain];
    const n = picks.length;
    const cls = primary ? "btn btn-primary" : "btn";
    let action;
    if (!n) action = el("p", { class: "fine" }, c.assign.none);
    else if (source.kind === "live") {
      const label =
        ui.busy === card.domain
          ? c.assign.busy
          : c.assign.toClass(c.assign.activities(n), source.title);
      action = el(
        "button",
        {
          type: "button",
          class: cls,
          "data-assign": card.domain,
          disabled: ui.busy === card.domain,
        },
        label,
      );
    } else {
      action = el(
        "span",
        { class: "ti-pair" },
        el("a", { class: cls, href: picks[0].path, "data-open": card.domain }, c.assign.open),
        el("button", { type: "button", class: "btn", "data-copy": picks[0].path }, c.assign.copy),
      );
    }
    return el(
      "div",
      { class: "ti-assign" },
      action,
      n ? el("p", { class: "fine ti-titles" }, picks.map((p) => p.title).join(" · ")) : "",
      note ? el("p", { class: "ti-note", role: "status" }, note) : "",
    );
  }

  function hero(c, card, picks) {
    const m = c.move(card);
    return el(
      "section",
      { class: `ti-hero d-${card.domain.toLowerCase()}`, "aria-labelledby": "tiNext" },
      el(
        "p",
        { class: "ti-eyebrow", id: "tiNext" },
        icon(ICON[card.domain]),
        `${c.next} · ${c.dom(card.domain)}`,
      ),
      el("p", { class: "ti-hero-title" }, m.title),
      el("p", { class: "ti-why" }, m.why),
      assignControls(c, card, picks, true),
    );
  }

  function domainCard(c, card, picks, isTop) {
    const s = c.strength(card);
    const m = c.move(card);
    return el(
      "article",
      { class: `ti-card d-${card.domain.toLowerCase()}`, "aria-labelledby": `ti-${card.domain}` },
      el("h4", { id: `ti-${card.domain}` }, icon(ICON[card.domain]), c.dom(card.domain)),
      el("p", { class: "ti-label" }, c.didHeading),
      el("p", {}, c.did(card)),
      el("p", { class: "ti-label" }, c.strengthHeading),
      el("p", {}, s.text),
      s.quote
        ? el(
            "blockquote",
            { class: "ti-quote" },
            el("p", { lang: "en" }, `“${s.quote.text}”`),
            el("footer", {}, s.quote.alias),
          )
        : "",
      el("p", { class: "ti-label" }, c.moveHeading),
      el("p", {}, el("strong", {}, m.title)),
      el("p", { class: "fine" }, m.why),
      isTop ? "" : assignControls(c, card, picks, false),
    );
  }

  function checkIns(c, list) {
    const shown = list.slice(0, MAX_CHECKINS);
    const item = (x) => el("li", {}, el("strong", {}, x.alias), " ", c.reason(x.reason));
    return el(
      "section",
      { class: "ti-checkins", "aria-labelledby": "tiCheck" },
      el("h4", { id: "tiCheck" }, c.checkIns),
      list.length
        ? el(
            "div",
            {},
            el("ul", { class: "ti-list" }, shown.map(item)),
            list.length > shown.length
              ? el(
                  "details",
                  {},
                  el("summary", {}, c.more(list.length - shown.length)),
                  el("ul", { class: "ti-list" }, list.slice(MAX_CHECKINS).map(item)),
                )
              : "",
          )
        : el("p", {}, c.checkInsNone),
    );
  }

  function footer(c) {
    const links = [
      ["evidence", ACTIVITY_LINKS.evidence],
      ["review", ACTIVITY_LINKS.review],
      ["live", ACTIVITY_LINKS.live],
      ["studio", ACTIVITY_LINKS.studio],
    ];
    return el(
      "div",
      { class: "ti-foot" },
      el("p", { class: "fine ti-fine" }, c.fine),
      el(
        "nav",
        { class: "ti-deeper", "aria-label": c.deeper },
        el("strong", {}, c.deeper),
        links.map(([k, href]) => el("a", { href }, c.deeperLinks[k])),
      ),
    );
  }

  root.addEventListener("click", async (e) => {
    const t = e.target.closest("[data-ti],[data-ti-lang],[data-ti-band],[data-assign],[data-copy]");
    if (!t) return;
    const c = copy(I().S);
    if (t.dataset.tiLang) {
      ui.lang = t.dataset.tiLang;
      try {
        const u = new URL(location.href);
        u.searchParams.set("lang", ui.lang);
        history.replaceState(history.state, "", u);
      } catch {}
      await render();
      root.querySelector(`[data-ti-lang="${ui.lang}"]`)?.focus();
    } else if (t.dataset.tiBand) onBand?.(t.dataset.tiBand);
    else if (t.dataset.ti === "refresh") await render(true);
    else if (t.dataset.ti === "sample" || t.dataset.ti === "leave-sample") {
      ui.sample = t.dataset.ti === "sample";
      ui.sourceId = ui.sample ? SAMPLE_ID : null;
      sources = listSources(roster);
      if (ui.sample) sources = [{ id: SAMPLE_ID, kind: "sample" }, ...sources];
      source = sources.find((s) => s.id === ui.sourceId) || defaultSource(sources);
      ui.sourceId = source?.id || null;
      await render();
      root.querySelector("#tiTitle")?.focus();
    } else if (t.dataset.copy) {
      try {
        await navigator.clipboard.writeText(new URL(t.dataset.copy, location.origin).href);
        live.textContent = c.assign.copied;
      } catch {
        live.textContent = new URL(t.dataset.copy, location.origin).href;
      }
    } else if (t.dataset.assign && !ui.busy) {
      const domain = t.dataset.assign;
      const card = (await currentInsight()).domains.find((d) => d.domain === domain);
      ui.busy = domain;
      focusAfter = domain;
      await render();
      const res = await assignSpec(source, card.assign);
      ui.busy = "";
      ui.notes[domain] = res.ok
        ? c.assign.added(res.added, source.title)
        : res.error === "nothing-new"
          ? c.assign.none
          : c.assign.failed;
      await render(true);
    }
  });

  root.addEventListener("change", async (e) => {
    if (e.target.dataset?.ti !== "source") return;
    source = sources.find((s) => s.id === e.target.value) || source;
    ui.sourceId = source.id;
    await render();
    root.querySelector("#tiSource")?.focus();
  });

  async function currentInsight() {
    const data = await loadSource(source, { roster });
    return buildInsight({
      members: data.members,
      roster: data.roster,
      band: source.id === SAMPLE_ID ? null : band,
      assignBand: band,
      now: data.now,
    });
  }

  await render();
}

