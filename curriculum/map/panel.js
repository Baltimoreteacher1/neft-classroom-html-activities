/* =============================================================================
 * panel.js — Act 2. "They are not failing X, they are failing Y underneath it."
 * -----------------------------------------------------------------------------
 * Everything is built with createElement/textContent rather than innerHTML, so
 * no string from the data file or from an API response is ever parsed as markup.
 * ========================================================================== */

import { domainStyle, traceBack, traceForward } from "./data.js";

const DEPTH_LABEL = [
  "",
  "Directly underneath",
  "Two layers under",
  "Three layers under",
  "Four layers under",
];

const CATEGORY_ORDER = ["Lesson", "Readiness", "Project"];

const COVERAGE_ROWS = [
  { key: "l0", name: "Level 0 · extra support", flag: "no-level-0" },
  { key: "l1", name: "Level 1 · support", flag: null },
  { key: "l2", name: "Level 2 · enrichment", flag: "no-enrichment" },
];

const FLAG_MESSAGE = {
  "no-level-0": "No extra-support version yet",
  "no-enrichment": "No enrichment version yet",
};

function el(tag, props, children) {
  const node = document.createElement(tag);
  if (props) {
    for (const [k, v] of Object.entries(props)) {
      if (v === null || v === undefined || v === false) continue;
      if (k === "class") node.className = v;
      else if (k === "text") node.textContent = v;
      else if (k === "html") throw new Error("panel.js never injects markup");
      else if (k.startsWith("on") && typeof v === "function") node.addEventListener(k.slice(2), v);
      else node.setAttribute(k, v === true ? "" : String(v));
    }
  }
  for (const child of children || []) {
    if (child) node.appendChild(child);
  }
  return node;
}

function section(title, hint, children) {
  return el("section", { class: "pnl-section" }, [
    el("h3", { class: "pnl-h3", text: title }),
    hint ? el("p", { class: "pnl-hint", text: hint }) : null,
    ...children,
  ]);
}

function strengthChip(strength, strengths) {
  return el("span", {
    class: `chip chip-${strength}`,
    text: strength,
    title: strengths[strength] || strength,
  });
}

function standardButton(node, onOpen, extraClass) {
  const style = domainStyle(node.domain);
  const b = el("button", {
    type: "button",
    class: `std-link ${extraClass || ""}`.trim(),
    onclick: () => onOpen(node.id),
  });
  b.style.setProperty("--dot", style.ink);
  b.appendChild(el("span", { class: "std-link-id", text: node.id }));
  b.appendChild(el("span", { class: "std-link-name", text: node.shortLabel || node.label }));
  return b;
}

function traceSection(model, node, onOpen) {
  const steps = traceBack(model, node.id, 4);
  if (!steps.length) {
    return section(
      "Trace the cause",
      "Nothing in the Grade 6 graph sits underneath this standard.",
      [
        el("p", {
          class: "pnl-empty",
          text: `${node.id} is a foundation. If students are stuck here, the gap is earlier than Grade 6 — start with the Get Ready resources below.`,
        }),
      ],
    );
  }

  const list = el("ol", { class: "trace" }, []);
  let lastDepth = 0;
  for (const step of steps) {
    if (step.depth !== lastDepth) {
      lastDepth = step.depth;
      list.appendChild(
        el("li", { class: "trace-tier", "aria-hidden": "true" }, [
          el("span", { text: DEPTH_LABEL[step.depth] || `${step.depth} layers under` }),
        ]),
      );
    }
    list.appendChild(
      el("li", { class: "trace-step", "data-strength": step.strength }, [
        el("div", { class: "trace-rail" }, [el("span", { class: "trace-dot" })]),
        el("div", { class: "trace-card" }, [
          el("div", { class: "trace-top" }, [
            standardButton(step.node, onOpen, "std-link-lg"),
            strengthChip(step.strength, model.strengths),
          ]),
          step.why ? el("p", { class: "trace-why", text: step.why }) : null,
          el("p", {
            class: "trace-via",
            text: `Feeds ${step.via.id} · ${step.via.shortLabel || step.via.label}`,
          }),
        ]),
      ]),
    );
  }

  return section(
    "Trace the cause",
    `Work down this chain until you find the first thing that is not solid. A student stuck on ${node.id} is usually stuck on something below it.`,
    [list],
  );
}

function unlocksSection(model, node, onOpen) {
  const steps = traceForward(model, node.id, 2);
  if (!steps.length) {
    return section("What this unlocks", null, [
      el("p", {
        class: "pnl-empty",
        text: "Nothing downstream depends on this one — it is a culminating standard for the year.",
      }),
    ]);
  }
  const wrap = el("ul", { class: "unlocks" }, []);
  for (const step of steps) {
    wrap.appendChild(
      el("li", { class: `unlock-step depth-${step.depth}` }, [
        standardButton(step.node, onOpen),
        el("span", { class: "unlock-depth", text: step.depth === 1 ? "next" : "then" }),
      ]),
    );
  }
  return section("What this unlocks", "Two steps forward from here.", [wrap]);
}

function misconceptionSection(model, node) {
  const tags = (node.misconceptions || []).map((t) => model.misconceptions[t]).filter(Boolean);
  if (!tags.length) {
    return section("Watch for", null, [
      el("p", { class: "pnl-empty", text: "No tagged misconception for this standard yet." }),
    ]);
  }
  const list = el("ul", { class: "misc-list" }, []);
  for (const m of tags) {
    list.appendChild(
      el("li", { class: "misc-item" }, [
        el("p", { class: "misc-label", text: m.label }),
        el("p", { class: "misc-watch", text: m.watchFor }),
        m.labelEs ? el("p", { class: "misc-es", lang: "es", text: m.labelEs }) : null,
      ]),
    );
  }
  return section("Watch for", "The specific wrong move this standard produces.", [list]);
}

function assetSection(node) {
  const assets = node.assets || [];
  const count = el("span", {
    class: "pnl-count",
    text: `${node.assetCount || assets.length} resource${(node.assetCount || assets.length) === 1 ? "" : "s"}`,
  });
  if (!assets.length) {
    return section("Teach it with", null, [
      el("p", {
        class: "pnl-empty",
        text: "No resource on the site is tagged to this standard yet.",
      }),
    ]);
  }
  const groups = new Map();
  for (const a of assets) {
    const key = a.category || "Other";
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(a);
  }
  const ordered = [...groups.keys()].sort(
    (a, b) =>
      (CATEGORY_ORDER.indexOf(a) + 1 || 99) - (CATEGORY_ORDER.indexOf(b) + 1 || 99) ||
      a.localeCompare(b),
  );
  const blocks = [];
  for (const key of ordered) {
    const ul = el("ul", { class: "asset-list" }, []);
    for (const a of groups.get(key)) {
      ul.appendChild(
        el("li", {}, [
          el("a", { class: "asset-link", href: a.path }, [
            el("span", { class: "asset-title", text: a.title }),
            el("span", {
              class: "asset-meta",
              text: a.unit ? `Unit ${a.unit}` : a.audience || "",
            }),
          ]),
        ]),
      );
    }
    blocks.push(
      el("div", { class: "asset-group" }, [el("h4", { class: "pnl-h4", text: key }), ul]),
    );
  }
  const head = el("div", { class: "pnl-head-row" }, [count]);
  return section("Teach it with", null, [head, ...blocks]);
}

function coverageSection(node) {
  const cov = node.coverage || { total: 0, l0: 0, l1: 0, l2: 0, flags: [] };
  const max = Math.max(1, cov.l0 || 0, cov.l1 || 0, cov.l2 || 0);
  const bars = el("ul", { class: "cov-list" }, []);
  for (const row of COVERAGE_ROWS) {
    const value = Number(cov[row.key]) || 0;
    const bar = el("span", { class: "cov-bar" }, [el("span", { class: "cov-fill" })]);
    bar.firstChild.style.width = `${Math.round((value / max) * 100)}%`;
    bars.appendChild(
      el("li", { class: `cov-row${value ? "" : " cov-zero"}` }, [
        el("span", { class: "cov-name", text: row.name }),
        bar,
        el("span", { class: "cov-num", text: String(value) }),
      ]),
    );
  }
  const flags = (cov.flags || []).map((f) => FLAG_MESSAGE[f]).filter(Boolean);
  const notes = flags.length
    ? el(
        "ul",
        { class: "cov-flags" },
        flags.map((f) => el("li", { text: f })),
      )
    : null;
  return section("Coverage", `${cov.total || 0} tagged pieces across the differentiated builds.`, [
    bars,
    notes,
  ]);
}

function liveSection(node, pulse) {
  if (!pulse || pulse.suppressed || !pulse.tags || !pulse.tags.length) return null;
  const mine = pulse.tags.filter((t) => (t.standards || []).includes(node.id));
  if (!mine.length) return null;
  const list = el("ul", { class: "live-list" }, []);
  for (const t of mine) {
    list.appendChild(
      el("li", { class: "live-item" }, [
        el("span", { class: "live-share", text: `${Math.round((t.share || 0) * 100)}%` }),
        el("span", { class: "live-label", text: t.label }),
        el("span", { class: "live-count", text: `${t.count} flagged` }),
      ]),
    );
  }
  return section(
    "Live class signal",
    `Share of everything the class got flagged for in the last ${pulse.days} days.`,
    [list],
  );
}

function teacherSection(rows) {
  if (!rows || !rows.length) return null;
  const table = el("table", { class: "tt" }, [
    el("thead", {}, [
      el("tr", {}, [
        el("th", { scope: "col", text: "Lesson" }),
        el("th", { scope: "col", text: "Class" }),
        el("th", { scope: "col", text: "Missed" }),
        el("th", { scope: "col", text: "Students" }),
      ]),
    ]),
  ]);
  const body = el("tbody", {}, []);
  for (const r of rows.slice(0, 10)) {
    body.appendChild(
      el("tr", {}, [
        el("td", {}, [
          el("a", {
            class: "tt-lesson",
            href: `/lessons/${r.lessonSlug}/`,
            text: r.lessonTitle || r.lessonSlug,
          }),
        ]),
        el("td", { text: r.section || "—" }),
        el("td", { text: String((r.misses || 0) + (r.misconceptions || 0)) }),
        el("td", { text: String(r.students || 0) }),
      ]),
    );
  }
  table.appendChild(body);
  return section("Teacher view · last 30 days", "Only you see this — it needs your teacher key.", [
    el("div", { class: "tt-wrap" }, [table]),
  ]);
}

function forgeHref(node, pulse) {
  const tags = node.misconceptions || [];
  if (!tags.length) return `/curriculum/forge/?standard=${encodeURIComponent(node.id)}`;
  let top = tags[0];
  if (pulse && !pulse.suppressed && Array.isArray(pulse.tags)) {
    let best = -1;
    for (const t of pulse.tags) {
      if (tags.includes(t.tag) && (t.count || 0) > best) {
        best = t.count || 0;
        top = t.tag;
      }
    }
  }
  return `/curriculum/forge/?standard=${encodeURIComponent(node.id)}&tag=${encodeURIComponent(top)}`;
}

/** Render the whole detail panel for one standard. */
export function renderPanel(root, model, id, ctx) {
  const node = model.byId.get(id);
  root.textContent = "";
  if (!node) {
    root.appendChild(el("p", { class: "pnl-empty", text: "That standard is not in the map." }));
    return;
  }
  const style = domainStyle(node.domain);
  root.style.setProperty("--accent", style.ink);

  // 13 of the 42 standards have no shortLabel, so their heading and their full
  // text are the same sentence. Print it once.
  const title = node.shortLabel || node.label;
  const full = node.fullText || node.label;

  const head = el("header", { class: "pnl-head" }, [
    el("div", { class: "pnl-chips" }, [
      el("span", { class: "chip chip-domain", text: node.domainName }),
      (node.units || []).length
        ? el("span", {
            class: "chip chip-unit",
            text: `Unit${node.units.length > 1 ? "s" : ""} ${node.units.join(", ")}`,
          })
        : null,
      el("span", { class: "chip chip-depth", text: `Layer ${node.depth}` }),
    ]),
    el("p", { class: "pnl-id", text: node.id }),
    el("h2", { class: "pnl-title", text: title }),
    full === title ? null : el("p", { class: "pnl-full", text: full }),
  ]);

  root.appendChild(head);
  const body = el("div", { class: "pnl-body" }, []);
  body.appendChild(traceSection(model, node, ctx.onOpen));
  const live = liveSection(node, ctx.pulse);
  if (live) body.appendChild(live);
  body.appendChild(unlocksSection(model, node, ctx.onOpen));
  body.appendChild(misconceptionSection(model, node));
  body.appendChild(assetSection(node));
  body.appendChild(coverageSection(node));
  const teacher = teacherSection(ctx.teacherRows);
  if (teacher) body.appendChild(teacher);

  body.appendChild(
    el("a", { class: "forge-btn", href: forgeHref(node, ctx.pulse) }, [
      el("span", { class: "forge-kicker", text: "Build the fix" }),
      el("span", {
        class: "forge-sub",
        text: `Make a targeted re-teach for ${node.id}`,
      }),
    ]),
  );
  root.appendChild(body);
}
