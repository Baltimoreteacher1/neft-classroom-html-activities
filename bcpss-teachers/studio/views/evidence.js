// Class evidence dashboard renderer. Anonymous, class-level, device-local. Statements appear only when at least
// MIN_N attempts support them and always show their n. Nothing here is a score, a prediction or a placement.
import { h } from "../core/dom.js";
import { MIN_N, summarizeEvidence } from "../core/dash.js";
import { classEvidence } from "../core/evidence.js";
import { plural } from "../core/ui.js";

const CAUTION =
  "Class-level patterns from anonymous practice. They are not scores, predictions or placements, and they do not replace your own assessment.";

function moveNode(move) {
  const a = move.action || {};
  const why = h("span", { class: "st-hint" }, ` ${move.why}`);
  if (a.type === "nav") return h("li", {}, h("a", { href: a.hash }, move.label), why);
  if (a.type === "activity") {
    const href = `/bcpss-teachers/studio/play/#a=${encodeURIComponent(a.aid)}&t=${a.tier}&m=${a.mode || "preview"}`;
    return h("li", {}, h("a", { href }, move.label), why);
  }
  return h("li", {}, h("strong", {}, move.label), why);
}

function section(title, ...kids) {
  return h("section", { class: "st-ev-section", "aria-label": title }, h("h3", {}, title), ...kids);
}

function tierRow(byTier) {
  const rows = byTier.filter((t) => t.n > 0);
  if (!rows.length) return null;
  return section(
    "Attempts by support level",
    h(
      "ul",
      { class: "st-list" },
      rows.map((t) => h("li", {}, `${t.label}: ${plural(t.n, "attempt")}`)),
    ),
  );
}

function domainRow(domains) {
  const rows = domains.filter((d) => d.n > 0);
  if (!rows.length) return null;
  return section(
    "Language domains practised",
    h(
      "ul",
      { class: "st-list" },
      rows.map((d) =>
        h("li", {}, `${d.domain}: ${plural(d.n, "attempt")}, ${plural(d.items, "item")}`),
      ),
    ),
  );
}

function tagRow(tags) {
  const rows = tags.filter((t) => t.enough).slice(0, 6);
  if (!rows.length) return null;
  return section(
    "Most-practised ideas",
    h(
      "ul",
      { class: "st-list" },
      rows.map((t) => h("li", {}, `${t.label}: ${plural(t.attempts, "attempt")}`)),
    ),
  );
}

/** Renders the dashboard for one class into `root`. Rejects only on programmer error. */
export async function renderEvidence({ root, classId }) {
  const raw = classEvidence(classId);
  root.replaceChildren();
  if (!raw.length) {
    root.append(
      h(
        "p",
        {},
        "No evidence yet. Students finish an activity, copy the evidence code from the results screen, and you paste the codes above.",
      ),
    );
    return;
  }
  const s = summarizeEvidence(raw);
  const out = [h("p", { class: "st-hint", role: "note" }, CAUTION)];
  out.push(
    h("p", {}, `${plural(s.n, "attempt")} and ${plural(s.items, "item")} recorded on this device.`),
  );
  if (s.n < MIN_N) {
    out.push(
      h(
        "p",
        { class: "st-hint" },
        `Patterns appear after ${MIN_N} attempts, so that no single student shapes what you see.`,
      ),
    );
  }
  if (s.statements.length) {
    out.push(
      section(
        "What the evidence shows",
        h(
          "ul",
          { class: "st-list" },
          s.statements.map((st) => h("li", {}, `${st.text} (n = ${st.n} of ${st.of})`)),
        ),
      ),
    );
  }
  if (s.moves.length)
    out.push(section("Possible next moves", h("ul", { class: "st-list" }, s.moves.map(moveNode))));
  if (s.fade?.text) out.push(section("Supports", h("p", {}, s.fade.text)));
  for (const node of [tierRow(s.byTier), domainRow(s.domains), tagRow(s.tags)])
    if (node) out.push(node);
  if (s.reflections.length) {
    out.push(
      section(
        "Student reflections (anonymous)",
        h(
          "ul",
          { class: "st-list" },
          s.reflections.slice(0, 8).map((r) => h("li", {}, r)),
        ),
      ),
    );
  }
  root.append(...out);
}
