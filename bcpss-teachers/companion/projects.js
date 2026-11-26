// Plan & Respond — "Cross-curricular project": pair this unit with one from another subject and get a five-day project plan
// built from BOTH units' own big questions, goals, words and sentence frames. A pairing from the unit's authored cross-subject
// connections is labelled authored. Any other pairing is the teacher's choice and is labelled so. No alignment is invented.

import { blanks as printBlanks, doc, FOOT, openPrint, unitLine } from "./companion-print.js";
import { blanks, esc, vstate } from "./util.js";

const ID = "projects";
const SUBJECTS = ["ELA", "Math", "Science", "Social Studies"];

const PRODUCTS = [
  [
    "Two-part explainer poster",
    "A poster with one section for each subject and a sentence that connects them.",
  ],
  [
    "Short partner talk",
    "A two-minute talk where each partner covers one subject and both explain the connection.",
  ],
  ["Written explanation", "A paragraph that answers both big questions and uses linking words."],
];

/** A five-day project plan from two unit details. Pure. `link` is the authored connection entry, or null. */
export function buildProject(a, b, link, level = "3_4") {
  const lk = `l${level}`;
  const strand = (d) => ({
    id: d.unit.id,
    subject: d.unit.subject,
    title: d.unit.unit_title,
    question: d.studio.essential_question,
    content: d.studio.can_do.content,
    language: d.studio.can_do.language,
    frame: d.studio.frames[lk]?.[0] || "",
    words: d.studio.vocab.slice(0, 4).map((v) => ({ term: v.term, es: v.es || "", def: v.def })),
  });
  const A = strand(a);
  const B = strand(b);
  const klu = [a.connections?.[0]?.wida_klu, b.connections?.[0]?.wida_klu];
  return {
    title: `${A.title} and ${B.title}`,
    provenance: link ? "authored" : "teacher",
    note: link
      ? link.cross_subject_bridge_note
      : "You chose this pairing. These two units have no authored link, so check that the ideas really connect before you teach it.",
    authoredFrame: link?.unit_example_frame || "",
    strands: [A, B],
    sharedLanguage: klu[0] && klu[0] === klu[1] ? klu[0] : "",
    products: PRODUCTS,
    days: [
      [
        "Launch",
        `Read both big questions aloud. Students guess how the two connect. Preview four words from each unit.`,
      ],
      [
        "Build the words",
        `Use the word cards for both units. Students say each word and use it in a sentence from the frames.`,
      ],
      [
        "Make it",
        `Students draft one section for each subject, then one sentence that connects the two.`,
      ],
      [
        "Rehearse",
        `Practice with the sentence frames. Partners give one specific compliment and one question.`,
      ],
      [
        "Share and reflect",
        `Share the product. Reflect: What did I learn in each subject? What connects them?`,
      ],
    ].map(([title, text]) => ({ title, text, minutes: 40 })),
    looks: [
      [`Content from ${A.subject}`, A.content],
      [`Content from ${B.subject}`, B.content],
      [
        "Connection",
        "Explains how the two ideas relate, using a linking word such as because, so or both.",
      ],
      ["Language", A.language],
      [
        "Working together",
        "Both partners speak and write. They listen and build on each other's ideas.",
      ],
    ],
  };
}

const fetchJson = (url) =>
  fetch(url)
    .then((r) => (r.ok ? r.json() : null))
    .catch(() => null);

/** Called by the tab after the first draw: the authored connections and other-subject units of the same grade. */
export async function load(st, ctx) {
  const vs = vstate(st, ID, {});
  if (vs.loaded) return false;
  vs.loaded = true;
  const unit = ctx.detail.unit;
  const authored = (ctx.detail.cross_subject_transfers || []).map((t) => ({
    id: t.unit_id,
    subject: t.subject,
    title: t.unit_title,
  }));
  const taken = new Set(authored.map((t) => t.id));
  const others = [];
  for (const subject of SUBJECTS.filter((s) => s !== unit.subject)) {
    const q = new URLSearchParams({ grade: unit.grade, subject });
    const j = await fetchJson(`/api/bcpss/units?${q}`);
    for (const u of j?.units || [])
      if (!taken.has(u.id))
        others.push({ id: u.id, subject, title: u.unit_title, number: u.unit_number });
  }
  vs.options = { authored, others };
  return true;
}

export function render(st, detail) {
  const vs = vstate(st, ID, { partnerId: "", partner: null });
  const opts = vs.options;
  const optHtml = opts
    ? `${opts.authored.length ? `<optgroup label="Authored connections">${opts.authored.map((o) => `<option value="${esc(o.id)}" ${o.id === vs.partnerId ? "selected" : ""}>${esc(o.subject)}: ${esc(o.title)}</option>`).join("")}</optgroup>` : ""}${opts.others.length ? `<optgroup label="Same grade, another subject (your pairing)">${opts.others.map((o) => `<option value="${esc(o.id)}" ${o.id === vs.partnerId ? "selected" : ""}>${esc(o.subject)}: ${esc(o.title)}</option>`).join("")}</optgroup>` : ""}`
    : "";
  const plan = vs.partner ? buildProject(detail, vs.partner, vs.link, st.level) : null;
  return `
    <div class="cp-projects">
      <div class="cp-card">
        <h4>Pair this unit with another subject</h4>
        <label class="cp-label" for="cpPartner">Partner unit</label>
        <select id="cpPartner" class="cp-select" data-cp-in="${ID}:partner" ${opts ? "" : "disabled"}>
          <option value="">${opts ? "Choose a unit…" : "Loading units…"}</option>${optHtml}
        </select>
        ${vs.loading ? `<p class="cp-muted" role="status">Loading that unit…</p>` : ""}${vs.error ? `<p class="cp-note cp-note--warn" role="alert">${esc(vs.error)}</p>` : ""}
      </div>
      ${plan ? planHtml(plan) : `<p class="cp-muted">Pick a partner unit to see the project.</p>`}
    </div>`;
}

function planHtml(p) {
  return `
    <div class="cp-card cp-card--lead">
      <p class="cp-eyebrow">${p.provenance === "authored" ? "Authored connection" : "Your pairing"}</p>
      <p class="cp-question">${esc(p.title)}</p>
      <p>${esc(p.note)}</p>
      ${p.authoredFrame ? `<p class="cp-muted">Frame from the connection: ${blanks(p.authoredFrame)}</p>` : ""}
      ${p.sharedLanguage ? `<p class="cp-muted">Both units build the same language use: ${esc(p.sharedLanguage)}.</p>` : ""}
    </div>
    <div class="cp-two">${p.strands
      .map(
        (s) =>
          `<div class="cp-card"><h4>${esc(s.subject)}: ${esc(s.title)}</h4><p><b>Big question:</b> ${esc(s.question)}</p><p><b>Frame:</b> ${blanks(s.frame)}</p><p class="cp-chips">${s.words.map((w) => `<span>${esc(w.term)}${w.es ? ` / ${esc(w.es)}` : ""}</span>`).join("")}</p></div>`,
      )
      .join("")}</div>
    <div class="cp-card"><h4>Product choices</h4><ul class="cp-plain">${p.products.map(([t, d]) => `<li><b>${esc(t)}.</b> ${esc(d)}</li>`).join("")}</ul></div>
    <div class="cp-card"><h4>Five days</h4><ol class="cp-steps">${p.days.map((d) => `<li class="cp-step"><div class="cp-step-head"><b>${esc(d.title)}</b><span>${d.minutes} min</span></div><p>${esc(d.text)}</p></li>`).join("")}</ol></div>
    <div class="cp-card"><h4>Look for</h4><ul class="cp-plain">${p.looks.map(([k, v]) => `<li><b>${esc(k)}:</b> ${esc(v)}</li>`).join("")}</ul></div>
    <div class="cp-actions"><button type="button" class="cp-btn cp-btn--solid" data-cp-act="${ID}:print" data-cp-arg="student">Print the student brief</button><button type="button" class="cp-btn" data-cp-act="${ID}:print" data-cp-arg="teacher">Print the teacher plan</button></div>`;
}

export function act(st, action, arg, ctx) {
  const vs = vstate(st, ID, {});
  if (action === "print" && vs.partner) {
    const plan = buildProject(ctx.detail, vs.partner, vs.link, st.level);
    openPrint(
      projectDoc(plan, ctx.detail.unit, arg === "teacher"),
      `project-${arg}-${ctx.detail.unit.id}.html`,
    );
  }
  return false;
}

/** Selecting a partner fetches that unit. Returns a promise so the tab shows the loading state, then the plan. */
export function input(st, field, value, kind, ctx) {
  if (field !== "partner" || kind !== "change") return false;
  const vs = vstate(st, ID, {});
  vs.partnerId = value;
  vs.partner = null;
  vs.error = "";
  if (!value) return true;
  vs.loading = true;
  const unitId = st.unitId;
  return fetchJson(`/api/bcpss/units/${encodeURIComponent(value)}`).then((d) => {
    if (st.unitId !== unitId || vs.partnerId !== value) return;
    vs.loading = false;
    if (!d?.studio) {
      vs.error = "That unit could not be loaded. Try again.";
      return;
    }
    vs.partner = d;
    vs.link = (ctx.detail.cross_subject_transfers || []).find((t) => t.unit_id === value) || null;
  });
}

const CSS = `.look{border:1pt solid #777;padding:4pt 7pt;margin:0 0 4pt;break-inside:avoid}`;

/** Student brief (driving questions, choices, words, frames, look-fors) or teacher plan (adds the five days). */
export function projectDoc(p, unit, teacher = false) {
  const body = `
    <div class="head"><div><h1>${esc(p.title)}</h1><div class="meta">${unitLine(unit)}${teacher ? " · Teacher plan" : ""}</div></div>${teacher ? "" : `<div class="name">Name <span></span></div>`}</div>
    ${teacher ? `<p><b>${p.provenance === "authored" ? "Authored connection" : "Teacher-chosen pairing"}:</b> ${esc(p.note)}</p>` : ""}
    <h2>Two big questions</h2>${p.strands.map((s) => `<p class="q">${esc(s.subject)}: ${esc(s.question)}</p>`).join("")}
    <h2>Choose your product</h2><ul>${p.products.map(([t, d]) => `<li><b>${esc(t)}.</b> ${esc(d)}</li>`).join("")}</ul>
    <h2>Words to use</h2><div class="words">${p.strands
      .flatMap((s) => s.words)
      .map(
        (w) =>
          `<div class="word"><b>${esc(w.term)}</b>${w.es ? ` <span class="es">(${esc(w.es)})</span>` : ""}<div>${esc(w.def)}</div></div>`,
      )
      .join("")}</div>
    <h2>Sentence frames</h2><ol class="frames">${p.strands.map((s) => `<li>${printBlanks(s.frame)}</li>`).join("")}<li>${printBlanks("One idea from each subject connects because [reason].")}</li></ol>
    ${teacher ? `<h2>Five days</h2>${p.days.map((d, i) => `<div class="step"><h3><span>Day ${i + 1}: ${esc(d.title)}</span><small>${d.minutes} min</small></h3><p>${esc(d.text)}</p></div>`).join("")}` : ""}
    <h2>Look for</h2>${p.looks.map(([k, v]) => `<div class="look"><b>${esc(k)}:</b> ${esc(v)}</div>`).join("")}`;
  return doc(`Project - ${p.title}`, body, FOOT, CSS);
}
